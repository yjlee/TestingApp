import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import ReviewerRegisterForm from '@/components/reviewer-register-form'
import { redirect } from 'next/navigation'
import { XCircle } from 'lucide-react'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // Logged-in users don't need to register
  const session = await getSession()
  if (session?.userId) redirect('/dashboard')

  const invite = await db.invitationLink.findUnique({
    where: { token },
    select: { isUsed: true, expiresAt: true },
  })

  const isValid = invite && !invite.isUsed && invite.expiresAt >= new Date()

  if (!isValid) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <XCircle size={48} className="mx-auto text-red-400 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
        <p className="text-sm text-gray-500">
          This invitation link has expired or has already been used. Please request a new one.
        </p>
      </div>
    )
  }

  const fields = await db.fieldOfStudy.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Invitation</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Join as Expert Reviewer</h1>
        <p className="text-sm text-gray-500">
          You have been invited to review academic theses. Create your account below.
        </p>
      </div>
      <ReviewerRegisterForm token={token} fields={fields} />
    </div>
  )
}
