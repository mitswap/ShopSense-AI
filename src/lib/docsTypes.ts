export interface DocsTeamMember {
  id: string
  fullName: string
  role: string
  email: string
  photoUrl?: string
}

export interface DocsFeature {
  id: string
  name: string
  status: 'live' | 'beta' | 'planned' | 'deprecated'
  description: string
}

export interface DocsContent {
  meta: { version: string; updatedAt: string; title: string; tagline: string }
  pitch: Record<string, string>
  team: { teamName: string; members: DocsTeamMember[] }
  product: { summary: string; users: string[]; useCases: string[] }
  features: DocsFeature[]
  architectureMermaid: string
  dataFlowMermaid: string
  stack: Record<string, string[]>
  apis: { exposed: { method: string; path: string; auth: string; description: string }[]; external: { name: string; use: string }[] }
  dataLayer: Record<string, string | string[]>
  aiLayer: Record<string, string | string[]>
  roadmap: { short: string[]; mid: string[]; long: string[] }
  performance: Record<string, string>
  security: Record<string, string>
  analytics: Record<string, string | string[]>
  changelog: { version: string; date: string; notes: string }[]
  customSections?: { id: string; title: string; body: string }[]
}

export interface DocsAccess {
  enabled: boolean
  manualOverride: 'on' | 'off' | null
  schedule: { start: string; end: string; timezone: string }
  updatedAt?: string
  updatedBy?: string
}

export interface DocsAccessStatus {
  available: boolean
  reason: string
  message: string
  window?: { start: string; end: string }
}

export interface DocsLiveSnapshot {
  timestamp: string
  layers: Record<string, boolean | number>
  features: { id: string; name: string; status: string }[]
}
