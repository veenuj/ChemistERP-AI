import { useEffect, useState, type ComponentType } from 'react';
import { DollarSign, AlertTriangle, TrendingUp, PackageCheck, Clock, ShieldAlert, type LucideProps } from 'lucide-react';
import api from '../services/api';

// 1. Updated Interfaces to match the new Backend Response
interface TopSeller {
  name: string;
  total_sold: number;
}

interface ExpiryAlert {
  name: string;
  expiry_date: string;
  stock_level: number;
}

interface CriticalStock {
  name: string;
  stock_level: number;
}

interface DashboardStats {
  revenue: number;
  lowStock: number;
  topSellers: TopSeller[];
  expiryAlerts: ExpiryAlert[];     // NEW
  criticalStock: CriticalStock[];   // NEW
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ComponentType<LucideProps>;
  color: string;
  bg: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.get<DashboardStats>('/dashboard/stats')
      .then(res => setStats(res.data))
      .catch(error => console.error("Stats fetch error:", error));
  }, []);

  if (!stats) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-slate-400 font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest">Gathering Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Today's Revenue" value={`$${stats.revenue.toFixed(2)}`} icon={DollarSign} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard title="Low Stock Alerts" value={stats.lowStock} icon={AlertTriangle} color="text-rose-600" bg="bg-rose-50" />
        <StatCard title="Active Orders" value="12" icon={TrendingUp} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard title="Total Inventory" value="450" icon={PackageCheck} color="text-slate-600" bg="bg-slate-50" />
      </div>

      {/* NEW: ACTION CENTER (The "Glowing" Alerts) */}
      {(stats.expiryAlerts.length > 0 || stats.criticalStock.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expiry Warnings */}
          {stats.expiryAlerts.length > 0 && (
            <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100 shadow-sm animate-pulse-subtle">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-rose-600 p-2 rounded-xl shadow-lg shadow-rose-200">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-black text-rose-900 uppercase tracking-tighter text-sm">Expiry Warning (30 Days)</h3>
              </div>
              <div className="space-y-2">
                {stats.expiryAlerts.map((med, i) => (
                  <div key={i} className="flex justify-between items-center bg-white/80 p-3 rounded-xl border border-rose-200">
                    <span className="font-bold text-rose-950 text-sm">{med.name}</span>
                    <span className="text-[10px] font-black text-rose-600 bg-rose-100 px-3 py-1 rounded-lg border border-rose-200 uppercase">
                      EXP: {new Date(med.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Critical Stock Refill */}
          {stats.criticalStock.length > 0 && (
            <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-amber-500 p-2 rounded-xl shadow-lg shadow-amber-200">
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-black text-amber-900 uppercase tracking-tighter text-sm">Refill Required Immediately</h3>
              </div>
              <div className="space-y-2">
                {stats.criticalStock.map((med, i) => (
                  <div key={i} className="flex justify-between items-center bg-white/80 p-3 rounded-xl border border-amber-200">
                    <span className="font-bold text-amber-950 text-sm">{med.name}</span>
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                      Only {med.stock_level} Unit(s) Left
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Sellers Table */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6 tracking-tight uppercase text-[11px] opacity-50">Top Moving Medicines</h3>
        <div className="space-y-3">
          {stats.topSellers.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/50 transition-all rounded-2xl border border-transparent hover:border-slate-200 group">
              <span className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{item.name}</span>
              <span className="bg-white px-4 py-1.5 rounded-xl text-xs font-black text-slate-500 border border-slate-200 shadow-sm uppercase tracking-tighter">
                {item.total_sold} Units Sold
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
      <div className={`${bg} ${color} p-4 rounded-2xl shadow-sm`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
}