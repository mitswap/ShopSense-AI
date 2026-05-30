import { slugify } from './canonical'
import type { Product, ShopData } from '../types'

export interface NewProductInput {
  name: string
  category: string
  stockQty: number
  unitCost: number
  unitPrice: number
  qtySold?: number
}

export function addProductToShop(shop: ShopData, input: NewProductInput): ShopData {
  const sku = slugify(input.name)
  const id = `prod-${sku}`
  const today = new Date().toISOString().slice(0, 10)

  const existingIdx = shop.products.findIndex((p) => p.sku === sku)
  const product: Product = {
    id,
    sku,
    name: input.name,
    nameBn: input.name,
    category: input.category || 'General',
    stockQty: input.stockQty,
    unitCost: input.unitCost,
    unitPrice: input.unitPrice,
  }

  const products =
    existingIdx >= 0
      ? shop.products.map((p, i) => (i === existingIdx ? { ...product } : p))
      : [...shop.products, product]

  let sales = [...shop.sales]
  const qty = input.qtySold ?? 0
  if (qty > 0) {
    const revenue = qty * input.unitPrice
    sales.push({
      id: `sale-${sku}-${today}-manual`,
      productId: id,
      sku,
      saleDate: today,
      qtySold: qty,
      revenue,
      unitPrice: input.unitPrice,
    })
  }

  return {
    ...shop,
    products,
    sales,
    updatedAt: new Date().toISOString(),
  }
}
