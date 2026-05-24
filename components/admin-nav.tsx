'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, UserCheck, BookOpen, GitBranch, Wallet, Link2 } from 'lucide-react'

const NAV = [
  { href: '/admin/users',     label: 'Users',     icon: Users },
  { href: '/admin/reviewers', label: 'Reviewers', icon: UserCheck },
  { href: '/admin/fields',    label: 'Fields',    icon: BookOpen },
  { href: '/admin/pipeline',  label: 'Pipeline',  icon: GitBranch },
  { href: '/admin/payouts',   label: 'Payouts',   icon: Wallet },
  { href: '/admin/invite',    label: 'Invite',    icon: Link2 },
]

export default function AdminNav() {
  const pathname = usePathname()
  return (
    <nav className="space-y-0.5">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              active
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Icon size={15} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
