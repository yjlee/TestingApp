import Link from 'next/link'
import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { db } from '@/lib/db'
import { revokeReviewer } from '@/lib/admin/actions'

export default async function ReviewersPage() {
  const { role } = await verifySession()
  if (role !== 'admin') redirect('/')

  const reviewers = await db.user.findMany({
    where: { role: 'reviewer' },
    select: {
      id: true,
      email: true,
      isActive: true,
      createdAt: true,
      profile: {
        select: {
          fullName: true,
          fieldOfStudy: { select: { name: true } },
        },
      },
      reviewerAssignments: {
        where: { status: 'done' },
        select: { id: true },
      },
      reviewerEarnings: {
        select: { amount: true, isPaid: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Reviewers</h1>
        <p className="text-sm text-gray-400 mt-0.5">{reviewers.length} reviewer{reviewers.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Field</th>
              <th className="px-4 py-3 text-right">Reviews done</th>
              <th className="px-4 py-3 text-right">Total earned</th>
              <th className="px-4 py-3 text-right">Unpaid</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reviewers.map((r) => {
              const totalEarned = r.reviewerEarnings.reduce((s, e) => s + Number(e.amount), 0)
              const unpaid = r.reviewerEarnings
                .filter((e) => !e.isPaid)
                .reduce((s, e) => s + Number(e.amount), 0)
              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <Link href={`/admin/reviewers/${r.id}`} className="hover:text-blue-700 transition-colors">
                      {r.profile?.fullName ?? <span className="text-gray-400 font-normal">—</span>}
                    </Link>
                    {!r.isActive && (
                      <span className="ml-1.5 text-xs text-red-500">(inactive)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.email}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.profile?.fieldOfStudy?.name ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">
                    {r.reviewerAssignments.length}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">
                    RM {totalEarned.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={unpaid > 0 ? 'text-amber-600 font-medium' : 'text-gray-400'}>
                      RM {unpaid.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <form action={revokeReviewer}>
                      <input type="hidden" name="userId" value={r.id} />
                      <button
                        type="submit"
                        className="text-xs font-medium px-2.5 py-1 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors"
                      >
                        Revoke
                      </button>
                    </form>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {reviewers.length === 0 && (
          <p className="text-center py-10 text-sm text-gray-400">No reviewers yet.</p>
        )}
      </div>
    </div>
  )
}
