import { create } from 'zustand';
import type {
  Announcement,
  AppNotification,
  Channel,
  Incident,
  MapLocation,
  Message,
  Post,
  RepairRequest,
  Role,
  Session,
  Suggestion,
  SuggestionItem,
  User,
} from '@/types';
import type { EmergencyContact } from '@/data/emergency';

export type Lod = 'far' | 'mid' | 'near';
export type Tool = 'select' | 'report' | 'repair' | 'suggest' | 'decorate' | 'community' | 'more';

export type Selection =
  | { kind: 'house'; unitId: string }
  | { kind: 'precinct'; id: string }
  | { kind: 'incident'; id: string }
  | { kind: 'repair'; id: string }
  | { kind: 'suggestion'; id: string }
  | null;

/** Modal / drawer panels. One at a time. */
export type Panel =
  | { kind: 'avatar' }
  | { kind: 'report'; location: MapLocation }
  | { kind: 'repair'; location?: MapLocation }
  | { kind: 'suggest'; location: MapLocation; item: SuggestionItem }
  | { kind: 'myhome' }
  | { kind: 'decorate' }
  | { kind: 'chat'; channelId?: string }
  | { kind: 'residents' }
  | null;

export interface Toast {
  id: number;
  text: string;
  tone?: 'info' | 'success' | 'warn';
}

export interface DataSlice {
  users: User[];
  posts: Post[];
  announcements: Announcement[];
  incidents: Incident[];
  repairs: RepairRequest[];
  suggestions: Suggestion[];
  channels: Channel[];
  messages: Message[];
  notifications: AppNotification[];
  dataLoaded: boolean;
}

interface SessionSlice {
  session: Session | null;
  sessionLoaded: boolean;
  setSession: (s: Session | null) => void;
  setData: (patch: Partial<DataSlice>) => void;
}

interface WorldSlice {
  lod: Lod;
  atHome: boolean;
  selection: Selection;
  /** Bumped to make a house do its bounce animation. */
  bounce: { unitId: string; nonce: number } | null;
  tool: Tool;
  /** Item chosen in the Suggest palette, waiting for a map tap. */
  suggestItem: SuggestionItem | null;
  setLod: (l: Lod) => void;
  setAtHome: (v: boolean) => void;
  select: (s: Selection) => void;
  bounceUnit: (unitId: string) => void;
  setTool: (t: Tool) => void;
  setSuggestItem: (i: SuggestionItem | null) => void;
}

interface UiSlice {
  toasts: Toast[];
  panel: Panel;
  confirmCall: EmergencyContact | null;
  confirmAlert: boolean;
  sosOpen: boolean;
  settingsOpen: boolean;
  minimapOpen: boolean;
  notificationsOpen: boolean;
  /** Resident is typing in the composer → "…" bubble over their avatar. */
  typing: boolean;
  /** Feed: post to scroll to/highlight, and optional author filter. */
  focusPostId: string | null;
  feedAuthorId: string | null;
  /** Phone: bump to expand the feed sheet. */
  feedOpenNonce: number;
  toast: (text: string, tone?: Toast['tone']) => void;
  dismissToast: (id: number) => void;
  openPanel: (p: Panel) => void;
  setConfirmCall: (c: EmergencyContact | null) => void;
  setConfirmAlert: (v: boolean) => void;
  setSosOpen: (v: boolean) => void;
  setSettingsOpen: (v: boolean) => void;
  setMinimapOpen: (v: boolean) => void;
  setNotificationsOpen: (v: boolean) => void;
  setTyping: (v: boolean) => void;
  focusPost: (id: string | null) => void;
  showAuthorPosts: (userId: string | null) => void;
}

export type AppState = SessionSlice & DataSlice & WorldSlice & UiSlice;

let toastId = 0;

export const useStore = create<AppState>()((set, get) => ({
  session: null,
  sessionLoaded: false,
  setSession: (session) =>
    set({ session, sessionLoaded: true, selection: null, tool: 'select', panel: null, feedAuthorId: null }),
  setData: (patch) => set(patch),

  users: [],
  posts: [],
  announcements: [],
  incidents: [],
  repairs: [],
  suggestions: [],
  channels: [],
  messages: [],
  notifications: [],
  dataLoaded: false,

  lod: 'far',
  atHome: false,
  selection: null,
  bounce: null,
  tool: 'select',
  suggestItem: null,
  setLod: (lod) => get().lod !== lod && set({ lod }),
  setAtHome: (atHome) => get().atHome !== atHome && set({ atHome }),
  select: (selection) => set({ selection }),
  bounceUnit: (unitId) => set({ bounce: { unitId, nonce: Date.now() } }),
  setTool: (tool) => set({ tool, suggestItem: null }),
  setSuggestItem: (suggestItem) => set({ suggestItem }),

  toasts: [],
  panel: null,
  confirmCall: null,
  confirmAlert: false,
  sosOpen: false,
  settingsOpen: false,
  minimapOpen: false,
  notificationsOpen: false,
  typing: false,
  focusPostId: null,
  feedAuthorId: null,
  feedOpenNonce: 0,
  toast: (text, tone = 'info') => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text, tone }] }));
    setTimeout(() => get().dismissToast(id), 3200);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  openPanel: (panel) => set({ panel }),
  setConfirmCall: (confirmCall) => set({ confirmCall }),
  setConfirmAlert: (confirmAlert) => set({ confirmAlert }),
  setSosOpen: (sosOpen) => set({ sosOpen }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setMinimapOpen: (minimapOpen) => set({ minimapOpen }),
  setNotificationsOpen: (notificationsOpen) => set({ notificationsOpen }),
  setTyping: (typing) => get().typing !== typing && set({ typing }),
  focusPost: (focusPostId) =>
    set((s) => ({ focusPostId, feedOpenNonce: focusPostId ? s.feedOpenNonce + 1 : s.feedOpenNonce })),
  showAuthorPosts: (feedAuthorId) => set((s) => ({ feedAuthorId, feedOpenNonce: s.feedOpenNonce + 1 })),
}));

// ── selectors ──────────────────────────────────────────────────

export const useCurrentUser = () =>
  useStore((s) => (s.session ? s.users.find((u) => u.id === s.session?.userId) : undefined));

export const useRole = (): Role | null => useStore((s) => s.session?.role ?? null);

export const userById = (id: string) => useStore.getState().users.find((u) => u.id === id);

if (import.meta.env.DEV) (window as unknown as { __store: typeof useStore }).__store = useStore;
