/* HOSTELERO · server.cjs — servidor LOCAL (LAN, sin internet, sin dependencias npm).
   - Sirve cada app en su propio puerto.
   - Tiempo real por SSE.
   - Estado compartido: { master (carta/mesas), comandas } persistido en servicio.json.
   Arranque:  node server.cjs    (puertos configurables en PUERTOS)
*/
'use strict';
var http = require('http'), fs = require('fs'), path = require('path'), net = require('net');
var DIR = __dirname;
var DATAFILE = path.join(DIR, 'servicio.json');

var PUERTOS = {
  7870: 'index.html',            // Acceso / lanzador
  7871: 'HOSTELERO-TPV.html',    // TPV de venta
  7872: 'Comandera-Movil.html',  // Comandera (smartphone)
  7873: 'Cocina-KDS.html',       // Monitor de cocina (KDS)
  7874: 'Admin.html',            // Administración
  7875: 'Carta-Digital.html'     // Carta digital (QR) + petición de reserva
};

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function masterSeed() {
  function FK(kw,l){ return 'https://loremflickr.com/640/480/'+kw+'?lock='+l; }
  var cats = [
    { id: 'c1', nombre: 'Bebidas',     color: '#0ea5e9', ic: '🥤', orden: 1, pase: 'Bebidas', zona: 'barra', imagen: FK('cocktail,drinks',11) },
    { id: 'c2', nombre: 'Cervezas',    color: '#d97706', ic: '🍺', orden: 2, pase: 'Bebidas', zona: 'barra', imagen: FK('beer,glass',12) },
    { id: 'c3', nombre: 'Entrantes',   color: '#16a34a', ic: '🥗', orden: 3, pase: 'Entrantes', zona: 'cocina', imagen: FK('tapas,appetizer',13) },
    { id: 'c4', nombre: 'Principales', color: '#7c3aed', ic: '🥩', orden: 4, pase: 'Segundos', zona: 'cocina', imagen: FK('steak,grill',14) },
    { id: 'c5', nombre: 'Postres',     color: '#db2777', ic: '🍰', orden: 5, pase: 'Postres', zona: 'cocina', imagen: FK('dessert,cake',15) }
  ];
  function p(id, n, cat, precio, ic, pase) { return { id: id, nombre: n, categoriaId: cat, precio: precio, ic: ic, pasePorDefecto: pase, activo: true, stock: 100 }; }
  var prods = [
    p('p1','Caña','c1',1.8,'🍺','Bebidas'), p('p2','Doble','c1',2.6,'🍺','Bebidas'), p('p3','Refresco','c1',2.2,'🥤','Bebidas'), p('p4','Agua 50cl','c1',1.5,'💧','Bebidas'), p('p5','Copa Vino','c1',2.4,'🍷','Bebidas'), p('p6','Café','c1',1.3,'☕','Bebidas'),
    p('p7','Tercio','c2',2.8,'🍺','Bebidas'), p('p8','Cerveza Sin','c2',2.4,'🍺','Bebidas'), p('p9','IPA Artesana','c2',3.8,'🍺','Bebidas'),
    p('p10','Ensalada Mixta','c3',6.5,'🥗','Entrantes'), p('p11','Gazpacho','c3',4.5,'🍅','Entrantes'), p('p12','Croquetas','c3',6.0,'🧆','Entrantes'), p('p13','Patatas Bravas','c3',4.5,'🍟','Entrantes'), p('p14','Ensaladilla','c3',4.0,'🥔','Entrantes'),
    p('p15','Entrecot','c4',18,'🥩','Segundos'), p('p16','Solomillo','c4',21,'🥩','Segundos'), p('p17','Pollo Corral','c4',12,'🍗','Segundos'), p('p18','Paella','c4',16,'🥘','Segundos'), p('p19','Calamares','c4',11,'🦑','Segundos'), p('p20','Pulpo','c4',17,'🐙','Segundos'),
    p('p21','Tarta de Queso','c5',5,'🍰','Postres'), p('p22','Flan','c5',3.8,'🍮','Postres'), p('p23','Helado','c5',3.5,'🍨','Postres'), p('p24','Fruta','c5',3,'🍓','Postres'),
    { id:'p25', nombre:'Rape a la plancha', categoriaId:'c4', precio:39, ic:'🐟', pasePorDefecto:'Segundos', activo:true, porPeso:true }
  ];
  function setc(id, coste){ var p=prods.filter(function(x){return x.id===id;})[0]; if(p)p.coste=coste; }
  // costes de ejemplo (escandallo) para que el Maître pueda optimizar márgenes
  setc('p10',2.0); setc('p12',2.7); setc('p15',7.6); setc('p16',9.0); setc('p18',5.2); setc('p20',7.5); setc('p25',22.0);
  function setimg(id,kw,l,desc){ var x=prods.filter(function(z){return z.id===id;})[0]; if(x){ x.imagen=FK(kw,l); if(desc)x.descripcion=desc; } }
  setimg('p1','beer,draft',101,'Caña de cerveza bien tirada.');
  setimg('p2','beer,glass',102,'Doble de cerveza de barril.');
  setimg('p3','soda,softdrink',103,'Refresco frío a elegir.');
  setimg('p4','water,bottle',104,'Agua mineral 50 cl.');
  setimg('p5','wine,glass',105,'Copa de vino de la casa, D.O. Rioja.');
  setimg('p6','coffee,espresso',106,'Café de tueste natural, recién molido.');
  setimg('p7','beer,bottle',107,'Tercio de cerveza nacional.');
  setimg('p8','beer,bottle',108,'Cerveza sin alcohol, bien fría.');
  setimg('p9','craft,beer',109,'IPA artesana local, lúpulo aromático.');
  setimg('p10','salad,fresh',110,'Hojas frescas, tomate, cebolla, atún y huevo.');
  setimg('p11','gazpacho,soup',111,'Gazpacho andaluz, fresco y suave.');
  setimg('p12','croquettes,fried',112,'Croquetas cremosas de jamón ibérico. 6 uds.');
  setimg('p13','potatoes,fried',113,'Patatas crujientes con salsa brava y alioli.');
  setimg('p14','potato,salad',114,'Ensaladilla rusa casera.');
  setimg('p15','steak,beef',115,'Entrecot madurado a la brasa con guarnición.');
  setimg('p16','beef,tenderloin',116,'Solomillo de ternera al punto que elijas.');
  setimg('p17','roast,chicken',117,'Pollo de corral asado, jugoso.');
  setimg('p18','paella,rice',118,'Paella de marisco, mínimo 2 personas.');
  setimg('p19','calamari,fried',119,'Calamares a la andaluza, recién fritos.');
  setimg('p20','octopus,seafood',120,'Pulpo a la gallega con pimentón y AOVE.');
  setimg('p21','cheesecake,dessert',121,'Tarta de queso casera horneada.');
  setimg('p22','flan,caramel',122,'Flan de huevo con caramelo.');
  setimg('p23','icecream,gelato',123,'Selección de helados artesanos.');
  setimg('p24','fruit,plate',124,'Fruta fresca de temporada.');
  setimg('p25','monkfish,fish',125,'Rape a la plancha, fresco del día.');
  setimg('menu1','lunch,menu',126,'Primero, segundo, postre y bebida.');
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
  var salas = [
    { id: 's1', nombre: 'Comedor',   bg: '#fdf6ec' },
    { id: 's2', nombre: 'Terraza',   bg: '#eef7ec' },
    { id: 's3', nombre: 'Barra',     bg: '#f4efe8' },
    { id: 's4', nombre: 'Reservado', bg: '#fbf3e0' }
  ];
  function mk(id, sala, nombre, forma, plazas, x, y){ return { id:id, salaId:sala, nombre:nombre, forma:forma, plazas:plazas, x:x, y:y }; }
  var mesas = [
    mk('m1','s1','M1','redonda',2,40,40),  mk('m2','s1','M2','redonda',2,190,40), mk('m3','s1','M3','cuadrada',4,340,40), mk('m4','s1','M4','cuadrada',4,500,40), mk('m5','s1','M5','redonda',2,660,40),
    mk('m6','s1','M6','cuadrada',4,40,210), mk('m7','s1','M7','redonda',2,210,210), mk('m8','s1','M8','cuadrada',6,520,210),
    mk('m9','s1','M9','redonda',2,40,370),  mk('m10','s1','M10','redonda',2,210,370),
    mk('t1','s2','T1','redonda',2,40,40),  mk('t2','s2','T2','redonda',2,190,40), mk('t3','s2','T3','redonda',2,340,40), mk('t4','s2','T4','redonda',4,500,40),
    mk('t5','s2','T5','redonda',2,40,210), mk('t6','s2','T6','redonda',2,190,210),
    mk('b1','s3','B1','barra',1,40,140), mk('b2','s3','B2','barra',1,132,140), mk('b3','s3','B3','barra',1,224,140), mk('b4','s3','B4','barra',1,316,140), mk('b5','s3','B5','barra',1,408,140), mk('b6','s3','B6','barra',1,500,140),
    mk('r1','s4','Reservado A','rectangular',12,90,90), mk('r2','s4','Reservado B','rectangular',12,90,230)
  ];
  var decor = [
    { id:'d1', salaId:'s1', tipo:'billar', x:430, y:360 },
    { id:'d2', salaId:'s1', tipo:'planta', x:700, y:210 },
    { id:'d3', salaId:'s1', tipo:'planta', x:700, y:370 },
    { id:'d4', salaId:'s2', tipo:'planta', x:680, y:40 },
    { id:'d5', salaId:'s2', tipo:'planta', x:680, y:210 },
    { id:'d6', salaId:'s3', tipo:'barra',  x:24,  y:24, w:568, h:70 },
    { id:'d7', salaId:'s4', tipo:'planta', x:470, y:90 },
    { id:'d8', salaId:'s4', tipo:'sofa',   x:450, y:230 }
  ];
  var usuarios = [
    { id: 'u1', nombre: 'Admin',     rol: 'admin',     pin: '1111', usuario: 'admin',     password: 'admin', color: '#4f46e5', activo: true },
    { id: 'u2', nombre: 'Encargado', rol: 'encargado', pin: '2222', usuario: 'encargado', password: '1234',  color: '#0891b2', activo: true },
    { id: 'u3', nombre: 'Marta',     rol: 'camarero',  pin: '3333', color: '#16a34a', activo: true },
    { id: 'u4', nombre: 'Luis',      rol: 'camarero',  pin: '4444', color: '#15803d', activo: true },
    { id: 'u5', nombre: 'Cocina',    rol: 'cocina',    pin: '9999', color: '#d97706', activo: true }
  ];
  var config = {
    empresa: { nombre: 'La Taberna', direccion: 'C/ Mayor 1', poblacion: '', cif: 'B00000000', telefono: '', portada: 'https://loremflickr.com/1200/600/restaurant,food?lock=7' },
    ivaPorDefecto: 10,
    impuestos: [ { id: 'iva10', nombre: 'IVA 10%', tipo: 10 }, { id: 'iva21', nombre: 'IVA 21%', tipo: 21 }, { id: 'iva4', nombre: 'IVA 4%', tipo: 4 } ],
    formasPago: [
      { id: 'efectivo', nombre: 'Efectivo', daCambio: true,  abreCajon: true,  enArqueo: true },
      { id: 'tarjeta',  nombre: 'Tarjeta',  daCambio: false, abreCajon: false, enArqueo: true },
      { id: 'vale',     nombre: 'Vale / Invitación', daCambio: false, abreCajon: false, enArqueo: false }
    ],
    servicio: { pedirComensales: 'sentar', propinaSugerida: 0, moneda: '€', idioma: 'es' },
    ticket: { cabecera: '', pie: '¡Gracias por su visita!' },
    facturacion: { sistema: 'ninguno', serie: 'A' },
    permisos: {
      admin:     { anular: true,  caja: true,  informes: true,  descuento: true,  editarCarta: true,  usuarios: true },
      encargado: { anular: true,  caja: true,  informes: true,  descuento: true,  editarCarta: true,  usuarios: false },
      camarero:  { anular: false, caja: false, informes: false, descuento: false, editarCarta: false, usuarios: false },
      cocina:    { anular: false, caja: false, informes: false, descuento: false, editarCarta: false, usuarios: false }
    }
  };
  var promociones = [
    { id:'pr1', nombre:'Happy Hour Bebidas -20%', tipo:'horario', categoriaId:'c1', pct:20, desde:'18:00', hasta:'20:00', activa:false },
    { id:'pr2', nombre:'2x1 en Cervezas', tipo:'nxm', categoriaId:'c2', n:2, m:1, activa:false }
  ];
  var clientes = [ { id:'cl1', nombre:'Empresa Demo S.L.', cif:'B12345678', direccion:'Pol. Ind. Mayor 1', telefono:'', email:'', descuento:0 } ];
  var datafonos = [];
  var comentarios = [
    { id:'cm1', texto:'Para llevar', categoriaId:null },
    { id:'cm2', texto:'Sin gluten', categoriaId:null },
    { id:'cm3', texto:'Sin lactosa', categoriaId:null },
    { id:'cm4', texto:'Poco hecho', categoriaId:'c4' },
    { id:'cm5', texto:'Al punto', categoriaId:'c4' },
    { id:'cm6', texto:'Muy hecho', categoriaId:'c4' },
    { id:'cm7', texto:'Sin hielo', categoriaId:'c1' },
    { id:'cm8', texto:'Con limón', categoriaId:'c1' }
  ];
  var tarifas = [
    { id:'tf0', nombre:'Carta (general)', pct:0, porDefecto:true, activa:true },
    { id:'tf1', nombre:'Terraza +10%', pct:10, salaIds:['s2'], activa:true },
    { id:'tf2', nombre:'Happy Hour -15% (18-20h)', pct:-15, desde:'18:00', hasta:'20:00', activa:false }
  ];
  // Ventas de ejemplo (unidades últimos 7 días) para que el Maître proponga con datos reales
  var ventas7d = { p1:380, p2:120, p3:160, p4:90, p5:70, p6:210, p7:120, p8:40, p9:55,
    p10:70, p11:35, p12:110, p13:140, p14:48, p15:46, p16:20, p17:33, p18:64, p19:41, p20:8,
    p21:52, p22:30, p23:44, p24:18, p25:12, menu1:95 };
  // Acciones rápidas personalizadas: botones a medida que orquestan módulos existentes
  var accionesRapidas = [
    { id:'ar1', label:'-10% cliente', ic:'🏷️', color:'#0891b2', tipo:'descuento', param:10 },
    { id:'ar2', label:'Invitación', ic:'🎁', color:'#d97706', tipo:'invitacion' },
    { id:'ar3', label:'Happy Hour', ic:'⚡', color:'#7c3aed', tipo:'tarifa', param:'tf2' }
  ];
  return { version: 19, categorias: cats, productos: prods, salas: salas, mesas: mesas, decor: decor, promociones: promociones, clientes: clientes, datafonos: datafonos, comentarios: comentarios, tarifas: tarifas, accionesRapidas: accionesRapidas, ventas7d: ventas7d, usuarios: usuarios, impresoras: [], config: config };
}

