import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Ambulance,
  Building,
  ChevronDown,
  Droplet,
  Flame,
  Leaf,
  MessageCircle,
  Phone,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { EMERGENCY_CONTACTS, type EmergencyContact, type EmergencyIcon } from '@/data/emergency';
import { useStore } from '@/store';
import { api } from '@/services/api';

const ICONS: Record<EmergencyIcon, { icon: LucideIcon; color: string }> = {
  fire: { icon: Flame, color: 'text-orange-500' },
  police: { icon: Shield, color: 'text-blue-700' },
  ambulance: { icon: Ambulance, color: 'text-sos-500' },
  water: { icon: Droplet, color: 'text-sky-500' },
  power: { icon: Zap, color: 'text-amber-500' },
  developer: { icon: Leaf, color: 'text-leaf-600' },
  guard: { icon: ShieldCheck, color: 'text-charcoal-700' },
  office: { icon: Building, color: 'text-tool-500' },
};

function ContactRow({ c }: { c: EmergencyContact }) {
  const setConfirmCall = useStore((s) => s.setConfirmCall);
  const { icon: Icon, color } = ICONS[c.icon];
  return (
    <li className="flex items-center gap-2.5 px-3 py-1">
      <Icon className={`h-5 w-5 shrink-0 ${color}`} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-bold leading-tight text-charcoal-800">{c.name}</span>
        {c.note && <span className="block truncate text-[11px] leading-tight text-gray-500">{c.note}</span>}
      </span>
      {c.number && (
        <span className="shrink-0 font-display text-[15px] font-extrabold text-sos-600">{c.number}</span>
      )}
      {c.chat ? (
        <button
          type="button"
          onClick={async () => {
            const me = useStore.getState().session?.userId;
            if (!me || !c.chat) return;
            if (useStore.getState().session?.role !== 'resident') {
              useStore.getState().openPanel({ kind: 'chat' });
              return;
            }
            const ch = await api.openChannel(me, c.chat);
            useStore.getState().openPanel({ kind: 'chat', channelId: ch.id });
          }}
          className="grid h-8 w-9 shrink-0 place-items-center rounded-lg border-2 border-charcoal-700/20 text-charcoal-700 transition hover:bg-gray-100 active:scale-90"
          aria-label={`Chat with ${c.name}`}
        >
          <MessageCircle className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmCall(c)}
          className="grid h-8 w-9 shrink-0 place-items-center rounded-lg border-2 border-sos-500 text-sos-500 transition hover:bg-sos-500 hover:text-white active:scale-90"
          aria-label={`Call ${c.name} ${c.number}`}
        >
          <Phone className="h-4 w-4" />
        </button>
      )}
    </li>
  );
}

/** Red emergency numbers panel — always one tap away. */
export function EmergencyPanel({
  collapsible = true,
  className = '',
}: {
  collapsible?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(true);
  const setConfirmAlert = useStore((s) => s.setConfirmAlert);
  const role = useStore((s) => s.session?.role);
  return (
    <section
      className={`overflow-hidden rounded-2xl border-2 border-sos-500 bg-white shadow-panel ${className}`}
      aria-label="Emergency numbers"
    >
      <button
        type="button"
        onClick={() => collapsible && setOpen((o) => !o)}
        className="flex w-full items-center gap-2 bg-sos-500 px-3 py-2 text-white"
        aria-expanded={open}
        disabled={!collapsible}
      >
        <AlertTriangle className="h-6 w-6" />
        <span className="flex-1 text-left font-display text-lg font-bold">Emergency Numbers</span>
        {collapsible && (
          <ChevronDown className={`h-5 w-5 transition-transform ${open ? '' : '-rotate-90'}`} />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <ul className="divide-y divide-gray-100 py-0.5">
              {EMERGENCY_CONTACTS.map((c) => (
                <ContactRow key={c.id} c={c} />
              ))}
            </ul>
            {role === 'resident' && (
              <div className="px-3 pb-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmAlert(true)}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-red-50 font-bold text-sos-600 ring-2 ring-sos-500 transition hover:bg-sos-500 hover:text-white active:scale-[0.98]"
                >
                  <ShieldAlert className="h-5 w-5" /> Alert guardhouse
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
