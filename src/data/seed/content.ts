import type {
  Announcement,
  AppNotification,
  Channel,
  Incident,
  IncidentStatus,
  Message,
  Post,
  RepairRequest,
  StatusChange,
  Suggestion,
} from '@/types';
import { getLayout } from '@/world/layout';
import { DEMO_GUARD_ID, DEMO_MANAGER_ID, DEMO_RESIDENT_ID } from './users';

// Timestamps are relative to "now" when the seed is first created, so the demo
// always looks fresh after a reset.
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

function at(unitId: string, dx = 0, dz = 0) {
  const lot = getLayout().unitMap.get(unitId);
  return { x: (lot?.x ?? 0) + dx, z: (lot?.z ?? 0) + dz, unitId, precinctId: unitId.split('-')[0] };
}

export function seedPosts(): Post[] {
  const p = (
    id: string,
    authorId: string,
    text: string,
    minutes: number,
    extra: Partial<Post> = {},
  ): Post => ({
    id,
    authorId,
    text,
    createdAt: ago(minutes),
    reactions: [],
    replies: [],
    ...extra,
  });
  return [
    p('p1', 'u-sarah', 'Beautiful weather today! ☀️', 2, {
      reactions: [
        { userId: 'u-aisyah', kind: 'love' },
        { userId: 'u-hafiz', kind: 'like' },
      ],
    }),
    p('p2', 'u-daniel-eg21', 'Anyone free for badminton tonight? 🏸', 15, {
      replies: [
        { id: 'r1', postId: 'p2', authorId: 'u-farid', text: 'Count me in! 8pm?', createdAt: ago(10) },
      ],
    }),
    p('p3', 'u-alex', 'Road maintenance tomorrow. Prepare ya! 🚧', 60),
    p('p4', 'u-mei', 'The new café at EG15 looks great! Can’t wait! ☕', 120, {
      reactions: [{ userId: 'u-weiling', kind: 'wow' }],
    }),
    p('p5', 'u-ken', 'Recommended plumber? Having some water pressure issue.', 180),
    p('p6', 'u-sofia', 'Sunset view from the park today! 🌅', 300),
    p('p7', 'u-weiling', 'Kids loved the new playground slide 🛝', 420, {
      reactions: [
        { userId: 'u-priya', kind: 'love' },
        { userId: 'u-sarah', kind: 'love' },
      ],
    }),
    p('p8', 'u-priya', 'Found a cat near EG18 gate, very friendly 🐱 owner?', 600),
    p('p9', 'u-aisyah', 'Kuih for anyone who wants, outside my gate 🍡', 35),
    p('p10', 'u-kumar', 'Morning jog round the lake 🏃', 90),
    p('p11', 'u-amira', 'Lost a blue umbrella near the gazebo ☂️', 240),
    p('p12', 'u-hafiz', 'Durian season is here 😋', 50),
    p('p13', 'u-jason', 'Who parked across my gate again 😅', 75, { reportedBy: ['u-kumar'] }),
  ];
}

export function seedAnnouncements(): Announcement[] {
  return [
    {
      id: 'a1',
      authorId: DEMO_MANAGER_ID,
      title: 'Grass cutting schedule',
      body: 'Landscaping contractors will be in EG18 and EG21 on Thursday, 9am–1pm.',
      targetPrecincts: ['EG18', 'EG21'],
      publishedAt: ago(240),
    },
    {
      id: 'a2',
      authorId: DEMO_MANAGER_ID,
      title: 'Water disruption notice',
      body: 'Air Selangor scheduled maintenance this Saturday 10pm–4am. Please store water.',
      targetPrecincts: [],
      publishedAt: ago(1440),
    },
    {
      id: 'a3',
      authorId: DEMO_MANAGER_ID,
      title: 'Gotong-royong at the central lake',
      body: 'Join us Sunday 8am for a community clean-up. Breakfast provided!',
      targetPrecincts: [],
      publishedAt: ago(2880),
    },
  ];
}

function history<S extends string>(steps: [S, number, string, string?][]): StatusChange<S>[] {
  return steps.map(([status, minutes, byUserId, note]) => ({ status, at: ago(minutes), byUserId, note }));
}

