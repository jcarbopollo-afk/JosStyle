# docs/13_MOTION_SYSTEM_ORDEN.md — las 21 fases del Motion System

> **Qué es esto.** Josué pasó el 2026-10-04 un documento de **17 913 líneas** con **21 fases** (de la
> F0 a la F20) para construir *"el sistema de movimiento de Jos Style"*: no añadir animaciones, sino
> un lenguaje de movimiento propio, con tokens, jerarquía, accesibilidad y pruebas. La especificación
> literal está en `especificaciones/ORIGINAL_MOTION_SYSTEM.txt` 🔒 **intocable**.

## 🚨 LAS FASES VIENEN DESORDENADAS, Y ÉL LO AVISÓ

*"Están desordenadas, pero ordenadlas. Y volverás y ejecutarás todas y no pares hasta acabarlo."*

El archivo empieza por la **F16** (línea 1), sigue con la **F17, F18, F19 y F20**, y solo entonces
viene la **F0** (línea 4046) y de ahí la **F1 a la F15**. Esta tabla existe para eso: **se construye de
la F0 a la F20**, y aquí está dónde vive cada una.

⚠️ **No se reordena el archivo.** Es transcripción literal, como `ORIGINAL_ENTREGA4_FITNESS.txt`. Lo que
se ordena es **el trabajo**.

## El orden de construcción

| | Fase | Líneas | Tamaño |
|---|---|---|---|
| **F0** ✅ **v3.130.0** | Auditoría total, arquitectura y plan maestro | 4046–4899 | 854 |
| **F1** ✅ **v3.131.0** | Motor de movimiento + tokens + primitivas | 4900–5490 | 591 |
| **F2** ✅ **v3.132.0** | Navegación, transiciones y continuidad espacial | 6038–6770 | 733 |
| **F3** ✅ **v3.133.0** | Microinteracciones, componentes y feedback | 6771–7586 | 816 |
| **F4** ✅ **v3.134.0** | Datos dinámicos, listas, gráficas y estados | 7587–8404 | 818 |
| **F5** ✅ **v3.135.0** | Física, gestos, touch y comportamiento táctil | 8405–9145 | 741 |
| **F6** ✅ **v3.136.0** | Profundidad, capas, z-index y contexto visual | 9146–9922 | 777 |
| **F7** ✅ **v3.137.0** | Continuidad espacial, shared elements y transiciones entre vistas | 9923–10687 | 765 |
| **F8** ✅ **v3.138.0** | Física, springs, gestos e interacción directa | 10688–11379 | 692 |
| **F9** ✅ **v3.139.0** | Microinteracciones, estados y feedback de interfaz | 11380–12127 | 748 |
| **F10** ✅ **v3.140.0** | Layout motion, scroll, listas y contenido dinámico | 12128–12784 | 657 |
| **F11** ✅ **v3.141.0** | Orquestación global, coordinación y motion engine avanzado | 13290–14127 | 838 |
| **F12** ✅ **v3.142.0** | Accesibilidad, reduced motion, adaptive motion y calidad de experiencia | 14966–15717 | 752 |
| **F13** ✅ **v3.143.0** | Rendimiento extremo, GPU, frame budget y optimización | 15718–16452 | 735 |
| **F14** ✅ **v3.144.0** | Easings, curvas, ritmo, aceleración y lenguaje visual del movimiento | 16453–17154 | 702 |
| **F15** ✅ **v3.145.0** | Motion responsive, orientación, safe areas y multidispositivo | 17155–17913 | 759 |
| **F16** ✅ **v3.146.0** | Estados de sistema, loading, error, offline, sync y transiciones asíncronas | 1–759 | 759 |
| **F17** ✅ **v3.147.0** | Motion de datos, dashboard, métricas, gráficas y visualización | 760–1458 | 699 |
| **F18** ✅ **v3.148.0** | Motion visual polish, brand language y coherencia sensorial | 1459–2241 | 783 |
| **F19** | Testing extremo, validación, regresión y motion QA automatizado | 2242–3117 | 876 |
| **F20** | Finalización, consolidación, contratos y sellado | 3118–4045 | 928 |

