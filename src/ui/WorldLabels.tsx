import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { HOME_UNIT, NEIGHBOURS, TITLE_LABEL, type CivicKind } from '@/data/township';
import { useStore } from '@/store';
import { cameraController } from '@/world/cameraController';
import { toWorld } from '@/world/coords';
import { getLayout, type HouseLot } from '@/world/layout';
import { BASE_LOT } from '@/world/buildings/geometries';
import { flyToPrecinct } from '@/world/recenter';
import { Anchor, OverlayRoot, anchors, markOverlayDirty, type AnchorState } from './overlay/anchors';
import { PeopleLayer } from './overlay/PeopleLayer';
import { MarkersLayer } from './overlay/MarkersLayer';

/** Static in-world labels: precinct pills, civic pins, title, home pin, address plates. */

const CIVIC_ICON: Record<CivicKind, string> = {
  mosque: '🕌',
  police: '🚓',
  health: '🏥',
  'primary-school': '🏫',
  'secondary-school': '🏫',
  'islamic-school': '🏫',
  'school-complex': '🏫',
  kindergarten: '🧸',
  hall: '🏛️',
};

const PLATE_SLOTS = 18;

/**
 * Address plates for the nearest EG18 houses at street-level zoom. A fixed pool of
 * slots is reused and updated imperatively, so panning never mounts DOM nodes.
 */
function AddressPlates({ active }: { active: boolean }) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useLayoutEffect(() => {
    const slots = refs.current.map((el) => {
      const a: AnchorState = { pos: new THREE.Vector3(), hidden: true };
      if (el) anchors.set(el, a);
      return { el, a, unit: '' };
    });
    const L = getLayout();
    const tick = () => {
      const near = active
        ? L.heroHouses
            .map((h) => ({ h, d: Math.hypot(h.x - cameraController.cur.tx, h.z - cameraController.cur.tz) }))
            .filter((x) => x.d < 75)
            .sort((p, q) => p.d - q.d)
            .slice(0, PLATE_SLOTS)
            .map((x) => x.h)
        : [];
      let changed = false;
      slots.forEach((slot, i) => {
        const h: HouseLot | undefined = near[i];
        if (!slot.el) return;
        if (!h) {
          if (!slot.a.hidden) {
            slot.a.hidden = true;
            changed = true;
          }
          return;
        }
        if (slot.unit !== h.unitId) {
          const c = Math.cos(h.rot);
          const s = Math.sin(h.rot);
          const lx = (h.brickLeft ? 1 : -1) * (BASE_LOT.w / 2 - 0.25);
          const lz = BASE_LOT.d / 2 - 0.1;
          slot.a.pos.set(h.x + lx * c + lz * s, 2.2, h.z - lx * s + lz * c);
          const label = slot.el.firstElementChild;
          if (label) label.textContent = h.unitId.replace('EG18-', '');
          slot.unit = h.unitId;
          changed = true;
        }
        if (slot.a.hidden) {
          slot.a.hidden = false;
          changed = true;
        }
      });
      if (changed) markOverlayDirty();
    };
    tick();
    const id = setInterval(tick, 400);
    return () => {
      clearInterval(id);
      slots.forEach((slot) => slot.el && anchors.delete(slot.el));
    };
  }, [active]);
  return (
    <>
      {Array.from({ length: PLATE_SLOTS }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="absolute left-0 top-0"
          style={{ visibility: 'hidden' }}
        >
          <div className="select-none whitespace-nowrap rounded bg-charcoal-800/90 px-1.5 py-0.5 text-[10px] font-bold text-white" />
        </div>
      ))}
    </>
  );
}

