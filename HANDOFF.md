# HANDOFF.md — Sistema Operativo Personal de Josué

> **Propósito de este documento:** permitir que cualquier conversación nueva con Claude retome este proyecto exactamente donde se quedó, sin depender del historial del chat anterior. Contiene el 100% del contexto relevante, sin resumir ni omitir decisiones.

> **✅ ACTUALIZACIÓN (Fase 21, CERRADA — tercera pasada, cierra el Prompt Maestro completo):** se ha hecho el repaso visual/contraste que quedaba pendiente — la última pieza de la Fase 21 y, con ella, del Prompt Maestro de las 21 fases (sección 0). Se ha leído el JSX de las 20 vistas (`src/views/*.jsx`) comparándolas contra el patrón de `components/ui.jsx`, más una batería de `grep` dirigidos (todas las clases `text-*` usadas en cada vista, iconos junto a cabeceras `text-sm font-semibold`, texto `COLORS.textMuted` sobre fondo de acento). Resultado limpio salvo dos inconsistencias menores, corregidas: `SettingsView.jsx` duplicaba a mano el marcado de `SectionTitle` en vez de usar el componente (ahora sí lo usa, igual que las otras 17 vistas); `TrainingView.jsx` tenía un icono `Trophy` a `size={15}` en vez del `size={16}` que usa el resto de cabeceras de `Card` en toda la app. Ningún color fuera de `COLORS`/`accent`, ninguna clase de texto fuera de la escala establecida, ningún caso de bajo contraste. **Límite honesto:** sigue siendo una revisión de código (clases Tailwind, colores, componentes compartidos), no la app renderizada de verdad — Claude no puede ejecutarla en este entorno; cosas que solo se ven en pantalla real (saltos de línea en un móvil concreto, un `grid-cols-2` desalineándose con contenido real muy largo) quedan fuera de lo que este repaso puede detectar. `package.json` → **v1.0.0**. **A partir de aquí, cualquier trabajo que Josué pida es alcance nuevo, no una fase pendiente del Prompt Maestro** — ver sección 16 actualizada.
>
> **✅ ACTUALIZACIÓN (Fase 21, en curso — segunda pasada):** siguiendo con la Fase 21, este turno se ha revisado de verdad el código de `src/lib/exportData.js` y `src/lib/supabase.js` (sin errores encontrados; se verificó explícitamente que `personalizacion.modo`, añadido en la Fase 20, no rompe nada si `loadData` devuelve un registro guardado antes de esa fase — `loadData` no fusiona con el valor por defecto, pero todo el código que usa `modo` ya lo trata igual que `null`, así que no hace falta migración), y se ha repasado el tono de los **13** `AIPanel` reales de la app (no 17+ como decía este documento — cifra corregida) uno por uno: tono consistente, factual, "aconseja no decide", cita datos concretos, admite cuando hay pocos datos; `HealthView`/`NutritionView` evitan objetivos calóricos/de peso estrictos; ambos `AIPanel` de `FaithView` incluyen `AVISO_DOCTRINAL`. No hizo falta tocar ningún `buildPrompt()`. **Sigue pendiente, y es lo único que queda para cerrar la Fase 21 (y con ella el Prompt Maestro completo)**: el repaso visual/contraste real, módulo por módulo, pantalla a pantalla — todo lo hecho hasta ahora en Fase 21 ha sido a nivel de código (grep + lectura), nunca mirando la app renderizada, porque Claude no puede ejecutarla en este entorno. La siguiente IA debería continuar por ahí — ver sección 16.
>
> **✅ ACTUALIZACIÓN (Fase 21, arrancada — primera pasada):** siguiendo el mismo criterio de "avanzar todo lo posible sin esperar a terminar del todo", tras cerrar la Fase 20 (ver más abajo) se ha empezado la **Fase 21 (Pulido final y QA)**, última del Prompt Maestro. Esta primera pasada es deliberadamente pequeña: una auditoría por `grep` de colores hexadecimales sueltos fuera de `src/tokens.js` en todo `src/`, para confirmar que ningún módulo (incluidos los nuevos de la Fase 20) usa color fuera del sistema de tokens. Resultado: limpio — los pocos hallazgos (`#080A0D` como color de texto sobre fondo de acento, `#C9A24B` como color de aviso/riesgo medio) son un patrón repetido a propósito desde fases anteriores, no un defecto, y no se han tocado.
>
> **✅ ACTUALIZACIÓN (Fase 20, completa):** se ha terminado la **Fase 20 (Funciones transversales avanzadas)**, que en el turno anterior se había dejado a medias por presión de tiempo (solo tenía `AvisoSuenoCorto`). Esta vez se han construido las tres piezas que faltaban: **(1) Dos automatizaciones fijas más** en `DashboardView.jsx` — `AvisoRachaEnRiesgo` (un hábito con racha de 3+ días que no está marcado ni hoy ni ayer: un tercer día sin marcar la rompería, según la lógica ya existente de `ProductivityView.jsx`) y `AvisoExamenSinHoras` (examen dentro de los próximos 3 días sin ninguna hora de estudio registrada esa semana para su asignatura); ambas calculadas al vuelo, mismo patrón exacto que `AvisoSuenoCorto`, sin ningún dato nuevo que guardar. **(2) Centro de logros y mapa de vida:** nuevo motor `src/lib/logros.js` (solo lectura, mismo espíritu que `predicciones.js`/`correlaciones.js`) con 12 insignias binarias sin puntos/niveles/monedas, calculadas sobre datos ya existentes de 10 módulos distintos; nueva vista `AchievementsView.jsx` con dos subpestañas — "Logros" (las insignias) y "Mapa de vida" (los Objetivos ya existentes, de 30 días a 10 años, mostrados como línea de tiempo cronológica en vez de la lista agrupada de `ObjectivesView.jsx` — mismos datos, otra forma de verlos); añadida a `MORE_NAV` como "Logros" (icono `Trophy`). Sin datos propios, sin exportación (mismo criterio que Estadísticas/Predicciones). **(3) Modos "viaje/vacaciones/exámenes":** plantillas ligeras, no un motor configurable — `MODOS_APP` en `tokens.js` (3 modos, cada uno con 2-3 recordatorios de texto fijo), nueva sección en `PersonalizationView.jsx` con 3 chips (tocar el activo lo desactiva), y `ModoBanner` en `DashboardView.jsx` que muestra los recordatorios del modo activo. Nueva clave `personalizacion.modo` (guardada directa, como el resto de Personalización — Fase 19 — sin pasar por `snapshotAndSave`/deshacer). Sin dependencias npm nuevas. **package.json → v0.21.0.** **Ninguna fase de la 8 a la 21 está confirmada en ejecución real todavía.**
>
> **✅ ACTUALIZACIÓN (Fase 19):** se ha construido la **Fase 19 (Personalización total)**. Nuevo objeto `personalizacion` (guardado directo, como `ajustes`, sin pasar por `snapshotAndSave`) con: orden custom de las secciones de "Más" (flechas arriba/abajo), ocultar/mostrar cualquier sección (ocultar pide confirmación inline, mostrar de nuevo no), icono alternativo por sección (8 iconos a elegir o volver al original), proteger con el mismo PIN cualquier sección además de Relación (que sigue siempre protegida sin poder quitársela), y hasta 4 métricas favoritas en el panel "Hoy" (peso, hucha, mejor racha de hábito, objetivo más próximo, ánimo medio 7 días, sesiones de concentración de la semana — calculadas en `App.jsx`, reutilizando `prediccionObjetivo()` de la Fase 17 para la del objetivo). Nueva vista `PersonalizationView.jsx`, mostrada dentro de la pantalla Ajustes. **Los 4 accesos rápidos de la barra inferior y "Ajustes" mismo quedan fuera de la personalización a propósito** — evita que Josué se quede sin forma de deshacer un cambio. Sin dependencias npm nuevas. **Ninguna fase de la 8 a la 19 está confirmada en ejecución real todavía.**
>
> **✅ ACTUALIZACIÓN (Fase 18):** se ha construido la **Fase 18 (IA con memoria a fondo)**, fase transversal — no crea ningún módulo ni clave `app_data` nueva, toca `AIPanel` (`ui.jsx`), `App.jsx` y añade `fileToBase64` a `helpers.js`. Tres piezas, tal como pedía el Prompt Maestro: **(1) Multimodalidad en `AIPanel`:** ahora cualquier botón de IA de cualquier sección (los 15+ ya existentes, sin tocar ni una sola vista) puede adjuntar una foto/captura o un PDF antes de preguntar — icono de clip junto al botón de la pregunta. Una imagen usa `askAIWithImage` (mismo mecanismo que el escaneo de comida de Nutrición, Fase 4); un PDF extrae su texto en el navegador con `extractPdfText` (mismo lector que Biblioteca, Fase 11) y se añade como contexto extra al prompt normal, sin mandar el PDF entero. Si el PDF no tiene texto extraíble, se avisa a la IA en el propio prompt en vez de fallar. **(2) Buscador universal en lenguaje natural:** icono fijo arriba a la derecha que abre un modal con una pregunta libre; usa como contexto el mismo `currentState` ya auditado para la exportación CSV/Excel (sin `relacion`, el único módulo protegido de principio a fin) — la IA responde solo con lo que encuentre en esos datos y lo dice abiertamente si no puede. **(3) Panel de sugerencias fijo arriba a la izquierda:** icono con un `Lightbulb` que abre un panel pequeño; nunca se dispara solo — hace falta tocar "Generar sugerencias" la primera vez, mismo criterio que toda la IA de la app. Da como máximo 2 sugerencias breves sobre un resumen reciente de sueño, calistenia, fútbol, economía, salud, nutrición, estudios, productividad, objetivos, Fe y Bienestar (sin `relacion`). Tono de `AI_SYSTEM` sin cambios — ya estaba "a medio camino entre prudente y directo" desde una fase anterior. Sin dependencias npm nuevas. **Ninguna fase de la 8 a la 18 está confirmada en ejecución real todavía.**
>
> **✅ ACTUALIZACIÓN (Fase 17):** se ha construido la **Fase 17 (Predicciones)**. Nuevo motor `src/lib/predicciones.js` (solo lectura, mismo espíritu honesto que `correlaciones.js`) con 6 funciones: `prediccionObjetivo` (tiempo restante hasta el plazo elegido), `prediccionAbandonoHabito` (riesgo bajo/medio/alto según constancia reciente), `prediccionPeso` (regresión lineal simple sobre las medidas de Salud), `prediccionFuerza` (constancia de sesiones, no una cifra numérica inventada — los PRs son texto libre), `prediccionAhorro` (neto mensual medio proyectado a 3 meses) y `prediccionNotas` (media de los últimos 3 exámenes y su tendencia). Nueva vista `PredictionsView.jsx`, mismo patrón visual que `StatsView.jsx` (Fase 16), añadida a `MORE_NAV` justo después de Estadísticas (icono `TrendingUp`). Sin datos propios, sin exportación a CSV/Excel (mismo criterio que Estadísticas), sin dependencias npm nuevas. **Ninguna fase de la 8 a la 17 está confirmada en ejecución real todavía.**
>
> **✅ ACTUALIZACIÓN (Fase 16):** se ha construido la **Fase 16 (Estadísticas y correlaciones)**. Nueva vista `StatsView.jsx` (solo lectura, sin datos propios) que reúne en un mismo sitio la correlación sueño↔estudio ya existente desde la Fase 6, más dos nuevas en `src/lib/correlaciones.js`: **sueño↔ánimo del Diario** y **entreno de calistenia↔ánimo del Diario** (fechas de sesión sacadas de las 7 habilidades y unificadas en un solo conjunto, sin duplicar si se entrena más de una el mismo día). Las tres siguen el mismo patrón ya establecido: exigen un mínimo de días en cada grupo antes de mostrar nada (2 para las de sueño, 3 para la de entreno, por comparar contra un grupo más heterogéneo), y cuando no hay datos suficientes lo dicen abiertamente en vez de forzar una lectura. Añadida a `MORE_NAV` (icono `BarChart3`). Sin dependencias npm nuevas, sin cambios en el esquema de Supabase ni en la exportación (no hay datos propios que exportar, son cálculos sobre datos ya existentes).
>
> **✅ ACTUALIZACIÓN (Fase 15):** se ha construido la **Fase 15 (Bienestar digital)**. Nueva vista `WellbeingView.jsx` con 4 subpestañas: Resumen (tres índices — productividad/distracción/equilibrio — calculados como % de minutos por categoría en los últimos 7 días, a partir solo de lo que Josué registra a mano), Tiempo de uso (alta manual: categoría, app/actividad opcional, minutos, fecha), Concentración (temporizador simulado reutilizando el patrón del Pomodoro de Productividad, duración elegible entre 10-60 min) y Reflexión (pantalla que Josué abre él mismo, nunca automática, con 3 preguntas guía y una entrada de texto libre). **Deja explícito en la UI que la app no puede interceptar el uso real de Instagram/TikTok** — los índices son un reflejo del propio registro, no una medición del dispositivo. Recompensas deliberadamente discretas (un mensaje breve al completar una sesión de concentración) — sin puntos, niveles ni rachas nuevas, por petición explícita del Prompt Maestro de "no sobregamificar". Sin PIN, sin archivos, incluido en la exportación CSV/Excel — mismo criterio que Fe. Sin dependencias npm nuevas. **Ninguna fase de la 8 a la 15 está confirmada en ejecución real todavía.**
>
> **✅ ACTUALIZACIÓN (Fase 13):** se ha construido la **Fase 13 (Recordatorios románticos)** como subpestaña de `RelationView.jsx` ("Días especiales" junto a "Fechas" ya existente), reutilizando el mismo `PinGate` y el mismo array `relacion.fechas` — no hizo falta ninguna clave de datos nueva. Lista de 11 nombres de días del Prompt Maestro (Aniversario, Cumpleaños, Día de la Novia, Día del Peluche, etc.) como chips; tocar uno abre el formulario para que Josué escriba la fecha a mano — nada se autogenera. El recordatorio del Dashboard y las cuentas atrás (`diasHasta`/`proximaOcurrencia`, ya existentes desde la Fase 12) recurren solas cada año una vez la fecha está guardada — eso es cálculo de visualización, no generación automática de entradas nuevas, así que no contradice la petición de Josué. Sin dependencias npm nuevas, sin cambios en `App.jsx` ni en el esquema de Supabase.
>
> **✅ ACTUALIZACIÓN (Fase 12):** se ha construido la **Fase 12 (Relación, privado)** sobre el código de la Fase 11. Nombre de la pareja + lista de fechas importantes (etiqueta + fecha), entrada manual, módulo entero protegido por el `PinGate` ya existente (mismo componente que la pestaña Fotos de Salud). Nuevo: recordatorio discreto en el Dashboard ("Hoy") con la próxima fecha importante y su cuenta atrás, visible sin pedir el PIN de nuevo — el detalle completo (nombre, lista entera, alta/baja) sigue detrás del PIN en la pestaña Relación. Sin archivos ni IA en esta fase, por no estar pedidos en el Prompt Maestro. **Ni la Fase 8, ni la 9, ni la 10, ni la 11, ni esta Fase 12 están confirmadas en ejecución real todavía.** Sin dependencias npm nuevas esta fase.
>
> **Dato práctico para la siguiente IA:** Josué no tiene ordenador — trabaja desde el iPhone usando **Replit** (sección 12). Ahí sigue atascado en un problema **de despliegue, no de código**: `npm run dev` arranca bien, pero exponer el puerto al navegador (Preview/Webview de Replit) no le ha funcionado todavía. Es un tema pendiente y aparte de este HANDOFF, no bloquea seguir construyendo. **Rota entre varias cuentas gratuitas de Claude**, pasando este mismo `HANDOFF.md` + zip de una conversación a otra — puede que ya haya resuelto en otra conversación algo que aquí parece pendiente; si el contexto del chat ya lo resuelve, no lo vuelvas a preguntar. **Su plan explícito es encadenar fases sin parar a esperar confirmación de cada una**, dejando el pulido para el final (Fase 21) — no añadir alcance no pedido; para eso está ahora el Prompt Maestro completo en la sección 0, así que el alcance exacto de cada fase futura ya no debería hacer falta preguntarlo. **Claude nunca ejecuta la app de verdad**, solo escribe y comprueba el código. **Lo que más le importa en cada turno es recibir el zip actualizado cuanto antes** — priorizarlo sobre explicaciones largas, y no dejar un turno a medias sin entregar el zip.

