import { useState } from 'react'
import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react'
import { fetchSystemStatus, type LayerStatus } from '../lib/systemStatus'
import { seedVectorKnowledge } from '../lib/rag'
import { useI18n } from '../lib/useI18n'

const LAYER_ORDER = [
  'frontend',
  'csvPipeline',
  'schemaAI',
  'analytics',
  'forecasting',
  'graph',
  'supabase',
  'vectorDb',
  'rag',
  'openrouter',
]

export function TechStackPanel() {
  const { ui } = useI18n()
  const [layers, setLayers] = useState<Record<string, LayerStatus> | null>(null)
  const [_apiOnline, setApiOnline] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    setRefreshing(true)
    const status = await fetchSystemStatus()
    if (status?.layers) {
      setLayers(status.layers)
      setApiOnline(true)
    } else {
      setApiOnline(false)
      setLayers(null)
    }
    setRefreshing(false)
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-600">{ui.systemStatus}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="text-xs text-brand-600 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            {refreshing ? ui.loading : ui.refresh}
          </button>
          <button
            type="button"
            disabled={seeding}
            onClick={async () => {
              setSeeding(true)
              try {
                await seedVectorKnowledge()
                await load()
              } catch {
                /* ignore */
              }
              setSeeding(false)
            }}
            className="text-xs bg-violet-600 text-white px-2 py-0.5 rounded disabled:opacity-50"
          >
            {seeding ? '...' : ui.seedRag}
          </button>
        </div>
      </div>
      {layers && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {LAYER_ORDER.filter((key) => layers[key]).map((key) => {
            const layer = layers[key]
            return (
              <span
                key={key}
                className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${
                  layer.ready ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-700'
                }`}
              >
                {layer.ready ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                {layer.label.split(' ')[0]}
              </span>
            )
          })}
        </div>
      )}
      {!layers && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => void load()}
            className="text-xs text-brand-600 underline underline-offset-2"
          >
            {refreshing ? ui.loading : ui.refresh}
          </button>
        </div>
      )}
    </div>
  )
}
