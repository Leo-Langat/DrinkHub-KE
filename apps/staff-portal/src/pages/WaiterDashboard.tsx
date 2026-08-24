import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Wine, ClipboardList, CheckCircle2, Clock, Bell, LogOut,
  User, ChevronDown, Circle, AlertCircle, Package,
  Banknote, CreditCard, Smartphone, ArrowRight, LayoutDashboard, History,
  Loader2, RefreshCcw, WifiOff, Lock, Key, Eye, EyeOff, X, Check,
} from 'lucide-react';

/* ─── API config ─── */
const getApiUrl = (path: string): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  let base = envUrl ? envUrl.trim() : 'http://localhost:5000/api/v1';
  if (base.endsWith('/')) base = base.slice(0, -1);
  if (!base.includes('/api/v1')) base = `${base}/api/v1`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

const getSocketUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  let base = envUrl ? envUrl.trim() : 'http://localhost:5000';
  if (base.endsWith('/')) base = base.slice(0, -1);
  base = base.replace(/\/api\/v1\/?$/, '');
  return base;
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
  price?: number;
  subtotal?: number;
  notes?: string;
  modifiers?: { optionName: string; priceDelta?: number }[];
}

interface Order {
  id: string;          // uuid from API
  orderNumber?: string;
  orderType?: 'DINE_IN' | 'TAKEAWAY' | 'COUNTER_PICKUP' | 'DELIVERY';
  pickupNumber?: string | null;
  customerName?: string | null;
  tableNumber: number | string;
  sectionName?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'CLAIMED' | 'PREPARING' | 'READY' | 'DELIVERED';
  paymentMethod: 'MPESA' | 'CARD' | 'CASH';
  customerNote?: string;
  elapsedMinutes?: number;
  createdAt?: string;
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
  orderType: o.orderType ?? (o.table ? 'DINE_IN' : 'TAKEAWAY'),
  pickupNumber: o.pickupNumber ?? null,
  customerName: o.customerName ?? null,
  tableNumber: o.pickupNumber
    ? o.pickupNumber
    : (o.table?.tableNumber ?? o.table?.name ?? o.tableNumber ?? (o.orderNumber ? o.orderNumber : '–')),
  sectionName: o.orderType === 'TAKEAWAY' ? 'Takeaway / Pickup' : (o.table?.sectionName ?? o.sectionName ?? undefined),
  items: (o.items ?? o.orderItems ?? []).map((i: any) => ({
    name: i.product?.name ?? i.name ?? 'Item',
    quantity: i.quantity ?? 1,
    price: Number(i.unitPrice ?? i.price ?? i.product?.price ?? 0),
    subtotal: Number(i.subtotal ?? (Number(i.unitPrice ?? i.price ?? i.product?.price ?? 0) * (i.quantity ?? 1))),
    notes: i.notes ?? i.instructions ?? undefined,
    modifiers: (i.modifiers || []).map((m: any) => ({
      optionName: m.optionName || m.name || '',
      priceDelta: Number(m.priceDelta || 0),
    })),
  })),
  totalAmount: Number(o.totalAmount ?? o.total ?? 0),
  status: o.status,
  paymentMethod: (o.paymentMethod ?? (o.payments?.[0]?.paymentMethod) ?? 'CASH').toUpperCase() as Order['paymentMethod'],
  customerNote: o.notes ?? o.customerNote ?? undefined,
  createdAt: o.createdAt,
  elapsedMinutes: o.createdAt
    ? Math.max(0, Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000))
    : 0,
});

