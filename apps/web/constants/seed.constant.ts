import { OrgRole, type OrgRoleValue } from '@/constants/org.constant';

export const SEED_PASSWORD = 'password';

export const SeedOrgSlug = {
  ACME: 'acme',
  TECHAP: 'techap-solutions',
  STRATXG: 'stratxg',
} as const;

export const SeedEmail = {
  SUPER_ADMIN: 'owner@relay.local',
  TECHAP_ADMIN: 'admin@techap.local',
  TECHAP_ADMIN_2: 'admin2@techap.local',
  TECHAP_ADMIN_3: 'admin3@techap.local',
  TECHAP_EMPLOYEE: 'employee@techap.local',
  TECHAP_EMPLOYEE_2: 'employee2@techap.local',
  TECHAP_EMPLOYEE_3: 'employee3@techap.local',
  STRATXG_ADMIN: 'admin@stratxg.local',
  STRATXG_ADMIN_2: 'admin2@stratxg.local',
  STRATXG_ADMIN_3: 'admin3@stratxg.local',
  STRATXG_EMPLOYEE: 'employee@stratxg.local',
  STRATXG_EMPLOYEE_2: 'employee2@stratxg.local',
  STRATXG_EMPLOYEE_3: 'employee3@stratxg.local',
} as const;

export const SEED_ORGS = [
  { slug: SeedOrgSlug.ACME, name: 'Acme' },
  { slug: SeedOrgSlug.TECHAP, name: 'Techap' },
  { slug: SeedOrgSlug.STRATXG, name: 'StratXG' },
] as const;

export const SeedAccountRoleLabel = {
  'super-admin': 'Super-admin',
  [OrgRole.ADMIN]: 'Admin',
  [OrgRole.EMPLOYEE]: 'Employee',
} as const;

export type SeedAccountRole = 'super-admin' | OrgRoleValue;

/** Dev login prefill: keep these visible but unselectable for now. */
export const DISABLED_SEED_ACCOUNT_ROLES: readonly SeedAccountRole[] = [
  'super-admin',
  OrgRole.ADMIN,
];

export const SEED_ACCOUNTS: {
  org: (typeof SeedOrgSlug)[keyof typeof SeedOrgSlug];
  name: string;
  email: string;
  role: SeedAccountRole;
}[] = [
  {
    org: SeedOrgSlug.ACME,
    name: 'Relay Owner',
    email: SeedEmail.SUPER_ADMIN,
    role: 'super-admin',
  },
  {
    org: SeedOrgSlug.TECHAP,
    name: 'Asha Patel',
    email: SeedEmail.TECHAP_ADMIN,
    role: OrgRole.ADMIN,
  },
  {
    org: SeedOrgSlug.TECHAP,
    name: 'Vikram Shah',
    email: SeedEmail.TECHAP_ADMIN_2,
    role: OrgRole.ADMIN,
  },
  {
    org: SeedOrgSlug.TECHAP,
    name: 'Rohan Das',
    email: SeedEmail.TECHAP_EMPLOYEE,
    role: OrgRole.EMPLOYEE,
  },
  {
    org: SeedOrgSlug.TECHAP,
    name: 'Kavya Iyer',
    email: SeedEmail.TECHAP_EMPLOYEE_2,
    role: OrgRole.EMPLOYEE,
  },
  {
    org: SeedOrgSlug.STRATXG,
    name: 'Lena Ortiz',
    email: SeedEmail.STRATXG_ADMIN,
    role: OrgRole.ADMIN,
  },
  {
    org: SeedOrgSlug.STRATXG,
    name: 'Marcus Chen',
    email: SeedEmail.STRATXG_ADMIN_2,
    role: OrgRole.ADMIN,
  },
  {
    org: SeedOrgSlug.STRATXG,
    name: 'Noah Blake',
    email: SeedEmail.STRATXG_EMPLOYEE,
    role: OrgRole.EMPLOYEE,
  },
  {
    org: SeedOrgSlug.STRATXG,
    name: 'Sofia Alvarez',
    email: SeedEmail.STRATXG_EMPLOYEE_2,
    role: OrgRole.EMPLOYEE,
  },
];
