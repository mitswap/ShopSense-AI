import type { Alert } from '../types'
import { useI18n } from '../lib/i18n'

interface AlertsPanelProps {
  alerts: Alert[]
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const { ui } = useI18n()
  if (alerts.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-left">
      <h3 className="text-sm font-semibold text-slate-900">{ui.alertsTitle}</h3>
      <ul className="mt-2 space-y-2 text-sm">
        {alerts.slice(0, 5).map((a) => (
          <li
            key={a.id}
            className={`p-2 rounded-lg border text-xs ${
              a.severity === 'high'
                ? 'border-red-100 bg-red-50 text-red-900'
                : a.severity === 'medium'
                  ? 'border-amber-100 bg-amber-50'
                  : 'border-slate-100 bg-slate-50'
            }`}
          >
            {a.messageBn}
          </li>
        ))}
      </ul>
    </div>
  )
}
