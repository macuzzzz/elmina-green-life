import type { User } from '@/types';

/** Display name respecting the person's privacy setting. */
export function displayName(user: User | undefined, viewerId?: string) {
  if (!user) return 'Resident';
  if (user.role !== 'resident' || user.id === viewerId) return user.name;
  const parts = user.name.split(' ');
  switch (user.privacy.displayName) {
    case 'first':
      return parts[0];
    case 'initials':
      return parts.map((p) => p[0]).join('.') + '.';
    default:
      return user.name;
  }
}

/** Unit ID visible to the viewer, or null when hidden by privacy settings. */
export function visibleUnit(user: User | undefined, viewerId?: string) {
  if (!user?.unitId) return null;
  if (user.id === viewerId || user.privacy.showUnitId) return user.unitId;
  return null;
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}
