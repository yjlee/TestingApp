import Link from 'next/link'
import { db } from '@/lib/db'
import { BookOpen, Search, Upload, Star } from 'lucide-react'

export default async function HomePage() {
  const openFields = await db.fieldOfStudy.findMany({
    where: { isOpenForReview: true, isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  return (
    <div>
      {/* Hero */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
            Share your thesis.<br />
            <span className="text-blue-700">Get peer reviewed.</span>
          </h1>
          <p className="mt-5 text-lg text-gray-500 max-w-2xl mx-auto">
            PaperPath is an open platform for students and researchers to publish thesis work,
            receive anonymous expert reviews, and reach the academic community.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="bg-blue-700 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-800 transition-colors"
            >
              Get started
            </Link>
            <Link
              href="/search"
              className="bg-white text-gray-700 border border-gray-300 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Browse thesis
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-700">
              <Upload size={22} />
            </div>
            <h3 className="font-semibold text-gray-900">Upload your thesis</h3>
            <p className="text-sm text-gray-500">
              Publish your PDF thesis with full metadata. Readable in-browser by anyone.
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-700">
              <Star size={22} />
            </div>
            <h3 className="font-semibold text-gray-900">Get peer reviewed</h3>
            <p className="text-sm text-gray-500">
              Submit for a two-round anonymous expert review and reach the journal publishing queue.
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-700">
              <Search size={22} />
            </div>
            <h3 className="font-semibold text-gray-900">Discover research</h3>
            <p className="text-sm text-gray-500">
              Browse and search thousands of thesis across all academic disciplines.
            </p>
          </div>
        </div>
      </section>

      {/* Open fields */}
      {openFields.length > 0 && (
        <section className="bg-white border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-14">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Fields Currently Open for Review
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Submit a thesis in any of these fields to enter the peer review pipeline.
            </p>
            <div className="flex flex-wrap gap-3">
              {openFields.map((field) => (
                <Link
                  key={field.id}
                  href={`/search?field=${field.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  <BookOpen size={14} />
                  {field.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
