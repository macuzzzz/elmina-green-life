import type {
  Announcement,
  AppNotification,
  Channel,
  ChannelKind,
  CommunityEvent,
  FacilityBooking,
  FacilityId,
  FeeStatement,
  Incident,
  IncidentCategory,
  IncidentStatus,
  Listing,
  ListingKind,
  LostFoundItem,
  MapLocation,
  Message,
  Parcel,
  Poll,
  Post,
  ReactionKind,
  RepairCategory,
  RepairRequest,
  RepairStatus,
  Role,
  Session,
  Suggestion,
  SuggestionItem,
  SuggestionStatus,
  Urgency,
  User,
  VisitorPass,
  VisitorStatus,
} from '@/types';
import { mockApi } from './mockApi';

export interface NewIncidentInput {
  category: IncidentCategory;
  urgency: Urgency;
  description: string;
  photos: string[];
  location: MapLocation;
  isSOS?: boolean;
}

export interface NewRepairInput {
  scope: 'unit' | 'common';
  category: RepairCategory;
  description: string;
  photos: string[];
  location: MapLocation;
  preferredSlots: string[];
}

export interface NewSuggestionInput {
  item: SuggestionItem;
  reason: string;
  location: MapLocation;
}

export interface NewResidentInput {
  name: string;
  email: string;
  phone?: string;
  unitId: string;
  household: 'owner' | 'tenant' | 'family';
}

export interface NewBookingInput {
  facilityId: FacilityId;
  date: string;
  slot: string;
}

export interface NewVisitorInput {
  unitId: string;
  visitorName: string;
  plate?: string;
  date: string;
}

export type NewEventInput = Pick<
  CommunityEvent,
  'title' | 'description' | 'icon' | 'venue' | 'location' | 'startsAt' | 'endsAt' | 'capacity'
>;

export interface NewParcelInput {
  unitId: string;
  courier: string;
  note?: string;
}

export interface NewListingInput {
  kind: ListingKind;
  title: string;
  description: string;
  price?: number;
  photoUrl?: string;
}

export type NewLostFoundInput = Pick<LostFoundItem, 'kind' | 'title' | 'description' | 'where' | 'photoUrl'>;

export interface NewPollInput {
  question: string;
  options: string[];
  targetPrecincts: string[];
  closesAt: string;
}

export type Collection =
  | 'users'
  | 'posts'
  | 'announcements'
  | 'incidents'
  | 'repairs'
  | 'suggestions'
  | 'channels'
  | 'messages'
  | 'notifications'
  | 'bookings'
  | 'visitors'
  | 'events'
  | 'parcels'
  | 'fees'
  | 'listings'
  | 'lostFound'
  | 'polls'
  | 'all';

/** Events pushed to subscribers when data changes (locally or in another tab). */
export type ApiEvent = { type: 'db-changed'; collection: Collection } | { type: 'session-changed' };

export type UserPatch = Partial<Pick<User, 'avatar' | 'privacy' | 'decor' | 'onboarded'>>;

/**
 * Every read/write in the app goes through this interface. `mockApi` implements it
 * with seed data + localStorage + BroadcastChannel; a Supabase (or other) backend
 * can implement the same interface later without touching UI components.
 */
export interface Api {
  getSession(): Promise<Session | null>;
  login(email: string, password: string): Promise<Session>;
  loginAsDemo(role: Role): Promise<Session>;
  logout(): Promise<void>;

  listUsers(): Promise<User[]>;
  updateUser(id: string, patch: UserPatch): Promise<User>;
  createResident(input: NewResidentInput): Promise<User>;

  listPosts(): Promise<Post[]>;
  createPost(authorId: string, text: string, photoUrl?: string): Promise<Post>;
  toggleReaction(postId: string, userId: string, kind: ReactionKind): Promise<void>;
  reply(postId: string, authorId: string, text: string): Promise<void>;
  reportPost(postId: string, userId: string): Promise<void>;
  moderatePost(postId: string, hidden: boolean): Promise<void>;

  listAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(
    authorId: string,
    input: Pick<Announcement, 'title' | 'body' | 'targetPrecincts'>,
  ): Promise<Announcement>;

  listIncidents(): Promise<Incident[]>;
  createIncident(reporterId: string, input: NewIncidentInput): Promise<Incident>;
  updateIncident(id: string, byUserId: string, status: IncidentStatus, note?: string): Promise<void>;

  listRepairs(): Promise<RepairRequest[]>;
  createRepair(requesterId: string, input: NewRepairInput): Promise<RepairRequest>;
  updateRepair(
    id: string,
    byUserId: string,
    patch: {
      status?: RepairStatus;
      contractor?: string;
      inspectionAt?: string;
      note?: string;
      rating?: number;
    },
  ): Promise<void>;

  listSuggestions(): Promise<Suggestion[]>;
  createSuggestion(authorId: string, input: NewSuggestionInput): Promise<Suggestion>;
  toggleVote(id: string, userId: string): Promise<void>;
  updateSuggestion(id: string, byUserId: string, status: SuggestionStatus, reply?: string): Promise<void>;

  listChannels(): Promise<Channel[]>;
  listMessages(): Promise<Message[]>;
  /** Find or create a channel for a resident (guardhouse / management / direct with another user). */
  openChannel(userId: string, kind: ChannelKind, otherUserId?: string): Promise<Channel>;
  sendMessage(channelId: string, authorId: string, text: string, photoUrl?: string): Promise<void>;
  markRead(channelId: string, userId: string): Promise<void>;

  listNotifications(): Promise<AppNotification[]>;
  markNotificationsRead(userId: string): Promise<void>;

  // ── community services ──
  listBookings(): Promise<FacilityBooking[]>;
  /** Rejects when the slot is already taken. */
  createBooking(userId: string, input: NewBookingInput): Promise<FacilityBooking>;
  cancelBooking(id: string, byUserId: string): Promise<void>;

  listVisitors(): Promise<VisitorPass[]>;
  /** Residents pre-register (status "expected"); guards log walk-ins (status "checked-in"). */
  createVisitor(byUserId: string, input: NewVisitorInput): Promise<VisitorPass>;
  updateVisitor(id: string, byUserId: string, status: VisitorStatus): Promise<void>;

  listEvents(): Promise<CommunityEvent[]>;
  createEvent(organiserId: string, input: NewEventInput): Promise<CommunityEvent>;
  /** Rejects when the event is full. */
  toggleRsvp(id: string, userId: string): Promise<void>;
  cancelEvent(id: string): Promise<void>;

  listParcels(): Promise<Parcel[]>;
  logParcel(byUserId: string, input: NewParcelInput): Promise<Parcel>;
  collectParcel(id: string): Promise<void>;

  listFees(): Promise<FeeStatement[]>;
  /** Demo only — no real payment is taken. */
  payFee(id: string, userId: string): Promise<void>;
  remindFee(id: string): Promise<void>;

  listListings(): Promise<Listing[]>;
  createListing(authorId: string, input: NewListingInput): Promise<Listing>;
  updateListing(id: string, status: Listing['status']): Promise<void>;
  removeListing(id: string): Promise<void>;

  listLostFound(): Promise<LostFoundItem[]>;
  createLostFound(authorId: string, input: NewLostFoundInput): Promise<LostFoundItem>;
  resolveLostFound(id: string): Promise<void>;
  removeLostFound(id: string): Promise<void>;

  listPolls(): Promise<Poll[]>;
  createPoll(authorId: string, input: NewPollInput): Promise<Poll>;
  /** One vote per resident; voting again moves the vote. */
  votePoll(id: string, optionId: string, userId: string): Promise<void>;
  closePoll(id: string): Promise<void>;

  /** Staff tabs ping this so residents get live replies instead of auto-replies. */
  heartbeat(role: Role): void;

  resetDemo(): Promise<void>;
  subscribe(listener: (event: ApiEvent) => void): () => void;
}

export const api: Api = mockApi;
