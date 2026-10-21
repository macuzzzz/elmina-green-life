import { useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { Check, Plus, X } from 'lucide-react';
import type { Poll } from '@/types';
import { PRECINCTS } from '@/data/township';
import { api } from '@/services/api';
import { useCurrentUser, useStore } from '@/store';
import { Field, PanelHeader, inputCls } from '@/ui/Modal';
import { chipCls } from './meta';
import { Empty, Segmented } from './ui';

const isOpen = (p: Poll) => new Date(p.closesAt).getTime() > Date.now();

/** Quick community polls. Management asks; residents in the targeted precincts vote. */
export function PollsPanel({ onClose }: { onClose: () => void }) {
  const me = useCurrentUser();
  const polls = useStore((s) => s.polls);
  const [tab, setTab] = useState<'open' | 'closed'>('open');
  const [creating, setCreating] = useState(false);
  if (!me) return null;
  const manager = me.role === 'management';
  const precinct = me.unitId?.split('-')[0] ?? '';
  const visible = polls.filter(
    (p) => me.role !== 'resident' || p.targetPrecincts.length === 0 || p.targetPrecincts.includes(precinct),
  );
  const open = visible.filter(isOpen);
  const list = tab === 'open' ? open : visible.filter((p) => !isOpen(p));

  return (
    <div>
      <PanelHeader
        title="Polls"
        subtitle={`${open.length} open · have your say`}
        onClose={onClose}
        icon="📊"
      />
      <div className="space-y-4 p-5">
        {manager &&
          (creating ? (
            <NewPollForm onDone={() => setCreating(false)} />
          ) : (
            <button type="button" className="btn-primary w-full" onClick={() => setCreating(true)}>
              <Plus className="h-5 w-5" /> New poll
            </button>
          ))}
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { id: 'open', label: `Open (${open.length})` },
            { id: 'closed', label: 'Results' },
          ]}
        />
        {list.length === 0 ? (
          <Empty icon="🗳️">{tab === 'open' ? 'No open polls right now.' : 'No closed polls yet.'}</Empty>
        ) : (
          <ul className="space-y-3">
            {list.map((p) => (
              <PollCard key={p.id} poll={p} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PollCard({ poll: p }: { poll: Poll }) {
  const me = useCurrentUser();
  if (!me) return null;
  const open = isOpen(p);
  const total = p.options.reduce((a, o) => a + o.votes.length, 0);
  const myVote = p.options.find((o) => o.votes.includes(me.id))?.id;
  const canVote = open && me.role === 'resident';
  const showResults = !canVote || !!myVote;
  const top = Math.max(...p.options.map((o) => o.votes.length));

  return (
    <li className="rounded-2xl bg-white p-3 ring-1 ring-black/5">
      <p className="font-bold leading-snug">{p.question}</p>
      <p className="mb-2 text-xs text-gray-500">
        {p.targetPrecincts.length ? p.targetPrecincts.join(', ') : 'All precincts'} · {total} vote
        {total === 1 ? '' : 's'} · {open ? 'closes' : 'closed'}{' '}
        {formatDistanceToNowStrict(new Date(p.closesAt), { addSuffix: true })}
      </p>
      <ul className="space-y-1.5">
        {p.options.map((o) => {
          const pct = total ? Math.round((o.votes.length / total) * 100) : 0;
          const mine = myVote === o.id;
          const winner = !open && total > 0 && o.votes.length === top;
          return (
            <li key={o.id}>
              <button
                type="button"
                disabled={!canVote}
                onClick={() => void api.votePoll(p.id, o.id, me.id)}
                aria-pressed={mine}
                className={`relative flex min-h-[40px] w-full items-center overflow-hidden rounded-xl px-3 text-left text-sm ring-1 transition ${
                  mine ? 'ring-2 ring-tool-500' : 'ring-black/10'
                } ${canVote ? 'hover:bg-gray-50' : ''}`}
              >
                {showResults && (
                  <span
                    className={`absolute inset-y-0 left-0 ${winner ? 'bg-leaf-100' : mine ? 'bg-tool-500/15' : 'bg-gray-100'}`}
                    style={{ width: `${pct}%` }}
                    aria-hidden
                  />
                )}
                <span className="relative flex flex-1 items-center gap-1.5 font-semibold">
                  {mine && <Check className="h-4 w-4 text-tool-600" />}
                  {o.label}
                  {winner && ' 🏆'}
                </span>
                {showResults && <span className="relative text-xs font-bold text-gray-600">{pct}%</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {canVote && myVote && (
        <p className="mt-1.5 text-[11px] text-gray-400">Tap another option to change your vote.</p>
      )}
      {open && me.role === 'management' && (
        <button
          type="button"
          className="mt-2 text-xs font-bold text-sos-600"
          onClick={() => void api.closePoll(p.id)}
        >
          Close poll now
        </button>
      )}
    </li>
  );
}

const DURATIONS = [
  { days: 1, label: '1 day' },
  { days: 3, label: '3 days' },
  { days: 7, label: '1 week' },
  { days: 14, label: '2 weeks' },
];

function NewPollForm({ onDone }: { onDone: () => void }) {
  const me = useCurrentUser();
  const toast = useStore((s) => s.toast);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [targets, setTargets] = useState<string[]>([]);
  const [days, setDays] = useState(3);
  const clean = options.map((o) => o.trim()).filter(Boolean);
  const ok = question.trim() && clean.length >= 2;
  const publish = async () => {
    if (!me || !ok) return;
    await api.createPoll(me.id, {
      question: question.trim(),
      options: clean,
      targetPrecincts: targets,
      closesAt: new Date(Date.now() + days * 86_400_000).toISOString(),
    });
    toast('Poll published 📊 — residents notified', 'success');
    onDone();
  };
  return (
    <div className="space-y-3 rounded-2xl bg-leaf-50 p-3">
      <Field label="Question">
        <input
          className={inputCls}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={100}
          placeholder="e.g. Should we repaint the playground?"
        />
      </Field>
      <Field label="Options">
        <div className="space-y-1.5">
          {options.map((o, i) => (
            <div key={i} className="flex gap-1.5">
              <input
                className={inputCls}
                value={o}
                onChange={(e) => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))}
                maxLength={40}
                placeholder={`Option ${i + 1}`}
                aria-label={`Option ${i + 1}`}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  className="icon-btn h-10 w-10 shrink-0"
                  aria-label={`Remove option ${i + 1}`}
                  onClick={() => setOptions(options.filter((_, j) => j !== i))}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {options.length < 5 && (
            <button
              type="button"
              className="text-xs font-bold text-tool-600"
              onClick={() => setOptions([...options, ''])}
            >
              + Add option
            </button>
          )}
        </div>
      </Field>
      <Field label="Who can vote">
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className={chipCls(targets.length === 0)} onClick={() => setTargets([])}>
            All precincts
          </button>
          {PRECINCTS.filter((p) => p.kind === 'DSLH' || p.kind === 'DSSD' || p.kind === 'RSKU').map((p) => {
            const on = targets.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                className={chipCls(on)}
                onClick={() => setTargets(on ? targets.filter((t) => t !== p.id) : [...targets, p.id])}
              >
                {p.id}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Open for">
        <div className="flex flex-wrap gap-1.5">
          {DURATIONS.map((d) => (
            <button
              key={d.days}
              type="button"
              className={chipCls(days === d.days)}
              onClick={() => setDays(d.days)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn-ghost" onClick={onDone}>
          Cancel
        </button>
        <button type="button" className="btn-primary" disabled={!ok} onClick={publish}>
          Publish
        </button>
      </div>
    </div>
  );
}
