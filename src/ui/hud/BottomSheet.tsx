import { useEffect, useState, type ReactNode } from 'react';
import { motion, useAnimationControls, type PanInfo } from 'framer-motion';

export type SheetSnap = 'peek' | 'half' | 'full';

/**
 * Draggable phone bottom sheet with three snap points.
 * `bottomOffset` leaves room for the tab bar underneath.
 */
export function BottomSheet({
  children,
  bottomOffset = 0,
  peek = 132,
  label,
  onSnap,
  openNonce = 0,
}: {
  children: ReactNode;
  bottomOffset?: number;
  peek?: number;
  label: string;
  onSnap?: (s: SheetSnap) => void;
  /** Bump to pop the sheet open to half height (e.g. Community tool, bubble tap). */
  openNonce?: number;
}) {
  const [vh, setVh] = useState(() => window.innerHeight);
  const [snap, setSnap] = useState<SheetSnap>('peek');
  const controls = useAnimationControls();
  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (openNonce) setSnap((s) => (s === 'peek' ? 'half' : s));
  }, [openNonce]);

  const full = vh - bottomOffset - 64;
  const heights: Record<SheetSnap, number> = { peek, half: Math.round(vh * 0.5), full };
  const sheetH = full;
  const yFor = (s: SheetSnap) => sheetH - heights[s];

  useEffect(() => {
    void controls.start({ y: yFor(snap), transition: { type: 'spring', stiffness: 320, damping: 34 } });
    onSnap?.(snap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, sheetH]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const currentY = yFor(snap) + info.offset.y;
    const projected = currentY + info.velocity.y * 0.2;
    const order: SheetSnap[] = ['full', 'half', 'peek'];
    let best: SheetSnap = snap;
    let bestD = Infinity;
    for (const s of order) {
      const d = Math.abs(yFor(s) - projected);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    if (best === snap) void controls.start({ y: yFor(snap) });
    setSnap(best);
  };

  const cycle = () => setSnap((s) => (s === 'peek' ? 'half' : s === 'half' ? 'full' : 'peek'));

  return (
    <motion.section
      className="absolute inset-x-0 z-20 flex flex-col overflow-hidden rounded-t-3xl bg-white/95 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] backdrop-blur"
      style={{ bottom: bottomOffset, height: sheetH }}
      initial={{ y: yFor('peek') }}
      animate={controls}
      aria-label={label}
    >
      <motion.div
        className="flex h-7 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
        onPan={(_, info) =>
          void controls.set({ y: Math.max(0, Math.min(yFor('peek'), yFor(snap) + info.offset.y)) })
        }
        onPanEnd={onDragEnd}
      >
        <button
          type="button"
          onClick={cycle}
          className="h-1.5 w-12 rounded-full bg-gray-300"
          aria-label={`${label}: ${snap === 'full' ? 'collapse' : 'expand'}`}
        />
      </motion.div>
      <div className="flex min-h-0 flex-1 flex-col" style={{ paddingBottom: sheetH - heights[snap] }}>
        {children}
      </div>
    </motion.section>
  );
}
