# 11 · ENTREGA 3 — ORDEN DE FASES

> Índice de la especificación que Josué pasó el 4 de septiembre de 2026. El texto literal está en
> **`especificaciones/ORIGINAL_ENTREGA3_PULIDO_Y_MODULOS.txt`** 🔒 **intocable**, y las líneas de
> este índice apuntan a él.

## Qué es esta entrega

**No es una continuación de la Entrega 2.** Aquélla construía siete módulos nuevos; ésta **pule y
rehace apartados que ya existen** —Hoy, Calendario, Biblioteca, Productividad, Bienestar, Nutrición,
Estudios— y arregla problemas encontrados **usando la aplicación de verdad en un iPhone**.

Eso cambia una cosa importante: aquí **casi nada se construye desde cero**. Antes de escribir una
línea hay que mirar qué hay ya en `src/views/` y en `src/lib/`, porque el 80 % de estas fases son
rediseños de pantallas que llevan meses funcionando.

⚠️ **Y Estilo de hombre sigue CONGELADO** (EH F65): si una fase de aquí tocara Estilo de hombre,
solo vale como corrección o ajuste — nunca una función nueva.

## Las 44 fases, en el orden del documento

| # | Bloque | Fase | Línea |
|---|---|---|---|
| 1 ✅ | **PG** Pulido global | Safe area, eliminaciones y apariencia — **hecha (v3.10.0)** | 1 |
| 2 ✅ | **RA+** Rachas | Mantenimiento diario y feedback de recompensa — **hecha (v3.12.0)** | 221 |
| 3 ✅ | **AR+** Armario | Categorías, iconografía y detalle visual — **hecha (v3.13.0)** | 544 |
| 4 ✅ | **EC** Economía | Hucha inteligente y pulido final — **hecha (v3.15.0)** | 741 |
| 5 ✅ | **HO+** Horario | UX, navegación y gestión de horarios — **hecha (v3.17.0)** | 1027 |
| 6 ✅ | **HC** Hoy y Calendario | F1 — Hoy: centro del día — **hecha (v3.20.0)** | 1227 |
| 7 ✅ | HC | F2 — Calendario: la agenda de un día — **hecha (v3.27.0)** | 1824 |
| 8 ✅ | HC | F3 — Calendario: la vista temporal — **hecha (v3.28.0)** | 2444 |
| 9 ✅ | HC | F4 — Acciones rápidas e integración — **hecha (v3.29.0)** | 3035 |
| 10 ✅ | HC | F5 — Planificación avanzada y vista semanal — **hecha (v3.30.0)** | 3874 |
| 11 ✅ | HC | F6 — Notificaciones y recordatorios reales — **hecha (v3.31.0)** | 4425 |
| 12 | HC | F7 — Integraciones externas de calendario | 4995 |
| 13 | HC | F8 — Estadísticas de planificación | 5490 |
| 14 | HC | F9 — Pulido visual, UX y animaciones | 6315 |
| 15 | HC | F10 — PWA, iPhone, sincronización y auditoría final | 7088 |
| 16 | **BL** Biblioteca | F1 — Rediseño como launcher de mini-apps | 7871 |
| 17 | BL | F2 — Libros | 8280 |
| 18 | BL | F4 — Guardados | 8669 |
| 19 | BL | F5 — Ideas | 9119 |
| 20 | BL | F6 — Documentos | 9565 |
| 21 | BL | F7 — Colecciones | 10585 |
| 22 | BL | F8 — Integración y experiencia global | 11028 |
| 23 | **PR** Productividad | F1 — Rediseño completo del apartado | 11582 |
| 24 | PR | F2 — Hábitos | 11959 |
| 25 | PR | F3 — Pomodoro | 12453 |
| 26 | PR | F4 — Tareas | 12798 |
| 27 | PR | F5 — Metas y objetivos | 13248 |
| 28 | PR | F6 — Rutinas | 13738 |
| 29 | PR | F7 — Integración global y sistema inteligente | 14284 |
| 30 | **BN** Bienestar | Rediseño y reorganización del apartado | 15109 |
| 31 | **NU** Nutrición | F1 — Rediseño premium | 15931 |
| 32 | NU | F2 — Sistema de días e historial | 16289 |
| 33 | NU | F3 — Configuración y objetivos nutricionales | 16496 |
| 34 | NU | F4 — Registro de comidas y consumo diario | 16835 |
| 35 | NU | F5 — Base de alimentos, personalizados y favoritos | 17190 |
| 36 | NU | F6 — Estadísticas y evolución | 17572 |
| 37 | NU | F7 — Inteligencia y análisis nutricional | 17919 |
| 38 | NU | F8 — Pulido final, integración y QA | 18240 |
| 39 | **ES** Estudios | F1 — Home tipo teléfono y nueva arquitectura | 18766 |
| 40 | ES | F2 — Estructura en árbol y navegación por ramas | 19030 |
| 41 | ES | F3 — Asignaturas y gestión académica | 19298 |
| 42 | ES | F4 — Exámenes, entregas y fechas | 19511 |
| 43 | ES | F5 — Apps de aprendizaje independientes | 20034 |
| 44 | ES | F6 — Próximos eventos, resumen e integración final | 20329 |

