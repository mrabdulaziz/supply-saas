import { Chip } from '@mui/material';

const STATUS_MAP: Record<string, { label: string; color: 'default'|'info'|'warning'|'secondary'|'success'|'error' }> = {
  DRAFT:      { label: 'Draft',      color: 'default'   },
  SUBMITTED:  { label: 'Submitted',  color: 'info'      },
  CONFIRMED:  { label: 'Confirmed',  color: 'warning'   },
  IN_TRANSIT: { label: 'In Transit', color: 'secondary' },
  DELIVERED:  { label: 'Delivered',  color: 'success'   },
  CLOSED:     { label: 'Closed',     color: 'default'   },
  REJECTED:   { label: 'Rejected',   color: 'error'     },
  CANCELLED:  { label: 'Cancelled',  color: 'error'     },
};

export function OrderChip({ status, size = 'small' }: { status: string; size?: 'small' | 'medium' }) {
  const cfg = STATUS_MAP[status] || { label: status, color: 'default' as const };
  return <Chip label={cfg.label} color={cfg.color} size={size} />;
}
