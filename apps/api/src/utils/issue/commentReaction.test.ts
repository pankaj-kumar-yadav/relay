import assert from 'node:assert/strict';
import { test } from 'node:test';

import { aggregateCommentReactions, isCommentReactionEmoji } from '@/utils/issue/commentReaction.js';

test('isCommentReactionEmoji accepts a single unicode emoji', () => {
  assert.equal(isCommentReactionEmoji('👍'), true);
  assert.equal(isCommentReactionEmoji('💜'), true);
  assert.equal(isCommentReactionEmoji('👋🏻'), true);
  assert.equal(isCommentReactionEmoji('👨‍💻'), true);
});

test('isCommentReactionEmoji accepts flags and keycap emoji', () => {
  assert.equal(isCommentReactionEmoji('🇺🇸'), true);
  assert.equal(isCommentReactionEmoji('3️⃣'), true);
});

test('isCommentReactionEmoji rejects empty, text, and multiple graphemes', () => {
  assert.equal(isCommentReactionEmoji(''), false);
  assert.equal(isCommentReactionEmoji('not-an-emoji'), false);
  assert.equal(isCommentReactionEmoji('👍👍'), false);
  assert.equal(isCommentReactionEmoji('a'), false);
});

test('aggregateCommentReactions groups by first-seen emoji and marks the current user', () => {
  assert.deepEqual(
    aggregateCommentReactions(
      [
        { emoji: '💜', userId: 'b' },
        { emoji: '👍', userId: 'a' },
        { emoji: '💜', userId: 'a' },
      ],
      'a',
    ),
    [
      { emoji: '💜', count: 2, reacted: true },
      { emoji: '👍', count: 1, reacted: true },
    ],
  );
});
