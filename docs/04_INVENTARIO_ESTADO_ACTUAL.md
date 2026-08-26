# JosStyle — INVENTARIO DEL ESTADO ACTUAL

> Qué existe hoy (v1.22.0), archivo por archivo y clave por clave, con la etiqueta de qué hay que
> hacer con cada pieza para el trabajo pendiente.
>
> **EXISTE** = está construido y no hay que tocarlo salvo que una tarea concreta lo pida.
> **MODIFICAR** = existe pero alguna tarea pendiente lo va a cambiar.
> **CREAR** = no existe todavía.

---

## 1. Archivos de configuración y raíz

| Archivo | Estado | Qué es / qué le falta |
|---|---|---|
| `package.json` | **MODIFICAR** | v1.22.0. 9 dependencias de producción, 5 de desarrollo. Sin dependencias nuevas desde la Fase 13. Se incrementa la versión menor en cada fase |
| `vite.config.js` · `tailwind.config.js` · `postcss.config.js` | **EXISTE** | Sin cambios previstos |
| `index.html` | **EXISTE** | |
| `README.md` | **CREAR (contenido)** | Hoy contiene **una sola línea**: `# JosStyle`. Merece un README real (qué es, cómo arrancar, dónde está la documentación) |
| `SETUP.md` | **MODIFICAR** | Guía de puesta en marcha de Supabase + local + Vercel. Tiene pasos 5 y 8 para los buckets y un paso sobre permisos de cámara. Añadir un paso por cada bucket nuevo |
| `HANDOFF.md` | 🔴 **MODIFICAR (urgente)** | Documento portátil entre conversaciones. Banners al día, **secciones numeradas 3/5/8/9/10/13/15 fósiles** — ver C-19, C-20 |
| `CHANGELOG.md` | **MODIFICAR** | Registro histórico turno a turno. **Falta la entrada de la Fase A7** (C-02) |
| `ESPECIFICACION_AJUSTES_ENTREGA1.md` | 🔒 **INTOCABLE** | Transcripción literal de lo que pegó Josué. Nunca resumir ni recortar. Apartados 203–1300 solo resumidos: **el literal vive en el chat original** |
| `docs/` | **EXISTE** | Esta carpeta |
| `CLAUDE.md` | **EXISTE** | Punto de entrada automático para sesiones de Claude Code |
| `.env.example` · `.gitignore` | **EXISTE** (en el zip, no en el árbol del repo) | ⚠️ Comprobar que están versionados |

---

## 2. Backend y serverless

| Archivo | Estado | Detalle |
|---|---|---|
| `api/ask-ai.js` | 🔴 **MODIFICAR** | Proxy único a Anthropic. Acepta `{ system, prompt, image?, images? }`. **`model: 'claude-sonnet-4-6'` obsoleto → romperá todo al activar la clave (C-11)**. Considerar leer el modelo de una variable de entorno |
| `supabase/schema.sql` | **MODIFICAR** (solo si aparece un bucket nuevo) | Tabla `app_data` + RLS con 4 políticas + 3 buckets privados (`progreso`, `entrenamiento-videos`, `biblioteca`) con sus políticas por carpeta de usuario. Escrito en **bloques independientes** para poder ejecutar solo el nuevo |
| `public/manifest.json` | **EXISTE** | PWA instalable desde Safari |
| `public/icon-192.png` · `icon-512.png` | **EXISTE** | Tres anillos concéntricos con los 3 primeros colores de `ACCENTS` sobre `COLORS.bg`. ⬜ Falta que Josué confirme que le gustan |

---

## 3. Núcleo de la aplicación

### `src/App.jsx` — **MODIFICAR** (1521 líneas)

El archivo más grande y el más delicado. Contiene:

- **`MORE_NAV`** (19 módulos) y **`AREAS_NAV`** (4 áreas). `AREAS_PROTEGIBLES = ['hoy', ...MORE_NAV]`.
- **Carga inicial**: 21 `loadData()` en paralelo. ⚠️ Los que tienen campos añadidos después deben
  cargarse con `{ ...DEFAULT_X, ...guardado }`.
- **`aplicarTema(temaResuelto, apariencia.altoContraste, accent, temaPersonalizado)`** — llamada
  **síncrona en el cuerpo**, antes de los `return` condicionales.
- **Estado de temas**: `apariencia`, `accent`, `temaPersonalizado`, `temasGuardados`,
  `historialColor`, `temaSistemaOscuro` (con listener de `matchMedia`).
- **Guardado de `ajustes`**: 4 funciones (`updateAccent`, `updateApariencia`, `updateSeguridad`,
  `aplicarConjuntoTema`) que **siempre mandan el paquete completo** con `pin: null`.
