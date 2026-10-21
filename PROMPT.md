# Build Prompt: "Elmina Green Life" — a 3D gamified residents' app for Elmina Green, City of Elmina

> **How to use this file (for the human):**
> 1. Create an empty project folder, put this file in it as `PROMPT.md`.
> 2. Create a `reference/` folder inside it and save your 6 images there with these exact names:
>    - `01-house-render.jpg` (the aerial render of the terrace houses)
>    - `02-elmina-green-map.jpg` (the EG1–EG29 precinct map)
>    - `03-simcity-style.png` (the SimCity BuildIt screenshot)
>    - `04-thought-bubble.png` (the avatar with the "…" cloud)
>    - `05-game-snapshot.png` (your full UI mock-up)
>    - `06-recenter-button.png` (the round recenter button)
> 3. Open Claude Code in that folder and type:
>    **"Read PROMPT.md and every image in reference/, then start Phase 1."**

---

## 0. Your role and how to work

You are a senior full-stack + WebGL engineer building a **clickable, scrollable demo** of a 3D, game-style residents' app for **Elmina Green** (a precinct of the City of Elmina township in Shah Alam, Selangor, Malaysia, developed by Sime Darby Property).

Working rules:
- **Look at every image in `reference/` before writing code.** They are the source of truth for layout (`02`), house style (`01`), game feel (`03`), thought bubbles (`04`), overall UI (`05`) and the recenter button (`06`). Where this prompt and `05-game-snapshot.png` disagree, **this prompt wins** (several things in the snapshot have been deliberately changed — see §11).
- Build in the **phases in §10**. At the end of each phase: run the app, fix all console errors, check it at desktop (1440×900) and phone (390×844) widths, then **stop and give me a short summary + how to view it** before starting the next phase.
- All data is **fake/mock**. No real backend, no real auth, no real payments. But structure the code so a real backend (e.g. Supabase) can be swapped in later without touching UI components (see §8).
- Keep it **original**: be *inspired by* SimCity BuildIt's cheerful isometric feel, but do not copy any of its assets, icons, UI or names.
- Prefer procedural geometry built in code over downloaded 3D models, so the project has no licensing issues and stays light.
- Language: **English only**.

---

## 1. Tech stack

- **Vite + React 18 + TypeScript** (strict mode)
- **three.js via @react-three/fiber + @react-three/drei** for the 3D world
- **@react-three/postprocessing** (optional, light use: subtle bloom/SSAO only if performance allows)
- **Zustand** for app state
- **Tailwind CSS** for the 2D UI overlay; **lucide-react** for icons
- **Framer Motion** for UI animations
- **date-fns** for times ("2 min ago")
- Deploy target: **Vercel** (static SPA). Add `vercel.json` with a rewrite of all routes to `/index.html`. No env vars required for the demo.
- Add ESLint + Prettier. Add a `README.md` with run/deploy steps.

---

## 2. The product in one paragraph

Residents open the app and see their neighbourhood as a bright, toy-like 3D township. Their own house is highlighted with their Bitmoji-style avatar standing outside it. Neighbours' avatars stand outside their houses with thought-bubble clouds showing their latest post. From this map residents can **report incidents**, **request repairs**, **suggest improvements**, **chat with the guardhouse and management**, read announcements and bond with neighbours. Emergency numbers are always one tap away in a red panel. Guards and management use the same 3D map, but with dashboards for handling tickets.

---

## 3. The 3D world

### 3.1 Visual style
- **Stylized, low-poly, gamified** — bright, saturated, slightly toy-like, soft shadows, warm tropical sunlight. Think "cosy city builder", not photorealism.
- Colour palette taken from `01-house-render.jpg`: **white walls, terracotta/red-brick accent panels, dark charcoal tiled gable roofs, black gates and window frames, white boundary walls, lush green lawns, lots of trees.**
- Lots of greenery: instanced round/tropical trees, hedges, lawns, lakes with a gentle animated water shader, a fountain in the central lake.
- Light ambient life: small cars driving along main roads on looping paths, a few pedestrians, birds. Keep it subtle and cheap (instanced, simple paths).
- Camera has a slight tilt-shift / depth-of-field feel at close zoom if performance allows.
- **Day/night cycle** driven by real Malaysia time (Asia/Kuala_Lumpur): day lighting 7am–7pm, golden hour around sunset, night with warm window glow and street lamps on.

