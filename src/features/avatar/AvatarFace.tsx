import { memo } from 'react';
import type { AvatarConfig } from '@/types';

/**
 * Bitmoji-style avatar drawn from layered SVG parts (viewBox 100×100).
 * Layers back → front: shoulders, back hair/tudung, neck, ears, head, face,
 * front hair, facial hair, glasses, headwear.
 */
function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt)));
  const r = c((n >> 16) & 255);
  const g = c((n >> 8) & 255);
  const b = c(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const INK = '#2b2118';

function Head({ a }: { a: AvatarConfig }) {
  if (a.faceShape === 'square')
    return <rect x={28} y={20} width={44} height={50} rx={14} fill={a.skinTone} />;
  if (a.faceShape === 'round') return <ellipse cx={50} cy={45} rx={23} ry={24} fill={a.skinTone} />;
  return <ellipse cx={50} cy={45} rx={22} ry={26} fill={a.skinTone} />;
}

function BackHair({ a }: { a: AvatarConfig }) {
  if (a.headwear.startsWith('tudung')) return null;
  if (a.hairStyle === 'long')
    return (
      <path d="M24 40 Q24 14 50 14 Q76 14 76 40 L80 78 Q66 84 50 82 Q34 84 20 78 Z" fill={a.hairColor} />
    );
  if (a.hairStyle === 'bun') return <circle cx={50} cy={13} r={9} fill={a.hairColor} />;
  return null;
}

function FrontHair({ a }: { a: AvatarConfig }) {
  if (a.headwear.startsWith('tudung') || a.hairStyle === 'bald') return null;
  const c = a.hairColor;
  switch (a.hairStyle) {
    case 'short':
      return <path d="M27 40 Q26 17 50 17 Q74 17 73 40 Q66 28 50 28 Q34 28 27 40 Z" fill={c} />;
    case 'side':
      return <path d="M27 42 Q24 16 52 16 Q76 18 74 40 Q70 30 60 27 Q46 36 30 34 Z" fill={c} />;
    case 'curly':
      return (
        <g fill={c}>
          {[30, 38, 46, 54, 62, 70].map((x, i) => (
            <circle key={x} cx={x} cy={i % 2 ? 22 : 26} r={8} />
          ))}
          <circle cx={27} cy={34} r={6} />
          <circle cx={73} cy={34} r={6} />
        </g>
      );
    case 'long':
    case 'bun':
      return <path d="M27 42 Q26 18 50 18 Q74 18 73 42 Q68 30 56 28 Q50 34 44 28 Q32 30 27 42 Z" fill={c} />;
    case 'spiky':
      return (
        <path
          d="M27 38 L30 20 L37 27 L42 15 L48 25 L54 13 L58 25 L65 16 L67 27 L72 22 L73 38 Q60 28 50 29 Q38 28 27 38 Z"
          fill={c}
        />
      );
    default:
      return null;
  }
}

function Eyes({ a }: { a: AvatarConfig }) {
  const wink = a.expression === 'wink';
  const left = wink ? (
    <path d="M37 47 Q41 44 45 47" stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round" />
  ) : null;
  if (a.eyes === 'happy')
    return (
      <g stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round">
        {left ?? <path d="M37 48 Q41 43 45 48" />}
        <path d="M55 48 Q59 43 63 48" />
      </g>
    );
  if (a.eyes === 'wide')
    return (
      <g>
        {left ?? (
          <>
            <circle cx={41} cy={47} r={4.4} fill="#fff" />
            <circle cx={41.6} cy={47.4} r={2.4} fill={INK} />
          </>
        )}
        <circle cx={59} cy={47} r={4.4} fill="#fff" />
        <circle cx={59.6} cy={47.4} r={2.4} fill={INK} />
      </g>
    );
  return (
    <g fill={INK}>
      {left ?? <circle cx={41} cy={47} r={2.8} />}
      <circle cx={59} cy={47} r={2.8} />
    </g>
  );
}

function Brows({ a }: { a: AvatarConfig }) {
  const col = a.headwear.startsWith('tudung') ? '#3b2a1e' : shade(a.hairColor, -10);
  const d =
    a.eyebrows === 'raised'
      ? ['M36 39 Q41 35 46 38', 'M54 38 Q59 35 64 39']
      : a.eyebrows === 'straight'
        ? ['M36 40 L46 39', 'M54 39 L64 40']
        : ['M36 40 Q41 38 46 40', 'M54 40 Q59 38 64 40'];
  return (
    <g stroke={col} strokeWidth={2.6} strokeLinecap="round" fill="none">
      <path d={d[0]} />
      <path d={d[1]} />
    </g>
  );
}

function Mouth({ a }: { a: AvatarConfig }) {
  switch (a.mouth) {
    case 'grin':
      return (
        <path d="M41 57 Q50 67 59 57 Z" fill="#fff" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      );
    case 'flat':
      return <path d="M44 59 L56 59" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />;
    case 'open':
      return <ellipse cx={50} cy={59} rx={4.5} ry={3.6} fill="#7a2e2e" />;
    default:
      return (
        <path d="M42 57 Q50 64 58 57" stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      );
  }
}

function FacialHair({ a }: { a: AvatarConfig }) {
  const c = a.hairColor;
  if (a.facialHair === 'moustache')
    return <path d="M42 55 Q50 50 58 55 Q50 53 42 55 Z" fill={c} stroke={c} strokeWidth={2} />;
  if (a.facialHair === 'beard')
    return <path d="M28 48 Q30 74 50 74 Q70 74 72 48 Q66 64 50 63 Q34 64 28 48 Z" fill={c} />;
  if (a.facialHair === 'stubble')
    return <path d="M30 52 Q32 72 50 72 Q68 72 70 52 Q64 66 50 65 Q36 66 30 52 Z" fill={c} opacity={0.3} />;
  return null;
}

function Glasses({ a }: { a: AvatarConfig }) {
  if (a.glasses === 'none') return null;
  const common = { fill: 'rgba(255,255,255,0.18)', stroke: '#1f2937', strokeWidth: 2.2 };
  return (
    <g>
      {a.glasses === 'round' ? (
        <>
          <circle cx={41} cy={47} r={7} {...common} />
          <circle cx={59} cy={47} r={7} {...common} />
        </>
      ) : (
        <>
          <rect x={33} y={41} width={15} height={12} rx={3} {...common} />
          <rect x={52} y={41} width={15} height={12} rx={3} {...common} />
        </>
      )}
      <path d="M48 46 L52 46" stroke="#1f2937" strokeWidth={2.2} />
    </g>
  );
}

function Tudung({ a, front }: { a: AvatarConfig; front: boolean }) {
  const c = a.headwearColor;
  if (!front) {
    // Drape behind the face, over the shoulders.
    return a.headwear === 'tudung' ? (
      <path d="M50 14 Q80 14 79 46 Q80 70 92 100 L8 100 Q20 70 21 46 Q20 14 50 14 Z" fill={c} />
    ) : (
      <path d="M50 14 Q80 14 79 46 Q78 66 70 80 L30 80 Q22 66 21 46 Q20 14 50 14 Z" fill={c} />
    );
  }
  // Frame around the face.
  return (
    <g>
      <path
        d="M50 15 Q78 15 78 46 Q78 72 50 76 Q22 72 22 46 Q22 15 50 15 Z M50 22 Q30 22 29 45 Q29 68 50 70 Q71 68 71 45 Q70 22 50 22 Z"
        fill={c}
        fillRule="evenodd"
      />
      <path d="M30 30 Q50 18 70 30" stroke={shade(c, -30)} strokeWidth={1.6} fill="none" opacity={0.6} />
      {a.headwear === 'tudung-wrap' && <circle cx={72} cy={58} r={2.4} fill="#facc15" />}
    </g>
  );
}

function Headwear({ a }: { a: AvatarConfig }) {
  if (a.headwear === 'songkok')
    return (
      <g>
        <path
          d="M30 26 L33 12 Q50 9 67 12 L70 26 Q50 22 30 26 Z"
          fill={a.headwearColor === '#e7e5e4' ? '#1f2937' : a.headwearColor}
        />
        <path d="M31 22 Q50 18 69 22" stroke="#00000033" strokeWidth={1.4} fill="none" />
      </g>
    );
  if (a.headwear === 'cap')
    return (
      <g>
        <path d="M27 32 Q27 12 50 12 Q73 12 73 32 Z" fill={a.headwearColor} />
        <path d="M50 30 Q78 28 86 34 Q72 36 50 34 Z" fill={shade(a.headwearColor, -35)} />
        <circle cx={50} cy={13} r={2} fill={shade(a.headwearColor, -35)} />
      </g>
    );
  return null;
}

export const AvatarFace = memo(function AvatarFace({
  avatar,
  size = 48,
  className,
  title,
}: {
  avatar: AvatarConfig;
  size?: number;
  className?: string;
  title?: string;
}) {
  const a = avatar;
  const covered = a.headwear.startsWith('tudung');
  const happy = a.expression === 'happy';
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title ?? 'Avatar'}
    >
      <path d="M14 100 Q16 78 50 76 Q84 78 86 100 Z" fill={a.topColor} />
      <path d="M40 80 L50 90 L60 80" stroke={shade(a.topColor, -30)} strokeWidth={2} fill="none" />
      {covered && <Tudung a={a} front={false} />}
      <BackHair a={a} />
      <rect x={43} y={60} width={14} height={18} rx={5} fill={shade(a.skinTone, -18)} />
      {!covered && (
        <>
          <circle cx={27.5} cy={47} r={5} fill={shade(a.skinTone, -10)} />
          <circle cx={72.5} cy={47} r={5} fill={shade(a.skinTone, -10)} />
        </>
      )}
      <Head a={a} />
      {happy && (
        <>
          <ellipse cx={35} cy={55} rx={4} ry={2.4} fill="#f472b6" opacity={0.35} />
          <ellipse cx={65} cy={55} rx={4} ry={2.4} fill="#f472b6" opacity={0.35} />
        </>
      )}
      <Brows a={a} />
      <Eyes a={a} />
      <path
        d="M49 50 Q47 54 50 55"
        stroke={shade(a.skinTone, -45)}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
      <FacialHair a={a} />
      <Mouth a={a} />
      <FrontHair a={a} />
      {covered && <Tudung a={a} front />}
      <Glasses a={a} />
      <Headwear a={a} />
    </svg>
  );
});
