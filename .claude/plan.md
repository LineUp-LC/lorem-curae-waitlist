# Founding Member Creator — Implementation Plan

## Current State Assessment

**Already implemented:**
- `api/signup.ts` — Full auto-assignment logic for both pools (general 50, creator 20), logging, response fields
- `supabase/migrations/20260201_add_founding_member_creator.sql` — Column + partial index
- `src/lib/email/followupTemplates.ts` — `founding_member_creator` role, template, and resolver
- `src/components/SupabaseWaitlistForm.tsx` — Sends `is_creator: segment === 'creator'`

**NOT yet implemented (this plan covers these):**
1. `api/admin/update-waitlist-user.ts` — No `is_founding_member_creator` support
2. `api/admin/search-waitlist.ts` — No `is_founding_member_creator` filter or column
3. `api/admin/export-waitlist.ts` — No `is_founding_member_creator` in CSV
4. `api/admin/import-waitlist.ts` — No `is_founding_member_creator` parsing or cap enforcement
5. `api/admin/waitlist-stats.ts` — No founding creator count
6. `api/admin/waitlist-analytics.ts` — No founding creator analytics
7. `src/pages/admin/user/EditUserPanel.tsx` — No founding creator toggle
8. `src/pages/admin/page.tsx` — No founding creator stats on dashboard
9. `src/pages/admin/waitlist-analytics/page.tsx` — No founding creator analytics display
10. `src/pages/admin/search/page.tsx` — No founding creator filter or column (needs verification)

---

## Step 1: `api/admin/update-waitlist-user.ts`

### Changes:

**1a. Add constant** (line 46):
```typescript
const MAX_FOUNDING_MEMBER_CREATORS = 20;
```

**1b. Add `is_founding_member_creator` to interfaces** (lines 50-67):
```typescript
interface UpdateRequestBody {
  // ...existing fields...
  is_founding_member_creator?: boolean;  // ADD
}

interface UpdatePayload {
  // ...existing fields...
  is_founding_member_creator?: boolean;  // ADD
}
```

**1c. Add validation block** (after the `is_founding_member` validation at line 187, add):
```typescript
// Validate is_founding_member_creator if provided
if (is_founding_member_creator !== undefined) {
  if (typeof is_founding_member_creator !== 'boolean') {
    return res.status(400).json({ error: 'is_founding_member_creator must be a boolean' });
  }
  updatePayload.is_founding_member_creator = is_founding_member_creator;
  hasUpdateField = true;
}
```

Also destructure `is_founding_member_creator` from `body` on line 124.

**1d. Add cap enforcement** (after the existing `is_founding_member` cap check block ending at line 274, add):
```typescript
// Enforce founding member creator cap (20 max)
if (updatePayload.is_founding_member_creator === true) {
  const { data: currentUser, error: currentUserError } = await supabase
    .from('waitlist')
    .select('is_founding_member_creator')
    .eq('email', trimmedEmail)
    .single();

  if (currentUserError) {
    console.error('[update-waitlist-user] Error checking founding creator status:', currentUserError);
    return res.status(500).json({ error: 'Failed to verify founding member creator status' });
  }

  if (!currentUser?.is_founding_member_creator) {
    const { count, error: countError } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .eq('is_founding_member_creator', true);

    if (countError) {
      console.error('[update-waitlist-user] Error counting founding member creators:', countError);
      return res.status(500).json({ error: 'Failed to verify founding member creator count' });
    }

    if ((count ?? 0) >= MAX_FOUNDING_MEMBER_CREATORS) {
      return res.status(409).json({
        error: `Founding member creator cap reached (${count}/${MAX_FOUNDING_MEMBER_CREATORS}). Cannot add more founding member creators.`
      });
    }
  }
}
```

**1e. Update `.select()` on line 347** to include `is_founding_member_creator`:
```typescript
.select('email, wave_number, status, is_founding_member, is_founding_member_creator, created_at')
```

