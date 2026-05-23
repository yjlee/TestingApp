import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { db } from '@/lib/db'
import { User, ExternalLink, BookOpen, Eye, Download } from 'lucide-react'

const LEVEL_LABELS: Record<string, string> = {
  undergraduate: 'Undergraduate',
  postgraduate: 'Postgraduate',
  phd: 'PhD',
  professional: 'Professional',
  other: 'Other',
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params

  const profile = await db.profile.findUnique({
    where: { username },
    include: {
      user: {
        select: {
          email: true,
          theses: {
            where: { isDeleted: false },
            orderBy: { createdAt: 'desc' },
            select: {
              id: true, title: true, abstract: true,
              visitCount: true, downloadCount: true,
              yearOfSubmission: true, fieldOfStudy: { select: { name: true } },
            },
          },
        },
      },
      fieldOfStudy: { select: { name: true } },
    },
  })

  if (!profile) notFound()

  const totalVisits = profile.user.theses.reduce((s, t) => s + t.visitCount, 0)
  const totalDownloads = profile.user.theses.reduce((s, t) => s + t.downloadCount, 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row gap-6 items-start mb-10">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
          {profile.profilePhotoUrl ? (
            <Image src={profile.profilePhotoUrl} alt={profile.fullName} width={96} height={96} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <User size={36} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{profile.fullName}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {LEVEL_LABELS[profile.academicLevel]} · {profile.institution}
            {profile.fieldOfStudy && ` · ${profile.fieldOfStudy.name}`}
            {profile.graduationYear && ` · ${profile.graduationYear}`}
          </p>

          {profile.bio && <p className="mt-3 text-sm text-gray-700 max-w-xl">{profile.bio}</p>}

          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {profile.emailPublic && (
              <span className="text-gray-600">{profile.user.email}</span>
            )}
            {profile.linkedinUrl && (
              <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-700 hover:underline">
                LinkedIn <ExternalLink size={12} />
              </a>
            )}
            {profile.researchgateUrl && (
              <a href={profile.researchgateUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-700 hover:underline">
                ResearchGate <ExternalLink size={12} />
              </a>
            )}
          </div>

          <div className="mt-4 flex gap-5 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Eye size={14} /> {totalVisits} total visits</span>
            <span className="flex items-center gap-1"><Download size={14} /> {totalDownloads} total downloads</span>
          </div>
        </div>
      </div>

      {/* Thesis list */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Published Theses</h2>
      {profile.user.theses.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-gray-300 rounded-xl">
          <BookOpen size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No theses published yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {profile.user.theses.map((thesis) => (
            <Link
              key={thesis.id}
              href={`/thesis/${thesis.id}`}
              className="block rounded-xl border border-gray-200 bg-white px-5 py-4 hover:border-blue-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">{thesis.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {thesis.yearOfSubmission}
                    {thesis.fieldOfStudy && ` · ${thesis.fieldOfStudy.name}`}
                  </p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{thesis.abstract}</p>
                </div>
                <div className="flex-shrink-0 text-xs text-gray-400 space-y-1 text-right">
                  <p><Eye size={11} className="inline mr-0.5" />{thesis.visitCount}</p>
                  <p><Download size={11} className="inline mr-0.5" />{thesis.downloadCount}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
