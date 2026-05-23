import Link from 'next/link'
import { db } from '@/lib/db'
import { Eye, Download, Search } from 'lucide-react'

const PAGE_SIZE = 12

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; field?: string; year?: string; page?: string }>
}) {
  const { q = '', field = '', year = '', page = '1' } = await searchParams
  const pageNum = Math.max(1, parseInt(page) || 1)
  const skip = (pageNum - 1) * PAGE_SIZE

  const where = {
    isDeleted: false,
    ...(q && {
      OR: [
        { title: { contains: q, mode: 'insensitive' as const } },
        { abstract: { contains: q, mode: 'insensitive' as const } },
      ],
    }),
    ...(field && { fieldOfStudyId: field }),
    ...(year && !isNaN(parseInt(year)) && { yearOfSubmission: parseInt(year) }),
  }

  const [theses, total, fields] = await Promise.all([
    db.thesis.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        abstract: true,
        yearOfSubmission: true,
        institution: true,
        visitCount: true,
        downloadCount: true,
        fieldOfStudy: { select: { name: true } },
        user: {
          select: {
            profile: { select: { fullName: true, username: true } },
          },
        },
      },
    }),
    db.thesis.count({ where }),
    db.fieldOfStudy.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (field) p.set('field', field)
    if (year) p.set('year', year)
    p.set('page', pageNum.toString())
    for (const [k, v] of Object.entries(overrides)) {
      if (v) p.set(k, v); else p.delete(k)
    }
    return `/search?${p.toString()}`
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Browse Theses</h1>

      {/* Filters */}
      <form method="GET" action="/search" className="mb-8 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Search by title or abstract…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          name="field"
          defaultValue={field}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All fields</option>
          {fields.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <input
          name="year"
          type="number"
          defaultValue={year}
          placeholder="Year"
          min={1950}
          max={new Date().getFullYear()}
          className="w-28 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
        >
          Search
        </button>
        {(q || field || year) && (
          <Link
            href="/search"
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-4">
        {total === 0 ? 'No theses found.' : `${total} thesis${total === 1 ? '' : 'es'} found`}
        {(q || field || year) && ' matching your filters'}
      </p>

      {/* Thesis cards */}
      {theses.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-300 rounded-xl">
          <p className="text-gray-400 text-sm">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {theses.map((thesis) => {
            const author = thesis.user.profile
            return (
              <Link
                key={thesis.id}
                href={`/thesis/${thesis.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-5 hover:border-blue-200 transition-colors"
              >
                <p className="font-semibold text-gray-900 line-clamp-2 leading-snug">
                  {thesis.title}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {thesis.yearOfSubmission}
                  {thesis.fieldOfStudy && ` · ${thesis.fieldOfStudy.name}`}
                  {thesis.institution && ` · ${thesis.institution}`}
                </p>
                {author && (
                  <p className="text-xs text-gray-500 mt-1">{author.fullName}</p>
                )}
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{thesis.abstract}</p>
                <div className="mt-3 flex gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Eye size={11} /> {thesis.visitCount}</span>
                  <span className="flex items-center gap-1"><Download size={11} /> {thesis.downloadCount}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {pageNum > 1 && (
            <Link
              href={buildUrl({ page: (pageNum - 1).toString() })}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              ← Previous
            </Link>
          )}
          <span className="text-sm text-gray-500">
            Page {pageNum} of {totalPages}
          </span>
          {pageNum < totalPages && (
            <Link
              href={buildUrl({ page: (pageNum + 1).toString() })}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
