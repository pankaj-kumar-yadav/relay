/** Default SMTP submission port (STARTTLS). 465 is implicit TLS. */
export const DEFAULT_SMTP_PORT = 587;

/** Password-reset tokens expire after one hour. */
export const RESET_PASSWORD_TTL_MS = 60 * 60 * 1000;

export const RESET_TOKEN_BYTES = 32;

export function inviteMailPath(token: string): string {
  return `/invite/${token}`;
}

export function resetPasswordMailPath(token: string): string {
  return `/reset-password/${token}`;
}

export function inviteMailSubject(orgName: string): string {
  return `You're invited to ${orgName}`;
}

export const RESET_PASSWORD_MAIL_SUBJECT = 'Reset your password';
