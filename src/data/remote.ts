import { supabase } from './client'
import type { SalonRepository } from './repository'
import type { Barber, JoinInput, SalonData, Service, Settings, Ticket, TicketStatus } from '../types'

function db() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

function rows<T>(result: { data: T[] | null; error: { message: string } | null }): T[] {
  if (result.error) throw new Error(result.error.message)
  return (result.data ?? []) as T[]
}

export const remoteRepository: SalonRepository = {
  mode: 'supabase',

  async load(): Promise<SalonData> {
    const client = db()
    const [serviceRows, barberRows, ticketRows, settings] = await Promise.all([
      client.from('services').select('*').order('sort_order').order('name_en'),
      client.from('barbers').select('*').order('sort_order'),
      client.from('tickets').select('*').order('joined_at', { ascending: false }).limit(500),
      client.from('settings').select('*').eq('id', 1).maybeSingle(),
    ])
    if (settings.error) throw new Error(settings.error.message)
    return {
      services: rows<Service>(serviceRows),
      barbers: rows<Barber>(barberRows),
      tickets: rows<Ticket>(ticketRows),
      settings: (settings.data as Settings | null) ?? { id: 1, queue_open: true, close_time: '21:00', staff_pin: '4821' },
    }
  },

  subscribe(onChange) {
    const client = db()
    let timer: number | undefined
    const schedule = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => void this.load().then(onChange).catch(console.error), 60)
    }
    const channel = client
      .channel('salon-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'barbers' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, schedule)
      .subscribe()
    return () => {
      window.clearTimeout(timer)
      void client.removeChannel(channel)
    }
  },

  async join(input: JoinInput) {
    const { data, error } = await db().rpc('join_queue', {
      p_name: input.customerName.trim(),
      p_phone: input.phone,
      p_services: input.serviceIds,
      p_barber: input.barberPreference,
      p_source: input.source ?? 'online',
    })
    if (error) throw new Error(error.message)
    return data as Ticket
  },

  async callNext(barberId: string) {
    const { error } = await db().rpc('call_next', { p_barber: barberId })
    if (error) throw new Error(error.message)
  },

  async setStatus(ticketId: string, status: TicketStatus) {
    const patch: Record<string, unknown> = { status }
    const now = new Date().toISOString()
    if (status === 'in_chair') patch.started_at = now
    if (status === 'done') patch.finished_at = now
    const { error } = await db().from('tickets').update(patch).eq('id', ticketId)
    if (error) throw new Error(error.message)
  },

  async noShow(ticketId: string) {
    const { error } = await db().from('tickets').update({ status: 'no_show' }).eq('id', ticketId)
    if (error) throw new Error(error.message)
  },

  async cancel(ticketId: string) {
    const { error } = await db().from('tickets').update({ status: 'cancelled' }).eq('id', ticketId)
    if (error) throw new Error(error.message)
  },

  async saveService(service: Service) {
    const { error } = await db().from('services').upsert(service)
    if (error) throw new Error(error.message)
  },

  async deleteService(serviceId: string) {
    const { error } = await db().from('services').delete().eq('id', serviceId)
    if (error) throw new Error(error.message)
  },

  async saveBarber(barber: Barber) {
    const { error } = await db().from('barbers').upsert(barber)
    if (error) throw new Error(error.message)
  },

  async updateSettings(patch: Partial<Settings>) {
    const { error } = await db().from('settings').update(patch).eq('id', 1)
    if (error) throw new Error(error.message)
  },
}
