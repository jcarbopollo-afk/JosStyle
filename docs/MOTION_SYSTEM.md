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

## 8.4 · Cómo responde algo que se arrastra (F5)

*"La interacción táctil debe sentirse directa, física, natural y precisa. No quiero una app llena de rebotes."*

| Si es… | Usa | Cómo se mueve |
|---|---|---|
| Una hoja que sale por abajo | `<AsaHoja cajaRef={caja} onCerrar={…} />` como primer hijo de su caja (la misma `onCerrar` que su botón) | Sigue al dedo; hacia arriba resiste; al soltar se cierra si se lanza o pasa del 35 % de su altura —siguiendo su inercia, curva `exit`— y si no vuelve con el muelle `responsive` desde donde esté. Sin asa en una pantalla ancha (`sm:hidden`) |
| Algo que se desliza en horizontal para pasar a otro (la tarjeta del ejercicio) | `useDeslizarParaCambiar(zonaRef, { hayAnterior, haySiguiente, alCambiar })` y `touch-action: pan-y` en la zona | Sigue al dedo en cuanto el gesto es claramente horizontal; resiste donde no hay más; decide con distancia **y** velocidad; si no cambia, vuelve con muelle |
| Un umbral (cuánto, qué velocidad) | `UMBRALES_GESTO` (`src/lib/umbralesGesto.js`) | Uno solo para toda la aplicación: arranque, eje, velocidades mínima, de cierre y máxima, distancias, resistencia y reposo |
| Una decisión de gesto (eje, velocidad, cerrar o volver) | `ejeDeGesto`, `velocidadDeMuestras`, `conResistencia`, `decidirSoltar`, `decidirCambio` (`src/lib/gestosMotion.js`) | Se prueban en Node; ningún componente escribe la suya |
| Un gesto nuevo | Primero una línea en `AUDITORIA_F5`, y sus decisiones en el motor (apartado 38) | Nunca una solución aislada en una vista |

🚨 **Mientras el dedo arrastra, se mueve el `transform`, nunca un estado de React**, y la animación de
vuelta se cancela si el dedo vuelve a agarrar (apartado 19). 🚨 **En Reducido el dedo sigue moviendo lo que
arrastra** —eso es manipular, no animar—, pero al soltar no hay muelle ni inercia: llega a su sitio al momento.
⚠️ **Un gesto nunca es la única forma**: el asa no tiene nombre ni foco porque la hoja tiene su botón de
cerrar, Escape y tocar fuera; y la tarjeta del ejercicio tiene Anterior y Siguiente.

## 8.5 · Profundidad, capas y z-index (F6)

*"Contenido → superficie → elemento elevado → interacción → modal → sistema. Todo debe parecer pertenecer al
mismo universo físico."* El sistema vive en `src/lib/profundidad.js`.

**La jerarquía de capas** (`CAPAS_Z`, en `index.css` como `--z-*` y en Tailwind como `z-capa`…):

| Capa | z | Qué vive ahí |
|---|---|---|
| `fondo` | -1 | El fondo de pantalla, su luz y su velo |
| `base` | 0 | La página (y la barra de abajo, que va después en el documento) |
| `elevado` | 5 | Una tarjeta que se levanta al abrirse |
| `pegajoso` | 20 | La cabecera fija de un área y la del entrenamiento en vivo |
| `flotante` | 30 | La lupa y las sugerencias |
| `aviso` | 40 | Un aviso pequeño (añadido, deshacer) |
| `capa` | 50 | Hojas, ventanas, pantallas por encima y visores. Entre ellas manda el orden de apertura |
| `alerta` | 70 | Lo que tiene que quedar encima aunque se haya montado antes |

| Si es… | Usa | Cómo se ve y se mueve |
|---|---|---|
| Cualquier ventana, hoja, pantalla por encima o visor | Un portal sobre el `body` con `fixed inset-0 z-capa` y `background: CAPAS.veloHoja` (si tiene velo) | **No escribe su movimiento**: `useCapasMotion` (montado una vez en App.jsx) le da entrada y salida según lo que es (`tipoDeCapa`, con el estilo calculado): una **hoja** sube desde su borde y baja hacia él; una **ventana** aparece desde el centro (`modalEnter`/`modalExit`); una **pantalla** entra como un módulo y se va hacia la derecha; un **visor** se funde. El velo se funde a la vez. Al cerrar, una copia inerte hace el camino de vuelta |
| Una sombra de elevación | `sombra('flotante')` (o `var(--sombra-…)` en CSS) | `reposo`, `pomo`, `elevada`, `flotante`, `maxima`. Un anillo de selección no es elevación |
| Un desenfoque | `desenfoque('medium')` | Los de la F1 (`--motion-blur-*`): `medium` para el cristal pequeño, `strong` para lo que tapa una franja ancha |
| Un panel que nace de un botón | `menu-entra` y su `transform-origin` | Crece desde la esquina de su botón, en `fast` |
| Un z-index | `z-capa`, `z-flotante`… (o `var(--z-…)`) | **Nunca un número**: `auditarProfundidad` lo caza |

🚨 **Lo responsive se decide solo**: la misma caja es hoja en el iPhone (`items-end`) y ventana en el escritorio
(`sm:items-center`), y la capa lo lee del estilo calculado (`data-capa`). 🚨 **En Reducido se queda la profundidad
estática** —el velo y el fundido— y se van la escala y el recorrido. ⚠️ **La profundidad nunca depende solo de la
sombra** (en oscuro aporta poco): se separa con superficie, borde, velo y cristal, y siempre hay estructura
(`role="dialog"`, foco, Escape).

## 8.6 · Continuidad espacial y elementos compartidos (F7)

*"Estado A → transformación espacial → estado B"*, no *"pantalla A → animación → pantalla B"*. El sistema vive en
`src/lib/continuidad.js` (el mapa, el registro de orígenes y los planes) y `src/components/continuidad.jsx`.

**El mapa** (`MAPA_TRANSICIONES`) dice, para cada relación entre dos sitios, su nivel (micro · contextual ·
estructural · capa), su movimiento y su protagonista: sección → sección es un fundido con el indicador que viaja
(F2); tarjeta → pantalla, la pantalla que crece desde la tarjeta; pantalla → tarjeta, la tarjeta que se posa;
padre → hijo se acerca y hijo → padre se retira (F2); lista → detalle, el elemento que viaja; detalle → capa, la F6.

| Si es… | Usa | Cómo se mueve |
|---|---|---|
| Una tarjeta que ES lo que abre (la de la portada de un área) | `apuntarOrigen('pantalla:<id>', tarjeta)` justo antes de navegar; la pantalla la hace crecer `useContenedorDesdeOrigen` (App.jsx) | El recorte de la pantalla nueva empieza en el rectángulo de la tarjeta, con sus esquinas, y se abre hasta la pantalla entera (`slow`, curva enfatizada) mientras lo de dentro se revela. Sin la entrada desde la derecha a la vez |
| Volver a la portada de la que se salió | `vieneDe` (App.jsx → HubView) y `animarLlegada` | La tarjeta se posa: de 1,02 y más clara, a su sitio |
| Lo mismo en dos sitios (el nombre de un ejercicio en la lista y en su ficha) | `<Compartido id="ejercicio:<id>" as="p">` en los DOS sitios | Viaja de uno a otro (FLIP) en `medium`; un texto crece por su letra, nunca se estira; una superficie o una imagen interpolan sus esquinas. En los dos sentidos |
| Una tarjeta que es un RESUMEN (Inicio) | Nada: entra como cualquier pantalla (F2) | Crecer desde ella prometería que dentro está lo mismo que en la tarjeta |

