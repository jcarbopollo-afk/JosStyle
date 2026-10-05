# MOTION_SYSTEM — cómo se mueve JosStyle

> **Para qué sirve.** Que quien añada una pantalla, una tarjeta o un botón sepa sin preguntar
> *"¿cómo debe moverse esto?"* (F0, apartado 18). Lo que dice aquí está escrito como datos en
> `src/lib/motionMapa.js` (el mapa y el plan, F0) y en `src/lib/motion.js` (el motor, F1), y lo
> comprueban `scripts/test-motion-f0.mjs` y `scripts/test-motion-f1.mjs`: si este documento y las
> librerías dejan de decir lo mismo, la prueba se pone roja.
>
> **Estado: Motion System · Fase 1 de 20** (el motor). El índice de las 21 fases está en
> `docs/13_MOTION_SYSTEM_ORDEN.md`, y el mapa de cada elemento en `docs/MOTION_MAP.md`.

---

## 1 · La regla más importante: todo lo nuevo hereda motion

Es permanente (F0, apartado 19, y F1, apartado 24):

1. Todo lo nuevo —módulo, pantalla, tarjeta, botón, ventana, gráfica, interacción— se mira contra el
   **MOTION_MAP** antes de darlo por terminado.
2. Usa los tokens, la jerarquía y el contexto que ya existen: **ni una duración escrita a mano, ni una
   curva propia, ni un desplazamiento ni una escala con un número suyo**.
3. **Ningún componente nuevo crea su propio sistema de animación.** Usa una clase de `index.css`,
   `transicion()`, `escalonado()` o las primitivas del motor (sección 8).
4. Si necesita algo que todavía no existe: se identifica el patrón, se añade el token, el preset o la
   primitiva a `motion.js` (y su variable a `index.css`), se añade al mapa, se documenta aquí y se usa.
5. **Una animación que no está en el MOTION_MAP pone la suite roja** (`auditarMotion().sinMapa`), y la
   deuda medida en la F0 **no puede crecer** (`DEUDA_F0`, que la F1 bajó a cero en duraciones, curvas
   y retrasos escritos en las vistas).

## 2 · Lo que ya había, y no se tira

JosStyle ya tenía un lenguaje de movimiento aunque nadie lo llamara así, y el sistema lo respeta
(F0, apartado 1: *"Respeta lo que ya funciona"*):

- **Una sola curva**, `--ease-premium` (`cubic-bezier(0.32, 0.72, 0, 1)`, Fase N2): una deceleración
  enfática, sin rebote. **Es la `standard` del motor**, no se sustituye.
- **Un catálogo de animaciones**, `ANIMACIONES_HC` (`src/lib/pulidoHC.js`, E3 F14 y FIT F37), con su
  duración comprobada contra el CSS. El MOTION_MAP **se apoya en él**: no hay un segundo catálogo. Desde
  la F1 cada una de sus duraciones es un token.
- **Una escalera de escalas al pulsar** en `ui.jsx` (EH F50): 0,90 / 0,95 / 0,96–0,99 según el tamaño.
- **Los ids de Ajustes** (`completa`, `reducida`, `desactivadas`): no se renombran.

## 3 · La jerarquía: seis niveles

*"No todo debe tener la misma intensidad."* Las duraciones máximas salen de lo que JosStyle ya usa.

| Nivel | Nombre | Hasta | Para qué |
|---|---|---|---|
| 0 | **Estático** | — | Lo que no comunica nada al moverse: texto, etiquetas, la estructura. |
| 1 | **Micro** | 220 ms | Respuesta al dedo: pulsar, marcar, un interruptor, un chevron. |
| 2 | **Suave** | 340 ms | Algo aparece, se va o cambia de sitio: pantalla, tarjeta, aviso, hoja, barra. |
| 3 | **Protagonista** | 420 ms | El movimiento es la información: la portada de un área, un progreso, un mes. |
| 4 | **Momento** | 620 ms | Algo importante acaba de pasar: subir de rango, una racha que sube. |
| 5 | **Firma** | 900 ms | Solo de JosStyle, y muy poco: el «+1» de una racha. |

