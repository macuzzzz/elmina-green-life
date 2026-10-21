import { formatDistanceToNowStrict } from 'date-fns';
import { Paintbrush, UserRoundPen } from 'lucide-react';
import { PRECINCT_BY_ID } from '@/data/township';
import { useCurrentUser, useStore, type Selection } from '@/store';
import { Avatar } from '@/ui/Avatar';
import { PanelHeader } from '@/ui/Modal';
import { cameraController } from '@/world/cameraController';
import {
  INCIDENT_STATUS_LABEL,
  REPAIR_STATUS_LABEL,
  incidentMeta,
  repairMeta,
  suggestionMeta,
  suggestionStatusMeta,
} from '@/features/tickets/meta';

const ago = (iso: string) => formatDistanceToNowStrict(new Date(iso), { addSuffix: true });

/** My Home: unit info, household, my tickets, decorate. */
export function MyHomePanel({ onClose }: { onClose: () => void }) {
  const me = useCurrentUser();
  const users = useStore((s) => s.users);
  const incidents = useStore((s) => s.incidents);
  const repairs = useStore((s) => s.repairs);
  const suggestions = useStore((s) => s.suggestions);
  const openPanel = useStore((s) => s.openPanel);
  if (!me?.unitId) return null;
  const precinct = PRECINCT_BY_ID[me.unitId.split('-')[0]];
  const household = users.filter((u) => u.unitId === me.unitId);

  const goTo = (sel: Selection, x: number, z: number) => {
    onClose();
    useStore.getState().select(sel);
    cameraController.flyTo({ x, z }, { dist: 150 });
  };

  const Row = ({
    icon,
    title,
    status,
    when,
    onClick,
  }: {
    icon: string;
    title: string;
    status: string;
    when: string;
    onClick: () => void;
  }) => (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-gray-50"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gray-100 text-lg">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">{title}</span>
          <span className="block text-xs text-gray-500">{when}</span>
        </span>
        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600">
          {status}
        </span>
      </button>
    </li>
  );

  const myIncidents = incidents.filter((i) => i.reporterId === me.id);
  const myRepairs = repairs.filter((r) => r.requesterId === me.id);
  const mySuggestions = suggestions.filter((s) => s.authorId === me.id);

  return (
    <div>
      <PanelHeader
        title="My Home"
        subtitle={`${me.unitId} · ${precinct?.typeLabel ?? ''} ${precinct?.lot ? `· ${precinct.lot.width}×${precinct.lot.depth} ft` : ''}`}
        onClose={onClose}
        icon="🏡"
      />
      <div className="space-y-5 p-5">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn-primary" onClick={() => openPanel({ kind: 'decorate' })}>
            <Paintbrush className="h-5 w-5" /> Decorate
          </button>
          <button type="button" className="btn-ghost" onClick={() => openPanel({ kind: 'avatar' })}>
            <UserRoundPen className="h-5 w-5" /> Edit avatar
          </button>
        </div>

        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Household</h3>
          <ul className="flex flex-wrap gap-3">
            {household.map((u) => (
              <li key={u.id} className="flex items-center gap-2 rounded-full bg-gray-50 py-1 pl-1 pr-3">
                <Avatar user={u} size={34} />
                <span className="text-sm font-semibold">
                  {u.name} <span className="text-xs text-gray-500">({u.household ?? 'owner'})</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">My reports</h3>
          {myIncidents.length === 0 ? (
            <p className="text-sm text-gray-500">No reports yet.</p>
          ) : (
            <ul>
              {myIncidents.map((i) => (
                <Row
                  key={i.id}
                  icon={i.isSOS ? '🆘' : incidentMeta(i.category).icon}
                  title={i.isSOS ? 'Alert guardhouse' : incidentMeta(i.category).label}
                  status={INCIDENT_STATUS_LABEL[i.status]}
                  when={ago(i.createdAt)}
                  onClick={() => goTo({ kind: 'incident', id: i.id }, i.location.x, i.location.z)}
                />
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">My repair requests</h3>
          {myRepairs.length === 0 ? (
            <p className="text-sm text-gray-500">No repair requests.</p>
          ) : (
            <ul>
              {myRepairs.map((r) => (
                <Row
                  key={r.id}
                  icon={repairMeta(r.category).icon}
                  title={repairMeta(r.category).label}
                  status={REPAIR_STATUS_LABEL[r.status]}
                  when={ago(r.createdAt)}
                  onClick={() => goTo({ kind: 'repair', id: r.id }, r.location.x, r.location.z)}
                />
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">My suggestions</h3>
          {mySuggestions.length === 0 ? (
            <p className="text-sm text-gray-500">No suggestions yet — try the Suggest tool 💡</p>
          ) : (
            <ul>
              {mySuggestions.map((s) => (
                <Row
                  key={s.id}
                  icon={suggestionMeta(s.item).icon}
                  title={`${suggestionMeta(s.item).label} · ▲ ${s.votes.length}`}
                  status={suggestionStatusMeta(s.status).label}
                  when={ago(s.createdAt)}
                  onClick={() => goTo({ kind: 'suggestion', id: s.id }, s.location.x, s.location.z)}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
