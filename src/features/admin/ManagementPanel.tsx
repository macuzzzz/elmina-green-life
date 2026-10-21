import { useMemo, useState, type DragEvent } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import {
  Building2,
  ChevronDown,
  ClipboardList,
  Megaphone,
  MessageCircle,
  ShieldBan,
  Users,
} from 'lucide-react';
import type { IncidentStatus, RepairStatus, SuggestionStatus } from '@/types';
import { PRECINCTS } from '@/data/township';
import { api } from '@/services/api';
import { useCurrentUser, useStore, type Selection } from '@/store';
import { useIsDesktop } from '@/lib/useMediaQuery';
import { Avatar } from '@/ui/Avatar';
import { Field, inputCls } from '@/ui/Modal';
import { cameraController } from '@/world/cameraController';
import { getLayout } from '@/world/layout';
import {
  INCIDENT_STATUS_LABEL,
  REPAIR_STATUS_LABEL,
  SUGGESTION_STATUS,
  incidentMeta,
  repairMeta,
  suggestionMeta,
} from '@/features/tickets/meta';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'tickets', label: 'Tickets', icon: ClipboardList },
  { id: 'announce', label: 'Announce', icon: Megaphone },
  { id: 'residents', label: 'Residents', icon: Users },
  { id: 'moderation', label: 'Moderation', icon: ShieldBan },
  { id: 'chats', label: 'Chats', icon: MessageCircle },
] as const;
type TabId = (typeof TABS)[number]['id'];

const ago = (iso: string) => formatDistanceToNowStrict(new Date(iso), { addSuffix: true });

function focus(sel: Selection, x: number, z: number) {
  useStore.getState().select(sel);
  cameraController.flyTo({ x, z }, { dist: 160 });
}

