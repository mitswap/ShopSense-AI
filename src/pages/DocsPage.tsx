import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Download, Search, Settings } from 'lucide-react'
import { fetchDocsAccess, fetchDocsContent, fetchDocsLive, exportMarkdownUrl } from '../lib/docsApi'
import type { DocsContent, DocsLiveSnapshot } from '../lib/docsTypes'
import { DocsUnavailable } from './DocsUnavailable'
import { TeamGrid } from '../components/docs/TeamGrid'
import { MermaidBlock } from '../components/docs/MermaidBlock'

const SECTIONS = [
  { id: 'pitch-problem', label: 'Problem' },
  { id: 'pitch-solution', label: 'Solution' },
  { id: 'pitch-why', label: 'Why Now' },
  { id: 'pitch-demo', label: 'Demo' },
  { id: 'pitch-market', label: 'Market' },
  { id: 'pitch-model', label: 'Business Model' },
  { id: 'pitch-traction', label: 'Traction' },
  { id: 'pitch-competition', label: 'Competition' },
  { id: 'pitch-advantage', label: 'Advantage' },
  { id: 'pitch-gtm', label: 'Go-To-Market' },
  { id: 'team', label: 'Team' },
  { id: 'pitch-vision', label: 'Vision' },
  { id: 'product', label: 'Product' },
  { id: 'features', label: 'Features' },
  { id: 'live', label: 'Live Status' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'dataflow', label: 'Data Flow' },
  { id: 'stack', label: 'Tech Stack' },
  { id: 'apis', label: 'APIs' },
  { id: 'data', label: 'Data Layer' },
  { id: 'ai', label: 'AI Layer' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'performance', label: 'Performance' },
  { id: 'security', label: 'Security' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'changelog', label: 'Changelog' },
]

function PitchBlock({ title, body, id }: { id: string; title: string; body: string }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-slate-700 leading-relaxed">{body}</p>
    </section>
  )
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    live: 'bg-emerald-100 text-emerald-800',
    beta: 'bg-amber-100 text-amber-800',
    planned: 'bg-slate-100 text-slate-600',
    deprecated: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`text-[10px] uppercase font-medium px-2 py-0.5 rounded-full ${colors[status] ?? colors.planned}`}>
      {status}
    </span>
  )
}

