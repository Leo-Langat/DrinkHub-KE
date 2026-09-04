import { Payment, PaymentStatus, PaymentMethod } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { IPaymentRepository, PaymentFilterOptions } from './payment.interface';

export class PaymentRepository implements IPaymentRepository {
  async createPayment(data: Partial<Payment>): Promise<Payment> {
    const isPaid = data.paymentStatus === 'PAID';
    return prisma.payment.create({
      data: {
        businessUuid: data.businessUuid || (data as any).clubUuid,
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
        paidAt: isPaid ? (data.paidAt || new Date()) : null,
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

  async findPaymentsForBusiness(options: PaymentFilterOptions): Promise<{ payments: (Payment & { order?: any })[]; total: number }> {
    const { businessUuid, paymentMethod, paymentStatus, startDate, endDate, limit = 50, offset = 0 } = options;

    const whereClause: any = {
      businessUuid,
    };

    if (paymentMethod && paymentMethod !== 'ALL') {
      whereClause.paymentMethod = paymentMethod as PaymentMethod;
    }

    if (paymentStatus && (paymentStatus as string) !== 'ALL') {
      whereClause.paymentStatus = paymentStatus;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          order: {
            include: {
              table: true,
              waiter: {
                select: {
                  userUuid: true,
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.payment.count({ where: whereClause }),
    ]);

    return { payments, total };
  }

  async updateStatus(paymentUuid: string, status: PaymentStatus, receiptNumber?: string, paidAt?: Date): Promise<Payment> {
    const data: any = {
      paymentStatus: status,
      mpesaReceiptNumber: receiptNumber,
    };
    if (status === 'PAID') {
      data.paidAt = paidAt || new Date();
    }
    return prisma.payment.update({
      where: { paymentUuid },
      data,
    });
  }
}