- **CRUD de temas**: `guardarTemaComoNuevo`, `renombrarTemaGuardado`, `duplicarTemaGuardado`,
  `eliminarTemaGuardado`, `importarTemaGuardado`, `restablecerTemaOficial` — todos con el límite de
  12 y **sin borrar nada en silencio**.
- **Seguridad**: `pedirVerificacionPin`, `toggleAreaProtegida`, `toggleAccionProtegida`,
  `desbloqueosPin` (memoria), `registrarDesbloqueo`, `estaDesbloqueado`, `enviarRecuperacionPin`,
  `guardarPinTrasFlujo`, migración de PIN en claro y de `pinExtra`, `BloqueoAutomaticoGate`,
  temporizador de inactividad.
- **Deshacer**: `snapshotAndSave(patch)`, `undo()`, `historial` de 10 pasos.
- **Navegación**: `tab`/`setTab`, `renderContent()` (intercepta `area-*` → `HubView`),
  `renderTab()` (envuelve en `PinGate` si procede), `navegarDesdeHoy`, `dashboardFoco`, `focoPara`,
  `consumirFoco`.
- **Cálculos**: `calcularMetricas()` (6 métricas favoritas), `favoritasResueltas`,
  `resumenesTodos`, `derivadosCalendario`, `currentState`.
- **Personalización**: `moreNavPersonalizables` → `ordenIds` → `moreNavOrdenadoConIconos` →
  `moreNavVisible`.
- **`RESET_MODULOS`** (14 módulos) + `borrarDatosModulo(id)`.
- **Elementos fijos**: `SuggestionsButton` (z-30) y buscador universal (z-50), fuera de
  `renderTab()`.

> ⚠️ **Regla dura al tocar este archivo:** todos los `useEffect` y la llamada a `aplicarTema()` van
> **antes** de los `return` condicionales de sesión/carga. Ya se cometió y corrigió el error
> "Rendered more hooks than during the previous render" en A3.

**Le tocan:** R0.1(no) · R0.2 · R0.6 · R2.1 · R2.2 · R3.1 · R4.1 · R4.2 · R5.1 · R5.2 · R8.1

### `src/tokens.js` — **MODIFICAR** (612 líneas)

Toda la configuración normativa: paletas, `aplicarTema()`, los `DEFAULT_*` de cada módulo y ~45
constantes de opciones. Es el punto de entrada de casi cualquier fase.

🔴 **Corregir ya:** el comentario de la línea 137 sobre la densidad (C-01) y marcar `pinExtra` como
vestigial (C-05).

### `src/index.css` — **MODIFICAR** (204 líneas)

Animaciones del sistema de navegación, `--ease-premium`, reglas `html[data-radio]`,
`html[data-animaciones]`, `html[data-reducir-movimiento]`, y el **comentario de advertencia junto a
`.module-enter`** sobre el bug de `containing block`.
⬜ **Le falta:** todo el bloque `html[data-densidad]` (C-01 / R6.1).

### `src/main.jsx` — **EXISTE**

---

## 4. `src/lib/` — 22 módulos

