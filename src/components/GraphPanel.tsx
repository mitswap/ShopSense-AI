import { useI18n } from '../lib/i18n'
import { graphMeta, labelProduct } from '../lib/localeCopy'
import type { BusinessGraph } from '../types'

interface GraphPanelProps {
  graph: BusinessGraph
}

export function GraphPanel({ graph }: GraphPanelProps) {
  const { ui, locale } = useI18n()
  const products = graph.nodes.filter((n) => n.type === 'product').length
  const festivals = graph.nodes.filter((n) => n.type === 'festival').length

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-left">
      <h3 className="text-sm font-semibold text-slate-900">{ui.productConnections}</h3>
      <p className="text-xs text-slate-500">
        {graphMeta(locale, products, festivals, graph.edges.length)}
      </p>
      {graph.bundleSuggestions.length > 0 && (
        <ul className="mt-2 space-y-1.5 text-xs">
          {graph.bundleSuggestions.slice(0, 3).map((b, i) => (
            <li key={i} className="p-2 rounded bg-slate-50 border border-slate-100">
              <span className="font-medium">
                {b.products.map((p) => labelProduct(p, locale)).join(' + ')}
              </span>
              <p className="text-slate-600 mt-0.5">{b.reasonBn}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
