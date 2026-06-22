# HOSTELERO · Servidor como servicio de Windows (NSSM)

Deja el servidor funcionando **solo, en segundo plano, arrancando al encender el PC** y
**reiniciándose si falla**. Recomendado para el PC servidor del local.

## Requisitos
- **Node.js** instalado (https://nodejs.org).
- **NSSM** (gratuito): https://nssm.cc/download

## Pasos
1. Descarga el **.zip de NSSM**, ábrelo, entra en la carpeta **`win64`** y copia
   **`nssm.exe`** a esta carpeta del proyecto (junto a `server.cjs`).
2. Clic derecho en **`Instalar-Servicio.bat`** → **Ejecutar como administrador**
   (o doble clic: pedirá permisos de administrador automáticamente).
3. Listo. El instalador:
   - Crea el servicio **"HOSTELERO"** (arranque automático).
   - Abre los puertos **7870–7874** en el Firewall (red privada).
   - Arranca el servicio.

## Comprobar / gestionar
- En el PC: abre `http://localhost:7870`.
- Servicios de Windows: ejecuta **`services.msc`** y busca **HOSTELERO** (Iniciar/Detener/Reiniciar).
- Registro de actividad: archivo **`server.log`** en esta carpeta.

## Quitar el servicio
- Clic derecho en **`Desinstalar-Servicio.bat`** → Ejecutar como administrador.

> Nota: si actualizas `server.cjs`, reinicia el servicio (en `services.msc`, botón derecho → Reiniciar).
