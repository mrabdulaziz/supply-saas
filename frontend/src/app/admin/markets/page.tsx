'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketsApi } from '../../../lib/api';
import { format } from 'date-fns';
import {
  Box, Card, Typography, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Avatar, Skeleton, Tooltip, alpha,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, Tab, Tabs
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import StoreIcon from '@mui/icons-material/Store';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import VerifiedIcon from '@mui/icons-material/Verified';
import DescriptionIcon from '@mui/icons-material/Description';

const STATUS_CONFIG: Record<string, { label: string; color: 'warning'|'success'|'error'; icon: React.ElementType }> = {
  PENDING:   { label: 'Pending',   color: 'warning', icon: HourglassEmptyIcon },
  APPROVED:  { label: 'Approved',  color: 'success', icon: VerifiedIcon       },
  SUSPENDED: { label: 'Suspended', color: 'error',   icon: BlockIcon          },
};

export default function AdminMarketsPage() {
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(1);
  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });
  const [suspendReason, setSuspendReason] = useState('');
  const qc = useQueryClient();

  const STATUS_TABS = ['PENDING', 'APPROVED', 'SUSPENDED', ''];
  const currentStatus = STATUS_TABS[tab];

  const { data, isLoading } = useQuery({
    queryKey: ['admin-markets', currentStatus, page],
    queryFn: () => marketsApi.list({ status: currentStatus || undefined, page, limit: 20 }).then(r => r.data),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => marketsApi.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-markets'] }),
  });

  const suspendMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => marketsApi.suspend(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-markets'] }); setSuspendDialog({ open: false, id: '', name: '' }); setSuspendReason(''); },
  });

  const markets = data?.data || [];
  const pagination = data?.pagination;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} mb={0.5}>Markets</Typography>
        <Typography variant="body2" color="text.secondary">Manage market registrations and approvals</Typography>
      </Box>

      {/* Summary chips */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Pending Review', color: '#D97706', bg: '#FFFBEB' },
          { label: 'Approved',       color: '#059669', bg: '#ECFDF5' },
          { label: 'Suspended',      color: '#DC2626', bg: '#FEF2F2' },
        ].map(s => (
          <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, bgcolor: s.bg, color: s.color, px: 2, py: 0.75, borderRadius: 2, border: `1px solid ${alpha(s.color, 0.2)}` }}>
            <StoreIcon sx={{ fontSize: 15 }} />
            <Typography variant="caption" fontWeight={600}>{s.label}</Typography>
          </Box>
        ))}
      </Box>

      <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3 }}>
        {/* Tabs */}
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(1); }} sx={{ px: 2, borderBottom: '1px solid #E2E8F0' }}>
          {['Pending', 'Approved', 'Suspended', 'All'].map((label, i) => (
            <Tab key={i} label={label} sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' }} />
          ))}
        </Tabs>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Market</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Tax ID</TableCell>
                <TableCell>Documents</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Registered</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
              )) : markets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <StoreIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">No {currentStatus?.toLowerCase() || ''} markets</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : markets.map((m: any) => {
                const cfg = STATUS_CONFIG[m.status];
                const StatusIcon = cfg?.icon || StoreIcon;
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: alpha('#1B4FD8', 0.1), color: 'primary.main', fontWeight: 700 }}>
                          {m.name?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{m.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{m.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{m.phone}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 160 }} noWrap>{m.address}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{m.taxId || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      {m._count?.documents > 0 ? (
                        <Chip icon={<DescriptionIcon />} label={`${m._count.documents} docs`} size="small" color="info" variant="outlined" />
                      ) : (
                        <Typography variant="caption" color="text.disabled">No docs</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {cfg && <Chip icon={<StatusIcon />} label={cfg.label} color={cfg.color} size="small" />}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{format(new Date(m.createdAt), 'dd MMM yyyy')}</Typography>
                      {m.approvedBy && <Typography variant="caption" color="text.disabled" display="block">by {m.approvedBy.username}</Typography>}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'center' }}>
                        {(m.status === 'PENDING' || m.status === 'SUSPENDED') && (
                          <Tooltip title="Approve market">
                            <Button size="small" variant="contained" color="success" onClick={() => approveMut.mutate(m.id)} disabled={approveMut.isPending} startIcon={<CheckCircleIcon fontSize="small" />} sx={{ fontSize: '0.75rem' }}>
                              Approve
                            </Button>
                          </Tooltip>
                        )}
                        {m.status !== 'SUSPENDED' && (
                          <Tooltip title="Suspend market">
                            <Button size="small" variant="outlined" color="error" onClick={() => { setSuspendDialog({ open: true, id: m.id, name: m.name }); setSuspendReason(''); }} startIcon={<BlockIcon fontSize="small" />} sx={{ fontSize: '0.75rem' }}>
                              {m.status === 'PENDING' ? 'Reject' : 'Suspend'}
                            </Button>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0' }}>
            <Typography variant="caption" color="text.secondary">{pagination.total} total markets</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" disabled={page === 1} onClick={() => setPage(p => p - 1)} variant="outlined" sx={{ minWidth: 0, px: 2 }}>Prev</Button>
              <Typography variant="body2" sx={{ px: 1, display: 'flex', alignItems: 'center' }}>Page {page} / {pagination.totalPages}</Typography>
              <Button size="small" disabled={!pagination.hasMore} onClick={() => setPage(p => p + 1)} variant="outlined" sx={{ minWidth: 0, px: 2 }}>Next</Button>
            </Box>
          </Box>
        )}
      </Card>

      {/* Suspend dialog */}
      <Dialog open={suspendDialog.open} onClose={() => setSuspendDialog({ open: false, id: '', name: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>Suspend / Reject Market</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Suspending <strong>{suspendDialog.name}</strong> will prevent them from placing orders. Please provide a reason.
          </DialogContentText>
          <TextField autoFocus fullWidth multiline rows={3} label="Reason" value={suspendReason} onChange={e => setSuspendReason(e.target.value)} placeholder="Explain the reason for suspension..." />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setSuspendDialog({ open: false, id: '', name: '' })}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => suspendMut.mutate({ id: suspendDialog.id, reason: suspendReason })} disabled={suspendMut.isPending}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
