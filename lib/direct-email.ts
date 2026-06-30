import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_KEY,
    pass: process.env.BREVO_SMTP_PASSWORD,
  },
});

export async function sendEmailViaSMTP(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({
      from: `"AIPATECH Energy" <noreply@aipatechenergy.com>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('SMTP Error:', error);
    return { success: false, error };
  }
}