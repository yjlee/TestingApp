import { redirect } from 'next/navigation'
import Link from 'next/link'
import { verifySession } from '@/lib/dal'
import { db } from '@/lib/db'
import { Upload, BookOpen } from 'lucide-react'

export default async function DashboardPage() {
  const { userId } = await verifySession()

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      profile: { select: { fullName: true, username: true, profilePhotoUrl: true } },
      theses: {
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, visitCount: true, downloadCount: true, createdAt: true },
      },
    },
  })

  if (!user) redirect('/login')

  const hasProfile = !!user.profile

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Profile nudge */}
      {!hasProfile && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
          <span>Complete your profile to get discovered.</span>
          <Link href="/profile/edit" className="font-medium underline hover:text-amber-900">
            Set up profile →
          </Link>
        </div>
      )}

      {/* Photo nudge */}
      {hasProfile && !user.profile?.profilePhotoUrl && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-5 py-3 text-sm text-blue-800">
          <span>Add a profile picture to make your profile stand out.</span>
          <Link href="/profile/edit" className="font-medium underline hover:text-blue-900">
            Add photo →
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user.profile?.fullName ?? user.email}
          </h1>
          {user.profile?.username && (
            <Link
              href={`/user/${user.profile.username}`}
              className="text-sm text-blue-700 hover:underline"
            >
              View public profile →
            </Link>
          )}
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
        >
          <Upload size={16} />
          Upload thesis
        </Link>
      </div>

      {/* Thesis list */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">My Theses</h2>
      {user.theses.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-300 rounded-xl">
          <BookOpen size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">No theses uploaded yet.</p>
          <Link
            href="/upload"
            className="mt-4 inline-block text-sm text-blue-700 font-medium hover:underline"
          >
            Upload your first thesis →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {user.theses.map((thesis) => (
            <div
              key={thesis.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 hover:border-blue-200 transition-colors"
            >
              <div>
                <Link
                  href={`/thesis/${thesis.id}`}
                  className="font-medium text-gray-900 hover:text-blue-700"
                >
                  {thesis.title}
                </Link>
                <p className="text-xs text-gray-400 mt-0.5">
                  {thesis.visitCount} visits · {thesis.downloadCount} downloads
                </p>
              </div>
              <Link
                href={`/thesis/${thesis.id}/edit`}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
