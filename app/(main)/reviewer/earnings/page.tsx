import Link from 'next/link'
import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { db } from '@/lib/db'
import RequestPayoutButton from '@/components/request-payout-button'
import { TrendingUp, Wallet, Clock } from 'lucide-react'

const MIN_PAYOUT_MYR = Number(process.env.MIN_PAYOUT_MYR ?? '20')

const PAYOUT_STATUS: Record<string, { label: string; className: string }> = {
  pending:  { label: 'Pending',  className: 'bg-amber-50 text-amber-700' },
  approved: { label: 'Approved', className: 'bg-blue-50 text-blue-700' },
  paid:     { label: 'Paid',     className: 'bg-green-50 text-green-700' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-600' },
}

const EARNING_STATUS = (isPaid: boolean, payoutRequestId: string | null) => {
  if (isPaid) return { label: 'Paid', className: 'text-green-600' }
  if (payoutRequestId) return { label: 'In request', className: 'text-amber-600' }
  return { label: 'Available', className: 'text-gray-500' }
}

export default async function EarningsPage() {
  const { userId, role } = await verifySession()
  if (role !== 'reviewer' && role !== 'admin') redirect('/dashboard')

  const [profile, earnings, payoutRequests] = await Promise.all([
    db.profile.findUnique({
      where: { userId },
      select: { alipayAccountId: true },
    }),
    db.reviewerEarning.findMany({
      where: { reviewerId: userId },
      select: {
        id: true, amount: true, currency: true, isPaid: true,
        payoutRequestId: true, earnedAt: true,
        thesis: { select: { id: true, title: true } },
        assignment: { select: { reviewRound: true } },
      },
      orderBy: { earnedAt: 'desc' },
    }),
    db.payoutRequest.findMany({
      where: { reviewerId: userId },
      select: {
        id: true, amount: true, currency: true, status: true,
        alipayAccountId: true, requestedAt: true, processedAt: true, adminNote: true,
      },
      orderBy: { requestedAt: 'desc' },
    }),
  ])

  const totalEarned = earnings.reduce((s, e) => s + Number(e.amount), 0)
  const unpaidBalance = earnings
    .filter((e) => !e.isPaid && !e.payoutRequestId)
    .reduce((s, e) => s + Number(e.amount), 0)
  const pendingPayoutTotal = earnings
    .filter((e) => !e.isPaid && !!e.payoutRequestId)
    .reduce((s, e) => s + Number(e.amount), 0)

  const hasActiveRequest = payoutRequests.some(
    (r) => r.status === 'pending' || r.status === 'approved',
  )

  let disabledReason: string | null = null
  if (!profile?.alipayAccountId) {
    disabledReason = 'Add your Alipay account ID in your profile to request payouts.'
  } else if (hasActiveRequest) {
    disabledReason = 'You have an active payout request. Wait for it to be processed.'
  } else if (unpaidBalance <= 0) {
    disabledReason = 'No available balance to request.'
  } else if (unpaidBalance < MIN_PAYOUT_MYR) {
    disabledReason = `Minimum payout is RM ${MIN_PAYOUT_MYR.toFixed(2)}. You need RM ${(MIN_PAYOUT_MYR - unpaidBalance).toFixed(2)} more.`
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Earnings</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: TrendingUp, label: 'Total earned', value: `RM ${totalEarned.toFixed(2)}`, color: 'text-gray-900' },
          { icon: Wallet,     label: 'Available',    value: `RM ${unpaidBalance.toFixed(2)}`, color: 'text-blue-700' },
          { icon: Clock,      label: 'In request',   value: `RM ${pendingPayoutTotal.toFixed(2)}`, color: 'text-amber-600' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white px-5 py-4">
            <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">
              <Icon size={12} /> {label}
            </p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Payout action */}
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-5 mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-0.5">Cash Out via Alipay</p>
            <p className="text-xs text-gray-500">
              {profile?.alipayAccountId
                ? `To account: ${profile.alipayAccountId}`
                : 'No Alipay account set — '}
              {!profile?.alipayAccountId && (
                <Link href="/profile/edit" className="text-blue-700 underline">
                  update profile
                </Link>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Minimum: RM {MIN_PAYOUT_MYR.toFixed(2)} · Processed manually by admin
            </p>
          </div>
          <RequestPayoutButton unpaidBalance={unpaidBalance} disabledReason={disabledReason} />
        </div>
      </div>

      {/* Payout request history */}
      {payoutRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Payout Requests</h2>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Alipay Account</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payoutRequests.map((req) => {
                  const status = PAYOUT_STATUS[req.status]
                  return (
                    <tr key={req.id} className="bg-white">
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(req.requestedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                        {req.alipayAccountId}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {req.currency} {Number(req.amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.className}`}>
                          {status.label}
                        </span>
                        {req.adminNote && (
                          <p className="text-xs text-gray-400 mt-0.5">{req.adminNote}</p>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Earnings table */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Earnings History</h2>
        {earnings.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-gray-300 rounded-xl">
            <p className="text-sm text-gray-400">No earnings yet.</p>
            <Link href="/reviewer/queue" className="mt-3 inline-block text-sm text-blue-700 font-medium hover:underline">
              Browse the review queue →
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Thesis</th>
                  <th className="px-4 py-3 text-left">Round</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {earnings.map((e) => {
                  const status = EARNING_STATUS(e.isPaid, e.payoutRequestId)
                  return (
                    <tr key={e.id} className="bg-white">
                      <td className="px-4 py-3">
                        <Link
                          href={`/thesis/${e.thesis.id}`}
                          className="text-gray-900 hover:text-blue-700 line-clamp-1 font-medium"
                        >
                          {e.thesis.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-500">Round {e.assignment.reviewRound}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(e.earnedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {e.currency} {Number(e.amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${status.className}`}>{status.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
