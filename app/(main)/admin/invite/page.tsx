import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { db } from '@/lib/db'
import GenerateInviteButton from '@/components/generate-invite-button'

export default async function InvitePage() {
  const { role } = await verifySession()
  if (role !== 'admin') redirect('/')

  const links = await db.invitationLink.findMany({
    select: {
      id: true,
      token: true,
      isUsed: true,
      expiresAt: true,
      createdAt: true,
      creator: { select: { profile: { select: { fullName: true } } } },
      user: { select: { email: true, profile: { select: { fullName: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const now = new Date()

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Invite Links</h1>
          <p className="text-sm text-gray-400 mt-0.5">Links expire after 7 days</p>
        </div>
        <GenerateInviteButton />
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Token</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Used by</th>
              <th className="px-4 py-3 text-left">Expires</th>
              <th className="px-4 py-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {links.map((link) => {
              const isExpired = !link.isUsed && link.expiresAt < now
              return (
                <tr key={link.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    …{link.token.slice(-10)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        link.isUsed
                          ? 'bg-green-50 text-green-700'
                          : isExpired
                            ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {link.isUsed ? 'Used' : isExpired ? 'Expired' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {link.user ? (
                      <span>
                        {link.user.profile?.fullName ?? link.user.email}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(link.expiresAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(link.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {links.length === 0 && (
          <p className="text-center py-10 text-sm text-gray-400">No invite links yet.</p>
        )}
      </div>
    </div>
  )
}
