import { apiFetch } from './apiClient'

export interface LayerStatus {
  ready: boolean
  label: string
  hint?: string | null
  chunkCount?: number
  mode?: string
}

export interface SystemStatus {
  ok: boolean
  layers: Record<string, LayerStatus>
}

export async function fetchSystemStatus(): Promise<SystemStatus | null> {
  try {
    const res = await apiFetch('/api/status')
    if (!res.ok) return null
    return (await res.json()) as SystemStatus
  } catch {
    return null
  }
}
