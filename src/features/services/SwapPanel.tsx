import { useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
import type { Listing, ListingKind } from '@/types';
import { api } from '@/services/api';
import { useCurrentUser, useStore } from '@/store';
import { displayName } from '@/lib/people';
import { Field, PanelHeader, inputCls } from '@/ui/Modal';
import { PhotoPicker } from '@/ui/PhotoPicker';
import { LISTING_KINDS, chipCls, listingMeta, rm } from './meta';
import { Empty, MessageButton } from './ui';

const STATUS_LABEL: Record<Listing['status'], string> = {
  available: 'Available',
  reserved: 'Reserved',
  gone: 'Gone',
};

/** Neighbours give away, swap or sell pre-loved items. */
export function SwapPanel({ onClose }: { onClose: () => void }) {
  const me = useCurrentUser();
  const listings = useStore((s) => s.listings);
  const [filter, setFilter] = useState<ListingKind | 'all' | 'mine'>('all');
  const [adding, setAdding] = useState(false);
  if (!me) return null;
  const resident = me.role === 'resident';
  const list = listings
    .filter((l) => (filter === 'all' ? true : filter === 'mine' ? l.authorId === me.id : l.kind === filter))
    .sort((a, b) => Number(a.status === 'gone') - Number(b.status === 'gone'));

  return (
    <div>
      <PanelHeader
        title="Swap corner"
        subtitle="Give away, swap or sell to neighbours"
        onClose={onClose}
        icon="🛍️"
      />
      <div className="space-y-4 p-5">
        {resident &&
          (adding ? (
            <NewListingForm onDone={() => setAdding(false)} />
          ) : (
            <button type="button" className="btn-primary w-full" onClick={() => setAdding(true)}>
              <Plus className="h-5 w-5" /> List an item
            </button>
          ))}
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className={chipCls(filter === 'all')} onClick={() => setFilter('all')}>
            All
          </button>
          {LISTING_KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              className={chipCls(filter === k.id)}
              onClick={() => setFilter(k.id)}
            >
              {k.icon} {k.label}
            </button>
          ))}
          {resident && (
            <button type="button" className={chipCls(filter === 'mine')} onClick={() => setFilter('mine')}>
              Mine
            </button>
          )}
        </div>
        {list.length === 0 ? (
          <Empty icon="🛍️">Nothing listed here yet.</Empty>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {list.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ListingCard({ listing: l }: { listing: Listing }) {
  const me = useCurrentUser();
  const author = useStore((s) => s.users.find((u) => u.id === l.authorId));
  const k = listingMeta(l.kind);
  if (!me) return null;
  const mine = l.authorId === me.id;
  return (
    <li
      className={`flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 ${l.status === 'gone' ? 'opacity-60' : ''}`}
    >
      <div className="relative grid h-28 place-items-center bg-gradient-to-br from-gray-50 to-gray-100 text-5xl">
        {l.photoUrl ? <img src={l.photoUrl} alt={l.title} className="h-full w-full object-cover" /> : k.icon}
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${k.cls}`}>
          {l.kind === 'sale' && l.price ? rm(l.price) : k.label}
        </span>
        {l.status !== 'available' && (
          <span className="absolute right-2 top-2 rounded-full bg-charcoal-800 px-2 py-0.5 text-[11px] font-bold text-white">
            {STATUS_LABEL[l.status]}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="font-bold leading-tight">{l.title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">{l.description}</p>
        <p className="mt-1 text-[11px] text-gray-400">
          {displayName(author, me.id)} ·{' '}
          {formatDistanceToNowStrict(new Date(l.createdAt), { addSuffix: true })}
        </p>
        <div className="mt-2 flex items-center gap-2">
          {mine ? (
            <>
              <select
                aria-label="Listing status"
                className="min-w-0 flex-1 rounded-lg bg-gray-100 px-2 py-1.5 text-xs font-bold"
                value={l.status}
                onChange={(e) => void api.updateListing(l.id, e.target.value as Listing['status'])}
              >
                {Object.entries(STATUS_LABEL).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="icon-btn h-8 w-8 text-sos-600"
                aria-label="Delete listing"
                onClick={() => void api.removeListing(l.id)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          ) : me.role === 'management' ? (
            <button
              type="button"
              className="text-xs font-bold text-sos-600"
              onClick={() => void api.removeListing(l.id)}
            >
              Remove listing
            </button>
          ) : (
            l.status !== 'gone' && <MessageButton userId={l.authorId} label="I’m interested" />
          )}
        </div>
      </div>
    </li>
  );
}

function NewListingForm({ onDone }: { onDone: () => void }) {
  const me = useCurrentUser();
  const toast = useStore((s) => s.toast);
  const [f, setF] = useState({ kind: 'giveaway' as ListingKind, title: '', description: '', price: '' });
  const [photos, setPhotos] = useState<string[]>([]);
  const ok = f.title.trim() && (f.kind !== 'sale' || Number(f.price) > 0);
  const post = async () => {
    if (!me || !ok) return;
    await api.createListing(me.id, {
      kind: f.kind,
      title: f.title.trim(),
      description: f.description.trim(),
      price: f.kind === 'sale' ? Number(f.price) : undefined,
      photoUrl: photos[0],
    });
    toast('Listed in the swap corner 🛍️', 'success');
    onDone();
  };
  return (
    <div className="space-y-3 rounded-2xl bg-leaf-50 p-3">
      <div className="grid grid-cols-3 gap-1.5">
        {LISTING_KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            aria-pressed={f.kind === k.id}
            onClick={() => setF({ ...f, kind: k.id })}
            className={`rounded-xl py-2 text-xs font-bold ${f.kind === k.id ? 'bg-tool-500 text-white' : 'bg-white text-gray-600'}`}
          >
            {k.icon} {k.label}
          </button>
        ))}
      </div>
      <div className={`grid gap-2 ${f.kind === 'sale' ? 'grid-cols-[1fr_100px]' : ''}`}>
        <Field label="What is it?">
          <input
            className={inputCls}
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
            maxLength={40}
            placeholder="e.g. Rice cooker"
          />
        </Field>
        {f.kind === 'sale' && (
          <Field label="Price (RM)">
            <input
              type="number"
              min={1}
              className={inputCls}
              value={f.price}
              onChange={(e) => setF({ ...f, price: e.target.value })}
            />
          </Field>
        )}
      </div>
      <Field label="Details">
        <textarea
          className={`${inputCls} min-h-[60px]`}
          value={f.description}
          onChange={(e) => setF({ ...f, description: e.target.value })}
          maxLength={160}
          placeholder="Condition, size, pick-up…"
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
