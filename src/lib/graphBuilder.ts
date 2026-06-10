import type { Locale } from './i18n-types'
import { graphBundleReason, labelCategory, labelFestival, labelProduct } from './localeCopy'
import type { BusinessGraph, GraphEdge, GraphNode, ShopData } from '../types'

export function buildBusinessGraph(shop: ShopData, locale: Locale = 'en'): BusinessGraph {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const nodeIds = new Set<string>()

  function addNode(n: GraphNode) {
    if (!nodeIds.has(n.id)) {
      nodeIds.add(n.id)
      nodes.push(n)
    }
  }

  for (const p of shop.products) {
    addNode({ id: `product:${p.sku}`, type: 'product', label: labelProduct(p.name, locale) })
    addNode({
      id: `cat:${p.category}`,
      type: 'category',
      label: labelCategory(p.category, locale),
    })
    edges.push({
      from: `product:${p.sku}`,
      to: `cat:${p.category}`,
      relation: 'belongs_to',
      weight: 1,
    })
  }

  const festivalRev = new Map<string, number>()
  const locRev = new Map<string, number>()
  const seasonRev = new Map<string, number>()

  for (const s of shop.sales) {
    if (s.festival && s.festival !== 'None') {
      const f = s.festival
      addNode({ id: `fest:${f}`, type: 'festival', label: labelFestival(f, locale) })
      festivalRev.set(f, (festivalRev.get(f) ?? 0) + s.revenue)
      edges.push({
        from: `product:${s.sku}`,
        to: `fest:${f}`,
        relation: 'sold_during',
        weight: s.revenue,
      })
    }
    if (s.location) {
      addNode({ id: `loc:${s.location}`, type: 'location', label: s.location })
      locRev.set(s.location, (locRev.get(s.location) ?? 0) + s.revenue)
      edges.push({
        from: `loc:${s.location}`,
        to: `product:${s.sku}`,
        relation: 'sells',
        weight: s.revenue,
      })
    }
    if (s.season) {
      addNode({ id: `season:${s.season}`, type: 'season', label: s.season })
      seasonRev.set(s.season, (seasonRev.get(s.season) ?? 0) + s.revenue)
    }
  }

  const dayProduct = new Map<string, Map<string, number>>()
  for (const s of shop.sales) {
    const day = s.saleDate
    if (!dayProduct.has(day)) dayProduct.set(day, new Map())
    const m = dayProduct.get(day)!
    m.set(s.sku, (m.get(s.sku) ?? 0) + s.qtySold)
  }

  const pairCount = new Map<string, number>()
  for (const m of dayProduct.values()) {
    const skus = [...m.keys()].filter((k) => (m.get(k) ?? 0) > 0)
    for (let i = 0; i < skus.length; i++) {
      for (let j = i + 1; j < skus.length; j++) {
        const key = [skus[i], skus[j]].sort().join('|')
        pairCount.set(key, (pairCount.get(key) ?? 0) + 1)
      }
    }
  }

  const bundleSuggestions = [...pairCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => {
      const [a, b] = key.split('|')
      const nameA = shop.products.find((p) => p.sku === a)?.name ?? a
      const nameB = shop.products.find((p) => p.sku === b)?.name ?? b
      return {
        products: [nameA, nameB],
        reasonBn: graphBundleReason(locale, count),
      }
    })

  return { nodes, edges, bundleSuggestions }
}

export function graphContextForPrompt(graph: BusinessGraph): string {
  const bundles = graph.bundleSuggestions
    .slice(0, 3)
    .map((b) => `- ${b.products.join(' + ')}: ${b.reasonBn}`)
    .join('\n')
  return `Graph intelligence:\n${bundles || 'No bundle patterns yet'}`
}