export function WorldLabels() {
  const L = getLayout();
  const lod = useStore((s) => s.lod);
  const selection = useStore((s) => s.selection);
  const select = useStore((s) => s.select);
  const role = useStore((s) => s.session?.role);
  const homePrecinct = HOME_UNIT.split('-')[0];
  const [tx, tz] = toWorld(TITLE_LABEL);

  return (
    <OverlayRoot>
      {NEIGHBOURS.map((n) => {
        const [x, z] = toWorld(n.at);
        return (
          <Anchor key={n.name} x={x} y={20} z={z}>
            <div className="select-none whitespace-nowrap rounded-full bg-white/60 px-3 py-1 text-xs font-bold uppercase tracking-wider text-charcoal-700/80">
              {n.name}
            </div>
          </Anchor>
        );
      })}

      <Anchor x={tx} y={60} z={tz}>
        <div
          className={`select-none whitespace-nowrap rounded-2xl bg-white/85 px-4 py-2 text-center font-display font-extrabold uppercase leading-[0.95] tracking-wider text-charcoal-800 shadow-lg transition-opacity ${
            lod === 'near' ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ fontSize: lod === 'far' ? 28 : 22 }}
        >
          Elmina
          <br />
          Green
        </div>
      </Anchor>

      {L.civic.map((c) => (
        <Anchor key={c.id} x={c.x} y={30} z={c.z} hidden={lod === 'far'}>
          <div
            className="group pointer-events-auto flex select-none items-center gap-1 rounded-full bg-white/95 py-0.5 pl-0.5 pr-0.5 shadow-md transition-all hover:pr-2.5"
            title={c.name}
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-leaf-50 text-sm" aria-hidden>
              {CIVIC_ICON[c.kind]}
            </span>
            <span className="hidden whitespace-nowrap text-[11px] font-bold text-charcoal-800 group-hover:inline">
              {c.name}
            </span>
          </div>
        </Anchor>
      ))}

      {L.precincts.map((p) => {
        const active = selection?.kind === 'precinct' && selection.id === p.precinct.id;
        const isHome = p.precinct.id === homePrecinct;
        return (
          <Anchor key={p.precinct.id} x={p.label[0]} y={26} z={p.label[1]}>
            <button
              type="button"
              onClick={() => {
                select({ kind: 'precinct', id: p.precinct.id });
                flyToPrecinct(p.precinct.id);
              }}
              aria-label={`Precinct ${p.precinct.id}, ${p.precinct.typeLabel}`}
              className={`pointer-events-auto select-none whitespace-nowrap rounded-lg border px-2 py-0.5 font-display font-extrabold leading-tight shadow-md transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-tool-500 ${
                lod === 'far' ? 'text-[15px]' : 'text-[13px]'
              } ${
                active
                  ? 'border-tool-500 bg-tool-500 text-white'
                  : isHome
                    ? 'border-leaf-500 bg-white text-leaf-700'
                    : 'border-white/70 bg-white/95 text-charcoal-800'
              }`}
            >
              {p.precinct.id}
            </button>
          </Anchor>
        );
      })}

      <Anchor
        x={L.heroFacilities.guardhouse.x - 7}
        y={9}
        z={L.heroFacilities.guardhouse.z}
        hidden={lod === 'far'}
      >
        <div className="select-none whitespace-nowrap rounded-full bg-charcoal-800/90 px-2 py-0.5 text-[10px] font-bold text-white shadow">
          🛡️ Guardhouse EG18
        </div>
      </Anchor>

      <AddressPlates active={lod === 'near'} />

      {/* At mid/near zoom the resident's own avatar (with 🏠 badge) marks home instead. */}
      {role === 'resident' && (
        <Anchor x={L.home.x} y={40} z={L.home.z} hidden={lod !== 'far'}>
          <button
            type="button"
            onClick={() => {
              select({ kind: 'house', unitId: L.home.unitId });
              useStore.getState().bounceUnit(L.home.unitId);
            }}
            className="pointer-events-auto flex flex-col items-center"
            aria-label="My home"
          >
            <span className="flex items-center gap-1 rounded-full bg-sos-500 px-2.5 py-1 text-xs font-extrabold text-white shadow-lg ring-2 ring-white">
              🏠 My Home
            </span>
            <span className="-mt-px h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-sos-500" />
          </button>
        </Anchor>
      )}
      <MarkersLayer />
      <PeopleLayer />
    </OverlayRoot>
  );
}
