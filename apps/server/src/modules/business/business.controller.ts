/**
 * Business Controller
 *
 * Exposes endpoints for ADMIN Business Profile & Settings.
 * Derives admin identity strictly from req.user.userId.
 */

import fs from 'fs';
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
      let logoUrl = req.body?.logoUrl || req.body?.logo;

      if (file) {
        try {
          const fileData = fs.readFileSync(file.path);
          const mimeType = file.mimetype || 'image/png';
          logoUrl = `data:${mimeType};base64,${fileData.toString('base64')}`;
        } catch {
          const isHttps = req.secure || req.get('x-forwarded-proto') === 'https' || req.protocol === 'https';
          const protocol = isHttps ? 'https' : 'http';
          const host = req.get('host') || 'localhost:5000';
          logoUrl = `${protocol}://${host}/uploads/${file.filename}`;
        }
      }

      if (!logoUrl) {
        throw new BadRequestError('No image file or logo URL uploaded');
      }

      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await this.businessService.uploadLogo(adminUserId, logoUrl, ipAddress);

      res.json({
        success: true,
        data: { ...result, logoUrl, imageUrl: logoUrl, url: logoUrl },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };
}
