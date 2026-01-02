import { serve } from "https://deno.land/std/http/server.ts";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

serve(async (req) => {
  const { type, record } = await req.json();

  if (type === "INSERT") {
    await resend.emails.send({
      from: "Lorem Curae <onboarding@yourdomain.com>",
      to: record.email,
      subject: "Welcome to the Lorem Curae waitlist",
      html: `<p>You're officially on the waitlist. We'll notify you when your wave opens.</p>`
    });
  }

  if (type === "UPDATE" && record.status === "invited") {
    await resend.emails.send({
      from: "Lorem Curae <access@yourdomain.com>",
      to: record.email,
      subject: "Your wave is open",
      html: `<p>Your wave is now open — click here to activate your account.</p>`
    });
  }

  return new Response("ok");
});