| Archivo | Exports | Estado |
|---|---|---|
| `ai.js` | `AI_SYSTEM`, `askAI`, `askAIWithImage`, `askAIWithImages` | **EXISTE** |
| `biometria.js` | `biometriaSoportada`, `registrarBiometria`, `verificarBiometria` | **EXISTE**. WebAuthn sin servidor — límite documentado en el propio archivo |
| `calendario.js` | `diasDelMes`, `primerDiaSemanaMes`, `isoDeFecha`, `celdasMes`, `eventosDelDia`, `tiposDelDia`, `resumenDelDia`, `eventosFuturos`, `expandirRecurrentes` | **MODIFICAR** (R2.3, R2.4: intervalo y excepciones) |
| `calendarioIntegracion.js` | `eventosDerivados`, `NOMBRES_ORIGEN` | **MODIFICAR** (R2.1 hábitos/rutinas, R2.2 Fe). Desde v1.34.0 deriva también los **usos del Armario** — generados en cada render, nunca copiados (regla 11) |
| `colorEngine.js` ⚠️ `ensureContrast` **corregido en v1.41.0**: elegía la dirección por el orden relativo, así que un color oscuro sobre fondo oscuro se oscurecía hasta el negro sin alcanzar contraste. Ahora la decide el fondo | 23 funciones puras | **EXISTE**. Verificado ejecutándolo con Node |
| `correlaciones.js` | `cruzarPorFecha`, `correlacionSuenoEstudio`, `correlacionSuenoAnimo`, `correlacionEntrenoAnimo` | **EXISTE**. `cruzarPorFecha` es genérica y reutilizable para pares nuevos |
| `exportData.js` | `exportCSV`, `exportXLSX` | **MODIFICAR** (R8.8: exportación completa y PDF) |
| `helpers.js` | `uid`, `hexToRgba`, `shade`, `calcularEdad`, `calcularDuracion`, `formatFecha`, `todayISO`, **`fechaLocalISO`**, `addDays`, `proximaOcurrencia`, `diasHasta`, `fileToBase64` | ⚠️ **`todayISO` y `addDays` arreglados en v1.34.0**: los dos usaban `toISOString()` (UTC) y fallaban en España — `todayISO` devolvía AYER entre las 00:00 y las 02:00, y `addDays` restaba un día entero. |
| `logros.js` | `calcularLogros` | **EXISTE**. 12 insignias binarias, solo lectura. Desde v1.48.0 (RA F1) la mejor racha se **deriva** con `resumenHabito`: antes leía el contador guardado, que se podía inflar desmarcando y volviendo a marcar el mismo día, y con eso se desbloqueaba "Un mes de constancia" sin cumplir nada |
| `views/RachasView.jsx` | `RachasView` (defecto), `TarjetaRacha`, `ResumenRachaHoy`, `Celebracion` | ✅ **CREADO** (v1.51.0, RA F4). El Centro de Rachas: módulo nuevo en el área Vida. **No calcula ni un número** — todo viene de la capa de gamificación. Sin colores propios (funciona en claro y oscuro solo), sin sonido y sin vibración. La celebración es **una sola** aunque coincidan hito, récord y logro |
| `hooks/useRachas.js` · `hooks/useGamificacion.js` | `useRachas`, `useGamificacion` | ✅ **CREADOS** (v1.49.0 y v1.50.0, RA F2 y F3). Envuelven los servicios y memoizan lo caro. **No añaden lógica**: la app no tenía carpeta `hooks/` y ese reparto —lógica pura en `lib/`, estado en `App.jsx`— no se ha tocado |
| `rachasGamificacion.js` | `STREAK_MILESTONES`, `NIVELES_CELEBRACION`, `celebracionDeHito`, `progresoHaciaHito`, `DEFINICIONES_LOGRO`, `definicionLogro`, `ESTADOS_LOGRO`, `claveLogro`, `GAMIFICACION_INICIAL`, `normalizarGamificacion`, `EVENTOS_GAMIFICACION`, `evaluar`, `listaLogros`, `estadisticasGamificacion`, `diasDelMes`, `panelGamificacion`, `revisarLogros`, `revocarLogro`, `olvidarRacha` | ✅ **CREADO** (v1.50.0, RA F3). Capa ENCIMA del motor: no calcula ni una racha. Doce hitos, doce logros, tres niveles de celebración. **Sin XP ni niveles** (los apartados 14 y 15 los dejan en condicional). Un `currentStreak` inventado **no desbloquea nada**, porque todo se deriva del historial. Un logro conseguido no se revoca solo. 118 comprobaciones |
| `rachasServicio.js` | `ESTADO_INICIAL`, `normalizarEstado`, `validarNuevaRacha`, `crearRacha`, `eliminarRacha`, `completarDia`, `deshacerDia`, `invalidarPorOrigen`, `cumplimientosDeOrigen`, `recalcularRacha`, `recalcularTodo`, `revisarIntegridad`, `repararEstado`, `encolar`, `vaciarCola`, `hayPendientes`, `panelRachas`, `panelRacha`, `panelHabitos`, `HITOS`, `EVENTOS_RACHA`, `siguienteHito`, `eventosDeRacha`, `eventosDeHabitos` | ✅ **CREADO** (v1.49.0, RA F2). **El único sitio del proyecto que escribe rachas.** Se guardan en `app_data` con la clave `rachas`, no en tablas propias: la especificación lo permite y así **no hay SQL nuevo que ejecutar**. El modelo **no tiene `user_id`**, así que el cliente no puede pedir la racha de otro. Cola offline idempotente. 104 comprobaciones |
| `rachas.js` | `DEFAULT_RACHAS`, `TIPOS_RACHA`, `CLASES_REGLA`, `claseDeRegla`, `toleranciaDe`, `describirRegla`, `crearRacha`, `normalizarRacha`, `crearEvento`, `claveEvento`, `registrarCumplimiento`, `anularCumplimiento`, `indicePorFecha`, `ESTADOS_DIA`, `estadoDeDia`, `ESTADOS_RACHA`, `estadoRacha`, `rachaActual`, `mejorRacha`, `historialDeRachas`, `estadisticasRacha`, `diasEntre`, `resumenRacha`, `rachaGlobal`, `REGLA_HABITO`, `rachaDeHabito`, `eventosDeHistorial`, `resumenHabito`, `alternarHabito` | ✅ **CREADO** (v1.48.0, RA F1). Motor de rachas puro: **ni un contador guardado**, todo derivado del historial. El día es siempre el **local** de Josué, y un día en curso es PENDIENTE, nunca perdido. Idempotente por `racha + día`. Sin gamificación (apartado 22) — hay una prueba que falla si aparece. 125 comprobaciones |
| `notificaciones.js` | `permisoNotificaciones`, `pedirPermisoNotificaciones`, `notificarSiCorresponde` | **MODIFICAR** (todo el bloque R7) |
| `openFoodFacts.js` | consulta por código de barras | **EXISTE** |
| `pdfText.js` | `extractPdfText` | **EXISTE**. Usa `pdfjs-dist` en el navegador |
| `pin.js` | `generarSalt`, `crearPinHash`, `verificarPin` | **MODIFICAR** (R8.2: longitud configurable, límite de intentos) |
| `predicciones.js` | 6 funciones | **EXISTE**. ⚠️ Del que depende el Calendario (DEP-01) |
| `resumenesHub.js` | `calcularResumenModulo` | **MODIFICAR** al añadir cualquier módulo. 18 `case` + `default`, todos con `{ linea1, linea2, estado }` |
| `supabase.js` | `supabase`, `onAuthChange`, `onAuthEvent`, `loadData`, `saveData`, `sendPasswordReset`, y los 3 tríos de Storage | **EXISTE** |
| `videoFrames.js` | `extractFramesFromSrc` | **EXISTE**. 4 fotogramas con `<video>` + `<canvas>` |
| — | **`i18n.js`** | ⬜ **CREAR** (R5.6) |
| — | **`unidades.js`** | ⬜ **CREAR** (R5.3) — conversión cm/ft-in, kg/lb, °C/°F, km/mi con unidad base interna |
| `puntuacion.js` | `puntuacionDelDia`, `mensajePuntuacion`, `AREAS_PUNTUACION` | ✅ **CREADO** (v1.23.0, R0.2). Puro y probado con Node — 27 comprobaciones |
| `papelera.js` | `CATALOGO_PAPELERA` (31 colecciones), `claveCatalogo`, `prepararEliminacion`, `prepararRestauracion`, `conArrastrados`, `purgarCaducados`, `describirEntrada`, `tiempoDesde`, `diasRestantes`, `ordenarPapelera`, `OPCIONES_RETENCION`, `DEFAULT_PAPELERA` | ✅ **CREADO** (v1.26.0, ME F3). Puro y probado con Node — 73 comprobaciones |
| `armario.js` | `CATEGORIAS_ARMARIO`, `COLORES_ARMARIO`, `ESTADOS_PRENDA`, `TEMPORADAS_PRENDA`, `ORDENES_ARMARIO`, `DEFAULT_ARMARIO`, `crearPrenda`, `actualizarPrenda`, `buscarPrendas`, `filtrarPrendas`, `ordenarPrendas`, `prendasVisibles`, `marcasDe`, `conteoPorCategoria`, `ordenesDisponibles`, `resumenArmario`, y desde AR F2: `ZONAS_OUTFIT`, `crearOutfit`, `actualizarOutfit`, `duplicarOutfit`, `prendasDeOutfit`, `composicionDeOutfit`, `noDisponiblesDeOutfit`, `outfitsConPrenda`, `usoEnOutfits`, `buscarOutfits`, `filtrarOutfits`, `ordenarOutfits`, `outfitsVisibles`, y desde AR F3: `EVENTOS_USO`, `RANGOS_HISTORIAL`, `crearUso`, `actualizarUso`, `usosDeOutfit`, `usosDePrenda`, `resumenDeUso`, `resumenOutfit`, `resumenPrenda`, `diasDesde`, `textoUltimoUso`, `usosDelDia`, `usosPorDia`, `filtrarUsos`, `desdeDelRango`, `lugaresDeUsos`, `personasDeUsos`, `usosHuerfanos`, `resumenHistorial`, `indiceUsoOutfits`, `indiceUsoPrendas`, y desde AR F4: `prendasNoDisponiblesDeOutfit` | ✅ **CREADO** (v1.32.0, AR F1), **ampliado con outfits** (v1.33.0, AR F2) y con el **historial de uso** (v1.34.0, AR F3). Motor puro del Armario. El outfit guarda **`prendaIds`, nunca copias**, y desde AR F3 **no hay ni un contador guardado**: cuántas veces y cuándo se deducen de `armario.usos`. 297 comprobaciones |
| `armarioInteligencia.js` | `PERIODOS_ARMARIO`, `desdeDelPeriodo`, `usosDelPeriodo`, `estadisticasOutfits`, `estadisticasPrendas`, `diversidadArmario`, `estadoRepeticion`, `repeticionDeOutfit`, `prendasMuyRepetidas`, `combinacionesRepetidas`, `outfitsOlvidados`, `prendasInfrautilizadas`, `recomendarOutfits`, `panelInteligente`, `resumenInteligencia` | ✅ **CREADO** (v1.35.0, AR F4). Estadísticas, anti-repetición y recomendaciones. **Consume** `armario.js`, no recalcula relaciones. **Ninguna llamada a la IA**: reglas sobre el historial real, y toda recomendación viene con sus motivos en texto. 108 comprobaciones |
| `fondos.js` | `TIPOS_FONDO`, `FONDOS_INCLUIDOS`, `POSICIONES_FONDO`, `DEFAULT_FONDO`, `normalizarFondo`, `resolverFondo`, `estilosDeFondo`, `estilosDeVelo`, `seleccionarFondo`, `ajustarFondo`, `restablecerFondo`, `tieneFondoGuardado`, `describirFondo`, y desde FO F2: `orientacionDeFoto`, `datosDeFoto`, `encuadreInicial`, `validarFotoFondo`, `aplicarFoto`, `quitarFoto`, `tieneFoto`, y desde FO F3: `estilosDeLuminosidad`, `AJUSTES_PRESENTACION`, `ajustesDe`, `restablecerAjustes`, `tieneAjustes`, `recordarAjustes`, `aplicarFotoConAjustes`, y desde FO F12: `MAX_FOTOS_ANTERIORES`, `recordarFotoAnterior`, `recuperarFoto`, `olvidarFotoAnterior`, `describirFotoAnterior` | ✅ **CREADO** (v1.36.0, FO F1). Sistema central de fondos. Se guarda en `apariencia.fondo`, **no en una clave nueva**. `resolverFondo` nunca devuelve null: el peor caso es el fondo normal de JosStyle (apartado 6). Ampliado en v1.37.0 (FO F2) con la fotografía, en v1.38.0 (FO F3) con el editor y en v1.47.0 (FO F12) con las fotografías sustituidas: la lista de anteriores vive **dentro del propio fondo**, no en la papelera, porque el archivo nunca se borra de Storage. 232 comprobaciones |
| `temaColores.js` | `CAMPOS_COLOR`, `CAMPOS_ALFA`, `normalizarTema`, `restablecerColores`, `tieneColoresPersonalizados`, `aplicarPresetColor`, `coloresYFondoSonIndependientes` | ✅ **CREADO** (v1.39.0, FO F4). Las operaciones puras sobre el tema. **No es un segundo motor de color**: `colorEngine.js` y `aplicarTema` siguen mandando. `restablecerColores()` no recibe el fondo, así que no puede tocarlo. 62 comprobaciones |
| `detectorColores.js` | `LADO_ANALISIS`, `MAX_COLORES`, `TONOS`, `SATURACIONES`, `tonoDe`, `saturacionDe`, `esNeutro`, `analizarPixeles`, `analizarImagen`, `analisisValidoPara`, `sellarAnalisis`, `describirColor` | ✅ **CREADO** (v1.40.0, FO F5). Saca la paleta de la fotografía **en el dispositivo**, sobre un `<canvas>`: sin IA y sin que la foto salga del teléfono. Cada color lleva `peso` e `interes` por separado — el que más ocupa no es el mejor acento. 65 comprobaciones |
| `recomendadorApariencia.js` | `ESTRATEGIAS`, `generarPropuestas`, `aplicarPropuesta`, `guardarApariencia`, `sonDistintas` | ✅ **CREADO** (v1.41.0, FO F6). Cinco apariencias completas a partir del análisis de la foto, **sin IA**. Cada una parte de una estrategia cromática distinta, así que son distintas de verdad (apartado 8). `aplicarPropuesta` no recibe la foto, así que no puede tocarla. 46 comprobaciones |
| `presetsApariencia.js` | `PRESETS_OFICIALES`, `MAX_PRESETS`, `crearPreset`, `normalizarPreset`, `aplicarPreset`, `listaPresets`, `presetActivo`, `duplicarPreset`, `actualizarPreset`, `alternarFavorito`, `esEditable`, `presetTieneFoto` | ✅ **CREADO** (v1.43.0, FO F8). Presets de apariencia COMPLETA, fondo incluido. **Amplía `temasGuardados` (V4)**, no lo sustituye: misma clave de Supabase. "Activo" se compara por lo que se ve, no por id. Desde v1.47.0 (FO F12) los presets **se pueden borrar de verdad**: pasan por la papelera de ME F3, y el que lleva fotografía lo dice en su miniatura. 60 comprobaciones |
| `legibilidad.js` | `UMBRALES`, `NIVELES`, `fondoEfectivo`, `revisarLegibilidad`, `propuestasSobreFoto`, `correccionesDe`, `hayCorrecciones`, `resumenLegibilidad` | ✅ **CREADO** (v1.44.0, FO F9). Audita el contraste **componiendo el fondo efectivo capa a capa** (tema → foto → luz → overlay → tarjeta) y midiendo **por zona** de la fotografía. **Detecta y propone; no cambia nada**. 47 comprobaciones |
| `imagenes.js` | `LADO_FONDO`, `LADO_MINIATURA`, `CALIDAD`, `calcularDimensiones`, `ahorroDe`, `optimizarImagen`, `urlEnCache`, `guardarUrl`, `olvidarUrl`, `urlFirmada` | ✅ **CREADO** (v1.46.0, FO F11). Redimensiona las fotos antes de subirlas (4032×3024 → 1600 px) y cachea las URLs firmadas. **Nunca agranda**, y si la copia pesa más se queda la original. 40 comprobaciones |
| `indiceBusqueda.js` | `construirIndice`, `buscar`, `pareceUnaPregunta`, `sugerenciaDeErrata`, `sugerenciasIniciales`, `analizarIntencion`, `nucleoDeConsulta`, `resolverConsulta`, `normalizar`, `normalizarRaiz`, `PALABRAS_MODULOS`, `SINONIMOS_MODULOS`, `FUNCIONES_AJUSTES`, `ACCIONES_DIRECTAS` | ✅ **CREADO** (v1.29.0, BI F2) y **ampliado a motor completo** (v1.30.0, BI F3): sinónimos, plurales, erratas (Damerau-Levenshtein) y tres tipos de destino. **BI F4** (v1.31.0) le añade la capa de intención: `resolverConsulta` decide qué enseñar y en qué orden, así que los ocho casos de la prueba final son ocho llamadas a una función. Índice de **funciones**, nunca de datos; local, sin red ni IA. Se deriva de `MORE_NAV`, así que un módulo nuevo aparece solo. 129 comprobaciones |
| — | **`revisionPeriodica.js`** | ⬜ **CREAR** (R4.2) — revisión semanal/mensual/anual, solo lectura sobre correlaciones/predicciones/logros |

