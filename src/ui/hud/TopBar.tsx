import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNowStrict } from 'date-fns';
import type { AppNotification } from '@/types';
import { api } from '@/services/api';
import { openLink } from '@/ui/links';
import { openCommunity } from './Toolbar';
import {
  Bell,
  CalendarDays,
  CloudSun,
  Dumbbell,
  Home,
  Moon,
  Settings,
  Sun,
  Users,
  UsersRound,
} from 'lucide-react';
import { useCurrentUser, useStore } from '@/store';
import { formatMalaysia, malaysiaHour, mockTemperature, useMalaysiaClock, dayFactor } from '@/lib/time';
import { Avatar } from '@/ui/Avatar';
import { recenter } from '@/world/recenter';

export function BrandCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`panel flex items-center ${compact ? 'h-12 px-2' : 'h-[76px] px-3'}`}>
      <img
        src="/brand/logo.svg"
        alt="Elmina Green by Sime Darby Property"
        className={compact ? 'h-9' : 'h-11 xl:h-14'}
        draggable={false}
      />
    </div>
  );
}

export function ProfileCard() {
  const user = useCurrentUser();
  const select = useStore((s) => s.select);
  const isResident = user?.role === 'resident';
  return (
    <div className="panel flex h-[76px] items-center gap-3 pl-3 pr-2">
      <button
        type="button"
        onClick={() => {
          recenter();
          if (isResident && user?.unitId) select({ kind: 'house', unitId: user.unitId });
        }}
        className="flex items-center gap-3 rounded-xl p-1 text-left transition hover:bg-black/5"
        aria-label={isResident ? 'Go to my home' : 'Go to my post'}
      >
        <Avatar user={user} size={48} />
        <span className="min-w-0">
          <span className="flex items-center gap-1 font-display text-[15px] font-bold leading-tight">
            {isResident ? (
              <>
                <Home className="h-4 w-4 text-sos-500" /> My Home
              </>
            ) : (
              user?.name
            )}
          </span>
          <span className="block max-w-[150px] truncate text-sm text-gray-500">
            {isResident ? user?.unitId : user?.post}
          </span>
        </span>
      </button>
      <NotificationsBell />
    </div>
  );
}

export function NotificationsBell({ dark = false }: { dark?: boolean }) {
  const open = useStore((s) => s.notificationsOpen);
  const setOpen = useStore((s) => s.setNotificationsOpen);
  const me = useCurrentUser();
  const all = useStore((s) => s.notifications);
  const mine = useMemo(() => (me ? all.filter((n) => n.userId === me.id).slice(0, 30) : []), [all, me]);
  const unread = mine.filter((n) => !n.read).length;

  const openItem = (n: AppNotification) => {
    setOpen(false);
    if (n.link) openLink(n.link);
  };
  const toggle = () => {
    if (open && me && unread) void api.markNotificationsRead(me.id);
    setOpen(!open);
  };

  return (
    <div className="relative">
      <button
        type="button"
        className={`icon-btn relative ${dark ? 'text-white hover:bg-white/10' : 'text-charcoal-700'}`}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        onClick={toggle}
      >
        <Bell className="h-6 w-6" />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-sos-500 px-1 text-[11px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="panel fixed left-2 right-2 top-16 z-40 p-2 text-charcoal-800 sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-80"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between px-2 py-1">
            <p className="font-display text-base font-bold">Notifications</p>
            {unread > 0 && me && (
              <button
                type="button"
                className="text-xs font-bold text-tool-600"
                onClick={() => void api.markNotificationsRead(me.id)}
              >
                Mark all read
              </button>
            )}
          </div>
          {mine.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-gray-500">
              <span className="text-3xl" aria-hidden>
                🎉
              </span>
              You&apos;re all caught up!
            </div>
          ) : (
            <ul className="scroll-thin max-h-[60vh] overflow-y-auto">
              {mine.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => openItem(n)}
                    className={`flex w-full gap-2 rounded-xl px-2 py-2 text-left hover:bg-gray-50 ${n.read ? '' : 'bg-tool-500/5'}`}
                  >
                    {!n.read && (
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-tool-500"
                        aria-label="Unread"
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{n.title}</span>
                      <span className="block truncate text-xs text-gray-500">{n.body}</span>
                      <span className="block text-[10px] text-gray-400">
                        {formatDistanceToNowStrict(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      )}
    </div>
  );
}

export function WeatherClock({ compact = false }: { compact?: boolean }) {
  const now = useMalaysiaClock(1000);
  const hour = malaysiaHour(now);
  const { date, time } = formatMalaysia(now);
  const day = dayFactor(hour);
  const Icon = day < 0.5 ? Moon : hour >= 14 && hour < 18 ? CloudSun : Sun;
  const temp = mockTemperature(hour);
  if (compact) {
    return (
      <div
        className="panel-dark flex h-10 items-center gap-2 rounded-xl px-3 text-sm"
        aria-label={`${temp} degrees, ${date}, ${time}`}
      >
        <Icon className="h-4 w-4 text-amber-300" />
        <span className="font-bold">{temp}°C</span>
        <span className="opacity-60">·</span>
        <span className="font-semibold tabular-nums">{time}</span>
      </div>
    );
  }
  return (
    <div
      className="panel-dark flex h-14 items-center gap-3 px-4"
      aria-label={`${temp} degrees Celsius, ${date}, ${time} Malaysia time`}
    >
      <Icon className="h-7 w-7 text-amber-300" />
      <span className="font-display text-2xl font-bold">{temp}°C</span>
      <span className="h-8 w-px bg-white/25" />
      <span className="whitespace-nowrap text-[15px] font-semibold">
        {date} <span className="opacity-60">·</span> <span className="tabular-nums">{time}</span>
      </span>
    </div>
  );
}

export function NavBar({ role }: { role: string }) {
  const openPanel = useStore((s) => s.openPanel);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const items = [
    {
      id: 'residents',
      label: 'Residents',
      icon: Users,
      onClick: () => useStore.getState().openPanel({ kind: 'residents' }),
    },
    {
      id: 'community',
      label: 'Community',
      icon: UsersRound,
      onClick: openCommunity,
    },
    {
      id: 'events',
      label: 'Events',
      icon: CalendarDays,
      onClick: () => openPanel({ kind: 'events' }),
    },
    {
      id: 'facilities',
      label: 'Facilities',
      icon: Dumbbell,
      onClick: () => openPanel({ kind: 'facilities' }),
    },
    { id: 'settings', label: 'Settings', icon: Settings, onClick: () => setSettingsOpen(true) },
  ].filter((i) => role === 'resident' || i.id === 'settings' || i.id === 'residents');
  return (
    <nav className="panel-dark flex h-[76px] items-stretch gap-0.5 px-1.5 py-1.5" aria-label="Main">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={it.onClick}
          className="relative flex min-w-[58px] flex-col items-center justify-center gap-1 rounded-xl px-2 text-white/90 transition hover:bg-white/10 active:scale-95 xl:min-w-[72px]"
        >
          <it.icon className="h-6 w-6" />
          <span className="text-[11px] font-semibold xl:text-xs">{it.label}</span>
        </button>
      ))}
    </nav>
  );
}
