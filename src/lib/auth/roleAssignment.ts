// ============================================================================
// LOREM CURAE - USER ROLE ASSIGNMENT & ACCESS CONTROL
// ============================================================================
//
// Role Hierarchy (highest to lowest priority):
//   1. founding_member     - Overrides all other roles
//   2. tester_creator      - Creator who opted into testing
//   3. tester_consumer     - Consumer who opted into testing
//   4. creator_c1/c2/c3    - Creator waves (marketplace access)
//   5. consumer_wave_1-7   - Consumer waves (phased rollout)
//   6. user                - Default role (no special access)
//
// ============================================================================

import { SupabaseClient } from "@supabase/supabase-js";
import { onRoleChangedSafe } from "../email/followupTriggers";
import type { UserRole as FollowupUserRole } from "../email/followupTemplates";

// ----------------------------------------------------------------------------
// TYPE DEFINITIONS
// ----------------------------------------------------------------------------

/** Valid user roles in the system */
export type UserRole =
  | "founding_member"
  | "tester_creator"
  | "tester_consumer"
  | "creator_c1"
  | "creator_c2"
  | "creator_c3"
  | `consumer_wave_${1 | 2 | 3 | 4 | 5 | 6 | 7}`
  | "user";

/** Waitlist record from Supabase */
export interface WaitlistRecord {
  wants_tester_access: boolean;
  is_creator: boolean;
  wave_number: number | null;
  creator_wave_number: number | null;
  is_founding_member: boolean;
}

/** User profile with role */
export interface UserProfile {
  role: UserRole;
}

/** Feature flags for UI gating */
export interface FeatureFlags {
  showCreatorTools: boolean;
  showMarketplaceTools: boolean;
  showEarlyFeatures: boolean;
}

// ----------------------------------------------------------------------------
// SECTION 1: ROLE DETERMINATION
// ----------------------------------------------------------------------------

/**
 * Determines the user role based on waitlist record.
 *
 * Priority order:
 *   1. Founding member status (overrides everything)
 *   2. Tester access preference (creator vs consumer)
 *   3. Creator wave assignment (C1, C2, C3)
 *   4. Consumer wave assignment (1-7)
 *   5. Default to "user"
 */
export function determineUserRole(waitlist: WaitlistRecord): UserRole {
  // Priority 1: Founding Members override everything
  if (waitlist.is_founding_member) {
    return "founding_member";
  }

  // Priority 2: Tester segmentation
  if (waitlist.wants_tester_access) {
    return waitlist.is_creator ? "tester_creator" : "tester_consumer";
  }

  // Priority 3: Creator waves (C1, C2, C3)
  if (waitlist.is_creator && waitlist.creator_wave_number) {
    switch (waitlist.creator_wave_number) {
      case 1:
        return "creator_c1";
      case 2:
        return "creator_c2";
      case 3:
        return "creator_c3";
    }
  }

  // Priority 4: Consumer waves (1-7)
  if (waitlist.wave_number) {
    return `consumer_wave_${waitlist.wave_number}` as UserRole;
  }

  // Default: Standard user
  return "user";
}

// ----------------------------------------------------------------------------
// SECTION 2: AUTH CALLBACK - ROLE ASSIGNMENT
// ----------------------------------------------------------------------------

/**
 * Handles post-authentication role assignment.
 *
 * Flow:
 *   1. Fetch waitlist record by email
 *   2. Redirect to /waitlist if no record exists
 *   3. Fetch current role from profiles (if exists)
 *   4. Determine appropriate role
 *   5. Update user profile with assigned role
 *   6. Send follow-up email if role changed (non-founding only)
 */
export async function handleAuthCallback(
  supabase: SupabaseClient,
  user: { id: string; email: string },
  redirect: (path: string) => void
): Promise<void> {
  // Fetch waitlist record with all segmentation fields
  const { data: waitlist } = await supabase
    .from("waitlist")
    .select(
      "wants_tester_access, is_creator, wave_number, creator_wave_number, is_founding_member"
    )
    .eq("email", user.email)
    .maybeSingle();

  // No waitlist record → redirect to signup
  if (!waitlist) {
    redirect("/waitlist");
    return;
  }

  // Fetch current profile to check for role changes
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const oldRole = currentProfile?.role as UserRole | undefined;

  // Determine and assign role
  const role = determineUserRole(waitlist);

  // Persist role to profiles table
  await supabase.from("profiles").update({ role }).eq("id", user.id);

  // Send follow-up email if role changed (and user had a previous role)
  // Note: onRoleChangedSafe will silently skip founding roles
  if (oldRole && oldRole !== role) {
    try {
      await onRoleChangedSafe(
        { email: user.email },
        oldRole as FollowupUserRole,
        role as FollowupUserRole
      );
      console.log(`[roleAssignment] Follow-up email sent: ${oldRole} → ${role}`);
    } catch (err) {
      // Log but don't block auth flow
      console.error("[roleAssignment] Failed to send role change email:", err);
    }
  }
}

// ----------------------------------------------------------------------------
// SECTION 3: UI GATING - FEATURE VISIBILITY
// ----------------------------------------------------------------------------

/**
 * Determines feature visibility based on user role.
 */
export function getFeatureFlags(profile: UserProfile): FeatureFlags {
  const flags: FeatureFlags = {
    showCreatorTools: false,
    showMarketplaceTools: false,
    showEarlyFeatures: false,
  };

  switch (profile.role) {
    case "founding_member":
      flags.showEarlyFeatures = true;
      break;

    case "tester_creator":
      flags.showCreatorTools = true;
      flags.showMarketplaceTools = true;
      break;

    case "creator_c1":
    case "creator_c2":
      flags.showMarketplaceTools = true;
      break;

    case "creator_c3":
      flags.showMarketplaceTools = true;
      flags.showCreatorTools = true; // Phase 8 tools
      break;

    case "tester_consumer":
    default:
      // No special features
      break;
  }

  return flags;
}
