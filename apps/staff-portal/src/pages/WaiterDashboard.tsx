import React, { useState } from 'react';
import {
  Wine, ClipboardList, CheckCircle2, Clock, Bell, LogOut,
  Moon, Sun, User, ChevronDown, Circle, AlertCircle, Package,
  Banknote, CreditCard, Smartphone, ArrowRight, LayoutDashboard, History,
} from 'lucide-react';

interface Order {
  id: string;
  table: number;
  items: string[];
  total: number;
  status: 'PENDING' | 'CLAIMED' | 'PREPARING' | 'READY';
  elapsed: number;
  paymentMethod: 'mpesa' | 'card' | 'cash';
  customerNote?: string;
}

const DEMO_AVAILABLE_ORDERS: Order[] = [
  { id: 'ord-001', table: 4, items: ['2x Tusker Lager', '1x Nyama Choma Platter'], total: 2500, status: 'PENDING', elapsed: 3, paymentMethod: 'mpesa' },
  { id: 'ord-002', table: 9, items: ['1x Nairobi Dawa Cocktail', '1x White Cap Crisp'], total: 1130, status: 'PENDING', elapsed: 1, paymentMethod: 'cash', customerNote: 'Extra lime please' },
  { id: 'ord-003', table: 15, items: ['1x Captain Morgan Bottle', '4x Mixers'], total: 4200, status: 'PENDING', elapsed: 5, paymentMethod: 'card' },
];

const statusColors: Record<Order['status'], string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CLAIMED: 'bg-blue-50 text-blue-700 border-blue-200',
  PREPARING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  READY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const paymentIcons: Record<Order['paymentMethod'], React.ReactNode> = {
  mpesa: <Smartphone className="h-3.5 w-3.5 text-emerald-600" />,
  card: <CreditCard className="h-3.5 w-3.5 text-blue-600" />,
  cash: <Banknote className="h-3.5 w-3.5 text-amber-600" />,
};

export const WaiterDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'available' | 'my-order' | 'history'>('available');
  const [availableOrders, setAvailableOrders] = useState<Order[]>(DEMO_AVAILABLE_ORDERS);
  const [myOrder, setMyOrder] = useState<Order | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [notifications, setNotifications] = useState(3);

  const claimOrder = (order: Order) => {
    if (myOrder) {
      alert('You already have an active order. Complete it before claiming another.');
      return;
    }
    setAvailableOrders((prev) => prev.filter((o) => o.id !== order.id));
    setMyOrder({ ...order, status: 'CLAIMED' });
    setActiveTab('my-order');
  };

  const advanceOrderStatus = () => {
    if (!myOrder) return;
    const flow: Order['status'][] = ['CLAIMED', 'PREPARING', 'READY'];
    const nextIndex = flow.indexOf(myOrder.status) + 1;
    if (nextIndex < flow.length) {
      setMyOrder({ ...myOrder, status: flow[nextIndex] });
    } else {
      setMyOrder(null);
      setActiveTab('history');
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
            <span className="font-bold text-white text-sm">DrinkHub</span>
            <span className="mx-2 text-blue-300 text-xs">|</span>
            <span className="text-blue-200 text-xs">Waiter Dashboard</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setNotifications(0)}
            className="relative h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <Bell className="h-4 w-4" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                {notifications}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-1.5 cursor-pointer hover:bg-white/20 transition-colors">
            <div className="h-6 w-6 rounded-full bg-white/30 flex items-center justify-center">
              <User className="h-3 w-3 text-white" />
            </div>
            <span className="text-xs font-medium text-white">Aisha W.</span>
            <ChevronDown className="h-3 w-3 text-blue-200" />
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
            { label: 'Orders Completed Today', value: '8', icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" /> },
            { label: 'Active Order', value: myOrder ? `Table #${myOrder.table}` : 'None', icon: <Circle className="h-5 w-5 text-blue-500" /> },
            { label: 'Avg Delivery Time', value: '7 min', icon: <Clock className="h-5 w-5 text-amber-500" /> },
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
                {'count' in tab && tab.count! > 0 && (
                  <span className="rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* AVAILABLE ORDERS TAB */}
            {activeTab === 'available' && (
              <div className="space-y-3">
                {availableOrders.length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-300" />
                    <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>All orders have been claimed</p>
                  </div>
                ) : (
                  availableOrders.map((order) => (
                    <div key={order.id} className="rounded-xl border p-4 flex items-start justify-between gap-4"
                      style={{ background: 'var(--bg-body)', borderColor: 'var(--border)' }}>
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                            Table #{order.table}
                          </span>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusColors[order.status]}`}>
                            {order.status}
                          </span>
                          <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {paymentIcons[order.paymentMethod]}
                            {order.paymentMethod.toUpperCase()}
                          </span>
                          <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            <Clock className="h-3 w-3" />
                            {order.elapsed} min ago
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {order.items.join(', ')}
                        </p>
                        {order.customerNote && (
                          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                            <span className="text-xs text-amber-800">"{order.customerNote}"</span>
                          </div>
                        )}
                        <span className="font-black text-sm text-emerald-600">
                          KES {order.total.toLocaleString()}
                        </span>
                      </div>
                      <button
                        onClick={() => claimOrder(order)}
                        disabled={!!myOrder}
                        className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                        style={{ background: '#2563EB' }}
                      >
                        Claim <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* MY ORDER TAB */}
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
                            Table #{myOrder.table}
                          </h3>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Order #{myOrder.id}
                          </p>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusColors[myOrder.status]}`}>
                          {myOrder.status}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {myOrder.items.map((item, i) => (
                          <div key={i} className="text-sm flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                        {paymentIcons[myOrder.paymentMethod]}
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Payment via {myOrder.paymentMethod.toUpperCase()}
                        </span>
                        <span className="ml-auto font-black text-emerald-600">
                          KES {myOrder.total.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-2">
                      {(['CLAIMED', 'PREPARING', 'READY', 'DELIVERED'] as const).map((s, i, arr) => (
                        <React.Fragment key={s}>
                          <div className="flex flex-col items-center gap-1">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                              ['CLAIMED','PREPARING','READY'].indexOf(myOrder.status) >= i
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
                      className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                      style={{ background: '#2563EB' }}
                    >
                      {myOrder.status === 'CLAIMED' && 'Mark as Preparing →'}
                      {myOrder.status === 'PREPARING' && 'Mark as Ready for Pickup →'}
                      {myOrder.status === 'READY' && 'Mark as Delivered ✓'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* HISTORY TAB */}
            {activeTab === 'history' && (
              <div className="text-center py-16 space-y-2">
                <History className="h-12 w-12 mx-auto" style={{ color: 'var(--text-muted)' }} />
                <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>8 orders completed today</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Detailed history available in the Manager portal</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
