import { AnimatePresence, motion } from 'framer-motion';
import { Hand, Home, MapPin, MessageSquare, Newspaper, Users, X } from 'lucide-react';
import { PRECINCT_BY_ID } from '@/data/township';
import { useCurrentUser, useStore } from '@/store';
import { displayName, visibleUnit } from '@/lib/people';
import { Avatar } from '@/ui/Avatar';
import { getLayout } from '@/world/layout';
import { api } from '@/services/api';
import { IncidentCard, RepairCard, SuggestionCard } from '@/features/tickets/TicketCards';

const KIND_NAME: Record<string, string> = {
  DSLH: 'Double-storey terrace',
  DSSD: 'Double-storey semi-detached',
  RSKU: 'Rumah Selangorku apartments',
  SHOP: 'Shop lots',
  AFFORDABLE_SHOP: 'Affordable shops',
};

function PrecinctCard({ id }: { id: string }) {
  const p = PRECINCT_BY_ID[id];
  const users = useStore((s) => s.users);
  const L = getLayout();
  const pl = L.precincts.find((x) => x.precinct.id === id);
  if (!p) return null;
  const onApp = users.filter((u) => u.unitId?.startsWith(`${id}-`)).length;
  const units = p.units ?? pl?.houseCount;
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-leaf-500 font-display text-lg font-extrabold text-white">
          {id.replace('EG', '')}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold leading-tight">Precinct {id}</h2>
          <p className="text-sm text-gray-500">
            {KIND_NAME[p.kind]} · {p.typeLabel}
          </p>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-gray-50 p-2.5">
          <dt className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Units</dt>
          <dd className="font-display text-xl font-bold">{units?.toLocaleString() ?? '—'}</dd>
        </div>
        <div className="rounded-xl bg-gray-50 p-2.5">
          <dt className="text-[11px] font-bold uppercase tracking-wide text-gray-500">On the app</dt>
          <dd className="flex items-center gap-1 font-display text-xl font-bold">
            <Users className="h-4 w-4 text-leaf-600" /> {onApp}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Facilities</p>
      <ul className="mt-1 flex flex-wrap gap-1.5">
        {p.facilities.map((f) => (
          <li key={f} className="rounded-full bg-leaf-50 px-2.5 py-1 text-xs font-semibold text-leaf-700">
            {f}
          </li>
        ))}
      </ul>
    </>
  );
}

