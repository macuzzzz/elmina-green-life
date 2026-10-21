import { Suspense, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '@/store';
import { handleMapTap, isPlacementTool } from '@/features/tickets/placement';
import { Apartments, Shops } from './Blocks';
import { CameraRig } from './CameraRig';
import { cameraController } from './cameraController';
import { Ground } from './Ground';
import { Houses } from './Houses';
import { Lighting } from './Lighting';
import { Places } from './Places';
import { Roads } from './Roads';
import { Traffic } from './Traffic';
import { StreetLamps, Trees } from './Vegetation';
import { Water } from './Water';

/** Invisible ground catcher, mounted only while a placement tool is active. */
function PlacementPlane() {
  const tool = useStore((s) => s.tool);
  const { gl } = useThree();
  const active = isPlacementTool(tool);
  useEffect(() => {
    gl.domElement.style.cursor = active ? 'crosshair' : '';
  }, [active, gl]);
  if (!active) return null;
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.5, 0]}
      visible={false}
      onClick={(e) => {
        if (e.delta > 6) return;
        e.stopPropagation();
        handleMapTap(e.point.x, e.point.z);
      }}
    >
      <planeGeometry args={[6000, 6000]} />
    </mesh>
  );
}

/** The whole 3D township. */
export function WorldCanvas() {
  const select = useStore((s) => s.select);
  // Adaptive resolution: start sharp-but-sensible, step down if frames drop,
  // back up (to the screen's density, max 2) when there's headroom.
  const maxDpr = Math.min(window.devicePixelRatio || 1, 2);
  const [dpr, setDpr] = useState(() => Math.min(maxDpr, 1.5));
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={dpr}
      shadows={{ type: THREE.PCFSoftShadowMap }}
      flat
      camera={{ fov: 38, near: 1, far: 12000, position: [0, 1500, 1500] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerMissed={(e) => {
        // Only a click (not a drag) on empty space clears the selection.
        if (
          e.type === 'click' &&
          cameraController.dragDistance < 6 &&
          !isPlacementTool(useStore.getState().tool)
        )
          select(null);
      }}
      aria-label="3D map of Elmina Green"
      onCreated={(state) => {
        if (import.meta.env.DEV) (window as unknown as { __r3f: unknown }).__r3f = state;
      }}
    >
      <PerformanceMonitor
        flipflops={4}
        onDecline={() => setDpr((d) => Math.max(1, +(d - 0.25).toFixed(2)))}
        onIncline={() => setDpr((d) => Math.min(maxDpr, +(d + 0.25).toFixed(2)))}
        onFallback={() => setDpr(1)}
      />
      <Suspense fallback={null}>
        <Lighting />
        <CameraRig />
        <Ground />
        <Roads />
        <Water />
        <Trees />
        <StreetLamps />
        <Houses />
        <Apartments />
        <Shops />
        <Places />
        <Traffic />
        <PlacementPlane />
      </Suspense>
    </Canvas>
  );
}
