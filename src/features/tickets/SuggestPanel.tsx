import { useState } from 'react';
import { Send } from 'lucide-react';
import type { MapLocation, SuggestionItem } from '@/types';
import { api } from '@/services/api';
import { useCurrentUser, useStore } from '@/store';
import { Field, PanelHeader, inputCls } from '@/ui/Modal';
import { suggestionMeta } from './meta';

/** Final step of Suggest: the ghost item is pinned, add a reason and send. */
export function SuggestPanel({
  location,
  item,
  onClose,
}: {
  location: MapLocation;
  item: SuggestionItem;
  onClose: () => void;
}) {
  const me = useCurrentUser();
  const toast = useStore((s) => s.toast);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const m = suggestionMeta(item);

  const submit = async () => {
    if (!me || !reason.trim()) return;
    setBusy(true);
    const s = await api.createSuggestion(me.id, { item, reason: reason.trim(), location });
    setBusy(false);
    onClose();
    useStore.getState().select({ kind: 'suggestion', id: s.id });
    toast('Suggestion sent to management 💡 Neighbours can now upvote it', 'success');
  };

  return (
    <div>
      <PanelHeader
        title={`Suggest: ${m.label}`}
        subtitle={`In ${location.precinctId ?? 'Elmina Green'}`}
        onClose={onClose}
        icon={m.icon}
      />
      <div className="space-y-4 p-5">
        <Field label="Why here?">
          <textarea
            className={`${inputCls} min-h-[80px]`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Parents need shade while kids play"
            maxLength={200}
            autoFocus
          />
        </Field>
        <button
          type="button"
          className="btn-primary w-full"
          disabled={!reason.trim() || busy}
          onClick={submit}
        >
          <Send className="h-5 w-5" /> {busy ? 'Sending…' : 'Send suggestion'}
        </button>
      </div>
    </div>
  );
}
