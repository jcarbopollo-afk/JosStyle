# 16 · IMAGEN PERSONAL — EL CICLO POSTERIOR A LA F65 (REORGANIZACIÓN)

> **Qué es esto.** La nota del ciclo que Josué abrió **después** de cerrar Estilo de hombre / Imagen personal en la
> EH F65 (v3.0.0): una **reorganización de la navegación**, en dos fases —**A** (correcciones) y **B** (la portada de
> seis tarjetas)—. No es una fase 66: la F65 sigue **congelada** y su informe (`docs/09_ESTILO_DE_HOMBRE_CIERRE.md`,
> generado por `src/lib/cierre.js`) **no se ha tocado** — describe el estado de la v3.0.0 y se lee como historia.
>
> **Estado (2026-11-01).** Versión **3.161.3** (sin subir). Todo vive en la rama `claude/imagen-personal-fase-a`: la
> Fase A está en el commit `7996c5b`; la Fase B (B1–B7, las correcciones posteriores y esta documentación) está
> construida y verificada en esa rama, **pendiente de commit, de llevarse a `main` y de desplegarse** (B9, que decide
> Josué). `main` no tiene nada de este ciclo.
>
> **La técnica del módulo** sigue en `docs/08_ESTILO_DE_HOMBRE_TECNICO.md` (generado desde `src/lib/documentacionEH.js`,
> que ya recoge la portada nueva). Esta nota cuenta **qué cambió en el ciclo, dónde está cada cosa y qué queda**.

---

## 1 · Qué se decidió (Josué, Fase B)

- **Seis tarjetas** en una cuadrícula de 2 × 3: **Ropa, Cuidado, Pelo, Fragancia, Accesorios y Funcionamiento**.
- **Hábitos y rutinas**: un acceso ancho debajo de las tarjetas, **sin botón**, que dice «Todavía no tiene pantalla propia».
- **Ropa** abre el Armario de la aplicación y lleva dentro un enlace discreto a **👤 Mi estilo** (y de ahí a sus preferencias).
- **Cuidado** agrupa Higiene, Skincare, Barba, Sonrisa y Cuidado corporal. **Pelo, Fragancia y Accesorios** abren su apartado.
- **Funcionamiento**: Mis gustos, Progreso, Educación y Productos, y los bloques de la antigua portada (ver §3).
- **Fitness, Sueño y Salud** quedan fuera de las seis y se gestionan desde Gestionar apartados (decisión C).
- Las 8 decisiones: F51 con su límite de 4 toques (1); Mi estilo como acceso secundario dentro de Ropa (2); Fitness,
  Sueño y Salud en Gestionar y Mis gustos, Educación y Productos en Funcionamiento (3); Hábitos visible y honesto (4);
  Ideas separado de las recomendaciones para añadir apartados (5); una categoría sin apartados activos conserva su
  aspecto y deja activar desde dentro (6); accesos rápidos en la portada, debajo de las tarjetas (7); corregir «llegan
  en las siguientes fases» (8).
- Decisiones A–G: **A** las cuatro tarjetas fijas no ofrecen tamaño (los tamaños guardados no se borran); **B** ni
  ocultar (las preferencias de ocultación guardadas no se borran); **C** Fitness, Sueño y Salud en Gestionar; **D** el
  buscador se queda arriba, sin duplicarse; **E** el recorrido del recordatorio de la F51 va por Barba; **F**
  `conocimiento` y `compras` se conservan vacías; **G** Progreso, Educación y Productos dicen «Todavía no tiene
  pantalla propia» y no simulan abrir nada.
- Después de B5: el botón «Gestionar apartados» de «Tu espacio está vacío» se conserva; las flechas y «Mover» solo
  existen donde mueven algo (dentro de cada categoría); Funcionamiento pinta primero sus apartados y después los bloques.

## 2 · Qué se hizo, fase a fase