/* ─── Component ─── */
export const WaiterDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'available' | 'my-order' | 'history'>('available');

  /* Available orders fetched from API */
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  /* My currently claimed order */
  const [myOrder, setMyOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  /* Completed count for this session */
  const [completedCount, setCompletedCount] = useState(0);

  /* Change Password Modal State */
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

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

  /* ── Handle Password Change ── */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (!pwForm.currentPassword) {
      setPwError('Please enter your current password.');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch(getApiUrl('/auth/change-password'), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to update password.');
      }
      setPwSuccess('Password updated successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPwSuccess(null);
      }, 1500);
    } catch (err: any) {
      setPwError(err.message || 'Error updating password.');
    } finally {
      setPwLoading(false);
    }
  };

  /* ── Fetch orders (Available + Active Claimed + History) ── */
  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoadingOrders(true);
    setOrdersError(null);
    try {
      // 1. Fetch available pending orders
      const resPending = await fetch(getApiUrl('/orders?status=PENDING'), { headers: authHeaders() });
      if (resPending.ok) {
        const data = await resPending.json();
        const raw: any[] = data.data?.orders ?? data.data ?? data ?? [];
        setAvailableOrders(raw.map(mapOrder));
      }

      // 2. Fetch my current active claimed order
      const resActive = await fetch(getApiUrl('/orders/my-active'), { headers: authHeaders() });
      if (resActive.ok) {
        const dataActive = await resActive.json();
        const activeRaw = dataActive.data;
        if (activeRaw && (activeRaw.orderUuid || activeRaw.id)) {
          setMyOrder(mapOrder(activeRaw));
        } else {
          setMyOrder(null);
        }
      }

      // 3. Fetch waiter's delivered history orders
      const waiterId = user.id || user.userUuid;
      const historyUrl = waiterId
        ? getApiUrl(`/orders?waiterUuid=${waiterId}&status=DELIVERED`)
        : getApiUrl('/orders?status=DELIVERED');
      const resHistory = await fetch(historyUrl, { headers: authHeaders() });
      if (resHistory.ok) {
        const dataHistory = await resHistory.json();
        const rawHistory: any[] = dataHistory.data?.orders ?? dataHistory.data ?? [];
        const mapped = rawHistory.map(mapOrder);
        setHistoryOrders(mapped);
        setCompletedCount(mapped.length);
      }

      setLastSyncTime(new Date());
    } catch (err: any) {
      if (!silent) setOrdersError(err.message || 'Could not load orders.');
    } finally {
      if (!silent) setLoadingOrders(false);
    }
  }, [user.id, user.userUuid]);

  /* Real-time Socket.IO Connection + 3s Auto-refresher */
  useEffect(() => {
    fetchOrders(false);

    const clubUuid = user.clubUuid || user.tenantId || (user as any).club?.clubUuid;
    let socket: Socket | null = null;

    try {
      socket = io(getSocketUrl(), {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 15,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        if (clubUuid) {
          socket?.emit('join_tenant', clubUuid);
        }
      });

      const handleRealtime = () => {
        fetchOrders(true);
      };

      socket.on('new_order', handleRealtime);
      socket.on('order_claimed', handleRealtime);
      socket.on('order_status_updated', handleRealtime);
      socket.on('notification', handleRealtime);
    } catch {}

    const interval = setInterval(() => fetchOrders(true), 3_000);
    return () => {
      clearInterval(interval);
      if (socket) socket.disconnect();
    };
  }, [fetchOrders, user.clubUuid, user.tenantId]);

  /* Periodic heartbeat every 30s to keep online status active in manager portal */
  useEffect(() => {
    const sendHeartbeat = () => {
      fetch(getApiUrl('/auth/heartbeat'), {
        method: 'POST',
        headers: authHeaders(),
      }).catch(() => {});
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30_000);
    return () => clearInterval(interval);
  }, []);

  /* ── Logout Handler ── */
  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('drinkhub_refresh_token');
      if (refreshToken) {
        await fetch(getApiUrl('/auth/logout'), {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch {
      /* ignore */
    } finally {
      onLogout();
    }
  };

  /* ── Claim an order ── */
  const claimOrder = async (order: Order) => {
    if (!order.id || order.id === 'undefined') {
      setActionError('Invalid order ID.');
      return;
    }
    if (myOrder) {
      alert('You already have an active order in progress. Complete it before claiming another.');
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
      setCheckedItems({});
      setActiveTab('my-order');
    } catch (err: any) {
      setActionError(err.message || 'Failed to claim order.');
      fetchOrders(false);
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
        setCheckedItems({});
        setCompletedCount((c) => c + 1);
        setActiveTab('history');
        fetchOrders(false);
      } else {
        setMyOrder((prev) => prev ? { ...prev, status: nextStatus } : null);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleItemChecked = (index: number) => {
    setCheckedItems(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const tabs = [
    { key: 'available', label: 'Incoming Orders', icon: <Package className="h-4 w-4" />, count: availableOrders.length },
    { key: 'my-order', label: 'Processing Order', icon: <ClipboardList className="h-4 w-4" />, count: myOrder ? 1 : 0 },
    { key: 'history', label: 'Delivered History', icon: <History className="h-4 w-4" />, count: historyOrders.length },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-body)' }}>
      {/* Top Nav */}
      <nav className="border-b flex items-center justify-between px-4 sm:px-6 py-3 sticky top-0 z-30"
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

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => fetchOrders(false)}
            disabled={loadingOrders}
            className="relative h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors disabled:opacity-50"
            title="Refresh orders now"
          >
            <RefreshCcw className={`h-4 w-4 ${loadingOrders ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => { setPwError(null); setPwSuccess(null); setShowPasswordModal(true); }}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
            title="Change Account Password"
          >
            <Key className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Change Password</span>
          </button>

          <div className="flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-1.5">
            <div className="h-6 w-6 rounded-full bg-white/30 flex items-center justify-center">
              <User className="h-3 w-3 text-white" />
            </div>
            <span className="text-xs font-medium text-white">{displayName}</span>
          </div>

          <button onClick={handleLogout} className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors" title="Sign Out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: 'Completed Shift', value: String(completedCount), icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" /> },
            { label: 'Currently Active', value: myOrder ? `Table #${myOrder.tableNumber}` : 'None', icon: <Circle className="h-5 w-5 text-blue-500" /> },
            { label: 'Available Orders', value: String(availableOrders.length), icon: <Clock className="h-5 w-5 text-amber-500" /> },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-body)' }}>
                {kpi.icon}
              </div>
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-black truncate" style={{ color: 'var(--text-primary)' }}>{kpi.value}</div>
                <div className="text-[11px] sm:text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{kpi.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── PINNED ACTIVE PROCESSING ORDER CARD (Always visible when waiter has an active order) ── */}
        {myOrder && (
          <div className="rounded-2xl border-2 border-blue-500 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/40 dark:to-indigo-950/40 p-5 shadow-lg shadow-blue-500/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-200 dark:border-blue-800/60 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Currently Processing
                    </span>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    {String(myOrder.tableNumber).startsWith('ORD') || String(myOrder.tableNumber).startsWith('#') ? myOrder.tableNumber : `Table #${myOrder.tableNumber}`}
                    {myOrder.sectionName ? ` • ${myOrder.sectionName}` : ''}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusColors[myOrder.status] ?? ''}`}>
                  ● {myOrder.status}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  #{myOrder.orderNumber || (myOrder.id ? myOrder.id.slice(0, 8).toUpperCase() : '')}
                </span>
              </div>
            </div>

            {/* Itemized checklist showing exact order items to collect */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                <span>Items in this Order (Tick as prepared)</span>
                <span>Qty & Price</span>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-blue-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                {myOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleItemChecked(idx)}
                    className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      checkedItems[idx] ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={!!checkedItems[idx]}
                        onChange={() => toggleItemChecked(idx)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div>
                        <span className={`text-sm font-semibold ${checkedItems[idx] ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {item.name}
                        </span>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="text-[11px] text-amber-500 font-semibold">
                            ↳ {item.modifiers.map((m) => m.optionName).join(', ')}
                          </div>
                        )}
                        {item.notes && (
                          <div className="text-xs text-amber-600 font-medium">
                            Note: "{item.notes}"
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-black text-xs">
                        × {item.quantity}
                      </span>
                      {item.subtotal ? (
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          KES {item.subtotal.toLocaleString()}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Special Note */}
            {myOrder.customerNote && (
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-bold">Customer Instruction:</span> "{myOrder.customerNote}"
                </div>
              </div>
            )}

            {/* Total and Advance Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-blue-200 dark:border-blue-800/60">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {paymentIcons[myOrder.paymentMethod]}
                  <span>Paid via {myOrder.paymentMethod}</span>
                </div>
                <span className="text-slate-300">•</span>
                <span className="text-base font-black text-emerald-600">
                  Total: KES {myOrder.totalAmount.toLocaleString()}
                </span>
              </div>

              <button
                onClick={advanceOrderStatus}
                disabled={actionLoading || myOrder.status === 'DELIVERED'}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 hover:brightness-110 active:scale-[0.98]"
                style={{ background: myOrder.status === 'READY' ? '#059669' : '#2563EB' }}
              >
                {actionLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Updating Status…</>
                ) : myOrder.status === 'CLAIMED' ? (
                  <>Mark as Preparing in Bar/Kitchen →</>
                ) : myOrder.status === 'PREPARING' ? (
                  <>Mark as Ready for Delivery →</>
                ) : myOrder.status === 'READY' ? (
                  <>✓ Confirm Delivered to Table</>
                ) : (
                  'Delivered'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Action error banner */}
        {actionError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{actionError}</p>
          </div>
        )}

        {/* Tabs & Table */}
        <div className="rounded-xl border overflow-hidden shadow-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          {/* Header with live auto-refresh radar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b px-4 py-3 gap-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-body)' }}>
            <div className="flex border-b sm:border-b-0 -mb-px" style={{ borderColor: 'var(--border)' }}>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold transition-all border-b-2 -mb-px"
                  style={{
                    borderBottomColor: activeTab === tab.key ? '#2563EB' : 'transparent',
                    color: activeTab === tab.key ? '#2563EB' : 'var(--text-secondary)',
                    background: 'transparent',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                  {'count' in tab && tab.count > 0 && (
                    <span className="rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-black px-1.5 py-0.5">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Live Auto-Refresh Status Bar */}
            <div className="flex items-center gap-3 text-xs self-end sm:self-center">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Live Table Auto-Refresh (3s)</span>
              </div>
              <span className="text-[11px] text-slate-400 hidden md:inline">
                Synced {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            {/* ── INCOMING / AVAILABLE ORDERS TAB ── */}
            {activeTab === 'available' && (
              <div className="space-y-3">
                {loadingOrders && availableOrders.length === 0 ? (
                  <div className="text-center py-16">
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" />
                    <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>Scanning for incoming table orders…</p>
                  </div>
                ) : ordersError ? (
                  <div className="text-center py-16 space-y-3">
                    <WifiOff className="h-10 w-10 mx-auto" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm font-semibold text-red-500">{ordersError}</p>
                    <button onClick={() => fetchOrders(false)} className="text-xs text-blue-600 hover:underline">
                      Retry Scan →
                    </button>
                  </div>
                ) : availableOrders.length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-400" />
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>No Pending Table Orders Right Now</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      The table list is auto-refreshing in real time. When a customer places an order from their table, it will appear here immediately.
                    </p>
                  </div>
                ) : (
                  availableOrders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-blue-300 dark:hover:border-blue-700 shadow-sm"
                      style={{ background: 'var(--bg-body)', borderColor: 'var(--border)' }}
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-sm text-slate-900 dark:text-slate-100 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 rounded-lg">
                            {String(order.tableNumber).startsWith('ORD') || String(order.tableNumber).startsWith('#') ? order.tableNumber : `Table #${order.tableNumber}`}
                            {order.sectionName ? ` • ${order.sectionName}` : ''}
                          </span>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusColors[order.status] ?? ''}`}>
                            {order.status}
                          </span>
                          <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {paymentIcons[order.paymentMethod]}
                            {order.paymentMethod}
                          </span>
                          {order.elapsedMinutes !== undefined && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                              <Clock className="h-3 w-3" />
                              {order.elapsedMinutes === 0 ? 'Just now' : `${order.elapsedMinutes} min ago`}
                            </span>
                          )}
                        </div>

                        {/* Exact list of items in the available order */}
                        <div className="text-xs space-y-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {order.items.map((i, idx) => (
                            <div key={idx} className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-blue-600 dark:text-blue-400">×{i.quantity}</span>
                              <span>{i.name}</span>
                              {i.modifiers && i.modifiers.length > 0 && (
                                <span className="text-[11px] text-amber-500 font-semibold">
                                  ({i.modifiers.map((m) => m.optionName).join(', ')})
                                </span>
                              )}
                              {i.notes && <span className="text-[11px] text-amber-600 font-normal">({i.notes})</span>}
                            </div>
                          ))}
                        </div>

                        {order.customerNote && (
                          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                            <span className="text-xs text-amber-800">"{order.customerNote}"</span>
                          </div>
                        )}

                        <div className="font-black text-sm text-emerald-600">
                          KES {order.totalAmount.toLocaleString()}
                        </div>
                      </div>

                      <button
                        onClick={() => claimOrder(order)}
                        disabled={!!myOrder || actionLoading}
                        className="flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-all hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-md shadow-blue-500/20"
                        style={{ background: '#2563EB' }}
                      >
                        {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>Claim & Process <ArrowRight className="h-3.5 w-3.5" /></>}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── PROCESSING ORDER TAB ── */}
            {activeTab === 'my-order' && (
              <div>
                {!myOrder ? (
                  <div className="text-center py-16 space-y-3">
                    <LayoutDashboard className="h-12 w-12 mx-auto" style={{ color: 'var(--text-muted)' }} />
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>No active order claimed yet</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Go to the Incoming Orders tab to claim a new table order and start processing it.
                    </p>
                    <button
                      onClick={() => setActiveTab('available')}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline pt-2"
                    >
                      Browse Incoming Orders →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-lg mx-auto">
                    <div className="rounded-xl border p-5 space-y-4 shadow-sm" style={{ background: 'var(--bg-body)', borderColor: 'var(--border)' }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                            {String(myOrder.tableNumber).startsWith('ORD') || String(myOrder.tableNumber).startsWith('#') ? myOrder.tableNumber : `Table #${myOrder.tableNumber}`}
                            {myOrder.sectionName ? ` • ${myOrder.sectionName}` : ''}
                          </h3>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Order #{myOrder.orderNumber || (myOrder.id ? myOrder.id.slice(0, 8).toUpperCase() : '')}
                          </p>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusColors[myOrder.status] ?? ''}`}>
                          {myOrder.status}
                        </span>
                      </div>

                      {/* Itemized checklist */}
                      <div className="space-y-1.5 border-t border-b py-3" style={{ borderColor: 'var(--border)' }}>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Exact Items List (Check as collected)
                        </div>
                        {myOrder.items.map((item, i) => (
                          <div
                            key={i}
                            onClick={() => toggleItemChecked(i)}
                            className={`text-xs flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                              checkedItems[i] ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-slate-50'
                            }`}
                            style={{ color: checkedItems[i] ? undefined : 'var(--text-secondary)' }}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={!!checkedItems[i]}
                                onChange={() => toggleItemChecked(i)}
                                className="h-3.5 w-3.5 rounded text-blue-600 focus:ring-blue-500"
                              />
                              <span className={checkedItems[i] ? 'line-through opacity-70' : 'font-medium'}>
                                {item.quantity}× {item.name}
                              </span>
                            </div>
                            {item.subtotal ? (
                              <span className="font-mono text-[11px] text-slate-400">
                                KES {item.subtotal.toLocaleString()}
                              </span>
                            ) : null}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
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
                    <div className="flex items-center gap-2 px-2">
                      {(['CLAIMED', 'PREPARING', 'READY', 'DELIVERED'] as const).map((s, i, arr) => (
                        <React.Fragment key={s}>
                          <div className="flex flex-col items-center gap-1">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                              statusFlow.indexOf(myOrder.status) >= i
                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                : 'border-slate-200 text-slate-400'
                            }`}>
                              {i + 1}
                            </div>
                            <span className="text-[9px] font-bold" style={{ color: 'var(--text-muted)' }}>{s}</span>
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
                      className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-md shadow-blue-500/20 hover:opacity-95 disabled:opacity-50"
                      style={{ background: myOrder.status === 'READY' ? '#059669' : '#2563EB' }}
                    >
                      {actionLoading
                        ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Updating…</span>
                        : myOrder.status === 'CLAIMED' ? 'Mark as Preparing in Bar/Kitchen →'
                        : myOrder.status === 'PREPARING' ? 'Mark as Ready for Delivery →'
                        : myOrder.status === 'READY' ? 'Confirm Delivered to Table ✓'
                        : 'Delivered'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── DELIVERED HISTORY TAB ── */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Delivered Orders</h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Orders successfully delivered by you during this shift</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-bold">
                    {historyOrders.length} Completed
                  </span>
                </div>

                {historyOrders.length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <History className="h-12 w-12 mx-auto" style={{ color: 'var(--text-muted)' }} />
                    <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>No delivered orders yet</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>When you complete and deliver table orders, they will appear here.</p>
                  </div>
                ) : (
                  historyOrders.map((order) => (
                    <div key={order.id} className="rounded-xl border p-4 flex items-start justify-between gap-4 shadow-sm"
                      style={{ background: 'var(--bg-body)', borderColor: 'var(--border)' }}>
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                            {String(order.tableNumber).startsWith('ORD') || String(order.tableNumber).startsWith('#') ? order.tableNumber : `Table #${order.tableNumber}`}
                            {order.sectionName ? ` • ${order.sectionName}` : ''}
                          </span>
                          <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 border-slate-200">
                            Order #{order.orderNumber || (order.id ? order.id.slice(0, 8).toUpperCase() : '')}
                          </span>
                          <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                            DELIVERED ✓
                          </span>
                          <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {paymentIcons[order.paymentMethod]}
                            {order.paymentMethod}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-black text-sm text-emerald-600 block">
                          KES {order.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CHANGE PASSWORD MODAL ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setShowPasswordModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: '#E2E8F0' }}>
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Change Password</h3>
                  <p className="text-xs text-slate-500">Update your waiter login credentials</p>
                </div>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {pwError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-center gap-2 text-xs font-semibold text-red-700">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            {pwSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span>{pwSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    required
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                    style={{ borderColor: '#CBD5E1' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                    placeholder="Min 6 characters"
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                    style={{ borderColor: '#CBD5E1' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Re-type new password"
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                    style={{ borderColor: '#CBD5E1' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 rounded-xl border py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  style={{ borderColor: '#CBD5E1' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="flex-1 rounded-xl py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  style={{ background: '#2563EB' }}
                >
                  {pwLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating…
                    </>
                  ) : (
                    'Save New Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
