# Checklist de blindaje · HOSTELERO

> ⚠️ Borrador orientativo, no asesoramiento jurídico. Revisar con abogado de PI. Jurisdicción: España/UE.

Leyenda: ⬜ pendiente · 🟡 en curso · ✅ hecho

## 1. Copyright del software (código fuente)
En España el software está protegido por derecho de autor **desde su creación**, sin registro
(RDL 1/1996, Ley de Propiedad Intelectual). El registro NO crea el derecho, pero da **prueba de
autoría y fecha**, muy útil ante copias o disputas.

- ⬜ Añadir cabecera de copyright en cada archivo de código: `© 2026 [SOCIEDAD]. Todos los derechos reservados.`
- ⬜ Añadir un archivo `LICENSE` / aviso de "software propietario, prohibida su copia/redistribución".
- ⬜ Conseguir **prueba de fecha** del código, por una de estas vías (basta una):
  - ⬜ **Registro de la Propiedad Intelectual** (registro territorial; se deposita el código como obra). Económico.
  - ⬜ **Acta notarial** del código fuente (notario da fe del contenido y la fecha).
  - ⬜ **Sellado de tiempo / timestamp** de un prestador de confianza, o depósito en escrow.
- ⬜ Guardar el **historial de versiones** (repositorio Git privado) como evidencia de evolución y autoría.
- ⬜ Repositorio **privado** (nunca público) mientras sea producto cerrado.

## 2. Marca (nombre + logo)
Proteger el signo con el que el mercado te identifica.

- ⬜ Decidir QUÉ se registra: el **nombre**, el **logo (figurativo)** o ambos (mixta).
  - ⚠️ Ojo: *"hostelero"* es una palabra **descriptiva** del sector; como marca denominativa pura
    puede ser **denegada**. Lo más sólido suele ser la **marca figurativa (logo)** o un nombre
    más distintivo. **Consultar esto con el abogado ANTES de pagar tasas.**
- ⬜ Elegir ámbito: **OEPM** (solo España) o **EUIPO** (toda la UE, recomendable si hay ambición internacional).
- ⬜ Elegir **clases de Niza**: 9 (software), 42 (SaaS/desarrollo de software), 35 (servicios comerciales/publicidad). Confirmar con el agente.
- ⬜ Hacer una **búsqueda de anterioridades** (que no exista una marca igual/parecida) antes de solicitar.
- ⬜ Presentar solicitud y pagar tasas (verificar importes vigentes OEPM/EUIPO).
- ⬜ Registrar el/los **dominios** (.com, .es) y handles de redes con el nombre definitivo.

## 3. Secreto empresarial (el "know-how" del Maître)
La lógica de IA, las reglas de optimización y la arquitectura "Claude dentro de HOSTELERO" son tu
ventaja. Se protegen manteniéndolas **en secreto** (Ley 1/2019 de Secretos Empresariales).

- ⬜ No publicar en abierto la lógica del Maître ni los prompts/reglas.
- ⬜ Control de acceso al código y a la documentación sensible (mínimos necesarios).
- ⬜ NDA firmado con **todo** el que acceda (ver doc 02).
- ⬜ Marcar la documentación interna como **"Confidencial"**.

## 4. Contratos y titularidad (LO MÁS CRÍTICO)
Que pagues un trabajo **no implica** que la propiedad intelectual sea tuya: hace falta **cesión
expresa por escrito**. Sin ella, el desarrollador podría conservar derechos sobre el código.

- ⬜ Firmar **cesión de derechos de IP** con cada desarrollador/freelance/colaborador (ver doc 03).
- ⬜ Firmar cesión/acuerdo con **CreativeLab** (agente de voz): dejar claro qué es de cada parte
  y qué licencia de uso te dan.
- ⬜ Si hay socios: **pacto de socios** que regule la titularidad de la IP de la empresa.
- ⬜ Para empleados: aunque el art. 51 LPI presume cesión al empresario, conviene cláusula **expresa** en contrato.
- ⬜ Tener una **sociedad (SL)** que sea la **titular** de toda la IP (no a nombre personal disperso).
- ⬜ Preparar **condiciones de licencia / EULA / términos SaaS** para los clientes (qué pueden y no pueden hacer).

## 5. Componente de IA (uso comercial)
- ⬜ Revisar las **condiciones comerciales del proveedor de IA** (Anthropic/Claude) para integrarlo
  en un producto de terceros y que el modelo de negocio encaje (límites, atribución, datos).
- ⬜ Definir **tratamiento de datos** del cliente que pasen por la IA (ver RGPD abajo).

## 6. Protección de datos (RGPD/LOPDGDD)
Si HOSTELERO trata datos de clientes finales (reservas, fidelización…), aplica el RGPD.

- ⬜ Redactar **política de privacidad** y base legal del tratamiento.
- ⬜ **Contrato de encargado de tratamiento** entre tu empresa y los locales (y con la IA si procesa datos personales).
- ⬜ Minimizar datos personales que pasan por el Maître/IA.

## 7. Prioridad (qué hacer ya)
1. 🔴 **NDA** activo con cualquiera que vea producto/código (hoy).
2. 🔴 **Cesión de IP** firmada con todos los que desarrollan (esta semana).
3. 🟠 **Cita con abogado** + decisión de nombre/logo de marca.
4. 🟠 **Prueba de fecha** del código (registro/acta/timestamp).
5. 🟡 Marca (OEPM/EUIPO) y dominios.
6. 🟡 EULA/SaaS + RGPD antes de vender a clientes.
