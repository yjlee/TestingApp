'use client'

import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { useRef } from 'react'

export default function AdminSearch({ path, defaultValue }: { path: string; defaultValue: string }) {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const url = q ? `${path}?q=${encodeURIComponent(q)}` : path
      router.push(url)
    }, 300)
  }

  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="text"
        defaultValue={defaultValue}
        placeholder="Search…"
        onChange={handleChange}
        className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
      />
    </div>
  )
}
