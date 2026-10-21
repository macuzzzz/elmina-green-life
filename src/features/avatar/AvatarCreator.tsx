import { useState } from 'react';
import { Dices, Save } from 'lucide-react';
import type { AvatarConfig } from '@/types';
import { api } from '@/services/api';
import { useCurrentUser, useStore } from '@/store';
import { PanelHeader } from '@/ui/Modal';
import { AvatarFace } from './AvatarFace';
import { AVATAR_LABELS, AVATAR_OPTIONS, randomAvatar } from './avatarParts';

const COLOR_KEYS: (keyof AvatarConfig)[] = ['skinTone', 'hairColor', 'headwearColor', 'topColor'];
const ORDER: (keyof AvatarConfig)[] = [
  'skinTone',
  'faceShape',
  'hairStyle',
  'hairColor',
  'headwear',
  'headwearColor',
  'eyes',
  'eyebrows',
  'mouth',
  'expression',
  'glasses',
  'facialHair',
  'topColor',
];

const pretty = (v: string) => v.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

/** Layered-SVG avatar creator with live preview, randomise and save. */
export function AvatarCreator({ onClose }: { onClose: () => void }) {
  const me = useCurrentUser();
  const toast = useStore((s) => s.toast);
  const [a, setA] = useState<AvatarConfig>(() => me?.avatar ?? randomAvatar());
  const [saving, setSaving] = useState(false);
  if (!me) return null;
  const firstTime = !me.onboarded;

  const save = async () => {
    setSaving(true);
    await api.updateUser(me.id, { avatar: a, onboarded: true });
    setSaving(false);
    toast('Avatar saved! Your neighbours can see you on the map 👋', 'success');
    onClose();
  };

  return (
    <div>
      <PanelHeader
        title={firstTime ? 'Welcome! Create your avatar' : 'Edit avatar'}
        subtitle="This is how neighbours will see you on the map"
        onClose={onClose}
      />
      <div className="grid gap-4 p-5 sm:grid-cols-[180px_1fr]">
        <div className="flex flex-col items-center gap-3 sm:sticky sm:top-20 sm:self-start">
          <div className="grid h-40 w-40 place-items-center overflow-hidden rounded-full bg-gradient-to-b from-sky-100 to-leaf-100">
            <AvatarFace avatar={a} size={170} className="translate-y-3" title="Avatar preview" />
          </div>
          <button type="button" className="btn-ghost w-full" onClick={() => setA(randomAvatar())}>
            <Dices className="h-5 w-5" /> Randomise
          </button>
          <button type="button" className="btn-primary w-full" onClick={save} disabled={saving}>
            <Save className="h-5 w-5" /> {saving ? 'Saving…' : 'Save avatar'}
          </button>
        </div>
        <div className="space-y-3">
          {ORDER.map((key) => {
            const isColor = COLOR_KEYS.includes(key);
            if (key === 'headwearColor' && a.headwear === 'none') return null;
            return (
              <fieldset key={key}>
                <legend className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                  {AVATAR_LABELS[key]}
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {(AVATAR_OPTIONS[key] as readonly string[]).map((opt) => {
                    const active = a[key] === opt;
                    return isColor ? (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setA({ ...a, [key]: opt })}
                        className={`h-9 w-9 rounded-full border-2 transition ${active ? 'scale-110 border-tool-500 ring-2 ring-tool-500/30' : 'border-white ring-1 ring-black/10'}`}
                        style={{ background: opt }}
                        aria-label={`${AVATAR_LABELS[key]} ${opt}`}
                        aria-pressed={active}
                      />
                    ) : (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setA({ ...a, [key]: opt })}
                        className={`min-h-[36px] rounded-xl px-3 text-sm font-semibold transition ${
                          active ? 'bg-tool-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        aria-pressed={active}
                      >
                        {pretty(opt)}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>
      </div>
    </div>
  );
}
