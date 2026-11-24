import { ArrowRight, Clock3, Scissors, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Button, EmptyState } from '../components/Ui'
import { useSalon } from '../context/SalonContext'
import { activeTickets, estimateWaitMinutes, formatWait, onlineJoiningOpen, positionOf, waitingTickets } from '../lib/queue'

export function Home() {
  const { data, t } = useSalon()
  const active = activeTickets(data.tickets)
  const waiting = waitingTickets(data.tickets)
  const wait = estimateWaitMinutes(null, data.tickets, data.barbers)
  const canJoin = onlineJoiningOpen(data.settings)
  const myPhone = localStorage.getItem('salon-my-phone')
  const myTicket = myPhone ? active.find((ticket) => ticket.phone === myPhone) : undefined

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section className="card relative overflow-hidden px-6 py-10 text-center sm:px-12 sm:py-14 rise-in">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
        <div className="mb-5 flex justify-center"><Badge tone={canJoin ? 'green' : 'amber'}>
          <span className={`h-2 w-2 rounded-full ${canJoin ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          {canJoin ? t('home.badgeOpen', { time: data.settings.close_time }) : t('home.badgeClosed')}
        </Badge></div>
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          <span className="gold-text">{t('app.name')}</span>
        </h1>
        <p className="mt-3 text-sm font-medium uppercase tracking-[0.3em] text-slate-400">{t('app.tagline')}</p>
        <p className="mx-auto mt-5 max-w-md text-base text-slate-300">{t('home.welcome')}</p>

        <div className="mx-auto mt-8 grid max-w-xl grid-cols-2 gap-3">
          <div className="rounded-2xl border border-gold/20 bg-charcoal-deep/50 px-4 py-4">
            <Users size={18} className="mx-auto mb-2 text-gold" />
            <p className="text-2xl font-extrabold text-slate-100">{waiting.length}</p>
            <p className="text-xs text-slate-400">{t('reception.waiting')}</p>
          </div>
          <div className="rounded-2xl border border-gold/20 bg-charcoal-deep/50 px-4 py-4">
            <Clock3 size={18} className="mx-auto mb-2 text-gold" />
            <p className="text-2xl font-extrabold text-slate-100">{formatWait(wait).replace('about ', '')}</p>
            <p className="text-xs text-slate-400">{t('my.waitEstimate')}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link to="/join" className="w-full max-w-sm">
            <Button size="lg" className="w-full text-lg" disabled={!canJoin}>
              {t('home.join')} <ArrowRight size={20} className="ml-2 inline" />
            </Button>
          </Link>
          {!canJoin && <p className="max-w-sm text-xs leading-relaxed text-amber-300/80">{t('home.closedNote')}</p>}
          {myTicket && (
            <Link to={`/status/${myTicket.id}`} className="btn-ghost px-5 py-2.5 text-sm">
              {t('home.myStatus')} · S-{myTicket.token_no} · {positionOf(myTicket, data.tickets)}
            </Link>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-400">{t('home.barberStatus')}</h2>
        {data.barbers.length === 0 ? (
          <EmptyState icon={<Scissors size={30} />} title={t('home.noOne')} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {data.barbers.map((barber) => {
              const serving = active.find((ticket) => ticket.assigned_barber === barber.id && ['called', 'in_chair'].includes(ticket.status))
              const tone = !barber.active ? 'neutral' : barber.on_break ? 'amber' : serving ? 'gold' : 'green'
              const label = !barber.active ? t('common.off') : barber.on_break ? t('common.onBreak') : serving ? t('common.busy') : t('common.free')
              return (
                <div key={barber.id} className="card flex items-center gap-3 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 font-bold text-gold-soft">{barber.name[0]}</div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-100">{barber.name}</p>
                    <Badge tone={tone} className="mt-1 !px-2 !py-0.5 !text-[10px]">{label}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