---

## 5. `src/components/` — 6 archivos

### `ui.jsx` — **MODIFICAR** (695 líneas, 23 componentes exportados)

`Card` (acepta `id` opcional) · `DashboardModuleCard` · `MiniAccessCard` · `QuickActionButton` ·
`ListCard` · `ListRow` · `SectionTitle` · `Field` · `TextInput` · `Textarea` · `Select` ·
`PrimaryButton` · `GhostBtn` · `ToggleTab` · `EmptyHint` · `EntradaPin` · `PinGate` ·
`VerificacionPinModal` · `CrearPinModal` · `RecuperarPinModal` · `AIPanel` · `SuggestionsButton` ·
`UniversalSearchModal` · `ScoreGauge`.

> ⚠️ **`ScoreGauge` usa un id de gradiente SVG fijo (`gaugeGrad`)** — renderizarlo dos veces en la
> misma pantalla rompe el degradado de todos menos uno. Si alguna vez hace falta, **pasarle el id
> como prop antes de reutilizarlo**.
>
> ⚠️ Los 4 modales de este archivo se montan con `createPortal`. Cualquier overlay nuevo, también.
>
> ⚠️ **La firma `buildPrompt()` sin argumentos de `AIPanel` la usan 13 vistas.** No romperla.

⬜ **Componentes que faltarán:** `Toast`/`UndoToast` (R3.11) · `Avatar` con iniciales (R5.1) ·
`Badge`/`IndicadorEstado` para las tarjetas de categoría (R3.10).

