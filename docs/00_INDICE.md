# JosStyle — Documentación maestra consolidada

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

`package.json` **v2.29.0**. **Entrega 2: 106 de las 110 fases construidas y verificadas** — ME, BI,
AR, FO, RA y HT **cerrados**; **Sonido 3/5** (lo que falta depende de los archivos de audio que dará
Josué) y **Estilo de Hombre 63/65** (quedan la F64 y la F65).
El Prompt Maestro de 21 fases está **cerrado**; los bloques Ajustes (A1–A7),
Navegación por áreas (N1–N4) y Personalización Visual Extrema (V1–V4) están **cerrados**; el
Calendario Universal está en **Fase 3 parcial**; Seguridad Centralizada, Dashboard–Centro de Control
y Optimización móvil están **construidos con pendientes documentados**; **AXION (≈1100 apartados) no
se ha empezado y está explícitamente bloqueado** hasta una conversación de diseño con Josué.
**Desde la v1.23.0 todo se compila y se prueba de verdad** con `bash scripts/verificar.sh`: build de
Vite, 9 671 comprobaciones de Node, 1 408 casos de renderizado, 11 reglas invariantes y 447 sobre la
aplicación real en Chromium. ⚠️ **Lo que sigue sin comprobarse es el móvil de Josué**: Supabase real,
la sincronización y el aspecto en su iPhone (bloque R1).

---

## Nota de nomenclatura (leer una vez) — RESUELTA

El proyecto llegó a acumular **cinco nombres**: *JC Fitness*, *JC Lifestyle*, *JC STYLE*, *JosStyle*
y *Sistema Operativo Personal de Josué*; la interfaz, para rematarlo, no usaba ninguno de los cinco
y se presentaba como *"Mi Sistema Personal"*.

**Josué lo ha decidido (v1.27.0): el nombre oficial y definitivo es *JosStyle*.** Los demás quedan
como referencias históricas. Se usa en la interfaz, en esta documentación y en el desarrollo, salvo
que una especificación concreta indique expresamente otro nombre.

Qué se renombró y qué se dejó como estaba (el despliegue en Vercel y el icono ya instalado en el
iPhone tienen efectos reales que el código no debe cambiar solo): ver `03_CONTRADICCIONES...` →
**C-21**, y la decisión literal en `06_ENTREGA2_ANALISIS.md` → **D2-08**.

Dentro de `especificaciones/` siguen apareciendo los nombres antiguos: es la transcripción literal
de lo que escribió Josué y **no se toca** (regla 47).

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
