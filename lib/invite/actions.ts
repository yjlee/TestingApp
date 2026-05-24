'use server'

import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { createSession } from '@/lib/session'
import type { AcademicLevel } from '@prisma/client'

export async function registerAsReviewer(
  _prev: unknown,
  formData: FormData,
): Promise<{ error: string } | undefined> {
  const token = formData.get('token') as string
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
  const password = formData.get('password') as string
  const fullName = ((formData.get('fullName') as string) ?? '').trim()
  const username = ((formData.get('username') as string) ?? '').trim().toLowerCase()
  const institution = ((formData.get('institution') as string) ?? '').trim()
  const fieldOfStudyId = (formData.get('fieldOfStudyId') as string) || null
  const alipayAccountId = ((formData.get('alipayAccountId') as string) ?? '').trim() || null
  const academicLevel = ((formData.get('academicLevel') as string) || 'professional') as AcademicLevel

  const invite = await db.invitationLink.findUnique({ where: { token } })
  if (!invite || invite.isUsed || invite.expiresAt < new Date()) {
    return { error: 'This invitation link is invalid or has expired.' }
  }

  if (!email) return { error: 'Email is required.' }
  if (!password || password.length < 8) return { error: 'Password must be at least 8 characters.' }
  if (!fullName) return { error: 'Full name is required.' }
  if (!username || !/^[a-z0-9_-]+$/.test(username)) return { error: 'Username may only contain letters, numbers, hyphens, and underscores.' }
  if (!institution) return { error: 'Institution is required.' }

  const [existingEmail, existingUsername] = await Promise.all([
    db.user.findUnique({ where: { email } }),
    db.profile.findUnique({ where: { username } }),
  ])
  if (existingEmail) return { error: 'An account with this email already exists.' }
  if (existingUsername) return { error: 'This username is already taken.' }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      role: 'reviewer',
      profile: {
        create: {
          username,
          fullName,
          institution,
          academicLevel,
          fieldOfStudyId,
          alipayAccountId,
        },
      },
    },
  })

  await db.invitationLink.update({
    where: { token },
    data: { isUsed: true, usedBy: user.id },
  })

  await createSession(user.id, 'reviewer')
  redirect('/reviewer/queue')
}
