# CHANGELOG.md

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
