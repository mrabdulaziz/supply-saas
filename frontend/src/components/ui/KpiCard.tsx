'use client';
import { Box, Card, CardContent, Typography, Skeleton, alpha } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

interface KpiCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  gradient: string;
  shadow: string;
  trend?: number; // % change vs previous period
  loading?: boolean;
  onClick?: () => void;
}

export function KpiCard({ label, value, subValue, icon: Icon, gradient, shadow, trend, loading, onClick }: KpiCardProps) {
  const TrendIcon = trend === undefined ? null : trend > 0 ? TrendingUpIcon : trend < 0 ? TrendingDownIcon : TrendingFlatIcon;
  const trendColor = trend === undefined ? '' : trend > 0 ? '#059669' : trend < 0 ? '#DC2626' : '#64748B';
  const trendBg = trend === undefined ? '' : trend > 0 ? '#ECFDF5' : trend < 0 ? '#FEF2F2' : '#F8FAFC';

  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        border: '1px solid #E2E8F0',
        borderRadius: 3,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': onClick ? { boxShadow: `0 8px 24px ${shadow}`, transform: 'translateY(-2px)', borderColor: 'transparent' } : {},
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: 2.5,
            background: gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 6px 16px ${shadow}`,
          }}>
            <Icon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          {TrendIcon && trend !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: trendBg, color: trendColor, px: 1, py: 0.4, borderRadius: 5 }}>
              <TrendIcon sx={{ fontSize: 14 }} />
              <Typography variant="caption" fontWeight={700}>{Math.abs(trend)}%</Typography>
            </Box>
          )}
        </Box>
        {loading ? (
          <>
            <Skeleton width="60%" height={36} />
            <Skeleton width="80%" height={20} sx={{ mt: 0.5 }} />
          </>
        ) : (
          <>
            <Typography variant="h4" fontWeight={700} lineHeight={1.1}>{value}</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>{label}</Typography>
            {subValue && <Typography variant="caption" color="text.disabled" mt={0.25} display="block">{subValue}</Typography>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
