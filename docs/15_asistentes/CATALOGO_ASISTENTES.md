# Catálogo de asistentes y módulos

> Parte de [`../15_ASISTENTES_MAESTRO.md`](../15_ASISTENTES_MAESTRO.md).
> **Estado del catálogo: 🟡 parcial (Fase 0).** Las secciones 1 y 2 están **verificadas contra el
> código** el 2026-10-19 (`main`, v3.157.0). Las fichas de la sección 3 son **plantillas propuestas**:
> sus motores están localizados, pero las firmas, los datos exactos y las pruebas se verifican en la
> **Fase 1**. Nada de lo marcado 📝 existe.
>
> Leyenda: ✅ existe y verificado · 🟡 existe, detalle por verificar · 📝 propuesta · 🔒 bloqueado.

---

## 1. Puntos de entrada a la IA generativa que YA existen

Todos llaman a `api/ask-ai.js` (Anthropic) a **un toque explícito** (regla 7) y dan **una respuesta
suelta**, sin conversación. Si la IA no está habilitada, enseñan `IAProximamente` (P3).

| Dónde | Rótulo | Qué datos manda (resumen verificado en el `buildPrompt`) | Estado |
|---|---|---|---|
| `SleepView.jsx` | Analizar mi sueño | Últimos registros de sueño | ✅ |
| `EstudiosView.jsx` | Analizar mis estudios | Asignaturas, últimos 15 exámenes, últimas 20 sesiones de horas | ✅ |
| `EstudiosView.jsx` | Explícame un concepto | Solo la pregunta + curso de Josué | ✅ |
| `EstudiosView.jsx` | Plan de repaso | Tema, fecha y nota objetivo de un examen; pide JSON | ✅ |
| `FinanceView.jsx` | Consejo financiero | Saldo, ingresos y gastos del mes, movimientos recientes | ✅ |
| `DashboardView.jsx` | Consejo del día | Datos de hoy (sueño y otros) | ✅ |
| `FaithView.jsx` | Reflexionar sobre mis últimas entradas | Hasta 15 entradas del diario espiritual + `AVISO_DOCTRINAL` | ✅ |
| `FaithView.jsx` | ¿Voy por buen camino? | Objetivos espirituales + `AVISO_DOCTRINAL` | ✅ |
| `ObjectivesView.jsx` | ¿Voy por buen camino? / revisión | Objetivos (texto, plazo, cumplido) | ✅ |
| `NutritionView.jsx` | Analizar mi semana | `contextoIANutricion(nutricion)` (promedios, **sin comidas ni peso**) + agua + objetivo de agua | ✅ |
| `NutritionView.jsx` | Foto del plato | Imagen (`askAIWithImage`) | ✅ |
| `ProductivityView.jsx` | Consejo de hábitos | Hábitos con su regla y rachas (`estadisticasHabito`) | ✅ |
| `BusinessView.jsx` | Mejorar mis ideas | Proyectos de negocio | ✅ |
| ~~`TrainingView.jsx`~~ | ~~Sugerencia de entrenamiento~~ | `calistenia` entera + partidos de fútbol | 🧹 **retirado** (v3.158.0, 2026-10-19: Josué quitó el bloque de calistenia y fútbol de Fitness; los datos siguen guardados) |
| ~~`TrainingView.jsx`~~ | ~~Pasos de progresión / análisis de vídeo~~ | Nivel de una habilidad / fotogramas (`askAIWithImages`, que sigue en `ai.js` sin quien la llame) | 🧹 **retirado** (v3.158.0, mismo motivo) |
| `DiaryView.jsx` | Detectar patrones emocionales | Hasta 20 entradas (ánimo, cómo me siento, qué he aprendido) — **CX-02** | ✅ |
| `HealthView.jsx` | Analizar mi salud | Últimas 15 medidas + historial médico | ✅ |
| `App.jsx` → `SuggestionsButton` | Sugerencias | Resumen de sueño, calistenia, fútbol, economía, salud, nutrición, estudios, productividad, objetivos, fe (3 entradas) y bienestar | ✅ |
| `ui.jsx` → `UniversalSearchModal` | Preguntar a la IA (🔍) | **Pregunta libre** + `currentState` entero (sin Relación ni Imagen personal) — **CX-02** | ✅ |