**1f. Update response object** (line 377-386) to include `is_founding_member_creator`:
```typescript
user: {
  email: data.email,
  wave_number: data.wave_number,
  status: data.status,
  is_founding_member: data.is_founding_member,
  is_founding_member_creator: data.is_founding_member_creator,
  created_at: data.created_at,
},
```

**1g. Update the error message for "at least one field"** (line 210) to include `is_founding_member_creator`.

**1h. Update the doc comment** at top of file to list `is_founding_member_creator` in the Body and Response sections.

---

## Step 2: `api/admin/import-waitlist.ts`

### Changes:

**2a. Add constant** (line 38):
```typescript
const MAX_FOUNDING_MEMBER_CREATORS = 20;
```

**2b. Add `is_founding_member_creator` to `ParsedRow` interface** (line 43-51):
```typescript
interface ParsedRow {
  // ...existing fields...
  is_founding_member_creator?: boolean;  // ADD
}
```

**2c. Add parsing in `validateRow()`** (after `is_founding_member` parsing, around line 223):
```typescript
// is_founding_member_creator (optional)
const foundingCreatorStr = getValue('is_founding_member_creator');
if (foundingCreatorStr) {
  const foundingCreator = parseBoolean(foundingCreatorStr);
  if (foundingCreator === null) {
    return { data: null, error: { row: rowIndex, message: `Invalid is_founding_member_creator: ${foundingCreatorStr}` } };
  }
  parsed.is_founding_member_creator = foundingCreator;
}
```

**2d. Add cap enforcement** (after the existing `is_founding_member` cap check block ending at line 444, add a parallel block for `is_founding_member_creator`):
```typescript
// Enforce founding member creator cap (20 max)
const newFoundingCreatorInserts = toInsert.filter((r) => r.is_founding_member_creator === true).length;
const updatingToFoundingCreator = toUpdate.filter((r) => r.is_founding_member_creator === true);
let newFoundingCreatorUpgrades = 0;

if (updatingToFoundingCreator.length > 0) {
  const upgradeEmails = updatingToFoundingCreator.map((r) => r.email);
  const { data: alreadyFoundingCreator, error: checkError } = await supabase
    .from('waitlist')
    .select('email')
    .in('email', upgradeEmails)
    .eq('is_founding_member_creator', true);

  if (checkError) {
    console.error('[import-waitlist] Error checking founding creator status:', checkError);
    return res.status(500).json({ error: 'Failed to verify founding member creator status' });
  }

  const alreadyEmails = new Set((alreadyFoundingCreator || []).map((u) => u.email));
  newFoundingCreatorUpgrades = updatingToFoundingCreator.filter((r) => !alreadyEmails.has(r.email)).length;
}

if (newFoundingCreatorInserts + newFoundingCreatorUpgrades > 0) {
  const { count: currentCreatorCount, error: countError } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true })
    .eq('is_founding_member_creator', true);

  if (countError) {
    console.error('[import-waitlist] Error counting founding member creators:', countError);
    return res.status(500).json({ error: 'Failed to verify founding member creator count' });
  }

  const totalAfterImport = (currentCreatorCount ?? 0) + newFoundingCreatorInserts + newFoundingCreatorUpgrades;
  if (totalAfterImport > MAX_FOUNDING_MEMBER_CREATORS) {
    const slotsRemaining = MAX_FOUNDING_MEMBER_CREATORS - (currentCreatorCount ?? 0);
    return res.status(409).json({
      error: `Founding member creator cap would be exceeded. Current: ${currentCreatorCount}/${MAX_FOUNDING_MEMBER_CREATORS}. Import wants to add ${newFoundingCreatorInserts + newFoundingCreatorUpgrades} more. Slots remaining: ${slotsRemaining}.`
    });
  }
}
```

**2e. Include in insert data** (line 547-555, add to the map):
```typescript
is_founding_member_creator: row.is_founding_member_creator ?? false,
```

**2f. Include in update data** (line 575-582, add):
```typescript
if (row.is_founding_member_creator !== undefined) updateData.is_founding_member_creator = row.is_founding_member_creator;
```

