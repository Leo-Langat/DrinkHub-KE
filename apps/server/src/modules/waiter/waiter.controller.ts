/**
 * Waiter Controller
 *
 * Exposes REST endpoints for ADMIN Waiter Management.
 * Admin identity is derived exclusively from req.user.userId (JWT-verified).
 */

import { Request, Response, NextFunction } from 'express';
import { WaiterService } from './waiter.service';
import { UnauthorizedError } from '../../common/errors/app-error';

export class WaiterController {
  constructor(private waiterService: WaiterService) {}

  /**
   * GET /api/v1/waiters
   */
  getWaiters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = req.user?.userId;
      if (!adminUserId) throw new UnauthorizedError('Authentication required');

      const { search, status, page, limit, sortBy, sortOrder } = req.query;

      const result = await this.waiterService.getWaiters(adminUserId, {
        search: search as string | undefined,
        status: status as 'ACTIVE' | 'INACTIVE' | 'ALL' | undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });

      res.json({
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/waiters/:waiterUuid
   */
  getWaiterById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = req.user?.userId;
      if (!adminUserId) throw new UnauthorizedError('Authentication required');

      const { waiterUuid } = req.params;
      const waiter = await this.waiterService.getWaiterById(adminUserId, waiterUuid);

      res.json({
        success: true,
        data: waiter,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/waiters
   */
  createWaiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = req.user?.userId;
      if (!adminUserId) throw new UnauthorizedError('Authentication required');

      const ipAddress = req.ip || req.socket.remoteAddress;
      const waiter = await this.waiterService.createWaiter(
        adminUserId,
        req.body,
        ipAddress,
      );

      res.status(201).json({
        success: true,
        data: waiter,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/waiters/:waiterUuid
   */
  updateWaiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = req.user?.userId;
      if (!adminUserId) throw new UnauthorizedError('Authentication required');

      const { waiterUuid } = req.params;
      const ipAddress = req.ip || req.socket.remoteAddress;

      const waiter = await this.waiterService.updateWaiter(
        adminUserId,
        waiterUuid,
        req.body,
        ipAddress,
      );

      res.json({
        success: true,
        data: waiter,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/waiters/:waiterUuid/status
   */
  setWaiterStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = req.user?.userId;
      if (!adminUserId) throw new UnauthorizedError('Authentication required');

      const { waiterUuid } = req.params;
      const { isActive } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await this.waiterService.setWaiterStatus(
        adminUserId,
        waiterUuid,
        isActive,
        ipAddress,
      );

      res.json({
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/waiters/:waiterUuid/reset-password
   */
  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = req.user?.userId;
      if (!adminUserId) throw new UnauthorizedError('Authentication required');

      const { waiterUuid } = req.params;
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await this.waiterService.resetWaiterPassword(
        adminUserId,
        waiterUuid,
        req.body || {},
        ipAddress,
      );

      res.json({
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/waiters/:waiterUuid
   */
  deleteWaiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = req.user?.userId;
      if (!adminUserId) throw new UnauthorizedError('Authentication required');

      const { waiterUuid } = req.params;
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await this.waiterService.deleteWaiter(
        adminUserId,
        waiterUuid,
        ipAddress,
      );

      res.json({
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };
}
