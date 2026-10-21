import type { MapLocation } from '@/types';
import { useStore } from '@/store';
import { getLayout } from '@/world/layout';

/** Tools that turn the next map tap into a location. */
export const PLACEMENT_TOOLS = ['report', 'repair', 'suggest'] as const;
export const isPlacementTool = (t: string) => (PLACEMENT_TOOLS as readonly string[]).includes(t);

export function locationAt(x: number, z: number, unitId?: string): MapLocation {
  const precinct = getLayout().precincts.find((p) =>
    p.rects.some((r) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1),
  );
  return { x, z, unitId, precinctId: unitId?.split('-')[0] ?? precinct?.precinct.id };
}

/** Called for a tap on the ground or a house while a placement tool is active. */
export function handleMapTap(x: number, z: number, unitId?: string) {
  const s = useStore.getState();
  const location = locationAt(x, z, unitId);
  if (s.tool === 'report') {
    s.openPanel({ kind: 'report', location });
  } else if (s.tool === 'repair') {
    s.openPanel({ kind: 'repair', location: { ...location, unitId: undefined } });
  } else if (s.tool === 'suggest') {
    if (!s.suggestItem) {
      s.toast('Pick an item from the palette first');
      return;
    }
    s.openPanel({ kind: 'suggest', location: { ...location, unitId: undefined }, item: s.suggestItem });
  } else {
    return;
  }
  s.setTool('select');
}
