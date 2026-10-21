import type { Precinct } from '@/types';

/**
 * Elmina Green township layout, traced from reference/02-elmina-green-map.png.
 *
 * Every coordinate is normalised map space: (0,0) = top-left of the map image,
 * (1,1) = bottom-right. `world/coords.ts` converts to world metres. Adjust a
 * precinct by editing its rects/label here — nothing else is hard-coded.
 */

export type NPoint = [number, number];
export type NRect = [number, number, number, number];

/** Source image is 477 x 643 px. */
export const MAP_ASPECT = 643 / 477;

export const PRECINCTS: Precinct[] = [
  // ── North of Persiaran Casuarina ─────────────────────────────
  {
    id: 'EG1',
    kind: 'DSLH',
    typeLabel: 'DSLH 20×70',
    lot: { width: 20, depth: 70 },
    rects: [
      [0.095, 0.155, 0.205, 0.365],
      [0.205, 0.225, 0.3, 0.365],
    ],
    label: [0.17, 0.25],
    facilities: ['Lakeside jogging track', 'Pocket park'],
  },
  {
    id: 'EG2',
    kind: 'RSKU',
    typeLabel: 'RSKU',
    units: 562,
    rects: [[0.3, 0.285, 0.36, 0.365]],
    label: [0.335, 0.31],
    facilities: ['Surface car park', 'Kindergarten nearby', 'Primary school nearby'],
  },
  {
    id: 'EG10',
    kind: 'RSKU',
    typeLabel: 'RSKU',
    units: 1163,
    rects: [[0.385, 0.285, 0.47, 0.365]],
    label: [0.44, 0.31],
    facilities: ['Surface car park', 'Secondary school nearby'],
  },
  {
    id: 'EG11',
    kind: 'RSKU',
    typeLabel: 'RSKU',
    units: 1066,
    rects: [[0.47, 0.33, 0.555, 0.39]],
    label: [0.51, 0.36],
    facilities: ['Surface car park', 'Playground'],
  },
  {
    id: 'EG12',
    kind: 'RSKU',
    typeLabel: 'RSKU',
    units: 522,
    rects: [[0.56, 0.37, 0.635, 0.425]],
    label: [0.595, 0.395],
    facilities: ['Surface car park'],
  },
  {
    id: 'EG13',
    kind: 'RSKU',
    typeLabel: 'RSKU',
    units: 1063,
    rects: [[0.64, 0.37, 0.735, 0.445]],
    label: [0.69, 0.4],
    facilities: ['Surface car park', 'Multipurpose hall'],
  },
  {
    id: 'EG24',
    kind: 'RSKU',
    typeLabel: 'RSKU',
    units: 583,
    rects: [[0.745, 0.27, 0.815, 0.33]],
    label: [0.78, 0.29],
    facilities: ['Surface car park', 'Islamic school nearby'],
  },
  {
    id: 'EG25',
    kind: 'RSKU',
    typeLabel: 'RSKU',
    units: 545,
    rects: [[0.85, 0.255, 0.925, 0.335]],
    label: [0.88, 0.3],
    facilities: ['Surface car park', 'Primary school nearby'],
  },
  {
    id: 'EG26',
    kind: 'RSKU',
    typeLabel: 'RSKU',
    units: 1567,
    rects: [[0.765, 0.41, 0.915, 0.48]],
    label: [0.82, 0.44],
    facilities: ['Surface car park', 'Futsal court'],
  },

  // ── West ─────────────────────────────────────────────────────
  {
    id: 'EG3',
    kind: 'DSLH',
    typeLabel: 'DSLH 20×80',
    lot: { width: 20, depth: 80 },
    rects: [[0.095, 0.4, 0.33, 0.52]],
    label: [0.22, 0.455],
    facilities: ['Community hall', 'Kindergarten', 'Primary school nearby'],
  },
  {
    id: 'EG4',
    kind: 'DSLH',
    typeLabel: 'DSLH 22×80',
    lot: { width: 22, depth: 80 },
    rects: [[0.095, 0.555, 0.195, 0.755]],
    label: [0.15, 0.64],
    facilities: ['Linear park'],
  },
  {
    id: 'EG5',
    kind: 'DSLH',
    typeLabel: 'DSLH 24×80',
    lot: { width: 24, depth: 80 },
    rects: [[0.215, 0.585, 0.345, 0.755]],
    label: [0.29, 0.66],
    facilities: ['Pocket park', 'Playground'],
  },
  {
    id: 'EG6',
    kind: 'RSKU',
    typeLabel: 'RSKU',
    units: 313,
    rects: [[0.045, 0.775, 0.12, 0.86]],
    label: [0.08, 0.8],
    facilities: ['Surface car park'],
  },
  {
    id: 'EG7',
    kind: 'RSKU',
    typeLabel: 'RSKU',
    units: 560,
    rects: [[0.125, 0.775, 0.205, 0.86]],
    label: [0.17, 0.79],
    facilities: ['Surface car park'],
  },
  {
    id: 'EG8',
    kind: 'RSKU',
    typeLabel: 'RSKU',
    units: 930,
    rects: [[0.21, 0.775, 0.285, 0.86]],
    label: [0.25, 0.8],
    facilities: ['Surface car park'],
  },
  {
    id: 'EG9',
    kind: 'RSKU',
    typeLabel: 'RSKU',
    units: 1530,
    rects: [[0.285, 0.8, 0.37, 0.94]],
    label: [0.33, 0.85],
    facilities: ['Surface car park', 'Integrated school complex nearby'],
  },

  // ── Centre ───────────────────────────────────────────────────
  {
    id: 'EG15',
    kind: 'SHOP',
    typeLabel: 'Shop lot',
    rects: [[0.54, 0.475, 0.645, 0.585]],
    label: [0.59, 0.505],
    facilities: ['Shops & cafés', 'Public parking'],
  },
  {
    id: 'EG18',
    kind: 'DSLH',
    typeLabel: 'DSLH 22×75',
    lot: { width: 22, depth: 75 },
    rects: [[0.375, 0.53, 0.525, 0.625]],
    label: [0.45, 0.545],
    facilities: ['Guardhouse', 'Pocket park', 'Playground', 'Badminton court', 'BBQ gazebo'],
    hero: true,
  },
  {
    id: 'EG19',
    kind: 'AFFORDABLE_SHOP',
    typeLabel: 'Affordable shop',
    rects: [[0.6, 0.6, 0.685, 0.645]],
    label: [0.63, 0.62],
    facilities: ['Shops'],
  },
  {
    id: 'EG20',
    kind: 'SHOP',
    typeLabel: 'Shop lot',
    rects: [[0.61, 0.665, 0.685, 0.745]],
    label: [0.65, 0.69],
    facilities: ['Shops & cafés'],
  },
  {
    id: 'EG21',
    kind: 'DSLH',
    typeLabel: 'DSLH 20×70 / 20×80',
    lot: { width: 20, depth: 75 },
    rects: [[0.395, 0.655, 0.595, 0.75]],
    label: [0.5, 0.695],
    facilities: ['Linear park'],
  },
  {
    id: 'EG22',
    kind: 'DSSD',
    typeLabel: 'DSSD 40×80',
    lot: { width: 40, depth: 80 },
    rects: [[0.465, 0.785, 0.615, 0.88]],
    label: [0.53, 0.815],
    facilities: ['Pocket park'],
  },
  {
    id: 'EG23',
    kind: 'DSLH',
    typeLabel: 'DSLH 24×75',
    lot: { width: 24, depth: 75 },
    rects: [[0.625, 0.785, 0.72, 0.88]],
    label: [0.67, 0.815],
    facilities: ['Primary school nearby'],
  },

  // ── East ─────────────────────────────────────────────────────
  {
    id: 'EG27A',
    kind: 'DSLH',
    typeLabel: 'DSLH 20×80',
    lot: { width: 20, depth: 80 },
    rects: [[0.715, 0.515, 0.87, 0.635]],
    label: [0.775, 0.56],
    facilities: ['Guardhouse', 'Pocket park'],
  },
  {
    id: 'EG29',
    kind: 'DSLH',
    typeLabel: 'DSLH 22×75 / 22×80',
    lot: { width: 22, depth: 78 },
    rects: [[0.725, 0.66, 0.88, 0.78]],
    label: [0.8, 0.7],
    facilities: ['Lakeside park'],
  },
];

