import { useMemo, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import type { CivicKind } from '@/data/township';
import { MATERIALS, PALETTE } from '../materials';
import { requestShadowUpdate } from '../shadows';

/**
 * Low-poly civic buildings and EG18 facilities. Each type has a simple, distinct
 * silhouette so it reads from a distance.
 */

function Box({
  size,
  pos,
  color,
  mat,
  cast = true,
}: {
  size: [number, number, number];
  pos: [number, number, number];
  color?: string;
  mat?: THREE.Material;
  cast?: boolean;
}) {
  return (
    <mesh position={pos} castShadow={cast} receiveShadow>
      <boxGeometry args={size} />
      {mat ? (
        <primitive object={mat} attach="material" />
      ) : (
        <meshStandardMaterial color={color} roughness={0.85} />
      )}
    </mesh>
  );
}

function Gable({
  w,
  h,
  l,
  pos,
  color = PALETTE.roof,
  rotY = 0,
}: {
  w: number;
  h: number;
  l: number;
  pos: [number, number, number];
  color?: string;
  rotY?: number;
}) {
  const geo = useMemo(() => {
    const shape = new THREE.Shape([
      new THREE.Vector2(-w / 2, 0),
      new THREE.Vector2(w / 2, 0),
      new THREE.Vector2(0, h),
    ]);
    const g = new THREE.ExtrudeGeometry(shape, { depth: l, bevelEnabled: false });
    g.translate(0, 0, -l / 2);
    return g;
  }, [w, h, l]);
  return (
    <mesh geometry={geo} position={pos} rotation={[0, rotY, 0]} castShadow>
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
}

function Windows({
  w,
  rows,
  y0,
  z,
  gap = 3.2,
}: {
  w: number;
  rows: number;
  y0: number;
  z: number;
  gap?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <mesh key={r} position={[0, y0 + r * gap, z]} material={MATERIALS.glass}>
          <boxGeometry args={[w, 1.4, 0.1]} />
        </mesh>
      ))}
    </>
  );
}

