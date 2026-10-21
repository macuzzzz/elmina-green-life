/** Emergency numbers — the single place to update them. */

export type EmergencyIcon =
  'fire' | 'police' | 'ambulance' | 'water' | 'power' | 'developer' | 'guard' | 'office';

export interface EmergencyContact {
  id: string;
  name: string;
  /** Short name used in the confirm dialog, e.g. "Call Police (999)?" */
  shortName: string;
  icon: EmergencyIcon;
  /** Displayed number. Omitted for in-app channels. */
  number?: string;
  /** Digits used for the tel: link. */
  dial?: string;
  note?: string;
  /** In-app chat channel instead of a phone call. */
  chat?: 'guardhouse' | 'management';
}

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'bomba',
    name: 'Fire & Rescue (Bomba)',
    shortName: 'Bomba',
    icon: 'fire',
    number: '994',
    dial: '994',
  },
  { id: 'police', name: 'Police', shortName: 'Police', icon: 'police', number: '999', dial: '999' },
  {
    id: 'ambulance',
    name: 'Ambulance',
    shortName: 'Ambulance',
    icon: 'ambulance',
    number: '999',
    dial: '999',
  },
  {
    id: 'air-selangor',
    name: 'Air Selangor (water)',
    shortName: 'Air Selangor',
    icon: 'water',
    number: '15300',
    dial: '15300',
    note: '24 hours',
  },
  { id: 'tnb', name: 'TNB (electricity)', shortName: 'TNB', icon: 'power', number: '15454', dial: '15454' },
  {
    id: 'sdp',
    name: 'Sime Darby Property',
    shortName: 'Sime Darby Property',
    icon: 'developer',
    number: '1-800-88-1118',
    dial: '1800881118',
    note: 'Toll-free · Mon–Fri 8.30am–5.30pm',
  },
  {
    id: 'guardhouse',
    name: 'Elmina Green Guardhouse',
    shortName: 'Guardhouse',
    icon: 'guard',
    chat: 'guardhouse',
    note: 'In-app chat',
  },
  {
    id: 'management',
    name: 'Management Office',
    shortName: 'Management',
    icon: 'office',
    chat: 'management',
    note: 'In-app chat',
  },
];
