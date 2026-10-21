import type { AvatarConfig } from '@/types';
import { hashString, mulberry32 } from '@/world/coords';

/** Option lists for each avatar layer. All artwork is original, drawn in AvatarFace. */
export const AVATAR_OPTIONS = {
  faceShape: ['oval', 'round', 'square'],
  skinTone: ['#f9d9bd', '#f1c29e', '#e2a87f', '#c98b5e', '#a86b43', '#7d4b2c', '#57331e'],
  eyes: ['dot', 'wide', 'happy'],
  eyebrows: ['soft', 'straight', 'raised'],
  mouth: ['smile', 'grin', 'flat', 'open'],
  hairStyle: ['short', 'side', 'curly', 'long', 'bun', 'spiky', 'bald'],
  hairColor: ['#1b1b1f', '#3b2a1e', '#6b4423', '#a0522d', '#d4a15a', '#8a8a8a'],
  facialHair: ['none', 'moustache', 'beard', 'stubble'],
  glasses: ['none', 'round', 'square'],
  headwear: ['none', 'tudung', 'tudung-wrap', 'songkok', 'cap'],
  headwearColor: ['#2fa452', '#e25d8a', '#3b82f6', '#7c3aed', '#1f2937', '#f59e0b', '#e7e5e4', '#b91c1c'],
  topColor: ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#1f2937', '#f3f4f6'],
  expression: ['happy', 'calm', 'wink'],
} as const satisfies Record<keyof AvatarConfig, readonly string[]>;

export const AVATAR_LABELS: Record<keyof AvatarConfig, string> = {
  faceShape: 'Face',
  skinTone: 'Skin tone',
  eyes: 'Eyes',
  eyebrows: 'Eyebrows',
  mouth: 'Mouth',
  hairStyle: 'Hair',
  hairColor: 'Hair colour',
  facialHair: 'Facial hair',
  glasses: 'Glasses',
  headwear: 'Headwear',
  headwearColor: 'Headwear colour',
  topColor: 'Top',
  expression: 'Expression',
};

/** Deterministic random avatar (same seed → same face). */
export function randomAvatar(seed: string | number = Math.random()): AvatarConfig {
  const rng = mulberry32(typeof seed === 'number' ? Math.floor(seed * 1e9) : hashString(seed));
  const pick = <K extends keyof AvatarConfig>(k: K) => {
    const list = AVATAR_OPTIONS[k];
    return list[Math.floor(rng() * list.length)] as string;
  };
  const headwear =
    rng() < 0.3
      ? rng() < 0.7
        ? 'tudung'
        : 'tudung-wrap'
      : rng() < 0.15
        ? 'songkok'
        : rng() < 0.15
          ? 'cap'
          : 'none';
  const covered = headwear.startsWith('tudung');
  return {
    faceShape: pick('faceShape'),
    skinTone: pick('skinTone'),
    eyes: pick('eyes'),
    eyebrows: pick('eyebrows'),
    mouth: pick('mouth'),
    hairStyle: covered ? 'short' : pick('hairStyle'),
    hairColor: pick('hairColor'),
    facialHair: covered || rng() < 0.7 ? 'none' : pick('facialHair'),
    glasses: rng() < 0.7 ? 'none' : pick('glasses'),
    headwear,
    headwearColor: pick('headwearColor'),
    topColor: pick('topColor'),
    expression: pick('expression'),
  };
}
