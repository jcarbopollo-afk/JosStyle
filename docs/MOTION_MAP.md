# MOTION_MAP — el movimiento de JosStyle, elemento a elemento

> **Motion System · desde la Fase 0.** Cada elemento que se mueve —o que debería moverse— con lo que pide el
> apartado 3 de la F0. 🚨 **Este documento se genera desde `src/lib/motionMapa.js`** con
> `node --import ./scripts/resolver-vite.mjs scripts/generar-motion-map.mjs`. No lo edites a mano: edita
> el mapa y vuelve a generarlo. `scripts/test-motion-f0.mjs` lo compara y se pone rojo si no coincide.

**84 elementos**: ✅ Existe 80 · ⚠️ Inconsistente 2 · ⬜ Sin movimiento 2 · 🚨 Fuera de control 0.

## Resumen

| Elemento | Cat. | Nivel | Duración | Estado | Fase |
|---|---|---|---|---|---|
| Pestaña activa de la barra de abajo | A | 1 · Micro | 220 ms | ✅ Existe | F2 |
| Indicador de la pestaña activa | A | 2 · Suave | 280 ms | ✅ Existe | F2 |
| Barra de «Volver» | A | 2 · Suave | 220 ms | ✅ Existe | F2 |
| Entrar en un módulo | B | 2 · Suave | 340 ms | ✅ Existe | F2 |
| Volver a una pantalla | B | 2 · Suave | 220 ms | ✅ Existe | F2 |
| Cambiar de sección con la barra de abajo | B | 2 · Suave | 220 ms | ✅ Existe | F2 |
| Otra pestaña dentro de una pantalla | C | 1 · Micro | 160 ms | ✅ Existe | F2 |
| Portada de un área: la cascada de tarjetas | B | 3 · Protagonista | 420 ms | ✅ Existe | F10 |
| Cabecera de un área (ÁREA / Vida) | B | 2 · Suave | 280 ms | ✅ Existe | F2 |
| Tocar un módulo de la portada | D | 2 · Suave | 160 ms | ✅ Existe | F7 |
| La pantalla de un módulo crece desde su tarjeta | B | 3 · Protagonista | 340 ms | ✅ Existe | F7 |
| Al volver, la tarjeta de la que se salió se posa | D | 2 · Suave | 280 ms | ✅ Existe | F7 |
| El nombre de un ejercicio viaja de la biblioteca a su ficha | J | 3 · Protagonista | 280 ms | ✅ Existe | F7 |
| Pulsar un módulo de la portada (y las demás retroceden) | D | 1 · Micro | 160 ms | ✅ Existe | F3 |
| El icono de un módulo de la portada al pulsarlo | D | 1 · Micro | 160 ms | ✅ Existe | F3 |
| Una pantalla de Fitness aparece | B | 2 · Suave | 220 ms | ✅ Existe | F2 |
| Acordeones de Inicio (situación actual y puntuación) | C | 2 · Suave | 280 ms | ✅ Existe | F9 |
| Chevron que gira al desplegar | C | 1 · Micro | 220 ms | ✅ Existe | F3 |
| Lo que aparece al abrir un desplegable o un menú | C | 1 · Micro | 160 ms | ✅ Existe | F3 |
| El color de una pestaña al elegirla | C | 1 · Micro | 160 ms | ✅ Existe | F3 |
| Pulsar una tarjeta o un botón (la escalera de escalas) | D | 1 · Micro | 220 ms | ✅ Existe | F3 |
| Pulsar una papelera | E | 1 · Micro | 160 ms | ✅ Existe | F3 |
| Pulsar una tarjeta de Fitness | D | 1 · Micro | 160 ms | ✅ Existe | F3 |
| Pulsar algo destructivo en Fitness | E | 1 · Micro | 160 ms | ✅ Existe | F3 |
| Tarjeta destacada al llegar por un enlace (objetivo, tarea) | D | 2 · Suave | 280 ms | ✅ Existe | F7 |
| Tarjetas de una lista que entran en cascada (Biblioteca, Productividad, Nutrición, Salud) | J | 3 · Protagonista | 420 ms | ✅ Existe | F10 |
| Marcar un favorito | E | 1 · Micro | 220 ms | ✅ Existe | F3 |
| «Pensando…» y los botones que esperan | M | 1 · Micro | 1000 ms | ✅ Existe | F16 |
| Campos de texto al enfocar | F | 1 · Micro | 160 ms | ✅ Existe | F9 |
| Un error aparece debajo de su campo | P | 1 · Micro | 160 ms | ✅ Existe | F9 |
| Un botón que espera: «Guardar» → «Guardando…» → ✓ | E | 1 · Micro | 160 ms | ✅ Existe | F9 |
| El giro de un botón que tarda | M | 1 · Micro | 160 ms | ✅ Existe | F9 |
| Una hoja de Fitness entra (en el iPhone, desde su borde) | H | 2 · Suave | 220 ms | ✅ Existe | F6 |
| Una hoja sube desde su borde | H | 2 · Suave | 220 ms | ✅ Existe | F6 |
| El fondo de una hoja se oscurece | G | 2 · Suave | 220 ms | ✅ Existe | F6 |
| Ventanas del Calendario | G | 2 · Suave | 220 ms | ✅ Existe | F6 |
| Arrastrar una hoja por su asa | H | 2 · Suave | 220 ms | ✅ Existe | F5 |
| El velo de una hoja se aclara mientras se arrastra | H | 2 · Suave | 220 ms | ✅ Existe | F8 |
| Todas las capas: ventanas, hojas, pantallas por encima y visores (unas 40) | G | 2 · Suave | 220 ms | ✅ Existe | F6 |
| El aviso de «añadido» (y los de Fitness) | Q | 2 · Suave | 280 ms | ✅ Existe | F9 |
| Menús «⋯» y desplegables | I | 1 · Micro | 220 ms | ✅ Existe | F6 |
| Un panel que nace de su botón (las sugerencias) | I | 2 · Suave | 160 ms | ✅ Existe | F6 |
| Completar una tarea | J | 2 · Suave | 280 ms | ✅ Existe | F9 |
| Completar un hábito | J | 2 · Suave | 280 ms | ✅ Existe | F9 |
| Terminar una rutina | Q | 3 · Protagonista | 420 ms | ✅ Existe | F9 |
| Marcar una serie | J | 1 · Micro | 160 ms | ✅ Existe | F9 |
| Borrar, añadir, completar o filtrar en una lista | J | 2 · Suave | 220 ms | ✅ Existe | F10 |
| Lo que se abre y se cierra en su sitio (Plegable) | C | 2 · Suave | 220 ms | ✅ Existe | F10 |
| Gráficas de Recharts (Salud, Nutrición, Sueño) | K | 3 · Protagonista | 420 ms | ✅ Existe | F4 |
| Una cifra que sube | K | 1 · Micro | 220 ms | ✅ Existe | F4 |
| Una cifra que baja | K | 1 · Micro | 220 ms | ✅ Existe | F4 |
| Un estado vacío | K | 1 · Micro | 160 ms | ✅ Existe | F4 |
| Gráficas propias en SVG (Fitness, Sueño) | K | 0 · Estático | — | ⬜ Sin movimiento | F17 |
| Barras de progreso con su clase (Hoy, Biblioteca, Nutrición, Fitness) | L | 3 · Protagonista | 280 ms | ⚠️ Inconsistente | F17 |
| Barras de progreso escritas en la vista (Objetivos, Productividad, Rachas, Bienestar digital) | L | 3 · Protagonista | 340 ms | ⚠️ Inconsistente | F17 |
| El aro de progreso de `ui.jsx` | L | 3 · Protagonista | 420 ms | ✅ Existe | F17 |
| El aro del temporizador | L | 2 · Suave | 280 ms | ✅ Existe | F17 |
| Cifras que cambian (rachas, kcal, puntuación, saldo) | L | 0 · Estático | — | ⬜ Sin movimiento | F17 |
| El latido del esqueleto | N | 1 · Micro | 1400 ms | ✅ Existe | F16 |
| Estados vacíos: el que llega con su pantalla y el que llega después del contenido | O | 1 · Micro | 160 ms | ✅ Existe | F16 |
| Avisos de error (guardado, archivo, conexión) | P | 2 · Suave | 280 ms | ✅ Existe | F16 |
| El indicador de arriba: sin cargar, sin guardar, sin conexión, guardando, guardado | P | 2 · Suave | 280 ms | ✅ Existe | F16 |
| El entrenamiento guardado | Q | 2 · Suave | 280 ms | ✅ Existe | F9 |
| Terminar un libro | Q | 3 · Protagonista | 340 ms | ✅ Existe | F9 |
| Termina el descanso | Q | 2 · Suave | 280 ms | ✅ Existe | F9 |
| Subir de rango | Q | 4 · Momento | 280 ms | ✅ Existe | F17 |
| La llama de una racha que sube | Q | 4 · Momento | 620 ms | ✅ Existe | F17 |
| El «+1» de una racha | Q | 5 · Firma | 900 ms | ✅ Existe | F18 |
| El interruptor (la bola) | R | 1 · Micro | 220 ms | ✅ Existe | F3 |
| El interruptor (la pista), suelto o dentro de una fila | R | 1 · Micro | 220 ms | ✅ Existe | F3 |
| Deslizadores (`input type=range`) | S | 0 · Estático | — | ✅ Existe | F5 |
| Deslizar para cambiar de ejercicio | T | 2 · Suave | 220 ms | ✅ Existe | F5 |
| El ejercicio siguiente entra desde la derecha | T | 1 · Micro | 220 ms | ✅ Existe | F5 |
| El ejercicio anterior entra desde la izquierda | T | 1 · Micro | 220 ms | ✅ Existe | F5 |
| El divisor del comparador de fotos | T | 1 · Micro | — | ✅ Existe | F8 |
| El rebote de la página | U | 1 · Micro | — | ✅ Existe | F5 |
| Las tarjetas se desvanecen al pasar bajo la cabecera de un área | U | 1 · Micro | 0 ms | ✅ Existe | F10 |
| Reordenar (flechas en lugar de arrastrar) | V | 2 · Suave | 220 ms | ✅ Existe | F10 |
| Cambiar de mes en el Calendario | W | 2 · Suave | 220 ms | ✅ Existe | F10 |
| El progreso de un libro | W | 3 · Protagonista | 280 ms | ✅ Existe | F17 |
| El progreso de un macro | W | 3 · Protagonista | 280 ms | ✅ Existe | F17 |
| Una barra de progreso de Fitness | W | 3 · Protagonista | 280 ms | ✅ Existe | F17 |
| La muestra de «Ver cómo se mueve» en Ajustes | R | 3 · Protagonista | 420 ms | ✅ Existe | F1 |
| Todo lo que se añada a partir de hoy | X | 0 · Estático | — | ✅ Existe | F0 |

