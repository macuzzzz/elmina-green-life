import { useMemo } from 'react';
import * as THREE from 'three';
import { useStore } from '@/store';
import {
  APT_STOREYS,
  apartmentGeometry,
  apartmentGlass,
  awningGeometry,
  shopGeometry,
  shopGlass,
} from './buildings/geometries';
import { Instanced } from './Instanced';
import { getLayout, type AptBlock, type ShopUnit } from './layout';
import { MATERIALS, textTexture } from './materials';

const APT_LEN = 44;
const APT_DEPTH = 15;

export function Apartments() {
  const L = getLayout();
  const place = (a: AptBlock, o: THREE.Object3D) => {
    o.position.set(a.x, 0, a.z);
    o.scale.set(a.len / APT_LEN, a.storeys / APT_STOREYS, a.depth / APT_DEPTH);
  };
  return (
    <group>
      <Instanced
        items={L.apartments}
        geometry={apartmentGeometry(APT_LEN, APT_DEPTH)}
        material={MATERIALS.vertex}
        place={place}
      />
      <Instanced
        items={L.apartments}
        geometry={apartmentGlass(APT_LEN, APT_DEPTH)}
        material={MATERIALS.glass}
        place={place}
        castShadow={false}
      />
    </group>
  );
}

const SHOP_W = 20 * 0.3048 * 1.3;
const SHOP_D = 20;

export function Shops() {
  const L = getLayout();
  const lod = useStore((s) => s.lod);
  const place = (s: ShopUnit, o: THREE.Object3D) => {
    o.position.set(s.x, 0, s.z);
    o.rotation.y = s.rot;
    o.scale.set(s.w / SHOP_W, s.storeys / 3, s.d / SHOP_D);
  };
  const named = useMemo(() => L.shops.filter((s) => s.sign), [L]);
  return (
    <group>
      <Instanced
        items={L.shops}
        geometry={shopGeometry(SHOP_W, SHOP_D)}
        material={MATERIALS.vertex}
        place={place}
      />
      <Instanced
        items={L.shops}
        geometry={shopGlass(SHOP_W, SHOP_D)}
        material={MATERIALS.glass}
        place={place}
        castShadow={false}
      />
      <Instanced
        items={L.shops}
        geometry={awningGeometry(SHOP_W)}
        material={MATERIALS.awning}
        place={(s, o) => {
          // Awnings stay at ground-floor height regardless of storey count.
          o.position.set(s.x, 0, s.z);
          o.rotation.y = s.rot;
          o.translateZ(s.d / 2);
        }}
        color={(s) => s.awning}
        castShadow={false}
      />
      {lod !== 'far' && named.map((s, i) => <ShopSign key={i} shop={s} />)}
    </group>
  );
}

const signCache = new Map<string, THREE.Texture>();
function signTexture(name: string, bg: string) {
  const key = `${name}|${bg}`;
  let t = signCache.get(key);
  if (!t) {
    t = textTexture(name, {
      w: 512,
      h: 96,
      bg,
      fg: '#ffffff',
      font: '800 50px "Baloo 2", Nunito, sans-serif',
    });
    signCache.set(key, t);
  }
  return t;
}

function ShopSign({ shop }: { shop: ShopUnit }) {
  const tex = signTexture(shop.sign ?? '', shop.awning);
  const c = Math.cos(shop.rot);
  const s = Math.sin(shop.rot);
  const lz = shop.d / 2 + 0.2;
  return (
    <mesh position={[shop.x + lz * s, 4.35, shop.z + lz * c]} rotation={[0, shop.rot, 0]}>
      <planeGeometry args={[shop.w * 0.9, shop.w * 0.9 * (96 / 512)]} />
      <meshBasicMaterial map={tex} />
    </mesh>
  );
}
