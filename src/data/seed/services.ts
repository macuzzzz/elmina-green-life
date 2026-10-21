import type {
  CommunityEvent,
  FacilityBooking,
  FeeStatement,
  Listing,
  LostFoundItem,
  Parcel,
  Poll,
  VisitorPass,
} from '@/types';
import { PRECINCT_BY_ID } from '@/data/township';
import { malaysiaDate, malaysiaInstant } from '@/lib/time';
import { VENUES } from '@/features/services/meta';
import { DEMO_GUARD_ID, DEMO_MANAGER_ID, DEMO_RESIDENT_ID, SEED_USERS } from './users';

// Like content.ts, everything is relative to "now" so the demo looks fresh after a reset.
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
const day = (offset: number) => malaysiaDate(new Date(), offset);
const at = (offset: number, time: string) => malaysiaInstant(day(offset), time).toISOString();
const venue = (name: string) => VENUES.find((v) => v.name === name)!;

export function seedBookings(): FacilityBooking[] {
  const b = (
    id: string,
    facilityId: FacilityBooking['facilityId'],
    userId: string,
    offset: number,
    slot: string,
  ): FacilityBooking => ({ id, facilityId, userId, date: day(offset), slot, createdAt: ago(600) });
  return [
    b('b1', 'badminton', DEMO_RESIDENT_ID, 1, '20:00'),
    b('b2', 'badminton', 'u-farid', 0, '20:00'),
    b('b3', 'badminton', 'u-kumar', 1, '08:00'),
    b('b4', 'bbq', 'u-weiling', 2, '19:00'),
    b('b5', 'hall', 'u-sarah', 5, '14:00'),
    b('b6', 'badminton', 'u-jason', 2, '21:00'),
  ];
}

export function seedVisitors(): VisitorPass[] {
  const today = day(0);
  return [
    {
      id: 'v1',
      unitId: 'EG18-031',
      visitorName: 'Grab delivery',
      plate: 'WXY 2231',
      date: today,
      code: 'WALKIN',
      status: 'checked-in',
      createdAt: ago(25),
      checkedInAt: ago(25),
    },
    {
      id: 'v2',
      hostId: DEMO_RESIDENT_ID,
      unitId: 'EG18-028',
      visitorName: 'Aunty Lim',
      plate: 'BKL 8812',
      date: today,
      code: 'EG4K7P',
      status: 'checked-in',
      createdAt: ago(1440),
      checkedInAt: ago(60),
    },
    {
      id: 'v3',
      hostId: 'u-kumar',
      unitId: 'EG18-062',
      visitorName: 'Aircon contractor',
      plate: 'VDE 5120',
      date: today,
      code: 'EG9TQ3',
      status: 'checked-in',
      createdAt: ago(900),
      checkedInAt: ago(95),
    },
    {
      id: 'v4',
      unitId: 'EG18-095',
      visitorName: 'Lalamove',
      plate: 'BQR 7741',
      date: today,
      code: 'WALKIN',
      status: 'checked-out',
      createdAt: ago(110),
      checkedInAt: ago(110),
      checkedOutAt: ago(100),
    },
    {
      id: 'v5',
      hostId: 'u-sarah',
      unitId: 'EG18-012',
      visitorName: 'Jenny Tan',
      plate: 'WXY 1234',
      date: today,
      code: 'EG2HMR',
      status: 'expected',
      createdAt: ago(60),
    },
    {
      id: 'v6',
      hostId: DEMO_RESIDENT_ID,
      unitId: 'EG18-028',
      visitorName: 'Uncle Robert',
      plate: 'VKA 3388',
      date: day(1),
      code: 'EG6WXN',
      status: 'expected',
      createdAt: ago(30),
    },
  ];
}

