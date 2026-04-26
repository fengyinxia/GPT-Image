import { useEffect } from 'react'
import { initStore } from './store'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import TaskGrid from './components/TaskGrid'
import InputBar from './components/InputBar'
import DetailModal from './components/DetailModal'
import Lightbox from './components/Lightbox'
import SettingsModal from './components/SettingsModal'
import ConfirmDialog from './components/ConfirmDialog'
import Toast from './components/Toast'
import ImageContextMenu from './components/ImageContextMenu'

export default function App() {
  useEffect(() => {
    initStore()
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,250,252,0.2),rgba(248,250,252,0)),radial-gradient(circle_at_10%_12%,rgba(20,184,166,0.14),transparent_26%),radial-gradient(circle_at_84%_14%,rgba(245,158,11,0.12),transparent_24%),radial-gradient(circle_at_50%_78%,rgba(14,165,233,0.08),transparent_30%)] dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.2),rgba(2,6,23,0)),radial-gradient(circle_at_10%_12%,rgba(45,212,191,0.14),transparent_26%),radial-gradient(circle_at_84%_14%,rgba(251,191,36,0.10),transparent_24%),radial-gradient(circle_at_50%_78%,rgba(56,189,248,0.06),transparent_30%)]" />
        <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(90deg,currentColor_1px,transparent_1px),linear-gradient(0deg,currentColor_1px,transparent_1px)] [background-size:28px_28px] text-slate-950 dark:text-white" />
        <div className="absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(255,255,255,0.65),transparent)] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.45),transparent)]" />
      </div>

      <Header />
      <main className="relative mx-auto max-w-7xl px-4 pb-48 pt-2 sm:pt-3">
        <SearchBar />
        <TaskGrid />
      </main>
      <InputBar />
      <DetailModal />
      <Lightbox />
      <SettingsModal />
      <ConfirmDialog />
      <Toast />
      <ImageContextMenu />
    </div>
  )
}
