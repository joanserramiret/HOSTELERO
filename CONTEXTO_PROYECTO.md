# HOSTELERO · IA 360 — Contexto del proyecto (traspaso)

> Documento para poner al día a cualquier modelo/asistente que retome el proyecto.
> Actualizado: julio 2026. Propietario: Joan Serra Miret.

---

## 1. Qué es

POS hostelero (bar/restaurante) **IA-nativo**, inspirado en la operativa de AgoraPos pero con **branding propio HOSTELERO** (no copiar marca/paleta/logos de Ágora — riesgo de IP). Corre **100% local** en un PC Windows en LAN, sin dependencias de npm y sin depender de internet para operar (salvo la IA de entorno, que sí lo usa).

Visión de producto: suite **360** (TPV + cocina + compras + RRHH + contabilidad + reservas) con un **cuadro de mando** y un **Maître IA** que cruza los datos y propone decisiones.

---

## 2. Arquitectura técnica

- **`server.cjs`** — servidor local en **Node puro (CommonJS), sin npm**. Multi-puerto:
  - 7870 lanzador · 7871 TPV · 7872 comandera · 7873 KDS · 7874 Admin · 7875 carta digital.
  - Tiempo real por **SSE** (`/api/stream`). Persistencia en **`servicio.json`**.
  - `master` tiene un campo **`version`** (actualmente **22**); si no coincide, se re-siembra el `master` (¡ojo! eso borra la config a demo — por eso los cambios nuevos se hacen por **migración no destructiva** en `cargar()`, sin subir versión).
- **Módulos front compartidos**: `engine.js` (HOSTELERO_AUTH, FICHAJE, ESTACIONES), `sync.js` (HOSTELERO_SYNC, capa de datos SSE/local), `brand.js` (favicon/splash/PWA), `maitre.js` (el Maître, ver §4).
- **Apps HTML** (una por rol): `HOSTELERO-TPV.html`, `Comandera-Movil.html`, `Cocina-KDS.html`, `Admin.html`, `Carta-Digital.html`, `index.html` (lanzador).
- **Estaciones**: cada dispositivo es una estación (tipo tpv/comandera/kds) con su config (impresoras, KDS columnas/pases, `botonesOcultos` para el configurador de botones).

---

## 3. Apps y qué hacen

- **TPV** (centro del sistema): toma comandas, cobro, mapa de mesas, reservas, caja, informes. Barra de navegación arriba, columna de funciones y teclado numérico plegable (estética tipo Agora). Sin pestaña "Cocina" ni "Carta" (la carta se edita en Admin). Documentos: reimprimir, cambiar forma de pago sin refacturar, devoluciones, convertir a factura, reabrir ticket en otra mesa, mover ticket, informe Z con previsualización antes de imprimir.
- **Comandera** (móvil): toma pedidos, envío por línea, sacar la cuenta, 123 pases, pedir/marchar 2/3/4, cambiar comensales, mover ticket, abrir cajón.
- **KDS (cocina)**: pantallas configurables por preparación/pase, alertas de marcha.
- **Admin**: carta, estaciones, impresoras, empleados, tarifas, reservas, clientes, **Maître IA** (ver §4) y fichajes. La columna de navegación tiene scroll.
- **Carta digital** y lanzador.

---

## 4. El Maître IA (`maitre.js`)

FAB + panel **omnipresente** en todas las apps. Dos capas:

1. **Análisis de negocio** (local, reglas): sugerencias de precio por food cost, productos que rotan poco, avisos de 86/agotados.
2. **IA de entorno** (ver §5): briefing diario + banner de avisos + aviso al reservar terraza.

Configurable en **Admin → Maître IA**: interruptor maestro + toggles por función (precios, lentos, agotados, meteo, cruceros, vuelos, eventos). Flags en `config.maitre`. Hay un botón **"🎬 Cargar escenario de demostración"** que inyecta crucero+evento+reservas+ventas de ejemplo para presentaciones.