🚨 **El origen se apunta y caduca** (`TTL_ORIGEN_MS`, 700 ms): JosStyle pinta una pantalla cada vez, así que lo de
antes ya no existe cuando lo nuevo aparece. Tomar un origen lo gasta: dos destinos no salen del mismo toque.
🚨 **Fallback**: sin origen, con un viaje desmesurado (más de ×3) o en Reducido, no hay viaje: queda la entrada de
siempre o un fundido en su sitio. Nunca un destello, un hueco ni un elemento que desaparece.
⚠️ **Si el padre mueve el scroll después de medir** (abrir un detalle de Fitness lo lleva arriba), el viaje se
corrige en el primer `requestAnimationFrame`, antes de pintar nada.

## 8.7 · Física: muelles, estados de un gesto y un solo dedo (F8)

*"No quiero una app llena de rebotes. Quiero una app que parezca responder físicamente al usuario."* La F5
construyó el motor de los gestos; la F8 le pone el orden. Vive en `src/lib/fisicaMotion.js`.

**La jerarquía de muelles** (`JERARQUIA_MUELLES`), los mismos cinco de la F1 (`SPRINGS_MOTION`) con su papel:

| Papel | Muelle | Para qué |
|---|---|---|
| snappy | **ninguno** | Interruptores, botones, indicadores: un toque no suelta nada con velocidad, va por **tiempo** (F3: `ultraFast` al pulsar, la curva `entrance` al soltar). *"No todo debe ser spring"* (apartado 4) |
| responsive | `responsive` | Lo que va pegado al dedo: hojas y la tarjeta del ejercicio. **Es el que usa hoy la aplicación** |
| standard | `normal` | Una tarjeta que se arrastre (hoy ninguna) |
| soft | `soft` | Una pantalla entera |
| heavy | `heavy` | Arrastrar y soltar para reordenar (hoy se reordena con flechas) |
| bouncy | `bouncy` | **Nada**: es el único que rebota, y la pieza que lo quiera tiene que justificarlo (apartado 8) |

🚨 **Ninguno de los que se usan rebota, y se MIDE**: `sobrepasoDe` y `cruces` muestrean el muelle y
`muelleSinRebote` exige pasarse como mucho `SOBREPASO_MAXIMO` (medio por ciento). La velocidad del dedo **sí
cuenta** (apartado 9): la vuelta sale con la que traía (`vueltaConMuelle`) y un lanzamiento rápido sale antes que
uno lento (`salidaConInercia`, entre `fast` y `normal`). Los umbrales siguen en UN sitio: `UMBRALES_GESTO`.

**Los estados de un gesto** (`siguienteEstadoGesto`, apartados 35 y 36), escritos en `data-arrastre`:

`quieta` (IDLE) → `arrastrando` ⇄ `umbral` (si se suelta AHORA, se cierra) → `volviendo` / `cerrando` (SETTLING) →
`quieta` / `cerrada` (DISMISSED). Agarrar la hoja mientras vuelve o mientras se va es una transición más
(*"settling → new gesture"*); un evento que no toca en un estado lo deja como está, y un estado desconocido se lee
como `quieta`. **Nadie escribe `data-arrastre` a mano**: pasa por la máquina.

| Si es… | Usa | Cómo se comporta |
|---|---|---|
| El velo de una hoja mientras se arrastra | `veloDuranteArrastre(fondo, progreso)` (ya lo hace `AsaHoja`) | Se aclara en proporción a lo que baja la hoja —hasta un 60 %—: lo de debajo recupera protagonismo (apartado 16). Si la hoja vuelve, el velo vuelve con ella y en su mismo tiempo; si se cierra, se apaga con la salida de las capas (F6) |
| Un gesto de un dedo | `punteroQueCuenta(gesto, ev)` en cada `pointermove` y `pointerup` | El gesto es del dedo que lo empezó: un segundo ni lo mueve, ni lo suelta, ni empieza otro (apartado 34). Lo usan el asa, deslizar entre ejercicios y el divisor y el zoom del comparador |
| Un gesto que se pudo perder | `gestoAbandonado(gesto, ev, capturado)` | Sin muestras en `GESTO_ABANDONADO_MS` (600) y sin el puntero capturado, el dedo se levantó donde no se le oyó: el siguiente gesto puede empezar. Un dedo QUIETO sigue capturado y no se le quita |
| Un punto háptico | `PUNTOS_HAPTICOS`: se emite al bus (`emitir`) y el motor de audio decide | Hoy se emiten los que ya sonaban (serie hecha, fin de un descanso). Los del gesto no: no puede sentirse distinto que el botón que hace lo mismo |

🚨 **Al cancelarse un gesto no queda nada a medias** (apartado 33): ni un `transform`, ni un velo aclarado, ni un
estado colgado. ⚠️ **Ni anclajes, ni magnetismo, ni parallax** (`NO_EN_F8`): ninguna hoja tiene dos alturas y el
enunciado pide no ponerlos por moda. 🚨 **En Reducido** el dedo sigue moviendo lo que arrastra —y el velo con él—,
pero al soltar no hay muelle ni inercia. ⚠️ **Ningún gesto es la única forma** (apartado 39): toda hoja con asa
tiene su botón de cerrar, y el divisor del comparador se mueve con las flechas.

## 8.8 · Estados, carga, errores y avisos (F9)

*"Cada interacción debe comunicar algo."* La F3 hizo que pulsar respondiera; la F9 hace que **esperar,
equivocarse y confirmar** también lo hagan. Vive en `src/lib/estadosInteraccion.js` y en `ui.jsx`.

| Si es… | Usa | Cómo se comporta |
|---|---|---|
| Un botón que espera algo que tarda | `<PrimaryButton estado="cargando" textoCargando="Subiendo…">` (o `GhostBtn`; dentro de un botón propio, `TextoDeBoton`) | El texto cambia **en su sitio** —las capas se apilan, así que el botón **no cambia de ancho**—, **no se apaga** (apagado parecería roto), lleva `aria-busy` y el toque no repite la acción. El giro solo aparece si tarda más que `RETARDO_INDICADOR` (`slow`) |
| Una acción que terminó y el botón sigue ahí | `estado="hecho"` (✓ breve) o `estado="fallo"` | Si la pantalla se cierra, ya lo confirma el aviso o el propio cierre: nunca una celebración por guardar |
| Un campo enfocado | Nada: `TextInput`, `Textarea`, `SelectInput` y `Select` llevan la clase `campo` | El borde pasa al acento con un halo suave (`fast`). 🐛 Antes no cambiaba nada: `outline-none` quitaba el anillo y no había otro |
| Un campo que no vale | `aria-invalid` + `<MensajeDeCampo id=…>` con `aria-describedby` | Borde rojo y la frase debajo, que diga **qué corregir** (EH F62), con un fundido corto. **Sin temblar** (apartado 23) |
| Un aviso de «hecho» con deshacer | `AvisoAccion`, montado **siempre** (con `accion` vacía) | Entra (`aviso-entra`) y **sale** (`toastExit`, `fast` con la curva de salida). Antes desaparecía de golpe |

🚨 **El acento existe también fuera de la pantalla** (`--accent` y `--color-negativo` en `documentElement`, App.jsx):
las hojas son portales sobre el `body`, y el borde de foco de un campo dentro de una caía al color del texto.
⚠️ **Un temblor y un «Guardando…» escrito a mano ponen la suite roja** (`auditarEstadosInteraccion`). Lo que la F9
no hace —quitar un elemento de una lista con su hueco, los estados del sistema, los contadores, una bandeja de
notificaciones— está en `NO_EN_F9` con la fase que lo hace.

## 8.9 · El diseño que cambia: listas, desplegables y lo que carga (F10)

