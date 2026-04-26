import { useState } from 'react'
import { parseRatio } from '../lib/size'

const RATIO_OPTIONS = [
  { label: '1:1', value: '1:1', tone: 'bg-blue-500' },
  { label: '3:2', value: '3:2', tone: 'bg-emerald-500' },
  { label: '2:3', value: '2:3', tone: 'bg-emerald-500' },
  { label: '16:9', value: '16:9', tone: 'bg-amber-500' },
  { label: '9:16', value: '9:16', tone: 'bg-amber-500' },
  { label: '4:3', value: '4:3', tone: 'bg-rose-500' },
  { label: '3:4', value: '3:4', tone: 'bg-rose-500' },
  { label: '21:9', value: '21:9', tone: 'bg-cyan-500' },
]

interface Props {
  currentSize: string
  onSelect: (size: string) => void
  onClose: () => void
}

function findRatioForSize(size: string) {
  if (parseRatio(size)) {
    return RATIO_OPTIONS.find((ratio) => ratio.value === size)?.value ?? '1:1'
  }
  return '1:1'
}

function parseRatioValue(ratio: string) {
  const [width, height] = ratio.split(':').map(Number)
  return { width, height }
}

function PreviewBox({ ratio, tone }: { ratio: string; tone: string }) {
  const { width, height } = parseRatioValue(ratio)
  const landscape = width >= height
  const boxWidth = landscape ? 54 : Math.max(28, Math.round(54 * width / height))
  const boxHeight = landscape ? Math.max(28, Math.round(54 * height / width)) : 54

  return (
    <div className="flex h-16 items-center justify-center">
      <div
        className={`rounded-md ${tone} shadow-sm ring-1 ring-black/10 dark:ring-white/10`}
        style={{ width: boxWidth, height: boxHeight }}
      />
    </div>
  )
}

export default function SizePickerModal({ currentSize, onSelect, onClose }: Props) {
  const [ratio, setRatio] = useState(() => findRatioForSize(currentSize))

  const selected = RATIO_OPTIONS.find((item) => item.value === ratio) ?? RATIO_OPTIONS[0]

  const applySize = () => {
    onSelect(ratio)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-overlay-in" />
      <div
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/50 bg-white/95 p-5 shadow-2xl ring-1 ring-black/5 animate-modal-in dark:border-white/[0.08] dark:bg-gray-900/95 dark:ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">选择图像比例</h3>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">当前：{parseRatio(currentSize) ? currentSize : '1:1'}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
            aria-label="关闭"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RATIO_OPTIONS.map((item) => {
            const active = ratio === item.value
            return (
              <button
                key={item.value}
                onClick={() => setRatio(item.value)}
                className={`rounded-2xl border p-2 text-center transition ${
                  active
                    ? 'border-blue-400 bg-blue-50 text-blue-600 shadow-sm dark:border-blue-500/50 dark:bg-blue-500/10 dark:text-blue-300'
                    : 'border-gray-200/70 bg-white/60 text-gray-600 hover:bg-gray-50 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.06]'
                }`}
              >
                <PreviewBox ratio={item.value} tone={item.tone} />
                <div className="font-mono text-sm font-semibold">{item.label}</div>
              </button>
            )
          })}
        </div>

        <div className="mt-5 rounded-2xl bg-gray-50 px-4 py-3 dark:bg-white/[0.03]">
          <div className="text-xs text-gray-400 dark:text-gray-500">将使用</div>
          <div className="mt-1 font-mono text-lg font-semibold text-gray-800 dark:text-gray-100">
            {selected.label}
          </div>
          <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            图像比例
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm text-gray-600 transition hover:bg-gray-200 dark:bg-white/[0.06] dark:text-gray-300 dark:hover:bg-white/[0.1]"
          >
            取消
          </button>
          <button
            onClick={applySize}
            className="flex-1 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  )
}
