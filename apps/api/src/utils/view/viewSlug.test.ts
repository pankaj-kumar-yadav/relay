import assert from 'node:assert/strict';
import { test } from 'node:test';

import { allocateViewSlug, slugifyViewName } from './viewSlug.js';

test('slugifyViewName kebab-cases a view name', () => {
  assert.equal(slugifyViewName(' Active bugs '), 'active-bugs');
  assert.equal(slugifyViewName('Completed issues'), 'completed-issues');
  assert.equal(slugifyViewName('LMS issues'), 'lms-issues');
});

test('slugifyViewName falls back when the name has no letters', () => {
  assert.equal(slugifyViewName('???'), 'view');
  assert.equal(slugifyViewName(''), 'view');
});

test('allocateViewSlug keeps the base when free', () => {
  assert.equal(allocateViewSlug('active-bugs', new Set()), 'active-bugs');
});

test('allocateViewSlug suffixes on collision', () => {
  assert.equal(
    allocateViewSlug('active-bugs', new Set(['active-bugs'])),
    'active-bugs-2',
  );
  assert.equal(
    allocateViewSlug('active-bugs', new Set(['active-bugs', 'active-bugs-2'])),
    'active-bugs-3',
  );
});