/** Management dashboard (desktop-first side panel; bottom sheet on phones). */
export default function ManagementPanel() {
  const [tab, setTab] = useState<TabId>('overview');
  const [collapsed, setCollapsed] = useState(false);
  const isDesktop = useIsDesktop();
  const reported = useStore((s) => s.posts.filter((p) => !p.hidden && p.reportedBy?.length).length);

  return (
    <aside
      className={`panel absolute z-30 flex flex-col overflow-hidden ${isDesktop ? 'bottom-4 right-4 top-4 w-[444px]' : 'inset-x-2 bottom-2 max-h-[55vh]'}`}
      aria-label="Management dashboard"
    >
      <button
        type="button"
        className="flex items-center border-b border-gray-100 p-4 text-left"
        onClick={() => !isDesktop && setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <span className="min-w-0 flex-1">
          <span className="block font-display text-xl font-bold">Management Office</span>
          <span className="block text-sm text-gray-500">Elmina Green · Ms. Nurul</span>
        </span>
        {!isDesktop && <ChevronDown className={`h-5 w-5 transition ${collapsed ? 'rotate-180' : ''}`} />}
      </button>
      {!collapsed && (
        <>
          <div className="scroll-thin flex shrink-0 gap-1 overflow-x-auto p-2" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-bold ${
                  tab === t.id ? 'bg-tool-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <t.icon className="h-4 w-4" /> {t.label}
                {t.id === 'moderation' && reported > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-sos-500 px-1 text-[10px] text-white">
                    {reported}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-4 pt-2">
            {tab === 'overview' && <Overview />}
            {tab === 'tickets' && <Tickets />}
            {tab === 'announce' && <Announce />}
            {tab === 'residents' && <Residents />}
            {tab === 'moderation' && <Moderation />}
            {tab === 'chats' && <Chats />}
          </div>
        </>
      )}
    </aside>
  );
}

// ── overview ─────────────────────────────────────────────────────

function Overview() {
  const incidents = useStore((s) => s.incidents);
  const repairs = useStore((s) => s.repairs);
  const suggestions = useStore((s) => s.suggestions);
  const posts = useStore((s) => s.posts);
  const users = useStore((s) => s.users);

  const stats = useMemo(() => {
    const open = incidents.filter((i) => i.status !== 'resolved' && i.status !== 'rejected').length;
    const durations = incidents
      .filter((i) => i.status === 'resolved')
      .map((i) => {
        const end = [...i.history].reverse().find((h) => h.status === 'resolved');
        return end ? new Date(end.at).getTime() - new Date(i.createdAt).getTime() : 0;
      })
      .filter(Boolean);
    const avgH = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length / 3_600_000 : 0;
    const openRepairs = repairs.filter((r) => r.status !== 'confirmed').length;
    const weekAgo = Date.now() - 7 * 86_400_000;
    const active = new Set(
      posts
        .filter((p) => new Date(p.createdAt).getTime() > weekAgo)
        .flatMap((p) => [
          p.authorId,
          ...p.reactions.map((r) => r.userId),
          ...p.replies.map((r) => r.authorId),
        ]),
    );
    const residents = users.filter((u) => u.role === 'resident');
    return {
      open,
      avgH,
      openRepairs,
      active: residents.filter((u) => active.has(u.id)).length,
      residents: residents.length,
    };
  }, [incidents, repairs, posts, users]);

  const top = [...suggestions]
    .filter((s) => s.status !== 'not-planned')
    .sort((a, b) => b.votes.length - a.votes.length)
    .slice(0, 3);
  const cards = [
    { label: 'Open incidents', value: stats.open, tone: 'text-sos-600' },
    { label: 'Avg resolution', value: stats.avgH ? `${stats.avgH.toFixed(0)} h` : '—', tone: '' },
    { label: 'Open repairs', value: stats.openRepairs, tone: 'text-tool-600' },
    { label: 'Active this week', value: `${stats.active}/${stats.residents}`, tone: 'text-leaf-700' },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl bg-gray-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{c.label}</p>
            <p className={`mt-1 font-display text-3xl font-bold ${c.tone}`}>{c.value}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Top-voted suggestions</p>
        <ul className="space-y-1.5">
          {top.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => focus({ kind: 'suggestion', id: s.id }, s.location.x, s.location.z)}
                className="flex w-full items-center gap-2 rounded-xl bg-gray-50 p-2.5 text-left hover:bg-gray-100"
              >
                <span className="text-xl">{suggestionMeta(s.item).icon}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{s.reason}</span>
                <span className="text-sm font-bold text-tool-600">▲ {s.votes.length}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── tickets kanban ───────────────────────────────────────────────

type Kind = 'incidents' | 'repairs' | 'suggestions';

const COLUMNS: Record<Kind, { id: string; label: string }[]> = {
  incidents: (['submitted', 'acknowledged', 'in-progress', 'resolved', 'rejected'] as IncidentStatus[]).map(
    (id) => ({ id, label: INCIDENT_STATUS_LABEL[id] }),
  ),
  repairs: (
    [
      'submitted',
      'under-review',
      'contractor-assigned',
      'inspection-scheduled',
      'in-progress',
      'completed',
      'reopened',
      'confirmed',
    ] as RepairStatus[]
  ).map((id) => ({
    id,
    label: REPAIR_STATUS_LABEL[id],
  })),
  suggestions: SUGGESTION_STATUS.map((s) => ({ id: s.id, label: s.label })),
};

interface CardData {
  id: string;
  status: string;
  icon: string;
  title: string;
  sub: string;
  x: number;
  z: number;
  sel: Selection;
}

function Tickets() {
  const me = useCurrentUser();
  const [kind, setKind] = useState<Kind>('repairs');
  const incidents = useStore((s) => s.incidents);
  const repairs = useStore((s) => s.repairs);
  const suggestions = useStore((s) => s.suggestions);
  const [over, setOver] = useState<string | null>(null);

  const cards: CardData[] = useMemo(() => {
    if (kind === 'incidents')
      return incidents.map((i) => ({
        id: i.id,
        status: i.status,
        icon: i.isSOS ? '🆘' : incidentMeta(i.category).icon,
        title: incidentMeta(i.category).label,
        sub: `${i.location.unitId ?? i.location.precinctId ?? ''} · ${ago(i.createdAt)}`,
        x: i.location.x,
        z: i.location.z,
        sel: { kind: 'incident', id: i.id },
      }));
    if (kind === 'repairs')
      return repairs.map((r) => ({
        id: r.id,
        status: r.status,
        icon: repairMeta(r.category).icon,
        title: repairMeta(r.category).label,
        sub: `${r.location.unitId ?? 'Common area'}${r.contractor ? ` · ${r.contractor}` : ''}`,
        x: r.location.x,
        z: r.location.z,
        sel: { kind: 'repair', id: r.id },
      }));
    return suggestions.map((s) => ({
      id: s.id,
      status: s.status,
      icon: suggestionMeta(s.item).icon,
      title: `${suggestionMeta(s.item).label} · ▲${s.votes.length}`,
      sub: s.reason,
      x: s.location.x,
      z: s.location.z,
      sel: { kind: 'suggestion', id: s.id },
    }));
  }, [kind, incidents, repairs, suggestions]);

  const move = (id: string, status: string) => {
    if (!me) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.status === status) return;
    if (kind === 'incidents') void api.updateIncident(id, me.id, status as IncidentStatus);
    else if (kind === 'repairs') void api.updateRepair(id, me.id, { status: status as RepairStatus });
    else void api.updateSuggestion(id, me.id, status as SuggestionStatus);
  };

  return (
    <div>
      <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1">
        {(['incidents', 'repairs', 'suggestions'] as Kind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            aria-pressed={kind === k}
            className={`h-9 rounded-lg text-xs font-bold capitalize ${kind === k ? 'bg-white shadow' : 'text-gray-500'}`}
          >
            {k}
          </button>
        ))}
      </div>
      <p className="mb-2 text-xs text-gray-500">
        Drag cards between columns · tap a card for details & actions
      </p>
      <div className="scroll-thin -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
        {COLUMNS[kind].map((col) => {
          const list = cards.filter((c) => c.status === col.id);
          return (
            <div
              key={col.id}
              onDragOver={(e: DragEvent) => {
                e.preventDefault();
                setOver(col.id);
              }}
              onDragLeave={() => setOver(null)}
              onDrop={(e: DragEvent) => {
                e.preventDefault();
                setOver(null);
                move(e.dataTransfer.getData('text/plain'), col.id);
              }}
              className={`flex w-44 shrink-0 flex-col rounded-2xl p-2 transition ${over === col.id ? 'bg-tool-500/15 ring-2 ring-tool-500' : 'bg-gray-50'}`}
            >
              <p className="mb-2 flex items-center justify-between px-1 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                {col.label} <span className="rounded-full bg-white px-1.5">{list.length}</span>
              </p>
              <ul className="min-h-[80px] space-y-1.5">
                {list.map((c) => (
                  <li
                    key={c.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', c.id)}
                    className="cursor-grab rounded-xl bg-white p-2 ring-1 ring-black/5 active:cursor-grabbing"
                  >
                    <button
                      type="button"
                      className="block w-full text-left"
                      onClick={() => focus(c.sel, c.x, c.z)}
                    >
                      <span className="flex items-center gap-1.5 text-xs font-bold">
                        <span>{c.icon}</span> <span className="truncate">{c.title}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-gray-500">{c.sub}</span>
                    </button>
                    {/* Keyboard / touch alternative to dragging */}
                    <select
                      aria-label={`Move ${c.title}`}
                      value={c.status}
                      onChange={(e) => move(c.id, e.target.value)}
                      className="mt-1 w-full rounded-lg bg-gray-50 px-1 py-1 text-[11px]"
                    >
                      {COLUMNS[kind].map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.label}
                        </option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── announcements ────────────────────────────────────────────────

function Announce() {
  const me = useCurrentUser();
  const anns = useStore((s) => s.announcements);
  const toast = useStore((s) => s.toast);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targets, setTargets] = useState<string[]>([]);
  const publish = async () => {
    if (!me || !title.trim() || !body.trim()) return;
    await api.createAnnouncement(me.id, { title: title.trim(), body: body.trim(), targetPrecincts: targets });
    setTitle('');
    setBody('');
    setTargets([]);
    toast('Announcement published 📢 — residents notified', 'success');
  };
  return (
    <div className="space-y-3">
      <Field label="Title">
        <input
          className={inputCls}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={60}
          placeholder="e.g. Water disruption notice"
        />
      </Field>
      <Field label="Message">
        <textarea
          className={`${inputCls} min-h-[80px]`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={300}
        />
      </Field>
      <Field label="Target">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setTargets([])}
            aria-pressed={targets.length === 0}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${targets.length === 0 ? 'bg-tool-500 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            All precincts
          </button>
          {PRECINCTS.filter((p) => p.kind === 'DSLH' || p.kind === 'DSSD' || p.kind === 'RSKU').map((p) => {
            const on = targets.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                onClick={() => setTargets(on ? targets.filter((t) => t !== p.id) : [...targets, p.id])}
                className={`rounded-full px-2.5 py-1.5 text-xs font-bold ${on ? 'bg-tool-500 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {p.id}
              </button>
            );
          })}
        </div>
      </Field>
      <button
        type="button"
        className="btn-primary w-full"
        disabled={!title.trim() || !body.trim()}
        onClick={publish}
      >
        <Megaphone className="h-5 w-5" /> Publish
      </button>
      <p className="pt-2 text-xs font-bold uppercase tracking-wide text-gray-500">Recent</p>
      <ul className="space-y-1.5">
        {anns.slice(0, 5).map((a) => (
          <li key={a.id} className="rounded-xl bg-amber-50 p-2.5 text-sm">
            <b>{a.title}</b> <span className="text-xs text-gray-500">· {ago(a.publishedAt)}</span>
            <p className="text-xs text-gray-600">
              {a.targetPrecincts.length ? a.targetPrecincts.join(', ') : 'All precincts'}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── residents & units ────────────────────────────────────────────

function Residents() {
  const users = useStore((s) => s.users);
  const toast = useStore((s) => s.toast);
  const [q, setQ] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    unitId: '',
    household: 'owner' as 'owner' | 'tenant' | 'family',
  });
  const [creating, setCreating] = useState(false);
  const residents = users.filter(
    (u) => u.role === 'resident' && (!q || `${u.name} ${u.unitId}`.toLowerCase().includes(q.toLowerCase())),
  );
  const unitOk = getLayout().unitMap.has(form.unitId.trim().toUpperCase());

  const create = async () => {
    const unitId = form.unitId.trim().toUpperCase();
    if (!form.name.trim() || !form.email.includes('@') || !unitOk) return;
    setCreating(true);
    await api.createResident({ ...form, unitId, name: form.name.trim(), email: form.email.trim() });
    setCreating(false);
    toast(
      `Invite sent to ${form.email} (demo) ✉️ — ${form.name.split(' ')[0]} now appears at ${unitId}`,
      'success',
    );
    const lot = getLayout().unitMap.get(unitId);
    if (lot) focus({ kind: 'house', unitId }, lot.x, lot.z);
    setForm({ name: '', email: '', phone: '', unitId: '', household: 'owner' });
  };

  return (
    <div className="space-y-4">
      <details className="rounded-2xl bg-leaf-50 p-3" open>
        <summary className="cursor-pointer text-sm font-bold text-leaf-700">
          + Create resident account
        </summary>
        <div className="mt-3 grid gap-2">
          <input
            className={inputCls}
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            aria-label="Full name"
          />
          <input
            className={inputCls}
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            aria-label="Email"
          />
          <input
            className={inputCls}
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            aria-label="Phone"
          />
          <div className="flex gap-2">
            <input
              className={`${inputCls} ${form.unitId && !unitOk ? 'border-sos-500' : ''}`}
              placeholder="Unit ID e.g. EG18-045"
              value={form.unitId}
              onChange={(e) => setForm({ ...form, unitId: e.target.value })}
              aria-label="Unit ID"
            />
            <select
              className={inputCls}
              value={form.household}
              onChange={(e) =>
                setForm({ ...form, household: e.target.value as 'owner' | 'tenant' | 'family' })
              }
              aria-label="Role in household"
            >
              <option value="owner">Owner</option>
              <option value="tenant">Tenant</option>
              <option value="family">Family</option>
            </select>
          </div>
          {form.unitId && !unitOk && (
            <p className="text-xs text-sos-600">Unknown unit — landed units look like EG18-045 or EG3-120.</p>
          )}
          <button
            type="button"
            className="btn-primary"
            disabled={creating || !form.name.trim() || !form.email.includes('@') || !unitOk}
            onClick={create}
          >
            Send invite
          </button>
        </div>
      </details>
      <input
        className={inputCls}
        placeholder={`Search ${residents.length} residents or units`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search residents"
      />
      <ul className="divide-y divide-gray-100">
        {residents.map((u) => (
          <li key={u.id}>
            <button
              type="button"
              className="flex w-full items-center gap-3 py-2 text-left"
              onClick={() => {
                const lot = u.unitId ? getLayout().unitMap.get(u.unitId) : undefined;
                if (lot) focus({ kind: 'house', unitId: lot.unitId }, lot.x, lot.z);
              }}
            >
              <Avatar user={u} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{u.name}</span>
                <span className="block text-xs text-gray-500">
                  {u.unitId} · {u.household ?? 'owner'} · {u.email}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── moderation ───────────────────────────────────────────────────

function Moderation() {
  const posts = useStore((s) => s.posts);
  const users = useStore((s) => s.users);
  const reported = posts.filter((p) => !p.hidden && p.reportedBy?.length);
  const hidden = posts.filter((p) => p.hidden);
  return (
    <div className="space-y-4">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Reported posts</p>
      {reported.length === 0 && (
        <p className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500">Nothing to review ✨</p>
      )}
      <ul className="space-y-2">
        {reported.map((p) => (
          <li key={p.id} className="rounded-xl bg-red-50 p-3">
            <p className="text-sm">
              <b>{users.find((u) => u.id === p.authorId)?.name}</b>: {p.text}
            </p>
            <p className="text-xs text-gray-500">Reported by {p.reportedBy?.length} resident(s)</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="btn-danger min-h-[38px] text-sm"
                onClick={() => void api.moderatePost(p.id, true)}
              >
                Hide
              </button>
              <button
                type="button"
                className="btn-ghost min-h-[38px] text-sm"
                onClick={() => void api.moderatePost(p.id, false)}
              >
                Keep
              </button>
            </div>
          </li>
        ))}
      </ul>
      {hidden.length > 0 && (
        <>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Hidden</p>
          <ul className="space-y-1.5">
            {hidden.map((p) => (
              <li key={p.id} className="flex items-center gap-2 rounded-xl bg-gray-50 p-2.5 text-sm">
                <span className="min-w-0 flex-1 truncate text-gray-500 line-through">{p.text}</span>
                <button
                  type="button"
                  className="text-xs font-bold text-tool-600"
                  onClick={() => void api.moderatePost(p.id, false)}
                >
                  Unhide
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// ── chats ────────────────────────────────────────────────────────

function Chats() {
  const me = useCurrentUser();
  const channels = useStore((s) => s.channels.filter((c) => c.kind === 'management'));
  const messages = useStore((s) => s.messages);
  const users = useStore((s) => s.users);
  return (
    <ul className="space-y-1.5">
      {channels.length === 0 && (
        <li className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500">No conversations yet</li>
      )}
      {channels.map((c) => {
        const resident = users.find((u) => u.role === 'resident' && c.memberIds.includes(u.id));
        const msgs = messages.filter((m) => m.channelId === c.id);
        const unread = me ? msgs.filter((m) => !m.readBy.includes(me.id)).length : 0;
        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => useStore.getState().openPanel({ kind: 'chat', channelId: c.id })}
              className="flex w-full items-center gap-3 rounded-xl bg-gray-50 p-3 text-left hover:bg-gray-100"
            >
              <Avatar user={resident} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">
                  {resident?.name} · {resident?.unitId}
                </span>
                <span className="block truncate text-xs text-gray-500">
                  {msgs.at(-1)?.text ?? 'No messages yet'}
                </span>
              </span>
              {unread > 0 && (
                <span className="grid h-6 min-w-6 place-items-center rounded-full bg-sos-500 px-1.5 text-xs font-bold text-white">
                  {unread}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
