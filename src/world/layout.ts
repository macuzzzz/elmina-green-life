import {
  BOUNDARY,
  CIVIC,
  HIGHWAY,
  HOME_UNIT,
  LAKES,
  NEIGHBOURS,
  PARKS,
  PRECINCTS,
  RIVER,
  ROADS,
  ROUNDABOUTS,
  type RoadClass,
} from '@/data/township';
import type { Precinct, PrecinctKind } from '@/types';
import {
  FT,
  K,
  WORLD_H,
  WORLD_W,
  distToSegment,
  hashString,
  mulberry32,
  pointInPolygon,
  rectToWorld,
  toWorld,
  type XZ,
} from './coords';

/**
 * Procedural layout: turns the township data into concrete lots, blocks, roads
 * and props in world metres. Pure data — used by the 3D world, minimap and UI.
 * Computed once and memoised.
 */

export const ROAD_WIDTH: Record<RoadClass, number> = { main: 16, local: 10 };
export const LOCAL_ROAD = 9;

export interface HouseLot {
  index: number;
  unitId: string;
  precinctId: string;
  kind: 'DSLH' | 'DSSD';
  /** Lot centre. */
  x: number;
  z: number;
  /** Yaw. 0 → front faces +z (south). */
  rot: number;
  w: number;
  d: number;
  /** End/corner lot: which local side (-1 / +1) has the side garden, 0 = mid-row. */
  endSide: -1 | 0 | 1;
  /** DSSD: which local side the shared party wall is on. */
  partySide: -1 | 0 | 1;
  brickLeft: boolean;
  screen: boolean;
  carColor: string | null;
  plants: boolean;
  hero: boolean;
}

export interface RowBlock {
  x: number;
  z: number;
  rot: number;
  length: number;
  depth: number;
}

export interface AptBlock {
  precinctId: string;
  x: number;
  z: number;
  len: number;
  depth: number;
  storeys: number;
}

export interface ShopUnit {
  precinctId: string;
  x: number;
  z: number;
  rot: number;
  w: number;
  d: number;
  storeys: number;
  awning: string;
  sign?: string;
}

export interface Rect {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
}

export interface Spot {
  x: number;
  z: number;
  rot: number;
}

export interface TreeSpot {
  x: number;
  z: number;
  s: number;
  /** 0 = vivid township green, 1 = muted neighbouring land. */
  muted: boolean;
  shade: number;
}

export interface ParkedCar extends Spot {
  color: string;
}

export interface WorldRoad {
  id: string;
  name?: string;
  cls: RoadClass;
  width: number;
  points: XZ[];
}

export interface HeroFacilities {
  guardhouse: Spot;
  pocketPark: Spot;
  playground: Spot;
  badminton: Spot;
  gazebo: Spot;
  zone: Rect;
}

export interface PrecinctLayout {
  precinct: Precinct;
  rects: Rect[];
  center: XZ;
  label: XZ;
  roads: Rect[];
  houseCount: number;
}

export interface Layout {
  houses: HouseLot[];
  heroHouses: HouseLot[];
  simpleHouses: HouseLot[];
  rowBlocks: RowBlock[];
  apartments: AptBlock[];
  shops: ShopUnit[];
  carParks: Rect[];
  paved: Rect[];
  precincts: PrecinctLayout[];
  roads: WorldRoad[];
  roundabouts: XZ[];
  lakes: { id: string; points: XZ[]; center: XZ; fountain: boolean }[];
  river: XZ[];
  parks: Rect[];
  trees: TreeSpot[];
  lamps: Spot[];
  heroLamps: Spot[];
  parkedCars: ParkedCar[];
  heroFacilities: HeroFacilities;
  civic: {
    id: string;
    kind: (typeof CIVIC)[number]['kind'];
    name: string;
    x: number;
    z: number;
    rot: number;
  }[];
  neighbourBlocks: { x: number; z: number; w: number; d: number; h: number }[];
  boundary: XZ[];
  highwayX: number;
  tollZ: number;
  trafficPaths: XZ[][];
  unitMap: Map<string, HouseLot>;
  home: HouseLot;
}

