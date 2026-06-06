'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, AppBar, Toolbar, IconButton, Typography, CircularProgress } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuthStore } from '../../stores/auth.store';
import { Sidebar, DRAWER_WIDTH } from './Sidebar';
import { NotificationBell } from './NotificationBell';

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function AppShell({ children, allowedRoles }: Props) {
  const { user, isAuthenticated, isLoading, fetchMe } = useAuthStore();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      fetchMe().catch(() => router.push('/login'));
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isLoading && isAuthenticated && user && allowedRoles) {
      if (!allowedRoles.includes(user.role)) {
        const home: Record<string, string> = {
          SUPER_ADMIN: '/admin/dashboard',
          SUPPLIER_ADMIN: '/supplier/dashboard',
          SUPPLIER_STAFF: '/supplier/dashboard',
          MARKET_ADMIN: '/market/dashboard',
          MARKET_STAFF: '/market/dashboard',
        };
        router.push(home[user.role] || '/login');
      }
    }
  }, [isLoading, isAuthenticated, user]);

  if (isLoading || !isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F1F5F9' }}>
        <CircularProgress size={40} thickness={3} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F1F5F9' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', ml: { lg: `${DRAWER_WIDTH}px` }, minWidth: 0 }}>
        {/* Top AppBar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid #E2E8F0',
            color: 'text.primary',
          }}
        >
          <Toolbar sx={{ minHeight: '60px !important', px: { xs: 2, sm: 3 } }}>
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 2, display: { lg: 'none' }, color: 'text.secondary' }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ flex: 1 }} />
            <NotificationBell />
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box component="main" sx={{ flex: 1, overflow: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
