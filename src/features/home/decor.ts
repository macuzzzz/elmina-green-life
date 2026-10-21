import type { Decor, FestiveDecor, GardenItem } from '@/types';

export const FESTIVE: Record<FestiveDecor, { label: string; icon: string }> = {
  raya: { label: 'Hari Raya pelita lights', icon: '🪔' },
  cny: { label: 'Chinese New Year lanterns', icon: '🏮' },
  deepavali: { label: 'Deepavali kolam & lamps', icon: '🌺' },
  christmas: { label: 'Christmas lights', icon: '🎄' },
};

export const GARDEN: Record<GardenItem, { label: string; icon: string }> = {
  plants: { label: 'Potted plants', icon: '🪴' },
  frangipani: { label: 'Frangipani tree', icon: '🌸' },
  swing: { label: 'Swing', icon: '🪁' },
  bbq: { label: 'BBQ grill', icon: '🍢' },
  bicycle: { label: 'Bicycle', icon: '🚲' },
};

export const GATE_COLORS = ['#25282d', '#f5f5f4', '#7c4a2d', '#1d6a35', '#1e3a8a', '#b91c1c'];
export const DECOR_CAR_COLORS = ['#e8e8e8', '#1f2937', '#b91c1c', '#2563eb', '#0f766e', '#ca8a04', '#9333ea'];

export const DEFAULT_DECOR: Decor = { gateColor: '#25282d', carColor: null, garden: [], festive: null };
