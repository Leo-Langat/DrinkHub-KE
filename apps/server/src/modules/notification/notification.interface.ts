import { Notification, NotificationType, AuditLog } from '@prisma/client';

export interface INotificationRepository {
  createNotification(data: {
    businessUuid: string;
    userUuid?: string;
    title: string;
    message: string;
    type: NotificationType;
  }): Promise<Notification>;

  getUserNotifications(businessUuid: string, userUuid?: string): Promise<Notification[]>;
  getUnreadCount(businessUuid: string, userUuid?: string): Promise<number>;
  markAsRead(notificationUuid: string): Promise<Notification>;
  markAllAsRead(businessUuid: string, userUuid?: string): Promise<void>;

  createAuditLog(data: {
    businessUuid?: string;
    userUuid?: string;
    action: string;
    entityType: string;
    entityUuid?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
  }): Promise<AuditLog>;

  getAuditLogs(businessUuid?: string): Promise<AuditLog[]>;
}
