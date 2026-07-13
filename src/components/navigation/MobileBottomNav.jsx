import { useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileText, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const ROLE_TABS = {
  client: [
    { href: '/cdashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/tender', label: 'Tenders', icon: FileText },
    { href: '/profile', label: 'Profile', icon: User },
  ],
  pro: [
    { href: '/bdashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/tenders', label: 'Tenders', icon: FileText },
    { href: '/profile', label: 'Profile', icon: User },
  ],
  supplier: [
    { href: '/sdashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/stenders', label: 'Tenders', icon: FileText },
    { href: '/profile', label: 'Profile', icon: User },
  ],
}

export default function MobileBottomNav() {
  const { role } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const tabs = ROLE_TABS[role] || ROLE_TABS.client

  function isActive(href) {
    if (href === '/tender') return location.pathname === '/tender' || location.pathname.startsWith('/tender/')
    if (href === '/tenders') return location.pathname === '/tenders' || location.pathname.startsWith('/tenders/')
    if (href === '/stenders') return location.pathname === '/stenders' || location.pathname.startsWith('/stenders/')
    if (href === '/profile') return location.pathname === '/profile'
    return location.pathname === href
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = isActive(tab.href)
          const Icon = tab.icon
          return (
            <button
              key={tab.href}
              onClick={() => navigate(tab.href)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full ${
                active ? 'text-orange-600' : 'text-gray-500'
              }`}
            >
              <Icon className="size-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
