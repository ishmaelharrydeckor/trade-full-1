// app/api/contact/route.ts
import { NextResponse } from "next/server";

// Best-effort in-memory rate limiting map for Serverless functions
const ipCache = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = 5;
  const timeframe = 60 * 60 * 1000; // 1 hour
  
  const record = ipCache.get(ip);
  if (!record) {
    ipCache.set(ip, { count: 1, resetTime: now + timeframe });
    return true;
  }
  
  if (now > record.resetTime) {
    ipCache.set(ip, { count: 1, resetTime: now + timeframe });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count += 1;
  return true;
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: Request) {
  try {
    // 1. Get client IP for rate limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown-ip";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please try again in an hour." },
        { status: 429 }
      );
    }

    // 2. Parse request payload
    const body = await req.json();
    const { name, email, subject, message, website } = body;

    // 3. Honeypot check - if filled, silently succeed (treat as spam bot)
    if (website && website.trim() !== "") {
      console.warn("Honeypot field triggered. Silent success returned.");
      return NextResponse.json({ ok: true });
    }

    // 4. Validate inputs are present
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { ok: false, error: "All required fields must be completed." },
        { status: 400 }
      );
    }

    // 5. Validate lengths (server-side limits)
    if (name.length > 100) {
      return NextResponse.json({ ok: false, error: "Name must be 100 characters or less." }, { status: 400 });
    }
    if (email.length > 254) {
      return NextResponse.json({ ok: false, error: "Email must be 254 characters or less." }, { status: 400 });
    }
    if (subject.length > 200) {
      return NextResponse.json({ ok: false, error: "Subject must be 200 characters or less." }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ ok: false, error: "Message must be 5000 characters or less." }, { status: 400 });
    }

    // 6. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Invalid email format." },
        { status: 400 }
      );
    }

    // 7. HTML escape user inputs to prevent HTML/XSS injection in the email template
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

    // 8. Prepare target recipient and Resend API Call
    const recipientEmail = process.env.CONTACT_FORM_RECIPIENT || "tradejernal@gmail.com";
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error("Missing RESEND_API_KEY environment variable.");
      return NextResponse.json(
        { ok: false, error: "Email configuration error. Please contact us directly at hello@tradejernal.com." },
        { status: 500 }
      );
    }

    // Email HTML template matching specified guidelines
    const emailHtml = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#f5f5f0;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f0;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border:1px solid #e5e5e0;border-radius:8px;max-width:560px;width:100%;">
          <tr>
            <td style="padding:32px 40px;border-bottom:1px solid #f0f0eb;">
              <span style="font-size:18px;color:#0a0e17;font-style:italic;">Trade·Journal Contact Form</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.05em;">From</p>
              <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:15px;color:#0a0e17;">
                <strong>${safeName}</strong><br>
                <a href="mailto:${safeEmail}" style="color:#0a0e17;">${safeEmail}</a>
              </p>
              
              <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.05em;">Subject</p>
              <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:15px;color:#0a0e17;">
                ${safeSubject}
              </p>
              
              <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.05em;">Message</p>
              <p style="margin:0;font-family:Arial,sans-serif;font-size:15px;color:#0a0e17;line-height:1.6;white-space:pre-wrap;">
                ${safeMessage}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;background-color:#fafaf7;border-top:1px solid #f0f0eb;border-radius:0 0 8px 8px;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#888;">
                Sent via the contact form at tradejernal.com. Reply directly to respond to ${safeName}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send using standard fetch calls to Resend REST API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Trade·Journal Contact <noreply@tradejernal.com>",
        to: recipientEmail,
        reply_to: email, // reply_to submitter's email
        subject: `Contact form: ${subject}`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Resend API responded with an error:", errorData);
      return NextResponse.json(
        { ok: false, error: "Failed to dispatch email via Resend." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact Form API Error:", error);
    return NextResponse.json(
      { ok: false, error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