**Por dónde va:** 11 de 44 (**PG** v3.10.0, **RA+** v3.12.0, **AR+** v3.13.0, **EC** v3.15.0, **HO+** v3.17.0, **HC F1** v3.20.0, **HC F2** v3.27.0, **HC F3** v3.28.0, **HC F4** v3.29.0, **HC F5** v3.30.0, **HC F6** v3.31.0). La siguiente es la **12 — HC F7: integraciones externas de calendario**, línea 4995.

## Lo que dejó la Fase 1, y que afecta a todas las demás

- 🚨 **`scripts/test-borrados.mjs` revisa los 129 botones de eliminar de la aplicación.** Una fase
  que añada un botón de eliminar y no cablee su manejador **salta ahí**, no en el móvil de Josué
  tres meses después. Fue exactamente el fallo de Economía: la prop estaba en la firma de la vista y
  `App.jsx` no se la pasaba.
- 🚨 **La Safe Area vive en `index.css`** (`--safe-top`, `--safe-bottom`, `.accion-superior`,
  `.pantalla-segura`, `.nav-segura`, `.toque-44`). Una pantalla nueva que ponga algo fijo arriba o
  abajo **usa esas clases**; nunca un número a ojo, y **nunca un `top` en línea**, que gana a la
  clase y deshace la corrección sin que falle nada.
- ⚠️ **`BotonBorrar` no pregunta y eso es correcto**: lo suyo va a Eliminados recientemente. Quien
  pregunta es `BotonBorrarDefinitivo`, y solo para lo que borra un archivo de verdad
  (foto de Salud, vídeo de calistenia, archivo de Biblioteca). Antes de añadir una confirmación,
  mirar si eso se recupera.
- ⚠️ **Un bloque dentro de un `<Seccion>` no repite el título de la sección**: se le pasa `sinTitulo`.

## Y lo que dejó la Fase 2

- ⚠️ **`src/lib/rachasHoy.js` LEE, no escribe.** Ni una función que sume un día, ni una llamada a
  `completarDia`, `registrarCumplimiento` o `saveData` — hay pruebas que leen el código. La racha es
  **consecuencia del registro real** (apartado 9), y quien escribe sigue siendo `rachasServicio.js`.
- ⚠️ **Los números de rachas salen de `panelRachas` y `panelHabitos`** (RA F1 y RA F4). Un segundo
  cálculo acabaría diciendo un número distinto del de la pantalla de Rachas.
- ⚠️ **Registrar un hábito en Hábitos YA mantiene su racha**: nunca pedir la misma acción dos veces.
- ⚠️ **Las animaciones nuevas van a `index.css`** con `--ease-premium`, y así respetan solas
  "Reducir movimiento". Ninguna dura más de un segundo.

## Y lo que dejó la Fase 3

- ⚠️ **Añadir una categoría al armario es añadir su línea en `CATEGORIAS_ARMARIO` Y en
  `ICONOS_CATEGORIA`** (`src/components/iconosPrenda.jsx`). Dos listas cortas, porque una es de
  datos y la otra de componentes de React. Hay una prueba que salta si falta la segunda o si dos
  categorías comparten icono.
- 🐛 **Un campo que no lee nadie no falla nunca.** El `icono` de las categorías existía desde AR F1
  y la pantalla pintaba `<Shirt>` a pelo: los accesorios salían con una camiseta durante meses.
  Antes de añadir un campo a un catálogo, comprobar que alguien lo lea.