| Archivo | Estado |
|---|---|
| `Auth.jsx` | **EXISTE** — registro / inicio / cierre de sesión con Supabase |
| `BarcodeScanner.jsx` | **EXISTE** — `@zxing/library`, cámara trasera, montado con `createPortal` |
| `ColorPicker.jsx` | **EXISTE** — espectro 2D HSV, tono, HEX/RGB/HSL, favoritos/recientes, cuentagotas con detección de función. Separación **preview/commit** |
| `TemaBuilder.jsx` | **EXISTE** — bottom-sheet con una fila por rol; abre el `ColorPicker` anidado |
| `GestionTemas.jsx` | **EXISTE** — galería de 10 presets + CRUD de temas propios tras `modoColorAvanzado` |

---

## 6. `src/views/` — 22 vistas

| Vista | Estado | Notas y qué tarea la toca |
|---|---|---|
| `DashboardView.jsx` (489 l.) | 🔴 **MODIFICAR** | 3 niveles + acciones rápidas + 3 avisos + `IndicadorContexto` + `AccesoCalendarioYAgenda` + métricas favoritas + `ScoreGauge`. **R0.2 / R4.1** (puntuación), **R3.1** (filtrado por `dashboardOcultos`), **R4.2** (revisión periódica) |
| `SettingsView.jsx` (1268 l.) | 🔴 **MODIFICAR** | 12 categorías. La vista más grande después de `App.jsx`. **Casi todo R3, R5, R6, R7, R8 pasa por aquí**. Contiene `OpcionesFila`, `DeportesChips`, `LesionesEditor`, `InfoOnly` |
| `CalendarView.jsx` (694 l.) | **MODIFICAR** | Mes/Agenda, recurrencia, filtros por tipo, búsqueda, `FilaEvento`, `DetalleEventoDerivado`, 3 modales con `createPortal`. **R2.3–R2.6** |
| `TrainingView.jsx` (442 l.) | **EXISTE** | 7 `SkillCard` en rejilla 2×2, 4 subpestañas cada una, fútbol, vídeos. ⬜ `VideosTab` sin compactar a propósito |
| `ProductivityView.jsx` (404 l.) | **MODIFICAR** | **R2.1**: añadir periodicidad al modelo de hábitos y rutinas |
| `EstudiosView.jsx` (402 l.) | **EXISTE** | Programas → asignaturas → exámenes, con deep-link en cascada |
| `NutritionView.jsx` (322 l.) | **EXISTE** | |
| `FaithView.jsx` (297 l.) | **MODIFICAR** | **R2.2**: exponer `fe.eventos` a `eventosDerivados()`. 🔒 Conservar `AVISO_DOCTRINAL` |
| `WellbeingView.jsx` (288 l.) | **EXISTE** | 🔒 Conservar los avisos de limitación real |
| `LibraryView.jsx` (285 l.) | **EXISTE** | ⚠️ Contiene un literal de regex con barras escapadas que da **falso positivo** en el verificador de balance de llaves. El archivo está bien formado |
| `RelationView.jsx` (272 l.) | **EXISTE** | 🔒 Nunca fuera del `PinGate`, nunca en el export |
| `HealthView.jsx` (271 l.) | **MODIFICAR** | **R5.2** (sincronizar peso con Perfil), **D-07** (IMC compartido). ⚠️ El `color: '#EDEFF2'` del icono de borrar foto es **intencionado** (va sobre scrim oscuro fijo) — no "arreglarlo" |
| `PersonalizationView.jsx` (220 l.) | **MODIFICAR** | **R3.1** + **D-09**: aquí debe vivir también el editor de `dashboardOcultos`. Exporta `ICONOS_PERSONALIZABLES_MAP` |
| `PredictionsView.jsx` (208 l.) | **EXISTE** | ⚠️ `colorRiesgo()` es una **función**, no un objeto — un objeto congelaba los colores al cambiar de tema (bug real ya corregido). No volver a convertirlo |
| `ObjectivesView.jsx` (158 l.) | **EXISTE** | |
| `DiaryView.jsx` (158 l.) | **EXISTE** | 🔒 Sin PIN |
| `HubView.jsx` (137 l.) | **EXISTE** | Tarjetas de cristal, cascada 80 ms, `EXPAND_MS` 190 ms |
| `AchievementsView.jsx` (115 l.) | **EXISTE** | 🔒 Insignias binarias |
| `StatsView.jsx` (104 l.) | **EXISTE** | 🔒 Solo lectura |
| `SleepView.jsx` · `FinanceView.jsx` · `BusinessView.jsx` | **EXISTE** | Finance: ⬜ importación CSV y detección de duplicados |