export const CAR_COLORS = [
  '#e8e8e8',
  '#1f2937',
  '#b91c1c',
  '#9ca3af',
  '#2563eb',
  '#f5f5f4',
  '#0f766e',
  '#ca8a04',
];
const AWNINGS = ['#e85d4a', '#f2a93b', '#3aa17e', '#3b82c4', '#a463d6', '#e07a9a', '#f4c430', '#2bb3b1'];
const SHOP_NAMES = [
  'Kopi Pagi',
  'Elmina Mart',
  'Daun Laundry',
  'Roti Rimbun',
  'Klinik Hijau',
  'Mee Teratai',
  'Kedai Basikal',
  'Farmasi Embun',
  'Nasi Lemak Bukit',
  'Buku & Bunga',
];

// ── helpers ─────────────────────────────────────────────────────

function rect(x0: number, z0: number, x1: number, z1: number): Rect {
  return { x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1) };
}

const pad3 = (n: number) => String(n).padStart(3, '0');

// ── generators ──────────────────────────────────────────────────

interface TerraceOpts {
  segMax: number;
  minSeg: number;
  gap: number;
  crossRoads: boolean;
  kind: 'DSLH' | 'DSSD';
}

interface Ctx {
  rng: () => number;
  houses: HouseLot[];
  rowBlocks: RowBlock[];
  roads: Rect[];
  isClear: (x: number, z: number, r: number) => boolean;
}

function genTerraces(p: Precinct, r: Rect, opts: TerraceOpts, ctx: Ctx, startNumber: number) {
  const lot = p.lot ?? { width: 22, depth: 75 };
  const w = lot.width * FT * K;
  const d = lot.depth * FT * K;
  const M = 8;
  const W = r.x1 - r.x0;
  const H = r.z1 - r.z0;
  const bandH = 2 * d + LOCAL_ROAD;
  const nBands = Math.max(1, Math.floor((H - 2 * M - LOCAL_ROAD) / bandH));
  const usedH = nBands * bandH + LOCAL_ROAD;
  let zc = r.z0 + (H - usedH) / 2;

  // Segments along x.
  const avail = W - 2 * M;
  const segs: number[] = [];
  let remaining = avail;
  while (remaining >= opts.minSeg * w) {
    const c = Math.min(opts.segMax, Math.floor(remaining / w));
    segs.push(c);
    remaining -= c * w + opts.gap;
  }
  const usedW = segs.reduce((a, c) => a + c * w, 0) + (segs.length - 1) * opts.gap;
  const sx = r.x0 + (W - usedW) / 2;

  const roadTop = zc;
  ctx.roads.push(rect(r.x0 + 3, zc, r.x1 - 3, zc + LOCAL_ROAD));
  let n = startNumber;
  for (let b = 0; b < nBands; b++) {
    for (let row = 0; row < 2; row++) {
      const cz = zc + LOCAL_ROAD + d * row + d / 2;
      const rot = row === 0 ? Math.PI : 0;
      let x = sx;
      for (const count of segs) {
        let placed = 0;
        for (let i = 0; i < count; i++) {
          const cx = x + i * w + w / 2;
          if (!ctx.isClear(cx, cz, Math.max(w, d) * 0.45)) continue;
          placed++;
          const worldSide = i === 0 ? -1 : i === count - 1 ? 1 : 0;
          const localSide = (rot === 0 ? worldSide : -worldSide) as -1 | 0 | 1;
          const partyWorld = opts.kind === 'DSSD' ? (i === 0 ? 1 : -1) : 0;
          const rng = ctx.rng;
          ctx.houses.push({
            index: ctx.houses.length,
            unitId: `${p.id}-${pad3(n++)}`,
            precinctId: p.id,
            kind: opts.kind,
            x: cx,
            z: cz,
            rot,
            w,
            d,
            endSide: opts.kind === 'DSSD' ? 0 : localSide,
            partySide: (rot === 0 ? partyWorld : -partyWorld) as -1 | 0 | 1,
            brickLeft: rng() < 0.5,
            screen: rng() < 0.6,
            carColor: rng() < 0.7 ? CAR_COLORS[Math.floor(rng() * CAR_COLORS.length)] : null,
            plants: rng() < 0.55,
            hero: false,
          });
        }
        if (placed > 0) {
          ctx.rowBlocks.push({ x: x + (count * w) / 2, z: cz, rot, length: count * w, depth: d });
        }
        x += count * w + opts.gap;
      }
    }
    zc += bandH;
    ctx.roads.push(rect(r.x0 + 3, zc, r.x1 - 3, zc + LOCAL_ROAD));
  }
  if (opts.crossRoads) {
    let x = sx;
    for (let s = 0; s < segs.length - 1; s++) {
      x += segs[s] * w;
      const mid = x + opts.gap / 2;
      ctx.roads.push(rect(mid - 4, roadTop, mid + 4, zc + LOCAL_ROAD));
      x += opts.gap;
    }
  }
  return n;
}

