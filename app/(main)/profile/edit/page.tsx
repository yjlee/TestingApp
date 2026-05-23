import { verifySession } from '@/lib/dal'
import { db } from '@/lib/db'
import ProfileForm from '@/components/profile-form'
import PhotoUpload from '@/components/photo-upload'

export default async function ProfileEditPage() {
  const { userId } = await verifySession()

  const [profile, fields] = await Promise.all([
    db.profile.findUnique({ where: { userId } }),
    db.fieldOfStudy.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit profile</h1>

      <section className="mb-10">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Profile photo</h2>
        <PhotoUpload currentPhotoUrl={profile?.profilePhotoUrl ?? null} />
      </section>

      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Personal details</h2>
        <ProfileForm fields={fields} profile={profile ?? undefined} />
      </section>
    </div>
  )
}
