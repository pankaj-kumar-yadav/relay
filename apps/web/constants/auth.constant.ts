export const AuthSocialProvider = {
   GOOGLE: 'google',
} as const;

export type AuthSocialProviderValue =
   (typeof AuthSocialProvider)[keyof typeof AuthSocialProvider];

export const AUTH_SOCIAL_PROVIDERS = [
   { id: AuthSocialProvider.GOOGLE, label: 'Google' },
] as const;

export const AUTH_FOOTER_LINKS = [
   { label: 'Privacy', href: '#' },
   { label: 'Terms', href: '#' },
   { label: 'Status', href: '#' },
] as const;

/** Top-level routes with no org slug. */
export const AppRoute = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  NEW: '/new',
} as const;

export type AppRouteValue = (typeof AppRoute)[keyof typeof AppRoute];

/** Auth endpoints on the API (not app routes). */
export const AuthApiPath = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  SESSION: '/auth/session',
} as const;

export type AuthApiPathValue = (typeof AuthApiPath)[keyof typeof AuthApiPath];

export const LoginQuery = {
  NEXT: 'next',
} as const;

export function invitePath(token: string): string {
  return `/invite/${token}`;
}

export function loginWithNextPath(next: string): string {
  return `${AppRoute.LOGIN}?${LoginQuery.NEXT}=${encodeURIComponent(next)}`;
}

export function nextPathFromSearch(
  search = typeof window === 'undefined' ? '' : window.location.search,
): string | null {
  const next = new URLSearchParams(search).get(LoginQuery.NEXT);
  if (!next || !next.startsWith('/') || next.startsWith('//')) return null;
  return next;
}
