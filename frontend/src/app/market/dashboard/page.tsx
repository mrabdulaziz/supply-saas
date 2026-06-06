'use client';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../../lib/api';
import { useAuthStore } from '../../../stores/auth.store';
import {
  Box, Grid, Card, CardContent, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Avatar, Stack, alpha,
  Divider, LinearProgress, Chip
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { KpiCard } from '../../../components/ui/KpiCard';
import { PageHeader } from '../../../components/ui/PageHeader';
import { OrderChip } from '../../../components/ui/OrderChip';
import { EmptyState } from '../../../components/ui/EmptyState';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';

export default function MarketDashboard() {
  const { user } = useAuthStore();

  const { data: allOrders, isLoading } = useQuery({
    queryKey: ['market-all-orders'],
    queryFn: () => ordersApi.list({ limit: 100 }).then(r => r.data),
  });

  const { data: activeOrders } = useQuery({
    queryKey: ['market-active-orders'],
    queryFn: () => ordersApi.list({ limit: 6 }).then(r => r.data),
  });

  const orders = allOrders?.data || [];
  const totalSpent = orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);
  const byStatus = orders.reduce((acc: any, o: any) => { acc[o.status] = (acc[o.status]||0)+1; return acc; }, {});

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeader
        title="Market Dashboard"
        subtitle={`Welcome back${user?.username ? ', ' + user.username : ''}. Manage your orders and procurement.`}
        actions={
          <Button component={Link} href="/market/catalog" variant="contained" startIcon={<AddShoppingCartIcon />} size="large">
            Browse & Order
          </Button>
        }
      />

      {/* KPI Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard label="Total Orders" value={allOrders?.pagination?.total ?? '—'} subValue="All time"
            icon={ReceiptLongIcon} gradient="linear-gradient(135deg,#1B4FD8,#3B82F6)" shadow="rgba(27,79,216,0.25)" loading={isLoading} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard label="Total Spent" value={totalSpent >= 1_000_000 ? `${(totalSpent/1_000_000).toFixed(1)}M` : `${(totalSpent/1000).toFixed(0)}K`}
            subValue="UZS all time" icon={ShoppingCartIcon} gradient="linear-gradient(135deg,#059669,#10B981)" shadow="rgba(5,150,105,0.25)" loading={isLoading} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard label="In Transit" value={byStatus['IN_TRANSIT'] || 0} subValue="On the way to you"
            icon={LocalShippingIcon} gradient="linear-gradient(135deg,#7C3AED,#8B5CF6)" shadow="rgba(124,58,237,0.25)" loading={isLoading} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard label="Delivered" value={byStatus['DELIVERED'] || 0} subValue="Confirmed deliveries"
            icon={CheckCircleIcon} gradient="linear-gradient(135deg,#D97706,#F59E0B)" shadow="rgba(217,119,6,0.25)" loading={isLoading} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Orders */}
        <Grid item xs={12} lg={8}>
          <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3 }}>
            <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0' }}>
              <Typography variant="h6">Recent Orders</Typography>
              <Button component={Link} href="/market/orders" size="small" endIcon={<ArrowForwardIcon fontSize="small" />}>View all</Button>
            </Box>
            {activeOrders?.data?.length === 0 ? (
              <EmptyState icon={ShoppingCartIcon} title="No orders yet" description="Browse the catalog and place your first order."
                action={{ label: 'Browse Catalog', onClick: () => window.location.href = '/market/catalog' }} />
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Order #</TableCell>
                      <TableCell>Supplier</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeOrders?.data?.map((o: any) => (
                      <TableRow key={o.id} sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F8FAFC' } }}
                        onClick={() => window.location.href = `/market/orders/${o.id}`}>
                        <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>{o.orderNumber}</Typography></TableCell>
                        <TableCell><Typography variant="body2">{o.supplier?.name}</Typography></TableCell>
                        <TableCell><OrderChip status={o.status} /></TableCell>
                        <TableCell align="right"><Typography variant="body2" fontWeight={600}>{Number(o.totalAmount).toLocaleString()} <Typography component="span" variant="caption" color="text.secondary">UZS</Typography></Typography></TableCell>
                        <TableCell><Typography variant="caption" color="text.secondary">{format(new Date(o.createdAt), 'dd MMM')}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>

        {/* Right sidebar */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Quick actions */}
            <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" mb={2}>Quick Actions</Typography>
                <Stack spacing={1.5}>
                  <Button component={Link} href="/market/catalog" variant="contained" fullWidth startIcon={<AddShoppingCartIcon />} sx={{ justifyContent: 'flex-start' }}>
                    Browse Catalog
                  </Button>
                  <Button component={Link} href="/market/orders" variant="outlined" fullWidth startIcon={<ReceiptLongIcon />} sx={{ justifyContent: 'flex-start' }}>
                    View All Orders
                  </Button>
                  <Button component={Link} href="/market/account" variant="outlined" color="inherit" fullWidth startIcon={<CheckCircleIcon />} sx={{ justifyContent: 'flex-start', color: 'text.secondary' }}>
                    Account & Documents
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Order funnel */}
            <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" mb={2.5}>Order Funnel</Typography>
                {[
                  { label: 'Submitted', count: byStatus['SUBMITTED']||0, color: '#1B4FD8', bg: '#EFF6FF' },
                  { label: 'Confirmed', count: byStatus['CONFIRMED']||0, color: '#D97706', bg: '#FFFBEB' },
                  { label: 'In Transit', count: byStatus['IN_TRANSIT']||0, color: '#7C3AED', bg: '#F5F3FF' },
                  { label: 'Delivered', count: byStatus['DELIVERED']||0, color: '#059669', bg: '#ECFDF5' },
                ].map(s => {
                  const total = (allOrders?.pagination?.total) || 1;
                  const pct = Math.round((s.count / total) * 100);
                  return (
                    <Box key={s.label} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={500}>{s.label}</Typography>
                        <Typography variant="body2" fontWeight={700} color={s.color}>{s.count}</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={pct} sx={{ height: 5, borderRadius: 3, bgcolor: s.bg, '& .MuiLinearProgress-bar': { bgcolor: s.color, borderRadius: 3 } }} />
                    </Box>
                  );
                })}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
