import React, { useEffect, useState, useRef } from 'react'
import { useStore } from '../store'

export default function ImageContextMenu() {
  const [menuInfo, setMenuInfo] = useState<{ src: string; x: number; y: number } | null>(null)
  const showToast = useStore((s) => s.showToast)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target && target.tagName === 'IMG') {
        const imgTarget = target as HTMLImageElement
        // 忽略没有 src 或空的 img
        if (!imgTarget.src) return

        e.preventDefault()
        setMenuInfo({
          src: imgTarget.src,
          x: e.clientX,
          y: e.clientY,
        })
      }
    }

    // 监听全局 contextmenu，兼容桌面端右键和大部分移动端长按
    window.addEventListener('contextmenu', onContextMenu)
    return () => {
      window.removeEventListener('contextmenu', onContextMenu)
    }
  }, [])

  // 点击其他地方、滚动或缩放时关闭菜单
  useEffect(() => {
    if (!menuInfo) return
    const close = (e: Event) => {
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) {
        return
      }
      setMenuInfo(null)
    }
    window.addEventListener('mousedown', close, { capture: true })
    window.addEventListener('touchstart', close, { capture: true })
    window.addEventListener('wheel', close, { capture: true })
    window.addEventListener('scroll', close, { capture: true })
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('mousedown', close, { capture: true })
      window.removeEventListener('touchstart', close, { capture: true })
      window.removeEventListener('wheel', close, { capture: true })
      window.removeEventListener('scroll', close, { capture: true })
      window.removeEventListener('resize', close)
    }
  }, [menuInfo])

  if (!menuInfo) return null

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuInfo(null)
    try {
      const res = await fetch(menuInfo.src)
      const blob = await res.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ])
      showToast('图片已复制', 'success')
    } catch (err) {
      console.error(err)
      showToast('复制失败', 'error')
    }
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuInfo(null)
    try {
      const res = await fetch(menuInfo.src)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const ext = blob.type.split('/')[1] || 'png'
      a.download = `image-${Date.now()}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('开始下载', 'success')
    } catch (err) {
      console.error(err)
      showToast('下载失败', 'error')
    }
  }

  // 保证菜单在视口内
  let left = menuInfo.x
  let top = menuInfo.y
  const MENU_WIDTH = 148
  const MENU_HEIGHT = 108

  if (left + MENU_WIDTH > window.innerWidth) {
    left -= MENU_WIDTH
  }
  if (top + MENU_HEIGHT > window.innerHeight) {
    top -= MENU_HEIGHT
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] w-[148px] overflow-hidden rounded-2xl border border-white/70 bg-stone-50/95 py-1.5 shadow-[0_14px_40px_rgb(15,23,42,0.16)] ring-1 ring-black/5 backdrop-blur-xl animate-fade-in dark:border-white/[0.08] dark:bg-slate-900/95 dark:ring-white/10 dark:shadow-[0_14px_40px_rgb(0,0,0,0.35)]"
      style={{ left, top }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.1),transparent_34%),radial-gradient(circle_at_92%_18%,rgba(245,158,11,0.08),transparent_26%)]" />
      <button
        onClick={handleCopy}
        className="relative mx-1 flex w-[calc(100%-0.5rem)] items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-white/70 dark:text-slate-200 dark:hover:bg-white/[0.06]"
      >
        <div className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-600 ring-1 ring-teal-200/70 dark:bg-teal-400/10 dark:text-teal-200 dark:ring-teal-300/15">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        </div>
        复制
      </button>
      <button
        onClick={handleDownload}
        className="relative mx-1 flex w-[calc(100%-0.5rem)] items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-white/70 dark:text-slate-200 dark:hover:bg-white/[0.06]"
      >
        <div className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600 ring-1 ring-amber-200/70 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-300/15">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        </div>
        下载
      </button>
    </div>
  )
}
