# HOSTELERO vs Ágora — Paridad de funciones y plan técnico

Análisis basado en los manuales oficiales de Ágora (Manual de Usuario v8.9.3 · 605 pág,
Guía del Integrador · 236 pág, Guía de Informes Personalizados · 18 pág, Guía del Distribuidor · 33 pág).
Objetivo: replicar **funcionalidad y flujos** mejorándolos en simplicidad y portabilidad. Código y marca propios.

---

## 1. Arquitectura: dónde mejoramos

| | Ágora | HOSTELERO |
|---|---|---|
| Plataforma base | App **Windows** (Win10 64-bit, 8 GB RAM) | App **web** offline-first (1 base de código) |
| Sub-apps | Administración, Comanderas, Monitores de Cocina, Almacén (apps web separadas) | Mismos roles como **vistas/PWA** de la misma base |
| Escritorio | Instalación pesada Windows | Envoltorio **Electron/Tauri** opcional |
| Tablet/Móvil | Comandera web | **PWA + Capacitor**, misma UI táctil |
| Datos | Servidor local + ACMS (nube) | **IndexedDB offline** + API de sincronización |
| Integración | **API REST** en puerto 8984 con `Api-Token` | API REST equivalente y **webhooks** (ver §4) |

**Mejora clave:** una sola instalación, offline real, sin licencias por módulo.

---

## 2. Inventario de funciones (Ágora → estado en HOSTELERO)

Leyenda:  ✅ hecho · 🟡 parcial · ⬜ planificado

### Venta / TPV
| Función Ágora | HOSTELERO |
|---|---|
| Carta por familias/subfamilias | ✅ (categorías; subfamilias ⬜) |
| Comanda, cantidades, líneas | ✅ |
| Cobro efectivo (cambio) / tarjeta | ✅ |
| **Dividir cuenta** (varios pagos al cerrar) | ⬜ |
| **Juntar / transferir mesas** | 🟡 (transferir en operations.ts) |
| **Pago mixto** (efectivo+tarjeta+vale) | ⬜ |
| **Comensales** (pedir al sentar/cerrar, mínimo por comensal) | ⬜ |
| **Invitaciones / atenciones** | ⬜ |
| **Propinas** (registrar, extraer de caja) | ⬜ |
| Anulación de ticket | ✅ |
| Notas predefinidas y libres por línea | 🟡 (campo nota en modelo) |

### Productos / Carta
| Función Ágora | HOSTELERO |
|---|---|
| Productos, precio, stock | ✅ |
| **Tarifas / listas de precio** (PriceListId) | ⬜ |
| **Modificadores** (con/sin, suplementos) | ⬜ |
| **Menús / combinados** (pasos, suplementos) | ⬜ |
| **Packs a precio fijo** | ⬜ |
| **Escandallos** (recetas, coste, margen) | ⬜ |
| Impuestos por producto (IVA 10/21/4) | 🟡 (IVA 10% global) |
| Ficha con imagen y etiquetas | ⬜ |

### Sala
| Función Ágora | HOSTELERO |
|---|---|
| Varias salas / centros de venta | ✅ |
| Estados de mesa + tiempo + total | ✅ |
| **Plano editable (arrastrar mesas)** | ⬜ |
| Pedir comensales por centro de venta | ⬜ |

### Caja
| Función Ágora | HOSTELERO |
|---|---|
| Apertura / saldo inicial | ✅ |
| **Movimientos de caja** (entradas/salidas) | ⬜ |
| Arqueo y descuadre | ✅ |
| **Cierre de caja** y **cierre de sistema (Z)** | 🟡 (cierre de caja ✅) |
| Formas de pago configurables (flags) | ⬜ (ver modelo §3) |

### Clientes / Fidelización
| Función Ágora | HOSTELERO |
|---|---|
| Tipos de cliente, tarifa y recargo | ⬜ |
| **Fidelización** (puntos, premios, club externo) | ⬜ (protocolo API §4) |
| Facturación a cliente (datos fiscales) | ⬜ |

### Almacén / Compras
| Función Ágora | HOSTELERO |
|---|---|
| Stock por almacén | 🟡 (stock simple) |
| **Pedidos / Albaranes / Facturas de proveedor** | ⬜ |
| **Albaranes de venta** (delivery notes) | ⬜ |
| Inventario / regularización | ⬜ |

### Reservas
| Función Ágora | HOSTELERO |
|---|---|
| Agenda, estados, origen del canal | ✅ |
| Integración TheFork / Google Reserve | ⬜ (webhooks §4) |

### Informes
| Función Ágora | HOSTELERO |
|---|---|
| Ventas, ticket medio, ranking, por hora | ✅ |
| **Informes personalizados (consulta a medida)** | ⬜ (`/api/custom-query`) |
| Cierres por turno / día de negocio | 🟡 |

