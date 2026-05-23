'use server'

import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { verifySession } from '@/lib/dal'

export async function updateThesis(
  _prev: unknown,
  formData: FormData,
): Promise<{ error: string } | undefined> {
  const { userId } = await verifySession()
  const thesisId = formData.get('thesisId') as string

  const thesis = await db.thesis.findUnique({ where: { id: thesisId } })
  if (!thesis || thesis.userId !== userId || thesis.isDeleted) return { error: 'Not found.' }

  const title = ((formData.get('title') as string) ?? '').trim()
  const abstract = ((formData.get('abstract') as string) ?? '').trim()
  const fieldOfStudyId = (formData.get('fieldOfStudyId') as string) || null
  const yearOfSubmission = parseInt(formData.get('yearOfSubmission') as string)
  const institution = ((formData.get('institution') as string) ?? '').trim()
  const keywordsRaw = ((formData.get('keywords') as string) ?? '').trim()
  const supervisorName = ((formData.get('supervisorName') as string) ?? '').trim() || null
  const language = ((formData.get('language') as string) ?? '').trim() || 'English'

  if (!title) return { error: 'Title is required.' }
  if (!abstract) return { error: 'Abstract is required.' }
  if (!institution) return { error: 'Institution is required.' }
  if (!yearOfSubmission || isNaN(yearOfSubmission)) return { error: 'Year of submission is required.' }

  const keywords = keywordsRaw
    ? keywordsRaw.split(',').map((k) => k.trim()).filter(Boolean)
    : []

  await db.thesis.update({
    where: { id: thesisId },
    data: { title, abstract, fieldOfStudyId, yearOfSubmission, institution, keywords, supervisorName, language },
  })

  redirect(`/thesis/${thesisId}`)
}

export async function deleteThesis(formData: FormData) {
  const { userId } = await verifySession()
  const thesisId = formData.get('thesisId') as string

  const thesis = await db.thesis.findUnique({ where: { id: thesisId } })
  if (!thesis || thesis.userId !== userId) return

  await db.thesis.update({ where: { id: thesisId }, data: { isDeleted: true } })
  redirect('/dashboard')
}
