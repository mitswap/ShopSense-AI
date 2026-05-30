export function evaluateDocsAccess(access, now = new Date()) {
  if (!access) {
    return { available: false, reason: 'not_configured', message: 'Documentation is not configured.' }
  }

  if (access.manualOverride === 'off') {
    return { available: false, reason: 'admin_off', message: 'Documentation is temporarily unavailable.' }
  }

  if (access.manualOverride === 'on') {
    return { available: true, reason: 'admin_on', message: 'Public (admin override ON).' }
  }

  if (!access.enabled) {
    return { available: false, reason: 'disabled', message: 'Documentation is turned off.' }
  }

  const { schedule } = access
  if (!schedule?.start || !schedule?.end) {
    return { available: true, reason: 'enabled', message: 'Public (no schedule).' }
  }

  const start = new Date(schedule.start)
  const end = new Date(schedule.end)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { available: true, reason: 'invalid_schedule', message: 'Public (invalid schedule ignored).' }
  }

  if (now < start) {
    return {
      available: false,
      reason: 'before_window',
      message: `Opens ${start.toLocaleString('en-GB', { timeZone: schedule.timezone ?? 'Asia/Dhaka' })}.`,
      window: { start: schedule.start, end: schedule.end },
    }
  }

  if (now > end) {
    return {
      available: false,
      reason: 'after_window',
      message: `Closed after ${end.toLocaleString('en-GB', { timeZone: schedule.timezone ?? 'Asia/Dhaka' })}.`,
      window: { start: schedule.start, end: schedule.end },
    }
  }

  return {
    available: true,
    reason: 'scheduled',
    message: 'Public (within scheduled window).',
    window: { start: schedule.start, end: schedule.end },
  }
}

export function isDocsAdmin(user) {
  return user?.role === 'admin' || user?.role === 'super_admin'
}

export function verifyAdminCredentials(username, password) {
  const admins = [
    { username: 'superadmin', password: 'buildfest2026', role: 'super_admin', displayName: 'Super Admin' },
    { username: 'admin', password: 'docsadmin2026', role: 'admin', displayName: 'Docs Admin' },
  ]
  const found = admins.find((a) => a.username === username && a.password === password)
  if (!found) return null
  return { username: found.username, displayName: found.displayName, role: found.role }
}
