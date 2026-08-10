import { Payment, PaymentStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { IPaymentRepository } from './payment.interface';

export class PaymentRepository implements IPaymentRepository {
  async createPayment(data: Partial<Payment>): Promise<Payment> {
    return prisma.payment.create({
      data: {
        clubUuid: data.clubUuid!,
        orderUuid: data.orderUuid!,
        amount: data.amount!,
        paymentMethod: data.paymentMethod || 'MPESA_STK',
        paymentStatus: data.paymentStatus || 'PENDING',
        phoneNumber: data.phoneNumber,
        merchantRequestId: data.merchantRequestId,
        checkoutRequestId: data.checkoutRequestId,
        exactCash: data.exactCash,
        customerCashAmount: data.customerCashAmount,
        changeDue: data.changeDue,
        paymentNotes: data.paymentNotes,
      },
    });
  }

  async findById(paymentUuid: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { paymentUuid },
    });
  }

  async findByCheckoutRequestId(checkoutRequestId: string): Promise<Payment | null> {
    return prisma.payment.findFirst({
      where: { checkoutRequestId },
    });
  }

  async findByOrderId(orderUuid: string): Promise<Payment[]> {
    return prisma.payment.findMany({
      where: { orderUuid },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(paymentUuid: string, status: PaymentStatus, receiptNumber?: string): Promise<Payment> {
    return prisma.payment.update({
      where: { paymentUuid },
      data: {
        paymentStatus: status,
        mpesaReceiptNumber: receiptNumber,
      },
    });
  }
}
