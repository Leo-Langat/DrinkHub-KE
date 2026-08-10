import React, { useState } from 'react';
import { Flame, Clock, CheckCircle, Bell } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface KitchenOrder {
  id: string;
  orderNumber: string;
  tableNumber: number;
  section: string;
  status: 'PENDING' | 'PREPARING' | 'READY';
  timeAgo: string;
  items: { name: string; quantity: number; notes?: string }[];
}

const INITIAL_KITCHEN_ORDERS: KitchenOrder[] = [
  {
    id: 'ord-1',
    orderNumber: 'ORD-1001',
    tableNumber: 2,
    section: 'Main Courtyard',
    status: 'PENDING',
    timeAgo: '2 mins ago',
    items: [
      { name: 'Tusker Lager (500ml)', quantity: 2 },
      { name: 'Nyama Choma Platter (1kg)', quantity: 1, notes: 'Extra kachumbari' },
    ],
  },
  {
    id: 'ord-2',
    orderNumber: 'ORD-1002',
    tableNumber: 10,
    section: 'VIP Lounge',
    status: 'PREPARING',
    timeAgo: '7 mins ago',
    items: [
      { name: 'Nairobi Dawa Cocktail', quantity: 3 },
    ],
  },
];

export const KitchenDisplayPage: React.FC = () => {
  const [orders, setOrders] = useState<KitchenOrder[]>(INITIAL_KITCHEN_ORDERS);

  const updateOrderStatus = (id: string, newStatus: 'PREPARING' | 'READY') => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
  };

  return (
    <div className="min-h-screen bg-dark-950 p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/40">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Kitchen Display System (KDS)</h1>
            <p className="text-xs text-slate-400">Live order stream • Realtime notifications</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/30">
            <Bell className="h-3.5 w-3.5" />
            <span>Audio Alerts Active</span>
          </span>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="glass-panel p-5 space-y-4 border-l-4 border-l-amber-500 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <span className="text-lg font-black text-white">{order.orderNumber}</span>
                  <p className="text-xs text-slate-400">
                    Table #{order.tableNumber} • {order.section}
                  </p>
                </div>
                <div className="flex items-center space-x-1 text-xs text-slate-400 bg-dark-800 px-2.5 py-1 rounded-lg">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span>{order.timeAgo}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-sm">
                    <span className="font-semibold text-slate-200">
                      <span className="text-brand-500 font-extrabold mr-2">{item.quantity}x</span>
                      {item.name}
                    </span>
                    {item.notes && (
                      <p className="text-xs text-amber-400 italic">Note: {item.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80">
              {order.status === 'PENDING' && (
                <Button
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white"
                  onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                >
                  Start Preparing
                </Button>
              )}
              {order.status === 'PREPARING' && (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                  onClick={() => updateOrderStatus(order.id, 'READY')}
                >
                  Mark Order Ready
                </Button>
              )}
              {order.status === 'READY' && (
                <div className="flex items-center justify-center space-x-2 text-emerald-400 font-bold text-sm py-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Ready for Waiter Pickup</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
