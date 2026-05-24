import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-blue-700">
            <BookOpen size={18} />
            ThesisHub
          </Link>

          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/search" className="hover:text-gray-900 transition-colors">Browse</Link>
            <Link href="/upload" className="hover:text-gray-900 transition-colors">Upload</Link>
            <Link href="/login" className="hover:text-gray-900 transition-colors">Log in</Link>
            <Link href="/register" className="hover:text-gray-900 transition-colors">Register</Link>
          </div>

          <p className="text-xs text-gray-400">© {new Date().getFullYear()} ThesisHub</p>
        </div>
      </div>
    </footer>
  )
}
