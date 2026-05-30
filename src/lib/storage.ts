import type { ShopData } from '../types'

function getStorageKey(userId: string) {
  return `sme-ai-dashboard-shop-${userId}`
}

export function loadLocalShop(userId: string): ShopData | null {
  try {
    const raw = localStorage.getItem(getStorageKey(userId))
    if (!raw) return null
    return JSON.parse(raw) as ShopData
  } catch {
    return null
  }
}

export function saveLocalShop(userId: string, data: ShopData): void {
  data.updatedAt = new Date().toISOString()
  localStorage.setItem(getStorageKey(userId), JSON.stringify(data))
}

export function clearLocalShop(userId: string): void {
  localStorage.removeItem(getStorageKey(userId))
}
