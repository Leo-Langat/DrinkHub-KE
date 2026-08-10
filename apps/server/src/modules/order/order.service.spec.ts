import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderService } from './order.service';
import { IOrderRepository } from './order.interface';

describe('OrderService Unit Tests', () => {
  let orderService: OrderService;
  let mockOrderRepository: IOrderRepository;

  beforeEach(() => {
    mockOrderRepository = {
      findById: vi.fn(),
      findOrdersByClub: vi.fn(),
      findActiveClaimedOrderByWaiter: vi.fn(),
      createOrder: vi.fn(),
      claimOrder: vi.fn(),
      updateStatus: vi.fn(),
    };
    orderService = new OrderService(mockOrderRepository);
  });

  it('should enforce 1-active-order claim limit rule for waiters', async () => {
    const existingActiveOrder = {
      orderUuid: 'ord-existing-1',
      orderNumber: 'ORD-1001',
      status: 'CLAIMED',
      table: { tableNumber: 2 },
    } as any;

    vi.spyOn(mockOrderRepository, 'findById').mockResolvedValue({
      orderUuid: 'ord-new-2',
      status: 'PENDING',
      clubUuid: 'club-1',
    } as any);

    // Waiter already has an active claimed order
    vi.spyOn(mockOrderRepository, 'findActiveClaimedOrderByWaiter').mockResolvedValue(existingActiveOrder);

    await expect(
      orderService.claimOrder('ord-new-2', 'waiter-uuid-123'),
    ).rejects.toThrow('You already have an active order');
  });

  it('should allow waiter to claim order if they have no active claimed orders', async () => {
    const pendingOrder = {
      orderUuid: 'ord-new-2',
      orderNumber: 'ORD-1002',
      status: 'PENDING',
      clubUuid: 'club-1',
    } as any;

    const claimedResult = {
      ...pendingOrder,
      status: 'CLAIMED',
      waiterUuid: 'waiter-uuid-123',
    } as any;

    vi.spyOn(mockOrderRepository, 'findById').mockResolvedValue(pendingOrder);
    vi.spyOn(mockOrderRepository, 'findActiveClaimedOrderByWaiter').mockResolvedValue(null);
    vi.spyOn(mockOrderRepository, 'claimOrder').mockResolvedValue(claimedResult);

    const result = await orderService.claimOrder('ord-new-2', 'waiter-uuid-123');
    expect(result.status).toBe('CLAIMED');
    expect(mockOrderRepository.claimOrder).toHaveBeenCalledWith('ord-new-2', 'waiter-uuid-123');
  });
});
