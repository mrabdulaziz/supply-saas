import { createTheme, alpha } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    neutral: Palette['primary'];
  }
  interface PaletteOptions {
    neutral?: PaletteOptions['primary'];
  }
}

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1B4FD8',
      light: '#4B75E8',
      dark: '#1239A5',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0891B2',
      light: '#22D3EE',
      dark: '#0E7490',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#059669',
      light: '#34D399',
      dark: '#047857',
    },
    warning: {
      main: '#D97706',
      light: '#FCD34D',
      dark: '#B45309',
    },
    error: {
      main: '#DC2626',
      light: '#F87171',
      dark: '#B91C1C',
    },
    neutral: {
      main: '#64748B',
      light: '#94A3B8',
      dark: '#475569',
    },
    background: {
      default: '#F1F5F9',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      disabled: '#94A3B8',
    },
    divider: '#E2E8F0',
  },

  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.875rem', fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 },
    h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
    h6: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
    subtitle1: { fontSize: '0.9375rem', fontWeight: 500, lineHeight: 1.5 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.57, color: '#475569' },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.57 },
    caption: { fontSize: '0.75rem', lineHeight: 1.66, color: '#64748B' },
    overline: { fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' },
    button: { fontWeight: 600, letterSpacing: '0.02em' },
  },

  shape: { borderRadius: 10 },

  shadows: [
    'none',
    '0px 1px 2px rgba(0,0,0,0.06), 0px 1px 3px rgba(0,0,0,0.1)',
    '0px 1px 5px rgba(0,0,0,0.07), 0px 2px 8px rgba(0,0,0,0.08)',
    '0px 2px 6px rgba(0,0,0,0.07), 0px 4px 12px rgba(0,0,0,0.1)',
    '0px 3px 8px rgba(0,0,0,0.08), 0px 6px 16px rgba(0,0,0,0.1)',
    '0px 4px 10px rgba(0,0,0,0.08), 0px 8px 20px rgba(0,0,0,0.1)',
    '0px 5px 12px rgba(0,0,0,0.09), 0px 10px 24px rgba(0,0,0,0.1)',
    '0px 6px 14px rgba(0,0,0,0.09), 0px 12px 28px rgba(0,0,0,0.1)',
    '0px 8px 18px rgba(0,0,0,0.1), 0px 16px 32px rgba(0,0,0,0.1)',
    '0px 10px 22px rgba(0,0,0,0.1), 0px 18px 36px rgba(0,0,0,0.1)',
    '0px 12px 26px rgba(0,0,0,0.1), 0px 20px 40px rgba(0,0,0,0.1)',
    '0px 14px 30px rgba(0,0,0,0.1), 0px 22px 44px rgba(0,0,0,0.1)',
    '0px 16px 34px rgba(0,0,0,0.1), 0px 24px 48px rgba(0,0,0,0.1)',
    '0px 18px 38px rgba(0,0,0,0.1), 0px 26px 52px rgba(0,0,0,0.1)',
    '0px 20px 42px rgba(0,0,0,0.1), 0px 28px 56px rgba(0,0,0,0.1)',
    '0px 22px 46px rgba(0,0,0,0.1), 0px 30px 60px rgba(0,0,0,0.1)',
    '0px 24px 50px rgba(0,0,0,0.1), 0px 32px 64px rgba(0,0,0,0.1)',
    '0px 26px 54px rgba(0,0,0,0.1), 0px 34px 68px rgba(0,0,0,0.1)',
    '0px 28px 58px rgba(0,0,0,0.1), 0px 36px 72px rgba(0,0,0,0.1)',
    '0px 30px 62px rgba(0,0,0,0.1), 0px 38px 76px rgba(0,0,0,0.1)',
    '0px 32px 66px rgba(0,0,0,0.1), 0px 40px 80px rgba(0,0,0,0.1)',
    '0px 34px 70px rgba(0,0,0,0.1), 0px 42px 84px rgba(0,0,0,0.1)',
    '0px 36px 74px rgba(0,0,0,0.1), 0px 44px 88px rgba(0,0,0,0.1)',
    '0px 38px 78px rgba(0,0,0,0.1), 0px 46px 92px rgba(0,0,0,0.1)',
    '0px 40px 82px rgba(0,0,0,0.1), 0px 48px 96px rgba(0,0,0,0.1)',
  ],

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': { boxSizing: 'border-box' },
        body: { backgroundColor: '#F1F5F9' },
        '::-webkit-scrollbar': { width: 6, height: 6 },
        '::-webkit-scrollbar-track': { background: 'transparent' },
        '::-webkit-scrollbar-thumb': { background: '#CBD5E1', borderRadius: 3 },
        '::-webkit-scrollbar-thumb:hover': { background: '#94A3B8' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        contained: {
          '&:hover': { boxShadow: '0 4px 12px rgba(27,79,216,0.3)' },
        },
        sizeLarge: { padding: '10px 24px', fontSize: '0.9375rem' },
        sizeMedium: { padding: '8px 18px' },
        sizeSmall: { padding: '5px 12px', fontSize: '0.8125rem' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 2px rgba(0,0,0,0.06), 0px 1px 3px rgba(0,0,0,0.1)',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        rounded: { borderRadius: 12 },
        elevation1: { boxShadow: '0px 1px 2px rgba(0,0,0,0.06), 0px 1px 3px rgba(0,0,0,0.1)' },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small', variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
            '& fieldset': { borderColor: '#E2E8F0' },
            '&:hover fieldset': { borderColor: '#94A3B8' },
          },
        },
      },
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        outlined: { borderRadius: 8 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 6 },
        sizeSmall: { height: 22, fontSize: '0.6875rem' },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#F8FAFC',
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#64748B',
            borderBottom: '2px solid #E2E8F0',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #F1F5F9',
          padding: '12px 16px',
          fontSize: '0.875rem',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: '#F8FAFC' },
          '&:last-child td': { borderBottom: 0 },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16, boxShadow: '0px 20px 60px rgba(0,0,0,0.15)' },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontWeight: 700, fontSize: '1.125rem', padding: '20px 24px 8px' },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, height: 6 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '1px 8px',
          padding: '8px 12px',
          '&.Mui-selected': {
            backgroundColor: alpha('#1B4FD8', 0.12),
            '&:hover': { backgroundColor: alpha('#1B4FD8', 0.16) },
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { borderRadius: 6, fontSize: '0.75rem' },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: { borderRadius: 6 },
      },
    },
  },
});
