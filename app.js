/* HOSTELERO TPV v3 - app de un solo archivo, sin dependencias. Iconos SVG + Fase 2a. */
'use strict';

/* ---------- Helpers puros (testeables) ---------- */
function round2(n){ return Math.round((n + Number.EPSILON) * 100) / 100; }
function eur(n){ try{ return new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(n||0); }catch(e){ return (n||0).toFixed(2)+' €'; } }
function totalLineas(lineas){ return round2((lineas||[]).reduce(function(s,l){return s+l.precio*l.cantidad;},0)); }
function desgloseIVA(total, tipo){ tipo = tipo==null?0.10:tipo; var base=round2(total/(1+tipo)); return {base:base, cuota:round2(total-base), tipo:tipo}; }
function cambioEfectivo(total, entregado){ return round2((entregado||0) - total); }
function sumaPagos(pagos){ return round2((pagos||[]).reduce(function(s,p){return s+(p.importe||0);},0)); }
function restantePago(total, pagos){ return round2(total - sumaPagos(pagos)); }
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

/* ---------- Iconos (emoji) ---------- */
function svg(e){ return e||'🍽️'; }

/* ---------- Capa de datos ---------- */
var KEY='hostelero_db_v3';
var DB=null;

function seed(){
  var cats=[
    {id:'c1',nombre:'Bebidas',color:'#0ea5e9',ic:'🥤',orden:1},
    {id:'c2',nombre:'Cervezas',color:'#d97706',ic:'🍺',orden:2},
    {id:'c3',nombre:'Vinos',color:'#9d174d',ic:'🍷',orden:3},
    {id:'c4',nombre:'Cafés',color:'#78350f',ic:'☕',orden:4},
    {id:'c5',nombre:'Entrantes',color:'#16a34a',ic:'🥗',orden:5},
    {id:'c6',nombre:'Tapas',color:'#dc2626',ic:'🍟',orden:6},
    {id:'c7',nombre:'Raciones',color:'#ea580c',ic:'🍤',orden:7},
    {id:'c8',nombre:'Carnes',color:'#7c2d12',ic:'🥩',orden:8},
    {id:'c9',nombre:'Arroces',color:'#ca8a04',ic:'🥘',orden:9},
    {id:'c10',nombre:'Postres',color:'#db2777',ic:'🍰',orden:10}
  ];
  function p(n,c,pr,ic,st){return {id:uid(),nombre:n,categoriaId:c,precio:pr,ic:ic,stock:st==null?100:st,controlStock:true,activo:true};}
  var productos=[
    p('Agua 50cl','c1',1.5,'💧',400),p('Refresco','c1',2.2,'🥤',400),p('Zumo Natural','c1',2.8,'🧃',120),p('Tónica','c1',2.5,'🍹',200),p('Bitter','c1',2.3,'🍹',150),
    p('Caña','c2',1.8,'🍺',500),p('Doble','c2',2.6,'🍺',500),p('Tercio','c2',2.8,'💧',300),p('Cerveza Sin','c2',2.4,'🍺',150),p('Artesana IPA','c2',3.8,'🍺',80),
    p('Copa Tinto','c3',2.4,'🍷',300),p('Copa Blanco','c3',2.4,'🍷',300),p('Copa Rosado','c3',2.4,'🍷',200),p('Botella Rioja','c3',16.0,'🍷',40),p('Cava Brut','c3',18.0,'🍾',30),
    p('Café Solo','c4',1.3,'☕',999),p('Café Leche','c4',1.5,'☕',999),p('Cortado','c4',1.4,'☕',999),p('Carajillo','c4',2.0,'☕',999),p('Té / Infusión','c4',1.6,'🍵',999),
    p('Ensalada Mixta','c5',6.5,'🥗',60),p('Gazpacho','c5',4.5,'🥗',50),p('Hummus','c5',5.5,'🥗',40),p('Burrata','c5',8.5,'🧀',30),
    p('Patatas Bravas','c6',4.5,'🍟',80),p('Croquetas (6)','c6',6.0,'🍟',60),p('Tortilla','c6',3.5,'🍳',40),p('Ensaladilla','c6',4.0,'🥗',50),p('Pimientos Padrón','c6',5.0,'🌶️',45),p('Boquerones','c6',5.5,'🐟',40),
    p('Jamón Ibérico','c7',16.0,'🥩',30),p('Pulpo Gallega','c7',17.0,'🐟',25),p('Tabla Quesos','c7',13.0,'🧀',30),p('Calamares','c7',11.0,'🐟',35),p('Gambas Ajillo','c7',12.5,'🦐',40),p('Mejillones','c7',9.5,'🐟',35),
    p('Entrecot','c8',18.0,'🥩',25),p('Solomillo','c8',21.0,'🥩',20),p('Secreto Ibérico','c8',15.0,'🥩',25),p('Pollo Corral','c8',12.0,'🍗',30),p('Chuletillas','c8',16.5,'🥩',20),
    p('Paella Marisco','c9',16.0,'🥘',30),p('Arroz Negro','c9',15.0,'🥘',25),p('Arroz Verduras','c9',12.0,'🥘',25),p('Fideuá','c9',15.5,'🥘',20),
    p('Tarta Queso','c10',5.0,'🍰',20),p('Flan Casero','c10',3.8,'🍮',20),p('Coulant','c10',5.5,'🍫',18),p('Helado','c10',3.5,'🍨',40),p('Fruta','c10',3.0,'🍓',30),p('Café Bombón','c10',2.2,'☕',999)
  ];
  var salas=[{id:'s1',nombre:'Comedor',orden:1},{id:'s2',nombre:'Terraza',orden:2},{id:'s3',nombre:'Barra',orden:3},{id:'s4',nombre:'Reservado',orden:4}];
  var mesas=[];
  for(var i=1;i<=12;i++) mesas.push({id:uid(),salaId:'s1',nombre:'M'+i,plazas:i%3===0?6:4,estado:'libre',ticketId:null,forma:(i%2?'cuadrada':'redonda'),x:((i-1)%4)*156+24,y:Math.floor((i-1)/4)*140+24});
  for(var j=1;j<=8;j++) mesas.push({id:uid(),salaId:'s2',nombre:'T'+j,plazas:2,estado:'libre',ticketId:null,forma:'redonda',x:((j-1)%4)*150+24,y:Math.floor((j-1)/4)*140+24});
  for(var k=1;k<=6;k++) mesas.push({id:uid(),salaId:'s3',nombre:'B'+k,plazas:1,estado:'libre',ticketId:null,forma:'barra',x:((k-1)%8)*92+24,y:24});
  for(var r=1;r<=3;r++) mesas.push({id:uid(),salaId:'s4',nombre:'R'+r,plazas:10,estado:'libre',ticketId:null,forma:'rectangular',x:(r-1)*210+24,y:24});
  // --- Fase 2b: modificadores y menús ---
  var setMods=function(nm,mods){ var p=productos.filter(function(x){return x.nombre===nm;})[0]; if(p)p.mods=mods; };
  setMods('Café Solo',[{n:'Leche',op:[{n:'Sin leche'},{n:'Entera'},{n:'Desnatada'},{n:'Avena',p:.30},{n:'Soja',p:.30}]}]);
  setMods('Café Leche',[{n:'Leche',op:[{n:'Entera'},{n:'Desnatada'},{n:'Avena',p:.30},{n:'Soja',p:.30}]},{n:'Tamaño',op:[{n:'Normal'},{n:'Grande',p:.40}]}]);
  setMods('Patatas Bravas',[{n:'Salsa',op:[{n:'Brava'},{n:'Alioli'},{n:'Mixta'}]},{n:'Tamaño',op:[{n:'Tapa'},{n:'Ración',p:2.0}]}]);
  setMods('Entrecot',[{n:'Punto',op:[{n:'Poco hecho'},{n:'Al punto'},{n:'Muy hecho'}]},{n:'Guarnición',op:[{n:'Patatas'},{n:'Ensalada'},{n:'Verduras',p:1.5}]},{n:'Extras',tipo:'check',op:[{n:'Huevo frito',p:1.0},{n:'Foie',p:4.0},{n:'Pimienta',p:.5}]}]);
  setMods('Solomillo',[{n:'Punto',op:[{n:'Poco hecho'},{n:'Al punto'},{n:'Muy hecho'}]},{n:'Guarnición',op:[{n:'Patatas'},{n:'Ensalada'},{n:'Verduras',p:1.5}]}]);
  setMods('Ensalada Mixta',[{n:'Extras',tipo:'check',op:[{n:'Atún',p:1.5},{n:'Queso',p:1.0},{n:'Pollo',p:2.0},{n:'Huevo',p:.8}]}]);
  var menuDia={id:uid(),nombre:'Menú del Día',categoriaId:'c0',precio:13.9,ic:'🍽️',esMenu:true,activo:true,controlStock:false,stock:0,
    pasos:[ {n:'Primero',op:[{n:'Ensalada Mixta'},{n:'Gazpacho'},{n:'Ensaladilla'},{n:'Croquetas'}]},
            {n:'Segundo',op:[{n:'Pollo de Corral'},{n:'Calamares'},{n:'Entrecot',p:3.0},{n:'Paella',p:2.0}]},
            {n:'Postre o Café',op:[{n:'Flan'},{n:'Tarta de Queso'},{n:'Fruta'},{n:'Café'}]},
            {n:'Bebida',op:[{n:'Agua'},{n:'Caña'},{n:'Copa de Vino'},{n:'Refresco'}]} ]};
  var menuInf={id:uid(),nombre:'Menú Infantil',categoriaId:'c0',precio:8.5,ic:'🧒',esMenu:true,activo:true,controlStock:false,stock:0,
    pasos:[ {n:'Plato',op:[{n:'Nuggets con patatas'},{n:'Macarrones'},{n:'Mini hamburguesa'}]},
            {n:'Postre',op:[{n:'Helado'},{n:'Natillas'},{n:'Fruta'}]},
            {n:'Bebida',op:[{n:'Agua'},{n:'Refresco'},{n:'Zumo'}]} ]};
  cats.unshift({id:'c0',nombre:'Menús',color:'#4f46e5',ic:'🍽️',orden:0});
  productos.unshift(menuDia,menuInf);
  var hoy=new Date().toISOString().slice(0,10);
  var reservas=[
    {id:uid(),fecha:hoy,hora:'14:00',nombre:'Familia Pérez',personas:4,telefono:'600111222',origen:'Teléfono',notas:'Trona para bebé',estado:'pendiente',createdAt:Date.now()},
    {id:uid(),fecha:hoy,hora:'14:30',nombre:'Mesa TheFork',personas:2,telefono:'',origen:'TheFork',notas:'',estado:'pendiente',createdAt:Date.now()},
    {id:uid(),fecha:hoy,hora:'21:30',nombre:'Cumpleaños Marta',personas:8,telefono:'699888777',origen:'Web propia',notas:'Tarta al final',estado:'pendiente',createdAt:Date.now()}
  ];
  return {restaurante:'La Taberna',categorias:cats,productos:productos,salas:salas,mesas:mesas,tickets:[],cajas:[],reservas:reservas,numeroTicket:1};
}

