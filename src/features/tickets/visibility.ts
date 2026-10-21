import type { Incident, RepairRequest, User } from '@/types';

const isStaff = (u?: User) => u?.role === 'guard' || u?.role === 'management';

/**
 * Residents see their own reports in full and other residents' reports only as
 * public markers. Security reports are visible only to the reporter, guards and management.
 */
export function canSeeIncident(inc: Incident, viewer?: User) {
  if (!viewer) return false;
  if (isStaff(viewer) || inc.reporterId === viewer.id) return true;
  return inc.category !== 'security';
}

export function canSeeIncidentDetails(inc: Incident, viewer?: User) {
  return !!viewer && (isStaff(viewer) || inc.reporterId === viewer.id);
}

export function canSeeRepair(r: RepairRequest, viewer?: User) {
  if (!viewer) return false;
  return isStaff(viewer) || r.requesterId === viewer.id || r.scope === 'common';
}

export const isActiveIncident = (i: Incident) => i.status !== 'resolved' && i.status !== 'rejected';
export const isActiveRepair = (r: RepairRequest) => r.status !== 'confirmed';
