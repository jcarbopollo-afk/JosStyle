# MOTION_MAP — el movimiento de JosStyle, elemento a elemento

> **Motion System · Fase 0.** Cada elemento que se mueve —o que debería moverse— con lo que pide el
> apartado 3 de la F0. 🚨 **Este documento se genera desde `src/lib/motionMapa.js`** con
> `node --import ./scripts/resolver-vite.mjs scripts/generar-motion-map.mjs`. No lo edites a mano: edita
> el mapa y vuelve a generarlo. `scripts/test-motion-f0.mjs` lo compara y se pone rojo si no coincide.

**59 elementos**: ✅ Existe 34 · ⚠️ Inconsistente 15 · ⬜ Sin movimiento 9 · 🚨 Fuera de control 1.

## Resumen

| Elemento | Cat. | Nivel | Duración | Estado | Fase |
|---|---|---|---|---|---|
| Pestaña activa de la barra de abajo | A | 1 · Micro | 200 ms | ✅ Existe | F2 |
| Barra de «Volver» | A | 2 · Suave | 220 ms | ✅ Existe | F2 |
| Entrar en un módulo | B | 2 · Suave | 340 ms | ⚠️ Inconsistente | F2 |
| Portada de un área: la cascada de tarjetas | B | 3 · Protagonista | 420 ms | ✅ Existe | F10 |
| Cabecera de un área (ÁREA / Vida) | B | 2 · Suave | 320 ms | ✅ Existe | F2 |
| Tocar un módulo de la portada | D | 2 · Suave | 190 ms | ⚠️ Inconsistente | F7 |
| Pulsar un módulo de la portada (y las demás retroceden) | D | 1 · Micro | 160 ms | ✅ Existe | F3 |
| El icono de un módulo de la portada al pulsarlo | D | 1 · Micro | 160 ms | ✅ Existe | F3 |
| Una pantalla de Fitness aparece | B | 2 · Suave | 220 ms | ✅ Existe | F2 |
| Acordeones de Inicio (situación actual y puntuación) | C | 2 · Suave | 300 ms | ⚠️ Inconsistente | F9 |
| Chevron que gira al desplegar | C | 1 · Micro | 220 ms | ⚠️ Inconsistente | F3 |
| Pulsar una tarjeta o un botón (la escalera de escalas) | D | 1 · Micro | 150 ms | ⚠️ Inconsistente | F3 |
| Pulsar una tarjeta de Fitness | D | 1 · Micro | 140 ms | ✅ Existe | F3 |
| Pulsar algo destructivo en Fitness | E | 1 · Micro | 140 ms | ✅ Existe | F3 |
| Tarjeta destacada al llegar por un enlace (objetivo, tarea) | D | 2 · Suave | 300 ms | ⚠️ Inconsistente | F7 |
| Tarjetas de una lista que entran en cascada (Biblioteca, Productividad, Nutrición, Salud) | J | 3 · Protagonista | 420 ms | ⚠️ Inconsistente | F10 |
| Marcar un favorito | E | 1 · Micro | 240 ms | ⚠️ Inconsistente | F3 |
| «Pensando…» y los botones que esperan | M | 1 · Micro | 1000 ms | ✅ Existe | F16 |
| Campos de texto al enfocar | F | 0 · Estático | — | ⬜ Sin movimiento | F9 |
| Una hoja de Fitness entra desde abajo | H | 2 · Suave | 240 ms | ⚠️ Inconsistente | F6 |
| El fondo de una hoja se oscurece | G | 2 · Suave | 180 ms | ✅ Existe | F6 |
| Hojas del Calendario | H | 2 · Suave | 240 ms | ⚠️ Inconsistente | F6 |
| El resto de ventanas y hojas (unas 40 en 18 archivos) | G | 0 · Estático | — | ⬜ Sin movimiento | F6 |
| El aviso de «añadido» (y los de Fitness) | Q | 2 · Suave | 260 ms | ✅ Existe | F9 |
| Menús «⋯» y desplegables | I | 0 · Estático | — | ⬜ Sin movimiento | F6 |
| Completar una tarea | J | 2 · Suave | 300 ms | ✅ Existe | F9 |
| Completar un hábito | J | 2 · Suave | 280 ms | ✅ Existe | F9 |
| Terminar una rutina | Q | 3 · Protagonista | 420 ms | ✅ Existe | F9 |
| Marcar una serie | J | 1 · Micro | 160 ms | ✅ Existe | F9 |
| Borrar o añadir un elemento de una lista | J | 0 · Estático | — | ⬜ Sin movimiento | F10 |
| Gráficas de Recharts (Salud, Nutrición, Sueño) | K | 3 · Protagonista | 1500 ms | 🚨 Fuera de control | F4 |
| Gráficas propias en SVG (Fitness, Sueño) | K | 0 · Estático | — | ⬜ Sin movimiento | F17 |
| Barras de progreso con su clase (Hoy, Biblioteca, Nutrición, Fitness) | L | 3 · Protagonista | 380 ms | ⚠️ Inconsistente | F17 |
| Barras de progreso escritas en la vista (Objetivos, Productividad, Rachas, Bienestar digital) | L | 3 · Protagonista | 400 ms | ⚠️ Inconsistente | F17 |
| El aro de progreso de `ui.jsx` | L | 3 · Protagonista | 1000 ms | ⚠️ Inconsistente | F17 |
| El aro del temporizador | L | 2 · Suave | 300 ms | ✅ Existe | F17 |
| Cifras que cambian (rachas, kcal, puntuación, saldo) | L | 0 · Estático | — | ⬜ Sin movimiento | F17 |
| El latido del esqueleto | N | 1 · Micro | 1400 ms | ✅ Existe | F16 |
| Estados vacíos | O | 0 · Estático | — | ⬜ Sin movimiento | F16 |
| Avisos de error (guardado, archivo, conexión) | P | 0 · Estático | — | ⬜ Sin movimiento | F16 |
| El entrenamiento guardado | Q | 2 · Suave | 280 ms | ✅ Existe | F9 |
| Terminar un libro | Q | 3 · Protagonista | 320 ms | ✅ Existe | F9 |
| Termina el descanso | Q | 2 · Suave | 300 ms | ✅ Existe | F9 |
| Subir de rango | Q | 4 · Momento | 300 ms | ✅ Existe | F17 |
| La llama de una racha que sube | Q | 4 · Momento | 620 ms | ✅ Existe | F17 |
| El «+1» de una racha | Q | 5 · Firma | 900 ms | ✅ Existe | F18 |
| El interruptor de `ui.jsx` | R | 1 · Micro | 200 ms | ⚠️ Inconsistente | F3 |
| Interruptores escritos a mano (Calendario, Relación, Ajustes, Gestión de temas) | R | 1 · Micro | 150 ms | ⚠️ Inconsistente | F3 |
| Deslizadores (`input type=range`) | S | 0 · Estático | — | ✅ Existe | F5 |
| Deslizar para cambiar de ejercicio | T | 1 · Micro | 200 ms | ✅ Existe | F8 |
| El divisor del comparador de fotos | T | 1 · Micro | — | ✅ Existe | F8 |
| El rebote de la página | U | 1 · Micro | — | ✅ Existe | F5 |
| Las tarjetas se desvanecen al pasar bajo la cabecera de un área | U | 1 · Micro | 0 ms | ✅ Existe | F10 |
| Reordenar (flechas en lugar de arrastrar) | V | 0 · Estático | — | ⬜ Sin movimiento | F10 |
| Cambiar de mes en el Calendario | W | 2 · Suave | 220 ms | ✅ Existe | F10 |
| El progreso de un libro | W | 3 · Protagonista | 420 ms | ✅ Existe | F17 |
| El progreso de un macro | W | 3 · Protagonista | 420 ms | ✅ Existe | F17 |
| Una barra de progreso de Fitness | W | 3 · Protagonista | 280 ms | ✅ Existe | F17 |
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
| Interacción | Tocar una pestaña |
| Transición | color |
| Duración | 200 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | alta |
| Relación | Cambia a la vez que entra la pantalla del área (module-enter). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Estado inicial | Opacidad 0, 6 px arriba |
| Estado final | En su sitio |
| Entrada | Fundido + desplazamiento corto |
| Salida | — |
| Interacción | Pulsar: opacidad y fondo 140 ms |
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
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

