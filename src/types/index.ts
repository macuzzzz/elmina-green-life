// Shared domain models. Later phases fill in behaviour; the shapes live here so the
// mock API can be swapped for a real backend without touching UI components.

export type Role = 'resident' | 'guard' | 'management';

export type PrecinctId = string; // e.g. "EG18"
export type UnitId = string; // e.g. "EG18-028"

export type PrecinctKind = 'DSLH' | 'DSSD' | 'RSKU' | 'SHOP' | 'AFFORDABLE_SHOP';

export interface Precinct {
  id: PrecinctId;
  kind: PrecinctKind;
  /** Label as printed on the map, e.g. "DSLH 22x75". */
  typeLabel: string;
  units?: number;
  /** Lot frontage x depth in feet, for landed precincts. */
  lot?: { width: number; depth: number };
  /** Normalised map-space rectangles [x0, y0, x1, y1] (0..1, top-left origin). */
  rects: [number, number, number, number][];
  /** Normalised label position. */
  label: [number, number];
  facilities: string[];
  /** Rendered at house-level detail. */
  hero?: boolean;
}

export interface Unit {
  id: UnitId;
  precinctId: PrecinctId;
  kind: PrecinctKind;
  lot?: { width: number; depth: number };
  isEndLot?: boolean;
}

export interface AvatarConfig {
  faceShape: string;
  skinTone: string;
  eyes: string;
  eyebrows: string;
  mouth: string;
  hairStyle: string;
  hairColor: string;
  facialHair: string;
  glasses: string;
  headwear: string;
  headwearColor: string;
  topColor: string;
  expression: string;
}

export type DisplayNameMode = 'full' | 'first' | 'initials';

export interface PrivacySettings {
  displayName: DisplayNameMode;
  showUnitId: boolean;
  showAvatarOnMap: boolean;
  allowNeighbourDMs: boolean;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  phone?: string;
  unitId?: UnitId;
  /** For guards: which guardhouse; for management: office name. */
  post?: string;
  household?: 'owner' | 'tenant' | 'family';
  avatar?: AvatarConfig;
  /** Fallback avatar colour (initials) for accounts without an avatar yet. */
  color: string;
  privacy: PrivacySettings;
  /** Cosmetic decorations on the user's own plot. */
  decor?: Decor;
  /** Set once the resident has been through the avatar creator. */
  onboarded?: boolean;
}

export type FestiveDecor = 'raya' | 'cny' | 'deepavali' | 'christmas';
export type GardenItem = 'plants' | 'frangipani' | 'swing' | 'bbq' | 'bicycle';

export interface Decor {
  gateColor: string;
  carColor: string | null;
  garden: GardenItem[];
  festive: FestiveDecor | null;
}

export type ReactionKind = 'love' | 'like' | 'laugh' | 'wow' | 'pray';

export interface Reaction {
  userId: string;
  kind: ReactionKind;
}

export interface Reply {
  id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  text: string;
  photoUrl?: string;
  createdAt: string;
  isAnnouncement?: boolean;
  reactions: Reaction[];
  replies: Reply[];
  hidden?: boolean;
  reportedBy?: string[];
}

export interface StatusChange<S extends string> {
  status: S;
  at: string;
  byUserId: string;
  note?: string;
}

export type IncidentCategory =
  | 'security'
  | 'fire'
  | 'flood'
  | 'fallen-tree'
  | 'streetlight'
  | 'pothole'
  | 'stray-animals'
  | 'noise'
  | 'dumping'
  | 'other';

export type IncidentStatus = 'submitted' | 'acknowledged' | 'in-progress' | 'resolved' | 'rejected';
export type Urgency = 'low' | 'medium' | 'urgent';

/** World-space map location (x, z in metres). */
export interface MapLocation {
  x: number;
  z: number;
  unitId?: UnitId;
  precinctId?: PrecinctId;
}

export interface Incident {
  id: string;
  reporterId: string;
  category: IncidentCategory;
  urgency: Urgency;
  description: string;
  photos: string[];
  location: MapLocation;
  status: IncidentStatus;
  history: StatusChange<IncidentStatus>[];
  createdAt: string;
  isSOS?: boolean;
  rejectReason?: string;
}

export type RepairCategory =
  | 'plumbing'
  | 'electrical'
  | 'roof-leak'
  | 'wall-cracks'
  | 'doors-windows'
  | 'tiles-flooring'
  | 'drainage'
  | 'landscaping'
  | 'other';

