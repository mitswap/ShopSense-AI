export type SupportedFestival = 'Eid' | 'Puja'

export type FestivalWindow = {
  key: string
  name: SupportedFestival
  start: string
  end: string
}

const RAW_WINDOWS: Array<Omit<FestivalWindow, 'key'>> = [
  { name: 'Eid', start: '2024-03-26', end: '2024-04-10' },
  { name: 'Eid', start: '2024-06-01', end: '2024-06-16' },
  { name: 'Puja', start: '2024-09-27', end: '2024-10-12' },
  { name: 'Eid', start: '2025-03-16', end: '2025-03-31' },
  { name: 'Eid', start: '2025-05-23', end: '2025-06-07' },
  { name: 'Puja', start: '2025-09-17', end: '2025-10-02' },
  { name: 'Eid', start: '2026-03-05', end: '2026-03-20' },
  { name: 'Eid', start: '2026-05-12', end: '2026-05-27' },
  { name: 'Puja', start: '2026-10-05', end: '2026-10-20' },
  { name: 'Eid', start: '2027-02-23', end: '2027-03-10' },
  { name: 'Eid', start: '2027-05-02', end: '2027-05-17' },
  { name: 'Puja', start: '2027-09-24', end: '2027-10-09' },
  { name: 'Eid', start: '2028-02-12', end: '2028-02-27' },
  { name: 'Eid', start: '2028-04-20', end: '2028-05-05' },
  { name: 'Puja', start: '2028-09-12', end: '2028-09-27' },
  { name: 'Eid', start: '2029-01-31', end: '2029-02-15' },
  { name: 'Eid', start: '2029-04-09', end: '2029-04-24' },
  { name: 'Puja', start: '2029-10-01', end: '2029-10-16' },
]

export const FESTIVAL_WINDOWS: FestivalWindow[] = RAW_WINDOWS.map((window) => ({
  ...window,
  key: `${window.name}:${window.end}`,
}))

function normalizeDate(value: string): string {
  return value.slice(0, 10)
}

function startOfDay(value: string): number {
  return Date.parse(`${normalizeDate(value)}T00:00:00.000Z`)
}

export function findFestivalWindowByDate(date: string): FestivalWindow | null {
  const normalized = normalizeDate(date)
  for (const window of FESTIVAL_WINDOWS) {
    if (normalized >= window.start && normalized <= window.end) return window
  }
  return null
}

export function inferFestivalFromDate(date: string): SupportedFestival | 'None' {
  return findFestivalWindowByDate(date)?.name ?? 'None'
}

export function resolveFestivalValue(
  explicitFestival: string | undefined,
  date: string,
): string {
  const explicit = explicitFestival?.trim()
  if (explicit) return explicit
  return inferFestivalFromDate(date)
}

export function getUpcomingFestivalWindow(referenceDate: Date = new Date()): {
  festival: SupportedFestival
  startDate: string
  endDate: string
  daysUntilStart: number
  isActive: boolean
} | null {
  const refMs = Date.parse(referenceDate.toISOString().slice(0, 10) + 'T00:00:00.000Z')
  let best: FestivalWindow | null = null

  for (const window of FESTIVAL_WINDOWS) {
    const startMs = startOfDay(window.start)
    const endMs = startOfDay(window.end)
    if (refMs > endMs) continue
    if (!best || startMs < startOfDay(best.start)) best = window
  }

  if (!best) return null

  const startMs = startOfDay(best.start)
  const endMs = startOfDay(best.end)
  const isActive = refMs >= startMs && refMs <= endMs
  const daysUntilStart = isActive ? 0 : Math.max(0, Math.round((startMs - refMs) / 86400000))

  return {
    festival: best.name,
    startDate: best.start,
    endDate: best.end,
    daysUntilStart,
    isActive,
  }
}
