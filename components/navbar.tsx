import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { getSession } from '@/lib/session'
import { signOut } from '@/lib/auth/actions'
import NavbarMobile from '@/components/navbar-mobile'

export default async function Navbar() {
  const session = await getSession()
  const isAuthed = !!session?.userId

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-700">
            <BookOpen size={24} />
            ThesisHub
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <Link href="/search" className="hover:text-blue-700 transition-colors">Browse</Link>
            {isAuthed && (
              <>
                <Link href="/dashboard" className="hover:text-blue-700 transition-colors">Dashboard</Link>
                <Link href="/upload" className="hover:text-blue-700 transition-colors">Upload</Link>
              </>
            )}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthed ? (
              <form action={signOut}>
                <button type="submit" className="text-sm text-gray-600 hover:text-blue-700 transition-colors">
                  Sign out
                </button>
              </form>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-600 hover:text-blue-700 transition-colors">
                  Log in
                </Link>
                <Link href="/register" className="text-sm bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger (client component) */}
          <NavbarMobile isAuthed={isAuthed} />
        </div>
      </div>
    </nav>
  )
}
