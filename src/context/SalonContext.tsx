import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { isSupabaseConfigured, repository } from '../data'
import { translate } from '../i18n'
import type { Barber, JoinInput, Lang, SalonData, Service, Settings, Ticket, TicketStatus } from '../types'

type Toast = { id: number; message: string; kind: 'ok' | 'error' }

interface SalonContextValue {
  data: SalonData
  loading: boolean
  mode: 'supabase' | 'demo'
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  toast: Toast | null
  notify: (message: string, kind?: 'ok' | 'error') => void
  refresh: () => Promise<void>
  actions: {
    join: (input: JoinInput) => Promise<Ticket>
    callNext: (barberId: string) => Promise<void>
    setStatus: (id: string, status: TicketStatus) => Promise<void>
    noShow: (id: string) => Promise<void>
    cancel: (id: string) => Promise<void>
    saveService: (service: Service) => Promise<void>
    deleteService: (id: string) => Promise<void>
    saveBarber: (barber: Barber) => Promise<void>
    updateSettings: (patch: Partial<Settings>) => Promise<void>
  }
}

const EMPTY: SalonData = { services: [], barbers: [], tickets: [], settings: { id: 1, queue_open: true, close_time: '21:00', staff_pin: '4821' } }

const SalonContext = createContext<SalonContextValue | null>(null)

export function SalonProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SalonData>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('salon-lang') as Lang) || 'en')
  const [toast, setToast] = useState<Toast | null>(null)

  const notify = useCallback((message: string, kind: 'ok' | 'error' = 'ok') => {
    setToast({ id: Date.now(), message, kind })
  }, [])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 4200)
    return () => window.clearTimeout(id)
  }, [toast])

  const refresh = useCallback(async () => {
    try {
      const next = await repository.load()
      setData(next)
      setLoading(false)
    } catch (error) {
      setLoading(false)
      notify(error instanceof Error ? error.message : 'Could not load data', 'error')
    }
  }, [notify])

  useEffect(() => {
    void refresh()
    return repository.subscribe((next) => setData(next))
  }, [refresh])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    localStorage.setItem('salon-lang', next)
    document.documentElement.lang = next
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const t = useCallback((key: string, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang])

  const wrap = useCallback(
    <T,>(fn: () => Promise<T>): Promise<T> =>
      fn().catch((error: unknown) => {
        notify(error instanceof Error ? error.message : 'Something went wrong', 'error')
        throw error
      }),
    [notify],
  )

  const actions = useMemo(
    () => ({
      join: (input: JoinInput) => wrap(() => repository.join(input)),
      callNext: (barberId: string) => wrap(() => repository.callNext(barberId)),
      setStatus: (id: string, status: TicketStatus) => wrap(() => repository.setStatus(id, status)),
      noShow: (id: string) => wrap(() => repository.noShow(id)),
      cancel: (id: string) => wrap(() => repository.cancel(id)),
      saveService: (service: Service) => wrap(() => repository.saveService(service)),
      deleteService: (id: string) => wrap(() => repository.deleteService(id)),
      saveBarber: (barber: Barber) => wrap(() => repository.saveBarber(barber)),
      updateSettings: (patch: Partial<Settings>) => wrap(() => repository.updateSettings(patch)),
    }),
    [wrap],
  )

  const value: SalonContextValue = {
    data,
    loading,
    mode: isSupabaseConfigured ? 'supabase' : 'demo',
    lang,
    setLang,
    t,
    toast,
    notify,
    refresh,
    actions,
  }

  return <SalonContext.Provider value={value}>{children}</SalonContext.Provider>
}

export function useSalon() {
  const ctx = useContext(SalonContext)
  if (!ctx) throw new Error('useSalon must be used inside SalonProvider')
  return ctx
}
