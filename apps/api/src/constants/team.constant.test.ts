import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isTeamKey, normalizeTeamKey, TEAM_KEY_PATTERN } from './team.constant.js';

test('normalizeTeamKey uppercases and trims', () => {
  assert.equal(normalizeTeamKey('  core '), 'CORE');
});

test('isTeamKey accepts 2-10 uppercase alphanumeric keys', () => {
  assert.equal(isTeamKey('CORE'), true);
  assert.equal(isTeamKey('LMS'), true);
  assert.equal(isTeamKey('A'), false);
  assert.equal(isTeamKey('toolongkey1'), false);
  assert.equal(isTeamKey('core'), false);
  assert.equal(isTeamKey('C-1'), false);
  assert.equal(TEAM_KEY_PATTERN.test('ATLAS'), true);
});
