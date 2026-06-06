'use client';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { productsApi, ordersApi, api } from '../../../lib/api';
import { useCartStore } from '../../../stores/cart.store';
import {
  Box, Grid, Card, CardContent, CardActions, Typography, Button, TextField,
  InputAdornment, Drawer, Divider, Chip, Avatar, Skeleton, alpha, Pagination,
  Badge, IconButton, FormControl, InputLabel, Select, MenuItem,
  Tooltip, Stack, Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { PageHeader } from '../../../components/ui/PageHeader';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useSnackbar } from 'notistack';

// ─── Product Card ─────────────────────────────────────────────

function ProductCard({ product }: { product: any }) {
  const { items, addItem, updateQty } = useCartStore();
  const cartItem = items.find(i => i.productId === product.id);
  const inStock = product.stockQty > 0;
  const isLow = product.stockQty > 0 && product.stockQty < 20;

  return (
    <Card elevation={0} sx={{
      border: '1px solid #E2E8F0', borderRadius: 3, height: '100%', display: 'flex',
      flexDirection: 'column', opacity: inStock ? 1 : 0.6,
      transition: 'box-shadow 0.2s, transform 0.2s',
      '&:hover': inStock ? { boxShadow: '0 8px 24px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' } : {},
    }}>
      <Box sx={{
        height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, ${alpha('#1B4FD8', 0.06)} 0%, ${alpha('#7C3AED', 0.08)} 100%)`,
        position: 'relative',
      }}>
        <InventoryIcon sx={{ fontSize: 48, color: alpha('#1B4FD8', 0.25) }} />
        {isLow && <Chip label="Low stock" color="warning" size="small" sx={{ position: 'absolute', top: 8, right: 8, fontSize: '0.7rem' }} />}
        {!inStock && <Chip label="Out of stock" color="error" size="small" sx={{ position: 'absolute', top: 8, right: 8, fontSize: '0.7rem' }} />}
        {product.category && <Chip label={product.category.name} size="small" sx={{ position: 'absolute', top: 8, left: 8, fontSize: '0.7rem', bgcolor: 'white', border: '1px solid #E2E8F0' }} />}
      </Box>

      <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.25, lineHeight: 1.3 }} noWrap title={product.name}>
          {product.name}
        </Typography>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.disabled', mb: 0.5 }}>{product.sku}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
          <LocalShippingIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.secondary" noWrap>{product.supplier?.name}</Typography>
        </Box>
        <Box sx={{ mt: 'auto' }}>
          <Typography variant="h6" fontWeight={800} sx={{ color: 'primary.main', lineHeight: 1 }}>
            {Number(product.price).toLocaleString()}
            <Typography component="span" variant="caption" color="text.secondary" fontWeight={400}> UZS/{product.unit}</Typography>
          </Typography>
          <Typography variant="caption" color="text.disabled">Min order: {product.minOrderQty} {product.unit}</Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        {!cartItem ? (
          <Button fullWidth variant="contained" size="small" startIcon={<AddIcon />} disabled={!inStock}
            onClick={() => addItem({
              productId: product.id, productName: product.name, sku: product.sku,
              unit: product.unit, price: Number(product.price), minOrderQty: product.minOrderQty,
              stockQty: product.stockQty, supplierId: product.supplierId, supplierName: product.supplier?.name,
            })}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            {inStock ? 'Add to Cart' : 'Out of Stock'}
          </Button>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <IconButton size="small" sx={{ border: '1px solid #E2E8F0', borderRadius: 1.5 }}
              onClick={() => updateQty(product.id, cartItem.quantity - product.minOrderQty)}>
              {cartItem.quantity <= product.minOrderQty ? <DeleteOutlineIcon fontSize="small" color="error" /> : <RemoveIcon fontSize="small" />}
            </IconButton>
            <Typography variant="body2" fontWeight={700} sx={{ flex: 1, textAlign: 'center' }}>{cartItem.quantity}</Typography>
            <IconButton size="small" sx={{ border: '1px solid #E2E8F0', borderRadius: 1.5 }}
              onClick={() => updateQty(product.id, Math.min(cartItem.quantity + product.minOrderQty, product.stockQty))}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </CardActions>
    </Card>
  );
}

// ─── Cart Drawer ──────────────────────────────────────────────

function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, updateQty, clear, total, supplierId, supplierName } = useCartStore();
  const [notes, setNotes] = useState('');
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const createOrder = useMutation({
    mutationFn: async () => {
      const res = await ordersApi.create({
        supplierId: supplierId!,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        notes: notes || undefined,
      });
      await ordersApi.submit(res.data.data.id);
      return res;
    },
    onSuccess: () => {
      clear();
      onClose();
      enqueueSnackbar('Order placed successfully!', { variant: 'success' });
      router.push('/market/orders');
    },
    onError: (err: any) => enqueueSnackbar(err?.response?.data?.message || 'Order failed', { variant: 'error' }),
  });

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>Cart</Typography>
            {supplierName && <Typography variant="caption" color="text.secondary">{supplierName}</Typography>}
          </Box>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2 }}>
          {items.length === 0 ? (
            <EmptyState icon={ShoppingCartIcon} title="Cart is empty" description="Browse the catalog and add products to order." />
          ) : (
            <Stack spacing={1.5}>
              {items.map(item => (
                <Card key={item.productId} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, p: 1.5 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: alpha('#1B4FD8', 0.08), color: 'primary.main', fontSize: '0.8rem', fontWeight: 700, borderRadius: 1.5, flexShrink: 0 }}>
                      {item.productName[0]}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{item.productName}</Typography>
                      <Typography variant="caption" color="text.secondary">{Number(item.price).toLocaleString()} UZS / {item.unit}</Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: 'primary.main', fontWeight: 700 }}>
                        {(item.price * item.quantity).toLocaleString()} UZS
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                    <IconButton size="small" sx={{ border: '1px solid #E2E8F0', borderRadius: 1 }}
                      onClick={() => updateQty(item.productId, item.quantity - item.minOrderQty)}>
                      {item.quantity <= item.minOrderQty ? <DeleteOutlineIcon fontSize="small" color="error" /> : <RemoveIcon fontSize="small" />}
                    </IconButton>
                    <Typography variant="body2" fontWeight={700} sx={{ flex: 1, textAlign: 'center' }}>{item.quantity}</Typography>
                    <IconButton size="small" sx={{ border: '1px solid #E2E8F0', borderRadius: 1 }}
                      onClick={() => updateQty(item.productId, Math.min(item.quantity + item.minOrderQty, item.stockQty))}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Card>
              ))}
            </Stack>
          )}
        </Box>

        {items.length > 0 && (
          <Box sx={{ borderTop: '1px solid #E2E8F0', px: 2, py: 2.5 }}>
            <TextField fullWidth multiline rows={2} size="small" label="Order notes (optional)"
              value={notes} onChange={e => setNotes(e.target.value)} sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Order Total</Typography>
                <Typography variant="h5" fontWeight={800} color="primary.main">
                  {total().toLocaleString()} <Typography component="span" variant="caption" color="text.secondary">UZS</Typography>
                </Typography>
              </Box>
              <Button variant="contained" size="large" startIcon={<CheckCircleIcon />}
                onClick={() => createOrder.mutate()} disabled={createOrder.isPending} sx={{ borderRadius: 2, px: 3 }}>
                {createOrder.isPending ? 'Placing…' : 'Place Order'}
              </Button>
            </Box>
            <Button fullWidth variant="text" color="inherit" size="small" onClick={clear} sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>
              Clear cart
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}

// ─── Catalog Page ─────────────────────────────────────────────

export default function CatalogPage() {
  const [search, setSearch] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [page, setPage] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const { items, itemCount, total } = useCartStore();

  const { data, isLoading } = useQuery({
    queryKey: ['catalog', search, supplierId, page],
    queryFn: () => productsApi.list({
      search: search || undefined,
      supplierId: supplierId || undefined,
      page,
      limit: 24,
    }).then(r => r.data),
    placeholderData: (prev: any) => prev,
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: () => api.get('/suppliers').then(r => r.data),
  });

  const products: any[] = data?.data || [];
  const pagination = data?.pagination;
  const cartCount = itemCount();

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeader
        title="Product Catalog"
        subtitle="Browse and order from your approved suppliers"
        breadcrumbs={[{ label: 'Dashboard', href: '/market/dashboard' }, { label: 'Catalog' }]}
        actions={
          <Badge badgeContent={cartCount} color="error" max={99}>
            <Button variant={cartCount > 0 ? 'contained' : 'outlined'} startIcon={<ShoppingCartIcon />}
              onClick={() => setCartOpen(true)} sx={{ minWidth: 120 }}>
              {cartCount > 0 ? `${total().toLocaleString()} UZS` : 'Cart'}
            </Button>
          </Badge>
        }
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search products…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          size="small" sx={{ width: 280 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Supplier</InputLabel>
          <Select label="Supplier" value={supplierId} onChange={e => { setSupplierId(e.target.value); setPage(1); }}>
            <MenuItem value=""><em>All Suppliers</em></MenuItem>
            {suppliersData?.data?.map((s: any) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </Select>
        </FormControl>
        {pagination && <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>{pagination.total} products</Typography>}
      </Box>

      {isLoading ? (
        <Grid container spacing={2.5}>
          {Array.from({ length: 12 }).map((_, i) => (
            <Grid item key={i} xs={6} sm={4} md={3} lg={2.4}>
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : products.length === 0 ? (
        <EmptyState icon={InventoryIcon} title="No products found" description="Try adjusting your filters or search query." />
      ) : (
        <Grid container spacing={2.5}>
          {products.map((p: any) => (
            <Grid item key={p.id} xs={6} sm={4} md={3} lg={2.4}>
              <ProductCard product={p} />
            </Grid>
          ))}
        </Grid>
      )}

      {pagination && pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination count={pagination.totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" />
        </Box>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </Box>
  );
}
