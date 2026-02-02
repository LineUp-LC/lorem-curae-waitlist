import type { VercelRequest, VercelResponse } from '@vercel/node';

// ============================================================================
// POST /api/admin/send-test-email
// ============================================================================
//
// Sends a test email to verify deliverability and provider reliability.
// This is an admin-only endpoint.
//
// Headers:
//   Authorization: Bearer <ADMIN_SECRET>
//
// Body:
//   {
//     email: string,
//     template?: string   // optional, defaults to 'test_email'
//   }
//
// Response:
//   { sent: true, email: string, template: string }
//
// Environment variables required:
//   - ADMIN_SECRET
//   - RESEND_API_KEY
//
// ============================================================================

const FROM_EMAIL = 'Lorem Curae <hello@loremcurae.com>';

const TEMPLATES: Record<string, { subject: string; html: string }> = {
  test_email: {
    subject: 'Test Email from Lorem Curae',
    html: `<p>Hi there,</p>
<p>This is a test email from the Lorem Curae admin panel.</p>
<p><strong>Message:</strong> Test email sent successfully.</p>
<p>If you received this email, your email configuration is working correctly.</p>
<p>— The Lorem Curae Team</p>`,
  },
  deliverability_test: {
    subject: 'Deliverability Test - Lorem Curae',
    html: `<p>Hi there,</p>
<p>This is a deliverability test email from Lorem Curae.</p>
<p>This email was sent to verify that emails are being delivered correctly to your inbox.</p>
<p><strong>Timestamp:</strong> {{TIMESTAMP}}</p>
<p>— The Lorem Curae Team</p>`,
  },
  template_test: {
    subject: 'Template Rendering Test - Lorem Curae',
    html: `<p>Hi there,</p>
<p>This is a template rendering test from Lorem Curae.</p>
<p>If you can read this message with proper formatting, template rendering is working correctly.</p>
<ul>
  <li><strong>Bold text</strong></li>
  <li><em>Italic text</em></li>
  <li><a href="https://loremcurae.com">Link test</a></li>
</ul>
<p>— The Lorem Curae Team</p>`,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // -------------------------------------------------------------------------
    // STEP: Validate request method
    // -------------------------------------------------------------------------
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate environment variables
    // -------------------------------------------------------------------------
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      console.error('[send-test-email] Missing ADMIN_SECRET');
      return res.status(500).json({ error: 'Server misconfigured: missing ADMIN_SECRET' });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('[send-test-email] Missing RESEND_API_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate admin authorization
    // -------------------------------------------------------------------------
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      console.warn('[send-test-email] Unauthorized request attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate request body
    // -------------------------------------------------------------------------
    const body = req.body as { email?: unknown; template?: unknown } | undefined;

    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { email, template: templateParam } = body;

    // Validate email
    if (email === undefined || email === null) {
      return res.status(400).json({ error: 'email is required' });
    }

    if (typeof email !== 'string') {
      return res.status(400).json({ error: 'email must be a string' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      return res.status(400).json({ error: 'email cannot be empty' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate template
    let templateName = 'test_email';
    if (templateParam !== undefined) {
      if (typeof templateParam !== 'string') {
        return res.status(400).json({ error: 'template must be a string' });
      }
      const trimmedTemplate = templateParam.trim();
      if (trimmedTemplate) {
        templateName = trimmedTemplate;
      }
    }

    // Get template
    const template = TEMPLATES[templateName];
    if (!template) {
      return res.status(400).json({
        error: `Unknown template: ${templateName}`,
        available_templates: Object.keys(TEMPLATES),
      });
    }

    // -------------------------------------------------------------------------
    // STEP: Send test email via Resend
    // -------------------------------------------------------------------------
    const timestamp = new Date().toISOString();
    const htmlWithTimestamp = template.html.replace(/\{\{TIMESTAMP\}\}/g, timestamp);

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: trimmedEmail,
        subject: template.subject,
        html: htmlWithTimestamp,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('[send-test-email] Email sending failed:', emailResponse.status, errorText);
      return res.status(500).json({ error: 'Email sending failed', details: errorText });
    }

    const emailResult = await emailResponse.json();

    // -------------------------------------------------------------------------
    // STEP: Log the action
    // -------------------------------------------------------------------------
    console.log(JSON.stringify({
      level: 'info',
      event: 'test_email_sent',
      email: trimmedEmail,
      template: templateName,
      provider_message_id: emailResult.id,
      timestamp,
    }));

    // -------------------------------------------------------------------------
    // STEP: Return success
    // -------------------------------------------------------------------------
    return res.status(200).json({
      sent: true,
      email: trimmedEmail,
      template: templateName,
    });

  } catch (error: unknown) {
    console.error('[send-test-email] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
