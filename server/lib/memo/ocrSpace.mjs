const OCR_SPACE_URL = 'https://api.ocr.space/parse/image'
const OCR_RETRYABLE_STATUS_CODES = new Set([401, 402, 403, 408, 409, 429])
let preferredOcrKeyIndex = 0

function getOcrSpaceKeys() {
  return [
    process.env.OCR_SPACE_API_KEY,
    process.env.OCR_SPACE_API_KEY_FALLBACK,
  ]
    .map((key) => String(key ?? '').trim())
    .filter(Boolean)
    .filter((key, index, items) => items.indexOf(key) === index)
}

function getOrderedOcrSpaceKeys() {
  const keys = getOcrSpaceKeys()
  if (keys.length <= 1) return keys
  const start = Math.max(0, Math.min(preferredOcrKeyIndex, keys.length - 1))
  return [...keys.slice(start), ...keys.slice(0, start)]
}

function normalizeEngineSequence() {
  const configured = String(process.env.OCR_SPACE_ENGINE_SEQUENCE ?? '2,1,3')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => ['1', '2', '3'].includes(item))
  return configured.length ? [...new Set(configured)] : ['2', '1', '3']
}

function inferFileType(mimeType = '', fileName = '') {
  const lowerMime = String(mimeType).toLowerCase()
  const lowerName = String(fileName).toLowerCase()
  if (lowerMime.includes('pdf') || lowerName.endsWith('.pdf')) return 'PDF'
  if (lowerMime.includes('png') || lowerName.endsWith('.png')) return 'PNG'
  if (lowerMime.includes('gif') || lowerName.endsWith('.gif')) return 'GIF'
  if (lowerMime.includes('bmp') || lowerName.endsWith('.bmp')) return 'BMP'
  if (lowerMime.includes('tif') || lowerName.endsWith('.tif') || lowerName.endsWith('.tiff')) return 'TIF'
  return 'JPG'
}

function parseOcrResponse(json, engine) {
  const parsedResults = Array.isArray(json?.ParsedResults) ? json.ParsedResults : []
  const parsedText = parsedResults
    .map((entry) => String(entry?.ParsedText ?? '').trim())
    .filter(Boolean)
    .join('\n')
    .trim()

  return {
    ok: !json?.IsErroredOnProcessing && Boolean(parsedText),
    engine,
    text: parsedText,
    raw: json,
    error:
      json?.ErrorMessage?.join?.('; ') ??
      json?.ErrorMessage ??
      json?.ErrorDetails ??
      (parsedText ? null : 'No OCR text returned'),
  }
}

export function hasOcrSpaceKey() {
  return getOcrSpaceKeys().length > 0
}

export async function parseWithOcrSpace({ dataUrl, mimeType, fileName }) {
  if (!hasOcrSpaceKey()) {
    throw new Error('OCR_SPACE_API_KEY is required for memo OCR')
  }

  const fileType = inferFileType(mimeType, fileName)
  const engines = normalizeEngineSequence()
  const attempts = []
  const keys = getOrderedOcrSpaceKeys()

  for (const [orderedIndex, apiKey] of keys.entries()) {
    for (const engine of engines) {
      const params = new URLSearchParams()
      params.set('base64Image', dataUrl)
      params.set('language', 'eng')
      params.set('isTable', 'true')
      params.set('scale', 'true')
      params.set('detectOrientation', 'true')
      params.set('filetype', fileType)
      params.set('OCREngine', engine)

      let response
      try {
        response = await fetch(OCR_SPACE_URL, {
          method: 'POST',
          headers: {
            apikey: apiKey,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        })
      } catch (error) {
        attempts.push({ key: orderedIndex + 1, engine, ok: false, error: error?.message ?? 'Network error' })
        continue
      }

      let json = null
      try {
        json = await response.json()
      } catch {
        attempts.push({ key: orderedIndex + 1, engine, ok: false, error: `Invalid OCR response (${response.status})` })
        continue
      }

      const parsed = parseOcrResponse(json, engine)
      attempts.push({ key: orderedIndex + 1, engine, ok: parsed.ok, error: parsed.error ?? null })
      if (parsed.ok) {
        const originalIndex = getOcrSpaceKeys().indexOf(apiKey)
        if (originalIndex >= 0) preferredOcrKeyIndex = originalIndex
        return {
          text: parsed.text,
          engine,
          attempts,
        }
      }

      if (!(OCR_RETRYABLE_STATUS_CODES.has(response.status) || response.status >= 500)) {
        break
      }
    }
  }

  const lastError = attempts.find((attempt) => attempt.error)?.error ?? 'OCR failed'
  throw new Error(lastError)
}
