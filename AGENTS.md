# AGENTS.md — Salon Queue Management

A queue app for a single salon: customers join from their phone, see their position
and wait time, get called when a barber is free; reception and barbers manage the
queue; a TV displays the live state. This is a Vibe Coding Lab project.

## Read first (in this order)
- `docs/01-brief.md` — scope, users, must-haves, and the explicit don't-build list
- `docs/02-screens.md` — every screen's layout, elements and behaviour
- `docs/03-flows-rules.md` — user flows, queue rules, and the test checklist

## Stack
- React 19 + Vite + TypeScript + Tailwind CSS
- Supabase (free tier) for the database **and** realtime sync — no Express, no SQLite,
  no Socket.IO. Supabase Postgres persists on Vercel; SQLite does not.
- React Router for the 7 screens
- `npm install`, `npm run dev`, `npm run build`, `npm test`
- Hosting: Vercel (static SPA). The live URL must be the first line after the
  title in `README.md`, with the staff test PIN right below it.

## How to work
- Build **one screen or one feature per task**. Do not touch other screens.
- Theme: warm espresso `#241A14` / `#3A2820` + copper-gold `#C8892F` / `#E7B76A`,
  cream text `#F5EEE4`; rounded cards; premium, human-feeling, mobile-first.
- Every visible label goes through the EN/GU language file — no hard-coded text.
- Keep all queue rules in `src/lib/queue.ts` and reuse them everywhere.
- Never add anything from the "Don't build" list (payments, appointments, SMS,
  loyalty, multiple branches).
- Use real-looking Indian names and ₹ prices in seed data.
- After each task: list changed files and how to test the change.
- When a bug is reported: explain the cause first, then fix it, then retest.
- Do not claim a feature works unless it has actually been tested.
