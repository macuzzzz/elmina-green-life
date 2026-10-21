import type { AppNotification } from '@/types';
import { useStore } from '@/store';
import { cameraController } from '@/world/cameraController';
import { getLayout } from '@/world/layout';

/** Navigate to whatever a notification points at. */
export function openLink(link: NonNullable<AppNotification['link']>) {
  const s = useStore.getState();
  const fly = (x: number, z: number) => cameraController.flyTo({ x, z }, { dist: 150 });
  switch (link.kind) {
    case 'incident': {
      const i = s.incidents.find((x) => x.id === link.id);
      if (i) fly(i.location.x, i.location.z);
      s.select({ kind: 'incident', id: link.id });
      break;
    }
    case 'repair': {
      const r = s.repairs.find((x) => x.id === link.id);
      if (r) fly(r.location.x, r.location.z);
      s.select({ kind: 'repair', id: link.id });
      break;
    }
    case 'suggestion': {
      const g = s.suggestions.find((x) => x.id === link.id);
      if (g) fly(g.location.x, g.location.z);
      s.select({ kind: 'suggestion', id: link.id });
      break;
    }
    case 'message':
      s.openPanel({ kind: 'chat', channelId: link.id });
      break;
    case 'post': {
      const p = s.posts.find((x) => x.id === link.id);
      const author = p ? s.users.find((u) => u.id === p.authorId) : undefined;
      const lot = author?.unitId ? getLayout().unitMap.get(author.unitId) : undefined;
      if (lot) fly(lot.x, lot.z);
      s.focusPost(link.id);
      break;
    }
    case 'announcement': {
      const a = s.announcements.find((x) => x.id === link.id);
      if (a) s.toast(`📢 ${a.title} — ${a.body}`);
      break;
    }
    case 'booking':
      s.openPanel({ kind: 'facilities' });
      break;
    case 'visitor':
      s.openPanel({ kind: 'visitors' });
      break;
    case 'event':
      s.openPanel({ kind: 'events' });
      break;
    case 'parcel':
      s.openPanel({ kind: 'parcels' });
      break;
    case 'fee':
      s.openPanel({ kind: 'fees' });
      break;
    case 'listing':
      s.openPanel({ kind: 'swap' });
      break;
    case 'lost-found':
      s.openPanel({ kind: 'lostfound' });
      break;
    case 'poll':
      s.openPanel({ kind: 'polls' });
      break;
  }
}
