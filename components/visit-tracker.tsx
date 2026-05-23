'use client'

import { useEffect, useRef } from 'react'

export default function VisitTracker({ thesisId }: { thesisId: string }) {
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true
    fetch(`/api/visit/${thesisId}`, { method: 'POST' }).catch(() => {})
  }, [thesisId])

  return null
}
