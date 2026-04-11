import nodemailer from "nodemailer";

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

export async function sendWelcomeEmail({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const fromEmail = process.env.SMTP_EMAIL;

  if (!fromEmail || !process.env.SMTP_PASSWORD) {
    throw new Error("SMTP_EMAIL and SMTP_PASSWORD must be set");
  }

  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"Vibe Coding" <${fromEmail}>`,
    to: email,
    subject: "Welcome to Vibe Coding — Your Account is Ready",
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="margin: 0 0 16px; color: #0f172a;">Welcome to Vibe Coding</h2>
        <p style="color: #475569; line-height: 1.6;">Hi ${name},</p>
        <p style="color: #475569; line-height: 1.6;">Your account has been created. Use the credentials below to log in:</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px; color: #475569;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 0; color: #475569;"><strong>Temporary Password:</strong> <code style="background: #fef3c7; padding: 2px 6px; border-radius: 4px; font-size: 14px;">${password}</code></p>
        </div>
        <p style="color: #475569; line-height: 1.6;">You will be asked to set a new password on your first login.</p>
        <a href="${siteUrl}/login" style="display: inline-block; background: #fcd34d; color: #0f172a; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">Log In Now</a>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">Vibe Coding Learning Hub</p>
      </div>
    `,
  });
}
