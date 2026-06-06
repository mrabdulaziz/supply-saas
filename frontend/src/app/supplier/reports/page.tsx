'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../../lib/api';
import { useAuthStore } from '../../../stores/auth.store';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { format, subDays } from 'date-fns';
import { TrendingUp, Package, ShoppingCart, CheckCircle } from 'lucide-react';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#84cc16'];

export default function SupplierReportsPage() {
  const { user } = useAuthStore();
  const [days, setDays] = useState(30);

  const from = format(subDays(new Date(), days), 'yyyy-MM-dd');
  const to = format(new Date(), 'yyyy-MM-dd');

  const { data: ordersData } = useQuery({
    queryKey: ['supplier-reports-orders', days],
    queryFn: () => reportsApi.orders({ from, to, supplierId: user?.supplierId }).then(r => r.data.data),
    enabled: !!user?.supplierId,
  });

  const { data: productsData } = useQuery({
    queryKey: ['supplier-reports-products'],
    queryFn: () => reportsApi.products({ supplierId: user?.supplierId }).then(r => r.data.data),
    enabled: !!user?.supplierId,
  });

  const orders = ordersData?.orders || [];
  const summary = ordersData?.summary;

  // Daily series
  const dailyMap: Record<string, { date: string; revenue: number; count: number }> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = format(subDays(new Date(), i), 'dd MMM');
    dailyMap[d] = { date: d, revenue: 0, count: 0 };
  }
  orders.forEach((o: any) => {
    const d = format(new Date(o.createdAt), 'dd MMM');
    if (dailyMap[d]) {
      dailyMap[d].revenue += Number(o.totalAmount);
      dailyMap[d].count += 1;
    }
  });
  const dailySeries = Object.values(dailyMap);

  const totalRevenue = Number(summary?.totalAmount || 0);
  const deliveredCount = summary?.byStatus?.DELIVERED || 0;
  const pendingCount = summary?.byStatus?.SUBMITTED || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
          <p className="text-gray-400 text-sm">Your performance overview</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${days === d ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp,   label: 'Revenue',          value: totalRevenue >= 1_000_000 ? `${(totalRevenue/1_000_000).toFixed(1)}M UZS` : `${(totalRevenue/1000).toFixed(0)}K UZS`, color: 'text-green-600 bg-green-50' },
          { icon: ShoppingCart, label: 'Total Orders',     value: summary?.total ?? '–',     color: 'text-blue-600 bg-blue-50'   },
          { icon: CheckCircle,  label: 'Delivered',        value: deliveredCount,             color: 'text-emerald-600 bg-emerald-50' },
          { icon: Package,      label: 'Awaiting Action',  value: pendingCount,               color: 'text-orange-600 bg-orange-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border p-5 flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl border p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Revenue & Orders Over Time</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={dailySeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
              interval={days > 14 ? Math.floor(days / 7) : 1} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
              tickFormatter={v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip formatter={(v: any, name: any) => name === 'revenue' ? [`${Number(v).toLocaleString()} UZS`, 'Revenue'] : [v, 'Orders']} />
            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} name="revenue" />
            <Line yAxisId="right" type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="4 2" name="count" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top products */}
      {productsData && productsData.length > 0 && (
        <div className="bg-white rounded-2xl border p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Top Products by Volume</h2>
          <div className="space-y-3">
            {productsData.slice(0, 8).map((p: any, i: number) => {
              const maxQty = Number(productsData[0]._sum?.quantity || 1);
              const qty = Number(p._sum?.quantity || 0);
              const pct = Math.round((qty / maxQty) * 100);
              return (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-4 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium text-gray-700 truncate">{p.productId}</span>
                      <span className="text-xs text-gray-400 ml-2 shrink-0">{qty.toLocaleString()} units</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-500 w-20 text-right shrink-0">
                    {Number(p._sum?.subtotal || 0).toLocaleString()} UZS
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
