'use server'

import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { verifySession } from '@/lib/dal'

const REVIEWER_PAYOUT_MYR = Number(process.env.REVIEWER_PAYOUT_MYR ?? '20')

export async function acceptReview(formData: FormData) {
  const { userId, role } = await verifySession()
  if (role !== 'reviewer' && role !== 'admin') redirect('/dashboard')

  const submissionId = formData.get('submissionId') as string

  const submission = await db.thesisReviewSubmission.findUnique({
    where: { id: submissionId },
    select: { id: true, currentStage: true, thesisId: true },
  })
  if (!submission) return

  if (submission.currentStage !== 3 && submission.currentStage !== 6) return

  // Enforce unique (thesisId, reviewerId)
  const existing = await db.reviewerAssignment.findFirst({
    where: { thesisId: submission.thesisId, reviewerId: userId },
  })
  if (existing) return

  const reviewRound = submission.currentStage === 3 ? 1 : 2
  const nextStage = submission.currentStage === 3 ? 4 : 7

  await db.$transaction([
    db.reviewerAssignment.create({
      data: {
        thesisId: submission.thesisId,
        reviewerId: userId,
        reviewRound,
        status: 'in_progress',
      },
    }),
    db.thesisReviewSubmission.update({
      where: { id: submissionId },
      data: { currentStage: nextStage, stageUpdatedAt: new Date() },
    }),
  ])

  redirect('/reviewer/active')
}

export async function markReviewDone(formData: FormData) {
  const { userId } = await verifySession()
  const assignmentId = formData.get('assignmentId') as string

  const assignment = await db.reviewerAssignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      reviewerId: true,
      thesisId: true,
      status: true,
      thesis: {
        select: {
          reviewSubmission: { select: { id: true, currentStage: true } },
        },
      },
    },
  })

  if (!assignment || assignment.reviewerId !== userId) return
  if (assignment.status === 'done') return

  const submission = assignment.thesis.reviewSubmission
  if (!submission) return

  const { currentStage } = submission
  if (currentStage !== 4 && currentStage !== 7) return

  // Round 1 done (4 → 5): auto-advance to 6 for second reviewer queue
  // Round 2 done (7 → 8): awaiting admin approval
  const nextStage = currentStage === 4 ? 6 : 8

  await db.$transaction([
    db.reviewerAssignment.update({
      where: { id: assignmentId },
      data: { status: 'done', completedAt: new Date() },
    }),
    db.thesisReviewSubmission.update({
      where: { id: submission.id },
      data: { currentStage: nextStage, stageUpdatedAt: new Date() },
    }),
    db.reviewerEarning.create({
      data: {
        reviewerId: userId,
        assignmentId,
        thesisId: assignment.thesisId,
        amount: REVIEWER_PAYOUT_MYR,
        currency: 'MYR',
      },
    }),
  ])

  redirect('/reviewer/active')
}
