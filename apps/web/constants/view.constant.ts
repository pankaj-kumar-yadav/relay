import { orgPath } from '@/constants/org.constant';

export { VIEW_NAME_MAX, VIEW_SLUG_MAX, VIEW_SLUG_FALLBACK } from '@relay/shared/constants/view.constant';

/** Default emoji for API views (icon is not stored). */
export const VIEW_ICON = '📋';

export const ViewPath = {
   LIST: '/views',
} as const;

export function viewsPath(orgSlug: string): string {
   return orgPath(orgSlug, ViewPath.LIST);
}

export function viewPath(orgSlug: string, viewSlug: string): string {
   return orgPath(orgSlug, `/view/${viewSlug}`);
}
