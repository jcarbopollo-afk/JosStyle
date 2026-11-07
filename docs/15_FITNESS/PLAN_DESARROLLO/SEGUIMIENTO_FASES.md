# SEGUIMIENTO DE FASES — FITNESS DE JOS STYLE

> **Qué es.** El estado de las ocho fases del plan de `PLAN_MAESTRO_FITNESS.md` (misma carpeta).
> Complementa a **`docs/FITNESS_DOCUMENTO_MAESTRO.md`**, que es la referencia principal del estado de
> Fitness (creado en la Fase 1). Cada actualización de fase se registra **en los dos**: aquí el
> resumen, el estado y la comprobación de criterios; allí el detalle técnico.
>
> **Regla de oro (§0.2 y prompt 1 §7):** ninguna fase se marca «Completada» sin haber comprobado **sus
> criterios de aceptación** en el código y en las pruebas. Una marca de este documento no demuestra
> nada por sí sola: «sigue» siempre lo vuelve a comprobar.

**Última actualización:** 2026-11-03 · Fase 1 completada · rama `claude/fitness-rediseno` (desde
`main`, `4881673`) · sin commit ni push.

## Estados permitidos

Nombres unificados el 2026-11-03 (decisión D-05):

| Estado | Significado |
|---|---|
| No iniciada | Nadie ha trabajado en ella. |
| En análisis | Se están leyendo el código, la documentación y las decisiones que la afectan. |
| En desarrollo | Se están cambiando código, pruebas o documentos de la fase. |
| En verificación | Hecho el trabajo; se están comprobando sus criterios de aceptación. |
| Completada | Todos sus criterios de aceptación comprobados en el código y en las pruebas. |
| Bloqueada | Falta una decisión o una dependencia que no se puede inventar; queda escrito cuál. |

## Tabla de fases

| # | Fase | Depende de | Estado | Actualizado |
|---|---|---|---|---|
| 1 | Contexto general, auditoría técnica y documento maestro | — | **Completada** | 2026-11-03 |
| 2 | Arquitectura técnica, modelo de datos y migración | 1 | **Completada** | 2026-11-03 |
| 3 | Biblioteca de rutinas y plantillas, y planificación | 1, 2 | **Completada** (ver PD-07) | 2026-11-03 |
| 4 | Cumplimiento, descansos y recuperación | 1, 2, 3 | **Completada** (ver PD-01, PD-02, PD-08 y PD-03) | 2026-11-04 |
| 5 | Progresión: Manual, Progresivo y Experto | 1–4 | **Completada** (PD-13 aplicada con su propuesta) | 2026-11-06 |
| 6 | Anotaciones por ejercicio | 1–5 | **Completada** | 2026-11-06 |
| 7 | Historial, calendario y estadísticas | 1–6 | **Completada** | 2026-11-06 |
| 8 | Integración global, auditoría final y verificación | 1–7 | **Completada** | 2026-11-06 |

**Siguiente fase:** la **7** (historial, calendario y estadísticas). **Autorización:** pendiente. La Fase 6 se hizo con
su orden expresa del 2026-11-06, que pide parar al terminarla y esperar sus instrucciones.

## Decisiones definitivas

Del 2026-11-03. El texto literal está en el **Anexo E** del plan, y cada una está incorporada al texto
de los prompts (pasajes marcados `[D-0X]`, con su redacción anterior en el Anexo D).

| Id | Decisión | Resuelve |
|---|---|---|
| D-01 | Imagen personal está terminado, separado y no se toca; Fitness trabaja en su propia rama. | CF-03 (en parte) |
| D-02 | Caducidad de la recuperación: dos entrenamientos realizados después de la fecha prevista; individual; los descansos no cuentan; sin ventana fija. | CF-05, CF-06, CF-07 |
| D-03 | «Completar entrenamiento» se conserva: simula todas las series, completa, sin inventar resultados, identificada, una sesión por fecha. La PR #2 no se fusiona ni se descarta automáticamente. | CF-04 (en parte) |
| D-04 | Conservar Fitness: reutilizar, no eliminar funciones útiles, no duplicar, no perder datos. | — |
| D-05 | Conflictos menores: estados unificados, prefijo de documentación, papelera general, «Experto», sesiones sin series, rutinas predeterminadas conservadas. | CF-02, CF-09, CF-10, CF-12, CF-13, CF-14 |

## Conflictos de la consolidación y cómo quedan

| Id | Conflicto | Estado | Cómo se resolvió |
|---|---|---|---|
| CF-01 | `docs/FITNESS_DOCUMENTO_MAESTRO.md` no existía. | ✅ Resuelto | Lo creó la Fase 1. |
| CF-02 | «En verificación» frente a «Pendiente de verificación». | ✅ Resuelto (D-05) | Un solo nombre: «En verificación». Cambiado en el prompt 1 §7. |
| CF-03 | Dónde viven los documentos y su permanencia. | 🟡 En parte | Viven en la rama `claude/fitness-rediseno`, desde `main`, en su propia copia (`/home/user/JosStyle-fitness`); se retiraron de la copia de Imagen personal. **Siguen sin commit**: solo existen en este entorno hasta que Josué autorice el commit y el push. |
| CF-04 | PR #2 («Completar entrenamiento») frente a una sesión por día. | 🟡 En parte (D-03) | La función se conserva con su comportamiento definitivo y respeta una sesión por fecha. Quedan PD-02 (fechas pasadas) y PD-04 (resto de la PR). |
| CF-05 | Prompt 4 §6.A («el último pendiente») frente a «se recomienda el más antiguo». | ✅ Resuelto (D-05) | Se informa de los recuperables y se recomienda el más antiguo, que con D-02 es siempre el más próximo a caducar. |
| CF-06 | La regla del 2026-11-02 frente a la de capacidad de los prompts. | ✅ Resuelto (D-02) | Las dos quedan sustituidas por D-02. Prompt 4 §7 reescrito y casos 3–6 y 9 adaptados; nuevos casos 12–14. |
| CF-07 | Duración de la ventana de recuperación sin definir. | ✅ Resuelto (D-02) | No hay ventana fija: caduca por número de entrenamientos. La ventana de 7 días es solo la vista de seguimiento. |
| CF-08 | Estados neutros de la F31/F32 frente a verde y rojo. | ✅ Resuelto | Manda lo último que pide Josué (prompts 2 §7 y 4 §11). Al implementarlo en la Fase 4 se anota en `docs/03` y se dan la vuelta las pruebas que fijan los textos neutros. |
| CF-09 | Rutinas y plantillas predeterminadas viven en el código. | ✅ Resuelto (D-05) | Se conservan con sus ids, días y ejercicios; prompts 2 §3.A y §12 y 3 §3 y §7 lo exigen. El cómo es tarea de la Fase 2. |
| CF-10 | Prefijo `15_` compartido con los asistentes. | ✅ Resuelto (D-05) | La ruta la fijó Josué y se mantiene; `docs/00_INDICE.md` distingue las dos carpetas. |
| CF-11 | Garantía de una sesión por fecha en el servidor. | ⏸ Dependencia | Necesita SQL de Josué → **PD-03**. |
| CF-12 | Política de borrado y retención. | ✅ Resuelto (D-05) | Se usa la papelera general (`src/lib/papelera.js`, 30 días por defecto, configurable). Prompt 2 §8 actualizado. |
| CF-13 | «Modo Dios griego» frente a «Experto». | ✅ Resuelto (D-05) | «Experto». |
| CF-14 | Sesiones sin series. | ✅ Resuelto (D-05) | Una sesión sin ninguna serie no es entrenamiento realizado (prompt 4, caso 11), salvo «Completar entrenamiento» (D-03). Las ya guardadas se conservan como históricas. |

## Decisiones pendientes

Detalle en el documento maestro, apartado 10, y en `docs/15_FITNESS/ARQUITECTURA_TECNICA.md` §17 (con una
propuesta para cada una, sin aplicar). Ninguna bloquea el comienzo de la Fase 3.

| Id | Qué falta | Antes de |
|---|---|---|
| PD-01 | Si una **sesión parcial** y una **sesión libre** cuentan como «entrenamiento realizado» para la caducidad. 🟡 **Lectura provisional aplicada en la Fase 4** (C-77): sí, las dos (parámetro `REALIZADO`). | Confirmación de Josué |
| PD-02 | «Completar entrenamiento» en **fechas pasadas**. 🟡 **Lectura provisional aplicada en la Fase 4** (C-77): hoy o un día pasado, contando en esa fecha. | Confirmación de Josué |
| PD-03 | **SQL** para garantizar una sesión por fecha en el servidor (lo ejecuta Josué). Preparado en `docs/15_FITNESS/sql/fitness_reserva_fechas.sql`, **sin ejecutar**; la Fase 4 lo garantiza solo en el cliente. | Autorización de Josué (Fase 8) |
| PD-04 | Qué hacer con los cambios de **chatbots** de la PR #2. | — (ajena a Fitness) |
| PD-05 | Separar las sesiones en una **tabla propia** (necesitaría SQL). Evaluado en la Fase 2: propuesta de umbral (fila > 2 MB o guardados > 2 s). | Ninguna fase |
| PD-06 | **Racha** de entrenamiento calculada desde el cumplimiento. ✅ **Definitiva en la Fase 8** (Josué, 2026-11-06; C-79): una sola fuente para la racha de Fitness y la global de entrenamiento (`diasDeActividadDeEntrenamiento`). | — |
| PD-08 | Si una sesión **parcial** cumple el día o lo deja también pendiente. 🟡 **Lectura provisional aplicada en la Fase 4** (C-77, el documento no traía propuesta): la fecha queda parcial (amarillo verdoso), no pendiente. | Confirmación de Josué |
| PD-09 | Cómo se ven las fechas **anteriores a la entrada en vigor** del sistema. ✅ **Aplicada en la Fase 7** (propuesta: «Sin seguimiento», sin colores y fuera de las estadísticas). | — |
| PD-10 | Si una sesión **descartada** libera la fecha. ✅ **Aplicada en la Fase 4** (propuesta: sí). | — |
| PD-11 | Si una serie planificada **omitida** hace la sesión parcial. ✅ **Aplicada en la Fase 4** (propuesta: sí). | — |
| PD-12 | Si un pendiente con la **plantilla en la papelera** deja de ser recuperable hasta restaurarla. ✅ **Aplicada en la Fase 4** (propuesta: sí; su caducidad sigue contando). | — |
| PD-13 | Modo de progresión **global o por plantilla**, y si una **plantilla duplicada** hereda el historial. ✅ **Aplicada en la Fase 5** (propuesta: global; no hereda). | — |
| PD-07 | **`main` no pasaba `verificar.sh` los lunes y martes** (H-25, chatbot de Sueño). ✅ **Resuelta en la Fase 4** con autorización de Josué: se aplicó el parche aislado (un solo archivo, `scripts/test-app-real.mjs`, solo esa comprobación; ni chatbots ni PR #2) y `verificar.sh` pasó entero un martes. | — |

---

## Fase 1 · Contexto general, auditoría técnica y documento maestro

- **Objetivo:** comprender el Fitness actual, contrastarlo con las decisiones y crear el documento maestro,
  sin implementar nada (prompt 1).
- **Dependencias:** ninguna.
- **Estado:** **Completada** (2026-11-03).
- **Tareas realizadas:**
  1. Rama independiente `claude/fitness-rediseno` desde `main` (`4881673`), en `/home/user/JosStyle-fitness`;
     la copia de Imagen personal no se ha tocado (sus 22 cambios, intactos).
  2. Decisiones D-01 a D-05 incorporadas a los ocho prompts (43 pasajes; originales en el Anexo D) y
     comprobación de que no queda ninguna contradicción en el texto vigente.
  3. Auditoría del código sobre `main` (reutilizando las dos auditorías del 2026-11-02, con los datos
     importantes vueltos a comprobar): estructura, modelo, persistencia, planes, plantillas, ejecución,
     progresión, notas, historial, dependencias y Supabase.
  4. Revisión de la PR #2 («Completar entrenamiento», commit `4531909`) y de sus incompatibilidades.
  5. `docs/FITNESS_DOCUMENTO_MAESTRO.md` con sus once apartados y dos anexos (riesgos e información
     necesaria).
  6. Entradas en `docs/00_INDICE.md` y en `CLAUDE.md` para que cualquier sesión encuentre el plan.
- **Archivos creados o modificados** (todo documentación, en la rama de Fitness):
  - `docs/FITNESS_DOCUMENTO_MAESTRO.md` (nuevo).
  - `docs/15_FITNESS/PLAN_DESARROLLO/PLAN_MAESTRO_FITNESS.md` y `SEGUIMIENTO_FASES.md` (traídos de la
    consolidación y actualizados).
  - `docs/00_INDICE.md` (+2 filas) y `CLAUDE.md` (+1 bloque).
- **Pruebas ejecutadas:** comprobación de integridad del plan (apartados, criterios, casos y escenarios
  de los ocho prompts; cada línea quitada está en el Anexo D); comprobaciones en memoria de los datos del
  maestro (catálogo, planes, migraciones); `bash scripts/verificar.sh` completo en la rama (resultado en el
  Registro de operaciones).
- **Resultado:** ver «Comprobación de criterios».
- **Problemas encontrados:** ninguno nuevo en el código (la Fase 1 no lo modifica). Las incidencias
  técnicas conocidas están en el apartado 10 del maestro.
- **Decisiones pendientes:** PD-01 a PD-06.
- **Fecha de actualización:** 2026-11-03.

### Comprobación de criterios (prompt 1 §6 y §9)

| Criterio | Comprobado |
|---|---|
| Documento maestro con objetivo, terminología, decisiones, arquitectura verificada, diferencias, ocho fases, estado, criterios, pruebas pendientes, incidencias y registro de cambios | ✅ Apartados 1–11 de `docs/FITNESS_DOCUMENTO_MAESTRO.md`. |
| Resumen de la arquitectura actual | ✅ Apartado 4 del maestro. |
| Qué está implementado y qué necesita cambios | ✅ Apartados 4 (con ✅/🟡/❌) y 5 del maestro. |
| Riesgos técnicos y posibles pérdidas de datos | ✅ Anexo 1 del maestro. |
| Índice del documento maestro | ✅ Al principio del maestro. |
| Información necesaria para las fases siguientes | ✅ Anexo 2 del maestro. |
| Sin modificar código, datos, ramas ajenas ni publicar | ✅ Solo documentación; sin commit, push ni despliegue; Imagen personal intacto. |
| Apartados pendientes identificados, sin inventar especificaciones | ✅ PD-01 a PD-06 e «Interpretaciones que se desprenden del texto» (apartado 3 del maestro). |
| `verificar.sh` sobre la rama (no es un criterio del prompt 1; se ejecutó como línea base) | ⚠️ **1 fallo heredado de `main`, ajeno a esta fase** (incidencia PD-07): compilación ✓, 247 suites ✓, renderizado 4144 ✓, Chromium 3890 ✓ y 1 ✗ (H-25, depende del día de la semana). La rama solo cambia documentación. |

## Fase 2 · Arquitectura técnica, modelo de datos y estrategia de migración

- **Objetivo:** diseñar (sin implementar) Rutina, Plantilla y Sesión, ciclos de 1 a 30 días, motor de
  cumplimiento con la caducidad D-02, Eliminados recientemente sobre la papelera general, progresión,
  anotaciones, escalabilidad y migración (prompt 2). Entrega `docs/15_FITNESS/ARQUITECTURA_TECNICA.md`.
- **Dependencias:** Fase 1 ✅.
- **Estado:** **Completada** (2026-11-03).
- **Tareas realizadas:**
  1. Lectura del maestro, del plan (prompts 2–6 y Anexo E) y del seguimiento.
  2. Comprobación en el código (solo lectura) de lo que condiciona el diseño: modelo y normalizadores de
     `fitness.js` y `entrenamiento.js`, planes y tramos (`planes.js`, `tuPlan.js`), finalización, carga y
     migraciones (`persistenciaFitness.js`, `App.jsx`), guardado (`supabase.js`), papelera (`papelera.js`),
     plantillas, constructor, progresión y la PR #2. Doce hallazgos (H-01 a H-12), entre ellos: ids de
     línea aleatorios en los planes; la carga borra los campos de sesión que no conoce; una versión vieja
     guarda encima de datos más nuevos; `fitness.planes` quitaría los días a una rutina.
  3. `docs/15_FITNESS/ARQUITECTURA_TECNICA.md`: 11 decisiones de arquitectura (AT-01 a AT-11), entidades y
     diagrama, modelo campo a campo, identificadores, ciclos, motor de cumplimiento y recuperación,
     estados, papelera, progresión, anotaciones, cuatro alternativas de almacenamiento con SQL propuesto
     (no ejecutado), migración en dos entregas, tabla comparativa, plan por fases, decisiones pendientes y
     riesgos.
  4. Documento maestro: apartado 5.1 (resumen de la arquitectura), estado, pruebas pendientes, PD-08 a
     PD-13, incidencias, riesgo 9, Anexo 2 y registro.
- **Archivos creados o modificados** (todo documentación, en la rama de Fitness):
  - `docs/15_FITNESS/ARQUITECTURA_TECNICA.md` (nuevo).
  - `docs/FITNESS_DOCUMENTO_MAESTRO.md` y este seguimiento.
- **Pruebas ejecutadas** (scripts de solo lectura en el directorio temporal, sin tocar el proyecto):
  1. **Anclaje del ciclo** (§7.6): para los 17 planes, cuatro fechas de activación y 400 días cada una,
     la posición actual (`posicionDelDia`) y la propuesta (días desde el lunes de `desde` mod 7)
     coinciden: **27 200 comprobaciones, 0 diferencias**.
  2. **Regla de caducidad** (§8.4): un modelo de la fórmula da en los ejemplos obligatorios 1 y 2 y en los
     casos 3, 4 y 5 exactamente el resultado de la tabla del documento (9 escenarios).
  3. Recuento del catálogo: 17 planes de 7 días, 63 días de entreno, 297 líneas, ningún día repetido,
     ningún id en el archivo fuente.
  4. `verificar.sh` **no se ha repetido**: ninguna prueba lee estos documentos y no hay cambios en
     `src/`, `scripts/` ni `supabase/` (comprobado con `git diff`), así que su resultado es el de la Fase 1
     (un fallo heredado de `main`, PD-07).
- **Resultado:** ver «Comprobación de criterios».
- **Problemas encontrados:** ninguno que impida la Fase 3. El diseño exige que la Fase 3 empiece por la
  guardia de versión (G0) y que la migración vaya en una entrega posterior.
- **Decisiones pendientes:** PD-01 a PD-13 (nuevas: PD-08 a PD-13), cada una con su propuesta sin aplicar.
- **Fecha de actualización:** 2026-11-03.

### Comprobación de criterios (prompt 2 §15)

| # | Criterio | Comprobado |
|---|---|---|
| 1 | Modelo de datos definido | ✅ §5 de la arquitectura: cada campo con tipo, obligatoriedad, función, validación y relación. |
| 2 | Tres entidades claramente separadas | ✅ §3 y §5.2–5.7: la rutina solo referencia plantillas; la plantilla no sabe de rutinas; la sesión lleva su fotografía y sus ids. |
| 3 | Relaciones documentadas | ✅ §4 (diagrama y tabla de relaciones, con qué pasa si el destino desaparece) y §6 (identificadores). |
| 4 | Ciclos de rutina definidos | ✅ §7: inicio, posición, duración, cálculo, reinicio, cambio de rutina, edición de duración y orden, compatibilidad (comprobada en 27 200 fechas). |
| 5 | Motor de cumplimiento y recuperación con sus reglas | ✅ §8: entradas, clasificación, pendientes, caducidad D-02 (individual, sin ventana, recuperaciones cuentan, descansos no), regla 9, opciones y consecuencias, una sesión por fecha; tabla con los ejemplos obligatorios comprobada con un modelo. |
| 6 | Estados de cumplimiento diferenciados | ✅ §9: estado de la sesión (ciclo de vida y grado) separado del estado de la fecha; los cinco colores del prompt más «sin seguimiento». |
| 7 | Eliminados recientemente diseñado | ✅ §10: papelera general con puerta de Fitness; rutinas, predeterminadas, plantilla en la activa (días a descanso), huecos ocupados y rutina eliminada. |
| 8 | Progresión contemplada | ✅ §11: tres modos, interruptor por línea, comparación por plantilla y línea, propuesta separada de lo hecho, medias repeticiones sin redondeo. |
| 9 | Anotaciones contempladas | ✅ §12: tres niveles, nota anterior e historial por `linea.id`, conservadas al editar o borrar la plantilla. |
| 10 | Historial y escalabilidad evaluados | ✅ §13: volumen, cuatro alternativas con los ocho criterios del prompt, recomendación y SQL propuesto (no ejecutado). |
| 11 | Migración diseñada sin pérdida de datos | ✅ §14: versionado, guardia previa, migración aditiva e idempotente, validación, copia, cuarentena, recuperación ante errores y compatibilidad; ninguna sesión se reescribe. |
| 12 | Decisiones pendientes identificadas | ✅ §17: PD-01 a PD-13, ninguna dada por resuelta. |
| 13 | Documento maestro actualizado | ✅ Apartados 5.1, 7, 9, 10, 11 y anexos del maestro. |
| — | Sin código, datos, SQL ni Supabase; sin commit, push ni despliegue | ✅ Solo documentación; `git diff` vacío en `src/`, `scripts/` y `supabase/`. |

## Fase 3 · Biblioteca de rutinas, plantillas y planificación

- **Objetivo:** biblioteca de rutinas (1–30 días, todos los días configurados, una activa, predeterminadas
  conservadas), biblioteca de plantillas con marca de «en uso», borrado que pasa días a descanso,
  Eliminados recientemente (prompt 3).
- **Dependencias:** Fases 1 y 2 ✅.
- **Estado:** **Completada** (2026-11-03), con la salvedad de PD-07 (fallo ajeno de `main`, solución aislada
  pendiente de revisión).
- **Comprobación previa (PD-07):** PR #2 abierta y sin fusionar; `main` en `4881673`. H-25 reproducido y
  diagnosticado en una copia aparte de `main` (`/home/user/JosStyle-h25`): falla la prueba, no el asistente.
  Parche aislado preparado y validado allí; **no aplicado** en la rama de Fitness.
- **Tareas realizadas:** ver el apartado 5.2 del documento maestro (funcionalidades, archivos, modelo de datos,
  problemas y limitaciones) y `ARQUITECTURA_TECNICA.md` §19 (ajustes AJ-01 a AJ-09).
- **Pruebas ejecutadas:**
  1. `scripts/test-rutinas-ciclicas.mjs` (nueva, en `verificar.sh`): **119 comprobaciones**, todas en verde.
  2. Banco de renderizado: **4188 casos** (+44: el editor nuevo, de 7 y 30 días; la elección de un día; la
     tarjeta de rutina; la confirmación de borrado; la biblioteca con rutinas suyas; las plantillas con «en
     uso»; la ficha de una predeterminada con sus acciones; el aviso de solo lectura).
  3. Recorrido de Chromium: sección nueva **«FIT 3/8»** (39 comprobaciones, verde a la primera en el
     recorrido parcial) y las comprobaciones viejas que pulsaban «Usar este plan», «Cambiar plan», «Explorar
     planes», «Buscar un plan»… actualizadas a los textos nuevos (se dieron la vuelta, no se borraron).
  4. Suites existentes que la fase dejó viejas, actualizadas con su motivo: `test-acabado-fitness`
     (vocabulario), `test-auditoria-final` (decimotercera exclusión a mano), `test-feedback-fitness`
     (guardia delante de `saveData`), `test-persistencia-fitness` (seis listas en cuarentena), `test-planes`,
     `test-tu-plan`, `test-planificacion-semanal` (textos «rutina») e `integracionFitness.js` (15 campos
     guardados).
  5. `verificar.sh` completo: ver «Comprobación de criterios», fila 12.
- **Problemas encontrados:** ver el apartado 5.2 del maestro.
- **Decisiones pendientes:** ninguna nueva. PD-07 (revisión del parche). Para la Fase 4: PD-01, PD-02, PD-03,
  PD-08, PD-10, PD-11, PD-12, y la migración M1 (AJ-01).
- **Fecha de actualización:** 2026-11-03.

### Comprobación de criterios (prompt 3 §17)

| # | Criterio | Comprobado |
|---|---|---|
| 1 | La biblioteca de rutinas funciona | ✅ Crear, editar (también renombrar), duplicar, eliminar, recuperar y activar, en Node (`test-rutinas-ciclicas` §2–§10) y en Chromium («FIT 3/8»). Las 17 predeterminadas, con sus ids (§1). |
| 2 | Las rutinas admiten entre 1 y 30 días | ✅ 1, 7 y 30 sí; 0, 31 y no enteros, rechazados y explicados (§2); el editor de 30 días renderiza. |
| 3 | Los ciclos se repiten correctamente | ✅ §4 (Push · D · Pull · Push…; una rutina de 1 día; posición de 30 días; nada antes del inicio); las predeterminadas, por semana como siempre; §7 (editar la activa conserva el día de hoy y el pasado). |
| 4 | Todos los días deben configurarse | ✅ Nacen sin decidir; no se guarda con alguno sin decidir y se dice cuál (§2 y Chromium). |
| 5 | Se pueden asignar y repetir plantillas | ✅ §3 y Chromium (la misma plantilla en los días 1 y 3); una por día. |
| 6 | La biblioteca de plantillas funciona | ✅ Crear y editar (constructor), duplicar (también predeterminadas, §11), eliminar y recuperar; «Tuyas» y «Predeterminadas». |
| 7 | Se identifican las plantillas utilizadas | ✅ «En tu rutina activa» / «En N rutinas» / sin marca (§8) y «Dónde se usa» en la ficha; Chromium. |
| 8 | Eliminar una plantilla activa convierte sus días en descanso | ✅ §9 y Chromium, con confirmación específica; las rutinas no activas no se tocan. |
| 9 | Eliminados recientemente permite recuperar elementos | ✅ Rutinas (también predeterminadas) y plantillas, con la papelera general; recuperar sin pisar asignaciones posteriores y sin relaciones rotas (§9–§10 y Chromium desde Ajustes). |
| 10 | Se conserva el historial | ✅ Ninguna operación toca las sesiones (§5, §9, §12); los tramos guardan la estructura de antes. |
| 11 | Se puede cambiar de rutina sin perder progreso | ✅ §5 (sesiones intactas, tramo con su estructura, la anterior sigue en la biblioteca). |
| 12 | Las pruebas están superadas | ✅ `verificar.sh` completo: todo en verde salvo **H-25 (PD-07), ajeno a la fase** — Chromium 3930 ✓ / 1 ✗, renderizado 4188 ✓, `test-rutinas-ciclicas` 119 ✓, sección «FIT 3/8» 40 ✓. |
| 13 | La documentación maestra está actualizada | ✅ Apartados 5, 5.2, 7, 9, 10 y 11 del maestro; `ARQUITECTURA_TECNICA.md` §19. |

## Fase 4 · Motor de cumplimiento, descansos y recuperación

- **Objetivo:** pendientes y recuperación con la caducidad D-02, una sesión por fecha, sesiones parciales y
  sin series, «Completar entrenamiento» (D-03), estados para el calendario; casos 1–14 (prompt 4).
- **Dependencias:** Fases 1, 2 y 3 ✅.
- **Estado:** **Completada** (2026-11-03), con tres lecturas provisionales que Josué tiene que confirmar
  (PD-01, PD-02 y PD-08; C-77) y la garantía de servidor pendiente de su SQL (PD-03).
- **Comprobación previa (PD-07):** con su autorización, se revisó el diff del parche aislado (un solo archivo,
  `scripts/test-app-real.mjs`, solo la comprobación H-25; ni chatbots ni PR #2), se aplicó y `verificar.sh`
  pasó entero (ver el Registro). PD-07 queda resuelta.
- **Tareas realizadas:** ver el apartado 5.3 del documento maestro (motor, «Completar entrenamiento», interfaz,
  migración M1, modelo, archivos, garantías y limitaciones) y `ARQUITECTURA_TECNICA.md` §20 (AJ-10 a AJ-19).
- **Pruebas ejecutadas:**
  1. `scripts/test-cumplimiento-fitness.mjs` (nueva, en `verificar.sh`): **157 comprobaciones**, todas en verde,
     con fechas fijas (pasan igual cualquier día).
  2. Banco de renderizado: **4220 casos** (+32: Tu Plan con pendientes, la ventana de 7 días, la tarjeta de
     recuperación, el aviso de fecha ocupada en sus dos formas, «Completar entrenamiento» con y sin opciones y la
     marca del historial).
  3. Recorrido de Chromium: sección nueva **«FIT 4/8»** (35 comprobaciones) y las comprobaciones viejas que la regla
     de una sesión por día dejó viejas, con su escenario ajustado y no aflojado: la semana de la F6 y la F8 (la
     ventana también nombra los días), el ancho de la pantalla de series de la F7 (ahora comprueba primero que
     «Empezar» se niega y mide sobre uno empezado ayer) y la repetición del apartado 49 de la F45 (se niega el
     mismo día y se suma al día siguiente).
  4. Suites existentes actualizadas con su motivo: `test-persistencia-fitness` (versión 2 y la M1),
     `test-auditoria-final` (decimocuarta exclusión a mano: `migracionFitnessV2`), `test-feedback-fitness` (la
     `key` del área) e `integracionFitness.js` (16 campos guardados).
  5. `verificar.sh` completo: **todo en verde** (EXIT 0): Chromium **3969 ✓ / 0 ✗**, renderizado 4220 ✓.
- **Problemas encontrados:** la regla de una sesión por día dejó viejas algunas secciones del recorrido que
  empezaban varios entrenamientos el mismo día (se ajustó su escenario, no la regla); una plantilla empezada desde
  «Tus plantillas» el día que toca apuntaba a la plantilla y no a la rutina (corregido, con prueba); Fitness no puede
  importar `useHoyISO` de Nutrición (FIT F44): `hoy` llega de `App.jsx`.
- **Decisiones pendientes:** confirmar PD-01, PD-02 y PD-08 (provisionales); PD-03 (SQL de la reserva de fechas,
  preparado y sin ejecutar).
- **Fecha de actualización:** 2026-11-03.

### Comprobación de criterios (prompt 4 §16)

| # | Criterio | Comprobado |
|---|---|---|
| 1 | Los pendientes se generan correctamente | ✅ Solo días de entreno terminados desde `cumplimientoDesde`, con su identidad (rutina, día, plantilla, fecha); un descanso nunca; ni antes de la entrada en vigor (`test-cumplimiento-fitness`, «Generación de pendientes» y «Qué tocaba cada día»). |
| 2 | La ventana de seguimiento de siete días funciona | ✅ Siete días naturales hasta hoy, sin futuros incumplidos, «Hoy» durante el día y pendiente al día siguiente (Node) y en Chromium («Últimos 7 días» con sus estados y su motivo al tocar). |
| 3 | Los descansos se contabilizan correctamente | ✅ Respetado (verde) sin sesión; sacrificado (rojo) con una recuperación o una libre; nunca pendiente; no cuentan para la caducidad (casos 1, 6 y 7). |
| 4 | Se pueden recuperar entrenamientos en días de descanso | ✅ Casos 1, 3 y 4 (Node); recomendación del más antiguo y aviso de que descansar es válido. |
| 5 | Se pueden recuperar sustituyendo el entrenamiento previsto | ✅ Caso 2 (Node) y Chromium (recuperar el segundo en un día de entreno; el de hoy queda pendiente al terminar el día). |
| 6 | La caducidad respeta la regla de los dos entrenamientos posteriores | ✅ Ejemplos obligatorios 1 y 2, casos 12 y 13, «la caducidad cuenta entrenamientos, no días» y una secuencia de 70 días donde cada pendiente caduca si y solo si hay dos realizados después. |
| 7 | Las elecciones muestran sus consecuencias | ✅ `consecuenciasDeElegir` (mismo motor sobre una copia): qué caducaría, descanso sacrificado, el de hoy pendiente; casos 4 y 5 (Node) y Chromium (antes de confirmar). |
| 8 | Los entrenamientos caducados se identifican correctamente | ✅ «Perdido» en rojo con las dos fechas que lo hicieron caducar; listados como «Ya no se pueden recuperar». |
| 9 | Los cambios de rutina no mezclan pendientes | ✅ Caso 9: bloqueados con «otra rutina» mientras no es la activa; vuelven al reactivarla si no caducaron; su contador sigue avanzando. |
| 10 | Las sesiones parciales se distinguen de las completas | ✅ Grado completa / parcial / vacía (PD-11: omitida = no hecha); parcial en amarillo verdoso (caso 10, PD-08); vacía no cuenta (caso 11). |
| 11 | No se permiten sesiones duplicadas por fecha | ✅ **En el cliente**: toda entrada pasa por `prepararSesionNueva` (Node, caso 8, y Chromium); una descartada libera la fecha (PD-10). **En el servidor no** (PD-03): si llegan dos, ninguna se borra y la segunda queda en conflicto. |
| 12 | El calendario puede obtener estados coherentes | ✅ `estadoDeFecha` da estado, color y motivo para cualquier fecha; la ventana y la tarjeta solo pintan lo que da el motor; un barrido comprueba que ninguna pantalla reescribe la regla. |
| 13 | «Completar entrenamiento» completa, sin inventar y sin duplicar | ✅ Todas las series hechas con `hecho` vacío, sin duración, `completadaCon: 'completar'`, grado completa, cuenta como realizado, y no duplica la fecha (Node y Chromium). |
| 14 | Las pruebas están superadas | ✅ `verificar.sh` completo en verde (EXIT 0): Chromium 3969 ✓ / 0 ✗, renderizado 4220 ✓, `test-cumplimiento-fitness` 157 ✓, sección «FIT 4/8» 35 ✓. |
| 15 | La documentación maestra está actualizada | ✅ Apartados 5, 5.3, 7, 9, 10, 11 y anexos del maestro; `ARQUITECTURA_TECNICA.md` §20; `docs/03` (C-77). |

## Fase 5 · Progresión: Manual, Progresivo y Experto

- **Objetivo:** tres modos, interruptor por ejercicio, comparación por plantilla y por línea, repeticiones
  enteras o de media unidad sin redondeo, `plan` separado de `hecho` (prompt 5).
- **Dependencias:** Fases 1–4 ✅.
- **Autorización:** el «Síguela» de Josué del 2026-11-06, tras cerrar la Fase 4 (protocolo «sigue»).
- **Estado:** **Completada** (2026-11-06). PD-13 aplicada con su propuesta (modo global; la copia de una plantilla
  empieza su propio historial) y un ajuste sobre la arquitectura que conviene que vea Josué: AJ-20 (la progresión
  nace activada en cada ejercicio).
- **Tareas realizadas:** ver el apartado 5.4 del documento maestro (motor, regla de cálculo, medias repeticiones,
  interfaz, M2, modelo, archivos y limitaciones) y `ARQUITECTURA_TECNICA.md` §21 (AJ-20 a AJ-25).
- **Pruebas ejecutadas:**
  1. `scripts/test-progresion-fitness.mjs` (nueva, en `verificar.sh`): **99 comprobaciones**, todas en verde, con
     fechas fijas.
  2. Banco de renderizado: **4260 casos** (+40, doce piezas en sus variantes: el selector en Manual y en Experto, el interruptor encendido y
     apagado, la frase de la propuesta con mejora y por tiempo, «Has progresado», la tabla de series con propuestas y
     con medias, y el editor de línea en Experto con 8,5 y la progresión apagada).
  3. Recorrido de Chromium: sección nueva **«FIT 5/8»** (27 comprobaciones): Manual por defecto, elegir Experto y que
     se guarde, empezar la plantilla y ver la propuesta de fondo en cada serie (10,5 · 9,5 · 8,5) separada de lo
     hecho, 8,2 rechazado sin guardar ni redondear, 11 por encima («Has progresado»), 8,5 guardado tal cual, la frase
     amable al quedarse por debajo, el ancho en un iPhone pequeño, el historial anterior intacto y volver a Manual.
  4. Suites existentes que la fase deja viejas, dadas la vuelta y no borradas: `test-entrenamiento` (10,7 ya no se
     redondea a 11: se rechaza, y 10,5 vale), `test-cumplimiento-fitness` y `test-persistencia-fitness` (versión 3
     y la M2), `test-auditoria-final` (decimoquinta exclusión a mano: `migracionFitnessV3`), la sección «FIT 4/8»
     del recorrido (lo sembrado en la 2 sube a la 3 al cargar) e `integracionFitness.js` (17 campos guardados).
  5. `verificar.sh` completo en verde (EXIT 0): Chromium 3994 ✓ / 0 ✗, renderizado 4260 ✓.
- **Problemas encontrados:** las repeticiones se redondeaban en seis capas (`Math.round`), así que 8,5 llegaba como 9
  a la sesión, a la plantilla y a la progresión; la regla de las hojas del árbol de imports (FIT F44) no deja que un
  archivo nuevo de utilidades importe `decimal`, así que la regla de las repeticiones vive en `numerosFitness.js`;
  una línea sustituida durante una sesión conserva su `linea.id`, así que la comparación exige también el mismo
  ejercicio.
- **Decisiones pendientes:** ninguna nueva. Lo que Josué puede querer cambiar está escrito: PD-13 (global) y AJ-20
  (activada por defecto).
- **Fecha de actualización:** 2026-11-06.

### Comprobación de criterios (prompt 5 §17)

| # | Criterio | Comprobado |
|---|---|---|
| 1 | Existen los tres modos | ✅ `MODOS_PROGRESION` (Manual, Progresivo, Experto) en `preferencias.progresion`, con su normalizador; selector en Tu Plan (Node, renderizado y Chromium). |
| 2 | Manual no propone progresión | ✅ `conPropuestas` devuelve la sesión tal cual; ni propuesta, ni flecha, ni interruptor (Node §3 y Chromium). |
| 3 | Progresivo ofrece recomendaciones no obligatorias | ✅ Repite lo de la última vez y sube una repetición en una sola serie, con datos suficientes; mantiene si faltan series o si bajó; la propuesta va de fondo y él escribe lo suyo (Node §3, §7, §8). |
| 4 | Experto calcula objetivos por serie | ✅ Media repetición sobre cada serie, sin pasar del máximo del rango; una serie sin referencia, sin propuesta (Node §3, §7 y Chromium 10,5 · 9,5 · 8,5). |
| 5 | La progresión se puede desactivar por ejercicio | ✅ `config.progresion` en el editor de la línea; se conserva al editar y duplicar; la sesión fotografía su estado (Node §4). |
| 6 | Las comparaciones se realizan dentro de la misma plantilla | ✅ Push A y Push B independientes; una copia no hereda; otra línea no hereda (Node §5 y §7). |
| 7 | Los ejercicios mantienen identidades estables | ✅ `linea.id` en la foto de la sesión; reordenar, renombrar y cambiar series no rompen la correspondencia; las predeterminadas llevan su id escrito; sesiones antiguas solo si es inequívoco (Node §5, §6, §11). |
| 8 | Se admiten repeticiones enteras y medias | ✅ Plantilla, directo, motor, carga, historial y progresión (Node §1, §2 y Chromium 8,5). |
| 9 | Se rechazan otros decimales sin redondeo silencioso | ✅ 8,2 se rechaza con su frase en el directo y en el editor, no se escribe desde el motor, invalida una plantilla importada y no se redondea al cargar (Node §1, §2 y Chromium). |
| 10 | Las recomendaciones no modifican los resultados reales | ✅ `plan.propuesta` aparte; `hecho` intacto; propuesto 10,5 y hecho 8 se guardan así; la progresión lee lo hecho (Node §10 y Chromium). |
| 11 | Los tipos de ejercicio se tratan correctamente | ✅ Carga externa, peso corporal, lastre y tiempo, cada uno con su unidad; por tiempo, referencia sin subir (AJ-21) (Node §8). |
| 12 | La interfaz es clara y no interrumpe el entrenamiento | ✅ Propuesta de fondo en el mismo campo, una frase, marca discreta, la frase amable una vez; el flujo del directo no cambia; cabe en 375 px (Chromium y renderizado). |
| 13 | El historial permanece íntegro | ✅ Calcular propuestas no toca ninguna sesión; la M2 no toca ninguna; la sesión anterior del recorrido queda igual (Node §10, §12 y Chromium). |
| 14 | Las pruebas están superadas | ✅ `verificar.sh` completo en verde (EXIT 0): Chromium 3994 ✓ / 0 ✗, renderizado 4260 ✓; `test-progresion-fitness` 99 ✓; «FIT 5/8» 26 ✓. |
| 15 | La documentación maestra está actualizada | ✅ Apartados 5, 5.4, 7, 9, 10, 11 y Anexo 2 del maestro; `ARQUITECTURA_TECNICA.md` §21; `docs/03` (C-78). |

## Fase 6 · Anotaciones por ejercicio

- **Objetivo:** anotación por ejercicio durante la sesión, nota de la última vez de esa línea, consulta de las
  antiguas, historial, separación de las tres notas y compatibilidad con lo de antes (prompt 6).
- **Dependencias:** Fases 1–5 ✅.
- **Autorización:** orden expresa de Josué del 2026-11-06 («Fitness — ejecución Fase 6/8»).
- **Estado:** **Completada** (2026-11-06). Sin decisiones pendientes nuevas.
- **Tareas realizadas:** ver el apartado 5.5 del documento maestro (modelo, niveles de nota, lecturas, interfaz,
  guardado, migración, archivos y limitaciones) y `ARQUITECTURA_TECNICA.md` §22 (AJ-26 a AJ-29).
- **Pruebas ejecutadas:**
  1. `scripts/test-anotaciones-fitness.mjs` (nueva, en `verificar.sh`): **58 comprobaciones**, todas en verde, con fechas
     fijas.
  2. Banco de renderizado: **4272 casos** (+12, tres piezas en sus variantes: el directo con la indicación, la nota anterior y las antiguas, y sin nada; un
     ejercicio del historial con sus notas anteriores).
  3. Recorrido de Chromium: sección nueva **«FIT 6/8»** (22 comprobaciones): indicación aparte, nota anterior de
     cada línea con su fecha, ⋯ en orden y solo de esa línea, sin la copia ni la otra línea, nota de hoy vacía, guardado
     solo, guardado al interrumpir, sesiones anteriores y plantilla intactas, recargar, iPhone pequeño, ni un error.
  4. `verificar.sh` completo en verde (EXIT 0): Chromium 4016 ✓ / 0 ✗, renderizado 4272 ✓.
- **Problemas encontrados:** la nota de la línea de la plantilla se editaba y no se veía en ninguna parte (ahora es
  la indicación, aparte); la correspondencia con lo de antes estaba escrita solo para la progresión (ahora es una
  función compartida, sin cambiar su resultado: `test-progresion-fitness` sigue 99/99).
- **Decisiones pendientes:** ninguna nueva.
- **Fecha de actualización:** 2026-11-06.

### Comprobación de criterios (prompt 6 §15)

| # | Criterio | Comprobado |
|---|---|---|
| 1 | Cada ejercicio permite añadir anotaciones | ✅ El botón «Notas» de cada ejercicio, con guardado automático; un campo por ejercicio (Node §1 y Chromium). |
| 2 | Las anotaciones quedan vinculadas a su ejecución | ✅ Viven en `ejercicio.notas` de la foto de la sesión, con su sesión, fecha, plantilla, línea y ejercicio (Node §1, §3). |
| 3 | Se guardan correctamente | ✅ Sin finalizar, al cerrar, al interrumpir y al recargar; sin duplicados por pulsación; al finalizar se conservan (Node §1, §2 y Chromium). |
| 4 | Se muestra la nota de la ejecución anterior | ✅ La de la última vez de esa línea con nota, con su fecha (Node §3 y Chromium). |
| 5 | La nueva anotación empieza vacía | ✅ No se copia nada al empezar (Node §3 y Chromium). |
| 6 | Se pueden consultar notas más antiguas | ✅ ⋯ en el directo y en el historial, de la más reciente a la más antigua (Node §3, §7 y Chromium). |
| 7 | El historial muestra las anotaciones correctas | ✅ La de esa sesión y, aparte, solo las anteriores a su fecha; con la plantilla eliminada también (Node §2, §4, §7). |
| 8 | Las plantillas duplicadas no mezclan historiales | ✅ La copia no hereda y la original conserva las suyas (Node §4 y Chromium). |
| 9 | Las líneas repetidas se distinguen correctamente | ✅ Por `linea.id`, también reordenadas (Node §5 y Chromium). |
| 10 | Las anotaciones antiguas se conservan | ✅ Escribir la de hoy no toca ninguna; M1 y M2 no las mueven; las de sesiones sin `linea.id` ambiguas se quedan en su sesión (Node §3, §6, §9). |
| 11 | No se confunden notas de plantilla y notas históricas | ✅ Indicación aparte en `linea.indicacion`, nunca en `ejercicio.notas` ni en el historial; la nota general, también aparte (Node §2, §8 y Chromium). |
| 12 | La interfaz sigue siendo compacta | ✅ Dos líneas de texto solo si hay algo, ⋯ voluntario en un desplegable, el mismo botón «Notas»; cabe en 375 px (Chromium y renderizado). |
| 13 | Las pruebas están superadas | ✅ `verificar.sh` completo en verde (EXIT 0): Chromium 4016 ✓ / 0 ✗, renderizado 4272 ✓; `test-anotaciones-fitness` 58 ✓; «FIT 6/8» 22 ✓. |
| 14 | La documentación maestra está actualizada | ✅ Apartados 4.6, 5, 5.5, 7, 9 y 11 del maestro; `ARQUITECTURA_TECNICA.md` §22. |

## Fase 7 · Historial, calendario de cumplimiento y estadísticas

- **Objetivo:** calendario principal con los estados del motor, detalle de fecha, historial y evolución por
  plantilla, estadísticas de disciplina con fórmula documentada, periodos móviles, escalabilidad
  (prompt 7).
- **Dependencias:** Fases 1–6 ✅.
- **Autorización:** orden expresa de Josué del 2026-11-06 («Fitness — ejecución Fase 7/8»).
- **Estado:** **Completada** (2026-11-06). PD-06 con lectura provisional (C-79); PD-09 aplicada con su propuesta.
- **Tareas realizadas:** ver el apartado 5.6 del documento maestro (estructura, calendario, detalle, historial por
  plantilla, evolución, fórmula, indicadores, periodos, almacenamiento, compatibilidad, archivos y limitaciones) y
  `ARQUITECTURA_TECNICA.md` §23 (AJ-30 a AJ-33).
- **Pruebas ejecutadas:**
  1. `scripts/test-disciplina-fitness.mjs` (nueva, en `verificar.sh`): **81 comprobaciones**, todas en verde, con fechas
     fijas.
  2. Banco de renderizado: **4324 casos** (+52: el resumen de disciplina en cuatro periodos, el calendario con y sin
     seguimiento, el detalle de un día en cuatro situaciones, la tabla serie a serie con y sin datos y el Historial
     con la disciplina).
  3. Recorrido de Chromium: sección nueva **«FIT 7/8»** (27 comprobaciones): porcentaje y regularidad, indicadores y
     racha, la fórmula en pantalla, cambio de periodo, fechas elegidas a mano, calendario con hoy, pendiente,
     sacrificado (con lo que recuperó), recuperado y parcial (navegando al mes anterior si toca), detalle de una
     recuperación que abre su entrenamiento y vuelve donde estaba, 375 y 320 px sin salirse, filtro por plantilla con el
     estado de cada ejecución, ni un error y sin escribir nada.
  4. `verificar.sh` completo en verde (EXIT 0): Chromium 4042 ✓ / 0 ✗, renderizado 4324 ✓.
- **Problemas encontrados:** el botón «Mes anterior» del calendario se llamaba igual que el periodo «Mes anterior» (dos
  botones con el mismo nombre en la misma pantalla): ahora es «Ver el mes anterior». La comprobación de la F4 de motion
  fijaba la clave exacta de la gráfica: se amplió para admitir la plantilla sin dejar de exigir periodo y métrica.
- **Decisiones pendientes:** PD-06 (provisional, C-79); el calendario neutro de Progreso (F31) convive con el nuevo, y
  unificarlos es de la Fase 8.
- **Fecha de actualización:** 2026-11-06.

### Comprobación de criterios (prompt 7 §17)

| # | Criterio | Comprobado |
|---|---|---|
| 1 | El calendario refleja correctamente el cumplimiento | ✅ Cada celda es `estadoDeFecha` (color e icono del motor); la ventana de 7 días y el calendario dicen lo mismo de cada día; futuro sin evaluar y lo anterior, sin seguimiento (Node §2–§3 y Chromium). |
| 2 | El detalle de cada fecha es completo y fiable | ✅ Estado y motivo, qué tocaba (plantilla y rutina), quién lo recuperó, sesiones con su tipo, parcial y «Completar»; abre el detalle completo de siempre; sin registros no inventa nada (Node §4, renderizado y Chromium). |
| 3 | Existe historial por plantilla | ✅ Filtro «Plantilla» con orden inverso, duplicadas separadas y eliminadas consultables (Node §7 y Chromium). |
| 4 | La evolución por ejercicio funciona | ✅ Gráfica por métrica y periodo, mejores, comparación y tabla serie a serie (Node §7, renderizado). |
| 5 | Las gráficas distinguen plantillas cuando corresponde | ✅ Selector con dos o más plantillas; la gráfica de una solo dibuja lo suyo (Node §7). |
| 6 | Las estadísticas priorizan la disciplina | ✅ La disciplina abre el Historial, antes del calendario y de la lista; el rendimiento queda en Progreso. |
| 7 | Los porcentajes utilizan una fórmula coherente | ✅ `FORMULA_CUMPLIMIENTO`, visible en pantalla; pendientes, hoy, futuro y sin seguimiento fuera (Node §2 y Chromium). |
| 8 | Los periodos temporales funcionan correctamente | ✅ 7 y 30 días móviles, mes actual y anterior (enero → diciembre, bisiestos), elegir fechas (Node §1 y Chromium). |
| 9 | Las rachas respetan los días de descanso | ✅ Un descanso respetado suma; uno sacrificado corta; pendiente y hoy, neutros (Node §5). |
| 10 | Las recuperaciones no duplican resultados | ✅ Cuentan una vez, en su fecha prevista; el día en que se hicieron es sacrificado o su propio entreno (Node §2 y Chromium). |
| 11 | Las sesiones históricas permanecen intactas | ✅ Ninguna lectura escribe (Node §6 y Chromium: las sesiones siguen idénticas). |
| 12 | El sistema puede escalar a grandes historiales | ✅ 1000 sesiones: 30 días y un mes en mucho menos de 4 s, y otro mes reutiliza el análisis (Node §6); lista paginada. |
| 13 | La interfaz móvil funciona correctamente | ✅ 375 y 320 px sin desbordar; celdas de 44 px; tabla serie a serie con scroll lateral propio (Chromium). |
| 14 | Las pruebas están superadas | ✅ `verificar.sh` completo en verde (EXIT 0): Chromium 4042 ✓ / 0 ✗, renderizado 4324 ✓; `test-disciplina-fitness` 81 ✓; «FIT 7/8» 27 ✓. Ninguna prueba eliminada; una ampliada (`test-motion-f4`). |
| 15 | La documentación maestra está actualizada | ✅ Apartados 4.7, 5.6, 7, 9, 10 y 11 del maestro; `ARQUITECTURA_TECNICA.md` §23; C-79 en `docs/03`; `CLAUDE.md`. |

**Siguiente fase:** 8 · Integración global, auditoría final y verificación completa — empieza solo con su orden.

## Fase 8 · Integración global, auditoría final y verificación completa

- **Objetivo:** integrar las fases 1–7 (calendario unificado y racha única incluidos), auditar datos, compatibilidad y
  experiencia móvil, y verificar todo junto (prompt 8 del plan y orden de Josué del 2026-11-06).
- **Dependencias:** Fases 1–7 ✅.
- **Autorización:** orden expresa de Josué del 2026-11-06 («Prompt 8/8 — Fitness: integración y verificación final»),
  que además aprobó la definición de las rachas (PD-06).
- **Estado:** **Completada** (2026-11-06) en código y pruebas. Pendiente de autorización externa: PD-03 (SQL del servidor)
  y la prueba en un iPhone de verdad (R1).
- **Tareas realizadas:** apartado 5.7 y §12 del documento maestro; `ARQUITECTURA_TECNICA.md` §24 (AJ-34 a AJ-37);
  `docs/15_FITNESS/INFORME_AUDITORIA_FINAL.md`.
- **Pruebas ejecutadas:**
  1. `scripts/test-integracion-final-fitness.mjs` (nueva, en `verificar.sh`): **52 comprobaciones**, con los puntos 1–16
     del prompt 8 §9 y la igualdad de la racha de Fitness y la global en 50 días y patrones.
  2. Las suites de Fitness de las fases anteriores, todas en verde (`test-disciplina-fitness` 81, `test-anotaciones-fitness`,
     `test-progresion-fitness`, `test-cumplimiento-fitness`, `test-rutinas-ciclicas`, `test-integracion-fitness` de la
     FIT F36 148…) y las de rachas (`test-rachas` 131, `test-rachas-servicio` 105, `test-rachas-hoy` 49,
     `test-rachas-gamificacion` 121, `test-habitos` 151).
  3. Banco de renderizado: **4324 casos** (seis del calendario viejo sustituidos por seis del unificado).
  4. Recorrido de Chromium: sección nueva **«FIT 8/8»** (26 comprobaciones: la racha en la cabecera, en el Historial y en
     Rachas, la de sueño intacta, nada guardado, el calendario en semana y mes, 320/375/393/430 px, Progreso sin calendario
     propio, ni un error) y la F31 dada la vuelta hacia el unificado.
  5. `verificar.sh` completo en verde (EXIT 0, «TODO CORRECTO»): Chromium 4075 ✓ / 0 ✗, renderizado 4324 ✓, `test-integracion-final-fitness` 52 ✓, «FIT 8/8» 26 ✓; unas 35 000 comprobaciones en total.
- **Problemas encontrados:** un descanso sacrificado hoy no cortaba la racha global (corregido con `corta`); pisé la suite
  `test-integracion-fitness.mjs` de la FIT F36 al crear la nueva con el mismo nombre (restaurada de git; la nueva es
  `test-integracion-final-fitness.mjs`).
- **Decisiones pendientes:** PD-03 (garantía de servidor, SQL preparado sin ejecutar); PD-01, PD-02 y PD-08 con su lectura
  provisional de la Fase 4 (C-77), sin cambios en esta fase.
- **Fecha de actualización:** 2026-11-06.

### Comprobación de criterios (prompt 8 §16)

| # | Criterio | Comprobado |
|---|---|---|
| 1 | Las ocho fases están verificadas | ✅ Cada fase con su suite y su sección del recorrido, todas en `verificar.sh`; auditoría en `INFORME_AUDITORIA_FINAL.md`. |
| 2 | Rutinas y plantillas funcionan | ✅ `test-rutinas-ciclicas`, «FIT 3/8» y la integración (§1–8). |
| 3 | La recuperación respeta todas las reglas | ✅ Caducidad por dos posteriores, descansos sacrificados, una por fecha, «Completar» (integración §1–8, `test-cumplimiento-fitness`, «FIT 4/8»). |
| 4 | La progresión funciona en sus tres modos | ✅ Manual, Progresivo y Experto; nunca escribe lo hecho; «Completar» no sirve de referencia (integración §9, «FIT 5/8»). |
| 5 | Las anotaciones están integradas | ✅ Nota anterior por plantilla y línea, historial (integración §10, «FIT 6/8»). |
| 6 | El historial es coherente | ✅ Lista, filtros, plantilla, detalle; nada escrito al leer (integración §15–16, «FIT 7/8»). |
| 7 | El calendario refleja los estados reales | ✅ Un solo calendario; cada día es `estadoDeFecha` en mes y en semana (integración §13, «FIT 7/8» y «FIT 8/8»). |
| 8 | Las estadísticas usan datos correctos | ✅ Fórmula aprobada y periodos (integración §11). |
| 9 | Persistencia segura dentro de las garantías disponibles | ✅ en el cliente (versión, solo lectura ante datos más nuevos, cuarentena, nada derivado guardado). ⚠️ Sin garantía de servidor: PD-03 y H-11, **pendientes de autorización**. |
| 10 | El entrenamiento en directo sigue funcionando | ✅ Sus secciones del recorrido (FIT F7, F9, F38, F45, «FIT 5/8», «FIT 6/8») en verde. |
| 11 | La interfaz móvil es estable | ✅ en Chromium a 320–430 px. ⚠️ Sin probar en un iPhone de verdad (R1). |
| 12 | Las pruebas completas están superadas | ✅ `verificar.sh` completo en verde (EXIT 0, «TODO CORRECTO»): Chromium 4075 ✓ / 0 ✗, renderizado 4324 ✓, `test-integracion-final-fitness` 52 ✓, «FIT 8/8» 26 ✓; unas 35 000 comprobaciones en total. Ninguna prueba borrada ni rebajada; las que medían el calendario retirado se dieron la vuelta. |
| 13 | No hay errores críticos conocidos | ✅ Ninguno abierto; los dos encontrados en la fase, corregidos. |
| 14 | La documentación está actualizada | ✅ Maestro (§5.7, §7, §9–§12), arquitectura §24, este documento, C-79, `CLAUDE.md` e informe de auditoría. |
| 15 | El informe final refleja el estado | ✅ Distingue lo comprobado, lo no probado en dispositivo y lo pendiente de autorización. |

**Siguiente fase:** ninguna. El rediseño de Fitness está cerrado en código y pruebas; lo que queda necesita a Josué.

---

## Protocolo «sigue»

Cuando Josué escriba «sigue» (§0.4 y prompt 1 §8):

1. Leer `docs/FITNESS_DOCUMENTO_MAESTRO.md`, `PLAN_MAESTRO_FITNESS.md` y este seguimiento.
2. Comprobar el estado real: **trabajar en la rama `claude/fitness-rediseno`** (copia
   `/home/user/JosStyle-fitness` si sigue existiendo; si no, recrearla desde `main` y traer estos
   documentos), comprobar si `main` ha avanzado y **no tocar nunca la rama ni los cambios de Imagen
   personal** (D-01).
3. Identificar la primera fase no «Completada» **comprobando sus criterios** en el código y en las
   pruebas, no solo esta tabla.
4. Comprobar sus dependencias y las decisiones pendientes que la bloquean.
5. Comprobar que la fase está **autorizada** por Josué. Si no, decirlo y parar.
6. Continuar desde el punto exacto en que se quedó, respetando los límites de su prompt.
7. Al terminar, actualizar este seguimiento y el documento maestro, y parar.

## Registro de operaciones

| Fecha | Operación | Qué se hizo | Archivos | Resultado |
|---|---|---|---|---|
| 2026-11-03 | 0 · Consolidación | Plan con §0 y los ocho prompts literales; seguimiento; conflictos CF-01 a CF-14. | `PLAN_MAESTRO_FITNESS.md`, `SEGUIMIENTO_FASES.md` | Hecha. |
| 2026-11-03 | 0b · Decisiones | D-01 a D-05 incorporadas (43 pasajes, originales en el Anexo D); conflictos resueltos o convertidos en PD; documentos movidos a la rama de Fitness. | Los dos de esta carpeta | Hecha. Texto vigente sin contradicciones; estructura de los ocho prompts completa. |
| 2026-11-03 | Fase 1 | Auditoría verificada, revisión de la PR #2, documento maestro, índice y `CLAUDE.md`. | `docs/FITNESS_DOCUMENTO_MAESTRO.md`, `docs/00_INDICE.md`, `CLAUDE.md` | Completada (criterios arriba). `verificar.sh`: EXIT 1 por **un fallo heredado de `main`** (H-25, ver PD-07); todo lo demás en verde. |
| 2026-11-03 | Fase 2 | Arquitectura técnica (AT-01 a AT-11, H-01 a H-12), maestro y seguimiento; dos comprobaciones de solo lectura (anclaje del ciclo y regla de caducidad). | `docs/15_FITNESS/ARQUITECTURA_TECNICA.md`, `docs/FITNESS_DOCUMENTO_MAESTRO.md`, este documento | Completada (criterios arriba). Sin cambios de código: `verificar.sh` no repetido (resultado de la Fase 1, PD-07). |
| 2026-11-03 | Fase 3 | PD-07 diagnosticado y parche aislado preparado (sin aplicar); rutinas cíclicas, editor, bibliotecas, en uso, borrados con días a descanso, papelera, guardia de versión; pruebas nuevas y viejas actualizadas. | Ver el apartado 5.2 del maestro | `verificar.sh` completo (2026-11-03): **EXIT 1 por un solo fallo, H-25 (PD-07), ajeno a la fase**. Compilación ✓, todas las suites de Node ✓ (la nueva, 119), renderizado 4188 casos ✓, reglas invariantes ✓, Chromium **3930 ✓ y 1 ✗ (H-25)**; la sección nueva «FIT 3/8» 40 ✓. Durante la pasada se dieron la vuelta tres comprobaciones viejas del recorrido que esperaban «plan» o prohibían «rutina» (FIT F5 ×2 y FIT F42). |
| 2026-11-04 | Fase 4 | PD-07 aplicado (solo la comprobación H-25) y `verificar.sh` en verde; motor de cumplimiento y recuperación, una sesión por fecha (cliente), «Completar entrenamiento» rehecho, migración M1 (solo código y pruebas), SQL de la reserva de fechas preparado sin ejecutar; pruebas nuevas y viejas ajustadas. | Ver el apartado 5.3 del maestro | `verificar.sh` con H-25: EXIT 0 (Chromium 3931 ✓). Con la Fase 4: **EXIT 0**, Chromium **3969 ✓ / 0 ✗**, renderizado 4220 ✓, `test-cumplimiento-fitness` 157 ✓. |
| 2026-11-06 | Fase 5 | Progresión Manual, Progresivo y Experto; interruptor por ejercicio; comparación por plantilla y línea (con `linea.id` en la sesión); repeticiones enteras o de media en media sin redondeo; propuesta en `plan.propuesta`; migración M2 (solo código y pruebas); PD-13 aplicada. | Ver el apartado 5.4 del maestro | `verificar.sh` completo en verde (EXIT 0): Chromium 3994 ✓ / 0 ✗, renderizado 4260 ✓; `test-progresion-fitness` 99 ✓; «FIT 5/8» 26 ✓. |
| 2026-11-06 | Fase 6 | Anotaciones por ejercicio: nota anterior de cada línea con su fecha, ⋯ con las antiguas (directo e historial), indicación de la plantilla aparte, guardado al interrumpir; correspondencia compartida con la progresión; sin modelo nuevo ni migración. | Ver el apartado 5.5 del maestro | `verificar.sh` completo en verde (EXIT 0): Chromium 4016 ✓ / 0 ✗, renderizado 4272 ✓; `test-anotaciones-fitness` 58 ✓; «FIT 6/8» 22 ✓. |
| 2026-11-06 | Fase 7 | Disciplina por periodos con fórmula documentada, racha de cumplimiento (PD-06 provisional), calendario de cumplimiento, detalle de cada fecha, historial por plantilla, evolución por plantilla y serie a serie; sin modelo nuevo ni migración. | Ver el apartado 5.6 del maestro | `verificar.sh` completo en verde (EXIT 0): Chromium 4042 ✓ / 0 ✗, renderizado 4324 ✓; `test-disciplina-fitness` 81 ✓; «FIT 7/8» 27 ✓. |
| 2026-11-06 | Fase 8 | Calendario unificado, racha única de entrenamiento (PD-06 definitiva), suite de integración final, «FIT 8/8», F31 dada la vuelta; restaurada una suite pisada. | Ver el apartado 5.7 del maestro | `verificar.sh` completo en verde (EXIT 0, «TODO CORRECTO»): Chromium 4075 ✓ / 0 ✗, renderizado 4324 ✓, `test-integracion-final-fitness` 52 ✓, «FIT 8/8» 26 ✓; unas 35 000 comprobaciones en total. |
