import * as THREE from 'three';
import { FT, K } from '../coords';
import { PALETTE } from '../materials';
import { box, cylinder, gable, longRoof, merge, sphere } from '../geom';

/**
 * Procedural, reusable building geometry. Everything is built once in local
 * space (front of the building faces +z) and instanced many times.
 */

/** Standard lot the base terrace geometry is built for (22×75 ft, toy-scaled). */
export const BASE_LOT = { w: 22 * FT * K, d: 75 * FT * K };

export const HOUSE = {
  wallH: 7.0,
  roofH: 2.5,
  porch: 6.6,
  bodyDepth: (d: number) => Math.min(0.56 * d, 17),
  bodyFront: (d: number) => d / 2 - 6.6,
};

const memo = new Map<string, unknown>();
function once<T>(key: string, make: () => T): T {
  if (!memo.has(key)) memo.set(key, make());
  return memo.get(key) as T;
}

export interface TerraceGeometries {
  body: THREE.BufferGeometry;
  glass: THREE.BufferGeometry;
}

/** Detailed DSLH terrace house (hero precinct + selected-house highlight). */
export function terraceDetailed(): TerraceGeometries {
  return once('terraceDetailed', () => {
    const { w, d } = BASE_LOT;
    const H = HOUSE.wallH;
    const bd = HOUSE.bodyDepth(d);
    const bf = HOUSE.bodyFront(d);
    const porch = HOUSE.porch;
    const bc = bf - bd / 2;
    const body = merge([
      box(w, 0.06, d, 0, 0.03, 0, PALETTE.lawn),
      box(w - 0.5, 0.1, porch - 0.4, 0, 0.08, bf + porch / 2, PALETTE.driveway),
      box(w - 0.06, H, bd, 0, H / 2, bc, PALETTE.wall),
      box(w - 0.02, 0.45, bd + 0.04, 0, 0.225, bc, PALETTE.plinth),
      // first-floor ledge
      box(w - 0.06, 0.22, 0.5, 0, 3.55, bf + 0.22, PALETTE.wallShade),
      // roof with white gable ends + ridge cap
      gable(w + 0.25, HOUSE.roofH, bd + 0.9, 0, H, bc + 0.3, PALETTE.roof, PALETTE.wall),
      box(0.3, 0.18, bd + 0.95, 0, H + HOUSE.roofH - 0.02, bc + 0.3, PALETTE.roofEdge),
      // window + door frames (front)
      box(3.25, 2.45, 0.12, 0, 5.2, bf + 0.06, PALETTE.frame),
      box(0.12, 2.15, 0.16, 0, 5.2, bf + 0.13, PALETTE.frame),
      box(3.45, 2.7, 0.12, 0.2, 1.75, bf + 0.06, PALETTE.frame),
      box(0.12, 2.45, 0.16, 0.2, 1.75, bf + 0.13, PALETTE.frame),
      // back windows frames
      box(2.4, 1.6, 0.1, 0, 5.2, bf - bd - 0.04, PALETTE.frame),
      // car-porch canopy, trim and posts
      box(w - 0.3, 0.22, porch - 0.6, 0, 3.15, bf + (porch - 0.6) / 2, PALETTE.wall),
      box(w - 0.3, 0.3, 0.14, 0, 3.15, bf + porch - 0.6, PALETTE.roofEdge),
      box(0.18, 3.0, 0.18, -(w / 2 - 0.45), 1.6, bf + porch - 0.9, PALETTE.lampPole),
      box(0.18, 3.0, 0.18, w / 2 - 0.45, 1.6, bf + porch - 0.9, PALETTE.lampPole),
      // black sliding gate + white pillars
      box(w - 1.0, 1.4, 0.1, 0, 0.78, d / 2 - 0.25, PALETTE.gate),
      box(w - 1.0, 0.1, 0.16, 0, 1.5, d / 2 - 0.25, '#3a3d42'),
      box(0.45, 1.7, 0.45, -(w / 2 - 0.25), 0.85, d / 2 - 0.25, PALETTE.wall),
      box(0.45, 1.7, 0.45, w / 2 - 0.25, 0.85, d / 2 - 0.25, PALETTE.wall),
      // low boundary wall (left only — neighbour supplies the right) and back wall
      box(0.18, 1.1, porch - 0.4, -w / 2 + 0.09, 0.55, bf + porch / 2, PALETTE.wall),
      box(w, 1.6, 0.16, 0, 0.8, -d / 2 + 0.08, PALETTE.wall),
    ]);
    const glass = merge([
      box(2.95, 2.15, 0.1, 0, 5.2, bf + 0.1, '#ffffff'),
      box(3.15, 2.45, 0.1, 0.2, 1.75, bf + 0.1, '#ffffff'),
      box(2.1, 1.35, 0.1, 0, 5.2, bf - bd - 0.08, '#ffffff'),
    ]);
    return { body, glass };
  });
}