export function seedEvents(): CommunityEvent[] {
  const e = (
    id: string,
    icon: string,
    title: string,
    description: string,
    venueName: string,
    offset: number,
    start: string,
    end: string,
    rsvps: string[],
    capacity?: number,
  ): CommunityEvent => ({
    id,
    icon,
    title,
    description,
    venue: venueName,
    location: venue(venueName).where(),
    startsAt: at(offset, start),
    endsAt: at(offset, end),
    organiserId: DEMO_MANAGER_ID,
    rsvps,
    capacity,
    createdAt: ago(4000),
  });
  return [
    e(
      'e1',
      '🏸',
      'Badminton social night',
      'Friendly doubles for all levels. Bring your own racquet — shuttles provided.',
      'Badminton court, EG18',
      1,
      '20:00',
      '22:00',
      ['u-farid', 'u-daniel-eg21', 'u-jason', 'u-kumar'],
      16,
    ),
    e(
      'e2',
      '🧹',
      'Gotong-royong at the central lake',
      'Community clean-up around the lake. Gloves, bags and breakfast provided!',
      'Central lake',
      3,
      '08:00',
      '11:00',
      ['u-aisyah', 'u-sarah', 'u-priya', 'u-hafiz', 'u-zul', 'u-lina', 'u-irfan'],
    ),
    e(
      'e3',
      '🎨',
      'Kids’ art & craft morning',
      'Painting and recycled crafts for ages 4–10. Parents stay with their kids, please.',
      'Community hall',
      6,
      '10:00',
      '12:00',
      ['u-weiling', 'u-chloe', 'u-deepa'],
      20,
    ),
    e(
      'e4',
      '🪔',
      'Deepavali light-up',
      'Kolam drawing, oil lamps and murukku with neighbours. Everyone welcome!',
      'Pocket park, EG18',
      9,
      '19:30',
      '22:00',
      ['u-priya', 'u-deepa', 'u-arjun', 'u-ravi', 'u-kumar'],
    ),
    e(
      'e5',
      '🩺',
      'Free health screening',
      'Blood pressure, glucose and BMI checks by the nearby klinik. No appointment needed.',
      'Community hall',
      12,
      '09:00',
      '13:00',
      ['u-salmah', 'u-rosnah'],
    ),
    e(
      'e6',
      '🍲',
      'Durian & potluck evening',
      'Thanks to everyone who came — see you at the next one!',
      'BBQ & gazebo, EG18',
      -3,
      '18:00',
      '21:00',
      ['u-hafiz', 'u-aisyah', 'u-farid', 'u-sarah', DEMO_RESIDENT_ID],
    ),
  ];
}

export function seedParcels(): Parcel[] {
  const p = (
    id: string,
    unitId: string,
    courier: string,
    minutes: number,
    collectedMinutes?: number,
    note?: string,
  ): Parcel => ({
    id,
    unitId,
    courier,
    note,
    loggedBy: DEMO_GUARD_ID,
    loggedAt: ago(minutes),
    collectedAt: collectedMinutes === undefined ? undefined : ago(collectedMinutes),
  });
  return [
    p('pc1', 'EG18-028', 'Shopee Express', 170, undefined, 'Medium box'),
    p('pc2', 'EG18-031', 'J&T Express', 90),
    p('pc3', 'EG18-062', 'Pos Laju', 240, undefined, 'Registered letter'),
    p('pc4', 'EG18-028', 'Lazada', 1500, 1380),
    p('pc5', 'EG18-012', 'Ninja Van', 700, 520),
    p('pc6', 'EG18-077', 'DHL', 45, undefined, 'Fragile'),
  ];
}

// ── maintenance fees ─────────────────────────────────────────────

const SERVICE_CHARGE: Record<string, number> = {
  DSLH: 95,
  DSSD: 140,
  RSKU: 45,
  SHOP: 120,
  AFFORDABLE_SHOP: 60,
};

