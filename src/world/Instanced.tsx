import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';

const dummy = new THREE.Object3D();
const zero = new THREE.Matrix4().makeScale(0, 0, 0);
const tmpColor = new THREE.Color();

export interface InstancedProps<T> {
  items: T[];
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  /** Position the dummy for item i. Return false to hide the instance. */
  place: (item: T, o: THREE.Object3D, i: number) => void | false;
  color?: (item: T, i: number) => THREE.ColorRepresentation;
  castShadow?: boolean;
  receiveShadow?: boolean;
  /** Instance index to hide (e.g. the house currently shown as a highlighted copy). */
  hiddenIndex?: number | null;
  onClick?: (item: T, e: ThreeEvent<MouseEvent>) => void;
  onHover?: (item: T | null) => void;
  visible?: boolean;
  /**
   * Split into square map tiles of this size (metres) so off-screen tiles are
   * frustum-culled in both the main and shadow passes (and skipped by raycasts).
   * 0 = one mesh for everything (fewest draw calls, best when it's all on screen).
   */
  tileSize?: number;
}

/**
 * three.js keys vertex-array state by geometry, so tiles sharing one geometry
 * would rebind attributes on every draw. Each tile gets a lightweight alias that
 * shares the same GPU buffers but has its own id (and so its own VAO).
 */
const aliases = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry[]>();
function geometryFor(base: THREE.BufferGeometry, tile: number) {
  if (tile === 0) return base;
  let list = aliases.get(base);
  if (!list) aliases.set(base, (list = []));
  if (!list[tile]) {
    const g = new THREE.BufferGeometry();
    for (const name of Object.keys(base.attributes)) g.setAttribute(name, base.getAttribute(name));
    g.setIndex(base.index);
    g.boundingBox = base.boundingBox;
    g.boundingSphere = base.boundingSphere;
    list[tile] = g;
  }
  return list[tile];
}

interface Tile {
  /** Global item indices in this tile. */
  indices: number[];
  /** Global index → local instance id. */
  local: Map<number, number>;
}

/** Static instanced geometry built from data. Matrices are written once per data change. */
export function Instanced<T>({
  items,
  geometry,
  material,
  place,
  color,
  castShadow = true,
  receiveShadow = true,
  hiddenIndex = null,
  onClick,
  onHover,
  visible = true,
  tileSize = 260,
}: InstancedProps<T>) {
  const matrices = useMemo(() => {
    const arr: THREE.Matrix4[] = [];
    items.forEach((item, i) => {
      dummy.position.set(0, 0, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      const ok = place(item, dummy, i);
      dummy.updateMatrix();
      arr.push(ok === false ? zero.clone() : dummy.matrix.clone());
    });
    return arr;
    // `place` is expected to be stable per data set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const tiles = useMemo<Tile[]>(() => {
    // Small sets aren't worth the extra draw calls.
    if (!tileSize || matrices.length < 200) {
      const indices = matrices.map((_, i) => i);
      return [{ indices, local: new Map(indices.map((g, l) => [g, l])) }];
    }
    const byKey = new Map<string, number[]>();
    matrices.forEach((m, i) => {
      const key = `${Math.floor(m.elements[12] / tileSize)},${Math.floor(m.elements[14] / tileSize)}`;
      const list = byKey.get(key);
      if (list) list.push(i);
      else byKey.set(key, [i]);
    });
    return [...byKey.values()].map((indices) => ({ indices, local: new Map(indices.map((g, l) => [g, l])) }));
  }, [matrices, tileSize]);

  if (items.length === 0) return null;
  return (
    <>
      {tiles.map((tile, t) => (
        <TileMesh
          key={t}
          tile={tile}
          items={items}
          matrices={matrices}
          geometry={geometryFor(geometry, t)}
          material={material}
          color={color}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
          visible={visible}
          hiddenLocal={hiddenIndex !== null && hiddenIndex >= 0 ? tile.local.get(hiddenIndex) : undefined}
          onClick={onClick}
          onHover={onHover}
        />
      ))}
    </>
  );
}

function TileMesh<T>({
  tile,
  items,
  matrices,
  geometry,
  material,
  color,
  castShadow,
  receiveShadow,
  visible,
  hiddenLocal,
  onClick,
  onHover,
}: {
  tile: Tile;
  items: T[];
  matrices: THREE.Matrix4[];
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  color?: (item: T, i: number) => THREE.ColorRepresentation;
  castShadow: boolean;
  receiveShadow: boolean;
  visible: boolean;
  hiddenLocal: number | undefined;
  onClick?: (item: T, e: ThreeEvent<MouseEvent>) => void;
  onHover?: (item: T | null) => void;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    tile.indices.forEach((g, l) => mesh.setMatrixAt(l, matrices[g]));
    if (color) {
      tile.indices.forEach((g, l) => mesh.setColorAt(l, tmpColor.set(color(items[g], g))));
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tile, matrices]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh || hiddenLocal === undefined) return;
    mesh.setMatrixAt(hiddenLocal, zero);
    mesh.instanceMatrix.needsUpdate = true;
    return () => {
      mesh.setMatrixAt(hiddenLocal, matrices[tile.indices[hiddenLocal]]);
      mesh.instanceMatrix.needsUpdate = true;
    };
  }, [hiddenLocal, matrices, tile]);

  const itemAt = (instanceId: number) => items[tile.indices[instanceId]];

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, tile.indices.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      visible={visible}
      onClick={
        onClick
          ? (e) => {
              if (e.delta > 6 || e.instanceId === undefined) return;
              e.stopPropagation();
              onClick(itemAt(e.instanceId), e);
            }
          : undefined
      }
      onPointerMove={
        onHover
          ? (e) => {
              if (e.instanceId === undefined) return;
              e.stopPropagation();
              onHover(itemAt(e.instanceId));
            }
          : undefined
      }
      onPointerOut={onHover ? () => onHover(null) : undefined}
    />
  );
}
