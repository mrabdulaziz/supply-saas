'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box, Card, CardContent, TextField, Button, Typography, InputAdornment,
  IconButton, Alert, Divider, CircularProgress
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import { useAuthStore } from '../../../stores/auth.store';

export default function LoginPage() {
  const [loginVal, setLoginVal] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const { login: doLogin, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await doLogin(loginVal, password);
      const u = useAuthStore.getState().user;
      if (!u?.phoneVerified) {
        router.push(`/verify-phone?phone=${encodeURIComponent(u?.phone || '')}`);
        return;
      }
      if (u.role === 'SUPER_ADMIN') router.push('/admin/dashboard');
      else if (u.role?.startsWith('SUPPLIER')) router.push('/supplier/dashboard');
      else router.push('/market/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
      p: 2,
    }}>
      {/* Background pattern */}
      <Box sx={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)',
        backgroundSize: '100px 100px',
      }} />

      <Box sx={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: 3,
            background: 'linear-gradient(135deg, #1B4FD8 0%, #0891B2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2, boxShadow: '0 8px 24px rgba(27,79,216,0.4)',
          }}>
            <LocalShippingIcon sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, mb: 0.5 }}>
            SupplyChain UZ
          </Typography>
          <Typography sx={{ color: '#64748B', fontSize: '0.9375rem' }}>
            B2B Supply Management Platform
          </Typography>
        </Box>

        {/* Card */}
        <Card elevation={0} sx={{
          border: '1px solid rgba(255,255,255,0.08)',
          bgcolor: 'rgba(255,255,255,0.97)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ mb: 0.5, fontWeight: 700 }}>Welcome back</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Sign in to your account
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Username or Phone"
                value={loginVal}
                onChange={e => setLoginVal(e.target.value)}
                placeholder="+998XXXXXXXXX"
                required
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPw(!showPw)} edge="end" size="small">
                        {showPw ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isLoading}
                sx={{ mt: 1, py: 1.375 }}
              >
                {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
              </Button>
            </Box>

            <Divider sx={{ my: 3 }}>
              <Typography variant="caption" color="text.disabled">OR</Typography>
            </Divider>

            <Typography variant="body2" color="text.secondary" textAlign="center">
              Don't have an account?{' '}
              <Link href="/register" style={{ color: '#1B4FD8', fontWeight: 600, textDecoration: 'none' }}>
                Register
              </Link>
            </Typography>
          </CardContent>
        </Card>

        <Typography variant="caption" sx={{ color: '#334155', display: 'block', textAlign: 'center', mt: 3 }}>
          © 2025 SupplyChain UZ · All rights reserved
        </Typography>
      </Box>
    </Box>
  );
}
