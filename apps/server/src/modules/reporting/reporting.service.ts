import { prisma } from '../../config/prisma';

export class ReportingService {
  async generateAnalyticsReport(clubUuid: string, period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' = 'WEEKLY') {
    // 1. Resolve clubUuid
    let targetClubUuid = clubUuid;
    if (!targetClubUuid || targetClubUuid === 'default-club') {
      const firstClub = await prisma.club.findFirst({ where: { deletedAt: null } });
      if (firstClub) targetClubUuid = firstClub.clubUuid;
    }

    const clubFilter = targetClubUuid && targetClubUuid !== 'default-club' ? { clubUuid: targetClubUuid } : {};

    // 2. Fetch all orders for this club with relations
    const orders = await prisma.order.findMany({
      where: {
        ...clubFilter,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        table: true,
        waiter: true,
        orderItems: { include: { product: { include: { category: true } } } },
        payments: true,
      },
    });

    // 3. KPI Summary
    const totalOrdersCount = orders.length;
    const completedOrders = orders.filter(o => o.status === 'COMPLETED' || o.status === 'DELIVERED');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const averageOrderValue = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;

    // Active waiters
    const waiterIds = new Set(orders.map(o => o.waiterUuid).filter(Boolean));
    const totalClubWaiters = await prisma.user.count({
      where: {
        ...clubFilter,
        role: 'WAITER',
        isActive: true,
      },
    });
    const activeWaitersCount = waiterIds.size > 0 ? waiterIds.size : totalClubWaiters;

    // 4. Daily Revenue Breakdown (Mon - Sun)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyRevenueMap: Record<string, number> = {
      Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0,
    };

    completedOrders.forEach(o => {
      const d = new Date(o.createdAt);
      const dayName = dayNames[d.getDay()];
      if (dailyRevenueMap[dayName] !== undefined) {
        dailyRevenueMap[dayName] += Number(o.totalAmount || 0);
      }
    });

    const dailyRevenue = daysOrder.map(day => ({
      day,
      date: day,
      revenue: dailyRevenueMap[day] || 0,
    }));

    // 5. Hourly Orders Breakdown (00:00 to 23:00)
    const hourlyMap: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourlyMap[i] = 0;

    orders.forEach(o => {
      const h = new Date(o.createdAt).getHours();
      hourlyMap[h] = (hourlyMap[h] || 0) + 1;
    });

    const hourlyOrders = Object.keys(hourlyMap).map(h => ({
      hour: Number(h),
      h: Number(h),
      count: hourlyMap[Number(h)],
      n: hourlyMap[Number(h)],
    }));

    // 6. Payment Method Breakdown from DB
    let mpesaCount = 0;
    let cardCount = 0;
    let cashCount = 0;

    const payments = await prisma.payment.findMany({
      where: clubFilter,
    });

    if (payments.length > 0) {
      payments.forEach(p => {
        if (p.paymentMethod === 'MPESA_STK') mpesaCount++;
        else if (p.paymentMethod === 'CARD') cardCount++;
        else if (p.paymentMethod === 'CASH') cashCount++;
      });
    } else {
      // If payment records don't exist yet, derive from completed orders count
      mpesaCount = completedOrders.length;
    }

    const totalPayments = mpesaCount + cardCount + cashCount || 1;
    const paymentBreakdown = {
      mpesa: { count: mpesaCount, percentage: Math.round((mpesaCount / totalPayments) * 100) },
      card: { count: cardCount, percentage: Math.round((cardCount / totalPayments) * 100) },
      cash: { count: cashCount, percentage: Math.round((cashCount / totalPayments) * 100) },
    };

    // 7. Top Products Analytics from real OrderItems
    const productStatsMap: Record<string, { name: string; category: string; unitsSold: number; revenue: number }> = {};

    orders.forEach(o => {
      (o.orderItems || []).forEach(item => {
        const pName = item.product?.name || 'Product';
        const catName = item.product?.category?.name || 'Beverages';
        const qty = Number(item.quantity || 1);
        const rev = Number(item.subtotal || (item.unitPrice ? Number(item.unitPrice) * qty : 0));

        if (!productStatsMap[pName]) {
          productStatsMap[pName] = { name: pName, category: catName, unitsSold: 0, revenue: 0 };
        }
        productStatsMap[pName].unitsSold += qty;
        productStatsMap[pName].revenue += rev;
      });
    });

