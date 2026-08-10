import React from 'react';
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
} from 'lucide-react';

export const ManagerAnalyticsDashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950 p-6 space-y-8 text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Venue Analytics & Operations</h1>
          <p className="text-xs text-slate-400">The Alchemist Westlands • Realtime Sales & Peak Hours Insights</p>
        </div>
        <div className="flex items-center space-x-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-extrabold text-emerald-400 border border-emerald-500/30">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Live Register Active</span>
        </div>
      </div>

      {/* 1. METRIC CARDS GRID */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Sales */}
        <div className="glass-panel p-5 space-y-2 border-l-4 border-l-brand-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Today's Sales</span>
            <DollarSign className="h-4 w-4 text-brand-400" />
          </div>
          <p className="text-2xl font-black text-white">KES 184,500</p>
          <p className="text-[11px] text-emerald-400 font-bold flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" /> +24% vs yesterday
          </p>
        </div>

        {/* Pending Orders */}
        <div className="glass-panel p-5 space-y-2 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Pending Orders</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">4 Active</p>
          <p className="text-[11px] text-amber-300">Avg prep time: 4.2 mins</p>
        </div>

        {/* Top Drink */}
        <div className="glass-panel p-5 space-y-2 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">#1 Best Seller</span>
            <Award className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-lg font-black text-white truncate">Tusker Lager (500ml)</p>
          <p className="text-[11px] text-indigo-400 font-bold">142 bottles sold today</p>
        </div>

        {/* Payment M-Pesa Share */}
        <div className="glass-panel p-5 space-y-2 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">M-Pesa Share</span>
            <Smartphone className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">68%</p>
          <p className="text-[11px] text-slate-400">Card 20% • Cash 12%</p>
        </div>
      </div>

      {/* 2. CHARTS SECTION */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* PEAK HOURS HOURLY VOLUME BAR CHART (4 PM - 2 AM) */}
        <div className="glass-panel p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Flame className="h-5 w-5 text-amber-400" />
              <h3 className="text-base font-extrabold text-white">Peak Hours Volume (Orders / Hour)</h3>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              Peak: 10 PM - 12 AM
            </span>
          </div>

          <div className="h-56 flex items-end justify-between space-x-2 pt-6 px-2">
            {[
              { hour: '4 PM', orders: 12 },
              { hour: '6 PM', orders: 28 },
              { hour: '8 PM', orders: 64 },
              { hour: '10 PM', orders: 110 },
              { hour: '11 PM', orders: 145 },
              { hour: '12 AM', orders: 120 },
              { hour: '1 AM', orders: 75 },
              { hour: '2 AM', orders: 30 },
            ].map((d, i) => {
              const heightPercent = (d.orders / 150) * 100;
              const isPeak = d.orders > 100;
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
                <span className="font-extrabold text-white">68% (KES 125,460)</span>
              </div>
              <div className="w-full bg-dark-900 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[68%]" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="flex items-center text-brand-400 font-bold">
                  <CreditCard className="h-3.5 w-3.5 mr-1" /> Credit/Debit Card POS
                </span>
                <span className="font-extrabold text-white">20% (KES 36,900)</span>
              </div>
              <div className="w-full bg-dark-900 h-2.5 rounded-full overflow-hidden">
                <div className="bg-brand-500 h-full w-[20%]" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="flex items-center text-amber-400 font-bold">
                  <Banknote className="h-3.5 w-3.5 mr-1" /> Cash Payments
                </span>
                <span className="font-extrabold text-white">12% (KES 22,140)</span>
              </div>
              <div className="w-full bg-dark-900 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full w-[12%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TOP DRINKS LEADERBOARD */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-base font-extrabold text-white border-b border-slate-800 pb-3">
          🔥 Top 5 Best-Selling Drinks Today
        </h3>

        <div className="grid gap-3 sm:grid-cols-5">
          {[
            { rank: 1, name: 'Tusker Lager (500ml)', sold: 142, revenue: 'KES 49,700' },
            { rank: 2, name: 'Nairobi Dawa Cocktail', sold: 98, revenue: 'KES 73,500' },
            { rank: 3, name: 'White Cap Crisp (500ml)', sold: 86, revenue: 'KES 32,680' },
            { rank: 4, name: 'Captain Morgan (750ml)', sold: 14, revenue: 'KES 53,200' },
            { rank: 5, name: 'Nyama Choma Platter', sold: 22, revenue: 'KES 39,600' },
          ].map((d) => (
            <div key={d.rank} className="rounded-xl bg-dark-900 p-4 border border-slate-800 space-y-1 text-xs">
              <span className="font-bold text-amber-400">#{d.rank} Rank</span>
              <p className="font-bold text-white leading-tight truncate">{d.name}</p>
              <p className="text-slate-400">{d.sold} units sold</p>
              <p className="font-black text-brand-400 pt-1">{d.revenue}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
