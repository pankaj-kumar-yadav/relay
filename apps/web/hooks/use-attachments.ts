'use client';

import { queryKeys } from '@/lib/query-keys';
import { putAttachmentBytesApi } from '@/services/auth.service';
import {
  completeIssueAttachmentApi,
  createIssueAttachmentIntentApi,
  deleteIssueAttachmentApi,
  listIssueAttachmentsApi,
} from '@/services/attachments.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useIssueAttachments(orgSlug: string | undefined, issueId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.issues.attachments(orgSlug ?? '', issueId ?? ''),
    queryFn: async () => {
      const { attachments } = await listIssueAttachmentsApi(orgSlug!, issueId!);
      return attachments;
    },
    enabled: Boolean(orgSlug && issueId),
  });
}

export function useUploadIssueAttachment(orgSlug: string, issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const intent = await createIssueAttachmentIntentApi(orgSlug, issueId, {
        contentType: file.type,
        byteSize: file.size,
        fileName: file.name,
      });
      await putAttachmentBytesApi(intent.uploadUrl, file);
      return completeIssueAttachmentApi(orgSlug, issueId, intent.attachment.id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.issues.attachments(orgSlug, issueId),
      });
    },
  });
}

export function useDeleteIssueAttachment(orgSlug: string, issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) =>
      deleteIssueAttachmentApi(orgSlug, issueId, attachmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.issues.attachments(orgSlug, issueId),
      });
    },
  });
}
