import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Link from 'next/link';

interface Crumb { label: string; href?: string; }

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1 }}>
          {breadcrumbs.map((crumb, i) =>
            crumb.href ? (
              <MuiLink key={i} component={Link} href={crumb.href} underline="hover" color="text.secondary" variant="caption" fontWeight={500}>
                {crumb.label}
              </MuiLink>
            ) : (
              <Typography key={i} variant="caption" color="text.primary" fontWeight={600}>{crumb.label}</Typography>
            )
          )}
        </Breadcrumbs>
      )}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} lineHeight={1.2}>{title}</Typography>
          {subtitle && <Typography variant="body2" color="text.secondary" mt={0.5}>{subtitle}</Typography>}
        </Box>
        {actions && <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>{actions}</Box>}
      </Box>
    </Box>
  );
}
