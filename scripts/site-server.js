const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const mount = '/app-releases';
const mime = { '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.js': 'text/javascript', '.css': 'text/css' };

function createSiteServer(root) {
  return http.createServer((request, response) => {
    let requested;
    try { requested = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
    catch { response.writeHead(400); response.end('Bad URL'); return; }
    if (!requested.startsWith(mount + '/')) { response.writeHead(404); response.end('Outside Pages mount'); return; }
    requested = requested.slice(mount.length);
    if (requested.endsWith('/')) requested += 'index.html';
    const file = path.resolve(root, '.' + requested);
    const relative = path.relative(root, file);
    if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) {
      response.writeHead(403); response.end('Outside site root'); return;
    }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404); response.end('Not found'); return;
    }
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(response);
  });
}
module.exports = { createSiteServer, mount };
