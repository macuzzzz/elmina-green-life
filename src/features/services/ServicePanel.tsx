import type { ServiceId } from './meta';
import { EventsPanel } from './EventsPanel';
import { FacilitiesPanel } from './FacilitiesPanel';
import { FeesPanel } from './FeesPanel';
import { LostFoundPanel } from './LostFoundPanel';
import { ParcelsPanel } from './ParcelsPanel';
import { PollsPanel } from './PollsPanel';
import { SwapPanel } from './SwapPanel';
import { VisitorsPanel } from './VisitorsPanel';

const PANELS: Record<ServiceId, (p: { onClose: () => void }) => JSX.Element | null> = {
  facilities: FacilitiesPanel,
  visitors: VisitorsPanel,
  events: EventsPanel,
  parcels: ParcelsPanel,
  fees: FeesPanel,
  swap: SwapPanel,
  lostfound: LostFoundPanel,
  polls: PollsPanel,
};

/** Lazy-loaded entry for the community service panels (one chunk for all of them). */
export default function ServicePanel({ id, onClose }: { id: ServiceId; onClose: () => void }) {
  const Panel = PANELS[id];
  return <Panel onClose={onClose} />;
}
