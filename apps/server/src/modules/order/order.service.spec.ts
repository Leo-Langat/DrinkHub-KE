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
      findOrdersByBusiness: vi.fn(),
      findActiveClaimedOrderByWaiter: vi.fn(),
      findAllActiveOrdersByWaiter: vi.fn(),
      createOrder: vi.fn(),
      claimOrder: vi.fn(),
      updateStatus: vi.fn(),
    } as unknown as IOrderRepository;
    orderService = new OrderService(mockOrderRepository);
  });

  it('should block claiming when waiter already has a CLAIMED order (must mark as preparing first)', async () => {
    const existingClaimedOrder = {
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

    // Waiter has 1 active CLAIMED order — must mark as Preparing before claiming another
    vi.mocked(mockOrderRepository.findAllActiveOrdersByWaiter).mockResolvedValue([existingClaimedOrder]);

    await expect(
      orderService.claimOrder('ord-new-2', 'waiter-uuid-123'),
    ).rejects.toThrow('Please mark your current order');
  });

  it('should block claiming when waiter already has 2 active orders', async () => {
    const orders = [
      { orderUuid: 'ord-1', status: 'PREPARING', table: { tableNumber: 1 } } as any,
      { orderUuid: 'ord-2', status: 'CLAIMED',   table: { tableNumber: 3 } } as any,
    ];

    vi.spyOn(mockOrderRepository, 'findById').mockResolvedValue({
      orderUuid: 'ord-new-3',
      status: 'PENDING',
      clubUuid: 'club-1',
    } as any);

    vi.mocked(mockOrderRepository.findAllActiveOrdersByWaiter).mockResolvedValue(orders);

    await expect(
      orderService.claimOrder('ord-new-3', 'waiter-uuid-123'),
    ).rejects.toThrow('You already have 2 active orders');
  });

  it('should allow waiter to claim a second order when first is PREPARING', async () => {
    const preparingOrder = {
      orderUuid: 'ord-existing-1',
      status: 'PREPARING',
      table: { tableNumber: 2 },
    } as any;

    const pendingOrder = {
      orderUuid: 'ord-new-2',
      orderNumber: 'ORD-1002',
      status: 'PENDING',
      clubUuid: 'club-1',
    } as any;

    const claimedResult = { ...pendingOrder, status: 'CLAIMED', waiterUuid: 'waiter-uuid-123' } as any;

    vi.spyOn(mockOrderRepository, 'findById').mockResolvedValue(pendingOrder);
    vi.mocked(mockOrderRepository.findAllActiveOrdersByWaiter).mockResolvedValue([preparingOrder]);
    vi.spyOn(mockOrderRepository, 'claimOrder').mockResolvedValue(claimedResult);

    const result = await orderService.claimOrder('ord-new-2', 'waiter-uuid-123');
    expect(result.status).toBe('CLAIMED');
    expect(mockOrderRepository.claimOrder).toHaveBeenCalledWith('ord-new-2', 'waiter-uuid-123');
  });

  it('should allow waiter to claim order when they have no active orders', async () => {
    const pendingOrder = {
      orderUuid: 'ord-new-2',
      orderNumber: 'ORD-1002',
      status: 'PENDING',
      clubUuid: 'club-1',
    } as any;

    const claimedResult = { ...pendingOrder, status: 'CLAIMED', waiterUuid: 'waiter-uuid-123' } as any;

    vi.spyOn(mockOrderRepository, 'findById').mockResolvedValue(pendingOrder);
    vi.mocked(mockOrderRepository.findAllActiveOrdersByWaiter).mockResolvedValue([]);
    vi.spyOn(mockOrderRepository, 'claimOrder').mockResolvedValue(claimedResult);

    const result = await orderService.claimOrder('ord-new-2', 'waiter-uuid-123');
    expect(result.status).toBe('CLAIMED');
    expect(mockOrderRepository.claimOrder).toHaveBeenCalledWith('ord-new-2', 'waiter-uuid-123');
  });
});
