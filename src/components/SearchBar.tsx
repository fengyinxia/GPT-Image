import { useStore } from '../store'
import Select from './Select'

export default function SearchBar() {
  const searchQuery = useStore((s) => s.searchQuery)
  const setSearchQuery = useStore((s) => s.setSearchQuery)
  const filterStatus = useStore((s) => s.filterStatus)
  const setFilterStatus = useStore((s) => s.setFilterStatus)

  return (
    <div className="relative z-30 mt-6 mb-5 overflow-visible rounded-[26px] border border-white/60 bg-stone-50/80 p-3 shadow-[0_10px_30px_rgb(15,23,42,0.06)] ring-1 ring-black/5 backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/70 dark:ring-white/10 dark:shadow-[0_10px_30px_rgb(0,0,0,0.24)]">
      <div className="pointer-events-none absolute inset-0 rounded-[26px] bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.08),transparent_32%),radial-gradient(circle_at_85%_30%,rgba(245,158,11,0.08),transparent_28%)]" />
      <div className="relative flex flex-col gap-3 sm:flex-row">
        <div className="relative z-20 w-full shrink-0 sm:w-36">
          <Select
            value={filterStatus}
            onChange={(val) => setFilterStatus(val as any)}
            options={[
              { label: '全部状态', value: 'all' },
              { label: '已完成', value: 'done' },
              { label: '生成中', value: 'running' },
              { label: '失败', value: 'error' },
            ]}
            className="w-full rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3 text-sm text-slate-700 shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-slate-200 dark:hover:bg-white/[0.08]"
          />
        </div>
        <div className="relative z-10 flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-teal-200/70 dark:bg-teal-400/10 dark:text-teal-200 dark:ring-teal-300/15">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="text"
            placeholder="搜索提示词、比例、格式..."
            className="w-full rounded-2xl border border-slate-200/80 bg-white/75 py-3 pl-14 pr-4 text-sm text-slate-700 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
      </div>
    </div>
  )
}
