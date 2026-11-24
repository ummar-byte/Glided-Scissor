# Screens & Features

All screens share the charcoal + gold theme, the EN/GU toggle in the top bar, and
large tap targets. Empty and error states are described per screen.

---

## Screen 1: Home — `/`
**Who:** customer, just arrived or scanning a QR sticker.
**Top to bottom:**
- Salon wordmark "The Gilded Scissor" with a small scissors mark.
- Status badge: `Open · Closes 9 PM` (green dot) or `Queue closed` (amber dot).
- Live card: "6 people waiting · about 50 min" — recalculates on every change.
- Barber chips with live status: `Ravi · busy`, `Amit · free`, `Imran · on break`.
- Big gold button **[ Join Queue ]** → `/join`. When closed it is disabled and the
  card explains "Online joining closes 30 min before closing. Walk-ins welcome."
- Small link row: [ My status ] [ Staff ] (staff goes to a PIN gate).
**Mobile:** single column, sticky bottom Join button.
**Empty state:** "No one waiting — walk right in!" with the badge showing Open.

## Screen 2: Join Queue — `/join`
**Who:** customer.
- Title + short instruction.
- Name (required, min 2 chars) and Phone (exactly 10 digits, numeric only).
- Service cards, multi-select **max 3**: Haircut 30 min ₹150, Beard trim 15 min
  ₹80, Hair spa 45 min ₹400, Colour 60 min ₹900, Shave 20 min ₹120,
  Kids cut 20 min ₹120. Disabled/hidden when the owner turns a service off.
- Barber picker: first card **Any barber (fastest)**, then one card per on-duty
  barber (name, speciality, status). Barbers on break are selectable but show
  "Ravi is on break — you may wait longer."
- Sticky live summary: "Total 45 min · ₹230 · Expected wait ~35 min". Updates on
  every selection using the rule in `docs/03-flows-rules.md`.
- **[ Confirm ]** → creates token → `/status/:id`.
- Validation errors appear inline in red; Confirm stays disabled until valid.
**Error state:** if the phone already has an active token, show a banner with a
[ View my current spot ] link and block a second join.

## Screen 3: My Status — `/status/:id`
**Who:** customer after joining; bookmarkable.
- Token huge: `S-14`, with "4th in line" underneath.
- Circular/linear wait indicator: "about 35 min", ticking down as the queue moves.
- Your name, services, preferred barber, time joined.
- When **2nd in line**: amber banner "Start coming to the salon — about 5 min away".
- When **Called**: full-screen gold takeover, gentle pulse animation, "It's your
  turn! Go to Ravi", vibrate on supported phones, and a chime.
- When **In chair**: "You're with Ravi now — sit back and relax."
- When **Done**: "Thanks for visiting! Hope to see you again." with [ Join again ].
- When **Cancelled / No-show**: polite message + [ Join again ].
- **[ Cancel my spot ]** opens a confirmation dialog. Cancelling is allowed while
  Waiting or Called only.
**Error state:** unknown token → "We couldn't find that token" + Home link.
**Realtime:** this screen must update without a refresh (Supabase subscription).

## Screen 4: Reception Dashboard — `/reception` (tablet, landscape)
**Who:** receptionist. Protected by a 4-digit staff PIN.
- Header: date, queue open/closed indicator, live "waiting / serving / done" counts.
- Left column — barber cards in a 3-column row: photo/initials, name, current
  customer token + name, time-left progress bar, **[ Call next ]** button.
  Disabled when the barber is on break or off duty.
- Right column — waiting list in join order: token, name, services, preferred
  barber, waiting time, **[ No-show ]** and **[ Cancel ]**.
- Rows waiting more than 60 min are highlighted amber.
- Top action **[ + Add walk-in ]** opens a quick form (name, phone, services,
  barber) and appends to the same queue at the end.
**Empty state:** "Queue is clear — enjoy the quiet."
**Tablet:** 2-column layout, min 44px buttons, readable at arm's length.

## Screen 5: Barber View — `/barber/:name` (phone)
**Who:** barber. Protected by the staff PIN.
- Header: barber name + on-duty status.
- Current customer card: token, name, services, "Started 12 min ago" timer.
- Big buttons **[ Start ]** → **[ Done ]**. Start is enabled only for Called
  customers; Done only for In chair.
- "Next for you: S-15 · Kunal · Haircut" preview.
- Toggle: **Available / On break**. Going on break does not lose the current
  customer but disables Call next for that barber.
**Empty state:** "No one assigned yet. Reception will call someone shortly."

## Screen 6: Waiting Area TV — `/display` (1920×1080)
**Who:** everyone in the waiting area. No navigation, no login, no refresh.
- Dark background, salon wordmark small in the corner, large clock.
- One row per working barber: initials, name, `Now: S-12`, and `Up next` chips
  for the next 5 tokens with estimated times.
- A prominent strip: "Called: S-14 → Ravi" that flashes gold for 5 seconds and
  plays a soft chime when a new token is called.
- Collected/Done tokens disappear from the active queue.
- Text readable from 5 metres (tokens ≥ 64px).
**Empty state:** "All chairs free — walk right in."

## Screen 7: Owner Settings — `/admin` (tablet/desktop)
**Who:** owner. Protected by the staff PIN.
- Services table: name (EN + GU), minutes, price (₹), on/off switch, edit, delete,
  and **[ + Add service ]**.
- Barbers on duty: one row each with a toggle and a live status badge.
- Queue switch: **Open / Closed for online joining**.
- Staff test PIN display (lab only, е.g. `4821`) and a note to change it in prod.
- Today's stats cards: customers served, average wait, no-shows, revenue.
**Validation:** minutes 5–180, price 0–10000, GU name required. All validated in
the shared rules module and enforced by Supabase policies/checks where practical.
