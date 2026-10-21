import { useCallback, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { dayFactor, malaysiaHour } from '@/lib/time';
import { useStore } from '@/store';
import { requestShadowUpdate, shadowRequests } from './shadows';
import { cameraController } from './cameraController';
import { setNightFactor } from './materials';
import { waterMaterial } from './Water';

const SKY_DAY = new THREE.Color('#bfe4f7');
const SKY_GOLD = new THREE.Color('#f6c793');
const SKY_NIGHT = new THREE.Color('#14213d');
const SUN_DAY = new THREE.Color('#fff4e0');
const SUN_GOLD = new THREE.Color('#ffb36b');
const MOON = new THREE.Color('#9fb6ff');
const HEMI_SKY_DAY = new THREE.Color('#dff1ff');
const HEMI_SKY_NIGHT = new THREE.Color('#33466e');
const HEMI_GROUND_DAY = new THREE.Color('#b9d49a');
const HEMI_GROUND_NIGHT = new THREE.Color('#1c2433');

/**
 * Day/night driven by real Malaysia time (Asia/Kuala_Lumpur): day 7am–7pm, golden
 * hour around sunrise/sunset, night with warm windows and street lamps.
 * One shadow-casting directional light follows the camera target.
 */
export function Lighting() {
  const { scene, gl } = useThree();
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const ambient = useRef<THREE.AmbientLight>(null);
  const hourRef = useRef(malaysiaHour());
  const tmp = useRef(new THREE.Color());

  useEffect(() => {
    scene.background = new THREE.Color(SKY_DAY);
    scene.fog = new THREE.Fog(SKY_DAY, 1500, 6000);
    const id = setInterval(() => {
      hourRef.current = malaysiaHour();
      requestShadowUpdate(2);
    }, 15_000);
    return () => clearInterval(id);
  }, [scene]);

  // Static scene: render the shadow map on demand instead of every frame.
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    const unsub = useStore.subscribe(() => requestShadowUpdate(3));
    return () => {
      unsub();
      gl.shadowMap.autoUpdate = true;
    };
  }, [gl]);

  // Shared module-level materials can end up with a stale shadow pass when meshes
  // mount mid-flight (LOD swaps). Refreshing them (cached programs, so cheap) after
  // LOD changes and when a camera flight lands keeps shadows correct.
  const lod = useStore((s) => s.lod);
  const refreshTimer = useRef<ReturnType<typeof setTimeout>>();
  const scheduleRefresh = useCallback(() => {
    clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      scene.traverse((o) => {
        const m = (o as THREE.Mesh).material;
        if (Array.isArray(m)) m.forEach((x) => (x.needsUpdate = true));
        else if (m) m.needsUpdate = true;
      });
      requestShadowUpdate(3);
    }, 1500);
  }, [scene]);
  useEffect(() => {
    scheduleRefresh();
  }, [lod, scheduleRefresh]);
  useEffect(() => () => clearTimeout(refreshTimer.current), []);
  const wasFlying = useRef(false);

  useFrame(() => {
    if (wasFlying.current && !cameraController.isFlying) scheduleRefresh();
    wasFlying.current = cameraController.isFlying;
    if (cameraController.moved || shadowRequests.frames > 0) {
      gl.shadowMap.needsUpdate = true;
      if (shadowRequests.frames > 0) shadowRequests.frames--;
    }
    const h = hourRef.current;
    const day = dayFactor(h);
    const night = 1 - day;
    // Golden hour peaks ~7.2am and ~6.9pm.
    const gold = Math.max(Math.exp(-((h - 7.2) ** 2) / 0.35), Math.exp(-((h - 18.9) ** 2) / 0.45));

    const sky = tmp.current
      .copy(SKY_NIGHT)
      .lerp(SKY_DAY, day)
      .lerp(SKY_GOLD, gold * 0.75);
    (scene.background as THREE.Color).copy(sky);
    const fog = scene.fog as THREE.Fog;
    fog.color.copy(sky);
    const dist = cameraController.cur.dist;
    fog.near = dist * 1.8 + 300;
    fog.far = dist * 4.5 + 2500;

    // Sun travels east (+x) → west (−x), high overhead near the equator.
    const t = THREE.MathUtils.clamp((h - 6.5) / 13, 0, 1);
    const ang = t * Math.PI;
    const { tx, tz } = cameraController.cur;
    const L = sun.current;
    if (L) {
      const R = 600;
      if (day > 0.02) {
        L.position.set(tx + Math.cos(ang) * R, Math.max(80, Math.sin(ang) * R), tz + R * 0.35);
        L.color.copy(SUN_DAY).lerp(SUN_GOLD, gold);
        L.intensity = 2.6 * day + 0.25 * night;
      } else {
        L.position.set(tx - 250, 500, tz + 300);
        L.color.copy(MOON);
        L.intensity = 0.35;
      }
      L.target.position.set(tx, 0, tz);
      L.target.updateMatrixWorld();
      // Shadow frustum sized to what the camera sees.
      const s = THREE.MathUtils.clamp(dist * 0.85, 90, 1100);
      const cam = L.shadow.camera;
      if (Math.abs(cam.right - s) > 1) {
        cam.left = -s;
        cam.right = s;
        cam.top = s;
        cam.bottom = -s;
        cam.far = 2400;
        cam.updateProjectionMatrix();
      }
    }
    if (hemi.current) {
      hemi.current.color.copy(HEMI_SKY_NIGHT).lerp(HEMI_SKY_DAY, day);
      hemi.current.groundColor.copy(HEMI_GROUND_NIGHT).lerp(HEMI_GROUND_DAY, day);
      hemi.current.intensity = 0.55 + day * 0.85;
    }
    if (ambient.current) ambient.current.intensity = 0.25 + day * 0.35;
    setNightFactor(THREE.MathUtils.clamp(night * 1.2 + gold * 0.25, 0, 1));
    waterMaterial.uniforms.uNight.value = night * 0.85;
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={['#dff1ff', '#b9d49a', 1.2]} />
      <ambientLight ref={ambient} intensity={0.5} />
      <directionalLight
        ref={sun}
        castShadow
        intensity={2.6}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0004}
        shadow-normalBias={0.6}
      />
    </>
  );
}
