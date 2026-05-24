'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { verifySession } from '@/lib/dal'

const MIN_PAYOUT_MYR = Number(process.env.MIN_PAYOUT_MYR ?? '20')

export async function requestPayout(
  _prev: unknown,
  _formData: FormData,
): Promise<{ error?: string } | undefined> {
  const { userId, role } = await verifySession()
  if (role !== 'reviewer' && role !== 'admin') return { error: 'Not a reviewer.' }

  const profile = await db.profile.findUnique({
    where: { userId },
    select: { alipayAccountId: true },
  })

  if (!profile?.alipayAccountId) {
    return {
      error: 'Add your Alipay account ID in your profile before requesting a payout.',
    }
  }

  // Block if there is already a pending or approved request
  const existing = await db.payoutRequest.findFirst({
    where: { reviewerId: userId, status: { in: ['pending', 'approved'] } },
  })
  if (existing) {
    return { error: 'You already have an active payout request. Wait for it to be processed.' }
  }

  const unpaidEarnings = await db.reviewerEarning.findMany({
    where: { reviewerId: userId, isPaid: false, payoutRequestId: null },
    select: { id: true, amount: true },
  })

  if (unpaidEarnings.length === 0) return { error: 'No unpaid earnings available.' }

  const totalAmount = unpaidEarnings.reduce((sum, e) => sum + Number(e.amount), 0)

  if (totalAmount < MIN_PAYOUT_MYR) {
    return {
      error: `Minimum payout is RM ${MIN_PAYOUT_MYR.toFixed(2)}. Current balance: RM ${totalAmount.toFixed(2)}.`,
    }
  }

  const payout = await db.payoutRequest.create({
    data: {
      reviewerId: userId,
      amount: totalAmount,
      alipayAccountId: profile.alipayAccountId,
      status: 'pending',
    },
  })

  await db.reviewerEarning.updateMany({
    where: { id: { in: unpaidEarnings.map((e) => e.id) } },
    data: { payoutRequestId: payout.id },
  })

  revalidatePath('/reviewer/earnings')
  return {}
}
