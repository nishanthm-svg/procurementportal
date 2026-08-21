const BASE = '/api'

async function get(path, params = {}) {
  const url = new URL(BASE + path, window.location.origin)
  Object.entries(params).forEach(([k, v]) => v != null && v !== '' && url.searchParams.set(k, v))
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

async function post(path, body = {}, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(BASE + path, { method: 'POST', headers, body: JSON.stringify(body) })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `API error: ${res.status}`)
  return json
}

async function getAuthed(path, token) {
  const res = await fetch(BASE + path, { headers: { Authorization: `Bearer ${token}` } })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `API error: ${res.status}`)
  return json
}

// "Jul'26" -> "Jul'25" — same month, one year earlier (used for LFL "vs last year" labels)
export function prevYearLabel(monthLabel) {
  if (!monthLabel) return ''
  const m = /^([A-Za-z]{3})'(\d{2})$/.exec(monthLabel)
  if (!m) return ''
  const year = (parseInt(m[2], 10) - 1 + 100) % 100
  return `${m[1]}'${String(year).padStart(2, '0')}`
}

export const api = {
  summary: () => get('/summary'),
  cluster: () => get('/cluster'),
  ao: (p) => get('/ao', p),
  bmcu: (p) => get('/bmcu', p),
  mpp: (p) => get('/mpp', p),
  budget: (p) => get('/budget', p),
  budgetVsActual: (p) => get('/budget-vs-actual', p),
  lflBmcu: (p) => get('/lfl/bmcu', p),
  lflFeed: (p) => get('/lfl/feed', p),
  gprsAo: (p) => get('/gprs/ao', p),
  gprsAoFiltered: (p) => get('/gprs/ao', p),
  gprsBmcu: (p) => get('/gprs/bmcu', p),
  lowLpd: (p) => get('/alerts/low-lpd', p),
  singlePourer: (p) => get('/alerts/single-pourer', p),
  lowTs: (p) => get('/alerts/low-ts', p),
  closedMpp: () => get('/alerts/closed'),
  recoveries: (p) => get('/recoveries', p),
  manpower: () => get('/manpower'),
  cans: (p) => get('/cans', p),
  mbrt: (p) => get('/mbrt', p),
  enums: () => get('/enums'),
  adminLogin: (password) => post('/admin/login', { password }),
  adminStatus: (token) => getAuthed('/admin/status', token),
  adminUpload: (token, body) => post('/admin/upload', body, token),
}
