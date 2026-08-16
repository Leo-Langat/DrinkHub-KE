import React, { useState, useEffect, useCallback } from 'react';
import {
  Wine, ClipboardList, CheckCircle2, Clock, Bell, LogOut,
  User, ChevronDown, Circle, AlertCircle, Package,
  Banknote, CreditCard, Smartphone, ArrowRight, LayoutDashboard, History,
  Loader2, RefreshCcw, WifiOff,
} from 'lucide-react';

/* ─── API config ─── */
const getApiUrl = (path: string): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  let base = envUrl ? envUrl.trim() : 'http://localhost:5000/api/v1';
  if (base.endsWith('/')) base = base.slice(0, -1);
  if (!base.includes('/api/v1')) base = `${base}/api/v1`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('drinkhub_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/* ─── Types ─── */
interface OrderItem {
  name: string;
  quantity: number;
}

interface Order {
  id: string;          // uuid from API
  orderNumber?: string;
  tableNumber: number | string;
  items: OrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'CLAIMED' | 'PREPARING' | 'READY' | 'DELIVERED';
  paymentMethod: 'MPESA' | 'CARD' | 'CASH';
  customerNote?: string;
  elapsedMinutes?: number;
}

/* ─── Helpers ─── */
const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CLAIMED: 'bg-blue-50 text-blue-700 border-blue-200',
  PREPARING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  READY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DELIVERED: 'bg-slate-100 text-slate-600 border-slate-200',
};

const paymentIcons: Record<string, React.ReactNode> = {
  MPESA: <Smartphone className="h-3.5 w-3.5 text-emerald-600" />,
  CARD: <CreditCard className="h-3.5 w-3.5 text-blue-600" />,
  CASH: <Banknote className="h-3.5 w-3.5 text-amber-600" />,
};

const statusFlow: Order['status'][] = ['CLAIMED', 'PREPARING', 'READY', 'DELIVERED'];

/* ─── Helper: map raw API order → Order ─── */
const mapOrder = (o: any): Order => ({
  id: o.orderUuid ?? o.uuid ?? o.id,
  orderNumber: o.orderNumber ?? undefined,
  tableNumber: o.table?.tableNumber ?? o.table?.name ?? o.tableNumber ?? (o.orderNumber ? o.orderNumber : '–'),
  items: (o.items ?? o.orderItems ?? []).map((i: any) => ({
    name: i.product?.name ?? i.name ?? 'Item',
    quantity: i.quantity ?? 1,
  })),
  totalAmount: Number(o.totalAmount ?? o.total ?? 0),
  status: o.status,
  paymentMethod: (o.paymentMethod ?? (o.payments?.[0]?.paymentMethod) ?? 'CASH').toUpperCase() as Order['paymentMethod'],
  customerNote: o.notes ?? o.customerNote ?? undefined,
  elapsedMinutes: o.createdAt
    ? Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000)
    : undefined,
});

