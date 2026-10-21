import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { Flag, Megaphone, MessageSquare, SendHorizontal, Smile, X } from 'lucide-react';
import type { Announcement, Post, ReactionKind, User } from '@/types';
import { api } from '@/services/api';
import { useCurrentUser, useStore } from '@/store';
import { displayName, visibleUnit } from '@/lib/people';
import { Avatar } from '@/ui/Avatar';
import { cameraController } from '@/world/cameraController';
import { getLayout } from '@/world/layout';

type Tab = 'all' | 'neighbours' | 'announcements';
type Item = { kind: 'post'; post: Post; at: string } | { kind: 'announcement'; a: Announcement; at: string };

export const REACTIONS: { kind: ReactionKind; emoji: string }[] = [
  { kind: 'love', emoji: '❤️' },
  { kind: 'like', emoji: '👍' },
  { kind: 'laugh', emoji: '😂' },
  { kind: 'wow', emoji: '😮' },
  { kind: 'pray', emoji: '🙏' },
];
const EMOJI = ['😀', '😂', '🥰', '👍', '🙏', '🎉', '☀️', '🌧️', '🏸', '☕', '🐱', '🚧', '🌅', '🍜'];

const ago = (iso: string) =>
  formatDistanceToNowStrict(new Date(iso), { addSuffix: true })
    .replace(' minutes', ' min')
    .replace(' minute', ' min');

function flyToUser(user?: User) {
  const lot = user?.unitId ? getLayout().unitMap.get(user.unitId) : undefined;
  if (!lot) return;
  cameraController.flyTo({ x: lot.x, z: lot.z }, { dist: 140 });
  useStore.getState().select({ kind: 'house', unitId: lot.unitId });
  useStore.getState().bounceUnit(lot.unitId);
}

