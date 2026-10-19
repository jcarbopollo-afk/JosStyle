# Seguimiento y continuidad — asistentes, patrones y planes

> Parte de [`../15_ASISTENTES_MAESTRO.md`](../15_ASISTENTES_MAESTRO.md). **Se actualiza al cerrar
> cada fase**, nunca se reescribe desde cero: lo antiguo se queda como historia.
> Una tarea solo se marca ✅ con evidencia (archivo, prueba o comprobación); lo planificado es ⬜.

---

## Estado en una línea

**Última fase terminada: Fase 0 (2026-10-19).** Próxima: **Fase 1**, que **necesita autorización
de Josué** para empezar. Las preguntas **P-01…P-10** siguen sin respuesta (bloquean la Fase 2, no la 1).

## Cómo retomar en una sesión nueva

1. Leer `CLAUDE.md` (reglas del proyecto; manda sobre esto si choca).
2. Leer [`../15_ASISTENTES_MAESTRO.md`](../15_ASISTENTES_MAESTRO.md) entero.
3. Leer este archivo y [`DECISIONES.md`](DECISIONES.md) (sobre todo las P- y las CX- abiertas).
4. `git fetch origin main` y comprobar la versión de `package.json`: si el código ha cambiado desde
   la fecha de la última entrada, lo marcado «verificado» puede haber quedado viejo.
5. Hacer **solo** la fase siguiente que Josué haya autorizado y, al terminar, añadir aquí su entrada.

## Registro de fases

### Fase 0 — Auditoría y estructura documental · ✅ 2026-10-19

**Hecho (con evidencia):**
- Auditoría del repositorio en `main` v3.157.0, solo lectura: `CLAUDE.md`, `docs/00`–`14`,
  `ESPECIFICACION_AJUSTES_ENTREGA1.md`, `especificaciones/ESPECIFICACION_BUSCADOR_E_IA.md`,
  `api/ask-ai.js`, `src/lib/ai.js`, `src/lib/disponibilidadIA.js`, `src/lib/correlaciones.js` (entero),
  los 13 `AIPanel` (sus `buildPrompt`), las llamadas directas a `askAI`/`askAIWithImage(s)`,
  `SuggestionsButton`, `UniversalSearchModal` y su `buildContext`, `currentState` (`App.jsx`),
  `supabase/schema.sql`, `.claude/settings.json` y las exportaciones de 27 motores de `src/lib/` con
  quién los usa y qué suite los prueba.
- Búsqueda de planes, pagos, suscripciones, créditos y chatbots en documentación y código: **no hay
  nada** (lo que aparece como «premium» o «suscripción» es diseño visual o notificaciones push).
- Creados: `docs/15_ASISTENTES_MAESTRO.md`, `docs/15_asistentes/CATALOGO_ASISTENTES.md`,
  `CATALOGO_PATRONES.md`, `DECISIONES.md` y este archivo.
- Modificado: `docs/00_INDICE.md` (una fila nueva en la tabla, apuntando al maestro).
- Comprobado que existen todos los archivos de `src/lib/` y `scripts/test-*.mjs` citados en el
  catálogo de asistentes, y que los enlaces relativos entre los cinco documentos resuelven.

**No hecho (a propósito):** ni código, ni pruebas ejecutadas (la fase no las necesitaba), ni commit,
ni push, ni cambios en `CLAUDE.md`, `docs/02`, `docs/03` o `HANDOFF.md`.

**Descubierto:** el buscador 🔍 ya hace preguntas libres a la IA con `currentState` entero (CX-02);
los paneles de IA usan la API generativa (CX-05); dos dudas reales en `correlaciones.js` (CX-09 y
CX-10); `predicciones.js` no tiene suite propia localizada; `prediccionPeso` puede chocar con la regla 7.

**Pruebas ejecutadas:** ninguna (fase documental). La última pasada completa de `verificar.sh`
(2026-10-19, v3.157.0) salió **TODO CORRECTO**.

### Después de la Fase 0 — cambios en el código que tocan este catálogo · 2026-10-19

- **v3.158.0** (pedido por Josué, fuera de este plan): Fitness → Entrenamiento ya no tiene el bloque
  de calistenia y fútbol. Con `TrainingView.jsx` se fueron **tres puntos de entrada a la IA**
  (sugerencia de entrenamiento, pasos de progresión y análisis de vídeo): quedan **12 `AIPanel`**.
  Marcados como retirados en [`CATALOGO_ASISTENTES.md`](CATALOGO_ASISTENTES.md) y en CX-05.
  ⚠️ **Los datos siguen**: `calistenia`, `futbol` y `calisteniaVideos` en `app_data`, así que
  PAT-X-003 y **CX-09** siguen valiendo tal cual.
- Los documentos de la Fase 0 se subieron a `main` ese mismo día, cuando Josué dijo «súbelo todo».

## Próxima tarea concreta (Fase 1 — inventario)

Para **cada** módulo de `MORE_NAV` y para Hoy:
1. Claves de `app_data` y campos, con qué significa vacío o `null` en cada uno (leer el normalizador).
2. Motores con **firma y forma de lo que devuelven**, verificadas leyendo el código.
3. Suites que los prueban (`scripts/`), y si están en `verificar.sh`.
4. Protecciones de privacidad que les aplican (PIN, `fotos_privadas`, `CAMPOS_PRIVADOS`, regla 6…).
5. Resolver o acotar **CX-09** y **CX-10**.
6. Completar la sección 2 y las fichas `ASIS-…` del catálogo de asistentes (datos y motores, no
   todavía resultados ni acciones).

**Criterio de cierre de la Fase 1:** ninguna fila del catálogo de asistentes con «por localizar» o
«por verificar»; cada motor con su firma comprobada; el seguimiento actualizado.

## Dependencias y bloqueos

- **Fase 2** depende de las respuestas a P-01…P-07.
- **Fase 4** depende de P-06 (cruces y privacidad).
- **IA libre** depende de DA-05/DA-01 (al final), de la conversación de diseño de AXION (`docs/02`
  R10) y de que Josué vuelva a pasar el texto literal de AXION (CX-07).
- **Planes** dependen de DA-01 (al final) y de las decisiones aplazadas de `DECISIONES.md`.

## Archivos de este sistema

| Archivo | Creado | Última actualización |
|---|---|---|
| `docs/15_ASISTENTES_MAESTRO.md` | 2026-10-19 (F0) | 2026-10-19 (F0) |
| `docs/15_asistentes/CATALOGO_ASISTENTES.md` | 2026-10-19 (F0) | 2026-10-19 (v3.158.0: paneles de calistenia retirados) |
| `docs/15_asistentes/CATALOGO_PATRONES.md` | 2026-10-19 (F0) | 2026-10-19 (F0) |
| `docs/15_asistentes/DECISIONES.md` | 2026-10-19 (F0) | 2026-10-19 (v3.158.0: CX-05, 12 paneles) |
| `docs/15_asistentes/SEGUIMIENTO.md` | 2026-10-19 (F0) | 2026-10-19 (cambios tras la F0) |
