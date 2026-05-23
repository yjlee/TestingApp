'use server'

import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { db } from '@/lib/db'

export async function saveProfile(formData: FormData) {
  const { userId } = await verifySession()

  const username = (formData.get('username') as string).trim().toLowerCase()
  const fullName = (formData.get('fullName') as string).trim()
  const institution = (formData.get('institution') as string).trim()
  const fieldOfStudyId = (formData.get('fieldOfStudyId') as string) || null
  const academicLevel = formData.get('academicLevel') as string
  const graduationYear = formData.get('graduationYear') ? Number(formData.get('graduationYear')) : null
  const bio = (formData.get('bio') as string)?.trim() || null
  const emailPublic = formData.get('emailPublic') === 'on'
  const linkedinUrl = (formData.get('linkedinUrl') as string)?.trim() || null
  const researchgateUrl = (formData.get('researchgateUrl') as string)?.trim() || null
  const alipayAccountId = (formData.get('alipayAccountId') as string)?.trim() || null

  if (!username || !fullName || !institution || !academicLevel) {
    return { error: 'Full name, username, institution, and academic level are required.' }
  }
  if (!/^[a-z0-9_-]{3,50}$/.test(username)) {
    return { error: 'Username must be 3–50 characters and contain only letters, numbers, hyphens, or underscores.' }
  }

  // Check username uniqueness (exclude current user's own profile)
  const conflict = await db.profile.findFirst({
    where: { username, NOT: { userId } },
  })
  if (conflict) return { error: 'That username is already taken.' }

  const validLevels = ['undergraduate', 'postgraduate', 'phd', 'professional', 'other']
  if (!validLevels.includes(academicLevel)) return { error: 'Invalid academic level.' }

  await db.profile.upsert({
    where: { userId },
    update: { username, fullName, institution, fieldOfStudyId, academicLevel: academicLevel as never, graduationYear, bio, emailPublic, linkedinUrl, researchgateUrl, alipayAccountId },
    create: { userId, username, fullName, institution, fieldOfStudyId, academicLevel: academicLevel as never, graduationYear, bio, emailPublic, linkedinUrl, researchgateUrl, alipayAccountId },
  })

  redirect(`/user/${username}`)
}
