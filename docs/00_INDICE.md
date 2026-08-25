# JC Fitness — Documentación maestra consolidada

> **Qué es esto.** El resultado de analizar, en una sola pasada, TODA la documentación de fases,
> prompts y especificaciones que existía repartida en `HANDOFF.md` (586 líneas / ~164 KB),
> `CHANGELOG.md` (1117 líneas / ~196 KB), `ESPECIFICACION_AJUSTES_ENTREGA1.md` (954 líneas /
> ~62 KB) y el código real de `src/`, `api/` y `supabase/`, y consolidarla en una única
> especificación maestra, un orden de ejecución y una checklist global.
>
> **Estado: análisis y especificación. NO se ha implementado ninguna fase en esta sesión.**
> Ni un solo archivo de `src/`, `api/`, `supabase/` o `package.json` ha sido tocado.

---

## Cómo usar esta carpeta

Léela en este orden la primera vez. Después, entra directo al documento que necesites.

| # | Archivo | Qué contiene | Cuándo leerlo |
|---|---|---|---|
| 01 | [`01_ESPECIFICACION_MAESTRA.md`](01_ESPECIFICACION_MAESTRA.md) | La especificación funcional completa e integrada: visión, arquitectura real, modelo de datos, los 21 módulos uno a uno, los 8 sistemas transversales, el sistema de diseño, las reglas inviolables, la especificación de Ajustes (apartados 1–202) y el análisis de AXION (203–1300). | **Siempre, antes de tocar código.** |
| 02 | [`02_ORDEN_DE_FASES.md`](02_ORDEN_DE_FASES.md) | Las 9 líneas de trabajo ("tracks") identificadas, su historia real de versiones (v0.1 → v1.22.0), qué está cerrado y el **orden de ejecución propuesto** para todo lo que queda (bloques R0–R9). | Al decidir qué construir a continuación. |
| 03 | [`03_CONTRADICCIONES_DUPLICADOS_DEPENDENCIAS.md`](03_CONTRADICCIONES_DUPLICADOS_DEPENDENCIAS.md) | 22 contradicciones detectadas (con cuál gana y por qué), 14 duplicados (deliberados vs. reales) y 24 dependencias entre fases y bloqueos técnicos. | Antes de implementar cualquier cosa que toque Ajustes, Seguridad, Calendario, IA o el Dashboard. |
| 04 | [`04_INVENTARIO_ESTADO_ACTUAL.md`](04_INVENTARIO_ESTADO_ACTUAL.md) | Qué existe hoy, archivo por archivo y clave de datos por clave de datos, con la etiqueta **EXISTE / MODIFICAR / CREAR** para cada pieza del trabajo pendiente. | Al empezar a escribir código de una fase concreta. |
| 05 | [`05_CHECKLIST_GLOBAL.md`](05_CHECKLIST_GLOBAL.md) | ~470 casillas verificables que cubren absolutamente todo lo especificado en cualquiera de las tres fuentes, marcadas ✅ hecho / 🟡 parcial / ⬜ pendiente / ⛔ imposible o descartado. | Para comprobar que no falta nada, en cualquier momento. |
| 06 | [`06_ENTREGA2_ANALISIS.md`](06_ENTREGA2_ANALISIS.md) | **Entrega 2**: análisis de los 7 módulos nuevos (106 fases, 50 016 líneas) — dimensión real, solapamientos con lo ya construido, 7 contradicciones nuevas, orden de ejecución propuesto y **8 preguntas bloqueantes para Josué**. | Antes de empezar cualquier fase de la Entrega 2. |
| 07 | [`07_CHECKLIST_ENTREGA2.md`](07_CHECKLIST_ENTREGA2.md) | **3 761 casillas** de la Entrega 2, reordenadas ascendentemente por fase, con las reglas transversales de los 7 módulos. Todo ⬜: nada implementado. | Al implementar cualquier fase de la Entrega 2. |

---

### Especificaciones en bruto

`especificaciones/` contiene la **transcripción íntegra e intocable** de la Entrega 2, dividida por
módulo, más el archivo original completo sin editar
(`ORIGINAL_JC_FITNESS_ESTILO_DE_HOMBRE.txt`). Nunca se resume ni se recorta ahí; las conclusiones
van en `docs/`. La Entrega 1 sigue en `ESPECIFICACION_AJUSTES_ENTREGA1.md`, en la raíz.

---

## Estado del proyecto en una línea

`package.json` **v1.22.0**. **Entrega 2 recibida: 7 módulos, 106 fases, nada implementado todavía.**
El Prompt Maestro de 21 fases está **cerrado**; los bloques Ajustes (A1–A7),
Navegación por áreas (N1–N4) y Personalización Visual Extrema (V1–V4) están **cerrados**; el
Calendario Universal está en **Fase 3 parcial**; Seguridad Centralizada, Dashboard–Centro de Control
y Optimización móvil están **construidos con pendientes documentados**; **AXION (≈1100 apartados) no
se ha empezado y está explícitamente bloqueado** hasta una conversación de diseño con Josué.
**Ninguna versión posterior a la 1.0.1 ha podido verificarse con `esbuild` ni ejecutarse en un
navegador real.**

---

## Nota de nomenclatura (leer una vez)

El proyecto recibe **cuatro nombres distintos** según la fuente:

- **"JC Fitness"** — como lo llama Josué hoy (mensaje de esta sesión).
- **"JosStyle"** — nombre del repositorio de GitHub y único contenido de `README.md`.
- **"Sistema Operativo Personal de Josué"** — título de `HANDOFF.md` y de la especificación.
- **`sistema-personal-josue`** — campo `name` de `package.json`; `sistema-personal-app` es el
  nombre de la carpeta dentro del zip.

**No es una contradicción de producto, pero sí una decisión pendiente de Josué.** Ver
`03_CONTRADICCIONES...` → **C-21**. Hasta que él decida, esta documentación usa **JC Fitness**
como nombre de proyecto y conserva los identificadores técnicos existentes sin tocarlos (renombrar
`package.json`, el repo o el `manifest.json` es un cambio con efectos reales sobre el despliegue en
Vercel y sobre la PWA ya instalada, no una edición cosmética).

---

## Reglas de mantenimiento de esta carpeta

1. **Estos documentos no sustituyen a `HANDOFF.md` ni a `CHANGELOG.md`** — los consolidan e
   indexan. `CHANGELOG.md` sigue siendo el registro histórico turno a turno; `HANDOFF.md` sigue
   siendo el documento que Josué pasa de una conversación a otra.
2. **`ESPECIFICACION_AJUSTES_ENTREGA1.md` es intocable** — es la transcripción literal de lo que
   Josué pegó. Nunca se resume ni se recorta ahí; las conclusiones van aquí.
3. Al **terminar una fase**, actualizar en este orden: `05_CHECKLIST_GLOBAL.md` (marcar casillas) →
   `02_ORDEN_DE_FASES.md` (mover el bloque a "cerrado") → `04_INVENTARIO...` (EXISTE/MODIFICAR/CREAR)
   → `CHANGELOG.md` y `HANDOFF.md` como siempre.
4. Si **llega una Entrega 2** (o posterior) de la memoria de ~1200 apartados: transcribirla íntegra
   en `ESPECIFICACION_<MODULO>_ENTREGA<N>.md` en la raíz, y **volver a correr este análisis** para
   reintegrarla aquí — no parchear estos documentos a trozos.
5. `CLAUDE.md` en la raíz es el punto de entrada automático para cualquier sesión futura de Claude
   Code. Si cambia algo estructural de esta carpeta, actualizarlo.
