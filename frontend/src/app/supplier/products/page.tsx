'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../../../lib/api';
import { useAuthStore } from '../../../stores/auth.store';
import { format } from 'date-fns';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Skeleton, Avatar, alpha, Pagination,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select,
  MenuItem, FormControl, InputLabel, InputAdornment, Chip, Tooltip,
  IconButton, Grid, LinearProgress, FormHelperText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TuneIcon from '@mui/icons-material/Tune';
import DownloadIcon from '@mui/icons-material/Download';
import { PageHeader } from '../../../components/ui/PageHeader';
import { EmptyState } from '../../../components/ui/EmptyState';
import { exportCsv } from '../../../lib/exportCsv';
import { useSnackbar } from 'notistack';

const UNITS = ['kg', 'g', 'litre', 'ml', 'piece', 'box', 'pack', 'set', 'pair', 'roll', 'sheet'];

// ─── Stock chip ────────────────────────────────────────────────

function StockChip({ qty, low = 50 }: { qty: number; low?: number }) {
  if (qty === 0) return <Chip label="Out of stock" color="error" size="small" icon={<ErrorOutlineIcon />} />;
  if (qty < low) return <Chip label={`Low: ${qty}`} color="warning" size="small" icon={<WarningAmberIcon />} />;
  return <Chip label={qty.toString()} color="success" size="small" icon={<CheckCircleIcon />} variant="outlined" />;
}

// ─── Product Dialog ────────────────────────────────────────────