## Ficha de cada elemento

### A · Navegación

#### Pestaña activa de la barra de abajo

`pestanas_barra` · ✅ Existe · lo trata la **F2**

| Campo | Valor |
|---|---|
| Ubicación | src/App.jsx · src/index.css |
| Componente | nav.nav-segura |
| Clase CSS | `.nav-tab-icon` |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Decir en qué área estás. |
| Estado inicial | Gris |
| Estado final | Color de acento |
| Entrada | — |
| Salida | — |
| Interacción | Tocar una pestaña: el icono se encoge un poco mientras se pulsa (MS F2) |
| Transición | color, transform |
| Duración | 220 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | alta |
| Relación | Cambia a la vez que la pastilla viaja (nav-indicador) y entra la sección (nav-seccion). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | El color cambia igual; el icono no se encoge. |

#### Indicador de la pestaña activa

`indicador_barra` · ✅ Existe · lo trata la **F2**

| Campo | Valor |
|---|---|
| Ubicación | src/App.jsx · src/index.css |
| Componente | nav.nav-segura |
| Clase CSS | `.nav-indicador` |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Una sola pastilla que viaja hasta la pestaña nueva, en vez de apagarse en una y encenderse en otra (apartado 3). |
| Estado inicial | Bajo la pestaña de antes |
| Estado final | Bajo la pestaña nueva |
| Entrada | — |
| Salida | — |
| Interacción | Tocar una pestaña, o entrar en un módulo de otra área |
| Transición | transform `medium` con la curva `emphasized`; opacity `fast` |
| Duración | 280 ms |
| Curva | --motion-curva-emphasized |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | alta |
| Relación | Su sitio sale de `indiceDePestana` (transicionNavegacion.js), el mismo criterio que el color de la pestaña. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | No viaja: aparece en la pestaña nueva. |

#### Barra de «Volver»

`barra_volver` · ✅ Existe · lo trata la **F2**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | — |
| Clase CSS | `.back-bar` |
| @keyframes | `backBarIn` |
| En ANIMACIONES_HC | — |
| Función | Aparece al entrar en un módulo para salir de él. |
| Estado inicial | Opacidad 0, 8 px a la izquierda |
| Estado final | En su sitio |
| Entrada | Fundido + desplazamiento corto |
| Salida | — |
| Interacción | Pulsar: opacidad y fondo 160 ms |
| Transición | opacity, transform |
| Duración | 220 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | alta |
| Relación | Acompaña a module-enter. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

### B · Pantallas

#### Entrar en un módulo

`entrada_modulo` · ✅ Existe · lo trata la **F2**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css · src/App.jsx |
| Componente | — |
| Clase CSS | `.module-enter` |
| @keyframes | `moduleSlideIn` |
| En ANIMACIONES_HC | `entrada_pantalla` |
| Función | Que la pantalla nueva llegue desde la derecha en vez de aparecer: un nivel más hondo. |
| Estado inicial | Opacidad 0, desplazada a la derecha y al 0,98 |
| Estado final | En su sitio |
| Entrada | Desliza + fundido + escala |
| Salida | Ninguna: la anterior desaparece de golpe |
| Interacción | — |
| Transición | opacity, transform |
| Duración | 340 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | alta |
| Relación | 🔓 MS F2 — solo al ENTRAR (`tipoDeNavegacion`): volver y cambiar de sección tienen su propio movimiento. Y termina con `backwards`: no deja un transform puesto. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### Volver a una pantalla

`volver_pantalla` · ✅ Existe · lo trata la **F2**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css · src/App.jsx · src/components/navegacionMotion.js |
| Componente | — |
| Clase CSS | `.nav-vuelve` |
| @keyframes | `navVuelve` |
| En ANIMACIONES_HC | — |
| Función | Que volver se lea como volver, no como entrar otra vez (apartado 6). |
| Estado inicial | Medio visible, 8 px a la izquierda |
| Estado final | En su sitio, al scroll de antes |
| Entrada | Desde el lado del que salió, más corto y sin escala; lo ya visto no repite su entrada |
| Salida | — |
| Interacción | — |
| Transición | opacity, transform |
| Duración | 220 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | alta |
| Relación | Las entradas de `ENTRADAS_QUE_NO_SE_REPITEN` se terminan en el acto (Web Animations API). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### Cambiar de sección con la barra de abajo

`cambio_seccion` · ✅ Existe · lo trata la **F2**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css · src/App.jsx |
| Componente | — |
| Clase CSS | `.nav-seccion` |
| @keyframes | `navSeccion` |
| En ANIMACIONES_HC | — |
| Función | Las secciones son hermanas: un fundido con un leve ascenso, sin desplazamiento lateral (apartado 5). |
| Estado inicial | Medio visible, 8 px abajo |
| Estado final | En su sitio, arriba |
| Entrada | Fundido corto |
| Salida | — |
| Interacción | — |
| Transición | opacity, transform |
| Duración | 220 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | alta |
| Relación | Empieza medio visible para que no haya un instante vacío entre una sección y otra (apartado 28). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### Portada de un área: la cascada de tarjetas

`portada_area` · ✅ Existe · lo trata la **F10**

| Campo | Valor |
|---|---|
| Ubicación | src/views/HubView.jsx · src/index.css |
| Componente | HubView |
| Clase CSS | `.hub-card` |
| @keyframes | `hubCardIn` |
| En ANIMACIONES_HC | — |
| Función | Que los cinco módulos del área entren de arriba abajo. |
| Estado inicial | Opacidad 0, 14 px abajo, 0,97 |
| Estado final | En su sitio |
| Entrada | Cascada |
| Salida | — |
| Interacción | — |
| Transición | opacity, transform |
| Duración | 420 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | 60 ms entre elementos |
| Intensidad | 3 · Protagonista |
| Prioridad | alta |
| Relación | Después de la cabecera (hub-header). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### Cabecera de un área (ÁREA / Vida)

`cabecera_area` · ✅ Existe · lo trata la **F2**

| Campo | Valor |
|---|---|
| Ubicación | src/views/HubView.jsx · src/index.css |
| Componente | HubView |
| Clase CSS | `.hub-header` |
| @keyframes | `hubHeaderIn` |
| En ANIMACIONES_HC | — |
| Función | Primero el título y luego las tarjetas. |
| Estado inicial | Opacidad 0, 8 px arriba |
| Estado final | En su sitio |
| Entrada | Fundido corto |
| Salida | — |
| Interacción | — |
| Transición | opacity, transform |
| Duración | 280 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | Se queda fija al desplazar (SC F1) y sin fondo desde la v3.129.1. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### La pantalla de un módulo crece desde su tarjeta

`contenedor_desde_tarjeta` · ✅ Existe · lo trata la **F7**

| Campo | Valor |
|---|---|
| Ubicación | src/components/continuidad.jsx (useContenedorDesdeOrigen, en App.jsx) · src/lib/continuidad.js · HubView |
| Componente | useContenedorDesdeOrigen |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Que abrir un módulo desde la portada de su área se lea como ENTRAR EN LA TARJETA, no como una pantalla que llega de otro sitio (apartados 5, 20, 21 y 24). |
| Estado inicial | Recortada al rectángulo de la tarjeta, con sus esquinas, medio visible |
| Estado final | La pantalla entera, con las esquinas rectas |
| Entrada | El recorte se abre (`clip-path`) y lo de dentro se revela |
| Salida | — |
| Interacción | Tocar una tarjeta de la portada de un área |
| Transición | clip-path y opacity, por la Web Animations API |
| Duración | 340 ms |
| Curva | --motion-curva-emphasized |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 3 · Protagonista |
| Prioridad | alta |
| Relación | Sustituye a `module-enter` SOLO en ese caso: dos movimientos para la misma llegada serían uno de más. Desde Inicio (una tarjeta resumen) se sigue entrando desde la derecha. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Sin recorte: la entrada de siempre, que en Reducido es un fundido. |

