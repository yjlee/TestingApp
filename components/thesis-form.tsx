'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateThesis } from '@/lib/thesis/actions'
import { Loader2 } from 'lucide-react'

type Field = { id: string; name: string }

type DefaultValues = {
  title: string
  abstract: string
  fieldOfStudyId: string | null
  yearOfSubmission: number
  institution: string
  keywords: string[]
  supervisorName: string | null
  language: string | null
}

type Props =
  | { mode: 'upload'; fields: Field[] }
  | { mode: 'edit'; fields: Field[]; thesisId: string; defaultValues: DefaultValues }

const LANGUAGES = ['English', 'Malay', 'Chinese', 'Other']

export default function ThesisForm(props: Props) {
  const { mode, fields } = props
  const router = useRouter()

  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [editState, editAction, editPending] = useActionState(updateThesis, undefined)

  const isEdit = mode === 'edit'
  const defaultValues = isEdit ? props.defaultValues : null
  const pending = isEdit ? editPending : uploading
  const error = isEdit ? editState?.error : uploadError
  const currentYear = new Date().getFullYear()

  async function handleUploadSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setUploadError(null)
    setUploading(true)
    const form = new FormData(e.currentTarget)
    const res = await fetch('/api/upload/thesis', { method: 'POST', body: form })
    const data = await res.json()
    setUploading(false)
    if (!res.ok) { setUploadError(data.error ?? 'Upload failed.'); return }
    router.push(`/thesis/${data.id}`)
  }

  return (
    <form
      action={isEdit ? editAction : undefined}
      onSubmit={!isEdit ? handleUploadSubmit : undefined}
      className="space-y-6"
    >
      {isEdit && <input type="hidden" name="thesisId" value={props.thesisId} />}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          type="text"
          required
          defaultValue={defaultValues?.title}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Abstract <span className="text-red-500">*</span>
        </label>
        <textarea
          name="abstract"
          rows={6}
          required
          defaultValue={defaultValues?.abstract}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
          <select
            name="fieldOfStudyId"
            defaultValue={defaultValues?.fieldOfStudyId ?? ''}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Select field —</option>
            {fields.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year of Submission <span className="text-red-500">*</span>
          </label>
          <input
            name="yearOfSubmission"
            type="number"
            min={1950}
            max={currentYear}
            required
            defaultValue={defaultValues?.yearOfSubmission ?? currentYear}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Institution <span className="text-red-500">*</span>
        </label>
        <input
          name="institution"
          type="text"
          required
          defaultValue={defaultValues?.institution}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
        <input
          name="keywords"
          type="text"
          placeholder="e.g. machine learning, NLP, healthcare"
          defaultValue={defaultValues?.keywords?.join(', ')}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-400 mt-1">Separate keywords with commas.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Name</label>
          <input
            name="supervisorName"
            type="text"
            defaultValue={defaultValues?.supervisorName ?? ''}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
          <select
            name="language"
            defaultValue={defaultValues?.language ?? 'English'}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {!isEdit && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PDF File <span className="text-red-500">*</span>
          </label>
          <input
            name="pdf"
            type="file"
            accept="application/pdf"
            required
            className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-400 mt-1">PDF only · max 50MB</p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-60"
      >
        {pending && <Loader2 size={15} className="animate-spin" />}
        {pending
          ? isEdit ? 'Saving…' : 'Uploading…'
          : isEdit ? 'Save changes' : 'Upload thesis'}
      </button>
    </form>
  )
}
