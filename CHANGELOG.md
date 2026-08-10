# CHANGELOG.md

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