export function DocsPage() {
  const [loading, setLoading] = useState(true)
  const [available, setAvailable] = useState(false)
  const [blockMessage, setBlockMessage] = useState('')
  const [content, setContent] = useState<DocsContent | null>(null)
  const [live, setLive] = useState<DocsLiveSnapshot | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    void (async () => {
      const access = await fetchDocsAccess()
      setAvailable(access.available)
      setBlockMessage(access.message)
      if (!access.available) {
        setLoading(false)
        return
      }
      const data = await fetchDocsContent()
      if ('content' in data) setContent(data.content)
      const snap = await fetchDocsLive()
      setLive(snap)
      setLoading(false)
    })()
  }, [])

  const filteredSections = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return SECTIONS
    return SECTIONS.filter((s) => s.label.toLowerCase().includes(q))
  }, [search])

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-white text-slate-500 text-sm">Loading documentation…</div>
    )
  }

  if (!available) return <DocsUnavailable message={blockMessage} />

  if (!content) {
    return <DocsUnavailable message="Documentation content is not published yet." />
  }

  const p = content.pitch

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-600" />
            <div>
              <h1 className="text-sm font-bold text-slate-900">{content.meta.title}</h1>
              <p className="text-[11px] text-slate-500">{content.meta.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sections…"
                className="pl-7 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg w-40 sm:w-52"
              />
            </div>
            <a
              href={exportMarkdownUrl()}
              className="inline-flex items-center gap-1 text-xs border border-slate-300 rounded-lg px-2 py-1.5 hover:bg-slate-50"
            >
              <Download className="w-3.5 h-3.5" /> MD
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 hover:bg-slate-50"
            >
              PDF
            </button>
            <Link to="/docs/admin" className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline">
              <Settings className="w-3.5 h-3.5" /> Admin
            </Link>
            <Link to="/" className="text-xs text-slate-500 hover:text-brand-600">
              App →
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        <nav className="lg:w-48 shrink-0 lg:sticky lg:top-20 lg:self-start max-h-[70vh] overflow-y-auto">
          <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium mb-2">Contents</p>
          <ul className="space-y-1">
            {filteredSections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-xs text-slate-600 hover:text-brand-600 block py-0.5">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-1 min-w-0 space-y-10 print:max-w-none">
          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white p-8 shadow-lg">
            <p className="text-xs uppercase tracking-widest opacity-80">YC-Style Pitch Deck</p>
            <h2 className="text-3xl font-bold mt-2">{content.meta.title}</h2>
            <p className="mt-2 text-brand-100 text-lg">{content.meta.tagline}</p>
            <p className="mt-4 text-sm opacity-90">v{content.meta.version} · Updated {new Date(content.meta.updatedAt).toLocaleDateString()}</p>
          </div>

          <div className="space-y-8 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 border-b pb-2">Pitch</h2>
            <PitchBlock id="pitch-problem" title="Problem" body={p.problem} />
            <PitchBlock id="pitch-solution" title="Solution" body={p.solution} />
            <PitchBlock id="pitch-why" title="Why Now" body={p.whyNow} />
            <PitchBlock id="pitch-demo" title="Product Demo" body={p.demo} />
            <PitchBlock id="pitch-market" title="Market Opportunity" body={p.market} />
            <PitchBlock id="pitch-model" title="Business Model" body={p.businessModel} />
            <PitchBlock id="pitch-traction" title="Traction" body={p.traction} />
            <PitchBlock id="pitch-competition" title="Competition" body={p.competition} />
            <PitchBlock id="pitch-advantage" title="Unique Advantage" body={p.advantage} />
            <PitchBlock id="pitch-gtm" title="Go-To-Market" body={p.gtm} />
          </div>

          <section id="team" className="scroll-mt-24 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Team</h2>
            <TeamGrid teamName={content.team.teamName} members={content.team.members} />
          </section>

          <PitchBlock id="pitch-vision" title="Vision" body={p.vision} />

          <section id="product" className="scroll-mt-24 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Product Overview</h2>
            <p className="mt-3 text-slate-700">{content.product.summary}</p>
            <h3 className="mt-4 font-medium text-slate-800">Target users</h3>
            <ul className="list-disc pl-5 text-sm text-slate-600 mt-1">
              {content.product.users.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
            <h3 className="mt-4 font-medium text-slate-800">Core use cases</h3>
            <ul className="list-disc pl-5 text-sm text-slate-600 mt-1">
              {content.product.useCases.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          </section>

          <section id="features" className="scroll-mt-24 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Feature Matrix</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="py-2">Feature</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {content.features.map((f) => {
                    const liveStatus = live?.features.find((lf) => lf.id === f.id)?.status ?? f.status
                    return (
                      <tr key={f.id} className="border-b border-slate-100">
                        <td className="py-2 font-medium">{f.name}</td>
                        <td className="py-2">{statusBadge(liveStatus)}</td>
                        <td className="py-2 text-slate-600">{f.description}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section id="live" className="scroll-mt-24 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Live System Status</h2>
            <p className="text-xs text-slate-500 mb-3">Synced from /api/docs/live · {live?.timestamp && new Date(live.timestamp).toLocaleString()}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {live &&
                Object.entries(live.layers).map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-slate-100 px-3 py-2 text-xs">
                    <span className="text-slate-500">{k}</span>
                    <p className="font-medium text-slate-800">{String(v)}</p>
                  </div>
                ))}
            </div>
          </section>

          <section id="architecture" className="scroll-mt-24 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Architecture</h2>
            <MermaidBlock chart={content.architectureMermaid} />
          </section>

          <section id="dataflow" className="scroll-mt-24 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Data Flow</h2>
            <MermaidBlock chart={content.dataFlowMermaid} />
          </section>

          <section id="stack" className="scroll-mt-24 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Technology Stack</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {Object.entries(content.stack).map(([k, items]) => (
                <div key={k}>
                  <h3 className="text-sm font-medium capitalize text-slate-800">{k}</h3>
                  <ul className="mt-1 text-sm text-slate-600 list-disc pl-4">
                    {items.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section id="apis" className="scroll-mt-24 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">API Documentation</h2>
            <h3 className="text-sm font-medium text-slate-700">Exposed endpoints</h3>
            <table className="w-full text-xs mt-2">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-1">Method</th>
                  <th>Path</th>
                  <th>Auth</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {content.apis.exposed.map((a) => (
                  <tr key={a.path + a.method} className="border-b border-slate-50">
                    <td className="py-1.5 font-mono">{a.method}</td>
                    <td className="py-1.5 font-mono text-brand-700">{a.path}</td>
                    <td className="py-1.5">{a.auth}</td>
                    <td className="py-1.5 text-slate-600">{a.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3 className="text-sm font-medium text-slate-700 mt-6">External APIs</h3>
            <ul className="text-sm text-slate-600 mt-2 space-y-1">
              {content.apis.external.map((e) => (
                <li key={e.name}>
                  <strong>{e.name}</strong> — {e.use}
                </li>
              ))}
            </ul>
          </section>

          <section id="data" className="scroll-mt-24 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Data Layer</h2>
            {Object.entries(content.dataLayer).map(([k, v]) => (
              <div key={k} className="mt-3">
                <h3 className="text-sm font-medium capitalize">{k.replace(/([A-Z])/g, ' $1')}</h3>
                <p className="text-sm text-slate-600 mt-1">{Array.isArray(v) ? v.join(', ') : v}</p>
              </div>
            ))}
          </section>

          <section id="ai" className="scroll-mt-24 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">AI Layer</h2>
            {Object.entries(content.aiLayer).map(([k, v]) => (
              <div key={k} className="mt-3">
                <h3 className="text-sm font-medium capitalize">{k}</h3>
                <p className="text-sm text-slate-600 mt-1">{Array.isArray(v) ? v.join(', ') : v}</p>
              </div>
            ))}
          </section>

          <section id="roadmap" className="scroll-mt-24 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Roadmap</h2>
            {(['short', 'mid', 'long'] as const).map((horizon) => (
              <div key={horizon} className="mt-4">
                <h3 className="text-sm font-medium capitalize">{horizon} term</h3>
                <ul className="list-disc pl-5 text-sm text-slate-600 mt-1">
                  {content.roadmap[horizon].map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <section id="performance" className="scroll-mt-24 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Performance & Scalability</h2>
            {Object.entries(content.performance).map(([k, v]) => (
              <p key={k} className="text-sm text-slate-700 mt-2">
                <strong className="capitalize">{k}:</strong> {v}
              </p>
            ))}
          </section>

          <section id="security" className="scroll-mt-24 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Security</h2>
            {Object.entries(content.security).map(([k, v]) => (
              <p key={k} className="text-sm text-slate-700 mt-2">
                <strong className="capitalize">{k}:</strong> {v}
              </p>
            ))}
          </section>

          <section id="analytics" className="scroll-mt-24 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Analytics KPIs</h2>
            <ul className="list-disc pl-5 text-sm text-slate-600">
              {(content.analytics.kpis as string[]).map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
          </section>

          <section id="changelog" className="scroll-mt-24 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Changelog</h2>
            <ul className="space-y-2">
              {content.changelog.map((c) => (
                <li key={c.version} className="text-sm border-l-2 border-brand-200 pl-3">
                  <span className="font-mono text-brand-700">v{c.version}</span>
                  <span className="text-slate-400 ml-2">{c.date}</span>
                  <p className="text-slate-600 mt-0.5">{c.notes}</p>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>

      <footer className="border-t border-slate-200 py-4 text-center text-[10px] text-slate-400">
        ShopSense AI · BuildFest 2026 · Live documentation
      </footer>
    </div>
  )
}
