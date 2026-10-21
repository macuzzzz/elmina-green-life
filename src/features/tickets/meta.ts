import type {
  IncidentCategory,
  IncidentStatus,
  RepairCategory,
  RepairStatus,
  SuggestionItem,
  SuggestionStatus,
  Urgency,
} from '@/types';

export const INCIDENT_CATEGORIES: { id: IncidentCategory; label: string; icon: string; color: string }[] = [
  { id: 'security', label: 'Security / suspicious person', icon: '🚨', color: '#dc2626' },
  { id: 'fire', label: 'Fire or smoke', icon: '🔥', color: '#ea580c' },
  { id: 'flood', label: 'Flooding', icon: '🌊', color: '#0284c7' },
  { id: 'fallen-tree', label: 'Fallen tree', icon: '🌳', color: '#15803d' },
  { id: 'streetlight', label: 'Streetlight out', icon: '💡', color: '#ca8a04' },
  { id: 'pothole', label: 'Pothole / road damage', icon: '🕳️', color: '#57534e' },
  { id: 'stray-animals', label: 'Stray animals', icon: '🐕', color: '#a16207' },
  { id: 'noise', label: 'Noise', icon: '🔊', color: '#7c3aed' },
  { id: 'dumping', label: 'Illegal dumping', icon: '🗑️', color: '#4b5563' },
  { id: 'other', label: 'Other', icon: '❓', color: '#64748b' },
];
export const incidentMeta = (c: IncidentCategory) =>
  INCIDENT_CATEGORIES.find((x) => x.id === c) ?? INCIDENT_CATEGORIES[9];

export const URGENCY: { id: Urgency; label: string; cls: string }[] = [
  { id: 'low', label: 'Low', cls: 'bg-emerald-100 text-emerald-700' },
  { id: 'medium', label: 'Medium', cls: 'bg-amber-100 text-amber-700' },
  { id: 'urgent', label: 'Urgent', cls: 'bg-red-100 text-red-700' },
];

export const INCIDENT_FLOW: IncidentStatus[] = ['submitted', 'acknowledged', 'in-progress', 'resolved'];
export const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
  submitted: 'Submitted',
  acknowledged: 'Acknowledged',
  'in-progress': 'In progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export const REPAIR_CATEGORIES: { id: RepairCategory; label: string; icon: string }[] = [
  { id: 'plumbing', label: 'Plumbing / water pressure', icon: '🚰' },
  { id: 'electrical', label: 'Electrical', icon: '⚡' },
  { id: 'roof-leak', label: 'Roof leak', icon: '🏠' },
  { id: 'wall-cracks', label: 'Wall cracks', icon: '🧱' },
  { id: 'doors-windows', label: 'Doors & windows', icon: '🚪' },
  { id: 'tiles-flooring', label: 'Tiles & flooring', icon: '🟫' },
  { id: 'drainage', label: 'Drainage', icon: '🕳️' },
  { id: 'landscaping', label: 'Landscaping', icon: '🌿' },
  { id: 'other', label: 'Other', icon: '🔧' },
];
export const repairMeta = (c: RepairCategory) =>
  REPAIR_CATEGORIES.find((x) => x.id === c) ?? REPAIR_CATEGORIES[8];

export const REPAIR_FLOW: RepairStatus[] = [
  'submitted',
  'under-review',
  'contractor-assigned',
  'inspection-scheduled',
  'in-progress',
  'completed',
  'confirmed',
];
export const REPAIR_STATUS_LABEL: Record<RepairStatus, string> = {
  submitted: 'Submitted',
  'under-review': 'Under review',
  'contractor-assigned': 'Contractor assigned',
  'inspection-scheduled': 'Inspection scheduled',
  'in-progress': 'In progress',
  completed: 'Completed',
  confirmed: 'Confirmed',
  reopened: 'Reopened',
};
export const CONTRACTORS = [
  'Hijau Plumbing Sdn Bhd',
  'Terang Electrical Works',
  'Bumbung Roofing Co.',
  'Kemas Builders',
  'Taman Landscaping',
];
export const TIME_SLOTS = [
  'Weekday morning',
  'Weekday evening',
  'Sat morning',
  'Sat afternoon',
  'Sun morning',
];

export const SUGGESTION_ITEMS: { id: SuggestionItem; label: string; icon: string }[] = [
  { id: 'bench', label: 'Bench', icon: '🪑' },
  { id: 'tree', label: 'Tree', icon: '🌳' },
  { id: 'speed-bump', label: 'Speed bump', icon: '〰️' },
  { id: 'street-light', label: 'Street light', icon: '💡' },
  { id: 'cctv', label: 'CCTV', icon: '📹' },
  { id: 'bin', label: 'Bin', icon: '🗑️' },
  { id: 'wakaf', label: 'Shelter / wakaf', icon: '⛺' },
  { id: 'playground', label: 'Playground', icon: '🛝' },
  { id: 'crossing', label: 'Pedestrian crossing', icon: '🚸' },
  { id: 'bicycle-rack', label: 'Bicycle rack', icon: '🚲' },
  { id: 'other', label: 'Other', icon: '✨' },
];
export const suggestionMeta = (i: SuggestionItem) =>
  SUGGESTION_ITEMS.find((x) => x.id === i) ?? SUGGESTION_ITEMS[10];

export const SUGGESTION_STATUS: { id: SuggestionStatus; label: string; cls: string }[] = [
  { id: 'open', label: 'Open', cls: 'bg-gray-100 text-gray-600' },
  { id: 'under-consideration', label: 'Under consideration', cls: 'bg-amber-100 text-amber-700' },
  { id: 'approved', label: 'Approved', cls: 'bg-emerald-100 text-emerald-700' },
  { id: 'not-planned', label: 'Not planned', cls: 'bg-red-100 text-red-700' },
];
export const suggestionStatusMeta = (s: SuggestionStatus) => SUGGESTION_STATUS.find((x) => x.id === s)!;
