import nodemailer from 'nodemailer';
import { env } from '../config/env';

const isConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && !env.SMTP_USER.includes('your_email'));

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    })
  : null;

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!transporter) {
    // Dev mode: just print to console
    console.log(`📧 [EMAIL → ${to}] ${subject}`);
    return true;
  }
  await transporter.sendMail({ from: `"Nijer Bazaar" <${env.SMTP_USER}>`, to, subject, html });
  return true;
}