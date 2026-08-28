import { LABEL_COLORS } from './label.constant.js';

export const SEED_PASSWORD = 'password';

export const SEED_PROJECT_NAME = 'Launch';

export const SeedOrgSlug = {
  ACME: 'acme',
  TECHAP: 'techap-solutions',
  STRATXG: 'stratxg',
} as const;

/** Prior seed slug; seed migrates this org to `acme`. */
export const SEED_PREVIOUS_ACME_SLUG = 'demo';

export const SEED_LABELS = [
  { name: 'UI Enhancement', color: LABEL_COLORS[5] },
  { name: 'Bug', color: LABEL_COLORS[0] },
  { name: 'Feature', color: LABEL_COLORS[3] },
  { name: 'Documentation', color: LABEL_COLORS[4] },
  { name: 'Refactor', color: LABEL_COLORS[2] },
  { name: 'Performance', color: LABEL_COLORS[1] },
  { name: 'Design', color: LABEL_COLORS[6] },
  { name: 'Security', color: LABEL_COLORS[9] },
  { name: 'Accessibility', color: LABEL_COLORS[5] },
  { name: 'Testing', color: LABEL_COLORS[8] },
  { name: 'Internationalization', color: LABEL_COLORS[7] },
] as const;

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