| Etapa | Qué cambió |
|---|---|
| **Fase A** (commit `7996c5b`) | A1: en Barba, «Productos» abre «Mis productos» y «Seguimiento» abre «Mi rutina» (con Rutinas apagada no abre nada y lo dice). A2: los textos que prometían fases ya llegadas dicen dónde está cada cosa. A3: la ficha de cada apartado en Gestionar sale de `APARTADOS_CON_DESTINO`; los siete sin pantalla lo dicen sin número de fase. |
| **B1** | Categorías: `CATEGORIAS_EH` con `portada: 1..6` (Ropa, Cuidado, Pelo, Fragancia, Accesorios, Funcionamiento). Pelo, Perfumes, Accesorios y los cuatro de Funcionamiento cambian de `categoria`. Ni un id ni un dato guardado cambia: la categoría no se guarda. |
| **B2** | `tarjetasDePortada()` y `contenidoDeCategoria()` en `pantallaEH.js`: qué pinta cada tarjeta y qué hay dentro de cada categoría. |
| **B3** | La portada nueva: las seis tarjetas, Hábitos y rutinas y los accesos rápidos debajo. |
| **B4** | La pantalla de categoría (`CategoriaEH`): apartados activos en su orden, los ocultos aparte (siguen funcionando) y los apagados aparte con «Activar». |
| **B5** | Los bloques de la antigua portada se mudan a Funcionamiento (§3). Decisión A en Personalizar; decisión B en Gestionar; subir, bajar y «Mover» dentro de su categoría (`puedeMoverEnSuCategoria`, `subirEnSuCategoria`, `bajarEnSuCategoria`, `moverAEnSuCategoria`, `gruposParaOrdenar`, `hayQueOrdenar` en `gestionModulos.js`). |
| **B6** | `RECORRIDOS` (F51) con la navegación de verdad; límites 3, 4 y 5, `maximoDe` y `demasiadoLargos` intactos. |
| **B7** | `test-app-real` adaptado a la navegación nueva (resuelve los diez fallos que dejó B5 y un corte que ocultaba el resto del recorrido) y una sección nueva con siete tamaños de pantalla, activar/desactivar, ocultar, Hábitos, accesos rápidos, toques reales, movimiento reducido y consola. |
| **Correcciones posteriores a B7** | El acceso rápido «🧴 Rutina facial» abre la rutina de Skincare directamente; las respuestas de `PREGUNTAS` dicen las rutas actuales. |
| **B8** | Esta documentación: `docs/08` regenerado (textos de `documentacionEH.js`), esta nota, `CHANGELOG.md`, `HANDOFF.md` y la línea de `docs/00_INDICE.md`. |

## 3 · Dónde está cada cosa (navegación vigente)

**Portada de Imagen personal** (Bienestar → Imagen personal), de arriba abajo: cabecera · 🔍 Buscar en Imagen personal ·
bienvenida y avisos · **las seis tarjetas** · **Hábitos y rutinas** · ⚡ Accesos rápidos · el aviso de que algunos
apartados activos todavía no tienen pantalla propia (si los hay).

| Tarjeta | Al tocarla |
|---|---|
| 👕 **Ropa** | Abre el **Armario** de la aplicación. Dentro, el enlace **👤 Mi estilo** (con Estilo y armario encendido). |
| 🧴 **Cuidado** | Pantalla de categoría: **Higiene** (con Manos, uñas y pies), **Skincare**, **Barba**, **Sonrisa** y **Cuidado corporal**. |
| 💇 **Pelo** | Su apartado (Mi pelo, Mi rutina, Seguimiento, Recomendaciones, Productos, Peluquería). |
| 🌫️ **Fragancia** | El apartado **Perfumes** (Mi perfil, Mi colección, Recomendaciones…). |
| 🕶️ **Accesorios** | Su apartado. |
| ⚙️ **Funcionamiento** | Primero sus apartados (**Mis gustos**; Progreso, Educación y Productos dicen «Todavía no tiene pantalla propia»), y después: 🧔 **Mi estilo personal** (con ⚙️ **Mis preferencias**), 💡 **Ideas para ti**, 📊 **Mi progreso**, ✨ **Descubrir**, ⋮ **Personalizar** (y dentro, 🧩 **Gestionar apartados** para ocultar y reordenar), **Ordenar**, ✨ **También puedes añadir** y **Gestionar apartados** (interruptores; dentro, **Mis datos**). |

Una tarjeta cuyo apartado está apagado dice «Sin activar» y, al tocarla, la pantalla de la F41 ofrece activarlo.
**Fitness, Sueño y Salud** no tienen tarjeta: se encienden y apagan en Gestionar apartados.

**Respuestas de «¿Dónde está esto?» (`PREGUNTAS`, `experienciaReal.js`)**

| Pregunta | Respuesta vigente |
|---|---|
| ¿Dónde añadiría un perfume? | En la tarjeta 🌫️ Fragancia |
| ¿Dónde cambiaría mis preferencias? | En ⚙️ Funcionamiento → ⚙️ Mis preferencias |
| ¿Dónde ocultaría un módulo? | En ⚙️ Funcionamiento → ⋮ Personalizar → 🧩 Gestionar apartados |
| ¿Dónde apunto qué corte me hice? | En la tarjeta 💇 Pelo |
| ¿Dónde está mi rutina de cara? | En la tarjeta 🧴 Cuidado → Skincare |
| ¿Dónde apunto lo de las uñas? | En la tarjeta 🧴 Cuidado → 🧼 Higiene → Manos, uñas y pies |
| ¿Dónde está lo que borré? | En Ajustes → Papelera |

**Recorridos de la F51 (`RECORRIDOS`, contados pulsando en Chromium)**

