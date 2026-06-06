'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../../lib/api';
import { format } from 'date-fns';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Avatar, Skeleton, alpha, Chip, ToggleButtonGroup,
  ToggleButton, InputAdornment, TextField, Pagination
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { PageHeader } from '../../../components/ui/PageHeader';
import { OrderChip } from '../../../components/ui/OrderChip';
import { EmptyState } from '../../../components/ui/EmptyState';
import Link from 'next/link';

const STATUS_OPTIONS = ['', 'DRAFT', 'SUBMITTED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CLOSED', 'REJECTED'];

const STATUS_TABS = ['', 'SUBMITTED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'REJECTED'];

export default function MarketOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['market-orders', page, status],
    queryFn: () => ordersApi.list({ page, limit: 15, status: status || undefined }).then(r => r.data),
  });

  const pagination = data?.pagination;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeader
        title="My Orders"
        subtitle="Track and manage all your procurement orders"
        breadcrumbs={[{ label: 'Dashboard', href: '/market/dashboard' }, { label: 'Orders' }]}
        actions={
          <Button component={Link} href="/market/catalog" variant="contained" startIcon={<AddShoppingCartIcon />}>
            New Order
          </Button>
        }
      />

      {/* Status filter tabs */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <ToggleButtonGroup value={status} exclusive onChange={(_, v) => { if (v !== null) { setStatus(v); setPage(1); } }} size="small">
          {STATUS_TABS.map(s => (
            <ToggleButton key={s} value={s} sx={{ textTransform: 'none', fontWeight: 600, px: 2, fontSize: '0.8125rem' }}>
              {s || 'All'}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        {pagination && <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>{pagination.total} orders</Typography>}
      </Box>

      <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell align="center">Items</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
              )) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState icon={ShoppingCartIcon} title="No orders found" description="Start by browsing the catalog and placing your first order."
                      action={{ label: 'Browse Catalog', onClick: () => window.location.href = '/market/catalog' }} />
                  </TableCell>
                </TableRow>
              ) : data?.data?.map((order: any) => (
                <TableRow key={order.id} sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F8FAFC' } }}
                  onClick={() => window.location.href = `/market/orders/${order.id}`}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main' }}>{order.orderNumber}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: alpha('#059669', 0.1), color: 'success.dark', fontWeight: 700, fontSize: '0.75rem' }}>
                        {order.supplier?.name?.[0]}
                      </Avatar>
                      <Typography variant="body2" fontWeight={500}>{order.supplier?.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={`${order._count?.items} items`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={700}>{Number(order.totalAmount).toLocaleString()}
                      <Typography component="span" variant="caption" color="text.secondary"> UZS</Typography>
                    </Typography>
                  </TableCell>
                  <TableCell><OrderChip status={order.status} /></TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{format(new Date(order.createdAt), 'dd MMM yyyy')}</Typography></TableCell>
                  <TableCell align="center" onClick={e => e.stopPropagation()}>
                    <Button component={Link} href={`/market/orders/${order.id}`} size="small" variant="outlined" startIcon={<VisibilityIcon fontSize="small" />} sx={{ fontSize: '0.75rem' }}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {pagination && pagination.totalPages > 1 && (
          <Box sx={{ px: 2, py: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid #E2E8F0' }}>
            <Pagination count={pagination.totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" />
          </Box>
        )}
      </Card>
    </Box>
  );
}
