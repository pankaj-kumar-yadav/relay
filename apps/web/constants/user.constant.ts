export const UserStatus = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  AWAY: 'away',
} as const;

export type UserStatusValue = (typeof UserStatus)[keyof typeof UserStatus];

export const DEFAULT_USER_STATUS = UserStatus.OFFLINE;

export const UserStatusColor: Record<UserStatusValue, string> = {
  [UserStatus.ONLINE]: '#00cc66',
  [UserStatus.OFFLINE]: '#969696',
  [UserStatus.AWAY]: '#ffcc00',
};

export const DicebearStyle = {
  GLASS: 'glass',
  BOTTTS: 'bottts',
} as const;

export type DicebearStyleValue = (typeof DicebearStyle)[keyof typeof DicebearStyle];

export const DICEBEAR_API_ORIGIN = 'https://api.dicebear.com/9.x';

export const DEFAULT_DICEBEAR_STYLE = DicebearStyle.GLASS;

export function dicebearAvatarUrl(
  seed: string,
  style: DicebearStyleValue = DEFAULT_DICEBEAR_STYLE,
): string {
  return `${DICEBEAR_API_ORIGIN}/${style}/svg?seed=${encodeURIComponent(seed)}`;
}
