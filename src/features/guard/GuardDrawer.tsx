import { useMemo, useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { ChevronDown, ShieldCheck } from 'lucide-react';
import type { Incident } from '@/types';
import { api } from '@/services/api';
import { useCurrentUser, useStore } from '@/store';
import { useIsDesktop } from '@/lib/useMediaQuery';
import { displayName } from '@/lib/people';
import { cameraController } from '@/world/cameraController';
import { INCIDENT_FLOW, INCIDENT_STATUS_LABEL, URGENCY, incidentMeta } from '@/features/tickets/meta';
import { isActiveIncident } from '@/features/tickets/visibility';

const VISITORS = [
  { name: 'Grab delivery', unit: 'EG18-031', time: '10:12 AM', plate: 'WXY 2231' },
  { name: 'Aunty Lim (visitor)', unit: 'EG18-028', time: '9:40 AM', plate: 'BKL 8812' },
  { name: 'Aircon contractor', unit: 'EG18-062', time: '9:05 AM', plate: 'VDE 5120' },
  { name: 'Lalamove', unit: 'EG18-095', time: '8:51 AM', plate: 'BQR 7741' },
];

const RANK = { urgent: 0, medium: 1, low: 2 } as const;

/** Guard dashboard: live incident queue, chats with residents, visitor log. */
export default function GuardDrawer() {
  const me = useCurrentUser();
  const incidents = useStore((s) => s.incidents);
  const users = useStore((s) => s.users);
  const channels = useStore((s) => s.channels);
  const messages = useStore((s) => s.messages);
  const isDesktop = useIsDesktop();
  const [tab, setTab] = useState<'queue' | 'chats' | 'visitors'>('queue');
  const [collapsed, setCollapsed] = useState(false);

  const queue = useMemo(
    () =>
      incidents
        .filter(isActiveIncident)
        .sort(
          (a, b) =>
            Number(!!b.isSOS) - Number(!!a.isSOS) ||
            RANK[a.urgency] - RANK[b.urgency] ||
            b.createdAt.localeCompare(a.createdAt),
        ),
    [incidents],
  );
  const guardChats = channels.filter((c) => c.kind === 'guardhouse');
  const unreadChats = guardChats.filter((c) =>
    messages.some((m) => m.channelId === c.id && me && !m.readBy.includes(me.id)),
  ).length;

  const focus = (i: Incident) => {
    cameraController.flyTo({ x: i.location.x, z: i.location.z }, { dist: 140 });
    useStore.getState().select({ kind: 'incident', id: i.id });
  };

  const body = (
    <>
      <button
        type="button"
        className="flex w-full items-center gap-3 border-b border-white/10 p-4 text-left"
        onClick={() => !isDesktop && setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-bold leading-tight">Guardhouse EG18</span>
          <span className="block text-sm text-white/60">
            {queue.length} open · {queue.filter((q) => q.isSOS).length} SOS
          </span>
        </span>
        {!isDesktop && <ChevronDown className={`h-5 w-5 transition ${collapsed ? 'rotate-180' : ''}`} />}
      </button>
      {!collapsed && (
        <>
          <div className="flex gap-1 p-2" role="tablist">
            {(
              [
                ['queue', `Queue (${queue.length})`],
                ['chats', `Chats${unreadChats ? ` (${unreadChats})` : ''}`],
                ['visitors', 'Visitors'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`h-9 flex-1 rounded-lg text-xs font-bold ${tab === id ? 'bg-white text-charcoal-900' : 'bg-white/10 text-white/80'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-3 pt-1">
            {tab === 'queue' && (
              <ul className="space-y-2">
                {queue.length === 0 && (
                  <li className="rounded-xl bg-white/5 p-4 text-center text-sm text-white/60">
                    All quiet ✨ No open incidents.
                  </li>
                )}
                {queue.map((i) => {
                  const m = incidentMeta(i.category);
                  const next = INCIDENT_FLOW[INCIDENT_FLOW.indexOf(i.status) + 1];
                  const urg = URGENCY.find((u) => u.id === i.urgency)!;
                  return (
                    <li
                      key={i.id}
                      className={`rounded-xl p-3 ${i.isSOS ? 'animate-sosPulse bg-sos-600' : 'bg-white/10'}`}
                    >
                      <button type="button" onClick={() => focus(i)} className="block w-full text-left">
                        <span className="flex items-center gap-2 font-bold">
                          <span className="text-lg">{i.isSOS ? '🆘' : m.icon}</span>
                          <span className="min-w-0 flex-1 truncate">
                            {i.isSOS ? 'SOS — Alert from resident' : m.label}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${urg.cls}`}>
                            {urg.label}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-sm text-white/80">
                          {displayName(users.find((u) => u.id === i.reporterId))} ·{' '}
                          {i.location.unitId ?? i.location.precinctId ?? 'map pin'}
                        </span>
                        <span className="text-xs text-white/60">
                          {INCIDENT_STATUS_LABEL[i.status]} ·{' '}
                          {formatDistanceToNowStrict(new Date(i.createdAt), { addSuffix: true })}
                        </span>
                      </button>
                      {next && me && (
                        <button
                          type="button"
                          onClick={() => void api.updateIncident(i.id, me.id, next)}
                          className="mt-2 h-9 w-full rounded-lg bg-white text-sm font-bold text-charcoal-900 active:scale-[0.98]"
                        >
                          Mark {INCIDENT_STATUS_LABEL[next]}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {tab === 'chats' && (
              <ul className="space-y-1.5">
                {guardChats.map((c) => {
                  const resident = users.find((u) => u.role === 'resident' && c.memberIds.includes(u.id));
                  const last = messages.filter((m) => m.channelId === c.id).at(-1);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => useStore.getState().openPanel({ kind: 'chat', channelId: c.id })}
                        className="w-full rounded-xl bg-white/10 p-3 text-left hover:bg-white/15"
                      >
                        <span className="block font-bold">
                          {resident?.name} · {resident?.unitId}
                        </span>
                        <span className="block truncate text-sm text-white/70">
                          {last?.text ?? 'No messages yet'}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {tab === 'visitors' && (
              <ul className="space-y-1.5 text-sm">
                {VISITORS.map((v) => (
                  <li key={v.plate} className="flex justify-between gap-2 rounded-lg bg-white/10 px-3 py-2">
                    <span className="min-w-0">
                      <span className="block truncate font-bold">{v.name}</span>
                      <span className="text-xs text-white/60">
                        → {v.unit} · {v.plate}
                      </span>
                    </span>
                    <span className="shrink-0 text-white/60">{v.time}</span>
                  </li>
                ))}
                <li className="pt-1 text-center text-xs text-white/50">
                  Visitor registration & QR passes — coming soon
                </li>
              </ul>
            )}
          </div>
        </>
      )}
    </>
  );

  if (!isDesktop) {
    return (
      <div className="panel-dark absolute inset-x-2 bottom-2 z-30 flex max-h-[50vh] flex-col overflow-hidden">
        {body}
      </div>
    );
  }
  return (
    <aside className="panel-dark absolute bottom-4 left-4 top-4 z-30 flex w-[364px] flex-col overflow-hidden">
      {body}
    </aside>
  );
}
