import type { Role } from '@/types';
import { SelectionCard } from '@/ui/cards/SelectionCard';
import { EmergencyPanel } from './EmergencyPanel';
import { FeedPanel } from './FeedPanel';
import { Minimap } from './Minimap';
import { PlacementBar, Toolbar } from './Toolbar';
import { BrandCard, NavBar, ProfileCard, WeatherClock } from './TopBar';

/**
 * Desktop (≥1024px) layout, matching reference/05 with the §11 changes.
 * Guard: left drawer (380px). Management: right panel (460px).
 */
export function DesktopHud({ role }: { role: Role }) {
  const resident = role === 'resident';
  const leftPad = role === 'guard' ? 'left-[396px]' : 'left-4';
  const rightPad = role === 'management' ? 'right-[476px]' : 'right-4';
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* top row: brand + profile · weather/time · nav */}
      <div className={`absolute top-4 flex items-start gap-3 ${leftPad} ${rightPad}`}>
        <div className="pointer-events-auto flex shrink-0 gap-3">
          <BrandCard />
          <ProfileCard />
        </div>
        <div className="flex min-w-0 flex-1 justify-center">
          <div className={`pointer-events-auto hidden ${resident ? 'xl:block' : ''}`}>
            <WeatherClock />
          </div>
          <div className={`pointer-events-auto mt-2 ${resident ? 'xl:hidden' : ''}`}>
            <WeatherClock compact />
          </div>
        </div>
        <div className="pointer-events-auto shrink-0">
          <NavBar role={role} />
        </div>
      </div>

      {/* map-tap tool hint (Report / Repair / Suggest) */}
      <div
        className={`absolute top-[104px] flex justify-center ${leftPad} ${role === 'management' ? 'right-[476px]' : 'right-[352px] xl:right-[392px]'}`}
      >
        <PlacementBar />
      </div>

      {/* right column */}
      {role !== 'management' && (
        <aside className="pointer-events-auto absolute bottom-4 right-4 top-[104px] flex w-[320px] flex-col gap-3 xl:w-[360px]">
          <EmergencyPanel />
          <FeedPanel className="min-h-[180px] flex-1" />
        </aside>
      )}

      {/* selection card */}
      <div className={`pointer-events-auto absolute top-[108px] w-[340px] ${leftPad}`}>
        <SelectionCard />
      </div>

      {/* bottom-left: minimap + zoom + recenter */}
      <div className={`pointer-events-auto absolute bottom-4 ${leftPad}`}>
        <Minimap width={200} />
      </div>

      {/* bottom-centre toolbar, centred in the space between minimap and right column */}
      {resident && (
        <div className="absolute bottom-4 left-[286px] right-[336px] flex justify-center xl:right-[376px]">
          <div className="pointer-events-auto">
            <Toolbar />
          </div>
        </div>
      )}
    </div>
  );
}