- ⚠️ **Los iconos propios van en la gramática de Lucide** (24×24, solo trazo, `currentColor`,
  grosor 2, remates redondeados) y salen de UNA base `<svg>` compartida. Nada de emojis.

## Y lo que dejó la Fase 4

- 🚨 **La hucha NO sale de Economía** (apartado 8), y hay cinco pruebas que leen `src/lib/hucha.js`
  buscando `objetivos`, `rachas`, `productividad`, `dashboard` y `gamificacion`. Si una fase futura
  quiere enlazar el ahorro con los objetivos globales, **tiene que pedírselo a Josué antes**.
- ⚠️ **El progreso del periodo sale de las aportaciones, no de los movimientos.** Un movimiento no
  dice si el dinero fue a la hucha, y adivinarlo por el concepto sería inventarse un dato.
- ⚠️ **`objetivoHucha` y `aportaciones` son campos nuevos de `economia`**, normalizados en `App.jsx`
  al cargar. Sin esa línea, el siguiente guardado se los lleva (regla 5).
- 🐛 **`pulsar()` del recorrido de Chromium ya busca por `aria-label`.** Un botón de solo icono no
  tiene texto, así que hasta la F4 la prueba no podía pulsar **ninguna papelera, estrella ni
  flecha** de la aplicación. Ahora sí, y es como los pulsa alguien con VoiceOver.

## Y lo que dejó la Fase 5

- 🚨 **UNA FUNCIÓN QUE NADIE LLAMA NO FALLA NUNCA.** Van **dos** en esta entrega:
  `onDeleteMovimiento` en Economía (F1) y `eliminarHorario` en Horario (F5) — las dos escritas,
  probadas y muertas. Ni el build, ni el renderizado, ni las pruebas de Node las veían. **Antes de
  dar por hecho que algo funciona, comprobar que alguien lo llame.**
- ⚠️ **Archivar y Eliminar son dos acciones distintas**, y el enunciado prohíbe sustituir una por
  otra. Solo eliminar pide confirmación (EH F61).
- ⚠️ **Un horario NO va a la papelera**: no tiene entrada en `CATALOGO_PAPELERA`, así que el aviso
  dice *"permanente"* y no promete recuperarlo.
- ⚠️ **`misHorarios.js` no recalcula nada del horario**: decide qué llamar, como `gestionModulos.js`.
- 🐛 **El limpiador de comentarios de una prueba NO puede usar un patrón de "llave, comentario,
  llave"** para los comentarios JSX: se come el código a partir del primer `(() => {` con comentario
  dentro. Quitar primero los bloques de comentario, después las llaves vacías.

## Y lo que dejó la Fase 6 (HC F1)

- 🚨 **UNA SOLA FUENTE DE VERDAD, Y LA FORMA DE CUMPLIRLO ES NO TENER COPIA** (apartados 24 y 25).
  El resumen y el progreso de Hoy se derivan de las entidades originales en el momento, así que
  marcar una tarea en Agenda mueve el número de Hoy **solo**. Hay pruebas que leen el código
  buscando cualquier nombre que huela a copia.
- ⚠️ **El progreso del día cuenta SOLO tareas y hábitos** (`FUENTES_PROGRESO`): un evento que
  simplemente ocurre no se completa. Y sin nada completable **no hay porcentaje**, `null`.
- ⚠️ **Los apuntes de hoy viven en `productividad.apuntes`**, con su línea en
  `DEFAULT_PRODUCTIVIDAD` (regla 5) y en `CATALOGO_PAPELERA` (EH F45). Convertirlos en tarea o
  evento es de la **HC F4**.
- 🐛 **Antes de llamar a algo, mirar si ese nombre ya significa otra cosa**: `addApunte` era de la
  Biblioteca desde la Fase 11. Los de aquí son `addApunteDelDia` / `deleteApunteDelDia`.
- 🐛 **Un escenario del recorrido de Chromium que hereda el del vecino no prueba lo que dice.** Es
  una pasada seguida: lo que una sección deja en `almacen` sigue ahí en la siguiente. Cada sección
  limpia lo que va a mirar.

## Y lo que dejó la Fase 7 (HC F2)

