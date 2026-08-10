import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clubUuid = (req.headers['x-tenant-id'] as string) || (req.query.clubUuid as string);
      const userUuid = req.user?.userId;
      const data = await this.notificationService.getUserNotifications(clubUuid, userUuid);
      res.json({
        success: true,
        data,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { notificationUuid } = req.params;
      const notification = await this.notificationService.markAsRead(notificationUuid);
      res.json({
        success: true,
        data: notification,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clubUuid = (req.headers['x-tenant-id'] as string) || req.body.clubUuid;
      const userUuid = req.user?.userId;
      await this.notificationService.markAllAsRead(clubUuid, userUuid);
      res.json({
        success: true,
        message: 'All notifications marked as read',
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clubUuid = req.query.clubUuid as string;
      const auditLogs = await this.notificationService.getAuditLogs(clubUuid);
      res.json({
        success: true,
        data: auditLogs,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };
}