export function Mosque() {
  return (
    <group>
      <Box size={[30, 0.8, 30]} pos={[0, 0.4, 0]} color="#ece7da" />
      <Box size={[22, 9, 22]} pos={[0, 5, 0]} color="#f7f5ef" />
      <Box size={[23, 0.8, 23]} pos={[0, 9.6, 0]} color="#1e8a5a" />
      <mesh position={[0, 10, 0]} castShadow>
        <sphereGeometry args={[7.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#27a372" roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh position={[0, 18, 0]}>
        <coneGeometry args={[0.5, 2.2, 8]} />
        <meshStandardMaterial color="#e8c24a" metalness={0.4} roughness={0.3} />
      </mesh>
      {/* minaret */}
      <group position={[14, 0, 12]}>
        <mesh position={[0, 11, 0]} castShadow>
          <cylinderGeometry args={[1.3, 1.6, 22, 8]} />
          <meshStandardMaterial color="#f7f5ef" />
        </mesh>
        <mesh position={[0, 16, 0]}>
          <cylinderGeometry args={[2.1, 2.1, 0.6, 8]} />
          <meshStandardMaterial color="#1e8a5a" />
        </mesh>
        <mesh position={[0, 23, 0]}>
          <sphereGeometry args={[1.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#27a372" />
        </mesh>
        <mesh position={[0, 25.3, 0]}>
          <coneGeometry args={[0.3, 1.4, 6]} />
          <meshStandardMaterial color="#e8c24a" metalness={0.4} roughness={0.3} />
        </mesh>
      </group>
      {[-6.5, 0, 6.5].map((x) => (
        <mesh key={x} position={[x, 3.4, 11.06]} material={MATERIALS.glass}>
          <boxGeometry args={[3, 5, 0.1]} />
        </mesh>
      ))}
    </group>
  );
}

export function PoliceStation() {
  return (
    <group>
      <Box size={[24, 8, 14]} pos={[0, 4, 0]} color="#f4f6f8" />
      <Box size={[24.4, 1.6, 14.4]} pos={[0, 7.4, 0]} color="#1d3f8f" />
      <Box size={[6, 3.6, 3]} pos={[0, 1.8, 8]} color="#1d3f8f" />
      <Windows w={18} rows={2} y0={2.4} z={7.06} gap={3} />
      <mesh position={[9, 7, 9]}>
        <cylinderGeometry args={[0.1, 0.1, 14, 6]} />
        <meshStandardMaterial color="#cfd3d8" />
      </mesh>
      <Box size={[3, 1.8, 0.05]} pos={[10.5, 13, 9]} color="#c8102e" cast={false} />
    </group>
  );
}

export function HealthCentre() {
  return (
    <group>
      <Box size={[26, 7, 16]} pos={[0, 3.5, 0]} color="#fbfbfa" />
      <Box size={[27, 0.7, 17]} pos={[0, 7.3, 0]} color="#d8dde2" />
      <Windows w={20} rows={2} y0={2.2} z={8.06} gap={3} />
      <group position={[0, 9.6, 8.6]}>
        <Box size={[1.4, 4, 0.4]} pos={[0, 0, 0]} color="#e11d48" cast={false} />
        <Box size={[4, 1.4, 0.4]} pos={[0, 0, 0]} color="#e11d48" cast={false} />
      </group>
      <Box size={[8, 0.4, 6]} pos={[0, 3.6, 11]} color="#e9ecef" />
    </group>
  );
}

function SchoolBlock({ roof, accent }: { roof: string; accent: string }) {
  return (
    <group>
      <Box size={[48, 10, 12]} pos={[0, 5, -10]} color="#f6f1e2" />
      <Gable w={13} h={3.4} l={49} pos={[0, 10, -10]} color={roof} rotY={Math.PI / 2} />
      <Box size={[12, 10, 30]} pos={[-18, 5, 8]} color="#f6f1e2" />
      <Gable w={13} h={3.4} l={31} pos={[-18, 10, 8]} color={roof} />
      <Windows w={40} rows={3} y0={1.8} z={-3.95} />
      <Box size={[30, 0.1, 20]} pos={[10, 0.1, 12]} color="#d07a4e" cast={false} />
      <Box size={[22, 0.12, 13]} pos={[10, 0.16, 12]} color="#4fb35a" cast={false} />
      <mesh position={[20, 6, -2]}>
        <cylinderGeometry args={[0.12, 0.12, 12, 6]} />
        <meshStandardMaterial color="#cfd3d8" />
      </mesh>
      <Box size={[3.4, 1.8, 0.05]} pos={[21.8, 11, -2]} color={accent} cast={false} />
    </group>
  );
}

export function Kindergarten() {
  return (
    <group>
      <Box size={[18, 5, 12]} pos={[0, 2.5, 0]} color="#fff4d6" />
      <Gable w={13} h={3} l={19} pos={[0, 5, 0]} color="#ef6f5e" rotY={Math.PI / 2} />
      {['#f59e0b', '#22c55e', '#3b82f6', '#ec4899'].map((c, i) => (
        <Box key={c} size={[2.2, 2.2, 0.15]} pos={[-6 + i * 4, 2.4, 6.05]} color={c} cast={false} />
      ))}
      <Box size={[6, 0.6, 6]} pos={[0, 0.3, 11]} color="#fde68a" />
    </group>
  );
}

export function Hall() {
  return (
    <group>
      <Box size={[22, 6.5, 16]} pos={[0, 3.25, 0]} color="#f3efe6" />
      <Gable w={17} h={5} l={23} pos={[0, 6.5, 0]} rotY={Math.PI / 2} />
      <Box size={[6, 4, 0.2]} pos={[0, 2, 8.05]} color={PALETTE.brick} cast={false} />
      <Box size={[22, 0.4, 3]} pos={[0, 4, 9.3]} color="#ffffff" />
    </group>
  );
}

export function CivicBuilding({ kind }: { kind: CivicKind }) {
  switch (kind) {
    case 'mosque':
      return <Mosque />;
    case 'police':
      return <PoliceStation />;
    case 'health':
      return <HealthCentre />;
    case 'primary-school':
      return <SchoolBlock roof="#c2563a" accent="#2563eb" />;
    case 'secondary-school':
      return <SchoolBlock roof="#3a6ea5" accent="#16a34a" />;
    case 'islamic-school':
      return <SchoolBlock roof="#1e8a5a" accent="#16a34a" />;
    case 'school-complex':
      return (
        <group scale={[1.3, 1, 1.3]}>
          <SchoolBlock roof="#7c5cc4" accent="#f59e0b" />
        </group>
      );
    case 'kindergarten':
      return <Kindergarten />;
    case 'hall':
      return <Hall />;
  }
}

// ── EG18 facilities ──────────────────────────────────────────────

export function Guardhouse() {
  const boom = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    // Boom gate lifts now and then, as if letting a car through.
    const t = clock.elapsedTime % 14;
    const open = t > 10 && t < 13 ? Math.sin(((t - 10) / 3) * Math.PI) : 0;
    if (boom.current) boom.current.rotation.z = open * 1.3;
    if (open > 0) requestShadowUpdate();
  });
  return (
    <group>
      <Box size={[4.2, 3.4, 4.2]} pos={[-7, 1.7, 0]} color="#f6f5f1" />
      <Box size={[5.2, 0.4, 5.2]} pos={[-7, 3.6, 0]} color={PALETTE.roof} />
      <mesh position={[-7, 2, 2.12]} material={MATERIALS.glass}>
        <boxGeometry args={[3, 1.3, 0.08]} />
      </mesh>
      <Box size={[0.6, 1.2, 0.6]} pos={[-4.6, 0.6, 0]} color="#e8c24a" />
      <group ref={boom} position={[-4.6, 1.15, 0]}>
        <mesh position={[4.2, 0, 0]} castShadow>
          <boxGeometry args={[8.4, 0.22, 0.22]} />
          <meshStandardMaterial color="#e11d48" />
        </mesh>
        {[1.5, 3.5, 5.5, 7.5].map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <boxGeometry args={[0.8, 0.24, 0.24]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        ))}
      </group>
      <Box size={[3, 1.2, 0.3]} pos={[7, 0.9, 1]} color={PALETTE.brick} />
    </group>
  );
}

export function Bench({ rot = 0 }: { rot?: number }) {
  return (
    <group rotation={[0, rot, 0]}>
      <Box size={[2, 0.12, 0.6]} pos={[0, 0.55, 0]} color="#a0703f" cast={false} />
      <Box size={[2, 0.5, 0.1]} pos={[0, 0.85, -0.28]} color="#a0703f" cast={false} />
      <Box size={[0.1, 0.55, 0.5]} pos={[-0.85, 0.27, 0]} color="#3b3f46" cast={false} />
      <Box size={[0.1, 0.55, 0.5]} pos={[0.85, 0.27, 0]} color="#3b3f46" cast={false} />
    </group>
  );
}

function Rect({
  w,
  d,
  color,
  y = 0.12,
  children,
}: {
  w: number;
  d: number;
  color: string;
  y?: number;
  children?: ReactNode;
}) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {children}
    </group>
  );
}

