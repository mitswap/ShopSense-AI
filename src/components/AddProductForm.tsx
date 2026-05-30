import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import type { NewProductInput } from '../lib/addProduct'

interface AddProductFormProps {
  onAdd: (input: NewProductInput) => void
}

export function AddProductForm({ onAdd }: AddProductFormProps) {
  const { ui } = useI18n()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Casual')
  const [stockQty, setStockQty] = useState(20)
  const [unitCost, setUnitCost] = useState(500)
  const [unitPrice, setUnitPrice] = useState(800)
  const [qtySold, setQtySold] = useState(0)

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
    })
    setName('')
    setQtySold(0)
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        <Plus className="w-4 h-4" />
        {ui.addProduct}
      </button>
    )
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-slate-200 bg-slate-50 p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-left"
    >
      <label className="col-span-2">
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
        <span className="text-xs text-slate-500">{ui.addSaleQty}</span>
        <input
          type="number"
          min={0}
          value={qtySold}
          onChange={(e) => setQtySold(Number(e.target.value))}
          className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
        />
      </label>
      <div className="col-span-2 md:col-span-3 flex gap-2 items-end">
        <button
          type="submit"
          className="bg-brand-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg"
        >
          {ui.addProduct}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-slate-500 px-2"
        >
          {ui.cancel}
        </button>
      </div>
    </form>
  )
}