export function seedIncidents(): Incident[] {
  const inc = (
    id: string,
    reporterId: string,
    category: Incident['category'],
    urgency: Incident['urgency'],
    description: string,
    location: Incident['location'],
    steps: [IncidentStatus, number, string, string?][],
  ): Incident => {
    const h = history(steps);
    return {
      id,
      reporterId,
      category,
      urgency,
      description,
      photos: [],
      location,
      status: h[h.length - 1].status,
      history: h,
      createdAt: h[0].at,
    };
  };
  return [
    inc(
      'i1',
      DEMO_RESIDENT_ID,
      'streetlight',
      'medium',
      'Streetlight outside 030 keeps flickering at night.',
      at('EG18-030', 0, 18),
      [
        ['submitted', 2880, DEMO_RESIDENT_ID],
        ['acknowledged', 2700, DEMO_MANAGER_ID, 'Thanks Daniel, TNB contractor notified.'],
        ['in-progress', 1500, DEMO_MANAGER_ID, 'Contractor scheduled for tomorrow.'],
      ],
    ),
    inc(
      'i2',
      'u-kumar',
      'pothole',
      'medium',
      'Big pothole near the cross road, cars swerving.',
      at('EG18-063', 5, 20),
      [
        ['submitted', 600, 'u-kumar'],
        ['acknowledged', 420, DEMO_MANAGER_ID],
      ],
    ),
    inc(
      'i3',
      'u-amira',
      'fallen-tree',
      'urgent',
      'Branch fell across the road after the storm.',
      at('EG18-095', 0, 22),
      [
        ['submitted', 180, 'u-amira'],
        ['acknowledged', 170, DEMO_GUARD_ID, 'Guard on the way.'],
        ['in-progress', 120, DEMO_MANAGER_ID],
      ],
    ),
    inc(
      'i4',
      'u-sarah',
      'stray-animals',
      'low',
      'Pack of stray dogs near the playground in the evenings.',
      at('EG18-012', 30, -30),
      [['submitted', 1440, 'u-sarah']],
    ),
    inc('i5', 'u-hafiz', 'security', 'urgent', 'Unknown person checking car doors at 2am.', at('EG18-033'), [
      ['submitted', 300, 'u-hafiz'],
      ['acknowledged', 290, DEMO_GUARD_ID, 'Patrol dispatched, CCTV reviewed.'],
    ]),
    inc('i6', 'u-ken', 'flood', 'medium', 'Drain overflowing during heavy rain.', at('EG27A-011', 0, 20), [
      ['submitted', 4300, 'u-ken'],
      ['acknowledged', 4000, DEMO_MANAGER_ID],
      ['in-progress', 3000, DEMO_MANAGER_ID],
      ['resolved', 1600, DEMO_MANAGER_ID, 'Drain cleared and widened.'],
    ]),
    inc(
      'i7',
      'u-sofia',
      'dumping',
      'low',
      'Someone dumped old furniture by the bins.',
      at('EG3-007', 0, 20),
      [['submitted', 900, 'u-sofia']],
    ),
    inc('i8', 'u-boon', 'noise', 'low', 'Renovation noise on Sunday morning.', at('EG5-014'), [
      ['submitted', 5000, 'u-boon'],
      ['rejected', 4800, DEMO_MANAGER_ID, 'Renovation permit allows Sunday until 12pm.'],
    ]),
  ];
}

export function seedRepairs(): RepairRequest[] {
  const steps = history<RepairRequest['status']>([
    ['submitted', 4320, DEMO_RESIDENT_ID],
    ['under-review', 4000, DEMO_MANAGER_ID],
    ['contractor-assigned', 2900, DEMO_MANAGER_ID, 'Assigned to Hijau Plumbing Sdn Bhd.'],
  ]);
  return [
    {
      id: 'rp1',
      requesterId: DEMO_RESIDENT_ID,
      scope: 'unit',
      category: 'plumbing',
      description: 'Low water pressure in upstairs bathroom.',
      photos: [],
      location: at('EG18-028'),
      preferredSlots: ['Sat morning', 'Mon evening'],
      status: 'contractor-assigned',
      history: steps,
      contractor: 'Hijau Plumbing Sdn Bhd',
      createdAt: steps[0].at,
    },
    {
      id: 'rp2',
      requesterId: 'u-weiling',
      scope: 'unit',
      category: 'roof-leak',
      description: 'Ceiling stain after rain, suspect roof tile.',
      photos: [],
      location: at('EG18-026'),
      preferredSlots: ['Weekday morning'],
      status: 'submitted',
      history: history([['submitted', 200, 'u-weiling']]),
      createdAt: ago(200),
    },
  ];
}

