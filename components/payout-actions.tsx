'use client'

import { useState } from 'react'
import { approvePayout, rejectPayout, markPayoutPaid } from '@/lib/admin/actions'

export default function PayoutActions({ id, status }: { id: string; status: string }) {
  const [showReject, setShowReject] = useState(false)

  if (status === 'paid' || status === 'rejected') return null

  return (
    <div className="flex flex-col gap-2">
      {status === 'pending' && (
        <div className="flex items-center gap-2 flex-wrap">
          <form action={approvePayout} className="inline">
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              className="text-xs font-medium bg-blue-700 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 transition-colors"
            >
              Approve
            </button>
          </form>
          {!showReject && (
            <button
              onClick={() => setShowReject(true)}
              className="text-xs font-medium border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              Reject
            </button>
          )}
        </div>
      )}

      {status === 'approved' && (
        <form action={markPayoutPaid} className="inline">
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            className="text-xs font-medium bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800 transition-colors"
          >
            Mark as Paid
          </button>
        </form>
      )}

      {showReject && status === 'pending' && (
        <form action={rejectPayout} className="flex flex-col gap-1.5">
          <input type="hidden" name="id" value={id} />
          <textarea
            name="adminNote"
            rows={2}
            placeholder="Rejection reason (optional)"
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="text-xs font-medium bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
            >
              Confirm Reject
            </button>
            <button
              type="button"
              onClick={() => setShowReject(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
