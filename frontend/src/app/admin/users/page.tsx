'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../lib/api';
import { format } from 'date-fns';
import {
  Box, Card, Typography, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Avatar, Skeleton, IconButton, Tooltip, alpha,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
  Select, MenuItem, Switch, FormControlLabel, InputAdornment, TextField
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';

const ROLE_CONFIG: Record<string, { color: string; bg: string }> = {
  SUPER_ADMIN:    { color: '#7C3AED', bg: '#F5F3FF' },
  SUPPLIER_ADMIN: { color: '#1B4FD8', bg: '#EFF6FF' },
  SUPPLIER_STAFF: { color: '#2563EB', bg: '#DBEAFE' },
  MARKET_ADMIN:   { color: '#059669', bg: '#ECFDF5' },
  MARKET_STAFF:   { color: '#10B981', bg: '#D1FAE5' },
};

function EditUserDialog({ user, onClose }: { user: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ isActive: user.isActive, role: user.role });

  const updateMut = useMutation({
    mutationFn: () => adminApi.updateUser(user.id, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); onClose(); },
  });

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>Edit User</DialogTitle>
      <DialogContent sx={{ pt: '12px !important', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2 }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: ROLE_CONFIG[user.role]?.bg, color: ROLE_CONFIG[user.role]?.color, fontWeight: 700 }}>
            {user.username[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle2">{user.username}</Typography>
            <Typography variant="caption" color="text.secondary">{user.phone}</Typography>
          </Box>
        </Box>

        <FormControl size="small" fullWidth>
          <InputLabel>Role</InputLabel>
          <Select label="Role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            {['SUPER_ADMIN', 'SUPPLIER_ADMIN', 'SUPPLIER_STAFF', 'MARKET_ADMIN', 'MARKET_STAFF'].map(r => (
              <MenuItem key={r} value={r}>{r.replace(/_/g, ' ')}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={<Switch checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} color="success" />}
          label={<Typography variant="body2">{form.isActive ? 'Account Active' : 'Account Disabled'}</Typography>}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => updateMut.mutate()} disabled={updateMut.isPending}>Save Changes</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: () => adminApi.users({ page, limit: 25 }).then(r => r.data),
  });

  const users = data?.data || [];
  const pagination = data?.pagination;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} mb={0.5}>Users</Typography>
          <Typography variant="body2" color="text.secondary">
            {pagination?.total ?? '—'} platform accounts
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: alpha('#1B4FD8', 0.07), px: 2, py: 1, borderRadius: 2 }}>
          <PeopleIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography variant="body2" color="primary.main" fontWeight={600}>{pagination?.total ?? '—'} total users</Typography>
        </Box>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Role</TableCell>
                <TableCell align="center">Phone</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
              )) : users.map((u: any) => {
                const rc = ROLE_CONFIG[u.role] || { color: '#64748B', bg: '#F8FAFC' };
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: rc.bg, color: rc.color, fontWeight: 700, fontSize: '0.875rem' }}>
                          {u.username[0].toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{u.username}</Typography>
                          <Typography variant="caption" color="text.secondary">{u.email || '—'}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{u.phone}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={u.role.replace(/_/g, ' ')}
                        size="small"
                        sx={{ bgcolor: rc.bg, color: rc.color, fontWeight: 600, border: `1px solid ${alpha(rc.color, 0.2)}` }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={u.phoneVerified ? 'Verified' : 'Not verified'}>
                        {u.phoneVerified
                          ? <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                          : <CancelIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                        }
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, bgcolor: u.isActive ? alpha('#059669', 0.1) : alpha('#DC2626', 0.1), px: 1.5, py: 0.5, borderRadius: 5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: u.isActive ? 'success.main' : 'error.main' }} />
                        <Typography variant="caption" fontWeight={600} color={u.isActive ? 'success.dark' : 'error.dark'}>
                          {u.isActive ? 'Active' : 'Disabled'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{format(new Date(u.createdAt), 'dd MMM yyyy')}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit user">
                        <IconButton size="small" onClick={() => setEditing(u)} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {pagination && pagination.totalPages > 1 && (
          <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0' }}>
            <Typography variant="caption" color="text.secondary">{pagination.total} users</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" disabled={page === 1} onClick={() => setPage(p => p - 1)} variant="outlined" sx={{ minWidth: 0, px: 2 }}>Prev</Button>
              <Typography variant="body2" sx={{ px: 1, display: 'flex', alignItems: 'center' }}>Page {page} / {pagination.totalPages}</Typography>
              <Button size="small" disabled={!pagination.hasMore} onClick={() => setPage(p => p + 1)} variant="outlined" sx={{ minWidth: 0, px: 2 }}>Next</Button>
            </Box>
          </Box>
        )}
      </Card>

      {editing && <EditUserDialog user={editing} onClose={() => setEditing(null)} />}
    </Box>
  );
}
