import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { User, Eye, Download, Calendar, Building2, Tag, BookOpen, ExternalLink } from 'lucide-react'
import VisitTracker from '@/components/visit-tracker'

const PdfReader = dynamic(() => import('@/components/pdf-reader'), {
  ssr: false,
  loading: () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="w-full bg-gray-100 animate-pulse rounded" style={{ aspectRatio: '1 / 1.414' }} />
      ))}
    </div>
  ),
})

function formatBytes(bytes: bigint): string {
  const mb = Number(bytes) / (1024 * 1024)
  return mb < 1 ? `${(Number(bytes) / 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`
}

export default async function ThesisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession()

  const thesis = await db.thesis.findUnique({
    where: { id, isDeleted: false },
    select: {
      id: true,
      title: true,
      abstract: true,
      yearOfSubmission: true,
      institution: true,
      keywords: true,
      supervisorName: true,
      language: true,
      filePath: true,
      fileSizeBytes: true,
      visitCount: true,
      downloadCount: true,
      createdAt: true,
      fieldOfStudy: { select: { name: true } },
      user: {
        select: {
          id: true,
          profile: {
            select: {
              fullName: true,
              username: true,
              profilePhotoUrl: true,
              institution: true,
            },
          },
        },
      },
    },
  })

  if (!thesis) notFound()

  const isOwner = session?.userId === thesis.user.id
  const isAuthed = !!session?.userId
  const author = thesis.user.profile

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Visit tracker — fires POST /api/visit/[id] on mount, skipped for owner */}
      <VisitTracker thesisId={thesis.id} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">{thesis.title}</h1>
          {isOwner && (
            <Link
              href={`/thesis/${thesis.id}/edit`}
              className="flex-shrink-0 text-sm text-gray-500 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
            >
              Edit
            </Link>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
          {thesis.fieldOfStudy && (
            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
              <BookOpen size={11} /> {thesis.fieldOfStudy.name}
            </span>
          )}
          <span className="inline-flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-full">
            <Calendar size={11} /> {thesis.yearOfSubmission}
          </span>
          <span className="inline-flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-full">
            <Building2 size={11} /> {thesis.institution}
          </span>
          {thesis.language && thesis.language !== 'English' && (
            <span className="inline-flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-full">
              {thesis.language}
            </span>
          )}
        </div>

        <div className="mt-3 flex gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1"><Eye size={13} /> {thesis.visitCount} visits</span>
          <span className="flex items-center gap-1"><Download size={13} /> {thesis.downloadCount} downloads</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Abstract</h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{thesis.abstract}</p>
          </section>

          {thesis.keywords.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Tag size={12} /> Keywords
              </h2>
              <div className="flex flex-wrap gap-2">
                {thesis.keywords.map((kw) => (
                  <span key={kw} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                    {kw}
                  </span>
                ))}
              </div>
            </section>
          )}

          {thesis.supervisorName && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Supervisor</h2>
              <p className="text-sm text-gray-700">{thesis.supervisorName}</p>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-xs text-gray-400 mb-3">PDF · {formatBytes(thesis.fileSizeBytes)}</p>
            {isAuthed ? (
              <a
                href={`/api/download/${thesis.id}`}
                className="flex items-center justify-center gap-2 w-full bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
              >
                <Download size={15} /> Download PDF
              </a>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Register or log in to download this thesis.</p>
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 w-full border border-blue-700 text-blue-700 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                  Log in to download
                </Link>
              </div>
            )}
          </div>

          {author && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Author</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                  {author.profilePhotoUrl ? (
                    <Image
                      src={author.profilePhotoUrl}
                      alt={author.fullName}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <User size={18} />
                    </div>
                  )}
                </div>
                <div>
                  {author.username ? (
                    <Link
                      href={`/user/${author.username}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-700 inline-flex items-center gap-1"
                    >
                      {author.fullName} <ExternalLink size={11} />
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{author.fullName}</p>
                  )}
                  {author.institution && (
                    <p className="text-xs text-gray-400 mt-0.5">{author.institution}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PDF Reader */}
      <div className="border-t border-gray-200 pt-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Read Online
        </h2>
        <PdfReader fileUrl={thesis.filePath} />
      </div>
    </div>
  )
}
