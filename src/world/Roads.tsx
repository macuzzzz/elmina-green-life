import { useMemo } from 'react';
import * as THREE from 'three';
import { HIGHWAY } from '@/data/township';
import { WORLD_H } from './coords';
import { dashes, merge, ribbon } from './geom';
import { Y } from './Ground';
import { getLayout } from './layout';
import { MATERIALS, PALETTE, textTexture } from './materials';

export function Roads() {
  const L = getLayout();
  const geo = useMemo(() => {
    const curb = merge(L.roads.map((r) => ribbon(r.points, r.width + 4, Y.curb)));
    const main = merge(L.roads.filter((r) => r.cls === 'main').map((r) => ribbon(r.points, r.width, Y.road)));
    const local = merge(
      L.roads.filter((r) => r.cls === 'local').map((r) => ribbon(r.points, r.width, Y.road)),
    );
    const marks = merge(
      L.roads.filter((r) => r.cls === 'main').map((r) => dashes(r.points, 4, 5, 0.35, Y.marking)),
    );
    // Roundabouts: asphalt ring + planted island.
    const ring = merge(
      L.roundabouts.map(([x, z]) => {
        const g = new THREE.RingGeometry(9, 25, 40);
        g.rotateX(-Math.PI / 2);
        g.translate(x, Y.road + 0.01, z);
        g.deleteAttribute('uv');
        return g.toNonIndexed();
      }),
    );
    const island = merge(
      L.roundabouts.map(([x, z]) => {
        const g = new THREE.CylinderGeometry(9, 9.4, 0.6, 32);
        g.translate(x, 0.3, z);
        g.deleteAttribute('uv');
        return g.toNonIndexed();
      }),
    );
    return { curb, main, local, marks, ring, island };
  }, [L]);

  return (
    <group>
      <mesh geometry={geo.curb} material={MATERIALS.curb} receiveShadow />
      <mesh geometry={geo.main} material={MATERIALS.asphalt} receiveShadow />
      <mesh geometry={geo.local} material={MATERIALS.asphaltLocal} receiveShadow />
      <mesh geometry={geo.marks} material={MATERIALS.marking} />
      <mesh geometry={geo.ring} material={MATERIALS.asphalt} receiveShadow />
      <mesh geometry={geo.island} material={MATERIALS.lawnDark} receiveShadow castShadow />
      {L.roundabouts.map(([x, z], i) => (
        <RoundaboutCentre key={i} x={x} z={z} />
      ))}
      <Highway />
    </group>
  );
}