**2g. Update doc comment** at top to include `is_founding_member_creator` in optional CSV columns.

---

## Step 3: `api/admin/search-waitlist.ts`

### Changes:

**3a. Add `is_founding_member_creator` to `WaitlistResult` interface** (line 47-53):
```typescript
interface WaitlistResult {
  // ...existing fields...
  is_founding_member_creator: boolean;  // ADD
}
```

**3b. Add query parameter parsing** (after `is_founding_member` parsing, around line 182):
```typescript
// Validate is_founding_member_creator filter
let isFoundingMemberCreatorFilter: boolean | null = null;
if (isFoundingMemberCreatorParam !== undefined) {
  if (typeof isFoundingMemberCreatorParam !== 'string') {
    return res.status(400).json({ error: 'is_founding_member_creator must be a single value' });
  }
  const trimmed = isFoundingMemberCreatorParam.trim().toLowerCase();
  if (trimmed === 'true') {
    isFoundingMemberCreatorFilter = true;
  } else if (trimmed === 'false') {
    isFoundingMemberCreatorFilter = false;
  } else if (trimmed) {
    return res.status(400).json({ error: 'is_founding_member_creator must be true or false' });
  }
}
```

Also destructure `is_founding_member_creator: isFoundingMemberCreatorParam` from `req.query` on line 97-105.

**3c. Update `.select()` on line 236** to include `is_founding_member_creator`:
```typescript
.select('email, wave_number, status, is_founding_member, is_founding_member_creator, created_at')
```

**3d. Add filter application** (after line 262, add):
```typescript
// Apply is_founding_member_creator filter
if (isFoundingMemberCreatorFilter !== null) {
  query = query.eq('is_founding_member_creator', isFoundingMemberCreatorFilter);
}
```

**3e. Update result mapping** (line 292-298) to include `is_founding_member_creator`:
```typescript
is_founding_member_creator: row.is_founding_member_creator,
```

**3f. Update doc comment** at top to list `is_founding_member_creator` as a query parameter and response field.

---

## Step 4: `api/admin/export-waitlist.ts`

### Changes:

**4a. Add to `CSV_HEADERS`** (line 40):
```typescript
const CSV_HEADERS = ['email', 'wave_number', 'status', 'is_founding_member', 'is_founding_member_creator', 'created_at'];
```

**4b. Add to `WaitlistRow` interface** (line 42-48):
```typescript
interface WaitlistRow {
  // ...existing fields...
  is_founding_member_creator: boolean;  // ADD
}
```

**4c. Add to `toCSV()` fields array** (line 82-88, add after `is_founding_member`):
```typescript
escapeCSVField(row.is_founding_member_creator),
```

**4d. Add `is_founding_member_creator` filter parameter** (mirror the `is_founding_member` pattern — parse, validate, apply to query):
- Destructure `is_founding_member_creator: isFoundingMemberCreatorParam` from `req.query`
- Add validation block
- Add filter application to query

**4e. Update `.select()` on line 262**:
```typescript
.select('email, wave_number, status, is_founding_member, is_founding_member_creator, created_at')
```

**4f. Update row mapping** (line 317-323) to include `is_founding_member_creator`:
```typescript
is_founding_member_creator: row.is_founding_member_creator,
```

**4g. Update doc comment** at top.

---

## Step 5: `api/admin/waitlist-stats.ts`

### Changes:

**5a. Add founding creator count query** to the `Promise.all` (line 81-123):
```typescript
// Add to Promise.all array:
// Founding member creators
supabase
  .from('waitlist')
  .select('*', { count: 'exact', head: true })
  .eq('is_founding_member_creator', true),
```

Destructure as `foundingCreatorResult`.

**5b. Add to error check array** (line 126-133).

**5c. Add to response** (line 143-152):
```typescript
total_founding_member_creators: foundingCreatorResult.count ?? 0,
```

**5d. Update doc comment** at top.

---

## Step 6: `api/admin/waitlist-analytics.ts`

### Changes:

**6a. Add founding creator count query** to the `Promise.all` (line 168-202):
```typescript
// Add: Founding member creator count
supabase
  .from('waitlist')
  .select('*', { count: 'exact', head: true })
  .eq('is_founding_member_creator', true),
```

Destructure as `foundingCreatorResult`.

**6b. Add error check** for `foundingCreatorResult`.

**6c. Add to `AnalyticsResponse` interface** (line 45-51):
```typescript
founding_member_creator_count: number;
```

**6d. Add to response** (line 235-241):
```typescript
founding_member_creator_count: foundingCreatorResult.count ?? 0,
```

**6e. Update doc comment** at top.

---

## Step 7: `src/pages/admin/user/EditUserPanel.tsx`

### Changes:

**7a. Add to `UserData` interface** (line 3-8):
```typescript
interface UserData {
  // ...existing fields...
  is_founding_member_creator: boolean;  // ADD
}
```

**7b. Add to `FormState` interface** (line 15-20):
```typescript
interface FormState {
  // ...existing fields...
  is_founding_member_creator: boolean;  // ADD
}
```

**7c. Initialize in `useState`** (line 23-28):
```typescript
is_founding_member_creator: user.is_founding_member_creator,
```

**7d. Add to `useEffect` reset** (line 35-44):
```typescript
is_founding_member_creator: user.is_founding_member_creator,
```

**7e. Add to `hasChanges()`** (line 47-57):
```typescript
if (formState.is_founding_member_creator !== user.is_founding_member_creator) return true;
```

**7f. Add to `buildUpdatePayload()`** (line 60-83):
```typescript
if (formState.is_founding_member_creator !== user.is_founding_member_creator) {
  payload.is_founding_member_creator = formState.is_founding_member_creator;
}
```

**7g. Add checkbox UI** (after the existing Founding Member checkbox, around line 237-254):
```html
{/* Founding Member Creator checkbox */}
<div className="space-y-1.5 sm:col-span-2">
  <div className="flex items-center gap-3">
    <input
      type="checkbox"
      id="is_founding_member_creator"
      checked={formState.is_founding_member_creator}
      onChange={(e) => handleInputChange('is_founding_member_creator', e.target.checked)}
      disabled={loading}
      className="w-4 h-4 text-sage-600 border-sage-300 rounded focus:ring-sage-500 disabled:opacity-50"
    />
    <label htmlFor="is_founding_member_creator" className="text-sm font-medium text-sage-700">
      Founding Member Creator
    </label>
  </div>
  <p className="text-xs text-sage-500 ml-7">
    Creator founding members receive priority creator access and exclusive creator benefits (separate pool, cap 20)
  </p>
</div>
```

---

## Step 8: `src/pages/admin/waitlist-analytics/page.tsx`

### Changes:

**8a. Add to `WaitlistAnalytics` interface** (line 20-26):
```typescript
founding_member_creator_count: number;
```

**8b. Add a StatCard** for founding member creators in the stats grid (where `founding_member_count` is displayed), add alongside:
```html
<StatCard
  title="Founding Creators"
  value={analytics ? `${formatNumber(analytics.founding_member_creator_count)} / 20` : '—'}
  description="Creator founding pool"
  isLoading={loading}
/>
```

---

## Step 9: `src/pages/admin/search/page.tsx` (verify + update)

Need to verify if the search page UI displays `is_founding_member_creator`:
- Check for table columns displaying user data
- Check for filter dropdowns
- If present, add `is_founding_member_creator` as a column and filter option

---

## Step 10: `src/pages/admin/page.tsx` (Admin Dashboard)

The dashboard currently uses a `/api/admin/summary` endpoint (not `waitlist-stats`). If the summary endpoint already returns founding data, add a StatCard for founding creator stats. Otherwise, this step depends on what the summary API returns — may need a separate fetch to `waitlist-stats`.

---

## Error States Summary

