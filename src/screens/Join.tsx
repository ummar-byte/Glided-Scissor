import { useMemo, useState } from 'react'
import { AlertCircle, Check, Clock3, Scissors, UserRound, Wallet } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, Field } from '../components/Ui'
import { useSalon } from '../context/SalonContext'
import { activeTickets, estimateWaitMinutes, formatWait, onlineJoiningOpen, validateName, validatePhone, waitingTickets } from '../lib/queue'
import type { JoinInput } from '../types'

export function Join() {
  const { data, t, actions, notify, lang } = useSalon()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [serviceIds, setServiceIds] = useState<string[]>([])
  const [barberPreference, setBarberPreference] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)

  const canJoin = onlineJoiningOpen(data.settings)
  const active = activeTickets(data.tickets)
  const existing = active.find((ticket) => ticket.phone === phone)

  const selected = data.services.filter((s) => serviceIds.includes(s.id) && s.active)
  const totalMinutes = selected.reduce((sum, s) => sum + s.minutes, 0)
  const totalPrice = selected.reduce((sum, s) => sum + s.price, 0)
  const wait = useMemo(
    () => estimateWaitMinutes(waitingTickets(data.tickets).length + 1, data.tickets, data.barbers),
    [data.tickets, data.barbers],
  )

  const errors = {
    name: !validateName(name) ? t('join.nameError') : '',
    phone: !validatePhone(phone) ? t('join.phoneError') : '',
    services: selected.length === 0 ? t('join.serviceError') : '',
  }
  const valid = !Object.values(errors).some(Boolean) && !existing && canJoin

  function toggleService(id: string) {
    setServiceIds((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id)
      if (prev.length >= 3) {
        notify(t('join.maxReached'), 'error')
        return prev
      }
      return [...prev, id]
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!valid || busy) return
    setBusy(true)
    try {
      const input: JoinInput = { customerName: name.trim(), phone, serviceIds, barberPreference }
      const ticket = await actions.join(input)
      localStorage.setItem('salon-my-phone', phone)
      navigate(`/status/${ticket.id}`)
    } catch {
      /* toast already shown by the context */
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold sm:text-4xl"><span className="gold-text">{t('join.title')}</span></h1>
        <p className="mt-2 text-sm text-slate-400">{t('join.subtitle')}</p>
      </div>

      {!canJoin && (
        <div className="card flex items-start gap-3 border-amber-400/40 p-4 text-sm text-amber-200">
          <AlertCircle size={18} className="mt-0.5 shrink-0" /> {t('home.closedNote')}
        </div>
      )}

      {existing && (
        <div className="card flex flex-wrap items-center justify-between gap-3 border-gold/50 p-4 text-sm">
          <span className="flex items-center gap-2 text-gold-soft"><AlertCircle size={18} /> {t('join.existingBanner')}</span>
          <Link to={`/status/${existing.id}`} className="btn-ghost px-4 py-2 text-xs">{t('join.viewSpot')}</Link>
        </div>
      )}

      <form onSubmit={submit} className="card space-y-8 p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('join.yourName')} value={name} onChange={(e) => setName(e.target.value)} placeholder="Kunal Shah" error={touched ? errors.name : ''} autoComplete="name" />
          <Field label={t('join.phone')} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" inputMode="numeric" error={touched ? errors.phone : ''} autoComplete="tel" />
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-300"><Scissors size={16} className="text-gold" /> {t('join.chooseServices')}</h2>
            <span className="text-xs text-slate-400">{serviceIds.length}/3</span>
          </div>
          {touched && errors.services && <p className="mb-3 text-xs text-red-300">{errors.services}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            {data.services.filter((s) => s.active).map((service) => {
              const selectedService = serviceIds.includes(service.id)
              return (
                <button
                  type="button"
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  className={`card flex items-start justify-between gap-3 p-4 text-left transition ${selectedService ? 'card-selected' : 'hover:border-gold/35'}`}
                >
                  <span>
                    <span className="block font-bold text-slate-100">{lang === 'gu' ? service.name_gu : service.name_en}</span>
                    <span className="mt-1 block text-xs text-slate-400">{service.minutes} {t('common.min')} · ₹{service.price}</span>
                  </span>
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selectedService ? 'border-gold bg-gold text-charcoal' : 'border-slate-500'}`}>
                    {selectedService && <Check size={14} strokeWidth={3} />}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-300"><UserRound size={16} className="text-gold" /> {t('join.barber')}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button type="button" onClick={() => setBarberPreference(null)} className={`card p-4 text-left ${barberPreference === null ? 'card-selected' : 'hover:border-gold/35'}`}>
              <p className="font-bold text-slate-100">{t('join.anyFastest')}</p>
              <p className="mt-1 text-xs text-gold-soft">⚡ {t('join.anyFastest')}</p>
            </button>
            {data.barbers.filter((b) => b.active).map((barber) => (
              <button type="button" key={barber.id} onClick={() => setBarberPreference(barber.id)} className={`card p-4 text-left ${barberPreference === barber.id ? 'card-selected' : 'hover:border-gold/35'}`}>
                <p className="font-bold text-slate-100">{barber.name}</p>
                <p className="mt-1 text-xs text-slate-400">{lang === 'gu' ? barber.speciality_gu : barber.speciality_en}</p>
                {barber.on_break && <p className="mt-2 text-[11px] text-amber-300">{barber.name} {t('join.breakWarning')}</p>}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gold/25 bg-charcoal-deep/60 p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-gold-soft">{t('join.summary')}</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><Clock3 size={16} className="mx-auto mb-1 text-gold" /><p className="text-lg font-extrabold">{totalMinutes} <span className="text-xs font-normal text-slate-400">{t('common.min')}</span></p><p className="text-[11px] text-slate-400">{t('join.totalTime')}</p></div>
            <div><Wallet size={16} className="mx-auto mb-1 text-gold" /><p className="text-lg font-extrabold">₹{totalPrice}</p><p className="text-[11px] text-slate-400">{t('join.totalPrice')}</p></div>
            <div><Badge tone="gold" className="!text-xs">{formatWait(wait)}</Badge><p className="mt-2 text-[11px] text-slate-400">{t('join.expectedWait')}</p></div>
          </div>
        </section>

        <Button type="submit" size="lg" className="w-full text-lg" disabled={busy || !valid}>
          {busy ? '…' : t('common.confirm')}
        </Button>
      </form>
    </div>
  )
}