*"El layout puede cambiar. La percepción del usuario no debe romperse."* Borrar una tarea hacía saltar
las de debajo y cerrar un desplegable subía lo de abajo de golpe (`listas_que_saltan`, C-54). El plan
—qué entra, qué sale, qué se recoloca, con un presupuesto— lo decide `src/lib/layoutMotion.js`; las
piezas son `ListaAnimada` y `Plegable` (`src/components/layoutMotion.jsx`).

| Si es… | Usa | Cómo se comporta |
|---|---|---|
| Una lista que él edita (añadir, borrar, completar, reordenar, filtrar) | `<ListaAnimada>` y `data-flip-id` con el **id** en cada fila (o en su envoltorio), **nunca el índice** | Mide justo antes y justo después de cada cambio (FLIP). Lo que entra se funde y sube un poco; lo que sale deja una **copia inerte** (`aria-hidden`, sin ids) que se desvanece en `fast`; lo demás se recoloca en `normal` cuando la copia ya ha empezado a irse. Por encima de `PRESUPUESTO_LAYOUT.maxAnimados`, un fundido de la lista entera |
| Bloques que agrupan filas (las secciones de Tareas, la agenda de un día) | `data-flip-id` también en el bloque | La fila se mide dentro de su bloque: no se mueve dos veces. Lo que cambia de bloque sale de uno y entra en el otro |
| Algo que se abre y se cierra en su sitio | `<Plegable abierto={x}>{() => …}</Plegable>` | La altura crece y decrece (`grid-template-rows`, sin alturas a mano) y **después** se desmonta; mientras se cierra, lo de dentro es `inert`. Lo de dentro como función: cerrado no se calcula |
| Una imagen | Su hueco: alto, `aspect-…` o `width`/`height` | Al cargar no empuja nada. `imagenesSinHueco` caza la que nazca sin él |
| Una pantalla entera, un reloj, una cifra que se actualiza | Nada de esto | Una pantalla es la F2; una cifra, la F4 |

🚨 **Reducido**: lo que entra y lo que sale se funden en su sitio, lo demás **se coloca sin viajar** y un
desplegable cambia de altura sin animarse. **Otro ancho** (girar el iPhone, el teclado) no anima nada.
⚠️ **Las fuentes se piden mientras cargan los datos** (`useFuentesListas`, con un tope de 800 ms): el primer
Hoy ya no cambia de ancho al llegar Manrope. ⚠️ **Un desplegable nuevo con `{x && <div className="despliegue-entra…">}`
pone la suite roja** (`auditarLayout`): es `Plegable`. Lo que la F10 no hace —un indicador que viaja entre
las pestañas de dentro (C-61), una cabecera que se compacta, datos en tiempo real, el esqueleto que se funde
con el contenido (F16)— está en `NO_EN_F10` con su motivo.

## 8.10 · El orquestador: quién manda cuando dos coinciden (F11)

*"No quiero una colección de animaciones. Quiero un Motion Engine real y orquestado."* Vive en
`src/lib/orquestadorMotion.js`, que es una **hoja del árbol de imports** (no importa nada: el motor de la F1 pasa
por él sin ciclo). No es un framework: es un **registro** —qué anima a qué elemento, de qué sistema, con qué
prioridad, en qué grupo— y las reglas que se aplican al empezar algo nuevo.

```
Motion Tokens (motion.js · index.css)
      ↓
Motion Engine (motion.js: animar, flip, compartirElemento)
      ↓
Motion Orchestrator (orquestadorMotion.js: animarOrquestado, tomarControl, grupos, líneas de tiempo)
      ↓
 Navegación · Continuidad · Profundidad · Gestos · Estados · Datos · Layout · Micro · Decorativa
```

| Si es… | Usa | Cómo se comporta |
|---|---|---|
| Cualquier animación por JavaScript | `animarOrquestado(el, fotogramas, opciones, { sistema, prioridad?, grupo?, id?, desdeLoQueSeVe? })` | 🚨 **Nadie llama a `.animate(` por su cuenta** (`auditarOrquestacion`). Sin prioridad, la de su sistema (`SISTEMAS_MOTION`) |
| Dos animaciones sobre la MISMA propiedad del mismo elemento | Nada: lo decide `resolverConflicto` | Más peso gana (`PRIORIDADES_MOTION`: crítica > navegación > gesto > estado > layout > micro > decorativa); con el mismo, la última, **saliendo de donde se ve**. La que pierde **cede** (no empieza) o se **interrumpe** |
| Combinar movimientos de dos sistemas en un elemento | `translate` / `scale` / `rotate` individuales, o un envoltorio | Se componen con `transform`: ni uno pisa al otro |
| El dedo agarra algo que se mueve | `tomarControl(el, ['transform'], 'gestos')` | Se para lo que lo movía —sea cual sea su prioridad, y aunque no pasara por el orquestador— leído antes, y el dedo sigue desde ahí |
| Varias animaciones que son UNA operación | `grupo` (`capas`, `navegacion`…), y `iniciarGrupo` / `cancelarGrupo` / `completarGrupo` / `terminaGrupo` | Iniciar un grupo que sigue en marcha lo interrumpe primero |
| Una secuencia (A → B, en paralelo, escalonada, a mitad de otra) | `planificarLinea` (el plan) o `crearLinea` (el plan y sus animaciones, con pausar, reanudar, invertir, ir a un punto) | Sin código por pantalla. La lista de la F10 es una: lo que sale, y a mitad de su salida lo demás |

🚨 **«Sin movimiento» es una política del orquestador**: no empieza nada. Con **48 animaciones a la vez**, lo micro
y lo decorativo no empiezan (`PRESUPUESTO_ORQUESTADOR`). Una animación que el navegador no puede hacer devuelve
`null` y el elemento queda en su estado final. ⚠️ **Depurar**: solo en desarrollo y con
`localStorage["josstyle:motion-debug"] = "1"` — `window.__motion` (estado, diario de `MOTION_START`…`MOTION_ERROR`,
grupos) y un contorno con el sistema en lo que se anima. Lo que la F11 no hace —un framework, un estado de React
para el movimiento, migrar todo a propiedades individuales— está en `NO_EN_F11`.

**Regla permanente (apartado 47):** antes de crear una animación nueva, buscar una existente, reutilizarla,
extenderla, y solo si falta, crear una abstracción — **y que pase por `animarOrquestado`**.

## 8.11 · Accesibilidad: el movimiento nunca es una barrera (F12)

*"Separar el MOVIMIENTO del SIGNIFICADO."* Si se quita una animación, lo que quería decir se sigue diciendo. Vive
en `src/lib/accesibilidadMotion.js` y `src/components/accesibilidadMotion.jsx`.

| Si es… | Usa | Cómo se comporta |
|---|---|---|
| Saber cuánto movimiento toca | `intensidadDe(ctx)` → `full` · `reduced` · `none` | Una sola fuente: el contexto del motor (Ajustes y el iPhone). 🚨 Ninguna pantalla pregunta por su cuenta a `matchMedia` |
| Llevar la vista a un elemento | `desplazarHasta(el, { block })` | Se desliza con movimiento completo y **salta** en Reducido. 🐛 Eran siete `behavior: 'smooth'` a mano |
| Un giro de carga sin texto al lado | `<GiroDeCarga texto="Cargando la foto…" />` | Su texto va para VoiceOver (`role="status"`); quieto en Reducido sigue diciendo algo |
| Algo que se repite sin fin | Una línea en `BUCLES_INFINITOS` y su regla de Reducido | El esqueleto y el giro se quedan quietos en Reducido (🐛 antes seguían) |
| Una celebración | Tokens de pulso y distancia | Completa (late), reducida (los pulsos valen 1: queda el fundido) y estática (la cifra) |
| Una vibración | Emitir al bus | Decide el motor de audio con el 📳 de Ajustes: **reducir el movimiento no la apaga** (`HAPTICOS`) |