function HouseCard({ unitId }: { unitId: string }) {
  const me = useCurrentUser();
  const users = useStore((s) => s.users);
  const toast = useStore((s) => s.toast);
  const lot = getLayout().unitMap.get(unitId);
  const posts = useStore((s) => s.posts);
  const isMine = me?.unitId === unitId;
  const residents = users
    .filter((u) => u.unitId === unitId)
    .sort((a, b) => (a.id === me?.id ? -1 : b.id === me?.id ? 1 : 0));
  const precinct = PRECINCT_BY_ID[unitId.split('-')[0]];
  const primary = residents[0];
  const latest = posts
    .filter((p) => !p.hidden && residents.some((r) => r.id === p.authorId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const lotLabel = precinct?.lot ? `${precinct.lot.width}×${precinct.lot.depth} ft` : '';
  const hiddenUnit = primary && !isMine && !visibleUnit(primary, me?.id);
  return (
    <>
      <div className="flex items-center gap-3">
        {primary && primary.privacy.showAvatarOnMap ? (
          <Avatar user={primary} size={52} />
        ) : (
          <span className="grid h-[52px] w-[52px] place-items-center rounded-full bg-gray-100 text-gray-500">
            <Home className="h-6 w-6" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 font-display text-xl font-bold leading-tight">
            {isMine && <Home className="h-5 w-5 text-sos-500" />}
            {isMine ? 'My Home' : primary ? displayName(primary, me?.id) : 'Unit'}
          </h2>
          <p className="text-sm text-gray-500">
            {hiddenUnit ? `${precinct?.id ?? ''} · unit hidden` : unitId} ·{' '}
            {lot?.kind === 'DSSD' ? 'Semi-D' : 'Terrace'} {lotLabel}
            {lot?.endSide ? ' · corner lot' : ''}
          </p>
        </div>
      </div>
      {residents.length > 0 ? (
        <div className="mt-3 rounded-xl bg-gray-50 p-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Latest thought</p>
          {latest ? (
            <button
              type="button"
              className="mt-0.5 block text-left text-sm text-charcoal-800 hover:underline"
              onClick={() => useStore.getState().focusPost(latest.id)}
            >
              💭 “{latest.text}”
            </button>
          ) : (
            <p className="mt-0.5 text-sm italic text-gray-500">No thoughts shared yet</p>
          )}
          {residents.length > 1 && (
            <div className="mt-2 flex items-center gap-1.5">
              {residents.map((r) => (
                <Avatar key={r.id} user={r} size={26} />
              ))}
              <span className="text-xs text-gray-500">{residents.length} household members</span>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-3 rounded-xl bg-gray-50 p-2.5 text-sm text-gray-500">
          No residents from this unit are on the app yet.
        </p>
      )}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {isMine ? (
          <button
            type="button"
            className="btn-primary col-span-3"
            onClick={() => useStore.getState().openPanel({ kind: 'myhome' })}
          >
            <Home className="h-5 w-5" /> Open My Home
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn-ghost px-2 text-sm"
              disabled={!primary}
              onClick={() => {
                toast(`You waved at ${displayName(primary, me?.id)} 👋`, 'success');
                useStore.getState().bounceUnit(unitId);
              }}
            >
              <Hand className="h-4 w-4" /> Wave
            </button>
            <button
              type="button"
              className="btn-ghost px-2 text-sm"
              disabled={
                !primary ||
                !primary.privacy.allowNeighbourDMs ||
                me?.privacy.allowNeighbourDMs === false ||
                !me
              }
              title={
                primary && !primary.privacy.allowNeighbourDMs
                  ? 'This neighbour has turned off direct messages'
                  : undefined
              }
              onClick={async () => {
                if (!me || !primary) return;
                const ch = await api.openChannel(me.id, 'direct', primary.id);
                useStore.getState().openPanel({ kind: 'chat', channelId: ch.id });
              }}
            >
              <MessageSquare className="h-4 w-4" /> Message
            </button>
            <button
              type="button"
              className="btn-ghost px-2 text-sm"
              disabled={!primary}
              onClick={() => primary && useStore.getState().showAuthorPosts(primary.id)}
            >
              <Newspaper className="h-4 w-4" /> Posts
            </button>
          </>
        )}
      </div>
    </>
  );
}

function TicketCard({ kind, id }: { kind: 'incident' | 'repair' | 'suggestion'; id: string }) {
  const inc = useStore((s) => (kind === 'incident' ? s.incidents.find((x) => x.id === id) : undefined));
  const rep = useStore((s) => (kind === 'repair' ? s.repairs.find((x) => x.id === id) : undefined));
  const sug = useStore((s) => (kind === 'suggestion' ? s.suggestions.find((x) => x.id === id) : undefined));
  if (inc) return <IncidentCard inc={inc} />;
  if (rep) return <RepairCard r={rep} />;
  if (sug) return <SuggestionCard s={sug} />;
  return <p className="text-sm text-gray-500">This item is no longer available.</p>;
}

/** Floating card for the current selection (house, precinct or ticket). */
export function SelectionCard({ className = '' }: { className?: string }) {
  const selection = useStore((s) => s.selection);
  const select = useStore((s) => s.select);
  const key = selection
    ? selection.kind === 'house'
      ? selection.unitId
      : `${selection.kind}-${selection.id}`
    : null;
  const label = !selection
    ? ''
    : selection.kind === 'house'
      ? `House ${selection.unitId}`
      : selection.kind === 'precinct'
        ? `Precinct ${selection.id}`
        : `${selection.kind} details`;
  return (
    <AnimatePresence mode="wait">
      {selection && (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className={`panel scroll-thin relative max-h-[min(70vh,640px)] overflow-y-auto p-4 ${className}`}
          role="dialog"
          aria-label={label}
        >
          <button
            type="button"
            onClick={() => select(null)}
            className="icon-btn absolute right-1.5 top-1.5 z-10 h-9 w-9 text-gray-500"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          {selection.kind === 'house' ? (
            <HouseCard unitId={selection.unitId} />
          ) : selection.kind === 'precinct' ? (
            <PrecinctCard id={selection.id} />
          ) : (
            <TicketCard kind={selection.kind} id={selection.id} />
          )}
          {(selection.kind === 'house' || selection.kind === 'precinct') && (
            <p className="mt-3 flex items-center gap-1 text-[11px] text-gray-400">
              <MapPin className="h-3 w-3" /> Elmina Green, City of Elmina, Shah Alam
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