#### Una pantalla de Fitness aparece

`pantalla_fitness` · ✅ Existe · lo trata la **F2**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | — |
| Clase CSS | `.fit-entra` |
| @keyframes | `fitEntra` |
| En ANIMACIONES_HC | `fit_entra` |
| Función | Cambiar de área dentro de Fitness. |
| Estado inicial | Opacidad 0, 6 px abajo |
| Estado final | En su sitio |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | opacity, transform |
| Duración | 220 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

### C · Secciones

#### Otra pestaña dentro de una pantalla

`cambio_contenido` · ✅ Existe · lo trata la **F2**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css · src/components/motion.jsx (CambioDeContenido) |
| Componente | — |
| Clase CSS | `.contenido-cambia` |
| @keyframes | `contenidoCambia` |
| En ANIMACIONES_HC | — |
| Función | Una transición de CONTENIDO, no de página (apartado 15): cambia lo de dentro, no el sitio. |
| Estado inicial | Medio visible |
| Estado final | Visible |
| Entrada | Fundido corto, sin moverse |
| Salida | — |
| Interacción | — |
| Transición | opacity |
| Duración | 160 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | La F10 añade lo que recoloca una lista (filtros, orden, periodo). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Igual: ya es solo un fundido. |

#### Acordeones de Inicio (situación actual y puntuación)

`acordeon_inicio` · ✅ Existe · lo trata la **F9**

| Campo | Valor |
|---|---|
| Ubicación | src/views/DashboardView.jsx |
| Componente | IndicadorContexto · TarjetaPuntuacion |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Abrir y cerrar el detalle sin medir la altura a mano. |
| Estado inicial | grid-template-rows 0fr |
| Estado final | 1fr |
| Entrada | — |
| Salida | — |
| Interacción | Tocar la cabecera |
| Transición | grid-template-rows `medium` + opacidad `medium`/`ultraFast` (MS F1: `transicion()`) |
| Duración | 280 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | Sin hueco en Safari desde la SC F1 (minHeight: 0). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### Chevron que gira al desplegar

`chevron` · ✅ Existe · lo trata la **F3**

| Campo | Valor |
|---|---|
| Ubicación | src/components/motion.jsx (ChevronDespliegue) · src/index.css |
| Componente | ChevronDespliegue |
| Clase CSS | `.chevron-gira` |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Decir si una sección está abierta. |
| Estado inicial | Hacia abajo (o a la derecha) |
| Estado final | Hacia arriba (o abajo) |
| Entrada | — |
| Salida | — |
| Interacción | Tocar |
| Transición | transform `normal` con la curva de JosStyle |
| Duración | 220 ms |
| Curva | --motion-curva-smooth |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | MS F3: los veintitrés desplegables usan el mismo icono que gira; veinte cambiaban un icono por otro de golpe. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Llega a su sitio sin girar. |

#### Lo que aparece al abrir un desplegable o un menú

`despliegue` · ✅ Existe · lo trata la **F3**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css · los desplegables con ChevronDespliegue y el ⋯ de las plantillas |
| Componente | — |
| Clase CSS | `.despliegue-entra` |
| @keyframes | `despliegueEntra` |
| En ANIMACIONES_HC | — |
| Función | Que el contenido aparezca desde el borde que lo abrió, no plantado (apartado 14). |
| Estado inicial | Invisible, 4 px más arriba |
| Estado final | En su sitio |
| Entrada | Fundido corto y un leve descenso |
| Salida | — |
| Interacción | — |
| Transición | opacity, transform |
| Duración | 160 ms |
| Curva | --motion-curva-entrance |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | Cerrar recolocando el resto es la F10 (C-54). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Solo el fundido. |

#### El color de una pestaña al elegirla

`pestana_elegida` · ✅ Existe · lo trata la **F3**

| Campo | Valor |
|---|---|
| Ubicación | src/components/ui.jsx (ToggleTab) · src/index.css |
| Componente | ToggleTab |
| Clase CSS | `.pestana-cambia` |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Que la pestaña y su contenido cambien como una sola acción (apartado 24). |
| Estado inicial | Gris |
| Estado final | Acento |
| Entrada | — |
| Salida | — |
| Interacción | Tocar una pestaña |
| Transición | background-color, color, border-color |
| Duración | 160 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | Al mismo ritmo que `contenido-cambia` (F2). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Igual: ya es solo color. |

#### Lo que se abre y se cierra en su sitio (Plegable)

`plegable` · ✅ Existe · lo trata la **F10**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css · src/components/layoutMotion.jsx (Plegable) · los veinte desplegables con ChevronDespliegue |
| Componente | Plegable |
| Clase CSS | `.plegable` |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Que lo de debajo se mueva con la altura en vez de saltar al cerrar (C-54, apartados 17, 18 y 28). |
| Estado inicial | grid-template-rows 0fr |
| Estado final | 1fr |
| Entrada | Crece mientras lo de dentro entra con `despliegue-entra` |
| Salida | Se encoge y después se desmonta |
| Interacción | — |
| Transición | grid-template-rows |
| Duración | 220 ms |
| Curva | --motion-curva-smooth |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | La técnica de los acordeones de Inicio (SC F1), con `min-height: 0` para Safari. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Cambia de altura sin animarse. |

### D · Tarjetas

#### Tocar un módulo de la portada

`expandir_tarjeta_area` · ✅ Existe · lo trata la **F7**

| Campo | Valor |
|---|---|
| Ubicación | src/views/HubView.jsx · src/index.css |
| Componente | — |
| Clase CSS | `.hub-card-expanding` |
| @keyframes | `hubCardExpand` |
| En ANIMACIONES_HC | — |
| Función | La tarjeta crece un poco y se abre su módulo. |
| Estado inicial | 0,97 |
| Estado final | 1,03 con brillo y sombra |
| Entrada | — |
| Salida | — |
| Interacción | Tocar |
| Transición | transform, filter (la sombra máxima, un pseudo-elemento que se funde: MS F13) |
| Duración | 160 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | alta |
| Relación | La navegación espera el mismo token (`duracionMs('fast')`, MS F1), no un número escrito aparte. 🔓 MS F7: justo antes de navegar, la tarjeta YA crecida apunta su rectángulo, y la pantalla del módulo nace de él (`contenedor_desde_tarjeta`). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### Al volver, la tarjeta de la que se salió se posa

`llegada_tarjeta` · ✅ Existe · lo trata la **F7**

| Campo | Valor |
|---|---|
| Ubicación | src/views/HubView.jsx · src/components/continuidad.jsx (animarLlegada) |
| Componente | HubView |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Reconstruir la relación inversa: el ojo encuentra de dónde salió (apartado 6). |
| Estado inicial | Un poco más grande (1,02) y más clara |
| Estado final | En su sitio |
| Entrada | Se posa |
| Salida | — |
| Interacción | Volver de un módulo a la portada de su área |
| Transición | transform y filter, por la Web Animations API |
| Duración | 280 ms |
| Curva | --motion-curva-entrance |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | La portada ya vuelve sin repetir su cascada (F2); esto es lo único que se mueve en ella. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde desde medio visible, sin escala. |

#### Pulsar un módulo de la portada (y las demás retroceden)

`pulsar_tarjeta_area` · ✅ Existe · lo trata la **F3**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css · src/views/HubView.jsx |
| Componente | HubView |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Respuesta al dedo antes de abrir el módulo. |
| Estado inicial | 1 |
| Estado final | 0,97, más clara y con sombra; las demás al 0,98 y medio transparentes |
| Entrada | — |
| Salida | — |
| Interacción | Mantener pulsado |
| Transición | transform, filter, opacity |
| Duración | 160 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | alta |
| Relación | 🔓 MS F13 — la sombra que se levanta ya no anima `box-shadow` (24 pintados en 300 ms medidos en Chromium): es un pseudo-elemento que se funde. El brillo (`filter`) se queda, declarado en `COSTES_DECLARADOS`. 🐛 Hasta la MS F3 la entrada (`hubCardIn`) terminaba con `both` y su último fotograma ganaba a `:active` y a `.hub-card-receding`: ni encogía ni las demás retrocedían. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### El icono de un módulo de la portada al pulsarlo

`icono_tarjeta_area` · ✅ Existe · lo trata la **F3**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | — |
| Clase CSS | `.hub-card-icon` |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Un pellizco de escala extra sobre el de la tarjeta. |
| Estado inicial | 1 |
| Estado final | 1,08 |
| Entrada | — |
| Salida | — |
| Interacción | Mantener pulsado |
| Transición | transform |
| Duración | 160 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | Va con «Pulsar un módulo de la portada». |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### Pulsar una tarjeta o un botón (la escalera de escalas)

`pulsar_tarjeta` · ✅ Existe · lo trata la **F3**

