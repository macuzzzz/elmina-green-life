import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { carGeometry } from './buildings/geometries';
import { CAR_COLORS, getLayout } from './layout';
import { MATERIALS } from './materials';
import { mulberry32, type XZ } from './coords';

interface Path {
  pts: XZ[];
  cum: number[];
  length: number;
}

function buildPath(pts: XZ[]): Path {
  const cum = [0];
  for (let i = 1; i < pts.length; i++)
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, length: cum[cum.length - 1] };
}

function sample(p: Path, s: number, out: { x: number; z: number; ang: number }) {
  let i = 1;
  while (i < p.cum.length - 1 && p.cum[i] < s) i++;
  const a = p.pts[i - 1];
  const b = p.pts[i];
  const seg = p.cum[i] - p.cum[i - 1] || 1;
  const t = (s - p.cum[i - 1]) / seg;
  out.x = a[0] + (b[0] - a[0]) * t;
  out.z = a[1] + (b[1] - a[1]) * t;
  out.ang = Math.atan2(b[0] - a[0], b[1] - a[1]);
}

const dummy = new THREE.Object3D();
const tmp = { x: 0, z: 0, ang: 0 };

/** Small cars looping along the main roads and highway. Cheap: one InstancedMesh. */
export function Traffic() {
  const L = getLayout();
  const ref = useRef<THREE.InstancedMesh>(null);
  const { paths, cars } = useMemo(() => {
    const rng = mulberry32(77);
    const paths = L.trafficPaths.map(buildPath);
    const cars: { path: number; s: number; speed: number; dir: 1 | -1; color: string }[] = [];
    paths.forEach((p, pi) => {
      const n = Math.max(1, Math.round(p.length / 260));
      for (let k = 0; k < n; k++) {
        cars.push({
          path: pi,
          s: rng() * p.length,
          speed: 9 + rng() * 6,
          dir: rng() < 0.5 ? 1 : -1,
          color: CAR_COLORS[Math.floor(rng() * CAR_COLORS.length)],
        });
      }
    });
    return { paths, cars };
  }, [L]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const c = new THREE.Color();
    cars.forEach((car, i) => mesh.setColorAt(i, c.set(car.color)));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [cars]);

  useFrame((_, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    const step = Math.min(dt, 0.1);
    cars.forEach((car, i) => {
      const p = paths[car.path];
      car.s = (car.s + car.speed * step * car.dir + p.length) % p.length;
      sample(p, car.s, tmp);
      const ang = car.dir === 1 ? tmp.ang : tmp.ang + Math.PI;
      // Keep left (Malaysia drives on the left).
      const side = 2.6;
      dummy.position.set(tmp.x + Math.cos(ang) * side, 0.25, tmp.z - Math.sin(ang) * side);
      dummy.rotation.set(0, ang, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={ref} args={[carGeometry(), MATERIALS.car, cars.length]} frustumCulled={false} />;
}