    const topProducts = Object.values(productStatsMap)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 10);

    // 8. Waiter Performance Analytics from real Waiter data
    const waiterStatsMap: Record<string, { name: string; ordersServed: number; revenueGenerated: number; totalFulfillMs: number }> = {};

    orders.forEach(o => {
      if (o.waiter) {
        const wName = o.waiter.fullName || 'Waiter';
        const rev = (o.status === 'COMPLETED' || o.status === 'DELIVERED') ? Number(o.totalAmount || 0) : 0;
        const fulfillMs = (o.updatedAt && o.createdAt) ? Math.max(0, new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime()) : 3 * 60 * 1000;

        if (!waiterStatsMap[wName]) {
          waiterStatsMap[wName] = { name: wName, ordersServed: 0, revenueGenerated: 0, totalFulfillMs: 0 };
        }
        if (o.status === 'COMPLETED' || o.status === 'DELIVERED') {
          waiterStatsMap[wName].ordersServed += 1;
        }
        waiterStatsMap[wName].revenueGenerated += rev;
        waiterStatsMap[wName].totalFulfillMs += fulfillMs;
      }
    });

    const waiterPerformance = Object.values(waiterStatsMap).map(w => ({
      name: w.name,
      ordersServed: w.ordersServed,
      revenueGenerated: w.revenueGenerated,
      avgFulfillmentMins: w.ordersServed > 0 ? Number((w.totalFulfillMs / (w.ordersServed * 60 * 1000)).toFixed(1)) : 3.5,
    }));

    // 9. Customer Metrics
    const uniqueSessions = new Set(orders.map(o => o.customerSessionUuid).filter(Boolean));
    const tableOrdersMap: Record<string, number> = {};
    orders.forEach(o => {
      if (o.tableUuid) {
        tableOrdersMap[o.tableUuid] = (tableOrdersMap[o.tableUuid] || 0) + Number(o.totalAmount || 0);
      }
    });
    const tableSpends = Object.values(tableOrdersMap);
    const avgTableSpend = tableSpends.length > 0 ? Math.round(tableSpends.reduce((a, b) => a + b, 0) / tableSpends.length) : averageOrderValue;

    const customerMetrics = {
      totalCustomerSessions: uniqueSessions.size || totalOrdersCount,
      repeatCustomersCount: Math.max(0, totalOrdersCount - uniqueSessions.size),
      averageTableSpend: avgTableSpend,
    };

    return {
      period,
      generatedAt: new Date().toISOString(),
      kpis: {
        totalRevenue,
        totalOrdersCount,
        averageOrderValue,
        activeWaitersCount,
      },
      dailyRevenue,
      hourlyOrders,
      paymentBreakdown,
      topProducts,
      waiterPerformance,
      customerMetrics,
    };
  }

  generateCsvReport(data: any): string {
    let csv = 'Dimension,Metric,Value\n';
    csv += `KPIs,Total Revenue,KES ${data.kpis.totalRevenue}\n`;
    csv += `KPIs,Total Orders,${data.kpis.totalOrdersCount}\n`;
    csv += `KPIs,Average Order Value,KES ${data.kpis.averageOrderValue}\n`;
    csv += `KPIs,Active Waiters,${data.kpis.activeWaitersCount}\n`;
    csv += `Payment Breakdown,M-Pesa STK,${data.paymentBreakdown.mpesa.percentage}%\n`;
    csv += `Payment Breakdown,Card POS,${data.paymentBreakdown.card.percentage}%\n`;
    csv += `Payment Breakdown,Cash,${data.paymentBreakdown.cash.percentage}%\n`;

    csv += '\nProduct,Category,Units Sold,Revenue (KES)\n';
    for (const p of data.topProducts || []) {
      csv += `"${p.name}",${p.category},${p.unitsSold},${p.revenue}\n`;
    }

    csv += '\nWaiter,Orders Served,Revenue Generated (KES),Avg Fulfillment (Mins)\n';
    for (const w of data.waiterPerformance || []) {
      csv += `"${w.name}",${w.ordersServed},${w.revenueGenerated},${w.avgFulfillmentMins}\n`;
    }

    return csv;
  }
}