**Privacidad verificada:** Relación queda fuera de `currentState` y de la exportación (`App.jsx`,
regla 6); Imagen personal entra en la IA solo por `contextoParaIA()` de `iaEstilo.js`, con su permiso
apagado por defecto y sin tipo de piel ni sensibilidad (`CAMPOS_PRIVADOS`); Nutrición no manda
comidas ni peso; Fe lleva `AVISO_DOCTRINAL`. **Pruebas que lo vigilan:** `test-disponibilidad-ia`,
`test-ia-estilo`, `test-endpoint-ia`, `test-inteligencia-nutricion` (lista completa en la Fase 1).

## 2. Motores de reglas que YA existen (capa 1)

Localizados con sus exportaciones, quién los usa y qué suite los prueba. **Ninguno usa la API.**

| Motor (`src/lib/`) | Módulo | Qué calcula (por sus exportaciones) | Lo usa | Pruebas |
|---|---|---|---|---|
| `correlaciones.js` | Estadísticas / Estudios | Sueño↔estudio, sueño↔ánimo, entreno↔ánimo (umbral 7 h, mínimo 2–3 días por grupo) | `StatsView`, `EstudiosView` | `test-sueno-grafica` (indirecta) |
| `predicciones.js` | Progreso | Objetivo, abandono de hábito, peso, fuerza, ahorro, notas | `PredictionsView`, `calendarioIntegracion` | 🟡 sin suite propia localizada |
| `inteligenciaNutricion.js` | Nutrición | Niveles de confianza, proteína, calorías, regularidad, «no registrado ≠ no consumido» | `NutritionView` | `test-inteligencia-nutricion` |
| `motorRecomendaciones.js` | Imagen personal | Reglas con `requiere`, silencios, descartes, tono | pelo, piel, cuerpo, insights, ideas… | varias (`test-ideas-estilo`, `test-recomendaciones-*`) |
| `recomendacionesPelo/Piel/Perfumes.js` | Imagen personal | Reglas por tema, motivos, silencios | `EstiloHombreView` | `test-recomendaciones-*` |
| `insights.js`, `ideasEstilo.js`, `resumenPeriodico.js` | Imagen personal | Insights por periodo, ideas cruzadas, resumen periódico | `EstiloHombreView` | `test-insights`, `test-ideas-estilo`, `test-resumen-periodico` |
| `iaEstilo.js` | Imagen personal | Permiso de IA, intenciones, contexto filtrado | Imagen personal | `test-ia-estilo` |
| `armarioInteligencia.js` | Armario | Estadísticas de prendas y outfits, repeticiones, diversidad | `ArmarioView` | `test-armario-inteligencia` |
| `automatizaciones.js` | Horario | Estados temporales, disparadores, condiciones, acciones | `HorarioView` | `test-automatizaciones` |
| `estadisticasPlan.js` | Calendario | Cumplimiento por día y periodo, sin datos inventados | `CalendarView` | `test-estadisticas-plan` |
| `integracionPR.js` | Productividad / Inicio | Resumen del día, «qué me queda», prioridades, cadenas objetivo→meta→tarea | `DashboardView`, `ProductivityView` | `test-integracion-pr` |
| `puntuacion.js` | Inicio | Puntuación del día y su mensaje | `DashboardView` | `test-puntuacion` |
| `actividadEntrenamiento.js`, `progresion.js`, `progresoMuscular.js`, `motorRangos.js` | Fitness | Actividad y adherencia, progresión comparable, progreso muscular, rangos y su confianza | vistas de Fitness | suites de Fitness (`test-actividad-entrenamiento`, `test-progreso-muscular`…) |
| `avisosPlanificacion.js`, `avisosHorario.js`, `avisosEstilo.js` | Calendario / Horario / Imagen | Qué avisar y cuándo (apagados por defecto); quien manda es `notificaciones.js` | sus vistas | suites propias |

