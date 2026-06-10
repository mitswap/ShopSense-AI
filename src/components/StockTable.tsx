import { useState } from 'react'
import { useI18n } from '../lib/useI18n'
import { labelCategory, labelProduct, labelRisk } from '../lib/localeCopy'
import type { InventoryUpdateInput, Product, ProductForecast } from '../types'

interface StockTableProps {
  products: Product[]
  forecasts: ProductForecast[]
  onUpdateStock: (productId: string, update: InventoryUpdateInput) => void
}

const riskColor = {
  high: 'text-red-700 bg-red-50',
  medium: 'text-amber-700 bg-amber-50',
  low: 'text-emerald-700 bg-emerald-50',
}

export function StockTable({ products, forecasts, onUpdateStock }: StockTableProps) {
  const { ui, locale } = useI18n()
  const forecastMap = new Map(forecasts.map((f) => [f.productId, f]))
  const [editing, setEditing] = useState<string | null>(null)
  const [draftQty, setDraftQty] = useState<number>(0)
  const [draftPrice, setDraftPrice] = useState<number>(0)

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden text-left">
      <div className="px-4 py-2 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">{ui.stockTable}</h2>
      </div>
      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-medium">{ui.product}</th>
              <th className="px-3 py-2">{ui.category}</th>
              <th className="px-3 py-2">{ui.quantity}</th>
              <th className="px-3 py-2">{ui.unitCost}</th>
              <th className="px-3 py-2">{ui.unitPrice}</th>
              <th className="px-3 py-2">{ui.daysLeft}</th>
              <th className="px-3 py-2">{ui.reorder}</th>
              <th className="px-3 py-2">{ui.risk}</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const f = forecastMap.get(p.id)
              const isEdit = editing === p.id
              return (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {labelProduct(p.name, locale)}
                  </td>
                  <td className="px-3 py-2">{labelCategory(p.category, locale)}</td>
                  <td className="px-3 py-2">
                    {isEdit ? (
                      <input
                        type="number"
                        min={0}
                        value={draftQty}
                        onChange={(e) => setDraftQty(Number(e.target.value))}
                        className="w-16 border border-slate-300 rounded px-1 py-0.5"
                      />
                    ) : (
                      p.stockQty
                    )}
                  </td>
                  <td className="px-3 py-2">{Math.round(p.unitCost)}</td>
                  <td className="px-3 py-2">
                    {isEdit ? (
                      <input
                        type="number"
                        min={0}
                        value={draftPrice}
                        onChange={(e) => setDraftPrice(Number(e.target.value))}
                        className="w-20 border border-slate-300 rounded px-1 py-0.5"
                      />
                    ) : (
                      p.unitPrice
                    )}
                  </td>
                  <td className="px-3 py-2">{f?.daysUntilStockout ?? '—'}</td>
                  <td className="px-3 py-2 text-brand-700">{f?.suggestedReorder ?? 0}</td>
                  <td className="px-3 py-2">
                    {f && (
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${riskColor[f.risk]}`}
                      >
                        {labelRisk(f.risk, locale)}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {isEdit ? (
                      <button
                        type="button"
                        className="text-brand-600 font-medium"
                        onClick={() => {
                          onUpdateStock(p.id, { stockQty: draftQty, unitPrice: draftPrice })
                          setEditing(null)
                        }}
                      >
                        {ui.save}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="text-slate-600"
                        onClick={() => {
                          setEditing(p.id)
                          setDraftQty(p.stockQty)
                          setDraftPrice(p.unitPrice)
                        }}
                      >
                        {ui.editStock}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] font-medium text-slate-600">
        {locale === 'bn'
          ? 'স্টক কমালে সেটি বিক্রয় হিসেবে ধরা হবে, আর সেল প্রাইস বদলালে ভবিষ্যৎ লাইভ বিক্রয় সেই মূল্যে গণনা হবে।'
          : 'Reducing stock records a live sale, and updating sell price changes how future live sales are valued.'}
      </p>
    </div>
  )
}
