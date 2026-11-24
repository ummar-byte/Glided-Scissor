# Salon Queue — The Gilded Scissor

**Live demo:** https://salon-queue-seven.vercel.app

**Staff test PIN:** `4821` (reception, barber, owner screens)

A live queue management system for one salon. Customers join from their phone and watch
their token move up; reception calls the next customer for each barber; barbers start and
finish services; a TV shows who is being served and who is next; the owner manages
services, barbers and opening hours. Everything stays in sync across windows in < 5 s.

## Screens

| Screen | URL | User |
| --- | --- | --- |
| Home | `/` | customer |
| Join queue | `/join` | customer |
| My status | `/status/:id` | customer |
| Reception dashboard | `/reception` | receptionist (PIN) |
| Barber view | `/barber/:name` | barber (PIN) |
| Waiting-area TV | `/display` | everyone |
| Owner settings | `/admin` | owner (PIN) |

## Tech stack

- React 19 + Vite + TypeScript + Tailwind CSS v4
- React Router for the 7 screens
- **Supabase** (free tier) for PostgreSQL storage and realtime subscriptions. No Express,
  no SQLite, no Socket.IO — Supabase Realtime keeps phone, tablet, barber and TV in sync.
- Vitest for the queue-rule unit tests
- Vercel for hosting (static SPA)

The canteen-lab prompt sequence (setup → screens → persistence → realtime → admin → QA →
deploy) was adapted to the salon domain. The design documents are in `docs/`, and
`AGENTS.md` is the instruction sheet an AI agent reads first.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional: add Supabase URL + anon key for live persistence
npm run dev
npm test                     # 13 queue-rule tests
npm run build
```

Without Supabase credentials the app runs in **demo mode**: data is seeded in
`localStorage` and synchronised between browser tabs, so all seven screens can be tested
offline. Add the two environment variables to switch to shared Postgres + realtime.

## Database setup (Supabase free tier)

1. Create a project at <https://supabase.com>.
2. Run `supabase/schema.sql` in the SQL Editor (tables, seed data, secure token RPCs,
   realtime publication).
3. Copy Project Settings → API → Project URL and anon key into `.env.local` and into
   Vercel → Settings → Environment Variables.
4. For a real deployment, enable RLS and replace the lab-only open policies with rules
   that suit your authentication setup. The staff PIN in this lab is UI-only.

## Queue rules

All rules are centralised in `src/lib/queue.ts`: sequential daily tokens, first-come
first-served, barber preferences are never overridden, one barber at a time, one active
spot per phone, 10-minute no-show window, 30-minute pre-close cutoff, and wait-time =
minutes ahead ÷ barbers working. See `docs/03-flows-rules.md` for the full checklist.

## Language

Every label has English and Gujarati text; the toggle is in the top-right of every screen
(the TV uses the saved language).

## Known limitations

- Lab-only staff PIN is compared in the browser; it is not authentication.
- Online joining is by phone-number identity only (no OTP), per the lab scope.
- No payments, future appointments, SMS/WhatsApp, loyalty or multiple branches (explicitly
  out of scope in `docs/01-brief.md`).
