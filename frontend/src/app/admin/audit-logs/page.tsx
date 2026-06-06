'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../lib/api';
import { format } from 'date-fns';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Avatar, Skeleton, Chip, alpha, TextField, InputAdornment, Select, MenuItem,
  FormControl, InputLabel, IconButton, Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const ACTION_COLOR: Record<string, { bg: string; color: string }> = {
  ORDER_SUBMITTED: { bg:'#EFF6FF', color:'#1B4FD8' }, ORDER_CONFIRMED: { bg:'#FFFBEB', color:'#D97706' },
  ORDER_REJECTED:  { bg:'#FEF2F2', color:'#DC2626' }, ORDER_DISPATCHED:{ bg:'#F5F3FF', color:'#7C3AED' },
  ORDER_DELIVERED: { bg:'#ECFDF5', color:'#059669' }, ORDER_CREATED:   { bg:'#F0F9FF', color:'#0891B2' },
  MARKET_APPROVED: { bg:'#ECFDF5', color:'#059669' }, MARKET_SUSPENDED:{ bg:'#FEF2F2', color:'#DC2626' },
  PRODUCT_CREATED: { bg:'#F0FDF4', color:'#16A34A' }, PRODUCT_UPDATED: { bg:'#FFF7ED', color:'#EA580C' },
};

