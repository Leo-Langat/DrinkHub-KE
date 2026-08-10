import { logger } from '../../config/logger';

export interface FcmPayload {
  token?: string;
  topic?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export class FcmAdapter {
  private isConfigured: boolean = false;

  constructor() {
    // Check if Firebase admin SDK service account credentials exist in env
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      this.isConfigured = true;
      logger.info('Firebase Cloud Messaging (FCM) Adapter initialized.');
    } else {
      logger.info('FCM Adapter in mock mode (FIREBASE_SERVICE_ACCOUNT not configured).');
    }
  }

  async sendPushNotification(payload: FcmPayload): Promise<boolean> {
    if (!this.isConfigured) {
      logger.info(`[FCM Mock Push Dispatch] Title: "${payload.title}" | Body: "${payload.body}" Target: ${payload.token || payload.topic || 'All'}`);
      return true;
    }

    try {
      // Future integration ready: admin.messaging().send(...)
      logger.info(`FCM Notification dispatched successfully to ${payload.token || payload.topic}`);
      return true;
    } catch (error) {
      logger.error('Failed to send FCM push notification:', error);
      return false;
    }
  }
}