function load(){
  try{ var raw=(typeof localStorage!=='undefined')&&localStorage.getItem(KEY); if(raw){DB=JSON.parse(raw);return;} }catch(e){}
  DB=seed(); save();
}
function save(){ try{ if(typeof localStorage!=='undefined') localStorage.setItem(KEY,JSON.stringify(DB)); }catch(e){} }
function resetDemo(){ DB=seed(); save(); }

/* ---------- Operaciones base ---------- */
var PASES=[
  {k:'sentados',n:'Sentados',c:'#64748b'},
  {k:'primeros',n:'Primeros',c:'#2563eb'},
  {k:'segundos',n:'Segundos',c:'#7c3aed'},
  {k:'terceros',n:'Terceros',c:'#0891b2'},
  {k:'postres', n:'Postres', c:'#db2777'},
  {k:'cafe',    n:'Café',    c:'#92400e'},
  {k:'cuenta',  n:'Cuenta',  c:'#16a34a'}
];
function setPase(ticketId,delta){ var t=getTicket(ticketId); if(!t)return; var p=(t.pase||0)+delta; if(p<0)p=0; if(p>PASES.length-1)p=PASES.length-1; t.pase=p; save(); }
function addMesa(salaId){ var n=DB.mesas.filter(function(m){return m.salaId===salaId;}).length+1; var m={id:uid(),salaId:salaId,nombre:'M'+n,plazas:4,estado:'libre',ticketId:null,forma:'redonda',x:40,y:40}; DB.mesas.push(m); save(); return m; }
function updateMesa(id,d){ var m=getMesa(id); if(!m)return; if(d.nombre!=null)m.nombre=d.nombre; if(d.forma)m.forma=d.forma; if(d.plazas!=null)m.plazas=d.plazas; save(); }
function deleteMesa(id){ var m=getMesa(id); if(!m)return 'no'; if(m.estado!=='libre')return 'ocupada'; DB.mesas=DB.mesas.filter(function(x){return x.id!==id;}); save(); return 'ok'; }

function cajaAbierta(){ return DB.cajas.filter(function(c){return c.estado==='abierta';})[0]; }
function abrirCaja(saldo){ if(cajaAbierta())return; DB.cajas.push({id:uid(),abiertaAt:Date.now(),saldoInicial:saldo,estado:'abierta'}); save(); }
function cerrarCaja(contado){ var c=cajaAbierta(); if(!c)return; c.estado='cerrada'; c.cerradaAt=Date.now(); c.saldoFinalContado=contado; save(); }
function getTicket(id){ return DB.tickets.filter(function(t){return t.id===id;})[0]; }
function getMesa(id){ return DB.mesas.filter(function(m){return m.id===id;})[0]; }
function getProducto(id){ return DB.productos.filter(function(p){return p.id===id;})[0]; }

function abrirTicketMesa(mesa, comensales){
  if(mesa.ticketId){ var ex=getTicket(mesa.ticketId); if(ex&&ex.estado==='abierto')return ex; }
  var c=cajaAbierta();
  var t={id:uid(),numero:DB.numeroTicket++,mesaId:mesa.id,mesaNombre:mesa.nombre,estado:'abierto',lineas:[],
    comensales:comensales||null,pase:0,pagos:[],propina:0,enviadoCocina:false,avisado:false,createdAt:Date.now(),cajaId:c?c.id:null};
  DB.tickets.push(t); mesa.estado='ocupada'; mesa.ticketId=t.id; save(); return t;
}
function nuevoTicketBarra(){
  var c=cajaAbierta();
  var t={id:uid(),numero:DB.numeroTicket++,mesaId:null,mesaNombre:'Venta rápida',estado:'abierto',lineas:[],
    comensales:null,pase:0,pagos:[],propina:0,enviadoCocina:false,avisado:false,createdAt:Date.now(),cajaId:c?c.id:null};
  DB.tickets.push(t); save(); return t;
}
function setComensales(ticketId,n){ var t=getTicket(ticketId); if(t){t.comensales=n;save();} }
function addProducto(ticketId,p,cant){
  cant=cant||1; var t=getTicket(ticketId); if(!t||t.estado!=='abierto')return;
  var l=t.lineas.filter(function(x){return x.productoId===p.id && !x.enviado && !x.mods && !x.subs;})[0];
  if(l) l.cantidad+=cant; else t.lineas.push({productoId:p.id,nombre:p.nombre,precio:p.precio,ic:p.ic,cantidad:cant,enviado:false,kestado:'nuevo'});
  save();
}
function addLineaConfig(ticketId,p,mods,precio){
  var t=getTicket(ticketId); if(!t||t.estado!=='abierto')return;
  t.lineas.push({productoId:p.id,nombre:p.nombre,precio:round2(precio),ic:p.ic,cantidad:1,mods:mods,enviado:false,kestado:'nuevo'}); save();
}
function addMenu(ticketId,menu,subs,precio){
  var t=getTicket(ticketId); if(!t||t.estado!=='abierto')return;
  t.lineas.push({productoId:menu.id,nombre:menu.nombre,precio:round2(precio),ic:menu.ic||'🍽️',cantidad:1,subs:subs,esMenu:true,enviado:false,kestado:'nuevo'}); save();
}
function cambiarCantidad(ticketId,idx,delta){
  var t=getTicket(ticketId); if(!t)return; var l=t.lineas[idx]; if(!l)return;
  if(l.enviado && delta<0 && l.cantidad+delta<=0){ return; } // no borrar lo ya enviado a cocina
  l.cantidad+=delta; if(l.cantidad<=0) t.lineas.splice(idx,1); save();
}

