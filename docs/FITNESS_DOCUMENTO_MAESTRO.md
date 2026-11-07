# FITNESS — DOCUMENTO MAESTRO

> **Qué es.** La referencia principal del estado funcional y técnico de Fitness durante su
> reorganización en ocho fases (decisión de Josué, 2026-11-03). Es la **memoria permanente** del
> proyecto: qué existe de verdad, qué se ha decidido, qué falta y en qué fase está cada cosa.
>
> **Documentos que lo acompañan** (no lo sustituyen):
> - `docs/15_FITNESS/PLAN_DESARROLLO/PLAN_MAESTRO_FITNESS.md` — los requisitos: la instrucción inicial,
>   los ocho prompts con las decisiones D-01 a D-05 incorporadas y sus anexos.
> - `docs/15_FITNESS/PLAN_DESARROLLO/SEGUIMIENTO_FASES.md` — el estado de cada fase, los conflictos
>   resueltos y el protocolo «sigue».
> - `docs/15_FITNESS/ARQUITECTURA_TECNICA.md` — el diseño técnico (Fase 2): modelo de datos, ciclos,
>   motor de cumplimiento, papelera, progresión, anotaciones, escalabilidad y migración.
> - `docs/12_ENTREGA4_FITNESS_ORDEN.md` — historia de la Entrega 4 (FIT F1–F45), que construyó el Fitness
>   de hoy. No se modifica.
>
> **Reglas para leerlo y mantenerlo**
> - Cada afirmación sobre el código dice **dónde se comprobó**. Lo que no se ha podido comprobar lo dice.
> - Se distingue siempre: ✅ implementado · 🟡 parcial · 📄 documentado pero no implementado ·
>   ❌ inexistente · ❓ no verificado.
> - Una fase solo pasa a «Completada» con sus criterios comprobados en el código y en las pruebas.
>
> **Base verificada:** `main` en `4881673` (v3.161.3, la versión en producción), rama de trabajo
> `claude/fitness-rediseno`. Fecha: 2026-11-03 (fases 1, 2 y 3). Las fases 1 y 2 no cambiaron código;
> la Fase 3 sí (apartado 5.2), sin commit.

## Índice

1. Objetivo general del rediseño
2. Terminología oficial
3. Decisiones funcionales confirmadas
4. Arquitectura actual verificada
5. Diferencias entre el estado actual y el deseado (arquitectura aprobada en la Fase 2 e implementado en las Fases 3 a 6)
6. Las ocho fases del proyecto
7. Estado de cada fase
8. Criterios de aceptación
9. Pruebas existentes y pruebas pendientes
10. Incidencias y decisiones no resueltas
11. Registro de cambios
- Anexo 1 — Riesgos técnicos y posibles pérdidas de datos
- Anexo 2 — Información necesaria para las fases siguientes

---

## 1 · Objetivo general del rediseño

Reorganizar Fitness para que separe con claridad **planificación** (rutinas cíclicas de 1 a 30 días
que usan plantillas), **ejecución** (una sesión como máximo por día, con progresión por plantilla y
anotaciones por ejercicio) e **historial** (calendario de cumplimiento centrado en la disciplina,
recuperaciones y evolución), **sin rehacerlo desde cero**: se conserva la estructura, las
funcionalidades y el flujo de entrenamiento en directo que ya existen siempre que sean compatibles, y no
se pierde ningún dato (decisión D-04 y prompt 1 §5).

## 2 · Terminología oficial

| Término | Definición oficial (prompt 1 §4) | Qué es hoy en el código (comprobado) |
|---|---|---|
| **Rutina** | Ciclo de entrenamiento de 1 a 30 días, con días de entrenamiento y de descanso; al terminar vuelve al día 1. | 🟡 Lo más parecido es el **«plan»**: `CATALOGO_PLANES` (`src/lib/planes.js`, datos en `catalogoPlanes.js`), **17 semanas fijas de 7 días** escritas en el código, cuyo día 1 es el lunes (`posicionDelDia` en `tuPlan.js`). No hay rutinas propias ni duraciones distintas de 7 (salvo una plantilla usada como plan, que cicla un día). |
| **Plantilla** | Entrenamiento individual diseñado por el usuario: ejercicios y sus series. | ✅ **`fitness.plantillas`** (`crearWorkoutPlan` en `src/lib/fitness.js`), creada con el constructor (`constructor.js`, `ConstructorView.jsx`). Los días de los planes llevan sus ejercicios **incrustados**: no hay «plantillas predeterminadas» como entidad. |
| **Sesión** | Ejecución real de una plantilla: lo que se hizo. | ✅ **`fitness.sesiones`** (`crearWorkoutSession`), con una copia congelada de la rutina en `origen.ejercicios` y, por serie, `plan` (lo previsto) y `hecho` (lo realizado) (`entrenamiento.js`). |

⚠️ Los identificadores guardados **no se renombran** aunque cambie el nombre por fuera
(`planActivo`, `planes`, `planesAnteriores`, `plantillas`, `sesiones`): son claves de `app_data`. La
terminología nueva se aplica en la interfaz, en la documentación y en el código nuevo.

## 3 · Decisiones funcionales confirmadas

**Principios del rediseño** (prompt 1 §5, texto vigente):
1. Interfaz intuitiva y orientativa. 2. **Una sola sesión como máximo por día.** 3. Separación entre
planificación, ejecución e historial. 4. Conservación de los registros históricos. 5. Progresión basada
en la plantilla, no solo en el ejercicio. 6. Cumplimiento centrado en la disciplina. 7. Libertad para
elegir entre las recuperaciones permitidas. 8. Experiencia de entrenamiento actual conservada.
9. Lógica determinista, sin IA generativa. 10. Protección de los datos en cualquier migración.
11. Conservación de Fitness (D-04). 12. Imagen personal separado (D-01).

**Decisiones definitivas del 2026-11-03** (texto literal en el Anexo E del plan):

| Id | Decisión | Dónde está incorporada |
|---|---|---|
| D-01 | Imagen personal está terminado, no es dependencia de Fitness y no se toca; los trabajos van separados. | Prompt 1 §5.12; rama `claude/fitness-rediseno`. |
| D-02 | **Caducidad de la recuperación:** un entrenamiento perdido se puede recuperar mientras no se hayan realizado **dos entrenamientos posteriores a su fecha prevista**; individual por pendiente; los descansos no cuentan; sin ventana fija de días. La recuperación conserva la fecha prevista y la real; en un descanso, lo sacrifica; en lugar del de hoy, deja el de hoy pendiente con la misma regla. | Prompts 2 §6, 4 §3.1, §6, §7 (reescrito), casos 3–6, 9, 12, 13, §13, §16; 7 §8 y §14; 8 §3 y escenario H. |
| D-03 | **«Completar entrenamiento» se conserva:** simula todas las series hechas, registra la sesión como **completa** (no parcial), cuenta como realizado, **no inventa** pesos ni repeticiones, queda identificada y respeta una sesión por fecha. La PR #2 no se fusiona ni se descarta automáticamente. | Prompts 1 §3, 2 §3.C y §12, 3 §13, 4 §3.2, §4, caso 14, §9, §13, §16; 5 §9 y §13; 7 §5, §8 y §14; 8 §3, §7 y escenario I. |
| D-04 | No rehacer Fitness: reutilizar, no eliminar funcionalidades útiles, no duplicar, no rediseñar el directo sin necesidad, no perder datos, corregir defectos. | Prompt 1 §5.11. |
| D-05 | Conflictos menores: estados unificados («En verificación»), prefijo `15_` distinguido en el índice, papelera general reutilizada, «Experto» como nombre, sesiones sin series revisadas, rutinas predeterminadas conservadas. | Prompts 1 §7, 2 §3.A, §8, §12; 3 §3, §7; 4 §6.A; 5 §8. |

**Reglas de producto que ya estaban en los prompts** (no se repiten aquí; están en el plan): rutinas de
1 a 30 días con todos los días configurados y plantillas repetibles (prompt 3); estados verde, amarillo
verdoso, rojo, futuro y pendiente (prompts 2 §7 y 4 §11); progresión Manual, Progresivo y Experto con
interruptor por ejercicio y repeticiones enteras o de media unidad (prompt 5); anotaciones por ejecución
(prompt 6); calendario, historial por plantilla y estadísticas de disciplina (prompt 7).

**Interpretaciones que se desprenden del texto** (no son decisiones nuevas; se aplican salvo que Josué
diga otra cosa):
- Una **recuperación realizada cuenta** como entrenamiento posterior para los pendientes de fechas
  anteriores: lo exige el ejemplo obligatorio de D-02 (miércoles se recupera Pull; jueves Push «solo» tiene
  un entrenamiento posterior).
- «Posterior a su fecha prevista» significa en una **fecha estrictamente posterior**.
- Un entrenamiento hecho con otra rutina activa cuenta para la caducidad de los pendientes de la rutina
  anterior: D-02 habla de entrenamientos realizados, sin distinguir rutina.
- La **ventana de siete días** es una vista de seguimiento y un periodo de estadísticas; no decide la
  caducidad (D-02 y prompt 4 §3.1).

## 4 · Arquitectura actual verificada

### 4.1 Estructura

- **85 archivos y unas 42 000 líneas**, ordenados en ocho capas en `CAPAS_FITNESS`
  (`src/lib/arquitecturaFitness.js`): datos (`catalogoEjercicios.js`, `catalogoPlanes.js`) → modelo
  (`fitness.js`, `ejercicios.js`, `planes.js`, `persistenciaFitness.js`) → motores (`tuPlan.js`,
  `planificacionSemanal.js`, `actividadEntrenamiento.js`, `entrenamiento.js`, `finalizacion.js`,
  `progresion.js`, `constructor.js`, `plantillas.js`, `sustitucion.js`, rangos y objetivos) → lecturas
  (`historial.js`, `progresoEjercicios.js`, `entrenamientoUx.js`…) → utilidades (`fechasFitness.js`,
  `numerosFitness.js`, `sesionesCompletadas.js`) → auditorías → pantallas (13 vistas) → componentes (21).
  **Una prueba recorre los imports**: todo archivo nuevo de Fitness tiene que entrar en su capa.
- **Navegación** (`FitnessView.jsx`, `AREAS_FITNESS` en `fitness.js`): tres pestañas —Rangos, Progreso y
  Entrenamiento (la inicial)—. Dentro de Entrenamiento: Tu Plan (`TuPlanView`), biblioteca de planes
  (`BibliotecaPlanesView`), tus plantillas (`PlantillasView`), constructor, ejercicios, entrenamiento en
  directo (`EntrenamientoVivoView`), finalización (`FinalizacionView`) e historial (`HistorialView`).

### 4.2 Datos y persistencia

- Todo Fitness es **un único objeto** en Supabase, tabla `app_data`, clave `fitness`
  (`supabase/schema.sql`: `primary key (user_id, key)` y cuatro políticas RLS `auth.uid() = user_id`).
  `saveData` hace `upsert` del objeto entero (`src/lib/supabase.js`); **gana la última escritura** entre
  dispositivos. `App.jsx` guarda con `guardarFitness` y lee el resultado `{ ok, error }`.
