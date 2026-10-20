# Catálogo de asistentes y módulos

> Parte de [`../15_ASISTENTES_MAESTRO.md`](../15_ASISTENTES_MAESTRO.md).
> **Estado del catálogo: 🟡 datos y motores verificados (Fase 1, 2026-10-19, v3.158.0).** Las
> secciones 1 y 2 están **verificadas contra el código**; en la 3, los motores de cada asistente
> están comprobados (firma y forma en [`INVENTARIO.md`](INVENTARIO.md) §7). **Faltan sus resultados,
> acciones y permisos, que son de la Fase 2.** Nada de lo marcado 📝 existe.
>
> 🚨 **DA-09:** ningún asistente de este catálogo usa inferencia generativa, claves de IA ni
> `api/ask-ai.js`; tampoco los conversacionales del Pro. Lo de la sección 1 es lo que **ya existe**
> y se queda como está (CX-05).
>
> Leyenda: ✅ existe y verificado · 🟡 existe con un fallo o sin conectar · 📝 propuesta · 🔒 bloqueado.

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
`test-ia-estilo`, `test-endpoint-ia`, `test-inteligencia-nutricion`. ⚠️ `iaEstilo.js` **no lo carga
ninguna pantalla** (CX-13): hoy Imagen personal no manda nada a la IA por ningún camino.
⚠️ `currentState` lleva la calistenia antigua y **no** Fitness (CX-12; **la IA no se tocó en la Fase 1B**, DA-09). Detalle de qué ve la IA
clave por clave: [`INVENTARIO.md`](INVENTARIO.md) §2.

**Recuento de la Fase 1 (V1):** 12 `<AIPanel>`, `askAI` directo en Estudios (2) y Objetivos (1),
`askAIWithImage` en Nutrición, y en `ui.jsx` el panel, el buscador 🔍 y las Sugerencias.
`askAIWithImages` no tiene quien la llame. Horario **prepara** contextos para IA (`horarioTop.js`)
que ninguna pantalla manda.

## 2. Motores de reglas que YA existen (capa 1)

Verificados en la Fase 1 (niveles V1/V2/V3/P del [inventario](INVENTARIO.md) §1). **Ninguno usa la
API.** «Lo usa» = lo importa **y lo usa** un archivo que la aplicación carga.

