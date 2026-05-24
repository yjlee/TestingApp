import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { db } from '@/lib/db'
import { toggleFieldOpen, toggleFieldActive } from '@/lib/admin/actions'
import AddFieldForm from '@/components/add-field-form'

export default async function FieldsPage() {
  const { role } = await verifySession()
  if (role !== 'admin') redirect('/')

  const fields = await db.fieldOfStudy.findMany({
    select: {
      id: true,
      name: true,
      isOpenForReview: true,
      isActive: true,
      _count: { select: { theses: true, profiles: true } },
    },
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
  })

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Fields of Study</h1>
          <p className="text-sm text-gray-400 mt-0.5">{fields.length} field{fields.length !== 1 ? 's' : ''}</p>
        </div>
        <AddFieldForm />
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-right">Theses</th>
              <th className="px-4 py-3 text-right">Reviewers</th>
              <th className="px-4 py-3 text-center">Open for review</th>
              <th className="px-4 py-3 text-center">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fields.map((f) => (
              <tr key={f.id} className={`hover:bg-gray-50 ${!f.isActive ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 font-medium text-gray-900">{f.name}</td>
                <td className="px-4 py-3 text-right text-gray-600">{f._count.theses}</td>
                <td className="px-4 py-3 text-right text-gray-600">{f._count.profiles}</td>
                <td className="px-4 py-3 text-center">
                  <form action={toggleFieldOpen} className="inline">
                    <input type="hidden" name="id" value={f.id} />
                    <input type="hidden" name="isOpenForReview" value={String(f.isOpenForReview)} />
                    <button
                      type="submit"
                      className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                        f.isOpenForReview
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {f.isOpenForReview ? 'Open' : 'Closed'}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 text-center">
                  <form action={toggleFieldActive} className="inline">
                    <input type="hidden" name="id" value={f.id} />
                    <input type="hidden" name="isActive" value={String(f.isActive)} />
                    <button
                      type="submit"
                      className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                        f.isActive
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {f.isActive ? 'Active' : 'Retired'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {fields.length === 0 && (
          <p className="text-center py-10 text-sm text-gray-400">No fields added yet.</p>
        )}
      </div>
    </div>
  )
}