export function PocketPark() {
  return (
    <Rect w={56} d={40} color="#6dbb52">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.16, 0]}>
        <ringGeometry args={[9, 11, 32]} />
        <meshStandardMaterial color="#e2d6bb" />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[3.2, 3.4, 0.8, 20]} />
        <meshStandardMaterial color="#d9d2c0" />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[2.8, 2.8, 0.1, 20]} />
        <meshStandardMaterial color="#5fc3e4" />
      </mesh>
      {[0, 1, 2, 3].map((k) => (
        <group key={k} position={[Math.cos((k * Math.PI) / 2) * 13.5, 0, Math.sin((k * Math.PI) / 2) * 13.5]}>
          <Bench rot={-(k * Math.PI) / 2 + Math.PI / 2} />
        </group>
      ))}
      {[
        [-20, -12, '#f472b6'],
        [20, 12, '#facc15'],
        [-18, 13, '#fb923c'],
        [19, -13, '#f472b6'],
      ].map(([x, z, c]) => (
        <mesh key={`${x}${z}`} position={[x as number, 0.6, z as number]}>
          <icosahedronGeometry args={[1.4, 0]} />
          <meshStandardMaterial color={c as string} flatShading />
        </mesh>
      ))}
    </Rect>
  );
}

export function Playground() {
  return (
    <Rect w={34} d={26} color="#f29b6b">
      {/* slide tower */}
      <Box size={[4, 3, 4]} pos={[-6, 1.5, 0]} color="#3b82f6" />
      <Gable w={4.6} h={2} l={4.6} pos={[-6, 3, 0]} color="#ef4444" />
      <mesh position={[-2.2, 1.5, 0]} rotation={[0, 0, -0.65]} castShadow>
        <boxGeometry args={[5.2, 0.2, 1.4]} />
        <meshStandardMaterial color="#facc15" />
      </mesh>
      {/* swings */}
      <group position={[7, 0, -3]}>
        {[-3, 3].map((x) => (
          <mesh key={x} position={[x, 2, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.25, 4, 0.25]} />
            <meshStandardMaterial color="#16a34a" />
          </mesh>
        ))}
        <Box size={[6.4, 0.25, 0.25]} pos={[0, 4, 0]} color="#16a34a" />
        {[-1.3, 1.3].map((x) => (
          <Box key={x} size={[1, 0.12, 0.5]} pos={[x, 1, 0]} color="#ef4444" />
        ))}
      </group>
      {/* see-saw */}
      <mesh position={[6, 0.6, 7]} rotation={[0, 0, 0.15]} castShadow>
        <boxGeometry args={[6, 0.2, 0.6]} />
        <meshStandardMaterial color="#a855f7" />
      </mesh>
      <Bench rot={0} />
    </Rect>
  );
}

