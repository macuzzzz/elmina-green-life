import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { cameraController } from '@/world/cameraController';

/**
 * DOM overlay pinned to the 3D world. One projection pass per frame (only when
 * the camera moved) positions every anchor with a 2D transform. Elements stay
 * mounted and are hidden instead of unmounted, and use no compositor layers of
 * their own — both measured to keep panning smooth.
 */

export interface AnchorState {
  pos: THREE.Vector3;
  hidden: boolean;
}

export const anchors = new Map<HTMLElement, AnchorState>();
let dirty = true;
const v = new THREE.Vector3();
let viewW = 0;
let viewH = 0;

export function markOverlayDirty() {
  dirty = true;
}

export function project(el: HTMLElement, a: AnchorState, camera: THREE.Camera) {
  v.copy(a.pos).project(camera);
  const offscreen = a.hidden || v.z > 1 || v.x < -1.2 || v.x > 1.2 || v.y < -1.2 || v.y > 1.2;
  if (offscreen) {
    if (el.style.visibility !== 'hidden') el.style.visibility = 'hidden';
    return;
  }
  const x = ((v.x + 1) / 2) * viewW;
  const y = ((1 - v.y) / 2) * viewH;
  el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -50%)`;
  if (el.style.visibility !== 'visible') el.style.visibility = 'visible';
}

function projectAll() {
  const camera = cameraController.camera;
  if (!camera) return;
  anchors.forEach((a, el) => project(el, a, camera));
}

/** A DOM element pinned to a world position. `anchor="bottom"` pins its bottom edge. */
export function Anchor({
  x,
  y,
  z,
  hidden = false,
  children,
  className = '',
}: {
  x: number;
  y: number;
  z: number;
  hidden?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const a: AnchorState = { pos: new THREE.Vector3(x, y, z), hidden };
    anchors.set(el, a);
    if (cameraController.camera) project(el, a, cameraController.camera);
    return () => {
      anchors.delete(el);
    };
  }, [x, y, z, hidden]);
  return (
    <div ref={ref} className={`absolute left-0 top-0 ${className}`} style={{ visibility: 'hidden' }}>
      {children}
    </div>
  );
}

/** Full-screen overlay container that drives the projection pass. */
export function OverlayRoot({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => {
      viewW = root.clientWidth;
      viewH = root.clientHeight;
      dirty = true;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    const unsub = cameraController.onFrame(() => {
      if (cameraController.moved || dirty) {
        dirty = false;
        projectAll();
      }
    });
    return () => {
      ro.disconnect();
      unsub();
    };
  }, []);
  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 z-[5] overflow-hidden"
      aria-label="Map labels"
    >
      {children}
    </div>
  );
}
