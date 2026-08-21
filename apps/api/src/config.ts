export const config = {
  port: Number(process.env.PORT) || 4000,
  webOrigin: process.env.WEB_ORIGIN || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? '',
  isProduction: process.env.NODE_ENV === 'production',
};

export function assertAuthConfig() {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is not defined');
  }
}
