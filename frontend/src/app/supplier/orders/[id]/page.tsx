'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ordersApi } from '../../../../lib/api';
import { format } from 'date-fns';
import {
  Box, Grid, Card, CardContent, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, Avatar, Alert,
  Skeleton, alpha, Stack, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, TextField, IconButton, Tooltip
} from '@mui/material';
import {
  Timeline, TimelineItem, TimelineSeparator, TimelineConnector,
  TimelineContent, TimelineDot
} from '@mui/lab';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import StorefrontIcon from '@mui/icons-material/Storefront';
import InventoryIcon from '@mui/icons-material/Inventory';
import PrintIcon from '@mui/icons-material/Print';
import EditNoteIcon from '@mui/icons-material/EditNote';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { OrderChip } from '../../../../components/ui/OrderChip';
import { PageHeader } from '../../../../components/ui/PageHeader';


export default function SupplierOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.get(id).then(r => r.data.data),
  });

  const confirmMut = useMutation({
    mutationFn: () => ordersApi.confirm(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['order', id] }),
  });

  const rejectMut = useMutation({
    mutationFn: (r: string) => ordersApi.reject(id, r),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['order', id] }); setRejectOpen(false); setReason(''); },
  });

  const dispatchMut = useMutation({
    mutationFn: () => ordersApi.dispatch(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['order', id] }),
  });

  if (isLoading) return (
    <Box sx={{ p: 3 }}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} /></Box>
  );
  if (!data) return <Box sx={{ p: 3 }}><Alert severity="error">Order not found.</Alert></Box>;

  const order = data;
  const TIMELINE_STEPS = [
    { status: 'DRAFT',      label: 'Order Created',        icon: EditNoteIcon,            color: '#64748B' },
    { status: 'SUBMITTED',  label: 'Submitted',             icon: AssignmentTurnedInIcon,  color: '#1B4FD8' },
    { status: 'CONFIRMED',  label: 'Confirmed',             icon: CheckCircleIcon,          color: '#D97706' },
    { status: 'IN_TRANSIT', label: 'Dispatched',            icon: LocalShippingIcon,        color: '#7C3AED' },
    { status: 'DELIVERED',  label: 'Delivered',             icon: StorefrontIcon,           color: '#059669' },
    { status: 'CLOSED',     label: 'Closed',                icon: CheckCircleIcon,          color: '#059669' },
  ];
  const statusOrder = ['DRAFT','SUBMITTED','CONFIRMED','IN_TRANSIT','DELIVERED','CLOSED'];
  const currentIdx = statusOrder.indexOf(order.status);
  const histMap = new Map((order.statusHistory || []).map((h: any) => [h.toStatus, h]));

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeader
        title={order.orderNumber}
        subtitle={`From ${order.market?.name} · Received ${format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm')}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/supplier/dashboard' },
          { label: 'Orders', href: '/supplier/orders' },
          { label: order.orderNumber },
        ]}
        actions={
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <OrderChip status={order.status} size="medium" />
            <Tooltip title="Print"><IconButton size="small" onClick={() => window.print()}><PrintIcon /></IconButton></Tooltip>
            {order.status === 'SUBMITTED' && (<>
              <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => confirmMut.mutate()} disabled={confirmMut.isPending}>
                {confirmMut.isPending ? 'Confirming...' : 'Confirm Order'}
              </Button>
              <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => setRejectOpen(true)}>Reject</Button>
            </>)}
            {order.status === 'CONFIRMED' && (
              <Button variant="contained" color="secondary" startIcon={<LocalShippingIcon />} onClick={() => dispatchMut.mutate()} disabled={dispatchMut.isPending} size="large">
                {dispatchMut.isPending ? 'Processing...' : 'Mark as Dispatched'}
              </Button>
            )}
          </Box>
        }
      />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Stack spacing={3}>
            {/* Market card */}
            <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <StorefrontIcon sx={{ color: 'success.main', fontSize: 20 }} />
                  <Typography variant="subtitle2" color="text.secondary">From Market</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 44, height: 44, bgcolor: alpha('#059669', 0.12), color: 'success.dark', fontWeight: 700, fontSize: '1.1rem' }}>
                    {order.market?.name?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>{order.market?.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{order.market?.phone} · {order.market?.address}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Items */}
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
                        <TableCell align="center"><Chip label={item.quantity} size="small" variant="outlined" /></TableCell>
                        <TableCell align="right"><Typography variant="body2" color="text.secondary">{Number(item.unitPrice).toLocaleString()} UZS</Typography></TableCell>
                        <TableCell align="right"><Typography variant="body2" fontWeight={700}>{Number(item.subtotal).toLocaleString()} UZS</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ px: 3, py: 2, bgcolor: '#F8FAFC', borderTop: '2px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight={600}>Total Amount</Typography>
                <Typography variant="h5" fontWeight={800} color="primary.main">
                  {Number(order.totalAmount).toLocaleString()} <Typography component="span" variant="body2" color="text.secondary">UZS</Typography>
                </Typography>
              </Box>
            </Card>

            {order.notes && (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={600} mb={0.25}>Notes from Market</Typography>
                <Typography variant="body2">{order.notes}</Typography>
              </Alert>
            )}
          </Stack>
        </Grid>

        {/* Timeline */}
        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, position: 'sticky', top: 80 }}>
            <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #E2E8F0' }}>
              <Typography variant="h6">Order Timeline</Typography>
            </Box>
            <Box sx={{ px: 2, py: 2 }}>
              <Timeline sx={{ p: 0, m: 0 }}>
                {TIMELINE_STEPS.map((step, idx) => {
                  const done = idx <= currentIdx;
                  const Icon = step.icon;
                  const entry = histMap.get(step.status) as any;
                  return (
                    <TimelineItem key={step.status} sx={{ '&:before': { display: 'none' }, minHeight: 56 }}>
                      <TimelineSeparator>
                        <TimelineDot sx={{ m: 0, p: 0.75, bgcolor: done ? step.color : '#E2E8F0', boxShadow: done && idx === currentIdx ? `0 0 0 4px ${alpha(step.color, 0.2)}` : 'none', transition: 'all 0.3s' }}>
                          <Icon sx={{ fontSize: 14, color: done ? '#fff' : '#94A3B8' }} />
                        </TimelineDot>
                        {idx < TIMELINE_STEPS.length - 1 && <TimelineConnector sx={{ bgcolor: done && idx < currentIdx ? step.color : '#E2E8F0', opacity: 0.7 }} />}
                      </TimelineSeparator>
                      <TimelineContent sx={{ py: 0, px: 2, pb: 2 }}>
                        <Typography variant="body2" fontWeight={done ? 600 : 400} color={done ? 'text.primary' : 'text.disabled'}>{step.label}</Typography>
                        {entry && <Typography variant="caption" color="text.secondary" display="block">{format(new Date(entry.createdAt), 'dd MMM, HH:mm')}{entry.changedBy && ` · ${entry.changedBy.username}`}</Typography>}
                      </TimelineContent>
                    </TimelineItem>
                  );
                })}
              </Timeline>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Order</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>Provide a reason. The market will be notified and the order will be closed.</DialogContentText>
          <TextField autoFocus fullWidth multiline rows={3} label="Rejection Reason" value={reason}
            onChange={e => setReason(e.target.value)} placeholder="e.g. Out of stock, price changed..." helperText={`${reason.length}/5 minimum`} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => rejectMut.mutate(reason)} disabled={reason.length < 5 || rejectMut.isPending}>
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
