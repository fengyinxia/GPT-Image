import { useStore } from '../store'

export default function Header() {
  const setShowSettings = useStore((s) => s.setShowSettings)

  return (
    <header className="sticky top-0 z-40 overflow-hidden border-b border-slate-200/75 bg-stone-50/90 shadow-sm shadow-slate-950/[0.03] backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-950/90 dark:shadow-black/20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_20%,rgba(20,184,166,0.18),transparent_30%),radial-gradient(circle_at_72%_10%,rgba(245,158,11,0.16),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.03),transparent_45%)] dark:bg-[radial-gradient(circle_at_8%_20%,rgba(45,212,191,0.18),transparent_30%),radial-gradient(circle_at_72%_10%,rgba(251,191,36,0.13),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_45%)]" />
        <div className="absolute inset-0 opacity-[0.055] [background-image:linear-gradient(90deg,currentColor_1px,transparent_1px),linear-gradient(0deg,currentColor_1px,transparent_1px)] [background-size:22px_22px] text-slate-900 dark:text-white" />
      </div>

      <div className="relative mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:min-h-24 sm:py-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] border border-white/75 bg-white/80 text-teal-700 shadow-lg shadow-teal-900/[0.08] transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-teal-200 dark:shadow-black/25 dark:hover:bg-white/[0.12]"
            title="设置"
            aria-label="打开设置"
          >
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 28 28" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7.5 6.5h13A2.5 2.5 0 0 1 23 9v10a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 5 19V9a2.5 2.5 0 0 1 2.5-2.5Z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m8.5 18 4.2-4.2a1.6 1.6 0 0 1 2.2 0l1.1 1.1 1.2-1.2a1.6 1.6 0 0 1 2.2 0L22 16.3M9.5 10.5h.01" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.5 3.5v3M22.2 4.8 20 7M16.8 4.8 19 7" />
            </svg>
          </button>

          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-lg font-black tracking-tight text-slate-950 sm:text-2xl dark:text-white">
                幻梦
              </h1>
              <span className="hidden shrink-0 rounded-full border border-teal-200/80 bg-teal-50 px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] text-teal-700 sm:inline-flex dark:border-teal-300/20 dark:bg-teal-300/10 dark:text-teal-100">
                所想即所得
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
