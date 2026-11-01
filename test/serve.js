// Servidor estático mínimo para las pruebas: el juego se carga por HTTP, como en GitHub Pages o el artefacto
// (por file://, Chromium a veces arranca una página recargada con localStorage vacío)
const http = require('http'), fs = require('fs'), path = require('path');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.css': 'text/css' };
module.exports = () => new Promise(done => {
  const root = path.resolve(__dirname, '..');
  const srv = http.createServer((req, res) => {
    const f = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
    if (!f.startsWith(root)) { res.writeHead(403); res.end(); return; }
    fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(data); });
  });
  srv.listen(0, '127.0.0.1', () => done({ url: `http://127.0.0.1:${srv.address().port}/index.html`, close: () => srv.close() }));
});
