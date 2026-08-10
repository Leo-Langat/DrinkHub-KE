import React from 'react';
import {
  Building2,
  Users,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Award,
  PieChart as PieIcon,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  MapPin,
} from 'lucide-react';

export const PlatformAdminDashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950 p-6 space-y-8 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Platform Admin Analytics</h1>
          <p className="text-xs text-slate-400">DrinkHub Kenya SaaS Operations & Global Venue Metrics</p>
        </div>
        <div className="flex items-center space-x-2 rounded-full bg-brand-500/10 px-4 py-1.5 text-xs font-extrabold text-brand-400 border border-brand-500/30">
          <span className="h-2 w-2 rounded-full bg-brand-500 animate-ping" />
          <span>System Health: 99.98% Uptime</span>
        </div>
      </div>

      {/* 1. METRIC STAT CARDS GRID */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="glass-panel p-5 space-y-2 border-l-4 border-l-brand-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Clubs</span>
            <Building2 className="h-4 w-4 text-brand-400" />
          </div>
          <p className="text-2xl font-black text-white">28</p>
          <p className="text-[11px] text-emerald-400 font-bold flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" /> +4 this month
          </p>
        </div>

        <div className="glass-panel p-5 space-y-2 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Subscriptions</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">24 Active</p>
          <p className="text-[11px] text-slate-400">3 Trial • 1 Suspended</p>
        </div>

        <div className="glass-panel p-5 space-y-2 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Monthly MRR</span>
            <DollarSign className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">KES 1.24M</p>
          <p className="text-[11px] text-emerald-400 font-bold flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" /> +18.4% YoY
          </p>
        </div>

        <div className="glass-panel p-5 space-y-2 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Users</span>
            <Users className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white">1,450</p>
          <p className="text-[11px] text-slate-400">Managers, Waiters & Admins</p>
        </div>

        <div className="glass-panel p-5 space-y-2 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Orders</span>
            <ShoppingBag className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white">84,200</p>
          <p className="text-[11px] text-emerald-400 font-bold">+2.4k today</p>
        </div>
      </div>

      {/* 2. CHARTS SECTION (Recharts-style Visualizations) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* CHART 1: MONTHLY REVENUE GROWTH (Line / Area Chart) */}
        <div className="glass-panel p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-white">Monthly Revenue Growth (KES)</h3>
              <p className="text-xs text-slate-400">SaaS Subscriptions & M-Pesa Transaction Fees</p>
            </div>
            <BarChart3 className="h-5 w-5 text-brand-500" />
          </div>

          <div className="h-56 flex items-end justify-between space-x-3 pt-6 px-2">
            {[
              { month: 'Jan', revenue: 650 },
              { month: 'Feb', revenue: 780 },
              { month: 'Mar', revenue: 890 },
              { month: 'Apr', revenue: 940 },
              { month: 'May', revenue: 1050 },
              { month: 'Jun', revenue: 1180 },
              { month: 'Jul', revenue: 1240 },
            ].map((d, i) => {
              const heightPercent = (d.revenue / 1300) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center space-y-2 group">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-dark-900 text-brand-400 text-[10px] font-bold py-1 px-2 rounded border border-slate-800">
                    KES {d.revenue}k
                  </div>
                  <div className="w-full bg-dark-900 rounded-t-xl overflow-hidden h-40 flex items-end">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-gradient-to-t from-brand-600 to-amber-400 rounded-t-xl transition-all duration-500 group-hover:from-brand-500 group-hover:to-amber-300"
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 2: SUBSCRIPTION DISTRIBUTION (Donut / Pie Chart) */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-extrabold text-white">Subscription Status</h3>
            <PieIcon className="h-5 w-5 text-amber-400" />
          </div>

          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-tr from-brand-500 via-emerald-500 to-amber-500 p-4 shadow-xl">
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-dark-950 text-center">
                <span className="text-2xl font-black text-white">28</span>
                <span className="text-[10px] text-slate-400">Total Venues</span>
              </div>
            </div>

            <div className="w-full space-y-2 text-xs">
              <div className="flex justify-between items-center bg-dark-900 p-2 rounded-lg border border-slate-800">
                <span className="flex items-center font-bold text-emerald-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 mr-2" /> Active Enterprise
                </span>
                <span className="font-extrabold text-white">24 (85.7%)</span>
              </div>

              <div className="flex justify-between items-center bg-dark-900 p-2 rounded-lg border border-slate-800">
                <span className="flex items-center font-bold text-amber-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 mr-2" /> 14-Day Free Trial
                </span>
                <span className="font-extrabold text-white">3 (10.7%)</span>
              </div>

              <div className="flex justify-between items-center bg-dark-900 p-2 rounded-lg border border-slate-800">
                <span className="flex items-center font-bold text-red-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 mr-2" /> Suspended
                </span>
                <span className="font-extrabold text-white">1 (3.6%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CLUBS BY COUNTY REGIONAL BREAKDOWN */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-brand-500" />
            <h3 className="text-base font-extrabold text-white">Venues Distribution by Kenyan County</h3>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
          {[
            { county: 'Nairobi', count: 14, percent: 50 },
            { county: 'Mombasa', count: 6, percent: 21 },
            { county: 'Nakuru', count: 4, percent: 14 },
            { county: 'Kiambu', count: 3, percent: 11 },
            { county: 'Kisumu', count: 1, percent: 4 },
          ].map((c) => (
            <div key={c.county} className="rounded-xl bg-dark-900 p-4 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300">{c.county} County</span>
              <p className="text-xl font-black text-brand-400">{c.count} Venues</p>
              <div className="w-full bg-dark-950 h-2 rounded-full overflow-hidden">
                <div style={{ width: `${c.percent}%` }} className="bg-brand-500 h-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