### B · Pantallas

#### Entrar en un módulo

`entrada_modulo` · ⚠️ Inconsistente · lo trata la **F2**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css · src/App.jsx |
| Componente | — |
| Clase CSS | `.module-enter` |
| @keyframes | `moduleSlideIn` |
| En ANIMACIONES_HC | `entrada_pantalla` |
| Función | Que la pantalla nueva llegue desde la derecha en vez de aparecer. |
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
| Relación | La pila de navegación (NAVO F1) decide a dónde vuelve; la dirección no cambia al volver. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Escalonado | 80 ms entre elementos |
| Intensidad | 3 · Protagonista |
| Prioridad | alta |
| Relación | Después de la cabecera (hub-header). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Estado inicial | Opacidad 0, 6 px arriba |
| Estado final | En su sitio |
| Entrada | Fundido corto |
| Salida | — |
| Interacción | — |
| Transición | opacity, transform |
| Duración | 320 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | Se queda fija al desplazar (SC F1) y sin fondo desde la v3.129.1. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

### C · Secciones

#### Acordeones de Inicio (situación actual y puntuación)

`acordeon_inicio` · ⚠️ Inconsistente · lo trata la **F9**

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
| Transición | grid-template-rows 300 ms + opacidad 260/120 ms con `ease` |
| Duración | 300 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | Sin hueco en Safari desde la SC F1 (minHeight: 0). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

