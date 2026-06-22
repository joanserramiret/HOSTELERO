# HOSTELERO · Servidor local (WiFi, sin internet)

Arquitectura tipo Ágora: un **PC hace de servidor** en el local y los dispositivos
(smartphone, monitor de cocina, TPV) se conectan por **WiFi a su IP local**, **cada app en su puerto**.
**No necesita internet**, solo una buena red WiFi. Si cae internet, el servicio sigue funcionando.

> Tiempo real mediante **SSE**: una comanda enviada desde el móvil aparece **al instante** en cocina.
> (Verificado: la comanda del puerto 7872 llega al KDS del 7873 en tiempo real.)

---

## 1. Requisito (una sola vez)

Instala **Node.js** en el PC servidor: https://nodejs.org (botón "LTS"). Es gratis y rápido.

## 2. Arrancar el servidor

Doble clic en **`Iniciar-Servidor-HOSTELERO.bat`** (o abre una terminal en la carpeta y ejecuta `node server.cjs`).
Deja esa ventana **abierta** mientras trabajas. Verás los puertos disponibles.

## 3. Saber la IP del PC servidor

Abre **CMD** y escribe `ipconfig`. Busca **"Dirección IPv4"** (algo como `192.168.1.10`).
Esa es la IP que usarán los dispositivos. (Mejor si el router le da **IP fija** al PC servidor.)

## 4. Abrir cada app en su dispositivo (misma WiFi)

| Dispositivo | Abre en el navegador | Puerto |
|---|---|---|
| **PC servidor / Acceso** | `http://192.168.1.10:7870` | 7870 |
| **TPV de venta** | `http://192.168.1.10:7871` | 7871 |
| **Comandera (iPhone)** | `http://192.168.1.10:7872` | 7872 |
| **Monitor de cocina (KDS)** | `http://192.168.1.10:7873` | 7873 |
| **Administración** | `http://192.168.1.10:7874` | 7874 |

*(Sustituye `192.168.1.10` por la IP real de tu PC.)*

### iPhone 17 Pro Max (Comandera)
1. Conecta el iPhone a la **misma WiFi** que el PC.
2. En **Safari** abre `http://192.168.1.10:7872`.
3. **Compartir → "Añadir a pantalla de inicio"** → se abre como app a pantalla completa.

### Monitor de cocina (KDS)
Abre en su navegador `http://192.168.1.10:7873` y ponlo a **pantalla completa** (tecla F11).

## 5. Cortafuegos (la primera vez)

Al arrancar, Windows puede preguntar si permites a **Node.js** comunicarse en la red:
marca **Redes privadas** y **Permitir acceso**. (Si no aparece, en el Firewall de Windows
permite Node.js en redes privadas.)

---

## Notas

- El estado del servicio se guarda en **`servicio.json`** (sobrevive a reinicios).
- Si abres una app como **archivo suelto** (doble clic, `file://`) en vez de por el servidor,
  funciona en **modo local** (solo se sincroniza entre pestañas del mismo navegador). Para
  tiempo real entre dispositivos hay que abrirla **por la IP:puerto del servidor**.
- Puertos configurables en `server.cjs` (objeto `PUERTOS`).
