import { useMemo } from 'react';
import * as THREE from 'three';
import { useStore } from '@/store';
import { lampGeometries, treeGeometries } from './buildings/geometries';
import { Instanced } from './Instanced';
import { getLayout, type Spot, type TreeSpot } from './layout';
import { MATERIALS } from './materials';

const VIVID = ['#3f9a3c', '#4aa843', '#58b548', '#2f8a3b', '#67bd4f', '#3b9f55'];
const MUTED = ['#8aa77a', '#97b186', '#7f9c72', '#a3b893'];
const tmp = new THREE.Color();

function canopyColor(t: TreeSpot) {
  const list = t.muted ? MUTED : VIVID;
  return tmp.set(list[Math.floor(t.shade * list.length) % list.length]).getHexString();
}

export function Trees() {
  const L = getLayout();
  const { trunk, canopy, canopy2 } = treeGeometries();
  const lod = useStore((s) => s.lod);
  // At far zoom, skip the small verge trees to save draw time.
  const trees = useMemo(() => L.trees, [L]);
  // Zoomed out, every tree is on screen: one mesh each is cheapest. Zoomed in,
  // map tiles let off-screen trees be culled from the main and shadow passes.
  const tileSize = lod === 'far' ? 0 : 260;
  const place = (t: TreeSpot, o: THREE.Object3D, i: number) => {
    o.position.set(t.x, 0, t.z);
    o.rotation.y = (i * 2.399) % (Math.PI * 2);
    o.scale.setScalar(t.s * 1.15);
  };
  return (
    <group>
      <Instanced
        items={trees}
        tileSize={tileSize}
        geometry={trunk}
        material={MATERIALS.trunk}
        place={place}
        castShadow={lod !== 'far'}
      />
      <Instanced
        items={trees}
        tileSize={tileSize}
        geometry={canopy}
        material={MATERIALS.canopy}
        place={place}
        color={(t) => `#${canopyColor(t)}`}
      />
      <Instanced
        items={trees}
        tileSize={tileSize}
        geometry={canopy2}
        material={MATERIALS.canopy}
        place={place}
        color={(t) =>
          `#${tmp
            .set(`#${canopyColor(t)}`)
            .offsetHSL(0.02, 0.05, 0.06)
            .getHexString()}`
        }
        castShadow={false}
      />
    </group>
  );
}

export function StreetLamps() {
  const L = getLayout();
  const { pole, head } = lampGeometries();
  const lamps = useMemo(() => [...L.lamps, ...L.heroLamps], [L]);
  const place = (l: Spot, o: THREE.Object3D) => {
    o.position.set(l.x, 0, l.z);
    o.rotation.y = l.rot;
  };
  return (
    <group>
      <Instanced
        items={lamps}
        geometry={pole}
        material={MATERIALS.lampPole}
        place={place}
        receiveShadow={false}
      />
      <Instanced
        items={lamps}
        geometry={head}
        material={MATERIALS.lampHead}
        place={place}
        castShadow={false}
      />
    </group>
  );
}
