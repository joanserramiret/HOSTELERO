/* HOSTELERO · brand.js — marca compartida: favicon + splash de carga.
   Inclúyelo en el <head> de cada app:  <script src="brand.js"></script>  */
(function () {
  var MARK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="%230F766E"/><stop offset="1" stop-color="%2314B8A6"/></linearGradient></defs><rect x="16" y="16" width="480" height="480" rx="118" fill="url(%23g)"/><rect x="150" y="156" width="48" height="200" rx="16" fill="%23fff"/><rect x="314" y="156" width="48" height="200" rx="16" fill="%23fff"/><rect x="150" y="232" width="212" height="48" rx="16" fill="%23fff"/><circle cx="384" cy="150" r="40" fill="%230F172A"/><circle cx="384" cy="150" r="34" fill="%23F59E0B"/></svg>';
  // Favicon
  try {
    var link = document.querySelector("link[rel~='icon']") || document.createElement('link');
    link.rel = 'icon'; link.type = 'image/svg+xml';
    link.href = 'data:image/svg+xml,' + MARK;
    document.head.appendChild(link);
  } catch (e) {}

  // Splash (solo una vez por carga)
  try {
    var css = '@keyframes hsl-pop{0%{transform:scale(.86);opacity:0}60%{opacity:1}100%{transform:scale(1);opacity:1}}'
      + '@keyframes hsl-bar{0%{transform:translateX(-100%)}100%{transform:translateX(220%)}}'
      + '@keyframes hsl-out{to{opacity:0;visibility:hidden}}'
      + '#hsl-splash{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;'
      + 'background:radial-gradient(120% 120% at 70% 10%,#10202e 0%,#0B1220 55%,#0F172A 100%);'
      + 'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;'
      + 'animation:hsl-out .5s ease 1.25s forwards}'
      + '#hsl-splash .mk{width:104px;height:104px;animation:hsl-pop .55s cubic-bezier(.2,.9,.25,1) both;filter:drop-shadow(0 14px 30px rgba(20,184,166,.35))}'
      + '#hsl-splash .wm{color:#fff;font-weight:800;font-size:30px;letter-spacing:3px}'
      + '#hsl-splash .tg{color:#5EEAD4;font-weight:700;font-size:12px;letter-spacing:5px;margin-top:-12px}'
      + '#hsl-splash .bar{width:188px;height:5px;border-radius:3px;background:#1E293B;overflow:hidden}'
      + '#hsl-splash .bar i{display:block;width:45%;height:100%;border-radius:3px;background:linear-gradient(90deg,#0F766E,#5EEAD4);animation:hsl-bar 1s ease-in-out infinite}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var s = document.createElement('div'); s.id = 'hsl-splash';
    s.innerHTML = '<img class="mk" alt="" src="data:image/svg+xml,' + MARK + '">'
      + '<div style="text-align:center"><div class="wm">HOSTELERO</div><div class="tg">IA POS · EL TPV QUE SE PIENSA SOLO</div></div>'
      + '<div class="bar"><i></i></div>';
    var mount = function () { (document.body || document.documentElement).appendChild(s);
      setTimeout(function () { if (s && s.parentNode) s.parentNode.removeChild(s); }, 2000); };
    if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
  } catch (e) {}

  // Aviso de copyright discreto en todas las ventanas
  try {
    var YEAR = new Date().getFullYear();
    var cp = document.createElement('div');
    cp.id = 'hsl-cp';
    cp.textContent = '© ' + YEAR + ' HOSTELERO · IA POS — Todos los derechos reservados';
    cp.style.cssText = 'position:fixed;right:8px;bottom:6px;z-index:9000;pointer-events:none;'
      + 'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;'
      + 'font-size:10px;letter-spacing:.2px;color:rgba(120,135,160,.55);user-select:none;'
      + 'text-shadow:0 1px 2px rgba(0,0,0,.18)';
    var mc = function () { if (document.body && !document.getElementById('hsl-cp')) document.body.appendChild(cp); };
    if (document.body) mc(); else document.addEventListener('DOMContentLoaded', mc);
  } catch (e) {}
})();
