export type UserRole = 'owner' | 'admin' | 'super_admin'

export interface AppUser {
  username: string
  displayName: string
  role: UserRole
}

interface Credential extends AppUser {
  password: string
}

const USERS: Credential[] = [
  { username: 'owner1', password: 'shopsense123', displayName: 'Owner One', role: 'owner' },
  { username: 'owner2', password: 'shopsense456', displayName: 'Owner Two', role: 'owner' },
  { username: 'admin', password: 'docsadmin2026', displayName: 'Docs Admin', role: 'admin' },
  { username: 'superadmin', password: 'buildfest2026', displayName: 'Super Admin', role: 'super_admin' },
]

const SESSION_KEY = 'sme-ai-dashboard-session'

export function login(username: string, password: string): AppUser | null {
  const found = USERS.find((u) => u.username === username && u.password === password)
  if (!found) return null
  const user: AppUser = {
    username: found.username,
    displayName: found.displayName,
    role: found.role,
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  return user
}

export function getSessionUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppUser
    if (!parsed.role) parsed.role = 'owner'
    return parsed
  } catch {
    return null
  }
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function isDocsAdmin(user: AppUser | null): boolean {
  return user?.role === 'admin' || user?.role === 'super_admin'
}

export function docsAdminHeader(username: string, password: string): string {
  return btoa(`${username}:${password}`)
}
