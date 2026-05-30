import {
  getDocsAccess,
  getDocsContent,
  saveDocsAccess,
  saveDocsContent,
  publishDraft,
  initDocsIfMissing,
} from '../lib/docs/docsStore.mjs'
import { buildDefaultDocsContent } from '../lib/docs/defaultContent.mjs'
import {
  evaluateDocsAccess,
  verifyAdminCredentials,
  isDocsAdmin,
} from '../lib/docs/docsAccess.mjs'
import {
  isOllamaAvailable,
  hasHuggingFace,
  getOllamaModel,
  getOllamaReasonerModel,
} from '../lib/llm/ollamaClient.mjs'
import { hasOpenRouter } from '../openrouter.mjs'

async function ensureDocsReady() {
  await initDocsIfMissing(buildDefaultDocsContent())
}

function parseBody(req) {
  return typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}
}

function parseAdmin(req) {
  const body = parseBody(req)
  if (body.username && body.password) return verifyAdminCredentials(body.username, body.password)
  const header = req.headers['x-docs-admin']
  if (header) {
    const [u, p] = Buffer.from(header, 'base64').toString('utf8').split(':')
    return verifyAdminCredentials(u, p)
  }
  return null
}

export async function handleDocsAccess(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  await ensureDocsReady()
  const access = await getDocsAccess()
  res.status(200).json({ access, ...evaluateDocsAccess(access) })
}

export async function handleDocsContent(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  await ensureDocsReady()
  const access = await getDocsAccess()
  const status = evaluateDocsAccess(access)
  const q = req.url?.includes('?') ? new URL(req.url, 'https://x').searchParams : new URLSearchParams()
  const isAdminPreview = q.get('preview') === '1' && req.headers['x-docs-admin']
  if (!status.available && !isAdminPreview) return res.status(403).json({ error: 'unavailable', ...status })
  let content = await getDocsContent({ draft: q.get('draft') === '1' })
  if (!content) {
    await initDocsIfMissing(buildDefaultDocsContent())
    content = await getDocsContent({ draft: q.get('draft') === '1' })
  }
  if (!content) return res.status(404).json({ error: 'no_content' })
  res.status(200).json({ content, published: q.get('draft') !== '1' })
}

export async function handleDocsLive(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  await ensureDocsReady()
  const ollamaUp = await isOllamaAvailable()
  const hfUp = hasHuggingFace()
  const orUp = hasOpenRouter()
  const features = (await getDocsContent())?.features ?? []
  res.status(200).json({
    timestamp: new Date().toISOString(),
    host: process.env.RENDER ? 'render' : process.env.VERCEL ? 'vercel' : 'local',
    layers: {
      frontend: true,
      api: true,
      ollama: ollamaUp,
      llama32: ollamaUp ? `ready (${getOllamaModel()})` : orUp ? 'ready (OpenRouter cloud)' : 'offline',
      deepseekR1: ollamaUp
        ? `ready (${getOllamaReasonerModel()})`
        : orUp
          ? 'ready (DeepSeek-class via OpenRouter)'
          : 'offline',
      huggingface: hfUp,
      openrouter: orUp,
    },
    features: features.map((f) => ({ id: f.id, name: f.name, status: f.status })),
  })
}

export async function handleDocsAdminLogin(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const user = parseAdmin(req)
  if (!user) return res.status(401).json({ error: 'invalid_credentials' })
  res.status(200).json({ user })
}

export async function handleDocsAdminAccess(req, res) {
  await ensureDocsReady()
  const user = parseAdmin(req)
  if (!isDocsAdmin(user)) return res.status(403).json({ error: 'forbidden' })
  if (req.method === 'GET') {
    const access = await getDocsAccess()
    return res.status(200).json({ access, status: evaluateDocsAccess(access) })
  }
  if (req.method === 'PUT') {
    const { username: _u, password: _p, ...patch } = parseBody(req)
    const access = await saveDocsAccess({
      ...(await getDocsAccess()),
      ...patch,
      updatedAt: new Date().toISOString(),
      updatedBy: user.username,
    })
    return res.status(200).json({ access, status: evaluateDocsAccess(access) })
  }
  return res.status(405).json({ error: 'Method not allowed' })
}

export async function handleDocsAdminContent(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' })
  await ensureDocsReady()
  const user = parseAdmin(req)
  if (!isDocsAdmin(user)) return res.status(403).json({ error: 'forbidden' })
  const { content, asDraft } = parseBody(req)
  if (!content) return res.status(400).json({ error: 'missing_content' })
  const saved = await saveDocsContent(
    { ...content, meta: { ...content.meta, updatedAt: new Date().toISOString() } },
    { asDraft: asDraft !== false },
  )
  res.status(200).json({ content: saved })
}

export async function handleDocsAdminPublish(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  await ensureDocsReady()
  const user = parseAdmin(req)
  if (!isDocsAdmin(user)) return res.status(403).json({ error: 'forbidden' })
  try {
    const content = await publishDraft()
    res.status(200).json({ content, published: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
}