- Claves de `DEFAULT_FITNESS` (`fitness.js`): `version` (1), `ejercicios`, `planes` (sin escritor),
  `plantillas`, `sesiones`, `rangos`, `planActivo` (`{planId, origen, desde}`), `favoritosPlanes`,
  `favoritosEjercicios`, `objetivos`, `clasificaciones`, `planesAnteriores` (tramos cerrados con la
  estructura de sus días) y `cuarentena`.
- **Puerta de carga:** `migrarFitness` (cadena de migraciones versionada, **hoy vacía**) →
  `normalizarFitnessConSesiones` → `apartarLoQueNoCarga` (lo que no entiende va a `fitness.cuarentena`
  con su original) (`persistenciaFitness.js`, `App.jsx`). Las claves desconocidas se conservan.
- Fotos de progreso: aparte, en `saludFotos` y el bucket privado `progreso`.
- Tamaño medido: una sesión de 6 ejercicios y 19 series ocupa **~5,3 KB**; a 4 por semana, ~1,1 MB al año
  en la misma fila, que se sube entera en cada guardado.

### 4.3 Rutinas y plantillas (planificación)

- **Planes:** 17 predeterminados de 7 días (63 días de entreno, 297 líneas de ejercicio), solo lectura,
  con ids estables (`ppl-estetico`, días `ppl-estetico-dia-1`…, desde la FIT F32). Se activan con
  `usarPlan` (pide confirmación si había otro y cierra el tramo en `planesAnteriores`), se quitan con
  `quitarPlanActivo` y se marcan como favoritos. «Personalizar» (`personalizarPreset`) **parte la semana**
  en una plantilla por día de entreno: la estructura semanal se pierde. ❌ No se pueden crear, editar,
  duplicar ni borrar planes.
- **Plantillas:** crear y editar (constructor), duplicar (ids nuevos, sin enlace con la original),
  eliminar a la papelera (`'fitness.plantillas'` en `papelera.js`). La lógica permite activar una
  plantilla como plan (`origen: 'plantilla'`), pero 🟡 **ninguna pantalla lo ofrece**.
- **Qué toca cada día:** `tuPlan.js` (`planificadoEnFecha`, `semanaDelPlan`, `proximoEntrenamiento`) y
  `planificacionSemanal.js` (estados por día). **Semana fija de lunes a domingo.**

### 4.4 Ejecución

- `empezarSesion` (`entrenamiento.js`) congela la rutina en `origen.ejercicios` y pone `fecha` = el día en
  que **empieza**. Estados de sesión: `en_curso`, `pausada`, `finalizando`, `completada`, `descartada`
  (más `planificada`, sin uso). Marcas de tiempo, nunca contadores.
- Directo (`EntrenamientoVivoView` + `entrenamientoUx.js`): editar peso y repeticiones, marcar series,
  añadir y quitar series, sustituir ejercicios (`sustitucion.js`), descanso automático (`descansoAuto`,
  por sesión) y manual con tiempos rápidos, reloj, «Última vez» (`ultimaVezEnVivo`), guardado al salir del
  campo o a los 700 ms, y recuperación de una sesión interrumpida.
- Finalización (`finalizacion.js`): guardado **idempotente** de la misma sesión; permite guardar **sin
  ninguna serie** pidiendo confirmación (cuenta como completada).
- ❌ **No hay regla de una sesión por día**: desde la semana se puede empezar cualquier día del plan y
  existe «Repetir». Comprobado: tres sesiones completadas el mismo día se guardan sin bloqueo.
- ❌ **No hay pendientes ni recuperación**: la sesión no guarda qué fecha prevista cumple. Hacer el Push
  del lunes el miércoles deja el lunes «Planificado» y el miércoles «Completado» aunque Legs no se hizo.

### 4.5 Progresión

- `progresion.js` (F11), derivada y sin nada guardado: clases de medida (carga, lastre, repeticiones,
  tiempo), `compararSeries`, `mejorSerie`, `aparicionesDeEjercicio` (con caché), `compararApariciones`,
  `mejorHistorico`, `progresoDeEjercicio`, `comparacionEnSesion`, `primerRecordPersonal`, `ultimaVez`.
- ❌ Ningún modo de progresión ni propuesta automática; ❌ ninguna preferencia guardada.
- 🟡 «Última vez» es **por ejercicio**, no por plantilla: comprobado que el viernes (Día 1) enseña la del
  martes (Día 2). Filtrando por `origen` sí se obtiene la ejecución anterior de la misma plantilla.
- ⚠️ **Repeticiones enteras en todas las capas**, y **8,5 se redondea en silencio a 9** (`crearSerie`,
  `editarSerie`, `serieLimpia`).
- La sesión no guarda el **id de la línea** de la plantilla.

### 4.6 Anotaciones

- ✅ Nota general de la sesión (`sesion.notas`) y nota por ejercicio en la sesión (`notaDeEjercicio`, con
  guardado automático); se ven en el detalle del historial.
- 🟡 La nota de la línea de la plantilla (`linea.notas`) se edita en el constructor pero **no pasa a la
  sesión** al empezar (comprobado).
- ❌ No se muestra la nota de la ejecución anterior ni hay consulta de notas antiguas. (✅ Fase 6, apartado 5.5.)

### 4.7 Historial y estadísticas

- `historial.js` y `sesionesCompletadas.js`: cuenta lo `completada`. `HistorialView`: lista con filtros,
  búsqueda, páginas de 30 y detalle (series, resultados y notas). 🟡 Sin calendario. (✅ Fase 7, apartado 5.6: disciplina, calendario de cumplimiento y detalle de cada fecha.)
- Calendario mensual en Progreso → Resumen (`mesDeActividad`, `actividadEntrenamiento.jsx`) con
  navegación entre meses y estados **neutros** (entrenado, sin entrenamiento planificado, sin registro,
  futuro). ❌ Sin verde y rojo (la F31/F32 lo decidió así; el rediseño lo sustituye).
- Evolución ✅ por ejercicio (gráficas de 7 días a «Todo»); ❌ por plantilla. (✅ Fase 7: por plantilla y serie a serie.)
- Constancia «N de los últimos 7 días», adherencia semanal y media semanal.
- 🟡 Racha: Fitness lee la racha global de tipo «entrenamiento», que **solo se marca a mano** en Rachas;
  guardar una sesión no la alimenta.

### 4.8 Quién más lee Fitness

`fechasDeEntreno` (puntuación del día, predicciones, correlaciones, Progreso/Números, configuración
inicial), `resumenesHub` (tarjetas de Inicio y Bienestar), `logros` (primer récord), Imagen personal
(«Tu entrenamiento», solo lectura), el chatbot de Fitness (`asistenteFitness.js`), la exportación y la
papelera. Calendario y notificaciones no leen Fitness.

### 4.9 La PR #2 y «Completar entrenamiento» (no está en `main`)

Revisada en el commit `4531909`: `src/lib/completarEntrenamiento.js` y su componente registran un
entrenamiento hecho fuera de la aplicación como sesión `completada` **sin series** (`origen.ejercicios:
[]`) y con el campo nuevo `registradaAMano: true`, en hoy o **cualquier fecha pasada**; bloquean repetir el
mismo entrenamiento en la misma fecha, pero **permiten otro distinto**. Incompatibilidades con D-03 y el
nuevo sistema, a resolver en las fases 2–4 **sin perder la función**:
1. **Sin series** → con la regla de sesión parcial o vacía (caso 11) contaría como no realizada; D-03 pide
   simular todas las series hechas sin inventar valores.
2. **Un segundo entrenamiento distinto** el mismo día está permitido → debe impedirse.
3. **Fechas pasadas**: su relación con pendientes y recuperaciones no está decidida (PD-02).
4. No guarda fecha prevista ni tipo de cumplimiento (no existen todavía en el modelo).

`registradaAMano` sirve como «identificado como completado con esta función». La PR #2 también trae
cambios de chatbots (fases 2.1, 2.2, B0–B2 y E2), ajenos a este rediseño salvo las métricas del
asistente de Fitness. **Nada de la PR #2 está en producción**: ningún usuario tiene datos con
`registradaAMano`.

## 5 · Diferencias entre el estado actual y el deseado

| Área | Hoy | Deseado | Fase |
|---|---|---|---|
| Rutinas | 17 semanas fijas en el código; no se crean ni editan | Biblioteca de rutinas de 1 a 30 días, propias y predeterminadas, una activa | 2, 3 · ✅ hecho (F3) |
| Plantillas | ✅ propias; las predeterminadas van incrustadas en los planes | Biblioteca con predeterminadas y propias, marca de «en uso», borrado que pasa días a descanso | 2, 3 · ✅ hecho (F3) |
| Ciclo | Lunes = día 1 | Posición calculada desde la fecha de inicio del ciclo | 2, 3 · ✅ hecho (F3) |
| Una sesión por día | ❌ | En la lógica y en el servidor | 2, 4 · ✅ en la lógica (F4); servidor: SQL preparado, sin ejecutar (PD-03) |
| Pendientes y recuperación | ❌ | Caducidad por dos entrenamientos posteriores (D-02) | 2, 4 · ✅ hecho (F4) |
| Cumplimiento | Estados neutros, semana lunes–domingo | Verde, amarillo verdoso, rojo, futuro y pendiente; ventana móvil de 7 días | 4, 7 · ✅ motor y ventana de 7 días (F4); calendario, F7 |
| Sesión sin series | Se guarda y cuenta | No es entrenamiento realizado (caso 11), salvo «Completar entrenamiento» | 4 · ✅ hecho (F4) |
| «Completar entrenamiento» | Solo en la PR #2, sin series | Completa, sin inventar, una por fecha | 2, 4 · ✅ rehecho (F4) |
| Progresión | Comparación por ejercicio; sin modos | Manual, Progresivo y Experto por plantilla y por línea | 2, 5 |
| Repeticiones | Enteras; 8,5 → 9 en silencio | Enteras o de media unidad, sin redondeo | 5 |
| Anotaciones | Por sesión y ejercicio; la de la plantilla se pierde | Nota anterior y consulta de antiguas por línea | 2, 6 |
| Historial | Lista + mes neutro en Progreso; evolución por ejercicio | Calendario principal con colores, detalle de fecha, historial y evolución por plantilla | 7 |
| Eliminados recientemente | ✅ papelera general (plantillas, sesiones, objetivos) | También rutinas, con reglas de huecos | 2, 3 · ✅ hecho (F3) |
| Persistencia | Un objeto entero, gana la última escritura | Garantía de servidor para una sesión por fecha; escalable | 2 (diseño), SQL de Josué |

### 5.1 Arquitectura aprobada en la Fase 2 (resumen)

El detalle, campo a campo, está en `docs/15_FITNESS/ARQUITECTURA_TECNICA.md`. Lo esencial:

- **Se amplía lo que existe** (AT-01): todo sigue en el objeto `fitness` de `app_data` durante las fases
  3–7; nada se borra ni se renombra.
- **Tres entidades** (AT-02): `fitness.rutinas` (clave **nueva**; no `planes`, cuyo normalizador quitaría
  los días), `fitness.plantillas` (la de hoy) y `fitness.sesiones` (la de hoy). Los 17 planes son
  **rutinas predeterminadas** con sus ids; sus 63 días de entreno, **plantillas predeterminadas** con id
  `<id del día>-plantilla`. Lo predeterminado vive en el código y **se copia al editarlo o borrarlo**, con
  el mismo id (AT-03).
