'use client'

import { useActionState } from 'react'
import { generateInvite } from '@/lib/admin/actions'
import { Loader2, Copy, Check } from 'lucide-react'
import { useState } from 'react'

export default function GenerateInviteButton() {
  const [state, action, pending] = useActionState(generateInvite, undefined)
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (!state?.url) return
    navigator.clipboard.writeText(state.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <form action={action}>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-50"
        >
          {pending && <Loader2 size={14} className="animate-spin" />}
          Generate Invite Link
        </button>
      </form>

      {state?.error && (
        <p className="mt-2 text-sm text-red-600">{state.error}</p>
      )}

      {state?.url && (
        <div className="mt-3 flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <code className="text-sm text-green-900 break-all flex-1">{state.url}</code>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 text-green-700 hover:text-green-900 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
      )}
    </div>
  )
}
