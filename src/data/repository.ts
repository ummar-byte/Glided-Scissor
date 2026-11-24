import type { Barber, JoinInput, SalonData, Service, Settings, Ticket, TicketStatus } from '../types'

export interface SalonRepository {
  readonly mode: 'supabase' | 'demo'
  load(): Promise<SalonData>
  subscribe(onChange: (data: SalonData) => void): () => void
  join(input: JoinInput): Promise<Ticket>
  callNext(barberId: string): Promise<void>
  setStatus(ticketId: string, status: TicketStatus): Promise<void>
  noShow(ticketId: string): Promise<void>
  cancel(ticketId: string): Promise<void>
  saveService(service: Service): Promise<void>
  deleteService(serviceId: string): Promise<void>
  saveBarber(barber: Barber): Promise<void>
  updateSettings(patch: Partial<Settings>): Promise<void>
}

export function nextCountdown(day: string, previous: number) {
  return day === new Date().toISOString().slice(0, 10) ? previous + 1 : 1
}

export function makeId() {
  return crypto.randomUUID()
}

export function todayKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}
