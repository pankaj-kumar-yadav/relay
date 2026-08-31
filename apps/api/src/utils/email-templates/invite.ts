import { BRAND_NAME } from '@/constants/brand.constant.js';
import { INVITE_EXPIRY_MS } from '@/constants/invite.js';
import { inviteMailSubject } from '@/constants/mail.constant.js';
import {
  type RenderedEmail,
  renderTransactionalEmail,
  renderTransactionalText,
} from '@/utils/email-templates/layout.js';

const INVITE_EXPIRY_DAYS = Math.round(INVITE_EXPIRY_MS / (24 * 60 * 60 * 1000));

export function renderInviteEmail(input: {
  orgName: string;
  url: string;
}): RenderedEmail {
  const heading = `You're invited to ${input.orgName}`;
  const paragraphs = [
    `Join ${input.orgName} on ${BRAND_NAME} to start collaborating with the team.`,
    `This invite expires in ${INVITE_EXPIRY_DAYS} days.`,
  ];
  const ctaLabel = 'Accept invite';
  const footer = `If you weren't expecting this invitation, you can ignore this email. — ${BRAND_NAME}`;

  return {
    subject: inviteMailSubject(input.orgName),
    text: renderTransactionalText({
      heading,
      paragraphs,
      ctaLabel,
      ctaUrl: input.url,
      footer,
    }),
    html: renderTransactionalEmail({
      preheader: `Join ${input.orgName} on ${BRAND_NAME}`,
      heading,
      paragraphs,
      ctaLabel,
      ctaUrl: input.url,
      footer,
    }),
  };
}
