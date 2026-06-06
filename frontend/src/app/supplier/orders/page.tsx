'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../../../lib/api';
import { format } from 'date-fns';
import {
  Box, Card, Typography, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Skeleton, Avatar, alpha, Pagination,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, Tooltip, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import AssignmentIcon from '@mui/icons-material/Assignment';
import Link from 'next/link';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../../components/ui/PageHeader';
import { OrderChip } from '../../../components/ui/OrderChip';
import { EmptyState } from '../../../components/ui/EmptyState';
import { exportCsv } from '../../../lib/exportCsv';

export default function SupplierOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('SUBMITTED');
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data, isLoading } = useQuery({
    queryKey: ['supplier-orders', page, status],
    queryFn: () => ordersApi.list({ page, limit: 15, status: status || undefined }).then(r => r.data),
  });

  const confirmMut = useMutation({
    mutationFn: (id: string) => ordersApi.confirm(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['supplier-orders'] }); enqueueSnackbar('Order confirmed successfully', { variant: 'success' }); },
    onError: () => enqueueSnackbar('Failed to confirm order', { variant: 'error' }),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => ordersApi.reject(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['supplier-orders'] }); enqueueSnackbar('Order rejected', { variant: 'warning' }); },
  });

  const dispatchMut = useMutation({
    mutationFn: (id: string) => ordersApi.dispatch(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['supplier-orders'] }); enqueueSnackbar('Order marked as dispatched', { variant: 'success' }); },
    onError: () => enqueueSnackbar('Failed to dispatch order', { variant: 'error' }),
  });

  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; orderId: string }>({ open: false, orderId: '' });
  const [rejectReason, setRejectReason] = useState('');

  const handleRejectOpen = (id: string) => { setRejectDialog({ open: true, orderId: id }); setRejectReason(''); };
  const handleRejectConfirm = () => { if (rejectReason.length >= 5) rejectMut.mutate({ id: rejectDialog.orderId, reason: rejectReason }); setRejectDialog({ open: false, orderId: '' }); };

  const STATUS_TABS = ['SUBMITTED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'REJECTED', ''];
  const STATUS_CHIP: Record<string, { label: string; color: 'default'|'info'|'warning'|'secondary'|'success'|'error' }> = {
    SUBMITTED:{label:'Submitted',color:'info'}, CONFIRMED:{label:'Confirmed',color:'warning'},
    IN_TRANSIT:{label:'In Transit',color:'secondary'}, DELIVERED:{label:'Delivered',color:'success'},
    REJECTED:{label:'Rejected',color:'error'}, DRAFT:{label:'Draft',color:'default'}, CLOSED:{label:'Closed',color:'default'},
  };

  const handleExport = () => {
    if (!data?.data?.length) return;
    exportCsv(data.data, ['orderNumber', 'market.name', 'totalAmount', 'status', 'createdAt'], 'orders');
    enqueueSnackbar('Orders exported to CSV', { variant: 'info' });
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeader
        title="Incoming Orders"
        subtitle="Review and process orders from markets"
        breadcrumbs={[{ label: 'Dashboard', href: '/supplier/dashboard' }, { label: 'Orders' }]}
        actions={
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport} disabled={!data?.data?.length}>
            Export CSV
          </Button>
        }
      />

      {/* Status tabs */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {STATUS_TABS.map(s => (
          <Button
            key={s}
            variant={status === s ? 'contained' : 'outlined'}
            size="small"
            onClick={() => { setStatus(s); setPage(1); }}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem' }}
          >
            {s || 'All'}
          </Button>
        ))}
      </Box>

      <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Market</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? Array.from({length:6}).map((_,i)=>(
                <TableRow key={i}>{Array.from({length:6}).map((_,j)=><TableCell key={j}><Skeleton/></TableCell>)}</TableRow>
              )) : data?.data?.length === 0 ? (
                <TableRow><TableCell colSpan={6}><EmptyState icon={AssignmentIcon} title="No orders here" description={`No ${status.toLowerCase() || ''} orders at the moment.`}/></TableCell></TableRow>
              ) : data?.data?.map((order: any) => {
                const chip = STATUS_CHIP[order.status] || {label:order.status, color:'default' as const};
                return (
                  <TableRow key={order.id}>
                    <TableCell><Typography variant="body2" sx={{fontFamily:'monospace',fontWeight:600,color:'primary.main'}}>{order.orderNumber}</Typography></TableCell>
                    <TableCell>
                      <Box sx={{display:'flex',alignItems:'center',gap:1}}>
                        <Avatar sx={{width:30,height:30,bgcolor:alpha('#1B4FD8',0.1),color:'primary.main',fontSize:'0.8125rem',fontWeight:700}}>{order.market?.name?.[0]}</Avatar>
                        <Typography variant="body2" fontWeight={500}>{order.market?.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right"><Typography variant="body2" fontWeight={600}>{Number(order.totalAmount).toLocaleString()} <Typography component="span" variant="caption" color="text.secondary">UZS</Typography></Typography></TableCell>
                    <TableCell><Chip label={chip.label} color={chip.color} size="small"/></TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{format(new Date(order.createdAt),'dd MMM, HH:mm')}</Typography></TableCell>
                    <TableCell align="center">
                      <Box sx={{display:'flex',gap:0.75,justifyContent:'center'}}>
                        {order.status === 'SUBMITTED' && (<>
                          <Tooltip title="Confirm order"><Button size="small" variant="contained" color="success" onClick={()=>confirmMut.mutate(order.id)} disabled={confirmMut.isPending} sx={{minWidth:0,px:1.5,py:0.5}}><CheckCircleIcon fontSize="small"/></Button></Tooltip>
                          <Tooltip title="Reject order"><Button size="small" variant="outlined" color="error" onClick={()=>handleRejectOpen(order.id)} sx={{minWidth:0,px:1.5,py:0.5}}><CancelIcon fontSize="small"/></Button></Tooltip>
                        </>)}
                        {order.status === 'CONFIRMED' && (
                          <Tooltip title="Mark dispatched"><Button size="small" variant="contained" color="secondary" onClick={()=>dispatchMut.mutate(order.id)} disabled={dispatchMut.isPending} startIcon={<LocalShippingIcon fontSize="small"/>} sx={{fontSize:'0.75rem'}}>Dispatch</Button></Tooltip>
                        )}
                        <Tooltip title="View details"><Button component={Link} href={`/supplier/orders/${order.id}`} size="small" variant="outlined" sx={{minWidth:0,px:1.5,py:0.5}}><VisibilityIcon fontSize="small"/></Button></Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {data?.pagination && data.pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={data.pagination.totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" />
        </Box>
      )}
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onClose={()=>setRejectDialog({open:false,orderId:''})} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Order</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{mb:2}}>Please provide a reason for rejection. The market will be notified immediately.</DialogContentText>
          <TextField autoFocus fullWidth multiline rows={3} label="Rejection Reason" value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="Explain why this order is being rejected..." helperText={`${rejectReason.length}/5 minimum characters`}/>
        </DialogContent>
        <DialogActions sx={{px:3,pb:2.5}}>
          <Button onClick={()=>setRejectDialog({open:false,orderId:''})}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleRejectConfirm} disabled={rejectReason.length<5||rejectMut.isPending}>Confirm Rejection</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