- **Ids estables e independientes** para rutina, día, plantilla y línea (AT-06). Las líneas de los planes
  reciben hoy un id aleatorio en cada carga: se escribirán en el catálogo, una vez y sin renumerar.
- **Ciclo** = días desde `inicioCiclo` mod N. Editar la rutina activa **cierra un tramo** con la
  estructura anterior (el mecanismo de `planesAnteriores` que ya existe); el pasado no cambia. Los planes
  activos de 7 días se anclan al lunes y **ningún día cambia** (comprobado en 27 200 fechas).
- **La sesión guarda su vínculo** en `diaDePlan` (que ya existe y que las versiones viejas conservan
  entero): rutina, día, plantilla, posición, **fecha prevista** y **clase** (prevista, recuperación o
  libre); y `completadaCon` (`directo` o `completar`) (AT-05).
- **Motor de cumplimiento único y puro** (AT-07): calendario previsto → pendientes (derivados, no
  guardados) → caducidad por **dos entrenamientos realizados en fechas posteriores** (D-02) → estado de
  cada fecha → opciones y consecuencias. Comprobado con un modelo sobre los ejemplos obligatorios y los
  casos 3, 4 y 5.
- **Dos ejes de estado**: la sesión (ciclo de vida + grado completa / parcial / vacía, derivado) y la
  fecha (cumplido, parcial, pendiente, perdido, descanso respetado o sacrificado, futuro, sin
  seguimiento).
- **«Completar entrenamiento»** (D-03): fotografía de la plantilla con **todas** las series hechas y sin
  valores; completa, sin inventar, ignorada por la progresión.
- **Papelera general** con una puerta propia de Fitness (AT-11): rutinas nuevas en el catálogo; una
  plantilla de la rutina activa deja sus días en descanso y la entrada guarda los huecos para ofrecer
  devolverlos al restaurar, sin pisar nada.
- **Progresión** por plantilla y línea (`linea.id`), modo en `preferencias.progresion`, interruptor en
  `config.progresion`, propuesta en `serie.plan.propuesta`; medias repeticiones con un validador único y
  sin redondeos.
- **Anotaciones**: no hace falta estructura nueva; la nota anterior se busca por plantilla y `linea.id`.
- **Almacenamiento**: seguir en el objeto (A) hasta que el tamaño lo pida; garantía de servidor de una
  sesión por fecha con una **tabla pequeña de reserva de fechas** (C, SQL documentado y no ejecutado,
  PD-03); tabla de sesiones (B) más adelante (PD-05).
- **Migración v1 → v2 en dos entregas** (AT-08, AT-09): primero una **guardia de versión** (una versión
  vieja no guarda Fitness si los datos son más nuevos: hoy los estropearía), después la migración aditiva
  e idempotente, con validación, copia en `fitness_respaldo_v1` y sin tocar ninguna sesión.

### 5.2 Implementado en la Fase 3 — biblioteca de rutinas y plantillas

**Funcionalidades** (todas en Fitness → Entrenamiento):
- **Biblioteca de rutinas** («Rutinas», antes «Más planes»): sección **«Tus rutinas»** con «Crear rutina» y, en
  cada una, Activar, Editar, Duplicar y Eliminar; debajo, las **17 rutinas predeterminadas** de siempre (con su
  buscador, filtros, favoritos y ficha), que ahora también se pueden **editar** (se guarda su copia con el
  mismo id), **duplicar** y **eliminar**. «Personalizar» se conserva.
- **Editor de rutinas** (pantalla completa, nuevo): nombre, duración de **1 a 30 días** con «−» y «+», y la lista
  de días, que nacen **sin decidir**; cada día se decide como **descanso** o **entrenamiento** con una plantilla
  (buscador, las ya usadas en la rutina primero) o **«Crear una plantilla nueva»** (abre el constructor y vuelve
  con la plantilla asignada). No se guarda con días sin decidir y se dice cuáles faltan. Quitar días ya decididos
  se pregunta. Salir con cambios sin guardar se pregunta.
- **Ciclo**: una rutina suya empieza el día de su activación por el día 1 y se repite sin fin; las predeterminadas
  siguen la semana de lunes a domingo, como siempre. Tu Plan, la semana, la actividad y «Empezar» funcionan igual
  con una rutina suya que con una predeterminada.
- **Editar la rutina activa no reescribe el pasado**: se cierra un tramo con la estructura de antes y hoy sigue
  siendo el mismo día del ciclo (por su id).
- **Biblioteca de plantillas**: «Tuyas» y **«Predeterminadas»** (los 63 días de entreno de las rutinas
  predeterminadas, cada uno con «de PPL Estético»…); la marca discreta **«En tu rutina activa»** o **«En N
  rutinas»**; en la ficha, **«Dónde se usa»** (rutina y días). Duplicar una predeterminada guarda solo la copia.
- **Eliminar una plantilla de la rutina activa**: confirmación específica («los días 1, 3 pasarán a ser de
  descanso»; las rutinas no activas que la usan no se tocan y se dice); al confirmar, esos días pasan a descanso
  y la plantilla va a Eliminados recientemente. **Recuperarla** (Ajustes → Eliminados recientemente) la devuelve
  entera, y su ficha ofrece **«Volver a ponerla»** solo en los días que siguen de descanso (nunca pisa una
  asignación posterior).
- **Eliminar y recuperar rutinas**, también predeterminadas, con la papelera general (retención de siempre).
- **Guardia de versión (G0)**: si los datos de Fitness son de una versión más nueva de la aplicación, esta no
  guarda, no borra ni restaura nada de Fitness y lo dice con un aviso («Recarga la página para poder guardar»).

**Archivos** — nuevos: `src/lib/rutinasCiclicas.js` (capa «motores»), `src/views/EditorRutinaView.jsx`,
`scripts/test-rutinas-ciclicas.mjs`, `scripts/instantanea-lineas-predeterminadas.json`. Modificados:
`src/lib/fitness.js`, `planes.js`, `tuPlan.js`, `planificacionSemanal.js`, `papelera.js`, `acabadoFitness.js`,
`arquitecturaFitness.js`, `feedbackFitness.js`, `integracionFitness.js`; `src/App.jsx`;
`src/views/FitnessView.jsx`, `BibliotecaPlanesView.jsx`, `PlantillasView.jsx`, `TuPlanView.jsx`; y las pruebas
`verificar.sh`, `smoke-vistas.jsx`, `test-app-real.mjs`, `test-acabado-fitness`, `test-auditoria-final`,
`test-feedback-fitness`, `test-persistencia-fitness`, `test-planes`, `test-planificacion-semanal` y `test-tu-plan`.

**Cambios en el modelo de datos** (todos aditivos; nada se renombra ni se borra; versión del formato: sigue 1):
- `fitness.rutinas` (nueva lista) y `fitness.predeterminadasRetiradas` (`{ rutinas, plantillas }`), con su
  normalizador (regla 5); `rutinas` entra en la cuarentena.
- `planActivo.inicioCiclo` y, en cada tramo de `planesAnteriores`, `inicioCiclo` y `plantillaId` por día.
- `planActivo.origen` admite `'rutina'` (las predeterminadas siguen siendo `'preset'`).
- Plantilla: `meta.origen` (`'predeterminada'` en las copias) y `meta.huecos` (solo mientras se ofrece devolverla).
- Ids **estables** para las 297 líneas de los planes predeterminados (`<día>-plantilla-l<n>`).
- Papelera: entrada de catálogo `'fitness.rutinas'`.

**Pruebas**: ver el apartado 9 y `SEGUIMIENTO_FASES.md`.

**Problemas encontrados y resueltos**: las líneas de los planes predeterminados cambiaban de id en cada carga
(H-01); una versión vieja guardaría encima de datos nuevos (H-04, G0); `planes.js` no sabía cerrar el tramo de
una rutina suya (ahora recibe su estructura); la regla de vocabulario de la FIT F42 prohibía «rutina».

**Limitaciones**:
- La garantía de una sesión por fecha sigue sin existir: es la Fase 4.
- «Empezar por otro día» del ciclo no está construido (no lo pide el prompt 3).
- El editor no reordena días: el prompt 3 no lo pide, y el motor ya conserva el día de hoy si se reordena.
- Una rutina solo de descanso se guarda pero no se activa.
- Sin probar en un iPhone de verdad (R1).

Las desviaciones respecto a la arquitectura, con su motivo, están en `ARQUITECTURA_TECNICA.md` §19 (AJ-01 a
AJ-09).

### 5.3 Implementado en la Fase 4 — cumplimiento, descansos y recuperación

**Motor** (`src/lib/cumplimientoFitness.js`, capa «motores», funciones puras: reciben `fitness` y `hoy`, no guardan
nada y no importan pantallas). Una sola fuente de verdad para Tu Plan, la ventana de siete días, el historial y el
futuro calendario:
- **Qué tocaba cada fecha** (`previstoEn`): con el tramo que la cubría (rutina, día del ciclo, plantilla).
- **Grado de una sesión** (`gradoDeSesion`): completa, parcial o vacía. «Completar entrenamiento» es siempre completa;
  una serie planificada omitida cuenta como no hecha (PD-11); las añadidas no cambian el grado.
- **Clase** (prevista, recuperación o libre): se escribe al empezar en `diaDePlan` (con `planId`, `diaId`,
  `plantillaId`, `posicion` y `fechaPrevista`); para las sesiones de antes, la regla de compatibilidad (§14.6).
- **Pendientes** (`analisisDeCumplimiento`): cada día de entreno terminado, desde `cumplimientoDesde`, sin una sesión
  que lo cumpla (la prevista de ese día o una recuperación que lo apunte). Conservan su identidad (rutina, día,
  plantilla, fecha). Un descanso nunca se convierte en pendiente.
- **Caducidad (D-02)**: un pendiente caduca cuando hay **dos fechas posteriores con un entrenamiento realizado**
  (incluidas recuperaciones); individual por pendiente, sin ventana de días, y los descansos no cuentan. Explica qué
  dos entrenamientos lo hicieron caducar.
- **Estados de fecha** con color y motivo: cumplido y recuperado (verde), parcial (amarillo verdoso), pendiente,
  perdido (rojo), descanso respetado (verde), descanso sacrificado (rojo), hoy, futuro y sin seguimiento.
- **Ventana de siete días** (hoy incluido; es una vista, no decide nada).
- **Recuperación**: `opcionesDeRecuperacion` (lo previsto hoy, los recuperables del más antiguo al más reciente con el
  recomendado, los bloqueados con su motivo —otra rutina, plantilla en la papelera, rutina eliminada— y los caducados
  recientes) y `consecuenciasDeElegir`, que **simula** la elección con el mismo motor y dice qué caducaría, si hoy
  quedaría como descanso sacrificado y si lo de hoy quedaría pendiente.
- **Una sesión por fecha** (`prepararSesionNueva`): toda sesión nueva pasa por ahí (Empezar, Repetir, una plantilla, la
  biblioteca, recuperar y «Completar entrenamiento»). Una descartada libera la fecha (PD-10). Si por sincronización
  llegan dos, ninguna se borra: la segunda queda «en conflicto» (derivado) y no cuenta.

