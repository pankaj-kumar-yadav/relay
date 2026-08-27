import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isLabelColor } from '@/constants/label.constant.js';

test('isLabelColor accepts #RRGGBB and rejects other values', () => {
  assert.equal(isLabelColor('#2F80ED'), true);
  assert.equal(isLabelColor('#eb5757'), true);
  assert.equal(isLabelColor('red'), false);
  assert.equal(isLabelColor('#FFF'), false);
  assert.equal(isLabelColor('#2F80ED0'), false);
});
