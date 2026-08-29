# CLAUDE.md — JosStyle

> Punto de entrada para cualquier sesión de Claude Code en este proyecto. **Léelo entero antes de
> escribir código.**

## Qué es esto

Una **PWA personal** ("sistema operativo personal") para **Josué**, 16 años: salud, sueño,
nutrición, calistenia, fútbol, estudios, negocio, economía, productividad, objetivos, diario,
biblioteca, relación de pareja (privada), bienestar digital, fe, calendario, estadísticas,
predicciones y logros. La IA **analiza y sugiere, nunca decide**.

**El nombre oficial y definitivo es JosStyle.** *JC Fitness*, *JC Lifestyle* y *JC STYLE* son nombres
históricos: aparecen en `CHANGELOG.md` y dentro de `especificaciones/` porque son historia y
transcripción literal, pero **no se usan en código nuevo, documentación nueva ni interfaz**.

**Estado:** `package.json` **v1.98.0**. Vite + React 18 + Tailwind + Supabase + una función
serverless en Vercel que hace de proxy a Anthropic.

**Pendiente por delante:** la **Entrega 2** (7 módulos nuevos — Estilo de Hombre, Horario Top,
Armario ✅, Fondos ✅, Buscador+IA ✅, Módulos activables ✅, Sonido y Rachas — **106 fases**; los
bloques **ME**, **BI**, **AR**, **FO**, **Rachas** y **Horario Top** están terminados, **Sonido** va
por 3/5, **Estilo de Hombre va por 32/65**, quedan 31 — **tres de ellas bloqueadas por C-25**) y el bloque **AXION** de la
Entrega 1 (≈1100 apartados, aplazado por decisión de Josué hasta terminar la Entrega 2).

⚠️ **El "106" es un rótulo, no una suma** (C-24, detectada en v1.67.0): el desglose por módulos da
**110** (EH 65 + HT 12 + FO 12 + SR 9 + ME 4 + BI 4 + AR 4). Las fases de EH van numeradas *"x/65"*
en la especificación de Josué, así que **el desglose es el que manda sobre el trabajo**; el rótulo se
conserva para no romper las referencias de los ocho documentos que lo citan. No bloquea nada.

## Decisiones cerradas de Josué (no reabrir)

Las contestó él por escrito al empezar la Entrega 2. Están desarrolladas en
`docs/06_ENTREGA2_ANALISIS.md` §7 como **D2-01 … D2-08**. En corto:

| | Decisión |
|---|---|
| **D2-01** | **Sonido y Rachas son DOS módulos independientes.** No mezclar sus especificaciones ni su numeración. |
| **D2-02** | **La regla de "no sobregamificar" NO se deroga.** Nada de puntos, niveles ni monedas en Bienestar. XP y niveles solo dentro de Sonido/Rachas, sin salir de ahí. |
| **D2-03** | **Amazon: arquitectura sí, afiliación no.** Ni catálogo, ni productos, ni API, ni cuenta de afiliados inventados. |
| **D2-04** | **Contenido educativo: estructura ahora, contenido después.** Ninguna fase se bloquea por falta de artículos. |
| **D2-05** | **Orden confirmado**, con Estilo de Hombre al final. |
| **D2-06** | **AXION se aplaza** y no bloquea las 106 fases. |
| **D2-07** | **Inicio, Buscador y Módulos son un solo sistema.** Prohibido crear una cuarta lista de "qué se ve en Inicio". |
| **D2-08** | **El proyecto se llama JosStyle.** |

⚠️ **Regla 49 (nueva, de Josué):** *"Si encuentras cualquier otra contradicción entre las 100
prompts, no la resuelvas por tu cuenta: detente y pregúntamela antes de implementar esa parte."*
Detiene **la fase afectada, no la sesión**: se anota en `docs/03` como ⏸ PENDIENTE DE JOSUÉ, se sigue
con lo que no dependa de ella y se le pregunta al cerrar el turno. No aplica a las contradicciones ya
listadas con decisión tomada.

## Documentación: qué leer y en qué orden

| Necesitas... | Lee |
|---|---|
| Entender el proyecto entero | **`docs/01_ESPECIFICACION_MAESTRA.md`** |
| Saber qué construir a continuación | **`docs/02_ORDEN_DE_FASES.md`** |
| Evitar romper algo o repetir un debate ya cerrado | **`docs/03_CONTRADICCIONES_DUPLICADOS_DEPENDENCIAS.md`** |
| Saber qué archivo tocar | **`docs/04_INVENTARIO_ESTADO_ACTUAL.md`** |
| Comprobar que no falta nada | **`docs/05_CHECKLIST_GLOBAL.md`** |
| Trabajar en la **Entrega 2** (7 módulos nuevos, 106 fases) | **`docs/06_ENTREGA2_ANALISIS.md`** y **`docs/07_CHECKLIST_ENTREGA2.md`** |
| La especificación literal de la Entrega 2 | `especificaciones/` 🔒 **intocable** |
| El contexto histórico turno a turno | `CHANGELOG.md` |
| El documento que Josué pasa entre conversaciones | `HANDOFF.md` ⚠️ *sus secciones numeradas están desactualizadas — ver C-20* |
| La especificación literal de Ajustes | `ESPECIFICACION_AJUSTES_ENTREGA1.md` 🔒 **intocable** |

`docs/00_INDICE.md` es el índice completo de la carpeta.

## Las 12 reglas que más se rompen

1. **Una fase por turno.** Nunca construir varias a la vez, ni adelantar la siguiente.
2. **`COLORS` es un singleton mutable.** Nunca `const { x } = COLORS`. Nunca un segundo sistema de
   tokens. Nunca un hex suelto fuera de `tokens.js`.
3. **Todo overlay `fixed inset-0` va con `createPortal(..., document.body)`.** Si no, se ancla al
   contenedor de `.module-enter` y aparece "abajo del todo" (bug real ya corregido).
4. **En `App.jsx`, todos los `useEffect` y `aplicarTema()` van ANTES de los `return` condicionales.**
   Ya se produjo el error "Rendered more hooks than during the previous render".
5. **`saveData` sobrescribe, no fusiona.** Guardar `ajustes` exige mandar el paquete completo.
   **`loadData` no fusiona con el default:** todo campo nuevo se carga con
   `{ ...DEFAULT_X, ...guardado }`.
6. **Relación nunca sale de su sitio:** `PinGate` sobre el módulo entero, fuera del export, fuera de
   `currentState`, y en el Calendario solo si está desbloqueada en la sesión.
7. **La IA nunca se dispara sola.** Siempre a un toque explícito. Nunca añade objetivos. Nunca
   objetivos calóricos o de peso estrictos. `AVISO_DOCTRINAL` obligatorio en los paneles de Fe.
8. **Nunca simular una función que no existe.** Nada de controles decorativos, cifras inventadas ni
   "próximamente". Si algo no es posible, se dice con una frase corta en la propia interfaz.
9. **Nunca dejar notas internas de desarrollo** ("Fase X", "apartados X-X", "queda pendiente") en
   pantallas que ve Josué.
10. **Exactamente 5 pestañas** en la barra inferior. Un módulo nuevo entra en un área existente.
11. **Nunca duplicar el dato de otro módulo en el Calendario** — siempre derivado y de solo lectura.
    Nunca materializar ocurrencias de un evento recurrente.
12. **Josué despliega vía Vercel, no Replit.** Las menciones a Replit en `CHANGELOG.md` son historia
    obsoleta: no investigarlas ni reabrirlas.

