# Flows & Rules

## Flow A — remote customer
1. Opens Home → Join → picks "Haircut + Beard trim" and "Any barber" → receives
   token S-14, 6th in line.
2. Keeps My Status open; at 2nd in line the "Start coming" banner appears.
3. Receptionist taps **Call next** on Amit's card → S-14 becomes **Called** and
   Amit is written to the token.
4. Customer's phone switches to the gold "It's your turn! Go to Amit" screen;
   the TV flashes S-14; a chime plays on both.
5. Amit taps **Start** (→ In chair) then **Done** (→ Done). S-14 leaves the
   active queue.

## Flow B — walk-in
Receptionist taps **+ Add walk-in**, fills name/phone/services/barber, and the
customer joins the *same* queue at the end with the next token. No phone join
is needed.

## Statuses and allowed moves
`Waiting → Called → In chair → Done` — never backwards.
Also allowed: `Waiting → Cancelled`, `Called → Cancelled`, `Called → No-show`.
`No-show → (new token at the END of the queue if re-added)`.
Nothing may move out of `Done`, `Cancelled` or `No-show`.

## Token numbers
`S-1`, `S-2`, … sequential per salon per day, reset at midnight (Asia/Kolkata).
Generated atomically in the database (a Postgres function/sequence or a
transaction with a unique constraint on `(day, number)`). No duplicates on
double-click or retry.

## Choosing who is next (Call next)
- Pick the **earliest Waiting** token whose preferred barber is that barber or
  `Any`.
- A customer who chose Ravi is **never** assigned to Amit, even if Ravi is busy.
- A barber can have only one customer in the chair at a time: if they already
  have a Called or In-chair customer, Call next is disabled.
- Barbers on break or off duty cannot be called.
- Walk-ins and remote joins are treated identically — first come, first served.

## Waiting-time rule
`estimated wait (minutes) ≈ ceil( total service minutes of tokens ahead that can
be served by the available barbers ÷ number of barbers working )`.
Simplified for the lab: sum the minutes of all Waiting tokens ahead in the
global order, divide by the count of on-duty, available barbers (min 1), and
round up. Recompute on every queue change; the customer's number ticks down.

## One active spot per phone
A phone number (10 digits) may have at most one token in Waiting, Called or
In chair. If the same phone joins again, return the existing spot instead of
creating a duplicate.

## No-show, cancel, on break
- Called but not at the salon after 10 minutes → receptionist may mark No-show.
  If the customer comes later, they are added again at the **END** with a new
  token.
- Customer may Cancel only while Waiting or Called; a confirmation dialog is
  required.
- A barber on break keeps their current customer but Call next is disabled;
  customers who picked them see "Ravi is on break".

## Closing time
- Online joining closes 30 minutes before the salon's 9 PM close (8:30 PM).
  Walk-ins are still allowed until close.
- If the queue is manually closed by the owner, the Home Join button is disabled
  with a clear message.

## Language
Every user-facing label has an EN and a GU string. Switching the toggle must
change all visible labels on the current screen without a reload.

## Test checklist
- [ ] Join with 2 services → correct total minutes and ₹ price shown
- [ ] Same phone joins twice → shown existing spot, no duplicate
- [ ] Call next for Amit skips a customer who chose Ravi
- [ ] Call next → customer's phone shows "It's your turn" within 5 s
- [ ] Start/Done on Barber View updates Reception and TV
- [ ] No-show, then re-add → goes to end of queue with a new token
- [ ] Close online queue → Join button disabled with message
- [ ] Language toggle switches all labels to Gujarati
- [ ] Waiting time goes down as customers finish
- [ ] Phone, tablet and TV windows all stay in sync
- [ ] Double-click Confirm creates only one token
- [ ] Daily token counter resets on a new day
- [ ] Unknown token and invalid PIN show friendly errors
- [ ] Empty states appear on every screen
- [ ] Production build succeeds and the live URL works