**Pendiente para la Fase 1:** motores de Sueño (`sueno.js` es modelo y registro, no análisis), Salud,
Economía (`hucha.js`), Estudios, Hábitos/Rachas (`rachas.js`), Hoy (`hoy.js`, `centroDelDia.js`),
Bienestar digital, Fe, Negocio, Biblioteca, Diario: qué hay, firma, forma de lo que devuelven y pruebas.

## 3. Asistentes propuestos (📝)

Plantilla común. Cada ficha se completa en la Fase 1 (datos y motores verificados) y la Fase 2
(resultados, acciones y permisos).

```
### ASIS-<módulo>
- Módulo · función
- Datos de entrada permitidos (clave de app_data y campos)
- Motores reutilizables (archivo → función, firma verificada)
- Resultados que puede producir
- Acciones que puede proponer (siempre con confirmación, P-05)
- Permisos y exclusiones (privacidad)
- Estado (📝 / 🟡 / ✅)
- Pruebas existentes · pruebas pendientes
```

| ID | Módulo | Motores ya localizados | Exclusiones conocidas | Estado |
|---|---|---|---|---|
| ASIS-NUT | Nutrición | `inteligenciaNutricion`, `aguaNutricion` | Ni objetivos calóricos estrictos (regla 7) ni comidas ni peso a la IA | 📝 |
| ASIS-FIT | Fitness | `actividadEntrenamiento`, `progresion`, `progresoMuscular`, `motorRangos` | Fotos de progreso tras `fotos_privadas` (C-35) | 📝 |
| ASIS-SUE | Sueño | `correlaciones` (sueño↔estudio/ánimo); análisis propio por localizar | — | 📝 |
| ASIS-EST | Estudios | `correlaciones`, `predicciones.prediccionNotas`; fechas académicas | — | 📝 |
| ASIS-PRO | Productividad (hábitos, tareas, metas, pomodoro, rutinas) | `integracionPR`, `rachas`, `predicciones.prediccionAbandonoHabito` | — | 📝 |
| ASIS-HOR | Horario | `automatizaciones`, `analiticaHorario` | Notas privadas de una actividad (HT F5/F9) | 📝 |
| ASIS-CAL | Calendario / Hoy | `estadisticasPlan`, `hoy`, `centroDelDia`, `puntuacion` | Eventos de Relación solo con PIN desbloqueado | 📝 |
| ASIS-ECO | Economía | `predicciones.prediccionAhorro`, `hucha` (por verificar) | — | 📝 |
| ASIS-IMG | Imagen personal | `motorRecomendaciones`, `insights`, `ideasEstilo`, `iaEstilo`, recomendaciones de pelo/piel/perfumes | Tipo de piel y sensibilidad nunca; permiso de IA apagado por defecto | 📝 — **es el módulo con más inteligencia ya construida** |
| ASIS-ARM | Armario | `armarioInteligencia` | — | 📝 |
| ASIS-SAL | Salud física | por localizar (`salud.js`) | Nada de diagnósticos ni objetivos de peso | 📝 |
| ASIS-FE | Fe | por localizar | `AVISO_DOCTRINAL` obligatorio | 📝 |
| ASIS-DIA | Diario | `correlaciones.correlacionSuenoAnimo`, `correlacionEntrenoAnimo` | **Privado: P-06 decide si entra** | 📝 |
| ASIS-REL | Relación | — | 🔒 Fuera de todo por defecto (regla 6) | 🔒 |
| ASIS-GEN | **Asistente general** (desde 🔍) | El índice de búsqueda (`indiceBusqueda.js`, BI F3) + los asistentes de módulo | Solo cruza con permiso (P-06); contexto mínimo | 🟡 **parcial**: el buscador ya existe y ya manda preguntas libres a la IA; la versión **por reglas** es 📝 |
