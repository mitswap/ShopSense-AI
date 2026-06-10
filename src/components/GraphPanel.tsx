import { useI18n } from '../lib/useI18n'
import { graphMeta, labelProduct } from '../lib/localeCopy'
import type { BusinessGraph } from '../types'

interface GraphPanelProps {
  graph: BusinessGraph
}

export function GraphPanel({ graph }: GraphPanelProps) {
  const { ui, locale } = useI18n()
  const products = graph.nodes.filter((n) => n.type === 'product').length
  const festivals = graph.nodes.filter((n) => n.type === 'festival').length
  const topBundle = graph.bundleSuggestions[0]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-left">
      <h3 className="text-sm font-semibold text-slate-900">{ui.productConnections}</h3>
      <p className="text-xs text-slate-500">
        {graphMeta(locale, products, festivals, graph.edges.length)}
      </p>
      <p className="mt-2 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-xs leading-relaxed text-slate-700">
        {topBundle
          ? locale === 'bn'
            ? `${labelProduct(topBundle.products[0], locale)} এবং ${labelProduct(topBundle.products[1], locale)} একসাথে বিক্রি হওয়ার ধরণ দেখাচ্ছে। এই গ্রাফটি বান্ডেল, ডিসপ্লে-প্লেসমেন্ট এবং ক্রস-সেল সুযোগ বুঝতে সাহায্য করে।`
            : `${labelProduct(topBundle.products[0], locale)} and ${labelProduct(topBundle.products[1], locale)} are appearing together as a recurring pattern. Use this graph to spot bundle, display-placement, and cross-sell opportunities.`
          : locale === 'bn'
            ? 'এই গ্রাফটি কোন পণ্য, ক্যাটাগরি এবং উৎসবের মধ্যে সংযোগ বেশি তা দেখায়, যাতে আপনি দ্রুত বান্ডেল ও মার্চেন্ডাইজিং সিদ্ধান্ত নিতে পারেন।'
            : 'This graph explains which products, categories, and festival signals connect most strongly so you can act on bundling and merchandising faster.'}
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