### 3.2 Map layout — whole Elmina Green township
Recreate the layout of `02-elmina-green-map.jpg` as a **data file** (`src/data/township.ts`), not hard-coded meshes, so precincts can be adjusted easily. Use a normalised coordinate system where (0,0) is the top-left of the map image and (1,1) the bottom-right, then scale to world units.

Approximate precinct centres and types read from the map (verify against the image and refine positions/shapes from it):

| Precinct | Type on map | Approx. centre (x, y) | Render as |
|---|---|---|---|
| EG1 | DSLH 20×70 | 0.15, 0.20 | Terrace rows |
| EG2 | RSKU, 562 units | 0.33, 0.20 | Apartment blocks |
| EG10 | RSKU, 1163 units | 0.48, 0.20 | Apartment blocks |
| EG11 | RSKU, 1066 units | 0.55, 0.27 | Apartment blocks |
| EG12 | RSKU, 522 units | 0.67, 0.30 | Apartment blocks |
| EG13 | RSKU, 1063 units | 0.78, 0.30 | Apartment blocks |
| EG24 | RSKU, 583 units | 0.80, 0.18 | Apartment blocks |
| EG25 | RSKU, 545 units | 0.92, 0.18 | Apartment blocks |
| EG26 | RSKU, 1567 units | 0.85, 0.36 | Apartment blocks |
| EG3 | DSLH 20×80 | 0.15, 0.33 | Terrace rows |
| EG4 | DSLH 22×80 | 0.13, 0.50 | Terrace rows |
| EG5 | DSLH 24×80 | 0.28, 0.53 | Terrace rows |
| EG6 | RSKU | 0.08, 0.79 | Apartment blocks |
| EG7 | RSKU, 560 units | 0.20, 0.78 | Apartment blocks |
| EG8 | RSKU, 930 units | 0.32, 0.79 | Apartment blocks |
| EG9 | RSKU, 1530 units | 0.35, 0.88 | Apartment blocks |
| EG15 | Shop lot | 0.60, 0.43 | Shophouse rows |
| **EG18** | **DSLH 22×75** | **0.45, 0.50** | **Fully detailed precinct (see 3.4)** |
| EG19 | Affordable shop | 0.60, 0.55 | Shophouse row |
| EG20 | Shop lot | 0.68, 0.60 | Shophouse rows |
| EG21 | DSLH 20×70 / 20×80 | 0.50, 0.63 | Terrace rows |
| EG22 | DSSD 40×80 | 0.50, 0.78 | Semi-detached pairs |
| EG23 | DSLH 24×75 | 0.67, 0.78 | Terrace rows |
| EG27A | DSLH 20×80 | 0.80, 0.45 | Terrace rows |
| EG29 | DSLH 22×75 / 22×80 | 0.80, 0.60 | Terrace rows |

Key: **DSLH** = double-storey link (terrace) house; **DSSD** = double-storey semi-detached; **RSKU** = Rumah Selangorku affordable homes (render as 5–8 storey apartment blocks with car parks).

Also place, following the map:
- **Lakes**: large lake top-left near EG1/EG2; central lake by the mosque near EG3/EG18; lake bottom-right near EG29. A river along the top-right edge.
- **Civic buildings** around the central lake: mosque (with dome + minaret), police station, health centre. Schools where the map shows them (primary schools near EG1/EG2, EG3, EG25 and EG23 area; secondary school near EG10; Islamic school near EG24; integrated school complex near EG9). Kindergartens and community halls where labelled. Use a simple, distinct, low-poly model for each type.
- **Main roads**: Persiaran Diorea along the top, Persiaran Casuarina running east–west through the middle, with **two roundabouts** as on the map. Precinct roads inside each block.
- **Highway** along the right edge with a **toll plaza**, and a big road label "TO RAWANG" pointing north.
- Neighbouring areas outside the boundary shown as soft, desaturated, low-detail land with floating labels: "Sri Adjua" (top-left), "Desa Impian Merbau Sempak" (top-right).
- A large floating "ELMINA GREEN" title label near the centre, like the map.
- Each precinct has a floating label pill ("EG18") that faces the camera, scales with zoom and is clickable (clicking flies the camera to that precinct and shows a precinct info card: type, unit count, facilities, number of residents on the app).

