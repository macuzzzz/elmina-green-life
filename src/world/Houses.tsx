import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Outlines } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '@/store';
import type { User } from '@/types';
import { DEFAULT_DECOR } from '@/features/home/decor';
import { cameraController } from './cameraController';
import {
  BASE_LOT,
  HOUSE,
  brickPanel,
  carGeometry,
  plantGeometry,
  rowBlockGeometry,
  screenPanel,
  sideGarden,
  sideWindow,
  terraceDetailed,
  terraceSimple,
} from './buildings/geometries';
import { Instanced } from './Instanced';
import { requestShadowUpdate } from './shadows';
import { handleMapTap, isPlacementTool } from '@/features/tickets/placement';
import { getLayout, type HouseLot, type ParkedCar } from './layout';
import { MATERIALS, brickMaterial, latticeMaterial } from './materials';

const brickMat = brickMaterial();
const latticeMat = latticeMaterial();

/** Places a lot-local point into the dummy object. */
function placeLot(h: HouseLot, o: THREE.Object3D, lx = 0, ly = 0, lz = 0, sx = 1, sz = 1) {
  const c = Math.cos(h.rot);
  const s = Math.sin(h.rot);
  o.position.set(h.x + lx * c + lz * s, ly, h.z - lx * s + lz * c);
  o.rotation.y = h.rot;
  o.scale.set(sx, 1, sz);
}

/** Lot transform for the simplified house geometry (scaled to the lot, DSSD narrower). */
function placeSimple(h: HouseLot, o: THREE.Object3D) {
  if (h.kind === 'DSSD') {
    const bodyW = h.w * 0.78;
    placeLot(h, o, h.partySide * (h.w - bodyW) * 0.5, 0, 0, bodyW / BASE_LOT.w, h.d / BASE_LOT.d);
  } else {
    placeLot(h, o, 0, 0, 0, h.w / BASE_LOT.w, h.d / BASE_LOT.d);
  }
}

function useSelectedUnit() {
  return useStore((s) => (s.selection?.kind === 'house' ? s.selection.unitId : null));
}

function useHouseInteraction() {
  const select = useStore((s) => s.select);
  const bounceUnit = useStore((s) => s.bounceUnit);
  const tool = useStore((s) => s.tool);
  // Cursor only — no React state, so hovering over houses never re-renders the scene.
  const onHover = useCallback((h: HouseLot | null) => {
    document.body.style.cursor = h ? 'pointer' : '';
  }, []);
  useEffect(() => () => void (document.body.style.cursor = ''), []);
  const onClick = useCallback(
    (h: HouseLot, e: ThreeEvent<MouseEvent>) => {
      if (isPlacementTool(tool)) {
        handleMapTap(e.point.x, e.point.z, h.unitId);
        return;
      }
      if (tool !== 'select') return;
      select({ kind: 'house', unitId: h.unitId });
      bounceUnit(h.unitId);
      const d = cameraController.goal.dist;
      cameraController.flyTo({ x: h.x, z: h.z }, { dist: Math.min(d, 140), duration: 0.9 });
    },
    [select, bounceUnit, tool],
  );
  return { onClick, onHover };
}

// ── EG18: detailed, every part instanced ─────────────────────────

