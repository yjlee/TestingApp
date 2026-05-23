import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { db } from '@/lib/db'
import ProfileForm from '@/components/profile-form'

export default async function ProfileSetupPage() {
  const { userId } = await verifySession()

  const existing = await db.profile.findUnique({ where: { userId } })
  if (existing) redirect('/dashboard')

  const fields = await db.fieldOfStudy.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Set up your profile</h1>
      <p className="text-sm text-gray-500 mb-8">Tell the community a bit about yourself and your research.</p>
      <ProfileForm fields={fields} />
    </div>
  )
}