### 3.3 Buildings — one base model per type, small variations
Build these as **reusable procedural components** with props for variation:
- `TerraceHouse` (DSLH) — 2 storeys, gable roof with dark tiles, white walls, a red-brick feature panel, a decorative breeze-block (lattice) screen panel, big dark-framed windows, car porch with a flat canopy, black sliding gate, low white boundary wall, small front lawn. Lot width driven by type (20/22/24 ft) and depth (70/75/80 ft). **Corner and end lots** get a side garden and an extra side window. Small per-house variation: brick panel left/right, screen panel on/off, a parked car of random colour or none, potted plants.
- `SemiD` (DSSD) — mirrored pair, wider, bigger garden.
- `ApartmentBlock` (RSKU) — mid-rise block, same palette, balconies, with a surface car park.
- `ShopLot` — 2–3 storey shophouse row with colourful awnings and shop signs with **invented** names (e.g. "Kopi Pagi", "Elmina Mart", "Daun Laundry").
- `CivicBuilding` variants listed above, plus `Guardhouse`, `Playground`, `BadmintonCourt`, `PocketPark`, `StreetLamp`, `Tree`, `Bench`.

Use **InstancedMesh** (or drei `<Instances>`) for repeated houses, trees and lamps. Merge static geometry where possible.

### 3.4 Fully detailed precinct: EG18
EG18 is the hero precinct (it is central and is DSLH 22×75). Model it at house-level detail:
- About **10 terrace rows × 10–14 houses** each, every house with a unique unit ID `EG18-001` … `EG18-1xx` shown on a small address plate.
- A **guardhouse with boom gate** at the entrance, a **pocket park**, a **playground**, a **badminton court** and a **BBQ/gazebo area** (these become bookable facilities later).
- Street lamps, trees along every road, parked cars, a few walking residents.
- Other precincts are rendered at **block level**: rows of simplified houses/blocks (lower poly, instanced) — they must still read clearly as the right building type from a distance.

### 3.5 Camera & controls
- Perspective camera at an isometric-like angle (~45–55° pitch). Smooth damped **pan (drag), zoom (wheel/pinch), rotate (right-drag / two-finger twist)**.
- Clamp: can't go below ground, can't tilt past ~70°, can't pan far outside the township boundary, zoom between "whole township" and "street level in front of a house".
- **Level of detail by zoom**: far = precinct blocks + labels only; mid = houses + trees; near = avatars, bubbles, address plates.
- **Tap/click a house** → it does a small bounce + outline glow and opens a **House card**: unit ID, house type, resident avatar + display name (respecting privacy settings), latest thought, buttons "Wave 👋", "Message", "View posts". Tapping your **own** house opens My Home (see §5.6).
- **Recenter button** (style from `06-recenter-button.png`: round, dark-grey, crosshair ring with a white arrow in the middle) in the bottom-left near the minimap. Pressing it smoothly flies the camera (~1.2 s ease-in-out) back to the user's house at a pleasant mid zoom and gives the house a little bounce. When the camera is already centred on the home, the button shows a subtle "active" state.
- **Minimap** bottom-left (as in `05`): a flat 2D top-down version of the township generated from the same data file, with a red location pin on the user's house, a rectangle showing the current camera view, zoom +/– buttons, and click-to-jump.
- Keyboard: WASD/arrow keys pan, Q/E rotate, +/- zoom, H = recenter home.

### 3.6 Performance targets
- 60 fps on a mid-range laptop, ≥30 fps on a recent mid-range phone.
- Initial JS bundle under ~1.5 MB gzipped; lazy-load dashboards.
- Use `frameloop="demand"` when nothing is animating if it helps, cap device pixel ratio at 2, cheap shadows (one directional light, baked-looking contact shadows for small items).