| Motor (`src/lib/`) | Módulo | Qué calcula | Lo usa | Pruebas | Estado |
|---|---|---|---|---|---|
| `correlaciones.js` | Progreso / Estudios | Sueño↔estudio, sueño↔ánimo, entreno↔ánimo | `StatsView`, `EstudiosView` | `test-sueno-grafica` y, desde la Fase 1B, **`test-correlaciones-metricas` (valores)** | ✅ CX-09 y CX-11 **corregidos en la Fase 1B** (días, no registros; entreno = Fitness + fechas de la calistenia de antes); 🔓 **Fase 1C** (DA-11): entreno↔ánimo solo compara las semanas con algún entrenamiento registrado, ánimo estricto 1–5, sesiones por `id` (`test-correcciones-1c`) |
| `predicciones.js` | Progreso | Objetivo, abandono de hábito, peso, fuerza, ahorro, notas | `PredictionsView` (+ `prediccionObjetivo` en 3 sitios) | `test-correlaciones-metricas` (constancia); el resto, solo el banco de renderizado | ✅ «Fuerza» es ahora **constancia en días** con Fitness (Fase 1B, CX-12), sin días futuros (Fase 1C, CX-19); 🟡 peso roza la regla 7 |
| `logros.js` | Progreso | Insignias | `AchievementsView` | `test-correlaciones-metricas` y `test-correcciones-1c` («Primer PR», valores) | ✅ **Fase 1C (DA-11):** «Primer PR» se consigue superando una marca en Fitness (`primerRecordPersonal`, F11) o con el PR de calistenia de antes, que se conserva; total 12 |
| `puntuacion.js` | Inicio | Puntuación del día y su mensaje | `DashboardView` | P `test-puntuacion`, `test-correlaciones-metricas` | ✅ área Entreno con Fitness (Fase 1B); 🟡 cuenta los días de descanso (CX-17, de Josué) |
| `resumenesHub.js` | Inicio / hubs | Las dos líneas de cada tarjeta de módulo | `App.jsx` | P `test-inicio`, `test-modulos`, `test-correlaciones-metricas` | ✅ CX-12 y CX-14 corregidos (Fase 1B) |
| `centroDelDia.js`, `hoy.js`, `rachasHoy.js` | Inicio / Horario | Resumen y progreso del día, contexto temporal, mantenimiento de rachas | Inicio, Horario | P | ✅ |
| `salud.js` | Salud | Estado actual (peso, IMC, días), aviso de registro, evolución del peso, lesiones | `HealthView` | P `test-bienestar` | ✅ |
| `sueno.js` | Sueño | Ventana de 7 días con huecos, media, resumen de una noche (**no analiza**) | `SleepView` | P `test-sueno`, `test-sueno-grafica` | ✅ |
| `inteligenciaNutricion.js` | Nutrición | Confianza por días con datos, proteína, calorías, regularidad, patrones, «no registrado ≠ no consumido» | `NutritionView` | P | ✅ |
| `estadisticasNutricion.js`, `aguaNutricion.js`, `objetivosNutricion.js` | Nutrición | Promedios, cumplimiento, constancia, mejor/peor día, agua | `NutritionView` | P | ✅ |
| `historial.js`, `actividadEntrenamiento.js`, `progresion.js`, `progresoMuscular.js`, `motorRangos.js`, `resumenProgreso.js`, `objetivosFitness.js`, `colaClasificacion.js`, `planificacionSemanal.js`, `tuPlan.js` | Fitness | Historial, actividad y adherencia, progresión comparable, voto muscular, rangos y confianza, centro de progreso, objetivos, cola, semana | vistas de Fitness | P (muchas suites cada uno) | ✅ — **nadie fuera de Fitness los lee** (CX-12) |
| `motorRecomendaciones.js` + `recomendacionesPelo/Piel/Perfumes.js` | Imagen personal | Reglas con `requiere`, silencios, descartes, tono | `EstiloHombreView` | P (7 suites) | ✅ |
| `ideasEstilo.js`, `progresoEstilo.js`, `descubrir.js`, `avisosEstilo.js` | Imagen personal | Ideas, mi progreso, descubrir, avisos (apagados) | `EstiloHombreView` | P | ✅ |
| `insights.js`, `resumenPeriodico.js`, `iaEstilo.js`, `aprendizaje.js`, `contextual.js`, `recuperacion.js` | Imagen personal | Insights, resumen periódico, permiso/contexto de IA, aprendizaje, recomendaciones por ocasión, copias | ⚠️ **Ninguna pantalla** (solo auditorías) | P | 🟡 **construidos sin conectar** (CX-13) |
| `fechasAcademicas.js`, `estudiosApps.js`, `asignaturas.js`, `usosAsignatura.js` | Estudios | «Qué viene», apps, asignaturas, dónde se usa cada una | `EstudiosView`, Horario, Calendario | P | ✅ |
| `integracionPR.js`, `rachas.js`, `habitos.js`, `metasObjetivos.js`, `pomodoro.js`, `rutinas.js`, `tareas.js` | Productividad | Resumen del día, qué queda, cadenas, estadísticas por periodo, rachas derivadas | Productividad, Inicio, Organización | P | ✅ |
| `estadisticasPlan.js`, `agendaDia.js`, `calendarioMes.js`, `semana.js`, `calendarioIntegracion.js`, `avisosPlanificacion.js` | Calendario | Cumplimiento por día y periodo, carga, agenda, mes, semana, eventos derivados, avisos | `CalendarView`, Inicio | P | ✅ — no enseña Fitness |
| `analiticaHorario.js`, `automatizaciones.js`, `avisosHorario.js`, `mochila.js`, `horarioTop.js` | Horario | Informe y recomendaciones, disparadores, avisos, mochila | `HorarioView` | P | ✅ |
| `hucha.js` | Economía | Panel de la hucha, aportaciones, objetivo | `FinanceView` | P `test-hucha` | ✅ — ⚠️ el saldo y el mes se calculan **en la vista** |
| `armarioInteligencia.js` | Armario | Estadísticas de prendas y outfits, repeticiones, diversidad, recomendaciones | `ArmarioView` | P | ✅ |
| `bibliotecaGlobal.js` y las de cada mini-app | Biblioteca | Búsqueda, recientes, favoritos, progreso de un libro | `LibraryView` | P | ✅ (organización, no análisis) |
| `cumpleanos.js` | Mente | Próximo cumpleaños, textos, recurrencia | `CumpleanosView`, Calendario | P | ✅ |
| `indiceBusqueda.js` | Buscador | Pantallas y acciones (sin IA) | `ui.jsx` | P `test-buscador` | ✅ |