/* ─── Component ─── */
export const WaiterDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'available' | 'my-order' | 'history'>('available');

  /* Available orders fetched from API */
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  /* My currently claimed order */
  const [myOrder, setMyOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  /* Completed count for this session */
  const [completedCount, setCompletedCount] = useState(0);

  /* Read logged-in user & venue from localStorage */
  const user = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem('drinkhub_user') || '{}'); }
    catch { return {}; }
  }, []);

  const clubName = user.club?.name || user.clubName || 'Your Venue';
  const fullName = user.fullName || 'Waiter';
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || 'Waiter';
  const lastName = nameParts.slice(1).join(' ');
  const displayName = `${firstName} ${lastName ? lastName.charAt(0) + '.' : ''}`;

  /* ── Fetch available orders ── */
  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const res = await fetch(getApiUrl('/orders?status=PENDING'), { headers: authHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || 'Failed to load orders.');
      }
      const data = await res.json();
      const raw: any[] = data.data?.orders ?? data.data ?? data ?? [];
      setAvailableOrders(raw.map(mapOrder));
    } catch (err: any) {
      setOrdersError(err.message || 'Could not load orders.');
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  /* Initial fetch + polling every 30s */
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30_000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  /* ── Claim an order ── */
  const claimOrder = async (order: Order) => {
    if (myOrder) {
      alert('You already have an active order. Complete it before claiming another.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(getApiUrl(`/orders/${order.id}/claim`), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Failed to claim order.');
      const claimed = mapOrder(data.data?.order ?? data.data ?? { ...order, status: 'CLAIMED' });
      setAvailableOrders((prev) => prev.filter((o) => o.id !== order.id));
      setMyOrder(claimed);
      setActiveTab('my-order');
    } catch (err: any) {
      setActionError(err.message || 'Failed to claim order.');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Advance order status ── */
  const advanceOrderStatus = async () => {
    if (!myOrder) return;
    const nextIndex = statusFlow.indexOf(myOrder.status) + 1;
    if (nextIndex >= statusFlow.length) return;
    const nextStatus = statusFlow[nextIndex];
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(getApiUrl(`/orders/${myOrder.id}/status`), {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Failed to update order.');
      if (nextStatus === 'DELIVERED') {
        setMyOrder(null);
        setCompletedCount((c) => c + 1);
        setActiveTab('history');
      } else {
        setMyOrder((prev) => prev ? { ...prev, status: nextStatus } : null);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const tabs = [
    { key: 'available', label: 'Available Orders', icon: <Package className="h-4 w-4" />, count: availableOrders.length },
    { key: 'my-order', label: 'My Order', icon: <ClipboardList className="h-4 w-4" />, count: myOrder ? 1 : 0 },
    { key: 'history', label: 'History', icon: <History className="h-4 w-4" /> },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-body)' }}>
      {/* Top Nav */}
      <nav className="border-b flex items-center justify-between px-6 py-3 sticky top-0 z-30"
        style={{ background: '#2563EB', borderColor: '#1D4ED8' }}>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Wine className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm">{clubName}</span>
            <span className="mx-2 text-blue-300 text-xs">|</span>
            <span className="text-blue-200 text-xs">{displayName} (Waiter Portal)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            disabled={loadingOrders}
            className="relative h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors disabled:opacity-50"
            title="Refresh orders"
          >
            <RefreshCcw className={`h-4 w-4 ${loadingOrders ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-1.5">
            <div className="h-6 w-6 rounded-full bg-white/30 flex items-center justify-center">
              <User className="h-3 w-3 text-white" />
            </div>
            <span className="text-xs font-medium text-white">{displayName}</span>
          </div>

          <button onClick={onLogout} className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors" title="Sign Out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Completed This Session', value: String(completedCount), icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" /> },
            { label: 'Active Order', value: myOrder ? `Table #${myOrder.tableNumber}` : 'None', icon: <Circle className="h-5 w-5 text-blue-500" /> },
            { label: 'Available to Claim', value: String(availableOrders.length), icon: <Clock className="h-5 w-5 text-amber-500" /> },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border p-4 flex items-center gap-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-body)' }}>
                {kpi.icon}
              </div>
              <div>
                <div className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{kpi.value}</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{kpi.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Action error banner */}
        {actionError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{actionError}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px"
                style={{
                  borderBottomColor: activeTab === tab.key ? '#2563EB' : 'transparent',
                  color: activeTab === tab.key ? '#2563EB' : 'var(--text-secondary)',
                  background: 'transparent',
                }}
              >
                {tab.icon}
                {tab.label}
                {'count' in tab && tab.count > 0 && (
                  <span className="rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* ── AVAILABLE ORDERS TAB ── */}
            {activeTab === 'available' && (
              <div className="space-y-3">
                {loadingOrders ? (
                  <div className="text-center py-16">
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" />
                    <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>Loading orders…</p>
                  </div>
                ) : ordersError ? (
                  <div className="text-center py-16 space-y-3">
                    <WifiOff className="h-10 w-10 mx-auto" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm font-semibold text-red-500">{ordersError}</p>
                    <button onClick={fetchOrders} className="text-xs text-blue-600 hover:underline">
                      Retry →
                    </button>
                  </div>
                ) : availableOrders.length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-300" />
                    <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>No pending orders right now</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>New orders will appear here automatically.</p>
                  </div>
                ) : (
                  availableOrders.map((order) => (
                    <div key={order.id} className="rounded-xl border p-4 flex items-start justify-between gap-4"
                      style={{ background: 'var(--bg-body)', borderColor: 'var(--border)' }}>
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                            {String(order.tableNumber).startsWith('ORD') || String(order.tableNumber).startsWith('#') ? order.tableNumber : `Table #${order.tableNumber}`}
                          </span>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusColors[order.status] ?? ''}`}>
                            {order.status}
                          </span>
                          <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {paymentIcons[order.paymentMethod]}
                            {order.paymentMethod}
                          </span>
                          {order.elapsedMinutes !== undefined && (
                            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              <Clock className="h-3 w-3" />
                              {order.elapsedMinutes} min ago
                            </span>
                          )}
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                        </p>
                        {order.customerNote && (
                          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                            <span className="text-xs text-amber-800">"{order.customerNote}"</span>
                          </div>
                        )}
                        <span className="font-black text-sm text-emerald-600">
                          KES {order.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <button
                        onClick={() => claimOrder(order)}
                        disabled={!!myOrder || actionLoading}
                        className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                        style={{ background: '#2563EB' }}
                      >
                        {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>Claim <ArrowRight className="h-3.5 w-3.5" /></>}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── MY ORDER TAB ── */}
            {activeTab === 'my-order' && (
              <div>
                {!myOrder ? (
                  <div className="text-center py-16 space-y-2">
                    <LayoutDashboard className="h-12 w-12 mx-auto" style={{ color: 'var(--text-muted)' }} />
                    <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>No active order claimed</p>
                    <button onClick={() => setActiveTab('available')} className="text-sm text-blue-600 hover:underline">
                      Browse available orders →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-md mx-auto">
                    <div className="rounded-xl border p-5 space-y-4" style={{ background: 'var(--bg-body)', borderColor: 'var(--border)' }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                            {String(myOrder.tableNumber).startsWith('ORD') || String(myOrder.tableNumber).startsWith('#') ? myOrder.tableNumber : `Table #${myOrder.tableNumber}`}
                          </h3>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Order #{myOrder.orderNumber || (myOrder.id ? myOrder.id.slice(0, 8).toUpperCase() : '')}
                          </p>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusColors[myOrder.status] ?? ''}`}>
                          {myOrder.status}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {myOrder.items.map((item, i) => (
                          <div key={i} className="text-sm flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                            <span>{item.quantity}× {item.name}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                        {paymentIcons[myOrder.paymentMethod]}
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Payment via {myOrder.paymentMethod}
                        </span>
                        <span className="ml-auto font-black text-emerald-600">
                          KES {myOrder.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-2">
                      {(['CLAIMED', 'PREPARING', 'READY', 'DELIVERED'] as const).map((s, i, arr) => (
                        <React.Fragment key={s}>
                          <div className="flex flex-col items-center gap-1">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                              statusFlow.indexOf(myOrder.status) >= i
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-slate-200 text-slate-400'
                            }`}>
                              {i + 1}
                            </div>
                            <span className="text-[9px] font-medium" style={{ color: 'var(--text-muted)' }}>{s}</span>
                          </div>
                          {i < arr.length - 1 && (
                            <div className="flex-1 h-px mb-4" style={{ background: 'var(--border)' }} />
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    <button
                      onClick={advanceOrderStatus}
                      disabled={actionLoading || myOrder.status === 'DELIVERED'}
                      className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: '#2563EB' }}
                    >
                      {actionLoading
                        ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Updating…</span>
                        : myOrder.status === 'CLAIMED' ? 'Mark as Preparing →'
                        : myOrder.status === 'PREPARING' ? 'Mark as Ready for Pickup →'
                        : myOrder.status === 'READY' ? 'Mark as Delivered ✓'
                        : 'Delivered'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── HISTORY TAB ── */}
            {activeTab === 'history' && (
              <div className="text-center py-16 space-y-2">
                <History className="h-12 w-12 mx-auto" style={{ color: 'var(--text-muted)' }} />
                <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {completedCount} order{completedCount !== 1 ? 's' : ''} completed this session
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Full order history is available in the Manager portal.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