| Scenario | Response |
|----------|----------|
| Creator signs up, creator cap (20) full | User created, `is_founding_member_creator = false`, assigned to wave 1 instead. No error. |
| Non-creator signs up, general cap (50) full | User created, `is_founding_member = false`, assigned to wave 1 instead. No error. |
| Admin sets `is_founding_member_creator = true` via update API, cap full | 409 with `"Founding member creator cap reached (20/20)..."` |
| Admin imports CSV with `is_founding_member_creator = true`, would exceed cap | 409 with `"Founding member creator cap would be exceeded..."` |
| Admin sets `is_founding_member_creator = false` | Always allowed, no cap check needed |

---

## Logging

All logging is already structured JSON (`console.log(JSON.stringify({...}))`) in the existing codebase.

**New log events:**
- `api/signup.ts` — Already logs `founding_member_auto_assigned` with `pool: 'creator'` (done)
- `api/admin/update-waitlist-user.ts` — Already logs `waitlist_user_updated` with the full `updatePayload` (will naturally include `is_founding_member_creator`)
- `api/admin/import-waitlist.ts` — Already logs `waitlist_import` with counts (no change needed for top-level logging)

**Cap-near warnings:** Not adding 80% threshold warnings — the admin dashboard stat cards provide real-time visibility. Adding console warnings would create noise in Vercel logs without clear actionability.

---

## Testing Plan

### Unit-level checks:
- Admin update: set `is_founding_member_creator = true` on a user, verify 200 + field in response
- Admin update: attempt to set when cap is full, verify 409
- Admin update: set `is_founding_member_creator = false` when at cap, verify 200 (no cap check needed)
- Import: CSV with `is_founding_member_creator` column, verify inserts respect cap
- Import: CSV that would exceed cap, verify 409
- Search: filter by `is_founding_member_creator=true`, verify filtered results
- Export: CSV includes `is_founding_member_creator` column

### Integration tests:
- Full signup flow for creator → verify `is_founding_member_creator = true` when under cap
- Full signup flow for creator when cap is full → verify fallback to wave 1
- Full signup flow for non-creator → verify `is_founding_member = true` when under cap
- EditUserPanel renders founding creator checkbox
- Waitlist analytics page shows founding creator count

### Edge cases:
- User who is both `is_founding_member = true` AND `is_founding_member_creator = true` (admin override)
- Import with both flags set in same row
- Toggling `is_founding_member_creator` from true to false frees a slot

---

## Rollout Plan

1. **Database migration** — Run `20260201_add_founding_member_creator.sql` if not already applied (column + index)
2. **Deploy API changes** — All admin endpoints in a single deploy (they're all serverless functions)
3. **Deploy frontend** — Admin UI changes (EditUserPanel, analytics, search)
4. **Verify** — Create a test creator signup, check admin dashboard shows correct counts, verify cap enforcement via admin update API
5. **No feature flag needed** — The column has `DEFAULT false`, so existing users are unaffected. The auto-assignment only triggers for new creator signups going forward.

---

## File Change Summary

| File | Type | Change |
|------|------|--------|
| `api/admin/update-waitlist-user.ts` | Edit | Add `is_founding_member_creator` field, validation, cap enforcement (20), response |
| `api/admin/import-waitlist.ts` | Edit | Add `is_founding_member_creator` parsing, cap enforcement (20), insert/update |
| `api/admin/search-waitlist.ts` | Edit | Add `is_founding_member_creator` filter, select, response mapping |
| `api/admin/export-waitlist.ts` | Edit | Add `is_founding_member_creator` to CSV headers, row data, filter |
| `api/admin/waitlist-stats.ts` | Edit | Add founding creator count query + response field |
| `api/admin/waitlist-analytics.ts` | Edit | Add founding creator count query + response field |
| `src/pages/admin/user/EditUserPanel.tsx` | Edit | Add checkbox, form state, change detection, payload |
| `src/pages/admin/waitlist-analytics/page.tsx` | Edit | Add `founding_member_creator_count` to interface + StatCard |
| `src/pages/admin/search/page.tsx` | Edit | Add column + filter (verify first) |
