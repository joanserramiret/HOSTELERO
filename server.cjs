/* HOSTELERO · server.cjs — servidor LOCAL (LAN, sin internet, sin dependencias npm).
   - Sirve cada app en su propio puerto.
   - Tiempo real por SSE.
   - Estado compartido: { master (carta/mesas), comandas } persistido en servicio.json.
   Arranque:  node server.cjs    (puertos configurables en PUERTOS)
*/
'use strict';
var http = require('http'), fs = require('fs'), path = require('path'), net = require('net');
var cp = require('child_process'), os = require('os');
var DIR = __dirname;
var DATAFILE = path.join(DIR, 'servicio.json');

/* ===== Impresión a impresoras de Windows (ESC/POS en crudo, sin npm) ===== */
var ESWIN = (process.platform === 'win32');
var _psRaw = null;
function psRawScript() {
  if (_psRaw) return _psRaw;
  var f = path.join(os.tmpdir(), 'hostelero_rawprint.ps1');
  var src =
    'param([string]$Printer,[string]$DataFile)\n' +
    '$cs = @"\n' +
    'using System;\n' +
    'using System.IO;\n' +
    'using System.Runtime.InteropServices;\n' +
    'public class RawPrinter {\n' +
    '  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]\n' +
    '  public struct DOCINFOW { [MarshalAs(UnmanagedType.LPWStr)] public string pDocName; [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile; [MarshalAs(UnmanagedType.LPWStr)] public string pDataType; }\n' +
    '  [DllImport("winspool.Drv", EntryPoint="OpenPrinterW", SetLastError=true, CharSet=CharSet.Unicode)] public static extern bool OpenPrinter(string src, out IntPtr h, IntPtr pd);\n' +
    '  [DllImport("winspool.Drv", EntryPoint="ClosePrinter", SetLastError=true)] public static extern bool ClosePrinter(IntPtr h);\n' +
    '  [DllImport("winspool.Drv", EntryPoint="StartDocPrinterW", SetLastError=true, CharSet=CharSet.Unicode)] public static extern bool StartDocPrinter(IntPtr h, int level, ref DOCINFOW di);\n' +
    '  [DllImport("winspool.Drv", EntryPoint="EndDocPrinter", SetLastError=true)] public static extern bool EndDocPrinter(IntPtr h);\n' +
    '  [DllImport("winspool.Drv", EntryPoint="StartPagePrinter", SetLastError=true)] public static extern bool StartPagePrinter(IntPtr h);\n' +
    '  [DllImport("winspool.Drv", EntryPoint="EndPagePrinter", SetLastError=true)] public static extern bool EndPagePrinter(IntPtr h);\n' +
    '  [DllImport("winspool.Drv", EntryPoint="WritePrinter", SetLastError=true)] public static extern bool WritePrinter(IntPtr h, IntPtr buf, int count, out int written);\n' +
    '  public static bool Send(string printer, byte[] bytes) {\n' +
    '    IntPtr h; if(!OpenPrinter(printer, out h, IntPtr.Zero)) return false;\n' +
    '    DOCINFOW di = new DOCINFOW(); di.pDocName="HOSTELERO"; di.pDataType="RAW"; bool ok=false;\n' +
    '    if(StartDocPrinter(h,1,ref di)){ if(StartPagePrinter(h)){ IntPtr p=Marshal.AllocCoTaskMem(bytes.Length); Marshal.Copy(bytes,0,p,bytes.Length); int w; ok=WritePrinter(h,p,bytes.Length,out w); Marshal.FreeCoTaskMem(p); EndPagePrinter(h);} EndDocPrinter(h);} \n' +
    '    ClosePrinter(h); return ok;\n' +
    '  }\n' +
    '}\n' +
    '"@\n' +
    'Add-Type -TypeDefinition $cs -Language CSharp\n' +
    '$bytes = [System.IO.File]::ReadAllBytes($DataFile)\n' +
    '$r = [RawPrinter]::Send($Printer, $bytes)\n' +
    'if($r){ Write-Output "RP_OK" } else { Write-Output ("RP_FAIL " + [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()) }\n';
  try { fs.writeFileSync(f, src, 'utf8'); _psRaw = f; } catch (e) { _psRaw = null; }
  return _psRaw;
}
function imprimirWin(printer, buf) {
  if (!printer) return;
  if (!ESWIN) { console.log('⚠️  Impresión a "' + printer + '" ignorada: el servidor no corre en Windows.'); return; }
  try {
    var tmp = path.join(os.tmpdir(), 'hostelero_doc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6) + '.bin');
    fs.writeFileSync(tmp, buf);
    var script = psRawScript(); if (!script) { console.log('⚠️  No se pudo preparar el script de impresión.'); return; }
    var args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, '-Printer', printer, '-DataFile', tmp];
    var ch = cp.spawn('powershell.exe', args, { windowsHide: true });
    var out = '';
    if (ch.stdout) ch.stdout.on('data', function (d) { out += d; });
    if (ch.stderr) ch.stderr.on('data', function (d) { out += d; });
    ch.on('close', function () {
      try { fs.unlinkSync(tmp); } catch (e) {}
      var o = String(out).trim();
      if (o.indexOf('RP_OK') >= 0) console.log('🖨️  Impreso correctamente en "' + printer + '" (' + buf.length + ' bytes)');
      else console.log('⚠️  Fallo al imprimir en "' + printer + '": ' + (o || 'sin respuesta de Windows. ¿Nombre exacto de la impresora?'));
    });
    ch.on('error', function (e) { console.log('⚠️  No se pudo lanzar PowerShell: ' + e.message); });
  } catch (e) { console.log('⚠️  imprimirWin error: ' + e.message); }
}
function listarImpresorasWin(cb) {
  if (!ESWIN) return cb([]);
  cp.exec('powershell -NoProfile -Command "Get-Printer | Select-Object -ExpandProperty Name"', { timeout: 9000, windowsHide: true }, function (err, stdout) {
    var arr = String(stdout || '').split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    if (!err && arr.length) return cb(arr);
    cp.exec('wmic printer get name', { timeout: 9000, windowsHide: true }, function (e2, out2) {
      var a2 = String(out2 || '').split(/\r?\n/).map(function (s) { return s.trim(); }).filter(function (s) { return s && s.toLowerCase() !== 'name'; });
      cb(a2);
    });
  });
}
/* Pitido ESC/POS (buzzer): ESC B n t — n=veces, t=duración */
function escposBeep() { return '\x1b\x42\x03\x02'; }

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
      {n:'Platos', elige:2, op:[{n:'Ensalada Mixta'},{n:'Gazpacho'},{n:'Croquetas'},{n:'Pollo'},{n:'Calamares'},{n:'Entrecot',p:3}]},
      {n:'Postre o Café', elige:1, op:[{n:'Flan'},{n:'Tarta de Queso'},{n:'Fruta'},{n:'Café'}]},
      {n:'Bebida', elige:1, op:[{n:'Agua'},{n:'Caña'},{n:'Copa de Vino'},{n:'Refresco'}]} ]},
    { id:'menu2', nombre:'Menú Infantil', categoriaId:'c0', precio:8.5, ic:'🧒', pasePorDefecto:'Primeros', activo:true, esMenu:true, pasos:[
      {n:'Plato', elige:1, op:[{n:'Nuggets'},{n:'Macarrones'}]},
      {n:'Postre', elige:1, op:[{n:'Helado'},{n:'Fruta'}]},
      {n:'Bebida', elige:1, op:[{n:'Agua'},{n:'Zumo'}]} ]},
    { id:'menu3', nombre:'Menú Degustación', categoriaId:'c0', precio:48, ic:'⭐', pasePorDefecto:'Primeros', activo:true, esMenu:true, pasos:[
      {n:'Aperitivo', elige:1, op:[{n:'Croqueta de jamón'},{n:'Gilda'}]},
      {n:'Entrante frío', elige:1, op:[{n:'Tartar de atún'},{n:'Steak tartar'}]},
      {n:'Entrante caliente', elige:1, op:[{n:'Croquetas cremosas'},{n:'Alcachofas'}]},
      {n:'Pescado', elige:1, op:[{n:'Merluza'},{n:'Bacalao'}]},
      {n:'Carne', elige:1, op:[{n:'Presa ibérica'},{n:'Carrillera'}]},
      {n:'Pre-postre', elige:1, op:[{n:'Sorbete de limón'}]},
      {n:'Postre', elige:1, op:[{n:'Coulant'},{n:'Tarta de queso'}]},
      {n:'Maridaje (opcional)', elige:1, op:[{n:'Sin maridaje'},{n:'Maridaje de vinos',p:18}]} ]}
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
  var preparaciones = [
    { id:'prep-cocina', nombre:'Cocina', color:'#2563eb' },
    { id:'prep-barra', nombre:'Barra', color:'#0ea5e9' },
    { id:'prep-plancha', nombre:'Plancha', color:'#d97706' },
    { id:'prep-postres', nombre:'Postres', color:'#db2777' }
  ];
  prods.forEach(function(pp){ if(!pp.preparacion){ pp.preparacion = (pp.categoriaId==='c1'||pp.categoriaId==='c2')?'prep-barra' : (pp.categoriaId==='c5')?'prep-postres' : 'prep-cocina'; } });
  var estaciones = [
    { id:'kds-cocina', tipo:'kds', nombre:'Cocina caliente', activa:true, ordenes:['Primeros','Segundos','Terceros','Cuartos'], preparaciones:['prep-cocina','prep-plancha'], avisarCamareros:true, acciones:['todolisto','disponibilidad'], columnas:0 },
    { id:'kds-barra', tipo:'kds', nombre:'Barra', activa:true, ordenes:[], preparaciones:['prep-barra'], avisarCamareros:false, acciones:['todolisto'], columnas:0 },
    { id:'tpv-barra', tipo:'tpv', nombre:'TPV Barra', activa:true },
    { id:'tpv-terraza', tipo:'tpv', nombre:'TPV Terraza', activa:true },
    { id:'com-sala', tipo:'comandera', nombre:'Comandera Sala', activa:true },
    { id:'com-terraza', tipo:'comandera', nombre:'Comandera Terraza', activa:true }
  ];
  var impresoras = [
    { id:'imp-caja', tipo:'documentos', nombre:'Caja (TPV)', windows:'Caja-TPV', copias:1 },
    { id:'imp-cocina', tipo:'cocina', nombre:'Cocina', windows:'Cocina', copias:1, preparaciones:['prep-cocina','prep-plancha'], ordenes:[] },
    { id:'imp-barra', tipo:'cocina', nombre:'Barra', windows:'Barra', copias:1, preparaciones:['prep-barra'], ordenes:[] }
  ];
  return { version: 22, categorias: cats, productos: prods, salas: salas, mesas: mesas, decor: decor, promociones: promociones, clientes: clientes, datafonos: datafonos, comentarios: comentarios, tarifas: tarifas, accionesRapidas: accionesRapidas, ventas7d: ventas7d, usuarios: usuarios, impresoras: impresoras, preparaciones: preparaciones, estaciones: estaciones, config: config };
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
function enviarBuf(p, buf){
  // Imprime a la impresora de Windows por nombre (crudo ESC/POS); si no, a IP de red.
  if(p.windows) imprimirWin(p.windows, buf);
  else if(p.ip) imprimirEn(p.ip, p.puerto, buf);
}
function imprimirComanda(c){
  var imps = (state.master && state.master.impresoras) || [];
  imps.filter(function(p){ return p.activa !== false && (p.tipo||'cocina')==='cocina' && (p.windows || p.ip); }).forEach(function(p){
    var lineas = (c.lineas || []).filter(function(l){
      if(l.estado==='servido') return false;
      if(p.preparaciones && p.preparaciones.length && p.preparaciones.indexOf(l.preparacion)<0) return false;
      if(p.ordenes && p.ordenes.length && p.ordenes.indexOf(l.orden||'Primeros')<0) return false;
      return true;
    });
    if(!lineas.length) return;
    var buf = Buffer.concat([ p.beep ? Buffer.from(escposBeep(),'latin1') : Buffer.alloc(0), escposComanda({mesa:c.mesa,camarero:c.camarero,createdAt:c.createdAt,lineas:lineas}, p.ancho||42) ]);
    var copias = p.copias || 1;
    for(var i=0;i<copias;i++){ enviarBuf(p, buf); }
  });
}
/* ESC/POS de un documento genérico (cuenta / ticket de cobro) */
function escposTicket(t, ancho){
  ancho = ancho || 42;
  var ESC='\x1b', GS='\x1d', o = ESC+'@';
  if(t.beep) o += escposBeep();
  if(t.cabecera){ o += ESC+'a'+'\x01' + GS+'!'+'\x11' + t.cabecera + '\n' + GS+'!'+'\x00' + ESC+'a'+'\x00'; }
  (t.subs||[]).forEach(function(s){ o += ESC+'a'+'\x01' + s + '\n' + ESC+'a'+'\x00'; });
  if((t.lineas||[]).length || (t.subs||[]).length) o += rep('-',ancho) + '\n';
  (t.lineas||[]).forEach(function(l){
    o += pad((l.cantidad!=null?l.cantidad+' ':'') + (l.nombre||''), (l.importe!=null?String(l.importe):''), ancho) + '\n';
    if(l.detalle){ (Array.isArray(l.detalle)?l.detalle:[l.detalle]).forEach(function(dd){ o += '  ' + dd + '\n'; }); }
  });
  if((t.lineas||[]).length) o += rep('-',ancho) + '\n';
  (t.filas||[]).forEach(function(f){ o += (f.bold?ESC+'!'+'\x18':'') + pad(f.l||'', f.r||'', ancho) + (f.bold?ESC+'!'+'\x00':'') + '\n'; });
  if(t.total!=null) o += ESC+'!'+'\x18' + pad('TOTAL', String(t.total), ancho) + ESC+'!'+'\x00' + '\n';
  if((t.filas||[]).length || t.total!=null) o += rep('-',ancho) + '\n';
  (t.pies||[]).forEach(function(li){ o += ESC+'a'+'\x01' + li + '\n' + ESC+'a'+'\x00'; });
  o += '\n\n\n' + GS+'V'+'\x42'+'\x00';
  return Buffer.from(o, 'latin1');
}
function pad(izq, der, ancho){ izq=String(izq); der=String(der); if(izq.length>ancho-der.length-1) izq=izq.slice(0,ancho-der.length-1); var sp=ancho-izq.length-der.length; if(sp<1)sp=1; return izq + rep(' ',sp) + der; }
function imprimirMarcha(c){
  var imps = (state.master && state.master.impresoras) || [];
  imps.filter(function(p){ return p.activa !== false && (p.tipo||'cocina')==='cocina' && (p.windows || p.ip); }).forEach(function(p){
    var buf = Buffer.concat([ p.beep ? Buffer.from(escposBeep(),'latin1') : Buffer.alloc(0),
      escposTicket({cabecera:'>> MARCHAR '+(c.marcha||''), subs:[(c.mesa?('Mesa '+c.mesa):''), (c.camarero||''), new Date(c.createdAt||Date.now()).toLocaleTimeString('es-ES')].filter(Boolean), lineas:[]}, p.ancho||42) ]);
    var cop = p.copias || 1; for(var i=0;i<cop;i++){ enviarBuf(p, buf); }
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
  } else if (accion === '/api/jornada') { state.jornada = d.jornada || null;
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
  } else if (accion === '/api/imprimir-doc') {
    try {
      var imps2 = (state.master && state.master.impresoras) || [];
      var pr = d.printerId ? imps2.filter(function (x) { return x.id === d.printerId; })[0] : null;
      var buf = escposTicket(Object.assign({ beep: pr ? !!pr.beep : false }, d.doc || {}), (pr && pr.ancho) || 42);
      var copias = (pr && pr.copias) || 1;
      var win = (pr && pr.windows) || d.windows;
      for (var ci = 0; ci < copias; ci++) { if (win) imprimirWin(win, buf); else if (pr && pr.ip) imprimirEn(pr.ip, pr.puerto, buf); }
    } catch (e) {}
  } else if (accion === '/api/marcha') {
    var mc = { id: uid(), createdAt: Date.now(), estado: 'pendiente', avisado: false, mesa: d.mesa, camarero: d.camarero, marcha: d.pase, lineas: [{ kid: uid(), nombre: '▶ MARCHAR ' + d.pase, cantidad: 1, orden: d.pase, estado: 'pendiente', marcha: true }] };
    state.comandas.push(mc);
    try { imprimirMarcha(mc); } catch (e) {}
  } else if (accion === '/api/abrir-cajon') {
    try {
      var imps3 = (state.master && state.master.impresoras) || [];
      var pr3 = d.printerId ? imps3.filter(function (x) { return x.id === d.printerId; })[0] : null;
      var kick = Buffer.from('\x1b\x70\x00\x19\xfa', 'latin1');
      if (pr3) { if (pr3.windows) imprimirWin(pr3.windows, kick); else if (pr3.ip) imprimirEn(pr3.ip, pr3.puerto, kick); }
    } catch (e) {}
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
    if (pathname === '/api/printers') { listarImpresorasWin(function (list) { res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify({ windows: ESWIN, printers: list || [] })); }); return; }
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
setTimeout(function(){
  if(ESWIN){ listarImpresorasWin(function(list){ console.log('\n🖨️  Impresión Windows ACTIVA. Impresoras detectadas: '+(list&&list.length?list.join(' · '):'(ninguna; instálalas en Windows)')+'\n   Pon el nombre EXACTO en Admin → Impresoras.'); }); }
  else { console.log('\n🖨️  Impresión Windows NO disponible (este equipo no es Windows). La configuración y el enrutado funcionan; la impresión real requiere ejecutar este servidor en el PC con las impresoras.'); }
}, 600);
