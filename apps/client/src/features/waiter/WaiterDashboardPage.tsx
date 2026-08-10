import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Smartphone,
  CreditCard,
  Banknote,
  Flame,
  CheckCheck,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useSocket } from '../../context/SocketContext';

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

interface PaymentInfo {
  method: 'MPESA_STK' | 'CARD' | 'CASH';
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
  exactCash?: boolean;
  customerCashAmount?: number;
  changeDue?: number;
  notes?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  tableNumber: number;
  section: string;
  status: 'PENDING' | 'CLAIMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  waiterId?: string;
  waiterName?: string;
  elapsedMinutes: number;
  totalAmount: number;
  notes?: string;
  items: OrderItem[];
  payment: PaymentInfo;
}

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'ORD-1001',
    tableNumber: 2,
    section: 'Main Courtyard',
    status: 'PENDING',
    elapsedMinutes: 3,
    totalAmount: 1450,
    notes: 'Extra kachumbari with the Nyama Choma',
    items: [
      { name: 'Tusker Lager (500ml)', quantity: 2, unitPrice: 350 },
      { name: 'Nairobi Dawa Cocktail', quantity: 1, unitPrice: 750 },
    ],
    payment: {
      method: 'CASH',
      status: 'PENDING',
      exactCash: false,
      customerCashAmount: 2000,
      changeDue: 550,
      notes: 'Customer paying KSh 2,000. Bring KSh 550 change.',
    },
  },
  {
    id: 'ord-102',
    orderNumber: 'ORD-1002',
    tableNumber: 10,
    section: 'VIP Lounge',
    status: 'PENDING',
    elapsedMinutes: 1,
    totalAmount: 3800,
    items: [{ name: 'Captain Morgan Spiced (750ml)', quantity: 1, unitPrice: 3800 }],
    payment: {
      method: 'CARD',
      status: 'PENDING',
      notes: 'Bring POS Machine to Table #10',
    },
  },
  {
    id: 'ord-103',
    orderNumber: 'ORD-1003',
    tableNumber: 5,
    section: 'Terrace',
    status: 'CLAIMED',
    waiterId: 'waiter-me',
    waiterName: 'Kamau Njoroge (Me)',
    elapsedMinutes: 8,
    totalAmount: 760,
    items: [{ name: 'White Cap Crisp (500ml)', quantity: 2, unitPrice: 380 }],
    payment: {
      method: 'MPESA_STK',
      status: 'PAID',
      notes: 'Receipt: RGA7882910',
    },
  },
];

