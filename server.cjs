/* HOSTELERO · server.cjs — servidor LOCAL (LAN, sin internet, sin dependencias npm).
   - Sirve cada app en su propio puerto.
   - Tiempo real por SSE.
   - Estado compartido: { master (carta/mesas), comandas } persistido en servicio.json.
   Arranque:  node server.cjs    (puertos configurables en PUERTOS)
*/
'use strict';
var http = require('http'), fs = require('fs'), path = require('path');
var DIR = __dirname;
var DATAFILE = path.join(DIR, 'servicio.json');

var PUERTOS = {
  7870: 'index.html',            // Acceso / lanzador
  7871: 'HOSTELERO-TPV.html',    // TPV de venta
  7872: 'Comandera-Movil.html',  // Comandera (smartphone)
  7873: 'Cocina-KDS.html',       // Monitor de cocina (KDS)
  7874: 'Admin.html'             // Administración
};

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function masterSeed() {
  var cats = [
    { id: 'c1', nombre: 'Bebidas',     color: '#0ea5e9', ic: '🥤', orden: 1, pase: 'Bebidas' },
    { id: 'c2', nombre: 'Cervezas',    color: '#d97706', ic: '🍺', orden: 2, pase: 'Bebidas' },
    { id: 'c3', nombre: 'Entrantes',   color: '#16a34a', ic: '🥗', orden: 3, pase: 'Entrantes' },
    { id: 'c4', nombre: 'Principales', color: '#7c3aed', ic: '🥩', orden: 4, pase: 'Segundos' },
    { id: 'c5', nombre: 'Postres',     color: '#db2777', ic: '🍰', orden: 5, pase: 'Postres' }
  ];
  function p(id, n, cat, precio, ic, pase) { return { id: id, nombre: n, categoriaId: cat, precio: precio, ic: ic, pasePorDefecto: pase, activo: true, stock: 100 }; }
  var prods = [
    p('p1','Caña','c1',1.8,'🍺','Bebidas'), p('p2','Doble','c1',2.6,'🍺','Bebidas'), p('p3','Refresco','c1',2.2,'🥤','Bebidas'), p('p4','Agua 50cl','c1',1.5,'💧','Bebidas'), p('p5','Copa Vino','c1',2.4,'🍷','Bebidas'), p('p6','Café','c1',1.3,'☕','Bebidas'),
    p('p7','Tercio','c2',2.8,'🍺','Bebidas'), p('p8','Cerveza Sin','c2',2.4,'🍺','Bebidas'), p('p9','IPA Artesana','c2',3.8,'🍺','Bebidas'),
    p('p10','Ensalada Mixta','c3',6.5,'🥗','Entrantes'), p('p11','Gazpacho','c3',4.5,'🍅','Entrantes'), p('p12','Croquetas','c3',6.0,'🧆','Entrantes'), p('p13','Patatas Bravas','c3',4.5,'🍟','Entrantes'), p('p14','Ensaladilla','c3',4.0,'🥔','Entrantes'),
    p('p15','Entrecot','c4',18,'🥩','Segundos'), p('p16','Solomillo','c4',21,'🥩','Segundos'), p('p17','Pollo Corral','c4',12,'🍗','Segundos'), p('p18','Paella','c4',16,'🥘','Segundos'), p('p19','Calamares','c4',11,'🦑','Segundos'), p('p20','Pulpo','c4',17,'🐙','Segundos'),
    p('p21','Tarta de Queso','c5',5,'🍰','Postres'), p('p22','Flan','c5',3.8,'🍮','Postres'), p('p23','Helado','c5',3.5,'🍨','Postres'), p('p24','Fruta','c5',3,'🍓','Postres')
  ];
  function setm(id, mods){ var p=prods.filter(function(x){return x.id===id;})[0]; if(p)p.mods=mods; }
  setm('p6',[{n:'Leche',op:[{n:'Normal'},{n:'Desnatada'},{n:'Avena',p:0.3},{n:'Soja',p:0.3}]}]);
  setm('p13',[{n:'Salsa',op:[{n:'Brava'},{n:'Alioli'},{n:'Mixta'}]},{n:'Tamaño',op:[{n:'Tapa'},{n:'Ración',p:2}]}]);
  setm('p15',[{n:'Punto',op:[{n:'Poco hecho'},{n:'Al punto'},{n:'Muy hecho'}]},{n:'Guarnición',op:[{n:'Patatas'},{n:'Ensalada'},{n:'Verduras',p:1.5}]},{n:'Extras',tipo:'check',op:[{n:'Huevo frito',p:1},{n:'Foie',p:4}]}]);
  setm('p16',[{n:'Punto',op:[{n:'Poco hecho'},{n:'Al punto'},{n:'Muy hecho'}]},{n:'Guarnición',op:[{n:'Patatas'},{n:'Ensalada'},{n:'Verduras',p:1.5}]}]);
  setm('p10',[{n:'Extras',tipo:'check',op:[{n:'Atún',p:1.5},{n:'Queso',p:1},{n:'Pollo',p:2}]}]);
  cats.unshift({ id: 'c0', nombre: 'Menús', color: '#4f46e5', ic: '🍽️', orden: 0, pase: 'Primeros' });
  prods.unshift(
    { id:'menu1', nombre:'Menú del Día', categoriaId:'c0', precio:13.9, ic:'🍽️', pasePorDefecto:'Primeros', activo:true, esMenu:true, pasos:[
      {n:'Primero',op:[{n:'Ensalada Mixta'},{n:'Gazpacho'},{n:'Croquetas'}]},
      {n:'Segundo',op:[{n:'Pollo'},{n:'Calamares'},{n:'Entrecot',p:3}]},
      {n:'Postre',op:[{n:'Flan'},{n:'Tarta de Queso'},{n:'Fruta'}]},
      {n:'Bebida',op:[{n:'Agua'},{n:'Caña'},{n:'Refresco'}]} ]},
    { id:'menu2', nombre:'Menú Infantil', categoriaId:'c0', precio:8.5, ic:'🧒', pasePorDefecto:'Primeros', activo:true, esMenu:true, pasos:[
      {n:'Plato',op:[{n:'Nuggets'},{n:'Macarrones'}]},
      {n:'Postre',op:[{n:'Helado'},{n:'Fruta'}]},
      {n:'Bebida',op:[{n:'Agua'},{n:'Zumo'}]} ]}
  );
  var salas = [{ id: 's1', nombre: 'Comedor' }, { id: 's2', nombre: 'Terraza' }, { id: 's3', nombre: 'Barra' }, { id: 's4', nombre: 'Reservado' }];
  var mesas = [];
  for (var i = 1; i <= 10; i++) mesas.push({ id: 'm' + i, salaId: 's1', nombre: 'M' + i, forma: (i % 2 ? 'cuadrada' : 'redonda'), plazas: 4 });
  for (var j = 1; j <= 6; j++) mesas.push({ id: 't' + j, salaId: 's2', nombre: 'T' + j, forma: 'redonda', plazas: 2 });
  for (var k = 1; k <= 6; k++) mesas.push({ id: 'b' + k, salaId: 's3', nombre: 'B' + k, forma: 'barra', plazas: 1 });
  mesas.push({ id: 'r1', salaId: 's4', nombre: 'Reservado A', forma: 'rectangular', plazas: 12 }, { id: 'r2', salaId: 's4', nombre: 'Reservado B', forma: 'rectangular', plazas: 12 });
  var usuarios = [
    { id: 'u1', nombre: 'Admin',     rol: 'admin',     pin: '1111', usuario: 'admin',     password: 'admin', color: '#4f46e5', activo: true },
    { id: 'u2', nombre: 'Encargado', rol: 'encargado', pin: '2222', usuario: 'encargado', password: '1234',  color: '#0891b2', activo: true },
    { id: 'u3', nombre: 'Marta',     rol: 'camarero',  pin: '3333', color: '#16a34a', activo: true },
    { id: 'u4', nombre: 'Luis',      rol: 'camarero',  pin: '4444', color: '#15803d', activo: true },
    { id: 'u5', nombre: 'Cocina',    rol: 'cocina',    pin: '9999', color: '#d97706', activo: true }
  ];
  return { version: 2, categorias: cats, productos: prods, salas: salas, mesas: mesas, usuarios: usuarios };
}

