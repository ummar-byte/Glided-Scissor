import { useState } from 'react'
import { Pencil, Plus, Settings2, Trash2 } from 'lucide-react'
import { Badge, Button, EmptyState, Field, Modal, StatCard, Toggle } from '../components/Ui'
import { useSalon } from '../context/SalonContext'
import { queueStats } from '../lib/queue'
import type { Service } from '../types'

const blankService: Service = {
  id: '', name_en: '', name_gu: '', minutes: 30, price: 150, active: true, sort_order: 99,
}

export function Admin() {
  const { data, t, actions, notify, lang } = useSalon()
  const [editing, setEditing] = useState<Service | null>(null)
  const [error, setError] = useState('')
  const stats = queueStats(data.tickets)

  function validate(service: Service) {
    return service.name_en.trim().length >= 2 && service.name_gu.trim().length >= 2 &&
      service.minutes >= 5 && service.minutes <= 180 && service.price >= 0 && service.price <= 10000
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    if (!validate(editing)) { setError(t('admin.validation')); return }
    try {
      await actions.saveService({ ...editing, id: editing.id || crypto.randomUUID() })
      setEditing(null)
      setError('')
      notify(t('common.save'))
    } catch { /* toast shown */ }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl"><span className="gold-text">{t('admin.title')}</span></h1>
          <p className="mt-1 text-sm text-slate-400">The Gilded Scissor · {t('common.today')}</p>
        </div>
        <Button onClick={() => { setEditing({ ...blankService }); setError('') }}><Plus size={16} className="mr-2" />{t('admin.addService')}</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t('common.served')} value={stats.served} />
        <StatCard label={t('common.avgWait')} value={`${stats.averageWait} ${t('common.min')}`} />
        <StatCard label={t('common.noShows')} value={stats.noShows} />
        <StatCard label={t('common.revenue')} value={`₹${stats.revenue}`} />
      </div>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-slate-400"><Settings2 size={16} /> {t('admin.services')}</h2>
        {data.services.length === 0 ? (
          <EmptyState icon={<Settings2 size={30} />} title={t('admin.services')} />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-gold/20 text-xs uppercase tracking-wider text-slate-400">
                  <tr><th className="px-5 py-3">{t('admin.nameEn')}</th><th className="px-5 py-3">{t('admin.nameGu')}</th><th className="px-5 py-3">{t('admin.minutes')}</th><th className="px-5 py-3">{t('admin.price')}</th><th className="px-5 py-3">{t('admin.active')}</th><th className="px-5 py-3" /></tr>
                </thead>
                <tbody className="divide-y divide-slate-600/25">
                  {data.services.map((service) => (
                    <tr key={service.id} className={service.active ? '' : 'opacity-50'}>
                      <td className="px-5 py-3 font-semibold">{service.name_en}</td>
                      <td className="px-5 py-3 text-slate-300">{service.name_gu}</td>
                      <td className="px-5 py-3 text-slate-300">{service.minutes} {t('common.min')}</td>
                      <td className="px-5 py-3 text-slate-300">₹{service.price}</td>
                      <td className="px-5 py-3"><Toggle checked={service.active} label={service.name_en} onChange={(active) => void actions.saveService({ ...service, active })} /></td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-gold-soft" onClick={() => { setEditing({ ...service }); setError('') }} aria-label={t('common.edit')}><Pencil size={16} /></button>
                          <button className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-300" onClick={async () => {
                            if (!window.confirm(t('admin.deleteConfirm'))) return
                            try { await actions.deleteService(service.id) } catch { /* toast */ }
                          }} aria-label={t('common.delete')}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-400">{t('admin.barbers')}</h2>
          <div className="space-y-3">
            {data.barbers.map((barber) => (
              <div key={barber.id} className="flex items-center justify-between gap-3 rounded-xl bg-charcoal-deep/50 p-4">
                <div>
                  <p className="font-bold">{barber.name}</p>
                  <p className="text-xs text-slate-400">{lang === 'gu' ? barber.speciality_gu : barber.speciality_en}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={barber.on_break ? 'amber' : 'green'}>{barber.on_break ? t('common.onBreak') : t('common.available')}</Badge>
                  <Toggle checked={barber.active} label={barber.name} onChange={(active) => void actions.saveBarber({ ...barber, active })} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card space-y-6 p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">{t('admin.queueSwitch')}</h2>
          <div className="flex items-center justify-between gap-4 rounded-xl bg-charcoal-deep/50 p-4">
            <div>
              <p className="font-bold">{t('admin.queueSwitch')}</p>
              <p className="text-xs text-slate-400">{t('home.closedNote')}</p>
            </div>
            <Toggle checked={data.settings.queue_open} label={t('admin.queueSwitch')} onChange={(queue_open) => void actions.updateSettings({ queue_open })} />
          </div>
          <Field label={t('admin.closeTime')} type="time" value={data.settings.close_time} onChange={(e) => void actions.updateSettings({ close_time: e.target.value })} />
          <Field label={t('admin.pinLabel')} value={data.settings.staff_pin} inputMode="numeric" maxLength={4} onChange={(e) => void actions.updateSettings({ staff_pin: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
        </section>
      </div>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? t('common.edit') : t('admin.addService')} actions={<>
        <Button variant="ghost" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
        <Button type="submit" form="service-form">{t('common.save')}</Button>
      </>}>
        {editing && (
          <form id="service-form" onSubmit={save} className="space-y-4">
            <Field label={t('admin.nameEn')} value={editing.name_en} onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} placeholder="Haircut" />
            <Field label={t('admin.nameGu')} value={editing.name_gu} onChange={(e) => setEditing({ ...editing, name_gu: e.target.value })} placeholder="હેરકટ" />
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('admin.minutes')} type="number" min={5} max={180} value={editing.minutes} onChange={(e) => setEditing({ ...editing, minutes: Number(e.target.value) })} />
              <Field label={t('admin.price')} type="number" min={0} max={10000} value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
            </div>
            <div className="flex items-center gap-3"><Toggle checked={editing.active} label={t('admin.active')} onChange={(active) => setEditing({ ...editing, active })} /><span className="text-sm text-slate-300">{t('admin.active')}</span></div>
            {error && <p className="text-xs text-red-300">{error}</p>}
          </form>
        )}
      </Modal>
    </div>
  )
}
