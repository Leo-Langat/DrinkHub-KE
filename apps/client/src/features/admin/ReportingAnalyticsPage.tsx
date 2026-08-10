import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  ShoppingBag,
  Smartphone,
  CreditCard,
  Banknote,
  Users,
  Award,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  FileSpreadsheet,
  FileType,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const ReportingAnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [activeTab, setActiveTab] = useState<'SALES' | 'PAYMENTS' | 'PRODUCTS' | 'WAITERS' | 'CUSTOMERS'>('SALES');

  const handleExport = (format: 'PDF' | 'EXCEL' | 'CSV') => {
    alert(`Exporting ${period} analytics report as ${format} file...`);
  };

  return (
    <div className="min-h-screen bg-dark-950 p-6 space-y-8 text-slate-100">
      {/* Header & Export Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Reporting & Business Intelligence</h1>
          <p className="text-xs text-slate-400">Multi-Dimensional Venue Reports & Export Center</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Period Selector */}
          <div className="flex space-x-1 rounded-xl bg-dark-900 p-1 border border-slate-800">
            {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  period === p ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Export Buttons */}
          <Button variant="outline" size="sm" onClick={() => handleExport('PDF')}>
            <FileType className="mr-1.5 h-4 w-4 text-red-400" /> Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('EXCEL')}>
            <FileSpreadsheet className="mr-1.5 h-4 w-4 text-emerald-400" /> Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('CSV')}>
            <Download className="mr-1.5 h-4 w-4 text-brand-400" /> Export CSV
          </Button>
        </div>
      </div>

      {/* 1. TOP SUMMARY KPI CARDS */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-panel p-5 space-y-2 border-l-4 border-l-brand-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Net Sales</span>
            <DollarSign className="h-4 w-4 text-brand-400" />
          </div>
          <p className="text-2xl font-black text-white">KES 1,845,000</p>
          <p className="text-[11px] text-emerald-400 font-bold flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" /> +14.2% vs previous {period.toLowerCase()}
          </p>
        </div>

        <div className="glass-panel p-5 space-y-2 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Orders</span>
            <ShoppingBag className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">1,240</p>
          <p className="text-[11px] text-slate-400">Average KES 1,487 / order</p>
        </div>

        <div className="glass-panel p-5 space-y-2 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Top Payment Mode</span>
            <Smartphone className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">M-Pesa STK (68%)</p>
          <p className="text-[11px] text-amber-300">Card 20% • Cash 12%</p>
        </div>

        <div className="glass-panel p-5 space-y-2 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Customer Sessions</span>
            <Users className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white">1,840 Visits</p>
          <p className="text-[11px] text-emerald-400 font-bold">28% Repeat table guests</p>
        </div>
      </div>

      {/* 2. REPORT DIMENSION TABS */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'SALES', label: 'Sales & Revenue' },
          { id: 'PAYMENTS', label: 'Payment Methods (M-Pesa/Card/Cash)' },
          { id: 'PRODUCTS', label: 'Product Performance' },
          { id: 'WAITERS', label: 'Waiter Leaderboard' },
          { id: 'CUSTOMERS', label: 'Customer Insights' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'bg-dark-900 text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: SALES & REVENUE */}
      {activeTab === 'SALES' && (
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-base font-extrabold text-white border-b border-slate-800 pb-3">
            Sales & Revenue Trend ({period})
          </h3>
          <div className="h-64 flex items-end justify-between space-x-3 pt-6 px-2">
            {[
              { label: 'Week 1', sales: 420 },
              { label: 'Week 2', sales: 480 },
              { label: 'Week 3', sales: 510 },
              { label: 'Week 4', sales: 620 },
            ].map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center space-y-2">
                <span className="text-xs font-bold text-brand-400">KES {d.sales}k</span>
                <div className="w-full bg-dark-900 rounded-t-xl h-44 flex items-end">
                  <div
                    style={{ height: `${(d.sales / 700) * 100}%` }}
                    className="w-full bg-gradient-to-t from-brand-600 to-amber-400 rounded-t-xl"
                  />
                </div>
                <span className="text-xs text-slate-400">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT METHODS BREAKDOWN */}
      {activeTab === 'PAYMENTS' && (
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="glass-panel p-5 space-y-2 border-t-4 border-t-emerald-500">
            <Smartphone className="h-6 w-6 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">M-Pesa STK Express</h4>
            <p className="text-2xl font-black text-emerald-400">KES 1,254,600</p>
            <p className="text-xs text-slate-400">843 transactions (68% share)</p>
          </div>

          <div className="glass-panel p-5 space-y-2 border-t-4 border-t-brand-500">
            <CreditCard className="h-6 w-6 text-brand-400" />
            <h4 className="text-sm font-bold text-white">Credit / Debit Card POS</h4>
            <p className="text-2xl font-black text-brand-400">KES 369,000</p>
            <p className="text-xs text-slate-400">248 transactions (20% share)</p>
          </div>

          <div className="glass-panel p-5 space-y-2 border-t-4 border-t-amber-500">
            <Banknote className="h-6 w-6 text-amber-400" />
            <h4 className="text-sm font-bold text-white">Cash Payments</h4>
            <p className="text-2xl font-black text-amber-400">KES 221,400</p>
            <p className="text-xs text-slate-400">149 transactions (12% share)</p>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCT PERFORMANCE */}
      {activeTab === 'PRODUCTS' && (
        <div className="glass-panel p-6 overflow-x-auto">
          <h3 className="text-base font-extrabold text-white mb-4">Product Performance Leaderboard</h3>
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 uppercase text-slate-400 font-bold">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Units Sold</th>
                <th className="py-3 px-4">Gross Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {[
                { name: 'Tusker Lager (500ml)', cat: 'Beers', sold: 1420, rev: 'KES 497,000' },
                { name: 'Nairobi Dawa Cocktail', cat: 'Cocktails', sold: 980, rev: 'KES 735,000' },
                { name: 'White Cap Crisp (500ml)', cat: 'Beers', sold: 860, rev: 'KES 326,800' },
                { name: 'Captain Morgan Spiced (750ml)', cat: 'Spirits', sold: 140, rev: 'KES 532,000' },
                { name: 'Nyama Choma Platter (1kg)', cat: 'Food', sold: 220, rev: 'KES 396,000' },
              ].map((p, idx) => (
                <tr key={idx} className="hover:bg-dark-900/50">
                  <td className="py-3 px-4 font-bold text-white">{p.name}</td>
                  <td className="py-3 px-4 text-brand-400 font-semibold">{p.cat}</td>
                  <td className="py-3 px-4 font-extrabold text-white">{p.sold.toLocaleString()}</td>
                  <td className="py-3 px-4 font-black text-amber-400">{p.rev}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: WAITER LEADERBOARD */}
      {activeTab === 'WAITERS' && (
        <div className="glass-panel p-6 overflow-x-auto">
          <h3 className="text-base font-extrabold text-white mb-4">Waiter Performance & Speed Metrics</h3>
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 uppercase text-slate-400 font-bold">
              <tr>
                <th className="py-3 px-4">Waiter Name</th>
                <th className="py-3 px-4">Orders Served</th>
                <th className="py-3 px-4">Total Revenue Generated</th>
                <th className="py-3 px-4">Avg Fulfillment Speed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {[
                { name: 'Kamau Njoroge', count: 480, rev: 'KES 642,000', speed: '3.8 mins' },
                { name: 'Wanjiku Mwangi', count: 420, rev: 'KES 589,000', speed: '4.1 mins' },
                { name: 'Ochieng Odhiambo', count: 360, rev: 'KES 441,000', speed: '4.5 mins' },
              ].map((w, idx) => (
                <tr key={idx} className="hover:bg-dark-900/50">
                  <td className="py-3 px-4 font-bold text-white">{w.name}</td>
                  <td className="py-3 px-4 font-extrabold text-white">{w.count}</td>
                  <td className="py-3 px-4 font-black text-brand-500">{w.rev}</td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">{w.speed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