// Reservas de demostración (hoy)
function sembrarReservas() {
  function fhoy(){ var d=new Date(); return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
  var hoy = fhoy();
  return [
    { id:'rsv1', fecha:hoy, hora:'14:00', personas:4, cliente:'Familia García', telefono:'600111222', origen:'thefork', mesa:'', notas:'Trona para bebé', estado:'confirmada', creada:Date.now() },
    { id:'rsv2', fecha:hoy, hora:'14:30', personas:2, cliente:'Laura Pons', telefono:'600333444', origen:'google', mesa:'', notas:'', estado:'pendiente', creada:Date.now() },
    { id:'rsv3', fecha:hoy, hora:'21:00', personas:6, cliente:'Cena empresa', telefono:'600555666', origen:'covermanager', mesa:'', notas:'Menú cerrado', estado:'confirmada', creada:Date.now() }
  ];
}

function cargar() {
  var s; try { s = JSON.parse(fs.readFileSync(DATAFILE, 'utf8')); } catch (e) { s = {}; }
  if (!s.comandas) s.comandas = [];
  if (!s.master || !s.master.productos || !s.master.productos.length || s.master.version !== masterSeed().version) s.master = masterSeed();
  if (!s.master.usuarios || !s.master.usuarios.length) s.master.usuarios = masterSeed().usuarios;
  if (!s.master.impresoras) s.master.impresoras = [];
  if (!s.master.config) s.master.config = masterSeed().config;
  if (!s.master.promociones) s.master.promociones = [];
  if (!s.master.clientes) s.master.clientes = [];
  if (!s.master.datafonos) s.master.datafonos = [];
  if (!s.master.cajasEfectivo) s.master.cajasEfectivo = [];
  if (!s.master.tarifas) s.master.tarifas = [];
  if (!s.master.accionesRapidas) s.master.accionesRapidas = [];
  if (!s.master.ventas7d) s.master.ventas7d = {};
  if (!s.fichajes) s.fichajes = [];
  if (!s.agotados) s.agotados = [];
  if (!s.reservas) s.reservas = sembrarReservas();
  if (typeof s.v !== 'number') s.v = 0;
  return s;
}

var state = cargar();
var clientes = [];

function guardar() { try { fs.writeFileSync(DATAFILE, JSON.stringify(state)); } catch (e) {} }
function difundir() { var msg = 'data: ' + JSON.stringify(state) + '\n\n'; clientes.slice().forEach(function (c) { try { c.write(msg); } catch (e) {} }); }
function getC(id) { return state.comandas.filter(function (c) { return c.id === id; })[0]; }

function p2(n){ return n < 10 ? '0' + n : '' + n; }
function rep(ch, n){ var o=''; for(var i=0;i<n;i++) o+=ch; return o; }
function escposComanda(c, ancho){
  ancho = ancho || 42;
  var ESC='\x1b', GS='\x1d', o = ESC+'@';
  o += ESC+'a'+'\x01' + GS+'!'+'\x11' + (c.mesa||'Comanda') + '\n' + GS+'!'+'\x00' + ESC+'a'+'\x00';
  var d = new Date(c.createdAt||Date.now());
  o += (c.camarero||'') + '   ' + p2(d.getHours())+':'+p2(d.getMinutes()) + '\n' + rep('-',ancho) + '\n';
  (c.lineas||[]).forEach(function(l){
    o += ESC+'!'+'\x08' + (l.cantidad||1) + ' x ' + (l.nombre||'') + '\n' + ESC+'!'+'\x00';
    if(l.orden) o += '    ['+l.orden+']\n';
    if(l.mods) l.mods.forEach(function(m){ o += '    - '+(m.n||m)+'\n'; });
    if(l.subs) l.subs.forEach(function(x){ o += '    . '+x+'\n'; });
    if(l.comentario) o += '    * '+l.comentario+'\n';
  });
  o += rep('-',ancho) + '\n\n\n' + GS+'V'+'\x42'+'\x00';
  return Buffer.from(o, 'latin1');
}
function imprimirEn(ip, puerto, buf){
  try{
    var sock = new net.Socket(); sock.setTimeout(4000);
    sock.connect(puerto||9100, ip, function(){ sock.write(buf, function(){ sock.end(); }); });
    sock.on('timeout', function(){ sock.destroy(); });
    sock.on('error', function(){});
  }catch(e){}
}
function imprimirComanda(c){
  var imps = (state.master && state.master.impresoras) || [];
  imps.filter(function(p){ return p.activa !== false && p.zona !== 'caja'; }).forEach(function(p){
    var lineas = c.lineas || [];
    if(p.zona && lineas.some(function(l){return l.zona;})) lineas = lineas.filter(function(l){ return (l.zona||'cocina')===p.zona; });
    if(!lineas.length) return;
    imprimirEn(p.ip, p.puerto, escposComanda({mesa:c.mesa,camarero:c.camarero,createdAt:c.createdAt,lineas:lineas}, p.ancho||42));
  });
}
function aplicar(accion, d) {
  if (accion === '/api/comanda') {
    d.id = uid(); d.createdAt = Date.now(); d.estado = 'pendiente'; d.avisado = false;
    (d.lineas || []).forEach(function (l) { l.kid = l.kid || uid(); l.estado = l.estado || 'pendiente'; });
    state.comandas.push(d);
    try { imprimirComanda(d); } catch (e) {}
  } else if (accion === '/api/linea') {
    var c = getC(d.id); if (c) { var l = (c.lineas || []).filter(function (x) { return x.kid === d.kid; })[0]; if (l) l.estado = d.estado; }
  } else if (accion === '/api/avisar') { var c2 = getC(d.id); if (c2) { c2.avisado = true; c2.avisadoAt = Date.now(); }
  } else if (accion === '/api/recoger') { var c3 = getC(d.id); if (c3) { c3.estado = 'recogida'; c3.avisado = false; }
  } else if (accion === '/api/reset') { state.comandas = [];
  } else if (accion === '/api/master') { if (d.master) state.master = d.master;
  } else if (accion === '/api/fichaje') { if (d.registro) { d.registro.id = d.registro.id || uid(); state.fichajes.push(d.registro); }
  } else if (accion === '/api/agotado') { if (!state.agotados) state.agotados = []; var pid = d.id; if (pid) { if (d.agotado) { if (state.agotados.indexOf(pid) < 0) state.agotados.push(pid); } else { state.agotados = state.agotados.filter(function (x) { return x !== pid; }); } }
  } else if (accion === '/api/reserva') {
    // alta/edición unificada: la usan la app de Admin y los webhooks de TheFork/Google/CoverManager
    if (!state.reservas) state.reservas = [];
    var r = d.reserva || d; if (r && (r.fecha || r.hora || r.cliente)) {
      r.origen = r.origen || 'web'; r.estado = r.estado || 'pendiente';
      if (r.id) { var idx = -1; state.reservas.forEach(function (x, i) { if (x.id === r.id) idx = i; }); if (idx >= 0) state.reservas[idx] = Object.assign({}, state.reservas[idx], r); else { state.reservas.push(r); } }
      else { r.id = 'rsv' + uid(); r.creada = Date.now(); state.reservas.push(r); }
    }
  } else if (accion === '/api/reserva-borrar') { if (d.id) state.reservas = (state.reservas || []).filter(function (x) { return x.id !== d.id; });
  } else if (accion === '/api/print-test') { try { imprimirEn(d.ip, d.puerto, escposComanda({ mesa: 'PRUEBA', camarero: 'HOSTELERO', lineas: [{ cantidad: 1, nombre: 'Impresora OK' }] }, d.ancho || 42)); } catch (e) {}
  } else if (accion === '/api/datafono') {
    var dfs = (state.master && state.master.datafonos) || [];
    var df = d.id ? dfs.filter(function(x){return x.id===d.id;})[0] : dfs.filter(function(x){return x.modo==='integrado' && x.activo!==false && x.ip;})[0];
    if (df && df.modo === 'integrado' && df.ip) { try { imprimirEn(df.ip, df.puerto || 7777, Buffer.from('VENTA;IMPORTE=' + (d.importe || 0) + ';REF=' + (d.ref || '') + '\n', 'latin1')); } catch (e) {} }
  } else if (accion === '/api/efectivo') {
    // control de efectivo (Cashlogy / CashKeeper / Glory): enruta el importe al dispositivo
    var ces = (state.master && state.master.cajasEfectivo) || [];
    var ce = d.id ? ces.filter(function(x){return x.id===d.id;})[0] : ces.filter(function(x){return x.modo==='integrado' && x.activo!==false && x.ip;})[0];
    if (ce && ce.modo === 'integrado' && ce.ip) { try { imprimirEn(ce.ip, ce.puerto || 7780, Buffer.from((d.op||'COBRO') + ';IMPORTE=' + (d.importe || 0) + ';ENTREGADO=' + (d.entregado || 0) + ';REF=' + (d.ref || '') + '\n', 'latin1')); } catch (e) {} }
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
