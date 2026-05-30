import type { DecisionFeedItem } from '../types'

interface DecisionFeedProps {
  items: DecisionFeedItem[]
}

export function DecisionFeed({ items }: DecisionFeedProps) {
  if (items.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm text-left overflow-hidden">
      <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
        <h2 className="text-sm font-semibold text-slate-900">What to do next</h2>
      </div>
      <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
        {items.map((item) => (
          <li key={item.id} className="px-4 py-2.5 text-sm">
            <p className="font-medium text-slate-900">{item.titleBn}</p>
            <p className="text-slate-600 mt-0.5">{item.bodyBn}</p>
            {item.actionBn && <p className="text-brand-700 text-xs mt-1">{item.actionBn}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}
