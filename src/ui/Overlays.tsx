import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  UserRoundPen,
  Building2,
  CheckCircle2,
  Home,
  LogOut,
  Phone,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  X,
} from 'lucide-react';
import type { PrivacySettings, Role } from '@/types';
import { api } from '@/services/api';
import { useCurrentUser, useStore } from '@/store';
import { EmergencyPanel } from '@/ui/hud/EmergencyPanel';
import { Minimap } from '@/ui/hud/Minimap';
import { Avatar } from '@/ui/Avatar';
import { getLayout } from '@/world/layout';

function Modal({
  open,
  onClose,
  label,
  children,
  sheetOnPhone = false,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  sheetOnPhone?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-50 flex justify-center bg-charcoal-900/40 backdrop-blur-[2px] ${
            sheetOnPhone ? 'items-end sm:items-center' : 'items-center p-4'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ y: 40, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className={`max-h-[92vh] w-full overflow-y-auto bg-white shadow-pop ${
              sheetOnPhone
                ? 'max-w-md rounded-t-3xl pb-[env(safe-area-inset-bottom)] sm:m-4 sm:rounded-3xl'
                : 'max-w-sm rounded-3xl'
            }`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** "Call Police (999)?" — every tel: link goes through this first. */
function ConfirmCallDialog() {
  const contact = useStore((s) => s.confirmCall);
  const close = () => useStore.getState().setConfirmCall(null);
  return (
    <Modal open={!!contact} onClose={close} label="Confirm call">
      {contact && (
        <div className="p-6 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-50 text-sos-500">
            <Phone className="h-8 w-8" />
          </span>
          <h2 className="mt-3 font-display text-2xl font-bold">
            Call {contact.shortName} ({contact.number})?
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            This opens your phone dialer.{contact.note ? ` ${contact.note}.` : ''}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button type="button" className="btn-ghost" onClick={close} autoFocus>
              Cancel
            </button>
            <a href={`tel:${contact.dial}`} className="btn-danger" onClick={() => setTimeout(close, 300)}>
              <Phone className="h-5 w-5" /> Call
            </a>
          </div>
        </div>
      )}
    </Modal>
  );
}

/** Alert guardhouse → creates a high-priority incident at the user's home. */
function ConfirmAlertDialog() {
  const open = useStore((s) => s.confirmAlert);
  const me = useCurrentUser();
  const toast = useStore((s) => s.toast);
  const [busy, setBusy] = useState(false);
  const close = () => useStore.getState().setConfirmAlert(false);
  const send = async () => {
    if (!me) return;
    setBusy(true);
    const home = me.unitId ? getLayout().unitMap.get(me.unitId) : undefined;
    await api.createIncident(me.id, {
      category: 'security',
      urgency: 'urgent',
      description: 'Resident pressed "Alert guardhouse".',
      photos: [],
      location: { x: home?.x ?? 0, z: home?.z ?? 0, unitId: me.unitId, precinctId: me.unitId?.split('-')[0] },
      isSOS: true,
    });
    setBusy(false);
    close();
    toast('Guardhouse alerted — a guard has been notified 🛡️', 'success');
  };
  return (
    <Modal open={open} onClose={close} label="Alert guardhouse">
      <div className="p-6 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-50 text-sos-500">
          <ShieldAlert className="h-8 w-8" />
        </span>
        <h2 className="mt-3 font-display text-2xl font-bold">Alert the guardhouse?</h2>
        <p className="mt-1 text-sm text-gray-500">
          An urgent alert with your home location ({me?.unitId}) is sent to the guards on duty.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" className="btn-ghost" onClick={close} autoFocus>
            Cancel
          </button>
          <button type="button" className="btn-danger" onClick={send} disabled={busy}>
            {busy ? 'Sending…' : 'Send alert'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function SosSheet() {
  const open = useStore((s) => s.sosOpen);
  const close = () => useStore.getState().setSosOpen(false);
  return (
    <Modal open={open} onClose={close} label="Emergency numbers" sheetOnPhone>
      <div className="relative p-3">
        <button
          type="button"
          onClick={close}
          className="icon-btn absolute right-4 top-4 z-10 h-9 w-9 text-white hover:bg-white/20"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <EmergencyPanel collapsible={false} />
      </div>
    </Modal>
  );
}

function MinimapSheet() {
  const open = useStore((s) => s.minimapOpen);
  const close = () => useStore.getState().setMinimapOpen(false);
  return (
    <Modal open={open} onClose={close} label="Minimap" sheetOnPhone>
      <div className="flex flex-col items-center gap-2 p-4">
        <div className="flex w-full items-center justify-between">
          <h2 className="font-display text-lg font-bold">Map</h2>
          <button type="button" onClick={close} className="icon-btn h-9 w-9" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <Minimap width={Math.min(280, window.innerWidth - 110)} />
        <p className="text-xs text-gray-500">Tap anywhere on the map to fly there.</p>
      </div>
    </Modal>
  );
}

const ROLES: { role: Role; label: string; icon: typeof Home }[] = [
  { role: 'resident', label: 'Resident', icon: Home },
  { role: 'guard', label: 'Guard', icon: ShieldCheck },
  { role: 'management', label: 'Management', icon: Building2 },
];

function SettingsPanel() {
  const open = useStore((s) => s.settingsOpen);
  const me = useCurrentUser();
  const toast = useStore((s) => s.toast);
  const [confirmReset, setConfirmReset] = useState(false);
  const close = () => {
    setConfirmReset(false);
    useStore.getState().setSettingsOpen(false);
  };
  return (
    <Modal open={open} onClose={close} label="Settings" sheetOnPhone>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Settings</h2>
          <button type="button" onClick={close} className="icon-btn h-9 w-9" aria-label="Close settings">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
          <Avatar user={me} size={48} />
          <div className="min-w-0">
            <p className="truncate font-bold">{me?.name}</p>
            <p className="truncate text-sm text-gray-500">{me?.unitId ?? me?.post}</p>
          </div>
        </div>

        <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-gray-500">Demo: switch role</h3>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {ROLES.map((r) => {
            const active = me?.role === r.role;
            return (
              <button
                key={r.role}
                type="button"
                onClick={async () => {
                  if (active) return;
                  close();
                  await api.loginAsDemo(r.role);
                }}
                aria-pressed={active}
                className={`flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl text-sm font-bold transition ${
                  active ? 'bg-tool-500 text-white shadow' : 'bg-gray-100 text-charcoal-700 hover:bg-gray-200'
                }`}
              >
                <r.icon className="h-5 w-5" />
                {r.label}
              </button>
            );
          })}
        </div>

        {me?.role === 'resident' && (
          <PrivacySettingsForm
            onEditAvatar={() => {
              close();
              useStore.getState().openPanel({ kind: 'avatar' });
            }}
          />
        )}

        <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-gray-500">Demo data</h3>
        {confirmReset ? (
          <div className="mt-2 rounded-xl bg-amber-50 p-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
              <TriangleAlert className="h-4 w-4" /> Reset all posts, reports and changes in every open tab?
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" className="btn-ghost" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={async () => {
                  await api.resetDemo();
                  setConfirmReset(false);
                  toast('Demo data reset', 'success');
                }}
              >
                Reset
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn-ghost mt-2 w-full" onClick={() => setConfirmReset(true)}>
            <RotateCcw className="h-4 w-4" /> Reset demo data
          </button>
        )}

        <button
          type="button"
          className="btn mt-3 w-full text-sos-600 hover:bg-red-50"
          onClick={async () => {
            close();
            await api.logout();
          }}
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </Modal>
  );
}

function Toggle({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-gray-50">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{label}</span>
        <span className="block text-xs text-gray-500">{hint}</span>
      </span>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={on}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="relative h-7 w-12 shrink-0 rounded-full bg-gray-300 transition peer-checked:bg-leaf-500 peer-focus-visible:ring-2 peer-focus-visible:ring-tool-500 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
    </label>
  );
}

function PrivacySettingsForm({ onEditAvatar }: { onEditAvatar: () => void }) {
  const me = useCurrentUser();
  if (!me) return null;
  const p = me.privacy;
  const save = (patch: Partial<PrivacySettings>) =>
    void api.updateUser(me.id, { privacy: { ...p, ...patch } });
  return (
    <>
      <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-gray-500">Avatar</h3>
      <button type="button" className="btn-ghost mt-2 w-full" onClick={onEditAvatar}>
        <UserRoundPen className="h-4 w-4" /> Edit my avatar
      </button>
      <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-gray-500">Privacy</h3>
      <div className="mt-2">
        <p className="px-2 text-sm font-bold">Display name</p>
        <div className="mt-1 grid grid-cols-3 gap-1.5 px-2">
          {(
            [
              ['full', 'Full name'],
              ['first', 'First name'],
              ['initials', 'Initials'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={p.displayName === id}
              onClick={() => save({ displayName: id })}
              className={`min-h-[40px] rounded-xl text-xs font-bold ${p.displayName === id ? 'bg-tool-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <Toggle
          label="Show my unit ID"
          hint="Neighbours see e.g. EG18-028 next to your name"
          on={p.showUnitId}
          onChange={(v) => save({ showUnitId: v })}
        />
        <Toggle
          label="Show my avatar on the map"
          hint="Off: your house shows a neutral icon"
          on={p.showAvatarOnMap}
          onChange={(v) => save({ showAvatarOnMap: v })}
        />
        <Toggle
          label="Allow neighbour messages"
          hint="Guardhouse and management can always reach you"
          on={p.allowNeighbourDMs}
          onChange={(v) => save({ allowNeighbourDMs: v })}
        />
        <p className="px-2 pt-1 text-[11px] text-gray-400">
          Your phone number and email are never shown to other residents.
        </p>
      </div>
    </>
  );
}

function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[calc(max(env(safe-area-inset-top),8px)+64px)] z-[60] flex flex-col items-center gap-2 px-4 lg:top-[100px]"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            type="button"
            layout
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            onClick={() => dismiss(t.id)}
            className={`pointer-events-auto flex max-w-md items-center gap-2 rounded-2xl px-4 py-2.5 text-left text-sm font-semibold shadow-pop ${
              t.tone === 'success'
                ? 'bg-leaf-600 text-white'
                : t.tone === 'warn'
                  ? 'bg-amber-400 text-charcoal-900'
                  : 'bg-charcoal-800 text-white'
            }`}
          >
            {t.tone === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0" />}
            {t.text}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function Overlays() {
  return (
    <>
      <Toasts />
      <ConfirmCallDialog />
      <ConfirmAlertDialog />
      <SosSheet />
      <MinimapSheet />
      <SettingsPanel />
    </>
  );
}