export const PRECINCT_BY_ID: Record<string, Precinct> = Object.fromEntries(PRECINCTS.map((p) => [p.id, p]));

/** Township boundary (everything outside is neighbouring land). */
export const BOUNDARY: NPoint[] = [
  [0.03, 0.12],
  [0.45, 0.12],
  [0.5, 0.2],
  [0.6, 0.25],
  [0.75, 0.25],
  [0.815, 0.2],
  [0.85, 0.245],
  [0.94, 0.245],
  [0.94, 0.965],
  [0.03, 0.965],
];

export interface Lake {
  id: string;
  points: NPoint[];
  fountain?: boolean;
}

export const LAKES: Lake[] = [
  {
    id: 'north-lake',
    points: [
      [0.215, 0.14],
      [0.42, 0.14],
      [0.465, 0.155],
      [0.485, 0.185],
      [0.465, 0.21],
      [0.38, 0.212],
      [0.3, 0.208],
      [0.215, 0.212],
    ],
  },
  {
    id: 'central-lake',
    fountain: true,
    points: [
      [0.36, 0.405],
      [0.395, 0.4],
      [0.418, 0.42],
      [0.42, 0.49],
      [0.39, 0.505],
      [0.365, 0.5],
      [0.357, 0.47],
    ],
  },
  {
    id: 'south-lake',
    points: [
      [0.775, 0.8],
      [0.86, 0.8],
      [0.875, 0.84],
      [0.865, 0.88],
      [0.8, 0.885],
      [0.77, 0.86],
    ],
  },
];

