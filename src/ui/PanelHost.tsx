import { lazy, Suspense, useEffect } from 'react';
import { useCurrentUser, useStore } from '@/store';
import { SERVICES, type ServiceId } from '@/features/services/meta';
import { AvatarCreator } from '@/features/avatar/AvatarCreator';
import { ChatPanel } from '@/features/chat/ChatPanel';
import { ResidentsPanel } from '@/features/feed/ResidentsPanel';
import { DecoratePanel } from '@/features/home/DecoratePanel';
import { MyHomePanel } from '@/features/home/MyHomePanel';
import { RepairPanel } from '@/features/tickets/RepairPanel';
import { ReportPanel } from '@/features/tickets/ReportPanel';
import { SuggestPanel } from '@/features/tickets/SuggestPanel';
import { Modal } from './Modal';

const ServicePanel = lazy(() => import('@/features/services/ServicePanel'));
const SERVICE_IDS = new Set<string>(SERVICES.map((s) => s.id));

/** Hosts whichever feature panel is open (one at a time). */
export function PanelHost() {
  const panel = useStore((s) => s.panel);
  const close = () => useStore.getState().openPanel(null);
  const me = useCurrentUser();

  // First launch of a resident account: open the avatar creator.
  useEffect(() => {
    if (me?.role !== 'resident' || me.onboarded) return;
    const id = setTimeout(() => {
      if (!useStore.getState().panel) useStore.getState().openPanel({ kind: 'avatar' });
    }, 3400);
    return () => clearTimeout(id);
  }, [me?.role, me?.onboarded]);

  const size = panel?.kind === 'avatar' || panel?.kind === 'report' ? 'lg' : 'md';
  return (
    <Modal open={!!panel} onClose={close} label={panel?.kind ?? 'Panel'} size={size}>
      {panel?.kind === 'avatar' && <AvatarCreator onClose={close} />}
      {panel?.kind === 'report' && <ReportPanel location={panel.location} onClose={close} />}
      {panel?.kind === 'repair' && <RepairPanel location={panel.location} onClose={close} />}
      {panel?.kind === 'suggest' && (
        <SuggestPanel location={panel.location} item={panel.item} onClose={close} />
      )}
      {panel?.kind === 'myhome' && <MyHomePanel onClose={close} />}
      {panel?.kind === 'decorate' && <DecoratePanel onClose={close} />}
      {panel?.kind === 'chat' && <ChatPanel channelId={panel.channelId} onClose={close} />}
      {panel?.kind === 'residents' && <ResidentsPanel onClose={close} />}
      {panel && SERVICE_IDS.has(panel.kind) && (
        <Suspense
          fallback={<div className="grid h-40 place-items-center text-sm text-gray-400">Loading…</div>}
        >
          <ServicePanel id={panel.kind as ServiceId} onClose={close} />
        </Suspense>
      )}
    </Modal>
  );
}
