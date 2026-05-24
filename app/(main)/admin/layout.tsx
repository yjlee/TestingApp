import { redirect } from 'next/navigation'
import Link from 'next/link'
import { verifySession } from '@/lib/dal'
import AdminNav from '@/components/admin-nav'
import { Shield } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role } = await verifySession()
  if (role !== 'admin') redirect('/')

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="w-52 border-r border-gray-200 bg-white flex-shrink-0 px-3 py-6">
        <div className="flex items-center gap-2 px-3 mb-5">
          <Shield size={14} className="text-gray-400" />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</p>
        </div>
        <AdminNav />
      </aside>

      <main className="flex-1 min-w-0 px-8 py-8 bg-gray-50">
        {children}
      </main>
    </div>
  )
}
