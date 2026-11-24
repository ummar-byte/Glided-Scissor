import type { Barber, Settings, Ticket, TicketStatus } from '../types'

/** ALL queue rules live here and are reused by every screen. */
export const ACTIVE_STATUSES: TicketStatus[] = ['waiting', 'called', 'in_chair']

export const tokenText = (n: number) => `S-${n}`

export const isActive = (t: Ticket) => ACTIVE_STATUSES.includes(t.status)

export const activeTickets = (tickets: Ticket[]) => tickets.filter(isActive)

export const waitingTickets = (tickets: Ticket[]) =>
  tickets.filter((t) => t.status === 'waiting').sort(byJoinedAt)

export function byJoinedAt(a: Ticket, b: Ticket) {
  return a.joined_at.localeCompare(b.joined_at) || a.token_no - b.token_no
}

/** 1-based place among Waiting tickets; 0 when not waiting. */
export function positionOf(ticket: Ticket, tickets: Ticket[]): number {
  if (ticket.status !== 'waiting') return 0
  return waitingTickets(tickets).findIndex((t) => t.id === ticket.id) + 1
}

export function workingBarbers(barbers: Barber[]) {
  return barbers.filter((b) => b.active && !b.on_break)
}

/** Sum of minutes ahead ÷ number of barbers working, rounded up (min 1 barber). */
export function estimateWaitMinutes(
  ticketOrPosition: Ticket | number | null,
  tickets: Ticket[],
  barbers: Barber[],
): number {
  const queue = waitingTickets(tickets)
  const ahead =
    typeof ticketOrPosition === 'number'
      ? queue.slice(0, Math.max(0, ticketOrPosition - 1))
      : ticketOrPosition
        ? queue.slice(0, Math.max(0, queue.findIndex((t) => t.id === ticketOrPosition.id)))
        : queue
  const minutesAhead = ahead.reduce((sum, t) => sum + t.total_minutes, 0)
  const capacity = Math.max(1, workingBarbers(barbers).length)
  return Math.ceil(minutesAhead / capacity)
}

/** A barber can only be called if on duty, available, and free of active customers. */
export function barberIsFree(barber: Barber, tickets: Ticket[]): boolean {
  if (!barber.active || barber.on_break) return false
  return !activeTickets(tickets).some(
    (t) => t.assigned_barber === barber.id && ['called', 'in_chair'].includes(t.status),
  )
}

/** Earliest Waiting ticket who chose this barber or "Any". */
export function nextEligibleTicket(barberId: string, tickets: Ticket[]): Ticket | undefined {
  return waitingTickets(tickets).find(
    (t) => t.barber_preference === null || t.barber_preference === barberId,
  )
}

export function canCallNext(barber: Barber, tickets: Ticket[]): boolean {
  return barberIsFree(barber, tickets) && Boolean(nextEligibleTicket(barber.id, tickets))
}

/** True only while Waiting or Called. */
export function canCancel(ticket: Ticket): boolean {
  return ticket.status === 'waiting' || ticket.status === 'called'
}

export function canMarkNoShow(ticket: Ticket): boolean {
  return ticket.status === 'called'
}

/** Called more than 10 minutes ago can be marked as a no-show. */
export function noShowWindowElapsed(ticket: Ticket, now = new Date()): boolean {
  if (!ticket.called_at) return false
  return now.getTime() - new Date(ticket.called_at).getTime() > 10 * 60 * 1000
}

export function waitingOver60(ticket: Ticket, now = new Date()): boolean {
  return now.getTime() - new Date(ticket.joined_at).getTime() > 60 * 60 * 1000
}

export function formatWait(minutes: number, lang: 'en' | 'gu' = 'en'): string {
  if (minutes <= 0) return lang === 'gu' ? 'હમણાં જ' : 'any moment now'
  if (minutes < 60) return lang === 'gu' ? `લગભગ ${minutes} મિ.ન.` : `about ${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (lang === 'gu') return `લગભગ ${h} કલાક${m ? ` ${m} મિ.ન.` : ''}`
  return `about ${h} hr${m ? ` ${m} min` : ''}`
}

export function formatClock(iso: string, lang: 'en' | 'gu' = 'en'): string {
  return new Intl.DateTimeFormat(lang === 'gu' ? 'gu-IN' : 'en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(new Date(iso))
}

/** IST wall-clock minutes since midnight. */
function istMinutes(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return hour * 60 + minute
}

export function onlineJoiningOpen(settings: Settings, now = new Date()): boolean {
  const [h, m] = settings.close_time.split(':').map(Number)
  return settings.queue_open && istMinutes(now) < h * 60 + m - 30
}

export function validatePhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone)
}

export function validateName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 40
}

export function statusKey(status: TicketStatus): string {
  const map: Record<TicketStatus, string> = {
    waiting: 'status.waiting',
    called: 'status.called',
    in_chair: 'status.inChair',
    done: 'status.done',
    cancelled: 'status.cancelled',
    no_show: 'status.noShow',
  }
  return map[status]
}

export interface QueueStats {
  served: number
  noShows: number
  averageWait: number
  revenue: number
}

export function queueStats(tickets: Ticket[]): QueueStats {
  const served = tickets.filter((t) => t.status === 'done')
  const waits = tickets
    .filter((t) => t.called_at)
    .map((t) => (new Date(t.called_at!).getTime() - new Date(t.joined_at).getTime()) / 60000)
  return {
    served: served.length,
    noShows: tickets.filter((t) => t.status === 'no_show').length,
    averageWait: waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : 0,
    revenue: served.reduce((sum, t) => sum + t.total_price, 0),
  }
}
