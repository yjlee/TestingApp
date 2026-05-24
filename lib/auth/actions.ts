'use server'

import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
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

export async function forgotPassword(
  formData: FormData,
): Promise<{ success?: string; devResetUrl?: string; error?: string }> {
  const email = (formData.get('email') as string ?? '').trim().toLowerCase()
  if (!email) return { error: 'Email is required.' }

  const user = await db.user.findUnique({ where: { email }, select: { id: true } })

  if (user) {
    // Invalidate any existing unused tokens
    await db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } })

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    await db.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    // When an email provider is configured, send resetUrl by email instead.
    return {
      success: 'If that email is registered, a reset link has been sent.',
      devResetUrl: resetUrl,
    }
  }

  // Always return success to avoid leaking whether the email exists
  return { success: 'If that email is registered, a reset link has been sent.' }
}

export async function resetPassword(
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  const token = (formData.get('token') as string ?? '').trim()
  const password = formData.get('password') as string

  if (!token) return { error: 'Missing reset token.' }
  if (!password || password.length < 8)
    return { error: 'Password must be at least 8 characters.' }

  const record = await db.passwordResetToken.findUnique({
    where: { token },
    select: { userId: true, expiresAt: true, usedAt: true },
  })

  if (!record || record.usedAt || record.expiresAt < new Date())
    return { error: 'This reset link is invalid or has expired.' }

  const passwordHash = await bcrypt.hash(password, 12)
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    db.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } }),
  ])

  return { success: true }
}
