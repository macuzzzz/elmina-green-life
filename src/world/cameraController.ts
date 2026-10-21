import * as THREE from 'three';
import { PAN_BOUNDS, type XZ } from './coords';

/**
 * Imperative camera state shared by the 3D CameraRig and the 2D UI
 * (minimap, recenter, labels). Kept outside React/Zustand because it changes
 * every frame; the rig pushes only coarse derived values (LOD, at-home) into the store.
 */

export interface CamState {
  tx: number;
  tz: number;
  yaw: number;
  /** Elevation above the horizon, radians. */
  pitch: number;
  dist: number;
}

export interface FlyOptions {
  dist?: number;
  yaw?: number;
  pitch?: number;
  duration?: number;
  onDone?: () => void;
}

export const DIST_MIN = 22;
export const DIST_MAX = 2700;
const PITCH_MIN = THREE.MathUtils.degToRad(32);
export const PITCH_MAX = THREE.MathUtils.degToRad(70);
export const DEFAULT_PITCH = THREE.MathUtils.degToRad(50);

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function wrapAngle(a: number) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

/** Steeper minimum pitch when zoomed far out so the horizon never shows. */
export function minPitchFor(dist: number) {
  const t = THREE.MathUtils.smoothstep(dist, 250, 1800);
  return THREE.MathUtils.lerp(PITCH_MIN, THREE.MathUtils.degToRad(52), t);
}

class CameraController {
  goal: CamState = { tx: 0, tz: 200, yaw: 0, pitch: THREE.MathUtils.degToRad(60), dist: 1900 };
  cur: CamState = { ...this.goal };
  /** Ground footprint of the view (4 corners), for the minimap. */
  footprint: XZ[] = [];
  /** Pixels the pointer moved during the current/last press (tells clicks from drags). */
  dragDistance = 0;
  /** True on frames where the view changed (labels and shadows only update then). */
  moved = true;
  camera: THREE.PerspectiveCamera | null = null;
  private flight: { from: CamState; to: CamState; start: number; dur: number; onDone?: () => void } | null =
    null;
  private listeners = new Set<() => void>();

  get isFlying() {
    return this.flight !== null;
  }

  /** Subscribe to per-frame updates (minimap). */
  onFrame(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  emitFrame() {
    this.listeners.forEach((l) => l());
  }

  clamp(s: CamState) {
    s.dist = THREE.MathUtils.clamp(s.dist, DIST_MIN, DIST_MAX);
    s.pitch = THREE.MathUtils.clamp(s.pitch, minPitchFor(s.dist), PITCH_MAX);
    s.tx = THREE.MathUtils.clamp(s.tx, PAN_BOUNDS.minX, PAN_BOUNDS.maxX);
    s.tz = THREE.MathUtils.clamp(s.tz, PAN_BOUNDS.minZ, PAN_BOUNDS.maxZ);
    return s;
  }

  cancelFlight() {
    if (this.flight) {
      this.goal = { ...this.cur };
      this.flight = null;
    }
  }

  jumpTo(s: Partial<CamState>) {
    this.flight = null;
    this.goal = this.clamp({ ...this.goal, ...s });
    this.cur = { ...this.goal };
  }

  flyTo(target: { x: number; z: number }, opts: FlyOptions = {}) {
    const from = { ...this.cur };
    const to = this.clamp({
      tx: target.x,
      tz: target.z,
      dist: opts.dist ?? this.goal.dist,
      yaw: opts.yaw ?? this.goal.yaw,
      pitch: opts.pitch ?? this.goal.pitch,
    });
    to.yaw = from.yaw + wrapAngle(to.yaw - from.yaw);
    const reduced =
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.flight = {
      from,
      to,
      start: performance.now(),
      dur: reduced ? 1 : (opts.duration ?? 1.2) * 1000,
      onDone: opts.onDone,
    };
  }

  panBy(dx: number, dz: number) {
    this.cancelFlight();
    this.goal.tx += dx;
    this.goal.tz += dz;
    this.clamp(this.goal);
  }

  /** Pan relative to the current view direction (screen-space-ish). */
  panView(right: number, forward: number) {
    const s = Math.sin(this.goal.yaw);
    const c = Math.cos(this.goal.yaw);
    this.panBy(right * c - forward * s, -right * s - forward * c);
  }

  rotateBy(dYaw: number, dPitch: number) {
    this.cancelFlight();
    this.goal.yaw += dYaw;
    this.goal.pitch += dPitch;
    this.clamp(this.goal);
  }

  /** Zoom by factor (<1 = in), optionally toward a ground point. */
  zoomBy(factor: number, toward?: { x: number; z: number }) {
    this.cancelFlight();
    const before = this.goal.dist;
    this.goal.dist = THREE.MathUtils.clamp(before * factor, DIST_MIN, DIST_MAX);
    const f = this.goal.dist / before;
    if (toward) {
      this.goal.tx += (toward.x - this.goal.tx) * (1 - f);
      this.goal.tz += (toward.z - this.goal.tz) * (1 - f);
    }
    this.clamp(this.goal);
  }

  /** Advance damping / flights. Returns true if anything moved. */
  update(dt: number) {
    if (this.flight) {
      const { from, to, start, dur, onDone } = this.flight;
      const t = Math.min(1, (performance.now() - start) / dur);
      const e = easeInOutCubic(t);
      const travel = Math.hypot(to.tx - from.tx, to.tz - from.tz);
      // Rise a little mid-flight on long hops for a nicer arc.
      const arc =
        1 + Math.min(0.6, (travel / Math.max(from.dist, to.dist, 1)) * 0.25) * Math.sin(Math.PI * e);
      const logDist = THREE.MathUtils.lerp(Math.log(from.dist), Math.log(to.dist), e);
      this.cur = {
        tx: THREE.MathUtils.lerp(from.tx, to.tx, e),
        tz: THREE.MathUtils.lerp(from.tz, to.tz, e),
        yaw: THREE.MathUtils.lerp(from.yaw, to.yaw, e),
        pitch: THREE.MathUtils.lerp(from.pitch, to.pitch, e),
        dist: Math.exp(logDist) * arc,
      };
      this.goal = { ...this.cur };
      if (t >= 1) {
        this.flight = null;
        this.goal = { ...to };
        this.cur = { ...to };
        onDone?.();
      }
      return true;
    }
    const k = 1 - Math.exp(-dt * 9);
    const c = this.cur;
    const g = this.goal;
    const before = c.tx + c.tz + c.yaw + c.pitch + c.dist;
    c.tx += (g.tx - c.tx) * k;
    c.tz += (g.tz - c.tz) * k;
    c.yaw += (g.yaw - c.yaw) * k;
    c.pitch += (g.pitch - c.pitch) * k;
    c.dist += (g.dist - c.dist) * k;
    return Math.abs(c.tx + c.tz + c.yaw + c.pitch + c.dist - before) > 1e-4;
  }

  /** Apply the current state to a three.js camera. */
  apply(camera: THREE.PerspectiveCamera) {
    const { tx, tz, yaw, pitch, dist } = this.cur;
    const h = dist * Math.cos(pitch);
    camera.position.set(tx + h * Math.sin(yaw), dist * Math.sin(pitch), tz + h * Math.cos(yaw));
    camera.lookAt(tx, 0, tz);
    camera.near = Math.max(0.5, dist * 0.02);
    camera.far = dist * 6 + 4000;
    camera.updateProjectionMatrix();
  }
}

export const cameraController = new CameraController();