---

## 4. Avatars & thought bubbles

### 4.1 Bitmoji-style avatar creator
- Shown on first launch of a resident account (and editable later in Settings).
- Built from **layered SVG parts** so it's light and fully original: face shape, skin tone (wide range), eyes, eyebrows, mouth, hair style + colour, facial hair, glasses, **headwear including tudung (several styles/colours), songkok, cap**, top/clothing colour, expression.
- Live preview, randomise button, save.
- In the 3D world the avatar appears as a **camera-facing billboard sprite** (the SVG rasterised to a texture) standing on a small round coloured base in front of the resident's house, with a gentle idle bob. Your own avatar has a highlighted base ring and a small 🏠 badge (like `05`).
- Many residents can live in one house (family members) — show up to 2 avatars per house on the map and the rest on the House card.

### 4.2 Thought bubbles
- Residents post a short **thought** (max 80 characters, emoji allowed) from the composer at the bottom of the feed or from My Home.
- While the user is typing, their avatar shows a **"…" cloud bubble** exactly in the spirit of `04-thought-bubble.png`.
- After posting, a **white rounded cloud bubble** with the text pops up above their avatar with a springy scale-in animation, like in `05`. Bubbles stay for 24 hours (in the demo, newest thought per resident).
- To avoid clutter: only show bubbles at near/mid zoom, at most ~8–10 bubbles on screen (nearest/newest first), the rest collapse into a small "💬" dot that expands on hover/tap.
- Clicking a bubble opens that post in the feed panel with replies and reactions (❤️ 👍 😂 😮 🙏).
- Every post has a "Report" option; management can hide posts (moderation).

---

## 5. Features

Priority is **P0 → P1 → P2**. Items in §5.8 are a backlog — **do not build them** unless I ask; show them as "Coming soon" where they appear in navigation.

### 5.1 (P0) Emergency numbers panel — always visible
Red panel at the top of the right column (as in `05`), with icon, name, number and a red call button each. **Use exactly these numbers:**

| Service | Number | Note |
|---|---|---|
| Fire & Rescue (Bomba) | 994 | |
| Police | 999 | |
| Ambulance | 999 | |
| Air Selangor (water) | 15300 | 24 hours |
| TNB (electricity) | 15454 | |
| Sime Darby Property | 1-800-88-1118 | Toll-free, Mon–Fri 8.30am–5.30pm |
| Elmina Green Guardhouse | *(placeholder)* | Opens in-app guard chat |
| Management Office | *(placeholder)* | Opens in-app management chat |

- Call buttons use `tel:` links but **always show a confirm dialog first** ("Call Police (999)?") so nobody dials 999 by accident during a demo.
- Store numbers in `src/data/emergency.ts` so they can be updated in one place.
- On phone widths the panel collapses into a **red floating "SOS" button** (top-right) that opens it as a sheet.
- Include an **"Alert guardhouse"** button that creates a high-priority incident at the user's home location and makes it flash red on the guard dashboard.

### 5.2 (P0) Incident reports
Gamified flow:
1. Tap **Report** in the bottom toolbar → the cursor becomes a pin; tap the exact spot on the 3D map (defaults to "my house" if they skip).
2. Pick a category with big friendly icons: Security / suspicious person, Fire or smoke, Flooding, Fallen tree, Streetlight out, Pothole / road damage, Stray animals, Noise, Illegal dumping, Other.
3. Urgency: Low / Medium / Urgent. Description. Attach up to 3 photos (in the demo, store as local object URLs / base64 in the mock store).
4. Submit → a pulsing 3D marker (icon + colour by category) drops onto the map with a little bounce.
- Status lifecycle with a visual timeline: **Submitted → Acknowledged → In progress → Resolved** (+ Rejected with reason). Each change notifies the reporter.
- Residents see their own reports in full and other residents' reports only as non-sensitive public markers (e.g. "Streetlight out — In progress"). Security-type reports are visible only to the reporter, guards and management.
- "My Reports" list with filters.