La lista completa (49 reglas) está en `docs/01_ESPECIFICACION_MAESTRA.md` §11.

## Contexto operativo de Josué

- **No tiene ordenador**: todo desde el iPhone. Comandos simples, uno a la vez.
- **Despliega vía Vercel, desde la rama `main`.** 🚨 **Ya se sabe cómo subía el código, y era el
  problema:** extraía el zip en el iPhone y lo subía por la web de GitHub (`Add files via upload`),
  que **se lleva los archivos sueltos de la raíz pero NO las carpetas**. Resultado: `main` tenía la
  documentación al día y `src/` del 11 de agosto, y la web no cambiaba nunca. **Desde v1.90.0 el
  trabajo se lleva a `main` desde la sesión** y la web se actualiza sola; el zip es una copia de
  seguridad. Si vuelve a decir *"la web sigue igual"*, **mirar en qué versión está `main`**.
- **Rota entre varias cuentas de Claude**, pasando `HANDOFF.md` + zip. Puede haber resuelto en otra
  conversación algo que aquí parece pendiente.
- ⚠️ **UNA FASE POR TURNO, y se para.** Josué cambió el modo de trabajo: él pasa la fase, se
  construye entera y verificada, se le avisa con `PushNotification` y **se espera**. No encadenar
  fases ni adelantar la siguiente aunque parezca obvia cuál es. (Antes pedía lo contrario; ya no.)
- **Al terminar, decirle siempre dos cosas:** qué se ha hecho y hasta dónde se ha llegado.
- **Lo que más le importa es recibir la entrega actualizada cuanto antes.** Priorizarlo sobre
  explicaciones largas; nunca dejar un turno a medias sin entregarla.

## Verificación: qué está probado y qué no

🚨 **LO MÁS IMPORTANTE QUE HA APRENDIDO ESTE PROYECTO (v1.82.0):** durante meses **la aplicación no
arrancaba** y ninguna de las 5 844 comprobaciones lo vio, porque **`App.jsx` no se renderizaba en
ninguna prueba**. Dos fallos: un import que faltaba (`papelera.js`) que rompía la carga de datos a
media función —así que **ningún módulo de la Entrega 2 cargaba lo guardado**— y cinco hooks después
de un `return` condicional (regla 4) que tumbaban la app entera. **Una fase no está hecha porque su
prueba de Node pase: está hecha cuando se ve y se usa en la aplicación.** Para eso está
`scripts/test-app-real.mjs`, que la abre en Chromium de verdad.

**Ejecuta `bash scripts/verificar.sh` antes de dar por terminada cualquier fase.** Desde v1.23.0 el
entorno tiene acceso a npm otra vez, así que el proyecto **compila y se prueba de verdad**: build de
Vite, 7893 pruebas unitarias con Node (5 de ellas de auditoría), 1200 casos de renderizado real
con `react-dom/server`, 11 reglas invariantes y **284 comprobaciones sobre la aplicación de verdad
en Chromium** — **9388 comprobaciones**.

Eso ya ha encontrado **sesenta bugs reales** que la revisión a mano no vio, entre ellos una
notificación falsa (`null < 7` es `true` en JavaScript), nueve módulos que dejaban crear y no borrar,
dos fechas en UTC que en España devolvían el día equivocado (`todayISO`, `addDays`) y una
comparación contra `undefined` que anulaba entera la penalización por prendas no disponibles.

⚠️ **Lo que las pruebas NO cubren, y sigue pendiente de que lo mire Josué (R1):** Supabase real, la
sincronización entre dispositivos, los permisos del navegador, el aspecto en un iPhone y el
recorrido completo tocando la pantalla. Para todo eso, cuando reporte un fallo, **pedirle el mensaje
de error exacto** antes de asumir nada.

⚠️ Lo anterior a v1.22.0 sigue siendo **código revisado a mano, nunca ejecutado**.

## Al terminar una fase

1. Marcar casillas en `docs/05_CHECKLIST_GLOBAL.md`.
2. Mover el bloque en `docs/02_ORDEN_DE_FASES.md`.
3. Actualizar `docs/04_INVENTARIO_ESTADO_ACTUAL.md`.
4. Añadir la entrada a `CHANGELOG.md` y actualizar `HANDOFF.md` — **nunca generarlos de cero**.
5. Subir la versión menor en `package.json`.
6. Verificar con `esbuild` si el entorno lo permite; si no, decirlo con honestidad.

## Lo primero que conviene hacer

**🔒 Horario Top está CERRADO (12/12)**, **Sonido va por 3/5** (F1, F3 y F4) y **Estilo de Hombre va
por 32/65** (v1.98.0: F1-F17, **F20, F21 y F23-F35**). **Lo que queda de Sonido depende de los archivos de audio**: F2 es la
biblioteca y F5 la integración, que la necesita.

⏸ **EH F18, F19 y F22 están BLOQUEADAS por C-25, y es una de verdad.** La Fase 2 de Josué pone
*Higiene* y *Cuidado corporal* como **dos módulos** del catálogo; el objetivo de la Fase 18 y el
apartado 1 de la Fase 19 los tratan como **uno solo** llamado *"Cuerpo e higiene"*. Las dos lecturas
rompen un prompt suyo y cambian lo que ve en pantalla, así que **regla 49**: se anotó en `docs/03`
con tres preguntas concretas y se siguió por la 20, la 21 y la 23. **La F22 también depende**: su
*"🧼 Cuidado personal"* es el módulo en disputa, y dos de las siete casillas de la F18 son *"Cuidado
de manos"* y *"Cuidado de pies"*, que es lo que la 22 construye. **No construirlas hasta que
conteste.**

La siguiente candidata es **EH · Fase 36/65 — Activación, desactivación y gestión global**.
Ver `docs/07_CHECKLIST_ENTREGA2.md` y `especificaciones/`.

⚠️ **EH F1-F17, F20, F21 y F23-F35 dejaron ciento treinta y tres cosas que las fases siguientes tienen que respetar:**
- **Añadir un módulo es añadir una línea a `MODULOS_EH`.** Categoría, confirmación, recomendación y
  sinónimos de búsqueda van EN ESA LÍNEA. Si una fase futura necesita un `case`, un `if` o un
  registro aparte para su apartado, ha roto el apartado 9 de F1 y el 15 de F2, y hay una prueba que
  lee el código y lo comprueba.
- **`alternarModulo` no toca `config`.** Apagar no borra (F1, apartado 7). Nunca "limpiar por orden".
- **`FUENTES_GLOBALES` / `esDatoGlobal()` son el apartado 10 en código.** Antes de guardar un peso,
  una altura, horas de sueño, agua o un entrenamiento dentro de Estilo de Hombre: **ya existe en
  otro módulo**, y hay una función que lo dice.
- ⚠️ **Un módulo retirado del catálogo va a `retirados`, no a la basura** (F2, apartado 17). Era un
  fallo real de F1: con la regla 5 el siguiente guardado se llevaba su `config`. Es la **cuarta vez**
  que el mismo fallo de normalizador aparece en este proyecto.
- ⚠️ **`gestionModulos.js` no redefine nada de `estiloDeHombre.js`.** Decide qué hay que llamar;
  escribir sigue siendo de F1. Mismo reparto que `avisosHorario.js` / `notificaciones.js`.
- ⚠️ **El asistente guarda por dónde va, NO lo que sabe** (F3, apartado 7). Nada de Josué —peso,
  altura, nombre, objetivos— se copia dentro de `estiloHombre`: se lee de su módulo. Hay cuatro
  pruebas que buscan esos valores en lo guardado y fallan si aparecen.
