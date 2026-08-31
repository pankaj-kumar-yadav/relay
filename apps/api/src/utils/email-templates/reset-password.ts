import { BRAND_NAME } from '@/constants/brand.constant.js';
import {
  RESET_PASSWORD_MAIL_SUBJECT,
  RESET_PASSWORD_TTL_MS,
} from '@/constants/mail.constant.js';
import {
  type RenderedEmail,
  renderTransactionalEmail,
  renderTransactionalText,
} from '@/utils/email-templates/layout.js';

const RESET_EXPIRY_HOURS = Math.round(RESET_PASSWORD_TTL_MS / (60 * 60 * 1000));

export function renderResetPasswordEmail(input: { url: string }): RenderedEmail {
  const heading = 'Reset your password';
  const expiry =
    RESET_EXPIRY_HOURS === 1 ? '1 hour' : `${RESET_EXPIRY_HOURS} hours`;
  const paragraphs = [
    `We received a request to reset the password for your ${BRAND_NAME} account.`,
    `This link expires in ${expiry}. If you didn't request a reset, you can ignore this email — your password will stay the same.`,
  ];
  const ctaLabel = 'Reset password';
  const footer = `This message was sent by ${BRAND_NAME}.`;

  return {
    subject: RESET_PASSWORD_MAIL_SUBJECT,
    text: renderTransactionalText({
      heading,
      paragraphs,
      ctaLabel,
      ctaUrl: input.url,
      footer,
    }),
    html: renderTransactionalEmail({
      preheader: `Reset your ${BRAND_NAME} password. This link expires in ${expiry}.`,
      heading,
      paragraphs,
      ctaLabel,
      ctaUrl: input.url,
      footer,
    }),
  };
}