---

## 7. Estado de las 24 claves de datos

Ver `01_ESPECIFICACION_MAESTRA.md` §4.1 para la tabla completa. Resumen de las que **cambiarán**:

| Clave | Cambio pendiente | Tarea |
|---|---|---|
| `personalizacion` | ✅ `pinExtra` marcado vestigial (R0.6). ✅ `ocultos` y `dashboardOcultos` editables desde una sola pantalla (Personalización, ME F1+F2) — **siguen siendo dos listas a propósito**: desactivar saca de todas partes, ocultar solo saca de Inicio | ✅ hecho |
| `productividad` | **Añadir periodicidad** a hábitos y rutinas | R2.1 |
| `perfil` | Añadir `fotoPath`; sincronización de `peso` con Salud | R5.1, R5.2 |
| `notificaciones` | Se amplía mucho: prioridades, tipos, horarios por día, sonidos, historial | R7 |
| `seguridad` | Ampliar `ACCIONES_PROTEGIBLES`; longitud de PIN; intentos fallidos; códigos de recuperación | R8 |
| `ajustes.apariencia` | `densidad` con efecto real | R6.1 |
| `papelera` | ✅ **CREADA** (v1.26.0): `{ elementos: [], retencionDias: 30 }`. Es la clave 22ª → **hoy son 23**. Entra en el snapshot de deshacer, para que papelera y undo no puedan desincronizarse | ✅ hecho |
| `armario` | ✅ **CREADA** (v1.32.0): `{ prendas: [], outfits: [], usos: [] }`. Es la clave 24ª. `outfits` se llenó en v1.33.0 (AR F2) y `usos` en v1.34.0 (AR F3): cada uso es un **registro independiente** con fecha, hora, lugar, personas, ocasión y notas — no una fecha dentro del outfit. Prendas y outfits ya **no guardan contadores**: se derivan de esta lista | ✅ hecho |
| `estudios` | ✅ `programas` ya se puede borrar (v1.27.0), con cascada a asignaturas → exámenes → horas | ✅ hecho |
| — | ⬜ **CREAR** `configBackup` (copia de seguridad versionada de configuración) | R3.4 |
| — | ⬜ **CREAR** `auditoria` (registro de cambios de configuración y eventos de seguridad) | R3.12, R8.7 |

