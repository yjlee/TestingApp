'use client'

import { useActionState } from 'react'
import { saveProfile } from '@/lib/profile/actions'

type Field = { id: string; name: string }
type ProfileData = {
  username?: string
  fullName?: string
  institution?: string
  fieldOfStudyId?: string | null
  academicLevel?: string
  graduationYear?: number | null
  bio?: string | null
  emailPublic?: boolean
  linkedinUrl?: string | null
  researchgateUrl?: string | null
  alipayAccountId?: string | null
}

export default function ProfileForm({ fields, profile }: { fields: Field[]; profile?: ProfileData }) {
  const [state, action, pending] = useActionState(saveProfile, undefined)

  return (
    <form action={action} className="space-y-6">
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input name="fullName" required defaultValue={profile?.fullName} className={input} placeholder="Jane Smith" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
          <div className="flex items-center rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent overflow-hidden">
            <span className="px-3 py-2.5 bg-gray-50 text-gray-500 text-sm border-r border-gray-300">/user/</span>
            <input name="username" required defaultValue={profile?.username} className="flex-1 px-3 py-2.5 text-sm outline-none" placeholder="janedoe" pattern="[a-z0-9_\-]{3,50}" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Institution / University *</label>
          <input name="institution" required defaultValue={profile?.institution} className={input} placeholder="University of Malaya" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
          <select name="fieldOfStudyId" defaultValue={profile?.fieldOfStudyId ?? ''} className={input}>
            <option value="">— Select a field —</option>
            {fields.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Academic Level *</label>
          <select name="academicLevel" required defaultValue={profile?.academicLevel ?? ''} className={input}>
            <option value="">— Select —</option>
            <option value="undergraduate">Undergraduate</option>
            <option value="postgraduate">Postgraduate</option>
            <option value="phd">PhD</option>
            <option value="professional">Professional</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
          <input name="graduationYear" type="number" min={1950} max={2100} defaultValue={profile?.graduationYear ?? ''} className={input} placeholder="2024" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Short Bio</label>
        <textarea name="bio" rows={3} defaultValue={profile?.bio ?? ''} className={input} placeholder="Tell the community about your research interests..." />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
          <input name="linkedinUrl" type="url" defaultValue={profile?.linkedinUrl ?? ''} className={input} placeholder="https://linkedin.com/in/..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ResearchGate URL</label>
          <input name="researchgateUrl" type="url" defaultValue={profile?.researchgateUrl ?? ''} className={input} placeholder="https://researchgate.net/profile/..." />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Alipay Account ID</label>
        <input name="alipayAccountId" defaultValue={profile?.alipayAccountId ?? ''} className={input} placeholder="Required if you plan to review theses and receive payouts" />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="emailPublic" name="emailPublic" defaultChecked={profile?.emailPublic} className="rounded border-gray-300 text-blue-700" />
        <label htmlFor="emailPublic" className="text-sm text-gray-700">Show my email address on my public profile</label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full sm:w-auto bg-blue-700 text-white px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  )
}

const input = 'w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
