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
  isSupabaseConfigured,
  loadShopFromSupabase,
  saveShopToSupabase,
  updateProductStock,
} from '../lib/supabase'
import { addProductToShop, type NewProductInput } from '../lib/addProduct'
import { mergeShopData } from '../lib/mergeShopData'
import type { Locale } from '../lib/i18n'
import type { ShopData } from '../types'

export function useShopData(userId: string, locale: Locale) {
  const [shop, setShop] = useState<ShopData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      if (isSupabaseConfigured) {
        const local = loadLocalShop(userId)
        if (local?.shopId) {
          try {
            const remote = await loadShopFromSupabase(local.shopId)
            if (remote) setShop(remote)
            else setShop(local)
          } catch {
            setShop(local)
          }
        }
      } else {
        setShop(loadLocalShop(userId))
      }
      setLoading(false)
    }
    init()
  }, [userId])

  const persist = useCallback(async (data: ShopData) => {
    saveLocalShop(userId, data)
    if (isSupabaseConfigured) {
      try {
        await saveShopToSupabase(data)
      } catch (e) {
        console.error('Supabase save failed', e)
      }
    }
    setShop(data)
  }, [userId])

  const setShopData = useCallback(
    (data: ShopData, mergeWithExisting = true) => {
      const merged = mergeWithExisting ? mergeShopData(shop, data) : data
      void persist(merged)
    },
    [persist, shop],
  )

  const updateStock = useCallback(
    async (productId: string, stockQty: number) => {
      if (!shop) return
      const products = shop.products.map((p) =>
        p.id === productId ? { ...p, stockQty } : p,
      )
      const next = { ...shop, products }
      saveLocalShop(userId, next)
      setShop(next)
      if (isSupabaseConfigured) {
        try {
          await updateProductStock(shop.shopId, productId, stockQty)
        } catch (e) {
          console.error(e)
        }
      }
    },
    [shop, userId],
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

  return {
    shop,
    loading,
    setShopData,
    updateStock,
    addProduct,
    analytics,
    forecasts,
    alerts,
    graph,
    dataInsights,
    decisionFeed,
    isCloud: isSupabaseConfigured,
  }
}
