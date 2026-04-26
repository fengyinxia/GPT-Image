import { useStore } from '../store'
import { useCloseOnEscape } from '../hooks/useCloseOnEscape'

export default function ConfirmDialog() {
  const confirmDialog = useStore((s) => s.confirmDialog)
  const setConfirmDialog = useStore((s) => s.setConfirmDialog)

  useCloseOnEscape(Boolean(confirmDialog), () => setConfirmDialog(null))

  if (!confirmDialog) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      onClick={() => setConfirmDialog(null)}
    >
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-md animate-overlay-in" />
      <div
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-[28px] border border-white/55 bg-stone-50/92 p-6 shadow-[0_18px_50px_rgb(15,23,42,0.14)] ring-1 ring-black/5 backdrop-blur-xl animate-confirm-in dark:border-white/[0.08] dark:bg-slate-900/92 dark:ring-white/10 dark:shadow-[0_18px_50px_rgb(0,0,0,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.09),transparent_34%),radial-gradient(circle_at_90%_18%,rgba(245,158,11,0.08),transparent_26%)]" />
        <div className="relative">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-200/80 bg-rose-50 text-rose-600 shadow-sm dark:border-rose-300/15 dark:bg-rose-400/10 dark:text-rose-200">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="mb-2 text-base font-bold text-slate-800 dark:text-slate-100">
          {confirmDialog.title}
        </h3>
        <p className="mb-5 text-sm leading-6 text-slate-500 dark:text-slate-400">{confirmDialog.message}</p>
        <div className="flex gap-2.5">
          <button
            onClick={() => setConfirmDialog(null)}
            className="flex-1 rounded-2xl border border-slate-200/80 bg-white/70 py-2.5 text-sm text-slate-600 shadow-sm transition hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08]"
          >
            取消
          </button>
          <button
            onClick={() => {
              confirmDialog.action()
              setConfirmDialog(null)
            }}
            className="flex-1 rounded-2xl bg-rose-500 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-rose-600"
          >
            确认删除
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}
