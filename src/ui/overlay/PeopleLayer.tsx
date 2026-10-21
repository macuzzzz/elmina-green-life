import { memo, useEffect, useMemo, useState } from 'react';
import type { Post, User } from '@/types';
import { useCurrentUser, useStore } from '@/store';
import { avatarUrl } from '@/features/avatar/avatarUrl';
import { cameraController } from '@/world/cameraController';
import { getLayout, type HouseLot } from '@/world/layout';
import { BASE_LOT } from '@/world/buildings/geometries';
import { displayName } from '@/lib/people';
import { Anchor } from './anchors';

const MAX_BUBBLES = 8;
const DAY = 24 * 3600_000;

interface Person {
  user: User;
  lot: HouseLot;
  x: number;
  z: number;
  thought?: Post;
}

/** Spot in front of the lot's gate, offset sideways for a second household member. */
function frontOf(lot: HouseLot, slot: number) {
  const lx = (slot === 0 ? -1 : 1) * 1.9;
  const lz = BASE_LOT.d / 2 + 2.6;
  const c = Math.cos(lot.rot);
  const s = Math.sin(lot.rot);
  return { x: lot.x + lx * c + lz * s, z: lot.z - lx * s + lz * c };
}

/** Avatars standing outside their houses, with thought bubbles (nearest 8 expanded). */
export function PeopleLayer() {
  const users = useStore((s) => s.users);
  const posts = useStore((s) => s.posts);
  const lod = useStore((s) => s.lod);
  const me = useCurrentUser();

  const people = useMemo<Person[]>(() => {
    const L = getLayout();
    const latest = new Map<string, Post>();
    const cutoff = Date.now() - DAY;
    for (const p of posts) {
      if (p.hidden || new Date(p.createdAt).getTime() < cutoff) continue;
      const cur = latest.get(p.authorId);
      if (!cur || cur.createdAt < p.createdAt) latest.set(p.authorId, p);
    }
    const perUnit = new Map<string, number>();
    const out: Person[] = [];
    // Me first so I always get a slot at my own house.
    const residents = users
      .filter((u) => u.role === 'resident' && u.unitId)
      .sort((a, b) => (a.id === me?.id ? -1 : b.id === me?.id ? 1 : 0));
    for (const u of residents) {
      const lot = L.unitMap.get(u.unitId!);
      if (!lot) continue;
      const n = perUnit.get(lot.unitId) ?? 0;
      if (n >= 2) continue; // more household members are listed on the House card
      perUnit.set(lot.unitId, n + 1);
      out.push({ user: u, lot, ...frontOf(lot, n), thought: latest.get(u.id) });
    }
    return out;
  }, [users, posts, me?.id]);

  // Which bubbles are expanded: the nearest few to the camera target, refreshed lazily.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  useEffect(() => {
    const tick = () => {
      const { tx, tz } = cameraController.cur;
      const ids = people
        .filter((p) => p.thought)
        .map((p) => ({ id: p.user.id, d: Math.hypot(p.x - tx, p.z - tz) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, MAX_BUBBLES)
        .map((p) => p.id);
      setExpanded((prev) =>
        prev.size === ids.length && ids.every((id) => prev.has(id)) ? prev : new Set(ids),
      );
    };
    tick();
    const id = setInterval(tick, 600);
    return () => clearInterval(id);
  }, [people]);

  const hidden = lod === 'far';
  return (
    <>
      {people.map((p) => (
        <Anchor key={p.user.id} x={p.x} y={5.5} z={p.z} hidden={hidden}>
          <PersonPin
            person={p}
            isMe={p.user.id === me?.id}
            viewerId={me?.id}
            expanded={expanded.has(p.user.id)}
            near={lod === 'near'}
          />
        </Anchor>
      ))}
    </>
  );
}

const PersonPin = memo(function PersonPin({
  person,
  isMe,
  viewerId,
  expanded,
  near,
}: {
  person: Person;
  isMe: boolean;
  viewerId?: string;
  expanded: boolean;
  near: boolean;
}) {
  const typing = useStore((s) => (isMe ? s.typing : false));
  const { user, lot, thought } = person;
  const showFace = isMe || user.privacy.showAvatarOnMap;
  const size = near ? 46 : 32;

  const openHouse = () => {
    useStore.getState().select({ kind: 'house', unitId: lot.unitId });
    useStore.getState().bounceUnit(lot.unitId);
  };
  const openThought = () => {
    if (!thought) return;
    useStore.getState().focusPost(thought.id);
    cameraController.flyTo(
      { x: lot.x, z: lot.z },
      { dist: Math.min(cameraController.goal.dist, 160), duration: 0.8 },
    );
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* thought bubble */}
      {(typing || thought) && (
        <div className="absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2">
          {typing ? (
            <ThoughtCloud key="typing">
              <span className="flex gap-1 px-1 py-0.5" aria-label="Typing">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                ))}
              </span>
            </ThoughtCloud>
          ) : expanded || isMe ? (
            <ThoughtCloud key={thought!.id} onClick={openThought}>
              <span className="block max-w-[150px] truncate text-[11px] font-semibold leading-tight text-charcoal-800">
                {thought!.text}
              </span>
            </ThoughtCloud>
          ) : (
            <button
              type="button"
              onClick={openThought}
              className="pointer-events-auto grid h-6 w-6 place-items-center rounded-full border border-gray-200 bg-white text-xs"
              aria-label={`${displayName(user, viewerId)}'s thought: ${thought!.text}`}
              title={thought!.text}
            >
              💬
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={openHouse}
        className={`pointer-events-auto block h-full w-full overflow-hidden rounded-full border-2 bg-gradient-to-b from-sky-100 to-leaf-100 ${
          isMe ? 'border-sos-500' : 'border-white'
        }`}
        aria-label={isMe ? 'My home' : `${displayName(user, viewerId)}'s home`}
      >
        {showFace && user.avatar ? (
          <img
            src={avatarUrl(user.avatar)}
            alt=""
            className="h-full w-full translate-y-[6%] scale-110"
            draggable={false}
          />
        ) : (
          <span className="grid h-full w-full place-items-center bg-white text-base">🏠</span>
        )}
      </button>
      {isMe && (
        <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-sos-500 text-[10px]">
          🏠
        </span>
      )}
      <span className="absolute -bottom-1.5 left-1/2 h-2 w-3/4 -translate-x-1/2 rounded-full bg-black/25" />
    </div>
  );
});

function ThoughtCloud({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pointer-events-auto relative block animate-pop rounded-2xl border border-gray-200 bg-white px-2.5 py-1 text-left"
    >
      {children}
      <span className="absolute -bottom-1.5 left-3 h-2.5 w-2.5 rounded-full border border-gray-200 bg-white" />
      <span className="absolute -bottom-3 left-1.5 h-1.5 w-1.5 rounded-full border border-gray-200 bg-white" />
    </button>
  );
}
