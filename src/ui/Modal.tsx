import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

/** Dialog: centred on desktop, bottom sheet on phones (when `sheetOnPhone`). */
export function Modal({
  open,
  onClose,
  label,
  children,
  sheetOnPhone = true,
  size = 'sm',
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  sheetOnPhone?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  const width = size === 'lg' ? 'max-w-2xl' : size === 'md' ? 'max-w-lg' : 'max-w-sm';
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-50 flex justify-center bg-charcoal-900/40 ${
            sheetOnPhone ? 'items-end sm:items-center sm:p-4' : 'items-center p-4'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
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
            className={`scroll-thin max-h-[92vh] w-full overflow-y-auto bg-white shadow-pop ${width} ${
              sheetOnPhone ? 'rounded-t-3xl pb-[env(safe-area-inset-bottom)] sm:rounded-3xl' : 'rounded-3xl'
            }`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PanelHeader({
  title,
  subtitle,
  onClose,
  icon,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  icon?: ReactNode;
}) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white px-5 py-3">
      {icon && (
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-leaf-50 text-xl">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-display text-xl font-bold leading-tight">{title}</h2>
        {subtitle && <p className="truncate text-sm text-gray-500">{subtitle}</p>}
      </div>
      <button type="button" onClick={onClose} className="icon-btn h-10 w-10" aria-label="Close">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

/** Small labelled form section. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
      {children}
    </div>
  );
}

export const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-leaf-500 focus:ring-2 focus:ring-leaf-100';