### 5.3 (P0) Repair requests
- Tap **Repair** → choose **My unit** (defects inside/outside my house) or **Common area** (pick a location on the map).
- Categories: Plumbing / water pressure, Electrical, Roof leak, Wall cracks, Doors & windows, Tiles & flooring, Drainage, Landscaping, Other. Description, photos, **preferred inspection slots** (pick 2–3 time slots).
- A wrench marker appears on the house / location. Status timeline: **Submitted → Under review → Contractor assigned → Inspection scheduled → In progress → Completed → Resident confirms / reopens**. Resident can rate the job (1–5 stars) after completion.
- Management can assign a (fake) contractor, set the inspection date and post updates with photos.

### 5.4 (P0) Community feed (right panel, below emergency numbers)
- Tabs: **All / Neighbours / Announcements** (as in `05`). "Neighbours" = same precinct.
- Each item: avatar, display name, unit ID (respecting privacy), time ago, text, optional photo, reactions, replies count.
- Composer at the bottom: "Share your thoughts with neighbours…" with emoji picker and photo attach. Posting also creates the thought bubble (§4.2).
- Clicking a post flies the camera to that resident's house.

### 5.5 (P1) Chat with guards and management
- Two official channels per resident: **Guardhouse** and **Management**, plus 1-to-1 neighbour messages (only if both allow it in privacy settings).
- Chat UI with message bubbles, timestamps, read ticks, photo attach, quick replies ("Expecting a delivery", "Visitor arriving", "Thank you!").
- In the demo, guard/management accounts **auto-reply** with believable canned responses after 2–4 s if no real person is driving that role.
- **Cross-tab live demo:** use `BroadcastChannel` + localStorage so that if I open the resident view in one browser tab and the guard or management view in another, messages, new incidents and status changes appear live in both. This is important for demos.

### 5.6 (P1) My Home
Opened by tapping your own house or your profile card. Shows: unit ID, house type and lot size, household members (avatars), my reports, my repair requests, my suggestions, and **Decorate my home** (see 5.7).

### 5.7 (P1) Suggest & Decorate
- **Decorate my home (cosmetic, only my own plot):** choose gate colour, car model/colour, garden items (potted plants, frangipani tree, swing, BBQ grill, bicycle), festive decorations (Hari Raya pelita lights, Chinese New Year lanterns, Deepavali kolam/lamps, Christmas lights). Saved per user and visible to neighbours. No currency or coins — everything is free.
- **Suggest an improvement (public areas):** tap **Suggest** in the toolbar, pick an item from a palette (bench, tree, speed bump, street light, CCTV, bin, shelter/wakaf, playground equipment, pedestrian crossing, bicycle rack, "other"), place a **translucent ghost 3D object** on the map, add a short reason, submit. It becomes a **Suggestion ticket** sent to management (they get a notification).
- Other residents can **upvote** suggestions; management can mark them **Under consideration / Approved / Not planned** with a reply. Approved items turn solid on the map with a small "Coming soon" sign.

### 5.8 Backlog (do NOT build yet — "Coming soon")
Facility booking (badminton court, BBQ area, community hall), visitor registration & QR passes, events calendar & RSVPs, residents directory, announcements banner scheduling, maintenance fee statements, parcel/delivery log, marketplace/swap corner, lost & found, polls/surveys. Keep the data layer extensible so these slot in later.

---

## 6. Roles, demo login & dashboards

There is **no self sign-up**. In real life, management creates a resident's account when a unit is sold. For the demo:

- **Login screen** with the Elmina Green wordmark, an email/password form (mock — any password works for listed demo accounts) and three big **"Try demo as…"** buttons:
  - **Resident** — Daniel Lim, unit `EG18-028`
  - **Guard** — Encik Rahim, Guardhouse EG18
  - **Management** — Ms. Nurul, Elmina Green Management Office
- A small role switcher in Settings to jump between roles quickly.

**Resident** sees the main 3D game UI (§7).

**Guard dashboard** (same 3D map + a left drawer): live incident queue sorted by urgency with flashing SOS alerts, click to fly to location, change status, chat with residents, a simple visitor log (mock list).

