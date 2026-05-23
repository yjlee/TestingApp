'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Camera, User } from 'lucide-react'

export default function PhotoUpload({ currentPhotoUrl }: { currentPhotoUrl: string | null }) {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setPreview(URL.createObjectURL(file))
    setUploading(true)

    const form = new FormData()
    form.append('photo', file)
    const res = await fetch('/api/upload/photo', { method: 'POST', body: form })
    const data = await res.json()

    setUploading(false)
    if (!res.ok) {
      setError(data.error ?? 'Upload failed.')
      setPreview(currentPhotoUrl)
    }
  }

  return (
    <div className="flex items-center gap-5">
      <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
        {preview ? (
          <Image src={preview} alt="Profile photo" fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <User size={32} />
          </div>
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          <Camera size={15} />
          {uploading ? 'Uploading…' : preview ? 'Change photo' : 'Upload photo'}
        </button>
        <p className="text-xs text-gray-400 mt-1">JPEG, PNG or WebP · max 5MB</p>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
      </div>
    </div>
  )
}