/** Block-level simplified terrace house (all non-hero landed precincts). */
export function terraceSimple(): TerraceGeometries {
  return once('terraceSimple', () => {
    const { w, d } = BASE_LOT;
    const H = HOUSE.wallH;
    const bd = HOUSE.bodyDepth(d);
    const bf = HOUSE.bodyFront(d);
    const porch = HOUSE.porch;
    const bc = bf - bd / 2;
    const body = merge([
      box(w, 0.06, d, 0, 0.03, 0, PALETTE.lawn),
      box(w - 0.06, H, bd, 0, H / 2, bc, PALETTE.wall),
      gable(w + 0.25, HOUSE.roofH, bd + 0.9, 0, H, bc + 0.3, PALETTE.roof, PALETTE.wall),
      box(1.9, H, 0.3, w / 2 - 1.05, H / 2, bf + 0.1, PALETTE.brick),
      box(3.2, 2.4, 0.12, -0.4, 5.2, bf + 0.06, PALETTE.frame),
      box(w - 0.3, 0.22, porch - 0.6, 0, 3.15, bf + (porch - 0.6) / 2, PALETTE.wall),
      box(w - 1.0, 1.4, 0.1, 0, 0.78, d / 2 - 0.25, PALETTE.gate),
    ]);
    const glass = merge([
      box(2.9, 2.1, 0.1, -0.4, 5.2, bf + 0.1, '#ffffff'),
      box(3.0, 2.3, 0.1, 0, 1.7, bf + 0.08, '#ffffff'),
    ]);
    return { body, glass };
  });
}

/** Textured panels keep their UVs (brick + breeze-block lattice). */
export function brickPanel() {
  return once('brickPanel', () => {
    const g = new THREE.BoxGeometry(1.9, HOUSE.wallH + 0.05, 0.3);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 1, uv.getY(i) * 2.2);
    return g;
  });
}

export function screenPanel() {
  return once('screenPanel', () => {
    const g = new THREE.BoxGeometry(1.5, 2.6, 0.18);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2, uv.getY(i) * 3.4);
    return g;
  });
}

export function sideWindow() {
  return once('sideWindow', () => new THREE.BoxGeometry(0.12, 1.6, 2.4));
}

export function sideGarden() {
  return once('sideGarden', () =>
    merge([
      box(2.8, 0.07, BASE_LOT.d, 0, 0.035, 0, PALETTE.lawnDark),
      sphere(0.9, 0, 0.9, BASE_LOT.d * 0.25, '#4f9d3a', 0),
      sphere(0.7, 0.3, 0.7, -BASE_LOT.d * 0.05, '#5aa843', 0),
    ]),
  );
}

/** Car with white body (tinted per instance via instanceColor). Front faces +z. */
export function carGeometry() {
  return once('car', () =>
    merge([
      box(1.9, 0.72, 4.4, 0, 0.66, 0, '#ffffff'),
      box(1.66, 0.62, 2.3, 0, 1.33, -0.25, '#56606b'),
      box(0.32, 0.62, 0.62, -0.88, 0.32, 1.35, '#15171a'),
      box(0.32, 0.62, 0.62, 0.88, 0.32, 1.35, '#15171a'),
      box(0.32, 0.62, 0.62, -0.88, 0.32, -1.35, '#15171a'),
      box(0.32, 0.62, 0.62, 0.88, 0.32, -1.35, '#15171a'),
      box(1.5, 0.18, 0.06, 0, 0.74, 2.21, '#fff6cc'),
    ]),
  );
}

export function plantGeometry() {
  return once('plant', () =>
    merge([
      cylinder(0.32, 0.24, 0.5, 6, 0, 0.25, 0, '#b8653f'),
      sphere(0.5, 0, 0.85, 0, '#3f9a3c', 0),
      sphere(0.28, 0.2, 1.15, 0.1, '#e6517a', 0),
    ]),
  );
}

/** Far-LOD terrace row: one long block per row (unit length, scaled in x). */
export function rowBlockGeometry() {
  return once('rowBlock', () => {
    const { d } = BASE_LOT;
    const H = HOUSE.wallH;
    const bd = HOUSE.bodyDepth(d);
    const bc = HOUSE.bodyFront(d) - bd / 2;
    return merge([
      box(1, 0.06, d, 0, 0.03, 0, PALETTE.lawn),
      box(1, H, bd, 0, H / 2, bc, PALETTE.wall),
      longRoof(1.0, HOUSE.roofH, bd + 0.9, 0, H, bc + 0.3, PALETTE.roof),
      box(1, 0.6, 0.2, 0, 3.4, bc + bd / 2 + 0.1, PALETTE.brick),
    ]);
  });
}

/** RSKU mid-rise block, built for 6 storeys and scaled in y per instance. */
export const APT_STOREYS = 6;
export const APT_STOREY_H = 3.1;

