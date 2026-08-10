import { Request, Response, NextFunction } from 'express';
import { tenantAsyncContext } from '../utils/async-context';

/**
 * Tenant resolution middleware.
 *
 * Security rule (§28): tenant context MUST be derived from the authenticated
 * user's server-side identity for all staff/manager/admin requests.
 * Client-supplied headers (X-Tenant-Id) are only used as a fallback for
 * public / unauthenticated routes (e.g. customer QR scan to load club branding).
 *
 * A staff member CANNOT override their tenantId by sending a different
 * X-Tenant-Id header — their JWT-embedded tenantId always wins.
 */
export const tenantMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // If user is authenticated, their JWT tenantId is authoritative — ignore header
  const tenantId: string | undefined =
    (req as any).user?.tenantId ||
    (req.headers['x-tenant-id'] as string | undefined) ||
    (req.subdomains.length > 0 ? req.subdomains[0] : undefined);

  tenantAsyncContext.run({ tenantId }, () => {
    res.setHeader('X-Tenant-Resolved', tenantId || 'global');
    next();
  });
};
