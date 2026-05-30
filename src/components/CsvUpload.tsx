import { useRef, useState } from 'react'
import { Upload, Download } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { detectSchemaFromFile, ingestCsvFile } from '../lib/ingestPipeline'
import { SchemaMappingPanel } from './SchemaMappingPanel'
import type { ColumnMapping, ShopData, SchemaDetectionResult } from '../types'

interface CsvUploadProps {
  onLoaded: (data: ShopData, merge?: boolean) => void
  hasExistingData?: boolean
}

export function CsvUpload({ onLoaded, hasExistingData = false }: CsvUploadProps) {
  const { ui } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [schema, setSchema] = useState<SchemaDetectionResult | null>(null)
  const [mappings, setMappings] = useState<ColumnMapping[]>([])

  async function processFile(file: File, confirmed?: ColumnMapping[]) {
    setBusy(true)
    setErrors([])
    const result = await ingestCsvFile(file, 'ShopSense AI', confirmed)
    setBusy(false)
    if (!result.ok || !result.data) {
      setErrors(result.errors)
      return
    }
    if (result.errors.length) setErrors(result.errors)
    setPendingFile(null)
    setSchema(null)
    onLoaded(result.data, true)
  }

  async function onSelectFile(file: File) {
    setBusy(true)
    setPendingFile(file)
    const detected = await detectSchemaFromFile(file)
    setBusy(false)
    if (detected.mappings.length > 0) {
      setSchema(detected)
      setMappings(detected.mappings)
    } else {
      void processFile(file)
    }
  }

  if (hasExistingData) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="text-brand-600 hover:underline text-xs disabled:opacity-50"
        >
          {busy ? ui.loading : ui.uploadAnotherCsv}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void onSelectFile(f)
          }}
        />
        {pendingFile && schema && (
          <SchemaMappingPanel
            schema={schema}
            mappings={mappings}
            onMappingsChange={setMappings}
            onConfirm={() => void processFile(pendingFile, mappings)}
            onCancel={() => {
              setPendingFile(null)
              setSchema(null)
            }}
            loading={busy}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm text-left">
        <h2 className="text-base font-semibold text-slate-900">{ui.uploadCsv}</h2>
        <p className="text-xs text-slate-500 mt-1">{ui.uploadHint}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {busy ? ui.loading : hasExistingData ? ui.uploadAnotherCsv : ui.uploadCsv}
          </button>
          <a
            href="/sme_data.csv"
            download
            className="inline-flex items-center gap-2 border border-slate-300 text-sm px-3 py-2 rounded-lg"
          >
            <Download className="w-4 h-4" />
            {ui.downloadSample}
          </a>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void onSelectFile(f)
          }}
        />
        {errors.length > 0 && (
          <ul className="mt-2 text-xs text-red-600 list-disc list-inside">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
      </div>
      {pendingFile && schema && (
        <SchemaMappingPanel
          schema={schema}
          mappings={mappings}
          onMappingsChange={setMappings}
          onConfirm={() => void processFile(pendingFile, mappings)}
          onCancel={() => {
            setPendingFile(null)
            setSchema(null)
          }}
          loading={busy}
        />
      )}
    </div>
  )
}