---

## 0. Prompt Maestro completo (fases 1-21)

Josué pegó este texto tal cual en el chat de la Fase 11 — es el reparto completo de las 21 fases que él mismo definió. **Se mantiene aquí siempre, íntegro y sin resumir, para que ninguna IA futura tenga que pedirlo otra vez.** Si Josué lo actualiza o lo amplía en algún momento, reemplázalo aquí entero, no lo parchees a trozos.

> Fase 1 ya la veo resuelta en la captura (Dashboard, Sueño, Entrenamiento, Economía, con el modo oscuro y la paleta azul metálica con selector de acento). Con eso como base y todo lo que pedías en el prompt maestro, así repartiría el resto — priorizando calidad y dejando cada fase como un bloque que se pueda construir y revisar entero antes de pasar a la siguiente:
>
> **Fase 2 — Backend real (si aún no está conectado):** Supabase de verdad: login con email/contraseña, base de datos y sincronización entre dispositivos. Migrar Dashboard/Sueño/Entrenamiento/Economía de datos locales a Supabase. Copias de seguridad, exportación (PDF/Excel/CSV), historial de cambios y deshacer. Dejar preparado el mecanismo de PIN para las secciones privadas que vendrán después.
>
> **Fase 3 — Salud:** Peso, altura, grasa corporal, fotos de progreso (con PIN), medidas, tensión, lesiones, medicamentos, síntomas. IMC/BMR/TDEE/macros siempre como orientativos. Recordatorios para completar el historial médico. Pestaña separada de Sueño y Nutrición.
>
> **Fase 4 — Nutrición / Alimentación:** Comidas, calorías, macros, agua. Escaneo por código de barras (dato exacto) y por foto (ingrediente suelto o plato completo). Recetas y favoritos. IA centrada en hábitos, no en cifras estrictas.
>
> **Fase 5 — Calistenia a fondo + Fútbol:** Progresiones editables (IA, manual o mixto) para Handstand, Front Lever, Back Lever, Planche, Human Flag, Muscle Up, L-Sit. Subida de vídeo y análisis de técnica por fotogramas. Comparación mes a mes. Avisos de sobreentrenamiento. Fútbol: registro ligero de partidos puntuales.
>
> **Fase 6 — Estudios:** Asignaturas configurables por curso, con objetivo de nota por examen. Pestañas separadas Bachillerato/Música. Calendario de exámenes y horas estudiadas. La IA propone un plan de repaso por fecha límite, pero decides y ejecutas tú. Primera correlación activa: sueño ↔ estudio.
>
> **Fase 7 — Negocio:** Registro manual y básico: ideas, clientes, proyectos, ingresos, gastos, tareas. Poco diseño, no es prioritario.
>
> **Fase 8 — Productividad:** Hábitos, rutinas, checklists, Pomodoro, calendario. Rachas que se "pausan" en vez de romperse a cero por fallar un día.
>
> **Fase 9 — Objetivos:** 30 días / 90 días / 1 / 5 / 10 años. La IA valora si vas por buen camino y te recuerda de vez en cuando revisar los de largo plazo.
>
> **Fase 10 — Diario:** Cómo te sientes, qué aprendiste, qué mejorarás. Detección de patrones emocionales por IA. Sin privacidad extra.
>
> **Fase 11 — Biblioteca:** PDFs, vídeos, fotos, apuntes, enlaces. Búsqueda dentro del contenido de los PDFs (clave para el instituto).
>
> **Fase 12 — Relación (privado):** Nombre, fechas importantes, recordatorio en pantalla principal. Módulo protegido por el PIN. Entrada manual.
>
> **Fase 13 — Recordatorios románticos:** Lista de "días" activables (Aniversario, Día de la Novia, Día del Peluche, etc.) más recordatorios personalizados. Se crean a mano.
>
> **Fase 14 — Fe y vida espiritual:** Mi servicio, calendario, diario espiritual, objetivos. La IA nunca da autoridad doctrinal — siempre recomienda acudir a tu comunidad ante dudas profundas.
>
> **Fase 15 — Bienestar digital:** Registro manual/importado del Tiempo de Uso. Dashboard con índices de productividad, distracción y equilibrio. Pantalla de reflexión como algo que abres tú dentro de la app (no puede interceptar Instagram/TikTok de verdad). Modos de concentración simulados dentro de la propia app. Recompensas discretas, sin sobregamificar.
>
> **Fase 16 — Estadísticas y correlaciones:** Conecta los datos de todos los módulos ya construidos. Amplía de 3-4 correlaciones validadas hacia el resto, mostrando siempre en qué datos se basa cada afirmación.
>
> **Fase 17 — Predicciones:** Tiempo estimado para un objetivo, probabilidad de abandonar un hábito, predicción de peso, fuerza, ahorro y notas — apoyada en la Fase 16.
>
> **Fase 18 — IA con memoria a fondo:** Afina el botón de IA de cada sección, tono a medio camino entre prudente y directo. Multimodalidad (fotos, PDFs, capturas). Buscador universal en lenguaje natural. Panel de sugerencias fijo arriba a la izquierda.
>
> **Fase 19 — Personalización total:** Crear/eliminar apartados, mover módulos, cambiar iconos y gráficos. Poder ocultar cualquier módulo detrás del mismo PIN. Confirmación extra solo al borrar un módulo entero. Panel "Hoy" y métricas favoritas.
>
> **Fase 20 — Funciones transversales avanzadas:** Centro de logros y mapa de vida. Revisión automática semanal/mensual/anual. Sistema de puntuación diaria (ese punto intermedio entre informativo y juego). Motor de automatizaciones empezando por 2-3 fijas. Plantillas y modos "viaje/vacaciones/exámenes".
>
> **Fase 21 — Pulido final y QA:** Repaso de coherencia visual y contraste en todos los módulos ya construidos. Pruebas de exportación, offline y sincronización de extremo a extremo. Revisión del tono de la IA en cada sección.
>
> Para más adelante, no ahora: editor visual de automatizaciones, API externa, chat único con acceso a todos los módulos a la vez.

