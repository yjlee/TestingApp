'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'
import { requestPayout } from '@/lib/payout/actions'

type Props = {
  unpaidBalance: number
  disabledReason: string | null  // null = can request
}

export default function RequestPayoutButton({ unpaidBalance, disabledReason }: Props) {
  const [state, action, pending] = useActionState(requestPayout, undefined)
  const error = state?.error ?? disabledReason

  return (
    <div>
      <form action={action}>
        <button
          type="submit"
          disabled={!!disabledReason || pending}
          className="inline-flex items-center gap-2 bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending && <Loader2 size={14} className="animate-spin" />}
          {pending ? 'Requesting…' : `Request Cash Out — RM ${unpaidBalance.toFixed(2)}`}
        </button>
      </form>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      {!error && state !== undefined && (
        <p className="mt-2 text-sm text-green-600">Payout request submitted successfully.</p>
      )}
    </div>
  )
}