## 4 · El presupuesto

*"MUCHO DETALLE ≠ MUCHO MOVIMIENTO."*

- **Como mucho 6 elementos animándose a la vez** (la portada de un área: cabecera + cinco tarjetas).
- **Escalonado**: un paso de 60 ms para toda la aplicación y **seis escalones como mucho**: el elemento
  cuarenta de una lista entra con el sexto, no dos segundos después.
- **Duración**: 340 ms para lo normal, 420 ms para una transición, **700 ms** como tope absoluto de
  algo que no se repite (el de la E3 F14).
- **Spring**: solo cuando el dedo suelta algo con velocidad (una hoja, un deslizamiento). Nunca en una
  entrada que no ha tocado nadie, y ninguno rebota más de un 12 %.
- **Blur**: fijo, como material (la barra de abajo, una tarjeta de cristal, el velo de una hoja en
  Ultra). Nunca animado, y nunca una franja que tape el fondo sin motivo.
- **Escala**: dos techos, porque son dos cosas. **Una superficie** (tarjeta, hoja, pantalla) entra desde
  0,95 como poco y no crece de 1,03. **Una marca pequeña** (una llama, un ✓, una estrella) puede latir
  hasta 1,35: mide 16 px y el pulso es el mensaje (la F1 corrigió el techo único que escribió la F0).
- **Parallax**: en ningún sitio. Marea a quien tiene sensibilidad vestibular y no explica nada.
- **Bucles infinitos**: solo mientras algo carga de verdad.

## 5 · El carácter de cada área

| Contexto | Dónde | Carácter | Nivel máximo |
|---|---|---|---|
| Inicio | Hoy | **Calmado**: entra una vez y se queda quieto. | 3 |
| Bienestar | Salud, Sueño, Nutrición, Imagen personal | **Orgánico**: cambios suaves y continuos. | 3 |
| Entrenamiento | Fitness | **Con energía**, sin confeti ni gamificación infantil. | 4 |
| Vida | Estudios, Productividad, Mente, Biblioteca, Diario | **Ordenado**: lo que se completa se nota; lo que se lee, no se mueve. | 3 |
| Gestión | Organización, Economía, Negocio, Armario, Progreso | **Preciso**: la cifra manda, no su animación. | 2 |
| Ajustes | Ajustes | **Discreto**: casi nada se mueve. | 1 |
| Éxito | — | **Satisfacción**: una marca que entra y se queda. | 4 |
| Error | — | **Claro y sin agresividad**: aparece donde está el problema. | 2 |

## 6 · Los ajustes de movimiento (Ajustes → Apariencia → Texto y movimiento)

**Dónde se guardan:** `apariencia.animaciones`, `apariencia.velocidadMovimiento` y
`apariencia.reducirMovimiento`, dentro de `ajustes` (Supabase), como el resto de Apariencia. **Ni
localStorage ni una clave nueva.** `App.jsx` los escribe en `<html>` como `data-motion` y
`data-velocidad`, y de ahí los leen el CSS y el motor.

| Modo | Se guarda | Qué hace |
|---|---|---|
| **Sin movimiento** | `desactivadas` | Nada se mueve: todo aparece en su estado final. |
| **Reducido** | `reducida` | Sin desplazamientos ni escalas: fundidos que conservan el orden y el aviso de cada cambio. |
| **Normal** | `completa` | El movimiento de JosStyle. Es el de serie. |
| **Premium** | `premium` | Desplazamientos y escalas algo más amplios, dentro del presupuesto. Misma duración. |
| **Ultra** | `ultra` | Lo de Premium con más amplitud, y profundidad: el velo de una hoja desenfoca lo de detrás. |

- Un `minima` guardado antes (el cuarto nivel que había) **se lee como Reducido** y no se reescribe (C-52).
- **Velocidad**: Pausada (×1,3), Normal y Rápida (×0,75) multiplican **todas** las duraciones y retrasos
  desde un solo sitio. Con «Sin movimiento» no hay nada que acelerar, y la pantalla lo dice.
