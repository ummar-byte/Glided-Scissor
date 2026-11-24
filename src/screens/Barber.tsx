import { ArrowRightLeft, CheckCircle2, Clock3, UserRound } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { Badge, Button, EmptyState, Toggle } from '../components/Ui'
import { useSalon } from '../context/SalonContext'
import { activeTickets, barberName, nextEligibleTicket, tokenText } from '../lib/queue'

function elapsedMinutes(iso: string | null) {
  if (!iso) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000))
}

export function Barber() {
  const { name } = useParams()
  const { data, t, lang, actions } = useSalon()
  const barber = data.barbers.find((b) => b.name.toLowerCase() === name?.toLowerCase())

  if (!barber) {
    return <EmptyState icon={<UserRound size={34} />} title="Barber not found" message="Check the link from the reception dashboard." />
  }

  const active = activeTickets(data.tickets)
  const current = active.find((ticket) => ticket.assigned_barber === barber.id && ['called', 'in_chair'].includes(ticket.status))
  const next = nextEligibleTicket(barber.id, data.tickets)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-lg font-extrabold text-gold-soft">{barberName(barber, lang)[0]}</div>
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl"><span className="gold-text">{t('barber.title')}</span></h1>
            <p className="text-sm text-slate-400">{barberName(barber, lang)} · {lang === 'gu' ? barber.speciality_gu : barber.speciality_en}</p>
          </div>
        </div>
        <Badge tone={barber.on_break ? 'amber' : 'green'}>{barber.on_break ? t('common.onBreak') : t('common.available')}</Badge>
      </div>

      <div className="card p-6 sm:p-8">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{t('barber.current')}</h2>
        {current ? (
          <div className="rise-in">
            <p className="gold-text text-5xl font-black">{tokenText(current.token_no)}</p>
            <p className="mt-2 text-xl font-bold">{current.customer_name}</p>
            <p className="mt-1 text-sm text-slate-400">{current.services.map((s) => (lang === 'gu' ? s.name_gu : s.name_en)).join(' · ')}</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-gold-soft"><Clock3 size={16} />
              {current.status === 'in_chair'
                ? t('barber.startedAgo', { n: elapsedMinutes(current.started_at) })
                : t('status.called')}
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Button size="lg" disabled={current.status !== 'called'} onClick={async () => { try { await actions.setStatus(current.id, 'in_chair') } catch { /* toast */ } }}>
                {t('barber.start')}
              </Button>
              <Button size="lg" variant="ghost" disabled={current.status !== 'in_chair'} onClick={async () => { try { await actions.setStatus(current.id, 'done') } catch { /* toast */ } }}>
                <CheckCircle2 size={18} className="mr-2" />{t('barber.done')}
              </Button>
            </div>
          </div>
        ) : (
          <EmptyState icon={<UserRound size={34} />} title={t('barber.noOne')} />
        )}
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('barber.next')}</p>
          <p className="mt-2 font-bold text-slate-100">{next ? `${tokenText(next.token_no)} · ${next.customer_name}` : '—'}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{barber.on_break ? t('barber.toggleAvailable') : t('barber.toggleBreak')}</span>
          <Toggle
            checked={!barber.on_break}
            label={t('common.available')}
            onChange={async (available) => {
              try { await actions.saveBarber({ ...barber, on_break: !available }) } catch { /* toast */ }
            }}
          />
          <ArrowRightLeft size={16} className="text-gold" />
        </div>
      </div>
    </div>
  )
}
