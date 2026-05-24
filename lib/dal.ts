import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export const verifySession = cache(async () => {
  const session = await getSession()
  if (!session?.userId) redirect('/login')
  return { userId: session.userId, role: session.role }
})

export const verifyReviewer = cache(async () => {
  const session = await getSession()
  if (!session?.userId) redirect('/login')
  if (session.role !== 'reviewer' && session.role !== 'admin') redirect('/dashboard')
  return { userId: session.userId, role: session.role }
})

export const getUser = cache(async () => {
  const session = await getSession()
  if (!session?.userId) return null
  return db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, role: true, isActive: true, profile: { select: { username: true, fullName: true, profilePhotoUrl: true } } },
  })
})
