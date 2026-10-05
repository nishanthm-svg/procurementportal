// Members dividend data — share capital invested vs cumulative dividend received.
// Runs entirely in the browser. The standalone build embeds the gzipped data as
// base64 in window.__DIVIDEND_GZ__; in dev it is fetched from public/dividend.json.gz.

let YEARS = []
let MEMBERS = []      // { n, c, f, a, s, y[], d, r, mi } sorted by dividend desc
let MPPS = []         // aggregated villages
let TREE = []
let TOTAL = null

const RETURN_BANDS = [
  { label: 'No dividend yet', test: (m) => m.d === 0 },
  { label: 'Below 10%', test: (m) => m.d > 0 && m.r < 0.10 },
  { label: '10 – 25%', test: (m) => m.r >= 0.10 && m.r < 0.25 },
  { label: '25 – 50%', test: (m) => m.r >= 0.25 && m.r < 0.50 },
  { label: '50 – 75%', test: (m) => m.r >= 0.50 && m.r < 0.75 },
  { label: '75% +', test: (m) => m.r >= 0.75 },
]

function blank() {
  return { members: 0, share: 0, div: 0, years: new Array(YEARS.length).fill(0), zeroDiv: 0, newMembers: 0 }
}

function add(agg, m) {
  agg.members++
  agg.share += m.s
  agg.div += m.d
  for (let i = 0; i < m.y.length; i++) agg.years[i] += m.y[i]
  if (m.d === 0) agg.zeroDiv++
  if (m.a === 'NEW') agg.newMembers++
}

async function readRaw() {
  let bytes
  if (window.__DIVIDEND_GZ__) {
    const bin = atob(window.__DIVIDEND_GZ__)
    bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  } else {
    bytes = new Uint8Array(await (await fetch('dividend.json.gz')).arrayBuffer())
  }
  // Already-decoded JSON (some dev servers transparently gunzip)
  if (bytes[0] === 0x7b) return JSON.parse(new TextDecoder().decode(bytes))
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
  return new Response(stream).json()
}

let loading = null
export function loadData() {
  return (loading ||= readRaw().then(build))
}

function build(raw) {
  YEARS = raw.years
  MEMBERS = []
  MPPS = raw.mpps.map((p, mi) => {
    const agg = { i: mi, k: p.k, name: p.name, code: p.code, aco: p.aco, bmcu: p.bmcu, plant: p.plant, ...blank() }
    for (const row of p.m) {
      const y = row.slice(5)
      const d = y.reduce((a, b) => a + b, 0)
      const m = { n: row[0], c: row[1], f: row[2], a: row[3], s: row[4], y, d, r: row[4] ? d / row[4] : 0, mi }
      add(agg, m)
      MEMBERS.push(m)
    }
    return agg
  })
  MEMBERS.sort((a, b) => b.d - a.d || b.s - a.s)

  TOTAL = blank()
  const acos = {}
  for (const p of MPPS) {
    const a = (acos[p.aco] ||= { aco: p.aco, members: 0, share: 0, div: 0, bmcus: {} })
    const b = (a.bmcus[p.bmcu] ||= { bmcu: p.bmcu, plant: p.plant, members: 0, share: 0, div: 0, mpps: [] })
    for (const t of [a, b]) { t.members += p.members; t.share += p.share; t.div += p.div }
    b.mpps.push({ k: p.k, name: p.name, code: p.code, members: p.members, share: p.share, div: p.div })
  }
  for (const m of MEMBERS) add(TOTAL, m)
  const byName = (x, y) => (x.name || x.bmcu || x.aco).localeCompare(y.name || y.bmcu || y.aco)
  TREE = Object.values(acos)
    .map((a) => ({ ...a, bmcus: Object.values(a.bmcus).map((b) => ({ ...b, mpps: b.mpps.sort(byName) })).sort(byName) }))
    .sort(byName)
}

function inScope(p, q) {
  return (!q.aco || p.aco === q.aco) && (!q.bmcu || p.bmcu === q.bmcu) && (!q.mpp || p.k === q.mpp)
}

