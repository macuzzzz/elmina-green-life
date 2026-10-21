# Elmina Green Life

A clickable 3D, game-style residents' app demo for **Elmina Green** (City of Elmina, Shah Alam), built with
Vite + React 18 + TypeScript, three.js via React Three Fiber, Zustand, Tailwind CSS and Framer Motion.

All data is fictitious and stored in your browser (localStorage). No real backend, auth or payments.

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
```

Then pick **Try demo as… Resident / Guard / Management** on the login screen.

Useful extras:

| What | How |
| --- | --- |
| Preview a time of day | add `?hour=20` (or any 0–23.9) to the URL — default is live Malaysia time |
| Switch role | Settings → *Demo: switch role* |
| Reset demo data | Settings → *Reset demo data* |

### Controls

- **Drag** to pan · **wheel / pinch** to zoom · **right-drag / two-finger twist** (or Shift-drag) to rotate
- **WASD / arrows** pan · **Q / E** rotate · **+ / −** zoom · **H** fly back home
- Click a **precinct label** for its info card, click a **house** for its house card
- **Recenter** button (bottom-left) flies back to your home; the minimap is click-to-jump

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | dev server |
| `npm run build` | type-check + production build to `dist/` |
| `npm run preview` | serve the production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Deploy (Vercel)

Static SPA — `vercel.json` rewrites all routes to `index.html`. No environment variables needed.

```bash
npm i -g vercel
vercel          # preview
vercel --prod   # production
```

Or import the Git repository in the Vercel dashboard (framework preset: Vite, output: `dist`).

## Project layout

```
src/
  app/        App shell, role-based game screen
  world/      R3F scene: layout generator, terrain, roads, water, buildings/, labels, camera rig, lighting
  ui/         HUD panels, toolbar, sheets, dialogs, cards
  features/   guard/, admin/ (lazy-loaded dashboards; more features land in later phases)
  data/       township.ts (traced from the precinct map), emergency.ts, seed/
  services/   api.ts interface + mockApi.ts (localStorage + BroadcastChannel)
  store/      Zustand store
  types/      shared models
```

- **Township layout** lives in `src/data/township.ts` in normalised map coordinates (0–1); edit a precinct's
  `rects`/`label` there and the 3D world, minimap and cards all follow.
- **Emergency numbers** live in `src/data/emergency.ts`.
- **Backend swap:** every read/write goes through `src/services/api.ts`. Implement the `Api` interface against a
  real backend (e.g. Supabase) and export it instead of `mockApi`.
- **Branding:** the wordmark loads from `public/brand/logo.svg` (an original placeholder). Replace it with the
  official logo once permission to use the branding is confirmed.

## What's in the demo

| Area | Highlights |
| --- | --- |
| **World** | Whole Elmina Green traced from the precinct map, EG18 at house-level detail, day/night by Malaysia time, minimap, recenter |
| **People** | Bitmoji-style avatar creator (tudung, songkok, cap…), avatars outside homes, thought bubbles (typing “…” + posted cloud), feed with reactions, replies and reporting, privacy settings, notifications |
| **Tickets** | Report incidents (map pin, category, urgency, photos), repair requests (my unit / common area), suggestions with ghost markers + upvotes, status timelines |
| **Staff** | Guard queue with SOS alerts, management kanban (drag between columns), announcements with 📢 map markers, resident accounts, moderation, overview stats |
| **Chat** | Guardhouse, management and neighbour DMs with quick replies, read ticks, photos; staff auto-reply after 2–4 s when no staff tab is open |
| **Home** | My Home (household, my tickets) and Decorate (gate & car colour, garden, festive lights — free) |

### Live two-tab demo

Open the app in two tabs of the same browser. Log in as **Resident** in one and **Management** (or Guard) in
the other — via Settings → *Demo: switch role*, or the login screen. Reports, repairs, chats and status changes
appear live in both (BroadcastChannel + localStorage). With a staff tab open, resident chats are no longer
auto-answered, so you can reply by hand.

## Build phases

1. **World & shell** ✅
2. **People** ✅ — avatars, thought bubbles, feed, house card, privacy, notifications
3. **Incidents, repairs & dashboards** ✅ — flows, timelines, guard + management dashboards, chat, cross-tab sync
4. **Suggest, decorate, announcements & polish** ✅ — backlog items (§5.8) appear as “Coming soon”
