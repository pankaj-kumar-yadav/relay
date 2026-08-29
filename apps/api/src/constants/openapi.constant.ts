export const OPENAPI_JSON_PATH = '/openapi.json';
export const OPENAPI_DOCS_PATH = '/docs';
export const OPENAPI_VERSION = '1.0.0';

/** Scalar snippet language + client (Client Libraries picker). */
export const OPENAPI_HTTP_CLIENT = {
  targetKey: 'js',
  clientKey: 'axios',
} as const;

export const OpenApiTag = {
  HEALTH: 'Health',
  AUTH: 'Auth',
  ORGS: 'Orgs',
  INVITES: 'Invites',
  TEAMS: 'Teams',
  PROJECTS: 'Projects',
  MEMBERS: 'Members',
  LABELS: 'Labels',
  CYCLES: 'Cycles',
  INBOX: 'Inbox',
  VIEWS: 'Views',
  ISSUES: 'Issues',
} as const;