### Cocina
| Función Ágora | HOSTELERO |
|---|---|
| **Monitor de cocina (KDS)** | ⬜ |
| Tipos y órdenes de preparación, por zona | ⬜ |
| Impresión de comandas por centro de producción | ⬜ |

---

## 3. Modelo de datos ampliado (derivado del Integrador)

Entidades a incorporar (nombres propios, inspirados en el esquema de Ágora):

- **Series** (numeración de documentos, `LastNumber`)
- **Usuarios** (perfil, PIN, color, tarjeta, modo formación)
- **TiposCliente** y **Clientes** (`DiscountRate`, `ApplySurcharge`, `PriceListId`, datos fiscales)
- **FormasPago** con flags: `GiveChange`, `IncludeInBalance`, `IncludeTipInBalance`,
  `OpenCashDrawer`, `RegisterTip`, `ExtractTipFromCashdrawer`
- **Impuestos** (tipos de IVA y recargo de equivalencia)
- **Proveedores**
- **Familias / Subfamilias / Productos / Tarifas / Modificadores / Menús / Packs / Escandallos**
- **CentrosVenta** (sala/barra/terraza/delivery) y **CentrosProducción** (cocina/barra)
- **TiposPreparación / ÓrdenesPreparación** (para KDS)
- **Promociones**: Descuento Directo · Pack a precio fijo · Personalizada
- **Documentos**: TicketAbierto · Factura/FacturaSimplificada · Albarán · Pedido/Albarán/Factura de proveedor
- **Caja**: MovimientosCaja · CierreCaja · CierreSistema (Z)
- **Fidelización**: Participantes · Consumiciones · Puntos/Premios

---

## 4. API e integraciones (equivalente y mejorada)

Ágora expone una API HTTP en `:8984` con cabecera `Api-Token`. HOSTELERO replica los
puntos equivalentes y añade webhooks salientes:

| Capacidad Ágora | Endpoint Ágora | Equivalente HOSTELERO |
|---|---|---|
| Exportar ventas/compras por día | `/api/export/?business-day=` | `GET /api/export` |
| Exportar tickets abiertos | `/api/export/tickets/` | `GET /api/tickets/open` |
| Datos maestros | `/api/export-master/?filter=Products,Families,Stocks…` | `GET /api/master` |
| Importar maestros | `/api/import/` | `POST /api/import` |
| Procesar documentos | `/api/doc/processed` | `POST /api/documents/process` |
| Albarán desde ticket | `/api/tickets/create-delivery-note/` | `POST /api/tickets/:id/delivery-note` |
| Informes a medida | `/api/custom-query` | `POST /api/reports/query` |
| Impresión libre | `/api/print/` | `POST /api/print` |
| Documento por GlobalId | `/api/document/?globalId=` | `GET /api/documents/:globalId` |

**Integraciones de hardware y legales (hoja de ruta):**
- **TicketBAI** (País Vasco) y **Verifactu** (AEAT): firma + QR + identificador en el ticket;
  factura simplificada por encima de umbral configurable. (Ágora ya imprime QR e ID de TicketBAI.)
- **Impresoras ESC/POS Epson** (tickets/comandas) y láser/inkjet (informes).
- **Cajón portamonedas** (apertura por forma de pago).
- **Datáfono / TPV-PIN** (Redsys, Stripe Terminal).
- **Balanza** (productos por peso).
- **Fidelización**: protocolo de validación de participante, acumulación y redención de puntos.
- **Delivery/Riders**: solicitud y cancelación de reparto vía URLs configurables.
- **Webhooks**: notificación de eventos (venta cerrada, documento creado) a URL externa.

---

## 5. Hoja de ruta por fases

**Fase 1 — Núcleo TPV (✅ hecho):** sala, venta/cobro, productos/stock, caja, informes, reservas.

**Fase 2 — Operativa de restaurante (lo más rentable ahora):**
dividir/juntar/transferir cuentas · pago mixto · comensales · propinas · modificadores · tarifas · impuestos por producto · movimientos y cierre Z de caja.

**Fase 3 — Cocina y carta avanzada:** monitor de cocina (KDS) · centros de producción · impresión de comandas por zona · menús/combinados · packs · escandallos.

**Fase 4 — Multi-local y legal:** API REST + sincronización nube · TicketBAI/Verifactu · informes personalizados · fidelización · delivery · webhooks.

**Fase 5 — Empaquetado:** PWA instalable · Electron (Windows) · Capacitor (tablet).

---

## 6. Mejoras concretas frente a Ágora
- **Offline-first de verdad**: el TPV cobra aunque caiga la red; sincroniza al volver.
- **Una sola base** para web, tablet y escritorio (Ágora usa apps separadas por rol).
- **Sin licencias por módulo** ni instalación pesada para empezar.
- **UI táctil más directa**: menos pasos para cobrar y dividir cuenta.
- **API abierta + webhooks** de serie para integradores.
