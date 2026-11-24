import { describe, expect, it } from 'vitest'
import type { Barber, Settings, Ticket, TicketStatus } from '../types'
import {
  barberIsFree, barberName, canCallNext, canCancel, estimateWaitMinutes, nextEligibleTicket,
  noShowWindowElapsed, onlineJoiningOpen, positionOf, queueStats, tokenText,
  validateName, validatePhone, waitingTickets,
} from './queue'

const barbers: Barber[] = [
  { id: 'ravi', name: 'Ravi', name_gu: 'રવિ', speciality_en: 'Cuts', speciality_gu: 'કટ', active: true, on_break: false, sort_order: 1 },
  { id: 'amit', name: 'Amit', name_gu: 'અમિત', speciality_en: 'Beards', speciality_gu: 'દાઢી', active: true, on_break: false, sort_order: 2 },
  { id: 'imran', name: 'Imran', name_gu: 'ઇમરાન', speciality_en: 'Colour', speciality_gu: 'રંગ', active: true, on_break: true, sort_order: 3 },
]

function ticket(id: string, token_no: number, preference: string | null, status: TicketStatus, minutes = 30, joined = '2026-01-01T10:00:00Z', assigned: string | null = null): Ticket {
  return {
    id, token_no, token_day: '2026-01-01', customer_name: `Customer ${id}`, phone: `98765${String(token_no).padStart(5, '0')}`,
    source: 'online', services: [{ id: 's', name_en: 'Haircut', name_gu: 'હેરકટ', minutes, price: 150 }],
    total_minutes: minutes, total_price: 150, barber_preference: preference, assigned_barber: assigned,
    status, joined_at: joined, called_at: null, started_at: null, finished_at: null,
  }
}

describe('tokens and validation', () => {
  it('formats tokens', () => expect(tokenText(14)).toBe('S-14'))
  it('accepts only valid Indian 10-digit phones', () => {
    expect(validatePhone('9876543210')).toBe(true)
    expect(validatePhone('1234567890')).toBe(false)
    expect(validatePhone('987654321')).toBe(false)
    expect(validatePhone('98765432101')).toBe(false)
  })
  it('validates names', () => {
    expect(validateName('A')).toBe(false)
    expect(validateName('Kunal')).toBe(true)
  })
})

describe('localized barber names', () => {
  it('shows the Gujarati name when language is Gujarati', () => {
    expect(barberName(barbers[0], 'gu')).toBe('રવિ')
    expect(barberName(barbers[1], 'gu')).toBe('અમિત')
  })
  it('shows the English name in English and when Gujarati is missing', () => {
    expect(barberName(barbers[0], 'en')).toBe('Ravi')
    expect(barberName({ ...barbers[0], name_gu: '' }, 'gu')).toBe('Ravi')
    expect(barberName(undefined, 'gu')).toBe('')
  })
})

describe('queue order and waiting time', () => {
  const tickets = [
    ticket('t1', 1, 'ravi', 'waiting', 30, '2026-01-01T10:00:00Z'),
    ticket('t2', 2, null, 'waiting', 15, '2026-01-01T10:05:00Z'),
    ticket('t3', 3, 'amit', 'called', 60, '2026-01-01T10:10:00Z', 'amit'),
  ]

  it('orders waiting tickets by join time', () => {
    expect(waitingTickets(tickets).map((t) => t.id)).toEqual(['t1', 't2'])
  })

  it('computes 1-based position only for waiting tickets', () => {
    expect(positionOf(tickets[1], tickets)).toBe(2)
    expect(positionOf(tickets[2], tickets)).toBe(0)
  })

  it('divides the minutes ahead by working barbers', () => {
    // 30 min ahead, 2 working barbers (Imran is on break) => 15 min
    expect(estimateWaitMinutes(tickets[1], tickets, barbers)).toBe(15)
    expect(estimateWaitMinutes(3, tickets, barbers)).toBe(23) // 45 / 2 rounded up
    expect(estimateWaitMinutes(tickets[0], tickets, barbers)).toBe(0)
  })
})

describe('call-next rules', () => {
  it('never gives a Ravi-only customer to Amit', () => {
    const tickets = [
      ticket('t1', 1, 'ravi', 'waiting', 30, '2026-01-01T10:00:00Z'),
      ticket('t2', 2, null, 'waiting', 15, '2026-01-01T10:05:00Z'),
    ]
    expect(nextEligibleTicket('amit', tickets)?.id).toBe('t2')
    expect(nextEligibleTicket('ravi', tickets)?.id).toBe('t1')
    expect(canCallNext(barbers[1], tickets)).toBe(true)
  })

  it('blocks a barber who already has a called customer', () => {
    const tickets = [
      ticket('t1', 1, 'ravi', 'called', 30, '2026-01-01T10:00:00Z', 'ravi'),
      ticket('t2', 2, null, 'waiting', 15, '2026-01-01T10:05:00Z'),
    ]
    expect(barberIsFree(barbers[0], tickets)).toBe(false)
    expect(canCallNext(barbers[0], tickets)).toBe(false)
  })

  it('blocks barbers on break or off duty', () => {
    const waiting = [ticket('t1', 1, null, 'waiting')]
    expect(canCallNext(barbers[2], waiting)).toBe(false)
    expect(canCallNext({ ...barbers[0], active: false }, waiting)).toBe(false)
  })

  it('only allows cancel while waiting or called', () => {
    expect(canCancel(ticket('a', 1, null, 'waiting'))).toBe(true)
    expect(canCancel(ticket('b', 2, null, 'called'))).toBe(true)
    expect(canCancel(ticket('c', 3, null, 'in_chair'))).toBe(false)
    expect(canCancel(ticket('d', 4, null, 'done'))).toBe(false)
  })

  it('enforces the 10-minute no-show window', () => {
    const now = new Date('2026-01-01T10:30:00Z')
    const called = ticket('c', 1, null, 'called')
    called.called_at = '2026-01-01T10:25:00Z'
    expect(noShowWindowElapsed(called, now)).toBe(false)
    called.called_at = '2026-01-01T10:15:00Z'
    expect(noShowWindowElapsed(called, now)).toBe(true)
  })
})

describe('opening hours and stats', () => {
  const settings: Settings = { id: 1, queue_open: true, close_time: '21:00', staff_pin: '4821' }

  it('closes online joining 30 minutes before close (IST)', () => {
    expect(onlineJoiningOpen(settings, new Date('2026-01-01T14:29:00Z'))).toBe(true)  // 19:59 IST
    expect(onlineJoiningOpen(settings, new Date('2026-01-01T14:59:00Z'))).toBe(true)  // 20:29 IST
    expect(onlineJoiningOpen(settings, new Date('2026-01-01T15:01:00Z'))).toBe(false) // 20:31 IST
    expect(onlineJoiningOpen({ ...settings, queue_open: false }, new Date('2026-01-01T08:00:00Z'))).toBe(false)
  })

  it('computes today stats', () => {
    const done = ticket('d', 1, null, 'done')
    done.called_at = '2026-01-01T10:20:00Z'
    const noShow = ticket('n', 2, null, 'no_show')
    const stats = queueStats([done, noShow])
    expect(stats.served).toBe(1)
    expect(stats.noShows).toBe(1)
    expect(stats.averageWait).toBe(20)
    expect(stats.revenue).toBe(150)
  })
})
