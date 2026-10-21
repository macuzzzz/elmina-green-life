import { format } from 'date-fns';
import { Check } from 'lucide-react';
import type { StatusChange } from '@/types';
import { useStore } from '@/store';

/** Visual status timeline: past steps from history, upcoming steps greyed out. */
export function Timeline<S extends string>({
  flow,
  history,
  labels,
  current,
}: {
  flow: S[];
  history: StatusChange<S>[];
  labels: Record<S, string>;
  current: S;
}) {
  const users = useStore((s) => s.users);
  const offFlow = !flow.includes(current);
  const reachedIdx = offFlow ? -1 : flow.indexOf(current);
  const steps = flow.map((status, i) => ({
    status,
    change: [...history].reverse().find((h) => h.status === status),
    done: i <= reachedIdx || history.some((h) => h.status === status),
  }));
  if (offFlow)
    steps.push({
      status: current,
      change: [...history].reverse().find((h) => h.status === current),
      done: true,
    });
  return (
    <ol className="relative space-y-3 pl-8" aria-label="Status timeline">
      <span className="absolute bottom-2 left-[11px] top-2 w-0.5 bg-gray-200" aria-hidden />
      {steps.map(({ status, change, done }) => {
        const isCurrent = status === current;
        const by = change ? users.find((u) => u.id === change.byUserId) : undefined;
        return (
          <li key={status} className="relative">
            <span
              className={`absolute -left-8 top-0.5 grid h-6 w-6 place-items-center rounded-full border-2 ${
                isCurrent
                  ? status === 'rejected'
                    ? 'border-sos-500 bg-sos-500 text-white'
                    : 'border-tool-500 bg-tool-500 text-white'
                  : done
                    ? 'border-leaf-500 bg-leaf-500 text-white'
                    : 'border-gray-300 bg-white'
              }`}
            >
              {done && <Check className="h-3.5 w-3.5" />}
            </span>
            <p className={`text-sm font-bold ${done ? 'text-charcoal-800' : 'text-gray-400'}`}>
              {labels[status]}
            </p>
            {change && (
              <p className="text-xs text-gray-500">
                {format(new Date(change.at), 'd MMM, h:mm a')}
                {by ? ` · ${by.name}` : ''}
              </p>
            )}
            {change?.note && (
              <p className="mt-0.5 rounded-lg bg-gray-50 px-2 py-1 text-xs text-charcoal-700">
                {change.note}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
