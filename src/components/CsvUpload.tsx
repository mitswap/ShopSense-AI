import { useRef, useState } from 'react'
import { Upload, Download, Database } from 'lucide-react'
import { useI18n } from '../lib/useI18n'
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
      <div className="flex h-full flex-col justify-end gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex w-full items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
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
      <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm text-left">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">{ui.csvImportTitle}</h2>
            <p className="mt-1 text-xs text-slate-500">{ui.csvImportHint}</p>
          </div>
        </div>

        <div className="mt-4 rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {busy ? ui.loading : hasExistingData ? ui.uploadAnotherCsv : ui.uploadCsv}
            </button>
            <a
              href="/sme_data.csv"
              download
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
            >
              <Download className="h-4 w-4" />
              {ui.downloadSample}
            </a>
          </div>
          <p className="mt-3 text-xs text-slate-500">{ui.csvFileSupport}</p>
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
          <ul className="mt-3 list-disc list-inside text-xs text-red-600">
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
