'use client';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Avatar, Divider, Chip, alpha, Tooltip
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleIcon from '@mui/icons-material/People';
import StoreIcon from '@mui/icons-material/Store';
import DescriptionIcon from '@mui/icons-material/Description';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useAuthStore } from '../../stores/auth.store';

export const DRAWER_WIDTH = 256;

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { label: 'Dashboard',   href: '/admin/dashboard',   icon: DashboardIcon },
    { label: 'Markets',     href: '/admin/markets',      icon: StoreIcon },
    { label: 'Users',       href: '/admin/users',        icon: PeopleIcon },
    { label: 'Audit Logs',  href: '/admin/audit-logs',   icon: DescriptionIcon },
    { label: 'Reports',     href: '/admin/reports',      icon: BarChartIcon },
  ],
  SUPPLIER_ADMIN: [
    { label: 'Dashboard',   href: '/supplier/dashboard', icon: DashboardIcon },
    { label: 'Products',    href: '/supplier/products',  icon: InventoryIcon },
    { label: 'Orders',      href: '/supplier/orders',    icon: AssignmentIcon },
    { label: 'Reports',     href: '/supplier/reports',   icon: BarChartIcon },
  ],
  SUPPLIER_STAFF: [
    { label: 'Dashboard',   href: '/supplier/dashboard', icon: DashboardIcon },
    { label: 'Products',    href: '/supplier/products',  icon: InventoryIcon },
    { label: 'Orders',      href: '/supplier/orders',    icon: AssignmentIcon },
  ],
  MARKET_ADMIN: [
    { label: 'Dashboard',   href: '/market/dashboard',  icon: DashboardIcon },
    { label: 'Catalog',     href: '/market/catalog',    icon: InventoryIcon },
    { label: 'My Orders',   href: '/market/orders',     icon: ShoppingCartIcon },
    { label: 'Account',     href: '/market/account',    icon: SettingsIcon },
  ],
  MARKET_STAFF: [
    { label: 'Dashboard',   href: '/market/dashboard',  icon: DashboardIcon },
    { label: 'Catalog',     href: '/market/catalog',    icon: InventoryIcon },
    { label: 'My Orders',   href: '/market/orders',     icon: ShoppingCartIcon },
  ],
};

const ROLE_META: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN:    { label: 'Platform Admin',    color: '#7C3AED' },
  SUPPLIER_ADMIN: { label: 'Supplier',          color: '#1B4FD8' },
  SUPPLIER_STAFF: { label: 'Supplier Staff',    color: '#2563EB' },
  MARKET_ADMIN:   { label: 'Market',            color: '#059669' },
  MARKET_STAFF:   { label: 'Market Staff',      color: '#10B981' },
};

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function SidebarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const navItems = user ? (NAV_BY_ROLE[user.role] || []) : [];
  const roleMeta = user ? ROLE_META[user.role] : null;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#0F172A' }}>
      {/* Logo */}
      <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: 2,
            background: 'linear-gradient(135deg, #1B4FD8 0%, #0891B2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LocalShippingIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1.2 }}>
              SupplyChain
            </Typography>
            <Typography sx={{ color: '#64748B', fontSize: '0.6875rem', fontWeight: 500 }}>
              Uzbekistan
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* User card */}
      {user && (
        <Box sx={{ px: 2, py: 2 }}>
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, p: 1.5,
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: roleMeta?.color, fontSize: '0.875rem', fontWeight: 700 }}>
              {user.username[0].toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ color: '#F1F5F9', fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.2 }} noWrap>
                {user.username}
              </Typography>
              <Typography sx={{ color: '#64748B', fontSize: '0.6875rem' }} noWrap>
                {roleMeta?.label}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2 }} />

      {/* Navigation */}
      <List sx={{ flex: 1, px: 1, py: 1.5, overflowY: 'auto' }}>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={active}
                sx={{
                  borderRadius: '8px !important',
                  mx: '0 !important',
                  px: 1.5,
                  py: 1,
                  transition: 'all 0.15s',
                  '&.Mui-selected': {
                    bgcolor: `${alpha('#1B4FD8', 0.85)} !important`,
                    '& .MuiListItemIcon-root': { color: '#fff' },
                    '& .MuiListItemText-primary': { color: '#fff', fontWeight: 600 },
                    boxShadow: '0 4px 12px rgba(27,79,216,0.4)',
                  },
                  '&:not(.Mui-selected):hover': {
                    bgcolor: 'rgba(255,255,255,0.06)',
                    '& .MuiListItemIcon-root': { color: '#CBD5E1' },
                    '& .MuiListItemText-primary': { color: '#CBD5E1' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: active ? '#fff' : '#475569' }}>
                  <Icon sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: active ? 600 : 500,
                    color: active ? '#fff' : '#94A3B8',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2 }} />

      {/* Logout */}
      <List sx={{ px: 1, py: 1.5 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: '8px !important',
              mx: '0 !important',
              px: 1.5, py: 1,
              '&:hover': {
                bgcolor: 'rgba(220,38,38,0.1)',
                '& .MuiListItemIcon-root, & .MuiListItemText-primary': { color: '#F87171' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: '#475569' }}>
              <LogoutIcon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText
              primary="Sign Out"
              primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748B' }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' },
        }}
      >
        <SidebarContent />
      </Drawer>

      {/* Desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', lg: 'block' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH, border: 'none',
            boxShadow: '2px 0 20px rgba(0,0,0,0.15)',
          },
        }}
        open
      >
        <SidebarContent />
      </Drawer>
    </>
  );
}
