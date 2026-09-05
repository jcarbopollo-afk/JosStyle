# CHANGELOG.md

## v3.39.0 — Entrega 3 · Fase 18 (BL F4): Biblioteca — Guardados

Tipos, favoritos, archivar, búsqueda por seis campos, filtros, orden y detalle. *"Guardados debe
funcionar como un archivo personal de recursos."*

### La colección sigue siendo la de Josué
`biblioteca.enlaces`, la de la Fase 11 que la BL F1 identificó como Guardados. Lo que hace esta fase
es **ampliar la ficha** —tipo, contenido, nota, favorito, estado y colección— **con su migración**:
un enlace viejo se convierte en un guardado de tipo enlace **sin perder un solo campo** y sin que su
fecha cambie, porque no lo guardó hoy. Vigésima vez que este proyecto paga el fallo del normalizador.

### 🚨 Lo que se puede saber de una dirección, y lo que no
El enunciado lo condiciona —*"si técnicamente es posible obtener metadata de una URL"*—, y la
respuesta honesta es que casi nada:

- El **dominio** sale de la propia dirección. Es un dato de verdad, y además **se busca**: escribir
  "youtube" encuentra un enlace cuyo título no lo dice.
- El **favicon** se le pide **al sitio mismo**, sin pasar por ningún servicio de terceros que vería
  qué guarda Josué. Si falla, la tarjeta usa el icono de su tipo y sigue funcionando.
- El **título** y la **imagen de portada** exigirían descargar la página y leerle las etiquetas, y
  el navegador no puede: lo impide la política de origen cruzado. Así que **no se fingen** — la
  pantalla dice, en una frase, que el título se escribe a mano. Y `preview_image_url` **no existe
  como campo**: guardar uno que nadie puede rellenar es prometer una función que no existe.

### Guardar es pegar y dar a guardar
Lo único imprescindible es una dirección o un texto. El tipo **se deduce**, el título es opcional, y
la descripción y la nota están detrás de un *"Añadir descripción o nota"*: *"no obligar a rellenar un
formulario enorme"*.

### Archivar no es eliminar
*"Un elemento archivado deja de aparecer entre los guardados activos. **No eliminarlo.**"* Lo
archivado desaparece de la lista —si siguiera saliendo, el botón no haría nada visible— y sale
**solo** en su filtro, entero. Eliminar sigue yendo a Eliminados recientes, la papelera que ya
existe: *"no crear una segunda papelera exclusiva si no hace falta"*.

Y la papelera enseña ahora también la dirección o el contenido, porque el título es opcional y una
fila en blanco no dice qué se está recuperando.

### Compartir desde el móvil: preparado, no fingido
*"Solo dejar la estructura preparada."* `crearDesdeCompartido` **ya existe y funciona** —incluso
cuando Safari mete la dirección dentro del texto—, y lo que falta está escrito: un `share_target` en
el manifiesto y **un service worker**, que es exactamente la decisión que la E3 F15 dejó a Josué
(DEP-30). Por eso el manifiesto **no lo declara**: un *Compartir* que Safari ofrezca y que luego no
guarde nada sería peor que no ofrecerlo.

### Y la diferencia con Notas, dicha en la pantalla
El enunciado la marca como IMPORTANTE —*"no permitir que Guardados se convierta en otra app de
notas"*—, así que no se queda en un comentario: se lee debajo de la lista, y hay una prueba de que
Guardados no toca `biblioteca.apuntes`.

**Verificación: `═══ TODO CORRECTO ═══`. 109 comprobaciones nuevas de Node, 44 casos de renderizado
nuevos y 597 en Chromium.**

## v3.38.0 — Entrega 3 · Fase 17 (BL F2): Biblioteca — Libros

La mini-app entera: estados, progreso, portada, notas, filtros, búsqueda, orden, historial y
estadísticas básicas. *"Debe ser visual y agradable, **no un gestor bibliográfico complejo**."*

### Una sola fábrica de libro, no dos
La BL F1 dejó el modelo mínimo —título, autor y fecha— para que su botón de crear escribiera algo
de verdad. `crearLibro` y `normalizarLibro` **se han mudado a `src/lib/libros.js`**, y
`biblioteca.js` las importa y las reexporta. Escribir una segunda fábrica habría dejado dos formas
del mismo libro conviviendo, y la que perdiera se llevaría campos en el siguiente guardado (regla 5).

### Lo que el enunciado prohíbe hacer con los datos, cumplido en el DATO
- 🚨 **Nunca más de un 100 %.** No se comprueba al pintar: **la página no puede pasar del total**,
  ni al crear el libro, ni al editarlo, ni al normalizar lo guardado.
- 🚨 **Sin total de páginas no hay porcentaje**, y devuelve `null` — no un 0 %. Un cero diría que no
  ha leído nada de un libro cuyo tamaño simplemente no conocemos.
- 🚨 **El porcentaje no se guarda**: se deriva. Guardarlo haría que mintiera en cuanto él corrija
  las páginas.
- 🚨 **Terminar un libro no borra nada de antes.** La fecha de inicio se queda, una fecha de fin que
  ya tuviera no se pisa, y sacarlo de *Terminado* tampoco la borra.
- 🚨 **Los terminados no se borran**, y la forma de cumplirlo es que **no exista ninguna función que
  los quite**.
- ⚠️ **Volver a un libro tras una pausa no reescribe cuándo lo empezó.**

### 🚨 Y el fallo que encontró el navegador
`LibraryView` usaba `onUpdateLibro`, `onSubirPortada` y `onBorrarPortada` **sin destructurarlos en
sus props**. La pantalla de Libros lanzaba `onUpdateLibro is not defined` al abrirse y **se veía en
blanco**.

No lo vieron **ni el build, ni las 1544 pruebas de renderizado** —que pintan el componente hijo
directamente, con sus props puestas a mano— **ni las de Node**. Es la misma familia que `<Field>` en
EH F39, y ahora `scripts/test-imports.mjs` tiene una **regla invariante que lo caza en un segundo**.

🐛 Su primera versión **no cazaba nada**, y por un motivo que merece quedar escrito: en
`onUpdate={onUpdateLibro}` el nombre usado va seguido de `}`, que es exactamente la forma de una prop
destructurada — así que **el uso se contaba a sí mismo como declaración**. Se arregla quitando los
valores de las props antes de buscar declaraciones. Comprobado quitando la línea buena y viendo la
regla ponerse roja.

### Las portadas usan el almacenamiento que ya existe
El bucket `biblioteca` de la Fase 11, el mismo de los PDF y los vídeos: *"no crear otro sistema de
almacenamiento"*. **Ni un bloque de SQL nuevo que Josué tenga que ejecutar.** Se guarda el **camino**,
nunca la URL firmada —caduca en una hora—, y un libro sin portada dibuja sus iniciales en vez de una
imagen inventada. Eliminar un libro se lleva su portada del almacenamiento: dejarla sería un archivo
huérfano ocupando sitio para siempre.

### La pantalla
Resumen real arriba (*"2 leyendo · 1 pendiente · 1 terminado"*), **Continuar leyendo** con el libro
que tocó más recientemente —derivado de `actualizado`, sin contador guardado—, rejilla de dos
columnas, filtros sacados de los propios estados, búsqueda por título y autor **sin acentos ni
mayúsculas** (nadie escribe tildes en el móvil), cuatro órdenes y el detalle a pantalla completa con
`createPortal` (regla 3).

Un formulario, no dos: el mismo crea y edita.

**Verificación: `═══ TODO CORRECTO ═══`. 114 comprobaciones nuevas de Node, 52 casos de renderizado
nuevos y el recorrido de Chromium.**

## v3.37.0 — Entrega 3 · Fase 16 (BL F1): la Biblioteca como lanzador de mini-apps

Empieza el bloque de **Biblioteca**. *"Biblioteca debe funcionar como una base de conocimiento
personal, pero presentada visualmente como un launcher de mini-aplicaciones."*

### 🚨 Lo primero que pedía el enunciado no era construir: era mirar

*"Antes de modificar: analiza la implementación actual… identifica si existen notas, documentos,
libros u otras estructuras. **Identifica posibles duplicaciones. No elimines datos existentes sin
comprobarlos.**"*

Y al mirarla, **tres de las seis mini-apps ya existían con otro nombre**:

| Mini-app | Lo que ya había | Desde |
|---|---|---|
| 📝 Notas | `biblioteca.apuntes` | Fase 11 |
| 🔖 Guardados | `biblioteca.enlaces` | Fase 11 |
| 📄 Documentos | `bibliotecaArchivos` (PDF, vídeo, foto) | Fase 11 |

Así que **no se ha creado ni una lista nueva para ellas**. Crear `notas` al lado de `apuntes` habría
dejado los apuntes de Josué **invisibles en su propia biblioteca**, que es exactamente lo que el
criterio de éxito 15 prohíbe. `MAPEO_EXISTENTE` lo declara en código, con una prueba que lo recorre.

Las otras tres —**Libros**, **Ideas** y **Colecciones**— sí son nuevas, con el modelo **mínimo** que
hace falta para que su botón de crear escriba algo de verdad. El gestor completo de cada una es de
las fases BL F2, F5 y F7.

### 🚨 El fallo que apareció al enchufar la pantalla

Desde la **E3 F6**, `App.jsx` le pasaba a la Biblioteca los apuntes de **Productividad**:

```jsx
onAddApunte={addApunteDelDia} onDeleteApunte={deleteApunteDelDia}
```

Guardar una nota en la Biblioteca metía el objeto entero en `productividad.apuntes` —donde se espera
un texto— y su botón de eliminar buscaba el id en la lista equivocada: **no borraba nada y no daba
un solo error por pantalla**. Y del otro lado, `addApunte` y `deleteApunte` llevaban desde entonces
**sin que nadie las llamara**. La firma del proyecto: *una función que nadie llama no falla nunca*.

### 🐛 Y un segundo silencio, éste en las propias pruebas

El stub de Supabase de `scripts/smoke.mjs` exportaba `getSignedArchivoUrl`, **un nombre que
`supabase.js` no exporta**, y no tenía ninguno de los de Fondos. Consecuencia: cualquier vista que
importara el nombre de verdad **no compilaba en el banco de renderizado**, y esa vista se quedaba
fuera sin que nada lo dijera — `LibraryView` llevaba **desde la Fase 11 sin un solo caso**.

Ahora tiene 84, y `scripts/test-imports.mjs` estrena una **quinta regla invariante** que compara las
dos listas de exportaciones. Al arreglarla salieron dos huecos más: `signUp`, `signIn` y
`vigilarLaConexion` tampoco estaban.

### La pantalla

Seis plaquitas en dos columnas, con **iconos de Lucide** —el enunciado prohíbe expresamente los
emojis gigantes como diseño definitivo—, entrando en cascada con `.hub-card`, **la misma animación
que ya usan los hubs** desde la Fase N2. Cada mini-app tiene su título, su botón de volver, su ＋ y
su estado vacío con salida. Y **la diferencia con su vecina se dice en pantalla**: el enunciado
dedica tres apartados a que las seis sean *"claramente diferenciables"*.

Los indicadores (`1 nota`, `2 libros`) salen de los datos de verdad, y **lo que está vacío no enseña
un cero**: *"no inventar números"*.

**Notas se abre, se escribe y se guarda**: el texto va primero y el título es opcional, sin
categoría, etiquetas ni proyecto (criterio 10).

### ⏸ Y una contradicción del documento, anotada como C-27

**Falta la Fase 3 de Biblioteca** —el rótulo dice *"Biblioteca 8"* y el documento va F1, F2, F4, F5,
F6, F6, F7, F8— y **la Fase 6 está duplicada** palabra por palabra. Por el orden de las mini-apps, la
que falta es **Notas**. No bloquea nada, porque esta fase ya las deja funcionando; queda para
preguntarle a Josué.

### Ni una tabla nueva, ni un SQL que ejecutar
La Biblioteca escribe en las dos claves de `app_data` y en el bucket que ya tenía. Cada usuario ve
solo la suya, y lo garantiza la base de datos: `auth.uid() = user_id`.

**Verificación: build, 107 comprobaciones nuevas de Node, 84 casos de renderizado nuevos y el
recorrido de Chromium.**

## v3.36.0 — Entrega 3 · Fase 15 (HC F10): PWA, iPhone y auditoría final

🏁 **Cierra el bloque Hoy y Calendario**: las diez fases HC, de la 6 a la 15.

*"Conseguir que JosStyle funcione como una aplicación instalada, y no simplemente como una página
web."* Y el enunciado acota: *"esta fase es de estabilización… **NO añadir nuevas funcionalidades de
planificación. NO añadir IA.**"* Así que su trabajo es **comprobar**, no construir.

### Lo que estaba mal en la aplicación instalada

- 🚨 **No había icono para el iPhone.** Sin `apple-touch-icon`, al añadir JosStyle a la pantalla de
  inicio Safari usa **una captura de la página** — que es justo lo que el apartado 4 llama *"un icono
  provisional"*. Ya está.
- 🚨 **Ningún icono era recortable.** Sin uno `maskable`, en Android el icono sale con un borde
  blanco alrededor (apartado 4).
- **Y al manifiesto le faltaban** la orientación, el ámbito, el idioma y la descripción (apartados 2
  y 3).

### La auditoría lee archivos de verdad

Cada cosa que el enunciado pide se comprueba **contra el archivo real** —`public/manifest.json`,
`index.html`, `index.css`, `supabase/schema.sql`—, nunca contra una casilla puesta a mano. Es lo que
EH F64 dejó escrito: *"las casillas se CALCULAN; no las pongas a `true`"*. Y **cada revisor puede
fallar**: hay una prueba por cada uno que le da algo roto y comprueba que lo caza.

- **Las seis piezas de la Safe Area** siguen en `index.css` (apartados 6, 7 y 8). Si una fase futura
  las borra, esto salta.
- 🚨 **`viewport-fit=cover`**, sin el cual las zonas seguras **valen cero** y todo lo anterior sobra.
- 🚨 **Las cuatro políticas de `app_data`** atadas a `auth.uid() = user_id`, y **ninguna permisiva**
  (apartados 15, 16 y 17). El aislamiento es de la base de datos, nunca de la pantalla (EH F43).

### ⏸ Y tres cosas siguen sin poderse, con su riesgo escrito

Ninguna es un descuido, y las tres las decide Josué (`LO_QUE_DECIDE_JOSUE`):

1. 🚨 **El service worker** (apartado 11), que es la pieza que falta para abrir sin conexión **y**
   para los avisos con la app cerrada. **No se añade a ciegas, y el motivo es el fallo histórico de
   este proyecto:** mal configurado deja la aplicación **congelada en una versión vieja** — se
   abriría siempre la de antes por más código que se suba, y JosStyle ya perdió meses exactamente
   así. Queda como **DEP-30** en `docs/03`.
2. **La sincronización entre dispositivos** (13 y 14): gana el último que escribe, porque `app_data`
   no guarda una versión. Declarado desde EH F41.
3. **La autenticación del endpoint de la IA** (17), que viene de EH F63.

## v3.35.0 — Los objetivos sí tenían tamaño

### Qué se ha conectado
`MAJOR_GOAL_COMPLETED`, que estaba declarado como *"no hay objetivos mayores: uno se cumple o no,
sin tamaño"*. **Era falso, y bastaba mirar el modelo.**

`PLAZOS_OBJETIVO` va de **30 días a 10 años**. Cumplir un objetivo a diez años vista no es lo mismo
que cumplir uno a treinta días, y la frontera no se inventa aquí: son los dos plazos que la propia
lista pone por encima del año.

### El recuento honesto de archivos
De los 46 que produjo Josué, **45 los alcanza un camino vivo**. El único que ningún evento emitido
puede reproducir hoy es **`level_up.mp3`**, porque la aplicación no tiene niveles.

No es un archivo mal hecho ni sobrante del catálogo: está en la biblioteca porque la especificación
lo pide, y sonará el día que existan los niveles. Pero decir que "todo funciona" sin nombrarlo sería
mentir por omisión.

### 🐛 Y un detalle del detector de emisores
La primera versión escribía el evento dentro de un ternario, y la prueba —que busca el nombre
literal— lo dio por no emitido. Se corrige escribiendo los dos `emitir` enteros.

⚠️ No es un apaño para contentar al test: **un evento escondido en una expresión también es más
difícil de encontrar para una persona**. Que el código sea legible para esa prueba es parte de que
la prueba sirva.

## v3.34.0 — Entrega 3 · Fase 14 (HC F9): pulido visual, UX y animaciones

*"Hoy + Agenda + Calendario deben sentirse como una única aplicación premium."* Y el enunciado acota
la fase en su primera línea: *"NO rediseñar módulos que no estén relacionados con este sistema. El
objetivo es pulir lo existente, no cambiar su lógica."*

Así que aquí **no se rediseña nada**: se declara qué tiene que cumplir cada pantalla del bloque y
**se comprueba leyendo el código**, como `revisarPantalla()` en EH F42. Una regla escrita en un
comentario se olvida; una que se ejecuta en cada `verificar.sh`, no.

### 🚨 Y lo que faltaba de verdad era la pantalla de carga

*"Nunca mostrar una pantalla completamente vacía mientras se cargan datos"* (apartado 23). **Y eso
era exactamente lo que había**: una rueda girando sobre un fondo liso. Ahora se dibuja **la forma de
Hoy**, que es la pantalla que va a aparecer, así que no hay salto al cargar (apartado 21).

Los esqueletos de las cinco pantallas están en `ESQUELETOS`, y cada uno declara **a qué se parece** —
*"deben respetar la forma real de las cards"* (24)—. El latido vive en `index.css`, así que respeta
*"Reducir movimiento"* **solo**: el apartado 18 cumplido sin escribir una línea más.

### Lo demás que no existía

- **Los vacíos del bloque** (26-29), con sus palabras. 🚨 Y el 29 es el que se rompe sin darse
  cuenta: *"no mostrar falsamente «Todo hecho» si realmente existen elementos pendientes"*. Por eso
  Hoy tiene **dos** vacíos y `vacioDeHoy()` mira los datos de verdad — con pendientes **no dice
  ninguno de los dos**.
- **Los textos de error** (25): *"no mostrar error técnico"*. Cada uno dice qué ha pasado y qué
  hacer, sin una palabra técnica.
- **El feedback al completar y al crear** (15, 16 y 17): 300 ms y un desplazamiento pequeño — el
  apartado 16 dice *"no hacer confeti exagerado para cada tarea"*, y se cumple.
- **Un revisor de las cinco pantallas**, que corre en cada verificación.

### Lo que esto deja apuntado

- 🐛 **Dos animaciones estaban declaradas y no escritas.** `tarea-hecha` y `aviso-entra` vivían en el
  catálogo y **no existían en el CSS**: la prueba que comprueba que cada clase declarada existe las
  cazó en el primer intento. Es la regla 8 en su forma más sutil — un catálogo que promete algo que
  no está.
- 🐛 **Y una regla del revisor no cazaba su propio ejemplo malo.** La expresión de las animaciones
  largas excluía las comillas, así que se paraba en `transition: '` y daba siempre cero problemas.
  **Un revisor que no puede fallar no sirve** (EH F42), y por eso cada regla trae su `ejemploMalo`
  con una prueba de que lo caza.
- ⚠️ **La mitad de los apartados ya los cumplía el proyecto**, y se declaran en `YA_PULIDO` con lo
  que los resuelve: las cards, los botones, lucide, el ＋ de la F9, las hojas inferiores, los 44 px y
  *"Reducir movimiento"*. Rehacerlos habría sido el rediseño que la primera línea prohíbe.
- ⏸ **La posición del scroll (apartado 22) se explica en vez de construirse**: JosStyle no tiene
  rutas —cambiar de vista es cambiar un estado— y el navegador ya mantiene el scroll de la página.
  Guardar una posición propia sería un segundo mecanismo para algo que ya pasa.
- 🐛 **Y mi esqueleto usaba un `pt-16` a ojo.** La Safe Area del iPhone vive en `index.css` desde la
  E3 F1, y **su propia comprobación lo cazó**: un número fijo mete el contenido debajo de la hora del
  teléfono. Es la guardia de una fase anterior atrapando a la siguiente, que es para lo que está.

## v3.33.0 — Entrega 3 · Fase 13 (HC F8): estadísticas de planificación

*"¿En qué estoy utilizando mi tiempo? ¿Cuánto planifico? ¿Cuánto cumplo? ¿Qué días estoy más
cargado?"*

### 🚨 Y el enunciado lo enmarca en su primera línea

*"Esto NO es un sistema de productividad independiente. Las estadísticas deben utilizar los datos
que ya existen."*

Así que `estadisticasPlan.js` **no guarda ni una cifra**: cuenta en el momento sobre
`calendario.eventos` y `productividad.tareas`, igual que `progresoEstilo.js` (EH F35) y por el mismo
motivo — **una estadística guardada miente en cuanto él borra un registro**.

### Las tres cosas que el enunciado prohíbe

1. 🚨 **No inventar un porcentaje** (apartado 6). Con menos de tres cosas completables,
   `cumplimiento` devuelve **`null`** y la pantalla dice *"Sin datos suficientes"*. Y un día sin nada
   que completar **no tiene porcentaje**: dibujarlo como un cero sería inventarse un mal día donde no
   tocaba nada.
2. 🚨 **No estimar una duración que no existe** (apartados 11 y 12). Un evento con hora de inicio y
   **sin hora de fin no dura una hora por defecto**: no se cuenta, y se dice cuántos quedaron fuera —
   un total sin ese aviso parecería el tiempo real de la semana.
3. 🚨 **No inventar historial retroactivo** (apartado 17): *"si actualmente NO existe historial de
   reprogramaciones, NO inventarlo"*. No existe —una tarea guarda la fecha que tiene ahora, no las
   que tuvo antes—, así que está en `NO_MEDIBLE_TODAVIA` con su motivo, junto a las horas reales y
   los eventos finalizados.

### Y ni una interpretación (apartados 14 y 25)

*"No convertirlo en una recomendación. Es simplemente información."* Se enseña el número y su
nombre; la comparación con el periodo anterior da **↑ +8**, nunca *"vas mejor"*. Hay una prueba que
barre todos los textos que genera el archivo buscando palabras de juicio.

### Lo que trae

- **El resumen** (3 y 5): planificado, hechos, pendientes y cumplimiento, calculados de verdad.
- **El gráfico, que son ocho caracteres** (7 y 23): `▁▂▃▄▅▆▇█`, agrupados a catorce barras — el
  enunciado lo pide literalmente así, y es lo que ya usaba EH F35. Ni una librería.
- **La carga por día** (8) y los días con más elementos (14), como información y no como consejo.
- **Qué planificas** (9) y **cuándo** (10), con las franjas declaradas — y ⚠️ **sin nada con hora no
  hay distribución**: repartir el 100 % entre franjas vacías sería inventarlo.
- **Las atrasadas** (16), que llevan a la lista de Productividad: *"no crear otra base de datos"*.
- **Las recurrentes** (18), contando apariciones sobre la regla de la F10.

⚠️ **Y lo que ya mide otro módulo, se queda ahí** (19, 20, 21 y 22): las rachas y el cumplimiento de
hábitos son de Hábitos, y el tiempo de Pomodoro **no se mezcla** con las horas planificadas — son
métricas distintas, y el apartado lo dice.

### Lo que esto deja apuntado

- ⚠️ **Un evento cuenta como planificación, nunca como incumplimiento**: un evento ocurre, no se
  completa (la regla de la E3 F6). Meterlo en el denominador bajaría el porcentaje por cosas que
  simplemente pasaron.
- 🐛 **Y dos expectativas mías estaban mal**: con una tarea **diaria**, las apariciones completadas
  cuentan como tareas completadas (eran cuatro, no dos) y **no queda ni un día sin nada que
  completar**. El código tenía razón las dos veces.

## v3.32.0 — Entrega 3 · Fase 12 (HC F7): calendarios externos

*"Permitir conectar Apple Calendar / iCloud, Google Calendar y Outlook."* Y la regla que abre el
enunciado: *"las integraciones externas NO deben sustituir al calendario interno."*

### ⏸ Lo que no se puede construir hoy, y por qué

**Google y Outlook necesitan OAuth, y OAuth necesita dos cosas que solo puede dar Josué:**

1. **Registrar JosStyle** en Google Cloud Console y en el portal de Microsoft. Nadie más puede: van
   atadas a su cuenta.
2. **Un sitio seguro donde guardar el acceso.** El apartado 26 es tajante: *"nunca almacenar en
   localStorage, código frontend o variables accesibles públicamente"*. Hoy hay **una** función de
   servidor (`api/ask-ai.js`) y ninguna tabla para esto.

🚨 **Así que el botón «Conectar Google Calendar» NO se construye.** Un botón que no puede conectar
nada es el control decorativo que prohíbe la regla 8 — y fingir la conexión sería peor: le haría
creer que sus exámenes están sincronizados cuando no lo están. Queda anotado en `docs/03` como
**DEP-29** y en `LO_QUE_NECESITA_JOSUE`, con quién decide cada cosa (regla 49).

### 🍎 Y lo que sí queda hecho, que es la mayor parte

**El camino de Apple, entero y funcionando.** El apartado 4 lo dice con sus palabras: *"si el acceso
directo completo a iCloud no es viable… implementar la alternativa oficialmente soportada más segura.
Por ejemplo: importación mediante archivo `.ics`"*. Eso **no necesita credenciales de nadie**, y
sirve igual para iCloud, Google y Outlook: los tres exportan ese formato.

Ajustes → Integraciones tiene ahora **«Añadir un calendario»**, y sus eventos entran en
`calendario.eventos` como cualquier otro — por eso salen en **Hoy, en la Agenda y en el Calendario**
(apartados 10, 11 y 12) sin que nadie los copie.

El lector aguanta lo que trae un archivo de verdad: líneas plegadas, comas escapadas, eventos de todo
el día, y **las horas en UTC pasadas al reloj de Josué** — un evento de las 23:30 no puede salir el
día siguiente (apartado 24, y séptima vez de esa lección).

### Lo demás

- **Los cuatro campos de un evento externo** (22 y 23): `origen`, `idExterno`, `calendarioExterno`,
  `cuentaExterna` — campos **del evento que ya existe**, no de una tabla nueva.
- 🚨 **No se duplica, y nunca por el título** (13, 21 y 32): *"si un evento externo y uno interno
  tienen el mismo título/hora, **NO** asumir que son el mismo. Solo vincularlos mediante
  identificadores reales."* Hay una prueba con ese caso exacto.
- **Se distinguen sin otra interfaz** (9): ⚡ JosStyle · 🔗 Google Calendar · Estudios.
- **Desconectar no borra lo interno** (25): un plan que **sin `confirmado` no escribe**, y que
  enumera lo que se va y lo que se queda.
- **Los estados y la última sincronización** (28, 29, 30 y 31), y los cinco dicen lo mismo al final:
  *"tus eventos de JosStyle siguen igual"*.

### Lo que esto deja apuntado

- 🚨 **Ni un secreto en el frontend**: hay una prueba que barre el archivo buscando `client_secret`,
  `access_token`, `refresh_token` y `localStorage`. Es la restricción del apartado 26 hecha código.
- ⚠️ **Un evento importado nace de solo lectura**: se cambia en su calendario, no aquí.
- ⚠️ **Un evento del archivo sin título se descarta**, en vez de crear uno llamado «sin nombre».

## v3.31.0 — Entrega 3 · Fase 11 (HC F6): notificaciones y recordatorios reales

*"El usuario debe poder configurar «avísame de esto a las 17:00» y recibir una notificación real
cuando corresponda."*

### 🚨 El enunciado abre con la regla que gobierna todo

*"NO crear un sistema paralelo de recordatorios. Las notificaciones deben utilizar las tareas,
eventos y recordatorios existentes."*

Así que aquí **no nace ninguna entidad**. Un recordatorio es un evento del calendario con
`tipo: 'recordatorio'` (F8); una tarea es la de Productividad. Lo único nuevo son **dos campos** en
lo que ya existe —`notificar` y `anticipacion`— y **quién decide** cuándo toca avisar.

⚠️ Y `avisosPlanificacion.js` **decide; `notificaciones.js` manda**, como `avisosHorario.js` (HT F10)
y `avisosEstilo.js` (EH F38). Un segundo emisor sería **un segundo horario de silencio**, y el día
que Josué cambiara uno el otro seguiría despertándole. Hay una prueba que falla si aparece
`new Notification` — y otra que comprueba que **alguien llama** a `avisosPendientes`: una función que
nadie llama no falla nunca.

### 🚨 Y la segunda regla es la honestidad (apartados 7, 23 y 24)

*"No prometer funcionalidad que la plataforma no soporte."* JosStyle **no tiene un service worker con
`push`**, así que:

- Con la aplicación **abierta**, el aviso sale de verdad.
- Con la aplicación **cerrada**, no sale nada — y en el iPhone hace falta además tenerla en la
  pantalla de inicio.

`CAPACIDADES` declara las cinco cosas con `disponible: true/false` y su frase, **y Ajustes las
enseña**: *"Qué avisos llegan de verdad"*, con lo que falta marcado *"todavía no"*. Fingir que un
aviso quedó programado sería el control decorativo que prohíbe la regla 8, y el apartado 7 lo dice
con sus palabras: *"si no hay permisos, no fingir que se programó"* — por eso `notificar` nace
mirando el permiso **real**.

### Lo demás que trae

- **Las siete anticipaciones** del apartado 8, ni una más, con *"en el momento"* por defecto.
- **Un interruptor por tipo** (apartado 27) que **apunta a la categoría que ya existe** en Ajustes:
  ni un segundo juego de interruptores donde apagar lo mismo.
- 🚨 **Nada de avisos atrasados** (apartado 22): hay una ventana corta, y pasada esa ventana el aviso
  **no se da**. *"No mostrar «evento de hace 3 horas»."* Es la diferencia entre avisar y dar la lata.
- **Desactivar un aviso no borra el elemento** (apartado 20), y reactivarlo lo programa otra vez.
- 🚨 **Y no hay nada que cancelar** (apartados 18, 19 y 21): los avisos se calculan en el momento
  desde el propio elemento, así que cambiar su hora, borrarlo o desactivarlo cambia el aviso **solo**.
  Un sistema que los guardara programados tendría que cancelarlos uno a uno, y dejaría alguno vivo.

### Lo que esto deja apuntado

- 🐛 **`pulsar()` del recorrido ahora respeta los diálogos abiertos**, y esto era un fallo de verdad:
  con el ＋ de Hoy abierto, buscar *"Tarea"* encontraba **un botón del fondo** que se llama
  exactamente así —la coincidencia exacta va primero— y el recorrido acababa en Productividad en vez
  de en el formulario. Un overlay tapa lo de detrás: quien lo usa no puede pulsar el fondo, y la
  prueba tampoco debe.
- ⏸ **Un hábito no guarda una hora**, así que su aviso dice *"queda pendiente"*, no una hora
  inventada (apartado 11: *"NO duplicar el sistema de hábitos"*).
- ⏸ **El Pomodoro no se programa a una hora**, y se declara: lo único posible es avisar al terminar
  una sesión que está corriendo.
- ⚠️ **Ni un router paralelo** (apartado 15): JosStyle navega con `setTab` y `navegarDesdeHoy`
  (EH F28), no con URLs, y el apartado pide adaptarse al que existe.
- 🐛 **Y mi propio texto tenía una palabra técnica**: *"hace falta un service worker"*, en la
  pantalla que ve Josué. Lo cazó **el recorrido en Chromium**, no el barrido de Node — porque la
  lista de palabras prohibidas no conocía el término, **y su silencio parecía un aprobado**. Es la
  lección de EH F48 otra vez: una comprobación que no reconoce lo que busca es peor que no tenerla.

## v3.30.0 — Entrega 3 · Fase 10 (HC F5): planificación avanzada y vista semanal

*"Permitir que el usuario pueda pasar de Hoy → Día → Semana → Mes manteniendo siempre los mismos
datos."* La capa nueva contesta una pregunta que ninguna de las otras contestaba: **"¿cómo tengo
organizada mi semana?"**

### 🚨 El motor de recurrencias ya existía

El apartado 9 pide *"implementar recurrencias básicas"* y el 14 *"no duplicar manualmente toda la
serie"* — pero `expandirRecurrentes` (Calendario Universal F3) ya hacía las cinco cosas: expandir sin
materializar (regla 11), un intervalo (*"cada 2 semanas"*), las **excepciones** de los días saltados,
los **cambios** de un día suelto y el `hasta`. Escribir un segundo motor habría sido exactamente la
duplicación que el propio enunciado prohíbe.

**Lo que faltaba es que las TAREAS pudieran repetirse** (apartado 10: *"☐ Leer, repetir cada día"*):
`productividad.tareas` no tenía `recurrencia`. Ahora la tiene, y pasa **por el motor que ya existe**.

### 🚨 Una tarea recurrente no son tres tareas (apartados 23 y 24)

*"No crear tres instancias independientes."* Se guarda **la regla**, y las apariciones se calculan;
sale en Hoy, en la Agenda y en el Calendario porque las tres preguntan por su día.

Y completar el jueves marca **ese día**, no la serie: `hechas` es una lista de fechas **dentro de la
regla**, así que *"la regla permanece"* sale solo. El recorrido de Chromium lo comprueba tocándolo —
pulsa la casilla y mira que siga habiendo **una** tarea, diaria, con hoy dentro de `hechas`.

⚠️ **Y las rachas siguen siendo de Hábitos** (apartado 25): `semana.js` no importa nada de rachas, y
hay una prueba que lo lee.

### La semana

- **La semana empieza el lunes**, como las columnas `L M X J V S D` del apartado 2 y como la hucha
  (E3 F4). Y se calcula en local: séptima vez que el UTC habría devuelto la semana equivocada.
- **La cabecera dice los dos meses cuando la semana los cruza** — decir solo uno sería mentir la
  mitad de las veces.
- ⚠️ **En el móvil no caben siete columnas** (apartado 3): arriba la tira de siete días con su
  carga, debajo la planificación del día seleccionado. Es lo que el apartado describe.
- **«Esta semana»** (apartado 6) devuelve a la semana que **contiene** hoy, no a Hoy.
- **Un día sin nada es «Libre»** (apartado 16), no siete tarjetas vacías.
- **El orden dentro del día** (apartado 17) es una lista declarada, y coincide con la Agenda a
  propósito: dos órdenes distintos para lo mismo es cómo se pierde la consistencia que pide.
- **Solo este día / Toda la serie** (apartados 12 y 13), ⚠️ **sin valor por defecto**: elegir por él
  se cargaría todos los lunes del curso sin avisar (la lección de HT F3).

### Lo que esto deja apuntado

- ⚠️ **Lo que ya estaba se declara, no se rehace**: `YA_RESUELTO_SEMANA` recoge ocho apartados con la
  función real que los resuelve — el motor, las excepciones, el `QuickAdd` de la F9 (*"no crear otro
  Quick Add específico para Semana"*), los filtros, la búsqueda y las rachas.
- ⏸ **El apartado 30 pide dejar los campos preparados, no las notificaciones**: `fecha`, `hora` y
  `estado` existen; el **recordatorio de una tarea no**, y se declara con su motivo — añadirle un
  aviso propio sería un segundo emisor (HT F10, EH F38).
- ⚠️ **La carga del día es la de la E3 F8**: *"no crear una puntuación artificial"*, y una segunda
  escala diría un número distinto del de la vista de mes.
- 🐛 **Una prueba que busca escrituras mira los IMPORTS** (decimocuarta vez de esta familia):
  `YA_RESUELTO_SEMANA` **nombra** `rachasServicio.js` para decir quién manda, y buscar la palabra
  saltaba con la línea que lo promete. Sin importar nada de rachas es imposible llamarlas.
- 🐛 **Y el escenario de una prueba tiene que encajar con lo que afirma**: con una tarea **diaria** no
  hay ni un día libre en toda la semana, y eso está bien.

## v3.29.0 — Entrega 3 · Fase 9 (HC F4): acciones rápidas entre Hoy, Agenda y Calendario

*"La prioridad ahora es conseguir que el usuario pueda pasar de una pantalla a otra y modificar su
planificación sin sentir que está utilizando sistemas diferentes."*

Las tres pantallas ya existían —🏠 Hoy (F6), 📋 Agenda (F7) y 🗓️ Calendario (F8)— y **ya compartían
la fuente de verdad**: completar desde cualquiera de ellas llama a `toggleTarea`, y crear una tarea
a `addTarea`. Los apartados 10, 15, 17, 18 y 29 salían de ahí sin código nuevo, y se declaran en
`YA_RESUELTO` **con la función real** que los resuelve.

### 🚨 Un solo ＋ (apartados 1 y 30)

*"Crear un componente reutilizable… no duplicar formularios."*

La F8 dejó el selector y la tarea rápida **dentro de `CalendarView`**, así que Hoy y la Agenda no los
tenían. Ahora viven una sola vez en `src/components/quickAdd.jsx` —`QuickAdd`, `FormularioTarea`,
`FormularioEvento`, `FormularioApunte`, `MenuElemento`, `CambiarFecha`, `CambiarHora`,
`AvisoAccion`— y las tres pantallas usan los mismos.

**Y el contexto viaja con el ＋** (apartados 2, 3, 4 y 26): desde Hoy la fecha es hoy y no se vuelve
a preguntar; desde la Agenda es **el día que se está viendo**, con su hora si la hay; desde el
Calendario, el día seleccionado. ⏸ El **apunte** solo se ofrece cuando el día es hoy: un apunte no
se programa (F6).

### Lo demás que trae

- **Las acciones contextuales `•••`** (apartado 8): *"mostrar solamente las acciones relevantes"*.
  Una tarea tiene cinco; un evento **no tiene «Completar»**, porque un evento ocurre (F7, apartado
  6); un apunte solo se elimina; y un elemento derivado de otro módulo no ofrece ninguna — se abre
  su módulo.
- **Cambiar fecha y cambiar hora** (11 y 12), que solo existían para eventos. ⚠️ *"Si el nuevo día
  no es hoy, desaparece de Hoy"* **sale gratis**: se cambia el campo de la tarea original y las tres
  pantallas la leen de ahí. Y **quitar la hora** es una operación válida: la tarea pasa a «Sin hora».
- **El aviso pequeño con Deshacer** (14 y 19): *"no usar modales grandes para acciones normales"*.
  ⚠️ Deshacer **solo se ofrece donde de verdad se puede**, y quien deshace es el histórico de diez
  pasos que ya existía: ni una segunda pila, ni una segunda puerta de borrado.
- **Las validaciones** (32): título obligatorio, y la hora de fin nunca antes que la de inicio.
- **«Ver todas →»** (apartado 18), que abre la agenda del día — *"no crear una nueva pantalla"*.

### 🐛 Y esta fase empezó rompiendo algo

El archivo se llamó primero `accionesRapidas.js`, y **ese nombre ya era de EH F61** —un módulo
congelado—. Escribirlo encima se llevó **310 líneas suyas**, y lo cantó `git status`, no el build.
Es la lección más repetida del proyecto, esta vez sobre un **fichero** y no sobre una función: se
restauró y lo nuevo se llama `accionesHoyAgenda.js`, con una prueba que comprueba que el de la F61
sigue entero.

### Lo que esto deja apuntado

- 🐛 **`'2026-13-45'` encaja con `/^\d{4}-\d{2}-\d{2}$/`, y la FORMA no basta.** Cuarta vez de esta
  lección, tras `'25:99'`. Guardar esa fecha dejaba la tarea **invisible en las tres pantallas**,
  porque ningún día coincide con ella. `fechaValida` sube a `helpers.js` al lado de `horaValida`.
- 🐛 **Una prueba que busca USOS tiene que quitar los comentarios** (duodécima vez): la cabecera de
  `quickAdd.jsx` explica el fallo de `onChange={setTexto}` **escribiéndolo**, y el barrido saltaba
  con la frase que lo previene.
- 🐛 **Y una que busca escrituras busca la LLAMADA, no la palabra** (decimotercera): `YA_RESUELTO`
  nombra `saveData` y Supabase para decir **quién** sincroniza. Eso es una declaración.
- ⚠️ **El apartado 23 sigue sin poder cumplirse del todo, y está dicho**: el último en escribir gana
  (`app_data` no guarda una versión). Esta fase no lo empeora —cada acción toca un elemento, nunca
  reescribe el módulo entero— pero tampoco lo resuelve.

## v3.28.0 — Entrega 3 · Fase 8 (HC F3): Calendario, la vista temporal

*"El sistema tiene tres piezas: 🏠 HOY, 📋 AGENDA y 🗓️ CALENDARIO. Las tres deben utilizar las
mismas entidades y datos. NO crear un calendario independiente."*

La mayor parte del Calendario **ya estaba construida** desde el Calendario Universal: la cuadrícula
del mes, los puntos por tipo, la navegación entre meses, el día seleccionado, el detalle, la edición,
el buscador, los filtros y las recurrencias. Así que, como en las dos fases anteriores, el trabajo
fue mirar qué faltaba **de verdad**.

### 🚨 Y faltaba algo gordo: las tareas no salían en el Calendario

El apartado 12 lo dice con todas las letras: *"si una tarea tiene fecha, debe aparecer en
Calendario"*. **No aparecía.** Ni un punto en la celda, ni una línea en el panel del día: el
Calendario enseñaba `calendario.eventos` y los derivados de otros módulos, y las tareas de
Productividad no estaban en ninguna de las dos listas. Una tarea del 29 de agosto era **invisible**
hasta abrir la Agenda.

Eso arrastraba tres cosas más:

- **El resumen del día contaba solo eventos** (apartado 5), y el enunciado lo escribe con las tareas
  dentro: *"4 tareas · 2 eventos · 1 recordatorio"*. Un día que solo tenía tareas no tenía resumen.
- **No se podía crear una tarea desde el Calendario** (apartados 16 y 18). El ＋ creaba siempre un
  evento.
- **El punto verde de las tareas no existía** (apartados 3 y 14).

### Lo demás que faltaba

- 🐛 **Hoy dejaba de notarse justo cuando estaba seleccionado** (apartado 4). El borde solo se
  pintaba si la celda **no** estaba seleccionada — y al entrar, el día seleccionado ES hoy. Así que
  la marca desaparecía en el caso más común y hoy se veía igual que cualquier otro día tocado. Ahora
  `marcaDeHoy` deja siempre tipografía, subrayado y `aria-current`.
- **El botón «Hoy» solo salía fuera del mes actual**, y el apartado 10 lo quiere *"siempre
  accesible"*: desde el propio septiembre no había forma de volver al día de hoy tras tocar el 29.
- **Ver Agenda y Ver Hoy** (apartados 28 y 29), con la regla de los apartados 7 y 24: *"no volver
  automáticamente a hoy"*, así que Ver Agenda abre **el día seleccionado**.
- **La carga del día** (apartado 23): libre / normal / ocupado, tres estados y un umbral — con icono
  **y palabra**, nunca solo un color (EH F42).
- **El mes vacío** (apartado 38), con las palabras del enunciado.

### 🚨 Ni una copia (apartados 30 y 31)

*"No crear `calendar_tasks` / `calendar_events` si ya existen las entidades globales. El calendario
es una representación."*

`src/lib/calendarioMes.js` **no tiene almacén, ni normalizador, ni escribe nada**: lee los eventos
que le pasan ya expandidos y las tareas de `productividad.tareas`. Marcar una tarea desde el
Calendario la marca en Hoy, en la Agenda y en Productividad **porque es la misma tarea**, y crearla
llama a `addTarea`, la de siempre. El recorrido de Chromium lo comprueba tocándolo: pulsa la casilla
y mira que `productividad.tareas` haya cambiado.

### ⏸ Y un recordatorio ya existía — la E3 F7 se equivocó

`TIPOS_EVENTO_CALENDARIO` tiene `recordatorio` desde el Calendario Universal, así que **un
recordatorio es un evento de ese tipo**. La F7 lo declaró `existe: false` diciendo que no había
sistema de recordatorios; era falso, y se ha corregido. Lo que no existe es un *módulo* de
recordatorios aparte, y crearlo habría sido exactamente el duplicado que prohíbe el apartado 31.

Es la lección más repetida del proyecto, esta vez del revés: **antes de declarar que algo no existe,
mirar si ya existe con otro nombre.**

### Lo que esto deja apuntado

- 🐛 **`'25:99'` encaja con `/^\d{2}:\d{2}$/`, y la FORMA no basta.** El fallo de EH F11 estaba otra
  vez en dos sitios nuevos: una hora imposible colocaba la tarea en el minuto 1599, o sea fuera del
  día. `horaValida` sube a `helpers.js` —ya iban tres sitios comprobándolo, y dos mal— y la usan
  Peluquería, la Agenda y el Calendario.
- 🐛 **`innerText` devuelve el texto RENDERIZADO.** El rótulo *"Sin hora"* se pinta con la clase
  `uppercase`, así que en el navegador llega **"SIN HORA"** y un `/Sin hora/` no lo encuentra nunca:
  la pantalla estaba bien y la comprobación decía que no. Toda búsqueda de un rótulo va con `/i`.
- 🐛 **`pgrep -f` y `pkill -f` se encuentran a sí mismos.** Un bucle de espera cuyo patrón aparece en
  su propia línea de comando no termina jamás — pareció media hora que la verificación seguía viva
  cuando había acabado.
- ⚠️ **El punto de tarea tiene su hueco reservado.** Con tres tipos de evento y tareas, sin eso el
  punto verde se caía del tope de tres y las tareas volvían a ser invisibles: justo lo que la fase
  venía a arreglar.
- ⚠️ **Y `indicadoresDelDia` reutiliza `tiposDelDia`**, que ya hacía esto desde el Calendario
  Universal. Reescribirlo habría dejado dos respuestas a la misma pregunta.

## v3.27.0 — Entrega 3 · Fase 7 (HC F2): la agenda de un día

*"Agenda NO debe ser simplemente otra forma de mostrar las tareas. Debe funcionar como la agenda
personal real del usuario."* Y al entrar, sentir: *"Esta es mi agenda de hoy."*

### ⚠️ Ya había una "Agenda", y no es ésta

La del Calendario (Fase 3) lista **los eventos de los próximos días** en una tira; ésta es de **UN
día**, con su línea temporal, sus cosas sin hora, la raya de AHORA y el siguiente pendiente. Son dos
preguntas distintas —*"¿qué viene?"* y *"¿cómo es mi sábado?"*—, así que **conviven**: el Calendario
tiene ahora tres vistas (Mes · Día · Agenda) y no se ha sustituido nada.

Lo que no puede haber es dos fuentes de datos, y **no las hay**.

### 🚨 Una sola fuente de verdad (apartado 25)

*"No crear `agenda_events` y `calendar_events` como duplicados. El sistema debe tener una fuente de
verdad."*

`src/lib/agendaDia.js` **no guarda ni un elemento y no tiene normalizador**: junta y ordena lo que ya
vive en su módulo. Los eventos salen de `agendaCompleta` (HT F6), las tareas de
`productividad.tareas` y los apuntes de `productividad.apuntes` (E3 F6). Hay pruebas que leen el
código fuente y fallan si aparece cualquier nombre que huela a copia o a almacén propio.

Por eso el **apartado 14** —*"completar desde Agenda debe actualizar Tareas, Hoy, el progreso diario
y las rachas"*— **sale gratis**: la casilla de la Agenda llama a `toggleTarea`, exactamente la misma
función que marca esa tarea en Hoy y en Productividad. No hay nada que sincronizar **porque es la
misma tarea**.

### El día, entero

- **La cabecera se genera** (apartado 1): *"Jueves, 3 de septiembre"*, con su etiqueta Hoy / Mañana /
  Ayer — una etiqueta, no un sustituto: la fecha se sigue viendo.
- **La tira de cinco días** (apartado 2) para saltar entre ellos, y las flechas con su `aria-label`.
- **Lo que tiene hora va en orden; lo que no, tiene su sección** (apartados 3 y 4). *"No todo tiene
  que tener hora"*: los eventos de todo el día, las tareas sin hora y los apuntes.
- **La raya de AHORA, y solo hoy** (apartado 16). En un día pasado o futuro no significaría nada, así
  que no se pinta —y tampoco el "próximo".
- ⚠️ **Lo pasado sigue visible** (apartado 15): se distingue, no se esconde.
- 🚨 **El "próximo" es el siguiente PENDIENTE** (apartado 17): lo que ya está hecho se salta.
  Proponerle repetir algo que acaba de terminar sería el reproche que este proyecto no hace.
- 🚨 **Dos cosas a la misma hora se ven las dos** (apartado 18): se marcan como solapadas y se pintan
  juntas. Esconder una sería perder algo que él puso.
- **Un día vacío no es una lista vacía** (apartado 19): *"Agenda libre"*, su explicación y su botón.

### ⏸ Lo que no existe se declara, no se finge

Los **recordatorios** y los **pomodoros programados** que el apartado 5 da por hechos **no existen**:
no hay un sistema global de recordatorios (y el apartado 10 dice *"si ya existe, reutilizarlo"* — no
existe), y las sesiones de Pomodoro no se programan a una hora, así que no hay nada que colocar en el
día. Los dos van en `TIPOS_AGENDA` con `existe: false` y **su motivo escrito**, que es lo que hace
que la pantalla diga la verdad en vez de ofrecer un botón muerto (regla 8).

### Lo que esto deja apuntado

- ⚠️ **Una tarea se completa; un evento ocurre** (apartado 6). `seCompleta` es una línea del catálogo,
  no un `if` en la pantalla — y solo la tarea la tiene.
- 🐛 **Cuatro de los cinco fallos de esta fase eran de la prueba, no del código**: las 09:00 SÍ son
  pasadas a las 10:00, el "próximo" SÍ debe saltarse lo hecho, las completables son tres y no
  cuatro (un apunte no se completa) y la expresión que buscaba el componente era demasiado estricta.
  **Mirar qué línea hace saltar una comprobación antes de tocar el código.**
- ⚠️ **`minutosAhora` entiende texto o `Date`, nunca un número**: un número cae al reloj de verdad y
  la prueba deja de ser determinista.
- ⚠️ **Sexta vez del UTC**: las fechas de la tira y de las flechas se construyen en local (`addDays`
  sobre `fechaLocalISO`). Un `toISOString()` sobre una medianoche local enseñaría la agenda del día
  equivocado.

## v3.26.0 — De diez eventos mudos a cinco, y los cinco tienen motivo

### Qué se ha conectado
Cinco de los diez que quedaban. Ninguno inventando una función: en los cinco casos **el sistema ya
estaba** y solo faltaba mirarlo.

| Evento | Dónde estaba el sistema |
|---|---|
| `BADGE_UNLOCKED` | Los logros ya tienen `familia`, y una de ellas se llama literalmente **`coleccion`** |
| `SAVING_COMPLETED` | La hucha de la Entrega 3 tiene meta: se cruza o no se cruza |
| `GOAL_PROGRESS` | La misma hucha, cuando el ahorro sube sin llegar |
| `ACTION_WARNING` | El borrado definitivo de la papelera |
| `STREAK_AT_RISK` | El estado `PENDIENTE`, que ya existía |

### 🚨 "En riesgo" llevaba aplazado desde RA F1, y no hacía falta esperar
El comentario de `ESTADOS_RACHA` lo dejaba para RA F4 *"con el resto de estados visuales"*. Por eso
`streak_at_risk.mp3` existía sin que nada pudiera dispararlo.

Pero **en riesgo no es un estado nuevo: es `PENDIENTE` mirado a una hora**. Tres líneas puras, con la
hora por parámetro igual que `hoy` en todo ese archivo — así se prueba la medianoche sin esperar a la
medianoche.

⚠️ A las **21:00**, no a las 23:00: un aviso que llega cuando ya no da tiempo a hacer nada no es un
aviso, es un reproche.

### Una insignia no es un logro, y el dato ya lo sabía
`badge_unlocked` sonaba igual que `achievement_unlocked`. La diferencia no se ha inventado aquí:
la RA F3 ya clasifica sus logros en `racha`, `record` y **`coleccion`** — los coleccionables
(constancia, volver, varios frentes) frente a los que marcan un momento.

### Guardar a propósito sí suena
`saveData()` se llama desde 86 sitios y **un sonido en cada guardado sería ruido**. Pero un botón que
pone «Guardar» es otra cosa: ahí guardar **es el propósito del gesto**, no un efecto secundario. El
oyente de toques lo distingue por su etiqueta.

⚠️ Suena al pulsar, no al confirmarse. Si el guardado falla, el error llega detrás desde
`saveData()`: primero "recibido", luego "no ha podido ser". Es información honesta, no una mentira.

### Los cinco que quedan, y por qué no se tocan
- **`SUCCESS`, `ACTION_COMPLETED`, `UI_SUCCESS`** — genéricos. Cada acción que sale bien ya tiene su
  evento propio; se conservan porque el apartado 4 los nombra.
- **`LEVEL_UP`** — no hay niveles. RA F3 decidió no construirlos.
- **`MAJOR_GOAL_COMPLETED`** — no hay objetivos "mayores": uno se cumple o no, sin tamaño.

Los dos últimos exigirían **construir la función que no existe**, y un sonido de "has subido de
nivel" sin niveles es un control decorativo con altavoz — la regla 8 con volumen. Están declarados en
`SIN_EMISOR_TODAVIA` con su motivo, y la prueba exige que sigan estándolo.

### La invariante funcionando en caliente
Dos veces en esta tanda: al conectar `SAVING_COMPLETED` y al conectar `STREAK_AT_RISK`, la suite se
puso roja porque **seguían declarados como pendientes algo que ya se emitía**. Es la mitad de la
regla que suele olvidarse — no basta con que lo pendiente esté declarado; lo declarado tiene que
seguir pendiente.


## v3.25.0 — Ahora suena todo lo que tiene sistema detrás

### Qué se ha construido
De 19 eventos sin emisor a **9 conectados**. Cada uno en el sitio donde ocurre el hecho, no en la
pantalla que lo enseña:

| Evento | Dónde se emite | Qué se oye |
|---|---|---|
| `ACTION_ERROR` | `saveData()`, al fallar | un guardado que no se guardó |
| `CONNECTION_LOST` / `CONNECTION_RESTORED` | `vigilarLaConexion()` | perder y recuperar la red |
| `SYNC_COMPLETED` | al terminar la carga inicial | los datos ya están |
| `TASK_COMPLETED` | pomodoro terminado | una tarea hecha |
| `STUDY_COMPLETED` | sesión de concentración | estudiar |
| `HABIT_COMPLETED` | marcar el hábito de hoy | un hábito cumplido |
| `SLEEP_LOGGED` | registrar sueño | |
| `TRAINING_COMPLETED` | partido añadido | |
| `GOAL_COMPLETED` | objetivo que pasa a cumplido | |
| `SAVING_COMPLETED` | la hucha alcanza su meta | |
| `STREAK_RECOVERED` | racha rota que se retoma | |
| `UI_OPEN` / `UI_BACK` | el oyente de toques | abrir un panel, volver |

⚠️ Todos comparan con el estado anterior: **marcar un hábito suena, editarlo no; desmarcarlo,
tampoco.** Cumplir un objetivo suena una vez, no cada vez que se guarda. Deshacer algo no es un logro.

### La decisión que no se tomó: el sonido de guardar
`saveData()` se llama desde **86 sitios**. Un sonido en cada guardado correcto, encima del clic que
ya suena, sería ruido constante. **Se emite el fallo y no el acierto**: lo que hay que oír es lo que
no se espera. Queda escrito como decisión, no como olvido.

### 🚨 STREAK_RECOVERED: volver no es empezar
`streak_recovered.mp3` existía desde la SO F4 y no lo emitía nadie. Retomar una racha rota cuesta más
que estrenarla, y el sonido lo refleja —arranca más grave, se vuelve desde abajo—, pero el motor solo
sabía decir "empezada" o "continuada".

⚠️ Se distingue por el **historial**, no por el récord: el récord incluye el día de hoy, así que una
racha estrenada tendría récord 1 y se anunciaría como recuperada sin haber estado rota jamás.

### 🚨 La invariante que cierra el fallo de toda la sesión
Un sonido sin emisor es tan mudo como un archivo que falta, y **muchísimo más difícil de ver**:
todo lo demás está en su sitio. Ha pasado cinco veces hoy.

`SIN_EMISOR_TODAVIA` declara los que quedan **con su motivo**, y una prueba exige que todo evento con
sonido esté emitido **o** declarado. Añadir uno y no conectarlo pone la suite en rojo; declarar como
pendiente algo que sí se emite, también — lo comprobó en caliente con `SAVING_COMPLETED`.

Los 10 que quedan no son olvidos: cuatro son genéricos que ya tienen evento propio, uno es la
decisión de arriba, y el resto exigirían **construir la función que no existe** (niveles, insignias,
avisos intermedios). Un sonido de "has subido de nivel" sin niveles es un control decorativo con
altavoz — la regla 8 con volumen.

### 🐛 Y un limpiador de comentarios que se comía el código
`test-hucha.mjs` borra los comentarios antes de buscar en `App.jsx`, y su expresión para los
comentarios JSX era `\{\s*\/\*`. Bastaba una función que abriera llave y llevara un comentario de
bloque en la línea siguiente —algo tan normal como esto— para que buscara el cierre `*/}` cientos de
líneas más abajo y se tragara todo lo de en medio.

Falló al añadir un comentario a `updateObjetivo`: la comprobación de `onUpdateEconomia` se puso roja
con la línea ahí escrita, porque el limpiador se la había comido antes de mirarla. En este proyecto
los comentarios JSX van siempre `{/* … */}` pegados, así que exigirlo quita la ambigüedad sin perder
ninguno.


## v3.24.0 — La aplicación suena

### Qué se ha construido
La biblioteca estaba entera y el motor la entendía, pero **ningún botón sonaba**. Ya suena.

- **Los toques de la interfaz**: un solo oyente, dentro del motor. Botones, enlaces y pestañas
  suenan a clic; los interruptores suenan a interruptor, y encender no suena como apagar.
- **El sonido nace encendido**, con la biblioteca completa.

### Un oyente, no doscientos
Meter un `reproducir()` en cada `onClick` es exactamente lo que prohíbe la cabecera de SO F1
—*"no quiero que el audio se implemente directamente dentro de cada componente"*— y además garantiza
que el botón número veintiuno se quede mudo sin que nadie se entere.

`conectarLosToques()` vive en `audioEngine.js` y escucha el documento entero. Suena solo lo que es un
control de verdad, no cualquier sitio donde se pueda pinchar. Y hay una prueba que comprueba que
**ninguna pantalla reproduce por su cuenta**, con una sola excepción declarada: el botón «▶ Escuchar»
de Ajustes, que lleva `data-sin-sonido` para no sonar dos veces encima del ejemplo.

### 🚨 Los diez hitos volvían a sonar igual, con el motor ya arreglado
Por la tarde se enseñó al motor a elegir entre los diez archivos de hito según los días. Pero el
enganche del bus llamaba a `reproducir(evento.tipo)` **a secas**: los días nunca llegaban, y los diez
volvían a resolver al mismo archivo.

Arreglar el mecanismo y no conectarle el dato deja exactamente el mismo síntoma que no haberlo
arreglado. Ahora `conectarAlBus()` pasa `contexto: { dias: evento.hito }`, y hay una prueba que usa
**el nombre y el campo que emite RA F3**, no los del audio: si Rachas renombra `hito`, se pone rojo.

⚠️ Rachas sigue sin saber que existe el audio. Emite su evento con sus datos, como siempre; es el
motor quien sabe que `hito` son días.

### El interruptor, encendido — la promesa de la SO F1
Estuvo apagado cinco fases, y el motivo estaba escrito en el propio código: *"encenderlo con una
biblioteca que todavía no existe daría un interruptor que dice 'Sonidos: sí' y no suena nunca — el
control decorativo que prohíbe la regla 8. Encenderlo se hará en la fase que traiga los archivos, y
entonces será verdad."*

Los archivos llegaron. La prueba ya no comprueba el valor sino **la regla**: encendido si y solo si
están los 46. El día que falte uno, vuelve a exigir que nazca apagado.

🐛 Y al encenderlo se cayeron seis comprobaciones de golpe: usaban `DEFAULT_AUDIO` como *"el estado
apagado"* en vez de decir cuál querían. Ahora hay un `OFF` explícito. Dar por bueno un valor por
defecto para decir lo contrario de lo que significa es una trampa que solo se paga cuando el defecto
cambia.

### ⚠️ Lo que sigue sin sonar
Guardar, completar una tarea o fallar una conexión **no suenan todavía**: nadie emite esos eventos.
Los de racha y logros sí, porque RA F3 ya los emitía. Enchufar los demás es ir módulo por módulo, y
no se ha hecho.


## v3.23.0 — La biblioteca sonora, completa: 46 de 46

### Qué se ha construido
Josué produjo en FL Studio **los cuarenta y seis archivos** de la biblioteca, en una tarde. Los
últimos cuatro fueron los hitos de 7, 30, 50 y 75 días.

**El motor puede reproducir los 46. Ninguno queda mudo.**

Y la firma —intervalos 0, 5, 7— aparece medida en los siete que la especificación exige:
`level_up`, `achievement_unlocked`, `personal_record`, `grand_achievement`,
`streak_milestone_30`, `streak_milestone_100` y `streak_milestone_365`. Los cuatro grandes la
resuelven además con la octava.

### 🐛 El validador rechazaba tres hitos correctos, por la otra mitad del mismo fallo
La comprobación de *"este sonido es único, no lleva variantes"* preguntaba por su cuenta si el
nombre terminaba en `_NN`. En `ui_click_01` ese número es el de la variante; en
`streak_milestone_30` **es el sonido**.

Resultado: `streak_milestone_30`, `50` y `75` —únicos, correctos y con la firma— se rechazaban por
"llevar variantes".

⚠️ La primera mitad de este fallo se arregló hace unas horas, en la búsqueda de la ficha. Ésta se
quedó porque **preguntaba lo mismo en otro sitio**. Ahora se calcula una vez, en `esVariante`, y las
dos comprobaciones usan el mismo dato. Verificado con los tres casos: un hito único pasa, una
variante real pasa, y una variante de un sonido que debe ser único (`level_up_02`) se sigue
rechazando.

### Lo que queda del ámbito del sonido
**Ocho sonidos del catálogo no los emite nadie**, y ninguno es un olvido:

| | Motivo |
|---|---|
| `streak_freeze_used` | No hay comodines de racha (RA F1) |
| `reward_small` · `reward_medium` · `reward_major` | No hay sistema de recompensas (D2-02) |
| `xp_small` · `xp_medium` · `xp_large` | No hay XP: RA F3 no lo construyó |
| `level_up` | No hay niveles: RA F3 no los construyó |

Siete de los ocho **ni siquiera tienen archivo**, porque la biblioteca no los declara. `level_up` sí
lo tiene y sí puede sonar; lo que no hay es un nivel que subir.

⚠️ **Y sigue faltando lo más importante: ningún botón de la aplicación dispara sonido.**
`reproducir()` se llama desde un solo sitio, el botón «▶ Escuchar» de Ajustes. La biblioteca está
entera y el motor la entiende; conectarla a la interfaz es trabajo que no está hecho, y decir lo
contrario ahora sería la mentira más fácil de contar.


## v3.22.0 — La firma suena, y el validador dejaba fuera a los diez hitos

### Qué se ha construido
Once sonidos más. **39 de 46.** Entre ellos los cinco que llevan la identidad sonora del proyecto, y
la firma se comprueba medida en el archivo, no de oído:

| Archivo | Notas | Intervalos |
|---|---|---|
| `level_up` | C5 → F5 → G5 | **0, 5, 7** 🎵 |
| `achievement_unlocked` | C5 → F5 → G5 | **0, 5, 7** 🎵 |
| `personal_record` | C5 → F5 → G5 → C6 | **0, 5, 7, 12** 🎵 |
| `grand_achievement` | C5 → F5 → G5 → C6 | **0, 5, 7, 12** 🎵 |
| `badge_unlocked` | D5 → F#5 → A5 | 0, 4, 7 |
| `goal_complete` | E5 → B5 → E6 | 0, 7, 12 |

Los dos grandes **resuelven con la octava** lo que la firma deja abierto. Y los dos que no la llevan
usan intervalos distintos a propósito: una insignia no es un objetivo cumplido, y ninguno de los dos
puede confundirse con un récord.

Más los hitos de racha de 3, 14 y 21 días.

### 🐛 El validador rechazaba los diez hitos, todos válidos
`validarArchivo()` buscaba la ficha quitando el `_NN` final del nombre, porque en `ui_click_01` ese
número es **el de la variante**. Pero en `streak_milestone_30` el número **es el sonido**: quitarlo
daba `streak_milestone`, que no existe.

Resultado: los diez hitos se rechazaban con "ese nombre no está en la lista de sonidos", cada uno de
ellos perfectamente correcto. Ahora se prueba el nombre entero primero, y solo se recorta la variante
si el nombre completo no es una ficha.

⚠️ Llevaba ahí desde la SO F4 y no saltó hasta que hubo un hito grabado. Es el mismo patrón que las
rutas con `public/` y que los dos catálogos que no se hablaban: **con la carpeta vacía, roto y
correcto daban exactamente el mismo resultado.**

### Y dos que no entran, dichos
- `streak_milestone_07` se quedó en 307 ms y su ficha pide 500. **Fallo de la indicación, no de la
  grabación**: se le pasó junto al de 3 días como si compartieran ficha, y no la comparten.
- `streak_milestone_30`, `50` y `75` salieron con la tercera nota cambiada. En el de 30 importa
  especialmente: es uno de los que **debe llevar la firma**, y con la octava en vez de la quinta no
  la lleva.


## v3.21.0 — Los diez hitos de racha dejan de ser uno solo

### 🚨 El problema
*"El milestone de 7 días y el de 365 no pueden ser el mismo sonido más alto: debe existir una
evolución real de la identidad sonora."* — SO F3, en su propia cabecera.

Pero los diez hitos compartían el evento `STREAK_MILESTONE`, y `resolverSonido()` resuelve por
evento. Los diez daban el mismo archivo: **nueve de la biblioteca eran inalcanzables**, y grabarlos
habría sido tirar nueve tardes.

### La decisión
⚠️ **Lo que faltaba no era un evento por hito: era el dato.** Que los diez compartan evento está
bien — misma categoría, misma prioridad, mismo cooldown. Lo que los distingue son los días, y los
días son del momento, no del evento.

Así que entran por `contexto`, igual que `ahora` entra por parámetro en vez de leerse del reloj:
`resolverSonido()` sigue siendo pura y se prueba sin inventarse una racha.

```js
reproducir('STREAK_MILESTONE', { contexto: { dias: 30 } })   →   streak_milestone_30.mp3
```

Exacto si lo hay; si no, **el mayor por debajo**. Una racha de 200 días no tiene hito propio, y
celebrarla con el de 180 es mejor que callarse — y mucho mejor que con el de 365, que no ha llegado:
un récord celebrado antes de tiempo deja de ser un récord.

⚠️ Los días quedan escritos en dos sitios, `audio.js` y el catálogo de la SO F3. Es duplicación, y
se asume: la alternativa era que `audio.js` importara `audioEventos.js`, que ya importa `audio.js`.
Una dependencia circular a cambio de no repetir diez números. Hay una prueba que compara las dos
listas, así que separarse en silencio no es posible.

### Y `level_up`, que iba a nacer mudo
Es de los ocho que el catálogo marca `motor: null` porque **RA F3 decidió no construir niveles**.
Los otros siete no tienen archivo; éste sí —Josué lo estaba grabando—, así que sin evento el archivo
habría existido sin que nada pudiera reproducirlo.

Tener el evento no es fingir que hay niveles: es lo mismo que `TRAINING_COMPLETED` y los demás
"preparados y sin conectar". **Sigue sin emisor, y sigue dicho.**

🐛 Eso rompió `sinEmisor()`, que filtraba por `!motor` y daba `level_up` por conectado — haciendo
desaparecer de la lista la única cosa que había que recordar de él. *Tener evento* y *que alguien lo
emita* eran lo mismo hasta hoy y han dejado de serlo.

### El recuento
**De 25 sonidos inalcanzables a 7.** Los siete que quedan son los que no tienen archivo ni lo
tendrán: XP, recompensas y el congelar racha, que ningún módulo construyó.
## v3.20.0 — Entrega 3 · Fase 6 (HC F1): Hoy, el centro del día

Sexta fase de la Entrega 3, y la primera del bloque **Hoy y Calendario**. *"Transformar Hoy en el
auténtico centro operativo. Al abrir la aplicación, el usuario debe poder entender en pocos segundos
qué tiene hoy."*

### 🚨 Lo primero fue mirar qué existe ya

Es la lección que dejó HT F6 —*"el 90 % de esa fase fue no duplicar"*— y aquí volvió a valer: de los
veinticinco apartados, **la mayor parte ya estaban construidos**. La cabecera con saludo y fecha
dinámica, la agenda del día en orden (`agendaCompleta`), el próximo evento con su *"en 2 h 15 min"*
(`ahoraMismo`, `siguiente`, `describirMinutos`), las tareas y su marcado, los hábitos y su racha,
y las tarjetas de entrenamiento, estudios, nutrición, sueño y economía.

Lo que **no** contestaba nadie, y es lo que trae esta fase:

**El resumen del día** (apartado 2) — *"4 tareas · 2 eventos · 5 hábitos"*, de datos reales.
⚠️ Y un día sin nada **no se anuncia con tres ceros**: el bloque no se pinta.

**El progreso del día** (apartado 20) — *"50 % completado"*, y el enunciado pide que *"el cálculo
esté claramente definido"*, así que está declarado en `FUENTES_PROGRESO`: cuenta **solo tareas y
hábitos**. 🚨 **Un evento que simplemente ocurre no se completa**, y el apartado lo dice con esas
palabras. ⚠️ Sin nada completable **no hay porcentaje**: `null`, no un 0 % — un 0 % todos los
domingos sería un reproche por un día en el que no tocaba nada.

**Los apuntes de hoy** (apartado 17) — la captura rápida que no existía. *"Escribe algo que no
quieras olvidar."* Un texto y su día, sin categoría ni prioridad: *"no obligar a clasificarlo
antes"*. ⏸ Convertirlo en tarea o evento es de la **HC F4**, la fase que el propio documento dedica
a las acciones rápidas: aquí se declara en qué puede convertirse, con la colección real de cada
cosa, en vez de fingirlo.

### 🚨 Una sola fuente de verdad (apartados 24 y 25)

*"No crear `today_tasks`, `agenda_tasks` y `calendar_tasks` como tres copias independientes."*

**La forma de cumplirlo no es sincronizar: es no tener copia.** Los recuentos y el progreso se
derivan de las entidades originales en el momento, así que marcar una tarea en Agenda mueve el
número de Hoy **solo**. Hay pruebas que leen el código y fallan si aparece cualquier nombre que
huela a copia, o si esta capa se inventa un almacén.

Lo único que se guarda son los apuntes, y van en `productividad.apuntes` —no en una clave nueva de
Supabase—, con su línea en `DEFAULT_PRODUCTIVIDAD` (regla 5) y su entrada en `CATALOGO_PAPELERA`,
porque **toda lista que se pueda borrar va ahí** (EH F45).

### Lo que esto deja apuntado

- ⚠️ **Antes de construir algo de Hoy, mirar si ya existe.** Van dos fases seguidas en las que la
  mayoría del trabajo era no duplicar.
- 🐛 **`addApunte` ya existía**, y era de la Biblioteca (`biblioteca.apuntes`, Fase 11). El build lo
  cazó, pero el fondo es el de siempre: **antes de llamar a algo, mirar si ese nombre ya significa
  otra cosa**. Los de aquí son `addApunteDelDia` / `deleteApunteDelDia`.
- 🐛 **Un escenario de prueba que hereda el del vecino no prueba lo que dice.** El recorrido de
  Chromium es una pasada seguida: lo que una sección deja en el almacén sigue ahí en la siguiente.
  La sección de la F6 dejaba un hábito, y la de rachas —que cuenta los hábitos como rachas que
  mantener— pasó de 2 a 3 y siguió pintando el bloque al vaciar las rachas. Cada sección limpia lo
  que va a mirar.


## v3.19.0 — La racha: empezar, subir y volver

### Qué se ha construido
Los cinco sonidos de racha que se pueden hacer sin tocar el motor. **30 de 46.**

| Archivo | Notas | |
|---|---|---|
| `streak_start` | C5 → G5 → C6 | 357 ms |
| `streak_increment_01` | E5 → B5 | 278 ms |
| `streak_increment_02` | F5 → C6 | 277 ms |
| `streak_increment_03` | F#5 → C#6 | 273 ms |
| `streak_recovered` | G4 → C5 → G5 | 368 ms |

Correctos a la primera otra vez, y son los primeros con **tres notas**: empezar una racha es más
que sumarle un día, y su ficha llega a 700 ms.

`streak_recovered` arranca en **G4**, por debajo del `streak_start`. Recuperar una racha rota es
volver a empezar, pero se vuelve desde abajo, y eso se oye sin que nadie lo explique.

### Lo que queda, y lo que no se puede grabar todavía
Faltan **16**. De ellos, **10 son los hitos de racha** y siguen bloqueados: el motor los resolvería
todos al mismo archivo, así que el hito de 3 días y el de un año sonarían idénticos.

⚠️ No es pereza dejarlo: elegir entre diez según los días **no lo permite la API actual**.
`resolverSonido()` recibe un evento, no cuántos días lleva la racha. Grabarlos antes de arreglarlo
sería tirar nueve tardes.

## v3.18.0 — Progreso: la primera tanda que entra sin rescate

### Qué se ha construido
Los cinco sonidos de progreso: `task_complete_02`, `habit_complete_01/02` y `goal_progress_01/02`.
**25 de 46.**

| Archivo | Notas |
|---|---|
| `task_complete_02` | F5 → A#5 |
| `habit_complete_01` | D5 → G5 |
| `habit_complete_02` | D#5 → G#5 |
| `goal_progress_01` | G5 → C6 |
| `goal_progress_02` | G#5 → C#6 |

Los cinco correctos a la primera, medidos nota por nota, sin una sola corrección. Cada `_02` está
medio tono por encima de su `_01` con el mismo intervalo, que es lo que hace que suenen a variante
y no a otro sonido.

### Lo que cambió respecto a las tres tandas anteriores
**Ninguno se quedó mudo.** Es la primera vez.

En las tres tandas previas pasó lo mismo cada vez: Josué grababa, el archivo cumplía su ficha, y
nada en el motor podía reproducirlo — había que rescatarlo después. Esta vez los eventos
(`HABIT_COMPLETED`, `GOAL_PROGRESS`) y las variantes se declararon **antes** de que existieran los
archivos, en v3.16.0.

Declarar un sonido que aún no existe no es fingir: el motor cae en silencio si falta el archivo
(apartado 25). Lo que sí era un problema es lo contrario — el archivo existía y ningún evento podía
elegirlo—, y eso ya no pasa.


## v3.17.0 — Entrega 3 · Fase 5: los horarios se pueden borrar, y "Semana" ya no es "Horario semanal"

Quinta fase de la Entrega 3. Josué nombra **tres problemas** al empezar, y ésta los contesta.

### 🐛 1 · «Los horarios no se pueden eliminar; parece que solo pueden archivarse»

Y era literal — **con el mismo fallo que la papelera de Economía de la Fase 1, en otro sitio**:
`eliminarHorario` **existe desde HT F2**, con su borrado en cascada de bloques y excepciones,
escrita y probada… y **ninguna pantalla la llamaba**. La única acción destructiva que ofrecía la
interfaz era *Archivar*, así que un horario de un curso pasado se quedaba dentro para siempre.

**Una función que nadie llama no falla nunca.** Va por dos.

Ahora el botón existe, y ⚠️ **NO sustituye a Archivar**: el enunciado lo prohíbe expresamente, son
dos acciones distintas y las dos siguen. Antes de borrar se enseña **lo que se lleva de verdad**
—*"Se borrará «Bachillerato» y sus 2 clases, y su excepción"*—, contado sobre el estado real, no una
frase genérica: *nada se mueve en silencio* (HT F4).

🚨 **Y el aviso no promete recuperarlo**, porque **un horario no va a la papelera**: no tiene entrada
en `CATALOGO_PAPELERA`, y prometerlo sería mentir (la lección de EH F41). Dice *"esta acción es
permanente"* y también lo que **no** se toca: las asignaturas son de Estudios y las usan los demás
horarios.

`eliminarDeVerdad` **sin `confirmado` no borra nada** — vigésimo `aplicarPlan` del proyecto. Sin eso,
la confirmación del apartado 3 sería decorativa.

### 2 · «No hay diferenciación entre mis horarios y las vistas de planificación»

*"Esto evita que el usuario confunda «Semana» con «Horario semanal». Son conceptos relacionados pero
diferentes."*

Dos rótulos: **PLANIFICACIÓN** sobre Hoy/Semana/Día/Agenda, y **MIS HORARIOS** sobre el selector de
horario. Nada más — el apartado 9 dice *"no rehacer visualmente todo el apartado"*, y los botones,
las vistas y el selector son exactamente los de antes. Pero es lo que contesta *"¿estoy viendo mi
horario o mi agenda?"* de un vistazo.

### 3 · Los archivados, con sus tres acciones (apartado 4)

Estaban en una lista donde tocar la fila los restauraba y ya. Ahora cada uno tiene **Restaurar ·
Duplicar · Eliminar**, que son las tres que pide el apartado, y su sección aparte con su rótulo.

Y el estado vacío usa las palabras del apartado 7: *"Aún no tienes ningún horario · Crea tu horario
para organizar automáticamente tu semana · [+ Crear mi primer horario]"*.

⚠️ **"Todos archivados" NO es "vacío"**: ahí sí hay horarios, solo que ninguno en uso, y esconderlos
dejaría un callejón sin salida — el sitio para recuperarlos estaría dentro del horario que no hay.

### Lo que esto deja apuntado

- 🚨 **Una función que nadie llama no falla nunca.** Van dos en esta entrega: `onDeleteMovimiento` en
  Economía y `eliminarHorario` en Horario. Ninguna de las dos las veía el build, ni el renderizado,
  ni las pruebas de Node.
- ⚠️ **`misHorarios.js` no recalcula nada del horario**: decide qué llamar, como `gestionModulos.js`
  con `estiloDeHombre.js`. Hay pruebas que leen el archivo y fallan si redefine algo de HT F2 o F4.
- 🐛 **Y la enésima vez de la lección de siempre, la peor hasta ahora**: el limpiador de comentarios
  de la prueba usaba un patrón de *"llave, más comentario, más llave"* para quitar los comentarios
  JSX, y **se comió 500 líneas de código de verdad** — un `(() => {` seguido de un comentario abre la
  llave, y el cierre del patrón se va a buscar la primera llave que venga después del siguiente
  cierre de comentario. La comprobación del botón de eliminar saltaba con algo perfectamente escrito.
  **Lo correcto es al revés: quitar los bloques de comentario y después las llaves vacías.**


## v3.16.0 — Cierra la tanda 2, y las colisiones bajan de 25 a 17

### Qué se ha construido
Cinco sonidos más. **20 de 46**, y las familias de interfaz, confirmaciones y sistema completas.

| Archivo | Notas | |
|---|---|---|
| `sync_complete` | C6 | 144 ms, el más corto de la biblioteca |
| `task_complete_01` | E5 → A5 | sube una cuarta |
| `streak_at_risk` | D5 → B4 | baja poco: preocupa, no alarma |
| `connection_lost` | A5 → E5 | baja |
| `connection_restored` | E5 → A5 | la misma, del revés |

Los cinco salieron correctos a la primera, nota por nota, medidos en el archivo. `connection_lost` y
`connection_restored` son la misma pareja invertida, igual que los toggles: perder baja, recuperar
sube, y no hay que explicárselo a nadie.

### Las colisiones: de 25 a 17
Ninguno de los cinco habría sonado: `task_complete` caía en `ACTION_COMPLETED` junto a otros tres,
`sync_complete` y `connection_restored` compartían `UI_SUCCESS`, `connection_lost` estaba con `error`
y `warning`, y `streak_at_risk` sonaba igual que subir la racha.

Se les da evento propio, y de paso a los que vienen en la siguiente tanda —`habit_complete`,
`goal_progress`, `streak_recovered`— **antes de que se graben**, para que no haya que rescatarlos
después. `task_complete`, `habit_complete`, `goal_progress` y `streak_increment` quedan además con
sus variantes declaradas.

⚠️ Esos sonidos apuntan a archivos que todavía no existen. No es fingir: el motor cae en silencio si
el archivo no está (apartado 25), y así el día que aparezcan suenan sin tocar nada — que es justo lo
que **no** pasaba antes, cuando el archivo existía pero ningún evento podía elegirlo.

### 🚨 Lo que queda, y por qué bloquea la siguiente tanda
**17 sonidos siguen sin poder sonar**, y el grupo grande es el peor:

- **`STREAK_MILESTONE` se come los diez hitos de racha.** El de 3 días y el de 365 resolverían al
  mismo archivo. La cabecera de la propia SO F3 dice que *"debe existir una evolución real de la
  identidad sonora"* y que el de 7 y el de 365 *"no pueden ser el mismo sonido más alto"*.
- `ACHIEVEMENT_UNLOCKED` se come `badge_unlocked`.
- Ocho tienen `motor: null` —nadie los emite—, `level_up` entre ellos.

Elegir entre diez hitos según los días **no lo permite la API actual**: `resolverSonido()` recibe un
evento, no cuántos días lleva la racha. O se añaden diez eventos al motor, o el motor pasa a resolver
por el identificador del catálogo. **Es una decisión de arquitectura y no se toma de pasada.**

Hasta entonces, grabar los diez hitos sería tirar nueve tardes.


## v3.15.0 — Entrega 3 · Fase 4: la hucha con objetivo, y la papelera de Economía pulsada de verdad

Cuarta fase de la Entrega 3. El enunciado repite el aviso de las anteriores: *"el apartado Economía
actual está muy bien planteado y su estructura general debe mantenerse"*. Así que balance,
movimientos, ingresos, gastos y categorías se quedan como estaban.

### El objetivo de ahorro (apartados 4, 5, 6 y 10)

La hucha era **un número que se editaba a mano**. Ahora puede tener objetivo, con sus tres estados:

- **Sin objetivo** → *125,00 € ahorrados* + la puerta para ponerlo. Y **sin barra ni porcentaje**:
  un 0 % de nada sería una cifra inventada.
- **Con objetivo** → *125,00 € / 500,00 €*, `███░░░░░░░░░ 25 %`, y *"Ahorrar 50,00 € cada semana ·
  ⚠️ Esta semana: faltan 15,00 €"*.
- **Alcanzado** → la barra llena y *🎉 Objetivo alcanzado*.

Las frecuencias son las tres del apartado 5 —día, semana, mes— y la barra son **doce caracteres**,
como el "gráfico" de EH F35: el apartado 6 pide expresamente *"no crear gráficos grandes ni
estadísticas complejas"*.

### 🚨 Cómo se sabe si está cumpliendo, sin inventarse nada

El apartado 7 pide usar *"los movimientos de Economía […] sin obligar al usuario a introducir
constantemente información duplicada"*.

⚠️ **Un movimiento de Economía no dice si el dinero fue a la hucha.** Un gasto es dinero que sale y
un ingreso dinero que entra; ninguno lleva un campo que diga "esto es ahorro", y adivinarlo por el
concepto —buscar la palabra "hucha"— sería inventarse un dato.

Lo que sí existe es el botón que el propio apartado 4 dibuja: **`+ Añadir ahorro`**. Cada vez que
Josué lo usa, **eso ES el movimiento destinado a la hucha**, y queda apuntado con su fecha. De ahí
sale el progreso del periodo, sin pedirle el dato dos veces — que es exactamente lo que pide el
apartado 7.

Y el periodo se calcula **en local**: la semana empieza el lunes, y ⚠️ un `toISOString()` habría
movido ese lunes en España y con él el cumplimiento. Sexta vez que esa trampa aparece en el proyecto.

### 🚨 Y no sale de Economía (apartado 8)

*"Este objetivo de ahorro NO debe aparecer en el apartado global de Objetivos. No crear una relación
innecesaria con objetivos personales, rachas, productividad, dashboard u otros módulos."*

Hay **cinco pruebas que leen `src/lib/hucha.js`** y fallan si aparece cualquiera de esos nombres, más
dos que comprueban que ni `ObjectivesView` ni `DashboardView` lo mencionan. Y ni una pantalla nueva:
la hucha sigue siendo **una fila de la tarjeta de Cuenta principal**, con un icono pequeño
(`PiggyBank`), su barra, su línea de objetivo y un botón discreto que despliega la configuración
ahí mismo.

### 🚨 Y la papelera de Movimientos, pulsada de verdad en el navegador

El apartado 1 es el fallo que Josué reportó y que ya se arregló en la Fase 1. Ahora además **se
comprueba tocándolo**: el recorrido de Chromium carga un movimiento, pulsa su papelera y verifica
que desaparece.

🐛 **Para eso hubo que arreglar el propio recorrido.** `pulsar()` solo buscaba por texto, y **un
botón de solo icono no tiene texto**: la papelera, la estrella, las flechas… ninguno se podía pulsar
desde la prueba. Ahora también busca por `aria-label`, que desde EH F42 todos llevan obligatorio y
es el nombre por el que un lector de pantalla los anuncia. Pulsar por ahí es lo que hace alguien
usando VoiceOver.

### Lo que esto deja apuntado

- ⚠️ **`objetivoHucha` y `aportaciones` son dos campos nuevos de `economia`**, y `App.jsx` normaliza
  al cargar. Sin esa línea, el siguiente guardado se los lleva (regla 5, decimonovena vez).
- ⚠️ **Quitar el objetivo NO borra el historial de ahorro**: eso lo guardó él, no es del objetivo.
- ⚠️ **Sin decir cuánto quiere ahorrar por periodo no se inventa un objetivo semanal** a partir del
  total: sería una cifra que él no ha dicho (regla 8).
- 🐛 **Y otra lista exacta que estalló**: `test-coherencia-visual` exigía que `-m-1.5` fuera
  **exclusivo** de Estilo de hombre, y saltó cuando el botón de la hucha usó el mismo truco de área
  táctil. Eso es *mejor* coherencia, no peor. Ahora comprueba que EH no invente nada **fuera de las
  excepciones declaradas**, no que las excepciones sigan siendo suyas.


## v3.14.0 — Las confirmaciones: guardar, avisar y la variante del acierto

### Qué se ha construido
Cuatro sonidos de la familia de confirmaciones. **15 de 46.**

| Archivo | Notas | Para qué |
|---|---|---|
| `success_02` | C#5 → G#5 | la variante del "hecho", medio tono por encima |
| `save_01` | G5 | guardar, más discreto que acertar |
| `save_02` | G#5 | su variante |
| `warning` | D5 → D5 | avisar sin decir si es bueno o malo |

`save_02` salió en G#5 y no en A5 como decía la indicación. **Está mejor así**: medio tono de
diferencia es lo que debe separar a dos variantes del mismo sonido. Un tono entero ya se nota como
dos sonidos distintos.

### 🚨 25 de los 46 sonidos no habrían sonado nunca
Al enchufar estos cuatro apareció el patrón entero, y no era un caso suelto. El catálogo de la SO F3
declara **42 sonidos distintos**; el motor tiene **22 eventos**. Varios sonidos del catálogo caen en
el mismo evento, y un evento solo puede resolver a un sonido:

| Evento del motor | Sonidos del catálogo que se comía |
|---|---|
| `STREAK_MILESTONE` | los **diez** hitos de racha, del de 3 días al de 365 |
| `ACTION_COMPLETED` | save, task_complete, habit_complete, goal_progress |
| `ACTION_ERROR` | error, warning, connection_lost |
| `UI_SUCCESS` | sync_complete, connection_restored |
| `ACHIEVEMENT_UNLOCKED` | achievement_unlocked, badge_unlocked |
| `STREAK_STARTED` | streak_start, streak_recovered |
| `STREAK_CONTINUED` | streak_increment, streak_at_risk |
| *(ninguno)* | level_up y siete más, con `motor: null` |

**25 sonidos perdidos por colisión.** Más de la mitad de la biblioteca que Josué está grabando a
mano, uno a uno.

Se cierran los tres que afectan a lo ya producido —`ACTION_WARNING` y `ACTION_SAVED` nuevos, y
`success_01` con sus dos variantes— y **queda anotado que el resto sigue abierto**: el hito de 30
días y el de 365 comparten evento, y la propia SO F3 dice en su cabecera que *"no pueden ser el mismo
sonido más alto"*.

⚠️ Arreglarlo entero es una decisión de arquitectura, no un parche: o se añaden ~20 eventos al
motor, o el motor pasa a resolver por el identificador del catálogo en vez de por su evento. Lo
segundo es mejor y es más cambio. **No se hace sobre la marcha.**

### Nota de método: el PITCH que se resetea solo
Tres de estos cuatro salieron una octava por debajo en el primer intento, y no por descuido: en FLEX,
**cargar o cambiar el preset devuelve el deslizador PITCH a cero**, y ese control no avisa. Queda
escrito aquí porque va a volver a pasar con los 31 que faltan.


## v3.13.0 — Entrega 3 · Fase 3: el armario deja de vestirlo todo de camiseta

Tercera fase de la Entrega 3. El enunciado avisa igual que la anterior: *"el apartado Armario actual
está muy bien planteado y no necesita una remodelación […] Esta fase es exclusivamente de pulido
visual y ampliación de categorías"*. Así que no se ha tocado el constructor de outfits, ni el
historial, ni la gestión de prendas.

### 🐛 El fallo era peor de lo que se veía

`CATEGORIAS_ARMARIO` **ya declaraba un icono por categoría desde AR F1** —`Shirt`, `Watch`,
`Footprints`, `Grid2x2`— y **nadie lo leía**. La pantalla pintaba `<Shirt>` a pelo en los dos sitios
donde sale un icono de prenda, así que:

- los **accesorios salían con una camiseta**, que es lo que Josué señala en el apartado 3;
- **ocho categorías compartían dibujo**;
- y los pantalones tenían asignado `Grid2x2` —una rejilla— que además tampoco se pintaba.

Un campo que no lee nadie no falla nunca: se queda ahí pareciendo que funciona. Ahora está
conectado, y hay una prueba que salta si una categoría se queda sin icono o si dos comparten uno.

### La biblioteca de iconos (apartados 3, 4 y 5)

El apartado 4 marca el camino: *"no utilizar emojis […] utilizar los iconos disponibles más
apropiados […] si no existe un icono suficientemente preciso, seleccionar la alternativa más
cercana y mantener coherencia de estilo"*.

**Lucide tiene UNA prenda: `Shirt`.** No hay pantalón, ni sudadera, ni ropa interior. Con solo Lucide
seguirían compartiendo icono, que es justo lo que la fase viene a arreglar. Así que se hace lo otro
que pide el apartado —*"crear una biblioteca de iconos suficientemente amplia"*— en
`src/components/iconosPrenda.jsx`, **en la gramática exacta de Lucide**: lienzo de 24×24, solo trazo,
`currentColor`, grosor 2 y remates redondeados. Hay una prueba por cada una de esas cuatro cosas.

⚠️ **Lo que SÍ existe en Lucide se coge de Lucide** —camiseta, reloj, huellas, gafas y caja—, no se
redibuja: dos versiones del mismo icono y la segunda envejece sola. Y hay **una sola base `<svg>`
compartida**, para que cambiar el grosor de trazo de la app sea cambiar una línea.

Quince iconos, uno por categoría, cero repetidos.

### Ropa interior (apartado 1)

Una categoría más y nada más — *"debe funcionar exactamente igual que el resto"*, así que **no hay
un sistema aparte**, ni un campo nuevo, ni una pantalla propia. Se crea, se filtra, se edita y
aparece en el constructor de outfits como cualquier otra.

### Lo que esto deja apuntado

- ⚠️ **Añadir una categoría al armario es añadir su línea en `CATEGORIAS_ARMARIO` Y en
  `ICONOS_CATEGORIA`.** Dos listas cortas, porque una es de datos y la otra de componentes de React,
  y `armario.js` no puede importar JSX. Si falta la segunda, la prueba lo dice.
- 🐛 **Y otra cuenta exacta que estalló**: `test-armario.mjs` comprobaba
  `CATEGORIAS_ARMARIO.length === 14`, y saltó al añadir *Ropa interior* — una categoría con todo el
  derecho a existir, pedida por el apartado 1. Es la enésima vez en este proyecto
  (`MODULOS_EH.length === 13` saltó nueve veces). Ahora comprueba **que estén las que tienen que
  estar**, no cuántas hay.


## v3.12.0 — Entrega 3 · Fase 2: "hoy tengo que mantener mis rachas"

Segunda fase de la Entrega 3. El enunciado empieza avisando —*"el apartado Rachas actual está
funcionando muy bien y NO debe ser rediseñado"*— y pide *"una capa muy pequeña de mantenimiento
diario + recompensa visual"*. Eso es exactamente lo que hay: un archivo de treinta líneas útiles,
dos animaciones de menos de un segundo y ni una función que escriba.

### El bloque de Hoy (apartados 1-5)

En Hoy ya había una tarjeta de rachas desde RA F4: enseñaba **la racha más larga**. Lo que no
contestaba nadie es la pregunta de esta fase — **cuántas rachas piden una acción hoy**. Ahora sí:

- **Pendiente** → *🔥 Mantén tus rachas · 3 rachas necesitan registro*
- **Completado** → *🔥 Rachas mantenidas · 3/3 completadas*

**No se ha creado una segunda tarjeta.** El propio enunciado admite *"una representación equivalente
más integrada con el diseño actual"*, y dos bloques de rachas en Hoy serían justo el *"Dashboard
lleno de elementos innecesarios"* que prohíbe su apartado 2. El resumen de la racha principal se
queda debajo, en la misma tarjeta.

⚠️ **Y ahora se pinta también sin racha viva.** Antes salía solo si la principal llevaba días, así
que con tres rachas recién creadas y todas a cero Josué **no veía nada** que le recordara
mantenerlas. Sigue sin pintarse cuando no hay ninguna racha activa (apartado 2) — y devuelve `null`,
no un objeto con ceros: un cero pintaría *"0 por mantener hoy"* todos los días.

**Los hábitos de Productividad cuentan igual.** Un hábito tiene su racha desde RA F1, y para Josué
las dos cosas son "algo que mantener hoy". ⚠️ **Y registrarlo en Hábitos ya la mantiene** (apartado
10): no se pide dos veces la misma acción, y hay una prueba que lo comprueba.

### La recompensa (apartados 6, 7 y 8)

Al marcar el día, el fuego pega un pulso y sube un **+1** que se apaga: *🔥 7 días +1*, todo en
**900 ms**, porque el apartado 7 pide expresamente que **no** sea larga. Las dos animaciones viven
en `index.css` con la curva del resto de la app y **respetan solas "Reducir movimiento"**.

🚨 **Y no se guarda nada.** El "cuántos días había antes" es una referencia del render anterior, no
un dato en disco: guardar un *"ya te lo celebré"* sería el contador que el motor de rachas lleva
desde RA F1 negándose a tener. ⚠️ **Ni es gamificación** (D2-02): ni puntos, ni niveles, ni monedas
—hay una prueba que busca esas cinco palabras en el código—. Es el número de días que ya existía,
dicho más alto durante un instante.

### Lo que esta fase NO puede hacer, y está comprobado

El apartado 9 es tajante: *"No crear un botón independiente para 'sumar racha'. La racha debe seguir
dependiendo del registro real"*. Así que `rachasHoy.js`:

- **no tiene ni una función que sume, marque o registre** — hay una prueba que lee el código;
- **no llama a `completarDia`, `registrarCumplimiento` ni `saveData`**;
- **no recalcula rachas**: los números salen de `panelRachas` y `panelHabitos`, que existen desde
  RA F1 y RA F4. Un segundo cálculo acabaría diciendo un número distinto del de la pantalla de
  Rachas, y entonces uno de los dos mentiría.

Quien escribe sigue siendo `rachasServicio.js`, el único sitio del proyecto que puede.

### En el navegador de verdad

El recorrido de Chromium sube de 450 a **459 comprobaciones**, y hace el camino entero: con dos
rachas activas Hoy dice *"Mantén tus rachas · 2 rachas necesitan registro"*, se pulsa, se llega
**directo** a Rachas (apartado 3, sin pantalla intermedia), se marca el día, se ve el día ganado —
y al quitar las rachas **el bloque desaparece**.

### Lo que esto deja apuntado

- ⚠️ **`rachasHoy.js` LEE, no escribe.** Si una fase futura necesita que algo mantenga una racha,
  lo hace desde donde se registra esa acción, nunca desde aquí.
- ⚠️ **El `useEffect` del feedback va ANTES del `return` del estado vacío** (regla 4). Hay una
  prueba que comprueba el orden, porque ya se produjo una vez el *"Rendered more hooks than during
  the previous render"*.


## v3.11.0 — Abrir y cerrar, y la ficha por fin se comprueba contra los archivos

### Qué se ha construido
`ui_open_01/02` y `ui_close_01/02`, con un solo golpe cada uno para distinguirse de los toggles, que
llevan dos. La separación se mide: los `open` a ~13.200 Hz, los `close` a ~12.400. **11 de 46, y los
nueve de interfaz completos.**

### 🚨 Otra vez tres archivos mudos, y esta vez lo cazó la suite
`ui_open_01`, `ui_open_02` y `ui_close_02` no tenían quién los reprodujera. El catálogo de la SO F3
mandaba `ui_open` a `UI_CLICK` —abrir un panel sonaba igual que pulsar un botón— y `ui_close` no
declaraba variantes.

**La diferencia con las dos veces anteriores: no lo encontré mirando otra cosa.** La invariante que
se añadió esta mañana los nombró en rojo en cuanto se copiaron a la carpeta. Para eso estaba.

Se añade el evento `UI_OPEN` con su sonido `open_01`, y `back_01` pasa a tener las dos variantes de
cerrar.

### 🚨 Y la ficha ya no se comprueba contra números escritos a mano
Hasta ahora las duraciones mínimas y máximas de cada sonido existían y se probaban... contra valores
escritos en el propio test. **Nadie abría los archivos.** Un `ui_toggle_off` de 400 ms habría pasado
la suite entera.

`scripts/test-archivos-sonido.mjs` abre cada MP3 de `public/sonidos/` y mide su duración de verdad.

⚠️ **Sin ffmpeg**: la duración sale de leer las cabeceras de trama del propio MP3. `verificar.sh` no
puede depender de nada que no esté en el repositorio, o deja de correr en otra máquina.

🐛 Y la primera versión del medidor se equivocaba: daba 216 ms para un archivo de 150, y marcaba
seis sonidos correctos como pasados de largo. Faltaban dos cosas — la primera trama de un MP3 puede
ser una cabecera de información y no audio, y la subetiqueta LAME dice cuántas muestras de relleno
metió el codificador al principio y al final. El reproductor las descarta; el medidor no. Corregido
y contrastado contra `ffprobe`: coinciden al milisegundo.

### El volumen, con la misma vara para toda la biblioteca
Los `ui_open` salieron a **-1,5 dB** cuando el resto estaba a -3: el MP3 no reproduce el pico exacto
de la fuente, se pasa entre 1 y 2 dB según el material. Al alternar entre variantes eso se oye como
un bache.

`scripts/preparar-sonido.mjs` hace ahora **dos pasadas**: codifica, mide el archivo resultante, y
recodifica con la diferencia. Los once están entre -2,7 y -3,2 dB.


## v3.10.0 — Entrega 3 · Fase 1: la hora del iPhone, la papelera que no borraba y el título repetido

Primera fase de la **Entrega 3**. No añade nada: arregla tres cosas que Josué encontró usando la
aplicación de verdad en su móvil. Las tres eran invisibles para las 13 408 comprobaciones que ya
había, y por motivos distintos.

### 1 · La Safe Area del iPhone (apartado 1)

`index.html` lleva `viewport-fit=cover` desde siempre, que es lo que hace que el fondo llegue hasta
los bordes. El precio es que la página se dibuja **debajo** de la barra de estado — y los dos
botones de arriba estaban clavados en `top: 14`, o sea encima de la hora, del Wi-Fi, de la batería y
de la Dynamic Island.

**No se ha puesto un margen a ojo**, porque no existe un número que valga: un iPhone con isla, uno
con muesca y uno sin nada reservan alturas distintas. Ahora lo dice el propio sistema operativo con
`env(safe-area-inset-top)`, declarado una sola vez en `index.css` como `--safe-top` / `--safe-bottom`
— el mismo criterio que los `--color-*`. En un ordenador vale `0px` y todo queda exactamente igual
que estaba.

Se ha aprovechado para tres cosas más del mismo apartado:

- Los dos botones pasan a tener **44 px de área táctil** (`toque-44`) sin agrandar el círculo de
  36 px: un pseudoelemento transparente centrado. Es la regla de EH F42, que estos dos incumplían.
- El contenido cambia `pt-16` por `pantalla-segura`: los mismos 4 rem **más** lo que reserve iOS.
- La barra de 5 pestañas deja sitio al indicador de inicio (`nav-segura`), que en un iPhone sin
  botón se dibujaba encima de las etiquetas.

⚠️ **Y una trampa apuntada para el futuro:** un `top` en el `style={{}}` de esos botones **gana** a
la clase de CSS y deshace la corrección entera sin que falle nada. Hay una comprobación que lo
vigila.

### 2 · La papelera de Economía, y las otras 128 (apartado 2)

Josué lo contó exacto: *"crea un movimiento, aparece el icono de papelera, al pulsarlo no ocurre
nada"*. La causa era de una línea: **`FinanceView` declaraba `onDeleteMovimiento` en su firma y la
llamaba en el `onClick`, pero `App.jsx` nunca se la pasaba**. `deleteMovimiento` existía desde ME F3
y va por `eliminarConPapelera`; solo faltaba el cable.

🚨 **Ese fallo no lo puede ver nada de lo que había.** No es un error de compilación, ni de
renderizado: la pantalla se pinta perfecta y el botón existe. Solo al **tocarlo** salta un
`TypeError: onDeleteMovimiento is not a function`, que se queda en la consola del iPhone —donde
nadie mira— y en pantalla no pasa nada.

Así que el apartado 2 se ha cumplido literalmente: `scripts/test-borrados.mjs` busca **los 129
botones de eliminar de la aplicación** (`<BotonBorrar>`, y cualquier `<button>` cuyo texto,
`aria-label` o icono hablen de eliminar, borrar, quitar o papelera), saca el identificador que
llaman y comprueba que haya algo detrás — si es una prop, que **todos** los sitios que usan ese
componente se la pasen. **Uno estaba roto: el de Josué.** Los otros 128 están bien.

⚠️ Y aprendió una distinción por el camino: `{onEliminar && <BotonBorrar…>}` **no es un botón
muerto**. Sin la prop no se pinta, que es como una fila reutilizable ofrece la acción solo donde
tiene sentido. El fallo que hay que cazar es el contrario.

### 3 · Confirmar solo lo que no se puede deshacer (apartado 3)

El enunciado propone *"Esta acción no se puede deshacer"* para un movimiento de Economía, y **en
esta aplicación eso sería mentira**: desde ME F3 un movimiento va a Eliminados recientemente y
vuelve de ahí. El mismo apartado dice *"no añadir confirmaciones innecesarias por todas partes"*, y
`BotonBorrar` ya tenía escrito por qué no pregunta. Se ha respetado.

Lo que sí es irreversible, y **no preguntaba nada**, son las tres cosas que borran un archivo de
verdad en Supabase Storage: la **foto de progreso** de Salud, el **vídeo** de calistenia y el
**archivo** de la Biblioteca. Ésas no pueden ir a la papelera —quedaría una fila apuntando a un
archivo que ya no existe— y un toque sin querer se llevaba la foto para siempre. Ahora las tres
pasan por `BotonBorrarDefinitivo`, con su aviso por `createPortal` (regla 3) y un texto que dice la
verdad: *"se borra del todo y no se puede recuperar"*.

En la Biblioteca la distinción es por elemento: un apunte y un enlace no preguntan (van a la
papelera); un PDF, un vídeo o una foto sí.

### 4 · El título repetido de los desplegables (apartados 4-6)

`<Seccion titulo="Fondo" sub={describirFondo(…)}>` pintaba la cabecera, y `BloqueFondo` volvía a
escribir **las dos cosas** justo debajo al desplegarlo: *Fondo / Fondo*, y la descripción dos veces.
Se resuelve con un `sinTitulo` explícito en la llamada, no escondiendo el título para siempre: el
bloque sigue trayéndolo para quien lo use suelto.

El apartado 6 pedía revisar los demás. **Había un segundo**, del que Josué no se había quejado:
*Apariencias guardadas*. Los otros cuatro desplegables estaban bien. **No se ha tocado nada más de
Apariencia** (apartado 7).

### Lo que esto deja apuntado

- ⚠️ **Un botón de eliminar nuevo tiene que pasar por `test-borrados.mjs`.** Si llama a una prop que
  su pantalla no recibe, salta el mismo día — no dentro de tres meses, tocándolo en el móvil.
- ⚠️ **Nunca un `top` en línea en los dos botones de arriba**: gana a `accion-superior` y devuelve el
  botón debajo de la hora.
- ⚠️ **Un bloque dentro de un `<Seccion>` no repite el título de la sección**: se le pasa `sinTitulo`.
- 🐛 **Y la enésima vez de la lección de siempre, dos veces seguidas el mismo día**: el detector de
  títulos duplicados saltó con **su propio comentario**, que cita el título que ya no existe; y la
  comprobación de que `BotonBorrar` no pregunta saltó porque una ventana de 700 caracteres se
  llevaba dentro al componente siguiente, que sí tiene `useState`. **Una prueba que lee el código
  quita los comentarios antes, y no recorta por caracteres a ojo.**

### Una nota de versión

`package.json` se había quedado en **3.4.1** mientras el `CHANGELOG` iba por **3.9.0**: las entradas
de sonido de los últimos turnos no subieron el número. Se pone al día en **3.10.0**, que es donde
está de verdad.


## v3.9.0 — `error`: el aviso que no asusta

### Qué se ha construido
Lo que suena cuando algo no sale: no se ha guardado, ha fallado la conexión, la IA no responde.
Medido en el archivo:

| Momento | Frecuencia | Nota |
|---|---|---|
| 30 ms | 329 Hz | **E4** |
| 100 ms | 263 Hz | **C4** |

Una tercera descendente. **265 ms**, pico a **-3 dB**. **7 de 46.**

### La decisión de registro
`error` queda **una octava por debajo de `success_01`** (C4 frente a C5). No es casualidad: el oído
espera que lo que va mal suene más grave que lo que va bien, y así los dos se distinguen sin
leer nada.

⚠️ Pero solo una octava. La primera versión salió a **C3, 129 Hz**, y eso no es "más grave": es
por debajo de donde llega un altavoz de móvil. Se habría oído un resto de armónicos y nada más.
La app se usa en el teléfono, así que 500 Hz es la frontera que importa, no el gusto en cascos.

### Lo que la ficha prohíbe, y por qué importa aquí
La lista `EVITAR` incluye **"alarma agresiva"**. Un error en esta aplicación es *"esto no se ha guardado"*,
no una emergencia. Dos notas que bajan y se apagan avisan; un pitido repetido asusta. Es la
diferencia entre una app que te acompaña y una que te riñe.


## v3.8.0 — El primer sonido con nota: `success_01`

### Qué se ha construido
El "hecho": lo que suena al guardar algo, terminar una tarea, registrar una comida o acabar un
entreno. Seis usos comparten este sonido, y por eso es de los que más se van a oír.

Medido en el archivo, no supuesto:

| Momento | Frecuencia | Nota |
|---|---|---|
| 30 ms | 525 Hz | **C5** |
| 150 ms | 788 Hz | **G5** |

Una quinta ascendente. **265 ms**, pico a **-3 dB**, 10,6 KB. **6 de 46.**

### ⚠️ Y una corrección que salió de que Josué discutiera el dato
La primera versión sonaba a **C4 → G4**, dos octavas por debajo de lo que él había escrito en el
piano roll: el preset de FLEX (`Lucky Pluck`, un pluck de bajo) transpone hacia abajo por su cuenta.

Eso importa porque **los altavoces de móvil rinden mal por debajo de 500 Hz**, y un C4 son 262. En
cascos no se notaría; en el teléfono, que es donde se va a usar la app, habría llegado flojo.

La primera propuesta fue mover las notas. Josué respondió que eso le obligaba a escribirlas en C7, lo
cual era absurdo — y tenía razón: lo que había que mover era el `PITCH` del propio instrumento,
no las notas. Subido a +12, las notas se quedan donde estaban y suena una octava más arriba.

Una objeción suya evitó una chapuza.

### Nota de método
El eco venía de que el preset traía **Delay y Reverb encendidos de fábrica**. Un sonido de interfaz
no puede tener reverb: lo mete en una sala imaginaria cuando tiene que sonar como si saliera del
propio aparato. Y habría reventado el techo de 300 ms.


## v3.7.0 — Los interruptores, y la invariante que protege el trabajo de Josué

### Qué se ha construido
`ui_toggle_on` y `ui_toggle_off`: las mismas dos notas invertidas. Medido en el archivo,
no supuesto:

| | Golpe 1 → Golpe 2 | |
|---|---|---|
| `ui_toggle_on` | 13295 → 13741 Hz | ⬆ sube |
| `ui_toggle_off` | 13759 → 13223 Hz | ⬇ baja |

Los dos a **125 ms** y con el pico a **-3 dB**. Subir es encender y bajar es apagar: no hay que
aprendérselo. **Con esto quedan hechos los cinco de interfaz. 5 de 46.**

### 🚨 El de apagar no se habría oído nunca
La SO F3 declara `ui_toggle_on` y `ui_toggle_off` como dos sonidos distintos. Pero los dos apuntaban
al mismo evento del motor, `UI_TOGGLE`, que resuelve a **un solo archivo**. El de apagar era
inalcanzable.

- Se añade el evento `UI_TOGGLE_OFF` y el sonido `toggle_off_01`
- La SO F3 pasa a mandar el suyo a ese evento

### 🚨 Y la invariante que faltaba
**Esto ha pasado dos veces en un mismo día.** Josué graba un archivo, cumple su ficha, lo damos por
bueno — y nada en el motor puede reproducirlo. Primero `ui_click_02/03`, que sin rotación no sonaban.
Después `ui_toggle_off`, que caía en el evento equivocado.

Las dos veces **el archivo era correcto y el sistema estaba mal**. Y las dos veces se descubrió por
casualidad, mirando otra cosa.

Ahora hay una prueba que lee `public/sonidos/` y exige que **algo pueda tocar cada archivo que hay
ahí**. Si un sonido grabado queda mudo, la suite lo dice por su nombre. Verificado quitando
`toggle_off_01`: sale `MUDOS: ui_toggle_off.mp3`.

Es la única prueba del proyecto que no protege el código, sino el trabajo de Josué. Grabar algo que
nunca va a sonar es la peor forma de perder una tarde.

### Textos que dejaron de ser verdad
- *"porque todavía no hay ni un archivo que sonar"* → sigue apagado, pero porque la biblioteca está a
  medias: encenderlo con 5 de 46 dejaría 41 eventos mudos
- La cabecera de `audio.js` afirmaba que no había ningún archivo. Se marca como superado **sin
  borrarlo**: explica por qué el motor está construido como está


## v3.6.0 — Las tres variantes del clic, y la rotación que faltaba

### Qué se ha construido
Josué produjo `ui_click_02` y `ui_click_03` en FL Studio: el mismo charles con la nota movida una
tecla arriba y otra abajo. **3 de 46.**

Los tres quedan en `public/sonidos/` a **120 ms**, con el pico a **-3 dB** y menos de **0,4 dB** de
diferencia entre ellos — al alternar no se oye ningún bache de volumen.

### 🐛 Y un fallo mío al procesarlos
El primer recorte los volvió a comprimir a **128 kbps**, que recorta por encima de 16 kHz. La
diferencia entre los tres clics vive justo ahí, así que el procesado **estaba borrando la variación
que Josué había creado**: medido, el orden de timbre pasó de `03 < 01 < 02` (sus originales) a tener
el 02 por debajo del 01.

Rehechos a 256 kbps sin recorte de agudos, y normalizados uno a uno al mismo pico en vez de con un
limitador común. El orden queda como lo grabó: `03 (12983 Hz) < 01 (13201) < 02 (13439)`.

### 🚨 Sin esto, dos de los tres no se habrían oído nunca
Se dijo que "con los tres hechos la app va alternando sola". **Era falso.** El motor resolvía
`UI_CLICK` a un único archivo, siempre el mismo: `ui_click_02` y `ui_click_03` no se habrían
reproducido jamás, y el trabajo de grabarlos habría sido para nada.

La rotación no existía. Ahora sí:

- Un sonido puede declarar `variantes`, y quien no lo haga tiene una: la suya. Un sonido subido por
  Josué, que nunca tendrá variantes, entra por el mismo camino sin romperse
- `decidirReproduccion()` rota **en orden** 1 → 2 → 3 → 1
- ⚠️ En orden y no al azar por dos motivos: el azar repite —tres veces seguidas la misma no es raro—
  y no se puede probar sin inyectar un generador
- El turno viaja en el mismo `estado` que ya pasaba de forma pura, así que el motor sigue sin guardar
  nada por su cuenta y la prueba no necesita ni reloj ni audio

Y las variantes se comprueban contra la SO F4 igual que las rutas: declarar archivos en un segundo
sitio es exactamente lo que hizo que el motor y la biblioteca se separaran durante cuatro fases.

### ⚠️ Lo que sigue sin estar
Ningún botón de la aplicación dispara sonido. `reproducir()` se llama desde un solo sitio: el botón
«▶ Escuchar» de Ajustes → Sonido y respuesta. Con los tres clics, ese botón ya alterna entre ellos.


## v3.5.0 — Los dos catálogos de sonido que nunca se hablaron

### 🚨 El motor pedía archivos que nadie iba a producir
Al preguntar si `ui_click_01.mp3` sonaría al abrir la web, la respuesta era **no**, y por un motivo
que no tenía nada que ver con el fallo de la ruta de ayer.

Había **dos catálogos de sonido incompatibles**, de dos fases distintas, conviviendo sin saberlo:

| | Fase | Cuántos | Cómo los nombra |
|---|---|---|---|
| El motor | SO F1 (`audio.js`) | 9 | `/sonidos/ui/click_01.webm` — subcarpetas, **webm** |
| La biblioteca | SO F4 (`especificacionSonidos.js`) | 46 | `/sonidos/ui_click_01.mp3` — plano, **mp3** |

El motor reproduce lo que dice la SO F1. El brief desde el que Josué está grabando es el de la SO F4.
Su archivo habría dado **404**, igual que los 45 restantes.

**Por qué no saltó en cinco fases de sonido:** con la carpeta vacía, dos sistemas de nombres
incompatibles producen exactamente el mismo resultado que uno correcto — silencio. Hasta que hubo un
archivo, no había diferencia observable entre estar bien y estar mal.

### Qué se ha decidido
**Manda la SO F4**, y no por ser la más nueva: es la que tiene las 46 fichas con duraciones, el
validador, y el documento desde el que Josué produce. Las nueve rutas del motor se repuntan a
archivos que esa biblioteca declara.

- Los `id` **no se tocan** (`click_01`, `success_01`…): viven en las preferencias guardadas de Josué
- La correspondencia es a mano y a propósito — son nueve, y cada una es una decisión: `back_01` va al
  sonido de cerrar, `milestone_01` al hito de 7 días, que es el genérico
- `test-audio.mjs` comprueba que **las nueve apuntan a un archivo declarado en la SO F4**, que
  ninguna use un formato que la SO F4 no pide, y que ninguna vaya en subcarpetas. Verificado
  revirtiendo una ruta: las tres se ponen rojas

### La prueba que estaba escrita para fallar hoy
La SO F1 dejó una comprobación con una nota: *"FALLARÁ el día que se añadan archivos, y ahí habrá que
encender `activado` por defecto y quitarla."* Falló, como estaba previsto.

Se cumple **a medias, a propósito**: hay 1 de 46 archivos, así que encender el sonido por defecto
haría que 45 eventos pidieran ficheros inexistentes. Sigue apagado, y la condición para encenderlo
queda escrita en la propia prueba —cuando los 46 estén en el disco— en vez de en la cabeza de nadie.

### ⚠️ Lo que sigue sin estar
Ningún botón de la aplicación dispara sonido todavía. `reproducir()` se llama desde **un solo sitio**:
el botón «▶ Escuchar» de Ajustes → Sonido y respuesta. Enganchar los eventos a la interfaz es trabajo
que no está hecho, y decir lo contrario sería mentir sobre lo que hay.


## v3.4.0 — El primer sonido de verdad (y el fallo que destapó)

### Qué se ha construido
Josué produjo en FL Studio el primer archivo de la biblioteca, `ui_click_01.mp3`: un charles 808
agudo, recortado a **120 ms** y con el pico a **-4 dB**. Pasa `validarArchivo()` sin una sola pega.
Quedan 45.

### 🐛 Y ese primer archivo destapó que el audio no habría sonado
`listaDeArchivos()` montaba la ruta con `CARPETA`, que vale `public/sonidos`. Pero en Vite **todo lo
que está en `public/` se sirve desde la raíz**: el navegador lo pide como `/sonidos/ui_click_01.mp3`,
sin el `public/`. El motor habría pedido `public/sonidos/…` y recibido un **404 con cada sonido**.

Llevaba así desde la SO F4 y **no saltó en ninguna fase** por un motivo simple: no había ni un
archivo que cargar. Se arregla separando dos cosas que nunca fueron la misma:

- **`CARPETA`** = `public/sonidos` — dónde se dejan los archivos, que es lo que dice el brief
- **`RUTA_WEB`** = `/sonidos` — por dónde los pide el navegador
- Cada archivo lleva ahora `ruta` (la URL) y `enDisco` (el sitio), y una prueba comprueba que
  **ninguna ruta contiene `public/`**. Verificado revirtiendo el fallo a propósito: la suite se pone
  roja en las dos líneas.

### 🚨 Dos afirmaciones que dejaron de ser verdad
Al aparecer el archivo, la suite se puso roja **defendiendo una verdad vieja**: había pruebas que
afirmaban que la carpeta estaba vacía y que `hoySuena` era `false`. Eran constantes escritas a mano,
y por eso no podían cambiar de opinión.

- `hoySuena` **se calcula** ahora contando los archivos que hay
- `cuantosArchivosFaltan()` acepta los presentes; antes preguntaba siempre por una lista vacía, así
  que habría seguido diciendo "faltan 46" con archivos ya en la carpeta
- Los dos tests leen el disco con `readdirSync`: cuentan lo que hay, hoy 1 y mañana los que haya

Un panel que no puede cambiar de opinión no informa de nada.

## v3.4.1 — Una regla invariante más: dos `const` con el mismo nombre en el recorrido

### Qué se ha arreglado
`scripts/test-imports.mjs` tiene una **tercera regla**: ningún recorrido de Chromium puede declarar
dos veces el mismo `const` de primer nivel.

### Por qué
`scripts/test-app-real.mjs` es un módulo largo y **plano**: ciento cincuenta y ocho `const` seguidos,
sin funciones que los separen. Una sección nueva que reutilice un nombre ya usado —`portada`, `rut`—
**no compila**, y entonces el archivo entero no arranca.

Eso no lo ve nada: ni el build de Vite, ni los 1 408 casos de renderizado, ni las 11 537
comprobaciones de Node. Lo único que lo ve es **lanzar el recorrido**, que tarda **doce minutos**. Y
pasó **dos veces seguidas** construyendo la Fase 18 y la Fase 19.

La regla lo caza **en un segundo**, y por eso conviene lanzar `node scripts/test-imports.mjs` antes
del recorrido, no después.

### Verificación
`bash scripts/verificar.sh` en verde — build de Vite, **11 537 comprobaciones de Node**, **1 408
casos de renderizado**, **13 reglas invariantes** y **450 comprobaciones en Chromium**. El recorrido
actual no tiene ni un `const` repetido, así que la regla entra en verde y se queda vigilando.

### Archivos
- **Modificados:** `scripts/test-imports.mjs`.

---

## v3.3.0 — El endpoint de la IA ya pide quién eres (EH F63, cerrado)

### Qué se ha construido
El hallazgo de la Fase 63 era éste: **`/api/ask-ai` no preguntaba quién llamaba.** Cualquiera que
supiera la URL de Vercel podía llamarlo desde una terminal y gastar el saldo de Anthropic de Josué.
No era una fuga de datos —desde ahí no se lee nada de nadie— era una **factura**.

No se cerró en la F63 a propósito: ese endpoint lo usan seis módulos (Nutrición, Calistenia,
Biblioteca, Estilo de hombre, Hoy y Estadísticas), y una fase de Estilo de hombre no decide por toda
la aplicación. Quedó escrito en `HALLAZGO_ENDPOINT` con el arreglo palabra por palabra, esperando
una decisión de Josué. **Josué decidió el 4 de septiembre de 2026, y el arreglo fue exactamente el
que estaba escrito.**

- **`api/ask-ai.js`** le pregunta a Supabase de quién es el token de la cabecera `Authorization`.
  Sin token válido: 401, y no se llama a Anthropic. Más un tope de 30 peticiones por usuario y hora.
- **`src/lib/ai.js`** manda ese token en sus tres llamadas (`askAI`, `askAIWithImage`,
  `askAIWithImages`), sacándolo de la sesión que el navegador ya tiene.
- **`scripts/test-endpoint-ia.mjs`** (nuevo, 17 comprobaciones) importa el handler de verdad y le
  pasa un `req` falso.

### Las decisiones que lo gobiernan
**1. 🚨 Quien decide si vale es el servidor, no el cliente.** `ai.js` manda la cabecera, pero si no
hay sesión la manda **sin** cabecera y deja que el servidor conteste 401. Un cliente que decide si
hace falta autenticarse no está autenticando nada.

**2. ⚠️ Supabase caído NO abre la puerta.** Si el verificador no contesta, se devuelve 503 y no se
pasa. Dejar pasar "por si acaso" cuando el verificador falla es justo lo que buscaría quien quisiera
saltárselo, y hay una comprobación dedicada a eso.

**3. ⚠️ Lo que falla por configuración devuelve 503 diciendo QUÉ falta, no un 401 mudo.** Como el
endpoint lo usan seis módulos, un 401 haría pensar que el problema es la cuenta del usuario cuando
está en las variables de entorno de Vercel.

**4. 🚨 Y el tope por usuario se declara frágil, porque lo es.** Vive en memoria, y Vercel levanta y
tira instancias: se salta repartiendo llamadas. Para un límite de verdad haría falta una tabla en
Supabase. Frena lo que de verdad puede pasar —un bucle de la aplicación, una pestaña reintentando
sola toda la noche—, no a alguien decidido. Queda escrito en `loQueSigueAbierto`, no dado por hecho.

### Lo que el cierre dice ahora
`BLOQUEADO` pasa de cuatro cosas a tres, pero el endpoint **no se borra**: sale a `DESBLOQUEADO`,
con quién lo decidió, cuándo, cómo se cerró y qué sigue abierto. Un cierre que hace desaparecer sus
bloqueos deja de ser el registro de lo que pasó. `docs/09_ESTILO_DE_HOMBRE_CIERRE.md` se regenera
con una sección nueva, 🔓, y el apartado 14 de seguridad pasa a cumplido —comprobándolo leyendo
`api/ask-ai.js`, no fiándose de una bandera escrita a mano.

### 🐛 Dos fallos cazados de paso
**El arnés de renderizado se llevaba el Supabase de verdad.** Su stub filtraba `lib/supabase`, y se
le escapaba `./supabase` —que es como lo importa `ai.js`, desde dentro de la misma carpeta—. En
cuanto ai.js pidió el token, **todas** las vistas reventaron con `Cannot read properties of
undefined (reading 'VITE_SUPABASE_URL')`. El filtro ahora es `(^|/)supabase(.js)?$`.

**🚨 Y una invariante que llevaba tiempo sin poder fallar.** En la comprobación de "ningún hex suelto
fuera de `tokens.js`" se había colado un `\n` literal en mitad de la tubería. `grep` tomaba `n` como
nombre de fichero, ignoraba la entrada y devolvía vacío: la regla **daba verde con cualquier
violación**. Se comprobó metiendo un `#AB12EF` a mano —antes pasaba, ahora lo caza y lo señala con
archivo y línea—. El proyecto estaba limpio, pero llevaba sin vigilancia.


## v3.2.0 — Calendario: intervalo personalizado y saltar un día (C3, R2.3 y R2.4)

### Qué se ha construido
Tres cosas que la Fase 3 del Calendario dejó abiertas y llevaban desde entonces en la lista de
pendientes:

* **R2.3 — «cada 2 semanas».** Un intervalo por encima de la frecuencia: cada 3 días, cada 2
  semanas, cada 2 meses. **No es una frecuencia nueva** —«cada 2 semanas» sigue siendo semanal—,
  así que multiplica el paso y ya está.
* **R2.4 — saltar un día sin romper la serie.** `saltarOcurrencia()` apunta la fecha en una lista
  de excepciones. ⚠️ **La serie SIGUE después**: eso es justo lo que separa «salto el martes» de
  «termina el martes», y hay una comprobación de que las siguientes ocurrencias siguen saliendo.
* **R2.4 — cambiar solo un día.** `retocarOcurrencia()` guarda **únicamente los campos que
  cambian**, no una copia del evento. ⚠️ Eso hace que si mañana cambias el título de la serie, el
  día retocado **hereda el nuevo** salvo en lo que tocaste. Una copia se habría quedado congelada.

Y nada de esto materializa ocurrencias: una excepción es una fecha en una lista y un retoque es un
objeto con tres campos (regla 11).

### En la pantalla
El editor de eventos tiene ahora **«Cada cuánto»** —con la frase debajo diciéndolo en cristiano:
*«Cada 2 semanas · 1 día saltado»*— y, cuando abres **una ocurrencia** de una serie, un botón
**«Saltar este día»**. ⚠️ Ese botón solo aparece ahí: en un evento suelto no significaría nada.

### ⚠️ Y un detalle que habría roto la serie en silencio
Un intervalo de **0** —guardado por error, o por un dato antiguo— dejaría la serie parada o en
bucle. `intervaloDe()` lo trata como **1**, igual que un negativo, un texto o un campo que no
existe: el comportamiento de siempre. No se confía en el dato guardado.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **11 061 comprobaciones de Node** (27
nuevas), **1 408 casos de renderizado**, **12 reglas invariantes** y **450 comprobaciones sobre la
aplicación de verdad en Chromium**.

## v3.1.2 — 🐛 Cuatro fechas más en UTC, y una regla para que no haya una séptima

### Qué pasaba
Después de arreglar el calendario, un barrido por todo el código buscando el mismo patrón encontró
**cuatro sitios más** donde una fecha **local** salía de `toISOString()`:

* 🐛 **La racha de entrenamiento** (`TrainingView`): las sesiones se guardan con fecha local y la
  racha se contaba en UTC. Entre medianoche y las dos de la madrugada, si habías entrenado hoy y
  ayer no, la pantalla ponía **racha 0**.
* 🐛 **Las cuatro ventanas de `predicciones.js`** —el plazo de un objetivo, el riesgo de abandono de
  un hábito y la comparación de las dos últimas quincenas— se corrían un día en esa misma franja.
* 🐛 **La media de ánimo de los últimos 7 días** en el Dashboard, igual.
* 🐛 **La marca de "ya te avisé hoy"** de las notificaciones: usaba la clave de ayer, así que un
  aviso podía repetirse.

Ninguno es tan grave como el del calendario, pero son el mismo fallo y estaban por el mismo motivo:
`new Date(...)` da una hora **local** y `toISOString()` la pasa a UTC restando el huso.

### 🚨 Y ahora hay una regla invariante que lo impide
Sexta vez con la misma trampa. Así que `verificar.sh` tiene una **regla invariante nueva, la 12**:
**ninguna fecha local puede salir de `toISOString()`**. Se ha comprobado que caza el caso metiendo
una línea mala a propósito, y salta.

Ya no depende de que alguien se acuerde: si vuelve a aparecer, la verificación se pone roja.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **11 034 comprobaciones de Node**, **1 408
casos de renderizado**, **12 reglas invariantes** (una nueva) y **450 comprobaciones sobre la
aplicación de verdad en Chromium**.

## v3.1.1 — 🐛 Las recurrencias del Calendario estaban rotas

### Qué pasaba
Buscando qué quedaba por construir apareció esto, y no es un detalle: **las tres recurrencias del
Calendario Universal daban fechas equivocadas**, y llevaban así desde la Fase 3. Los tres,
comprobados ejecutando el expansor antes de tocar nada:

* 🚨 **Un evento DIARIO no avanzaba nunca.** `siguienteOcurrencia` devolvía **la misma fecha**, así
  que la serie generaba **quinientas copias del mismo día** hasta agotar el tope de seguridad — y el
  evento **no aparecía en ningún otro día del mes**.
* 🚨 **Uno SEMANAL avanzaba seis días, no siete**: 1, 7, 13, 19, 25… Un *"todos los lunes"* se iba
  caminando hacia atrás por la semana.
* 🚨 **Y uno MENSUAL del día 31** saltaba de enero **al 2 de marzo** —febrero no tiene 31— y a partir
  de ahí **se quedaba pegado al día 3**.

### Por qué
Las dos primeras son **el UTC de siempre**: `new Date('2026-06-01T00:00:00')` es medianoche **local**,
y `toISOString()` la pasa a UTC restando el huso, así que en España el resultado retrocede un día.
**Quinta vez** que este proyecto pisa la misma trampa (motorRutinas, calendarioIntegracion,
avisosEstilo y las pruebas de Estilo de hombre). Ahora usa `fechaLocalISO`, como el resto.

La tercera era distinta: encadenar `setMonth(+1)` arrastra el recorte. Ahora **mensual y anual se
cuentan desde el ancla**, así que cada ocurrencia sabe qué día quería ser: **31 ene → 28 feb → 31
mar**, no el día 3 para siempre. Y un anual del **29 de febrero** cae el 28 los años normales y
**vuelve al 29** en el bisiesto.

### Y por qué había sobrevivido tantas versiones
**No había ni una prueba del calendario.** Ahora hay `scripts/test-calendario.mjs` con 38
comprobaciones, y las tres primeras son exactamente los tres fallos, clavados para que no vuelvan.

⚠️ Y una nota que importa: **en una máquina en UTC esto no falla**. Por eso pasó desapercibido. La de
Josué está en España.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **11 034 comprobaciones de Node** (38
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **450 comprobaciones sobre la
aplicación de verdad en Chromium**.

## v3.1.0 — SO Fase 5/5: producción, integración y test final

### Qué se ha construido
*"Convertir toda la especificación de las fases anteriores en un sistema de audio real, organizado,
optimizado y preparado para producción."*

⏸ **Sigue sin haber ni un archivo de audio**, y esta fase no puede traerlos: los da Josué. Pero de
los cuarenta y ocho apartados, **la mayoría no los necesitan** — y ésos sí se construyen.

**Y por fin existe la pantalla.** `Ajustes → Sonido y respuesta`, la del apartado 24, con sus siete
controles: 🔊 Sonidos · 🔉 Volumen · 🎛 Perfil · 🔥 racha · 🏆 recompensas · ✨ interfaz ·
📳 Vibración. La SO F1 dijo *"no empieces todavía la pantalla de Ajustes"*; era de esta fase, y ya
está — **cableada en `App.jsx`**, no un componente huérfano.

⏸ Lo primero que dice esa pantalla, arriba del todo: **"todavía no suena nada"**. Interruptores que
no hacen nada sin avisar es lo que la regla 8 prohíbe.

### Las decisiones de la fase

**1. 🚨 El motor no se reescribe.** El apartado 2 propone otra estructura de carpetas
—`src/audio/engine/…`— y **no se adopta**: mover un motor que funciona y está probado desde la SO F1
para que el árbol se parezca a un dibujo es el *"cambio de arquitectura innecesario"* que este
proyecto lleva setenta fases evitando. Lo que el apartado quiere de verdad **sí se cumple**, y hay
una comprobación: **ninguna pantalla hace `new Audio(...)`**.

**2. ⚠️ El volumen multiplica: maestro × categoría × EVENTO.** La SO F1 ya hacía las dos primeras;
esta fase añade la tercera, y es lo que permite que **un clic suene por debajo de un récord** sin
tocar los archivos.

**3. ⚠️ Un perfil no es un sexto sistema.** Aplicar "Equilibrado" **escribe las preferencias que ya
existen**, y qué perfil tienes puesto **se deduce**, no se guarda: en cuanto tocas una casilla a mano
pasas a "Personalizado". Un perfil guardado aparte se desincroniza el primer día y entonces la
pantalla dice una cosa mientras suena otra.

**4. 🚨 Silencio no es "no pasa nada".** Con el sonido apagado el **evento se sigue procesando**: la
racha sube, el logro se guarda y la pantalla lo enseña. Lo único que no ocurre es el audio. Y la
vibración es **otro interruptor**: sonido apagado + vibración encendida funciona, y está probado.

**5. ⚠️ Y cinco pruebas necesitan un teléfono.** iPhone, auriculares, una llamada en mitad de un
sonido, volver a la aplicación y cien eventos seguidos. Van a **R1** con su motivo — el de los
auriculares es el más honesto: *"hay que enchufarlos"*.

### Lo que sigue bloqueado, y por qué no se disimula
Cuatro apartados —calidad, optimización, criterio de calidad y control de versiones de los sonidos—
**se aplican a archivos que no existen**. Quedan marcados ⏸, y `hoySuena` es **false** en el panel.
El día que estén en `public/sonidos/` con los nombres de la SO F4, **suenan sin tocar una línea**.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **10 996 comprobaciones de Node** (95
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **450 comprobaciones sobre la
aplicación de verdad en Chromium**.

## v3.0.0 — EH Fase 65/65: cierre, congelación y entrega final 🏁

### 🏁 ESTILO DE HOMBRE: 65/65

*"Cuando esta fase termine, Estilo de hombre queda cerrado como módulo funcional. No significa que
jamás pueda evolucionar. Significa que tenemos una **BASE ESTABLE v1.0**."*

**JC Fitness — Estilo de hombre v1.0.** Sesenta y cinco fases, diecisiete apartados, **cero líneas de
SQL** y **cero sistemas duplicados**.

### 🚨 El informe final se calcula, no se marca
El apartado 18 pide nueve líneas con ✅ / 🟡 / 🔴, y la tentación evidente es escribir nueve ✅. Cada
una **sale de `condicionFinal()`**, que a su vez ejecuta la auditoría de su fase. El informe no es
una opinión sobre el módulo: es su estado.

**Y salen ocho de nueve.** La que falta es **🟡 Móvil**: nadie ha abierto esto en un iPhone. Es 🟡 y
no 🔴 a propósito — no está roto, está **sin comprobar donde importa**. El apartado 17 es explícito:
*"si algo falla: **no ocultarlo**. Registrarlo como pendiente."*

Y la seguridad sale ✅ **con su matiz escrito en el propio informe**: los datos están protegidos por
RLS; lo que sigue abierto es `/api/ask-ai`, que no protege datos sino la factura de la IA.

### 🚨 Y "bloqueado" no es lo mismo que "pendiente"
El inventario final separa las cuatro cosas que pide el enunciado, y la distinción que importa es
ésa: **🟡 pendiente** es *"falta hacerlo"*; **🔴 bloqueado** es *"no se puede hacer desde aquí"*.

Hay **cuatro bloqueados**, y los cuatro dicen **quién lo decide** y **cuál es el arreglo**: el
endpoint sin autenticación, los conflictos entre dispositivos, el sistema global de copias y los
favoritos globales. Ninguno es un olvido; los cuatro esperan una decisión que no es de este módulo.

### Congelado, pero no cerrado con llave
❌ No funciones nuevas, no módulos nuevos, no cambios de arquitectura. ✅ Sí correcciones, errores y
ajustes imprescindibles — con el listón alto escrito: *"si hace falta una pantalla nueva para
hacerlo, no es un ajuste: es una función"*.

### Y el documento de cierre también se genera
**`docs/09_ESTILO_DE_HOMBRE_CIERRE.md`**, como el técnico de la F53: sale del código. Si una fase se
pone roja mañana, esa página lo dirá sola.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **10 901 comprobaciones de Node** (79
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **450 comprobaciones sobre la
aplicación de verdad en Chromium**.

*Arquitectura → módulos → personalización → datos → UX → IA → contexto → accesibilidad → seguridad →
copias → escalabilidad → pruebas → producción → cierre.*

## v2.30.0 — EH Fase 64/65: prueba integral end-to-end

### Qué se ha construido
*"Ahora dejamos de probar cada parte por separado. ¿Todo Estilo de hombre funciona correctamente
cuando se utiliza como un sistema completo?"*

Dos cosas, y la segunda es la que importa.

**1. Los veintiséis recorridos** del enunciado, cada uno con cómo se comprueba y dónde.

**2. 🚨 `recorridoCompleto()`: una sola cadena de trece pasos que atraviesa el módulo entero.**
Configurar → añadir datos → personalizar → **cerrar y volver** → encender el permiso de la IA →
aprender → sacar un insight → montar el resumen → recomendar con un evento → hacer copia → romper un
módulo → restaurarlo → migrar de v1 a v2. Sesenta y tres fases seguidas en una función que **o pasa
entera o dice en qué paso se rompió**.

Dentro del recorrido se comprueban las dos cosas que más caras salen: que **todo sobrevive a cerrar
y volver** —el tamaño de la plaquita, lo que está oculto y los datos— y que **restaurar un módulo no
toca el otro**.

### 🚨 Y la condición de finalización no se marca a mano
El enunciado pide doce ✅ —funcionalidad, UX, diseño, datos, IA, sincronización, móvil,
accesibilidad, seguridad, rendimiento, recuperación e integración— y la tentación evidente es
escribir doce `true`.

Aquí **cada una se calcula ejecutando la auditoría de su fase**. Si la F63 dice que algo está
abierto, esa casilla **sale roja sola**, y no hay forma de ponerla verde escribiendo.

### 🚨 Y no salen las doce: salen diez
Y eso **es el resultado correcto**, porque el enunciado dice *"no declarar Estilo de hombre
terminado hasta que…"*. Ponerlas verdes le quitaría a la condición su única función.

* **🔴 Sincronización** — no se detectan conflictos entre dispositivos. `app_data` no guarda versión
  ni marca de tiempo, así que **el último en escribir gana** y el otro cambio se pierde sin aviso. Es
  una decisión de esquema, no un fallo de una tarde. Lo dijeron la F41, la F45, la F46 y la F54.
* **🔴 Móvil** — **nadie ha abierto esto en un iPhone.** El simulador de Chromium es lo más cerca que
  se puede estar sin serlo, y no es lo mismo.

Y una que sale verde **con matiz dicho**: la seguridad. Los datos están protegidos por RLS; lo que
sigue abierto es `/api/ask-ai`, que no protege datos sino la factura de la IA (F63).

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **10 822 comprobaciones de Node** (53
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **450 comprobaciones sobre la
aplicación de verdad en Chromium**.

## v2.29.0 — EH Fase 63/65: seguridad, privacidad y control de datos

### 🚨 Y aquí está el hallazgo más caro de todo el proyecto
**`api/ask-ai.js` no pide quién eres.** No tiene autenticación, ni límite de uso, ni comprobaba el
tamaño de lo que le mandan. **Cualquiera que sepa la URL** —`https://…vercel.app/api/ask-ai`— puede
llamarlo desde una terminal y **gastar el dinero de Josué** en la API de Anthropic, todas las veces
que quiera.

No es una fuga de datos: con eso **no se puede leer nada de nadie**. Es una **factura**. Y el
apartado 14 lo pide con estas cuatro palabras: *"autenticación, autorización, límites de uso,
protección de endpoints"*.

**Lo que sí se ha arreglado** (apartado 15, *"no confiar en datos enviados desde el cliente"*):
límites de tamaño para el texto, el contexto y el número de imágenes. Son holgados —el contexto más
largo de la aplicación no llega a 20 000 caracteres— así que **no cambian nada** para Josué, y ponen
un techo a lo que puede costar una llamada.

**Lo que NO se ha hecho desde aquí, y por qué:** poner autenticación afecta a **Nutrición,
Calistenia, Biblioteca y el resto** — ese endpoint lo usan seis módulos más. Hacerlo desde una fase
de Estilo de hombre sería decidir por toda la aplicación, y si se hace mal deja la IA rota en todas.
**El apartado 14 se queda sin cumplir**, con el arreglo escrito, y es una decisión de Josué.

### El resto de la revisión
La **F43** ya había revisado la privacidad. Ésta es la de **seguridad**, y mira sitios que aquélla no
miró:

* **El aislamiento es de la base de datos, no de la pantalla** (apartado 3): las cuatro políticas
  `auth.uid() = user_id`, comprobadas leyendo el `schema.sql`, y **ninguna del tipo permisivo**.
* **Las inyecciones**: ni un `dangerouslySetInnerHTML` en todo el proyecto, y no se escribe SQL. Y
  la tercera —que él le mande instrucciones a la IA— se contesta con honestidad: *"nada lo para, y
  no hace falta: la IA solo le contesta a él"*.
* **Borrar la cuenta no deja nada huérfano**: `on delete cascade` se lleva todas sus claves. Y lo
  que la cascada **no** se lleva —los archivos de Storage— también se dice.
* **Las tres formas de quitar algo** son tres cosas distintas, y solo la irreversible confirma. Y
  **no se hace con un gesto**, que es lo que el apartado 9 prohíbe: no hay gestos desde la F61.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **10 769 comprobaciones de Node** (77
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **450 comprobaciones sobre la
aplicación de verdad en Chromium**.

## v2.28.0 — EH Fase 62/65: accesibilidad y usabilidad avanzada

### Qué se ha construido
*"No buscamos crear una interfaz diferente para accesibilidad. Buscamos que la propia interfaz
principal esté bien construida desde el principio."*

La **F42** ya hizo la primera pasada. Ésta es la segunda, con diecinueve apartados, y **seis ya
estaban contestados**. Así que aquí no se rehace nada de eso: se importa, se comprueba que sigue
verde, y se construye **lo que la F42 no miró**.

### 🚨 Tres detectores nuevos, que leen la pantalla de verdad

**1. Alturas fijas donde va texto.** El apartado 1 pide que subir el tamaño de letra del sistema
*"no corte textos"*, y lo que corta un texto es un `h-[40px]` con una frase dentro. No se ve en el
ordenador de nadie: se ve en el móvil de quien lo necesita. El detector distingue una frase de una
rayita de 2 px, y no salta con los iconos.

**2. Palabras técnicas en pantalla.** `null`, `token`, `JSON`, `timeout`… buscadas **solo en los
textos que ve el usuario** —dentro de una etiqueta o de un `aria-label`—, nunca en el código, donde
`null` es lo normal.

**3. Errores que no explican nada.** El apartado 9 dice que un error debe decir qué corregir, *"no
simplemente: Error"*. Así que "Error", "Ups" y "Algo ha ido mal" están cazados por su nombre.

### ⚠️ Y el apartado 11 se cumple por no haber construido algo
*"Si una acción utiliza swipe, drag o long press, debe existir una alternativa."* No hay ninguna: la
**F50** y la **F61** ya decidieron que todas las acciones viven en botones visibles. Es el único
apartado de las 62 fases que se cumple **porque algo no existe**.

### 🚨 Siete apartados necesitan un móvil y unos ojos
El texto aumentado, el teclado abierto, la orientación, la pantalla pequeña, el uso con una mano,
**el orden de lectura** y la prueba real. Van a **R1** con su motivo — y el 18 con el más claro de
todos: *"esto solo lo dice VoiceOver o TalkBack leyendo la pantalla en voz alta. Ninguna expresión
lo comprueba."*

Fingir que los he probado sería mentir justo en la fase que existe para que la aplicación aguante
configuraciones que no son la mía.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **10 692 comprobaciones de Node** (61
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **450 comprobaciones sobre la
aplicación de verdad en Chromium**.

## v2.27.0 — EH Fase 61/65: acciones rápidas e inteligentes

### Qué se ha construido
*"Si una acción habitual necesita cinco pantallas, está mal diseñada."*

Las **diez acciones** más usadas con su reversibilidad, **qué acciones ofrece cada tipo de
elemento**, el botón + con cuatro opciones y no veinte, y la medida del apartado 17: **1–3 toques
para las frecuentes**.

### 🚨 Los gestos de los apartados 5 y 6 no se construyen, y el 16 explica por qué
El enunciado pide deslizar y mantener pulsado… y **tres apartados más abajo** pide que *"todas las
acciones rápidas puedan utilizarse sin depender exclusivamente de gestos"*. La **F50** ya había
resuelto esa tensión: mover una plaquita se hace **con flechas**, que funcionan con el lector de
pantalla y no dependen del pulso.

Así que aquí se cumple el apartado 16 de la forma más fuerte posible: **la alternativa visible es la
única forma**, y **ninguna acción depende de un gesto**. Un gesto oculto que es la única manera de
hacer algo no es una acción rápida: es una acción escondida.

### 🚨 Y lo que falta se dice, en vez de darlo por cubierto
* **El "Deshacer" de unos segundos (apartado 12) no existe.** Lo que hay es la papelera de treinta
  días — que aguanta mucho más, pero **cuesta tres toques en vez de uno**. No es lo mismo, y decir
  que "ya está cubierto" sería tapar un hueco real.
* **Las acciones en lote (apartado 13) tampoco.** Con el propio apartado diciendo *"solo en módulos
  donde realmente aporte valor"*, y listas de decenas —no de cientos— con papelera detrás, todavía
  no aporta.

### Las otras decisiones

**⚠️ Los toques son los de la F51.** El apartado 17 pide medir cuántos hacen falta; ya están medidos
**contra los componentes reales de la pantalla**. Aquí se importa `RECORRIDOS` y se comprueba el
objetivo: escribir una segunda tabla sería tener dos números para la misma acción.

**⚠️ Una acción se ofrece solo donde sirve.** Un perfume tiene favorito, editar y eliminar; **no**
"crear objetivo" ni "compartir". Enseñárselos es ruido que hay que leer para descartarlo.

**⚠️ Y no se confirma lo que se puede deshacer.** De las diez acciones, **solo una pregunta**: la que
no tiene vuelta atrás. Un aviso delante de cada toque enseña a darle a "Sí" sin leer.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **10 631 comprobaciones de Node** (75
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **450 comprobaciones sobre la
aplicación de verdad en Chromium**.

## v2.26.0 — EH Fase 60/65: recomendaciones contextuales

### Qué se ha construido
*"No queremos que JC Fitness diga simplemente 'aquí tienes una recomendación'. Queremos: 'ahora
mismo esto puede tener sentido para ti'."*

Y la condición de finalización es la fase entera: *"Momento adecuado + contexto adecuado + usuario
adecuado. Si falta alguno: **no recomendar**. La aplicación debe aprender a decir: **no tengo nada
útil que decir ahora**."*

### Las decisiones de la fase

**1. 🚨 Lo normal es no recomendar nada.** `recomendarAhora()` devuelve `{ hay: false }` **con su
motivo** siempre que falte una de las tres condiciones, y eso es la mayoría de las veces. Una fase de
recomendaciones que recomienda siempre no es contextual: es un escaparate.

**2. 🚨 No hay clima ni ubicación, y no se fingen.** El apartado 4 empieza con *"si JC Fitness dispone
de información meteorológica"*: **no dispone**. Y ubicación no hay ninguna. Las dos están en la lista
de fuentes marcadas como inexistentes, con su motivo — y **no se pueden autorizar ni guardándolo a
mano**.

**3. 🚨 Una fuente disponible no es una fuente autorizada.** El apartado 15 lo pide con esas palabras:
*"no utilizar una fuente simplemente porque técnicamente esté disponible"*. Cada fuente tiene **su
interruptor**, y **todos nacen apagados**. El calendario lleva ahí veinte fases; que esté no
significa que Estilo de hombre pueda mirarlo.

**4. ⚠️ Y no se asume nada.** Cada regla declara **qué fuentes necesita** y **en qué ocasiones vale**;
si falta algo, la regla **no se evalúa**, no se estima. La diferencia entre sugerir y adivinar es
exactamente ésa.

**5. ⚠️ Una a la vez, y con descanso.** Si hay cinco candidatas se enseña **la más relevante**, y no
sale otra en dos días. *"No una recomendación cada vez que abre la app"*, literal.

**6. ⚠️ Y guardarla no crea una copia.** Convertirla en objetivo o en tarea usa **los sistemas
globales**, con una acción suya. Aquí no se queda una segunda versión de nada.

### 🐛 Y un fallo pequeño que era justo el de esta fase
`momentoDe(null)` devolvía **"noche"**. `Number(null)` es `0`, y las cero horas caen dentro de la
noche, así que *"no sé qué hora es"* se convertía en *"son las doce de la noche"* — que es
literalmente lo que el apartado 7 prohíbe. Un dato que no está **no es un cero**.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **10 556 comprobaciones de Node** (89
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **450 comprobaciones sobre la
aplicación de verdad en Chromium**.

## v2.25.0 — EH Fase 59/65: resumen semanal y mensual

### Qué se ha construido
*"En unos segundos entender qué ha pasado con tu estilo."*

El resumen periódico: **semanal**, **mensual** o **desactivado**, con sus secciones —lo más
destacado, cambios, tendencias, objetivos y una sugerencia—, su aviso opcional, su historial y la
posibilidad de corregirlo cuando diga algo que no es.

### Las decisiones de la fase

**1. 🚨 Nace apagado, y puede desaparecer del todo.** La condición de finalización lo pide con esas
palabras y el apartado 5 pone `❌ Desactivado` como una de las tres opciones. Así que el valor por
defecto es **desactivado**, y apagado **no se genera**: no es que se esconda, es que no existe. Un
informe semanal que nadie ha pedido es exactamente la *"obligación semanal"* que la condición
prohíbe.

**2. 🚨 Si no ha pasado nada, no se inventa un resumen** (apartado 3, literal: *"no fabricar un
resumen artificial"*). Se dice *"esta semana no hay cambios destacables"* y se acabó. Rellenar con
frases de relleno es lo que hace que el de la semana siguiente tampoco se lea.

**3. ⚠️ El resumen se adapta a cuánto usa la aplicación.** Quien apenas la usa recibe **una
sección**; quien la usa mucho, cinco. No es un detalle de diseño: mandarle cinco apartados vacíos a
alguien que ha entrado dos veces es decirle que lo está haciendo mal.

**4. ⚠️ Los contenidos son los insights de la F58.** Esta fase **agrupa y ordena**; no vuelve a mirar
los datos. Si escribiera sus propias frases acabaría diciendo una cosa en el resumen y otra en la
pantalla — el duplicado más caro de todos: el que se contradice delante del usuario.

**5. ⚠️ Y el historial guarda lo mínimo.** Se guardan **las fechas y los números**, nunca el texto: el
texto se vuelve a componer, y así un cambio de redacción no deja doce resúmenes viejos escritos de
otra manera. Comprobado campo a campo.

### El resumen no depende de la notificación
El apartado 8 lo pide y aquí se cumple de la única forma que vale: `generarResumen()` **no mira el
interruptor del aviso para nada**. El aviso es un extra. Y al revés sí manda: **desactivar el
resumen apaga el aviso**, porque no se avisa de algo que no se genera — ni guardándolo a mano.

### Y si dice algo que no es, se corrige
`corregirResumen()` apunta esa interpretación y **no se vuelve a repetir**, que es exactamente lo que
pide el apartado 13. Compartir, en cambio, **no existe**: JC Fitness no tiene sistema de
compartición, y queda escrito que el día que lo tenga será **solo con una acción suya, nunca
automáticamente**.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **10 467 comprobaciones de Node** (86
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **450 comprobaciones sobre la
aplicación de verdad en Chromium**.

## v2.24.0 — EH Fase 58/65: insights y resúmenes inteligentes

### Qué se ha construido
*"No queremos llenar Estilo de hombre de gráficas. Queremos que el usuario pueda entrar y entender
rápidamente: qué está haciendo → qué ha cambiado → qué podría mejorar."*

**Seis tipos de insight** —resumen, cambio destacado, hábito, tendencia de gustos, objetivo y
sugerencia—, cada uno con **cuántos registros necesita para existir**, un periodo (semana, mes, 3
meses o personalizado) y a qué apartado lleva.

### Las decisiones de la fase

**1. 🚨 Si no hay datos, no hay conclusión.** El apartado 9 lo dice sin rodeos: *"nunca fabricar
conclusiones"*. Cada tipo declara su **mínimo**, y por debajo **no se enseña**: se enseña la frase
del apartado 18. Con dos registros no sale ni uno. Un insight inventado con dos datos es lo que hace
que el usuario deje de creerse los otros cinco.

**2. ⚠️ Pocos y cortos, contados y medidos.** Máximo **tres a la vez** y **140 caracteres** por
insight, comprobado sobre los generados —no sobre una intención—. Es lo que separa *"esto me sirve"*
de *"¿para qué necesito saber esto?"*.

**3. ⚠️ Y no aparece uno cada vez que abre.** Hay un descanso de tres días **por tipo**: la fatiga de
información no se arregla escribiendo mejor, se arregla **apareciendo menos**.

**4. 🚨 Una comparación no puede sonar a reproche.** El apartado 17 pide evitar la presión
innecesaria, así que hay una lista de palabras que **no pueden aparecer** —"deberías", "has
empeorado", **"solo has"**, que es la que se cuela sin querer— y una comprobación que las busca en
los textos generados. Un cambio se cuenta con **"más" y "menos"**, nunca con "mejor" y "peor": es un
número, no una nota.

**5. ⚠️ Los números salen de la F35.** El catálogo de lo medible es `METRICAS_PROGRESO`, con sus
fuentes y sus fechas. Esta fase **compara dos ventanas de tiempo** sobre ese catálogo; una segunda
lista de métricas acabaría diciendo algo distinto que la pantalla de Progreso.

**6. ⚠️ Y lo que depende de sus gustos respeta el interruptor de la F56.** Contar cuántas rutinas ha
hecho es **un hecho suyo** y se enseña siempre. Deducir que *"tus últimas elecciones se concentran
en…"* es personalización, y **sin permiso no se genera** — y queda dicho que es por el permiso, no
por falta de datos.

### Y ocultar un insight no borra nada
Se puede ocultar uno, o decir *"no mostrarme más de esto"*. En los dos casos **sus registros siguen
intactos**, y hay una comprobación que los cuenta antes y después. La portada tampoco se llena de
📊: las gráficas siguen en Progreso, y solo si él entra.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **10 381 comprobaciones de Node** (73
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **450 comprobaciones sobre la
aplicación de verdad en Chromium**.

## v2.23.0 — EH Fase 57/65: aprendizaje y personalización progresiva

### Qué se ha construido
*"No queremos que el usuario tenga que rellenar 50 formularios. Utilizar lo que el usuario hace para
mejorar las sugerencias. Siempre con control."*

El sistema que aprende de lo que él hace: **siete señales** con su peso, **la confianza** (baja →
media → alta), **la pregunta** de cuando hay bastante evidencia, **la contradicción** entre lo que
dice y lo que hace, y **su panel** para revisar, corregir y borrar lo aprendido.

### Las decisiones de la fase

**1. 🚨 Sin el interruptor de la F56 aquí no se aprende NADA.** No "se aprende pero no se usa": no se
toma la nota. `aprender()` devuelve el estado tal cual, y ni con veinte señales seguidas cambia. Un
sistema que sigue apuntando cosas de alguien que ha dicho que no es justo lo que el apartado 16
prohíbe.

**2. 🚨 Lo que él dice vale más que lo que yo deduzca.** El apartado 2 lo pide, y aquí no es un
número más alto: es que **ni treinta señales pisan** una preferencia que él escribió. Si dijo que no
le gustan los dulces y luego guarda dulces, el sistema **pregunta** —*"¿ha cambiado tu
preferencia?"*—, no cambia.

**3. ⚠️ Lo reciente pesa más, pero lo viejo no se borra.** Cuatro ventanas de tiempo con factor 1 →
0,6 → 0,3 → **0,1**. Nunca cero: borrarlo del todo sería olvidar lo que pasó, y que mandara sería lo
que el apartado 6 prohíbe.

**4. ⚠️ Una sospecha no es una verdad.** Lo inferido nace como *posible* preferencia y solo se
convierte en preferencia cuando él contesta que sí. Con **tres** respuestas, no dos: sí, no, y **no
volver a preguntar** — que se guarda y **se respeta aunque llegue más evidencia**.

**5. 🚨 Borrar lo aprendido no borra sus datos.** Se van las deducciones; sus perfumes, sus rutinas y
sus registros **no se tocan**, y hay una comprobación que los cuenta antes y después. Borrar también
lo que él dijo a mano se puede, pero **hay que pedirlo aparte**.

**6. ⚠️ Y no se perfila a nadie.** Seis cosas que **no se deducen nunca** —cómo es, cómo está de
ánimo, cuánto dinero tiene, su salud, con quién queda, qué opina de su cuerpo—, y una comprobación
que manda señales a propósito para intentar deducirlas y falla. Los campos privados de la F43
tampoco entran.

### 🐛 Y por segunda vez, un rojo falso en la verificación
La pasada completa se puso roja en la sección de Sonrisa y el archivo ejecutado solo pasaba entero.
Otra vez el mismo patrón: con diez mil comprobaciones de Node por delante la máquina va cargada, el
primer `pulsar('Más')` no encontraba el botón porque la pantalla aún no estaba pintada, y **toda la
sección siguiente caía en cascada** — doce rojos por una llamada que llegó pronto.

Esta vez se ha arreglado **donde tocaba**: `pulsar` ahora **espera a que el botón aparezca**, con un
tope. Un usuario tampoco pulsa un botón que no se ha pintado todavía: espera a que salga. Y como el
arreglo está en la función, vale para las **setenta** llamadas, no para una.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **10 308 comprobaciones de Node** (91
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **450 comprobaciones sobre la
aplicación de verdad en Chromium**.

## v2.22.0 — EH Fase 56/65: integración profunda con la IA

### Qué se ha construido
*"La IA aconseja. El usuario decide. Nada debe convertirse automáticamente en una obligación."*

Cómo la IA puede usar Estilo de hombre: **el interruptor** del apartado 12, **el contexto** que se
manda (solo lo de la pregunta), **las cinco cosas que la IA no puede hacer** y **cómo propone** sin
aplicar nada sola.

### 🚨 Esta fase toca una decisión de la F43, y conviene ver por qué no la rompe
La **F43** dejó `estiloHombre` **fuera de `currentState`** a propósito: es la única clave de la
aplicación que no viaja a la IA, y allí está escrito como decisión, no como olvido. Esta fase pide
lo contrario… salvo que el apartado 12 exige un interruptor.

Así que la regla de la F43 **se mantiene como valor por defecto**: `contextoParaIA()` devuelve
**`null`** mientras el interruptor esté apagado. No devuelve menos datos: devuelve **nada**. Y
`estiloHombre` **sigue fuera de `currentState`** — hay una comprobación que lee `App.jsx` para que
esa puerta no se abra sola.

### 🚨 Y lo privado no sale ni con el interruptor encendido
El tipo de piel y su sensibilidad llevan `paraIA: false` desde la **F13** y están en
`CAMPOS_PRIVADOS` desde la F43. El interruptor del apartado 12 **no los desbloquea**: son otra cosa.
El contexto los omite y **dice cuántos ha omitido**, para que la ausencia se lea como deliberada y no
como un dato que falta.

### Las decisiones de la fase

**1. 🚨 El interruptor nace apagado.** Un "por defecto sí, con opción de apagarlo" habría mandado sus
rutinas y sus perfumes a un servidor sin que él lo pidiera nunca.

**2. ⚠️ No se manda todo cada vez.** El contexto se pide **para algo** —un perfume, una rutina, el
estilo— y sale solo lo de ese algo. Preguntar por un perfume no manda su seguimiento de la piel, y
la pregunta abierta manda **el resumen**, no el contenido de todo.

**3. ⚠️ Aprender de los rechazos ya estaba hecho.** El `motorRecomendaciones` guarda el feedback,
silencia lo descartado y sabe deshacerlo desde la **F16**. Se **usa**, no se reescribe: dos memorias
de gustos acabarían dando dos opiniones distintas de la misma aplicación.

**4. ⚠️ La IA no hace nada sola.** Comprar, crear objetivos, cambiar preferencias, borrar y tocar la
configuración: cinco cosas prohibidas, y no como advertencia en un comentario sino como una lista
que se puede preguntar —`puedeLaIA('eliminar')` → false, con su motivo—. Lo que sí puede es
**proponer**, con dos botones… y **"No guardar" es el que está por defecto**.

### 🐛 Y por quinta vez: una declaración no es una violación
El detector de campos privados miraba el contexto entero y cazaba `privadosOmitidos` —que es
justamente la lista de lo que **no** se manda— y decía que se estaba filtrando el tipo de piel. La
F48 arregló esta misma confusión tres veces y la F49 una cuarta. Ahora mira **solo la parte que
viaja**.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **10 217 comprobaciones de Node** (90
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **450 comprobaciones sobre la
aplicación de verdad en Chromium**.

## v2.21.0 — EH Fase 55/65: escalabilidad y futuras funciones

### Qué se ha construido
*"Añadir funciones sin tener que reconstruir lo que ya funciona."*

Esta fase no añade una función: **comprueba que se puedan añadir**. Y aquí eso no es una promesa
arquitectónica, son **siete sitios concretos donde se escribe una línea** y la aplicación entera se
entera sola: un módulo, una categoría, una preferencia, una línea de plaquita, un acceso rápido, una
colección de la papelera y una migración. Cada uno trae **la línea que hay que escribir** y **lo que
NO hay que tocar**.

Y hay una comprobación que lee la vista buscando un `case` por módulo: si hiciera falta uno, el
punto de extensión estaría mintiendo.

### 🚨 El backlog se deriva, no se escribe
Los apartados 15 y 16 piden un backlog con idea, prioridad, motivo, dependencias y estado. En vez de
una lista nueva —que se queda vieja el mismo día—, `backlog()` **sale de lo que las fases anteriores
ya han pospuesto**: el `SE_POSPONE` de la F48, lo que la F54 declaró que falta, y el fallo a medias
de la F52.

Y de las once entradas, **una sola es 🔴 imprescindible**, que además es la única que sale de un
fallo y no de una idea: **enseñar el aviso cuando falla al guardar**. `saveData` ya devuelve el error
desde la F52, pero nadie lo mira, así que el usuario sigue creyendo que se guardó. Las que dependen
de la decisión de esquema salen **bloqueadas**, no pendientes, diciendo de qué dependen.

### ⚠️ La prueba de crecimiento se ejecuta, pero no miente sobre hasta dónde
El apartado 17 pide *"5 → 10 → 20 → 30 módulos"*. El catálogo tiene **diecisiete**, así que se mide
de verdad hasta ahí — y lo que se comprueba es lo que de verdad importa a los 30: **que el coste
crezca en línea recta y no al cuadrado**. Una plaquita por módulo en los tres tamaños, ninguna
sección por encima de ocho, ni una plaquita huérfana. Inventarme trece módulos de mentira para poder
decir "probado con 30" habría sido un número bonito sobre datos falsos.

### Y crecer tiene freno
Las tres preguntas del apartado 14 son una función, `evaluarFuncion()`, con una lectura que importa:
si **duplica** algo, la respuesta no es "no", es **integrar**; si **complica** la interfaz, es
**replantear**. Solo el *"no aporta valor"* se contesta con un no — y se contesta el primero, porque
algo que no aporta no merece ni la conversación sobre si duplica.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **10 127 comprobaciones de Node** (92
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **450 comprobaciones sobre la
aplicación de verdad en Chromium**.

## v2.20.0 — EH Fase 54/65: backup, restauración y recuperación avanzada

### Qué se ha construido
*"Un error nunca debería convertirse automáticamente en una pérdida irreversible de información."*

La condición de finalización pide **cuatro niveles** de recuperación, y tres ya existían. El que
faltaba —y es el que trae esta fase— es el tercero:

1. 🗑️ **Un elemento** → la papelera global. Existía (ME F3).
2. 🔄 **La configuración** → restablecer diseño y estilo. Existía (F31 y F36).
3. ♻️ **Un módulo entero** → **`restaurarModulo()`, nuevo.**
4. ☁️ **Todo** → `restaurarTodo()`, con aviso y confirmación.

Y dos cosas más que el enunciado pide y no había: **validar antes de importar** (apartado 15) y
**dejar registro de lo que se recupera** sin datos personales (18).

### 🚨 Restaurar un apartado no puede tocar a los demás
*"Si solo se ha perdido un perfume, no obligar a restaurar toda JC Fitness."* `restaurarModulo`
devuelve **la `config` de un solo módulo** y deja el resto exactamente como estaba. Y hay un detalle
que importa más de lo que parece: **`activo`, `oculto` y `orden` son de AHORA, no de la copia**. Si
él apagó ese apartado ayer, recuperar sus rutinas **no vuelve a encenderlo** — restaurar datos y
cambiar la pantalla son dos cosas distintas.

### ⚠️ Y la restauración está PROBADA, no solo escrita
El apartado 16 lo dice con todas las letras: *"no basta con crear backups; hay que comprobar que
realmente pueden restaurarse"*. `ensayoDeRestauracion()` hace el recorrido entero —datos de prueba →
copia → romper → restaurar— y comprueba **las dos cosas**: que lo perdido vuelve y que **el otro
apartado no se ha movido**.

### Lo que NO existe, dicho con su nombre
**Cinco apartados dependen de algo que esta aplicación no tiene**, y ninguno se marca como hecho:

* **No hay sistema global de copias** (1 y 2). El propio enunciado empieza con *"cuando exista el
  sistema global"*, y prohíbe expresamente *"crear un sistema de backup completamente separado"*.
  Así que aquí **no se construye uno**.
* **No hay historial de versiones** (9). *"Hoy 19:30 · Ayer 22:10"* exige guardar las versiones
  anteriores, y `app_data` tiene **una fila por (usuario, clave)**: no hay dónde ponerlas.
* **No se detecta el conflicto entre dispositivos** (11 y 12). El último en escribir gana, y el otro
  cambio se pierde sin aviso. Es la decisión de esquema que la F41 dejó abierta y que la F45, la F46
  y ahora la F54 se han vuelto a encontrar.

### ⚠️ Y la puerta de importar no existe: esto es la cerradura
`validarCopia()` comprueba que sea de este módulo, de una versión que se entienda y con la forma
correcta, y **no devuelve el estado si no pasa** — así nadie puede escribir por error lo que acaba
de fallar la validación. Se construye ahora porque el día que alguien haga la pantalla, el camino
corto será `saveData(uid, 'estiloHombre', JSON.parse(texto))`, y con un `saveData` que
**sobrescribe** eso es perderlo todo de una vez.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **10 035 comprobaciones de Node** (97
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **450 comprobaciones sobre la
aplicación de verdad en Chromium**.

## v2.19.0 — EH Fase 53/65: documentación técnica y mantenimiento

### Qué se ha construido
*"Si dentro de meses queremos modificar Estilo de hombre, Claude debe poder entender rápidamente
cómo funciona sin rehacer todo el análisis."*

**`docs/08_ESTILO_DE_HOMBRE_TECNICO.md`**: la memoria técnica del módulo, con los dieciocho
apartados del enunciado. Qué hace y qué no hace, el mapa de módulos, las doce dependencias
globales, dónde vive cada dato, los cuatro estados, cómo se elimina, la estructura, las
migraciones, los componentes que se reutilizan, las reglas de diseño y de UX, las notificaciones,
la privacidad, las pruebas, el historial, el backlog, la regla para quien venga después y el manual
de mantenimiento.

### 🚨 Y lo que hace que no se quede viejo
El apartado 2 pide *"y mantenerlo actualizado"*, y esa frase, sin nada que la obligue, no se cumple
nunca. Así que **el documento se genera desde el código**: `scripts/generar-doc-eh.mjs` lo escribe
a partir de `src/lib/documentacionEH.js`, y **cinco apartados se derivan directamente** —el mapa de
`MODULOS_EH`, las fuentes de `FUENTES_GLOBALES`, los estados de `ESTADOS_GESTION` más la papelera,
las migraciones de la F46 y el backlog del `SE_POSPONE` de la F48—.

Y hay **una prueba que abre el `.md` de verdad** y comprueba que están los diecisiete módulos, las
doce dependencias, los cuatro estados, las seis reglas de UX, los seis componentes y las cuatro
preguntas de mantenimiento. Si alguien añade un módulo y el documento no lo recoge, **la
verificación se pone roja**.

### 🐛 Y otra vez el mismo fallo del detector que solo caza lo que ya conocía
La comprobación de la **F48** —*"ninguna librería de Estilo de hombre se queda fuera de la lista que
auditan la F43 y esta"*— saltó con `documentacionEH`… y **solo con ésa**. Su expresión busca nombres
que acaban en `EH` o en `Estilo`, así que `coherenciaVisual`, `microinteracciones`, `experienciaReal`
y `produccion` **llevaban cuatro fases invisibles**: ni la auditoría de privacidad ni la de
duplicados las miraba, y su silencio parecía un aprobado. Las cinco están ya en `LIBRERIAS_EH`, y la
expresión las nombra.

### Las decisiones de la fase

**1. 🚨 La documentación se deriva del código, no se escribe al lado.** Nada se teclea dos veces.

**2. ⚠️ Y hay una prueba que lee el documento.** Un documento técnico que nadie comprueba es una
foto de cómo era el proyecto el día que se escribió.

**3. ⚠️ Lo que NO se usa también se documenta, con su motivo.** El apartado 3 pide listar doce
sistemas globales y Estilo de hombre usa diez: los **favoritos** (no hay sistema global; cada módulo
tiene los suyos) y el **Diario** (ninguna fase ha pedido el puente) están en la lista marcados con
❌ y su porqué. Decir solo los que sí deja al siguiente preguntándose si fue un olvido.

**4. ⚠️ Y ningún componente nombra algo que no existe.** El apartado 9 pide listar los reutilizables,
y **no hay un componente de modal común**: lo que hay es la regla invariante de `createPortal`. Está
escrito así, en vez de inventar un `ModalPortal` que mandaría al siguiente a buscar lo que no está.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **9 938 comprobaciones de Node** (98
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **450 comprobaciones sobre la
aplicación de verdad en Chromium**.

## v2.18.0 — EH Fase 52/65: preparación para producción

### Qué se ha construido
*"De 'funciona en desarrollo' a 'está preparado para entrar en la JC Fitness real'."*

Una fase de publicar no se construye: **se comprueba**. Y lo incómodo es que la mitad de lo que el
enunciado da por hecho —tres entornos, monitorización, despliegue gradual— **no existe en este
proyecto**, y la otra mitad solo la puede hacer Josué con su móvil y su cuenta. Así que hay
`src/lib/produccion.js` con lo que hay de verdad y lo que falta, y **`PUBLICAR.md`**: la lista de
antes de pulsar publicar, escrita para él.

### 🚨 Y encontró un fallo de los que no se ven
Mirando el apartado 12 —*"comprobar que el usuario puede continuar o recuperarse"*— salió esto:
`saveData` **se tragaba el error** con un `console.error` y no devolvía nada. Sin conexión, con el
servidor caído o con una política de RLS mal puesta, **la aplicación seguía como si se hubiera
guardado**, y el usuario se enteraba al volver y no encontrar su cambio.

El estado `error_guardado` existe desde la F41 marcado como **`detectable: false`**, y ahora se sabe
por qué: no había forma de detectarlo. Desde esta versión `saveData` **devuelve `{ ok, error }`**,
sin lanzar, así que las decenas de llamadas que ya existen funcionan igual.

⚠️ **Y el aviso sigue sin encenderse en pantalla, así que `error_guardado` sigue en
`detectable: false`.** Marcarlo como resuelto por haber arreglado la mitad sería fingir un aviso que
nadie enciende — la regla 8 del proyecto.

### Las decisiones de la fase

**1. 🚨 No hay entorno de pruebas, y se dice en la primera línea.** El apartado 1 pide tres entornos y
prohíbe *"probar migraciones destructivas directamente sobre producción"*. Aquí hay **un** proyecto
de Supabase. Las vistas previas de Vercel apuntan **a la misma base**: no son un entorno de pruebas,
son producción con otra URL. Lo que lo sustituye —y por eso no es opcional— es la **copia de
seguridad de la F46**.

**2. ⚠️ La lista de publicación no se marca sola.** Las once líneas del apartado 15, cada una con
**cómo se comprueba**: siete con un comando, cuatro con el móvil de Josué. Las cuatro **no se marcan
aquí**, ni siquiera "porque seguramente funcionen".

**3. ⚠️ Estilo de hombre no necesita ni una línea de SQL.** Sesenta y cinco fases y **cero cambios de
esquema**. Así que el apartado 3 es un inventario de lo que ya hay —una tabla, cuatro políticas con
`auth.uid() = user_id`, cinco buckets privados—, comprobado **contra el `schema.sql` de verdad**, no
contra una tabla que yo escriba.

**4. ⚠️ El plan de vuelta atrás son pasos, no una promesa.** Cuatro, con su herramienta: *Instant
Rollback* de Vercel, `git revert`, `restaurarCopia()` de la F46, y la base de datos —que no hace
falta tocar porque no se toca.

**5. ⚠️ Y la monitorización no existe.** El *"si JC Fitness dispone"* del enunciado tiene respuesta, y
es que no. Añadir un servicio externo significa mandarle datos, y eso se decide, no se cuela en la
última fase antes de publicar. La regla para el día que se añada ya está escrita: nada privado.

### 🐛 Y un detalle del esquema que muerde
Los `create policy` de `supabase/schema.sql` **no llevan `if not exists`**: volver a ejecutar el
archivo entero da error de política duplicada. Está comprobado sobre el archivo, no supuesto, y
queda avisado donde se lee.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **9 840 comprobaciones de Node** (78
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **450 comprobaciones sobre la
aplicación de verdad en Chromium**.

## v2.17.0 — EH Fase 51/65: control de calidad de la experiencia real

### Qué se ha construido
*"Hasta ahora hemos comprobado que las funciones existen y funcionan. Ahora toca comprobar algo
diferente: ¿se siente bien utilizar Estilo de hombre en el día a día?"*

Las cincuenta fases anteriores preguntaban *"¿funciona?"*. Ésta pregunta **"¿cuánto cuesta usarlo?"**,
y eso sí se puede medir: **los doce recorridos** con sus toques, **las siete preguntas** de *"¿dónde
está esto?"*, **los tres perfiles** —el que enciende dos apartados, el que los enciende todos y el
que no enciende ninguno—, **las siete cosas que él personaliza**, **los seis resbalones** y **las
cinco cosas que debe saber siempre**.

### 🐛 Y lo primero que encontró fue un rojo falso
Las comprobaciones del primer uso (F40) **fallaban en la pasada completa y pasaban al ejecutar su
archivo solo**. No era una regresión: la prueba esperaba **800 milisegundos fijos** a que apareciera
una pantalla, y con las 9 671 comprobaciones de Node por delante la máquina va más cargada y no
llegaba a tiempo. Doce comprobaciones en rojo, ninguna rota.

Un rojo falso es peor que no tener la prueba: manda a quien lo lea a buscar una regresión que no
existe, y enseña a desconfiar de la verificación entera. Ahora hay `esperarTexto()`, que **espera a
que el texto aparezca** con un tope; si de verdad no llega, sigue fallando.

### Las decisiones de la fase

**1. ⚠️ Un recorrido se mide contra la pantalla de verdad, no contra un número que yo escriba.**
Sería facilísimo poner `toques: 2` en una tabla y declarar la fase superada. Cada paso nombra **el
componente real** que abre —`PerfumesEH`, `GestionarApartados`— y hay una comprobación que los busca
en `EstiloHombreView.jsx`. Un recorrido que mienta sobre por dónde pasa no pasa la fase.

**2. ⚠️ La prueba de permanencia (apartado 8) se hace, no se declara.** Cada cosa personalizable trae
**la función que la cambia y la que la lee**, y la prueba la cambia de verdad, la pasa por `JSON`
—que es lo que hace `saveData`— y la vuelve a leer. Es **la regla 5 del proyecto convertida en
prueba**: el campo que el normalizador no conozca, aquí se cae. Las siete sobreviven.

**3. ⚠️ Y el límite se escribe antes de medir.** Una acción de todos los días, 3 toques; una de vez
en cuando, 4; una de configurar una vez, 5. Puesto por lo que es la acción, no por lo que salió al
medirla. El día que alguien meta una pantalla intermedia, la prueba se pone roja sola.

**4. 🚨 Cuatro apartados necesitan una persona, y se dicen.** El primer día, el tercer día, varios
días de notificaciones y —sobre todo— el 19: *"dar Estilo de hombre a alguien que no haya leído
ninguna de estas fases"*. **Yo las he leído todas: soy justo el único que no puede hacer esa
prueba.** Van a R1 con su motivo, y **quedan fuera del veredicto**: contarlas como verdes sería la
mentira exacta que esta fase existe para no contar.

**5. ⚠️ Y dos ya estaban contestados.** La coherencia con el resto de la aplicación (16) la contestó
la **F49** comparando vocabulario, y *"¿realmente hace falta?"* (17) la contestó la **F48** con su
`SE_POSPONE`. Se **importan**, no se rehacen: una segunda respuesta a la misma pregunta es
exactamente el duplicado que la F48 vino a cazar.

### Lo que se midió, y lo que salió
* **Ni un recorrido se pasa de su límite.** Marcar un favorito y abrir la rutina, dos toques; añadir
  un perfume, tres.
* **El toque de más del apartado que aún no se usa** —*"¿Quieres utilizar este apartado?"*— **no es un
  fallo**: es la puerta de la F13, y se paga una vez, no cada día.
* **Con dos apartados encendidos la pantalla no se ve vacía**, y con los diecisiete se reparte en
  siete secciones sin que ninguna pase de seis plaquitas.
* **Y con ninguno encendido no hay pantalla en blanco:** hay `sin_modulos`, con el texto de la F25.
* **Quitar la tarjeta de Descubrir cuesta un toque y recuperarla, tres.** Asimétrico a propósito, y
  apuntado como 🟢 mejora en vez de escondido.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **9 762 comprobaciones de Node** (91
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **450 comprobaciones sobre la
aplicación de verdad en Chromium** (3 nuevas).

## v2.16.0 — EH Fase 50/65: microinteracciones y animaciones

### Qué se ha construido
*"Cada acción debe tener una respuesta visual clara, rápida y elegante."*

Las **veinticuatro microinteracciones** del enunciado, cada una con **dónde vive** y **para qué
sirve** —confirmar, orientar, conectar o suavizar—, y el **revisor de consistencia** que comprueba
lo que el apartado 22 pide con esas palabras: *"una misma acción debe comportarse igual en todo
Estilo"*.

### ⚠️ Arrastrar no se construye, y se dice por qué
Los apartados 2 y 3 piden **mantener pulsado y arrastrar** para mover una plaquita. Eso **ya está
resuelto con flechas ↑↓** desde la Personalización (Prompt Maestro F19 y ME F2) — y las flechas
funcionan con el lector de pantalla y no dependen del pulso. Añadir arrastre encima sería **un
segundo mecanismo para la misma acción**, que es justo lo que la F48 acaba de terminar de quitar.
Se declara con su motivo, junto a los deslizantes (16), que no existen porque en Estilo de hombre
no hay nada continuo que configurar: son listas y casillas.

### Lo que el revisor protege

**1. ⚠️ El feedback al tocar es el de JosStyle, no uno propio.** Los `active:scale` viven en
`ui.jsx` y la vista de Estilo de hombre **no tiene ni uno**. Por eso tocar una plaquita se siente
igual que tocar cualquier otra cosa de la aplicación, y hay una comprobación que falla si alguien
se escribe el suyo.

**2. ⚠️ Y la escalera de escalas es deliberada.** `0.96` en las tarjetas grandes, `[0.98]` en las
filas, `95` en los botones y `90` en los iconos pequeños: cuanto más pequeño es el elemento, más se
nota el apretón. Queda **declarado para que nadie lo "arregle"** dejándolo todo igual.

**3. ⚠️ Volver es siempre lo mismo:** **cincuenta y un** botones idénticos, `ArrowLeft size={16}`
con `aria-label="Volver"`. La comprobación cuenta los dos y falla si se separan.

**4. ⚠️ Y el ✓ de "hecho" es uno solo**, con la duración de la F41. Un `setTimeout` con otro
número sería un segundo feedback.

### 🐛 Y una expresión que no cazaba nada
La regla del feedback buscaba `setTimeout\([^)]*…` — y **el propio `setTimeout` lleva un `)`
dentro** (`setTimeout(() => algo(), 3000)`), así que la búsqueda se paraba antes de llegar al
número. Lo destapó la comprobación de la comprobación, que es exactamente para lo que está.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **9 671 comprobaciones de Node** (38
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **447 comprobaciones sobre la
aplicación de verdad en Chromium**.


## v2.15.0 — EH Fase 49/65: revisión visual final y coherencia

### Qué se ha construido
*"Que tenga personalidad propia, pero que siga pareciendo JC Fitness."*

El revisor visual. Y con una idea que hace que **no se quede viejo**: aquí no se declara cómo debe
verse Estilo de hombre —eso caduca en dos fases—, sino que **se compara su vocabulario visual con el
del resto de JosStyle** y se falla si inventa algo que no usa nadie más. El día que el Dashboard
cambie de radio, esto no se queja; el día que Estilo de hombre se invente uno, sí.

### 🐛 Y encontró un fallo de contraste de verdad
Cuatro botones de Estilo de hombre pintaban su texto con **`color: '#fff'` escrito a mano** sobre el
color de acento. El resto de la aplicación usa `COLORS.textOnAccent`, que **no es blanco**: es lo que
`bestReadableText()` calcula para que el texto se lea sobre el acento que Josué haya elegido — negro
si el acento es claro. Con un acento amarillo o verde lima, esos cuatro botones eran **blanco sobre
claro**.

No lo veía nadie: la regla invariante del proyecto busca hex de **seis** dígitos, y `#fff` tiene
tres. Ahora los cuatro usan el token, como los demás.

### 🐛 Y cuatro veces la misma confusión: un ejemplo no es una violación
Esta fase y la anterior se han pasado la mitad del tiempo enseñándole a los revisores a no cazarse
entre ellos. `coherenciaVisual.js` guarda `ejemploMalo: "style={{ color: '#ff0000' }}"` para
comprobar que su propia regla funciona — y **la regla invariante del proyecto lo contó como un color
suelto**. Ya está excluido, igual que `prohibido:` en la regla del audio.

### Las decisiones de la fase

**1. ⚠️ La referencia son las otras vistas, no una lista mía.** `soloEn()` saca el vocabulario de las
dos partes y devuelve lo que solo aparece en una. Sin listas de valores permitidos que mantener.

**2. ⚠️ Se compara la familia, no el lado.** `rounded-t-3xl` —la hoja inferior— y `rounded-3xl` son
el mismo lenguaje: lo que importa es el tamaño del radio, no la esquina. Sin esa normalización, el
revisor habría cazado la única hoja inferior de la aplicación, que hace exactamente lo mismo que las
demás.

**3. ⚠️ Y lo que solo usa Estilo de hombre, con permiso.** `-m-1.5` aparece únicamente aquí porque
lo introdujo la **F42**: un margen negativo que lleva el área táctil a 44 píxeles **sin cambiar el
dibujo**. Está declarado como excepción **con su motivo**, en vez de ensanchar la comparación hasta
que no encuentre nada.

**4. ⚠️ Un spinner sí puede girar.** La regla de *"nada espectacular por sí mismo"* prohíbe lo
decorativo —`animate-ping`, `bounce`, `pulse`—, no el indicador de carga: uno que no gira no es un
indicador de carga.

**5. ⚠️ Y dos apartados necesitan ojos** (16 y 19): los tres tamaños de pantalla y comparar Estilo de
hombre con el Dashboard uno detrás de otro. Van a **R1**, con su motivo. El modo oscuro sí se
comprueba por código —ni un color literal, ni un hex suelto— y se dice que **verlo** sigue siendo
cosa suya.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **9 633 comprobaciones de Node** (41
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **447 comprobaciones sobre la
aplicación de verdad en Chromium**.


## v2.14.0 — EH Fase 48/65: auditoría final de funciones y duplicados

### Qué se ha construido
*"Así evitamos que dentro de seis meses tengamos tres calendarios, dos papeleras, cuatro sistemas de
favoritos y cinco formas distintas de hacer lo mismo."*

La revisión completa: **los quince sistemas** del apartado 3 clasificados uno a uno con las cuatro
etiquetas del enunciado —🟢 propio, 🔵 global, 🟠 integrado, 🔴 duplicado—, **las cuatro listas** del
apartado 20 y **la respuesta del apartado 22**: qué hace exactamente Estilo de hombre, y qué no hace
porque ya lo hace JosStyle.

### 🔴 "SE ELIMINA" está vacía, y no es un descuido
No hay ni un duplicado que quitar. Las fases anteriores fueron quitándolos según aparecían: la
papelera propia (F15), el segundo inventario (F17), el segundo motor de rutinas (F14), el de reglas
(F16), el calendario propio (F21) y el tercer sitio donde juntar productos (F22). Cuando llega la
auditoría final **ya no queda nada**, y ese es el resultado.

### 🐛 Lo que sí encontró: cinco librerías que no miraba nadie
`LIBRERIAS_EH` —la lista sobre la que corren la auditoría de privacidad (F43) y la de duplicados de
esta fase— **se había quedado sin las cinco librerías de las fases de revisión**: `rendimiento`,
`estructuraDatos`, `migracion`, `pruebasIntegrales` y `auditoriaFinal`. Una librería que no está en
esa lista **no la revisa nadie**, y su silencio parecía un aprobado. Lo encontró la comprobación que
compara la lista con lo que hay de verdad en `src/lib`.

### 🐛 Y al añadirlas, los revisores empezaron a cazarse entre ellos
Tres veces seguidas, la misma confusión: **una regla no es código**.

- `auditoriaFinal.js` guarda el patrón de `new Audio(` para **buscarlo**, y saltó la regla invariante
  *"el audio solo se toca en audioEngine.js"*.
- `privacidadEstilo.js` guarda los patrones de secretos, y **se denunciaba a sí mismo**.
- `rendimiento.js` **explica en una cadena de texto** dónde vive el guardado, y saltó la regla de
  *"ninguna librería llama a `saveData`"*.

Ahora hay **dos limpiadores, y no uno**: `soloCodigo` —sin comentarios, sin reglas y **sin textos**—
para los sistemas duplicados, y `sinReglas` —que **conserva las cadenas**— para los secretos, porque
una clave filtrada vive justo dentro de una cadena y borrarlas dejaría pasar lo único que se busca.
Duodécima vez que una comprobación de este proyecto salta con algo que estaba bien, y la primera en
la que arreglarla de la forma fácil habría roto otra.

### 🐛 Y una regla mal escrita
La primera versión del revisor buscaba `crearPrenda(` como señal de un armario paralelo — y eso es
una **llamada** a la fábrica del Armario, que es exactamente lo que hay que hacer (F26). Saltaba con
`accesorios.js`, que hace lo correcto. Lo que sería un duplicado es **definirla aquí**.

### Las decisiones de la fase
**1. ⚠️ No se añade nada** (apartado 21, con esas palabras). Lo que se le ocurra a alguien va a
`SE_POSPONE`, donde ya están los favoritos globales, el puente con el Diario, los conflictos entre
dispositivos, el catálogo de productos y los archivos de audio — cada uno con su motivo.

**2. ⚠️ Cada cosa tiene un dueño, y se comprueba sobre el código.** No basta con decir que el
calendario es global: hay un revisor que lee las **cincuenta librerías** y falla si alguna monta el
suyo.

**3. ⚠️ Un icono por cosa** (apartado 12): ni dos módulos con el mismo, ni una plaquita repitiendo el
de su módulo.

**4. ⚠️ Y lo que no aporta, fuera** (apartados 17 y 18): cada estadística dice de qué módulo es y
ninguna guarda un contador; **todos los avisos nacen apagados**, porque menos notificaciones es mejor
experiencia.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **9 592 comprobaciones de Node** (43
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **447 comprobaciones sobre la
aplicación de verdad en Chromium**.


## v2.13.0 — EH Fase 47/65: pruebas integrales

### Qué se ha construido
*"No sirve de nada tener 50 funciones si dos se rompen al conectarlas."*

Las **treinta pruebas** del enunciado, declaradas una a una con **cómo se comprueba cada una**, **en
qué archivo** y **de qué gravedad sería su fallo** — con las cuatro etiquetas que pide la condición
de finalización: 🔴 crítico, 🟠 importante, 🟡 menor, 🟢 mejora. Y, sobre todo, **el recorrido de
verdad**: `scripts/test-integrales.mjs` no comprueba funciones sueltas, sino lo que hace Josué
cruzando módulos — crear, borrar, recuperar, borrar del todo, activar, desactivar, migrar, buscar,
recomendar.

### 🐛 Y lo primero que encontró fue un fallo de la propia verificación

Dos veces durante estas fases —construyendo la F22 y otra vez aquí— **las comprobaciones nuevas de
Chromium fallaban y las viejas pasaban**. El motivo no estaba en el código: `vite.kill()` mata al
hijo directo (`npx.cmd`) pero **no al `node` que escucha el puerto**, así que al terminar quedaba un
servidor vivo con el código de aquella pasada… **y la siguiente ejecución se conectaba a él**.

Una prueba que mira el código de antes y lo aprueba es peor que no tenerla. Ahora en Windows se mata
**el árbol** (`taskkill /T`), el servidor se cierra también si algo revienta antes de tiempo, y hay
una comprobación de que el servidor es **el que acaba de arrancar**.

### Las cuatro decisiones de la fase

**1. ⚠️ Una prueba que no se ejecuta no es una prueba.** El catálogo no vale nada si nadie recorre lo
que declara, así que hay una comprobación de que **cada prueba automática nombra un archivo que
`verificar.sh` ejecuta de verdad** — y de que lo que no se ejecuta aquí lo ejecuta otro.

**2. ⚠️ Las que necesitan un móvil se dicen, una a una.** La red (15), los dos dispositivos (16), los
tamaños de pantalla (21), la reinstalación (29) y **usarlo como una persona normal (30)** —que el
enunciado llama *"probablemente la más importante"*— no se pueden comprobar desde aquí. Se declaran
con su motivo y son lo que **R1** lleva pidiendo desde la v1.22.0.

**3. ⚠️ Tres pruebas no fallan: lo que prueban no existe.** El puente con el Diario (7) no lo ha
construido ninguna fase; los favoritos globales (8) siguen sin existir, como dejó dicho la F39; y el
conflicto entre dispositivos (17) **no es que falte probarlo**, es que `saveData` sobrescribe sin
leer la versión anterior — declarado ya en la F41, la F45 y la F46. Se distinguen de las de Josué:
unas esperan un móvil, estas esperan una decisión.

**4. ⚠️ Un fallo se clasifica, no se discute.** Cada prueba dice de qué gravedad sería su fallo, y el
parte ordena lo crítico primero. Así, el día que algo se rompa, la conversación es *"qué arreglamos
antes"* y no *"cómo de grave es esto"*.

### El parte
Las veintidós pruebas automáticas pasan, **ninguna crítica ha fallado**, y las cinco de Josué y las
tres declaradas salen contadas aparte — porque lo que no se ha ejecutado **no cuenta como aprobado**.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **9 549 comprobaciones de Node** (74
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **447 comprobaciones sobre la
aplicación de verdad en Chromium** (una nueva: que el servidor es el de esta pasada).


## v2.12.0 — EH Fase 46/65: migración y compatibilidad

### Qué se ha construido
*"Añadir → adaptar → comprobar → nunca romper."*

El sistema de versiones y migraciones de Estilo de hombre: `schema_version` de verdad, un proceso que
migra **lo guardado en crudo**, su copia de seguridad, su vuelta atrás si algo falla, los tres
escenarios de usuario del apartado 15 y el mapa de qué sistema manda sobre cada dato. Y engancha al
arranque de la aplicación.

### 🚨 Lo que esta fase encontró nada más empezar

El apartado 9 pide un `schema_version`… **y existía desde la Fase 1**: `VERSION_EH`, guardado dentro
del propio estado. Pero `normalizarEstiloHombre` lo escribía **incondicionalmente** con la versión
del código:

```js
version: VERSION_EH,     // <- pisaba lo que hubiera guardado
```

Así que el campo era **decorativo**: cualquier dato, por viejo que fuera, decía *"soy de la versión
actual"* en cuanto se leía. Una migración basada en él **no se habría disparado jamás**, y nadie lo
habría notado hasta perder algo. Ahora el normalizador **conserva la versión guardada**, y lo único
que la sube es **una migración que ha terminado bien**.

### La migración que existe, y por qué

**v1 → v2 · Sellar un id estable en lo que se guardó sin él.** Lo encontró la auditoría de la **F45**
leyendo en crudo: un elemento guardado sin `id` recibe **uno nuevo cada vez que se lee** — y por lo
tanto **uno distinto en cada dispositivo**, que es exactamente el duplicado que aquel apartado quería
evitar. El normalizador lo tapa (le pone uno y sigue), así que **sin migración el problema se repite
en cada carga**. Ahora se sella una vez y se guarda.

### Las decisiones de la fase

**1. ⚠️ Se migra lo guardado, no lo normalizado.** Cuarta vez que este proyecto se topa con lo mismo
(F41, F45 y aquí): el normalizador **ya ha arreglado** lo que la migración tiene que arreglar, así
que migrar después de él no cambia nada y el dato malo vuelve a guardarse igual de malo.
`migrarEstiloHombre()` recibe **el objeto crudo de `loadData`**, y hay una prueba de que en `App.jsx`
se llama **antes** de normalizar.

**2. ⚠️ Copia antes de tocar, y vuelta atrás si falla** (apartados 5 y 16). La migración devuelve la
copia de lo que había, no muta lo que se le pasa, y si una migración revienta **se para, devuelve lo
original y dice qué pasó**: *"nunca continuar parcialmente dejando datos corruptos"*. Comprobado con
una migración que falla a propósito.

**3. ⚠️ Lo que no se puede migrar no se borra: se aparta y se avisa** (apartado 14), con el texto del
enunciado — *"Hay información que necesita revisión."*

**4. ⚠️ Ni una segunda versión de nada** (apartados 1, 3, 7 y 8). `MAPA_DE_DATOS` dice, para cada cosa
que ya existía en JosStyle, **quién manda** y qué guarda Estilo de hombre — que siempre es un id. Y
el que **no existe** se declara: sigue sin haber favoritos globales, como dejó dicho la F39.

**5. ⚠️ Hay precedente, y se sigue.** La migración de Seguridad Centralizada (PIN en texto plano →
`pinHash`) ya vivía en `App.jsx` con sus banderas para correr una sola vez. Esta hace lo mismo: se
ejecuta al cargar y **solo guarda si de verdad ha cambiado algo**.

**6. ⚠️ Y tres apartados no se pueden cumplir, con su motivo.** No hay entorno de pruebas intermedio
(17), no hay **migraciones versionadas de base de datos** —el `schema.sql` lo ejecuta Josué a mano en
el editor de SQL (18)— y un cliente antiguo leyendo datos nuevos **borra lo que no conoce** por la
regla 5 (19). Lo que sí se hace es no bajar nunca la versión y avisar cuando los datos vienen de una
versión más nueva.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **9 475 comprobaciones de Node** (86
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **446 comprobaciones sobre la
aplicación de verdad en Chromium**. Entre ellas, el recorrido completo del apartado 20 —copia,
migración, uso, borrado y recuperación— y el usuario avanzado migrando **con sus cincuenta perfumes
intactos**.

⚠️ **Una comprobación anterior actualizada, no arreglada:** `test-estilo-hombre` daba por buena la
versión comprobando `VERSION_EH === 1`. Ahora comprueba **la regla** —que hay versión, que es un
número entero y que nunca baja— en vez del número de aquel día.


## v2.11.0 — EH Fase 45/65: estructura interna de datos

### Qué se ha construido
*"Una información = un único lugar = muchas formas de mostrarla."*

Como la F43 y la F44, esta fase **no construye una pantalla: declara y comprueba**. Los dieciséis
apartados quedan escritos con **la función real** que los resuelve, y con ellos nacen **tres
auditorías que recorren lo guardado de verdad**: las fechas, los identificadores y las relaciones.

### 🐛 Y la auditoría encontró un agujero de verdad: tres colecciones se borraban sin papelera

El apartado 8 pide que lo eliminado se pueda **recuperar sin perder su estructura**. Cruzando
`COLECCIONES_EH` (F41) con `CATALOGO_PAPELERA` (ME F3) salieron **tres listas que no estaban**:

- **Las rutinas de Skincare** (F14) y **las de Pelo** (F8) — las dos fases más antiguas con rutinas,
  anteriores a que la **F21** estableciera el patrón de pasar por la papelera global.
- **Los perfumes "por probar"** (F24), justo al lado de una colección que sí pasaba.

Se borraban **para siempre y sin aviso**. Ahora las tres entran por `eliminarConPapelera`, la única
puerta de borrado de la aplicación, con su entrada de papelera y su restauración — **sin tocar ni una
función del motor de ME F3**: tres líneas de catálogo y sus dos llamadas.

⚠️ **Y por qué no lo vio la auditoría de ME F4:** aquella comprueba que *"toda colección que se puede
crear se puede borrar"*, y detecta el "se puede crear" por el patrón de los handlers de alta **de
`App.jsx`**. Estas tres se crean dentro de sus librerías, así que nunca entraron en la lista. Las dos
auditorías se complementan, y ahora se dice.

### 🐛 Y la lección de la F41, por tercera vez: hay que mirar lo GUARDADO

La primera versión de `revisarRelaciones()` leía las colecciones con sus `datos*()`… que **ya las
habían normalizado**. Plantarle una ficha entera donde debía ir un id **no saltaba nunca**, porque el
normalizador la había convertido en `null` antes de que la auditoría la viera: un silencio que parece
un aprobado. Ahora las tres auditorías leen **el camino en crudo** que la F41 declaró, y las
colecciones que no lo tienen —las rutinas, que normaliza el motor— **se declaran como no revisadas en
crudo**, en vez de darse por buenas.

Leyendo en crudo apareció además algo que la versión normalizada no podía ver: **un elemento guardado
sin `id`**. Al releerlo, su normalizador le pone uno nuevo — **y otro distinto en el otro
dispositivo**, que es exactamente el duplicado que el apartado 11 quiere evitar.

### Las decisiones de la fase

**1. ⚠️ Ni una tercera lista de colecciones.** `COLECCIONES_EH` ya dice qué listas hay y **cómo se
leen**; `CATALOGO_PAPELERA`, cuáles se recuperan. Las auditorías recorren esas dos.

**2. ⚠️ La separación por módulos es lógica, no física, y se dice.** El apartado 2 pide *"no mezclar
todo en una tabla gigante"*: JosStyle guarda **una fila por (usuario, clave)** y Estilo de hombre es
**una** clave con un módulo por línea, cada uno con su `config` y su normalizador. Eso cumple el
espíritu —nadie escribe en la `config` de otro— pero **no es una tabla por módulo**, y decirlo
importa: es lo que hace que el apartado 12 siga sin poder cumplirse.

**3. ⚠️ Los conflictos siguen sin poder detectarse, y no se finge.** La F41 ya lo dejó escrito:
`saveData` sobrescribe **sin leer la versión anterior**. Se declara con su motivo y **su texto ya
escrito**, para el día que el esquema lo permita.

**4. ⚠️ Los siete módulos que todavía no guardan nada están dichos.** `fitness`, `sueno`, `salud`,
`habitos`, `progreso`, `educacion` y `productos` están en el catálogo porque Josué los puso en su
Fase 2, pero su pantalla llega después. Se declaran con `claves: []` — así la auditoría no los cuenta
como un olvido, **y se notará el día que uno guarde algo sin decirlo**.

**5. ⚠️ Y no se sobrediseña** (apartado 15, con esas palabras). Aquí no nace ni un campo, ni una
tabla, ni un almacén.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **9 389 comprobaciones de Node** (59
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **446 comprobaciones sobre la
aplicación de verdad en Chromium**. La papelera global pasa de **46 a 49 colecciones**.


## v2.10.0 — EH Fase 44/65: rendimiento y optimización

### Qué se ha construido
*"Muchísimas funciones por detrás, interfaz rápida por delante."*

Esta fase **no se construye: se mide**. Como la F42 (accesibilidad) y la F43 (privacidad), su
enunciado no pide una pantalla: pide que lo que ya existe siga siendo rápido. Así que se ha
construido **el revisor**, **los escenarios de carga del apartado 16** —que se generan de verdad y se
miden contra un presupuesto en milisegundos— y **las dos piezas que de verdad faltaban**.

### Las dos cosas que faltaban, y salieron de mirar el código

**1. 🐛 El buscador lanzaba una consulta por tecla** (apartado 8, que lo dice con su ejemplo:
*"«perfu…» no genera cinco consultas innecesarias"*). `BuscadorEstiloEH` recalculaba `panelBuscador`
en cada pulsación, y cada una **recorre el catálogo entero de todos los módulos**. Ahora lo que se
escribe y lo que se busca son **dos estados**: el campo responde con cada tecla y la búsqueda se
queda atrás un cuarto de segundo. Con el escenario grande, cinco pulsaciones seguidas pasaron de
cinco búsquedas a una.

**2. 🐛 Las listas grandes se pintaban enteras** (apartado 3). Con trescientos perfumes, la colección
pintaba trescientas tarjetas en cada repintado. Ahora usa `paginar()` con su botón de *"Ver N más"* —
y **cuántas se están viendo vive en la pantalla**, no en lo guardado: no tiene que sobrevivir a
cerrar la aplicación.

### Las seis decisiones que gobiernan la fase

**1. ⚠️ Un apartado es una línea, con dónde se cumple.** Los dieciocho están declarados con **la
función real** que los resuelve, no con una promesa.

**2. ⚠️ Y lo que no se puede comprobar desde aquí, se dice.** Las redes (17), los dispositivos
antiguos (15) y la memoria de verdad (10 y 18) necesitan **un teléfono**: se declaran con
`medible: false` y su motivo, como hizo la F41 con los estados que no se pueden detectar. Están en
**R1**, que es lo que le toca mirar a Josué.

**3. ⚠️ Lo que pide el apartado 6 ya existe, y no puede vivir aquí.** *"Utilizar almacenamiento
local"* es exactamente lo que la **F43 prohíbe** a las librerías de Estilo de hombre: guardar es de
`App.jsx` y de Supabase, y hay una auditoría que falla si aparece un `localStorage` en este bloque.
No es una contradicción entre prompts (regla 49): es un sistema **centralizado** ya resuelto, y se
declara dónde vive en vez de montar el segundo. Lo mismo con el caché del apartado 5.

**4. ⚠️ El presupuesto es un número, no una sensación.** Cada operación medida tiene sus
milisegundos escritos y la prueba falla si se pasa. Sin un número, *"va rápido"* es una opinión que
nadie puede comprobar dos meses después.

**5. ⚠️ Un revisor que no puede fallar no sirve** (la lección de la F42): las cinco reglas traen
**un ejemplo que sí incumple**, y la prueba comprueba que lo caza.

**6. ⚠️ Y no se optimiza lo que no se ha medido.** Lo demás se declara como está, incluido el límite
honesto del apartado 7: se sincroniza **por clave** —cambiar un perfume no manda el armario—, pero
**no hay diff por campo**, porque el esquema guarda un JSON por clave. Se dice, en vez de prometerlo.

### Los escenarios del apartado 16, generados de verdad
Los tres usuarios del enunciado —**pequeño** (5 perfumes), **medio** (50 perfumes, 100 accesorios,
200 registros) y **grande** (300 y 300 y **mil registros**)— se generan y **pasan por los
normalizadores de cada módulo**: un escenario inventado a mano que no pasara por ahí no probaría
nada de lo que se usa de verdad. Con el usuario grande, la portada y una búsqueda caben en su
presupuesto.

🐛 **Y eso destapó un fallo en el propio escenario:** los trescientos accesorios salían **cero**. Un
accesorio es *el envoltorio de una prenda del Armario* (F26) y sin `prendaId` su normalizador lo
tira, así que la medición se estaba haciendo sobre una lista vacía **sin decir nada**. Lo cazó su
propia prueba, que comprueba que los tres escenarios llegan enteros.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **9 330 comprobaciones de Node** (71
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **446 comprobaciones sobre la
aplicación de verdad en Chromium**.


## v2.9.0 — EH Fase 22/65: manos, uñas y pies

### Qué se ha construido
El bloque pequeño de **💅 Uñas**, **🤲 Manos** y **🦶 Pies**: sus tres interruptores, lo que se
configura dentro de cada uno —longitud, qué cuidar, frecuencia, recordatorio y notas—, sus rutinas
con checklist, su seguimiento opcional y sus productos.

*"No todo el mundo lo necesita. Por eso será completamente modular y aparecerá únicamente si el
usuario lo activa."*

Con ella **se cierra lo que C-25 dejó abierto**: la F18 configuró, la F19 hizo las rutinas y esta era
la tercera que estaba bloqueada. En Higiene ya no queda ninguna plaquita anunciando una fase futura.

### Las seis decisiones que gobiernan la fase

**1. ⚠️ Vive dentro de `higiene`, y no crea ningún módulo.** Es la respuesta 2 de Josué en C-25:
*"Cuidado de manos y Cuidado de pies son la Fase 22"*, y las casillas de la F18 **solo las
encienden**. Así que los interruptores de esta fase **son partes de `PARTES_HIGIENE`**, no un
registro aparte: apagar la sección y apagar su casilla son la misma acción, y no hay dos verdades.
Lo único que se añade al catálogo es **`unas`**, que su apartado 1 pide con su propio interruptor y
que no estaba en la lista de casillas de la F18 — y **nace apagada**.

**2. ⚠️ Aquí tampoco se construye una máquina.** Rutinas y checklist son `motorRutinas.js` (F14), la
papelera es la global (ME F3) y **los productos son el catálogo compartido que ya resolvió la F19**
(`catalogoParaCuerpo`), no un tercer sitio donde juntarlos. Cuatro ceros en la auditoría.

**3. ⚠️ El seguimiento SÍ se guarda aquí, y no contradice a la F19.** Aquella lo dejó **derivado**
porque su enunciado no describía ninguna pantalla de registro; el de esta fase la describe con todas
las letras —*"📈 ¿Quieres registrar cuándo lo haces?"* (apartado 12) y *"cada registro puede tener
📝 Nota"* (apartado 13)—. Se construye **lo que pide cada enunciado**, no lo que hizo la fase
anterior. Y nace apagado: *"si dice que no: perfecto, no aparece"*.

**4. ⚠️ Dos listas de rutinas dentro del mismo módulo, y hay que nombrarlas.** La F19 ya guardó unas
`rutinas` dentro de `higiene`, y la papelera global se indexa por `módulo.colección`: una segunda
lista llamada igual habría hecho que **restaurar una rutina de uñas la metiera entre las de la
ducha**. Por eso aquí se llaman `rutinasManosPies` y `registrosManosPies`, y hay una prueba de que
ninguna clave del catálogo se repite.

**5. ⚠️ Desactivar una sección no toca las otras ni borra nada** (apartados 14 y 15, los dos con esas
palabras: *"muy importante"*, *"todo sigue exactamente donde estaba"*). Comprobado en Chromium:
encender las uñas deja manos y pies exactamente como estaban.

**6. ⚠️ Y nunca un diagnóstico** (apartado 5: *"no realizar diagnósticos ni convertirlo en un
apartado médico"*). Se reutilizan `PALABRAS_CLINICAS` y `sinDiagnostico()` de la F13 —no una segunda
lista— y una prueba barre todos los textos de la fase.

### El calendario, que es donde más se aprovecha el motor
El ejemplo del apartado 10 —*"💅 Cortar uñas — domingo"*— **no sale de una rutina**: sale de la
frecuencia de la propia sección. En vez de escribir un segundo cálculo de "cada cuánto", las
secciones se convierten en lo que `eventosDeRutinas` ya sabe leer. Séptimo módulo de Estilo de Hombre
que entra en el calendario global sin crear uno propio, y **sin materializar ni una ocurrencia**
(regla 11).

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **9 259 comprobaciones de Node** (146
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **446 comprobaciones sobre la
aplicación de verdad en Chromium** (22 nuevas: abrir la plaquita que llevaba anunciándose desde la
F18, encender las uñas, elegir frecuencia, usar la plantilla y comprobar que **manos y pies no se
mueven**).

⚠️ **Tres comprobaciones de fases anteriores se han actualizado, no arreglado:** la F18 contaba *"dos
partes en la F22"* y ahora son tres; la F19 daba por hecho que la plaquita de manos y pies
**anunciaba** una fase futura, y ahora abre. En los dos casos la prueba pasó a comprobar la **regla**
—que ninguna plaquita se quede a medias— en vez del número de aquel día.

🐛 **Y una lección del entorno:** un servidor de desarrollo de una sesión anterior seguía escuchando
en el puerto 5199, así que la prueba de Chromium estaba mirando **el código de antes** y daba por
buena la fase anterior. Si una comprobación de navegador falla entera sin motivo, mirar primero quién
está en ese puerto.


## v2.8.0 — EH Fase 19/65: cuerpo e higiene, rutinas y recomendaciones

### Qué se ha construido
La parte práctica de **🚿 Higiene** y **🧴 Cuidado corporal**: sus rutinas —plantilla, pasos,
frecuencia, momento, checklist del día, *omitir hoy*, recordatorio y edición—, sus **recomendaciones
sin IA** y sus **productos, packs y alternativas**.

*"Debe ser mucho más ligera que Skincare. No queremos convertir una ducha en una lista interminable
de tareas. La aplicación sugiere → el usuario configura → el usuario decide."*

### Las seis decisiones que gobiernan la fase

**1. ⚠️ Aquí no se construye ni una máquina.** Rutinas, plantillas, checklist, omitir, historial,
calendario y papelera son de `motorRutinas.js` (F14); las reglas, de `motorRecomendaciones.js` (F16);
los productos, los packs y las alternativas, de `motorProductos.js` (F17). La fase es, casi entera,
**llamadas**: lo suyo son sus ocho pasos, sus seis frecuencias, sus dos plantillas y sus siete
reglas. La auditoría declara **siete ceros**.

**2. ⚠️ El ejemplo del apartado 2 mezcla los dos módulos, y se reparte.** Su *"rutina diaria básica"*
es *ducha, higiene, desodorante e hidratación corporal*, pero **C-25 dejó dicho que son dos
apartados** y el 17 exige que quitar uno no toque el otro. Así que los tres primeros son la plantilla
de Higiene y el cuarto la de Cuidado corporal — **exactamente el mismo reparto que hizo la F18 con
las siete casillas**, y por el mismo motivo: una rutina de Higiene con un paso de Cuerpo dentro se
rompería al apagar Cuerpo. Hay una prueba de que un paso del otro apartado **no se cuela**.

**3. ⚠️ El seguimiento no guarda nada nuevo.** La casilla *Seguimiento* la declaró la F18 con
`enFase: 19`, y el enunciado de esta fase **no describe ninguna pantalla de registro**: describe
rutinas. Así que el seguimiento es **lo que ya se sabe** —qué días tocaba, qué días marcó, qué
omitió—, derivado con `historialGenerico`. Inventarle un registro con valoraciones habría sido
meterle a Cuerpo la pantalla de Barba que aquí nadie ha pedido, y el enunciado abre diciendo *"mucho
más ligera que Skincare"*. El almacén tiene **cuatro llaves y ninguna es un registro**.

**4. ⚠️ "Ya tienes un producto que podría servir" es una regla, no un adorno.** El apartado 11
termina: *"esto evita gastar dinero sin motivo"*. Se mira lo que tiene **antes** de mirar el
catálogo: si ya hay algo suyo de esa categoría, se dice **y no se recomienda otro**. Y el catálogo
sigue vacío a propósito (D2-03), así que aquí no aparece ni un producto inventado.

**5. ⚠️ Ni un inventario, ni una papelera, ni un calendario nuevos** (apartado 18: *"nada
duplicado"*). Los productos son los que ya existen y aquí solo se guardan **ids**, como hace Barba;
eliminar pasa por `papelera.js` —dos líneas de catálogo, **séptima vez sin tocar el motor**—; y los
recordatorios salen al calendario global derivados, sin materializar ni una ocurrencia (regla 11).
De los seis sistemas del apartado 18, **cinco existen y el sexto se declara**: no hay favoritos
globales, y se dice, como hizo la F39.

**6. ⚠️ Y nada se enciende solo.** Los recordatorios nacen apagados (apartado 7: *"nunca activarlos
automáticamente"*), las plantillas **sugieren** —crear una es otra llamada con `confirmado`, octavo
`aplicarPlan` del proyecto— y omitir un paso **no penaliza**: dos hechos y uno omitido es una rutina
**HECHA** (apartado 16, *"sin penalización. No crear rachas obligatorias"*).

### 🐛 Los cinco fallos reales, y el peor lleva desde la F8 en el calendario

- **🚨 El fallo de UTC, por tercera y cuarta vez.** `eventosDeRutinas` e `historialGenerico`
  construían el día en hora local (`T00:00:00`) y lo leían con `toISOString()`, que lo pasa a UTC:
  **en España eso resta un día entero**, así que cada recordatorio derivado salía en el calendario
  **la víspera**, y la ventana del historial empezaba un día antes. Es el mismo fallo que ya tuvieron
  `todayISO` y `addDays` —arreglado en AR F3, y por eso existe `fechaLocalISO`—, y afectaba a **Pelo
  (F8), Skincare (F14), Barba (F21)** y a esta fase. Ninguna prueba lo vio porque **ninguna comparaba
  dos días seguidos**.
- **🚨 Las categorías de los productos no son las mismas, y había que traducirlas.** Las de la F18 son
  `gel`, `crema`, `jabon`, `desodorante` y `otros`; las fichas del catálogo compartido llevan las de
  Skincare (`hidratante`, `limpiador`…) y las de Pelo. Comparar `p.categoria === 'crema'` **no habría
  encontrado nunca nada** y el apartado 11 no habría saltado jamás: un silencio, no un error. Se
  declara la equivalencia —dos entradas, ni una inventada— y **`gel` y `desodorante` se declaran sin
  equivalente**, porque hoy no existen en ningún inventario.
- **La comprobación de las casillas repetidas se había quedado vieja.** `auditarCH()` miraba la lista
  entera de partes, y los tres interruptores nuevos —rutinas, recomendaciones y productos— **están en
  los dos módulos a propósito**. Ahora mira solo las **casillas del apartado 1**, que son las que
  C-25 repartió.
- **Y la línea de la portada contaba interruptores.** `resumenCH` sumaba todas las partes, así que
  añadir los tres de esta fase habría cambiado un *"2 de 4 activados"* por un *"5 de 7"* **sin que
  Josué tocara nada**. Cuenta las casillas, que es lo que él marcó.
- **`FASES_CH_LISTAS`, en vez de un `=== 18`.** La F18 escribió `fase === 18` para decidir qué
  plaquita está lista, porque entonces era verdad; esta fase lo habría dejado mintiendo en dos sitios.

### 🐛 Y tres del entorno: **la mitad de la verificación no llegaba a arrancar en Windows**
Esta es la primera fase que se verifica entera en la máquina de Windows de Josué, y ahí se vio que
tres comprobaciones **no fallaban: no empezaban**.

- **`test-app-real.mjs`, la más importante del proyecto**, lanzaba `npx` (que en Windows es
  `npx.cmd`, y desde Node 20 necesita `shell: true`) y abría Chromium desde **una ruta escrita a
  mano** (`/opt/pw-browsers/chromium`) que solo existía en el entorno de aquellas sesiones. Resultado:
  `verificar.sh` decía **"LA APLICACIÓN NO ARRANCA"** cuando lo que no arrancaba era la prueba.
- **`test-imports.mjs` y `smoke.mjs`** usaban `new URL(...).pathname`, que en Windows devuelve
  `/C:/...`: uno no leía ni un archivo y el otro no compilaba nada. `fileURLToPath` es lo que existe
  para esto.
- **Y cuatro pruebas tenían el fallo de UTC en su propio ayudante de fechas**: `dias(1)` devolvía
  **hoy** en España, así que tres comprobaciones de `test-avisos-estilo` y una de
  `test-progreso-estilo` fallaban por la zona horaria, no por el código.

### Verificación
`bash scripts/verificar.sh` **en verde**: build de Vite, **9 109 comprobaciones de Node** (191
nuevas), **1 408 casos de renderizado**, **11 reglas invariantes** y **424 comprobaciones sobre la
aplicación de verdad en Chromium** (24 nuevas, con el recorrido completo: abrir la plaquita, usar la
plantilla, marcar la rutina entera y comprobar que **lo marcado se guarda con su fecha**).

⚠️ **Lo que sigue pendiente de Josué (R1):** Supabase real, la sincronización y el aspecto en su
iPhone. Y queda anotado que **`calendario.js`, `predicciones.js` y `notificaciones.js` tienen el mismo
`toISOString().slice(0, 10)`**: no se han tocado porque son de otro bloque (R2 y R4), pero están
localizados.


## v2.7.0 — EH Fase 18/65: cuerpo e higiene, configuración y perfil · 🔓 **C-25 resuelta**

### Qué se ha construido
Los dos apartados **🚿 Higiene** y **🧴 Cuidado corporal** de Estilo de hombre: su pantalla de
*"¿Qué quieres utilizar?"*, lo que se configura dentro de la higiene diaria, y el formulario de
preferencias, tipo de producto, necesidades, tiempo y nivel.

*"Debe ser mucho más sencillo que Skincare, porque no queremos llenar Estilo de hombre de funciones
que no todo el mundo necesita."*

### 🔓 La contradicción que llevaba parada desde v1.67.0
Josué preguntó **"dime en qué se diferencian aseo y cuidado corporal"**, que era literalmente la
pregunta de **C-25**: su **Fase 2** pone *Higiene* y *Cuidado corporal* como **dos** módulos del
catálogo, y las **Fases 18 y 19** los tratan como **uno solo** llamado *"Cuerpo e higiene"*. Se le
contestó desde su propia especificación —*Higiene* es **limpiarse**, *Cuidado corporal* es **cuidarse
la piel de cuello para abajo**— y se le pusieron las tres preguntas. Contestó:

| | Respuesta |
|---|---|
| 1 | **Dos apartados separados**, como escribió en la Fase 2 |
| 2 | ***Cuidado de manos* y *Cuidado de pies* son la Fase 22.** Aquí solo se encienden |
| 3 | **Se sigue llamando *Higiene***, no *Aseo* |

Con eso se desbloquean **F18, F19 y F22**. C-25 queda ✅ **RESUELTA** en `docs/03`.

### Las seis decisiones que gobiernan la fase

**1. ⚠️ Las siete casillas se REPARTEN, no se funden.** El apartado 1 las lista en una sola pantalla;
con dos módulos, cada uno enseña **las suyas**. `PARTES_HIGIENE` y `PARTES_CUERPO` son **dos listas**,
con `enFase` en cada línea, y hay una prueba de que ninguna casilla se queda sin módulo y ninguna
está en las dos. Así `MODULOS_EH` **no cambia** —no se retira nada del catálogo, que tiene
`retirados` precisamente porque quitar un módulo no es gratis— y el **apartado 17 se cumple
literalmente**: se puede quitar 🚿 Higiene diaria sin tocar 🧴 Cuidado corporal, comprobado en
Chromium.

**2. ⚠️ Y eso cierra un solape del propio enunciado.** Su apartado 1 pone *Desodorante*, *Cuidado de
manos* y *Cuidado de pies* como casillas sueltas, pero su apartado 3 las mete **dentro de "Higiene
diaria"**. Con el reparto, las cuatro son partes de `higiene` y no hay que elegir: la casilla es el
interruptor, y `COSAS_DE_HIGIENE_DIARIA` es lo que se configura dentro.

**3. ⚠️ Aquí no se pregunta lo que ya se sabe** (apartado 2, con esas palabras). Los aromas los
declaró la **F24** en el registro de la F4 **con `cuerpo` dentro de su `usan`**, justo previendo
esto; `sinPerfume` igual desde la F17; y `sensibilidadPiel` desde la F13. `YA_CONTESTADO` los lee y
la pantalla dice dónde se cambian — **cuarta vez que el registro de la F4 evita una pregunta
repetida antes de escribirla**.

**4. ⚠️ Ni un catálogo de productos nuevo** (apartado 15, con todas las letras: *"no crear «Catálogo
corporal 2»"*). Es `motorProductos.js` (F17), y lo que se queda aquí son **sus cinco categorías**. El
catálogo global sigue vacío a propósito (D2-03), y el apartado 18 se resuelve igual: calendario,
diario, recordatorios, perfil y papelera, los que ya existen.

**5. ⚠️ Nunca un diagnóstico** (apartado 7: *"no realizar diagnósticos"*). Se reutilizan
`PALABRAS_CLINICAS` y `sinDiagnostico()` de la F13 —no una segunda lista— y hay una prueba que barre
todos los textos. Esta fase habla de *higiene íntima* y de *rozaduras*, así que el barrido importa
más que nunca: se pregunta **qué quiere cuidar**, no qué le pasa.

**6. ⚠️ Y lo que esta fase no hace, se dice.** Rutinas, recomendaciones y seguimiento son la **F19**;
manos, uñas y pies la **F22**. Cada plaquita anuncia en qué fase llega, en vez de abrir una pantalla
vacía (regla 8).

### 🐛 Los cinco fallos reales, y el peor lo cazó Chromium
- **Una casilla que hacía lo contrario de lo que enseñaba.** La pantalla pintaba las marcas **desde
  lo guardado** pero alternaba sobre un estado local vacío, así que **marcar desmarcaba**. Se arregla
  con `marcadas = null` como *"todavía no ha tocado nada"*, y el valor efectivo es
  `marcadas ?? loGuardado`. Ni el build ni los 1408 casos de renderizado lo vieron.
- **`sinDiagnostico(t)` devuelve un booleano**, no un objeto: leer `.limpio` da `undefined`, que es
  falso, así que **todos los textos salían clínicos**.
- **`progresoVisible` devuelve `total`, no `de`.**
- **Una línea de `FUENTES_BUSQUEDA` usa `lista:` y `nombre:`**, no `leer:` ni `texto:`. Con los
  nombres mal, la fuente **no habría encontrado nunca nada** — y eso no lo ve el build.
- **`normalizarPregunta` se lleva `seccion`**, así que agrupar por secciones se hace contra el
  catálogo y no contra el motor. Barba ya tenía escrita esta misma lección.

### 🐛 Y una sexta, de las pruebas
`test-pantalla-eh` y `test-gestion-estilo` usaban **`cuerpo` escrito a mano** como ejemplo de "módulo
que todavía no tiene pantalla" y "módulo sin partes". La F18 le dio las dos cosas y **cinco
comprobaciones saltaron con algo que estaba bien**. Ahora se le pregunta al catálogo
(`MODULOS_EH.find((m) => !LINEAS_DE_PLAQUITA[m.id])`), que es la lección de siempre: comprobar el
mecanismo, no un ejemplo escrito a mano.

### Verificación
`bash scripts/verificar.sh` en verde — build de Vite, **98 comprobaciones nuevas**, **1408 casos de
renderizado** y **400 comprobaciones en Chromium** (19 nuevas): los **dos** apartados salen en la
portada, cada uno enseña **sus** casillas y no las del otro, lo marcado **se guarda tal cual** tras
recargar, **Cuidado corporal no se toca** al configurar Higiene, dentro se ven ducha / higiene
corporal / higiene íntima, y **lo que llega en la Fase 22 se anuncia** en vez de abrir una pantalla
vacía.

### Archivos
- **Nuevos:** `src/lib/cuerpoHigiene.js`, `scripts/test-cuerpo-higiene.mjs`.
- **Modificados:** `src/views/EstiloHombreView.jsx` (`CuerpoHigieneEH`), `src/lib/pantallaEH.js`,
  `src/lib/buscadorEstilo.js`, `src/lib/gestionEstilo.js`, `src/lib/miEstilo.js`,
  `scripts/smoke-vistas.jsx`, `scripts/test-app-real.mjs`, `scripts/verificar.sh`,
  `scripts/test-pantalla-eh.mjs`, `scripts/test-gestion-estilo.mjs`,
  `docs/03_CONTRADICCIONES_DUPLICADOS_DEPENDENCIAS.md` (**C-25 cerrada**).

---

## v2.6.0 — EH Fase 43/65: seguridad, privacidad y control de datos

### Qué se ha construido
La pantalla **🔒 Tus datos** —qué guarda Estilo de hombre, dónde vive cada sistema y qué no sale
nunca de la aplicación—, la **auditoría de privacidad** que lo demuestra sobre el código, y
**un arreglo de seguridad de verdad en `App.jsx`**.

*"Los datos son del usuario y debe poder decidir qué ocurre con ellos."*

### 🚨 El fallo que encontró esta fase
`loaded` se ponía a `true` una sola vez y **no volvía a bajar nunca**. Al cerrar sesión y entrar con
otra cuenta **sin recargar la página**, `if (!loaded) return <LoadingScreen />` ya no paraba nada, así
que la aplicación se pintaba **con los datos del usuario anterior** hasta que Supabase contestaba. En
un móvil compartido eso es ver lo de otro, y es exactamente lo que prohíbe el apartado 15.

Arreglado con un efecto que baja `loaded` y saca de memoria lo más privado. ⚠️ Y va por el **id del
usuario**, no por el objeto `session`: Supabase lo renueva solo cada hora, y con `[session]` la
pantalla de carga aparecería sola en mitad del día. Hay una comprobación que lee `App.jsx` y **falla
si el arreglo desaparece** — probado quitándolo.

### Las seis decisiones que gobiernan la fase

**1. ⚠️ Esta fase se comprueba, no se construye.** Lo que pide el enunciado es que **no exista** nada:
ni un PIN propio, ni una papelera propia, ni una exportación propia, ni un guardado propio. Así que lo
que se construye es la **auditoría que lo demuestra**, leyendo las **cuarenta y dos librerías** de
Estilo de hombre. Y para que sirva de algo, hay tres ejemplos inventados —una librería que guarda por
su cuenta, otra que se monta un PIN, otra que exporta— y la prueba comprueba que los caza.

**2. ⚠️ El aislamiento es de la base de datos, no de la pantalla.** Las cuatro políticas de `app_data`
son `auth.uid() = user_id`, y se comprueban **leyendo `supabase/schema.sql`**: la auditoría busca
expresamente la política permisiva `auth.uid() IS NOT NULL`, que dejaría a cualquiera leer la fila de
cualquiera.

**3. ⚠️ Ni un secreto en el cliente**, y el patrón lo reconoce de verdad. El primero solo aceptaba
letras y números después de `sk-`, así que **se quedaba en "sk-ant" y no habría reconocido una clave
de Anthropic** (`sk-ant-api03-…`). Una comprobación de seguridad que no reconoce lo que busca es peor
que no tenerla.

**4. ⚠️ Lo más privado no viaja** (apartado 5). El contexto de piel lleva `paraIA: false` escrito
desde la F13, y `estiloHombre` va **aparte de `currentState`** desde la F34 justo para que no llegue a
la IA. Aquí se junta en una lista y se comprueba que sigue siendo verdad.

**5. ⚠️ Y lo que no existe se dice.** JosStyle **no tiene analítica** (apartado 12) ni afiliación
(11, y D2-03 lo prohíbe): no hay nada que restringir, así que se declara con su motivo en vez de
escribir una política sobre algo que no ocurre.

**6. ⚠️ La pantalla no habla en técnico.** *"Solo tú puedes verlo: se guarda con tu cuenta, no en el
teléfono."* Hay una prueba que comprueba que ningún texto dice `RLS` ni `auth.uid`.

### 🐛 Y la lección, undécima vez
`schema.sql` explica en un comentario que ninguna de sus políticas es del tipo permisivo
`auth.uid() IS NOT NULL`… y buscar esa frase en el archivo entero saltaba **con la frase que promete
lo contrario**. Se quitan los comentarios de SQL antes de mirar.

### Verificación
`bash scripts/verificar.sh` — build de Vite, **67 comprobaciones nuevas**, **1384 casos de
renderizado** y **383 comprobaciones en Chromium** (10 nuevas): 🔒 Tus datos dice que todo va con su
cuenta, que lo borrado se recupera, que la copia se descarga desde Ajustes, que **no hay una
contraseña aparte** y que lo más privado no sale ni en un aviso; y se cierra sesión de verdad desde
Ajustes → Seguridad **sin que quede nada suyo en la pantalla**.

### Archivos
- **Nuevos:** `src/lib/privacidadEstilo.js`, `scripts/test-privacidad-estilo.mjs`.
- **Modificados:** `src/App.jsx` (**el arreglo de la sesión**), `src/views/EstiloHombreView.jsx`
  (`PrivacidadEH` y su puerta), `scripts/smoke-vistas.jsx`, `scripts/test-app-real.mjs`,
  `scripts/verificar.sh`.

---

## v2.5.0 — EH Fase 42/65: accesibilidad y usabilidad

### Qué se ha construido
**El revisor de accesibilidad** de JosStyle, y los cuatro arreglos que encontró: un botón de cerrar
que medía lo que su icono, y tres interruptores que un lector de pantalla no sabía nombrar.

*"Las plaquitas pueden ser visualmente pequeñas, pero **nunca deben ser difíciles de pulsar**."*

### Las seis decisiones que gobiernan la fase

**1. ⚠️ Esta fase no se puede "construir": se revisa.** No hay una pantalla nueva que hacer — hay
diecisiete reglas que cumplir en las cuarenta que ya existen. Así que lo que se construye es **el
revisor**: `revisarPantalla()` lee el código de una vista y devuelve **los incumplimientos de verdad,
con su línea**. Una lista de buenas intenciones no habría encontrado nada; esto encontró cuatro cosas
el primer día. Y ahora **revisa las veintisiete vistas de JosStyle y `ui.jsx`** en cada
`verificar.sh`, no solo Estilo de hombre.

**2. ⚠️ Compacto no es incómodo** (apartados 1 y 2). El área táctil mínima son **44 píxeles** —la de
Apple— y una plaquita puede seguir midiendo lo que mide mientras su zona de toque llegue ahí. El
arreglo del botón de cerrar es `p-1.5 -m-1.5`: **el dibujo se queda exactamente donde estaba** y solo
crece lo que se puede tocar.

**3. ⚠️ El color nunca va solo** (apartado 6: *"🟢 Activo también debe tener: Activo"*).
`etiquetaDeEstado()` devuelve el icono **y** la palabra, y hay una comprobación de que los tres
catálogos de estado del módulo traen las dos cosas. Un catálogo con `icono` y sin `nombre` es un
estado que alguien que no distingue los colores no puede leer.

**4. ⚠️ Lo que ya estaba resuelto no se vuelve a resolver.** El contraste y los dos modos son de
`tokens.js`, el tamaño de fuente es de Ajustes, y las animaciones **ya respetan
`prefers-reduced-motion`** desde `index.css`. Se declara dónde vive cada una y se comprueba que sigue
ahí, en vez de escribir un segundo sistema (regla 2).

**5. ⚠️ Tres apartados no se pueden comprobar desde aquí, y se dice**: el teclado tapando el botón de
guardar (10), la rotación (16) y los cuatro dispositivos (17) necesitan un teléfono de verdad. Están
declarados con su motivo y le tocan a Josué (R1), en vez de dar por buena una prueba que nadie ha
hecho.

**6. ⚠️ Y un revisor que no puede fallar no sirve.** Cada regla trae **un ejemplo que sí la
incumple**, y hay una prueba de que lo caza. Sin eso, una expresión mal escrita daría siempre cero
problemas y todo el mundo se quedaría tranquilo.

### Lo que encontró, y está arreglado
- **Un botón de cerrar del tamaño de su icono** (16 px): ahora tiene su zona de toque.
- **Tres interruptores sin nombre**: el de *"usar mis preferencias"*, el general de avisos y el de
  cada tipo de aviso. La palabra estaba al lado en la pantalla, pero un lector de pantalla no la une.

### 🐛 Y la lección, décima vez
El revisor daba por "botón sin nombre" a `QuickActionButton`, que pinta `{label}` justo al lado del
icono — porque quitaba **las expresiones** antes de buscar texto. Se arregló al revés: se quitan
**los iconos**, y si no queda absolutamente nada, entonces sí es un botón de solo icono.

### Verificación
`bash scripts/verificar.sh` — build de Vite, **51 comprobaciones nuevas** (que incluyen pasar el
revisor por toda la aplicación), **1376 casos de renderizado** y **373 comprobaciones en Chromium**
(7 nuevas): en el navegador de verdad, ningún interruptor se queda sin nombre, **ninguno mide menos
de 44 píxeles**, ningún botón de solo icono se queda sin `aria-label`, ninguno es diminuto y la
pantalla no se desborda a lo ancho.

### Archivos
- **Nuevos:** `src/lib/accesibilidadEH.js`, `scripts/test-accesibilidad-eh.mjs`.
- **Modificados:** `src/views/EstiloHombreView.jsx` (los cuatro arreglos),
  `scripts/test-app-real.mjs`, `scripts/verificar.sh`.

---

## v2.4.0 — EH Fase 41/65: estados vacíos, carga, errores y recuperación

### Qué se ha construido
El **catálogo de estados** de Estilo de hombre y sus cinco pantallitas: el **vacío con salida**, las
**tarjetas de carga**, el **aviso** con sus opciones, el **✓ pequeño y temporal**, y los avisos de la
portada. Y en uso: el registro que no se puede leer ya no se pierde en silencio, la lista vacía de
Accesorios tiene su botón, y borrar un registro de piel **pregunta antes y dice adónde va**.

*"Todo estado debe tener una respuesta clara."*

### Las seis decisiones que gobiernan la fase

**1. ⚠️ Un estado es una línea, no un `if` en una pantalla.** `ESTADOS_EH` es una línea por apartado
con **las tres respuestas del enunciado** —*qué ha pasado*, *qué puede hacer*, *qué ha ocurrido con
sus datos*—, y `COLECCIONES_EH` una línea por lista con su vacío y su "+ Añadir". Hay una auditoría
que comprueba que ninguna se queda sin las tres, y que **ninguna opción es un botón decorativo**:
cada una declara su acción, y la pantalla solo pinta las que le han dicho qué hacer.

**2. ⚠️ Tres de los estados del enunciado no se pueden detectar hoy, y se dice.** El error de
guardado (6), el estado de la sincronización (8) y el conflicto entre dispositivos (9) necesitan algo
que **JosStyle no tiene**: `saveData` se traga su error y sube sin leer la versión anterior. Se
declaran con `detectable: false` **y su motivo** —y con sus textos ya escritos, para que el día que
exista el mecanismo no haya que inventarlos—, en vez de pintar un aviso que no aparecería nunca. Es
el mismo criterio que la F39 con los favoritos globales.

**3. ⚠️ Y no se monta una cola de escritura.** RA F2 lo dejó escrito: una cola offline solo vale **si
reintentar es idempotente**, y allí lo es porque un cumplimiento reenviado tres veces sigue siendo un
día. Aquí **no lo es**: añadir un perfume dos veces son dos perfumes. Así que sin conexión se enseña
lo que hay y se dice la verdad — *"puedes consultar lo que ya tienes; para guardar cambios hace falta
conexión"*.

**4. ⚠️ Un dato corrupto no rompe la pantalla** (apartado 14), y **para verlo hay que mirar lo
guardado**. Cada colección declara dónde vive en crudo y cuál es su normalizador de elemento: el
registro que no sobrevive se marca **solo él**, y el aviso dice lo único que tranquiliza — *"se
siguen viendo 2"*.

**5. ⚠️ Antes de borrar se dice adónde va, y solo cuando es verdad.** `avisoDeBorrado()` mira el
catálogo de la papelera global (ME F3): prometer *"podrás recuperarlo"* de algo que no va allí sería
mentir, así que en ese caso dice lo contrario.

**6. ⚠️ Y el permiso se pide una vez** (apartado 12, con esas palabras). Si el navegador ya dijo que
no, aquí **no se vuelve a pedir**: se dice que se cambia desde Ajustes. Esta fase no llama a
`requestPermission` ni una vez, y hay una prueba que lee el código.

### 🐛 El error que se cazó construyéndola
La primera versión de `elementosProblematicos()` leía cada colección con su `datos*()` de siempre…
que **ya había descartado el registro malo en silencio**. Encontraba cero problemas siempre: un aviso
que no podía aparecer nunca, que es justo lo que la regla 8 prohíbe. Se arregló leyendo **lo
guardado**, y hay una prueba que comprueba las dos cosas a la vez — que el normalizador tira el
registro y que la revisión sí lo encuentra.

### Verificación
`bash scripts/verificar.sh` — build de Vite, **104 comprobaciones nuevas**, **1376 casos de
renderizado** (36 nuevos) y **366 comprobaciones en Chromium** (8 nuevas): un registro roto se avisa
**y los otros dos se siguen viendo**, la pantalla no habla en informático, y la lista vacía de
Accesorios dice qué pasa, lo explica y **tiene su botón**.

### Archivos
- **Nuevos:** `src/lib/estadosEstilo.js`, `scripts/test-estados-estilo.mjs`.
- **Modificados:** `src/views/EstiloHombreView.jsx` (las cinco pantallitas, el vacío de Accesorios,
  el guardia de `abrirModulo` y la confirmación al borrar un registro de piel),
  `scripts/smoke-vistas.jsx`, `scripts/test-app-real.mjs`, `scripts/verificar.sh`.

---

## v2.3.0 — EH Fase 40/65: primer uso y configuración inicial

### Qué se ha construido
El **❔ ¿Cómo funciona?** —un tutorial de cuatro pantallas que se puede saltar y que se recuerda— y
la **bienvenida** de la pantalla de Estilo de hombre: lo que ya tiene de otros apartados con su
*"Añadir a Estilo"*, **una** idea para empezar con su *Cerrar*, y como mucho **una** sugerencia del
tipo *"¿Quieres añadir 🕶️ Accesorios?"*.

*"Entrar → elegir lo que interesa → empezar. Y si no quiere configurar nada: **no pasa absolutamente
nada**."*

### Las seis decisiones que gobiernan la fase

**1. ⚠️ La mitad de esta fase ya estaba construida, y no se rehace.** La primera entrada (apartado
1), el *"¿qué te interesa?"* (2), el **Saltar** (3), la configuración progresiva (4), la pantalla
resultante (6), el volver a configurar (9), el *"ahora no"* (12) y el volver más tarde (13) son
`configuracionInicial.js` (F3), `estadoPantalla` (F1) y la entrada de tres plaquitas de la F30.
Rehacerlas habría sido la cuarta lista que prohíbe D2-07. Se declaran en **`YA_CONSTRUIDO`, con la
función real que las resuelve** —igual que `SISTEMAS_EH` en la F39—, y hay pruebas que comprueban
que siguen funcionando: usuario nuevo, empezar, uno o varios, saltar, volver y añadir después.

**2. ⚠️ Lo nuevo es el tutorial** (apartados 14 y 15). Cuatro pantallas, y cada una cuenta algo **que
existe de verdad**: las plaquitas de la F30, ⋮ Personalizar de la F31, las conexiones de la F39 y
ocultar frente a desactivar de la F36. Ni una promesa de algo sin hacer (regla 8). Y **que esté
abierto ahora es de la pantalla, no del almacén**: guardarlo tenía un efecto feo — volver a verlo
hacía que constara como no visto, justo mientras lo estaba viendo.

**3. ⚠️ Una idea. Una.** (apartado 7: *"no bombardear. Como máximo: 💡 una idea para empezar"*). Y
**sin catálogo nuevo**: sale de `descubrir()` (F33), que ya sabe qué módulos tiene encendidos.
Cerrarla es de la bienvenida — **la tarjeta sigue existiendo en ✨ Descubrir**, porque cerrar no es
descartar, y hay una prueba que lo comprueba.

**4. ⚠️ Aprender con el uso no activa nada** (apartado 8: *"pero no automáticamente activar nada"*).
`sugerenciaPorUso()` mira si **de verdad lo usa** —tener Perfumes encendido y ni un perfume apuntado
no es usarlo—, propone **una sola**, y `aceptarSugerencia()` escribe **solo con `confirmado`**:
decimoctavo `aplicarPlan` del proyecto. Y *"No, gracias"* se guarda: no se vuelve a proponer.

**5. ⚠️ "Añadir a Estilo" es activar el módulo que ya lo lee** (apartados 10 y 11: *"crear la
referencia, **no duplicar los datos**"*). El armario lo lee `armarioEnEstiloHombre.js` desde la F5 y
los datos globales `leerDato()` desde la F4: no hay nada que importar. **Esta fase no copia ni un
campo**, y la prueba lo comprueba comparando los dos almacenes antes y después — lo único que cambia
es el interruptor.

**6. ⚠️ Ni un porcentaje, ni una tarea pendiente** (apartado 5: *"no utilizar 'tu perfil está al
20%'"*). `auditarPrimerUso()` barre todos los textos buscando porcentajes y palabras de deber, y hay
una prueba que comprueba que el barrido **cazaría el ejemplo del enunciado**.

### 🐛 Una encontrada de paso, y es la novena vez de la misma lección
`test-rachas-servicio.mjs` buscaba las palabras prohibidas —*"xp"*, *"nivel"*, *"medalla"*— en el
JSON entero del panel, **con los ids dentro**. Los ids son `Math.random().toString(36)`, y **uno de
cada ciento ochenta contiene "xp"**: la comprobación fallaba un par de veces de cada cien y tumbaba
`verificar.sh` con ella, sin que nada estuviera mal. Ahora se quitan los ids antes de mirar, y hay
una comprobación de que el barrido sigue cazando un campo `xp` de verdad.

### Verificación
`bash scripts/verificar.sh` — build de Vite, **113 comprobaciones nuevas**, **1340 casos de
renderizado** (36 nuevos) y **358 comprobaciones en Chromium** (19 nuevas): usa Perfumes y se le
ofrece Accesorios con su motivo, **decir que no no enciende nada** y queda apuntado, el tutorial se
abre a un toque suyo, se avanza por sus cuatro pantallas, **se recuerda que lo vio** y tras recargar
**no se abre solo**.

### Archivos
- **Nuevos:** `src/lib/primerUso.js`, `scripts/test-primer-uso.mjs`.
- **Modificados:** `src/views/EstiloHombreView.jsx` (`TutorialEH`, `BienvenidaEH` y sus puertas),
  `scripts/test-rachas-servicio.mjs` (la comprobación que fallaba por azar),
  `scripts/smoke-vistas.jsx`, `scripts/test-app-real.mjs`, `scripts/verificar.sh`.

---

## v2.2.0 — EH Fase 39/65: integración con el resto de JosStyle

### Qué se ha construido
La pantalla **🔗 Cómo se conecta con el resto**, dentro de ⋮ Personalizar: el **mapa de los
diecisiete sistemas globales** que Estilo de hombre usa —calendario, objetivos, tareas,
recordatorios, favoritos, productos, armario, diario, fotos, rachas, sonidos, eliminados, búsqueda,
notificaciones, ajustes, cuenta y sincronización—, cada uno con **a dónde lleva**; el paso de una
acción concreta a **Tareas**; el mapa de **datos compartidos**; y el aviso de que **desactivar no
borra**.

*"Estilo de hombre utiliza los sistemas globales. **No los duplica.**"*

### Las seis decisiones que gobiernan la fase

**1. ⚠️ Esta fase casi no construye: declara y comprueba.** Dieciséis de los diecisiete sistemas del
enunciado **ya estaban conectados** —el calendario desde la F8, los objetivos desde la F28, la
papelera desde la F1, el armario desde la F5, el diario desde la F27, los avisos desde la F38—. Lo
que faltaba era **una línea por sistema que diga por dónde entra**, y una prueba que lo compruebe
importando la función real. `SISTEMAS_EH` es esa lista, del mismo tipo que `MODULOS_EH` o
`METRICAS_PROGRESO`: **al conectar un sistema nuevo, se añade su línea**. Y su `entra` **son las
funciones de verdad**: renombrar una rompe la compilación y hace saltar la prueba.

**2. ⚠️ Tareas era el único que faltaba** (apartado 3). Estilo de hombre no había tocado nunca
`productividad.tareas`, y el enunciado pide *"Comprar producto X"*. Entra **como entró Objetivos en
la F28**: la tarea vive en Productividad con su forma real —`{ id, texto, fechaLimite, hecha }`, ni
un campo inventado—, aquí solo queda **su id**, y quien escribe los dos almacenes es `App.jsx`.
Decimoséptimo `aplicarPlan` del proyecto: **sin `confirmado` no escribe nada**. Las acciones salen de
dos listas que ya existían: los accesorios que quiere (F26) y los perfumes por probar (F24).

**3. ⚠️ Dos de los sistemas del enunciado no existen, y se dice.** El apartado 5 pide *"favoritos
globales"* y el 9 *"sistema global de fotos"*: **no hay ninguno de los dos**. Los favoritos son de
cada módulo (ya lo dijo la F32) y las fotos son de Salud, el Armario, la Biblioteca y los Fondos,
cada una con su bucket. Inventarlos sería exactamente el sistema paralelo que la fase prohíbe, y
fingirlos rompería la regla 8. Se declaran con `existe: false` y **su frase honesta**, que es la que
se lee en pantalla, sin un botón que no llevaría a ninguna parte.

**4. ⚠️ "Fuente única de verdad" ya tenía motor** (apartado 18). Es `FUENTES_GLOBALES` /
`esDatoGlobal()` de la F1 más el `REGISTRO_DATOS` de la F4, y `guardarDato()` lleva desde entonces
negándose a escribir un dato que vive fuera. Aquí no se construye un tercero: se usa ése, y
`duplicadosDetectados()` **lo comprueba de verdad** — un módulo que guardase el peso por su cuenta
saldría con su nombre y con dónde vive el dato.

**5. ⚠️ La cascada no borra más: enseña** (apartado 19). `impactoDeEliminar()` separa tres cosas:
**el elemento**, que va a Eliminados recientemente; **lo que se queda sin apuntar a nada**; y **lo
que no se toca** — borrar un accesorio **no borra la prenda del Armario**. Limpiar los ids colgados
sigue siendo del normalizador de cada módulo, que ya lo hacía desde la F24: aquí no se repite esa
lógica, y hay una prueba que comprueba que este archivo **no borra**.

**6. ⚠️ Y desactivar no borra** (apartado 20). Sale solo, porque `alternarModulo` no toca `config`
desde la F1 y el tercer estado de la F36 separó ocultar de desactivar. No hacía falta código nuevo:
hacía falta comprobarlo **apagando y encendiendo de verdad**, que es la clase de cosa que se rompe en
silencio.

⚠️ **El campo nuevo va en su normalizador desde el primer día** (regla 5): `tareaId` está en
`normalizarDeseo` y en `normalizarPorProbar`, no después. Es la lección número veintinueve, y esta
vez el fallo no llegó a ocurrir.

### 🐛 Y una del navegador
El botón de la lista y el de confirmar decían **lo mismo** —*"Crear tarea"*—, así que no había forma
de saber cuál se estaba pulsando, tampoco para el recorrido en Chromium. El de confirmar pasó a decir
**"Apuntar en Tareas"**, que además dice mejor lo que hace.

### Verificación
`bash scripts/verificar.sh` — build de Vite, **172 comprobaciones nuevas**, **1304 casos de
renderizado** (24 nuevos) y **339 comprobaciones en Chromium** (17 nuevas): se abre desde
⋮ Personalizar, se ve el mapa entero, **lo que no existe se dice con su motivo**, sale *"Comprar
Reloj negro (Casio)"*, se confirma, **la tarea se guarda en Productividad**, en Estilo de hombre
**queda solo su id** y tras recargar sigue apuntada.

### Archivos
- **Nuevos:** `src/lib/integracionEstilo.js`, `scripts/test-integracion-estilo.mjs`.
- **Modificados:** `src/lib/accesorios.js` y `src/lib/perfumes.js` (el campo `tareaId` y
  `editarPorProbar`), `src/views/EstiloHombreView.jsx` (`IntegracionEH` y su puerta en Personalizar),
  `src/App.jsx` (el puente a Tareas), `scripts/smoke-vistas.jsx`, `scripts/test-app-real.mjs`,
  `scripts/test-imports.mjs` (la segunda regla invariante) y `scripts/verificar.sh`.

---

## v2.1.0 — EH Fase 38/65: notificaciones y recordatorios

### Qué se ha construido
La pantalla **🔔 Avisos de Estilo de hombre**, dentro de ⋮ Personalizar: los seis tipos de aviso uno
a uno —**todos apagados de fábrica**—, el **🔕 por módulo**, sus **recordatorios** con fecha, hora y
repetición, el interruptor de **desactivar todo Estilo**, y el resumen de lo que le llegaría hoy ya
agrupado.

*"Estilo propone → usuario activa → JosStyle recuerda. **Nunca: Estilo decide → JosStyle molesta.**"*

### Las seis decisiones que gobiernan la fase

**1. ⚠️ Este archivo decide; `notificaciones.js` manda.** Es el mismo reparto que HT F10 dejó escrito
—*"`avisosHorario.js` DECIDE, `notificaciones.js` MANDA"*—, y el apartado 1 lo pide con esas
palabras: *"no crear otro sistema. Utilizar 🔔 Notificaciones globales de JosStyle."* Aquí **no se
llama a `new Notification` ni una vez**, y hay una prueba que lee el código.

**2. ⚠️ Todo nace apagado** — la regla principal de la fase, escrita **en el catálogo**
(`porDefecto: false` en los seis) y no en un comentario. Con una rutina pendiente y dos perfumes y
**nada encendido**, no sale ni un aviso. Y el *"hace 7 días que no te afeitas"* del apartado 3 **no
se manda si él nunca dijo cada cuánto**: sin frecuencia y sin un registro con el que contar, no hay
aviso.

**3. ⚠️ Ni un horario de silencio ni un interruptor global nuevos** (apartados 7 y 11): son de la
**Fase A4** y viven en `notificaciones.js`. Un segundo horario de silencio sería el peor duplicado
posible — el día que él cambiara uno, el otro seguiría despertándole.

**4. ⚠️ Silenciar un módulo no es desactivarlo** (apartado 6, con esas palabras: *"🔕 no recibir
avisos **sin desactivar el módulo completo**"*). Es el tercer eje después de `activo` y `oculto` de
la F36, y un módulo silenciado **sigue funcionando y sigue en la portada**.

**5. ⚠️ Ni un historial paralelo** (apartado 13). Y la respuesta honesta es que **JosStyle no tiene
un historial global de notificaciones**: lo que tiene es el antirrepetición por día de
`notificarSiCorresponde`. Así que esta fase **no guarda ni un aviso enviado** y lo dice en la
pantalla, en vez de montar el historial paralelo que el apartado prohíbe.

**6. ⚠️ Y las recomendaciones no se vuelven avisos solas** (apartado 10): son un tipo más, apagado
como los demás. Sin encender *"avisarme de nuevas ideas"*, la F32 no notifica nada.

⚠️ Dos detalles heredados: **una recurrencia guarda su regla, nunca sus fechas** (regla 11), y
**`'25:99'` no es una hora** — la forma no basta, que es la lección de la F11.

### 🐛 Y la lección de siempre, séptima vez
La cabecera dice literalmente que aquí **no se llama a `new Notification`**, y la prueba que lo
comprueba saltaba… **con la frase que lo promete**. Se barre el código **sin comentarios**.

### Verificación
`bash scripts/verificar.sh` — build de Vite, **122 comprobaciones nuevas**, **1280 casos de
renderizado** (24 nuevos) y **322 comprobaciones en Chromium** (13 nuevas): se abre desde
⋮ Personalizar, la pantalla dice que todo empieza apagado y que el interruptor general es el de
JosStyle, **de fábrica no hay nada que mandar**, se silencia un módulo, **se guarda**, el módulo
**sigue activo** y tras recargar sigue silenciado.

### Archivos
- **Nuevos:** `src/lib/avisosEstilo.js`, `scripts/test-avisos-estilo.mjs`.
- **Modificados:** `src/views/EstiloHombreView.jsx` (`AvisosEstiloEH` y su puerta en Personalizar),
  `scripts/smoke-vistas.jsx`, `scripts/test-app-real.mjs`, `scripts/verificar.sh`.

---

## v2.0.0 — EH Fase 37/65: buscador y navegación interna

### Qué se ha construido
El **🔍 Buscar en Estilo de hombre**, arriba del todo de su pantalla: busca entre módulos, perfumes,
accesorios, gustos, rutinas, productos, preferencias y objetivos, con los **resultados agrupados**,
sus **🕘 Recientes**, el filtro de **❤️ Favoritos**, y los apartados ocultos y desactivados marcados
con su oferta de activarlos. Más las **migas** y el **volver** coherente.

*"Muchos módulos por detrás, interfaz sencilla por delante."*

### Las seis decisiones que gobiernan la fase

**1. ⚠️ El apartado 11 decide qué se construye y qué no.** *"Si JosStyle ya tiene un buscador global,
**no crear otro buscador independiente**. La búsqueda interna solo será necesaria si aporta una
experiencia más rápida."*
- Los **módulos** ya los busca `buscarModulos()` (F2), y Estilo de hombre ya está en el índice global
  (BI F3). **Ni una copia de ninguno de los dos**, con una prueba que compara resultado por resultado.
- Lo que **nadie indexa** son sus **elementos**: perfumes, accesorios, gustos, rutinas, productos y
  preferencias. Eso es literalmente la lista del apartado 1, y es lo que aporta esta fase.

**2. ⚠️ Añadir una fuente es añadir una línea a `FUENTES_BUSQUEDA`**, y cada línea saca su lista del
`datos*()` que ya existe. **Ni un índice guardado**: se quedaría viejo en cuanto él borrase algo, y
entonces el buscador enseñaría cosas que ya no están.

**3. ⚠️ Un módulo oculto o desactivado sale, marcado, y nunca se enciende solo** (apartados 13 y 14,
con esas palabras: *"nunca activarlo automáticamente"*). Se apoya en `estadoDe()` de la F36 y
devuelve la acción como **oferta**: decimosexto `aplicarPlan`. Y la distinción de la F36 se nota
aquí: **el oculto sí aporta sus elementos** —ocultar no cambia nada por dentro—; el desactivado, no.

**4. ⚠️ Lo eliminado no aparece** (apartado 15), y **sale gratis**: lo borrado se fue de su lista a la
papelera, así que no hay nada que filtrar. Lo que sí hay es una prueba de que este archivo **ni
importa la papelera**.

**5. ⚠️ No hay favoritos globales** (apartado 6: *"conectado al sistema global. No crear favoritos
independientes"*). Son los de cada módulo, el buscador los **lee**, y la pantalla dice dónde están.
Sexta vez de esta lección.

**6. ⚠️ Y "Recientes" guarda lo que él abre desde aquí, no por dónde navega** (apartado 5). La F31 ya
decidió que **no existe un registro de uso** y que crearlo obligaría a escribir en cada navegación.
Esto es otra cosa: un toque explícito suyo en un resultado, **ids de módulo** y nunca lo que escribió.

⚠️ Y `atras()` **nunca devuelve `null`** (apartado 9: *"no sacar al usuario accidentalmente de
JosStyle"*): de la raíz se vuelve a la raíz. Las **migas son una función** de dónde está, no un estado
guardado que se desincronice.

### 🐛 Y el recorrido en Chromium cazó un bug de verdad
`TextInput` es un `<input>` pelado que reparte sus props tal cual, así que **`onChange` recibe el
evento, no el valor**. `onChange={setTexto}` guardaba el evento entero en el estado: el buscador se
pintaba perfecto y **no buscaba nada**. Estaba igual en la pantalla de la F36 — las dos arregladas.
Ni el build ni los 1256 casos de renderizado lo veían, porque **renderizar no es usar**.

### Verificación
`bash scripts/verificar.sh` — build de Vite, **137 comprobaciones nuevas**, **1256 casos de
renderizado** (28 nuevos) y **309 comprobaciones en Chromium** (10 nuevas): se abre el buscador, se
escribe *"bar"* **sin terminar la palabra**, salen los resultados agrupados, se abre uno y **se
apunta en Recientes con su id**.

### Archivos
- **Nuevos:** `src/lib/buscadorEstilo.js`, `scripts/test-buscador-estilo.mjs`.
- **Modificados:** `src/views/EstiloHombreView.jsx` (`BuscadorEstiloEH` y las dos llamadas a
  `TextInput`), `scripts/smoke-vistas.jsx`, `scripts/test-app-real.mjs`, `scripts/verificar.sh`.

---

## v1.99.0 — EH Fase 36/65: gestión global de módulos

### Qué se ha construido
La pantalla **🧩 Gestionar apartados**, dentro de ⋮ Personalizar: cada módulo con su estado, sus tres
acciones separadas —**👁️ Ocultar**, **⏸️ Desactivar**, **🗑️ Eliminar datos**—, sus partes
independientes, el buscador, las flechas de orden, los avisos de dependencia y
**🔄 Restablecer Estilo de hombre**.

*"Todo lo que no quiera el usuario se puede quitar. Pero hay que diferenciar perfectamente: **ocultar
≠ desactivar ≠ eliminar**."*

### 🚨 La fase entera es el tercer estado
Hasta aquí un módulo estaba **encendido o apagado**, y ese único booleano hacía **dos cosas a la
vez**: quitarlo de la portada y dejarlo sin funcionar. El enunciado las separa con todas las letras,
así que ahora son dos campos:

- **`activo`** → **si funciona** (apartado 4: *"no muestra recomendaciones, no genera recordatorios
  propios, no aparece en sugerencias"*).
- **`oculto`** → **si sale en la portada** (apartado 3: *"desaparece de la pantalla principal. **No
  cambia su funcionamiento interno.**"*).

⚠️ **Un módulo oculto sigue dando ideas (F32), tarjetas de Descubrir (F33) y métricas (F35)**, y hay
una prueba por cada una. Filtrarlo también allí habría sido confundir ocultar con desactivar, que es
justo lo que esta fase vino a separar. Lo que sí desaparece es **la pantalla principal entera**: su
plaquita y su hueco en la tarjeta "Mi estilo" — verlo en el resumen justo debajo de donde acaba de
quitarlo parecería que ocultar no ha hecho nada.

⚠️ Y **lo guardado antes de la F36 se queda como estaba**: sin el campo, `oculto` es `false`, así que
ningún módulo se esconde solo. Es el séptimo campo de esa entidad, y va con su línea en el
normalizador — sin ella, el siguiente guardado se lo llevaría (regla 5).

### Las otras cinco decisiones

**⚠️ Y lo demás ya existía.** Ocultar/desactivar es `alternarModulo` (F1), el orden es
`subirModulo`/`moverA` (F2), el buscador es `buscarModulos` (F2), la papelera es la global (ME F3),
las partes las declara cada módulo desde su propia fase, y restablecer es `restablecerDiseno` (F31).
Esta fase **los junta en una pantalla**; no reescribe ninguno, y la auditoría lo declara con seis
ceros.

**⚠️ Desactivar no borra, ni después de meses** (apartado 12). `alternarModulo` no toca `config`, así
que el apartado 7 —*"recupera su funcionamiento anterior. No obliga a configurarlo desde cero"*—
**sale solo**. Aquí no hay código nuevo: hay dos pruebas.

**⚠️ Eliminar va a la papelera global, elemento a elemento** (apartados 5 y 6), para que cada uno se
recupere por separado. Y **el plan lo devuelve la biblioteca; quien borra es `App.jsx`**, que es el
dueño de la papelera — mismo reparto que la F26 con el armario. El plan sale del **catálogo de la
papelera**, no de una lista propia: un módulo que entre allí mañana se vuelve borrable desde aquí sin
tocar nada.

**⚠️ Restablecer devuelve la visibilidad, pero no reactiva** (apartado 8, que nombra *"orden,
visibilidad, tamaños, plaquitas"*). Ahora que ocultar y desactivar son dos cosas, esto **deja de
chocar** con la decisión de la F31: la visibilidad es distribución y vuelve; que un módulo funcione o
no es una decisión suya y no se toca.

**⚠️ Ninguno es obligatorio, y una dependencia se avisa pero no se impone** (apartados 10 y 11), con
**Activar o Cancelar**. Las tres declaradas **existen en el código**: sin esas partes, registrar no
funciona y hay un `return` que lo dice. Inventar una cuarta habría sido un aviso decorativo.

### 🐛 Y la lección de siempre, sexta vez
La frase *"no hay que configurarlo otra vez"* hizo saltar el barrido de imperativos… con un texto que
dice **justo lo contrario**. Se arregló **la frase**, no la prueba.

### Verificación
`bash scripts/verificar.sh` — build de Vite, **141 comprobaciones nuevas**, **1228 casos de
renderizado** (28 nuevos) y **299 comprobaciones en Chromium** (15 nuevas): se abre desde
⋮ Personalizar, la pantalla separa las tres acciones con todas las letras, se oculta un módulo,
**se guarda con `oculto: true` y `activo: true`**, tras recargar sigue fuera de la portada, y se
vuelve a mostrar.

### Archivos
- **Nuevos:** `src/lib/gestionEstilo.js`, `scripts/test-gestion-estilo.mjs`.
- **Modificados:** `src/lib/estiloDeHombre.js` (el campo `oculto`), `src/lib/pantallaEH.js` y
  `src/lib/miEstilo.js` (la portada lo filtra), `src/views/EstiloHombreView.jsx`
  (`GestionarEstiloEH`), `src/App.jsx` (ejecutar el plan de borrado), `scripts/smoke-vistas.jsx`,
  `scripts/test-app-real.mjs`, `scripts/verificar.sh`.

---

## v1.98.0 — EH Fase 35/65: estadísticas y progreso de estilo

### Qué se ha construido
La tarjeta **📊 Mi progreso** en la pantalla de Estilo de hombre: once métricas repartidas por sus
módulos, con **Semana · Mes · Personalizado**, su barrita de ocho caracteres, la elección de qué
quiere ver, la racha y el objetivo **del sistema global**, y su **👁️ Ocultar**.

*"No todo necesita una estadística. Estilo de hombre no debe parecer una aplicación de análisis."*

### Las seis decisiones que gobiernan la fase

**1. ⚠️ La estadística es una vista calculada, no la fuente de datos** (apartado 13, con esas
palabras). Así que **aquí no se guarda ni una cifra**: todo se cuenta en el momento sobre los
historiales que ya existen. Lo único guardado son sus preferencias de pantalla —qué métricas quiere
ver, qué periodo mira y si quiere ver esto—, y por eso *"si elimina estadísticas, no eliminar los
datos originales"* **sale solo**: no hay nada que eliminar. Hay una prueba que quita todas las
métricas y comprueba que los tres registros de piel y los tres de perfume siguen ahí.

**2. ⚠️ Nunca una nota y nunca una comparación** (apartados 3 y 9). Ni *"tu estilo es 73/100"*, ni
*"eres un 82 % de hombre arreglado"*, ni *"este mes eres mejor que el anterior"*. Se enseña **lo que
hay**: *"esta semana, 2 rutinas"*. La auditoría lo declara con ceros, una prueba barre todos los
textos buscando un juicio, y una tercera comprueba que una métrica **no trae con qué compararse**.

**3. ⚠️ Ni una racha nueva ni otro sistema de objetivos** (apartados 7 y 8). La racha es **la
global**, y si no la tiene **no se pinta** —mismo criterio que la F23, y una racha de otro módulo no
cuenta como suya—; el objetivo se lee del sistema global. Cero contadores guardados.

**4. ⚠️ Ocultar (apartado 1) y quitar el progreso (12) son el mismo interruptor** — cuarta vez en
cinco fases que un enunciado describe lo mismo dos veces. Un solo booleano.

**5. ⚠️ Sin datos no se inventa una estadística** (apartado 10). Un módulo sin ni un registro **no
enseña un cero**: dice *"todavía no hay suficientes datos"*. **Pero con historial, un cero en el
periodo sí se enseña**, porque eso es un dato y no un hueco. Distinguir las dos cosas es la lección
de `null` frente a `[]` de la F25, aplicada a una cifra.

**6. ⚠️ Y el "gráfico" son ocho caracteres** (apartado 6: *"muy simples. Por ejemplo: ▂ ▅ ▆ ▇. **No
llenar la pantalla de gráficas**"*). Ni una librería, ni un `<canvas>`, ni un SVG: una cadena de
bloques que se calcula con una división, **agrupada a catorce barras como mucho** para que un mes
entero no salga como una pared en un iPhone. Y todo a cero **no dibuja una línea de mínimos**: no
dibuja nada.

### Una nota honesta
El apartado 2 pide separar *"afeitados"* de *"perfilados"* en Barba, pero **eso no se guarda como
categoría**: el registro de la F21 tiene un campo `que` de texto libre. Así que se cuenta lo que hay
—los registros— en vez de deducir una clasificación de un texto que él escribió a mano (regla 8), y
queda dicho en el código.

### Verificación
`bash scripts/verificar.sh` — build de Vite, **134 comprobaciones nuevas**, **1200 casos de
renderizado** (32 nuevos) y **284 comprobaciones en Chromium** (14 nuevas): sale la tarjeta con su
*"Esta semana"*, **sin registros dice que no hay datos en vez de enseñar un cero**, no hay ni una
puntuación ni una comparación, se cambia el periodo, **se guarda**, sigue tras recargar y se oculta.

### Archivos
- **Nuevos:** `src/lib/progresoEstilo.js`, `scripts/test-progreso-estilo.mjs`.
- **Modificados:** `src/views/EstiloHombreView.jsx` (`ProgresoEH`), `scripts/smoke-vistas.jsx`,
  `scripts/test-app-real.mjs`, `scripts/verificar.sh`.

---

## v1.97.0 — EH Fase 34/65: perfil y preferencias avanzadas

### Qué se ha construido
La pantalla **⚙️ Mis preferencias**, dentro de 🧔 Mi estilo: los siete grupos del enunciado con su
resumen de una línea, **Editar** que lleva al módulo donde de verdad se configura cada cosa, el
borrado de una preferencia suelta, **🔄 Restablecer** una categoría, el interruptor **💡 Usar mis
preferencias para recomendaciones** y la opción avanzada **🗑️ Eliminar datos de Estilo de hombre**.
Y **Estilo de hombre entra en la exportación de datos que ya existía**.

*"Tú tienes el control de tus datos y preferencias."*

### Las siete decisiones que gobiernan la fase

**1. ⚠️ El apartado 15 es el registro de la Fase 4, palabra por palabra.** *"La información debe tener
una única fuente de verdad. Por ejemplo: tipo de perfume → Perfumes. **No**: tipo de perfume → Mi
estilo + Perfumes. 'Mi estilo' simplemente lo muestra."* Eso es `REGISTRO_DATOS` con `leerDato()`,
que existe desde la Fase 4. Así que **esta fase no guarda ni una preferencia**: no tiene almacén ni
normalizador propios, y hay una prueba que lo comprueba leyendo el código.

**2. ⚠️ "Mis preferencias" ya estaba escrita.** La Fase 27 la construyó como vista de solo lectura
sobre el registro (`misPreferencias()`), por el mismo motivo. Esta fase **la reutiliza y la agrupa**;
escribir otra habría sido la cuarta lista de preferencias del proyecto. Es la **quinta vez** que este
registro evita un duplicado.

**3. ⚠️ Los siete grupos del apartado 2 son los siete temas de la Fase 32**, que ya declaran **su
módulo** — y ese módulo es adonde lleva "Editar" (apartados 2 y 3: *"cada una abre el módulo
original. **No duplicar formularios**"*). Tercera vez que se reutiliza esa lista en tres fases.

**4. ⚠️ El interruptor del apartado 7 vive donde surte efecto**, en el almacén de la Fase 32: esta
pantalla **solo lo lee y lo conmuta**, que es el apartado 15 aplicado a sí mismo. Y **hace algo de
verdad** (regla 8): apagado, las reglas que miran una preferencia dejan de aplicarse — hay una prueba
que cuenta ideas antes y después—, **pero las preferencias siguen guardadas**, que es literalmente lo
que pide.

**5. ⚠️ Ocultar y eliminar son dos acciones distintas** (apartado 12, con esas palabras), y el
apartado 13 —*"al volver a activar, recuperar la configuración anterior"*— **sale solo**, porque
`alternarModulo` no toca `config` desde la Fase 1. Aquí no hay código nuevo: hay dos frases y dos
pruebas.

**6. ⚠️ "Eliminar datos de Estilo de hombre" no toca otros módulos** (apartado 10). Enumera lo que se
va **y lo que se queda** —el armario, el diario, los objetivos, el calendario y las fotos—, y **no
apaga sus apartados**: qué tiene encendido lo eligió él, y el apartado 12 separa las dos cosas.

**7. 🚨 Y `currentState` es también el contexto que se le manda a la IA.** El apartado 14 pedía meter
Estilo de hombre en la exportación, y lo cómodo habría sido añadir `estiloHombre` a `currentState`.
**Se pasa aparte**: ese objeto alimenta también al buscador con IA, y el perfil de piel tiene escrito
que **no viaja a la IA** (F13, apartado 17). Un atajo de una línea habría filtrado Estilo de hombre
entero, en silencio.

### Verificación
`bash scripts/verificar.sh` — build de Vite, **126 comprobaciones nuevas**, **1168 casos de
renderizado** (20 nuevos) y **270 comprobaciones en Chromium** (13 nuevas): se entra desde Mi estilo,
**no hay ni un porcentaje** en la pantalla, está el interruptor con su frase, "Editar" sale de aquí y
abre el módulo, y la confirmación fuerte del borrado dice qué se va **y qué se queda**.

### Archivos
- **Nuevos:** `src/lib/preferenciasEstilo.js`, `scripts/test-preferencias-estilo.mjs`.
- **Modificados:** `src/lib/ideasEstilo.js` (el interruptor y `usaPreferencias` en las reglas),
  `src/lib/exportData.js` (las filas de Estilo de hombre), `src/App.jsx` (pasarlo solo a la
  exportación), `src/views/EstiloHombreView.jsx` (`PreferenciasEH` y sus dos puertas),
  `scripts/smoke-vistas.jsx`, `scripts/test-app-real.mjs`, `scripts/verificar.sh`.

---

## v1.96.0 — EH Fase 33/65: descubrir e inspiración

### Qué se ha construido
La tarjeta **✨ Descubrir** en la pantalla de Estilo de hombre: diecinueve ideas de inspiración
repartidas por los siete temas, con **❤️ Guardar**, **❌ No me interesa**, **→ Ver más**, sus
**filtros por tema**, su **✨ frecuencia** (Poca · Normal · Mucha · Desactivada) y su acción para
abrir el módulo correspondiente.

*"Inspiración, no obligación. **No será una red social** ni otro apartado gigantesco."*

### Las seis decisiones que gobiernan la fase

**1. ⚠️ Descubrir no es la Fase 32, y en eso está la fase entera.** Las dos enseñan tarjetas, las dos
se guardan y se descartan, y las dos tienen frecuencia. La diferencia es **lo que dicen**:
- **💡 Ideas para ti** (F32) sale **de sus datos**: *"tienes cinco prendas y ningún outfit"*, y cada
  una explica por qué aparece **con sus cifras**.
- **✨ Descubrir** (F33) son ideas **que él no ha pedido y no salen de nada suyo**: *"podrías probar a
  combinar un accesorio sencillo con un look casual"*. Lo suyo solo decide **cuáles se le enseñan**,
  nunca el texto.

Por eso una tarjeta de aquí **no tiene `porque` con datos**: inventarle uno sería atribuirle una
razón que no existe. Hay una prueba por cada lado, y una tercera que comprueba que ningún texto de
Descubrir finge citar un dato suyo.

**2. ⚠️ Una sola lista de guardados** (apartado 6, con todas las letras: *"utilizar el sistema global
de favoritos. **No crear una segunda lista de guardados**"*). Se guarda en la lista que creó la F32,
por su puerta, y **este archivo no tiene `guardadas` propias** — hay una prueba de que el almacén de
Descubrir no lleva ese campo, y otra de que una tarjeta y una idea conviven en el mismo array.

**3. 🐛 Y ahí estaba el fallo que había que ver venir.** El normalizador de la F32 valida su lista
contra **su** catálogo, así que una tarjeta de Descubrir guardada allí **se habría perdido en el
siguiente guardado** (regla 5): la vigesimoséptima vez del mismo fallo. Lo resuelve el prefijo
`desc_` con `idGuardable()`, declarado en `ideasEstilo.js` **porque la dependencia va en un solo
sentido** —Descubrir importa a Ideas, no al revés— y una prueba que guarda, serializa, vuelve a leer
y comprueba que sigue.

**4. ⚠️ Un módulo apagado no aporta tarjetas** (apartado 4: *"no mostrar contenido de categorías que
el usuario haya desactivado"*). Cada tarjeta declara **de qué módulo es**, y sin ese módulo activo no
existe. Es la misma frontera que la F32 puso con `null`, dicha de otra forma.

**5. ⚠️ Ocultar (1), quitar desde Personalizar (12) y "Desactivada" (11) son el mismo interruptor** —
segunda vez en dos fases. Pero ⚠️ **las etiquetas no son las de la F32**: allí Baja/Normal/Alta/Nunca
y aquí Poca/Normal/Mucha/Desactivada, **porque así lo pone cada enunciado**. Los nombres son de cada
módulo; el comportamiento, del mismo sitio. Y apagar Descubrir **no toca** las Ideas.

**6. ⚠️ Ni un catálogo nuevo, y no es una red social.** Una tarjeta que habla de un producto lleva al
módulo donde vive el catálogo global, **que está vacío a propósito** (D2-03) y lo dice; nunca *"compra
esto"* (apartado 10). Y el apartado 15 se comprueba con cuatro ceros en la auditoría.

### Una lección que ya va por la quinta vez
La prueba de *"no es una red social"* saltó con algo que **estaba bien**: la frase que dice que no hay
seguidores contiene la palabra "seguidores", y la auditoría se llama igual. **Se comprueba el
mecanismo, no la palabra** — que no exista una lista de seguidores, ni un campo en el almacén, ni una
función de comentar. Es la quinta vez en este bloque que una comprobación por texto habría fallado
con código correcto.

### Verificación
`bash scripts/verificar.sh` — build de Vite, **205 comprobaciones nuevas**, **1148 casos de
renderizado** (36 nuevos) y **257 comprobaciones en Chromium** (12 nuevas): se entra, sale la tarjeta,
el lenguaje es abierto, se guarda una y **se comprueba que va a la misma lista que las ideas**, se
abren los filtros, se recarga y **sigue guardada**.

### Archivos
- **Nuevos:** `src/lib/descubrir.js`, `scripts/test-descubrir.mjs`.
- **Modificados:** `src/lib/ideasEstilo.js` (la lista de guardados compartida y `idGuardable`),
  `src/views/EstiloHombreView.jsx` (`DescubrirEH` y su frecuencia en Personalizar),
  `scripts/smoke-vistas.jsx`, `scripts/test-app-real.mjs`, `scripts/verificar.sh`.

---

## v1.95.0 — EH Fase 32/65: recomendaciones generales de estilo

### Qué se ha construido
La tarjeta **💡 Ideas para ti** en la pantalla de Estilo de hombre: quince ideas repartidas por los
**siete temas del apartado 2**, cada una con **por qué aparece**, sus tres respuestas
(👍 Me interesa · ❌ No me interesa · ✅ Ya lo hago), su **❤️ Guardar**, su acción al módulo
correspondiente y su **📝 Escribir en Diario**. Con **🔔 frecuencia** configurable desde Personalizar
y **🧹 borrar el historial** desde la propia tarjeta.

*"Esto es subjetivo. Son recomendaciones, no reglas."* Nunca *"tienes que hacer esto"*, nunca *"tu
estilo correcto es este"*, y **ni una puntuación** que le juzgue.

### Las seis decisiones que gobiernan la fase

**1. ⚠️ El motor ya existe, y ésta es su cuarta vez.** `motorRecomendaciones.js` (F16, extraído de
F9) trae `reglaAplicable` con su regla de oro, el descarte con motivos y caducidad, las guardadas,
las vistas, la lista de palabras prohibidas y `ordenarYRecortar`. Esta fase **no escribe un cuarto
`if`**, ni una segunda lista de palabras prohibidas, ni otro `descartarEn`. Lo que aporta es un
**contexto que cruza todos los módulos**, que es justo lo que las tres anteriores no hacían:
`recomendacionesPelo` mira el pelo, `recomendacionesPiel` la piel, `recomendacionesPerfumes` los
perfumes; ésta mira **los siete temas a la vez**.

**2. ⚠️ Ocultar (apartado 1), desactivar (16) y "Nunca" (7) son el mismo interruptor.** El enunciado
lo describe tres veces, así que hay **una sola cosa guardada**: `frecuencia`. Tres booleanos que
apagan lo mismo son tres cosas que un día dirán algo distinto. Es la lección de la F26.

**3. ⚠️ No se repite lo que otro módulo ya recomienda** (prueba 13: *"comprobar que no aparecen
recomendaciones contradictorias"*). Skincare, Pelo y Perfumes tienen **su propio motor**, con datos
más finos. Así que las ideas de aquí son **cruzadas** —*"ya tienes rutina de piel y ninguna de
pelo"*— y, cuando tocaría una idea de un módulo concreto, **llevan allí** en vez de escribirla otra
vez. Tres reglas existen solo para eso, y una prueba comprueba que el archivo no importa las reglas
de esos módulos.

**4. ⚠️ Un módulo apagado deja su dato en `null`, y `null` no es cero** (apartado 9: *"no asumir
características que no conocemos"*). Sin esa distinción, Barba apagada contaría como "cero productos
de barba" y dispararía una idea sobre algo que él ha decidido no usar. Quien lo garantiza en el
código es `requiere` del motor: **una regla sin requisitos declarados no se aplica nunca**.

**5. ⚠️ "Me interesa" no silencia: guarda.** Callar lo que acaba de pedir sería lo contrario de lo
que dice el botón. *"No me interesa"* calla también **las de su tema** —que es lo que "evitar
recomendaciones equivalentes" significa (apartado 5)—; *"Ya lo hago"* calla **solo esa**, porque él
no ha dicho que el tema no le interese. Y **ningún descarte es para siempre**: todos caducan y todos
se pueden deshacer.

**6. ⚠️ No hay un sistema de favoritos globales** (apartado 15). Lo que hay son favoritos **por
módulo** —`prenda.favorita`, `perfume.favorito`, `gusto.favorito`— y las `guardadas` del motor, que
es exactamente "guardar una idea". Se usa esa, y **la pantalla dice dónde están** en vez de fingir un
sistema global que no existe (regla 8). Y **borrar el historial no se lleva lo guardado** (apartado
17): lo guardó él a propósito, no es historial.

### Dos detalles que no son obvios
- **Marcar una idea como vista es un toque suyo** ("🔄 Otras ideas"), no un efecto al abrir la
  pantalla: escribir en Supabase cada vez que se repinta una tarjeta sería hacerlo a sus espaldas.
- **La idea que no sabe explicarse no se propone.** Si su `porque` sale vacío, se descarta antes de
  llegar a la pantalla: un motivo vacío convierte una idea en una nota suelta (lección de la F25).

### Verificación
`bash scripts/verificar.sh` — build de Vite, **215 comprobaciones nuevas**, **1112 casos de
renderizado** (36 nuevos) y **245 comprobaciones en Chromium** (14 nuevas): se entra, sale la
tarjeta, **cada idea explica por qué aparece**, el tono es el del apartado 10, se descarta una,
**se guarda**, sigue descartada tras recargar, se oculta y se puede volver.

### Archivos
- **Nuevos:** `src/lib/ideasEstilo.js`, `scripts/test-ideas-estilo.mjs`.
- **Modificados:** `src/views/EstiloHombreView.jsx` (`IdeasEH` y la frecuencia en Personalizar),
  `scripts/smoke-vistas.jsx`, `scripts/test-app-real.mjs`, `scripts/verificar.sh`.

---

## v1.94.0 — EH Fase 31/65: personalización profunda de las plaquitas

### Qué se ha construido
La pantalla **⋮ Personalizar** de Estilo de hombre, y lo que hace falta para que funcione: el
**tamaño** de cada plaquita (pequeña · mediana · grande), **qué información aparece dentro**, el
**límite de accesos rápidos** con su *"Mostrar todos"*, **🔄 Restablecer diseño** y **✨ Personalizar
automáticamente**.

*"La aplicación se adapta al usuario, no el usuario a la aplicación."* Y su regla: *"si el usuario no
quiere algo, lo puede quitar. Y si después lo quiere, lo puede volver a activar. **Sin perder sus
datos**."*

### ⚠️ Casi todo lo que el enunciado pide ya existía, y no se ha repetido
| El enunciado pide | Ya existía, desde |
|---|---|
| Apartado 1 — modo *"⋮ Personalizar"* | `ordenando` + `GestionarApartados` (F2) |
| Apartado 2 — mover / mostrar / ocultar / configurar | `subirModulo`, `bajarModulo`, `alternarModulo` (F2) |
| Apartado 3 — arrastrar a una posición | **`moverA(estado, id, indice)`**, escrita en la F2 *"para el drag & drop"* |
| Apartado 6 — accesos rápidos | `ACCESOS_DISPONIBLES` + `alternarAcceso` (F30) |
| Apartado 9 — *"+ Añadir apartado"* con los ocultos | `paraAnadir()` (F30) sobre `recomendados()` (F2) |
| Apartado 16 — confirmar antes de quitar | `avisoDesactivar()` + el flujo de `pendiente` (F2) |
| Apartado 13 — eliminar de verdad | la papelera global (ME F3) |

### Las seis decisiones que gobiernan la fase

**1. ⚠️ El apartado 12 manda sobre dónde se guarda todo lo nuevo.** *"Cambiar la plaquita de Skincare
**solo cambia su representación** en Estilo de hombre. **No modifica la configuración interna de
Skincare**."* Así que `tamanos` y `contenido` van en el almacén de la **pantalla** —junto a los accesos
de la F30—, indexados por id de módulo, y **nunca dentro de la `config` del módulo al que describen**.
Hay dos pruebas que guardan la `config` de Skincare, tocan su plaquita y comprueban que sale
**idéntica**, y una tercera que lee el código y falla si `guardarConfig` se llama sobre algo que no sea
el módulo anfitrión.

**2. ⚠️ Tres tamaños, y solo tres** (apartado 4: *"no permitir tamaños completamente libres que puedan
romper el diseño"*). Cada uno **declara sus columnas**, así que la grande ocupa las dos sin que la
pantalla tenga un `if` por módulo. Y **volver a "mediana" quita la excepción** en vez de guardar una
copia de la norma.

**3. ⚠️ El contenido es una línea por módulo, y cada línea sale de su propio `resumen…()`**
(`LINEAS_DE_PLAQUITA`, el mismo punto de extensión que `FUENTES_DE_ESTADO` en la F29 y `MODULOS_EH` en
la F1). Ni un dato nuevo, ni una copia. **La principal viene puesta; las extras, apagadas** — que es lo
que concilia esta fase con el *"no mostrar automáticamente estadísticas ni productos"* de la F30:
**automáticamente no, pero él puede**. Un módulo sin líneas **lo dice**, en vez de enseñar casillas que
no hacen nada (regla 8).

**4. ⚠️ Restablecer NO reactiva lo que él apagó** (apartado 10). Devuelve orden, tamaños, contenido y
accesos a lo de fábrica, pero **apagar Barba fue una decisión suya, no "distribución"**: volver a
encenderla sería decidir por él. La pantalla lo dice con una frase, junto al *"esto no elimina datos"*
que pide el enunciado. Décimo `aplicarPlan` del proyecto: **sin `confirmado` no escribe**.

**5. ⚠️ No se finge un "uso reciente" que no existe** (apartado 17: *"puede organizar las plaquitas
según el uso reciente"*). **No hay ningún registro de uso**, y crearlo obligaría a escribir en cada
navegación. Así que se ordena por lo que sí se puede saber sin inventar nada —lo configurado primero,
lo vacío después, y al final lo que todavía no tiene contenido en la aplicación— **y la pantalla dice
ese criterio con estas palabras**: *"no se mira cuándo abriste cada uno: eso no se guarda en ningún
sitio"*. Undécimo `aplicarPlan`. Y **con todo empatado no se baraja nada**: el orden se queda como él
lo dejó.

**6. ⚠️ El límite es de lo que se pinta** (apartado 7: *"no permitir crear 50 accesos rápidos. Si hay
demasiados: Mostrar todos"*). Un tope de cuántos puede elegir, por encima de los que hay en el
catálogo, sería un control que no salta nunca (regla 8). Así que se pintan los que caben y se dice
cuántos quedan detrás — que es el remedio que da el propio enunciado.

### ⚠️ Un fallo que se cazó escribiendo la pantalla
Una lista de líneas **vacía** y **no haber pasado ninguna** no son lo mismo. Sin distinguirlas, apagar
todas las líneas de una plaquita hacía **volver el resumen de la F30 por la puerta de atrás**: justo lo
que él acababa de decir que no quería ver. Lo resuelve `tieneLineas`, que dice si el módulo **declara**
líneas, separado de cuántas están encendidas. Es la misma lección de la F25 (`null` no es `[]`), la
tercera vez en el bloque.

### Verificación
`bash scripts/verificar.sh` — build de Vite, **106 comprobaciones nuevas**, **1076 casos de
renderizado** (44 nuevos) y **231 comprobaciones en Chromium** (13 nuevas): se entra, se abre
⋮ Personalizar, salen los tres tamaños y las casillas de contenido, **se pone una plaquita grande**,
se comprueba que lo guardado va al almacén de la pantalla y **no** a la config del módulo, se abre
✨ Personalizar automáticamente y **se lee el criterio de verdad**, se recarga y el tamaño **sigue
marcado**.

### Archivos
- **Modificados:** `src/lib/pantallaEH.js` (la fase entera), `src/views/EstiloHombreView.jsx`
  (`PersonalizarPlaquitas`, la rejilla y el límite de accesos), `scripts/test-pantalla-eh.mjs`,
  `scripts/smoke-vistas.jsx`, `scripts/test-app-real.mjs`, `scripts/verificar.sh`.
- **Nuevos:** ninguno. La fase cabe en el archivo de la pantalla, que es donde le toca.

---

## v1.93.0 — EH Fase 30/65: pantalla principal y organización

### Qué se ha construido
La pantalla de **Más → Estilo de hombre**, reorganizada: su cabecera, las plaquitas **agrupadas** en
🧴 Cuidado · 👕 Estilo · ❤️ Personal, una zona de **⚡ accesos rápidos** que él elige, y un vacío
inicial que ofrece tres cosas en vez de treinta.

*"La prioridad es: **pocas cosas visibles → pequeñas plaquitas → todo personalizable**."*

### Las seis decisiones que gobiernan la fase

**1. ⚠️ Los tres grupos del apartado 3 son las categorías de la Fase 2.** *"🧴 Cuidado: Skincare,
Pelo, Cuerpo, Barba · 👕 Estilo: Armario, Accesorios, Perfumes · ❤️ Personal: Gustos, Experiencias"*
es exactamente `CATEGORIAS_EH` con `modulosAgrupados()`, que ya existía. Así que **no hay una segunda
agrupación**: se **movieron `pelo` y `barba` a `cuidado`** y se renombró *"Bienestar"* a **"Personal"**
—el **id no se toca**, así que nada de lo guardado se entera—, porque **es donde Josué los pone**. Un
mapa `id → grupo` en el archivo nuevo habría sido la "base de datos duplicada" que prohíbe la Fase 2.

**2. ⚠️ Reordenar y ocultar ya existían.** Los apartados 6, 10 y 11 los pide, y el **16 lo dice con
todas las letras**: *"utilizar el sistema existente de ⚙️ Gestionar apartados"*. Son `activo`, `orden`
y `subirModulo`/`bajarModulo`. Ni uno nuevo, por **D2-07**. Y **el orden de las secciones es el suyo**:
cada una se coloca donde esté su módulo más arriba — sin eso, reordenar no habría movido nada.

**3. ⚠️ Una sección no tiene interruptor propio: lo tienen sus módulos.** El apartado 10 enumera cinco
casillas, pero Cuidado, Estilo y Personal **se apagan apagando sus módulos**, y entonces desaparecen
solas (apartado 3: *"solo aparecen los módulos activos"*). Los únicos dos que necesitan interruptor
son **Mi estilo**, que ya lo tiene desde la Fase 29, y **Accesos rápidos**.

**4. ⚠️ Los accesos rápidos los elige él, y nacen vacíos** (apartado 9: *"el usuario decide qué
accesos aparecen"*). Solo se ofrece el de un módulo **activo** —un atajo a algo apagado sería un botón
que no lleva a ninguna parte (regla 8)—, apagar el módulo lo hace desaparecer **sin borrar su
elección**, y con la zona apagada se devuelve `null`, no una lista vacía.

**5. ⚠️ Menos es más** (apartado 8, con su lista: *"no mostrar automáticamente estadísticas,
historiales, recomendaciones, productos ni rutinas completas"*, y el 15). Cada plaquita lleva **una
línea**, y quien la escribe es el `resumen…()` de su módulo — los mismos que ya existían. La auditoría
lo declara con ocho ceros.

**6. ⚠️ Y el vacío inicial no enseña 30 módulos** (apartado 13). Se le ofrecen **tres**, las del
ejemplo, y **no las que ya tiene**.

### Verificación
`bash scripts/verificar.sh` — build de Vite, **109 comprobaciones nuevas**, **1032 casos de
renderizado** (16 nuevos) y **218 comprobaciones en Chromium** (14 nuevas): se entra, sale la cabecera
literal, las tres secciones agrupadas, la marca de lo que falta por configurar, se elige un acceso
rápido, **se guarda**, sigue ahí tras recargar y **abre su módulo**.

### Archivos
- **Nuevos:** `src/lib/pantallaEH.js`, `scripts/test-pantalla-eh.mjs`.
- **Modificados:** `src/lib/estiloDeHombre.js` (dos categorías y un nombre),
  `src/views/EstiloHombreView.jsx`, `scripts/smoke-vistas.jsx`, `scripts/test-app-real.mjs`,
  `scripts/verificar.sh`.

---

## v1.92.0 — EH Fase 29/65: perfil de estilo personal ("Mi estilo")

### Qué se ha construido
La tarjeta 🧔 **Mi estilo personal**, arriba del todo de **Más → Estilo de hombre**: las etiquetas de
su estilo, sus colores, y los seis bloques del enunciado —👕 Ropa, 💇 Pelo, 🧴 Cuidado, 🌫️ Fragancias,
🕶️ Accesorios y ❤️ Gustos— cada uno con su resumen y con sus módulos, que se abren desde ahí.

*"No será otro apartado enorme. Será una pequeña plaquita que resume las preferencias que el usuario
ya ha configurado… La aplicación **no debe hacerle repetir información que ya haya introducido**."*

### Las seis decisiones que gobiernan la fase

**1. ⚠️ Este archivo no guarda nada, menos un booleano.** Las etiquetas, los estados y los resúmenes
se **derivan en el momento** de los módulos que ya existen. Por eso la prueba 6 del apartado 16
—*"comprobar actualización automática"*— sale sola: **no hay nada que actualizar, porque no hay
copia**. Lo único guardado es si él ha ocultado la tarjeta, y va **donde la Fase 6 declaró que vive**
(`ZONA_MI_ESTILO.dentroDe`), no en un almacén nuevo.

**2. ⚠️ Los apartados 11, 12 y 15 son el sistema de la Fase 2.** *"Elegir qué aparece"*, *"reordenar
plaquitas"* y *"ocultar / mostrar / reordenar / desactivar"* **ya existían**: son `activo`, `orden`,
`subirModulo`/`bajarModulo` y Gestionar apartados. **D2-07 lo prohíbe expresamente** —*"prohibido
crear una cuarta lista de qué se ve"*—, así que aquí no hay ni un interruptor ni un orden nuevos: se
usan los suyos y **la pantalla lo dice, con su botón**. Hay una prueba que reordena con la función de
la Fase 2 y comprueba que los bloques de "Mi estilo" **se reordenan solos**.

**3. ⚠️ Ni una pregunta nueva** (apartado 14: *"NO crear un test de estilo. No queremos 50 preguntas
obligatorias. El perfil debe construirse poco a poco mientras utiliza JC Fitness"*). El archivo no
tiene lista de preguntas, y una prueba lee su código fuente y falla si aparece una.

**4. ⚠️ El estado de cada módulo lo dice su módulo** (apartado 13: 🟢 Configurado · ⚪ Sin configurar ·
⚫ Desactivado). Aquí no se adivina si Skincare está configurado: se le pregunta a `perfilPiel.js`.
`FUENTES_DE_ESTADO` es **una línea por módulo**, el mismo punto de extensión que `MODULOS_EH`, y el
que todavía no tiene pantalla propia sale como **"sin configurar"**, que es la verdad y no un hueco.

**5. ⚠️ Un bloque sin módulos activos no se pinta** (apartado 6: *"mostrar únicamente módulos
activos. No mostrar módulos desactivados"*), y el orden de los bloques es **el que él eligió**.

**6. ⚠️ Y las etiquetas se derivan, no se piden** (apartado 2: *"se obtienen de las preferencias
existentes. **No obligar al usuario a rellenarlas manualmente**"*). Salen del perfil de estilo de la
Fase 6 y de lo que refleja su armario — y las segundas **se marcan como no suyas**, para no
atribuirle algo que no ha dicho. Si no hay ninguna, **no se inventa**: se dice que se irá llenando
solo, que es el apartado 14 en una frase.

### 🐛 Un fallo real, del propio recorrido
Al poner "Mi estilo" arriba, que **nombra** los módulos, el recorrido de Chromium empezó a pulsar el
título de un bloque en vez de la plaquita, y tres comprobaciones de Accesorios se cayeron. `pulsar()`
ahora **solo pulsa botones**, prefiriendo el que dice exactamente eso — que es lo que hace una persona.

### Verificación
`bash scripts/verificar.sh` — build de Vite, **115 comprobaciones nuevas**, **1016 casos de
renderizado** (12 nuevos) y **204 comprobaciones en Chromium** (18 nuevas): se entra en Estilo de
hombre, sale la tarjeta con sus bloques, **no sale "Ropa" porque ese módulo está apagado**, se abre un
módulo desde el resumen, se oculta —y **los módulos siguen ahí**— y se vuelve a enseñar.

### Archivos
- **Nuevos:** `src/lib/miEstilo.js`, `scripts/test-mi-estilo.mjs`.
- **Modificados:** `src/views/EstiloHombreView.jsx`, `scripts/smoke-vistas.jsx`,
  `scripts/test-app-real.mjs`, `scripts/verificar.sh`.

---

## v1.91.0 — EH Fase 28/65: objetivos y experiencias personales

### Qué se ha construido
El **puente** entre "Quiero hacer" y **Objetivos**: convertir algo que quiere hacer en un objetivo
de verdad, ver si está cumplido, marcarlo como "Ya lo hice" y la vista 🌟 **Experiencias**.

No es un módulo nuevo. El enunciado empieza así: *"**NO crear otro sistema de objetivos**. Si JC
Fitness ya tiene Objetivos, utilizamos ese sistema. Esta fase únicamente define **cómo Estilo de
hombre se conecta con él**."*

### Las seis decisiones que gobiernan la fase

**1. ⚠️ Esta fase casi no guarda nada.** Lo único que añade al almacén es un **`objetivoId`** en la
entrada de "Quiero hacer" de la Fase 27. El objetivo vive en Objetivos y aquí solo está su id — hay
pruebas de que ni el texto ni el plazo se copian, y una comprobación en el navegador que mira **los
dos guardados** para verlo.

**2. ⚠️ Un objetivo de JosStyle es `{ texto, plazo, cumplido }`.** El apartado 3 enumera *nombre,
descripción, fecha, prioridad, progreso y categoría*, pero termina con *"todo gestionado por
Objetivos global"* — y el sistema global **no tiene** descripción, fecha concreta, prioridad,
categoría ni porcentaje. Inventarlos aquí habría sido exactamente el segundo sistema de objetivos que
la primera línea prohíbe. **Y no falta nada**, porque lo personal ya lo guarda la Fase 27: categoría,
prioridad, fecha, lugar y nota son campos de la entrada. Cada dato tiene un dueño, y solo uno.

**3. ⚠️ El progreso es un sí o un no, y se dice.** El apartado 10 habla de *"35% → 60% → 100%"*, pero
empieza con *"**si** el objetivo tiene progreso"* y acaba con *"el progreso pertenece al sistema
global"*. El global tiene `cumplido`, que es un booleano. Se enseña lo que hay, con su frase, en vez
de pintar una barra de porcentaje que no existe (regla 8).

**4. ⚠️ "Ya lo hice" se propone, no se hace solo.** El apartado 5 dice *"**podrá** actualizarse
automáticamente"*, no "se actualizará". Así que `sugerirYaLoHice()` mira y `marcarYaLoHice()` escribe
**solo con `confirmado`**. Noveno `aplicarPlan` del proyecto, y sin valor por defecto.

**5. ⚠️ "Experiencias" no es un gestor nuevo** (apartado 4: *"no crear otro gestor independiente"*).
`CATEGORIAS_GUSTO` ya tenía `experiencias` desde la Fase 27, así que esto es **un filtro** sobre lo
que ya hay. Y con la parte apagada devuelve `null`, no una lista vacía.

**6. ⚠️ Y el plazo no tiene valor por defecto.** Elegirlo por él metería su viaje a Japón en "30
días" sin decírselo. Mismo criterio que `ALCANCES` en HT F3: si no lo elige, no se escribe nada.

### Lo que se reutiliza, y no se vuelve a escribir
La navegación a Objetivos es `navegarDesdeHoy`, la única con enlace directo de la app, y
`ObjectivesView` **ya sabía destacar el objetivo por su id**: cero líneas nuevas de interfaz allí. El
calendario y el Diario son los que ya conectó la Fase 27. Y avisar sigue siendo de
`notificaciones.js`: aquí se decide, allí se manda.

### ⏸ Un límite dicho, no escondido
El apartado 7 pide *"📷 añadir fotos, **utilizando el sistema de fotos existente**"*. **No hay
ninguno** al que colgar un recuerdo: los que existen son de Salud (progreso), Armario (prendas),
Biblioteca (material) y Fondos, y una entrada del Diario no tiene fotos. Crear una galería lo prohíbe
el propio apartado, así que la pantalla **lo dice con una frase** en vez de enseñar un botón que no
hace nada. **Pendiente de que Josué decida** si quiere un sitio para esas fotos.

### Verificación
`bash scripts/verificar.sh` — build de Vite, **124 comprobaciones nuevas**, **1004 casos de
renderizado** (20 nuevos) y **186 comprobaciones en Chromium** (18 nuevas): se abre lo que quiere
hacer, **pide el plazo**, se convierte, y se comprueba que el objetivo se escribe **en Objetivos** con
sus campos y ni uno inventado, que aquí solo queda el id, y que navega al módulo que ya existía.

### Archivos
- **Nuevos:** `src/lib/objetivosEnEstiloHombre.js`, `scripts/test-objetivos-eh.mjs`.
- **Modificados:** `src/lib/gustos.js` (`objetivoId` en el normalizador y la parte `experiencias`),
  `src/App.jsx`, `src/views/EstiloHombreView.jsx`, `scripts/smoke-vistas.jsx`,
  `scripts/test-app-real.mjs`, `scripts/test-gustos.mjs`, `scripts/verificar.sh`.

---

## v1.90.0 — EH Fase 27/65: gustos, intereses y cosas que quiero hacer

### Qué se ha construido
El módulo ❤️ **Mis gustos**, con sus cuatro bloques: ❤️ Me gusta, 🎯 Quiero hacer, 🌟 Mis intereses y
📋 Mis preferencias. Se llega desde **Más → Estilo de hombre → Mis gustos**.

*"No será un diario ni una lista de tareas. Será una especie de perfil personal de gustos e intereses
dentro de Estilo de hombre."*

### Las seis decisiones que gobiernan la fase

**1. ⚠️ "Cosas que te gustan" y "cosas que te gustaría hacer" ya existían.** Están en el **registro de
la Fase 4** desde la **Fase 6** —`intereses` y `quiereHacer`, las dos de texto libre— y el perfil de
estilo las pregunta. Así que esta fase **no crea una segunda lista**: guarda la **ficha** de cada cosa
—su categoría, su prioridad, su estado, su fecha, su lugar y su nota— y **deja los nombres donde ya
vivían**. Lo que él escribió en el perfil sale aquí como una entrada suelta con un botón para
completarla, y completarla **no la duplica**. Cuarta vez que este registro evita un duplicado.

**2. ⚠️ Borrar y renombrar sacan el nombre del registro.** Sin eso, borrar "Fútbol" lo devolvía como
entrada suelta del perfil de estilo: el módulo diría que ya no le gusta y el perfil seguiría diciendo
que sí. Lo cazó la prueba, y por eso `escribirEntradas` tiene un parámetro `quitar`.

**3. ⚠️ "Quiero hacer" no es una tarea** (apartado 4: *"no debe aparecer automáticamente como tarea
pendiente"*). El módulo **no importa nada de Productividad**, y hay una prueba que lee el código
fuente. Y se le dice **en la pantalla**, no solo en un comentario.

**4. ⚠️ El estado es solo de "Quiero hacer"** (apartado 6, con esas palabras). Un "Me gusta" no lo
tiene: dárselo obligaría a decidir qué significa *"ya lo hice"* sobre *"me gusta el fútbol"*. Y **"Ya
lo hice" no borra nada** —*"esto permite conservar el historial sin eliminarlo"*—: solo deja de salir
en el calendario, porque es historial y no un plan.

**5. ⚠️ La fecha llega al calendario, pero nadie crea un evento** (apartado 7). Los eventos son
**derivados y de solo lectura**, filtrados por el rango que se pide, y entran por la misma puerta que
Pelo, Piel, Barba y Sonrisa. Quitar la fecha hace desaparecer el evento, porque nunca se guardó.

**6. ⚠️ "Mis preferencias" no es una cuarta lista.** El apartado 1 la nombra y el enunciado no la
define en ningún sitio, mientras que el registro de la Fase 4 **ya clasifica** las suyas con
`clase: 'preferencia'`. Así que es una **vista de solo lectura** que dice dónde se cambia cada cosa,
igual que la Fase 12 con `tiempoPelo`. Inventar una lista habría sido la cuarta de preferencias.

### Y dos cosas más que el enunciado pide con nombre
**La nota es corta y lo extenso es del Diario** (apartado 10: *"pero no convertirlo en diario… así
reutilizamos el Diario existente"*): la pantalla **lleva** al Diario, no copia nada allí ni trae nada
de allí. Y **`paraPersonalizar()` devuelve, no aplica** (apartado 11: *"nunca modificar
automáticamente otros módulos"*), con `soloLectura: true` escrito en el propio dato.

La prioridad **no mete prisa**: ninguna viene marcada, ninguna dice "urgente" y ninguna pone fecha
límite. *"No crear presión."*

### Verificación
`bash scripts/verificar.sh` — build de Vite, **191 comprobaciones nuevas**, **984 casos de
renderizado** (36 nuevos) y **168 comprobaciones en Chromium** (17 nuevas): se entra en Mis gustos, se
configura, se añade algo a "Quiero hacer", **se comprueba que su nombre va al registro de la Fase 4** y
que sigue ahí después de recargar.

### Archivos
- **Nuevos:** `src/lib/gustos.js`, `scripts/test-gustos.mjs`.
- **Modificados:** `src/lib/estiloDeHombre.js` (la línea del módulo), `src/lib/papelera.js` (una
  entrada del catálogo), `src/lib/datosEstiloHombre.js` (`intereses` y `quiereHacer` los usa también
  `gustos`), `src/lib/calendarioIntegracion.js`, `src/App.jsx`, `src/views/EstiloHombreView.jsx`,
  `scripts/smoke-vistas.jsx`, `scripts/test-app-real.mjs`, `scripts/verificar.sh`.

---

## v1.89.0 — EH Fase 26/65: accesorios y estilo personal

### Qué se ha construido
El módulo 🕶️ **Accesorios**: relojes, gafas, pulseras, collares, anillos, gorras y otros, con su
estilo, sus ocasiones, sus combinaciones, sus recomendaciones y la lista de *"quiero comprar"*. Se
llega desde **Más → Estilo de hombre → Accesorios**.

### Las seis decisiones que gobiernan la fase

**1. ⚠️ Un accesorio ES una prenda del Armario.** El objetivo lo dice con todas las letras: *"**NO
crear otro armario**"*. Y el armario ya tenía la categoría `accesorios` desde AR F1, así que el reloj
de Josué **vive allí, una sola vez**. Lo que se guarda en Estilo de hombre es un **envoltorio** con
lo que el armario no sabe: con qué estilo lo usa, para qué ocasiones, con qué combina y el id del
producto si lo enlazó. `CAMPOS_DE_LA_PRENDA` es esa frontera **escrita**, y hay una prueba por cada
uno de sus quince campos: si mañana alguien guarda aquí el nombre "por si acaso", tendrá media ficha
en un sitio y la ficha entera en otro, que es el segundo armario por la puerta de atrás.

**2. ⚠️ Añadir un accesorio escribe en el Armario, no aquí.** `prepararAltaAccesorio` devuelve un
**plan** con las dos piezas y quien guarda es `App.jsx`, que es el dueño de los dos almacenes. La
prenda se construye con `crearPrenda`, la fábrica del armario, así que tiene exactamente la misma
forma que las que crea el Armario. En Chromium se comprueba que **se escriben los dos**.

**3. ⚠️ El duplicado se comprueba antes.** *"Antes de crear un accesorio: comprobar si ya existe en el
Armario. Si existe: utilizar ese elemento. **No crear una copia**."* Con el nombre repetido **no hay
plan**: se devuelve la prenda encontrada para que la pantalla ofrezca usarla, y crear otra igual
exige decirlo. **Sin valor por defecto**: elegir por él sería crear la copia que el apartado prohíbe.
Y se busca en **todo** el armario, no solo en la categoría de accesorios — una gorra apuntada como
"Otros" sigue siendo la misma gorra.

**4. ⚠️ La combinación es una preferencia, no un outfit** (apartado 9: *"no construir todavía un
segundo sistema de outfits, porque eso pertenece al Armario"*). Se guarda *"lo uso con X estilo"* y se
devuelve **una frase**. Ni `crearOutfit(` aparece en el archivo, y hay una prueba que lee el código.

**5. ⚠️ Ni otra lista de estilos ni otra de ocasiones.** Los siete estilos del apartado 5 ya estaban
**todos** en `ESTILOS_VESTIR` (Fase 6) y las siete ocasiones del apartado 6 **todas** en `OCASIONES`
(Fase 24). Se importan, y las ocasiones son un subconjunto declarado por sus ids: si alguien renombra
uno allí, aquí desaparece y la prueba lo dice.

**6. ⚠️ Y el favorito es el de la prenda** (apartado 7: *"utilizar favoritos globales"*).
`alternarFavoritoAccesorio` **no devuelve un estado de Estilo de hombre**: devuelve un armario nuevo.
Es la manera de que no haya dos.

### Dos detalles que importan
**"Estoy usando" es una lista**, no un campo: un reloj y unas gafas se llevan a la vez, al revés que
el perfume de la Fase 24. Y **el apartado 2 y el apartado 14 son el mismo interruptor**: elegir qué
gestiona y apagar una categoría después son marcar y desmarcar la misma casilla.

La **lista de deseados** es del módulo porque el apartado 13 dice *"si ya existe"* una global, **y no
existe ninguna** en el proyecto. La auditoría lo declara con un cero en vez de esconderlo.

### 🐛 Un fallo real
`restaurarAccesorio` escribía el `{ moduloActualizado, yaExistia }` entero en vez de
`r.moduloActualizado`, así que recuperar un accesorio de la papelera habría guardado un objeto que el
normalizador no reconoce y **se habría llevado por delante todo el módulo**. Lo cazó la prueba.

### Verificación
`bash scripts/verificar.sh` — build de Vite, **237 comprobaciones nuevas**, **948 casos de
renderizado** (48 nuevos) y **151 comprobaciones en Chromium** (23 nuevas): se entra en Accesorios, se
configura, se añade uno, **se comprueba que la prenda se escribe en el Armario y aquí solo su
envoltorio**, se repite el nombre y **avisa en vez de duplicar**, y al recargar sigue estando.

### Archivos
- **Nuevos:** `src/lib/accesorios.js`, `scripts/test-accesorios.mjs`.
- **Modificados:** `src/lib/estiloDeHombre.js` (la línea del módulo), `src/lib/papelera.js` (dos
  entradas del catálogo), `src/lib/datosEstiloHombre.js` (`estilosFavoritos` lo leen dos módulos),
  `src/App.jsx`, `src/views/EstiloHombreView.jsx`, `scripts/smoke-vistas.jsx`,
  `scripts/test-app-real.mjs`, `scripts/verificar.sh`.

---

## v1.88.0 — EH Fase 25/65: recomendaciones de perfume, ocasiones y rotación

### Qué se ha construido
La segunda mitad del módulo 🌫️ **Perfumes**: **qué ponerse hoy**, por ocasión y por época del año,
con su porqué; *"otra opción"*; la comparación de hasta tres; la rotación; el historial de uso y las
estadísticas. Se llega desde **Más → Estilo de hombre → Perfumes → Recomendaciones**.

La plaquita que en la Fase 24 decía *"llega en la Fase 25"* ahora abre la pantalla de verdad.

### Las decisiones que gobiernan la fase

**1. ⚠️ No es una puntuación: es una explicación.** El apartado 7 dibuja la recomendación con su
porqué —*"encaja con tus preferencias y lo has marcado como adecuado para ocasiones nocturnas"*—, así
que cada motivo es **una frase entera** y se enseñan enlazadas, no como un número ni como etiquetas
sueltas. Un perfume **sin ningún motivo no se propone**: proponerlo sería un ranking disfrazado.

**2. ⚠️ "Otra opción" tiene memoria, y por ocasión** (apartado 8). Descartar un perfume para la noche
**no lo descarta para el trabajo**, porque el descarte se guarda **con la ocasión en la que ocurrió**.
Y **caduca a los 30 días**: *"no repetir continuamente"* no es *"nunca más"*.

**3. ⚠️ "No repetir" BAJA de sitio, no esconde** (apartado 11). Un perfume usado hace poco pierde
posiciones, pero si es el único que encaja **se propone igual, diciendo cuándo lo usó**. Esconderlo
sería decidir por él, y la regla 7 dice que la IA sugiere.

**4. ⚠️ Apagada y vacía son dos cosas distintas.** La rotación y las estadísticas son **opt-in**, con
esas palabras en los apartados 10 y 17 (*"pero solamente si el usuario activa esta función"*): nacen
apagadas y, mientras lo estén, devuelven **`null`, no una lista vacía**. Una lista vacía diría "no
tienes perfumes"; `null` dice "esto no lo has encendido".

**5. ⚠️ La tabla de comparar es la del motor de la Fase 17.** Cuarta del proyecto y ni una línea
nueva de mecánica: el tope de tres, la raya para lo que no se sabe y *"la comparación no elige"* ya
estaban. Lo único de esta fase son **sus cuatro filas**.

**6. ⚠️ Y la compra es la del catálogo global** (apartados 14 y 15): tienda, precio, enlace y
afiliación salen de la ficha de la **Fase 17** por el `productoId`. **Ni un precio guardado aquí**, y
ni un enlace inventado (D2-03).

### Lo que no se inventa
**Sin ni un uso registrado no hay "más utilizado"** (apartado 17): todos empatan a cero y nombrar a
uno sería inventarlo, así que se dice que cuando apunte algo, se verá. Y las cuatro épocas del año de
esta fase **se traducen** a las tres temporadas que ya guardaba la Fase 24 —"entretiempo" no existía
allí— en vez de crear un segundo campo de temporada.

### Verificación
`bash scripts/verificar.sh` — build de Vite, **122 comprobaciones nuevas**, **900 casos de
renderizado** (32 nuevos) y **128 comprobaciones en Chromium** (10 nuevas): se entra en
Recomendaciones, se pide una para una ocasión, sale **con su porqué**, se pide *"otra opción"* y el
descartado deja de salir.

### Archivos
- **Nuevos:** `src/lib/recomendacionesPerfumes.js`, `scripts/test-recomendaciones-perfumes.mjs`.
- **Modificados:** `src/lib/perfumes.js` (las dos partes opt-in y los dos campos nuevos de la ficha),
  `src/views/EstiloHombreView.jsx`, `scripts/smoke-vistas.jsx`, `scripts/test-app-real.mjs`,
  `scripts/test-perfumes.mjs`, `scripts/verificar.sh`.

---

## v1.87.0 — EH Fase 24/65: perfumes y fragancias, el perfil personal

### Qué se ha construido
El módulo 🌫️ **Perfumes**: su perfil de gustos, su colección, la lista de *"quiero probar"* y el
historial. Se llega desde **Más → Estilo de hombre → Perfumes**.

*"La idea no es convertirlo en una tienda de perfumes"*, así que aquí **no hay precios ni tiendas**:
solo lo que él tiene y lo que le gusta. La auditoría lo declara con dos ceros.

### Las decisiones que gobiernan la fase

**1. ⚠️ Los aromas son un dato COMPARTIDO, y se declaran aquí.** El apartado 6 de la **Fase 18**
pregunta *"¿qué tipo de aromas te gustan?"* con casi las mismas opciones, y ésta es la fase dedicada
a las fragancias. Así que `aromasFavoritos` y `aromasQueNoGustan` entran en el **registro de la Fase
4** con `usan: ['perfumes', 'cuerpo', 'productos']`, y la Fase 18 **los leerá** en vez de volver a
preguntarlos. Tercera vez que este registro evita una pregunta repetida **antes** de escribirla.

**2. ⚠️ Lo que NO le gusta pesa tanto como lo que le gusta.** El apartado 3 empieza con *"muy
importante"*: *"esto servirá para **evitar** recomendaciones que no encajen"*. Por eso
`chocaConSusGustos()` existe desde ya, aunque las recomendaciones lleguen en la Fase 25 — y lo dice
**con sus palabras**: *"dijiste que preferías evitar…"*, nunca *"no te gusta"*. Es información suya,
no un juicio nuestro.

**3. ⚠️ "Mi perfume actual" NO es "mi favorito"** (apartado 12, con esas palabras: *"esto no
significa que sea su favorito. Es simplemente el que está utilizando actualmente"*). Son dos campos
distintos y ninguno se deduce del otro. Hay prueba en las dos direcciones, y también en el navegador.

**4. ⚠️ Los perfumes usan el catálogo global** (apartado 17): aquí se guarda lo que es del perfume
—sus aromas, sus ocasiones, su temporada— y **el id** del producto si lo enlazó. Nunca su ficha.

**5. ⚠️ Y el normalizador limpia lo que apunta a la nada.** Borrar un perfume deja de hacerlo "el
actual" y saca su ocasión, en vez de guardar un id colgando que mentiría. Lo mismo con el historial:
el uso se queda, diciendo que ese perfume ya no está, porque **lo que pasó, pasó**.

### Y nada se asume
*"No asumir que todos quieren todas"* (apartado 6): ninguna ocasión viene marcada, ninguna estación
viene elegida, y el perfil entero es opcional. Las recomendaciones llegan en la Fase 25 y su plaquita
**dice en qué fase llega**, en vez de abrir una pantalla vacía (regla 8).

### Verificación
`bash scripts/verificar.sh` — build de Vite, **147 comprobaciones nuevas**, **868 casos de
renderizado** (36 nuevos) y **118 comprobaciones en Chromium**: se llega a Perfumes, se configura, se
añade uno, **se escribe en Supabase**, y al marcarlo como "el que uso ahora" se comprueba que **no
queda marcado como favorito**.

### Archivos
- **Nuevos:** `src/lib/perfumes.js`, `scripts/test-perfumes.mjs`.
- **Modificados:** `src/lib/estiloDeHombre.js` (la línea del módulo),
  `src/lib/datosEstiloHombre.js` (los dos datos compartidos), `src/lib/papelera.js`, `src/App.jsx`,
  `src/views/EstiloHombreView.jsx`, `scripts/smoke-vistas.jsx`, `scripts/test-app-real.mjs`,
  `scripts/verificar.sh`.

---

## v1.86.0 — EH Fase 23/65: higiene bucal y sonrisa

### Qué se ha construido
El módulo 😁 **Sonrisa**, con sus cuatro apartados: 🪥 Higiene diaria, 🦷 Cuidado dental, 📅 Revisiones
y 📈 Seguimiento, cada uno con su interruptor. Se llega desde **Más → Estilo de hombre → Sonrisa**.

### ⏸ Y la Fase 22 se suma a las bloqueadas
Su apartado 1 dice *"dentro de 🧼 **Cuidado personal**"*, que es el módulo `higiene` —justo uno de los
dos en disputa en **C-25**—, y dos de las siete casillas de la Fase 18 son *"Cuidado de manos"* y
*"Cuidado de pies"*, que es exactamente lo que la 22 construye. Sin saber si Higiene y Cuidado
corporal son uno o dos, no se sabe dónde vive ni si sus datos quedarían huérfanos. **Regla 49**: se
anota y se sigue por la 23, que no depende de nada de eso.

### Las decisiones que gobiernan la fase

**1. ⚠️ Un módulo nuevo se añade con UNA LÍNEA.** `MODULOS_EH` gana una entrada con su categoría, su
icono, su fase y sus ocho sinónimos de búsqueda. Ese es el punto de extensión que construyó la Fase 1
—*"añadir un módulo es añadir una línea"*— y no ha hecho falta ni un `case`, ni un `if`, ni un
registro aparte. Hay una prueba que lo comprueba leyendo `estiloDeHombre.js`.

**2. ⚠️ La racha es la GLOBAL, y si no la tiene no se pinta.** El apartado 10 lo dice con esas
palabras: *"como ya existe el sistema global de rachas, **no crear otra racha**… Si no: **no
mostrarla**"*. Así que aquí **no se guarda ni un contador**: se mira si existe una definición suya que
apunte a este módulo y, si no la hay, se devuelve `null`. Ni se le propone crearla.

**3. ⚠️ El cambio de cepillo se SUGIERE, no se agenda** (apartado 6: *"puede sugerir una fecha…
**pero no crear automáticamente una cita**"*). `sugerirCambioCepillo()` propone y no escribe, y
guardarla exige `confirmado`. Octavo `aplicarPlan` del proyecto. Y **cambiarlo de verdad borra el plan
anterior**: avisar de algo que ya hizo sería mentir.

**4. ⚠️ Ni un calendario dental, ni una papelera propia, ni otro inventario.** Tres líneas en
`papelera.js`, una entrada más en `eventosDerivados` y el catálogo global de la Fase 17. Cuarto módulo
de Estilo de Hombre que entra en el calendario general por la misma puerta.

**5. ⚠️ Consejos GENERALES, nunca un diagnóstico** (apartado 11). Son frases fijas, iguales para todo
el mundo, y **no miran sus datos**: eso es justo lo que las mantiene generales. En cuanto los miraran
pasarían a ser instrucciones personalizadas, que es lo que el enunciado prohíbe.

**6. ⚠️ Y la cuenta de la semana se DERIVA** (apartado 9). *"Esta semana: 10 rutinas realizadas"* sale
de lo hecho, no de un contador guardado. Con cero se dice *"todavía no"*, no *"0 rutinas"*.

### 🐛 Un fallo real, cazado por sus propias pruebas
`eventosDeSonrisa` devolvía las revisiones y el cambio de cepillo **sin filtrar por el rango pedido**:
una revisión de octubre aparecía al pedir los eventos de agosto, y el calendario la habría pintado en
el mes equivocado.

### Dos bombas de relojería más, desactivadas
`test-estilo-hombre.mjs` comprobaba `MODULOS_EH.length === 13` **nueve veces** —y su propio Test 7 se
llama *"un estado viejo no se rompe al crecer el catálogo"*—. Ahora comprueba que estén los trece que
escribió Josué en su Fase 2, y compara contra el tamaño real. Y la auditoría de ME F4 no veía el
borrado de Sonrisa porque la colección iba como variable: ahora las tres van con su nombre escrito.

### Verificación
`bash scripts/verificar.sh` — build de Vite, **191 comprobaciones nuevas**, **832 casos de
renderizado** (40 nuevos) y **100 comprobaciones en Chromium**: se llega a Sonrisa, se configura, se
ve que **el seguimiento no tiene plaquita porque viene apagado**, que **no hay racha porque no la
tiene**, se usa la plantilla y **se escribe en Supabase con los recordatorios apagados**.

### Archivos
- **Nuevos:** `src/lib/sonrisa.js`, `scripts/test-sonrisa.mjs`.
- **Modificados:** `src/lib/estiloDeHombre.js` (la línea del módulo), `src/lib/papelera.js`,
  `src/lib/calendarioIntegracion.js`, `src/App.jsx`, `src/views/EstiloHombreView.jsx`,
  `docs/03` (C-25 crece), `scripts/test-estilo-hombre.mjs`, `scripts/smoke-vistas.jsx`,
  `scripts/test-app-real.mjs`, `scripts/verificar.sh`.

---

## v1.85.0 — EH Fase 21/65: rutinas y seguimiento de barba, y tres fallos reales

### Qué se ha construido
Las rutinas de Barba y afeitado, con sus plantillas, su checklist, el seguimiento, el historial y las
sugerencias. Se llega desde **Más → Estilo de hombre → Barba → 🪒 Mi rutina**.

### 🐛 Tres fallos reales, y de dónde salieron

**1. Quien solo marcaba "Barba" no podía crear ninguna rutina.** Las rutinas colgaban de la casilla
*"Afeitado"* del apartado 2 de la Fase 20, cuando el apartado 3 de esta fase dice literalmente
*"RUTINA DE BARBA: si tiene barba, 🧔 Cuidado de barba"*. Ahora `rutinas` es un **interruptor
propio** —que además es el que ya pedía el apartado 16 de la Fase 20— y **elegir las casillas no lo
toca**: volver a elegir qué gestionas no puede apagarte las rutinas por la espalda. `deApartado2`
separa las dos listas.

**2 y 3. `TEXTOS_ESTADO_DIA` son textos, no objetos**, y la pantalla leía `.nombre`: el estado del
día salía **en blanco**, y el barrido de palabras clínicas **no miraba ninguna** de esas etiquetas.
Lo cazó la prueba de navegador, que es exactamente para lo que está.

### Casi todo esto ya existía
Rutinas, plantillas, checklist, omitir, historial, calendario y papelera los construyeron las fases 8
y 14, y `motorRutinas.js` los tiene extraídos desde la 14 justo para esto. Lo propio de esta fase son
sus tres plantillas, sus etiquetas de frecuencia y sus cuatro aspectos. `auditarRutinasBarba()`
declara **ocho ceros**.

### Las decisiones que gobiernan la fase

⚠️ **Omitir es una TERCERA cosa** (apartado 7: *"Omitir hoy. Sin penalización"*): ni hecho ni
pendiente, y **sale de la cuenta del día**. Dos pasos hechos y uno omitido es una rutina **HECHA**.

⚠️ **El perfilado no es una cuarta cosa: es una rutina.** Las cuatro frecuencias del apartado 4 son
las que el motor ya sabe hacer. Un segundo mecanismo de *"cada cuánto"* habría sido el tercero del
proyecto.

⚠️ **Nunca un segundo calendario** (apartado 14) ni **una papelera propia** (apartado 19): dos líneas
de catálogo y una llamada al motor de siempre. Tercer módulo de Estilo de Hombre que entra en el
calendario global por la misma puerta, y **nunca se materializa una ocurrencia**.

⚠️ **Borrar la rutina NO borra su historial.** *"23/08 — Afeitado ⭐ 5/5"* pasó, y sus registros se
quedan huérfanos en vez de desaparecer. Misma decisión que la Fase 11 con los cortes y las citas.

⚠️ **Y sin valoraciones no hay estrella**: `null`, nunca un 0. Ni rachas, ni promedios, ni
porcentajes (D2-02). Las sugerencias del apartado 15 usan el motor de reglas de la Fase 16 —cada una
con su `requiere`— y **ninguna hace nada sola**.

### Una prueba con bomba de relojería, desactivada
`test-papelera.mjs` comprobaba que el catálogo tuviera **exactamente 32** entradas, y saltaba cada
vez que una fase añadía la suya con todo el derecho. Ahora comprueba **que estén las que tienen que
estar**, que es lo que importa.

### Verificación
`bash scripts/verificar.sh` — build de Vite, **155 comprobaciones nuevas**, **792 casos de
renderizado** (36 nuevos) y **78 comprobaciones en Chromium**: se llega a la rutina, se usa la
plantilla de barba —**y no se ofrece la de afeitado, que no marcó**—, se escribe en Supabase con el
recordatorio apagado, y se omite un paso, que **se guarda como omitido y no como hecho**.

### Archivos
- **Nuevos:** `src/lib/rutinasBarba.js`, `scripts/test-rutinas-barba.mjs`.
- **Modificados:** `src/lib/perfilBarba.js` (el interruptor de rutinas), `src/lib/papelera.js`
  (dos líneas de catálogo), `src/lib/calendarioIntegracion.js`, `src/App.jsx` (la papelera global),
  `src/views/EstiloHombreView.jsx`, `scripts/test-papelera.mjs`, `scripts/test-perfil-barba.mjs`,
  `scripts/smoke-vistas.jsx`, `scripts/test-app-real.mjs`, `scripts/verificar.sh`.

---

## v1.84.0 — EH Fase 20/65: barba y afeitado, y una pregunta para Josué

### ⏸ Lo primero: las Fases 18 y 19 están bloqueadas, y no las he resuelto por mi cuenta
Al abrir la Fase 18 (*Cuerpo e higiene*) aparecieron **dos prompts de Josué que dicen cosas
distintas**:

- Su **Fase 2**, en la lista de módulos, pone en 🧴 Cuidado **tres apartados**: *Skincare*,
  **Higiene** y **Cuidado corporal** — dos entradas separadas, cada una con su interruptor.
- El objetivo de la **Fase 18** dice *"la estructura será modular: 🚿 **Cuidado corporal e higiene**,
  y dentro aparecerán pequeñas plaquitas"*, y el apartado 1 de la **Fase 19** lo confirma:
  *"**dentro de** 🚿 Cuerpo e Higiene mostrar 🚿 Mi rutina"*.

Las dos lecturas rompen un prompt suyo: fundirlos **quita un módulo del catálogo que él escribió** y
que lleva en uso desde v1.60.0; mantenerlos separados deja el *"¿Qué quieres utilizar?"* del apartado
1, con sus siete casillas, **sin una pantalla donde vivir**. Es la **regla 49** exactamente: se anota
como **C-25** en `docs/03` con tres preguntas concretas, **se detiene la fase afectada y no la
sesión**, y se sigue por la 20.

*(Y hay un solape añadido que conviene decidir a la vez: dos de esas siete casillas son "Cuidado de
manos" y "Cuidado de pies", y la **Fase 22** se titula "Manos, uñas y pies: configuración".)*

### Qué se ha construido: Barba y afeitado
La entrada opcional, las seis casillas de *"¿qué quieres gestionar?"*, el perfil por secciones, sus
productos y la gestión de apartados. Se llega desde **Más → Estilo de hombre → Barba**.

### Las cinco decisiones que gobiernan la fase

**1. ⚠️ Nada nuevo se construye aquí.** El apartado 17 es una **lista de siete cosas que hay que
reutilizar** —perfil global, productos globales, calendario, recordatorios, favoritos y Eliminados
recientemente— y termina con *"no crear sistemas paralelos"*. Así que la fase es, casi entera,
llamadas: el motor de cuestionarios de la F7, el registro de datos de la F4, los inventarios de F10 y
F17 y los tres niveles de la F6. `auditarBarba()` declara **nueve ceros**.

**2. ⚠️ `sensibilidadPiel` no se vuelve a preguntar.** El registro de la Fase 4 ya la declaraba con
`usan: ['skincare', 'barba', 'productos']` — con **"barba" escrito dentro, siete fases antes de que
existiera este archivo**. Se lee, y la pantalla dice dónde se cambia. Lo que sí es nuevo es
`molestiaAfeitado` (apartado 10), que **no es la misma pregunta**: reaccionar a un producto y
molestarse tras pasar una cuchilla son dos cosas, y se puede tener lo primero sin afeitarse nunca.

**3. ⚠️ Los productos son los del catálogo global, y aquí solo se guardan IDS.** Un aftershave
registrado en Skincare se marca para la barba **sin duplicarse**; desmarcarlo **no lo borra** de su
módulo; y si lo borra allí, **aquí desaparece** — no se queda su nombre huérfano, que sería media
ficha guardada aquí, o sea el segundo inventario por la puerta de atrás.

**4. ⚠️ El formulario adaptativo se amplió EN EL MOTOR, no con un `if`.** El apartado 7 dice *"si
selecciona afeitado"*, y "afeitado" no es una respuesta: es una de las casillas del apartado 2, que
vive en la `config`. Así que `cuando` pasó a recibir **dos** cosas —las respuestas y un contexto del
módulo— y las preguntas de la Fase 13 siguieron funcionando **sin tocar ni una**. Era eso o volver a
meter la condición en el JSX, que es justo lo que la F13 sacó de ahí porque no se puede comprobar.

**5. ⚠️ `frecuenciaDeAfeitado()` es la única respuesta a "cada cuánto"**, como `frecuenciaDeCorte()`
en la F11: *"cuando lo necesito"* **es una respuesta** y no se traduce a días, *"Personalizado"* sin
cifra **no es una frecuencia todavía**, y el choque entre lo del perfil y lo puesto a mano **se
enseña** en vez de resolverse por él. Con las mismas trampas cubiertas: `Number(null)` es 0 y
`Number.isInteger(0)` es `true`.

### Nunca un diagnóstico
Los apartados 10 y 11 lo dicen los dos: *"no diagnosticar"* e *"información declarada por el usuario,
no un diagnóstico médico"*. `PALABRAS_CLINICAS` es **la lista de la Fase 13, importada** —no una
segunda—, y una prueba barre los 82 textos de esta fase. La ayuda de la pregunta de molestias tuvo
que reescribirse porque *"no es un diagnóstico"* **contiene la palabra**: octava vez que una
comprobación de este proyecto salta con algo que estaba bien dicho.

### Y un fallo real, cazado por la regla invariante
Al conectar la pantalla renombré un import y dejé `resumenBarba()` usada sin importar. `vite build`
**pasó igual** —no comprueba identificadores— y en el móvil habría sido un `ReferenceError` en
blanco: exactamente el fallo de `papelera.js` que tuvo la app rota durante meses.
`scripts/test-imports.mjs`, que existe por aquello, lo señaló con nombre y archivo.

### Verificación
`bash scripts/verificar.sh` — build de Vite, **141 comprobaciones nuevas**, **756 casos de
renderizado** (60 nuevos) y **61 comprobaciones en Chromium** sobre la aplicación de verdad: se llega
a Barba, se dice que sí, se dejan marcadas solo las casillas que quiere, **se escribe en Supabase**,
se abre el perfil —**sin las preguntas de afeitado, porque no marcó esa casilla**— y se contesta.

### Archivos
- **Nuevos:** `src/lib/perfilBarba.js`, `scripts/test-perfil-barba.mjs`.
- **Modificados:** `src/lib/cuestionarios.js` (el contexto del módulo en `cuando`),
  `src/views/EstiloHombreView.jsx` (cinco pantallas nuevas y la plaquita),
  `docs/03` (**C-25**), `scripts/smoke-vistas.jsx`, `scripts/test-app-real.mjs`,
  `scripts/verificar.sh`.

---

## v1.83.0 — EH Fase 17/65: productos, farmacia, Amazon y packs de skincare

### Qué se ha construido
El sistema de productos de Skincare, entero: ficha, categorías, tiendas, enlaces, recomendaciones
"Para ti", buscador, filtros, comparación, alternativas, valoración y packs. Se llega desde
**Más → Estilo de hombre → Skincare → 🛒 Productos**.

### Las cinco decisiones que gobiernan la fase

**1. ⚠️ El propio enunciado pedía el motor.** Su condición de finalización lo dice con estas
palabras: *"este sistema debe diseñarse de forma que podamos reutilizar exactamente la misma
arquitectura de productos para Pelo, Cuerpo, Higiene y otros módulos, **evitando crear cinco
catálogos diferentes**"*. La Fase 10 ya la había construido para el pelo, así que lo genérico se
extrajo a **`src/lib/motorProductos.js`** y los dos módulos lo usan. **Las 169 pruebas de la Fase 10
pasaron sin tocar ni una.** Tercer motor extraído de este bloque, después de `motorRutinas.js`
(F14) y `motorRecomendaciones.js` (F16).

Lo que **no** se comparte, a propósito: las categorías y **las filas de la tabla de comparación**.
La Fase 10 dibuja cuatro y la 17 dibuja cinco — son dos tablas distintas en dos enunciados
distintos, y forzarlas a compartir una habría sido inventarse una que no pide ninguno de los dos.

**2. ⚠️ UN inventario, el de la Fase 13.** El apartado 13 dice que *"Ya lo tengo" alimentará la
información de productos del usuario*: esa información **ya existía** —`datosPiel().productos`, que
creó F13 y usa F14 para enganchar productos a los pasos de una rutina—. Esta fase **la amplía**, no
crea otra. Hay una prueba de que un producto creado aquí lo ve `productosDePiel()` de la Fase 14.

**3. 🐛 Y ahí saltó el fallo de normalizador por DECIMOCTAVA vez, y de los caros.** `normalizarPiel`
recortaba cada producto a `{ id, nombre }`, que es lo que guardaba la Fase 13. Con la regla 5
(`saveData` sobrescribe), el siguiente guardado se habría llevado por delante marca, categoría,
precio, tiendas, objetivos, tipos de piel y valoración: la ficha entera, en silencio. Arreglado, con
cuatro pruebas que normalizan dos veces seguidas. `packs` también se declaró en `DEFAULT_PIEL`.

**4. ⚠️ El catálogo está VACÍO, y es D2-03.** *"Amazon: arquitectura sí, afiliación no. Ni catálogo,
ni productos, ni API, ni cuenta de afiliados inventados."* Se ha construido la arquitectura entera
—ficha, cinco tipos de tienda, enlace de afiliado, aviso de transparencia, packs, comparación,
alternativas, filtros y buscador— y **todo producto que existe lo ha metido él**. La pantalla lo
dice con una frase en vez de fingir una tienda. Y **nunca un enlace inventado** (apartado 4): una
"url" que no lo es se guarda como `null` y se dice que no hay enlace, en vez de fabricar una
búsqueda de Amazon "por si acaso".

**5. ⚠️ Amazon no es una limitación** (apartados 5 y 6). Un producto que solo está en la farmacia se
recomienda igual, y *"Disponible en farmacia"* es una respuesta completa aunque no haya ningún
enlace. El aviso de afiliación sale **solo donde hay afiliación** —ponerlo donde no la hay es tan
poco honesto como quitarlo donde sí—, y el usuario ve siempre la misma etiqueta: *"Ver producto"*.

### Y el apartado 22, que es el que cierra
*"Nunca comprar. Nunca añadir al carrito externamente. Nunca elegir por el usuario."* Cinco pruebas
sobre el código y tres ceros declarados en la auditoría. `packSugeridoPiel` **sugiere y no escribe**
—la prueba serializa el estado antes y después—, igual que `aplicarARutina`: es el sexto
`aplicarPlan` del proyecto.

### Un fallo de verdad, encontrado de paso
`CATALOGO_VACIO_PORQUE` estaba escrita **dos veces, palabra por palabra**, en `productosPelo.js` y
en `productosPiel.js`. Se mudó al motor, donde vive la decisión. Al hacerlo apareció un fallo real
que cazaron las pruebas de renderizado: **`export … from` no crea binding local**, así que el propio
archivo la usaba sin tenerla, y cuatro pantallas de Pelo reventaban con
`CATALOGO_VACIO_PORQUE is not defined`. Se importa y se reexporta la variable.

### Verificación
`bash scripts/verificar.sh` — build de Vite, **199 comprobaciones nuevas** en
`scripts/test-productos-piel.mjs`, **696 casos de renderizado** (13 nuevos, incluidos los de la
Fase 16, que no tenía ninguno) y **41 comprobaciones en Chromium** sobre la aplicación de verdad: se
llega a Productos desde Más → Estilo de hombre → Skincare, se crea un producto con su categoría y su
farmacia, **se escribe en Supabase con la ficha entera** y la pantalla lo enseña.

### Archivos
- **Nuevos:** `src/lib/motorProductos.js`, `src/lib/productosPiel.js`,
  `scripts/test-productos-piel.mjs`.
- **Modificados:** `src/lib/perfilPiel.js` (el normalizador y `DEFAULT_PIEL`), `src/lib/rutinasPiel.js`
  (la parte `productos` y su plaquita), `src/lib/productosPelo.js` (delega en el motor),
  `src/views/EstiloHombreView.jsx` (`ProductosPielEH` y su sitio en `PanelPiel`),
  `scripts/smoke-vistas.jsx`, `scripts/test-app-real.mjs`, `scripts/verificar.sh`.

---

## 🚨 v1.82.0 — LA APLICACIÓN NO ARRANCABA. Dos fallos fatales, y EH Fase 16/65

### Lo primero, porque es lo que importa
Josué dijo que **por más fases que se construyeran, al abrir la aplicación la veía prácticamente
igual**. Tenía razón, y la causa no era la documentación: **la aplicación no funcionaba**. Dos
fallos, los dos fatales, los dos invisibles para las 5 844 comprobaciones que había.

**1. `App.jsx` nunca importó `papelera.js`** (desde ME F3, v1.25.0). `purgarCaducados(...)` lanzaba
un `TypeError` **en mitad de la carga de datos**, y no hay `try/catch` en toda esa ruta. Todo lo que
venía después no llegaba a ejecutarse:

```
  línea 456   purgarCaducados(...)        ← TypeError
  línea 457   setPapelera(...)            ← nunca
  línea 464   setArmario(...)             ← nunca
  línea 471   setHorarioTop(...)          ← nunca
  línea 472   setEstiloHombre(...)        ← nunca
```

**Ningún módulo de la Entrega 2 cargaba sus datos guardados.** Cada arranque los dejaba en su valor
por defecto: por eso todo salía "sin configurar" y por eso lo que Josué configuraba parecía
desaparecer al recargar.

**2. Cinco hooks estaban DESPUÉS de los `return` condicionales de `App.jsx`** — la regla 4 del
proyecto, rota otra vez. En el primer render `session` es `undefined` y se sale por
`<LoadingScreen />`, así que esos hooks no se ejecutan; en cuanto llega la sesión, React encuentra
cinco hooks más que la vez anterior y lanza **"Rendered more hooks than during the previous
render"**, que **tumba la aplicación entera**.

Los dos están arreglados. Comprobado abriendo la aplicación en un navegador de verdad.

### ⚠️ Por qué ninguna prueba lo veía, y qué se ha hecho al respecto
**`App.jsx` no se renderizaba en ninguna prueba.** El build no comprueba identificadores, y las 648
pruebas de renderizado montan las *vistas*, no la aplicación — porque `App.jsx` necesita Supabase y
un navegador.

Ahora sí: **`scripts/test-app-real.mjs`** arranca Vite, abre la app en Chromium con la sesión y las
respuestas de Supabase simuladas, y comprueba la cadena entera:

**arranca → carga lo guardado → se llega al módulo → se toca → se guarda → se ve.**

25 comprobaciones, incluidas dos que existen solo para estos dos fallos: que no aparezca *"Rendered
more hooks"* y que no haya ningún *"is not a function"*. Playwright **no es dependencia del
proyecto** (Vercel no debe instalarlo): si no está, la prueba se salta con un aviso.

Y **`scripts/test-imports.mjs`**, la regla invariante que encontró el primer fallo, recorre los
1 319 nombres que exporta `src/lib/` y comprueba que los 38 archivos de `src/` importen los que usan.

### Lo que esto significa para las fases anteriores
**Estaban bien construidas.** Se ha comprobado en el navegador: Estilo de Hombre se abre desde Más,
carga los módulos que había guardados, el panel de Pelo enseña sus seis plaquitas (F7 a F12),
Peluquería abre con su frecuencia y su planificación, "Mi estilo de corte" está dentro, y registrar
un corte **escribe en Supabase y se ve en pantalla**. Lo que fallaba era el arranque, no las fases.

### EH Fase 16/65 — Skincare: motor de recomendaciones
Tercera fase que necesitaba reglas con `requiere`/`cuando`/`porque`: la 9 lo construyó para el pelo,
la 12 escribió su propia copia del mismo `if`, y ésta era la tercera. Lo genérico se ha extraído a
**`motorRecomendaciones.js`** y las tres lo usan — **las 146 pruebas de F9 y las 209 de F12 pasaron
sin tocar ni una**.

- ⚠️ **La aplicación nunca modifica la rutina** (apartados 4 y 11): `anadirARutina` exige
  `confirmado: true`, y calcular no escribe. Quinto `aplicarPlan` del proyecto.
- ⚠️ **La prioridad la marca él** (apartado 2) y pesa **sin tapar el resto**.
- ⚠️ **El nivel se respeta** (apartado 7); sin nivel elegido, se enseña todo.
- ⚠️ *"No quiero recomendaciones similares"* **calla el tema entero**, que es lo que significa.
- ⚠️ **Apartado 16**: seis pruebas de "sin IA" sobre el código, y cuatro ceros declarados.

### Y una prueba con fecha de caducidad, arreglada
`test-peluqueria.mjs` comparaba el "Hoy" de `registrarCorte` contra una fecha fija: pasaba el día que
se escribió y fallaba al siguiente. Ahora compara contra `todayISO()`, sea el día que sea.

### Verificación
`bash scripts/verificar.sh` — **6030 comprobaciones**, todas correctas: build de Vite, 160 nuevas
para EH F16, 648 casos de renderizado, 11 reglas invariantes y **25 comprobaciones sobre la
aplicación de verdad, en Chromium**.

## Entrega 2 · EH Fase 15/65 — Skincare: seguimiento y evolución (v1.81.0)

### 🐛 Un fallo real y grave, encontrado de paso: `App.jsx` nunca importó `papelera.js`
Al enganchar los registros de piel a la papelera desde `App.jsx`, escribí la llamada y **me olvidé
del import**. Como eso no lo ve nadie —JavaScript no comprueba los identificadores al compilar, y
`App.jsx` no se renderiza en las pruebas porque necesita Supabase— se ha escrito una **regla
invariante** que sí lo ve: `scripts/test-imports.mjs`.

En su primera ejecución encontró cinco cosas. Una era mía. **Las otras cuatro llevaban ahí desde
ME F3:** `DEFAULT_PAPELERA`, `purgarCaducados`, `prepararEliminacion` y `prepararRestauracion` se
usan en `App.jsx` **y nunca se importaron**.

`DEFAULT_PAPELERA` se usa en un `useState` de la línea 262, así que **la aplicación lanzaba un
`ReferenceError` en el primer render**. Es el tipo de fallo que sólo aparece en el iPhone de Josué, al
abrir la app — el peor sitio posible para descubrirlo.

Corregido con una línea. Y la regla se queda: recoge los 1319 nombres que exporta `src/lib/` y
comprueba, para cada uno de los 38 archivos de `src/`, que los que use estén importados ahí.

### ⚠️ No se crea otro diario
El apartado 11, con esas palabras: *"como ya existe el Diario general de JC Fitness, **NO** crear
otro diario de skincare"*.

Aquí solo viven *"los datos específicos necesarios para este módulo"*: una valoración, unos aspectos
y una nota corta —280 caracteres a propósito, porque el sitio para escribir es el Diario—. Hay una
prueba que lee este código y falla si aparece la palabra.

### ⚠️ No se crea otra papelera
El apartado 13: *"si JC Fitness ya tiene Eliminados recientemente, utilizar ese sistema en lugar de
crear otro"*. Y no hizo falta tocar el motor de ME F3: es genérico sobre la lista que se le pasa, así
que bastó con **una línea en `CATALOGO_PAPELERA`** — exactamente lo que ese archivo decía que haría
falta.

El borrado sale por `eliminarConPapelera`, la única puerta de borrado de la app. Cuando fue por un
atajo, **la auditoría de ME F4 lo cazó** —*"el catálogo describe colecciones sin borrado real"*— y
tenía razón: una colección en el catálogo sin un borrado visible es una entrada que nadie puede
comprobar.

### ⚠️ No se registra cada día
El apartado 9, que el propio enunciado marca como *"esto es importante"*: *"no crear 🔴 has perdido
tu racha, ni exigir registros diarios"*.

**Un día sin registrar no existe.** No es un cero, no se cuenta y no se menciona. Siete pruebas
barren todos los textos buscando "racha", "has perdido", "has fallado", "constancia" y "cada día", y
`resumenSeguimientoPiel` devuelve `racha: null` a propósito, con una prueba de que no hay ningún
cálculo de racha en el archivo.

### ⚠️ Las tendencias nunca afirman una causa
Apartado 7: *"no afirmar que un producto ha causado un resultado"*. Apartado 12: *"pero no establecer
causalidad médica. Simplemente mostrar los datos registrados."*

Se enseña *"Hidratación ↑ Mejorando"* y *"Desde que empezaste a utilizar X has registrado 4
valoraciones"*, y ahí se para — con una prueba que busca "gracias a", "ha mejorado tu", "funciona",
"ha causado", "provoca", "cura" y "por culpa".

**Con menos de cuatro registros no se afirma nada**, con la frase literal del apartado 8: *"todavía
no hay suficientes registros para mostrar una evolución"*. Y esa frase dice que faltan **datos**, no
que él haya fallado — hay una prueba de eso también.

**Medio punto de margen** para llamar a algo "mejorando": sin él, una diferencia de 0,1 entre cinco
registros se anunciaría como una mejora que no existe.

### ⚠️ Sin fotos y sin exportación propia
Apartado 10: nada de fotos, ni ahora ni como obligación. Apartado 14: *"no crear un sistema de
exportación independiente"* — `datosParaExportar()` **prepara** los datos con `exporta: false`
escrito en el propio dato, y no hay nada en el archivo que descargue.

### Un fallo propio, cazado por la prueba
`evolucionPiel` hacía `{ id: a.id, nombre: a.nombre, ...tendencia(t) }`, y **la tendencia también
tiene `id` y `nombre`** —'sube' y 'Mejorando'—, así que el spread se llevaba por delante los del
aspecto: la hidratación pasaba a llamarse "sube". Ahora los campos se copian uno a uno.

### Verificación
`bash scripts/verificar.sh` — **5844 comprobaciones**, todas correctas: build de Vite,
121 nuevas en `scripts/test-seguimiento-piel.mjs` (los trece tests del apartado 16 que no son
"comprobar móvil"), **648 casos de renderizado** (16 nuevos) y **una regla invariante nueva**.

⚠️ Y **la sexta vez en este bloque que una comprobación salta con algo que estaba bien**: los
barridos de "esto no existe" cazaban su propia evidencia (`fotos: 0` y `diariosNuevos: 0` viven
dentro de la función de auditoría), y el primer barrido de imports dio un falso positivo con la
cadena *"Mano dominante (opcional)"*. Mirar qué línea hace saltar la prueba antes de tocar el código.

## Entrega 2 · EH Fase 14/65 — Skincare: rutinas y cuidado diario (v1.80.0)

### ⚠️ El apartado 19 se titula "NO DUPLICAR", y esta fase pedía la máquina que ya existía
Pasos, frecuencia, lista del día, historial y eventos de calendario: exactamente lo que la **Fase 8**
construyó para el pelo, otra vez para la piel.

Copiar `rutinasPelo.js` habría sido el segundo sistema de siempre —y, peor, el segundo sitio donde
arreglar el mismo fallo—. Así que lo genérico se ha extraído a **`src/lib/motorRutinas.js`**, y los
dos módulos lo usan: Pelo pasa su catálogo de pasos, Skincare el suyo, y **el cálculo de qué toca hoy
es uno solo**.

**Las 171 pruebas de la Fase 8 son la red que demuestra que la extracción no cambió nada.** Pasaron
sin tocar ni una.

### ⚠️ La lista de frecuencias es de cada módulo; el comportamiento es del motor
La Fase 8 ofrecía cinco opciones y esta pide seis —*"Diario, Días concretos, Varias veces por semana,
Semanal, Cada X días, Personalizado"*—, pero **debajo solo hay cuatro reglas distintas**: todos los
días, unos días de la semana, cada X días, y ninguno por su cuenta.

*"Días concretos"*, *"varias veces por semana"* y *"semanal"* son tres formas de decir lo mismo. Se
guarda con su id propio —Josué eligió esa palabra y esa palabra se conserva— y cada una declara **de
qué tipo es**. Hay una prueba de que Pelo y Skincare dan **la misma respuesta al mismo caso**.

### ⚠️ Omitir no es fallar
El apartado 10: *"Un usuario puede decidir: 'hoy no quiero hacer este paso'. Debe poder marcarlo como
Omitir hoy. **Sin penalización**."*

Un paso omitido es una **tercera cosa**: no pendiente —eso sería el reproche que el apartado
prohíbe— y no hecho —eso sería mentir—. **Sale de la cuenta del día**, así que una rutina de tres
pasos con uno omitido y dos hechos está **hecha**, no a medias.

Y un paso no puede estar hecho y omitido a la vez: marcar quita lo uno, omitir quita lo otro.

### ⚠️ Los productos son los de la Fase 13
Apartados 6 y 19: *"si todavía no existe: + Añadir producto. **No crear un segundo inventario**."*

Un paso guarda el `id` de un producto que ya vive en el perfil de piel, y *"+ Añadir producto"*
**escribe allí** y luego lo engancha: dos escrituras, un solo inventario. Hay una prueba que lee este
código y falla si aparece una lista de productos propia.

### ⚠️ Las plantillas sugieren, no crean
Apartado 12: *"son plantillas, no obligaciones"*. Apartado 13: *"el usuario debe confirmar: Usar esta
rutina"*.

`plantillaSugerida()` devuelve una propuesta con `guardado: false` escrito en el propio dato y **no
escribe nada** —la prueba serializa el estado antes y después—. Crearla es `usarPlantilla()`, que
**sin `confirmado` no hace nada**. Cuarto `aplicarPlan` del proyecto, tras HT F9, EH F9 y EH F12.

Y la propuesta se adapta al perfil, que es lo que pide el apartado 13: si ha dicho que no usa
protección solar, ese paso no aparece en la propuesta. **Sin nivel elegido no se propone ninguna**:
elegir una por él sería decidir por él.

### ⚠️ Cambiar de nivel no borra la rutina anterior
El apartado 14, con esas palabras: *"cambiar de nivel no debe borrar la rutina anterior. Simplemente
modifica las opciones que se muestran."*

El nivel filtra **lo que se ofrece**, no lo que existe. Hay una prueba que crea una rutina con pasos
avanzados, baja el nivel a básico y cuenta las rutinas y los pasos antes y después.

**Sin nivel elegido se ofrece todo**: esconder opciones a quien no ha dicho nada es decidir por él.

### El seguimiento es una frase
Apartado 16: *"con información sencilla… no hace falta llenar la pantalla de estadísticas"*. Así que
es exactamente eso: *"Esta semana: 3 rutinas realizadas."*

Sin porcentajes, sin rachas, sin comparación con la semana pasada — con una prueba que busca todo
eso en el texto. Y **sin días en los que tocara no hay cumplimiento**, ni 0 ni 100, como en la Fase 8.

### El calendario es el que ya existe
Apartado 17: *"no crear un calendario de skincare independiente"*. Entra por `eventosDerivados`, con
la misma forma de evento que el Armario y las rutinas de pelo.

Un año de eventos no guarda ni una fecha (regla 11), y **ninguno es anterior al día en que la creó**:
una rutina no existe antes de existir.

### Verificación
`bash scripts/verificar.sh` — **5707 comprobaciones**, todas correctas: build de Vite,
148 nuevas en `scripts/test-rutinas-piel.mjs` (los diecisiete tests del apartado 20) y **632 casos de
renderizado** (28 nuevos). Y, sobre todo, las **171 de la Fase 8 intactas** tras el refactor.

## Entrega 2 · EH Fase 13/65 — Skincare: perfil de piel y configuración inicial (v1.79.0)

Empieza el bloque de Skincare, *"uno de los apartados importantes de Estilo de hombre"*. El enunciado
pone las reglas antes de pedir nada: **sin IA, sin diagnósticos médicos, el usuario decide siempre,
todo es opcional.**

### ⚠️ El apartado 15 ya era código, y ya estaba escrito
*"Antes de preguntar: comprobar la información ya registrada. Si un dato compatible ya existe:
reutilizarlo. No preguntar dos veces."*

**El registro de la Fase 4 ya declaraba `tipoPiel` y `sensibilidadPiel` como datos de esta fase**
(`desde: 13`), compartidos con Productos, Barba y Cuerpo — más `sinPerfume`, que usan Cuerpo y
Productos. Así que esas tres respuestas van solas a la capa compartida: **no hay un `if` que lo
decida**, lo decide `destinoDe()` mirando el registro.

Y funciona en las dos direcciones, con prueba: un `tipoPiel` que guardó Productos aparece aquí ya
contestado, y contestarlo aquí lo deja donde los demás módulos lo encuentran.

Esto es la diferencia entre una regla escrita en un documento y una regla que es una función. La
Fase 4 la escribió hace nueve fases; esta es la primera que la cobra entera.

### ⚠️ El formulario adaptativo vive en el motor, no en la pantalla
El apartado 14 pide *"no mostrar preguntas irrelevantes"*, con su ejemplo: *"si el usuario dice 'no
utilizo productos', no mostrar inmediatamente 15 preguntas sobre productos"*.

Se le ha añadido `cuando` a la forma de una pregunta y `preguntasVisibles()` / `progresoVisible()` a
`cuestionarios.js`. **Barba, Cuerpo, Manos y Perfumes van a querer exactamente lo mismo**, y una
pregunta que se esconde con un `if` en el JSX es una pregunta que nadie puede comprobar.

Cuatro de las trece preguntas están condicionadas, y el ejemplo del enunciado es una prueba.

### ⚠️ Y esconder no es borrar
Si dice que no usa productos, esas preguntas desaparecen **y sus respuestas de antes siguen
guardadas**; si mañana dice que sí, reaparecen contestadas. Es la regla 5 otra vez, aplicada a lo que
se ve en lugar de a lo que se guarda — y es lo que separa un formulario adaptativo de uno que castiga
por cambiar de opinión.

**El progreso cuenta lo visible.** Decirle *"has contestado 4 de 13"* de un formulario donde cuatro
preguntas no le aplican sería una nota inventada.

### ⚠️ Objetivos de cuidado, nunca un diagnóstico
El apartado 4 lleva la advertencia dentro: *"estas opciones son objetivos de cuidado, **no
diagnósticos**"*. Y el objetivo de la fase lo repite: *"sin diagnósticos médicos"*.

Por eso la pregunta es *"¿Qué te gustaría mejorar o cuidar?"* y **no** *"¿qué te pasa?"*. Hay una
prueba que recorre **todos** los textos de la fase —títulos, ayudas, opciones, secciones, frases—
buscando veinte palabras clínicas, y otra que comprueba que en ningún sitio se le pregunta qué le
pasa.

### ⚠️ Apartado 17 — esto no sale de aquí
*"Toda la información debe permanecer dentro del sistema de usuario. No enviar estos datos a una IA.
No crear perfiles externos."*

Siete pruebas sobre el código buscan `askAI`, `AI_SYSTEM`, `anthropic`, `fetch(`, `XMLHttpRequest`,
`openai` y `supabase`. El contexto que este módulo entrega a las fases 14-17 lleva `paraIA: false`
escrito en el propio dato, y `auditarPiel()` devuelve `perfilesExternos: 0`.

### Los niveles 🟢🟡🔴, otra vez importados
El apartado 9 lo dice literalmente: *"esto conecta directamente con el sistema de niveles"*. Así que
`COMPLEJIDADES_PIEL` toma los ids y los iconos de `NIVELES_ESTILO` (F6) con los nombres del enunciado
—Básica / Intermedia / Completa—. Segunda fase seguida que lo hace.

### Y una duplicación que NO lo era
El apartado 8 pregunta cuánto tiempo quiere dedicar a su cuidado, y se parece mucho a la del apartado
5 de la Fase 12, que sí resultó ser una repetición. **No lo es:** allí las opciones eran menos de 5 /
5–10 / 10–20 / más de 20 minutos y hablaban del pelo; aquí son menos de 2 / 2–5 / 5–10 / más de 10 y
hablan de la piel. Otra escala, otro asunto, otra pregunta — y hay una prueba que compara las dos
listas para dejarlo dicho.

### ⚠️ Lo que esta fase NO construye
El enunciado cierra con *"todavía no implementar esas funciones dentro de esta fase"*, refiriéndose a
rutinas, seguimiento, recomendaciones, productos, packs e integración.

`auditarPiel()` devuelve cinco ceros, y cinco pruebas buscan `crearRutina`, `recomendar`, `CATALOGO`,
`crearPack` y `aplicarA` en el archivo. Un producto aquí **es un nombre**: ni marca, ni precio, ni
tienda, ni valoración. Y la pantalla dice en qué fases llega lo demás, en vez de "próximamente"
(regla 8).

### Un vocabulario de estado, no dos
Sobre la marcha, el módulo tenía `estadoPerfilPiel` devolviendo las palabras del motor (`contestado`)
y `estadoDeEntrada` devolviendo las suyas (`configurado`). Dos nombres para lo mismo dentro del mismo
archivo es cómo se acaba comparando contra la palabra equivocada, así que se ha quedado uno: el que
sabe de *"Ahora no"* (apartado 1), que el motor no puede conocer.

### Verificación
`bash scripts/verificar.sh` — **5531 comprobaciones**, todas correctas: build de Vite,
227 nuevas en `scripts/test-perfil-piel.mjs` (los doce tests del apartado 18 que no son "probar
móvil") y **604 casos de renderizado** (28 nuevos).

## Entrega 2 · EH Fase 12/65 — Peluquería: cortes, preferencias y recomendaciones (v1.78.0)

### ⚠️ El apartado 5 ya estaba contestado, y no se vuelve a preguntar
El apartado 5 pide preguntar *"¿Cuánto tiempo quieres dedicar a peinarte?"* con cinco opciones:
menos de 5 min, 5–10, 10–20, más de 20, me da igual.

**La Fase 7 ya hizo esa pregunta** (`tiempoPelo`) **con esas cinco opciones exactas**, y dejó escrito
para qué servía: *"así las recomendaciones futuras no propondrán una rutina de 20 minutos a alguien
que quiere tardar 3"*. Esta fase la quiere justamente para eso.

Volver a preguntarla habría dejado a Josué con **dos respuestas a la misma pregunta y ninguna forma
de saber cuál manda** — que es exactamente el fallo que el apartado 10 de la Fase 1 existe para
evitar, y que en este proyecto ya es código (`FUENTES_GLOBALES`, `esDatoGlobal()`, `destinoDe()`).

Así que se **lee** de allí, y la pantalla dice dónde se cambia: *"lo dijiste en Pelo → Mi pelo, ahí
se cambia"*. Cuatro pruebas lo sostienen: que la pregunta de F7 tiene esas cinco opciones, que F12
**no** la repite, que no la repite con otro nombre, y que lo contestado allí llega hasta aquí.

**Queda anotado como D-15 en `docs/03`.** No activa la regla 49: esa regla detiene una fase ante una
*contradicción* sin decisión tomada, y aquí no hay contradicción —los dos enunciados quieren lo
mismo— ni falta decisión.

⚠️ **Consecuencia visible para Josué: el perfil de corte tiene seis preguntas, no siete. La séptima
no falta — ya está contestada.**

### ⚠️ Los niveles 🟢🟡🔴 se importan de la Fase 6
El apartado 6 pide tres niveles de mantenimiento con esos tres iconos. `NIVELES_ESTILO` (F6) ya es
esa escala, y las fases 9, 18 y 22 la comparten.

`NIVELES_MANTENIMIENTO` toma **sus ids y sus iconos** —para que un nivel siga significando lo mismo
en todo el proyecto— con **los nombres que escribió Josué**: Bajo / Medio / Alto, no Básico /
Intermedio / Avanzado. Reescribir la escala habría creado dos escalas de tres niveles.

### Añadir un corte es añadir una línea
Mantenimiento, minutos, longitudes, tipos de pelo y estilos compatibles van EN LA LÍNEA del catálogo,
como `MODULOS_EH` en la Fase 1 y `REGLAS_PELO` en la Fase 9. El motor no lleva un `if` por corte.

Y *"la lista debe ser ampliable"* (apartado 3) es ampliable de verdad: los cortes que añade Josué
salen mezclados con los nueve del enunciado **y llegan hasta la pregunta de estilos**, porque la
pregunta lee el catálogo en vez de una copia congelada al importar el archivo.

### ⚠️ Nada sin confirmar
El apartado 18 enumera cinco cosas que la aplicación nunca hace sola: cambiar el corte actual, crear
una cita, modificar el calendario, añadir un producto y cambiar preferencias.

Mirar recomendaciones, comparar, ver patrones y abrir el panel **no cambian ni un byte del estado**,
con una prueba que lo serializa antes y después. Guardar un favorito, fijar el corte actual y marcar
un objetivo son tres llamadas distintas, y las hace él.

Y una que no es obvia: **el corte que ya lleva no se le recomienda**. Eso no es una recomendación.

### ⚠️ El historial no diagnostica
El apartado 15 pide detectar patrones *"sin presentarlo como diagnóstico ni como una conclusión
absoluta"*. Con **un** corte valorado bien no se afirma nada; hacen falta dos, y entonces la frase es
la del enunciado: *"parece que este estilo encaja bastante con tus preferencias"*.

Misma disciplina que `frecuenciaReal` (F11), la analítica del Horario (HT F11) y las estadísticas del
Armario (AR F4). Y un corte que **no** le gustó no entra en el patrón por mucho que se repita.

### Sin IA, y sin "el mejor corte para ti"
Como la Fase 9, comprobado sobre el código: seis pruebas buscan `askAI`, `anthropic`, `fetch(`,
`XMLHttpRequest` y `openai`.

La frase que el enunciado prohíbe expresamente —*"este es el mejor corte para ti"*— tiene su propio
guardián, porque no lleva ninguna palabra de la lista de la Fase 9. Todos los textos que el motor
puede generar se comprueban contra **las dos** listas.

### El objetivo entra en el evento que ya existe
*"🎯 Quiero probar"* (apartado 12) sale en el calendario dentro de la `notas` de la cita de la Fase
11 — no en una clave nueva, que rompería la forma común con los eventos del Armario y las rutinas, y
desde luego no en un segundo evento (apartado 6). Y lleva su nombre encima, así que borrar el corte
del catálogo no lo deja apuntando a un fantasma.

### ⚠️ El normalizador, décima vez — y otra vez cazado en el mismo turno
`normalizarPelo` no conocía el campo `corte`, así que **lo descartaba en cada lectura**: añadir un
corte y guardar una referencia no tenían ningún efecto. Lo encontró la prueba en el mismo turno en
que se introdujo, como en las fases 9, 10 y 11.

`corteId`, `valoracion` (en `normalizarCorte`) y `objetivo` (en `normalizarPeluqueria`) son el
undécimo, duodécimo y decimotercero.

### Verificación
`bash scripts/verificar.sh` — **5276 comprobaciones**, todas correctas: build de Vite,
209 nuevas en `scripts/test-cortes-pelo.mjs` (los doce tests del apartado 19, más el apartado 5, más
el apartado 18 byte a byte) y **576 casos de renderizado** (24 nuevos).

**Y dos comprobaciones de fases anteriores que saltaron con algo que estaba bien:** la cuenta exacta
de colecciones de `DEFAULT_PELO` (F8) y la de llaves de `DEFAULT_PELUQUERIA` (F11), las dos ampliadas
legítimamente por esta fase. La segunda se ha reescrito para comprobar **lo que de verdad guarda**
—que `cortes` y `cita` sigan siendo dos cosas— en vez de contar llaves. Quinta vez en este bloque.

## Entrega 2 · EH Fase 11/65 — Peluquería: calendario y seguimiento de cortes (v1.77.0)

### ⚠️ La decisión que gobierna la fase entera
El apartado 15, literal: *"Esto eliminará el evento del calendario, **pero no el historial del
corte**."*

Un corte planificado y un corte que ocurrió **no son la misma cosa**, así que no viven en la misma
lista. `cortes` es la historia; `cita` es el plan. Borrar la cita no puede tocar un corte **porque
no tiene manera de hacerlo**, y hay una prueba que cuenta los cortes antes y después de borrarla.

Un solo array con un campo `hecho` habría puesto las dos cosas a un `filter` de distancia, y ese
`filter` habría llegado tarde o temprano.

### ⚠️ Una sola respuesta a "cada cuánto te lo cortas"
`frecuenciaDeCorte()` hace exactamente lo que `tallaDe()` en la Fase 5: **lo que ya contestó en el
perfil capilar (F7) manda**, lo que ponga a mano rellena el hueco, y **si los dos existen y no
coinciden se enseña el choque** en vez de elegir en silencio.

*"Cuando lo necesito"* es una respuesta legítima que sencillamente no permite calcular una fecha. Se
dice —*"sin frecuencia fija"*— y **no se inventa una por defecto**: un valor puesto para llenar el
hueco habría empezado a proponer fechas que él nunca pidió.

### ⚠️ Sugerir no es reservar
`sugerirProximoCorte()` devuelve *"tu próximo corte podría ser alrededor del…"* con `guardado: false`
escrito en el propio dato. Guardarlo es `planificarCorte`, y esa la llama él tocando un botón.

Tercera vez que aparece el mismo patrón: `aplicarPlan` (HT F9), `aplicarARutina` (EH F9) y ahora
esto. El apartado 16 lo pide con esas palabras: *"no reservar ni crear automáticamente nada sin que
el usuario lo confirme"*.

### ⚠️ Decide aquí, manda `notificaciones.js`
`avisoDeCorte()` dice **qué habría que avisar y cuándo**; quien emite sigue siendo el emisor único
del proyecto, con su permiso, su interruptor global y su horario de descanso. Mismo reparto que
`avisosHorario.js` en el Horario. Un segundo emisor daría dos avisos.

El recordatorio **nace apagado** (apartado 5: *"nunca activarlos de forma invasiva"*), y el apartado
13 se cumple literalmente: **el calendario funciona sin recordatorios**, son dos cosas
independientes, y la pantalla lo dice — *"salga o no el aviso, el corte sigue en tu calendario"*.

### Desactivar oculta, no borra
`impactoDesactivarPeluqueria()` avisa de la cita futura **antes** de apagar y devuelve
`seBorraAlgo: false`. Reactivar lo devuelve todo: historial, sitios, preferencias y la propia cita.
Es el apartado 14, y es también la regla de siempre: apagar no es cancelar.

### Los sitios no son un sistema de reservas
El apartado 12 lo dice: *"no crear todavía un sistema completo de reservas de peluquería"*. Así que
un sitio es **un nombre, un lugar y una nota**. Ni horarios, ni teléfonos, ni disponibilidad. Y la
pantalla lo dice —*"aquí solo se apunta dónde vas"*— en vez de dejar un botón muerto (regla 8).

Borrar un sitio **desengancha** los cortes que lo usaban; no los borra.

### El calendario que ya existe
`eventosDePeluqueria()` devuelve el evento con la misma forma que los del Armario y los de las
rutinas de F8, y entra por `eventosDerivados` como todo lo demás: **derivado y de solo lectura**
(regla 11). **Una cita, no una serie** — el próximo corte es un plan concreto, así que a diferencia
de las rutinas no necesita rango. Hay cinco comprobaciones sobre el enchufe en sí, no sobre la
función: `eventosDePeluqueria` puede funcionar perfectamente y no salir en ningún sitio si nadie la
llama.

### Dos fallos silenciosos que encontró la prueba
1. **`planificarCorte({modo: 'semanas'})` sin cantidad planificaba el corte para HOY.** `Number(null)`
   es `0` y `Number.isInteger(0)` es `true`, así que la comprobación pasaba y `addDays(hoy, 0)`
   devolvía hoy. Sin error, sin aviso: una cita para esta tarde.
2. **`'25:99'` encajaba con `/^\d{2}:\d{2}$/`** y se guardaba como hora de la cita. La forma no
   basta: ahora se comprueban las horas y los minutos.

### La frecuencia real, derivada
`frecuenciaReal()` mira los intervalos entre cortes y dice *"de media te lo cortas cada N semanas"*.
**Con menos de dos intervalos no afirma nada** — misma disciplina que HT F11 y AR F4 —, y en el corte
más antiguo `diasDesdeElAnterior` es `null`, no `0`: no hay con qué compararlo.

### Verificación
`bash scripts/verificar.sh` — **5041 comprobaciones**, todas correctas: build de Vite,
189 nuevas en `scripts/test-peluqueria.mjs` (los catorce tests del apartado 17, más los dos fallos
silenciosos, más el enchufe al calendario) y **552 casos de renderizado** (28 nuevos).

⚠️ **`peluqueria` es el noveno campo que se enseña a un normalizador en este proyecto.** Tercero
seguido que se recuerda a la primera.

## Entrega 2 · EH Fase 10/65 — Pelo: productos, catálogo y recomendaciones (v1.76.0)

### ⚠️ La decisión que gobierna la fase entera
El enunciado habla de catálogo, de Amazon y de afiliación. **D2-03 de Josué** dice: *"Amazon:
arquitectura sí, afiliación no. Ni catálogo, ni productos, ni API, ni cuenta de afiliados
inventados."*

**No hay contradicción que resolver: el propio enunciado dice lo mismo.** Apartado 3: *"No llenar
todavía la aplicación con cientos de productos manualmente en esta fase."* Apartado 11: *"**No poner
enlaces inventados**."*

Así que se construye **la arquitectura entera** —la ficha con sus doce campos, las cinco clases de
tienda, la distinción entre enlace normal y de afiliado, el aviso de transparencia, los packs, la
comparación, los favoritos, "ya lo tengo" y la valoración— y **el catálogo está vacío, declarado
vacío y comprobado vacío**.

Todo producto que existe en la aplicación lo ha metido él (apartado 9). El día que haya catálogo,
entra por `CATALOGO_PELO` sin tocar nada más.

### ⚠️ Nunca un enlace inventado
Una "url" que no lo es se guarda como `null`, y la pantalla **dice que no hay enlace** en vez de
fabricar una búsqueda de Amazon "por si acaso" — que es inventarse un enlace con otro nombre.

Hay una prueba de que **no aparece ni una URL literal ni un dominio de tienda ni una etiqueta de
afiliado en todo el código**.

### ⚠️ Nunca una compra automática
El apartado 19: *"La aplicación únicamente: recomienda → muestra información → ofrece enlace →
usuario decide."*

Cinco pruebas buscan funciones de "comprar", "checkout", "carrito", "pagar" y "pedido". Lo más lejos
que llega esto es un objeto con la URL que él guardó.

Y el apartado 12: **el usuario ve siempre "Ver producto"**, lleve el enlace la marca que lleve. El
aviso de transparencia —*"Algunos enlaces pueden ser enlaces de afiliado"*— sale **solo si alguno lo
es**. Poner el aviso donde no hay afiliación es tan poco honesto como quitarlo donde sí la hay.

### No disponible no es borrado
El apartado 10: *"Si un producto deja de estar disponible: **no eliminarlo automáticamente del
historial**."* Se marca, se avisa y se ofrecen alternativas de entre los suyos.

Y una que no es obvia: **una alternativa que tampoco está disponible no se ofrece**.

### ⚠️ Una sola lista de productos
La Fase 8 creó una con nombre y paso. Esta le ha añadido marca, categoría, descripción, para qué
sirve, características, nivel, precio, tiendas, estado, valoración y opinión — **en la misma lista**.

*"No duplicar productos"* está en la lista de pruebas del apartado 20, y dos listas de productos
capilares es exactamente cómo se incumple. Mismo nombre y misma marca es el mismo producto, aunque
cambien las mayúsculas.

### El precio lleva su fecha
El apartado 16: *"si el precio puede cambiar, no tratarlo como un dato permanente"*. Así que viaja
con `precioAnotado`, y se re-sella al cambiarlo.

### ⚠️ El pack sugerido sugiere, no crea
El apartado 15 pide que el sistema pueda armar packs por reglas. `packSugerido` devuelve una
propuesta — y hay una prueba de que **el estado no cambia**. Guardarlo es `crearPack`, y eso lo hace
él, igual que `aplicarARutina` en la Fase 9.

### Las recomendaciones se apagan, los productos siguen
El apartado 18 lo dice con esas palabras, y hay una prueba de las dos mitades: con las
recomendaciones apagadas no sale ninguna, **y los tres productos siguen ahí**.

### `packs` es el octavo campo que se enseña a un normalizador
Y como en la Fase 9, el que se olvidó lo cazó la prueba en el mismo turno. La costumbre está
funcionando.

### Verificación
`bash scripts/verificar.sh` en verde: build de Vite, **4 295 comprobaciones unitarias**, 5 de
auditoría, **524 casos de renderizado real** y 10 reglas invariantes — **4 824 en total**. De ellas,
**169 nuevas** para EH F10.

---

## Entrega 2 · EH Fase 9/65 — Pelo: sistema de recomendaciones (v1.75.0)

### El enunciado abre con dos palabras en mayúsculas
**NO IA.** *"Las recomendaciones deben salir de la información que ya tenemos guardada y de reglas
internas de la aplicación. El usuario siempre tiene la última palabra."*

Seis pruebas buscan `askAI`, `AI_SYSTEM`, `anthropic`, `fetch(`, `XMLHttpRequest` y `openai` en el
código. Se comprueba sobre el archivo, no sobre la buena voluntad.

### ⚠️ Si un dato no existe, no se asume
Es el apartado 2, y es la diferencia entre un motor de reglas y uno que se inventa cosas.

Cada una de las catorce reglas declara **qué necesita saber**. Si falta algo, no se dispara. Con el
perfil vacío salen **cero** recomendaciones.

Y una comprobación que no es obvia: **una regla sin requisitos declarados no se aplica nunca**. Si se
permitiera, se dispararía con el contexto vacío y acabaría recomendándole cosas a alguien de quien no
sabemos nada — el fallo silencioso de este tipo de motor.

**"No lo sé" tampoco es un valor**: es la ausencia declarada de uno (Fase 7), así que no dispara nada.

### ⚠️ Nunca "debes"
El apartado 4: *"Nunca 'Debes hacer esto'. Utilizar: Podría venirte bien / Podrías probar / Una opción
compatible contigo."*

Hay una prueba que genera **todos** los textos posibles del motor —con el perfil entero contestado y
con el de ejemplo— y busca diez imperativos. Y comprueba que **sí** aparecen las fórmulas del
enunciado. Y, como en la Fase 7, que no se diagnostica nada.

### ⚠️ Una recomendación no modifica nada
El apartado 10: *"Una recomendación no debe modificar rutina, productos, preferencias ni
calendario."*

`aplicarARutina` **exige `confirmado: true`**, y la prueba serializa el estado antes y después para
comprobar que **no ha cambiado ni un byte**. Es la regla 7 del proyecto en código, igual que
`aplicarPlan` en HT F9. Nunca darle un valor por defecto.

Y calcular recomendaciones tampoco escribe: **mostrar y registrar que se ha mostrado son dos llamadas
distintas**, para que repintar una pantalla no ensucie el historial.

### Los ejemplos del enunciado son reglas con su id
- *"Si pelo = rizado + objetivo = definición"* → `definicion_rizado`.
- *"Si cuero cabelludo = graso"* → `cuero_graso`.
- *"Buscas hidratación y tu rutina tiene pocos pasos de hidratación"* → `hidratacion_sin_paso`, que
  **mira de verdad los pasos de su rutina**.

Y el tiempo disponible entra en las reglas, no en el texto: la mascarilla semanal solo se propone a
quien ha dicho que puede dedicarle más de diez minutos. Es para lo que servía esa pregunta de la
Fase 7.

### Los niveles vienen de la Fase 6
El apartado 6 dice *"utilizar los niveles que ya hemos definido"*, y eso es lo que se hace: se
importan 🟢🟡🔴, no se redefinen. Hay una prueba de que no aparece un `const NIVELES` aquí, y otra de
que **hay reglas en los tres** — un nivel vacío sería un control decorativo.

### Descartar tiene memoria, pero con caducidad
*"No me interesa"* calla 30 días, *"ya lo hago"* 90, y **"no quiero verlo" es para siempre** — por eso
es el único de los cuatro sin plazo asignado: "para siempre" no es un número de días.

Y todo se puede deshacer. Un toque no condena una recomendación.

### ⚠️ Un fallo real, encontrado en el mismo turno
`normalizarPelo` (Fase 8) no conocía el campo `recomendaciones`, así que **lo descartaba en cada
lectura**: descartar o guardar una recomendación no tenía ningún efecto.

Es la **séptima vez** que este proyecto se topa con el mismo fallo de normalizador, y la primera en
que se detecta en el turno en que se introduce, en lugar de fases después.

### El apartado 9 pide integrar el sistema global de guardados "si existe"
**No existe.** Nutrición y los colores tienen cada uno los suyos, y no hay ninguno general. Así que
los guardados de pelo viven en la `config` de Pelo, y queda dicho para que la fase que cree el global
sepa que tiene que absorberlos.

### Verificación
`bash scripts/verificar.sh` en verde: build de Vite, **4 126 comprobaciones unitarias**, 5 de
auditoría, **504 casos de renderizado real** y 10 reglas invariantes — **4 635 en total**. De ellas,
**146 nuevas** para EH F9.

---

## Entrega 2 · EH Fase 8/65 — Pelo: rutina, cuidados y seguimiento (v1.74.0)

### La filosofía, que el propio enunciado escribe
*"La aplicación recomienda y organiza; el usuario decide. No vamos a convertirlo en una obligación ni
en un sistema médico."*

### ⚠️ No castigar, y probado en el peor escenario
El apartado 7 lo dice sin rodeos: *"No queremos 'Has fallado'. Simplemente 'Pendiente'."*

Un día sin hacer la rutina **no es un día perdido**. Hay una prueba que monta el peor caso posible
—una rutina diaria abandonada durante dos meses— y recorre **todos** los textos que el módulo genera
buscando "fallado", "fallo", "perdido", "deberías", "mal", "incumplido", "abandonado", "racha rota" y
"castigo". Nueve comprobaciones sobre el mismo escenario.

Y una consecuencia que no es obvia: **sin días en los que tocara, no hay cumplimiento** — ni 0 % ni
100 %. Una rutina "personalizada", que Josué hace cuando quiere, no puede salir con un 0 %: decir eso
de algo que nunca tocó es exactamente el reproche que el apartado prohíbe.

### ⚠️ Nada se materializa
El apartado 17: *"No crear un segundo calendario. Debe utilizarse el calendario existente."* Y la
regla 11 del proyecto dice lo mismo para cualquier recurrencia.

Una rutina "cada 3 días" guarda **su regla**, no cien fechas. La prueba pide **un año entero** de
eventos, comprueba que salen más de cien… **y que el estado guardado sigue por debajo de 3 KB**.

El efecto: cambiar la frecuencia cambia los eventos al momento, porque no hay nada que sincronizar.

Las rutinas entran en el Calendario con **la misma forma** que los usos del Armario, así que encajan
sin adaptadores.

### ⚠️ Ni un contador guardado
Cuántas veces la ha hecho, cuántos días le tocaba, el cumplimiento — todo se deriva del historial. Un
contador guardado miente en cuanto Josué borra un registro. Hay una prueba de que la rutina guardada
no lleva ninguna cifra acumulada.

Y el estado de hoy también es derivado: **marcada ayer no significa marcada hoy**.

### Lo que no se construye, y está declarado
- **Sin gamificación** (D2-02 de Josué): ni XP, ni niveles, ni medallas.
- **Sin fotos** (apartado 10): *"no crear una galería fotográfica obligatoria"*.
- **Sin catálogo de productos** (apartado 11 + D2-03): un producto aquí es **un nombre que él
  escribe**. Seis pruebas buscan "amazon", "afiliad", "precio", "comprar", "http" y "marca:".
- **Sin recomendaciones** (apartado 13): existe la estructura, que declara las seis fuentes que
  usará y que llega en la fase 9.

### Recordatorios nace apagado
El apartado 5: *"nunca deben ser obligatorios"*. Y el enunciado lo dibuja así — `☐ Recordatorios` —
así que es la única de las cuatro partes que empieza en off.

### Dos cosas pequeñas que evitan sustos
**Borrar una rutina dice antes qué se lleva por delante**: *"se borrará X y 3 días registrados"*. Y
**borrar un producto desengancha** los pasos que lo usaban, no los borra.

### ⚠️ Otra prueba mal escrita, corregida
Los barridos de *"esto NO existe"* cazaban su propia evidencia: `fotos: 0` y `xp: 0` viven dentro de
`auditarPelo()`, que es justo la función que **declara los ceros**. Ahora el barrido excluye esa
función.

Es la tercera vez en este bloque que una comprobación salta con algo que estaba bien. Conviene mirar
**qué línea** la hace saltar antes de tocar el código: dos de las tres veces, el código era correcto
y la prueba estaba mal.

### Verificación
`bash scripts/verificar.sh` en verde: build de Vite, **3 979 comprobaciones unitarias**, 5 de
auditoría, **488 casos de renderizado real** y 10 reglas invariantes — **4 472 en total**. De ellas,
**170 nuevas** para EH F8.

---

## Entrega 2 · EH Fase 7/65 — Pelo: perfil capilar y necesidades (v1.73.0)

### La primera fase que pregunta cosas de verdad
Y no será la última: Skincare (13), Cuerpo (18), Barba (20), Manos (22) y Perfumes (24) traen cada
una su propio cuestionario de perfil.

Así que lo que se construye es **el motor** (`cuestionarios.js`), y las doce preguntas de Pelo son su
primera configuración. Están en un array; las fases siguientes traerán el suyo **sin tocar una línea
de aquí**.

### ⚠️ El motor no guarda nada por su cuenta
Cada respuesta va a uno de los dos sitios que ya existen, y la elección es una regla, no un `if`
suelto:

- **Si el dato está en `REGISTRO_DATOS`** (Fase 4), va allí. Eso significa que lo comparten varios
  módulos — `tipoPelo` lo usan Pelo y Productos — y por tanto **no se puede volver a preguntar**.
- **Si no está**, es solo de ese módulo y va a su `config` (Fase 1, apartado 8: *"configuración
  específica futura"*), que `alternarModulo` **nunca toca**.

De las doce preguntas, **solo `tipoPelo` es compartida**.

Esa única decisión es la que hace pasar los Tests 7, 8 y 9 a la vez. Y si estuviera mal, **nada
reventaría**: simplemente Productos volvería a preguntar el tipo de pelo, o apagar Pelo se llevaría
once respuestas. Por eso hay pruebas de las tres cosas.

### ⚠️ "No lo sé" es una respuesta, no un hueco
El apartado 14 lo dice con esas palabras: *"Nunca obligar a inventar una respuesta."* Así que:

- **Se guarda, y cuenta como contestada.** No es lo mismo que no haber respondido: *"no lo sé"* es
  información —se le puede ofrecer contenido educativo— y *"aún no ha llegado"* no lo es.
- **Es exclusivo.** Marcarlo borra lo demás, y marcar algo de verdad lo quita. *"Cuero cabelludo
  graso y no lo sé"* es un estado imposible que luego nadie sabe interpretar.
- **Por defecto toda pregunta lo admite.** El valor por defecto tiene que ser el que no obliga a
  inventar. Solo se quita donde el enunciado no lo ofrece: preguntar cada cuánto se corta el pelo ya
  tiene su *"Cuando lo necesito"*.

### ⚠️ "No diagnosticar problemas"
Es el apartado 7, y se cumple en la forma de las preguntas: se pregunta **qué quiere cuidar**, no qué
le falla. Hay siete pruebas que buscan "caspa", "alopecia", "calvicie", "problema", "diagnos",
"enfermedad" y "sintoma" en el código.

Un chaval de 16 años no necesita una aplicación diciéndole que tiene un problema.

### Ni calendario, ni productos, ni recomendaciones
El enunciado lo prohíbe tres veces (apartados 11, 12 y 17). Hay pruebas de que no se define ninguno
— **pero sí se dice cuándo llegan**, que es la regla 8: *"Se usará para el calendario de peluquería,
que llega en la fase 11."*

### ⚠️ Una prueba mal escrita, corregida
La primera versión de esa comprobación prohibía la **palabra** "calendario" en todo el archivo, y
saltaba justo con la frase que le dice a Josué cuándo llega. Ahora comprueba que no se **defina**
ninguno, y además comprueba que **sí se diga cuándo llega**.

Una prueba que castiga la honestidad está mal escrita, y arreglarla es más barato que descubrir dentro
de diez fases que se dejó de explicar nada por no hacerla saltar.

### Verificación
`bash scripts/verificar.sh` en verde: build de Vite, **3 809 comprobaciones unitarias**, 5 de
auditoría, **448 casos de renderizado real** y 10 reglas invariantes — **4 262 en total**. De ellas,
**118 nuevas** para EH F7. El **Test 10** (flujo en móvil) necesita un iPhone: **R1**.

---

## Entrega 2 · EH Fase 6/65 — Perfil de estilo y preferencias personales (v1.72.0)

### La diferencia, en una línea
*"Armario → qué prendas tiene el usuario. Perfil de estilo → qué le gusta, qué quiere conseguir y
qué tipo de imagen quiere transmitir."*

Y va **dentro** de Estilo y Armario (apartado 1: *"no crear otro apartado principal"*), no como un
módulo nuevo del catálogo.

### ⚠️ Once campos y ningún almacén propio
Todo el perfil se guarda en **la capa de datos de la Fase 4**, con una línea por preferencia en el
registro. No es por ahorrar: **`estilosFavoritos` y `coloresFavoritos` ya existían** desde la Fase 5.
Crear aquí unos paralelos habría dado dos listas de estilos favoritos que se separan con el tiempo, y
el Test 9 de esta fase dice literalmente *"comprobar que no se duplica la información"*.

El efecto secundario bueno: el panel **Mis datos** enseña el perfil entero sin que nadie lo enchufe, y
`hayQuePreguntar()` ya sabe que Productos no tiene que volver a preguntar los colores.

### Tres listas se toman prestadas y no se declaran
Los colores son `COLORES_ARMARIO` (apartado 4: *"no duplicar el sistema de paletas si ya existe"*),
las marcas salen de sus propias prendas (apartado 5: *"reutilizar las marcas existentes"*) y las
ocasiones son `OCASIONES_OUTFIT` (apartado 6). Hay pruebas que leen el código y fallan si aparece una
lista nueva.

### ⚠️ Los niveles nacen aquí
El apartado 10 dice *"mantener el sistema de niveles que ya definimos"* (🟢 Básico 🟡 Intermedio
🔴 Avanzado). En la especificación se definen en las fases 18 y 22 — que en orden de construcción
todavía no existen. Así que se definen **una vez, aquí**, y esas fases los importarán en vez de
escribir los suyos. El día que alguien teclee `['Básico', 'Intermedio', 'Avanzado']` por su cuenta,
habrá dos listas.

### ⚠️ Un perfil vacío es un perfil válido
El Test 7 es exactamente eso: *"no rellenar ningún campo → el módulo sigue funcionando"*. Así que:

- No hay barra de progreso, ni porcentaje, ni la palabra "incompleto". Hay una prueba que lo busca.
- **Quitar el último valor borra el dato**, en vez de guardar `[]` y decir después "no lo has
  indicado". Guardar una lista vacía y llamarla "sin indicar" es mentir a medias.
- Con el perfil vacío, el motor de reglas devuelve **cero reglas**, no un error.

### ⚠️ "Lo que refleja tu armario" no clasifica prendas
El apartado 14 pide *"Tu armario refleja principalmente: Deportivo · Casual · Minimalista"*. La
tentación es deducir el estilo de cada prenda, y eso es adivinar: un pantalón negro puede ser de
cualquier estilo.

Así que la tabla va de **ocasión** —que la eligió él para cada outfit— a estilo, y de categoría a
estilo **solo donde la prenda lo dice sin ambigüedad**. `chandal` está; `pantalones` no, y hay una
prueba de que no está. Por debajo de cuatro prendas no se afirma nada, y cada frase dice de dónde
sale — misma regla que la analítica del Horario (HT F11).

**Y el contraste describe, no corrige:** si él dice "elegante" y su armario refleja "deportivo", el
texto es *"puede ser justo lo que buscas cambiar"*. Cinco pruebas comprueban que nunca aparece
"deberías", "error", "incorrecto", "mal" ni "no encaja".

### Lo personal no viaja a las recomendaciones
El apartado 15 pide respetar la privacidad. *"Cosas que me gustaría hacer"* **no sale** en el contexto
que se entrega a quien recomiende ropa, con el motivo escrito y una prueba que lo busca. Los
intereses sí — el propio enunciado los pone como ejemplo de contexto útil.

### ⚠️ Esta fase obligó a afinar una prueba de la Fase 5
La Fase 5 comprobaba que ningún id del registro contuviera la palabra "marca" u "ocasion", y
`marcasFavoritas` la hizo saltar. **No era una duplicación:** el armario sabe qué marcas *tiene*, no
cuáles le *gustan*. Lo que hay que prohibir es el catálogo, no la preferencia — así que ahora compara
ids exactos.

Y dos comprobaciones nuevas cazaban **comentarios en vez de código**: una saltaba con la frase que
explica que *no* hay un almacén paralelo, y otra con "con**seguir**". Ahora las dos leen el archivo
con los comentarios quitados. Una prueba que salta con la prosa acaba haciendo que se reescriba la
prosa en vez del código.

### Verificación
`bash scripts/verificar.sh` en verde: build de Vite, **3 691 comprobaciones unitarias**, 5 de
auditoría, **432 casos de renderizado real** y 10 reglas invariantes — **4 128 en total**. De ellas,
**119 nuevas** para EH F6.

---

## Entrega 2 · EH Fase 5/65 — Estilo + Armario: integración con el sistema existente (v1.71.0)

### El enunciado empieza con tres avisos, y los tres dicen lo mismo
> ⚠️ NO reconstruir el armario.
> ⚠️ NO duplicar sus datos.
> ⚠️ NO crear un segundo sistema de ropa.

Así que este archivo **no guarda ni una prenda**. Ni un outfit, ni un uso, ni una marca, ni una
ocasión. Todo sigue en `armario.js` y `armarioInteligencia.js`, donde lo dejó AR F1-F4.

### ⚠️ La prueba que más importa no es ninguna de las diez del enunciado
El apartado 7 dice que *"una recomendación nunca debe convertirse automáticamente en una modificación
del armario"*. La forma de garantizar eso no es acordarse: es que **la capacidad no exista**.

Hay una prueba que **lee el código fuente** de `armarioEnEstiloHombre.js` y falla si aparece
`crearPrenda(`, `actualizarPrenda(`, `crearOutfit(`, `crearUso(`… o una llamada a la IA (apartado 11).
Nueve comprobaciones, todas sobre el texto del archivo.

Y otra que serializa el estado de Estilo de Hombre y comprueba que **no contiene el id de ninguna
prenda, ni el del outfit, ni la marca "Zara"**.

### ⚠️ Un solo perfil de tallas (Test 8)
El armario ya sabe qué talla gasta Josué: lo dice cada prenda. Así que **se deriva de ahí** —tres de
sus cuatro camisetas son M, luego gasta M— y lo guardado en la capa de la Fase 4 solo rellena los
huecos, como el calzado, del que no tiene ninguna prenda.

Dos decisiones que no son obvias:

- **Si los dos existen y no coinciden, se enseña el choque.** El armario manda, pero Josué ve
  "guardada: L · armario: M" y decide. Elegir uno en silencio sería crear el segundo perfil por la
  puerta de atrás: vería M en un sitio y L en otro sin saber por qué.
- **Un empate no es una respuesta.** Un 43 y un 44 con la misma frecuencia significan que el armario
  **no sabe** cuál es la suya, y entonces gana la que él indicó.

### El motor de recomendación tampoco se reescribe
`recomendarOutfits()` es de AR F4 y ya sabe de repetición, de prendas en la lavadora y de outfits
olvidados. Lo que añade esta fase es la capa de preferencias por encima.

Y **si no ha indicado colores favoritos, no se afirma que nada encaje**: `encajaConTusColores` sale
`false` en lugar de inventarse una afinidad.

### El apartado 8 no bloquea
*"No tenemos registrada tu talla de calzado"* con su *"Añadir talla"*… **y la recomendación sale
igual**. El enunciado lo dice con esas palabras: *"No obligar al usuario a completar todo su
perfil."*

### ⚠️ Un fallo real que encontró la prueba
El puente leía `outfit.ocasiones` como si fuera una lista. Un outfit guarda **una** ocasión, en
`ocasion`. Devolvía cero ocasiones siempre, y en silencio — la clase de error que nadie nota hasta
que una pantalla lleva meses vacía.

La forma que existe manda sobre la que uno supone. Es literalmente el tema de esta fase.

### Apagar el apartado no esconde el armario: lo saca de aquí
El apartado 10 pide que *"el sistema global de armario siga intacto si existe fuera de este
apartado"*. Así que al apagarlo la plaquita desaparece **y la pantalla dice** *"el armario sigue en su
sitio de siempre, con todo lo que tienes guardado"*, en vez de dejar un hueco.

### Las preferencias que el armario ya tiene no se declaran
Marcas, colores y ocasiones **se derivan de sus prendas y sus outfits**. Hay cinco pruebas que fallan
si aparecen en el registro de datos de la Fase 4. Solo se guardan las tres que no existían: estilos
favoritos, colores favoritos y formalidad — **una línea cada una**, que es lo que la Fase 1 prometió.

### Productos: el enlace declarado, ni un producto
Apartado 12 más **D2-03** de Josué (*arquitectura sí, afiliación no*). `PUENTE_PRODUCTOS` dice qué le
pasará el día que exista y que hoy no existe. Cinco pruebas buscan "amazon", "afiliad", "precio",
"comprar" y "http" dentro de él.

### Verificación
`bash scripts/verificar.sh` en verde: build de Vite, **3 569 comprobaciones unitarias**, 5 de
auditoría, **420 casos de renderizado real** y 10 reglas invariantes — **3 994 en total**. De ellas,
**138 nuevas** para EH F5. El **Test 10** (navegación en móvil) necesita un iPhone: **R1**, y la
auditoría lo declara en vez de darlo por bueno.

---

## Entrega 2 · EH Fase 4/65 — Sistema de datos, perfil y reutilización global (v1.70.0)

### La regla, en una línea
*"Un dato debe existir una sola vez y poder ser utilizado por todos los módulos que lo necesiten."*

### ⚠️ Una sola función lee, venga el dato de donde venga
`leerDato()` resuelve igual el **peso** —que vive en Salud— que el **tipo de piel** —que vivirá
aquí— y devuelve **exactamente la misma forma**. Hay una prueba que compara las claves de las dos
respuestas.

Eso importa dentro de cuarenta fases: cuando Skincare necesite los dos, **no tendrá que saber cuál
es cuál**. Si tuviera que distinguirlos, tarde o temprano alguien pediría el peso por el camino
equivocado, se lo encontraría vacío y crearía "su" copia.

### ⚠️ Y su gemela: guardar un dato global se rechaza
El apartado 3 lo escribe con un ejemplo: *"No puede existir Perfil → 72 kg, Estilo de hombre → 70
kg."*

`guardarDato(estado, 'peso', 70)` **no guarda nada**, y no falla en silencio: devuelve un error con
**el sitio donde sí se edita**, para que la pantalla pueda mandar a Josué allí. Hay una prueba que lo
intenta y comprueba que el peso sigue siendo el 73 de Salud y que no se ha creado ninguna copia.

Lo mismo con borrar (apartado 12): un dato propio se elimina, uno de JosStyle no se toca desde aquí.

### El Test 4 sale gratis, y ese es el punto
*"Modificar dato → todos los módulos compatibles reciben el cambio."* Productos cambia el tipo de
piel y Skincare lo ve **porque es el mismo dato**, no porque haya un mecanismo que los sincronice. Si
hubiera dos copias, cada módulo enseñaría un valor distinto y **nada reventaría**: por eso este test
importa más que los otros nueve.

### El historial es opcional, y está declarado
Las tallas lo llevan (apartado 9: *"peso, medidas, rendimiento…"*), el tipo de piel no. Ponérselo a
todo llenaría el guardado de ruido. Y guardar el mismo valor dos veces **no crea dos entradas**.

### La antigüedad describe, no juzga
*"Tipo de piel — Actualizado hace 3 meses"*, el ejemplo literal del enunciado, con su prueba. Y cinco
comprobaciones de que el texto nunca dice "deberías", "llevas", "olvidado", "demasiado" ni "mal". Es
la misma línea que se trazó en la analítica del Horario (HT F11).

### ⚠️ El apartado 14 pide NO ROMPER, y eso empieza por el texto
*"Productos → necesita preferencias de Skincare. Si Skincare está desactivado: no debe romper
Productos."*

Lo que sale es *"Añade tu tipo de piel para personalizar esto"*, y hay cinco pruebas de que nunca
aparecen las palabras "error", "undefined", "null", "falta" ni "no se puede". Un mensaje que asusta
rompe igual que una excepción.

Y una cosa más: **el dato sigue disponible con su módulo apagado**. Los datos no dependen de que su
módulo esté encendido — eso es el apartado 13, que el enunciado repite entero *"porque será
fundamental"*.

### Solo los datos que la especificación nombra
Tipo de piel, sensibilidad, tipo de pelo, preferencia de corte, preferencia de textura, productos sin
perfume, ropa oversize y tres tallas. **Ni uno inventado.** *"No crear todavía todos los campos
específicos. Solo preparar la arquitectura."* Añadir uno es añadir una línea.

### Privacidad: hoy ninguno
Ningún dato está marcado como privado, y decirlo es más honesto que fingir una protección que no
protege nada todavía. Lo que sí existe es el filtro, para que la fase que marque el primero no tenga
que construirlo — y para que nadie mande a la IA lo que no debe.

### Sexto campo nuevo, segundo seguido que el normalizador conoce
`datos` entra en `normalizarEstiloHombre` desde el primer commit. Y un dato guardado de una versión
anterior del registro **no se borra solo** (apartados 12 y 17).

### Verificación
`bash scripts/verificar.sh` en verde: build de Vite, **3 431 comprobaciones unitarias**, 5 de
auditoría, **408 casos de renderizado real** y 10 reglas invariantes — **3 844 en total**. De ellas,
**141 nuevas** para EH F4. El **Test 10** (*"sincronización → no aparecen duplicados"*) se comprueba
hasta donde llega Node; que dos iPhones acaben con lo mismo es **R1**.

---

## Entrega 2 · EH Fase 3/65 — Sistema de primera configuración y perfil de usuario (v1.69.0)

### Lo que pide el enunciado, en una línea
*"La aplicación debe conocer qué necesita el usuario sin obligarle a rellenar un formulario
interminable."* Sencilla, progresiva, saltable, personalizable, reutilizable y **sin IA**.

Y subrayado: **"No preguntar información que JC Fitness ya conoce."**

### ⚠️ El asistente guarda por dónde va, no lo que sabe
Es la decisión que gobierna toda la fase. Se guardan **cinco cosas** —el paso, la selección en curso,
el estado y dos fechas— y **ni un dato de Josué**.

Su peso, su altura, su nombre y sus objetivos **se leen** de Perfil, Salud y Objetivos cada vez que
hacen falta. Guardar aquí una copia "para no volver a preguntarlo" sería exactamente lo contrario de
lo que pide el apartado 7, y daría dos pesos distintos el día que se corrija uno.

Hay cuatro pruebas que buscan `"Josué"`, `"2010-07-29"`, `"187"` y `"Masculino"` dentro de lo que se
guarda, y **fallan si aparecen**.

### El peso sale de donde es más reciente
`salud.medidas` tiene la última medida; `perfil.peso` tiene la del día que rellenó el perfil. Gana la
de Salud, y si no hay ninguna, vale la del perfil. Está probado con las dos.

### ⚠️ Quinto campo nuevo, primer normalizador que no se olvida
`asistente` es el quinto campo que se añade a una entidad de este proyecto. Las cuatro veces
anteriores —`visible`, `archivado`, `materiales`, y el módulo retirado de la semana pasada— **el
siguiente guardado se lo llevaba**, porque `saveData` sobrescribe y no fusiona (regla 5).

Esta vez `normalizarEstiloHombre` lo conoce desde el primer commit, y hay una prueba que serializa,
recarga y comprueba que el paso sigue ahí.

### ⚠️ Dos fallos reales que encontraron las pruebas

**1. Modificar la configuración reordenaba las plaquitas en silencio.** Entrar en *"Modificar mi
configuración"*, no tocar nada y confirmar **cambiaba el orden**, porque la selección de partida
salía en orden de catálogo y `terminarAsistente` reescribe el `orden` a partir de ella. Ahora sale en
el orden que él eligió.

**2. Pulsar "Empezar" enseñaba "Lo dejaste a medias".** El botón pasa el asistente a `en_curso`, y el
enlazado interpretaba eso como "vuelve de una configuración abandonada". Lo que el apartado 15
distingue es **volver** de **seguir**, y eso no está en el estado guardado: está en si ya estaba a
medias cuando abrió la pantalla. Ahora se calcula una sola vez, al entrar.

### Omitir marca configurado, y eso no es un descuido
El apartado 6 pide *"Omitir por ahora"* y que **no se rompa nada**. Si omitir no marcara
`configurado`, la próxima vez que entrase le saldría otra vez la bienvenida — que es justo lo
contrario de saltárselo. Y no enciende nada: entra en la pantalla vacía de la Fase 2, que ya sabe qué
decir.

### "Empezar de nuevo" reinicia el asistente, no los módulos
Los datos de cada apartado siguen donde estaban. Es la diferencia entre *volver a elegir* y *perderlo
todo*, y el apartado 15 pide la primera.

### ⚠️ Apartado 17 — ni una pregunta construida
*"Esta fase solo construye el sistema que las podrá alojar."* Así que no hay ningún formulario de piel,
pelo o fitness. Lo que hay es, por módulo:

- **`usa`** — qué datos globales reutilizará. Eso es lo que **no** se le va a preguntar.
- **`pregunta`** — en qué fase hará las suyas. Un número, no un formulario.

Hay una prueba que recorre todo `NECESIDADES_MODULO` buscando un signo de interrogación y falla si lo
encuentra.

### Mis datos: lo de fuera se edita fuera
El apartado 13 pide poder modificar las respuestas. "Mis datos" enseña el peso y **dice que está en
Salud**; no ofrece un campo para cambiarlo aquí. Dos sitios donde se edita el mismo dato y uno de los
dos acaba mintiendo.

### Los diez tests del apartado 18
Están los diez. El **Test 10** (*"probar todo el flujo en móvil"*) necesita un iPhone: es **R1**, y el
archivo de pruebas lo imprime en vez de darlo por bueno.

### Verificación
`bash scripts/verificar.sh` en verde: build de Vite, **3 290 comprobaciones unitarias**, 5 de
auditoría, **396 casos de renderizado real** y 10 reglas invariantes — **3 691 en total**. De ellas,
**139 nuevas** para EH F3.

---

## Entrega 2 · EH Fase 2/65 — Sistema de gestión y personalización de módulos (v1.68.0)

### La regla que gobierna la fase
*"El usuario decide qué quiere ver y qué no. No debemos mostrar 30 funcionalidades a alguien que
solo quiere utilizar 5."*

La Fase 1 dejó el catálogo y el interruptor. Esta construye **la gestión de verdad**: siete
categorías, buscador, orden, confirmación al apagar, recomendados y ficha.

### ⚠️ Y arregla un fallo real de la Fase 1, que avisaba la propia especificación
El apartado 17 dice: *"Módulo eliminado del catálogo en una futura actualización → los datos NO
deben borrarse automáticamente."*

El normalizador de la Fase 1 hacía justo lo contrario: descartaba el módulo entero. Y con la regla 5
del proyecto —**`saveData` sobrescribe, no fusiona**— eso significaba que **el siguiente guardado se
llevaba su `config` para siempre**.

Es la **cuarta vez** que este proyecto tropieza con el mismo fallo de normalizador (pasó con
`visible` en HT F2, con `archivado` en HT F4 y con `materiales` en HT F7). La diferencia es que esta
vez estaba escrito en el enunciado antes de que ocurriera.

Ahora el módulo retirado va a la cuarentena `retirados`: fuera de la lista que se pinta —nadie
sabría dibujarlo— pero **guardado entero**. Si vuelve al catálogo, `restaurarRetirados` lo devuelve
con sus datos, no desde cero.

### Una única fuente de verdad, comprobada contra el código
El apartado 15: *"No crear `skincareSettings` en un lugar distinto simplemente para saber si Skincare
está activo."*

Por eso categoría, confirmación, recomendación y sinónimos de búsqueda **están en la línea del
módulo**, dentro de `MODULOS_EH`. Un segundo mapa `id → categoría` se separaría del primero el día
que alguien añada un módulo y se olvide del otro sitio.

Y no es una promesa: hay una prueba que **lee `gestionModulos.js` y la vista** y falla si aparece un
segundo catálogo o un id de módulo suelto.

### El buscador tiene sinónimos porque el enunciado lo obliga
*"Buscar: pelo → 💇 Pelo, 🧔 Barba."* El nombre de Barba no contiene "pelo", así que un `includes`
sobre el nombre fallaría el ejemplo literal del enunciado. Cada módulo lleva sus términos.

Y aguanta lo que Josué escribe de verdad desde el iPhone: mayúsculas, tildes puestas o quitadas
("habito" encuentra **Hábitos**) y la eñe.

### ⚠️ El aviso al desactivar solo sale si hay algo que perder
El apartado 6 pide confirmación *"para módulos que puedan contener información importante"*, y que
la aplicación pueda definir cuáles.

Está definido —`confirmar: true` en el catálogo— **pero además se mira si el módulo tiene datos**.
Un cartel que dice *"tus datos no se eliminarán"* sobre un módulo vacío no protege nada: enseña a
pulsar "Desactivar" sin leer, y entonces no sirve el día que sí importa.

### ⚠️ Subir y bajar se mueven dentro de los ACTIVOS
Si la flecha saltara por encima de un módulo apagado, Josué la pulsaría y **no vería moverse nada**,
porque el que ha adelantado no se pinta. Hay una prueba con un módulo apagado justo en medio.

En los extremos las flechas salen **apagadas**, no desaparecen: una flecha que se esconde mueve la
interfaz debajo del dedo.

La estructura ya está lista para drag & drop, que es lo que pide el apartado 9: `moverA(estado, id,
posición)` acepta el destino directo, y `reordenar` acepta la lista entera de una vez.

### Recomendados: dos reglas, sin IA
*"Debe ser informativo, nunca obligatorio. No utilizar IA."* Solo se sugiere lo que está apagado, y
entre los apagados van primero los marcados en el catálogo y después los que **antes tendrán
contenido**: recomendar hoy algo que llega en la fase 55 es prometer.

Y **no sale nada** si no ha configurado todavía o si lo tiene todo encendido. Una sección con título
y sin contenido es peor que ninguna sección.

### ⚠️ Seis módulos que el enunciado nombra y no se han creado
El apartado 3 enumera, dentro de las categorías, **Nutrición, Recuperación, Salud preventiva, Salud
dental, Salud visual y Objetivos**. No están, y cada uno lleva su motivo escrito en el código:

- **Nutrición y Objetivos ya son módulos enteros de JosStyle.** Copiarlos dentro de Estilo de Hombre
  es literalmente lo que prohíben el apartado 10 de la Fase 1 y el 15 de esta.
- **Recuperación** es contenido de Fitness (fase 26).
- **Las tres de salud** son subdivisiones de Salud (fase 33) e Higiene (fase 18). Partirlas hoy sería
  decidir por adelantado la forma de fases que no tocan.

Las siete categorías están las siete. Si una fase futura crea uno de esos módulos, **entra con una
línea**.

### Los diez tests del apartado 18
Están los diez. Los dos que no se pueden ejecutar aquí lo dicen en vez de darse por buenos: el
**Test E** (*"cerrar aplicación"*) se comprueba hasta donde llega Node —el estado sobrevive al viaje
por JSON y por el normalizador, que es lo que hacen `saveData`/`loadData`— y que Supabase responda es
**R1**; el **Test J** (*"probar en móvil"*) necesita un iPhone, también **R1**.

### Verificación
`bash scripts/verificar.sh` en verde: build de Vite, **3 151 comprobaciones unitarias**, 5 de
auditoría, **352 casos de renderizado real** y 10 reglas invariantes — **3 508 en total**. De ellas,
**157 nuevas** para EH F2.

---

## Entrega 2 · EH Fase 1/65 — Arquitectura base y sistema modular (v1.67.0)

### Empieza el bloque más grande del proyecto
Estilo de Hombre son **65 fases**: más que todo JosStyle construido hasta hoy. Esta primera no
construye ni un apartado de contenido —el enunciado lo prohíbe expresamente, apartado 14— sino **el
sistema que va a sostener a los otros 64**.

### Añadir un módulo es añadir una línea
Es el apartado 9: *"la arquitectura permita añadir decenas de módulos posteriormente sin rehacer
este sistema"*. En `src/lib/estiloDeHombre.js` los trece apartados son trece líneas de un array:

```js
{ id: 'skincare', nombre: 'Skincare', icono: '🧴', sub: 'Rutina de piel', fase: 6 },
```

Nada más. Ni un `case`, ni un `if`, ni un sitio donde acordarse de registrarlo. **Esa es la única
razón por la que este archivo existe antes que ninguna pantalla.**

### El catálogo va a cambiar, y el normalizador lo sabe
Sesenta y cuatro fases por delante significan que el catálogo **va a crecer**, y probablemente
también a encoger. `normalizarEstiloHombre` aguanta las dos direcciones:

- **Lo guardado que ya no está en el catálogo se descarta.** Un módulo retirado no puede quedarse
  como un id fantasma que ninguna pantalla sabe pintar.
- **Lo nuevo del catálogo aparece apagado.** Si apareciera encendido, cada fase futura le encendería
  a Josué un apartado que él no ha pedido — y son sesenta y cuatro fases de eso.

### ⚠️ `alternarModulo` no toca `config`. Jamás
El apartado 7 lo dice con esas palabras: *"desactivar un módulo NO elimine sus datos"*. Aquí el
peligro no es el del normalizador de siempre —olvidar un campo y borrarlo sin querer— sino el
contrario: **limpiar los datos "por orden"** al apagar el interruptor.

Apagar es apagar. Los datos de skincare siguen ahí seis meses después, y al volver a encenderlo
están como los dejó. Hay una prueba que guarda una configuración, apaga, enciende y comprueba que
sigue entera; es una de las dos que **fallan en silencio** si alguien se despista.

### ⚠️ El apartado 10, escrito como función y no como recordatorio
*"Estilo de hombre NO debe crear una copia de los datos globales."* Peso, altura, sueño, agua,
entrenamiento — ya viven en Salud, Sueño, Nutrición y Calistenia.

Un documento diciéndolo se olvida. Así que están declarados en `FUENTES_GLOBALES`, y `esDatoGlobal()`
responde. Una fase futura que quiera guardar el peso aquí **choca con una función**, no con la buena
memoria de quien lea el documento.

### Las plaquitas dicen la verdad
Ninguno de los trece apartados tiene contenido todavía. Podrían abrir trece pantallas vacías; en vez
de eso **la pantalla escribe que el contenido llega en las siguientes fases**. Es la regla 8: nada de
"próximamente", pero tampoco fingir que algo funciona.

### La pantalla no decide su propio estado
Los tres casos del apartado 13 —sin configurar, configurado sin nada encendido, con apartados— los
calcula `estadoPantalla()`, que se prueba con Node. Tres `if` encadenados en una vista es donde
aparece el cuarto caso que nadie contempló.

### Dónde vive
`app_data`, clave `estiloHombre`. **Sin SQL nuevo.** Entra por *Más → Estilo de hombre*, dentro de un
área que ya existía: las cinco pestañas de abajo siguen siendo cinco (regla 10).

### ⚠️ C-24 — el "106" de la portada no cuadra
Al abrir el bloque: toda la documentación llama a la Entrega 2 *"las 106 fases"*, pero el desglose
por módulos suma **110** (EH 65 + HT 12 + FO 12 + SR 9 + ME 4 + BI 4 + AR 4). Las fases de EH están
numeradas *"x/65"* en la propia especificación de Josué, así que el desglose es el que manda sobre el
trabajo. No lo he cambiado por mi cuenta: está anotado en `docs/03` como **C-24** y **no bloquea
nada**, porque el trabajo ya se está haciendo con el número bueno.

### Verificación
`bash scripts/verificar.sh` en verde: build de Vite, **2 994 comprobaciones unitarias**, 5 de
auditoría, **332 casos de renderizado real** y 10 reglas invariantes — **3 331 en total**. De ellas,
**69 nuevas** para EH F1, con los 7 tests obligatorios del apartado 15 cubiertos.

---

## Entrega 2 · SO Fase 4 — Diseño y especificación de los sonidos (v1.66.0)

### Lo que esta fase puede hacer, y lo que no
*"Definir y preparar la biblioteca sonora."*

**No crea los sonidos, y no puede.** No hay ni un archivo de audio en el proyecto, y generarlos sería
inventarse la mitad del trabajo (regla 8).

Lo que sí hace —y es exactamente el verbo del enunciado— es **definir**: la ficha de cada archivo,
escrita como código. Nombre exacto, carpeta, familia, duración mínima y máxima, si lleva variantes y
si tiene que ser único.

**Eso convierte *"dame los sonidos"* en una lista precisa.** El día que estén en `public/sonidos/`
con estos nombres, suenan sin tocar una línea: el motor de SO F1 ya los busca ahí.

### La familia manda sobre el tramo
El enunciado da dos cosas: familias (UI, feedback, reward…) y tramos de duración (microinteracción
40-150 ms, feedback 100-300…). Se cruzan, y **gana la más estricta**.

Un `ui_click` de 300 ms cumpliría "feedback" y aun así **se pisaría con el siguiente toque**. Hay una
prueba de que ningún sonido acaba con un rango imposible.

### La firma, en intervalos y no en notas
*"Un motivo de 2-4 notas que pueda aparecer de forma evolucionada."*

Está definida como **intervalos** (0, 5, 7 — cuarta justa y segunda mayor), no como notas concretas:
así se transporta a cualquier tonalidad y sigue reconociéndose. Con sus cinco evoluciones, de las
tres notas limpias en un logro a la firma completa con cola larga en un gran logro.

Y **se llama "firma de JosStyle"** (D2-08): *JC Lifestyle* es el nombre histórico que aparece en la
especificación, no el del proyecto.

### Los importantes son únicos
Los que se repiten mucho llevan variantes numeradas: `ui_click_01`, `_02`, `_03`. Oír el mismo clic
doscientas veces al día es exactamente lo que cansa.

Pero el enunciado enumera los que **no**: `level_up`, `personal_record`, `grand_achievement`, los
milestones grandes y los 365 días. **Un récord con tres variantes deja de ser un momento** — la misma
razón por la que SO F1 le puso el cooldown más largo.

El validador rechaza un `personal_record_02` por ese motivo, con esas palabras.

### `queFalta()`
La función más honesta del archivo. Hoy devuelve **la lista entera**, porque no hay ni uno.

Dice cuántos faltan, cuáles son los únicos (que son los que más cuestan y más se notan) y **por dónde
empezar**: los de interfaz, que son los que se aprecian nada más usar la app.

### Un hueco que cazó la comprobación cruzada
`goal_progress` estaba en el catálogo de SO F3, podía sonar, y **no tenía archivo definido**. La
prueba que cruza el catálogo con la biblioteca lo encontró.

### Lo que no se ha construido, y es un límite de fase
- **La pantalla de Ajustes de sonido**: SO F1 terminaba con *"DETENTE. No empieces todavía la
  biblioteca de sonidos ni la pantalla de Ajustes"*, y esa pantalla es de **SO F5**.
- **Los archivos**: ⏸ los da Josué *"cuando la web ya tenga todos los botones activos"*. **SO F2 es
  la fase que los necesita y sigue bloqueada.**

### Verificación
**3221 comprobaciones y 10 reglas invariantes en verde** (antes 3162), 59 de la biblioteca definida.
`package.json` → **v1.66.0**.

⚠️ **Ningún SQL nuevo.** Siguen los dos bloques pendientes: bucket `armario` (AR F1) y bucket
`fondos` (FO F2).


## Entrega 2 · SO Fase 3 — Eventos, feedback, recompensas y racha (v1.65.0)

### Por qué esta fase va antes que la 2
SO F2 es la biblioteca de sonidos y **sigue bloqueada**: no hay ni un archivo de audio en el
proyecto, y Josué dijo que los daría *"cuando la web ya tenga todos los botones activos"*.

El catálogo de eventos y la jerarquía **no los necesitan**. Así que se adelanta, en vez de dejar el
bloque parado esperando.

### Los 42 eventos, sin crear un segundo catálogo
SO F1 dejó 17 eventos y cuatro prioridades, que era lo que el motor necesitaba. Esta fase trae los 42
que pide la especificación.

⚠️ Pero **no redefine ninguno de F1**: los traduce. Dos catálogos que se separan con cada fase es
exactamente lo que el apartado 30 de aquella fase prohíbe.

### Un solo sonido cuando pasan cinco cosas a la vez
*"Completar tarea → +XP → subir de nivel → alcanzar milestone → nuevo récord."* Cinco eventos, un
sonido: **PERSONAL_RECORD**.

Y los otros cuatro **se devuelven**, no se pierden: la especificación dice que *"la interfaz puede
mostrar visualmente todos los acontecimientos, pero el audio debe mantener jerarquía"*.

Esto no sustituye al cooldown de SO F1 — aquel evita que veinte toques den veinte sonidos, esto elige
cuál de los cinco simultáneos suena. Son dos problemas distintos.

### Un bug que cazó su propia prueba
El desempate a igual nivel era "gana el que tenga más días", pensado para milestone contra milestone.
Pero eso hacía que **el milestone de 30 días ganara al récord**, que es justo lo contrario de lo que
dice la especificación con ese ejemplo delante.

Ahora el récord lleva su propio peso de desempate, y el de 365 días sigue ganando al de 100.

### La racha sube de identidad, no de volumen
*"Los milestones deben ser progresivamente más especiales. No quiero simplemente el mismo sonido con
más volumen. Debe existir una evolución real de la identidad sonora."*

Traducido a algo comprobable: **el nivel sube con los días**. El de 3 días es nivel 2, el de 7 es 3,
el de 30 es 4, el de 365 es 5. Hay una prueba que recorre los diez milestones y falla si dos
consecutivos bajan, y otra de punta a punta.

Y **el récord es independiente del milestone**: *"has alcanzado un milestone"* y *"has superado tu
propio récord"* son acontecimientos diferentes, y la especificación lo dice con esas palabras.

### Los eventos que hoy no emite nadie, dichos con su motivo
La especificación lista `xp_small`, `level_up`, `reward_major` y `streak_freeze_used`. Pero:

- **RA F3 decidió no construir XP ni niveles.** Sus apartados los dejaban en condicional, y sin nada
  que gastar un contador de XP es un control decorativo (regla 8). D2-02 lo respalda.
- **El "congelar racha" no existe en RA F1**: el motor deriva la racha del historial y no tiene
  comodines.

Así que esos eventos **están en el catálogo** —para que el día que haya XP suene sin tocar nada— y
**cada uno lleva escrito por qué hoy no lo emite nadie**, con una prueba que lo comprueba. Un evento
fantasma sin explicación es lo que hace que alguien lo conecte mal seis meses después.

### Verificación
**3162 comprobaciones y 10 reglas invariantes en verde** (antes 3115), 47 del catálogo.
`package.json` → **v1.65.0**.

⏸ **Sigue sin sonar nada**, y es lo mismo desde SO F1: no hay archivos de audio. **SO F2 es justo la
fase que los necesita.**

⚠️ **Ningún SQL nuevo.** Siguen los dos bloques pendientes: bucket `armario` (AR F1) y bucket
`fondos` (FO F2).


## Entrega 2 · HT Fase 12 — Cloud, sincronización y arquitectura definitiva (v1.64.0) 🔒 CIERRA HORARIO TOP

Con esta fase **el bloque HT queda cerrado: 12 de 12**.

### Una sola puerta
Once archivos de horario no pueden ser once puntos de entrada. `diaCompleto()`, `resumenModulo()` y
`contextoCompletoIA()` son la única puerta desde fuera; cada archivo sigue siendo dueño de lo suyo
(apartados 90 y 91).

### Exportar sin llevarse lo que no es
Se exporta la estructura y los datos: horarios, asignaturas, clases, materiales, mochilas, kits,
reglas y automatizaciones.

**No viajan** lo que confirmaste que hiciste, los avisos que ya se dieron ni lo que metiste en la
mochila cada día. Son de este curso y de este aparato — llevárselos daría un histórico que no
ocurrió. Y está escrito **por qué**, para que nadie los añada sin pensarlo.

### Importar dos veces no duplica el curso
Es la propiedad que evita el desastre, y es la misma idempotencia de RA F2: se compara por id, así
que pegar el mismo archivo dos veces no crea cuarenta clases repetidas.

Antes de escribir se revisa y se dice **cuánto traería y qué no va a traer**. Un archivo de otro
módulo se rechaza; uno de una versión más nueva también, en vez de intentar adivinarlo.

Y sustituir el horario entero **no borra lo que confirmaste**: eso sigue siendo de este dispositivo.

### La auditoría es código, no un documento
El apartado 103 enumera cincuenta y tres cosas que Horario Top tiene que saber hacer. Las 38
comprobables **están atadas a una función que tiene que existir**.

Si alguien borra una, la prueba falla sola. Un documento que dice "está todo" se desactualiza en la
primera fase que venga después; esto no puede.

Es la misma decisión que HT F1 tomó al construir un módulo probado en vez de un documento de
arquitectura.

Y **lo que la auditoría no puede comprobar, lo dice ella misma**: el responsive, la accesibilidad
real con lector de pantalla, el modo oscuro en pantalla, el diseño, los backups de Supabase (son de
la consola) y las Edge Functions (infraestructura que el proyecto no tiene). Decir que están porque
hay una clase de CSS sería mentir.

### Cloud, RLS y multidispositivo: ya estaban
No se ha rehecho nada. **Se resolvieron en HT F2**, y con la decisión más importante del módulo: el
apartado 51 obliga a *"adaptarse a la arquitectura global"*, así que el horario vive en `app_data`
con RLS por usuario — **sin una tabla propia y sin un SQL que Josué tenga que ejecutar**.

La auditoría lo comprueba de verdad: **no hay `user_id` que falsear** en el modelo.

### Lo que queda montado
`Horario → Estudios → Mochila → Tareas → Objetivos → Entrenamiento → Productividad → IA →
Notificaciones → Analítica`, entero, y cada eslabón **lee** del dueño del dato en vez de copiarlo.

### Verificación
**3115 comprobaciones y 10 reglas invariantes en verde** (antes 3066), 45 del cierre y 308 casos de
renderizado. `package.json` → **v1.64.0**.

⚠️ **Ningún SQL nuevo, en las doce fases del módulo.** Siguen los dos bloques pendientes de siempre,
que son de otras fases: bucket `armario` (AR F1) y bucket `fondos` (FO F2).


## Entrega 2 · HT Fase 11 — Analítica personal, carga, progreso y aprendizaje (v1.63.0)

### La frase que decidió cómo construir la fase
Esta es la especificación más corta de las doce: veintitrés puntos y ninguna letra pequeña. Pero uno
de ellos dice cómo hay que hacer todo lo demás:

> *"…y un sistema de aprendizaje que mejore las sugerencias **sin convertirlo en una caja negra**."*

Así que aquí **no hay ni un número que no se pueda explicar**. Cada cifra viene con de dónde sale
—*"de 9 días con clases, confirmadas a mano"*— y lo que el sistema "aprende" son frases que se leen y
se comprueban: *"por la tarde confirmas menos (3 de 12)"*.

### Sin datos no se inventa una tendencia
Con tres días no hay tendencia; hay tres días.

- **Por debajo de 3 ocurrencias no se afirma ningún patrón.** "Los martes te saltas el estudio"
  basado en un martes es una afirmación inventada.
- **La tendencia necesita los dos periodos con datos.** Comparar una semana llena con una de
  vacaciones diría "has bajado un 80 %", y sería mentira.
- **Menos de 10 puntos de diferencia no es tendencia**: es ruido de una semana.

Y cuando no hay bastante, se dice: *"todavía no hay suficientes semanas para comparar"*, no un cero.

### Un bug de diseño que cazó su propia prueba
`suficientesDatos` solo miraba si había clases planificadas. Con cero confirmaciones eso daba *"esta
semana 0 %, la anterior 0 %"* — que **da por hecho que Josué no hizo nada**, cuando lo que pasa es
que no ha usado el botón de confirmar.

Ahora hace falta también **alguna confirmación**, y si no la hay se dice con esas palabras: *"hay 40
actividades en esos días, pero ninguna confirmada todavía"*.

### Describe, no juzga
Es la misma línea de la mochila (*"sin castigo"*), del planificador (*"no castigar"*) y de D2-02
(*"no sobregamificar"*). Un 40 % es un dato, no una nota.

Hay una **lista declarada de palabras prohibidas** y una prueba que **recorre todos los textos que
genera el archivo** —resumen, orígenes, patrones, tendencia y recomendaciones— buscando reproches, en
el peor escenario posible: cuatro semanas de clases y nada confirmado. Más otra que comprueba que no
hay ni puntos, ni niveles, ni rachas.

### Detalles que evitan medias verdades
- **Solo cuentan los días ya pasados**: incluir el futuro daría un cumplimiento que baja solo según
  avanza la semana.
- **La media es de los días ocupados**: incluir los domingos vacíos la hunde y deja de describir cómo
  es un día de instituto.
- **Los días sin mochila no cuentan**: un domingo no es un olvido.
- **Las tareas sin fecha se cuentan aparte**, no como vencidas.

### Lo que no se ha construido, y por qué
- **Gráficas**: la especificación no las pide, y el proyecto **ya tiene** un módulo de Estadísticas
  con las suyas. Un segundo sistema de gráficas dentro del horario sería la duplicación de siempre.
- **Cumplimiento de objetivos y hábitos**: los objetivos son su módulo y los hábitos viven en
  Productividad con sus rachas. Medirlos aquí daría dos números distintos para lo mismo.

### Verificación
**3066 comprobaciones y 10 reglas invariantes en verde** (antes 3009), 49 de la analítica y 304 casos
de renderizado. `package.json` → **v1.63.0**.

⚠️ Sin probar: la pantalla del informe. Como todo desde R1.

⚠️ **Ningún SQL nuevo.** Siguen los dos bloques pendientes de siempre: bucket `armario` (AR F1) y
bucket `fondos` (FO F2).


## Entrega 2 · HT Fase 10 — Notificaciones, recordatorios y contexto proactivo (v1.62.0)

### La mitad que faltaba: decidir, no mandar
El proyecto **ya tiene** quien manda notificaciones: `notificaciones.js`, de la Fase A4, con el
permiso del navegador, el interruptor global, las categorías y el horario de descanso. Un segundo
emisor daría dos avisos por lo mismo.

Así que lo construido es la otra mitad:

- **`avisosHorario.js` decide** qué avisar, cuándo y con qué prioridad. Puro, se prueba con Node.
- **`notificaciones.js` manda.** Toca el navegador.

Es el mismo reparto de SO F1 (`audio.js` decide, `audioEngine.js` suena), y por el mismo motivo: la
decisión es donde están los errores que importan, y la decisión sí se puede probar.

### Que exista un evento no significa que haya que avisar
Es la regla fundamental de la fase (apartado 4). Por eso hay un motor con las seis preguntas del
apartado 5 en vez de un `if`:

¿Es importante? → ¿Está configurado? → ¿Es el momento? → ¿Ya se avisó? → ¿Sigue valiendo? → Enviar.

Y **cada rechazo lleva su motivo por escrito**: "todavía no toca", "ya se avisó de esto", "estás en
horas de descanso". Sin eso, contestar *"¿por qué no me ha avisado?"* sería adivinar.

### Tres avisos se convierten en uno
Seis clases un martes no son seis notificaciones (apartado 34). Cuando hay más de uno que mandar a la
vez, se junta en uno solo — *"3 cosas hoy: Examen, Mates, Biología"* — con **lo más importante
primero**.

Y el resumen nocturno **calla si mañana no hay nada**. Uno que dice "mañana no tienes nada" todas las
noches de las vacaciones es exactamente el ruido que el apartado quiere evitar.

### No molestar se respeta también con lo crítico
Un aviso de mochila a las 3 de la mañana **no es más útil por ser urgente**. Así que las horas de
descanso ganan a todo, incluida la prioridad crítica. Tiene su propia prueba.

### Un aviso caduca
Si la clase ya pasó o la tarea ya está hecha, el aviso programado **no se manda** (apartado 52).
Avisar de algo que ya no aplica es peor que no avisar.

Y con más de dos horas de retraso tampoco: avisar a las 12 de una clase de las 8 solo hace ruido.

### Lo crítico es lo crítico
Un examen **mañana** es lo único que sube a crítica solo. Uno de dentro de tres días es alta. Uno de
dentro de un mes no avisa todavía.

Y **que falte material en la mochila no es crítico**: es importante. Confundirlos hace que lo crítico
deje de serlo, que es cómo se acaba ignorando el aviso que sí importaba.

Si la mochila está completa, no se avisa. Si no hay tareas vencidas, no se avisa de tareas.

### El centro de avisos
Lo que se ha avisado, con los **sin leer primero**, y las tres acciones del apartado 57: posponer, dar
por leído y archivar. Archivar da por leído — nadie archiva algo sin mirarlo.

Posponer vive en la sesión, no se guarda: es una decisión de este rato, no un dato.

### Lo que no se ha construido, y por qué
- **Push Cloud con la app cerrada** (47-49): exige un Service Worker que escuche `push`, una tabla de
  suscripciones y otra función serverless. Es infraestructura nueva —ya documentada como fuera de
  alcance desde la Fase A4— y añadiría un tercer bloque de SQL a los dos que Josué tiene pendientes.
- **Ubicación y contexto de dispositivo** (44-45): necesita GPS.
- **Sonido y vibración** (82-84): el sonido es **SO · Sonido**, con su motor y su regla invariante.
  Meterlo aquí sería el segundo sistema que esa regla impide.
- **Cloud y conflictos** (86-88): resuelto desde HT F2.

### Verificación
**3009 comprobaciones y 10 reglas invariantes en verde** (antes 2934), 71 del motor de avisos y 296
casos de renderizado. `package.json` → **v1.62.0**.

⚠️ Sin probar: que la notificación llegue de verdad al iPhone, el permiso del navegador y Web Push
con la app cerrada. Como todo desde R1 y la Fase A4.

⚠️ **Ningún SQL nuevo.** Siguen los dos bloques pendientes de siempre: bucket `armario` (AR F1) y
bucket `fondos` (FO F2).


## Entrega 2 · HT Fase 9 — IA de horario y planificador personal (v1.61.0)

### Dónde está la IA en la arquitectura
El apartado 52 lo dibuja así:

    DATOS → MOTOR TEMPORAL → MOTOR DE PLANIFICACIÓN → IA → PROPUESTA → CONFIRMACIÓN → CAMBIOS

La IA está **después del planificador y antes de la confirmación**. No calcula y no escribe. Lo que
se ha construido es el motor que va antes: `planificador.js`, **determinista** — los mismos datos dan
el mismo plan, y se prueba entero con Node.

### Sin confirmar no se escribe nada
`aplicarPlan` sin `confirmado: true` **no hace nada**. No es una comprobación defensiva: es la regla
7 del proyecto puesta en código, para que sea imposible que una respuesta de la IA cambie el horario
sola.

Y el botón dice exactamente qué va a pasar: *"se van a crear 4 sesiones en tu horario; puedes
cambiarlas o borrarlas después como cualquier otra clase"*.

### Los números salen del motor, no de una estimación
*"Tienes 1 h 20 min libres"* lo dice el motor temporal (apartado 51). Por eso el contexto que se le
manda a la IA lleva los huecos, la carga y las prioridades **ya calculados**.

Y **no se manda toda la base de datos** (apartado 50): solo lo relevante. Nunca las notas privadas de
una actividad, nunca una palabra del módulo de Relación. Hay pruebas de las dos cosas.

### Un hueco de 35 minutos no sirve para una sesión de 30
Hay que levantarse, llegar y sentarse. Por eso el planificador descuenta margen y transición, y el
hueco propuesto **empieza después de la transición**, no pegado a la clase anterior.

Y *"no estudiar después de entrenar"* funciona de verdad: lo que se pidió evitar **no sale en la
lista**, no se ordena al final. Si saliera, acabaría eligiéndose un día con prisa.

### La víspera es repaso, no materia nueva
El plan reparte el temario entre los días que quedan y **deja la víspera para repasar**. Meter el
último tema el día antes es exactamente lo que hace llegar al examen sin haberlo visto dos veces.

El día del examen no se estudia. Y si el examen es hoy, lo dice y desea suerte — no propone nada.

### No castiga
El apartado 19 se titula así. Si el martes no estudiaste, el plan **no dice "has fallado"**: dice
*"te quedan dos sesiones antes del examen, el plan se reajusta así"*.

Hay una prueba que falla si aparece "has fallado", "mal", "deberías" o "penalización".

### Ninguna acción de la IA borra nada
Cuatro acciones estructuradas y cerradas: crear una sesión de estudio, crear una tarea, mover un
bloque, añadir algo a la mochila. **Ninguna borra.** Una IA que pueda proponer un borrado acabará
proponiéndolo el día que no te fijes.

Se validan antes de tocar nada —fecha, horas coherentes, que el bloque exista— y se previsualizan sin
escribir, igual que los `impacto*()` de HT F4.

Y una tarea **no se escribe aquí**: se devuelve marcada para Productividad, que es su dueña.

### El número de prioridad no se enseña
El cálculo existe (apartado 21) y es determinista: vencido, hoy, examen, prioridad y días de margen.
Pero "esto vale 87 puntos" no le dice nada a nadie. Lo que se enseña es **el orden y el motivo**:
*"se pasó hace 1 día"*, *"es mañana"*, *"faltan 3 días"*.

### Lo que no se ha construido, y por qué
- **Chat contextual** (3, 41, 46-48): el proyecto **ya tiene** buscador con IA (BI F3-F4) y el proxy
  de `api/ask-ai.js`. Un segundo chat sería la cuarta lista que D2-07 prohíbe. Lo que faltaba —el
  contexto que se le manda— es lo que está hecho.
- **Descomponer tareas grandes** (22-24): trocear "hacer el trabajo de Historia" exige entender el
  trabajo, no el horario.
- **Tiempo de desplazamiento** (29): necesita mapas.
- **Memoria de IA** (65): guardar preferencias aprendidas sin que Josué las vea sería justo lo que la
  regla 7 evita. Las preferencias **se declaran**, no se deducen.

### Verificación
**2934 comprobaciones y 10 reglas invariantes en verde** (antes 2854), 72 del planificador y 292
casos de renderizado. `package.json` → **v1.61.0**.

⚠️ Sin probar: la respuesta real de la IA y la pantalla. Como todo desde R1.

⚠️ **Ningún SQL nuevo.** Siguen los dos bloques pendientes de siempre: bucket `armario` (AR F1) y
bucket `fondos` (FO F2).


## Entrega 2 · HT Fase 8 — Motor temporal y automatizaciones inteligentes (v1.60.0)

### "Pasada" no es "completada"
Es la distinción que sostiene la fase entera. *"La hora terminó"* y *"la actividad se realizó"* son
cosas distintas: una clase a la que no fuiste terminó igual, pero no la hiciste.

Confundirlas rompe el histórico, así que:

- **"Pasada" se calcula del reloj.** Guardarlo dejaría de ser verdad en un minuto, y a las 23:59
  media app estaría diciendo "en curso" de algo de por la mañana.
- **"Completada" se guarda**, porque no hay forma de deducir del reloj si fuiste a clase. Y es lo
  único que se guarda de todo esto.

Confirmar es siempre opcional. Nada obliga a marcar nada.

### El tablón se vacía solo
Lo terminado **sale del tablón principal** y se consulta con un toque: a las 20:00 lo que importa no
es la clase de las 8.

Debajo, el día lleva su cuenta: *"2 de 3 terminadas confirmadas"*. Las completadas cuentan también
como terminadas — contarlas aparte daría totales que no suman.

### El cambio de día, dicho con honestidad
No hay proceso de fondo en una PWA. Un temporizador que corriera toda la noche no existe en iOS.

Así que el "cambio de día" es lo que sí se puede hacer: comparar la fecha que la pantalla creía con
la de ahora, y recalcular si no coinciden. Funciona, y no finge un servicio que no está corriendo.

### La excepción gana a la regla
El motor es trigger → condiciones → acción, con **todas** las condiciones exigidas.

Y el apartado 45 pone el caso: *"añadir bata"* como regla general, *"no llevar bata el 15 de
septiembre"* como excepción. **El 15 no se lleva bata.** Sin esto, una regla general no se podría
matizar nunca, y la única salida sería borrarla y volver a crearla.

El motor es **deliberadamente cerrado**: cuatro triggers, cinco condiciones y cuatro acciones. Uno
abierto sería un lenguaje de programación dentro de una app de instituto, y nadie podría depurar por
qué apareció una bata.

### Nada crítico se ejecuta solo
Las acciones tienen nivel: informativa, reversible e importante. **No hay críticas** — nada de lo
que puede hacer una regla borra datos.

Y lo importante **no se ejecuta sin confirmar**, ni siquiera dentro de un "hacerlo todo": ahí se
queda fuera del lote y se pregunta aparte. Ejecutarlo "porque estaba en el lote" sería saltarse el
apartado 53 por comodidad.

### Todo lo automático se explica y se deshace
*"21:00 → Añadida bata automáticamente por Biología."* Con su hora, su motivo y un botón.

⚠️ Y **deshacer un aviso ya dado no revierte nada** — no se puede "no avisar". Así que se marca en el
historial y se dice que no tuvo efecto, en vez de fingir que sí.

Lo que pone una regla en la mochila **no se marca como manual** a propósito: si lo hiciera, sería
eterno y el motor de la mochila no podría recalcularlo nunca.

### La IA no es el motor
El apartado 55 lo dice y aquí se cumple: el motor es determinista y se prueba entero con Node. La IA,
cuando llegue en la Fase 9, **propondrá** reglas para que Josué las apruebe — no las ejecutará.

### Verificación
**2854 comprobaciones y 10 reglas invariantes en verde** (antes 2772), 74 del motor temporal y 284
casos de renderizado. `package.json` → **v1.60.0**.

⚠️ Sin probar: que la pantalla se refresque sola al pasar la hora y el cambio de día con la app
cerrada. Como todo desde R1.

⚠️ **Ningún SQL nuevo.** Siguen los dos bloques pendientes de siempre: bucket `armario` (AR F1) y
bucket `fondos` (FO F2).


## Entrega 2 · HT Fase 7 — Mochila inteligente, materiales y preparación automática (v1.59.0)

### La mochila es una consecuencia, no una lista
*"Día → actividades → materiales → excepciones → mochila."*

Nada de lo que sale en la mochila se ha escrito a mano: sale del horario de ese día y de los
materiales de cada asignatura. Lo único que se guarda es lo que **no se puede deducir**: qué has
metido ya, qué has añadido tú, en qué estado está cada cosa y dónde la tienes.

Se ve dentro de HOY, con dos tarjetas: **la de hoy** y **la de mañana**, que es la que de verdad se
prepara por la noche. Y la de mañana ya existe hoy, sin esperar a las 00:00, porque no se genera:
se deriva.

### Lo que añades a mano no se borra solo
Es la regla que se rompe sin que nadie se entere. Si escribes "llevar bata igualmente", el recálculo
de mañana **no puede** hacerla desaparecer (apartado 57).

Por eso cada elemento sabe de dónde viene (apartado 58) y el motor solo toca los automáticos. Tiene
su prueba: se añade a mano, se recalcula entero y sigue ahí.

### Una libreta es una libreta, pero dos hojas y tres son cinco
Dos asignaturas que piden libreta dan **1 libreta, para Biología y Matemáticas** — no dos entradas
iguales (apartado 60).

Pero con los **consumibles** es al revés: dos hojas y tres hojas **son cinco hojas** (apartado 61).
El inventario es quien sabe qué es consumible, así que se lo dice al agrupador de HT F2 en vez de
escribir un segundo agrupador.

### Cada cosa dice por qué está
Tocar la bata explica: *"la necesitas porque tienes Biología"*. Y si es una dependencia, *"va con el
iPad"*; si es de la base, *"siempre lo llevas"*; si la pusiste tú, lo dice.

Una checklist que no se explica es una checklist que se ignora.

### "Meter todo" no marca lo que no tienes
Si la bata está prestada o perdida, "Meter todo" **la salta**. Marcarla sería mentira, y la mochila
dejaría de servir justo el día que importa.

En su lugar sale tachada, con el motivo: *"necesitas la bata y la tiene Jorge"* (apartado 38).
Devolverla borra ese nombre — si no, seguiría diciendo "la tiene Jorge" para siempre.

### Kits, dependencias y reglas
- **Dependencias** (96-97): iPad → cargador → cable, resuelto en cadena. ⚠️ Y un ciclo (A necesita B
  y B necesita A) **no cuelga la app**: sin cortarlo, la pantalla se quedaría en blanco.
- **Reglas** (75-79): tres condiciones — por actividad, por día de la semana, por etiqueta.
  Deliberadamente simple: un motor con anidamiento sería un lenguaje de programación dentro de una
  mochila.
- **Mochila base** (26): estuche, botella, cargador. Lo que va siempre, sin depender del horario.

### Sin castigo
El apartado 105 se titula exactamente así. Se detecta que faltó algo y **no se riñe**: el mensaje es
*"pasa"*. Hay una prueba que falla si aparece la palabra "fallo", "mal" o "penalización", y otra que
comprueba que no hay ni puntos, ni niveles, ni rachas de mochila (D2-02).

### Un bug de datos evitado antes de que pasara
`normalizarHorarioTop` no conocía `materiales`, `enlacesMaterial`, `mochila` ni las cinco colecciones
nuevas. Y decenas de funciones devuelven `normalizarHorarioTop(estado)` — cualquiera de ellas habría
borrado **el material y la mochila enteros** en el siguiente guardado.

Es el mismo fallo de `visible` (HT F2), `archivado` (HT F4) y `grupos` (HT F5), pero con muchos más
datos por delante. Esta vez se vio al añadir los campos, no al perderlos.

Y otro: el campo se llama `metido` desde HT F2. Inventar aquí un `preparado` habría dado un botón
que se olvida al recargar. Se reutiliza el que ya existía.

### Lo que no se ha construido, y por qué
- **Recordatorio a las 21:00** (47-49): es una notificación, y eso es la Fase 10. Lo que sí está es
  **qué** diría: el aviso con los nombres de lo que falta.
- **Conexión con Economía** (65): la lista de compra dice qué falta; crear un gasto por una libreta
  que no se ha comprado sería inventarse un movimiento.
- **IA para configurar reglas** (80): la IA nunca se dispara sola (regla 7), y esto es Fase 9.
- **Widget y pantalla de bloqueo** (111-112): la propia especificación los llama "futuro", y una PWA
  en iOS no puede hacerlos.

### Verificación
**2772 comprobaciones y 10 reglas invariantes en verde** (antes 2679), 85 de la mochila y 276 casos
de renderizado. `package.json` → **v1.59.0**.

⚠️ Sin probar: la pantalla, los gestos y el recordatorio de las 21:00. Como todo desde R1.

⚠️ **Ningún SQL nuevo.** Siguen los dos bloques pendientes de siempre: bucket `armario` (AR F1) y
bucket `fondos` (FO F2).


## Entrega 2 · HT Fase 6 — Calendario, agenda y sistema HOY (v1.58.0)

### HOY es ahora la primera pantalla del horario
Cuatro tarjetas, en el orden de las preguntas que uno se hace al abrir la app:

**AHORA** (qué estoy haciendo, y cuánto le queda) · **SIGUIENTE** (qué viene, y en cuántos minutos) ·
**PENDIENTE** (qué se me olvida) · **MAÑANA** (qué preparo esta noche).

Es una vista más dentro del módulo Horario, la primera y la que sale por defecto. **La barra inferior
sigue teniendo cinco pestañas**: un módulo nuevo entra en un área existente, nunca en la barra.

### No guarda una copia de nada
El apartado 102 decide la forma del archivo entero: *"HOY no almacenará una copia independiente de
todo. Consultará las entidades originales."*

Así que `hoy.js` es una función de lectura y nada más. Completar una tarea desde Productividad cambia
HOY sin que HOY se entere, y hay una prueba que lo demuestra. Si guardara "las cosas de hoy" habría
dos verdades, y la copia empieza a mentir en cuanto se toca la original.

### El 90 % del trabajo fue no volver a construir
La especificación describe HOY como si el proyecto empezara de cero. No empieza:

- **Los eventos de otros módulos** ya los reúne `eventosDerivados`, del Calendario, con exámenes,
  tareas, entrenamientos y objetivos. Se lee de ahí; no hay un segundo recolector.
- **La línea del día, los huecos, los conflictos y los avisos** ya estaban en `horario.js` desde
  HT F1.
- **La puntuación del día** (apartado 37) ya es `puntuacion.js`, la del Dashboard. Una segunda daría
  dos números distintos para el mismo día, que es peor que no tener ninguno.

Lo que faltaba de verdad era **la pregunta**: qué pasa ahora, cuánto queda, qué viene, qué está
pendiente y en qué orden. Eso es `contextoTemporal()`, que responde las ocho preguntas del apartado
101 en una sola llamada — porque si cada tarjeta preguntara por su cuenta, acabarían diciendo cosas
distintas.

### Una tarea vencida no desaparece
El apartado 33 es explícito. Sigue arriba del todo, diciendo cuántos días lleva, y con las dos cosas
que hacen falta a un toque:

- **Completar sin abrir Productividad** (apartado 35).
- **Reprogramar en un toque** (apartado 34): mañana, este fin de semana o la semana que viene.

Y "este fin de semana" pedido un domingo por la tarde es el sábado **que viene**, no el de ayer.

### Un día sin nada no es una pantalla rota
El apartado 69 lo pide con esas palabras. Un domingo vacío dice que no hay nada programado y ofrece
montar el día; un festivo dice que es día libre. Los dos casos tienen su prueba de renderizado.

Y un domingo **no dice "clase pendiente"** si el horario escolar es de lunes a viernes (apartado 70).

### El contador baja solo
*"El contador deberá actualizarse automáticamente sin recargar la página."* (apartado 5)

Un tic de un minuto basta, porque el número se dice en minutos. Sin él, "empieza en 42 min" se
queda congelado y sigue diciendo 42 cuando la clase empezó hace diez.

### Los avisos se agrupan en uno
*"No se debe bombardear al usuario."* (apartado 81) Un mensaje —"tienes 3 cosas importantes hoy"— en
vez de tres avisos, con las tres prioridades del apartado 82: una tarea vencida y un examen mañana
son altas; algo de dentro de una semana, baja.

Aquí se **describen**. Mandarlas es la Fase 10, y el proyecto ya tiene su emisor: dos darían dos
avisos por lo mismo.

### Un bug que dejaba la pantalla en blanco
`lineaDelDia` devuelve el día entero —eventos, en curso, festivo, total, minutos—, no una lista.
Tratarlo como un array reventaba con `linea.map is not a function`. Lo cazó su propia prueba antes
de llegar a ninguna pantalla.

### Lo que no se ha construido, y por qué
- **Arrastrar bloques** (30-31): misma decisión que HT F3 — en móvil manda "Mover a…".
- **Recordatorios, ubicación y tiempo de desplazamiento** (47-52): los recordatorios son la Fase 10;
  el desplazamiento necesita mapas, que el proyecto no tiene ni ha pedido.
- **IA proactiva y planificar desde un hueco** (59, 61, 66-67): es la Fase 9. Aquí está el contexto
  que la alimentará, y la IA nunca se dispara sola (regla 7).
- **Centro de notificaciones** (83): ya existe uno. Un segundo historial sería la duplicación que el
  apartado 102 prohíbe.
- **Comando rápido** (108-109): el buscador global de BI F3-F4 ya es exactamente eso, y D2-07
  prohíbe una cuarta lista.

### Verificación
**2679 comprobaciones y 10 reglas invariantes en verde** (antes 2596), 83 del motor temporal y 268
casos de renderizado. `package.json` → **v1.58.0**.

⚠️ Sin probar: el contador que baja solo en pantalla, el aspecto en un iPhone y el recorrido tocando.
Como todo desde R1.

⚠️ **Ningún SQL nuevo.** Siguen los dos bloques pendientes de siempre: bucket `armario` (AR F1) y
bucket `fondos` (FO F2).


## Entrega 2 · HT Fase 5 — Asignaturas, actividades, colores, iconos y contexto (v1.57.0)

### "Biología" deja de ser una palabra dentro de una celda
Ahora es una entidad con identidad, color, icono, nombre corto, alias, etiquetas, profesor, aula,
material, notas, exámenes y tareas — y con una ficha que las junta todas.

Tocar el nombre de una clase en el horario abre esa ficha. Y hay una lista de todas las asignaturas,
porque una archivada ya no tiene ningún bloque y aun así hay que poder abrirla para recuperarla.

### Todo lo que se puede derivar, se deriva
Es la decisión que gobierna la fase entera. Los usos, el tiempo semanal, las más utilizadas, las
recientes y la carga de cada día **no se guardan en ninguna parte**: salen de los bloques.

Un contador de "veces usada" empieza a mentir en cuanto se borra un bloque. Y ese número es
precisamente el que decide si una asignatura se borra o se archiva: "Biología está en 6 clases"
diciendo 6 cuando quedan 4 sería peor que no decir nada.

Lo único que se guarda es lo que no se puede calcular: que Josué la marcó como favorita.

### Nunca se fusionan dos actividades solas
Antes de crear "Biología" el sistema mira si ya existe — sin importar tildes ni mayúsculas — y
enseña también las parecidas: "Biología 2", "Biología y Geología".

El apartado 57 lo dice literalmente: *"no deberá fusionar automáticamente entidades ambiguas"*.
Pueden ser dos asignaturas de dos cursos distintos, y juntarlas no se deshace. Se enseñan las tres y
elige Josué.

### Las notas privadas no llegan a la IA
El apartado 52 permite guardar una nota privada: *"recordar preguntar por la recuperación"*. El 73
dice que la información adicional es privada por defecto.

Así que la nota **sale en la ficha** —que es la pantalla de Josué— y **no viaja en el contexto que
se le manda a la IA**. Hay una prueba que falla si aparece. Lo que no sale de aquí no puede acabar
en un servidor.

Y el contexto para la IA devuelve **estructura, no un texto**, sin llamar a nadie (regla 7).

### Borrar avisa primero, y recomienda archivar
*"Biología está utilizada en 6 bloques, 4 tareas y 1 examen."* (apartado 58)

Se calcula antes de decidir y la opción recomendada es archivar: una asignatura del curso pasado
tiene exámenes, notas y horas de estudio colgando. Si no la usa nada, se dice también, y entonces
borrar no se lleva nada por delante.

Y si se borra de todas formas, **los bloques no desaparecen**: se quedan sin actividad. Perder la
hora de una clase por haber borrado la asignatura sería mucho peor que un hueco que se rellena — la
misma decisión que HT F1 y AR F2 ya tomaron.

### Las tareas se dicen como lo que son
Los exámenes se enlazan de verdad, por `asignaturaId`. Las tareas de Productividad **no tienen campo
de asignatura**, así que se enseñan las que mencionan la actividad por su nombre, y debajo pone:
*"salen las que escribiste con su nombre: las tareas todavía no se pueden enlazar a una asignatura"*.

Fingir un enlace que no existe habría sido un dato inventado (regla 8).

### Oculta no es archivada, y el color del bloque no es el de la asignatura
Dos distinciones que la especificación pide y que juntar habría roto algo:

- **Oculta** es "existe y sigue viva, pero no la quiero ver aquí"; **archivada** es "esto es del
  curso pasado". Sin las dos, el "Trabajo personal" del apartado 51 —que sale en HOY pero no en el
  horario escolar— sería imposible.
- El color va **bloque → actividad → grupo → acento**. Marcar un examen en rojo **no repinta
  Biología entera** (apartado 44).

### Un bug que se habría comido la pantalla
Una actividad puede tener madre (apartado 63: Estudios → Biología, Física, Matemáticas). Sin
comprobarlo, nada impedía ponerse a sí misma de madre — o a su propia abuela — y pintar el árbol se
habría colgado en un bucle, dejando la pantalla en blanco. `puedeSerPadre` recorre la cadena antes
de aceptar.

### Y otro que perdía datos, por tercera vez
`grupos` no estaba ni en el estado por defecto ni en el normalizador, así que se habría perdido en
el siguiente guardado. Es el mismo fallo de HT F2 (`visible`) y HT F4 (`archivado`). Esta vez se vio
antes de que llegara a pasar.

### Verificación
**2596 comprobaciones y 10 reglas invariantes en verde** (antes 2468), 116 de las actividades y 252
casos de renderizado. `package.json` → **v1.57.0**.

⚠️ Sin probar: la ficha en pantalla, el selector de iconos y el recorrido tocando en un iPhone. Como
todo desde R1.

⚠️ **Ningún SQL nuevo.** Siguen los dos bloques pendientes de siempre: bucket `armario` (AR F1) y
bucket `fondos` (FO F2).


## Entrega 2 · HT Fase 4 — Configuración avanzada de columnas, filas y bloques (v1.56.0)

### Todo detrás de un solo botón
*"Toda la potencia estará disponible, pero sin complicar la interfaz básica."* (apartado 63)

Esta fase añade semanas A/B, generación de franjas, búsqueda, zoom, densidad, archivado y validación
estructural. Si todo eso apareciera en la cuadrícula, la pantalla de todos los días sería ilegible en
un iPhone. Así que vive entero detrás de **"Opciones avanzadas", dentro del modo edición**: quien
solo quiere mirar qué le toca ahora no ve ni uno de esos controles.

### Nada se mueve en silencio
El apartado 30 es el que manda sobre toda la fase: *"No se deben mover datos silenciosamente."*

Regenerar la rejilla de horas puede dejar clases fuera de sitio. Eliminar una columna puede llevarse
bloques por delante. Cambiar el horario de una franja puede descolocar lo que había dentro.

Las tres operaciones **calculan el impacto y lo enseñan antes de escribir**, con el número exacto de
clases afectadas y un botón de "Hacerlo igualmente". Nunca se escribe primero y se avisa después.

Y regenerar las franjas **no mueve ni un bloque**: conservan sus horas, solo pierden la fila a la que
apuntaban. Las filas son la rejilla visual; los bloques guardan sus propias horas desde HT F2.

### Las semanas A/B se calculan, no se guardan
Un horario puede alternar entre semana A y semana B, hasta ocho semanas de ciclo.

**La semana en la que estamos se calcula desde una fecha ancla.** Guardar "esta semana es la B" sería
un contador, y un contador miente en cuanto pasa un lunes sin abrir la app — el mismo error que RA F1
evitó con las rachas.

Y **sin ancla no se adivina**: se enseña la semana A y se dice por qué. Adivinar sería peor que no
alternar, porque haría desaparecer clases sin motivo aparente.

Una columna sin grupo vale para todas las semanas del ciclo, que es lo que permite tener "Lunes"
fijo y solo "Miércoles A/B" alternando.

### Archivar no es borrar, y bloquear no es ocultar
Dos distinciones que la especificación pide expresamente (apartados 56 y 8):

- Un horario **archivado** sale del selector y deja de resolver fechas, pero sus bloques siguen
  guardados y se recupera de un toque. Y si están **todos** archivados, la pantalla vacía ofrece
  recuperarlos — si no, sería un callejón sin salida.
- Una columna **bloqueada** se sigue viendo y sigue resolviendo fechas: solo no se edita sin querer.

### El zoom del móvil no cambia el del ordenador
El apartado 59 separa configuración local de configuración en la nube. Aquí la línea está clara:
**estructura y datos a Supabase, preferencias de vista al aparato.**

El zoom (60–140 %) y la densidad de las filas van a `localStorage`. Sincronizarlos haría que
ajustarlos en el iPhone estropeara la vista en el ordenador, que no tiene la misma pantalla.

El zoom escala **alto y ancho** de la cuadrícula. Escalar solo hacia abajo dejaría las columnas
igual de estrechas y el nombre de la asignatura igual de ilegible.

### Un bug que perdía datos, otra vez el mismo
El normalizador de `horario.js` no conocía `archivado`, `icono`, `color`, `zonaHoraria` ni `ciclo`,
así que **archivar un horario funcionaba hasta el siguiente guardado**, y entonces volvía solo. Es
exactamente el fallo que HT F2 tuvo con `visible` y que el comentario encima de la función avisa de
que puede repetirse. Lo cazó su propia prueba.

### Una configuración extrema no puede destruir la app
El apartado 20 lo pide y hay dos topes que lo cumplen: el generador de franjas **no pasa de 40
filas** (un intervalo de 1 minuto sobre doce horas daría 720 y dejaría la app inservible) y el ciclo
de semanas se **acota a 8** en vez de descartarse — devolver 1 apagaría el ciclo entero por un
dedazo, y las clases alternas desaparecerían sin que nada lo explicara.

### Lo que no se ha construido, y por qué
- **Bloques multifila y multicolumna** (15-18): el modelo ya los permite, falta pintarlos estirados.
  Es trabajo de cuadrícula y va con la Fase 5, donde se rehace la celda.
- **Atajos de teclado** (42): Josué trabaja desde el iPhone. Sería un control decorativo.
- **Versionado, importar, exportar, imprimir y compartir** (46-52): la propia especificación llama al
  46 *"versionado futuro"*, exportar e imprimir son de la Fase 12, y compartir depende de decisiones
  de privacidad que Josué no ha tomado.
- **Cambio de hora** (54): el cambio de hora español no mueve las clases. No hay nada que construir.
- **Rendimiento de horarios enormes** (60-62): un horario de instituto son 5 columnas y 7 franjas.

### Verificación
**2468 comprobaciones y 10 reglas invariantes en verde** (antes 2308), 121 de la configuración
avanzada y 240 casos de renderizado. `package.json` → **v1.56.0**.

⚠️ Sin probar: el zoom y la densidad en pantalla real, el aspecto en un iPhone y el recorrido
tocando. Como todo desde R1.

⚠️ **Ningún SQL nuevo.** Siguen los dos bloques pendientes de siempre: bucket `armario` (AR F1) y
bucket `fondos` (FO F2).


## Entrega 2 · HT Fase 3 — Editor visual de horarios (v1.55.0)

### Un módulo nuevo: Horario
En el área Vida, junto al Calendario. La barra inferior sigue con cinco pestañas.

Dentro: cuadrícula de la semana, vista de día, agenda, acceso a HOY, y un interruptor entre **modo
consulta y modo edición** — que en un iPhone no es estética: los controles de añadir, mover y borrar
ocupan media pantalla, y el 95 % de las veces solo se quiere mirar qué toca ahora.

### Montar un horario tiene que ser minutos, no media hora
Tocar una celda, escribir "Matemáticas", Enter. El sistema busca si ya existe, la reutiliza si sí, la
crea si no, le pone un color automático y guarda.

El paso que importa es **reutilizar**: escribir "Matemáticas" otro día usa la misma actividad, con su
mismo color. Sin eso habría cuatro Matemáticas de cuatro colores, y no habría forma de cambiar el
color de la asignatura de una vez.

Y el autocompletado sugiere también **las asignaturas de Estudios que aún no están en el horario** —
sin eso, apuntar a Estudios en vez de duplicarlas no serviría de nada en la práctica.

### "Solo este lunes" no puede cargarse todos los lunes
Es lo más delicado de la fase. Cambiar la hora de Matemáticas porque hoy hubo un cambio de aula no
puede modificar todos los lunes del curso.

Se resuelve con dos alcances, y **sin valor por defecto**: si no se dice cuál, no se escribe nada. Un
defecto silencioso sería justo el error que el apartado quiere evitar, y sería irreversible sin darse
cuenta. "Solo este día" crea una excepción; el horario base no se toca.

### Cuatro cosas que no se han construido porque ya existían
Autoguardado, sincronización, deshacer y rehacer. Cada operación entra por `snapshotAndSave`, que
guarda y alimenta el "Deshacer" global — y ese cubre literalmente la lista del apartado 38: eliminar
bloque, mover bloque, cambiar color, eliminar fila, eliminar columna. Un segundo autoguardado daría
dos sistemas escribiendo la misma clave.

### Sin drag & drop, y es una decisión
El apartado 25 lo pide *"en dispositivos compatibles"*; el 26 exige que en móvil exista igualmente
"Mover a…". Se ha construido lo segundo, que es lo que Josué va a usar desde el iPhone. El arrastre se
añade encima sin tocar nada, porque acabaría en la misma función.

Y mover **conserva la duración**: arrastrar una clase de una hora a otro sitio no puede convertirla en
una de diez minutos.

### Detalles que evitan perder cosas
- **Eliminar una franja no borra los bloques que caen en ella.** Las filas son la rejilla visual; los
  bloques guardan sus propias horas. Quitar la fila de las 10:00 no puede hacer desaparecer la clase
  de las 10:00.
- **Duplicar un día sobre otro que ya tiene clases se rechaza**, con el número. Forzar sustituye, no
  acumula: es lo que espera quien dice "haz el martes igual que el lunes".
- **Un conflicto se detecta antes de escribir.** Forzar existe, pero hay que pedirlo.
- **Importar exige revisar**: la previsualización no escribe nada y aplicar solo acepta lo que salió
  de ella. Y avisa de las actividades que ya existen, para no crear una segunda Matemáticas.

### La columna de horas se queda fija
Con siete días no caben en 390 px. La hora vive **fuera** del contenedor que hace scroll, no con
`position: sticky`: en iOS, `sticky` dentro de un scroll horizontal es irregular, y aquí la solución
simple es además la robusta.

### Verificación
**2308 comprobaciones y 10 reglas invariantes en verde**, con 224 casos de renderizado. Los veinte
criterios de aceptación comprobables tienen prueba propia. `package.json` → **v1.55.0**. Van 32 de
las 106 fases; quedan 74.

⚠️ **Lo que sigue sin probarse, y se dice en la propia salida:** el aspecto en un iPhone, los gestos
y el modo oscuro.

## Entrega 2 · SO Fase 1 — Sistema global de sonido (v1.54.0)

### Lo primero: hoy no suena nada, y está dicho
**No hay ni un archivo de audio en el proyecto**, y el apartado 38 prohíbe crearlos: *"En esta fase
NO quiero: biblioteca completa de sonidos…"*. El 21 lo remata: *"Esta fase solo necesita dejar la
arquitectura lista."*

Así que el motor está entero y no suena — que es exactamente el camino de fallback del apartado 25
(*"si tampoco existe: silencio"*), no una función a medias. En cuanto los archivos estén en
`public/sonidos/`, suena sin tocar una línea de código.

Y **el sonido está apagado de fábrica**, a propósito: encenderlo sin biblioteca daría un interruptor
que dice "Sonidos: sí" y no suena nunca.

### Una regla invariante nueva
*"Queda prohibido crear lógica como `new Audio(...)` repartida por la aplicación."*

`verificar.sh` ahora **falla si `new Audio(` o un contexto de audio aparecen fuera de
`audioEngine.js`**, aunque sea dentro de un comentario. Sin ella, el primer botón que quiera sonar se
traería el suyo y el motor dejaría de ser central: no se le aplicarían ni el volumen por categoría,
ni el cooldown, ni las colisiones. Me cazó a mí dos veces escribiendo esta misma fase.

### Nunca como una máquina tragaperras
Completar un entrenamiento puede disparar `ACTION_COMPLETED`, `STREAK_CONTINUED` y `SUCCESS` casi a
la vez. Suena **una** vez: dentro de una ventana de 180 ms solo pasa lo más importante.

Y veinte toques rapidísimos en un botón dan **un** sonido, no veinte. Las dos cosas tienen su prueba
con ese caso exacto.

### Web Audio API, y por qué
Con un `<audio>` solo se pierde una de las siete prioridades que pide la especificación — pero es la
que sostiene el apartado 8: **un elemento tiene un `volume` y nada más**. "Interfaz al 30 % y Rachas
al 90 %" habría que calcularlo a mano en cada reproducción, y no habría forma de bajar una categoría
entera de golpe. Con Web Audio es un `GainNode` por categoría, que es la forma exacta del problema.

Además iOS limita cuántos `<audio>` suenan a la vez. Sin librerías: hacen falta un contexto, un nodo
por categoría y un `fetch`.

### iOS no se intenta esquivar
Safari crea el contexto suspendido y no deja reanudarlo sin un gesto. El motor se engancha al primer
toque y se desbloquea ahí. Hasta entonces **no falla: simplemente no suena**. Y hay **un solo
contexto**, creado en ese primer toque y no al arrancar.

### El bus, y lo que deliberadamente no hace
No había Event Bus en el proyecto, así que se ha creado uno ligero. **No define ni un evento propio
de rachas**: los de RA F3 llegan con sus nombres y se traducen con dos alias. Redefinirlos habría
dejado dos catálogos separándose con cada fase.

Rachas no sabe que existe el audio, y el audio no sabe qué es una racha. Cuando lleguen haptics,
notificaciones o analítica, se enganchan al mismo bus.

Y un suscriptor que revienta **no tumba al emisor**: si el motor de audio falla, el entrenamiento
queda guardado igual.

### El sonido nunca es el único canal
El apartado 35 lo pide, y no se puede imponer con una comprobación… salvo **no dándole al motor
ninguna forma de suprimir la interfaz**. La decisión solo dice si suena y por qué. Hay una prueba que
falla si aparece un campo que pudiera usarse para ocultar algo.

### Verificación
**2176 comprobaciones y 10 reglas invariantes en verde**. `package.json` → **v1.54.0**. Van 31 de las
106 fases; quedan 75.

⚠️ **Lo que no se ha podido comprobar aquí, y se dice en la propia salida de las pruebas:** iOS,
Android, PWA y navegador de escritorio. Son del navegador real.

✅ **C-23 queda resuelta a medias:** Josué pasó el texto que faltaba. ⏸ Siguen faltando **los archivos
de audio**, que él dará *"cuando la web ya tenga todos los botones activos"*.

## Entrega 2 · HT Fase 2 — Modelo de datos, Cloud y Supabase (v1.53.0)

### Ni una tabla nueva, ni un SQL que ejecutar
La especificación propone trece tablas —`schedules`, `schedule_columns`, `schedule_blocks`,
`subjects`, `materials`…— y en el apartado 51 dice cómo decidir: *"HORARIO TOP no podrá crear una
arquitectura incompatible con los demás módulos. La implementación final deberá adaptarse a la
arquitectura global del Sistema Personal."*

JosStyle no tiene una tabla por entidad. Tiene **una**, `app_data`, con RLS por usuario, que usan los
veintiún módulos. Trece tablas serían el segundo sistema de persistencia del proyecto y **trece
bloques de SQL que ejecutar a mano desde el iPhone**.

Así que lo que en PostgreSQL serían restricciones son aquí funciones que se ejecutan de verdad: los
índices son mapas, las validaciones son código, el `user_id` no existe —no hay ninguno que falsear— y
el borrado reversible es la papelera que ya tiene el proyecto.

### El curso pasado deja de resolver solo
Un horario ya no tiene solo una etiqueta de periodo: tiene `desde` y `hasta` de verdad, y
`resolverDia()` los respeta. Acabado junio, el horario 26/27 deja de aparecer sin que nadie se
acuerde de desactivarlo, y sus bloques siguen guardados.

### Los materiales dejan de ser textos sueltos
En la Fase 1 el material era `['Libro', 'Libreta']` dentro de la actividad. Con textos, "Libreta" en
Biología y "Libreta" en Matemáticas eran dos cosas distintas que solo se parecían al escribirlas.

Ahora son entidades con su enlace, y la migración **une las repetidas**: tres asignaturas con libreta
dan **un** material y tres enlaces, no tres libretas. Pasarla dos veces no duplica nada, y el texto
original se conserva para que sea reversible.

### La mochila es una consecuencia, no una lista
*"La mochila será una consecuencia de los datos existentes y no una lista completamente
independiente."* `mochilaDelDia()` deriva: horario → actividades → material. Lo único que se guarda
es lo que no se puede derivar — si ya está metido, y lo que se añada a mano.

Y agrupa: "Libreta — para Biología y Matemáticas", no dos libretas. Con cinco clases al día, la
diferencia es entre una mochila útil y una lista de veinte cosas repetidas.

### El calendario no se duplica
Catorce días de agenda **no crean catorce registros**: se calculan. El horario aporta eventos
derivados con `origen` y `origenId` al calendario común que ya existe — exactamente los `source` y
`source_id` que pide la especificación.

### Cuando dos dispositivos cambian lo mismo
`detectarConflicto()` usa los timestamps para decir "esto lo cambió otro dispositivo después de que
tú lo abrieras". **Detecta y avisa; no resuelve**: la especificación dice que *"no se deberá
sobrescribir información silenciosamente sin criterio"*, y quién gana es una decisión que deja para
más adelante.

### Tres bugs míos, y uno perdía datos
1. **El normalizador de horarios tiraba los campos nuevos de columnas y filas.** Ocultar el sábado
   funcionaba… hasta recargar la app: `crearColumna` escribía `visible`, pero el normalizador no lo
   conocía y se perdía en el primer guardado.
2. **Un item de mochila añadido a mano se borraba solo**, porque el normalizador exigía un
   `materialId` que un "Bocadillo" escrito a mano no tiene.
3. **`validarHorario` no detectaba un nombre vacío**, porque miraba el objeto ya normalizado y el
   normalizador lo rellena con la etiqueta del tipo.

Los tres los cazaron sus propias pruebas.

### Verificación
**2085 comprobaciones y 9 reglas invariantes en verde**, build incluido. `package.json` →
**v1.53.0**. Van 30 de las 106 fases; quedan 76.

⏸ **Queda confirmado lo que HT F1 dejó abierto:** el horario se guarda en `app_data` con la clave
`horarioTop`. Sin tabla nueva y sin SQL pendiente.

## Entrega 2 · HT Fase 1 — Arquitectura de Horario Top (v1.52.0)

### Esta fase no pide construir: pide definir
*"No estamos construyendo todavía la interfaz definitiva, la base de datos definitiva, el editor
definitivo, la mochila, las notificaciones ni la IA. Estamos estableciendo cómo debe funcionar todo
el ecosistema antes de empezar a construirlo."*

En este proyecto eso ha significado siempre lo mismo: **un módulo puro y probado, no un documento.**
Un documento se contradice con el código en la segunda fase; un modelo con 131 comprobaciones no
puede. `src/lib/horario.js` es el ecosistema entero como código, **sin una sola pantalla**.

### El horario es una regla, no una lista de eventos
Es la distinción de la que cuelga todo lo demás. La regla base vive en `bloques` —"los martes a las
10:00 hay Biología"— y los cambios puntuales en `excepciones`. `resolverDia()` los compone al vuelo.

Materializarlo —crear cuarenta "Biología" para el curso— haría que cambiar la hora de la clase
obligara a editar cuarenta filas, y que un festivo tuviera que borrar seis. Es el mismo error que el
proyecto ya evitó en el Calendario.

Con esto: el mismo bloque resuelve en todos los martes del curso (probado con dos martes distintos),
cancelar un día no toca el siguiente, y **un festivo se declara una vez** en vez de cancelar seis
clases a mano. Y un festivo de instituto **no cancela el entrenamiento**.

### Las asignaturas no se duplican
*"Si el usuario crea Biología, no debería tener que volver a escribir «Biología» para Horario,
Tareas, Exámenes, Mochila y Estudios."*

Y JosStyle **ya tiene las asignaturas de Josué**, en `estudios.asignaturas` desde la Fase 6. Así que
una actividad escolar no las copia: **apunta a ellas**, y el nombre se resuelve al leer. Renombrar
"Bio" a "Biología" en Estudios lo cambia en el horario sin tocar el horario.

Sin esto habría dos "Biología" —una en cada módulo— y ningún examen podría enlazarse con su clase.

### Una columna guarda su día aparte de su nombre
Es la pieza que permite las dos cosas que pide la especificación a la vez: que "Martes" resuelva a
una fecha, y que "Semana A", "Persona 2" o "Proyecto 1" sigan siendo columnas posibles. Sin ese
campo habría que adivinar el día por el nombre, y "Semana A" no es ningún día.

Una columna sin día no cae en ninguna fecha — está probado, y es exactamente el hueco donde entrarán
las semanas A/B más adelante sin tocar el modelo.

### Los enganches de lo que viene, y solo los enganches
- **Mochila** (Fase 7): `materialDelDia()` agrupa y dice **para qué** hace falta cada cosa —
  "Libreta — para Biología y Matemáticas" es más útil que la libreta repetida dos veces.
- **Notificaciones** (Fase 10): `avisosDelDia()` **describe, no notifica**. Devuelve qué se podría
  avisar y a qué hora; quién avise es de esa fase. Así dos sistemas no mandan el mismo aviso.
- **IA** (Fase 9): `contextoIA()` devuelve estructura, no una lista de textos, y omite los campos
  vacíos. Y no llama a ninguna IA: la IA nunca se dispara sola.

### Dos decisiones que se llevan por delante un error futuro
1. **Borrar una actividad no borra sus bloques**: los deja sin actividad. Perder la hora de una clase
   porque se borró la asignatura sería mucho peor que quedarse con un hueco que se vuelve a rellenar.
2. **Un evento resuelto no tiene id propio.** No es una entidad guardada, es el resultado de componer
   otras; darle un id invitaría a guardarlo, que es justo lo que esta arquitectura evita.

### Un fallo mío, cazado por su propia prueba
`crearColumna({ dia: 9 })` reventaba. El día es *truthy* pero está fuera de rango, y se usaba para
construir el nombre **antes** de validarlo, así que indexaba una posición que no existe.

### Verificación
**1961 comprobaciones y 9 reglas invariantes en verde**, build incluido. `package.json` →
**v1.52.0**. Van 29 de las 106 fases; quedan 77.

⏸ **Lo decidirá HT F2, no esta fase:** dónde se guarda. Aquí se ha asumido `app_data` con la clave
`horarioTop`, por coherencia con los otros veintiún módulos y para no añadir SQL pendiente. **La
Fase 2 es literalmente la del modelo de datos y Supabase**, así que lo confirmará o lo cambiará con
su especificación delante. Nada de lo construido aquí depende de esa elección: el módulo es puro.

⏸ **SO · Sonido sigue esperando a Josué (C-23):** su Fase 1 no aparece en la especificación, y además
necesita archivos de audio que él dará cuando la web tenga todos los botones activos.

## Entrega 2 · RA Fase 4 — Centro de Rachas y experiencia visual (v1.51.0) 🔒 CIERRA EL BLOQUE RA

### Un módulo nuevo: Rachas
Vive en el área **Vida**, junto a Productividad, que es donde están los hábitos. La barra inferior
sigue teniendo cinco pestañas: un módulo nuevo entra en un área que ya existe, nunca en la barra.

Dentro: resumen (racha actual · mejor · logros), la racha principal grande, las demás compactas,
detalle con historial y calendario, logros, y los totales.

### No calcula ni un número
Todo viene de la capa de gamificación, que lo deriva del historial. Si esta pantalla dijera un
número distinto del Dashboard sería porque alguien contó por su cuenta — y aquí nadie cuenta.

### Una sola celebración, no cuatro avisos
Es lo que pide el apartado 19: si un mismo día trae hito, récord y logro, no pueden salir tres
tarjetas. `Celebracion` recibe la lista entera de eventos y saca **un** mensaje. Hay una prueba de
renderizado con los tres a la vez.

Y completar un día normal **no abre nada**: su feedback va en la propia tarjeta de la racha. Las
celebraciones grandes se reservan para 30, 100 y 365 días.

### La racha rota no castiga
Literalmente lo que pedía la especificación: *"La racha terminó. Hoy puedes empezar una nueva"*, con
el récord y el historial siempre visibles — *"el usuario nunca debe sentir que su progreso histórico
desapareció"*.

### El calendario, con puntos y no con emojis
La especificación proponía 🔥 por día, *"pero quiero algo más elegante si el sistema de iconografía
actual permite algo mejor"*. Una rejilla de puntos ocupa la mitad, se lee de un vistazo y —esto es
lo importante— **no distingue los estados solo por color**: completado es un punto lleno, perdido un
aro, pendiente un aro marcado. Con leyenda y `aria-label` por día.

### Sin colores propios, sin animaciones propias, sin sonido
- Los colores salen de `COLORS` y del acento del usuario, así que el modo claro y el oscuro
  funcionan **solos**.
- La única animación es la barra de progreso, y la gobiernan `prefers-reduced-motion` y el ajuste de
  animaciones de la Fase A3 desde `index.css`. No hay un segundo sistema.
- **Ni un archivo de audio en un componente** (apartados 20 y 38). La pantalla emite eventos; el
  sistema de audio los escuchará cuando exista.

### Un efecto secundario en el rendimiento
El resumen del hub de Rachas recorre historiales, y hasta ahora `resumenesTodos` en `App.jsx` se
recalculaba en cada render porque todo lo que había era barato. Ahora va memoizado.

### Cómo se ha resuelto el duplicado que dejó anotado RA F3
`logros.js` (Fase 20) tiene doce insignias de **toda la app**. Las de aquí son de **las rachas** y
son por racha, así que pueden ser muchas. Juntarlas daría una lista larguísima mezclando dos cosas
distintas, así que se quedan separadas: las de racha en el Centro de Rachas, las generales en
Logros. No es irreversible — si Josué las prefiere juntas, es mover una lista.

### Un hábito no se marca desde aquí
Aparece en el Centro con su racha, pero el botón de completar solo sale en las rachas propias: el
dato de un hábito vive en Productividad, y un segundo sitio donde escribirlo sería duplicar el
camino.

### Verificación
Las doce pruebas visuales del apartado 36, **montadas con el servicio real** y no con datos escritos
a mano: si el motor cambiara de forma, se enterarían. Los casos de renderizado suben de 140 a 192.
**1830 comprobaciones y 9 reglas invariantes en verde**, build incluido. `package.json` →
**v1.51.0**.

⚠️ **Lo que sigue sin estar probado, y hay que decirlo:** el aspecto real en un iPhone, los gestos y
el scroll. Como todo lo demás desde R1.

**Con esto el bloque RA queda cerrado: 4 de 4.** Van 28 de las 106 fases de la Entrega 2; quedan 78.

## Entrega 2 · RA Fase 3 — Gamificación, hitos, logros y progresión (v1.50.0)

### La frase que marca el tono
*"No quiero que el usuario sienta «tengo que usar la app para ganar puntos». Quiero que sienta
«estoy progresando en mi vida y la app me ayuda a verlo»."*

De ahí salen las tres decisiones que se notan en el código: sin XP ni niveles, doce logros en vez de
cien, y celebraciones que se reservan.

### Sin XP ni niveles, y dicho con claridad
Los apartados 14 y 15 los dejan en condicional: *"no conviertas automáticamente las rachas en
niveles si no es necesario"*, *"si decides preparar XP"*. Y no es necesario: no hay nada que gastar
ni con qué compararse. Un contador de XP sin uso sería un control decorativo.

Lo que sí queda es el punto de enganche: los eventos llevan los días y el hito, que es todo lo que
necesitaría una capa de XP futura. Y por D2-02, si llega, se queda dentro de Rachas y Sonido.

### Un hito se anuncia una sola vez
Un evento derivado del estado se emitiría cada vez que alguien mirase la pantalla. Por eso se apunta
qué hitos ya se anunciaron, por racha. Y al volver después de una semana fuera se anuncian **todos
los intermedios**, no solo el último: llegar a 30 días no puede saltarse el 7, el 14 y el 21 en
silencio.

### La barra de progreso se mide desde el hito anterior
Con 25 días y el siguiente hito en 30, va por el **44 %**, no por el 83 %. Medirlo desde cero haría
que la barra apenas se moviera entre 200 y 365 días.

### No se puede hacer trampa, por construcción
El apartado 27 lo pide con nombre: `currentStreak = 1000` no debe desbloquear nada sin días reales
detrás. Aquí se cumple sin vigilar nada, porque **el contexto no acepta ningún número de fuera**: lo
pide todo al servicio, que lo deriva del historial de cumplimientos. Y un logro inyectado a mano que
no esté en el catálogo se descarta al cargar.

### Un logro conseguido no se pierde
Es la decisión que había que tomar (apartado 28). Josué cumplió treinta días seguidos; corregir
después un entrenamiento mal apuntado no deshace haberlos cumplido, y quitarle el logro por eso
sería castigarle por ordenar sus datos. Los números —racha, récord, progreso— sí se corrigen solos,
porque se derivan. `revisarLogros()` **informa**; revocar es una decisión explícita, y solo ocurre
sola al borrar la racha entera.

### La racha global no es max()
El apartado 22 lo prohíbe expresamente. La condición aquí es "días seguidos cumpliendo al menos una
racha", y hay una prueba que lo demuestra: **dos rachas que se turnan dan una global mayor que
cualquiera de las dos**, que es imposible con un máximo.

### Dos expectativas mías mal puestas
Con la lista de doce hitos, el siguiente después de 17 días es **21**, no 30. Y con 5 días los hitos
alcanzados son dos (el 1 y el 3), no tres: **5 no es un hito**. El código estaba bien las dos veces.

### Verificación
**Las diez pruebas que pide el apartado 34**, una por una y marcadas como tales. **1778
comprobaciones y 9 reglas invariantes en verde**, build incluido. `package.json` → **v1.50.0**. Van
27 de las 106 fases; quedan 79.

⚠️ **Un duplicado anotado para RA F4:** el proyecto ya tiene `src/lib/logros.js` (Fase 20) con doce
insignias de toda la app, dos de ellas de racha. Los logros de aquí todavía no tienen pantalla, así
que hoy no hay duplicación visible; cuando F4 construya el Centro de Rachas habrá que decidir si son
dos listas o una.

## Entrega 2 · RA Fase 2 — Persistencia, seguridad y sincronización (v1.49.0)

### Ni una tabla nueva, ni un SQL que ejecutar
La especificación propone tablas `streaks` y `streak_days` en Supabase, y acto seguido dice: *"No
copies estos nombres obligatoriamente si el proyecto ya utiliza otra convención"*, y *"No dupliques
sistemas existentes"*.

JosStyle tiene una convención: **una sola tabla `app_data`**, una fila por usuario y clave, con RLS
por `auth.uid()`, que usan los veinte módulos. Las rachas entran ahí. Montar tablas propias habría
sido el segundo sistema de persistencia del proyecto **y un tercer bloque de SQL que Josué tendría
que ejecutar a mano desde el iPhone** —ya tiene dos pendientes— sin el cual las rachas no
funcionarían.

Lo que en la especificación son políticas RLS y una restricción `UNIQUE`, aquí es:

- **Aislamiento entre usuarios** → las cuatro políticas de `app_data`, ya vigentes.
- **`UNIQUE(streak_id, local_date)`** → la clave lógica `racha + día`, aplicada en el servicio, que
  es el único sitio del proyecto que escribe cumplimientos.
- **Contadores no manipulables** → no existen. Mandar `{currentStreak: 9999}` no tiene dónde
  aterrizar, porque no se guarda ningún contador.

Y algo más fuerte que "no confiar en el `user_id` del cliente": **el modelo no tiene campo
`user_id`.** No hay ninguno que falsear. Hay una prueba que comprueba que la palabra no aparece.

### Un solo sitio escribe rachas
`src/lib/rachasServicio.js`. Dashboard, Productividad y lo que venga después llaman ahí; ninguno
toca Supabase ni recalcula por su cuenta. Los hábitos, que guardan su historial en su propio módulo
desde la Fase 8, también se consultan por el servicio: no se ha migrado su dato —es de Josué y
moverlo no aporta nada— pero sí su camino.

Con él llega `src/hooks/useRachas.js`, el hook central. No añade lógica: envuelve el servicio y
memoiza lo caro, para que el panel se calcule una vez por cambio real de estado y no una por render.

### La cola offline funciona por una sola razón
Reintentar es idempotente. Un cumplimiento que se reenvía cinco veces sigue siendo **un** día — hay
una prueba que lo hace. Sin esa propiedad, una cola offline infla rachas; con ella, no puede.

### Cuando se borra la actividad que sostenía la racha
Es el caso que la especificación describe con detalle: un entrenamiento genera un cumplimiento, la
racha llega a 15, y después se borra ese entrenamiento. Con contadores guardados habría que
acordarse de decrementar. Aquí basta con que desaparezca el día: **el número se corrige solo**,
porque nunca estuvo guardado. Lo que faltaba era poder encontrar el cumplimiento a partir de su
actividad, y para eso cada uno guarda ahora `origen` y `origenId`.

### Sobre TypeScript, con honestidad
El apartado 22 pide tipos y evitar `any`. **El proyecto no usa TypeScript**: es JavaScript con Vite
y no hay un solo `.ts` en `src/`. Meterlo por un módulo obligaría a configurar el compilador para el
resto. El equivalente honesto es lo que se ha hecho: `@typedef` para las cuatro entidades —que el
editor sí lee— y, sobre todo, **normalizadores que se ejecutan de verdad**. Un typedef avisa; un
normalizador impide.

### Un fallo mío, cazado por su propia prueba
La revisión de integridad buscaba los contadores corruptos **después** de normalizar, y el
normalizador ya los había descartado al pasar. Que el motor sea inmune a ellos es bueno; que la
revisión no pudiera avisar de que venían, no.

### Lo que todavía no tiene pantalla, y es deliberado
No hay forma de crear una racha desde la interfaz: el apartado 28 prohíbe expresamente el Centro de
Rachas en esta fase, que llega en RA F4. Lo que sí funciona hoy de punta a punta son los hábitos.

### Verificación
Los **diez casos que pide el apartado 27**, uno por uno y marcados como tales, más lo que sostiene
cada uno. **1660 comprobaciones y 9 reglas invariantes en verde**, build incluido. `package.json` →
**v1.49.0**. Van 26 de las 106 fases; quedan 80.

## Entrega 2 · RA Fase 1 — Motor de rachas (v1.48.0)

### El apartado 24 describía el código que ya teníamos
*"No hagas una solución rápida que simplemente incremente un contador."*

Pues eso era exactamente lo que había. Los hábitos de Productividad guardaban `rachaActual` y
`mejorRacha` como números sueltos, y al desmarcar el día de hoy le restaban uno al contador **a
mano**. Es decir: **desmarcar y volver a marcar el mismo día subía el récord** sin haber cumplido
nada — y con ello se desbloqueaba el logro "Un mes de constancia".

Ahora no se guarda ni un número. Racha actual, récord, historial y porcentaje salen del historial de
días, que es el mismo que ya estaba guardado. Nadie pierde nada y no hay migración destructiva.

### Un día en curso no es un día fallado
Es lo que más repite la especificación, y con razón. Con lunes ✅, martes ✅ y el miércoles todavía
por hacer, a las 10:00 de la mañana la racha vale **2 y está viva**, no 0 y perdida. Los cuatro
estados de un día están separados y no se mezclan: completado, perdido, pendiente y futuro.

### El día es el de Josué, no el del servidor
Cada cumplimiento guarda dos tiempos: el **día local**, que es el que decide la racha, y el instante
en UTC, que solo sirve para desempatar si dos dispositivos escriben a la vez. A las 23:59 cuenta
para hoy; a las 00:01, para mañana. Probado, junto con el fin de año, el cambio de mes y el 29 de
febrero de un bisiesto.

### Pulsar cinco veces no son cinco días
La clave lógica es `racha + día local`, y registrar un cumplimiento **sustituye**, nunca añade. Da
igual si se pulsa una vez o veinte, y da igual si dos dispositivos mandan lo mismo a la vez. Es
también lo que permitirá que una cola offline reintente sin inflar una racha.

### La regla de los hábitos se ha conservado tal cual
En JosStyle un fallo suelto no rompe una racha de hábito: se perdona. Esa regla llevaba ahí desde la
Fase 8, y en vez de cambiársela a Josué sin avisar se ha llevado al motor como una regla más
(`diaria_con_gracia`). Añadir "estudiar 30 minutos al día" es registrar otra entrada, no tocar el
motor.

Una regla **semanal** sería distinta: cuenta semanas, no días, y eso cambia el recorrido entero. Por
eso **no se ha fingido que existe** — el sitio exacto donde entraría está marcado en el código.

### Cuatro fallos reales, tres ya en producción
1. El récord de los hábitos se podía inflar. Una prueba lo intenta diez veces; ya no se mueve.
2. **Un hábito sin `historial` dejaba Productividad en blanco.** Nunca se había visto porque esa
   pantalla no se renderizaba en ninguna prueba; salió en cuanto se añadió.
3. La exportación podía no cuadrar con la pantalla: leía el contador, y la pantalla otra cosa.
4. Mío: `[].every()` es `true`, así que la primera racha de la vida "batía el récord" sin haber
   ningún récord anterior. Lo cazó su propia prueba.

### Lo que NO lleva, y es deliberado
Ni niveles, ni medallas, ni logros, ni recompensas, ni confeti, ni sonidos (apartado 22). Hay una
prueba que **falla si aparecen**. Y por D2-02, cuando lleguen, se quedan dentro de Rachas y Sonido.

### Verificación
**1556 comprobaciones y 9 reglas invariantes en verde**, build incluido. `package.json` →
**v1.48.0**. Van 25 de las 106 fases; quedan 81.

⏸ **Pendiente de Josué (regla 49, ficha C-23):** en `ESPECIFICACION_SONIDO_Y_RACHAS.md` el
encabezado *"Fase 1 — Arquitectura + motor global de audio"* va seguido del texto de *"Fase 4 ·
Sistema de Rachas: interfaz"*. Falta saber dónde está la Fase 1 real del Sonido y en qué orden van
los dos módulos. No bloquea nada de lo entregado aquí.

## Entrega 2 · FO Fase 12 — Eliminados, recuperación y cierre del bloque (v1.47.0)

### En Apariencia no se borra nada, y eso cambia el sentido de la fase
Cambiar de fotografía no borra la anterior de Storage. Quitar el fondo tampoco. En Salud o
Calistenia la papelera guarda el registro treinta días mientras el archivo desaparece; aquí el
archivo **sigue estando**, así que recuperar no es restaurar una copia — es volver a apuntar a algo
que nunca se fue.

Por eso esta fase no monta una papelera nueva. Reutiliza la de ME F3 para lo que sí se borra (los
presets) y añade una lista de fotografías sustituidas dentro del propio fondo para lo que no.

### Las fotografías sustituidas ya no se pierden
Hasta ahora, cambiar de foto dejaba el archivo en el bucket y **ninguna forma de volver a él**.
Ahora se guarda su ficha (hasta ocho, `MAX_FOTOS_ANTERIORES`) y aparecen en Ajustes → Apariencia →
Fondo con su miniatura, su fecha y sus medidas.

Recuperar una devuelve también **sus ajustes de entonces** —encuadre, zoom, luz, overlay— porque
`ajustesPorFoto` ya los guardaba desde la Fase 3. Y la que estaba puesta pasa a la lista, así que
recuperar tampoco pierde nada.

Olvidar una sí es irreversible, y es lo único de esta pantalla que pide confirmación.

### Los presets se podían crear y no borrar
El botón existía, pero se limitaba a filtrarlos de la lista: se perdían para siempre. Ahora pasan
por la papelera universal como todo lo demás. Es el noveno módulo con ese mismo fallo desde que
existe la verificación automática.

### Un preset con fotografía ahora lo dice
La miniatura de un preset se pinta sin firmar la URL de la foto (serían varias firmas a la vez para
un recuadro de 44 px), así que uno con fotografía enseñaba el fondo de respaldo y parecía un
degradado cualquiera. Ahora lleva su icono encima. Es la "dependencia detectada" que pide el
apartado 8: nada se rompe en silencio.

Borrar un preset no borra su fotografía, y olvidar una fotografía no borra los presets que la usen.

### Un error de test que valió la pena
La comprobación de que la lista conserva las más recientes fallaba por uno. La `h12` es la foto
**activa**, así que la primera de las *anteriores* es la `h11`. El código estaba bien; la
expectativa, mal.

### Verificación
**1414 comprobaciones y 9 reglas invariantes en verde**, build de Vite incluido. `package.json` →
**v1.47.0**.

**Con esto el bloque FO queda cerrado: 12 de 12.** Van 24 de las 106 fases de la Entrega 2; quedan
82, todas de módulos aún sin empezar — SR (5+4), HT (12) y EH (65).

⚠️ Siguen pendientes en el SQL Editor de Supabase los bloques de los buckets `armario` (AR F1) y
`fondos` (FO F2).

## Entrega 2 · FO Fase 11 — Rendimiento y optimización (v1.46.0)

### El problema real no era ninguno de los que uno se imagina
Las capas del fondo son CSS puro, el análisis va sobre una miniatura de 96 px y las propuestas son
aritmética. Lo caro era otra cosa: **la fotografía se subía y se servía a resolución original**.
Una foto de iPhone son 4032×3024 y unos 4 MB, y se estaba usando como fondo de una pantalla de
390 px de ancho.

Ahora se redimensiona a 1600 px de lado largo con JPEG al 82 % **justo antes de subir** — no al
elegir, porque entonces cada foto que mirases y descartaras pagaría el trabajo para nada.

Se aplicó también a las fotos de prenda del Armario, que tenían el mismo problema: megabytes para
pintar una miniatura de 150 px.

### Tres decisiones que evitan hacer daño al optimizar
1. **Nunca agrandar.** Escalar hacia arriba no añade detalle, solo peso.
2. **Si la copia pesa más, se queda la original.** Pasa con imágenes ya muy comprimidas.
3. **Si algo falla, se devuelve el original** en vez de lanzar: es peor una foto pesada que ninguna
   foto.

### Caché de URLs firmadas
Duran una hora, y sin caché cada vez que se montaba Ajustes se pedía otra firma para la misma foto.
Ahora, si hay una válida, el fondo aparece **al instante** en vez de parpadear.

Y una a punto de caducar **no se entrega**: se considera vencida un minuto antes, para no dar una
firma que expire mientras la imagen se está descargando.

### Un detalle que habría pasado desapercibido
Al optimizar hay que guardar **las medidas de la foto original**, no las de la copia. La proporción
y la orientación deciden el encuadre inicial, y calcularlo sobre la copia habría funcionado por
casualidad pero habría dejado en el modelo unas dimensiones que no son las de la imagen elegida.

### Verificación
**1380 comprobaciones en verde** (antes 1340): 40 de optimización de imágenes.

---

## Entrega 2 · FO Fase 10 — Integración completa en Aspecto (v1.45.0)

**Esta fase no añade funciones: ordena las que ya hay.** Después de las fases 1-9, Ajustes →
Apariencia había llegado a **trece tarjetas seguidas** — en un iPhone, una pantalla entera de
scroll para encontrar cualquier cosa.

### Vista previa global arriba del todo
Fondo, tarjeta, botón, texto, iconos y barra inferior, en una sola pieza. Es la referencia contra
la que se juzga cualquier cambio de los que hay debajo, sin salir de Ajustes.

Se pinta con **las mismas funciones y los mismos tokens que la app de verdad**. Una imitación
acabaría divergiendo y enseñaría algo que no es lo que se aplica.

### Seis secciones plegables
Fondo · Colores · Recomendado · Apariencias guardadas · Legibilidad · Texto y movimiento. Solo
**Fondo** viene abierta, y su subtítulo dice qué fondo hay puesto, así que se sabe sin abrirla.

### Lo que no se ha tocado, y es deliberado
Tema, acento, tamaño de texto, densidad, bordes y animaciones llevan ahí desde la Fase A3 y **Josué
ya sabe dónde están**. Se han agrupado, no reordenado ni renombrado: mover controles que alguien
tiene memorizados es una regresión aunque el orden nuevo sea mejor.

Tema y la vista previa quedan fuera de las secciones: son lo que más se toca.

### Dos roturas mías, cazadas por la compilación
Reorganizar por rangos de líneas partió un comentario JSX multilínea por la mitad y dejó una sección
sin cerrar. `esbuild` lo señaló con la línea exacta. Después se comprobó pieza por pieza que las
trece tarjetas originales siguen todas ahí.

### Verificación
**1340 comprobaciones en verde**, con 128 casos de renderizado.

---

## Entrega 2 · FO Fase 9 — Legibilidad y contraste inteligente (v1.44.0)

*"Libertad total para personalizar, pero con protección inteligente para que la interfaz siga
siendo usable."* Es la frase del apartado 1 y gobierna toda la fase.

### El problema difícil: ¿contra qué se mide?
Con una fotografía de fondo **no hay un color de fondo único**. Lo que hay detrás de un texto es la
tarjeta translúcida encima de la foto encima del tema. Medir contra `COLORS.bg` daría un número que
no describe lo que se ve — y un aviso falso enseña a ignorar los avisos.

Así que el fondo efectivo **se compone**, capa a capa, en el mismo orden en que se pinta: tema →
foto → luz → overlay → tarjeta. Y con el análisis de la Fase 5 se mide **por zona**: un texto
arriba no está sobre el mismo color que un botón abajo.

### Detectar no es corregir
Revisar no cambia nada. Los avisos traen **qué campo cambiar y a qué valor**, y aplicarlo es un
botón. El modo automático existe, pero **apagado de fábrica**: el apartado 8 dice "debe ser
opcional, nunca obligar".

Y nada se bloquea: un color flojo **se avisa, no se impide**.

### Cuando el problema es la foto, la solución no es cambiar el texto
El apartado 12 lo dice. Foto clara con interfaz oscura → se propone oscurecer **la foto**. Foto con
mucho detalle → un desenfoque ligero. Los colores se quedan en paz.

Y si ya lo habías resuelto —ya la habías oscurecido, ya tenías overlay, ya la habías desenfocado—
no se insiste.

### Dos falsos positivos sobre la propia app, cazados por las pruebas
1. **El texto de los botones.** La prueba ponía blanco a mano (4,28, por debajo de AA). La app no
   usa blanco: lo deriva con `bestReadableText`, que da 4,54. Estaba probando un color que la app
   nunca usa.
2. **La separación entre tarjeta y fondo.** JosStyle separa sus tarjetas **con el borde, no con el
   relleno** — la superficie es apenas más clara que el fondo (1,07) y se ve perfectamente porque
   cada tarjeta lleva su borde. Comprobar solo el relleno marcaba la apariencia de fábrica como
   rota. Ahora se miran las dos vías, y solo hay problema cuando fallan ambas.

### Y una limpieza de raíz
`NEGRO` y `BLANCO` viven ahora en `colorEngine.js` en vez de escribirse a mano en cada archivo que
compone capas. No son colores de interfaz —oscurecer es acercar al negro en tema claro y en
oscuro— así que no pertenecen a `tokens.js`.

### Verificación
**1332 comprobaciones en verde** (antes 1277): 47 de legibilidad y 120 casos de renderizado.

---

## Entrega 2 · FO Fase 8 — Presets de apariencia (v1.43.0)

Guardar tus colores **y tu fondo juntos**, y cambiar entre ellos de un toque.

### Un preset es la apariencia completa
Tema, acento, colores, transparencias, sombras, bordes, overlay **y la fotografía con sus
ajustes**. El sistema anterior (fase V4) guardaba solo los colores: media configuración. Aquí se
reutiliza ese mismo sistema —misma clave de Supabase, mismo estado, mismo límite— y lo único que
cambia es qué se guarda dentro.

### "Activo" dice la verdad
No se compara por id, porque el id no dice nada: puedes aplicar un preset y luego cambiar un color
a mano, y entonces **ya no estás usando ese preset** aunque fuera el último que tocaste. Se compara
una huella de lo que se ve — y de ahí quedan fuera el historial de encuadres y el análisis de
colores, porque no se ven.

### Los incluidos no se tocan, se duplican
JosStyle, Profundo, Claro y Minimal. Intentar actualizar uno **no hace nada** en vez de fallar, y
duplicarlo da un preset tuyo, editable: es la vía que da el propio apartado 14 para personalizarlos
sin perder el original.

Ninguno trae fotografía: una foto es de quien la hizo, y un preset de fábrica con una imagen de
archivo sería contenido inventado.

Y `accent: null` en ellos significa **"no toques el acento"**, no "ponlo a null": aplicar "JosStyle"
devuelve la app a su estado de fábrica **sin imponerte un color que no elegiste**.

### Un fallo que habría aparecido seguro
Aplicar un preset cambia cuatro cosas a la vez, y encadenar los tres setters existentes **habría
perdido el fondo o el tema sin dar ningún error**: cada uno guarda el paquete de ajustes entero
leyendo el resto del closure, y dos llamadas seguidas en la misma función no ven el `setState` de
la anterior. Lo evitó un aviso que la fase V4 había dejado escrito justo al lado.

### Verificación
**1277 comprobaciones en verde** (antes 1209): 60 de los presets y 112 casos de renderizado.

---

## Entrega 2 · FO Fase 7 — Personalización manual avanzada (v1.42.0)

Cierra un hueco que las fases anteriores habían abierto: **FO F4 metió en el modelo el texto
secundario, los iconos activo e inactivo y el fondo de la barra, pero sin control.** Se podían
guardar y no había forma de tocarlos. Ahora el constructor de temas los ofrece los diez.

### Bordes y sombras
El color del borde ya se podía cambiar; lo que faltaba era su **intensidad**. Un borde al 100 %
sobre una tarjeta translúcida encima de una foto se ve como una caja pegada; bajarlo la integra sin
quitarle la separación.

Las sombras son nuevas, con **tope bajo a propósito**: el apartado 11 pide evitar configuraciones
que hagan que la app parezca desordenada.

### Sin tocar nada, nada cambia
Cada añadido tiene su valor de fábrica igual al comportamiento anterior: sombra 0, borde al 100 %,
transparencias al 100 %. Es lo que permite añadir controles sin arriesgar una regresión visual.

Y sin sombra, `cardShadow` es `'none'`, no una sombra de opacidad cero: una sombra invisible sigue
costando pintado en cada tarjeta, y hay muchas por pantalla.

### Verificación
**1209 comprobaciones en verde** (antes 1193).

---

## Entrega 2 · FO Fase 6 — Sistema "Recomendado" (v1.41.0)

JosStyle propone **cinco apariencias completas** sacadas de los colores de tu foto: Equilibrada,
Con contraste, Serena, Intensa y Minimalista. Sin IA — teoría del color sobre lo que el detector
de la Fase 5 encontró de verdad.

### Cinco propuestas, y distintas de verdad
El apartado 8 lo dice con un ejemplo: azul #123456, #123457 y #123458 **no son tres opciones, son
una**. Por eso cada propuesta parte de una **estrategia cromática distinta** —el mismo tono, el
complementario, el mismo desaturado, subido de intensidad, casi todo neutro— y no de un retoque de
la anterior. Hay prueba de que no hay dos acentos iguales y de que la distancia entre ellas es
perceptible.

Cada una es un tema entero: principal, secundario, terciario, transparencia de tarjetas y barra, y
overlay del fondo. No un color suelto.

### Probar antes de decidir
"Probar" la pone en la app de verdad, al instante, **sin guardarla**. "Volver" recupera exactamente
lo que tenías.

Y eso funciona porque se hace una **copia profunda de la apariencia antes de tocar nada** y se
restaura entera — no se deshace cambio por cambio. La copia se hace **una sola vez**, al empezar a
probar: si se rehiciera en cada prueba, la segunda guardaría la apariencia de la primera y "Volver"
devolvería a una propuesta en lugar de a lo tuyo.

### Aplicar no toca la fotografía
Y no porque se acuerde de no hacerlo: `aplicarPropuesta` **ni siquiera la recibe**. Cambia acento,
tema y overlay, y nada más.

### Una foto en blanco y negro sigue dando propuestas
La Fase 5 dejó `acento: null` como dato honesto cuando la foto no tiene color. Aquí se usa: en vez
de inventar uno, se parte del que **ya tenías**.

### Un fallo real y preexistente, encontrado por las pruebas de contraste
`ensureContrast` elegía la dirección con `l <= bgL ? -1 : 1`, o sea por el **orden relativo** entre
los dos colores. Sobre un fondo oscuro, un color aún más oscuro se oscurecía **todavía más**: lo
empujaba hasta el negro puro y salía sin contraste ninguno.

No era solo cosa de esta fase: afectaba a la red de seguridad de `aplicarTema`, así que un texto
personalizado casi negro sobre el fondo oscuro de la app se habría quedado ilegible. Ahora la
dirección la decide **el fondo** —sobre fondo oscuro se aclara, sobre claro se oscurece— y para los
casos normales el resultado es idéntico al de antes.

### Y otro hex duplicado que cazó la regla invariante
El recomendador comparaba el contraste contra `'#0A0C10'` y `'#F3F4F7'` escritos a mano, que son
literalmente `COLORS_OSCURO.bg` y `COLORS_CLARO.bg`. Ahora se importan.

### Verificación
**1193 comprobaciones en verde** (antes 1143): 46 del recomendador y 104 casos de renderizado.

---

## Entrega 2 · FO Fase 5 — Detector de colores (v1.40.0)

JosStyle mira tu foto de fondo y te dice de qué colores es. **Sin IA y sin que la foto salga del
teléfono**: es aritmética sobre los píxeles de un `<canvas>` local, ni una petición.

### Frecuencia no es utilidad
Es la idea que gobierna toda la fase. El color que más superficie ocupa suele ser el **peor**
candidato a acento: en una foto nocturna es "casi negro" y en una de playa "casi blanco". Lo
interesante suele ser ese pequeño azul eléctrico que ocupa el 2 %.

Por eso cada color lleva **dos números distintos**: `peso` (cuánta superficie ocupa) e `interes`
(cuánto destaca). El ejemplo literal del apartado 8 está automatizado: una foto 95 % negra con un
5 % de azul eléctrico devuelve el **negro como dominante y el azul como acento**.

### Detectar no es aplicar
El apartado 15 es tajante y la interfaz lo dice: *"Solo te los enseño: tus colores no cambian
solos"*. Si tienes una foto azul y una paleta roja, tu paleta roja **se queda como está**. Tocar un
color lo copia, y de ahí decides tú. Aplicar automáticamente es la Fase 6.

### Una foto en blanco y negro no es un error
Se identifica como paleta neutra, y **no se inventa un acento que la foto no tiene**: `acento` es
`null`. Eso es información honesta, y la Fase 6 podrá buscar el acento por otro lado sabiendo que
ahí no está.

### Cada análisis va sellado con su fotografía
Cambiar de foto y seguir viendo la paleta de la anterior es imposible por construcción: el análisis
lleva el id de su imagen y se comprueba antes de usarlo. Y una foto ya analizada no se vuelve a
analizar.

### Un fallo real, y de los que no dan ningún error
`rgbToHsl`/`hexToHsl` devuelven la saturación en **0-100, no en 0-1**. Mis umbrales estaban en la
escala equivocada, así que **todo color con más de un 0,6 % de saturación salía como "vivo"** y solo
un gris exacto contaba como neutro: la clasificación entera habría sido inútil, y la Fase 6 habría
construido recomendaciones sobre datos sin sentido. Lo cazó la prueba que clasifica el propio acento
de la app (`#5C7E9A`, s = 25,2).

### Ocho fotos imposibles, ninguna rota
Toda negra, toda blanca, gris plano, extremadamente oscura, extremadamente clara, dos colores, un
solo píxel y saturadísima. El apartado 17 dice que **nunca** debe producirse una configuración rota,
y hay una prueba por cada caso.

Los píxeles transparentes tampoco cuentan: un agujero no es un color, y contarlo metería un falso
negro en toda imagen con transparencia.

### Verificación
**1143 comprobaciones en verde** (antes 1070): 65 del detector y 100 casos de renderizado.

---

## Entrega 2 · FO Fase 4 — Sistema avanzado de colores (v1.39.0)

Amplía el sistema de color que ya existía —`colorEngine.js`, `aplicarTema`, `ColorPicker`,
`TemaBuilder`, temas guardados— con lo que le faltaba para convivir con una fotografía de fondo.

### La transparencia no es un efecto bonito: era la pieza que faltaba
Con una foto detrás, las tarjetas opacas la tapan entera y solo se ve en los márgenes. Sin esto,
las fases 2 y 3 quedaban a medias: podías poner tu foto y **no verla**.

Por eso la transparencia llega hasta los tokens de verdad (`COLORS.surfaceAlpha`,
`COLORS.navBgAlpha`) y hasta los componentes (`Card`, la barra inferior), no solo al modelo. **Al
100 % es exactamente el color sólido de siempre**, así que sin tocar nada nada cambia.

Lleva `backdropFilter` cuando hay transparencia, porque una tarjeta translúcida sobre una foto con
detalle se vuelve ilegible sin él.

### Un fallo real corregido de paso
La barra de navegación tenía un `rgba(5,6,10,0.75)` fijo en el código, así que **en tema claro
seguía siendo negra**. Ahora sale del sistema de colores y respeta el tema.

### Y otro que las pruebas existen para que no vuelva
`Object.assign(COLORS, base)` sobrescribe las claves de `base` pero **no borra** las que no están
en él. `iconActive`, `iconMuted` y `navBg` no existen en las paletas base, así que sin limpiarlos
antes se quedaban pegados del render anterior: quitar un color personalizado habría parecido que no
funcionaba.

### Restablecer colores no puede tocar la fotografía
Y no porque se acuerde de no hacerlo: **ni siquiera la recibe**. `restablecerColores()` no tiene
parámetros, y hay una prueba que comprueba justamente eso. Una garantía que depende de acordarse no
es una garantía.

Un preset de color tampoco vuelve las tarjetas opacas: si habías bajado la opacidad para ver tu
foto, elegir una paleta no tiene por qué taparla.

### Jerarquía de texto e iconos
Texto secundario configurable, con red de seguridad: uno del color del fondo **no se queda
invisible**, `ensureContrast` lo corrige. Iconos activo e inactivo por separado, porque forzar un
solo color para los dos destruye la jerarquía.

### El mínimo de opacidad es 20, no 0
Y la interfaz lo explica cuando te acercas. Por debajo, una tarjeta sobre una foto no es
"translúcida": es texto suelto encima de una imagen. La Fase 9 afinará esto con medidas reales.

### Verificación
**1070 comprobaciones en verde** (antes 1000): 62 nuevas del sistema de colores y 92 casos de
renderizado.

---

## Entrega 2 · FO Fase 3 — Editor de fotografía (v1.38.0)

Zoom, encuadre, desenfoque, luz, opacidad y tinte, con vista previa en tiempo real. Detrás de
"Ajustar foto", para no llenar Ajustes de deslizadores.

### La foto original nunca se toca
Los ajustes son configuración del fondo, no una imagen nueva: después de editar, la ruta, las
medidas y el id de la fotografía son exactamente los mismos. Se puede volver a ajustar cuantas
veces haga falta.

### Cancelar funciona de verdad
El editor trabaja sobre un **borrador local**: mientras está abierto no se guarda nada. Cancelar es
literalmente tirar el borrador. Hay prueba que hace 40 cambios seguidos y comprueba que el fondo
guardado no se ha movido — el apartado 14 pide expresamente que funcione "incluso después de
realizar muchos cambios".

### Un solo control para oscurecer y aclarar
Los apartados 9 y 10 piden las dos cosas. Van en **un control bipolar**, no en dos deslizadores:
dos controles para dos mitades del mismo eje se contradicen en cuanto los dos valen algo (¿qué es
"oscurecer 40 y aclarar 30"?), y el apartado 17 pide no llenar la pantalla. El aclarado llega menos
lejos a propósito, porque el apartado 10 avisa de no perder contraste.

### Tres capas, y el orden importa
Foto → luz → overlay. "Oscurecer la foto" no debe oscurecer el overlay que va encima, y el overlay
no debe desenfocarse con la foto. Por eso tampoco se usa `filter: brightness()` sobre la capa de la
imagen.

### Cambiar de foto no arrastra lo que no toca
El apartado 16 dice que los ajustes no deben transferirse "accidentalmente si no tiene sentido". La
línea está en si el ajuste habla de **esa imagen** o del **gusto** de quien mira: encuadre y zoom se
recalculan —el encuadre bueno de un retrato vertical no significa nada en una panorámica—, mientras
que desenfoque, luz, opacidad y tinte se heredan, porque si querías la foto discreta y oscura para
leer mejor la sigues queriendo así con otra imagen.

Y si esa foto ya se había ajustado antes, mandan **sus** ajustes: se guardan por id de fotografía
(apartado 20), limitados a las últimas diez para que no crezcan sin fin.

### Una decisión de modelo que no era neutral
La Fase 1 guardaba `posicion` con cinco valores fijos; esta fase necesita encuadre libre. **No
conviven**: dos formas de decir dónde va la foto son dos fuentes de verdad. `posicion` se traduce a
`encuadre {x, y}` y lo guardado por v1.36/37 se migra. Lo mismo con `velo`, que era el overlay sin
color.

### Un fallo real que encontró la prueba de esa migración
El traslado de `velo` a `overlay` estaba escrito como `f.overlay?.intensidad ?? f.velo`, y **nunca
se ejecutaba**: `f` ya viene fusionado con el valor por defecto, así que `f.overlay` siempre existe
con `intensidad: 0`, y `??` no salta con 0. A quien tuviera un velo puesto se le habría perdido en
silencio al actualizar. Se arregla mirando el objeto **guardado**, no el fusionado.

### Y otro que cazó la regla invariante de colores
La capa de luz usaba `#000000`/`#FFFFFF` sueltos. No son colores de interfaz —oscurecer es acercar
al negro en tema claro y en oscuro— pero añadir una excepción al comprobador lo habría debilitado.
Se usan las palabras clave de CSS `black` y `white`.

### Verificación
**1000 comprobaciones en verde** (antes 941): 207 del sistema de fondos y 84 casos de renderizado.

---

## Entrega 2 · FO Fase 2 — Galería y selección de fotografías (v1.37.0)

Ya se puede poner una foto propia de fondo. **Ajustes → Apariencia → Fondo → Foto.**

### La foto no se aplica al elegirla
El apartado 3 lo pide expresamente: primero la vista previa, después "Aplicar". Así nadie tiene
que aceptar una configuración que no le gusta y deshacerla después.

Y la **subida a Storage ocurre al aplicar, no al elegir**. Si subiera al elegir, cada foto que
Josué mirara y descartara dejaría un archivo huérfano en su bucket para siempre. La vista previa
se hace con `URL.createObjectURL`, que es local e instantánea: no hay que esperar a la red para
ver cómo queda.

### La vista previa enseña la interfaz, no solo la foto
La foto se pinta **dentro de una representación de JosStyle**, con una tarjeta y su texto
secundario encima. Un rectángulo con la foto solo enseña la foto; lo que hay que poder juzgar es
si el contenido se sigue leyendo.

### El encuadre inicial no es "centrar y ya"
Una foto muy vertical se ancla **arriba** — que es donde está el cielo o el rostro en la inmensa
mayoría de fotos de móvil — en vez de cortar por la cintura. Las horizontales, panorámicas y
cuadradas se centran. Siempre `cover`, así que **la imagen nunca se deforma** (apartado 5).

### Quitar la foto no la borra
Vuelve al fondo anterior —el color o el degradado que hubiera, y si no, al fondo normal— y **la
fotografía se conserva** para la recuperación de la Fase 12, como pide el apartado 9. La interfaz
lo dice para que nadie evite el botón.

Y al revés: **elegir una foto no borra el color ni el degradado** que hubiera configurados
(apartado 14). Hay prueba propia.

### Nunca la pantalla sin fondo
Mientras la URL de la foto se está firmando, `resolverFondo` baja al fondo incluido. Eso da gratis
la transición suave del apartado 16: no hay parpadeo ni un instante sin fondo.

### Bucket nuevo `fondos`
Con sus tres políticas RLS por carpeta de usuario, mismo patrón que `armario`, `progreso` y
`entrenamiento-videos`. Va en su propio bucket a propósito: una foto de prenda se borra con la
prenda, un fondo se sustituye al elegir otro, y mezclarlos obligaría a distinguirlos por convenio
de nombre de archivo — el tipo de acuerdo implícito que se rompe solo.

⚠️ **Josué tiene que ejecutar ese bloque de `supabase/schema.sql` en el SQL Editor.** Hasta
entonces funciona todo menos la fotografía: color, degradado e incluidos no tocan Storage.

### Dos detalles que estaban mal si no se piensan
1. **`URL.createObjectURL` sin `revokeObjectURL` es memoria retenida** hasta recargar la página.
   Se suelta al desmontar y cada vez que se sustituye por otra foto.
2. **Una firma en vuelo puede pisar a la siguiente.** Si Josué cambia de foto mientras la URL
   anterior se firmaba, la respuesta lenta de la vieja llegaría después y sobrescribiría a la
   nueva. El efecto lleva una bandera que descarta el resultado obsoleto.

### Verificación
**941 comprobaciones en verde** (antes 882): 152 del sistema de fondos y 80 casos de renderizado,
incluidos el estado con foto y el estado sin foto todavía, que es donde más fácil sería dejar un
hueco roto.

---

## Entrega 2 · FO Fase 1 — Arquitectura del sistema de fondos (v1.36.0)

Empieza el bloque **FO (Fondos y Fotografías)**. Esta fase no añade una foto de fondo: construye
el sistema que hará falta para que quepan las once fases siguientes sin rehacer nada.

### El fondo es un elemento propio, no "una imagen detrás"
Es lo que pide el apartado 2, y marca la diferencia entre esto y pegar una imagen en el `<body>`.
Hay un solo sistema que sabe qué fondo está activo, cuál usa, cómo se muestra, con qué ajustes y
qué colores usa la interfaz encima.

### Amplía el sistema de apariencia; no compite con él
Ya existían `COLORS`, `aplicarTema()` y `colorEngine.js`. El fondo **se guarda dentro de
`apariencia`**, junto a tema, densidad, radio y alto contraste, y se resuelve en el mismo sitio y
el mismo momento que el tema. Ni una clave nueva en la base de datos, ni un segundo sistema de
apariencia — los dos lo piden los apartados 5 y 12.

### Nunca un fondo roto
El apartado 6 es literal: *"nunca debe aparecer un fondo vacío, roto o indefinido"*. Por eso
`resolverFondo` **no devuelve null jamás**. Un color inválido, un degradado a medias o una foto que
ya no está bajan un escalón de la cadena en vez de dejar un hueco, y dicen por qué. Hay una prueba
que le mete diez entradas rotas a propósito —`null`, `42`, `'texto'`, un tipo inventado— y
comprueba que todas salen con un tipo pintable.

### Cambiar de tema no puede perder el fondo
Los fondos incluidos se definen con **tokens**, no con hex, así que un fondo incluido acompaña al
tema claro/oscuro y al acento de Josué en vez de imponer un color ajeno. La prueba pinta el mismo
fondo con dos paletas distintas y comprueba que sale distinto y que la configuración guardada no
cambia.

### Restablecer no borra nada
El apartado 14 es explícito. "Volver al fondo normal" desactiva el fondo pero conserva el color, la
foto y los ajustes, y **la interfaz lo dice** para que nadie evite el botón por miedo a perder lo
que eligió. Es el mismo criterio que la app tiene desde ME Fase 3: lo reversible no se destruye.

### Un fallo de apilamiento CSS corregido al escribirlo
Una capa `position: fixed; z-index: 0` se pinta en el paso 6 del orden de pintado de CSS, **por
encima** del contenido en flujo normal, que va en el paso 3. Tal cual, el fondo habría tapado la
aplicación entera. Se arregla con `isolation: isolate` en el contenedor y `z-index: -1` en las
capas, que las deja exactamente entre el `background` del contenedor y el contenido.

### Y un hueco de cobertura que se cerró de paso
`SettingsView` no se renderizaba en ninguna prueba. Ahora su bloque de fondo sí, con cuatro
escenarios — incluido **un fondo guardado por una versión anterior, sin los campos nuevos**, que es
exactamente lo que devuelve `loadData` y lo que la regla 5 del proyecto obliga a soportar.

### Verificación
**882 comprobaciones en verde** (antes 777): 101 nuevas del sistema de fondos y 72 casos de
renderizado real.

---

## Entrega 2 · AR Fase 4 — Anti-repetición, estadísticas y recomendaciones (v1.35.0)

**Cierra el bloque AR (4/4).** El historial deja de ser una lista y pasa a decir algo. Cuarta
pestaña del Armario: **Prendas | Outfits | Calendario | Ideas**.

### Ninguna llamada a la IA, y es a propósito
El apartado 25 de la especificación prohíbe expresamente la IA de moda, y la regla 7 del proyecto
dice que la IA analiza y sugiere pero nunca decide ni se dispara sola. Así que **toda la
inteligencia de esta fase son reglas sobre el historial real**. La consecuencia práctica es la que
importa: cada recomendación llega con sus **motivos escritos**, sacados de los mismos números que
la ordenaron. Si algo no se puede explicar en una línea, no se enseña.

```
✨ Cena Negra
   · hace 20 días que no lo usas
   · todas sus prendas están disponibles
   · es uno de tus favoritos
```

### Sin contadores, otra vez
La Fase 3 quitó los contadores guardados. Esta fase **no los reintroduce por la puerta de atrás**:
los índices que usa se construyen al vuelo, se consultan y se tiran al acabar el render.

### Qué calcula
Estadísticas de outfits y de prendas (con rankings), diversidad del armario, outfits olvidados,
prendas infrautilizadas, prendas que se están repitiendo y **combinaciones repetidas** — estas
últimas detectan el mismo conjunto de ropa aunque esté guardado en dos outfits distintos, que es lo
que pasa cuando duplicas un outfit y le cambias el nombre.

El uso de una prenda **se deriva de sus outfits**, con el ejemplo literal del apartado 4
comprobado: 3 usos en un outfit + 5 en otro = 8, y sigue siendo UNA prenda.

### La diversidad es una fracción, no una puntuación
El apartado 16 avisa: nada de un número arbitrario sin explicación, y si no aporta valor, mejor no
implementarlo. Así que la única métrica que hay es `prendas usadas ÷ prendas disponibles`, una
división que cualquiera puede rehacer a mano, con sus dos números crudos a la vista. **No cuenta
las que están en la lavandería**: una camiseta que ha pasado el mes en el cesto no se ha usado,
pero eso no es falta de diversidad, es que no estaba.

### Nada se prohíbe, todo se dice
Un outfit usado ayer sale marcado, pero se puede usar igual. Un outfit con una prenda en la
lavadora nunca es la primera recomendación —cualquier alternativa completa le gana— pero **sigue
apareciendo, y dice qué prenda concreta le falta**. El contexto (lugar, ocasión, personas,
temporada) suma señales y no descarta a nadie.

### Saber cuándo no se sabe
Por debajo de 5 usos registrados **no se recomienda nada**, y se dice cuántos faltan. Con menos,
"el que hace más tiempo que no usas" es casi siempre "el que registraste primero", y eso no es un
patrón: es el orden de entrada de los datos.

### Un fallo real que encontraron las pruebas
`noDisponiblesDeOutfit` devuelve un **número**, y yo lo estaba tratando como una lista.
`noDisponibles.length` era `undefined`, así que `> 0` era siempre falso y **la penalización por
prendas no disponibles no se aplicaba nunca**: el outfit con una prenda en la lavadora salía como
primera recomendación. No daba error ni al compilar ni en consola. Arreglado en el origen, con una
`prendasNoDisponiblesDeOutfit` que devuelve la lista y un `noDisponiblesDeOutfit` que pasa a ser su
longitud — las dos respuestas salen ahora del mismo cálculo.

### Y dos cosas más, al releer el código antes de cerrar
- **La recomendación se guardaba en el estado**, así que registrar el uso desde la propia tarjeta
  dejaba en pantalla un "hace 20 días" que acababa de dejar de ser verdad.
- **"Más usados" y "menos usados" eran la misma lista al revés** cuando había 5 outfits o menos.

### Verificación
**777 comprobaciones en verde** (antes 661): 108 nuevas del motor de inteligencia —incluida la
prueba crítica del apartado 24, número a número— y 68 casos de renderizado real.

---

## Entrega 2 · AR Fase 3 — Calendario e historial de uso (v1.34.0)

El armario deja de ser un inventario y pasa a tener memoria. **Gestión → Armario** tiene ahora tres
pestañas: **Prendas | Outfits | Calendario**.

### Cada uso es un registro, no una fecha que se pisa
Ponerse el mismo outfit el 1, el 5 y el 12 de agosto son **tres registros independientes**, cada uno
con su fecha, su hora, su lugar, sus personas, su ocasión y sus notas. Sin eso no hay historial: hay
un "último uso" que olvida todo lo anterior.

### Ningún contador guardado
Aquí está el cambio de fondo de esta fase. Las Fases 1 y 2 dejaron un `usos` y un `ultimoUso`
guardados dentro de cada prenda y de cada outfit. **Se han eliminado**, tal y como pide el apartado
17 de la especificación, y ahora todo se deduce de `armario.usos`:

    PRENDA → los outfits que la contienen → los usos de esos outfits

Un contador guardado es una **segunda fuente de verdad**: basta con que un borrado de uso no lo
decremente para que una prenda diga "usada 18 veces" con 17 registros detrás. Derivándolo, ese
descuadre es imposible por construcción. El efecto secundario bonito es que **una prenda tiene
historial aunque nunca se haya registrado directamente**: se deduce de los outfits en los que sale.

Para que ordenar por uso no salga caro, las tres ordenaciones que lo necesitan van contra un índice
(`indiceUsoPrendas` / `indiceUsoOutfits`) construido en una sola pasada y tirado al acabar el
render. Es rendimiento, no modelo de datos: nunca se guarda, así que nunca se desincroniza.

### El calendario
Vista mensual que **reutiliza `celdasMes` del Calendario Universal** — regla 11 del proyecto: ni un
segundo motor de calendario. Lo único propio es qué se pinta dentro de cada celda: la **miniatura de
la prenda** al 55 % detrás del número del día, y una insignia con el número cuando ese día hubo más
de un outfit. Pulsar un día con outfits abre su detalle; pulsar uno vacío abre el formulario con esa
fecha ya puesta. Hay también una **vista de lista** con rango (7 / 30 / 90 / 365 días o todo) y
filtros por outfit, prenda, ocasión, lugar y persona.

### En el Calendario Universal, derivado
Los usos aparecen en el Calendario general como **fuente derivada**, igual que Objetivos, Estudios,
Entrenamiento, Tareas y Relación: se generan en cada render desde `armario.usos` y **no se copian
nunca**. Borrar un uso desde el Armario lo quita del Calendario en el mismo render, sin una línea de
código de limpieza, porque nunca hubo una segunda copia que limpiar. El título sale del outfit
referenciado, así que renombrarlo actualiza también el calendario del mes pasado.

### Borrar un outfit con historial
**Se conserva el historial**, por el mismo motivo por el que la Fase 2 conservaba las prendas dentro
de los outfits: el outfit va a la papelera, o sea que puede volver. Si al borrarlo se borraran sus
usos, restaurarlo devolvería el outfit pero no su historia. Conservándolos, **restaurar lo cura todo
solo**. Mientras no esté, la fila del historial dice *"Outfit eliminado"* en vez de fingir que ese
día no pasó nada.

### Dos fallos reales de TODA la app que destapó esta fase
Los dos en `src/lib/helpers.js`, los dos por usar `toISOString()`, que devuelve siempre UTC:

1. **`todayISO()` devolvía AYER** entre las 00:00 y la 01:00/02:00 en España. Registrar el sueño a
   las 00:30 lo archivaba en el día anterior — y lo mismo un gasto, una comida, un hábito o una
   entrada del diario a esa hora. Lo avisaba el apartado 9 para el registro de outfits; el fallo
   era de todo el proyecto, no solo del armario.
2. **`addDays()` restaba un día entero**: construía la fecha en hora local y la devolvía en UTC.
   `addDays('2026-08-25', 1)` daba `'2026-08-25'`, y `addDays('2026-01-15', 7)` daba el 21 en vez
   del 22. Lo usan la recurrencia del Calendario y las predicciones.

Los dos están arreglados con `toLocaleDateString('sv-SE')`, que es la forma estándar de pedirle al
formateador local un `AAAA-MM-DD` limpio, y los dos tienen prueba propia.

### Sin datos, no se inventa nada
Una prenda o un outfit sin usar dice **"Todavía no hay datos de uso."** — nunca "hace 0 días", nunca
una fecha inventada (apartado 28, literal).

### Verificación
**661 comprobaciones en verde** (antes 545): build de Vite, 297 del armario —incluida la batería
obligatoria del apartado 40 y la prueba crítica del 41, número a número—, 64 casos de renderizado
real y las 9 reglas invariantes.

---

## Entrega 2 · AR Fase 2 — Constructor de Outfits (v1.33.0)

Las prendas dejan de ser elementos sueltos. **Gestión → Armario** tiene ahora dos pestañas:
**Prendas** y **Outfits**.

### La regla que manda: referencias, nunca copias
La especificación lo repite en cuatro apartados distintos, así que se ha respetado al pie de la
letra: un outfit guarda **`prendaIds`**, no objetos de prenda. Cambiarle el nombre, el color o la
foto a una prenda se ve al instante en todos sus outfits, porque no hay ninguna copia que
actualizar. Una prenda usada en tres outfits sigue siendo **una prenda y tres relaciones**.

### Qué pasa al borrar una prenda que está en un outfit
La especificación dejaba elegir entre tres salidas. Se ha elegido **conservar la referencia y
mostrarla como no disponible**, por un motivo concreto:

Desde ME Fase 3, borrar una prenda la manda a la papelera — **se puede restaurar**. Si al borrarla
le quitáramos su id a todos los outfits, restaurarla dejaría los outfits rotos para siempre: el dato
volvería, pero el vínculo no. Conservando la referencia, **restaurar la prenda cura los outfits
solos**, sin una línea de código de reparación.

Mientras tanto el outfit no miente: dice *"1 prenda no disponible"* y su detalle explica que vuelve
sola si la recuperas. Y la confirmación de borrar una prenda avisa antes: *"está en 2 outfits"*.

### Cómo se eligen las prendas
Por **zona del cuerpo** (superior, inferior, calzado, abrigo, accesorios, otros), no por las 14
categorías: es como se piensa uno al vestirse. Es una vista sobre las categorías que ya existen, no
una segunda clasificación que rellenar.

Y **sin límite**: camiseta + camiseta interior + sudadera + pantalón + zapatillas + reloj + cadena es
un outfit perfectamente válido. El buscador de dentro **es el de la Fase 1 tal cual** — la
especificación pide expresamente no crear un segundo sistema.

### "negro" encuentra "Total Black"
El ejemplo literal del apartado 23, funcionando: buscar "negro" encuentra un outfit llamado *Total
Black* **porque contiene una prenda negra**, aunque su nombre no lleve esa palabra. La búsqueda mira
también el nombre, la marca, la categoría y el color de las prendas que lo componen.

### Duplicar sin heredar lo que no toca
Duplicar un outfit crea una entidad independiente con **las mismas prendas**, y modificar la copia no
roza el original. Lo que la especificación subraya dos veces: la copia **empieza con el historial a
cero**. Es un outfit nuevo; no se ha llevado nunca.

### Lo que se ha pulido
Contador de selección; quitar una prenda volviendo a pulsar su tarjeta entera; aviso de *"Outfit
guardado ✓"* que se va solo (nada de `alert()`); editar y duplicar **a un toque desde la tarjeta**;
**eliminar separado de esas dos** y solo dentro del detalle con confirmación, para que no se pulse
sin querer; y el detalle releyéndose de la lista, para que un cambio se vea al instante.

### Lo que NO se ha hecho, a propósito
Ni calendario, ni historial de uso, ni recomendaciones, ni anti-repetición. `usos` y `ultimoUso`
existen y **están a cero**: el apartado 8 del cierre es explícito — *"no inventes datos"*. La Fase 3
los llenará, y `armario.usos` ya está declarado como lista para que cada uso sea **un registro
independiente**, no una sola fecha.

### Un fallo mío, cazado por las pruebas
Al escribir el detalle del outfit dejé un `</div>` de más y el proyecto dejó de compilar.
`scripts/smoke.mjs` lo detectó antes de llegar a ninguna parte.

### Verificación
`bash scripts/verificar.sh` → **545 comprobaciones en verde**, 185 del armario y 60 casos de
renderizado. Entre ellos, los dos casos límite que la especificación subraya: **un outfit con una
prenda borrada** y **un outfit sin ninguna prenda**, que tienen que pintarse sin reventar.

⚠️ **Pendiente de Josué (R1):** el recorrido completo en un iPhone y la persistencia real en
Supabase.

---

## Entrega 2 · AR Fase 1 — Armario digital (v1.32.0)

**El primer módulo genuinamente nuevo de la Entrega 2.** ME y BI ampliaban cosas que ya existían;
esto no existía en ninguna forma. Vive en **Gestión → Armario**.

### La decisión que más pesa: el modelo de datos
El apartado 23 dice que la arquitectura tiene que aguantar tres fases más sin rehacerse. Por eso
cada prenda nace con **los 21 campos**, aunque cuatro estén vacíos: `usos`, `ultimoUso`, `outfits` y
`favorita`.

No es adorno. Las fases 3 y 4 tienen que responder a *"¿cuándo la usé por última vez?"* y *"¿cuánto
lleva sin usarse?"*, y `loadData` **no fusiona con el valor por defecto** (regla 5 del proyecto): un
campo que aparezca en la Fase 3 no lo tendrán las prendas ya guardadas, y arreglarlo entonces exige
una migración manual prenda a prenda. La prueba lo comprueba hoy, campo por campo.

Las tres ordenaciones por uso (*Más usadas*, *Menos usadas*, *Más tiempo sin usar*) **ya están
escritas y probadas**, pero la interfaz no las ofrece mientras no haya ni un uso registrado. Un
"Más usadas" sobre un armario sin usos sería un control decorativo, y eso es la regla 8.

### Añadir una prenda en segundos
El apartado 16 es tajante: *"no quiero que el usuario tenga que rellenar 15 campos cada vez que
añade una camiseta"*. Por defecto solo se ven **nombre, categoría, color y foto opcional**; los ocho
campos restantes están detrás de "Más información".

Y la foto es opcional de verdad: sin ella la tarjeta pinta un degradado del color de la prenda con
su categoría, **del mismo alto que una foto**, para que la rejilla no se desalinee según quién tenga
fotografía y quién no.

### Buscar por lo que uno recuerda, no por el nombre exacto
La especificación lo pide explícitamente: "gris" encuentra prendas grises y "Nike" prendas de Nike.
La búsqueda mira nombre, marca, talla, notas, material, categoría, color, estado y temporada — y
sobre las **etiquetas**, no los ids: Josué escribe "marrón", no "marron".

### Confirmación al eliminar: una excepción con motivo
Desde ME Fase 3, borrar no pide confirmación en ninguna parte de la app, porque la papelera lo hace
reversible. Aquí **sí la pide**, y no es capricho: la papelera guarda el objeto de la prenda, pero
**la fotografía vive en Supabase Storage y no vuelve** — igual que las fotos de Salud y los vídeos
de Calistenia, excluidos de la papelera desde entonces. Borrar una prenda con foto es en parte
irreversible, y eso es justo lo que la regla reserva para la confirmación. El texto lo dice, y
cambia según la prenda tenga foto o no.

### Dos cosas nuevas que hicieron falta
- **`SelectInput`**: el proyecto no tenía ni un `<select>`. Todas las elecciones se hacían con filas
  de botones, que funcionan con 3 o 4 opciones; el Armario tiene 14 categorías y 13 colores, y
  catorce pastillas en fila no caben en un iPhone. Un desplegable nativo abre además la rueda de
  iOS, que se maneja con el pulgar mucho mejor.
- **El bucket `armario`** en `supabase/schema.sql`, con las mismas políticas por carpeta de usuario
  que `progreso` y `entrenamiento-videos`.

### ⚠️ Algo que Josué tiene que hacer
**Ejecutar el bloque nuevo de `supabase/schema.sql` en el SQL Editor de Supabase** (solo ese bloque,
está marcado). Hasta entonces el Armario funciona **entero sin fotos**: la fotografía es opcional
por diseño, y si la subida falla, la prenda **se guarda igual** con un aviso — perder lo escrito por
un fallo de red sería mucho peor.

### Un fallo que destapó la prueba de renderizado
`ArmarioView` es la primera vista del smoke test que toca Storage, y `lib/supabase.js` lee
`import.meta.env` al cargarse — algo que solo existe dentro de Vite. Ahora está stubeado, y de paso
queda comprobado algo que importa por sí mismo: **ninguna vista debe necesitar la red para
pintarse**.

### Verificación
`bash scripts/verificar.sh` → **443 comprobaciones en verde**, 87 de ellas del armario, más 4 casos
de renderizado (vacío, con datos, datos parciales y con el módulo desactivado).

⚠️ **Pendiente de Josué (R1):** subir una foto de verdad y ver la rejilla en un iPhone.

---

## Entrega 2 · BI Fase 4 — Buscar y preguntar dejan de ser dos cosas (v1.31.0)

Cierra el bloque BI (4/4). Josué ya no tiene que decidir si lo suyo es una búsqueda o una pregunta:
escribe, y JosStyle decide qué es más útil enseñarle.

### Tres intenciones, no dos
El apartado 5 pide **navegación**, **pregunta** y **acción**. Hasta ahora solo había un booleano
"¿es pregunta?". La tercera es la que cambia el comportamiento:

| Escribe | Intención | Qué sale primero |
|---|---|---|
| `colores` | navegación | Colores y tema |
| `¿cómo puedo mejorar mi planche?` | pregunta | la IA |
| `¿cómo cambio los colores?` | pregunta | la IA **y** Colores debajo |
| `cambiar colores` | **acción** | **Colores y tema**, la IA debajo |
| `quiero añadir un objetivo` | **acción** | **Crear un objetivo** |

Y no depende del signo `¿`, que es de lo que avisa el apartado 6: "cambiar colores" no lo lleva y es
claramente una acción. Se miran verbos, arranque de frase y longitud.

### Lo que hacía falta para cumplir el apartado 7, y no era obvio
"Cuando exista una función claramente relacionada, debe tener prioridad." El problema: **buscar la
frase entera no encontraba nada**. "quiero añadir un objetivo" no coincide con ninguna entrada,
porque ninguna contiene la palabra "quiero". Sin quitar ese envoltorio, la prioridad de la función
sobre la IA era imposible de cumplir — no había función que priorizar.

`nucleoDeConsulta` quita el relleno y deja "anadir objetivo", que sí encuentra la acción. Pero solo
**si la frase entera no ha dado nada**: aflojar una búsqueda que ya era precisa habría empeorado los
casos normales para arreglar los raros.

### Toda la decisión en un sitio que se puede probar
`resolverConsulta(indice, texto)` devuelve qué enseñar y en qué orden. Vive en el motor, no en el
componente, y por eso **los ocho casos de la prueba final del apartado 20 son ocho llamadas a una
función**, comprobadas sin renderizar nada.

### Un hueco real de navegación, arreglado
Buscar "colores" desde Inicio y pulsar atrás dejaba a Josué en el hub de **Más** — un sitio en el
que no había estado. Ahora vuelve a donde estaba. El rastro se borra en cuanto navega a cualquier
otro sitio, mediante un único efecto sobre `tab`: ponerlo en cada botón habría dejado fuera el que
se añada mañana.

### Errores y carga (apartados 14 y 15)
- "Pensando…" con su rueda, sin bloquear el resto de la app.
- Un mensaje de error con pinta de código o número de estado se sustituye por **"No he podido
  responder ahora mismo"**, con **Reintentar** y el buscador intacto detrás. Nada de
  `500 Internal Server Error` en pantalla.

### Lo que no se ha tocado
Los paneles de IA de cada módulo siguen exactamente donde estaban: el apartado 23 pide
expresamente que el buscador nuevo **no rompa el acceso inferior existente**. Y `api/ask-ai.js` no
se ha modificado — ninguna clave llega al frontend.

### Verificación
`bash scripts/verificar.sh` → **352 comprobaciones en verde**, 129 de ellas del buscador.

⚠️ **Pendiente de Josué (R1):** el recorrido completo en un iPhone real, con el teclado abierto.

---

## Entrega 2 · BI Fase 3 — El motor de búsqueda de verdad (v1.30.0)

La Fase 2 hizo el acceso y un índice que funcionaba. Esta lo convierte en un motor: sinónimos,
plurales, erratas, acciones directas, sugerencias y recientes.

### Lo que ahora encuentra y antes no
| Escribe | Antes | Ahora |
|---|---|---|
| `colo`, `entren`, `dormi` | ya funcionaba | igual |
| `color` (singular de "colores") | nada | Colores y tema |
| `colroes` (errata) | nada | Colores y tema + *"¿Quizá buscas Colores y tema?"* |
| `religion`, `musculo`, `diseno` | nada | Fe, Entrenamiento, Colores — por sinónimo |
| `modo oscuro` | Colores y tema | **Modo oscuro o claro**, con entrada propia |
| `nueva tarea` | Productividad | **abre el formulario de tarea nueva** |

### Tres tipos de destino, no solo pantallas
El apartado 11 pide que el índice no quede limitado a páginas. Ahora hay `pantalla`, `ajuste` (abre
su categoría de Ajustes) y `accion` (abre un formulario). Las cuatro acciones directas son
**exactamente** las que el Dashboard ya tiene en su fila de acciones rápidas, con el mismo `foco`:
no se ha inventado ninguna.

### Sinónimos y palabras clave son cosas distintas
El apartado 3 los separa y el 8 los ordena. Una **palabra clave** es como Josué llamaría a la
función ("dinero" → Economía); un **sinónimo** es un término vecino que debe encontrarla sin
adelantar a la función cuyo nombre es esa palabra. Por eso "concentracion" lleva a Bienestar —lo
tiene como palabra clave— y no a Productividad, que solo lo tiene como sinónimo.

### Dos bugs reales que encontraron las pruebas
1. **El plural atropellaba palabras clave literales.** "pantallas" abría *Pantalla principal* (que
   solo coincide tras quitarle la 's') en vez de Bienestar, que tiene "pantallas" escrito tal cual.
   La causa era estructural: `puntuar` devolvía el primer acierto por campos, así que una
   coincidencia floja en el título ganaba a una fuerte en las palabras clave. Ahora se evalúan
   todos los escalones y se coge el mayor, y el plural tiene su propio escalón, por debajo.
2. **La raíz destrozaba palabras cortas acabadas en 's'**: "tres" → "tre", "mes" → "me". El umbral
   pasó de 3 a 4 letras.

### Damerau, no Levenshtein
Con Levenshtein a secas, "colroes" está a **2** errores de "colores" (dos sustituciones) y con la
tolerancia razonable que pide la especificación no se encontraba. Contando el intercambio de dos
letras seguidas como **un** error, se encuentra. Las transposiciones son con diferencia la errata
más común escribiendo deprisa en un móvil, y es justo el ejemplo que pone el apartado 18.

Las erratas puntúan por debajo de todo lo demás, así que **nunca desplazan a un acierto real**, y
solo se aplican a consultas de una sola palabra: sobre una frase entera la distancia de edición deja
de significar nada y empieza a devolver cosas al azar, que es lo que prohíbe el apartado 7.

### Historial reciente, con cuidado
Cuatro accesos, con botón de limpiar. Dos decisiones deliberadas:
- **Guarda ids de funciones, no el texto escrito.** Una búsqueda puede ser una pregunta personal
  ("por qué me encuentro mal"); un historial de funciones abiertas, no.
- **Vive en `localStorage`, no en Supabase.** El apartado 16 lo pide, y además no es un dato que
  merezca sincronizarse entre dispositivos ni entrar en la copia de seguridad. Se resuelve contra el
  índice actual, así que un reciente cuyo módulo se desactive después desaparece solo.

### Privacidad (apartado 21)
Escribir "colores" **no sale del dispositivo**. La prueba no se fía de que esté bien escrito: lee el
propio archivo del motor y comprueba que no importa `askAI` ni hace `fetch`.

### Verificación
`bash scripts/verificar.sh` → **322 comprobaciones en verde**, 99 de ellas del buscador, incluidas
las seis categorías de pruebas obligatorias del apartado 22.

---

## Entrega 2 · BI Fase 2 — Buscar funciones y abrirlas directamente (v1.29.0)

### El problema, en una frase
Para cambiar un color, Josué tenía que acordarse de que eso vive en **Más → Ajustes → Apariencia →
Colores**. Ahora escribe "colores" y pulsa el resultado.

### Por qué es el mismo modal y no uno nuevo
El buscador que ya existía (Fase 18) busca en los **datos**: *"¿cuántas horas dormí de media?"*. Lo
que pide esta fase es buscar **funciones, pantallas y ajustes**. Son cosas distintas, pero el
apartado 20 es explícito: *"BUSCAR → ENCONTRAR → ABRIR y también PREGUNTAR → IA → RESPUESTA. Todo
desde el mismo acceso"*, y el apartado 16 prohíbe duplicar la IA existente. Así que se amplía el
modal de siempre en vez de poner un segundo buscador al lado.

### El índice no está escrito: se construye
El apartado 17 pide que añadir un módulo sea *"añadir una entrada"*, no tocar la lógica del buscador.
Los 19 módulos **no** están escritos en `indiceBusqueda.js`: se derivan de `MORE_NAV` —el catálogo
que ya usan la navegación, Personalización y Seguridad— más `DESCRIPCIONES_MODULOS`. Un módulo que
una fase futura añada ahí aparece solo en el buscador.

Lo único escrito a mano son las palabras clave, porque no se pueden derivar de nada: "dinero" no
aparece en ninguna parte del código, y es como se busca Economía. Para que eso no se quede atrás,
`comprobar-navegacion.mjs` ahora falla si alguien añade un módulo sin palabras clave — o deja
palabras clave de uno que ya no existe.

### Buscar y preguntar no son excluyentes
El apartado 11 lo dice mejor que un resumen: *"esto es mejor que obligar al usuario a elegir entre
búsqueda o IA desde el principio"*. Escribir `¿cómo cambio los colores?` saca **las dos cosas**: el
botón de preguntar a la IA arriba y el resultado de Apariencia debajo. La pregunta le llega a la IA
ya escrita; no hay que repetirla.

### Añadido / cambiado
- **`src/lib/indiceBusqueda.js`** (nuevo): índice + motor. `construirIndice`, `buscar`,
  `pareceUnaPregunta`, `normalizar`, `PALABRAS_MODULOS` y las 14 funciones de dentro de Ajustes.
  Los pesos del orden por relevancia están lo bastante separados como para que ninguna suma de
  coincidencias débiles adelante a una fuerte — es el ejemplo del propio apartado 8: buscando
  "color", "Colores" gana a cualquier entrada que solo mencione la palabra de pasada.
- **La lupa se muda arriba a la izquierda** (apartado 1) y el panel de sugerencias se va a la
  derecha. **Se intercambian, no se elimina ninguno**: son cosas distintas y la especificación
  prohíbe quitar funcionalidad existente.
- **Pulsar un resultado abre el sitio exacto**, categoría de Ajustes incluida, reutilizando el
  `navegarDesdeHoy` que ya existía. `SettingsView` acepta el mismo `foco` que Sueño, Entreno,
  Objetivos, Estudios, Productividad y Economía ya aceptaban.
- Sin coincidencias no queda una pantalla vacía: se ofrece la IA con lo que ya escribió.
- Campo con foco automático, botón de limpiar, y la lista scrollea dentro de `46vh` para que con el
  teclado abierto en un iPhone el campo siga visible.
- **`scripts/test-buscador.mjs`** (nuevo): 58 comprobaciones, entre ellas las nueve del control de
  calidad del apartado 19.

### Dos cosas que se han decidido no hacer, y por qué
- **No se han inventado Rachas ni Sonidos.** El control de calidad los pide *"si el módulo existe"*,
  y son fases futuras. "racha" lleva a Productividad —que es donde están hoy las rachas de hábitos
  de verdad— y "sonidos" no devuelve nada. Fingirlos habría roto la regla 8.
- **Sin animación de entrada por resultado.** El apartado 13 dice "VELOCIDAD > EFECTOS", y animar
  una lista que cambia con cada tecla la haría parecer más lenta, no más premium.

### Un fallo silencioso corregido de paso
`TextInput` era un componente de función normal, así que **se tragaba la `ref` sin decir nada**: el
foco automático del campo simplemente no habría ocurrido, sin error ni aviso en consola. Ahora usa
`forwardRef`. Es aditivo — ninguno de los ~60 usos anteriores pasa `ref`.

### Seguridad (apartado 18)
El índice es de funciones: **no contiene ni un dato de Josué**. Relación se encuentra como pantalla
—ya aparece en el menú "Más", no es un secreto—, pero abrirla sigue pasando por su PIN: el buscador
navega, no salta protecciones. Y un módulo desactivado en Personalización no se puede encontrar.

### Verificación
`bash scripts/verificar.sh` → **281 comprobaciones en verde**.

⚠️ **Pendiente de Josué (R1):** el comportamiento real con el teclado del iPhone abierto.

---

## Entrega 2 · BI Fase 1 — El desplegable de situación de Inicio (v1.28.0)

### Lo que ya estaba, y por qué no se ha rehecho
La especificación pide un componente colapsable con animación fluida, cerrado por defecto y
compacto. Eso **ya existía** desde v1.21.0: `IndicadorContexto` usa `grid-template-rows` 0fr↔1fr,
arranca cerrado y el chevron rota. Rehacerlo por rehacerlo habría sido gastar una fase en algo que
funciona.

### El hueco real
El apartado 5 pide que al abrirlo aparezcan **las opciones** de Vacaciones, Exámenes y las demás
situaciones. El componente solo dejaba **leer consejos**: para cambiar de situación había que salir
de Inicio, ir a Más → Personalización y buscar el selector. El estado final que dibuja el apartado
14 es justo lo contrario.

Ahora las tres situaciones se activan desde el propio desplegable. **Sin un solo dato nuevo**:
misma clave `personalizacion.modo`, mismo `setModoApp` de `App.jsx` —el que ya hacía el toggle— y
mismos textos de `MODOS_APP`. Desde Inicio y desde Personalización se toca el mismo interruptor,
que es lo que exige la decisión **D2-07** ("integrar, no hacer tres sistemas distintos").

### El fallo silencioso que apareció al hacerlo
El componente entero era un `<button>`. Meter dentro los selectores de situación habría dado
**botones anidados**: HTML inválido que no rompe el render, no da ningún error en consola y que en
iOS hace que el toque del botón interior se lo coma el exterior — un botón que simplemente no
responde, sin pista de por qué.

Ahora la cabecera es el botón y el contenido es su hermano. Y como es un fallo fácil de repetir,
`scripts/smoke-vistas.jsx` lo comprueba en **las 13 vistas × 4 escenarios**, no solo aquí.

### Añadido / cambiado
- **Accesibilidad real** (apartado 10): `aria-expanded` en la cabecera, `aria-controls` apuntando a
  un id que **existe de verdad** (uno colgando es peor que no ponerlo), `role="region"` con nombre y
  `aria-pressed` en cada situación, porque son interruptores y no navegación.
- La animación gana un desplazamiento de 4px además de la opacidad, para que el contenido entre en
  lugar de aparecer.
- Sin situación activa el panel ya no dice "Sin modificaciones especiales", que no explicaba nada:
  dice para qué sirve.
- Personalización menciona que el modo también se cambia desde Inicio, para que no parezcan dos
  ajustes distintos.
- **`scripts/test-inicio.jsx`** (nuevo): 18 comprobaciones — arranca cerrado, `aria-controls`
  resuelve, ningún botón anidado, las tres situaciones presentes, la activa marcada y sus consejos
  intactos.

### Lo que NO se ha tocado
Buscador, lupa, IA, rachas y sonidos: son fases posteriores y el apartado 11 lo prohíbe
expresamente.

### Verificación
`bash scripts/verificar.sh` → **223 comprobaciones en verde**.

⚠️ **Pendiente de Josué (R1):** cómo se ve y se siente en un iPhone de verdad, y el aspecto en tema
claro. El componente solo usa tokens de `COLORS`, así que sigue el tema por construcción, pero eso
es un argumento, no una comprobación.

---

## Entrega 2 · ME Fase 4 — Integración global, auditoría y renombrado a JosStyle (v1.27.0)

Cierra el bloque ME (4/4). La especificación no pide construir nada nuevo aquí: pide **revisar todos
los módulos con las mismas 10 preguntas** y arreglar lo que no las pase. Hacerlo en serio dio ocho
huecos reales.

### El hallazgo: ocho colecciones dejaban CREAR y no BORRAR
La pregunta 3 de la auditoría es *"¿sus elementos creados por el usuario se pueden eliminar?"*.
Siete módulos contestaban que no:

| Módulo | Qué no se podía borrar | Consecuencia real |
|---|---|---|
| Sueño | registros de noche | una noche mal tecleada distorsionaba la media para siempre |
| Economía | movimientos | un gasto duplicado no se podía quitar del balance |
| Salud | medidas | un peso mal puesto rompía la gráfica de evolución |
| Salud | historial médico | — |
| Nutrición | comidas | un escaneo erróneo se quedaba en el total del día |
| Fútbol | partidos | — |
| Estudios | horas de estudio | un "8" en vez de un "0.8" inflaba la semana entera |

Y el octavo lo encontró el script, no la revisión a mano: **los programas de Estudios**. Se podían
crear ("Idiomas", "Selectividad") y no había forma de quitarlos de la barra de pestañas.

### Por qué la auditoría es un script y no un documento
Un documento que diga "revisado, todo correcto" no vale nada dentro de seis fases. Tres de las diez
preguntas de la especificación se pueden comprobar solas, y son justo las que fallaron:

- **`scripts/auditar-modulos.mjs`** (nuevo) responde P3 (todo lo creable es borrable), P5 (ningún
  borrado se salta la papelera), P7/P7b (el catálogo y el código dicen lo mismo, en los dos
  sentidos) y P9 (toda entrada del catálogo se puede nombrar en la papelera).
- Entra en `scripts/verificar.sh`, así que **cada módulo nuevo de las 102 fases restantes pasa por
  ella automáticamente**. Si alguien añade una colección y olvida su borrado, la verificación falla.

### Añadido / cambiado
- **`BotonBorrar`** en `src/components/ui.jsx`: un único control de borrado para toda la app. No
  pide confirmación a propósito — desde ME F3 lo borrado va a la papelera y es recuperable; la
  confirmación se reserva para el borrado definitivo, que sí es irreversible.
- **Ocho handlers nuevos** en `App.jsx`, todos por papelera. Siete son de una línea; el octavo,
  `deletePrograma`, es la **segunda cascada** de la app: se lleva sus asignaturas y, con ellas, sus
  exámenes y sus horas, todo en la **misma** entrada de papelera — restaurar el programa devuelve
  el árbol entero, no un programa vacío.
- **`estudios.programas`** entra en `CATALOGO_PAPELERA` (27 colecciones).
- **Horas de estudio visibles**: hasta ahora se sumaban a un total y no había forma de ver ni
  corregir un registro concreto. Ahora la asignatura desplegada lista las últimas cinco, con su
  borrado.
- **`EstudiosView` sin programas** ya no dice "todavía no has añadido ninguna asignatura a este
  programa" cuando no hay programa ninguno: dice qué hacer.

### El renombrado: el proyecto se llama JosStyle
Josué ha cerrado la contradicción **C-21**, abierta desde el primer análisis: el nombre oficial y
definitivo es **JosStyle**; *JC Fitness*, *JC Lifestyle* y *JC STYLE* quedan como referencias
históricas.

- Renombrado: pantalla de acceso, `<title>`, nombre en la pantalla de inicio de iOS,
  `manifest.json` y el campo `name` de `package.json`. La interfaz, curiosamente, no usaba ninguno
  de los cinco nombres — se presentaba como *"Mi Sistema Personal"*.
- **No** renombrado, y por qué: el proyecto en Vercel y su URL (cambiarlos afecta a cómo entra
  Josué a la app), el `start_url` del manifiesto (desvincularía la PWA instalada de sus datos), las
  citas literales de `especificaciones/` (intocables) y el histórico de este mismo archivo.
- ⚠️ **Efecto que verá Josué:** el icono que ya tiene en la pantalla de inicio del iPhone
  **seguirá con el nombre viejo** hasta que lo borre y lo vuelva a añadir. iOS no renombra accesos
  directos ya creados. No se pierde ningún dato al hacerlo.

### Decisiones de Josué registradas
Sus ocho respuestas quedan en `docs/06_ENTREGA2_ANALISIS.md` §7 como **D2-01 … D2-08**, y resuelven
E2-C-01 (gamificación), E2-C-03 (Amazon), E2-C-05 (contenido educativo), E2-C-06 (parte de Inicio) y
C-21 (nombre). Se añade la **regla 49**: una contradicción nueva entre especificaciones no se
resuelve por cuenta propia — se pregunta, deteniendo la fase afectada y no la sesión.

### Verificación
`bash scripts/verificar.sh` → **205 comprobaciones en verde**: build (2606 módulos), 148 pruebas
unitarias, 5 de auditoría, 52 casos de renderizado y 9 reglas invariantes.

---

## Entrega 2 · ME Fase 3 — Eliminados recientemente (v1.26.0)

### Alcance de esta fase, dicho primero
Una papelera de verdad. Hasta ahora borrar algo lo borraba: existía el deshacer de 10 pasos, pero
es un histórico compartido por toda la app — si borras una tarea y después registras tres cosas
más, ya no puedes recuperarla.

### Por qué es un sistema global y no uno por módulo
La especificación es tajante: *"debe construirse como un sistema global y reutilizable, no como una
solución aislada para los módulos actuales"*. Al revisar los 22 handlers de borrado de `App.jsx`
resultó que **todos seguían exactamente el mismo patrón**:

```js
MODULO.COLECCION.filter((x) => x.id !== id)
```

Así que la papelera se modela sobre esa forma: **módulo + colección + id**. Los 19 handlers de una
línea se han reducido a `eliminarConPapelera('modulo', 'coleccion', id)`. Añadir un módulo futuro
a la papelera es añadir una entrada a `CATALOGO_PAPELERA` — sin tocar el motor ni la interfaz.

### Añadido / cambiado
- **`src/lib/papelera.js`** (nuevo): motor puro. `prepararEliminacion`, `prepararRestauracion`,
  `conArrastrados`, `purgarCaducados`, `describirEntrada`, `tiempoDesde`, `diasRestantes`,
  `ordenarPapelera` + el catálogo de **26 colecciones**.
- **Cada entrada guarda el objeto íntegro**, no una etiqueta de "borrado" (requisito explícito):
  id original, tipo, módulo, colección, fecha de creación, fecha de eliminación, **la posición que
  ocupaba en la lista** y los datos completos. Por eso la recuperación es real: el elemento vuelve
  a su sitio, en su orden y con su id — no se recrea una copia.
- **`src/views/PapeleraView.jsx`** (nuevo) y nueva categoría en Ajustes: lista ordenada por
  cuándo se borró, con tipo, cuánto hace ("hace 2 horas", "ayer", "hace 3 días" — como los
  ejemplos de la especificación) y cuántos días le quedan. Recuperar y eliminar definitivamente
  por elemento, vaciar papelera, y retención configurable.
- **Retención**: 7 / 30 / 90 días o **"hasta que yo lo borre"**. Se aplica al abrir la app y al
  acortar el plazo, y solo escribe si de verdad ha cambiado algo.
- **Borrado en cascada resuelto**: borrar una asignatura se lleva sus exámenes y sus horas. Si la
  papelera guardara solo la asignatura, recuperarla devolvería una asignatura vacía y los exámenes
  se habrían perdido. `conArrastrados` mete en la misma entrada lo que cayó con ella y restaurar
  devuelve las tres cosas (*"recupera sus relaciones cuando sea posible"*).

### Decisiones
- **La papelera entra en el snapshot del deshacer.** Sin eso, deshacer un borrado devolvería el
  elemento a su módulo pero dejaría su entrada en la papelera: un fantasma que al restaurarse
  duplicaría el elemento. Con la papelera dentro, los dos sistemas de recuperación no se pisan.
- **Borrado definitivo y vaciado NO pasan por el deshacer**: meter en el histórico una acción cuyo
  sentido es "esto ya no se puede recuperar" sería contradictorio.
- **Privacidad de Relación.** Es el único módulo protegido de principio a fin, y la papelera se
  abre desde Ajustes sin pedir PIN. Enseñar ahí "Aniversario con María" sería una fuga real. Sus
  entradas se marcan `privado`: bloqueadas se muestran como "Elemento privado" y no se pueden
  restaurar; los datos siguen guardados. Mismo mecanismo (`estaDesbloqueado('area:relacion')`) y
  mismo criterio que ya se aplicó al integrar Relación en el Calendario.
- **Fotos, vídeos y archivos de Biblioteca quedan fuera**, igual que ya estaban fuera del
  deshacer: sus datos viven en Supabase Storage, y mandarlos a la papelera exigiría no borrar el
  archivo, dejando ficheros huérfanos si después se vacía desde otro dispositivo. Documentado como
  límite, no como olvido.
- **Restaurar algo que ya volvió por otra vía no duplica**: la entrada sale igualmente de la
  papelera, para no dejar un fantasma imposible de quitar.

### Comprobado
- **73 pruebas** del motor (`scripts/test-papelera.mjs`): que restaurar devuelve el elemento a su
  posición exacta con todos sus campos y su id original (y que el resultado es **idéntico** al
  estado de partida), el borrado en cascada de ida y vuelta, la retención con fechas corruptas,
  la privacidad de Relación bloqueada y desbloqueada, y los casos límite de restaurar sobre una
  lista que ha encogido o que ya contiene el elemento.
- **52 casos de renderizado**, ahora incluyendo `PapeleraView`.
- Total en verde: 148 comprobaciones + 52 casos.

### Pendiente (documentado, no implementado en esta fase)
- Archivos en Storage (ver Decisiones).
- La auditoría de que **todos** los puntos de borrado de la app pasan por la papelera es
  explícitamente el trabajo de **ME Fase 4** ("integración global + auditoría").
- Sin probar en un iPhone real.


## Entrega 2 · ME Fase 2 — Personalización total (v1.25.0)

### Alcance de esta fase, dicho primero
Cuatro piezas: orden de módulos, Dashboard personalizable, navegación personalizable y perfiles
predefinidos. Más la gestión de dependencias entre módulos.

### Añadido / cambiado
- **`src/tokens.js` → `PERFILES_MODULOS`**: los cuatro perfiles que pide la especificación —
  **Completo**, **Estudiante**, **Fitness** y **Minimalista**. Cada uno declara qué módulos deja
  activos; el resto se desactivan.
- **`src/tokens.js` → `DEPENDENCIAS_MODULOS`**: qué módulos se alimentan de qué otros. Solo se
  modela la dependencia **real de datos**, la que hace que un módulo se quede sin nada que
  mostrar: Estadísticas, Predicciones, Logros y (parcialmente) Calendario.
- **`PerfilesRapidos`**: cuatro tarjetas con confirmación que dice cuántos apartados quedarán
  activos y recuerda que no se borra nada.
- **`MiDashboard`** — "Mi pantalla de inicio": el editor de `dashboardOcultos` que llevaba
  pendiente desde que el Dashboard se amplió a Centro de Control. El modelo y el filtrado ya
  existían; faltaba la interfaz. Solo lista módulos activos: ofrecer un interruptor de "ver en
  Hoy" para algo desactivado sería un control que no hace nada.
- **Aviso de dependencias** dentro de la confirmación de desactivar: si el módulo alimenta a otros
  que están activos, se dice cuáles y que tendrán menos que mostrar. **No se bloquea ni se
  desactiva nada en cascada** — la especificación pide gestionar la dependencia y no dejar la app
  rota, no decidir por el usuario.
- **`src/App.jsx`**: `toggleDashboardModulo` y `aplicarPerfilModulos`. El segundo solo toca
  `ocultos`: el orden, los iconos, el PIN y las métricas favoritas se respetan tal cual — un
  perfil decide QUÉ usas, no cómo lo tienes colocado. Si el perfil desactiva la pestaña abierta,
  se vuelve a "Hoy".

### Decisiones
- **El reordenar se queda con flechas, no con drag & drop.** La especificación pide DnD "cuando
  tenga sentido, especialmente en móvil", pero el apartado 103 de la especificación de Ajustes
  ofrece explícitamente la alternativa: *"interacción directa (drag&drop) **o controles accesibles
  equivalentes**"*. Las flechas ya funcionan, son accesibles por teclado y para lectores de
  pantalla, y no necesitan una librería nueva ni gestos táctiles que compiten con el scroll de la
  página. Documentado como decisión, no como olvido: si Josué prefiere DnD de verdad, es una
  petición concreta y acotada.
- **La navegación principal sigue siendo de 5 pestañas fijas.** La especificación pide "permitir
  que el usuario decida qué módulos aparecen como accesos principales, siempre que sea
  técnicamente viable" — pero la regla de que la barra inferior tiene **exactamente 5 pestañas,
  nunca una sexta** es del propio Josué y se repite en dos prompts distintos. Lo que sí es
  personalizable, y ya lo era, es el contenido de cada hub. Si quiere cambiar eso, es una decisión
  suya que contradice una regla suya: hay que preguntárselo, no resolverlo por él.
- **No se guarda "qué perfil tienes puesto".** En cuanto Josué cambie un solo interruptor esa
  etiqueta sería mentira, y la especificación insiste en que los perfiles no deben bloquear la
  personalización posterior.
- **Las dos listas de ocultación se mantienen separadas**, y la especificación lo respalda
  literalmente: *"Módulo activado ≠ necesariamente visible en Dashboard"*.

### Comprobado
- **28 pruebas** de la lógica de perfiles y dependencias (`scripts/test-personalizacion.mjs`):
  que ningún perfil referencia módulos inexistentes, que ninguno toca "ajustes", que las
  dependencias declaradas existen, que ningún módulo depende de sí mismo, y que el aviso solo
  menciona dependientes que estén activos.
- **4 pruebas nuevas de comportamiento** sobre el HTML: quitar algo de Hoy sin desactivarlo
  funciona, y ambas listas conviven aplicando cada una su efecto.
- Total en verde: 27 + 28 + 20 comprobaciones + 48 casos de renderizado.

### Pendiente (documentado, no implementado en esta fase)
- Drag & drop real para reordenar (ver Decisiones).
- Accesos principales configurables (choca con la regla de las 5 pestañas — decisión de Josué).
- Sin probar en un iPhone real.


## Entrega 2 · ME Fase 1 — Sistema de módulos activables/desactivables (v1.24.0)

### Alcance de esta fase, dicho primero
Primera fase de la Entrega 2. La especificación pide que el usuario decida qué apartados quiere
usar, que desactivar **nunca** borre datos, y que "la interfaz se reconstruya automáticamente según
los módulos activos".

**Análisis primero, como manda la regla de oro de la propia especificación** ("¿esto ya existe en
JC Fitness? → CONECTAR / INTEGRAR / REUTILIZAR / CREAR"): `PersonalizationView` (Fase 19) ya
permitía ocultar módulos con `personalizacion.ocultos`. Así que **no se ha creado un sistema
paralelo**: se ha ampliado el existente. Lo que faltaba de verdad no era el modelo de datos, era
que ocultar **hiciera algo más allá de los hubs**.

### El hueco real que se ha cerrado
`personalizacion.ocultos` solo se consultaba en `HubView`. Un módulo "desactivado" seguía
apareciendo en "Hoy" con su tarjeta, su aviso y su acción rápida. El Dashboard tenía además su
propia lista (`dashboardOcultos`), sin editor. Es decir: dos sistemas de ocultación y ninguno
completo.

Ahora hay una distinción clara entre dos cosas que un usuario quiere poder hacer por separado:
- **`personalizacion.ocultos`** — "no uso este apartado". Afecta a TODA la app.
- **`dashboardOcultos`** — "sí lo uso, pero no quiero verlo en Hoy". Preferencia de pantalla.

### Añadido / cambiado
- **`src/components/ui.jsx`**: nuevo `Switch` — interruptor ON/OFF accesible (`role="switch"`,
  `aria-checked`, navegable por teclado). El apartado 8 de la especificación de Ajustes lo lista
  como componente permitido y el apartado 14 exige que una misma configuración se represente
  siempre igual; hasta ahora cada sitio resolvía el activado/desactivado a su manera.
- **`src/tokens.js`**: `DESCRIPCIONES_MODULOS` — una descripción por módulo, ≤80 caracteres,
  describiendo el efecto y no cómo se usa el control (apartado 11).
- **`src/views/PersonalizationView.jsx`**: nuevo `CentroModulos` — "Personalizar mi sistema",
  agrupado por las cuatro áreas que ya existen en la barra inferior (no se inventa una taxonomía
  nueva). Cada fila: icono, nombre, descripción e interruptor. Contador de activos.
  Confirmación al desactivar que insiste en que **no se borra nada**; ninguna al reactivar.
- **`src/views/PersonalizationView.jsx`**: retirado el botón de ojo de la lista de reordenación —
  tener dos controles distintos para la misma configuración es justo lo que prohíbe el apartado 14.
  Esa lista se queda con lo suyo: orden, icono y PIN. Los desactivados se marcan con una etiqueta.
- **`src/views/DashboardView.jsx`**: `oculto(id)` consulta ahora las dos listas. Se filtran las
  tarjetas de Nivel 1/2/3, los tres avisos automáticos, el acceso a Calendario y Agenda, el
  recordatorio de Relación y las acciones rápidas (que pasan a ser un catálogo filtrable; si no
  queda ninguna, desaparece también el encabezado).
- **`src/lib/puntuacion.js`**: acepta la lista de desactivados. Si Josué ha dicho que no usa Sueño,
  que le baje la nota por no registrarlo sería exactamente lo contrario de lo que pidió.
- **`src/App.jsx` / `src/views/SettingsView.jsx`**: `AREAS_NAV` y `personalizacion.ocultos` se
  reenvían a donde hacen falta.

### Decisiones
- **Ampliar en vez de crear**, siguiendo la regla de la propia especificación. El modelo de datos
  (`personalizacion.ocultos`) no cambia: cualquier cuenta existente sigue funcionando sin migración.
- **Agrupado por las áreas ya existentes** en vez de por las categorías del ejemplo de la
  especificación (Salud/Deporte/Productividad): son las que Josué ya conoce de navegar la app, y
  además el script `comprobar-navegacion.mjs` ya garantiza que ese reparto es completo y sin
  duplicados.
- **"Ajustes" nunca es desactivable** — `moreNavPersonalizables` ya lo excluía. Sin él, Josué no
  tendría forma de volver a activar lo que desactivó.
- **Relación se puede desactivar, pero eso no la desprotege**: desactivar y proteger con PIN son
  cosas distintas. Con Relación desactivada, además, deja de asomar el recordatorio de la pareja
  en la pantalla principal.

### Comprobado
- **16 pruebas de comportamiento** (`scripts/test-modulos.jsx`) sobre el HTML realmente renderizado:
  que lo desactivado desaparece, que lo demás sigue ahí, que desactivarlo todo no rompe nada ni
  deja encabezados huérfanos, que renderizar no muta los datos, y que todas las descripciones
  existen y respetan el límite de 80 caracteres.
- **48 casos de renderizado** (`scripts/smoke.mjs`), ahora con un cuarto escenario: "todo
  desactivado".
- Build limpio, y las nueve reglas invariantes del proyecto en verde.

### Pendiente (documentado, no implementado en esta fase)
- **Buscador universal**: sigue buscando sobre datos, no sobre funciones. Filtrar funciones de
  módulos desactivados corresponde a **BI Fase 3**, que es donde se construye el índice.
- **Menú lateral**: la especificación lo menciona, pero esta app no tiene (navega con 5 pestañas
  y hubs). No aplica.
- Sin probar en un iPhone real.


## Bloque R0 — Correcciones críticas y verificación automática (v1.23.0)

### Alcance de esta fase, dicho primero
Primer turno con **acceso real a npm** en el entorno de desarrollo. Eso cambia una premisa que
llevaba vigente desde la v1.0.1: ya no es cierto que "Claude solo pueda revisar el código a mano".
`npm install` y `npm run build` funcionan, y **el proyecto compila sin errores (2604 módulos)** —
la primera verificación real en 22 incrementos de versión. Sobre esa base se han corregido las tres
incoherencias críticas del bloque R0 y se ha construido una suite de verificación reutilizable.

### Verificación automática (`scripts/`, nuevo)
- **`verificar.sh`** — build + pruebas + nueve reglas invariantes del proyecto, que hasta ahora se
  comprobaban a mano fase a fase: nadie desestructura `COLORS`, ningún hex suelto fuera de
  `tokens.js`, todo overlay `fixed inset-0` con `createPortal`, sin notas internas de desarrollo
  visibles, `relacion` fuera de la exportación, PIN de Relación intacto, exactamente 5 pestañas,
  navegación coherente, y **todo ajuste de Apariencia con efecto CSS real**.
- **`smoke.mjs` + `smoke-vistas.jsx`** — renderizan 11 vistas con `react-dom/server` en tres
  escenarios: vacío, con datos y **datos parciales** (campos que faltan, como los que dejaría una
  versión anterior). 33 casos. Compilar no detecta un `undefined.map()`; esto sí.
- **`test-puntuacion.mjs`** — 22 comprobaciones de la puntuación nueva.
- **`resolver-vite.mjs`** — hook de resolución que permite ejecutar con Node los módulos de `src/`
  tal y como están escritos (imports sin extensión), sin cambiar la convención del proyecto.
- **`comprobar-navegacion.mjs`** — cruza `MORE_NAV`, `AREAS_NAV` y los `case` del switch para
  detectar módulos huérfanos (navegables sin pantalla, o pantallas inalcanzables).

### R0.1 — Modelo de IA obsoleto (`api/ask-ai.js`)
- `model: 'claude-sonnet-4-6'` ya no existe. En cuanto Josué activara `ANTHROPIC_API_KEY`, habrían
  fallado **las 13 secciones con `AIPanel`, el buscador universal, el panel de sugerencias, el
  escaneo de comida por foto y el análisis de vídeo de calistenia** — y el síntoma habría sido un
  genérico "la IA no funciona", sin pista de la causa. Había pasado desapercibido precisamente
  porque la clave nunca se ha activado: la función devuelve `503` antes de llamar a Anthropic.
- El modelo se lee ahora de `ANTHROPIC_MODEL` (por defecto `claude-sonnet-5`), así que cambiarlo
  no exige tocar código ni volver a subir el proyecto: se cambia en el panel de Vercel.
- Un `404` de modelo devuelve un mensaje que dice exactamente qué pasa y dónde arreglarlo.

### R0.2 — Puntuación diaria (`src/lib/puntuacion.js`, nuevo)
- La fórmula anterior vivía suelta en `DashboardView` y sumaba puntos por tener datos *alguna vez*:
  `sueno[último]`, `nivel > 0`, `movimientos.length > 0`. Ninguna miraba la fecha. Resultado: en
  cuanto había un dato de cada, **se quedaba en 100 para siempre** mientras la etiqueta decía
  "Puntuación de hoy". Era un dato falso en la pantalla principal.
- Ahora es el **porcentaje de las áreas que Josué realmente usa que ha registrado hoy**. Un área
  solo entra en el cálculo si ya tiene datos, así que no penaliza por módulos que no utiliza —
  mide constancia real, no cuántos módulos tiene abiertos.
- Ocho áreas: Sueño (acepta el registro de anoche), Entrenamiento, Nutrición, Hábitos (exige
  marcarlos todos), Tareas vencidas, Diario, Estudio y Salud (ventana de 7 días, no diaria).
- Desplegable para ver **de dónde sale cada punto** — misma regla de honestidad que rige los
  paneles de IA. Sin datos todavía, no muestra un 0 desmotivador: lo dice y ya está.
- Sin puntos acumulables, sin niveles, sin monedas: se reinicia sola cada día y no se guarda en
  ningún sitio (reglas 33/34, no sobregamificar).
- Cierra el TODO heredado de la sección 18 del HANDOFF ("revisar si la puntuación diaria debería
  basarse en el día calendario real") y una de las dos piezas que la Fase 20 dejó sin construir.

### R0.3 — Densidad de interfaz (`src/index.css`, `src/App.jsx`)
- Situación de partida: `tokens.js` afirmaba en un comentario que ya funcionaba, `index.css` no
  tenía **ni una sola regla** `data-densidad`, y la propia interfaz le decía a Josué que las tres
  densidades se veían igual. Un comentario del código mintiendo es peor que la función faltante:
  la siguiente sesión se fía de él y da el apartado 91 por cerrado.
- Implementada de verdad con el mismo mecanismo de override global por atributo que ya usaban los
  radios de borde desde la Fase A3. Se ajustan el ritmo vertical entre tarjetas (`space-y-*`) y el
  relleno interior (`p-5`/`p-4`).
- **No se tocan `gap-*` a propósito**: el gap afecta también al eje horizontal y cambiarlo puede
  hacer que una fila de píldoras o una rejilla de 2 columnas se parta distinto según el contenido.
  El objetivo es cambiar la sensación de aire, no arriesgar el layout.
- "Estándar" no lleva override: es exactamente lo que la app ya era.

### Cinco bugs reales encontrados por las pruebas nuevas
Ninguno se habría detectado compilando. Los cinco dejaban pantallas en blanco o mostraban datos
falsos:
1. **`calcularDuracion()`** reventaba con un registro de sueño sin horas y dejaba en blanco
   **cuatro** pantallas a la vez (Hoy, Sueño, Estadísticas y las tarjetas de hub). Ahora devuelve
   `null`, y hay un `formatHoras()` compartido que lo presenta como "— h".
2. **`AvisoSuenoCorto`** mostraba "null h" y **disparaba una notificación real** por un dato
   inexistente: en JavaScript `null < 7` es `true`.
3. **Las dos correlaciones de sueño** contaban un registro incompleto como noche corta, falseando
   el resultado entero.
4. **La media de `SleepView`** se volvía `NaN` con un solo registro incompleto.
5. **`DiaryView`** cargaba la entrada guardada sin fusionarla con el formulario vacío; una entrada
   incompleta hacía reventar el `.trim()` y dejaba el Diario en blanco. Corregido con el patrón
   `{ ...DEFAULT, ...guardado }`, el mismo que ya se aplicó en A2, A3 y en el Dashboard.

### Saneado documental (R0.4 / R0.5 / R0.6)
- **Fase A7 registrada** (ver la entrada de abajo): existía en el código y en ningún changelog.
- **`HANDOFF.md`**: las secciones 3, 5, 9, 10, 11, 13 y 15 describían el estado en v0.21.0/v1.0.0 y
  contradecían los banners de arriba — decían que la Fase 20 estaba pendiente y que la navegación
  era `PRIMARY_NAV` + hoja "Más", eliminada en la Fase N1. Corregidas o marcadas con un aviso que
  remite a `docs/`.
- **`personalizacion.pinExtra`** marcado explícitamente como **vestigial**: ya no se escribe nunca,
  solo se lee una vez durante la migración a `seguridad.protectedAreas`. Se conserva porque
  borrarlo dejaría sin migrar a las cuentas que aún no lo hayan hecho.

### Añadido lo que faltaba en el repositorio
- **`.gitignore`** y **`.env.example`** solo existían dentro del zip, no versionados. Sin el
  primero, `node_modules/` (193 paquetes) y `dist/` eran candidatos a acabar en el repositorio.
- `.env.example` documenta ahora también `ANTHROPIC_MODEL`.

### Pendiente (documentado, no implementado en esta fase)
- Sigue sin probarse en un iPhone real: renderizar con `react-dom/server` detecta errores de
  ejecución, pero no layout, ni gestos, ni Safari.
- La segunda pieza que la Fase 20 dejó sin construir — la **revisión automática semanal/mensual/
  anual** — sigue pendiente (bloque R4.2).

## Fase A7 — Accesibilidad, paletas predefinidas y densidad (registrada retroactivamente)

> **Esta fase se construyó pero nunca se registró.** El código la cita seis veces (`tokens.js`
> líneas 58, 137, 141, 150 y 158; `GestionTemas.jsx` línea 10), pero no existía ninguna entrada en
> este archivo y `HANDOFF.md` declaraba que el bloque Ajustes "se cierra con A1-A6". Se documenta
> ahora para que una auditoría futura de qué apartados de Ajustes están cubiertos no dé un
> resultado equivocado.

### Añadido / cambiado
- **Alto contraste** (apartado 43, Accesibilidad): `apariencia.altoContraste` +
  `CONTRASTE_ALTO_OSCURO`/`CONTRASTE_ALTO_CLARO` en `tokens.js`. Solo ajusta `textMuted` y `border`
  — deliberadamente conservador, para no rehacer la paleta entera.
- **Paletas predefinidas** (apartado 86): las 7 originales de `PALETAS_PREDEFINIDAS`, ampliadas
  después a 10 en la Fase V4 con Monocromático, Neón y Pastel.
- **Densidad de interfaz** (apartado 91): la opción y su modelo de datos. ⚠️ **Nunca llegó a tener
  efecto visual** — se completó en el bloque R0 (v1.23.0), ver arriba.


## Finalización del Calendario + eliminación de notas internas (v1.22.0)

### Alcance de esta fase, dicho primero
Dos frentes pedidos en el mismo turno, uno de limpieza y otro de funcionalidad real. Primero, una auditoría completa de toda la interfaz en busca de texto dirigido a un desarrollador (menciones a "Fase X", "apartados X-X", "queda pendiente", "todavía no está construido"...) que se hubiera colado en pantallas que sí ve Josué — encontrado sobre todo en Ajustes, acumulado fase a fase. Segundo, cerrar el Calendario de verdad: que una fecha importante de Relación (empezando por el caso estrella, un cumpleaños) pueda marcarse "repetir cada año" y aparecer sola, cada año, en el Calendario — sin duplicar el dato de Relación y sin romper la única protección de privacidad de principio a fin que tiene la app.

### Auditoría y limpieza de notas internas (`src/views/SettingsView.jsx`, `src/views/WellbeingView.jsx`)
- Eliminado el componente `ComingSoon` y su único uso (un aviso "Todavía no está construida. Está planificada para..." que se mostraba para cualquier categoría de Ajustes sin `listo: true`) — ya no queda ninguna categoría en ese estado, así que el propio componente ha desaparecido en vez de quedarse sin usar.
- `useCategorias()`: retiradas las categorías "Inteligencia Artificial" y "Funciones experimentales" — la primera es AXION, una iniciativa aparte con su propia especificación de más de 1.000 apartados, sin sitio real en esta fase del Calendario; la segunda nunca llegó a tener contenido concreto que mostrar. "Accesibilidad" pasa de `listo: false` a `listo: true, soloInfo: true` (mismo patrón que Preferencias/Sincronización/Integraciones) con un aviso real, no un "todavía no": el tamaño de texto, reducir movimiento y el alto contraste ya viven en Apariencia desde antes, así que aquí solo se redirige.
- Cinco bloques `InfoOnly` que citaban literalmente "apartados X-X de la especificación" (en Apariencia, Seguridad y Privacidad) eliminados por completo — describían huecos de construcción interna, no información que Josué necesite dentro de la propia app. El resto de `InfoOnly` (qué usa la IA, permisos del dispositivo, idioma/zona horaria, notificaciones, sincronización, integraciones) se han mantenido pero reescrito quitando referencias a fases/apartados y frases de "queda pendiente" — la información honesta sobre limitaciones reales de la app (ej. "no hay Web Push todavía") se conserva, solo se ha quitado el lenguaje de hoja de ruta interna.
- `WellbeingView.jsx`: el aviso bajo el formulario de Tiempo de Uso pasó de "la importación automática... queda pendiente" (suena a una función a medio construir) a explicar el motivo real y permanente — un navegador no puede leer el tiempo de uso del sistema operativo, así que el registro manual no es una limitación temporal de esta fase, es cómo va a funcionar siempre.

### Calendario — fechas recurrentes de Relación (`src/tokens.js`, `src/views/RelationView.jsx`, `src/lib/calendarioIntegracion.js`, `src/App.jsx`)
- **`tokens.js`**: cada fecha de `relacion.fechas` gana dos campos opcionales — `tipo` (`cumpleanos`/`aniversario`/`fecha_importante`/`otro`, con su emoji, nueva constante `TIPOS_FECHA_RELACION`) y `repetir` (booleano). Las fechas ya guardadas antes de esta fase no los tienen y se tratan como `tipo: 'otro'`, `repetir: false` — no se migra nada solo: activar la repetición es una decisión que Josué toma al editar cada fecha.
- **`RelationView.jsx`**: la pestaña Fechas gana un selector de Tipo y un interruptor "Repetir cada año" (mismo lenguaje visual que el interruptor "Todo el día" del editor de eventos del Calendario) en el formulario de alta, y — novedad real de esta fase — edición: cada fecha ya guardada tiene ahora un botón de editar además del de borrar, que reabre el mismo formulario con sus datos, en vez de solo poder borrarla y crearla de cero. La pestaña "Días especiales" (presets como Cumpleaños/Aniversario) también gana el interruptor de repetición, activado por defecto al elegir un preset (son fechas que por naturaleza vuelven cada año), editable antes de confirmar.
- **`calendarioIntegracion.js`**: nueva `eventosDeRelacion(relacion)`, sumada a `eventosDerivados()` junto a Objetivos/Estudios/Entrenamiento/Productividad. Cada fecha con `repetir: true` se convierte en un evento derivado con `recurrencia: { frecuencia: 'anual', hasta: null }` — se reutiliza tal cual el motor de recurrencia que ya tenía el Calendario para sus propios eventos manuales (`expandirRecurrentes`, Fase 3 del Calendario Universal), que ya se aplica indistintamente a eventos propios y derivados, así que no hace falta tocar `CalendarView.jsx` ni `lib/calendario.js` para nada de esto. El título del evento se genera en el momento ("🎂 Cumpleaños de {nombre}" para cumpleaños, emoji+etiqueta para el resto) a partir del nombre ya guardado en `relacion.nombre` — nunca se guarda el nombre por segunda vez.
- **Privacidad**: `App.jsx` solo le pasa los datos reales de `relacion` a `eventosDerivados()` cuando Relación está desbloqueada en la sesión actual (`estaDesbloqueado('area:relacion')`, la misma comprobación que ya protege la propia pestaña) o cuando no hay ningún PIN configurado; si no, pasa `null` y ninguna fecha de Relación llega al Calendario ni al Dashboard — ni siquiera el indicador discreto del día. Esto sustituye la exclusión total que tenía Relación desde la Fase 2 del Calendario Universal por una inclusión condicionada a la misma autorización que ya existía, en vez de inventar un segundo sistema de permisos.
- **`App.jsx`**: nuevo `updateFechaImportante` (mismo patrón `snapshotAndSave` que el resto de módulos de datos), cableado a `RelationView` como `onUpdateFecha`.
- Tocar el evento derivado de un cumpleaños en el Calendario abre su detalle de solo lectura (mismo componente `DetalleEventoDerivado` que ya usan Objetivos/Estudios/Entrenamiento/Productividad, con "relacion" añadido a `NOMBRES_ORIGEN`) con un botón "Abrir en Relación" — como Relación solo modela una persona (la pareja), abrir Relación desde ahí ya es "acceder a la información de esa persona", sin necesidad de una pantalla de perfil nueva.

### Decisiones
- **No se ha construido un sistema de múltiples personas/contactos en Relación.** La especificación describe el caso con el nombre "María" como si Relación pudiera tener varias personas, pero el modelo de datos real (y toda la app hasta ahora) modela una sola relación de pareja (`relacion.nombre`, un único string). Construir un sistema de contactos con altas/bajas de personas sería una ampliación de alcance no pedida explícitamente ("finalizar el Calendario", no "convertir Relación en una agenda de contactos") y con implicaciones de privacidad propias que no se han evaluado. Se ha tratado a la única pareja ya modelada como "la persona" del caso de uso — cumple el mismo recorrido descrito (crear/nombrar, añadir cumpleaños, repetir, ver en Calendario, abrir su info) sin inventar una estructura de datos nueva.
- **Editar o eliminar una fecha recurrente afecta a toda la serie**, igual que ya pasaba con los eventos recurrentes propios del Calendario (Fase 3): como la recurrencia se calcula al vuelo a partir de una única fecha ancla (nunca se guarda una copia por año), cambiar esa fecha o borrar la entrada de Relación cambia o hace desaparecer automáticamente todas las ocurrencias, pasadas y futuras, sin ningún código adicional de limpieza.
- **La arquitectura queda preparada para que otros módulos generen fechas del calendario** (Estudios→exámenes ya lo hace desde la Fase 2; Entrenamiento→sesiones, Economía→pagos, Productividad→tareas y Objetivos→plazos, también) — `eventosDerivados()` ya combina varias fuentes con la misma forma, así que sumar una nueva fuente futura es exactamente el mismo patrón que `eventosDeRelacion`, sin tocar `CalendarView.jsx`.

### Pendiente (documentado, no implementado en esta fase)
- No se ha podido probar en un navegador real el recorrido completo (crear cumpleaños → verlo en el Calendario → editarlo → borrarlo → recargar) — se ha verificado leyendo el código paso a paso contra el motor de recurrencia y las condiciones de privacidad ya existentes, no ejecutando la app.
- No se ha podido verificar con `esbuild` en este entorno (sin acceso al registro de npm, `403`, mismo límite de siempre) — revisado a mano: balance de paréntesis/llaves/corchetes comprobado por script en los seis archivos tocados (OK; una comprobación adicional en `LibraryView.jsx`, sin tocar en esta fase, dio un falso positivo del propio script por un literal de expresión regular con barras escapadas — se ha revisado el archivo entero a mano y está bien formado).

## Ajuste del indicador de contexto + acceso directo a Agenda (v1.21.0)

### Alcance de esta fase, dicho primero
Dos ajustes puntuales sobre el Dashboard ampliado de la fase anterior, pedidos en el mismo turno pero con motivos distintos: (1) el indicador de Viaje/Vacaciones/Exámenes (`ModoBanner`) ocupaba demasiado alto cuando había un modo activo — Josué pidió conservar la función tal cual pero convertirla en un indicador compacto y expandible; (2) un "paréntesis" pidiendo que la Agenda (el toggle Mes/Agenda que ya vive dentro del Calendario desde la Fase 3) tenga también su propio acceso directo de un solo toque desde "Hoy", independiente del acceso a Calendario, sin duplicar navegación.

### Añadido / cambiado
- **`src/views/DashboardView.jsx`**: `ModoBanner` (bloque siempre visible con 2-4 líneas de consejos) sustituido por `IndicadorContexto` — un componente tipo acordeón: cerrado por defecto, icono+etiqueta+flecha en una sola línea (mismo alto que el resto de filas compactas del Dashboard), que se expande in-place al pulsarlo mostrando los consejos del modo activo, con una transición real de altura+opacity (técnica `grid-template-rows` 0fr↔1fr, sin medir nada a mano ni añadir dependencias) y la flecha rotando 180°, mismo patrón que ya usan `SkillCard`/`RutinaCard`/`AsignaturaCard`/`ExamenItem` en el resto de la app. A diferencia del antiguo `ModoBanner` (que desaparecía del todo sin modo activo), `IndicadorContexto` está siempre visible — "Rutina normal" (icono `Home`) es un estado más, no la ausencia del componente. Nuevos iconos por modo: `Plane` (Viaje, ya se usaba), `Sun` (Vacaciones), `GraduationCap` (Exámenes, reutilizado del icono de Estudios).
- **`src/views/DashboardView.jsx`**: `AccesoCalendario` (una sola fila ancha) sustituido por `AccesoCalendarioYAgenda` — dos tarjetas compactas en la misma fila (rejilla de 2 columnas, mismo alto total que antes): "Calendario" (resumen de hoy, sin cambios de fondo) y "Agenda" nueva, con el número de eventos de hoy ("N cosas pendientes hoy" / "Nada pendiente hoy"). Tocar "Agenda" navega directamente a la vista Agenda ya existente dentro de `CalendarView.jsx`, sin pasar primero por la vista Mes.
- **`src/views/CalendarView.jsx`**: acepta `foco`/`onFocoConsumido` (mismo mecanismo de deep-link de la fase anterior) — `foco.vista === 'agenda'` cambia el `ToggleTab` Mes/Agenda que ya existía desde la Fase 3, sin tocar su lógica interna ni duplicarla.
- **`src/App.jsx`**: la llamada a `CalendarView` en `renderContent()` recibe ahora `foco={focoPara('calendario')}`/`onFocoConsumido={consumirFoco}`, igual que las demás vistas de destino. `onAbrirCalendario` (prop que solo hacía `setTab('calendario')`, ya redundante desde que `DashboardView` recibe `onNavegar`) se retira de la llamada a `DashboardView` — la propia tarjeta de Calendario ya usa `onNavegar('calendario')` directamente.

### Decisiones
- **Agenda no es un módulo de datos nuevo ni una pestaña nueva** — sigue siendo exactamente el mismo toggle Mes/Agenda de `CalendarView.jsx` (Fase 3 del Calendario Universal), con los mismos eventos, el mismo motor (`expandirRecurrentes`, tope de 50 eventos/60 días). Lo único nuevo es el punto de entrada: antes hacía falta tocar Calendario y luego el interruptor interno a mano; ahora "Hoy → Agenda" aterriza ya en esa vista de un solo toque, vía el mismo `foco` que usa el resto del Dashboard. Esto cumple a la vez "Dashboard → Agenda debe ser un acceso directo" y "no crear navegación paralela / no duplicar Agenda dentro de Calendario" — no hay dos implementaciones de Agenda, hay dos puertas a la misma.
- **El contenido expandido del indicador de contexto muestra los consejos ya existentes (`MODOS_APP[].tips`), no fechas ni "objetivos adaptados" inventados** — la especificación pedía como ejemplo ilustrativo mostrar fechas de viaje/vacaciones y un recuento de objetivos adaptados, pero el modelo de datos de `MODOS_APP` (tokens.js) nunca ha tenido esos campos, solo `id`/`label`/`tips` de texto fijo. Añadirlos habría exigido una pantalla de captura nueva (fechas, qué objetivos se "adaptan" y cómo) — alcance no pedido explícitamente y contrario a "conserva la funcionalidad actual, modifica su presentación". Se ha preferido mostrar honestamente lo que ya existe.
- **No se ha añadido un botón "Ver detalles"** (previsto en la propia especificación "si en el futuro hay mucha más información") — con 2-3 consejos de texto no hace falta resumir todavía; el propio indicador ya muestra el contenido completo al expandirse. Queda documentado como extensión futura directa si `MODOS_APP` crece.
- **Verificación de los iconos nuevos**: antes de usar `Sun`/`ClipboardList` (no usados en ningún sitio anterior de esta app) se comprobó contra la documentación pública de Lucide que ambos son nombres estables desde versiones muy anteriores a la `0.383.0` que usa este proyecto (sin acceso a `npm`/`node_modules` en este entorno para comprobarlo instalando el paquete de verdad) — evitado a propósito `Palmtree`, que resultó ser un alias antiguo renombrado a `TreePalm` en versiones intermedias de Lucide, para no arriesgar un import roto.

### Pendiente (documentado, no implementado en esta fase)
- No se ha podido verificar con `esbuild` en este entorno (sin acceso al registro de npm, `403`, mismo límite de siempre) — revisado a mano: balance de paréntesis/llaves/corchetes por script en los tres archivos tocados (OK).
- No se ha podido comprobar visualmente la animación de expansión (altura+opacity) en un navegador real — la técnica CSS usada (`grid-template-rows` 0fr↔1fr) es un patrón estándar y ampliamente documentado, pero su aspecto final no se ha podido renderizar en este entorno.

## Ampliación del Dashboard — Centro de Control interactivo (v1.20.0)

### Alcance de esta fase, dicho primero
Josué pidió que "Hoy" deje de ser un simple resumen y se convierta en un Centro de Control: ver de un vistazo el estado de (casi) cualquier área de la app y, sobre todo, poder pulsar cualquier elemento representado ahí para llegar directo a él — incluido, siempre que sea técnicamente posible, el elemento concreto (un objetivo, una habilidad, un examen, una tarea), no solo el módulo. Especificación propia de 23 apartados, con una regla de oro explícita: "no quiero tarjetas bonitas que no hagan nada". **Análisis primero, tal y como pedía el apartado 23** ("no inventes rutas, componentes o funcionalidades que ya existan con otro nombre"): se releyó `App.jsx` entero (navegación por `tab`/`setTab`, sin ningún router de verdad — confirmado, nada que sustituir), `DashboardView.jsx` tal y como quedó tras la fase de compactación anterior, y `resumenesHub.js` — que ya calculaba, módulo por módulo, exactamente el resumen de dos líneas + estado que los hubs de "Más" llevan usando desde la Fase N1, así que gran parte de las tarjetas de Nivel 2 de esta fase lo reutilizan tal cual, sin duplicar ningún cálculo.

### El mecanismo de deep-link, sin router paralelo
`App.jsx` añade un único estado nuevo, `dashboardFoco` (`{ modulo, id/skill/examenId/tareaId/accion, ... }`), y una única función de navegación, `navegarDesdeHoy(modulo, foco)`, que por dentro sigue siendo `setTab(modulo)` — el mismo mecanismo de navegación que ya existía, ampliado con "y opcionalmente, esto es lo que quiero ver dentro". `focoPara(modulo)` filtra ese estado para que cada vista de destino solo reciba el suyo, nunca la forma interna de las demás. Cada vista que sabe interpretarlo (Sueño, Entreno, Objetivos, Estudios, Productividad, Economía) lo consume una única vez — hace scroll hasta el elemento, lo resalta brevemente o abre el formulario correspondiente — y llama a `onFocoConsumido()`, que limpia el estado: volver a esa pestaña después por la navegación normal no vuelve a saltar sola al mismo sitio.

### Añadido / cambiado
- **`src/components/ui.jsx`**: tres primitivas nuevas — `DashboardModuleCard` (tarjeta pulsable con icono, valor destacado, línea secundaria y estado vacío honesto, apartado 12), `MiniAccessCard` (acceso compacto de solo icono+etiqueta para los módulos de Nivel 3) y `QuickActionButton` (píldora con icono en círculo, deliberadamente distinta de una tarjeta para que se note que abre un formulario y no navega a mirar un resumen, apartado 13/14). `Card` acepta ahora un `id` opcional (para el scroll-to-element del deep-link), cambio aditivo que no afecta a ningún uso existente.
- **`src/views/DashboardView.jsx`** reescrita con tres niveles de información nuevos, tal y como pedía el apartado 9, todos en rejillas compactas (2 o 3 columnas, nunca una tarjeta grande por fila, apartado 8):
  - **Nivel 1** (rejilla 2×2): Sueño, Entreno (con la habilidad de calistenia entrenada más recientemente o de mayor progreso — deep-link directo a ella, apartado 6), Objetivos (con el primer objetivo sin cumplir — deep-link a ese objetivo exacto, apartado 4) y Estudios (con el examen más próximo — deep-link a él).
  - **Nivel 2** (rejilla 2×2): Economía y Nutrición (reutilizan `calcularResumenModulo` de `resumenesHub.js`, sin cálculo nuevo), Productividad (con la tarea pendiente más próxima — deep-link a ella) y Salud (peso más reciente + IMC, misma fórmula exacta que ya usa Ajustes → Perfil → Cálculos corporales).
  - **Nivel 3**: fila de 6 mini-accesos de solo icono (Diario, Negocio, Relación, Biblioteca, Fe, Bienestar) — sin resumen de datos a propósito, para que Relación (protegida por PIN) nunca se asome fuera de su propia pantalla.
  - Las métricas favoritas (Fase 19) ahora también son pulsables — cada una navega a su módulo de origen.
  - Nueva fila **"Acciones rápidas"**: Sueño, Gasto, Tarea y Objetivo — cada botón navega y abre directamente el formulario de alta correspondiente (mismo formulario de siempre en cada vista, nunca uno duplicado), separada visualmente de las tarjetas para no mezclar "pulsar para ver" con "pulsar para crear" (apartado 13/14).
- **Deep-link consumido en seis vistas de destino**, cada una con el mínimo cambio necesario, reutilizando siempre su propio estado/UI ya existente:
  - `SleepView.jsx`/`FinanceView.jsx`: `foco.accion` abre el formulario de alta que ya tenían (`showForm`).
  - `ObjectivesView.jsx`: `foco.id` hace scroll y resalta 2,2s el objetivo con un halo del color de acento; `foco.accion === 'nuevo'` hace scroll al campo y lo enfoca.
  - `TrainingView.jsx`: `foco.skill` cambia a la subpestaña Calistenia y la `SkillCard` de esa habilidad se autoexpande y hace scroll — cada tarjeta decide esto sola (mismo criterio que la rejilla 2×2 de la fase anterior), sin levantar el estado de las 7.
  - `EstudiosView.jsx`: `foco.examenId` cambia al programa correcto, despliega la `AsignaturaCard` que contiene ese examen y el propio `ExamenItem` se despliega y hace scroll — tres niveles de componentes anidados coordinados con un único id.
  - `ProductivityView.jsx`: `foco.sub` cambia de subpestaña; dentro de Tareas, `foco.tareaId` resalta la tarea y `foco.accion === 'nueva'` enfoca el campo de alta.
- **`tokens.js`**: `DEFAULT_PERSONALIZACION` gana `dashboardOcultos: []` — arquitectura preparada para un futuro editor en Ajustes que decida qué módulos mostrar en el Dashboard (apartado 10/11: "la arquitectura debe quedar preparada... no significa que haya que implementar obligatoriamente un editor completo en esta fase"). `DashboardView.jsx` ya filtra por esta lista con una única función (`oculto(id)`) — activar el editor en el futuro es solo construir la UI que la rellene, sin tocar el resto del Dashboard.

### Decisiones
- **No se ha inventado ningún dato que no exista**: la Economía de la app no tiene un "objetivo de ahorro" como estructura propia (solo saldo/hucha/movimientos) — el apartado 6 lo menciona como ejemplo, pero crear esa función sería alcance nuevo no pedido explícitamente; la tarjeta de Economía enlaza al módulo, no a un objetivo que no existe. Mismo criterio con Nutrición: la app evita deliberadamente objetivos calóricos estrictos desde la Fase 21 ("aconseja, no decide") — la tarjeta muestra los totales de hoy, nunca un "% de un objetivo" inventado.
- **El deep-link resalta y hace scroll, no abre una pantalla de detalle nueva**: ninguno de los módulos (Objetivos, Productividad) tenía una vista de "un solo elemento" antes de esta fase, y crearlas habría sido una reconstrucción, no una ampliación (apartado 23: "no quiero una reconstrucción completa"). Entreno y Estudios sí tienen un patrón de acordeón ya existente (`SkillCard`, `AsignaturaCard`/`ExamenItem`) — ahí el deep-link lo abre directamente, que es más fiel todavía al espíritu del apartado 6.
- **PIN y deep-link conviven sin caso especial**: si un módulo de destino está protegido y el `PinGate` todavía no está desbloqueado, el componiente de deep-link ni siquiera se monta (`PinGate` solo renderiza a sus hijos cuando `desbloqueado` es true) — el foco pendiente simplemente espera y se aplica en cuanto Josué mete el PIN, sin ningún código extra para este caso.
- **La corrección de compatibilidad de `personalizacion`, hecha a la vez**: `App.jsx` cargaba `personalizacion` sin fusionarla con su valor por defecto (a diferencia de notificaciones/historialColor/temaPersonalizado, que sí lo hacen) — un registro guardado antes de esta fase se habría quedado con `dashboardOcultos` en `undefined`. Corregido con el mismo patrón `{ ...DEFAULT_PERSONALIZACION, ...pers }` que ya usan los demás.
- **"Hoy" ahora puede necesitar algo de scroll** — dicho con honestidad, porque la fase anterior (Optimización de navegación y scroll) pedía justo lo contrario en las pantallas principales. Este pedido nuevo es explícito y describe su propia jerarquía de 3 niveles reconociendo que "más posibilidades" implica más contenido; el propio apartado 20 lo anticipa ("si hay demasiados módulos, prioriza, permite personalización, usa una sección Más") — se ha mantenido cada tarjeta lo más compacta posible (rejillas, mini-accesos de un renglón) para minimizar ese scroll, y `dashboardOcultos` deja la puerta abierta a que Josué recorte el Dashboard a lo que de verdad usa en cuanto exista el editor.

### Pendiente (documentado, no implementado en esta fase)
- **Editor real de qué módulos mostrar en el Dashboard** (apartado 10): el modelo de datos (`dashboardOcultos`) y el filtrado ya existen; falta la UI en Ajustes que lo rellene — mismo patrón exacto que "Pantalla principal" (Fase 19), se podría añadir como una categoría más sin tocar `DashboardView.jsx`.
- **No se ha podido comprobar en un iPhone real** ni renderizando la app en este entorno — todo lo hecho es lectura y edición de código. La densidad de las nuevas rejillas (2×2, 2×3, fila de acciones con scroll horizontal) se ha dimensionado a ojo siguiendo el mismo lenguaje visual ya usado en `ListCard`/`Card` desde fases anteriores, pero su aspecto real en una pantalla pequeña no se ha podido verificar visualmente.
- **Acciones rápidas limitadas a Sueño/Gasto/Tarea/Objetivo** — las cuatro con un formulario de alta ya existente, de un solo paso, sin ambigüedad sobre qué crear (a diferencia de, por ejemplo, "+ Entreno", que exigiría elegir antes una habilidad concreta de las 7 o un partido de fútbol) — ampliar esta fila a más módulos es una extensión directa del mismo patrón.
- No se ha podido verificar con `esbuild` en este entorno (sin acceso al registro de npm, `403`, mismo límite de siempre) — revisado a mano: balance de paréntesis/llaves/corchetes comprobado por script en los diez archivos tocados (OK), y cada prop nueva (`foco`, `onFocoConsumido`, `onNavegar`, `resumenes`, `dashboardOcultos`, etc.) cruzada uno a uno contra su punto de origen en `App.jsx` y su consumo en cada vista.

## Optimización de navegación y scroll — móvil (v1.19.0)

### Alcance de esta fase, dicho primero
Ajuste de UX/UI centrado en densidad y scroll, sin tocar el diseño visual, las animaciones ni la navegación existente, tal y como pedía explícitamente la especificación. Antes de cambiar nada se analizó el código real de las pantallas principales (Hoy/Sueño/Entreno/Economía), el selector de color y el resto de Ajustes, y la estructura de "Más" (HubView.jsx) — el hallazgo más importante fue un bug real de CSS, no solo una cuestión de gusto de maquetación (ver más abajo).

### El hallazgo: por qué el selector de color aparecía "abajo del todo"
`ColorPicker.jsx` y `TemaBuilder.jsx` ya estaban construidos como paneles flotantes (`position: fixed; inset: 0`, bottom-sheet) desde fases anteriores — en teoría ya eran "contextuales". El problema real es una trampa clásica de CSS: `.module-enter` (la animación de entrada de cada pantalla, `index.css`, apartado N1/N2) usa `animation-fill-mode: both`, que deja aplicado el `transform` del último fotograma (`scale(1) translateX(0)`) **para siempre** después de que la animación termina. Cualquier `transform` distinto de `none` — aunque sea "visualmente igual a nada" — convierte a ese `<div>` en el "containing block" de sus descendientes `position: fixed`. Como Ajustes (y el Calendario, y el escáner de código de barras de Nutrición) se renderizan dentro de `.module-enter`, cualquier modal `fixed inset-0` anidado ahí dejaba de anclarse al viewport real y pasaba a anclarse al tamaño de ESE contenedor — que en una pantalla larga de Ajustes es mucho más alto que la pantalla visible. Resultado: el selector "aparecía" técnicamente en el sitio correcto según su propio CSS, pero ese sitio estaba muy por debajo del contenido visible.

### Añadido / cambiado
- **Corrección de raíz (afecta a los 10 overlays `fixed inset-0` de toda la app, no solo al color):** `ColorPicker.jsx`, `TemaBuilder.jsx`, `BarcodeScanner.jsx`, los tres modales de `CalendarView.jsx` (editor de evento, detalle de solo lectura, buscador) y los cuatro modales de `components/ui.jsx` (`VerificacionPinModal`, `CrearPinModal`, `RecuperarPinModal`, `UniversalSearchModal`) ahora se montan con `createPortal(..., document.body)` de React — se sacan del árbol de `.module-enter` y se anclan siempre al viewport real, apareciendo superpuestos de inmediato junto al botón que los abre, nunca "al final de la página". Comentario explicativo añadido junto a `.module-enter` en `index.css` para que nadie reintroduzca este bug con un overlay nuevo en el futuro.
- `src/components/ui.jsx`: nuevos `ListCard`/`ListRow` — sustituyen al patrón repetido de "una `Card` suelta por cada fila de una lista" (registros de sueño, movimientos de economía, partidos, PRs), que sumaba bastante alto por el borde+padding+margen de cada tarjeta individual. Una única `Card` con las filas separadas por un borde fino interior: mismo contenido, mismo orden, bastante menos alto.
- `src/views/DashboardView.jsx`: el grupo de avisos condicionales (modo viaje, acceso al calendario, recordatorio de Relación, sueño corto, racha en riesgo, examen sin horas) pasa a un espaciado más apretado (`space-y-2`) con tarjetas de padding más compacto — mismo contenido, menos aire entre ellas cuando coinciden varias a la vez. Las métricas favoritas y las dos estadísticas fijas (sueño/saldo) se fusionan en una única rejilla de 2 columnas en vez de dos rejillas separadas.
- `src/views/SleepView.jsx`, `src/views/FinanceView.jsx`: las listas de registros recientes/movimientos pasan a `ListCard`/`ListRow`. En Economía, la tarjeta "Hucha" pasa a ser una fila dentro de la misma tarjeta de "Cuenta principal" en vez de una tarjeta aparte.
- `src/views/TrainingView.jsx`: las 7 habilidades de calistenia (Handstand/Front Lever/Back Lever/Planche/Human Flag/Muscle Up/L-Sit) pasan de una columna apilada a una rejilla de 2 columnas mientras están colegidas; la que se toca ocupa el ancho completo (`gridColumn: '1 / -1'`) para tener sitio de sobra para sus 4 subpestañas — mismo contenido y mismas acciones, mucho menos alto cuando ninguna está abierta. Partidos de fútbol y PRs también pasan a `ListCard`/`ListRow`.

### Decisiones
- **La causa real era un bug de CSS (containing block por `transform`), no una cuestión de diseño** — se ha corregido con `createPortal`, la solución estándar de React para este problema exacto, sin tocar la animación (`.module-enter`) que la causaba: el objetivo era arreglar el síntoma sin perder la animación de entrada que ya funcionaba bien.
- **"Más" (HubView.jsx) se ha dejado tal cual, sin comprimir**: la propia especificación distingue explícitamente un NIVEL 2 ("Más puede utilizar una estructura algo más amplia") de un NIVEL 1 (pantallas principales, donde sí hay que evitar scroll) — las tarjetas grandes de los hubs de área ya encajan en esa excepción explícita.
- **Ajustes sigue siendo una pantalla con scroll, tal y como pedía la propia especificación** (NIVEL 3) — el cambio ahí no ha sido "quitar el scroll", sino asegurar que los controles que se abren dentro (el color, sobre todo) aparezcan pegados a donde se pulsan en vez de al final del documento.
- **`ListCard`/`ListRow` son composición sobre `Card`, no un sistema visual nuevo**: mismo color de fondo, mismo borde, mismo radio — solo cambia cómo se agrupan varias filas, para no romper "conservar el estilo premium" pedido explícitamente.
- **Nada de contenido ni de funciones eliminado**: cada aviso, cada botón, cada campo de formulario sigue existiendo — el cambio es siempre de agrupación/densidad (tarjetas fusionadas, listas consolidadas, rejillas en vez de columnas), nunca de recorte de información, tal y como se pedía explícitamente ("si hay demasiados elementos, reorganiza, no simplifiques hasta hacerlo incómodo").

### Pendiente (documentado, no implementado en esta fase)
- No se ha podido comprobar en un iPhone real ni en ningún dispositivo real — todo el trabajo de esta fase es revisión y edición de código, sin poder renderizar la app en este entorno. El hallazgo del bug de `transform`/`containing block` es un mecanismo de CSS bien documentado y verificable leyendo la especificación, pero su efecto visual exacto (cuánto "más abajo" aparecía el selector antes del arreglo) no se ha podido medir en pantalla.
- Compactación más agresiva de otras vistas no mencionadas explícitamente en la especificación (Estudios, Negocio, Productividad, Objetivos, Diario, Biblioteca, Fe, Bienestar, Estadísticas, Predicciones, Logros) — fuera del alcance pedido ("Hoy/Sueño/Entreno/Economía y cualquier otra sección principal equivalente"); si Josué quiere el mismo tratamiento ahí, es una extensión directa del mismo patrón (`ListCard`/`ListRow`, rejillas en vez de columnas) ya aplicado aquí.
- La lista de vídeos de Entrenamiento (`VideosTab`) se ha dejado con tarjetas individuales (no `ListCard`) porque cada entrada tiene contenido más rico (checkbox de comparar, botones de analizar/borrar, feedback de la IA) que no se compacta limpiamente en una fila simple sin perder claridad — documentado aquí en vez de forzarlo.
- No se ha podido verificar con `esbuild` en este entorno (sin acceso al registro de npm, `403`, mismo límite de siempre) — revisado a mano: balance de paréntesis/llaves/corchetes comprobado por script en los nueve archivos tocados (OK), y cada uso de `createPortal`/`ListCard`/`ListRow` cruzado uno a uno contra su import y su export real.

## Seguridad Centralizada — PIN configurable por áreas y funciones, hasheado, con recuperación por correo (v1.18.0)

### Alcance de esta fase, dicho primero
Sustitución completa del sistema de PIN por uno centralizado, configurable y escalable, siguiendo la especificación de seguridad recibida punto por punto (14 apartados + recuperación de PIN añadida después). Se ha analizado primero cómo funcionaba el PIN existente (comparación en texto plano en `PinGate`/`PinSetter`, `personalizacion.pinExtra` como lista de zonas extra desconectada de `seguridad`, `'relacion'` protegida siempre por un caso especial fijo, `BloqueoAutomaticoGate` para el bloqueo automático de toda la app) antes de tocar nada, y se ha migrado sin pérdida de datos: quien ya tenía un PIN sigue teniéndolo, y quien ya tenía secciones protegidas las conserva.

### Añadido / cambiado
- `src/lib/pin.js` (nuevo): `crearPinHash(pin)`/`verificarPin(intento, pinHash, pinSalt)` — hash SHA-256 + salt aleatorio de 16 bytes por PIN, con la Web Crypto API nativa del navegador (`crypto.subtle`). El PIN ya no se guarda ni se compara nunca en texto plano.
- `src/tokens.js`: `DEFAULT_SEGURIDAD` gana `pinHash`/`pinSalt` (sustituyen a `ajustes.pin` en claro), `protectedAreas`/`protectedActions` (listas centralizadas de zonas y funciones protegidas), `sessionTimeoutMin` (sesión de desbloqueo temporal) y `migradoAreas`/`migradoAcciones` (banderas internas de la migración de una sola vez). Nuevo `ACCIONES_PROTEGIBLES` (catálogo de protección de función: `fotos_privadas`, `exportar_datos`, `eliminar_datos`) y `OPCIONES_SESION_PIN` (1/5/15/30 min o "pedir siempre").
- `src/lib/supabase.js`: `onAuthEvent(callback)` (suscripción aparte de `onAuthChange`, expone también el propio evento — se usa para detectar `PASSWORD_RECOVERY`) y `sendPasswordReset(email, redirectTo)` (envuelve `supabase.auth.resetPasswordForEmail`).
- `src/components/ui.jsx`: `PinSetter` (comparación en claro) eliminado; nuevos `EntradaPin` (input numérico único, reutilizado por las tres pantallas que piden un PIN), `PinGate` (ahora controlado: recibe `pinHash`/`pinSalt`/`desbloqueado`/`onDesbloquear`/`onOlvidoPin` en vez de un `pin` en claro y un `unlocked` local), `VerificacionPinModal` (modal de "confirma tu PIN" reutilizado por cualquier acción sensible), `CrearPinModal` (crear/cambiar PIN en dos pasos: nuevo → confirmar) y `RecuperarPinModal` ("¿No recuerdas tu PIN?").
- `src/App.jsx`: es ahora el único sitio que decide y guarda el estado de protección (apartado 8/9 de la especificación):
  - Migración de carga: si existía `ajustes.pin` en claro, se hashea una sola vez y se descarta (`pin: null` a partir de ahí, para siempre); si existían secciones en `personalizacion.pinExtra`, se vuelcan una sola vez en `seguridad.protectedAreas` (banderas `migradoAreas`/`migradoAcciones` evitan que un futuro `pinExtra` obsoleto "resucite" algo que Josué ya desprotegió a mano); `fotos_privadas` se activa sola en `protectedActions` porque `HealthView` ya protegía esa pestaña siempre, sin opción, antes de esta fase.
  - `pedirVerificacionPin(motivo, onExito)`: único punto por el que pasan cambiar el PIN, desactivarlo, o quitar protección a una sección/función — pide el PIN actual antes de ejecutar `onExito`; añadir protección nunca lo pide.
  - `toggleAreaProtegida`/`toggleAccionProtegida`: único sitio que toca `protectedAreas`/`protectedActions`, usado tanto por la nueva lista de Seguridad como por el candado ya existente de Personalización.
  - `desbloqueosPin` (mapa en memoria `clave → timestamp`, nunca en Supabase): sesión temporal de desbloqueo (apartado 6) — `registrarDesbloqueo`/`estaDesbloqueado`, con `seguridad.sessionTimeoutMin` configurable; se limpia entero en cuanto salta el bloqueo automático ya existente (apartado 7: integrado con `BloqueoAutomaticoGate`, no duplicado) y se pierde solo al recargar la app (no vive en Supabase).
  - `AREAS_PROTEGIBLES` = `MORE_NAV` (catálogo ya existente de todos los módulos) + `'hoy'` — cualquier módulo futuro que se añada a `MORE_NAV` aparece solo en la lista de "Protección mediante PIN", sin tocar este archivo (apartado 1).
  - Recuperación de PIN: `enviarRecuperacionPin`/`guardarPinTrasFlujo`, más un `useEffect` que escucha `onAuthEvent` para detectar `PASSWORD_RECOVERY` y abrir `CrearPinModal` en modo `'recuperacion'`.
- `src/views/SettingsView.jsx` (categoría Seguridad, reescrita): tarjeta de PIN (estado, crear/cambiar/desactivar — los dos últimos abren el flujo de verificación centralizado), tarjeta **"Protección mediante PIN"** (una fila por cada entrada de `areasProtegibles`, con interruptor — 'Relación' sigue fija, sin poder quitarla), tarjeta **"Protección de funciones"** (una fila por `ACCIONES_PROTEGIBLES`), tarjeta **"Sesión de desbloqueo"** (`OPCIONES_SESION_PIN`), biometría y bloqueo automático sin cambios de comportamiento (solo comprobando `seguridad.pinHash` en vez de un `pin` en claro). "Exportar datos" y "Eliminar datos por categoría" pasan por verificación de PIN si `protectedActions` las tiene activadas (wrappers en `App.jsx`).
- `src/views/HealthView.jsx`: "Ver fotos privadas" pasa de protección fija a protección de función real (`protegidoFotos`), primer caso de verdad de "protección por función, no solo por pantalla" (apartado 2).
- `src/views/PersonalizationView.jsx`: el candado por módulo (`FilaModulo`) lee y escribe ahora `seguridad.protectedAreas` (prop `protectedAreas`) en vez de `personalizacion.pinExtra` — mismo control visual de siempre, pero conectado al único sistema centralizado.

### Decisiones
- **Un único sistema, no una capa nueva por encima de la vieja**: no existen ya dos formas de proteger una sección (`personalizacion.pinExtra` y `seguridad`) — la vieja se migra y se abandona; el candado de Personalización y la lista de Seguridad llaman literalmente a las mismas dos funciones de `App.jsx`.
- **Hashing con SHA-256 + salt, no bcrypt/argon2/scrypt**: sin acceso a npm en este entorno no hay forma de instalar una librería de hash lento pensada para contraseñas. SHA-256 simple es rápido, así que esta mejora no es resistente a fuerza bruta si alguien consiguiera una copia directa de la fila de Supabase — pero ya no es texto plano legible a simple vista, que es la mejora real y honesta que se podía dar aquí sin backend propio. El salt por usuario sí evita tablas precalculadas entre cuentas. Documentado también en los comentarios de `src/lib/pin.js`.
- **Reducir protección siempre pide el PIN actual; añadirla nunca lo pide**: leído literalmente del apartado 3 ("especialmente cuando la modificación reduzca la protección") — subir la seguridad de una sección no es una acción de riesgo que necesite fricción.
- **La sección de Seguridad no tiene un candado de entrada propio distinto del resto de Ajustes**: `SettingsView.jsx` es una única pantalla con categorías internas (Perfil/Apariencia/Seguridad/Datos/...), no rutas independientes — proteger "Ajustes" como área (ya disponible en la lista) protege también la entrada a Seguridad. Lo que sí es un mínimo obligatorio, independiente de eso, son las tres acciones críticas del apartado 3 (cambiar PIN, desactivarlo, reducir protección), que siempre piden el PIN actual pase lo que pase con la protección de área — es la garantía real que pedía el apartado 4, no un candado de pantalla adicional.
- **Protección de función parcialmente cableada, arquitectura lista para el resto**: el apartado 2 no exige implementar toda la granularidad ahora, solo que el sistema esté preparado. `protectedActions` + `ACCIONES_PROTEGIBLES` son genéricos: añadir una acción nueva del catálogo (ver Pendiente) es añadir una entrada al array y un `if (protegido) pedirVerificacionPin(...)` en el punto exacto donde ya ocurre esa acción — sin rediseñar nada. Se han cableado de verdad las tres más baratas y con más sentido inmediato: `fotos_privadas` (migrada del comportamiento fijo anterior, sin regresión), `exportar_datos` y `eliminar_datos`.
- **Sesión de desbloqueo en memoria, nunca en Supabase**: así "cerrar/reabrir la app" (comprobación 8) la reinicia sola, sin lógica extra — persistirla habría exigido además una fecha de expiración server-side para que tuviera sentido de verdad como medida de seguridad, y hoy no hay servidor propio más allá del proxy de IA.
- **Recuperación de PIN vía `resetPasswordForEmail` de Supabase, nunca solo con el correo escrito**: el enlace solo llega a quien tiene acceso real a esa bandeja de entrada; hasta que Supabase no dispara el evento `PASSWORD_RECOVERY` (al abrir ese enlace desde el propio dispositivo) no se deja crear un PIN nuevo. En ningún momento se pide ni se guarda la contraseña de la cuenta de correo — ni siquiera se toca la contraseña de la cuenta de Supabase, el enlace de recuperación se usa puramente como verificación de identidad.
- **Migración de una sola vez, con banderas explícitas** (`migradoAreas`/`migradoAcciones`): sin ellas, cada carga volvería a fusionar `personalizacion.pinExtra` (que ya no se escribe, pero puede seguir teniendo datos antiguos) contra `protectedAreas`, "resucitando" secciones que Josué hubiera desprotegido a mano después de la migración — un bug real de haberlo hecho sin la bandera.

### Comprobaciones (verificadas a mano, revisando el código — ver Pendiente)
1. PIN activado + Economía protegida → entrar en Economía → pide PIN. ✓ (`necesitaPin` en `App.jsx`: `!!seguridad.pinHash && areaProtegida && !estaDesbloqueado(...)`)
2. PIN activado + Economía NO protegida → entrar en Economía → no pide PIN. ✓ (`areaProtegida` es `false` si no está en `protectedAreas`)
3. Cambiar el PIN → pide PIN actual. ✓ (`iniciarCambioPin` → `pedirVerificacionPin`)
4. Desactivar el PIN → pide PIN actual. ✓ (`iniciarDesactivarPin` → `pedirVerificacionPin`)
5. Quitar la protección de una sección → pide PIN actual. ✓ (`toggleAreaProtegida`/`toggleAccionProtegida`, rama "ya estaba protegida")
6. PIN incorrecto → no accede. ✓ (`verificarPin` devuelve `false`, no se llama a `onDesbloquear`/`onSuccess`)
7. PIN correcto → accede. ✓
8. Cerrar/reabrir la app → la protección sigue activa. ✓ (`protectedAreas`/`protectedActions`/`pinHash` viven en Supabase; `desbloqueosPin` vive solo en memoria, así que además vuelve a pedir el PIN de las sesiones temporales que hubiera abiertas)
9. Si ya existía un PIN, sigue funcionando. ✓ (migración: se hashea el mismo valor que Josué ya conocía)
10. No se puede saltar la protección por navegación/URL/estado interno. ✓ dentro de los límites de una SPA sin backend propio: no hay enrutado por URL en la app (`tab` es estado de React, no hay `react-router` ni lectura de `location`), y `PinGate` envuelve el único punto de la app donde se renderiza el contenido de una pestaña (`renderTab`) — no existe una segunda vía de render. Límite honesto, ya documentado en `src/lib/biometria.js` para el sistema anterior: alguien con acceso a las herramientas de desarrollador del propio navegador podría, en teoría, manipular el estado de React directamente — el mismo límite que tenía el PIN en claro y la biometría local, inherente a no tener servidor de autorización propio.

### Pendiente (documentado, no implementado en esta fase)
- Granularidad completa del catálogo de protección de función del apartado 2 (modificar datos sensibles, restaurar copia de seguridad — no existe todavía como función real —, cambiar configuraciones de seguridad más allá de lo ya obligatorio, acceder a información financiera como acción aparte del área Economía/Negocio, acceder a contenido privado como acción aparte de las áreas ya protegibles). El modelo de datos y el patrón de cableado ya están listos; solo falta añadir entradas al catálogo y el `if` correspondiente en cada punto real.
- "Seguridad" como sub-zona de "Ajustes" con candado propio, independiente del resto de categorías de Ajustes — no implementado porque `SettingsView.jsx` es una única pantalla con categorías internas, no rutas separadas (ver Decisiones); las tres acciones críticas siguen protegidas siempre, con o sin esto.
- Auditoría de eventos de seguridad, lista de dispositivos autorizados, sesiones activas en otros dispositivos — necesitan permisos de administrador de Supabase gestionados desde un servidor, mismo límite ya documentado en fases anteriores de esta categoría.
- No se ha podido verificar con `esbuild` en este entorno (sin acceso al registro de npm, `403`, mismo límite de siempre) — revisado a mano: balance de paréntesis/llaves/corchetes comprobado por script en los ocho archivos tocados (OK), imports cruzados uno a uno contra las firmas reales exportadas por `components/ui.jsx`, `lib/pin.js`, `lib/supabase.js` y `tokens.js`, y las diez comprobaciones obligatorias de la especificación trazadas a mano sobre el código (ver más arriba). Pendiente que la siguiente IA o Josué en ejecución real confirmen sobre todo dos cosas que no se pueden probar sin ejecutar la app de verdad: que el enlace de recuperación de Supabase, tal y como está configurado el proyecto (`redirectTo`, plantilla de correo), efectivamente devuelve al usuario a la app con el evento `PASSWORD_RECOVERY` disparándose; y que la migración de un PIN antiguo en claro se ve reflejada correctamente en Supabase (campo `pin` a `null`, `seguridad.pinHash`/`pinSalt` rellenos) la primera vez que un usuario con PIN previo abre esta versión.

## Fase 3 del Calendario Universal, primera pasada — Recurrencia, Agenda, filtros y búsqueda (v1.17.0)

### Alcance de esta pasada, dicho primero
Fase 3 del prompt del Calendario es una lista abierta ("incluirá potencialmente...", sin criterio de finalización como sí tenía la Fase 1). En vez de intentarlo todo de golpe, esta pasada se centra en el bloque más pedido y más útil sin datos: **recurrencia real, vista Agenda, filtros por tipo y búsqueda**. Quedan fuera de esta pasada, documentado sin rodeos: estadísticas temporales del calendario, automatizaciones/"eventos inteligentes" (sin especificación concreta, mismo criterio de cautela que con AXION — no prometer IA sin saber qué haría de verdad), integración más profunda con "Hoy" (el acceso discreto ya existente se deja tal cual, por no volverlo invasivo), vista de día independiente (la Agenda ya cubre ese caso de uso) y personalización avanzada del propio calendario.

### Añadido / cambiado
- `src/tokens.js`: `FRECUENCIAS_RECURRENCIA` (diaria/semanal/mensual/anual).
- `src/lib/calendario.js`: `expandirRecurrentes(eventos, desdeISO, hastaISO)` — genera las ocurrencias VIRTUALES de un evento recurrente dentro de una ventana, sin guardar ni duplicar nada (mismo espíritu que los eventos derivados de la Fase 2: se recalcula siempre, acotado a la ventana que pide quien llama). Atajo de aritmética exacta para diaria/semanal cuando el ancla del evento queda muy por detrás de la ventana pedida, para no agotar el tope de seguridad de 500 pasos con eventos antiguos vistos mucho después.
- `src/views/CalendarView.jsx`: reescrita para Fase 3 —
  - **Recurrencia**: nuevo campo "Repetir" en el editor (No se repite/Cada día/semana/mes/año) + "Repetir hasta" opcional. Tocar cualquier ocurrencia de un evento recurrente (incluida una generada, no solo el día ancla) abre/edita siempre el evento REAL completo — no hay edición de una ocurrencia suelta en esta pasada, avisado en el propio editor ("cambia toda la serie").
  - **Vista Agenda**: alternativa a la cuadrícula mensual (toggle Mes/Agenda) — lista cronológica agrupada por día, próximos 60 días, tope de 50 eventos renderizados con aviso si se trunca.
  - **Filtros por tipo**: fila de chips (uno por cada uno de los 8 tipos, coloreado con su token semántico) para mostrar/ocultar categorías — afecta a la cuadrícula, el panel de día, "Próximamente", la Agenda y la búsqueda por igual.
  - **Búsqueda**: modal con texto libre sobre título/notas, ventana de -60/+180 días, resultados tocables que saltan directo al evento.
  - `FilaEvento` (nuevo componente compartido): mismo aspecto para el panel de día y la Agenda, con icono de candado (solo lectura) y de repetición cuando corresponde.

### Decisiones
- **Recurrencia sin intervalo personalizado ni excepciones**: "cada 2 semanas" o "saltar este día concreto sin romper la serie" quedan fuera — la primera pasada cubre el caso de uso mayoritario (diaria/semanal/mensual/anual, con o sin fecha de fin) sin la complejidad de un motor de reglas tipo iCalendar.
- **Nunca se materializan ocurrencias en Supabase**: siguen viviendo como una única fila con una regla — coherente con el mismo principio ya aplicado a los eventos derivados de otros módulos (Fase 2) y con el criterio general del proyecto de no duplicar datos.
- **Automatizaciones/"eventos inteligentes" explícitamente no abordados**: el prompt los menciona sin definir qué deberían hacer — construir algo ahí sin una especificación real sería inventar alcance, lo mismo que ya se evitó con AXION.

### Pendiente (documentado, no implementado en esta fase)
- Intervalo personalizado y excepciones de recurrencia ("cada 2 semanas", saltar un día concreto).
- Estadísticas temporales del calendario, automatizaciones/eventos inteligentes, integración más profunda con "Hoy", personalización avanzada del calendario — siguen abiertas dentro de la Fase 3, sin fecha.
- Fechas importantes de Relación, con PIN — sigue sin abordar (ver Fase 2).
- No se ha podido verificar con `esbuild` en este entorno (sin acceso al registro de npm, `403`) — revisado a mano: balance de paréntesis/llaves/corchetes comprobado por script en los tres archivos tocados (OK), y la lógica de `expandirRecurrentes` verificada a mano con casos de prueba (evento diario/semanal con ancla antigua, evento mensual/anual, evento sin recurrencia) trazando el bucle sobre papel. Pendiente que la siguiente IA o Josué en ejecución real confirmen que editar/eliminar una serie recurrente se comporta como se espera, y que la vista Agenda no se sienta pesada con datos reales en un iPhone.

## Fase 2 del Calendario Universal — Calendario inteligente e integración (v1.16.0)

### Añadido / cambiado
- `src/lib/calendarioIntegracion.js` (nuevo): `eventosDerivados({ objetivos, estudios, calistenia, futbol, productividad })` — calcula, en cada render, eventos de **solo lectura** a partir de otros módulos, sin guardar ni duplicar nada:
  - **Objetivos**: los no cumplidos con plazo estimable (`prediccionObjetivo`, Fase 17) → tipo `objetivo`, fecha = plazo estimado (dicho explícitamente en las notas del evento, nunca presentado como una fecha exacta que Josué haya escrito).
  - **Estudios**: exámenes (fecha real) → tipo `estudio`.
  - **Entrenamiento**: sesiones de calistenia por habilidad + partidos de fútbol (ambos con fecha real ya registrada) → tipo `entrenamiento`.
  - **Productividad**: tareas pendientes con fecha límite → tipo `recordatorio` (el dato de ese módulo más cercano en espíritu a "recordatorio con fecha propia" — ver Decisiones).
  - `NOMBRES_ORIGEN`: nombre legible de cada módulo de origen, para el botón "Abrir en…" del detalle de un evento derivado.
- `src/views/CalendarView.jsx`: ahora fusiona `calendario.eventos` (propios, editables) con la nueva prop `derivados` (solo lectura) — el motor de `calendario.js` (celdas, eventos del día, resumen, futuros) trabaja igual sobre la lista combinada, sin ningún cambio, porque nunca distinguió origen. Los eventos derivados muestran un icono de candado y, al tocarlos, abren `DetalleEventoDerivado` (nuevo componente) en vez del editor — solo lectura, con botón "Abrir en {módulo}" que navega al módulo de origen real. Nuevo panel **"Próximamente"**: hasta 5 días con algo programado en las próximas ~2 semanas ("Hoy", "Mañana", día de la semana…), cada fila tocable para saltar directo a ese día.
- `src/App.jsx`: `derivadosCalendario` calculado una vez por render (mismo criterio barato que `resumenesTodos`/`metricasCalculadas`), pasado a `CalendarView` (`derivados`) y a `DashboardView` (`derivadosCalendario`); `onAbrirModulo={setTab}` conecta el botón "Abrir en…" del detalle de solo lectura con la navegación real de la app.
- `src/views/DashboardView.jsx`: `AccesoCalendario` fusiona ahora `calendario.eventos` + `derivadosCalendario` antes de calcular el resumen de hoy — un examen o partido de hoy aparece en el acceso discreto de "Hoy" igual que un evento creado a mano.
- `src/lib/resumenesHub.js`: el caso `'calendario'` fusiona `eventosDerivados(s)` con los eventos propios antes de calcular el resumen de la tarjeta del hub "Vida".

### Decisiones
- **Sin duplicar datos, por construcción**: los eventos derivados se calculan de nuevo en cada render a partir del estado real de cada módulo — nunca se copian a `calendario.eventos`. Esto resuelve gratis dos puntos del prompt: "evitar duplicados" (no existe una segunda copia que pueda desincronizarse) y "si modificas algo desde su módulo, se actualiza el calendario" (se recalcula solo, sin código de sincronización).
- **⚠️ Fechas importantes de Relación — excluidas a propósito, por privacidad, no implementado igual que el resto:** el prompt del Calendario pide explícitamente integrar "fechas importantes", pero Relación es el único módulo protegido por PIN de principio a fin en toda la app (ver `HANDOFF.md`, `currentState`/`exportData` en `App.jsx`, que ya la excluían por el mismo motivo). El Calendario, tal y como está construido, **no pide PIN para abrirse** — traer esas fechas aquí habría sido una regresión de privacidad real (cualquiera que abriera el calendario vería el nombre de la pareja y sus fechas sin PIN). Se ha dejado fuera. Si Josué quiere verlas igualmente, la vía honesta es una fase futura que proteja específicamente esas entradas con el mismo `PinGate` — no mezclarlas sin más.
- **Hábitos y Rutinas — no integrados, documentado sin rodeos:** también pedidos explícitamente por el prompt, pero ninguno de los dos tiene una fecha ni periodicidad propia en el modelo de datos real (un hábito es `historial: {fecha: true}`, marcas de cuándo SE HIZO, no de cuándo TOCA; una rutina no tiene fecha en absoluto). Integrarlos de verdad exige un motor de recurrencia real (repetir cada día/semana/mes), que es trabajo explícito de Fase 3 ("eventos recurrentes avanzados") — inventarles una fecha ahora habría sido simular algo que no existe. En su lugar se han integrado las **Tareas** de Productividad (sí tienen `fechaLimite` real), el dato de ese módulo más cercano en espíritu a lo que pedía el prompt.
- **Recordatorios**: no son un módulo aparte en la app — ya estaban cubiertos desde la Fase 1 (Josué los crea directamente en el calendario, tipo "Recordatorio").
- **Eventos de solo lectura, nunca editables desde el calendario**: el dato real vive en su módulo de origen; el calendario solo lo muestra y enlaza de vuelta ("Abrir en {módulo}"), nunca permite editar/eliminar ahí — evita una segunda fuente de verdad para el mismo dato.

### Pendiente (documentado, no implementado en esta fase)
- Fase 3 — experiencia premium: vista agenda/día, filtros, búsqueda, eventos recurrentes reales (incluidos Hábitos/Rutinas, ver Decisiones), estadísticas temporales, integración profunda con "Hoy", automatizaciones.
- Fechas importantes de Relación, con PIN — no abordado, ver Decisiones.
- No se ha podido verificar con `esbuild` en este entorno (sin acceso al registro de npm, `403`) — revisado a mano: balance de paréntesis/llaves/corchetes comprobado por script en los ocho archivos tocados (OK), imports cruzados uno a uno contra las firmas reales de `predicciones.js`, `components/ui.jsx` y `lib/helpers.js`, y los ids de los eventos derivados (`origen:origenId`) verificados a mano para que no colisionen con los `uid()` aleatorios de los eventos propios. Pendiente que la siguiente IA o Josué en ejecución real confirmen que "Abrir en {módulo}" navega bien desde dentro del calendario, y que el panel "Próximamente" no se sienta sobrecargado en un iPhone real.

## Fase 1 del Calendario Universal — Motor y calendario base (v1.15.0)

### Añadido / cambiado
- `src/tokens.js`: `DEFAULT_CALENDARIO` (`{ eventos: [] }`), `TIPOS_EVENTO_CALENDARIO` (8 tipos: objetivo/hábito/rutina/estudio/entrenamiento/fecha importante/recordatorio/personal, cada uno con un `colorToken` en vez de un hex fijo) y `colorDeTipoEvento(tipoId, accent)`, que resuelve el color en cada render contra `COLORS`/el acento activo — nunca un color guardado por evento, para que un evento "Entrenamiento" siga siendo dorado/warning aunque Josué cambie de tema o de acento después de crearlo.
- `src/lib/calendario.js` (nuevo): motor puro de fechas, mismo espíritu que `colorEngine.js`/`predicciones.js` — `diasDelMes`/`primerDiaSemanaMes`/`celdasMes` (cuadrícula mensual con años bisiestos resueltos por `Date` nativo, semana empezando en lunes), `eventosDelDia`, `tiposDelDia` (para los indicadores de punto de la cuadrícula, máximo 3 por día), `resumenDelDia` (resumen contextual tipo "3 eventos · 2 hábitos · 1 objetivo") y `eventosFuturos` (preparado para la Fase 2 — "Próximamente" —, escrito pero sin usar todavía en ninguna vista).
- `src/views/CalendarView.jsx` (nuevo): vista principal del calendario — cabecera con mes/año y navegación (mes anterior/siguiente/volver a hoy), cuadrícula mensual con el día actual y el seleccionado distinguidos por forma+color a la vez (nunca solo color, por accesibilidad) y puntos de color por tipo de evento presente, panel de día seleccionado con resumen contextual y lista de eventos (icono por tipo, hora o "Todo el día", ubicación si la tiene), editor modal único para crear y editar (título/tipo/fecha/interruptor "todo el día"/hora inicio-fin/notas/ubicación) con eliminar — mismo patrón visual que el buscador universal de la Fase 18.
- `src/App.jsx`: nuevo estado `calendario` (clave de Supabase propia, cargada con merge contra `DEFAULT_CALENDARIO` — mismo motivo que `temasGuardados`, por si la clave no existe todavía para un usuario ya registrado). `addEvento`/`updateEvento`/`deleteEvento` pasan por `snapshotAndSave`, igual que Objetivos/Diario — incluido en el snapshot y en `undo()`, en `RESET_MODULOS` (Ajustes → Privacidad) y en `currentState` (buscador universal, panel de sugerencias de IA, exportación). Nuevo módulo `calendario` en `MORE_NAV` y primero en `AREAS_NAV.area-vida` (junto a Estudios/Productividad/Objetivos/Diario/Biblioteca) — sin tocar la barra inferior de 5 pestañas, tal y como exige el propio prompt del Calendario ("nunca añadir una sexta pestaña").
- `src/views/DashboardView.jsx`: `AccesoCalendario`, acceso secundario discreto de una sola línea desde "Hoy" con el resumen de eventos de hoy (o una invitación breve si no hay nada) — abre el calendario vía `onAbrirCalendario` (`setTab('calendario')` en App.jsx), sin duplicar lógica de fechas propia.
- `src/lib/resumenesHub.js`: nuevo caso `'calendario'` para la tarjeta del hub "Vida" — resumen de hoy (`resumenDelDia`) y cuántos eventos hay en los próximos 7 días (`eventosFuturos`).
- `src/lib/exportData.js`: nueva sección "Calendario" en la exportación CSV/Excel, solo eventos con `origen: 'calendario'` — para no duplicar en el futuro lo que ya exporte cada módulo de origen cuando la Fase 2 conecte otros módulos.
- `src/index.css`: dos animaciones discretas nuevas (`calendarMonthIn` al cambiar de mes, `calendarSheetIn` al abrir el editor) reutilizando `--ease-premium` ya existente (Fase N1/N2) — ninguna curva de movimiento nueva, y respetan "Reducir movimiento"/"Desactivadas" automáticamente gracias a las reglas globales ya existentes en el archivo.

### Decisiones
- **Arquitectura preparada para Fase 2/3, sin implementarlas todavía** (regla explícita del prompt del Calendario: "en esta entrega solo debes implementar la Fase 1"). Cada evento lleva `origen`/`origenId` (hoy siempre `'calendario'`) y campos reservados sin lógica (`recurrencia`, `estado`) para que una fase futura pueda inyectar eventos de solo lectura desde Objetivos/Hábitos/Rutinas/Estudios/Entrenamiento/Fechas importantes sin duplicar el dato ni rehacer este modelo.
- **Sin sistema de color paralelo**: los 8 tipos de evento reutilizan los roles ya existentes del Theme Engine (`positive`/`warning`/`negative`/`info`/`secondary`/`tertiary`/acento/`textMuted`) — cero hex hardcodeado en `CalendarView.jsx` ni en `tokens.js`.
- **Sin almacenamiento paralelo**: reutiliza la misma tabla genérica `app_data` de Supabase (clave `'calendario'`) que ya usa el resto de la app — no hizo falta tocar `supabase/schema.sql`.
- **Celdas vacías en vez de días de otro mes**: el hueco antes del día 1 se deja en blanco (sin número, no interactivo) en vez de mostrar días de otro mes sin poder navegar a ellos — más simple y sin ambigüedad para esta fase.

### Pendiente (documentado, no implementado en esta fase)
- Fase 2 — Calendario Universal: integración real con Objetivos/Hábitos/Rutinas/Entrenamiento/Estudios/Recordatorios/Fechas importantes, "Próximamente", evitar duplicados, poder abrir el elemento original desde el calendario.
- Fase 3 — experiencia premium: vista agenda/día, filtros, búsqueda, eventos recurrentes reales, estadísticas temporales, integración profunda con "Hoy".
- No se ha podido verificar con `esbuild` en este entorno (sin acceso al registro de npm, `403` — mismo límite documentado en casi todas las fases anteriores) — revisado a mano: balance de paréntesis/llaves/corchetes comprobado por script en los siete archivos tocados (OK), e imports cruzados uno a uno contra las firmas reales de `components/ui.jsx`, `tokens.js` y `lib/helpers.js`. Pendiente que la siguiente IA o Josué en ejecución real confirmen que el calendario abre bien desde el hub "Vida", que crear/editar/eliminar un evento persiste correctamente, y que la cuadrícula se ve bien en un iPhone real (indicadores de punto y tamaño de celdas dimensionados a ojo, sin poder renderizar).

## Fase 4 del Sistema de Personalización Visual Extrema — Presets + gestión de temas (v1.14.0)

### Añadido / cambiado
- `src/tokens.js`: `PALETAS_PREDEFINIDAS` (Fase A7) gana un campo `temaPersonalizado` por entrada (`null` = totalmente automático, igual que se comportaban desde siempre) y tres presets nuevos con overrides reales — **Monocromático** (secundario/terciario grises, no derivados por rotación de tono), **Neón** (fondo/superficie casi negros para que el acento resalte) y **Pastel** (tema claro, fondo casi blanco con un toque de color). `clasico` (el azul metálico original) gana `esOficial: true`. Nuevos `DEFAULT_TEMAS_GUARDADOS` (`[]`) y `MAX_TEMAS_GUARDADOS` (12) para los temas propios de Josué. `DEFAULT_APARIENCIA` gana `modoColorAvanzado` (`false` por defecto).
- `src/App.jsx`: nuevo estado `temasGuardados`, clave de Supabase propia (`'temasGuardados'`), guardado directo sin deshacer. Nueva función `aplicarConjuntoTema({ tema, accent, temaPersonalizado })` — construye el payload de `'ajustes'` con los valores nuevos explícitos en vez de encadenar `updateAccent`+`updateApariencia` (ver Decisiones). `restablecerTemaOficial`, `guardarTemaComoNuevo`, `renombrarTemaGuardado`, `duplicarTemaGuardado`, `eliminarTemaGuardado`, `importarTemaGuardado` (todas con el límite de `MAX_TEMAS_GUARDADOS`, devuelven `false` sin borrar nada si ya está lleno).
- `src/components/GestionTemas.jsx` (nuevo): galería de temas predefinidos (tocar y aplicar, siempre visible), interruptor "Modo avanzado de color", y — solo con el modo avanzado activado — gestión completa de temas propios: guardar el estado actual con nombre, renombrar (tocar el nombre), duplicar, eliminar (con confirmación inline), exportar a `.json`, importar desde `.json` (con validación de formato antes de aceptar), y restablecer el tema oficial en un toque.
- `src/views/SettingsView.jsx`: `<GestionTemas />` integrado en Apariencia, justo debajo de "Color de acento". La tarjeta "Constructor de temas" (Fase 3) ahora solo se muestra si `apariencia.modoColorAvanzado` está activo. Actualizada la nota de "pendiente" de esta categoría: "paletas de color predefinidas completas" ya no está pendiente.

### Decisiones
- **`aplicarConjuntoTema` nunca encadena `updateAccent` + `updateApariencia`.** Ambas guardan el paquete `'ajustes'` completo leyendo el resto de campos del closure de React (patrón ya establecido desde la Fase A3/A5) — llamarlas dos veces seguidas en la misma función no vería el `setState` de la primera todavía (React no re-renderiza a mitad de una función), así que la segunda pisaría a la primera con un accent desactualizado. `aplicarConjuntoTema` construye el payload a mano con los valores nuevos explícitos, así que ese problema no puede pasar — es la única función de todo el sistema de color que cambia tema+accent+temaPersonalizado a la vez.
- **Comparación de "preset activo" deliberadamente aproximada** (`accent === p.accent && apariencia.tema === p.tema`, sin comparar `temaPersonalizado` campo a campo) — mismo criterio que ya usaba la galería de 12 acentos desde la Fase 1: sirve para resaltar visualmente "esto es lo que tienes ahora", no para una igualdad estricta que nadie necesita.
- **Los presets nuevos (Monocromático/Neón/Pastel) traen overrides reales, no solo un acento distinto** — un preset que solo cambiara el acento sería indistinguible en espíritu de tocar un swatch de la galería ya existente; el objetivo del apartado 10 del contexto maestro ("presets adicionales") es ofrecer estilos realmente distintos entre sí.
- **Duplicar/guardar/importar respetan el límite de `MAX_TEMAS_GUARDADOS` (12) rechazando la operación, nunca borrando el más antiguo en silencio** — a diferencia de `historialColor` (recientes/favoritos, Fase 2), donde perder el más antiguo es intrascendente, un tema guardado tiene nombre y significado para Josué; borrar uno sin avisar sería una pérdida de datos real.
- **Importar un tema lo añade a la lista, nunca lo aplica directamente** — mismo criterio que "Importar apariencia" (Fase A3): Josué decide activarlo después de verlo en la lista, en vez de que un archivo aplique cambios visuales de golpe sin confirmación.
- **El modo avanzado vive en `apariencia.modoColorAvanzado`, controla dos tarjetas a la vez** (gestión de temas propios dentro de `GestionTemas.jsx`, y la visibilidad completa de la tarjeta "Constructor de temas" en `SettingsView.jsx`) — un único interruptor, un único lugar de verdad, en vez de que cada tarjeta tenga su propio "modo avanzado" independiente y puedan quedar desincronizadas.
- **Colores de los tres presets nuevos elegidos a mano, no generados por una fórmula** — igual que el resto de `ACCENTS`/`PALETAS_PREDEFINIDAS` ya existentes, son curación manual para que cada preset tenga personalidad propia, no una interpolación matemática que podría dar resultados grises o poco atractivos.

### Verificado en este entorno
- Balance de paréntesis/llaves/corchetes por script en los siete archivos tocados (`tokens.js`, `App.jsx`, `SettingsView.jsx`, `GestionTemas.jsx`, `TemaBuilder.jsx`, `ColorPicker.jsx`, `ui.jsx`) — todos OK.
- **Verificación real con Node** de las 10 paletas predefinidas (7 ya existentes desde la Fase A7 + las 3 nuevas) a través de `aplicarTema()` completo: todas dan campos base/secundario/terciario con hex válido y contraste texto/fondo ≥4.5:1 y textMuted/fondo ≥3:1; confirmado que hay exactamente un preset `esOficial` y que es `'clasico'`; confirmado que los overrides explícitos de Monocromático/Neón/Pastel (fondo, superficie, secundario, terciario) se aplican tal cual, no se sobrescriben. Simulada la lógica de límite de `MAX_TEMAS_GUARDADOS` de forma aislada: bloquea exactamente en el tope, sin descartar nada existente.
- Re-ejecutados también los tests de la Fase 3 (contraste en casos límite, overrides manuales, rotación automática, estados) contra el `tokens.js` actualizado — siguen pasando sin cambios, confirmando que añadir Fase 4 no rompió nada de la Fase 3.
- **Pendiente de confirmación real**: exportar/importar un tema (descarga/subida de archivo `.json` real) solo se puede probar de verdad en el navegador — el código sigue el mismo patrón ya usado y confirmado en "Exportar/Importar apariencia" (Fase A3), pero conviene que Josué lo pruebe una vez.

## Fase 3 del Sistema de Personalización Visual Extrema — Constructor de temas (v1.13.0)

### Añadido / cambiado
- `src/lib/colorEngine.js`: nueva función `rotateHue(hex, degrees)` — rotación de tono en HSV, usada para derivar Secundario (+35°) y Terciario (−35°) del Principal por esquema análogo cuando Josué no los fija a mano.
- `src/tokens.js`: `DEFAULT_TEMA_PERSONALIZADO` (`{ secundario, terciario, fondo, superficie, texto, bordes, estados: { positive, warning, negative, info } }`, todo `null` = automático). `aplicarTema()` gana un cuarto parámetro, `temaPersonalizado`: deriva Secundario/Terciario (auto o a mano, con su propia escala de 11 pasos y su propio texto legible encima, igual que el acento desde la Fase 1), aplica overrides de Fondo/Superficie/Texto/Bordes, aplica overrides de Estados si los hay, y — como última operación, siempre — recalcula `text`/`textMuted` con `ensureContrast` contra el `bg` efectivo, haya o no personalización.
- `src/components/TemaBuilder.jsx` (nuevo): bottom-sheet con una fila por rol (Secundario/Terciario/Fondo/Superficie/Texto/Bordes), cada una con un swatch que abre el `ColorPicker` de la Fase 2 (reutilizado tal cual, sin reescribirlo) y una etiqueta "Auto"/botón "Automático" según esté o no personalizado; tira de vista previa de las 3 escalas generadas (Principal/Secundario/Terciario); sección "Estados avanzados" colapsada por defecto con aviso, para editar Éxito/Aviso/Error/Información sin que estén a la vista por accidente.
- `src/App.jsx`: nuevo estado `temaPersonalizado`, clave de Supabase propia (`'temaPersonalizado'`), guardado directo sin deshacer (mismo criterio que `historialColor`/`personalizacion`). Nueva función `updateTemaPersonalizado` y nueva prop `onPreviewTemaPersonalizado={setTemaPersonalizado}` pasadas a `SettingsView` — mismo patrón preview/commit que `onPreviewAccent`/`onUpdateAccent` desde la Fase 2.
- `src/views/SettingsView.jsx`: nueva tarjeta "Constructor de temas" en Apariencia, justo debajo de "Color de acento", que abre `TemaBuilder`.

### Decisiones
- **Los Estados (éxito/aviso/error/información) se mantienen fijos por defecto**, pero ahora son personalizables desde una sección aparte y colapsada con aviso explícito — resuelve la tensión entre el apartado 8 del contexto maestro (pide que sean personalizables) y la decisión de la Fase 1 (mantenerlos fijos por consistencia de UX, para que un error siempre se reconozca igual). Ninguna de las dos peticiones se ignora: existen y funcionan, pero no están a la vista por accidente.
- **Secundario/Terciario se derivan por rotación de tono (±35°, esquema análogo), no por otro método** (complementario, triádico...) — un esquema análogo da resultados armoniosos casi siempre sin importar el Principal elegido, que es justo lo que pide el apartado 9 del contexto maestro ("generar automáticamente una paleta completa y coherente a partir de un solo color").
- **La red de seguridad de contraste vive enteramente en `aplicarTema()`**, no en `TemaBuilder.jsx` — así ningún componente de UI nuevo (ni uno futuro) tiene que acordarse de comprobar contraste por su cuenta; es una propiedad del motor, no de cada pantalla que lo usa.
- **`TemaBuilder` reutiliza el `ColorPicker` de la Fase 2 sin tocarlo** — cada fila abre el mismo editor completo (espectro, HEX/RGB/HSL, recientes/favoritos) en vez de construir un selector más simple por rol; cumple lo que ya anticipaba el CHANGELOG de la Fase 2 ("la Fase 3 reutilizará este mismo `ColorPicker`... sin tener que reescribirlo").
- **Los swatches de cada fila leen `COLORS.<campo>` directamente** (no recalculan nada por su cuenta) — como `aplicarTema()` ya corre antes de cada render y dejó `COLORS` con el valor efectivo de cada rol (automático o personalizado), el componente de UI no necesita duplicar esa lógica ni arriesgarse a desincronizarse de lo que ve el resto de la app.

### Verificado en este entorno
- Balance de paréntesis/llaves/corchetes por script en los archivos tocados (`colorEngine.js`, `tokens.js`, `App.jsx`, `SettingsView.jsx`, `TemaBuilder.jsx`, `ColorPicker.jsx`) — todos OK.
- **Verificación real con Node** de `aplicarTema()` completo (no solo `colorEngine.js` suelto, esta vez también `tokens.js`): los 12 acentos de `ACCENTS` siguen dando Secundario/Terciario válidos con escalas completas y contraste texto/fondo ≥4.5:1 en tema oscuro; caso límite Fondo+Texto casi negro (`#050505`/`#0A0A0A`, tema oscuro) y caso límite opuesto Fondo+Texto casi blanco (`#FAFAFA`/`#F5F5F5`, tema claro) — ambos recuperados por `ensureContrast` a un contraste válido; overrides manuales de Secundario/Terciario respetados exactamente tal cual se fijaron (no se re-rotan); Secundario/Terciario automáticos confirmados distintos entre sí y del Principal en los 3 acentos probados; override de un Estado (`positive`) respetado, y confirmado que vuelve a su valor fijo de siempre al quitar el override; `altoContraste` (Fase A7) sigue funcionando en conjunto con `temaPersonalizado` sin conflicto.
- **Pendiente de confirmación real**: la interacción táctil de abrir el `ColorPicker` anidado dentro de `TemaBuilder` (dos hojas inferiores superpuestas) solo se puede probar de verdad en un móvil — el cierre al tocar fuera está pensado para que cerrar el `ColorPicker` no cierre también el `TemaBuilder` de detrás (mismo mecanismo `stopPropagation` que ya usa el resto de la app en modales anidados), pero conviene que Josué lo confirme en su iPhone.

## Fase 2 del Sistema de Personalización Visual Extrema — Editor de color avanzado (v1.12.0)

### Añadido / cambiado
- `src/lib/colorEngine.js`: nuevas conversiones HSV (`rgbToHsv`, `hsvToRgb`, `hexToHsv`, `hsvToHex`) — el espacio que usa el área 2D del selector (eje X = saturación, eje Y = brillo, con el tono aparte en un slider), más intuitivo aquí que HSL porque en HSL el 100% de luminosidad siempre da blanco puro sea cual sea la saturación. HSL de la Fase 1 se mantiene, sigue siendo válido para los campos numéricos.
- `src/components/ColorPicker.jsx` (nuevo): el editor de color en sí. Espectro 2D arrastrable (saturación × brillo, con degradado en tiempo real según el tono activo), slider de tono de 360°, campos HEX/RGB/HSL editables a mano, color actual vs. anterior con un toque para revertir, favoritos (estrella) y recientes (swatches), copiar/pegar vía `navigator.clipboard`, y cuentagotas real vía la `EyeDropper` API del navegador — el botón solo aparece si `window.EyeDropper` existe (no está disponible en Safari/iOS, así que en el propio móvil de Josué no se ve, en vez de mostrar un botón roto).
- `src/tokens.js`: `DEFAULT_HISTORIAL_COLOR` (`{ recientes: [], favoritos: [] }`), `MAX_COLORES_RECIENTES` (12) y `MAX_COLORES_FAVORITOS` (24).
- `src/App.jsx`: nuevo estado `historialColor`, clave de Supabase propia (`'historialColor'`), guardado directo sin deshacer (mismo criterio que `notificaciones`/`personalizacion`). Nuevas funciones `registrarColorReciente`/`toggleFavoritoColor`. Nueva prop `onPreviewAccent={setAccent}` pasada a `SettingsView` — ver Decisiones sobre por qué existe aparte de `onUpdateAccent`.
- `src/views/SettingsView.jsx`: la tarjeta "Color de acento" gana un 13º swatch (gradiente cónico arcoíris) que abre el `ColorPicker` — ya no limitado a los 12 acentos fijos, cualquier color es válido para el acento desde hoy mismo.

### Decisiones
- **Vista previa en tiempo real ≠ guardado en cada paso, a propósito.** El `ColorPicker` llama a `onPreview(hex)` en cada píxel de arrastre o cada tecla (retematiza toda la app al instante, solo `setAccent` en memoria) y reserva `onCommit(hex)` — el que de verdad escribe en Supabase y registra en recientes — para los momentos discretos: soltar el arrastre, salir de un campo, tocar un swatch, cerrar el editor. Sin esta separación, arrastrar el dedo por el cuadrado de color habría disparado decenas de escrituras a Supabase por segundo — el apartado 14 de la especificación pide "tiempo real" en la aplicación visual, no necesariamente en cada escritura de red.
- **Se integró ya en "Color de acento"** (el único rol personalizable que existe hoy) en vez de dejar el componente construido pero sin usar — cumple el criterio de "cada fase deja preparada la base para la siguiente, pero también hace algo útil ya". La Fase 3 (constructor de temas) reutilizará este mismo `ColorPicker` para cada rol nuevo que se añada (primario/secundario/fondo/superficie...), sin tener que reescribirlo.
- **Cuentagotas con detección de función, nunca simulado**: `'EyeDropper' in window` decide si el botón aparece. Es un ejemplo más del mismo criterio de todo el proyecto (biometría, notificaciones, Web Push...): nunca mostrar un control que no vaya a funcionar de verdad en el dispositivo real de Josué.
- **HSV para el área 2D, HSL para los campos numéricos** — no se ha unificado en un solo modelo a propósito: cada uno es mejor para lo que hace (HSV para "pintar" visualmente sin zonas muertas, HSL porque sigue siendo el modelo que la mayoría reconoce al teclear un valor a mano).
- Iconos usados en el componente (`X`, `Star`) elegidos porque ya están confirmados funcionando en esta build exacta de `lucide-react` (usados en otros archivos ya entregados) — se evitó a propósito cualquier icono de `lucide-react` no verificado en este entorno (sin acceso a npm para comprobar el paquete instalado), usando texto plano ("Copiar"/"Pegar"/"Cuentagotas") donde no había un icono ya confirmado.

### Verificado en este entorno
- **No se ha podido ejecutar `esbuild`.** Verificación manual: balance de paréntesis/llaves/corchetes por script en los cinco archivos tocados (`colorEngine.js`, `tokens.js`, `ColorPicker.jsx`, `App.jsx`, `SettingsView.jsx`) — todos OK.
- **Verificación real con Node** de las conversiones HSV nuevas: round-trip HEX→HSV→HEX exacto en 12 colores de prueba; simulado el efecto de mover el tono/saturación/brillo por separado (como hará el arrastre real del selector) y confirmado que cada eje cambia de forma independiente sin arrastrar a los otros dos; probado el caso límite de un acento casi negro (`#1A1A1A`) con `buildRolesFromAccent`, que sigue dando `textOnAccent` con contraste 16:1 (excelente).
- Cruzadas las props que pasa `SettingsView.jsx` al `<ColorPicker />` contra su firma real (`initialHex, accent, onPreview, onCommit, onClose, recientes, favoritos, onToggleFavorito`) — coinciden una a una.
- **Pendiente de confirmación real**: el arrastre táctil del cuadrado y el slider de tono (con `touchmove`/`preventDefault` para que no haga scroll de la página mientras se arrastra) solo se puede probar de verdad en un móvil — es el mismo patrón de listeners en `window` que usan la mayoría de selectores de color web, pero conviene que Josué lo pruebe en su iPhone antes de darlo por bueno del todo.

## Fase 1 del Sistema de Personalización Visual Extrema — Motor universal de color (v1.11.0)

### Añadido / cambiado
- `src/lib/colorEngine.js` (nuevo): el motor en sí. Conversión entre HEX/RGB/HSL y OKLCH (fórmulas de Björn Ottosson, las mismas que usa CSS Color 4, escritas a mano porque este entorno no tiene acceso al registro de npm para instalar una librería de color). Contraste WCAG (`relativeLuminance`, `contrastRatio`) y ajuste automático (`ensureContrast`, `bestReadableText`) que empuja un color hacia negro/blanco en pasos de luminosidad OKLCH hasta alcanzar 4.5:1 (AA) contra un fondo dado. Generación de escalas perceptualmente uniformes de 11 pasos (`generateScale`, pasos 50-950) a partir de un solo color. `buildRolesFromAccent` ensambla todo lo anterior en los roles derivados del acento: escala de marca, texto legible sobre el acento, bordes/texto secundarios y terciarios, 5 estados de interacción (hover/active/focus/selected/disabled) y 4 efectos (glow/gradiente/sombra/highlight).
- `src/tokens.js`: `COLORS`/`COLORS_OSCURO`/`COLORS_CLARO` ganan dos roles de "Estados" nuevos, `warning` e `info` (curados por tema, igual que `positive`/`negative` — no derivados del acento, a propósito, ver Decisiones). `aplicarTema` gana un tercer parámetro (`accentHex`): además de aplicar la paleta del tema, ahora calcula y añade los roles derivados del acento sobre el mismo objeto `COLORS` singleton que ya leen por referencia ~20 vistas desde la Fase A3 — ningún archivo de vista necesita cambiar de import para heredar los tokens nuevos.
- `src/App.jsx`: el punto de llamada pasa a `aplicarTema(temaResuelto, apariencia.altoContraste, accent)`. El contenedor raíz gana variables CSS (`--color-bg`, `--color-surface`, `--color-border`, `--color-text`, `--color-text-muted`, además de la ya existente `--accent`) para que `index.css` también pueda consumir tokens en CSS puro, no solo dentro de `style={{}}` en JSX.
- **Migrados a tokens ~20 colores que estaban escritos directamente en componentes** (auditoría completa por `grep` de todo `src/`, ver Decisiones): el `#080A0D` repetido en `App.jsx`, `Auth.jsx`, `ui.jsx` (×3), `EstudiosView.jsx`, `HealthView.jsx`, `LibraryView.jsx` (×2), `NutritionView.jsx` (×2), `PersonalizationView.jsx` (×4), `ProductivityView.jsx`, `RelationView.jsx`, `SettingsView.jsx` (×2), `TrainingView.jsx` y `WellbeingView.jsx` pasa a `COLORS.textOnAccent` (calculado por el motor, no un valor fijo). El `#C9A24B` de los avisos de `HealthView.jsx`/`TrainingView.jsx` pasa a `COLORS.warning`. El track del `<input type="range">` en `index.css` pasa de `#222834` fijo a `var(--color-border, #222834)`.
- `src/views/PredictionsView.jsx`: `COLOR_RIESGO` (mapa fijo calculado una sola vez al cargar el módulo) pasa a `colorRiesgo()`, una función que lee `COLORS` en cada llamada — bug real corregido de paso (ver Decisiones).

### Decisiones
- **`#080A0D` era el hallazgo más importante de la auditoría, no solo una limpieza cosmética.** Era el color de texto fijo sobre CUALQUIER botón de acento en toda la app — funcionaba bien con los acentos por defecto (todos claros/medios), pero si Josué elegía un acento oscuro (Grafito, Morado…) el texto casi negro sobre un fondo casi igual de oscuro habría sido prácticamente ilegible. Verificado con Node ejecutando el motor real contra los 12 acentos de `ACCENTS`, en tema oscuro y en tema claro: los 24 casos dan `COLORS.textOnAccent` con contraste ≥4.5:1 (AA) — antes de este cambio, ninguno de los 12 estaba realmente garantizado.
- **`warning`/`info` se quedan fijos por tema, no derivados del acento** — mismo criterio ya establecido para `positive`/`negative`: un color de "Estados" que cambiara con la personalización del usuario sería una regresión de usabilidad (un aviso "amarillo" que un día es verde según el acento activo confundiría más de lo que ayudaría). La especificación maestra lo agrupa como rol semántico propio, no como parte de "Marca" — se ha respetado esa distinción.
- **Alcance deliberado de "todos los componentes deben consumir tokens" para esta fase**: se migraron los colores hardcodeados que YA EXISTÍAN (~20 encontrados por auditoría), no se reescribió cada vista entera "por si acaso" — el resto de la app ya consumía `COLORS.x`/`accent` correctamente desde la Fase A3. Se dejó explícitamente sin tocar un caso que parecía una violación pero no lo es: el icono de borrar foto en `HealthView.jsx` (`color: '#EDEFF2'`) va sobre un scrim oscuro fijo (`rgba(10,12,16,0.7)`) pensado para ser legible encima de cualquier foto, independientemente del tema activo — convertirlo a `COLORS.text` lo habría roto en tema claro (texto casi negro sobre scrim oscuro). Documentado aquí en vez de "arreglado" a ciegas.
- **`COLOR_RIESGO` en `PredictionsView.jsx` tenía un bug de reactividad real**, no relacionado con hardcodear colores pero descubierto en el mismo repaso: al ser un objeto calculado una sola vez al cargar el módulo (copiando el valor de `COLORS.positive`/`COLORS.negative` en ese instante), se quedaba "congelado" si Josué cambiaba de tema después — nunca se había notado porque nadie lo había probado cambiando de tema en mitad de sesión. Corregido convirtiéndolo en función.
- **Gamut mapping simplificado a clamping directo** en `oklchToHex` (no hay un algoritmo de mapeo de gama perceptual completo) — decisión de alcance explícita: en tonos muy saturados en los extremos de una escala puede perderse algo de croma respecto al ideal matemático, pero nunca produce un color inválido. Documentado en el propio archivo.
- **No se ha tocado ninguna UI todavía** (ni selector visual, ni constructor de temas, ni presets) — eso es, por petición explícita de Josué, el contenido de las Fases 2, 3 y 4, que no empiezan hasta que las pida una a una.

### Verificado en este entorno
- **Verificación real con Node.js, más allá del balance de paréntesis habitual** (novedad de esta fase: al ser funciones puras sin JSX, sí se pueden ejecutar de verdad en este sandbox, aunque `esbuild`/Vite sigan sin estar disponibles): round-trip HEX→OKLCH→HEX y HEX→HSL→HEX exacto en 7 colores de prueba (incluye varios acentos reales); los 12 acentos de `ACCENTS` probados en tema oscuro y claro dan siempre `textOnAccent` con contraste WCAG ≥4.5:1; `relativeLuminance`/`contrastRatio` verificados contra el valor de referencia conocido (blanco/negro = 21:1 exacto).
- Balance de paréntesis/llaves/corchetes por script en los 17 archivos tocados — todos OK. Un falso positivo detectado y confirmado como tal en `LibraryView.jsx` (línea sin tocar en esta fase): el verificador no entiende literales de expresión regular y confunde `\/\/ ` dentro de `/^https?:\/\//i` con un comentario de línea — se verificó a mano que el paréntesis está correctamente balanceado.
- Auditoría completa por `grep` de `#[0-9A-Fa-f]{6}` en todo `src/`: de 64 coincidencias iniciales, 37 eran legítimas (definiciones de `ACCENTS`/`PALETAS_PREDEFINIDAS`/los propios tokens en `tokens.js`), ~20 eran violaciones reales (ya migradas) y 1 se dejó intacta con justificación documentada.
- **Pendiente de confirmación real**: el "tacto" perceptual de las escalas generadas (si los 11 pasos se ven realmente uniformes en una pantalla real, no solo en los números) solo se puede juzgar de verdad en la Fase 2, cuando exista un selector visual para probarlas con distintos colores.

## Fase N4 — Pulido visual final (v1.10.0) — cierra el bloque de navegación (N1-N4)

### Añadido / cambiado
- `src/lib/resumenesHub.js`: cada resumen gana un campo `estado` (`'activo'` | `'vacio'` | `'info'`) — el "indicador de estado" que pedía la especificación original de las tarjetas (icono, nombre, resumen, indicador de estado) y que no se había construido en N1. `'activo'` cuando el módulo tiene datos reales que enseñar hoy/recientes, `'vacio'` cuando todavía no hay nada, `'info'` para los módulos de solo lectura/configuración (Estadísticas, Predicciones, Logros, Ajustes) que no tienen un "vacío" real que señalar. Ningún estado inventa una urgencia que no existe — es descriptivo, no una alarma.
- `src/views/HubView.jsx`: las tarjetas pasan de superficie sólida a "cristal" — fondo translúcido + `backdrop-filter: blur(18px)` (con el prefijo `-webkit-` necesario para Safari/iOS) + un brillo diagonal casi imperceptible, borde semitransparente. Nuevo punto de estado junto al nombre del módulo (color de acento si `'activo'`, apagado si `'vacio'`, ausente si `'info'`). Jerarquía tipográfica más marcada: la primera línea de resumen pasa a usar el color de texto principal (antes iba en `textMuted`, igual que la segunda línea — ahora se distingue mejor cuál es el dato y cuál el contexto). El encabezado "Área" pasa a mayúsculas con tracking amplio (estilo "eyebrow"), separado del título por más aire. Círculo del icono gana borde propio con el color de acento.
- `src/index.css`: nueva regla para `.hub-card-icon` — el círculo del icono gana su propio pellizco de escala (encima del de la tarjeta) durante el gesto de pulsación/expansión de la Fase N3, para sentirse como una pieza con peso propio. Nuevas reglas `.nav-tab-icon`/`.nav-tab-label` (transición de color suave al cambiar de pestaña activa en la barra inferior) y `.back-bar` gana una transición de fondo, para acompañar su nuevo estilo de píldora.
- `src/App.jsx`: la barra "← {Área}" pasa de texto suelto a una píldora con fondo tenue (coherente con el lenguaje "glass" del resto de la pantalla). Los iconos/etiquetas de la barra inferior ganan las clases `nav-tab-icon`/`nav-tab-label` para la transición de color suave.

### Decisiones
- **Con esta fase se cierra el bloque completo de navegación por áreas (N1 a N4)** — misma lógica que cuando A6 cerró el bloque Ajustes: documentado aquí y en HANDOFF.md, sin usar versión mayor (sigue el mismo patrón de incrementos menores `1.x.0` que todas las fases anteriores).
- El indicador de estado usa solo dos señales honestas (`'activo'`/`'vacio'`) en vez de un semáforo de 3+ colores con significados que esta app no puede respaldar con datos reales (ej. "en riesgo", "urgente") — mismo criterio de "nunca simular algo que no existe" de toda la Entrega 1.
- El efecto de cristal (`backdrop-filter`) es puramente estético: como las tarjetas no tienen contenido visual detrás salvo el fondo plano de la app, el "desenfoque" en sí apenas se nota, pero la transparencia + el brillo diagonal sí dan la sensación de superficie de vidrio pedida en la especificación original ("mucho glass/blur"). No se ha podido comprobar el rendimiento real de `backdrop-filter` en Safari/iOS con varias tarjetas a la vez (puede ser más costoso ahí que en Chrome de escritorio) — a vigilar si Josué nota lag al abrir un hub.
- No se tocó nada de estructura (N1), timing de transición de pantalla (N2) ni la secuencia de pulsación de tarjeta (N3) — cambio acotado a superficie visual y al indicador de estado que faltaba.

### Verificado en este entorno
- **No se ha podido ejecutar `esbuild`.** Verificación manual: balance de paréntesis/llaves/corchetes por script en los cuatro archivos tocados (`App.jsx`, `HubView.jsx`, `index.css`, `resumenesHub.js`) — todos OK.
- Cruzados los 18 `case` de `resumenesHub.js` uno a uno: todos devuelven ahora `estado` (ninguno se quedó con solo `linea1`/`linea2`), y el `default` también lo incluye para no romper `HubView.jsx` si algún día aparece un id sin caso propio.
- **Pendiente de confirmación real:** el "tacto" del cristal/blur y el punto de estado solo se pueden juzgar de verdad viéndolos en un móvil, no en el código.

## Fase N3 — Microinteracciones de tarjeta (v1.9.0)

### Añadido / cambiado
- `src/views/HubView.jsx`: al pulsar una tarjeta ya no se navega al instante. Nuevo estado local `expandingId` + `handleAbrir(id)`: marca esa tarjeta como "expandiendo", dispara su animación (`.hub-card-expanding`) y solo tras `EXPAND_MS` (190ms) llama a `onOpenModulo(id)` (la navegación real). Mientras una tarjeta expande, el resto del hub queda deshabilitado (`disabled`) y retrocede levemente (`.hub-card-receding`, opacidad y escala reducidas) para que quede claro dónde está el foco. `useEffect` de limpieza que cancela el `setTimeout` pendiente si el hub se desmonta a medio gesto (ej. Josué toca otra pestaña de la barra inferior mientras la tarjeta sigue expandiendo) — evita que la navegación retrasada aterrice sobre una pantalla distinta a la que se pulsó.
- `src/index.css`: `.hub-card` gana un estado `:active` puramente CSS (sin esperar a JS) — al tocarla se encoge un poco, se aclara (`brightness`) y gana sombra, para la respuesta táctil inmediata. Nueva animación `hubCardExpand` (`.hub-card-expanding`): continúa desde ese mismo estado hacia una escala ligeramente mayor (1.03), más brillo y una sombra más profunda, con `z-index` propio para que se "eleve" por delante de las demás tarjetas. Nueva clase `.hub-card-receding` para las tarjetas no pulsadas mientras una está expandiendo.

### Decisiones
- **Secuencia exacta pedida por Josué:** escala hacia abajo al presionar → brillo/sombra → "elevación" → breve expansión → solo entonces la pantalla nueva desliza (la propia `.module-enter` de N1/N2 ya se encarga de esa parte, sin tocarla en esta fase).
- `EXPAND_MS` (190ms) elegido para que se note el gesto sin sentirse lento — coincide con la duración de la animación `hubCardExpand` en CSS, ambos números deben moverse juntos si se ajustan en el futuro.
- El retraso de navegación es un `setTimeout` fijo, no ligado al ajuste "Reducir movimiento"/"Animaciones desactivadas" de Apariencia (Fase A3) — con esos ajustes activados, la parte visual se neutraliza igual que el resto de la app (la regla global ya fuerza `animation-duration`/`transition-duration` a 0.01ms), pero la espera de 190ms antes de navegar se mantiene. Se documenta como un matiz menor conocido, no un fallo: 190ms es lo bastante corto para no notarse como un retraso real.
- No se tocó nada de N1/N2 (estructura, datos de las tarjetas, transición de pantalla) — cambio acotado a la interacción de pulsación.

### Verificado en este entorno
- **No se ha podido ejecutar `esbuild`.** Verificación manual: balance de paréntesis/llaves/corchetes por script en los dos archivos tocados (`HubView.jsx`, `index.css`) — OK. Import de `useState`/`useRef`/`useEffect` añadido correctamente a la cabecera de `HubView.jsx`.
- Revisado a propósito el orden de los Hooks (con el error real de la Fase A3 todavía como referencia): `useState`/`useRef`/`useEffect` están todos al principio del componente, antes de cualquier `return`/cálculo condicional — no hay ningún `return` temprano en `HubView.jsx`, así que no aplica el riesgo de ese bug aquí, pero se revisó igualmente.
- Confirmado que `animationDelay` del estilo en línea (usado para el retraso de 80ms de la cascada de entrada) se pone a `0ms` en la tarjeta que expande, para que no herede sin querer el retraso de la animación de entrada y la expansión arranque al instante.
- **Pendiente de confirmación real:** que 190ms se sienta bien en un dedo real sobre una pantalla táctil — es un número de partida razonable, pero solo se puede ajustar con certeza probándolo en el móvil de Josué.

## Fase N2 — Pulido de transiciones de pantalla (v1.8.0)

### Añadido / cambiado
- `src/index.css`: nueva variable `--ease-premium: cubic-bezier(0.32, 0.72, 0, 1)` (curva de "deceleración enfática" tipo iOS), usada ahora por las cuatro animaciones del sistema de navegación para que se sientan consistentes entre sí. `hubCardIn` gana un ligero escalado (0.97→1) además del desplazamiento vertical, y pasa de 340ms a 420ms. `moduleSlideIn` gana el mismo escalado (0.98→1) y pasa de 260ms a 340ms. Dos animaciones nuevas: `hubHeaderIn` (el título del área, ej. "Salud", entra con un fundido corto justo antes que las tarjetas) y `backBarIn` (la barra "← {Área}" entra con su propio fundido lateral, más corto y rápido que el contenido de debajo, para sentirse como una capa fija en vez de arrastrar con el resto).
- `src/views/HubView.jsx`: el encabezado del hub (`<div>` con "Área" + nombre) gana `className="hub-header"` y `key={area.id}` — el `key` fuerza que el fundido se repita cada vez que se entra a un área distinta, no solo la primera vez que se monta el componente.
- `src/App.jsx`: el botón "← {Área}" gana `className="back-bar ..."` — su propia animación se combina con la del contenedor `module-enter` que lo envuelve (son transforms independientes de padre e hijo, se suman sin conflicto), dando un efecto de capas en vez de un solo bloque moviéndose entero.

### Decisiones
- **No se tocó el stagger de 80ms entre tarjetas** (lo pidió Josué explícitamente en la especificación original) — solo se refinó la curva y duración de cada tarjeta individual, no el ritmo entre ellas.
- **No se tocaron las microinteracciones de pulsación de tarjeta** (`active:scale-[0.98]` ya existente desde N1) — eso es explícitamente el alcance de la Fase N3 (escala + brillo + sombra + elevación + expansión antes de navegar), no de esta fase.
- Curva `cubic-bezier(0.32, 0.72, 0, 1)` elegida por ser la misma familia de curva de "deceleración enfática" que usan las transiciones de pantalla nativas de iOS — encaja con la referencia visual que dio Josué (Apple, Cal AI, Symmetry) sin necesitar ninguna librería de animación nueva (seguimos sin acceso al registro de npm en este entorno).
- Nada de esto cambia comportamiento ni datos — es puramente visual, cero riesgo de romper algo funcional.

### Verificado en este entorno
- **No se ha podido ejecutar `esbuild`.** Verificación manual: balance de paréntesis/llaves/corchetes por script en los tres archivos tocados (`App.jsx`, `HubView.jsx`, `index.css`) — todos OK.
- Confirmado que las nuevas animaciones siguen dentro de las reglas `html[data-animaciones='desactivadas']`/`html[data-reducir-movimiento='true']` ya existentes (aplican a `*`, sin excepción), por lo que "Reducir movimiento" las sigue neutralizando igual que a las de la Fase N1.
- **Pendiente de confirmación real:** que la curva y duraciones elegidas se sientan bien en un móvil real (a diferencia del código, el "tacto" de una animación solo se puede juzgar viéndola correr de verdad).

## Fase N1 — Nueva navegación por áreas (v1.7.0)

### Añadido / cambiado
- `src/App.jsx`: la barra inferior de 4 accesos rápidos + "Más" (hoja plana con todos los módulos en lista) se sustituye por 5 pestañas fijas: 🏠 Inicio, ❤️ Salud, 📚 Vida, 💼 Gestión, ☰ Más. Nuevo array `AREAS_NAV` (4 áreas, cada una con su lista de ids de módulo) junto al ya existente `MORE_NAV` (catálogo plano, ahora con 18 entradas — se le añaden `sueno`, `nutricion` y `entreno`, antes exentos por vivir fijos en la barra vieja). Tocar Inicio va directo al panel "Hoy" como siempre; tocar cualquiera de las otras 4 pestañas abre primero un "hub" de esa área — nunca se entra directo a un módulo. `renderContent()` intercepta los tabs `area-*` antes del switch de siempre y delega en `HubView`; todos los `case` de módulo del switch quedan intactos, sin tocar ni una vista existente.
- `src/views/HubView.jsx` (nuevo): pantalla de hub — tarjetas grandes (no botones pequeños), una por módulo del área, con icono, nombre, resumen real de 2 líneas y flecha. Respeta el orden/ocultos/iconos personalizados de Josué (Fase 19) filtrando la lista fija de cada área con ese mismo modelo de datos, sin cambiarlo. "Ajustes" sigue fijo al final dentro del hub "Más", fuera de la personalización, mismo motivo de siempre (que nunca desaparezca la forma de deshacer un cambio).
- `src/lib/resumenesHub.js` (nuevo): calcula el resumen de 2 líneas de cada tarjeta a partir de datos reales ya guardados (último peso, horas de sueño, kcal de hoy, racha de hábitos, saldo, etc.) — nunca una cifra inventada; si un módulo no tiene datos todavía, la tarjeta lo dice abiertamente ("Sin registros todavía, toca para añadir el primero").
- `src/App.jsx`: al entrar a un módulo desde un hub aparece una barra "← {Área}" arriba (vuelve al hub, no al Inicio) y la vista entra con un deslizamiento horizontal suave (`module-enter` en `index.css`). Las tarjetas de un hub entran en cascada, con 80ms de retraso entre una y la siguiente (`hub-card` en `index.css`).
- `src/index.css`: nuevas animaciones `hubCardIn` (entrada en cascada de tarjetas) y `moduleSlideIn` (entrada de módulo) — ambas respetan automáticamente "Reducir movimiento"/"Animaciones desactivadas" de la Fase A3, que ya fuerza `animation-duration: 0.01ms` sobre cualquier animación de toda la app.
- Limpieza: se retira el estado `showMore`/`setShowMore` y la hoja modal "Más secciones" (ya no existe una lista plana — la sustituye el hub por área), y la variable `moreNavVisible`/`ajustesNavItem` que solo esa hoja usaba.

### Decisiones
- **Fase 1 de 4 (N1-N4), tal y como se acordó antes de escribir código.** Esta entrega es la N1: estructura de navegación + datos reales + animación de entrada mínima pero presente. Pendientes para fases futuras (N2-N4, solo si Josué pide continuar): refinar el timing de la cascada y el deslizamiento, microinteracciones de pulsación de tarjeta (escala + brillo + sombra + "elevación" antes de la transición), y pulido visual de cristal/blur/tipografía.
- **Ningún módulo cambia de contenido ni de ruta interna** — la reestructuración es solo de "cómo se llega", nunca de "qué se ve dentro". Esto reduce el riesgo de romper algo en 20+ vistas ya construidas.
- **La tarjeta 🤖 IA que Josué listó dentro de "Más" no está incluida todavía** en `AREAS_NAV.area-mas.modulos`: no existe hoy un módulo `ia` real en la app (AXION sigue pendiente de la conversación de diseño aparte). Se deja fuera en vez de simular una tarjeta que no lleva a ningún sitio real — se retoma en cuanto se diseñe AXION.
- Versión saltada de 1.6.0 a 1.7.0 (incremento menor, mismo criterio que las fases A1-A6) — es un cambio grande de UX pero no rompe datos ni rutas de Supabase.

### Verificado en este entorno
- **No se ha podido ejecutar `esbuild`.** Verificación manual: balance de paréntesis/llaves/corchetes por script en los cuatro archivos tocados (`App.jsx`, `HubView.jsx`, `resumenesHub.js`, `index.css`) — todos OK.
- Cruce manual de las 18 entradas de `MORE_NAV` contra las 4 áreas de `AREAS_NAV`: los 18 ids aparecen exactamente una vez cada uno (ninguno duplicado, ninguno huérfano).
- Props de `<HubView />` cruzadas contra su firma (`area, modulos, personalizacion, resumenes, accent, onOpenModulo`) — coinciden.
- Grep final sin resultados para `PRIMARY_NAV` y `showMore` en todo `src/App.jsx`, confirmando que no queda ninguna referencia rota a la navegación anterior.
- **Pendiente de confirmación real:** que la sensación de "entrar" en el módulo (deslizamiento + barra de volver) se sienta natural en un móvil real y no solo en la vista de escritorio.

## Fase A6 — Privacidad (v1.6.0) — cierra el bloque Ajustes (A1-A6)

### Añadido / cambiado
- `src/App.jsx`: `RESET_MODULOS` (mapa de 14 módulos: sueño, calistenia, fútbol, economía, salud, nutrición, estudios, negocio, productividad, objetivos, diario, biblioteca, relación, fe, bienestar — con su label, valor por defecto y setter) y `borrarDatosModulo(id)`, que resetea ese módulo tanto en estado local como en Supabase. Perfil queda fuera (ya tiene su propio restablecimiento desde la Fase A2) y los tres módulos con archivos en Storage (saludFotos, calisteniaVideos, bibliotecaArchivos) quedan fuera a propósito (borrar solo el registro dejaría archivos huérfanos).
- `src/views/SettingsView.jsx`: categoría "Privacidad" pasa de "no construida" a 4 bloques — Panel de transparencia (PIN/biometría/bloqueo automático/notificaciones/sincronización/integraciones de un vistazo), nota sobre qué usa la IA, nota sobre permisos de dispositivo (no aplican — la app no usa cámara/micro/ubicación), y Eliminar datos por categoría (14 filas con confirmación inline por módulo, mismo patrón `confirmandoX` indexado por id).

### Decisiones
- Confirmado por `grep` en todo `src/` que no hay ni un solo `getUserMedia`/`mediaDevices`/`navigator.geolocation` — las fotos/vídeos usan el selector de archivos nativo del sistema (`<input type="file">`), no la cámara en vivo. Por eso el panel de permisos de dispositivo (apartados 178-184 de la especificación) se documenta como "no aplica" en vez de simular toggles de permisos que no existen de verdad.
- Eliminación de cuenta completa (apartado 197) queda fuera: borrar el login (no solo los datos) requiere una función serverless con permisos de administrador de Supabase que no existe en este proyecto. Se documenta como pendiente real, sin promesas.
- El panel de transparencia reutiliza datos ya presentes como props en `SettingsView` (accent, pin, seguridad, notificaciones) — no se guarda ningún dato nuevo, es puramente una vista agregada de lo que ya existe.

### Verificado en este entorno
- **No se ha podido ejecutar `esbuild`.** Verificación manual: balance de paréntesis/llaves/corchetes por script (OK). Los ids usados en `modulosBorrables` (`SettingsView.jsx`) cruzados uno a uno contra las claves reales `loadData`/`saveData` de `App.jsx` para confirmar que cada botón "Borrar" apunta a la clave de Supabase correcta.
- **Con esta fase se cierra el bloque completo Ajustes (Fases A1 a A6)** de la Entrega 1 de la especificación extendida. Lo único que queda de esa entrega es el bloque AXION (apartados 203-1300), pendiente de una conversación de diseño con Josué antes de escribir ningún código (ver sección 0bis y sección 16 de HANDOFF.md).

## Fase A5 — Seguridad avanzada (v1.5.0)

### Añadido / cambiado
- `src/lib/biometria.js` (nuevo): `biometriaSoportada()`, `registrarBiometria(userId, nombre)` y `verificarBiometria(credencialId)` — WebAuthn (`navigator.credentials`) del navegador, sin servidor de verificación (documentado como límite honesto en el propio archivo: mismo nivel de confianza que el PIN, no una autenticación remota).
- `src/tokens.js`: `DEFAULT_SEGURIDAD` (`bloqueoAutomatico`, `biometriaActiva`, `biometriaCredencialId`) y `OPCIONES_BLOQUEO_AUTOMATICO` (Inmediatamente/30s/1min/5min/15min/Nunca, con su duración en ms).
- `src/App.jsx`: nuevo estado `seguridad` (vive dentro de la clave `ajustes`, junto a accent/pin/apariencia — las cuatro funciones de guardado mandan siempre el paquete completo). Nuevo `bloqueado` + temporizador de inactividad (`mousedown`/`keydown`/`touchstart`/`scroll` lo reinician) que bloquea toda la app, no solo una sección; caso especial para "Inmediatamente" que además bloquea al pasar a segundo plano (`visibilitychange`). Nuevo componente `BloqueoAutomaticoGate` (pantalla completa, desbloqueo por biometría si está activada + PIN siempre como respaldo). `updatePin` desactiva la biometría sola si Josué borra el PIN (apartado 145: PIN = respaldo obligatorio).
- `src/views/SettingsView.jsx`: categoría "Seguridad" gana tarjeta Biometría (activar/desactivar, con los tres estados: sin PIN / no soportado / activa / inactiva) y tarjeta Bloqueo automático (`OpcionesFila` sobre `OPCIONES_BLOQUEO_AUTOMATICO`).

### Decisiones
- Biometría como "gesto de desbloqueo rápido local" en vez de intentar simular una autenticación remota real sin tener backend para ello — decisión explícita para no sobre-prometer seguridad que esta arquitectura no puede dar.
- Bloqueo automático por defecto en "Nunca" — no se activa solo, Josué decide si lo quiere y con qué margen.
- `useEffect` de bloqueo automático colocados explícitamente antes de los `return` condicionales de `App.jsx`, con el error de orden de Hooks de la Fase A3 todavía fresco — se revisó a propósito antes de dar la fase por cerrada.

### Verificado en este entorno
- **No se ha podido ejecutar `esbuild`.** Verificación manual: balance de paréntesis/llaves/corchetes por script en los tres archivos tocados (`tokens.js`, `App.jsx`, `SettingsView.jsx`, más el nuevo `biometria.js`) — todos OK.
- **Pendiente de confirmación real:** que WebAuthn funcione en iOS Safari como PWA instalada (soporte variable según versión), y que el bloqueo automático no resulte intrusivo en el uso diario real.

## Fase A4 — Notificaciones reales (v1.4.0)

### Añadido / cambiado
- `src/lib/notificaciones.js` (nuevo): `permisoNotificaciones()` / `pedirPermisoNotificaciones()` (Notification API nativa del navegador) y `notificarSiCorresponde(notificaciones, categoria, clave, titulo, cuerpo)` — comprueba interruptor global, categoría, permiso concedido y horario de descanso (soporta franjas que cruzan medianoche) antes de mostrar nada; evita repetir el mismo aviso el mismo día con una marca en `localStorage` (a propósito no en Supabase — detalle de dispositivo, no dato a sincronizar).
- `src/tokens.js`: `DEFAULT_NOTIFICACIONES` (`activadas`, `categorias` — 10 booleanos, `horarioDescansoActivo/Inicio/Fin`) y `CATEGORIAS_NOTIFICACION` (lista de labels para las 10 categorías: Salud, Sueño, Entrenamiento, Nutrición, Economía, Estudios, Productividad, IA, Objetivos, Sistema).
- `src/App.jsx`: nuevo estado `notificaciones`, nueva clave de Supabase `'notificaciones'` (guardada directa vía `updateNotificaciones`, sin `snapshotAndSave`/deshacer, mismo criterio que `personalizacion`), merge con `DEFAULT_NOTIFICACIONES` al cargar (incluyendo `categorias` anidado). Prop `notificaciones` pasada a `DashboardView` y a `SettingsView`.
- `src/views/DashboardView.jsx`: los tres avisos automáticos de la Fase 20 (`AvisoSuenoCorto`, `AvisoRachaEnRiesgo`, `AvisoExamenSinHoras`) ganan un `useEffect` que llama a `notificarSiCorresponde` con la categoría correspondiente (`sueno`, `productividad`, `estudios`) — primer caso de uso real del sistema de notificaciones.
- `src/views/SettingsView.jsx`: categoría "Notificaciones" pasa de "no construida" a 5 tarjetas — Permiso del sistema (estado en vivo + botón para pedirlo), Activación global, Categorías (10 interruptores), Horario de descanso (franja horaria), Acciones (exportar/importar/restablecer JSON, mismo patrón que Perfil/Apariencia).

### Decisiones
- **Sin Web Push de verdad, a propósito y dicho claro:** implementar notificaciones con la app cerrada del todo exige Service Worker con listener `push`, tabla de suscripciones en Supabase y otra función serverless en Vercel que las dispare — se documenta como pendiente real en vez de simularlo o prometerlo. Lo construido (Notification API mientras la app está abierta) es honesto y útil, no una simulación.
- `notificaciones` vive en su propia clave de Supabase, no dentro de `ajustes` — evita agrandar más el objeto que `updateAccent`/`updatePin`/`updateApariencia` ya tienen que reenviar completo en cada guardado.
- Los tres avisos del Dashboard son el "banco de pruebas" elegido para demostrar que el mecanismo funciona de extremo a extremo, en vez de dejar la categoría de Notificaciones construida pero sin ningún disparador real conectado.

### Verificado en este entorno
- **No se ha podido ejecutar `esbuild`** (sigue sin acceso al registro de npm). Verificación manual: balance de paréntesis/llaves/corchetes por script en los cuatro archivos tocados (`tokens.js`, `App.jsx`, `DashboardView.jsx`, `SettingsView.jsx`, más el nuevo `notificaciones.js`) — todos OK.
- **Cuidado explícito con el orden de los Hooks** (tras el error real detectado y corregido en la Fase A3): los `useEffect` nuevos de `AvisoSuenoCorto`/`AvisoRachaEnRiesgo`/`AvisoExamenSinHoras` se escribieron desde el principio antes de los `return` condicionales de cada componente, recalculando las condiciones de forma segura ante datos ausentes (`ultimoSueno`/`productividad`/`estudios` nulos) para no romper las reglas de Hooks de React.
- **Pendiente de confirmación real:** que el permiso de notificaciones se pueda pedir y conceder de verdad en iOS Safari como PWA instalada (el soporte de Notification API en iOS es limitado y depende de la versión del sistema — puede que Josué no vea el botón funcionar igual que en un navegador de escritorio), y que una notificación llegue de verdad al cumplirse alguna de las tres condiciones de los avisos del Dashboard.

## Fase A3 — Apariencia avanzada (v1.3.0)

### Añadido / cambiado
- `src/tokens.js`: `COLORS` sigue siendo el mismo objeto singleton que ya usan por referencia (nunca desestructurado) unas 20 vistas — se añaden `COLORS_OSCURO` (copia de los valores originales) y `COLORS_CLARO` (paleta nueva: fondo `#F3F4F7`, superficie blanca, texto `#161A21`, etc.) y una función `aplicarTema(nombreResuelto)` que hace `Object.assign(COLORS, ...)` para mutar la paleta activa en el sitio. También `DEFAULT_APARIENCIA` (`tema`, `tamanoTexto`, `densidad`, `radioBorde`, `animaciones`, `reducirMovimiento`) y las listas `TEMAS_DISPONIBLES`, `TAMANOS_TEXTO` (con `px` por opción), `DENSIDADES_INTERFAZ`, `RADIOS_BORDE`, `NIVELES_ANIMACION`.
- `src/App.jsx`: nuevo estado `apariencia` (+ `temaSistemaOscuro` para resolver "automático" contra `window.matchMedia('(prefers-color-scheme: dark)')`, con listener en vivo). `temaResuelto` se calcula y se aplica llamando a `aplicarTema()` de forma **síncrona en el cuerpo del componente**, antes de los `return` condicionales de sesión/carga — así los hijos ya leen el tema correcto en la misma pasada de render, sin esperar a un efecto. Un segundo `useEffect` traduce `apariencia` a atributos reales del DOM: `document.documentElement.style.fontSize` (tamaño de texto — como Tailwind usa `rem`, escala toda la app sola) y `data-radio`/`data-animaciones`/`data-reducir-movimiento` en `<html>`, leídos por CSS en `index.css`. `ajustes` (clave de Supabase) gana el campo `apariencia`; `updateAccent`/`updatePin`/`updateApariencia` mandan siempre el paquete completo (`accent` + `pin` + `apariencia`) porque `saveData` sobrescribe el valor entero, no lo fusiona.
- `src/index.css`: reglas nuevas gateadas por `html[data-radio=...]` que sobrescriben `.rounded-3xl/.rounded-2xl/.rounded-xl/.rounded-lg` con `!important` para Recto/Suave (Redondeado = valores por defecto ya usados, sin override) — nunca toca `.rounded-full`. Reglas gateadas por `html[data-animaciones='desactivadas']`/`html[data-reducir-movimiento='true']` que matan `transition`/`animation` en toda la app, mismo mecanismo que el `@media (prefers-reduced-motion: reduce)` que ya existía.
- `src/views/SettingsView.jsx`: categoría "Apariencia" pasa de 1 tarjeta (solo acento) a 7 — Tema (ToggleTab de pastilla nuevo, `OpcionesFila`), Color de acento (sin cambios), Tamaño de texto, Densidad de interfaz, Bordes, Animaciones (nivel + interruptor "Reducir movimiento" aparte) y Acciones (exportar/importar/restablecer apariencia en JSON, mismo patrón `confirmandoX` que Perfil en la Fase A2). Categoría "Preferencias generales" pasa de "no construida" a informativa (`InfoOnly`): aclara que idioma/zona horaria/país/unidades ya viven en Perfil desde la Fase A2.
- Componente nuevo reutilizable en el propio archivo: `OpcionesFila({ opciones, valor, onChange, accent })` — fila de pastillas de selección única, mismo estilo visual que `DeportesChips` pero exclusivo en vez de múltiple.

### Decisiones
- **Tema real, no solo guardado:** era la pieza que Josué confirmó explícitamente, así que se priorizó que funcionara de verdad (mutación en sitio de `COLORS` + aplicación síncrona) en vez de dejarlo como preferencia decorativa.
- **Densidad de interfaz se guarda pero no tiene efecto visual todavía:** aplicarla de verdad exigiría revisar el espaciado (`p-*`, `gap-*`, `space-y-*`) de las ~20 vistas una por una — demasiado riesgo de romper algo visualmente para esta pasada. Se avisa explícitamente en la propia UI, mismo criterio que "Sistema de unidades" en la Fase A2 (nunca simular una función que no existe de verdad).
- **Animaciones:** de los 4 niveles del apartado 95, solo "Desactivadas" (y el interruptor aparte "Reducir movimiento") tienen efecto real hoy, porque la app tiene muy pocas animaciones propias que graduar entre Completa/Reducida/Mínima. Anotado igual de honesto en la UI.
- **Radios de borde:** override CSS global por atributo en vez de tocar cada `className` de cada vista — más barato y sin riesgo de regresión, a costa de ser un mecanismo "de fuerza bruta" (por eso se limita a las clases de radio, nunca toca tamaño/color/espaciado, y excluye `.rounded-full` a propósito).
- Paletas de color predefinidas (apartado 86), transparencias/materiales (93), estilos de icono alternativos (100-101), fondos con degradado/textura (102) quedan fuera de esta fase — personalización decorativa de bajo valor frente al resto, documentada como pendiente futura en la propia categoría.
- Personalización de widgets del Dashboard (103-106) no se duplica: ya está cubierta por "Pantalla principal" / `PersonalizationView.jsx` desde la Fase 19/20.

### Corrección de compatibilidad hacia atrás
- `updateAccent`/`updatePin` en `App.jsx` guardaban `ajustes` como `{ accent, pin }`, sin `apariencia`. Como `saveData` hace upsert del valor entero de la clave (sobrescribe, no fusiona los campos), cambiar el acento o el PIN después de haber tocado Apariencia habría borrado silenciosamente la apariencia ya guardada. Corregido: las tres funciones (`updateAccent`, `updatePin`, `updateApariencia`) mandan siempre el paquete `{ accent, pin, apariencia }` completo.
- `loadData(uidUser, 'ajustes', ...)` con fallback ampliado a `{ accent, pin, apariencia: DEFAULT_APARIENCIA }`, y `setApariencia({ ...DEFAULT_APARIENCIA, ...(a.apariencia || {}) })` al cargar — mismo patrón de merge que ya se usó para `DEFAULT_PERFIL` en la Fase A2, para que un registro `ajustes` guardado antes de esta fase no cargue con `apariencia` en `undefined`.

### Verificado en este entorno
- **No se ha podido ejecutar `esbuild`** (sigue sin acceso al registro de npm). Verificación manual: balance de paréntesis/llaves/corchetes por script en `tokens.js`, `App.jsx` y `SettingsView.jsx` (los tres OK). Confirmado por `grep` que ningún archivo de `src/` hace `const { ... } = COLORS` — condición necesaria para que la mutación en sitio de `COLORS` se refleje en todas las vistas sin tocarlas.
- **Corrección de un error real detectado en este mismo turno, antes de entregar:** los dos `useEffect` nuevos de `App.jsx` se habían escrito primero después de los `return` condicionales de sesión/carga — eso rompe el orden de los Hooks de React (error "Rendered more hooks than during the previous render" al pasar de la pantalla de carga a la app cargada). Detectado al revisar el propio código antes de darlo por terminado y movido antes de los `return`, junto con la llamada a `aplicarTema()`.
- **Pendiente de confirmación real:** que el cambio de tema se vea correctamente en Vercel, que "Automático" seguido del sistema operativo funcione de verdad en iOS Safari (PWA instalada, no solo Chrome de escritorio), y que el contraste del tema claro sea cómodo en pantalla real — los colores de `COLORS_CLARO` se eligieron a ojo, sin poder renderizar nada en este entorno.

## Fase A2 — Perfil expandido (v1.2.0)

### Añadido / cambiado
- `src/tokens.js`: `DEFAULT_PERFIL` ampliado con `apellidos`, `nombreMostrado`, `sexo`, `pronombres`, `manoDominante`, `pesoObjetivo`, `objetivoPrincipal`, `deportesPracticados` (array), `nivelDeportivo`, `aniosExperiencia`, `lesiones` (array de `{ id, zona, estado, fecha, notas }`), `nivelEducativo`, `estudiosActuales`, `profesion`, `idioma`, `zonaHorariaAutomatica`/`zonaHorariaManual`, `pais`, `region`, `sistemaUnidades` — todos los campos anteriores intactos. Nuevas listas de opciones: `SEXOS_PERFIL`, `MANOS_DOMINANTES`, `OBJETIVOS_PRINCIPALES`, `DEPORTES_DISPONIBLES`, `NIVELES_DEPORTIVOS`, `ANIOS_EXPERIENCIA_OPCIONES`, `ESTADOS_LESION`, `NIVELES_EDUCATIVOS`, `IDIOMAS_DISPONIBLES` (solo español por ahora), `SISTEMAS_UNIDADES` (solo se guarda la preferencia, sin conversión real todavía).
- `src/views/SettingsView.jsx`: categoría "Perfil" reescrita, pasa de 1 tarjeta mínima a 7: **Datos básicos** (nombre, apellidos, nombre mostrado, fecha de nacimiento editable, sexo, pronombres), **Información física** (altura, peso, peso objetivo, mano dominante, nivel de actividad), **Información deportiva** (objetivo principal, `DeportesChips` — selector múltiple de pastillas sobre `DEPORTES_DISPONIBLES`, nivel deportivo, años de experiencia, `LesionesEditor` — alta/baja de lesiones con zona/estado/fecha/notas), **Información académica** (nivel educativo, estudios actuales, profesión), **Información general** (idioma, zona horaria automática/manual, país, región, sistema de unidades), **Cálculos corporales** (sin cambios) y **Acciones** (exportar perfil a JSON, importar desde JSON con confirmación inline antes de sobrescribir, restablecer perfil completo con confirmación inline).
- Dos componentes nuevos en el propio `SettingsView.jsx`: `DeportesChips({ value, onChange, accent })` y `LesionesEditor({ value, onChange, accent })`.
- `src/App.jsx`: el efecto que carga el perfil guardado cambia de `setPerfil(p)` a `setPerfil({ ...DEFAULT_PERFIL, ...p })`.

### Decisiones
- El patrón de confirmación inline para importar/restablecer reutiliza el mismo `confirmandoX` + caja `COLORS.surface2` ya establecido en `PersonalizationView.jsx` (`confirmandoOcultar`), no uno nuevo.
- Importar perfil hace `{ ...DEFAULT_PERFIL, ...pendingImport }`: un JSON incompleto no deja campos en `undefined`.
- Zona horaria y sistema de unidades solo se guardan como preferencia en esta fase — no hay lógica de conversión de unidades ni de horario en el resto de la app todavía; queda anotado en la propia UI para no sugerir algo que no está activo.

### Corrección de compatibilidad hacia atrás
- `App.jsx` cargaba el perfil con `setPerfil(p)` directo. Como `loadData()` no fusiona con el valor por defecto, el perfil real de Josué (guardado antes de esta fase) habría cargado con todos los campos nuevos en `undefined` — rompiendo por ejemplo `.includes()` sobre `deportesPracticados`. Corregido a `setPerfil({ ...DEFAULT_PERFIL, ...p })`, mismo patrón que ya se usó para Calistenia en la Fase 5.

### Verificado en este entorno
- **No se ha podido ejecutar `esbuild`** (sigue sin acceso al registro de npm en este entorno). Verificación manual: balance de paréntesis/llaves/corchetes comprobado con script sobre `SettingsView.jsx` completo (OK, 617 líneas). Cruzado uno a uno contra el código real: `GhostBtn` acepta prop `icon` y la renderiza (`components/ui.jsx`), `COLORS.negative` existe en `tokens.js`, `TextInput` pasa `{...rest}` (acepta `disabled`, `type`, etc. sin problema), `Field`/`Select` sin cambios de firma.
- **Pendiente de confirmación real:** que el perfil de Josué ya guardado en Supabase sigue cargando bien con los campos nuevos, que exportar/importar/restablecer perfil funcionan de verdad, y que `DeportesChips`/`LesionesEditor` se ven y funcionan correctamente en pantalla.

## Fase A1 — Ajustes: arquitectura general (v1.1.0)

### Añadido / cambiado
- `src/views/SettingsView.jsx` reescrito por completo: pasa de ser una única pantalla larga a un centro de categorías (cabecera + buscador de categorías, tarjetas con icono/título/descripción/flecha, pantalla propia por categoría con botón atrás), siguiendo el orden fijo del apartado 4 de `ESPECIFICACION_AJUSTES_ENTREGA1.md`: Perfil, Apariencia, Pantalla principal, Preferencias generales, Notificaciones, IA, Seguridad, Privacidad, Datos, Sincronización, Integraciones, Accesibilidad, Funciones experimentales, Información.
- Categorías con contenido real (todo el contenido anterior reubicado, nada eliminado): **Perfil** (nombre/altura/peso/actividad + cálculos corporales, igual que antes), **Apariencia** (selector de color de acento, igual que antes), **Pantalla principal** (envuelve `PersonalizationView.jsx` sin tocarla, ahora como categoría en vez de estar siempre apilada), **Seguridad** (PIN + nota sobre biometría pendiente + botón de cerrar sesión, movido aquí), **Datos** (exportar CSV/Excel + deshacer).
- **Sincronización** e **Integraciones**: tarjeta informativa honesta en vez de un "próximamente" vacío — explican el estado real (sincronización automática con Supabase ya activa; sin integraciones todavía).
- Resto de categorías (Preferencias generales, Notificaciones, IA, Privacidad, Accesibilidad, Funciones experimentales): aviso de "todavía no construida" con la fase donde está planificada — nunca un control decorativo que no hace nada.
- `src/App.jsx`: el `case 'ajustes'` ya no renderiza `<SettingsView/>` + `<PersonalizationView/>` apiladas — `SettingsView` recibe también las props de personalización y las reenvía a su categoría interna "Pantalla principal". Import de `PersonalizationView` en `App.jsx` reducido a solo el named export `ICONOS_PERSONALIZABLES_MAP`, que es lo único que sigue usando directamente.
- Versión mostrada en la nueva categoría "Información" leída de verdad de `package.json` (import JSON nativo de Vite), no hardcodeada.

### Decisiones
- El buscador de esta fase filtra tarjetas de categoría (nombre + descripción), no ajustes individuales dentro de cada categoría — eso tiene sentido cuando haya más categorías con contenido real (A2 en adelante).
- Ninguna categoría sin construir muestra controles: mismo criterio que el resto de la app (nunca simular una función que no existe).
- Modo claro/oscuro (Fase A3) y biometría (Fase A5) quedan anotadas explícitamente como confirmadas por Josué dentro de sus categorías correspondientes, para que la siguiente IA no vuelva a preguntarlo.

### Verificado en este entorno
- **No se ha podido ejecutar `esbuild`** (sin acceso al registro de npm en este entorno, igual que en el turno anterior). Verificación manual: balance de paréntesis/llaves/corchetes comprobado con un script, y las firmas de props de `PersonalizationView` (`export default function PersonalizationView({ modulos, personalizacion, onMove, onToggleOculto, onSetIcono, onTogglePinExtra, onToggleFavorita, onMoveFavorita, modo, onSetModo, accent })`) y de `hexToRgba` (`src/lib/helpers.js`) verificadas contra el código real antes de usarlas en `SettingsView.jsx`.
- **Pendiente de confirmación real:** que las 5 categorías con contenido (Perfil, Apariencia, Pantalla principal, Seguridad, Datos) abren y funcionan igual que antes, que el PIN sigue creándose/protegiendo, y que Pantalla principal sigue reordenando/ocultando módulos correctamente.

## Decisiones de Josué sobre la Entrega 1 (documentación, sin código)

### Confirmado por Josué
- **Modo claro y modo oscuro, ambos disponibles** (Fase A3) — hasta ahora la app era "solo modo oscuro" (Fase 1). Implica crear un set de tokens de color para el tema claro además del oscuro ya existente en `tokens.js`.
- **Biometría sí** (Fase A5) — Face ID/Touch ID/huella como método adicional de desbloqueo, con el PIN como respaldo obligatorio. Deroga la regla antigua "No implementar biometría — solo PIN" (HANDOFF sección 17, actualizada).

### Actualizado en HANDOFF.md
- Sección 0bis (plan de fases), sección 2 (filosofía), sección 17 (reglas) e instrucciones finales — las tres menciones de "solo modo oscuro" y "no biometría" quedan corregidas para que ninguna IA futura las bloquee por error.

### Sin cambios de código todavía
- Estas son decisiones de alcance, no implementación — las Fases A3 y A5 siguen sin construirse.

## Corrección de contexto — Josué no usa Replit, despliega vía Vercel (documentación, sin código)

### Corregido
- `HANDOFF.md`: eliminadas/corregidas todas las referencias a "Replit" como entorno de trabajo de Josué (banner inicial, secciones 9, 11, 12, 16, 18 e instrucciones finales). Josué ha confirmado que no usa Replit — trabaja desde el iPhone y despliega vía **Vercel**. El antiguo "problema abierto de exponer el puerto en Replit" nunca fue real para su flujo y queda marcado como obsoleto, para que ninguna IA futura vuelva a intentar depurarlo.
- Se deja explícito que no se conoce el detalle exacto de cómo Josué edita/sube código desde el iPhone hacia Vercel (repositorio Git con auto-deploy, dashboard de Vercel u otro mecanismo) — no asumirlo, preguntarlo si hace falta para depurar un problema de despliegue real.

### Sin cambios de código
- Solo documentación. Ningún archivo de `src/`, `api/`, `supabase/` ni `package.json` tocado en este turno.

## Alcance nuevo (post-Prompt Maestro) — Especificación extendida "Ajustes / AXION", Entrega 1 (documentación, sin código)

### Añadido
- `ESPECIFICACION_AJUSTES_ENTREGA1.md` (nuevo, en la raíz del proyecto): transcripción de la especificación funcional que Josué pegó en el chat ("SISTEMA OPERATIVO PERSONAL — ESPECIFICACIÓN FUNCIONAL — MÓDULO AJUSTES — ENTREGA 1"), 1300 apartados. Apartados 1–202 (arquitectura de Ajustes, Perfil, Apariencia, Notificaciones, Seguridad, Privacidad) transcritos íntegros. Apartados 203–1300 (bloque "AXION", el motor de IA descrito por esta especificación) resumidos por bloques temáticos por su extensión (~1100 apartados) — el detalle literal vive en el propio chat si hace falta releerlo.
- `HANDOFF.md` sección **"0bis. Especificación extendida (post-v1.0)"**: plan de fases propuesto (Fase A1–A6 para el bloque Ajustes, realista con la arquitectura actual) y análisis de viabilidad del bloque AXION (arquitectura de IA de nivel empresarial — multiagente, bus de eventos, multi-proveedor, presupuestos, observabilidad — que excede con mucho la arquitectura real del proyecto, una PWA con una sola función serverless proxy a un único proveedor de IA). Se documenta como visión a largo plazo, no como fase inmediata; se propone un "AXION Lite" pragmático como alternativa realista.
- Conflicto detectado y documentado: la especificación pide biometría (Face ID/Touch ID/huella) como método de desbloqueo; la regla vigente del proyecto (HANDOFF sección 17) prohíbe explícitamente implementar biometría. Pendiente de que Josué aclare cuál prevalece antes de tocar Seguridad avanzada.

### Decisiones
- No se ha escrito ni modificado ningún archivo de código en este turno — es puramente intake y planificación de una especificación nueva, muy por encima en volumen de cualquier fase anterior.
- Se resume (no se transcribe íntegro) el bloque AXION por pura extensión práctica, no por decisión de recortar contenido — está señalado explícitamente en el propio archivo para que ninguna IA futura lo confunda con la especificación completa.
- Se etiqueta todo como "Entrega 1" porque el propio documento de Josué se autotitula así — se esperan más entregas de esta misma memoria de ~1200 apartados para otros módulos.

### Pendiente
- Confirmar con Josué el conflicto de biometría antes de construir Fase A5.
- Confirmar con Josué si abrir modo claro/automático (Fase A3) contradice o sustituye la decisión de "solo modo oscuro" de la Fase 1.
- Confirmar con Josué si quiere el subconjunto "AXION Lite" propuesto o construir la especificación AXION literal (con la advertencia honesta de complejidad ya documentada).
- Recibir la Entrega 2 (y siguientes) de la memoria de ~1200 apartados.

## Alcance nuevo (post-Prompt Maestro) — Iconos PWA (v1.0.1)

### Añadido
- `public/icon-192.png` y `public/icon-512.png`: iconos de la PWA que `public/manifest.json` referenciaba desde la Fase 2 pero que no existían todavía (pendiente de la sección 18 del HANDOFF).
- Diseño: tres anillos concéntricos al estilo "anillos de actividad" (Apple Fitness/Symmetry — coherente con la referencia de diseño premium del proyecto, sección 2 del HANDOFF), usando los tres primeros colores de `ACCENTS` (`src/tokens.js`): azul metálico `#5C7E9A`, dorado `#C9A24B`, verde salvia `#5E8C6A`, sobre fondo oscuro `#0A0C10` con degradado sutil hacia `#12151B`, esquinas redondeadas. Generados con Pillow a 4x y reescalados con antialiasing (script puntual, no forma parte del proyecto Vite).

### Decisiones
- No es una fase del Prompt Maestro (ya cerrado en v1.0.0) — se trata como alcance nuevo/tarea práctica pendiente, tal como indica la sección 16 del HANDOFF.
- Colores tomados directamente de `ACCENTS`/`COLORS` en `tokens.js`, sin introducir ningún color fuera del sistema de tokens ya establecido.
- Sin dependencias npm nuevas — los iconos se generaron fuera del proyecto (Python/Pillow) y se copiaron ya terminados a `public/`.

### Verificado en este entorno
- Los dos PNG se generaron y se revisaron visualmente a tamaño real (192 y 512 px).
- **No se pudo ejecutar el chequeo habitual de `esbuild`**: este entorno concreto no tiene acceso al registro de npm (`403 Forbidden` al intentar instalarlo), a diferencia de turnos anteriores. No se ha tocado ningún archivo `.js`/`.jsx`, solo se añadieron los dos PNG y se actualizó `manifest.json`... (sin cambios reales, ya apuntaba a las rutas correctas) y `package.json` (versión). Riesgo de regresión mínimo, pero queda registrado para la siguiente IA.

### Pendiente
- Que Josué instale la PWA de verdad en su iPhone y confirme si el diseño del icono le convence, o si prefiere otro (es una elección de la IA, no algo que él especificara).
- Todo lo demás de la sección 9/18 del HANDOFF (Vercel, ejecución real de las Fases 8-21, importaciones, exportación a PDF) sigue pendiente.

## Fase 21 (cierre) — Pulido final y QA: repaso visual/contraste real, módulo por módulo (v1.0.0 — Prompt Maestro completo)

### Revisado
- Repaso de contraste y coherencia visual leyendo el JSX de las 20 vistas (`src/views/*.jsx`) una por una, comparando contra el patrón de `components/ui.jsx` (`Card`, `SectionTitle`, escalas `text-xs`/`text-sm`/`text-lg font-bold`, iconos junto a cabeceras de `Card` a `size={16}`): tamaños de texto (`grep` de todas las clases `text-*` en las 20 vistas), colores fuera de `COLORS`/`accent` (ninguno encontrado — ya se había revisado por `grep` en la primera pasada de esta misma fase), texto atenuado (`COLORS.textMuted`) sobre fondo de acento (ninguno encontrado — bajo contraste no aplica en ningún sitio), y consistencia de las cabeceras de sección.
- Sin hallazgos de gravedad. Dos inconsistencias menores corregidas (ver "Corregido").

### Corregido
- `SettingsView.jsx`: la cabecera "Personalización" duplicaba a mano el marcado exacto de `SectionTitle` (mismas clases, mismo `fontFamily` inline) en vez de usar el componente compartido — ahora usa `<SectionTitle>`, igual que las otras 17 vistas que ya lo hacían.
- `TrainingView.jsx`: el icono `Trophy` de la cabecera de cada habilidad usaba `size={15}` en vez del `size={16}` que usan el resto de iconos junto a cabeceras `text-sm font-semibold` en toda la app.

### Cierre de fase
- Con este repaso visual/contraste quedan cerradas las tres partes de la Fase 21 (código de exportación/sincronización, tono de los 13 `AIPanel`, y este repaso visual) — **el Prompt Maestro completo de las 21 fases (sección 0 del HANDOFF) queda terminado**. `package.json` → **v1.0.0**.
- Límite honesto de este repaso: sigue siendo una lectura de código, no una app renderizada de verdad (Claude no puede ejecutarla en este entorno) — cubre clases de Tailwind, colores y componentes compartidos, no cosas que solo se ven en pantalla real (p. ej. saltos de línea en dispositivos concretos, o si un `grid-cols-2` se desalinea con contenido real muy largo). Cualquier detalle así que Josué note al usar la app de verdad merece su propio arreglo puntual, no una reapertura de la Fase 21.

---

## Fase 2 — Backend real, migración fuera de Artifacts, exportación, historial y PIN preparado

### Añadido
- Migración completa de un único archivo Artifact a un proyecto Vite real con estructura de carpetas (`src/lib`, `src/components`, `src/views`, `src/tokens.js`).
- Autenticación real con Supabase: registro, inicio de sesión, cierre de sesión (`src/components/Auth.jsx`, `src/lib/supabase.js`).
- Persistencia real en base de datos: tabla `app_data` en Supabase con seguridad por fila (RLS) — cada usuario solo accede a sus propios datos (`supabase/schema.sql`).
- Proxy seguro de IA: función serverless `api/ask-ai.js` que guarda `ANTHROPIC_API_KEY` solo en el servidor; el cliente (`src/lib/ai.js`) ya no llama a Anthropic directamente.
- Manejo elegante de "IA no configurada": si falta la clave, el resto de la app sigue funcionando y el panel de IA muestra un aviso claro en vez de fallar.
- Exportación de datos a CSV y Excel desde Ajustes (`src/lib/exportData.js`).
- Historial de cambios (últimos 10 pasos) y botón "Deshacer último cambio" en Ajustes.
- Mecanismo de PIN preparado: crear/cambiar PIN desde Ajustes, listo para proteger el futuro módulo de Relación.
- `manifest.json` para que la PWA sea instalable desde Safari.
- `SETUP.md`: guía paso a paso para poner en marcha Supabase, ejecutar el proyecto en local, y desplegarlo en Vercel.

### Corregido
- Colores de ingresos/gastos (verde/rojo en Economía), antes sueltos en el código, ahora centralizados como `COLORS.positive` / `COLORS.negative` en `src/tokens.js`.
- El prompt `AI_SYSTEM` ahora exige explícitamente que la IA cite en qué dato concreto basa cada afirmación (antes solo pedía tono y brevedad).

### Sin cambios (heredado de la Fase 1)
Todo el diseño visual, la paleta de colores y el comportamiento de Dashboard, Sueño, Entrenamiento y Economía se mantienen exactamente igual — solo han cambiado de sitio dentro de la nueva estructura de carpetas.

### Pendiente para cerrar esta fase de verdad
- Decisión sobre activar `ANTHROPIC_API_KEY` en producción (tiene coste real — ver `SETUP.md`).
- Verificación de que `npm install` / `npm run dev` funcionan sin errores: este código no ha podido compilarse ni ejecutarse en el entorno donde se escribió (sin acceso a red), así que es un primer borrador cuidado pero no probado todavía.
- Importación de datos (CSV del banco), detección de duplicados, y exportación a PDF quedan para más adelante.

## Fase 2 (continuación) — credenciales de Supabase recibidas

### Añadido
- `.env` real del proyecto, con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` ya rellenos con los valores que dio Josué.
- `.gitignore` para que `.env` nunca se suba por error a un repositorio.

### Corregido
- La URL de Supabase que pasó Josué tenía un error de dominio (`...supabase.com`) — corregida a `https://gbletrhhdppuiwrpoppf.supabase.co`, que es el dominio real de todos los proyectos de Supabase.

### Confirmado
- La clave que dio Josué (`sb_publishable_...`) es el nuevo formato "publishable" de Supabase: el reemplazo actual de la antigua `anon key`, pensado para ir en código de cliente — no es un dato secreto.

### Pendiente
- Confirmar que `supabase/schema.sql` se ejecutó en el proyecto real de Supabase de Josué.
- Confirmar que `npm run dev` conecta sin errores — sigue sin poder probarse en un entorno con acceso a red real.

## Fase 2 (cierre) — verificada funcionando de verdad

### Confirmado por Josué, en su propio dispositivo (iPhone, sin ordenador, vía Replit)
- `supabase/schema.sql` ejecutado correctamente — tabla `app_data` confirmada con `select * from app_data` (0 filas, sin error).
- `npm install` y `npm run dev` funcionan sin errores en un entorno real (Replit).
- La app arrancó, se abrió en el navegador y quedó operativa — Fase 2 cerrada y verificada, no solo escrita.

### Pendiente (no bloqueante, sigue abierto)
- Despliegue en Vercel todavía no confirmado.
- Decisión sobre `ANTHROPIC_API_KEY` en producción todavía no tomada.
- Iconos PWA (`icon-192.png`, `icon-512.png`) todavía no generados.

## Fase 3 — Salud

### Añadido
- Nuevo módulo **Salud** (`src/views/HealthView.jsx`), con tres pestañas:
  - **Medidas**: peso, grasa corporal, frecuencia cardíaca y tensión (sistólica/diastólica), con notas libres. Gráfico de evolución del peso (recharts) cuando hay al menos dos registros con peso. Aviso in-app si han pasado 7 días o más desde el último registro (o si todavía no hay ninguno) — el "recordatorio" que pedía el Prompt Maestro, ya que las notificaciones push no son fiables en una PWA de iPhone.
  - **Historial médico**: eventos puntuales de tipo Lesión, Enfermedad, Medicamento, Síntoma, Vacuna, Análisis médico u Otro (`TIPOS_HISTORIAL_MEDICO` en `src/tokens.js`), cada uno con fecha y descripción libre.
  - **Fotos de progreso**: subida de fotos reales a un bucket privado de Supabase Storage (`progreso`), con nota opcional por foto, miniaturas y borrado. Protegidas por el mismo PIN que se dejó preparado en la Fase 2 (componente nuevo `PinGate` en `src/components/ui.jsx`, reutilizable después para el módulo de Relación).
- `src/lib/supabase.js`: `uploadProgressPhoto`, `getSignedPhotoUrl` (URL firmada de 1 hora, el bucket es privado) y `deleteProgressPhoto`.
- `supabase/schema.sql`: bloque nuevo al final que crea el bucket `progreso` y sus políticas de Storage (cada usuario solo lee/escribe/borra dentro de su propia carpeta `user_id/...`). Pensado para ejecutarse como bloque independiente sin repetir lo ya ejecutado en la Fase 2.
- `SETUP.md`: nuevo paso 5 explicando cómo ejecutar ese bloque y comprobar que el bucket se creó.
- Cálculos corporales (IMC/BMR/TDEE), que ya vivían en Ajustes desde la Fase 1, se mantienen sin tocar — Salud registra la **evolución** de medidas en el tiempo, Ajustes sigue mostrando el cálculo orientativo a partir del perfil actual.
- IMC/BMR/TDEE y el nuevo módulo de Salud siguen sin dar objetivos calóricos ni de peso estrictos — el prompt de IA de este módulo lo prohíbe explícitamente y lo recuerda en pantalla.
- Salud (medidas + historial médico, sin fotos) se integró en: el sistema de deshacer/historial de cambios ya existente, y la exportación a CSV/Excel (`src/lib/exportData.js`).

### Decisiones de esta fase
- Las fotos de progreso quedan **fuera** del sistema de "deshacer": implican un archivo real subido a Storage, y deshacer no debía dejar archivos huérfanos sin ninguna referencia en la base de datos.
- Las fotos tampoco se incluyen en la exportación CSV/Excel (son binarios, no datos tabulares) — se gestionan y se borran directamente desde la pestaña Fotos.
- El bucket de Storage es privado (no público): las fotos nunca tienen una URL fija accesible por cualquiera: se sirven con URLs firmadas de una hora, generadas en el momento.

### Verificado en este entorno (sin red real, igual que en la Fase 2)
- Todos los archivos tocados o creados pasan un chequeo de sintaxis con `esbuild`.
- Un bundle completo de la app (con las dependencias de `npm` marcadas como externas) resuelve sin errores todos los imports/exports entre archivos locales nuevos y existentes.
- **Sigue sin poder ejecutarse `npm run dev` de verdad en este entorno** (sin acceso a red) — como en la Fase 2, la primera prueba real la hace Josué.

### Pendiente para cerrar esta fase de verdad
- Que Josué ejecute el bloque nuevo de `supabase/schema.sql` (bucket `progreso`) y confirme que aparece en Storage.
- Que pruebe subir y borrar una foto de progreso real desde su iPhone.
- Que confirme que el PIN (si no lo ha creado todavía) se puede crear desde Ajustes y que protege correctamente la pestaña Fotos.

## Fase 4 — Nutrición

### Añadido
- Nuevo módulo **Nutrición** (`src/views/NutritionView.jsx`), con tres pestañas:
  - **Comidas**: registro manual de nombre, calorías, proteínas, carbohidratos, grasas y fibra, con totales del día en la parte superior.
  - **Agua**: contador diario en mililitros, con botones +/- de un vaso (250 ml).
  - **Favoritos**: cualquier comida se puede guardar como plantilla (`onAddFavorito`) y registrarse de nuevo con un toque desde esta pestaña (`onRegistrarFavorito`).
- **Escaneo de código de barras** (`src/components/BarcodeScanner.jsx`, nuevo): abre la cámara trasera con `@zxing/library` (nueva dependencia) y decodifica en directo — elegido en vez de la `BarcodeDetector` nativa del navegador porque Safari/iOS no la soporta.
- **Open Food Facts** (`src/lib/openFoodFacts.js`, nuevo): consulta gratuita y sin clave por código de barras; devuelve nombre, marca y macros por 100 g. El formulario recalcula automáticamente los valores según los gramos que el usuario indique que ha comido de verdad.
- **Escaneo de comida por foto**: `api/ask-ai.js` ahora acepta una imagen opcional en el body (base64) y la reenvía a Anthropic como bloque de imagen; `src/lib/ai.js` añade `askAIWithImage()`. La IA devuelve solo un JSON (nombre + macros aproximados) que rellena el formulario — el usuario siempre revisa y ajusta antes de guardar, nunca se guarda automático.
- Nutrición (comidas + agua) integrada en el sistema de deshacer/historial y en la exportación CSV/Excel (`src/lib/exportData.js`).
- Panel de IA "Analizar mi nutrición", con la misma instrucción explícita que Salud: nunca objetivos calóricos estrictos, foco en hábitos y constancia.
- **Navegación reestructurada**: con Salud y Nutrición ya son 7 secciones, se dividió la barra inferior en 4 accesos rápidos (Hoy, Sueño, Entreno, Nutrición) + un botón "Más" que abre Salud/Economía/Ajustes en una hoja inferior. Pensado para que las próximas 9 fases con módulo nuevo no vuelvan a apretar la barra.
- `SETUP.md`: nuevo paso sobre permisos de cámara en Safari (necesarios para el escaneo de código de barras y de foto).

### Decisiones de esta fase
- El escaneo por foto **nunca guarda automáticamente** — solo rellena el formulario para revisión manual, igual de importante aquí que en Salud: es una estimación de la IA, no una medición.
- Se reutilizó el mismo endpoint `api/ask-ai.js` para texto e imagen (con un parámetro `image` opcional) en vez de crear un segundo endpoint — un único sitio donde vive la clave de Anthropic es más fácil de mantener seguro.

### Verificado en este entorno (sin red real, igual que en fases anteriores)
- **Nuevo esta fase:** además del chequeo de sintaxis archivo a archivo, se verificó con `esbuild` un **bundle completo** de la app entera (`src/main.jsx` como entrada, dependencias de `npm` como `external`) — confirma que absolutamente todos los imports/exports entre los 18 archivos del proyecto resuelven correctamente y no hay errores de sintaxis en ninguno, incluida la función serverless ampliada.
- `package.json` y `manifest.json` comprobados como JSON válido tras las ediciones.
- **Sigue sin poder ejecutarse `npm run dev` de verdad en este entorno** (sin acceso a red) — la primera prueba real la hace Josué, como en todas las fases anteriores.

### Pendiente para cerrar esta fase de verdad
- Que Josué pruebe de verdad: registrar una comida manual, escanear un código de barras real, hacer una foto de un plato real, ajustar agua, guardar y volver a registrar un favorito.
- Decisión sobre `ANTHROPIC_API_KEY` en producción (ahora también necesaria para el escaneo de foto, no solo para los paneles de texto).

### Confirmado por Josué
- Probado en real (Replit, iPhone): funciona correctamente.

## Fase 5 — Calistenia a fondo

### Añadido
- **Cada habilidad de calistenia (Handstand, Front Lever, Back Lever, Planche, Human Flag, Muscle Up, L-Sit) ahora es una tarjeta desplegable** en `TrainingView.jsx`, con el slider de nivel de siempre arriba y, al desplegarla, cuatro pestañas nuevas:
  - **Progresión**: lista de pasos tipo checklist. Se pueden añadir a mano, marcar como hechos, borrar, o generarlos con IA (botón "Generar progresión con IA" — pide a la IA de 4 a 6 pasos concretos según el nivel actual, en JSON, y los añade a la lista para que Josué los edite después). Las tres formas que pedía el Prompt Maestro (IA / manual / IA + edición) quedan cubiertas con el mismo mecanismo: todo pasa por la misma lista editable.
  - **PRs**: récords personales con fecha automática, valor libre (ej. "12 reps", "25s") y nota opcional.
  - **Sesiones**: botón "He entrenado esto hoy" (una vez al día por habilidad) y cálculo de la racha de días consecutivos. Aviso de "descanso recomendado" si la racha llega a 4 días seguidos sin descanso — la señal de sobreentrenamiento que pedía el Prompt Maestro.
  - **Vídeos**: subida de vídeos reales a un bucket privado de Supabase Storage (`entrenamiento-videos`, límite 100 MB, solo mp4/mov/webm). Botón "Analizar con IA" por vídeo: extrae 4 fotogramas clave del vídeo directamente en el navegador (`src/lib/videoFrames.js`, con `<video>` + `<canvas>`, sin subir nada a ningún sitio adicional) y los manda a la IA para un análisis de técnica — nunca el vídeo fluido completo, tal y como aceptaba el Prompt Maestro como limitación conocida. El análisis se guarda en el propio vídeo para no repetirlo cada vez. Comparación mes a mes: se pueden marcar hasta 2 vídeos de la misma habilidad para verlos lado a lado.
- `src/lib/videoFrames.js` (nuevo): `extractFramesFromSrc()`, funciona tanto con un archivo local recién subido como con la URL firmada de un vídeo ya guardado en Storage.
- `src/lib/ai.js`: nueva función `askAIWithImages()` (varias imágenes en una sola petición) — `askAIWithImage()` (una sola imagen, de la Fase 4) se mantiene intacta para Nutrición.
- `api/ask-ai.js`: ahora acepta un array `images` además del `image` suelto que ya existía; con `images`, manda todas las imágenes en el mismo mensaje a Anthropic.
- `src/lib/supabase.js`: `uploadTrainingVideo`, `getSignedVideoUrl`, `deleteTrainingVideo` — mismo patrón exacto que las fotos de progreso de Salud.
- `supabase/schema.sql`: bloque nuevo con el bucket `entrenamiento-videos` y sus políticas (cada usuario solo accede a su propia carpeta), con límite de tamaño y tipos de archivo permitidos.
- `SETUP.md`: nuevo paso 8 para activar el bucket de vídeos.
- Calistenia (con progresión, PRs y sesiones) sigue integrada en el sistema de deshacer y ahora la exportación CSV/Excel también incluye los PRs de cada habilidad, no solo el nivel.
- El panel de IA "Sugerencia de entrenamiento" ahora manda también la progresión, los PRs y las sesiones recientes, no solo el nivel — y se le pide explícitamente que avise si alguna habilidad lleva mucho tiempo sin PRs nuevos.

### Decisiones de esta fase
- **Los vídeos, igual que las fotos de Salud, quedan fuera del sistema de deshacer** — mismo motivo: evitar archivos huérfanos en Storage.
- **El análisis de IA de un vídeo nunca se dispara solo** — ni al subir el vídeo ni al abrir la pestaña. Solo cuando el usuario toca "Analizar con IA" explícitamente, respetando el principio de que la IA no actúa por su cuenta.
- **La extracción de fotogramas pasa siempre por el navegador, nunca por un servidor** — evita tener que subir el vídeo dos veces o montar un servicio de procesamiento de vídeo aparte; con 4 fotogramas por vídeo es suficiente para dar consejos de técnica útiles sin disparar el coste de tokens de imagen.
- **Progresión, PRs y sesiones viven dentro del mismo objeto `calistenia[skill]`** (junto al `nivel` que ya existía desde la Fase 1), no en claves nuevas separadas — mismo criterio que se usó con `salud` en la Fase 3, para no mezclar convenciones de almacenamiento distintas dentro del mismo proyecto.
- **Reutilización de datos antiguos:** los usuarios que ya tenían `calistenia` guardado desde antes de esta fase (solo con `{ nivel }`) siguen funcionando sin migración: la vista rellena `progresion`, `prs` y `sesiones` como listas vacías por defecto si no existen (`{ nivel: 0, progresion: [], prs: [], sesiones: [], ...data }`).

### Riesgo conocido, sin poder comprobarse en este entorno
- **La extracción de fotogramas de un vídeo ya subido a Supabase Storage depende de que el navegador pueda leer los píxeles de un `<video>` con una URL remota (CORS)** — Supabase Storage debería permitirlo por defecto en objetos servidos con URL firmada, pero esto **no se ha podido verificar de verdad sin acceso a red en este entorno de desarrollo**. Si al tocar "Analizar con IA" aparece el mensaje de que el navegador ha bloqueado los fotogramas, es este el motivo más probable — avisar a la siguiente IA si Josué lo reporta, para investigarlo con un mensaje de error real en la mano.

### Verificado en este entorno (sin red real, igual que en fases anteriores)
- Chequeo de sintaxis con `esbuild` en todos los archivos nuevos y modificados.
- Bundle completo de la app (`src/main.jsx`, dependencias npm como `external`) resuelve sin errores todos los imports/exports entre archivos, incluidos los 2 archivos nuevos (`videoFrames.js`) y las funciones ampliadas de `ai.js` y `api/ask-ai.js`.
- `package.json` y `manifest.json` siguen siendo JSON válido (no se han tocado en esta fase).
- **Sigue sin poder ejecutarse `npm run dev` de verdad en este entorno** — primera prueba real la hace Josué, como siempre.

### Pendiente para cerrar esta fase de verdad
- Que Josué ejecute el bloque nuevo de `supabase/schema.sql` (bucket `entrenamiento-videos`).
- Que pruebe: desplegar una habilidad, añadir pasos de progresión a mano, generar progresión con IA, añadir un PR, registrar una sesión (y comprobar el aviso de racha si entrena varios días seguidos), subir un vídeo real y tocar "Analizar con IA" — y reportar si ese último paso falla por el riesgo de CORS descrito arriba.


## Fase 6 — Estudios

### Añadido
- Nuevo módulo **Estudios** (`src/views/EstudiosView.jsx`), organizado por **programas** en pestañas (por defecto Bachillerato y Música, ampliable desde la propia vista con el botón "Programa").
- Dentro de cada programa, **asignaturas** en tarjetas desplegables, cada una con:
  - Registro rápido de **horas de estudio** (con total de la última semana visible en la cabecera).
  - **Exámenes**: fecha, tema, nota objetivo, días restantes calculados automáticamente, y campo para la nota obtenida una vez pasado.
  - **Plan de repaso** por examen: generado por IA como checklist (JSON de 3-7 pasos según los días restantes) y siempre editable, ampliable o borrable a mano — mismo patrón que la progresión de Calistenia de la Fase 5.
- **Explícame un concepto**: caja de pregunta libre a la IA (la primera de la app donde el texto lo escribe el usuario, no un prompt ya construido a partir de datos), pensada tanto para Bachillerato como para música.
- **Primera correlación real entre módulos**: sueño ↔ horas de estudio. Nuevo archivo `src/lib/correlaciones.js` con `cruzarPorFecha` (genérica, cruza dos series por fecha) y `correlacionSuenoEstudio` (primer uso), construido a propósito para que la Fase 16 (motor de correlaciones) lo reutilice con más pares de módulos en vez de reescribir la lógica de cruce.
- Panel de IA "Analizar mis estudios": lectura breve con asignaturas, exámenes y horas recientes como contexto — aconseja, nunca decide por Josué.
- Exportación CSV/Excel ampliada con exámenes (nota objetivo/obtenida, progreso del plan de repaso) y horas de estudio por asignatura.

### Decisiones de esta fase
- **Programas como lista editable, no como enum fijo en el código** — Josué puede añadir un tercer programa (por ejemplo, un idioma) sin que haga falta tocar código, cumpliendo el "todo editable, nada bloqueado" del documento original.
- **Asignaturas, exámenes y horas como listas planas relacionadas por `id`**, no anidadas dentro de cada programa — mismo criterio relacional que ya usan `salud`, `nutricion` y `calistenia`.
- **La correlación sueño↔estudio usa un umbral simple (7h) y exige al menos 2 días en cada grupo antes de mostrar nada** — una heurística que Josué puede verificar a ojo, no una caja negra, y coherente con la prudencia que ya se le pide al resto de la IA de la app.
- **`ANTHROPIC_API_KEY` sigue sin activarse en producción** — decisión consciente de Josué, confirmada en esta fase; los paneles de IA seguirán mostrando el aviso de "IA no configurada" hasta que decida activarla.

### Verificado en este entorno (sin red real, igual que en fases anteriores)
- Chequeo de sintaxis con `esbuild` en todos los archivos nuevos y modificados (`tokens.js`, `correlaciones.js`, `EstudiosView.jsx`, `App.jsx`, `exportData.js`, y los ya existentes por si acaso).
- Bundle completo de la app (`src/main.jsx`, dependencias npm como `external`) resuelve sin errores todos los imports/exports, incluido el módulo nuevo.
- **Sigue sin poder ejecutarse `npm run dev` de verdad en este entorno** — primera prueba real la hace Josué, como siempre.

### Confirmado por Josué antes de empezar esta fase
- La Fase 5 (Calistenia a fondo) funciona de verdad en su dispositivo — progresión, PRs, sesiones y vídeos con análisis por IA probados sin errores; el riesgo de CORS avisado en la fase anterior no se materializó.
- El "setup" ya está hecho, salvo `ANTHROPIC_API_KEY` en producción, que decide dejar sin activar por ahora.

### Pendiente para cerrar esta fase de verdad
- Que Josué pruebe: crear una asignatura, añadir un examen, generar un plan de repaso con IA, registrar horas de estudio, y comprobar que la correlación sueño↔estudio aparece cuando hay suficientes días cruzados.

## Fase 7 — Negocio

### Añadido
- Nuevo módulo **Negocio** (`src/views/BusinessView.jsx`), deliberadamente simple por petición explícita de Josué.
- Lista de **proyectos/ideas**: nombre, estado (Idea / En marcha / Pausado), notas libres (para clientes o tareas sueltas), ingresos y gastos totales editables a mano, con balance calculado al momento.
- Panel de IA "Mejorar mis ideas": sugerencias por proyecto, o ánimo a apuntar la primera idea si la lista está vacía.
- Exportación CSV/Excel ampliada con los proyectos de Negocio.

### Decisiones de esta fase
- **Un único array `proyectos`, sin clientes/tareas/movimientos como listas separadas** — cumple la petición explícita de Josué de no dedicarle mucho diseño a este módulo; si algún día pide más estructura, se amplía entonces.
- **Ingresos/gastos como totales editables, no como libro de transacciones** — ya existe uno completo en Economía; duplicarlo aquí habría sido justo la sobre-ingeniería que se pidió evitar.

### Verificado en este entorno (sin red real, igual que en fases anteriores)
- Chequeo de sintaxis con `esbuild` en todos los archivos nuevos y modificados.
- Bundle completo de la app (`src/main.jsx`, dependencias npm como `external`) resuelve sin errores todos los imports/exports, incluido el módulo nuevo.
- Sigue sin poder ejecutarse `npm run dev` de verdad en este entorno — primera prueba real la hace Josué.

### Confirmado por Josué antes de empezar esta fase
- La Fase 6 (Estudios) funciona de verdad en su dispositivo, sin incidencias.
- Esta vez no adjuntó un zip nuevo: confirmó en el chat que todo funcionaba y se continuó directamente desde el zip que la propia IA había generado en el turno anterior de esta misma conversación.

## Fase 8 — Productividad

### Añadido
- **Hábitos**: racha "en pausa" (un día fallado no la rompe a cero, dos días seguidos sí la reinician), mejor racha guardada aparte. Panel de IA "Consejo de hábitos".
- **Rutinas/checklists**: pasos reutilizables con progreso X/Y y botón "reiniciar para hoy".
- **Pomodoro**: 25 min trabajo / 5 min descanso, con contador de sesiones completadas hoy.
- **Tareas**: lista con fecha límite opcional, pendientes/hechas separadas.
- **Metas a corto plazo**: nombre, periodo (diaria/semanal/mensual/anual), objetivo numérico y progreso con barra visual.
- Hábitos, tareas y metas integrados en historial/deshacer y en exportación CSV/Excel (rutinas y pomodoros no, por no ser datos tabulares con sentido fuera de la app).
- Nueva utilidad `addDays` en `helpers.js`.

### Decisiones de esta fase
- Metas cortas (esta fase) deliberadamente separadas de los futuros "Objetivos" 30d-10a (Fase 9) — son dos sistemas distintos, no fusionar.
- Contador de pomodoros fuera del sistema de deshacer — una sesión de concentración ya hecha no tiene sentido "deshacerla".
- Ninguna dependencia npm nueva esta fase.

### Verificado en este entorno (sin red real)
- Chequeo de sintaxis con `esbuild` en todos los archivos nuevos y modificados.
- Bundle completo de la app resuelve sin errores todos los imports/exports, incluido el módulo nuevo.
- Sigue sin poder ejecutarse `npm run dev` de verdad aquí — primera prueba real la hace Josué.

### Confirmado por Josué antes de empezar esta fase
- La Fase 7 (Negocio) funciona de verdad en su dispositivo, sin incidencias.

## Fase 9 — Objetivos

### Añadido
- Lista de objetivos por plazo (30 días, 90 días, 1 año, 5 años, 10 años), con estado activo/cumplido.
- Aviso de revisión periódica (30+ días sin revisar) con botón de revisión asistida por IA: valora brevemente el conjunto y sugiere como máximo un objetivo nuevo si ve un hueco — nunca lo añade sola.
- Panel de IA "¿Voy por buen camino?" para consultas puntuales, aparte del banner de revisión.
- Objetivos integrados en historial/deshacer (`ultimaRevision` queda fuera, como el contador de pomodoros) y en exportación CSV/Excel.

### Decisiones de esta fase
- Objetivos (esta fase) y Metas cortas (Productividad, Fase 8) se mantienen como sistemas separados a propósito, sin compartir datos ni componentes.
- La revisión con IA nunca añade objetivos automáticamente — solo texto para que Josué decida.
- A partir de esta fase, Josué pidió encadenar la construcción de fases sin esperar confirmación de ejecución real de cada una — se sigue construyendo una fase por turno igualmente.

### Verificado en este entorno (sin red real)
- `esbuild`: sintaxis de todos los archivos nuevos/modificados y bundle completo de la app sin errores.
- Ni la Fase 8 ni la Fase 9 tienen confirmación de ejecución real todavía — pendiente por parte de Josué.

### Aparte del código: Josué sigue atascado exponiendo el puerto del servidor de desarrollo en Replit (Preview/Webview) — ver HANDOFF.md sección 12. No bloquea seguir construyendo fases.

## Fase 10 — Diario

### Añadido
- Entrada diaria breve (`src/views/DiaryView.jsx`): estado de ánimo (1-5, selector con emoji), cómo me he sentido, qué he aprendido, qué mejoraré mañana. Una sola entrada por día — si ya existe la de hoy, se precarga en el formulario para completarla o corregirla en vez de duplicarla.
- Entradas anteriores en tarjetas plegables (fecha + primera línea visible, contenido completo al abrir), con opción de eliminar cada una.
- Panel de IA "Detectar patrones emocionales": analiza hasta las 20 entradas más recientes (ánimo + texto) y señala patrones si los hay; si hay muy pocas entradas para un patrón real, lo dice abiertamente en vez de forzarlo. Nunca se dispara sola, solo a un toque.
- Nuevo componente `Textarea` en `src/components/ui.jsx` — primera vez que la app necesita texto libre de varias líneas; mismo estilo visual que `TextInput`.
- Diario integrado en historial/deshacer y en exportación CSV/Excel.
- Sin PIN adicional, por petición explícita de Josué (a diferencia de la futura Fase 12, Relación, que sí usará `PinGate`).

### Decisiones de esta fase
- Una entrada por día (no una lista libre como Sueño o Fútbol) porque el Prompt Maestro describe el Diario como reflexión diaria, no un registro de varios eventos por día.
- La detección de patrones emocionales es una petición puntual del usuario (como el resto de paneles de IA de la app), nunca un análisis automático en segundo plano.
- Se sigue encadenando la construcción de fases sin esperar confirmación de ejecución real de cada una, por petición de Josué en fases anteriores.

### Verificado en este entorno (sin red real)
- `esbuild`: sintaxis de todos los archivos nuevos/modificados y bundle completo de la app sin errores.
- Ni la Fase 8, ni la Fase 9, ni esta Fase 10 tienen confirmación de ejecución real todavía — pendiente por parte de Josué.

### Aparte del código: el atasco de Replit exponiendo el puerto del servidor de desarrollo sigue sin resolver — ver HANDOFF.md sección 12. No bloquea seguir construyendo fases.

## Fase 11 — Biblioteca

### Añadido
- Nueva vista `src/views/LibraryView.jsx`: listado único y buscable de PDFs, vídeos, fotos, apuntes de texto y enlaces.
- Subida de PDF/vídeo/foto con título opcional (por defecto el nombre del archivo), guardados en el nuevo bucket privado de Supabase Storage `biblioteca` (`supabase/schema.sql`).
- Extracción automática del texto del PDF en el propio navegador al subirlo (`src/lib/pdfText.js`, con `pdfjs-dist`), guardado como `textoExtraido` para poder buscar dentro del contenido — funcionalidad clave del Prompt Maestro para esta fase ("clave para el instituto"). Si el PDF es un escaneo sin texto real, no falla: se avisa en la tarjeta y queda buscable solo por título.
- Apuntes de texto libre (título + contenido) y enlaces (título + URL + descripción opcional), ambos de alta directa sin archivo.
- Buscador único sobre título, contenido de apuntes, descripción/URL de enlaces y texto extraído de los PDF, con un fragmento de contexto alrededor de la coincidencia encontrada.
- Filtro por tipo (Todos/PDFs/Vídeos/Fotos/Apuntes/Enlaces).
- Eliminar cualquier ítem, incluyendo el archivo correspondiente en Storage cuando aplica.
- Exportación CSV/Excel: apuntes y enlaces de Biblioteca incluidos (los archivos no, mismo criterio que las fotos de progreso de Salud).

### Decisiones de esta fase
- Biblioteca se divide en dos estados: `biblioteca` (apuntes/enlaces, texto puro, con deshacer) y `bibliotecaArchivos` (pdf/vídeo/foto, sin deshacer) — mismo criterio que Salud/`saludFotos` y Calistenia/`calisteniaVideos`, para no dejar un archivo huérfano en Storage al deshacer.
- Un único bucket de Storage (`biblioteca`) para los tres tipos de archivo, con el tipo guardado en la fila de datos, no en Storage.
- Sin IA en esta fase — el Prompt Maestro no la pide para Biblioteca, no se añade alcance no solicitado.
- El Prompt Maestro completo de las 21 fases se ha incorporado íntegro a `HANDOFF.md` (sección 0), para que ninguna IA futura tenga que pedirlo de nuevo.

### Dependencias
- Nueva dependencia npm: `pdfjs-dist` (`package.json` v0.11.0). **Josué necesita ejecutar `npm install` en Replit** tras esta fase.

### Verificado en este entorno (sin red real)
- `esbuild`: bundle completo de la app (todos los módulos locales, incluidos los nuevos) sin errores, con las dependencias npm marcadas como externas — este entorno no tiene acceso a red para instalar `pdfjs-dist` de verdad.
- Ninguna de las Fases 8, 9, 10 ni esta Fase 11 tiene confirmación de ejecución real todavía — pendiente por parte de Josué.

### Aparte del código: el atasco de Replit exponiendo el puerto del servidor de desarrollo sigue sin resolver — ver HANDOFF.md sección 12. No bloquea seguir construyendo fases.

## Fase 12 — Relación (privado)

### Añadido
- Nueva vista `src/views/RelationView.jsx`: nombre de la pareja (editable) y lista de fechas importantes (etiqueta + fecha), con entrada manual.
- Módulo protegido por el PIN existente, reutilizando el mismo `PinGate` de `ui.jsx` que ya usa la pestaña Fotos de Salud — sin PIN creado, muestra el mismo aviso para ir a Ajustes.
- Nuevo estado `relacion` en `App.jsx` (`{ nombre, fechas: [] }`), con carga/guardado en Supabase (`app_data`, clave `relacion`).
- Recordatorio en pantalla principal (`Hoy`): tarjeta discreta con la próxima fecha importante y cuenta atrás ("Aniversario en 12 días"), sin volver a pedir el PIN — el detalle completo sigue protegido en la pestaña Relación.
- Nuevo helper `diasHasta()` / `proximaOcurrencia()` en `src/lib/helpers.js`: calcula la próxima vez que "toca" una fecha guardada, sirviendo tanto para fechas que se repiten cada año (aniversario, cumpleaños) como para una fecha puntual futura.
- Nueva entrada de navegación "Relación" en la hoja "Más" (icono `Heart`).

### Decisiones de esta fase
- `relacion` (nombre + fechas) es texto puro sin archivos, así que pasa por `snapshotAndSave`/deshacer, igual que Diario o los apuntes de Biblioteca — no se aparta a un estado sin deshacer como las fotos/vídeos.
- `relacion` se excluye deliberadamente de la exportación CSV/Excel: es el único módulo protegido de principio a fin por PIN, y el export no vuelve a pedirlo — mismo criterio de exclusión que las fotos de Salud o los vídeos de Calistenia, aunque el motivo aquí es de privacidad y no de tipo binario.
- El recordatorio del Dashboard se muestra sin pedir el PIN: es solo una etiqueta y una cuenta atrás (igual de discreto que un recordatorio de calendario del móvil), mientras que el nombre completo y la lista entera siguen detrás del `PinGate` en la pestaña Relación. Si Josué prefiere que el propio recordatorio del Dashboard quede también oculto sin PIN, es un ajuste sencillo para pedir en cualquier momento.
- Sin IA en esta fase — el Prompt Maestro no la pide para Relación, no se añade alcance no solicitado.
- Sin fotos ni archivos en esta fase — el Prompt Maestro solo pide nombre y fechas importantes; los "Recordatorios románticos" (lista de días activables) son la Fase 13, no esta.

### Verificado en este entorno (sin red real)
- `esbuild`: bundle completo de la app (todos los módulos locales, incluida esta fase) sin errores, dependencias npm marcadas como externas.
- Ninguna de las Fases 8, 9, 10, 11 ni esta Fase 12 tiene confirmación de ejecución real todavía — pendiente por parte de Josué.

### Aparte del código: el atasco de Replit exponiendo el puerto del servidor de desarrollo sigue sin resolver — ver HANDOFF.md sección 12. No bloquea seguir construyendo fases.

## Fase 13 — Recordatorios románticos

### Añadido
- Subpestaña "Días especiales" dentro de Relación (junto a "Fechas"), con los 11 nombres del Prompt Maestro (Aniversario, Cumpleaños, Día de la Novia, Día del Peluche, Día de las Flores Amarillas, Día del Chocolate, Día del Cine, Día del Maquillaje, Día del Anillo de Promesa, Día de los Collares, Día de los Poemas) como chips seleccionables.
- Tocar un chip abre el mismo formulario de fecha que "Fechas" — comparten el array `relacion.fechas`, mismo `PinGate`, sin ninguna clave de datos nueva.
- Chips ya usados se marcan con un check visual.

### Decisiones de esta fase
- Reutilizar el modelo de datos y los handlers ya existentes de "Fechas" en vez de crear un sistema paralelo — son, en esencia, el mismo tipo de dato.
- Ninguna fecha se autogenera: tocar un chip solo abre el formulario, el usuario escribe la fecha él mismo.
- La recurrencia anual de una fecha ya guardada (cuenta atrás que salta al año siguiente) es un cálculo de visualización sobre un dato existente, no la creación automática de una entrada nueva.

### Verificado en este entorno (sin red real)
- `esbuild`: bundle completo de la app sin errores, incluida la subpestaña nueva.
- Ni esta fase ni las Fases 8-12 tienen confirmación de ejecución real todavía.

### Sin dependencias npm nuevas, sin cambios en App.jsx ni en el esquema de Supabase.

## Fase 14 — Fe y vida espiritual

### Añadido
- Nueva vista `src/views/FaithView.jsx` con 4 subpestañas (`ToggleTab`): Servicio, Calendario, Diario, Objetivos.
- **Servicio:** registro de cuándo has servido en cada rol (Eucaristía, Anuncio, Preparación, Palabra, Otro) con fecha y notas opcionales, listado de más reciente a más antiguo.
- **Calendario:** eventos puntuales (Convivencia, Reunión, Catequesis, Retiro, Otro) con título, fecha y notas — separados en "Próximos" y "Pasados", sin recurrencia automática (a diferencia de las fechas de Relación, un retiro pasado no "vuelve" solo).
- **Diario espiritual:** una entrada de texto libre al día (reutiliza `Textarea`), independiente del Diario general (Fase 10) — su propio array, sin mezclar datos. Incluye `AIPanel` "Reflexionar sobre mis últimas entradas".
- **Objetivos:** mismo patrón que `ObjectivesView` (Fase 9) pero en su propia lista — objetivos espirituales agrupados por `PLAZOS_OBJETIVO` (30 días a 10 años), con `AIPanel` "¿Voy por buen camino?".
- Nuevo estado `fe` en `App.jsx` (`{ servicio: [], eventos: [], diario: [], objetivos: [] }`), con carga/guardado en Supabase (`app_data`, clave `fe`), pasa por `snapshotAndSave`/deshacer (texto puro, sin PIN ni archivos).
- Nueva entrada de navegación "Fe" en la hoja "Más" (icono `Church`), entre Diario y Biblioteca.
- `src/lib/exportData.js`: las 4 sub-áreas de Fe incluidas en la exportación CSV/Excel (sin PIN, mismo criterio que Diario/Biblioteca).
- Nuevos tokens en `src/tokens.js`: `TIPOS_SERVICIO_FE`, `TIPOS_EVENTO_FE`, `DEFAULT_FE`.

### Decisiones de esta fase
- **La IA de este módulo nunca da autoridad doctrinal.** Como `AIPanel` reutiliza el mismo `AI_SYSTEM` general de toda la app (no admite un system prompt distinto por módulo), la restricción se añade dentro del propio `buildPrompt()` de los dos `AIPanel` de esta vista (constante `AVISO_DOCTRINAL` en `FaithView.jsx`): nunca zanjar preguntas de fe profundas, y si el texto las roza, decirlo y recomendar hablarlo con la comunidad o el responsable de pastoral.
- Sin PIN en todo el módulo — el Prompt Maestro no lo pide para Fe (a diferencia de Relación, Fase 12), mismo criterio que el Diario general.
- "Servicio" y "Calendario" se mantienen como dos listas separadas en vez de fusionarse: Servicio es un registro de participación en roles concretos y recurrentes; Calendario es un calendario general de eventos puntuales (convivencias, retiros...) — mezclar ambos habría forzado un modelo de datos con campos condicionales según el tipo.
- El Diario espiritual es un array propio (`fe.diario`), no reutiliza `diario.entradas` del Diario general — son dos diarios con propósitos distintos (vida en general vs. vida de fe) y Josué puede querer llevarlos por separado.
- Los eventos del Calendario se ordenan por fecha literal, sin recalcular ninguna recurrencia anual (a diferencia de `proximaOcurrencia`/`diasHasta` de Relación) — un retiro o una reunión puntual no se repite sola cada año.

### Verificado en este entorno (sin red real)
- `esbuild`: bundle completo de la app (todos los módulos locales, incluida esta fase) sin errores, dependencias npm marcadas como externas.
- Ninguna de las Fases 8 a 14 tiene confirmación de ejecución real todavía — pendiente por parte de Josué.

### Aparte del código: el atasco de Replit exponiendo el puerto del servidor de desarrollo sigue sin resolver — ver HANDOFF.md sección 12. No bloquea seguir construyendo fases.

## Fase 15 — Bienestar digital

### Añadido
- Nueva vista `src/views/WellbeingView.jsx` con 4 subpestañas: Resumen, Tiempo de uso, Concentración, Reflexión.
- **Resumen**: tres índices (Productividad/Distracción/Equilibrio) como barras de progreso, calculados como % de minutos por categoría en los últimos 7 días de registros. Aviso explícito de que no es una medición real del dispositivo, solo una lectura del propio registro de Josué.
- **Tiempo de uso**: alta manual (categoría, app/actividad opcional, minutos, fecha) y listado de los últimos 25 registros con borrado.
- **Concentración**: temporizador simulado con duración elegible (10/20/30/45/60 min), reutilizando el mismo mecanismo del Pomodoro de Productividad. Mensaje breve al completar una sesión y recuento (no puntuación) de sesiones de la semana. Aviso explícito de que no bloquea otras apps del móvil de verdad — no es viable en una PWA.
- **Reflexión**: pantalla que Josué abre él mismo, nunca automática, con 3 preguntas guía (¿por qué has abierto esto? ¿es lo que querías hacer ahora? ¿cómo te sientes?) y una entrada de texto libre por reflexión, con historial plegable.
- Nueva entrada "Bienestar" en la hoja "Más" (icono `Smartphone`), entre Relación y Economía.
- Exportación CSV/Excel: las tres sub-áreas de Bienestar incluidas (sin PIN, mismo criterio que Fe/Diario).

### Decisiones de esta fase
- Los índices se calculan sobre una ventana móvil de 7 días, no sobre todo el histórico — refleja mejor la semana actual.
- "Equilibrio" se define como el % de minutos marcados "neutro", manteniendo los tres índices simples de explicar (cada uno es literalmente el % de una categoría) en vez de una fórmula derivada.
- Sin intento de leer el Tiempo de Uso real del dispositivo — solo entrada manual; la importación automática queda pendiente, igual que la del banco en Economía.
- Concentración reutiliza el `useRef`/`setInterval` de 1s del Pomodoro de Productividad en vez de crear un segundo mecanismo de temporizador desde cero.
- Recompensa deliberadamente discreta (mensaje breve + recuento de sesiones, sin puntos/niveles) — petición explícita del Prompt Maestro de no sobregamificar.
- Tres barras de progreso (`BarraIndice`) en vez de tres `ScoreGauge` para el Resumen: `ScoreGauge` usa un id de gradiente SVG fijo que se rompe si se renderiza más de una vez en la misma pantalla — documentado en HANDOFF.md sección 6 para que ninguna fase futura repita el problema.
- `bienestar` (registros/reflexiones/sesiones) pasa entero por `snapshotAndSave`/deshacer, sin PIN — mismo criterio que Fe.

### Dependencias
- Sin dependencias npm nuevas esta fase (`package.json` v0.15.0).

### Verificado en este entorno (sin red real)
- `esbuild`: bundle completo de la app (todos los módulos locales, incluidos los nuevos) sin errores, con las dependencias npm marcadas como externas.
- Ninguna de las Fases 8 a 15 tiene confirmación de ejecución real todavía — pendiente por parte de Josué.

### Aparte del código: el atasco de Replit exponiendo el puerto del servidor de desarrollo sigue sin resolver — ver HANDOFF.md sección 12. No bloquea seguir construyendo fases.

## Fase 16 — Estadísticas y correlaciones

### Añadido
- Nueva vista `StatsView.jsx` (solo lectura, sin datos propios) que reúne las correlaciones de la app en un solo sitio.
- Dos correlaciones nuevas en `src/lib/correlaciones.js`: **sueño↔ánimo del Diario** y **entreno de calistenia↔ánimo del Diario** (sesiones de las 7 habilidades unificadas en un conjunto de fechas, sin duplicar).
- Las tres correlaciones (más la de sueño↔estudio ya existente desde la Fase 6) exigen un mínimo de días en cada grupo antes de mostrar nada, y explican abiertamente qué les falta cuando no hay datos suficientes.
- Nueva entrada "Estadísticas" en la hoja "Más" (icono `BarChart3`).

### Decisiones de esta fase
- StatsView no guarda nada propio — son cálculos sobre datos que ya existen en otros módulos, así que no hay clave nueva en Supabase ni cambios en exportación.
- El umbral de la correlación entreno↔ánimo es más alto (3 días por grupo) que las de sueño (2), por comparar contra un grupo más heterogéneo ("el resto de mis días").

### Verificado en este entorno (sin red real)
- `esbuild`: bundle completo de la app sin errores, incluida la vista nueva.
- Ninguna fase de la 8 a la 16 tiene confirmación de ejecución real todavía.

### Sin dependencias npm nuevas.

## Fase 17 — Predicciones

### Añadido
- Nuevo motor `src/lib/predicciones.js` (solo lectura, sin datos propios), con el mismo espíritu que `correlaciones.js` (Fase 16): honesto sobre cuándo no hay datos suficientes, nunca decide nada por Josué, y usa solo medias/tasas/regresión lineal simple, siempre explicables.
  - `prediccionObjetivo(objetivo)` — tiempo restante hasta el plazo que Josué eligió al crear el objetivo (30d/90d/1/5/10 años desde `fechaCreacion`), simple aritmética de fechas.
  - `prediccionAbandonoHabito(habito)` — riesgo bajo/medio/alto según el % de días marcados en la ventana de hasta 14 días desde el primer día marcado en `historial`.
  - `prediccionPeso(medidas)` — regresión lineal simple sobre las medidas de Salud con campo `peso`, proyecta la tendencia semanal y una estimación a 30 días.
  - `prediccionFuerza(calistenia)` — sin cifra numérica fiable que proyectar (los PRs son texto libre), en su lugar compara la frecuencia de sesiones de la habilidad más entrenada en las últimas 2 semanas frente a las 2 anteriores.
  - `prediccionAhorro(economia)` — neto medio mensual (ingresos − gastos) de los últimos meses con movimientos, proyecta la hucha a 3 meses vista.
  - `prediccionNotas(estudios)` — media de las 3 notas obtenidas más recientes y su tendencia frente a las anteriores, sin forzar una regresión sobre pocos puntos.
- Nueva vista `src/views/PredictionsView.jsx` (solo lectura), con una tarjeta por predicción, siguiendo el mismo patrón visual que `StatsView.jsx` (Fase 16): mensaje explícito de "datos insuficientes" cuando corresponde, nunca una lectura forzada.
- Nueva entrada "Predicciones" en la hoja "Más" (icono `TrendingUp`), justo después de Estadísticas.
- No se exporta a CSV/Excel — mismo criterio que Estadísticas: son cálculos derivados de datos ya existentes, no datos propios.

### Decisiones de esta fase
- **"Fuerza" no proyecta un número inventado.** Los PRs de Calistenia son texto libre (ej. "30s hold"), así que no hay forma honesta de hacer una regresión numérica sobre ellos. En su lugar, la predicción mide constancia (frecuencia de sesiones reciente vs. anterior) de la habilidad que más se entrena, y lo deja explícito en la propia tarjeta para no sugerir una precisión que no existe.
- **"Notas" usa una media de los últimos 3 exámenes, no una regresión lineal.** Con solo 2-3 puntos de datos, ajustar una recta da una falsa sensación de precisión; una media reciente + comparación con el bloque anterior es más honesto y sigue siendo útil.
- **`prediccionObjetivo` es aritmética de fechas, no una proyección estadística** — el "tiempo estimado" de un objetivo, tal y como lo pide el Prompt Maestro, es literalmente cuánto queda del plazo que Josué mismo fijó, no algo que haya que inferir de un historial.
- Sin exportación a CSV/Excel — mismo criterio que Estadísticas (Fase 16): no son datos propios, son cálculos sobre datos que ya se exportan desde sus módulos de origen.

### Verificado en este entorno (sin red real)
- `esbuild`: bundle completo de la app (todos los módulos locales, incluida esta fase) sin errores, dependencias npm marcadas como externas.
- Ninguna de las Fases 8 a 17 tiene confirmación de ejecución real todavía — pendiente por parte de Josué.

### Aparte del código: el atasco de Replit exponiendo el puerto del servidor de desarrollo sigue sin resolver — ver HANDOFF.md sección 12. No bloquea seguir construyendo fases.

## Fase 18 — IA con memoria a fondo

### Añadido
- **`AIPanel` (`src/components/ui.jsx`) multimodal:** icono de clip junto al botón de pregunta en las 15+ secciones que ya usan `AIPanel`, sin tocar ninguna vista. Permite adjuntar:
  - una foto o captura (imagen) → se manda con `askAIWithImage` (mismo mecanismo que el escaneo de comida de Nutrición, Fase 4);
  - un PDF → se extrae su texto en el navegador con `extractPdfText` (mismo lector que Biblioteca, Fase 11) y se añade como contexto extra al prompt de texto normal; si el PDF no tiene texto extraíble, se avisa en el propio prompt en vez de fallar.
  - El adjunto se limpia después de cada pregunta.
- **Buscador universal en lenguaje natural:** nuevo `UniversalSearchModal` (`ui.jsx`), abierto desde un icono fijo arriba a la derecha en `App.jsx`. Pregunta libre sobre `currentState` (el mismo objeto ya usado para exportar a CSV/Excel, sin `relacion`); la IA responde solo con lo que encuentra en esos datos y lo dice abiertamente si no puede.
- **Panel de sugerencias fijo arriba a la izquierda:** nuevo `SuggestionsButton` (`ui.jsx`), icono con bombilla en `App.jsx`. Panel plegable que, solo al tocar "Generar sugerencias", pide a la IA hasta 2 sugerencias breves sobre un resumen reciente de sueño, calistenia, fútbol, economía, salud, nutrición, estudios, productividad, objetivos, Fe y Bienestar.
- `fileToBase64` añadido a `src/lib/helpers.js`, compartido entre `NutritionView.jsx` (uso ya existente) y el nuevo `AIPanel`.
- `App.jsx`: `pt-8` → `pt-16` en el contenedor principal para dejar sitio a los dos iconos fijos de arriba.

### Decisiones de esta fase
- La multimodalidad se metió dentro del propio `AIPanel`, no como una prop nueva que cada vista tuviera que declarar — mantiene la firma `buildPrompt()` intacta en las 15+ vistas que ya lo usan.
- Un PDF adjunto se manda como texto extraído, no como documento binario a la API de Anthropic — reutiliza el mismo mecanismo que Biblioteca en vez de añadir un tercer tipo de contenido a `api/ask-ai.js`.
- El buscador universal y el panel de sugerencias reutilizan `currentState` como contexto — es el mismo conjunto de datos ya auditado para el export (excluye `relacion`, el único módulo protegido por PIN de principio a fin) — una sola fuente de verdad de "qué puede ver la IA".
- El panel de sugerencias nunca llama a la IA solo por abrirse — exige el toque explícito en "Generar sugerencias" la primera vez, mismo criterio de "la IA nunca se dispara sola" que ya aplicaba en Diario, Objetivos, el análisis de vídeo de Calistenia y el escaneo de comida de Nutrición.
- Tono de `AI_SYSTEM` sin cambios: ya estaba "a medio camino entre prudente y directo" desde una fase anterior, así que no hacía falta tocarlo para esta fase.

### Verificado en este entorno (sin red real)
- `esbuild`: bundle completo de la app (todos los módulos locales, incluida esta fase) sin errores, dependencias npm marcadas como externas. También verificados por separado `api/ask-ai.js` y `src/components/ui.jsx`.
- Ninguna de las Fases 8 a 18 tiene confirmación de ejecución real todavía — pendiente por parte de Josué.

### Sin dependencias npm nuevas.

### Aparte del código: el atasco de Replit exponiendo el puerto del servidor de desarrollo sigue sin resolver — ver HANDOFF.md sección 12. No bloquea seguir construyendo fases.

## Fase 19 — Personalización total

### Añadido
- Nuevo objeto `personalizacion` en `App.jsx` (`{ orden, ocultos, iconos, pinExtra, favoritas }`), guardado directo en Supabase (`app_data`, clave `personalizacion`) — igual que `ajustes` (accent/pin), no pasa por `snapshotAndSave`/deshacer, porque es configuración de cómo se ve la app, no datos.
- Nueva vista `src/views/PersonalizationView.jsx`, mostrada dentro de la pantalla Ajustes (bajo el título "Personalización avanzada"), con:
  - **Reordenar** cualquier sección de "Más" con flechas arriba/abajo.
  - **Ocultar/mostrar** cualquier sección — ocultar pide confirmación inline ("¿Ocultar 'X' de Más?"), mostrar de nuevo no la pide (solo "borrar" necesita confirmación extra, tal y como pide el Prompt Maestro).
  - **Cambiar el icono** de cualquier sección desde un catálogo de 8 iconos alternativos (`ICONOS_PERSONALIZABLES_IDS` en `tokens.js`) o volver al original.
  - **Proteger con el mismo PIN** cualquier sección además de Relación (que sigue siempre protegida, sin poder quitarle el PIN).
  - **Métricas favoritas del panel "Hoy"**: hasta 4, elegidas de una lista de 6 (peso actual, hucha, mejor racha de hábito, objetivo más próximo, ánimo medio de 7 días, sesiones de concentración de la semana), con su propio orden.
- `DashboardView.jsx`: nuevas tarjetas de métricas favoritas (si hay alguna elegida), justo debajo del recordatorio de Relación.
- Los 4 accesos rápidos de la barra inferior (`PRIMARY_NAV`) y "Ajustes" mismo quedan deliberadamente **fuera** de la personalización — ver decisiones.
- Nuevos tokens en `src/tokens.js`: `ICONOS_PERSONALIZABLES_IDS`, `METRICAS_FAVORITAS_DISPONIBLES`, `MAX_METRICAS_FAVORITAS`, `DEFAULT_PERSONALIZACION`.

### Decisiones de esta fase
- **PRIMARY_NAV y "Ajustes" no son personalizables.** Dejar reordenar/ocultar los 4 accesos fijos de abajo (o el propio Ajustes) abriría la puerta a que Josué se quede sin forma de volver a mostrar algo que ocultó por error — mantenerlos fijos es la salvaguarda más simple.
- **"Crear/eliminar apartados" se interpreta como mostrar/ocultar los módulos ya construidos**, no como un constructor de módulos arbitrarios desde cero. Esto último (secciones completamente nuevas con su propio esquema de datos) está fuera del alcance razonable de una PWA de código fijo — el Prompt Maestro no detalla ese nivel, y encaja mejor en el motor de automatizaciones/plantillas ya previsto para la Fase 20.
- **"Cambiar gráficos" no se toca en esta fase** — el color de los gráficos ya se personaliza desde la Fase 1 (accent), y no hay una petición concreta de tipos de gráfico alternativos; no se añade alcance no pedido.
- **Confirmación solo al ocultar, nunca al mostrar de nuevo** — literal a la petición del Prompt Maestro ("confirmación extra solo al borrar un módulo entero"); mostrar de nuevo una sección oculta es una acción segura y reversible sin más fricción.
- **Ocultar un módulo nunca borra sus datos** — solo lo quita de la lista "Más"; los datos siguen intactos en Supabase y vuelven a aparecer en cuanto se muestra de nuevo. Una "eliminación" real de datos no se pidió y sería demasiado arriesgada para una casilla de personalización.
- **`personalizacion` se guarda directo (como `ajustes`), no pasa por `snapshotAndSave`** — es preferencia de interfaz, no un dato que tenga sentido "deshacer" con el histórico de 10 pasos compartido con el resto de módulos.
- **Las métricas favoritas se calculan en `App.jsx`, no dentro de `DashboardView.jsx`** — cada métrica cruza datos de un módulo distinto (Salud, Economía, Productividad, Objetivos, Diario, Bienestar); mismo criterio que Estadísticas/Predicciones, ninguna vista de solo lectura debería conocer la forma interna de otro módulo.
- **`proximo_objetivo` reutiliza `prediccionObjetivo()`** (Fase 17) en vez de duplicar el cálculo de plazo — mismo dato, misma fuente de verdad.

### Verificado en este entorno (sin red real)
- `esbuild`: bundle completo de la app (todos los módulos locales, incluida esta fase) sin errores, dependencias npm marcadas como externas.
- Ninguna de las Fases 8 a 19 tiene confirmación de ejecución real todavía — pendiente por parte de Josué.

### Aparte del código: el atasco de Replit exponiendo el puerto del servidor de desarrollo sigue sin resolver — ver HANDOFF.md sección 12. No bloquea seguir construyendo fases.

## Fase 20 — Funciones transversales avanzadas (completa)

### Añadido (turno anterior)
- Primera automatización fija del Prompt Maestro: aviso en el Dashboard cuando el sueño de anoche es menor de 7h, sugiriendo entreno más suave hoy y adelantar la hora de dormir. Cálculo al vuelo, sin datos nuevos que guardar.

### Añadido (este turno — cierra la Fase 20)
- **Segunda y tercera automatización fija** (`src/views/DashboardView.jsx`): `AvisoRachaEnRiesgo` (un hábito con racha de 3+ días sin marcar hoy ni ayer — un tercer día sin marcar la rompería) y `AvisoExamenSinHoras` (examen dentro de 3 días sin horas de estudio registradas esa semana para su asignatura). Mismo patrón que `AvisoSuenoCorto`: cálculo al vuelo, sin datos nuevos, riesgo mínimo.
- **Centro de logros** (`src/lib/logros.js` + `src/views/AchievementsView.jsx`, pestaña "Logros"): 12 insignias binarias (sin puntos/niveles/monedas) calculadas sobre datos ya existentes de Productividad, Diario, Objetivos, Bienestar, Fe, Nutrición, Salud, Calistenia, Economía y Sueño. Mismo criterio "solo lectura, sin datos propios" que Estadísticas/Predicciones.
- **Mapa de vida** (`AchievementsView.jsx`, pestaña "Mapa de vida"): visualización cronológica de los Objetivos ya existentes (30 días a 10 años) como línea de tiempo — no crea ni duplica datos, reutiliza `objetivos.lista` tal cual.
- Nueva entrada en `MORE_NAV`: "Logros" (icono `Trophy`), justo después de Predicciones.
- **Modos "viaje/vacaciones/exámenes"** (`MODOS_APP` en `src/tokens.js`, nueva sección en `PersonalizationView.jsx`, `ModoBanner` en `DashboardView.jsx`): plantillas ligeras, no un motor configurable — 3 chips en Ajustes → Personalización avanzada; el activo (uno o ninguno) muestra un aviso con 2-3 recordatorios de texto fijo en el Dashboard. Nueva clave `personalizacion.modo` (mismo objeto guardado directo que el resto de Personalización, sin pasar por `snapshotAndSave`/deshacer).

### Verificado en este entorno (sin red real)
- `esbuild`: bundle completo (`src/main.jsx`, formato ESM, dependencias npm marcadas como externas) sin errores, 317.9kb.

## Fase 21 — Pulido final y QA (en curso, segunda pasada)

### Hecho en el turno anterior (primera pasada)
- Auditoría de coherencia visual: búsqueda de colores hexadecimales sueltos fuera de `src/tokens.js` en todo `src/`. Resultado: ningún color nuevo introducido en la Fase 20 está suelto (todo usa `COLORS`/`accent`/`hexToRgba`); los hallazgos existentes (`#080A0D` como color de texto sobre botón de acento, `#C9A24B` como color de aviso/riesgo medio) son un patrón ya establecido y repetido a propósito desde fases anteriores, no un defecto — no se tocan sin petición explícita de Josué (ver sección 17 del HANDOFF).

### Hecho este turno (segunda pasada)
- **Revisión de código de `src/lib/exportData.js`:** confirmado que `currentState` (`App.jsx`, línea ~443) excluye correctamente `relacion` y que sus claves coinciden exactamente con lo que `buildExportRows()` espera para cada módulo. Sin errores encontrados.
- **Revisión de código de `src/lib/supabase.js`:** patrón `loadData`/`saveData` genérico revisado sin errores. Caso de riesgo comprobado explícitamente: `loadData` no fusiona con el valor por defecto si ya existe una fila guardada en Supabase — se verificó que `personalizacion.modo` (añadido en la Fase 20) no rompe nada aunque llegue como `undefined` en un registro guardado antes de la Fase 20, porque todo el código que lo usa (`ModoBanner`, `ModoAppSection`, `setModoApp`) lo trata igual que `null`. No hace falta ninguna migración de datos.
- **Revisión del tono de la IA:** repasados los 13 `AIPanel` reales de la app (no 17+ como decía el HANDOFF — cifra corregida) en `BusinessView`, `DashboardView`, `DiaryView`, `EstudiosView`, `FaithView` (2), `FinanceView`, `HealthView`, `NutritionView`, `ObjectivesView`, `ProductivityView`, `SleepView`, `TrainingView`. Tono consistente en todos: factual, cita datos concretos del propio JSON en vez de opinar en abstracto, "aconseja/sugiere, no decide por él", y admite abiertamente cuando hay pocos datos para un patrón real. Confirmado que `HealthView`/`NutritionView` evitan dar objetivos calóricos o de peso estrictos, y que ambos `AIPanel` de `FaithView` incluyen `AVISO_DOCTRINAL`. No se ha necesitado tocar ningún `buildPrompt()`.

### Explícitamente pendiente (ver HANDOFF.md, sección 16)
- Repaso visual/contraste real, módulo por módulo, pantalla a pantalla — lo hecho hasta ahora (grep de colores) no sustituye mirar cada vista renderizada.
- Pruebas reales de exportación/offline/sincronización de extremo a extremo — Claude nunca ejecuta la app de verdad; el código ya se ha revisado (ver arriba), pero la prueba real la tiene que hacer Josué en Replit/Vercel.