/** River along the top-right edge. */
export const RIVER: NPoint[] = [
  [0.41, -0.02],
  [0.47, 0.02],
  [0.53, 0.03],
  [0.56, 0.08],
  [0.61, 0.115],
  [0.7, 0.13],
  [0.8, 0.135],
  [0.88, 0.15],
  [1.05, 0.155],
];

export type RoadClass = 'main' | 'local';

export interface Road {
  id: string;
  name?: string;
  cls: RoadClass;
  points: NPoint[];
}

export const ROUNDABOUTS: { id: string; at: NPoint }[] = [
  { id: 'west', at: [0.362, 0.384] },
  { id: 'east', at: [0.698, 0.484] },
];

export const ROADS: Road[] = [
  {
    id: 'diorea',
    name: 'Persiaran Diorea',
    cls: 'main',
    points: [
      [0.035, 0.13],
      [0.44, 0.13],
      [0.475, 0.15],
      [0.505, 0.21],
      [0.6, 0.258],
      [0.75, 0.258],
      [0.835, 0.235],
    ],
  },
  {
    id: 'casuarina-west',
    name: 'Persiaran Casuarina',
    cls: 'main',
    points: [
      [-0.05, 0.378],
      [0.362, 0.384],
    ],
  },
  {
    id: 'casuarina-east',
    name: 'Persiaran Casuarina',
    cls: 'main',
    points: [
      [0.362, 0.384],
      [0.43, 0.388],
      [0.5, 0.408],
      [0.6, 0.448],
      [0.698, 0.484],
    ],
  },
  {
    id: 'rawang-link',
    name: 'Persiaran Dalia',
    cls: 'main',
    points: [
      [0.698, 0.484],
      [0.75, 0.42],
      [0.82, 0.34],
      [0.84, 0.25],
      [0.83, 0.13],
      [0.79, -0.05],
    ],
  },
  {
    id: 'toll-link',
    cls: 'main',
    points: [
      [0.698, 0.484],
      [0.8, 0.497],
      [0.94, 0.5],
      [0.97, 0.52],
    ],
  },
  {
    id: 'west-north',
    cls: 'local',
    points: [
      [0.362, 0.384],
      [0.37, 0.27],
      [0.37, 0.215],
    ],
  },
  {
    id: 'west-boundary',
    cls: 'local',
    points: [
      [0.04, 0.13],
      [0.04, 0.96],
    ],
  },
  {
    id: 'south-boundary',
    cls: 'local',
    points: [
      [0.04, 0.955],
      [0.8, 0.955],
      [0.935, 0.955],
    ],
  },
  {
    id: 'east-boundary',
    cls: 'local',
    points: [
      [0.935, 0.25],
      [0.935, 0.955],
    ],
  },
  {
    id: 'centre-west',
    cls: 'local',
    points: [
      [0.362, 0.384],
      [0.345, 0.43],
      [0.345, 0.53],
      [0.358, 0.63],
      [0.385, 0.7],
      [0.42, 0.765],
    ],
  },
  {
    id: 'centre-east',
    cls: 'local',
    points: [
      [0.515, 0.415],
      [0.52, 0.46],
      [0.535, 0.6],
      [0.6, 0.655],
      [0.605, 0.765],
    ],
  },
  {
    id: 'east-south',
    cls: 'local',
    points: [
      [0.698, 0.484],
      [0.7, 0.65],
      [0.73, 0.78],
      [0.765, 0.955],
    ],
  },
  {
    id: 'east-inner',
    cls: 'local',
    points: [
      [0.9, 0.5],
      [0.895, 0.79],
      [0.9, 0.955],
    ],
  },
  {
    id: 'south-cross',
    cls: 'local',
    points: [
      [0.04, 0.765],
      [0.42, 0.765],
      [0.605, 0.765],
      [0.73, 0.78],
    ],
  },
  {
    id: 'west-cross',
    cls: 'local',
    points: [
      [0.04, 0.537],
      [0.345, 0.537],
    ],
  },
  {
    id: 'west-spine',
    cls: 'local',
    points: [
      [0.205, 0.537],
      [0.205, 0.765],
    ],
  },
  {
    id: 'eg18-eg21',
    cls: 'local',
    points: [
      [0.358, 0.64],
      [0.56, 0.64],
    ],
  },
  {
    id: 'south-west-link',
    cls: 'local',
    points: [
      [0.375, 0.765],
      [0.375, 0.955],
    ],
  },
  {
    id: 'eg22-eg23',
    cls: 'local',
    points: [
      [0.62, 0.765],
      [0.62, 0.955],
    ],
  },
];