/* ---------- Cobro: pago mixto / dividir / propina ---------- */
function finalizarTicket(ticketId, opts){
  opts=opts||{}; var pagos=opts.pagos||[]; var propina=opts.propina||0;
  var t=getTicket(ticketId); if(!t||t.estado!=='abierto')return false;
  var total=totalLineas(t.lineas);
  if(restantePago(total,pagos)>0.001) return false; // aún no cubierto
  t.lineas.forEach(function(l){ var p=getProducto(l.productoId); if(p&&p.controlStock) p.stock=round2(p.stock-l.cantidad); });
  var efe=round2(pagos.filter(function(p){return p.metodo==='efectivo';}).reduce(function(s,p){return s+p.importe;},0));
  var tar=round2(pagos.filter(function(p){return p.metodo==='tarjeta';}).reduce(function(s,p){return s+p.importe;},0));
  var otros=round2(sumaPagos(pagos)-efe-tar);
  // el cambio (exceso de efectivo) no cuenta como ingreso
  var exceso=round2(sumaPagos(pagos)-total);
  var efeNeto=round2(Math.max(0, efe-exceso));
  t.estado='cobrado'; t.closedAt=Date.now(); t.pagos=pagos; t.propina=round2(propina);
  t.metodoPago = pagos.length>1 ? 'mixto' : (pagos[0]?pagos[0].metodo:'efectivo');
  t.cobradoEfectivo=efeNeto; t.cobradoTarjeta=tar; t.cobradoOtros=otros;
  if(t.mesaId){ var m=getMesa(t.mesaId); if(m){m.estado='libre';m.ticketId=null;} }
  save(); return true;
}
// compat: cobro simple en un único método (usado por tests y venta rápida)
function cobrarTicket(ticketId,cobro){
  var t=getTicket(ticketId); if(!t)return;
  var total=totalLineas(t.lineas);
  finalizarTicket(ticketId,{pagos:[{metodo:cobro.metodo,importe:total}],propina:cobro.propina||0});
}
function anularTicket(ticketId){
  var t=getTicket(ticketId); if(!t)return; t.estado='anulado'; t.closedAt=Date.now();
  if(t.mesaId){ var m=getMesa(t.mesaId); if(m){m.estado='libre';m.ticketId=null;} } save();
}

/* ---------- Cocina (KDS) + avisador ---------- */
function enviarCocina(ticketId){
  var t=getTicket(ticketId); if(!t)return 0; var n=0;
  t.lineas.forEach(function(l){ if(!l.enviado){ l.enviado=true; l.kestado='pendiente'; l.kid=uid(); n++; } });
  if(n>0){ t.enviadoCocina=true; t.cocinaAt=Date.now(); t.avisado=false; }
  save(); return n;
}
function lineasPendientesEnvio(t){ return t.lineas.filter(function(l){return !l.enviado;}).length; }
function comandasCocina(){
  return DB.tickets.filter(function(t){return t.estado==='abierto'&&t.enviadoCocina;})
    .map(function(t){
      var ls=t.lineas.filter(function(l){return l.enviado&&l.kestado!=='recogido';});
      return {ticket:t, lineas:ls};
    }).filter(function(c){return c.lineas.length>0;})
    .sort(function(a,b){return (a.ticket.cocinaAt||0)-(b.ticket.cocinaAt||0);});
}
function setEstadoLinea(ticketId,kid,estado){
  var t=getTicket(ticketId); if(!t)return; var l=t.lineas.filter(function(x){return x.kid===kid;})[0];
  if(l){ l.kestado=estado; save(); }
}
function ticketTodoListo(t){
  var ls=t.lineas.filter(function(l){return l.enviado&&l.kestado!=='recogido';});
  return ls.length>0 && ls.every(function(l){return l.kestado==='listo';});
}
function avisarCamarero(ticketId){ var t=getTicket(ticketId); if(t){ t.avisado=true; t.avisadoAt=Date.now(); save(); } }
function recogerComanda(ticketId){
  var t=getTicket(ticketId); if(!t)return;
  t.lineas.forEach(function(l){ if(l.enviado&&l.kestado==='listo') l.kestado='recogido'; });
  t.avisado=false; save();
}

/* ---------- Reservas ---------- */
function crearReserva(r){ r.id=uid(); r.createdAt=Date.now(); r.estado=r.estado||'pendiente'; DB.reservas.push(r); save(); }
function cambiarEstadoReserva(id,estado){ var r=DB.reservas.filter(function(x){return x.id===id;})[0]; if(r){r.estado=estado;save();} }

/* ---------- Exportar para tests (Node) ---------- */
if(typeof module!=='undefined'&&module.exports){
  module.exports={round2,totalLineas,desgloseIVA,cambioEfectivo,sumaPagos,restantePago,eur,seed,svg,
    _setDB:function(d){DB=d;},_getDB:function(){return DB;},
    abrirTicketMesa,addProducto,addLineaConfig,addMenu,cobrarTicket,finalizarTicket,abrirCaja,cajaAbierta,nuevoTicketBarra,anularTicket,setPase,addMesa,updateMesa,deleteMesa,
    setComensales,enviarCocina,comandasCocina,setEstadoLinea,ticketTodoListo,avisarCamarero,recogerComanda};
}

/* ================= INTERFAZ ================= */
var state={view:'sala',salaSel:null,editPlano:false,ticketActivo:null,catSel:null,reservaFecha:null,
  cobro:{pagos:[],ent:'',metodo:'efectivo',propina:''}};

function hoyISO(){ return new Date().toISOString().slice(0,10); }
function minsDesde(ts){ return Math.floor((Date.now()-ts)/60000); }

function toast(msg,tipo){
  if(typeof document==='undefined')return;
  var root=document.getElementById('toastRoot');
  if(!root){ root=document.createElement('div'); root.id='toastRoot'; document.body.appendChild(root); }
  var d=document.createElement('div'); d.className='toast '+(tipo||''); d.innerHTML=msg;
  root.appendChild(d);
  setTimeout(function(){ d.classList.add('out'); setTimeout(function(){ if(d.parentNode)d.parentNode.removeChild(d); },300); },3200);
}

function render(){
  if(typeof document==='undefined')return;
  try{ renderInner(); }
  catch(err){ var main=document.getElementById('main'); if(main) main.innerHTML='<div style="padding:40px;color:#e11d48"><h2>Se produjo un error</h2><pre style="white-space:pre-wrap">'+esc(err&&err.message)+'</pre></div>'; console.error(err); }
}
function renderInner(){
  document.querySelectorAll('.nav-item').forEach(function(b){ b.classList.toggle('active', b.dataset.view===state.view); });
  // badge cocina
  var nCoc=comandasCocina().reduce(function(s,c){return s+c.lineas.length;},0);
  var cb=document.getElementById('cocinaBadge'); if(cb){ cb.textContent=nCoc||''; cb.style.display=nCoc?'block':'none'; }
  var caja=cajaAbierta();
  var pill=document.getElementById('cajaPill');
  if(pill){ pill.className='caja-pill '+(caja?'on':'off'); pill.textContent=caja?'CAJA ABIERTA':'CAJA CERRADA'; }
  var main=document.getElementById('main');
  if(state.ticketActivo){ main.innerHTML=viewVenta(); return; }
  if(state.view==='sala') main.innerHTML=viewSala();
  else if(state.view==='cocina') main.innerHTML=viewCocina();
  else if(state.view==='productos') main.innerHTML=viewProductos();
  else if(state.view==='reservas') main.innerHTML=viewReservas();
  else if(state.view==='caja') main.innerHTML=viewCaja();
  else if(state.view==='informes') main.innerHTML=viewInformes();
}

