import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Wine, ClipboardList, CheckCircle2, Clock, Bell, LogOut,
  User, ChevronDown, Circle, AlertCircle, Package,
  Banknote, CreditCard, Smartphone, ArrowRight, LayoutDashboard, History,
  Loader2, RefreshCcw, WifiOff, Lock, Key, Eye, EyeOff, X, Check,
  CheckSquare, Square, ChefHat, Sparkles, Utensils,
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
  id?: string;
  name: string;
  quantity: number;
  category?: string;
  price?: number;
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
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  CLAIMED: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  PREPARING: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
  READY: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  DELIVERED: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
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
  orderNumber: o.orderNumber ?? (o.orderUuid ? o.orderUuid.slice(0, 8).toUpperCase() : undefined),
  tableNumber: o.table?.tableNumber ?? o.table?.name ?? o.tableNumber ?? (o.orderNumber ? o.orderNumber : '–'),
  items: (o.items ?? o.orderItems ?? []).map((i: any, idx: number) => ({
    id: i.orderItemUuid ?? i.id ?? String(idx),
    name: i.product?.name ?? i.name ?? 'Item',
    quantity: i.quantity ?? 1,
    category: i.product?.category?.name ?? i.product?.category ?? i.category ?? undefined,
    price: Number(i.unitPrice ?? i.product?.price ?? i.price ?? 0),
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
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());
  const [ordersError, setOrdersError] = useState<string | null>(null);

  /* My currently claimed order */
  const [myOrder, setMyOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  /* Checklist of items collected by the waiter while processing */
  const [collectedItemIds, setCollectedItemIds] = useState<Record<string, boolean>>({});

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

  /* ── Toggle Item Collection Checklist ── */
  const toggleItemCollected = (itemKey: string) => {
    setCollectedItemIds(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

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
  const fetchOrders = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoadingOrders(true);
    }
    setIsRefreshing(true);
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
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err: any) {
      setOrdersError(err.message || 'Could not load orders.');
    } finally {
      setLoadingOrders(false);
      setIsRefreshing(false);
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

    const interval = setInterval(() => {
      fetchOrders(true);
    }, 3000);

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
      setCollectedItemIds({});
      setActiveTab('my-order');
    } catch (err: any) {
      setActionError(err.message || 'Failed to claim order.');
      fetchOrders(true);
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
        setCollectedItemIds({});
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

  const tabs = [
    { key: 'available', label: 'Available Orders', icon: <Package className="h-4 w-4" />, count: availableOrders.length },
    { key: 'my-order', label: 'Processing Order', icon: <ClipboardList className="h-4 w-4" />, count: myOrder ? 1 : 0 },
    { key: 'history', label: 'History', icon: <History className="h-4 w-4" />, count: historyOrders.length },
  ] as const;

  const totalMyOrderItemsCount = myOrder ? myOrder.items.reduce((acc, it) => acc + it.quantity, 0) : 0;
  const collectedCountForMyOrder = myOrder ? myOrder.items.reduce((acc, it, idx) => {
    const key = `${myOrder.id}-${it.id || idx}`;
    return acc + (collectedItemIds[key] ? it.quantity : 0);
  }, 0) : 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-body)' }}>
      {/* Top Nav */}
      <nav className="border-b flex items-center justify-between px-6 py-3 sticky top-0 z-30 shadow-md"
        style={{ background: '#2563EB', borderColor: '#1D4ED8' }}>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
            <Wine className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-sm tracking-tight">{clubName}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Waiter Feed
              </span>
            </div>
            <p className="text-blue-100 text-xs font-medium">{displayName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => fetchOrders(false)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg bg-white/15 hover:bg-white/25 px-2.5 py-1.5 text-xs font-bold text-white transition-all disabled:opacity-50"
            title={`Last synced at ${lastSyncTime}. Click to refresh manually.`}
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Sync ({lastSyncTime})</span>
          </button>

          <button
            onClick={() => { setPwError(null); setPwSuccess(null); setShowPasswordModal(true); }}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
            title="Change Account Password"
          >
            <Key className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Password</span>
          </button>

          <div className="flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-1.5">
            <div className="h-6 w-6 rounded-full bg-white/30 flex items-center justify-center font-bold text-xs text-white">
              {firstName[0]}
            </div>
            <span className="text-xs font-medium text-white hidden sm:inline">{displayName}</span>
          </div>

          <button onClick={handleLogout} className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-red-500/80 transition-colors" title="Sign Out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-5">
        {/* Persistent Active Order Banner (If Waiter is Processing an Order) */}
        {myOrder && activeTab !== 'my-order' && (
          <div
            onClick={() => setActiveTab('my-order')}
            className="rounded-2xl p-4 border bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl flex items-center justify-between cursor-pointer hover:shadow-2xl transition-all active:scale-[0.99] animate-in fade-in"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-inner">
                <ChefHat className="h-6 w-6 text-white animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white text-blue-700 shadow-sm">
                    {myOrder.status}
                  </span>
                  <span className="font-black text-sm text-white">
                    {String(myOrder.tableNumber).startsWith('ORD') || String(myOrder.tableNumber).startsWith('#') ? myOrder.tableNumber : `Table #${myOrder.tableNumber}`}
                  </span>
                  <span className="text-xs text-blue-200 font-mono">
                    (#{myOrder.orderNumber || myOrder.id.slice(0, 6).toUpperCase()})
                  </span>
                </div>
                <p className="text-xs text-blue-100 mt-1 line-clamp-1">
                  Processing items: {myOrder.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold bg-white text-blue-700 px-3.5 py-2 rounded-xl shadow-md flex-shrink-0">
              <span>View Processing Checklist</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        )}

        {/* KPI Row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: 'Completed Today', value: String(completedCount), icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" /> },
            { label: 'Active Processing', value: myOrder ? `Table #${myOrder.tableNumber}` : 'None', icon: <ChefHat className="h-5 w-5 text-blue-500" /> },
            { label: 'Live Pending Orders', value: String(availableOrders.length), icon: <Clock className="h-5 w-5 text-amber-500" /> },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-2xl border p-4 flex items-center gap-3.5 shadow-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-body)' }}>
                {kpi.icon}
              </div>
              <div className="min-w-0">
                <div className="text-lg font-black truncate" style={{ color: 'var(--text-primary)' }}>{kpi.value}</div>
                <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{kpi.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Action error banner */}
        {actionError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-800 px-4 py-3 flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">{actionError}</p>
          </div>
        )}

        {/* Tabs Container */}
        <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-xs sm:text-sm font-bold transition-all border-b-2 -mb-px"
                style={{
                  borderBottomColor: activeTab === tab.key ? '#2563EB' : 'transparent',
                  color: activeTab === tab.key ? '#2563EB' : 'var(--text-secondary)',
                  background: activeTab === tab.key ? 'rgba(37,99,235,0.04)' : 'transparent',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {'count' in tab && tab.count > 0 && (
                  <span className={`rounded-full text-[10px] font-black px-2 py-0.5 ${
                    tab.key === 'my-order'
                      ? 'bg-blue-600 text-white animate-pulse'
                      : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-5">
            {/* ── AVAILABLE ORDERS TAB (Live Auto-Refreshing Table Feed) ── */}
            {activeTab === 'available' && (
              <div className="space-y-4">
                {/* Header with live sync pulse */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Live Incoming Orders</h3>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        Auto-Refreshing (3s)
                      </span>
                    </div>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      New customer orders from tables appear here live in real-time.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    Last sync: {lastSyncTime}
                  </div>
                </div>

                {loadingOrders && availableOrders.length === 0 ? (
                  <div className="text-center py-16">
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" />
                    <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>Syncing live table orders…</p>
                  </div>
                ) : ordersError ? (
                  <div className="text-center py-16 space-y-3">
                    <WifiOff className="h-10 w-10 mx-auto text-red-400" />
                    <p className="text-sm font-semibold text-red-500">{ordersError}</p>
                    <button onClick={() => fetchOrders(false)} className="text-xs text-blue-600 font-bold hover:underline">
                      Tap to retry connection →
                    </button>
                  </div>
                ) : availableOrders.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>All orders are claimed!</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Standing by for new table QR orders. The feed refreshes automatically.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="max-h-[62vh] overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                    {availableOrders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-blue-300 dark:hover:border-blue-700 shadow-sm"
                        style={{ background: 'var(--bg-body)', borderColor: 'var(--border)' }}
                      >
                        <div className="space-y-2.5 flex-1 min-w-0">
                          {/* Table & Status Header */}
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <div className="px-3 py-1 rounded-xl bg-blue-600 text-white font-black text-xs shadow-sm flex items-center gap-1.5">
                              <Utensils className="h-3.5 w-3.5" />
                              <span>{String(order.tableNumber).startsWith('ORD') || String(order.tableNumber).startsWith('#') ? order.tableNumber : `Table #${order.tableNumber}`}</span>
                            </div>

                            <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                              #{order.orderNumber || (order.id ? order.id.slice(0, 8).toUpperCase() : '')}
                            </span>

                            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusColors[order.status] ?? ''}`}>
                              {order.status}
                            </span>

                            <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                              {paymentIcons[order.paymentMethod]}
                              <span>{order.paymentMethod}</span>
                            </span>

                            {order.elapsedMinutes !== undefined && (
                              <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                <Clock className="h-3 w-3" />
                                {order.elapsedMinutes === 0 ? 'Just now' : `${order.elapsedMinutes}m ago`}
                              </span>
                            )}
                          </div>

                          {/* Itemized Order Breakdown */}
                          <div className="space-y-1">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Items Ordered:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {order.items.map((i, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                                >
                                  <span className="font-black text-blue-600 dark:text-blue-400">{i.quantity}×</span>
                                  <span>{i.name}</span>
                                </span>
                              ))}
                            </div>
                          </div>

                          {order.customerNote && (
                            <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3 py-1.5">
                              <AlertCircle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                              <span className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                                Note: "{order.customerNote}"
                              </span>
                            </div>
                          )}

                          <div className="pt-1">
                            <span className="font-black text-base text-emerald-600 dark:text-emerald-400">
                              KES {order.totalAmount.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Claim Action */}
                        <div className="flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0" style={{ borderColor: 'var(--border)' }}>
                          <button
                            onClick={() => claimOrder(order)}
                            disabled={!!myOrder || actionLoading}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-black text-white transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
                            style={{ background: '#2563EB' }}
                          >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Claim & Process Order <ArrowRight className="h-4 w-4" /></>}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── MY ORDER TAB (EXACT PROCESSING CHECKLIST) ── */}
            {activeTab === 'my-order' && (
              <div>
                {!myOrder ? (
                  <div className="text-center py-16 space-y-3">
                    <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mx-auto">
                      <LayoutDashboard className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>No active order currently claimed</p>
                      <p className="text-xs text-slate-400 mt-1">Claim an incoming order to start preparing and serving drinks.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('available')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <span>Browse Available Orders</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5 max-w-lg mx-auto">
                    {/* Active Order Card */}
                    <div className="rounded-2xl border p-5 sm:p-6 space-y-5 shadow-md" style={{ background: 'var(--bg-body)', borderColor: 'var(--border)' }}>
                      {/* Header */}
                      <div className="flex justify-between items-start border-b pb-4" style={{ borderColor: 'var(--border)' }}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-xl bg-blue-600 text-white font-black text-sm">
                              {String(myOrder.tableNumber).startsWith('ORD') || String(myOrder.tableNumber).startsWith('#') ? myOrder.tableNumber : `Table #${myOrder.tableNumber}`}
                            </span>
                            <span className="font-mono text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                              #{myOrder.orderNumber || (myOrder.id ? myOrder.id.slice(0, 8).toUpperCase() : '')}
                            </span>
                          </div>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            Assigned to you: {displayName}
                          </p>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusColors[myOrder.status] ?? ''}`}>
                          {myOrder.status}
                        </span>
                      </div>

                      {/* Exact Item Processing Checklist */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <ChefHat className="h-4 w-4 text-blue-600" />
                            <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                              Order Items Checklist
                            </h4>
                          </div>
                          <span className="text-xs font-bold text-slate-500">
                            {collectedCountForMyOrder} / {totalMyOrderItemsCount} items ready
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                            style={{ width: `${totalMyOrderItemsCount > 0 ? (collectedCountForMyOrder / totalMyOrderItemsCount) * 100 : 0}%` }}
                          />
                        </div>

                        {/* Interactive Item Rows */}
                        <div className="space-y-2 pt-1">
                          {myOrder.items.map((item, i) => {
                            const itemKey = `${myOrder.id}-${item.id || i}`;
                            const isChecked = !!collectedItemIds[itemKey];

                            return (
                              <div
                                key={i}
                                onClick={() => toggleItemCollected(itemKey)}
                                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                                  isChecked
                                    ? 'bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                                    : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-blue-300'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="flex-shrink-0">
                                    {isChecked ? (
                                      <CheckSquare className="h-5 w-5 text-emerald-600" />
                                    ) : (
                                      <Square className="h-5 w-5 text-slate-400" />
                                    )}
                                  </div>
                                  <div>
                                    <div className={`text-sm font-bold flex items-center gap-2 ${isChecked ? 'line-through opacity-80' : ''}`} style={{ color: isChecked ? undefined : 'var(--text-primary)' }}>
                                      <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-black">
                                        {item.quantity}×
                                      </span>
                                      <span>{item.name}</span>
                                    </div>
                                    {item.category && (
                                      <p className="text-[10px] text-slate-400 mt-0.5">{item.category}</p>
                                    )}
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-slate-500">
                                  {isChecked ? <span className="text-emerald-600 font-black">✓ Ready</span> : 'Tap to collect'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Customer Note */}
                      {myOrder.customerNote && (
                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[11px] font-bold text-amber-900 dark:text-amber-200">Customer Note:</p>
                            <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">"{myOrder.customerNote}"</p>
                          </div>
                        </div>
                      )}

                      {/* Payment and Total Footer */}
                      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {paymentIcons[myOrder.paymentMethod]}
                          <span>Paid via {myOrder.paymentMethod}</span>
                        </div>
                        <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">
                          KES {myOrder.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Visual 4-Stage Progress Stepper */}
                    <div className="rounded-2xl border p-4" style={{ background: 'var(--bg-body)', borderColor: 'var(--border)' }}>
                      <div className="flex items-center justify-between">
                        {(['CLAIMED', 'PREPARING', 'READY', 'DELIVERED'] as const).map((s, i, arr) => {
                          const currentStepIndex = statusFlow.indexOf(myOrder.status);
                          const isDone = currentStepIndex >= i;
                          const isCurrent = currentStepIndex === i;

                          return (
                            <React.Fragment key={s}>
                              <div className="flex flex-col items-center gap-1">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
                                  isCurrent
                                    ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-500/20'
                                    : isDone
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-slate-300 dark:border-slate-700 text-slate-400'
                                }`}>
                                  {isDone && !isCurrent ? '✓' : i + 1}
                                </div>
                                <span className={`text-[10px] font-bold ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                                  {s}
                                </span>
                              </div>
                              {i < arr.length - 1 && (
                                <div className={`flex-1 h-0.5 mb-4 mx-1 transition-all ${
                                  currentStepIndex > i ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                                }`} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step Advance Button */}
                    <button
                      onClick={advanceOrderStatus}
                      disabled={actionLoading || myOrder.status === 'DELIVERED'}
                      className="w-full py-4 rounded-2xl text-sm font-black text-white transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2"
                      style={{ background: myOrder.status === 'READY' ? '#10B981' : '#2563EB' }}
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Updating status…</span>
                        </>
                      ) : myOrder.status === 'CLAIMED' ? (
                        <>
                          <ChefHat className="h-4 w-4" />
                          <span>Mark as Preparing / Collecting Drinks →</span>
                        </>
                      ) : myOrder.status === 'PREPARING' ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Mark as Ready for Delivery →</span>
                        </>
                      ) : myOrder.status === 'READY' ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Mark as Delivered to Table ✓</span>
                        </>
                      ) : (
                        <span>Order Completed ✓</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── HISTORY TAB ── */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Delivered Orders History</h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Completed and delivered by you during this shift</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 px-3 py-1 text-xs font-bold">
                    {historyOrders.length} Completed
                  </span>
                </div>

                {historyOrders.length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <History className="h-12 w-12 mx-auto" style={{ color: 'var(--text-muted)' }} />
                    <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>No delivered orders yet</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>When you complete and deliver orders, they will appear here.</p>
                  </div>
                ) : (
                  <div className="max-h-[62vh] overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                    {historyOrders.map((order) => (
                      <div key={order.id} className="rounded-2xl border p-4 flex items-start justify-between gap-4"
                        style={{ background: 'var(--bg-body)', borderColor: 'var(--border)' }}>
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                              {String(order.tableNumber).startsWith('ORD') || String(order.tableNumber).startsWith('#') ? order.tableNumber : `Table #${order.tableNumber}`}
                            </span>
                            <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                              #{order.orderNumber || (order.id ? order.id.slice(0, 8).toUpperCase() : '')}
                            </span>
                            <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
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
                          <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 block">
                            KES {order.totalAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
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
