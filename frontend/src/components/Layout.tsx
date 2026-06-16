import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import AppHeader from './AppHeader'
import Breadcrumbs from './Breadcrumbs'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed on desktop, overlay on mobile */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed z-30`}>
        <Sidebar />
      </div>

      {/* Main area */}
      <div className="lg:ml-60 flex flex-col min-h-screen">
        <AppHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="px-6 py-2.5 bg-white/70 backdrop-blur-sm border-b border-[#e8eaf6]">
          <Breadcrumbs />
        </div>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
