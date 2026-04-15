---
last_synced: 2026-04-13
auto-update: this file must be updated whenever a new skill (.claude/skills/), rule (.claude/rules/), or agent (.claude/agents/) is created. See 01-workflow.md Self-Check item 5.
---

---
scope: "Prompt category → skills, rules, agents, model, boilerplate, flags"
authority: reference
last_synced: "2026-04-13"
---

# Prompt Categories — Lorem Curae

> Find your task category below. Load the listed files, use the boilerplate prefix, check the flags.
> Covers 29 skills · 8 agents · 19 rules · 5 memory entries. Generated 2026-04-13.

**Index:** [1 UI Polish RN](#1-ui-polish--react-native) · [2 UI Polish Web](#2-ui-polish--web-mvp) · [3 New Screen RN](#3-new-screen--feature--react-native) · [4 New Screen Web](#4-new-screen--feature--web-mvp) · [5 Bug Fix](#5-bug-fix--tsc-error) · [6 Auth/Supabase](#6-auth--supabase--edge-function) · [7 Copy](#7-copy--content) · [8 Git](#8-git--devops) · [9 Governance](#9-governance--rules--memory) · [10 AI Pipeline](#10-ai-pipeline--prompt-engineering) · [11 Scan Flow](#11-scan-flow) · [12 Animation](#12-animation--motion) · [13 Onboarding](#13-onboarding--survey-flow) · [14 Waitlist](#14-waitlist--marketing-site)

---

## 1. UI Polish — React Native

**Model + Effort:** Sonnet + Medium

| Item | Path | Why it applies |
|------|------|----------------|
| Rule | `rules/01-workflow.md` | Diff-first, no auto-apply |
| Rule | `rules/02-code-standards.md` | Naming, imports |
| Rule | `rules/03-frontend.md` | Brand tokens, motion system |
| Rule | `rules/11-testing.md` | TSC + build after changes |
| Skill | `skills/taste-skill/SKILL.md` | Mobile brand filter — palette, fonts, native patterns |

**Boilerplate:** `Read @.claude/Memory.md. Read @.claude/skills/taste-skill/SKILL.md — apply design constraints throughout. State model + effort per rule 19. No audit needed — proceed directly.`

**Flags:**
- Cormorant Garamond + DM Sans — do NOT strip, replace, or add alternatives
- `result.tsx` uses `StyleSheet.create`, NOT NativeWind — check before writing press feedback
- Stagger entrance animation **DEFERRED** in `result.tsx` — do not re-add without Android device testing
- Skip modal: custom `Animated.View` modal, never `Alert.alert` (Memory: feedback_custom-skip-modal)
- White flash: `Stack contentStyle.backgroundColor` + root layout fallback `View` BOTH must be `#0f0f0f` (Memory: feedback_white-flash-fix)
- Bottom safe area: `paddingBottom: insets.bottom` bare — no constant on dark full-screen screens (Memory: feedback_bottom-whitespace)
- `isMounted` ref guard required in ALL animation `.start()` callbacks

---

## 2. UI Polish — Web MVP

**Model + Effort:** Sonnet + Medium

| Item | Path | Why it applies |
|------|------|----------------|
| Rule | `rules/01-workflow.md` | Diff-first, no auto-apply |
| Rule | `rules/02-code-standards.md` | Naming, Tailwind token conventions |
| Rule | `rules/03-frontend.md` | Design system, motion tokens, copywriting |
| Rule | `rules/11-testing.md` | TSC + build after changes |
| Skill | `skills/design-taste-frontend/SKILL.md` | Senior frontend UX; metric-based design rules (8/6/4) |
| Skill | `skills/high-end-visual-design/SKILL.md` | Agency-level vibe archetypes, Double-Bezel, cinematic motion for existing screens |
| Skill | `skills/redesign-existing-projects/SKILL.md` | Diagnostic audit — typography, color, layout, states on existing web screens |

**Boilerplate:** `Read @.claude/Memory.md, @.claude/rules/03-frontend.md. Read @.claude/skills/design-taste-frontend/SKILL.md — apply design constraints throughout. State model + effort per rule 19. No audit needed — proceed directly.`

**Flags:**
- Tailwind tokens ONLY — never `text-[#C4704D]` or arbitrary values
- `taupe` is NOT a Tailwind token (90+ files use it) — use `warm-gray` instead
- Dark mode NOT implemented — never add `dark:` classes
- Never introduce new font families — Cormorant Garamond + Inter/DM Sans only

---

## 3. New Screen / Feature — React Native

**Model + Effort:** Opus + High (5+ files or unclear approach) · Opus + Medium (single screen, clear spec)

| Item | Path | Why it applies |
|------|------|----------------|
| Rule | `rules/01-workflow.md` | Diff-first, co-founder intelligence |
| Rule | `rules/02-code-standards.md` | Naming, shared types, imports |
| Rule | `rules/09-security.md` | Auth, env vars, guest vs auth policy |
| Rule | `rules/10-data-layer.md` | Edge Function patterns, migration rules |
| Rule | `rules/11-testing.md` | Full-functionality enforcement, post-impl checklist |
| Rule | `rules/12-git-workflow.md` | Commit scope, pre-commit checklist |
| Rule | `rules/15-roadmap.md` | Feature tier (MoSCoW) — check before building |
| Skill | `skills/taste-skill/SKILL.md` | Brand tokens + native patterns |
| Skill | `skills/scaffold-feature.md` | Boilerplate generation |
| Skill | `skills/full-output-enforcement/SKILL.md` | Prevents silent output truncation on large files |

**Boilerplate:** `Read @.claude/rules/01-workflow.md, @.claude/Memory.md, @.claude/CLAUDE.md before doing anything. Apply Continuous Governance Scaling. State model + effort per rule 19.`

**Flags:**
- `AbortController` + `isMounted` ref required on ALL async operations in components
- `isMounted` guard required in ALL animation `.start()` callbacks
- Use raw `fetch()` not `supabase.functions.invoke()` for Edge Functions
- Check `package.json` before importing any third-party library
- `KeyboardAvoidingView`: `behavior="padding"` always — **never** branch on `Platform.OS`
- TSC error path `apps/mobile/apps/mobile/...` = ghost nested duplicate — check real path first
- Supabase CLI exit code 13 = permission issue — use MCP tools for all Supabase operations

---

## 4. New Screen / Feature — Web MVP

**Model + Effort:** Opus + High (5+ files or architecture) · Opus + Medium (single page, clear spec)

| Item | Path | Why it applies |
|------|------|----------------|
| Rule | `rules/01-workflow.md` | Diff-first, co-founder intelligence |
| Rule | `rules/02-code-standards.md` | Naming, shared types, canonical type registry |
| Rule | `rules/03-frontend.md` | Design system, motion, accessibility |
| Rule | `rules/04-state-management.md` | Personalization cascade, guest vs auth, state modules |
| Rule | `rules/09-security.md` | Auth, env vars, guest policy |
| Rule | `rules/10-data-layer.md` | Edge Functions, Supabase, migrations |
| Rule | `rules/11-testing.md` | Full-functionality enforcement, post-impl checklist |
| Rule | `rules/12-git-workflow.md` | Commit scope, pre-commit checklist |
| Rule | `rules/15-roadmap.md` | Feature tier (MoSCoW) — check before building |
| Rule | `rules/16-routing.md` | Route count, deferred route governance |
| Skill | `skills/design-taste-frontend/SKILL.md` | Brand tokens, web component patterns |
| Skill | `skills/high-end-visual-design/SKILL.md` | Vibe/Layout Archetypes + Double-Bezel for new screens |
| Skill | `skills/scaffold-feature.md` | Boilerplate generation |
| Skill | `skills/full-output-enforcement/SKILL.md` | Prevents silent output truncation on large files |

**Boilerplate:** `Read @.claude/rules/01-workflow.md, @.claude/Memory.md, @.claude/CLAUDE.md before doing anything. Apply Continuous Governance Scaling. State model + effort per rule 19.`

**Flags:**
- Check active route count before adding new routes — current count in `rules/16-routing.md`
- Deferred routes: do NOT uncomment without checking Notion Deferred Work Tracker
- Guest users: zero Supabase calls, zero API calls — verify graceful degradation
- `taupe` is NOT a Tailwind token — use `warm-gray`
- Supabase CLI exit code 13 — use MCP tools

---

## 5. Bug Fix / TSC Error

**Model + Effort:** Sonnet + High (clear error + stack trace) · Opus + High (mysterious, no error message)

| Item | Path | Why it applies |
|------|------|----------------|
| Rule | `rules/01-workflow.md` | Diff-first, no collateral changes |
| Rule | `rules/02-code-standards.md` | Patterns to match when fixing |
| Rule | `rules/11-testing.md` | TSC + build must pass after fix |
| Skill | `skills/bug-triage.md` | Systematic symptom → root cause → fix |
| Agent | `agents/reviewer.md` | Second opinion for non-obvious or auth-adjacent fixes |

**Boilerplate:** `Read @.claude/Memory.md. Read @.claude/rules/01-workflow.md. State model + effort per rule 19.`

**Flags:**
- TSC error path `apps/mobile/apps/mobile/...` = ghost nested duplicate path — real file is at the non-duplicated path
- Supabase CLI exit code 13 = permission error — use MCP tools
- `LargeSecureStore` race condition: multiple `getItem` calls before `setItem` resolves on cold start → stale data; serialize access or initialize state before first async read

---

## 6. Auth / Supabase / Edge Function

**Model + Effort:** Opus + High (new Edge Function or auth flow design) · Sonnet + Medium (deploy, SQL migration, config)

| Item | Path | Why it applies |
|------|------|----------------|
| Rule | `rules/01-workflow.md` | Diff-first, confirm before destructive operations |
| Rule | `rules/09-security.md` | Auth flow, env vars, RLS, Stripe safety |
| Rule | `rules/10-data-layer.md` | Edge Function patterns, migration rules, Supabase client |
| Rule | `rules/11-testing.md` | Post-change validation |
| Rule | `rules/12-git-workflow.md` | Pre-commit: validate-governance if governance files touched |
| Skill | `skills/deploy-checklist.md` | Pre-deploy validation |
| Agent | `agents/reviewer.md` | RLS policy review, auth flow review |

**Boilerplate:** `Read @.claude/rules/01-workflow.md, @.claude/Memory.md, @.claude/rules/09-security.md, @.claude/rules/10-data-layer.md before doing anything. Apply Continuous Governance Scaling. State model + effort per rule 19.`

**Flags:**
- Supabase CLI exit code 13 = use MCP (`mcp__claude_ai_Supabase__apply_migration`, `deploy_edge_function`)
- NEVER apply migrations automatically — always show SQL diff + impact + rollback plan first
- `LargeSecureStore` race condition on cold start — serialize async access, initialize state early
- **Snapshot-before-await**: capture `session` (and all needed values) before first `await` in `onAuthStateChange` callbacks
- `INITIAL_SESSION` event: handled in bootstrap; subscription must `return` early — do NOT re-route from it
- Edge Functions: Deno runtime, `esm.sh` imports, `Deno.serve()` pattern — cannot be validated with `tsc`
- `users_profiles` INSERT RLS policy: required for authenticated users to create their own row on first signup

---

## 7. Copy / Content

**Model + Effort:** Sonnet + Medium

| Item | Path | Why it applies |
|------|------|----------------|
| Rule | `rules/01-workflow.md` | Diff-first |
| Rule | `rules/03-frontend.md` | Copywriting tone rules |
| Rule | `rules/06-ai-product-voice.md` | Claim boundaries, originality, no copyright |
| Skill | `skills/content-pipeline.md` | Brand-aligned copy per CLAUDE_PRODUCT.md rules |

**Boilerplate:** `Read @.claude/Memory.md, @.claude/rules/03-frontend.md (copywriting section), @.claude/rules/06-ai-product-voice.md before doing anything.`

**Flags:**
- No em dashes (`—`) in user-facing copy
- No AI tell phrases: "elevate", "seamless", "unleash", "transform", "revolutionize", "delve", "game-changing"
- No "skincare advisor" / "your personal skincare advisor" framing — legal risk
- Ingredient claims must cite basis — no absolute promises ("will clear", "eliminates")
- "Not a substitute for professional medical advice" disclaimer required on analysis surfaces
- Brand voice: calm, educational, empowering — no hype, no exclamation marks unless explicitly requested

---

## 8. Git / DevOps

**Model + Effort:** Sonnet + Low (git ops) · Sonnet + Medium (deploy, PR creation)

| Item | Path | Why it applies |
|------|------|----------------|
| Rule | `rules/01-workflow.md` | Confirm before destructive operations |
| Rule | `rules/12-git-workflow.md` | Commit format, branch naming, PR requirements |
| Skill | `skills/deploy-checklist.md` | Pre-deploy validation checklist |

**Boilerplate:** `Read @.claude/Memory.md.`

**Flags:**
- `intelligent-lewin` branch is **locked in a worktree** — skip in any branch sync, cleanup, or bulk operation pipelines
- Never force-push to `main`/`master` without explicit user confirmation
- Supabase CLI exit code 13 — use MCP tools for all Supabase deployments
- Pre-commit: run `bash .claude/validate-governance.sh` if any `.claude/rules/`, `CLAUDE.md`, or `ROUTING.md` files are staged

---

## 9. Governance / Rules / Memory

**Model + Effort:** Sonnet + High

| Item | Path | Why it applies |
|------|------|----------------|
| Rule | `rules/01-workflow.md` | Continuous Governance Scaling protocol |
| Rule | `rules/14-consistency.md` | Error graduation, file governance (500-line limit) |
| Rule | `rules/19-model-selection.md` | Model selection for new rules |
| Skill | `skills/governance-sync.md` | Required if AI pipeline governance changes touch `systemPrompt.ts` |

**Boilerplate:** `Read @.claude/rules/01-workflow.md, @.claude/Memory.md, @.claude/CLAUDE.md, @.claude/ROUTING.md before doing anything. Apply Continuous Governance Scaling. State model + effort per rule 19.`

**Flags:**
- After creating a rule file: update Rule Index in `CLAUDE.md` + add query rows to `ROUTING.md`
- Run `bash .claude/validate-governance.sh` after any change to `.claude/rules/`, `CLAUDE.md`, or `ROUTING.md`
- No `.md` file may exceed 500 lines — estimate line count before writing
- `systemPrompt.ts` ↔ `CLAUDE_PRODUCT.md` must be synced in same PR (rule 06)
- Error graduation: first occurrence → Memory.md Observations; 2+ occurrences → propose rule; user approves → add to `rules/`

---

## 10. AI Pipeline / Prompt Engineering

**Model + Effort:** Opus + Medium (new AI mode, multi-file wiring) · Sonnet + High (audit/review only)

| Item | Path | Why it applies |
|------|------|----------------|
| Rule | `rules/01-workflow.md` | Diff-first, forbidden actions |
| Rule | `rules/05-ai-pipeline.md` | AI module registry, highlighting, guardrails |
| Rule | `rules/06-ai-product-voice.md` | Claim boundaries, systemPrompt sync |
| Rule | `rules/09-security.md` | API key handling, auth on Edge Functions |
| Rule | `rules/11-testing.md` | Validation after AI changes |
| Skill | `skills/governance-sync.md` | Validates `systemPrompt.ts` ↔ `CLAUDE_PRODUCT.md` |
| Skill | `skills/content-pipeline.md` | Brand-aligned AI output content |
| Skill | `skills/full-output-enforcement/SKILL.md` | Prevents silent output truncation on large files |
| Agent | `agents/reviewer.md` | Independent prompt/governance review |

**Boilerplate:** `Read @.claude/rules/01-workflow.md, @.claude/Memory.md, @.claude/rules/05-ai-pipeline.md, @.claude/rules/06-ai-product-voice.md before doing anything. Apply Continuous Governance Scaling. State model + effort per rule 19.`

**Flags:**
- `ai-chat` Edge Function returns raw text, **not JSON** — use system prompt to enforce JSON; add client-side `JSON.parse` with fallback
- Use raw `fetch()` with explicit `Bearer` token — NOT `supabase.functions.invoke()`
- Any change to `ai-insight` or `ai-chat` requires governance-sync review (`systemPrompt.ts` ↔ `CLAUDE_PRODUCT.md`)
- New AI surface = new `MODE_INSTRUCTIONS` entry in `surfaceContext.ts`
- Never add highlight keywords without verifying no partial-word collision — word boundary `\b...\b` rule

---

## 11. Scan Flow

**Model + Effort:** Opus + High (architecture) · Opus + Medium (wiring existing patterns)

| Item | Path | Why it applies |
|------|------|----------------|
| Rule | `rules/01-workflow.md` | Diff-first, co-founder intelligence |
| Rule | `rules/02-code-standards.md` | Naming, shared types |
| Rule | `rules/05-ai-pipeline.md` | AI modes: `curated_recommendation`, `curated_review_summary` |
| Rule | `rules/09-security.md` | Auth gate on scan, guest policy |
| Rule | `rules/10-data-layer.md` | `product-scan` Edge Function, `product-search`, Serper rate limiting |
| Rule | `rules/11-testing.md` | Post-impl validation |
| Rule | `rules/17-camera-scan.md` | Full scan architecture reference |
| Skill | `skills/taste-skill/SKILL.md` | Brand tokens for scan UI changes |
| Skill | `skills/bug-triage.md` | Scan-specific bug investigation |
| Skill | `skills/full-output-enforcement/SKILL.md` | Prevents silent output truncation on large files |
| Agent | `agents/qa-testing.md` | Post-implementation validation |

**Boilerplate:** `Read @.claude/rules/01-workflow.md, @.claude/Memory.md, @.claude/CLAUDE.md, @.claude/rules/17-camera-scan.md before doing anything. Apply Continuous Governance Scaling. State model + effort per rule 19.`

**Flags:**
- `result.tsx` uses `StyleSheet.create`, NOT NativeWind — check before writing any styles
- Stagger entrance animation **DEFERRED** — do not re-add `Animated.View` wrappers without Android device testing (Memory: feedback_result-cta-layout)
- Android race condition: `useEffect([])` + Animated stagger freezes `opacity` at 0 on Expo Router param re-renders
- CTA layout **locked**: Primary full-width `#C4704D` → Secondary Row equal flex-1 dark → Tertiary sage-tinted AI → Footer ghost | primary (Memory: feedback_result-cta-layout)
- Use `Ionicons chevron-forward` — NOT a custom `View` chevron (renders as stray `<` on device)
- `AbortController` + `cancelledRef` pattern required on all async scan operations
- Web search: 10 calls/session client-side rate limit; 24h server-side Supabase cache
- `result.tsx` → `buy.tsx`: `router.push` must pass `{ pathname: '/(scan)/buy', params: { productName, brand, category } }`

---

## 12. Animation / Motion

**Model + Effort:** Sonnet + Medium

| Item | Path | Why it applies |
|------|------|----------------|
| Rule | `rules/01-workflow.md` | Diff-first |
| Rule | `rules/03-frontend.md` | Motion tokens, easing, GPU-friendly rules |
| Rule | `rules/11-testing.md` | TSC + build after changes |
| Skill | `skills/taste-skill/SKILL.md` | Native animation brand constraints |
| Skill | `skills/design-taste-frontend/SKILL.md` | Web animation only — MOTION_INTENSITY dial, Framer Motion rules, perf guardrails |
| Skill | `skills/high-end-visual-design/SKILL.md` | Web animation only — spring physics, scroll reveals, motion choreography |
| Skill | `skills/full-output-enforcement/SKILL.md` | Prevents silent output truncation on large files |

**Boilerplate:** `Read @.claude/Memory.md. Read @.claude/rules/03-frontend.md (motion section). Read @.claude/skills/taste-skill/SKILL.md — apply design constraints throughout.`

**Flags:**
- `useEffect([])` for entrance animations ONLY — never stagger inside `useEffect` with deps that change post-mount
- `isMounted` ref guard in ALL `.start()` callbacks — prevents `setState` after unmount
- `transform` + `opacity` ONLY — never animate layout properties (`width`, `height`, `padding`, `margin`)
- React Native: `Easing.out(Easing.cubic)` for open/enter; `Easing.in(Easing.cubic)` for close/exit
- No bounce, spring, or playful animation — soft, slow, premium only
- Stagger animations in `result.tsx`: **deferred** — do not re-add without device testing (Memory: feedback_result-cta-layout)
- Web (Framer Motion): use `EASING.natural` or `EASING.gentle`; `prefers-reduced-motion` fallback required

---

## 13. Onboarding / Survey Flow

**Model + Effort:** Opus + Medium (rearchitect/rewrite) · Sonnet + High (debug)

| Item | Path | Why it applies |
|------|------|----------------|
| Rule | `rules/01-workflow.md` | Diff-first, forbidden actions on auth |
| Rule | `rules/09-security.md` | Auth flow, OTP, RLS insert policy |
| Rule | `rules/10-data-layer.md` | `users_profiles` table, upsert pattern |
| Rule | `rules/11-testing.md` | Post-impl validation |
| Skill | `skills/taste-skill/SKILL.md` | Brand tokens, native animation patterns |
| Agent | `agents/reviewer.md` | Auth flow logic review |

**Boilerplate:** `Read @.claude/rules/01-workflow.md, @.claude/Memory.md, @.claude/rules/09-security.md before doing anything. Apply Continuous Governance Scaling. State model + effort per rule 19.`

**Flags:**
- **Snapshot-before-await**: capture `session` before first `await` in `onAuthStateChange` callbacks
- `INITIAL_SESSION` event: bootstrap in `_layout.tsx` resolves routing; subscription must `return` early — never re-route from it
- `KeyboardAvoidingView`: `behavior="padding"` always — **never** branch on `Platform.OS`
- White flash: `Stack contentStyle.backgroundColor` + root fallback `View` bg BOTH must be `#0f0f0f` (Memory: feedback_white-flash-fix)
- `survey_completed` drives routing — set via upsert `onConflict: "id"` on `users_profiles`
- `users_profiles` requires INSERT RLS policy: `auth.uid() = id` — without it, first-signup upsert silently fails
- Bottom safe area: `paddingBottom: insets.bottom` bare — no added constant (Memory: feedback_bottom-whitespace)
- Upsert failure: show visible error + retry button — never swallow silently and navigate anyway

---

## 14. Waitlist / Marketing Site

**Model + Effort:** Sonnet + High (context, copy output)

| Item | Path | Why it applies |
|------|------|----------------|
| Rule | `rules/01-workflow.md` | Diff-first |
| Rule | `rules/03-frontend.md` | Copywriting tone, brand tokens |
| Rule | `rules/06-ai-product-voice.md` | Claim boundaries, no copyright |
| Skill | `skills/market-landing/` | Landing page CRO analysis |
| Skill | `skills/market-launch/` | Launch playbook generation |
| Skill | `skills/market-copy/` | Copy scoring + before/after optimization |
| Skill | `skills/design-taste-frontend/SKILL.md` | Web UI engineering — Tailwind, component architecture, motion |
| Skill | `skills/high-end-visual-design/SKILL.md` | Agency-level design — Editorial Luxury archetype, spacing, CTAs |
| Skill | `skills/redesign-existing-projects/SKILL.md` | For iterating on existing waitlist screens — typography, color, layout audit |
| Agent | `agents/research.md` | Competitive research |

**Boilerplate:** `Read @.claude/Memory.md, @.claude/rules/03-frontend.md (copywriting section), @.claude/rules/06-ai-product-voice.md.`

**Flags:**
- Separate Next.js project at `lorem-curae-waitlist` — NOT the same codebase as mobile or web MVP
- Vercel auto-deploys on push to `main` of `lorem-curae-waitlist` — be careful
- `founding_member_slots` view in Supabase tracks the 1000-slot price lock
- No em dashes, no AI tell phrases, no "skincare advisor" framing (legal risk)
- `intelligent-lewin` branch locked in a worktree — skip in any branch sync pipelines