| Acción | Ruta | Toques / límite |
|---|---|---|
| Crear un recordatorio | Cuidado → Barba → Mi rutina → Recordármelo | 4 / 4 |
| Abrir la rutina facial | Cuidado → Skincare → Mi rutina (con el acceso rápido «🧴 Rutina facial»: **1**) | 3 / 3 |
| Marcar un perfume favorito | Fragancia → Mi colección → «Favorito» | 3 / 3 |
| Añadir un perfume | Fragancia → Mi colección → Añadir perfume | 3 / 4 |
| Ocultar un apartado | Funcionamiento → ⋮ Personalizar → 🧩 Gestionar apartados → 👁️ Ocultar | 4 / 5 |
| Cambiar el tamaño de una plaquita | Funcionamiento → ⋮ Personalizar → el tamaño | 3 / 5 |
| Cambiar mis preferencias | Funcionamiento → ⚙️ Mis preferencias → la preferencia | 3 / 5 |
| Ver cómo voy | Funcionamiento (📊 Mi progreso) | 1 / 4 |
| Desactivar un apartado | Funcionamiento → Gestionar apartados → interruptor → Confirmar | 4 / 5 |
| Ver recomendaciones | Pelo → Recomendaciones | 2 / 3 |
| Buscar algo | 🔍 Buscar en Imagen personal → resultado | 2 / 3 |
| Recuperar algo borrado | Ajustes → Papelera → Restaurar | 3 / 4 |

**El acceso rápido «🧴 Rutina facial»** abre directamente la rutina de Skincare (`zona: 'rutina'` de
`ACCESOS_DISPONIBLES`): si Skincare todavía no está configurado, primero sale su entrada de siempre; si sus rutinas están
apagadas, abre el panel; volver deja en el panel de Skincare. **Los demás accesos rápidos** («Afeitarme», «Mi pelo»,
«Elegir perfume») declaran también una zona pero **siguen abriendo su apartado**: no se ha cambiado.

## 4 · Qué está construido, qué falta y qué solo está catalogado

- **Con pantalla y destino (10)**: Estilo y armario (abre el Armario), Pelo, Skincare, Barba, Sonrisa, Higiene,
  Cuidado corporal, Perfumes, Accesorios y Mis gustos (`APARTADOS_CON_DESTINO`).
- **Catalogados, activables y sin pantalla propia (7)**: Fitness, Sueño, Salud, Hábitos y rutinas, Progreso, Educación y
  Productos. Están en `MODULOS_EH`, se encienden y apagan, y lo dicen («Todavía no tiene pantalla propia»); no se finge
  ningún destino.
- **Librerías sin conectar a la aplicación (6)**: `iaEstilo`, `aprendizaje`, `insights`, `resumenPeriodico`, `contextual`
  y `recuperacion`. Existen y sus auditorías se ejecutan en Node, pero **ninguna está en el paquete de la aplicación**
  (comprobado con el `metafile` de esbuild el 2026-11-01; es la CX-13 de `docs/15_asistentes/DECISIONES.md`). Siguen sin
  conectar, por la congelación.
- **Categorías vacías conservadas**: `conocimiento` y `compras` (decisión F).

## 5 · Lo que NO cambió

Ni un id, ni una clave de `app_data`, ni un campo guardado, ni la versión del esquema de Imagen personal. Los tamaños,
el orden y las preferencias de ocultación guardados se conservan aunque las tarjetas fijas ya no ofrezcan esos
controles. Las 65 fases originales siguen como estaban en `CHANGELOG.md`, `docs/02` y `docs/07`. Ni el Armario, ni los
chatbots, ni otros módulos se han tocado.

## 6 · Cómo está probado

- `scripts/test-portada-eh.jsx` (nueva en la Fase B): las seis tarjetas, Hábitos, las categorías, los bloques de
  Funcionamiento, las decisiones A y B, el orden por categorías y el acceso a la rutina facial — **150** comprobaciones.
- `scripts/test-experiencia-real.mjs` (F51): los recorridos contra la vista y las respuestas de `PREGUNTAS` — **120**.
- `scripts/test-app-real.mjs`: entra en cada apartado por su ruta nueva y, en su sección 34, mide la portada en siete
  tamaños (320, 375, 393 y 430 px, horizontal, iPad y escritorio), cuenta los toques de los recorridos, activa,
  desactiva, oculta, prueba con «Reducir movimiento» y exige la consola limpia — **3927** comprobaciones en Chromium.
- `bash scripts/verificar.sh` completo en verde al cerrar las correcciones posteriores a B7.

## 7 · Lo que queda

- **B9** (lo decide Josué): commits, push de la rama, vista previa y llevarlo a `main`.
- **Verlo en el iPhone** (R1): todo lo anterior se ha probado en Chromium, no en Safari ni con VoiceOver.
- La primera vez, Barba y Perfumes preguntan «¿Quieres utilizar este apartado?»: los recorridos miden el uso habitual.
- Los siete apartados sin pantalla y las seis librerías sin conectar: abrirlos sería otro ciclo, que decide Josué.
- `docs/09` (informe de la F65) sigue describiendo la v3.0.0, incluida la lista de apartados «terminados» que la CX-13
  matizó; no se toca sin una propuesta aprobada.
