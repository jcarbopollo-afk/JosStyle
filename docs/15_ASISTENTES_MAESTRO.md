# 15 · Asistentes inteligentes, patrones y planes — documento maestro

> **Punto de entrada** del sistema de asistentes de JosStyle, sus patrones de análisis y la
> estructura futura de planes Demo / Pro / Premium.
>
> **Creado:** 2026-10-19, en la **Fase maestra 0** (auditoría y estructura documental).
> **Estado del sistema de asistentes:** 📝 **solo documentado**. Ni un asistente nuevo, ni un plan,
> ni un pago está implementado. Lo que sí existe ya en el código está en §3 y lleva su ruta.
>
> El repositorio es la fuente de verdad (decisión **DA-08**). Nada de esto depende de la memoria de
> una conversación: quien retome el trabajo lee este archivo y después
> [`15_asistentes/SEGUIMIENTO.md`](15_asistentes/SEGUIMIENTO.md).

---

## 1. Objetivo y alcance

**Objetivo:** diseñar, documentar y, más adelante y por fases autorizadas, construir **asistentes
basados en reglas y datos reales** para cada módulo de JosStyle, un futuro **asistente general** que
cruce módulos solo cuando esté permitido, y dejar preparada (sin construir) la estructura de planes
y la **IA generativa libre**.

**Dentro del alcance (por orden, DA-01):**
1. Terminar y estabilizar JosStyle para uso personal de Josué.
2. Diseñar y documentar los asistentes por reglas y sus patrones.
3. Construirlos por fases verificables.
4. Probarlos e integrarlos en los módulos.
5. Seguir desarrollando y estabilizando el resto de la aplicación.
6. **Al final:** la IA generativa libre y su arquitectura.
7. **Cuando toque:** comercialización, accesos, suscripciones y pagos.

**Fuera del alcance ahora (DA-02, DA-05):** pagos, suscripciones, bloqueos por plan, listas de
cuentas autorizadas, la IA libre y cualquier reestructuración para el público.

## 2. Arquitectura prevista (propuesta, pendiente de la Fase 2)

Tres capas, de abajo arriba. **Solo la capa 1 existe hoy.**

| Capa | Qué es | Depende de una API generativa | Estado |
|---|---|---|---|
| **1. Motores** | Los cálculos de cada módulo (`src/lib/*.js`): rangos, progresión, correlaciones, inteligencia nutricional, recomendaciones, insights… Deterministas y con pruebas. | No | ✅ Existen (ver §3.2) |
| **2. Asistentes por reglas** | Una capa que **pregunta a los motores** y redacta respuestas con plantillas: preguntas sugeridas, patrones detectados, avisos opcionales. Uno por módulo + uno general. | **No** (DA-06) | 📝 Propuesta |
| **3. IA libre (Premium)** | Una capa **independiente** que interpreta preguntas nuevas con un modelo generativo, usando como contexto solo lo que la capa 2 autorice. | Sí | 🔒 Al final (DA-05) |

Principios de diseño confirmados: **DA-07** en [`15_asistentes/DECISIONES.md`](15_asistentes/DECISIONES.md).
Lo más importante: los asistentes **reutilizan** los motores existentes, no los duplican; una
respuesta programada **no se presenta como razonamiento generativo**; y ninguna acción importante se
ejecuta sin confirmación.

⚠️ **Hay una pieza intermedia que ya existe y que este diseño tiene que encajar**: los **paneles de
IA de cada módulo** (`AIPanel`) y el **buscador con IA** (🔍). Usan la API generativa **hoy**, y su
lugar en los planes está por decidir (**CX-05**).

## 3. Estado actual verificado (2026-10-19)

Verificado leyendo el código en `main` (v3.157.0). Detalle por asistente en el catálogo.

### 3.1 Lo que usa IA generativa (capa 3 a medias)

- **Servidor:** `api/ask-ai.js`. Un solo proveedor (Anthropic), modelo en la variable
  `ANTHROPIC_MODEL`, `max_tokens: 700`, sesión obligatoria (401 sin ella), **30 peticiones por usuario
  con el límite en memoria** (se pierde al reiniciarse la instancia de Vercel). Responde con `codigo`
  (`ia_no_habilitada`, `limite`, `sin_sesion`…) desde la P3.
- **Cliente:** `src/lib/ai.js` (`askAI`, `askAIWithImage`, `askAIWithImages`, `AI_SYSTEM`).
  `AI_SYSTEM` nombra a «Josué, un chico de 16 años»: es personal (**CX-06**).
