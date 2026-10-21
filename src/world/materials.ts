import * as THREE from 'three';

/** Colour palette taken from reference/01-house-render. */
export const PALETTE = {
  wall: '#f6f5f1',
  wallShade: '#e4e2dc',
  brick: '#b8603d',
  roof: '#454a52',
  roofEdge: '#2a2d32',
  frame: '#1e2226',
  gate: '#25282d',
  lawn: '#86c46a',
  lawnDark: '#5fa845',
  lawnTown: '#93c97a',
  paving: '#d9d4c8',
  driveway: '#b9b5ad',
  asphalt: '#4b5058',
  asphaltLocal: '#5b6068',
  curb: '#d2cdc2',
  outside: '#b3c4a2',
  neighbour: '#c6cbb5',
  trunk: '#7a5236',
  lampPole: '#3b3f46',
  plinth: '#9aa0a6',
  sand: '#e6dcc2',
} as const;

function std(params: THREE.MeshStandardMaterialParameters) {
  return new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...params });
}

/** Shared materials. Day/night lighting tweaks their emissive values in place. */
export const MATERIALS = {
  vertex: std({ vertexColors: true }),
  vertexDouble: std({ vertexColors: true, side: THREE.DoubleSide }),
  glass: std({
    color: '#2b3a48',
    roughness: 0.25,
    metalness: 0.2,
    emissive: new THREE.Color('#ffc874'),
    emissiveIntensity: 0,
  }),
  lampHead: std({ color: '#f4f1e6', emissive: new THREE.Color('#ffd27a'), emissiveIntensity: 0 }),
  lampPole: std({ color: PALETTE.lampPole, roughness: 0.6 }),
  trunk: std({ color: PALETTE.trunk }),
  canopy: std({ color: '#ffffff', roughness: 0.9 }),
  car: std({ vertexColors: true, roughness: 0.45, metalness: 0.15 }),
  awning: std({ color: '#ffffff', roughness: 0.7 }),
  asphalt: std({ color: PALETTE.asphalt, roughness: 0.95 }),
  asphaltLocal: std({ color: PALETTE.asphaltLocal, roughness: 0.95 }),
  curb: std({ color: PALETTE.curb }),
  marking: std({ color: '#f4f4ef', roughness: 0.6 }),
  paving: std({ color: PALETTE.paving }),
  driveway: std({ color: PALETTE.driveway }),
  carPark: std({ color: '#7c8088', roughness: 0.95 }),
  lawn: std({ color: PALETTE.lawn }),
  lawnTown: std({ color: PALETTE.lawnTown }),
  lawnDark: std({ color: PALETTE.lawnDark }),
  outside: std({ color: PALETTE.outside }),
  neighbour: std({ color: PALETTE.neighbour }),
  neighbourBlock: std({ color: '#d8d6cd' }),
  sand: std({ color: PALETTE.sand }),
  white: std({ color: PALETTE.wall }),
  dark: std({ color: PALETTE.frame, roughness: 0.5 }),
  roof: std({ color: PALETTE.roof, roughness: 0.7 }),
} as const;

/** 0 = full day, 1 = full night. Drives window glow and street lamps. */
export function setNightFactor(night: number) {
  MATERIALS.glass.emissiveIntensity = night * 1.25;
  MATERIALS.lampHead.emissiveIntensity = night > 0.35 ? 2.2 : 0;
}

// ── procedural canvas textures ──────────────────────────────────

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (ctx) draw(ctx);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

let brickTex: THREE.Texture | null = null;
export function getBrickTexture() {
  if (!brickTex) {
    brickTex = canvasTexture(64, 128, (ctx) => {
      ctx.fillStyle = '#d9cfc2';
      ctx.fillRect(0, 0, 64, 128);
      const rows = 16;
      for (let r = 0; r < rows; r++) {
        const off = r % 2 === 0 ? 0 : 8;
        for (let x = -16; x < 64; x += 16) {
          const shade = 0.88 + ((r * 7 + x) % 5) * 0.03;
          ctx.fillStyle = `rgb(${Math.round(184 * shade)}, ${Math.round(96 * shade)}, ${Math.round(61 * shade)})`;
          ctx.fillRect(x + off + 1, r * 8 + 1, 14, 6);
        }
      }
    });
    brickTex.wrapS = brickTex.wrapT = THREE.RepeatWrapping;
  }
  return brickTex;
}

let latticeTex: THREE.Texture | null = null;
export function getLatticeTexture() {
  if (!latticeTex) {
    latticeTex = canvasTexture(64, 64, (ctx) => {
      ctx.fillStyle = '#f2f1ec';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#7d828a';
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          ctx.beginPath();
          ctx.arc(x * 16 + 8, y * 16 + 8, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
    latticeTex.wrapS = latticeTex.wrapT = THREE.RepeatWrapping;
  }
  return latticeTex;
}

export const brickMaterial = () => std({ map: getBrickTexture() });
export const latticeMaterial = () => std({ map: getLatticeTexture() });

/** Text painted on a canvas — used for road markings and shop signs. */
export function textTexture(
  text: string,
  opts: { w?: number; h?: number; bg?: string; fg?: string; font?: string; arrow?: boolean } = {},
) {
  const w = opts.w ?? 512;
  const h = opts.h ?? 128;
  return canvasTexture(w, h, (ctx) => {
    if (opts.bg) {
      ctx.fillStyle = opts.bg;
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.clearRect(0, 0, w, h);
    }
    ctx.fillStyle = opts.fg ?? '#ffffff';
    ctx.font = opts.font ?? `800 ${Math.round(h * 0.55)}px "Baloo 2", Nunito, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + h * 0.04);
  });
}
