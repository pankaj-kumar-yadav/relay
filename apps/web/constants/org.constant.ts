export const OrgRole = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
} as const;

export type OrgRoleValue = (typeof OrgRole)[keyof typeof OrgRole];

export const OrgRoleLabel: Record<OrgRoleValue, string> = {
  [OrgRole.ADMIN]: 'Admin',
  [OrgRole.EMPLOYEE]: 'Member',
};

/** Org-level path suffixes (members + settings). Always start with `/`. */
export const OrgPath = {
  MEMBERS: '/members',
  SETTINGS: '/settings',
  SETTINGS_ACCOUNT: '/settings/account',
  SETTINGS_PREFERENCES: '/settings/preferences',
  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_NOTIFICATIONS: '/settings/notifications',
  SETTINGS_CODE_AND_REVIEWS: '/settings/code-and-reviews',
  SETTINGS_SECURITY: '/settings/security',
  SETTINGS_CONNECTED_ACCOUNTS: '/settings/connected-accounts',
  SETTINGS_AGENT_PERSONALIZATION: '/settings/agent-personalization',
  SETTINGS_ISSUE_LABELS: '/settings/issue-labels',
  SETTINGS_ISSUE_TEMPLATES: '/settings/issue-templates',
  SETTINGS_SLAS: '/settings/slas',
  SETTINGS_PROJECT_LABELS: '/settings/project-labels',
  SETTINGS_PROJECT_TEMPLATES: '/settings/project-templates',
  SETTINGS_PROJECT_STATUSES: '/settings/project-statuses',
  SETTINGS_PROJECT_UPDATES: '/settings/project-updates',
  SETTINGS_AI: '/settings/ai',
  SETTINGS_INITIATIVES: '/settings/initiatives',
  SETTINGS_DOCUMENTS: '/settings/documents',
  SETTINGS_CUSTOMER_REQUESTS: '/settings/customer-requests',
  SETTINGS_RELEASES: '/settings/releases',
  SETTINGS_PULSE: '/settings/pulse',
  SETTINGS_ASKS: '/settings/asks',
  SETTINGS_EMOJIS: '/settings/emojis',
  SETTINGS_INTEGRATIONS: '/settings/integrations',
  SETTINGS_LABELS: '/settings/labels',
  SETTINGS_PROJECTS: '/settings/projects',
  SETTINGS_TEMPLATES: '/settings/templates',
  SETTINGS_TEAMS: '/settings/teams',
  SETTINGS_TEAMS_NEW: '/settings/teams/new',
} as const;

export type OrgPathValue = (typeof OrgPath)[keyof typeof OrgPath];

export function orgPath(orgSlug: string, suffix: string): string {
  const path = suffix.startsWith('/') ? suffix : `/${suffix}`;
  return `/${orgSlug}${path}`;
}

export function membersPath(orgSlug: string): string {
  return orgPath(orgSlug, OrgPath.MEMBERS);
}

export function settingsPath(orgSlug: string): string {
  return orgPath(orgSlug, OrgPath.SETTINGS);
}

export function settingsPreferencesPath(orgSlug: string): string {
  return orgPath(orgSlug, OrgPath.SETTINGS_PREFERENCES);
}

export function settingsTeamPath(orgSlug: string, teamId: string): string {
  return orgPath(orgSlug, `${OrgPath.SETTINGS_TEAMS}/${teamId}`);
}

export function settingsNewTeamPath(orgSlug: string): string {
  return orgPath(orgSlug, OrgPath.SETTINGS_TEAMS_NEW);
}

export function profilePath(orgSlug: string, userId: string): string {
  return orgPath(orgSlug, `/profiles/${userId}`);
}