🐛 **El foco no se pierde**: borrar una fila de una `ListaAnimada` con el teclado deja el foco en la fila que ocupa su
sitio, y plegar un `Plegable` con el foco dentro lo devuelve a su botón antes de volverse inerte. 🐛 **La navegación
se oye**: el contenedor de cada pantalla es una región con su nombre y `AnuncioDeNavegacion` lo dice al llegar.
⚠️ **En Reducido el dedo sigue moviendo** una hoja: un gesto que cumple una función no se quita. Lo que no se hace
—una intensidad «minimal», adaptar por dispositivo, otra preferencia— está en `NO_EN_F12`.

**Regla permanente (apartado 50):** todo movimiento nuevo contesta `PREGUNTAS_DE_UN_MOVIMIENTO` (qué comunica, si
hace falta, qué pasa en Reducido, con teclado, con VoiceOver, en táctil, con menos rendimiento, si se puede
interrumpir y si se puede quitar sin romper nada). Si no tiene buenas respuestas, no se añade.

## 8.12 · Rendimiento: lo que cuesta cada movimiento (F13)

*"Mantener la máxima calidad visual utilizando el mínimo coste técnico necesario."* No se quita una animación para
ganar fotogramas: se mide, se localiza y se cambia el **cómo**. Vive en `src/lib/rendimientoMotion.js`.

**El presupuesto** (`PRESUPUESTO_FOTOGRAMA`): **16,67 ms** por fotograma a 60 Hz y **8,33 ms** a 120 Hz (el iPhone con
ProMotion). Ir a 60 FPS en una pantalla de 120 Hz es perder uno de cada dos. Un fotograma de más de 50 ms es una
tarea larga. `resumenDeFotogramas(intervalos, { hz })` resume unos intervalos medidos (FPS, percentil 95, el peor,
perdidos y largos).

**Lo que cuesta cada propiedad** (`costeDe`): `composicion` (`transform`, `opacity`: la GPU mueve una capa ya
pintada), `pintado` (`box-shadow`, `filter`, un color, `clip-path`: se repinta la caja) y `diseno` (`width`,
`height`, `margin`, `grid-template-rows`: se recoloca la página). **Componer antes que pintar, pintar antes que
recolocar.**

| Regla | Cómo se cumple |
|---|---|
| Una animación de pintado o de diseño en `index.css` | Se puede, pero con su línea en `COSTES_DECLARADOS` (qué regla, qué propiedad y por qué es el coste justo). Sin línea, la suite se pone roja |
| Un desenfoque (`backdrop-filter`, `blur`) | **Fijo, como material, nunca animado** (la barra de abajo, el cristal de la portada, el velo de Ultra) |
| `will-change` o forzar capas de GPU | **Ni uno.** El navegador sube a su capa lo que anima `transform` u `opacity` mientras dura; una capa permanente cuesta memoria |
| Un escuchador de `scroll`, `wheel` o un toque | Dice `passive` (`passive: false` es una decisión, no decir nada no lo es) |
| Algo que se pinta en cada fotograma | `requestAnimationFrame`, que se para solo con la pestaña escondida; ni un `setInterval` en una pieza de movimiento |
| Leer el tamaño de varias cosas y escribirles algo | **Primero se lee todo y luego se escribe todo**: leer después de escribir obliga a recalcular en el acto |
| Algo que guarda nodos para más tarde | Se poda al caducar: ningún nodo desmontado se queda en un registro |

`auditarCosteMotion({ css, fuentes })` caza las seis cosas sobre `index.css` y todo `src/`, y cada una de sus reglas
(`REGLAS_COSTE`) trae su ejemplo malo con la prueba de que lo caza.

**Lo que se midió en Chromium** (la sección «MS F13» del recorrido, con el protocolo de las herramientas de desarrollo):

| Qué | Antes | Ahora | Qué se hizo |
|---|---|---|---|
| Pulsar una tarjeta de la portada (300 ms) | 24 pintados en 11 fotogramas | 6 pintados en 2 (al empezar y al acabar) | La sombra levantada ya no anima `box-shadow`: es un pseudo-elemento pintado una vez que se **funde** (`opacity`); la máxima, otro encima |
| Soltarla y abrir su módulo | 64 pintados en 27 momentos | 42 en 16 | La expansión crece con `transform` y brillo; la sombra máxima se funde |
| Desplazar una portada bajo su cabecera | 1,33 recálculos de estilo por paso | 0,96 | El fundido (SF2) lee todas las tarjetas antes de escribir ninguna máscara |
| Tres rondas de abrir, cerrar y navegar | — | 0 MB que no vuelvan, 0 animaciones vivas | Los orígenes de la F7 caducan (`podarOrigenes`): antes, cada nombre de la biblioteca dejaba su nodo desmontado guardado para siempre |

⚠️ **Los tiempos de Chromium sin pantalla no son los del iPhone**: lo que se comprueba es lo estructural (cuántos
pintados, cuántos recálculos, cuánta memoria que no vuelve) y los fotogramas se escriben en el registro como
referencia.

**La calidad adaptativa** (`CALIDADES_MOTION`): `full` (Premium y Ultra), `standard` (Normal), `reduced` (Reducido) y
`minimal` (Sin movimiento). **No es un ajuste**: sale del modo. Y las rebajas automáticas son las que **se miden**
(`REBAJAS_AUTOMATICAS`: demasiadas animaciones a la vez, una lista que cambia entera, una cascada larga, Reducir
movimiento), nunca una suposición sobre el aparato —ni los núcleos, ni la memoria, ni la batería— (🔓 C-64, que
respeta la F12).

**El monitor de fotogramas** (solo en desarrollo, con `localStorage["josstyle:motion-debug"] = "1"`):
`window.__motion.fotogramas.empezar()`, `.leer()` y `.parar()`. Dice los fotogramas (FPS, peor, perdidos), las tareas
largas, la pantalla, la calidad y las animaciones del orquestador por sistema. 🚨 **Con la pestaña escondida se para**:
no deja un fotograma pedido.

**Regla permanente (apartado 53):** toda animación nueva cumple los cinco criterios de `CINCO_CRITERIOS` —calidad
visual (`auditarMotion`), accesibilidad (`auditarAccesibilidadMotion`), rendimiento (`auditarCosteMotion`), que se
pueda interrumpir (el orquestador, `resolverConflicto`) y que se limpie (`auditarOrquestacion`)—. Si falla uno, se
revisa antes de entrar. Lo que se miró y está bien está en `REVISADO_Y_BIEN_F13`; lo que no se hace (typecheck y
lint, listas virtuales, capas forzadas, un ajuste de calidad, rebajar por el aparato), en `NO_EN_F13`.

## 8.13 · El lenguaje del movimiento: curvas, ritmo y firma (F14)

*"Dos interfaces pueden utilizar 300 ms y parecer completamente diferentes."* Los tokens existían desde la F1; lo
que faltaba era la **gramática**: qué curva le toca a qué papel, qué duración a qué talla, que abrir y cerrar no
sean lo mismo al revés y que lo equivalente vaya al mismo ritmo. Vive en `src/lib/lenguajeMotion.js`, y **no tiene
ni un valor propio**: todo son ids de los tokens de la F1 (apartado 51).

**La filosofía y la firma** (`TEMPERATURA_MOTION`, `FIRMA_MOTION`): **preciso, premium y natural**. Ni mecánico
(`linear` solo para relojes y bucles) ni de dibujos (ningún muelle que se use rebota; una superficie no pasa de
1,03). Y no es una landing page: el movimiento sirve para entender, orientarse, tocar y seguir el hilo. Lo que hace
que se reconozca: una deceleración larga y suave (`--ease-premium`), distancias cortas (4-24 px), escalas
contenidas, volver más corto que entrar, salidas que no se quedan mirando, una cascada que no hace esperar, sombras
que se funden y **un solo momento de firma** (el «+1» de una racha).

