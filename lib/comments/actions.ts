'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { verifySession } from '@/lib/dal'

export async function postComment(
  formData: FormData,
): Promise<{ error?: string }> {
  const { userId } = await verifySession()
  const thesisId = formData.get('thesisId') as string
  const assignmentId = formData.get('assignmentId') as string
  const content = ((formData.get('content') as string) ?? '').trim()
  const parentCommentId = (formData.get('parentCommentId') as string) || null

  if (!content) return { error: 'Comment cannot be empty.' }

  const assignment = await db.reviewerAssignment.findUnique({
    where: { id: assignmentId },
    select: {
      status: true,
      reviewerId: true,
      thesisId: true,
      thesis: { select: { userId: true } },
    },
  })

  if (!assignment || assignment.thesisId !== thesisId) return { error: 'Invalid assignment.' }
  if (assignment.status !== 'in_progress') return { error: 'Review is no longer active.' }

  const isReviewer = assignment.reviewerId === userId
  const isOwner = assignment.thesis.userId === userId
  if (!isReviewer && !isOwner) return { error: 'Access denied.' }

  // Only reviewer can open a new thread; both can reply
  if (!parentCommentId && !isReviewer) {
    return { error: 'Only the reviewer can start a new comment thread.' }
  }

  await db.reviewComment.create({
    data: { thesisId, assignmentId, authorId: userId, parentCommentId, content },
  })

  revalidatePath(`/thesis/${thesisId}`)
  return {}
}

export async function editComment(
  formData: FormData,
): Promise<{ error?: string }> {
  const { userId } = await verifySession()
  const commentId = formData.get('commentId') as string
  const content = ((formData.get('content') as string) ?? '').trim()

  if (!content) return { error: 'Comment cannot be empty.' }

  const comment = await db.reviewComment.findUnique({
    where: { id: commentId },
    select: { authorId: true, thesisId: true, isDeleted: true },
  })

  if (!comment || comment.isDeleted || comment.authorId !== userId) {
    return { error: 'Not found.' }
  }

  await db.reviewComment.update({ where: { id: commentId }, data: { content } })
  revalidatePath(`/thesis/${comment.thesisId}`)
  return {}
}

export async function deleteComment(
  formData: FormData,
): Promise<{ error?: string }> {
  const { userId } = await verifySession()
  const commentId = formData.get('commentId') as string

  const comment = await db.reviewComment.findUnique({
    where: { id: commentId },
    select: { authorId: true, thesisId: true },
  })

  if (!comment || comment.authorId !== userId) return { error: 'Not found.' }

  await db.reviewComment.update({
    where: { id: commentId },
    data: { isDeleted: true },
  })

  revalidatePath(`/thesis/${comment.thesisId}`)
  return {}
}
