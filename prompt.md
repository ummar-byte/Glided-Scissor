# Prompt Log — The Gilded Scissor Salon Queue

A record of the instructions used to build this project, in order — including attempts
that failed — plus a set of new professional prompts for taking the site to a
production-quality finish.

## How to read this file

- **Verbatim** — exact wording from the chat.
- **Reconstructed** — paraphrased from the project brief and session checkpoint because
  the original wording is no longer available in this session.
- **New / professional** — prompts written for future work. These were **not** used to
  build the current version.

---

## 0. Source inputs

| Input | What it provided |
| --- | --- |
| `2.pdf` | The salon brief: 7 screens, queue rules, users, scope |
| `canteen lab prompts.docx` | The prompt sequence: setup → screens → persistence → realtime → admin → QA → deploy |
| User decisions | Supabase (free Postgres + Realtime), Vite + React + TypeScript (no Express/SQLite/Socket.IO), staff login handled in-app, repo name `ummar-byte/salon-queue` |

---

## 1. Prompts used, in order

### Phase 1 — Understand the brief and write the docs
1. **(reconstructed)** "Read and extract `2.pdf` and `canteen lab prompts.docx`. Adapt the
   canteen-lab prompt sequence to the salon domain and write `AGENTS.md`,
   `docs/01-brief.md`, `docs/02-screens.md`, `docs/03-flows-rules.md`."
2. **(reconstructed)** "Keep the scope tight: no payments, appointments, SMS/WhatsApp,
   loyalty, membership logins or multiple branches. Use real-looking Indian names and ₹
   prices in seed data."

### Phase 2 — Scaffold and verify the toolchain
3. **(reconstructed)** "Scaffold the app with React 19, Vite, TypeScript, Tailwind CSS v4,
   React Router, Supabase JS and Vitest. Confirm `npm run build` and `npm test` pass."
4. **(reconstructed)** "Create `src/lib/queue.ts` as the single home for all queue rules
   (status transitions, position, wait estimate, no-show window, joining hours) and reuse
   it everywhere."

### Phase 3 — Build the 7 screens, one per task
5. **(reconstructed)** "Build the Home screen: salon name, open/closed state, waiting
   count, estimated wait, big Join Queue button, barber status cards."
6. **(reconstructed)** "Build the Join screen: service selection (max 3), barber
   preference, customer name and phone validation, duplicate-phone handling, expected
   wait, confirmation."
7. **(reconstructed)** "Build My Status: token, position, estimated wait, status banners,
   full-screen 'It's your turn' takeover, cancel action."
8. **(reconstructed)** "Build Reception: per-barber 'Call next', waiting list, long-wait
   flag, no-show/cancel actions, walk-in join form, queue open/close."
9. **(reconstructed)** "Build the Barber screen: current token, start/done actions, next
   ticket, availability toggle."
10. **(reconstructed)** "Build the TV display: now serving per barber, up-next tokens and
    estimated times, flashing called banner, clock."
11. **(reconstructed)** "Build Owner Settings: edit services (name EN/GU, minutes,
    price, active), barbers, staff PIN and queue open/close."
12. **(reconstructed)** "Add a staff PIN gate in front of Reception, Barber and Admin."

### Phase 4 — Language, persistence and realtime
13. **(reconstructed)** "Put every visible label in `src/i18n.ts` with English and Gujarati
    strings. No hard-coded UI text."
14. **(reconstructed)** "Add a demo backend using localStorage so the app works before
    Supabase is configured."
15. **(reconstructed)** "Replace the demo backend with Supabase: tables, seed data and
    Realtime subscriptions so phone, reception, barber and TV stay in sync in < 5 s."
16. **(reconstructed)** "Write unit tests for the queue rules and keep them passing."

### Phase 5 — GitHub, database and hosting
17. **(reconstructed)** "Create the GitHub repo `ummar-byte/salon-queue` on `master` and
    push the code."
18. **(reconstructed)** "Create the Supabase project, apply `supabase/schema.sql` with
    psql, and verify the `join_queue` and `call_next` RPCs plus duplicate-phone behaviour."
19. **(reconstructed)** "Deploy the static SPA on Vercel, add `VITE_SUPABASE_URL` and
    `VITE_SUPABASE_ANON_KEY`, disable SSO deployment protection, and add an SPA rewrite in
    `vercel.json` so deep links work."
