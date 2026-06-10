import { useCallback, useEffect, useMemo, useState } from 'react'
import { generateAlerts } from '../lib/alerts'
import { computeAnalytics } from '../lib/analyticsEngine'
import { forecastProducts } from '../lib/forecast'
import { buildBusinessGraph } from '../lib/graphBuilder'
import {
  generateDataInsights,
  generateDecisionFeed,
} from '../lib/insightGenerator'
import { loadLocalShop, saveLocalShop } from '../lib/storage'
import {
  clearShopFromSupabase,
  isSupabaseConfigured,
  loadShopFromSupabase,
  saveShopToSupabase,
  updateProductInventory,
} from '../lib/supabase'
import { addProductToShop, type NewProductInput } from '../lib/addProduct'
import { applyMemoImportToShop } from '../lib/memoImport'
import { mergeShopData } from '../lib/mergeShopData'
import type { Locale } from '../lib/i18n-types'
import type { InventoryUpdateInput, MemoLineItem, ShopData } from '../types'

export function useShopData(userId: string, locale: Locale) {
  const [shop, setShop] = useState<ShopData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const local = loadLocalShop(userId)

      if (local) {
        setShop(local)
        setLoading(false)
        return
      }

      if (isSupabaseConfigured) {
        const fallbackShopId = `shop-${userId}`
        try {
          const remote = await loadShopFromSupabase(fallbackShopId)
          if (remote) {
            setShop(remote)
          } else {
            setShop(null)
          }
        } catch {
          setShop(null)
        }
      } else {
        setShop(null)
      }
      setLoading(false)
    }
    init()
  }, [userId])

  const persist = useCallback(async (data: ShopData) => {
    const normalized: ShopData = {
      ...data,
      shopId: data.shopId || `shop-${userId}`,
      updatedAt: new Date().toISOString(),
    }
    saveLocalShop(userId, normalized)
    if (isSupabaseConfigured) {
      try {
        await saveShopToSupabase(normalized)
      } catch (e) {
        console.error('Supabase save failed', e)
      }
    }
    setShop(normalized)
  }, [userId])

  const setShopData = useCallback(
    (data: ShopData, mergeWithExisting = true) => {
      const normalizedIncoming: ShopData = {
        ...data,
        shopId: shop?.shopId ?? data.shopId ?? `shop-${userId}`,
        shopName: shop?.shopName ?? data.shopName,
      }

      const next = mergeWithExisting
        ? mergeShopData(shop, normalizedIncoming)
        : normalizedIncoming
      void persist(next)
    },
    [persist, shop, userId],
  )

  const updateStock = useCallback(
    async (productId: string, update: InventoryUpdateInput) => {
      if (!shop) return
      const currentProduct = shop.products.find((p) => p.id === productId)
      if (!currentProduct) return

      const clampedStock = Math.max(0, update.stockQty)
      const nextUnitPrice = Math.max(0, update.unitPrice)
      const soldQty = Math.max(0, currentProduct.stockQty - clampedStock)
      const today = new Date().toISOString().slice(0, 10)

      const products = shop.products.map((p) =>
        p.id === productId ? { ...p, stockQty: clampedStock, unitPrice: nextUnitPrice } : p,
      )

      const sales =
        soldQty > 0
          ? [
              ...shop.sales,
              {
                id: `sale-${currentProduct.sku}-${today}-${Date.now()}`,
                productId: currentProduct.id,
                sku: currentProduct.sku,
                saleDate: today,
                qtySold: soldQty,
                revenue: soldQty * nextUnitPrice,
                unitPrice: nextUnitPrice,
              },
            ]
          : shop.sales

      const next = { ...shop, products, sales, updatedAt: new Date().toISOString() }

      if (soldQty > 0) {
        void persist(next)
        return
      }

      saveLocalShop(userId, next)
      setShop(next)
      if (isSupabaseConfigured) {
        try {
          await updateProductInventory(shop.shopId, productId, clampedStock, nextUnitPrice)
        } catch (e) {
          console.error(e)
        }
      }
    },
    [isSupabaseConfigured, persist, shop, userId],
  )

  const analytics = useMemo(
    () => (shop ? computeAnalytics(shop.products, shop.sales, locale) : null),
    [shop, locale],
  )

  const forecasts = useMemo(
    () => (shop ? forecastProducts(shop.products, shop.sales) : []),
    [shop],
  )

  const alerts = useMemo(() => generateAlerts(forecasts, locale), [forecasts, locale])

  const graph = useMemo(
    () => (shop ? buildBusinessGraph(shop, locale) : null),
    [shop, locale],
  )

  const dataInsights = useMemo(() => {
    if (!shop || !analytics) return []
    return generateDataInsights(shop.products, shop.sales, analytics, forecasts, locale)
  }, [shop, analytics, forecasts, locale])

  const decisionFeed = useMemo(() => {
    if (!analytics || !graph) return []
    return generateDecisionFeed(analytics, forecasts, dataInsights, graph, locale)
  }, [analytics, forecasts, dataInsights, graph, locale])

  const addProduct = useCallback(
    (input: NewProductInput) => {
      const base =
        shop ??
        ({
          shopId: `shop-${userId}`,
          shopName: 'ShopSense AI',
          products: [],
          sales: [],
          updatedAt: new Date().toISOString(),
        } satisfies ShopData)
      void persist(addProductToShop(base, input))
    },
    [shop, persist, userId],
  )

  const importMemoRows = useCallback(
    async (rows: MemoLineItem[]) => {
      const next = applyMemoImportToShop(shop, userId, rows)
      await persist(next)
    },
    [persist, shop, userId],
  )

  const resetShop = useCallback(async () => {
    const currentShopId = shop?.shopId
    localStorage.removeItem(`sme-ai-dashboard-shop-${userId}`)
    setShop(null)
    setLoading(false)

    if (isSupabaseConfigured && currentShopId) {
      try {
        await clearShopFromSupabase(currentShopId)
      } catch (e) {
        console.error('Supabase reset failed', e)
      }
    }
  }, [shop, userId])

  return {
    shop,
    loading,
    setShopData,
    resetShop,
    updateStock,
    addProduct,
    importMemoRows,
    analytics,
    forecasts,
    alerts,
    graph,
    dataInsights,
    decisionFeed,
    isCloud: isSupabaseConfigured,
  }
}
