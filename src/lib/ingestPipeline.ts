import Papa from 'papaparse'
import { applyMappings, detectSchemaMappings, rowToCanonical, slugify } from './canonical'
import type {
  ColumnMapping,
  Product,
  SaleRecord,
  SchemaDetectionResult,
  ShopData,
} from '../types'
import { apiFetch } from './apiClient'

export interface IngestResult {
  ok: boolean
  data: ShopData | null
  schema: SchemaDetectionResult
  errors: string[]
}

function canonicalToShop(
  rows: ReturnType<typeof rowToCanonical>[],
  shopName: string,
  mappings: ColumnMapping[],
): ShopData {
  const valid = rows.filter((r): r is NonNullable<typeof r> => r !== null)
  const productLatest = new Map<
    string,
    { product: Product; lastDate: string }
  >()
  const firstStockBySku = new Map<string, string>()
  const sales: SaleRecord[] = []

  for (let i = 0; i < valid.length; i++) {
    const r = valid[i]
    const sku = slugify(r.product_name)
    const id = `prod-${sku}`

    const existing = productLatest.get(sku)
    const unitPrice = r.unit_price
    const earliestDate = firstStockBySku.get(sku)
    if (!earliestDate || r.date < earliestDate) {
      firstStockBySku.set(sku, r.date)
    }
    const prod: Product = {
      id,
      sku,
      name: r.product_name,
      nameBn: r.product_name,
      category: r.category,
      stockQty: r.stock,
      unitCost: r.unit_cost,
      unitPrice,
      firstStockDate: firstStockBySku.get(sku) ?? r.date,
    }

    if (!existing || r.date >= existing.lastDate) {
      productLatest.set(sku, { product: prod, lastDate: r.date })
    }

    if (r.quantity > 0 || r.revenue > 0) {
      sales.push({
        id: `sale-${sku}-${r.date}-${i}`,
        productId: id,
        sku,
        saleDate: r.date,
        qtySold: r.quantity > 0 ? r.quantity : r.revenue / Math.max(unitPrice, 1),
        revenue: r.revenue,
        unitPrice,
        weather: r.weather,
        season: r.season,
        festival: r.festival,
        location: r.location,
      })
    }
  }

  return {
    shopId: `shop-${Date.now()}`,
    shopName,
    products: Array.from(productLatest.values()).map(({ product }) => ({
      ...product,
      firstStockDate: firstStockBySku.get(product.sku) ?? product.firstStockDate,
    })),
    sales,
    updatedAt: new Date().toISOString(),
    schemaMappings: mappings,
    rowCount: valid.length,
  }
}

export async function detectSchemaFromFile(file: File): Promise<SchemaDetectionResult> {
  const sample = await readCsvSample(file, 8)
  if (sample.columns.length === 0) {
    return { mappings: [], unmapped: [], method: 'rules' }
  }

  try {
    const res = await apiFetch('/api/schema/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        columns: sample.columns,
        sampleRows: sample.rows,
      }),
    })
    if (res.ok) {
      const data = (await res.json()) as SchemaDetectionResult
      if (data.mappings?.length) return data
    }
  } catch {
    /* fallback */
  }

  const mappings = detectSchemaMappings(sample.columns)
  const mappedCols = new Set(mappings.map((m) => m.sourceColumn))
  return {
    mappings,
    unmapped: sample.columns.filter((c) => !mappedCols.has(c)),
    method: 'rules',
  }
}

export async function ingestCsvFile(
  file: File,
  shopName: string,
  confirmedMappings?: ColumnMapping[],
): Promise<IngestResult> {
  const errors: string[] = []

  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const columns = results.meta.fields ?? []
        let schema: SchemaDetectionResult

        if (confirmedMappings?.length) {
          schema = {
            mappings: confirmedMappings,
            unmapped: columns.filter(
              (c) => !confirmedMappings.some((m) => m.sourceColumn === c),
            ),
            method: 'hybrid',
          }
        } else {
          schema = await detectSchemaFromFile(file)
        }

        if (!schema.mappings.some((m) => m.canonicalField === 'product_name')) {
          resolve({
            ok: false,
            data: null,
            schema,
            errors: ['পণ্যের নাম কলাম ম্যাপ করা যায়নি'],
          })
          return
        }

        const canonicalRows = []
        let rowIndex = 0
        for (const raw of results.data) {
          rowIndex++
          const mapped = applyMappings(raw, schema.mappings)
          const row = rowToCanonical(mapped)
          if (!row) {
            if (rowIndex <= 5) errors.push(`সারি ${rowIndex}: তারিখ/পণ্য অনুপস্থিত`)
            continue
          }
          canonicalRows.push(row)
        }

        if (canonicalRows.length === 0) {
          resolve({
            ok: false,
            data: null,
            schema,
            errors: errors.length ? errors : ['কোনো বৈধ সারি পাওয়া যায়নি'],
          })
          return
        }

        resolve({
          ok: true,
          data: canonicalToShop(canonicalRows, shopName, schema.mappings),
          schema,
          errors,
        })
      },
      error: (err) => {
        resolve({ ok: false, data: null, schema: { mappings: [], unmapped: [], method: 'rules' }, errors: [err.message] })
      },
    })
  })
}

function readCsvSample(
  file: File,
  maxRows: number,
): Promise<{ columns: string[]; rows: Record<string, string>[] }> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      preview: maxRows,
      skipEmptyLines: true,
      complete: (r) => {
        resolve({
          columns: r.meta.fields ?? [],
          rows: r.data,
        })
      },
      error: () => resolve({ columns: [], rows: [] }),
    })
  })
}
