import type { VercelRequest, VercelResponse } from '@vercel/node';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'Lorem Curae <hello@loremcurae.com>';

const templates = {
  waitlist_signup: {
    subject: "You're on the Lorem Curae waitlist",
    html: `<p>Hi there,</p>
<p>Thanks for joining the Lorem Curae waitlist — your spot is saved.</p>
<p>We'll keep you updated as we roll out new features and open access to more users. When you're ready to sign in, just return to the waitlist page and request a secure magic link. We'll send it to your email instantly.</p>
<p>Thanks for being part of this journey.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  early_access_interest: {
    subject: "You're on the tester access list",
    html: `<p>Hi there,</p>
<p>You're officially on the tester access list for Lorem Curae.</p>
<p>When tester access opens, you'll be able to sign in by requesting a secure magic link from the waitlist page. That link will take you directly to the tester experience where you can test features and share feedback.</p>
<p>We'll notify you as soon as your access is ready.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  non_tester_login: {
    subject: "You're signed in — here's what that means",
    html: `<p>Hi there,</p>
<p>You just signed in using your secure magic link. This confirms your email and gives you access to your account.</p>
<p>Right now, your account is still on the waitlist, so you'll continue to see the waitlist page when you sign in. We'll notify you as soon as tester access opens for your account.</p>
<p>Thanks for your patience — we're building something special.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  early_access_open: {
    subject: "Great news — your tester access is now open",
    html: `<p>Hi there,</p>
<p>Great news — your tester access to Lorem Curae is now open.</p>
<p>You can sign in using your email to access the tester experience and explore new features.</p>
<p>Thanks for being part of this journey.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  tester_access_open: {
    subject: "Great news — your tester access is now open",
    html: `<p>Hi there,</p>
<p>Great news — your tester access to Lorem Curae is now open.</p>
<p>You can sign in using your email to access the tester experience and test features.</p>
<p>Thanks for being part of this journey.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, type } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const template = templates[type as keyof typeof templates];

  if (!template) {
    return res.status(400).json({ error: 'Invalid email type' });
  }

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: template.subject,
        html: template.html,
      }),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
