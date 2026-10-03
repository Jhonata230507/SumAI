'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Layers, Target, User } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useI18n } from '@/lib/i18n/client'

/** Navigation for the signed-in area. */
export function Sidebar() {
  const pathname = usePathname()
  const { t } = useI18n()

  const items = [
    { href: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/scenarios', label: t.nav.scenarios, icon: Layers },
    { href: '/goals', label: t.nav.goals, icon: Target },
    { href: '/profile', label: t.nav.profile, icon: User },
  ]

  return (
    <aside className="hidden w-56 shrink-0 border-r lg:block">
      <nav className="sticky top-16 space-y-1 p-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-accent font-medium text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
