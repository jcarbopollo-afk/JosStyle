# 15 · Asistentes inteligentes, patrones y planes — documento maestro

> **Punto de entrada** del sistema de asistentes de JosStyle, sus patrones de análisis y la
> estructura futura de planes Demo / Pro / Premium.
>
> **Creado:** 2026-10-19, en la **Fase maestra 0** (auditoría y estructura documental).
> **Fase 1 (inventario) hecha el 2026-10-19** sobre la v3.158.0: [`15_asistentes/INVENTARIO.md`](15_asistentes/INVENTARIO.md).
> **Estado del sistema de asistentes:** 📝 **solo documentado**. Ni un asistente nuevo, ni un plan,
> ni un pago está implementado. Lo que sí existe ya en el código está en §3 y lleva su ruta.
>
> 🚨 **Requisito firme (DA-09):** los análisis, los motores, los asistentes y los chatbots normales
> —**también los asistentes conversacionales del Pro**— funcionan **sin inferencia generativa, sin
> claves de API de IA y sin llamar a modelos generativos**: reglas, cálculos, estadísticas, patrones
> y respuestas estructuradas. **Solo la IA libre Premium**, que se hace al final, puede depender de
> una API generativa. Ahora todo es gratis para el propietario, sin pagos ni límites por plan; el
> coste de alojamiento y base de datos es otra cosa que el de inferencia.
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
| **2. Asistentes por reglas** | Una capa que **pregunta a los motores** y redacta respuestas con plantillas: preguntas sugeridas, patrones detectados, avisos opcionales. Uno por módulo + uno general. **Incluye los asistentes conversacionales del Pro**: entienden y contestan con reglas y respuestas estructuradas. | **No, nunca** (DA-06, **DA-09**) | 📝 Propuesta |
| **3. IA libre (Premium)** | Una capa **independiente** que interpreta preguntas nuevas con un modelo generativo, usando como contexto solo lo que la capa 2 autorice. **La única con coste de inferencia.** | Sí | 🔒 Al final (DA-05, DA-09) |

Principios de diseño confirmados: **DA-07** en [`15_asistentes/DECISIONES.md`](15_asistentes/DECISIONES.md).
Lo más importante: los asistentes **reutilizan** los motores existentes, no los duplican; una
respuesta programada **no se presenta como razonamiento generativo**; y ninguna acción importante se
ejecuta sin confirmación.

⚠️ **Hay una pieza intermedia que ya existe y que este diseño tiene que encajar**: los **paneles de
IA de cada módulo** (`AIPanel`) y el **buscador con IA** (🔍). Usan la API generativa **hoy**.
**DA-09 los deja como están** —no se migran ni cambian en las fases de asistentes— y su sitio
definitivo (Premium, sustituirlos por reglas o quitarlos) lo decide Josué (**CX-05**).

## 3. Estado actual verificado (2026-10-19)

Verificado leyendo el código en `main` (v3.157.0) y **recontado en la Fase 1 sobre la v3.158.0**.
Detalle por asistente en el catálogo y, por módulo, en [`15_asistentes/INVENTARIO.md`](15_asistentes/INVENTARIO.md).

### 3.1 Lo que usa IA generativa (capa 3 a medias)

- **Servidor:** `api/ask-ai.js`. Un solo proveedor (Anthropic), modelo en la variable
  `ANTHROPIC_MODEL`, `max_tokens: 700`, sesión obligatoria (401 sin ella), **30 peticiones por usuario
  con el límite en memoria** (se pierde al reiniciarse la instancia de Vercel). Responde con `codigo`
  (`ia_no_habilitada`, `limite`, `sin_sesion`…) desde la P3.
- **Cliente:** `src/lib/ai.js` (`askAI`, `askAIWithImage`, `askAIWithImages`, `AI_SYSTEM`).
  `AI_SYSTEM` nombra a «Josué, un chico de 16 años»: es personal (**CX-06**).
