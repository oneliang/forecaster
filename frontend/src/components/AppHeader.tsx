interface Props {
  onToggleSidebar?: () => void
}

export default function AppHeader({ onToggleSidebar }: Props) {
  return (
    <header className="h-14 bg-white border-b border-[#e8eaf6] flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded-lg text-[#666] hover:bg-[#f5f7fa] hover:text-[#333]"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>
      <div className="flex items-center gap-2">
        {/* Reserved area for future notifications/settings */}
      </div>
    </header>
  )
}
