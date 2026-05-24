import Link from 'next/link'
import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { db } from '@/lib/db'
import { approveCompletion } from '@/lib/admin/actions'

const STAGE_LABELS: Record<number, string> = {
  1: 'Pending payment',
  2: 'Payment received',
  3: 'Awaiting reviewer (round 1)',
  4: 'Under review (round 1)',
  5: 'Round 1 complete',
  6: 'Awaiting reviewer (round 2)',
  7: 'Under review (round 2)',
  8: 'Awaiting approval',
  9: 'Complete',
}

const STAGE_BADGE: Record<number, string> = {
  3: 'bg-amber-50 text-amber-700',
  4: 'bg-blue-50 text-blue-700',
  6: 'bg-amber-50 text-amber-700',
  7: 'bg-blue-50 text-blue-700',
  8: 'bg-purple-50 text-purple-700',
}

const ACTIVE_STAGES = [3, 4, 6, 7, 8]

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>
}) {
  const { role } = await verifySession()
  if (role !== 'admin') redirect('/')

  const { stage: stageParam } = await searchParams
  const stageFilter = stageParam ? Number(stageParam) : null

  const [stageCounts, submissions] = await Promise.all([
    db.thesisReviewSubmission.groupBy({
      by: ['currentStage'],
      _count: { id: true },
      where: { currentStage: { in: ACTIVE_STAGES } },
    }),
    db.thesisReviewSubmission.findMany({
      where: stageFilter
        ? { currentStage: stageFilter }
        : { currentStage: { in: ACTIVE_STAGES } },
      select: {
        id: true,
        currentStage: true,
        stageUpdatedAt: true,
        thesis: {
          select: {
            id: true,
            title: true,
            user: { select: { profile: { select: { fullName: true } } } },
          },
        },
      },
      orderBy: [{ currentStage: 'asc' }, { stageUpdatedAt: 'asc' }],
      take: 100,
    }),
  ])

  const countByStage = Object.fromEntries(stageCounts.map((s) => [s.currentStage, s._count.id]))
  const totalActive = ACTIVE_STAGES.reduce((s, n) => s + (countByStage[n] ?? 0), 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Review Pipeline</h1>
        <p className="text-sm text-gray-400 mt-0.5">{totalActive} active submission{totalActive !== 1 ? 's' : ''}</p>
      </div>

      {/* Stage filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/admin/pipeline"
          className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
            !stageFilter
              ? 'bg-gray-900 text-white border-gray-900'
              : 'border-gray-300 text-gray-600 hover:bg-gray-100'
          }`}
        >
          All ({totalActive})
        </Link>
        {ACTIVE_STAGES.map((s) => (
          <Link
            key={s}
            href={`/admin/pipeline?stage=${s}`}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              stageFilter === s
                ? 'bg-gray-900 text-white border-gray-900'
                : 'border-gray-300 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Stage {s} · {STAGE_LABELS[s]} ({countByStage[s] ?? 0})
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Thesis</th>
              <th className="px-4 py-3 text-left">Author</th>
              <th className="px-4 py-3 text-left">Stage</th>
              <th className="px-4 py-3 text-left">Since</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {submissions.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/thesis/${s.thesis.id}`}
                    className="font-medium text-gray-900 hover:text-blue-700 line-clamp-1"
                  >
                    {s.thesis.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {s.thesis.user.profile?.fullName ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      STAGE_BADGE[s.currentStage] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {s.currentStage} · {STAGE_LABELS[s.currentStage] ?? 'Unknown'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(s.stageUpdatedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {s.currentStage === 8 && (
                    <form action={approveCompletion}>
                      <input type="hidden" name="submissionId" value={s.id} />
                      <button
                        type="submit"
                        className="text-xs font-medium bg-purple-700 text-white px-3 py-1.5 rounded-lg hover:bg-purple-800 transition-colors"
                      >
                        Approve & Complete
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {submissions.length === 0 && (
          <p className="text-center py-10 text-sm text-gray-400">No active submissions.</p>
        )}
      </div>
    </div>
  )
}
