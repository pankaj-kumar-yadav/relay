import { OrgRole, type OrgRoleValue } from '@/constants/org.constant';
import { SEED_PASSWORD, SeedOrgSlug, SeedEmail } from '@relay/shared/constants/seed.constant';

export { SEED_PASSWORD, SeedOrgSlug, SeedEmail };

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

/** Demo login accounts are selectable on the login page. */
export const DISABLED_SEED_ACCOUNT_ROLES: readonly SeedAccountRole[] = [];

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
         name: 'Meera Rao',
         email: SeedEmail.TECHAP_ADMIN_3,
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
         org: SeedOrgSlug.TECHAP,
         name: 'Arjun Nair',
         email: SeedEmail.TECHAP_EMPLOYEE_3,
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
         name: 'Priya Kapoor',
         email: SeedEmail.STRATXG_ADMIN_3,
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
      {
         org: SeedOrgSlug.STRATXG,
         name: 'Dev Patel',
         email: SeedEmail.STRATXG_EMPLOYEE_3,
         role: OrgRole.EMPLOYEE,
      },
   ];
