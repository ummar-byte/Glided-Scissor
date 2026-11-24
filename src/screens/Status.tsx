import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, BellRing, CheckCircle2, Clock3, MapPin, Users, XCircle } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Button, Modal, Spinner } from '../components/Ui'
import { useSalon } from '../context/SalonContext'
import { ordinal } from '../i18n'
import { canCancel, estimateWaitMinutes, formatClock, formatWait, positionOf, statusKey, tokenText, waitingTickets } from '../lib/queue'
import { playChime, vibrate } from '../lib/sound'

export function Status() {
  const { id } = useParams()
  const { data, loading, t, lang, actions, notify, refresh } = useSalon()
  const navigate = useNavigate()
  const ticket = data.tickets.find((item) => item.id === id)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [dismissedCall, setDismissedCall] = useState(false)
  const [checking, setChecking] = useState(!ticket)
  const previousStatus = useRef(ticket?.status)

  // A freshly created token reaches this tab through realtime a moment after navigation.
  useEffect(() => {
    if (ticket) { setChecking(false); return }
    let cancelled = false
    setChecking(true)
    void refresh().finally(() => {
      if (cancelled) return
      window.setTimeout(() => { if (!cancelled) setChecking(false) }, 1500)
    })
    return () => { cancelled = true }
  }, [ticket?.id, refresh])

  useEffect(() => {
    if (ticket && previousStatus.current !== 'called' && ticket.status === 'called') {
      playChime()
      vibrate()
      setDismissedCall(false)
    }
    previousStatus.current = ticket?.status
  }, [ticket?.status, ticket?.id])

  if (!ticket && (loading || checking)) return <Spinner />

  if (!ticket) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <XCircle size={48} className="mx-auto text-red-300" />
        <h1 className="mt-5 text-2xl font-bold">{t('my.notFound')}</h1>
        <Link to="/" className="btn-gold mt-8 inline-flex px-6 py-3"><ArrowLeft size={16} className="mr-2" /> {t('common.back')}</Link>
      </div>
    )
  }

  const position = positionOf(ticket, data.tickets)
  const wait = estimateWaitMinutes(ticket, data.tickets, data.barbers)
  const barber = data.barbers.find((b) => b.id === ticket.assigned_barber)
  const preferred = data.barbers.find((b) => b.id === ticket.barber_preference)
  const totalWaiting = waitingTickets(data.tickets).length
  const calledOverlay = ticket.status === 'called' && !dismissedCall

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {calledOverlay && (
        <div className="turn-pulse fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gold via-gold-soft to-gold px-6 text-center text-charcoal">
          <BellRing size={52} className="mb-4 animate-bounce" />
          <p className="text-lg font-bold uppercase tracking-[0.3em]">{tokenText(ticket.token_no)}</p>
          <h1 className="mt-3 text-5xl font-black leading-tight sm:text-7xl">{t('my.itsYourTurn')}</h1>
          <p className="mt-6 text-2xl font-extrabold sm:text-3xl">{t('my.goTo', { barber: barber?.name ?? preferred?.name ?? t('common.any') })}</p>
          <button onClick={() => setDismissedCall(true)} className="mt-10 rounded-full border-2 border-charcoal/40 px-6 py-3 text-sm font-bold hover:bg-charcoal/10">{t('common.close')}</button>
        </div>
      )}

      <div className="card overflow-hidden rise-in">
        <div className="border-b border-gold/20 bg-gradient-to-br from-gold/15 to-transparent px-6 py-8 text-center sm:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-soft">{t('my.token')}</p>
          <p className="gold-text mt-2 text-7xl font-black tracking-tighter sm:text-8xl">{tokenText(ticket.token_no)}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Badge tone={ticket.status === 'called' ? 'gold' : ticket.status === 'in_chair' ? 'green' : 'neutral'}>
              {t(statusKey(ticket.status))}
            </Badge>
            {ticket.status === 'waiting' && <Badge tone="gold"><Users size={12} /> {t('my.position', { n: ordinal(lang, position) })}</Badge>}
          </div>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          {ticket.status === 'waiting' && position === 2 && (
            <div className="flex items-center gap-3 rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm font-semibold text-amber-200">
              <MapPin size={20} className="shrink-0" /> {t('my.startComing')}
            </div>
          )}

          {ticket.status === 'called' && !calledOverlay && (
            <div className="flex items-center gap-3 rounded-2xl border border-gold/50 bg-gold/10 p-4 text-sm font-bold text-gold-soft">
              <BellRing size={20} /> {t('my.goTo', { barber: barber?.name ?? t('common.any') })}
            </div>
          )}

          {ticket.status === 'in_chair' && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-200">
              <CheckCircle2 size={20} /> {t('my.inChair', { barber: barber?.name ?? t('common.any') })}
            </div>
          )}

          {['done', 'cancelled', 'no_show'].includes(ticket.status) && (
            <div className="rounded-2xl border border-gold/30 bg-gold/5 p-6 text-center">
              <CheckCircle2 size={34} className="mx-auto text-gold" />
              <p className="mt-3 font-semibold text-slate-200">{t(`my.${ticket.status === 'no_show' ? 'noShow' : ticket.status}`)}</p>
              <Link to="/join" className="btn-gold mt-5 inline-flex px-6 py-3 text-sm">{t('my.joinAgain')}</Link>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-charcoal-deep/60 p-4">
              <Clock3 size={18} className="mb-2 text-gold" />
              <p className="text-2xl font-extrabold">{formatWait(wait, lang)}</p>
              <p className="text-xs text-slate-400">{t('my.waitEstimate')}</p>
            </div>
            <div className="rounded-2xl bg-charcoal-deep/60 p-4">
              <p className="text-sm font-bold text-slate-200">{ticket.customer_name}</p>
              <p className="mt-1 text-xs text-slate-400">{ticket.services.map((s) => (lang === 'gu' ? s.name_gu : s.name_en)).join(' · ')}</p>
              <p className="mt-1 text-xs text-slate-400">{t('common.barber')}: {preferred?.name ?? t('common.any')}</p>
              <p className="mt-1 text-xs text-slate-500">{t('my.joinedAt')} {formatClock(ticket.joined_at, lang)}</p>
            </div>
          </div>

          {ticket.status === 'waiting' && (
            <div>
              <div className="mb-2 flex justify-between text-xs text-slate-400">
                <span>{t('my.position', { n: ordinal(lang, position) })}</span>
                <span>{totalWaiting} {t('reception.waiting').toLowerCase()}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-700">
                <div className="h-full rounded-full bg-gradient-to-r from-gold-soft to-gold transition-all duration-700" style={{ width: `${Math.max(6, 100 - ((position - 1) / Math.max(1, totalWaiting)) * 100)}%` }} />
              </div>
            </div>
          )}

          {canCancel(ticket) && (
            <div className="flex justify-center border-t border-slate-600/40 pt-5">
              <Button variant="ghost" onClick={() => setConfirmCancel(true)}><XCircle size={16} className="mr-2" /> {t('my.cancelSpot')}</Button>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title={t('my.cancelSpot')}
        actions={<>
          <Button variant="ghost" onClick={() => setConfirmCancel(false)}>{t('common.back')}</Button>
          <Button variant="danger" onClick={async () => {
            try {
              await actions.cancel(ticket.id)
              setConfirmCancel(false)
              notify(t('my.cancelled'))
            } catch { /* toast shown */ }
          }}>{t('common.confirm')}</Button>
        </>}
      >
        {t('my.cancelConfirm')}
      </Modal>

      <div className="text-center">
        <button onClick={() => navigate('/')} className="text-sm text-slate-400 hover:text-gold-soft"><ArrowLeft size={14} className="mr-1 inline" /> {t('common.back')}</button>
      </div>
    </div>
  )
}