**Las curvas tienen papel** (`ROLES_MOTION`): una curva, un significado.

| Papel | Curva | Qué |
|---|---|---|
| Llega | `standard` (`--ease-premium`) | Algo se mueve a su sitio con relación espacial: una pantalla, volver, una tarjeta, una cifra, una fila que se recoloca, lo que responde al dedo |
| Aparece | `entrance` | Algo aparece en su sitio sin venir de otro: una hoja, una ventana, un menú, un aviso, un mensaje de error, un vacío, el contenido de un desplegable. Llega deprisa y se posa |
| Sale | `exit` | Algo se va: arranca suave y sale sin frenar. Nunca la curva de su entrada |
| Abre y cierra | `smooth` | Lo que va y vuelve en su sitio: un desplegable y su chevron. Simétrica |
| Momento | `emphasized` | Algo importante acaba de pasar: los niveles Momento y Firma del mapa (subir de rango, la llama, el «+1») |
| Ritmo | `linear` | Relojes y bucles (el aro del Pomodoro): frenar mentiría |

El papel de cada animación lo dice su línea del `MOTION_MAP` (`rolDe`): las categorías de capas, hojas, menús y
avisos **aparecen**, los niveles 4 y 5 son **momentos** y el resto **llega**. Las excepciones van con su motivo en
`ROL_POR_CLASE`, y las tres clases que usan dos curvas a propósito (una por propiedad), en `CURVAS_DOBLES`.

**La escala** (`ESCALA_MOVIMIENTO`, apartados 16-18): cinco tallas, una por nivel del mapa, cada una con las
duraciones que le caben y cuánto se desplaza como mucho.

| Talla | Nivel | Duraciones | Distancia máxima |
|---|---|---|---|
| XS · Micro | 1 | `ultraFast`, `fast`, `normal` | `small` |
| SM · Suave | 2 | `fast` … `slow` | `large` |
| MD · Protagonista | 3 | `normal` … `cinematic` | `large` |
| LG · Momento | 4 | `medium` … `momento` | `hero` |
| XL · Firma | 5 | `firma` | `hero` |

**La velocidad que se ve** (`velocidadesPercibidas`, `BANDA_VELOCIDAD`, apartados 7 y 8): lo que el ojo compara son
los píxeles por milisegundo. Todas las entradas que se desplazan están entre **0,015 y 0,08 px/ms** (de 0,018, una
cifra que asoma 4 px, a 0,071, una pantalla que entra 24 px); el «+1» va más despacio **a propósito**
(`VELOCIDAD_A_PROPOSITO`).

**Entrar y salir, abrir y cerrar** (`PAREJAS`, apartados 4-6, 39 y 42): lo que se va **dura lo mismo o menos** que lo
que llega y acelera hacia fuera (`exit`); volver dura menos que entrar y sin escala; desplegar es `medium` y plegar
`fast`, los dos con `smooth`. Y lo **equivalente va al mismo ritmo** (`EQUIVALENTES`): las cuatro barras de progreso
(el día, los libros, Nutrición y Fitness) en `medium`, las dos hojas en `normal`, volver y cambiar de sección en
`normal`, y lo pequeño que aparece en su sitio en `fast`.

**El lenguaje de cada capa, de la navegación y de los gestos** (`LENGUAJE_CAPAS`, `LENGUAJE_NAVEGACION`,
`LENGUAJE_GESTOS`): una ventana aparece casi en su sitio y se va en `fast`; una hoja es física y pegada al borde; un
menú es más ligero que una ventana (`fast`, 4 px, sin velo); un aviso aparece, dice y se va sin robar atención; no hay
tooltips (sin puntero que se pose). Raíz con un fundido, dentro de una pantalla `contentChange`, detalle desde la
derecha, volver desde la izquierda, y una hoja se apila encima. En un gesto, la velocidad del dedo decide, nada
rebota, el dedo para lo que se mueve donde se ve, y todo se puede deshacer a medias.

**Lo que la auditoría encontró y se corrigió** (`CORREGIDO_F14`, apartados 47 y 53):

| Qué | Antes | Ahora |
|---|---|---|
| Las barras de progreso | 420, 340, 420 y 280 ms | Las cuatro en `medium` (280) |
| Abrir y cerrar un desplegable | `normal` y la estándar en los dos sentidos (aunque `PRESETS_MOTION` decía otra cosa) | Abre en `medium`, cierra en `fast`, los dos con `smooth`; el respaldo de `Plegable` espera lo suyo |
| Los momentos | La estándar; el preset de subir de rango decía `momento` y el CSS duraba `medium` | `emphasized`, y el preset dice lo que hace el CSS |
| Lo que aparece en su sitio | Hojas, avisos, mensajes de error, vacíos y desplegables con la estándar | `entrance` (como ya hacían las capas de la F6), y los presets de hoja y de aviso también |
| El chevron | La estándar | `smooth`, la de su desplegable |

Y la regresión completa destapó tres fallos de fases anteriores, arreglados en su causa: **dos bloques hermanos de
Nutrición con la misma clave** (las cifras de hoy se quedaban puestas al cambiar de día, MS F10), **la pantalla que
volvía a entrar** al primer cambio después de abrirse desde su tarjeta (la decisión de la F7 se recalculaba en cada
pintado y ahora se toma una vez por navegación) y **el nombre de un ejercicio que salía de la copia que no se tocó**
(el toque se apunta desde el botón que lo envuelve, F7). Y el aviso de navegación de la F12 ya no habla al abrir la
aplicación con el doble montaje de `StrictMode`.

`auditarLenguaje({ css })` lee `index.css` y devuelve, con la clase y lo que esperaba, cada curva fuera de su papel,
cada línea del mapa que dice otra curva, cada duración fuera de su talla, cada preset que no coincide con su CSS,
cada pareja al revés, cada grupo de equivalentes a distinto ritmo y cada velocidad fuera de la banda. Hoy sale
limpia, y `scripts/test-motion-f14.mjs` la pone roja con un fallo inventado de cada tipo. La sección «MS F14» del
recorrido lee en Chromium la curva que le queda de verdad a cada clase, abre y cierra el Historial de Salud, y hace la
**pasada global** del apartado 48: recorre las tres áreas, cuatro módulos, Ajustes y el ＋ recogiendo cada animación
que se mueve, y ninguna puede usar una curva que no sea un token.

**Regla permanente (apartado 56):** toda animación nueva pertenece a este lenguaje. Su curva sale de su papel, su
duración de su talla y su velocidad cae en la banda; si es la mitad de una pareja, la vuelta no dura más que la ida;
si hace lo mismo que otra, va a su ritmo. **No se inventa un valor aislado**: si falta un token, se crea con nombre en
`motion.js` y en `index.css` a la vez. Lo que se miró y está bien está en `REVISADO_Y_BIEN_F14`; lo que no se hace
(parallax, tooltips, un muelle en cada cosa, tokens de más), en `NO_EN_F14`.

## 8.14 · Responsive, orientación, áreas seguras y teclado (F15)

> **La regla permanente (apartado 56):** *¿Esta diferencia existe porque cambia realmente la interacción o
> simplemente porque el viewport es diferente?* Si no hay una razón real, se reutiliza el mismo comportamiento.

**Lo que hay, medido** (`src/lib/responsiveMotion.js`). JosStyle es **una columna de 448 px** (`max-w-md`)
centrada en todos los tamaños, con la barra de cinco pestañas abajo **siempre**: no hay barra lateral ni una
navegación de escritorio que aparezca a partir de un ancho, así que no hay nada que transformar entre las dos
(apartados 28 y 29). Los cortes de verdad son cuatro (`BREAKPOINTS_REALES`) y **solo uno es de movimiento**
(`MOTION_BREAKPOINTS`):

