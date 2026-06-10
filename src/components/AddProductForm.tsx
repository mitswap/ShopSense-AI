import { useState } from 'react'
import { PackagePlus, Plus } from 'lucide-react'
import { useI18n } from '../lib/useI18n'
import type { NewProductInput } from '../lib/addProduct'

interface AddProductFormProps {
  onAdd: (input: NewProductInput) => void
  embedded?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddProductForm({
  onAdd,
  embedded = false,
  open: controlledOpen,
  onOpenChange,
}: AddProductFormProps) {
  const { ui } = useI18n()
  const [internalOpen, setInternalOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Casual')
  const [stockQty, setStockQty] = useState(20)
  const [unitCost, setUnitCost] = useState(500)
  const [unitPrice, setUnitPrice] = useState(800)
  const [qtySold, setQtySold] = useState(0)
  const [firstStockDate, setFirstStockDate] = useState(() => new Date().toISOString().slice(0, 10))
  const open = controlledOpen ?? internalOpen

  function setOpen(next: boolean) {
    if (controlledOpen === undefined) setInternalOpen(next)
    onOpenChange?.(next)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({
      name: name.trim(),
      category: category.trim(),
      stockQty,
      unitCost,
      unitPrice,
      qtySold: qtySold > 0 ? qtySold : undefined,
      firstStockDate,
    })
    setName('')
    setQtySold(0)
    setFirstStockDate(new Date().toISOString().slice(0, 10))
    if (!embedded) setOpen(false)
  }

  if (!open && !embedded) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          <Plus className="h-4 w-4" />
          {ui.addProduct}
        </button>
        <p className="mt-3 text-xs text-slate-500">{ui.startFromScratchButtonHint}</p>
      </div>
    )
  }

  return (
    <div className={`h-full rounded-3xl border ${embedded ? 'border-emerald-100 bg-white shadow-sm p-4' : 'border-sky-100 bg-white p-5 shadow-sm'} text-left`}>
      <div className="mb-4 flex items-start gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${embedded ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
          <PackagePlus className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900">{ui.addProduct}</h3>
          <p className="text-xs text-slate-500">
            {embedded
              ? 'Add stock, price, and optional sold units from one compact card.'
              : 'Create a product and optionally record today\'s sold quantity.'}
          </p>
        </div>
      </div>
      <div className={embedded ? '' : 'rounded-3xl border border-sky-100 bg-sky-50/70 p-4'}>
        <form
          onSubmit={submit}
          className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-3"
        >
          <label className="col-span-2 xl:col-span-3">
            <span className="text-xs text-slate-500">{ui.productName}</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
              placeholder="e.g. Polo Shirt"
            />
          </label>
          <label>
            <span className="text-xs text-slate-500">{ui.category}</span>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
          <label>
            <span className="text-xs text-slate-500">{ui.quantity}</span>
            <input
              type="number"
              min={0}
              value={stockQty}
              onChange={(e) => setStockQty(Number(e.target.value))}
              className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
          <label>
            <span className="text-xs text-slate-500">{ui.unitCost}</span>
            <input
              type="number"
              min={0}
              value={unitCost}
              onChange={(e) => setUnitCost(Number(e.target.value))}
              className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
          <label>
            <span className="text-xs text-slate-500">{ui.unitPrice}</span>
            <input
              type="number"
              min={0}
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
              className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
          <label>
            <span className="text-xs text-slate-500">{ui.firstStockDate}</span>
            <input
              type="date"
              value={firstStockDate}
              onChange={(e) => setFirstStockDate(e.target.value)}
              className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
          <label className="col-span-2 xl:col-span-1">
            <span className="text-xs text-slate-500">{ui.addSaleQty}</span>
            <input
              type="number"
              min={0}
              value={qtySold}
              onChange={(e) => setQtySold(Number(e.target.value))}
              className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
          <div className="col-span-2 xl:col-span-3 flex flex-wrap gap-2 items-end pt-1">
            <button
              type="submit"
              className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${embedded ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'}`}
            >
              {ui.addProduct}
            </button>
            {!embedded && (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-2 text-sm text-slate-500"
              >
                {ui.cancel}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