---

## 5. IA de Entorno (implementada, solo fuentes públicas/gratis)

Endpoint servidor **`/api/entorno`** (cacheado). Lo consume `maitre.js` (banner + panel + helper `window.HOSTELERO_ENTORNO.terrazaRiesgo()`).

- **Clima**: **Open-Meteo** (gratis, sin clave). Funciona en cualquier lat/lon. Detecta ventana de lluvia/viento/tormenta y avisa de reubicar **terraza** (salas marcadas como terraza en Admin). Umbrales configurables.
- **Geocoding**: **Open-Meteo Geocoding** (`/api/geocode`) — el cliente escribe su ciudad/dirección en Admin y se rellenan lat/lon solos. Escalable a cualquier local.
- **Cruceros**: **feed público oficial de la Autoridad Portuaria de Baleares** (visor del puerto). Endpoint real descubierto:
  `POST https://posidoniaweb.portsdebalears.com/gisweb_server/atraqueop.do?metodo=list` (JSON jqGrid; `rows[].cell`). Campos por índice: 7=tipo ("Cruceros turísticos"), 9=buque, 12=procedencia, 14=ETA "dd/mm/yyyy HH:MM", 15=ETD, 22=eslora, 32=pax, penúltimo=puerto ("Maó-Mahón"), último=estado. Se filtra por `config.entorno.puertoNombre` y por "en puerto hoy". Funciona para puertos de Baleares (Maó, Palma, Eivissa, Alcúdia, La Savina).
- **Vuelos**: **NO hay fuente pública gratuita y estable** (OpenSky cerró el acceso anónimo a llegadas; AENA no expone API). Queda como **agenda manual**. No prometer automatización aquí.
- **Eventos/fiestas**: agenda manual.
- **Agenda manual** (`state.agendaEntorno`): cruceros/vuelos/eventos que el local añade en Admin. Se siembra una demo (crucero + fiesta hoy) en la primera carga.

Todo **público, sin claves de pago**, y **escalable a cualquier local** (decisión de producto acordada con Joan).

---

## 6. Impresión física (Windows)

ESC/POS en crudo a impresoras de Windows por nombre, vía **PowerShell winspool RawPrinter** (sin npm). `/api/printers` (Get-Printer), `/api/imprimir-doc`, `imprimirComanda`, `imprimirMarcha`, `/api/abrir-cajon`. En Admin la impresora de Windows se elige en un **desplegable** (detección automática) con opción "escribir a mano". La impresión real solo funciona ejecutando `server.cjs` en el PC Windows con las impresoras instaladas.

---

## 7. Reglas y trampas del proyecto (IMPORTANTE)

- ⚠️ **bash trunca archivos grandes** al leerlos por el mount (lecturas inconsistentes de `.html`/`.cjs` grandes). **Validar siempre con la herramienta Read**, no con `wc`/`cat`/`node --check` sobre el archivo grande. Para validar JS de un archivo enorme: extraer solo el bloque nuevo a un archivo pequeño y comprobarlo aislado, o revisar con Read.
- Preferencia del usuario: **evitar bash** salvo cuando no hay alternativa (generar .pptx/.docx, leer PDFs subidos, descubrir endpoints). Para archivos del proyecto usar Read/Edit/Write.
- **npm está bloqueado** en el sandbox (403). Para generar Office usar **python-pptx / python-docx** (preinstalados), no `pptxgenjs`/`docx-js`.
- **No tocar `HOSTELERO-Demo/`**: es una foto antigua.
- **Branding propio**: navy `#0f2436`, teal `#0f766e`/`#14b8a6`, gold `#f59e0b`. No plagiar Ágora.
- Cambios en `server.cjs`: **no subir `version`** salvo que se quiera resetear a demo; usar migraciones en `cargar()`.
- `touch-action:manipulation` en botones (evita zoom por doble toque).

---

## 8. Plan de negocio (estado)