| Campo | Valor |
|---|---|
| Ubicación | src/components/ui.jsx · src/index.css (`[class*=active:scale]`) |
| Componente | Card, PrimaryBtn, GhostBtn, chips… |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Respuesta inmediata al dedo. |
| Estado inicial | 1 |
| Estado final | 0,90–0,99 según el tamaño |
| Entrada | — |
| Salida | — |
| Interacción | Mantener pulsado |
| Transición | transform: al pulsar `ultrafast` con la curva de JosStyle; al soltar `normal` con la curva `entrance`, que llega y se posa sin rebotar (MS F3) |
| Duración | 220 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | alta |
| Relación | MS F3: 57 de los 138 no tenían transición y saltaban. Fitness usa su propio escalón (fit-pulsable). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | No encoge: baja la opacidad al 0,72. |

#### Pulsar una tarjeta de Fitness

`pulsar_fitness` · ✅ Existe · lo trata la **F3**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | — |
| Clase CSS | `.fit-pulsable` |
| @keyframes | — |
| En ANIMACIONES_HC | `fit_pulsar` |
| Función | El escalón 0,98 de la escalera. |
| Estado inicial | 1 |
| Estado final | 0,98 |
| Entrada | — |
| Salida | — |
| Interacción | Pulsar |
| Transición | transform |
| Duración | 160 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### Tarjeta destacada al llegar por un enlace (objetivo, tarea)

`tarjeta_destacada` · ✅ Existe · lo trata la **F7**

| Campo | Valor |
|---|---|
| Ubicación | ObjectivesView · ProductivityView |
| Componente | — |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Señalar a qué tarjeta te ha llevado un enlace. |
| Estado inicial | Sin borde |
| Estado final | Anillo del acento |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | box-shadow `medium` (MS F1: `transicion()`) |
| Duración | 280 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

### E · Botones

#### Pulsar una papelera

`pulsar_borrar` · ✅ Existe · lo trata la **F3**

| Campo | Valor |
|---|---|
| Ubicación | src/components/ui.jsx (BotonBorrar, BotonBorrarDefinitivo) · src/index.css |
| Componente | BotonBorrar |
| Clase CSS | `.toque-destructivo` |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Lo destructivo responde sin encoger (apartado 28). |
| Estado inicial | Opacidad 1 |
| Estado final | 0,72 |
| Entrada | — |
| Salida | — |
| Interacción | Pulsar |
| Transición | opacity |
| Duración | 160 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | La misma regla que `fit-contenido` (FIT F37), para toda la aplicación. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Igual: ya es solo opacidad. |

#### Pulsar algo destructivo en Fitness

`pulsar_destructivo` · ✅ Existe · lo trata la **F3**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | — |
| Clase CSS | `.fit-contenido` |
| @keyframes | — |
| En ANIMACIONES_HC | `fit_contenido` |
| Función | Lo destructivo no escala: baja la opacidad. |
| Estado inicial | Opacidad 1 |
| Estado final | 0,72 |
| Entrada | — |
| Salida | — |
| Interacción | Pulsar |
| Transición | opacity |
| Duración | 160 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### Marcar un favorito

`favorito` · ✅ Existe · lo trata la **F3**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | LatidoAlMarcar |
| Clase CSS | `.favorito-guardado` |
| @keyframes | `favoritoPulso` |
| En ANIMACIONES_HC | — |
| Función | La marca late una vez al ponerla (nunca al quitarla ni al abrir la pantalla). |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | Marcar como favorito |
| Transición | transform |
| Duración | 220 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | MS F3: en las trece marcas de la aplicación; antes solo en dos de la Biblioteca, y latía también al quitarla. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | No late: el pulso vale 1, y el color ya lo dice. |

#### Un botón que espera: «Guardar» → «Guardando…» → ✓

`boton_estado` · ✅ Existe · lo trata la **F9**

| Campo | Valor |
|---|---|
| Ubicación | src/components/ui.jsx (PrimaryButton, GhostBtn) · src/index.css |
| Componente | PrimaryButton |
| Clase CSS | `.boton-capa` |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Que se vea que la acción se está haciendo y que no se puede repetir (apartados 4, 6 y 7). |
| Estado inicial | Su texto |
| Estado final | «Guardando…» (y ✓ o el fallo si el botón sigue en pantalla) |
| Entrada | Fundido en su sitio, sin cambiar de ancho: las capas están apiladas |
| Salida | — |
| Interacción | Pulsar algo que tarda (subir una foto, guardar una prenda) |
| Transición | opacity y visibility, `fast` |
| Duración | 160 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | alta |
| Relación | MS F9 — antes cuatro botones escribían «Guardando…» a mano y se apagaban: parecían rotos mientras trabajaban. Ahora no se apagan, llevan `aria-busy` y el toque no repite la acción. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Igual: un fundido en su sitio. |

### F · Campos

#### Campos de texto al enfocar

`campos` · ✅ Existe · lo trata la **F9**

| Campo | Valor |
|---|---|
| Ubicación | src/components/ui.jsx · src/index.css |
| Componente | TextInput, Textarea, SelectInput, Select |
| Clase CSS | `.campo` |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Que se note en qué campo se está escribiendo (apartados 20 y 21). |
| Estado inicial | Su borde de siempre |
| Estado final | Borde del acento con un halo suave; con `aria-invalid`, en rojo |
| Entrada | — |
| Salida | — |
| Interacción | Enfocar (tocar o tabular) |
| Transición | border-color y box-shadow, `fast` |
| Duración | 160 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | alta |
| Relación | 🐛 MS F9 — llevaban `outline-none` y nada en su lugar: un campo enfocado no cambiaba (salvo en Fitness, FIT F39). La letra y el tamaño no se tocan: eso es la C-32. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Igual: es un cambio de color en su sitio. |

### G · Modales

#### El fondo de una hoja se oscurece

`velo_hoja` · ✅ Existe · lo trata la **F6**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | — |
| Clase CSS | `.fondo-entra` |
| @keyframes | `fondoEntra` |
| En ANIMACIONES_HC | `fondo_entra` |
| Función | Separar la hoja de lo de detrás. |
| Estado inicial | Transparente |
| Estado final | Velo (en Ultra, además, lo de detrás desenfocado y fijo) |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | — |
| Duración | 220 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### Ventanas del Calendario

`hoja_calendario` · ✅ Existe · lo trata la **F6**

| Campo | Valor |
|---|---|
| Ubicación | src/views/CalendarView.jsx · src/index.css |
| Componente | — |
| Clase CSS | `.calendar-sheet` |
| @keyframes | `calendarSheetIn` |
| En ANIMACIONES_HC | — |
| Función | Crear o editar un evento, el detalle de un día. |
| Estado inicial | — |
| Estado final | — |
| Entrada | Sube un poco y aparece |
| Salida | La común de las capas (MS F6) |
| Interacción | — |
| Transición | — |
| Duración | 220 ms |
| Curva | --motion-curva-entrance |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | 🐛 MS F6 — terminaba con `both` y dejaba un `transform` puesto en la ventana; ahora `backwards`. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### Todas las capas: ventanas, hojas, pantallas por encima y visores (unas 40)

`modales_resto` · ✅ Existe · lo trata la **F6**

| Campo | Valor |
|---|---|
| Ubicación | src/components/capasMotion.js (useCapasMotion, en App.jsx) · src/lib/profundidad.js |
| Componente | useCapasMotion |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Confirmaciones, formularios, buscador, papelera, el ＋, el Armario, la Biblioteca, el visor de fotos. |
| Estado inicial | Velo transparente; la caja fuera (hoja), escalada (ventana) o a la derecha (pantalla) |
| Estado final | En su sitio |
| Entrada | El velo se funde y la caja hace lo suyo, a la vez (apartado 8): una hoja sube desde su borde, una ventana aparece desde el centro (`modalEnter`), una pantalla entra como un módulo (`pageEnter`), un visor se funde |
| Salida | Una copia inerte en su mismo sitio hace el camino de vuelta (`fast`, curva `exit`) y se quita |
| Interacción | — |
| Transición | Web Animations API: background-color del velo, transform y opacity de la caja |
| Duración | 220 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | alta |
| Relación | MS F6: antes aparecían y desaparecían de golpe (hallazgo `modales_de_golpe`). Ninguna escribe la suya: lo decide `tipoDeCapa` con el estilo calculado. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | El velo y el fundido; sin escala ni recorrido. |

### H · Hojas inferiores

#### Una hoja de Fitness entra (en el iPhone, desde su borde)

`hoja_fitness` · ✅ Existe · lo trata la **F6**

| Campo | Valor |
|---|---|
| Ubicación | src/lib/acabadoFitness.js (HOJA) · src/index.css |
| Componente | — |
| Clase CSS | `.hoja-entra` |
| @keyframes | `calendarSheetIn` |
| En ANIMACIONES_HC | `hoja_entra` |
| Función | Las hojas de Fitness suben y su velo se oscurece. |
| Estado inicial | Abajo |
| Estado final | En su sitio |
| Entrada | En el iPhone, donde es una HOJA, sube desde su borde con todo su alto (`hojaSubeDelBorde`, MS F6); en una pantalla ancha, donde va centrada, la entrada del Calendario |
| Salida | La común de las capas (MS F6): baja hacia su borde |
| Interacción | — |
| Transición | — |
| Duración | 220 ms |
| Curva | --motion-curva-entrance |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | Quién es hoja y quién ventana lo decide `capasMotion.js` con el estilo calculado (`data-capa`). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### Una hoja sube desde su borde

