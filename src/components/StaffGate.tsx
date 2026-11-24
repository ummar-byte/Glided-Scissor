import { useState, type ReactNode } from 'react'
import { LockKeyhole } from 'lucide-react'
import { useSalon } from '../context/SalonContext'
import { Button, Field } from './Ui'

const KEY = 'salon-staff-auth'

export function StaffGate({ children }: { children: ReactNode }) {
  const { data, t, notify, mode } = useSalon()
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(KEY) === '1')
  const [pin, setPin] = useState('')

  if (unlocked) return <>{children}</>

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (pin === data.settings.staff_pin) {
      sessionStorage.setItem(KEY, '1')
      setUnlocked(true)
      notify(t('common.staffOnly'))
    } else {
      setPin('')
      notify(t('common.invalidPin'), 'error')
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-10">
      <div className="card w-full p-8 rise-in">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15 text-gold"><LockKeyhole size={26} /></div>
        <h1 className="text-center text-2xl font-extrabold text-gold-soft">{t('common.staffOnly')}</h1>
        <p className="mt-2 text-center text-sm text-slate-400">The Gilded Scissor</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <Field
            label={t('common.pin')}
            type="password"
            inputMode="numeric"
            maxLength={4}
            pattern="[0-9]{4}"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
          />
          <Button type="submit" size="lg" className="w-full" disabled={pin.length !== 4}>{t('common.enterPin')}</Button>
        </form>
        {mode === 'demo' && <p className="mt-5 text-center text-xs text-slate-500">Lab PIN: <span className="font-bold text-gold-soft">{data.settings.staff_pin}</span></p>}
      </div>
    </div>
  )
}
