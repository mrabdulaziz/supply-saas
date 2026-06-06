'use client';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, ordersApi, productsApi } from '../../../lib/api';
import { useAuthStore } from '../../../stores/auth.store';
import {
  Box, Grid, Card, CardContent, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Avatar, Chip, Alert,
  LinearProgress, Divider, Skeleton, alpha, Stack, IconButton, Tooltip, Badge
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InventoryIcon from '@mui/icons-material/Inventory';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { KpiCard } from '../../../components/ui/KpiCard';
import { PageHeader } from '../../../components/ui/PageHeader';
import { OrderChip } from '../../../components/ui/OrderChip';
import { EmptyState } from '../../../components/ui/EmptyState';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';

export default function SupplierDashboard() {
  const { user } = useAuthStore();

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['supplier-report-dash'],
    queryFn: () => reportsApi.orders({ supplierId: user?.supplierId }).then(r => r.data.data),
    enabled: !!user?.supplierId,
  });

  const { data: pendingOrders } = useQuery({
    queryKey: ['supplier-pending-orders'],
    queryFn: () => ordersApi.list({ status: 'SUBMITTED', limit: 8 }).then(r => r.data),
  });

  const { data: inTransitOrders } = useQuery({
    queryKey: ['supplier-intransit-orders'],
    queryFn: () => ordersApi.list({ status: 'IN_TRANSIT', limit: 5 }).then(r => r.data),
  });

  const { data: lowStockProducts } = useQuery({
    queryKey: ['supplier-low-stock'],
    queryFn: () => productsApi.list({ supplierId: user?.supplierId, limit: 100 }).then(r => {
      const products = r.data.data || [];
      return products.filter((p: any) => p.stockQty < 50 && p.isActive).slice(0, 5);
    }),
    enabled: !!user?.supplierId,
  });

  const summary = report?.summary;
  const revenue = Number(summary?.totalAmount || 0);
  const pendingCount = pendingOrders?.pagination?.total || 0;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeader
        title="Supplier Dashboard"
        subtitle={`Welcome back${user?.username ? ', ' + user.username : ''}. Here's what's happening today.`}
        actions={
          <Button component={Link} href="/supplier/orders?status=SUBMITTED" variant="contained" startIcon={<PendingActionsIcon />}
            endIcon={pendingCount > 0 ? <Chip label={pendingCount} size="small" sx={{ bgcolor:'rgba(255,255,255,0.3)', color:'#fff', height:18, fontSize:'0.6875rem' }}/> : undefined}>
            Review Pending
          </Button>
        }
      />

      {/* Low stock alert */}
      {lowStockProducts && lowStockProducts.length > 0 && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 3, borderRadius: 2 }}
          action={<Button size="small" component={Link} href="/supplier/products" color="inherit">Update Stock</Button>}>
          <Typography variant="body2" fontWeight={600}>Low Stock Warning</Typography>
          <Typography variant="caption">
            {lowStockProducts.map((p: any) => p.name).join(', ')} {lowStockProducts.length === 1 ? 'is' : 'are'} running low on stock.
          </Typography>
        </Alert>
      )}

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard label="Total Revenue" value={revenue >= 1_000_000 ? `${(revenue/1_000_000).toFixed(1)}M UZS` : `${(revenue/1000).toFixed(0)}K UZS`}
            subValue="All time" icon={TrendingUpIcon} gradient="linear-gradient(135deg,#1B4FD8,#3B82F6)" shadow="rgba(27,79,216,0.25)" loading={reportLoading} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard label="Pending Confirmation" value={pendingCount} subValue="Requires your action"
            icon={PendingActionsIcon} gradient="linear-gradient(135deg,#D97706,#F59E0B)" shadow="rgba(217,119,6,0.25)" loading={reportLoading}
            onClick={() => window.location.href='/supplier/orders'} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard label="Orders In Transit" value={inTransitOrders?.pagination?.total || 0} subValue="Currently dispatched"
            icon={LocalShippingIcon} gradient="linear-gradient(135deg,#7C3AED,#8B5CF6)" shadow="rgba(124,58,237,0.25)" loading={reportLoading} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard label="Total Orders" value={summary?.total ?? '—'} subValue="Completed + active"
            icon={ReceiptLongIcon} gradient="linear-gradient(135deg,#059669,#10B981)" shadow="rgba(5,150,105,0.25)" loading={reportLoading} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Pending Orders Queue */}
        <Grid item xs={12} lg={7}>
          <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, height: '100%' }}>
            <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PendingActionsIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                <Typography variant="h6">Orders Awaiting Confirmation</Typography>
                {pendingCount > 0 && <Chip label={`${pendingCount} new`} size="small" color="warning" />}
              </Box>
              <Button component={Link} href="/supplier/orders" size="small" endIcon={<ArrowForwardIcon fontSize="small" />}>View all</Button>
            </Box>

            {pendingOrders?.data?.length === 0 ? (
              <EmptyState icon={CheckCircleIcon} title="All caught up!" description="No orders waiting for your confirmation right now." />
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Order</TableCell>
                      <TableCell>Market</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Received</TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingOrders?.data?.map((o: any) => {
                      const age = new Date().getTime() - new Date(o.createdAt).getTime();
                      const isUrgent = age > 24 * 60 * 60 * 1000; // older than 24h
                      return (
                        <TableRow key={o.id} sx={{ bgcolor: isUrgent ? alpha('#DC2626', 0.03) : 'transparent' }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {isUrgent && <Tooltip title="Waiting >24h"><WarningAmberIcon sx={{ fontSize: 14, color: 'error.main' }} /></Tooltip>}
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>{o.orderNumber}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 26, height: 26, bgcolor: alpha('#1B4FD8', 0.1), color: 'primary.main', fontSize: '0.75rem', fontWeight: 700 }}>{o.market?.name?.[0]}</Avatar>
                              <Typography variant="body2" fontWeight={500}>{o.market?.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>{Number(o.totalAmount).toLocaleString()} <Typography component="span" variant="caption" color="text.secondary">UZS</Typography></Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AccessTimeIcon sx={{ fontSize: 12, color: isUrgent ? 'error.main' : 'text.disabled' }} />
                              <Typography variant="caption" color={isUrgent ? 'error.main' : 'text.secondary'}>{formatDistanceToNow(new Date(o.createdAt), { addSuffix: true })}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Button component={Link} href={`/supplier/orders/${o.id}`} size="small" variant="outlined" color={isUrgent ? 'error' : 'primary'} sx={{ fontSize: '0.75rem' }}>
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>

        {/* Right column */}
        <Grid item xs={12} lg={5}>
          <Stack spacing={3}>
            {/* Order status breakdown */}
            <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" mb={2.5}>Order Status Breakdown</Typography>
                {[
                  { label: 'Confirmed', status: 'CONFIRMED', color: '#D97706', bg: '#FFFBEB', count: summary?.byStatus?.CONFIRMED || 0 },
                  { label: 'In Transit', status: 'IN_TRANSIT', color: '#7C3AED', bg: '#F5F3FF', count: summary?.byStatus?.IN_TRANSIT || 0 },
                  { label: 'Delivered', status: 'DELIVERED', color: '#059669', bg: '#ECFDF5', count: summary?.byStatus?.DELIVERED || 0 },
                  { label: 'Rejected', status: 'REJECTED', color: '#DC2626', bg: '#FEF2F2', count: summary?.byStatus?.REJECTED || 0 },
                ].map(item => {
                  const total = summary?.total || 1;
                  const pct = Math.round((item.count / total) * 100);
                  return (
                    <Box key={item.status} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={500}>{item.label}</Typography>
                        <Typography variant="body2" fontWeight={600} color={item.color}>{item.count}</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={pct}
                        sx={{ height: 6, borderRadius: 3, bgcolor: item.bg, '& .MuiLinearProgress-bar': { bgcolor: item.color, borderRadius: 3 } }} />
                    </Box>
                  );
                })}
              </CardContent>
            </Card>

            {/* Low stock */}
            {lowStockProducts && lowStockProducts.length > 0 && (
              <Card elevation={0} sx={{ border: '1px solid #FEF3C7', borderRadius: 3, bgcolor: '#FFFBEB' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <WarningAmberIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                    <Typography variant="h6">Low Stock Alert</Typography>
                  </Box>
                  <Stack divider={<Divider />} spacing={0}>
                    {lowStockProducts.map((p: any) => (
                      <Box key={p.id} sx={{ py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{p.sku}</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" fontWeight={700} color={p.stockQty === 0 ? 'error.main' : 'warning.main'}>
                            {p.stockQty} {p.unit}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">in stock</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                  <Button component={Link} href="/supplier/products" fullWidth variant="contained" color="warning" size="small" sx={{ mt: 2 }}>
                    Update Stock Levels
                  </Button>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