**Management dashboard** (same 3D map + a full-height side panel, desktop-first):
- **Tickets board** (kanban) with tabs for Incidents / Repairs / Suggestions; drag cards between status columns; assign contractor; reply; attach photos.
- **Announcements**: compose title + body + optional image + target (all precincts or chosen ones). Published announcements appear in the Announcements tab and as a floating 📢 marker over the targeted precincts for 48 h.
- **Residents & units**: list/search units, **"Create resident account"** form (name, email, phone, unit ID, role: owner/tenant/family) that "sends" a mock invite and adds the resident to the map.
- **Moderation**: reported posts queue (hide / keep).
- **Overview** cards: open incidents, average resolution time, open repairs, top-voted suggestions, active residents this week.

---

## 7. Main resident UI layout (match `05-game-snapshot.png`, with the changes in §11)

**Desktop (≥1024 px)** — 3D world fills the screen; UI floats on top with rounded, slightly translucent white panels and soft shadows:
- **Top-left**: Elmina Green wordmark card (leaf icon + "ELMINA GREEN" + small "by Sime Darby Property"; see §11 about the logo). Next to it the **profile card**: avatar, "My Home", unit `EG18-028`, and a **notifications bell** with unread count (replaces the coin counter).
- **Top-centre**: weather + date/time pill: sun/cloud icon, temperature (mock, e.g. 32°C, varies slightly by hour), "Tue, 20 Oct 2026 · 7:24 PM" in Malaysia time, live-updating.
- **Top-right**: nav bar with icons + labels: **Residents, Community, Events (Coming soon), Facilities (Coming soon), Settings**.
- **Right column** (~360 px): **Emergency Numbers** (red, §5.1) on top, **Community feed** (§5.4) below, scrollable, composer pinned at the bottom.
- **Bottom-left**: **minimap** with zoom +/– and the **recenter** button.
- **Bottom-centre**: game-style **toolbar** with big icons: **Select** (default), **Report**, **Repair**, **Suggest**, **Decorate**, **Community**, **More**. The active tool is highlighted blue (as in `05`). Each tool changes the cursor and shows a small hint toast ("Tap where the problem is").
- Floating thought bubbles, markers and labels in the world as described above.

**Phone (<768 px)**:
- 3D world full screen; compact top bar (logo, weather/time, bell, avatar).
- Red **SOS** floating button top-right opens Emergency Numbers sheet.
- Feed becomes a **draggable bottom sheet** (peek / half / full).
- Toolbar becomes a bottom tab bar (scrollable if needed); minimap hidden behind a small map button; recenter button stays visible bottom-left above the sheet.
- All touch targets ≥44 px; pinch to zoom, two-finger rotate.

**General**: smooth, springy micro-animations (buttons bounce, panels slide), toast notifications, empty states with friendly illustrations, skeleton loaders. Respect `prefers-reduced-motion`. Keyboard focus styles and aria-labels on all controls. Good contrast on all text over the 3D scene.

---

## 8. Data & architecture

```
src/
  app/            # routing, providers, role gate
  world/          # R3F scene: Terrain, Roads, Water, Precinct, buildings/, Avatars, Bubbles, Markers, CameraRig, Minimap
  ui/             # HUD panels, toolbar, sheets, dialogs, dashboards
  features/       # incidents/, repairs/, suggestions/, feed/, chat/, avatar/, home/, admin/, guard/
  data/           # township.ts, emergency.ts, seed/ (mock residents, posts, tickets…)
  services/       # api.ts interface + mockApi.ts implementation
  store/          # Zustand slices
  types/          # shared TypeScript types
```

- Define typed models: `User`, `Role`, `Unit`, `Precinct`, `Avatar`, `Post`, `Reply`, `Reaction`, `Incident`, `RepairRequest`, `Suggestion`, `Ticket status history`, `Message`, `Channel`, `Announcement`, `Notification`, `PrivacySettings`.
- **All reads/writes go through `services/api.ts`** (async functions returning Promises with a small fake delay). `mockApi.ts` implements it with the seed data + **localStorage persistence** (so demo changes survive a refresh) + BroadcastChannel sync (§5.5). Add a **"Reset demo data"** button in Settings.
- **Seed data**: ~40 fictitious residents spread across precincts (most in EG18), with a natural mix of Malaysian names (e.g. Aisyah, Hafiz, Wei Ling, Daniel, Priya, Arjun, Mei, Sofia, Ken, Siti), each with a generated avatar, unit ID and 0–2 posts; ~15 feed posts, ~8 incidents in various states, ~6 repair requests, ~6 suggestions with votes, 3 announcements, a few chat threads. All names are invented — no real people.