export function apartmentGeometry(len: number, depth: number) {
  return once(`apt-${len}-${depth}`, () => {
    const H = APT_STOREYS * APT_STOREY_H;
    const parts: THREE.BufferGeometry[] = [
      box(len, H, depth, 0, H / 2, 0, PALETTE.wall),
      box(len + 0.1, 3.1, depth + 0.1, 0, 1.55, 0, '#e9e6de'),
      box(3.2, H, depth + 0.3, -(len / 2 - 1.6), H / 2, 0, PALETTE.brick),
      box(3.2, H, depth + 0.3, len / 2 - 1.6, H / 2, 0, PALETTE.brick),
      box(len + 0.6, 0.6, depth + 0.6, 0, H + 0.3, 0, PALETTE.wallShade),
      longRoof(len + 0.4, 3.2, depth + 0.6, 0, H + 0.6, 0, PALETTE.roof),
      box(4, 3, 1.4, 0, 1.5, depth / 2 + 0.7, PALETTE.frame),
    ];
    for (let f = 1; f < APT_STOREYS; f++) {
      const y = f * APT_STOREY_H;
      parts.push(box(len - 6.6, 0.28, 1.5, 0, y, depth / 2 + 0.7, PALETTE.wallShade));
      parts.push(box(len - 6.6, 0.85, 0.08, 0, y + 0.55, depth / 2 + 1.42, PALETTE.frame));
      parts.push(box(len - 6.6, 1.7, 0.1, 0, y - 1.35, -depth / 2 - 0.02, PALETTE.frame));
    }
    return merge(parts);
  });
}

export function apartmentGlass(len: number, depth: number) {
  return once(`aptGlass-${len}-${depth}`, () => {
    const parts: THREE.BufferGeometry[] = [];
    for (let f = 1; f <= APT_STOREYS; f++) {
      const y = f * APT_STOREY_H - 1.45;
      if (f > 1) parts.push(box(len - 8, 1.5, 0.1, 0, y, depth / 2 + 0.03, '#ffffff'));
      parts.push(box(len - 8, 1.3, 0.1, 0, y, -depth / 2 - 0.08, '#ffffff'));
    }
    return merge(parts);
  });
}

export const SHOP_STOREY_H = 3.6;

export function shopGeometry(w: number, d: number) {
  return once(`shop-${w}-${d}`, () => {
    const storeys = 3;
    const H = storeys * SHOP_STOREY_H;
    const parts: THREE.BufferGeometry[] = [
      box(w - 0.06, H, d, 0, H / 2, 0, '#f4efe4'),
      box(w - 0.5, 3.0, 0.3, 0, 1.5, d / 2 + 0.02, '#5d5b57'),
      box(w, 0.9, d, 0, H + 0.45, 0, PALETTE.wallShade),
      box(0.3, H + 0.9, d, -w / 2 + 0.15, (H + 0.9) / 2, 0, '#e2dccd'),
    ];
    for (let f = 1; f < storeys; f++)
      parts.push(box(w * 0.72, 1.8, 0.12, 0, f * SHOP_STOREY_H + 1.7, d / 2 + 0.05, PALETTE.frame));
    return merge(parts);
  });
}

export function shopGlass(w: number, d: number) {
  return once(`shopGlass-${w}-${d}`, () => {
    const parts: THREE.BufferGeometry[] = [box(w - 1.2, 2.3, 0.1, 0, 1.3, d / 2 - 0.15, '#ffffff')];
    for (let f = 1; f < 3; f++)
      parts.push(box(w * 0.66, 1.55, 0.1, 0, f * SHOP_STOREY_H + 1.7, d / 2 + 0.1, '#ffffff'));
    return merge(parts);
  });
}

export function awningGeometry(w: number) {
  return once(`awning-${w}`, () => {
    const g = new THREE.BoxGeometry(w - 0.3, 0.2, 2.2);
    g.rotateX(0.28);
    g.translate(0, 3.25, 1.05);
    return g;
  });
}

export function treeGeometries() {
  return once('trees', () => {
    const trunk = new THREE.CylinderGeometry(0.28, 0.4, 3.2, 6);
    trunk.translate(0, 1.6, 0);
    const canopy = new THREE.IcosahedronGeometry(2.6, 1);
    canopy.translate(0, 4.6, 0);
    const canopy2 = new THREE.IcosahedronGeometry(1.8, 0);
    canopy2.translate(1.1, 5.9, 0.4);
    return { trunk, canopy, canopy2 };
  });
}

export function lampGeometries() {
  return once('lamps', () => {
    const pole = merge([
      cylinder(0.11, 0.15, 6.5, 6, 0, 3.25, 0, '#ffffff'),
      box(0.12, 0.12, 1.6, 0, 6.4, 0.75, '#ffffff'),
    ]);
    const head = new THREE.BoxGeometry(0.5, 0.18, 0.9);
    head.translate(0, 6.3, 1.45);
    return { pole, head };
  });
}
