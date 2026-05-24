import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { verifySession } from '@/lib/dal'
import { db } from '@/lib/db'
import { startCheckout } from '@/lib/review/actions'
import { REVIEW_FEE_MYR } from '@/lib/stripe'
import { BookOpen, Shield, Clock } from 'lucide-react'

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ thesisId: string }>
}) {
  const { thesisId } = await params
  const { userId } = await verifySession()

  const thesis = await db.thesis.findUnique({
    where: { id: thesisId, isDeleted: false },
    select: {
      id: true,
      title: true,
      userId: true,
      yearOfSubmission: true,
      institution: true,
      fieldOfStudy: { select: { name: true, isOpenForReview: true } },
      reviewSubmission: { select: { id: true } },
    },
  })

  if (!thesis || thesis.userId !== userId) notFound()
  if (thesis.reviewSubmission) redirect(`/thesis/${thesisId}`)
  if (!thesis.fieldOfStudy?.isOpenForReview) redirect(`/thesis/${thesisId}`)

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Submit for Expert Review</h1>
        <p className="text-sm text-gray-500">
          Your thesis will enter the review queue once payment is confirmed.
        </p>
      </div>

      {/* Thesis summary */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
          <BookOpen size={12} /> Thesis
        </p>
        <p className="font-semibold text-gray-900 text-sm leading-snug">{thesis.title}</p>
        <p className="text-xs text-gray-400 mt-1">
          {thesis.yearOfSubmission} · {thesis.institution}
          {thesis.fieldOfStudy && ` · ${thesis.fieldOfStudy.name}`}
        </p>
      </div>

      {/* Fee breakdown */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Expert review service</span>
          <span className="font-medium text-gray-900">RM {REVIEW_FEE_MYR.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-bold text-gray-900">RM {REVIEW_FEE_MYR.toFixed(2)}</span>
        </div>
      </div>

      {/* What happens next */}
      <div className="space-y-3 mb-8">
        {[
          { icon: Shield, text: 'Payment processed securely via Stripe + Alipay.' },
          { icon: Clock, text: 'Your thesis enters the reviewer queue immediately after confirmation.' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-start gap-2 text-xs text-gray-500">
            <Icon size={13} className="mt-0.5 flex-shrink-0 text-gray-400" />
            {text}
          </div>
        ))}
      </div>

      {/* Payment button */}
      <form action={startCheckout}>
        <input type="hidden" name="thesisId" value={thesis.id} />
        <button
          type="submit"
          className="w-full bg-blue-700 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors"
        >
          Pay RM {REVIEW_FEE_MYR.toFixed(2)} with Alipay
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link href={`/thesis/${thesisId}`} className="text-sm text-gray-400 hover:text-gray-600">
          Cancel — go back to thesis
        </Link>
      </div>
    </div>
  )
}
