import type {
  Announcement,
  AppNotification,
  Channel,
  CommunityEvent,
  FacilityBooking,
  FeeStatement,
  Incident,
  Listing,
  LostFoundItem,
  Message,
  Parcel,
  Poll,
  Post,
  RepairRequest,
  Role,
  Session,
  Suggestion,
  User,
  VisitorPass,
} from '@/types';
import { DEMO_GUARD_ID, DEMO_MANAGER_ID, DEMO_RESIDENT_ID, SEED_USERS } from '@/data/seed/users';
import {
  seedAnnouncements,
  seedChannels,
  seedIncidents,
  seedMessages,
  seedNotifications,
  seedPosts,
  seedRepairs,
  seedSuggestions,
} from '@/data/seed/content';
import {
  seedBookings,
  seedEvents,
  seedFees,
  seedListings,
  seedLostFound,
  seedParcels,
  seedPolls,
  seedVisitors,
} from '@/data/seed/services';
import { facilityMeta } from '@/features/services/meta';
import { randomAvatar } from '@/features/avatar/avatarParts';
import type { Api, ApiEvent, Collection } from './api';

const DB_KEY = 'egl.db.v2';
const SESSION_KEY = 'egl.session.v1';
const PRESENCE_KEY = 'egl.presence.v1';
const CHANNEL = 'egl-sync';

interface Db {
  users: User[];
  posts: Post[];
  announcements: Announcement[];
  incidents: Incident[];
  repairs: RepairRequest[];
  suggestions: Suggestion[];
  channels: Channel[];
  messages: Message[];
  notifications: AppNotification[];
  bookings: FacilityBooking[];
  visitors: VisitorPass[];
  events: CommunityEvent[];
  parcels: Parcel[];
  fees: FeeStatement[];
  listings: Listing[];
  lostFound: LostFoundItem[];
  polls: Poll[];
}

function freshDb(): Db {
  return {
    users: structuredClone(SEED_USERS),
    posts: seedPosts(),
    announcements: seedAnnouncements(),
    incidents: seedIncidents(),
    repairs: seedRepairs(),
    suggestions: seedSuggestions(),
    channels: seedChannels(),
    messages: seedMessages(),
    notifications: seedNotifications(),
    bookings: seedBookings(),
    visitors: seedVisitors(),
    events: seedEvents(),
    parcels: seedParcels(),
    fees: seedFees(),
    listings: seedListings(),
    lostFound: seedLostFound(),
    polls: seedPolls(),
  };
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage unavailable or full — the demo still works in memory.
  }
}

function loadDb(): Db {
  const raw = safeGet(DB_KEY);
  if (raw) {
    try {
      return { ...freshDb(), ...(JSON.parse(raw) as Partial<Db>) };
    } catch {
      // fall through to a fresh seed
    }
  }
  return freshDb();
}

let db = loadDb();
const listeners = new Set<(e: ApiEvent) => void>();
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;

function emit(event: ApiEvent) {
  listeners.forEach((l) => l(event));
}

// Cross-tab sync. BroadcastChannel says *what* changed; the `storage` event fires
// only once the other tab's localStorage write is visible here, so we reload then.
// (Reloading on the BroadcastChannel message alone can read stale data.)
const pending = new Set<Collection>();
channel?.addEventListener('message', (msg: MessageEvent<ApiEvent>) => {
  if (msg.data.type === 'db-changed') pending.add(msg.data.collection);
  else emit(msg.data);
});
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== DB_KEY) return;
    db = loadDb();
    const changed: Collection[] = pending.size ? [...pending] : ['all'];
    pending.clear();
    changed.forEach((collection) => emit({ type: 'db-changed', collection }));
  });
}

/** Persist + notify this tab and every other open tab. */
function commit(...collections: Collection[]) {
  safeSet(DB_KEY, JSON.stringify(db));
  for (const collection of collections) {
    const event: ApiEvent = { type: 'db-changed', collection };
    emit(event);
    channel?.postMessage(event);
  }
}

const delay = <T>(value: T, ms = 40 + Math.random() * 90) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(structuredClone(value)), ms));

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const now = () => new Date().toISOString();

