'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { signOut } from '@/lib/auth/actions'

export default function NavbarMobile({ isAuthed, isAdmin }: { isAuthed: boolean; isAdmin: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="md:hidden p-2 rounded-md text-gray-600 hover:text-blue-700"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <div className="absolute top-16 left-0 right-0 md:hidden border-t border-gray-200 bg-white px-4 py-4 flex flex-col gap-4 text-sm shadow-sm">
          <Link href="/search" className="text-gray-600 hover:text-blue-700" onClick={() => setOpen(false)}>Browse</Link>
          {isAuthed ? (
            <>
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-700" onClick={() => setOpen(false)}>Dashboard</Link>
              <Link href="/upload" className="text-gray-600 hover:text-blue-700" onClick={() => setOpen(false)}>Upload</Link>
              {isAdmin && (
                <Link href="/admin" className="font-medium text-purple-700 hover:text-purple-900" onClick={() => setOpen(false)}>Admin</Link>
              )}
              <form action={signOut}>
                <button type="submit" className="text-gray-600 hover:text-blue-700 text-left w-full">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-blue-700" onClick={() => setOpen(false)}>Log in</Link>
              <Link href="/register" className="bg-blue-700 text-white px-4 py-2 rounded-lg text-center hover:bg-blue-800" onClick={() => setOpen(false)}>Register</Link>
            </>
          )}
        </div>
      )}
    </>
  )
}