function HeroHouses({ hiddenUnit }: { hiddenUnit: string | null }) {
  const L = getLayout();
  const houses = L.heroHouses;
  const { body, glass } = terraceDetailed();
  const hidden = hiddenUnit ? houses.findIndex((h) => h.unitId === hiddenUnit) : -1;
  const { onClick, onHover } = useHouseInteraction();
  const bf = HOUSE.bodyFront(BASE_LOT.d);
  const ends = useMemo(() => houses.filter((h) => h.endSide !== 0), [houses]);
  const plants = useMemo(
    () =>
      houses
        .filter((h) => h.plants)
        .flatMap((h) => [
          { h, side: -1 },
          { h, side: 1 },
        ]),
    [houses],
  );
  const decorCars = useStore((s) => decorKey(s.users, 'car'));
  const cars = useMemo(() => {
    const byUnit = new Map(decorCars ? (JSON.parse(decorCars) as [string, string][]) : []);
    return houses
      .map((h) => (byUnit.has(h.unitId) ? { ...h, carColor: byUnit.get(h.unitId)! } : h))
      .filter((h) => h.carColor);
  }, [houses, decorCars]);
  return (
    <group>
      <Instanced
        items={houses}
        geometry={body}
        material={MATERIALS.vertex}
        place={(h, o) => placeLot(h, o)}
        hiddenIndex={hidden}
        onClick={onClick}
        onHover={onHover}
      />
      <Instanced
        items={houses}
        geometry={glass}
        material={MATERIALS.glass}
        place={(h, o) => placeLot(h, o)}
        hiddenIndex={hidden}
        castShadow={false}
      />
      <Instanced
        items={houses}
        geometry={brickPanel()}
        material={brickMat}
        place={(h, o) =>
          placeLot(h, o, (h.brickLeft ? -1 : 1) * (BASE_LOT.w / 2 - 1.05), HOUSE.wallH / 2, bf + 0.12)
        }
        hiddenIndex={hidden}
      />
      <Instanced
        items={houses}
        geometry={screenPanel()}
        material={latticeMat}
        place={(h, o) =>
          h.screen ? placeLot(h, o, (h.brickLeft ? 1 : -1) * (BASE_LOT.w / 2 - 0.95), 5.2, bf + 0.12) : false
        }
        hiddenIndex={hidden}
        castShadow={false}
      />
      <Instanced
        items={ends}
        geometry={sideWindow()}
        material={MATERIALS.glass}
        place={(h, o) => placeLot(h, o, h.endSide * (BASE_LOT.w / 2 + 0.01), 5.0, bf - 7)}
        castShadow={false}
      />
      <Instanced
        items={ends}
        geometry={sideGarden()}
        material={MATERIALS.vertex}
        place={(h, o) => placeLot(h, o, h.endSide * (BASE_LOT.w / 2 + 1.4))}
      />
      <Instanced
        items={plants}
        geometry={plantGeometry()}
        material={MATERIALS.vertex}
        place={(p, o) => placeLot(p.h, o, p.side * (BASE_LOT.w / 2 - 0.8), 0, BASE_LOT.d / 2 - 1.1)}
        castShadow={false}
      />
      <Instanced
        items={cars}
        geometry={carGeometry()}
        material={MATERIALS.car}
        place={(h, o) => {
          placeLot(h, o, h.brickLeft ? 0.9 : -0.9, 0.1, bf + 3.2);
          o.rotation.y = h.rot + Math.PI;
        }}
        color={(h) => h.carColor ?? '#ffffff'}
      />
    </group>
  );
}

/** Stable string of decorated units (so selectors don't re-render on unrelated changes). */
function decorKey(users: User[], what: 'car' | 'gate') {
  const pairs = users
    .filter(
      (u) =>
        u.unitId &&
        u.decor &&
        (what === 'car' ? u.decor.carColor : u.decor.gateColor !== DEFAULT_DECOR.gateColor),
    )
    .map((u) => [u.unitId, what === 'car' ? u.decor!.carColor : u.decor!.gateColor]);
  return pairs.length ? JSON.stringify(pairs) : '';
}

