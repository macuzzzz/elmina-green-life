import { useMemo } from 'react';
import * as THREE from 'three';
import { NEIGHBOURS } from '@/data/township';
import { rectToWorld, WORLD_H, WORLD_W } from './coords';
import { flatPolygon, flatRects, merge } from './geom';
import { getLayout } from './layout';
import { MATERIALS } from './materials';
import { Instanced } from './Instanced';

// Layer heights keep coplanar surfaces from z-fighting.
export const Y = {
  outside: -0.3,
  town: 0,
  pad: 0.04,
  park: 0.06,
  paved: 0.08,
  carPark: 0.1,
  localRoad: 0.12,
  curb: 0.16,
  road: 0.2,
  marking: 0.24,
};

export function Ground() {
  const L = getLayout();
  const geo = useMemo(() => {
    const town = flatPolygon(L.boundary, Y.town);
    const landedPads = flatRects(
      L.precincts
        .filter((p) => p.precinct.kind === 'DSLH' || p.precinct.kind === 'DSSD')
        .flatMap((p) => p.rects),
      Y.pad,
    );
    const aptPads = flatRects(
      L.precincts.filter((p) => p.precinct.kind === 'RSKU').flatMap((p) => p.rects),
      Y.pad,
    );
    const parks = flatRects(L.parks, Y.park);
    const paved = flatRects(L.paved, Y.paved);
    const carParks = flatRects(L.carParks, Y.carPark);
    const localRoads = flatRects(
      L.precincts.flatMap((p) => p.roads),
      Y.localRoad,
    );
    const neighbours = flatRects(
      NEIGHBOURS.map((n) => {
        const [x0, z0, x1, z1] = rectToWorld(n.area);
        return { x0, z0, x1, z1 };
      }),
      Y.outside + 0.05,
    );
    const outside = new THREE.PlaneGeometry(WORLD_W * 5, WORLD_H * 5);
    outside.rotateX(-Math.PI / 2);
    outside.translate(0, Y.outside, 0);
    return { town, landedPads, aptPads, parks, paved, carParks, localRoads, neighbours, outside };
  }, [L]);

  const civicPads = useMemo(
    () =>
      merge(
        L.civic.map((c) => {
          const g = new THREE.CircleGeometry(
            c.kind === 'school-complex' ? 70 : c.kind.includes('school') ? 46 : 34,
            28,
          );
          g.rotateX(-Math.PI / 2);
          g.translate(c.x, Y.pad, c.z);
          g.deleteAttribute('uv');
          return g.toNonIndexed();
        }),
      ),
    [L],
  );

  return (
    <group>
      <mesh geometry={geo.outside} material={MATERIALS.outside} receiveShadow />
      <mesh geometry={geo.neighbours} material={MATERIALS.neighbour} receiveShadow />
      <mesh geometry={geo.town} material={MATERIALS.lawnTown} receiveShadow />
      <mesh geometry={geo.landedPads} material={MATERIALS.lawn} receiveShadow />
      <mesh geometry={geo.aptPads} material={MATERIALS.sand} receiveShadow />
      <mesh geometry={civicPads} material={MATERIALS.paving} receiveShadow />
      <mesh geometry={geo.parks} material={MATERIALS.lawnDark} receiveShadow />
      <mesh geometry={geo.paved} material={MATERIALS.paving} receiveShadow />
      <mesh geometry={geo.carParks} material={MATERIALS.carPark} receiveShadow />
      <mesh geometry={geo.localRoads} material={MATERIALS.asphaltLocal} receiveShadow />
      <NeighbourBlocks />
    </group>
  );
}

function NeighbourBlocks() {
  const L = getLayout();
  const geometry = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    g.translate(0, 0.5, 0);
    return g;
  }, []);
  return (
    <Instanced
      items={L.neighbourBlocks}
      geometry={geometry}
      material={MATERIALS.neighbourBlock}
      castShadow={false}
      place={(b, o) => {
        o.position.set(b.x, Y.outside, b.z);
        o.scale.set(b.w, b.h, b.d);
      }}
    />
  );
}
