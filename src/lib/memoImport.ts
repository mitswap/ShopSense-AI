import { apiFetch } from './apiClient'
import { slugify } from './canonical'
import type {
  MemoExtractionResponse,
  MemoLineItem,
  Product,
  ShopData,
} from '../types'

interface MemoPreviewRequest {
  file: File
  existingProducts: Product[]
}

function createBaseShop(userId: string): ShopData {
  return {
    shopId: `shop-${userId}`,
    shopName: 'ShopSense AI',
    products: [],
    sales: [],
    updatedAt: new Date().toISOString(),
    rowCount: 0,
  }
}

function normalizeProductName(value: string): string {
  return value.trim().toLowerCase()
}

function resolveExistingProduct(
  row: Pick<MemoLineItem, 'matchedSku' | 'product_name'>,
  existingProducts: Product[],
): Product | null {
  if (row.matchedSku) {
    const matched = existingProducts.find((product) => product.sku === row.matchedSku)
    if (matched) return matched
  }

  const normalizedName = normalizeProductName(row.product_name)
  const normalizedSku = slugify(row.product_name)
  return (
    existingProducts.find(
      (product) =>
        normalizeProductName(product.name) === normalizedName || product.sku === normalizedSku,
    ) ?? null
  )
}

export function reconcileMemoLineItem(
  row: MemoLineItem,
  existingProducts: Product[],
): MemoLineItem {
  const productName = row.product_name.trim()
  const matched = resolveExistingProduct({ ...row, product_name: productName }, existingProducts)
  const warnings = (row.warnings ?? []).filter((warning) => {
    if (!warning.message) return false
    if (!matched) return true
    return warning.message !== 'This product will be created as a new inventory row if confirmed.'
  })

  return {
    ...row,
    product_name: productName,
    category: row.category.trim() || matched?.category || 'General',
    supplier: row.supplier?.trim() || '',
    matchedSku: matched?.sku ?? null,
    isNewProduct: !matched,
    warnings,
  }
}

export function applyMemoImportToShop(
  existingShop: ShopData | null,
  userId: string,
  rows: MemoLineItem[],
): ShopData {
  const baseShop = existingShop ?? createBaseShop(userId)
  const products = [...baseShop.products]
  const sanitizedRows = rows
    .map((row) => reconcileMemoLineItem(row, products))
    .filter((row) => row.product_name.trim() && row.quantity > 0)

  sanitizedRows.forEach((row) => {
    const matched = resolveExistingProduct(row, products)
    const normalizedDate = row.date || new Date().toISOString().slice(0, 10)

    if (matched) {
      const previousStock = Math.max(0, matched.stockQty)
      const nextFirstStockDate =
        previousStock > 0
          ? matched.firstStockDate ?? normalizedDate
          : normalizedDate || matched.firstStockDate

      const nextProduct: Product = {
        ...matched,
        category: row.category || matched.category,
        stockQty: previousStock + Math.max(0, row.quantity),
        unitCost: Math.max(0, row.unit_cost),
        firstStockDate: nextFirstStockDate,
      }

      const index = products.findIndex((product) => product.sku === matched.sku)
      if (index >= 0) products[index] = nextProduct
      return
    }

    const sku = slugify(row.product_name)
    products.push({
      id: `prod-${sku}`,
      sku,
      name: row.product_name,
      nameBn: row.product_name,
      category: row.category || 'General',
      stockQty: Math.max(0, row.quantity),
      unitCost: Math.max(0, row.unit_cost),
      // New memo-created products should wait for the owner to set a selling price.
      unitPrice: 0,
      firstStockDate: normalizedDate,
    })
  })

  return {
    ...baseShop,
    products,
    updatedAt: new Date().toISOString(),
    rowCount: (baseShop.rowCount ?? 0) + sanitizedRows.length,
  }
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Could not read the memo file.'))
    reader.readAsDataURL(file)
  })
}

export async function previewMemoImport({
  file,
  existingProducts,
}: MemoPreviewRequest): Promise<MemoExtractionResponse> {
  const dataUrl = await readFileAsDataUrl(file)
  const res = await apiFetch('/api/memo/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type,
      dataUrl,
      existingProducts,
    }),
  })

  const raw = await res.text()
  const json = raw.trim() ? (JSON.parse(raw) as MemoExtractionResponse | { error?: string }) : null

  if (!res.ok || !json || !('rows' in json)) {
    throw new Error(
      json && 'error' in json && typeof json.error === 'string'
        ? json.error
        : 'Memo preview could not be generated.',
    )
  }

  return {
    ...json,
    rows: json.rows.map((row) => reconcileMemoLineItem(row, existingProducts)),
  }
}
