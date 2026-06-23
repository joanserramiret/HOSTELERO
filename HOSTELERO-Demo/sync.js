/* HOSTELERO · sync.js — capa de sincronización del SERVICIO (comandas).
   - Si la app se abre desde el SERVIDOR local (http://IP:puerto) => tiempo real por SSE (LAN, sin internet).
   - Si se abre como archivo suelto (file://) => modo local (pestañas/ventanas del mismo navegador).
   API: onChange(fn) · comandas() · enviarComanda(c) · setLinea(id,kid,estado) · avisar(id) · recoger(id) · reset() · modo()
*/
(function (global) {
  var listeners = [], state = { comandas: [], v: 0 }, modo = 'local';
  var esServidor = (typeof location !== 'undefined' && (location.protocol === 'http:' || location.protocol === 'https:'));
  function emit() { listeners.forEach(function (f) { try { f(state); } catch (e) {} }); }
  function setState(s) { if (s) { state = s; try { if (s.master) localStorage.setItem('hostelero_master_cache', JSON.stringify(s.master)); } catch (e) {} emit(); } }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function getC(id) { return state.comandas.filter(function (c) { return c.id === id; })[0]; }

  // ---- Modo SERVIDOR (LAN, SSE) ----
  function initServidor() {
    modo = 'servidor';
    try {
      var es = new EventSource('/api/stream');
      es.onmessage = function (e) { try { setState(JSON.parse(e.data)); } catch (err) {} };
    } catch (e) { initLocal(); }
  }
  function post(url, data) {
    try { return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data || {}) }).catch(function () {}); } catch (e) {}
  }

  // ---- Modo LOCAL (mismo navegador) ----
  var KEY = 'hostelero_servicio_v1', bc = null;
  function initLocal() {
    modo = 'local';
    try { var r = localStorage.getItem(KEY); if (r) state = JSON.parse(r); } catch (e) {}
    if (!state.fichajes) state.fichajes = [];
    if (typeof BroadcastChannel !== 'undefined') { bc = new BroadcastChannel('hostelero_sync'); bc.onmessage = function (e) { if (e.data && e.data.t === 'state') setState(e.data.state); }; }
    if (typeof window !== 'undefined') window.addEventListener('storage', function (e) { if (e.key === KEY && e.newValue) { try { setState(JSON.parse(e.newValue)); } catch (er) {} } });
  }
  function commitLocal() { state.v = (state.v || 0) + 1; try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} emit(); if (bc) bc.postMessage({ t: 'state', state: state }); }

  var Sync = {
    modo: function () { return modo; },
    onChange: function (fn) { listeners.push(fn); fn(state); },
    comandas: function () { return state.comandas.filter(function (c) { return c.estado !== 'recogida'; }); },
    enviarComanda: function (c) {
      if (modo === 'servidor') return post('/api/comanda', c);
      c.id = uid(); c.createdAt = Date.now(); c.estado = 'pendiente'; c.avisado = false;
      (c.lineas || []).forEach(function (l) { l.kid = l.kid || uid(); l.estado = l.estado || 'pendiente'; });
      state.comandas.push(c); commitLocal();
    },
    setLinea: function (id, kid, est) {
      if (modo === 'servidor') return post('/api/linea', { id: id, kid: kid, estado: est });
      var c = getC(id); if (c) { var l = (c.lineas || []).filter(function (x) { return x.kid === kid; })[0]; if (l) { l.estado = est; commitLocal(); } }
    },
    todoListo: function (id) { var c = getC(id); return !!c && c.lineas.length > 0 && c.lineas.every(function (l) { return l.estado === 'listo'; }); },
    avisar: function (id) { if (modo === 'servidor') return post('/api/avisar', { id: id }); var c = getC(id); if (c) { c.avisado = true; commitLocal(); } },
    recoger: function (id) { if (modo === 'servidor') return post('/api/recoger', { id: id }); var c = getC(id); if (c) { c.estado = 'recogida'; c.avisado = false; commitLocal(); } },
    reset: function () { if (modo === 'servidor') return post('/api/reset', {}); state = { comandas: [], v: (state.v || 0) + 1 }; commitLocal(); },
    master: function () { return state.master || { categorias: [], productos: [], salas: [], mesas: [] }; },
    guardarMaster: function (m) { if (modo === 'servidor') return post('/api/master', { master: m }); state.master = m; commitLocal(); },
    fichajes: function () { return state.fichajes || []; },
    fichar: function (reg) { if (modo === 'servidor') return post('/api/fichaje', { registro: reg }); if (!state.fichajes) state.fichajes = []; reg.id = reg.id || uid(); state.fichajes.push(reg); commitLocal(); },
    agotados: function () { return state.agotados || []; },
    estaAgotado: function (id) { return (state.agotados || []).indexOf(id) >= 0; },
    setAgotado: function (id, val) { if (modo === 'servidor') return post('/api/agotado', { id: id, agotado: !!val }); if (!state.agotados) state.agotados = []; var i = state.agotados.indexOf(id); if (val && i < 0) state.agotados.push(id); else if (!val && i >= 0) state.agotados.splice(i, 1); commitLocal(); },
    reservas: function () { return state.reservas || []; },
    guardarReserva: function (r) { if (modo === 'servidor') return post('/api/reserva', { reserva: r }); if (!state.reservas) state.reservas = []; if (r.id) { var k = -1; state.reservas.forEach(function (x, i) { if (x.id === r.id) k = i; }); if (k >= 0) state.reservas[k] = r; else state.reservas.push(r); } else { r.id = 'rsv' + uid(); r.creada = Date.now(); state.reservas.push(r); } commitLocal(); },
    borrarReserva: function (id) { if (modo === 'servidor') return post('/api/reserva-borrar', { id: id }); state.reservas = (state.reservas || []).filter(function (x) { return x.id !== id; }); commitLocal(); }
  };

  if (esServidor) initServidor(); else initLocal();
  global.HOSTELERO_SYNC = Sync;
  if (typeof module !== 'undefined' && module.exports) module.exports = Sync;
})(typeof window !== 'undefined' ? window : globalThis);
