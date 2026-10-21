import { lazy, Suspense, useEffect } from 'react';
import type { Role } from '@/types';
import { useIsDesktop } from '@/lib/useMediaQuery';
import { WorldCanvas } from '@/world/Scene';
import { cameraController } from '@/world/cameraController';
import { rolePost } from '@/world/recenter';
import { DesktopHud } from '@/ui/hud/DesktopHud';
import { PhoneHud } from '@/ui/hud/PhoneHud';
import { Overlays } from '@/ui/Overlays';
import { WorldLabels } from '@/ui/WorldLabels';
import { PanelHost } from '@/ui/PanelHost';

const GuardDrawer = lazy(() => import('@/features/guard/GuardDrawer'));
const ManagementPanel = lazy(() => import('@/features/admin/ManagementPanel'));

export function GameScreen({ role }: { role: Role }) {
  const isDesktop = useIsDesktop();

  useEffect(() => {
    // Intro: start over the whole township, then glide to the role's post.
    cameraController.jumpTo({ tx: 0, tz: 150, dist: 2300, pitch: 1.1, yaw: 0 });
    const post = rolePost(role);
    const id = setTimeout(() => {
      cameraController.flyTo(
        { x: post.x, z: post.z },
        { dist: post.dist, pitch: post.pitch, yaw: post.yaw, duration: 2.4 },
      );
    }, 700);
    return () => clearTimeout(id);
  }, [role]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <WorldCanvas />
      <WorldLabels />
      {isDesktop ? <DesktopHud role={role} /> : <PhoneHud role={role} />}
      <Suspense fallback={null}>
        {role === 'guard' && <GuardDrawer />}
        {role === 'management' && <ManagementPanel />}
      </Suspense>
      <Overlays />
      <PanelHost />
    </div>
  );
}
