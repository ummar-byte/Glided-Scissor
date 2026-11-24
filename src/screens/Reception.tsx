import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock3, Plus, Users } from 'lucide-react'
import { Badge, Button, EmptyState, Field, Modal, StatCard } from '../components/Ui'
import { useSalon } from '../context/SalonContext'
import {
  activeTickets, barberName, byJoinedAt, canCallNext, canCancel, canMarkNoShow,
  formatClock, noShowWindowElapsed, statusKey, tokenText, waitingOver60, waitingTickets,
} from '../lib/queue'
import type { JoinInput, Ticket } from '../types'

function elapsedMinutes(iso: string | null) {
  if (!iso) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000))
}

function BarberCard({ barberId }: { barberId: string }) {
  const { data, t, actions, lang } = useSalon()
  const barber = data.barbers.find((b) => b.id === barberId)!
  const current = activeTickets(data.tickets).find((ticket) => ticket.assigned_barber === barberId && ['called', 'in_chair'].includes(ticket.status))
  const remaining = current ? Math.max(0, current.total_minutes - elapsedMinutes(current.started_at ?? current.called_at)) : 0
  const progress = current ? Math.min(100, (elapsedMinutes(current.started_at ?? current.called_at) / Math.max(1, current.total_minutes)) * 100) : 0
  const canCall = canCallNext(barber, data.tickets)

  return (
    <div className={`card flex flex-col gap-4 p-5 ${barber.on_break || !barber.active ? 'opacity-65' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-lg font-extrabold text-gold-soft">{barberName(barber, lang)[0]}</div>
        <div className="min-w-0">
          <p className="truncate font-bold">{barberName(barber, lang)}</p>
          <Badge tone={!barber.active ? 'neutral' : barber.on_break ? 'amber' : current ? 'gold' : 'green'} className="!px-2 !py-0.5 !text-[10px]">
            {!barber.active ? t('common.off') : barber.on_break ? t('common.onBreak') : current ? t('common.busy') : t('common.free')}
          </Badge>
        </div>
      </div>

      {current ? (
        <div>
          <p className="text-xs text-slate-400">{t(statusKey(current.status))}</p>
          <p className="mt-1 font-bold text-gold-soft">{tokenText(current.token_no)} · {current.customer_name}</p>
          <p className="mt-1 text-xs text-slate-400">{current.services.map((s) => (lang === 'gu' ? s.name_gu : s.name_en)).join(', ')}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-700">
            <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">{remaining} {t('reception.timeLeft')}</p>
        </div>
      ) : (
        <p className="text-sm text-slate-500">{t('barber.noOne')}</p>
      )}

      <Button
        size="sm"
        className="mt-auto w-full"
        disabled={!canCall}
        title={barber.on_break ? t('reception.breakCantCall') : ''}
        onClick={async () => { try { await actions.callNext(barberId) } catch { /* toast shown */ } }}
      >
        {t('reception.callNext')}
      </Button>
    </div>
  )
}

function WaitingRow({ ticket }: { ticket: Ticket }) {
  const { data, t, lang, actions } = useSalon()
  const barber = data.barbers.find((b) => b.id === ticket.barber_preference)
  const long = waitingOver60(ticket)
  const mins = elapsedMinutes(ticket.joined_at)
  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-2xl border p-4 ${long ? 'border-amber-400/50 bg-amber-500/10' : 'border-slate-600/30 bg-charcoal-deep/50'}`}>
      <div className="flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-gold/35 bg-gold/10">
        <span className="text-xs text-slate-400">{t('common.queue')}</span>
        <span className="text-sm font-extrabold text-gold-soft">{tokenText(ticket.token_no)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 font-bold">{ticket.customer_name}
          {long && <Badge tone="amber"><AlertTriangle size={11} /> {t('reception.longWait')}</Badge>}
          {ticket.source === 'walk_in' && <Badge tone="neutral">{t('join.walkIn')}</Badge>}
        </p>
        <p className="mt-1 text-xs text-slate-400">{ticket.services.map((s) => (lang === 'gu' ? s.name_gu : s.name_en)).join(' · ')}</p>
        <p className="mt-1 text-xs text-slate-500">{barber ? barberName(barber, lang) : t('common.any')} · {formatClock(ticket.joined_at, lang)} · {mins} {t('common.min')}</p>
      </div>
      <div className="flex gap-2">
        {canMarkNoShow(ticket) && (
          <Button variant="ghost" size="sm" disabled={!noShowWindowElapsed(ticket)} title={noShowWindowElapsed(ticket) ? '' : '10 min window'} onClick={async () => { try { await actions.noShow(ticket.id) } catch { /* toast shown */ } }}>
            {t('reception.noShow')}
          </Button>
        )}
        {canCancel(ticket) && (
          <Button variant="danger" size="sm" onClick={async () => { try { await actions.cancel(ticket.id) } catch { /* toast */ } }}>{t('reception.cancel')}</Button>
        )}
      </div>
    </div>
  )
}

export function Reception() {
  const { data, t, actions, lang } = useSalon()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<JoinInput>({ customerName: '', phone: '', serviceIds: [], barberPreference: null, source: 'walk_in' })
  const [error, setError] = useState('')

  const active = activeTickets(data.tickets)
  const waiting = useMemo(() => waitingTickets(data.tickets), [data.tickets])
  const serving = active.filter((ticket) => ['called', 'in_chair'].includes(ticket.status))
  const doneToday = data.tickets.filter((ticket) => ticket.status === 'done').length

  async function addWalkIn(e: React.FormEvent) {
    e.preventDefault()
    if (form.customerName.trim().length < 2 || !/^[6-9]\d{9}$/.test(form.phone) || form.serviceIds.length === 0) {
      setError(t('admin.validation'))
      return
    }
    try {
      await actions.join(form)
      setOpen(false)
      setForm({ customerName: '', phone: '', serviceIds: [], barberPreference: null, source: 'walk_in' })
      setError('')
    } catch { /* toast shown */ }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl"><span className="gold-text">{t('reception.title')}</span></h1>
          <p className="mt-1 text-sm text-slate-400">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={data.settings.queue_open ? 'green' : 'amber'}><span className={`h-2 w-2 rounded-full ${data.settings.queue_open ? 'bg-emerald-400' : 'bg-amber-400'}`} />{data.settings.queue_open ? t('common.open') : t('common.closed')}</Badge>
          <Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2" />{t('reception.addWalkIn')}</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label={t('reception.waiting')} value={waiting.length} />
        <StatCard label={t('reception.serving')} value={serving.length} />
        <StatCard label={t('reception.doneCount')} value={doneToday} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-slate-400">{t('common.barber')}</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {data.barbers.map((barber) => <BarberCard key={barber.id} barberId={barber.id} />)}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-slate-400"><Users size={16} /> {t('reception.waiting')} ({waiting.length})</h2>
          <span className="text-xs text-slate-500">{t('reception.longWait')}</span>
        </div>
        {waiting.length === 0 ? (
          <EmptyState icon={<CheckCircle2 size={34} />} title={t('reception.noWaiting')} />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {waiting.slice().sort(byJoinedAt).map((ticket) => <WaitingRow key={ticket.id} ticket={ticket} />)}
          </div>
        )}
      </section>

      <Modal open={open} onClose={() => setOpen(false)} title={t('reception.walkInTitle')} actions={<>
        <Button variant="ghost" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
        <Button onClick={addWalkIn} type="submit" form="walkin-form">{t('common.confirm')}</Button>
      </>}>
        <form id="walkin-form" onSubmit={addWalkIn} className="space-y-4">
          <Field label={t('join.yourName')} value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="Kunal Shah" />
          <Field label={t('join.phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="9876543210" inputMode="numeric" />
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-300">{t('join.chooseServices')}</p>
            <div className="flex flex-wrap gap-2">
              {data.services.filter((s) => s.active).map((s) => {
                const chosen = form.serviceIds.includes(s.id)
                return <button type="button" key={s.id} onClick={() => setForm({ ...form, serviceIds: chosen ? form.serviceIds.filter((id) => id !== s.id) : [...form.serviceIds, s.id].slice(0, 3) })} className={`rounded-full border px-3 py-2 text-xs ${chosen ? 'border-gold bg-gold/15 text-gold-soft' : 'border-slate-500/40 text-slate-300'}`}>{lang === 'gu' ? s.name_gu : s.name_en} · {s.minutes}m</button>
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-300">{t('join.barber')}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setForm({ ...form, barberPreference: null })} className={`rounded-full border px-3 py-2 text-xs ${form.barberPreference === null ? 'border-gold bg-gold/15 text-gold-soft' : 'border-slate-500/40 text-slate-300'}`}>{t('join.anyFastest')}</button>
              {data.barbers.filter((b) => b.active && !b.on_break).map((b) => <button type="button" key={b.id} onClick={() => setForm({ ...form, barberPreference: b.id })} className={`rounded-full border px-3 py-2 text-xs ${form.barberPreference === b.id ? 'border-gold bg-gold/15 text-gold-soft' : 'border-slate-500/40 text-slate-300'}`}>{barberName(b, lang)}</button>)}
            </div>
          </div>
          {error && <p className="text-xs text-red-300">{error}</p>}
          <p className="flex items-center gap-2 text-xs text-slate-500"><Clock3 size={12} /> {t('reception.source')}: {t('join.walkIn')}</p>
        </form>
      </Modal>
    </div>
  )
}
