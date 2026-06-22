const A=require('./app.test.cjs');
let pass=0, fail=0;
function eq(name,got,exp){ const ok=(typeof got==='number'&&typeof exp==='number')?Math.abs(got-exp)<0.001:got===exp;
  console.log((ok?'✅':'❌')+' '+name+'  got='+JSON.stringify(got)+(ok?'':' exp='+JSON.stringify(exp))); ok?pass++:fail++; }

// puros
eq('round2', A.round2(0.1+0.2), 0.3);
eq('totalLineas', A.totalLineas([{precio:1.8,cantidad:3},{precio:2.6,cantidad:2}]), 10.6);
eq('IVA base 11€', A.desgloseIVA(11,0.10).base, 10);
eq('cambio', A.cambioEfectivo(33.5,50), 16.5);
eq('sumaPagos', A.sumaPagos([{importe:10},{importe:5.5}]), 15.5);
eq('restante', A.restantePago(20,[{importe:12}]), 8);

const db=A.seed(); A._setDB(db);
A.abrirCaja(100);
const mesa=db.mesas[0];
const t=A.abrirTicketMesa(mesa,4);
eq('comensales al abrir', t.comensales, 4);
eq('mesa ocupada', mesa.estado, 'ocupada');
const cana=db.productos.find(p=>p.nombre==='Caña'); const stk=cana.stock;
A.addProducto(t.id,cana,3);
const ent=db.productos.find(p=>p.nombre==='Entrecot');
A.addProducto(t.id,ent,1);
const total=A.totalLineas(t.lineas);
eq('total ticket', total, A.round2(1.8*3+18));

// KDS: enviar a cocina
const nEnv=A.enviarCocina(t.id);
eq('lineas enviadas a cocina', nEnv, 2);
let coms=A.comandasCocina();
eq('1 comanda en cocina', coms.length, 1);
eq('2 lineas en la comanda', coms[0].lineas.length, 2);
// avanzar estados a listo
coms[0].lineas.forEach(l=>{ A.setEstadoLinea(t.id,l.kid,'preparando'); A.setEstadoLinea(t.id,l.kid,'listo'); });
eq('ticket todo listo', A.ticketTodoListo(t), true);
A.avisarCamarero(t.id);
eq('avisado', t.avisado, true);
A.recogerComanda(t.id);
eq('tras recoger, sin comandas activas', A.comandasCocina().length, 0);

// Pago mixto + propina (dividir cuenta)
const mitad=A.round2(total/2);
const ok=A.finalizarTicket(t.id,{pagos:[{metodo:'tarjeta',importe:mitad},{metodo:'efectivo',importe:total-mitad}],propina:2});
eq('finalizar pago mixto ok', ok, true);
eq('ticket cobrado', t.estado, 'cobrado');
eq('metodo mixto', t.metodoPago, 'mixto');
eq('propina guardada', t.propina, 2);
eq('cobrado tarjeta', t.cobradoTarjeta, mitad);
eq('cobrado efectivo', t.cobradoEfectivo, A.round2(total-mitad));
eq('stock descontado', cana.stock, stk-3);
eq('mesa liberada', mesa.estado, 'libre');

// no finaliza si no se cubre el total
const t2=A.abrirTicketMesa(db.mesas[1],2);
A.addProducto(t2.id, db.productos.find(p=>p.nombre==='Doble'),2);
const tot2=A.totalLineas(t2.lineas);
eq('no finaliza si falta importe', A.finalizarTicket(t2.id,{pagos:[{metodo:'efectivo',importe:1}]}), false);
eq('sigue abierto', t2.estado, 'abierto');

// efectivo con cambio: paga 10 sobre tot2(5.2) -> efectivo neto = total
A.finalizarTicket(t2.id,{pagos:[{metodo:'efectivo',importe:10}]});
eq('efectivo neto = total (cambio no cuenta)', t2.cobradoEfectivo, tot2);

// --- Fase 2b ---
(function(){
  const db2=A.seed(); A._setDB(db2); A.abrirCaja(50);
  const t=A.abrirTicketMesa(db2.mesas[0],2);
  const entrecot=db2.productos.find(p=>p.nombre==='Entrecot');
  // modificador con suplemento (Verduras +1.5)
  A.addLineaConfig(t.id, entrecot, [{n:'Punto: Al punto',p:0},{n:'Guarnición: Verduras',p:1.5}], entrecot.precio+1.5);
  eq('linea con modificador precio', t.lineas[0].precio, A.round2(18+1.5));
  eq('modificadores guardados', t.lineas[0].mods.length, 2);
  // menú con suplemento
  const menu=db2.productos.find(p=>p.esMenu);
  eq('menú existe en carta', !!menu, true);
  A.addMenu(t.id, menu, ['Primero: Gazpacho','Segundo: Entrecot (+3,00 €)','Postre: Flan','Bebida: Caña'], menu.precio+3);
  eq('menú precio fijo+supl', t.lineas[1].precio, A.round2(13.9+3));
  eq('menú con sublineas', t.lineas[1].subs.length, 4);
  // no se fusiona con linea simple
  A.addProducto(t.id, db2.productos.find(p=>p.nombre==='Caña'),1);
  A.addProducto(t.id, db2.productos.find(p=>p.nombre==='Caña'),1);
  const canas=t.lineas.filter(l=>l.nombre==='Caña');
  eq('cañas simples fusionadas en 1 linea x2', canas.length===1 && canas[0].cantidad===2, true);
})();

console.log('\n'+pass+' OK, '+fail+' FALLOS');
process.exit(fail?1:0);

