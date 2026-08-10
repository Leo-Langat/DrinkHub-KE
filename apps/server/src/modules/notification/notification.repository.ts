import { Notification, NotificationType, AuditLog } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { INotificationRepository } from './notification.interface';

export class NotificationRepository implements INotificationRepository {
  async createNotification(data: {
    clubUuid: string;
    userUuid?: string;
    title: string;
    message: string;
    type: NotificationType;
  }): Promise<Notification> {
    return prisma.notification.create({
      data: {
        clubUuid: data.clubUuid,
        userUuid: data.userUuid,
        title: data.title,
        message: data.message,
        type: data.type,
      },
    });
  }

  async getUserNotifications(clubUuid: string, userUuid?: string): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: {
        clubUuid,
        ...(userUuid ? { userUuid } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getUnreadCount(clubUuid: string, userUuid?: string): Promise<number> {
    return prisma.notification.count({
      where: {
        clubUuid,
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

  async markAllAsRead(clubUuid: string, userUuid?: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        clubUuid,
        isRead: false,
        ...(userUuid ? { userUuid } : {}),
      },
      data: { isRead: true },
    });
  }

  async createAuditLog(data: {
    clubUuid?: string;
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
        clubUuid: data.clubUuid,
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

  async getAuditLogs(clubUuid?: string): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: clubUuid ? { clubUuid } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: true, club: true },
    });
  }
}
