import assert from 'node:assert/strict';
import { test } from 'node:test';

import { IssueEventType } from '@/constants/activity.constant.js';
import { eventPayload } from '@/utils/issue/issueEvent.js';

test('eventPayload omits unchanged fields and records from/to', () => {
  assert.deepEqual(eventPayload(IssueEventType.CREATED), {});
  assert.deepEqual(eventPayload(IssueEventType.STATUS, 'to-do', 'done'), {
    from: 'to-do',
    to: 'done',
  });
  assert.deepEqual(eventPayload(IssueEventType.ASSIGNEE, null, 'user-1'), {
    from: null,
    to: 'user-1',
  });
});
