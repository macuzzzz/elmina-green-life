import { useEffect, useMemo, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';
import { LAKES, MAP_ASPECT, PRECINCTS, ROADS, ROUNDABOUTS, BOUNDARY, HIGHWAY } from '@/data/township';
import { useStore } from '@/store';
import { cameraController } from '@/world/cameraController';
import { toNorm, toWorld } from '@/world/coords';
import { getLayout } from '@/world/layout';
import { RecenterButton } from './RecenterButton';

const A = MAP_ASPECT;
const VIEW = { x: 0.02, y: 0.1 * A, w: 0.97, h: 0.88 * A };

const KIND_FILL: Record<string, string> = {
  DSLH: '#e9e3d6',
  DSSD: '#e2dccb',
  RSKU: '#ddd6c6',
  SHOP: '#e8b98f',
  AFFORDABLE_SHOP: '#e8b98f',
};

const pts = (list: [number, number][]) => list.map(([x, y]) => `${x},${y * A}`).join(' ');

/** Flat 2D top-down map generated from the same township data as the 3D world. */
export function Minimap({ width = 220 }: { width?: number }) {
  const viewRef = useRef<SVGPolygonElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const role = useStore((s) => s.session?.role);
  const home = getLayout().home;
  const homeN = useMemo(() => toNorm([home.x, home.z]), [home]);
  const height = (width * VIEW.h) / VIEW.w;

  useEffect(() => {
    let raf = 0;
    const draw = () => {
      raf = 0;
      const poly = viewRef.current;
      if (!poly) return;
      poly.setAttribute(
        'points',
        cameraController.footprint
          .map((p) => {
            const [nx, ny] = toNorm(p);
            return `${nx.toFixed(4)},${(ny * A).toFixed(4)}`;
          })
          .join(' '),
      );
    };
    const unsub = cameraController.onFrame(() => {
      if (!raf) raf = requestAnimationFrame(draw);
    });
    return () => {
      unsub();
      cancelAnimationFrame(raf);
    };
  }, []);

  const jump = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const nx = VIEW.x + ((e.clientX - r.left) / r.width) * VIEW.w;
    const ny = (VIEW.y + ((e.clientY - r.top) / r.height) * VIEW.h) / A;
    const [x, z] = toWorld([nx, ny]);
    cameraController.flyTo({ x, z }, { duration: 0.9 });
  };

  return (
    <div className="panel flex gap-1.5 p-1.5">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
        className="cursor-crosshair rounded-xl bg-[#cfdcc0]"
        onClick={jump}
        role="img"
        aria-label="Minimap of Elmina Green. Click to move the camera there."
      >
        <polygon points={pts(BOUNDARY)} fill="#a6d38a" />
        {PRECINCTS.flatMap((p) =>
          p.rects.map((r, i) => (
            <rect
              key={`${p.id}-${i}`}
              x={r[0]}
              y={r[1] * A}
              width={r[2] - r[0]}
              height={(r[3] - r[1]) * A}
              fill={p.hero ? '#ffe9a8' : KIND_FILL[p.kind]}
              stroke={p.hero ? '#f59e0b' : 'none'}
              strokeWidth={0.004}
              rx={0.005}
            />
          )),
        )}
        {LAKES.map((l) => (
          <polygon key={l.id} points={pts(l.points)} fill="#6cc3e6" />
        ))}
        {ROADS.map((r) => (
          <polyline
            key={r.id}
            points={pts(r.points)}
            fill="none"
            stroke="#ffffff"
            strokeWidth={r.cls === 'main' ? 0.011 : 0.006}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {ROUNDABOUTS.map((r) => (
          <circle
            key={r.id}
            cx={r.at[0]}
            cy={r.at[1] * A}
            r={0.011}
            fill="#ffffff"
            stroke="#a6d38a"
            strokeWidth={0.004}
          />
        ))}
        <line x1={HIGHWAY.x} y1={0} x2={HIGHWAY.x} y2={A} stroke="#9aa3ad" strokeWidth={0.018} />
        {PRECINCTS.map((p) => (
          <text
            key={p.id}
            x={p.label[0]}
            y={p.label[1] * A}
            fontSize={0.028}
            fontWeight={800}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#4b5563"
            style={{ pointerEvents: 'none' }}
          >
            {p.id.replace('EG', '')}
          </text>
        ))}
        <polygon
          ref={viewRef}
          fill="rgba(47,124,246,0.12)"
          stroke="#2f7cf6"
          strokeWidth={0.006}
          strokeLinejoin="round"
        />
        {role === 'resident' && (
          <g transform={`translate(${homeN[0]} ${homeN[1] * A})`} style={{ pointerEvents: 'none' }}>
            <path
              d="M0 0 C -0.02 -0.03 -0.024 -0.042 -0.024 -0.05 A 0.024 0.024 0 1 1 0.024 -0.05 C 0.024 -0.042 0.02 -0.03 0 0 Z"
              fill="#e5322d"
              stroke="#fff"
              strokeWidth={0.005}
            />
            <circle cx={0} cy={-0.05} r={0.009} fill="#fff" />
          </g>
        )}
      </svg>
      <div className="flex flex-col justify-between">
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-xl bg-white shadow ring-1 ring-black/5 active:scale-95"
            onClick={() => cameraController.zoomBy(0.7)}
            aria-label="Zoom in"
          >
            <Plus className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-xl bg-white shadow ring-1 ring-black/5 active:scale-95"
            onClick={() => cameraController.zoomBy(1.4)}
            aria-label="Zoom out"
          >
            <Minus className="h-5 w-5" />
          </button>
        </div>
        <RecenterButton />
      </div>
    </div>
  );
}