**«Completar entrenamiento»** (`src/lib/completarEntrenamiento.js`, D-03): rehecho sobre este modelo (la PR #2 no se
fusiona). Lleva la fotografía de la plantilla con **todas las series hechas y sin ningún valor** (ni pesos, ni
repeticiones, ni tiempos, ni duración), `completadaCon: 'completar'`, cuenta como completa y como realizado, y
respeta la fecha ocupada. Hoy o un día pasado, contando en esa fecha (PD-02, provisional); desde la tarjeta de
recuperación, recupera el pendiente elegido.

**Interfaz** (Fitness → Entrenamiento → Tu Plan, y el historial):
- Tarjeta de recuperación solo si hay algo que decir: qué toca hoy, los pendientes que se pueden recuperar (el
  recomendado primero), «Elegir» abre las consecuencias antes de confirmar, y «Empezar la recuperación» o «Completar
  entrenamiento». En un descanso dice que descansar es válido; los bloqueados y los caducados, con su porqué.
- «Últimos 7 días»: un círculo por día con su icono y su color; tocarlo dice por qué.
- Aviso de fecha ocupada arriba de Fitness («Ya entrenaste hoy» o «Ya tienes un entrenamiento empezado hoy»), con
  la opción de abrirlo.
- «Completar entrenamiento» en Tu Plan: qué hiciste y qué día.
- Historial: «Recuperación: debía hacerse el … y se hizo el …» y «Completado con «Completar entrenamiento»».
- Empezar desde la semana un día pasado pendiente lo recupera.

**Migración M1 (versión 1 → 2)** (`src/lib/migracionFitnessV2.js`; **solo código y pruebas, no se ha ejecutado
contra datos reales**): aditiva e idempotente; añade `rutinas` y `predeterminadasRetiradas` si faltan, el día 1 del
ciclo de la activa y de cada tramo con la misma regla con la que hoy se lee, la plantilla de cada día de los tramos
y `cumplimientoDesde` (el día de la migración, PD-09). **No toca ninguna sesión.** Valida antes de aplicarse (mismas
sesiones, series, sumas, plantillas, objetivos, clasificaciones, cuarentena, tramos y el día del ciclo de cada fecha de
los últimos 365 días); si algo no cuadra, se queda lo de antes. Antes de usarla, la aplicación guarda la versión 1 tal
cual en `fitness_respaldo_v1` (solo si no existe); sin copia, no migra.

**Cambios en el modelo** (aditivos): `DEFAULT_FITNESS.version` = 2 y `cumplimientoDesde`; en la sesión,
`completadaCon` y `conflicto` (con su normalizador, regla 5) y `diaDePlan` ampliado (`plantillaId`, `posicion`,
`fechaPrevista`, `clase`); `cumplimientoDesde` entra en `CAMPOS_GUARDADOS`.

**Archivos** — nuevos: `src/lib/cumplimientoFitness.js`, `src/lib/completarEntrenamiento.js`,
`src/lib/migracionFitnessV2.js`, `src/components/cumplimientoFitness.jsx`, `scripts/test-cumplimiento-fitness.mjs`,
`docs/15_FITNESS/sql/fitness_reserva_fechas.sql` (preparado, sin ejecutar). Modificados: `src/lib/fitness.js`,
`persistenciaFitness.js`, `historial.js`, `arquitecturaFitness.js`, `feedbackFitness.js`, `integracionFitness.js`;
`src/App.jsx`; `src/views/FitnessView.jsx`, `TuPlanView.jsx`, `HistorialView.jsx`; las pruebas `verificar.sh`,
`smoke-vistas.jsx`, `test-app-real.mjs` (H-25 y la sección «FIT 4/8»), `test-persistencia-fitness`,
`test-auditoria-final`, `test-feedback-fitness`; y la documentación.

**Garantías reales de integridad**: una sesión por fecha **en el cliente** (todas las pantallas del mismo dispositivo
pasan por la misma comprobación). **No hay garantía de servidor**: con dos dispositivos a la vez, el objeto único de
`app_data` puede recibir dos sesiones del mismo día; ninguna se borra y la segunda no cuenta (conflicto derivado). La
garantía real necesita el SQL de `docs/15_FITNESS/sql/fitness_reserva_fechas.sql`, que solo puede ejecutar Josué (PD-03).

**Limitaciones**: el calendario mensual con colores es de la Fase 7; la racha no se calcula desde el cumplimiento
(PD-06); los lectores de fuera de Fitness (puntuación, predicciones, logros, Inicio) siguen contando como entrenado un
día con una sesión guardada aunque esté vacía (Anexo 1, punto 7); sin probar en un iPhone de verdad (R1).

Las desviaciones respecto a la arquitectura están en `ARQUITECTURA_TECNICA.md` §20 (AJ-10 a AJ-19).

### 5.4 Implementado en la Fase 5 — progresión: Manual, Progresivo y Experto

**Motor** (`src/lib/progresion.js`, ampliado; **no hay un segundo motor**). Sobre `serieLimpia`, `claseDe`,
`seriesComparables` y `compararApariciones` se añade un filtro por plantilla y por línea y la regla de la propuesta:
- **Tres modos, globales** (PD-13, propuesta aplicada): `fitness.preferencias.progresion` = `manual` (por defecto),
  `progresivo` o `experto`. Se elige en Fitness → Entrenamiento → Tu Plan («Progresión»).
- **Manual** no propone nada: la sesión empieza exactamente igual que antes.
- **Interruptor por ejercicio**: `config.progresion` de cada línea de la plantilla, en el editor de la línea, solo
  fuera de Manual. Sin guardar, activado (AJ-20). Editar y duplicar la plantilla lo conservan; la sesión fotografía
  cómo estaba ese día (`linea.progresion`).
- **Comparación** (`ejecucionesDeLinea`): las sesiones completadas **de la misma plantilla** (`plantillaDeSesion`:
  `diaDePlan.plantillaId` o, para lo de antes, la regla del §14.6 de la arquitectura) con un ejercicio de **la misma
  línea** (`linea.id`, que la sesión guarda desde esta fase) **y el mismo ejercicio** (`exerciseId`). Push A y Push B
  nunca se mezclan; reordenar o renombrar no cambia nada (ids); una plantilla duplicada empieza su propio historial.
  Sesiones de antes sin `linea.id`: solo si es inequívoco (un único ejercicio así en la sesión antigua y una única
  línea así en la plantilla de hoy). «Completar entrenamiento» no es referencia (no tiene valores, D-03).
- **Regla de cálculo** (referencia = la última ejecución válida de esa línea; las series se emparejan por su número):
  - Progresivo: todas las series repiten lo de la última vez y **una sola** —la más baja; si empatan, la última— sube
    **1 repetición**; solo si la referencia tiene todas las series de hoy y no bajó respecto a la anterior (si no,
    se propone mantener).
  - Experto: **cada serie** sube **media repetición** sobre lo que hizo en esa misma serie; una serie sin referencia,
    sin propuesta.
  - Con rango (8–12) nada pasa del máximo; al llegar se dice «tú decides si subir el peso». El peso propuesto es
    siempre el de la referencia (AJ-22). Si hoy la plantilla pide otro peso, no se propone.
  - Por tiempo: lo de la última vez como referencia, sin subir (AJ-21, limitación documentada). Peso corporal,
    lastre y carga externa: cada uno con sus unidades, sin mezclar.
- **Al empezar** (`conPropuestas`, desde `FitnessView` después de las comprobaciones de la Fase 4, que no cambian):
  cada serie recibe su `plan.propuesta` (`{ reps, peso, duracion, mejora }`). **Nunca toca `hecho`** ni el resto de
  `plan`. Lo que hace él se guarda en `hecho`; el historial enseña las dos cosas por separado.
- **Resultado frente a la propuesta** (`resultadoFrenteAPropuesta`, derivado): supera · igual · por debajo · sin hacer.

**Repeticiones enteras o de media en media** (una sola regla en `src/lib/numerosFitness.js`, AJ-23): valen 6 · 6,5 ·
7; 6,2 o 7,8 se **rechazan con una frase** y no se redondean. Se aplica al escribir (plantilla con su campo, directo),
en el motor (`editarSerie` no escribe un valor que no vale), en la validación de la plantilla (importaciones), en la
progresión (se ignora como dato) y al enseñar («8,5»). Al cargar **se conserva el número tal cual** (antes
`Math.round`): todo lo guardado hasta ahora es entero y sigue valiendo. ± conserva la media (8,5 → 9,5).

**Interfaz** (sin rehacer el entrenamiento en directo: temporizadores, descanso, marcado, edición, navegación y
finalización intactos):
- En el campo de repeticiones, **la propuesta de fondo en verde suave** (con una flecha si es una mejora); en cuanto
  él escribe, manda lo suyo. VoiceOver la lee como «Propuesta: 10,5». Teclado decimal.
- Una frase arriba de la tabla («Propuesta de mejora en verde. Es solo una guía: tú decides.»).
- «Has progresado», discreto, en una serie hecha que supera su propuesta; si se queda por debajo, «No pasa nada. No
  todos los días se mejora. Lo importante es mantener la constancia.» **una vez** por entrenamiento.
- Un valor que no vale (8,2) marca el campo y lo dice («Entera o media: 8 u 8,5»), sin guardar nada.
- Historial: debajo de lo hecho, «Propuesta: 10,5».

**Migración M2 (versión 2 → 3)** (`src/lib/migracionFitnessV3.js`; **solo código y pruebas, sin ejecutar sobre datos
reales**): pone `preferencias.progresion = 'manual'` si falta y nada más; valida con la huella de la M1 y no toca ninguna
sesión. Existe para que una aplicación de la Fase 4 (que conoce hasta la 2) deje de guardar al ver la 3 y no redondee
las medias repeticiones (AJ-24). Al ser aditiva y no tocar sesiones, no necesita copia previa y se guarda al cargar.

**Cambios en el modelo** (aditivos, con su normalizador, regla 5): `DEFAULT_FITNESS.version` = 3 y `preferencias`;
`serie.plan.propuesta`; `ejercicioDeSesion.linea.id` y `linea.progresion`; las repeticiones admiten medias en la línea,
la serie y la foto; `preferencias` entra en `CAMPOS_GUARDADOS`.

**Archivos** — nuevos: `src/lib/migracionFitnessV3.js`, `src/components/progresionFitness.jsx`,
`scripts/test-progresion-fitness.mjs`. Modificados: `src/lib/progresion.js`, `numerosFitness.js`, `fitness.js`,
`entrenamiento.js`, `entrenamientoUx.js`, `constructor.js`, `sustitucion.js`, `historial.js`, `persistenciaFitness.js`,
`arquitecturaFitness.js`, `feedbackFitness.js`, `integracionFitness.js`; `src/App.jsx`; `src/views/FitnessView.jsx`,
`TuPlanView.jsx`, `ConstructorView.jsx`, `EntrenamientoVivoView.jsx`, `HistorialView.jsx`, `FinalizacionView.jsx`;
`src/components/sustitucion.jsx`; las pruebas `verificar.sh`, `smoke-vistas.jsx`, `test-app-real.mjs` (sección «FIT
5/8» y la versión de «FIT 4/8»), `test-entrenamiento`, `test-cumplimiento-fitness`, `test-persistencia-fitness`,
`test-auditoria-final`; y la documentación.