#### Chevron que gira al desplegar

`chevron` · ⚠️ Inconsistente · lo trata la **F3**

| Campo | Valor |
|---|---|
| Ubicación | DashboardView · TrainingView |
| Componente | — |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Decir si una sección está abierta. |
| Estado inicial | 0° |
| Estado final | 180° |
| Entrada | — |
| Salida | — |
| Interacción | Tocar |
| Transición | transform: 220 ms con la curva en Inicio, 0,2 s con la curva de serie en Entrenamiento |
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
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

### D · Tarjetas

#### Tocar un módulo de la portada

`expandir_tarjeta_area` · ⚠️ Inconsistente · lo trata la **F7**

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
| Transición | transform, filter, box-shadow |
| Duración | 190 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | alta |
| Relación | La navegación espera 190 ms (EXPAND_MS, escrito aparte en la vista): dos sitios para el mismo número. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Transición | transform, filter, box-shadow, opacity |
| Duración | 160 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | alta |
| Relación | Anima `filter` y `box-shadow`, que no son baratos en un iPhone (la F13 lo mide). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

#### Pulsar una tarjeta o un botón (la escalera de escalas)

`pulsar_tarjeta` · ⚠️ Inconsistente · lo trata la **F3**

| Campo | Valor |
|---|---|
| Ubicación | src/components/ui.jsx |
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
| Transición | transform con `transition-transform` de Tailwind (150 ms y otra curva) |
| Duración | 150 ms |
| Curva | curva por defecto de Tailwind |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | alta |
| Relación | Fitness usa su propio escalón (fit-pulsable, 140 ms con la curva común). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Duración | 140 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

#### Tarjeta destacada al llegar por un enlace (objetivo, tarea)

`tarjeta_destacada` · ⚠️ Inconsistente · lo trata la **F7**

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
| Transición | box-shadow 0,3 s ease |
| Duración | 300 ms |
| Curva | ease |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

### E · Botones

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
| Estado final | 0,7 |
| Entrada | — |
| Salida | — |
| Interacción | Pulsar |
| Transición | opacity |
| Duración | 140 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

#### Marcar un favorito

`favorito` · ⚠️ Inconsistente · lo trata la **F3**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | — |
| Clase CSS | `.favorito-guardado` |
| @keyframes | `favoritoPulso` |
| En ANIMACIONES_HC | — |
| Función | La estrella late una vez al pulsarla. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | Pulsar |
| Transición | transform |
| Duración | 240 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | 240 ms: 20 por encima del tope de su nivel (micro, 220). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

### F · Campos

#### Campos de texto al enfocar

`campos` · ⬜ Sin movimiento · lo trata la **F9**

| Campo | Valor |
|---|---|
| Ubicación | src/components/ui.jsx |
| Componente | TextInput, Textarea |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Enfocar un campo. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | Ninguna: el anillo de foco aparece de golpe |
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
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Estado final | Velo |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | — |
| Duración | 180 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

#### El resto de ventanas y hojas (unas 40 en 18 archivos)

`modales_resto` · ⬜ Sin movimiento · lo trata la **F6**

| Campo | Valor |
|---|---|
| Ubicación | App.jsx, ui.jsx, LibraryView, ArmarioView, EstiloHombreView, CalendarView, quickAdd… |
| Componente | — |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Confirmaciones, formularios, buscador, papelera, visor de fotos. |
| Estado inicial | — |
| Estado final | — |
| Entrada | Ninguna: aparecen de golpe |
| Salida | Ninguna: desaparecen de golpe |
| Interacción | — |
| Transición | — |
| Duración | — |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 0 · Estático |
| Prioridad | alta |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

