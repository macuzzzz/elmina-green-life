import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useCurrentUser, useStore } from '@/store';
import { displayName, visibleUnit } from '@/lib/people';
import { Avatar } from '@/ui/Avatar';
import { PanelHeader, inputCls } from '@/ui/Modal';
import { cameraController } from '@/world/cameraController';
import { getLayout } from '@/world/layout';

/** Neighbours on the app (privacy respected; no phone numbers or emails). */
export function ResidentsPanel({ onClose }: { onClose: () => void }) {
  const me = useCurrentUser();
  const users = useStore((s) => s.users);
  const [q, setQ] = useState('');
  const myPrecinct = me?.unitId?.split('-')[0];
  const list = useMemo(
    () =>
      users
        .filter((u) => u.role === 'resident' && u.id !== me?.id)
        .map((u) => ({ u, name: displayName(u, me?.id), unit: visibleUnit(u, me?.id) }))
        .filter(
          (x) =>
            !q ||
            x.name.toLowerCase().includes(q.toLowerCase()) ||
            x.unit?.toLowerCase().includes(q.toLowerCase()),
        )
        .sort(
          (a, b) =>
            Number(b.u.unitId?.startsWith(`${myPrecinct}-`)) -
            Number(a.u.unitId?.startsWith(`${myPrecinct}-`)),
        ),
    [users, me, q, myPrecinct],
  );
  return (
    <div>
      <PanelHeader
        title="Residents"
        subtitle={`${list.length} neighbours on the app`}
        onClose={onClose}
        icon="👥"
      />
      <div className="p-4">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className={`${inputCls} pl-9`}
            placeholder="Search name or unit"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search residents"
          />
        </label>
        <ul className="mt-2 divide-y divide-gray-100">
          {list.map(({ u, name, unit }) => (
            <li key={u.id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-gray-50"
                onClick={() => {
                  const lot = u.unitId ? getLayout().unitMap.get(u.unitId) : undefined;
                  onClose();
                  if (lot) {
                    useStore.getState().select({ kind: 'house', unitId: lot.unitId });
                    cameraController.flyTo({ x: lot.x, z: lot.z }, { dist: 140 });
                  }
                }}
              >
                <Avatar user={u} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{name}</span>
                  <span className="block text-xs text-gray-500">
                    {unit ?? `${u.unitId?.split('-')[0]} · unit hidden`}
                  </span>
                </span>
                {u.unitId?.startsWith(`${myPrecinct}-`) && (
                  <span className="rounded-full bg-leaf-50 px-2 py-0.5 text-[11px] font-bold text-leaf-700">
                    Neighbour
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
