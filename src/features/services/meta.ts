import type { FacilityId, ListingKind, MapLocation, VisitorPass, VisitorStatus } from '@/types';
import { getLayout } from '@/world/layout';
import { cameraController } from '@/world/cameraController';

export type ServiceId =
  'facilities' | 'visitors' | 'events' | 'parcels' | 'fees' | 'swap' | 'lostfound' | 'polls';

/** The community services (the old §5.8 "Coming soon" backlog), in menu order. */
export const SERVICES: { id: ServiceId; label: string; icon: string; blurb: string }[] = [
  { id: 'facilities', label: 'Facility booking', icon: '🏸', blurb: 'Badminton, BBQ & hall' },
  { id: 'visitors', label: 'Visitor passes', icon: '🪪', blurb: 'QR passes for the gate' },
  { id: 'events', label: 'Events & RSVPs', icon: '📅', blurb: 'What’s on in Elmina Green' },
  { id: 'parcels', label: 'Parcel log', icon: '📦', blurb: 'Deliveries at the guardhouse' },
  { id: 'fees', label: 'Maintenance fees', icon: '🧾', blurb: 'Monthly statements' },
  { id: 'swap', label: 'Swap corner', icon: '🛍️', blurb: 'Give away, swap or sell' },
  { id: 'lostfound', label: 'Lost & found', icon: '🔎', blurb: 'Reunite things with owners' },
  { id: 'polls', label: 'Polls & surveys', icon: '📊', blurb: 'Have your say' },
];
export const serviceMeta = (id: ServiceId) => SERVICES.find((s) => s.id === id)!;

const spot = (x: number, z: number, precinctId?: string): MapLocation => ({ x, z, precinctId });

function hall() {
  const h = getLayout().civic.find((c) => c.id === 'hall-eg3');
  return spot(h?.x ?? 0, h?.z ?? 0);
}

// ── facilities ────────────────────────────────────────────────────

export interface Facility {
  id: FacilityId;
  name: string;
  icon: string;
  /** Slot length in hours. */
  hours: number;
  slots: string[];
  rules: string;
  where: () => MapLocation;
}

export const FACILITIES: Facility[] = [
  {
    id: 'badminton',
    name: 'Badminton court',
    icon: '🏸',
    hours: 1,
    slots: Array.from({ length: 14 }, (_, i) => `${String(8 + i).padStart(2, '0')}:00`),
    rules: 'EG18 court · 1 hour per booking · lights on after 7pm',
    where: () => {
      const b = getLayout().heroFacilities.badminton;
      return spot(b.x, b.z, 'EG18');
    },
  },
  {
    id: 'bbq',
    name: 'BBQ & gazebo',
    icon: '🍢',
    hours: 3,
    slots: ['11:00', '15:00', '19:00'],
    rules: 'EG18 gazebo · 3-hour blocks · please clear the pit after use',
    where: () => {
      const g = getLayout().heroFacilities.gazebo;
      return spot(g.x, g.z, 'EG18');
    },
  },
  {
    id: 'hall',
    name: 'Community hall',
    icon: '🏛️',
    hours: 4,
    slots: ['09:00', '14:00', '19:00'],
    rules: '4-hour blocks · up to 80 guests · no cooking inside',
    where: hall,
  },
];
export const facilityMeta = (id: FacilityId) => FACILITIES.find((f) => f.id === id)!;

/** "08:00" + 3h → "11:00". */
export function slotEnd(slot: string, hours: number) {
  const h = Number(slot.slice(0, 2)) + hours;
  return `${String(h).padStart(2, '0')}:${slot.slice(3)}`;
}

/** "19:00" → "7 PM". */
export function slotLabel(slot: string) {
  const h = Number(slot.slice(0, 2));
  const m = slot.slice(3);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m === '00' ? '' : `:${m}`} ${h < 12 ? 'AM' : 'PM'}`;
}

// ── events ────────────────────────────────────────────────────────

export const VENUES: { name: string; where: () => MapLocation }[] = [
  {
    name: 'Pocket park, EG18',
    where: () => {
      const p = getLayout().heroFacilities.pocketPark;
      return spot(p.x, p.z, 'EG18');
    },
  },
  {
    name: 'Playground, EG18',
    where: () => {
      const p = getLayout().heroFacilities.playground;
      return spot(p.x, p.z, 'EG18');
    },
  },
  { name: 'Badminton court, EG18', where: () => facilityMeta('badminton').where() },
  { name: 'BBQ & gazebo, EG18', where: () => facilityMeta('bbq').where() },
  { name: 'Community hall', where: hall },
  {
    name: 'Central lake',
    where: () => {
      const l = getLayout().lakes.find((x) => x.fountain) ?? getLayout().lakes[0];
      return spot(l.center[0], l.center[1]);
    },
  },
];

export const EVENT_ICONS = ['🎉', '🧹', '🏃', '🍲', '🎨', '🏸', '🌳', '🏮', '🪔', '🎄', '📚', '🩺'];

// ── visitors ──────────────────────────────────────────────────────

export const VISITOR_STATUS: Record<VisitorStatus, { label: string; cls: string }> = {
  expected: { label: 'Expected', cls: 'bg-amber-100 text-amber-700' },
  'checked-in': { label: 'Checked in', cls: 'bg-emerald-100 text-emerald-700' },
  'checked-out': { label: 'Left', cls: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-400' },
};

/** What the QR pass encodes; guards can also type the short code. */
export const passPayload = (v: VisitorPass) => `ELMINA-GREEN-PASS:${v.code}:${v.unitId}:${v.date}`;

// ── parcels ───────────────────────────────────────────────────────

export const COURIERS = [
  'Shopee Express',
  'J&T Express',
  'Pos Laju',
  'Ninja Van',
  'DHL',
  'Lazada',
  'GDex',
  'Food / grocery',
  'Other',
];

// ── fees ──────────────────────────────────────────────────────────

export const feeTotal = (items: { amount: number }[]) => items.reduce((a, b) => a + b.amount, 0);
export const rm = (n: number) => `RM ${n.toFixed(2)}`;

/** "2026-10" → "October 2026". */
export function periodLabel(period: string) {
  return new Date(`${period}-15T12:00:00+08:00`).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kuala_Lumpur',
  });
}

// ── swap corner ───────────────────────────────────────────────────

export const LISTING_KINDS: { id: ListingKind; label: string; icon: string; cls: string }[] = [
  { id: 'giveaway', label: 'Free', icon: '🎁', cls: 'bg-leaf-50 text-leaf-700' },
  { id: 'swap', label: 'Swap', icon: '🔄', cls: 'bg-sky-100 text-sky-700' },
  { id: 'sale', label: 'For sale', icon: '🏷️', cls: 'bg-amber-100 text-amber-700' },
];
export const listingMeta = (k: ListingKind) => LISTING_KINDS.find((x) => x.id === k)!;

// ─────────────────────────────────────────────────────────────────

/** Filter / toggle chip, as used for announcement targets. */
export const chipCls = (on: boolean) =>
  `rounded-full px-3 py-1.5 text-xs font-bold ${on ? 'bg-tool-500 text-white' : 'bg-gray-100 text-gray-600'}`;

export function flyToLocation(loc: MapLocation, dist = 170) {
  cameraController.flyTo({ x: loc.x, z: loc.z }, { dist });
}
