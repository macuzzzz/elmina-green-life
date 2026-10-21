import { useState } from 'react';
import { Save } from 'lucide-react';
import type { Decor, FestiveDecor, GardenItem } from '@/types';
import { api } from '@/services/api';
import { useCurrentUser, useStore } from '@/store';
import { Field, PanelHeader } from '@/ui/Modal';
import { cameraController } from '@/world/cameraController';
import { getLayout } from '@/world/layout';
import { DECOR_CAR_COLORS, DEFAULT_DECOR, FESTIVE, GARDEN, GATE_COLORS } from './decor';

/** Cosmetic decorations for your own plot — free, visible to neighbours. */
export function DecoratePanel({ onClose }: { onClose: () => void }) {
  const me = useCurrentUser();
  const toast = useStore((s) => s.toast);
  const [d, setD] = useState<Decor>(() => me?.decor ?? DEFAULT_DECOR);
  if (!me) return null;

  const save = async () => {
    await api.updateUser(me.id, { decor: d });
    onClose();
    toast('Home decorated! Neighbours can see it on the map 🎉', 'success');
    const home = me.unitId ? getLayout().unitMap.get(me.unitId) : undefined;
    if (home) {
      cameraController.flyTo({ x: home.x, z: home.z }, { dist: 90, duration: 1 });
      useStore.getState().bounceUnit(home.unitId);
    }
  };

  const Swatch = ({
    color,
    active,
    onClick,
    label,
  }: {
    color: string;
    active: boolean;
    onClick: () => void;
    label: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={`h-10 w-10 rounded-full border-2 ${active ? 'scale-110 border-tool-500 ring-2 ring-tool-500/30' : 'border-white ring-1 ring-black/10'}`}
      style={{ background: color }}
    />
  );

  return (
    <div>
      <PanelHeader
        title="Decorate my home"
        subtitle="Everything is free · only your own plot"
        onClose={onClose}
        icon="🎨"
      />
      <div className="space-y-4 p-5">
        <Field label="Gate colour">
          <div className="flex flex-wrap gap-2">
            {GATE_COLORS.map((c) => (
              <Swatch
                key={c}
                color={c}
                active={d.gateColor === c}
                onClick={() => setD({ ...d, gateColor: c })}
                label={`Gate ${c}`}
              />
            ))}
          </div>
        </Field>
        <Field label="Car colour">
          <div className="flex flex-wrap gap-2">
            {DECOR_CAR_COLORS.map((c) => (
              <Swatch
                key={c}
                color={c}
                active={d.carColor === c}
                onClick={() => setD({ ...d, carColor: c })}
                label={`Car ${c}`}
              />
            ))}
          </div>
        </Field>
        <Field label="Garden">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(GARDEN) as GardenItem[]).map((g) => {
              const on = d.garden.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setD({ ...d, garden: on ? d.garden.filter((x) => x !== g) : [...d.garden, g] })
                  }
                  className={`min-h-[40px] rounded-full px-3 text-sm font-bold ${on ? 'bg-leaf-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  {GARDEN[g].icon} {GARDEN[g].label}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Festive decorations">
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(FESTIVE) as FestiveDecor[]).map((f) => {
              const on = d.festive === f;
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setD({ ...d, festive: on ? null : f })}
                  className={`min-h-[48px] rounded-xl px-3 text-left text-sm font-bold ${on ? 'bg-amber-400 text-charcoal-900' : 'bg-gray-100 text-gray-600'}`}
                >
                  <span className="mr-1 text-lg">{FESTIVE[f].icon}</span> {FESTIVE[f].label}
                </button>
              );
            })}
          </div>
        </Field>
        <button type="button" className="btn-primary w-full" onClick={save}>
          <Save className="h-5 w-5" /> Save decorations
        </button>
      </div>
    </div>
  );
}
