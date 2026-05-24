import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function CheckoutSuccessPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Received</h1>
      <p className="text-sm text-gray-500 mb-8">
        Your thesis has been queued for expert review. You can track progress on the thesis page.
      </p>
      <Link
        href="/dashboard"
        className="inline-block bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
      >
        Go to dashboard
      </Link>
    </div>
  )
}
