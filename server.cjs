/* HOSTELERO · server.js — servidor LOCAL (LAN, sin internet, sin dependencias npm).
   - Sirve cada app en su propio puerto.
   - Tiempo real por SSE (Server-Sent Events): la comanda del móvil aparece al instante en cocina.
   - Estado persistente en servicio.json (sobrevive a reinicios).
   Arranque:  node server.js
*/
'use strict';
var http = require('http'), fs = require('fs'), path = require('path');
var DIR = __dirname;
var DATAFILE = path.join(DIR, 'servicio.json');

// Un puerto por app (como Ágora)
var PUERTOS = {
  7870: 'index.html',            // Acceso / lanzador
  7871: 'HOSTELERO-TPV.html',    // TPV de venta
  7872: 'Comandera-Movil.html',  // Comandera (smartphone)
  7873: 'Cocina-KDS.html',       // Monitor de cocina (KDS)
  7874: 'Admin.html'             // Administración
};

var state = cargar();
var clientes = []; // conexiones SSE abiertas (todas las apps/dispositivos)

function cargar() { try { return JSON.parse(fs.readFileSync(DATAFILE, 'utf8')); } catch (e) { return { comandas: [], v: 0 }; } }
function guardar() { try { fs.writeFileSync(DATAFILE, JSON.stringify(state)); } catch (e) {} }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function difundir() {
  var msg = 'data: ' + JSON.stringify(state) + '\n\n';
  clientes.slice().forEach(function (c) { try { c.write(msg); } catch (e) {} });
}
function getC(id) { return state.comandas.filter(function (c) { return c.id === id; })[0]; }

function aplicar(accion, d) {
  if (accion === '/api/comanda') {
    d.id = uid(); d.createdAt = Date.now(); d.estado = 'pendiente'; d.avisado = false;
    (d.lineas || []).forEach(function (l) { l.kid = l.kid || uid(); l.estado = l.estado || 'pendiente'; });
    state.comandas.push(d);
  } else if (accion === '/api/linea') {
    var c = getC(d.id); if (c) { var l = (c.lineas || []).filter(function (x) { return x.kid === d.kid; })[0]; if (l) l.estado = d.estado; }
  } else if (accion === '/api/avisar') {
    var c2 = getC(d.id); if (c2) { c2.avisado = true; c2.avisadoAt = Date.now(); }
  } else if (accion === '/api/recoger') {
    var c3 = getC(d.id); if (c3) { c3.estado = 'recogida'; c3.avisado = false; }
  } else if (accion === '/api/reset') {
    state.comandas = [];
  }
  state.v = (state.v || 0) + 1;
}

var TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

function servirEstatico(req, res, porDefecto) {
  var pathname = decodeURIComponent(req.url.split('?')[0]);
  if (pathname === '/' || pathname === '') pathname = '/' + porDefecto;
  var rel = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  var file = path.join(DIR, rel);
  if (file.indexOf(DIR) !== 0) { res.writeHead(403); return res.end('403'); }
  fs.readFile(file, function (err, data) {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('No encontrado: ' + rel); }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}

function handler(porDefecto) {
  return function (req, res) {
    var pathname = req.url.split('?')[0];
    // SSE: stream de estado en tiempo real
    if (pathname === '/api/stream') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*' });
      res.write('retry: 2000\n');
      res.write('data: ' + JSON.stringify(state) + '\n\n');
      clientes.push(res);
      req.on('close', function () { var i = clientes.indexOf(res); if (i >= 0) clientes.splice(i, 1); });
      return;
    }
    if (pathname === '/api/state') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify(state));
    }
    if (req.method === 'POST' && pathname.indexOf('/api/') === 0) {
      var body = ''; req.on('data', function (d) { body += d; if (body.length > 1e6) req.destroy(); });
      req.on('end', function () {
        var d = {}; try { d = JSON.parse(body || '{}'); } catch (e) {}
        aplicar(pathname, d); guardar(); difundir();
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: true, v: state.v }));
      });
      return;
    }
    servirEstatico(req, res, porDefecto);
  };
}

Object.keys(PUERTOS).forEach(function (port) {
  http.createServer(handler(PUERTOS[port])).listen(parseInt(port), '0.0.0.0', function () {
    console.log('  ' + PUERTOS[port].padEnd(22) + ' →  http://<IP-del-PC>:' + port);
  });
});
console.log('HOSTELERO servidor local en marcha (WiFi, sin internet). Ctrl+C para parar.\nPuertos:');
