import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseIssueRef } from './issueRef.js';

test('parseIssueRef reads display ids as team key + number', () => {
  assert.deepEqual(parseIssueRef('CORE-12'), {
    kind: 'identifier',
    teamKey: 'CORE',
    number: 12,
  });
});

test('parseIssueRef reads UUIDs', () => {
  const id = '550e8400-e29b-41d4-a716-446655440000';
  assert.deepEqual(parseIssueRef(id), { kind: 'id', id });
});

test('parseIssueRef rejects junk', () => {
  assert.equal(parseIssueRef('not-an-id'), null);
  assert.equal(parseIssueRef(''), null);
});
