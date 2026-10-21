import { useMemo } from 'react';
import { TITLE_LABEL } from '@/data/township';
import { useCurrentUser, useStore } from '@/store';
import { incidentMeta, suggestionMeta } from '@/features/tickets/meta';
import {
  canSeeIncident,
  canSeeRepair,
  isActiveIncident,
  isActiveRepair,
} from '@/features/tickets/visibility';
import { FESTIVE, GARDEN } from '@/features/home/decor';
import { getLayout } from '@/world/layout';
import { toWorld } from '@/world/coords';
import { Anchor } from './anchors';

const HOURS_48 = 48 * 3600_000;

/** Ticket, suggestion, announcement and decoration markers on the map. */
export function MarkersLayer() {
  const me = useCurrentUser();
  const lod = useStore((s) => s.lod);
  const incidents = useStore((s) => s.incidents);
  const repairs = useStore((s) => s.repairs);
  const suggestions = useStore((s) => s.suggestions);
  const announcements = useStore((s) => s.announcements);
  const users = useStore((s) => s.users);
  const panel = useStore((s) => s.panel);
  const selection = useStore((s) => s.selection);
  const select = useStore((s) => s.select);
  const toast = useStore((s) => s.toast);

  const visibleIncidents = useMemo(
    () => incidents.filter((i) => isActiveIncident(i) && canSeeIncident(i, me)),
    [incidents, me],
  );
  const visibleRepairs = useMemo(
    () => repairs.filter((r) => isActiveRepair(r) && canSeeRepair(r, me)),
    [repairs, me],
  );
  const recentAnnouncements = useMemo(
    () => announcements.filter((a) => Date.now() - new Date(a.publishedAt).getTime() < HOURS_48),
    [announcements],
  );
  const decorated = useMemo(
    () => users.filter((u) => u.decor && u.unitId && (u.decor.festive || u.decor.garden.length)),
    [users],
  );

  const far = lod === 'far';
  const L = getLayout();
  const pending = panel && 'location' in panel ? panel.location : null;
  const isSel = (kind: string, id: string) =>
    selection?.kind === kind && 'id' in selection && selection.id === id;

  return (
    <>
      {recentAnnouncements.flatMap((a) => {
        const spots = a.targetPrecincts.length
          ? a.targetPrecincts
              .map((id) => L.precincts.find((p) => p.precinct.id === id)?.label)
              .filter(Boolean)
          : [toWorld(TITLE_LABEL)];
        return spots.map((spot, k) => (
          // Offset beside the precinct label / title so they don't overlap.
          <Anchor
            key={`${a.id}-${k}`}
            x={spot![0] + (a.targetPrecincts.length ? 45 : 150)}
            y={a.targetPrecincts.length ? 30 : 60}
            z={spot![1]}
          >
            <button
              type="button"
              onClick={() => toast(`📢 ${a.title} — ${a.body}`)}
              className="pointer-events-auto grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-amber-400 text-base"
              title={a.title}
              aria-label={`Announcement: ${a.title}`}
            >
              📢
            </button>
          </Anchor>
        ));
      })}

      {visibleIncidents.map((i) => {
        const m = incidentMeta(i.category);
        return (
          <Anchor key={i.id} x={i.location.x} y={9} z={i.location.z} hidden={far && !i.isSOS}>
            <button
              type="button"
              onClick={() => select({ kind: 'incident', id: i.id })}
              className={`pointer-events-auto flex flex-col items-center ${i.isSOS ? 'animate-sosPulse rounded-full' : ''}`}
              aria-label={`${m.label} report, ${i.status}`}
            >
              <span
                className={`grid h-9 w-9 place-items-center rounded-full border-[3px] text-lg ${
                  isSel('incident', i.id) ? 'border-tool-500' : 'border-white'
                }`}
                style={{ background: m.color }}
              >
                {i.isSOS ? '🆘' : m.icon}
              </span>
              <span
                className="-mt-0.5 h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent"
                style={{ borderTopColor: m.color }}
              />
            </button>
          </Anchor>
        );
      })}

      {visibleRepairs.map((r) => (
        <Anchor key={r.id} x={r.location.x + 3} y={11} z={r.location.z} hidden={far}>
          <button
            type="button"
            onClick={() => select({ kind: 'repair', id: r.id })}
            className={`pointer-events-auto grid h-8 w-8 place-items-center rounded-lg border-[3px] bg-tool-500 text-base ${
              isSel('repair', r.id) ? 'border-amber-300' : 'border-white'
            }`}
            aria-label={`Repair request ${r.status}`}
          >
            🔧
          </button>
        </Anchor>
      ))}

      {suggestions.map((s) => {
        const m = suggestionMeta(s.item);
        const approved = s.status === 'approved';
        return (
          <Anchor
            key={s.id}
            x={s.location.x}
            y={6}
            z={s.location.z}
            hidden={far || s.status === 'not-planned'}
          >
            <button
              type="button"
              onClick={() => select({ kind: 'suggestion', id: s.id })}
              className="pointer-events-auto flex flex-col items-center"
              aria-label={`Suggestion: ${m.label}, ${s.votes.length} votes`}
            >
              <span
                className={`grid h-9 w-9 place-items-center rounded-xl text-lg ${
                  approved
                    ? 'border-2 border-white bg-emerald-500'
                    : 'border-2 border-dashed border-tool-500 bg-white/60 opacity-80'
                } ${isSel('suggestion', s.id) ? 'ring-2 ring-tool-500' : ''}`}
              >
                {m.icon}
              </span>
              <span className="mt-0.5 rounded-full bg-white/90 px-1.5 text-[9px] font-extrabold text-charcoal-700">
                {approved ? 'Coming soon' : `▲ ${s.votes.length}`}
              </span>
            </button>
          </Anchor>
        );
      })}

      {decorated.map((u) => {
        const lot = L.unitMap.get(u.unitId!);
        if (!lot || !u.decor) return null;
        const icons = [
          u.decor.festive ? FESTIVE[u.decor.festive].icon : null,
          ...u.decor.garden.map((g) => GARDEN[g].icon),
        ].filter(Boolean);
        return (
          <Anchor key={`decor-${u.id}`} x={lot.x} y={12} z={lot.z} hidden={far}>
            <span
              className="pointer-events-none flex gap-0.5 rounded-full bg-white/85 px-1.5 py-0.5 text-sm"
              aria-hidden
            >
              {icons.join('')}
            </span>
          </Anchor>
        );
      })}

      {pending && (
        <Anchor x={pending.x} y={7} z={pending.z}>
          <span className="pointer-events-none block animate-bounce text-3xl" aria-hidden>
            📍
          </span>
        </Anchor>
      )}
    </>
  );
}
