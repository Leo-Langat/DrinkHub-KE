/**
 * Dashboard Controller
 *
 * SECURITY GUARANTEE:
 *   The user ID is extracted from the verified JWT.
 *   The service validates the live user, active status, role, and current business assignment in the DB.
 *   The controller NEVER reads businessId or tenantId from:
 *     - URL parameters
 *     - Query parameters
 *     - Request body
 *
 *   This prevents cross-tenant data access and eliminates stale authorization.
 */

import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { UnauthorizedError } from '../../common/errors/app-error';

export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  /**
   * GET /api/v1/dashboard/admin/overview
   *
   * Returns the complete Admin Dashboard Overview for the authenticated ADMIN's business.
   * Business scope is verified against the live database record for the authenticated user.
   *
   * Protected by:
   *   - authenticate middleware (valid JWT required)
   *   - authorize([UserRole.ADMIN]) (only ADMIN role allowed)
   *   - requireTenantScope
   */
  getAdminOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const overview = await this.dashboardService.getAdminOverview(userId);

      res.json({
        success: true,
        data: overview,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
