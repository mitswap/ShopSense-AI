import { useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  Download,
  FileImage,
  ReceiptText,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react'
import { previewMemoImport, reconcileMemoLineItem } from '../lib/memoImport'
import { useI18n } from '../lib/useI18n'
import type { MemoExtractionResponse, MemoLineItem, Product } from '../types'

interface MemoImportCardProps {
  existingProducts?: Product[]
  onImport: (rows: MemoLineItem[]) => void | Promise<void>
  compact?: boolean
}

export function MemoImportCard({
  existingProducts = [],
  onImport,
  compact = false,
}: MemoImportCardProps) {
  const { ui } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [preview, setPreview] = useState<MemoExtractionResponse | null>(null)
  const [rows, setRows] = useState<MemoLineItem[]>([])

  const hasBlockingError = useMemo(
    () =>
      Boolean(preview?.warnings.some((warning) => warning.level === 'error')) ||
      rows.some((row) => Boolean(row.warnings?.some((warning) => warning.level === 'error'))),
    [preview, rows],
  )

  function clearPreview() {
    setPreview(null)
    setRows([])
    setFileName('')
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function updateRow(
    id: string,
    field: keyof Pick<
      MemoLineItem,
      'date' | 'product_name' | 'category' | 'quantity' | 'unit_cost' | 'supplier'
    >,
    value: string,
  ) {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row
        const nextRow: MemoLineItem = {
          ...row,
          [field]:
            field === 'quantity' || field === 'unit_cost'
              ? Math.max(0, Number(value) || 0)
              : value,
        }
        return reconcileMemoLineItem(nextRow, existingProducts)
      }),
    )
  }

  async function handleFile(file: File) {
    setBusy(true)
    setError(null)
    setSuccess(null)
    setFileName(file.name)

    try {
      const extracted = await previewMemoImport({ file, existingProducts })
      setPreview(extracted)
      setRows(extracted.rows)
      if (extracted.rows.length === 0) {
        setError(ui.memoNoRows)
      }
    } catch (err) {
      setPreview(null)
      setRows([])
      setError(err instanceof Error ? err.message : ui.memoPreviewFailed)
    } finally {
      setBusy(false)
    }
  }

  async function confirmImport() {
    if (rows.length === 0 || hasBlockingError) return
    setImporting(true)
    setError(null)

    try {
      const count = rows.length
      await onImport(rows)
      clearPreview()
      setSuccess(ui.memoImportedSuccess.replace('{count}', String(count)))
    } catch (err) {
      setError(err instanceof Error ? err.message : ui.memoImportFailed)
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <div
        className={`rounded-3xl border ${
          compact ? 'border-amber-100 bg-white p-5 shadow-sm' : 'border-slate-200 bg-white p-5 shadow-sm'
        } text-left`}
      >
        <div className="flex h-full flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <ReceiptText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{ui.memoImportTitle}</h3>
            <p className="mt-1 text-xs text-slate-500">{ui.memoImportHint}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-amber-100 bg-amber-50/70 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy || importing}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
            >
              {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {busy ? ui.loading : ui.memoUploadButton}
            </button>
            <a
              href="/Demo_image.jpg"
              download
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50"
            >
              <Download className="h-4 w-4" />
              Sample demo
            </a>
            <p className="text-xs text-slate-500">{ui.memoFileSupport}</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf,application/pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleFile(file)
            }}
          />
          {fileName ? (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
              <FileImage className="h-3.5 w-3.5 text-amber-600" />
              {fileName}
            </div>
          ) : null}
          {success ? (
            <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {success}
            </p>
          ) : null}
          {error ? <p className="mt-3 text-xs font-medium text-rose-600">{error}</p> : null}
        </div>
        </div>
      </div>

      {preview ? (
        <div className="xl:col-span-3 space-y-3 rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{ui.memoReviewTitle}</h3>
              <p className="mt-1 text-xs text-slate-500">{ui.memoReviewHint}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="space-y-1 text-xs text-slate-600">
                <p>
                  <span className="font-semibold text-slate-800">{ui.memoSupplierLabel}:</span>{' '}
                  {preview.header.supplier || ui.memoUnknownValue}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">{ui.memoDateLabel}:</span>{' '}
                  {preview.header.memoDate || ui.memoUnknownValue}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">{ui.memoNumberLabel}:</span>{' '}
                  {preview.header.memoNumber || ui.memoUnknownValue}
                </p>
              </div>
              <p className="text-right text-xs text-slate-500">
                {ui.memoPreviewMeta.replace('{count}', String(rows.length))}
              </p>
            </div>

            {preview.warnings.length > 0 ? (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800">
                  {ui.memoWarningsTitle}
                </p>
                <ul className="mt-2 space-y-1 text-xs text-amber-900">
                  {preview.warnings.map((warning, index) => (
                    <li key={`${warning.field}-${index}`}>{warning.message}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
              <div className="max-h-[420px] overflow-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-100 text-xs uppercase tracking-[0.14em] text-slate-500">
                    <tr>
                      <th className="px-3 py-3">{ui.memoColDate}</th>
                      <th className="px-3 py-3">{ui.memoColProduct}</th>
                      <th className="px-3 py-3">{ui.memoColCategory}</th>
                      <th className="px-3 py-3">{ui.memoColQuantity}</th>
                      <th className="px-3 py-3">{ui.memoColUnitCost}</th>
                      <th className="px-3 py-3">{ui.memoColSupplier}</th>
                      <th className="px-3 py-3">{ui.memoColMatch}</th>
                      <th className="px-3 py-3">{ui.memoColActions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-t border-slate-100 align-top">
                        <td className="px-3 py-3">
                          <input
                            type="date"
                            value={row.date}
                            onChange={(event) => updateRow(row.id, 'date', event.target.value)}
                            className="w-[132px] rounded-xl border border-slate-200 px-2 py-1.5 text-sm"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            value={row.product_name}
                            onChange={(event) => updateRow(row.id, 'product_name', event.target.value)}
                            className="min-w-[180px] rounded-xl border border-slate-200 px-2 py-1.5 text-sm"
                          />
                          {row.warnings?.length ? (
                            <div className="mt-2 space-y-1">
                              {row.warnings.map((warning, index) => (
                                <p
                                  key={`${row.id}-warning-${index}`}
                                  className={`text-[11px] ${
                                    warning.level === 'error' ? 'text-rose-600' : 'text-amber-700'
                                  }`}
                                >
                                  {warning.message}
                                </p>
                              ))}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-3 py-3">
                          <input
                            value={row.category}
                            onChange={(event) => updateRow(row.id, 'category', event.target.value)}
                            className="min-w-[132px] rounded-xl border border-slate-200 px-2 py-1.5 text-sm"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            min={0}
                            value={row.quantity}
                            onChange={(event) => updateRow(row.id, 'quantity', event.target.value)}
                            className="w-[92px] rounded-xl border border-slate-200 px-2 py-1.5 text-sm"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            min={0}
                            value={row.unit_cost}
                            onChange={(event) => updateRow(row.id, 'unit_cost', event.target.value)}
                            className="w-[110px] rounded-xl border border-slate-200 px-2 py-1.5 text-sm"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            value={row.supplier ?? ''}
                            onChange={(event) => updateRow(row.id, 'supplier', event.target.value)}
                            className="min-w-[148px] rounded-xl border border-slate-200 px-2 py-1.5 text-sm"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              row.isNewProduct
                                ? 'bg-sky-50 text-sky-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {row.isNewProduct ? ui.memoMatchNew : ui.memoMatchExisting}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
                            className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {ui.memoRemoveRow}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">{ui.memoConfirmHint}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={clearPreview}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  {ui.memoStartOver}
                </button>
                <button
                  type="button"
                  onClick={() => void confirmImport()}
                  disabled={importing || rows.length === 0 || hasBlockingError}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {importing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {importing ? ui.loading : ui.memoConfirmImport}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
