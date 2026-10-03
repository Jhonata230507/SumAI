import { Sidebar } from '@/components/layout/Sidebar'

/**
 * Shell for the signed-in area. The middleware has already redirected anyone
 * without a session, so pages here can assume a user.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-7xl">
      <Sidebar />
      <div className="min-w-0 flex-1 px-4 py-8 lg:px-8">{children}</div>
    </div>
  )
}
