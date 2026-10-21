import type {
  Announcement,
  AppNotification,
  Channel,
  ChannelKind,
  Incident,
  IncidentCategory,
  IncidentStatus,
  MapLocation,
  Message,
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

  /** Staff tabs ping this so residents get live replies instead of auto-replies. */
  heartbeat(role: Role): void;

  resetDemo(): Promise<void>;
  subscribe(listener: (event: ApiEvent) => void): () => void;
}

export const api: Api = mockApi;