function LogRow({ log }: { log: any }) {
  const [expanded, setExpanded] = useState(false);
  const ac = ACTION_COLOR[log.action] || { bg:'#F8FAFC', color:'#64748B' };
  const hasPayload = log.oldValue || log.newValue;
  return (
    <>
      <TableRow sx={{ '& td': { borderBottom: expanded ? 'none' : undefined } }}>
        <TableCell><Typography variant="caption" color="text.secondary" sx={{ fontFamily:'monospace', whiteSpace:'nowrap' }}>{format(new Date(log.createdAt),'dd MMM yy HH:mm:ss')}</Typography></TableCell>
        <TableCell>
          <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
            <Avatar sx={{ width:28, height:28, bgcolor:'#F1F5F9', color:'#475569', fontSize:'0.75rem', fontWeight:700 }}>{log.actor?.username?.[0]?.toUpperCase()}</Avatar>
            <Box><Typography variant="body2" fontWeight={500}>{log.actor?.username}</Typography><Typography variant="caption" color="text.secondary">{log.actorRole?.replace(/_/g,' ')}</Typography></Box>
          </Box>
        </TableCell>
        <TableCell><Chip label={log.action} size="small" sx={{ bgcolor:ac.bg, color:ac.color, fontWeight:600, fontFamily:'monospace', fontSize:'0.6875rem', border:`1px solid ${alpha(ac.color,0.2)}` }}/></TableCell>
        <TableCell><Typography variant="body2" color="text.secondary">{log.entityType}</Typography><Typography variant="caption" sx={{ fontFamily:'monospace', color:'text.disabled' }}>{log.entityId?.slice(0,10)}…</Typography></TableCell>
        <TableCell><Typography variant="caption" color="text.disabled">{log.ipAddress||'—'}</Typography></TableCell>
        <TableCell align="center">{hasPayload && <IconButton size="small" onClick={()=>setExpanded(!expanded)}>{expanded?<ExpandLessIcon fontSize="small"/>:<ExpandMoreIcon fontSize="small"/>}</IconButton>}</TableCell>
      </TableRow>
      {expanded && hasPayload && (
        <TableRow><TableCell colSpan={6} sx={{ pb:1.5, pt:0, bgcolor:'#FAFAFA' }}>
          <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2, px:1, pt:1 }}>
            {log.oldValue && <Box><Typography variant="overline" color="text.secondary" display="block" mb={0.5}>Before</Typography><Box sx={{ bgcolor:'#FEF2F2', border:'1px solid #FECACA', borderRadius:1.5, p:1.5, fontFamily:'monospace', fontSize:'0.75rem', color:'#991B1B', whiteSpace:'pre-wrap', wordBreak:'break-all' }}>{JSON.stringify(log.oldValue,null,2)}</Box></Box>}
            {log.newValue && <Box><Typography variant="overline" color="text.secondary" display="block" mb={0.5}>After</Typography><Box sx={{ bgcolor:'#ECFDF5', border:'1px solid #A7F3D0', borderRadius:1.5, p:1.5, fontFamily:'monospace', fontSize:'0.75rem', color:'#065F46', whiteSpace:'pre-wrap', wordBreak:'break-all' }}>{JSON.stringify(log.newValue,null,2)}</Box></Box>}
          </Box>
        </TableCell></TableRow>
      )}
    </>
  );
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, entityType, action],
    queryFn: () => adminApi.auditLogs({ page, limit: 50, entityType: entityType||undefined, action: action||undefined }).then(r => r.data),
  });

  const logs = data?.data || [];
  const pagination = data?.pagination;

  return (
    <Box sx={{ p:{ xs:2, sm:3 } }}>
      <Box sx={{ mb:3 }}>
        <Typography variant="h4" fontWeight={700} mb={0.5}>Audit Logs</Typography>
        <Typography variant="body2" color="text.secondary">Complete history of every action on the platform</Typography>
      </Box>

      <Card elevation={0} sx={{ border:'1px solid #E2E8F0', borderRadius:3, p:2, mb:3, display:'flex', gap:2, flexWrap:'wrap', alignItems:'center' }}>
        <FilterListIcon sx={{ color:'text.secondary' }}/>
        <FormControl size="small" sx={{ minWidth:160 }}>
          <InputLabel>Entity Type</InputLabel>
          <Select label="Entity Type" value={entityType} onChange={e=>{ setEntityType(e.target.value); setPage(1); }}>
            <MenuItem value="">All entities</MenuItem>
            {['Order','Market','Product','Supplier','User'].map(t=><MenuItem key={t} value={t}>{t}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" label="Filter by action" value={action} onChange={e=>{ setAction(e.target.value); setPage(1); }} placeholder="e.g. ORDER_SUBMITTED" sx={{ minWidth:220 }}
          InputProps={{ startAdornment:<InputAdornment position="start"><SearchIcon sx={{ fontSize:18, color:'text.disabled' }}/></InputAdornment> }}/>
        {(entityType||action) && <Button size="small" onClick={()=>{ setEntityType(''); setAction(''); setPage(1); }} color="error" variant="outlined">Clear</Button>}
        <Box sx={{ ml:'auto' }}><Typography variant="caption" color="text.secondary">{pagination?.total??'—'} entries</Typography></Box>
      </Card>

      <Card elevation={0} sx={{ border:'1px solid #E2E8F0', borderRadius:3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell><TableCell>Actor</TableCell><TableCell>Action</TableCell>
                <TableCell>Entity</TableCell><TableCell>IP</TableCell><TableCell align="center">Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? Array.from({length:10}).map((_,i)=>(
                <TableRow key={i}>{Array.from({length:6}).map((_,j)=><TableCell key={j}><Skeleton/></TableCell>)}</TableRow>
              )) : logs.length===0 ? (
                <TableRow><TableCell colSpan={6}><Box sx={{ py:6, textAlign:'center' }}><Typography variant="body2" color="text.secondary">No logs found</Typography></Box></TableCell></TableRow>
              ) : logs.map((log:any)=><LogRow key={log.id} log={log}/>)}
            </TableBody>
          </Table>
        </TableContainer>
        {pagination && pagination.totalPages > 1 && (
          <Box sx={{ px:2, py:1.5, display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:'1px solid #E2E8F0' }}>
            <Typography variant="caption" color="text.secondary">{pagination.total} entries</Typography>
            <Box sx={{ display:'flex', gap:1, alignItems:'center' }}>
              <Button size="small" disabled={page===1} onClick={()=>setPage(p=>p-1)} variant="outlined" sx={{ minWidth:0, px:2 }}>Prev</Button>
              <Typography variant="body2" color="text.secondary">Page {page} / {pagination.totalPages}</Typography>
              <Button size="small" disabled={!pagination.hasMore} onClick={()=>setPage(p=>p+1)} variant="outlined" sx={{ minWidth:0, px:2 }}>Next</Button>
            </Box>
          </Box>
        )}
      </Card>
    </Box>
  );
}