---

## 1. Objetivo completo del proyecto

Construir una **Progressive Web App (PWA)** personal — un "sistema operativo personal" — para Josué, un usuario de 16 años, que centralice y analice con IA todos los ámbitos de su vida: salud, sueño, nutrición, calistenia, fútbol informal, estudios (Bachillerato de Ciencias + música), negocio personal, economía, productividad, objetivos a largo plazo, diario personal, **biblioteca de materiales**, relación de pareja (módulo privado), bienestar digital, y vida espiritual/fe.

No es una app de hábitos genérica. Es una plataforma modular, escalable a años vista, diseñada para que cada dato introducido alimente un sistema de análisis de IA (correlaciones, predicciones, patrones) — la IA analiza y sugiere, pero **nunca decide por el usuario**.

El proyecto se construye en **21 fases secuenciales** (ver sección 10 y el Prompt Maestro completo en la sección 0), completando cada una a fondo antes de pasar a la siguiente. **Excepción vigente:** Josué ha pedido encadenar sin esperar confirmación real de cada fase antes de construir la siguiente — sigue sin construirse más de una fase a la vez, pero ya no se espera turno completo de verificación entre una y otra si él no la da.

---

## 2. Filosofía y visión del proyecto

1. **Los datos se introducen para ser analizados, no solo almacenados.**
2. **La IA es complementaria, nunca decisoria.**
3. **Simplicidad y elegancia por encima de acumular funciones.**
4. **Arquitectura modular y escalable desde el modelo de datos.**
5. **Nivel de diseño premium** (Cal AI / Symmetry / Apple). Solo modo oscuro; modo claro sigue pendiente.
6. **Las rachas de hábitos se pausan, no se rompen** (Fase 8). **Los objetivos son fijos pero es normal y sano que evolucionen con el tiempo a los 16 años** (Fase 9). **La biblioteca es material de referencia, no otro sistema de "tareas"** (Fase 11) — no se le añaden estados de progreso ni recordatorios, solo guardar y buscar.

---

## 3. Arquitectura actual (Fase 21, CERRADA — Prompt Maestro completo, v1.0.0)

- **Tipo de aplicación:** proyecto real Vite + React con estructura de carpetas (sección 5).
- **Routing:** `PRIMARY_NAV` (Hoy, Sueño, Entreno, Nutrición, fijo, no personalizable) + hoja "Más" (`MORE_NAV`: Salud, Estudios, Negocio, Productividad, Objetivos, Diario, Fe, Biblioteca, Relación, Bienestar, Estadísticas, Predicciones, **Logros (Fase 20)**, Economía — reordenable/ocultable/con icono propio — y Ajustes, fijo al final, no personalizable).
- **`src/views/DashboardView.jsx` (Fase 20):** además de `AvisoSuenoCorto`, ahora también `AvisoRachaEnRiesgo` (Productividad) y `AvisoExamenSinHoras` (Estudios) — mismo patrón calculado al vuelo — y `ModoBanner` (recordatorios del modo "viaje/vacaciones/exámenes" activo, si hay alguno). Recibe `productividad`, `estudios` y `modo` como props nuevas.
- **`src/lib/logros.js` + `src/views/AchievementsView.jsx` (Fase 20):** Centro de logros (12 insignias, solo lectura) y Mapa de vida (línea de tiempo de Objetivos), sin datos propios — ver actualización de arriba.
- **`personalizacion.modo` (Fase 20):** modo "viaje/vacaciones/exámenes" activo (o `null`), guardado directo como el resto de `personalizacion` (Fase 19). Chips en `PersonalizationView.jsx`; `onSetModo` en `App.jsx` hace toggle (tocar el modo activo lo desactiva).
- **Backend real:** Supabase, sin cambios de fondo. Nueva clave `app_data`: `personalizacion` (`{ orden, ocultos, iconos, pinExtra, favoritas }`, guardada directa como `ajustes`, sin pasar por `snapshotAndSave`/deshacer).
- **`src/App.jsx` — resolución de `MORE_NAV` personalizado:** `moreNavPersonalizables` (MORE_NAV sin Ajustes) → `ordenIds` (orden guardado + cualquier módulo nuevo no reordenado aún, al final) → `moreNavOrdenadoConIconos` (con el icono alternativo aplicado) → `moreNavVisible` (quitando los ocultos, + Ajustes siempre al final). El sheet "Más" usa `moreNavVisible`; `PersonalizationView` usa `moreNavOrdenadoConIconos` (incluye los ocultos, para poder volver a mostrarlos).
- **`src/App.jsx` — PIN generalizado (Fase 19):** `renderContent()` es el antiguo `renderTab()` sin el `PinGate` inline de Relación; el nuevo `renderTab()` envuelve el resultado en `PinGate` si `tab === 'relacion'` (siempre) o si `personalizacion.pinExtra` incluye la pestaña activa.
- **`src/App.jsx` — métricas favoritas (Fase 19):** `calcularMetricas()` computa las 6 posibles a partir de `salud`/`economia`/`productividad`/`objetivos` (reutilizando `prediccionObjetivo()` de la Fase 17)/`diario`/`bienestar`; `favoritasResueltas` filtra por `personalizacion.favoritas` y se pasa a `DashboardView`.
- **`src/views/PersonalizationView.jsx`:** reordenar/ocultar/cambiar icono/proteger con PIN por sección, y elegir hasta 4 métricas favoritas — mostrada dentro de la pantalla Ajustes (`case 'ajustes'` en `App.jsx` renderiza `SettingsView` + `PersonalizationView` apiladas).
- **Verificación de build:** `esbuild` (bundle completo, dependencias npm externas) antes de entregar, sin cambios de proceso respecto a fases anteriores.

---

## 4. Tecnologías utilizadas

Sin dependencias npm nuevas desde la Fase 13 (tampoco en la 18, 19, 20 ni en esta 21). Nuevos iconos de `lucide-react` en la Fase 19: `ChevronUp`, `ChevronDown` (reorden), `Eye`, `EyeOff` (ocultar/mostrar), `Lock`, `Unlock` (PIN extra), `Palette` (cabecera), `Star`, `Zap`, `Flame`, `Sparkles`, `Compass`, `Gem`, `Anchor`, `Feather` (catálogo de iconos alternativos). Nuevos en la Fase 20: `Trophy`, `Award`, `Map` (Logros/Mapa de vida), `Plane` (modos), `GraduationCap` reutilizado (ya existía para el nav de Estudios) en el nuevo aviso de exámenes.

---

## 5. Estructura de carpetas (real, ampliada en la Fase 20)

```
sistema-personal-app/
├── package.json (v0.21.0), vite.config.js, tailwind.config.js, postcss.config.js
├── index.html
├── .env.example, .env (con credenciales reales de Josué)
├── SETUP.md, CHANGELOG.md
├── api/ask-ai.js                (sin cambios esta fase)
├── supabase/schema.sql          (sin cambios esta fase — logros/modo no usan Storage ni tabla propia)
├── public/manifest.json         (faltan los iconos, ver TODOs)
└── src/
    ├── main.jsx, App.jsx        (+ case 'logros', setModoApp, MORE_NAV con "Logros" — Fase 20)
    ├── index.css
    ├── tokens.js                    (+ MODOS_APP, DEFAULT_PERSONALIZACION.modo — Fase 20)
    ├── lib/
    │   ├── logros.js              (nuevo — Fase 20, calcularLogros(), solo lectura)
    │   ├── predicciones.js       (sin cambios de código — reutilizada por App.jsx para "objetivo más próximo")
    │   └── (resto sin cambios en esta fase)
    ├── components/
    │   ├── ui.jsx                 (sin cambios en esta fase)
    │   ├── Auth.jsx, BarcodeScanner.jsx
    └── views/
        ├── DashboardView.jsx     (+ AvisoRachaEnRiesgo, AvisoExamenSinHoras, ModoBanner — Fase 20)
        ├── SleepView.jsx, FinanceView.jsx, SettingsView.jsx (sin cambios)
        ├── HealthView.jsx, NutritionView.jsx, TrainingView.jsx, EstudiosView.jsx
        ├── BusinessView.jsx, ProductivityView.jsx, ObjectivesView.jsx, DiaryView.jsx
        ├── LibraryView.jsx, RelationView.jsx, FaithView.jsx, WellbeingView.jsx
        ├── StatsView.jsx, PredictionsView.jsx
        ├── AchievementsView.jsx     (nuevo — Fase 20, Logros + Mapa de vida)
        └── PersonalizationView.jsx  (+ ModoAppSection, Fase 20 — sección de modos, además de lo ya construido en la Fase 19)
```

---

## 6. Convenciones de código y estilo

