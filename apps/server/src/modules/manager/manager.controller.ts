/**
 * Manager Controller
 *
 * Exposes REST endpoints for ADMIN Manager Management.
 * Derives admin identity strictly from req.user.userId.
 */

import { Request, Response, NextFunction } from 'express';
import { ManagerService } from './manager.service';
import { UnauthorizedError } from '../../common/errors/app-error';

export class ManagerController {
  constructor(private managerService: ManagerService) {}

  /**
   * GET /api/v1/managers
   */
  getManagers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = req.user?.userId;
      if (!adminUserId) throw new UnauthorizedError('Authentication required');

      const { search, status, page, limit, sortBy, sortOrder } = req.query;

      const result = await this.managerService.getManagers(adminUserId, {
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
   * GET /api/v1/managers/:managerUuid
   */
  getManagerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = req.user?.userId;
      if (!adminUserId) throw new UnauthorizedError('Authentication required');

      const { managerUuid } = req.params;
      const manager = await this.managerService.getManagerById(adminUserId, managerUuid);

      res.json({
        success: true,
        data: manager,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/managers
   */
  createManager = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = req.user?.userId;
      if (!adminUserId) throw new UnauthorizedError('Authentication required');

      const ipAddress = req.ip || req.socket.remoteAddress;
      const manager = await this.managerService.createManager(adminUserId, req.body, ipAddress);

      res.status(201).json({
        success: true,
        data: manager,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/managers/:managerUuid
   */
  updateManager = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = req.user?.userId;
      if (!adminUserId) throw new UnauthorizedError('Authentication required');

      const { managerUuid } = req.params;
      const ipAddress = req.ip || req.socket.remoteAddress;

      const manager = await this.managerService.updateManager(
        adminUserId,
        managerUuid,
        req.body,
        ipAddress,
      );

      res.json({
        success: true,
        data: manager,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/managers/:managerUuid/status
   */
  setManagerStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = req.user?.userId;
      if (!adminUserId) throw new UnauthorizedError('Authentication required');

      const { managerUuid } = req.params;
      const { isActive } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await this.managerService.setManagerStatus(
        adminUserId,
        managerUuid,
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
   * POST /api/v1/managers/:managerUuid/reset-password
   */
  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = req.user?.userId;
      if (!adminUserId) throw new UnauthorizedError('Authentication required');

      const { managerUuid } = req.params;
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await this.managerService.resetManagerPassword(
        adminUserId,
        managerUuid,
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
   * DELETE /api/v1/managers/:managerUuid
   */
  deleteManager = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = req.user?.userId;
      if (!adminUserId) throw new UnauthorizedError('Authentication required');

      const { managerUuid } = req.params;
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await this.managerService.deleteManager(adminUserId, managerUuid, ipAddress);

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