### H · Hojas inferiores

#### Una hoja de Fitness entra desde abajo

`hoja_fitness` · ⚠️ Inconsistente · lo trata la **F6**

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
| Entrada | Sube |
| Salida | Ninguna: desaparece de golpe |
| Interacción | — |
| Transición | — |
| Duración | 240 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | Comparte la animación con las hojas del Calendario. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

#### Hojas del Calendario

`hoja_calendario` · ⚠️ Inconsistente · lo trata la **F6**

| Campo | Valor |
|---|---|
| Ubicación | src/views/CalendarView.jsx · src/index.css |
| Componente | — |
| Clase CSS | `.calendar-sheet` |
| @keyframes | `calendarSheetIn` |
| En ANIMACIONES_HC | — |
| Función | Crear o editar un evento. |
| Estado inicial | — |
| Estado final | — |
| Entrada | Sube |
| Salida | Ninguna |
| Interacción | — |
| Transición | — |
| Duración | 240 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

### I · Menús

#### Menús «⋯» y desplegables

`menus` · ⬜ Sin movimiento · lo trata la **F6**

| Campo | Valor |
|---|---|
| Ubicación | HoyView, BibliotecaPlanesView, PlantillasView… |
| Componente | — |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Acciones de un elemento. |
| Estado inicial | — |
| Estado final | — |
| Entrada | Ninguna |
| Salida | Ninguna |
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
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

### J · Listas

#### Tarjetas de una lista que entran en cascada (Biblioteca, Productividad, Nutrición, Salud)

`tarjeta_lista_entra` · ⚠️ Inconsistente · lo trata la **F10**

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
| Relación | Cuatro cadencias distintas: 60, 70, 80 ms y dos funciones (`retrasoDeTarjeta`, `retrasoDeTarjetaPR`). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Duración | 300 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

#### Borrar o añadir un elemento de una lista

`borrar_elemento` · ⬜ Sin movimiento · lo trata la **F10**

| Campo | Valor |
|---|---|
| Ubicación | Toda la aplicación |
| Componente | — |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Lo que se va a la papelera y lo que se crea. |
| Estado inicial | — |
| Estado final | — |
| Entrada | Ninguna |
| Salida | Ninguna: la lista salta |
| Interacción | — |
| Transición | — |
| Duración | — |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 0 · Estático |
| Prioridad | alta |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

### K · Gráficas

#### Gráficas de Recharts (Salud, Nutrición, Sueño)

`graficas_recharts` · 🚨 Fuera de control · lo trata la **F4**

| Campo | Valor |
|---|---|
| Ubicación | HealthView · NutritionView · SleepView |
| Componente | LineChart |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Dibujar los datos. |
| Estado inicial | — |
| Estado final | — |
| Entrada | La de Recharts por defecto: 1,5 s |
| Salida | — |
| Interacción | — |
| Transición | JavaScript de la librería, no CSS |
| Duración | 1500 ms |
| Curva | ease (de la librería) |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 3 · Protagonista |
| Prioridad | alta |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | ❌ NO se respeta: Recharts anima por JavaScript y las reglas globales de index.css no lo alcanzan. |

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
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Duración | 380 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 3 · Protagonista |
| Prioridad | media |
| Relación | Cuatro clases con cuatro duraciones: barra-progreso 380, nu-progreso 420, progreso-libro 420, fit-barra 280. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Transición | width 0,3 s / 0,35 s / 0,4 s / 0,5 s con `ease` |
| Duración | 400 ms |
| Curva | ease |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 3 · Protagonista |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

#### El aro de progreso de `ui.jsx`

`aro_progreso` · ⚠️ Inconsistente · lo trata la **F17**

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
| Transición | stroke-dashoffset 1 s ease |
| Duración | 1000 ms |
| Curva | ease |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 3 · Protagonista |
| Prioridad | media |
| Relación | Pasa del tope de una animación (700 ms). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Duración | 300 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Relación | Es de los pocos bucles infinitos permitidos (presupuesto). |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Relación | Bucle permitido: solo mientras carga. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

### O · Estados vacíos

#### Estados vacíos

`vacios` · ⬜ Sin movimiento · lo trata la **F16**

