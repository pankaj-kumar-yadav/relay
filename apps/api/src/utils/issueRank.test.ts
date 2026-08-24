import assert from 'node:assert/strict';
import { test } from 'node:test';

import { rankBetween } from './issueRank.js';

test('rankBetween with no neighbors returns a middle rank', () => {
  const rank = rankBetween(null, null);
  assert.equal(typeof rank, 'string');
  assert.ok(rank.length > 0);
});

test('rank after last sorts after the previous rank', () => {
  const first = rankBetween(null, null);
  const second = rankBetween(first, null);
  assert.ok(first < second);
});

test('rank before first sorts before the next rank', () => {
  const first = rankBetween(null, null);
  const before = rankBetween(null, first);
  assert.ok(before < first);
});

test('rank between two neighbors sits strictly in the middle', () => {
  const a = rankBetween(null, null);
  const c = rankBetween(a, null);
  const b = rankBetween(a, c);
  assert.ok(a < b);
  assert.ok(b < c);
});

test('repeated appends stay strictly increasing', () => {
  const ranks = [rankBetween(null, null)];
  for (let i = 0; i < 20; i++) {
    ranks.push(rankBetween(ranks[ranks.length - 1]!, null));
  }
  for (let i = 1; i < ranks.length; i++) {
    assert.ok(ranks[i - 1]! < ranks[i]!, `${ranks[i - 1]} !< ${ranks[i]}`);
  }
});
