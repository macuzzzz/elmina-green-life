import { useState } from 'react';
import { motion } from 'framer-motion';
import { Map as MapIcon } from 'lucide-react';
import type { Role } from '@/types';
import { useCurrentUser, useStore } from '@/store';
import { Avatar } from '@/ui/Avatar';
import { SelectionCard } from '@/ui/cards/SelectionCard';
import { BottomSheet, type SheetSnap } from './BottomSheet';
import { FeedPanel } from './FeedPanel';
import { RecenterButton } from './RecenterButton';
import { PlacementBar, Toolbar } from './Toolbar';
import { NotificationsBell, WeatherClock } from './TopBar';

export const TABBAR_H = 64;

/** Phone (<1024px) layout: compact top bar, SOS button, feed bottom sheet, tab bar. */
export function PhoneHud({ role }: { role: Role }) {
  const me = useCurrentUser();
  const setSosOpen = useStore((s) => s.setSosOpen);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const setMinimapOpen = useStore((s) => s.setMinimapOpen);
  const resident = role === 'resident';
  const tabbar = resident ? TABBAR_H : 0;
  const [snap, setSnap] = useState<SheetSnap>('peek');
  const peek = 200;
  const feedNonce = useStore((s) => s.feedOpenNonce);

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* compact top bar */}
      <div className="pointer-events-auto absolute inset-x-2 top-[max(env(safe-area-inset-top),8px)] flex items-center gap-2">
        <div className="panel grid h-12 w-12 shrink-0 place-items-center">
          <img src="/brand/leaf.svg" alt="Elmina Green" className="h-8 w-8" />
        </div>
        <div className="flex min-w-0 flex-1 justify-center">
          <WeatherClock compact />
        </div>
        <div className="panel flex h-12 shrink-0 items-center gap-0.5 pl-0.5 pr-1">
          <NotificationsBell />
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="rounded-full"
            aria-label="Profile and settings"
          >
            <Avatar user={me} size={36} />
          </button>
        </div>
      </div>

      <div className="absolute inset-x-2 top-[calc(max(env(safe-area-inset-top),8px)+132px)]">
        <PlacementBar />
      </div>

      {/* SOS */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={() => setSosOpen(true)}
        className="pointer-events-auto absolute right-3 top-[calc(max(env(safe-area-inset-top),8px)+60px)] grid h-14 w-14 animate-sosPulse place-items-center rounded-full bg-sos-500 font-display text-base font-extrabold text-white shadow-pop ring-4 ring-white"
        aria-label="Emergency numbers (SOS)"
      >
        SOS
      </motion.button>

      {/* selection card floats above the sheet */}
      <div
        className="pointer-events-auto absolute inset-x-2 transition-[bottom] duration-300"
        style={{ bottom: tabbar + (snap === 'peek' ? peek : 0) + 72 }}
      >
        {snap === 'peek' && <SelectionCard />}
      </div>

      {/* recenter + map buttons above the sheet */}
      {snap === 'peek' && (
        <div
          className="pointer-events-auto absolute left-3 flex gap-2"
          style={{ bottom: tabbar + peek + 12 }}
        >
          <RecenterButton size={48} />
          <button
            type="button"
            onClick={() => setMinimapOpen(true)}
            className="grid h-12 w-12 place-items-center rounded-full bg-white text-charcoal-700 shadow-lg"
            aria-label="Open minimap"
          >
            <MapIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {resident && (
        <div className="pointer-events-auto">
          <BottomSheet
            bottomOffset={tabbar}
            peek={peek}
            label="Community feed"
            onSnap={setSnap}
            openNonce={feedNonce}
          >
            <FeedPanel className="flex-1 !rounded-none !border-0 !bg-transparent !shadow-none" />
          </BottomSheet>
        </div>
      )}

      {resident && (
        <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-30">
          <Toolbar variant="tabs" />
        </div>
      )}
    </div>
  );
}
