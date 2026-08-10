import React, { useState, useEffect } from 'react';
import { Wine, Wifi, WifiOff, Bell, Check, CheckCheck, Sparkles, X, Smartphone, CreditCard, Banknote } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useTenant } from '../../context/TenantContext';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'NEW_ORDER' | 'PAYMENT_SUCCESS' | 'ORDER_CLAIMED' | 'ORDER_READY' | 'ORDER_DELIVERED' | 'OFFER_PUBLISHED';
  isRead: boolean;
  timeAgo: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    title: '🔔 New Order Placed',
    message: 'Order #ORD-1001 placed for Table #2.',
    type: 'NEW_ORDER',
    isRead: false,
    timeAgo: '2 mins ago',
  },
  {
    id: 'n-2',
    title: '💰 M-Pesa Payment Confirmed',
    message: 'Payment of KSh 1,450 received (Receipt: RGA7882910).',
    type: 'PAYMENT_SUCCESS',
    isRead: false,
    timeAgo: '5 mins ago',
  },
  {
    id: 'n-3',
    title: '🔥 New Happy Hour Offer Live!',
    message: 'Happy Hour Beer Bucket 15% OFF is now active.',
    type: 'OFFER_PUBLISHED',
    isRead: true,
    timeAgo: '1 hour ago',
  },
];

export const Navbar: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const { tenant } = useTenant();

  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (!socket) return;

    socket.on('venue_notification', (data: any) => {
      const newNotif: NotificationItem = {
        id: `n-${Date.now()}`,
        title: data.notification?.title || 'Notification',
        message: data.notification?.message || 'New update',
        type: data.notification?.type || 'NEW_ORDER',
        isRead: false,
        timeAgo: 'Just now',
      };
      setNotifications((prev) => [newNotif, ...prev]);
    });

    return () => {
      socket.off('venue_notification');
    };
  }, [socket]);

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-dark-950/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => (window.location.href = '/')}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 shadow-md shadow-brand-500/20">
            <Wine className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center">
              <span className="text-lg font-bold tracking-tight text-white">DrinkHub</span>
              <span className="ml-1 text-xs font-semibold text-brand-500">KE</span>
            </div>
            {tenant && <p className="text-xs text-slate-400">{tenant.name}</p>}
          </div>
        </div>

        {/* Realtime Status & Notification Center Bell */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 rounded-full border border-slate-800 bg-dark-900 px-3 py-1 text-xs text-slate-300">
            {isConnected ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Live Realtime</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-amber-400">Connecting...</span>
              </>
            )}
          </div>

          {/* NOTIFICATION CENTER BELL POPOVER TRIGGER */}
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-dark-900 border border-slate-800 text-slate-300 hover:bg-dark-800 hover:text-white transition-all"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-black text-white shadow-lg animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* NOTIFICATION CENTER POPOVER PANELS */}
            {isOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-dark-900 border border-slate-800 shadow-2xl z-50 p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-brand-500" />
                    <h3 className="text-sm font-bold text-white">Notification Center</h3>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] font-bold text-brand-400">
                        {unreadCount} Unread
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] font-semibold text-brand-400 hover:underline flex items-center"
                      >
                        <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark All Read
                      </button>
                    )}
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto space-y-2.5">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">No notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                          n.isRead
                            ? 'bg-dark-950/40 border-slate-800/60 opacity-75'
                            : 'bg-dark-950 border-brand-500/40 shadow-inner'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold text-white">{n.title}</h4>
                          <span className="text-[10px] text-slate-400">{n.timeAgo}</span>
                        </div>
                        <p className="text-xs text-slate-300">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
