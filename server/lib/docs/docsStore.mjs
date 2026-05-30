import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const DOCS_DIR =
  process.env.VERCEL || process.env.VERCEL_ENV
    ? path.join('/tmp', 'shopsense-docs')
    : path.join(__dirname, '../../../data/docs')
const CONTENT_FILE = path.join(DOCS_DIR, 'content.json')
const ACCESS_FILE = path.join(DOCS_DIR, 'access.json')
const DRAFT_FILE = path.join(DOCS_DIR, 'content.draft.json')

async function ensureDir() {
  await fs.mkdir(DOCS_DIR, { recursive: true })
}

async function readJson(file, fallback) {
  try {
    const raw = await fs.readFile(file, 'utf8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

async function writeJson(file, data) {
  await ensureDir()
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8')
}

export async function getDocsContent({ draft = false } = {}) {
  await ensureDir()
  if (draft) {
    const draftData = await readJson(DRAFT_FILE, null)
    if (draftData) return draftData
  }
  return readJson(CONTENT_FILE, null)
}

export async function saveDocsContent(content, { asDraft = false } = {}) {
  const file = asDraft ? DRAFT_FILE : CONTENT_FILE
  await writeJson(file, content)
  return content
}

export async function publishDraft() {
  const draft = await readJson(DRAFT_FILE, null)
  if (!draft) throw new Error('No draft to publish')
  await writeJson(CONTENT_FILE, draft)
  return draft
}

export async function getDocsAccess() {
  await ensureDir()
  return readJson(ACCESS_FILE, defaultAccess())
}

export async function saveDocsAccess(access) {
  await writeJson(ACCESS_FILE, access)
  return access
}

export function defaultAccess() {
  return {
    enabled: true,
    manualOverride: 'on',
    schedule: {
      start: '2026-06-10T00:00:00+06:00',
      end: '2026-06-14T23:59:59+06:00',
      timezone: 'Asia/Dhaka',
    },
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  }
}

export async function initDocsIfMissing(defaultContent) {
  await ensureDir()
  const existing = await readJson(CONTENT_FILE, null)
  if (!existing && defaultContent) {
    await writeJson(CONTENT_FILE, defaultContent)
    await writeJson(DRAFT_FILE, defaultContent)
  }
  const access = await readJson(ACCESS_FILE, null)
  if (!access) {
    await writeJson(ACCESS_FILE, defaultAccess())
  }
}
