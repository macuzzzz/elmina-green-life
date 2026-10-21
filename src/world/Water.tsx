import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { XZ } from './coords';
import { flatPolygon, merge, ribbon } from './geom';
import { getLayout } from './layout';
import { MATERIALS } from './materials';

/** Gentle animated water, fog-aware and tinted by the day/night cycle. */
export const waterMaterial = new THREE.ShaderMaterial({
  uniforms: THREE.UniformsUtils.merge([
    THREE.UniformsLib.fog,
    {
      uTime: { value: 0 },
      uNight: { value: 0 },
      uDeep: { value: new THREE.Color('#2f8fc6') },
      uShallow: { value: new THREE.Color('#6cc7e8') },
    },
  ]),
  fog: true,
  vertexShader: /* glsl */ `
    #include <fog_pars_vertex>
    varying vec3 vWorld;
    void main() {
      vec4 world = modelMatrix * vec4(position, 1.0);
      vWorld = world.xyz;
      vec4 mvPosition = viewMatrix * world;
      gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
    }
  `,
  fragmentShader: /* glsl */ `
    #include <fog_pars_fragment>
    uniform float uTime;
    uniform float uNight;
    uniform vec3 uDeep;
    uniform vec3 uShallow;
    varying vec3 vWorld;
    void main() {
      float w = sin(vWorld.x * 0.07 + uTime * 0.8) * 0.5 + sin(vWorld.z * 0.09 - uTime * 0.6) * 0.5;
      float w2 = sin((vWorld.x + vWorld.z) * 0.23 + uTime * 1.6) * sin((vWorld.x - vWorld.z) * 0.17 - uTime * 1.1);
      vec3 col = mix(uDeep, uShallow, 0.45 + 0.22 * w);
      float sparkle = smoothstep(0.82, 1.0, w2);
      col += sparkle * 0.35 * (1.0 - uNight);
      col = mix(col, col * vec3(0.18, 0.24, 0.42) + vec3(0.0, 0.02, 0.06), uNight);
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      #include <fog_fragment>
    }
  `,
});

function scalePolygon(points: XZ[], center: XZ, s: number): XZ[] {
  return points.map(([x, z]) => [center[0] + (x - center[0]) * s, center[1] + (z - center[1]) * s]);
}

export function Water() {
  const L = getLayout();
  const geo = useMemo(() => {
    const lakes = merge(L.lakes.map((l) => flatPolygon(l.points, 0.22)));
    const banks = merge(L.lakes.map((l) => flatPolygon(scalePolygon(l.points, l.center, 1.07), 0.14)));
    const river = ribbon(L.river, 26, 0.22);
    const riverBanks = ribbon(L.river, 36, 0.12);
    return { lakes, banks, river, riverBanks };
  }, [L]);

  useFrame((_, dt) => {
    waterMaterial.uniforms.uTime.value += dt;
  });

  const fountainLake = L.lakes.find((l) => l.fountain);
  return (
    <group>
      <mesh geometry={geo.banks} material={MATERIALS.sand} receiveShadow />
      <mesh geometry={geo.lakes} material={waterMaterial} />
      <mesh geometry={geo.riverBanks} material={MATERIALS.sand} receiveShadow />
      <mesh geometry={geo.river} material={waterMaterial} />
      {fountainLake && <Fountain x={fountainLake.center[0]} z={fountainLake.center[1]} />}
    </group>
  );
}

const JETS = 260;

function Fountain({ x, z }: { x: number; z: number }) {
  const points = useRef<THREE.Points>(null);
  const seeds = useMemo(() => {
    const arr = new Float32Array(JETS * 3);
    for (let i = 0; i < JETS; i++) {
      arr[i * 3] = Math.random() * Math.PI * 2; // angle
      arr[i * 3 + 1] = Math.random(); // phase
      arr[i * 3 + 2] = 0.6 + Math.random() * 0.6; // spread
    }
    return arr;
  }, []);
  const positions = useMemo(() => new Float32Array(JETS * 3), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let i = 0; i < JETS; i++) {
      const a = seeds[i * 3];
      const p = (seeds[i * 3 + 1] + t * 0.55) % 1;
      const s = seeds[i * 3 + 2];
      const r = p * 4.2 * s;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = 0.6 + 12 * p * (1 - p) * 4 * (0.6 + 0.4 * s) * 0.5;
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
    const attr = points.current?.geometry.attributes.position as THREE.BufferAttribute | undefined;
    if (attr) attr.needsUpdate = true;
  });
  return (
    <group position={[x, 0.2, z]}>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[5.5, 6, 0.5, 24]} />
        <meshStandardMaterial color="#e8e4d8" />
      </mesh>
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.5, 0.8, 3, 10]} />
        <meshStandardMaterial color="#e8e4d8" />
      </mesh>
      <points ref={points} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#e8f7ff"
          size={0.7}
          sizeAttenuation
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
