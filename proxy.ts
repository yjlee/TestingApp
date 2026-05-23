import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/session'
import { cookies } from 'next/headers'

const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password']
const protectedPrefixes = ['/dashboard', '/profile', '/upload', '/reviewer', '/checkout']
const adminPrefix = '/admin'

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname

  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  const session = await decrypt(token)

  const isAuthed = !!session?.userId
  const isAuthRoute = authRoutes.includes(path)
  const isProtected = protectedPrefixes.some((p) => path.startsWith(p))
  const isAdmin = path.startsWith(adminPrefix)

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && isAuthed) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }

  // Redirect unauthenticated users away from protected pages
  if (isProtected && !isAuthed) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  // Redirect non-admins away from admin pages
  if (isAdmin && session?.role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
