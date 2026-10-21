import { getLayout } from './layout';
import { BadmintonCourt, CivicBuilding, Gazebo, Guardhouse, Playground, PocketPark } from './buildings/Civic';
import { useStore } from '@/store';

/** Civic buildings across the township + EG18's facilities. */
export function Places() {
  const L = getLayout();
  const lod = useStore((s) => s.lod);
  const f = L.heroFacilities;
  return (
    <group>
      {L.civic.map((c) => (
        <group key={c.id} position={[c.x, 0, c.z]} rotation={[0, c.rot, 0]} scale={1.7}>
          <CivicBuilding kind={c.kind} />
        </group>
      ))}
      {lod !== 'far' && (
        <group>
          <group position={[f.pocketPark.x, 0, f.pocketPark.z]}>
            <PocketPark />
          </group>
          <group position={[f.playground.x, 0, f.playground.z]}>
            <Playground />
          </group>
          <group position={[f.badminton.x, 0, f.badminton.z]} rotation={[0, Math.PI / 2, 0]}>
            <BadmintonCourt />
          </group>
          <group position={[f.gazebo.x, 0, f.gazebo.z]}>
            <Gazebo />
          </group>
        </group>
      )}
      <group position={[f.guardhouse.x, 0, f.guardhouse.z]}>
        <Guardhouse />
      </group>
    </group>
  );
}
