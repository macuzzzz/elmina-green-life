import { useState } from 'react';
import { BellRing, ChevronDown } from 'lucide-react';
import type { FeeStatement } from '@/types';
import { api } from '@/services/api';
import { useCurrentUser, useStore } from '@/store';
import { formatDay, malaysiaDate } from '@/lib/time';
import { PanelHeader } from '@/ui/Modal';
import { chipCls, feeTotal, periodLabel, rm } from './meta';
import { Empty, SectionTitle } from './ui';

const paidOn = (f: FeeStatement) => formatDay(malaysiaDate(new Date(f.paidAt!)));

/** Monthly maintenance statements. Payment is simulated — no money moves in the demo. */
export function FeesPanel({ onClose }: { onClose: () => void }) {
  const me = useCurrentUser();
  if (!me) return null;
  const staff = me.role !== 'resident';
  return (
    <div>
      <PanelHeader
        title="Maintenance fees"
        subtitle={staff ? 'Collection overview' : `Statements for ${me.unitId}`}
        onClose={onClose}
        icon="🧾"
      />
      <div className="p-5">{staff ? <Collection /> : <MyStatements />}</div>
    </div>
  );
}

function MyStatements() {
  const me = useCurrentUser();
  const fees = useStore((s) => s.fees);
  const toast = useStore((s) => s.toast);
  const [openId, setOpenId] = useState<string | null>(null);
  if (!me?.unitId) return null;
  const mine = fees.filter((f) => f.unitId === me.unitId).sort((a, b) => b.period.localeCompare(a.period));
  const owing = mine.filter((f) => !f.paidAt);
  const today = malaysiaDate();

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl p-4 ${owing.length ? 'bg-amber-50' : 'bg-leaf-50'}`}>
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Outstanding</p>
        <p className={`font-display text-3xl font-bold ${owing.length ? 'text-amber-700' : 'text-leaf-700'}`}>
          {owing.length ? rm(owing.reduce((a, f) => a + feeTotal(f.items), 0)) : 'All paid up ✅'}
        </p>
      </div>
      {mine.length === 0 ? (
        <Empty icon="🧾">No statements yet.</Empty>
      ) : (
        <ul className="space-y-2">
          {mine.map((f) => {
            const open = openId === f.id;
            const overdue = !f.paidAt && f.dueDate < today;
            return (
              <li key={f.id} className="rounded-2xl bg-gray-50 p-3">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 text-left"
                  onClick={() => setOpenId(open ? null : f.id)}
                  aria-expanded={open}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{periodLabel(f.period)}</span>
                    <span className="block text-xs text-gray-500">
                      {f.paidAt ? `Paid ${paidOn(f)} · Ref ${f.reference}` : `Due ${formatDay(f.dueDate)}`}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-bold">{rm(feeTotal(f.items))}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        f.paidAt
                          ? 'bg-emerald-100 text-emerald-700'
                          : overdue
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {f.paidAt ? 'Paid' : overdue ? 'Overdue' : 'Due'}
                    </span>
                  </span>
                  <ChevronDown className={`h-4 w-4 shrink-0 transition ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <div className="mt-3 border-t border-gray-200 pt-2">
                    <ul className="space-y-1 text-sm">
                      {f.items.map((it) => (
                        <li key={it.label} className="flex justify-between">
                          <span className="text-gray-600">{it.label}</span>
                          <span>{rm(it.amount)}</span>
                        </li>
                      ))}
                      <li className="flex justify-between border-t border-gray-200 pt-1 font-bold">
                        <span>Total</span>
                        <span>{rm(feeTotal(f.items))}</span>
                      </li>
                    </ul>
                    {!f.paidAt && (
                      <>
                        <button
                          type="button"
                          className="btn-primary mt-3 w-full"
                          onClick={async () => {
                            await api.payFee(f.id, me.id);
                            toast(
                              `Payment recorded for ${periodLabel(f.period)} ✅ (demo — no money moved)`,
                              'success',
                            );
                          }}
                        >
                          Pay {rm(feeTotal(f.items))}
                        </button>
                        <p className="mt-1.5 text-center text-[11px] text-gray-400">
                          Demo only — in the real app this opens FPX / card payment.
                        </p>
                      </>
                    )}
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

function Collection() {
  const fees = useStore((s) => s.fees);
  const toast = useStore((s) => s.toast);
  const periods = [...new Set(fees.map((f) => f.period))].sort().reverse();
  const [period, setPeriod] = useState(periods[0] ?? '');
  const rows = fees.filter((f) => f.period === period);
  const paid = rows.filter((f) => f.paidAt);
  const owing = rows.filter((f) => !f.paidAt).sort((a, b) => a.unitId.localeCompare(b.unitId));
  const billed = rows.reduce((a, f) => a + feeTotal(f.items), 0);
  const collected = paid.reduce((a, f) => a + feeTotal(f.items), 0);
  const pct = rows.length ? Math.round((paid.length / rows.length) * 100) : 0;

  const remind = (list: FeeStatement[]) => {
    list.forEach((f) => void api.remindFee(f.id));
    toast(`Reminder sent to ${list.length} unit${list.length === 1 ? '' : 's'} 🔔`, 'success');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {periods.map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={period === p}
            onClick={() => setPeriod(p)}
            className={chipCls(period === p)}
          >
            {periodLabel(p)}
          </button>
        ))}
      </div>
      <div className="rounded-2xl bg-gray-50 p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Collected</p>
            <p className="font-display text-3xl font-bold text-leaf-700">{pct}%</p>
          </div>
          <p className="text-right text-sm text-gray-500">
            {rm(collected)} of {rm(billed)}
            <br />
            {paid.length}/{rows.length} units
          </p>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-200">
          <div className="h-full rounded-full bg-leaf-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <section>
        <div className="mb-1.5 flex items-center justify-between">
          <SectionTitle>Outstanding ({owing.length})</SectionTitle>
          {owing.length > 0 && (
            <button type="button" className="text-xs font-bold text-tool-600" onClick={() => remind(owing)}>
              Remind all
            </button>
          )}
        </div>
        {owing.length === 0 ? (
          <Empty icon="🎉">Everyone has paid for {periodLabel(period)}.</Empty>
        ) : (
          <ul className="divide-y divide-gray-100">
            {owing.map((f) => (
              <li key={f.id} className="flex items-center gap-3 py-2">
                <span className="min-w-0 flex-1 text-sm font-bold">{f.unitId}</span>
                <span className="text-sm text-gray-600">{rm(feeTotal(f.items))}</span>
                <button
                  type="button"
                  className="icon-btn h-9 w-9 text-tool-600"
                  aria-label={`Remind ${f.unitId}`}
                  onClick={() => remind([f])}
                >
                  <BellRing className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
