# HOSTELERO · Configurabilidad tipo Ágora (checklist en construcción)

Objetivo: que **todo** se pueda configurar desde **Administración** (`:7874`), como en el admin de Ágora.
Se construye por áreas, sobre los datos maestros del servidor (una sola fuente, en tiempo real).

Leyenda: ✅ hecho · 🟡 parcial · ⬜ pendiente

## Local y fiscal
- ✅ Datos del local (nombre, dirección, CIF, teléfono) — salen en el ticket
- ✅ IVA por defecto + pie de ticket
- ✅ Formas de pago configurables (da cambio / abre cajón / cuenta en arqueo)
- ✅ Impuestos: IVA por producto (10/21/4) + desglose por tipos en el ticket
- ⬜ Series y numeración de documentos (tickets, facturas)
- ⬜ Redondeo, moneda avanzada, recargo de equivalencia
- ⬜ Cabecera/logo del ticket

## Carta
- ✅ Categorías (familias) con color, icono y pase por defecto
- ✅ Productos (precio, icono, pase, stock, activo)
- ✅ Modificadores y menús (en el maestro; el TPV los usa)
- ✅ **Editor visual de modificadores y menús** en Administración (botones "Mods" / "Pasos")
- ✅ **Ficha de producto completa**: 4 nombres (nombre, botón, comanda, ticket), 3 precios (principal/añadido/supl. menú), precio vacío = preguntar · 0 = gratis, ticks (principal, añadido —ambos a la vez—, pedir añadidos, pedir notas, limitar disponibilidad, por peso) y disponibilidad
- ✅ **Botón Copiar universal**: crea un producto nuevo a partir de uno de referencia (incluye mods/pasos); cambias nombre y precio y listo
- ✅ **Comentarios** por familia y globales (gestión en Admin) → se aplican a la línea en TPV y salen en comanda/KDS/impresión
- ✅ **Acciones por línea** (TPV): tocar una línea → cambiar cantidad, cambiar precio (con permiso), descuento de línea y comentario
- ✅ **Botón de disponibilidad (86) en todas las apps** (TPV, venta, comandera y cocina/KDS), accionable por cualquiera: marca productos agotados/disponibles en tiempo real y bloquea su venta en todas las pantallas
- ✅ **Producto por peso**: al añadirlo pregunta el peso (kg) y cobra €/kg × peso; la línea sale con el peso en comanda y ticket (TPV y comandera). Demo: "Rape a la plancha" 39 €/kg
- ✅ **Tarifas / listas de precio** (Admin): ajuste por % o precios fijos por producto, asignables por **sala** y/o **franja horaria**, con tarifa «por defecto». TPV y comandera aplican la tarifa activa según la sala/hora; el TPV muestra qué tarifa rige. Demo: Terraza +10%, Happy Hour −15% (18–20h)
- ✅ **Coste / escandallo por producto**: campo de coste en la ficha; calcula y muestra **margen €, % y food cost** en la ficha y una columna **Coste / margen** en la lista de carta
- ⬜ Subfamilias · Packs a precio fijo · Escandallo por ingredientes (recetas)
- ⬜ Ficha de producto con imagen y alérgenos · disponibilidad por porciones de peso (teclas 1,5/1/0,7 kg)

## Sala
- ✅ Salas/centros de venta con color de fondo
- ✅ Plano editable: mesas (forma/plazas) + elementos (barra, billar, plantas, sofá, aseos), arrastrar/colocar
- ✅ **El mismo plano dibujado aparece en la comandera** (con colores de sala y elementos); mesas ocupadas/avisos en vivo
- ✅ Estados de pase (123) por línea
- ⬜ Pedir comensales por centro (config global ya existe) · mínimos por comensal

## Cocina / impresión
- ✅ Impresoras de red (ESC/POS :9100) por zona, con prueba
- ✅ Comandas se imprimen por zona; ticket de cobro desde el TPV
- ⬜ Centros de producción avanzados · formato de comanda configurable · idioma de cocina

## Personal
- ✅ Empleados, roles y PIN (centralizados, multi-dispositivo)
- ✅ Permisos por rol (qué apps abre cada uno)
- ✅ Permisos de acción editables por rol desde Admin (anular, caja, informes, descuento…) + autorización por PIN en el TPV
- ✅ Fichaje / registro de jornada (centralizado, conforme al RD)
- ⬜ Informe de fichajes exportable + edición de asientos con autoría

## Ventas y caja
- ✅ Comensales · dividir cuenta · pago mixto · propinas
- ✅ **Informes de ventas** (hoy/ayer/7 días/histórico, por producto y familia, formas de pago) + imprimir
- ✅ **Cierre Z** numerado (ventas, formas de pago, desglose IVA, descuadre) imprimible
- ✅ Descuentos por ticket (% e importe) e **invitaciones** (atenciones) — reflejados en cobro, ticket e informes
- ✅ Promociones avanzadas: **happy hour por horario**, **NxM (2x1, 3x2)** y **pack a precio fijo** (auto-aplicadas al ticket, editables en Admin)

## Clientes
- ✅ Clientes con datos fiscales y **descuento** (gestión en Admin)
- ✅ **Facturación a cliente**: asignar cliente al ticket y emitir **factura numerada** con datos fiscales y desglose de IVA
- 🟡 Tipos de cliente / tarifas / recargo de equivalencia (descuento por cliente y **tarifas** hechos; recargo de equivalencia pendiente)
- ⬜ Fidelización (puntos/premios)

## Integraciones
- ✅ API local (servidor) + tiempo real (SSE)
- 🟡 Datáfonos: **lista escalable** (varios terminales, marca, modo, IP:puerto) gestionada en Admin; ruteo del importe al terminal por la red — probado con 2 terminales simulados. El protocolo concreto depende del modelo (Redsys/Stripe Terminal)
- 🟡 **Control de efectivo** (Cashlogy · CashKeeper · Glory): lista escalable de dispositivos en Admin; el TPV envía el importe a cobrar/devolver al dispositivo por la red (`/api/efectivo`). El protocolo concreto se conecta en el despliegue según el modelo
- 🟡 TicketBAI / Verifactu: base montada — **huella encadenada (SHA-256, validada)**, identificador y URL de verificación en ticket/factura, configurable (sistema + serie). Falta la **firma con certificado** y el envío a Hacienda (específico del despliegue)
- 🟡 **Reservas**: módulo propio en Admin (agenda por día, cubiertos, mesa, estado, notas) + **API de entrada unificada** (`/api/reserva`) con etiqueta de **origen** (TheFork, Google, CoverManager, teléfono, web, walk-in, **carta digital**, **agente de voz**). La conexión real de cada plataforma necesita su cuenta/API y un servidor accesible (ver RESERVAS.md) — el buzón y la agenda ya están listos
- ✅ **Carta digital (QR)**: página pública servida en `:7875` (`Carta-Digital.html`) que muestra la carta en vivo (precios, agotados, por peso) y permite **pedir reserva** → entra en la agenda al instante (origen *carta digital*). Enlace en el lanzador
- 🟡 **Agente de voz captador (CreativeLab)**: vuelca las reservas a la misma API (`origen: voz`). El agente en sí es externo (ya desarrollado con CreativeLab); el hook de entrada está listo
- ⬜ Delivery · Fidelización (puntos)

---
Orden de construcción previsto (sin parar): editor de modificadores/menús en Admin → impuestos por producto →
informes de ventas + cierre Z → descuentos/promociones → permisos de acción → datáfono → TicketBAI.
