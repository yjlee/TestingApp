import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { db } from '@/lib/db'
import { revokeReviewer } from '@/lib/admin/actions'
import { ArrowLeft, User } from 'lucide-react'
import Image from 'next/image'

export default async function ReviewerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { role } = await verifySession()
  if (role !== 'admin') redirect('/')

  const { id } = await params

  const reviewer = await db.user.findUnique({
    where: { id, role: 'reviewer' },
    select: {
      id: true,
      email: true,
      isActive: true,
      createdAt: true,
      profile: {
        select: {
          fullName: true,
          institution: true,
          bio: true,
          profilePhotoUrl: true,
          alipayAccountId: true,
          fieldOfStudy: { select: { name: true } },
        },
      },
      reviewerAssignments: {
        select: {
          id: true,
          reviewRound: true,
          status: true,
          assignedAt: true,
          completedAt: true,
          thesis: { select: { id: true, title: true } },
          earning: { select: { amount: true, currency: true, isPaid: true } },
        },
        orderBy: { assignedAt: 'desc' },
      },
      payoutRequests: {
        select: { id: true, amount: true, currency: true, status: true, requestedAt: true },
        orderBy: { requestedAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!reviewer) notFound()

  const completed = reviewer.reviewerAssignments.filter((a) => a.status === 'done')
  const active = reviewer.reviewerAssignments.filter((a) => a.status === 'in_progress')
  const totalEarned = completed.reduce((s, a) => s + Number(a.earning?.amount ?? 0), 0)
  const unpaid = completed
    .filter((a) => a.earning && !a.earning.isPaid)
    .reduce((s, a) => s + Number(a.earning!.amount), 0)

  const PAYOUT_BADGE: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700',
    approved: 'bg-blue-50 text-blue-700',
    paid: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-600',
  }

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/reviewers"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={14} /> Back to reviewers
      </Link>

      {/* Profile header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
            {reviewer.profile?.profilePhotoUrl ? (
              <Image
                src={reviewer.profile.profilePhotoUrl}
                alt={reviewer.profile.fullName}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <User size={24} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {reviewer.profile?.fullName ?? '—'}
                </h1>
                <p className="text-sm text-gray-500">{reviewer.email}</p>
              </div>
              <form action={revokeReviewer}>
                <input type="hidden" name="userId" value={reviewer.id} />
                <button
                  type="submit"
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors flex-shrink-0"
                >
                  Revoke reviewer
                </button>
              </form>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
              <span><span className="text-gray-400">Field:</span> {reviewer.profile?.fieldOfStudy?.name ?? '—'}</span>
              <span><span className="text-gray-400">Institution:</span> {reviewer.profile?.institution ?? '—'}</span>
              <span><span className="text-gray-400">Alipay:</span> {reviewer.profile?.alipayAccountId ?? <span className="text-red-500">Not set</span>}</span>
              <span><span className="text-gray-400">Joined:</span> {new Date(reviewer.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Reviews done', value: completed.length },
          { label: 'Total earned', value: `RM ${totalEarned.toFixed(2)}` },
          { label: 'Unpaid balance', value: `RM ${unpaid.toFixed(2)}` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white px-4 py-4">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className="text-lg font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Active reviews */}
      {active.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Active Reviews ({active.length})
          </h2>
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            {active.map((a) => (
              <div key={a.id} className="px-4 py-3 border-b border-gray-100 last:border-0 flex items-center justify-between gap-4">
                <Link href={`/thesis/${a.thesis.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-700 line-clamp-1">
                  {a.thesis.title}
                </Link>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex-shrink-0">
                  Round {a.reviewRound}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review history */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Review History</h2>
        {completed.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6 border border-dashed border-gray-300 rounded-xl">
            No completed reviews yet.
          </p>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Thesis</th>
                  <th className="px-4 py-3 text-left">Round</th>
                  <th className="px-4 py-3 text-left">Completed</th>
                  <th className="px-4 py-3 text-right">Earned</th>
                  <th className="px-4 py-3 text-left">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {completed.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/thesis/${a.thesis.id}`} className="font-medium text-gray-900 hover:text-blue-700 line-clamp-1">
                        {a.thesis.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">Round {a.reviewRound}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {a.earning ? `${a.earning.currency} ${Number(a.earning.amount).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {a.earning ? (
                        <span className={`text-xs font-medium ${a.earning.isPaid ? 'text-green-600' : 'text-amber-600'}`}>
                          {a.earning.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout requests */}
      {reviewer.payoutRequests.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Payout Requests</h2>
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reviewer.payoutRequests.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(p.requestedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {p.currency} {Number(p.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PAYOUT_BADGE[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
