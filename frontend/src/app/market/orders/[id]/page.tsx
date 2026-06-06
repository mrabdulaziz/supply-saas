'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ordersApi } from '../../../../lib/api';
import { format } from 'date-fns';
import {
  Box, Grid, Card, CardContent, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, Avatar, Divider,
  Alert, Skeleton, alpha, Stack, IconButton, Tooltip
} from '@mui/material';
import {
  Timeline, TimelineItem, TimelineSeparator, TimelineConnector,
  TimelineContent, TimelineDot, TimelineOppositeContent
} from '@mui/lab';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InventoryIcon from '@mui/icons-material/Inventory';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PrintIcon from '@mui/icons-material/Print';
import EditNoteIcon from '@mui/icons-material/EditNote';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { OrderChip } from '../../../../components/ui/OrderChip';
import { PageHeader } from '../../../../components/ui/PageHeader';

export default function MarketOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.get(id).then(r => r.data.data),
  });

  const deliverMut = useMutation({
    mutationFn: () => ordersApi.deliver(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['order', id] }),
  });

  if (isLoading) return (
    <Box sx={{ p: 3 }}>
      <Skeleton width={200} height={32} sx={{ mb: 3 }} />
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} /></Grid>
        <Grid item xs={12} lg={4}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} /></Grid>
      </Grid>
    </Box>
  );

  if (error || !data) return (
    <Box sx={{ p: 3 }}><Alert severity="error">Order not found.</Alert></Box>
  );

  const order = data;
  const canConfirmDelivery = order.status === 'IN_TRANSIT';

  const TIMELINE_STEPS = [
    { status: 'DRAFT',      label: 'Order Created',       icon: EditNoteIcon,           color: '#64748B' },
    { status: 'SUBMITTED',  label: 'Submitted',            icon: AssignmentTurnedInIcon,  color: '#1B4FD8' },
    { status: 'CONFIRMED',  label: 'Confirmed by Supplier',icon: CheckCircleIcon,         color: '#D97706' },
    { status: 'IN_TRANSIT', label: 'Dispatched',           icon: LocalShippingIcon,       color: '#7C3AED' },
    { status: 'DELIVERED',  label: 'Delivered',            icon: StorefrontIcon,          color: '#059669' },
    { status: 'CLOSED',     label: 'Order Closed',         icon: CheckCircleIcon,         color: '#059669' },
  ];

  const statusOrder = ['DRAFT','SUBMITTED','CONFIRMED','IN_TRANSIT','DELIVERED','CLOSED'];
  const currentIdx = statusOrder.indexOf(order.status);
  const histMap = new Map((order.statusHistory || []).map((h: any) => [h.toStatus, h]));

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeader
        title={order.orderNumber}
        subtitle={`Created ${format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm')}${order.createdBy ? ' by ' + order.createdBy.username : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/market/dashboard' },
          { label: 'Orders', href: '/market/orders' },
          { label: order.orderNumber },
        ]}
        actions={
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <OrderChip status={order.status} size="medium" />
            <Tooltip title="Print order"><IconButton onClick={() => window.print()} size="small"><PrintIcon /></IconButton></Tooltip>
            {canConfirmDelivery && (
              <Button variant="contained" color="success" startIcon={<CheckCircleIcon />}
                onClick={() => deliverMut.mutate()} disabled={deliverMut.isPending} size="large">
                {deliverMut.isPending ? 'Confirming...' : 'Confirm Delivery'}
              </Button>
            )}
          </Box>
        }
      />

      {order.rejectionReason && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} icon={<CancelIcon />}>
          <Typography variant="body2" fontWeight={600}>Order Rejected</Typography>
          <Typography variant="caption">{order.rejectionReason}</Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left: supplier + items */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={3}>
            {/* Supplier card */}
            <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                  <LocalShippingIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="subtitle2" color="text.secondary">Supplier</Typography>
                </Box>
                <Typography variant="h6" fontWeight={600}>{order.supplier?.name}</Typography>
                <Typography variant="body2" color="text.secondary">{order.supplier?.phone}</Typography>
              </CardContent>
            </Card>

            {/* Items table */}
            <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1 }}>
                <InventoryIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                <Typography variant="h6">Order Items</Typography>
                <Chip label={`${order.items?.length} items`} size="small" sx={{ ml: 0.5 }} />
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="center">Qty</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{item.product?.name}</Typography>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{item.product?.sku} · {item.product?.unit}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={item.quantity} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary">{Number(item.unitPrice).toLocaleString()} UZS</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700}>{Number(item.subtotal).toLocaleString()} UZS</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {/* Total footer */}
              <Box sx={{ px: 3, py: 2, bgcolor: '#F8FAFC', borderTop: '2px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight={600}>Total Amount</Typography>
                <Typography variant="h5" fontWeight={800} color="primary.main">
                  {Number(order.totalAmount).toLocaleString()} <Typography component="span" variant="body2" color="text.secondary">UZS</Typography>
                </Typography>
              </Box>
            </Card>

            {/* Notes */}
            {order.notes && (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={600} mb={0.25}>Order Notes</Typography>
                <Typography variant="body2">{order.notes}</Typography>
              </Alert>
            )}
          </Stack>
        </Grid>

        {/* Right: timeline */}
        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, position: 'sticky', top: 80 }}>
            <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #E2E8F0' }}>
              <Typography variant="h6">Order Timeline</Typography>
            </Box>
            <Box sx={{ px: 2, py: 2 }}>
              <Timeline sx={{ p: 0, m: 0 }}>
                {TIMELINE_STEPS.map((step, idx) => {
                  const done = idx <= currentIdx;
                  const active = statusOrder[currentIdx] === step.status;
                  const entry = histMap.get(step.status) as any;
                  const Icon = step.icon;
                  return (
                    <TimelineItem key={step.status} sx={{ '&:before': { display: 'none' }, minHeight: 60 }}>
                      <TimelineSeparator>
                        <TimelineDot sx={{
                          m: 0, p: 0.75,
                          bgcolor: done ? step.color : '#E2E8F0',
                          boxShadow: active ? `0 0 0 4px ${alpha(step.color, 0.2)}` : 'none',
                          transition: 'all 0.3s',
                        }}>
                          <Icon sx={{ fontSize: 14, color: done ? '#fff' : '#94A3B8' }} />
                        </TimelineDot>
                        {idx < TIMELINE_STEPS.length - 1 && (
                          <TimelineConnector sx={{ bgcolor: done && idx < currentIdx ? step.color : '#E2E8F0', opacity: done && idx < currentIdx ? 0.6 : 1 }} />
                        )}
                      </TimelineSeparator>
                      <TimelineContent sx={{ py: 0, px: 2, pb: 2 }}>
                        <Typography variant="body2" fontWeight={done ? 600 : 400} color={done ? 'text.primary' : 'text.disabled'}>
                          {step.label}
                        </Typography>
                        {entry && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {format(new Date(entry.createdAt), 'dd MMM, HH:mm')}
                            {entry.changedBy && ` · ${entry.changedBy.username}`}
                          </Typography>
                        )}
                      </TimelineContent>
                    </TimelineItem>
                  );
                })}
              </Timeline>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