/* ----- SALA ----- */
function viewSala(){
  var salas=DB.salas.slice().sort(function(a,b){return a.orden-b.orden;});
  var salaId=state.salaSel||salas[0].id;
  var mesas=DB.mesas.filter(function(m){return m.salaId===salaId;});
  var libres=mesas.filter(function(m){return m.estado==='libre';}).length;
  var ed=state.editPlano;
  var tabs=salas.map(function(s){return '<button class="tab'+(s.id===salaId?' active':'')+'" data-act="sala" data-id="'+s.id+'">'+esc(s.nombre)+'</button>';}).join('');
  var grid=mesas.map(function(m,idx){
    var t=m.ticketId?getTicket(m.ticketId):null;
    var tot=t?totalLineas(t.lineas):0;
    var aviso=t&&t.avisado?'<span class="bell">🔔</span>':'';
    var info=m.estado==='libre'?'<span class="plazas">'+m.plazas+' pax</span>':'<span class="tot">'+eur(tot)+'</span>';
    var sub=t&&t.comensales?'<span class="cms">👤'+t.comensales+'</span>':'';
    var time=t?'<span class="time">⏱ '+minsDesde(t.createdAt)+' min</span>':'';
    var x=(m.x==null?((idx%4)*150+24):m.x), y=(m.y==null?(Math.floor(idx/4)*132+24):m.y);
    var fd=formaDims(m.forma);
    var paseB=t?('<span class="pasebadge" style="background:'+(PASES[t.pase||0]||PASES[0]).c+'">'+(PASES[t.pase||0]||PASES[0]).n+'</span>'):'';
    return '<button class="mesa '+m.estado+(t&&t.avisado?' avisa':'')+(ed?' editable':'')+' f-'+(m.forma||'cuadrada')+'" data-act="mesa" data-id="'+m.id+'" style="left:'+x+'px;top:'+y+'px;width:'+fd.w+'px;height:'+fd.h+'px;border-radius:'+fd.r+'">'+aviso+paseB+'<span class="dot"></span><span class="nombre">'+esc(m.nombre)+'</span>'+info+sub+time+'</button>';
  }).join('');
  var editBtn='<button class="btn '+(ed?'green':'ghost')+'" data-act="toggleplano">'+(ed?'✓ Hecho':'✏️ Editar plano')+'</button>';
  return '<div class="topbar"><div class="ttl"><h1>'+esc(DB.restaurante||'Sala')+'</h1><span class="sub">'+libres+' / '+mesas.length+' mesas libres</span></div><div class="tabs">'+tabs+'</div>'
    +'<div class="right">'+editBtn+'<button class="btn primary" data-act="barra">⚡ Venta rápida</button></div></div>'
    +'<div class="content">'+(ed?'<div class="plano-tools"><button class="btn primary" data-act="addmesa">+ Añadir mesa</button><span class="muted">Toca una mesa para cambiar su forma o eliminarla · arrástrala para moverla</span></div>':'')+'<div class="plano'+(ed?' editing':'')+'">'+grid+'</div>'+(ed?'<p class="hint">✋ Crea tu plano: añade mesas, elige su forma (redonda, rectangular, taburete…) y colócalas como tu local.</p>':'')+'</div>';
}

/* ----- VENTA ----- */
function viewVenta(){
  var t=getTicket(state.ticketActivo); if(!t){state.ticketActivo=null;return viewSala();}
  var cats=DB.categorias.slice().sort(function(a,b){return a.orden-b.orden;});
  var catId=state.catSel||cats[0].id;
  var prods=DB.productos.filter(function(p){return p.categoriaId===catId&&p.activo;});
  var chips=cats.map(function(c){return '<button class="cat-chip'+(c.id===catId?' active':'')+'" style="--cc:'+c.color+'" data-act="cat" data-id="'+c.id+'"><span class="ci">'+(c.ic||'')+'</span>'+esc(c.nombre)+'</button>';}).join('');
  var pg=prods.map(function(p){
    var sin=p.controlStock&&p.stock<=0;
    var st=p.controlStock?'<span class="ps">'+(sin?'Agotado':'Stock '+p.stock)+'</span>':'';
    return '<button class="prod'+(sin?' sinstock':'')+'" data-act="add" data-id="'+p.id+'"><span class="pic">'+(p.ic||'🍽️')+'</span><span class="pn">'+esc(p.nombre)+'</span><span class="pp">'+eur(p.precio)+'</span>'+st+'</button>';
  }).join('');
  var uds=t.lineas.reduce(function(s,l){return s+l.cantidad;},0);
  var KEST={pendiente:['⏳','#d97706'],preparando:['🔥','#2563eb'],listo:['✅','#16a34a'],recogido:['📤','#94a3b8']};
  var lineas=t.lineas.length?t.lineas.map(function(l,i){
    var k=l.enviado?'<span class="kbadge" style="color:'+(KEST[l.kestado]?KEST[l.kestado][1]:'#94a3b8')+'">'+(KEST[l.kestado]?KEST[l.kestado][0]:'')+'</span>':'';
    var lock=l.enviado?' enviado':'';
    var det='';
    if(l.subs&&l.subs.length) det='<div class="ldet">'+l.subs.map(function(x){return esc(x);}).join('<br>')+'</div>';
    else if(l.mods&&l.mods.length) det='<div class="ldet">'+l.mods.map(function(m){return esc(m.n)+(m.p?' (+'+eur(m.p)+')':'');}).join(' · ')+'</div>';
    return '<div class="linea'+lock+'"><span class="lic">'+(l.ic||'•')+'</span><div class="ln"><b>'+esc(l.nombre)+' '+k+'</b><span>'+eur(l.precio)+(l.enviado?' · en cocina':'')+'</span>'+det+'</div>'
      +'<button class="qtybtn" data-act="menos" data-idx="'+i+'">−</button><span class="qty">'+l.cantidad+'</span>'
      +'<button class="qtybtn" data-act="mas" data-idx="'+i+'">+</button><span class="imp">'+eur(l.precio*l.cantidad)+'</span></div>';
  }).join(''):'<div class="empty"><div class="emoji">🧾</div>Toca productos para añadirlos a la comanda</div>';
  var total=totalLineas(t.lineas); var iva=desgloseIVA(total);
  var pend=lineasPendientesEnvio(t);
  var cms=t.comensales?('👤 '+t.comensales+' comensales'):'👤 Comensales';
  var _P=PASES[t.pase||0]||PASES[0], _nP=PASES[(t.pase||0)+1], _pP=PASES[(t.pase||0)-1];
  var pasectrl='<span class="pasepill" style="background:'+_P.c+'22;color:'+_P.c+'">🍽️ '+_P.n+'</span>'+(_nP?'<button class="btn ghost" data-act="pasenext">Marchar '+_nP.n+' ▶</button>':(_pP?'<button class="btn ghost" data-act="paseprev">◀ '+_pP.n+'</button>':''));
  return '<div class="topbar"><button class="btn ghost" data-act="volver">← Sala</button>'
    +'<div class="ttl"><h1>'+esc(t.mesaNombre||'Ticket')+'</h1><span class="sub">Ticket #'+t.numero+'</span></div>'
    +'<div class="right">'+pasectrl+'<button class="btn ghost" data-act="comensales">'+cms+'</button><button class="btn danger-ghost" data-act="anular">Anular</button></div></div>'
    +'<div class="content venta-content"><div class="venta">'
    +'<div class="carta"><div class="cat-bar">'+chips+'</div><div class="prod-grid">'+pg+'</div></div>'
    +'<div class="card ticket"><div class="thead"><b>Comanda</b><span class="uds">'+uds+' uds</span></div><div class="lineas">'+lineas+'</div>'
    +'<div class="tfoot">'
    +'<button class="btn outline block'+(pend?'':' off')+'" '+(pend?'':'disabled')+' data-act="enviarCocina">👨‍🍳 Enviar a cocina'+(pend?' ('+pend+')':'')+'</button>'
    +'<div class="iva-row"><span>Base '+eur(iva.base)+'</span><span>IVA 10% '+eur(iva.cuota)+'</span></div>'
    +'<div class="total-row"><span>TOTAL</span><span class="big">'+eur(total)+'</span></div>'
    +'<button class="btn green lg block" '+(t.lineas.length?'':'disabled')+' data-act="cobrar">💶 Cobrar '+eur(total)+'</button></div></div>'
    +'</div></div>';
}

