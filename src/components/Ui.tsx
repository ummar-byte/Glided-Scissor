import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { X } from 'lucide-react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'gold' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'gold', size = 'md', className = '', ...props }: ButtonProps) {
  const sizes = { sm: 'px-4 py-2 text-sm', md: 'px-5 py-3 text-sm', lg: 'px-7 py-4 text-base' }
  const base = variant === 'gold' ? 'btn-gold' : variant === 'ghost' ? 'btn-ghost' : 'btn-ghost !border-red-400/50 !text-red-300 hover:!bg-red-500/10'
  return <button className={`${base} ${sizes[size]} min-h-11 ${className}`} {...props} />
}

export function Badge({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: 'neutral' | 'gold' | 'green' | 'amber' | 'red'; className?: string }) {
  const tones = {
    neutral: 'bg-slate-500/15 text-slate-300 border-slate-400/25',
    gold: 'bg-gold/15 text-gold-soft border-gold/40',
    green: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
    red: 'bg-red-500/15 text-red-300 border-red-400/30',
  }
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone]} ${className}`}>{children}</span>
}

export function Field({ label, error, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-300">{label}</span>
      <input className={`field ${error ? '!border-red-400' : ''}`} {...props} />
      {hint && !error && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-red-300">{error}</span>}
    </label>
  )
}

export function Modal({ open, onClose, title, children, actions }: { open: boolean; onClose: () => void; title: string; children: ReactNode; actions: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md p-6 rise-in" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-gold-soft">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 text-slate-400 hover:bg-white/10"><X size={18} /></button>
        </div>
        <div className="text-sm leading-relaxed text-slate-300">{children}</div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">{actions}</div>
      </div>
    </div>
  )
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (value: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-13 min-w-13 rounded-full transition-colors ${checked ? 'bg-gold' : 'bg-slate-600'} ${disabled ? 'opacity-40' : ''}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-8' : 'left-1'}`} />
    </button>
  )
}

export function EmptyState({ icon, title, message }: { icon: ReactNode; title: string; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-500/30 px-6 py-12 text-center">
      <div className="mb-4 text-gold/70">{icon}</div>
      <p className="font-semibold text-slate-200">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-400">{message}</p>}
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold/25 border-t-gold" />
    </div>
  )
}

export function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-gold-soft">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  )
}
