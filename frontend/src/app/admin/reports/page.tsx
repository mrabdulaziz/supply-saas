'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../../lib/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { Box, Card, CardContent, Typography, ToggleButtonGroup, ToggleButton, Grid, Skeleton, alpha } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InventoryIcon from '@mui/icons-material/Inventory';
import StoreIcon from '@mui/icons-material/Store';
import BarChartIcon from '@mui/icons-material/BarChart';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8', SUBMITTED: '#3b82f6', CONFIRMED: '#f59e0b',
  IN_TRANSIT: '#8b5cf6', DELIVERED: '#10b981', CLOSED: '#6b7280',
  REJECTED: '#ef4444', CANCELLED: '#f97316',
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

function StatCard({ icon: Icon, label, value, gradient, shadow }: any) {
  return (
    <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: 2.5, background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${shadow}` }}>
            <Icon sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={700} lineHeight={1}>{value ?? '—'}</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.25}>{label}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function AdminReportsPage() {
  const [days, setDays] = useState(30);

  const from = format(subDays(new Date(), days), 'yyyy-MM-dd');
  const to = format(new Date(), 'yyyy-MM-dd');

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['reports-orders', days],
    queryFn: () => reportsApi.orders({ from, to }).then(r => r.data.data),
  });

  const { data: productsData } = useQuery({
    queryKey: ['reports-products'],
    queryFn: () => reportsApi.products().then(r => r.data.data),
  });

  const orders = ordersData?.orders || [];
  const summary = ordersData?.summary;

  // Build daily revenue series
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

  // Status pie data
  const pieData = Object.entries(summary?.byStatus || {}).map(([status, count]) => ({
    name: status, value: count as number, color: STATUS_COLORS[status] || '#94a3b8',
  }));

  // Top markets
  const marketMap: Record<string, { name: string; total: number; count: number }> = {};
  orders.forEach((o: any) => {
    const id = o.market?.name || 'Unknown';
    if (!marketMap[id]) marketMap[id] = { name: id, total: 0, count: 0 };
    marketMap[id].total += Number(o.totalAmount);
    marketMap[id].count += 1;
  });
  const topMarkets = Object.values(marketMap).sort((a, b) => b.total - a.total).slice(0, 10);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:2, mb:4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} mb={0.5}>Platform Reports</Typography>
          <Typography variant="body2" color="text.secondary">Business analytics overview</Typography>
        </Box>
        <ToggleButtonGroup value={days} exclusive onChange={(_, v) => v && setDays(v)} size="small">
          {[7, 30, 90].map(d => <ToggleButton key={d} value={d} sx={{ px: 2, fontWeight: 600, textTransform: 'none' }}>{d}d</ToggleButton>)}
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}><StatCard icon={BarChartIcon} label="Total Orders" value={summary?.total ?? '—'} gradient="linear-gradient(135deg,#1B4FD8,#3B82F6)" shadow="rgba(27,79,216,0.3)"/></Grid>
        <Grid item xs={12} sm={6} lg={3}><StatCard icon={TrendingUpIcon} label="Total Revenue" value={summary?.totalAmount ? `${(Number(summary.totalAmount)/1_000_000).toFixed(1)}M UZS` : '—'} gradient="linear-gradient(135deg,#059669,#10B981)" shadow="rgba(5,150,105,0.3)"/></Grid>
        <Grid item xs={12} sm={6} lg={3}><StatCard icon={StoreIcon} label="Active Markets" value={topMarkets.length} gradient="linear-gradient(135deg,#7C3AED,#8B5CF6)" shadow="rgba(124,58,237,0.3)"/></Grid>
        <Grid item xs={12} sm={6} lg={3}><StatCard icon={InventoryIcon} label="Products Ordered" value={productsData?.length ?? '—'} gradient="linear-gradient(135deg,#D97706,#F59E0B)" shadow="rgba(217,119,6,0.3)"/></Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Card elevation={0} sx={{ border:'1px solid #E2E8F0', borderRadius:3, p:3 }}>
            <Typography variant="h6" mb={2}>Revenue Over Time</Typography>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="date" tick={{fontSize:11}} tickLine={false} axisLine={false} interval={days>30?6:days>14?3:1}/>
                <YAxis tick={{fontSize:11}} tickLine={false} axisLine={false} tickFormatter={v=>v>=1_000_000?`${(v/1_000_000).toFixed(1)}M`:v>=1000?`${(v/1000).toFixed(0)}K`:v}/>
                <Tooltip formatter={(v:any)=>[`${Number(v).toLocaleString()} UZS`,'Revenue']}/>
                <Line type="monotone" dataKey="revenue" stroke="#1B4FD8" strokeWidth={2.5} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ border:'1px solid #E2E8F0', borderRadius:3, p:3 }}>
            <Typography variant="h6" mb={2}>Orders by Status</Typography>
            {pieData.length===0 ? <Box sx={{height:220,display:'flex',alignItems:'center',justifyContent:'center'}}><Typography variant="body2" color="text.disabled">No data yet</Typography></Box> : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" nameKey="name" paddingAngle={2}>{pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip/><Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/></PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Card elevation={0} sx={{ border:'1px solid #E2E8F0', borderRadius:3, p:3 }}>
            <Typography variant="h6" mb={2}>Top Markets by Revenue</Typography>
            {topMarkets.length===0 ? <Box sx={{height:220,display:'flex',alignItems:'center',justifyContent:'center'}}><Typography variant="body2" color="text.disabled">No data yet</Typography></Box> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topMarkets} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/><XAxis type="number" tick={{fontSize:10}} tickLine={false} axisLine={false} tickFormatter={v=>v>=1_000_000?`${(v/1_000_000).toFixed(1)}M`:`${(v/1000).toFixed(0)}K`}/><YAxis type="category" dataKey="name" tick={{fontSize:11}} tickLine={false} axisLine={false} width={90}/><Tooltip formatter={(v:any)=>[`${Number(v).toLocaleString()} UZS`,'Revenue']}/><Bar dataKey="total" fill="#1B4FD8" radius={[0,4,4,0]}/></BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Card elevation={0} sx={{ border:'1px solid #E2E8F0', borderRadius:3, p:3 }}>
            <Typography variant="h6" mb={2}>Orders Per Day</Typography>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailySeries}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/><XAxis dataKey="date" tick={{fontSize:11}} tickLine={false} axisLine={false} interval={days>14?Math.floor(days/7):1}/><YAxis tick={{fontSize:11}} tickLine={false} axisLine={false} allowDecimals={false}/><Tooltip/><Bar dataKey="count" fill="#059669" radius={[4,4,0,0]} name="Orders"/></BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
