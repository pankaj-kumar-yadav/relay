import type { RequestHandler } from 'express';

import { type OrgRoleValue } from '@/constants/org.js';
import { ForbiddenError, sendError } from '@/utils/errors.js';

export function requireOrgRole(...roles: OrgRoleValue[]): RequestHandler {
  return (req, res, next) => {
    try {
      const role = req.membership?.role;
      if (!role || !roles.includes(role as OrgRoleValue)) {
        throw new ForbiddenError('Insufficient organization role');
      }
      next();
    } catch (err) {
      sendError(res, err);
    }
  };
}
