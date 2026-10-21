import type { PrivacySettings, User } from '@/types';
import { randomAvatar } from '@/features/avatar/avatarParts';

// All names are invented. No real people.

const DEFAULT_PRIVACY: PrivacySettings = {
  displayName: 'full',
  showUnitId: true,
  showAvatarOnMap: true,
  allowNeighbourDMs: true,
};

const PALETTE = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316'];

function resident(
  id: string,
  name: string,
  unitId: string,
  i: number,
  privacy: Partial<PrivacySettings> = {},
  household: User['household'] = 'owner',
): User {
  return {
    id,
    name,
    role: 'resident',
    email: `${id}@demo.elminagreen.app`,
    unitId,
    household,
    color: PALETTE[i % PALETTE.length],
    privacy: { ...DEFAULT_PRIVACY, ...privacy },
    avatar: randomAvatar(id),
    onboarded: true,
  };
}

export const DEMO_RESIDENT_ID = 'u-daniel';
export const DEMO_GUARD_ID = 'u-rahim';
export const DEMO_MANAGER_ID = 'u-nurul';

export const SEED_USERS: User[] = [
  // Daniel hasn't made his avatar yet — the creator opens on first launch.
  { ...resident(DEMO_RESIDENT_ID, 'Daniel Lim', 'EG18-028', 2), onboarded: false },
  {
    id: DEMO_GUARD_ID,
    name: 'Encik Rahim',
    role: 'guard',
    email: 'rahim@demo.elminagreen.app',
    post: 'Guardhouse EG18',
    color: '#334155',
    privacy: DEFAULT_PRIVACY,
    avatar: {
      ...randomAvatar('rahim'),
      headwear: 'cap',
      headwearColor: '#1f2937',
      topColor: '#1f2937',
      hairStyle: 'short',
      facialHair: 'moustache',
    },
  },
  {
    id: DEMO_MANAGER_ID,
    name: 'Ms. Nurul',
    role: 'management',
    email: 'nurul@demo.elminagreen.app',
    post: 'Elmina Green Management Office',
    color: '#228640',
    privacy: DEFAULT_PRIVACY,
    avatar: {
      ...randomAvatar('nurul'),
      headwear: 'tudung',
      headwearColor: '#2fa452',
      topColor: '#f3f4f6',
      facialHair: 'none',
    },
  },
  // EG18 — the hero precinct, most residents live here.
  resident('u-sarah', 'Sarah Tan', 'EG18-012', 3),
  resident('u-daniel-wife', 'Grace Lim', 'EG18-028', 4, {}, 'family'),
  resident('u-aisyah', 'Aisyah Rahman', 'EG18-031', 5),
  resident('u-hafiz', 'Hafiz Ismail', 'EG18-033', 6, { displayName: 'first' }),
  resident('u-weiling', 'Wei Ling Chong', 'EG18-026', 7),
  resident('u-priya', 'Priya Nair', 'EG18-040', 0),
  resident('u-arjun', 'Arjun Menon', 'EG18-041', 1, { showUnitId: false }),
  resident('u-siti', 'Siti Nurhaliza Kamal', 'EG18-017', 2, { displayName: 'initials' }),
  resident('u-farid', 'Farid Azman', 'EG18-019', 3),
  resident('u-mei-eg18', 'Mei Xin Ooi', 'EG18-054', 4),
  resident('u-kumar', 'Kumar Selvam', 'EG18-062', 5),
  resident('u-nadia', 'Nadia Hassan', 'EG18-066', 6, { allowNeighbourDMs: false }),
  resident('u-jason', 'Jason Wong', 'EG18-071', 7),
  resident('u-amira', 'Amira Zulkifli', 'EG18-077', 0),
  resident('u-ravi', 'Ravi Shankar', 'EG18-083', 1, { showAvatarOnMap: false }),
  resident('u-lina', 'Lina Yap', 'EG18-090', 2),
  resident('u-azlan', 'Azlan Yusof', 'EG18-095', 3),
  resident('u-chloe', 'Chloe Lau', 'EG18-102', 4),
  resident('u-irfan', 'Irfan Hakim', 'EG18-108', 5),
  resident('u-deepa', 'Deepa Krishnan', 'EG18-113', 6),
  resident('u-zul', 'Zulkarnain Omar', 'EG18-005', 7, { displayName: 'first' }),
  resident('u-hui-min', 'Hui Min Teh', 'EG18-008', 0),
  resident('u-faizal', 'Faizal Rosli', 'EG18-047', 1),
  // Other precincts.
  resident('u-alex', 'Alex Fernandez', 'EG19-003', 2, {}, 'tenant'),
  resident('u-mei', 'Mei Chen', 'EG10-018', 3),
  resident('u-ken', 'Ken Ng', 'EG27A-011', 4),
  resident('u-sofia', 'Sofia Abdullah', 'EG3-007', 5),
  resident('u-daniel-eg21', 'Danish Iskandar', 'EG21-045', 6),
  resident('u-yusuf', 'Yusuf Harun', 'EG1-022', 7),
  resident('u-anita', 'Anita Gopal', 'EG4-031', 0),
  resident('u-boon', 'Boon Keat Lee', 'EG5-014', 1),
  resident('u-salmah', 'Salmah Idris', 'EG21-012', 2),
  resident('u-vincent', 'Vincent Goh', 'EG22-006', 3),
  resident('u-rosnah', 'Rosnah Bakar', 'EG23-019', 4),
  resident('u-eric', 'Eric Tay', 'EG29-027', 5, {}, 'tenant'),
  resident('u-kavitha', 'Kavitha Raj', 'EG27A-020', 6),
  resident('u-hakim', 'Hakim Shah', 'EG3-044', 7),
  resident('u-joanne', 'Joanne Lee', 'EG29-008', 0),
];
