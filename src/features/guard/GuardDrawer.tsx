import { useMemo, useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { ChevronDown, ShieldCheck } from 'lucide-react';
import type { Incident, VisitorPass, VisitorStatus } from '@/types';
import { api } from '@/services/api';
import { useCurrentUser, useStore } from '@/store';
import { useIsDesktop } from '@/lib/useMediaQuery';
import { displayName } from '@/lib/people';
import { formatDay, malaysiaDate } from '@/lib/time';
import { cameraController } from '@/world/cameraController';
import { getLayout } from '@/world/layout';
import { INCIDENT_FLOW, INCIDENT_STATUS_LABEL, URGENCY, incidentMeta } from '@/features/tickets/meta';
import { isActiveIncident } from '@/features/tickets/visibility';

const RANK = { urgent: 0, medium: 1, low: 2 } as const;

/** Guard dashboard: live incident queue, chats with residents, visitor log. */
export default function GuardDrawer() {
  const me = useCurrentUser();
  const incidents = useStore((s) => s.incidents);
  const users = useStore((s) => s.users);
  const channels = useStore((s) => s.channels);
  const messages = useStore((s) => s.messages);
  const parcelsWaiting = useStore((s) => s.parcels.filter((p) => !p.collectedAt).length);
  const isDesktop = useIsDesktop();
  const [tab, setTab] = useState<'queue' | 'chats' | 'visitors' | 'parcels'>('queue');
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
                ['parcels', `Parcels${parcelsWaiting ? ` (${parcelsWaiting})` : ''}`],
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
            {tab === 'visitors' && <VisitorGate />}
            {tab === 'parcels' && <ParcelDesk />}
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

const darkInput =
  'w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-white/40';

/** Gate desk: verify QR pass codes, check visitors in/out, log walk-ins. */
function VisitorGate() {
  const me = useCurrentUser();
  const visitors = useStore((s) => s.visitors);
  const toast = useStore((s) => s.toast);
  const [code, setCode] = useState('');
  const [checked, setChecked] = useState<string | null>(null);
  const [walkIn, setWalkIn] = useState({ visitorName: '', unitId: '', plate: '' });
  const today = malaysiaDate();
  const todays = visitors.filter((v) => v.date === today);
  const expected = todays.filter((v) => v.status === 'expected');
  const inside = visitors.filter((v) => v.status === 'checked-in');
  const left = todays.filter((v) => v.status === 'checked-out');
  const found = checked ? visitors.find((v) => v.code === checked) : undefined;
  const walkInUnit = walkIn.unitId.trim().toUpperCase();
  const walkInOk = walkIn.visitorName.trim() && getLayout().unitMap.has(walkInUnit);
  if (!me) return null;

  const set = (id: string, status: VisitorStatus) => void api.updateVisitor(id, me.id, status);
  const logWalkIn = async () => {
    if (!walkInOk) return;
    await api.createVisitor(me.id, {
      visitorName: walkIn.visitorName.trim(),
      unitId: walkInUnit,
      plate: walkIn.plate.trim().toUpperCase() || undefined,
      date: today,
    });
    toast(`Walk-in logged → ${walkInUnit} — resident notified`, 'success');
    setWalkIn({ visitorName: '', unitId: '', plate: '' });
  };

  const Row = ({ v, action }: { v: VisitorPass; action?: [string, VisitorStatus] }) => (
    <li className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm">
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold">{v.visitorName}</span>
        <span className="block truncate text-xs text-white/60">
          → {v.unitId}
          {v.plate && ` · ${v.plate}`}
          {v.checkedInAt &&
            ` · in ${formatDistanceToNowStrict(new Date(v.checkedInAt), { addSuffix: true })}`}
        </span>
      </span>
      {action && (
        <button
          type="button"
          onClick={() => set(v.id, action[1])}
          className="h-8 shrink-0 rounded-lg bg-white px-2.5 text-xs font-bold text-charcoal-900 active:scale-95"
        >
          {action[0]}
        </button>
      )}
    </li>
  );

  return (
    <div className="space-y-3">
      <form
        className="rounded-xl bg-white/5 p-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          setChecked(code.trim().toUpperCase() || null);
        }}
      >
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-white/60">
          Scan / enter pass code
        </p>
        <div className="flex gap-1.5">
          <input
            className={`${darkInput} font-mono uppercase tracking-widest`}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setChecked(null);
            }}
            placeholder="EG4K7P"
            maxLength={8}
            aria-label="Pass code"
          />
          <button
            type="submit"
            className="h-9 shrink-0 rounded-lg bg-white px-3 text-sm font-bold text-charcoal-900"
          >
            Verify
          </button>
        </div>
        {checked && (
          <div
            className={`mt-2 rounded-lg p-2.5 text-sm ${found && found.status === 'expected' && found.date === today ? 'bg-emerald-500/25' : 'bg-sos-600/40'}`}
            role="status"
          >
            {!found || found.code === 'WALKIN' ? (
              '✖ No pass with that code.'
            ) : found.status === 'cancelled' ? (
              '✖ This pass was cancelled by the resident.'
            ) : found.status !== 'expected' ? (
              `⚠ Already used — ${found.visitorName} is ${found.status === 'checked-in' ? 'inside' : 'gone'}.`
            ) : found.date !== today ? (
              `⚠ Valid on ${formatDay(found.date)}, not today.`
            ) : (
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1">
                  ✔ <b>{found.visitorName}</b> → {found.unitId}
                  {found.plate && ` · ${found.plate}`}
                </span>
                <button
                  type="button"
                  className="h-8 rounded-lg bg-white px-2.5 text-xs font-bold text-charcoal-900"
                  onClick={() => {
                    set(found.id, 'checked-in');
                    setCode('');
                    setChecked(null);
                    toast(`${found.visitorName} checked in — host notified`, 'success');
                  }}
                >
                  Check in
                </button>
              </div>
            )}
          </div>
        )}
      </form>

      <section>
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-white/60">
          Expected today ({expected.length})
        </p>
        <ul className="space-y-1.5">
          {expected.length === 0 && <li className="text-xs text-white/50">No pre-registered visitors.</li>}
          {expected.map((v) => (
            <Row key={v.id} v={v} action={['Check in', 'checked-in']} />
          ))}
        </ul>
      </section>
      <section>
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-white/60">
          Inside now ({inside.length})
        </p>
        <ul className="space-y-1.5">
          {inside.length === 0 && <li className="text-xs text-white/50">Nobody inside.</li>}
          {inside.map((v) => (
            <Row key={v.id} v={v} action={['Check out', 'checked-out']} />
          ))}
        </ul>
      </section>
      {left.length > 0 && (
        <section>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-white/60">Left today</p>
          <ul className="space-y-1.5 opacity-60">
            {left.map((v) => (
              <Row key={v.id} v={v} />
            ))}
          </ul>
        </section>
      )}

      <details className="rounded-xl bg-white/5 p-2.5">
        <summary className="cursor-pointer text-sm font-bold">+ Log a walk-in visitor</summary>
        <div className="mt-2 grid gap-1.5">
          <input
            className={darkInput}
            value={walkIn.visitorName}
            onChange={(e) => setWalkIn({ ...walkIn, visitorName: e.target.value })}
            placeholder="Visitor / company name"
            aria-label="Visitor name"
          />
          <div className="grid grid-cols-2 gap-1.5">
            <input
              className={darkInput}
              value={walkIn.unitId}
              onChange={(e) => setWalkIn({ ...walkIn, unitId: e.target.value })}
              placeholder="Unit EG18-031"
              aria-label="Unit"
            />
            <input
              className={`${darkInput} uppercase`}
              value={walkIn.plate}
              onChange={(e) => setWalkIn({ ...walkIn, plate: e.target.value })}
              placeholder="Plate"
              aria-label="Car plate"
            />
          </div>
          <button
            type="button"
            disabled={!walkInOk}
            onClick={logWalkIn}
            className="h-9 rounded-lg bg-white text-sm font-bold text-charcoal-900 disabled:opacity-40"
          >
            Let in & notify resident
          </button>
        </div>
      </details>
    </div>
  );
}

/** Parcels held at the guardhouse. */
function ParcelDesk() {
  const parcels = useStore((s) => s.parcels);
  const waiting = parcels.filter((p) => !p.collectedAt);
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => useStore.getState().openPanel({ kind: 'parcels' })}
        className="h-10 w-full rounded-lg bg-white text-sm font-bold text-charcoal-900 active:scale-[0.98]"
      >
        📦 Log a parcel
      </button>
      <ul className="space-y-1.5 text-sm">
        {waiting.length === 0 && (
          <li className="rounded-xl bg-white/5 p-4 text-center text-white/60">No parcels waiting ✨</li>
        )}
        {waiting.map((p) => (
          <li key={p.id} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold">
                {p.unitId} · {p.courier}
              </span>
              <span className="block truncate text-xs text-white/60">
                {p.note && `${p.note} · `}
                {formatDistanceToNowStrict(new Date(p.loggedAt), { addSuffix: true })}
              </span>
            </span>
            <button
              type="button"
              onClick={() => void api.collectParcel(p.id)}
              className="h-8 shrink-0 rounded-lg bg-white px-2.5 text-xs font-bold text-charcoal-900 active:scale-95"
            >
              Handed over
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
