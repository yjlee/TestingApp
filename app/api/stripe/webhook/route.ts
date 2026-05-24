import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return new NextResponse('Webhook signature verification failed', { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const thesisId = session.metadata?.thesisId
    const userId = session.metadata?.userId

    if (!thesisId || !userId) return NextResponse.json({ received: true })

    // Update payment to confirmed
    const payment = await db.payment.findFirst({
      where: { stripeSessionId: session.id },
      select: { id: true },
    })

    if (payment) {
      await db.payment.update({
        where: { id: payment.id },
        data: { status: 'confirmed', confirmedAt: new Date() },
      })
    }

    // Create review submission at stage 3 (idempotent)
    const existing = await db.thesisReviewSubmission.findUnique({
      where: { thesisId },
    })

    if (!existing) {
      await db.thesisReviewSubmission.create({
        data: {
          thesisId,
          userId,
          currentStage: 3,
          paymentId: payment?.id ?? null,
          stageUpdatedAt: new Date(),
        },
      })
    }
  }

  return NextResponse.json({ received: true })
}