🏁 **La F20 es la última**: su texto dice *"No generar una FASE 21 del Motion System"*.

## Lo que el documento trae repetido (C-51)

| Líneas | Qué es | Qué se hace |
|---|---|---|
| 5491–6037 | **Una primera versión de la F2**, cortada a media palabra (*"naveg"*) | Se construye la segunda (6038–6770), que está entera y dice lo mismo con más detalle. |
| 12785–13289 | **Una F11 distinta**: *"Navegación global, back, routing y transiciones de sistema"*, cortada en su apartado 41 (*"Si el proyecto"*) | La F11 que se construye es la de **orquestación**, que está entera y es a la que encadena la F10. Lo que pedía el borrador —back, routing, swipe-back, foco al navegar— lo cubren la **F2** y la pila de navegación de **NAVO F1**, y la F11 lo repasa al orquestar. |
| 14128–14965 | **La F11 de orquestación, copiada otra vez** | Idéntica línea por línea (comprobado con `diff`). Se ignora la copia. |

Y **cinco temas que se pisan entre fases** (navegación, microinteracciones, física, listas y datos,
lenguaje). Cómo se reparten está en `SOLAPES_ROADMAP` (`src/lib/motionMapa.js`) y en `docs/03`.

## Dónde vive el sistema

| Pieza | Dónde |
|---|---|
| El inventario, la jerarquía, el presupuesto, el plan y la auditoría | `src/lib/motionMapa.js` (F0) |
| El motor: tokens, modos, velocidad, intensidad, presets y primitivas | `src/lib/motion.js` (F1), con sus piezas de React en `src/components/motion.jsx` |
| El documento del sistema (las reglas, para cualquier pantalla nueva) | `docs/MOTION_SYSTEM.md` |
| El mapa elemento a elemento (**generado**, no se edita a mano) | `docs/MOTION_MAP.md` ← `scripts/generar-motion-map.mjs` |
| La prueba de la F0 | `scripts/test-motion-f0.mjs` |
| La prueba de la F1 | `scripts/test-motion-f1.mjs`, y la sección «MS F1» del recorrido de Chromium |
| La navegación: qué movimiento es cada cambio de la pila, el scroll por pantalla y el indicador | `src/lib/transicionNavegacion.js` (F2), y lo que pasa en la página en `src/components/navegacionMotion.js` |
| La prueba de la F2 | `scripts/test-motion-f2.mjs`, y la sección «MS F2» del recorrido de Chromium |
| Las microinteracciones: la auditoría de los componentes, el giro de un chevron, el latido de una marca y lo que no puede volver | `src/lib/microinteraccionesMotion.js` (F3) — ⚠️ **no** `microinteracciones.js`, que es de la EH F50 —, con `ChevronDespliegue` y `LatidoAlMarcar` en `src/components/motion.jsx` y `Switch`/`PistaInterruptor` en `ui.jsx` |
| La prueba de la F3 | `scripts/test-motion-f3.mjs`, y la sección «MS F3» del recorrido de Chromium |
| Los datos que cambian: las gráficas gobernadas, el plan de una cifra y su presupuesto | `src/lib/datosMotion.js` (F4), con `CifraQueCambia` y `useAnimacionDeGrafica` en `src/components/motion.jsx` |
| La prueba de la F4 | `scripts/test-motion-f4.mjs`, y la sección «MS F4» del recorrido de Chromium |
| Los gestos: los umbrales, el eje, la velocidad, la resistencia, cerrar o volver, y la auditoría de los gestos reales | `src/lib/umbralesGesto.js` (los números, una hoja del árbol de imports) y `src/lib/gestosMotion.js` (F5), con `AsaHoja` y `useDeslizarParaCambiar` en `src/components/gestosMotion.jsx` |
| La prueba de la F5 | `scripts/test-motion-f5.mjs`, y la sección «MS F5» del recorrido de Chromium |
| La profundidad: la jerarquía de capas, los niveles, las sombras, el velo, qué capa es cada ventana y cómo entra y sale | `src/lib/profundidad.js` (F6), con el vigilante de capas en `src/components/capasMotion.js` (`useCapasMotion`, montado en App.jsx) |
| La prueba de la F6 | `scripts/test-motion-f6.mjs`, y la sección «MS F6» del recorrido de Chromium |
| La continuidad: el mapa de transiciones, el registro de orígenes, la pantalla que crece desde su tarjeta, la llegada al volver y el elemento compartido | `src/lib/continuidad.js` (F7), con `Compartido`, `useContenedorDesdeOrigen`, `apuntarOrigen` y `animarLlegada` en `src/components/continuidad.jsx` |
| La prueba de la F7 | `scripts/test-motion-f7.mjs`, y la sección «MS F7» del recorrido de Chromium |
| La física: la jerarquía de muelles, la máquina de estados de un gesto, el velo que sigue al dedo, un solo dedo y los puntos hápticos | `src/lib/fisicaMotion.js` (F8), cableado en `AsaHoja` y `useDeslizarParaCambiar` (`src/components/gestosMotion.jsx`) y en el comparador de fotos |
| La prueba de la F8 | `scripts/test-motion-f8.mjs`, la sección «MS F8» del recorrido de Chromium y el divisor con dos dedos de la «FIT F27» |
| Los estados: el catálogo de estados de un componente, el botón que carga, el campo enfocado y con error, el aviso que sale y el barrido de lo que no puede volver | `src/lib/estadosInteraccion.js` (F9), con `TextoDeBoton`, `MensajeDeCampo` y el `estado` de `PrimaryButton` / `GhostBtn` en `src/components/ui.jsx` |
| La prueba de la F9 | `scripts/test-motion-f9.mjs`, y la sección «MS F9» del recorrido de Chromium |
| El diseño que cambia: el plan de una lista (qué entra, sale y se recoloca), su presupuesto, otro ancho, las fuentes y lo que no puede volver | `src/lib/layoutMotion.js` (F10), con `ListaAnimada`, `Plegable` y `useFuentesListas` en `src/components/layoutMotion.jsx` |
| La prueba de la F10 | `scripts/test-motion-f10.mjs`, y la sección «MS F10» del recorrido de Chromium |
| El orquestador: quién manda en cada movimiento, las prioridades, los conflictos, el dedo que toma el control, los grupos, la línea de tiempo, el estado global, la depuración y la auditoría de que todo pasa por él | `src/lib/orquestadorMotion.js` (F11), una hoja del árbol de imports que usan el motor (F1), la continuidad (F7), las capas (F6), los gestos (F5/F8), las listas (F10) y `useFlip` |
| La prueba de la F11 | `scripts/test-motion-f11.mjs`, y la sección «MS F11» del recorrido de Chromium |
| La accesibilidad del movimiento: la intensidad de una sola fuente, la política por área, los bucles, las celebraciones, los hápticos, el desplazamiento automático, el foco que no se pierde, el aviso de navegación y la matriz de QA | `src/lib/accesibilidadMotion.js` (F12), con `AnuncioDeNavegacion` y `GiroDeCarga` en `src/components/accesibilidadMotion.jsx` |
| La prueba de la F12 | `scripts/test-motion-f12.mjs`, y la sección «MS F12» del recorrido de Chromium |
| El rendimiento del movimiento: el presupuesto de un fotograma, el coste de cada propiedad, lo caro declarado, la auditoría, la calidad adaptativa y el monitor de fotogramas | `src/lib/rendimientoMotion.js` (F13), con la sombra que se funde en `index.css`, el fundido que lee antes de escribir (`fundidoBajoCabecera.js`) y los orígenes que caducan (`continuidad.js`) |
| La prueba de la F13 | `scripts/test-motion-f13.mjs`, y la sección «MS F13» del recorrido de Chromium (pintados, recálculos y memoria medidos) |
| El lenguaje del movimiento: la curva de cada papel, la escala por tallas, la velocidad que se ve, las parejas y lo equivalente, y la auditoría que lo lee del CSS | `src/lib/lenguajeMotion.js` (F14), aplicado en `index.css`, `PRESETS_MOTION`, el `MOTION_MAP` y `Plegable` |
| La prueba de la F14 | `scripts/test-motion-f14.mjs`, y la sección «MS F14» del recorrido de Chromium (las curvas de verdad, el Historial que abre y cierra, la pasada global) |
| El movimiento en cada contexto físico: los cortes de verdad (y el único de movimiento), las áreas seguras de los lados y del pie, asentar lo que viaja al girar o redimensionar, el teclado del iPhone, los bordes del sistema y la matriz de contextos | `src/lib/responsiveMotion.js` (F15), `useContextoFisico` (`src/components/responsiveMotion.js`), `asentarMovimiento` (orquestador), `reevaluarCapas` (`capasMotion.js`) y las clases de `index.css` |
| La prueba de la F15 | `scripts/test-motion-f15.mjs`, y la sección «MS F15» del recorrido de Chromium (la matriz, girar a mitad de una entrada, redimensionar a golpes, el teclado, el zoom al 200 %) |
| Los estados del sistema: lo que no se pudo cargar no se guarda, lo que no llega queda pendiente y se vuelve a mandar, los guardados de una clave en orden, el indicador de arriba, el arranque que tarda o no carga, la sesión que caduca, la última petición gana y el vacío que llega después del contenido | `src/lib/sincronizacion.js` y `src/lib/estadosAsincronos.js` (F16), `src/components/estadosAsincronos.jsx` (`IndicadorDeSincronizacion`, `ErrorDeArranque`, `useEspera`, `useTurnos`, `VacioQueLlega`), `src/components/vacioMotion.js` y `supabase.js` (`loadData`, `saveData`, `reintentarGuardados`) |
| La prueba de la F16 | `scripts/test-motion-f16.mjs`, y la sección «MS F16» del recorrido de Chromium (un guardado que falla y se reintenta, sin conexión, una carga que falla sin pisar la cuenta, ninguna carga, el arranque lento, el vacío que espera y la sesión que caduca) |
| El motor de datos mejorado y llevado a todas las cifras: la clase de cada cifra, la cuenta según cuánto cambia, interrumpida desde lo que se ve, los relevos agrupados, el valor final para el lector, las barras al mismo ritmo, el eje estable de las gráficas y el ranking que se filtra | `src/lib/datosMotion.js` (F4 + F17: `CLASES_DE_CIFRA`, `tallaDeCuenta`, `dominioEstable`, `MAPA_DATOS`, `auditarDatos`), `CifraQueCambia` (`src/components/motion.jsx`), `barra-progreso` (`index.css`) |
| La prueba de la F17 | `scripts/test-motion-f17.mjs`, y la sección «MS F17» del recorrido de Chromium (la cuenta interrumpida, el valor final, el ritmo de las barras y el eje de Sueño) |
| El sistema revisado como un todo y su lenguaje: la auditoría total, el inventario, los atípicos (el ✓ que latía al abrir, el icono que saltaba, las entradas que se quedaban puestas), la personalidad y la temperatura, el lenguaje familia por familia, la jerarquía, los tokens de reserva, los guardarraíles y la inspección | `src/lib/pulidoMotion.js` (F18), `IconoQueCambia` y `LatidoAlMarcar latido` (`src/components/motion.jsx`), `inspeccionar` (orquestador) y «Jos Style Motion Language» en `docs/MOTION_SYSTEM.md` |
| La prueba de la F18 | `scripts/test-motion-f18.mjs`, y la sección «MS F18» del recorrido de Chromium (el ✓ que no late al abrir y sí al marcar, play ↔ pausa, la barra de volver sin `transform` puesto y la inspección) |