export function BadmintonCourt() {
  return (
    <Rect w={16} d={24} color="#2f8f63">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]}>
        <planeGeometry args={[8, 17.4]} />
        <meshStandardMaterial color="#3fae74" />
      </mesh>
      {[-8.7, 8.7].map((z) => (
        <Box key={z} size={[8, 0.02, 0.1]} pos={[0, 0.17, z]} color="#ffffff" cast={false} />
      ))}
      {[-4, 4].map((x) => (
        <Box key={x} size={[0.1, 0.02, 17.4]} pos={[x, 0.17, 0]} color="#ffffff" cast={false} />
      ))}
      <Box size={[8.6, 0.8, 0.05]} pos={[0, 1.15, 0]} color="#f5f5f5" cast={false} />
      {[-4.3, 4.3].map((x) => (
        <Box key={x} size={[0.1, 1.55, 0.1]} pos={[x, 0.78, 0]} color="#3b3f46" />
      ))}
      {/* low fence + lights */}
      {[-7.8, 7.8].map((x) => (
        <Box key={x} size={[0.1, 1.2, 24]} pos={[x, 0.6, 0]} color="#3b3f46" cast={false} />
      ))}
    </Rect>
  );
}

export function Gazebo() {
  const roof = useMemo(() => {
    const g = new THREE.ConeGeometry(6.4, 3, 6);
    return g;
  }, []);
  return (
    <Rect w={30} d={26} color="#cfc2a3">
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[5.4, 5.6, 0.5, 6]} />
        <meshStandardMaterial color="#e2d9c6" />
      </mesh>
      {Array.from({ length: 6 }).map((_, k) => (
        <mesh
          key={k}
          position={[Math.cos((k * Math.PI) / 3) * 4.6, 2, Math.sin((k * Math.PI) / 3) * 4.6]}
          castShadow
        >
          <cylinderGeometry args={[0.18, 0.18, 3.4, 6]} />
          <meshStandardMaterial color="#8a5a35" />
        </mesh>
      ))}
      <mesh geometry={roof} position={[0, 5.1, 0]} castShadow>
        <meshStandardMaterial color={PALETTE.roof} flatShading />
      </mesh>
      <Box size={[3, 0.15, 1.6]} pos={[0, 1.1, 0]} color="#a0703f" />
      {/* BBQ grill */}
      <group position={[9, 0, 4]}>
        <Box size={[1.6, 1, 0.9]} pos={[0, 0.5, 0]} color="#2b2f35" />
        <Box size={[1.6, 0.06, 0.9]} pos={[0, 1.05, 0]} color="#f97316" cast={false} />
      </group>
      <group position={[-9, 0, -4]}>
        <Bench rot={Math.PI / 2} />
      </group>
    </Rect>
  );
}