- **12 paneles `AIPanel`** (un toque, una respuesta, sin conversación): Sueño, Estudios, Economía,
  Inicio («Consejo del día»), Fe (×2), Objetivos, Nutrición, Productividad (hábitos), Negocio,
  Diario, Salud. *(Eran 13: el de Entrenamiento se fue con el bloque de calistenia en la v3.158.0.)*
- **Llamadas directas a `askAI`:** «Explícame un concepto» y plan de repaso (Estudios), revisión de
  objetivos (Objetivos). *(Los pasos de progresión de Entrenamiento se retiraron en la v3.158.0.)*
- **Con imagen:** foto del plato (Nutrición) y adjunto del buscador (`ui.jsx`). `askAIWithImages`
  sigue en `ai.js` **sin quien la llame** (el análisis de vídeo se retiró en la v3.158.0).
- **Sugerencias** (`SuggestionsButton`, `App.jsx`): manda un resumen de varios módulos — ⚠️ con la
  calistenia antigua y sin Fitness (CX-12).
- **Buscador 🔍 con IA** (`UniversalSearchModal`, `ui.jsx`): **ya acepta una pregunta libre** sobre
  los datos y le pasa **`currentState` entero** (`App.jsx`). Es una **pregunta suelta**: sin
  conversación ni memoria.
- **Estado «todavía no»:** `IAProximamente` + `estadoDeErrorIA` (`src/lib/disponibilidadIA.js`, P3).
- **No verificable desde aquí:** si `ANTHROPIC_API_KEY` está puesta en Vercel, o sea, si todo esto
  funciona hoy en producción.

### 3.2 Lo que NO usa IA (capa 1: motores de reglas)

Los que más interesan a los asistentes (la lista completa, con firmas, formas devueltas, nivel de
verificación y pruebas, está en el [inventario](15_asistentes/INVENTARIO.md)):
`correlaciones.js`, `predicciones.js`, `inteligenciaNutricion.js`, `estadisticasNutricion.js`,
`motorRecomendaciones.js` (+ pelo, piel, perfumes), `ideasEstilo.js` y `progresoEstilo.js` (Imagen
personal), `armarioInteligencia.js`, `analiticaHorario.js` y `automatizaciones.js` (Horario),
`estadisticasPlan.js`, `integracionPR.js`, `puntuacion.js`, `salud.js`, `hucha.js`,
`fechasAcademicas.js`, `actividadEntrenamiento.js`, `progresion.js`, `progresoMuscular.js`,
`motorRangos.js`, `avisosPlanificacion.js` / `avisosHorario.js` / `avisosEstilo.js`.

