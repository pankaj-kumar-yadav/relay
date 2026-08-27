import assert from 'node:assert/strict';
import { test } from 'node:test';

import { IssueEventType } from '@/constants/activity.constant.js';
import { eventPayload, labelEventPayload } from '@/utils/issue/issueEvent.js';

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

test('labelEventPayload records added and removed names', () => {
  assert.deepEqual(
    labelEventPayload(
      [{ id: '1', name: 'Bug' }],
      [{ id: '2', name: 'Feature' }],
    ),
    {
      added: [{ id: '1', name: 'Bug' }],
      removed: [{ id: '2', name: 'Feature' }],
    },
  );
});