- Tokens de color centralizados en `src/tokens.js` — sin colores sueltos.
- `ObjectivesView.jsx` y `LibraryView.jsx` en inglés/mixto de nombre de archivo pero JSX en español, como la mayoría de vistas (la excepción sigue siendo solo `EstudiosView` como nombre "castellanizado").
- Patrón de "dato de seguimiento fuera del snapshot" (pomodoros, `ultimaRevision`, y ahora `bibliotecaArchivos` entero): cualquier dato que implique un archivo real en Storage, o que no tenga sentido "deshacer", se guarda directo con `saveData`, no pasa por `snapshotAndSave`.
- **Patrón nuevo (Fase 11): un módulo puede tener una parte con deshacer y otra sin él a la vez.** `biblioteca` (apuntes/enlaces, texto puro) vive en el snapshot; `bibliotecaArchivos` (pdf/vídeo/foto) vive fuera, como estado aparte en `App.jsx`, igual que ya pasaba entre `salud` y `saludFotos`, o entre `calistenia` y `calisteniaVideos`. Si una fase futura vuelve a mezclar texto y archivos en el mismo módulo, seguir este mismo split.
- Patrón de subida de archivo a Storage (Fase 3/5/11): `uploadX(userId, file)` → devuelve `path`; `getSignedXUrl(path)` → URL firmada de 1h; `deleteX(path)`. Reutilizar este trío exacto para cualquier fase futura que necesite subir archivos (ej. fotos de la Relación en Fase 12, si se decide guardar alguna).
- `Textarea` (`ui.jsx`, Fase 10): usar este componente, no un `<textarea>` suelto, en cualquier fase futura que necesite texto largo (ej. Fe, Relación).
- Patrón de búsqueda con fragmento de contexto (`snippet()` en `LibraryView.jsx`): si una fase futura necesita buscar dentro de texto largo, reutilizar esta misma idea (buscar el índice de la coincidencia y recortar alrededor) en vez de mostrar el texto completo.
- **Patrón nuevo (Fase 12): un módulo entero detrás de `PinGate`, no solo una pestaña.** Hasta ahora `PinGate` envolvía una sub-pestaña dentro de una vista (Fotos dentro de Salud). Con Relación, `PinGate` envuelve el `case` completo del módulo directamente en `App.jsx` (`renderTab`), antes de renderizar la vista entera. Reutilizar este mismo patrón para cualquier fase futura donde el módulo completo (no solo una parte) deba quedar protegido — ej. Fe si en algún momento lo pide, aunque el Prompt Maestro no lo indica hoy.
- **Patrón nuevo (Fase 12): recordatorio "resumen" fuera del PinGate, detalle completo dentro.** `diasHasta()`/`proximaOcurrencia()` en `helpers.js` alimentan tanto la lista completa en `RelationView` (protegida) como la tarjeta resumen del Dashboard (sin proteger) — mismos datos, distinto nivel de detalle según dónde se muestren. Reutilizar esta idea si una fase futura necesita mostrar un adelanto discreto de algo que vive detrás del PIN.
- **Patrón nuevo (Fase 13): una subpestaña de "atajos" que alimenta el mismo array que la pestaña "manual".** "Días especiales" no tiene datos propios — son botones que rellenan y abren el mismo formulario que "Fechas". Si una fase futura quiere ofrecer atajos/plantillas para algo que ya existe (ej. plantillas de rutina en una futura revisión de Productividad), seguir este mismo patrón antes que crear un modelo de datos paralelo.
- **Patrón nuevo (Fase 14): restricción de comportamiento de la IA dentro del propio `buildPrompt()`, no en `AI_SYSTEM`.** `AIPanel` (`ui.jsx`) siempre usa el mismo `AI_SYSTEM` general para toda la app — no acepta un system prompt distinto por módulo. Cuando una fase futura necesite una restricción específica (aquí, "nunca autoridad doctrinal"), se añade como texto extra dentro de `buildPrompt()`, con su propia constante si se reutiliza en más de un panel (ver `AVISO_DOCTRINAL` en `FaithView.jsx`). Mismo criterio que ya usaba `ObjectivesView` para sus propias restricciones ("no decidas ni asumas...").
- **Patrón nuevo (Fase 14): dos listas dentro de un mismo módulo con la misma forma (`{id, tipo/titulo, fecha, notas}`) pero sin fusionarse**, porque responden a preguntas distintas ("¿cuándo he servido?" vs. "¿qué tengo en el calendario?"). Si una fase futura tiene esta misma tentación de fusionar dos listas parecidas, evaluar primero si son conceptualmente la misma pregunta (fusionar) o dos preguntas distintas con forma parecida (mantener separadas, como aquí).
- **Patrón nuevo (Fase 15): reutilizar un temporizador ya existente para una variante con distinto propósito.** `ConcentracionTab` (`WellbeingView.jsx`) es literalmente el mismo `useRef`/`setInterval` de 1s que el Pomodoro de Productividad, pero con duración elegible y sin fase de descanso automática — no se creó un mecanismo de temporizador nuevo desde cero. Si una fase futura necesita otro temporizador, empezar copiando este patrón antes de inventar uno distinto.
- **Patrón nuevo (Fase 15): un índice/gráfico no necesita `ScoreGauge` — puede ser una barra simple.** `ScoreGauge` (`ui.jsx`) usa un `id` de gradiente SVG fijo (`gaugeGrad`); renderizarlo más de una vez en la misma pantalla duplica ese id y rompe el degradado de todos menos uno. Como Bienestar necesita mostrar 3 índices a la vez, se usó una barra de progreso simple (`BarraIndice` en `WellbeingView.jsx`, mismo `<div>` de altura fija que ya usa `MetasTab` en Productividad) en vez de tres `ScoreGauge`. Si una fase futura quiere reutilizar `ScoreGauge` más de una vez en la misma vista, hay que arreglarle primero el id fijo (pasarlo como prop), no usarlo tal cual.
- **Patrón nuevo (Fase 15): dejar explícito en la UI, con una frase corta, cuando algo NO puede hacer lo que a primera vista parece.** La pestaña Concentración aclara literalmente que el temporizador "no puede bloquear otras apps de tu móvil de verdad" — evita que Josué (o cualquiera) piense que la PWA tiene un poder que no tiene. Aplicar el mismo criterio en cualquier fase futura con una limitación técnica similar.
- **Patrón nuevo (Fase 17): un módulo "solo lectura" no necesita ninguna clave `app_data` propia.** `predicciones.js` y `PredictionsView.jsx` no guardan nada — leen datos que ya existen en otros módulos (mismo criterio que `correlaciones.js`/`StatsView.jsx` en la Fase 16). Si una fase futura es puramente analítica sobre datos ya existentes, no crear un `DEFAULT_X` en `tokens.js` ni tocar `App.jsx` más allá del nav y el `case` de `renderTab` — no hace falta estado, `snapshotAndSave` ni clave de Supabase.
- **Patrón nuevo (Fase 17): cuando el dato de origen es texto libre y no un número comparable, no fingir precisión numérica.** `prediccionFuerza` no proyecta ninguna cifra sobre los PRs (texto libre tipo "30s hold") — en su lugar mide constancia (frecuencia de sesiones) y lo explica en la propia tarjeta. Si una fase futura tiene la tentación de convertir un campo de texto libre en un número para poder graficarlo, primero comprobar si ese número sería honesto o inventado.
- **Patrón nuevo (Fase 18): una funcionalidad transversal se mete en el componente compartido, no en cada vista.** `AIPanel` (`ui.jsx`) ganó multimodalidad sin tocar ni una sola de las 15+ vistas que ya lo usan — la lógica del adjunto vive dentro del propio componente, `buildPrompt()` sigue igual. Si una fase futura quiere afinar algo que ya usan todas las vistas (tono, formato, límites), preferir tocar el componente compartido en `ui.jsx`/`ai.js` antes que repetir el cambio vista por vista.
- **Patrón nuevo (Fase 18): un adjunto de imagen usa `askAIWithImage`; un adjunto de PDF extrae texto y lo mete como contexto extra en el prompt normal, no como imagen ni como documento binario.** Reutiliza exactamente `extractPdfText` (Biblioteca, Fase 11) y `askAIWithImage` (Nutrición, Fase 4) en vez de crear un tercer mecanismo de subida a la IA. Si una fase futura necesita adjuntar otro tipo de archivo a una pregunta de IA, evaluar primero si encaja en uno de estos dos caminos antes de añadir uno nuevo.
- **Patrón nuevo (Fase 18): un elemento fijo en pantalla (`position: fixed`) para algo que debe estar disponible en cualquier vista sin ocupar espacio en el flujo normal.** `SuggestionsButton` y el icono del buscador universal viven en `App.jsx`, fuera de `renderTab()`, con `z-30`/`z-50` para quedar por encima del contenido pero por debajo de modales de PIN si los hubiera. Si una fase futura necesita otro acceso global (ej. un botón de emergencia o accesibilidad), seguir este mismo patrón de fijo + z-index en vez de meterlo en cada vista.
- **Patrón nuevo (Fase 18): reutilizar `currentState` (el objeto ya auditado para el export CSV/Excel) como el contexto "seguro" que se le pasa a la IA para preguntas transversales.** El buscador universal y el panel de sugerencias no mantienen su propia lista de "qué puede ver la IA" — usan el mismo objeto que ya excluye `relacion` por estar protegido con PIN de principio a fin. Si una fase futura necesita otro punto donde la IA vea "todo", partir de `currentState` en vez de construir el conjunto de datos desde cero.
- **Patrón nuevo (Fase 19): configuración de interfaz (no datos) se guarda directo, igual que `ajustes`.** `personalizacion` sigue el mismo criterio que `accent`/`pin`: se guarda con `saveData` en cuanto cambia, sin pasar por `snapshotAndSave`/deshacer — el histórico de 10 pasos es para datos que Josué introduce, no para preferencias de cómo se ve la app.
- **Patrón nuevo (Fase 19): un catálogo de iconos alternativos se guarda como string-clave, nunca como componente.** `personalizacion.iconos` guarda `{ moduloId: 'star' }`, no el componente `Star` — los componentes de React no son serializables a JSON/Supabase. La resolución clave→componente vive en un único sitio (`ICONOS_PERSONALIZABLES_MAP`, exportado desde `PersonalizationView.jsx`) e importado donde haga falta. Cualquier fase futura que guarde una referencia a "qué icono usar" debe seguir este mismo patrón string+mapa, nunca guardar el componente.
- **Patrón nuevo (Fase 19): un `PinGate` que antes envolvía un solo módulo fijo (Relación, Fase 12) pasa a envolver cualquier módulo de una lista configurable.** `renderTab()` ahora decide con una condición (`tab === 'relacion' || personalizacion.pinExtra.includes(tab)`) si envolver el contenido en `PinGate`, en vez de que cada `case` decida por sí mismo. Si una fase futura necesita que algo más (no solo el PIN) se aplique condicionalmente a cualquier pestaña, seguir este mismo patrón de "decidir fuera del switch, envolver el resultado" en vez de repetir la lógica en cada `case`.
- **Patrón nuevo (Fase 19): un elemento de la barra/nav "fijo por diseño" (no personalizable) se documenta explícitamente como tal, con el motivo.** `PRIMARY_NAV` y "Ajustes" quedan fuera de la personalización a propósito — permitir ocultarlos podría dejar a Josué sin forma de deshacer un cambio. Cualquier fase futura que amplíe qué es personalizable debe mantener esta misma excepción, salvo petición explícita de Josué.

---

## 7. Decisiones técnicas tomadas y el motivo de cada una

