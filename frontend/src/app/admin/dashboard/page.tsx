'use client';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../lib/api';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Skeleton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, Button, alpha
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StoreIcon from '@mui/icons-material/Store';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PeopleIcon from '@mui/icons-material/People';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { format } from 'date-fns';
import Link from 'next/link';

const STATUS_CHIP: Record<string, { label: string; color: 'default'|'info'|'warning'|'secondary'|'success'|'error' }> = {
  DRAFT:{label:'Draft',color:'default'}, SUBMITTED:{label:'Submitted',color:'info'},
  CONFIRMED:{label:'Confirmed',color:'warning'}, IN_TRANSIT:{label:'In Transit',color:'secondary'},
  DELIVERED:{label:'Delivered',color:'success'}, CLOSED:{label:'Closed',color:'default'},
  REJECTED:{label:'Rejected',color:'error'},
};

const STATS = [
  {key:'totalOrders',label:'Total Orders',icon:TrendingUpIcon,gradient:'linear-gradient(135deg,#1B4FD8,#3B82F6)',shadow:'rgba(27,79,216,0.3)'},
  {key:'totalSuppliers',label:'Active Suppliers',icon:LocalShippingIcon,gradient:'linear-gradient(135deg,#059669,#10B981)',shadow:'rgba(5,150,105,0.3)'},
  {key:'totalMarkets',label:'Approved Markets',icon:StoreIcon,gradient:'linear-gradient(135deg,#7C3AED,#8B5CF6)',shadow:'rgba(124,58,237,0.3)'},
  {key:'totalUsers',label:'Active Users',icon:PeopleIcon,gradient:'linear-gradient(135deg,#D97706,#F59E0B)',shadow:'rgba(217,119,6,0.3)'},
];

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.dashboard().then(r => r.data.data),
  });

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} mb={0.5}>Platform Dashboard</Typography>
        <Typography variant="body2" color="text.secondary">{format(new Date(), 'EEEE, MMMM d, yyyy')} · Real-time overview</Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {STATS.map(s => {
          const Icon = s.icon;
          return (
            <Grid item xs={12} sm={6} lg={3} key={s.key}>
              <Card elevation={0} sx={{ border:'1px solid #E2E8F0', borderRadius:3 }}>
                <CardContent sx={{ p:3 }}>
                  <Box sx={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                    <Box>
                      <Typography variant="overline" color="text.secondary" display="block" mb={0.5}>{s.label}</Typography>
                      {isLoading ? <Skeleton width={80} height={44}/> : <Typography variant="h3" fontWeight={700} lineHeight={1}>{data?.[s.key] ?? '—'}</Typography>}
                    </Box>
                    <Box sx={{ width:52, height:52, borderRadius:2.5, background:s.gradient, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 6px 16px ${s.shadow}` }}>
                      <Icon sx={{ color:'#fff', fontSize:24 }}/>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Card elevation={0} sx={{ border:'1px solid #E2E8F0', borderRadius:3 }}>
        <Box sx={{ px:3, py:2.5, display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #E2E8F0' }}>
          <Box>
            <Typography variant="h6">Recent Orders</Typography>
            <Typography variant="caption" color="text.secondary">Latest activity across the platform</Typography>
          </Box>
          <Button component={Link} href="/admin/audit-logs" endIcon={<ArrowForwardIcon fontSize="small"/>} size="small">View all</Button>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell><TableCell>Market</TableCell><TableCell>Supplier</TableCell>
                <TableCell>Status</TableCell><TableCell align="right">Amount</TableCell><TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? Array.from({length:6}).map((_,i)=>(
                <TableRow key={i}>{Array.from({length:6}).map((_,j)=><TableCell key={j}><Skeleton/></TableCell>)}</TableRow>
              )) : data?.recentOrders?.map((o:any) => {
                const chip = STATUS_CHIP[o.status] || {label:o.status, color:'default' as const};
                return (
                  <TableRow key={o.id}>
                    <TableCell><Typography variant="body2" sx={{fontFamily:'monospace',fontWeight:600,color:'primary.main'}}>{o.orderNumber}</Typography></TableCell>
                    <TableCell><Box sx={{display:'flex',alignItems:'center',gap:1}}><Avatar sx={{width:28,height:28,bgcolor:alpha('#059669',0.12),color:'success.main',fontSize:'0.75rem',fontWeight:700}}>{o.market?.name?.[0]}</Avatar><Typography variant="body2">{o.market?.name}</Typography></Box></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{o.supplier?.name}</Typography></TableCell>
                    <TableCell><Chip label={chip.label} color={chip.color} size="small"/></TableCell>
                    <TableCell align="right"><Typography variant="body2" fontWeight={600}>{Number(o.totalAmount).toLocaleString()} <Typography component="span" variant="caption" color="text.secondary">UZS</Typography></Typography></TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{format(new Date(o.createdAt),'dd MMM, HH:mm')}</Typography></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
