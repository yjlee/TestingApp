import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { verifySession } from '@/lib/dal'
import { deleteThesis } from '@/lib/thesis/actions'
import ThesisForm from '@/components/thesis-form'

export default async function EditThesisPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { userId } = await verifySession()

  const thesis = await db.thesis.findUnique({
    where: { id, isDeleted: false },
    select: {
      id: true,
      userId: true,
      title: true,
      abstract: true,
      fieldOfStudyId: true,
      yearOfSubmission: true,
      institution: true,
      keywords: true,
      supervisorName: true,
      language: true,
    },
  })

  if (!thesis) notFound()
  if (thesis.userId !== userId) redirect('/dashboard')

  const fields = await db.fieldOfStudy.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Thesis</h1>
      <p className="text-sm text-gray-500 mb-8">Update your thesis metadata below.</p>

      <ThesisForm
        mode="edit"
        fields={fields}
        thesisId={thesis.id}
        defaultValues={{
          title: thesis.title,
          abstract: thesis.abstract,
          fieldOfStudyId: thesis.fieldOfStudyId,
          yearOfSubmission: thesis.yearOfSubmission,
          institution: thesis.institution,
          keywords: thesis.keywords,
          supervisorName: thesis.supervisorName,
          language: thesis.language,
        }}
      />

      {/* Delete section */}
      <div className="mt-12 border-t border-red-100 pt-8">
        <h2 className="text-sm font-semibold text-red-700 mb-1">Danger zone</h2>
        <p className="text-sm text-gray-500 mb-4">
          Deleting this thesis is permanent and cannot be undone.
        </p>
        <form action={deleteThesis}>
          <input type="hidden" name="thesisId" value={thesis.id} />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg border border-red-300 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
          >
            Delete thesis
          </button>
        </form>
      </div>
    </div>
  )
}
