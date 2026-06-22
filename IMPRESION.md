# HOSTELERO · Impresión (tickets y comandas)

Como en Ágora: **el servidor imprime las comandas** en las impresoras térmicas de red,
y el **TPV imprime el ticket de cobro** en su impresora.

## Cómo funciona
- **Comandas → cocina/barra (automático):** al pulsar *Enviar a cocina* (en TPV o comandera),
  el servidor manda la comanda por **ESC/POS** a la impresora de red configurada (puerto **9100**).
  Cada línea se imprime en la impresora de su **zona** (la zona viene de la categoría del producto:
  Bebidas/Cervezas → *barra*, comida → *cocina*).
- **Ticket de cobro → caja:** al cobrar en el TPV, se imprime el ticket en la **impresora por
  defecto del navegador** del TPV (configúrala en Windows como tu impresora de tickets).

## Configurar impresoras (una vez)
1. Arranca el servidor y abre **Administración** (`http://IP:7874`, admin/admin).
2. Pestaña **🖨️ Impresoras → + Impresora**:
   - **Nombre**: p. ej. *Cocina*.
   - **IP**: la de la impresora en la red (p. ej. `192.168.1.50`).
   - **Puerto**: `9100` (estándar de impresoras de red RAW/JetDirect).
   - **Zona**: *Cocina*, *Barra* o *Caja*.
3. Pulsa **Prueba** para imprimir un ticket de comprobación.

## Requisitos de la impresora
- Impresora **térmica de tickets** compatible **ESC/POS** (Epson y compatibles).
- Con **interfaz de red (Ethernet/WiFi)** y **puerto RAW 9100** activado (JetDirect).
- En la **misma red** que el PC servidor.
- Si tu impresora es **USB** (sin red), úsala como impresora de Windows y el **ticket de cobro**
  saldrá por el navegador del TPV; para **comandas USB** se necesita un puente (lo vemos si hace falta).

## Ticket de cobro
Sale automáticamente al confirmar el cobro. Incluye restaurante, nº de ticket, mesa, líneas
(con modificadores), base + IVA 10%, total, forma de pago y propina.
