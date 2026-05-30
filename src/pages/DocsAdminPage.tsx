import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  adminLogin,
  adminPublish,
  adminSaveAccess,
  adminSaveContent,
  clearAdminCreds,
  fetchDocsAccess,
  fetchDocsContent,
  getAdminCreds,
} from '../lib/docsApi'
import type { DocsAccess, DocsContent } from '../lib/docsTypes'

export function DocsAdminPage() {
  const [authed, setAuthed] = useState(() => Boolean(getAdminCreds()))
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [access, setAccess] = useState<DocsAccess | null>(null)
  const [statusMsg, setStatusMsg] = useState('')
  const [content, setContent] = useState<DocsContent | null>(null)
  const [saved, setSaved] = useState('')

  useEffect(() => {
    if (!authed) return
    void fetchDocsAccess().then((r) => {
      if (r.access) setAccess(r.access)
      setStatusMsg(r.message)
    })
    void fetchDocsContent(true, true).then((r) => {
      if ('content' in r) setContent(r.content)
    })
  }, [authed])

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    const ok = await adminLogin(username, password)
    if (!ok) {
      setLoginError('Invalid admin credentials')
      return
    }
    setLoginError('')
    setAuthed(true)
  }

  async function saveAccess() {
    if (!access) return
    const res = (await adminSaveAccess(access)) as { status?: { message: string } }
    setSaved('Access saved')
    if (res.status?.message) setStatusMsg(res.status.message)
  }

  async function saveDraft() {
    if (!content) return
    await adminSaveContent(content, true)
    setSaved('Draft saved')
  }

  async function publish() {
    await adminPublish()
    setSaved('Published to live /docs')
  }

  if (!authed) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
        <form onSubmit={(e) => void handleLogin(e)} className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Docs Admin</h1>
          <p className="text-xs text-slate-500 mt-1">admin / docsadmin2026 or superadmin / buildfest2026</p>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="mt-4 w-full border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="mt-2 w-full border rounded-lg px-3 py-2 text-sm"
          />
          {loginError && <p className="text-xs text-red-600 mt-2">{loginError}</p>}
          <button type="submit" className="mt-4 w-full bg-brand-600 text-white rounded-lg py-2 text-sm">
            Sign in
          </button>
          <Link to="/docs" className="block text-center text-xs text-slate-500 mt-3 hover:text-brand-600">
            ← Public docs
          </Link>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white px-4 py-3 flex justify-between items-center">
        <h1 className="font-semibold text-slate-900">Docs Admin Panel</h1>
        <div className="flex gap-3 text-xs">
          <Link to="/docs" className="text-brand-600 hover:underline">
            View /docs
          </Link>
          <button
            type="button"
            onClick={() => {
              clearAdminCreds()
              setAuthed(false)
            }}
            className="text-slate-500 hover:text-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {saved && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">{saved}</p>}

        <section className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold">Visibility & schedule</h2>
          <p className="text-xs text-slate-500">Status: {statusMsg}</p>
          {access && (
            <>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={access.enabled}
                  onChange={(e) => setAccess({ ...access, enabled: e.target.checked })}
                />
                Enabled (master switch)
              </label>
              <label className="block text-sm">
                Manual override
                <select
                  value={access.manualOverride ?? ''}
                  onChange={(e) =>
                    setAccess({
                      ...access,
                      manualOverride: e.target.value === '' ? null : (e.target.value as 'on' | 'off'),
                    })
                  }
                  className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
                >
                  <option value="">Use schedule</option>
                  <option value="on">Force ON (ignore schedule)</option>
                  <option value="off">Force OFF</option>
                </select>
              </label>
              <label className="block text-sm">
                Start (ISO)
                <input
                  value={access.schedule.start}
                  onChange={(e) =>
                    setAccess({ ...access, schedule: { ...access.schedule, start: e.target.value } })
                  }
                  className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm font-mono"
                />
              </label>
              <label className="block text-sm">
                End (ISO)
                <input
                  value={access.schedule.end}
                  onChange={(e) =>
                    setAccess({ ...access, schedule: { ...access.schedule, end: e.target.value } })
                  }
                  className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm font-mono"
                />
              </label>
              <p className="text-[11px] text-slate-400">Default window: June 10 00:00 → June 14 23:59 (Asia/Dhaka)</p>
              <button
                type="button"
                onClick={() => void saveAccess()}
                className="bg-brand-600 text-white text-sm px-4 py-2 rounded-lg"
              >
                Save access rules
              </button>
            </>
          )}
        </section>

        {content && (
          <section className="bg-white rounded-xl border p-5 space-y-4">
            <h2 className="font-semibold">Content editor</h2>
            <label className="block text-sm">
              Tagline
              <input
                value={content.meta.tagline}
                onChange={(e) => setContent({ ...content, meta: { ...content.meta, tagline: e.target.value } })}
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block text-sm">
              Problem (pitch)
              <textarea
                value={content.pitch.problem}
                onChange={(e) => setContent({ ...content, pitch: { ...content.pitch, problem: e.target.value } })}
                rows={3}
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block text-sm">
              Solution (pitch)
              <textarea
                value={content.pitch.solution}
                onChange={(e) => setContent({ ...content, pitch: { ...content.pitch, solution: e.target.value } })}
                rows={3}
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
              />
            </label>
            <h3 className="text-sm font-medium">Team members</h3>
            {content.team.members.map((m, i) => (
              <div key={m.id} className="border rounded-lg p-3 space-y-2 text-sm">
                <input
                  value={m.fullName}
                  onChange={(e) => {
                    const members = [...content.team.members]
                    members[i] = { ...m, fullName: e.target.value }
                    setContent({ ...content, team: { ...content.team, members } })
                  }}
                  placeholder="Full name"
                  className="w-full border rounded px-2 py-1"
                />
                <input
                  value={m.role}
                  onChange={(e) => {
                    const members = [...content.team.members]
                    members[i] = { ...m, role: e.target.value }
                    setContent({ ...content, team: { ...content.team, members } })
                  }}
                  placeholder="Role"
                  className="w-full border rounded px-2 py-1"
                />
                <input
                  value={m.email}
                  onChange={(e) => {
                    const members = [...content.team.members]
                    members[i] = { ...m, email: e.target.value }
                    setContent({ ...content, team: { ...content.team, members } })
                  }}
                  placeholder="Email"
                  className="w-full border rounded px-2 py-1"
                />
                <input
                  value={m.photoUrl ?? ''}
                  onChange={(e) => {
                    const members = [...content.team.members]
                    members[i] = { ...m, photoUrl: e.target.value }
                    setContent({ ...content, team: { ...content.team, members } })
                  }}
                  placeholder="Photo URL"
                  className="w-full border rounded px-2 py-1"
                />
              </div>
            ))}
            <div className="flex gap-2">
              <button type="button" onClick={() => void saveDraft()} className="border text-sm px-4 py-2 rounded-lg">
                Save draft
              </button>
              <button type="button" onClick={() => void publish()} className="bg-brand-600 text-white text-sm px-4 py-2 rounded-lg">
                Publish live
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
