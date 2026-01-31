import { Menu, Bell, LogOut, Settings } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  const getUserInitials = () => {
    if (!user) return 'U'
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-primary-900 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-primary-800 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">School App</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-primary-800 rounded-md"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {/* Navigation items will go here based on role */}
          <div className="h-12 bg-primary-800 rounded-md animate-pulse"></div>
          <div className="h-12 bg-primary-800 rounded-md animate-pulse"></div>
          <div className="h-12 bg-primary-800 rounded-md animate-pulse"></div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-primary-800 space-y-2">
          <button className="w-full p-2 hover:bg-primary-800 rounded-md flex items-center gap-2 text-sm">
            <Settings className="w-4 h-4" />
            {sidebarOpen && <span>Settings</span>}
          </button>
          <button 
            onClick={handleLogout}
            className="w-full p-2 hover:bg-primary-800 rounded-md flex items-center gap-2 text-sm"
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            {user && (
              <p className="text-sm text-gray-600">
                Welcome back, {user.firstName}! ({user.role})
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-md">
              <Bell className="w-6 h-6 text-gray-600" />
            </button>
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
              {getUserInitials()}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Welcome! Dashboard content will be rendered here based on your role.
            </h3>

            {/* Placeholder Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card p-6">
                  <div className="h-12 bg-gray-200 rounded-md animate-pulse mb-3"></div>
                  <div className="h-6 bg-gray-200 rounded-md animate-pulse w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
