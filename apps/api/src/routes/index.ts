import type { Router } from 'express';

import { authRouter } from '@/routes/auth/auth.routes.js';
import { invitesRouter } from '@/routes/invites.routes.js';
import { orgsRouter } from '@/routes/orgs.routes.js';

/** Top-level v1 mounts. Org-scoped routers attach in `orgs.routes.ts`. */
export function mountV1Routes(v1: Router): void {
  v1.use('/auth', authRouter);
  v1.use('/orgs', orgsRouter);
  v1.use('/invites', invitesRouter);
}
