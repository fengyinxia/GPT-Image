import { useEffect, useState } from 'react'
import type { TaskRecord } from '../types'
import { useStore, getCachedImage, ensureImageCached } from '../store'
import { formatImageRatio } from '../lib/size'

interface Props {
  task: TaskRecord
  onReuse: () => void
  onEditOutputs: () => void
  onDelete: () => void
  onClick: () => void
}

export default function TaskCard({
  task,
  onReuse,
  onEditOutputs,
  onDelete,
  onClick,
}: Props) {
  const [thumbSrc, setThumbSrc] = useState<string>('')
  const [coverRatio, setCoverRatio] = useState<string>('')
  const [coverSize, setCoverSize] = useState<string>('')
  const [now, setNow] = useState(Date.now())

  // 定时更新运行中任务的计时
  useEffect(() => {
    if (task.status !== 'running') return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [task.status])

  // 加载缩略图
  useEffect(() => {
    setCoverRatio('')
    setCoverSize('')

    if (task.outputImages?.[0]) {
      const cached = getCachedImage(task.outputImages[0])
      if (cached) {
        setThumbSrc(cached)
      } else {
        ensureImageCached(task.outputImages[0]).then((url) => {
          if (url) setThumbSrc(url)
        })
      }
    }
  }, [task.outputImages])

  useEffect(() => {
    if (!thumbSrc) return

    let cancelled = false
    const image = new Image()
    image.onload = () => {
      if (!cancelled && image.naturalWidth > 0 && image.naturalHeight > 0) {
        setCoverRatio(formatImageRatio(image.naturalWidth, image.naturalHeight))
        setCoverSize(`${image.naturalWidth}×${image.naturalHeight}`)
      }
    }
    image.src = thumbSrc
    if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
      setCoverRatio(formatImageRatio(image.naturalWidth, image.naturalHeight))
      setCoverSize(`${image.naturalWidth}×${image.naturalHeight}`)
    }

    return () => {
      cancelled = true
    }
  }, [thumbSrc])

  const duration = (() => {
    let seconds: number
    if (task.status === 'running') {
      seconds = Math.floor((now - task.createdAt) / 1000)
    } else if (task.elapsed != null) {
      seconds = Math.floor(task.elapsed / 1000)
    } else {
      return '00:00'
    }
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
    const ss = String(seconds % 60).padStart(2, '0')
    return `${mm}:${ss}`
  })()

  return (
    <div
      className={`group relative z-0 overflow-hidden rounded-[22px] border bg-stone-50/80 shadow-[0_12px_32px_rgb(15,23,42,0.05)] ring-1 ring-black/5 transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_rgb(15,23,42,0.1)] dark:bg-slate-900/80 dark:ring-white/10 dark:shadow-[0_14px_36px_rgb(0,0,0,0.28)] ${
        task.status === 'running'
          ? 'border-teal-300/90 generating dark:border-teal-400/40'
          : 'border-white/60 dark:border-white/[0.08]'
      }`}
      onClick={onClick}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.08),transparent_34%),radial-gradient(circle_at_86%_14%,rgba(245,158,11,0.07),transparent_26%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="flex h-40">
        {/* 左侧图片区域 */}
        <div className="relative flex h-full w-40 min-w-[10rem] flex-shrink-0 items-center justify-center overflow-hidden bg-slate-100/90 dark:bg-black/20">
          {task.status === 'running' && (
            <div className="flex flex-col items-center gap-2">
              <svg
                className="w-8 h-8 text-teal-400 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="text-xs text-slate-400 dark:text-slate-500">生成中...</span>
            </div>
          )}
          {task.status === 'error' && (
            <div className="flex flex-col items-center gap-1 px-2">
              <svg
                className="w-7 h-7 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-xs text-red-400 text-center leading-tight">
                失败
              </span>
            </div>
          )}
          {task.status === 'done' && thumbSrc && (
            <>
              <img
                src={thumbSrc}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                loading="lazy"
                alt=""
              />
              {task.outputImages.length > 1 && (
                <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                  {task.outputImages.length}
                </span>
              )}
            </>
          )}
          {task.status === 'done' && !thumbSrc && (
            <svg
              className="w-8 h-8 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
          {/* 运行中显示耗时，完成后显示封面图比例与分辨率标签 */}
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
            {task.status !== 'done' || !coverRatio || !coverSize ? (
              <span className="flex items-center gap-1 rounded-full border border-white/10 bg-black/55 px-2 py-1 text-[10px] text-white backdrop-blur-sm sm:text-xs font-mono">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {duration}
              </span>
            ) : (
              <>
                <span className="rounded-full border border-white/10 bg-black/55 px-2 py-1 text-[10px] text-white backdrop-blur-sm sm:text-xs font-mono">
                  {coverRatio}
                </span>
                <span className="rounded-full border border-white/10 bg-black/55 px-2 py-1 text-[10px] font-medium text-white/90 backdrop-blur-sm sm:text-xs">
                  {coverSize}
                </span>
              </>
            )}
          </div>
        </div>

        {/* 右侧信息区域 */}
        <div className="relative flex min-w-0 flex-1 flex-col p-3.5">
          <div className="mb-2 flex min-h-0 flex-1 flex-col">
            <div className="mb-2 flex items-center gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                task.status === 'done'
                  ? 'bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-200'
                  : task.status === 'running'
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200'
                    : 'bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-200'
              }`}>
                {task.status === 'done' ? 'Done' : task.status === 'running' ? 'Running' : 'Failed'}
              </span>
            </div>
            <p className="line-clamp-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {task.prompt || '(无提示词)'}
            </p>
          </div>
          <div className="mt-auto flex flex-col gap-2">
            {/* 参数：横向滚动 */}
            <div className="mask-edge-r flex min-w-0 gap-1.5 overflow-x-auto whitespace-nowrap pr-2 hide-scrollbar">
              <span className="flex-shrink-0 rounded-full border border-slate-200/70 bg-white/70 px-2 py-1 text-xs text-slate-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300">
                {task.params.quality}
              </span>
              <span className="flex-shrink-0 rounded-full border border-amber-200/80 bg-amber-50/70 px-2 py-1 text-xs text-amber-700 dark:border-amber-300/15 dark:bg-amber-300/10 dark:text-amber-100">
                {(task.params as any).base_resolution ?? ((task.params as any).model === 'gpt-image-2-4k' ? '4K' : (task.params as any).model === 'gpt-image-2-2k' ? '2K' : '1K')}
              </span>
              <span className="flex-shrink-0 rounded-full border border-teal-200/80 bg-teal-50/70 px-2 py-1 text-xs font-mono text-teal-700 dark:border-teal-300/15 dark:bg-teal-300/10 dark:text-teal-100">
                {task.params.size}
              </span>
              <span className="flex-shrink-0 rounded-full border border-slate-200/70 bg-white/70 px-2 py-1 text-xs text-slate-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300">
                {task.params.output_format}
              </span>
            </div>
            {/* 操作按钮 */}
            <div
              className="flex shrink-0 justify-end gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onReuse}
                className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200/70 bg-white/60 text-slate-400 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-400 dark:hover:border-teal-300/15 dark:hover:bg-teal-400/10"
                title="复用配置"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
              </button>
              <button
                onClick={onEditOutputs}
                className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200/70 bg-white/60 text-slate-400 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-30 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-400 dark:hover:border-emerald-300/15 dark:hover:bg-emerald-400/10"
                title="编辑输出"
                disabled={!task.outputImages?.length}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={onDelete}
                className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200/70 bg-white/60 text-slate-400 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-400 dark:hover:border-rose-300/15 dark:hover:bg-rose-400/10"
                title="删除记录"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