- ⚠️ **YA HABÍA UNA "AGENDA", Y NO ERA ÉSTA.** La del Calendario (Fase 3) lista **los eventos de los
  próximos días**; ésta es de **UN día**. Son dos preguntas distintas —*"¿qué viene?"* y *"¿cómo es
  mi sábado?"*—, así que **conviven** (Mes · Día · Agenda) y no se sustituyó nada. Antes de rehacer
  una pantalla que ya existe, mirar qué pregunta contesta.
- 🚨 **`src/lib/agendaDia.js` NO GUARDA NI UN ELEMENTO Y NO TIENE NORMALIZADOR** (apartado 25):
  junta y ordena lo que ya vive en su módulo —`agendaCompleta` (HT F6), `productividad.tareas` y
  `productividad.apuntes`—. Hay pruebas que leen el código fuente y fallan si aparece
  `agenda_events`, `calendar_events` o un almacén propio.
- 🚨 **Por eso el apartado 14 sale gratis**: la casilla de la Agenda llama a `toggleTarea`, **la
  misma función** que marca esa tarea en Hoy y en Productividad. No hay nada que sincronizar
  **porque es la misma tarea**.
- ⚠️ **Una tarea se completa; un evento ocurre** (apartado 6). `seCompleta` es una línea de
  `TIPOS_AGENDA`, no un `if` en la pantalla.
- ⚠️ **Lo pasado sigue visible** (15), **el "próximo" es el siguiente PENDIENTE** —lo hecho se salta
  (17)— y **dos cosas a la misma hora se ven las dos** (18): esconder una sería perder algo que él
  puso. Y la **raya de AHORA solo se pinta en hoy** (16).
- ⏸ **Los recordatorios y los pomodoros programados NO existen** (apartado 5): van en `TIPOS_AGENDA`
  con `existe: false` y su motivo escrito, en vez de un botón muerto (regla 8).
- 🐛 **Cuatro de los cinco fallos de la fase eran de la PRUEBA, no del código.** Mirar qué línea hace
  saltar una comprobación **antes** de tocar el código.
- ⚠️ **`minutosAhora` entiende texto o `Date`, nunca un número**: un número cae al reloj de verdad y
  la prueba deja de ser determinista.

## Y lo que dejó la Fase 8 (HC F3)

- 🚨 **LAS TAREAS NO SALÍAN EN EL CALENDARIO** (apartado 12), y es lo que esta fase arregla. El
  Calendario enseñaba `calendario.eventos` y los derivados; las tareas de Productividad no estaban
  en ninguna de las dos listas, así que una tarea del 29 era invisible hasta abrir la Agenda. **Antes
  de dar por cubierta una entidad en una pantalla, mirar de qué listas se alimenta esa pantalla.**
- 🚨 **`calendarioMes.js` NO GUARDA NADA** (apartados 30 y 31): *"el calendario es una
  representación"*. Marcar una tarea llama a `toggleTarea` y crearla a `addTarea`; el recorrido de
  Chromium lo comprueba **tocándolo**, mirando que `productividad.tareas` cambie de verdad.
- 🐛 **UN RECORDATORIO YA EXISTÍA, Y LA F7 DIJO QUE NO.** `TIPOS_EVENTO_CALENDARIO` lo tiene desde el
  Calendario Universal: es **un evento de ese tipo**, y ya salía en la Agenda como evento. Corregido.
  Lo que no existe es un módulo de recordatorios aparte, que sería el duplicado del apartado 31.
- 🐛 **`'25:99'` encaja con `/^\d{2}:\d{2}$/`**: tercera vez de la lección de EH F11. `horaValida`
  sube a `helpers.js` y la usan Peluquería, la Agenda y el Calendario.
- 🐛 **`innerText` devuelve el texto RENDERIZADO**: `uppercase` llega en mayúsculas, así que
  `/Sin hora/` no encuentra *"SIN HORA"*. Todo rótulo se busca con `/i`.
- 🐛 **`pgrep -f` se encuentra a sí mismo**: un bucle de espera cuyo patrón está en su propia línea de
  comando no termina jamás.
- ⚠️ **Hoy tiene que notarse también seleccionado** (apartado 4): el borde solo se pintaba sin
  seleccionar, y al entrar el día seleccionado ES hoy.
- ⚠️ **El punto de tarea tiene su hueco reservado** entre los tres indicadores: sin eso, un día con
  tres tipos de evento se comía el punto verde y las tareas volvían a ser invisibles.