export const WaiterDashboardPage: React.FC = () => {
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState<'AVAILABLE' | 'MY_ORDERS' | 'HISTORY'>('AVAILABLE');
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [toastAlert, setToastAlert] = useState<string | null>(null);

  const currentWaiterId = 'waiter-me';
  const currentWaiterName = 'Kamau Njoroge';

  // Check if waiter already has an active claimed order
  const myActiveOrder = orders.find(
    (o) => o.waiterId === currentWaiterId && ['CLAIMED', 'PREPARING', 'READY'].includes(o.status),
  );

  const triggerToast = (msg: string) => {
    setToastAlert(msg);
    setTimeout(() => setToastAlert(null), 4000);
  };

  // Realtime Socket Listener for Order Events
  useEffect(() => {
    if (!socket) return;

    socket.on('new_order', (newOrder: any) => {
      triggerToast(`🔔 New Order #${newOrder.orderNumber} placed for Table #${newOrder.table?.tableNumber || 'N/A'}`);
    });

    socket.on('order_claimed', (data: { orderUuid: string; waiterUuid: string; waiterName: string }) => {
      // Order disappears for other waiters in real-time!
      setOrders((prev) =>
        prev.map((o) =>
          o.id === data.orderUuid
            ? { ...o, status: 'CLAIMED', waiterId: data.waiterUuid, waiterName: data.waiterName }
            : o,
        ),
      );
      if (data.waiterUuid !== currentWaiterId) {
        triggerToast(`Order claimed by ${data.waiterName}`);
      }
    });

    socket.on('waiter_notification', (data: { message: string }) => {
      triggerToast(`📢 Alert: ${data.message}`);
    });

    return () => {
      socket.off('new_order');
      socket.off('order_claimed');
      socket.off('waiter_notification');
    };
  }, [socket]);

  // Actions
  const claimOrder = (id: string) => {
    if (myActiveOrder) {
      alert(`⚠️ You can claim only ONE active order at a time! Complete or deliver Order #${myActiveOrder.orderNumber} first.`);
      return;
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, status: 'CLAIMED', waiterId: currentWaiterId, waiterName: `${currentWaiterName} (Me)` }
          : o,
      ),
    );
    triggerToast(`Order claimed successfully! It is now locked to your dashboard.`);
  };

  const updateOrderStatus = (id: string, newStatus: Order['status']) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
    triggerToast(`Order status updated to ${newStatus}`);
  };

  const availableOrders = orders.filter((o) => o.status === 'PENDING');
  const myOrders = orders.filter((o) => o.waiterId === currentWaiterId && o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
  const historyOrders = orders.filter((o) => o.status === 'DELIVERED' || o.status === 'COMPLETED' || o.status === 'CANCELLED');

  return (
    <div className="min-h-screen bg-dark-950 p-6 space-y-6">
      {/* Toast Alert Banner */}
      {toastAlert && (
        <div className="fixed top-20 right-4 z-50 rounded-2xl bg-amber-600 px-4 py-3 text-xs font-bold text-white shadow-2xl border border-amber-400 flex items-center space-x-2 animate-bounce">
          <Bell className="h-4 w-4" />
          <span>{toastAlert}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 text-brand-500 border border-brand-500/40">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Waiter Realtime Dashboard</h1>
            <p className="text-xs text-slate-400">
              Active Waiter: <span className="text-brand-400 font-bold">{currentWaiterName}</span> • Realtime Socket Sync
            </p>
          </div>
        </div>

        {/* 1 Active Order Status Badge */}
        {myActiveOrder ? (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-xs font-bold text-amber-400 flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            <span>Active Claimed Order: #{myActiveOrder.orderNumber} (Table #{myActiveOrder.tableNumber})</span>
          </div>
        ) : (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-xs font-bold text-emerald-400 flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Ready to claim 1 order</span>
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('AVAILABLE')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'AVAILABLE'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'bg-dark-900 text-slate-400 hover:text-white'
          }`}
        >
          Available Orders ({availableOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('MY_ORDERS')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'MY_ORDERS'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'bg-dark-900 text-slate-400 hover:text-white'
          }`}
        >
          My Orders ({myOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'HISTORY'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'bg-dark-900 text-slate-400 hover:text-white'
          }`}
        >
          Order History ({historyOrders.length})
        </button>
      </div>

      {/* TAB 1: AVAILABLE UNCLAIMED ORDERS */}
      {activeTab === 'AVAILABLE' && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {availableOrders.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 glass-panel space-y-2">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
              <p className="text-sm font-semibold">No pending available orders right now</p>
            </div>
          ) : (
            availableOrders.map((order) => (
              <div key={order.id} className="glass-panel p-5 space-y-4 flex flex-col justify-between border-l-4 border-l-brand-500">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-base font-extrabold text-white">{order.orderNumber}</span>
                      <p className="text-xs text-slate-400">
                        Table #{order.tableNumber} • {order.section}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-slate-400 bg-dark-800 px-2.5 py-1 rounded-lg">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      <span>{order.elapsedMinutes} mins ago</span>
                    </div>
                  </div>

                  {/* Payment Information Badge */}
                  <div className="rounded-xl bg-dark-900 p-3 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Payment Method:</span>
                      <span className="font-bold text-white flex items-center space-x-1">
                        {order.payment.method === 'MPESA_STK' && <Smartphone className="h-3.5 w-3.5 text-emerald-400" />}
                        {order.payment.method === 'CARD' && <CreditCard className="h-3.5 w-3.5 text-brand-400" />}
                        {order.payment.method === 'CASH' && <Banknote className="h-3.5 w-3.5 text-amber-400" />}
                        <span>{order.payment.method}</span>
                      </span>
                    </div>

                    {order.payment.method === 'CASH' && (
                      <div className="pt-1 border-t border-slate-800 text-amber-300 font-medium">
                        {order.payment.exactCash ? (
                          <p>Exact cash tender</p>
                        ) : (
                          <p>
                            Pays <span className="font-bold text-white">KSh {order.payment.customerCashAmount}</span> • Bring <span className="font-extrabold text-brand-400">KSh {order.payment.changeDue}</span> change
                          </p>
                        )}
                      </div>
                    )}

                    {order.payment.notes && (
                      <p className="text-[11px] text-amber-400 font-semibold">{order.payment.notes}</p>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="space-y-1 text-xs">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-slate-300 font-medium">{item.quantity}x {item.name}</span>
                        <span className="text-slate-400">KSh {(item.quantity * item.unitPrice).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="rounded-lg bg-amber-500/10 p-2 text-[11px] text-amber-400 border border-amber-500/20 italic">
                      Note: "{order.notes}"
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <Button
                    size="md"
                    disabled={!!myActiveOrder}
                    className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => claimOrder(order.id)}
                  >
                    {myActiveOrder ? 'Claim Disabled (1 Active Order Allowed)' : 'Claim This Order'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: MY CLAIMED ACTIVE ORDERS */}
      {activeTab === 'MY_ORDERS' && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {myOrders.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 glass-panel space-y-2">
              <UserCheck className="mx-auto h-10 w-10 text-slate-500" />
              <p className="text-sm font-semibold">You have no active claimed orders</p>
            </div>
          ) : (
            myOrders.map((order) => (
              <div key={order.id} className="glass-panel p-5 space-y-4 border-l-4 border-l-emerald-500 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-base font-extrabold text-white">{order.orderNumber}</span>
                      <p className="text-xs text-slate-400">Table #{order.tableNumber} • {order.section}</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                      {order.status}
                    </span>
                  </div>

                  {/* Payment Details */}
                  <div className="rounded-xl bg-dark-900 p-3 border border-slate-800 space-y-1 text-xs">
                    <p className="text-slate-300">Method: <span className="font-bold text-white">{order.payment.method}</span></p>
                    {order.payment.changeDue ? (
                      <p className="text-amber-400 font-extrabold">Bring Change: KSh {order.payment.changeDue}</p>
                    ) : null}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <Button
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-500"
                    onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                  >
                    Mark Delivered to Table #{order.tableNumber}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                  >
                    Complete & Close Order
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: ORDER HISTORY DATA TABLE */}
      {activeTab === 'HISTORY' && (
        <div className="glass-panel p-6 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 uppercase text-slate-400 font-bold">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Table</th>
                <th className="py-3 px-4">Waiter</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {historyOrders.map((o) => (
                <tr key={o.id} className="hover:bg-dark-900/50">
                  <td className="py-3 px-4 font-bold text-white">{o.orderNumber}</td>
                  <td className="py-3 px-4">Table #{o.tableNumber}</td>
                  <td className="py-3 px-4">{o.waiterName || 'Unassigned'}</td>
                  <td className="py-3 px-4 font-black text-brand-500">KSh {o.totalAmount.toLocaleString()}</td>
                  <td className="py-3 px-4">{o.payment.method}</td>
                  <td className="py-3 px-4">
                    <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-300">
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