const DEMO_IDS: Record<Role, string> = {
  resident: DEMO_RESIDENT_ID,
  guard: DEMO_GUARD_ID,
  management: DEMO_MANAGER_ID,
};

const staffIds = (role: 'guard' | 'management') => db.users.filter((u) => u.role === role).map((u) => u.id);
const unitResidentIds = (unitId: string) =>
  db.users.filter((u) => u.role === 'resident' && u.unitId === unitId).map((u) => u.id);
const residentIdsIn = (precincts: string[]) =>
  db.users
    .filter(
      (u) =>
        u.role === 'resident' &&
        (precincts.length === 0 || precincts.includes(u.unitId?.split('-')[0] ?? '')),
    )
    .map((u) => u.id);
const firstName = (id: string) => db.users.find((u) => u.id === id)?.name.split(' ')[0] ?? 'A resident';

/** Gate code for a visitor pass, e.g. "EG7K2P" (no look-alike characters). */
function passCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code: string;
  do {
    code = 'EG' + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (db.visitors.some((v) => v.code === code));
  return code;
}

function notify(userIds: string[], title: string, body: string, link?: AppNotification['link']) {
  for (const userId of new Set(userIds)) {
    db.notifications.unshift({ id: uid('n'), userId, title, body, createdAt: now(), read: false, link });
  }
  db.notifications = db.notifications.slice(0, 300);
}

function setSession(session: Session | null) {
  safeSet(SESSION_KEY, session ? JSON.stringify(session) : null);
  emit({ type: 'session-changed' });
}

const STATUS_TEXT: Record<string, string> = {
  acknowledged: 'Acknowledged',
  'in-progress': 'In progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
  'under-review': 'Under review',
  'contractor-assigned': 'Contractor assigned',
  'inspection-scheduled': 'Inspection scheduled',
  completed: 'Completed',
  confirmed: 'Confirmed by resident',
  reopened: 'Reopened',
  'under-consideration': 'Under consideration',
  approved: 'Approved',
  'not-planned': 'Not planned',
};

// ── presence + auto-replies ──────────────────────────────────────

function staffOnline(role: 'guard' | 'management') {
  try {
    const p = JSON.parse(safeGet(PRESENCE_KEY) ?? '{}') as Record<string, number>;
    return Date.now() - (p[role] ?? 0) < 10_000;
  } catch {
    return false;
  }
}

function cannedReply(kind: 'guardhouse' | 'management', text: string) {
  const t = text.toLowerCase();
  if (kind === 'guardhouse') {
    if (t.includes('deliver') || t.includes('parcel'))
      return 'Noted! We will let the rider in and keep the parcel at the guardhouse if you are out. 📦';
    if (t.includes('visitor'))
      return 'Thanks for letting us know. Please share the car plate number so we can register the visitor. 🚗';
    if (t.includes('thank')) return 'Sama-sama! Have a good day. 😊';
    return 'Guardhouse here — received. A guard will attend to this shortly. 🛡️';
  }
  if (t.includes('repair') || t.includes('leak'))
    return 'Thank you. Please submit a Repair request from the toolbar so we can assign a contractor. 🔧';
  if (t.includes('thank')) return 'You are welcome! — Elmina Green Management';
  return 'Hi! Thanks for reaching out. Our team will reply within office hours (Mon–Fri 8.30am–5.30pm).';
}

// ─────────────────────────────────────────────────────────────────

