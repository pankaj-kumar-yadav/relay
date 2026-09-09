import {
  InboxNotificationCopy,
  type NotificationTypeValue,
} from '@relay/shared/constants/inbox.constant';
import { config } from '@/config.js';
import { issueMailPath } from '@/constants/mail.constant.js';
import { prisma } from '@/db.js';
import { renderInboxNotificationEmail } from '@/utils/email-templates/inbox-notification.js';
import { sendMail, type MailPayload } from '@/utils/mailer.js';

export type InboxMailJob = {
  userId: string;
  type: NotificationTypeValue;
};

export async function deliverInboxMails(input: {
  orgSlug: string;
  identifier: string;
  issueTitle: string;
  actorName: string;
  jobs: InboxMailJob[];
  loadRecipients?: () => Promise<{ id: string; email: string }[]>;
  send?: (message: MailPayload) => Promise<void>;
}): Promise<void> {
  if (input.jobs.length === 0) return;

  try {
    const send = input.send ?? sendMail;
    const recipients = input.loadRecipients
      ? await input.loadRecipients()
      : await prisma.user.findMany({
          where: { id: { in: [...new Set(input.jobs.map((job) => job.userId))] } },
          select: { id: true, email: true },
        });
    const emailById = new Map(recipients.map((row) => [row.id, row.email]));
    const issueUrl = `${config.webOrigin}${issueMailPath(input.orgSlug, input.identifier)}`;

    for (const job of input.jobs) {
      const to = emailById.get(job.userId);
      if (!to) continue;
      if (!(job.type in InboxNotificationCopy)) continue;
      const mail = renderInboxNotificationEmail({
        actorName: input.actorName,
        type: job.type,
        issueTitle: input.issueTitle,
        issueUrl,
        identifier: input.identifier,
      });
      try {
        await send({ to, ...mail });
      } catch (err) {
        console.error('[mail] inbox notification failed', err);
      }
    }
  } catch (err) {
    console.error('[mail] inbox notification batch failed', err);
  }
}
