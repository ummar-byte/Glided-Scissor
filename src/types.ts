export type Lang = 'en' | 'gu'

export type TicketStatus =
  | 'waiting'
  | 'called'
  | 'in_chair'
  | 'done'
  | 'cancelled'
  | 'no_show'

export type TicketSource = 'online' | 'walk_in'

export interface Service {
  id: string
  name_en: string
  name_gu: string
  minutes: number
  price: number
  active: boolean
  sort_order: number
}

export type ServiceSnapshot = Pick<Service, 'id' | 'name_en' | 'name_gu' | 'minutes' | 'price'>

export interface Barber {
  id: string
  name: string
  speciality_en: string
  speciality_gu: string
  active: boolean
  on_break: boolean
  sort_order: number
}

export interface Ticket {
  id: string
  token_no: number
  token_day: string
  customer_name: string
  phone: string
  source: TicketSource
  services: ServiceSnapshot[]
  total_minutes: number
  total_price: number
  barber_preference: string | null
  assigned_barber: string | null
  status: TicketStatus
  joined_at: string
  called_at: string | null
  started_at: string | null
  finished_at: string | null
}

export interface Settings {
  id: number
  queue_open: boolean
  close_time: string
  staff_pin: string
}

export interface SalonData {
  services: Service[]
  barbers: Barber[]
  tickets: Ticket[]
  settings: Settings
}

export interface JoinInput {
  customerName: string
  phone: string
  serviceIds: string[]
  barberPreference: string | null
  source?: TicketSource
}
