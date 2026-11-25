// ----------------------------------------------------------------------------
// THE ONE COPY of the text-offer pass-on email (#26): sender, subject, body and
// send settings. Read by api/_textOffer.ts (Vercel, Node) and by the
// unsubscribe edge function (Deno), so it lives here, where the edge function
// bundler can reach it, and imports nothing: fetch, AbortController and
// setTimeout exist in both runtimes.
// ----------------------------------------------------------------------------

export const TEXT_OFFER_FROM = 'Curae <hello@loremcurae.com>';
export const TEXT_OFFER_CLAIM_URL = 'https://lorem-curae-waitlist.vercel.app/member';
export const TEXT_OFFER_SUBJECT = "A personal note from Ethan, you're in the first 100";

// THE FOOTER IS THE FOUNDING WELCOME'S (api/_emails/foundingWelcome.ts, waitlist #28):
// "Curae · Unsubscribe · Privacy" in its type and colour. The unsubscribe link is the
// person's own: the confirm page with their unsubscribe_token. With no token it falls
// back to the same mailto address as api/request-magic-link.ts.
export const TEXT_OFFER_UNSUBSCRIBE_PAGE = 'https://loremcurae.com/unsubscribe';
export const TEXT_OFFER_UNSUBSCRIBE_FALLBACK = 'mailto:hello@loremcurae.com?subject=Unsubscribe';
export const TEXT_OFFER_PRIVACY_URL = 'https://loremcurae.com/privacy';

export function textOfferUnsubscribeUrl(unsubscribeToken: string | null | undefined): string {
  return unsubscribeToken
    ? `${TEXT_OFFER_UNSUBSCRIBE_PAGE}?token=${encodeURIComponent(unsubscribeToken)}`
    : TEXT_OFFER_UNSUBSCRIBE_FALLBACK;
}

// Bounded: a slow email service must not hang the page or action waiting on it.
export const TEXT_OFFER_SEND_TIMEOUT_MS = 8000;

// THE GREETING ARRIVES BUILT (#40). This file imports nothing, so it cannot call
// either runtime's greeting helper itself. `greeting` must be the output of
// greetingHtml (api/_greeting.ts in Node, ./greeting.ts in Deno): "Hi Maya,"
// with the name already HTML-escaped, or "Hi there,". Never pass a raw name.
//
// THE 100 IN THE EMAIL IS THE TEXT POOL, NOT THE FOUNDING CAP. They are unrelated and
// coincidentally equal since 2026-09-18, when the founding cap moved 1000 -> 100.
// This one is text_opt_in_config.slots_remaining: a mutable counter, decremented on
// accept, that cascades to the next person when someone declines. The founding cap is
// MAX_FOUNDING_MEMBERS (src/lib/foundingMembers.ts) and the founding_member_slots view.
// Do not merge them, and do not replace either number with the other constant.
// (These lines used to sit inside the template string and were sent in the
// email, issue 22. Keep comments out of the string below.)
export function textOfferHtml(greeting: string, unsubscribeToken: string | null | undefined): string {
  return `<p>${greeting}</p>
<p>You're one of our first 100 founding members on Curae.</p>
<p>I personally text the first 100. It's the fastest way to tell me what's working, what isn't, and what you want built next.</p>
<p><strong><a href="${TEXT_OFFER_CLAIM_URL}">Claim your spot</a></strong></p>
<p>This offer expires in 48 hours. If you'd rather not, no worries. Just ignore this email.</p>
<p>Ethan Jones<br/>Founder, Curae</p>
<p style="margin:24px 0 0 0;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#6B635A;">Curae · <a href="${textOfferUnsubscribeUrl(unsubscribeToken)}" style="color:#6B635A;text-decoration:underline;">Unsubscribe</a> · <a href="${TEXT_OFFER_PRIVACY_URL}" style="color:#6B635A;text-decoration:underline;">Privacy</a></p>`;
}

export type TextOfferSendResult =
  | { ok: true }
  | { ok: false; status?: number; error: string };

// Sends the offer to one address. unsubscribeToken is that person's
// waitlist.unsubscribe_token for the footer link: required, so no caller can
// forget it (null sends the mailto fallback). Never throws: a non-OK answer, a
// network error or the timeout comes back as ok:false for the caller to log.
export async function sendTextOfferEmail(
  resendApiKey: string,
  to: string,
  greeting: string,
  unsubscribeToken: string | null,
): Promise<TextOfferSendResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TEXT_OFFER_SEND_TIMEOUT_MS);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: TEXT_OFFER_FROM, to, subject: TEXT_OFFER_SUBJECT, html: textOfferHtml(greeting, unsubscribeToken) }),
      signal: controller.signal,
    });
    if (!res.ok) return { ok: false, status: res.status, error: await res.text().catch(() => '') };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  } finally {
    clearTimeout(timer);
  }
}