- ⚠️ **`asistente` es el quinto campo nuevo y el primero que no se olvidó el normalizador.** Al
  añadir un campo a una entidad, añadirlo también a su normalizador — o el siguiente guardado se lo
  lleva (regla 5). Van seis (`datos`, de F4, es el sexto).
- ⚠️ **`leerDato()` es la ÚNICA forma de pedir un dato** (F4), y da la misma respuesta venga de Salud
  o de aquí dentro. Un módulo que lea `perfil.peso` por su cuenta se está saltando el apartado 3.
- ⚠️ **`guardarDato()` se niega a escribir un dato global**, con el sitio donde sí se edita. Nunca
  darle un camino alternativo: *"no puede existir Perfil → 72 kg, Estilo de hombre → 70 kg"*.
- ⚠️ **`armarioEnEstiloHombre.js` NO ESCRIBE en el armario** (F5, apartado 7), y hay una prueba que
  lee su código fuente y falla si aparece `crearPrenda(`, `crearOutfit(` o una llamada a la IA. Una
  fase futura que necesite escribir lo hace desde el Armario, no desde aquí.
- ⚠️ **`tallaDe()` es la ÚNICA respuesta a "qué talla gasta"** (F5, Test 8). Se deriva de las
  prendas; lo guardado rellena huecos; el choque se enseña. Un módulo que lea `prenda.talla` por su
  cuenta para deducirlo está creando el segundo perfil.
- ⚠️ **El perfil de estilo NO tiene almacén propio** (F6): sus once campos son once líneas del
  registro de F4. Antes de añadir una preferencia, mirar si ya está — `estilosFavoritos` y
  `coloresFavoritos` los creó F5.
- ⚠️ **`NIVELES_ESTILO` (🟢🟡🔴) nace en F6 y lo usarán las fases 18 y 22.** Importarlo, no
  reescribirlo. Y una prueba que busque una palabra en el código **tiene que quitar los comentarios
  antes**: "conseguir" contiene "seguir".
- ⚠️ **Todo cuestionario de perfil usa `cuestionarios.js`** (F7). Skincare, Cuerpo, Barba, Manos y
  Perfumes traen **su array de preguntas**, no su motor. Y el motor decide dónde va cada respuesta:
  al registro de F4 si es compartida, a la `config` del módulo si no.
- ⚠️ **"No lo sé" es una respuesta y es exclusiva** (F7). Cuenta como contestada, abre la puerta al
  contenido educativo, y no convive con una respuesta de verdad. Por defecto toda pregunta la admite.
  Y **nunca se diagnostica**: se pregunta qué quiere cuidar, no qué le falla.
- ⚠️ **Nunca "has fallado", nunca un 0 % de lo que no tocaba** (F8, apartado 7). Un día sin hacer es
  **"Pendiente"**. Sin días en los que tocara **no hay cumplimiento**, ni 0 ni 100.
- ⚠️ **Una recurrencia guarda su REGLA, nunca sus fechas** (F8 + regla 11), y las ocurrencias entran
  en el Calendario que ya existe con la misma forma que las del Armario. Nunca un segundo calendario.
- ⚠️ **Toda regla de recomendación declara `requiere`** (F9, apartado 2). Sin datos no se dispara, y
  una regla sin requisitos **no se aplica nunca**: se dispararía con el contexto vacío. "No lo sé"
  tampoco es un valor.
- ⚠️ **`aplicarARutina` sin `confirmado` no escribe** (F9, apartado 10), y calcular recomendaciones
  tampoco: mostrar y registrar son dos llamadas. Nunca darle un valor por defecto.
- ⚠️ **El catálogo de productos está VACÍO a propósito** (F10 + D2-03 + apartado 3 del enunciado).
  Nunca rellenarlo con productos inventados, y **nunca fabricar un enlace**: una URL que Josué no ha
  dado no existe. Ni una función que compre (apartado 19).
- ⚠️ **`packSugerido` sugiere, no crea** (F10, apartado 15), como `aplicarARutina`. Y hay UNA sola
  lista de productos capilares, la que creó F8: dos es cómo se incumple *"no duplicar productos"*.
- ⚠️ **Un evento planificado y un corte que ocurrió son DOS listas** (F11, apartado 15). `cortes` es
  la historia, `cita` es el plan, y borrar la cita no puede tocar el historial **porque no tiene
  manera de hacerlo**. Un array con un campo `hecho` deja las dos cosas a un `filter` de distancia.
- ⚠️ **`frecuenciaDeCorte()` es la ÚNICA respuesta a "cada cuánto"** (F11), como `tallaDe()` en F5:
  el perfil de F7 manda, lo puesto a mano rellena el hueco, **y el choque se enseña**. Y *"cuando lo
  necesito"* es una respuesta: **nunca inventar una frecuencia por defecto**.
- ⚠️ **`sugerirProximoCorte` sugiere, `avisoDeCorte` decide** (F11). Guardar es `planificarCorte`, y
  avisar es `notificaciones.js`. Tercer `aplicarPlan` del proyecto y segundo `avisosHorario.js`.
- ⚠️ **`Number(null)` es 0 y `Number.isInteger(0)` es `true`** (F11): "en X semanas" sin la X
  planificaba el corte para HOY. Y `'25:99'` encaja con `/^\d{2}:\d{2}$/`: **la forma no basta**.
- ⚠️ **Antes de añadir una pregunta, mirar si ya está contestada** (F12 + D-15). El apartado 5 de
  F12 y `tiempoPelo` de F7 son **la misma pregunta con las mismas cinco opciones**: se lee de F7 y
  la pantalla dice dónde se cambia. El perfil de corte tiene seis preguntas, no siete, **a
  propósito**. Skincare, Barba, Cuerpo, Manos y Perfumes tienen el mismo riesgo.
- ⚠️ **`NIVELES_MANTENIMIENTO` (F12) importa ids e iconos de `NIVELES_ESTILO`** y solo cambia los
  nombres. Si una fase futura necesita una escala de tres niveles, **es esta**, no una nueva.
- ⚠️ **El corte que ya lleva no se le recomienda** (F12), y **con un solo corte valorado bien no hay
  patrón** (apartado 15). *"Parece"* y *"bastante"* son las dos palabras que evitan el diagnóstico.
- ⚠️ **`normalizarPelo` va por DIEZ campos** (`corte`, de F12, es el décimo) y `normalizarCorte` /
  `normalizarPeluqueria` sumaron tres más. Al añadir un campo, añadirlo a su normalizador — y una
  **cuenta exacta de llaves en una prueba saltará** cuando la fase siguiente añada la suya con todo
  el derecho: comprobar lo que la prueba guarda, no cuántas hay.
- ⚠️ **El formulario adaptativo es del MOTOR** (F13): `cuando` en la pregunta y `preguntasVisibles()`
  / `progresoVisible()` en `cuestionarios.js`. Barba, Cuerpo, Manos y Perfumes lo usan tal cual;
  **nunca un `if` en el JSX**, que no se puede comprobar.
- ⚠️ **Esconder una pregunta NO borra su respuesta** (F13), y **el progreso cuenta lo visible**:
  "4 de 13" de preguntas que no le aplican es una nota inventada.
- ⚠️ **El registro de F4 es quien decide qué se comparte** (F13, apartado 15). `tipoPiel`,
  `sensibilidadPiel` y `sinPerfume` ya estaban declaradas ahí antes de que existiera Skincare:
  **mirar el registro antes de escribir una pregunta**, no después.
