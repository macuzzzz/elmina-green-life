import { useMemo, type ReactNode } from 'react';
import qrcode from 'qrcode-generator';
import { MessageSquare } from 'lucide-react';
import { api } from '@/services/api';
import { useCurrentUser, useStore } from '@/store';

/** Real, scannable QR code rendered as a single SVG path. */
export function QrCode({ value, size = 168 }: { value: string; size?: number }) {
  const { n, d } = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    const count = qr.getModuleCount();
    let path = '';
    for (let r = 0; r < count; r++)
      for (let c = 0; c < count; c++) if (qr.isDark(r, c)) path += `M${c + 2} ${r + 2}h1v1h-1z`;
    return { n: count + 4, d: path };
  }, [value]);
  return (
    <svg
      viewBox={`0 0 ${n} ${n}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className="rounded-xl bg-white"
      role="img"
      aria-label="QR code"
    >
      <path d={d} fill="#1d2025" />
    </svg>
  );
}

/** Pill tabs, matching the management board's switcher. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div
      className="grid gap-1 rounded-xl bg-gray-100 p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      role="tablist"
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={`h-9 truncate rounded-lg px-1 text-xs font-bold ${value === o.id ? 'bg-white shadow' : 'text-gray-500'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Empty({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
      <span className="text-3xl" aria-hidden>
        {icon}
      </span>
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">{children}</h3>;
}

/** Opens a 1-to-1 chat, honouring both residents' DM privacy settings. */
export function MessageButton({ userId, label = 'Message' }: { userId: string; label?: string }) {
  const me = useCurrentUser();
  const other = useStore((s) => s.users.find((u) => u.id === userId));
  if (!me || me.role !== 'resident' || !other || other.id === me.id) return null;
  const blocked = !other.privacy.allowNeighbourDMs || !me.privacy.allowNeighbourDMs;
  return (
    <button
      type="button"
      className="btn-ghost min-h-[36px] px-3 text-sm"
      disabled={blocked}
      title={blocked ? 'Direct messages are turned off for this neighbour' : undefined}
      onClick={async () => {
        const ch = await api.openChannel(me.id, 'direct', other.id);
        useStore.getState().openPanel({ kind: 'chat', channelId: ch.id });
      }}
    >
      <MessageSquare className="h-4 w-4" /> {label}
    </button>
  );
}