- Lluís (futuro socio) hizo un **análisis estratégico + DAFO** (`Hostelero_IA_360.pptx`, subido). Fortalezas 13 / Debilidades 9 / Oportunidades 9 / Amenazas 8; diapo 9 = cruces clave.
- Se creó un **deck-anexo**: `HOSTELERO_IA_360_Plan_Financiero_GTM.pptx` (mercado TAM/SAM/SOM, pricing, unit economics, proyección + petición de 200k€ pre-seed, GTM, roadmap, preguntas de inversor). **Cifras ilustrativas, a validar en pilotos.**
- Datos de mercado usados: ~280.400 establecimientos HORECA España; software de restauración ~€200M (2025) → ~€430M (2030, CAGR 17%); precios competidores ~20-32 €/mes; benchmarks SaaS PYME (LTV:CAC ≥3-5:1, payback <12m, churn SMB alto).
- Versión del DAFO con la amenaza A7 corregida: `Hostelero_IA_360_DAFO_actualizado.pptx`.

---

## 9. Temas legales (estado) — recordar: NO es asesoramiento jurídico

- Contrato revisado: **Acuerdo de Partner Ágora** (IGT Microelectronics), firmado por **JS Technology Menorca, S.L.** (Joan). Lectura preliminar:
  - **NO existe un pacto de no competencia post-contractual** que bloquee construir/vender un POS competidor.
  - Lo que ata: **cláusula 8.2.ii** (no usar el acceso/recursos de Ágora para crear un competidor), **8.2.i** (no ingeniería inversa), **cláusula 9 confidencialidad indefinida** (precios, know-how no público, portal de distribuidores, datos de clientes), **IP/marca** (cláusula 8). Salida con preaviso; cancelar antes de fin de año → pierde rappel.
  - Implicación: se puede **desarrollar HOSTELERO en "sala limpia"** (sin info/acceso de Ágora) y potencialmente **mantener el ingreso de distribuidor mientras se construye**. Confirmar con abogado y revisar si hay algún contrato personal aparte con no-compete.
- Documentos generados: `Consulta_legal_Agora_HOSTELERO.docx` (resumen 1 pág. para abogado con citas y preguntas) y `HOSTELERO_Pacto_socios_borrador.docx` (term sheet para negociar con Lluís).
- Puntos clave del pacto de socios a defender por Joan: separar capital (inversión) de equity de fundador; salario desde el día 1 financiado por la ronda (Joan no tiene colchón); no ceder el código a la sociedad hasta cerrar equity+salario; vesting 4 años + cliff; decisiones reservadas.

---

## 10. Archivos clave en la carpeta

- Código: `server.cjs`, `HOSTELERO-TPV.html`, `Comandera-Movil.html`, `Cocina-KDS.html`, `Admin.html`, `Carta-Digital.html`, `index.html`, `engine.js`, `sync.js`, `brand.js`, `maitre.js`.
- Docs producto: `CONFIGURACION-AGORA.md`, `PARIDAD-AGORA.md`, `Maqueta-Agora.html`.
- Negocio/legal: `HOSTELERO_IA_360_Plan_Financiero_GTM.pptx`, `Hostelero_IA_360_DAFO_actualizado.pptx`, `Consulta_legal_Agora_HOSTELERO.docx`, `HOSTELERO_Pacto_socios_borrador.docx`.
- `HOSTELERO-Demo/`: **no tocar** (foto antigua).

---

## 11. Pendiente / próximos pasos posibles

- Probar en el PC Windows: impresión física real y `/api/entorno` (necesita internet para clima/cruceros).
- Cerrar cifras reales del plan (pricing, salario, % capital) tras hablar con el mentor y el gestor de fondos de Lluís.
- Resolver con abogado el contrato de Ágora y firmar el pacto de socios **antes** de que Joan se dedique a tiempo completo (hito nº1).
- (Opcional) revisar si algún día hay fuente pública de vuelos para automatizar esa señal.
