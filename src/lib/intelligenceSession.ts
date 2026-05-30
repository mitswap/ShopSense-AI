import { getSessionUser } from './auth'
import { loadLocalShop } from './storage'

const SESSION_ID_KEY = 'sme-ai-dashboard-intel-session'

export function getIntelligenceSessionId(): string {
  let id = sessionStorage.getItem(SESSION_ID_KEY)
  if (!id) {
    id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    sessionStorage.setItem(SESSION_ID_KEY, id)
  }
  return id
}

export function getIntelligenceShopId(): string | undefined {
  const user = getSessionUser()
  if (!user) return undefined
  const shop = loadLocalShop(user.username)
  return shop?.shopId
}