| Decisión | Motivo |
|---|---|
| Biblioteca dividida en `biblioteca` (apuntes/enlaces, con deshacer) y `bibliotecaArchivos` (pdf/vídeo/foto, sin deshacer) | Mismo criterio que Salud/Calistenia: un archivo real en Storage no debe quedar huérfano si se deshace un cambio. |
| Un único bucket de Storage `biblioteca` para pdf/vídeo/foto, con el tipo guardado en la fila de datos, no en Storage | Evita triplicar buckets y políticas casi idénticas; el tipo ya se necesita en la fila para saber cómo renderizar la tarjeta. |
| Extracción de texto del PDF en el cliente con `pdfjs-dist`, guardado como `textoExtraido` en la propia fila | Petición explícita del Prompt Maestro ("búsqueda dentro del contenido de los PDFs, clave para el instituto"); hacerlo en el navegador evita mandar el PDF a un servidor propio. |
| Si el PDF no tiene texto extraíble (escaneado), no se bloquea la subida, se avisa en la tarjeta | Un escaneo sin texto sigue siendo útil como archivo guardado, solo no es buscable por contenido — mejor avisar que impedir subirlo. |
| Un buscador y un filtro únicos para los 5 tipos, en vez de 5 pestañas separadas | El Prompt Maestro describe la Biblioteca como "un mismo espacio" de material de referencia con búsqueda transversal, no cinco listas independientes. |
| Sin IA en esta fase (ni resumen automático de PDFs ni sugerencias) | El Prompt Maestro no la pide para Biblioteca; no añadir alcance no solicitado. |
| Relación entera detrás de `PinGate` (no solo una pestaña) | El Prompt Maestro pide explícitamente el módulo protegido; a diferencia de Salud (donde solo Fotos es sensible), aquí nombre y fechas son igual de privados. |
| `relacion` (nombre + fechas) pasa por `snapshotAndSave`/deshacer | Es texto puro sin archivos — mismo criterio que Diario y los apuntes de Biblioteca, no hay archivo huérfano posible en Storage. |
| Recordatorio del Dashboard visible sin pedir el PIN (solo etiqueta + cuenta atrás) | Petición explícita del Prompt Maestro ("recordatorio en pantalla principal"); pedir el PIN cada vez que se abre "Hoy" contradiría el propósito de un recordatorio a la vista. El nombre completo y la lista entera siguen protegidos. |
| `relacion` excluida de la exportación CSV/Excel | Es el único módulo protegido de principio a fin por PIN y el export no lo vuelve a pedir — mismo criterio de exclusión que fotos/vídeos, aquí por privacidad en vez de por ser binario. |
| Fechas guardadas con año real (no solo día/mes) y calculadas con `proximaOcurrencia()` | Permite guardar tanto aniversarios que se repiten cada año como una fecha puntual futura con una misma estructura de datos, sin campos condicionales. |
| Sin fotos ni IA en esta fase | El Prompt Maestro solo pide nombre y fechas importantes para la Fase 12; fotos/contadores de tiempo son la Fase 13 (Recordatorios románticos), no esta. |
| "Días especiales" (Fase 13) como chips que reutilizan `relacion.fechas`, no una lista nueva | Son, en esencia, el mismo tipo de dato (etiqueta + fecha) que "Fechas" — un modelo de datos separado habría sido complejidad sin beneficio real. |
| Las fechas de "Días especiales" recurren cada año vía `proximaOcurrencia()` (ya existente desde la Fase 12), no se recrean solas | Es cálculo de visualización sobre un dato ya guardado por Josué, no generación automática de una entrada nueva — respeta la petición de que los recordatorios "se crean a mano" sin dejar de ser útiles año tras año. |
| Fe sin PIN | El Prompt Maestro no lo pide para este módulo, a diferencia de Relación (Fase 12) — mismo criterio que el Diario general. |
| Restricción doctrinal dentro de `buildPrompt()`, no en `AI_SYSTEM` | `AIPanel` usa un único `AI_SYSTEM` para toda la app; cambiarlo globalmente afectaría a todos los módulos. Meterlo en el prompt de cada panel de Fe sigue el mismo patrón que ya usa `ObjectivesView` para sus propias restricciones. |
| Servicio y Calendario como listas separadas en Fe, no fusionadas | Responden a preguntas distintas ("¿cuándo he servido yo?" vs. "¿qué evento tengo?"); fusionarlas habría forzado campos condicionales según el tipo de entrada. |
| Diario espiritual como array propio (`fe.diario`), no reutiliza `diario.entradas` | Son dos diarios con propósito distinto (vida en general vs. vida de fe); Josué puede querer llevarlos por separado, y mezclar habría acoplado dos módulos que el Prompt Maestro trata como fases distintas. |
| Eventos del Calendario de Fe sin recurrencia anual, ordenados por fecha literal | A diferencia de las fechas de Relación (aniversarios que se repiten), un retiro o una reunión puntual no "vuelve" solo cada año — aplicar `proximaOcurrencia()` aquí habría sido incorrecto. |
| `fe` incluida en la exportación CSV/Excel | No lleva PIN ni archivos — mismo criterio que Diario y Biblioteca (apuntes/enlaces), a diferencia de `relacion` que sí se excluye por estar protegida de principio a fin. |
| Los 3 índices de Bienestar se calculan sobre los últimos 7 días (ventana móvil), no sobre todo el histórico | Un índice "de siempre" se diluye con el tiempo y deja de reflejar cómo va la semana actual; 7 días es lo bastante corto para ser útil y lo bastante largo para no depender de un solo mal día. |
| "Equilibrio" se define como el % de minutos marcados "neutro", no como una fórmula derivada de los otros dos | Mantiene los tres índices simples de explicar (cada uno es literalmente el % de una categoría), en vez de una fórmula que Josué tendría que descifrar; documentado en el propio código por si se quiere afinar en el futuro. |
| Registro de Tiempo de Uso manual únicamente, sin intentar leerlo del dispositivo | El Prompt Maestro ya avisa de que no es viable interceptar apps reales desde una PWA; la importación (CSV u otro formato) queda como pendiente futuro, igual que la del banco en Economía. |
| Concentración reutiliza el `useRef`/`setInterval` del Pomodoro de Productividad, con duración elegible en vez de ciclo fijo trabajo/descanso | Evita un segundo mecanismo de temporizador con posibilidad de comportarse distinto; aquí no hace falta fase de descanso porque no es una técnica de estudio con ciclos, es un bloque único de concentración. |
| Recompensa al completar una sesión de concentración = un mensaje de texto breve, sin contador de puntos/nivel | Petición explícita del Prompt Maestro de no sobregamificar; se muestra el recuento de sesiones de la semana como dato informativo, no como sistema de puntuación. |
| Tres barras de progreso (`BarraIndice`) en vez de tres `ScoreGauge` para el Resumen | `ScoreGauge` usa un id de gradiente SVG fijo — repetirlo 3 veces en la misma pantalla rompe el degradado de los demás (ver sección 6). |
| `bienestar` (registros/reflexiones/sesiones) pasa entero por `snapshotAndSave`/deshacer | Es texto puro sin archivos — mismo criterio que Fe, Diario y los apuntes de Biblioteca. |
| `bienestar` incluida en la exportación CSV/Excel | Sin PIN ni archivos — mismo criterio que Fe y Diario. |
| Predicciones no crea ninguna clave `app_data` propia | Es un módulo puramente analítico (mismo criterio que Estadísticas, Fase 16) — no tiene ningún dato que Josué introduzca directamente, solo lee de otros módulos. |
| `prediccionFuerza` mide constancia de sesiones, no una cifra de fuerza numérica | Los PRs de Calistenia son texto libre (ej. "30s hold"), sin un valor comparable entre registros — inventar un número habría sido menos honesto que medir lo que sí hay: frecuencia de sesiones. |
| `prediccionNotas` usa una media de los últimos 3 exámenes en vez de una regresión lineal | Con solo 2-3 puntos, una recta ajustada da una falsa sensación de precisión; una media + comparación con el bloque anterior es más honesto con tan pocos datos. |
| `prediccionObjetivo` es aritmética de fechas (plazo elegido + `fechaCreacion`), no un modelo | El "tiempo estimado" que pide el Prompt Maestro es literalmente cuánto queda del plazo que Josué mismo fijó al crear el objetivo, no algo que haya que inferir de un patrón. |
| Predicciones sin exportación a CSV/Excel | Mismo criterio que Estadísticas: son cálculos derivados de datos que ya se exportan desde sus módulos de origen, no datos propios. |
| Multimodalidad metida dentro de `AIPanel`, no como prop nueva que cada vista tenga que pasar | Las 15+ vistas ya usan `AIPanel` con la misma firma (`label`, `accent`, `buildPrompt`); forzar a cada una a declarar si acepta adjuntos habría sido un cambio grande para un beneficio que ya se consigue metiéndolo una sola vez en el componente compartido. |
| PDF adjunto a una pregunta de IA se manda como texto extraído, no como documento/imagen | La API de Anthropic ya se usa aquí solo con `image`/`text` (`api/ask-ai.js`); reutilizar `extractPdfText` evita añadir un tercer tipo de contenido a la función serverless y mantiene el mismo criterio que Biblioteca (el texto sale del PDF en el propio navegador). |
| Adjunto del `AIPanel` se limpia después de cada pregunta (`setAdjunto(null)` en el `finally`) | Evita que un adjunto quede "pegado" y se reenvíe sin querer en la siguiente pregunta de esa misma sección. |
| Buscador universal y panel de sugerencias usan `currentState`, no un nuevo objeto de contexto | Es el mismo conjunto de datos ya auditado para el export (sin `relacion`); mantener una sola fuente de verdad de "qué es seguro mandarle a la IA" en vez de duplicar el criterio. |
| Panel de sugerencias exige un toque explícito en "Generar sugerencias" la primera vez, no se calcula solo al abrir el panel | Mismo criterio que ya aplica en toda la app: la IA nunca se dispara sola (Diario, análisis de vídeo, escaneo de comida, revisión de Objetivos). Abrir el panel es solo mostrar la interfaz, no una acción de IA. |
| Fijos con `position: fixed` en `App.jsx`, fuera de `renderTab()` | Deben estar disponibles en cualquier pestaña sin ocupar espacio en el flujo de cada vista ni tener que añadirse a las 14 vistas una por una. |
| `PRIMARY_NAV` y "Ajustes" fuera de la personalización | Mantenerlos fijos evita que Josué se quede sin forma de deshacer un cambio o de volver a Ajustes si oculta algo por error. |
| "Crear/eliminar apartados" interpretado como mostrar/ocultar módulos ya existentes | Un constructor de módulos arbitrarios desde cero está fuera del alcance razonable de una PWA de código fijo; no lo pide con ese detalle el Prompt Maestro. |
| "Cambiar gráficos" no se toca esta fase | El color de los gráficos ya se personaliza desde la Fase 1 (accent); no hay petición concreta de tipos de gráfico alternativos — no se añade alcance no pedido. |
| Confirmación solo al ocultar, nunca al volver a mostrar | Literal a la petición del Prompt Maestro ("confirmación extra solo al borrar un módulo entero"); mostrar de nuevo es una acción segura y reversible. |
| Ocultar un módulo nunca borra sus datos | Solo lo quita de la lista "Más"; los datos siguen intactos en Supabase. Una eliminación real de datos no se pidió y sería demasiado arriesgada para una casilla de personalización. |
| `personalizacion` se guarda directo (como `ajustes`), no pasa por `snapshotAndSave` | Es preferencia de interfaz, no un dato que tenga sentido "deshacer" con el histórico de 10 pasos compartido con el resto de módulos. |
| Iconos alternativos guardados como string-clave, nunca como componente | Los componentes de React no son serializables a JSON/Supabase; la resolución clave→componente vive en un único mapa (`ICONOS_PERSONALIZABLES_MAP`). |
| Métricas favoritas calculadas en `App.jsx`, no dentro de `DashboardView.jsx` | Cada métrica cruza datos de un módulo distinto; mismo criterio que Estadísticas/Predicciones — ninguna vista de solo lectura debería conocer la forma interna de otro módulo. |
| `proximo_objetivo` reutiliza `prediccionObjetivo()` (Fase 17) en vez de duplicar el cálculo | Mismo dato, misma fuente de verdad. |