function genApartments(
  p: Precinct,
  r: Rect,
  rng: () => number,
  out: AptBlock[],
  carParks: Rect[],
  cars: ParkedCar[],
  isClear: (x: number, z: number, r: number) => boolean,
) {
  const M = 10;
  const len = 44;
  const depth = 15;
  const carD = 20;
  const rowPitch = depth + carD + 10;
  const colPitch = len + 14;
  const W = r.x1 - r.x0;
  const H = r.z1 - r.z0;
  const nCols = Math.max(1, Math.floor((W - 2 * M + 14) / colPitch));
  const nRows = Math.max(1, Math.floor((H - 2 * M + 10) / rowPitch));
  const ox = r.x0 + (W - (nCols * colPitch - 14)) / 2;
  const oz = r.z0 + (H - (nRows * rowPitch - 10)) / 2;
  const storeyBase = 5 + (hashString(p.id) % 3);
  for (let row = 0; row < nRows; row++) {
    for (let c = 0; c < nCols; c++) {
      const x = ox + c * colPitch + len / 2;
      const z = oz + row * rowPitch + depth / 2;
      if (!isClear(x, z, len * 0.45)) continue;
      out.push({ precinctId: p.id, x, z, len, depth, storeys: storeyBase + Math.floor(rng() * 3) });
      const cz0 = z + depth / 2 + 3;
      const cp = rect(x - len / 2, cz0, x + len / 2, cz0 + carD);
      if (!isClear(x, cz0 + carD / 2, carD * 0.5)) continue;
      carParks.push(cp);
      // Stalls on both sides of a central aisle.
      for (let sxi = 0; sxi < 15; sxi++) {
        for (const side of [0, 1]) {
          if (rng() > 0.42) continue;
          cars.push({
            x: cp.x0 + 1.6 + sxi * 2.85,
            z: side === 0 ? cp.z0 + 2.7 : cp.z1 - 2.7,
            rot: side === 0 ? Math.PI : 0,
            color: CAR_COLORS[Math.floor(rng() * CAR_COLORS.length)],
          });
        }
      }
    }
  }
}

