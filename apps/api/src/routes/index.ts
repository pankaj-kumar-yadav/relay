import type { Router } from 'express';

import { authRouter } from '@/routes/auth/auth.js';
import { invitesRouter } from '@/routes/invites.js';
import { orgsRouter } from '@/routes/orgs.js';

/** Top-level v1 mounts. Org-scoped routers attach in `orgs.ts`. */
export function mountV1Routes(v1: Router): void {
  v1.use('/auth', authRouter);
  v1.use('/orgs', orgsRouter);
  v1.use('/invites', invitesRouter);
}
