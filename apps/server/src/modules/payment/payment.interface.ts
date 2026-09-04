import { Payment, PaymentStatus } from '@prisma/client';

export interface PaymentFilterOptions {
  businessUuid: string;
  paymentMethod?: string;
  paymentStatus?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface IPaymentRepository {
  createPayment(data: any): Promise<Payment>;
  findById(paymentUuid: string): Promise<Payment | null>;
  findByCheckoutRequestId(checkoutRequestId: string): Promise<Payment | null>;
  findByOrderId(orderUuid: string): Promise<Payment[]>;
  findPaymentsForBusiness(options: PaymentFilterOptions): Promise<{ payments: (Payment & { order?: any })[]; total: number }>;
  updateStatus(paymentUuid: string, status: PaymentStatus, receiptNumber?: string, paidAt?: Date): Promise<Payment>;
}
