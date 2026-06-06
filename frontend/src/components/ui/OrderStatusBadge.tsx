import clsx from 'clsx';

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  DRAFT:      { label: 'Draft',      classes: 'bg-gray-100 text-gray-600' },
  SUBMITTED:  { label: 'Submitted',  classes: 'bg-blue-100 text-blue-700' },
  CONFIRMED:  { label: 'Confirmed',  classes: 'bg-yellow-100 text-yellow-700' },
  IN_TRANSIT: { label: 'In Transit', classes: 'bg-purple-100 text-purple-700' },
  DELIVERED:  { label: 'Delivered',  classes: 'bg-green-100 text-green-700' },
  CLOSED:     { label: 'Closed',     classes: 'bg-gray-200 text-gray-500' },
  REJECTED:   { label: 'Rejected',   classes: 'bg-red-100 text-red-700' },
  CANCELLED:  { label: 'Cancelled',  classes: 'bg-orange-100 text-orange-700' },
};

export function OrderStatusBadge({ status, large }: { status: string; large?: boolean }) {
  const config = STATUS_CONFIG[status] || { label: status, classes: 'bg-gray-100 text-gray-600' };
  return (
    <span className={clsx('font-medium rounded-full', config.classes, large ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs')}>
      {config.label}
    </span>
  );
}