export function seedSuggestions(): Suggestion[] {
  const s = (
    id: string,
    authorId: string,
    item: Suggestion['item'],
    reason: string,
    location: Suggestion['location'],
    votes: string[],
    status: Suggestion['status'] = 'open',
    managementReply?: string,
  ): Suggestion => ({
    id,
    authorId,
    item,
    reason,
    location,
    rotation: 0,
    votes,
    status,
    managementReply,
    createdAt: ago(3000),
  });
  return [
    s(
      's1',
      'u-aisyah',
      'bench',
      'Shade bench near the playground for parents.',
      at('EG18-040', 75, 10),
      ['u-sarah', 'u-priya', 'u-weiling', 'u-nadia'],
      'approved',
      'Approved! Installation next month.',
    ),
    s(
      's2',
      'u-kumar',
      'speed-bump',
      'Cars speed along this straight road.',
      at('EG18-065', 0, 20),
      ['u-amira', 'u-jason', 'u-lina'],
      'under-consideration',
      'Checking with traffic consultant.',
    ),
    s('s3', DEMO_RESIDENT_ID, 'cctv', 'Blind corner near the back lane.', at('EG18-021', -14, 0), [
      'u-farid',
      'u-hafiz',
    ]),
    s('s4', 'u-priya', 'tree', 'More shade along the walkway.', at('EG18-047', 0, 20), ['u-chloe']),
    s('s5', 'u-zul', 'bin', 'Recycling bin near the gazebo.', at('EG18-080', 70, 0), [
      'u-irfan',
      'u-deepa',
      'u-lina',
    ]),
    s(
      's6',
      'u-ravi',
      'crossing',
      'Pedestrian crossing to the mosque.',
      at('EG18-008', 0, -40),
      [],
      'not-planned',
      'Road is too narrow here — looking at an alternative spot.',
    ),
  ];
}

export function seedChannels(): Channel[] {
  return [
    {
      id: 'c-guard-daniel',
      kind: 'guardhouse',
      memberIds: [DEMO_RESIDENT_ID, DEMO_GUARD_ID],
      title: 'Guardhouse EG18',
    },
    {
      id: 'c-mgmt-daniel',
      kind: 'management',
      memberIds: [DEMO_RESIDENT_ID, DEMO_MANAGER_ID],
      title: 'Management Office',
    },
    {
      id: 'c-guard-sarah',
      kind: 'guardhouse',
      memberIds: ['u-sarah', DEMO_GUARD_ID],
      title: 'Guardhouse EG18',
    },
  ];
}

export function seedMessages(): Message[] {
  const m = (
    id: string,
    channelId: string,
    authorId: string,
    text: string,
    minutes: number,
    readBy: string[],
  ): Message => ({
    id,
    channelId,
    authorId,
    text,
    createdAt: ago(minutes),
    readBy,
  });
  return [
    m('m1', 'c-guard-daniel', DEMO_RESIDENT_ID, 'Expecting a delivery from Shopee this afternoon.', 300, [
      DEMO_RESIDENT_ID,
      DEMO_GUARD_ID,
    ]),
    m('m2', 'c-guard-daniel', DEMO_GUARD_ID, 'Noted Encik Daniel, we will let the rider in. 👍', 296, [
      DEMO_RESIDENT_ID,
      DEMO_GUARD_ID,
    ]),
    m(
      'm3',
      'c-mgmt-daniel',
      DEMO_MANAGER_ID,
      'Hi Daniel, your plumbing repair has been assigned to Hijau Plumbing.',
      2900,
      [DEMO_MANAGER_ID],
    ),
    m('m4', 'c-guard-sarah', 'u-sarah', 'Visitor arriving at 7pm, plate WXY 1234.', 60, ['u-sarah']),
  ];
}

export function seedNotifications(): AppNotification[] {
  return [
    {
      id: 'n1',
      userId: DEMO_RESIDENT_ID,
      title: 'Repair update',
      body: 'Contractor assigned to your plumbing request.',
      createdAt: ago(2900),
      read: false,
      link: { kind: 'repair', id: 'rp1' },
    },
    {
      id: 'n2',
      userId: DEMO_RESIDENT_ID,
      title: 'Report in progress',
      body: 'Streetlight out — contractor scheduled for tomorrow.',
      createdAt: ago(1500),
      read: false,
      link: { kind: 'incident', id: 'i1' },
    },
  ];
}
