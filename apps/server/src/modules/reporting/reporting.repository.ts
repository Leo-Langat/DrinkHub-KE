/**
 * Reporting Repository
 *
 * All queries are strictly scoped by:
 *   - businessUuid (tenant boundary from live ADMIN record)
 *   - Database-level aggregation where possible
 *   - Revenue recognition based strictly on paymentStatus = 'PAID' and paidAt timestamp
 */

import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';
import { prisma } from '../../config/prisma';

export class ReportingRepository {
  /**
   * Recognized revenue for a given date range (sum of PAID amounts via paidAt).
   */
  async getRevenueForPeriod(businessUuid: string, start: Date, end: Date): Promise<number> {
    const result = await prisma.payment.aggregate({
      where: {
        businessUuid,
        paymentStatus: PaymentStatus.PAID,
        paidAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    });
    return Number(result._sum?.amount || 0);
  }

  /**
   * Fetch all PAID payments in range for daily trend calculation.
   */
  async getPaidPaymentsInRange(
    businessUuid: string,
    start: Date,
    end: Date,
  ): Promise<{ amount: any; paidAt: Date | null }[]> {
    return prisma.payment.findMany({
      where: {
        businessUuid,
        paymentStatus: PaymentStatus.PAID,
        paidAt: { gte: start, lte: end },
      },
      select: {
        amount: true,
        paidAt: true,
      },
    });
  }

  /**
   * Order counts grouped by status in the date range.
   */
  async getOrderStatusGroups(
    businessUuid: string,
    start: Date,
    end: Date,
  ): Promise<{ status: OrderStatus; _count: { orderUuid: number } }[]> {
    const grouped = await prisma.order.groupBy({
      by: ['status'],
      where: {
        businessUuid,
        createdAt: { gte: start, lte: end },
      },
      _count: { orderUuid: true },
    });
    return grouped as { status: OrderStatus; _count: { orderUuid: number } }[];
  }

  /**
   * Total order count in date range.
   */
  async getOrderCountForPeriod(businessUuid: string, start: Date, end: Date): Promise<number> {
    return prisma.order.count({
      where: {
        businessUuid,
        createdAt: { gte: start, lte: end },
      },
    });
  }

  /**
   * Fetch orders for daily trend calculation.
   */
  async getOrdersForTrend(
    businessUuid: string,
    start: Date,
    end: Date,
  ): Promise<{ createdAt: Date; status: OrderStatus; totalAmount: any }[]> {
    return prisma.order.findMany({
      where: {
        businessUuid,
        createdAt: { gte: start, lte: end },
      },
      select: {
        createdAt: true,
        status: true,
        totalAmount: true,
      },
    });
  }

  /**
   * Payment status breakdown and payment method breakdown.
   */
  async getPaymentAggregations(businessUuid: string, start: Date, end: Date) {
    const [statusBreakdown, methodBreakdown, methodPaidRevenue] = await Promise.all([
      prisma.payment.groupBy({
        by: ['paymentStatus'],
        where: {
          businessUuid,
          createdAt: { gte: start, lte: end },
        },
        _count: { paymentUuid: true },
        _sum: { amount: true },
      }),
      prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: {
          businessUuid,
          createdAt: { gte: start, lte: end },
        },
        _count: { paymentUuid: true },
      }),
      prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: {
          businessUuid,
          paymentStatus: PaymentStatus.PAID,
          paidAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
    ]);

    return { statusBreakdown, methodBreakdown, methodPaidRevenue };
  }

  /**
   * Product performance data (order items excluding cancelled orders).
   */
  async getOrderItemsForProducts(businessUuid: string, start: Date, end: Date) {
    const [orderItems, allProducts] = await Promise.all([
      prisma.orderItem.findMany({
        where: {
          businessUuid,
          order: {
            createdAt: { gte: start, lte: end },
            status: { not: OrderStatus.CANCELLED },
          },
        },
        select: {
          productUuid: true,
          quantity: true,
          subtotal: true,
          unitPrice: true,
          product: {
            select: {
              productUuid: true,
              name: true,
              category: {
                select: {
                  categoryUuid: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.product.findMany({
        where: {
          businessUuid,
          deletedAt: null,
        },
        select: {
          productUuid: true,
          name: true,
          category: {
            select: {
              categoryUuid: true,
              name: true,
            },
          },
        },
      }),
    ]);

    return { orderItems, allProducts };
  }

  /**
   * Waiter performance data.
   */
  async getWaiterPerformanceData(businessUuid: string, start: Date, end: Date) {
    const [waiters, orders] = await Promise.all([
      prisma.user.findMany({
        where: {
          businessUuid,
          role: UserRole.WAITER,
          deletedAt: null,
        },
        select: {
          userUuid: true,
          fullName: true,
          email: true,
        },
      }),
      prisma.order.findMany({
        where: {
          businessUuid,
          waiterUuid: { not: null },
          createdAt: { gte: start, lte: end },
        },
        select: {
          orderUuid: true,
          waiterUuid: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return { waiters, orders };
  }

  /**
   * Audit log for report exports.
   */
  async createAuditLog(data: {
    businessUuid: string;
    userUuid: string;
    action: string;
    entityType: string;
    newValues?: any;
    ipAddress?: string;
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          businessUuid: data.businessUuid,
          userUuid: data.userUuid,
          action: data.action,
          entityType: data.entityType,
          newValues: data.newValues ? JSON.parse(JSON.stringify(data.newValues)) : undefined,
          ipAddress: data.ipAddress,
        },
      });
    } catch {
      // Swallowed: audit logs must not block the primary operation
    }
  }
}