- ⚠️ **Nunca un diagnóstico** (F13): *"¿qué te gustaría mejorar o cuidar?"*, no *"¿qué te pasa?"*.
  `PALABRAS_CLINICAS` + `sinDiagnostico()` barren todos los textos, y el perfil de piel **no viaja
  a la IA** (apartado 17), con `paraIA: false` en el propio dato.
- ⚠️ **`motorRutinas.js` es EL motor de rutinas** (F14, extraído de F8). Pelo y Skincare lo usan; si
  Barba o Cuerpo tienen rutinas, **llaman ahí**. Nunca una tercera copia de `tocaEnFecha`.
- ⚠️ **La lista de frecuencias es del módulo, el comportamiento es del motor** (F14). Seis etiquetas
  de F14 y cinco de F8 sobre **cuatro** reglas: cada etiqueta declara su `tipo`.
- ⚠️ **Omitir es una TERCERA cosa** (F14, apartado 10): ni hecho ni pendiente, y **sale de la cuenta
  del día**. Dos hechos y uno omitido es una rutina HECHA. Nunca contarlo como fallo.
- ⚠️ **Un campo propio de un módulo lo normaliza ese módulo** (F14): el motor solo conoce los suyos,
  así que `momento`, `hora` y `diasAviso` los normaliza `rutinasPiel.js`. Van catorce.
- ⚠️ **`scripts/test-imports.mjs` existe porque `App.jsx` nunca importó `papelera.js`** (F15) y la
  app lanzaba un `ReferenceError` en el primer render — invisible para el build y para las pruebas
  de renderizado. **Al llamar a algo de `src/lib/` desde una vista, importarlo.**
- ⚠️ **Un día sin registrar NO EXISTE** (F15, apartado 9): no es un cero, no se cuenta y no se
  menciona. Sin rachas, sin obligación diaria y sin porcentaje de días registrados.
- ⚠️ **Nunca una causa** (F15, apartados 7 y 12): *"↑ Mejorando"* y *"desde que empezaste a usar X
  has registrado N valoraciones"*. Ni "gracias a", ni "funciona", ni "ha mejorado tu piel".
- ⚠️ **`motorProductos.js` es EL motor de productos** (F17, extraído de F10), **porque lo pide la
  condición de finalización del enunciado**: *"evitando crear cinco catálogos diferentes"*. Cuerpo,
  Higiene y lo que venga **llaman ahí**. Lo que se queda en cada módulo son sus categorías y **sus
  filas de comparación**: F10 dibuja cuatro y F17 cinco, y cada fase se queda con la suya.
- ⚠️ **Los productos de piel son la lista de F13, ampliada** (F17, apartado 13), como los de pelo son
  la de F8. Antes de crear un inventario, mirar si ya existe: van dos veces.
- ⚠️ **`normalizarPiel` va por DIECIOCHO** (`productos` con su ficha entera y `packs`, de F17, son
  los últimos), y ésta fue de las caras: recortaba cada producto a `{id, nombre}`, así que el
  siguiente guardado se llevaba marca, categoría, precio, tiendas y valoración. **Al añadir un campo
  a una entidad, añadirlo también a su normalizador.**
- ⚠️ **`export … from` NO CREA BINDING LOCAL** (F17). Al mudar `CATALOGO_VACIO_PORQUE` al motor,
  `productosPelo.js` la reexportó así y **se quedó sin la variable que usa dos líneas más abajo**:
  cuatro pantallas reventaban con `is not defined`. Para reexportar algo que el archivo TAMBIÉN usa,
  se importa y se hace `export { X }`.
- ⚠️ **El catálogo de productos de piel está VACÍO** (F17 + D2-03), como el de pelo, y **nunca se
  inventa un enlace**: una "url" que no lo es se guarda `null` y se dice que no hay enlace. Ni una
  función que compre o añada a un carrito (apartado 22).
- ⚠️ **`packSugeridoPiel` sugiere, no crea** (F17, apartado 17), como `packSugerido` y
  `aplicarARutina`. Sexto `aplicarPlan` del proyecto.
- ⚠️ **`motorRecomendaciones.js` es EL motor de reglas** (F16, extraído de F9). Pelo, Cortes y
  Skincare lo usan. **Una regla sin `requiere` no se aplica NUNCA**: se dispararía con el contexto
  vacío. Nunca una cuarta copia de ese `if`.
- ⚠️ **`anadirARutina` sin `confirmado` no escribe** (F16, apartados 4 y 11). Quinto `aplicarPlan`
  del proyecto, tras HT F9, EH F9, EH F12 y EH F14. Nunca darle un valor por defecto.
- ⚠️ **La prioridad pesa, pero no tapa** (F16, apartado 2): lo del objetivo que él marcó sale
  primero, y una recomendación de otro tema sigue pudiendo salir.
- ⚠️ **`cuando` recibe DOS cosas desde F20**: las respuestas y **un contexto del módulo**. Nació
  porque el apartado 7 dice *"si selecciona afeitado"* y "afeitado" no es una respuesta, sino una
  casilla guardada en la `config`. Una condición de visibilidad **nunca vuelve al JSX**.
- ⚠️ **Un módulo que use productos NO guarda fichas, guarda IDS** (F20, apartado 12). Borrar el
  producto en su módulo lo hace desaparecer de aquí, y eso está bien: guardar el nombre "por si
  acaso" es media ficha, o sea el segundo inventario por la puerta de atrás.
- ⚠️ **`frecuenciaDeAfeitado()` es la ÚNICA respuesta a "cada cuánto" en Barba** (F20), como
  `frecuenciaDeCorte()` en F11 y `tallaDe()` en F5. *"Cuando lo necesito"* **es una respuesta**:
  nunca traducirla a días.
- ⚠️ **`PALABRAS_CLINICAS` es UNA lista, la de F13.** F20 la importa. Y **una prueba que barra los
  textos saltará con "no es un diagnóstico"**, porque contiene la palabra: la solución es decirlo
  sin la palabra, no excusar el texto.
- ⚠️ **Antes de escribir una pregunta, mirar `REGISTRO_DATOS`** (F20): `sensibilidadPiel` ya decía
  `usan: [… 'barba' …]` siete fases antes. Van dos veces (D-15 fue la primera).
- ⚠️ **Una casilla de "qué gestionas" NO es un interruptor de apartado** (F21). Colgar las rutinas de
  la casilla *"Afeitado"* dejó sin rutinas a quien solo marcaba *"Barba"*. `deApartado2` separa las
  dos listas, y **`elegirPartes` no toca los interruptores**: volver a elegir qué gestionas no puede
  apagar algo por la espalda.
- ⚠️ **`TEXTOS_ESTADO_DIA` son TEXTOS, no objetos** (F21): leer `.nombre` dejaba el estado del día en
  blanco **y hacía que el barrido de palabras clínicas no mirara ninguna**. Lo cazó el navegador.
- ⚠️ **Borrar una rutina NO borra su historial** (F21): *"23/08 — Afeitado ⭐ 5/5"* pasó. Los
  registros se quedan huérfanos, como los cortes y las citas de F11.
- ⚠️ **Una cuenta exacta de llaves en una prueba es una bomba de relojería.** La de
  `test-papelera.mjs` saltó en F21 al añadir dos entradas legítimas, y la de `test-estilo-hombre.mjs`
  —`MODULOS_EH.length === 13`, **nueve veces**— saltó en F23. Comprobar **que estén las que tienen
  que estar**, no cuántas hay.