---

## 9. Privacy & safety (even in the demo)
- **Privacy settings** per resident: display name (full name / first name only / initials), show my unit ID to neighbours (on/off), show my avatar on the map (on/off — if off, the house shows a neutral house icon), allow neighbour DMs (on/off).
- Security incidents are never shown publicly (§5.2).
- Never show phone numbers or emails of residents to other residents.
- Confirm dialog before any `tel:` call (§5.1).

---

## 10. Build phases (stop after each one for my review)

**Phase 1 — World & shell**
Project setup, Tailwind, lint, folder structure, mock API skeleton. Whole township from `township.ts` (precincts, roads, roundabouts, lakes, civic buildings, highway, toll plaza, labels), building components, EG18 at full detail, camera controls with clamps and LOD, day/night, minimap, **recenter**, full HUD layout (desktop + phone) with the **Emergency Numbers panel working**, demo login + role switcher.
*Done when:* I can pan/zoom/rotate around a recognisable Elmina Green, click precinct labels and houses, press recenter to fly to EG18-028, and call buttons show confirm dialogs.

**Phase 2 — People**
Avatar creator, resident avatars on the map, thought bubbles (typing "…" + posted cloud), community feed with tabs, reactions, replies, composer, House card, privacy settings, notifications bell.
*Done when:* posting a thought makes a bubble pop up over my avatar and the post appears in the feed.

**Phase 3 — Incidents, repairs & dashboards**
Report and Repair flows with map pins, photo attach, status timelines, Alert guardhouse, Guard dashboard, Management tickets board, chat channels with auto-replies, cross-tab live sync.
*Done when:* with a resident tab and a management tab open, I can submit a repair, see it appear live on the board, move it to "Contractor assigned", and see the resident's timeline update.

**Phase 4 — Suggest, decorate, announcements & polish**
Suggest mode with ghost objects + upvotes + management responses, Decorate my home, announcements with 📢 markers, resident account creation, moderation, overview cards, "Coming soon" stubs for §5.8, performance pass, accessibility pass, phone polish, README, `vercel.json`.
*Done when:* `npm run build` passes with no errors/warnings that matter, and the app works when deployed to Vercel. Then tell me the exact steps to deploy (`vercel` CLI or Git import).

---

## 11. Deliberate changes vs. the snapshot (`05-game-snapshot.png`)
1. **No coins / currency anywhere.** The coin counter is replaced by a notifications bell.
2. **"SYABAS" is now "Air Selangor"** (number 15300 unchanged). SYABAS was replaced by Air Selangor years ago.
3. **Sime Darby Property number corrected to 1-800-88-1118** (official toll-free line). The snapshot's "1800 222 733" is wrong.
4. **Logo:** the snapshot reads "SIME DARY" — a typo. Do **not** recreate or imitate Sime Darby Property's official logo. Use a simple original leaf icon + "ELMINA GREEN" wordmark + small text "by Sime Darby Property", and load it from `public/brand/logo.svg` so the official logo can be dropped in later **once permission to use the branding is confirmed**.
5. **Toolbar:** "Build" and "Road" are removed (residents can't build on real property). Replaced with **Report, Repair, Suggest, Decorate**.
6. **Nav:** "Shop" replaced with **Facilities (Coming soon)**.
7. **Demo home moved from EG15 to EG18-028**, because EG15 is a shop-lot precinct on the real map, not houses.

---

## 12. Quality bar
- TypeScript strict, no `any` unless justified, no console errors or React warnings.
- Components small and reusable; 3D components never import UI state directly except through the store.
- Every interactive element works with mouse, touch and keyboard.
- Before ending each phase, take a screenshot-level look at both desktop and phone layouts and fix overlaps, clipped text and unreadable labels.
