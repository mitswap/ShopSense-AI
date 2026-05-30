import type { ColumnMapping, SchemaDetectionResult } from '../types'

interface SchemaMappingPanelProps {
  schema: SchemaDetectionResult
  mappings: ColumnMapping[]
  onMappingsChange: (m: ColumnMapping[]) => void
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

export function SchemaMappingPanel({
  schema,
  mappings,
  onConfirm,
  onCancel,
  loading,
}: SchemaMappingPanelProps) {
  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-4 text-left text-sm">
      <h3 className="font-semibold text-slate-900">
        Column mapping ({schema.method === 'llm' ? 'AI' : 'auto'})
      </h3>
      <ul className="mt-2 space-y-1">
        {mappings.map((m) => (
          <li key={m.sourceColumn} className="flex justify-between bg-white rounded px-2 py-1 text-xs">
            <span className="font-mono">{m.sourceColumn}</span>
            <span className="text-brand-700">{m.canonicalField}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="bg-brand-600 text-white text-sm px-3 py-1.5 rounded-lg disabled:opacity-50"
        >
          Confirm & load
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-slate-600">
          Cancel
        </button>
      </div>
    </div>
  )
}
