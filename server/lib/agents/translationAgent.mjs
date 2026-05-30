import { ollamaChat, getOllamaModel } from '../llm/ollamaClient.mjs'

const BN_RE = /[\u0980-\u09FF]/

export function isMostlyEnglish(text) {
  if (!text?.trim()) return false
  const bnChars = (text.match(BN_RE) || []).length
  return bnChars < Math.max(8, text.length * 0.12)
}

/**
 * Bangla ↔ English via local Ollama (llama3.2:1b).
 */
export async function translateText(text, targetLocale) {
  if (!text?.trim()) return text

  if (targetLocale === 'bn' && !isMostlyEnglish(text)) return text.trim()
  if (targetLocale === 'en' && isMostlyEnglish(text)) return text.trim()

  const target =
    targetLocale === 'bn'
      ? 'Bengali (Bangla) — use natural Bangladeshi shop-owner language'
      : 'English'

  const prompt =
    targetLocale === 'bn'
      ? `You are a professional Bengali translator for Bangladesh retail shops.
Translate EVERY English word and phrase below into correct Bengali (Bangla script).
Rules:
- Output ONLY Bengali text in Bengali script (বাংলা)
- Keep numbers, ৳, SKU codes, and product names as-is when commonly used in Latin
- Do not leave any English sentences
- Use clear, simple words a small shop owner understands

Text:
${text}`
      : `Translate to English. Output ONLY English. Keep numbers and SKU codes.

${text}`

  const res = await ollamaChat(prompt, {
    model: getOllamaModel(),
    timeoutMs: Number(process.env.OLLAMA_TRANSLATE_TIMEOUT_MS ?? 10_000),
    temperature: 0.1,
    think: false,
  })
  if (res.ok && res.text?.trim()) return res.text.trim()
  return text
}

/** One Ollama call — faster than translating each field separately */
export async function localizeInsightToBengali(parsed) {
  if (!parsed) return parsed

  const payload = {
    summaryBn: parsed.summaryBn ?? '',
    recommendations: (parsed.recommendations ?? []).map((r) => ({
      titleBn: r.titleBn ?? '',
      actionBn: r.actionBn ?? '',
      reasonBn: r.reasonBn ?? '',
    })),
  }

  const needsWork =
    isMostlyEnglish(payload.summaryBn) ||
    payload.recommendations.some(
      (r) =>
        isMostlyEnglish(r.titleBn) ||
        isMostlyEnglish(r.actionBn) ||
        (r.reasonBn && isMostlyEnglish(r.reasonBn)),
    )

  if (!needsWork) return { ...parsed, summaryBn: payload.summaryBn, recommendations: payload.recommendations }

  const prompt = `Convert ALL string values in this JSON to proper Bengali (Bangla script only).
Keep JSON keys exactly as-is. Keep numbers and SKU codes. No English words in values.

${JSON.stringify(payload)}`

  const res = await ollamaChat(prompt, {
    model: getOllamaModel(),
    timeoutMs: Number(process.env.OLLAMA_TRANSLATE_TIMEOUT_MS ?? 14_000),
    temperature: 0.1,
    think: false,
  })

  if (!res.ok) {
    return {
      ...parsed,
      summaryBn: await translateText(parsed.summaryBn, 'bn'),
      recommendations: await Promise.all(
        (parsed.recommendations ?? []).map(async (r) => ({
          ...r,
          titleBn: await translateText(r.titleBn ?? '', 'bn'),
          actionBn: await translateText(r.actionBn ?? '', 'bn'),
          reasonBn: r.reasonBn ? await translateText(r.reasonBn, 'bn') : undefined,
        })),
      ),
    }
  }

  const match = res.text.match(/\{[\s\S]*\}/)
  if (!match) return parsed
  try {
    const out = JSON.parse(match[0])
    return {
      ...parsed,
      summaryBn: out.summaryBn ?? parsed.summaryBn,
      recommendations: (out.recommendations ?? parsed.recommendations).map((r, i) => ({
        ...(parsed.recommendations?.[i] ?? {}),
        ...r,
      })),
    }
  } catch {
    return parsed
  }
}

export async function ensureAnswerBengali(answerBn, locale) {
  if (locale !== 'bn') return answerBn
  if (!isMostlyEnglish(answerBn)) return answerBn
  return translateText(answerBn, 'bn')
}