- **«Reducir movimiento»** (el interruptor de Ajustes o el del iPhone) manda sobre Normal, Premium y Ultra:
  se ve como **Reducido**, nunca como «Sin movimiento». Reducir no es romper (F1, apartado 17).
- **«Ver cómo se mueve»** repite la cascada de verdad con lo elegido, para notar la diferencia.

## 7 · Los tokens (src/lib/motion.js → index.css)

Una sola tabla en `motion.js`, escrita como variables CSS en `index.css` y **comparada por una prueba**
(`auditarTokensCss`). `:root` es Normal a velocidad Normal; cada modo cambia **solo la intensidad**
(`html[data-motion=…]`) y cada velocidad **solo el tiempo** (`html[data-velocidad=…]`).

| Familia | Tokens | Variable |
|---|---|---|
| Duración | instant 0 · ultraFast 120 · fast 160 · normal 220 · medium 280 · slow 340 · cinematic 420 · momento 620 · firma 900 · latido 1400 | `--motion-dur-*` |
| Curva | standard (= `--ease-premium`) · smooth · entrance · exit · emphasized · linear | `--motion-curva-*` |
| Spring | soft · normal · responsive · bouncy · heavy (ζ ≥ 0,6) | solo en JavaScript |
| Distancia | micro 4 · small 8 · medium 14 · large 24 · hero 40 px | `--motion-dist-*` |
| Escala (entrar) | micro 0,98 · subtle 0,97 · normal 0,96 · hero 0,82 | `--motion-escala-*` |
| Pulso | micro 1,08 · suave 1,12 · medio 1,18 · fuerte 1,25 · firma 1,35 · sobrepaso 1,03 | `--motion-pulso-*` |
| Opacidad | hidden 0 · subtle 0,45 · secondary 0,65 · visible 0,9 · full 1 | `--motion-opac-*` |
| Desenfoque | none 0 · subtle 4 · medium 10 · strong 20 px | `--motion-blur-*` |
| Escalonado | seis escalones de 60 ms | `--motion-retraso-0…5` |

🚨 **Ni un `calc()` con milisegundos en el CSS.** Las duraciones van ya calculadas por velocidad: si Safari
no resolviera un `calc` de tiempo dentro de un `animation`, la declaración entera sería inválida y la
aplicación se quedaría sin animaciones sin que fallara nada en Chromium (SF F1).

**La intensidad no es multiplicar.** *"Intensidad 50 % no significa todo × 0,5"*: cada escalón de la
jerarquía responde distinto (lo micro casi no cambia, lo hero cambia más), todo se recorta al
presupuesto y la jerarquía se conserva (`intensificar`).

## 8 · Cómo se mueve una pantalla nueva (la API)

De más sencillo a menos. Lo primero que sirva, eso:

1. **Una clase de `index.css` que ya existe**: `module-enter` (una pantalla entra), `hub-card` (una
   tarjeta de una lista entra en cascada), `hoja-entra` + `fondo-entra` (una hoja y su velo),
   `aviso-entra`, `tarea-hecha`, `habito-hecho`, `exito-entra`, `fit-pulsable`, `fit-barra`…
2. **La cascada**: `style={{ ...escalonado(indice) }}` sobre una tarjeta con `hub-card`. Nunca un
   `animationDelay` calculado en la vista.
3. **Una transición en el `style`**: `transition: transicion('width', 'slow')` o
   `transicion(['box-shadow', 'opacity'], 'medium')`. Nunca `0.4s ease`.
4. **Lo que el CSS no puede hacer**, con la Web Animations API a través del motor:
   - `animar(el, 'modalExit')` — un preset (`pageEnter`, `cardEnter`, `sheetExit`, `success`, `error`,
     `heroReveal`…); **si había otra animación en marcha, la nueva arranca desde donde está ahora**
     (interrumpir, apartado 12).
   - `<Presencia visible={x} entrada="modalEnter" salida="modalExit">` — montar y desmontar con su
     animación: sale antes de desaparecer, desmontada no ocupa sitio, y volver a mostrarla a mitad de la
     salida invierte sin parpadeo ni doble montaje.
   - `useFlip(refDelContenedor, clave)` (o `flip(elementos, cambiar)`) — cuando una lista cambia de
     orden o de tamaño, cada elemento viaja desde donde estaba en vez de saltar.
   - `compartirElemento(cajaDelOrigen, destino)` — tarjeta → detalle: el destino nace donde estaba el
     origen.
   - `useMotion()` — el contexto de ahora (modo, velocidad, intensidad, si está reducido).
