import { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Building2, Camera, Check, CheckCheck, SendHorizontal, ShieldCheck } from 'lucide-react';
import type { Channel, User } from '@/types';
import { api } from '@/services/api';
import { useCurrentUser, useStore } from '@/store';
import { displayName } from '@/lib/people';
import { fileToDataUrl } from '@/lib/images';
import { Avatar } from '@/ui/Avatar';
import { PanelHeader } from '@/ui/Modal';

const QUICK = ['Expecting a delivery', 'Visitor arriving', 'Thank you!'];

function channelTitle(ch: Channel, me: User | undefined, users: User[]) {
  if (!me) return ch.title;
  if (me.role === 'resident') {
    if (ch.kind === 'direct')
      return displayName(
        users.find((u) => u.id !== me.id && ch.memberIds.includes(u.id)),
        me.id,
      );
    return ch.title;
  }
  const resident = users.find((u) => u.role === 'resident' && ch.memberIds.includes(u.id));
  return resident ? `${resident.name} · ${resident.unitId ?? ''}` : ch.title;
}

function ChannelIcon({ ch, me, users }: { ch: Channel; me?: User; users: User[] }) {
  if (me?.role === 'resident' && ch.kind === 'guardhouse')
    return (
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-charcoal-800 text-white">
        <ShieldCheck className="h-5 w-5" />
      </span>
    );
  if (me?.role === 'resident' && ch.kind === 'management')
    return (
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-tool-500 text-white">
        <Building2 className="h-5 w-5" />
      </span>
    );
  const other = users.find(
    (u) =>
      u.id !== me?.id && ch.memberIds.includes(u.id) && (me?.role === 'resident' || u.role === 'resident'),
  );
  return <Avatar user={other} size={44} />;
}