/** Community feed with reactions, replies, composer (→ thought bubble) and reporting. */
export function FeedPanel({ className = '' }: { className?: string }) {
  const [tab, setTab] = useState<Tab>('all');
  const posts = useStore((s) => s.posts);
  const anns = useStore((s) => s.announcements);
  const users = useStore((s) => s.users);
  const loaded = useStore((s) => s.dataLoaded);
  const focusPostId = useStore((s) => s.focusPostId);
  const authorId = useStore((s) => s.feedAuthorId);
  const me = useCurrentUser();
  const listRef = useRef<HTMLUListElement>(null);

  const myPrecinct = me?.unitId?.split('-')[0];
  const items = useMemo<Item[]>(() => {
    let p: Item[] = posts
      .filter((x) => !x.hidden)
      .map((post) => ({ kind: 'post', post, at: post.createdAt }));
    const a: Item[] = anns.map((x) => ({ kind: 'announcement', a: x, at: x.publishedAt }));
    if (authorId) p = p.filter((i) => i.kind === 'post' && i.post.authorId === authorId);
    let list = tab === 'announcements' ? a : tab === 'neighbours' || authorId ? p : [...p, ...a];
    if (tab === 'neighbours' && myPrecinct) {
      list = list.filter(
        (i) =>
          i.kind === 'post' &&
          users.find((u) => u.id === i.post.authorId)?.unitId?.startsWith(`${myPrecinct}-`),
      );
    }
    return list.sort((x, y) => y.at.localeCompare(x.at));
  }, [posts, anns, tab, users, myPrecinct, authorId]);

  // Clicking a bubble on the map focuses its post here.
  useEffect(() => {
    if (!focusPostId) return;
    setTab('all');
    const t = setTimeout(() => {
      listRef.current
        ?.querySelector(`[data-post="${focusPostId}"]`)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 80);
    const clear = setTimeout(() => useStore.getState().focusPost(null), 2600);
    return () => {
      clearTimeout(t);
      clearTimeout(clear);
    };
  }, [focusPostId]);

  const author = authorId ? users.find((u) => u.id === authorId) : undefined;

  return (
    <section
      className={`panel flex min-h-0 flex-col overflow-hidden ${className}`}
      aria-label="Community feed"
    >
      <div className="flex gap-1.5 p-2" role="tablist">
        {(
          [
            ['all', 'All'],
            ['neighbours', 'Neighbours'],
            ['announcements', 'Announcements'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => {
              setTab(id);
              useStore.getState().showAuthorPosts(null);
            }}
            className={`h-9 flex-1 rounded-xl text-[13px] font-bold transition ${
              tab === id && !authorId
                ? 'bg-tool-500 text-white shadow'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {author && (
        <div className="mx-2 mb-1 flex items-center gap-2 rounded-xl bg-tool-500/10 px-3 py-1.5 text-sm font-semibold text-tool-600">
          Posts by {displayName(author, me?.id)}
          <button
            type="button"
            className="ml-auto"
            onClick={() => useStore.getState().showAuthorPosts(null)}
            aria-label="Clear filter"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <ul ref={listRef} className="scroll-thin min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto">
        {!loaded &&
          Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="flex animate-pulse gap-3 px-3 py-3">
              <span className="h-10 w-10 rounded-full bg-gray-200" />
              <span className="flex-1 space-y-2">
                <span className="block h-3 w-1/2 rounded bg-gray-200" />
                <span className="block h-3 w-4/5 rounded bg-gray-100" />
              </span>
            </li>
          ))}
        {loaded && items.length === 0 && (
          <li className="px-4 py-10 text-center text-sm text-gray-500">
            <span className="mb-2 block text-3xl" aria-hidden>
              🌱
            </span>
            Nothing here yet — say hi to your neighbours!
          </li>
        )}
        {items.map((it) =>
          it.kind === 'post' ? (
            <PostItem
              key={it.post.id}
              post={it.post}
              me={me}
              users={users}
              highlight={focusPostId === it.post.id}
            />
          ) : (
            <li key={it.a.id} className="flex gap-3 bg-amber-50/70 px-3 py-2.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-400 text-white">
                <Megaphone className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-1.5">
                  <span className="truncate text-[13px] font-extrabold">{it.a.title}</span>
                  <span className="ml-auto shrink-0 text-[11px] text-gray-400">{ago(it.at)}</span>
                </span>
                <span className="block text-[13px] leading-snug text-charcoal-700">{it.a.body}</span>
                <span className="mt-0.5 block text-[11px] font-semibold text-amber-700">
                  Management ·{' '}
                  {it.a.targetPrecincts.length ? it.a.targetPrecincts.join(', ') : 'All precincts'}
                </span>
              </span>
            </li>
          ),
        )}
      </ul>
      {me?.role === 'resident' && <Composer me={me} />}
    </section>
  );
}

const PostItem = memo(function PostItem({
  post,
  me,
  users,
  highlight,
}: {
  post: Post;
  me?: User;
  users: User[];
  highlight: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState('');
  const [menu, setMenu] = useState(false);
  const author = users.find((u) => u.id === post.authorId);
  const unit = visibleUnit(author, me?.id);
  const counts = REACTIONS.map((r) => ({ ...r, n: post.reactions.filter((x) => x.kind === r.kind).length }));
  const mine = post.reactions.find((r) => r.userId === me?.id)?.kind;
  const toast = useStore((s) => s.toast);

  return (
    <li data-post={post.id} className={`px-3 py-2.5 transition-colors ${highlight ? 'bg-amber-100' : ''}`}>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => flyToUser(author)}
          aria-label={`Show ${displayName(author, me?.id)}'s home`}
        >
          <Avatar user={author} size={40} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <button
              type="button"
              onClick={() => flyToUser(author)}
              className="truncate text-left text-[13px] font-extrabold hover:underline"
            >
              {displayName(author, me?.id)}
              {unit && <span className="font-semibold text-gray-500"> ({unit})</span>}
            </button>
            <span className="ml-auto shrink-0 text-[11px] text-gray-400">{ago(post.createdAt)}</span>
            {me && post.authorId !== me.id && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenu((m) => !m)}
                  className="grid h-6 w-6 place-items-center rounded text-gray-400 hover:bg-gray-100"
                  aria-label="Post options"
                >
                  ⋯
                </button>
                {menu && (
                  <button
                    type="button"
                    onClick={() => {
                      void api.reportPost(post.id, me.id);
                      setMenu(false);
                      toast('Thanks — management will review this post', 'success');
                    }}
                    className="absolute right-0 top-6 z-10 flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-white px-3 py-2 text-xs font-bold text-sos-600 shadow-pop ring-1 ring-black/5"
                  >
                    <Flag className="h-3.5 w-3.5" /> Report post
                  </button>
                )}
              </div>
            )}
          </div>
          <p className="text-[13px] leading-snug text-charcoal-700">{post.text}</p>
          {post.photoUrl && <img src={post.photoUrl} alt="" className="mt-1.5 max-h-40 rounded-xl" />}
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {counts.map((r) => (
              <button
                key={r.kind}
                type="button"
                disabled={!me}
                onClick={() => me && void api.toggleReaction(post.id, me.id, r.kind)}
                aria-pressed={mine === r.kind}
                aria-label={`React ${r.kind}`}
                className={`flex h-7 items-center gap-0.5 rounded-full px-1.5 text-xs transition ${
                  mine === r.kind
                    ? 'bg-tool-500/15 ring-1 ring-tool-500'
                    : r.n
                      ? 'bg-gray-100'
                      : 'opacity-50 hover:bg-gray-100 hover:opacity-100'
                }`}
              >
                {r.emoji}
                {r.n > 0 && <span className="font-semibold text-gray-600">{r.n}</span>}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="ml-auto flex h-7 items-center gap-1 rounded-full px-2 text-xs font-semibold text-gray-500 hover:bg-gray-100"
              aria-expanded={open}
            >
              <MessageSquare className="h-3.5 w-3.5" /> {post.replies.length || ''}{' '}
              {post.replies.length === 1 ? 'reply' : 'replies'}
            </button>
          </div>
          {open && (
            <div className="mt-2 space-y-1.5 border-l-2 border-gray-100 pl-2">
              {post.replies.map((r) => {
                const ra = users.find((u) => u.id === r.authorId);
                return (
                  <div key={r.id} className="flex gap-2">
                    <Avatar user={ra} size={24} />
                    <p className="text-xs">
                      <b>{displayName(ra, me?.id)}</b> <span className="text-gray-600">{r.text}</span>
                    </p>
                  </div>
                );
              })}
              {me && (
                <form
                  className="flex gap-1.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!reply.trim()) return;
                    void api.reply(post.id, me.id, reply.trim());
                    setReply('');
                  }}
                >
                  <input
                    className="h-9 min-w-0 flex-1 rounded-lg bg-gray-100 px-2.5 text-xs outline-none focus:ring-2 focus:ring-tool-500/30"
                    placeholder="Write a reply…"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    aria-label="Reply"
                  />
                  <button
                    type="submit"
                    className="h-9 rounded-lg bg-tool-500 px-3 text-xs font-bold text-white"
                  >
                    Reply
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
});

function Composer({ me }: { me: User }) {
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState(false);
  const setTyping = useStore((s) => s.setTyping);
  const toast = useStore((s) => s.toast);
  const idle = useRef<ReturnType<typeof setTimeout>>();

  const onChange = (v: string) => {
    setText(v.slice(0, 80));
    setTyping(v.length > 0);
    clearTimeout(idle.current);
    idle.current = setTimeout(() => setTyping(false), 4000);
  };
  useEffect(() => () => setTyping(false), [setTyping]);

  const submit = async () => {
    if (!text.trim()) return;
    await api.createPost(me.id, text.trim());
    setText('');
    setTyping(false);
    setEmoji(false);
    toast('Posted! Your thought is floating over your house 💭', 'success');
    const home = me.unitId ? getLayout().unitMap.get(me.unitId) : undefined;
    if (home && useStore.getState().lod === 'far')
      cameraController.flyTo({ x: home.x, z: home.z }, { dist: 160 });
  };

  return (
    <div className="relative border-t border-gray-100 p-2">
      {emoji && (
        <div className="absolute bottom-full left-2 right-2 mb-1 grid grid-cols-7 gap-1 rounded-2xl bg-white p-2 shadow-pop ring-1 ring-black/5">
          {EMOJI.map((e) => (
            <button
              key={e}
              type="button"
              className="h-9 rounded-lg text-lg hover:bg-gray-100"
              onClick={() => onChange(text + e)}
            >
              {e}
            </button>
          ))}
        </div>
      )}
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Avatar user={me} size={36} />
        <label className="flex h-11 min-w-0 flex-1 items-center rounded-xl bg-gray-100 pl-3 pr-1">
          <span className="sr-only">Share your thoughts with neighbours</span>
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            placeholder="Share your thoughts with neighbours…"
            value={text}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setTyping(false)}
            maxLength={80}
          />
          {text.length > 60 && (
            <span className="mr-1 text-[10px] font-bold text-gray-400">{80 - text.length}</span>
          )}
          <button
            type="button"
            className="grid h-9 w-9 place-items-center text-gray-500"
            onClick={() => setEmoji((v) => !v)}
            aria-label="Emoji"
            aria-expanded={emoji}
          >
            <Smile className="h-5 w-5" />
          </button>
        </label>
        <button
          type="submit"
          disabled={!text.trim()}
          className="grid h-11 w-11 place-items-center rounded-xl bg-tool-500 text-white shadow active:scale-95 disabled:opacity-50"
          aria-label="Post"
        >
          <SendHorizontal className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
