'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signUp } from '@/lib/auth/actions'
import { BookOpen } from 'lucide-react'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(null)

    const password = formData.get('password') as string
    const confirm = formData.get('confirm_password') as string
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const result = await signUp(formData)
    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setSuccess(result.success)
    }
    setLoading(false)
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-blue-700 font-bold text-2xl">
          <BookOpen size={28} />
          ThesisHub
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-gray-900">Create an account</h1>
        <p className="mt-1 text-sm text-gray-500">Join the academic community</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {success ? (
          <div className="text-center space-y-3">
            <div className="text-4xl">📧</div>
            <p className="font-medium text-gray-900">Check your email</p>
            <p className="text-sm text-gray-500">{success}</p>
            <Link href="/login" className="text-sm text-blue-700 hover:underline block">
              Back to login
            </Link>
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm password
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                autoComplete="new-password"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-700 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