20. **(reconstructed)** "Put the live URL on the first line after the README title and the
    staff test PIN directly below it."

### Phase 6 — Live QA and polish
21. **(reconstructed)** "Test the deployed app end to end: join creates a token, My Status
    updates by realtime, call-next rules, Barber Start/Done, TV sync, language toggle and
    waiting-time recalculation."
22. **(reconstructed)** "Fix the Gujarati wait labels (`formatWait`) and the status link,
    then commit, push and redeploy."
23. **(verbatim)** "so all the things i mentioned working perfectly right and if we can
    change the URL Only to GlidedScissor something and make the UI colour more to like
    human formatted and also change the logo of the website also"
24. **(verbatim — answers to my design questions)** "gildedscissor.vercel.app",
    "Warm espresso + cream", "SVG scissors monogram", "Yes, remove old URL".
25. **(verbatim)** "its a small project so i think this is correct for now"
26. **(verbatim)** "im not asking about the app im asking about my github and all like it
    wont be accessible without my permission"
27. **(verbatim)** "can you make one prompt.md file and add to the github repo it will
    include - every prompt you used, in order (including the ones that didn't work not from
    this chat i want you to add some professsional prompt for making this website so that
    it will look professional first show me that file if iagree then push it to the repo"
28. **(verbatim)** "can you also add the test cases run on this and one thing is not working
    in website the name of the barbers are not apprearing in gujarati in the the website can
    you check and reedit the doc also"

---

## 2. Attempts that did not work

| # | Attempt | What went wrong | Resolution |
| --- | --- | --- | --- |
| 1 | `git push origin master` | `fatal: could not read Username for 'https://github.com': No such device or address` | Ran `gh auth setup-git`; pushes then worked |
| 2 | `vercel git connect --yes` | `Failed to link ummar-byte/salon-queue. You need to add a Login Connection to your GitHub account first. (400)` | **Still unresolved.** Auto-deploy on push is not connected; deploys are manual |
| 3 | `vercel domains check gildedscissor.vercel.app ...` | `Invalid domain name(s)` — that command only checks purchasable domains | Renamed the Vercel project and used `vercel alias set` instead |
| 4 | Project rename alone | Production alias stayed `salon-queue-seven.vercel.app` | Added `vercel alias set ... gildedscissor.vercel.app` and `vercel domains add ...` |
| 5 | `vercel alias remove salon-queue-seven.vercel.app` | `action_required / confirmation_required` | Asked the user, then ran with `--confirm-name` |
| 6 | Old alias after final deploy | The old alias was recreated on the next production deployment | Removed it again; it currently returns 404. It may reappear after another manual deploy |
| 7 | `vercel domains remove salon-queue-seven.vercel.app` | `Domain not found ...` | Left it; alias removal was enough |
| 8 | `npm run dev` from workspace root | `Shell.NotFoundError` — no project there; also a shell-harness glitch | Ran it inside `salon-queue/`; server started on port 5173 |
| 9 | Background `npm run dev` shells | `Shell.NotFoundError` when the harness lost the background shell between turns | Use a normal terminal for a long-lived dev server |
| 10 | Barber names in Gujarati | The `Barber` type had only `name` (English); `services` had `name_en` / `name_gu`, so names stayed English | Added `name_gu` to the type, DB, demo seed and all screens; added a central `barberName(barber, lang)` helper with an English fallback, plus 2 new tests |
| 11 | `prompt.md` location | The project was moved to `Desktop/Projects/Glided Scissor`, leaving `prompt.md` in the old folder | Moved the doc into the real project folder and updated it here |

---

## 3. Test cases run on this project

### 3.1 Automated unit tests — `npm test` (Vitest, `src/lib/queue.test.ts`)

Result at the time of writing: **15/15 passing**.

| # | Group | Test |
| --- | --- | --- |
| 1 | Tokens and validation | formats tokens (`S-14`) |
| 2 | Tokens and validation | accepts only valid Indian 10-digit phones |
| 3 | Tokens and validation | validates names |
| 4 | Localized barber names | shows the Gujarati name when language is Gujarati |
| 5 | Localized barber names | shows the English name in English and when Gujarati is missing |
| 6 | Queue order and waiting time | orders waiting tickets by join time |
| 7 | Queue order and waiting time | computes 1-based position only for waiting tickets |
| 8 | Queue order and waiting time | divides the minutes ahead by working barbers |
| 9 | Call-next rules | never gives a Ravi-only customer to Amit |
| 10 | Call-next rules | blocks a barber who already has a called customer |
| 11 | Call-next rules | blocks barbers on break or off duty |
| 12 | Call-next rules | only allows cancel while waiting or called |
| 13 | Call-next rules | enforces the 10-minute no-show window |
| 14 | Opening hours and stats | closes online joining 30 minutes before close (IST) |
| 15 | Opening hours and stats | computes today stats |

### 3.2 Build check — `npm run build`

`tsc -b && vite build` passes. The only output warning is Vite's advisory that the single
JS chunk is over 500 kB (the "Performance" prompt below addresses this).

### 3.3 Manual live QA performed

- Join created token `S-2`; a duplicate phone returned the existing token.
- My Status updated through Supabase Realtime; waiting-time estimate recalculated.
- Call-next respected barber preference and blocked busy/on-break barbers.
- Barber Start/Done and the TV display stayed in sync.
- English/Gujarati toggle verified live (`about 15 min` / `લગભગ 15 મિ.ન.`).
- Deep links (`/join`, `/status/:id`, `/display`) returned 200 after SPA rewrites.
- New URL returned 200 and the old URL returned 404 after alias cleanup.
- Barber names in Gujarati verified after the fix: `રવિ`, `અમિત`, `ઇમરાન`.

### 3.4 Detailed test scenarios (how each case was acted out)

| # | Scenario | Steps performed | Expected | Result |
| --- | --- | --- | --- | --- |
| 1 | New customer joins online | `/join` → choose Haircut → name `Kunal Shah` → phone `9876543210` → submit | Token created, redirected to `/status/:id`, position and wait shown | Passed (token `S-2`) |
| 2 | Duplicate phone while token active | Submit a second join with the same phone | RPC returns the existing ticket; no duplicate row | Passed |
| 3 | Realtime status change | Reception calls next for Ravi; watch the customer tab without refreshing | Status banner changes within < 5 s | Passed |
| 4 | Barber preference | Customer requests Ravi only; Amit calls next | Amit gets the next generic ticket; Ravi gets the preferred ticket | Passed (also unit-tested) |
| 5 | Barber Start / Done | Barber clicks Start, then Done | Status moves `called → in_chair → done`; TV clears the chair | Passed |
| 6 | TV synchronisation | Call a token, then open `/display` | Called token and barber appear; up-next list recalculates | Passed |
| 7 | Staff PIN gate | Open `/reception`, enter `4821` | Gate blocks first, then allows access | Passed (UI-only gate) |
| 8 | Language switch | Toggle EN → GU on Home and My Status | All labels, wait string and barber name switch | Passed after the `name_gu` fix |
| 9 | Deep links | Open `/join`, `/status/:id`, `/display` directly | Each returns 200 and renders the right screen | Passed after `vercel.json` rewrite |
| 10 | Custom URL | `curl` new and old production URLs | New 200, old 404 | Passed |
| 11 | Gujarati barber names | Toggle to GU and read Home / TV / My Status | Names read `રવિ`, `અમિત`, `ઇમરાન` from `name_gu` | Passed; DB values confirmed by `psql` |

### 3.5 Edge cases covered

| Edge case | Where covered | Expected behaviour |
| --- | --- | --- |
| 9-digit, 11-digit and non-`6-9` phone numbers | Unit test + join validation | Rejected |
| Name shorter than 2 characters | Unit test + join validation | Rejected |
| More than 3 services selected | Join screen | Fourth selection ignored |
| Same phone joining twice while active | Unique partial index + `join_queue` RPC | Existing token returned |
| Position for `called` / `in_chair` tickets | Unit test | Position is 0 (not waiting) |
| Barber on break or inactive | Unit test + Reception button state | Cannot call next |
| Barber who already has a called customer | Unit test | Cannot call next again |
| Called ticket older than 10 minutes | Unit test | No-show action becomes available |
| Joining after 20:30 IST or with `queue_open = false` | Unit test | Online joining disabled; walk-in still allowed |
| Gujarati barber name missing/empty | Unit tests | Falls back to English name |
| Barber lookup from `/barber/:name` | Barber screen | Matched by English name (URL-stable) |
| Token counter per day | Schema + RPC | Token numbers continue per `token_day` |
| Midnight token rollover | **Not manually tested** | Counter keyed by `token_day`; needs a live day-boundary check |

### 3.6 How the tests were executed

- **Automated rules:** `npm test` → Vitest run of `src/lib/queue.test.ts` (15 tests).
- **Type/build safety:** `npm run build` → `tsc -b && vite build`, then inspect the emitted bundle.
- **Database:** `psql` applied `supabase/schema.sql` and the `001_barber_name_gu.sql` migration;
  `select name, name_gu from public.barbers` confirmed the three Gujarati names.
- **Live UI:** in-app browser on `https://gildedscissor.vercel.app`; DOM/computed-style checks
  for colours, logo and localized strings; two browser tabs used to observe realtime sync.
- **URLs/status codes:** `curl -o /dev/null -w '%{http_code}'` for new URL, old URL, logo and deep links.
- **Deployment:** `vercel --yes --prod`; `vercel alias list` to inspect production aliases.

---

## 4. New / professional prompts (not used in this build)

These are ready-to-use prompts for a future pass. Each one targets a specific quality
dimension without changing the queue rules.

### 4.1 Design system and brand polish
> Audit the current UI against a premium salon brand standard. Keep the warm espresso and
> copper-gold palette, but produce a single documented design-token spec: type scale,
> spacing scale, radius, elevation, motion durations and semantic colours (success,
> warning, danger, neutral). Apply the tokens consistently across all 7 screens, remove
> one-off hard-coded colours, and show before/after screenshots for Home, Join and TV.

### 4.2 Mobile-first responsive QA
> Test every screen at 320, 375, 768 and 1440 px. Fix any horizontal overflow, clipped
> labels, cramped tap targets or unreadable token numbers. Ensure all interactive elements
> are at least 44×44 px and that the Gujarati text does not break at narrow widths.
> Report the exact viewports fixed.

### 4.3 Accessibility (WCAG AA)
> Run an accessibility pass on all screens. Fix colour-contrast failures, add meaningful
> ARIA labels and roles, ensure keyboard-only navigation works through Join, Status,
> Reception and Barber, verify focus rings are visible, and check that screen readers can
> announce token numbers and status changes. Include an audit report with findings and
> fixes.

### 4.4 Copy and state design
> Review every screen's microcopy, empty state, loading state and error state. Rewrite them
> in clear, warm, human language that fits a salon, keeping every string in `src/i18n.ts`
> for both English and Gujarati. Do not invent features; only improve wording and feedback.

### 4.5 Typography and Gujarati polish
> Improve typographic hierarchy: consistent heading weights, line heights and letter
> spacing. Verify the Gujarati font loads and renders correctly on every screen, including
> numbers, prices and time labels. Avoid mixing mismatched fonts between English and
> Gujarati.

### 4.6 Performance
> Reduce the initial JavaScript bundle by route-based code splitting so the customer-facing
> Home/Join screens load fast. Optimise font loading, remove unused imports, and measure
> with Lighthouse. Report bundle sizes and scores before and after; do not trade away
> realtime behaviour.

### 4.7 Component architecture
> Refactor repeated UI patterns (status banners, avatar circles, stat cards, pill buttons,
> tables) into reusable components with clear props. Keep all queue rules in
> `src/lib/queue.ts`. Add a short component catalogue so future screens can be assembled
> quickly.

### 4.8 End-to-end testing
> Add Playwright end-to-end tests for the 7 screens: join → duplicate phone → call next →
> barber start/done → TV update → cancel/no-show → language toggle. Assert realtime updates
> where practical and keep the existing 13 unit tests green.

### 4.9 Security hardening
> Tighten the Supabase RLS policies: replace the current `lab_all` full-access policies
> with least-privilege rules, keep the anon key public-safe, and move staff actions behind
> real authentication. Verify that a customer cannot call staff RPCs. Document what each
> role can read and write.

### 4.10 CI/CD
> Add a GitHub Login Connection in Vercel and connect the project so every push to `master`
> creates a preview/production deployment. Add a GitHub Actions check that runs
> `npm run build` and `npm test` on pull requests. Remove the need for manual `vercel
> --prod` deploys.

### 4.11 Error handling and observability
> Add consistent error toasts, retry actions for failed Supabase calls, and a visible but
> calm offline/loading state. Log unexpected failures to the console with enough context to
> debug, without exposing keys or customer phone numbers.

### 4.12 Submission README polish
> Update the README for a lab submission: one-line live URL and PIN at the top, a short
> feature list mapped to the PDF requirements, a screens table, setup steps, test commands,
> and a short note on architecture decisions. Add screenshots if the lab allows them.

---

## 5. Current state at the time of writing

- Live URL: https://gildedscissor.vercel.app
- Old URL: https://salon-queue-seven.vercel.app (returns 404)
- Repo: https://github.com/ummar-byte/salon-queue (branch `master`)
- Local project folder: `/home/ummarbyte/Desktop/Projects/Glided Scissor`
- Build: passing · Tests: 15/15 passing (including the 2 barber-name tests)
- Barber names are localized in English/Gujarati on Home, Join, My Status, Reception,
  Barber, TV and Owner settings.
- Known limits: staff PIN is UI-only; auto-deploy on push is not connected; Supabase RLS
  is intentionally open (`lab_all`) for the lab demo.

---

## 6. Final project requirements (definition of done)

Derived from `2.pdf`, the canteen-lab prompt sequence and the decisions made in chat.

| # | Requirement | Where it lives | Status |
| --- | --- | --- | --- |
| 1 | 7 screens: Home, Join, My Status, Reception, Barber, TV display, Owner Settings | `src/screens/`, `src/App.tsx` | Done |
| 2 | Customer can join with name, valid 10-digit phone, up to 3 services and barber preference | `src/screens/Join.tsx`, `supabase/schema.sql` (`join_queue`) | Done |
| 3 | One active token per phone; token numbers reset per day | Partial unique index + `counters` table | Done |
| 4 | Customer sees position, estimated wait, status and "your turn" takeover | `src/screens/Status.tsx`, `src/lib/queue.ts` | Done |
| 5 | Reception calls the next eligible customer per barber; no-show after 10 min | `src/screens/Reception.tsx`, `call_next` RPC | Done |
| 6 | Barber starts and finishes the service; can toggle availability | `src/screens/Barber.tsx` | Done |
| 7 | TV shows now serving, up next and estimated times; flashes on a call | `src/screens/Display.tsx` | Done |
| 8 | Owner edits services, barbers, PIN, opening hours and queue open/close | `src/screens/Admin.tsx` | Done |
| 9 | Staff-only screens behind a PIN gate | `src/components/StaffGate.tsx` | Done (UI-only) |
| 10 | All queue rules centralized and unit-tested | `src/lib/queue.ts`, `queue.test.ts` (15 tests) | Done |
| 11 | Persistence on Supabase free Postgres; no Express/SQLite/Socket.IO | `src/data/remote.ts`, `supabase/schema.sql` | Done |
| 12 | Realtime sync across phone, reception, barber and TV in < 5 s | Supabase Realtime channel in `remote.ts` | Done |
| 13 | Demo localStorage backend for local use without Supabase | `src/data/demo.ts` | Done |
| 14 | English/Gujarati on every visible label, including barber names and specialities | `src/i18n.ts`, `barberName()` helper | Done |
| 15 | Warm espresso + copper-gold premium theme, mobile-first, 44px+ targets | `src/index.css` | Done |
| 16 | Custom GS scissors logo in header, TV and favicon | `public/logo.svg`, `index.html` | Done |
| 17 | SPA deep links work on Vercel | `vercel.json` rewrite | Done |
| 18 | Public live URL on first line of README, staff PIN below it | `README.md` | Done |
| 19 | GitHub repo with committed source and docs | `ummar-byte/salon-queue`, `master` | Done |
| 20 | Not built: payments, appointments, SMS/WhatsApp, loyalty, multiple branches | Scope guard in `AGENTS.md` / `docs/01-brief.md` | Intentionally excluded |
