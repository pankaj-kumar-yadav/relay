import { orgPath } from '@/constants/org.constant';

/** Circle leftover surfaces that are not first-class domains yet. */
export const WorkspacePath = {
  INBOX: '/inbox',
  REVIEWS: '/reviews',
  REVIEWS_CREATED: '/reviews/created',
  AGENT: '/agent',
  INITIATIVES: '/initiatives',
} as const;

export function reviewPath(orgSlug: string, reviewId: string, suffix = ''): string {
  return orgPath(orgSlug, `/review/${reviewId}${suffix}`);
}

export function reviewsPath(orgSlug: string): string {
  return orgPath(orgSlug, WorkspacePath.REVIEWS);
}

export function reviewsCreatedPath(orgSlug: string): string {
  return orgPath(orgSlug, WorkspacePath.REVIEWS_CREATED);
}

export function initiativePath(orgSlug: string, initiativeId: string): string {
  return orgPath(orgSlug, `/initiative/${initiativeId}`);
}

export function initiativesPath(orgSlug: string): string {
  return orgPath(orgSlug, WorkspacePath.INITIATIVES);
}

export function viewPath(orgSlug: string, viewId: string): string {
  return orgPath(orgSlug, `/view/${viewId}`);
}
