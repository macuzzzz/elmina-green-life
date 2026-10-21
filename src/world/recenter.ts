import type { Role } from '@/types';
import { useStore } from '@/store';
import { cameraController, DEFAULT_PITCH } from './cameraController';
import { getLayout } from './layout';

export const HOME_VIEW = { dist: 150, pitch: DEFAULT_PITCH, yaw: 0.35 };

/** Where "home" is for each role: the resident's house, the guardhouse, or the township. */
export function rolePost(role: Role) {
  const L = getLayout();
  if (role === 'resident') return { x: L.home.x, z: L.home.z, ...HOME_VIEW };
  if (role === 'guard') {
    const g = L.heroFacilities.guardhouse;
    return { x: g.x, z: g.z - 20, dist: 210, pitch: DEFAULT_PITCH, yaw: 0 };
  }
  const eg18 = L.precincts.find((p) => p.precinct.hero);
  return { x: eg18?.center[0] ?? 0, z: (eg18?.center[1] ?? 0) - 80, dist: 1100, pitch: 1.0, yaw: 0 };
}

/** Recenter button / H key: fly home (~1.2 s ease-in-out) and bounce the house. */
export function recenter() {
  const role = useStore.getState().session?.role ?? 'resident';
  const post = rolePost(role);
  const home = getLayout().home;
  cameraController.flyTo(
    { x: post.x, z: post.z },
    {
      dist: post.dist,
      pitch: post.pitch,
      yaw: post.yaw,
      duration: 1.2,
      onDone: role === 'resident' ? () => useStore.getState().bounceUnit(home.unitId) : undefined,
    },
  );
}

/** Precinct label click: fly to frame the whole precinct. */
export function flyToPrecinct(id: string) {
  const p = getLayout().precincts.find((x) => x.precinct.id === id);
  if (!p) return;
  const r = p.rects[0];
  const size = Math.max(r.x1 - r.x0, r.z1 - r.z0);
  cameraController.flyTo(
    { x: p.center[0], z: p.center[1] },
    { dist: Math.min(900, Math.max(260, size * 1.6)) },
  );
}