/* ----- COCINA (KDS) ----- */
function viewCocina(){
  var coms=comandasCocina();
  var cards=coms.length?coms.map(function(c){
    var t=c.ticket; var mins=minsDesde(t.cocinaAt||t.createdAt);
    var urg=mins>=12?' urgente':(mins>=7?' aviso':'');
    var lis=c.lineas.map(function(l){
      var btn='';
      if(l.kestado==='pendiente') btn='<button class="btn sm primary" data-act="kprep" data-tid="'+t.id+'" data-kid="'+l.kid+'">Empezar</button>';
      else if(l.kestado==='preparando') btn='<button class="btn sm green" data-act="klisto" data-tid="'+t.id+'" data-kid="'+l.kid+'">Listo</button>';
      else if(l.kestado==='listo') btn='<span class="badge" style="background:#dcfce7;color:#15803d">Listo</span>';
      var kd='';
      if(l.subs&&l.subs.length) kd='<div class="kdet">'+l.subs.map(function(x){return esc(x);}).join('<br>')+'</div>';
      else if(l.mods&&l.mods.length) kd='<div class="kdet">'+l.mods.map(function(m){return esc(m.n);}).join(' · ')+'</div>';
      return '<div class="kline '+l.kestado+'"><span class="kq">'+l.cantidad+'×</span><span class="kn">'+(l.ic||'')+' '+esc(l.nombre)+kd+'</span>'+btn+'</div>';
    }).join('');
    var foot=ticketTodoListo(t)
      ? (t.avisado
          ? '<button class="btn sm green block" data-act="recoger" data-tid="'+t.id+'">📤 Marcar recogido</button>'
          : '<button class="btn sm warn-btn block" data-act="avisar" data-tid="'+t.id+'">🔔 Avisar camarero (recoger)</button>')
      : '';
    return '<div class="kcard'+urg+'"><div class="khead"><b>'+esc(t.mesaNombre||('#'+t.numero))+'</b>'+((t.pase&&PASES[t.pase])?'<span class="kpase" style="background:'+PASES[t.pase].c+'">'+PASES[t.pase].n+'</span>':'')+'<span class="ktime">⏱ '+mins+' min</span></div>'+lis+'<div class="kfoot">'+foot+'</div></div>';
  }).join(''):'<div class="empty"><div class="emoji">👨‍🍳</div>No hay comandas en cocina. Envía una comanda desde una mesa.</div>';
  return '<div class="topbar"><div class="ttl"><h1>Cocina · KDS</h1><span class="sub">'+coms.length+' comandas activas</span></div>'
    +'<div class="right"><button class="btn ghost" data-act="refrescar">↻ Actualizar</button></div></div>'
    +'<div class="content"><div class="kds-grid">'+cards+'</div>'
    +'<p class="hint">🔔 El avisador notifica aquí mismo. El envío al móvil del camarero (push real entre dispositivos) llega en la Fase 4 con el backend de sincronización — ver PARIDAD-AGORA.md</p></div>';
}

/* ----- PRODUCTOS ----- */
function viewProductos(){
  var bajo=DB.productos.filter(function(p){return p.controlStock&&p.stock<=5;});
  var aviso=bajo.length?'<div class="card warn"><b>⚠️ Stock bajo:</b> '+bajo.map(function(p){return esc(p.nombre)+' ('+p.stock+')';}).join(' · ')+'</div>':'';
  var rows=DB.productos.map(function(p){
    var cat=(DB.categorias.filter(function(c){return c.id===p.categoriaId;})[0]||{}).nombre||'—';
    return '<tr><td><span class="tic">'+(p.ic||'')+'</span> <b>'+esc(p.nombre)+'</b></td><td>'+esc(cat)+'</td><td>'+eur(p.precio)+'</td>'
      +'<td>'+(p.controlStock?'<b style="color:'+(p.stock<=5?'#e11d48':'inherit')+'">'+p.stock+'</b>':'∞')+'</td>'
      +'<td><span class="badge" style="background:'+(p.activo?'#dcfce7':'#fee2e2')+';color:'+(p.activo?'#15803d':'#e11d48')+'">'+(p.activo?'Activo':'Inactivo')+'</span></td>'
      +'<td class="row-actions"><button class="btn ghost sm" data-act="editp" data-id="'+p.id+'">Editar</button></td></tr>';
  }).join('');
  return '<div class="topbar"><div class="ttl"><h1>Carta y stock</h1><span class="sub">'+DB.productos.length+' productos</span></div><div class="right"><button class="btn ghost" data-act="reset">↻ Restaurar demo</button><button class="btn primary" data-act="nuevop">+ Nuevo</button></div></div>'
    +'<div class="content">'+aviso+'<div class="card"><table class="tbl"><thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
}

/* ----- RESERVAS ----- */
function viewReservas(){
  var fecha=state.reservaFecha||hoyISO();
  var del=DB.reservas.filter(function(r){return r.fecha===fecha;}).sort(function(a,b){return a.hora.localeCompare(b.hora);});
  var pax=del.filter(function(r){return r.estado!=='cancelada';}).reduce(function(s,r){return s+r.personas;},0);
  var EST={pendiente:['Pendiente','#fef9c3','#854d0e'],sentada:['Sentada','#dcfce7','#15803d'],cancelada:['Cancelada','#fee2e2','#b91c1c'],no_show:['No-show','#e2e8f0','#475569']};
  var rows=del.length?del.map(function(r){
    var e=EST[r.estado];
    var acc=r.estado==='pendiente'?'<button class="btn green sm" data-act="sentar" data-id="'+r.id+'">Sentar</button><button class="btn ghost sm" data-act="cancelarR" data-id="'+r.id+'">Cancelar</button>':'';
    return '<tr><td><b>'+esc(r.hora)+'</b></td><td>'+esc(r.nombre)+(r.notas?'<div class="note">'+esc(r.notas)+'</div>':'')+'</td>'
      +'<td>'+r.personas+'</td><td>'+esc(r.telefono||'—')+'</td><td>'+esc(r.origen||'Local')+'</td>'
      +'<td><span class="badge" style="background:'+e[1]+';color:'+e[2]+'">'+e[0]+'</span></td><td class="row-actions">'+acc+'</td></tr>';
  }).join(''):'<tr><td colspan="7" class="muted">No hay reservas este día.</td></tr>';
  return '<div class="topbar"><div class="ttl"><h1>Reservas</h1><span class="sub">'+del.length+' reservas · '+pax+' comensales</span></div>'
    +'<input type="date" id="fechaR" value="'+fecha+'" class="datein">'
    +'<div class="right"><button class="btn primary" data-act="nuevaR">+ Nueva reserva</button></div></div>'
    +'<div class="content"><div class="card"><table class="tbl"><thead><tr><th>Hora</th><th>Cliente</th><th>Pax</th><th>Teléfono</th><th>Origen</th><th>Estado</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    +'<p class="hint">🔌 Integraciones de reservas (TheFork, Google Reserve, web propia) — ver PARIDAD-AGORA.md</p></div>';
}

/* ----- CAJA ----- */
function viewCaja(){
  var caja=cajaAbierta();
  if(!caja){
    return '<div class="topbar"><div class="ttl"><h1>Caja</h1><span class="sub">Cerrada</span></div></div><div class="content"><div class="card pad" style="max-width:420px">'
      +'<div class="section-title">Abrir caja</div><div class="field"><label>Saldo inicial en cajón (€)</label><input id="saldoIni" type="number" value="100"></div>'
      +'<button class="btn green lg block" data-act="abrirCaja">Abrir caja</button></div></div>';
  }
  var tk=DB.tickets.filter(function(t){return t.estado==='cobrado'&&t.cajaId===caja.id;});
  var efe=tk.reduce(function(s,t){return s+(t.cobradoEfectivo||0);},0);
  var tar=tk.reduce(function(s,t){return s+(t.cobradoTarjeta||0);},0);
  var prop=tk.reduce(function(s,t){return s+(t.propina||0);},0);
  var enCaja=round2(caja.saldoInicial+efe);
  return '<div class="topbar"><div class="ttl"><h1>Caja</h1><span class="sub">Abierta</span></div></div><div class="content">'
    +'<div class="stat-grid">'
    +stat('Ventas turno',eur(efe+tar),'#4f46e5')+stat('💵 Efectivo',eur(efe),'#16a34a')+stat('💳 Tarjeta',eur(tar),'#7c3aed')
    +stat('🪙 Propinas',eur(prop),'#d97706')+stat('Tickets',tk.length,'#0891b2')+stat('Esperado en cajón',eur(enCaja),'#0ea5e9')+'</div>'
    +'<div class="card pad" style="max-width:460px;margin-top:18px"><div class="section-title">Cierre / arqueo</div>'
    +'<p class="muted">Inicial '+eur(caja.saldoInicial)+' + efectivo '+eur(efe)+' = <b>'+eur(enCaja)+'</b> esperado.</p>'
    +'<div class="field"><label>Efectivo contado (€)</label><input id="contado" type="number"></div>'
    +'<button class="btn danger lg block" data-act="cerrarCaja">Cerrar caja</button></div></div>';
}
function stat(l,v,c){ return '<div class="card stat"><div class="l">'+l+'</div><div class="v" style="color:'+c+'">'+v+'</div></div>'; }