export const mockApi: Api = {
  async getSession() {
    const raw = safeGet(SESSION_KEY);
    if (!raw) return null;
    try {
      const s = JSON.parse(raw) as Session;
      return db.users.some((u) => u.id === s.userId) ? s : null;
    } catch {
      return null;
    }
  },

  async login(email, password) {
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || password.length === 0) {
      await delay(null, 400);
      throw new Error('Unknown demo account. Use one of the "Try demo as…" buttons below.');
    }
    const session: Session = { userId: user.id, role: user.role };
    setSession(session);
    return delay(session, 300);
  },

  async loginAsDemo(role) {
    const session: Session = { userId: DEMO_IDS[role], role };
    setSession(session);
    return delay(session, 200);
  },

  async logout() {
    setSession(null);
  },

  // ── users ──
  listUsers: () => delay(db.users),

  async updateUser(id, patch) {
    const u = db.users.find((x) => x.id === id);
    if (!u) throw new Error('User not found');
    Object.assign(u, patch);
    commit('users');
    return delay(u);
  },

  async createResident(input) {
    const user: User = {
      id: uid('u'),
      name: input.name,
      role: 'resident',
      email: input.email,
      phone: input.phone,
      unitId: input.unitId,
      household: input.household,
      color: '#22c55e',
      avatar: randomAvatar(input.email),
      onboarded: false,
      privacy: { displayName: 'full', showUnitId: true, showAvatarOnMap: true, allowNeighbourDMs: true },
    };
    db.users.push(user);
    commit('users');
    return delay(user);
  },

  // ── feed ──
  listPosts: () => delay(db.posts),

  async createPost(authorId, text, photoUrl) {
    const post: Post = {
      id: uid('p'),
      authorId,
      text: text.slice(0, 80),
      photoUrl,
      createdAt: now(),
      reactions: [],
      replies: [],
    };
    db.posts.unshift(post);
    commit('posts');
    return delay(post);
  },

  async toggleReaction(postId, userId, kind) {
    const p = db.posts.find((x) => x.id === postId);
    if (!p) return;
    const mine = p.reactions.find((r) => r.userId === userId);
    p.reactions = p.reactions.filter((r) => r.userId !== userId);
    if (!mine || mine.kind !== kind) p.reactions.push({ userId, kind });
    commit('posts');
  },

  async reply(postId, authorId, text) {
    const p = db.posts.find((x) => x.id === postId);
    if (!p) return;
    p.replies.push({ id: uid('r'), postId, authorId, text, createdAt: now() });
    if (p.authorId !== authorId) {
      const who = db.users.find((u) => u.id === authorId)?.name.split(' ')[0] ?? 'A neighbour';
      notify([p.authorId], 'New reply', `${who}: ${text.slice(0, 60)}`, { kind: 'post', id: postId });
    }
    commit('posts', 'notifications');
  },

  async reportPost(postId, userId) {
    const p = db.posts.find((x) => x.id === postId);
    if (!p) return;
    p.reportedBy = [...new Set([...(p.reportedBy ?? []), userId])];
    notify(staffIds('management'), 'Post reported', `“${p.text.slice(0, 50)}” was reported`, {
      kind: 'post',
      id: postId,
    });
    commit('posts', 'notifications');
  },

  async moderatePost(postId, hidden) {
    const p = db.posts.find((x) => x.id === postId);
    if (!p) return;
    p.hidden = hidden;
    p.reportedBy = [];
    commit('posts');
  },

  // ── announcements ──
  listAnnouncements: () => delay(db.announcements),

  async createAnnouncement(authorId, input) {
    const a: Announcement = { id: uid('a'), authorId, ...input, publishedAt: now() };
    db.announcements.unshift(a);
    const targets = db.users.filter(
      (u) =>
        u.role === 'resident' &&
        (input.targetPrecincts.length === 0 || input.targetPrecincts.includes(u.unitId?.split('-')[0] ?? '')),
    );
    notify(
      targets.map((u) => u.id),
      `📢 ${input.title}`,
      input.body.slice(0, 80),
      { kind: 'announcement', id: a.id },
    );
    commit('announcements', 'notifications');
    return delay(a);
  },

  // ── incidents ──
  listIncidents: () => delay(db.incidents),

  async createIncident(reporterId, input) {
    const t = now();
    const incident: Incident = {
      id: uid('inc'),
      reporterId,
      ...input,
      status: 'submitted',
      history: [{ status: 'submitted', at: t, byUserId: reporterId }],
      createdAt: t,
    };
    db.incidents.unshift(incident);
    const who = db.users.find((u) => u.id === reporterId);
    notify(
      [...staffIds('guard'), ...staffIds('management')],
      input.isSOS ? '🚨 SOS from resident' : 'New incident report',
      `${who?.name ?? 'Resident'} · ${input.location.unitId ?? 'map pin'} · ${input.category}`,
      { kind: 'incident', id: incident.id },
    );
    commit('incidents', 'notifications');
    return delay(incident);
  },

  async updateIncident(id, byUserId, status, note) {
    const inc = db.incidents.find((x) => x.id === id);
    if (!inc) return;
    inc.status = status;
    inc.history.push({ status, at: now(), byUserId, note });
    if (status === 'rejected' && note) inc.rejectReason = note;
    notify(
      [inc.reporterId],
      `Report ${STATUS_TEXT[status] ?? status}`,
      note || `Your report is now ${STATUS_TEXT[status]}.`,
      {
        kind: 'incident',
        id,
      },
    );
    commit('incidents', 'notifications');
  },

  // ── repairs ──
  listRepairs: () => delay(db.repairs),

  async createRepair(requesterId, input) {
    const t = now();
    const r: RepairRequest = {
      id: uid('rp'),
      requesterId,
      ...input,
      status: 'submitted',
      history: [{ status: 'submitted', at: t, byUserId: requesterId }],
      createdAt: t,
    };
    db.repairs.unshift(r);
    notify(
      staffIds('management'),
      'New repair request',
      `${input.location.unitId ?? 'Common area'} · ${input.category}`,
      {
        kind: 'repair',
        id: r.id,
      },
    );
    commit('repairs', 'notifications');
    return delay(r);
  },

  async updateRepair(id, byUserId, patch) {
    const r = db.repairs.find((x) => x.id === id);
    if (!r) return;
    if (patch.contractor !== undefined) r.contractor = patch.contractor;
    if (patch.inspectionAt !== undefined) r.inspectionAt = patch.inspectionAt;
    if (patch.rating !== undefined) r.rating = patch.rating;
    if (patch.status) {
      r.status = patch.status;
      r.history.push({ status: patch.status, at: now(), byUserId, note: patch.note });
    } else if (patch.note) {
      r.history.push({ status: r.status, at: now(), byUserId, note: patch.note });
    }
    const isResident = byUserId === r.requesterId;
    if (isResident) {
      notify(
        staffIds('management'),
        'Repair update from resident',
        `${r.location.unitId ?? ''}: ${STATUS_TEXT[r.status] ?? r.status}`,
        {
          kind: 'repair',
          id,
        },
      );
    } else if (patch.status || patch.note) {
      notify(
        [r.requesterId],
        `Repair: ${STATUS_TEXT[r.status] ?? r.status}`,
        patch.note || `Your repair is now ${STATUS_TEXT[r.status]}.`,
        {
          kind: 'repair',
          id,
        },
      );
    }
    commit('repairs', 'notifications');
  },

  // ── suggestions ──
  listSuggestions: () => delay(db.suggestions),

  async createSuggestion(authorId, input) {
    const s: Suggestion = {
      id: uid('s'),
      authorId,
      ...input,
      rotation: 0,
      votes: [authorId],
      status: 'open',
      createdAt: now(),
    };
    db.suggestions.unshift(s);
    notify(staffIds('management'), 'New suggestion', `${input.item}: ${input.reason.slice(0, 60)}`, {
      kind: 'suggestion',
      id: s.id,
    });
    commit('suggestions', 'notifications');
    return delay(s);
  },

  async toggleVote(id, userId) {
    const s = db.suggestions.find((x) => x.id === id);
    if (!s) return;
    s.votes = s.votes.includes(userId) ? s.votes.filter((v) => v !== userId) : [...s.votes, userId];
    commit('suggestions');
  },

  async updateSuggestion(id, byUserId, status, reply) {
    const s = db.suggestions.find((x) => x.id === id);
    if (!s) return;
    s.status = status;
    if (reply !== undefined) s.managementReply = reply;
    if (s.authorId !== byUserId) {
      notify(
        [s.authorId],
        `Suggestion ${STATUS_TEXT[status] ?? status}`,
        reply || 'Management updated your suggestion.',
        {
          kind: 'suggestion',
          id,
        },
      );
    }
    commit('suggestions', 'notifications');
  },

  // ── chat ──
  listChannels: () => delay(db.channels),
  listMessages: () => delay(db.messages),

  async openChannel(userId, kind, otherUserId) {
    let ch: Channel | undefined;
    if (kind === 'direct' && otherUserId) {
      ch = db.channels.find(
        (c) => c.kind === 'direct' && c.memberIds.includes(userId) && c.memberIds.includes(otherUserId),
      );
      if (!ch) {
        ch = { id: uid('c'), kind, memberIds: [userId, otherUserId], title: 'Direct message' };
        db.channels.push(ch);
        commit('channels');
      }
    } else {
      ch = db.channels.find((c) => c.kind === kind && c.memberIds.includes(userId));
      if (!ch) {
        const staff = kind === 'guardhouse' ? staffIds('guard') : staffIds('management');
        ch = {
          id: uid('c'),
          kind,
          memberIds: [userId, ...staff],
          title: kind === 'guardhouse' ? 'Guardhouse EG18' : 'Management Office',
        };
        db.channels.push(ch);
        commit('channels');
      }
    }
    return delay(ch, 20);
  },

  async sendMessage(channelId, authorId, text, photoUrl) {
    const ch = db.channels.find((c) => c.id === channelId);
    if (!ch) return;
    db.messages.push({
      id: uid('m'),
      channelId,
      authorId,
      text,
      photoUrl,
      createdAt: now(),
      readBy: [authorId],
    });
    const author = db.users.find((u) => u.id === authorId);
    notify(
      ch.memberIds.filter((m) => m !== authorId),
      `💬 ${author?.name ?? 'Message'}`,
      text.slice(0, 70) || '📷 Photo',
      { kind: 'message', id: channelId },
    );
    commit('messages', 'notifications');

    // Demo: staff auto-reply after 2–4 s when nobody is driving that role in another tab.
    if (author?.role === 'resident' && (ch.kind === 'guardhouse' || ch.kind === 'management')) {
      const role = ch.kind === 'guardhouse' ? 'guard' : 'management';
      if (!staffOnline(role)) {
        const staffId = staffIds(role)[0];
        setTimeout(
          () => {
            db = loadDb();
            db.messages.push({
              id: uid('m'),
              channelId,
              authorId: staffId,
              text: cannedReply(ch.kind as 'guardhouse' | 'management', text),
              createdAt: now(),
              readBy: [staffId],
            });
            notify(
              [authorId],
              ch.kind === 'guardhouse' ? '💬 Guardhouse replied' : '💬 Management replied',
              'Tap to open the chat',
              {
                kind: 'message',
                id: channelId,
              },
            );
            commit('messages', 'notifications');
          },
          2000 + Math.random() * 2000,
        );
      }
    }
  },

  async markRead(channelId, userId) {
    let changed = false;
    for (const m of db.messages) {
      if (m.channelId === channelId && !m.readBy.includes(userId)) {
        m.readBy.push(userId);
        changed = true;
      }
    }
    if (changed) commit('messages');
  },

  // ── notifications ──
  listNotifications: () => delay(db.notifications),

  async markNotificationsRead(userId) {
    let changed = false;
    for (const n of db.notifications) {
      if (n.userId === userId && !n.read) {
        n.read = true;
        changed = true;
      }
    }
    if (changed) commit('notifications');
  },

  // ── facility booking ──
  listBookings: () => delay(db.bookings),

  async createBooking(userId, input) {
    const live = db.bookings.filter(
      (b) => !b.cancelled && b.facilityId === input.facilityId && b.date === input.date,
    );
    if (live.some((b) => b.slot === input.slot)) throw new Error('Sorry — that slot was just taken.');
    if (live.some((b) => b.userId === userId))
      throw new Error('You already have a booking for this facility on that day.');
    const b: FacilityBooking = { id: uid('b'), userId, ...input, createdAt: now() };
    db.bookings.push(b);
    const f = facilityMeta(input.facilityId);
    notify(
      staffIds('management'),
      `${f.icon} New booking`,
      `${firstName(userId)} · ${f.name} · ${input.date} ${input.slot}`,
      { kind: 'booking', id: b.id },
    );
    commit('bookings', 'notifications');
    return delay(b);
  },

  async cancelBooking(id, byUserId) {
    const b = db.bookings.find((x) => x.id === id);
    if (!b) return;
    b.cancelled = true;
    if (byUserId !== b.userId) {
      notify(
        [b.userId],
        'Booking cancelled by management',
        `${facilityMeta(b.facilityId).name} · ${b.date} ${b.slot}`,
        { kind: 'booking', id },
      );
    }
    commit('bookings', 'notifications');
  },

  // ── visitors ──
  listVisitors: () => delay(db.visitors),

  async createVisitor(byUserId, input) {
    const walkIn = db.users.find((u) => u.id === byUserId)?.role !== 'resident';
    const t = now();
    const v: VisitorPass = {
      id: uid('v'),
      hostId: walkIn ? undefined : byUserId,
      ...input,
      code: walkIn ? 'WALKIN' : passCode(),
      status: walkIn ? 'checked-in' : 'expected',
      createdAt: t,
      checkedInAt: walkIn ? t : undefined,
    };
    db.visitors.unshift(v);
    if (walkIn) {
      notify(
        unitResidentIds(input.unitId),
        '🚗 Visitor at the gate',
        `${input.visitorName} has been let in.`,
        {
          kind: 'visitor',
          id: v.id,
        },
      );
    } else {
      notify(
        staffIds('guard'),
        '🪪 Visitor pre-registered',
        `${input.visitorName} → ${input.unitId}${input.plate ? ` · ${input.plate}` : ''} · ${input.date}`,
        { kind: 'visitor', id: v.id },
      );
    }
    commit('visitors', 'notifications');
    return delay(v);
  },

  async updateVisitor(id, byUserId, status) {
    const v = db.visitors.find((x) => x.id === id);
    if (!v) return;
    v.status = status;
    if (status === 'checked-in') v.checkedInAt = now();
    if (status === 'checked-out') v.checkedOutAt = now();
    if (status === 'checked-in' && v.hostId && v.hostId !== byUserId) {
      notify([v.hostId], '🚗 Your visitor has arrived', `${v.visitorName} checked in at the guardhouse.`, {
        kind: 'visitor',
        id,
      });
    }
    if (status === 'cancelled' && v.hostId === byUserId) {
      notify(staffIds('guard'), 'Visitor pass cancelled', `${v.visitorName} → ${v.unitId}`, {
        kind: 'visitor',
        id,
      });
    }
    commit('visitors', 'notifications');
  },

  // ── events ──
  listEvents: () => delay(db.events),

  async createEvent(organiserId, input) {
    const e: CommunityEvent = { id: uid('e'), organiserId, ...input, rsvps: [], createdAt: now() };
    db.events.push(e);
    notify(residentIdsIn([]), `${input.icon} New event: ${input.title}`, input.venue, {
      kind: 'event',
      id: e.id,
    });
    commit('events', 'notifications');
    return delay(e);
  },

  async toggleRsvp(id, userId) {
    const e = db.events.find((x) => x.id === id);
    if (!e) return;
    if (e.rsvps.includes(userId)) e.rsvps = e.rsvps.filter((r) => r !== userId);
    else if (e.capacity && e.rsvps.length >= e.capacity) throw new Error('Sorry — this event is full.');
    else e.rsvps.push(userId);
    commit('events');
  },

  async cancelEvent(id) {
    const e = db.events.find((x) => x.id === id);
    if (!e) return;
    db.events = db.events.filter((x) => x.id !== id);
    notify(e.rsvps, `Event cancelled: ${e.title}`, 'Sorry for the inconvenience — Management Office.');
    commit('events', 'notifications');
  },

  // ── parcels ──
  listParcels: () => delay(db.parcels),

  async logParcel(byUserId, input) {
    const p: Parcel = { id: uid('pc'), ...input, loggedBy: byUserId, loggedAt: now() };
    db.parcels.unshift(p);
    notify(
      unitResidentIds(input.unitId),
      '📦 Parcel at the guardhouse',
      `${input.courier}${input.note ? ` · ${input.note}` : ''} — collect any time.`,
      { kind: 'parcel', id: p.id },
    );
    commit('parcels', 'notifications');
    return delay(p);
  },

  async collectParcel(id) {
    const p = db.parcels.find((x) => x.id === id);
    if (!p || p.collectedAt) return;
    p.collectedAt = now();
    commit('parcels');
  },

  // ── maintenance fees ──
  listFees: () => delay(db.fees),

  async payFee(id, userId) {
    const f = db.fees.find((x) => x.id === id);
    if (!f || f.paidAt) return;
    f.paidAt = now();
    f.reference = `EGR${Date.now().toString().slice(-6)}`;
    notify(
      staffIds('management'),
      '🧾 Fee payment received',
      `${f.unitId} · ${f.period} · by ${firstName(userId)}`,
      { kind: 'fee', id },
    );
    commit('fees', 'notifications');
  },

  async remindFee(id) {
    const f = db.fees.find((x) => x.id === id);
    if (!f || f.paidAt) return;
    notify(
      unitResidentIds(f.unitId),
      '🧾 Maintenance fee reminder',
      `Your ${f.period} statement is due on ${f.dueDate}.`,
      { kind: 'fee', id },
    );
    commit('notifications');
  },

  // ── swap corner ──
  listListings: () => delay(db.listings),

  async createListing(authorId, input) {
    const l: Listing = { id: uid('l'), authorId, ...input, status: 'available', createdAt: now() };
    db.listings.unshift(l);
    commit('listings');
    return delay(l);
  },

  async updateListing(id, status) {
    const l = db.listings.find((x) => x.id === id);
    if (!l) return;
    l.status = status;
    commit('listings');
  },

  async removeListing(id) {
    db.listings = db.listings.filter((x) => x.id !== id);
    commit('listings');
  },

  // ── lost & found ──
  listLostFound: () => delay(db.lostFound),

  async createLostFound(authorId, input) {
    const item: LostFoundItem = { id: uid('lf'), authorId, ...input, resolved: false, createdAt: now() };
    db.lostFound.unshift(item);
    commit('lostFound');
    return delay(item);
  },

  async resolveLostFound(id) {
    const item = db.lostFound.find((x) => x.id === id);
    if (!item) return;
    item.resolved = true;
    commit('lostFound');
  },

  async removeLostFound(id) {
    db.lostFound = db.lostFound.filter((x) => x.id !== id);
    commit('lostFound');
  },

  // ── polls ──
  listPolls: () => delay(db.polls),

  async createPoll(authorId, input) {
    const poll: Poll = {
      id: uid('poll'),
      authorId,
      question: input.question,
      options: input.options.map((label, i) => ({ id: `o${i + 1}`, label, votes: [] })),
      targetPrecincts: input.targetPrecincts,
      closesAt: input.closesAt,
      createdAt: now(),
    };
    db.polls.unshift(poll);
    notify(residentIdsIn(input.targetPrecincts), '📊 New poll', input.question.slice(0, 80), {
      kind: 'poll',
      id: poll.id,
    });
    commit('polls', 'notifications');
    return delay(poll);
  },

  async votePoll(id, optionId, userId) {
    const poll = db.polls.find((x) => x.id === id);
    if (!poll || new Date(poll.closesAt).getTime() < Date.now()) return;
    for (const o of poll.options) {
      o.votes = o.votes.filter((v) => v !== userId);
      if (o.id === optionId) o.votes.push(userId);
    }
    commit('polls');
  },

  async closePoll(id) {
    const poll = db.polls.find((x) => x.id === id);
    if (!poll) return;
    poll.closesAt = now();
    commit('polls');
  },

  heartbeat(role) {
    if (role === 'resident') return;
    try {
      const p = JSON.parse(safeGet(PRESENCE_KEY) ?? '{}') as Record<string, number>;
      p[role] = Date.now();
      safeSet(PRESENCE_KEY, JSON.stringify(p));
    } catch {
      // ignore
    }
  },

  async resetDemo() {
    db = freshDb();
    commit('all');
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