Todas las decisiones de fases anteriores siguen vigentes sin cambios.

---

## 8. Funcionalidades implementadas

### Nuevas en esta fase (Fase 19 — Personalización total)
- Reordenar cualquier sección de "Más" con flechas arriba/abajo.
- Ocultar/mostrar cualquier sección — ocultar pide confirmación inline, mostrar de nuevo no.
- Cambiar el icono de cualquier sección desde un catálogo de 8 alternativas, o volver al original.
- Proteger con el mismo PIN cualquier sección además de Relación (que sigue siempre protegida).
- Hasta 4 métricas favoritas en el panel "Hoy", elegidas de una lista de 6, con su propio orden.
- Nueva vista `PersonalizationView.jsx`, integrada dentro de la pantalla Ajustes.
- Sin exportación a CSV/Excel ni impacto en el sistema de deshacer — es configuración de interfaz, no datos.

### Nuevas en la Fase 18 — IA con memoria a fondo
- `AIPanel` (usado en las 15+ secciones con botón de IA) ahora acepta adjuntar una foto/captura o un PDF antes de preguntar, con icono de clip y previsualización del nombre del archivo adjunto.
- Buscador universal en lenguaje natural: icono fijo arriba a la derecha, modal con pregunta libre sobre todos los datos ya guardados (excepto Relación, protegida por PIN).
- Panel de sugerencias fijo arriba a la izquierda: icono con bombilla, panel plegable, hasta 2 sugerencias breves bajo demanda (nunca automático) sobre un resumen reciente de varios módulos.
- `fileToBase64` añadido a `helpers.js`, compartido entre `NutritionView.jsx` (ya existente) y el nuevo `AIPanel`.
- Sin exportación a CSV/Excel ni clave `app_data` nueva — es una fase transversal, no un módulo con datos propios.

### Nuevas en la Fase 17 — Predicciones
- Tarjeta **Tiempo estimado de tus objetivos**: días restantes (o superados) hasta el plazo de cada objetivo pendiente, los 5 más próximos.
- Tarjeta **Riesgo de abandono de tus hábitos**: bajo/medio/alto según el % de días marcados en los últimos hasta 14 días.
- Tarjeta **Tendencia de peso**: peso actual, tendencia semanal y estimación a 30 días, por regresión lineal simple sobre las medidas de Salud.
- Tarjeta **Constancia de entreno**: sesiones recientes vs. anteriores de la habilidad de calistenia más entrenada — constancia, no una cifra de fuerza inventada.
- Tarjeta **Proyección de ahorro**: neto medio mensual y hucha estimada a 3 meses, sobre los movimientos de Economía.
- Tarjeta **Tendencia de notas**: media de los 3 exámenes más recientes con nota obtenida y su tendencia frente al bloque anterior.
- Todas dicen abiertamente cuando no hay datos suficientes, sin forzar una lectura.

### Heredadas (Fases 1-16)
Ver tabla de la sección 10 para el estado exacto de verificación real de cada una.

---

## 9. Funcionalidades pendientes

- **Probar de verdad las Fases 8 a 19** — ninguna tiene confirmación de ejecución real todavía.
- **Resolver el problema de despliegue en Replit** (Preview/Webview no muestra el servidor de `npm run dev` expuesto) — pendiente, no bloquea seguir construyendo fases.
- `ANTHROPIC_API_KEY` en producción sigue sin activarse, por decisión consciente de Josué.
- Confirmar despliegue real en Vercel, iconos PWA, importación CSV del banco, detección de duplicados, exportación a PDF.
- Importación automática del Tiempo de Uso (Bienestar digital) — de momento solo entrada manual, ver sección 7.
- Todo lo demás: Personalización total, Funciones transversales avanzadas, Pulido final y QA (ver Prompt Maestro completo en sección 0 para el alcance exacto de cada una).

---

## 10. Estado exacto de cada fase

| Fase | Contenido | Estado |
|---|---|---|
| 1-7 | Dashboard/Sueño/Entreno/Economía, Backend real, Salud, Nutrición, Calistenia a fondo, Estudios, Negocio | ✅ Completadas y verificadas por Josué en ejecución real |
| 8 | Productividad (Hábitos, Rutinas, Pomodoro, Tareas, Metas cortas) | 🟡 Código completo, comprobado con `esbuild`, pendiente de ejecución real |
| 9 | Objetivos (30d/90d/1-5-10 años, revisión periódica con IA) | 🟡 Código completo, comprobado con `esbuild`, pendiente de ejecución real |
| 10 | Diario (entrada diaria, ánimo, IA de patrones emocionales) | 🟡 Código completo, comprobado con `esbuild`, pendiente de ejecución real |
| 11 | Biblioteca (PDFs, vídeos, fotos, apuntes, enlaces, búsqueda en PDFs) | 🟡 Código completo, comprobado con `esbuild`, pendiente de ejecución real y de `npm install` por `pdfjs-dist` |
| 12 | Relación (nombre, fechas importantes, recordatorio en Dashboard, `PinGate`) | 🟡 Código completo, comprobado con `esbuild`, pendiente de ejecución real |
| 13 | Recordatorios románticos (chips de días especiales dentro de Relación) | 🟡 Código completo, comprobado con `esbuild`, pendiente de ejecución real |
| 14 | Fe y vida espiritual (Servicio, Calendario, Diario, Objetivos, sin PIN) | 🟡 Código completo, comprobado con `esbuild`, pendiente de ejecución real. Sin dependencias npm nuevas. |
| 15 | Bienestar digital (Resumen/índices, Tiempo de uso, Concentración, Reflexión, sin PIN) | 🟡 **Código completo y comprobado con `esbuild`, pendiente de ejecución real. Sin dependencias npm nuevas.** |
| 16 | Estadísticas y correlaciones (`StatsView.jsx`: sueño↔estudio, sueño↔ánimo, entreno↔ánimo) | 🟡 Código completo, comprobado con `esbuild`, pendiente de ejecución real. Sin dependencias npm nuevas. |
| 17 | Predicciones (`PredictionsView.jsx`: objetivo, hábito, peso, fuerza, ahorro, notas) | 🟡 **Código completo y comprobado con `esbuild`, pendiente de ejecución real. Sin dependencias npm nuevas.** |
| 18 | IA con memoria a fondo (`AIPanel` multimodal, buscador universal, panel de sugerencias fijo) | 🟡 Código completo, comprobado con `esbuild`, pendiente de ejecución real. Sin dependencias npm nuevas. |
| 19 | Personalización total (reordenar/ocultar/icono/PIN por sección, métricas favoritas) | 🟡 **Código completo y comprobado con `esbuild`, pendiente de ejecución real. Sin dependencias npm nuevas.** |
| 20 | Funciones transversales avanzadas | ⏳ Pendiente — siguiente fase; alcance en el Prompt Maestro (sección 0): automatizaciones simples (si X entonces Y), recordatorios inteligentes multi-condición, integración entre módulos, modo "concentración total" que oculta secciones no esenciales |
| 21 | Pulido final y QA | ⏳ Pendiente |

**Pospuesto indefinidamente:** editor visual de automatizaciones, API externa, chat único de IA con todo el historial, funciones nativas de Bienestar Digital, acceso propio de la pareja al módulo de Relación, constructor de módulos arbitrarios desde cero (Personalización se quedó en mostrar/ocultar módulos ya existentes, ver Fase 19 sección 7).

---

## 11. Todo el contexto necesario para continuar sin hacer preguntas

- Josué, 16 años, nacido el 29/07/2010 — edad recalculada automáticamente, nunca hardcodeada.
- Perfil por defecto: altura 187 cm, peso 72 kg, actividad "moderado".
- Cursa 1º de Bachillerato de Ciencias (rama Biología) y estudia música en paralelo.
- Entrena calistenia y juega fútbol informal.
- Practica una fe cristiana con servicio activo — módulo ya construido en la Fase 14 (Servicio, Calendario, Diario espiritual, Objetivos), tratado con respeto, sin autoridad doctrinal.
- Tiene pareja — módulo privado con PIN, ya construido en la Fase 12 (nombre + fechas importantes + recordatorio en el Dashboard) y ampliado en la Fase 13 (Días especiales: chips con nombres preestablecidos).
- No usa Face ID — solo PIN, ya en uso real. Desde la Fase 19, Josué puede proteger con ese mismo PIN cualquier otra sección además de Relación, desde Ajustes → Personalización avanzada.
- La paleta de colores es la fuente de verdad — no rediseñarla sin petición explícita.
- Bienestar digital ya construido en la Fase 15 (índices de productividad/distracción/equilibrio, Tiempo de uso manual, Concentración simulada, Reflexión manual), sin PIN — recordar que no puede interceptar apps reales del móvil.
- Estadísticas (Fase 16) y Predicciones (Fase 17) ya construidas, ambas de solo lectura sobre datos de otros módulos, sin datos propios ni exportación.
- IA con memoria a fondo (Fase 18) ya construida: `AIPanel` multimodal (foto/PDF) en todas las secciones, buscador universal en lenguaje natural y panel de sugerencias fijo arriba a la izquierda, sin datos propios.
- Personalización total (Fase 19) ya construida: reordenar/ocultar/cambiar icono/proteger con PIN cualquier sección de "Más" (excepto los 4 accesos fijos de abajo y Ajustes), y hasta 4 métricas favoritas en el panel "Hoy" — todo desde Ajustes → Personalización avanzada.
- Fase 20 (Funciones transversales avanzadas) ya construida completa: 3 automatizaciones fijas en el Dashboard (sueño corto, racha de hábito en riesgo, examen sin horas de estudio), Centro de logros + Mapa de vida (nueva pestaña "Logros" en `MORE_NAV`, solo lectura), y modos "viaje/vacaciones/exámenes" (chips en Personalización avanzada, aviso en el Dashboard si hay uno activo).
- Fase 21 (Pulido final y QA) arrancada con una primera pasada pequeña (auditoría de colores sueltos) — la mayor parte de esta fase sigue pendiente, ver sección 16.
- `ANTHROPIC_API_KEY` sigue sin activarse en producción, por decisión consciente de Josué.
- **Josué no tiene ordenador** — todo lo técnico vía Replit desde el iPhone. Comandos simples, uno a la vez, y **actualmente atascado en exponer el puerto del servidor de desarrollo** (ver sección 12) — tema aparte, no bloquea seguir construyendo código.
- **Josué rota entre varias cuentas gratuitas de Claude.**
- **El Prompt Maestro completo de las 21 fases vive ahora en la sección 0** — no hace falta volver a pedírselo a Josué para ninguna fase futura, ya está todo el alcance ahí.
- **Sigue pidiendo encadenar fases sin esperar confirmación real de cada una** — seguir construyendo la siguiente cuando lo pida, incluso si la anterior no está confirmada en ejecución real todavía. Sí seguir construyendo solo una fase por turno.
- **Lo más importante para él en cada entrega es recibir el zip actualizado cuanto antes** — nunca dejar un turno a medias sin entregarlo.
- Este HANDOFF y el CHANGELOG se actualizan al terminar cada fase, nunca se reescriben desde cero (salvo reorganizar secciones existentes para mantenerlo claro, conservando todo el contenido vigente).
- **Claude nunca ejecuta la app de verdad** — solo escribe y comprueba el código con `esbuild`, con las dependencias npm marcadas como externas porque este entorno no tiene acceso a red para instalarlas de verdad.

