import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  AttachmentKind,
  AVATAR_MAX_BYTES,
  avatarObjectKey,
  isAvatarContentType,
  isIssueContentType,
  issueObjectKey,
  normalizeContentType,
} from '@relay/shared/constants/attachment.constant';
import { parseIntentInput } from '@/utils/storage/attachment.js';

test('object keys are server-chosen and namespaced', () => {
  assert.equal(avatarObjectKey('user-1', 'att-1'), 'avatars/user-1/att-1');
  assert.equal(
    issueObjectKey('org-1', 'issue-1', 'att-1'),
    'orgs/org-1/issues/issue-1/att-1',
  );
});

test('content types ignore charset parameters', () => {
  assert.equal(normalizeContentType('text/plain; charset=utf-8'), 'text/plain');
  assert.equal(isAvatarContentType('image/png'), true);
  assert.equal(isAvatarContentType('application/pdf'), false);
  assert.equal(isIssueContentType('application/pdf'), true);
});

test('parseIntentInput rejects oversize avatars and path-like names', () => {
  assert.throws(
    () =>
      parseIntentInput(
        { contentType: 'image/png', byteSize: AVATAR_MAX_BYTES + 1, fileName: 'a.png' },
        AttachmentKind.AVATAR,
      ),
    /2MB/,
  );
  assert.throws(
    () =>
      parseIntentInput(
        { contentType: 'image/png', byteSize: 10, fileName: '../secret.png' },
        AttachmentKind.AVATAR,
      ),
    /file name/i,
  );
});
