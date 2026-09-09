import { BRAND_NAME } from '@relay/shared/constants/brand.constant';
import {
  InboxNotificationCopy,
  type NotificationTypeValue,
} from '@relay/shared/constants/inbox.constant';
import {
  type RenderedEmail,
  renderTransactionalEmail,
  renderTransactionalText,
} from '@/utils/email-templates/layout.js';

export function renderInboxNotificationEmail(input: {
  actorName: string;
  type: NotificationTypeValue;
  issueTitle: string;
  issueUrl: string;
  identifier: string;
}): RenderedEmail {
  const copy = InboxNotificationCopy[input.type];
  const heading = `${input.actorName} ${copy}`;
  const paragraphs = [input.issueTitle];
  const ctaLabel = 'Open issue';
  const footer = `This message was sent by ${BRAND_NAME}.`;

  return {
    subject: `${input.identifier} · ${heading}`,
    text: renderTransactionalText({
      heading,
      paragraphs,
      ctaLabel,
      ctaUrl: input.issueUrl,
      footer,
    }),
    html: renderTransactionalEmail({
      preheader: heading,
      heading,
      paragraphs,
      ctaLabel,
      ctaUrl: input.issueUrl,
      footer,
    }),
  };
}
