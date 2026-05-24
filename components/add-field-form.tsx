'use client'

import { useActionState } from 'react'
import { addField } from '@/lib/admin/actions'
import { Loader2 } from 'lucide-react'

export default function AddFieldForm() {
  const [state, action, pending] = useActionState(addField, undefined)

  return (
    <form action={action} className="flex items-start gap-2">
      <div>
        <input
          type="text"
          name="name"
          placeholder="Field of study name"
          required
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        {state?.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-50"
      >
        {pending && <Loader2 size={13} className="animate-spin" />}
        Add Field
      </button>
    </form>
  )
}
