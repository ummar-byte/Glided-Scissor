import { activeTickets, barberIsFree, nextEligibleTicket } from '../lib/queue'
import type { Barber, JoinInput, SalonData, Service, Settings, Ticket, TicketStatus } from '../types'
import { makeId, nextCountdown, todayKey, type SalonRepository } from './repository'

const KEY = 'salon-queue-demo-v2'

const services: Service[] = [
  { id: 'svc-haircut', name_en: 'Haircut', name_gu: 'હેરકટ', minutes: 30, price: 150, active: true, sort_order: 1 },
  { id: 'svc-beard', name_en: 'Beard trim', name_gu: 'દાઢી ટ્રિમ', minutes: 15, price: 80, active: true, sort_order: 2 },
  { id: 'svc-spa', name_en: 'Hair spa', name_gu: 'હેર સ્પા', minutes: 45, price: 400, active: true, sort_order: 3 },
  { id: 'svc-colour', name_en: 'Colour', name_gu: 'રંગ', minutes: 60, price: 900, active: true, sort_order: 4 },
  { id: 'svc-shave', name_en: 'Shave', name_gu: 'શेवિંગ', minutes: 20, price: 120, active: true, sort_order: 5 },
  { id: 'svc-kids', name_en: 'Kids cut', name_gu: 'બાળકોનો કટ', minutes: 20, price: 120, active: true, sort_order: 6 },
]

const barbers: Barber[] = [
  { id: 'bar-ravi', name: 'Ravi', speciality_en: 'Classic cuts & fades', speciality_gu: 'ક્લાસિક કટ અને ફેડ', active: true, on_break: false, sort_order: 1 },
  { id: 'bar-amit', name: 'Amit', speciality_en: 'Beards & styling', speciality_gu: 'દાઢી અને સ્ટાઇલિંગ', active: true, on_break: false, sort_order: 2 },
  { id: 'bar-imran', name: 'Imran', speciality_en: 'Colour & hair spa', speciality_gu: 'રંગ અને હેર સ્પા', active: true, on_break: true, sort_order: 3 },
]

const settings: Settings = { id: 1, queue_open: true, close_time: '21:00', staff_pin: '4821' }

function minutesAgo(n: number) {
  return new Date(Date.now() - n * 60_000).toISOString()
}

function snapshot(ids: string[]) {
  return services.filter((s) => ids.includes(s.id)).map(({ id, name_en, name_gu, minutes, price }) => ({ id, name_en, name_gu, minutes, price }))
}

function seedTickets(): Ticket[] {
  const rows: Array<[number, string, string, string[], string | null, TicketStatus, number]> = [
    [1, 'Kunal Shah', '9876543210', ['svc-haircut'], 'bar-ravi', 'in_chair', 34],
    [2, 'Priya Patel', '9825100200', ['svc-spa'], 'bar-imran', 'waiting', 27],
    [3, 'Rohan Mehta', '9930456123', ['svc-haircut', 'svc-beard'], null, 'waiting', 22],
    [4, 'Aarav Joshi', '9812345678', ['svc-shave'], 'bar-amit', 'waiting', 16],
    [5, 'Nikita Rao', '9978901234', ['svc-colour'], 'bar-imran', 'waiting', 11],
    [6, 'Dev Verma', '9765432109', ['svc-haircut'], null, 'waiting', 4],
  ]
  return rows.map(([token_no, customer_name, phone, ids, pref, status, ago]) => {
    const svcs = snapshot(ids)
    const joined = minutesAgo(ago)
    return {
      id: makeId(),
      token_no,
      token_day: todayKey(),
      customer_name,
      phone,
      source: 'online',
      services: svcs,
      total_minutes: svcs.reduce((a, s) => a + s.minutes, 0),
      total_price: svcs.reduce((a, s) => a + s.price, 0),
      barber_preference: pref,
      assigned_barber: status === 'in_chair' ? 'bar-ravi' : null,
      status,
      joined_at: joined,
      called_at: status === 'in_chair' ? minutesAgo(ago - 4) : null,
      started_at: status === 'in_chair' ? minutesAgo(ago - 4) : null,
      finished_at: null,
    }
  })
}

function seed(): SalonData & { counter: number; counterDay: string } {
  return {
    services: structuredClone(services),
    barbers: structuredClone(barbers),
    tickets: seedTickets(),
    settings: { ...settings },
    counter: 6,
    counterDay: todayKey(),
  }
}

type Stored = ReturnType<typeof seed>

function read(): Stored {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Stored
      if (parsed?.tickets && parsed?.services && parsed?.barbers && parsed?.settings) return parsed
    }
  } catch {
    /* ignore corrupt demo data */
  }
  const fresh = seed()
  localStorage.setItem(KEY, JSON.stringify(fresh))
  return fresh
}

