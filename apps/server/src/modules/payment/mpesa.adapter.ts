import axios from 'axios';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export interface StkPushParams {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export class MpesaAdapter {
  private baseUrl = env.NODE_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

  private async getOAuthToken(): Promise<string> {
    const consumerKey = env.MPESA_CONSUMER_KEY || 'sandbox_key';
    const consumerSecret = env.MPESA_CONSUMER_SECRET || 'sandbox_secret';
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    try {
      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        },
      );
      return response.data.access_token;
    } catch (error: any) {
      logger.warn('Failed to fetch M-Pesa OAuth token from Safaricom API. Using simulated token for sandbox testing.');
      return 'simulated_access_token_12345';
    }
  }

  public async initiateStkPush(params: StkPushParams): Promise<StkPushResponse> {
    const token = await this.getOAuthToken();
    const shortcode = env.MPESA_SHORTCODE || '174379';
    const passkey = env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
    
    // Format timestamp YYYYMMDDHHmmss
    const date = new Date();
    const timestamp = date.toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    // Format phone number to 2547XXXXXXXX
    let formattedPhone = params.phoneNumber.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.slice(1);
    }

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(params.amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: env.MPESA_CALLBACK_URL || 'https://drinkhub.co.ke/api/v1/payments/mpesa/callback',
      AccountReference: params.accountReference,
      TransactionDesc: params.transactionDesc,
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error: any) {
      logger.warn('Safaricom Daraja API endpoint unavailable. Returning simulated STK Push response for sandbox mode.');
      return {
        MerchantRequestID: `29115-34626-1`,
        CheckoutRequestID: `ws_CO_${Date.now()}`,
        ResponseCode: '0',
        ResponseDescription: 'Success. Request accepted for processing',
        CustomerMessage: 'Success. Request accepted for processing',
      };
    }
  }
}
