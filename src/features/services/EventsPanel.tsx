import { useState } from 'react';
import { CalendarPlus, Check, MapPin } from 'lucide-react';
import type { CommunityEvent } from '@/types';
import { api } from '@/services/api';
import { useCurrentUser, useStore } from '@/store';
import { formatMalaysia, formatTime, malaysiaDate, malaysiaInstant } from '@/lib/time';
import { Avatar } from '@/ui/Avatar';
import { Field, PanelHeader, inputCls } from '@/ui/Modal';
import { EVENT_ICONS, VENUES, flyToLocation } from './meta';
import { Empty, Segmented } from './ui';

/** Events calendar: residents RSVP, management creates and cancels events. */
export function EventsPanel({ onClose }: { onClose: () => void }) {
  const me = useCurrentUser();
  const events = useStore((s) => s.events);
  const [tab, setTab] = useState<'upcoming' | 'going' | 'past'>('upcoming');
  const [creating, setCreating] = useState(false);
  if (!me) return null;
  const manager = me.role === 'management';
  const now = Date.now();
  const upcoming = events
    .filter((e) => new Date(e.endsAt).getTime() > now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const list =
    tab === 'past'
      ? events
          .filter((e) => new Date(e.endsAt).getTime() <= now)
          .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
      : tab === 'going'
        ? upcoming.filter((e) => e.rsvps.includes(me.id))
        : upcoming;

  return (
    <div>
      <PanelHeader
        title="Events"
        subtitle={`${upcoming.length} coming up in Elmina Green`}
        onClose={onClose}
        icon="📅"
      />
      <div className="space-y-4 p-5">
        {manager &&
          (creating ? (
            <NewEventForm onDone={() => setCreating(false)} />
          ) : (
            <button type="button" className="btn-primary w-full" onClick={() => setCreating(true)}>
              <CalendarPlus className="h-5 w-5" /> New event
            </button>
          ))}
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { id: 'upcoming', label: 'Upcoming' },
            ...(manager ? [] : [{ id: 'going' as const, label: 'I’m going' }]),
            { id: 'past', label: 'Past' },
          ]}
        />
        {list.length === 0 ? (
          <Empty icon="🗓️">
            {tab === 'going' ? 'You haven’t RSVP’d to anything yet.' : 'Nothing here yet.'}
          </Empty>
        ) : (
          <ul className="space-y-3">
            {list.map((e) => (
              <EventCard key={e.id} event={e} past={tab === 'past'} onMap={onClose} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EventCard({ event: e, past, onMap }: { event: CommunityEvent; past: boolean; onMap: () => void }) {
  const me = useCurrentUser();
  const users = useStore((s) => s.users);
  const toast = useStore((s) => s.toast);
  if (!me) return null;
  const start = new Date(e.startsAt);
  const { date } = formatMalaysia(start);
  const [weekday, dayNum, month] = date.replace(',', '').split(' ');
  const going = e.rsvps.includes(me.id);
  const full = !!e.capacity && e.rsvps.length >= e.capacity;
  const attendees = e.rsvps.map((id) => users.find((u) => u.id === id)).filter(Boolean);

  const rsvp = async () => {
    try {
      await api.toggleRsvp(e.id, me.id);
      toast(going ? 'RSVP removed' : `You’re going to ${e.title} ${e.icon}`, going ? 'info' : 'success');
    } catch (err) {
      toast((err as Error).message, 'warn');
    }
  };

  return (
    <li className={`rounded-2xl p-3 ring-1 ring-black/5 ${past ? 'bg-gray-50 opacity-75' : 'bg-white'}`}>
      <div className="flex gap-3">
        <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-leaf-50 py-1.5 text-leaf-700">
          <span className="text-[10px] font-bold uppercase">{weekday}</span>
          <span className="font-display text-2xl font-bold leading-none">{dayNum}</span>
          <span className="text-[10px] font-bold uppercase">{month}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold leading-tight">
            {e.icon} {e.title}
          </p>
          <p className="text-xs text-gray-500">
            {formatTime(start)} – {formatTime(new Date(e.endsAt))}
          </p>
          <button
            type="button"
            className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-tool-600"
            onClick={() => {
              if (!e.location) return;
              onMap();
              flyToLocation(e.location);
            }}
          >
            <MapPin className="h-3 w-3" /> {e.venue}
          </button>
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-700">{e.description}</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="flex -space-x-2">
          {attendees.slice(0, 5).map((u) => (
            <span key={u!.id} className="rounded-full ring-2 ring-white">
              <Avatar user={u} size={26} />
            </span>
          ))}
        </span>
        <span className="min-w-0 flex-1 text-xs text-gray-500">
          {past ? `${e.rsvps.length} went` : `${e.rsvps.length} going`}
          {e.capacity && !past ? ` · ${Math.max(0, e.capacity - e.rsvps.length)} spots left` : ''}
        </span>
        {!past && me.role === 'resident' && (
          <button
            type="button"
            onClick={rsvp}
            disabled={full && !going}
            aria-pressed={going}
            className={`btn min-h-[36px] px-3 text-sm ${going ? 'bg-leaf-500 text-white' : 'bg-white ring-1 ring-black/10'}`}
          >
            {going ? (
              <>
                <Check className="h-4 w-4" /> Going
              </>
            ) : full ? (
              'Full'
            ) : (
              'RSVP'
            )}
          </button>
        )}
        {!past && me.role === 'management' && (
          <button
            type="button"
            className="text-xs font-bold text-sos-600"
            onClick={() => {
              void api.cancelEvent(e.id);
              toast('Event cancelled — attendees notified');
            }}
          >
            Cancel event
          </button>
        )}
      </div>
    </li>
  );
}

function NewEventForm({ onDone }: { onDone: () => void }) {
  const me = useCurrentUser();
  const toast = useStore((s) => s.toast);
  const [f, setF] = useState({
    title: '',
    description: '',
    icon: EVENT_ICONS[0],
    venue: VENUES[0].name,
    date: malaysiaDate(new Date(), 7),
    start: '10:00',
    end: '12:00',
    capacity: '',
  });
  const ok = f.title.trim() && f.date && f.start && f.end > f.start;
  const publish = async () => {
    if (!me || !ok) return;
    await api.createEvent(me.id, {
      title: f.title.trim(),
      description: f.description.trim(),
      icon: f.icon,
      venue: f.venue,
      location: VENUES.find((v) => v.name === f.venue)?.where(),
      startsAt: malaysiaInstant(f.date, f.start).toISOString(),
      endsAt: malaysiaInstant(f.date, f.end).toISOString(),
      capacity: Number(f.capacity) > 0 ? Number(f.capacity) : undefined,
    });
    toast('Event published 📅 — residents notified', 'success');
    onDone();
  };
  return (
    <div className="space-y-3 rounded-2xl bg-leaf-50 p-3">
      <Field label="Title">
        <input
          className={inputCls}
          value={f.title}
          onChange={(e) => setF({ ...f, title: e.target.value })}
          maxLength={50}
          placeholder="e.g. Merdeka family fun run"
        />
      </Field>
      <div className="flex flex-wrap gap-1">
        {EVENT_ICONS.map((i) => (
          <button
            key={i}
            type="button"
            aria-pressed={f.icon === i}
            onClick={() => setF({ ...f, icon: i })}
            className={`grid h-9 w-9 place-items-center rounded-lg text-lg ${f.icon === i ? 'bg-white ring-2 ring-leaf-500' : 'bg-white/60'}`}
          >
            {i}
          </button>
        ))}
      </div>
      <Field label="Venue">
        <select className={inputCls} value={f.venue} onChange={(e) => setF({ ...f, venue: e.target.value })}>
          {VENUES.map((v) => (
            <option key={v.name}>{v.name}</option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Date">
          <input
            type="date"
            className={inputCls}
            min={malaysiaDate()}
            value={f.date}
            onChange={(e) => setF({ ...f, date: e.target.value })}
          />
        </Field>
        <Field label="Start">
          <input
            type="time"
            className={inputCls}
            value={f.start}
            onChange={(e) => setF({ ...f, start: e.target.value })}
          />
        </Field>
        <Field label="End">
          <input
            type="time"
            className={inputCls}
            value={f.end}
            onChange={(e) => setF({ ...f, end: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Capacity (optional)">
        <input
          type="number"
          min={1}
          className={inputCls}
          value={f.capacity}
          onChange={(e) => setF({ ...f, capacity: e.target.value })}
          placeholder="No limit"
        />
      </Field>
      <Field label="Details">
        <textarea
          className={`${inputCls} min-h-[70px]`}
          value={f.description}
          onChange={(e) => setF({ ...f, description: e.target.value })}
          maxLength={240}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn-ghost" onClick={onDone}>
          Cancel
        </button>
        <button type="button" className="btn-primary" disabled={!ok} onClick={publish}>
          Publish
        </button>
      </div>
    </div>
  );
}