---

## 12. Problemas conocidos y cómo se solucionaron

- **Problema:** contexto largo → el modelo pierde precisión. **Solución:** este HANDOFF.md + CHANGELOG.md portátiles, y ahora también el Prompt Maestro completo integrado en la sección 0.
- **Problema (Fase 1→2, cerrado):** dependencia de mecanismos exclusivos de Artifacts. **Solución:** migración a Supabase + proxy serverless.
- **Problema (cerrado): Josué no tiene ordenador.** Solución: Replit como terminal en la nube desde el iPhone.
- **Problema ABIERTO (Replit, no es un problema de código):** tras `npm run dev` (y luego `npm run dev -- --host`), el servidor arranca bien (`Local: http://localhost:5173/`), pero ni el aviso "Expose this port?", ni el icono de globo, ni la pestaña "Preview" han mostrado todavía la web funcionando. **La siguiente IA debería retomarlo si Josué lo vuelve a mencionar**, probando: :5173 tras `--host` mostrando ya una línea "Network:", o preguntar directamente si Replit tiene alguna otra pestaña/panel llamado "Webview" distinta de "Preview" en su versión concreta de la app.
- **Recordatorio permanente:** ninguna fase se ha podido ejecutar de verdad en este entorno de desarrollo (sin red) — se mitiga con verificación `esbuild` (bundle completo, dependencias npm externas), pero no sustituye una ejecución real.

---

## 13. Dependencias y configuraciones

`package.json` en v0.21.0. Sin dependencias npm nuevas desde la Fase 13 (ni en la 14 a la 21). El resto sin cambios respecto a la Fase 11.

---

## 14. Variables de entorno necesarias