---

## 8. Estado de verificación — la verdad incómoda

| Rango | Verificación disponible |
|---|---|
| **Fases 1–7** | ✅ **Probadas de verdad por Josué en su dispositivo** |
| **Fases 8–21** | 🟡 Código completo + **bundle `esbuild` sin errores**. Nunca ejecutadas |
| **v1.0.1 → v1.22.0** (todo A, N, V, C, S, U, D, L) | 🟡 **Ni siquiera `esbuild`.** Solo: balance de paréntesis/llaves por script, cruce manual de imports contra firmas reales, y —en V1/V2/V3/V4— **ejecución real con Node** de las funciones puras del motor de color |
| **v1.23.0 → v1.27.0** (R0 + bloque ME) | ✅ **`npm` volvió a funcionar.** `vite build` real (2606 módulos), 148 pruebas unitarias con Node, 5 comprobaciones de auditoría, **52 casos de renderizado real** con `react-dom/server` y 9 reglas invariantes — 205 en total, todas verdes |
| **Ninguna versión** | ❌ Nunca se ha abierto la app en un navegador de verdad, con Supabase y con los dedos de Josué |

**Lo que esto significa en la práctica:** hasta v1.22.0, todo era **código cuidadosamente revisado a
mano, no probado**. Desde v1.23.0 el proyecto **compila y se prueba de verdad en cada fase**
(`bash scripts/verificar.sh`), y eso ya ha encontrado **veinte bugs reales** que la revisión a mano
no vio — cinco en R0 (entre ellos una notificación falsa: en JavaScript `null < 7` es `true`), uno
en ME F1, ocho huecos de borrado en ME F4, uno de accesibilidad en BI F2, dos de ranking en BI F3, uno de navegación en BI F4 y uno de carga de módulo en AR F1.

