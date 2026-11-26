// ----------------------------------------------------------------------------
// THE PERSONAL-TEXTING OFFER SWITCH (Ethan, Nov 25 2026: emails are enough).
//
// false = nothing offers a text spot, passes one on, accepts or declines one,
// or shows one:
//   - api/signup.ts makes no offer and sends no offer email
//   - api/_textOffer.ts passOnTextOffer offers nobody (decline, late accept,
//     and the admin "move to Removed" action all go through it)
//   - supabase/functions/unsubscribe/index.ts passes no spot on
//   - api/text-opt-in.ts answers no-offer-active and changes nothing
//   - src/pages/member/page.tsx hides the "Personal texts from Ethan" box
// Existing rows (offer stamps, opt-ins, phone numbers) are left as they are.
//
// ONE copy, read by the Vercel API, the unsubscribe edge function and the
// site, so it lives here, where the edge function bundler can reach it, and
// imports nothing. Flipping it back needs a deploy of all three.
// ----------------------------------------------------------------------------

export const TEXT_OFFERS_ENABLED = false;
