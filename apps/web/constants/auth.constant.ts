export const AuthSocialProvider = {
   GOOGLE: 'google',
   APPLE: 'apple',
   GITHUB: 'github',
} as const;

export type AuthSocialProviderValue =
   (typeof AuthSocialProvider)[keyof typeof AuthSocialProvider];

export const AUTH_SOCIAL_PROVIDERS = [
   { id: AuthSocialProvider.GOOGLE, label: 'Google' },
   { id: AuthSocialProvider.APPLE, label: 'Apple' },
   { id: AuthSocialProvider.GITHUB, label: 'GitHub' },
] as const;

export const AUTH_FOOTER_LINKS = [
   { label: 'Privacy', href: '#' },
   { label: 'Terms', href: '#' },
   { label: 'Status', href: '#' },
] as const;
