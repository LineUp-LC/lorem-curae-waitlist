// The founding member welcome email (approved design, 2026-11-19).
// FOUNDING_WELCOME_HTML is founding-welcome.html byte for byte: do not reformat it.
// Its placeholders are {{LOGO_URL}}, {{POSITION_BLOCK}} and {{UNSUBSCRIBE_URL}}; the
// handler in api/request-magic-link.ts fills them. The template carries its own
// sign-off and footer, so the shared SIGN_OFF and FOOTER are never appended to it.

export const FOUNDING_WELCOME_LOGO_URL = 'https://loremcurae.com/email/curae-email-logo.png';

// A known founding-only rank prints "#N"; a rank that could not be computed (null,
// or not a positive whole number) prints the rank-free paragraph, never "#undefined".
export function foundingPositionBlock(rank: number | null): string {
  if (rank !== null && Number.isInteger(rank) && rank > 0) {
    return `<p style="margin:0;font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;font-size:56px;line-height:1.05;font-weight:500;color:#A35F42;">#${rank}</p>
<p style="margin:8px 0 0 0;font-size:16px;line-height:1.5;color:#0F0F0F;">on the founding member list. You'll be among the first to hear when access opens.</p>`;
  }
  return `<p style="margin:0;font-size:16px;line-height:1.5;color:#0F0F0F;">You'll be among the first to hear when access opens.</p>`;
}

export const FOUNDING_WELCOME_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>You're on the list. Your skin comes first.</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#F0EEEA;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F0EEEA;">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#FAF8F5;border:1px solid #E3E0DC;border-radius:16px;">

<tr><td align="center" style="padding:36px 32px 8px 32px;">
<img src="{{LOGO_URL}}" width="150" alt="Curae" style="display:block;width:150px;height:auto;border:0;">
</td></tr>

<tr><td align="center" style="padding:20px 40px 28px 40px;border-bottom:1px solid #E3E0DC;">
<p style="margin:0;font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;font-size:28px;line-height:1.2;font-weight:500;color:#0F0F0F;">Skincare doesn't have to be complicated. It just has to be you.</p>
</td></tr>

<tr><td style="padding:28px 40px 0 40px;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#0F0F0F;">
<p style="margin:0 0 16px 0;">Hi there,</p>
<p style="margin:0 0 16px 0;">You're officially on the Curae founding member list. Welcome in!</p>
<p style="margin:0 0 16px 0;">We've all been there. A product is trending, the reviews look promising, and suddenly it's in your cart. But is it actually a good fit for your skin?</p>
<p style="margin:0 0 16px 0;">That's the question we're making easier to answer.</p>
<p style="margin:0 0 24px 0;">With Curae, you'll be able to scan a skincare product, explore what's inside, and see how its ingredients align with your skin's needs.</p>
</td></tr>

<tr><td style="padding:0 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F0E0D7;border-radius:12px;">
<tr><td align="center" style="padding:22px 24px;font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;font-size:22px;line-height:1.3;font-style:italic;color:#0F0F0F;">Because your skincare decisions should be about your skin, not for your socials.</td></tr>
</table>
</td></tr>

<tr><td align="center" style="padding:32px 40px 8px 40px;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
<p style="margin:0 0 6px 0;font-size:12px;line-height:1.4;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#6B635A;">Your spot is secured</p>
{{POSITION_BLOCK}}
</td></tr>

<tr><td style="padding:24px 40px 0 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #E3E0DC;">
<tr><td style="padding:24px 0 8px 0;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:17px;line-height:1.4;font-weight:600;color:#0F0F0F;">Want to get involved before launch?</td></tr>
</table>
</td></tr>

<tr><td style="padding:0 40px;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.55;color:#0F0F0F;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td width="34" valign="top" style="padding:10px 0;"><div style="width:24px;height:24px;border-radius:12px;background-color:#A35F42;color:#FAF8F5;font-size:13px;font-weight:600;line-height:24px;text-align:center;">1</div></td>
<td valign="top" style="padding:10px 0;"><strong>Get early access:</strong> Reply TESTER to be considered for our testing group.</td>
</tr>
<tr>
<td width="34" valign="top" style="padding:10px 0;"><div style="width:24px;height:24px;border-radius:12px;background-color:#A35F42;color:#FAF8F5;font-size:13px;font-weight:600;line-height:24px;text-align:center;">2</div></td>
<td valign="top" style="padding:10px 0;"><strong>Follow the journey:</strong> Find us at <a style="color:#0F0F0F;text-decoration:none;font-weight:600;cursor:text;">@curae.app</a> on Instagram and TikTok.</td>
</tr>
<tr>
<td width="34" valign="top" style="padding:10px 0;"><div style="width:24px;height:24px;border-radius:12px;background-color:#A35F42;color:#FAF8F5;font-size:13px;font-weight:600;line-height:24px;text-align:center;">3</div></td>
<td valign="top" style="padding:10px 0;"><strong>Help shape Curae:</strong> Hit reply and tell us what you wish you knew before buying a skincare product, or a feature you'd want at launch or later. I read every one.</td>
</tr>
</table>
</td></tr>

<tr><td style="padding:20px 40px 0 40px;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#0F0F0F;">
<p style="margin:0 0 16px 0;">We're building Curae for people who want to understand what they're putting on their skin, without all the guesswork.</p>
<p style="margin:0 0 16px 0;">Glad you're here.</p>
<p style="margin:0 0 4px 0;">Ethan Jones<br><span style="color:#6B635A;">Founder, Curae</span></p>
</td></tr>

<tr><td align="center" style="padding:28px 40px 36px 40px;">
<p style="margin:0;padding-top:24px;border-top:1px solid #E3E0DC;font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;font-size:19px;line-height:1.35;font-style:italic;color:#6B635A;">Know what's in it, and if it fits you, before it touches your skin.</p>
</td></tr>

</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
<tr><td align="center" style="padding:20px 12px 0 12px;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#6B635A;">
Curae · <a href="{{UNSUBSCRIBE_URL}}" style="color:#6B635A;text-decoration:underline;">Unsubscribe</a> · <a href="https://loremcurae.com/privacy" style="color:#6B635A;text-decoration:underline;">Privacy</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
`;