**Limitaciones**: por tiempo no se propone subir (AJ-21); nunca se propone subir el peso (AJ-22); el modo es global,
no por plantilla (PD-13); los lectores de fuera de Fitness muestran las repeticiones con media tal cual; sin probar en
un iPhone de verdad (R1).

Las desviaciones respecto a la arquitectura están en `ARQUITECTURA_TECNICA.md` §21 (AJ-20 a AJ-25).

### 5.5 Implementado en la Fase 6 — anotaciones por ejercicio

**Modelo definitivo** (sin estructura nueva y sin migración, AN-01). La anotación de un ejercicio es
`sesion.origen.ejercicios[].notas`, dentro de la foto de la sesión, como desde la FIT F7. Por vivir ahí ya está
vinculada a la sesión (`id`), a su fecha real (`fecha`), a la plantilla de origen (`plantillaDeSesion`), a la línea
estable (`linea.id`, en la foto desde la Fase 5), al ejercicio (`exerciseId`) y a su texto. **No depende de la
plantilla**: borrarla o editarla no toca ninguna sesión.

**Los tres niveles, separados**:
| Nota | Dónde | Quién la escribe | Qué es |
|---|---|---|---|
| General del entrenamiento | `sesion.notas` | Él, al finalizar | Observaciones de toda la sesión. |
| Del ejercicio en esa ejecución | `ejercicio.notas` (`notaDeEjercicio`) | Él, durante la sesión (se guarda sola) | **La anotación histórica.** Nace vacía. |
| De la línea de la plantilla | `plantilla.ejercicios[].notas` → en la foto, `linea.indicacion` | Él, en el editor de la plantilla | Indicación permanente. Se enseña aparte («Indicación de la plantilla») y **nunca** se copia a la anotación ni al historial (AN-03). |

**Lecturas** (`src/lib/anotacionesFitness.js`, capa «lecturas»; solo lee, nada se guarda aparte):
- `notasDeLinea`: las anotaciones de esa línea en sesiones completadas de **la misma plantilla**, de la más reciente a
  la más antigua, solo las que tienen texto. La correspondencia es **la misma función que la progresión**
  (`ejerciciosDeLineaEnSesiones`): misma plantilla, mismo `linea.id` y mismo `exerciseId`. Push A y Push B no se
  mezclan; una copia no hereda las notas de la original; dos líneas del mismo ejercicio tienen las suyas; reordenar o
  renombrar no cambia nada.
- **Nota anterior**: la primera de esa lista, con su fecha (AN-02: una ejecución sin nota no tapa la anterior).
- **Sesiones antiguas sin `linea.id`**: solo si es inequívoco (un único ejercicio así en aquella sesión y una única
  línea así hoy). Si no, la nota **no se asigna a ninguna línea**, pero sigue en su sesión y en el historial (AN-04).
- En el historial, las anteriores de un ejercicio son **solo las de antes de esa sesión** (nunca las de después).

**Cómo lo ve él**:
- En el directo, encima de la nota de hoy y solo si existe: «Indicación de la plantilla: …» y «Nota anterior · 27 de
  octubre: «…»». Si hay más de una anterior, un **⋯** discreto abre la lista (fecha, el nombre de aquel
  entrenamiento si era otro, y el texto), en un desplegable que se cierra al cambiar de ejercicio. Sin notas
  anteriores no se pinta nada.
- La nota de hoy es el botón «Notas» de siempre: el campo empieza vacío, se guarda solo a los 0,7 s, al cerrarlo, al
  cambiar de ejercicio, al salir **y al interrumpir** (salir a la pantalla de inicio del iPhone, cerrar la pestaña),
  con un tope de 1000 caracteres al escribir. Un campo de texto por ejercicio; nada de un diario aparte.
- En el historial, cada ejercicio de una sesión enseña su anotación y, con «⋯ Notas anteriores (N)», las de antes de
  esa fecha.

**Guardado y seguridad**: la nota es un campo de la sesión, así que escribirla no crea registros (no hay duplicados
por pulsación) y guardar la sesión otra vez la sustituye por id (FIT F8). Lo que se confirma tarde va sobre la sesión
de ahora (`sesionViva`, F40). Escribir la nota de hoy no toca ninguna sesión anterior. ⚠️ **Entre dos dispositivos**
sigue ganando la última escritura del objeto entero de Fitness (H-11): si se escribe a la vez en dos, puede perderse
la del otro. No hay garantía de servidor sin SQL (PD-03).

**Migración**: no hace falta: las notas ya están en su sesión, y las de antes de la Fase 5 se asocian solo si es
inequívoco, sin escribir nada. M1 y M2 no tocan ninguna nota (comprobado).

**Archivos** — nuevos: `src/lib/anotacionesFitness.js`, `scripts/test-anotaciones-fitness.mjs`. Modificados:
`src/lib/progresion.js` (la correspondencia, compartida), `entrenamiento.js` (`linea.indicacion` en la foto),
`historial.js` (`notasAnteriores`), `arquitecturaFitness.js` (capa); `src/views/EntrenamientoVivoView.jsx`,
`HistorialView.jsx`, `FitnessView.jsx`; las pruebas `verificar.sh`, `smoke-vistas.jsx` y `test-app-real.mjs` (sección
«FIT 6/8»); y la documentación.

**Limitaciones**: la indicación de la plantilla solo llega a las sesiones empezadas desde esta fase (las de antes no
la llevaban en la foto); entre dispositivos, la última escritura gana; la nota de una sesión de «Completar
entrenamiento» no se puede escribir desde esa tarjeta (no tiene directo); sin probar en un iPhone de verdad (R1).

Las desviaciones respecto a la arquitectura están en `ARQUITECTURA_TECNICA.md` §22 (AJ-26 a AJ-29).

### 5.6 Implementado en la Fase 7 — historial, calendario de cumplimiento y estadísticas

**Estructura del historial** (Fitness → Entrenamiento → Historial), en el orden de prioridad del prompt 7 §13:
1. **Disciplina** del periodo elegido (porcentaje, regularidad, indicadores y racha).
2. **Calendario mensual de cumplimiento** y, al tocar un día, su **detalle**.
3. La **lista** de entrenamientos de siempre, con un filtro nuevo **por plantilla**.
4. La **evolución de cada ejercicio** sigue en Progreso (la ficha de la F29), ahora con **selector de plantilla** y
   **serie a serie**.
No hay una pantalla nueva: se amplían `HistorialView` y `ProgresoView`. Nada se guarda: todo se deriva de las sesiones y
de los estados del motor de la Fase 4 (`estadoDeFecha`), que es la única fuente de los colores (§4: «no calcules los
colores por separado»).

**Calendario** (`mesDeCumplimiento`, `CalendarioCumplimiento`): cada día con el color **y el icono** del motor —verde
(cumplido, recuperado, descanso respetado), amarillo verdoso (parcial), rojo (perdido, descanso sacrificado), borde
discontinuo (pendiente de recuperar) y apagado (hoy, futuro, sin seguimiento)—. Hoy lleva un aro y `aria-current`; los
descansos de la rutina, una luna; el día en que se hizo una recuperación, una flecha y en su etiqueta qué fecha
recuperó. Navegación entre meses (cambia de año sola). Lo anterior a `cumplimientoDesde` sale **sin seguimiento** (PD-09)
y lo futuro, sin evaluar: nada se pinta en rojo antes de tiempo.

**Detalle de una fecha** (`detalleDeFecha`, `DetalleDeFecha`): estado y motivo del motor (el sacrificado explica por
qué), qué tocaba (plantilla y rutina, o «Descanso de la rutina»), si lo cumplió una recuperación de otro día («Recuperado
el 1 de noviembre: F7 Pull», que abre ese entrenamiento) y las sesiones de ese día con su tipo (planificado,
recuperación con su fecha prevista, libre), «Parcial» y «Con «Completar entrenamiento»». Tocar una sesión abre el
detalle completo de siempre (ejercicios, series, pesos, repeticiones, lo que quedó sin hacer, anotaciones y notas
generales); al volver, el periodo, el mes y el día siguen como estaban. Un día sin registros lo dice: no se inventa
una sesión.

**Historial por plantilla** (`opcionesDePlantilla`, `consultarHistorial` con `plantilla`): el filtro «Plantilla» aparece
con dos o más; cada plantilla sale con el nombre de su ejecución más reciente (dos con el mismo nombre se numeran) y
cuántas tiene. La plantilla de cada sesión es la de la progresión (`plantillaDeSesion`), así que las duplicadas son
independientes, una plantilla borrada sigue consultable con su nombre de entonces y un entrenamiento libre sin
plantilla solo está en «Todas». Cada ficha dice su tipo, si fue parcial y si se completó con «Completar».

**Evolución por ejercicio** (`detalleCompletoDeEjercicio(…, { plantilla })`, `plantillasDelEjercicio`,
`evolucionPorSerie`): con el ejercicio en dos o más plantillas, la ficha ofrece «Plantilla: Todas · Push A · Push B».
Elegir una recorta **la gráfica, la métrica, los descartes y la tabla serie a serie** a lo hecho en ella; el último, el
mejor, la tendencia y el historial siguen siendo del ejercicio entero (la vista general complementaria, §7). La tabla
«Serie a serie» enseña las últimas seis ejecuciones (de la métrica y el periodo elegidos) con hasta ocho series por su
número del historial; lo que no se hizo es «—», nunca 0. Las gráficas siguen sin mezclar unidades (carga, lastre,
repeticiones, tiempo) y con menos de tres registros dicen por qué no se dibujan; la tabla, con menos de dos.

**Fórmula de disciplina** (`FORMULA_CUMPLIMIENTO`, también visible en la pantalla con «¿Cómo se calcula?»):
- **Evaluados** = completos + recuperados + parciales + perdidos + descansos respetados + descansos sacrificados.
- **Cumplidos** = completos + recuperados + descansos respetados + **½ × parciales**.
- **Porcentaje** = redondeo de 100 × cumplidos ÷ evaluados; sin días evaluados, «—» (no 0 %).
- **No cuentan**: los pendientes (aún se pueden recuperar), hoy, los días futuros y los días sin seguimiento.
- Una recuperación cuenta **una vez**, en su fecha prevista («Recuperado»); el día en que se hizo es un descanso
  sacrificado si era de descanso, o el entrenamiento de ese día si no. Nunca dos veces.
- Las sesiones de «Completar entrenamiento» cuentan como completas (D-03); los perdidos son los caducados (D-02).

**Indicadores** (`estadisticasDeDisciplina`): previstos, completos, recuperados, parciales, perdidos, pendientes,
descansos respetados, descansos sacrificados, libres (sesiones fuera de lo previsto), regularidad en palabras («4,5 de 6
días evaluados cumplidos») y la **racha de cumplimiento** actual y mejor (PD-06, provisional): la suman cumplidos,
recuperados, parciales y descansos respetados; la cortan perdidos y descansos sacrificados; los pendientes y hoy no la
cortan ni la suman. Es propia de Fitness y no toca la racha global de Rachas. Ni puntos, ni niveles, ni recompensas.

