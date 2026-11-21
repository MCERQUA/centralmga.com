// Tiny static server for ./out with Netlify-like clean URLs (/acord-125 -> acord-125.html). Local verification only.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const root = join(process.cwd(), 'out'), port = Number(process.env.PORT || 3123)
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.pdf': 'application/pdf', '.png': 'image/png', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.wasm': 'application/wasm' }
const tryFile = async (p) => { try { return (await stat(p)).isFile() ? p : null } catch { return null } }
createServer(async (req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = normalize(join(root, u)); if (!p.startsWith(root)) { res.writeHead(403).end(); return }
  const f = (await tryFile(p)) || (await tryFile(p + '.html')) || (await tryFile(join(p, 'index.html')))
  if (!f) { res.writeHead(404, { 'content-type': 'text/plain' }).end('404'); return }
  res.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream' }).end(await readFile(f))
}).listen(port, '127.0.0.1', () => console.log('serving out on http://127.0.0.1:' + port))
