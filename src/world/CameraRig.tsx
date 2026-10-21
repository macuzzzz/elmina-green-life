import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore, type Lod } from '@/store';
import { cameraController } from './cameraController';
import { recenter, rolePost } from './recenter';
import type { XZ } from './coords';

const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const hit = new THREE.Vector3();

/** Ground point under a screen position, or null above the horizon. */
function groundAt(camera: THREE.Camera, el: HTMLElement, clientX: number, clientY: number) {
  const r = el.getBoundingClientRect();
  ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  return raycaster.ray.intersectPlane(ground, hit) ? { x: hit.x, z: hit.z } : null;
}

function lodFor(dist: number, prev: Lod): Lod {
  // Hysteresis so LOD doesn't flicker at the thresholds.
  const nearMax = prev === 'near' ? 190 : 170;
  const midMax = prev === 'far' ? 820 : 900;
  if (dist < nearMax) return 'near';
  if (dist < midMax) return 'mid';
  return 'far';
}

/**
 * Pan (drag), zoom (wheel / pinch), rotate (right-drag / two-finger twist / Q-E),
 * keyboard WASD/arrows, +/- and H. All input writes to `cameraController`.
 */
export function CameraRig() {
  const { camera, gl } = useThree();
  const setLod = useStore((s) => s.setLod);
  const setAtHome = useStore((s) => s.setAtHome);
  const keys = useRef(new Set<string>());

  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = 'none';
    const pointers = new Map<number, { x: number; y: number }>();
    let mode: 'pan' | 'rotate' | null = null;
    let last = { x: 0, y: 0 };
    let pinch: { dist: number; angle: number; mid: { x: number; y: number } } | null = null;

    const pinchState = () => {
      const [a, b] = [...pointers.values()];
      return {
        dist: Math.hypot(b.x - a.x, b.y - a.y),
        angle: Math.atan2(b.y - a.y, b.x - a.x),
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      };
    };

    const panScreen = (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const a = groundAt(camera, el, from.x, from.y);
      const b = groundAt(camera, el, to.x, to.y);
      if (a && b) cameraController.panBy(a.x - b.x, a.z - b.z);
    };

    const onDown = (e: PointerEvent) => {
      el.setPointerCapture(e.pointerId);
      if (pointers.size === 0) cameraController.dragDistance = 0;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        pinch = pinchState();
        mode = null;
      } else if (pointers.size === 1) {
        mode = e.button === 2 || e.shiftKey || e.ctrlKey ? 'rotate' : 'pan';
        last = { x: e.clientX, y: e.clientY };
      }
    };
    const onMove = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      cameraController.dragDistance += Math.hypot(e.clientX - prev.x, e.clientY - prev.y);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2 && pinch) {
        const next = pinchState();
        const groundMid = groundAt(camera, el, next.mid.x, next.mid.y) ?? undefined;
        cameraController.zoomBy(pinch.dist / Math.max(1, next.dist), groundMid);
        cameraController.rotateBy(-(next.angle - pinch.angle), 0);
        panScreen(pinch.mid, next.mid);
        pinch = next;
        return;
      }
      const cur = { x: e.clientX, y: e.clientY };
      if (mode === 'pan') panScreen(last, cur);
      else if (mode === 'rotate')
        cameraController.rotateBy(-(cur.x - last.x) * 0.006, (cur.y - last.y) * 0.004);
      last = cur;
    };
    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (pointers.size === 1) {
        const [p] = [...pointers.values()];
        last = p;
        mode = 'pan';
      }
      if (pointers.size === 0) mode = null;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const toward = groundAt(camera, el, e.clientX, e.clientY) ?? undefined;
      const delta = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY;
      cameraController.zoomBy(Math.exp(THREE.MathUtils.clamp(delta, -200, 200) * 0.0016), toward);
    };
    const onContext = (e: MouseEvent) => e.preventDefault();

    const isTyping = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        keys.current.add(k);
        if (k.startsWith('arrow')) e.preventDefault();
      } else if (k === '+' || k === '=') cameraController.zoomBy(0.8);
      else if (k === '-' || k === '_') cameraController.zoomBy(1.25);
      else if (k === 'h') recenter();
    };
    const onKeyUp = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const onBlur = () => keys.current.clear();

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('contextmenu', onContext);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('contextmenu', onContext);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [camera, gl]);

  const corners = useRef<XZ[]>([]);
  useFrame((_, dt) => {
    const k = keys.current;
    if (k.size) {
      const speed = cameraController.goal.dist * 0.9 * dt;
      const right = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0);
      const fwd = (k.has('w') || k.has('arrowup') ? 1 : 0) - (k.has('s') || k.has('arrowdown') ? 1 : 0);
      if (right || fwd) cameraController.panView(right * speed, fwd * speed);
      const rot = (k.has('q') ? 1 : 0) - (k.has('e') ? 1 : 0);
      if (rot) cameraController.rotateBy(rot * 1.6 * dt, 0);
    }
    cameraController.moved = cameraController.update(dt);
    cameraController.camera = camera as THREE.PerspectiveCamera;
    const cam = camera as THREE.PerspectiveCamera;
    cameraController.apply(cam);

    // Ground footprint for the minimap.
    const out = corners.current;
    out.length = 0;
    for (const [x, y] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]) {
      ndc.set(x, y);
      raycaster.setFromCamera(ndc, cam);
      if (raycaster.ray.intersectPlane(ground, hit)) out.push([hit.x, hit.z]);
      else {
        // Above horizon: project far along the view direction.
        const d = raycaster.ray.direction;
        const far = cameraController.cur.dist * 4;
        out.push([cam.position.x + d.x * far, cam.position.z + d.z * far]);
      }
    }
    cameraController.footprint = out;
    cameraController.emitFrame();

    const { dist, tx, tz } = cameraController.cur;
    const st = useStore.getState();
    setLod(lodFor(dist, st.lod));
    const post = rolePost(st.session?.role ?? 'resident');
    setAtHome(
      Math.hypot(tx - post.x, tz - post.z) < Math.max(18, post.dist * 0.12) &&
        dist < post.dist * 2 &&
        !cameraController.isFlying,
    );
  });

  return null;
}
