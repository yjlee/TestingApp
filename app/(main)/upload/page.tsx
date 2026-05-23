import { verifySession } from '@/lib/dal'
import { db } from '@/lib/db'
import ThesisForm from '@/components/thesis-form'

export default async function UploadPage() {
  await verifySession()

  const fields = await db.fieldOfStudy.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Thesis</h1>
      <p className="text-sm text-gray-500 mb-8">
        Share your thesis with the academic community.
      </p>
      <ThesisForm mode="upload" fields={fields} />
    </div>
  )
}
