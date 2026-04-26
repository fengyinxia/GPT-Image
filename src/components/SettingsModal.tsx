import { useEffect, useRef, useState, useCallback } from 'react'
import { useStore, exportData, importData, clearAllData } from '../store'
import { DEFAULT_SETTINGS, type AppSettings } from '../types'
import { useCloseOnEscape } from '../hooks/useCloseOnEscape'

export default function SettingsModal() {
  const showSettings = useStore((s) => s.showSettings)
  const setShowSettings = useStore((s) => s.setShowSettings)
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const setConfirmDialog = useStore((s) => s.setConfirmDialog)
  const importInputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState<AppSettings>(settings)
  const [timeoutInput, setTimeoutInput] = useState(String(settings.timeout))

  useEffect(() => {
    if (showSettings) {
      setDraft(settings)
      setTimeoutInput(String(settings.timeout))
    }
  }, [showSettings, settings])

  const commitSettings = (nextDraft: AppSettings) => {
    const normalizedDraft = {
      ...nextDraft,
      timeout: Number(nextDraft.timeout) || DEFAULT_SETTINGS.timeout,
    }
    setDraft(normalizedDraft)
    setSettings(normalizedDraft)
  }

  const handleClose = () => {
    const nextTimeout = Number(timeoutInput)
    commitSettings({
      ...draft,
      timeout:
        timeoutInput.trim() === '' || Number.isNaN(nextTimeout)
          ? DEFAULT_SETTINGS.timeout
          : nextTimeout,
    })
    setShowSettings(false)
  }

  const commitTimeout = useCallback(() => {
    const nextTimeout = Number(timeoutInput)
    const normalizedTimeout =
      timeoutInput.trim() === '' ? DEFAULT_SETTINGS.timeout : Number.isNaN(nextTimeout) ? draft.timeout : nextTimeout
    setTimeoutInput(String(normalizedTimeout))
    commitSettings({ ...draft, timeout: normalizedTimeout })
  }, [draft, timeoutInput])

  useCloseOnEscape(showSettings, handleClose)

  if (!showSettings) return null

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) importData(file)
    e.target.value = ''
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-overlay-in" />
      <div
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/50 bg-stone-50/95 p-5 shadow-2xl ring-1 ring-black/5 animate-modal-in dark:border-white/[0.08] dark:bg-slate-900/95 dark:ring-white/10 overflow-y-auto max-h-[85vh] custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            设置
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono select-none">v{__APP_VERSION__}</span>
            <button
              onClick={handleClose}
              className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/[0.06] dark:hover:text-slate-200"
              aria-label="关闭"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <section>
            <h4 className="mb-4 text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              生成配置
            </h4>
            <div className="space-y-4">
              <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3 text-xs text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-400">
                API URL 和 API Key 已移到 Python 后端，通过后端环境变量配置。
              </div>

              <label className="block">
                <span className="block text-xs text-slate-500 dark:text-slate-400 mb-1">请求超时 (秒)</span>
                <input
                  value={timeoutInput}
                  onChange={(e) => setTimeoutInput(e.target.value)}
                  onBlur={commitTimeout}
                  type="number"
                  min={10}
                  max={600}
                  className="w-full rounded-xl border border-slate-200/70 bg-white/60 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-teal-300 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-200 dark:focus:border-teal-500/50"
                />
              </label>
            </div>
          </section>

          <section className="pt-6 border-t border-slate-200 dark:border-white/[0.08]">
            <h4 className="mb-4 text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              数据管理
            </h4>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => exportData()}
                  className="flex-1 rounded-xl bg-slate-100/80 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/[0.1] flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  导出
                </button>
                <button
                  onClick={() => importInputRef.current?.click()}
                  className="flex-1 rounded-xl bg-slate-100/80 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/[0.1] flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  导入
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={handleImport}
                />
              </div>
              <button
                onClick={() =>
                  setConfirmDialog({
                    title: '清空所有数据',
                    message: '确定要清空所有任务记录和图片数据吗？此操作不可恢复。',
                    action: () => clearAllData(),
                  })
                }
                className="w-full rounded-xl border border-red-200/80 bg-red-50/50 px-4 py-2.5 text-sm text-red-500 transition hover:bg-red-100/80 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
              >
                清空所有数据
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
