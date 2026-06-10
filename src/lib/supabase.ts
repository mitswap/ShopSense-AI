import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Product, SaleRecord, ShopData } from '../types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured =
  import.meta.env.VITE_USE_SUPABASE === 'true' && Boolean(url && anonKey)

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured || !url || !anonKey) return null
  if (!client) client = createClient(url, anonKey)
  return client
}

export async function saveShopToSupabase(data: ShopData): Promise<void> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase not configured')

  const { error: shopErr } = await sb.from('shops').upsert({
    id: data.shopId,
    name: data.shopName,
    updated_at: data.updatedAt,
  })
  if (shopErr) throw shopErr

  const { error: delSalesErr } = await sb
    .from('sales')
    .delete()
    .eq('shop_id', data.shopId)
  if (delSalesErr) throw delSalesErr

  const { error: delProductsErr } = await sb
    .from('products')
    .delete()
    .eq('shop_id', data.shopId)
  if (delProductsErr) throw delProductsErr

  for (const p of data.products) {
    const baseRow = {
      id: p.id,
      shop_id: data.shopId,
      sku: p.sku,
      name: p.name,
      name_bn: p.nameBn,
      category: p.category,
      stock_qty: p.stockQty,
      unit_cost: p.unitCost,
      first_stock_date: p.firstStockDate ?? null,
      updated_at: new Date().toISOString(),
    }
    let { error: pErr } = await sb.from('products').upsert({
      ...baseRow,
      unit_price: p.unitPrice,
    })
    if (pErr) {
      ;({ error: pErr } = await sb.from('products').upsert({
        id: p.id,
        shop_id: data.shopId,
        sku: p.sku,
        name: p.name,
        name_bn: p.nameBn,
        category: p.category,
        stock_qty: p.stockQty,
        unit_cost: p.unitCost,
        unit_price: p.unitPrice,
        updated_at: new Date().toISOString(),
      }))
    }
    if (pErr) {
      ;({ error: pErr } = await sb.from('products').upsert({
        id: p.id,
        shop_id: data.shopId,
        sku: p.sku,
        name: p.name,
        name_bn: p.nameBn,
        category: p.category,
        stock_qty: p.stockQty,
        unit_cost: p.unitCost,
        updated_at: new Date().toISOString(),
      }))
    }
    if (pErr) throw pErr
  }

  if (data.sales.length > 0) {
    const rows = data.sales.map((s) => ({
      id: s.id,
      shop_id: data.shopId,
      product_id: s.productId,
      sku: s.sku,
      sale_date: s.saleDate,
      qty_sold: s.qtySold,
      revenue: s.revenue,
    }))
    const { error: sErr } = await sb.from('sales').upsert(rows)
    if (sErr) throw sErr
  }
}

export async function loadShopFromSupabase(shopId: string): Promise<ShopData | null> {
  const sb = getSupabase()
  if (!sb) return null

  const { data: shop, error: shopErr } = await sb
    .from('shops')
    .select('*')
    .eq('id', shopId)
    .single()
  if (shopErr || !shop) return null

  const { data: products, error: pErr } = await sb
    .from('products')
    .select('*')
    .eq('shop_id', shopId)
  if (pErr) throw pErr

  const { data: sales, error: sErr } = await sb.from('sales').select('*').eq('shop_id', shopId)
  if (sErr) throw sErr

  return {
    shopId: shop.id,
    shopName: shop.name,
    updatedAt: shop.updated_at,
    products: (products ?? []).map(
      (p): Product => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        nameBn: p.name_bn,
        category: p.category,
        stockQty: p.stock_qty,
        unitCost: p.unit_cost,
        unitPrice: p.unit_price ?? p.unit_cost,
        firstStockDate: p.first_stock_date ?? undefined,
      }),
    ),
    sales: (sales ?? []).map(
      (s): SaleRecord => ({
        id: s.id,
        productId: s.product_id,
        sku: s.sku,
        saleDate: s.sale_date,
        qtySold: s.qty_sold,
        revenue: s.revenue,
        unitPrice: s.qty_sold > 0 ? s.revenue / s.qty_sold : 0,
      }),
    ),
  }
}

export async function updateProductInventory(
  shopId: string,
  productId: string,
  stockQty: number,
  unitPrice: number,
): Promise<void> {
  const sb = getSupabase()
  if (!sb) return
  let { error } = await sb
    .from('products')
    .update({
      stock_qty: stockQty,
      unit_price: unitPrice,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .eq('shop_id', shopId)
  if (error) {
    ;({ error } = await sb
      .from('products')
      .update({ stock_qty: stockQty, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .eq('shop_id', shopId))
  }
  if (error) throw error
}

export async function clearShopFromSupabase(shopId: string): Promise<void> {
  const sb = getSupabase()
  if (!sb) return

  const { error: salesErr } = await sb.from('sales').delete().eq('shop_id', shopId)
  if (salesErr) throw salesErr

  const { error: productsErr } = await sb.from('products').delete().eq('shop_id', shopId)
  if (productsErr) throw productsErr

  const { error: shopErr } = await sb.from('shops').delete().eq('id', shopId)
  if (shopErr) throw shopErr
}
