import { useState } from 'react';
import { Send } from 'lucide-react';
import type { IncidentCategory, MapLocation, Urgency } from '@/types';
import { api } from '@/services/api';
import { useCurrentUser, useStore } from '@/store';
import { Field, PanelHeader, inputCls } from '@/ui/Modal';
import { PhotoPicker } from '@/ui/PhotoPicker';
import { INCIDENT_CATEGORIES, URGENCY } from './meta';

/** Incident report: category → urgency → description + photos → submit. */
export function ReportPanel({ location, onClose }: { location: MapLocation; onClose: () => void }) {
  const me = useCurrentUser();
  const toast = useStore((s) => s.toast);
  const [category, setCategory] = useState<IncidentCategory | null>(null);
  const [urgency, setUrgency] = useState<Urgency>('medium');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!me || !category) return;
    setBusy(true);
    const inc = await api.createIncident(me.id, {
      category,
      urgency,
      description: description.trim(),
      photos,
      location,
    });
    setBusy(false);
    onClose();
    useStore.getState().select({ kind: 'incident', id: inc.id });
    toast('Report submitted — the guardhouse and management have been notified ✅', 'success');
  };

  return (
    <div>
      <PanelHeader
        title="Report an incident"
        subtitle={
          location.unitId
            ? `At ${location.unitId}`
            : `Map pin${location.precinctId ? ` in ${location.precinctId}` : ''}`
        }
        onClose={onClose}
        icon="🚨"
      />
      <div className="space-y-4 p-5">
        <Field label="What's happening?">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {INCIDENT_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                aria-pressed={category === c.id}
                className={`flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border-2 p-2 text-center text-[11px] font-bold leading-tight transition ${
                  category === c.id
                    ? 'border-tool-500 bg-tool-500/10'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl" aria-hidden>
                  {c.icon}
                </span>
                {c.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Urgency">
          <div className="grid grid-cols-3 gap-2">
            {URGENCY.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setUrgency(u.id)}
                aria-pressed={urgency === u.id}
                className={`h-11 rounded-xl text-sm font-bold transition ${urgency === u.id ? `${u.cls} ring-2 ring-current` : 'bg-gray-100 text-gray-600'}`}
              >
                {u.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Description">
          <textarea
            className={`${inputCls} min-h-[80px]`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A few words help the team respond faster"
            maxLength={300}
          />
        </Field>
        <Field label="Photos (up to 3)">
          <PhotoPicker photos={photos} onChange={setPhotos} />
        </Field>
        {category === 'security' && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-sos-700">
            Security reports are only visible to you, the guards and management. In an emergency call 999.
          </p>
        )}
        <button type="button" className="btn-primary w-full" disabled={!category || busy} onClick={submit}>
          <Send className="h-5 w-5" /> {busy ? 'Sending…' : 'Submit report'}
        </button>
      </div>
    </div>
  );
}
