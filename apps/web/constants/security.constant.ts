/**
 * Auth-gate tips scoped to shipped Relay features only
 * (auth, orgs/membership, invites, settings password, issues/comments/files).
 * Do not mention SSO, 2FA, billing, or other out-of-scope products.
 */
export const SECURITY_TIPS = [
   "Only invite people you trust — members can see this org's issues and projects.",
   "Invite links grant org access — don't forward them casually.",
   'Admins can change roles and remove members in Settings → Members.',
   'Change your password anytime from Settings → Profile.',
   'Use Forgot password for an email reset link when you need one.',
   'Sign out when you finish on a shared or public device.',
   'Each organization is isolated — confirm the org before sharing an issue link.',
   "Issue comments are visible to org members — don't paste secrets there.",
   'File attachments on issues are visible in the org — avoid uploading credentials.',
   'Keep memberships current so assignees and inbox subscribers stay accurate.',
] as const;

export type SecurityTip = (typeof SECURITY_TIPS)[number];

export function pickRandomSecurityTip(): SecurityTip {
   const index = Math.floor(Math.random() * SECURITY_TIPS.length);
   return SECURITY_TIPS[index]!;
}
