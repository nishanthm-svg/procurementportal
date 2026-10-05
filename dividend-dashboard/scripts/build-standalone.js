// Inline the Vite build (JS + CSS) and the gzipped data into ONE html file
// that opens straight from disk or any static host: dist/Members_Dividend_Dashboard.html
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const dist = path.join(root, 'dist')
let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')

// Function replacers throughout: minified code is full of `$&`-style sequences
html = html.replace(/<link rel="stylesheet"[^>]*href="\.\/([^"]+)"[^>]*>/g, (_, f) =>
  `<style>${fs.readFileSync(path.join(dist, f), 'utf8')}</style>`)

let app = ''
html = html.replace(/<script type="module"[^>]*src="\.\/([^"]+)"[^>]*><\/script>/g, (_, f) => {
  app = fs.readFileSync(path.join(dist, f), 'utf8').replace(/<\/script/gi, () => '<\\/script')
  return ''
})

const data = fs.readFileSync(path.join(root, 'public', 'dividend.json.gz')).toString('base64')
html = html.replace('</body>', () =>
  `<script>window.__DIVIDEND_GZ__="${data}"</script>\n<script type="module">${app}</script>\n</body>`)

const out = path.join(dist, 'Members_Dividend_Dashboard.html')
fs.writeFileSync(out, html)
console.log(`Standalone file: ${out} (${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`)