function shiftPeriod(period: string, months: number) {
  const [y, m] = period.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + months, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Small stable hash so the same units are always "paid" after a reset. */
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

export function seedFees(): FeeStatement[] {
  const current = day(0).slice(0, 7);
  const units = [...new Set(SEED_USERS.map((u) => u.unitId).filter((u): u is string => !!u))];
  const out: FeeStatement[] = [];
  for (const unitId of units) {
    const precinctId = unitId.split('-')[0];
    const kind = PRECINCT_BY_ID[precinctId]?.kind ?? 'DSLH';
    const charge = SERVICE_CHARGE[kind] ?? 95;
    const items = [
      { label: 'Service charge', amount: charge },
      { label: 'Sinking fund (10%)', amount: +(charge * 0.1).toFixed(2) },
      ...(precinctId === 'EG18' ? [{ label: 'Guarded & gated security', amount: 40 }] : []),
    ];
    for (const back of [2, 1, 0]) {
      const period = shiftPeriod(current, -back);
      const h = hash(unitId + period);
      // Older months are mostly settled; the current one is about 55% paid.
      const paid =
        unitId === 'EG18-028' ? back > 0 : back === 0 ? h % 20 < 11 : back === 1 ? h % 10 < 8 : true;
      out.push({
        id: `f-${unitId}-${period}`,
        unitId,
        period,
        items,
        dueDate: `${period}-28`,
        paidAt: paid
          ? malaysiaInstant(`${period}-${String(5 + (h % 18)).padStart(2, '0')}`, '10:00').toISOString()
          : undefined,
        reference: paid ? `EGR${String(h % 1_000_000).padStart(6, '0')}` : undefined,
      });
    }
  }
  return out;
}

// ── swap corner, lost & found, polls ─────────────────────────────

export function seedListings(): Listing[] {
  const l = (
    id: string,
    authorId: string,
    kind: Listing['kind'],
    title: string,
    description: string,
    minutes: number,
    extra: Partial<Listing> = {},
  ): Listing => ({
    id,
    authorId,
    kind,
    title,
    description,
    status: 'available',
    createdAt: ago(minutes),
    ...extra,
  });
  return [
    l(
      'l1',
      'u-aisyah',
      'giveaway',
      'Baby stroller',
      'Foldable, light wear. Our little one has outgrown it.',
      80,
    ),
    l(
      'l2',
      'u-jason',
      'sale',
      'Ergonomic office chair',
      'Mesh back, adjustable arms. Self-collect EG18.',
      300,
      {
        price: 60,
      },
    ),
    l(
      'l3',
      'u-weiling',
      'swap',
      'Kids’ books (age 5–8)',
      'About 20 picture books — happy to swap for puzzles.',
      520,
    ),
    l('l4', 'u-kumar', 'giveaway', 'Potted pandan plants', 'Have extra cuttings, 4 pots available.', 1300),
    l('l5', 'u-chloe', 'sale', 'White bookshelf', '5 tiers, 180cm. Must go this weekend.', 2000, {
      price: 45,
      status: 'reserved',
    }),
  ];
}

export function seedLostFound(): LostFoundItem[] {
  const i = (
    id: string,
    authorId: string,
    kind: LostFoundItem['kind'],
    title: string,
    description: string,
    where: string,
    minutes: number,
    resolved = false,
  ): LostFoundItem => ({ id, authorId, kind, title, description, where, resolved, createdAt: ago(minutes) });
  return [
    i('lf1', 'u-amira', 'lost', 'Blue umbrella', 'Navy blue, wooden handle.', 'Near the gazebo, EG18', 240),
    i(
      'lf2',
      'u-priya',
      'found',
      'Friendly ginger cat',
      'Has a red collar, no tag. Staying with me for now.',
      'EG18 main gate',
      600,
    ),
    i(
      'lf3',
      'u-farid',
      'found',
      'Car key (Proton)',
      'Handed it to the guardhouse.',
      'Badminton court, EG18',
      900,
    ),
    i(
      'lf4',
      'u-lina',
      'lost',
      'Pink water bottle',
      'Kid’s bottle with unicorn stickers.',
      'Playground, EG18',
      3000,
      true,
    ),
  ];
}

export function seedPolls(): Poll[] {
  const opts = (labels: string[], votes: string[][]) =>
    labels.map((label, i) => ({ id: `o${i + 1}`, label, votes: votes[i] ?? [] }));
  return [
    {
      id: 'poll1',
      authorId: DEMO_MANAGER_ID,
      question: 'Which time works best for the monthly gotong-royong?',
      options: opts(
        ['Saturday 8am', 'Sunday 8am', 'Sunday 5pm'],
        [
          ['u-sarah', 'u-hafiz', 'u-jason'],
          ['u-aisyah', 'u-priya', 'u-zul', 'u-lina', 'u-irfan'],
          ['u-kumar', 'u-chloe'],
        ],
      ),
      targetPrecincts: [],
      closesAt: at(5, '23:59'),
      createdAt: ago(2000),
    },
    {
      id: 'poll2',
      authorId: DEMO_MANAGER_ID,
      question: 'Should EG18 add speed humps on the main loop road?',
      options: opts(
        ['Yes, please', 'No', 'Not sure'],
        [['u-amira', 'u-kumar', 'u-weiling', 'u-nadia'], ['u-jason'], ['u-farid']],
      ),
      targetPrecincts: ['EG18'],
      closesAt: at(3, '23:59'),
      createdAt: ago(900),
    },
    {
      id: 'poll3',
      authorId: DEMO_MANAGER_ID,
      question: 'Would you join a Friday night market at the EG15 shop lots?',
      options: opts(
        ['Yes, every week', 'Once a month', 'Not interested'],
        [
          ['u-mei', 'u-alex', 'u-sofia', 'u-sarah', DEMO_RESIDENT_ID, 'u-aisyah'],
          ['u-ken', 'u-boon', 'u-hafiz'],
          ['u-eric'],
        ],
      ),
      targetPrecincts: [],
      closesAt: ago(2 * 1440),
      createdAt: ago(9 * 1440),
    },
  ];
}
