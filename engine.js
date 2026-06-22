/* HOSTELERO · engine.js — núcleo compartido: usuarios, roles, permisos y sesión.
   Lo usan todas las apps (login, TPV, comandera, cocina, administración). */
'use strict';
(function (global) {
  var AUTH_KEY = 'hostelero_auth_v1';
  var SES_KEY = 'hostelero_sesion';

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  /* ---- Roles ---- */
  var ROLES = {
    admin:     { nombre: 'Administrador', color: '#4f46e5' },
    encargado: { nombre: 'Encargado',     color: '#0891b2' },
    camarero:  { nombre: 'Camarero',      color: '#16a34a' },
    cocina:    { nombre: 'Cocina',        color: '#d97706' }
  };

  /* ---- Apps (uso/dispositivo) ---- */
  var APPS = {
    tpv:       { nombre: 'TPV · Venta',        icon: '💳', file: 'HOSTELERO-TPV.html',     desc: 'Terminal de venta y cobro',      listo: true  },
    comandera: { nombre: 'Comandera · Tablet', icon: '📋', file: 'Comandera-Tablet.html',  desc: 'Tomar comandas en sala',         listo: false },
    movil:     { nombre: 'Comandera · Móvil',  icon: '📱', file: 'Comandera-Movil.html',   desc: 'Comandas desde el móvil',        listo: true  },
    cocina:    { nombre: 'Cocina · KDS',        icon: '👨‍🍳', file: 'Cocina-KDS.html',        desc: 'Monitor de cocina',              listo: true  },
    admin:     { nombre: 'Administración',      icon: '⚙️', file: 'Admin.html',             desc: 'Carta, usuarios, informes',      listo: true,  requierePassword: true }
  };

  /* ---- Qué apps puede abrir cada rol ---- */
  var APPS_POR_ROL = {
    admin:     ['tpv', 'comandera', 'movil', 'cocina', 'admin'],
    encargado: ['tpv', 'comandera', 'movil', 'cocina', 'admin'],
    camarero:  ['tpv', 'comandera', 'movil'],
    cocina:    ['cocina']
  };

  /* ---- Permisos de acción (los usarán TPV/Admin) ---- */
  var ACCIONES = {
    admin:     { anular: true,  caja: true,  informes: true,  editarCarta: true,  usuarios: true,  descuento: true },
    encargado: { anular: true,  caja: true,  informes: true,  editarCarta: true,  usuarios: false, descuento: true },
    camarero:  { anular: false, caja: false, informes: false, editarCarta: false, usuarios: false, descuento: false },
    cocina:    { anular: false, caja: false, informes: false, editarCarta: false, usuarios: false, descuento: false }
  };

  /* ---- Empleados por defecto (cámbialos en Administración) ---- */
  function seedUsuarios() {
    return [
      { id: 'u1', nombre: 'Admin',     rol: 'admin',     pin: '1111', usuario: 'admin',     password: 'admin', color: '#4f46e5', activo: true },
      { id: 'u2', nombre: 'Encargado', rol: 'encargado', pin: '2222', usuario: 'encargado', password: '1234',  color: '#0891b2', activo: true },
      { id: 'u3', nombre: 'Marta',     rol: 'camarero',  pin: '3333', color: '#16a34a', activo: true },
      { id: 'u4', nombre: 'Luis',      rol: 'camarero',  pin: '4444', color: '#15803d', activo: true },
      { id: 'u5', nombre: 'Cocina',    rol: 'cocina',    pin: '9999', color: '#d97706', activo: true }
    ];
  }

  function loadUsuarios() {
    // 1º usuarios centralizados del servidor (cacheados por sync.js)
    try { var mc = localStorage.getItem('hostelero_master_cache'); if (mc) { var m = JSON.parse(mc); if (m && m.usuarios && m.usuarios.length) return m.usuarios; } } catch (e) {}
    // 2º cache local antiguo  3º semilla por defecto
    try { var r = localStorage.getItem(AUTH_KEY); if (r) return JSON.parse(r); } catch (e) {}
    var u = seedUsuarios(); saveUsuarios(u); return u;
  }
  function saveUsuarios(u) { try { localStorage.setItem(AUTH_KEY, JSON.stringify(u)); } catch (e) {} }

  function setSesion(u) {
    try { localStorage.setItem(SES_KEY, JSON.stringify({ id: u.id, nombre: u.nombre, rol: u.rol, color: u.color })); } catch (e) {}
  }

  var Auth = {
    ROLES: ROLES, APPS: APPS,
    rolInfo: function (rol) { return ROLES[rol] || { nombre: rol, color: '#64748b' }; },
    usuarios: function () { return loadUsuarios().filter(function (u) { return u.activo; }); },
    todos: function () { return loadUsuarios(); },
    guardarUsuarios: function (u) { saveUsuarios(u); },

    loginPin: function (id, pin) {
      var u = loadUsuarios().filter(function (x) { return x.id === id && x.activo; })[0];
      if (u && String(u.pin) === String(pin)) { setSesion(u); return u; }
      return null;
    },
    loginAdmin: function (usuario, password) {
      function find(list) { return list.filter(function (x) { return x.usuario === usuario && x.password === password && x.activo !== false; })[0]; }
      var u = find(loadUsuarios()) || find(seedUsuarios()); // red de seguridad: el admin de fábrica siempre entra
      if (u && (u.rol === 'admin' || u.rol === 'encargado')) { return u; }
      return null;
    },
    sesion: function () {
      try { var r = localStorage.getItem(SES_KEY); if (r) return JSON.parse(r); } catch (e) {}
      return null;
    },
    logout: function () { try { localStorage.removeItem(SES_KEY); } catch (e) {} },

    appsDe: function (rol) { return APPS_POR_ROL[rol] || []; },
    puedeAbrir: function (rol, app) { return (APPS_POR_ROL[rol] || []).indexOf(app) >= 0; },
    permiso: function (rol, accion) { return !!(ACCIONES[rol] && ACCIONES[rol][accion]); }
  };

  /* ---- Fichaje / registro de jornada (RD de registro de jornada) ----
     Contenido conforme al art. 3 (identificación, inicio/fin de jornada y pausas
     con hora y minuto, totalización diaria) y art. 4 (asiento personal/directo,
     autoría de modificaciones). Conservación recomendada: 4 años (art. 4.f). */
  var FICH_KEY = 'hostelero_fichajes_v1';
  function loadFichajes() { try { var r = localStorage.getItem(FICH_KEY); if (r) return JSON.parse(r); } catch (e) {} return []; }
  function saveFichajes(a) { try { localStorage.setItem(FICH_KEY, JSON.stringify(a)); } catch (e) {} }
  // Lee los fichajes del SERVIDOR si está conectado (centralizado), si no, locales.
  function _regs() {
    var S = (typeof window !== 'undefined') && window.HOSTELERO_SYNC;
    if (S && S.modo && S.modo() === 'servidor' && S.fichajes) return S.fichajes();
    return loadFichajes();
  }
  function pad2(n) { return String(n).length < 2 ? '0' + n : String(n); }
  function fechaDe(ts) { var d = new Date(ts); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }

  var TIPOS = {
    entrada:      { etiqueta: 'Entrada',     icon: '🟢' },
    salida:       { etiqueta: 'Salida',      icon: '🔴' },
    pausa_inicio: { etiqueta: 'Inicio pausa', icon: '⏸️' },
    pausa_fin:    { etiqueta: 'Fin pausa',    icon: '▶️' }
  };

  var Fichaje = {
    TIPOS: TIPOS,
    registros: function () { return _regs(); },
    registrosDe: function (usuarioId, fecha) {
      return _regs().filter(function (r) { return r.usuarioId === usuarioId && (!fecha || r.fecha === fecha); })
        .sort(function (a, b) { return a.ts - b.ts; });
    },
    // 'fuera' | 'dentro' | 'pausa'
    estado: function (usuarioId) {
      var hoy = fechaDe(Date.now());
      var est = 'fuera';
      this.registrosDe(usuarioId, hoy).forEach(function (r) {
        if (r.tipo === 'entrada') est = 'dentro';
        else if (r.tipo === 'salida') est = 'fuera';
        else if (r.tipo === 'pausa_inicio') est = 'pausa';
        else if (r.tipo === 'pausa_fin') est = 'dentro';
      });
      return est;
    },
    siguienteAccion: function (usuarioId) {
      var e = this.estado(usuarioId);
      if (e === 'fuera') return 'entrada';
      if (e === 'pausa') return 'pausa_fin';
      return 'salida';
    },
    fichar: function (usuario, tipo) {
      var ts = Date.now();
      var reg = {
        id: uid(), usuarioId: usuario.id, usuarioNombre: usuario.nombre, rol: usuario.rol,
        tipo: tipo, ts: ts, fecha: fechaDe(ts),
        hora: new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        dispositivo: (typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 80) : 'engine'),
        modificado: false
      };
      var S = (typeof window !== 'undefined') && window.HOSTELERO_SYNC;
      if (S && S.modo && S.modo() === 'servidor' && S.fichar) { S.fichar(reg); return reg; }
      var a = loadFichajes(); a.push(reg); saveFichajes(a); return reg;
    },
    // minutos trabajados en una fecha (jornada menos pausas)
    minutosDia: function (usuarioId, fecha) {
      var trabajo = 0, abierto = null, pausa = null;
      this.registrosDe(usuarioId, fecha).forEach(function (r) {
        if (r.tipo === 'entrada') abierto = r.ts;
        else if (r.tipo === 'salida' && abierto) { trabajo += r.ts - abierto; abierto = null; }
        else if (r.tipo === 'pausa_inicio') pausa = r.ts;
        else if (r.tipo === 'pausa_fin' && pausa) { trabajo -= (r.ts - pausa); pausa = null; }
      });
      return Math.max(0, Math.round(trabajo / 60000));
    }
  };

  global.HOSTELERO_AUTH = Auth;
  global.HOSTELERO_FICHAJE = Fichaje;
  if (typeof module !== 'undefined' && module.exports) module.exports = { Auth: Auth, Fichaje: Fichaje };
})(typeof window !== 'undefined' ? window : globalThis);