| Corte | Qué cambia | ¿Movimiento? |
|---|---|---|
| `min-[360px]` | El nombre corto de una pestaña de Fitness | No |
| `sm` · 640 px | **La hoja que sube del borde pasa a ventana centrada** | **Sí**: cambia la interacción (el pulgar frente al puntero), y lo decide solo `tipoDeCapa` (F6) del estilo calculado |
| `md` · 768 px | Columnas de las rejillas de Fitness | No: se recolocan al momento (`cambioDeDiseno`, F10) |
| `xl` · 1280 px | Columnas de la biblioteca de ejercicios | No |

**Cada contexto, y lo que cambia** (`LENGUAJE_POR_CONTEXTO`, `ENTRADAS_MOTION`). En el **móvil**: respuesta
inmediata, hojas que suben de su borde y se arrastran, pulsar que encoge y los bordes de la pantalla para el
sistema. En el **escritorio**: las hojas son ventanas, el hover solo existe con un puntero de verdad
(`hoverOnlyWhenSupported`, F2) y el foco se ve con `:focus-visible`. **La tablet** no es «un móvil gigante» ni «un
escritorio pequeño»: es la misma columna con el corte `sm` y la entrada que tenga. **Las duraciones son las
mismas en todos los tamaños** (apartado 26): lo que cambia la duración es la velocidad de Ajustes.

**Las áreas seguras de los lados y de abajo** (apartados 9-12, 17 y 18). Arriba y abajo ya estaban (E3 F1); lo
que faltaba eran **los lados** —con el iPhone en horizontal la isla pasa a un lado y vale ~47 px— y **el pie de
las tarjetas que flotan**. Las clases, en `index.css`:

| Clase | Qué hace | Dónde |
|---|---|---|
| `accion-izquierda` / `accion-derecha` | `left`/`right` = área segura de su lado + 14 px | La lupa y el botón de sugerencias (estaban a 14 px escritos: debajo de la isla) |
| `visor-seguro` | Deja los dos lados | `HOJA.visor` (la foto y el comparador de Fitness) y el escáner de códigos |
| `velo-pie-seguro` | Deja la barra de inicio + 12 px; desde `sm`, nada | `HOJA.veloConfirmacion` y las tres fichas del Armario (sus botones caían donde deslizar es «ir al inicio») |
| `caja-cabe` | Cabe entre las dos áreas seguras (`dvh`, con `vh` de respaldo) | Las fichas del Armario (su `86vh` en un `style` sacaba la cabecera por arriba) |
| `velo-arriba` | El margen de siempre, o el área segura + 1 rem si es mayor (`--velo-arriba`) | El buscador y el día del Calendario |
| `flotante-cabe` | Un panel que cuelga de un botón cabe en lo que se ve y desplaza dentro | El panel de sugerencias |

Y el **escáner de códigos** empieza ya debajo de la isla, con su cerrar a 44 px (estaba a 16 px del borde, debajo
de la batería). Una hoja nueva que sube del borde deja `--safe-bottom` (`HOJA.abajo`, o `velo-pie-seguro` si
flota), y algo `fixed` en un lado lleva su clase: **`auditarResponsive`** caza un `left`/`right` con número en
algo fijo, una hoja pegada a la barra de inicio, una caja de más del 60 % del alto en `vh` escrita en un `style`,
un corte de Tailwind que no está en la lista, `devicePixelRatio` y una clase de área segura sin su regla. Con el
código de antes de la fase sale roja en los cuatro sitios que se arreglaron.

**Girar y redimensionar** (apartados 19, 20, 34, 42 y 52). Una sola pieza escucha la ventana para toda la
aplicación: **`useContextoFisico`** (`src/components/responsiveMotion.js`, montado en `App.jsx` antes de cualquier
`return`), con cinco escuchadores pasivos, un fotograma de por medio y **ni un estado de React**. Cuando cambia el
**ancho** (`cambioDeDiseno`):

- **`asentarMovimiento`** (orquestador) lleva a su final —el del DOM— lo que viaja con medidas de antes: las capas,
  la continuidad, el FLIP de las listas y el motor (`SISTEMAS_QUE_SE_ASIENTAN`). Un color, una cifra, un toque o
  el dedo siguen a lo suyo. **No se recalcula nada ni se anima el cambio**: el diseño nuevo aparece quieto.
- **`reevaluarCapas`** (`capasMotion.js`) vuelve a leer el tipo de cada capa abierta: la hoja que al girar pasa a
  ventana **sale como ventana**, no bajándose como la hoja que ya no es.

Un cambio solo de **alto** —la barra de Safari que aparece al desplazar— no asienta nada: pasa a cada rato. Y
girar con el dedo apoyado lo resuelve iOS, que cancela el toque (`gestoAbandonado`, F8).

**El teclado del iPhone** (apartados 13-16). Safari no encoge la página al abrir el teclado: encoge lo que **se
ve**. Con un campo de escribir enfocado y lo que se ve más de 150 px por debajo de la página, sin pellizco
(`tecladoAbierto`), la raíz lleva **`data-teclado="abierto"`** y la barra de abajo se aparta con `visibility`: al
momento, sin animación, sin mover un píxel. Así no flota sobre lo que se escribe. **No se recolocan las hojas con
JavaScript**: Safari ya desplaza hasta el campo, y moverlo otra vez sería el «segundo scroll» del apartado 16. El
zoom al enfocar un campo de 14 px es la **C-32**, de Josué.

**Los gestos y los bordes** (apartados 47 y 48). Un dedo o un lápiz que se apoya a menos de
**`UMBRALES_GESTO.bordeSistema`** (20 px) de un lado deja el gesto al sistema («atrás» en Safari):
`empiezaEnBordeDelSistema`, mirado por `useDeslizarParaCambiar` antes de tomar el control. Un ratón, nunca. El
umbral de cambiar de ejercicio (56 px) se queda fijo: la tarjeta nunca pasa de 448 px (apartado 25).

**Lo que no cambia, y por qué** (`DECISIONES_F15`): las distancias (la columna está acotada), las duraciones, la
cascada (ya tiene tope), la profundidad y el desenfoque (el velo no desenfoca; el único animado es el de «Ultra»),
las sombras (los cinco tokens de la F6), los elementos compartidos (miden el rectángulo de verdad en cada ancho),
la densidad de píxeles (todo en píxeles CSS) y la frecuencia de refresco (CSS, la Web Animations API y
`requestAnimationFrame`; ni un `setInterval`).

**La matriz** (`CONTEXTOS_FISICOS`, apartado 49) **amplía** los siete tamaños de Fitness (`DISPOSITIVOS_DE_PRUEBA`,
FIT F38) con el iPad en horizontal, un escritorio pequeño, uno grande y el zoom al 200 % (640 × 450), cada uno con
su entrada y la forma que tiene ahí una hoja. La sección «MS F15» del recorrido la abre entera, más «Reducir
movimiento» en el móvil, la tablet y el escritorio, girar a mitad de una entrada (con su testigo sin girar),
redimensionar a golpes y el teclado.

## 8.15 · Estados del sistema: carga, error, sin conexión y guardado (F16)

> **La regla permanente (apartado 60):** toda nueva operación asíncrona de JosStyle define sus estados —`idle`,
> `loading`, `success`, `error` y, cuando corresponda, `saving`, `pending` (sin guardar), `offline`, `retrying` y
> `cancelled`— y entra en `MAPA_ASINCRONO` con su dueño. El movimiento es parte del flujo de estado, no una capa
> añadida después.