function genShops(
  p: Precinct,
  r: Rect,
  rng: () => number,
  out: ShopUnit[],
  roads: Rect[],
  cars: ParkedCar[],
  isClear: (x: number, z: number, r: number) => boolean,
) {
  const w = 20 * FT * K;
  const d = 20;
  const lane = 24;
  const M = 8;
  const W = r.x1 - r.x0;
  const H = r.z1 - r.z0;
  const bandH = 2 * d + lane;
  const nBands = Math.max(1, Math.floor((H - 2 * M - lane) / bandH));
  const usedH = nBands * bandH + lane;
  let zc = r.z0 + (H - usedH) / 2;
  const segMax = 10;
  const gap = 12;
  const segs: number[] = [];
  let remaining = W - 2 * M;
  while (remaining >= 3 * w) {
    const c = Math.min(segMax, Math.floor(remaining / w));
    segs.push(c);
    remaining -= c * w + gap;
  }
  const usedW = segs.reduce((a, c) => a + c * w, 0) + (segs.length - 1) * gap;
  const sx = r.x0 + (W - usedW) / 2;
  const storeys = p.kind === 'AFFORDABLE_SHOP' ? 2 : 3;
  let signIdx = 0;
  const addLane = (z: number) => {
    roads.push(rect(r.x0 + 3, z, r.x1 - 3, z + lane));
    // Angled parking along the lane.
    for (let x = r.x0 + 10; x < r.x1 - 10; x += 3.2) {
      for (const side of [0, 1]) {
        if (rng() > 0.35) continue;
        cars.push({
          x,
          z: side === 0 ? z + 3 : z + lane - 3,
          rot: side === 0 ? Math.PI : 0,
          color: CAR_COLORS[Math.floor(rng() * CAR_COLORS.length)],
        });
      }
    }
  };
  addLane(zc);
  for (let b = 0; b < nBands; b++) {
    for (let row = 0; row < 2; row++) {
      const cz = zc + lane + d * row + d / 2;
      const rot = row === 0 ? Math.PI : 0;
      let x = sx;
      for (const count of segs) {
        for (let i = 0; i < count; i++) {
          const cx = x + i * w + w / 2;
          if (!isClear(cx, cz, d * 0.45)) continue;
          const named = p.id === 'EG15' || p.id === 'EG19' || p.id === 'EG20';
          out.push({
            precinctId: p.id,
            x: cx,
            z: cz,
            rot,
            w,
            d,
            storeys,
            awning: AWNINGS[Math.floor(rng() * AWNINGS.length)],
            sign: named && rot === 0 ? SHOP_NAMES[signIdx++ % SHOP_NAMES.length] : undefined,
          });
        }
        x += count * w + gap;
      }
    }
    zc += bandH;
    addLane(zc);
  }
}

// ── EG18 hero precinct ──────────────────────────────────────────

