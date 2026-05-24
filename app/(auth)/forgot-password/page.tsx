'use client'

import { useState } from 'react'
import Link from 'next/link'
import { forgotPassword } from '@/lib/auth/actions'
import Image from 'next/image'
import { Copy, Check } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(null)
    setDevResetUrl(null)
    setLoading(true)
    const result = await forgotPassword(formData)
    if (result?.error) setError(result.error)
    else if (result?.success) {
      setSuccess(result.success)
      if (result.devResetUrl) setDevResetUrl(result.devResetUrl)
    }
    setLoading(false)
  }

  function handleCopy() {
    if (!devResetUrl) return
    navigator.clipboard.writeText(devResetUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Link href="/" className="inline-block">
          <Image src="/logo.png" alt="PaperPath" width={160} height={46} className="h-11 w-auto mx-auto" />
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-gray-900">Reset your password</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter your email and we&apos;ll send a reset link
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {success ? (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <p className="font-medium text-gray-900">Check your email</p>
              <p className="text-sm text-gray-500">{success}</p>
            </div>

            {devResetUrl && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
                <p className="text-xs font-semibold text-amber-800">
                  No email provider configured — use this link directly:
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-amber-900 break-all flex-1">{devResetUrl}</code>
                  <button onClick={handleCopy} className="flex-shrink-0 text-amber-700 hover:text-amber-900">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}

            <Link href="/login" className="text-sm text-blue-700 hover:underline block text-center">
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
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        <Link href="/login" className="text-blue-700 font-medium hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  )
}
