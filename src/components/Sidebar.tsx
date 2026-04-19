'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Megaphone,
  Users,
  BarChart3,
  RefreshCw,
  PhoneCall,
  Settings,
  Mic2,
  ChevronRight,
} from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/campaigns', label: 'Campagnes', icon: Megaphone },
  { href: '/contacts', label: 'Contacts / CRM', icon: Users },
  { href: '/calls', label: 'Appels', icon: PhoneCall },
  { href: '/retargeting', label: 'Retargeting', icon: RefreshCw },
  { href: '/reports', label: 'Rapports', icon: BarChart3 },
  { href: '/settings', label: 'Paramètres', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[260px] flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
          <Mic2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 leading-tight">CampagneIA</p>
          <p className="text-xs text-gray-400">Marketing Voix IA</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className={clsx('w-4.5 h-4.5 flex-shrink-0', active ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600')} size={18} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} className="text-brand-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">Admin</p>
            <p className="text-xs text-gray-400 truncate">admin@campagne-ia.fr</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
