# MOTION_SYSTEM — cómo se mueve JosStyle

> **Para qué sirve.** Que quien añada una pantalla, una tarjeta o un botón sepa sin preguntar
> *"¿cómo debe moverse esto?"* (F0, apartado 18). Lo que dice aquí está escrito como datos en
> `src/lib/motionMapa.js` y lo comprueba `scripts/test-motion-f0.mjs`: si este documento y la librería
> dejan de decir lo mismo, la prueba se pone roja.
>
> **Estado: Motion System · Fase 0 de 20** (auditoría y plan). El motor llega en la F1. El índice de las
> 21 fases está en `docs/13_MOTION_SYSTEM_ORDEN.md`, y el mapa de cada elemento en `docs/MOTION_MAP.md`.

---

## 1 · La regla más importante: todo lo nuevo hereda motion

Es permanente (F0, apartado 19):

1. Todo lo nuevo —módulo, pantalla, tarjeta, botón, ventana, gráfica, interacción— se mira contra el
   **MOTION_MAP** antes de darlo por terminado.
2. Usa los tokens, la jerarquía y el contexto que ya existen: **ni una duración escrita a mano, ni una
   curva propia**.
3. Si necesita una animación que todavía no existe: se diseña, se añade al mapa y a `index.css`, se
   documenta y se reutiliza.
4. **Una animación que no está en el MOTION_MAP pone la suite roja** (`auditarMotion().sinMapa`), y la
   deuda medida en la F0 **no puede crecer** (`DEUDA_F0`).

## 2 · Lo que ya había, y no se tira

JosStyle ya tenía un lenguaje de movimiento aunque nadie lo llamara así, y la F0 lo respeta
(apartado 1: *"Respeta lo que ya funciona"*):

- **Una sola curva**, `--ease-premium` (`cubic-bezier(0.32, 0.72, 0, 1)`, Fase N2): una deceleración
  enfática, sin rebote. La usan las 35 reglas animadas de `index.css`.
- **Un catálogo de animaciones**, `ANIMACIONES_HC` (`src/lib/pulidoHC.js`, E3 F14 y FIT F37), con su
  duración comprobada contra el CSS. El MOTION_MAP **se apoya en él**: no hay un segundo catálogo.
- **Una escalera de escalas al pulsar** en `ui.jsx` (EH F50): 0,90 / 0,95 / 0,96–0,99 según el tamaño.
- **Dos reglas de movimiento reducido** en `index.css`: la del sistema (`prefers-reduced-motion`) y la
  de Ajustes (`data-reducir-movimiento`, `data-animaciones='desactivadas'`).

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
- **Escalonado**: 80 ms entre elementos como mucho, 6 elementos como mucho, 400 ms en total.
- **Duración**: 340 ms para lo normal, 420 ms para una transición, **700 ms** como tope absoluto de
  algo que no se repite (el de la E3 F14).
- **Spring**: solo cuando el dedo suelta algo con velocidad (una hoja, un deslizamiento). Nunca en una
  entrada que no ha tocado nadie.
- **Blur**: fijo, como material (la barra de abajo, una tarjeta de cristal, el velo de una hoja). Nunca
  animado, y nunca una franja que tape el fondo sin motivo.
- **Escala**: pulsar entre 0,90 y 0,99, entrar desde 0,97. Nunca por encima de 1,03.
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

## 6 · Los ajustes de movimiento

**Dónde se guardan:** `apariencia.animaciones` y `apariencia.reducirMovimiento`, dentro de `ajustes`
(Supabase), como el resto de Apariencia. **Ni localStorage ni una clave nueva** (apartado 15).

| Guardado | Hoy se llama | Será | Qué hará |
|---|---|---|---|
| `completa` | Completa | **Normal** | Todo el lenguaje del sistema. |
| `reducida` | Reducida | **Reducido** | Sin desplazamientos ni escalas: fundidos cortos que conservan orden y feedback. |
| `minima` | Mínima | **Mínimo** | Solo el feedback imprescindible, instantáneo o casi. |
| `desactivadas` | Desactivadas | **Sin movimiento** | Nada se mueve. |

🚨 **Hoy tres de los cuatro niveles no hacen nada** (hallazgo de la F0): solo «Desactivadas» cambia
algo, y la propia pantalla lo dice. **La F1 los hace reales.** Los ids guardados no se renombran.

«Premium» y «Ultra» (apartado 14) **no se ofrecen** salvo que la F1 demuestre una diferencia que se
note sin romper el presupuesto: un nivel por encima de un movimiento que ya está al tope sería un
control que no cambia nada visible (regla 8). Y si el iPhone tiene activado «Reducir movimiento», manda
sobre «Normal» y se comporta como **Reducido**, nunca como «Sin movimiento».

## 7 · La arquitectura (la decide la F0, la construye la F1)

- **Sin librería de animación.** Ni framer-motion ni ninguna otra: el movimiento ya vive en
  `index.css`, una librería sería un segundo sistema al lado, y el archivo de la aplicación ya pesa
  4,4 MB (C-42).
- **Tokens como variables CSS** en `:root`, con sus valores por nivel en `html[data-animaciones=…]`. Un
  solo punto que se cambia y llega a todo el CSS; JavaScript los lee del mismo sitio.
- **Lo que puede ser CSS, sigue siendo CSS**: entradas, pulsar, barras, cascadas. Así respeta los
  niveles y el movimiento reducido sin una línea de JavaScript.
- **Lo que el CSS no puede hacer va por la Web Animations API** (`element.animate`): salir antes de
  desmontarse, FLIP de una lista que cambia, seguir al dedo y soltar con su velocidad, una cifra que
  cuenta. Se interrumpe desde el estado visual actual y existe en Safari desde la 13.1. Cada animación
  JavaScript lee el nivel antes de empezar.

## 8 · Cómo se comprueba

- `auditarMotion({ css, vistas })` lee `index.css` y todas las vistas y componentes: cada regla animada
  tiene que estar en el MOTION_MAP, ningún `@keyframes` puede quedar huérfano, el mapa y
  `ANIMACIONES_HC` tienen que decir la misma duración, y la deuda (duraciones escritas a mano,
  `transition-all`, curvas de Tailwind, gráficas sin gobernar) no puede crecer.
- `docs/MOTION_MAP.md` se genera del mapa y la prueba lo compara con el archivo.