function genHero(p: Precinct, r: Rect, ctx: Ctx, heroLamps: Spot[], trees: TreeSpot[]): HeroFacilities {
  const lot = p.lot ?? { width: 22, depth: 75 };
  const w = lot.width * FT * K;
  const d = lot.depth * FT * K;
  const perRow = 10;
  const bands = 3;
  const colGap = 14;
  const rowLen = perRow * w;
  const startX = r.x0 + 14;
  const colX = [startX, startX + rowLen + colGap];
  const eastRoadX = colX[1] + rowLen + 3;
  const bandH = 2 * d + LOCAL_ROAD;
  const usedH = bands * bandH + LOCAL_ROAD;
  const top = r.z0 + (r.z1 - r.z0 - usedH) / 2;
  const bottom = top + usedH;
  const rng = ctx.rng;

  // Horizontal roads + vertical spines.
  for (let b = 0; b <= bands; b++) {
    const z = top + b * bandH;
    ctx.roads.push(rect(r.x0 + 3, z, eastRoadX + 8, z + LOCAL_ROAD));
    // Lamps and verge trees along each horizontal road.
    for (let x = r.x0 + 10, k = 0; x < eastRoadX; x += 22, k++) {
      const side = k % 2 === 0 ? 1 : -1;
      heroLamps.push({
        x,
        z: z + LOCAL_ROAD / 2 + side * (LOCAL_ROAD / 2 - 0.5),
        rot: side > 0 ? Math.PI : 0,
      });
    }
  }
  const crossX = colX[0] + rowLen + colGap / 2;
  ctx.roads.push(rect(r.x0 + 3, top, r.x0 + 11, bottom));
  ctx.roads.push(rect(crossX - 4, top, crossX + 4, r.z1 + 48));
  ctx.roads.push(rect(eastRoadX, top, eastRoadX + 8, bottom));

  // Houses. Numbering: row-major across both columns so EG18-028 sits mid-precinct.
  for (let row = 0; row < bands * 2; row++) {
    const b = Math.floor(row / 2);
    const inBand = row % 2;
    const cz = top + b * bandH + LOCAL_ROAD + d * inBand + d / 2;
    const rot = inBand === 0 ? Math.PI : 0;
    for (let c = 0; c < 2; c++) {
      for (let i = 0; i < perRow; i++) {
        const num = row * 20 + c * 10 + i + 1;
        const worldSide = i === 0 ? -1 : i === perRow - 1 ? 1 : 0;
        ctx.houses.push({
          index: ctx.houses.length,
          unitId: `${p.id}-${pad3(num)}`,
          precinctId: p.id,
          kind: 'DSLH',
          x: colX[c] + i * w + w / 2,
          z: cz,
          rot,
          w,
          d,
          endSide: (rot === 0 ? worldSide : -worldSide) as -1 | 0 | 1,
          partySide: 0,
          brickLeft: rng() < 0.5,
          screen: rng() < 0.6,
          carColor: rng() < 0.75 ? CAR_COLORS[Math.floor(rng() * CAR_COLORS.length)] : null,
          plants: rng() < 0.6,
          hero: true,
        });
        // Verge trees every other lot along the road side.
        if (i % 3 === 1) {
          const front = rot === 0 ? 1 : -1;
          trees.push({
            x: colX[c] + i * w + w,
            z: cz + front * (d / 2 + 1.2),
            s: 0.55 + rng() * 0.2,
            muted: false,
            shade: rng(),
          });
        }
      }
      ctx.rowBlocks.push({ x: colX[c] + rowLen / 2, z: cz, rot, length: rowLen, depth: d });
    }
  }

  const zone = rect(eastRoadX + 12, top + 2, r.x1 - 2, bottom - 2);
  const zx = (zone.x0 + zone.x1) / 2;
  const zh = zone.z1 - zone.z0;
  // Park trees around the facility zone edges.
  for (let z = zone.z0 + 4; z < zone.z1; z += 11) {
    trees.push({ x: zone.x0 + 3, z, s: 0.7 + rng() * 0.3, muted: false, shade: rng() });
    trees.push({ x: zone.x1 - 3, z: z + 5, s: 0.7 + rng() * 0.3, muted: false, shade: rng() });
  }
  return {
    zone,
    pocketPark: { x: zx, z: zone.z0 + zh * 0.13, rot: 0 },
    playground: { x: zx, z: zone.z0 + zh * 0.37, rot: 0 },
    badminton: { x: zx, z: zone.z0 + zh * 0.6, rot: 0 },
    gazebo: { x: zx, z: zone.z0 + zh * 0.84, rot: 0 },
    guardhouse: { x: crossX, z: r.z1 + 6, rot: 0 },
  };
}

// ── main ────────────────────────────────────────────────────────

function polyline(points: [number, number][]): XZ[] {
  return points.map((p) => toWorld(p));
}

