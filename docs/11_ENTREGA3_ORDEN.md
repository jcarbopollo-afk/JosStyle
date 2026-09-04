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
| 6 | **HC** Hoy y Calendario | F1 — Hoy: centro del día | 1227 |
| 7 | HC | F2 — Calendario: agenda | 1824 |
| 8 | HC | F3 — Calendario: vista temporal | 2444 |
| 9 | HC | F4 — Acciones rápidas e integración | 3035 |
| 10 | HC | F5 — Planificación avanzada y vista semanal | 3874 |
| 11 | HC | F6 — Notificaciones y recordatorios reales | 4425 |
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

**Por dónde va:** 5 de 44 (**PG** v3.10.0, **RA+** v3.12.0, **AR+** v3.13.0, **EC** v3.15.0, **HO+** v3.17.0). La siguiente es la **6 — HC Hoy y Calendario · F1**, línea 1227.

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