function RoundaboutCentre({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.6, z]}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[2.2, 2.6, 0.8, 16]} />
        <meshStandardMaterial color="#e9e4d8" />
      </mesh>
      <mesh position={[0, 3.2, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.9, 5, 8]} />
        <meshStandardMaterial color={PALETTE.brick} />
      </mesh>
      <mesh position={[0, 6.4, 0]} castShadow>
        <icosahedronGeometry args={[1.4, 0]} />
        <meshStandardMaterial color="#2fa452" flatShading />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <mesh
          key={k}
          position={[Math.cos((k / 6) * Math.PI * 2) * 6, 0.5, Math.sin((k / 6) * Math.PI * 2) * 6]}
        >
          <icosahedronGeometry args={[1.1, 0]} />
          <meshStandardMaterial color={k % 2 ? '#f472b6' : '#facc15'} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Highway() {
  const L = getLayout();
  const x = L.highwayX;
  const len = WORLD_H * 1.3;
  const W = HIGHWAY.width;
  const geo = useMemo(() => {
    const lanes: THREE.BufferGeometry[] = [];
    for (const off of [-W / 2 + 4.5, -4.5, 4.5, W / 2 - 4.5]) {
      if (Math.abs(off) < 5) continue;
      lanes.push(
        dashes(
          [
            [x + off * 0.5, -len / 2],
            [x + off * 0.5, len / 2],
          ],
          6,
          8,
          0.35,
          Y.marking,
        ),
      );
    }
    return merge(lanes);
  }, [x, len, W]);
  const rawang = useMemo(() => textTexture('TO RAWANG', { w: 512, h: 128, fg: '#ffffff' }), []);
  const arrow = useMemo(() => textTexture('↑', { w: 128, h: 128, fg: '#ffffff' }), []);
  const tollSign = useMemo(
    () => textTexture('TOL ELMINA', { w: 512, h: 96, bg: '#1f6d3a', fg: '#ffffff' }),
    [],
  );
  const tz = L.tollZ;
  const signZ = -WORLD_H * 0.32;
  return (
    <group>
      {/* carriageways + median */}
      <mesh position={[x, Y.road, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, len]} />
        <primitive object={MATERIALS.asphalt} attach="material" />
      </mesh>
      <mesh position={[x, Y.curb, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W + 6, len]} />
        <primitive object={MATERIALS.curb} attach="material" />
      </mesh>
      <mesh position={[x, 0.45, 0]}>
        <boxGeometry args={[2.2, 0.5, len]} />
        <primitive object={MATERIALS.lawnDark} attach="material" />
      </mesh>
      <mesh geometry={geo} material={MATERIALS.marking} />
      {/* widened toll apron */}
      <mesh position={[x, Y.road + 0.01, tz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W + 26, 130]} />
        <primitive object={MATERIALS.asphalt} attach="material" />
      </mesh>
      <TollPlaza x={x} z={tz} width={W + 24} sign={tollSign} />
      {/* painted road text, reads north */}
      <mesh position={[x - W / 4, Y.marking + 0.01, signZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W / 2 - 2, 4.2]} />
        <meshBasicMaterial map={rawang} transparent depthWrite={false} />
      </mesh>
      <mesh position={[x - W / 4, Y.marking + 0.01, signZ + 14]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 8]} />
        <meshBasicMaterial map={arrow} transparent depthWrite={false} />
      </mesh>
      {/* overhead gantry */}
      <group position={[x, 0, signZ - 40]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[(s * (W + 4)) / 2, 5.5, 0]} castShadow>
            <boxGeometry args={[0.6, 11, 0.6]} />
            <primitive object={MATERIALS.lampPole} attach="material" />
          </mesh>
        ))}
        <mesh position={[0, 10.5, 0]}>
          <boxGeometry args={[W + 4, 0.6, 0.6]} />
          <primitive object={MATERIALS.lampPole} attach="material" />
        </mesh>
        <mesh position={[-W / 4, 9.2, 0.4]}>
          <planeGeometry args={[W / 2 - 2, 3.6]} />
          <meshBasicMaterial map={rawang} color="#ffffff" />
        </mesh>
        <mesh position={[-W / 4, 9.2, 0.35]}>
          <planeGeometry args={[W / 2 - 1.4, 4]} />
          <meshStandardMaterial color="#1f6d3a" />
        </mesh>
      </group>
    </group>
  );
}

function TollPlaza({ x, z, width, sign }: { x: number; z: number; width: number; sign: THREE.Texture }) {
  const booths = 8;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 7.4, 0]} castShadow>
        <boxGeometry args={[width, 0.8, 16]} />
        <meshStandardMaterial color="#f2f2ee" />
      </mesh>
      <mesh position={[0, 7.4, 8.05]}>
        <planeGeometry args={[width * 0.5, 1.6]} />
        <meshBasicMaterial map={sign} />
      </mesh>
      <mesh position={[0, 7.85, 0]}>
        <boxGeometry args={[width + 0.4, 0.2, 16.4]} />
        <meshStandardMaterial color="#2fa452" />
      </mesh>
      {Array.from({ length: booths }).map((_, i) => {
        const bx = -width / 2 + ((i + 0.5) * width) / booths;
        return (
          <group key={i} position={[bx, 0, 0]}>
            <mesh position={[0, 1.4, 0]} castShadow>
              <boxGeometry args={[1.8, 2.8, 3.2]} />
              <meshStandardMaterial color="#e8eef2" />
            </mesh>
            <mesh position={[0, 3.6, 0]}>
              <boxGeometry args={[0.4, 7.2, 0.4]} />
              <meshStandardMaterial color="#c9ccd1" />
            </mesh>
            <mesh position={[0, 2.95, 1.62]}>
              <boxGeometry args={[1.6, 0.3, 0.05]} />
              <meshStandardMaterial
                color={i % 3 === 0 ? '#ef4444' : '#22c55e'}
                emissive={i % 3 === 0 ? '#ef4444' : '#22c55e'}
                emissiveIntensity={0.8}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
