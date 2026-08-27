const CHARSET = '0123456789abcdefghijklmnopqrstuvwxyz';

function charIndex(ch: string): number {
  const i = CHARSET.indexOf(ch);
  return i < 0 ? 0 : i;
}

/** Lexicographic rank between two neighbors. Null = open end of the list. */
export function rankBetween(before: string | null, after: string | null): string {
  if (before != null && after != null && !(before < after)) {
    throw new Error('before must sort before after');
  }

  if (before == null && after == null) {
    return 'n';
  }

  const left = before ?? '';
  const right = after ?? '';
  let result = '';
  let i = 0;

  for (;;) {
    const a = i < left.length ? charIndex(left[i]!) : -1;
    const b = i < right.length ? charIndex(right[i]!) : CHARSET.length;
    i += 1;

    if (b - a > 1) {
      const mid = Math.floor((a + b) / 2);
      return result + CHARSET[mid]!;
    }

    if (a >= 0) {
      result += CHARSET[a]!;
    } else if (b > 0) {
      result += CHARSET[0]!;
    } else {
      result += CHARSET[Math.floor(CHARSET.length / 2)]!;
    }

    if (i > 64) {
      return result + 'n';
    }
  }
}
