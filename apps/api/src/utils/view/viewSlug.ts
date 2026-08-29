import { VIEW_SLUG_FALLBACK, VIEW_SLUG_MAX } from '@/constants/view.constant.js';

export function slugifyViewName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, VIEW_SLUG_MAX)
    .replace(/-+$/, '');
  return slug || VIEW_SLUG_FALLBACK;
}

export function allocateViewSlug(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;
  for (let n = 2; ; n += 1) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}
