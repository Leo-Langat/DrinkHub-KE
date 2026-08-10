import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

export const OfflineScreen: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      window.location.reload();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
      if (navigator.onLine) {
        setIsOnline(true);
        window.location.reload();
      } else {
        alert('Network check failed. Please reconnect to Wi-Fi or Cellular Data.');
      }
    }, 1200);
  };

  if (!isOnline) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark-950 p-6 text-center text-slate-100 font-sans">
        <div className="glass-panel max-w-md p-8 space-y-6 border border-red-500/30 shadow-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10 text-red-400 border border-red-500/30 shadow-inner">
            <WifiOff className="h-10 w-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">No Internet Connection</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              DrinkHub Kenya requires an active internet connection for real-time QR table ordering, kitchen dispatch, and M-Pesa payments.
            </p>
          </div>

          <div className="rounded-xl bg-dark-900 p-3.5 border border-slate-800 text-xs text-amber-400 font-semibold space-y-1">
            <div className="flex items-center justify-center space-x-1.5">
              <AlertTriangle className="h-4 w-4" />
              <span>Ordering & Checkout Disabled</span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal">
              Reconnect to Wi-Fi or Mobile Data to resume live venue session.
            </p>
          </div>

          <Button size="lg" className="w-full bg-brand-600 hover:bg-brand-500" onClick={handleManualRetry} disabled={isRetrying}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Checking Network Connection...' : 'Retry Connection'}</span>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