function buildLayout(): Layout {
  const rng = mulberry32(20261020);
  const roads: WorldRoad[] = ROADS.map((r) => ({
    id: r.id,
    name: r.name,
    cls: r.cls,
    width: ROAD_WIDTH[r.cls],
    points: polyline(r.points),
  }));
  const roundabouts = ROUNDABOUTS.map((r) => toWorld(r.at));
  const lakes = LAKES.map((l) => {
    const points = polyline(l.points);
    const center = points.reduce<XZ>(
      (a, p) => [a[0] + p[0] / points.length, a[1] + p[1] / points.length],
      [0, 0],
    );
    return { id: l.id, points, center, fountain: !!l.fountain };
  });
  const river = polyline(RIVER);
  const boundary = polyline(BOUNDARY);
  const highwayX = toWorld([HIGHWAY.x, 0])[0];
  const tollZ = toWorld([0, HIGHWAY.tollAt])[1];

  const roadSegs: { ax: number; az: number; bx: number; bz: number; half: number }[] = [];
  for (const r of roads) {
    for (let i = 0; i < r.points.length - 1; i++) {
      const [ax, az] = r.points[i];
      const [bx, bz] = r.points[i + 1];
      roadSegs.push({ ax, az, bx, bz, half: r.width / 2 });
    }
  }
  const nearRoad = (x: number, z: number, pad: number) => {
    for (const s of roadSegs) if (distToSegment(x, z, s.ax, s.az, s.bx, s.bz) < s.half + pad) return true;
    for (const [rx, rz] of roundabouts) if (Math.hypot(x - rx, z - rz) < 22 + pad) return true;
    return false;
  };
  const inLake = (x: number, z: number, pad = 0) =>
    lakes.some((l) => pointInPolygon(x, z, l.points)) ||
    (pad > 0 &&
      lakes.some(
        (l) => Math.hypot(x - l.center[0], z - l.center[1]) < pad && pointInPolygon(x, z, l.points),
      ));
  const isClear = (x: number, z: number, r: number) => !nearRoad(x, z, r * 0.6) && !inLake(x, z);

  const houses: HouseLot[] = [];
  const rowBlocks: RowBlock[] = [];
  const apartments: AptBlock[] = [];
  const shops: ShopUnit[] = [];
  const carParks: Rect[] = [];
  const paved: Rect[] = [];
  const parkedCars: ParkedCar[] = [];
  const trees: TreeSpot[] = [];
  const heroLamps: Spot[] = [];
  const precincts: PrecinctLayout[] = [];
  let heroFacilities: HeroFacilities | null = null;

  for (const p of PRECINCTS) {
    const prng = mulberry32(hashString(p.id));
    const rects = p.rects.map((nr) => {
      const [x0, z0, x1, z1] = rectToWorld(nr);
      return rect(x0, z0, x1, z1);
    });
    const pRoads: Rect[] = [];
    const before = houses.length;
    const ctx: Ctx = { rng: prng, houses, rowBlocks, roads: pRoads, isClear };
    const kind: PrecinctKind = p.kind;
    if (p.hero) {
      heroFacilities = genHero(p, rects[0], ctx, heroLamps, trees);
    } else if (kind === 'DSLH') {
      let n = 1;
      for (const r of rects)
        n = genTerraces(p, r, { segMax: 14, minSeg: 4, gap: 14, crossRoads: true, kind: 'DSLH' }, ctx, n);
    } else if (kind === 'DSSD') {
      let n = 1;
      for (const r of rects)
        n = genTerraces(p, r, { segMax: 2, minSeg: 2, gap: 7, crossRoads: false, kind: 'DSSD' }, ctx, n);
    } else if (kind === 'RSKU') {
      for (const r of rects) genApartments(p, r, prng, apartments, carParks, parkedCars, isClear);
    } else {
      for (const r of rects) {
        paved.push(r);
        genShops(p, r, prng, shops, pRoads, parkedCars, isClear);
      }
    }
    // Margin trees along the precinct edges (landed + apartments).
    if (kind !== 'SHOP' && kind !== 'AFFORDABLE_SHOP') {
      for (const r of rects) {
        const edge = (ax: number, az: number, bx: number, bz: number) => {
          const len = Math.hypot(bx - ax, bz - az);
          for (let t = 6; t < len - 6; t += 17 + prng() * 6) {
            const x = ax + ((bx - ax) * t) / len;
            const z = az + ((bz - az) * t) / len;
            if (!nearRoad(x, z, 3) && !inLake(x, z))
              trees.push({ x, z, s: 0.75 + prng() * 0.4, muted: false, shade: prng() });
          }
        };
        edge(r.x0 + 3, r.z0 + 3, r.x1 - 3, r.z0 + 3);
        edge(r.x0 + 3, r.z1 - 3, r.x1 - 3, r.z1 - 3);
        edge(r.x0 + 3, r.z0 + 3, r.x0 + 3, r.z1 - 3);
        edge(r.x1 - 3, r.z0 + 3, r.x1 - 3, r.z1 - 3);
      }
    }
    const [lx, lz] = toWorld(p.label);
    const cx = rects.reduce((a, r) => a + (r.x0 + r.x1) / 2, 0) / rects.length;
    const cz = rects.reduce((a, r) => a + (r.z0 + r.z1) / 2, 0) / rects.length;
    precincts.push({
      precinct: p,
      rects,
      center: [cx, cz],
      label: [lx, lz],
      roads: pRoads,
      houseCount: houses.length - before,
    });
  }

  // ── trees along roads, lakes, parks, boundary and outside ──
  for (const r of roads) {
    const off = r.width / 2 + 5;
    const step = r.cls === 'main' ? 15 : 21;
    for (let i = 0; i < r.points.length - 1; i++) {
      const [ax, az] = r.points[i];
      const [bx, bz] = r.points[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      const nx = -(bz - az) / len;
      const nz = (bx - ax) / len;
      for (let t = 8; t < len - 8; t += step + rng() * 4) {
        for (const side of [-1, 1]) {
          const x = ax + ((bx - ax) * t) / len + nx * off * side;
          const z = az + ((bz - az) * t) / len + nz * off * side;
          if (nearRoad(x, z, 2.5) || inLake(x, z)) continue;
          if (
            precincts.some((p) =>
              p.rects.some((q) => x > q.x0 + 4 && x < q.x1 - 4 && z > q.z0 + 4 && z < q.z1 - 4),
            )
          )
            continue;
          trees.push({ x, z, s: 0.85 + rng() * 0.35, muted: false, shade: rng() });
        }
      }
    }
  }
  for (const l of lakes) {
    const pts = l.points;
    for (let i = 0; i < pts.length; i++) {
      const [ax, az] = pts[i];
      const [bx, bz] = pts[(i + 1) % pts.length];
      const len = Math.hypot(bx - ax, bz - az);
      for (let t = 0; t < len; t += 13 + rng() * 6) {
        const px = ax + ((bx - ax) * t) / len;
        const pz = az + ((bz - az) * t) / len;
        const dx = px - l.center[0];
        const dz = pz - l.center[1];
        const dl = Math.hypot(dx, dz) || 1;
        const x = px + (dx / dl) * 12;
        const z = pz + (dz / dl) * 12;
        if (!nearRoad(x, z, 3)) trees.push({ x, z, s: 0.9 + rng() * 0.4, muted: false, shade: rng() });
      }
    }
  }
  const parks = PARKS.map((nr) => {
    const [x0, z0, x1, z1] = rectToWorld(nr);
    return rect(x0, z0, x1, z1);
  });
  for (const p of parks) {
    const n = Math.floor(((p.x1 - p.x0) * (p.z1 - p.z0)) / 260);
    for (let i = 0; i < n; i++) {
      const x = p.x0 + rng() * (p.x1 - p.x0);
      const z = p.z0 + rng() * (p.z1 - p.z0);
      if (!nearRoad(x, z, 3)) trees.push({ x, z, s: 0.8 + rng() * 0.6, muted: false, shade: rng() });
    }
  }
  // Boundary green belt.
  for (let i = 0; i < boundary.length; i++) {
    const [ax, az] = boundary[i];
    const [bx, bz] = boundary[(i + 1) % boundary.length];
    const len = Math.hypot(bx - ax, bz - az);
    for (let t = 0; t < len; t += 11 + rng() * 5) {
      const x = ax + ((bx - ax) * t) / len;
      const z = az + ((bz - az) * t) / len;
      if (!nearRoad(x, z, 3) && !inLake(x, z))
        trees.push({ x, z, s: 0.9 + rng() * 0.4, muted: false, shade: rng() });
    }
  }
  // Civic grounds.
  const civic = CIVIC.map((c) => {
    const [x, z] = toWorld(c.at);
    return { id: c.id, kind: c.kind, name: c.name, x, z, rot: ((c.rot ?? 0) * Math.PI) / 180 };
  });
  for (const c of civic) {
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
      const x = c.x + Math.cos(a + rng() * 0.3) * 42;
      const z = c.z + Math.sin(a + rng() * 0.3) * 36;
      if (!nearRoad(x, z, 3) && !inLake(x, z))
        trees.push({ x, z, s: 0.8 + rng() * 0.3, muted: false, shade: rng() });
    }
  }

  // Neighbouring land: muted blocks + muted trees.
  const neighbourBlocks: Layout['neighbourBlocks'] = [];
  for (const nb of NEIGHBOURS) {
    const [x0, z0, x1, z1] = rectToWorld(nb.area);
    for (let x = x0 + 20; x < x1 - 20; x += 30) {
      for (let z = z0 + 14; z < z1 - 14; z += 26) {
        if (rng() < 0.25) continue;
        neighbourBlocks.push({
          x: x + rng() * 6,
          z: z + rng() * 4,
          w: 18 + rng() * 10,
          d: 12 + rng() * 6,
          h: 5 + rng() * 4,
        });
      }
    }
  }
  const outsideArea = { x0: -WORLD_W * 0.62, x1: WORLD_W * 0.62, z0: -WORLD_H * 0.62, z1: WORLD_H * 0.6 };
  for (let i = 0; i < 1600; i++) {
    const x = outsideArea.x0 + rng() * (outsideArea.x1 - outsideArea.x0);
    const z = outsideArea.z0 + rng() * (outsideArea.z1 - outsideArea.z0);
    if (pointInPolygon(x, z, boundary)) continue;
    if (Math.abs(x - highwayX) < 40) continue;
    if (neighbourBlocks.some((b) => Math.abs(x - b.x) < b.w && Math.abs(z - b.z) < b.d)) continue;
    if (
      river.some(
        (p, k) =>
          k < river.length - 1 && distToSegment(x, z, p[0], p[1], river[k + 1][0], river[k + 1][1]) < 24,
      )
    )
      continue;
    if (nearRoad(x, z, 3)) continue;
    trees.push({ x, z, s: 0.9 + rng() * 0.7, muted: true, shade: rng() });
  }

  // Street lamps along main roads.
  const lamps: Spot[] = [];
  for (const r of roads) {
    if (r.cls !== 'main') continue;
    for (let i = 0; i < r.points.length - 1; i++) {
      const [ax, az] = r.points[i];
      const [bx, bz] = r.points[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      const nx = -(bz - az) / len;
      const nz = (bx - ax) / len;
      for (let t = 12, k = 0; t < len - 12; t += 42, k++) {
        const side = k % 2 === 0 ? 1 : -1;
        const x = ax + ((bx - ax) * t) / len + nx * (r.width / 2 + 1.2) * side;
        const z = az + ((bz - az) * t) / len + nz * (r.width / 2 + 1.2) * side;
        lamps.push({ x, z, rot: Math.atan2(-nx * side, -nz * side) });
      }
    }
  }

  // Ambient traffic follows main roads + the highway.
  const trafficPaths: XZ[][] = roads.filter((r) => r.cls === 'main').map((r) => r.points);
  trafficPaths.push([
    [highwayX - 5, -WORLD_H * 0.62],
    [highwayX - 5, WORLD_H * 0.6],
  ]);
  trafficPaths.push([
    [highwayX + 5, WORLD_H * 0.6],
    [highwayX + 5, -WORLD_H * 0.62],
  ]);

  const unitMap = new Map(houses.map((h) => [h.unitId, h]));
  const home = unitMap.get(HOME_UNIT) ?? houses[0];
  if (!heroFacilities) throw new Error('Hero precinct missing from township data');

  return {
    houses,
    heroHouses: houses.filter((h) => h.hero),
    simpleHouses: houses.filter((h) => !h.hero),
    rowBlocks,
    apartments,
    shops,
    carParks,
    paved,
    precincts,
    roads,
    roundabouts,
    lakes,
    river,
    parks,
    trees,
    lamps,
    heroLamps,
    parkedCars,
    heroFacilities,
    civic,
    neighbourBlocks,
    boundary,
    highwayX,
    tollZ,
    trafficPaths,
    unitMap,
    home,
  };
}

let cached: Layout | null = null;
export function getLayout(): Layout {
  if (!cached) cached = buildLayout();
  return cached;
}

export function precinctLayout(id: string) {
  return getLayout().precincts.find((p) => p.precinct.id === id);
}
