import { format } from 'date-fns';
import { Check, Clock } from 'lucide-react';
import clsx from 'clsx';

const ORDER_STEPS = ['DRAFT', 'SUBMITTED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CLOSED'] as const;

const STEP_LABELS: Record<string, string> = {
  DRAFT:      'Order Created',
  SUBMITTED:  'Submitted to Supplier',
  CONFIRMED:  'Confirmed by Supplier',
  IN_TRANSIT: 'Dispatched / In Transit',
  DELIVERED:  'Delivered',
  CLOSED:     'Order Closed',
  REJECTED:   'Rejected',
  CANCELLED:  'Cancelled',
};

interface HistoryEntry {
  toStatus: string;
  fromStatus?: string;
  changedBy?: { username: string };
  reason?: string;
  createdAt: string;
}

export function StatusTimeline({ history, currentStatus }: { history: HistoryEntry[]; currentStatus: string }) {
  const isRejectedOrCancelled = currentStatus === 'REJECTED' || currentStatus === 'CANCELLED';
  const steps = isRejectedOrCancelled ? [...ORDER_STEPS.slice(0, 2), currentStatus as any] : ORDER_STEPS;

  const historyMap = new Map(history.map(h => [h.toStatus, h]));
  const currentIdx = steps.indexOf(currentStatus as any);

  return (
    <div className="space-y-0">
      {steps.map((step, idx) => {
        const entry = historyMap.get(step);
        const done = idx < currentIdx || step === currentStatus;
        const active = step === currentStatus;
        const isLast = idx === steps.length - 1;

        return (
          <div key={step} className="flex gap-4">
            {/* Line + dot */}
            <div className="flex flex-col items-center">
              <div className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0',
                active && !isRejectedOrCancelled ? 'border-blue-600 bg-blue-600 text-white' :
                done ? 'border-green-500 bg-green-500 text-white' :
                step === 'REJECTED' ? 'border-red-400 bg-red-400 text-white' :
                'border-gray-200 bg-white text-gray-400'
              )}>
                {done ? <Check size={14} /> : <Clock size={14} />}
              </div>
              {!isLast && <div className={clsx('w-0.5 flex-1 my-1 min-h-[24px]', done ? 'bg-green-300' : 'bg-gray-200')} />}
            </div>

            {/* Content */}
            <div className={clsx('pb-6 min-w-0', isLast && 'pb-0')}>
              <p className={clsx('font-medium text-sm', done ? 'text-gray-900' : 'text-gray-400')}>
                {STEP_LABELS[step] || step}
              </p>
              {entry && (
                <div className="mt-0.5 space-y-0.5">
                  <p className="text-xs text-gray-400">
                    {format(new Date(entry.createdAt), 'dd MMM yyyy, HH:mm')}
                    {entry.changedBy && ` · by ${entry.changedBy.username}`}
                  </p>
                  {entry.reason && (
                    <p className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-lg">Reason: {entry.reason}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