- ⚠️ **Añadir un módulo es UNA LÍNEA en `MODULOS_EH`** (F1, confirmado por F23): categoría, icono,
  fase y sinónimos van ahí. Ni un `case`, ni un `if`, ni un registro aparte.
- ⚠️ **La racha es la GLOBAL, y si no la tiene NO se pinta** (F23, apartado 10). Nunca un contador
  guardado, y nunca proponerle crearla: sería empujarle a algo que no ha pedido.
- ⚠️ **Un evento derivado FILTRA por el rango que le piden** (F23). Sin eso, una revisión de octubre
  salía al pedir los eventos de agosto y el calendario la pintaba en el mes equivocado.
- ⚠️ **Un consejo "general" no mira sus datos** (F23, apartado 11). En cuanto los mira, deja de ser
  general y pasa a ser una instrucción personalizada, que es lo que el enunciado prohíbe.
- ⚠️ **La auditoría de ME F4 lee el código y busca los NOMBRES LITERALES** de módulo y colección en
  `eliminarConPapelera(...)`. Una colección pasada como variable no la ve, y salta como "colección
  sin borrado real".
- ⚠️ **Antes de escribir una pregunta que otra fase también hará, DECLARARLA COMPARTIDA** (F24). Los
  aromas los pregunta la F18 y la F24; se declararon en el registro de la F4 con `usan` para las dos,
  y la que llegue después los lee. Tercera vez (D-15 y `sensibilidadPiel` fueron las otras).
- ⚠️ **"Mi X actual" y "mi X favorito" NUNCA se deducen el uno del otro** (F24, apartado 12). Son dos
  campos, y marcar uno no toca el otro.
- ⚠️ **Un id que apunta a algo borrado se limpia EN EL NORMALIZADOR** (F24): `actual` y `porOcasion`
  se validan contra lo que existe. Guardar el id de un perfume que ya no está es guardar una mentira.
- ⚠️ **Lo que él dice que NO quiere vale tanto como lo que quiere** (F24, apartado 3), y se le repite
  con sus palabras: *"dijiste que preferías evitar…"*, nunca *"no te gusta"*.
- ⚠️ **Una recomendación es una EXPLICACIÓN, no una nota** (F25, apartado 7): cada motivo es una
  frase entera, y **el que no tiene ninguna no se propone**. Nunca una puntuación a la vista.
- ⚠️ **Apagado y vacío son DOS COSAS** (F25, apartados 10 y 17). Una parte opt-in apagada devuelve
  `null`, no `[]`: si no, la pantalla pinta siete días en blanco de algo que él no ha activado.
- ⚠️ **"No repetir" BAJA de sitio, no esconde** (F25, apartado 11). Si es el único que encaja, se
  propone igual y se dice cuándo lo usó. Esconderlo sería decidir por él.
- ⚠️ **Un descarte se guarda CON su contexto** (F25, apartado 8): descartar un perfume para la noche
  no lo descarta para el trabajo. Y caduca: *"continuamente"* no es *"nunca más"*.
- ⚠️ **UN ACCESORIO ES UNA PRENDA DEL ARMARIO** (F26). El armario ya tenía la categoría `accesorios`
  desde AR F1, así que el reloj vive allí **una sola vez** y aquí solo queda un **envoltorio** con lo
  que el armario no sabe. `CAMPOS_DE_LA_PRENDA` es la frontera escrita, con una prueba por campo:
  guardar aquí el nombre "por si acaso" es media ficha en un sitio y la ficha entera en otro.
- ⚠️ **Añadir un accesorio ESCRIBE EN EL ARMARIO** (F26). El módulo devuelve un **plan** con las dos
  piezas y guarda `App.jsx`, que es el dueño de los dos almacenes; la prenda la construye
  `crearPrenda`, la fábrica del armario. Mismo reparto que `gestionModulos.js` / `estiloDeHombre.js`.
- ⚠️ **El duplicado se comprueba ANTES de crear nada** (F26, apartado 3), y **crear otro igual exige
  decirlo**: nunca un valor por defecto. Y se busca en **todo** el armario, no solo en la categoría
  de accesorios: una gorra apuntada como "Otros" sigue siendo la misma gorra.
- ⚠️ **El favorito de un accesorio es `prenda.favorita`** (F26, apartado 7), y por eso
  `alternarFavoritoAccesorio` **no devuelve un estado de Estilo de hombre: devuelve un armario**.
- ⚠️ **Antes de escribir una lista de estilos o de ocasiones, MIRAR SI YA EXISTE** (F26): las siete
  del apartado 5 estaban enteras en `ESTILOS_VESTIR` (F6) y las siete del apartado 6 en `OCASIONES`
  (F24). Un subconjunto se declara **por sus ids**, para que renombrar uno rompa la prueba.
- ⚠️ **`prepararRestauracion` devuelve `{ moduloActualizado, yaExistia }`, NO el módulo** (F26).
  Escribir el objeto entero se lleva por delante todo el módulo en el siguiente guardado.
- ⚠️ **Elegir qué gestionas y apagar un apartado pueden ser EL MISMO interruptor** (F26, apartados 2
  y 14). Antes de crear un segundo mecanismo, comprobar si el enunciado describe el mismo dos veces.
- ⚠️ **`intereses` y `quiereHacer` VIVEN EN EL REGISTRO DE LA F4 desde la F6** (F27). La F27 guarda la
  **ficha** de cada cosa y deja el nombre allí: lo que él escribió en el perfil de estilo sale aquí
  como entrada suelta y completarla **no la duplica**. Cuarta vez que el registro evita un duplicado.
- ⚠️ **Sincronizar un dato del registro tiene DOS direcciones** (F27): al borrar o renombrar una
  ficha hay que **sacar el nombre viejo**, o vuelve como entrada suelta y el perfil sigue diciendo
  que le gusta algo que acaba de borrar. Por eso `escribirEntradas` recibe `quitar`.
- ⚠️ **"Quiero hacer" NO es una tarea** (F27, apartado 4) y **el estado es SOLO suyo** (apartado 6):
  un "Me gusta" no tiene estado, y *"ya lo hice"* **no borra nada** — deja de salir en el calendario
  porque es historial, no un plan.
- ⚠️ **Un bloque que el enunciado NOMBRA pero no DEFINE probablemente ya existe** (F27): *"📋 Mis
  preferencias"* no se define en ningún apartado, y el registro de la F4 ya las clasifica con
  `clase: 'preferencia'`. Es una vista de solo lectura, no una cuarta lista.
- ⚠️ **La nota corta es del módulo; lo extenso, del Diario** (F27, apartado 10). Se LLEVA al Diario;
  no se copia nada allí ni se trae nada de allí.
- ⚠️ **`paraPersonalizar()` devuelve, no aplica** (F27, apartado 11), con `soloLectura: true` escrito
  en el propio dato. *"Nunca modificar automáticamente otros módulos."*
- ⚠️ **UN OBJETIVO DE JOSSTYLE ES `{ texto, plazo, cumplido }`** (F28). El enunciado enumera seis
  campos, pero el sistema global solo tiene esos tres, así que **no se inventan los otros**: sería el
  segundo sistema de objetivos que la fase prohíbe. Y no hacen falta, porque **lo personal ya lo
  guarda la F27**. Antes de añadir un campo a un objetivo, mirar qué tiene Objetivos de verdad.
- ⚠️ **El progreso de un objetivo es un sí/no, no un porcentaje** (F28, apartado 10). Se enseña lo
  que hay y se dice; una barra de "35 %" sería una cifra inventada (regla 8).