**Periodos** (`rangoDePeriodo`), con fechas naturales en local: **últimos 7 días** (hoy y los seis anteriores, móvil, no
de lunes a domingo), **últimos 30 días** (hoy y los 29 anteriores; el de por defecto), **este mes** (del día 1 a hoy),
**mes anterior** (entero, también de enero a diciembre del año anterior) y **elegir fechas** (dos fechas, en cualquier
orden; lo que pase de hoy no se cuenta). El rango que se cuenta se enseña siempre debajo de los botones.

**Almacenamiento y escalabilidad**: no cambia (PD-05): todo sigue en el objeto `fitness`. El análisis del motor se
calcula una vez por estado de Fitness (caché del motor de la Fase 4) y lo reutilizan los indicadores, el calendario y
el detalle; con 1000 sesiones, 30 días de estadísticas y un mes de calendario tardan bastante menos de 4 s en Node, y
otro mes reutiliza el análisis. La lista sigue paginada de 30 en 30.

**Compatibilidad histórica**: las sesiones de antes no se tocan (comprobado: ninguna lectura escribe). Lo anterior a
`cumplimientoDesde` es «Sin seguimiento»; una sesión antigua sin plantilla reconocible no se asigna a ninguna (solo en
«Todas»).

**Pruebas**: `scripts/test-disciplina-fitness.mjs` (81 comprobaciones: periodos y sus límites de mes, año y bisiesto,
los estados del calendario, días futuros y sin datos, descansos respetados y sacrificados, completos, parciales,
perdidos, recuperaciones, caducidad, «Completar», fecha prevista y real, porcentajes, racha, cambio de mes, historial por
plantilla, duplicadas, eliminadas, evolución por plantilla y serie a serie, datos insuficientes, 1000 sesiones y que
ninguna estadística contradice al motor); 13 casos más de renderizado (4324 en total); y la sección «FIT 7/8» del recorrido de
Chromium (disciplina, fórmula, periodos, fechas elegidas, calendario con hoy, pendiente, sacrificado, recuperado y
parcial, detalle de una recuperación que abre su entrenamiento y vuelve donde estaba, 375 y 320 px, filtro por
plantilla, sin errores y sin escribir nada).

**Archivos** — nuevos: `src/lib/disciplinaFitness.js`, `src/components/disciplinaFitness.jsx`,
`scripts/test-disciplina-fitness.mjs`. Modificados: `src/lib/historial.js` (plantilla, tipo y «Completar» en la ficha;
filtro y opciones por plantilla), `src/lib/detalleEjercicio.js` (evolución por plantilla y serie a serie),
`src/components/cumplimientoFitness.jsx` (`iconoDeCumplimiento`), `src/views/HistorialView.jsx`,
`src/views/ProgresoView.jsx`, `arquitecturaFitness.js` y `feedbackFitness.js` (registro de archivos); las pruebas
`verificar.sh`, `smoke-vistas.jsx`, `test-app-real.mjs` (sección «FIT 7/8») y `test-motion-f4.mjs` (su comprobación de
la clave de la gráfica admite ahora la plantilla, sin dejar de exigir periodo y métrica); y la documentación.

**Limitaciones**: el calendario **neutro** de actividad de Progreso → Resumen (F31) sigue donde estaba, con sus
estados de actividad (entrenado / sin registro); el de cumplimiento vive en Historial. Unificarlos o retirar el viejo es
integración global (Fase 8). La racha es provisional (C-79). Sin probar en un iPhone de verdad (R1).

Las desviaciones respecto a la arquitectura están en `ARQUITECTURA_TECNICA.md` §23 (AJ-30 a AJ-33).

### 5.7 Implementado en la Fase 8 — integración y verificación final

**Calendario unificado.** Ya no hay dos calendarios. El de Historial (`CalendarioCumplimiento`) es **el único**, y recoge
lo que daba el de Progreso → Resumen (F31):
| Lo que tenía el de Progreso | Dónde está ahora |
|---|---|
| Vista de **semana** (lunes a domingo) | Botón «Semana · Mes» del calendario unificado (`semanaDeCumplimiento`), con navegación entre semanas. |
| Vista de **mes** con navegación | La del calendario unificado (`mesDeCumplimiento`). |
| Qué se entrenó cada día, con palabras («entrenamiento Push», «2 entrenamientos: Legs y Core») | En la etiqueta de cada día y con un ● (●2 si son varios), **también antes del seguimiento** (sin inventarle un estado: sale «Sin seguimiento»). |
| Un día con varios entrenamientos, para elegir | El detalle del día lista sus sesiones y cada una abre su detalle. |
| Leyenda con palabras | La del unificado, más «● Entrenamiento registrado». |
| Acceso desde Progreso | Progreso → Resumen conserva su actividad (último entrenamiento, esta semana, adherencia, constancia y recientes) y, donde estaba el calendario, **«Ver el calendario»**, que abre el Historial; desde allí «Volver a Progreso». |
Los colores y estados son los de la Fase 7 (verde, amarillo verdoso, rojo, pendiente y apagado), con sus indicadores de
descanso, recuperación y detalle. La ventana de 7 días de Tu Plan (Fase 4) no es un calendario: se queda, y dice lo mismo
que el calendario de cada día (comprobado).

**Rachas definitivas (PD-06, decisión de Josué del 2026-11-06).** Una sola fuente: `diasDeActividadDeEntrenamiento`
(`disciplinaFitness.js`), que da cada día con seguimiento como **suma** (completo, recuperado, parcial, descanso
respetado), **corta** (perdido —ya caducado— y descanso sacrificado) o **neutro** (pendiente todavía recuperable y hoy).
- La racha de Fitness (Historial y la cabecera de Fitness) sale de ahí. El parcial **mantiene** la racha, aunque en el
  porcentaje de disciplina siga contando medio.
- La **racha global de entrenamiento** de la pantalla Rachas usa la misma lista: `proyectarRachasDeEntrenamiento`
  (`rachasServicio.js`) presenta cada racha de tipo `training` con la regla interna «Según tu rutina de Fitness»
  (`segun_fitness` en `rachas.js`: los neutros no tocan y los cortes cortan también hoy). App.jsx calcula una vez
  `rachasVistas` y se la da a todo lo que **lee** rachas (Inicio, Fitness, Rachas, Productividad, Imagen personal, el
  aviso de racha en riesgo, los logros); crear, marcar, deshacer y eliminar siguen escribiendo sobre `rachas`. La
  proyección **nunca se guarda**.
- **Sin seguimiento en Fitness** (sin rutina ni `cumplimientoDesde`), la racha de entrenamiento sigue como siempre, a mano:
  no hay otro criterio con el que unificarla. **Con seguimiento**, sus marcas a mano se conservan guardadas pero no
  cuentan, y en Rachas la ficha dice «Se lleva sola desde Fitness» en vez de «Marcar hoy».
- **Antes del seguimiento no se cuenta nada** (PD-09): no se inventa cumplimiento de fechas anteriores.
- Las demás rachas (sueño, estudio, hábitos, personalizadas) no cambian: sus definiciones y eventos salen idénticos.
- Hoy en un día de descanso no pide nada (no sale «por mantener hoy»); hoy en un día de entrenamiento sin hacer, sí.

**Integración de las siete fases.** `scripts/test-integracion-final-fitness.mjs` pasa un mismo escenario por todos los
motores con las funciones de las pantallas (los 17 puntos del prompt 8 §9 menos el 17, que es de Chromium) y compara la
racha de Fitness con la global en 50 días y patrones. La sección «FIT 8/8» del recorrido lo hace en la aplicación.

**Incidencias corregidas en la Fase 8:**
1. **Un descanso sacrificado hoy no cortaba la racha global** (el motor de rachas nunca da por perdido el día en curso). Lo
   cazó la comparación de las dos rachas: la regla `segun_fitness` declara `corta` y el motor lo respeta también hoy;
   ninguna otra regla lo declara.
2. **Pisé `scripts/test-integracion-fitness.mjs`** (la suite de la FIT F36) al crear la de esta fase con el mismo nombre. Se
   restauró de git (148 ✓) y la nueva es `test-integracion-final-fitness.mjs`.
3. Las comprobaciones de la F31 del recorrido y de `test-actividad-entrenamiento` que miraban el calendario de Progreso se
   **dieron la vuelta**: miden lo mismo en el unificado (los siete días con sus entrenamientos, el día con dos, el mes) y
   que Progreso ya no tiene uno propio. Los seis casos de renderizado del calendario viejo se sustituyeron por seis del
   unificado con los mismos datos (el banco sigue en 4324).
4. PD-06 pasó a definitiva: su comprobación de la Fase 7 se dio la vuelta.

**Datos y compatibilidad (comprobado en Node):** versión 3; una cuenta v1 sube a v3 conservando campos que no conoce;
datos de una versión más nueva no se migran (la aplicación los abre en solo lectura); lo que la carga no entiende va a la
cuarentena; ninguna lectura (disciplina, calendario, racha) escribe en las sesiones; ni la proyección de rachas se guarda.
⚠️ **Escrituras concurrentes:** sigue ganando la última escritura del objeto entero (H-11), y la regla de una sesión por
fecha solo la garantiza el cliente. La garantía de servidor necesita ejecutar `docs/15_FITNESS/sql/fitness_reserva_fechas.sql`
y el código que reserva la fecha (PD-03): **pendiente de autorización**, no se presenta como resuelta.

**Archivos** — nuevos: `scripts/test-integracion-final-fitness.mjs`. Modificados: `src/lib/disciplinaFitness.js` (la
fuente única, semana, sesiones registradas), `src/components/disciplinaFitness.jsx` (Semana · Mes, ●, leyenda),
`src/components/actividadEntrenamiento.jsx` (sin calendario; acceso al unificado), `src/lib/rachas.js` (regla
`segun_fitness`, `corta`, `derivada`), `src/lib/rachasServicio.js` (`proyectarRachasDeEntrenamiento`), `src/App.jsx`
(`rachasVistas`), `src/views/RachasView.jsx` (sin «Marcar hoy» en la derivada; la regla interna no se ofrece al crear),
`src/views/HistorialView.jsx`; las pruebas `verificar.sh`, `smoke-vistas.jsx`, `test-app-real.mjs` (F31 dada la vuelta y
«FIT 8/8»), `test-actividad-entrenamiento.mjs`, `test-disciplina-fitness.mjs`; y la documentación.

**Limitaciones y lo que queda fuera:** sin probar en un iPhone de verdad ni con Supabase real (R1); PD-03 (servidor) y
H-11 (concurrencia) necesitan SQL que ejecuta Josué; PD-01, PD-02 y PD-08 siguen con su lectura provisional de la Fase 4
(C-77) mientras él no diga otra cosa; `mesDeActividad` y `sesionesDelDiaDeActividad` (F31) se conservan con sus pruebas
pero ya no los pinta ninguna pantalla.

Las desviaciones respecto a la arquitectura están en `ARQUITECTURA_TECNICA.md` §24 (AJ-34 a AJ-37), y la auditoría de
las ocho fases, en `docs/15_FITNESS/INFORME_AUDITORIA_FINAL.md`.

