import { IPaymentRepository } from './payment.interface';
import { MpesaAdapter } from './mpesa.adapter';
import { getIO } from '../../config/socket';
import { logger } from '../../config/logger';
import { BadRequestError } from '../../common/errors/app-error';

export class PaymentService {
  private mpesaAdapter: MpesaAdapter;

  constructor(private paymentRepository: IPaymentRepository) {
    this.mpesaAdapter = new MpesaAdapter();
  }

  // WORKFLOW 1: M-PESA STK PUSH
  async initiateMpesaStkPush(params: {
    clubUuid: string;
    orderUuid: string;
    phoneNumber: string;
    amount: number;
    accountReference: string;
  }) {
    const stkResponse = await this.mpesaAdapter.initiateStkPush({
      phoneNumber: params.phoneNumber,
      amount: params.amount,
      accountReference: params.accountReference,
      transactionDesc: `DrinkHub Order Payment ${params.accountReference}`,
    });

    const payment = await this.paymentRepository.createPayment({
      clubUuid: params.clubUuid,
      orderUuid: params.orderUuid,
      amount: params.amount,
      paymentMethod: 'MPESA_STK',
      paymentStatus: 'PROCESSING',
      phoneNumber: params.phoneNumber,
      merchantRequestId: stkResponse.MerchantRequestID,
      checkoutRequestId: stkResponse.CheckoutRequestID,
    });

    return {
      paymentUuid: payment.paymentUuid,
      checkoutRequestId: stkResponse.CheckoutRequestID,
      customerMessage: stkResponse.CustomerMessage,
      status: 'PROCESSING',
    };
  }

  async handleMpesaCallback(body: any) {
    logger.info('M-Pesa STK Callback Received:', JSON.stringify(body));

    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) return;

    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;

    const payment = await this.paymentRepository.findByCheckoutRequestId(checkoutRequestId);
    if (!payment) {
      logger.warn(`No payment record found for CheckoutRequestID: ${checkoutRequestId}`);
      return;
    }

    if (resultCode === 0) {
      // Payment Successful -> Status: PAID
      let receiptNumber = 'RGA_UNKNOWN';
      const items = stkCallback.CallbackMetadata?.Item || [];
      for (const item of items) {
        if (item.Name === 'MpesaReceiptNumber') {
          receiptNumber = item.Value;
        }
      }

      await this.paymentRepository.updateStatus(payment.paymentUuid, 'PAID', receiptNumber);

      // Notify Waiters & Kitchen via Socket.IO
      try {
        const io = getIO();
        io.to(`tenant:${payment.clubUuid}`).emit('payment_notification', {
          type: 'MPESA_SUCCESS',
          paymentUuid: payment.paymentUuid,
          orderUuid: payment.orderUuid,
          amount: payment.amount,
          receiptNumber,
          message: `M-Pesa payment of KSh ${payment.amount} received (Receipt: ${receiptNumber}).`,
        });
      } catch (_e) {
        logger.warn('Socket.IO instance not ready to dispatch payment alert.');
      }
    } else {
      // Payment Failed
      await this.paymentRepository.updateStatus(payment.paymentUuid, 'FAILED');
    }
  }

  // WORKFLOW 2: CREDIT / DEBIT CARD (POS MACHINE)
  async processCardPayment(params: {
    clubUuid: string;
    orderUuid: string;
    amount: number;
    tableNumber?: number;
  }) {
    const paymentNotes = `Bring POS Machine to Table #${params.tableNumber || 'N/A'}`;

    const payment = await this.paymentRepository.createPayment({
      clubUuid: params.clubUuid,
      orderUuid: params.orderUuid,
      amount: params.amount,
      paymentMethod: 'CARD',
      paymentStatus: 'PENDING',
      paymentNotes,
    });

    const notificationMessage = `Bring POS Machine to Table #${params.tableNumber || 'N/A'} for Order KSh ${params.amount.toLocaleString()}.`;

    // Notify Waiters via Socket.IO
    try {
      const io = getIO();
      io.to(`tenant:${params.clubUuid}`).emit('waiter_notification', {
        type: 'CARD_POS_REQUEST',
        paymentUuid: payment.paymentUuid,
        orderUuid: params.orderUuid,
        tableNumber: params.tableNumber,
        message: notificationMessage,
      });
    } catch (_e) {
      logger.warn('Socket.IO not initialized to notify waiters.');
    }

    return {
      paymentUuid: payment.paymentUuid,
      status: 'PENDING',
      message: 'Waiter notified: Bring POS Machine.',
    };
  }

  // WORKFLOW 3: CASH PAYMENT (EXACT CASH OR CHANGE CALCULATION)
  async processCashPayment(params: {
    clubUuid: string;
    orderUuid: string;
    amount: number;
    tableNumber?: number;
    exactCash: boolean;
    customerCashAmount?: number;
  }) {
    let customerCashAmount = params.amount;
    let changeDue = 0;
    let notificationMessage = '';
    let paymentNotes = '';

    if (params.exactCash) {
      customerCashAmount = params.amount;
      changeDue = 0;
      paymentNotes = 'Customer has exact cash.';
      notificationMessage = `Customer at Table #${params.tableNumber || 'N/A'} has exact cash KSh ${params.amount.toLocaleString()}.`;
    } else {
      if (!params.customerCashAmount || params.customerCashAmount < params.amount) {
        throw new BadRequestError(
          `Customer cash amount (KSh ${params.customerCashAmount}) must be greater than order total (KSh ${params.amount})`,
        );
      }
      customerCashAmount = params.customerCashAmount;
      changeDue = customerCashAmount - params.amount;
      paymentNotes = `Customer paying KSh ${customerCashAmount.toLocaleString()}. Bring KSh ${changeDue.toLocaleString()} change.`;
      notificationMessage = `Customer at Table #${params.tableNumber || 'N/A'} paying KSh ${customerCashAmount.toLocaleString()}. Bring KSh ${changeDue.toLocaleString()} change.`;
    }

    const payment = await this.paymentRepository.createPayment({
      clubUuid: params.clubUuid,
      orderUuid: params.orderUuid,
      amount: params.amount,
      paymentMethod: 'CASH',
      paymentStatus: 'PENDING',
      exactCash: params.exactCash,
      customerCashAmount,
      changeDue,
      paymentNotes,
    });

    // Notify Waiters via Socket.IO
    try {
      const io = getIO();
      io.to(`tenant:${params.clubUuid}`).emit('waiter_notification', {
        type: 'CASH_PAYMENT_REQUEST',
        paymentUuid: payment.paymentUuid,
        orderUuid: params.orderUuid,
        tableNumber: params.tableNumber,
        exactCash: params.exactCash,
        customerCashAmount,
        changeDue,
        message: notificationMessage,
      });
    } catch (_e) {
      logger.warn('Socket.IO not initialized to notify waiters.');
    }

    return {
      paymentUuid: payment.paymentUuid,
      status: 'PENDING',
      exactCash: params.exactCash,
      customerCashAmount,
      changeDue,
      message: notificationMessage,
    };
  }

  async updateStatus(paymentUuid: string, status: any) {
    const payment = await this.paymentRepository.findById(paymentUuid);
    if (!payment) throw new BadRequestError('Payment record not found');
    return this.paymentRepository.updateStatus(paymentUuid, status);
  }
}