/** Chats with the guardhouse, management and neighbours. */
export function ChatPanel({ channelId, onClose }: { channelId?: string; onClose: () => void }) {
  const me = useCurrentUser();
  const users = useStore((s) => s.users);
  const channels = useStore((s) => s.channels);
  const messages = useStore((s) => s.messages);
  const openPanel = useStore((s) => s.openPanel);

  const mine = useMemo(() => {
    if (!me) return [];
    const relevant = channels.filter((c) => {
      if (c.memberIds.includes(me.id)) return true;
      // Staff see every channel of their kind.
      return (
        (me.role === 'guard' && c.kind === 'guardhouse') ||
        (me.role === 'management' && c.kind === 'management')
      );
    });
    const last = (c: Channel) => messages.filter((m) => m.channelId === c.id).at(-1)?.createdAt ?? '';
    return relevant.sort((a, b) => last(b).localeCompare(last(a)));
  }, [channels, messages, me]);

  const active = channelId ? channels.find((c) => c.id === channelId) : undefined;

  const openKind = async (kind: 'guardhouse' | 'management') => {
    if (!me) return;
    const ch = await api.openChannel(me.id, kind);
    openPanel({ kind: 'chat', channelId: ch.id });
  };

  if (active && me)
    return (
      <Thread
        ch={active}
        me={me}
        users={users}
        onBack={() => openPanel({ kind: 'chat' })}
        onClose={onClose}
      />
    );

  return (
    <div>
      <PanelHeader
        title="Messages"
        subtitle="Guardhouse, management and neighbours"
        onClose={onClose}
        icon="💬"
      />
      {me?.role === 'resident' && (
        <div className="grid grid-cols-2 gap-2 px-5 pt-4">
          <button type="button" className="btn-ghost" onClick={() => openKind('guardhouse')}>
            <ShieldCheck className="h-5 w-5" /> Guardhouse
          </button>
          <button type="button" className="btn-ghost" onClick={() => openKind('management')}>
            <Building2 className="h-5 w-5" /> Management
          </button>
        </div>
      )}
      <ul className="divide-y divide-gray-100 p-2">
        {mine.length === 0 && (
          <li className="p-8 text-center text-sm text-gray-500">No conversations yet 💬</li>
        )}
        {mine.map((c) => {
          const msgs = messages.filter((m) => m.channelId === c.id);
          const last = msgs.at(-1);
          const unread = me ? msgs.filter((m) => !m.readBy.includes(me.id)).length : 0;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => openPanel({ kind: 'chat', channelId: c.id })}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-gray-50"
              >
                <ChannelIcon ch={c} me={me} users={users} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{channelTitle(c, me, users)}</span>
                  <span className="block truncate text-sm text-gray-500">
                    {last ? last.text || '📷 Photo' : 'Say hello 👋'}
                  </span>
                </span>
                {unread > 0 && (
                  <span className="grid h-6 min-w-6 place-items-center rounded-full bg-sos-500 px-1.5 text-xs font-bold text-white">
                    {unread}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Thread({
  ch,
  me,
  users,
  onBack,
  onClose,
}: {
  ch: Channel;
  me: User;
  users: User[];
  onBack: () => void;
  onClose: () => void;
}) {
  const all = useStore((s) => s.messages);
  const msgs = useMemo(() => all.filter((m) => m.channelId === ch.id), [all, ch.id]);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
    if (msgs.some((m) => !m.readBy.includes(me.id))) void api.markRead(ch.id, me.id);
  }, [msgs, ch.id, me.id]);

  const send = (t: string, photo?: string) => {
    if (!t.trim() && !photo) return;
    void api.sendMessage(ch.id, me.id, t.trim(), photo);
    setText('');
  };
  const others = ch.memberIds.filter((id) => id !== me.id);

  return (
    <div className="flex h-[min(80vh,640px)] flex-col">
      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Back to conversations">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <ChannelIcon ch={ch} me={me} users={users} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-bold">{channelTitle(ch, me, users)}</p>
          <p className="text-xs text-gray-500">
            {ch.kind === 'direct'
              ? 'Neighbour'
              : ch.kind === 'guardhouse'
                ? 'Guardhouse EG18 · 24 hours'
                : 'Mon–Fri 8.30am–5.30pm'}
          </p>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      <div className="scroll-thin flex-1 space-y-2 overflow-y-auto bg-gray-50 p-3">
        {msgs.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500">Start the conversation 👋</p>
        )}
        {msgs.map((m) => {
          const mineMsg = m.authorId === me.id;
          const author = users.find((u) => u.id === m.authorId);
          const read = others.some((o) => m.readBy.includes(o));
          return (
            <div key={m.id} className={`flex gap-2 ${mineMsg ? 'justify-end' : 'justify-start'}`}>
              {!mineMsg && <Avatar user={author} size={28} />}
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mineMsg ? 'rounded-br-md bg-tool-500 text-white' : 'rounded-bl-md bg-white text-charcoal-800 ring-1 ring-black/5'}`}
              >
                {!mineMsg && (
                  <p className="text-[11px] font-bold text-gray-500">{displayName(author, me.id)}</p>
                )}
                {m.photoUrl && <img src={m.photoUrl} alt="Attached" className="mb-1 max-h-40 rounded-lg" />}
                {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
                <p
                  className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${mineMsg ? 'text-white/70' : 'text-gray-400'}`}
                >
                  {format(new Date(m.createdAt), 'h:mm a')}
                  {mineMsg &&
                    (read ? (
                      <CheckCheck className="h-3 w-3" aria-label="Read" />
                    ) : (
                      <Check className="h-3 w-3" aria-label="Sent" />
                    ))}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      {me.role === 'resident' && ch.kind !== 'direct' && (
        <div className="flex gap-1.5 overflow-x-auto px-3 pt-2">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              className="shrink-0 rounded-full bg-leaf-50 px-3 py-1.5 text-xs font-bold text-leaf-700"
            >
              {q}
            </button>
          ))}
        </div>
      )}
      <form
        className="flex items-center gap-2 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
      >
        <button
          type="button"
          className="icon-btn shrink-0 text-gray-500"
          onClick={() => fileRef.current?.click()}
          aria-label="Attach photo"
        >
          <Camera className="h-5 w-5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) send('', await fileToDataUrl(f, 480));
            e.target.value = '';
          }}
        />
        <input
          className="h-11 min-w-0 flex-1 rounded-xl bg-gray-100 px-3 text-sm outline-none focus:ring-2 focus:ring-tool-500/30"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          aria-label="Message"
        />
        <button
          type="submit"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-tool-500 text-white"
          aria-label="Send"
        >
          <SendHorizontal className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
