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

export const SEED_ACCOUNTS = [
  {
    label: `Super-admin · ${SeedOrgSlug.ACME}`,
    email: SeedEmail.SUPER_ADMIN,
  },
  {
    label: `Admin · ${SeedOrgSlug.TECHAP}`,
    email: SeedEmail.TECHAP_ADMIN,
  },
  {
    label: `Employee · ${SeedOrgSlug.TECHAP}`,
    email: SeedEmail.TECHAP_EMPLOYEE,
  },
  {
    label: `Admin · ${SeedOrgSlug.STRATXG}`,
    email: SeedEmail.STRATXG_ADMIN,
  },
  {
    label: `Employee · ${SeedOrgSlug.STRATXG}`,
    email: SeedEmail.STRATXG_EMPLOYEE,
  },
] as const;
