import { useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { Plus } from 'lucide-react';
import type { LostFoundItem } from '@/types';
import { api } from '@/services/api';
import { useCurrentUser, useStore } from '@/store';
import { displayName } from '@/lib/people';
import { Field, PanelHeader, inputCls } from '@/ui/Modal';
import { PhotoPicker } from '@/ui/PhotoPicker';
import { Empty, MessageButton, Segmented } from './ui';

/** Lost something? Found something? Neighbours help each other out. */
export function LostFoundPanel({ onClose }: { onClose: () => void }) {
  const me = useCurrentUser();
  const items = useStore((s) => s.lostFound);
  const [tab, setTab] = useState<'open' | 'lost' | 'found' | 'resolved'>('open');
  const [adding, setAdding] = useState(false);
  if (!me) return null;
  const open = items.filter((i) => !i.resolved);
  const list =
    tab === 'resolved'
      ? items.filter((i) => i.resolved)
      : tab === 'open'
        ? open
        : open.filter((i) => i.kind === tab);

  return (
    <div>
      <PanelHeader title="Lost & found" subtitle={`${open.length} open`} onClose={onClose} icon="🔎" />
      <div className="space-y-4 p-5">
        {me.role === 'resident' &&
          (adding ? (
            <NewItemForm onDone={() => setAdding(false)} />
          ) : (
            <button type="button" className="btn-primary w-full" onClick={() => setAdding(true)}>
              <Plus className="h-5 w-5" /> Post a lost or found item
            </button>
          ))}
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { id: 'open', label: 'All open' },
            { id: 'lost', label: 'Lost' },
            { id: 'found', label: 'Found' },
            { id: 'resolved', label: 'Reunited' },
          ]}
        />
        {list.length === 0 ? (
          <Empty icon="🧸">Nothing here — that’s good news!</Empty>
        ) : (
          <ul className="space-y-2">
            {list.map((i) => (
              <ItemCard key={i.id} item={i} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ItemCard({ item: i }: { item: LostFoundItem }) {
  const me = useCurrentUser();
  const author = useStore((s) => s.users.find((u) => u.id === i.authorId));
  const toast = useStore((s) => s.toast);
  if (!me) return null;
  const mine = i.authorId === me.id;
  return (
    <li
      className={`flex gap-3 rounded-2xl p-3 ${i.resolved ? 'bg-gray-50 opacity-70' : 'bg-white ring-1 ring-black/5'}`}
    >
      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-gray-100 text-3xl">
        {i.photoUrl ? (
          <img src={i.photoUrl} alt={i.title} className="h-full w-full object-cover" />
        ) : i.kind === 'lost' ? (
          '❓'
        ) : (
          '🙌'
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
              i.kind === 'lost' ? 'bg-red-100 text-red-700' : 'bg-sky-100 text-sky-700'
            }`}
          >
            {i.resolved ? 'Reunited' : i.kind}
          </span>
          <span className="truncate font-bold">{i.title}</span>
        </p>
        <p className="mt-0.5 text-xs text-gray-600">{i.description}</p>
        <p className="mt-0.5 text-[11px] text-gray-400">
          📍 {i.where} · {displayName(author, me.id)} ·{' '}
          {formatDistanceToNowStrict(new Date(i.createdAt), { addSuffix: true })}
        </p>
        {!i.resolved && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {mine ? (
              <button
                type="button"
                className="btn-ghost min-h-[36px] px-3 text-sm"
                onClick={() => {
                  void api.resolveLostFound(i.id);
                  toast('Marked as reunited 🎉', 'success');
                }}
              >
                {i.kind === 'lost' ? 'I got it back' : 'Returned to owner'}
              </button>
            ) : (
              <MessageButton userId={i.authorId} label={i.kind === 'lost' ? 'I found it' : 'It’s mine'} />
            )}
            {me.role === 'management' && (
              <button
                type="button"
                className="text-xs font-bold text-sos-600"
                onClick={() => void api.removeLostFound(i.id)}
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

function NewItemForm({ onDone }: { onDone: () => void }) {
  const me = useCurrentUser();
  const toast = useStore((s) => s.toast);
  const [f, setF] = useState({
    kind: 'lost' as LostFoundItem['kind'],
    title: '',
    where: '',
    description: '',
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const ok = f.title.trim() && f.where.trim();
  const post = async () => {
    if (!me || !ok) return;
    await api.createLostFound(me.id, {
      kind: f.kind,
      title: f.title.trim(),
      where: f.where.trim(),
      description: f.description.trim(),
      photoUrl: photos[0],
    });
    toast(
      f.kind === 'lost' ? 'Posted — fingers crossed 🤞' : 'Thanks for being a good neighbour 🙌',
      'success',
    );
    onDone();
  };
  return (
    <div className="space-y-3 rounded-2xl bg-leaf-50 p-3">
      <Segmented
        value={f.kind}
        onChange={(kind) => setF({ ...f, kind })}
        options={[
          { id: 'lost', label: '❓ I lost something' },
          { id: 'found', label: '🙌 I found something' },
        ]}
      />
      <Field label="Item">
        <input
          className={inputCls}
          value={f.title}
          onChange={(e) => setF({ ...f, title: e.target.value })}
          maxLength={40}
          placeholder="e.g. Black wallet"
        />
      </Field>
      <Field label="Where">
        <input
          className={inputCls}
          value={f.where}
          onChange={(e) => setF({ ...f, where: e.target.value })}
          maxLength={50}
          placeholder="e.g. Playground, EG18"
        />
      </Field>
      <Field label="Details">
        <textarea
          className={`${inputCls} min-h-[60px]`}
          value={f.description}
          onChange={(e) => setF({ ...f, description: e.target.value })}
          maxLength={160}
          placeholder="Colour, markings, when…"
        />
      </Field>
      <PhotoPicker photos={photos} onChange={setPhotos} max={1} />
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn-ghost" onClick={onDone}>
          Cancel
        </button>
        <button type="button" className="btn-primary" disabled={!ok} onClick={post}>
          Post
        </button>
      </div>
    </div>
  );
}