`hoja_borde` · ✅ Existe · lo trata la **F6**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css · src/components/capasMotion.js |
| Componente | — |
| Clase CSS | `.hoja-entra` |
| @keyframes | `hojaSubeDelBorde` |
| En ANIMACIONES_HC | — |
| Función | Que una hoja parezca conectada al borde de abajo (apartado 11): entra desde su posición física, no con la animación de una ventana. |
| Estado inicial | Debajo del borde, con todo su alto |
| Estado final | En su sitio |
| Entrada | Sube, sin fundido ni escala |
| Salida | — |
| Interacción | — |
| Transición | transform |
| Duración | 220 ms |
| Curva | --motion-curva-entrance |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | Las hojas sin entrada en CSS (el ＋, el Armario, el editor de color) hacen lo mismo por la Web Animations API (`animacionDeCapa`). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | No se desplaza: se funde (`--hoja-recorrido: 0%`). |

#### Arrastrar una hoja por su asa

`asa_hoja` · ✅ Existe · lo trata la **F5**

| Campo | Valor |
|---|---|
| Ubicación | src/components/gestosMotion.jsx (AsaHoja) · src/lib/gestosMotion.js |
| Componente | AsaHoja |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Cerrar una hoja con el dedo, como tocar fuera (apartados 14-17). |
| Estado inicial | En su sitio |
| Estado final | Fuera por abajo, o de vuelta en su sitio |
| Entrada | — |
| Salida | — |
| Interacción | Arrastrar el asa: la hoja sigue al dedo; hacia arriba, con resistencia (`conResistencia`). Al soltar, `decidirSoltar`: se cierra si se lanza o pasa del 35 % de su altura |
| Transición | transform directo mientras se arrastra; al soltar, sale con su inercia (entre `fast` y `normal`, curva `exit`) o vuelve con el muelle `responsive` desde donde esté |
| Duración | 220 ms |
| Curva | --motion-curva-exit |
| Spring | responsive |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | alta |
| Relación | Las cuatro hojas de Fitness, el ＋ de Hoy, la Agenda y el Calendario, las tres del Armario y el editor de color y de temas. El botón de cerrar, tocar fuera y Escape siguen ahí: el asa es un añadido para el dedo, sin nombre ni foco. |
| Móvil | Con asa |
| Escritorio | Sin asa (`sm:hidden`): la hoja va centrada y se cierra con su botón |
| Movimiento reducido | El dedo la sigue moviendo; al soltar, se cierra o vuelve en su sitio, sin muelle ni inercia. |

#### El velo de una hoja se aclara mientras se arrastra

`velo_sigue_al_dedo` · ✅ Existe · lo trata la **F8**

| Campo | Valor |
|---|---|
| Ubicación | src/components/gestosMotion.jsx (AsaHoja) · src/lib/fisicaMotion.js |
| Componente | AsaHoja |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Que al bajar una hoja lo de debajo recupere protagonismo (apartado 16): responden a la vez la hoja y su velo. |
| Estado inicial | El velo de la hoja |
| Estado final | Hasta un 60 % más claro con la hoja abajo del todo (`veloDuranteArrastre`) |
| Entrada | — |
| Salida | — |
| Interacción | Arrastrar el asa |
| Transición | background-color directo mientras se arrastra (es el dedo); si la hoja vuelve, el velo vuelve con ella y en su mismo tiempo (Web Animations API); si se cierra, se apaga con la salida común de las capas (F6) |
| Duración | 220 ms |
| Curva | --ease-premium |
| Spring | responsive |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | MS F8. La hoja va por los estados de `siguienteEstadoGesto` —quieta, arrastrando, umbral, volviendo, cerrando, cerrada— escritos en `data-arrastre`, y es de UN dedo (`punteroQueCuenta`): un segundo no la mueve ni la suelta. Si se cancela, no queda ni un transform ni un velo a medias (apartado 33). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Igual mientras se arrastra (es manipular, no animar); al soltar, sin muelle. |

### I · Menús

#### Menús «⋯» y desplegables

`menus` · ✅ Existe · lo trata la **F6**

| Campo | Valor |
|---|---|
| Ubicación | PlantillasView (dentro de su tarjeta) · el «⋯» de la Agenda abre una hoja |
| Componente | — |
| Clase CSS | `.despliegue-entra` |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Acciones de un elemento. |
| Estado inicial | — |
| Estado final | — |
| Entrada | Se despliegan dentro de su tarjeta, debajo de quien los abre (F3); el de la Agenda es una hoja (F6) |
| Salida | Se pliegan |
| Interacción | — |
| Transición | — |
| Duración | 220 ms |
| Curva | --motion-curva-entrance |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### Un panel que nace de su botón (las sugerencias)

`menu_flotante` · ✅ Existe · lo trata la **F6**

| Campo | Valor |
|---|---|
| Ubicación | src/components/ui.jsx · src/index.css |
| Componente | — |
| Clase CSS | `.menu-entra` |
| @keyframes | `menuEntra` |
| En ANIMACIONES_HC | — |
| Función | Que un panel flotante diga de dónde sale (apartados 12 y 14). |
| Estado inicial | Un poco más pequeño y 4 px más arriba, desde la esquina de su botón |
| Estado final | En su sitio |
| Entrada | Crece desde su origen (`transform-origin`) |
| Salida | — |
| Interacción | — |
| Transición | opacity, transform |
| Duración | 160 ms |
| Curva | --motion-curva-entrance |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Solo el fundido. |

### J · Listas

#### El nombre de un ejercicio viaja de la biblioteca a su ficha

`compartido_ejercicio` · ✅ Existe · lo trata la **F7**

| Campo | Valor |
|---|---|
| Ubicación | src/components/bibliotecaEjercicios.jsx (ExerciseCard, ExerciseHeader) · src/components/continuidad.jsx (Compartido) |
| Componente | Compartido |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Que el nombre que se tocó sea el mismo que encabeza la ficha (apartados 3, 4 y 22). |
| Estado inicial | Donde estaba en la tarjeta, a su tamaño de letra |
| Estado final | El título de la ficha |
| Entrada | Viaja y crece por su letra, sin estirarse (FLIP) |
| Salida | — |
| Interacción | Tocar un ejercicio; y al volver, de la ficha a la tarjeta |
| Transición | transform, por la Web Animations API |
| Duración | 280 ms |
| Curva | --motion-curva-emphasized |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 3 · Protagonista |
| Prioridad | media |
| Relación | Funciona en los dos sentidos: lo que desaparece apunta dónde estaba y lo que aparece con el mismo id sale de ahí. Si el scroll cambia antes del primer fotograma, el viaje se corrige. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio: la continuidad sin recorrido (apartado 34). |

#### Tarjetas de una lista que entran en cascada (Biblioteca, Productividad, Nutrición, Salud)

`tarjeta_lista_entra` · ✅ Existe · lo trata la **F10**

| Campo | Valor |
|---|---|
| Ubicación | LibraryView · ProductivityView · NutritionView · HealthView |
| Componente | — |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Que una lista no aparezca de golpe. |
| Estado inicial | — |
| Estado final | — |
| Entrada | Cascada con la animación de la portada |
| Salida | — |
| Interacción | — |
| Transición | opacity, transform |
| Duración | 420 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | 60 ms entre elementos |
| Intensidad | 3 · Protagonista |
| Prioridad | media |
| Relación | Una sola cadencia y como mucho seis escalones: `escalonado(i)` del motor (MS F1). Antes eran 60, 70 y 80 ms y dos funciones. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### Completar una tarea

`tarea_hecha` · ✅ Existe · lo trata la **F9**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | — |
| Clase CSS | `.tarea-hecha` |
| @keyframes | `tareaHecha` |
| En ANIMACIONES_HC | `completar` |
| Función | Que se note que se ha completado. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | — |
| Duración | 280 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### Completar un hábito

`habito_hecho` · ✅ Existe · lo trata la **F9**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | — |
| Clase CSS | `.habito-hecho` |
| @keyframes | `habitoHecho` |
| En ANIMACIONES_HC | `habito_hecho` |
| Función | El hábito de hoy hecho. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | — |
| Duración | 280 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### Marcar una serie

`serie_hecha` · ✅ Existe · lo trata la **F9**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | — |
| Clase CSS | `.fit-serie-hecha` |
| @keyframes | `fitSerieHecha` |
| En ANIMACIONES_HC | `fit_serie` |
| Función | Una serie del entrenamiento en vivo hecha. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | — |
| Duración | 160 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### Borrar, añadir, completar o filtrar en una lista

`borrar_elemento` · ✅ Existe · lo trata la **F10**

