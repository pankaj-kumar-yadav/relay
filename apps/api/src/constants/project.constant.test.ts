import assert from 'node:assert/strict';
import { test } from 'node:test';

import { IssueStatus } from './issue.js';
import {
  DEFAULT_PROJECT_HEALTH,
  DEFAULT_PROJECT_STATUS,
  PROJECT_ICON_MAX,
  isProjectHealth,
  isProjectStatus,
  ProjectHealth,
} from './project.constant.js';

test('default project status is to-do and health is no-update', () => {
  assert.equal(DEFAULT_PROJECT_STATUS, IssueStatus.TO_DO);
  assert.equal(DEFAULT_PROJECT_HEALTH, ProjectHealth.NO_UPDATE);
});

test('isProjectStatus reuses issue status ids', () => {
  assert.equal(isProjectStatus('to-do'), true);
  assert.equal(isProjectStatus('in-progress'), true);
  assert.equal(isProjectStatus('unknown'), false);
});

test('isProjectHealth accepts Circle health ids only', () => {
  assert.equal(isProjectHealth('on-track'), true);
  assert.equal(isProjectHealth('at-risk'), true);
  assert.equal(isProjectHealth('healthy'), false);
});

test('PROJECT_ICON_MAX is 32', () => {
  assert.equal(PROJECT_ICON_MAX, 32);
});
