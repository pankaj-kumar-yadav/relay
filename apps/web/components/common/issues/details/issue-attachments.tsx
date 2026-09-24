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
import { File, FileArchive, FileText, Loader2, Paperclip, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

const thumbClass =
   'size-8 shrink-0 rounded border border-border/50 bg-muted/40 object-cover';

function FileTypeIcon({ contentType }: { contentType: string }) {
   const Icon =
      contentType === 'application/zip'
         ? FileArchive
         : contentType === 'application/pdf' || contentType === 'text/plain'
           ? FileText
           : File;

   return (
      <span
         className={`${thumbClass} inline-flex items-center justify-center text-muted-foreground`}
      >
         <Icon className="size-4" aria-hidden />
      </span>
   );
}

function AttachmentThumb({ file }: { file: ApiAttachment }) {
   const contentType = normalizeContentType(file.contentType);
   const isImage = isAvatarContentType(contentType);
   const [broken, setBroken] = useState(false);

   if (isImage && file.url && !broken) {
      return (
         // eslint-disable-next-line @next/next/no-img-element -- presigned S3 URL; not a static asset
         <img
            src={file.url}
            alt={file.fileName}
            className={thumbClass}
            onError={() => setBroken(true)}
         />
      );
   }

   return <FileTypeIcon contentType={contentType} />;
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
   const busy = upload.isPending || remove.isPending;

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
            className="hover:text-foreground disabled:opacity-50"
            aria-label={upload.isPending ? 'Uploading file' : 'Attach file'}
            aria-busy={upload.isPending}
            disabled={busy}
            onClick={() => fileRef.current?.click()}
         >
            {upload.isPending ? (
               <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
               <Paperclip className="size-4" />
            )}
         </button>
         {attachments.length > 0 ? (
            <ul
               className={`basis-full space-y-1.5 text-sm text-foreground ${
                  upload.isPending ? 'opacity-60' : ''
               }`}
               aria-busy={upload.isPending || undefined}
            >
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
                        className="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-50"
                        aria-label={`Remove ${file.fileName}`}
                        disabled={busy}
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
