import Link from 'next/link'
import { verifySession } from '@/lib/dal'
import { db } from '@/lib/db'
import { acceptReview } from '@/lib/reviewer/actions'
import { redirect } from 'next/navigation'
import { BookOpen, Eye, Building2, Calendar, Inbox } from 'lucide-react'

export default async function ReviewerQueuePage() {
  const { userId, role } = await verifySession()
  if (role !== 'reviewer' && role !== 'admin') redirect('/dashboard')

  const profile = await db.profile.findUnique({
    where: { userId },
    select: { fieldOfStudyId: true },
  })

  if (!profile?.fieldOfStudyId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Review Queue</h1>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Your profile does not have a field of expertise set.{' '}
          <Link href="/profile/edit" className="font-medium underline hover:text-amber-900">
            Update your profile →
          </Link>
        </div>
      </div>
    )
  }

  const myThesisIds = (
    await db.reviewerAssignment.findMany({
      where: { reviewerId: userId },
      select: { thesisId: true },
    })
  ).map((a) => a.thesisId)

  const queue = await db.thesisReviewSubmission.findMany({
    where: {
      currentStage: { in: [3, 6] },
      thesis: {
        isDeleted: false,
        fieldOfStudyId: profile.fieldOfStudyId,
        ...(myThesisIds.length > 0 && { id: { notIn: myThesisIds } }),
      },
    },
    select: {
      id: true,
      currentStage: true,
      stageUpdatedAt: true,
      thesis: {
        select: {
          id: true,
          title: true,
          abstract: true,
          yearOfSubmission: true,
          institution: true,
          fieldOfStudy: { select: { name: true } },
        },
      },
    },
    orderBy: { stageUpdatedAt: 'asc' },
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
        <span className="text-sm text-gray-400">{queue.length} available</span>
      </div>

      {queue.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-300 rounded-xl">
          <Inbox size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">No theses in the queue for your field right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((item) => {
            const thesis = item.thesis
            const round = item.currentStage === 3 ? 1 : 2
            return (
              <div
                key={item.id}
                className="rounded-xl border border-gray-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${round === 1 ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                      Round {round}
                    </span>
                    <p className="font-semibold text-gray-900 mt-1.5 leading-snug">{thesis.title}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-3">
                  {thesis.fieldOfStudy && (
                    <span className="flex items-center gap-1"><BookOpen size={11} /> {thesis.fieldOfStudy.name}</span>
                  )}
                  <span className="flex items-center gap-1"><Calendar size={11} /> {thesis.yearOfSubmission}</span>
                  <span className="flex items-center gap-1"><Building2 size={11} /> {thesis.institution}</span>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{thesis.abstract}</p>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/thesis/${thesis.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Eye size={14} /> Preview
                  </Link>
                  <form action={acceptReview}>
                    <input type="hidden" name="submissionId" value={item.id} />
                    <button
                      type="submit"
                      className="text-sm font-medium bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
                    >
                      Accept Review
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
