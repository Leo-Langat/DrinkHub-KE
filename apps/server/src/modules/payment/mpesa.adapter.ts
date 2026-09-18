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
  isSimulated?: boolean;
  simulationReason?: string;
}

export class MpesaAdapter {
  private baseUrl = env.NODE_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

  private async getOAuthToken(): Promise<{ token: string; simulated: boolean }> {
    const consumerKey = env.MPESA_CONSUMER_KEY;
    const consumerSecret = env.MPESA_CONSUMER_SECRET;

    if (!consumerKey || !consumerSecret || consumerKey.startsWith('your_') || consumerKey === 'sandbox_key') {
      logger.warn('MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET not configured in environment. Using simulated M-Pesa mode.');
      return { token: 'simulated_access_token_12345', simulated: true };
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    try {
      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
          timeout: 10000,
        },
      );
      return { token: response.data.access_token, simulated: false };
    } catch (error: any) {
      logger.warn(`Failed to fetch M-Pesa OAuth token from Safaricom API: ${error.response?.data?.errorMessage || error.message}. Using simulated mode.`);
      return { token: 'simulated_access_token_12345', simulated: true };
    }
  }

  public async initiateStkPush(params: StkPushParams): Promise<StkPushResponse> {
    const { token, simulated } = await this.getOAuthToken();
    const shortcode = env.MPESA_SHORTCODE || '174379';
    const passkey = env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
    
    // Format timestamp YYYYMMDDHHmmss
    const date = new Date();
    const timestamp = date.toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    // Format phone number to 2547XXXXXXXX or 2541XXXXXXXX
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
      Amount: Math.max(1, Math.ceil(params.amount)),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: env.MPESA_CALLBACK_URL || 'https://drinkhub-ke.onrender.com/api/v1/payments/mpesa/callback',
      AccountReference: params.accountReference,
      TransactionDesc: params.transactionDesc,
    };

    if (simulated) {
      logger.info(`[M-Pesa STK Push] SIMULATED for ${formattedPhone} - Amount: KES ${params.amount} (No live Daraja credentials configured)`);
      return {
        MerchantRequestID: `29115-${Date.now()}`,
        CheckoutRequestID: `ws_CO_${Date.now()}`,
        ResponseCode: '0',
        ResponseDescription: 'Simulation Mode: Live Safaricom credentials not provided.',
        CustomerMessage: 'Simulation: Check on-screen prompt to enter test PIN.',
        isSimulated: true,
        simulationReason: 'Daraja API credentials (MPESA_CONSUMER_KEY / SECRET) not configured.',
      };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );
      return {
        ...response.data,
        isSimulated: false,
      };
    } catch (error: any) {
      const errMsg = error.response?.data?.errorMessage || error.response?.data?.ResponseDescription || error.message;
      logger.warn(`[M-Pesa STK Push] Safaricom Daraja request failed: ${errMsg}. Falling back to simulated prompt.`);
      return {
        MerchantRequestID: `29115-${Date.now()}`,
        CheckoutRequestID: `ws_CO_${Date.now()}`,
        ResponseCode: '0',
        ResponseDescription: `Simulated (Safaricom returned: ${errMsg})`,
        CustomerMessage: 'Simulation: Check on-screen prompt to enter test PIN.',
        isSimulated: true,
        simulationReason: errMsg,
      };
    }
  }
}
