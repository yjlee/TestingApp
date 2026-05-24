'use server'

import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { db } from '@/lib/db'
import { stripe, REVIEW_FEE_CENTS } from '@/lib/stripe'

export async function startCheckout(formData: FormData) {
  const { userId } = await verifySession()
  const thesisId = formData.get('thesisId') as string

  const thesis = await db.thesis.findUnique({
    where: { id: thesisId, isDeleted: false },
    select: {
      id: true,
      title: true,
      userId: true,
      fieldOfStudy: { select: { isOpenForReview: true } },
      reviewSubmission: { select: { id: true } },
    },
  })

  if (!thesis || thesis.userId !== userId) return
  if (thesis.reviewSubmission) return
  if (!thesis.fieldOfStudy?.isOpenForReview) return

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['alipay'],
    line_items: [
      {
        price_data: {
          currency: 'myr',
          product_data: {
            name: 'Thesis Expert Review',
            description: thesis.title,
          },
          unit_amount: REVIEW_FEE_CENTS,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/thesis/${thesisId}?cancelled=1`,
    metadata: { thesisId, userId },
  })

  await db.payment.create({
    data: {
      thesisId,
      userId,
      stripeSessionId: session.id,
      amount: REVIEW_FEE_CENTS / 100,
      currency: 'MYR',
      status: 'pending',
    },
  })

  redirect(session.url!)
}
