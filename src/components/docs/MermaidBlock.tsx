import { useEffect, useRef, useId } from 'react'

declare global {
  interface Window {
    mermaid?: {
      initialize: (c: object) => void
      run: (o?: { nodes?: HTMLElement[] }) => Promise<void>
    }
  }
}

let mermaidLoading: Promise<void> | null = null

function loadMermaid(): Promise<void> {
  if (window.mermaid) return Promise.resolve()
  if (!mermaidLoading) {
    mermaidLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js'
      s.onload = () => {
        window.mermaid?.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose' })
        resolve()
      }
      s.onerror = reject
      document.head.appendChild(s)
    })
  }
  return mermaidLoading
}

function normalizeChart(chart: string): string {
  // Backward-compat fix for an older invalid label syntax used in saved docs content.
  return chart.replace(/Docs\[\s*\/docs pitch deck\s*\]/g, 'Docs["/docs pitch deck"]')
}

export function MermaidBlock({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const id = useId().replace(/:/g, '')

  useEffect(() => {
    let cancelled = false
    void loadMermaid().then(async () => {
      if (cancelled || !ref.current || !window.mermaid) return
      const safeChart = normalizeChart(chart)
      ref.current.innerHTML = `<pre class="mermaid">${safeChart}</pre>`
      try {
        await window.mermaid.run({ nodes: [ref.current.querySelector('.mermaid')!].filter(Boolean) as HTMLElement[] })
      } catch {
        ref.current.innerHTML = `<pre class="text-xs whitespace-pre-wrap">${safeChart}</pre>`
      }
    })
    return () => {
      cancelled = true
    }
  }, [chart, id])

  return (
    <div ref={ref} className="my-4 overflow-x-auto rounded-lg border border-slate-200 bg-white p-4 text-sm" />
  )
}