/* ----- INFORMES ----- */
function viewInformes(){
  var hoy=new Date(); hoy.setHours(0,0,0,0);
  var del=DB.tickets.filter(function(t){return t.estado==='cobrado'&&(t.closedAt||0)>=hoy.getTime();});
  var venta=del.reduce(function(s,t){return s+totalLineas(t.lineas);},0);
  var medio=del.length?venta/del.length:0;
  var rank={};
  del.forEach(function(t){t.lineas.forEach(function(l){ var r=rank[l.productoId]||{nombre:l.nombre,ic:l.ic,uds:0,imp:0}; r.uds+=l.cantidad; r.imp+=l.precio*l.cantidad; rank[l.productoId]=r; });});
  var top=Object.keys(rank).map(function(k){return rank[k];}).sort(function(a,b){return b.imp-a.imp;}).slice(0,10);
  var hora=new Array(24).fill(0);
  del.forEach(function(t){ hora[new Date(t.closedAt).getHours()]+=totalLineas(t.lineas); });
  var maxH=Math.max.apply(null,[1].concat(hora));
  var bars=hora.map(function(v,h){return '<div class="bar"><div class="barfill" title="'+eur(v)+'" style="height:'+(v/maxH*110)+'px"></div><div class="barl">'+h+'</div></div>';}).join('');
  var rows=top.length?top.map(function(r,i){return '<tr><td>'+(i+1)+'</td><td><span class="tic">'+(r.ic||'')+'</span> <b>'+esc(r.nombre)+'</b></td><td>'+r.uds+'</td><td>'+eur(r.imp)+'</td></tr>';}).join(''):'<tr><td colspan="4" class="muted">Sin ventas hoy todavía. Cobra algún ticket y vuelve.</td></tr>';
  return '<div class="topbar"><div class="ttl"><h1>Informes</h1><span class="sub">Hoy · '+hoy.toLocaleDateString('es-ES')+'</span></div></div><div class="content">'
    +'<div class="stat-grid">'+stat('Ventas hoy',eur(venta),'#4f46e5')+stat('Tickets',del.length,'#16a34a')+stat('Ticket medio',eur(medio),'#d97706')+'</div>'
    +'<div class="card pad" style="margin-top:18px"><div class="section-title">Ventas por hora</div><div class="chart">'+bars+'</div></div>'
    +'<div class="card" style="margin-top:18px"><div class="section-title pad-t">Productos más vendidos (hoy)</div>'
    +'<table class="tbl"><thead><tr><th>#</th><th>Producto</th><th>Uds</th><th>Importe</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
}

/* ----- MODALES ----- */
function openModal(html){ document.getElementById('modalRoot').innerHTML='<div class="overlay" data-act="closeModal">'+html+'</div>'; }
function closeModal(){ document.getElementById('modalRoot').innerHTML=''; }

function modalComensales(){
  var t=getTicket(state.ticketActivo); if(!t)return;
  var btns=[1,2,3,4,5,6,8,10,12].map(function(n){return '<button class="cms-btn'+(t.comensales===n?' active':'')+'" data-act="setcms" data-n="'+n+'">'+n+'</button>';}).join('');
  openModal('<div class="modal sm" data-stop><h2>¿Cuántos comensales?</h2><div class="mbody"><div class="cms-grid">'+btns+'</div>'
    +'<div class="field" style="margin-top:14px"><label>Otro número</label><input id="cms_n" type="number" value="'+(t.comensales||'')+'"></div></div>'
    +'<div class="foot"><button class="btn ghost" data-act="closeModal">Omitir</button><button class="btn primary" data-act="savecms">Guardar</button></div></div>');
}

function modalCobro(){
  var t=getTicket(state.ticketActivo); var total=totalLineas(t.lineas);
  var co=state.cobro; var pagado=sumaPagos(co.pagos); var restante=restantePago(total,co.pagos);
  var ent=parseFloat(co.ent||'0')||0;
  var cambio=restante<=0 ? round2(pagado-total) : 0;
  var listaPagos=co.pagos.length?('<div class="pagos-list">'+co.pagos.map(function(p,i){return '<div class="pago-item"><span>'+(p.metodo==='efectivo'?'💵':'💳')+' '+esc(p.metodo)+'</span><b>'+eur(p.importe)+'</b><button class="xpago" data-act="delpago" data-i="'+i+'">✕</button></div>';}).join('')+'</div>'):'';
  var rapidos=[restante>0?restante:total,Math.ceil((restante>0?restante:total)/5)*5,Math.ceil((restante>0?restante:total)/10)*10,20,50].filter(function(v,i,a){return a.indexOf(v)===i&&v>0;});
  var keypad='<div class="keypad">'+['1','2','3','4','5','6','7','8','9','C','0','⌫'].map(function(k){return '<button data-act="kp" data-k="'+k+'">'+k+'</button>';}).join('')+'</div>';
  var cobertura=restante<=0.001
    ? '<div class="cubierto">✅ Cubierto'+(cambio>0?' · Cambio '+eur(cambio):'')+'</div>'
    : '<div class="restante">Restante <b>'+eur(restante)+'</b></div>';
  openModal('<div class="modal" data-stop><h2>Cobrar '+eur(total)+'</h2><div class="mbody">'
    +listaPagos+cobertura
    +'<div class="tabs pay-tabs"><button class="tab'+(co.metodo==='efectivo'?' active':'')+'" data-act="metodo" data-m="efectivo">💵 Efectivo</button><button class="tab'+(co.metodo==='tarjeta'?' active':'')+'" data-act="metodo" data-m="tarjeta">💳 Tarjeta</button></div>'
    +'<div class="pay-amount">'+(co.ent?eur(ent):'—')+'</div>'
    +'<div class="rapidos">'+rapidos.map(function(v){return '<button class="btn ghost" data-act="rapido" data-v="'+v+'">'+eur(v)+'</button>';}).join('')+'</div>'
    +keypad
    +'<button class="btn outline block" style="margin-top:10px" data-act="addpago">+ Añadir pago ('+ (co.metodo==='efectivo'?'efectivo':'tarjeta') +')</button>'
    +'<div class="field" style="margin-top:14px"><label>Propina (€) — opcional</label><input id="propina" type="number" step="0.50" value="'+esc(co.propina)+'"></div>'
    +'</div><div class="foot"><button class="btn ghost" data-act="closeModal">Cancelar</button>'
    +'<button class="btn green" '+(restante<=0.001?'':'disabled')+' data-act="finalizar">Finalizar cobro</button></div></div>');
}

function modalProducto(p){
  var cats=DB.categorias.map(function(c){return '<option value="'+c.id+'"'+(p&&p.categoriaId===c.id?' selected':'')+'>'+esc(c.nombre)+'</option>';}).join('');
  openModal('<div class="modal" data-stop><h2>'+(p?'Editar producto':'Nuevo producto')+'</h2><div class="mbody">'
    +'<div class="inline"><div class="field" style="width:90px"><label>Icono</label><input id="mp_ic" value="'+esc(p?(p.ic||''):'🍽️')+'"></div>'
    +'<div class="field" style="flex:1"><label>Nombre</label><input id="mp_n" value="'+esc(p?p.nombre:'')+'"></div></div>'
    +'<div class="inline"><div class="field" style="flex:1"><label>Precio (€)</label><input id="mp_p" type="number" step="0.10" value="'+(p?p.precio:'')+'"></div>'
    +'<div class="field" style="flex:1"><label>Stock</label><input id="mp_s" type="number" value="'+(p?p.stock:0)+'"></div></div>'
    +'<div class="field"><label>Categoría</label><select id="mp_c">'+cats+'</select></div>'
    +'<div class="inline"><label class="chk"><input type="checkbox" id="mp_cs" '+(!p||p.controlStock?'checked':'')+'> Controlar stock</label>'
    +'<label class="chk"><input type="checkbox" id="mp_a" '+(!p||p.activo?'checked':'')+'> Activo</label></div>'
    +'</div><div class="foot">'+(p?'<button class="btn danger-ghost" data-act="delp" data-id="'+p.id+'" style="margin-right:auto">Eliminar</button>':'')
    +'<button class="btn ghost" data-act="closeModal">Cancelar</button><button class="btn primary" data-act="savep" data-id="'+(p?p.id:'')+'">Guardar</button></div></div>');
}
function modalReserva(){
  var fecha=state.reservaFecha||hoyISO();
  openModal('<div class="modal" data-stop><h2>Nueva reserva</h2><div class="mbody">'
    +'<div class="field"><label>Cliente</label><input id="r_n"></div>'
    +'<div class="inline"><div class="field" style="flex:1"><label>Hora</label><input id="r_h" type="time" value="21:00"></div>'
    +'<div class="field" style="flex:1"><label>Comensales</label><input id="r_p" type="number" value="2"></div></div>'
    +'<div class="field"><label>Teléfono</label><input id="r_t"></div>'
    +'<div class="field"><label>Origen</label><select id="r_o"><option>Local</option><option>Teléfono</option><option>TheFork</option><option>Google</option><option>Web propia</option></select></div>'
    +'<div class="field"><label>Notas</label><input id="r_notas" placeholder="Alergias, trona, cumpleaños…"></div>'
    +'</div><div class="foot"><button class="btn ghost" data-act="closeModal">Cancelar</button><button class="btn primary" data-act="saveR" data-fecha="'+fecha+'">Guardar reserva</button></div></div>');
}

