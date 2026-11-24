# Salon Queue — Project Brief & Scope

## Problem
On weekend evenings, customers sit in the salon for an hour or two without knowing
whose turn is next. People argue about who arrived first, some walk out, and the
receptionist spends the whole time answering "How long more?". A shared live queue
removes the uncertainty.

## Users
- **Customer** — joins from their own phone, waits anywhere in the salon, watches
  their token move up.
- **Receptionist / owner** — adds walk-ins, calls the next customer for a barber,
  marks no-shows, closes the queue.
- **Barber** — sees the person in the chair, starts and finishes the service,
  toggles available/on break.
- **Owner** — edits services and prices, sets who is on duty, reads today's stats.

## Must-have features
1. Join the queue from a phone: name, validated 10-digit phone, service(s) and a
   barber preference (or "Any barber — fastest").
2. Live My Status: token, position, estimated wait, "Start coming" alert and a
   full-screen "It's your turn!" alert.
3. Reception dashboard (tablet): barber cards, ordered waiting list, add walk-in,
   Call next, No-show and Cancel actions.
4. Barber view (phone): current customer with a timer, Start → Done, next customer,
   Available / On break toggle.
5. Waiting-area TV (/display): who is with which barber, the next 5 tokens, and a
   gold flash + chime when a token is called.
6. Owner settings (/admin): service name (EN/GU), minutes, price, on/off; barbers
   on duty; queue open/closed; today's stats.
7. English / Gujarati toggle on every screen.
8. Realtime sync across phone, tablet, barber phone and TV in under 5 seconds.

## Don't build
Online payments or billing checkout, future-date appointments, SMS/WhatsApp
notifications, loyalty points, membership logins, multiple branches, photo uploads.

## Look & feel
Premium salon with a warm, human feel: espresso `#241A14` / `#3A2820`,
copper-gold `#C8892F` / `#E7B76A`, cream text `#F5EEE4`, clean rounded cards,
large touch targets (44px+), mobile-first; English and Gujarati labels.

## Definition of done
All 7 screens work against the same live data, the checklist in
`docs/03-flows-rules.md` passes, the app builds for production, and the live
Vercel URL is written at the top of `README.md`.