**JosStyle ya era optimista sin saberlo.** Cada cambio es `setX(nuevo)` + `saveData(clave, nuevo)`: la pantalla
cambia primero y la cuenta después (apartado 14). Lo que faltaba no era la UI optimista: era **saber si había
llegado**, decirlo cuando no y no pisar lo que no se ha cargado. Eso lo lleva **`src/lib/sincronizacion.js`**, una
hoja del árbol de imports que llama `supabase.js`, para toda la aplicación:

- 🚨 **Una clave que no se pudo CARGAR no se GUARDA** (apartado 20). `loadData` seguía devolviendo el valor por
  defecto si fallaba, y la aplicación arrancaba como una cuenta nueva: el siguiente guardado de esa clave **pisaba
  lo que había en la cuenta**. Y el primero llegaba solo: la migración de `ajustes` del arranque guardaba los de por
  defecto —acento, apariencia y **el PIN**— si esa carga fallaba. Ahora la clave queda apuntada, `saveData` devuelve
  `{ ok: false, bloqueado: true }` sin tocar la red, y el indicador lo dice con «Volver a cargar». Si no se carga
  **nada**, no se enseña una cuenta vacía: `ErrorDeArranque` («No se han podido cargar tus datos», que no se ha
  borrado nada, y «Reintentar», también al volver la conexión).
- **Lo que no llega queda PENDIENTE con su último valor** (apartados 26 y 33) y se vuelve a mandar con «Guardar
  ahora» o solo al volver la conexión (`reintentarGuardados`). Mandar otra vez el valor ENTERO de una clave es
  idempotente (`saveData` sobrescribe), así que reintentar no duplica nada — al revés que repetir una acción, que
  es lo que la EH F41 prohibió (**C-66**). **No se deshace en pantalla** (apartado 16): perder lo escrito por un
  fallo de red sería peor; la vuelta atrás visible es «Deshacer», que ya existe.
- **Los guardados de una clave salen EN ORDEN** (apartado 41): uno espera a que termine el anterior (con tope de
  10 s), y una respuesta vieja que llega después de otra más nueva no reescribe lo pendiente.
- **Una sesión vieja no toca la nueva**: lo pendiente lleva el usuario y la generación de su sesión, se vacía al
  salir y **nunca se escribe en el dispositivo** (lleva datos de Relación, del diario o de la piel). Por eso el
  aviso dice que si se cierra la app antes, se pierde.

**El indicador de arriba** (`IndicadorDeSincronizacion`, `src/components/estadosAsincronos.jsx`). Uno para toda la
aplicación, a la altura de la lupa y con las áreas seguras (`.indicador-estado`), y **vacío casi siempre** (apartado
28: no una consola de servidor). La decisión es `estadoDeSincronizacion` (sin memoria, por importancia) y
`siguienteIndicador` (con memoria):

| Estado | Cuándo | Qué dice |
|---|---|---|
| `sin_cargar` | Una carga falló | «No se ha podido cargar Ajustes» · **Volver a cargar** (alerta) |
| `pendiente` | Algo no llegó | «2 cambios sin guardar» · **Guardar ahora** |
| `pendiente_sin_conexion` | Sin red y algo esperando | «Sin conexión · 1 cambio esperando» (se manda solo al volver) |
| `sin_conexion` | Sin red **más de 1,2 s** | «Sin conexión» (una caída corta no se dice) |
| `guardando` | Un guardado **pasa de 1,2 s**, o reintentando | «Guardando…» con su giro y su texto |
| `guardado` | Después de haber dicho algo | «Guardado», 1,8 s |

Lo que aparece se queda **al menos 900 ms** (apartado 12: sin destellos) y «Guardando…» pasa por «Guardado» antes
de irse (apartado 27). Entra y sale como un aviso (`toastEnter` / `toastExit` por `Presencia`) y cambia de frase en
su sitio (`CambioDeContenido`). ♿ Lo que dice se anuncia desde **dos regiones vivas siempre montadas** (`status` y,
para lo que no se cargó, `alert`): una región que nace con su texto no se lee. Sus botones **no** se llaman
«Reintentar»: el aviso de Fitness (FIT F37) ya tiene uno, y Fitness sigue diciendo SU fallo en su pantalla.

**El arranque** (apartados 4, 5 y 9). El esqueleto tiene la forma de Hoy (E3 F14) y Hoy entra con la transición de
sección (F2): del esqueleto al contenido, en su sitio. Lo nuevo es que **no late para siempre**: a los 8 s dice
«Está tardando más de lo normal…» y se queda quieto (`esqueleto-quieto`), y a los 20 s ofrece volver a intentarlo
(`estadoDeEspera`, `useEspera`).

**La sesión** (apartados 44 y 45). Supabase dice lo mismo al salir y al caducar; `signOut` apunta que se pidió
(`marcarSalidaPedida`), y sin esa marca la pantalla de entrar dice **«Tu sesión ha caducado»**, que lo guardado sigue
en la cuenta y cuántos cambios no llegaron (`motivoDeSalida`, `TEXTOS_SALIDA`). Mientras se comprueba la sesión,
esqueleto: nunca entrar → app → entrar.

**Las carreras y lo que se cancela** (apartados 40, 41, 49 y 50). **`crearTurnos()` / `useTurnos()`**: cada petición
saca un turno y solo pinta si sigue siendo el suyo; cancelar o desmontar los deja sin vigencia. Lo usan la búsqueda
de productos con marca de Nutrición (🐛 los resultados de una búsqueda vieja salían bajo el texto nuevo; ahora dicen
de cuál son: *«Productos con marca para «avena»»*, apartado 42) y la lectura de un código de barras. Y toda bandera
de espera alrededor de un `await` vuelve a reposo en un **`finally`**: 🐛 la entrada del PIN se quedaba «verificando»
para siempre si `crypto.subtle` lanzaba.

**Vacío ↔ contenido** (apartados 21-23). Un vacío que se monta con su pantalla entra con ella (`vacio-entra`); uno que
llega **después** del contenido —se ha borrado lo último— espera a que la fila salga (`vacio-tras-salida`, un
retraso de `fast`). Lo decide `useVacioQueLlega` antes de pintar, mirando si lo que lo contiene sigue entrando.
`EmptyHint` lo lleva, y `VacioQueLlega` envuelve un vacío hecho a mano. La lista **se queda montada aunque se
vacíe** —el Constructor y la agenda de un día la desmontaban—, así que lo último sale con su copia (F10) y lo
primero que se crea entra en el sitio del vacío.

**Los permisos** (apartado 46). La cámara: comprobando («Abriendo la cámara…»), denegado («no has dado permiso») y
no disponible, cada uno con su frase (`estadoDePermiso`).

**El mapa y la auditoría** (`MAPA_ASINCRONO`, `auditarAsincronia`). Once operaciones —el arranque, la sesión,
guardar, la conexión, las subidas, la IA, Open Food Facts, el código de barras, el PIN, las fuentes y los sonidos—
con su patrón, sus estados, su dueño, lo que había y lo que queda. La auditoría caza una bandera de espera sin
`finally`, un giro sin su texto fuera de las piezas que lo llevan (`GIROS_PERMITIDOS`) y una pantalla que llama a la
red sin estar en el mapa.

**Lo que no se hace, y por qué** (`NO_EN_F16`): datos en tiempo real y conflictos entre dispositivos (no hay
Realtime; el último en escribir gana, declarado desde la EH F41), refrescar y «tirar para actualizar» (no existen),
una barra de progreso de las subidas (`supabase-js` no informa del avance: sería fingido) y deshacer en pantalla lo
que no llegó (se queda pendiente).

## 8.16 · Datos que cambian: cifras, barras, gráficas y paneles (F17)

> **La regla permanente (apartado 63):** toda nueva visualización de datos responde
> *¿Qué aporta este movimiento a la comprensión del dato?* Si la respuesta es «nada», no se anima.

