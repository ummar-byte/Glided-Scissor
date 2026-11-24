import { useEffect, useRef, useState } from 'react'
import { BellRing, Clock3, Scissors } from 'lucide-react'
import { useSalon } from '../context/SalonContext'
import { activeTickets, barberName, byJoinedAt, tokenText, waitingTickets } from '../lib/queue'
import { playChime } from '../lib/sound'

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).format(now)
}

export function Display() {
  const { data, t, lang } = useSalon()
  const clock = useClock()
  const called = activeTickets(data.tickets).filter((ticket) => ticket.status === 'called').sort(byJoinedAt)
  const latestCall = called[called.length - 1]
  const lastCallId = useRef<string | undefined>(undefined)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (!latestCall) return
    if (lastCallId.current === latestCall.id) return
    lastCallId.current = latestCall.id
    setFlash(true)
    playChime()
    const id = window.setTimeout(() => setFlash(false), 5000)
    return () => window.clearTimeout(id)
  }, [latestCall?.id])

  const waiting = waitingTickets(data.tickets)
  const working = data.barbers.filter((b) => b.active)
  const serving = activeTickets(data.tickets).filter((ticket) => ['called', 'in_chair'].includes(ticket.status))

  return (
    <div className="min-h-screen bg-[#1a120e] px-6 py-6 text-slate-100 sm:px-10 lg:px-16">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gold/20 pb-5">
        <div className="flex items-center gap-4">
          <img src="/logo.svg" alt="" className="h-12 w-12 shrink-0 rounded-2xl sm:h-14 sm:w-14" />
          <div>
            <p className="text-xl font-extrabold tracking-wide text-gold-soft sm:text-2xl">{t('app.name')}</p>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{t('display.title')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-gold-soft"><Clock3 size={26} /><span className="text-3xl font-bold tabular-nums sm:text-4xl">{clock}</span></div>
      </header>

      {latestCall && (
        <div className={`mt-6 rounded-3xl px-8 py-6 text-center text-charcoal transition-all ${flash ? 'flash-gold turn-pulse' : 'bg-gold/85'}`}>
          <p className="text-sm font-black uppercase tracking-[0.3em]">{t('display.called')}</p>
          <p className="mt-1 text-5xl font-black sm:text-7xl">{tokenText(latestCall.token_no)} <span className="text-3xl sm:text-5xl">→ {barberName(data.barbers.find((b) => b.id === latestCall.assigned_barber), lang) || t('common.any')}</span></p>
        </div>
      )}

      {working.length === 0 && serving.length === 0 && waiting.length === 0 && (
        <div className="mt-24 text-center text-3xl font-bold text-gold-soft sm:text-5xl">{t('display.allFree')}</div>
      )}

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {working.map((barber) => {
          const nowTicket = serving.find((ticket) => ticket.assigned_barber === barber.id && ['called', 'in_chair'].includes(ticket.status))
          const upcoming = waiting.filter((ticket) => ticket.barber_preference === null || ticket.barber_preference === barber.id).slice(0, 5)
          let cumulative = 0
          return (
            <section key={barber.id} className="rounded-3xl border border-gold/20 bg-charcoal/45 p-6 sm:p-8">
              <div className="flex items-center gap-4 border-b border-slate-600/40 pb-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/40 bg-gold/10 text-2xl font-black text-gold-soft">{barberName(barber, lang)[0]}</div>
                <div>
                  <p className="text-2xl font-extrabold sm:text-3xl">{barberName(barber, lang)}</p>
                  <p className="text-xs uppercase tracking-widest text-slate-500">{barber.on_break ? t('common.onBreak') : t('common.available')}</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">{t('display.now')}</p>
                <p className={`mt-2 text-5xl font-black sm:text-6xl ${nowTicket ? 'text-gold-soft' : 'text-slate-600'}`}>{nowTicket ? tokenText(nowTicket.token_no) : '—'}</p>
                <p className="mt-1 text-lg text-slate-400">{nowTicket?.customer_name ?? ''}</p>
              </div>

              <div className="mt-7">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-slate-500">{t('display.upNext')}</p>
                {upcoming.length === 0 ? (
                  <p className="text-lg text-slate-600">—</p>
                ) : (
                  <ol className="space-y-2">
                    {upcoming.map((ticket, index) => {
                      cumulative += ticket.total_minutes
                      return (
                        <li key={ticket.id} className={`flex items-center justify-between rounded-xl px-4 py-2.5 ${index === 0 ? 'border border-gold/40 bg-gold/10' : 'bg-charcoal-deep/60'}`}>
                          <span className="text-2xl font-extrabold text-slate-100 sm:text-3xl">{tokenText(ticket.token_no)}</span>
                          <span className="text-sm text-slate-400">{t('display.estimated', { n: cumulative })}</span>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </div>
            </section>
          )
        })}
      </div>

      <footer className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-600"><Scissors size={14} /> {t('app.tagline')} · <BellRing size={14} /> {t('display.title')}</footer>
    </div>
  )
}
