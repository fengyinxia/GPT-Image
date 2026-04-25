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
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 pb-48">
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
    </>
  )
}
