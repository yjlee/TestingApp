'use server'

import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { createSession, deleteSession } from '@/lib/session'

export async function signUp(formData: FormData) {
  const email = (formData.get('email') as string).trim().toLowerCase()
  const password = formData.get('password') as string

  if (!email || !password) return { error: 'Email and password are required.' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) return { error: 'An account with this email already exists.' }

  const passwordHash = await bcrypt.hash(password, 12)
  await db.user.create({ data: { email, passwordHash } })

  return { success: 'Account created. You can now sign in.' }
}

export async function signIn(formData: FormData) {
  const email = (formData.get('email') as string).trim().toLowerCase()
  const password = formData.get('password') as string

  const user = await db.user.findUnique({ where: { email } })
  if (!user) return { error: 'Invalid email or password.' }
  if (!user.isActive) return { error: 'This account has been deactivated.' }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return { error: 'Invalid email or password.' }

  await createSession(user.id, user.role)
  const profile = await db.profile.findUnique({ where: { userId: user.id }, select: { id: true } })
  redirect(profile ? '/dashboard' : '/profile/setup')
}

export async function signOut() {
  await deleteSession()
  redirect('/')
}

export async function forgotPassword(_formData: FormData) {
  // Email sending will be wired up when an email provider is configured.
  // For now, always return success to avoid leaking whether an email exists.
  return { success: 'If that email is registered, a reset link has been sent.' }
}

export async function resetPassword(formData: FormData) {
  const password = formData.get('password') as string
  if (!password || password.length < 8)
    return { error: 'Password must be at least 8 characters.' }

  // Token-based reset will be implemented in Phase 2 with email provider integration.
  return { error: 'Password reset is not yet available.' }
}
