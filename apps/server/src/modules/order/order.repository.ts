import { Order, OrderStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { IOrderRepository } from './order.interface';

export class OrderRepository implements IOrderRepository {
  async findById(orderUuid: string): Promise<Order | null> {
    return prisma.order.findUnique({
      where: { orderUuid },
      include: {
        table: true,
        waiter: true,
        orderItems: { include: { product: true } },
        payments: true,
      },
    });
  }

  async findOrdersByClub(clubUuid?: string, status?: OrderStatus, waiterUuid?: string): Promise<Order[]> {
    return prisma.order.findMany({
      where: {
        ...(clubUuid ? { clubUuid } : {}),
        ...(status ? { status } : {}),
        ...(waiterUuid ? { waiterUuid } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        table: true,
        waiter: true,
        orderItems: { include: { product: true } },
        payments: true,
      },
    });
  }

  async findActiveClaimedOrderByWaiter(waiterUuid: string): Promise<Order | null> {
    return prisma.order.findFirst({
      where: {
        waiterUuid,
        status: { in: ['CLAIMED', 'PREPARING', 'READY'] },
      },
    });
  }

  async createOrder(clubUuid: string, data: any): Promise<Order> {
    const { tableUuid, items, notes, customerSessionUuid, offerUuid, ageVerified } = data;

    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { productUuid: item.productUuid } });
      if (product) {
        const itemSubtotal = Number(product.price) * item.quantity;
        subtotal += itemSubtotal;
        orderItemsData.push({
          clubUuid,
          productUuid: item.productUuid,
          quantity: item.quantity,
          unitPrice: product.price,
          subtotal: itemSubtotal,
          notes: item.notes,
        });
      }
    }

    const totalAmount = subtotal;

    return prisma.order.create({
      data: {
        clubUuid,
        tableUuid,
        customerSessionUuid,
        offerUuid,
        orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        subtotalAmount: subtotal,
        discountAmount: 0,
        totalAmount,
        status: 'PENDING',
        notes,
        ageVerified: ageVerified === true,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
        table: true,
        orderItems: { include: { product: true } },
        payments: true,
      },
    });
  }

  async claimOrder(orderUuid: string, waiterUuid: string): Promise<Order> {
    // Atomic conditional update — prevents double-claiming under concurrent requests.
    // updateMany only updates if the row still has status=PENDING; count=0 means
    // another request already claimed it (or the status changed), so we throw.
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { orderUuid, status: 'PENDING' },
        data: { waiterUuid, status: 'CLAIMED' },
      });

      if (updated.count === 0) {
        throw new Error('ORDER_ALREADY_CLAIMED');
      }

      // Return the full order object with relations after claiming
      return tx.order.findUnique({
        where: { orderUuid },
        include: {
          table: true,
          waiter: true,
          orderItems: { include: { product: true } },
          payments: true,
        },
      });
    });

    if (!result) {
      throw new Error('ORDER_NOT_FOUND_AFTER_CLAIM');
    }

    return result;
  }

  async updateStatus(orderUuid: string, status: OrderStatus): Promise<Order> {
    return prisma.order.update({
      where: { orderUuid },
      data: { status },
      include: {
        table: true,
        waiter: true,
        orderItems: { include: { product: true } },
        payments: true,
      },
    });
  }
}
