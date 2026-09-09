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
        offer: true,
        orderItems: { include: { product: true } },
        payments: true,
      },
    });
  }

  async findOrdersByBusiness(businessUuid?: string, status?: OrderStatus, waiterUuid?: string): Promise<Order[]> {
    return prisma.order.findMany({
      where: {
        ...(businessUuid ? { businessUuid } : {}),
        ...(status ? { status } : {}),
        ...(waiterUuid ? { waiterUuid } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        table: true,
        waiter: true,
        offer: true,
        orderItems: { include: { product: true } },
        payments: true,
      },
    });
  }

  async findOrdersByClub(clubUuid?: string, status?: OrderStatus, waiterUuid?: string): Promise<Order[]> {
    return this.findOrdersByBusiness(clubUuid, status, waiterUuid);
  }

  async findActiveClaimedOrderByWaiter(waiterUuid: string): Promise<Order | null> {
    return prisma.order.findFirst({
      where: {
        waiterUuid,
        status: { in: ['CLAIMED', 'PREPARING', 'READY'] },
      },
    });
  }

  async createOrder(businessUuid: string, data: any): Promise<Order> {
    const { tableUuid, items, notes, customerSessionUuid, offerUuid, ageVerified } = data;

    let subtotal = 0;
    const orderItemsData = [];
    const productsMap = new Map<string, any>();
    const productUuids = Array.from(new Set(items.map((it: any) => it.productUuid).filter(Boolean))) as string[];
    const products = await prisma.product.findMany({
      where: { productUuid: { in: productUuids } },
    });
    for (const p of products) {
      productsMap.set(p.productUuid, p);
    }

    for (const item of items) {
      const product = productsMap.get(item.productUuid);
      if (product) {
        const itemSubtotal = Number(product.price) * item.quantity;
        subtotal += itemSubtotal;
        orderItemsData.push({
          businessUuid,
          productUuid: item.productUuid,
          quantity: item.quantity,
          unitPrice: product.price,
          subtotal: itemSubtotal,
          notes: item.notes,
        });
      }
    }

    // ── Apply Offers & Calculate Discounts ──
    let resolvedOfferUuid: string | null = offerUuid ?? null;
    let discountAmount = 0;

    // 1. If explicit offerUuid passed, fetch it
    let matchedOffer = null;
    if (resolvedOfferUuid) {
      matchedOffer = await prisma.offer.findFirst({
        where: { offerUuid: resolvedOfferUuid, businessUuid, isActive: true, deletedAt: null },
      });
    }

    // 2. If no explicit offerUuid, check for any active offer that matches products in the order
    if (!matchedOffer) {
      const activeOffers = await prisma.offer.findMany({
        where: { businessUuid, isActive: true, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });

      for (const off of activeOffers) {
        let prodId: string | null = null;
        if (off.description && off.description.startsWith('{') && off.description.endsWith('}')) {
          try {
            const parsed = JSON.parse(off.description);
            prodId = parsed.productId ?? null;
          } catch {}
        }

        // Check if offer targets an item in the cart
        const hasMatchingProduct = prodId
          ? items.some((it: any) => it.productUuid === prodId)
          : items.some((it: any) => {
              const p = productsMap.get(it.productUuid);
              return p && (off.title.toLowerCase().includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(off.title.toLowerCase()));
            });

        if (hasMatchingProduct) {
          matchedOffer = off;
          resolvedOfferUuid = off.offerUuid;
          break;
        }
      }
    }

    // 3. Compute discount based on matched offer
    if (matchedOffer) {
      const discVal = Number(matchedOffer.discountValue || 0);
      let prodId: string | null = null;
      if (matchedOffer.description && matchedOffer.description.startsWith('{') && matchedOffer.description.endsWith('}')) {
        try {
          const parsed = JSON.parse(matchedOffer.description);
          prodId = parsed.productId ?? null;
        } catch {}
      }

      if (matchedOffer.offerType === 'BUY_ONE_GET_ONE') {
        // Find targeted or eligible items and discount free pairs
        for (const item of items) {
          const p = productsMap.get(item.productUuid);
          const isEligible = !prodId || item.productUuid === prodId;
          if (p && isEligible && item.quantity > 1) {
            const freeCount = Math.floor(item.quantity / 2);
            discountAmount += freeCount * Number(p.price);
          }
        }
      } else if (matchedOffer.offerType === 'FIXED_AMOUNT_DISCOUNT') {
        if (prodId) {
          const matchingItem = items.find((it: any) => it.productUuid === prodId);
          if (matchingItem) {
            discountAmount = Math.min(subtotal, discVal * matchingItem.quantity);
          }
        } else {
          discountAmount = Math.min(subtotal, discVal);
        }
      } else if (matchedOffer.offerType === 'PERCENTAGE_DISCOUNT' && discVal > 0) {
        if (prodId) {
          const matchingItem = items.find((it: any) => it.productUuid === prodId);
          const p = matchingItem ? productsMap.get(matchingItem.productUuid) : null;
          if (matchingItem && p) {
            const itemTotal = Number(p.price) * matchingItem.quantity;
            discountAmount = Math.round(itemTotal * (discVal / 100));
          }
        } else {
          discountAmount = Math.round(subtotal * (discVal / 100));
        }
      }
    }

    discountAmount = Math.max(0, Math.min(subtotal, discountAmount));
    const totalAmount = Math.max(0, subtotal - discountAmount);

    return prisma.order.create({
      data: {
        businessUuid,
        tableUuid,
        customerSessionUuid,
        offerUuid: resolvedOfferUuid,
        orderNumber: `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        subtotalAmount: subtotal,
        discountAmount,
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
        offer: true,
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
