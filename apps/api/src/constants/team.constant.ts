export const TEAM_KEY_MIN_LENGTH = 2;
export const TEAM_KEY_MAX_LENGTH = 10;
export const TEAM_KEY_PATTERN = /^[A-Z0-9]{2,10}$/;
export const TEAM_ICON_MAX = 32;

export function normalizeTeamKey(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isTeamKey(value: string): boolean {
  return TEAM_KEY_PATTERN.test(value);
}
