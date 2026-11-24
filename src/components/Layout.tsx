import { CheckCircle2, Languages, LayoutDashboard, Home, Monitor, Scissors, ShieldCheck, XCircle } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useSalon } from '../context/SalonContext'
import { Spinner } from './Ui'

function LanguageButton() {
  const { lang, setLang, t } = useSalon()
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'gu' : 'en')}
      className="btn-ghost flex min-h-11 items-center gap-2 px-3 text-xs font-bold sm:text-sm"
      title={t('lang.label')}
    >
      <Languages size={16} className="text-gold" />
      {t('lang.label')}
    </button>
  )
}

function Toast() {
  const { toast } = useSalon()
  if (!toast) return null
  return (
    <div className={`fixed bottom-5 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border px-5 py-3 text-center text-sm font-semibold shadow-2xl rise-in ${toast.kind === 'error' ? 'border-red-400/40 bg-red-950/95 text-red-200' : 'border-gold/40 bg-charcoal/95 text-gold-soft'}`}>
      {toast.kind === 'error' ? <XCircle size={16} className="mr-2 inline" /> : <CheckCircle2 size={16} className="mr-2 inline" />}
      {toast.message}
    </div>
  )
}

export function Layout() {
  const { mode, t, loading } = useSalon()
  const { pathname } = useLocation()

  if (loading) return <Spinner />

  if (pathname === '/display') {
    return (
      <>
        <Outlet />
        <Toast />
      </>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-gold/15 bg-charcoal-deep/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/40 bg-gold/10 text-gold"><Scissors size={20} /></span>
            <span className="leading-tight">
              <span className="block text-sm font-extrabold tracking-wide text-gold-soft sm:text-base">{t('app.name')}</span>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-slate-400">{t('app.tagline')}</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <Link to="/" className="btn-ghost flex items-center gap-2 border-transparent px-4"><Home size={16} /> {t('home.join')}</Link>
            <Link to="/display" className="btn-ghost flex items-center gap-2 border-transparent px-4"><Monitor size={16} /> TV</Link>
            <Link to="/reception" className="btn-ghost flex items-center gap-2 border-transparent px-4"><LayoutDashboard size={16} /> {t('common.staffOnly')}</Link>
          </nav>
          <LanguageButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-gold/10 px-4 py-4 text-center text-xs text-slate-500">
        <p>{mode === 'demo' ? t('common.demoMode') : t('app.name')} · <ShieldCheck size={12} className="inline" /> Vibe Coding Lab</p>
        <div className="mt-2 flex justify-center gap-4 md:hidden">
          <Link to="/" className="hover:text-gold-soft">Home</Link>
          <Link to="/display" className="hover:text-gold-soft">TV</Link>
          <Link to="/reception" className="hover:text-gold-soft">Staff</Link>
        </div>
      </footer>
      <Toast />
    </div>
  )
}
