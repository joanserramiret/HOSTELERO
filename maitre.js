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
            if (fc > 0.40) { var nv = Math.ceil((p.coste / 0.38) * 10) / 10; if (nv > p.precio) out.push({ ic: '📈', t: 'Sube ' + (p.nombreBoton || p.nombre) + ' a ' + nv.toFixed(2) + ' €', d: 'Food cost ' + Math.round(fc * 100) + '% → 38%. Margen ' + Math.round((1 - p.coste / nv) * 100) + '%.', act: 'precio', pid: p.id, val: nv }); }
          }
        });
        if (cub >= 6) { var ti = (m.tarifas || []).filter(function (t) { return t.activa === false; })[0]; if (ti) out.push({ ic: '⚡', t: 'Día fuerte: activa «' + ti.nombre + '»', d: cub + ' cubiertos reservados hoy. Aprovecha la demanda.', act: 'tarifa', tid: ti.id }); }
      }
      if (r === 'camarero') out.push({ ic: '🍷', t: 'Sube el ticket medio', d: 'Ofrece postre o café en cada mesa antes de cobrar.' });
      if (r === 'cocina' && cub > 0) out.push({ ic: '👨‍🍳', t: 'Hoy ~' + cub + ' cubiertos reservados', d: 'Adelanta fondos y mise en place para el pico.' });
      if (agot.length) { var noms = agot.map(function (id) { var p = (m.productos || []).filter(function (x) { return x.id === id; })[0]; return p ? (p.nombreBoton || p.nombre) : ''; }).filter(Boolean); if (noms.length) out.push({ ic: '🚫', t: 'Agotado hoy: ' + noms.slice(0, 4).join(', '), d: 'No lo ofrezcas (86 activo).' }); }
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
      + '#mtr-panel .empty{padding:24px 16px;color:#64748b;font-size:13px;text-align:center}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

    var fab = document.createElement('button'); fab.id = 'mtr-fab'; fab.title = 'El Maître';
    fab.innerHTML = '<span class="pulse"></span><img alt="Maître" src="' + MARK + '"><span class="b" style="display:none">0</span>';
    var panel = document.createElement('div'); panel.id = 'mtr-panel';
    var mount = function () { if (!document.body) return; document.body.appendChild(fab); document.body.appendChild(panel); };
    mount();

    function render() {
      var sg = sugerencias();
      var sig = sg.map(function (s) { return s.t; }).join('|');
      var badge = fab.querySelector('.b'); var pulse = fab.querySelector('.pulse');
      badge.textContent = sg.length; badge.style.display = sg.length ? '' : 'none';
      pulse.style.display = sg.length ? '' : 'none';
      if (open) drawPanel(sg);
      _sig = sig;
    }
    function drawPanel(sg) {
      var rolTxt = esAdmin() ? 'Gerencia' : (rol() === 'cocina' ? 'Cocina' : 'Sala');
      var h = '<div class="h"><img src="' + MARK + '"><div><b>El Maître</b><span>Tu gerente IA · ' + rolTxt + '</span></div></div>';
      if (!sg.length) { h += '<div class="empty">Todo en orden. El Maître está vigilando tu negocio. 👀</div>'; }
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