| Campo | Valor |
|---|---|
| Ubicación | EmptyHint y cada vista |
| Componente | — |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Decir que aún no hay nada y qué hacer. |
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
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

### P · Errores

#### Avisos de error (guardado, archivo, conexión)

`errores` · ⬜ Sin movimiento · lo trata la **F16**

| Campo | Valor |
|---|---|
| Ubicación | AvisoAccion y cada vista |
| Componente | — |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Decir qué ha fallado y qué hacer. |
| Estado inicial | — |
| Estado final | — |
| Entrada | La del aviso (aviso-entra) cuando es un aviso; ninguna cuando es una línea en la pantalla |
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
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

### Q · Éxito

#### El aviso de «añadido» (y los de Fitness)

`aviso_anadido` · ✅ Existe · lo trata la **F9**

| Campo | Valor |
|---|---|
| Ubicación | src/index.css |
| Componente | — |
| Clase CSS | `.aviso-entra` |
| @keyframes | `avisoEntra` |
| En ANIMACIONES_HC | `aviso` |
| Función | Confirmar una acción sin pararte. |
| Estado inicial | — |
| Estado final | — |
| Entrada | Sube y aparece |
| Salida | Ninguna |
| Interacción | — |
| Transición | — |
| Duración | 260 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Duración | 320 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 3 · Protagonista |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Duración | 300 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 2 · Suave |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Duración | 300 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 4 · Momento |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 4 · Momento |
| Prioridad | media |
| Relación | No estaba en ANIMACIONES_HC, así que el tope de la E3 F14 no la medía. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 5 · Firma |
| Prioridad | media |
| Relación | La única animación de nivel firma. Tampoco estaba en el catálogo. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

### R · Interruptores

#### El interruptor de `ui.jsx`

`interruptor_ui` · ⚠️ Inconsistente · lo trata la **F3**

| Campo | Valor |
|---|---|
| Ubicación | src/components/ui.jsx |
| Componente | Switch |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Encender o apagar algo. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | left y fondo 200 ms con la curva común |
| Duración | 200 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | Anima `left`, que obliga a recalcular el diseño, en vez de `transform`. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

#### Interruptores escritos a mano (Calendario, Relación, Ajustes, Gestión de temas)

`interruptores_a_mano` · ⚠️ Inconsistente · lo trata la **F3**

| Campo | Valor |
|---|---|
| Ubicación | CalendarView · RelationView · SettingsView (6) · GestionTemas |
| Componente | — |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Lo mismo que el Switch. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | — |
| Transición | `left 150ms` sin curva, o `transition-all` de Tailwind |
| Duración | 150 ms |
| Curva | por defecto |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | — |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

### T · Gestos

#### Deslizar para cambiar de ejercicio

`cambiar_ejercicio` · ✅ Existe · lo trata la **F8**

| Campo | Valor |
|---|---|
| Ubicación | src/views/EntrenamientoVivoView.jsx · src/index.css |
| Componente | — |
| Clase CSS | `.fit-miniatura` |
| @keyframes | — |
| En ANIMACIONES_HC | `fit_miniatura` |
| Función | Pasar al ejercicio siguiente en el entrenamiento en vivo. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | Deslizar en horizontal (umbral, `pan-y`) |
| Transición | width, padding y colores 200 ms |
| Duración | 200 ms |
| Curva | --ease-premium |
| Spring | — |
| Retraso | — |
| Escalonado | — |
| Intensidad | 1 · Micro |
| Prioridad | media |
| Relación | Sin seguir al dedo: el cambio ocurre al soltar. |
| Móvil | Igual |
| Escritorio | Igual |
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Interacción | Arrastrar: sigue al dedo (requestAnimationFrame) |
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
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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

`reordenar` · ⬜ Sin movimiento · lo trata la **F10**

| Campo | Valor |
|---|---|
| Ubicación | Pantalla principal, Imagen personal |
| Componente | — |
| Clase CSS | — |
| @keyframes | — |
| En ANIMACIONES_HC | — |
| Función | Mover algo de sitio. |
| Estado inicial | — |
| Estado final | — |
| Entrada | — |
| Salida | — |
| Interacción | Flechas: el arrastre sería un segundo mecanismo (EH F50) |
| Transición | Ninguna: salta a su sitio nuevo |
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
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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
| Movimiento reducido | Aparece directamente en su estado final: las dos reglas globales de index.css llevan su duración a 0,01 ms. |

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