| Campo | Valor |
|---|---|
| Ubicación | src/components/layoutMotion.jsx (ListaAnimada) · src/lib/layoutMotion.js · Tareas, la agenda de un día, las comidas, los resultados del buscador |
| Componente | ListaAnimada |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Que la lista no salte: lo que entra aparece en su sitio, lo que sale se va y lo demás se recoloca (apartados 10, 11 y 13). |
| Estado inicial | — |
| Estado final | — |
| Entrada | Fundido y un leve ascenso (`normal`, curva de entrada) |
| Salida | Una copia inerte que se desvanece (`fast`, curva de salida); lo demás se recoloca con FLIP (`normal`) cuando empieza a irse |
| Interacción | — |
| Transición | transform, opacity (Web Animations) |
| Duración | 220 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | alta |
| Relación | Con un presupuesto (`PRESUPUESTO_LAYOUT`): por encima, un fundido de la lista entera. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Lo que entra y lo que sale se funden en su sitio; lo demás se coloca sin viajar. |

### K · Gráficas

#### Gráficas de Recharts (Salud, Nutrición, Sueño)

`graficas_recharts` · ✅ Existe · lo trata la **F4**

| Campo | Valor |
|---|---|
| Ubicación | HealthView · NutritionView · SleepView · src/lib/datosMotion.js |
| Componente | LineChart |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Dibujar los datos. |
| Estado inicial | — |
| Estado final | — |
| Entrada | La línea se dibuja una vez, en `cinematic`, con la curva de JosStyle |
| Salida | — |
| Interacción | Cambiar de periodo o de semana: la misma gráfica interpola a los datos nuevos, no se rehace |
| Transición | JavaScript de la librería, gobernado por el motor (`animacionDeGrafica`, `useAnimacionDeGrafica`) |
| Duración | 420 ms |
| Curva | --ease-premium (la `standard` del motor) |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 3 · Protagonista |
| Prioridad | alta |
| Relación | MS F4: antes 1,5 s con su curva y sin obedecer a «Reducir movimiento» (hallazgo `graficas_sin_control`). El tooltip, en `fast`. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | No se dibuja: la línea aparece en su sitio. |

#### Una cifra que sube

`cifra_sube` · ✅ Existe · lo trata la **F4**

| Campo | Valor |
|---|---|
| Ubicación | src/components/motion.jsx (CifraQueCambia) · src/index.css |
| Componente | CifraQueCambia |
| Clase CSS | `.cifra-sube` |
| @keyframes | `cifraSube` |
| En ANIMACIONES_HC | — |
| Función | Que se vea QUÉ ha cambiado y hacia dónde (apartados 2 y 6). |
| Estado inicial | Medio visible, 4 px más abajo |
| Estado final | En su sitio |
| Entrada | — |
| Salida | — |
| Interacción | El dato cambia (un registro, un toque, una carga) |
| Transición | opacity, transform |
| Duración | 220 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | El preset `dataChange`. Las cifras principales CUENTAN en vez de relevarse (puntuación, progreso, calorías, saldo); nunca al aparecer. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Solo el fundido; una cuenta pasa a relevo. |

#### Una cifra que baja

`cifra_baja` · ✅ Existe · lo trata la **F4**

| Campo | Valor |
|---|---|
| Ubicación | src/components/motion.jsx (CifraQueCambia) · src/index.css |
| Componente | CifraQueCambia |
| Clase CSS | `.cifra-baja` |
| @keyframes | `cifraBaja` |
| En ANIMACIONES_HC | — |
| Función | Lo mismo, desde arriba: bajar no es un error, y no se pinta de rojo (apartado 6). |
| Estado inicial | Medio visible, 4 px más arriba |
| Estado final | En su sitio |
| Entrada | — |
| Salida | — |
| Interacción | El dato cambia |
| Transición | opacity, transform |
| Duración | 220 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Solo el fundido. |

#### Un estado vacío

`vacio` · ✅ Existe · lo trata la **F4**

| Campo | Valor |
|---|---|
| Ubicación | src/components/ui.jsx (EmptyHint) · src/index.css |
| Componente | EmptyHint |
| Clase CSS | `.vacio-entra` |
| @keyframes | `vacioEntra` |
| En ANIMACIONES_HC | — |
| Función | Entrar sin ser protagonista (apartado 14). |
| Estado inicial | Invisible, 4 px más abajo |
| Estado final | En su sitio |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | opacity, transform |
| Duración | 160 ms |
| Curva | --motion-curva-entrance |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Solo el fundido. |

#### Gráficas propias en SVG (Fitness, Sueño)

`graficas_propias` · ⬜ Sin movimiento · lo trata la **F17**

| Campo | Valor |
|---|---|
| Ubicación | GraficaProgreso y similares |
| Componente | — |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Progreso de un ejercicio, sueño de la semana. |
| Estado inicial | — |
| Estado final | — |
| Entrada | Ninguna |
| Salida | — |
| Interacción | — |
| Transición | — |
| Duración | — |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 0 · Estático |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

### L · Estadísticas

#### Barras de progreso con su clase (Hoy, Biblioteca, Nutrición, Fitness)

`barras_progreso_css` · ⚠️ Inconsistente · lo trata la **F17**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | — |
| Clase CSS | `.barra-progreso` |
| @keyframes | — |
| En ANIMACIONES_HC | `progreso_dia` |
| Función | Que la barra avance en vez de saltar. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | width |
| Duración | 280 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 3 · Protagonista |
| Prioridad | media |
| Relación | Cuatro clases con tres tokens: barra-progreso `slow`, nu-progreso y progreso-libro `cinematic`, fit-barra `medium`. Ya son tokens (MS F1); que digan uno solo es de la F17. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### Barras de progreso escritas en la vista (Objetivos, Productividad, Rachas, Bienestar digital)

`barras_progreso_sueltas` · ⚠️ Inconsistente · lo trata la **F17**

| Campo | Valor |
|---|---|
| Ubicación | ObjectivesView · ProductivityView · RachasView · WellbeingView |
| Componente | — |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Lo mismo que las de arriba. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | width `slow` con la curva de JosStyle (MS F1: `transicion()`; antes 0,3 / 0,35 / 0,4 / 0,5 s con `ease`) |
| Duración | 340 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 3 · Protagonista |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### El aro de progreso de `ui.jsx`

`aro_progreso` · ✅ Existe · lo trata la **F17**

| Campo | Valor |
|---|---|
| Ubicación | src/components/ui.jsx |
| Componente | ProgressRing |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Un porcentaje en círculo. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | stroke-dashoffset `cinematic` (MS F1; antes 1 s con `ease`, por encima del tope) |
| Duración | 420 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 3 · Protagonista |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### El aro del temporizador

`aro_pomodoro` · ✅ Existe · lo trata la **F17**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | — |
| Clase CSS | `.aro-pomodoro` |
| @keyframes | — |
| En ANIMACIONES_HC | `aro_pomodoro` |
| Función | El tiempo que queda. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | stroke-dashoffset lineal (es un reloj) |
| Duración | 280 ms |
| Curva | --motion-curva-linear |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### Cifras que cambian (rachas, kcal, puntuación, saldo)

`cifras` · ⬜ Sin movimiento · lo trata la **F17**

| Campo | Valor |
|---|---|
| Ubicación | Toda la aplicación |
| Componente | — |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Un número que sube o baja. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | Ninguna: el número cambia de golpe |
| Duración | — |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 0 · Estático |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

### M · Carga

#### «Pensando…» y los botones que esperan

`pensando` · ✅ Existe · lo trata la **F16**

| Campo | Valor |
|---|---|
| Ubicación | src/components/ui.jsx · BarcodeScanner |
| Componente | — |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Que se vea que algo está trabajando. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | Giro continuo (`animate-spin` de Tailwind) |
| Duración | 1000 ms |
| Curva | linear |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | Es de los pocos bucles infinitos permitidos (presupuesto). MS F16 — un giro va SIEMPRE con su texto (`GiroDeCarga`, los botones de F9): `auditarAsincronia` caza el suelto, y uno que esperaba un `await` sin `finally` (el PIN) se quedaba girando para siempre. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### El giro de un botón que tarda

`boton_giro` · ✅ Existe · lo trata la **F9**

| Campo | Valor |
|---|---|
| Ubicación | src/components/ui.jsx · src/index.css |
| Componente | PrimaryButton |
| Clase CSS | `.boton-giro` |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Que se vea que algo trabaja SOLO si tarda (apartado 31). |
| Estado inicial | Invisible |
| Estado final | Girando |
| Entrada | Aparece con un fundido pasado `slow` (`RETARDO_INDICADOR`): una acción casi instantánea no lo enseña |
| Salida | — |
| Interacción | — |
| Transición | opacity `fast` con retraso `slow`; el giro, el de `animate-spin` |
| Duración | 160 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | Ocupa su sitio aunque no se vea: cuando aparece, el texto no se mueve. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Igual. |

### N · Esqueletos

#### El latido del esqueleto

`esqueleto` · ✅ Existe · lo trata la **F16**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | — |
| Clase CSS | `.esqueleto` |
| @keyframes | `latido` |
| En ANIMACIONES_HC | `esqueleto` |
| Función | Que la pantalla de carga tenga la forma de Hoy y respire. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | opacity en bucle |
| Duración | 1400 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | Bucle permitido: solo mientras carga. MS F16 — y no para siempre: a los 8 s dice que tarda y se queda quieto (`esqueleto-quieto`), a los 20 s ofrece volver a intentarlo; el contenido entra en su sitio con la entrada de sección (F2). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