⚠️ **Construidos y probados, pero sin conectar** (ninguna pantalla los carga, CX-13): `insights.js`,
`iaEstilo.js`, `aprendizaje.js`, `resumenPeriodico.js`, `contextual.js` y `recuperacion.js`, de
Imagen personal. **No cuentan como disponibles.** Y **sin motor propio**: Fe, Diario, Negocio y
Bienestar digital.

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
| DA-01 orden estratégico · DA-02 uso personal y gratuito · DA-03 visión de planes (propuesta) · DA-04 el propietario no paga · DA-05 IA libre al final, gratis para el propietario en la etapa personal · DA-06 inteligencia por reglas sin API · DA-07 principios de diseño · DA-08 el repositorio es la fuente de verdad · 🚨 **DA-09 sin inferencia generativa salvo la IA libre Premium** (contesta P-03) | Las preguntas **P-01, P-02 y P-04…P-10** (qué es un asistente, cómo se le habla, proactividad, acciones, cruces, memoria, orden, tono, IA del propietario) y las contradicciones abiertas **CX-01…CX-08** y **CX-11…CX-15** (las de la Fase 1, con su diagnóstico) |

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
| [`15_asistentes/INVENTARIO.md`](15_asistentes/INVENTARIO.md) | **Fase 1:** cada módulo con sus datos, motores (firma y forma, nivel de verificación), pruebas, privacidad y estado; Imagen personal real; CX-09/CX-10; tarjetas con calistenia antigua |
| [`15_asistentes/INVENTARIO_ANEXO_LIBRERIAS.md`](15_asistentes/INVENTARIO_ANEXO_LIBRERIAS.md) | Anexo generado: qué librerías usa de verdad cada pantalla y qué suites las importan |
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
| **1** | Inventario completo: cada módulo, sus claves de datos, sus motores con firma y lo que devuelven, sus pruebas y sus permisos | 0 | ✅ Completada 2026-10-19 ([inventario](15_asistentes/INVENTARIO.md)) |
| **1b** | Arreglos de los datos que darían los asistentes: CX-09, CX-11, CX-12 (tarjetas con calistenia), CX-14, CX-15 y una suite para `correlaciones.js` y `predicciones.js` | 1 + **autorización de Josué** (dada el 2026-10-19) | ✅ **Hecha (v3.159.0, 2026-10-19)**, sin commit ni push por orden de Josué. «Primer PR» se conserva y la IA no se toca (DA-10, DA-09). Nuevo: CX-17 (de Josué) |
| **1c** | Correcciones tras la auditoría adversarial de 1 + 1b: CX-09 con el registro interrumpido, ánimo estricto e ids; «Primer PR» alcanzable; Imagen personal «Tu entrenamiento» con Fitness (CX-18); fechas futuras y cambio de día (CX-19) | 1b + **orden de Josué** (2026-10-20) | ✅ **Hecha (v3.160.0, 2026-10-20)**, sin commit ni push por orden de Josué (DA-11). Ni la IA ni las 6 librerías de Imagen personal se tocan |
| **2** | Arquitectura de los asistentes (capa 2, **sin inferencia**, DA-09): contrato asistente ↔ motor, formato de respuesta, dónde se pinta, cómo conviven con los `AIPanel` que se quedan | 1 + respuestas a P-01, P-02, P-04…P-07 | ⬜ Pendiente |
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
  anterior a Fitness), no `fitness.sesiones` — **verificado: da datos falsos** (CX-09), y cinco
  sitios más tampoco leen Fitness (CX-12). Un asistente que se apoye en ellos repetiría el error.
  ✅ **Corregido en la Fase 1B (v3.159.0)**, salvo «Primer PR» (se conserva) y la IA (DA-09): un
  asistente que necesite «qué entrenamientos cuentan» o «qué días entrenó» lee
  `sesionesCompletadas.js` / `fechasDeEntreno.js`, nunca un recorrido propio.
  🔓 **Y la Fase 1C (v3.160.0, DA-11)** corrigió lo que la auditoría vio después: la correlación
  compara solo las semanas con algún entrenamiento registrado (dejar de apuntar no es descansar),
  «Primer PR» se puede conseguir con Fitness, Imagen personal lee Fitness y un entrenamiento con
  fecha futura no es «hoy». **Lección para un asistente: un día sin registro no es un dato.**
- **Funciones que parecen disponibles y no lo están:** seis librerías de Imagen personal construidas
  y probadas que ninguna pantalla carga (CX-13). Un asistente no puede darlas por hechas.
- **Prometer de más:** un asistente por reglas que suene a IA libre (DA-07).
- **Colarse una llamada a la API en un asistente** (DA-09): lo vigila la revisión de la Fase 2 y,
  si se autoriza, una prueba automática.
- **Coste:** la IA usa una clave de pago; el límite actual no es persistente (CX-08).
- **Tamaño:** `CLAUDE.md` es muy largo; este sistema vive en `docs/15*` para no inflarlo más.

## 9. Criterios de finalización (del diseño, no de la implementación)

El diseño estará terminado cuando: (1) cada módulo pertinente tenga su ficha de asistente con datos
y motores **verificados** contra el código; (2) cada patrón tenga su ficha completa de 15 campos o
esté marcado como descartado con motivo; (3) las preguntas P-… estén contestadas o aplazadas con
fecha; (4) cada patrón tenga definidas sus pruebas; y (5) existan especificaciones de implementación
por fases que Josué haya aprobado. **Nada de esto se da por hecho por haber escrito un resumen.**
