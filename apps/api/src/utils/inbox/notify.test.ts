import assert from 'node:assert/strict';
import { test } from 'node:test';

import { shouldNotify } from '@/utils/inbox/notify.js';

test('shouldNotify skips missing recipient and the actor', () => {
  assert.equal(shouldNotify(null, 'actor'), false);
  assert.equal(shouldNotify(undefined, 'actor'), false);
  assert.equal(shouldNotify('', 'actor'), false);
  assert.equal(shouldNotify('actor', 'actor'), false);
  assert.equal(shouldNotify('other', 'actor'), true);
});
