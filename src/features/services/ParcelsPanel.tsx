import { useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { PackagePlus } from 'lucide-react';
import type { Parcel } from '@/types';
import { api } from '@/services/api';
import { useCurrentUser, useStore } from '@/store';
import { Field, PanelHeader, inputCls } from '@/ui/Modal';
import { getLayout } from '@/world/layout';
import { COURIERS } from './meta';
import { Empty, SectionTitle } from './ui';

const ago = (iso: string) => formatDistanceToNowStrict(new Date(iso), { addSuffix: true });

/** Resident: parcels waiting at the guardhouse. Staff: log arrivals and hand-overs. */
export function ParcelsPanel({ onClose }: { onClose: () => void }) {
  const me = useCurrentUser();
  const parcels = useStore((s) => s.parcels);
  if (!me) return null;
  const staff = me.role !== 'resident';
  const scope = staff ? parcels : parcels.filter((p) => p.unitId === me.unitId);
  const waiting = scope.filter((p) => !p.collectedAt);
  const collected = scope.filter((p) => p.collectedAt).slice(0, staff ? 8 : 20);

  return (
    <div>
      <PanelHeader
        title="Parcels"
        subtitle={
          staff
            ? `${waiting.length} waiting at the guardhouse`
            : `${me.unitId} · ${waiting.length ? `${waiting.length} waiting for you` : 'nothing waiting'}`
        }
        onClose={onClose}
        icon="📦"
      />
      <div className="space-y-5 p-5">
        {staff ? (
          <LogParcelForm />
        ) : (
          <p className="rounded-xl bg-leaf-50 px-3 py-2 text-xs text-leaf-700">
            Riders leave parcels at Guardhouse EG18 when you’re out. Collect any time with your unit number —
            you’ll get a notification as soon as one arrives.
          </p>
        )}
        <section>
          <SectionTitle>Waiting for collection</SectionTitle>
          {waiting.length === 0 ? (
            <Empty icon="📭">No parcels waiting.</Empty>
          ) : (
            <ul className="space-y-1.5">
              {waiting.map((p) => (
                <ParcelRow key={p.id} parcel={p} staff={staff} />
              ))}
            </ul>
          )}
        </section>
        {collected.length > 0 && (
          <section>
            <SectionTitle>Collected</SectionTitle>
            <ul className="space-y-1.5">
              {collected.map((p) => (
                <ParcelRow key={p.id} parcel={p} staff={staff} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function ParcelRow({ parcel: p, staff }: { parcel: Parcel; staff: boolean }) {
  return (
    <li
      className={`flex items-center gap-3 rounded-xl p-2.5 ${p.collectedAt ? 'bg-gray-50 text-gray-500' : 'bg-amber-50'}`}
    >
      <span className="text-xl" aria-hidden>
        {p.collectedAt ? '✅' : '📦'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">
          {staff && `${p.unitId} · `}
          {p.courier}
        </span>
        <span className="block truncate text-xs text-gray-500">
          {p.note && `${p.note} · `}
          {p.collectedAt ? `collected ${ago(p.collectedAt)}` : `arrived ${ago(p.loggedAt)}`}
        </span>
      </span>
      {staff && !p.collectedAt && (
        <button
          type="button"
          className="shrink-0 text-xs font-bold text-tool-600"
          onClick={() => void api.collectParcel(p.id)}
        >
          Handed over
        </button>
      )}
    </li>
  );
}

function LogParcelForm() {
  const me = useCurrentUser();
  const toast = useStore((s) => s.toast);
  const [f, setF] = useState({ unitId: '', courier: COURIERS[0], note: '' });
  const unitId = f.unitId.trim().toUpperCase();
  const unitOk = getLayout().unitMap.has(unitId);
  const log = async () => {
    if (!me || !unitOk) return;
    await api.logParcel(me.id, { unitId, courier: f.courier, note: f.note.trim() || undefined });
    toast(`📦 Logged for ${unitId} — resident notified`, 'success');
    setF({ unitId: '', courier: f.courier, note: '' });
  };
  return (
    <div className="space-y-2 rounded-2xl bg-leaf-50 p-3">
      <p className="text-sm font-bold text-leaf-700">Log a parcel</p>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Unit">
          <input
            className={`${inputCls} ${f.unitId && !unitOk ? 'border-sos-500' : ''}`}
            value={f.unitId}
            onChange={(e) => setF({ ...f, unitId: e.target.value })}
            placeholder="EG18-028"
            aria-invalid={!!f.unitId && !unitOk}
          />
        </Field>
        <Field label="Courier">
          <select
            className={inputCls}
            value={f.courier}
            onChange={(e) => setF({ ...f, courier: e.target.value })}
          >
            {COURIERS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
      </div>
      <input
        className={inputCls}
        value={f.note}
        onChange={(e) => setF({ ...f, note: e.target.value })}
        placeholder="Note, e.g. Large box / Fragile (optional)"
        maxLength={40}
        aria-label="Note"
      />
      <button type="button" className="btn-primary w-full" disabled={!unitOk} onClick={log}>
        <PackagePlus className="h-5 w-5" /> Log & notify resident
      </button>
    </div>
  );
}
