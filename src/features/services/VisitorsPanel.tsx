import { useMemo, useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { QrCode as QrIcon, UserPlus } from 'lucide-react';
import { api } from '@/services/api';
import { useCurrentUser, useStore } from '@/store';
import { formatDay, malaysiaDate } from '@/lib/time';
import { Field, PanelHeader, inputCls } from '@/ui/Modal';
import { VISITOR_STATUS, passPayload } from './meta';
import { Empty, QrCode, Segmented } from './ui';

/** Resident: pre-register visitors and share a QR pass. Staff: today's gate list. */
export function VisitorsPanel({ onClose }: { onClose: () => void }) {
  const me = useCurrentUser();
  const staff = me?.role !== 'resident';
  return (
    <div>
      <PanelHeader
        title="Visitor passes"
        subtitle={staff ? 'Today at the gate' : 'Register guests before they arrive'}
        onClose={onClose}
        icon="🪪"
      />
      <div className="p-5">{staff ? <GateList /> : <ResidentPasses />}</div>
    </div>
  );
}

function ResidentPasses() {
  const me = useCurrentUser();
  const visitors = useStore((s) => s.visitors);
  const toast = useStore((s) => s.toast);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => malaysiaDate(new Date(), i)), []);
  const [form, setForm] = useState({ visitorName: '', plate: '', date: days[0] });
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  if (!me?.unitId) return null;
  const today = malaysiaDate();
  const mine = visitors.filter((v) => v.unitId === me.unitId);
  const upcoming = mine.filter(
    (v) => v.date >= today && (v.status === 'expected' || v.status === 'checked-in'),
  );
  const past = mine.filter((v) => !upcoming.includes(v));
  const list = (tab === 'upcoming' ? upcoming : past).sort((a, b) => a.date.localeCompare(b.date));

  const create = async () => {
    if (!form.visitorName.trim()) return;
    setBusy(true);
    const v = await api.createVisitor(me.id, {
      unitId: me.unitId!,
      visitorName: form.visitorName.trim(),
      plate: form.plate.trim().toUpperCase() || undefined,
      date: form.date,
    });
    setBusy(false);
    setForm({ visitorName: '', plate: '', date: days[0] });
    setTab('upcoming');
    setOpenId(v.id);
    toast('Pass created 🪪 — share the QR code with your visitor', 'success');
  };

  return (
    <div className="space-y-5">
      <details className="rounded-2xl bg-leaf-50 p-3" open={upcoming.length === 0}>
        <summary className="cursor-pointer text-sm font-bold text-leaf-700">+ Register a visitor</summary>
        <div className="mt-3 grid gap-3">
          <Field label="Visitor name">
            <input
              className={inputCls}
              value={form.visitorName}
              onChange={(e) => setForm({ ...form, visitorName: e.target.value })}
              placeholder="e.g. Aunty Lim"
              maxLength={40}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Car plate (optional)">
              <input
                className={`${inputCls} uppercase`}
                value={form.plate}
                onChange={(e) => setForm({ ...form, plate: e.target.value })}
                placeholder="WXY 1234"
                maxLength={12}
              />
            </Field>
            <Field label="Arriving">
              <select
                className={inputCls}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              >
                {days.map((d, i) => (
                  <option key={d} value={d}>
                    {i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : formatDay(d)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <button
            type="button"
            className="btn-primary"
            disabled={busy || !form.visitorName.trim()}
            onClick={create}
          >
            <UserPlus className="h-5 w-5" /> Create pass
          </button>
        </div>
      </details>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { id: 'upcoming', label: `Upcoming (${upcoming.length})` },
          { id: 'past', label: 'Past' },
        ]}
      />
      {list.length === 0 ? (
        <Empty icon="🚗">{tab === 'upcoming' ? 'No visitors expected.' : 'No past visitors yet.'}</Empty>
      ) : (
        <ul className="space-y-2">
          {list.map((v) => {
            const st = VISITOR_STATUS[v.status];
            const open = openId === v.id;
            return (
              <li key={v.id} className="rounded-2xl bg-gray-50 p-3">
                <div className="flex items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{v.visitorName}</span>
                    <span className="block text-xs text-gray-500">
                      {formatDay(v.date)}
                      {v.plate && ` · ${v.plate}`}
                    </span>
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${st.cls}`}>
                    {st.label}
                  </span>
                  {v.code !== 'WALKIN' && v.status === 'expected' && (
                    <button
                      type="button"
                      className="icon-btn h-9 w-9"
                      aria-label={open ? 'Hide pass' : 'Show QR pass'}
                      aria-expanded={open}
                      onClick={() => setOpenId(open ? null : v.id)}
                    >
                      <QrIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
                {open && v.status === 'expected' && (
                  <div className="mt-3 flex flex-col items-center gap-2 rounded-2xl bg-white p-4 ring-1 ring-black/5">
                    <QrCode value={passPayload(v)} />
                    <p className="font-mono text-2xl font-bold tracking-[0.3em]">{v.code}</p>
                    <p className="text-center text-xs text-gray-500">
                      Show this at the EG18 guardhouse on {formatDay(v.date)} · valid for one entry
                    </p>
                    <div className="grid w-full grid-cols-2 gap-2">
                      <button
                        type="button"
                        className="btn-ghost min-h-[38px] text-sm"
                        onClick={() => {
                          const text = `Your Elmina Green visitor pass for ${formatDay(v.date)}: code ${v.code} (unit ${v.unitId})`;
                          void navigator.clipboard?.writeText(text).catch(() => undefined);
                          toast('Pass details copied — paste into WhatsApp 📋', 'success');
                        }}
                      >
                        Copy details
                      </button>
                      <button
                        type="button"
                        className="btn-ghost min-h-[38px] text-sm text-sos-600"
                        onClick={() => {
                          void api.updateVisitor(v.id, me.id, 'cancelled');
                          setOpenId(null);
                        }}
                      >
                        Cancel pass
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Staff view: everyone expected or inside today, with check-in / out. */
function GateList() {
  const me = useCurrentUser();
  const visitors = useStore((s) => s.visitors);
  const today = malaysiaDate();
  const list = visitors.filter((v) => v.date === today && v.status !== 'cancelled');
  if (!me) return null;
  if (list.length === 0) return <Empty icon="🚗">No visitors registered for today.</Empty>;
  return (
    <ul className="divide-y divide-gray-100">
      {list.map((v) => {
        const st = VISITOR_STATUS[v.status];
        return (
          <li key={v.id} className="flex items-center gap-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{v.visitorName}</span>
              <span className="block truncate text-xs text-gray-500">
                → {v.unitId}
                {v.plate && ` · ${v.plate}`}
                {v.checkedInAt &&
                  ` · in ${formatDistanceToNowStrict(new Date(v.checkedInAt), { addSuffix: true })}`}
              </span>
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${st.cls}`}>{st.label}</span>
            {v.status === 'expected' && (
              <button
                type="button"
                className="text-xs font-bold text-tool-600"
                onClick={() => void api.updateVisitor(v.id, me.id, 'checked-in')}
              >
                Check in
              </button>
            )}
            {v.status === 'checked-in' && (
              <button
                type="button"
                className="text-xs font-bold text-tool-600"
                onClick={() => void api.updateVisitor(v.id, me.id, 'checked-out')}
              >
                Check out
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
