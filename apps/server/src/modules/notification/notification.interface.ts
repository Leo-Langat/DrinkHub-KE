import { Notification, NotificationType, AuditLog } from '@prisma/client';

export interface INotificationRepository {
  createNotification(data: {
    clubUuid: string;
    userUuid?: string;
    title: string;
    message: string;
    type: NotificationType;
  }): Promise<Notification>;

  getUserNotifications(clubUuid: string, userUuid?: string): Promise<Notification[]>;
  getUnreadCount(clubUuid: string, userUuid?: string): Promise<number>;
  markAsRead(notificationUuid: string): Promise<Notification>;
  markAllAsRead(clubUuid: string, userUuid?: string): Promise<void>;

  createAuditLog(data: {
    clubUuid?: string;
    userUuid?: string;
    action: string;
    entityType: string;
    entityUuid?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
  }): Promise<AuditLog>;

  getAuditLogs(clubUuid?: string): Promise<AuditLog[]>;
}
