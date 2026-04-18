const BASE = '/api'

async function get(path, params = {}) {
  const url = new URL(BASE + path, window.location.origin)
  Object.entries(params).forEach(([k, v]) => v != null && v !== '' && url.searchParams.set(k, v))
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
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
}
