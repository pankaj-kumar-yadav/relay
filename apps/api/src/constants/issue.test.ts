import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DEFAULT_ISSUE_PRIORITY,
  DEFAULT_ISSUE_STATUS,
  ISSUE_STATUS_CATEGORY,
  IssuePriority,
  IssueStatus,
  isIssuePriority,
  isIssueStatus,
  statusesForCategories,
} from './issue.js';

test('default status is to-do and maps to unstarted', () => {
  assert.equal(DEFAULT_ISSUE_STATUS, IssueStatus.TO_DO);
  assert.equal(ISSUE_STATUS_CATEGORY[DEFAULT_ISSUE_STATUS], 'unstarted');
});

test('default priority is no-priority', () => {
  assert.equal(DEFAULT_ISSUE_PRIORITY, IssuePriority.NO_PRIORITY);
});

test('isIssueStatus accepts Circle ids only', () => {
  assert.equal(isIssueStatus('to-do'), true);
  assert.equal(isIssueStatus('unknown'), false);
});

test('isIssuePriority accepts Circle ids only', () => {
  assert.equal(isIssuePriority('urgent'), true);
  assert.equal(isIssuePriority('critical'), false);
});

test('statusesForCategories returns active (started) ids', () => {
  const ids = statusesForCategories(['started']);
  assert.ok(ids.includes(IssueStatus.IN_PROGRESS));
  assert.ok(!ids.includes(IssueStatus.BACKLOG));
});

test('statusesForCategories returns backlog + triage ids', () => {
  const ids = statusesForCategories(['backlog', 'triage']);
  assert.ok(ids.includes(IssueStatus.BACKLOG));
  assert.ok(ids.includes(IssueStatus.TRIAGE));
  assert.ok(!ids.includes(IssueStatus.IN_PROGRESS));
});
