import { api } from '@/lib/api';
import type { ApiAttachment } from '@/services/auth.service';

export type { ApiAttachment };

export async function createIssueAttachmentIntentApi(
  orgSlug: string,
  issueId: string,
  input: { contentType: string; byteSize: number; fileName: string },
) {
  return api<{ attachment: ApiAttachment; uploadUrl: string }>(
    `/orgs/${orgSlug}/issues/${issueId}/attachments/intent`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export async function completeIssueAttachmentApi(
  orgSlug: string,
  issueId: string,
  attachmentId: string,
) {
  return api<{ attachment: ApiAttachment }>(
    `/orgs/${orgSlug}/issues/${issueId}/attachments/${attachmentId}/complete`,
    { method: 'POST' },
  );
}

export async function listIssueAttachmentsApi(orgSlug: string, issueId: string) {
  return api<{ attachments: ApiAttachment[] }>(
    `/orgs/${orgSlug}/issues/${issueId}/attachments`,
  );
}

export async function deleteIssueAttachmentApi(
  orgSlug: string,
  issueId: string,
  attachmentId: string,
) {
  return api<{ id: string }>(
    `/orgs/${orgSlug}/issues/${issueId}/attachments/${attachmentId}`,
    { method: 'DELETE' },
  );
}
