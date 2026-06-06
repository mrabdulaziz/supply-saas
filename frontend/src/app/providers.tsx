'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import { theme } from '../lib/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30 * 1000, retry: 1 },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider
          maxSnack={4}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          autoHideDuration={4000}
        >
          {children}
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