/* ----- EVENTOS ----- */
function onClick(e){
  var navBtn=e.target.closest('.nav-item'); if(navBtn){ state.view=navBtn.dataset.view; state.ticketActivo=null; render(); return; }
  var el=e.target.closest('[data-act]'); if(!el)return;
  var a=el.dataset.act, id=el.dataset.id;
  if(a==='closeModal'){ closeModal(); return; }
  switch(a){
    case 'sala': state.salaSel=id; render(); break;
    case 'toggleplano': state.editPlano=!state.editPlano; render(); break;
    case 'addmesa': { var sa=state.salaSel||DB.salas.slice().sort(function(a,b){return a.orden-b.orden;})[0].id; var nm=addMesa(sa); render(); modalMesaEditor(nm.id); break; }
    case 'savemesa': { updateMesa(el.dataset.id,{nombre:document.getElementById('me_n').value,forma:document.getElementById('me_f').value,plazas:parseInt(document.getElementById('me_p').value)||4}); closeModal(); render(); break; }
    case 'delmesa': { var rdel=deleteMesa(el.dataset.id); if(rdel==='ocupada'){ alert('No se puede eliminar una mesa ocupada.'); } else { closeModal(); render(); } break; }
    case 'pasenext': setPase(state.ticketActivo,1); render(); break;
    case 'paseprev': setPase(state.ticketActivo,-1); render(); break;
    case 'mesa': { if(state.editPlano)break; var m=getMesa(id); var t=abrirTicketMesa(m); state.ticketActivo=t.id; state.catSel=null; render(); if(!t.comensales) modalComensales(); break; }
    case 'barra': { var t2=nuevoTicketBarra(); state.ticketActivo=t2.id; state.catSel=null; render(); break; }
    case 'volver': state.ticketActivo=null; render(); break;
    case 'comensales': modalComensales(); break;
    case 'setcms': { document.getElementById('cms_n').value=el.dataset.n; document.querySelectorAll('.cms-btn').forEach(function(b){b.classList.toggle('active',b.dataset.n===el.dataset.n);}); break; }
    case 'savecms': { var v=parseInt(document.getElementById('cms_n').value)||null; setComensales(state.ticketActivo,v); closeModal(); render(); break; }
    case 'cat': state.catSel=id; render(); break;
    case 'add': { var p=getProducto(id); if(p.controlStock&&p.stock<=0)break; if(p.esMenu){openMenu(p);} else if(p.mods&&p.mods.length){openConfig(p);} else {addProducto(state.ticketActivo,p);render();} break; }
    case 'cfgsel': { var cg=+el.dataset.g, co=+el.dataset.o; var grp=getProducto(state.cfg.pid).mods[cg]; if(grp.tipo==='check'){ var arr=state.cfg.sel[cg]; var ix=arr.indexOf(co); if(ix>=0)arr.splice(ix,1); else arr.push(co); } else { state.cfg.sel[cg]=co; } modalConfig(); break; }
    case 'addcfg': confirmConfig(); break;
    case 'menusel': state.menu.sel[+el.dataset.g]=+el.dataset.o; modalMenu(); break;
    case 'addmenu': confirmMenu(); break;
    case 'mas': cambiarCantidad(state.ticketActivo,+el.dataset.idx,1); render(); break;
    case 'menos': cambiarCantidad(state.ticketActivo,+el.dataset.idx,-1); render(); break;
    case 'enviarCocina': { var n=enviarCocina(state.ticketActivo); if(n>0) toast('👨‍🍳 '+n+' plato(s) enviados a cocina'); render(); break; }
    case 'anular': if(confirm('¿Anular este ticket?')){ anularTicket(state.ticketActivo); state.ticketActivo=null; render(); } break;
    case 'cobrar': state.cobro={pagos:[],ent:'',metodo:'efectivo',propina:''}; modalCobro(); break;
    case 'metodo': state.cobro.metodo=el.dataset.m; modalCobro(); break;
    case 'rapido': state.cobro.ent=el.dataset.v; modalCobro(); break;
    case 'kp': { var k=el.dataset.k, co=state.cobro; if(k==='C')co.ent=''; else if(k==='⌫')co.ent=co.ent.slice(0,-1); else co.ent=(co.ent+k).replace(/^0+(\d)/,'$1'); modalCobro(); break; }
    case 'addpago': { var co2=state.cobro; var total=totalLineas(getTicket(state.ticketActivo).lineas); var rest=restantePago(total,co2.pagos);
      var imp=parseFloat(co2.ent||'0')||0; if(imp<=0) imp=rest; if(imp<=0){ break; }
      co2.pagos.push({metodo:co2.metodo,importe:round2(imp)}); co2.ent=''; modalCobro(); break; }
    case 'delpago': { state.cobro.pagos.splice(+el.dataset.i,1); modalCobro(); break; }
    case 'finalizar': { var co3=state.cobro; var pr=parseFloat((document.getElementById('propina')||{}).value)||0;
      var ok=finalizarTicket(state.ticketActivo,{pagos:co3.pagos,propina:pr});
      if(ok){ closeModal(); state.ticketActivo=null; toast('✅ Ticket cobrado'+(pr>0?' · propina '+eur(pr):''),'ok'); render(); } break; }
    case 'kprep': setEstadoLinea(el.dataset.tid,el.dataset.kid,'preparando'); render(); break;
    case 'klisto': { setEstadoLinea(el.dataset.tid,el.dataset.kid,'listo'); var tt=getTicket(el.dataset.tid); if(tt&&ticketTodoListo(tt)) toast('🔔 '+(tt.mesaNombre||('#'+tt.numero))+': comanda lista'); render(); break; }
    case 'avisar': { avisarCamarero(el.dataset.tid); var t4=getTicket(el.dataset.tid); toast('🔔 Aviso enviado: '+(t4.mesaNombre||('#'+t4.numero))+' lista para recoger','ok'); render(); break; }
    case 'recoger': recogerComanda(el.dataset.tid); render(); break;
    case 'refrescar': render(); break;
    case 'nuevop': modalProducto(null); break;
    case 'editp': modalProducto(getProducto(id)); break;
    case 'savep': saveProducto(id); break;
    case 'delp': if(confirm('¿Eliminar producto?')){ DB.productos=DB.productos.filter(function(x){return x.id!==id;}); save(); closeModal(); render(); } break;
    case 'reset': if(confirm('¿Restaurar el restaurante demo? Se perderán los cambios.')){ resetDemo(); state.ticketActivo=null; render(); } break;
    case 'abrirCaja': abrirCaja(parseFloat(document.getElementById('saldoIni').value)||0); render(); break;
    case 'cerrarCaja': { var c=document.getElementById('contado').value; if(confirm('¿Cerrar caja del turno?')){ cerrarCaja(parseFloat(c)||0); render(); } break; }
    case 'nuevaR': modalReserva(); break;
    case 'saveR': saveReserva(el.dataset.fecha); break;
    case 'sentar': cambiarEstadoReserva(id,'sentada'); render(); break;
    case 'cancelarR': cambiarEstadoReserva(id,'cancelada'); render(); break;
  }
}
function saveProducto(id){
  var n=document.getElementById('mp_n').value.trim(); if(!n){alert('Pon el nombre');return;}
  var data={id:id||uid(),nombre:n,ic:document.getElementById('mp_ic').value||'🍽️',categoriaId:document.getElementById('mp_c').value,
    precio:parseFloat(document.getElementById('mp_p').value)||0,stock:parseFloat(document.getElementById('mp_s').value)||0,
    controlStock:document.getElementById('mp_cs').checked,activo:document.getElementById('mp_a').checked};
  if(id){ DB.productos=DB.productos.map(function(p){return p.id===id?data:p;}); } else { DB.productos.push(data); }
  save(); closeModal(); render();
}
function saveReserva(fecha){
  var n=document.getElementById('r_n').value.trim(); if(!n){alert('Pon el nombre del cliente');return;}
  crearReserva({fecha:fecha,hora:document.getElementById('r_h').value,nombre:n,
    personas:parseInt(document.getElementById('r_p').value)||1,telefono:document.getElementById('r_t').value,
    origen:document.getElementById('r_o').value,notas:document.getElementById('r_notas').value});
  closeModal(); render();
}
function onChange(e){
  if(e.target.id==='fechaR'){ state.reservaFecha=e.target.value; render(); }
  if(e.target.id==='propina'){ state.cobro.propina=e.target.value; }
}