- ⚠️ **`marcarYaLoHice` sin `confirmado` no escribe** (F28, apartado 5). *"**Podrá** actualizarse"* no
  es "se actualizará". Noveno `aplicarPlan` del proyecto; nunca darle un valor por defecto.
- ⚠️ **El plazo al convertir en objetivo NO tiene valor por defecto** (F28), como `ALCANCES` en HT F3:
  elegirlo por él metería su viaje a Japón en "30 días" sin decírselo.
- ⚠️ **Para llevarle a otro módulo, `navegarDesdeHoy(modulo, foco)`** (F28) — la única navegación con
  enlace directo de la app. `ObjectivesView` ya sabe destacar un id: mirar si el módulo de destino ya
  interpreta `foco` antes de escribir una pantalla nueva.
- ⏸ **NO HAY UN SISTEMA DE FOTOS GENERAL** (F28, apartado 7). Los que existen son de Salud, Armario,
  Biblioteca y Fondos, y una entrada del Diario no tiene fotos. Mientras no lo haya, **se dice en la
  pantalla**; nunca una galería paralela. Pendiente de que Josué decida.
- ⚠️ **"QUÉ SE VE" Y "EN QUÉ ORDEN" SON DE LA FASE 2** (F29, apartados 11, 12 y 15). `activo`,
  `orden`, `subirModulo`/`bajarModulo` y Gestionar apartados **ya existen**, y D2-07 prohíbe una
  cuarta lista. Una fase que quiera reordenar algo usa esas; la pantalla lo dice y lleva allí.
- ⚠️ **Una capa de resumen NO GUARDA NADA** (F29): las etiquetas, los estados y los recuentos se
  derivan en el momento. Así "se actualiza solo" no hay que programarlo: sale de no tener copia.
- ⚠️ **El estado de un módulo lo dice SU módulo** (F29, apartado 13). `FUENTES_DE_ESTADO` es una
  línea por módulo, como `MODULOS_EH`; **al añadir un módulo con pantalla, añadir su línea**, o
  saldrá "sin configurar" para siempre.
- ⚠️ **Lo que se deduce se marca como NO suyo** (F29, apartado 2). Una etiqueta sacada del armario no
  es una preferencia que él haya dicho, y la pantalla las distingue en vez de atribuírselas.
- ⚠️ **Y `pulsar()` del recorrido de Chromium SOLO PULSA BOTONES** (F29). Antes buscaba cualquier
  elemento con ese texto, y en cuanto una pantalla nueva **nombró** los módulos empezó a pulsar un
  título en vez de la plaquita. Si una fase futura repite un nombre en pantalla, esto ya lo aguanta.
- ⚠️ **AGRUPAR LOS MÓDULOS ES `CATEGORIAS_EH` + `modulosAgrupados()`** (F30, apartado 3). Si un
  enunciado pide otros grupos, **se ajusta la `categoria` del módulo** —una palabra en su línea—, no
  se escribe un mapa `id → grupo` aparte: eso es la base de datos duplicada que prohíbe la F2.
- ⚠️ **Renombrar una categoría es cambiar su `nombre`, NUNCA su `id`** (F30): "Bienestar" pasó a
  llamarse "Personal" y ningún guardado se enteró.
- ⚠️ **El orden de una sección es el de su módulo más arriba** (F29 y F30). `modulosAgrupados`
  devuelve las categorías en el orden fijo del catálogo, que en Gestionar apartados está bien pero
  en la portada dejaría el reordenado sin efecto.
- ⚠️ **Un atajo a un módulo apagado no se ofrece** (F30, apartado 9), y apagar el módulo lo esconde
  **sin borrar su elección**: al reactivarlo vuelve.
- ⚠️ **La portada lleva UNA LÍNEA por plaquita** (F30, apartados 8 y 15), y la escribe el
  `resumen…()` de su módulo. Ni estadísticas, ni historiales, ni rutinas completas, ni productos —
  **salvo que él las encienda** (F31): no automáticamente, pero puede.
- ⚠️ **LA PRESENTACIÓN DE UNA PLAQUITA NO SE GUARDA EN SU MÓDULO** (F31, apartado 12): *"cambiar la
  plaquita de Skincare solo cambia su representación… no modifica la configuración interna de
  Skincare"*. `tamanos` y `contenido` van en el almacén de la **pantalla**, indexados por id, y hay
  una prueba que lee el código y exige que `guardarConfig` solo se llame sobre el módulo anfitrión.
- ⚠️ **`LINEAS_DE_PLAQUITA` es una línea por módulo** (F31), como `MODULOS_EH` y `FUENTES_DE_ESTADO`.
  Al añadir un módulo con pantalla, añadir su línea — **y cada línea sale de su propio `resumen…()`**,
  nunca de un dato nuevo.
- ⚠️ **Los tamaños son TRES y declaran sus columnas** (F31, apartado 4). Si una fase futura necesita
  que algo ocupe dos columnas, **es `columnas: 2`**, no un `if` por id en el JSX. Y volver al defecto
  **quita la excepción**, no guarda una copia de la norma.
- ⚠️ **Una lista vacía no es "no hay lista"** (F31): sin `tieneLineas`, apagar todas las líneas de una
  plaquita hacía volver el resumen de la F30 por la puerta de atrás. Tercera vez de la lección de la
  F25 (`null` no es `[]`).
- ⚠️ **`restablecerDiseno` NO reactiva lo que él apagó** (F31, apartado 10) y
  **`personalizarAutomaticamente` no finge un "uso reciente"** que no se guarda en ningún sitio
  (apartado 17): dice el criterio de verdad. Décimo y undécimo `aplicarPlan`; **sin `confirmado` no
  escriben**.
- ⚠️ **Un límite que no puede saltar nunca es un control decorativo** (F31, apartado 7): el tope es de
  lo que **se pinta**, con su *"Mostrar todos"*, no de cuántos accesos puede elegir.
- ⚠️ **EL MOTOR DE RECOMENDACIONES ES `motorRecomendaciones.js`** (F16), y la F32 es su **cuarto**
  uso. Una fase que necesite recomendar algo **llama ahí**: nunca un cuarto `reglaAplicable`, nunca
  una segunda lista de palabras prohibidas. Y **una regla sin `requiere` no se aplica jamás**.
- ⚠️ **`null` NO ES CERO** (F32, apartado 9). Un módulo apagado deja su dato en `null`; contarlo como
  cero dispara ideas sobre algo que él ha decidido no usar. *"No lo sé"* y *"sé que no tiene ninguno"*
  son dos cosas, y `tieneDato()` del motor las distingue.
- ⚠️ **"Me interesa" NO SILENCIA: GUARDA** (F32, apartado 4). Callar lo que acaba de pedir sería lo
  contrario de lo que dice el botón. *"No me interesa"* calla también las de su tema (apartado 5);
  *"Ya lo hago"*, solo esa. Y **ningún descarte es para siempre**.
- ⚠️ **ANTES DE ESCRIBIR UNA RECOMENDACIÓN, MIRAR SI SU MÓDULO YA LA DA** (F32, prueba 13). Skincare,
  Pelo y Perfumes tienen su propio motor con datos mejores: las ideas generales son **cruzadas**, y
  cuando tocaría una suya **llevan allí** en vez de escribirla otra vez.
- ⚠️ **NO HAY UN SISTEMA DE FAVORITOS GLOBALES** (F32, apartado 15). Lo que hay son favoritos por
  módulo y las `guardadas` del motor. Se usa esa, y la pantalla dice dónde están (regla 8).
- ⚠️ **BORRAR EL HISTORIAL NO SE LLEVA LO GUARDADO** (F32, apartado 17): lo guardó él a propósito, no
  es historial. Duodécimo `aplicarPlan`; sin `confirmado` no borra nada.
- ⚠️ **DESCUBRIR (F33) NO ES IDEAS (F32).** Las dos enseñan tarjetas, se guardan, se descartan y
  tienen frecuencia, pero **💡 Ideas sale de SUS datos y explica por qué con sus cifras**, y
  **✨ Descubrir son ideas generales**: lo suyo solo decide cuáles se le enseñan, nunca el texto. Una
  tarjeta de Descubrir **no lleva `porque`**: inventarle uno sería atribuirle una razón que no tiene.
- ⚠️ **HAY UNA SOLA LISTA DE GUARDADOS** (F33, apartado 6), la de `ideasEstilo.js`, y se entra por
  `guardarEnLista`. Un módulo que quiera guardar algo ahí **pone el prefijo `desc_` a sus ids o
  declara el suyo en `idGuardable`**: sin eso, el normalizador de la F32 se los lleva (27.ª vez).
- ⚠️ **UN MÓDULO APAGADO NO APORTA CONTENIDO** (F33, apartado 4): cada tarjeta declara su módulo, y
  sin ese módulo activo no existe. Es el `null` de la F32 dicho de otra forma.
- ⚠️ **LAS ETIQUETAS SON DE CADA MÓDULO; EL COMPORTAMIENTO, DEL MISMO SITIO** (F33). Las frecuencias
  de Ideas son Baja/Normal/Alta/Nunca y las de Descubrir Poca/Normal/Mucha/Desactivada **porque así
  lo pone cada enunciado**: unificarlas sería contradecir a Josué.
- ⚠️ **UNA PRUEBA BUSCA EL MECANISMO, NO LA PALABRA** (F33, apartado 15). La frase que dice que NO
  hay seguidores contiene "seguidores", y la auditoría se llama igual: es la **quinta vez** en el
  bloque que una comprobación así habría saltado con algo que estaba bien.
- ⚠️ **NUNCA UNA COMPRA** (F33, apartado 10): ni la palabra, ni un carrito, ni un enlace inventado.
  El catálogo global está vacío a propósito (D2-03) y se dice.
- ⚠️ **LA FUENTE DE VERDAD DE UNA PREFERENCIA ES `REGISTRO_DATOS`** (F4), y la F34 lo dice con las
  palabras del enunciado: *"tipo de perfume → Perfumes. **No**: tipo de perfume → Mi estilo +
  Perfumes"*. `preferenciasEstilo.js` **no tiene almacén ni normalizador propios**, y hay una prueba
  que lee el código para comprobarlo. Antes de guardar una preferencia en un módulo, mirar el
  registro.
- ⚠️ **`misPreferencias()` (F27) ES LA VISTA DE PREFERENCIAS**, y la F34 la reutiliza agrupándola.
  Escribir otra habría sido la cuarta lista. **Quinta vez** que el registro de la F4 evita un
  duplicado.
- ⚠️ **UN AJUSTE VIVE DONDE SURTE EFECTO** (F34, apartado 7). *"Usar mis preferencias para
  recomendaciones"* se guarda en el almacén de la F32, y la pantalla de la F34 **solo lo lee**. Y
  **hace algo de verdad**: apagado, las reglas con `usaPreferencias` dejan de aplicarse.
- ⚠️ **OCULTAR Y ELIMINAR SON DOS ACCIONES** (F34, apartado 12), y *"al reactivar, recuperar la
  configuración"* **sale solo** porque `alternarModulo` no toca `config` desde la F1. No hace falta
  código: hacen falta dos frases y dos pruebas.
- ⚠️ **UN BORRADO GRANDE ENUMERA LO QUE SE VA Y LO QUE SE QUEDA** (F34, apartado 10). Borrar Estilo
  de hombre **no toca el armario, el diario, los objetivos ni el calendario**, y **no apaga sus
  apartados**: qué tiene encendido lo eligió él y no es un dato.
- 🚨 **`currentState` ES TAMBIÉN EL CONTEXTO QUE SE MANDA A LA IA.** La F34 necesitaba `estiloHombre`
  en la exportación (apartado 14) y **lo pasa aparte**, no dentro de `currentState`: meterlo ahí
  habría sido más corto y habría filtrado a la IA el perfil de piel, que tiene escrito que **no viaja
  a la IA** (F13, apartado 17). Antes de añadir algo a `currentState`, mirar quién más lo lee.
- ⚠️ **LA EXPORTACIÓN ES UNA SOLA** (`exportData.js`). Un módulo que quiera entrar devuelve **filas
  con la forma de siempre** (`modulo`, `fecha`, `detalle`, `valor`, `extra`) y no escribe ficheros.
- ⚠️ **UNA ESTADÍSTICA ES UNA VISTA, NO UN DATO** (F35, apartado 13). `progresoEstilo.js` **no guarda
  ni una cifra**: cuenta en el momento sobre los historiales que ya existen, y lo único guardado son
  preferencias de pantalla. Si una fase futura quiere "guardar el total", va a mentir en cuanto él
  borre un registro.
- ⚠️ **NUNCA UNA NOTA NI UNA COMPARACIÓN** (F35, apartados 3 y 9): ni *"73/100"*, ni *"mejor que el
  mes pasado"*. Se enseña el número y su nombre. Hay una prueba que barre todos los textos.
- ⚠️ **SIN NI UN REGISTRO NO SE ENSEÑA UN CERO** (F35, apartado 10): se dice *"todavía no hay
  suficientes datos"*. Pero **con historial, un cero en el periodo SÍ se enseña**, porque eso es un
  dato. Distinguir las dos cosas es la lección de `null` frente a `[]` de la F25.
- ⚠️ **AÑADIR UNA MÉTRICA ES UNA LÍNEA EN `METRICAS_PROGRESO`** (F35), como `MODULOS_EH` o
  `LINEAS_DE_PLAQUITA`: su módulo, su tipo y de dónde sale el dato. Ni un `case`, ni un `if`.
- ⚠️ **EL "GRÁFICO" SON OCHO CARACTERES** (F35, apartado 6): `▁▂▃▄▅▆▇█`, agrupados a catorce barras
  como mucho. Ni una librería, ni un `<canvas>`, ni un SVG — y si una fase futura quiere un gráfico,
  releer el apartado antes.
- ⚠️ **LA RACHA ES LA GLOBAL Y EL OBJETIVO ES EL GLOBAL** (F35, apartados 7 y 8; F23 lo dijo primero).
  Si no los tiene, `null` y no se pinta. Nunca proponerle crear una.
- 🚨 **LO QUE JOSUÉ SUBE A MANO A GITHUB NO INCLUYE LAS CARPETAS.** Sus seis `Add files via upload`
  solo llevaron los **nueve archivos sueltos de la raíz**: ni uno de `src/`. Por eso `main` tenía la
  documentación nueva y el código del 11 de agosto, y la web no cambiaba por más zips que subiera.
  **Desde v1.90.0 el trabajo se lleva a `main` desde aquí y la web se actualiza sola**; el zip es una
  copia de seguridad, no la forma de publicar. Si alguna vez vuelve a decir *"la web sigue igual"*,
  **mirar primero en qué versión está `main`**, no el zip.