## 6 · Las ocho fases del proyecto

1. **Contexto, auditoría y documento maestro** — este documento.
2. **Arquitectura técnica, modelo de datos y migración** — `docs/15_FITNESS/ARQUITECTURA_TECNICA.md`.
3. **Biblioteca de rutinas y plantillas, y planificación.**
4. **Cumplimiento, descansos y recuperación.**
5. **Progresión: Manual, Progresivo y Experto.**
6. **Anotaciones por ejercicio.**
7. **Historial, calendario y estadísticas.**
8. **Integración global, auditoría final y verificación.**

Cada una depende de todas las anteriores (Anexo A del plan). El texto completo de cada fase está en el
plan maestro.

## 7 · Estado de cada fase

| Fase | Estado | Nota |
|---|---|---|
| 1 | **Completada** (2026-11-03) | Criterios comprobados en `SEGUIMIENTO_FASES.md`. `verificar.sh`: un fallo heredado de `main` (PD-07). |
| 2 | **Completada** (2026-11-03) | `docs/15_FITNESS/ARQUITECTURA_TECNICA.md`. Criterios en `SEGUIMIENTO_FASES.md`. |
| 3 | **Completada** (2026-11-03) | Apartado 5.2. Criterios en `SEGUIMIENTO_FASES.md`. `verificar.sh`: todo en verde salvo H-25 (PD-07, ajeno): Chromium 3930 ✓ / 1 ✗, renderizado 4188 ✓. |
| 4 | **Completada** (2026-11-04) | Apartado 5.3. Criterios en `SEGUIMIENTO_FASES.md`. `verificar.sh` en verde (EXIT 0): Chromium 3969 ✓ / 0 ✗, renderizado 4220 ✓. Lecturas provisionales de PD-01, PD-02 y PD-08 por confirmar (C-77); garantía de servidor pendiente de su SQL (PD-03). |
| 5 | **Completada** (2026-11-06) | Apartado 5.4. Criterios en `SEGUIMIENTO_FASES.md`. `verificar.sh` completo en verde (EXIT 0): Chromium 3994 ✓ / 0 ✗, renderizado 4260 ✓. PD-13 aplicada con su propuesta (global; la copia empieza su historial). |
| 6 | **Completada** (2026-11-06) | Apartado 5.5. Criterios en `SEGUIMIENTO_FASES.md`. `verificar.sh` completo en verde (EXIT 0): Chromium 4016 ✓ / 0 ✗, renderizado 4272 ✓. |
| 7 | **Completada** (2026-11-06) | Apartado 5.6. Criterios en `SEGUIMIENTO_FASES.md`. `verificar.sh` completo en verde (EXIT 0): Chromium 4042 ✓ / 0 ✗, renderizado 4324 ✓. PD-06 aplicada con lectura provisional (C-79); PD-09 aplicada con su propuesta. |
| 8 | **Completada** (2026-11-06) | Apartado 5.7. Criterios en `SEGUIMIENTO_FASES.md`; auditoría en `docs/15_FITNESS/INFORME_AUDITORIA_FINAL.md`. `verificar.sh` completo en verde (EXIT 0, «TODO CORRECTO»): Chromium 4075 ✓ / 0 ✗, renderizado 4324 ✓, `test-integracion-final-fitness` 52 ✓, «FIT 8/8» 26 ✓; unas 35 000 comprobaciones en total. Pendiente de autorización externa: PD-03 (SQL) y la prueba en el iPhone (R1). |

## 8 · Criterios de aceptación

Los criterios de cada fase están, completos, al final de su prompt en el plan maestro (fase 2: 13;
fase 3: 13; fase 4: 15; fase 5: 15; fase 6: 14; fase 7: 15; fase 8: 15). Los de la Fase 1 (prompt 1 §6 y
§9) y su comprobación están en `SEGUIMIENTO_FASES.md`.

## 9 · Pruebas existentes y pruebas pendientes

**Existentes:** desde la Fase 3, `scripts/test-rutinas-ciclicas.mjs` (rutinas de 1, 7 y 30 días, fuera de rango,
incompletas, plantillas repetidas, descansos, ciclo, activar y cambiar, editar la activa, en uso, eliminar una
plantilla de la rutina activa, papelera, integridad y guardia de versión), seis casos de renderizado más y la
sección «FIT 3/8» del recorrido de Chromium. Y antes, 52 suites de Node relacionadas con Fitness en `scripts/` (planes, plantillas, tu plan,
planificación semanal, actividad, entrenamiento, finalización, historial, persistencia, progresión,
rangos, objetivos, fotos, arquitectura, acabado, release…), el banco de renderizado
(`scripts/smoke-vistas.jsx`) y las secciones `FIT F…` del recorrido en Chromium
(`scripts/test-app-real.mjs`). Todo entra en `bash scripts/verificar.sh`.

**Pendientes** (no existe ninguna prueba hoy), por fase:
- **2–3:** ✅ hechas en la Fase 3 (guardia de versión, ids estables, rutinas de 1, 7 y 30 días y el resto de
  esta lista). Pendiente para la Fase 4: la migración v1 → v2 (idempotencia, validación previa, copia
  `fitness_respaldo_v1`, ninguna sesión tocada, ciclo de cada fecha igual antes y después). Lista original: duraciones fuera de rango; rutinas incompletas; plantillas
  repetidas; ciclo que vuelve al día 1; cambio de rutina; borrado de una plantilla en uso; recuperación sin
  pisar asignaciones; conservación de ids de los predeterminados.
- **4:** ✅ hechas en la Fase 4 (`scripts/test-cumplimiento-fitness.mjs`, casos de renderizado y la sección «FIT
  4/8» del recorrido): ventana de 7 días; fin de día; pendientes; caducidad individual por dos entrenamientos
  posteriores; los dos ejemplos del §7 y los casos 1–14; recuperación en descanso y en lugar de la de hoy; una
  sesión por fecha desde cualquier pantalla (desde **otro dispositivo** solo se puede comprobar que ninguna se
  borra y la segunda queda en conflicto: la garantía de servidor es PD-03); sesión parcial y sin series;
  «Completar entrenamiento»; fecha prevista y real; persistencia; secuencia larga; y la migración M1.
- **5:** ✅ hechas en la Fase 5 (`scripts/test-progresion-fitness.mjs`, casos de renderizado y la sección «FIT 5/8»
  del recorrido): los tres modos; interruptor por ejercicio; comparación por plantilla y por línea; independencia entre
  plantillas; sesiones antiguas (inequívocas y ambiguas); duplicadas; reordenadas; cambios en el número de series y en
  el peso; peso, peso corporal, lastre y tiempo; repeticiones enteras y medias y rechazo de otros decimales; resultado
  superior, igual e inferior; sin datos; `plan` frente a `hecho`; «Completar entrenamiento»; historial intacto; la M2.
- **6:** ✅ hechas en la Fase 6 (`scripts/test-anotaciones-fitness.mjs`, casos de renderizado y la sección «FIT 6/8» del
  recorrido): crear, editar y guardar; nota anterior; campo nuevo vacío; antiguas en orden; líneas repetidas; reordenadas;
  duplicadas; eliminadas; historial con las anteriores a cada fecha; sin `linea.id` (inequívoca y ambigua); nota general;
  nota de plantilla; migración; guardados repetidos (sin duplicados); finalizar; interrupción; recargar.
- **7:** ✅ hechas en la Fase 7 (`scripts/test-disciplina-fitness.mjs`, casos de renderizado y la sección «FIT 7/8» del
  recorrido): colores del calendario; fórmula de cumplimiento; periodos y sus límites; historial por plantilla;
  evolución por plantilla y serie a serie; grandes volúmenes.
- **8:** ✅ hechas en la Fase 8 (`scripts/test-integracion-final-fitness.mjs` y la sección «FIT 8/8» del recorrido): los 17 puntos del prompt 8 §9 y la igualdad de las dos rachas. ⚠️ El escenario G (que **el servidor** impida el duplicado) no se puede comprobar sin PD-03.
- **Fechas:** cambio de día con la aplicación abierta: ✅ en el motor (fechas fijas) y Fitness recibe `hoy` de
  `useHoyISO` (Fase 4); sin probar en el iPhone de verdad a medianoche.

## 10 · Incidencias y decisiones no resueltas

| Id | Qué falta | Afecta a |
|---|---|---|
| **PD-01** | **Qué cuenta como «entrenamiento realizado» para la caducidad.** 🟡 **Lectura provisional aplicada en la Fase 4** (C-77): una sesión **parcial** y una **libre** cuentan (D-02 dice «realizados» y el caso 11 solo excluye «ninguna serie»). Es un parámetro (`REALIZADO`): falta que Josué lo confirme. | Confirmación de Josué |
| **PD-02** | **«Completar entrenamiento» en fechas pasadas.** 🟡 **Lectura provisional aplicada en la Fase 4** (C-77): hoy o un día pasado, y cuenta **en esa fecha** (la real que él declara). Riesgo: deja cumplido un día pasado aunque su pendiente hubiera caducado. Falta que Josué lo confirme. | Confirmación de Josué |
| **PD-03** | **Garantía de una sesión por fecha en el servidor:** imposible con el objeto único de `app_data`. La Fase 4 la deja **en el cliente** y prepara el SQL (`docs/15_FITNESS/sql/fitness_reserva_fechas.sql`, **sin ejecutar**). Ejecutarlo y escribir el código que reserva y libera la fecha necesita la autorización de Josué. | Fases 4 (cliente ✅) y 8 |
| **PD-04** | **Destino formal de la PR #2:** no se fusiona ni se descarta; su función se rehace en la fase 4 sobre el modelo de la Fase 2. Falta decidir qué pasa con sus cambios de chatbots, que no son de este proyecto. | — (ajena) |
| **PD-05** | **Almacenamiento a largo plazo:** evaluado en la Fase 2 (§13 de la arquitectura). Propuesta: seguir en el objeto hasta que la fila pase de 2 MB o los guardados de 2 s en el iPhone; entonces, tabla de sesiones (SQL de Josué). | Ninguna fase |
| **PD-06** | **Racha de entrenamiento.** ✅ **Definitiva en la Fase 8** (decisión de Josué del 2026-11-06, C-79): suman completo, recuperado, parcial y descanso respetado; cortan perdido y descanso sacrificado; pendiente, hoy, futuro y sin seguimiento no cortan. La racha global de entrenamiento usa la misma fuente (`diasDeActividadDeEntrenamiento`). | — |
| **PD-08** | Una sesión **parcial**. 🟡 **Lectura provisional aplicada en la Fase 4** (C-77; el documento no traía propuesta): la fecha queda **parcial (amarillo verdoso) y no pendiente**, como dice el caso 10; una recuperación parcial deja así su fecha prevista. Falta que Josué lo confirme. | Confirmación de Josué |
| **PD-09** | Fechas **anteriores a la entrada en vigor** del sistema. ✅ **Aplicada en la Fase 7** con la propuesta: «Sin seguimiento», sin color de cumplimiento, y fuera de toda estadística. | — |
| **PD-10** | ¿Una sesión **descartada** libera la fecha? ✅ **Aplicada en la Fase 4** con la propuesta: sí. | — |
| **PD-11** | ¿Una serie planificada **omitida** hace la sesión parcial? ✅ **Aplicada en la Fase 4** con la propuesta: sí. | — |
| **PD-12** | ¿Un pendiente cuya **plantilla está en la papelera** deja de ser recuperable hasta restaurarla? ✅ **Aplicada en la Fase 4** con la propuesta: sí, con su motivo, y su caducidad sigue contando. | — |
| **PD-13** | Modo de progresión **global o por plantilla**; ¿una plantilla **duplicada** hereda el historial? ✅ **Aplicada en la Fase 5** con la propuesta: global (`preferencias.progresion`); la copia empieza el suyo (ids nuevos). | — |
| **PD-07** | **`main` no pasa `verificar.sh` los lunes y martes** (H-25). ✅ **Resuelta en la Fase 4** con autorización de Josué: se aplicó el parche aislado que solo cambia esa comprobación de `scripts/test-app-real.mjs` (calcula lo esperado de las noches sembradas y del periodo que la aplicación llama «la semana pasada»). No toca los chatbots ni trae nada de la PR #2. Comprobado en `verificar.sh` un martes (caso de una noche). | — |

