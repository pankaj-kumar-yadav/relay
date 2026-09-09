export const OrgRole = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
} as const;

export type OrgRoleValue = (typeof OrgRole)[keyof typeof OrgRole];