### O · Estados vacíos

#### Estados vacíos: el que llega con su pantalla y el que llega después del contenido

`vacios` · ✅ Existe · lo trata la **F16**

| Campo | Valor |
|---|---|
| Ubicación | src/components/ui.jsx (EmptyHint) · src/components/estadosAsincronos.jsx (VacioQueLlega) · src/components/vacioMotion.js |
| Componente | EmptyHint, VacioQueLlega |
| Clase CSS | `.vacio-entra` |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Decir que aún no hay nada y qué hacer, sin parecer roto (apartados 21-23). |
| Estado inicial | — |
| Estado final | — |
| Entrada | `vacio-entra`; si llega DESPUÉS del contenido (se ha borrado lo último), espera a que la fila salga (`vacio-tras-salida`) |
| Salida | Lo primero que se crea entra en su sitio: la lista se queda montada aunque se vacíe |
| Interacción | — |
| Transición | — |
| Duración | 160 ms |
| Curva | --motion-curva-entrance |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | MS F16 — antes, el último elemento y el vacío se cambiaban de golpe (el Constructor y la Agenda desmontaban la lista). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Solo el fundido. |

### P · Errores

#### Un error aparece debajo de su campo

`mensaje_campo` · ✅ Existe · lo trata la **F9**

| Campo | Valor |
|---|---|
| Ubicación | src/components/ui.jsx (MensajeDeCampo) · src/index.css |
| Componente | MensajeDeCampo |
| Clase CSS | `.campo-mensaje-entra` |
| @keyframes | `campoMensajeEntra` |
| En ANIMACIONES_HC | — |
| Función | Decir qué corregir donde se espera encontrarlo (apartados 8 y 22). |
| Estado inicial | Invisible, 4 px más arriba |
| Estado final | En su sitio |
| Entrada | Fundido corto que baja un poco desde el campo |
| Salida | — |
| Interacción | Guardar con algo que no vale |
| Transición | opacity, transform |
| Duración | 160 ms |
| Curva | --motion-curva-entrance |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | Sin temblar (apartado 23): el error se lee, no se sacude. El campo lleva `aria-invalid`. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Solo el fundido. |

#### Avisos de error (guardado, archivo, conexión)

`errores` · ✅ Existe · lo trata la **F16**

| Campo | Valor |
|---|---|
| Ubicación | AvisoAccion · src/components/estadosAsincronos.jsx (IndicadorDeSincronizacion, ErrorDeArranque) · cada vista |
| Componente | AvisoAccion, IndicadorDeSincronizacion |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Decir qué ha fallado, qué hacer y qué ha pasado con sus datos. |
| Estado inicial | — |
| Estado final | — |
| Entrada | Como un aviso (`toastEnter`); una línea en la pantalla, con `campo-mensaje-entra` o `vacio-entra` |
| Salida | `toastExit` |
| Interacción | — |
| Transición | — |
| Duración | 280 ms |
| Curva | --motion-curva-entrance |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | MS F16 — un fallo de guardado ya no solo suena: el indicador de arriba dice lo que no ha llegado y lo vuelve a mandar. Sin temblar (F9). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Solo el fundido. |

#### El indicador de arriba: sin cargar, sin guardar, sin conexión, guardando, guardado

`estado_sistema` · ✅ Existe · lo trata la **F16**

| Campo | Valor |
|---|---|
| Ubicación | src/components/estadosAsincronos.jsx (IndicadorDeSincronizacion) · App.jsx |
| Componente | IndicadorDeSincronizacion |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Decir cómo va lo guardado sin convertir la aplicación en una consola de servidor (apartados 26-33). |
| Estado inicial | Nada (casi siempre) |
| Estado final | Una tarjeta pequeña arriba, a la altura de la lupa |
| Entrada | `toastEnter` por `Presencia`; cambiar de frase, `CambioDeContenido` |
| Salida | `toastExit`, después de un mínimo visible (sin destellos) |
| Interacción | — |
| Transición | — |
| Duración | 280 ms |
| Curva | --motion-curva-entrance |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | MS F16 — uno para toda la aplicación. «Guardando…» solo si tarda más de 1,2 s; «Guardado» un momento solo después de haber dicho algo. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Solo el fundido. |

### Q · Éxito

#### El aviso de «añadido» (y los de Fitness)

`aviso_anadido` · ✅ Existe · lo trata la **F9**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css · src/components/quickAdd.jsx (AvisoAccion) |
| Componente | AvisoAccion |
| Clase CSS | `.aviso-entra` |
| @keyframes | `avisoEntra` |
| En ANIMACIONES_HC | `aviso` |
| Función | Confirmar una acción sin pararte, con «Deshacer» si se puede (apartados 33 y 34). |
| Estado inicial | — |
| Estado final | — |
| Entrada | Sube y aparece |
| Salida | Baja y se va (`toastExit`, `fast`, curva de salida): antes desaparecía de golpe |
| Interacción | — |
| Transición | — |
| Duración | 280 ms |
| Curva | --motion-curva-entrance |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | MS F9 — se monta siempre (`Presencia`), así que puede salir; y su entrada termina con `backwards`, no con `both`. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### Terminar una rutina

`rutina_fin` · ✅ Existe · lo trata la **F9**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | — |
| Clase CSS | `.rutina-fin` |
| @keyframes | `rutinaFin` |
| En ANIMACIONES_HC | `rutina_fin` |
| Función | Cerrar una rutina entera. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | — |
| Duración | 420 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 3 · Protagonista |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### El entrenamiento guardado

`entreno_guardado` · ✅ Existe · lo trata la **F9**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | — |
| Clase CSS | `.exito-entra` |
| @keyframes | `exitoEntra` |
| En ANIMACIONES_HC | `entreno_guardado` |
| Función | La marca de la pantalla de éxito. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | — |
| Duración | 280 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### Terminar un libro

`libro_terminado` · ✅ Existe · lo trata la **F9**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | — |
| Clase CSS | `.celebracion-libro` |
| @keyframes | `celebracionLibro` |
| En ANIMACIONES_HC | — |
| Función | El libro pasa a Terminado. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | — |
| Duración | 340 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 3 · Protagonista |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### Termina el descanso

`descanso_fin` · ✅ Existe · lo trata la **F9**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | — |
| Clase CSS | `.fit-descanso-fin` |
| @keyframes | `fitDescansoFin` |
| En ANIMACIONES_HC | `fit_descanso` |
| Función | Avisar de que toca la siguiente serie. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | — |
| Duración | 280 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### Subir de rango

`rango_sube` · ✅ Existe · lo trata la **F17**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | — |
| Clase CSS | `.fit-rango-sube` |
| @keyframes | `fitRangoSube` |
| En ANIMACIONES_HC | `fit_rango_sube` |
| Función | El momento de un rango nuevo. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | — |
| Duración | 280 ms |
| Curva | --motion-curva-emphasized |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 4 · Momento |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### La llama de una racha que sube

`racha_sube` · ✅ Existe · lo trata la **F17**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | — |
| Clase CSS | `.fuego-sube` |
| @keyframes | `fuegoSube` |
| En ANIMACIONES_HC | — |
| Función | La racha de hoy cuenta. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | — |
| Duración | 620 ms |
| Curva | --motion-curva-emphasized |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 4 · Momento |
| Prioridad | media |
| Relación | No está en ANIMACIONES_HC, pero desde la MS F1 su duración es el token `momento` y el mapa la mide. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### El «+1» de una racha

`racha_mas_uno` · ✅ Existe · lo trata la **F18**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | — |
| Clase CSS | `.racha-mas-uno` |
| @keyframes | `masUnoSube` |
| En ANIMACIONES_HC | — |
| Función | La firma de JosStyle: un día más. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | — |
| Duración | 900 ms |
| Curva | --motion-curva-emphasized |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 5 · Firma |
| Prioridad | media |
| Relación | La única animación de nivel firma; su duración es el token `firma` (MS F1). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

### R · Interruptores

#### El interruptor (la bola)

`interruptor_ui` · ✅ Existe · lo trata la **F3**

| Campo | Valor |
|---|---|
| Ubicación | src/components/ui.jsx (Switch, PistaInterruptor) · src/index.css |
| Componente | Switch |
| Clase CSS | `.interruptor-bola` |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Encender o apagar algo. |
| Estado inicial | A la izquierda |
| Estado final | A la derecha |
| Entrada | — |
| Salida | — |
| Interacción | Tocar: al pulsar se estira hacia donde va |
| Transición | transform `normal` con la curva `entrance`; color `normal` |
| Duración | 220 ms |
| Curva | --motion-curva-entrance |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | MS F3: uno solo para toda la aplicación. Eran tres —el de `ui.jsx`, seis dibujados a mano y cuatro filas— y movían la bola con `left`. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Salta a su sitio; solo se funde el color. |

#### El interruptor (la pista), suelto o dentro de una fila

`interruptor_pista` · ✅ Existe · lo trata la **F3**

