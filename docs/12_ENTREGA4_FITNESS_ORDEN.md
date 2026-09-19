# docs/12_ENTREGA4_FITNESS_ORDEN.md — las 45 fases del módulo de Entrenamiento

> **Qué es esto.** Josué pasó el 2026-09-13 un documento de **33 251 líneas** con **45 fases** para
> el módulo de **Entrenamiento (Fitness)**. Es una entrega entera, del tamaño de la 2 o la 3.
> La especificación literal está en `especificaciones/ORIGINAL_ENTREGA4_FITNESS.txt` 🔒 **intocable**.

## 🚨 EL DOCUMENTO VA DEL REVÉS, Y ÉL LO AVISÓ

*"he puesto las fases al revés bro ósea que analiza esto y hazlas por orden"*.

La **F45 abre el archivo (línea 1)** y la **F1 lo cierra (línea 32 639)**. Esta tabla existe
justamente para eso: **se construye de la F1 a la F45**, y aquí está dónde vive cada una. Sin ella,
cada sesión vuelve a perder un rato averiguando por dónde empezar — y el riesgo real es empezar por
la 45, que es el cierre.

⚠️ **No se reordena el archivo.** Es transcripción literal de lo que él escribió, como
`ORIGINAL_ENTREGA3_PULIDO_Y_MODULOS.txt` y `ORIGINAL_JC_FITNESS_ESTILO_DE_HOMBRE.txt`. Lo que se
ordena es **el trabajo**, no el documento.

## El orden de construcción

| | Fase | Líneas | Tamaño |
|---|---|---|---|
| **F1** ✅ **v3.83.0** | Fundación arquitectónica del módulo fitness | 32639–33252 | 614 |
| **F2** ✅ **v3.84.0** | Sistema y catálogo maestro de ejercicios | 32042–32638 | 597 |
| **F3** ✅ **v3.85.0** | Constructor de entrenamientos | 31493–32041 | 549 |
| **F4** ✅ **v3.86.0** | Gestión de entrenamientos y plantillas propias | 31018–31492 | 475 |
| **F5** ✅ **v3.87.0** | Biblioteca de planificaciones | 30514–31017 | 504 |
| **F6** ✅ **v3.88.0** | Tu plan | 29737–30513 | 777 |
| **F7** ✅ **v3.89.0** | Motor de entrenamiento en vivo | 29053–29736 | 684 |
| **F8** ✅ **v3.90.0** | Finalización y guardado del entrenamiento | 28456–29052 | 597 |
| **F9** ✅ **v3.91.0** | Ux avanzada del entrenamiento en vivo | 27781–28455 | 675 |
| **F10** ✅ **v3.92.0** | Historial de entrenamientos y detalle de sesiones | 27177–27780 | 604 |
| **F11** ✅ **v3.93.0** | Progresión y comparación del rendimiento | 26534–27176 | 643 |
| **F12** ✅ **v3.94.0** | Pantalla de progreso por ejercicio | 25916–26533 | 618 |
| **F13** ✅ **v3.95.0** | Progreso por grupos musculares | 25198–25915 | 718 |
| **F14** ✅ **v3.96.0** | Objetivos y metas de progreso | 24481–25197 | 717 |
| **F15** ✅ **v3.97.0** | Sistema base de rangos y clasificación | 23746–24480 | 735 |
| **F16** ✅ **v3.98.0** | Pantalla principal de rangos | 23042–23745 | 704 |
| **F17** ✅ **v3.99.0** | Clasificación de ejercicios mediante cuestionario | 22318–23041 | 724 |
| **F18** ✅ **v3.100.0** | Detalle de rankings musculares | 21573–22317 | 745 |
| **F19** ✅ **v3.101.0** | Actualización dinámica y evolución de rangos | 20856–21572 | 717 |
| **F20** ✅ **v3.102.0** | Explicación y comparación de rangos | 20159–20855 | 697 |
| **F21** ✅ **v3.103.0** | Contribución de ejercicios a rangos musculares | 19476–20158 | 683 |
| **F22** ✅ **v3.104.0** | Historial y evolución de rangos | 18745–19475 | 731 |
| **F23** ✅ **v3.105.0** | Objetivo del siguiente rango | 18070–18744 | 675 |
| **F24** ✅ **v3.106.0** | Priorización inteligente de clasificación | 17422–18069 | 648 |
| **F25** ✅ **v3.107.0** | Resumen inteligente de rangos | 16772–17421 | 650 |
| **F26** | Sistema de progreso físico mediante fotos | 16079–16771 | 693 |
| **F27** | Comparador avanzado de progreso físico | 15567–16078 | 512 |
| **F28** | Integración completa del progreso físico | 14875–15566 | 692 |
| **F29** | Análisis avanzado de rendimiento por ejercicio | 14154–14874 | 721 |
| **F30** | Sistema avanzado de objetivos fitness | 13244–14153 | 910 |
| **F31** | Consistencia y actividad de entrenamiento | 12540–13243 | 704 |
| **F32** | Planificación semanal avanzada de entrenamiento | 11860–12539 | 680 |
| **F33** | Sistema avanzado de sustitución de ejercicios | 11529–11859 | 331 |
| **F34** | Biblioteca y detalle avanzado de ejercicios | 10709–11528 | 820 |
| **F35** | Calidad, validación y administración del catálogo fitness | 10008–10708 | 701 |
| **F36** | Integración global del sistema fitness | 8963–10007 | 1045 |
| **F37** | Microinteracciones y feedback premium de fitness | 8083–8962 | 880 |
| **F38** | Ux móvil extrema y optimización para iphone | 7164–8082 | 919 |
| **F39** | Accesibilidad, estados límite y robustez de fitness | 6176–7163 | 988 |
| **F40** | Rendimiento y optimización técnica de fitness | 5219–6175 | 957 |
| **F41** | Persistencia, recuperación y resiliencia de datos de fitness | 4287–5218 | 932 |
| **F42** | Auditoría visual y acabado premium de fitness | 3281–4286 | 1006 |
| **F43** | Auditoría funcional integral de fitness | 2183–3280 | 1098 |
| **F44** | Limpieza arquitectónica y deuda técnica de fitness | 1652–2182 | 531 |
| **F45** | Pulido final, qa extremo y release de fitness | 1–1651 | 1651 |

## Los bloques, leídos de un vistazo

| Bloque | Fases | De qué va |
|---|---|---|
| **Fundación** | F1–F2 | La arquitectura del módulo y el catálogo maestro de ejercicios |
| **Construir un entreno** | F3–F6 | Constructor, plantillas propias, biblioteca de planificaciones y «Tu plan» |
| **Entrenar de verdad** | F7–F9 | El motor en vivo, el guardado al terminar y la UX durante la sesión |
| **Mirar atrás** | F10–F14 | Historial, progresión, progreso por ejercicio y por grupo muscular, metas |
| **Rangos** | F15–F25 | Clasificación muscular, rankings, evolución, comparación y resumen |
| **Progreso físico** | F26–F28 | Fotos, comparador e integración con el resto del progreso |
| **Inteligencia** | F29–F35 | Análisis por ejercicio, objetivos, consistencia, planificación semanal, sustituciones, biblioteca y calidad del catálogo |
| **Acabado** | F36–F42 | Integración global, microinteracciones, UX de iPhone, accesibilidad, rendimiento, persistencia y acabado visual |
| **Cierre** | F43–F45 | Auditoría funcional, limpieza de deuda técnica y release |

## ⚠️ Antes de escribir una línea de la F1

🚨 **ENTRENAMIENTO YA EXISTE.** Es la lección más repetida de este proyecto, y aquí el riesgo es el
más alto que ha habido: el módulo está en la barra de Bienestar desde hace mucho, con su vista, sus
datos guardados y su sitio en la exportación. **Un `fitness` nuevo al lado dejaría todo lo que Josué
tiene registrado invisible en su propia pantalla** — que es exactamente lo que estuvo a punto de
pasar con las notas (E3 F16), los alimentos (E3 F36) y los programas de Estudios (E3 F41).

**Lo primero de la F1 es inventariar lo que hay**, no crear: qué clave de `app_data` usa, qué vistas
lo pintan, quién lo lee (Hoy, el hub de área, las rachas, la exportación, el contexto de la IA) y qué
entidades tiene ya. Y a partir de ahí, **ampliar**.

## ✅ Lo que encontró ese inventario (FIT F1, v3.83.0)

El aviso de arriba se quedó corto: **no era una cosa que ya existía, eran tres.**

| El enunciado pide… | …y ya existe como | Dónde se gestiona |
|---|---|---|
| El módulo **Fitness** | `entreno` (navegación) + `calistenia` (datos) | `src/views/TrainingView.jsx` |
| **ProgressPhoto** (área Progreso) | `saludFotos`, con su archivo, su fecha, su nota y su PIN | `src/views/HealthView.jsx` |
| La **racha** de la cabecera | El motor de rachas, tipo `training` | `src/lib/rachas.js` |
| La **línea del hub** y de Inicio | `calcularResumenModulo('entreno', …)` | `src/lib/resumenesHub.js` |

**Ninguna se ha duplicado.** Fitness **es** `entreno`: mismo id, misma clave de datos, la etiqueta
cambia a «Fitness» y ya está (el precedente de NAV F2 con *Imagen personal*). El área de
Entrenamiento **renderiza `TrainingView` entera**, no la copia (E3 F23), y el área de Progreso
cuenta las fotos que hay y lleva a donde se suben. Está declarado en `MAPEO_EXISTENTE`, dentro de
`src/lib/fitness.js`, con una comprobación por línea.

⚠️ **Y hay una contradicción anotada: C-33** en `docs/03` — los diez rangos del apartado 22 contra
D2-02. Se construyó con la lectura que respeta las dos (un rango es una medida física, no un premio)
y **está por decirle a Josué**.

⚠️ **Lo que la F1 NO construye** está enumerado en `NO_EN_FIT1`, con la fase que lo traerá. El
apartado 27 lo pide expresamente: *"NO empieces automáticamente a construir el catálogo de
ejercicios"*.

## ✅ Lo que dejó la F2 (v3.84.0)

**Cien ejercicios**, con la forma del dato que van a usar las 43 fases que quedan. Lo que hay que
respetar a partir de aquí:

- **El `Exercise` se amplía, nunca se sustituye.** Si una fase necesita un campo nuevo, se añade — y
  se añade también a `crearEjercicioCompleto`, o el siguiente guardado se lo lleva (regla 5).
- **Entorno ≠ equipamiento**, y los dos son listas. La adaptación de rutinas depende de eso.
- **Los porcentajes suman 100 y llevan su papel.** `auditarCatalogo()` lo mide en cada pasada: un
  ejercicio nuevo que no cuadre pone la verificación roja el mismo día.
- **Los ids son ranuras estables**, nunca índices. Lo que se guarde en un plan, una sesión o un rango
  apunta a ellos.
- **La relación grupo → ejercicios se deriva.** Nunca una lista guardada por grupo.
- **El catálogo no vive en `app_data`.** Son datos de la aplicación; lo del usuario va en
  `fitness.ejercicios`, y `ejercicioPorId` mira en los dos sitios.
- **Ni un enlace inventado** (apartado 22): hay una comprobación que barre el JSON entero.

## ✅ Lo que dejó la F3 (v3.85.0)

El constructor entero, y con él la **primera escritura de la clave `fitness`** en `app_data`. Lo que
hay que respetar a partir de aquí:

- 🚨 **Lo que construye Josué son PLANTILLAS (`fitness.plantillas`), no planes.** `planes` es la
  biblioteca de planificaciones de la F5. La F1 dejó esa división escrita en `crearWorkoutPlan`, y
  el enunciado de la F4 la confirma: *«Tus plantillas» = las rutinas que te crees tú*.
- 🚨 **`Exercise` y `WorkoutExercise` son dos cosas, y el enunciado lo marca como CRÍTICO**
  (apartado 28). Una línea de rutina guarda `exerciseId` y **nada más del ejercicio**: ni el nombre,
  ni los músculos, ni el equipamiento. Si una fase necesita saber cómo se llama, **le pregunta al
  catálogo** (`nombreDeLinea`).
- 🚨 **Un campo nuevo de una línea va a `crearWorkoutExercise`, en `fitness.js`.** `App.jsx`
  normaliza `fitness` en cada carga, así que lo que ese modelo no conozca **se lo lleva el siguiente
  guardado** (regla 5). Ya pasó con los cinco de esta fase antes de arreglarlo.
- 🚨 **La puerta de carga de `fitness` es `normalizarFitnessCompleto()`, en `ejercicios.js`** — no
  `normalizarFitness`. La de `fitness.js` recorta los ejercicios del usuario al modelo reducido de la
  F1, y no se puede arreglar allí porque importar `ejercicios.js` desde `fitness.js` sería un ciclo.
- 🚨 **El selector de ejercicios es `EjerciciosView` en modo `onElegir`.** Ninguna fase futura
  escribe un segundo buscador de ejercicios (E3 F22).
- ⚠️ **`distribucionMuscular()` es la función de la distribución, para todos.** El apartado 19 la
  quiere reutilizable en el detalle del plan, los rangos, la IA y las estadísticas: devuelve por
  grupo **y** por subgrupo, ponderando por series. Nunca un porcentaje escrito a mano.
- ⚠️ **La duración es una estimación y tiene que parecerlo**: redondeada a cinco minutos y con el
  «≈» en el texto. Si una fase futura la afina, que no le quite el «≈».
- ⚠️ **Los bloques existen en el dato y no en la pantalla** (apartado 18): `bloqueId` en la línea,
  `bloques` en la rutina. La interfaz la traerá quien la necesite.
- ⚠️ **El borrador es de `localStorage` y cada acceso va en `try`** (SF F1). Y se **ofrece** al
  volver, nunca se recupera solo.

## ✅ Lo que dejó la F4 (v3.86.0)

- 🚨 **`UserTemplate` es `fitness.plantillas`**, de la F1. Ninguna fase futura crea un modelo de
  plantilla nuevo.
- 🚨 **Duplicar exige un id nuevo POR LÍNEA**, no solo para el plan: con el mismo, editar la copia
  edita el original. El apartado 7 pide comprobarlo explícitamente, y se comprueba.
- 🚨 **Eliminar una plantilla va a la papelera** (`CATALOGO_PAPELERA['fitness.plantillas']`), y por
  eso el aviso promete que se recupera. ⚠️ `fitness` está ahora en `MODULOS_PAPELERA` **y** en
  `snapshotAndSave`: sin lo segundo, el borrado no guardaría nada.
- ⚠️ **`creadoEn` y `editadoEn` viven en `crearWorkoutPlan`**, no en `plantillas.js` (regla 5), y
  nacen vacías: a lo guardado antes no se le inventa una fecha.
- ⚠️ **La ficha de una plantilla se deriva entera** (`fichaDePlantilla`): duración, distribución,
  número de ejercicios y el icono del grupo dominante. Ni un dato guardado por duplicado.
