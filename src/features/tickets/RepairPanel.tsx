import { useState } from 'react';
import { MapPin, Send } from 'lucide-react';
import type { MapLocation, RepairCategory } from '@/types';
import { api } from '@/services/api';
import { useCurrentUser, useStore } from '@/store';
import { Field, PanelHeader, inputCls } from '@/ui/Modal';
import { PhotoPicker } from '@/ui/PhotoPicker';
import { getLayout } from '@/world/layout';
import { REPAIR_CATEGORIES, TIME_SLOTS } from './meta';

/**
 * Repair request. Defaults to "My unit"; "Common area" sends the resident to pick
 * a spot on the map and comes back here with that location.
 */
export function RepairPanel({ location, onClose }: { location?: MapLocation; onClose: () => void }) {
  const me = useCurrentUser();
  const toast = useStore((s) => s.toast);
  const commonLoc = location && !location.unitId ? location : null;
  const [scope, setScope] = useState<'unit' | 'common'>(commonLoc ? 'common' : 'unit');
  const [category, setCategory] = useState<RepairCategory | null>(null);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const home = me?.unitId ? getLayout().unitMap.get(me.unitId) : undefined;
  const target: MapLocation | null =
    scope === 'unit'
      ? home
        ? { x: home.x, z: home.z, unitId: home.unitId, precinctId: home.precinctId }
        : null
      : commonLoc;

  const pickOnMap = () => {
    onClose();
    const s = useStore.getState();
    s.setTool('repair');
  };

  const submit = async () => {
    if (!me || !category || !target) return;
    setBusy(true);
    const r = await api.createRepair(me.id, {
      scope,
      category,
      description: description.trim(),
      photos,
      location: target,
      preferredSlots: slots,
    });
    setBusy(false);
    onClose();
    useStore.getState().select({ kind: 'repair', id: r.id });
    toast('Repair request sent to management 🔧', 'success');
  };

  return (
    <div>
      <PanelHeader
        title="Request a repair"
        subtitle="Management will review and assign a contractor"
        onClose={onClose}
        icon="🔧"
      />
      <div className="space-y-4 p-5">
        <Field label="Where?">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setScope('unit')}
              aria-pressed={scope === 'unit'}
              className={`h-11 rounded-xl text-sm font-bold ${scope === 'unit' ? 'bg-tool-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              🏠 My unit {me?.unitId ? `(${me.unitId})` : ''}
            </button>
            <button
              type="button"
              onClick={() => (commonLoc ? setScope('common') : pickOnMap())}
              aria-pressed={scope === 'common'}
              className={`h-11 rounded-xl text-sm font-bold ${scope === 'common' ? 'bg-tool-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              🌳 Common area
            </button>
          </div>
          {scope === 'common' && (
            <button
              type="button"
              onClick={pickOnMap}
              className="mt-2 flex items-center gap-1 text-xs font-semibold text-tool-600"
            >
              <MapPin className="h-3.5 w-3.5" />{' '}
              {commonLoc
                ? `Pinned in ${commonLoc.precinctId ?? 'the township'} — change`
                : 'Pick a spot on the map'}
            </button>
          )}
        </Field>
        <Field label="What needs fixing?">
          <div className="grid grid-cols-3 gap-2">
            {REPAIR_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                aria-pressed={category === c.id}
                className={`flex min-h-[64px] flex-col items-center justify-center gap-0.5 rounded-2xl border-2 p-1.5 text-center text-[11px] font-bold leading-tight ${
                  category === c.id ? 'border-tool-500 bg-tool-500/10' : 'border-gray-100 bg-gray-50'
                }`}
              >
                <span className="text-xl" aria-hidden>
                  {c.icon}
                </span>
                {c.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Description">
          <textarea
            className={`${inputCls} min-h-[70px]`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the problem"
            maxLength={300}
          />
        </Field>
        <Field label="Photos (up to 3)">
          <PhotoPicker photos={photos} onChange={setPhotos} />
        </Field>
        <Field label="Preferred inspection slots (pick 2–3)">
          <div className="flex flex-wrap gap-1.5">
            {TIME_SLOTS.map((t) => {
              const on = slots.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setSlots(on ? slots.filter((x) => x !== t) : slots.length < 3 ? [...slots, t] : slots)
                  }
                  className={`min-h-[36px] rounded-full px-3 text-xs font-bold ${on ? 'bg-leaf-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </Field>
        <button
          type="button"
          className="btn-primary w-full"
          disabled={!category || !target || busy}
          onClick={submit}
        >
          <Send className="h-5 w-5" /> {busy ? 'Sending…' : 'Submit repair request'}
        </button>
      </div>
    </div>
  );
}
