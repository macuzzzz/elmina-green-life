import { useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { MessageCircle, Star, ThumbsUp } from 'lucide-react';
import type { Incident, IncidentStatus, RepairRequest, Suggestion, SuggestionStatus } from '@/types';
import { api } from '@/services/api';
import { useCurrentUser, useStore } from '@/store';
import { displayName } from '@/lib/people';
import { inputCls } from '@/ui/Modal';
import {
  CONTRACTORS,
  INCIDENT_FLOW,
  INCIDENT_STATUS_LABEL,
  REPAIR_FLOW,
  REPAIR_STATUS_LABEL,
  SUGGESTION_STATUS,
  URGENCY,
  incidentMeta,
  repairMeta,
  suggestionMeta,
  suggestionStatusMeta,
} from './meta';
import { Timeline } from './Timeline';
import { canSeeIncidentDetails } from './visibility';

const ago = (iso: string) => formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
const isStaffRole = (r?: string) => r === 'guard' || r === 'management';

function Photos({ photos }: { photos: string[] }) {
  if (!photos.length) return null;
  return (
    <div className="flex gap-2">
      {photos.map((p, i) => (
        <img key={i} src={p} alt={`Photo ${i + 1}`} className="h-16 w-16 rounded-xl object-cover" />
      ))}
    </div>
  );
}

/** Open (or create) the reporter's chat channel with the guardhouse/management. */
export async function openResidentChat(residentId: string, kind: 'guardhouse' | 'management') {
  const ch = await api.openChannel(residentId, kind);
  useStore.getState().openPanel({ kind: 'chat', channelId: ch.id });
}

// ── incidents ────────────────────────────────────────────────────

export function IncidentActions({ inc }: { inc: Incident }) {
  const me = useCurrentUser();
  const [note, setNote] = useState('');
  if (!me || !isStaffRole(me.role)) return null;
  const set = (status: IncidentStatus) => {
    if (status === 'rejected' && !note.trim()) {
      useStore.getState().toast('Add a reason before rejecting', 'warn');
      return;
    }
    void api.updateIncident(inc.id, me.id, status, note.trim() || undefined);
    setNote('');
  };
  const next = INCIDENT_FLOW[INCIDENT_FLOW.indexOf(inc.status) + 1];
  return (
    <div className="space-y-2 rounded-xl bg-gray-50 p-3">
      <input
        className={inputCls}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note to the resident"
      />
      <div className="flex flex-wrap gap-2">
        {next && (
          <button
            type="button"
            className="btn-primary min-h-[40px] flex-1 px-3 text-sm"
            onClick={() => set(next)}
          >
            Mark {INCIDENT_STATUS_LABEL[next]}
          </button>
        )}
        {inc.status !== 'resolved' && inc.status !== 'rejected' && (
          <button
            type="button"
            className="btn-ghost min-h-[40px] px-3 text-sm text-sos-600"
            onClick={() => set('rejected')}
          >
            Reject
          </button>
        )}
        <button
          type="button"
          className="btn-ghost min-h-[40px] px-3 text-sm"
          onClick={() => openResidentChat(inc.reporterId, me.role === 'guard' ? 'guardhouse' : 'management')}
        >
          <MessageCircle className="h-4 w-4" /> Chat
        </button>
      </div>
    </div>
  );
}

export function IncidentCard({ inc }: { inc: Incident }) {
  const me = useCurrentUser();
  const users = useStore((s) => s.users);
  const m = incidentMeta(inc.category);
  const urg = URGENCY.find((u) => u.id === inc.urgency)!;
  const full = canSeeIncidentDetails(inc, me);
  const reporter = users.find((u) => u.id === inc.reporterId);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span
          className="grid h-12 w-12 place-items-center rounded-2xl text-2xl"
          style={{ background: `${m.color}22` }}
        >
          {inc.isSOS ? '🆘' : m.icon}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold leading-tight">
            {inc.isSOS ? 'SOS — Alert guardhouse' : m.label}
          </h2>
          <p className="text-sm text-gray-500">
            {INCIDENT_STATUS_LABEL[inc.status]} · {ago(inc.createdAt)}
          </p>
        </div>
        <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${urg.cls}`}>
          {urg.label}
        </span>
      </div>
      {full ? (
        <>
          <p className="text-sm text-charcoal-700">
            {inc.description || <span className="italic text-gray-400">No description</span>}
          </p>
          <p className="text-xs text-gray-500">
            Reported by {inc.reporterId === me?.id ? 'you' : displayName(reporter, me?.id)} ·{' '}
            {inc.location.unitId ?? inc.location.precinctId ?? 'map pin'}
          </p>
          <Photos photos={inc.photos} />
          <Timeline
            flow={INCIDENT_FLOW}
            history={inc.history}
            labels={INCIDENT_STATUS_LABEL}
            current={inc.status}
          />
          <IncidentActions inc={inc} />
        </>
      ) : (
        <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
          {m.label} — <b>{INCIDENT_STATUS_LABEL[inc.status]}</b>. Management is aware of this.
        </p>
      )}
    </div>
  );
}

// ── repairs ──────────────────────────────────────────────────────

export function RepairActions({ r }: { r: RepairRequest }) {
  const me = useCurrentUser();
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  if (!me) return null;

  if (me.id === r.requesterId && r.status === 'completed') {
    return (
      <div className="space-y-2 rounded-xl bg-emerald-50 p-3">
        <p className="text-sm font-bold text-emerald-800">Is it fixed? Rate the job</p>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={(r.rating ?? 0) >= n}
              onClick={() => void api.updateRepair(r.id, me.id, { rating: n })}
              className="p-1"
              aria-label={`${n} stars`}
            >
              <Star
                className={`h-7 w-7 ${(r.rating ?? 0) >= n ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
              />
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="btn-primary min-h-[40px] text-sm"
            onClick={() =>
              void api.updateRepair(r.id, me.id, { status: 'confirmed', note: 'Resident confirmed the fix.' })
            }
          >
            Confirm fixed
          </button>
          <button
            type="button"
            className="btn-ghost min-h-[40px] text-sm"
            onClick={() =>
              void api.updateRepair(r.id, me.id, {
                status: 'reopened',
                note: 'Resident reopened: still not fixed.',
              })
            }
          >
            Reopen
          </button>
        </div>
      </div>
    );
  }
  if (me.role !== 'management') return null;
  const idx = REPAIR_FLOW.indexOf(r.status);
  const next = r.status === 'reopened' ? 'in-progress' : REPAIR_FLOW[idx + 1];
  return (
    <div className="space-y-2 rounded-xl bg-gray-50 p-3">
      <label className="block text-xs font-bold text-gray-500">
        Contractor
        <select
          className={`${inputCls} mt-1`}
          value={r.contractor ?? ''}
          onChange={(e) =>
            void api.updateRepair(r.id, me.id, {
              contractor: e.target.value,
              status:
                r.status === 'submitted' || r.status === 'under-review' ? 'contractor-assigned' : undefined,
              note: `Assigned to ${e.target.value}.`,
            })
          }
        >
          <option value="" disabled>
            Assign contractor…
          </option>
          {CONTRACTORS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <div className="flex gap-2">
        <input
          type="datetime-local"
          className={inputCls}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Inspection date"
        />
        <button
          type="button"
          className="btn-ghost min-h-[40px] shrink-0 px-3 text-sm"
          disabled={!date}
          onClick={() => {
            void api.updateRepair(r.id, me.id, {
              inspectionAt: new Date(date).toISOString(),
              status: 'inspection-scheduled',
              note: `Inspection on ${new Date(date).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}.`,
            });
            setDate('');
          }}
        >
          Schedule
        </button>
      </div>
      <input
        className={inputCls}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Update for the resident"
      />
      <div className="flex gap-2">
        {next && next !== 'confirmed' && (
          <button
            type="button"
            className="btn-primary min-h-[40px] flex-1 px-3 text-sm"
            onClick={() => {
              void api.updateRepair(r.id, me.id, { status: next, note: note.trim() || undefined });
              setNote('');
            }}
          >
            Mark {REPAIR_STATUS_LABEL[next]}
          </button>
        )}
        {note.trim() && (
          <button
            type="button"
            className="btn-ghost min-h-[40px] px-3 text-sm"
            onClick={() => {
              void api.updateRepair(r.id, me.id, { note: note.trim() });
              setNote('');
            }}
          >
            Post update
          </button>
        )}
      </div>
    </div>
  );
}

export function RepairCard({ r }: { r: RepairRequest }) {
  const me = useCurrentUser();
  const users = useStore((s) => s.users);
  const m = repairMeta(r.category);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-tool-500/10 text-2xl">
          {m.icon}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold leading-tight">{m.label}</h2>
          <p className="text-sm text-gray-500">
            {r.scope === 'unit' ? r.location.unitId : `Common area · ${r.location.precinctId ?? ''}`} ·{' '}
            {ago(r.createdAt)}
          </p>
        </div>
      </div>
      <p className="text-sm text-charcoal-700">
        {r.description || <span className="italic text-gray-400">No description</span>}
      </p>
      {me?.role !== 'resident' && (
        <p className="text-xs text-gray-500">
          Requested by{' '}
          {displayName(
            users.find((u) => u.id === r.requesterId),
            me?.id,
          )}
        </p>
      )}
      <Photos photos={r.photos} />
      <div className="flex flex-wrap gap-1.5 text-xs">
        {r.contractor && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 font-semibold">👷 {r.contractor}</span>
        )}
        {r.inspectionAt && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 font-semibold">
            📅 {new Date(r.inspectionAt).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
        )}
        {r.preferredSlots.map((s) => (
          <span key={s} className="rounded-full bg-leaf-50 px-2 py-0.5 font-semibold text-leaf-700">
            {s}
          </span>
        ))}
        {r.rating && (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
            {'★'.repeat(r.rating)}
          </span>
        )}
      </div>
      <Timeline flow={REPAIR_FLOW} history={r.history} labels={REPAIR_STATUS_LABEL} current={r.status} />
      <RepairActions r={r} />
    </div>
  );
}

