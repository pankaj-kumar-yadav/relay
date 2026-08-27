export const NodeEnv = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
} as const;

export type NodeEnvValue = (typeof NodeEnv)[keyof typeof NodeEnv];
