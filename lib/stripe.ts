import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

// Review fee in cents (e.g. 5000 = RM 50.00)
export const REVIEW_FEE_CENTS = Number(process.env.REVIEW_FEE_CENTS ?? '5000')
export const REVIEW_FEE_MYR = REVIEW_FEE_CENTS / 100