**Sin motor de análisis (las cuentas viven en la pantalla):** Fe, Diario, Negocio y Bienestar
digital. Economía, a medias (§ arriba).

## 3. Asistentes propuestos (📝)

Plantilla común. La Fase 1 dejó verificados los **datos y motores**; la Fase 2 añadirá resultados,
acciones y permisos.

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

| ID | Módulo | Datos (`app_data`) | Motores verificados (Fase 1) | Antes de construirlo | Exclusiones | Estado |
|---|---|---|---|---|---|---|
| ASIS-NUT | Nutrición | `nutricion` | `analizarNutricion`, `estadisticasNutricion`, `objetivoDeAgua` (V2, P) | Nada | Ni objetivos calóricos estrictos (regla 7) ni comidas ni peso fuera | 📝 |
| ASIS-FIT | Fitness | `fitness`, `saludFotos` | historial, actividad, progresión, rangos, centro de progreso (V2, P) | Nada | Fotos tras `fotos_privadas` (C-35) | 📝 |
| ASIS-SUE | Sueño | `sueno` | `ventanaDeDias` (V2); correlaciones (🟡) | **No hay motor de patrones de sueño**; CX-11 | — | 📝 |
| ASIS-EST | Estudios | `estudios` | `fechasAcademicas` (V2, P); `prediccionNotas` (sin suite) | CX-11 | — | 📝 |
| ASIS-PRO | Productividad | `productividad`, `objetivos`, `rachas` | `integracionPR` (V2, P), `rachas` (P) | Suite para `predicciones` | — | 📝 |
| ASIS-HOR | Horario | `horarioTop` | `analiticaHorario.informe` (V2, P), `automatizaciones` | Nada | Notas privadas de una actividad (HT F5/F9) | 📝 |
| ASIS-CAL | Calendario / Hoy | `calendario`, tareas | `estadisticasPlan` (V2, P), `centroDelDia`, `puntuacionDelDia` (V3, P) | CX-12, CX-14 | Relación solo con PIN desbloqueado | 📝 |
| ASIS-ECO | Economía | `economia` | `panelHucha` (V2, P); `prediccionAhorro` (sin suite) | Sacar el saldo de la vista a una función | — | 📝 |
| ASIS-IMG | Imagen personal | `estiloHombre`, `armario` | `motorRecomendaciones`, ideas, progreso (P); **6 librerías sin conectar** | CX-13: decidir si se integran (congelado a funciones nuevas) | Tipo de piel y sensibilidad nunca; permiso apagado por defecto | 📝 — el que más inteligencia tiene, la mitad sin conectar |
| ASIS-ARM | Armario | `armario` | `armarioInteligencia` (P) | Nada | — | 📝 |
| ASIS-SAL | Salud física | `salud`, `perfil` | `salud.estadoActual` (V2), `evolucionPeso`, `lesionesDe` | Revisar `prediccionPeso` contra la regla 7 | Nada de diagnósticos ni objetivos de peso | 📝 |
| ASIS-FE | Fe | `fe` | **Ninguno** | Crear motor | `AVISO_DOCTRINAL` obligatorio | 📝 |
| ASIS-DIA | Diario | `diario` | Correlaciones (🟡 CX-09, CX-11) | **P-06** | Privado: P-06 decide si entra | 📝 |
| ASIS-NEG | Negocio | `negocio` | **Ninguno** | Crear motor; P-08 decide si tiene asistente | — | 📝 *(añadido en la Fase 1)* |
| ASIS-BDG | Bienestar digital | `bienestar` | **Ninguno** (suma en la vista) | Crear motor; P-08 | — | 📝 *(añadido en la Fase 1)* |
| ASIS-BIB | Biblioteca | `biblioteca` | `bibliotecaGlobal` (búsqueda, recientes) | P-08 | — | 📝 *(añadido en la Fase 1)* |
| ASIS-REL | Relación | `relacion` | — | — | 🔒 Fuera de todo por defecto (regla 6) | 🔒 |
| ASIS-GEN | **Asistente general** (desde 🔍) | lo que autoricen P-06 y cada asistente | `indiceBusqueda.js` + los asistentes de módulo | P-01, P-06 | Solo cruza con permiso; contexto mínimo | 🟡 **parcial**: el buscador existe y ya manda preguntas libres a la IA generativa (se queda así, DA-09); la versión **por reglas** es 📝 |
