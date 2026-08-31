import nodemailer from 'nodemailer';

import { config } from '@/config.js';

export type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export function isSmtpConfigured(): boolean {
  return Boolean(config.smtp.host);
}

export async function sendMail(message: MailPayload): Promise<void> {
  if (!isSmtpConfigured()) {
    if (config.isProduction) {
      console.warn(`[mail] SMTP_HOST unset; skipped mail to ${message.to}`);
      return;
    }
    console.log(
      `[mail] to=${message.to} subject=${message.subject}\n${message.text}`,
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: config.smtp.user
      ? { user: config.smtp.user, pass: config.smtp.pass }
      : undefined,
  });

  await transporter.sendMail({
    from: config.smtp.from || config.smtp.user || config.smtp.host,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}