- ⚠️ **La carga del día lleva icono Y palabra** (apartado 23), nunca solo un color (EH F42). Y son
  **tres estados y un umbral**, no un sistema de puntuación.

## Y lo que dejó la Fase 9 (HC F4)

- 🚨 **ANTES DE CREAR UN FICHERO, MIRAR SI ESE NOMBRE YA ES DE ALGUIEN.** Esta fase se escribió
  primero como `accionesRapidas.js`, que **ya era de EH F61** —congelado—, y se llevó **310 líneas
  suyas**. Lo cantó `git status`, no el build. Lo nuevo es `accionesHoyAgenda.js`, y hay una prueba
  que comprueba que el de la F61 sigue entero.
- 🚨 **EL ＋ ES UNO SOLO** (apartados 1 y 30): `src/components/quickAdd.jsx`, usado por Hoy, la
  Agenda y el Calendario. Vivía dentro de `CalendarView` desde la F8, así que las otras dos no lo
  tenían. Una pantalla que necesite crear algo **llama ahí**.
- ⚠️ **El contexto viaja con el ＋** (2, 3, 4 y 26): desde Hoy la fecha es hoy, desde la Agenda el
  día que se está viendo —con su hora—, desde el Calendario el seleccionado. ⏸ Y el **apunte** solo
  se ofrece cuando el día es hoy: un apunte no se programa (F6).
- ⚠️ **Un evento no tiene "Completar"** (apartado 8): un evento ocurre (F7, apartado 6). Qué acciones
  tiene cada tipo lo decide `accionesDe`, no la pantalla.
- ⚠️ **Cambiar la fecha de una tarea la quita de Hoy sola** (11): se cambia la tarea original y las
  tres pantallas la leen de ahí. Y **quitar la hora** es válido: pasa a "Sin hora".
- ⚠️ **Deshacer y borrar son los de siempre**: el histórico de diez pasos de `snapshotAndSave` y
  `eliminarConPapelera` (ME F3). Ni una segunda pila, ni una segunda puerta.
- 🐛 **`'2026-13-45'` encaja con `/^\d{4}-\d{2}-\d{2}$/`**: cuarta vez de que la forma no basta.
  Guardarla dejaba la tarea **invisible en las tres pantallas**. `fechaValida` está en `helpers.js`.
- 🐛 **Una prueba que busca USOS quita los comentarios** (duodécima vez) **y una que busca ESCRITURAS
  busca la llamada, no la palabra** (decimotercera): `YA_RESUELTO` nombra `saveData` a propósito.
- ⚠️ **Lo que ya estaba se declara, no se rehace**: `YA_RESUELTO` recoge los apartados 10, 13, 14, 15,
  17, 22 y 24 con la función real que los resuelve, como `SISTEMAS_EH` en EH F39.

## Y lo que dejó la Fase 10 (HC F5)

- 🚨 **EL MOTOR DE RECURRENCIAS YA EXISTÍA.** `expandirRecurrentes` (Calendario Universal F3) hace
  las cinco cosas que pide el apartado 9: expande sin materializar (regla 11), con intervalo,
  excepciones, cambios y `hasta`. **Las tareas que se repiten pasan por él.** Un segundo motor habría
  sido la duplicación que prohíbe el apartado 14.
- 🚨 **UNA TAREA RECURRENTE NO SON TRES TAREAS** (apartados 23 y 24): se guarda **la regla**, y
  `hechas` es una lista de fechas **dentro de ella**. Sale en Hoy, en la Agenda y en el Calendario
  porque las tres preguntan por su día; completar el jueves marca ese día y la regla permanece.
- ⚠️ **Las rachas siguen siendo de Hábitos** (apartado 25): `semana.js` no importa nada de rachas.
  La agenda **representa** la actividad, no la cuenta.
- ⚠️ **La semana empieza el lunes y se calcula en local** (séptima vez del UTC). Y la cabecera **dice
  los dos meses** cuando la semana los cruza.
- ⚠️ **En el móvil no caben siete columnas** (apartado 3): tira de días arriba, el día seleccionado
  debajo. Es lo que el apartado describe, no una concesión.