function memberOut(m, rank) {
  const p = MPPS[m.mi]
  return { rank, name: m.n, code: m.c, folio: m.f, allot: m.a, share: m.s, div: m.d, ret: m.r, years: m.y, mpp: p.name, mppKey: p.k, bmcu: p.bmcu, aco: p.aco }
}

function leaderboard(mpps, keyFn, top, extra) {
  const g = {}
  for (const p of mpps) {
    const key = keyFn(p)
    const t = (g[key] ||= { name: key, members: 0, share: 0, div: 0, villages: 0, ...extra(p) })
    t.members += p.members; t.share += p.share; t.div += p.div; t.villages++
  }
  const rows = Object.values(g).map((t) => ({ ...t, ret: t.share ? t.div / t.share : 0, perMember: t.members ? t.div / t.members : 0 }))
  rows.sort((a, b) => b.div - a.div)
  return { count: rows.length, rows: rows.slice(0, top) }
}

export function getMeta() {
  return { years: YEARS, total: { members: TOTAL.members, share: TOTAL.share, div: TOTAL.div }, tree: TREE }
}

export function getScope({ aco = '', bmcu = '', mpp = '', top = 5 }) {
  const q = { aco, bmcu, mpp }
  top = Math.max(1, Math.min(parseInt(top) || 5, 50))
  const level = q.mpp ? 'mpp' : q.bmcu ? 'bmcu' : q.aco ? 'aco' : 'all'

  const mpps = MPPS.filter((p) => inScope(p, q))
  const idx = new Set(mpps.map((p) => p.i))
  const members = level === 'all' ? MEMBERS : MEMBERS.filter((m) => idx.has(m.mi))

  const agg = blank()
  const bands = RETURN_BANDS.map((b) => ({ label: b.label, count: 0 }))
  let halfBack = 0
  for (const m of members) {
    add(agg, m)
    if (m.r >= 0.5) halfBack++
    const bi = RETURN_BANDS.findIndex((b) => b.test(m))
    if (bi >= 0) bands[bi].count++
  }
  let cum = 0
  const years = YEARS.map((y, i) => ({ year: `FY ${y}`, div: agg.years[i], cum: (cum += agg.years[i]) }))

  const out = {
    level, query: q, top,
    kpis: {
      members: agg.members, share: agg.share, div: agg.div,
      ret: agg.share ? agg.div / agg.share : 0,
      perMember: agg.members ? agg.div / agg.members : 0,
      zeroDiv: agg.zeroDiv, newMembers: agg.newMembers, halfBack,
      villages: mpps.length,
      bmcus: new Set(mpps.map((p) => p.bmcu)).size,
      acos: new Set(mpps.map((p) => p.aco)).size,
      latestYear: YEARS[YEARS.length - 1],
      latestDiv: agg.years[YEARS.length - 1],
      prevDiv: agg.years[YEARS.length - 2],
    },
    years,
    bands,
    topMembers: members.slice(0, top).map((m, i) => memberOut(m, i + 1)),
  }
  if (level === 'all') out.topAcos = leaderboard(mpps, (p) => p.aco, top, () => ({}))
  if (level === 'all' || level === 'aco') out.topBmcus = leaderboard(mpps, (p) => p.bmcu, top, (p) => ({ aco: p.aco, plant: p.plant }))
  if (level !== 'mpp') {
    out.topMpps = leaderboard(mpps, (p) => p.k, top, (p) => ({ village: p.name, code: p.code, bmcu: p.bmcu, aco: p.aco }))
    out.topMpps.rows = out.topMpps.rows.map((r) => ({ ...r, key: r.name, name: r.village }))
  } else {
    const p = mpps[0]
    out.village = p ? { key: p.k, name: p.name, code: p.code, bmcu: p.bmcu, aco: p.aco, plant: p.plant } : null
    out.members = members.map((m, i) => memberOut(m, i + 1))
  }
  return out
}