5. **Si nada de eso sirve**: se añade al motor, no a la pantalla (sección 1).

Todo lo anterior respeta solo el modo, la velocidad y «Reducir movimiento». Una animación de
JavaScript lee el contexto antes de empezar; una de CSS lo hereda de los tokens.

## 8.1 · Cómo se mueve la navegación (F2)

**No hay que hacer nada para que una pantalla nueva navegue bien**: cualquier cosa que `App.jsx` pinte
va dentro de **un contenedor común** (`key={tab}`), y la clase de ese contenedor la decide
`tipoDeNavegacion(pilaAntes, pilaDespues)` (`src/lib/transicionNavegacion.js`) a partir de cómo cambió
la pila de NAVO F1. Tres movimientos, cada uno con su sentido (apartados 5-8):

| Qué pasa | Tipo | Clase | Cómo se ve |
|---|---|---|---|
| Se abre algo (un módulo, un submódulo) | `entrar` | `module-enter` | Llega desde la derecha, 24 px, en 340 ms |
| Se vuelve («← …», o la pestaña del área estando en uno de sus módulos) | `volver` | `nav-vuelve` | Llega 8 px desde la **izquierda**, ya medio visible, en 220 ms: lo de antes vuelve, no se estrena |
| Se cambia de sección en la barra de abajo | `seccion` | `nav-seccion` | Un fundido con un leve ascenso: las secciones son hermanas, ninguna está a un lado de otra |

Y lo que pasa en la página, **antes de pintar** (`useNavegacionEnLaPagina`, `src/components/navegacionMotion.js`):

- **El scroll se recuerda por pantalla de la pila**: entrar y cambiar de sección empiezan arriba; volver
  deja la pantalla donde estaba. Lo recordado vive en un `ref`, nunca en `app_data`.
- **Volver no repite las entradas** de la pantalla de antes (la cascada de un hub, su cabecera, la barra de
  volver, el mes del calendario): las que están en `ENTRADAS_QUE_NO_SE_REPITEN` se terminan en el acto. Si
  una pantalla nueva tiene una entrada de montaje que no debería repetirse al volver, **va a esa lista**.
- **El foco**, si se perdió con la tarjeta que se tocó, pasa a la pantalla nueva sin moverla.
- **La barra de abajo** tiene un indicador que viaja de pestaña a pestaña (`nav-indicador`,
  `estiloDelIndicador`); en Reducido aparece en su sitio en vez de viajar.

**Las pestañas DE DENTRO de una pantalla** (Comidas · Agua · Favoritos…) no son navegación: son un cambio
de contenido. Lo que cambia va en `<CambioDeContenido clave={pestana}>` (`src/components/motion.jsx`):
un fundido corto de lo de dentro (`contenido-cambia`, 160 ms), sin rehacer la página ni mover el scroll.
La primera vez no anima, porque ya está entrando la pantalla y serían dos fundidos a la vez.

**Y cada pantalla va dentro de un límite de error** (`AreaSegura`): si algo falla al pintarla, sale su
aviso con «Reintentar» y la barra de abajo sigue funcionando — nunca una pantalla en blanco a mitad de una
transición (apartado 18).

Lo que **no** es de la F2 —las ventanas (F6), arrastrar una hoja (F5 y F8), tarjeta → detalle (F7), los
filtros que recolocan una lista (F10) y el gesto de atrás del sistema (C-53)— está en `NO_EN_F2`.

## 8.2 · Cómo responde un componente al tocarlo (F3)

*"No quiero «más animaciones». Quiero: MEJOR FEEDBACK."* Lo primero que sirva, eso — y la última fila de
la tabla también es una respuesta:

| Si es… | Usa | Cómo se mueve |
|---|---|---|
| Algo que se toca y no es destructivo | La escalera `active:scale-*` (`ESCALAS_AL_TOCAR`, EH F50): 0,96 una tarjeta grande, 0,98 una fila, 0,95 un botón, 0,90 un icono | Encoge en `ultrafast` al pulsar y vuelve en `normal` con la curva `entrance` al soltar (llega y se posa, sin rebote). **No hace falta escribir ninguna transición**: la pone `index.css` a todo lo que lleva la clase. En Reducido no encoge: baja la opacidad |
| Algo que borra o descarta | `toque-destructivo` (o `BotonBorrar` / `BotonBorrarDefinitivo`, que ya la llevan) | No encoge: baja la opacidad. Un borrado no es un juego (apartado 28) |
| Encender o apagar algo | `<Switch checked onChange accent label />` | La bola viaja con `transform` y se estira un poco al pulsar; en Reducido salta y solo se funde el color |
| …cuando la fila entera es lo que se toca | La fila con `role="switch"` y `aria-checked`, y dentro `<PistaInterruptor encendido accent />` | El mismo movimiento, en pequeño |
| Algo que se abre y se cierra en su sitio | `<ChevronDespliegue abierto cerrado alAbrir />` (cerrado: `abajo` o `derecha`; al abrir: `arriba` o `abajo`), y `despliegue-entra` en lo que aparece | El mismo icono gira (nunca dos que se cambian) y el contenido llega con un fundido corto. Cerrar recolocando el resto es la F10 |
| Una marca que él pone y quita (favorito, estrella, corazón) | `<LatidoAlMarcar activo={…}>` alrededor del icono | Late una vez al ponerla; nunca al quitarla ni al abrir la pantalla |
| Pestañas dentro de una pantalla | `ToggleTab` (lleva `pestana-cambia` y `aria-pressed`) + `CambioDeContenido` (F2) | El color de la pestaña y el contenido cambian al mismo ritmo: una sola acción |
| El foco de teclado | Nada: el anillo con el acento sale solo en cualquier botón, enlace o interruptor | Aparece en su sitio, sin animar. Los campos de texto no cambian (C-32) |
| Lo que se repite cien veces al día y ya se entiende, lo decorativo y lo informativo | **Nada** | *"La ausencia de movimiento también forma parte del Motion System"* (apartado 35) |

**Lo que no puede volver**, y lo vigila `auditarComponentesMotion` (`src/lib/microinteraccionesMotion.js`)
con la línea de cada caso: una bola de interruptor movida con `left`, un chevron que se cambia por otro o
que se gira a mano, y una papelera que encoge.

🐛 **Y una lección de la F3 para cualquier animación de entrada nueva: termina con `backwards`, no con
`both`.** El último fotograma de una animación con `both` se queda puesto para siempre y gana a cualquier
regla normal: las tarjetas de las portadas (`hub-card`) llevaban desde la Fase N3 sin encoger al pulsarlas
y sin que las demás retrocedieran, con todo escrito y nada visible.

## 8.3 · Cómo se mueve un dato que cambia (F4)

*"El movimiento debe ayudar al usuario a entender QUÉ ha cambiado."*

| Si es… | Usa | Cómo se mueve |
|---|---|---|
| La cifra principal de una pantalla (una puntuación, un saldo, unas calorías) | `<CifraQueCambia valor={n} modo="cuenta">{texto}</CifraQueCambia>` (y `formato` si los pasos intermedios necesitan decimales o símbolo) | Recorre los valores intermedios con su precisión y acaba en EXACTAMENTE `texto`. Como mucho cuatro a la vez (`CUENTAS_A_LA_VEZ`); las demás se relevan |
| Cualquier otra cifra que cambia («2/3 hechos», un contador) | `<CifraQueCambia valor={n}>{texto}</CifraQueCambia>` | El valor nuevo ya está escrito y llega con un fundido corto: desde abajo si sube, desde arriba si baja |
| Una gráfica de Recharts | `const animGrafica = useAnimacionDeGrafica()` arriba del componente, y sus props en la serie (`animGrafica.linea`) y en el tooltip (`animGrafica.tooltip`) | Se dibuja una vez en `cinematic`; al cambiar los datos interpola (sin cambiarle la `key`); en Reducido aparece quieta |
| Una gráfica propia al cambiar de periodo o de métrica | `<CambioDeContenido clave={periodo}>` (F2) alrededor de la gráfica | Se funde en su sitio: es un cambio de datos, no de página |
| Un estado vacío | `EmptyHint` (lleva `vacio-entra`) | Un fundido corto, sin protagonismo |
| Una barra de progreso | Su transición de anchura (`transicion('width', …)`, F1) | Del valor de antes al nuevo, en las dos direcciones; al montarse no se dispara |

