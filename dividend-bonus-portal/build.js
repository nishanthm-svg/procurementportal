// Build the per-ACO locked Dividend & Bonus portal.
//   data/portal.json (from build_data.py) -> dist/index.html     (publish)
//                                           dist/d/<LOGIN>.bin  (publish; one encrypted data file per login)
//                                           dist/credentials.csv (hand out; never publish)
// Each login (ADMIN, each ACO) gets its own slice of the members, gzipped and AES-256-GCM
// encrypted with a key derived (PBKDF2-SHA256) from that person's password. The browser only
// downloads its own file after login and decrypts it locally; nothing readable is published.
// Login IDs and passwords persist in the git-ignored .credentials.json so they stay the same
// at every data refresh; new ACOs get new ones automatically.
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const crypto = require('crypto')

const root = __dirname
const ITER = 250000
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'portal.json'), 'utf8'))
const credFile = path.join(root, '.credentials.json')
const creds = fs.existsSync(credFile) ? JSON.parse(fs.readFileSync(credFile, 'utf8')) : {}

const LETTERS = 'abcdefghjkmnpqrstuvwxyz'
const newPassword = () => Array.from({ length: 4 }, () => LETTERS[crypto.randomInt(LETTERS.length)]).join('') +
  String(crypto.randomInt(1000, 10000))
function login(role, name) {
  const key = role + ':' + name
  if (!creds[key]) {
    const used = new Set(Object.values(creds).map((c) => c.id))
    let n = 1, id
    if (role === 'admin') id = 'ADMIN'
    else do { id = 'ACO' + String(n++).padStart(2, '0') } while (used.has(id))
    creds[key] = { id, role, name, password: newPassword() }
  }
  return creds[key]
}

const people = [{ c: login('admin', 'Administrator'), acos: new Set(data.acos.map((_, i) => i)), roleLabel: 'Admin · all ACOs' }]
for (const [i, aco] of data.acos.entries()) people.push({ c: login('aco', aco), acos: new Set([i]), roleLabel: 'ACO' })
fs.writeFileSync(credFile, JSON.stringify(creds, null, 2))

// Re-index MPPs and ACOs so a slice only carries what its owner can see
function slice(acoSet) {
  const members = data.members.filter((m) => acoSet.has(m[1]))
  const mppMap = new Map(), acoMap = new Map(), mpps = [], acos = []
  const out = members.map((m) => {
    if (!mppMap.has(m[0])) { mppMap.set(m[0], mpps.length); mpps.push(data.mpps[m[0]]) }
    if (!acoMap.has(m[1])) { acoMap.set(m[1], acos.length); acos.push(data.acos[m[1]]) }
    return [mppMap.get(m[0]), acoMap.get(m[1]), ...m.slice(2)]
  })
  return { acos, mpps, members: out }
}

const dist = path.join(root, 'dist')
fs.rmSync(path.join(dist, 'd'), { recursive: true, force: true })
fs.mkdirSync(path.join(dist, 'd'), { recursive: true })
const logins = people.filter((p) => p.c.role === 'aco').map((p) => [p.c.id, p.c.name])
for (const p of people) {
  const s = slice(p.acos)
  const body = {
    meta: data.meta, user: { id: p.c.id, name: p.c.name, role: p.c.role, roleLabel: p.roleLabel }, ...s,
    ...(p.c.role === 'admin' ? { logins } : {}),
  }
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12)
  const key = crypto.pbkdf2Sync(p.c.password, salt, ITER, 32, 'sha256')
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([salt, iv, cipher.update(zlib.gzipSync(JSON.stringify(body), { level: 9 })), cipher.final(), cipher.getAuthTag()])
  fs.writeFileSync(path.join(dist, 'd', p.c.id + '.bin'), enc)
  p.count = s.members.length
  p.mpps = s.mpps.length
}

const logo = (f) => 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'assets', f)).toString('base64')
const html = fs.readFileSync(path.join(root, 'src', 'app.html'), 'utf8')
  .replace('/*__LOCK__*/null', () => JSON.stringify({ iter: ITER, ids: people.map((p) => p.c.id), v: Date.now().toString(36) }))
  .replaceAll('__LOGO_SHREEJA__', logo('shreeja_logo.png'))
  .replaceAll('__LOGO_NDDB__', logo('nddb_logo.png'))
  .replaceAll('__LOGO_NDS__', logo('nddb_dairy_services_logo.png'))
fs.writeFileSync(path.join(dist, 'index.html'), html)

const q = (v) => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v)
const rows = [['Login ID', 'Role', 'ACO name', 'Password', 'MPPs', 'Members']]
for (const p of people) rows.push([p.c.id, p.c.role === 'aco' ? 'ACO' : 'Admin', p.c.name, p.c.password, p.mpps, p.count])
fs.writeFileSync(path.join(dist, 'credentials.csv'), '﻿' + rows.map((r) => r.map(q).join(',')).join('\r\n'))
const mb = (f) => (fs.statSync(f).size / 1e6).toFixed(2)
console.log(`dist/index.html ${mb(path.join(dist, 'index.html'))} MB · ADMIN data ${mb(path.join(dist, 'd', 'ADMIN.bin'))} MB · ${people.length} logins · dist/credentials.csv`)
