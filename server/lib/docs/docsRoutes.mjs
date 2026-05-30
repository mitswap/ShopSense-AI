import {
  getDocsContent,
  saveDocsContent,
  publishDraft,
  getDocsAccess,
  saveDocsAccess,
  initDocsIfMissing,
} from './docsStore.mjs'
import { evaluateDocsAccess, verifyAdminCredentials, isDocsAdmin } from './docsAccess.mjs'
import { buildDefaultDocsContent } from './defaultContent.mjs'
import {
  isOllamaAvailable,
  hasHuggingFace,
  getOllamaModel,
  getOllamaReasonerModel,
} from '../llm/ollamaClient.mjs'
import { hasOpenRouter } from '../../openrouter.mjs'

function parseAdmin(req) {
  const { username, password } = req.body ?? {}
  if (username && password) {
    return verifyAdminCredentials(username, password)
  }
  const header = req.headers['x-docs-admin']
  if (header) {
    const [u, p] = Buffer.from(header, 'base64').toString('utf8').split(':')
    return verifyAdminCredentials(u, p)
  }
  return null
}

export function registerDocsRoutes(app, { getSupabaseAdmin, hasOpenRouter: hasOr }) {
  initDocsIfMissing(buildDefaultDocsContent()).catch((e) =>
    console.warn('Docs init:', e.message),
  )

  app.get('/api/docs/access', async (_req, res) => {
    const access = await getDocsAccess()
    const status = evaluateDocsAccess(access)
    res.json({ access, ...status })
  })

  app.get('/api/docs/content', async (req, res) => {
    const access = await getDocsAccess()
    const status = evaluateDocsAccess(access)
    const isAdminPreview = req.query.preview === '1' && req.headers['x-docs-admin']
    if (!status.available && !isAdminPreview) {
      return res.status(403).json({ error: 'unavailable', ...status })
    }
    let content = await getDocsContent({ draft: req.query.draft === '1' })
    if (!content) {
      await initDocsIfMissing(buildDefaultDocsContent())
      content = await getDocsContent({ draft: req.query.draft === '1' })
    }
    if (!content) return res.status(404).json({ error: 'no_content' })
    res.json({ content, published: req.query.draft !== '1' })
  })

  app.get('/api/docs/live', async (_req, res) => {
    const ollamaUp = await isOllamaAvailable()
    const hfUp = hasHuggingFace()
    const sb = getSupabaseAdmin()
    let ragChunkCount = 0
    if (sb) {
      const { count } = await sb.from('knowledge_chunks').select('*', { count: 'exact', head: true })
      ragChunkCount = count ?? 0
    }
    const features = (await getDocsContent())?.features ?? []
    const orUp = hasOr?.() ?? hasOpenRouter()
    res.json({
      timestamp: new Date().toISOString(),
      host: process.env.RENDER ? 'render' : process.env.VERCEL ? 'vercel' : 'local',
      layers: {
        frontend: true,
        api: true,
        ollama: ollamaUp,
        llama32: ollamaUp ? `ready (${getOllamaModel()})` : orUp ? 'fallback via OpenRouter' : 'offline',
        deepseekR1: ollamaUp
          ? `ready (${getOllamaReasonerModel()})`
          : orUp
            ? 'cloud fallback'
            : 'offline',
        huggingface: hfUp,
        openrouter: orUp,
        supabase: Boolean(sb),
        ragChunks: ragChunkCount,
      },
      features: features.map((f) => ({ id: f.id, name: f.name, status: f.status })),
    })
  })

  app.get('/api/docs/export/markdown', async (_req, res) => {
    const access = await getDocsAccess()
    const status = evaluateDocsAccess(access)
    if (!status.available) return res.status(403).json({ error: 'unavailable' })
    let content = await getDocsContent()
    if (!content) {
      await initDocsIfMissing(buildDefaultDocsContent())
      content = await getDocsContent()
    }
    if (!content) return res.status(404).json({ error: 'no_content' })
    const md = docsToMarkdown(content)
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="shopsense-ai-docs.md"')
    res.send(md)
  })

  app.post('/api/docs/admin/login', (req, res) => {
    const user = parseAdmin(req)
    if (!user) return res.status(401).json({ error: 'invalid_credentials' })
    res.json({ user })
  })

  app.put('/api/docs/admin/access', async (req, res) => {
    const user = parseAdmin(req)
    if (!isDocsAdmin(user)) return res.status(403).json({ error: 'forbidden' })
    const { username: _u, password: _p, ...patch } = req.body
    const access = await saveDocsAccess({
      ...(await getDocsAccess()),
      ...patch,
      updatedAt: new Date().toISOString(),
      updatedBy: user.username,
    })
    res.json({ access, status: evaluateDocsAccess(access) })
  })

  app.get('/api/docs/admin/access', async (req, res) => {
    const user = parseAdmin(req)
    if (!isDocsAdmin(user)) return res.status(403).json({ error: 'forbidden' })
    const access = await getDocsAccess()
    res.json({ access, status: evaluateDocsAccess(access) })
  })

  app.put('/api/docs/admin/content', async (req, res) => {
    const user = parseAdmin(req)
    if (!isDocsAdmin(user)) return res.status(403).json({ error: 'forbidden' })
    const { content, asDraft } = req.body
    if (!content) return res.status(400).json({ error: 'missing_content' })
    const saved = await saveDocsContent(
      { ...content, meta: { ...content.meta, updatedAt: new Date().toISOString() } },
      { asDraft: asDraft !== false },
    )
    res.json({ content: saved })
  })

  app.post('/api/docs/admin/publish', async (req, res) => {
    const user = parseAdmin(req)
    if (!isDocsAdmin(user)) return res.status(403).json({ error: 'forbidden' })
    try {
      const content = await publishDraft()
      res.json({ content, published: true })
    } catch (e) {
      res.status(400).json({ error: e.message })
    }
  })
}

function docsToMarkdown(c) {
  const lines = [`# ${c.meta?.title ?? 'ShopSense AI'}`, '', `> ${c.meta?.tagline ?? ''}`, '']
  lines.push('## Pitch — Problem', '', c.pitch?.problem ?? '', '')
  lines.push('## Pitch — Solution', '', c.pitch?.solution ?? '', '')
  lines.push('## Team', '')
  for (const m of c.team?.members ?? []) {
    lines.push(`- **${m.fullName}** — ${m.role} (${m.email})`)
  }
  lines.push('', '## Features', '')
  for (const f of c.features ?? []) {
    lines.push(`- [${f.status}] ${f.name}: ${f.description}`)
  }
  lines.push('', '## Changelog', '')
  for (const ch of c.changelog ?? []) {
    lines.push(`- v${ch.version} (${ch.date}): ${ch.notes}`)
  }
  return lines.join('\n')
}