function write(data: Stored) {
  localStorage.setItem(KEY, JSON.stringify(data))
  window.dispatchEvent(new CustomEvent('salon-demo-change'))
}

function activePhone(data: Stored, phone: string) {
  return data.tickets.find((t) => t.phone === phone && activeTickets([t]).length === 1)
}

export const demoRepository: SalonRepository = {
  mode: 'demo',

  async load() {
    const { tickets, services: svcs, barbers:bs, settings: set } = read()
    return { tickets, services: svcs, barbers: bs, settings: set }
  },

  subscribe(onChange) {
    const handler = () => void demoRepository.load().then(onChange)
    window.addEventListener('salon-demo-change', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('salon-demo-change', handler)
      window.removeEventListener('storage', handler)
    }
  },

  async join(input: JoinInput) {
    const data = read()
    const existing = activePhone(data, input.phone)
    if (existing) return existing

    const chosen = data.services.filter((s) => input.serviceIds.includes(s.id) && s.active).slice(0, 3)
    if (!chosen.length) throw new Error('Pick at least one active service')
    const day = todayKey()
    data.counter = nextCountdown(data.counterDay, data.counter)
    data.counterDay = day
    const ticket: Ticket = {
      id: makeId(),
      token_no: data.counter,
      token_day: day,
      customer_name: input.customerName.trim(),
      phone: input.phone,
      source: input.source ?? 'online',
      services: chosen.map(({ id, name_en, name_gu, minutes, price }) => ({ id, name_en, name_gu, minutes, price })),
      total_minutes: chosen.reduce((a, s) => a + s.minutes, 0),
      total_price: chosen.reduce((a, s) => a + s.price, 0),
      barber_preference: input.barberPreference,
      assigned_barber: null,
      status: 'waiting',
      joined_at: new Date().toISOString(),
      called_at: null,
      started_at: null,
      finished_at: null,
    }
    data.tickets.unshift(ticket)
    write(data)
    return ticket
  },

  async callNext(barberId: string) {
    const data = read()
    const barber = data.barbers.find((b) => b.id === barberId)
    if (!barber || !barberIsFree(barber, data.tickets)) throw new Error('Barber is not free')
    const ticket = nextEligibleTicket(barberId, data.tickets)
    if (!ticket) throw new Error('No eligible customer waiting')
    const current = data.tickets.find((t) => t.id === ticket.id)!
    current.status = 'called'
    current.assigned_barber = barberId
    current.called_at = new Date().toISOString()
    write(data)
  },

  async setStatus(ticketId: string, status: TicketStatus) {
    const data = read()
    const ticket = data.tickets.find((t) => t.id === ticketId)
    if (!ticket) throw new Error('Ticket not found')
    if (status === 'in_chair' && ticket.status !== 'called') throw new Error('Only called tickets can start')
    if (status === 'done' && ticket.status !== 'in_chair') throw new Error('Only in-chair tickets can finish')
    ticket.status = status
    if (status === 'in_chair') ticket.started_at = new Date().toISOString()
    if (status === 'done') ticket.finished_at = new Date().toISOString()
    write(data)
  },

  async noShow(ticketId: string) {
    const data = read()
    const ticket = data.tickets.find((t) => t.id === ticketId)
    if (!ticket || ticket.status !== 'called') throw new Error('Only called tickets can be no-shows')
    ticket.status = 'no_show'
    write(data)
  },

  async cancel(ticketId: string) {
    const data = read()
    const ticket = data.tickets.find((t) => t.id === ticketId)
    if (!ticket || !cancelAllowed(ticket)) throw new Error('This spot can no longer be cancelled')
    ticket.status = 'cancelled'
    write(data)
  },

  async saveService(service: Service) {
    const data = read()
    const index = data.services.findIndex((s) => s.id === service.id)
    if (index >= 0) data.services[index] = service
    else data.services.push(service)
    write(data)
  },

  async deleteService(serviceId: string) {
    const data = read()
    data.services = data.services.filter((s) => s.id !== serviceId)
    write(data)
  },

  async saveBarber(barber: Barber) {
    const data = read()
    const index = data.barbers.findIndex((b) => b.id === barber.id)
    if (index >= 0) data.barbers[index] = barber
    else data.barbers.push(barber)
    write(data)
  },

  async updateSettings(patch: Partial<Settings>) {
    const data = read()
    data.settings = { ...data.settings, ...patch }
    write(data)
  },
}

/** Used by the "cancel my spot" flow. */
export function cancelAllowed(ticket: Ticket) {
  return ['waiting', 'called'].includes(ticket.status)
}

export { demoRepository as default }