- **13 paneles `AIPanel`** (un toque, una respuesta, sin conversación): Sueño, Estudios, Economía,
  Inicio («Consejo del día»), Fe (×2), Objetivos, Nutrición, Productividad (hábitos), Negocio,
  Entrenamiento, Diario, Salud.
- **Llamadas directas a `askAI`:** «Explícame un concepto» y plan de repaso (Estudios), revisión de
  objetivos (Objetivos), pasos de progresión (Entrenamiento).
- **Con imagen:** foto del plato (Nutrición), análisis de vídeo (Entrenamiento, `askAIWithImages`),
  adjunto del buscador (`ui.jsx`).
- **Sugerencias** (`SuggestionsButton`, `App.jsx`): manda un resumen de varios módulos.
- **Buscador 🔍 con IA** (`UniversalSearchModal`, `ui.jsx`): **ya acepta una pregunta libre** sobre
  los datos y le pasa **`currentState` entero** (`App.jsx`). Es una **pregunta suelta**: sin
  conversación ni memoria.
- **Estado «todavía no»:** `IAProximamente` + `estadoDeErrorIA` (`src/lib/disponibilidadIA.js`, P3).
- **No verificable desde aquí:** si `ANTHROPIC_API_KEY` está puesta en Vercel, o sea, si todo esto
  funciona hoy en producción.

### 3.2 Lo que NO usa IA (capa 1: motores de reglas)

Los que más interesan a los asistentes (la lista completa, con usos y pruebas, está en el catálogo):
`correlaciones.js`, `predicciones.js`, `inteligenciaNutricion.js`, `motorRecomendaciones.js` (+ pelo,
piel, perfumes), `insights.js` e `ideasEstilo.js` (Imagen personal), `armarioInteligencia.js`,
`automatizaciones.js` (Horario), `estadisticasPlan.js`, `integracionPR.js`, `puntuacion.js`,
`actividadEntrenamiento.js`, `progresion.js`, `progresoMuscular.js`, `motorRangos.js`,
`avisosPlanificacion.js` / `avisosHorario.js` / `avisosEstilo.js`.

### 3.3 Planes Demo / Pro / Premium

**Ni documentados antes de hoy ni implementados.** No hay tabla de suscripciones (`supabase/schema.sql`
solo crea `app_data`), ni pagos, ni ningún límite por plan. Lo que se parece y **no lo es**: ocultar
módulos (`personalizacion.ocultos`), el PIN de las áreas privadas y el límite de 30 peticiones.

### 3.4 AXION y la IA libre

AXION (≈1100 apartados de la Entrega 1) está **solo resumido** en
`ESPECIFICACION_AJUSTES_ENTREGA1.md` y analizado en `docs/01` §10 (con la propuesta **AXION Lite**);
**bloqueado** en `docs/02` R10 hasta una conversación de diseño. **El texto literal no está en el
repositorio** (**CX-07**).

## 4. Decisiones confirmadas y pendientes

Todas en [`15_asistentes/DECISIONES.md`](15_asistentes/DECISIONES.md). Resumen:

| Confirmadas (2026-10-19) | Pendientes |
|---|---|
| DA-01 orden estratégico · DA-02 uso personal y gratuito · DA-03 visión de planes (propuesta) · DA-04 el propietario no paga · DA-05 IA libre al final, gratis para el propietario en la etapa personal · DA-06 inteligencia por reglas sin API · DA-07 principios de diseño · DA-08 el repositorio es la fuente de verdad | Las 10 preguntas **P-01…P-10** (qué es un asistente, cómo se le habla, si Pro usa IA, proactividad, acciones, cruces, memoria, orden, tono, IA del propietario) y las contradicciones **CX-01…CX-08** |

## 5. Relación entre módulos, motores, asistentes y datos

```
 datos guardados (app_data, una clave por módulo)
        │   (las protecciones existentes NO se amplían: Relación, PIN, perfil de piel…)
        ▼
 MOTORES de cada módulo (src/lib)   ← capa 1, ya existe, con pruebas
        │   los asistentes los LLAMAN; no recalculan
        ▼
 ASISTENTE del módulo  ── patrones del catálogo (IDs PAT-…)   ← capa 2, propuesta
        │   solo con permiso (P-06) y cuando haga falta
        ▼
 ASISTENTE GENERAL (desde 🔍)                                   ← capa 2, propuesta
        │   contexto mínimo y filtrado
        ▼
 IA LIBRE (Premium)                                             ← capa 3, al final
```

## 6. Índice de documentos especializados

| Documento | Para qué |
|---|---|
| [`15_asistentes/CATALOGO_ASISTENTES.md`](15_asistentes/CATALOGO_ASISTENTES.md) | Cada asistente (existente o propuesto): módulo, datos, motores, permisos, estado y pruebas |
| [`15_asistentes/CATALOGO_PATRONES.md`](15_asistentes/CATALOGO_PATRONES.md) | La plantilla de 15 campos, el método para descubrir patrones y las fichas (con IDs `PAT-…`) |
| [`15_asistentes/DECISIONES.md`](15_asistentes/DECISIONES.md) | Decisiones `DA-…`, preguntas abiertas `P-…` y contradicciones `CX-…` |
| [`15_asistentes/SEGUIMIENTO.md`](15_asistentes/SEGUIMIENTO.md) | Dónde va el trabajo, qué se hizo, qué toca y cómo retomarlo |
| `docs/01` §10, `docs/02` R10 | AXION y AXION Lite (no se duplican aquí) |
| `docs/03` | Contradicciones globales del proyecto (C-…, DEP-…) |
| `especificaciones/ESPECIFICACION_BUSCADOR_E_IA.md` | El buscador + IA original (BI F1–F4, construido) |

## 7. Fases y dependencias

| Fase | Contenido | Depende de | Estado |
|---|---|---|---|
| **0** | Auditoría y esta estructura documental | — | ✅ Completada 2026-10-19 (ver seguimiento) |
| **1** | Inventario completo: cada módulo, sus claves de datos, sus motores con firma y lo que devuelven, sus pruebas y sus permisos | 0 | ⬜ Pendiente |
| **2** | Arquitectura de los asistentes (capa 2): contrato asistente ↔ motor, formato de respuesta, dónde se pinta, encaje con `AIPanel` | 1 + respuestas a P-01…P-07 | ⬜ Pendiente |
| **3** | Catálogo exhaustivo de patrones **por módulo** (fichas de 15 campos) | 1, 2 | ⬜ Pendiente |
| **4** | Patrones transversales y cruces autorizados | 3 + P-06 | ⬜ Pendiente |
| **5** | Preguntas, intenciones y respuestas (plantillas) | 3, 4 + P-02, P-09 | ⬜ Pendiente |
| **6** | Pruebas, casos límite y validación de cobertura | 3–5 | ⬜ Pendiente |
| **7** | Especificaciones de implementación por fases | 6 | ⬜ Pendiente |
| **8+** | Implementación, integración y pruebas | **autorización de Josué** | 🔒 |
| **Final A** | IA generativa libre (diseño desde AXION Lite) | resto estable + conversación de diseño (R10) | 🔒 |
| **Final B** | Planes, accesos de propietario, suscripciones y pagos | Final A o decisión de Josué | 🔒 |

## 8. Riesgos

- **Privacidad:** el buscador 🔍 y el panel del Diario **ya mandan el Diario** a la IA a un toque
  (CX-02). Ninguna fase nueva amplía eso por comodidad.
- **Duplicar lógica:** un asistente que recalcule lo que ya calcula un motor acabaría diciendo un
  número distinto del de la pantalla (lección repetida en `CLAUDE.md`). La Fase 1 existe para
  evitarlo.
- **Datos obsoletos en motores viejos:** `correlacionEntrenoAnimo` lee `calistenia` (el sistema
  anterior a Fitness), no `fitness.sesiones` (CX-09, por verificar en la Fase 1).
- **Prometer de más:** un asistente por reglas que suene a IA libre (DA-07).
- **Coste:** la IA usa una clave de pago; el límite actual no es persistente (CX-08).
- **Tamaño:** `CLAUDE.md` es muy largo; este sistema vive en `docs/15*` para no inflarlo más.

## 9. Criterios de finalización (del diseño, no de la implementación)

El diseño estará terminado cuando: (1) cada módulo pertinente tenga su ficha de asistente con datos
y motores **verificados** contra el código; (2) cada patrón tenga su ficha completa de 15 campos o
esté marcado como descartado con motivo; (3) las preguntas P-… estén contestadas o aplazadas con
fecha; (4) cada patrón tenga definidas sus pruebas; y (5) existan especificaciones de implementación
por fases que Josué haya aprobado. **Nada de esto se da por hecho por haber escrito un resumen.**