/** Recoloured gates for residents who decorated their home. */
function DecorGates() {
  const key = useStore((s) => decorKey(s.users, 'gate'));
  const L = getLayout();
  if (!key) return null;
  const pairs = JSON.parse(key) as [string, string][];
  return (
    <group>
      {pairs.map(([unitId, color]) => {
        const h = L.unitMap.get(unitId);
        if (!h) return null;
        const sx = h.w / BASE_LOT.w;
        const c = Math.cos(h.rot);
        const s = Math.sin(h.rot);
        const lz = (BASE_LOT.d / 2 - 0.25) * (h.d / BASE_LOT.d);
        return (
          <mesh
            key={unitId}
            position={[h.x + lz * s, 0.78, h.z + lz * c]}
            rotation={[0, h.rot, 0]}
            scale={[sx, 1, 1]}
          >
            <boxGeometry args={[BASE_LOT.w - 0.95, 1.42, 0.16]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
        );
      })}
    </group>
  );
}

// ── Other precincts: one simplified mesh per house ───────────────

function SimpleHouses({ hiddenUnit }: { hiddenUnit: string | null }) {
  const L = getLayout();
  const houses = L.simpleHouses;
  const { body, glass } = terraceSimple();
  const hidden = hiddenUnit ? houses.findIndex((h) => h.unitId === hiddenUnit) : -1;
  const { onClick, onHover } = useHouseInteraction();
  return (
    <group>
      <Instanced
        items={houses}
        geometry={body}
        material={MATERIALS.vertex}
        place={placeSimple}
        hiddenIndex={hidden}
        onClick={onClick}
        onHover={onHover}
      />
      <Instanced
        items={houses}
        geometry={glass}
        material={MATERIALS.glass}
        place={placeSimple}
        hiddenIndex={hidden}
        castShadow={false}
      />
    </group>
  );
}

function RowBlocks() {
  const L = getLayout();
  return (
    <Instanced
      items={L.rowBlocks}
      tileSize={0}
      geometry={rowBlockGeometry()}
      material={MATERIALS.vertex}
      place={(r, o) => {
        o.position.set(r.x, 0, r.z);
        o.rotation.y = r.rot;
        o.scale.set(r.length, 1, r.depth / BASE_LOT.d);
      }}
    />
  );
}

export function ParkedCars({ cars }: { cars: ParkedCar[] }) {
  return (
    <Instanced
      items={cars}
      geometry={carGeometry()}
      material={MATERIALS.car}
      place={(c, o) => {
        o.position.set(c.x, 0.1, c.z);
        o.rotation.y = c.rot;
      }}
      color={(c) => c.color}
      castShadow={false}
    />
  );
}

// ── Selected house: detailed copy with outline + bounce ──────────

function SelectedHouse({ unitId }: { unitId: string }) {
  const L = getLayout();
  const h = L.unitMap.get(unitId);
  const group = useRef<THREE.Group>(null);
  const bounce = useStore((s) => s.bounce);
  const start = useRef(0);
  const { body, glass } = terraceDetailed();
  useEffect(() => {
    if (bounce?.unitId === unitId) start.current = performance.now();
  }, [bounce, unitId]);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const t = (performance.now() - start.current) / 1000;
    // Damped spring bounce.
    const y = t < 1.2 ? Math.abs(Math.sin(t * 9)) * Math.exp(-t * 4.2) * 2.2 : 0;
    if (t < 1.3) requestShadowUpdate();
    const squash = t < 1.2 ? 1 + Math.sin(t * 18) * Math.exp(-t * 5) * 0.06 : 1;
    g.position.y = y;
    g.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
  });
  if (!h) return null;
  const sx = h.kind === 'DSSD' ? (h.w * 0.78) / BASE_LOT.w : h.w / BASE_LOT.w;
  const offX = h.kind === 'DSSD' ? h.partySide * (h.w - h.w * 0.78) * 0.5 : 0;
  const bf = HOUSE.bodyFront(BASE_LOT.d);
  return (
    <group position={[h.x, 0, h.z]} rotation={[0, h.rot, 0]}>
      <group position={[offX, 0, 0]} scale={[sx, 1, h.d / BASE_LOT.d]}>
        <group ref={group}>
          <mesh geometry={body} material={MATERIALS.vertex} castShadow receiveShadow>
            <Outlines thickness={0.08} color="#ffd34d" screenspace={false} angle={0} />
          </mesh>
          <mesh geometry={glass} material={MATERIALS.glass} />
          <mesh
            geometry={brickPanel()}
            material={brickMat}
            position={[(h.brickLeft ? -1 : 1) * (BASE_LOT.w / 2 - 1.05), HOUSE.wallH / 2, bf + 0.12]}
          />
          {h.screen && (
            <mesh
              geometry={screenPanel()}
              material={latticeMat}
              position={[(h.brickLeft ? 1 : -1) * (BASE_LOT.w / 2 - 0.95), 5.2, bf + 0.12]}
            />
          )}
        </group>
      </group>
      {/* glow ring on the ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.3, 0]}>
        <ringGeometry args={[Math.max(h.w, 8) * 0.75, Math.max(h.w, 8) * 0.75 + 0.8, 40]} />
        <meshBasicMaterial color="#ffd34d" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

/** Small dark address plates on the gate pillars. */
function PlateMeshes() {
  const L = getLayout();
  const geo = useMemo(() => new THREE.BoxGeometry(0.7, 0.4, 0.06), []);
  return (
    <Instanced
      items={L.heroHouses}
      geometry={geo}
      material={MATERIALS.dark}
      castShadow={false}
      place={(h, o) =>
        placeLot(h, o, (h.brickLeft ? 1 : -1) * (BASE_LOT.w / 2 - 0.25), 1.45, BASE_LOT.d / 2 - 0.02)
      }
    />
  );
}

// ── LOD switch ───────────────────────────────────────────────────

export function Houses() {
  const L = getLayout();
  const lod = useStore((s) => s.lod);
  const selected = useSelectedUnit();
  const showDetail = lod !== 'far';
  return (
    <group>
      {showDetail ? (
        <>
          <HeroHouses hiddenUnit={selected} />
          <SimpleHouses hiddenUnit={selected} />
          <ParkedCars cars={L.parkedCars} />
          <DecorGates />
        </>
      ) : (
        <RowBlocks />
      )}
      {lod === 'near' && <PlateMeshes />}
      {selected && showDetail && <SelectedHouse unitId={selected} />}
    </group>
  );
}
