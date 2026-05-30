import { Link } from 'react-router-dom'

export function DocsUnavailable({ message }: { message: string }) {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
      <div className="max-w-md text-center rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Documentation unavailable</h1>
        <p className="mt-3 text-sm text-slate-600">{message}</p>
        <Link to="/" className="inline-block mt-6 text-sm text-brand-600 hover:underline">
          ← Back to ShopSense AI
        </Link>
      </div>
    </div>
  )
}