⚠️ **Y dos lecciones de las pruebas de este bloque:** cuatro veces una comprobación saltó con algo
que estaba **bien** —"conseguir" contiene "seguir", la frase que dice cuándo llega el calendario, el
`fotos: 0` de una auditoría y el recuento de colecciones de F8 al añadir una legítima—. **Mirar qué
línea la hace saltar antes de tocar el código.** Y la otra: **el fallo del normalizador ya va por la
decimoctava vez** (F9 lo cazó en el mismo turno). Al añadir un campo, añadirlo a su normalizador.

⏸ **SO · Fase 2 (biblioteca de sonidos) está bloqueada, y por un motivo real:** no hay ni un archivo
de audio en el proyecto. Josué escribió en la especificación que los daría *"cuando la web ya tenga
todos los botones activos"*, y F2 es literalmente la fase que los necesita. El motor de F1 está
entero y funciona; lo único que falta son los sonidos.

Seis cosas que conviene tener presentes al retomar:

- **D2-01: Sonido y Rachas son DOS módulos independientes** (5 fases + 4). Rachas está cerrado 4/4;
  Sonido va por 3/5 (F1, F3 y F4), y **F3 y F4 se adelantaron a F2 a propósito** porque no
  necesitan los archivos. Lo que queda (F2 y F5) sí.
- ⚠️ **`especificacionSonidos.js` DEFINE la biblioteca, no la crea** (SO F4). `queFalta()` dice
  exactamente qué archivos tiene que dar Josué y por dónde empezar.
- ⚠️ **`audioEventos.js` NO redefine el catálogo de SO F1: lo traduce** (SO F3). Y los eventos que
  nadie emite —XP, niveles, recompensas— llevan escrito por qué, con prueba.
- **D2-02 sigue en pie: no sobregamificar.** XP y niveles solo dentro de Sonido/Rachas.
- **El motor de rachas no guarda ni un contador** (`src/lib/rachas.js`, RA F1). Todo se deriva del
  historial. Si una fase futura pide "guardar la racha", hay que releer el apartado 24.
- **`src/lib/rachasServicio.js` es el ÚNICO sitio que escribe rachas** (RA F2), y
  **`src/lib/audioEngine.js` el ÚNICO que toca el audio** (SO F1, con regla invariante que lo
  comprueba). Ninguna pantalla toca Supabase ni reproduce sonido por su cuenta.
- **El horario es una REGLA, no una lista de eventos** (HT F1), **no tiene tablas propias en
  Supabase** (HT F2, apartado 51) y **sus asignaturas son las de Estudios** (apartado 25).
- ⚠️ **`ALCANCES` no tiene valor por defecto** (HT F3, apartados 52-53): editar un bloque sin decir
  si el cambio es de un día o de todos **no escribe nada**. Nunca ponerle un defecto: cambiar la
  hora "porque hoy hubo un cambio" se cargaría todos los lunes del curso, y sin avisar.
- ⚠️ **Un normalizador que no conoce un campo lo BORRA en el siguiente guardado.** Pasó en HT F2 con
  `visible` de las columnas **y otra vez en HT F4** con `archivado` (archivar un horario funcionaba
  hasta recargar). Al añadir un campo a una entidad, añadirlo también a su normalizador.
- ⚠️ **Nada se mueve en silencio** (HT F4, apartado 30). Toda operación de estructura que pueda dejar
  clases fuera de sitio tiene su `impacto*()`, que se enseña **antes** de escribir. Si una fase
  futura añade otra, tiene que traer la suya.
- **Las semanas A/B se CALCULAN desde una fecha ancla** (HT F4), igual que las rachas. Si algo pide
  guardar "esta semana es la B", es un contador y miente.
- **El zoom y la densidad del horario van a `localStorage`, no a Supabase** (HT F4, apartado 59): el
  iPhone y el ordenador no tienen la misma pantalla.
- ⚠️ **Los bloques multifila y multicolumna siguen sin pintarse** (apartados 15-18 de HT F4). El
  modelo ya los permite —un bloque guarda sus horas, no una fila—, así que uno de 8:00 a 10:00 ya
  ocupa dos franjas en los datos: falta **pintarlo estirado**, y eso es trabajo de cuadrícula.
- ⚠️ **Las notas privadas de una actividad NO viajan en el contexto de la IA** (HT F5, apartados 52
  y 73), y hay una prueba que falla si aparecen. Si una fase futura amplía `contextoActividadIA`,
  releer esa prueba antes.
- **Nada de la actividad que se pueda derivar se guarda** (HT F5): usos, tiempo semanal, recientes,
  más usadas y carga por día salen de los bloques. Lo único guardado es "favorita", que la pone él.
- ⚠️ **`horarioTop.js` es la ÚNICA puerta al módulo desde fuera** (HT F12). Y su auditoría está
  atada al código: borrar una función del horario hace fallar `test-horario-top.mjs`.
- ⚠️ **La exportación NO se lleva el histórico de uso** (HT F12): lo confirmado, los avisos dados y
  la mochila de cada día son de este curso. Importar es idempotente por id.
- ⚠️ **La analítica no tiene caja negra** (HT F11): toda cifra lleva su origen, y hay una prueba que
  recorre TODOS los textos generados buscando reproches. Si una fase futura añade texto, releerla.
- ⚠️ **`avisosHorario.js` DECIDE, `notificaciones.js` MANDA** (HT F10). Nunca añadir un segundo
  emisor: el interruptor global, las categorías y el horario de descanso son de la Fase A4.
- ⚠️ **`aplicarPlan` sin `confirmado` no hace nada** (HT F9): es la regla 7 en código, no una
  comprobación defensiva. Nunca darle un valor por defecto.
- ⚠️ **`contextoParaIA` nunca lleva notas privadas ni nada de Relación** (HT F9), con pruebas. Si
  una fase futura amplía lo que se manda, releerlas antes.
- ⚠️ **PASADA no es COMPLETADA** (HT F8): lo primero se calcula del reloj, lo segundo lo confirma
  Josué y es lo único que se guarda. Nunca guardar un estado temporal: miente en un minuto.
- ⚠️ **La excepción gana a la regla** (HT F8, apartado 45), y **nada importante se ejecuta sin
  confirmar** — ni dentro de un "hacerlo todo".
- ⚠️ **La mochila es DERIVADA** (HT F7) y lo añadido a mano lleva `manual: true` por escrito: es lo
  único que impide que el recálculo lo borre (apartado 57). Nunca quitar ese campo.
- ⚠️ **`src/lib/hoy.js` NO GUARDA NADA** (HT F6, apartado 102): es una función de lectura sobre las
  entidades originales. Si una fase futura quiere "guardar lo de hoy", es una copia y va a mentir.
- ⚠️ **Antes de construir algo de HOY, mirar si ya existe.** El 90 % de HT F6 fue no duplicar:
  `eventosDerivados`, `lineaDelDia`, `huecosDelDia` y `puntuacion.js` ya estaban.
- ⚠️ **Las tareas NO se enlazan con una asignatura**: Productividad no tiene ese campo, así que se
  buscan por mención y la pantalla lo dice. Si algún día se le añade `asignaturaId` a las tareas,
  `tareasQueMencionan` deja de hacer falta.

⚠️ **Recordatorio para Josué:** faltan por ejecutar en el SQL Editor de Supabase **dos** bloques
de `supabase/schema.sql` — el del bucket `armario` (AR F1) y el del bucket `fondos` (FO F2). Sin
ellos todo funciona menos subir fotos de prenda y fotos de fondo.

El bloque **R0** ya está completo (v1.23.0) y **C-11** —el modelo de IA obsoleto— está resuelto:
`api/ask-ai.js` lee `ANTHROPIC_MODEL` y por defecto usa un modelo vigente.
