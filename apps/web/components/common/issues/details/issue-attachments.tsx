'use client';

import {
  ISSUE_CONTENT_TYPES,
  isAvatarContentType,
  normalizeContentType,
} from '@relay/shared/constants/attachment.constant';
import {
  useDeleteIssueAttachment,
  useIssueAttachments,
  useUploadIssueAttachment,
} from '@/hooks/use-attachments';
import { ApiError } from '@/lib/api';
import { ErrorCode } from '@relay/shared/constants/http.constant';
import type { ApiAttachment } from '@/services/attachments.service';
import { File, FileArchive, FileText, Paperclip, X } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';

function AttachmentThumb({ file }: { file: ApiAttachment }) {
   const contentType = normalizeContentType(file.contentType);
   const isImage = isAvatarContentType(contentType);
   const thumbClass =
      'size-8 shrink-0 rounded border border-border/50 bg-muted/40 object-cover';

   if (isImage && file.url) {
      return (
         // eslint-disable-next-line @next/next/no-img-element -- presigned S3 URL; not a static asset
         <img src={file.url} alt="" className={thumbClass} />
      );
   }

   const Icon =
      contentType === 'application/zip'
         ? FileArchive
         : contentType === 'application/pdf' || contentType === 'text/plain'
           ? FileText
           : File;

   return (
      <span className={`${thumbClass} inline-flex items-center justify-center text-muted-foreground`}>
         <Icon className="size-4" aria-hidden />
      </span>
   );
}

export function IssueAttachments({
   orgSlug,
   issueId,
}: {
   orgSlug: string;
   issueId: string;
}) {
   const fileRef = useRef<HTMLInputElement>(null);
   const { data: attachments = [] } = useIssueAttachments(orgSlug, issueId);
   const upload = useUploadIssueAttachment(orgSlug, issueId);
   const remove = useDeleteIssueAttachment(orgSlug, issueId);

   async function onPick(file: File | undefined) {
      if (!file) return;
      try {
         await upload.mutateAsync(file);
         toast.success('File attached');
      } catch (err) {
         const code = err instanceof ApiError ? err.code : '';
         toast.error(
            code === ErrorCode.STORAGE_UNCONFIGURED
               ? 'File storage is not configured'
               : err instanceof ApiError
                 ? err.message
                 : 'Could not attach file',
         );
      }
   }

   return (
      <>
         <input
            ref={fileRef}
            type="file"
            accept={ISSUE_CONTENT_TYPES.join(',')}
            className="sr-only"
            onChange={(event) => {
               const file = event.target.files?.[0];
               event.target.value = '';
               void onPick(file);
            }}
         />
         <button
            type="button"
            className="hover:text-foreground"
            aria-label="Attach file"
            disabled={upload.isPending}
            onClick={() => fileRef.current?.click()}
         >
            <Paperclip className="size-4" />
         </button>
         {attachments.length > 0 ? (
            <ul className="basis-full space-y-1.5 text-sm text-foreground">
               {attachments.map((file) => (
                  <li key={file.id} className="flex items-center gap-2 min-w-0">
                     {file.url ? (
                        <a
                           href={file.url}
                           target="_blank"
                           rel="noreferrer"
                           className="flex items-center gap-2 min-w-0 hover:underline"
                        >
                           <AttachmentThumb file={file} />
                           <span className="truncate">{file.fileName}</span>
                        </a>
                     ) : (
                        <span className="flex items-center gap-2 min-w-0">
                           <AttachmentThumb file={file} />
                           <span className="truncate">{file.fileName}</span>
                        </span>
                     )}
                     <button
                        type="button"
                        className="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
                        aria-label={`Remove ${file.fileName}`}
                        disabled={remove.isPending}
                        onClick={() => {
                           void remove.mutateAsync(file.id).then(
                              () => toast.success('File removed'),
                              () => toast.error('Could not remove file'),
                           );
                        }}
                     >
                        <X className="size-3.5" />
                     </button>
                  </li>
               ))}
            </ul>
         ) : null}
      </>
   );
}