Sin cambios: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` ya en `.env`. `ANTHROPIC_API_KEY` solo servidor, opcional, sin activar por decisión consciente de Josué.

---

## 15. Archivos importantes y para qué sirve cada uno

Ver árbol completo en la sección 5. Nuevos/modificados en la Fase 20 (completa esta fase):
- `src/lib/logros.js` — nuevo, `calcularLogros()`, 12 insignias binarias sobre datos de 10 módulos, solo lectura.
- `src/views/AchievementsView.jsx` — nuevo, módulo completo (subpestañas Logros / Mapa de vida).
- `src/views/DashboardView.jsx` — `AvisoRachaEnRiesgo`, `AvisoExamenSinHoras`, `ModoBanner`; recibe `productividad`, `estudios`, `modo` como props nuevas.
- `src/views/PersonalizationView.jsx` — `ModoAppSection` (chips de modo, encima de la sección ya existente de la Fase 19).
- `src/tokens.js` — `MODOS_APP`; `DEFAULT_PERSONALIZACION` ahora incluye `modo: null`.
- `src/App.jsx` — `setModoApp` (toggle), `case 'logros'`, `MORE_NAV` con la entrada "Logros" (icono `Trophy`), `case 'hoy'` y `case 'ajustes'` pasan las props nuevas.
- `package.json` — v0.21.0, sin dependencias nuevas.

Nuevos/modificados en la Fase 19 (siguen vigentes):
- `src/views/PersonalizationView.jsx` — módulo completo (reordenar/ocultar/icono/PIN por sección, métricas favoritas).
- `src/tokens.js` — `ICONOS_PERSONALIZABLES_IDS`, `METRICAS_FAVORITAS_DISPONIBLES`, `MAX_METRICAS_FAVORITAS`.
- `src/App.jsx` — estado `personalizacion` (guardado directo, sin deshacer), resolución de `MORE_NAV` (`moreNavPersonalizables`/`moreNavOrdenadoConIconos`/`moreNavVisible`), `calcularMetricas()`/`favoritasResueltas`, `renderContent()`+`renderTab()` (PIN generalizado), `case 'ajustes'` renderiza `SettingsView` + `PersonalizationView`.
- `src/views/DashboardView.jsx` — tarjetas de métricas favoritas (prop `favoritas`).

Nuevos/modificados en la Fase 18 (siguen vigentes):
- `src/components/ui.jsx` — `AIPanel` con adjunto multimodal (foto/PDF); `SuggestionsButton` y `UniversalSearchModal`.
- `src/lib/helpers.js` — `fileToBase64`, compartido con `NutritionView.jsx`.

Nuevos/modificados en la Fase 17 (siguen vigentes):
- `src/lib/predicciones.js` — 6 funciones puras (`prediccionObjetivo`, `prediccionAbandonoHabito`, `prediccionPeso`, `prediccionFuerza`, `prediccionAhorro`, `prediccionNotas`) — `prediccionObjetivo` ahora también reutilizada por `App.jsx` (métricas favoritas).
- `src/views/PredictionsView.jsx` — módulo completo (solo lectura, 6 tarjetas).

Nuevos/modificados en la Fase 16 (siguen vigentes):
- `src/lib/correlaciones.js` — `correlacionSuenoAnimo`, `correlacionEntrenoAnimo` (además de `correlacionSuenoEstudio`, ya existente desde la Fase 6).
- `src/views/StatsView.jsx` — módulo completo (solo lectura, 3 tarjetas de correlación).

Nuevos/modificados en la Fase 15 (siguen vigentes):
- `src/views/WellbeingView.jsx` — módulo completo (4 subpestañas: Resumen, Tiempo de uso, Concentración, Reflexión).
- `src/tokens.js` — `CATEGORIAS_TIEMPO_USO`, `DURACIONES_CONCENTRACION`, `DEFAULT_BIENESTAR`.

Nuevos/modificados en la Fase 14 (siguen vigentes):
- `src/views/FaithView.jsx` — módulo completo (4 subpestañas: Servicio, Calendario, Diario, Objetivos).
- `src/tokens.js` — `TIPOS_SERVICIO_FE`, `TIPOS_EVENTO_FE`, `DEFAULT_FE`.
- `src/views/DashboardView.jsx` — `RecordatorioPareja`, tarjeta con la fecha más próxima y su cuenta atrás.
- `src/lib/helpers.js` — `proximaOcurrencia(fechaISO)`, `diasHasta(fechaISO)`.
- `src/tokens.js` — `DEFAULT_RELACION`.

---

## 16. Próximo paso exacto que debe realizar la siguiente IA

**El Prompt Maestro de las 21 fases (sección 0) está completo — la Fase 21 se cerró en esta pasada (v1.0.0).** Ya no hay "próxima fase" que buscar en la sección 0. A partir de aquí:

**Antes de nada, comprobar el chat por si Josué ya ha dicho algo de esto:**
1. ¿Probó alguna fase de verdad en ejecución real (móvil/Replit)? Si reporta error, pedir el mensaje exacto antes de asumir nada.
2. ¿Sigue atascado con exponer el puerto en Replit, o ya lo resolvió?
3. ¿Ha visto la app renderizada de verdad y notado algo del repaso visual que el análisis de código (sección 3, aviso de la Fase 21) no pudo detectar por no poder ejecutarla? Si es así, es un arreglo puntual sobre lo que reporte, no una reapertura genérica de la Fase 21.

**Después, salvo que Josué pida algo concreto — no hay trabajo pendiente definido por el Prompt Maestro; lo que queda es la lista de "Pendientes / próximos pasos" (sección 15), que son tareas prácticas de despliegue, no fases de producto:**
4. Confirmar que las Fases 8-21 funcionan de verdad en ejecución real (Josué no tiene ordenador, prueba desde iPhone vía Replit).
5. Ayudar a resolver el problema de exponer el puerto en Replit si lo retoma (sección 12), y avanzar el despliegue real en Vercel / iconos de la PWA si Josué lo pide.
6. Cualquier ampliación que Josué pida a partir de ahora (el propio Prompt Maestro lo anticipa en su última línea: "para más adelante, no ahora: editor visual de automatizaciones, API externa, chat único con acceso a todos los módulos a la vez") es alcance nuevo — trátalo como tal, no fuerces que encaje en una fase de la lista original.
7. Al terminar tu turno, **actualiza este mismo HANDOFF.md y el CHANGELOG.md** (no generes ninguno nuevo desde cero). Verifica con `esbuild`. **Entrega siempre el zip actualizado, no dejes un turno a medias.**
---

## 17. Riesgos o aspectos que no deben modificarse

- No rediseñar la paleta sin petición explícita. No romper `AIPanel`/`buildPrompt()`.
- No dejar que la IA prescriba objetivos calóricos/de peso estrictos en Salud ni Nutrición.
- El escaneo de foto de comida y el análisis de vídeo de calistenia nunca se disparan solos, siempre a un toque explícito.
- El plan de repaso de Estudios lo aconseja la IA, pero Josué decide y ejecuta.
- No ampliar Negocio más allá de lo pedido.
- No romper la lógica de racha "en pausa" de Hábitos.
- No fusionar las "metas" de Productividad con los "Objetivos".
- La revisión de Objetivos con IA nunca debe añadir un objetivo automáticamente.
- El Diario mantiene una entrada por día. La detección de patrones emocionales del Diario nunca se dispara sola. No añadir PIN al Diario.
- La Biblioteca no lleva IA en esta fase — no añadir resumen automático ni análisis de PDFs sin que Josué lo pida explícitamente en una fase futura.
- `bibliotecaArchivos` (pdf/vídeo/foto) se mantiene fuera del sistema de deshacer — no meterlo en `snapshotAndSave` en ninguna fase futura, por el mismo motivo que las fotos de Salud y los vídeos de Calistenia.
- El bucket `biblioteca` de Storage es privado — no hacerlo público ni servir archivos con una URL fija, siempre firmada y de corta duración, igual que `progreso` y `entrenamiento-videos`.
- **No quitar el `PinGate` que envuelve el módulo Relación completo** — a diferencia de Salud (solo Fotos), aquí todo el módulo (nombre + fechas) debe quedar protegido.
- **No incluir `relacion` en la exportación CSV/Excel** — es el único módulo protegido de principio a fin, y el export no vuelve a pedir el PIN.
- **No generar recordatorios de pareja automáticamente por conteo de tiempo** — cada fecha (incluidas las de "Días especiales") se activa/crea a mano, nunca calculando "llevan X días juntos" sin que Josué lo pida. La recurrencia anual de una fecha ya guardada (vía `proximaOcurrencia`) es cálculo de visualización, no generación de una entrada nueva — no confundir ambas cosas.
- No dar autoridad doctrinal en el módulo de Fe — los `AIPanel` de `FaithView.jsx` deben conservar el `AVISO_DOCTRINAL` en su `buildPrompt()`; si se añaden más paneles de IA a este módulo en el futuro, incluir la misma restricción. No registrar el ciclo menstrual de la pareja.
- **No fusionar `fe.servicio` y `fe.eventos`, ni `fe.diario` con `diario.entradas` del Diario general** — son listas conceptualmente distintas aunque se parezcan en forma (ver decisiones, sección 7).
- **No aplicar `proximaOcurrencia()`/recurrencia anual a los eventos del Calendario de Fe** — a diferencia de las fechas de Relación, un retiro o una reunión puntual no se repite solo cada año; se ordenan por fecha literal.
- **No romper `AIPanel` para ninguna de las 15+ vistas que lo usan** — la firma `buildPrompt()` sin argumentos debe seguir funcionando igual; el adjunto (foto/PDF, Fase 18) es un añadido interno del componente, no algo que las vistas tengan que pasar.
- **El buscador universal y el panel de sugerencias (Fase 18) nunca deben incluir `relacion`** — siguen usando `currentState`, el mismo objeto ya auditado para el export; si una fase futura amplía el contexto que ve la IA, mantener esa misma exclusión.
- **El panel de sugerencias no debe llamar a la IA solo por abrirse** — tiene que seguir exigiendo el toque en "Generar sugerencias" la primera vez, mismo criterio que el resto de la app.
- **Bienestar digital nunca debe dar a entender que intercepta apps reales del móvil** — mantener el aviso explícito en la pestaña Concentración ("no puede bloquear otras apps de tu móvil de verdad"); no implementar nada que prometa bloqueo real, eso no es viable en una PWA.
- **No sobregamificar Bienestar digital** — sin puntos, niveles, monedas ni rachas nuevas en este módulo; la única "recompensa" es el mensaje breve al completar una sesión de concentración y el recuento (no una puntuación) de sesiones de la semana. Si una fase futura quiere ampliar esto, mantener el mismo tono discreto.
- **Los índices de Bienestar (`WellbeingView.jsx`) se calculan solo sobre lo que Josué registra a mano** — no presentarlos nunca como una medición objetiva o real del dispositivo.
- **No repetir `ScoreGauge` más de una vez en la misma pantalla sin arreglarle antes el id fijo del gradiente** (ver sección 6) — usar barras de progreso simples si hace falta mostrar varios valores a la vez, como ya hace `WellbeingView`.
- **No inventar cifras numéricas sobre datos de origen que son texto libre** — `prediccionFuerza` mide constancia de sesiones, no una cifra de fuerza, precisamente porque los PRs de Calistenia son texto libre sin valor comparable. Aplicar el mismo criterio a cualquier predicción futura sobre un campo de texto libre.
- **Estadísticas y Predicciones son solo lectura** — no crear ningún `DEFAULT_X` en `tokens.js` ni clave `app_data` para ninguna de las dos; si una fase futura las amplía, mantenerlas como cálculos sobre datos de otros módulos, no como módulos con datos propios.
- **`PRIMARY_NAV` y "Ajustes" nunca deben poder ocultarse ni reordenarse** — la personalización (Fase 19) se detiene deliberadamente en `MORE_NAV`; permitir tocar los 4 accesos fijos o Ajustes podría dejar a Josué sin forma de volver atrás.
- **No convertir "crear/eliminar apartados" en un constructor de módulos arbitrarios** — se quedó, a propósito, en mostrar/ocultar los módulos ya construidos (ver decisiones, sección 7); si Josué pide explícitamente módulos completamente nuevos con su propio esquema de datos, es una conversación aparte, no una ampliación silenciosa de Personalización.
- **Ocultar un módulo (Fase 19) nunca debe borrar sus datos** — solo lo quita de `MORE_NAV`; los datos siguen en Supabase intactos.
- **`personalizacion.iconos` guarda claves string, nunca componentes** — la resolución vive en `ICONOS_PERSONALIZABLES_MAP` (`PersonalizationView.jsx`); no guardar un componente de React en el estado ni en Supabase.
- **El PIN generalizado (Fase 19) nunca debe poder quitarse de Relación** — `necesitaPin` en `App.jsx` fuerza `tab === 'relacion'` independientemente de `personalizacion.pinExtra`; no cambiar esa condición a "solo si está en pinExtra".
- **Logros y Mapa de vida (Fase 20) son solo lectura, como Estadísticas/Predicciones** — `logros.js`/`AchievementsView.jsx` no tienen clave `app_data` propia ni exportación; si una fase futura los amplía, mantener ese mismo criterio.
- **No convertir el Centro de logros en un sistema de puntos/niveles/monedas** — las insignias son binarias (conseguido o no), mismo espíritu "no sobregamificar" que ya rige Bienestar digital; si se añaden más insignias en el futuro, mantenerlas binarias y sin premio material.
- **Los modos "viaje/vacaciones/exámenes" (Fase 20) no deben convertirse en un motor configurable** — siguen siendo 3 plantillas fijas con texto fijo (`MODOS_APP` en `tokens.js`); no dejar que Josué cree modos nuevos ni que un modo oculte/reordene módulos — eso ya lo cubre Personalización (Fase 19) por separado, y mezclarlo complicaría deshacerlo.
- **`personalizacion.modo` sigue el mismo patrón que el resto de `personalizacion`** — guardado directo con `saveData`, nunca por `snapshotAndSave`/deshacer; no cambiar eso sin motivo.
- No implementar biometría (Face ID) — solo PIN, único para toda la app.
- No exponer `ANTHROPIC_API_KEY` en código de cliente. No hacer público ningún bucket de Storage.
- No meter fotos, vídeos, el contador de pomodoros, `ultimaRevision` ni `bibliotecaArchivos` en el sistema de deshacer.
- No prometer funciones no viables en PWA sin dejarlo claro. No construir varias fases a la vez.
- No sobrecargar el motor de IA con llamadas innecesarias.
- Recordar que Josué no tiene ordenador, rota entre cuentas de Claude, y pide encadenar fases sin esperar confirmación de cada una.
- Verificar con `esbuild` antes de entregar (bundle completo, dependencias npm externas).
- **Priorizar la entrega del zip actualizado sobre explicaciones largas — nunca dejar un turno sin entregarlo.**
- **El Prompt Maestro completo vive en la sección 0 — mantenerlo íntegro en cada actualización de este documento, no resumirlo ni recortarlo.**

---

## 18. Lista de TODOs pendientes

- [ ] Confirmar que las Fases 8 a 21 funcionan de verdad en ejecución real.
- [ ] Ejecutar `npm install` en Replit tras la Fase 11 (dependencia `pdfjs-dist`), si no se ha hecho ya.
- [ ] Resolver el problema de exponer el puerto en Replit (Preview/Webview) — ver sección 12.
- [ ] Confirmar despliegue real en Vercel.
- [ ] Generar o recibir iconos PWA.
- [ ] Importación de datos (CSV del banco, y del Tiempo de Uso en Bienestar digital), detección de duplicados, exportación a PDF.
- [ ] Revisar si la "puntuación diaria" del Dashboard debería basarse en el día calendario real (heredado).
- [x] Terminar la Fase 21 de verdad: repaso visual/contraste real hecho (lectura de JSX de las 20 vistas + `grep` dirigidos), dos inconsistencias menores corregidas (`SettingsView.jsx`, `TrainingView.jsx`) — ver CHANGELOG. **Prompt Maestro de las 21 fases completo. `package.json` → v1.0.0.**
- [ ] Cualquier ampliación futura que Josué pida a partir de ahora es alcance nuevo, no una fase pendiente del Prompt Maestro original.

---

## INSTRUCCIONES PARA LA SIGUIENTE IA

1. Lee este documento completo antes de escribir cualquier código — el Prompt Maestro de la sección 0 ya resuelve el alcance de cualquier fase futura, no hace falta pedirlo de nuevo.
2. Comprueba primero si Josué ya respondió a los puntos abiertos de la sección 16, incluso en otra conversación/cuenta.
3. Si reporta errores de código, depúralos. Si es el problema de Replit (sección 12), ayuda con eso también si lo retoma, pero no es requisito para seguir construyendo fases.
4. No rediseñes la paleta. No implementes Face ID. No construyas varias fases a la vez. No rompas la racha "en pausa". No fusiones metas cortas con Objetivos. La IA nunca añade objetivos sola. No metas archivos de Biblioteca en el sistema de deshacer. No quites el `PinGate` de Relación ni la incluyas en el export. No quites el `AVISO_DOCTRINAL` de los paneles de IA de Fe. No sobregamifiques Bienestar digital ni des a entender que puede bloquear apps reales del móvil. No inventes cifras numéricas sobre campos de texto libre (ver `prediccionFuerza`). No conviertas Estadísticas ni Predicciones en módulos con datos propios. No toques `PRIMARY_NAV` ni "Ajustes" en la personalización. No conviertas "crear/eliminar apartados" en un constructor de módulos arbitrarios sin que Josué lo pida explícitamente.
5. Verifica el código con `esbuild` antes de entregarlo (bundle completo, dependencias npm marcadas como externas — este entorno no tiene red para instalarlas de verdad).
6. Estilo esperado: código funcionando, no solo especificaciones.
7. Al terminar tu fase, actualiza este mismo HANDOFF.md y el CHANGELOG.md — nunca generes ninguno nuevo desde cero.
8. **Entrega siempre el zip actualizado — es lo más importante para Josué, no dejes un turno sin él.**

Si tienes dudas técnicas: decide tú mismo con buenas prácticas, siempre que no cambie la experiencia de usuario ni contradiga este documento. Pregunta a Josué solo lo que dependa genuinamente de su preferencia personal o de recursos que solo él puede aportar — el alcance de cada fase ya no debería ser una de esas preguntas, gracias al Prompt Maestro de la sección 0.
