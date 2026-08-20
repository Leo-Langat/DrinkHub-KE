import { Order, OrderStatus } from '@prisma/client';
import { IOrderRepository } from './order.interface';
import { NotFoundError, BadRequestError } from '../../common/errors/app-error';
import { getIO } from '../../config/socket';
import { logger } from '../../config/logger';
import { prisma } from '../../config/prisma';

export class OrderService {
  constructor(private orderRepository: IOrderRepository) {}

  async getOrderById(orderUuid: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderUuid);
    if (!order) {
      throw new NotFoundError('Order not found');
    }
    return order;
  }

  async getOrdersForClub(clubUuid?: string, status?: OrderStatus, waiterUuid?: string): Promise<Order[]> {
    let targetClubUuid = clubUuid;
    if (targetClubUuid === 'default-club') {
      const firstClub = await prisma.club.findFirst({ where: { deletedAt: null } });
      if (firstClub) targetClubUuid = firstClub.clubUuid;
    }
    return this.orderRepository.findOrdersByClub(targetClubUuid, status, waiterUuid);
  }

  async getActiveClaimedOrderByWaiter(waiterUuid: string): Promise<Order | null> {
    return this.orderRepository.findActiveClaimedOrderByWaiter(waiterUuid);
  }

  async createOrder(clubUuid: string, data: any): Promise<Order> {
    const order = await this.orderRepository.createOrder(clubUuid, data);

    // Emit Realtime Socket.IO Event for Kitchen & Waiters
    try {
      const io = getIO();
      io.to(`tenant:${clubUuid}`).emit('new_order', order);
      io.to(`tenant:${clubUuid}:kitchen`).emit('new_order_kitchen', order);
    } catch (_e) {
      logger.warn('Socket.IO not ready for new_order broadcast.');
    }

    return order;
  }

  async claimOrder(orderUuid: string, waiterUuid: string): Promise<Order> {
    const order = await this.getOrderById(orderUuid);

    if (order.status !== 'PENDING') {
      throw new BadRequestError(`Order cannot be claimed because its status is '${order.status}'`);
    }

    // ENFORCE RULE: Waiter can claim ONLY ONE active order at a time
    const activeClaimedOrder = await this.orderRepository.findActiveClaimedOrderByWaiter(waiterUuid);
    if (activeClaimedOrder) {
      throw new BadRequestError(
        `You already have an active order (#${activeClaimedOrder.orderNumber} at Table #${(activeClaimedOrder as any).table?.tableNumber || 'N/A'}). Complete or deliver it before claiming another!`,
      );
    }

    let claimedOrder: Order;
    try {
      claimedOrder = await this.orderRepository.claimOrder(orderUuid, waiterUuid);
    } catch (err: any) {
      if (err?.message === 'ORDER_ALREADY_CLAIMED') {
        // Race condition: another waiter claimed it between our check and the update
        throw new BadRequestError('This order was just claimed by another waiter. Please refresh and try again.');
      }
      throw err;
    }

    // Emit Realtime Socket.IO Event - Disappears for all other waiters in real time!
    try {
      const io = getIO();
      io.to(`tenant:${order.clubUuid}`).emit('order_claimed', {
        orderUuid,
        waiterUuid,
        waiterName: (claimedOrder as any).waiter?.fullName || 'Waiter',
        claimedOrder,
      });
    } catch (_e) {
      logger.warn('Socket.IO not ready for order_claimed broadcast.');
    }

    return claimedOrder;
  }

  async updateOrderStatus(orderUuid: string, status: OrderStatus): Promise<Order> {
    const order = await this.getOrderById(orderUuid);
    const updatedOrder = await this.orderRepository.updateStatus(orderUuid, status);

    // Broadcast Realtime Update
    try {
      const io = getIO();
      io.to(`tenant:${order.clubUuid}`).emit('order_status_updated', {
        orderUuid,
        status,
        updatedOrder,
      });
    } catch (_e) {
      logger.warn('Socket.IO not ready for order_status_updated broadcast.');
    }

    return updatedOrder;
  }
}
