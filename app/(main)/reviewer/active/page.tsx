import Link from 'next/link'
import { verifySession } from '@/lib/dal'
import { db } from '@/lib/db'
import { markReviewDone } from '@/lib/reviewer/actions'
import { redirect } from 'next/navigation'
import { CheckCheck, BookOpen, Inbox } from 'lucide-react'

export default async function ReviewerActivePage() {
  const { userId, role } = await verifySession()
  if (role !== 'reviewer' && role !== 'admin') redirect('/dashboard')

  const assignments = await db.reviewerAssignment.findMany({
    where: { reviewerId: userId, status: 'in_progress' },
    select: {
      id: true,
      reviewRound: true,
      assignedAt: true,
      thesis: {
        select: {
          id: true,
          title: true,
          institution: true,
          yearOfSubmission: true,
          abstract: true,
          fieldOfStudy: { select: { name: true } },
          reviewSubmission: { select: { currentStage: true } },
        },
      },
    },
    orderBy: { assignedAt: 'asc' },
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Active Reviews</h1>
        <span className="text-sm text-gray-400">{assignments.length} in progress</span>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-300 rounded-xl">
          <Inbox size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">No active reviews.</p>
          <Link
            href="/reviewer/queue"
            className="mt-4 inline-block text-sm text-blue-700 font-medium hover:underline"
          >
            Browse the review queue →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => (
            <div key={a.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.reviewRound === 1 ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                    Round {a.reviewRound}
                  </span>
                  <p className="font-semibold text-gray-900 mt-1.5 leading-snug">{a.thesis.title}</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 mb-1">
                {a.thesis.yearOfSubmission} · {a.thesis.institution}
                {a.thesis.fieldOfStudy && ` · ${a.thesis.fieldOfStudy.name}`}
              </p>

              <p className="text-xs text-gray-400 mb-4">
                Accepted {new Date(a.assignedAt).toLocaleDateString()}
              </p>

              <p className="text-sm text-gray-600 line-clamp-2 mb-5">{a.thesis.abstract}</p>

              <div className="flex items-center gap-3">
                <Link
                  href={`/thesis/${a.thesis.id}`}
                  target="_blank"
                  className="text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <BookOpen size={14} className="inline mr-1.5" />Read thesis
                </Link>
                <form action={markReviewDone}>
                  <input type="hidden" name="assignmentId" value={a.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 text-sm font-medium bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCheck size={14} /> Mark as Done
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