export const HIGHWAY = {
  x: 0.968,
  /** Width in metres. */
  width: 34,
  tollAt: 0.6,
  label: 'TO RAWANG',
};

export type CivicKind =
  | 'mosque'
  | 'police'
  | 'health'
  | 'primary-school'
  | 'secondary-school'
  | 'islamic-school'
  | 'school-complex'
  | 'kindergarten'
  | 'hall';

export interface Civic {
  id: string;
  kind: CivicKind;
  name: string;
  at: NPoint;
  /** Yaw in degrees. */
  rot?: number;
}

export const CIVIC: Civic[] = [
  { id: 'mosque', kind: 'mosque', name: 'Masjid Elmina Green', at: [0.458, 0.488] },
  { id: 'police', kind: 'police', name: 'Police station', at: [0.445, 0.432] },
  { id: 'health', kind: 'health', name: 'Health centre', at: [0.49, 0.455] },
  { id: 'ps-north', kind: 'primary-school', name: 'Primary school', at: [0.345, 0.255] },
  { id: 'kg-north', kind: 'kindergarten', name: 'Kindergarten', at: [0.305, 0.235] },
  { id: 'ss', kind: 'secondary-school', name: 'Secondary school', at: [0.55, 0.3] },
  { id: 'islamic', kind: 'islamic-school', name: 'Islamic school', at: [0.705, 0.31] },
  { id: 'hall-eg24', kind: 'hall', name: 'Community hall', at: [0.72, 0.345] },
  { id: 'ps-eg25', kind: 'primary-school', name: 'Primary school', at: [0.875, 0.37] },
  { id: 'hall-eg3', kind: 'hall', name: 'Community hall', at: [0.235, 0.555] },
  { id: 'kg-eg3', kind: 'kindergarten', name: 'Kindergarten', at: [0.285, 0.555] },
  { id: 'ps-eg3', kind: 'primary-school', name: 'Primary school', at: [0.315, 0.565] },
  { id: 'complex', kind: 'school-complex', name: 'Integrated school complex', at: [0.42, 0.85] },
  { id: 'ps-south', kind: 'primary-school', name: 'Primary school', at: [0.85, 0.915] },
  { id: 'police-south', kind: 'police', name: 'Police post', at: [0.14, 0.905] },
];

/** Green belts / parks drawn as lawn with dense trees. */
export const PARKS: NRect[] = [
  [0.2, 0.62, 0.215, 0.755],
  [0.355, 0.535, 0.375, 0.625],
  [0.04, 0.86, 0.1, 0.95],
  [0.45, 0.88, 0.62, 0.95],
];

export const NEIGHBOURS: { name: string; at: NPoint; area: NRect }[] = [
  { name: 'Sri Adjua', at: [0.2, 0.08], area: [0.07, 0.03, 0.4, 0.105] },
  { name: 'Desa Impian Merbau Sempak', at: [0.67, 0.045], area: [0.58, -0.03, 0.77, 0.09] },
];

export const TITLE_LABEL: NPoint = [0.47, 0.66];

/** Demo home of the resident account. */
export const HOME_UNIT = 'EG18-028';
