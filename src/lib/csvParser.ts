import Papa from 'papaparse'
import { z } from 'zod'
import type { Product, SaleRecord, ShopData } from '../types'

const rowSchema = z.object({
  sku: z.string().min(1),
  product_name: z.string().optional(),
  product_name_bn: z.string().optional(),
  name: z.string().optional(),
  category: z.string().default('সাধারণ'),
  stock_qty: z.coerce.number().nonnegative().optional(),
  quantity: z.coerce.number().nonnegative().optional(),
  unit_cost: z.coerce.number().nonnegative().default(0),
  sale_date: z.string().optional(),
  date: z.string().optional(),
  qty_sold: z.coerce.number().nonnegative().optional(),
  quantity_sold: z.coerce.number().nonnegative().optional(),
  unit_price: z.coerce.number().nonnegative().optional(),
})

export type ParseResult =
  | { ok: true; data: ShopData; errors: string[] }
  | { ok: false; data: null; errors: string[] }

function normalizeRow(raw: Record<string, string>): z.infer<typeof rowSchema> | null {
  const mapped: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) {
    mapped[k.trim().toLowerCase().replace(/\s+/g, '_')] = String(v ?? '').trim()
  }
  const parsed = rowSchema.safeParse(mapped)
  return parsed.success ? parsed.data : null
}

export function parseInventoryCsv(
  file: File,
  shopName = 'আমার পোশাক দোকান',
): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = []
        const productMap = new Map<string, Product>()
        const firstStockBySku = new Map<string, string>()
        const sales: SaleRecord[] = []
        let rowIndex = 0

        for (const raw of results.data) {
          rowIndex++
          const row = normalizeRow(raw)
          if (!row) {
            errors.push(`সারি ${rowIndex}: অবৈধ ডেটা`)
            continue
          }

          const sku = row.sku
          const name = row.product_name ?? row.name ?? sku
          const nameBn = row.product_name_bn ?? name
          const stock = row.stock_qty ?? row.quantity ?? 0
          const unitCost = row.unit_cost
          const saleDate = row.sale_date ?? row.date
          const qtySold = row.qty_sold ?? row.quantity_sold ?? 0
          const unitPrice = row.unit_price ?? unitCost
          const observedDate = saleDate ?? new Date().toISOString().slice(0, 10)

          if (observedDate) {
            const earliest = firstStockBySku.get(sku)
            if (!earliest || observedDate < earliest) {
              firstStockBySku.set(sku, observedDate)
            }
          }

          if (!productMap.has(sku)) {
            productMap.set(sku, {
              id: `prod-${sku}`,
              sku,
              name,
              nameBn,
              category: row.category,
              stockQty: stock,
              unitCost,
              unitPrice: unitPrice || unitCost,
              firstStockDate: firstStockBySku.get(sku) ?? observedDate,
            })
          } else {
            const p = productMap.get(sku)!
            if (stock > 0) p.stockQty = stock
            p.firstStockDate = firstStockBySku.get(sku) ?? p.firstStockDate
          }

          if (saleDate && qtySold > 0) {
            sales.push({
              id: `sale-${sku}-${saleDate}-${rowIndex}`,
              productId: `prod-${sku}`,
              sku,
              saleDate,
              qtySold,
              revenue: qtySold * unitPrice,
              unitPrice,
            })
          }
        }

        if (productMap.size === 0) {
          resolve({ ok: false, data: null, errors: ['কোনো বৈধ পণ্য পাওয়া যায়নি'] })
          return
        }

        const shopId = `shop-${Date.now()}`
        resolve({
          ok: true,
          errors,
          data: {
            shopId,
            shopName,
            products: Array.from(productMap.values()).map((product) => ({
              ...product,
              firstStockDate: firstStockBySku.get(product.sku) ?? product.firstStockDate,
            })),
            sales,
            updatedAt: new Date().toISOString(),
          },
        })
      },
      error: (err) => {
        resolve({ ok: false, data: null, errors: [err.message] })
      },
    })
  })
}
