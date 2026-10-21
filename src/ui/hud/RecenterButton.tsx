import { motion } from 'framer-motion';
import { useStore } from '@/store';
import { recenter } from '@/world/recenter';

/**
 * Round dark-grey crosshair button with a white arrow (reference/06).
 * Glows subtly when the camera is already centred on home.
 */
export function RecenterButton({ size = 44 }: { size?: number }) {
  const atHome = useStore((s) => s.atHome);
  const role = useStore((s) => s.session?.role);
  return (
    <motion.button
      type="button"
      onClick={recenter}
      whileTap={{ scale: 0.88 }}
      className={`relative grid shrink-0 place-items-center rounded-full shadow-lg transition ${
        atHome ? 'ring-4 ring-tool-500/40' : ''
      }`}
      style={{ width: size, height: size, background: atHome ? '#2b5fb8' : '#4a4d53' }}
      aria-label={role === 'resident' ? 'Recenter on my home (H)' : 'Recenter on my post (H)'}
      aria-pressed={atHome}
      title="Recenter (H)"
    >
      <svg viewBox="0 0 40 40" width={size * 0.82} height={size * 0.82} aria-hidden>
        <circle cx="20" cy="20" r="12.5" fill="none" stroke="#d6d9dd" strokeWidth="2.6" />
        <path
          d="M20 3.5v6M20 30.5v6M3.5 20h6M30.5 20h6"
          stroke="#d6d9dd"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path d="M20 12.5 L26 26 L20 22.8 L14 26 Z" fill="#ffffff" strokeLinejoin="round" />
      </svg>
    </motion.button>
  );
}