function ProductDialog({
  open, onClose, product, supplierId,
}: { open: boolean; onClose: () => void; product?: any; supplierId: string }) {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    description: product?.description || '',
    unit: product?.unit || 'kg',
    price: product?.price?.toString() || '',
    stockQty: product?.stockQty?.toString() ?? '0',
    minOrderQty: product?.minOrderQty?.toString() ?? '1',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string, val: string) => {
    setForm(f => ({ ...f, [field]: val }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.sku.trim()) errs.sku = 'Required';
    if (!form.price || Number(form.price) <= 0) errs.price = 'Must be > 0';
    return errs;
  };

  const saveMut = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        supplierId,
        price: Number(form.price),
        stockQty: parseInt(form.stockQty) || 0,
        minOrderQty: parseInt(form.minOrderQty) || 1,
      };
      return product ? productsApi.update(product.id, payload) : productsApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier-products'] });
      enqueueSnackbar(product ? 'Product updated' : 'Product created', { variant: 'success' });
      onClose();
    },
    onError: (err: any) => enqueueSnackbar(err?.response?.data?.message || 'Failed to save', { variant: 'error' }),
  });

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    saveMut.mutate();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>{product ? 'Edit Product' : 'New Product'}</DialogTitle>
      <DialogContent sx={{ pt: '12px !important' }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField fullWidth label="Product Name *" value={form.name} onChange={e => set('name', e.target.value)}
              error={!!errors.name} helperText={errors.name} size="small" />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="SKU *" value={form.sku} onChange={e => set('sku', e.target.value)}
              error={!!errors.sku} helperText={errors.sku} size="small"
              inputProps={{ style: { fontFamily: 'monospace' } }} />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Unit *</InputLabel>
              <Select label="Unit *" value={form.unit} onChange={e => set('unit', e.target.value)}>
                {UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Price (UZS) *" type="number" value={form.price}
              onChange={e => set('price', e.target.value)} error={!!errors.price} helperText={errors.price}
              size="small" inputProps={{ min: 0, step: 100 }} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Stock Qty" type="number" value={form.stockQty}
              onChange={e => set('stockQty', e.target.value)} size="small" inputProps={{ min: 0 }} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Min Order Qty" type="number" value={form.minOrderQty}
              onChange={e => set('minOrderQty', e.target.value)} size="small" inputProps={{ min: 1 }} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Description" value={form.description}
              onChange={e => set('description', e.target.value)} multiline rows={2} size="small" />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saveMut.isPending}>
          {saveMut.isPending ? 'Saving...' : product ? 'Update' : 'Create Product'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Stock Dialog ──────────────────────────────────────────────

function StockDialog({ open, onClose, product }: { open: boolean; onClose: () => void; product: any }) {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [qty, setQty] = useState(product?.stockQty?.toString() ?? '0');

  const updateMut = useMutation({
    mutationFn: () => productsApi.updateStock(product.id, parseInt(qty)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier-products'] });
      enqueueSnackbar('Stock updated', { variant: 'success' });
      onClose();
    },
    onError: () => enqueueSnackbar('Failed to update stock', { variant: 'error' }),
  });

  if (!product) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Update Stock</DialogTitle>
      <DialogContent sx={{ pt: '12px !important' }}>
        <Typography variant="body2" color="text.secondary" mb={2}>
          <strong>{product.name}</strong> <Typography component="span" variant="caption" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>({product.sku})</Typography>
        </Typography>
        <TextField fullWidth label={`New Quantity (${product.unit})`} type="number"
          value={qty} onChange={e => setQty(e.target.value)} inputProps={{ min: 0 }} autoFocus />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => updateMut.mutate()} disabled={updateMut.isPending}>
          {updateMut.isPending ? 'Saving...' : 'Update Stock'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Products Page ─────────────────────────────────────────────

export default function SupplierProductsPage() {
  const { user } = useAuthStore();
  const { enqueueSnackbar } = useSnackbar();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [productDialog, setProductDialog] = useState<{ open: boolean; product?: any }>({ open: false });
  const [stockDialog, setStockDialog] = useState<{ open: boolean; product?: any }>({ open: false });

  const { data, isLoading } = useQuery({
    queryKey: ['supplier-products', page, search],
    queryFn: () => productsApi.list({
      supplierId: user?.supplierId,
      search: search || undefined,
      page,
      limit: 20,
    }).then(r => r.data),
    enabled: !!user?.supplierId,
  });

  const products: any[] = data?.data || [];
  const pagination = data?.pagination;

  const lowStock = products.filter(p => p.stockQty > 0 && p.stockQty < 50).length;
  const outOfStock = products.filter(p => p.stockQty === 0).length;
  const activeCount = products.filter(p => p.isActive).length;

  const handleExport = () => {
    if (!products.length) return;
    exportCsv(products, ['name', 'sku', 'unit', 'price', 'stockQty', 'minOrderQty'], 'products');
    enqueueSnackbar('Exported to CSV', { variant: 'info' });
  };

  const kpis = [
    { label: 'Total Products', value: pagination?.total ?? products.length, color: '#1B4FD8', bg: alpha('#1B4FD8', 0.08) },
    { label: 'Active', value: activeCount, color: '#059669', bg: alpha('#059669', 0.08) },
    { label: 'Low Stock', value: lowStock, color: '#D97706', bg: alpha('#D97706', 0.08) },
    { label: 'Out of Stock', value: outOfStock, color: '#DC2626', bg: alpha('#DC2626', 0.08) },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeader
        title="Products"
        subtitle="Manage your product catalog, pricing and inventory"
        breadcrumbs={[{ label: 'Dashboard', href: '/supplier/dashboard' }, { label: 'Products' }]}
        actions={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport} disabled={!products.length}>
              Export
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setProductDialog({ open: true })}>
              Add Product
            </Button>
          </Box>
        }
      />

      {/* KPI row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpis.map(k => (
          <Grid item xs={6} sm={3} key={k.label}>
            <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, bgcolor: k.bg }}>
              <CardContent sx={{ p: '16px !important' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>{k.label}</Typography>
                <Typography variant="h4" fontWeight={700} sx={{ color: k.color, lineHeight: 1.2, mt: 0.5 }}>
                  {isLoading ? <Skeleton width={40} /> : k.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Search */}
      <Box sx={{ mb: 2 }}>
        <TextField
          placeholder="Search by name or SKU…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          size="small"
          sx={{ width: 320 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
          }}
        />
      </Box>

      {/* Table */}
      <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell align="right">Price (UZS)</TableCell>
                <TableCell align="center">Stock</TableCell>
                <TableCell align="center">Min Qty</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
              )) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState
                      icon={InventoryIcon}
                      title={search ? 'No products match your search' : 'No products yet'}
                      description={search ? 'Try a different name or SKU.' : 'Add your first product to start receiving orders.'}
                      action={!search ? { label: 'Add Product', onClick: () => setProductDialog({ open: true }) } : undefined}
                    />
                  </TableCell>
                </TableRow>
              ) : products.map((p: any) => (
                <TableRow key={p.id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: alpha('#1B4FD8', 0.1), color: 'primary.main', fontSize: '0.875rem', fontWeight: 700 }}>
                        {p.name[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                        {p.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', bgcolor: '#F1F5F9', px: 1, py: 0.5, borderRadius: 1 }}>
                      {p.sku}
                    </Typography>
                  </TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{p.unit}</Typography></TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>{Number(p.price).toLocaleString()}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ cursor: 'pointer' }} onClick={() => setStockDialog({ open: true, product: p })}>
                      <StockChip qty={p.stockQty} />
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary">{p.minOrderQty}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={p.isActive ? 'Active' : 'Inactive'}
                      color={p.isActive ? 'success' : 'default'}
                      size="small"
                      variant={p.isActive ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="Update stock">
                        <IconButton size="small" onClick={() => setStockDialog({ open: true, product: p })}
                          sx={{ color: 'text.secondary', '&:hover': { color: 'warning.main' } }}>
                          <TuneIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit product">
                        <IconButton size="small" onClick={() => setProductDialog({ open: true, product: p })}
                          sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {pagination && pagination.totalPages > 1 && (
          <Box sx={{ px: 2, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0' }}>
            <Typography variant="caption" color="text.secondary">{pagination.total} products total</Typography>
            <Pagination count={pagination.totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" size="small" />
          </Box>
        )}
      </Card>

      <ProductDialog
        open={productDialog.open}
        onClose={() => setProductDialog({ open: false })}
        product={productDialog.product}
        supplierId={user?.supplierId!}
      />
      <StockDialog
        open={stockDialog.open}
        onClose={() => setStockDialog({ open: false })}
        product={stockDialog.product}
      />
    </Box>
  );
}
