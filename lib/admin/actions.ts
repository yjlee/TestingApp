'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { verifySession } from '@/lib/dal'

async function requireAdmin() {
  const { userId, role } = await verifySession()
  if (role !== 'admin') redirect('/')
  return userId
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function toggleUserActive(formData: FormData) {
  await requireAdmin()
  const userId = formData.get('userId') as string
  const isActive = formData.get('isActive') === 'true'
  await db.user.update({ where: { id: userId }, data: { isActive: !isActive } })
  revalidatePath('/admin/users')
}

// ── Reviewers ──────────────────────────────────────────────────────────────

export async function revokeReviewer(formData: FormData) {
  await requireAdmin()
  const userId = formData.get('userId') as string

  const activeAssignments = await db.reviewerAssignment.findMany({
    where: { reviewerId: userId, status: 'in_progress' },
    select: { id: true, thesisId: true, reviewRound: true },
  })

  await db.$transaction(async (tx) => {
    for (const a of activeAssignments) {
      // Round 1 in progress (stage 4) → back to awaiting reviewer (stage 3)
      // Round 2 in progress (stage 7) → back to awaiting reviewer (stage 6)
      const resetStage = a.reviewRound === 1 ? 3 : 6
      await tx.thesisReviewSubmission.update({
        where: { thesisId: a.thesisId },
        data: { currentStage: resetStage, stageUpdatedAt: new Date() },
      })
    }

    if (activeAssignments.length > 0) {
      await tx.reviewerAssignment.deleteMany({
        where: { id: { in: activeAssignments.map((a) => a.id) } },
      })
    }

    await tx.user.update({
      where: { id: userId, role: 'reviewer' },
      data: { role: 'regular' },
    })
  })

  revalidatePath('/admin/reviewers')
  revalidatePath('/admin/pipeline')
}

// ── Fields of Study ────────────────────────────────────────────────────────

export async function addField(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string } | undefined> {
  await requireAdmin()
  const name = (formData.get('name') as string ?? '').trim()
  if (!name) return { error: 'Name is required.' }
  const existing = await db.fieldOfStudy.findUnique({ where: { name } })
  if (existing) return { error: 'A field with this name already exists.' }
  await db.fieldOfStudy.create({ data: { name } })
  revalidatePath('/admin/fields')
}

export async function toggleFieldOpen(formData: FormData) {
  await requireAdmin()
  const id = formData.get('id') as string
  const current = formData.get('isOpenForReview') === 'true'
  await db.fieldOfStudy.update({ where: { id }, data: { isOpenForReview: !current } })
  revalidatePath('/admin/fields')
}

export async function toggleFieldActive(formData: FormData) {
  await requireAdmin()
  const id = formData.get('id') as string
  const current = formData.get('isActive') === 'true'
  await db.fieldOfStudy.update({ where: { id }, data: { isActive: !current } })
  revalidatePath('/admin/fields')
}

// ── Pipeline ───────────────────────────────────────────────────────────────

export async function approveCompletion(formData: FormData) {
  await requireAdmin()
  const submissionId = formData.get('submissionId') as string
  await db.thesisReviewSubmission.update({
    where: { id: submissionId, currentStage: 8 },
    data: { currentStage: 9, stageUpdatedAt: new Date() },
  })
  revalidatePath('/admin/pipeline')
}

// ── Payouts ────────────────────────────────────────────────────────────────

export async function approvePayout(formData: FormData) {
  await requireAdmin()
  const id = formData.get('id') as string
  await db.payoutRequest.update({
    where: { id, status: 'pending' },
    data: { status: 'approved', processedAt: new Date() },
  })
  revalidatePath('/admin/payouts')
}

export async function rejectPayout(formData: FormData) {
  await requireAdmin()
  const id = formData.get('id') as string
  const adminNote = (formData.get('adminNote') as string ?? '').trim()
  await db.payoutRequest.update({
    where: { id, status: 'pending' },
    data: { status: 'rejected', adminNote: adminNote || null, processedAt: new Date() },
  })
  revalidatePath('/admin/payouts')
}

export async function markPayoutPaid(formData: FormData) {
  await requireAdmin()
  const id = formData.get('id') as string
  await db.$transaction([
    db.payoutRequest.update({
      where: { id, status: 'approved' },
      data: { status: 'paid', processedAt: new Date() },
    }),
    db.reviewerEarning.updateMany({
      where: { payoutRequestId: id },
      data: { isPaid: true },
    }),
  ])
  revalidatePath('/admin/payouts')
}

// ── Invite ─────────────────────────────────────────────────────────────────

export async function generateInvite(
  _prev: { url?: string; error?: string } | undefined,
  _formData: FormData,
): Promise<{ url?: string; error?: string }> {
  const adminId = await requireAdmin()
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await db.invitationLink.create({ data: { token, createdBy: adminId, expiresAt } })
  revalidatePath('/admin/invite')
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return { url: `${baseUrl}/invite/${token}` }
}
