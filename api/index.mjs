/**
 * Single Vercel serverless function — routes all /api/* (Hobby plan: max 12 functions).
 */

export default async function handler(req, res) {
  const path = (req.url ?? '/api').split('?')[0]

  try {
    if (path === '/api/status' || path.endsWith('/api/status')) {
      const { handleStatus } = await import('../server/handlers/status.mjs')
      return handleStatus(req, res)
    }
    if (path === '/api/health' || path.endsWith('/api/health')) {
      const { handleHealth } = await import('../server/handlers/status.mjs')
      return handleHealth(req, res)
    }
    if (path === '/api/intelligence/health' || path.endsWith('/api/intelligence/health')) {
      const { handleIntelligenceHealth } = await import('../server/handlers/status.mjs')
      return handleIntelligenceHealth(req, res)
    }
    if (path === '/api/insight' || path.endsWith('/api/insight')) {
      const { handleInsight } = await import('../server/handlers/insight.mjs')
      return handleInsight(req, res)
    }
    if (path === '/api/query/nl' || path.endsWith('/api/query/nl')) {
      const { handleNlQuery } = await import('../server/handlers/nlQuery.mjs')
      return handleNlQuery(req, res)
    }
    if (path === '/api/root-cause' || path.endsWith('/api/root-cause')) {
      const { handleRootCause } = await import('../server/handlers/rootCause.mjs')
      return handleRootCause(req, res)
    }
    if (path === '/api/schema/detect' || path.endsWith('/api/schema/detect')) {
      const { handleSchemaDetect } = await import('../server/handlers/schemaDetect.mjs')
      return handleSchemaDetect(req, res)
    }
    if (path === '/api/rag/search' || path.endsWith('/api/rag/search')) {
      const { handleRagSearch } = await import('../server/handlers/rag.mjs')
      return handleRagSearch(req, res)
    }
    if (path === '/api/docs/access' || path.endsWith('/api/docs/access')) {
      const { handleDocsAccess } = await import('../server/handlers/docs.mjs')
      return handleDocsAccess(req, res)
    }
    if (path === '/api/docs/content' || path.endsWith('/api/docs/content')) {
      const { handleDocsContent } = await import('../server/handlers/docs.mjs')
      return handleDocsContent(req, res)
    }
    if (path === '/api/docs/live' || path.endsWith('/api/docs/live')) {
      const { handleDocsLive } = await import('../server/handlers/docs.mjs')
      return handleDocsLive(req, res)
    }
    if (path === '/api/docs/admin/login' || path.endsWith('/api/docs/admin/login')) {
      const { handleDocsAdminLogin } = await import('../server/handlers/docs.mjs')
      return handleDocsAdminLogin(req, res)
    }
    if (path === '/api/docs/admin/access' || path.endsWith('/api/docs/admin/access')) {
      const { handleDocsAdminAccess } = await import('../server/handlers/docs.mjs')
      return handleDocsAdminAccess(req, res)
    }
    if (path === '/api/docs/admin/content' || path.endsWith('/api/docs/admin/content')) {
      const { handleDocsAdminContent } = await import('../server/handlers/docs.mjs')
      return handleDocsAdminContent(req, res)
    }
    if (path === '/api/docs/admin/publish' || path.endsWith('/api/docs/admin/publish')) {
      const { handleDocsAdminPublish } = await import('../server/handlers/docs.mjs')
      return handleDocsAdminPublish(req, res)
    }

    res.status(404).json({ error: 'Not found', path })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message ?? 'Server error' })
  }
}

export const config = { maxDuration: 30 }
