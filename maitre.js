/* HOSTELERO · maitre.js — el Maître omnipresente.
   Presencia fija del gerente IA en todas las apps: observa, propone según el rol y actúa.
   Requiere window.HOSTELERO_SYNC (datos en tiempo real) y window.HOSTELERO_AUTH (rol).
   Inclúyelo con:  <script src="maitre.js" defer></script>  */
(function () {
  var MARK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%230F766E'/%3E%3Cstop offset='1' stop-color='%2314B8A6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='16' y='16' width='480' height='480' rx='118' fill='url(%23g)'/%3E%3Crect x='150' y='156' width='48' height='200' rx='16' fill='%23fff'/%3E%3Crect x='314' y='156' width='48' height='200' rx='16' fill='%23fff'/%3E%3Crect x='150' y='232' width='212' height='48' rx='16' fill='%23fff'/%3E%3Ccircle cx='384' cy='150' r='40' fill='%230F172A'/%3E%3Ccircle cx='384' cy='150' r='34' fill='%23F59E0B'/%3E%3C/svg%3E";
  function start() {
    var S = window.HOSTELERO_SYNC, A = window.HOSTELERO_AUTH;
    if (!S) { return setTimeout(start, 300); }
    var open = false, _sig = '';
    function rol() { try { var s = A && A.sesion && A.sesion(); return (s && s.rol) || ''; } catch (e) { return ''; } }
    function esAdmin() { var r = rol(); return r === 'admin' || r === 'encargado'; }
    function r2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
    function hoy() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
    function master() { try { return S.master ? S.master() : {}; } catch (e) { return {}; } }
    function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function cfgMaitre() { var m = master(); return (m.config && m.config.maitre) || {}; }
    function fOn(k) { return cfgMaitre()[k] !== false; }
    function maitreActivo() { return cfgMaitre().activo !== false; }

    function sugerencias() {
      var m = master(), r = rol(), out = [];
      var prods = (m.productos || []).filter(function (p) { return !p.esMenu; });
      var agot = (S.agotados ? S.agotados() : []);
      var resv = (S.reservas ? S.reservas() : []).filter(function (x) { return x.fecha === hoy() && x.estado !== 'cancelada' && x.estado !== 'noshow'; });
      var cub = resv.reduce(function (s, x) { return s + (parseInt(x.personas, 10) || 0); }, 0);
      if (esAdmin()) {
        prods.forEach(function (p) {
          if (p.coste != null && p.precio != null && p.precio > 0) {
            var fc = p.coste / p.precio;
            if (fOn('precios') && fc > 0.40) { var nv = Math.ceil((p.coste / 0.38) * 10) / 10; if (nv > p.precio) out.push({ ic: '📈', t: 'Sube ' + (p.nombreBoton || p.nombre) + ' a ' + nv.toFixed(2) + ' €', d: 'Food cost ' + Math.round(fc * 100) + '% → 38%. Margen ' + Math.round((1 - p.coste / nv) * 100) + '%.', act: 'precio', pid: p.id, val: nv }); }
          }
        });
        if (cub >= 6) { var ti = (m.tarifas || []).filter(function (t) { return t.activa === false; })[0]; if (ti) out.push({ ic: '⚡', t: 'Día fuerte: activa «' + ti.nombre + '»', d: cub + ' cubiertos reservados hoy. Aprovecha la demanda.', act: 'tarifa', tid: ti.id }); }
        var v7 = m.ventas7d || {};
        var lento = prods.filter(function (p) { return p.activo !== false && p.precio != null && v7[p.id] != null && v7[p.id] <= 10; }).sort(function (a, b) { return (v7[a.id] || 0) - (v7[b.id] || 0); })[0];
        if (fOn('lentos') && lento) out.push({ ic: '🐌', t: (lento.nombreBoton || lento.nombre) + ' rota poco', d: 'Solo ' + (v7[lento.id] || 0) + ' uds en 7 días. Promociónalo, cámbialo de sitio o retíralo.' });
      }
      if (r === 'camarero') out.push({ ic: '🍷', t: 'Sube el ticket medio', d: 'Ofrece postre o café en cada mesa antes de cobrar.' });
      if (r === 'cocina' && cub > 0) out.push({ ic: '👨‍🍳', t: 'Hoy ~' + cub + ' cubiertos reservados', d: 'Adelanta fondos y mise en place para el pico.' });
      if (fOn('agotados') && agot.length) { var noms = agot.map(function (id) { var p = (m.productos || []).filter(function (x) { return x.id === id; })[0]; return p ? (p.nombreBoton || p.nombre) : ''; }).filter(Boolean); if (noms.length) out.push({ ic: '🚫', t: 'Agotado hoy: ' + noms.slice(0, 4).join(', '), d: 'No lo ofrezcas (86 activo).' }); }
      return out;
    }
    function aplicar(s) {
      try {
        if (s.act === 'precio') { var m = JSON.parse(JSON.stringify(master())); m.productos = m.productos.map(function (p) { return p.id === s.pid ? Object.assign({}, p, { precio: s.val }) : p; }); S.guardarMaster(m); }
        else if (s.act === 'tarifa') { var m2 = JSON.parse(JSON.stringify(master())); m2.tarifas = (m2.tarifas || []).map(function (t) { return t.id === s.tid ? Object.assign({}, t, { activa: true }) : t; }); S.guardarMaster(m2); }
      } catch (e) {}
    }

    // ---- UI ----
    var css = '#mtr-fab{position:fixed;right:16px;bottom:34px;z-index:9500;width:58px;height:58px;border-radius:50%;border:none;cursor:pointer;'
      + 'background:#0f172a;box-shadow:0 10px 26px rgba(15,118,110,.45);display:flex;align-items:center;justify-content:center;padding:0}'
      + '#mtr-fab img{width:40px;height:40px;border-radius:12px}'
      + '#mtr-fab .b{position:absolute;top:-3px;right:-3px;min-width:20px;height:20px;border-radius:10px;background:#e0436a;color:#fff;font:700 11px/20px -apple-system,Arial;text-align:center;padding:0 5px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial}'
      + '#mtr-fab .pulse{position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 0 rgba(20,184,166,.5);animation:mtrp 1.8s infinite}'
      + '@keyframes mtrp{70%{box-shadow:0 0 0 14px rgba(20,184,166,0)}100%{box-shadow:0 0 0 0 rgba(20,184,166,0)}}'
      + '#mtr-panel{position:fixed;right:16px;bottom:100px;z-index:9600;width:340px;max-width:calc(100vw - 32px);max-height:70vh;overflow:auto;'
      + 'background:#fff;color:#1e293b;border-radius:18px;box-shadow:0 24px 60px rgba(2,6,23,.4);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;display:none}'
      + '#mtr-panel .h{display:flex;align-items:center;gap:10px;padding:16px;background:linear-gradient(150deg,#0f766e,#0f172a);color:#fff;border-radius:18px 18px 0 0}'
      + '#mtr-panel .h img{width:30px;height:30px}#mtr-panel .h b{font-size:15px}#mtr-panel .h span{font-size:11px;color:#5eead4;display:block}'
      + '#mtr-panel .it{padding:13px 16px;border-bottom:1px solid #eef2f7}'
      + '#mtr-panel .it .tt{font-weight:800;font-size:14px}#mtr-panel .it .dd{color:#64748b;font-size:12.5px;margin:2px 0 0}'
      + '#mtr-panel .it button{margin-top:8px;background:#0f766e;color:#fff;border:none;border-radius:9px;padding:7px 14px;font-weight:800;font-size:12px;cursor:pointer}'
      + '#mtr-panel .empty{padding:24px 16px;color:#64748b;font-size:13px;text-align:center}'
      + '#mtr-panel .ent{padding:13px 16px;border-bottom:1px solid #eef2f7;background:#f8fafc}'
      + '#mtr-panel .ent .et{font-size:11px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:#0f766e;margin-bottom:6px}'
      + '#mtr-panel .ent .brf{font-size:12.5px;color:#334155;line-height:1.5}'
      + '#mtr-panel .ent .al{display:flex;gap:8px;align-items:flex-start;margin-top:9px}'
      + '#mtr-panel .ent .al .ai{font-size:17px;line-height:1.2}'
      + '#mtr-panel .ent .al .att{font-weight:800;font-size:13px;color:#1e293b}'
      + '#mtr-panel .ent .al .adt{font-size:12px;color:#64748b}'
      + '#mtr-panel .ent .al.alto .att{color:#b91c1c}'
      + '#mtr-ban{position:fixed;left:50%;transform:translateX(-50%);top:10px;z-index:9400;max-width:min(680px,calc(100vw - 24px));'
      + 'background:#0f172a;color:#fff;border-radius:13px;box-shadow:0 14px 40px rgba(2,6,23,.45);display:none;align-items:center;gap:11px;padding:10px 12px;'
      + 'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;border-left:5px solid #f59e0b}'
      + '#mtr-ban.alto{border-left-color:#ef4444}'
      + '#mtr-ban .bi{font-size:22px;flex:0 0 auto}'
      + '#mtr-ban .bt{font-weight:800;font-size:13.5px;line-height:1.25}'
      + '#mtr-ban .bd{font-size:12px;color:#cbd5e1;line-height:1.3}'
      + '#mtr-ban .bx{margin-left:6px;flex:0 0 auto;background:rgba(255,255,255,.14);border:none;color:#fff;width:26px;height:26px;border-radius:8px;cursor:pointer;font-size:15px}'
      + '#mtr-ban .bmore{flex:0 0 auto;background:#14b8a6;border:none;color:#04201d;font-weight:800;border-radius:8px;padding:6px 10px;font-size:12px;cursor:pointer}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

    var fab = document.createElement('button'); fab.id = 'mtr-fab'; fab.title = 'El Maître';
    fab.innerHTML = '<span class="pulse"></span><img alt="Maître" src="' + MARK + '"><span class="b" style="display:none">0</span>';
    var panel = document.createElement('div'); panel.id = 'mtr-panel';
    var mount = function () { if (!document.body) return; document.body.appendChild(fab); document.body.appendChild(panel); };
    mount();

    // ---- IA de Entorno (clima / cruceros / vuelos / eventos) ----
    var ENT = { data: null, banDismiss: '' };
    var ban = document.createElement('div'); ban.id = 'mtr-ban';
    function mountBan() { if (document.body && ban.parentNode !== document.body) document.body.appendChild(ban); }
    mountBan();
    function entFiltradas() {
      var d = ENT.data; if (!d || !d.alertas) return [];
      return d.alertas.filter(function (a) {
        if (a.tipo === 'clima') return fOn('meteo');
        if (a.tipo === 'crucero') return fOn('cruceros');
        if (a.tipo === 'vuelo') return fOn('vuelos');
        if (a.tipo === 'evento') return fOn('eventos');
        return true;
      });
    }
    function dibujarBanner() {
      mountBan();
      if (!maitreActivo()) { ban.style.display = 'none'; return; }
      var al = entFiltradas().filter(function (a) { return a.nivel === 'alto' || a.nivel === 'medio'; });
      if (!al.length) { ban.style.display = 'none'; return; }
      var sig = al.map(function (a) { return a.titulo; }).join('|');
      if (ENT.banDismiss === sig) { ban.style.display = 'none'; return; }
      var a0 = al[0], alto = al.some(function (a) { return a.nivel === 'alto'; });
      var extra = al.length > 1 ? (' · +' + (al.length - 1) + ' aviso' + (al.length - 1 > 1 ? 's' : '')) : '';
      ban.className = alto ? 'alto' : '';
      ban.innerHTML = '<span class="bi">' + esc(a0.ico || '⚠️') + '</span>'
        + '<div><div class="bt">' + esc(a0.titulo) + extra + '</div><div class="bd">' + esc(a0.texto || '') + '</div></div>'
        + '<button class="bmore" data-ban="more">Ver</button><button class="bx" data-ban="x" title="Ocultar">✕</button>';
      ban.style.display = 'flex';
    }
    ban.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ban]'); if (!b) return;
      if (b.dataset.ban === 'x') { var al = entFiltradas().filter(function (a) { return a.nivel === 'alto' || a.nivel === 'medio'; }); ENT.banDismiss = al.map(function (a) { return a.titulo; }).join('|'); ban.style.display = 'none'; }
      else { open = true; panel.style.display = 'block'; drawPanel(sugerencias()); }
    });
    function cargarEntorno() {
      try { fetch('/api/entorno', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) { ENT.data = d; render(); }).catch(function () {}); } catch (e) {}
    }
    window.HOSTELERO_ENTORNO = {
      get: function () { return ENT.data; },
      recargar: cargarEntorno,
      terrazaRiesgo: function (hhmm) {
        var d = ENT.data; if (!d || !d.alertas || !fOn('meteo')) return null;
        var h = parseInt(String(hhmm || '').slice(0, 2), 10); if (isNaN(h)) return null;
        var cl = d.alertas.filter(function (a) { return a.tipo === 'clima' && a.desde != null; })[0];
        if (cl && h >= cl.desde && h <= (cl.hasta + 1)) return cl;
        return null;
      }
    };
    cargarEntorno();
    setInterval(cargarEntorno, 15 * 60 * 1000);

    function render() {
      if (!maitreActivo()) { fab.style.display = 'none'; panel.style.display = 'none'; ban.style.display = 'none'; open = false; return; }
      fab.style.display = '';
      var sg = sugerencias();
      var ent = entFiltradas();
      var total = sg.length + ent.length;
      var sig = sg.map(function (s) { return s.t; }).join('|');
      var badge = fab.querySelector('.b'); var pulse = fab.querySelector('.pulse');
      badge.textContent = total; badge.style.display = total ? '' : 'none';
      pulse.style.display = total ? '' : 'none';
      if (open) drawPanel(sg);
      dibujarBanner();
      _sig = sig;
    }
    function drawPanel(sg) {
      var rolTxt = esAdmin() ? 'Gerencia' : (rol() === 'cocina' ? 'Cocina' : 'Sala');
      var h = '<div class="h"><img src="' + MARK + '"><div><b>El Maître</b><span>Tu gerente IA · ' + rolTxt + '</span></div></div>';
      var de = ENT.data, ent = entFiltradas();
      if (de && (de.briefing || ent.length)) {
        h += '<div class="ent"><div class="et">🛰️ Hoy en ' + esc(de.ciudad || 'tu zona') + '</div>';
        if (de.briefing) h += '<div class="brf">' + esc(de.briefing) + '</div>';
        ent.forEach(function (a) { h += '<div class="al ' + (a.nivel === 'alto' ? 'alto' : '') + '"><span class="ai">' + esc(a.ico || '•') + '</span><div><div class="att">' + esc(a.titulo) + '</div><div class="adt">' + esc(a.texto || '') + '</div></div></div>'; });
        h += '</div>';
      }
      if (esAdmin()) {
        var mm = master(), v7 = mm.ventas7d || {}, pot = 0, no = 0;
        sg.forEach(function (s) { if (s.act === 'precio') { var p = (mm.productos || []).filter(function (x) { return x.id === s.pid; })[0]; if (p && p.precio != null) { pot += (s.val - p.precio) * (v7[p.id] || 0); no++; } } });
        if (pot > 0) h += '<div style="padding:13px 16px;background:#0f766e;color:#fff">'
          + '<div style="font-size:11px;color:#5eead4;font-weight:800;letter-spacing:.6px;text-transform:uppercase">Resumen de la semana</div>'
          + '<div style="font-size:16px;font-weight:800;margin-top:2px">Margen potencial: +' + Math.round(pot) + ' €/sem</div>'
          + '<div style="font-size:12px;color:#cbd5e1;margin-top:1px">' + no + ' ajuste(s) de precio con impacto · aprueba abajo</div></div>';
      }
      if (!sg.length && !(de && (de.briefing || ent.length))) { h += '<div class="empty">Todo en orden. El Maître está vigilando tu negocio. 👀</div>'; }
      else { sg.forEach(function (s, i) { h += '<div class="it"><div class="tt">' + esc(s.ic + ' ' + s.t) + '</div><div class="dd">' + esc(s.d) + '</div>' + (s.act ? ('<button data-mi="' + i + '">Aplicar</button>') : '') + '</div>'; }); }
      panel.innerHTML = h;
      panel._sg = sg;
    }
    fab.addEventListener('click', function () { open = !open; panel.style.display = open ? 'block' : 'none'; if (open) drawPanel(sugerencias()); });
    panel.addEventListener('click', function (e) { var b = e.target.closest('[data-mi]'); if (b && panel._sg) { var s = panel._sg[+b.dataset.mi]; if (s && s.act) { aplicar(s); b.textContent = '✓ Aplicado'; b.disabled = true; setTimeout(render, 400); } } });
    try { S.onChange(render); } catch (e) {}
    render();
  }
  if (document.readyState !== 'loading') start(); else document.addEventListener('DOMContentLoaded', start);
})();
