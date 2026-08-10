import { Payment, PaymentStatus } from '@prisma/client';

export interface IPaymentRepository {
  createPayment(data: any): Promise<Payment>;
  findById(paymentUuid: string): Promise<Payment | null>;
  findByCheckoutRequestId(checkoutRequestId: string): Promise<Payment | null>;
  findByOrderId(orderUuid: string): Promise<Payment[]>;
  updateStatus(paymentUuid: string, status: PaymentStatus, receiptNumber?: string): Promise<Payment>;
}
