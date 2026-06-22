# HOSTELERO · TPV de hostelería

TPV (Terminal Punto de Venta) para bares y restaurantes. Clon funcional de Ágora,
reconstruido desde cero para ser **más simple, multiplataforma y offline-first**.

> Replicamos *funcionalidad y flujos de trabajo*. El código, los textos y la marca son propios.

---

## ⚡ Pruébalo ya (sin instalar nada)

Abre **`HOSTELERO-TPV.html`** con tu navegador. Funciona sin conexión y sin instalación;
los datos se guardan en el propio dispositivo (localStorage).

> **Importante:** si al abrirlo ves el código en vez de la app, es que el `.html` está
> asociado a un editor de texto. Haz **clic derecho → Abrir con → Google Chrome / Edge**
> (o abre el navegador y pulsa **Ctrl+O**). No lo abras desde un editor de código.

Trae el restaurante demo **"La Taberna"**: 50 productos en 10 categorías, 29 mesas en
4 salas (Comedor, Terraza, Barra, Reservado) y reservas de ejemplo. Botón **"↻ Restaurar demo"** en Carta.

Flujo de prueba:
1. **Sala** → toca una mesa → indica los **comensales**.
2. Toca productos de la carta → se añaden a la comanda.
3. **👨‍🍳 Enviar a cocina** → aparece en la pantalla **Cocina (KDS)**.
4. En **Cocina**: marca cada plato *Empezar → Listo* y **🔔 Avisa al camarero** para recoger.
5. **Cobrar** → **dividir cuenta / pago mixto** (efectivo + tarjeta) y **propina**.
6. **Caja** → arqueo con efectivo, tarjeta y propinas; **Informes** del día.

---

## 🧩 Funciones (MVP actual)

| Módulo | Estado | Qué hace |
|---|---|---|
| **Sala / Mesas** | ✅ | 4 salas, **plano editable arrastrando mesas**, estados, comensales, tiempo y total en vivo, aviso de cocina |
| **Venta / Cobro** | ✅ | Carta con iconos, **modificadores (con/sin, suplementos y extras múltiples)**, **menús/combinados**, IVA, **dividir cuenta + pago mixto + propina** |
| **Cocina (KDS)** | ✅ | Envío de comandas, estados por plato (pendiente→preparando→listo), **avisador** de recogida |
| **Productos / Stock** | ✅ | Alta/edición/baja, categorías, control de stock, aviso de stock bajo |
| **Caja** | ✅ | Apertura, efectivo/tarjeta/propinas, arqueo y cierre con descuadre |
| **Informes** | ✅ | Ventas del día, ticket medio, ranking de productos, gráfico por horas |
| **Reservas** | ✅ | Agenda por día, alta, estados, origen del canal |
| **Integraciones** | 🔜 | Ver hoja de ruta y `PARIDAD-AGORA.md` |

---

## 🏗️ Dos entregables en este repo

1. **`HOSTELERO-TPV.html`** — app de un solo archivo, vanilla JS, cero dependencias.
   Ideal para probar, demos y como TPV ligero inmediato. *Es la que está verificada con tests.*
2. **Proyecto `/` (React + TypeScript + Vite + Dexie/IndexedDB)** — la base de
   ingeniería escalable para llevar HOSTELERO a las 3 plataformas. Mismo diseño y
   misma lógica, organizada en módulos.

### Ejecutar el proyecto React (en tu ordenador, con internet)
```bash
npm install
npm run dev      # desarrollo en http://localhost:5173
npm run build    # build de producción en /dist
```

### Tests de la lógica
```bash
node test-logic.cjs   # 16 comprobaciones de negocio (cobro, stock, caja, IVA, cambio)
```

---

## 📱 Estrategia multiplataforma (una sola base de código)

La clave para mejorar a Ágora sin multiplicar el trabajo: **misma app web, tres envoltorios.**

| Destino | Cómo | Esfuerzo |
|---|---|---|
| **Web / Tablet (iPad, Android)** | PWA instalable desde el navegador | ✅ ya cubierto |
| **Escritorio Windows** (TPV físico, como Ágora) | Envolver con **Electron** o **Tauri** | bajo |
| **App nativa tablet** | Envolver con **Capacitor** | bajo |

Ventaja sobre Ágora: una instalación, datos offline, y la misma interfaz táctil en todos los sitios.

---

## 🔌 Hoja de ruta de integraciones

Pensada a partir de los puntos típicos de integración de un TPV de hostelería:

- **Facturación legal**: Verifactu (AEAT) y TicketBAI (País Vasco) — firma y envío de tickets.
- **Impresoras de cocina/barra**: ESC/POS por red/USB, con comandas por zona (cocina, barra).
- **Datáfono / TPV-PIN**: integración con terminal de pago (Redsys, Stripe Terminal, etc.).
- **Balanza**: productos por peso.
- **Reservas**: TheFork, Google Reserve, web propia (entrada ya contemplada en el módulo).
- **Contabilidad/ERP**: exportación de cierres (CSV/API) a gestor o software contable.
- **Multi-dispositivo**: sincronización entre varias comandas/TPV (backend opcional).

---

## ✨ Mejoras frente a Ágora (objetivo del proyecto)

- **Más simple**: interfaz táctil limpia, menos clics para cobrar.
- **Offline-first real**: si cae internet, el TPV sigue cobrando.
- **Una sola base** para web, tablet y escritorio (sin licencias por módulo).
- **Sin instalación pesada** para empezar: un archivo HTML y a vender.

---

## 🗂️ Estructura
```
hostelero/
├── HOSTELERO-TPV.html      ← app de un solo archivo (pruébala ya)
├── app.js                  ← lógica de la versión standalone
├── test-logic.cjs          ← tests de negocio (Node)
├── index.html              ← entrada del proyecto React
├── package.json
└── src/
    ├── db/                 ← IndexedDB (Dexie) + datos demo
    ├── store/operations.ts ← lógica de negocio
    ├── modules/            ← sala · venta · productos · caja · informes · reservas
    ├── components/         ← layout y navegación
    └── utils/              ← formato de moneda, IVA
```
