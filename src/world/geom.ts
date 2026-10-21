import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { XZ } from './coords';

/**
 * Small toolkit for building merged, vertex-coloured, low-poly geometry.
 * Every part is non-indexed with position/normal/color so they merge cleanly.
 */

const tmpColor = new THREE.Color();

function paint(g: THREE.BufferGeometry, color: THREE.ColorRepresentation) {
  tmpColor.set(color);
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = tmpColor.r;
    arr[i * 3 + 1] = tmpColor.g;
    arr[i * 3 + 2] = tmpColor.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}

function normalise(g: THREE.BufferGeometry) {
  const out = g.index ? g.toNonIndexed() : g;
  out.deleteAttribute('uv');
  out.deleteAttribute('uv1');
  return out;
}

/** Axis-aligned box centred at (x, y, z). */
export function box(
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  color: THREE.ColorRepresentation,
) {
  const g = normalise(new THREE.BoxGeometry(w, h, d));
  g.translate(x, y, z);
  return paint(g, color);
}

export function cylinder(
  rTop: number,
  rBottom: number,
  h: number,
  seg: number,
  x: number,
  y: number,
  z: number,
  color: THREE.ColorRepresentation,
) {
  const g = normalise(new THREE.CylinderGeometry(rTop, rBottom, h, seg));
  g.translate(x, y, z);
  return paint(g, color);
}

export function sphere(
  r: number,
  x: number,
  y: number,
  z: number,
  color: THREE.ColorRepresentation,
  detail = 1,
) {
  const g = normalise(new THREE.IcosahedronGeometry(r, detail));
  g.translate(x, y, z);
  return paint(g, color);
}

export function hemisphere(r: number, x: number, y: number, z: number, color: THREE.ColorRepresentation) {
  const g = normalise(new THREE.SphereGeometry(r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2));
  g.translate(x, y, z);
  return paint(g, color);
}

/**
 * Gable roof: triangular cross-section across x, extruded along z.
 * Slopes get `color`, the two gable ends get `gableColor`.
 */
export function gable(
  w: number,
  h: number,
  l: number,
  x: number,
  y: number,
  z: number,
  color: THREE.ColorRepresentation,
  gableColor: THREE.ColorRepresentation = color,
) {
  const hw = w / 2;
  const hl = l / 2;
  const A = [-hw, 0, -hl];
  const B = [hw, 0, -hl];
  const C = [0, h, -hl];
  const D = [-hw, 0, hl];
  const E = [hw, 0, hl];
  const F = [0, h, hl];
  const slopes = [
    // left slope (A, D, F, C)
    ...A,
    ...D,
    ...F,
    ...A,
    ...F,
    ...C,
    // right slope (B, C, F, E)
    ...B,
    ...C,
    ...F,
    ...B,
    ...F,
    ...E,
  ];
  const ends = [
    // front gable (D, E, F)
    ...D,
    ...E,
    ...F,
    // back gable (B, A, C)
    ...B,
    ...A,
    ...C,
  ];
  const gs = new THREE.BufferGeometry();
  gs.setAttribute('position', new THREE.Float32BufferAttribute(slopes, 3));
  gs.computeVertexNormals();
  paint(gs, color);
  const ge = new THREE.BufferGeometry();
  ge.setAttribute('position', new THREE.Float32BufferAttribute(ends, 3));
  ge.computeVertexNormals();
  paint(ge, gableColor);
  const g = mergeGeometries([gs, ge]);
  g.translate(x, y, z);
  return g;
}

/** Hip-style long roof along x (for far-LOD row blocks). */
export function longRoof(
  l: number,
  h: number,
  w: number,
  x: number,
  y: number,
  z: number,
  color: THREE.ColorRepresentation,
) {
  const g = gable(w, h, l, 0, 0, 0, color);
  g.rotateY(Math.PI / 2);
  g.translate(x, y, z);
  return g;
}

export function merge(parts: THREE.BufferGeometry[]) {
  const g = mergeGeometries(parts);
  if (!g) throw new Error('mergeGeometries failed');
  g.computeBoundingSphere();
  g.computeBoundingBox();
  return g;
}

/** Flat polygon on the ground plane (y = up). */
export function flatPolygon(points: XZ[], y: number) {
  const shape = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = new THREE.ShapeGeometry(shape);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}

/** Ribbon along a polyline with mitred joints. */
export function ribbon(points: XZ[], width: number, y: number) {
  const half = width / 2;
  const pos: number[] = [];
  const left: XZ[] = [];
  const right: XZ[] = [];
  for (let i = 0; i < points.length; i++) {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const cur = points[i];
    const segNormal = (a: XZ, b: XZ): XZ => {
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const len = Math.hypot(dx, dz) || 1;
      return [-dz / len, dx / len];
    };
    const n0 = i > 0 ? segNormal(prev, cur) : segNormal(cur, next);
    const n1 = i < points.length - 1 ? segNormal(cur, next) : n0;
    let nx = n0[0] + n1[0];
    let nz = n0[1] + n1[1];
    const nl = Math.hypot(nx, nz) || 1;
    nx /= nl;
    nz /= nl;
    const miter = Math.min(2.2, 1 / Math.max(0.2, nx * n0[0] + nz * n0[1]));
    left.push([cur[0] + nx * half * miter, cur[1] + nz * half * miter]);
    right.push([cur[0] - nx * half * miter, cur[1] - nz * half * miter]);
  }
  for (let i = 0; i < points.length - 1; i++) {
    const a = left[i];
    const b = right[i];
    const c = left[i + 1];
    const d = right[i + 1];
    pos.push(a[0], y, a[1], c[0], y, c[1], b[0], y, b[1]);
    pos.push(b[0], y, b[1], c[0], y, c[1], d[0], y, d[1]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  // Ensure faces point up regardless of polyline direction.
  const nrm = g.attributes.normal;
  if (nrm.count > 0 && nrm.getY(0) < 0) {
    for (let i = 0; i < pos.length; i += 9) {
      for (let k = 0; k < 3; k++) {
        const t = pos[i + 3 + k];
        pos[i + 3 + k] = pos[i + 6 + k];
        pos[i + 6 + k] = t;
      }
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
  }
  return g;
}

/** Dashed centre line along a polyline as flat quads. */
export function dashes(points: XZ[], dash: number, gap: number, width: number, y: number) {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i];
    const [bx, bz] = points[i + 1];
    const len = Math.hypot(bx - ax, bz - az);
    const ang = Math.atan2(bx - ax, bz - az);
    for (let t = gap; t + dash < len - gap; t += dash + gap) {
      const g = new THREE.PlaneGeometry(width, dash);
      g.rotateX(-Math.PI / 2);
      g.rotateY(ang);
      const m = t + dash / 2;
      g.translate(ax + ((bx - ax) * m) / len, y, az + ((bz - az) * m) / len);
      g.deleteAttribute('uv');
      parts.push(g.toNonIndexed());
    }
  }
  return parts.length ? merge(parts) : new THREE.BufferGeometry();
}

/** Flat rectangles on the ground, merged. */
export function flatRects(rects: { x0: number; z0: number; x1: number; z1: number }[], y: number) {
  if (rects.length === 0) return new THREE.BufferGeometry();
  const parts = rects.map((r) => {
    const g = new THREE.PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0);
    g.rotateX(-Math.PI / 2);
    g.translate((r.x0 + r.x1) / 2, y, (r.z0 + r.z1) / 2);
    g.deleteAttribute('uv');
    return g.toNonIndexed();
  });
  return merge(parts);
}