Incidencias técnicas conocidas (no son decisiones): repeticiones redondeadas en silencio; nota de la
plantilla que no pasa a la sesión; «Última vez» por ejercicio; `origen.id` con dos papeles (id de día en
los predeterminados, id de plantilla en las propias); sesiones anteriores a la F32 con ids de día
aleatorios que no se pueden emparejar. Y de la Fase 2: **ids de línea aleatorios en los planes** (cambian en
cada carga); **una versión vieja de la aplicación borra los campos nuevos de las sesiones al guardar** y no
se detiene ante datos de una versión más nueva (por eso la guardia de versión va primero).

## 11 · Registro de cambios

| Fecha | Fase | Cambio | Archivos |
|---|---|---|---|
| 2026-11-03 | 0 | Plan maestro (§0 y ocho prompts literales) y seguimiento. | `docs/15_FITNESS/PLAN_DESARROLLO/*` |
| 2026-11-03 | 0 | Decisiones D-01 a D-05 incorporadas a los prompts; conflictos CF-01 a CF-14 resueltos o convertidos en PD; documentos movidos a la rama `claude/fitness-rediseno`. | `docs/15_FITNESS/PLAN_DESARROLLO/*` |
| 2026-11-03 | 1 | Este documento; entradas en `docs/00_INDICE.md` y `CLAUDE.md`. Sin cambios de código ni de datos. | `docs/FITNESS_DOCUMENTO_MAESTRO.md`, `docs/00_INDICE.md`, `CLAUDE.md` |
| 2026-11-03 | 3 | Biblioteca de rutinas y plantillas, editor de rutinas, ciclo, en uso, borrados con días a descanso, papelera, guardia de versión; pruebas nuevas. Apartado 5.2. | Ver apartado 5.2 |
| 2026-11-04 | 4 | Motor de cumplimiento, descansos y recuperación; una sesión por fecha; «Completar entrenamiento»; migración M1 (solo código y pruebas); PD-07 resuelta. Apartado 5.3. | Ver apartado 5.3 |
| 2026-11-06 | 6 | Anotaciones por ejercicio: nota anterior de la línea con su fecha, ⋯ con las antiguas, historial, indicación de la plantilla aparte, guardado al interrumpir; sin modelo nuevo ni migración. Apartado 5.5. | Ver apartado 5.5 |
| 2026-11-06 | 8 | Integración: calendario unificado (el de Progreso se retira y queda su acceso), racha única de entrenamiento en Fitness y en Rachas (PD-06 definitiva), suite de integración y «FIT 8/8»; restaurada una suite pisada por error. Apartado 5.7. | Ver apartado 5.7 |
| 2026-11-06 | 7 | Historial y estadísticas: disciplina por periodos con fórmula documentada, racha (PD-06 provisional), calendario de cumplimiento, detalle de cada fecha, historial por plantilla, evolución por plantilla y serie a serie; sin cambios de datos. Apartado 5.6. | Ver apartado 5.6 |
| 2026-11-06 | 5 | Progresión Manual, Progresivo y Experto; interruptor por ejercicio; comparación por plantilla y línea; repeticiones enteras o de media en media; propuesta separada de lo hecho; migración M2 (solo código y pruebas); PD-13 aplicada. Apartado 5.4. | Ver apartado 5.4 |
| 2026-11-03 | 2 | Arquitectura técnica; apartado 5.1, estado, pruebas pendientes, PD-08 a PD-13 y riesgos de este documento. Sin cambios de código ni de datos. | `docs/15_FITNESS/ARQUITECTURA_TECNICA.md`, este documento |

---

## 12 · Estado final del rediseño y mantenimiento

**Estado:** las ocho fases están completadas en código y pruebas (apartado 7). Nada está en `main` ni desplegado, nada
se ha ejecutado contra Supabase y todo vive sin commit en la rama `claude/fitness-rediseno`.

**Motores y responsabilidades** (cada pregunta tiene una sola función que la contesta):
| Pregunta | Quién la contesta |
|---|---|
| Qué rutina está activa y qué tocaba cada día | `rutinasCiclicas.js`, `tuPlan.js` (`planActivoCompleto`, `planificadoEnFecha`) |
| El estado de una fecha (cumplido, parcial, pendiente, perdido, descansos, recuperado) y la caducidad | `cumplimientoFitness.js` (`estadoDeFecha`, `analisisDeCumplimiento`) |
| Si se puede empezar una sesión ese día y de qué clase es | `prepararSesionNueva` (`cumplimientoFitness.js`) |
| «Completar entrenamiento» | `completarEntrenamiento.js` |
| Qué se propone en cada serie (Manual · Progresivo · Experto) y con qué se compara | `progresion.js` (`conPropuestas`, `ejerciciosDeLineaEnSesiones`) |
| Repeticiones válidas (enteras o de media en media) | `numerosFitness.js` (`repeticionValida`) |
| La nota anterior y las antiguas | `anotacionesFitness.js` |
| Disciplina, periodos, calendario, detalle de un día | `disciplinaFitness.js` |
| **Qué día cuenta como actividad de entrenamiento (las dos rachas)** | `diasDeActividadDeEntrenamiento` (`disciplinaFitness.js`), proyectada en Rachas por `proyectarRachasDeEntrenamiento` |
| Historial, filtros, plantilla de cada sesión | `historial.js`, `plantillaDeSesion` (`progresion.js`) |
| Evolución de un ejercicio (también por plantilla y serie a serie) | `detalleEjercicio.js` |
| Carga, versión, migraciones y cuarentena | `persistenciaFitness.js`, `migracionFitnessV2.js` (M1), `migracionFitnessV3.js` (M2) |

**Modelo y persistencia:** un solo objeto `fitness` en `app_data` (versión 3); las sesiones guardan su foto (`origen`), su
`diaDePlan` (clase, fecha prevista, plantilla, línea) y sus notas. Nada derivado se guarda (estados, porcentajes, rachas,
propuestas fuera de `plan.propuesta`). Ver la arquitectura (§4–§13 y §19–§24).

**Para mantenerlo:**
- Un cambio en Fitness se termina con `bash scripts/verificar.sh` en verde, incluidas las suites de las fases 3–8 y las
  secciones «FIT 3/8» a «FIT 8/8» del recorrido.
- Un archivo nuevo de Fitness va a su capa de `CAPAS_FITNESS` y, si es un componente, a `ARCHIVOS_FITNESS`.
- Un campo nuevo guardado va a su normalizador (regla 5) y a `CAMPOS_GUARDADOS`; si cambia la forma de algo guardado,
  una migración en `MIGRACIONES_FITNESS` y subir `DEFAULT_FITNESS.version`.
- Un estado o color nuevo de un día se añade **en `cumplimientoFitness.js`** y, si cuenta para la racha, en
  `ACTIVIDAD_DE_ENTRENAMIENTO`: nunca en una pantalla.
- Ninguna pantalla guarda `rachasVistas`.
- **Antes de crear un archivo, buscar el nombre** (Fase 8, incidencia 2).

## Anexo 1 — Riesgos técnicos y posibles pérdidas de datos

1. **Guardado del objeto entero y última escritura gana:** dos dispositivos pueden pisarse; con la regla
   de una sesión por día, dos sesiones del mismo día desde dos dispositivos no se pueden impedir sin
   cambios en el servidor (PD-03).
2. **Regla 5 del proyecto:** un campo nuevo que el normalizador no conozca se pierde en el siguiente
   guardado. Todo campo nuevo (fecha prevista, tipo de cumplimiento, id de línea, progresión, rutinas)
   tiene que entrar en el modelo y en su normalizador **antes** de escribirse.
3. **Migración de los planes predeterminados a rutinas:** las sesiones apuntan a `planId` y a ids de día
   (`ppl-estetico-dia-1`) en `origen.id` y `diaDePlan`; cambiar esos ids rompería el historial y
   `planesAnteriores`.
4. **Sesiones antiguas ambiguas:** varias el mismo día, sin series, con ids de día anteriores a la F32, sin
   id de línea. No se pueden reasignar a fechas previstas sin inventar: se conservan como históricas.
5. **Redondeo silencioso de repeticiones:** hoy ya altera datos al escribir 8,5; el cambio a medias tiene
   que ser compatible con lo guardado (los enteros siguen valiendo).
6. **Crecimiento de la fila de `app_data`:** ~1,1 MB al año, subida entera en cada guardado; el error
   de fila demasiado grande ya se detecta (`motivoDeFallo`, F41), pero no hay estrategia de archivo.
7. **Dependencias fuera de Fitness:** cambiar qué cuenta como entrenamiento afecta a puntuación,
   predicciones, correlaciones, logros, Inicio y el chatbot (`fechasDeEntreno`, `resumenesHub`).
8. **Auditorías y recorrido existentes:** muchas pruebas fijan los textos neutros de la F31/F32 y la
   estructura actual; se darán la vuelta, no se borrarán.
9. **Transición entre versiones (Fase 2):** una pestaña o un dispositivo con una versión anterior a la
   guardia de versión borraría los campos nuevos de las sesiones al guardar. Mitigación: la guardia se
   despliega una entrega antes de la migración y se recargan las pestañas abiertas ese día.

## Anexo 2 — Información necesaria para las fases siguientes

- Confirmación de las lecturas provisionales de **PD-01, PD-02 y PD-08** (Fase 4, C-77); **PD-13** se aplicó con su
  propuesta en la Fase 5 (global; la copia empieza su historial) y AJ-20 (progresión activada por defecto en cada
  ejercicio) — si prefiere otra cosa, se cambia; **PD-09** antes de la Fase 7.
- **Autorización para el SQL** de la garantía de servidor y, si la Fase 2 lo recomienda, para separar las
  sesiones (PD-03, PD-05). Josué lo ejecuta en Supabase; nunca se ejecuta desde aquí.
- Decisión sobre la parte de chatbots de la PR #2 (PD-04).
- Autorización para **commit y push** de la rama `claude/fitness-rediseno` cuando quiera que la
  documentación quede guardada fuera de este entorno.
