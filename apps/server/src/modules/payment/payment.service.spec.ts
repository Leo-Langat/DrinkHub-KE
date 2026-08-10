import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PaymentService } from './payment.service';
import { IPaymentRepository } from './payment.interface';

describe('PaymentService Unit Tests', () => {
  let paymentService: PaymentService;
  let mockPaymentRepository: IPaymentRepository;

  beforeEach(() => {
    mockPaymentRepository = {
      createPayment: vi.fn(),
      findById: vi.fn(),
      findByCheckoutRequestId: vi.fn(),
      findByOrderId: vi.fn(),
      updateStatus: vi.fn(),
    };
    paymentService = new PaymentService(mockPaymentRepository);
  });

  it('should calculate cash change correctly (Total 1450, Pays 2000 => Change 550)', async () => {
    vi.spyOn(mockPaymentRepository, 'createPayment').mockImplementation(async (data) => ({
      paymentUuid: 'pay-123',
      ...data,
    }) as any);

    const result = await paymentService.processCashPayment({
      clubUuid: 'club-1',
      orderUuid: 'order-1',
      amount: 1450,
      tableNumber: 2,
      exactCash: false,
      customerCashAmount: 2000,
    });

    expect(result.changeDue).toBe(550);
    expect(result.customerCashAmount).toBe(2000);
    expect(mockPaymentRepository.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1450,
        customerCashAmount: 2000,
        changeDue: 550,
        paymentMethod: 'CASH',
      }),
    );
  });

  it('should throw error if cash tendered is less than order amount', async () => {
    await expect(
      paymentService.processCashPayment({
        clubUuid: 'club-1',
        orderUuid: 'order-1',
        amount: 1450,
        exactCash: false,
        customerCashAmount: 1000,
      }),
    ).rejects.toThrow('Customer cash amount');
  });
});