**No hay un segundo motor** (apartado 2). La F4 dejó `planDeCifra`, `CifraQueCambia` y las gráficas gobernadas
(`useAnimacionDeGrafica`) en las cifras principales; la F17 **mejora** ese motor (`src/lib/datosMotion.js`) y lo
**lleva** al resto.

**Qué clase de cifra es** (`CLASES_DE_CIFRA`, apartado 4). Cada cifra es de una clase, y la clase decide:

| Clase | Cómo se mueve | Ejemplos |
|---|---|---|
| `principal` | **Cuenta** (`modo="cuenta"`), con duración según cuánto cambia | La puntuación, el saldo, el porcentaje de Hoy |
| `con_barra` | Cuenta **al ritmo de su barra** (`duracion="medium"`) | Las calorías y los macros con su barra |
| `secundaria` | **Relevo**: el valor nuevo entra desde abajo si sube y desde arriba si baja | «2/3 hechos», los días de una racha, el texto de una meta |
| `estatica`, `reloj`, `identificador` | **Nada** | Un total del catálogo, el reloj de un entrenamiento, una versión |

**La cuenta, mejorada:**

- **Dura según cuánto cambia** (`tallaDeCuenta`, apartado 5): relativo a la cifra (12 de 88 no es 12 de 1850),
  entre `fast` y `slow`. 1 → 100 000 no es interminable.
- **Interrumpida, sigue desde lo que se ve** (apartado 6). 🐛 Antes, si el valor cambiaba a mitad, la cuenta nueva
  salía del objetivo de antes: la cifra **saltaba** y después contaba.
- **Los relevos seguidos se agrupan** (apartado 7): uno que llega mientras el anterior aún se ve escribe el valor sin
  repetir el fundido.
- **El lector de pantalla oye el valor final** (apartado 9): mientras cuenta, lo que se ve va con `aria-hidden` y el
  final está al lado (`sr-only`).
- El formato final es **exactamente** lo de siempre (apartado 8): la unidad, los decimales y la moneda los pone quien
  la usa.

**Ya está en** (hallazgo `cifras_de_golpe` de la F0, resuelto): la racha de cada tarjeta y la principal, el
porcentaje de cada indicador de Nutrición, «2 / 3 completado» de Productividad y el texto de cada meta y objetivo
—todos junto a una barra que sí se movía—, además de las cuatro de la F4.

**Las barras** (apartados 10 y 11). Seis escribían `transicion('width', 'slow')` en su `style` y las de CSS iban a
`medium` (F14): la misma cosa a dos ritmos. Ahora todas llevan **`barra-progreso`** (o `fit-barra`, `nu-progreso`),
y la cifra que acompaña a una barra cuenta a su ritmo. Se quedan con `width` y no `transform: scaleX`: una barra
redondeada se deforma al escalar, son pocas y la F13 midió su coste.

**Las gráficas** (apartados 22-37). Las tres de Recharts siguen gobernadas por la F4 (420 ms, sin `key`, interpolan,
en Reducido no dibujan). Lo nuevo es **un eje que no baila** (`dominioEstable`, apartados 31 y 32): Recharts
interpola la línea pero el eje salta, así que con el dominio calculado en cada pintado mover la semana de Sueño
cambiaba la escala. Ahora es redondo y con un mínimo —Sueño 0-10 h, el peso de 2 en 2 kg alrededor de sus valores,
las calorías con el objetivo dentro—. **No se inventan datos** (apartado 30): los huecos siguen siendo huecos.

**Rankings y listas filtradas** (apartados 41-43). Los ejercicios que contribuyen a un músculo, que se filtran por
tendencia, son una **`ListaAnimada`**: lo que el filtro quita sale con su copia, lo que queda se recoloca, cada uno
con su `exerciseId`, y la lista se queda montada aunque el filtro la vacíe (F16).

**El presupuesto** (`PRESUPUESTO_DATOS`, apartados 45-47 y 58): en una actualización se mueve la cifra que cambió, su
barra o su aro, la lista si cambia de orden, **y nada más**. Como mucho cuatro cuentas a la vez y dos `modo="cuenta"`
por archivo.

**El mapa y la auditoría** (`MAPA_DATOS`, `auditarDatos`). Cada sitio donde se pinta un dato que cambia, con su clase,
y la prueba busca en su archivo el trozo que lo cumple. La auditoría caza una barra con su ritmo escrito en el
`style`, una `CifraQueCambia` sobre un reloj, una gráfica con `key` (se rehace entera en vez de interpolar) y más de
dos cuentas en un archivo.

**Lo que no se hace, y por qué** (`NO_EN_F17`): gráficas de barras y donuts (no hay), una animación por punto al pasar
de 7 a 30 días (sería decorar), un cursor propio sobre la gráfica (el tooltip de Recharts ya responde al toque) y
datos en vivo (solo los relojes cambian solos, y no se animan).

## 9 · La arquitectura

- **Sin librería de animación.** Ni framer-motion ni ninguna otra: el movimiento ya vivía en
  `index.css`, una librería sería un segundo sistema al lado, y el archivo de la aplicación ya pesa
  4,4 MB (C-42). `package.json` lo vigila.
- **Lo que puede ser CSS, sigue siendo CSS**: entradas, pulsar, barras, cascadas. Así respeta los modos y
  el movimiento reducido sin una línea de JavaScript.
- **El motor (`src/lib/motion.js`) solo importa el orquestador**, que no importa nada (F11), y no guarda
  nada: lo puede leer cualquier capa sin un ciclo, y se prueba en Node con elementos de mentira y en
  Chromium con los de verdad. **Toda animación por JavaScript pasa por `animarOrquestado`.**
- **Las piezas de React (`src/components/motion.jsx`)** solo hacen lo que necesita React: `useMotion`,
  `Presencia`, `useFlip`, `CambioDeContenido`, `ChevronDespliegue`, `LatidoAlMarcar`, `CifraQueCambia` y
  `useAnimacionDeGrafica`. La navegación tiene su par: la decisión en
  `src/lib/transicionNavegacion.js` (se prueba en Node) y lo que pasa en la página en
  `src/components/navegacionMotion.js`.
- **Los gestos (F5)** tienen el mismo reparto: los números en `src/lib/umbralesGesto.js` (no importa nada,
  así que también lo lee Fitness), las decisiones en `src/lib/gestosMotion.js` (Node) y lo que toca el DOM
  —seguir al dedo con `transform` y soltar con la Web Animations API— en `src/components/gestosMotion.jsx`.
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
- La sección «MS F15» del recorrido mide las áreas seguras de los lados y del pie con las variables que pondría un
  iPhone, los once contextos de `CONTEXTOS_FISICOS`, «Reducir movimiento» en tres tamaños, girar a mitad de la
  entrada de una capa (lo que viaja se asienta y la capa sale con su forma nueva), redimensionar a golpes, el
  teclado (`data-teclado`) y el panel de sugerencias al 200 %. `auditarResponsive` (F15) lee las vistas.
- La sección «MS F16» del recorrido mide los estados del sistema con el doble de Supabase: nada arriba con todo
  bien, tres guardados de una clave que llegan en orden aunque el primero tarde, un guardado que falla («1 cambio
  sin guardar · Guardar ahora» → «Guardado»), sin conexión (y al volver se manda solo), una carga que falla sin que
  el arranque pise los ajustes, ninguna carga («No se han podido cargar tus datos»), el arranque lento, el vacío
  que espera a que salga lo último y la sesión que caduca. `auditarAsincronia` (F16) lee las vistas.
- La sección «MS F17» del recorrido mide los datos fotograma a fotograma: una cuenta interrumpida que sigue desde lo
  que se ve sin volver atrás, el valor final para VoiceOver mientras cuenta, las barras de Productividad al ritmo de
  todas y el eje de Sueño que no cambia al mover la semana. `auditarDatos` (F17) lee las vistas.