// ── suggestions ──────────────────────────────────────────────────

export function SuggestionActions({ s }: { s: Suggestion }) {
  const me = useCurrentUser();
  const [reply, setReply] = useState(s.managementReply ?? '');
  if (me?.role !== 'management') return null;
  const set = (status: SuggestionStatus) =>
    void api.updateSuggestion(s.id, me.id, status, reply.trim() || undefined);
  return (
    <div className="space-y-2 rounded-xl bg-gray-50 p-3">
      <input
        className={inputCls}
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Reply to residents"
      />
      <div className="grid grid-cols-3 gap-1.5">
        {SUGGESTION_STATUS.filter((x) => x.id !== 'open').map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => set(x.id)}
            className={`min-h-[40px] rounded-xl px-1 text-xs font-bold ${s.status === x.id ? x.cls + ' ring-2 ring-current' : 'bg-white text-gray-600 ring-1 ring-gray-200'}`}
          >
            {x.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SuggestionCard({ s }: { s: Suggestion }) {
  const me = useCurrentUser();
  const users = useStore((st) => st.users);
  const m = suggestionMeta(s.item);
  const st = suggestionStatusMeta(s.status);
  const voted = !!me && s.votes.includes(me.id);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-2xl">{m.icon}</span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold leading-tight">Suggestion: {m.label}</h2>
          <p className="text-sm text-gray-500">
            by{' '}
            {s.authorId === me?.id
              ? 'you'
              : displayName(
                  users.find((u) => u.id === s.authorId),
                  me?.id,
                )}{' '}
            · {ago(s.createdAt)}
          </p>
        </div>
        <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${st.cls}`}>
          {st.label}
        </span>
      </div>
      <p className="text-sm text-charcoal-700">{s.reason}</p>
      {s.managementReply && (
        <p className="rounded-xl bg-leaf-50 px-3 py-2 text-sm text-leaf-700">
          <b>Management:</b> {s.managementReply}
        </p>
      )}
      {me?.role === 'resident' ? (
        <button
          type="button"
          onClick={() => void api.toggleVote(s.id, me.id)}
          aria-pressed={voted}
          className={`btn w-full ${voted ? 'bg-tool-500 text-white' : 'bg-gray-100 text-charcoal-700'}`}
        >
          <ThumbsUp className="h-5 w-5" /> {voted ? 'Upvoted' : 'Upvote'} · {s.votes.length}
        </button>
      ) : (
        <p className="text-sm font-bold text-gray-600">▲ {s.votes.length} upvotes</p>
      )}
      <SuggestionActions s={s} />
    </div>
  );
}
