import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import ResetPasswordForm from './form'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token = '' } = await searchParams

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-blue-700 font-bold text-2xl">
          <BookOpen size={28} />
          ThesisHub
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-gray-900">Set new password</h1>
        <p className="mt-1 text-sm text-gray-500">Choose a strong password</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  )
}
