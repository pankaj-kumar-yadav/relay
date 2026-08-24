export const OrgRole = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
} as const;

export type OrgRoleValue = (typeof OrgRole)[keyof typeof OrgRole];

export const OrgRoleLabel: Record<OrgRoleValue, string> = {
  [OrgRole.ADMIN]: 'Admin',
  [OrgRole.EMPLOYEE]: 'Member',
};