if(typeof window!=='undefined'){ window.addEventListener('error',function(ev){ var er=document.getElementById('main'); if(er&&!er.innerHTML){ er.innerHTML='<div style="padding:40px;color:#e11d48">Error: '+esc(ev.message)+'</div>'; } }); }
if(typeof document!=='undefined'){
  function boot(){ load(); document.addEventListener('click',onClick); document.addEventListener('change',onChange);
    document.addEventListener('pointerdown',onPointerDown); document.addEventListener('pointermove',onPointerMove); document.addEventListener('pointerup',onPointerUp);
    render(); setInterval(function(){ if((state.view==='sala'||state.view==='cocina')&&!state.ticketActivo&&!state.editPlano&&!drag) render(); },20000); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
}

/* ----- Fase 2b: modales de modificadores y menús ----- */
function openConfig(p){ state.cfg={pid:p.id, sel:p.mods.map(function(g){return g.tipo==='check'?[]:0;})}; modalConfig(); }
function openMenu(p){ state.menu={mid:p.id, sel:p.pasos.map(function(){return 0;})}; modalMenu(); }

function modalConfig(){
  var p=getProducto(state.cfg.pid); if(!p)return; var supl=0;
  var groups=p.mods.map(function(g,i){
    var sel=state.cfg.sel[i];
    var opts=g.op.map(function(o,j){ var act=(g.tipo==='check')?(sel.indexOf(j)>=0):(j===sel); if(act) supl+=o.p||0;
      return '<button class="opt'+(act?' active':'')+'" data-act="cfgsel" data-g="'+i+'" data-o="'+j+'">'+esc(o.n)+(o.p?' +'+eur(o.p):'')+'</button>'; }).join('');
    var hint=g.tipo==='check'?' <span class="mghint">(varios)</span>':'';
    return '<div class="mgroup"><div class="mgl">'+esc(g.n)+hint+'</div><div class="opts">'+opts+'</div></div>';
  }).join('');
  var precio=round2(p.precio+supl);
  openModal('<div class="modal" data-stop><h2>'+(p.ic||'')+' '+esc(p.nombre)+'</h2><div class="mbody">'+groups+'</div>'
    +'<div class="foot"><button class="btn ghost" data-act="closeModal">Cancelar</button><button class="btn primary" data-act="addcfg">Añadir · '+eur(precio)+'</button></div></div>');
}
function confirmConfig(){
  var p=getProducto(state.cfg.pid); var supl=0; var mods=[];
  p.mods.forEach(function(g,i){
    if(g.tipo==='check'){ state.cfg.sel[i].forEach(function(j){ var o=g.op[j]; supl+=o.p||0; mods.push({n:o.n, p:o.p||0}); }); }
    else { var o=g.op[state.cfg.sel[i]]; supl+=o.p||0; mods.push({n:g.n+': '+o.n, p:o.p||0}); }
  });
  addLineaConfig(state.ticketActivo,p,mods,p.precio+supl); closeModal(); render();
}

function modalMenu(){
  var m=getProducto(state.menu.mid); if(!m)return; var supl=0;
  var steps=m.pasos.map(function(ps,i){
    var sel=state.menu.sel[i];
    var opts=ps.op.map(function(o,j){ if(j===sel) supl+=o.p||0;
      return '<button class="opt'+(j===sel?' active':'')+'" data-act="menusel" data-g="'+i+'" data-o="'+j+'">'+esc(o.n)+(o.p?' +'+eur(o.p):'')+'</button>'; }).join('');
    return '<div class="mgroup"><div class="mgl">'+(i+1)+'. '+esc(ps.n)+'</div><div class="opts">'+opts+'</div></div>';
  }).join('');
  var precio=round2(m.precio+supl);
  openModal('<div class="modal menuwiz" data-stop><h2>'+(m.ic||'')+' '+esc(m.nombre)+'</h2><div class="mbody"><div class="precio-prev">'+eur(precio)+'</div>'+steps+'</div>'
    +'<div class="foot"><button class="btn ghost" data-act="closeModal">Cancelar</button><button class="btn primary" data-act="addmenu">Añadir menú · '+eur(precio)+'</button></div></div>');
}
function confirmMenu(){
  var m=getProducto(state.menu.mid); var supl=0; var subs=[];
  m.pasos.forEach(function(ps,i){ var o=ps.op[state.menu.sel[i]]; supl+=o.p||0; subs.push(ps.n+': '+o.n+(o.p?' (+'+eur(o.p)+')':'')); });
  addMenu(state.ticketActivo,m,subs,m.precio+supl); closeModal(); render();
}

/* ----- Plano de sala: arrastrar mesas (mouse + táctil) ----- */
var drag=null;
function onPointerDown(e){ if(!state.editPlano)return; var m=e.target.closest('.mesa[data-id]'); if(!m)return;
  var plano=document.querySelector('.plano'); if(!plano)return;
  var pr=plano.getBoundingClientRect(), mr=m.getBoundingClientRect();
  drag={id:m.dataset.id,el:m,dx:e.clientX-mr.left,dy:e.clientY-mr.top,pr:pr,x0:e.clientX,y0:e.clientY,moved:false};
  m.classList.add('dragging'); e.preventDefault(); }
function onPointerMove(e){ if(!drag)return;
  if(Math.abs(e.clientX-drag.x0)>5||Math.abs(e.clientY-drag.y0)>5) drag.moved=true;
  var x=Math.max(0,e.clientX-drag.pr.left-drag.dx), y=Math.max(0,e.clientY-drag.pr.top-drag.dy);
  drag.el.style.left=Math.round(x)+'px'; drag.el.style.top=Math.round(y)+'px'; }
function onPointerUp(){ if(!drag)return;
  var d=drag; drag=null; d.el.classList.remove('dragging');
  if(!d.moved){ modalMesaEditor(d.id); return; }
  var x=parseInt(d.el.style.left)||0, y=parseInt(d.el.style.top)||0;
  var m=getMesa(d.id); if(m){m.x=x;m.y=y;save();} }

/* ----- Formas de mesa y editor de plano ----- */
function formaDims(f){
  if(f==='redonda')return {w:114,h:114,r:'50%'};
  if(f==='rectangular')return {w:178,h:96,r:'14px'};
  if(f==='ovalada')return {w:178,h:104,r:'52% / 60%'};
  if(f==='barra')return {w:76,h:76,r:'50%'};
  return {w:120,h:106,r:'16px'};
}
function modalMesaEditor(id){
  var m=getMesa(id); if(!m)return;
  var formas=[['cuadrada','Cuadrada'],['redonda','Redonda'],['rectangular','Rectangular'],['ovalada','Ovalada'],['barra','Taburete (barra)']];
  var opts=formas.map(function(f){return '<option value="'+f[0]+'"'+((m.forma||'cuadrada')===f[0]?' selected':'')+'>'+f[1]+'</option>';}).join('');
  openModal('<div class="modal sm" data-stop><h2>Mesa '+esc(m.nombre)+'</h2><div class="mbody">'
    +'<div class="field"><label>Nombre</label><input id="me_n" value="'+esc(m.nombre)+'"></div>'
    +'<div class="inline"><div class="field" style="flex:1"><label>Forma de la mesa</label><select id="me_f">'+opts+'</select></div>'
    +'<div class="field" style="width:96px"><label>Plazas</label><input id="me_p" type="number" value="'+(m.plazas||4)+'"></div></div>'
    +'</div><div class="foot"><button class="btn danger-ghost" data-act="delmesa" data-id="'+m.id+'" style="margin-right:auto">Eliminar</button>'
    +'<button class="btn ghost" data-act="closeModal">Cancelar</button><button class="btn primary" data-act="savemesa" data-id="'+m.id+'">Guardar</button></div></div>');
}
