import { Order, OrderStatus } from '@prisma/client';

export interface IOrderRepository {
  findById(orderUuid: string): Promise<Order | null>;
  findOrdersByClub(clubUuid: string, status?: OrderStatus): Promise<Order[]>;
  findActiveClaimedOrderByWaiter(waiterUuid: string): Promise<Order | null>;
  createOrder(clubUuid: string, data: any): Promise<Order>;
  claimOrder(orderUuid: string, waiterUuid: string): Promise<Order>;
  updateStatus(orderUuid: string, status: OrderStatus): Promise<Order>;
}
