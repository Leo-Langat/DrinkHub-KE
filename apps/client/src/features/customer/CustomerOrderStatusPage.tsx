import React from 'react';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Bike,
  UserCheck,
  Smartphone,
  CreditCard,
  Banknote,
  Wine,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const CustomerOrderStatusPage: React.FC = () => {
  // Demo active order status: PREPARING (step 3 out of 5)
  const currentStatus = 'PREPARING';
  const tableNumber = 2;
  const venueName = 'The Alchemist Westlands';
  const orderNumber = 'ORD-1001';
  const waiterName = 'Kamau Njoroge';

  const steps = [
    { key: 'PENDING', label: 'Order Sent', icon: Clock },
    { key: 'CLAIMED', label: 'Waiter Assigned', icon: UserCheck },
    { key: 'PREPARING', label: 'In Bar / Kitchen', icon: ChefHat },
    { key: 'READY', label: 'Ready for Pickup', icon: Sparkles },
    { key: 'DELIVERED', label: 'Delivered to Table', icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStatus);
  const progressPercent = Math.min(100, Math.max(20, ((currentStepIndex + 1) / steps.length) * 100));

  return (
    <div className="min-h-screen bg-dark-950 p-6 flex flex-col items-center justify-center font-sans text-slate-100">
      <div className="glass-panel w-full max-w-xl p-8 space-y-8 border border-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold uppercase text-brand-400">Live Order Tracker</span>
            <h1 className="text-xl font-black text-white">{venueName}</h1>
            <p className="text-xs text-slate-400">Table #{tableNumber} • Order {orderNumber}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 text-2xl shadow-lg">
            🍸
          </div>
        </div>

        {/* 1. PROGRESS BAR & STEPPER */}
        <div className="space-y-6">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Order Progress:</span>
            <span className="font-extrabold text-amber-400">{progressPercent}% Completed</span>
          </div>

          <div className="w-full bg-dark-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              style={{ width: `${progressPercent}%` }}
              className="bg-gradient-to-r from-brand-600 via-amber-400 to-emerald-400 h-full rounded-full transition-all duration-700"
            />
          </div>

          {/* Stepper Icons Grid */}
          <div className="grid grid-cols-5 gap-1 text-center">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isPassed = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={step.key} className="flex flex-col items-center space-y-1.5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${
                      isCurrent
                        ? 'bg-brand-500 text-white ring-4 ring-brand-500/30 scale-110 shadow-lg'
                        : isPassed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-dark-900 text-slate-600 border border-slate-800'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-[10px] font-bold leading-tight ${
                      isCurrent ? 'text-brand-400' : isPassed ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. ASSIGNED WAITER & ESTIMATED TIME CARD */}
        <div className="rounded-2xl bg-gradient-to-r from-dark-900 via-brand-950/20 to-dark-900 p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 font-bold">
                👨‍🍳
              </div>
              <div>
                <p className="text-xs text-slate-400">Assigned Waiter</p>
                <h4 className="text-sm font-bold text-white">{waiterName}</h4>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Est. Prep Time</p>
              <p className="text-sm font-black text-amber-400">~4 Mins Remaining</p>
            </div>
          </div>
        </div>

        {/* 3. ORDER ITEMS SUMMARY RECEIPT */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Order Receipt Summary</h4>
          <div className="rounded-xl bg-dark-900 p-4 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-white font-medium">
              <span>2x Tusker Lager (500ml)</span>
              <span>KSh 700</span>
            </div>
            <div className="flex justify-between text-white font-medium">
              <span>1x Nairobi Dawa Cocktail</span>
              <span>KSh 750</span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
              <span className="text-slate-400">Total Paid (Cash):</span>
              <span className="font-extrabold text-brand-500 text-base">KSh 1,450</span>
            </div>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={() => (window.location.href = '/v/alchemist-westlands')}>
          Return to Menu
        </Button>
      </div>
    </div>
  );
};
