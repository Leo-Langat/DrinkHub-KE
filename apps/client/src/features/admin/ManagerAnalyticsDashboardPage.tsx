import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Clock,
  Wine,
  Smartphone,
  CreditCard,
  Banknote,
  DollarSign,
  PieChart as PieIcon,
  Flame,
  Award,
  RefreshCcw,
} from 'lucide-react';
import { apiClient } from '../../config/api';

interface TopProduct {
  rank: number;
  name: string;
  sold: number;
  revenue: string;
}

export const ManagerAnalyticsDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bizRes, ordRes, analyticsRes] = await Promise.allSettled([
        apiClient.get('/tenants/current'),
        apiClient.get('/orders'),
        apiClient.get('/reports/analytics?period=WEEKLY'),
      ]);

      let hasSuccess = false;

      if (bizRes.status === 'fulfilled') {
        const d = bizRes.value.data?.data;
        setBusiness(d?.business || d?.club || d);
        hasSuccess = true;
      }
      if (ordRes.status === 'fulfilled') {
        const d = ordRes.value.data?.data;
        setOrders(d?.orders || (Array.isArray(d) ? d : []));
        hasSuccess = true;
      }
      if (analyticsRes.status === 'fulfilled') {
        const d = analyticsRes.value.data?.data;
        setAnalytics(d?.report || d);
        hasSuccess = true;
      }

      if (!hasSuccess && (bizRes.status === 'rejected' || ordRes.status === 'rejected')) {
        setError('Failed to load operational analytics. Please check your network connection.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const businessName = business?.name || 'Venue Operations';
  const businessCity = business?.city || business?.county || 'Kenya';

  const paidOrCompletedOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status === 'COMPLETED' || o.status === 'DELIVERED' || o.paymentStatus === 'PAID'
    );
  }, [orders]);

  const todaySales = useMemo(() => {
    const fromOrders = paidOrCompletedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    return fromOrders || Number(analytics?.kpis?.totalRevenue || 0);
  }, [paidOrCompletedOrders, analytics]);

  const pendingCount = useMemo(() => {
    return orders.filter((o) => o.status === 'PENDING').length;
  }, [orders]);

  const topProductsList = useMemo<TopProduct[]>(() => {
    if (Array.isArray(analytics?.topProducts) && analytics.topProducts.length > 0) {
      return analytics.topProducts.slice(0, 5).map((p: any, idx: number) => ({
        rank: idx + 1,
        name: p.name || 'Product',
        sold: Number(p.unitsSold || p.quantity || 0),
        revenue: `KES ${Number(p.revenue || 0).toLocaleString()}`,
      }));
    }

    const itemMap: Record<string, { name: string; sold: number; revenue: number }> = {};
    orders.forEach((o) => {
      (o.items || o.orderItems || []).forEach((item: any) => {
        const name = item.product?.name || item.productName || item.name || 'Item';
        if (!itemMap[name]) itemMap[name] = { name, sold: 0, revenue: 0 };
        itemMap[name].sold += Number(item.quantity || 1);
        itemMap[name].revenue += Number(item.subtotal || item.unitPrice * (item.quantity || 1) || 0);
      });
    });

    return Object.values(itemMap)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5)
      .map((p, idx) => ({
        rank: idx + 1,
        name: p.name,
        sold: p.sold,
        revenue: `KES ${p.revenue.toLocaleString()}`,
      }));
  }, [analytics, orders]);

  const topDrink = topProductsList[0] || { name: 'No sales recorded yet', sold: 0 };

  const paymentData = useMemo(() => {
    const rawBreakdown = analytics?.paymentBreakdown;
    if (rawBreakdown) {
      return {
        mpesa: {
          pct: Math.round(rawBreakdown.mpesa?.percentage || 0),
          amt: Math.round((todaySales * (rawBreakdown.mpesa?.percentage || 0)) / 100),
        },
        card: {
          pct: Math.round(rawBreakdown.card?.percentage || 0),
          amt: Math.round((todaySales * (rawBreakdown.card?.percentage || 0)) / 100),
        },
        cash: {
          pct: Math.round(rawBreakdown.cash?.percentage || 0),
          amt: Math.round((todaySales * (rawBreakdown.cash?.percentage || 0)) / 100),
        },
      };
    }

    const counts: Record<string, number> = { MPESA_STK: 0, CARD: 0, CASH: 0 };
    orders.forEach((o) => {
      const method = (o.paymentMethod || o.payment?.method || 'MPESA_STK').toUpperCase();
      if (counts[method] !== undefined) counts[method] += Number(o.totalAmount || 0);
    });
    const total = counts.MPESA_STK + counts.CARD + counts.CASH || 1;

    return {
      mpesa: { pct: Math.round((counts.MPESA_STK / total) * 100), amt: counts.MPESA_STK },
      card: { pct: Math.round((counts.CARD / total) * 100), amt: counts.CARD },
      cash: { pct: Math.round((counts.CASH / total) * 100), amt: counts.CASH },
    };
  }, [analytics, orders, todaySales]);

  const hourlyData = useMemo(() => {
    const hours = [
      { hour: '4 PM', h: 16 },
      { hour: '6 PM', h: 18 },
      { hour: '8 PM', h: 20 },
      { hour: '10 PM', h: 22 },
      { hour: '11 PM', h: 23 },
      { hour: '12 AM', h: 0 },
      { hour: '1 AM', h: 1 },
      { hour: '2 AM', h: 2 },
    ];

    const hMap: Record<number, number> = {};
    if (Array.isArray(analytics?.hourlyOrders)) {
      analytics.hourlyOrders.forEach((h: any) => {
        hMap[Number(h.hour ?? h.h)] = Number(h.count ?? h.n ?? 0);
      });
    } else {
      orders.forEach((o) => {
        if (o.createdAt) {
          const hr = new Date(o.createdAt).getHours();
          hMap[hr] = (hMap[hr] || 0) + 1;
        }
      });
    }

    const items = hours.map((h) => ({
      hour: h.hour,
      orders: hMap[h.h] || 0,
    }));

    const maxOrders = Math.max(...items.map((i) => i.orders), 1);
    return { items, maxOrders };
  }, [analytics, orders]);

  return (
    <div className="min-h-screen bg-dark-950 p-6 space-y-8 text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Venue Analytics & Operations</h1>
          <p className="text-xs text-slate-400">
            {businessName} • {businessCity} • Realtime Sales & Operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 transition"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="flex items-center space-x-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-extrabold text-emerald-400 border border-emerald-500/30">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Live Register Active</span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-semibold text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchData}
            className="rounded-lg bg-red-500/20 px-3 py-1 text-xs font-bold text-red-300 hover:bg-red-500/30 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* 1. METRIC CARDS GRID */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Sales */}
        <div className="glass-panel p-5 space-y-2 border-l-4 border-l-brand-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Today's Sales</span>
            <DollarSign className="h-4 w-4 text-brand-400" />
          </div>
          <p className="text-2xl font-black text-white">KES {todaySales.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-400 font-bold flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" />
            {paidOrCompletedOrders.length} settled orders
          </p>
        </div>

        {/* Pending Orders */}
        <div className="glass-panel p-5 space-y-2 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Pending Orders</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">{pendingCount} Active</p>
          <p className="text-[11px] text-amber-300">Awaiting kitchen/waiter claim</p>
        </div>

        {/* Top Drink */}
        <div className="glass-panel p-5 space-y-2 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">#1 Best Seller</span>
            <Award className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-lg font-black text-white truncate">{topDrink.name}</p>
          <p className="text-[11px] text-indigo-400 font-bold">
            {topDrink.sold > 0 ? `${topDrink.sold} units sold` : 'No sales recorded'}
          </p>
        </div>

        {/* Payment M-Pesa Share */}
        <div className="glass-panel p-5 space-y-2 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">M-Pesa Share</span>
            <Smartphone className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">{paymentData.mpesa.pct}%</p>
          <p className="text-[11px] text-slate-400">
            Card {paymentData.card.pct}% • Cash {paymentData.cash.pct}%
          </p>
        </div>
      </div>

      {/* 2. CHARTS SECTION */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* PEAK HOURS HOURLY VOLUME BAR CHART */}
        <div className="glass-panel p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Flame className="h-5 w-5 text-amber-400" />
              <h3 className="text-base font-extrabold text-white">Peak Hours Volume (Orders / Hour)</h3>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              Live Database Feed
            </span>
          </div>

          <div className="h-56 flex items-end justify-between space-x-2 pt-6 px-2">
            {hourlyData.items.map((d, i) => {
              const heightPercent = d.orders > 0 ? Math.max(10, (d.orders / hourlyData.maxOrders) * 100) : 4;
              const isPeak = d.orders > 0 && d.orders === hourlyData.maxOrders;
              return (
                <div key={i} className="flex-1 flex flex-col items-center space-y-2 group">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-dark-900 text-amber-400 text-[10px] font-bold py-1 px-1.5 rounded border border-slate-800">
                    {d.orders} orders
                  </div>
                  <div className="w-full bg-dark-900 rounded-t-xl overflow-hidden h-40 flex items-end">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full transition-all duration-500 ${
                        isPeak
                          ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                          : 'bg-gradient-to-t from-brand-600 to-brand-400'
                      } rounded-t-xl`}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 font-semibold">{d.hour}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* PAYMENT METHOD BREAKDOWN PIE / DONUT */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-extrabold text-white">Payment Method Breakdown</h3>
            <PieIcon className="h-5 w-5 text-emerald-400" />
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="flex items-center text-emerald-400 font-bold">
                  <Smartphone className="h-3.5 w-3.5 mr-1" /> M-Pesa STK Express
                </span>
                <span className="font-extrabold text-white">
                  {paymentData.mpesa.pct}% (KES {paymentData.mpesa.amt.toLocaleString()})
                </span>
              </div>
              <div className="w-full bg-dark-900 h-2.5 rounded-full overflow-hidden">
                <div style={{ width: `${paymentData.mpesa.pct}%` }} className="bg-emerald-500 h-full" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="flex items-center text-brand-400 font-bold">
                  <CreditCard className="h-3.5 w-3.5 mr-1" /> Credit/Debit Card POS
                </span>
                <span className="font-extrabold text-white">
                  {paymentData.card.pct}% (KES {paymentData.card.amt.toLocaleString()})
                </span>
              </div>
              <div className="w-full bg-dark-900 h-2.5 rounded-full overflow-hidden">
                <div style={{ width: `${paymentData.card.pct}%` }} className="bg-brand-500 h-full" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="flex items-center text-amber-400 font-bold">
                  <Banknote className="h-3.5 w-3.5 mr-1" /> Cash Payments
                </span>
                <span className="font-extrabold text-white">
                  {paymentData.cash.pct}% (KES {paymentData.cash.amt.toLocaleString()})
                </span>
              </div>
              <div className="w-full bg-dark-900 h-2.5 rounded-full overflow-hidden">
                <div style={{ width: `${paymentData.cash.pct}%` }} className="bg-amber-500 h-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TOP DRINKS LEADERBOARD */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-base font-extrabold text-white border-b border-slate-800 pb-3">
          🔥 Top 5 Best-Selling Items Today
        </h3>

        {topProductsList.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">No items sold yet.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-5">
            {topProductsList.map((d) => (
              <div key={d.rank} className="rounded-xl bg-dark-900 p-4 border border-slate-800 space-y-1 text-xs">
                <span className="font-bold text-amber-400">#{d.rank} Rank</span>
                <p className="font-bold text-white leading-tight truncate">{d.name}</p>
                <p className="text-slate-400">{d.sold} units sold</p>
                <p className="font-black text-brand-400 pt-1">{d.revenue}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