function cargar() {
  var s; try { s = JSON.parse(fs.readFileSync(DATAFILE, 'utf8')); } catch (e) { s = {}; }
  if (!s.comandas) s.comandas = [];
  if (!s.master || !s.master.productos || !s.master.productos.length || s.master.version !== masterSeed().version) s.master = masterSeed();
  if (!s.master.usuarios || !s.master.usuarios.length) s.master.usuarios = masterSeed().usuarios;
  if (!s.fichajes) s.fichajes = [];
  if (typeof s.v !== 'number') s.v = 0;
  return s;
}

var state = cargar();
var clientes = [];

function guardar() { try { fs.writeFileSync(DATAFILE, JSON.stringify(state)); } catch (e) {} }
function difundir() { var msg = 'data: ' + JSON.stringify(state) + '\n\n'; clientes.slice().forEach(function (c) { try { c.write(msg); } catch (e) {} }); }
function getC(id) { return state.comandas.filter(function (c) { return c.id === id; })[0]; }

function aplicar(accion, d) {
  if (accion === '/api/comanda') {
    d.id = uid(); d.createdAt = Date.now(); d.estado = 'pendiente'; d.avisado = false;
    (d.lineas || []).forEach(function (l) { l.kid = l.kid || uid(); l.estado = l.estado || 'pendiente'; });
    state.comandas.push(d);
  } else if (accion === '/api/linea') {
    var c = getC(d.id); if (c) { var l = (c.lineas || []).filter(function (x) { return x.kid === d.kid; })[0]; if (l) l.estado = d.estado; }
  } else if (accion === '/api/avisar') { var c2 = getC(d.id); if (c2) { c2.avisado = true; c2.avisadoAt = Date.now(); }
  } else if (accion === '/api/recoger') { var c3 = getC(d.id); if (c3) { c3.estado = 'recogida'; c3.avisado = false; }
  } else if (accion === '/api/reset') { state.comandas = [];
  } else if (accion === '/api/master') { if (d.master) state.master = d.master;
  } else if (accion === '/api/fichaje') { if (d.registro) { d.registro.id = d.registro.id || uid(); state.fichajes.push(d.registro); } }
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
    if (pathname === '/api/stream') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*' });
      res.write('retry: 2000\n'); res.write('data: ' + JSON.stringify(state) + '\n\n');
      clientes.push(res);
      req.on('close', function () { var i = clientes.indexOf(res); if (i >= 0) clientes.splice(i, 1); });
      return;
    }
    if (pathname === '/api/state') { res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); return res.end(JSON.stringify(state)); }
    if (req.method === 'POST' && pathname.indexOf('/api/') === 0) {
      var body = ''; req.on('data', function (d) { body += d; if (body.length > 4e6) req.destroy(); });
      req.on('end', function () {
        var d = {}; try { d = JSON.parse(body || '{}'); } catch (e) {}
        aplicar(pathname, d); guardar(); difundir();
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify({ ok: true, v: state.v }));
      });
      return;
    }
    servirEstatico(req, res, porDefecto);
  };
}

Object.keys(PUERTOS).forEach(function (port) {
  http.createServer(handler(PUERTOS[port])).listen(parseInt(port), '0.0.0.0', function () {
    console.log('  ' + PUERTOS[port].replace(/(.{22}).*/, '$1').padEnd(22) + ' →  http://<IP-del-PC>:' + port);
  });
});
console.log('HOSTELERO servidor local en marcha (WiFi, sin internet). Ctrl+C para parar.\nPuertos:');
