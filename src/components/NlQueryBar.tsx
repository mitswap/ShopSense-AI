import { useEffect, useRef, useState } from 'react'
import { MessageCircle, RotateCcw, Sparkles } from 'lucide-react'
import { answerNlQuery } from '../lib/nlQuery'
import { useI18n } from '../lib/useI18n'
import type { AnalyticsSummary, ProductForecast, ShopData } from '../types'
import { apiFetch } from '../lib/apiClient'

export interface AnalyzerMessage {
  id: string
  role: 'assistant' | 'user'
  text: string
  status?: 'done' | 'loading'
}

interface NlQueryBarProps {
  shop: ShopData
  analytics: AnalyticsSummary
  forecasts: ProductForecast[]
  messages: AnalyzerMessage[]
  onMessagesChange: (messages: AnalyzerMessage[]) => void
  onReset: () => void
}

function buildMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function NlQueryBar({
  shop,
  analytics,
  forecasts,
  messages,
  onMessagesChange,
  onReset,
}: NlQueryBarProps) {
  const { ui, locale } = useI18n()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const viewportRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = viewportRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [messages])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed || loading) return

    const local = answerNlQuery(trimmed, shop, analytics, locale)
    const userMessage: AnalyzerMessage = {
      id: buildMessageId('user'),
      role: 'user',
      text: trimmed,
      status: 'done',
    }
    const loadingMessage: AnalyzerMessage = {
      id: buildMessageId('assistant'),
      role: 'assistant',
      text: ui.analyzerThinking,
      status: 'loading',
    }

    setQuery('')
    setLoading(true)
    onMessagesChange([...messages, userMessage, loadingMessage])

    try {
      const res = await apiFetch('/api/query/nl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmed,
          locale,
          localAnswer: local.answerBn,
          dataContext: {
            analytics,
            products: shop.products,
            sales: shop.sales,
          },
          analytics,
          forecasts,
          products: shop.products,
          sales: shop.sales,
        }),
      })
      const data = await res.json()
      const remote = typeof data.answerBn === 'string' ? data.answerBn.trim() : ''
      const looksEmpty = !remote || /^no answer from data\.?$/i.test(remote)
      const finalAnswer = looksEmpty ? local.answerBn : remote

      onMessagesChange([
        ...messages,
        userMessage,
        {
          id: loadingMessage.id,
          role: 'assistant',
          text: finalAnswer,
          status: 'done',
        },
      ])
    } catch {
      onMessagesChange([
        ...messages,
        userMessage,
        {
          id: loadingMessage.id,
          role: 'assistant',
          text: local.answerBn,
          status: 'done',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-left">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <MessageCircle className="h-4 w-4 text-brand-600" />
            {ui.shopAnalyzer}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">{ui.analyzerHint}</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {ui.refresh}
        </button>
      </div>

      <div
        ref={viewportRef}
        className="mt-3 h-[24rem] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/70 p-3"
      >
        <div className="space-y-3">
          {messages.map((message) => {
            const isUser = message.role === 'user'
            return (
              <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <span className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {isUser ? 'You' : 'ShopSense AI'}
                  </span>
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? 'rounded-br-md bg-brand-600 text-white'
                        : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!isUser && (
                        <span className="mt-0.5 text-brand-600">
                          <Sparkles className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <span className={message.status === 'loading' ? 'animate-pulse' : ''}>{message.text}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <form onSubmit={(e) => void submit(e)} className="mt-3 flex items-end gap-2">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={ui.analyzerPlaceholder}
          rows={2}
          className="min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? ui.analyzerThinking : ui.ask}
        </button>
      </form>
    </div>
  )
}
