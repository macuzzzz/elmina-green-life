import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertOctagon,
  Home,
  Lightbulb,
  MessageCircle,
  MoreHorizontal,
  MousePointer2,
  Paintbrush,
  Users,
  UsersRound,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useCurrentUser, useStore, type Tool } from '@/store';
import { SUGGESTION_ITEMS } from '@/features/tickets/meta';
import { isPlacementTool } from '@/features/tickets/placement';
import { getLayout } from '@/world/layout';

const TOOLS: { id: Tool; label: string; icon: LucideIcon }[] = [
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'report', label: 'Report', icon: AlertOctagon },
  { id: 'repair', label: 'Repair', icon: Wrench },
  { id: 'suggest', label: 'Suggest', icon: Lightbulb },
  { id: 'decorate', label: 'Decorate', icon: Paintbrush },
  { id: 'community', label: 'Community', icon: UsersRound },
];

export const BACKLOG = [
  '🏸 Facility booking',
  '🪪 Visitor passes & QR',
  '📅 Events & RSVPs',
  '📦 Parcel log',
  '🧾 Maintenance fees',
  '🛍️ Swap corner',
  '🔎 Lost & found',
  '📊 Polls & surveys',
];

/** Opens the feed: expands the phone sheet / focuses the desktop composer. */
export function openCommunity() {
  useStore.getState().showAuthorPosts(null);
  setTimeout(
    () =>
      (
        document.querySelector('input[placeholder^="Share your thoughts"]') as HTMLInputElement | null
      )?.focus(),
    350,
  );
}

function useToolActions() {
  const me = useCurrentUser();
  return (t: Tool) => {
    const s = useStore.getState();
    switch (t) {
      case 'select':
        s.setTool('select');
        break;
      case 'report':
        s.setTool('report');
        break;
      case 'repair':
        // Repair starts with "My unit"; common areas are picked on the map from the form.
        s.setTool('select');
        s.openPanel({ kind: 'repair' });
        break;
      case 'suggest':
        s.setTool('suggest');
        break;
      case 'decorate':
        s.setTool('select');
        if (me?.unitId) s.openPanel({ kind: 'decorate' });
        break;
      case 'community':
        s.setTool('select');
        openCommunity();
        break;
    }
  };
}

/** Game-style toolbar. `variant="tabs"` is the phone bottom tab bar. */
export function Toolbar({ variant = 'floating' }: { variant?: 'floating' | 'tabs' }) {
  const tool = useStore((s) => s.tool);
  const [moreOpen, setMoreOpen] = useState(false);
  const act = useToolActions();
  const openPanel = useStore((s) => s.openPanel);
  const floating = variant === 'floating';
  const btn = floating
    ? 'h-[64px] w-[58px] text-[11px] xl:w-[70px] xl:text-xs'
    : 'h-14 min-w-[60px] flex-1 text-[11px]';

  return (
    <div className="relative">
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="panel absolute bottom-full right-0 mb-2 w-64 p-2"
            role="menu"
          >
            {[
              { label: 'Messages', icon: MessageCircle, run: () => openPanel({ kind: 'chat' }) },
              { label: 'My Home', icon: Home, run: () => openPanel({ kind: 'myhome' }) },
              { label: 'Residents', icon: Users, run: () => openPanel({ kind: 'residents' }) },
            ].map((m) => (
              <button
                key={m.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setMoreOpen(false);
                  m.run();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-bold hover:bg-gray-100"
              >
                <m.icon className="h-4 w-4" /> {m.label}
              </button>
            ))}
            <p className="px-2 pb-1 pt-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              Coming soon
            </p>
            <ul>
              {BACKLOG.map((b) => (
                <li
                  key={b}
                  className="flex items-center justify-between rounded-lg px-2 py-1 text-sm text-gray-500"
                >
                  {b}
                  <span className="rounded-full bg-amber-100 px-2 text-[10px] font-bold uppercase text-amber-700">
                    Soon
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      <div
        className={
          floating
            ? 'panel flex items-stretch gap-1 p-1.5'
            : 'scroll-thin flex items-stretch gap-0.5 overflow-x-auto bg-white px-1 pb-[max(env(safe-area-inset-bottom),4px)] pt-1 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]'
        }
        role="toolbar"
        aria-label="Tools"
      >
        {TOOLS.map((t) => {
          const active = tool === t.id;
          return (
            <motion.button
              key={t.id}
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setMoreOpen(false);
                act(t.id);
              }}
              aria-pressed={active}
              className={`flex shrink-0 flex-col items-center justify-center gap-1 rounded-xl font-semibold transition ${btn} ${
                active ? 'bg-tool-500 text-white shadow-md' : 'text-charcoal-700 hover:bg-black/5'
              }`}
            >
              <t.icon className={floating ? 'h-7 w-7' : 'h-6 w-6'} strokeWidth={2.2} />
              {t.label}
            </motion.button>
          );
        })}
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          className={`flex shrink-0 flex-col items-center justify-center gap-1 rounded-xl font-semibold transition ${btn} ${
            moreOpen ? 'bg-gray-200' : 'text-charcoal-700 hover:bg-black/5'
          }`}
        >
          <MoreHorizontal className={floating ? 'h-7 w-7' : 'h-6 w-6'} />
          More
        </motion.button>
      </div>
    </div>
  );
}

/** Hint bar for map-tap tools (Report / Repair common area / Suggest palette). */
export function PlacementBar() {
  const tool = useStore((s) => s.tool);
  const item = useStore((s) => s.suggestItem);
  const me = useCurrentUser();
  if (!isPlacementTool(tool)) return null;
  const s = useStore.getState();
  const useHome = () => {
    const home = me?.unitId ? getLayout().unitMap.get(me.unitId) : undefined;
    if (!home) return;
    s.openPanel({
      kind: 'report',
      location: { x: home.x, z: home.z, unitId: home.unitId, precinctId: home.precinctId },
    });
    s.setTool('select');
  };
  return (
    <div className="panel pointer-events-auto mx-auto w-fit max-w-[calc(100vw-24px)] p-2" role="status">
      <div className="flex items-center gap-2 px-1">
        <span className="text-sm font-bold">
          {tool === 'report' && '📍 Tap where the problem is'}
          {tool === 'repair' && '🔧 Tap the common area that needs repair'}
          {tool === 'suggest' && (item ? '👻 Now tap where it should go' : '💡 Pick an item to suggest')}
        </span>
        {tool === 'report' && (
          <button
            type="button"
            onClick={useHome}
            className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-bold"
          >
            Use my house
          </button>
        )}
        <button
          type="button"
          onClick={() => s.setTool('select')}
          className="icon-btn ml-auto h-9 w-9"
          aria-label="Cancel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {tool === 'suggest' && (
        <div className="scroll-thin mt-1.5 flex gap-1 overflow-x-auto pb-1">
          {SUGGESTION_ITEMS.map((x) => (
            <button
              key={x.id}
              type="button"
              aria-pressed={item === x.id}
              onClick={() => s.setSuggestItem(x.id)}
              className={`flex w-16 shrink-0 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-bold leading-tight ${
                item === x.id ? 'bg-tool-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <span className="text-xl">{x.icon}</span>
              {x.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