🚨 **Nunca al aparecer**: abrir una pantalla no cuenta de 0 al valor. Sin valor anterior, o sin dato (`null`),
no hay nada que animar. Y en Reducido una cuenta se vuelve relevo (el fundido, sin moverse).

## 9 · La arquitectura

- **Sin librería de animación.** Ni framer-motion ni ninguna otra: el movimiento ya vivía en
  `index.css`, una librería sería un segundo sistema al lado, y el archivo de la aplicación ya pesa
  4,4 MB (C-42). `package.json` lo vigila.
- **Lo que puede ser CSS, sigue siendo CSS**: entradas, pulsar, barras, cascadas. Así respeta los modos y
  el movimiento reducido sin una línea de JavaScript.
- **El motor (`src/lib/motion.js`) no importa nada** y no guarda nada: lo puede leer cualquier capa sin
  un ciclo, y se prueba en Node con elementos de mentira y en Chromium con los de verdad.
- **Las piezas de React (`src/components/motion.jsx`)** solo hacen lo que necesita React: `useMotion`,
  `Presencia`, `useFlip`, `CambioDeContenido`, `ChevronDespliegue`, `LatidoAlMarcar`, `CifraQueCambia` y
  `useAnimacionDeGrafica`. La navegación tiene su par: la decisión en
  `src/lib/transicionNavegacion.js` (se prueba en Node) y lo que pasa en la página en
  `src/components/navegacionMotion.js`.
- **Tailwind**: las clases `transition-*` usan por defecto el token `fast` y `--ease-premium`
  (`tailwind.config.js`), así que también respetan los modos.

## 10 · Cómo se comprueba

- `auditarMotion({ css, vistas })` (F0) lee `index.css` y todas las vistas y componentes: cada regla
  animada tiene que estar en el MOTION_MAP, ningún `@keyframes` puede quedar huérfano, el mapa y
  `ANIMACIONES_HC` tienen que decir la misma duración, y la deuda no puede crecer.
- `auditarTokensCss(css)` (F1) compara cada variable de `index.css` con la tabla del motor, en cada modo
  y cada velocidad, y `movimientoReducidoEnCss(css)` que reducir deje el fundido y apagar lo quite todo.
- La sección «MS F1» del recorrido de Chromium mide en la pantalla de verdad que cada modo, cada velocidad
  y el «Reducir movimiento» del sistema cambian lo que se ve, y prueba la interrupción, el FLIP y el
  elemento compartido con la Web Animations API real.
- La sección «MS F2» del recorrido mide la navegación de verdad: entrar desde la derecha y arriba, volver
  desde la izquierda al scroll de antes y sin repetir entradas, cambiar de sección con un fundido, el
  indicador de la barra, la transición de contenido de una pestaña, doce pestañas seguidas sin dejar nada
  colgado y Reducido sin desplazamientos.
- La sección «MS F3» mide los componentes de verdad: pulsar con transición y soltar con su curva, la tarjeta
  de una portada que encoge (y las demás que retroceden), Reducido sin escala, la bola del interruptor con
  `transform`, el chevron que gira por el camino corto, el anillo de foco con el acento y la estrella que
  late al marcarla y no al quitarla.
- La sección «MS F4» mide los datos: el saldo que no cuenta al abrir y cuenta de 88 a 100 al borrar un
  gasto, el vacío que entra, la línea de Sueño que se mueve ~420 ms (antes 1,5 s) y, en Reducido, una
  línea quieta y una cifra que se releva.
- `docs/MOTION_MAP.md` se genera del mapa y la prueba lo compara con el archivo.
