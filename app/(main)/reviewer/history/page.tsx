import Link from 'next/link'
import { verifySession } from '@/lib/dal'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

export default async function ReviewerHistoryPage() {
  const { userId, role } = await verifySession()
  if (role !== 'reviewer' && role !== 'admin') redirect('/dashboard')

  const history = await db.reviewerAssignment.findMany({
    where: { reviewerId: userId, status: 'done' },
    select: {
      id: true,
      reviewRound: true,
      completedAt: true,
      thesis: { select: { id: true, title: true, yearOfSubmission: true, institution: true } },
      earning: { select: { amount: true, currency: true, isPaid: true } },
    },
    orderBy: { completedAt: 'desc' },
  })

  const totalEarned = history.reduce(
    (sum, h) => sum + (h.earning ? Number(h.earning.amount) : 0),
    0,
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Review History</h1>
        <span className="text-sm text-gray-500">
          Total earned: <span className="font-semibold text-gray-900">RM {totalEarned.toFixed(2)}</span>
        </span>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-300 rounded-xl">
          <p className="text-gray-400 text-sm">No completed reviews yet.</p>
          <Link
            href="/reviewer/queue"
            className="mt-4 inline-block text-sm text-blue-700 font-medium hover:underline"
          >
            Go to review queue →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((h) => (
            <div
              key={h.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4"
            >
              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <Link
                    href={`/thesis/${h.thesis.id}`}
                    className="font-medium text-gray-900 hover:text-blue-700 text-sm"
                  >
                    {h.thesis.title}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Round {h.reviewRound} · {h.thesis.yearOfSubmission} · {h.thesis.institution}
                  </p>
                  {h.completedAt && (
                    <p className="text-xs text-gray-400">
                      Completed {new Date(h.completedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              {h.earning && (
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {h.earning.currency} {Number(h.earning.amount).toFixed(2)}
                  </p>
                  <p className={`text-xs ${h.earning.isPaid ? 'text-green-600' : 'text-amber-500'}`}>
                    {h.earning.isPaid ? 'Paid' : 'Pending payout'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