Lo que las pruebas **no** cubren, y sigue pendiente de **R1**: el comportamiento con Supabase real,
la sincronización entre dispositivos, los permisos del navegador, el aspecto en un iPhone y el
recorrido completo tocando la pantalla. Cuando Josué reporte un fallo, **pedirle el mensaje exacto**
— sigue siendo la única fuente de verdad para todo eso.

### `scripts/` — infraestructura de verificación (creada en v1.23.0, ampliada después)

| Archivo | Qué hace |
|---|---|
| `verificar.sh` | Punto de entrada: build + 8 suites de pruebas + 9 reglas invariantes. Sale con código 1 si algo falla |
| `resolver-vite.mjs` | Hook de resolución ESM: deja ejecutar los módulos de `src/` con Node sin cambiar la convención de imports del proyecto |
| `smoke.mjs` | Compila un script JSX con esbuild y lo ejecuta; stubs de `pdfjs-dist`, `@zxing/library` e imports `?url` |
| `smoke-vistas.jsx` | Renderiza 15 vistas × 4 escenarios (vacío / con datos / datos parciales / todo desactivado), y comprueba que ninguna anida botones |
| `comprobar-navegacion.mjs` | Cruza `MORE_NAV` × `AREAS_NAV` × los `case` de `renderTab` × las palabras clave del buscador |
| `auditar-modulos.mjs` | **Auditoría de ME F4**: todo lo creable es borrable, nada se salta la papelera, el catálogo y el código coinciden |
| `test-inicio.jsx` | **BI F1**: el desplegable de situación — cerrado por defecto, sin botones anidados, las tres situaciones activables |
| `test-armario.mjs` | **AR F1+F2**: el modelo de datos, la búsqueda por color y marca, los filtros, el orden, y las pruebas obligatorias de outfits — duplicar sin tocar el original, eliminar sin borrar prendas, y una prenda borrada que no rompe nada |
| `test-buscador.mjs` | **BI F2+F3+F4**: las nueve búsquedas del control de calidad, las seis categorías obligatorias del apartado 22, el ranking, la desambiguación, los ocho casos de la prueba final del apartado 20 y que el motor no toca la red |
| `test-puntuacion.mjs` · `test-personalizacion.mjs` · `test-papelera.mjs` · `test-modulos.jsx` | 27 + 28 + 73 + 20 comprobaciones |

**Lo único verificado ejecutándolo:** `colorEngine.js` y `aplicarTema()` con Node (round-trips
exactos, contraste AA garantizado en los 24 casos de acento × tema, casos límite de fondo/texto casi
negro y casi blanco recuperados por `ensureContrast`, límite de temas guardados bloqueando en el
tope).
