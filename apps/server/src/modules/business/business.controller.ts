/**
 * Business Controller
 *
 * Exposes endpoints for ADMIN Business Profile & Settings.
 * Derives admin identity strictly from req.user.userId.
 */

import { Request, Response, NextFunction } from 'express';
import { BusinessService } from './business.service';
import { UnauthorizedError, BadRequestError } from '../../common/errors/app-error';

export class BusinessController {
  constructor(private businessService: BusinessService) {}

  /**
   * GET /api/v1/business/profile
   */
  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = req.user?.userId;
      if (!adminUserId) throw new UnauthorizedError('Authentication required');

      const profile = await this.businessService.getProfile(adminUserId);

      res.json({
        success: true,
        data: { profile },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/business/profile
   */
  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = req.user?.userId;
      if (!adminUserId) throw new UnauthorizedError('Authentication required');

      const ipAddress = req.ip || req.socket.remoteAddress;
      const profile = await this.businessService.updateProfile(adminUserId, req.body, ipAddress);

      res.json({
        success: true,
        data: { profile },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/business/settings
   */
  updateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = req.user?.userId;
      if (!adminUserId) throw new UnauthorizedError('Authentication required');

      const ipAddress = req.ip || req.socket.remoteAddress;
      const profile = await this.businessService.updateSettings(adminUserId, req.body, ipAddress);

      res.json({
        success: true,
        data: { profile },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/business/logo
   */
  uploadLogo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = req.user?.userId;
      if (!adminUserId) throw new UnauthorizedError('Authentication required');

      const file = (req as Request & { file?: Express.Multer.File }).file;
      if (!file) {
        throw new BadRequestError('No image file uploaded');
      }

      const logoUrl = `/uploads/${file.filename}`;
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await this.businessService.uploadLogo(adminUserId, logoUrl, ipAddress);

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