- ⚠️ **"Esta semana" devuelve a la semana que CONTIENE hoy**, no a Hoy (apartado 6).
- ⚠️ **Solo este día / Toda la serie no tiene valor por defecto** (12 y 13), como `ALCANCES` en HT F3.
- ⚠️ **Un día sin nada es "Libre"** (16), y **el orden dentro del día** (17) coincide con la Agenda a
  propósito: dos órdenes distintos es cómo se pierde la consistencia que pide el apartado.
- ⏸ **El apartado 30 pide campos preparados, no notificaciones**: `fecha`, `hora` y `estado` existen;
  el **recordatorio de una tarea no**, y se declara — sería un segundo emisor (HT F10, EH F38).
- 🐛 **Una prueba que busca escrituras mira los IMPORTS, no la palabra** (decimocuarta vez), y **un
  escenario tiene que encajar con lo que afirma**: con una tarea diaria no hay ni un día libre.

## Y lo que dejó la Fase 11 (HC F6)

- 🚨 **NO NACE NINGUNA ENTIDAD.** El enunciado abre con *"NO crear un sistema paralelo de
  recordatorios"*: un recordatorio es un evento con `tipo: 'recordatorio'` (F8) y una tarea es la de
  Productividad. Lo único nuevo son **dos campos**, `notificar` y `anticipacion`.
- 🚨 **`avisosPlanificacion.js` DECIDE; `notificaciones.js` MANDA**, como `avisosHorario.js` y
  `avisosEstilo.js`. Nunca un segundo emisor ni un segundo horario de silencio.
- 🚨 **LOS AVISOS CON LA APLICACIÓN CERRADA NO EXISTEN** (23 y 24): no hay service worker con `push`.
  `CAPACIDADES` lo declara y **Ajustes lo enseña**. *"No prometer funcionalidad que la plataforma no
  soporte."*
- 🚨 **Un aviso nace mirando el permiso REAL** (7), y **no hay nada que cancelar** (18, 19 y 21): se
  calculan en el momento desde el elemento.
- ⚠️ **Nada de avisos atrasados** (22): una ventana corta, y pasada, nada.
- ⚠️ **Un interruptor por tipo, apuntando a las categorías que YA existen** (27): un segundo juego
  donde apagar lo mismo acaba en un interruptor apagado y avisos que siguen llegando.
- ⏸ **Un hábito no guarda hora** (11) y **el Pomodoro no se programa** (12): declarado, no fingido.
- 🐛 **`pulsar()` del recorrido solo pulsa dentro del diálogo abierto.** Con el ＋ abierto, "Tarea"
  encontraba un botón del fondo llamado exactamente así y el recorrido acababa en otra pantalla.
- 🐛 **Y una lista de palabras prohibidas que no conoce el término calla**: el texto de Ajustes decía
  *"service worker"* y el barrido de Node lo aprobó. Lo cazó Chromium (la lección de EH F48).

## Dos cosas del documento que conviene saber

⚠️ **BL F3 no está en el documento.** La Biblioteca salta de **F2 (Libros)** a **F4 (Guardados)**, y
no hay ninguna "Fase 3 — Biblioteca" en ningún sitio del archivo. **No se inventa**: cuando toque
llegar ahí, se le pregunta a Josué si existe y se la ha dejado fuera, o si la numeración salta a
propósito. No bloquea nada mientras tanto.

✅ **Dos fases están pegadas dos veces, y son la misma.** *BL F6 — Documentos* (líneas 9565 y 10076)
y *ES F4 — Exámenes* (19511 y 19773) aparecen repetidas; comparadas línea a línea **solo cambian en
una frase de presentación**, así que no hay contradicción: es el mismo enunciado copiado dos veces.
Se usa el primero.

## Cómo se ejecuta cada una

El de siempre, sin cambios:

1. Se construye entera, **reutilizando lo que ya existe**. Nunca un segundo motor, una segunda
   papelera ni una cuarta lista (D2-07).
2. `bash scripts/verificar.sh` **en verde**, con el recorrido en Chromium incluido.
3. Cierre: `docs/07`, este índice (`docs/11`), `docs/04`, `CHANGELOG.md`, `HANDOFF.md`, `CLAUDE.md`, versión.
4. **Push a `main`**, que es lo que hace que Josué lo vea en la web.

⚠️ **Y `main` la comparten dos sesiones.** Mientras esto se construye, Josué va subiendo los
archivos de sonido desde otra conversación. **Antes de cada empuje se trae lo suyo y se rebasa
encima**; nunca se pisa su trabajo.
