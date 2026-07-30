// ============================================================================
// CURAE — DRIP EMAIL TEMPLATES
// ============================================================================
//
// Copy for the time-based drip campaign. Scheduler not wired yet — templates
// live here so the scheduler (separate task) can import them unchanged.
//
// Placeholders substituted by the sender at send time:
//   {{MAGIC_LINK}}        — per-user magic link
//   {{UNSUBSCRIBE_URL}}   — per-user unsubscribe URL
//   {{SLOTS_REMAINING}}   — founding-rate slots left (founding_rate_urgency only);
//                            wired in drip-scheduler via the founding_member_slots
//                            view (column: slots_remaining). Falls back to
//                            "A limited number of" if the view query fails.
//
// ============================================================================

export type DripEventType =
  | 'welcome'              // after first login or waitlist confirmation
  | 'scan_walkthrough'     // day 3, no login
  | 'founding_rate_urgency'// day 7, unconverted
  | 'scan_deep_dive'       // day 14
  | 're_engagement';       // day 30, inactive

interface DripTemplate {
  subject: string;
  html: string;
}

// ----------------------------------------------------------------------------
// SHARED COPY PIECES (kept in sync with followupTemplates + request-magic-link)
// ----------------------------------------------------------------------------

const FOOTER = `<p style="color:#888;font-size:12px;margin-top:32px;">Curae · <a href="{{UNSUBSCRIBE_URL}}" style="color:#888;">Unsubscribe</a> · <a href="https://loremcurae.com/privacy" style="color:#888;">Privacy</a></p>`;

const SIGN_OFF = `<p>— Ethan Jones<br/>Founder, Curae</p>`;

// ----------------------------------------------------------------------------
// TEMPLATES
// ----------------------------------------------------------------------------

export const dripTemplates: Record<DripEventType, DripTemplate> = {
  // NOTE: The `welcome` drip is NOT fired by supabase/functions/drip-scheduler.
  // The signup email sent by api/request-magic-link.ts (type=signup) already
  // confirms the spot and introduces the scan, so a same-day welcome drip
  // would duplicate it. Kept here for reference in case the signup/welcome
  // split is ever reintroduced.
  welcome: {
    subject: "Here's how Curae works",
    html: `<p>Hi there,</p>
<p>Curae starts with a scan.</p>
<p>Point your camera at any product. We identify it, then score every ingredient against your skin profile, verified across multiple sources. You get back a safety rating, an ingredient-by-ingredient breakdown, and where to buy. Compatibility and conflict detection come with Premium.</p>
<p>That's it. No questionnaires, no advisor chats — scan, read, decide.</p>
<p><strong><a href="{{MAGIC_LINK}}">Scan your first product when we launch</a></strong></p>
${SIGN_OFF}
${FOOTER}`,
  },

  scan_walkthrough: {
    subject: "What happens when you scan a product",
    html: `<p>Hi there,</p>
<p>A scan takes about three seconds. Here's what it does:</p>
<p><strong>1. Identifies the product.</strong> Camera reads the label or barcode. You don't type anything.</p>
<p><strong>2. Scores every ingredient against your skin profile.</strong> Each one is marked safe, caution, or avoid — with the specific reason. Fragrance you've flagged as a trigger? An ingredient that clashes with something already on your shelf (Premium)? You see it.</p>
<p><strong>3. Surfaces where to buy.</strong> Retailer options appear immediately, each with a trust score so you know who's legit.</p>
<p>No guessing at INCI lists. No copying names into Google.</p>
<p><strong><a href="{{MAGIC_LINK}}">Sign in</a></strong></p>
${SIGN_OFF}
${FOOTER}`,
  },

  founding_rate_urgency: {
    subject: "Your founding rate is still locked",
    html: `<p>Hi there,</p>
<p>Your spot on the Curae waitlist is still held, and your founding rate is still locked.</p>
<p>Founding members keep the founding rate for as long as they stay subscribed — it doesn't renew at the standard price later.</p>
<p>{{SLOTS_REMAINING}} founding spots remain.</p>
<p><strong><a href="{{MAGIC_LINK}}">Sign in</a></strong></p>
${SIGN_OFF}
${FOOTER}`,
  },

  scan_deep_dive: {
    subject: "What a scan actually unlocks",
    html: `<p>Hi there,</p>
<p>A scan isn't just a safety rating. Here's what it opens up:</p>
<p><strong>Compatible products (Premium).</strong> Once we know what's in your current product, we can surface alternatives that actually fit — same function, ingredients your skin tolerates.</p>
<p><strong>Where to buy, with retailer trust scores.</strong> You see who stocks it, at what price, and whether they're a legit source for that brand. No counterfeit roulette.</p>
<p><strong>Ask Curae, trained on your skin profile and routine.</strong> Ask it whether a new product fits alongside what you already use. It answers in context — not generic advice.</p>
<p><strong>Your Shelf.</strong> Every product you scan is saved. Check compatibility across your whole routine in one view (Premium).</p>
<p>Each one is something the scan opens up. No scan, no context — that's why the scan is the whole point.</p>
<p><strong><a href="{{MAGIC_LINK}}">Sign in</a></strong></p>
${SIGN_OFF}
${FOOTER}`,
  },

  re_engagement: {
    subject: "Still holding your spot",
    html: `<p>Hi there,</p>
<p>Your Curae spot is still held. You signed up to scan products and see which ingredients actually work for your skin — that's still what we're building.</p>
<p>If you'd like to stay on the list, no action needed. If you'd rather let your spot go, the unsubscribe link below does it in one click.</p>
<p><strong><a href="{{MAGIC_LINK}}">Sign in</a></strong></p>
${SIGN_OFF}
${FOOTER}`,
  },
};
