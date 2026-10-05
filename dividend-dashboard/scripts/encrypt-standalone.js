// Password-lock the standalone dashboard for public hosting.
// The whole page (including all member data) is gzipped and encrypted with
// AES-256-GCM, key derived from the password with PBKDF2-SHA256. The output only
// contains ciphertext plus a small unlock screen; the browser decrypts locally.
//
// Password comes from $DIVIDEND_PASSWORD or the git-ignored file `.password`.
// Output: dist/Members_Dividend_Dashboard.locked.html
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const crypto = require('crypto')

const root = path.join(__dirname, '..')
const dist = path.join(root, 'dist')
const pwFile = path.join(root, '.password')
const password = (process.env.DIVIDEND_PASSWORD || (fs.existsSync(pwFile) ? fs.readFileSync(pwFile, 'utf8') : '')).trim()
if (!password) {
  console.log('No password set (.password or DIVIDEND_PASSWORD) — skipping locked build')
  process.exit(0)
}

const ITERATIONS = 600000
const plain = zlib.gzipSync(fs.readFileSync(path.join(dist, 'Members_Dividend_Dashboard.html')), { level: 9 })
const salt = crypto.randomBytes(16)
const iv = crypto.randomBytes(12)
const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256')
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
// WebCrypto expects the auth tag appended to the ciphertext
const data = Buffer.concat([cipher.update(plain), cipher.final(), cipher.getAuthTag()])

const logo = (f) => 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'src', 'assets', f)).toString('base64')
const payload = JSON.stringify({ v: 1, iter: ITERATIONS, salt: salt.toString('base64'), iv: iv.toString('base64'), data: data.toString('base64') })

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="robots" content="noindex, nofollow" />
<title>Members Dividend</title>
<style>
  :root { --green: #047857; --ink: #1e293b; --muted: #64748b; --line: #e2e8f0; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: flex; flex-direction: column; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; color: var(--ink); background: #f8fafc; }
  header { background: #fff; border-bottom: 1px solid var(--line); padding: 14px 16px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
  header img.main { height: 48px; }
  .support { display: flex; align-items: center; gap: 10px; }
  .support span { font-size: 10px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: #94a3b8; }
  .support img { height: 36px; }
  main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 32px 16px; background: linear-gradient(125deg, #064e3b 0%, #047857 55%, #0f766e 100%); }
  form { width: 100%; max-width: 380px; background: #fff; border-radius: 16px; padding: 28px 24px; box-shadow: 0 20px 50px rgba(0,0,0,.25); }
  h1 { font-size: 20px; margin: 0 0 4px; }
  p { margin: 0 0 18px; color: var(--muted); font-size: 14px; line-height: 1.45; }
  label { font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
  input { width: 100%; margin-top: 6px; padding: 11px 12px; font-size: 16px; border: 1px solid var(--line); border-radius: 10px; outline: none; }
  input:focus { border-color: #34d399; box-shadow: 0 0 0 3px #d1fae5; }
  button { width: 100%; margin-top: 14px; padding: 11px; font-size: 15px; font-weight: 700; color: #fff; background: var(--green); border: 0; border-radius: 10px; cursor: pointer; }
  button:disabled { opacity: .6; cursor: wait; }
  .err { color: #dc2626; font-size: 13px; min-height: 18px; margin-top: 10px; }
</style>
</head>
<body>
<header>
  <img class="main" src="${logo('shreeja_logo.png')}" alt="Shreeja Mahila Milk Producer Company" />
  <div class="support"><span>Supported by</span>
    <img src="${logo('nddb_logo.png')}" alt="National Dairy Development Board" />
    <img src="${logo('nddb_dairy_services_logo.png')}" alt="NDDB Dairy Services" />
  </div>
</header>
<main>
  <form id="f" autocomplete="off">
    <h1>Members Dividend</h1>
    <p>This report contains member details. Enter the password you were given to open it.</p>
    <label for="pw">Password</label>
    <input id="pw" type="password" autofocus required />
    <button id="b" type="submit">Open report</button>
    <div class="err" id="e" role="alert"></div>
  </form>
</main>
<script>
const P = ${payload};
const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const SKEY = 'dividend-key';

async function open(key) {
  const buf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(P.iv) }, key, b64(P.data));
  const html = await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  document.open(); document.write(html); document.close();
}

async function keyFrom(pw) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(P.salt), iterations: P.iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, true, ['decrypt']);
}

// Stay unlocked for this browser tab only (cleared when the tab closes)
(async () => {
  try {
    const saved = sessionStorage.getItem(SKEY);
    if (saved) await open(await crypto.subtle.importKey('raw', b64(saved), 'AES-GCM', false, ['decrypt']));
  } catch (_) { try { sessionStorage.removeItem(SKEY); } catch (_) {} }
})();

document.getElementById('f').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const btn = document.getElementById('b'), err = document.getElementById('e');
  btn.disabled = true; btn.textContent = 'Opening…'; err.textContent = '';
  try {
    const key = await keyFrom(document.getElementById('pw').value);
    let raw;
    try { raw = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.exportKey('raw', key)))); } catch (_) {}
    try { if (raw) sessionStorage.setItem(SKEY, raw); } catch (_) {}
    await open(key);
  } catch (_) {
    try { sessionStorage.removeItem(SKEY); } catch (_) {}
    err.textContent = 'Wrong password. Please try again.';
    btn.disabled = false; btn.textContent = 'Open report';
  }
});
</script>
</body>
</html>
`

const out = path.join(dist, 'Members_Dividend_Dashboard.locked.html')
fs.writeFileSync(out, html)
console.log(`Locked file: ${out} (${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`)
