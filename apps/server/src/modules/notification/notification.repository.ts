import { Notification, NotificationType, AuditLog } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { INotificationRepository } from './notification.interface';

export class NotificationRepository implements INotificationRepository {
  async createNotification(data: {
    businessUuid: string;
    userUuid?: string;
    title: string;
    message: string;
    type: NotificationType;
  }): Promise<Notification> {
    return prisma.notification.create({
      data: {
        businessUuid: data.businessUuid,
        userUuid: data.userUuid,
        title: data.title,
        message: data.message,
        type: data.type,
      },
    });
  }

  async getUserNotifications(businessUuid: string, userUuid?: string): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: {
        businessUuid,
        ...(userUuid ? { userUuid } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getUnreadCount(businessUuid: string, userUuid?: string): Promise<number> {
    return prisma.notification.count({
      where: {
        businessUuid,
        isRead: false,
        ...(userUuid ? { userUuid } : {}),
      },
    });
  }

  async markAsRead(notificationUuid: string): Promise<Notification> {
    return prisma.notification.update({
      where: { notificationUuid },
      data: { isRead: true },
    });
  }

  async markAllAsRead(businessUuid: string, userUuid?: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        businessUuid,
        isRead: false,
        ...(userUuid ? { userUuid } : {}),
      },
      data: { isRead: true },
    });
  }

  async createAuditLog(data: {
    businessUuid?: string;
    userUuid?: string;
    action: string;
    entityType: string;
    entityUuid?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
  }): Promise<AuditLog> {
    return prisma.auditLog.create({
      data: {
        businessUuid: data.businessUuid,
        userUuid: data.userUuid,
        action: data.action,
        entityType: data.entityType,
        entityUuid: data.entityUuid,
        oldValues: data.oldValues || undefined,
        newValues: data.newValues || undefined,
        ipAddress: data.ipAddress,
      },
    });
  }

  async getAuditLogs(businessUuid?: string): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: businessUuid ? { businessUuid } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: true, business: true },
    });
  }
}
