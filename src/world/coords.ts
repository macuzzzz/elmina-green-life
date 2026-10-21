import { MAP_ASPECT, type NPoint, type NRect } from '@/data/township';

/** World size in metres. x = east, z = south (map down), y = up. */
export const WORLD_W = 2000;
export const WORLD_H = WORLD_W * MAP_ASPECT;

/** Toy-scale factor applied to buildings so they read clearly from above. */
export const K = 1.3;
export const FT = 0.3048;

export type XZ = [number, number];

export const toWorld = ([nx, ny]: NPoint): XZ => [(nx - 0.5) * WORLD_W, (ny - 0.5) * WORLD_H];
export const toNorm = ([x, z]: XZ): NPoint => [x / WORLD_W + 0.5, z / WORLD_H + 0.5];

export const rectToWorld = ([x0, y0, x1, y1]: NRect): [number, number, number, number] => {
  const [ax, az] = toWorld([x0, y0]);
  const [bx, bz] = toWorld([x1, y1]);
  return [ax, az, bx, bz];
};

/** Bounds the camera target may move within (township + a margin). */
export const PAN_BOUNDS = {
  minX: -WORLD_W * 0.5 - 60,
  maxX: WORLD_W * 0.5 + 60,
  minZ: -WORLD_H * 0.5 + WORLD_H * 0.05,
  maxZ: WORLD_H * 0.5,
};

// ── tiny geometry helpers ────────────────────────────────────────

export function distToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz;
  let t = len2 > 0 ? ((px - ax) * dx + (pz - az) * dz) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx - px;
  const cz = az + t * dz - pz;
  return Math.sqrt(cx * cx + cz * cz);
}

export function pointInPolygon(x: number, z: number, poly: XZ[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

/** Deterministic PRNG so the township looks the same on every load. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