export type RepairStatus =
  | 'submitted'
  | 'under-review'
  | 'contractor-assigned'
  | 'inspection-scheduled'
  | 'in-progress'
  | 'completed'
  | 'confirmed'
  | 'reopened';

export interface RepairRequest {
  id: string;
  requesterId: string;
  scope: 'unit' | 'common';
  category: RepairCategory;
  description: string;
  photos: string[];
  location: MapLocation;
  preferredSlots: string[];
  status: RepairStatus;
  history: StatusChange<RepairStatus>[];
  contractor?: string;
  inspectionAt?: string;
  rating?: number;
  createdAt: string;
}

export type SuggestionItem =
  | 'bench'
  | 'tree'
  | 'speed-bump'
  | 'street-light'
  | 'cctv'
  | 'bin'
  | 'wakaf'
  | 'playground'
  | 'crossing'
  | 'bicycle-rack'
  | 'other';

export type SuggestionStatus = 'open' | 'under-consideration' | 'approved' | 'not-planned';

export interface Suggestion {
  id: string;
  authorId: string;
  item: SuggestionItem;
  reason: string;
  location: MapLocation;
  rotation: number;
  votes: string[];
  status: SuggestionStatus;
  managementReply?: string;
  createdAt: string;
}

export type ChannelKind = 'guardhouse' | 'management' | 'direct';

export interface Channel {
  id: string;
  kind: ChannelKind;
  memberIds: string[];
  title: string;
}

export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  text: string;
  photoUrl?: string;
  createdAt: string;
  readBy: string[];
}

export interface Announcement {
  id: string;
  authorId: string;
  title: string;
  body: string;
  imageUrl?: string;
  /** Empty = all precincts. */
  targetPrecincts: PrecinctId[];
  publishedAt: string;
}

// ── community services (formerly the "Coming soon" backlog) ─────────

export type FacilityId = 'badminton' | 'bbq' | 'hall';

export interface FacilityBooking {
  id: string;
  facilityId: FacilityId;
  userId: string;
  /** Malaysia-local date, yyyy-MM-dd. */
  date: string;
  /** Slot start, "HH:mm" (24h). */
  slot: string;
  createdAt: string;
  cancelled?: boolean;
}

export type VisitorStatus = 'expected' | 'checked-in' | 'checked-out' | 'cancelled';

export interface VisitorPass {
  id: string;
  /** Resident who registered the visitor; absent for guard-logged walk-ins. */
  hostId?: string;
  unitId: UnitId;
  visitorName: string;
  plate?: string;
  /** Malaysia-local date the pass is valid for, yyyy-MM-dd. */
  date: string;
  /** Short code encoded in the QR pass; guards verify it at the gate. */
  code: string;
  status: VisitorStatus;
  createdAt: string;
  checkedInAt?: string;
  checkedOutAt?: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  icon: string;
  venue: string;
  location?: MapLocation;
  startsAt: string;
  endsAt: string;
  organiserId: string;
  rsvps: string[];
  capacity?: number;
  createdAt: string;
}

export interface Parcel {
  id: string;
  unitId: UnitId;
  courier: string;
  note?: string;
  loggedBy: string;
  loggedAt: string;
  collectedAt?: string;
}

export interface FeeStatement {
  id: string;
  unitId: UnitId;
  /** Billing month, yyyy-MM. */
  period: string;
  items: { label: string; amount: number }[];
  dueDate: string;
  paidAt?: string;
  reference?: string;
}

export type ListingKind = 'giveaway' | 'swap' | 'sale';

export interface Listing {
  id: string;
  authorId: string;
  kind: ListingKind;
  title: string;
  description: string;
  /** RM, for sale items. */
  price?: number;
  photoUrl?: string;
  status: 'available' | 'reserved' | 'gone';
  createdAt: string;
}

export interface LostFoundItem {
  id: string;
  authorId: string;
  kind: 'lost' | 'found';
  title: string;
  description: string;
  where: string;
  photoUrl?: string;
  resolved: boolean;
  createdAt: string;
}

export interface Poll {
  id: string;
  authorId: string;
  question: string;
  options: { id: string; label: string; votes: string[] }[];
  /** Empty = all precincts. */
  targetPrecincts: PrecinctId[];
  closesAt: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  link?: {
    kind:
      | 'incident'
      | 'repair'
      | 'suggestion'
      | 'post'
      | 'message'
      | 'announcement'
      | 'booking'
      | 'visitor'
      | 'event'
      | 'parcel'
      | 'fee'
      | 'listing'
      | 'lost-found'
      | 'poll';
    id: string;
  };
}

export interface Session {
  userId: string;
  role: Role;
}
