# HOSTELERO · Reservas (TheFork · Google · CoverManager · teléfono/web)

HOSTELERO tiene un **módulo de reservas** propio (Administración → 📅 **Reservas**) y una
**API de entrada unificada** para que las plataformas externas vuelquen sus reservas
automáticamente. Todas las reservas —vengan de donde vengan— acaban en la misma agenda,
etiquetadas por **origen**, y se sincronizan en tiempo real con el resto de dispositivos.

## Gestión manual (ya funciona, sin internet)
- Crea, edita y borra reservas (teléfono, web propia, walk-in).
- Agenda por día con navegación ◀ / ▶ / Hoy, contador de **cubiertos**, asignación de **mesa**,
  **estado** (pendiente, confirmada, sentada, no-show, cancelada) y notas (alergias, trona…).

## API de entrada (para TheFork / Google / CoverManager)
Cualquier sistema externo crea o actualiza una reserva con un **POST** al servidor de HOSTELERO:

```
POST http://<IP-del-PC>:7874/api/reserva
Content-Type: application/json

{
  "reserva": {
    "id": "TF-123456",          // opcional: si lo mandas, futuras llamadas con el mismo id ACTUALIZAN
    "fecha": "2026-06-23",       // AAAA-MM-DD
    "hora": "21:00",
    "personas": 4,
    "cliente": "Familia García",
    "telefono": "600111222",
    "origen": "thefork",         // thefork | google | covermanager | telefono | web | walkin
    "mesa": "",                  // opcional
    "notas": "Trona para bebé",
    "estado": "confirmada"        // pendiente | confirmada | sentada | noshow | cancelada
  }
}
```

- Para **cancelar/borrar**: `POST /api/reserva-borrar` con `{ "id": "TF-123456" }` (o manda la
  misma reserva con `"estado": "cancelada"` para conservarla en el histórico).
- La reserva aparece **al instante** en la agenda y en todos los dispositivos conectados.

## Conectar cada plataforma (depende del despliegue)
La API de arriba es el "buzón" de HOSTELERO. Para que TheFork, Google (Reserva con Google) o
CoverManager **escriban** en ese buzón necesitas, según el caso:

- **TheFork / CoverManager**: una cuenta de restaurante en la plataforma y su **API/webhooks de
  reservas** (o un *channel manager* que centralice). Se configura un webhook que apunte a
  `http://<tu-dominio-o-IP>:7874/api/reserva` con el mapeo de campos de arriba.
- **Reserva con Google**: se integra a través de un **partner de reservas** (Google no envía
  directamente al restaurante); ese partner reenvía la reserva a la API de HOSTELERO.

> Estas conexiones requieren la **cuenta y credenciales de cada proveedor** y, normalmente,
> que el servidor sea **accesible desde internet** (o un conector intermedio). Eso es específico
> de cada local y no se incluye en la demo: HOSTELERO ya deja **el buzón y la agenda listos**;
> solo falta apuntar cada plataforma (o el channel manager) a la API.

## Ecosistema de captación de reservas (HOSTELERO)
Además de las plataformas externas, HOSTELERO capta reservas por canales propios, todos
contra la misma API y agenda, etiquetados por **origen**:

- **Carta digital (QR)** — `origen: "carta"`. Página pública servida por el propio servidor
  en `http://<IP>:7875` (`Carta-Digital.html`). El cliente escanea el QR de la mesa, ve la
  carta en vivo (precios, agotados, productos por peso) y pulsa **Reservar mesa**: la solicitud
  entra como reserva *pendiente* en la agenda, en tiempo real. Ideal para imprimir el QR en mesas,
  escaparate o tarjetas.
- **Agente de voz captador (CreativeLab)** — `origen: "voz"`. El agente de voz (ya desarrollado
  con CreativeLab) atiende llamadas, recoge los datos de la reserva y los **vuelca a la API**
  `POST /api/reserva` con `"origen":"voz"`. Aparece en la agenda como una reserva más, con su
  etiqueta de origen, lista para confirmar.

Ambos usan exactamente el mismo formato JSON de la sección anterior; solo cambia el campo `origen`.

## Seguridad (recomendado en producción)
- Exponer `/api/reserva` solo a través de un proxy con **HTTPS** y un **token** en una cabecera.
- Limitar por IP de origen (la del proveedor o channel manager).
