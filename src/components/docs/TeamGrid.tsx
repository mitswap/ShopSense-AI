import type { DocsTeamMember } from '../../lib/docsTypes'

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function TeamGrid({ teamName, members }: { teamName: string; members: DocsTeamMember[] }) {
  return (
    <div>
      {teamName && <p className="text-sm text-slate-500 mb-4">{teamName}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m) => (
          <article
            key={m.id}
            className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-5 shadow-sm text-center"
          >
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-brand-100 bg-brand-50 flex items-center justify-center shrink-0">
              {m.photoUrl ? (
                <img
                  src={m.photoUrl}
                  alt={m.fullName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              ) : (
                <span className="text-2xl font-semibold text-brand-700">{initials(m.fullName)}</span>
              )}
            </div>
            <h4 className="mt-3 font-semibold text-slate-900">{m.fullName}</h4>
            <p className="text-sm text-brand-600">{m.role}</p>
            <a href={`mailto:${m.email}`} className="text-xs text-slate-500 mt-1 hover:text-brand-600">
              {m.email}
            </a>
          </article>
        ))}
      </div>
    </div>
  )
}
