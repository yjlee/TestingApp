import Link from 'next/link'
import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { db } from '@/lib/db'
import PayoutActions from '@/components/payout-actions'

const STATUS_TABS = ['pending', 'approved', 'paid', 'rejected'] as const
type StatusTab = (typeof STATUS_TABS)[number]

export default async function PayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { role } = await verifySession()
  if (role !== 'admin') redirect('/')

  const { status: statusParam = 'pending' } = await searchParams
  const status: StatusTab = STATUS_TABS.includes(statusParam as StatusTab)
    ? (statusParam as StatusTab)
    : 'pending'

  const [counts, payouts] = await Promise.all([
    db.payoutRequest.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    db.payoutRequest.findMany({
      where: { status },
      select: {
        id: true,
        amount: true,
        currency: true,
        alipayAccountId: true,
        status: true,
        adminNote: true,
        requestedAt: true,
        processedAt: true,
        reviewer: {
          select: {
            email: true,
            profile: { select: { fullName: true } },
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    }),
  ])

  const countByStatus = Object.fromEntries(counts.map((c) => [c.status, c._count.id]))

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Payouts</h1>

      {/* Status tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab}
            href={`/admin/payouts?status=${tab}`}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
              status === tab
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
            {countByStatus[tab] ? (
              <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                {countByStatus[tab]}
              </span>
            ) : null}
          </Link>
        ))}
      </div>

      {payouts.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-gray-300 rounded-xl">
          <p className="text-sm text-gray-400">No {status} payout requests.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Reviewer</th>
                <th className="px-4 py-3 text-left">Alipay</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-left">Requested</th>
                {status !== 'pending' && <th className="px-4 py-3 text-left">Processed</th>}
                {status === 'rejected' && <th className="px-4 py-3 text-left">Note</th>}
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payouts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {p.reviewer.profile?.fullName ?? '—'}
                    </p>
                    <p className="text-xs text-gray-400">{p.reviewer.email}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    {p.alipayAccountId}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {p.currency} {Number(p.amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(p.requestedAt).toLocaleDateString()}
                  </td>
                  {status !== 'pending' && (
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {p.processedAt ? new Date(p.processedAt).toLocaleDateString() : '—'}
                    </td>
                  )}
                  {status === 'rejected' && (
                    <td className="px-4 py-3 text-xs text-gray-500">{p.adminNote ?? '—'}</td>
                  )}
                  <td className="px-4 py-3">
                    <PayoutActions id={p.id} status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
