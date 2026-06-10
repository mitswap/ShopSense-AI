import { slugify } from './canonical'
import type { Product, ShopData } from '../types'

export interface NewProductInput {
  name: string
  category: string
  stockQty: number
  unitCost: number
  unitPrice: number
  qtySold?: number
  firstStockDate?: string
}

export function addProductToShop(shop: ShopData, input: NewProductInput): ShopData {
  const sku = slugify(input.name)
  const id = `prod-${sku}`
  const today = new Date().toISOString().slice(0, 10)
  const saleStamp = Date.now()

  const existingIdx = shop.products.findIndex((p) => p.sku === sku)
  const existingProduct = existingIdx >= 0 ? shop.products[existingIdx] : null
  const firstStockDate =
    existingProduct && existingProduct.stockQty > 0
      ? existingProduct.firstStockDate
      : input.firstStockDate ?? today
  const product: Product = {
    id,
    sku,
    name: input.name,
    nameBn: input.name,
    category: input.category || 'General',
    stockQty:
      existingProduct && existingProduct.stockQty > 0
        ? Math.max(0, existingProduct.stockQty) + Math.max(0, input.stockQty)
        : Math.max(0, input.stockQty),
    unitCost: input.unitCost > 0 ? input.unitCost : existingProduct?.unitCost ?? 0,
    unitPrice: input.unitPrice > 0 ? input.unitPrice : existingProduct?.unitPrice ?? 0,
    firstStockDate,
  }

  const products =
    existingIdx >= 0
      ? shop.products.map((p, i) => (i === existingIdx ? { ...product } : p))
      : [...shop.products, product]

  const sales = [...shop.sales]
  const qty = input.qtySold ?? 0
  if (qty > 0) {
    const revenue = qty * input.unitPrice
    sales.push({
      id: `sale-${sku}-${today}-${saleStamp}`,
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
