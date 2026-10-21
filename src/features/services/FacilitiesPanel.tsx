import { useMemo, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import type { FacilityBooking, FacilityId } from '@/types';
import { api } from '@/services/api';
import { useCurrentUser, useStore } from '@/store';
import { displayName } from '@/lib/people';
import { formatDay, malaysiaDate, malaysiaInstant } from '@/lib/time';
import { PanelHeader } from '@/ui/Modal';
import { FACILITIES, facilityMeta, flyToLocation, slotEnd, slotLabel } from './meta';
import { Empty, SectionTitle } from './ui';

const endsAt = (b: FacilityBooking) =>
  malaysiaInstant(b.date, slotEnd(b.slot, facilityMeta(b.facilityId).hours)).getTime();
const byWhen = (a: FacilityBooking, b: FacilityBooking) =>
  `${a.date}${a.slot}`.localeCompare(`${b.date}${b.slot}`);

/** Book the badminton court, BBQ gazebo or community hall. Staff see who booked what. */
export function FacilitiesPanel({ onClose }: { onClose: () => void }) {
  const me = useCurrentUser();
  const bookings = useStore((s) => s.bookings);
  const users = useStore((s) => s.users);
  const toast = useStore((s) => s.toast);
  const [fid, setFid] = useState<FacilityId>('badminton');
  const [date, setDate] = useState(() => malaysiaDate());
  const [busy, setBusy] = useState(false);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => malaysiaDate(new Date(), i)), []);
  if (!me) return null;
  const staff = me.role !== 'resident';
  const f = facilityMeta(fid);
  const now = Date.now();
  const live = bookings.filter((b) => !b.cancelled);
  const today = live.filter((b) => b.facilityId === fid && b.date === date);
  const iHaveOne = today.some((b) => b.userId === me.id);
  const upcoming = live.filter((b) => (staff || b.userId === me.id) && endsAt(b) > now).sort(byWhen);

  const book = async (slot: string) => {
    setBusy(true);
    try {
      await api.createBooking(me.id, { facilityId: fid, date, slot });
      toast(`${f.icon} Booked: ${f.name}, ${formatDay(date)} · ${slotLabel(slot)}`, 'success');
    } catch (e) {
      toast((e as Error).message, 'warn');
    }
    setBusy(false);
  };
  const cancel = (b: FacilityBooking) => {
    void api.cancelBooking(b.id, me.id);
    toast('Booking cancelled');
  };

  return (
    <div>
      <PanelHeader
        title="Facilities"
        subtitle={staff ? 'Bookings across Elmina Green' : 'Free for residents · book up to 7 days ahead'}
        onClose={onClose}
        icon="🏸"
      />
      <div className="space-y-5 p-5">
        <div className="grid grid-cols-3 gap-2">
          {FACILITIES.map((x) => (
            <button
              key={x.id}
              type="button"
              aria-pressed={fid === x.id}
              onClick={() => setFid(x.id)}
              className={`flex flex-col items-center gap-1 rounded-2xl p-3 text-xs font-bold transition ${
                fid === x.id
                  ? 'bg-tool-500 text-white shadow-md'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-2xl">{x.icon}</span>
              {x.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-leaf-50 px-3 py-2 text-xs text-leaf-700">
          <span className="min-w-0 flex-1">{f.rules}</span>
          <button
            type="button"
            className="flex shrink-0 items-center gap-1 font-bold"
            onClick={() => {
              onClose();
              flyToLocation(f.where());
            }}
          >
            <MapPin className="h-3.5 w-3.5" /> Map
          </button>
        </div>

        <div className="scroll-thin -mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1">
          {days.map((d, i) => (
            <button
              key={d}
              type="button"
              aria-pressed={date === d}
              onClick={() => setDate(d)}
              className={`flex w-16 shrink-0 flex-col items-center rounded-xl py-2 text-xs font-bold ${
                date === d ? 'bg-charcoal-800 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <span className="opacity-70">{i === 0 ? 'Today' : formatDay(d).split(',')[0]}</span>
              <span className="text-base">{d.slice(8)}</span>
            </button>
          ))}
        </div>

        <div>
          <SectionTitle>{formatDay(date)}</SectionTitle>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {f.slots.map((slot) => {
              const b = today.find((x) => x.slot === slot);
              const past = malaysiaInstant(date, slot).getTime() < now;
              const mine = b?.userId === me.id;
              const who = b ? users.find((u) => u.id === b.userId) : undefined;
              return (
                <li key={slot}>
                  <div
                    className={`flex h-full flex-col rounded-xl p-2.5 text-sm ring-1 ${
                      mine
                        ? 'bg-leaf-50 ring-leaf-500'
                        : b
                          ? 'bg-gray-50 ring-black/5'
                          : past
                            ? 'bg-white text-gray-300 ring-black/5'
                            : 'bg-white ring-black/10'
                    }`}
                  >
                    <span className="font-bold">
                      {slotLabel(slot)} – {slotLabel(slotEnd(slot, f.hours))}
                    </span>
                    {b ? (
                      <span className="mt-0.5 flex items-center justify-between gap-1 text-xs">
                        <span className={`truncate ${mine ? 'font-bold text-leaf-700' : 'text-gray-500'}`}>
                          {mine ? 'Yours ✓' : staff ? `${who?.name} · ${who?.unitId}` : 'Booked'}
                        </span>
                        {(mine || staff) && !past && (
                          <button
                            type="button"
                            onClick={() => cancel(b)}
                            className="grid h-6 w-6 shrink-0 place-items-center rounded-full hover:bg-black/5"
                            aria-label={`Cancel ${slotLabel(slot)} booking`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </span>
                    ) : staff ? (
                      <span className="mt-0.5 text-xs text-gray-400">{past ? 'Past' : 'Free'}</span>
                    ) : (
                      <button
                        type="button"
                        disabled={past || busy || iHaveOne}
                        onClick={() => book(slot)}
                        className="mt-1 rounded-lg bg-tool-500 py-1 text-xs font-bold text-white disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        {past ? 'Past' : 'Book'}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {iHaveOne && !staff && (
            <p className="mt-2 text-xs text-gray-500">
              One booking per facility per day, so others get a turn.
            </p>
          )}
        </div>

        <section>
          <SectionTitle>{staff ? 'Upcoming bookings' : 'My bookings'}</SectionTitle>
          {upcoming.length === 0 ? (
            <Empty icon="📅">No upcoming bookings.</Empty>
          ) : (
            <ul className="divide-y divide-gray-100">
              {upcoming.map((b) => {
                const m = facilityMeta(b.facilityId);
                return (
                  <li key={b.id} className="flex items-center gap-3 py-2">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gray-100 text-lg">
                      {m.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{m.name}</span>
                      <span className="block truncate text-xs text-gray-500">
                        {formatDay(b.date)} · {slotLabel(b.slot)}–{slotLabel(slotEnd(b.slot, m.hours))}
                        {staff && ` · ${displayName(users.find((u) => u.id === b.userId))}`}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => cancel(b)}
                      className="text-xs font-bold text-sos-600"
                    >
                      Cancel
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