| Campo | Valor |
|---|---|
| Ubicación | src/components/ui.jsx (Switch, PistaInterruptor) · src/index.css |
| Componente | PistaInterruptor |
| Clase CSS | `.interruptor` |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Lo mismo que el Switch, cuando la fila entera es lo que se toca (Todo el día, Avisarme, Repetir cada año, la legibilidad). |
| Estado inicial | Gris |
| Estado final | Acento |
| Entrada | — |
| Salida | — |
| Interacción | Tocar la fila |
| Transición | background-color, border-color `normal` |
| Duración | 220 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | La fila lleva `role="switch"` y `aria-checked`. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Igual: ya es solo color. |

#### La muestra de «Ver cómo se mueve» en Ajustes

`muestra_ajustes` · ✅ Existe · lo trata la **F1**

| Campo | Valor |
|---|---|
| Ubicación | src/views/SettingsView.jsx (AjusteMovimiento) |
| Componente | AjusteMovimiento |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Ver la diferencia entre modos y velocidades sin ir a buscarla (MS F1). |
| Estado inicial | — |
| Estado final | — |
| Entrada | La cascada de la portada, con el modo y la velocidad elegidos |
| Salida | — |
| Interacción | Tocar «Ver cómo se mueve» la repite |
| Transición | — |
| Duración | 420 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | 60 ms entre elementos |
| Intensidad | 3 · Protagonista |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

### S · Deslizadores

#### Deslizadores (`input type=range`)

`deslizadores` · ✅ Existe · lo trata la **F5**

| Campo | Valor |
|---|---|
| Ubicación | SettingsView y otros |
| Componente | — |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Elegir un valor. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | Los del navegador |
| Duración | — |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 0 · Estático |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

### T · Gestos

#### Deslizar para cambiar de ejercicio

`cambiar_ejercicio` · ✅ Existe · lo trata la **F5**

| Campo | Valor |
|---|---|
| Ubicación | src/views/EntrenamientoVivoView.jsx · src/components/gestosMotion.jsx (useDeslizarParaCambiar) · src/lib/gestosMotion.js |
| Componente | useDeslizarParaCambiar |
| Clase CSS | `.fit-miniatura` |
| @keyframes | — |
| En ANIMACIONES_HC | `fit_miniatura` |
| Función | Pasar al ejercicio siguiente o al anterior en el entrenamiento en vivo. |
| Estado inicial | En su sitio |
| Estado final | El ejercicio nuevo, entrando por el lado hacia el que se deslizó |
| Entrada | — |
| Salida | — |
| Interacción | Deslizar en horizontal: la tarjeta sigue al dedo desde que el gesto se decide por un eje, resiste donde ya no hay más y, al soltar, decide con distancia Y velocidad (`decidirCambio`) |
| Transición | transform directo mientras se arrastra (es el dedo); si no cambia, vuelve con el muelle `responsive` desde donde esté (Web Animations API) |
| Duración | 220 ms |
| Curva | --ease-premium |
| Spring | responsive |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | alta |
| Relación | MS F5: antes el cambio solo ocurría al soltar y la tarjeta no se movía. `pan-y`: el scroll vertical sigue siendo del navegador. Los umbrales viven en `umbralesGesto.js`, el mismo `distanciaCambio` de la FIT F9. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | El dedo la sigue moviendo (es manipular, no animar); al soltar, vuelve o cambia en su sitio, sin muelle. |

#### El ejercicio siguiente entra desde la derecha

`ejercicio_entra_derecha` · ✅ Existe · lo trata la **F5**

| Campo | Valor |
|---|---|
| Ubicación | src/views/EntrenamientoVivoView.jsx · src/index.css |
| Componente | — |
| Clase CSS | `.ejercicio-entra-derecha` |
| @keyframes | `ejercicioEntraDerecha` |
| En ANIMACIONES_HC | — |
| Función | Que pasar al siguiente se lea como avanzar: llega del lado hacia el que se deslizó. |
| Estado inicial | Medio visible, desplazado a la derecha |
| Estado final | En su sitio |
| Entrada | Desliza + fundido |
| Salida | — |
| Interacción | Deslizar a la izquierda o tocar «Siguiente» |
| Transición | opacity, transform |
| Duración | 220 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | Con `backwards`: no deja un transform puesto (FIT F37). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Solo el fundido. |

#### El ejercicio anterior entra desde la izquierda

`ejercicio_entra_izquierda` · ✅ Existe · lo trata la **F5**

| Campo | Valor |
|---|---|
| Ubicación | src/views/EntrenamientoVivoView.jsx · src/index.css |
| Componente | — |
| Clase CSS | `.ejercicio-entra-izquierda` |
| @keyframes | `ejercicioEntraIzquierda` |
| En ANIMACIONES_HC | — |
| Función | Lo mismo hacia atrás: volver al anterior llega desde la izquierda. |
| Estado inicial | Medio visible, desplazado a la izquierda |
| Estado final | En su sitio |
| Entrada | Desliza + fundido |
| Salida | — |
| Interacción | Deslizar a la derecha o tocar «Anterior» |
| Transición | opacity, transform |
| Duración | 220 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Solo el fundido. |

#### El divisor del comparador de fotos

`comparador` · ✅ Existe · lo trata la **F8**

| Campo | Valor |
|---|---|
| Ubicación | src/components/comparadorFotos.jsx |
| Componente | — |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Arrastrar para comparar dos fotos. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | Arrastrar: sigue al dedo (requestAnimationFrame), y es de UN dedo (`punteroQueCuenta`, MS F8): con dos, el divisor ya no salta entre ellos |
| Transición | Directa, sin animación: es el dedo |
| Duración | — |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

### U · Scroll

#### El rebote de la página

`rebote` · ✅ Existe · lo trata la **F5**

| Campo | Valor |
|---|---|
| Ubicación | El navegador (Safari) |
| Componente | — |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Arrastrar más allá del principio o del final. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | Arrastrar |
| Transición | La del sistema |
| Duración | — |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | Se quedó (v3.129.1): en su iPhone los hubs caben y es lo único que los mueve. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Lo decide iOS. |

#### Las tarjetas se desvanecen al pasar bajo la cabecera de un área

`fundido_cabecera` · ✅ Existe · lo trata la **F10**

| Campo | Valor |
|---|---|
| Ubicación | src/components/fundidoBajoCabecera.js |
| Componente | — |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Que la cabecera transparente no se lea encima de una tarjeta. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | Desplazar |
| Transición | Máscara que sigue al desplazamiento (una vez por fotograma) |
| Duración | 0 ms |
| Curva | Directa: es el dedo |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Igual: no es una animación, es recortar lo que está detrás del título. |

### V · Arrastrar y soltar

#### Reordenar (flechas en lugar de arrastrar)

`reordenar` · ✅ Existe · lo trata la **F10**

| Campo | Valor |
|---|---|
| Ubicación | Los temas de una asignatura, los pasos de una rutina, los ejercicios de una plantilla, los apartados de Imagen personal (ListaAnimada) |
| Componente | ListaAnimada |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Mover algo de sitio. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | Flechas: el arrastre sería un segundo mecanismo (EH F50) |
| Transición | La fila VIAJA de su sitio al nuevo y la que cede el sitio, también (FLIP, `normal`): A B C D → A C D B (apartado 12) |
| Duración | 220 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se coloca sin viajar. |

### W · Elementos dinámicos

#### Cambiar de mes en el Calendario

`cambio_mes` · ✅ Existe · lo trata la **F10**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | — |
| Clase CSS | `.calendar-month-grid` |
| @keyframes | `calendarMonthIn` |
| En ANIMACIONES_HC | `cambio_mes` |
| Función | Que el mes nuevo entre. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | — |
| Duración | 220 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### El progreso de un libro

`progreso_libro` · ✅ Existe · lo trata la **F17**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | — |
| Clase CSS | `.progreso-libro` |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | La barra de páginas leídas. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | width |
| Duración | 280 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 3 · Protagonista |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### El progreso de un macro

`progreso_nutricion` · ✅ Existe · lo trata la **F17**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | — |
| Clase CSS | `.nu-progreso` |
| @keyframes | — |
| En ANIMACIONES_HC | `progreso_nutricion` |
| Función | Lo consumido frente al objetivo. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | width |
| Duración | 280 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 3 · Protagonista |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

#### Una barra de progreso de Fitness

`barra_fitness` · ✅ Existe · lo trata la **F17**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | — |
| Clase CSS | `.fit-barra` |
| @keyframes | — |
| En ANIMACIONES_HC | `fit_barra` |
| Función | Rangos, objetivos y cobertura. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | width |
| Duración | 280 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 3 · Protagonista |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final. |

### X · Elementos futuros

#### Todo lo que se añada a partir de hoy

`futuros` · ✅ Existe · lo trata la **F0**

| Campo | Valor |
|---|---|
| Ubicación | — |
| Componente | — |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Apartado 19: hereda el Motion System sin que nadie lo pida. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | — |
| Duración | — |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 0 · Estático |
| Prioridad | media |
| Relación | `auditarMotion` pone la suite roja si aparece una animación que no está en este mapa, y la deuda medida (`DEUDA_F0`) no puede crecer. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | — |

