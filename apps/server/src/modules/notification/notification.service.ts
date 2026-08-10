import { NotificationType } from '@prisma/client';
import { INotificationRepository } from './notification.interface';
import { FcmAdapter } from './fcm.adapter';
import { getIO } from '../../config/socket';
import { logger } from '../../config/logger';

export class NotificationService {
  private fcmAdapter: FcmAdapter;

  constructor(private notificationRepository: INotificationRepository) {
    this.fcmAdapter = new FcmAdapter();
  }

  async dispatchNotification(params: {
    clubUuid: string;
    userUuid?: string;
    title: string;
    message: string;
    type: NotificationType;
    metadata?: any;
  }) {
    // 1. Persist to Database
    const notification = await this.notificationRepository.createNotification({
      clubUuid: params.clubUuid,
      userUuid: params.userUuid,
      title: params.title,
      message: params.message,
      type: params.type,
    });

    // 2. Real-time Socket.IO Broadcast
    try {
      const io = getIO();
      const payload = {
        notification,
        metadata: params.metadata,
      };

      if (params.userUuid) {
        io.to(`user:${params.userUuid}`).emit('user_notification', payload);
      } else {
        io.to(`tenant:${params.clubUuid}`).emit('venue_notification', payload);
      }
    } catch (_e) {
      logger.warn('Socket.IO instance not ready for notification emission.');
    }

    // 3. Dispatch Mobile Push Notification via FCM
    await this.fcmAdapter.sendPushNotification({
      topic: `tenant_${params.clubUuid}`,
      title: params.title,
      body: params.message,
      data: { type: params.type, notificationUuid: notification.notificationUuid },
    });

    return notification;
  }

  // EVENT 1: NEW ORDER
  async notifyNewOrder(clubUuid: string, orderNumber: string, tableNumber?: number) {
    return this.dispatchNotification({
      clubUuid,
      title: '🔔 New Order Placed',
      message: `Order #${orderNumber} placed for Table #${tableNumber || 'N/A'}.`,
      type: 'NEW_ORDER',
    });
  }

  // EVENT 2: PAYMENT SUCCESS
  async notifyPaymentSuccess(clubUuid: string, amount: number, receiptNumber: string, orderNumber: string) {
    return this.dispatchNotification({
      clubUuid,
      title: '💰 M-Pesa Payment Confirmed',
      message: `Payment of KSh ${amount.toLocaleString()} received for Order #${orderNumber} (Receipt: ${receiptNumber}).`,
      type: 'PAYMENT_SUCCESS',
    });
  }

  // EVENT 3: ORDER CLAIMED
  async notifyOrderClaimed(clubUuid: string, orderNumber: string, waiterName: string) {
    return this.dispatchNotification({
      clubUuid,
      title: '🤝 Order Claimed',
      message: `Order #${orderNumber} claimed by ${waiterName}.`,
      type: 'ORDER_CLAIMED',
    });
  }

  // EVENT 4: ORDER READY
  async notifyOrderReady(clubUuid: string, orderNumber: string, tableNumber?: number) {
    return this.dispatchNotification({
      clubUuid,
      title: '🍸 Order Ready for Pickup',
      message: `Order #${orderNumber} for Table #${tableNumber || 'N/A'} is ready at the bar/kitchen.`,
      type: 'ORDER_READY',
    });
  }

  // EVENT 5: ORDER DELIVERED
  async notifyOrderDelivered(clubUuid: string, orderNumber: string, tableNumber?: number) {
    return this.dispatchNotification({
      clubUuid,
      title: '✅ Order Delivered',
      message: `Order #${orderNumber} delivered to Table #${tableNumber || 'N/A'}.`,
      type: 'ORDER_DELIVERED',
    });
  }

  // EVENT 6: OFFER PUBLISHED
  async notifyOfferPublished(clubUuid: string, offerTitle: string, promoCode: string) {
    return this.dispatchNotification({
      clubUuid,
      title: '🔥 New Happy Hour Offer Live!',
      message: `${offerTitle} is now active. Use code: ${promoCode}`,
      type: 'OFFER_PUBLISHED',
    });
  }

  async getUserNotifications(clubUuid: string, userUuid?: string) {
    const notifications = await this.notificationRepository.getUserNotifications(clubUuid, userUuid);
    const unreadCount = await this.notificationRepository.getUnreadCount(clubUuid, userUuid);
    return { notifications, unreadCount };
  }

  async markAsRead(notificationUuid: string) {
    return this.notificationRepository.markAsRead(notificationUuid);
  }

  async markAllAsRead(clubUuid: string, userUuid?: string) {
    return this.notificationRepository.markAllAsRead(clubUuid, userUuid);
  }

  async logAudit(params: {
    clubUuid?: string;
    userUuid?: string;
    action: string;
    entityType: string;
    entityUuid?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
  }) {
    return this.notificationRepository.createAuditLog(params);
  }

  async getAuditLogs(clubUuid?: string) {
    return this.notificationRepository.getAuditLogs(clubUuid);
  }
}
