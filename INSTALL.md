# HOSTELERO · Instalación, uso y publicación en GitHub

Guía pensada para usarse sin conocimientos técnicos. Tiempo total: ~10 minutos.

---

## 1. Abrir la app (sin instalar nada)

La app es el archivo **`HOSTELERO-TPV.html`**. Es un único archivo que funciona en
cualquier navegador, sin conexión y sin instalación.

> ⚠️ **Si ves "solo código" al abrirlo**, es porque tu Windows abre los `.html` con un
> editor de texto por defecto. **No está roto.** Arréglalo una vez:

**Arreglo permanente (recomendado):**
1. En el Explorador de archivos, clic derecho en `HOSTELERO-TPV.html`.
2. **Abrir con → Elegir otra aplicación**.
3. Selecciona **Google Chrome** (o Microsoft Edge).
4. Marca **"Usar siempre esta aplicación para abrir archivos .html"** → **Aceptar**.

A partir de ahí se abre como app de verdad, también con doble clic.

**Alternativas rápidas:** abre Chrome y **arrastra** el archivo dentro de la ventana, o pulsa **Ctrl+O** y selecciónalo.

Los datos se guardan en el propio navegador. En la pestaña **Carta** tienes **"↻ Restaurar demo"** para volver al estado inicial.

---

## 2. Qué hay en la carpeta

```
HOSTELERO/
├── HOSTELERO-TPV.html   ← App lista para usar (ábrela con Chrome)
├── app.js               ← Lógica de la app de un archivo
├── README.md            ← Resumen del proyecto y funciones
├── PARIDAD-AGORA.md     ← Análisis vs Ágora, modelo de datos, API e integraciones
├── INSTALL.md           ← Esta guía
├── test-logic.cjs       ← Pruebas automáticas de la lógica (Node)
├── package.json, index.html, vite.config.ts, tsconfig.json
└── src/                 ← Proyecto React + TypeScript (base multiplataforma)
```

---

## 3. Publicar en GitHub — opción fácil (GitHub Desktop, sin terminal)

1. Descarga e instala **GitHub Desktop**: https://desktop.github.com
2. Inicia sesión con tu cuenta de GitHub (o créala gratis en https://github.com).
3. En GitHub Desktop: **File → Add local repository…** y selecciona la carpeta
   `C:\Users\Usuario\Documents\Claude\Projects\HOSTELERO`.
4. Si dice *"This directory does not appear to be a Git repository"*, pulsa
   **"create a repository"** y luego **Create repository**.
5. Verás los archivos en la pestaña *Changes*. Escribe un mensaje (p. ej.
   *"Primera versión de HOSTELERO TPV"*) y pulsa **Commit to main**.
6. Arriba pulsa **Publish repository**. Elige nombre (`hostelero`), marca
   *Keep this code private* si lo quieres privado, y **Publish repository**.

Listo: tu código ya está en GitHub. Cada vez que cambies algo, repite *Commit* + *Push*.

---

## 4. Publicar en GitHub — opción terminal (git)

Abre **PowerShell** en la carpeta del proyecto y ejecuta:

```bash
git init -b main
git add -A
git commit -m "Primera versión de HOSTELERO TPV"
```

Crea un repositorio vacío en https://github.com/new (sin README), copia su URL y:

```bash
git remote add origin https://github.com/TU_USUARIO/hostelero.git
git push -u origin main
```

---

## 5. Notas útiles

- **No subas `node_modules/`**: ya está excluido en `.gitignore`.
- **Carpeta en OneDrive:** si la carpeta `.git` da problemas (por la sincronización),
  ciérrala/pausa OneDrive un momento, o mueve el proyecto a una carpeta local
  (p. ej. `C:\Proyectos\HOSTELERO`) antes de inicializar git.
- **Proyecto React (multiplataforma):** para ejecutarlo en modo desarrollo necesitas
  Node.js. En la carpeta: `npm install` y luego `npm run dev`.
- **Pruebas de la lógica:** `node test-logic.cjs` (debe mostrar "OK, 0 FALLOS").

---

## 6. Cómo probar todo en 1 minuto

1. Abre `HOSTELERO-TPV.html` con Chrome.
2. **Sala** → "✏️ Editar plano" → arrastra una mesa → "✓ Hecho" (se guarda la posición).
3. Toca una mesa → indica comensales → añade **Entrecot** (elige punto, guarnición y
   **extras múltiples**) y un **Menú del Día** (elige los platos).
4. **👨‍🍳 Enviar a cocina** → pestaña **Cocina** → marca *Empezar/Listo* → **🔔 Avisar**.
5. **Cobrar** → divide el pago (parte tarjeta, parte efectivo) y añade propina.
6. Mira **Caja** e **Informes**.
