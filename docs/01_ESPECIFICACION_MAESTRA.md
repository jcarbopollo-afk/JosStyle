# JosStyle — ESPECIFICACIÓN MAESTRA CONSOLIDADA

> Documento único de referencia funcional y técnica. Integra, sin recortar, todo lo definido en:
> el **Prompt Maestro de 21 fases** (HANDOFF §0), la **Especificación funcional de Ajustes /
> Entrega 1** (1300 apartados), los **cuatro prompts propios posteriores** (Navegación por áreas,
> Personalización Visual Extrema, Calendario Universal, Seguridad Centralizada), las **tres
> especificaciones puntuales** (Optimización móvil de 12 apartados, Dashboard–Centro de Control de
> 23 apartados, Ajuste de indicador + Agenda), y el **código real** del proyecto en v1.22.0.
>
> Convención de estado usada en todo el documento:
> **✅ construido** · **🟡 construido parcialmente** · **⬜ especificado, no construido** ·
> **⛔ imposible con la arquitectura actual / descartado explícitamente**

---

## ÍNDICE

1. [Identidad, usuario y contexto operativo](#1-identidad-usuario-y-contexto-operativo)
2. [Visión, filosofía y principios inviolables](#2-visión-filosofía-y-principios-inviolables)
3. [Arquitectura técnica real](#3-arquitectura-técnica-real)
4. [Modelo de datos completo](#4-modelo-de-datos-completo)
5. [Sistema de diseño y motor de color](#5-sistema-de-diseño-y-motor-de-color)
6. [Navegación](#6-navegación)
7. [Especificación módulo a módulo](#7-especificación-módulo-a-módulo)
8. [Sistemas transversales](#8-sistemas-transversales)
9. [Módulo Ajustes — especificación normativa (apartados 1–202)](#9-módulo-ajustes--especificación-normativa-apartados-1202)
10. [AXION — apartados 203–1300](#10-axion--apartados-2031300)
11. [Reglas inviolables del producto](#11-reglas-inviolables-del-producto)
12. [Convenciones de código y patrones establecidos](#12-convenciones-de-código-y-patrones-establecidos)
13. [Limitaciones técnicas permanentes](#13-limitaciones-técnicas-permanentes)

---

## 1. Identidad, usuario y contexto operativo

### 1.1 Qué es el producto

Una **Progressive Web App (PWA) personal** — un "sistema operativo personal" — que centraliza y
analiza con IA todos los ámbitos de la vida de un único usuario: salud, sueño, nutrición, calistenia,
fútbol informal, estudios (Bachillerato de Ciencias + música), negocio personal, economía,
productividad, objetivos a largo plazo, diario, biblioteca de materiales, relación de pareja (módulo
privado), bienestar digital, vida espiritual y calendario transversal.

**No es una app de hábitos genérica.** Es una plataforma modular, escalable a años vista, diseñada
para que cada dato introducido alimente un sistema de análisis (correlaciones, predicciones,
patrones). La IA **analiza y sugiere, nunca decide**.

### 1.2 El usuario

- **Josué**, nacido el **29/07/2010** — la edad se recalcula siempre, nunca se escribe fija.
- Perfil por defecto: **altura 187 cm, peso 72 kg, actividad "moderado"**.
- Cursa **1º de Bachillerato de Ciencias (rama Biología)** y estudia **música** en paralelo.
- Entrena **calistenia** (7 habilidades) y juega **fútbol informal**.
- Practica una **fe cristiana con servicio activo** — el módulo se trata con respeto y **sin
  autoridad doctrinal**.
- **Tiene pareja** — módulo privado protegido por PIN.
- **No tiene ordenador.** Todo lo técnico lo hace desde el **iPhone**.

### 1.3 Contexto operativo (crítico para cualquier sesión futura)

- **Despliega vía Vercel.** ⚠️ **No usa Replit.** Todas las menciones a Replit en `CHANGELOG.md` son
  historia obsoleta y **no deben reabrirse ni investigarse**. El "atasco exponiendo el puerto en
  Replit" nunca fue real para su flujo.
- **No se conoce el detalle exacto** de cómo edita/sube código desde el iPhone hacia Vercel
  (repositorio Git con auto-deploy, dashboard de Vercel, u otro). **No asumirlo** — preguntárselo si
  hace falta para depurar un despliegue real.
- **Rota entre varias cuentas gratuitas de Claude**, pasando `HANDOFF.md` + zip de una conversación a
  otra. Puede haber resuelto en otra conversación algo que aquí parece pendiente.
- **Pide encadenar fases sin esperar confirmación real de cada una**, dejando el pulido para el
  final. Se construye **una fase por turno**, sin adelantar la siguiente.
- **Lo que más le importa en cada turno es recibir el zip/entrega actualizado cuanto antes** —
  priorizarlo sobre explicaciones largas; nunca dejar un turno a medias sin entregarlo.
- **Claude nunca ha ejecutado la app de verdad.** Todo lo construido desde v1.0.1 se ha verificado
  leyendo código y comprobando balance de llaves por script; el entorno de la IA no tiene acceso al
  registro de npm (`403`), así que ni `esbuild` ni `npm install` ni `npm run dev` han podido correr.

---

## 2. Visión, filosofía y principios inviolables

Los seis principios que rigen cualquier decisión de producto, en orden de prioridad:

1. **Los datos se introducen para ser analizados, no solo almacenados.**
2. **La IA es complementaria, nunca decisoria.** Nunca se dispara sola: siempre a un toque
   explícito del usuario.
3. **Simplicidad y elegancia por encima de acumular funciones.**
4. **Arquitectura modular y escalable desde el modelo de datos.**
5. **Nivel de diseño premium** — referencias explícitas de Josué: **Apple, Cal AI, Symmetry**.
   Modo claro y modo oscuro, ambos disponibles.
6. **Honestidad radical sobre las limitaciones.** Nunca simular una función que no existe, nunca
   mostrar un control que no hace nada, nunca inventar una cifra que no se puede calcular. Si algo
   no es posible, se dice con una frase corta en la propia interfaz.

Y tres reglas de producto específicas heredadas del Prompt Maestro:

- **Las rachas de hábitos se pausan, no se rompen** (Fase 8).
- **Los objetivos son fijos pero es normal y sano que evolucionen** a los 16 años (Fase 9).
- **La biblioteca es material de referencia, no otro sistema de tareas** (Fase 11) — solo guardar
  y buscar, sin estados de progreso ni recordatorios.

---

## 3. Arquitectura técnica real

> Esta sección describe **lo que hay**, no lo que la especificación de AXION imagina. La distancia
> entre ambas cosas está analizada en la [sección 10](#10-axion--apartados-2031300).

### 3.1 Pila tecnológica

| Capa | Tecnología | Notas |
|---|---|---|
| Build | **Vite 5.3** + `@vitejs/plugin-react` | `vite.config.js`, `postcss.config.js` |
| UI | **React 18.3** | Sin router. La navegación es un `useState` (`tab`) en `App.jsx` |
| Estilos | **Tailwind 3.4** + `src/index.css` | Todos los colores por token, nunca hex suelto |
| Iconos | **lucide-react 0.383** | Familia única. Verificar que un icono existe en esta versión antes de usarlo |
| Gráficas | **recharts 2.12** | |
| Backend | **Supabase** (`@supabase/supabase-js` 2.45) | Auth email/contraseña + tabla `app_data` + Storage |
| IA | **1 función serverless** `api/ask-ai.js` en Vercel | Proxy único a la API de Anthropic |
| PDF | **pdfjs-dist 4.6** | Extracción de texto en el navegador |
| Códigos de barras | **@zxing/library 0.21** | Elegido porque Safari/iOS no soporta `BarcodeDetector` |
| Export | **papaparse 5.4** + **xlsx 0.18** | CSV y Excel |

**Sin dependencias npm nuevas desde la Fase 13.** Cualquier fase futura que necesite una debe
avisar explícitamente a Josué de que tiene que ejecutar `npm install`.

### 3.2 Persistencia

- **Una única tabla genérica** `app_data (user_id uuid, key text, value jsonb, updated_at,
  primary key (user_id, key))` con **RLS** activo — 4 políticas (select/insert/update/delete
  propias). Definida en `supabase/schema.sql`.
- `loadData(userId, key, fallback)` / `saveData(userId, key, value)` en `src/lib/supabase.js`.
- ⚠️ **`saveData` hace upsert del valor entero: sobrescribe, no fusiona.** Cualquier función que
  guarde una clave compartida (`ajustes`) debe mandar **siempre el paquete completo**.
- ⚠️ **`loadData` no fusiona con el valor por defecto.** Cualquier campo nuevo añadido a un
  `DEFAULT_X` debe cargarse con `{ ...DEFAULT_X, ...guardado }` o quedará `undefined` para un
  usuario con datos previos. Este bug ya se ha producido tres veces (Perfil/A2, apariencia/A3,
  personalizacion/Dashboard) y las tres se corrigieron con ese patrón.
- **Tres buckets de Storage privados**: `progreso` (fotos de Salud), `entrenamiento-videos`
  (vídeos de Calistenia, límite 100 MB, mp4/mov/webm), `biblioteca` (pdf/vídeo/foto). Ninguno
  público jamás; se sirven con **URL firmada de 1 hora**.

### 3.3 Función serverless de IA

`api/ask-ai.js` — POST, cuerpo `{ system, prompt, image?, images? }`.
- Es el **único** sitio donde puede vivir `ANTHROPIC_API_KEY` (variable de entorno de servidor).
- Si falta la clave devuelve `503` con un mensaje claro y **la app entera sigue funcionando**; los
  paneles de IA muestran el aviso de "IA no configurada".
- Soporta texto, **una imagen** (`image`, usado por el escaneo de comida) y **varias imágenes**
  (`images`, usado por el análisis de fotogramas de vídeo).
- ⚠️ **`model: 'claude-sonnet-4-6'` está obsoleto** — ver `03_CONTRADICCIONES...` **C-11**. En
  cuanto se active la clave, todas las llamadas fallarán hasta actualizarlo.

### 3.4 Variables de entorno

```
VITE_SUPABASE_URL        # cliente, ya configurada
VITE_SUPABASE_ANON_KEY   # cliente, formato "publishable" — no es secreto
ANTHROPIC_API_KEY        # SOLO servidor, opcional, SIN ACTIVAR por decisión consciente de Josué
```

### 3.5 Estructura de carpetas real (v1.22.0)

```
JC Fitness/
├── package.json (v1.22.0) · vite.config.js · tailwind.config.js · postcss.config.js
├── index.html · README.md · SETUP.md
├── HANDOFF.md · CHANGELOG.md · ESPECIFICACION_AJUSTES_ENTREGA1.md
├── docs/                        ← esta carpeta (análisis consolidado)
├── api/ask-ai.js                (proxy IA)
├── supabase/schema.sql          (tabla app_data + 3 buckets + políticas)
├── public/manifest.json · icon-192.png · icon-512.png
└── src/
    ├── main.jsx · App.jsx (1521 líneas) · index.css · tokens.js (612 líneas)
    ├── lib/   ai · biometria · calendario · calendarioIntegracion · colorEngine ·
    │          correlaciones · exportData · helpers · logros · notificaciones ·
    │          openFoodFacts · pdfText · pin · predicciones · resumenesHub ·
    │          supabase · videoFrames                                   (18 archivos)
    ├── components/  ui.jsx (695 líneas, 23 componentes) · Auth · BarcodeScanner ·
    │                ColorPicker · TemaBuilder · GestionTemas            (6 archivos)
    └── views/  Dashboard · Sleep · Training · Nutrition · Health · Finance · Estudios ·
                Business · Productivity · Objectives · Calendar · Diary · Faith ·
                Library · Relation · Wellbeing · Stats · Predictions · Achievements ·
                Hub · Personalization · Settings                        (22 archivos)
```

---

## 4. Modelo de datos completo

### 4.1 Las 22 claves de `app_data`

Cada fila de `app_data` es `(user_id, key) → value jsonb`. Columna **Deshacer**: si pasa por
`snapshotAndSave` (histórico de 10 pasos + botón "Deshacer último cambio") o si se guarda directo.

| Clave | Forma | Deshacer | Export CSV/Excel | Notas |
|---|---|---|---|---|
| `ajustes` | `{ accent, pin: null, apariencia, seguridad }` | directo | no | ⚠️ **`pin` se escribe siempre a `null`** desde la Seguridad Centralizada; el PIN real vive hasheado en `seguridad`. Las 4 funciones que la guardan mandan el paquete completo |
| `perfil` | `DEFAULT_PERFIL` (26 campos) | directo | no | Single Source of Truth de identidad |
| `sueno` | `[{ id, fecha, horaAcostar, horaLevantar, calidad, notas }]` | sí | sí | |
| `calistenia` | `{ [skill]: { nivel, progresion[], prs[], sesiones[] } }` × 7 habilidades | sí | sí (PRs incl.) | |
| `calisteniaVideos` | `[{ id, skill, path, fecha, analisis, comparar }]` | **no** | no | archivo en Storage |
| `futbol` | `[{ id, fecha, ... }]` | sí | sí | registro ligero de partidos |
| `economia` | `{ saldoInicial, hucha, movimientos[] }` | sí | sí | |
| `salud` | `{ medidas[], historial[] }` | sí | sí | medidas: peso/grasa/FC/tensión/notas |
| `saludFotos` | `[{ id, path, fecha, nota }]` | **no** | no | archivo en Storage · protegido por acción `fotos_privadas` |
| `nutricion` | `{ comidas[], agua{}, favoritos[] }` | sí | sí | |
| `estudios` | `{ programas[], asignaturas[], examenes[], horas[] }` | sí | sí | listas planas relacionadas por `id` |
| `negocio` | `{ proyectos[] }` | sí | sí | deliberadamente mínimo |
| `productividad` | `{ habitos[], rutinas[], tareas[], metas[], pomodoros{} }` | sí (`pomodoros` **no**) | sí (rutinas/pomodoros no) | |
| `objetivos` | `{ lista[], ultimaRevision }` | sí (`ultimaRevision` **no**) | sí | |
| `calendario` | `{ eventos[] }` | sí | sí (solo `origen: 'calendario'`) | |
| `diario` | `{ entradas[] }` — una por día | sí | sí | |
| `biblioteca` | `{ apuntes[], enlaces[] }` | sí | sí | texto puro |
| `bibliotecaArchivos` | `[{ id, tipo, titulo, path, textoExtraido }]` | **no** | no | archivo en Storage |
| `relacion` | `{ nombre, fechas[] }` | sí | ⛔ **NUNCA** | único módulo con PIN de principio a fin |
| `fe` | `{ servicio[], eventos[], diario[], objetivos[] }` | sí | sí | |
| `bienestar` | `{ registros[], reflexiones[], sesiones[] }` | sí | sí | |
| `personalizacion` | `{ orden[], ocultos[], iconos{}, pinExtra[], favoritas[], modo, dashboardOcultos[] }` | directo | no | `pinExtra` es **vestigial** (ver D-08) |
| `notificaciones` | `{ activadas, categorias{10}, horarioDescansoActivo/Inicio/Fin }` | directo | no | |
| `historialColor` | `{ recientes[≤12], favoritos[≤24] }` | directo | no | |
| `temaPersonalizado` | `{ secundario, terciario, fondo, superficie, texto, bordes, estados{4} }` | directo | no | `null` en un campo = automático |
| `temasGuardados` | `[{ id, nombre, tema, accent, temaPersonalizado }]` máx. **12** | directo | no | |
| `historial` | `[≤10 snapshots]` | — | no | motor de deshacer |

**Regla de oro del modelo de datos:** *cualquier dato que implique un archivo real en Storage, o que
no tenga sentido "deshacer" (preferencias de interfaz, contadores ya consumidos), se guarda directo
con `saveData` y nunca pasa por `snapshotAndSave`.*

### 4.2 Datos que existen fuera de Supabase

- **`desbloqueosPin`** — mapa en memoria (`clave → timestamp`) de sesiones de desbloqueo temporal
  del PIN. **Nunca se persiste**, a propósito: cerrar y reabrir la app la reinicia sola.
- **`localStorage`** — marca de "este aviso ya se notificó hoy" del sistema de notificaciones. Es un
  detalle de dispositivo (apartado 134), no un dato a sincronizar.

### 4.3 Constantes normativas de `src/tokens.js`

`SKILLS` (7 habilidades) · `ACTIVIDAD_FACTORES` · `SEXOS_PERFIL` · `MANOS_DOMINANTES` ·
`OBJETIVOS_PRINCIPALES` · `DEPORTES_DISPONIBLES` · `NIVELES_DEPORTIVOS` ·
`ANIOS_EXPERIENCIA_OPCIONES` · `ESTADOS_LESION` · `NIVELES_EDUCATIVOS` · `IDIOMAS_DISPONIBLES`
(solo `es`) · `SISTEMAS_UNIDADES` · `TIPOS_HISTORIAL_MEDICO` · `VASO_ML` (250) ·
`DEFAULT_PROGRAMAS_ESTUDIO` · `ESTADOS_NEGOCIO` · `PERIODOS_META` · `PLAZOS_OBJETIVO` ·
`DIAS_ENTRE_REVISIONES` (30) · `ESTADOS_ANIMO` · `TIPOS_ARCHIVO_BIBLIOTECA` ·
`TIPOS_FECHA_RELACION` · `TIPOS_SERVICIO_FE` · `TIPOS_EVENTO_FE` · `CATEGORIAS_TIEMPO_USO` ·
`DURACIONES_CONCENTRACION` · `ICONOS_PERSONALIZABLES_IDS` (8) ·
`METRICAS_FAVORITAS_DISPONIBLES` (6) · `MAX_METRICAS_FAVORITAS` (4) · `MODOS_APP` (3) ·
`CATEGORIAS_NOTIFICACION` (10) · `OPCIONES_BLOQUEO_AUTOMATICO` (6) · `OPCIONES_SESION_PIN` (5) ·
`ACCIONES_PROTEGIBLES` (3) · `TIPOS_EVENTO_CALENDARIO` (8) · `FRECUENCIAS_RECURRENCIA` (4) ·
`PALETAS_PREDEFINIDAS` (10) · `MAX_TEMAS_GUARDADOS` (12) · `MAX_COLORES_RECIENTES` (12) ·
`MAX_COLORES_FAVORITOS` (24) · `TEMAS_DISPONIBLES` · `TAMANOS_TEXTO` · `DENSIDADES_INTERFAZ` ·
`RADIOS_BORDE` · `NIVELES_ANIMACION`.

---

## 5. Sistema de diseño y motor de color

### 5.1 El principio arquitectónico que no se puede romper

**`COLORS` en `src/tokens.js` es un objeto singleton mutable.** Las ~22 vistas lo consumen
**por referencia** (`COLORS.texto`), **nunca desestructurado**. `aplicarTema()` lo muta en el sitio
con `Object.assign(COLORS, ...)` de forma **síncrona en el cuerpo de `App.jsx`, antes de los
`return` condicionales** de sesión/carga.

> ⚠️ **Nunca escribir `const { x } = COLORS` en ningún archivo.** Rompería el sistema de temas
> completo. Ya se verificó con `grep` que hoy no ocurre en ningún sitio: es una condición
> necesaria, no una preferencia de estilo.
>
> ⚠️ **Nunca crear un segundo sistema de tokens en paralelo.** Cualquier rol de color nuevo se
> calcula en `colorEngine.js` como función pura y se aplica con `Object.assign(COLORS, ...)`
> dentro de `aplicarTema()`.

### 5.2 Firma del motor

```js
aplicarTema(nombreResuelto, altoContraste, accentHex, temaPersonalizado)
```

Orden de operaciones, siempre el mismo:
1. Aplica la paleta base del tema (`COLORS_OSCURO` o `COLORS_CLARO`).
2. Si `altoContraste`, superpone `CONTRASTE_ALTO_OSCURO` / `CONTRASTE_ALTO_CLARO` (solo `textMuted`
   y `border`).
3. Calcula y aplica los **roles derivados del acento** vía `buildRolesFromAccent`.
4. Deriva **Secundario/Terciario** por rotación de tono (±35°, esquema análogo) salvo que
   `temaPersonalizado` los fije a mano; genera sus escalas de 11 pasos y su texto legible encima.
5. Aplica overrides directos de Fondo/Superficie/Texto/Bordes y de los 4 Estados si existen.
6. **Red de seguridad, siempre lo último:** recalcula `text`/`textMuted` con `ensureContrast`
   contra el `bg` efectivo. **Ninguna combinación manual puede dejar la app ilegible.**

### 5.3 `src/lib/colorEngine.js` — 23 funciones puras

Conversión `HEX ↔ RGB ↔ HSL ↔ HSV ↔ OKLCH` (fórmulas de Björn Ottosson, las de CSS Color 4,
escritas a mano por falta de acceso a npm) · `rotateHue` · `mix` · `relativeLuminance` ·
`contrastRatio` · `ensureContrast` · `bestReadableText` · `generateScale` (11 pasos, 50–950) ·
`buildRolesFromAccent` (escala de marca, `textOnAccent`, bordes/textos secundarios y terciarios,
5 estados de interacción, 4 efectos).

Verificado ejecutando el motor con Node: round-trips exactos, y **los 12 acentos de `ACCENTS` dan
contraste WCAG AA (≥4.5:1) garantizado en ambos temas**. El *gamut mapping* de `oklchToHex` está
simplificado a clamping directo — puede perder algo de croma en extremos muy saturados, nunca
produce un color inválido.

### 5.4 Roles semánticos fijos

`positive` / `warning` / `negative` / `info` **no se derivan del acento**, se curan por tema. Un
color de estado que cambiara con la personalización sería una regresión de usabilidad. Son
personalizables, pero solo desde una sección **"Estados avanzados" colapsada por defecto y con
aviso explícito** dentro de `TemaBuilder`.

### 5.5 Escala tipográfica y ritmo visual

- Familia principal: **Manrope** para títulos (`fontFamily: "'Manrope', sans-serif"` en línea).
- Escala cerrada: `text-xs` / `text-sm` / `text-lg font-bold` / `text-2xl font-extrabold` /
  `text-3xl font-extrabold`. **Nunca tamaños arbitrarios.**
- Iconos junto a cabeceras `text-sm font-semibold` → siempre `size={16}`.
- Espaciado normativo de Ajustes (apartado 20): entre bloques 32 px · entre elementos 16 px · entre
  título y descripción 8 px · entre icono y texto 12 px · padding interno 20–24 px.
- Componentes de layout compartidos: `Card` · `ListCard`/`ListRow` (una sola tarjeta con filas
  separadas por borde fino, en vez de una tarjeta por fila) · `SectionTitle` · `ToggleTab` ·
  `EmptyHint`.

### 5.6 Animaciones

- Curva compartida `--ease-premium: cubic-bezier(0.32, 0.72, 0, 1)` (deceleración enfática tipo iOS).
- `hubCardIn` (420 ms, cascada de 80 ms entre tarjetas — **el stagger no se toca, petición
  explícita**) · `moduleSlideIn` (340 ms) · `hubHeaderIn` · `backBarIn` · `hubCardExpand`
  (190 ms, `EXPAND_MS`) · `calendarMonthIn` · `calendarSheetIn`.
- Duraciones normativas de la especificación (apartado 96): microinteracciones 100–150 ms · cambio
  de estado 150–250 ms · cambio de pantalla 250–350 ms · paneles 200–300 ms · diálogos 200–250 ms ·
  tarjetas de Ajustes **nunca >220 ms**.
- Curvas normativas (97): entrada = Ease Out · salida = Ease In · cambio de estado = Ease In-Out.
- **Todo se neutraliza** con `html[data-animaciones='desactivadas']` y
  `html[data-reducir-movimiento='true']`, que fuerzan `animation-duration`/`transition-duration` a
  `0.01ms` sobre `*` sin excepción. Mismo mecanismo que `@media (prefers-reduced-motion: reduce)`.

### 5.7 ⚠️ La trampa del `containing block` (bug ya corregido, no reintroducir)

`.module-enter` usa `animation-fill-mode: both`, lo que deja un `transform` aplicado **para
siempre** sobre el contenedor de cada pantalla. Por especificación CSS, cualquier `transform`
distinto de `none` convierte a ese elemento en el *containing block* de sus descendientes
`position: fixed` — así que un modal `fixed inset-0` anidado ahí se anclaba al alto del contenedor
en vez de al viewport, y "aparecía abajo del todo".

**Solución aplicada a los 10 overlays de la app: `React.createPortal(..., document.body)`.**
Hay un comentario junto a `.module-enter` en `index.css` para que nadie lo reintroduzca.

> **Regla permanente: cualquier overlay `fixed inset-0` nuevo DEBE montarse con `createPortal`.**

---

## 6. Navegación

### 6.1 Barra inferior — exactamente 5 pestañas, siempre

`🏠 Inicio` · `❤️ Salud` · `📚 Vida` · `💼 Gestión` · `☰ Más`

> **Nunca añadir una sexta pestaña.** Regla explícita de Josué y repetida en el prompt del
> Calendario. Un módulo nuevo entra dentro de un área existente, nunca en la barra.

### 6.2 Hubs de área

Tocar cualquier pestaña que no sea Inicio abre primero un **hub** (`HubView.jsx`): tarjetas grandes
de cristal (translúcidas, `backdrop-filter: blur(18px)`, brillo diagonal), nunca botones pequeños ni
acceso directo al módulo. Cada tarjeta lleva **icono, nombre, resumen real de 2 líneas, indicador de
estado y flecha**.

- El resumen lo calcula `src/lib/resumenesHub.js` → `calcularResumenModulo(id, estado)`, que
  devuelve `{ linea1, linea2, estado }` con `estado ∈ 'activo' | 'vacio' | 'info'`. **Nunca una
  cifra inventada**: si un módulo no tiene datos, la tarjeta lo dice ("Sin registros todavía,
  toca para añadir el primero").
- Solo dos señales honestas de estado (`activo`/`vacio`) más `info` para los módulos de solo
  lectura. **Nunca un semáforo de urgencia** que la app no pueda respaldar con datos.

### 6.3 Reparto de módulos por área (`AREAS_NAV`)

| Área | Módulos |
|---|---|
| **Salud** | salud · sueno · nutricion · entreno |
| **Vida** | **calendario** · estudios · productividad · objetivos · diario · biblioteca |
| **Gestión** | economia · negocio |
| **Más** | relacion · fe · bienestar · estadisticas · predicciones · logros · **ajustes** (fijo al final) |

`MORE_NAV` (19 entradas) es el catálogo plano de todos los módulos; `AREAS_NAV` los agrupa sin
duplicar la definición. Los 19 ids aparecen exactamente una vez.

### 6.4 Microinteracción de tarjeta de hub (secuencia exacta pedida por Josué)

`:active` CSS inmediato (encoge + aclara + sombra) → `.hub-card-expanding` (escala 1.03, brillo,
sombra profunda, `z-index` por delante) mientras las demás retroceden (`.hub-card-receding`) →
**solo tras `EXPAND_MS` (190 ms)** ocurre la navegación real → `moduleSlideIn` de la pantalla nueva.
El `setTimeout` se cancela si el hub se desmonta a medio gesto.

### 6.5 Barra "← {Área}"

Al entrar en un módulo desde un hub aparece arriba una **píldora** "← {Área}" que devuelve al hub,
no a Inicio. Todo alcanzable en **menos de 2 toques**.

### 6.6 Deep-link desde "Hoy" (sin router paralelo)

`App.jsx` tiene **un único estado** `dashboardFoco` y **una única función** `navegarDesdeHoy(modulo,
foco)` que por dentro es el `setTab(modulo)` de siempre. `focoPara(modulo)` filtra el foco para que
cada vista solo reciba el suyo. Cada vista de destino lo consume **una sola vez** y llama a
`onFocoConsumido()`.

Vistas que interpretan `foco` hoy: **SleepView** (`accion` → abre alta) · **FinanceView**
(`accion`) · **ObjectivesView** (`id` → scroll + halo 2,2 s; `accion:'nuevo'` → enfoca campo) ·
**TrainingView** (`skill` → subpestaña + autoexpande `SkillCard`) · **EstudiosView** (`examenId` →
cascada programa→asignatura→examen) · **ProductivityView** (`sub`, `tareaId`, `accion:'nueva'`) ·
**CalendarView** (`vista:'agenda'` → cambia el toggle Mes/Agenda).

**PIN y deep-link conviven sin caso especial:** `PinGate` no monta a sus hijos hasta estar
desbloqueado, así que el foco pendiente simplemente espera y se aplica al meter el PIN.

### 6.7 Elementos globales fijos

Fuera de `renderTab()`, con `position: fixed`: **panel de sugerencias de IA** (bombilla, arriba a la
izquierda, `z-30`) y **buscador universal** (arriba a la derecha, `z-50`). El contenedor principal
usa `pt-16` para dejarles sitio.

---

## 7. Especificación módulo a módulo

> Para cada módulo: **qué pide el Prompt Maestro** (fuente normativa) → **qué está construido** →
> **qué queda**. Las decisiones marcadas 🔒 son reglas inviolables, repetidas en la
> [sección 11](#11-reglas-inviolables-del-producto).

### 7.1 Dashboard "Hoy" — Centro de Control ✅ / 🟡

**Pedido** (Fase 1 + especificación propia de 23 apartados + ajustes posteriores): que "Hoy" no sea
un resumen pasivo sino un centro de control desde el que ver el estado de casi cualquier área y
**pulsar cualquier elemento representado para llegar directo a él**, incluido el elemento concreto.
Regla de oro literal: **"no quiero tarjetas bonitas que no hagan nada"**.

**Construido:**
- Saludo contextual + fecha larga en español.
- **`IndicadorContexto`** — acordeón siempre visible (Viaje / Vacaciones / Exámenes / **Rutina
  normal**), cerrado por defecto, una sola línea de alto, expansión in-place con transición real
  (`grid-template-rows` 0fr↔1fr) y flecha rotando 180°. Muestra los `tips` de `MODOS_APP`.
- **Puntuación diaria** (`ScoreGauge`, /100) — 🟡 ver **C-12**: la fórmula actual no es "de hoy".
- **Nivel 1** (rejilla 2×2): Sueño · Entreno (deep-link a la habilidad más reciente o de mayor
  progreso) · Objetivos (deep-link al primer objetivo sin cumplir) · Estudios (deep-link al examen
  más próximo).
- **Nivel 2** (rejilla 2×2): Economía y Nutrición (reutilizan `calcularResumenModulo`) ·
  Productividad (deep-link a la tarea pendiente más próxima) · Salud (peso + IMC).
- **Nivel 3**: fila de 6 mini-accesos de solo icono — Diario, Negocio, Relación, Biblioteca, Fe,
  Bienestar. 🔒 **Sin resumen de datos a propósito**, para que Relación nunca se asome fuera de su
  pantalla.
- **Acciones rápidas**: Sueño · Gasto · Tarea · Objetivo — abren directamente el formulario de alta
  ya existente en su vista. Píldoras deliberadamente distintas de una tarjeta, para no mezclar
  "pulsar para ver" con "pulsar para crear".
- **Métricas favoritas** (hasta 4 de 6), ahora también pulsables.
- **`AccesoCalendarioYAgenda`**: dos tarjetas compactas en una fila — Calendario (resumen de hoy) y
  Agenda (nº de eventos de hoy, entra directo a la vista Agenda).
- **Recordatorio de pareja** — etiqueta + cuenta atrás de la próxima fecha, **sin pedir PIN**
  (el detalle completo sigue protegido).
- **Tres automatizaciones fijas**, calculadas al vuelo, sin datos nuevos: `AvisoSuenoCorto`
  (< 7 h anoche) · `AvisoRachaEnRiesgo` (hábito con racha ≥3 sin marcar hoy ni ayer) ·
  `AvisoExamenSinHoras` (examen en ≤3 días sin horas registradas esa semana). Las tres disparan
  también notificación real del sistema si procede.
- `dashboardOcultos` en `DEFAULT_PERSONALIZACION` + función `oculto(id)` que ya filtra.

**Queda:** ⬜ el **editor de `dashboardOcultos`** en Ajustes (modelo y filtrado listos, falta la UI) ·
⬜ ampliar "Acciones rápidas" · ⬜ botón "Ver detalles" del indicador si `MODOS_APP` crece ·
⬜ **arreglar la puntuación diaria** (C-12) · ⬜ **widgets con configuración individual**
(apartados 104–106).

---

### 7.2 Sueño ✅

**Pedido** (Fase 1): registro de sueño, pestaña separada de Salud y Nutrición.
**Construido:** alta (hora de acostarse / levantarse / calidad / notas), duración calculada
(`calcularDuracion`), lista de registros recientes en `ListCard`/`ListRow`, `AIPanel`, deep-link
`accion` que abre el formulario. Correlaciona con Estudios y con el ánimo del Diario.

---

### 7.3 Entrenamiento — Calistenia + Fútbol ✅

**Pedido** (Fase 5): progresiones editables (IA, manual o mixto) para **Handstand, Front Lever,
Back Lever, Planche, Human Flag, Muscle Up, L-Sit**; subida de vídeo y análisis de técnica por
fotogramas; comparación mes a mes; avisos de sobreentrenamiento; fútbol como registro ligero.

**Construido:** cada habilidad es una `SkillCard` desplegable (rejilla de 2 columnas cuando están
cerradas, ancho completo la abierta) con slider de nivel y 4 subpestañas:
- **Progresión** — checklist. Alta manual, marcar, borrar, o **"Generar progresión con IA"**
  (4–6 pasos en JSON según el nivel) siempre editable después. Las tres formas pedidas (IA /
  manual / mixto) se cubren con el mismo mecanismo.
- **PRs** — récord con fecha automática, valor **texto libre** ("12 reps", "25s") y nota.
- **Sesiones** — "He entrenado esto hoy" (una vez al día por habilidad), racha de días
  consecutivos, y **aviso de descanso recomendado a los 4 días seguidos** (la señal de
  sobreentrenamiento pedida).
- **Vídeos** — subida a `entrenamiento-videos`; **"Analizar con IA"** extrae 4 fotogramas clave
  **en el propio navegador** (`videoFrames.js`, `<video>` + `<canvas>`) y los manda con
  `askAIWithImages`; el análisis se guarda en el propio vídeo para no repetirlo. Comparación de
  hasta 2 vídeos de la misma habilidad lado a lado.
- **Fútbol**: partidos puntuales en `ListCard`/`ListRow`.

🔒 El análisis de vídeo **nunca se dispara solo**. 🔒 Los vídeos quedan fuera del sistema de deshacer.
La lista de vídeos se dejó **sin compactar** a `ListCard` a propósito (contenido demasiado rico
por fila).

---

### 7.4 Nutrición ✅

**Pedido** (Fase 4): comidas, calorías, macros, agua; escaneo por código de barras (dato exacto) y
por foto (ingrediente o plato); recetas y favoritos; **IA centrada en hábitos, no en cifras
estrictas**.

**Construido:** 3 pestañas — **Comidas** (nombre, kcal, proteínas, carbohidratos, grasas, fibra,
totales del día), **Agua** (contador en ml, ±1 vaso = 250 ml), **Favoritos** (guardar cualquier
comida como plantilla y volver a registrarla de un toque).
- **Código de barras** → `BarcodeScanner.jsx` con `@zxing/library` (cámara trasera) →
  **Open Food Facts** (`openFoodFacts.js`, gratis y sin clave) → macros por 100 g, recalculadas
  según los gramos reales que indique Josué.
- **Foto** → `askAIWithImage` devuelve solo un JSON (nombre + macros aproximados) que **rellena el
  formulario**; 🔒 **nunca guarda automáticamente**.

🔒 Ni Salud ni Nutrición pueden prescribir objetivos calóricos o de peso estrictos.

---

### 7.5 Salud ✅

**Pedido** (Fase 3): peso, altura, grasa corporal, fotos de progreso (con PIN), medidas, tensión,
lesiones, medicamentos, síntomas; IMC/BMR/TDEE **siempre orientativos**; recordatorios para
completar el historial médico.

**Construido:** 3 pestañas — **Medidas** (peso, grasa, FC, tensión sistólica/diastólica, notas;
gráfico de evolución del peso con recharts a partir de 2 registros; **aviso in-app** si han pasado
≥7 días sin registrar) · **Historial médico** (Lesión / Enfermedad / Medicamento / Síntoma /
Vacuna / Análisis / Otro, con fecha y descripción) · **Fotos de progreso** (bucket privado
`progreso`, nota por foto, miniaturas, borrado) protegidas hoy por la **acción** `fotos_privadas`.
Los cálculos IMC/BMR/TDEE viven en Ajustes → Perfil → Cálculos corporales.

---

### 7.6 Economía ✅

**Pedido** (Fase 1 + 2): saldo, movimientos, hucha, exportación.
**Construido:** cuenta principal con `saldoInicial` + movimientos (ingreso/gasto), **hucha fusionada
como fila dentro de la tarjeta de cuenta principal**, lista de movimientos en `ListCard`/`ListRow`,
`AIPanel`, deep-link `accion` que abre el alta de gasto.
**Queda:** ⬜ importación CSV del banco · ⬜ detección de duplicados. ⚠️ **Economía no tiene
"objetivo de ahorro" como estructura propia** — nunca simular uno (el Dashboard enlaza al módulo,
no a un objetivo inexistente).

---

### 7.7 Estudios ✅

**Pedido** (Fase 6): asignaturas configurables por curso con objetivo de nota por examen; pestañas
separadas Bachillerato/Música; calendario de exámenes y horas estudiadas; plan de repaso propuesto
por la IA **pero decidido y ejecutado por Josué**; primera correlación activa sueño↔estudio.

**Construido:** **programas** en pestañas (Bachillerato y Música por defecto, ampliables desde la
propia vista — lista editable, no enum en código) · **asignaturas** en tarjetas desplegables con
registro rápido de horas (total de la última semana en la cabecera) · **exámenes** (fecha, tema,
nota objetivo, días restantes, nota obtenida) · **plan de repaso** generado por IA como checklist
JSON de 3–7 pasos según los días restantes, siempre editable · **"Explícame un concepto"** (primera
caja de pregunta libre de la app) · correlación **sueño↔estudio** (`correlaciones.js`, umbral 7 h,
mínimo 2 días por grupo).

---

### 7.8 Negocio ✅

**Pedido** (Fase 7): registro manual y básico — ideas, clientes, proyectos, ingresos, gastos,
tareas. **"Poco diseño, no es prioritario"** (literal).
**Construido:** un único array `proyectos` (nombre, estado Idea/En marcha/Pausado, notas libres,
ingresos y gastos totales editables, balance calculado) + `AIPanel` "Mejorar mis ideas".
🔒 **No ampliar Negocio más allá de lo pedido.** Nada de libro de transacciones (ya existe Economía).

---

### 7.9 Productividad ✅

**Pedido** (Fase 8): hábitos, rutinas, checklists, Pomodoro, calendario; **rachas que se "pausan"
en vez de romperse a cero**.

**Construido:** **Hábitos** con racha en pausa (🔒 un día fallado no la rompe; **dos días seguidos
sí** la reinician) y mejor racha guardada aparte · **Rutinas/checklists** con progreso X/Y y
"reiniciar para hoy" · **Pomodoro** 25/5 con contador de sesiones de hoy · **Tareas** con fecha
límite opcional, pendientes/hechas separadas · **Metas a corto plazo** (nombre, periodo
diaria/semanal/mensual/anual, objetivo numérico, barra de progreso).
🔒 **Las metas cortas nunca se fusionan con los Objetivos** (Fase 9) — son dos sistemas distintos.
🔒 El contador de pomodoros queda fuera del deshacer.

---

### 7.10 Objetivos ✅

**Pedido** (Fase 9): 30 días / 90 días / 1 / 5 / 10 años; la IA valora si vas por buen camino y
recuerda de vez en cuando revisar los de largo plazo.
**Construido:** lista por plazo con estado activo/cumplido · **aviso de revisión periódica** a los
30+ días sin revisar (`ultimaRevision`, fuera del deshacer) con revisión asistida por IA que valora
el conjunto y **sugiere como máximo un objetivo nuevo** · `AIPanel` "¿Voy por buen camino?" ·
deep-link por `id` (scroll + halo) y `accion:'nuevo'`.
🔒 **La revisión con IA nunca añade un objetivo automáticamente** — solo texto para que él decida.

---

### 7.11 Calendario Universal 🟡

**Pedido** (prompt propio de 3 fases): un calendario que sea el eje temporal transversal de toda la
app, dentro de un área existente (**nunca una sexta pestaña**), que no se convierta en "una pantalla
llena de información", que integre lo que ya existe **sin duplicar el dato**, y que permita abrir el
elemento original desde el propio calendario.

**Fase 1 ✅ — motor y calendario base (v1.15.0)**
- `DEFAULT_CALENDARIO = { eventos: [] }`. Cada evento: `id, titulo, fecha, horaInicio?, horaFin?,
  todoElDia, tipo, ubicacion?, notas?, creadoEn, modificadoEn, recurrencia, estado, origen,
  origenId`.
- **8 tipos** (`TIPOS_EVENTO_CALENDARIO`): Objetivo · Hábito · Rutina · Estudio · Entrenamiento ·
  Fecha importante · Recordatorio · Personal. 🔒 El color se resuelve **en cada render** contra los
  tokens vivos (`colorDeTipoEvento(tipoId, accent)`), **nunca un hex guardado por evento** — así un
  evento sigue siendo coherente aunque Josué cambie de tema después de crearlo.
- Motor puro `src/lib/calendario.js`: `celdasMes` (años bisiestos resueltos por `Date` nativo,
  semana empezando en lunes) · `eventosDelDia` · `tiposDelDia` (máx. **3 puntos por día**, nunca
  texto largo) · `resumenDelDia` ("3 eventos · 2 hábitos · 1 objetivo") · `eventosFuturos`.
- Vista: cuadrícula mensual con navegación mes anterior/siguiente/hoy; **día actual y seleccionado
  distinguidos por forma + color a la vez, nunca solo por color**; panel de día; editor modal único
  para crear/editar/eliminar. Celdas vacías antes del día 1 (no días de otro mes).

**Fase 2 ✅ — calendario inteligente e integración (v1.16.0)**
- `src/lib/calendarioIntegracion.js` → `eventosDerivados({ objetivos, estudios, calistenia, futbol,
  productividad, relacion })`, calculado **en cada render**, **solo lectura**, **nunca guardado**.
  Esto resuelve gratis "evitar duplicados" y "si modificas algo desde su módulo, se actualiza el
  calendario".
- Fuentes integradas: **Objetivos** no cumplidos con plazo estimable (vía `prediccionObjetivo` —
  la fecha es una **estimación**, y se dice así en las notas del evento) · **Estudios** (exámenes,
  fecha real) · **Entrenamiento** (sesiones de calistenia + partidos) · **Productividad** (tareas
  con `fechaLimite`) · **Relación** (desde v1.22.0, condicionado a PIN).
- Un evento derivado se ve con **icono de candado** y abre `DetalleEventoDerivado` de solo lectura
  con botón **"Abrir en {módulo}"**. 🔒 El calendario **nunca** permite editar ni borrar un dato
  que no es suyo.
- Panel **"Próximamente"**: hasta 5 días con algo programado en ~2 semanas ("Hoy"/"Mañana"/día de
  la semana), cada fila tocable.

**Fase 3 🟡 — primera pasada (v1.17.0)**
- **Recurrencia real**: `expandirRecurrentes(eventos, desdeISO, hastaISO)` genera ocurrencias
  **virtuales** dentro de una ventana. 🔒 **Nunca se materializa una copia en Supabase**: un evento
  recurrente sigue siendo una fila con una regla. Atajo de aritmética exacta para diaria/semanal
  cuando el ancla queda muy atrás, para no agotar el tope de 500 pasos.
  `FRECUENCIAS_RECURRENCIA`: diaria · semanal · mensual · anual, con "hasta" opcional.
- Tocar cualquier ocurrencia abre **siempre el evento real completo**; el editor avisa literalmente
  de que guardar cambia toda la serie y eliminar borra todas las repeticiones.
- **Vista Agenda** (toggle Mes/Agenda): lista cronológica agrupada por día, **próximos 60 días**,
  **tope de 50 eventos** renderizados con aviso si se trunca.
- **Filtros por tipo**: fila de chips (uno por cada uno de los 8 tipos, con su token semántico) que
  afecta a la cuadrícula, el panel de día, "Próximamente", la Agenda y la búsqueda a la vez.
- **Búsqueda**: modal de texto libre sobre título/notas, ventana −60/+180 días, resultados tocables.
- `FilaEvento`: componente compartido entre panel de día y Agenda, con icono de candado y de
  repetición cuando corresponde.

**Finalización parcial ✅ (v1.22.0) — fechas recurrentes de Relación**
- Cada fecha de `relacion.fechas` gana `tipo` (`cumpleanos`/`aniversario`/`fecha_importante`/`otro`,
  con emoji) y `repetir` (booleano), **ambos opcionales** — las fechas ya guardadas no se migran
  solas.
- `eventosDeRelacion(relacion)` convierte cada fecha con `repetir: true` en un evento derivado con
  `recurrencia: { frecuencia: 'anual', hasta: null }`, reutilizando `expandirRecurrentes` tal cual.
  El título se genera al vuelo ("🎂 Cumpleaños de {nombre}") — 🔒 **el nombre nunca se guarda por
  segunda vez**.
- 🔒 **Privacidad:** `App.jsx` solo pasa los datos reales de `relacion` a `eventosDerivados()`
  cuando Relación está **desbloqueada en la sesión actual** (`estaDesbloqueado('area:relacion')`) o
  cuando **no hay ningún PIN configurado**; si no, pasa `null` y **ninguna** fecha de Relación llega
  al Calendario ni al Dashboard, ni siquiera el punto discreto del día.
- RelationView gana **edición real** de fechas (antes solo borrar y recrear).

**Queda de Fase 3:** ⬜ intervalo personalizado ("cada 2 semanas") · ⬜ excepciones ("saltar este
día sin romper la serie") · ⬜ edición de una ocurrencia individual · ⬜ **Hábitos y Rutinas como
eventos derivados** (ver **C-15**: el motor de recurrencia ya existe, la integración nunca se hizo)
· ⬜ **Fe (`fe.eventos`) como fuente derivada** (ver **D-06**) · ⬜ Economía → pagos ·
⬜ estadísticas temporales del calendario · ⬜ automatizaciones / "eventos inteligentes" (el prompt
los menciona sin definir qué harían — **no construir sin especificación**) · ⬜ personalización
avanzada del calendario · ⛔ vista de día independiente (la Agenda cubre ese caso).

---

### 7.12 Diario ✅

**Pedido** (Fase 10): cómo te sientes, qué aprendiste, qué mejorarás; detección de patrones
emocionales por IA; **sin privacidad extra**.
**Construido:** **una entrada por día** (si ya existe la de hoy, se precarga para completarla en vez
de duplicarla): ánimo 1–5 con emoji, cómo me he sentido, qué he aprendido, qué mejoraré mañana.
Entradas anteriores en tarjetas plegables. `AIPanel` "Detectar patrones emocionales" sobre las 20
entradas más recientes, que **admite abiertamente cuando hay pocas entradas** en vez de forzar un
patrón.
🔒 **Sin PIN en el Diario.** 🔒 La detección de patrones **nunca se dispara sola**.

---

### 7.13 Biblioteca ✅

**Pedido** (Fase 11): PDFs, vídeos, fotos, apuntes, enlaces; **búsqueda dentro del contenido de los
PDFs ("clave para el instituto")**.
**Construido:** listado único y buscable de los 5 tipos (un solo buscador y un solo filtro, **no
cinco listas**). Subida a `biblioteca` (un único bucket, el tipo va en la fila de datos).
**Extracción de texto del PDF en el navegador** (`pdfText.js` + `pdfjs-dist`) guardada como
`textoExtraido`; si el PDF es un escaneo sin texto, **no bloquea la subida**, se avisa en la
tarjeta. Búsqueda con **fragmento de contexto** alrededor de la coincidencia (`snippet()`).
🔒 **Sin IA en Biblioteca** — no añadir resumen automático ni análisis de PDFs sin petición
explícita. 🔒 `bibliotecaArchivos` fuera del deshacer. 🔒 El bucket nunca se hace público.

---

### 7.14 Relación (privado) ✅

**Pedido** (Fase 12 + 13): nombre, fechas importantes, recordatorio en pantalla principal, módulo
protegido por PIN, entrada manual; lista de "días" activables (Aniversario, Día de la Novia, Día
del Peluche, etc.) **creados a mano**.

**Construido:** nombre de la pareja + lista de fechas (etiqueta, fecha, tipo, repetir). **Módulo
entero detrás de `PinGate`** (no solo una pestaña). Subpestaña **"Días especiales"** con los **11
nombres** del Prompt Maestro como chips — Aniversario · Cumpleaños · Día de la Novia · Día del
Peluche · Día de las Flores Amarillas · Día del Chocolate · Día del Cine · Día del Maquillaje · Día
del Anillo de Promesa · Día de los Collares · Día de los Poemas — que **rellenan y abren el mismo
formulario** de "Fechas" (🔒 mismo array, **sin modelo de datos paralelo**). Los chips ya usados se
marcan. Recordatorio discreto en el Dashboard sin pedir PIN. Edición de fechas desde v1.22.0.

🔒 **Nunca quitar el `PinGate` de Relación** — `necesitaPin` fuerza `tab === 'relacion'` pase lo que
pase con la lista configurable.
🔒 **Nunca incluir `relacion` en la exportación CSV/Excel** ni en `currentState` (el contexto que ve
la IA).
🔒 **Nunca generar recordatorios de pareja automáticamente por conteo de tiempo** ("lleváis X días
juntos"). La recurrencia anual de una fecha **ya guardada** es cálculo de visualización, no
generación de una entrada nueva — no confundir ambas cosas.
🔒 **No registrar el ciclo menstrual de la pareja.**
⛔ **Sistema de múltiples personas/contactos**: descartado explícitamente. El modelo real es una
sola pareja (`relacion.nombre`, un string). Convertirlo en agenda de contactos es alcance nuevo con
implicaciones de privacidad propias.

---

### 7.15 Fe y vida espiritual ✅

**Pedido** (Fase 14): mi servicio, calendario, diario espiritual, objetivos; **la IA nunca da
autoridad doctrinal** — siempre recomienda acudir a tu comunidad ante dudas profundas.
**Construido:** 4 subpestañas — **Servicio** (Eucaristía / Anuncio / Preparación / Palabra / Otro,
con fecha y notas) · **Calendario** (Convivencia / Reunión / Catequesis / Retiro / Otro, separados
en Próximos y Pasados) · **Diario espiritual** (array propio `fe.diario`, con `AIPanel`
"Reflexionar sobre mis últimas entradas") · **Objetivos** espirituales (mismos `PLAZOS_OBJETIVO`,
lista propia, con `AIPanel`).
🔒 **`AVISO_DOCTRINAL` obligatorio** dentro del `buildPrompt()` de **ambos** `AIPanel` de Fe — y de
cualquier panel de IA que se añada a este módulo en el futuro.
🔒 **No fusionar** `fe.servicio` con `fe.eventos`, ni `fe.diario` con `diario.entradas`.
🔒 **No aplicar recurrencia anual a los eventos de Fe** — un retiro puntual no vuelve solo cada año;
se ordenan por fecha literal.
🔒 **Fe sin PIN** (mismo criterio que el Diario general).

---

### 7.16 Bienestar digital ✅

**Pedido** (Fase 15): registro manual/importado del Tiempo de Uso; dashboard con índices de
productividad, distracción y equilibrio; pantalla de reflexión **que abres tú** (no puede
interceptar Instagram/TikTok de verdad); modos de concentración simulados; **recompensas discretas,
sin sobregamificar**.

**Construido:** 4 subpestañas — **Resumen** (3 índices como barras de progreso, calculados como % de
minutos por categoría en una **ventana móvil de 7 días**; "Equilibrio" = % de minutos marcados
"neutro", para que los tres sean igual de simples de explicar) · **Tiempo de uso** (alta manual:
categoría, app/actividad, minutos, fecha; últimos 25 registros) · **Concentración** (temporizador
con duración elegible 10/20/30/45/60 min, reutilizando el mismo `useRef`/`setInterval` del Pomodoro)
· **Reflexión** (3 preguntas guía + texto libre, nunca automática).

🔒 **Nunca dar a entender que intercepta apps reales del móvil.** El aviso explícito se mantiene.
🔒 **Los índices se calculan solo sobre lo que Josué registra a mano** — nunca presentarlos como
medición objetiva del dispositivo.
🔒 **No sobregamificar**: sin puntos, niveles, monedas ni rachas nuevas. La única "recompensa" es un
mensaje breve al completar una sesión, más un **recuento** (no una puntuación) semanal.
⛔ **La importación automática del Tiempo de Uso es imposible**, no "pendiente" — un navegador no
puede leer el tiempo de uso del sistema operativo. El texto de la app ya lo dice así.

---

### 7.17 Estadísticas y correlaciones ✅

**Pedido** (Fase 16): conectar los datos de todos los módulos ya construidos, ampliando de 3–4
correlaciones validadas, **mostrando siempre en qué datos se basa cada afirmación**.
**Construido:** `StatsView.jsx` (solo lectura, sin datos propios) con las 3 correlaciones de
`correlaciones.js`: **sueño↔estudio** (mín. 2 días por grupo) · **sueño↔ánimo del Diario** (mín. 2) ·
**entreno↔ánimo del Diario** (mín. 3, umbral más alto por comparar contra un grupo más heterogéneo).
`cruzarPorFecha` es la utilidad genérica reutilizable para pares nuevos.
🔒 **Sin clave `app_data` propia, sin exportación.** Si una fase futura la amplía, mantener el
mismo criterio.

---

### 7.18 Predicciones ✅

**Pedido** (Fase 17): tiempo estimado para un objetivo, probabilidad de abandonar un hábito,
predicción de peso, fuerza, ahorro y notas.
**Construido:** `predicciones.js`, 6 funciones puras, todas explicables:
- `prediccionObjetivo` — **aritmética de fechas** (plazo elegido + `fechaCreacion`), no un modelo.
- `prediccionAbandonoHabito` — riesgo bajo/medio/alto por % de días marcados en ≤14 días.
- `prediccionPeso` — regresión lineal simple sobre `salud.medidas`, tendencia semanal + estimación
  a 30 días.
- `prediccionFuerza` — 🔒 **no proyecta ninguna cifra**: los PRs son texto libre. Mide **constancia**
  (frecuencia de sesiones, últimas 2 semanas vs. las 2 anteriores) y lo explica en la propia tarjeta.
- `prediccionAhorro` — neto medio mensual proyectado a 3 meses.
- `prediccionNotas` — 🔒 **media de los 3 exámenes más recientes**, no una regresión: con 2–3 puntos
  una recta da falsa precisión.

🔒 Todas dicen abiertamente cuándo no hay datos suficientes. 🔒 Sin datos propios ni exportación.
🔒 **No inventar cifras numéricas sobre campos de texto libre** — criterio aplicable a cualquier
predicción futura.

---

### 7.19 Logros y Mapa de vida ✅

**Pedido** (Fase 20): centro de logros y mapa de vida.
**Construido:** `logros.js` → `calcularLogros()`, **12 insignias binarias** (conseguida o no)
calculadas sobre datos ya existentes de 10 módulos. `AchievementsView.jsx` con 2 subpestañas:
**Logros** (las insignias) y **Mapa de vida** (los Objetivos ya existentes, de 30 días a 10 años,
como línea de tiempo cronológica — mismos datos, otra forma de verlos).
🔒 **Nunca convertirlo en un sistema de puntos, niveles o monedas.** Si se añaden insignias nuevas,
binarias y sin premio material. 🔒 Solo lectura, sin datos propios ni exportación.

---

### 7.20 Modos "viaje / vacaciones / exámenes" ✅

**Pedido** (Fase 20): plantillas y modos.
**Construido:** `MODOS_APP` en `tokens.js` — **3 plantillas fijas** con `id`, `label` y 2–3 `tips`
de texto fijo. Chips en `PersonalizationView` (tocar el activo lo desactiva). Se muestran en el
`IndicadorContexto` del Dashboard.
🔒 **No convertirlos en un motor configurable**: Josué no crea modos nuevos, y un modo **no puede
ocultar ni reordenar módulos** (eso ya lo cubre Personalización por separado; mezclarlo complicaría
deshacerlo).

---

### 7.21 Ajustes ✅ / 🟡

Ver la [sección 9](#9-módulo-ajustes--especificación-normativa-apartados-1202) completa.

---

## 8. Sistemas transversales

### 8.1 IA (`AIPanel` + `ai.js` + `api/ask-ai.js`)

- **13 `AIPanel` reales** en la app: Business · Dashboard · Diary · Estudios · **Faith (×2)** ·
  Finance · Health · Nutrition · Objectives · Productivity · Sleep · Training.
- **Un único `AI_SYSTEM`** para toda la app. 🔒 `AIPanel` **no acepta un system prompt por módulo**.
  Cualquier restricción específica se añade dentro del propio `buildPrompt()` de ese panel, con su
  constante si se reutiliza (patrón: `AVISO_DOCTRINAL` en Fe, restricciones propias en Objetivos).
- `AI_SYSTEM` exige explícitamente **citar en qué dato concreto se basa cada afirmación**, tono "a
  medio camino entre prudente y directo", **aconseja pero no decide**.
- **Multimodalidad dentro del componente compartido** (Fase 18): icono de clip junto al botón.
  Una **imagen** va por `askAIWithImage`; un **PDF** se convierte a texto con `extractPdfText` y se
  añade como contexto extra al prompt normal (🔒 **nunca como documento binario**). Si el PDF no
  tiene texto extraíble, se avisa a la IA en el prompt en vez de fallar. El adjunto se limpia
  después de cada pregunta.
  🔒 La firma `buildPrompt()` sin argumentos **debe seguir funcionando igual** en las 13 vistas.
- **Buscador universal** (`UniversalSearchModal`, icono fijo arriba a la derecha): pregunta libre
  sobre `currentState`.
- **Panel de sugerencias** (`SuggestionsButton`, bombilla arriba a la izquierda): hasta 2
  sugerencias breves. 🔒 **Nunca se dispara al abrirse** — exige tocar "Generar sugerencias".
- 🔒 **`currentState` es la única fuente de verdad de "qué puede ver la IA"** — el mismo objeto ya
  auditado para el export, que **excluye `relacion`**. Cualquier punto futuro donde la IA vea "todo"
  parte de `currentState`, nunca de un conjunto construido desde cero.
- 🔒 **La IA nunca se dispara sola** en ningún sitio de la app.

### 8.2 Seguridad y PIN (Seguridad Centralizada, v1.18.0)

- **`src/lib/pin.js`**: `crearPinHash(pin)` / `verificarPin(intento, pinHash, pinSalt)` —
  **SHA-256 + salt aleatorio de 16 bytes** con la Web Crypto API nativa. 🔒 **El PIN no se guarda ni
  se compara nunca en texto plano.**
  ⚠️ Límite honesto y documentado: SHA-256 es rápido, así que **no es resistente a fuerza bruta** si
  alguien obtuviera una copia de la fila de Supabase. Bcrypt/argon2/scrypt no se pudieron usar por
  falta de acceso a npm. El salt por usuario sí evita tablas precalculadas entre cuentas.
- **`seguridad.protectedAreas` / `protectedActions`** son la **única fuente de verdad**.
  `AREAS_PROTEGIBLES = [{ id:'hoy' }, ...MORE_NAV]` — 🔒 un módulo futuro se vuelve protegible
  **solo con existir en `MORE_NAV`**, sin tocar el sistema de seguridad.
- **`ACCIONES_PROTEGIBLES`** cableadas de verdad hoy: `fotos_privadas` · `exportar_datos` ·
  `eliminar_datos`. El resto del catálogo está pendiente (ver checklist).
- **`pedirVerificacionPin(motivo, onExito)`** en `App.jsx` es el **único punto** por el que pasan
  cambiar el PIN, desactivarlo y quitar protección. 🔒 **Reducir la protección siempre pide el PIN
  actual; añadirla nunca lo pide.**
- **Sesión de desbloqueo temporal**: `desbloqueosPin` en memoria, `sessionTimeoutMin`
  (1/5/15/30 min o "pedir siempre"), limpiada entera cuando salta el bloqueo automático.
- **Bloqueo automático de toda la app** (`BloqueoAutomaticoGate`): Inmediatamente / 30 s / 1 min /
  5 min / 15 min / **Nunca (por defecto)**. Reiniciado por `mousedown`/`keydown`/`touchstart`/
  `scroll`; "Inmediatamente" además bloquea al pasar a segundo plano (`visibilitychange`).
- **Biometría** (`biometria.js`, WebAuthn): 🔒 **gesto de desbloqueo rápido local, sin servidor de
  verificación** — mismo nivel de confianza que el PIN, no una autenticación remota. El SO exige
  Face ID/Touch ID real (`userVerification: 'required'`). 🔒 **El PIN es respaldo obligatorio**: si
  Josué borra el PIN, la biometría se desactiva sola en el mismo guardado.
- **Recuperación de PIN**: usa `resetPasswordForEmail` de Supabase como **prueba de identidad**.
  🔒 Nunca se pide ni se guarda la contraseña del correo, y **nunca se toca la contraseña de la
  cuenta de Supabase**. Hasta que no llega el evento `PASSWORD_RECOVERY` no se deja crear un PIN.
- **Migración sin pérdida**, con banderas `migradoAreas`/`migradoAcciones` para que un `pinExtra`
  obsoleto no "resucite" algo que Josué desprotegió después.
- ⚠️ **Límite honesto ya documentado**: en una SPA sin backend de autorización, alguien con las
  herramientas de desarrollador del navegador podría manipular el estado de React. Inherente, no un
  descuido.

### 8.3 Notificaciones (A4)

- `permisoNotificaciones()` / `pedirPermisoNotificaciones()` (Notification API nativa).
- `notificarSiCorresponde(notificaciones, categoria, clave, titulo, cuerpo)` comprueba, en orden:
  permiso concedido → interruptor global → categoría activada → **fuera del horario de descanso**
  (soporta franjas que cruzan medianoche, p. ej. 23:00–07:00) → **no repetido hoy** (marca en
  `localStorage`, a propósito no en Supabase).
- **10 categorías**: Salud · Sueño · Entrenamiento · Nutrición · Economía · Estudios · Productividad
  · IA · Objetivos · Sistema.
- **Único caso de uso conectado hoy**: los 3 avisos del Dashboard.
- ⛔ **Esto NO es Web Push.** Solo funciona con la PWA abierta. Web Push real exige Service Worker
  con listener `push`, tabla de suscripciones en Supabase y otra función serverless — infraestructura
  nueva, no una ampliación.

### 8.4 Personalización de interfaz (Fase 19/20)

Reordenar (flechas arriba/abajo) · ocultar/mostrar (🔒 **ocultar pide confirmación inline, mostrar
no**) · cambiar icono (catálogo de 8; 🔒 **se guarda la clave string, nunca el componente** —
resolución en `ICONOS_PERSONALIZABLES_MAP`) · proteger con PIN cualquier sección · hasta 4 métricas
favoritas de 6, con orden propio · chips de modo.

🔒 **`PRIMARY_NAV` (los 4 accesos fijos) y "Ajustes" nunca son personalizables** — permitir
ocultarlos dejaría a Josué sin forma de deshacer un cambio.
🔒 **Ocultar un módulo nunca borra sus datos** — solo lo quita de la lista.
🔒 **"Crear/eliminar apartados" se interpreta como mostrar/ocultar módulos ya existentes**, nunca
como un constructor de módulos arbitrarios con su propio esquema de datos.
🔒 `personalizacion` se guarda **directo**, nunca por `snapshotAndSave`.

### 8.5 Deshacer / historial

Histórico de **10 pasos** (`historial`) + botón "Deshacer último cambio" en Ajustes → Datos.
`snapshotAndSave(patch)` guarda el snapshot y aplica el parche. Quedan **fuera** por diseño: fotos,
vídeos, archivos de biblioteca, contador de pomodoros, `ultimaRevision`, y toda la configuración de
interfaz.

### 8.6 Exportación

`exportData.js` → `exportCSV()` / `exportXLSX()` sobre `currentState`.
🔒 **Excluye siempre `relacion`** (protegida de principio a fin) y todos los binarios.
Del Calendario exporta **solo eventos con `origen: 'calendario'`**, para no duplicar lo que ya
exporta cada módulo de origen.
Además existen **4 exportaciones JSON independientes**: perfil, apariencia, notificaciones y temas.
⬜ **Falta una copia de seguridad unificada de configuración** (apartado 36) y una **exportación de
datos personales completa** (apartado 194), y ⬜ **exportación a PDF**.

### 8.7 Privacidad — panel de transparencia (A6)

Vista agregada, sin datos nuevos: PIN activo, biometría, bloqueo automático, notificaciones y
cuántas categorías, sincronización (siempre automática), integraciones (ninguna). Más una nota
honesta de qué usa la IA y otra de permisos de dispositivo.
**Eliminación de datos por categoría**: `RESET_MODULOS` con 14 módulos + confirmación inline.
Quedan fuera: **Perfil** (tiene su propio restablecimiento) y los **tres módulos con archivos en
Storage** (saludFotos / calisteniaVideos / bibliotecaArchivos), porque borrar solo el registro
dejaría archivos huérfanos.
✅ Confirmado por `grep` que la app **no usa `getUserMedia`, `mediaDevices` ni `navigator.
geolocation`** en ningún sitio salvo el escáner de códigos: fotos y vídeos van por el selector de
archivos nativo. Por eso el panel de permisos de cámara/micro/ubicación se documenta como
**"no aplica"** en vez de simular interruptores.

### 8.8 Resúmenes de hub

`calcularResumenModulo(id, estado)` — 18 `case` + `default`, todos devuelven `{ linea1, linea2,
estado }`. Reutilizado por `HubView` y por las tarjetas de Nivel 2 del Dashboard: **una sola fuente
de verdad para el resumen de un módulo**.

---

## 9. Módulo Ajustes — especificación normativa (apartados 1–202)

> Fuente: `ESPECIFICACION_AJUSTES_ENTREGA1.md`, transcripción literal e intocable. Aquí solo se
> anota **qué exige** y **en qué estado está**.

### 9.1 Arquitectura general (apartados 1–48)

| Ap. | Exigencia | Estado |
|---|---|---|
| 1–2 | Centro de configuración, no pantalla secundaria. Cambio inmediato, consistente y **reversible**. Cualquier ajuste encontrable en <3 interacciones o por buscador | 🟡 |
| 3 | **Cabecera**: foto, nombre, saludo contextual, **nivel del sistema**, acceso al perfil, buscador; se contrae al desplazar | 🟡 falta foto, saludo, nivel del sistema y la contracción |
| 3 | **Pie**: versión, **número de compilación**, enlaces legales, créditos, información técnica. Nunca mezclado con opciones | 🟡 solo versión (leída de `package.json`) en la categoría "Información" |
| 4 | **Orden fijo de 14 categorías**, no reordenable | 🟡 12 implementadas — faltan **IA** y **Funciones experimentales** (ver **C-03**) |
| 5 | Tarjeta reutilizable con icono circular, color, título, descripción, indicador de estado y flecha. Indicadores extra (config. incompleta, nueva función, sincronización desactivada, error, actualización). **Animaciones ≤220 ms** | 🟡 sin indicadores de estado extra |
| 6 | Categorías más usadas arriba; no desplazarse para lo semanal | ✅ |
| 7 | Guardado automático. **Sin botones "Guardar"/"Aceptar"/"Aplicar"** | ✅ |
| 8 | **Conjunto cerrado de 14 componentes** permitidos | ✅ |
| 9 | Todo ajuste es Booleano / Selección única / Selección múltiple / Numérico / Texto / Acción | ✅ |
| 10 | **8 estados** por control: reposo, pulsado, activo, desactivado, bloqueado, cargando, sincronizando, error | 🟡 parcial |
| 11 | Descripción corta ≤80 caracteres, explica el **efecto**, nunca cómo usar el control | ✅ |
| 12 | Transición lateral 200–250 ms, Ease Out; **volver restaura la posición de scroll exacta** | 🟡 falta la restauración de scroll |
| 13 | Categorías divididas en bloques con encabezado y espacio vertical | ✅ |
| 14 | **Un mismo tipo de configuración nunca con componentes distintos** | ✅ |
| 15 | Cada categoría desacoplada; añadir categorías sin modificar las existentes | ✅ |
| 16–17 | Jerarquía, pantalla independiente por categoría, estructura interna idéntica (encabezado → descripción → bloques → info contextual → acciones secundarias → acciones críticas) | ✅ |
| 18–22 | Bloques temáticos, tipos de elemento, espaciado, tipografía, **iconografía de una única librería** | ✅ |
| 23 | 9 estados de ajuste (reposo, modificado, deshabilitado, cargando, guardando, sincronizado, sin conexión, error, restaurado) | 🟡 |
| 24 | **Ciclo de persistencia de 7 pasos** con optimistic UI, validación, guardado local, sync, confirmación visual y **reversión en error** | 🟡 falta confirmación explícita y reversión |
| 25 | Confirmación visual (instantánea, indicador de guardado, silenciosa, mensaje, animación, **háptica**) | ⬜ |
| 26 | **Deshacer con prioridad sobre diálogos de confirmación** para lo reversible | ⬜ para Ajustes (el deshacer actual es solo de datos) |
| 27 | **Dependencias entre configuraciones** comunicadas con texto contextual, nunca cambios invisibles | 🟡 (existe biometría↔PIN, sin texto explicativo sistemático) |
| 28 | **Configuración contextual**: si un permiso está denegado, explicarlo en vez de mostrar controles inútiles | ✅ (permiso de notificaciones lo hace) |
| 29 | Apartado **"Configuración avanzada"** por categoría | 🟡 (existe `modoColorAvanzado` en Apariencia) |
| 30 | **Modo desarrollador** oculto, activado por secuencia (p. ej. pulsar la versión varias veces) | ⬜ |
| 31 | Helper text breve y sin tecnicismos | ✅ |
| 32 | **Buscador global que indexa nombre, descripción, categoría, palabras clave y sinónimos** | 🟡 hoy solo filtra **tarjetas de categoría**, no ajustes individuales |
| 33 | **Ajustes frecuentes** (automático) + **favoritos ⭐** manuales | ⬜ |
| 34 | **Historial de cambios de configuración** (fecha, hora, ajuste, valor anterior, nuevo, dispositivo) | ⬜ |
| 35 | Restablecer **por categoría** + **"Restablecer todas"**, con resumen previo y copia de seguridad automática | 🟡 por categoría existe en Perfil/Apariencia/Notificaciones; falta el global y la copia previa |
| 36 | **Copia de seguridad de la configuración** exportable/importable, **formato versionado** | 🟡 hay 4 exports JSON sueltos, ninguno versionado ni unificado |
| 37 | Compatibilidad hacia atrás: nunca eliminar una configuración sin migración | 🟡 se aplica el patrón de merge, sin sistema formal de versiones |
| 38 | **Sistema de migración** al cambiar de dispositivo/reinstalar | ⬜ |
| 39 | Separación **configuración global (sincroniza)** vs **local (solo este dispositivo)** | 🟡 se aplica de facto (`localStorage` para marcas de notificación), sin modelo explícito |
| 40 | Resolución de conflictos ("última modificación válida"), confirmación en configuraciones críticas, registro | ⬜ |
| 41 | **Funciona completamente sin conexión**; al volver: detectar → validar → sincronizar → resolver → confirmar | ⬜ |
| 42 | Gestión de errores: qué ha ocurrido, qué consecuencias, cómo solucionarlo. **Nunca "Error 502"** | 🟡 |
| 43 | **Accesibilidad completa** como requisito de arquitectura | 🟡 hay alto contraste, tamaño de texto, reducir movimiento, forma+color; falta auditoría de lector de pantalla y navegación por teclado |
| 44–45 | Rendimiento y consumo energético; carga diferida por categoría | 🟡 |
| 46 | **Nunca en texto plano**: PIN, tokens, credenciales, API Keys | ✅ para el PIN |
| 47 | **Registro de auditoría** de modificaciones importantes | ⬜ |
| 48 | Filosofía: fácil de encontrar, comprender, modificar, revertir, y **difícil de romper** | ✅ |

### 9.2 Perfil (49–78) — ✅ salvo tres piezas

**Construido:** 7 tarjetas — Datos básicos · Información física · Información deportiva
(`DeportesChips` + `LesionesEditor`) · Información académica · Información general · Cálculos
corporales · Acciones (exportar/importar/restablecer JSON con confirmación inline).
26 campos en `DEFAULT_PERFIL`; edad **siempre calculada, nunca editable** (ap. 54).

**Queda:** ⬜ **fotografía de perfil** (ap. 52: tomar/elegir/eliminar/sustituir, recorte cuadrado,
compresión, caché, **avatar con iniciales si no hay foto**) — **nunca construida** ·
⬜ **conversión real de unidades** (ap. 71: hoy solo se guarda la preferencia) · ⬜ **i18n real**
(ap. 68: `IDIOMAS_DISPONIBLES` solo tiene `es`) · ⬜ zona horaria con UTC interno y conversión en
visualización (ap. 69) · ⬜ país/región afectando formatos de fecha, primer día de semana y moneda
(ap. 70) · 🟡 **propagación reactiva Perfil→módulos** (ap. 76/77) — ver **D-10**: añadir un peso en
Salud **no** actualiza `perfil.peso`.

### 9.3 Apariencia (79–110) — ✅ / 🟡

**Construido:** Tema Claro/Oscuro/**Automático** real (resuelto contra `matchMedia` con listener en
vivo) · **12 acentos + selector de color libre** (13º swatch) · **Constructor de temas** completo ·
**10 paletas predefinidas** + gestión completa de temas propios (guardar/renombrar/duplicar/
eliminar/exportar/importar, límite 12 sin borrar nada en silencio) · Tamaño de texto real (escala
`document.documentElement.style.fontSize`; como Tailwind usa `rem`, escala toda la app) · Radios de
borde reales (atributo `data-radio` + CSS con `!important`, 🔒 **nunca `.rounded-full`**) ·
Animaciones: "Desactivadas" + interruptor "Reducir movimiento" reales · **Alto contraste** ·
Exportar/importar/restablecer apariencia en JSON.

**Queda:** 🟡 **Densidad de interfaz** — se guarda, **no tiene efecto visual** (ver **C-01**;
ap. 91 la exige real) · 🟡 **niveles intermedios de animación** (Completa/Reducida/Mínima) sin
efecto real, solo "Desactivadas" (ap. 95) · ⬜ **transparencias y materiales** (ap. 93) ·
⬜ **estilos de icono alternativos** (ap. 100–101) · ⬜ **fondos con degradado/textura** (ap. 102) ·
⬜ **escalado inteligente** que adapte también iconos, botones, campos, listas y barras (ap. 90) ·
⬜ **gestión de widgets del Dashboard con configuración individual** (ap. 103–106).

### 9.4 Notificaciones (111–138) — 🟡 la categoría menos completa

**Construido:** permiso del sistema en vivo con botón para pedirlo · activación global · **10
categorías** · **horario de descanso** que cruza medianoche · exportar/importar/restablecer ·
3 disparadores reales conectados.

**Queda (todo ⬜ salvo indicación):** Web Push real (⛔ requiere infraestructura nueva) ·
**tipos de notificación** (10, ap. 118) · **niveles de prioridad** (4, ap. 119) · **programación
horaria por día de la semana** (ap. 120) · **modo silencioso interno** (ap. 121) · **frecuencia de
recordatorios** (ap. 123) · **posponer** 10 min/30 min/1 h/esta tarde/mañana/elegir (ap. 124) ·
**resumen inteligente** agrupado (ap. 125) · **agrupación inteligente** (ap. 126) · **motor
inteligente** que evalúa antes de enviar (ap. 127) · **adaptación al comportamiento** (ap. 128) ·
**notificaciones propias por módulo** (ap. 129) · **sonidos** (ap. 130) · **vibración/háptica**
(ap. 131) · **indicadores internos**: badges, contadores, banners (ap. 132) · **historial de
notificaciones** (ap. 133) · **separación sincronizable/local** explícita (ap. 134) ·
**diagnóstico** (ap. 135).

### 9.5 Seguridad (139–172) — 🟡

**Construido:** PIN hasheado con salt · biometría WebAuthn con PIN de respaldo obligatorio ·
bloqueo automático de toda la app (6 opciones) · protección por área y por función · sesión de
desbloqueo temporal · recuperación por correo verificado.

**Queda:** ⬜ **longitud de PIN configurable** y **límite de intentos con espera progresiva**
(ap. 142–143, 165) · ⬜ cambio de contraseña de la cuenta con sus requisitos (ap. 147–148) ·
⬜ verificación de correo con estado visible (ap. 149) · ⛔ **dispositivos autorizados**, **sesiones
activas**, **revocación** e **historial de accesos** (ap. 150–154) — requieren un servidor con
permisos de administrador de Supabase que no existe · ⬜ **alertas de seguridad** (ap. 155) ·
⬜ **códigos de recuperación** de un solo uso (ap. 157–158) · 🟡 confirmación reforzada para
acciones críticas (ap. 159) — parcial · ⛔ Keychain/Keystore (ap. 160–162) — no aplica a una PWA ·
⬜ **protección frente a capturas de pantalla** (ap. 166) · ⬜ **auditoría de eventos de
seguridad** (ap. 168) · ⛔ **servicio independiente de autenticación** (ap. 169).

### 9.6 Privacidad (173–202) — 🟡

**Construido:** panel de transparencia (ap. 200) · nota honesta de qué usa la IA (ap. 187) ·
permisos de dispositivo documentados como "no aplica" con verificación real (ap. 178–184) ·
eliminación de datos por categoría, 14 módulos (ap. 195).

**Queda:** ⬜ **gestión y registro de consentimientos versionado** (ap. 185–186) · ⬜ **memoria
personalizada de la IA** consultable/editable/vaciable (ap. 188) · ⬜ **panel "qué dato usa quién"**
(ap. 192: "Peso → utilizado por Salud, Nutrición, IA, Dashboard") · ⬜ **historial de acceso a datos
sensibles** (ap. 193) · ⬜ **exportación de datos personales completa** (ap. 194) · ⬜ **política de
retención** explicada (ap. 196) · ⛔ **eliminación completa de la cuenta** (ap. 197–198) — requiere
función serverless con permisos de admin · ⬜ **auditoría de privacidad** (ap. 199).

---

## 10. AXION — apartados 203–1300

### 10.1 Qué es

**AXION** es el nombre que la especificación da al motor de IA transversal del sistema. Son **≈1100
de los 1300 apartados** de la Entrega 1 — con enorme diferencia, la sección más extensa.

> ⚠️ **Los apartados 203–1300 NO están transcritos literalmente** en
> `ESPECIFICACION_AJUSTES_ENTREGA1.md`; solo hay un **resumen por bloques temáticos**. El texto
> literal vive en el chat original donde Josué lo pegó. **Si alguna vez se implementa AXION, hay
> que releer el original o pedírselo de nuevo — nunca construir solo desde el resumen.**

### 10.2 Los 20 bloques temáticos

| Apartados | Bloque |
|---|---|
| 203–330 | Fundamentos: objetivos, principios, estructura de la categoría IA, activación general, selección de modelo, nivel de asistencia, personalidad, contexto disponible por módulo, memoria personalizada, explicabilidad, control humano |
| 331–350 | Iniciativas y recomendaciones: agrupación, prioridad, caducidad, seguimiento, objetivos derivados, matriz impacto/esfuerzo, prevención del agotamiento del usuario |
| 351–390 | Trazabilidad, arquitectura desacoplada, **múltiples proveedores** (OpenAI/Anthropic/Google/Mistral/Meta/xAI/locales), balanceador, caché, priorización, recuperación ante fallos, entorno de pruebas |
| 391–410 | Privacidad e integración con permisos: contexto de privilegios mínimos, clasificación de sensibilidad, procesamiento local preferente, anonimización previa, protección frente a automatizaciones peligrosas, deshacer inteligente |
| 411–430 | Observabilidad: métricas, registro estructurado, autodiagnóstico, detección de anomalías, modo seguro, panel de diagnóstico |
| 431–450 | Arquitectura de eventos: catálogo, suscripción, publicación desacoplada, procesamiento asíncrono, prevención de bucles, eventos compuestos/derivados/temporales/persistentes |
| 451–470 | Arquitectura orientada a servicios: catálogo central, ciclo de vida, descubrimiento dinámico, inyección de dependencias, contratos versionados |
| 471–520 | Bus de servicios, enrutamiento inteligente, balanceo de carga, **Circuit Breaker**, reintentos, fallback, **presupuestos económicos** por módulo/agente/proveedor, alertas de consumo, modo sin costes externos |
| 501–540 | Capa multimodal (imagen, voz, documentos), extracción estructurada, memoria contextual multimodal, corto/largo plazo, prevención de alucinaciones, **"verdad operacional"** (nunca confundir intención con acción ejecutada) |
| 541–620 | Motor de planificación personal: descomposición de objetivos, capacidad diaria, planificación adaptativa, plan mínimo viable / de contingencia, ejecución, estados, **idempotencia**, modos manual/asistido/autónomo limitado/autónomo avanzado, permisos granulares por agente |
| 601–670 | Centro de control de agentes: activar/pausar/reiniciar, perfiles (conservador/equilibrado/proactivo/autónomo), **parada de emergencia**, panel de actividad, explicación de decisiones, **clasificación de riesgo 0–4** y confirmación escalonada |
| 671–730 | Aprendizaje personalizado con límites, separación aprendizaje/memoria, aprendizaje explicable y reversible, control de proactividad, frecuencia máxima de recomendaciones, modos concentración/descanso/vacaciones |
| 731–800 | Funcionamiento **offline-first**: capacidades offline vs online, IA local, cola offline, sincronización incremental, resolución de conflictos, modos ahorro/rendimiento |
| 761–830 | Privacidad de IA: minimización, **identidad abstracta** para proveedores externos, filtrado/sanitización del contexto antes de enviarlo, catálogo de modelos, selección por capacidad/coste/calidad/privacidad |
| 800–850 | Arquitectura híbrida (reglas deterministas + IA), herramientas internas con validación de parámetros, aislamiento entre agentes, **prohibición explícita de "autonomía emergente"** |
| 851–900 | Integración de IA con cada módulo — con **aislamiento explícito de Diario y Relaciones por defecto** |
| 901–1000 | Centro de Inteligencia AXION, **niveles de autonomía 0–4** por módulo y por acción, matriz de riesgo, confirmación reforzada, expiración/revocación de permisos, **"confianza verificable"** |
| 1001–1100 | Configuración por niveles (básico/intermedio/avanzado), perfiles de IA, identidad visual de las acciones de IA, **principio de honestidad** (nunca afirmar que ejecutó algo que no ejecutó) |
| 1101–1150 | Motor de memoria: sesión/temporal/contextual/persistente/preferencias, consentimiento y edición, resolución de contradicciones, memoria por agente aislada, **"memoria mínima"** |
| 1151–1220 | Motor de privacidad de IA: clasificación de datos, mínimo acceso, filtrado previo, **protección contra extracción indirecta**, panel de privacidad de IA, eficiencia económica |
| 1221–1250 | Sincronización de IA entre dispositivos, revocación inmediata de permisos, **"continuidad inteligente"** |
| 1251–1300 | Preparación para modelos y modalidades futuras (visión, audio, vídeo, sensores), validación de respuestas externas, protección contra ejecución retardada con contexto obsoleto, **"principio de evolución segura"**: la IA puede volverse más capaz, pero **nunca debe reducir el control humano, la privacidad, la seguridad, la trazabilidad, la reversibilidad ni la autonomía del usuario** |

### 10.3 Realidad de alcance — dicho sin rodeos

**Lo que describe AXION:** orquestación multiagente con coordinador, bus de eventos, arquitectura
orientada a servicios con bus de servicios / Circuit Breaker / balanceo, enrutamiento entre 7+
proveedores de IA, presupuestos económicos granulares, observabilidad y auditoría extremo a extremo,
motor de memoria multinivel, planificación y ejecución autónoma con 5 niveles configurables por
módulo y por acción, funcionamiento offline-first con colas de sincronización.

**Lo que hay:** una PWA Vite + React + Supabase con **una única función serverless** que hace de
proxy a **un único proveedor**. Sin bus de eventos, sin orquestador, sin multi-proveedor, sin motor
de políticas, sin presupuestos, sin observabilidad.

**Conclusión honesta, ya documentada y que hay que repetirle a Josué antes de prometerle nada:**
construir AXION literalmente **no es "una fase más" del tamaño de las 21 anteriores** — es
reconstruir la capa de IA desde cero con una arquitectura de backend que este proyecto no tiene, y
que difícilmente puede mantener él solo desde un iPhone.

### 10.4 "AXION Lite" — el subconjunto pragmático propuesto

Captura el **espíritu** de la especificación sin la infraestructura empresarial:

1. **Permisos de la IA por módulo** — que la IA declare y respete qué módulos puede leer (ya
   parcialmente cubierto por `currentState`).
2. **Niveles de autonomía simplificados** — solo lectura / sugerir / preparar-con-confirmación, en
   vez de los 5 niveles completos.
3. **Seguimiento de coste y consumo de tokens** si se activa `ANTHROPIC_API_KEY`.
4. **Memoria de IA explícita y editable por el usuario** (apartado 188), con base conceptual ya en
   el buscador universal y el panel de sugerencias.
5. **Auditoría básica** — qué preguntó la IA, cuándo, con qué datos — en vez de trazabilidad
   extremo a extremo.

El resto queda documentado como **visión a largo plazo**, no como trabajo pendiente a construir.

### 10.5 🔒 Bloqueo explícito

> **No empezar a construir AXION ni "AXION Lite" sin una conversación de diseño previa con Josué.**
> Él lo pidió literalmente ("cuando acabes esto, diseñemos toda la vaina de la IA"). Si retoma el
> proyecto pidiendo avanzar con la IA, **el primer paso es esa conversación** — alcance real vs.
> descrito, qué subconjunto es viable — **no escribir código**.

---

## 11. Reglas inviolables del producto

> Consolidadas de `HANDOFF.md` §17 + las decisiones de cada fase. Una IA futura que rompa
> cualquiera de estas está introduciendo una regresión, no una mejora.

**Diseño y sistema de color**
1. No rediseñar la paleta sin petición explícita.
2. Nunca desestructurar `COLORS`. Nunca crear un segundo sistema de tokens.
3. Nunca un hex suelto fuera de `tokens.js` (excepción documentada: el icono de borrar foto en
   `HealthView.jsx` va sobre un scrim oscuro fijo, a propósito).
4. Todo overlay `fixed inset-0` nuevo se monta con `createPortal`.
5. No repetir `ScoreGauge` en la misma pantalla sin arreglarle antes el id fijo del gradiente SVG
   — usar barras simples si hacen falta varios valores.
6. Los roles semánticos (`positive`/`warning`/`negative`/`info`) no se derivan del acento.

**IA**
7. La IA nunca se dispara sola, en ningún sitio.
8. La IA aconseja, nunca decide. Nunca añade un objetivo por su cuenta.
9. No romper `AIPanel` ni la firma `buildPrompt()` para las 13 vistas que la usan.
10. Restricciones por módulo dentro de `buildPrompt()`, nunca cambiando `AI_SYSTEM`.
11. `AVISO_DOCTRINAL` obligatorio en todos los paneles de IA de Fe.
12. Nada de objetivos calóricos ni de peso estrictos en Salud ni Nutrición.
13. El buscador universal y el panel de sugerencias parten de `currentState` y **nunca** incluyen
    `relacion`. El panel de sugerencias no llama a la IA por abrirse.
14. No sobrecargar el motor de IA con llamadas innecesarias.
15. No exponer `ANTHROPIC_API_KEY` en código de cliente.

**Privacidad y seguridad**
16. Nunca quitar el `PinGate` que envuelve Relación entera.
17. Nunca incluir `relacion` en la exportación.
18. Ningún bucket de Storage se hace público; siempre URL firmada de corta duración.
19. El PIN nunca vuelve a texto plano. Reducir protección siempre pide el PIN actual.
20. La biometría nunca queda sin el respaldo del PIN.

**Modelo de datos**
21. Fotos, vídeos, archivos de biblioteca, contador de pomodoros y `ultimaRevision` nunca entran en
    el sistema de deshacer.
22. Configuración de interfaz se guarda directo, nunca por `snapshotAndSave`.
23. Iconos personalizados se guardan como clave string, nunca como componente de React.
24. Nunca materializar ocurrencias de un evento recurrente en Supabase.
25. Nunca duplicar un dato de otro módulo en el Calendario — siempre derivado y de solo lectura.

**Reglas de módulo**
26. No romper la racha "en pausa" de Hábitos.
27. No fusionar las metas cortas de Productividad con los Objetivos.
28. No fusionar `fe.servicio` con `fe.eventos`, ni `fe.diario` con `diario.entradas`.
29. No aplicar recurrencia anual a los eventos del Calendario de Fe.
30. Sin PIN en el Diario. Sin PIN en Fe.
31. No ampliar Negocio más allá de lo pedido.
32. No añadir IA a Biblioteca sin petición explícita.
33. Bienestar digital nunca da a entender que intercepta apps reales; no sobregamificar; los índices
    son un reflejo del registro manual, no una medición.
34. Logros: insignias binarias, nunca puntos/niveles/monedas.
35. Los modos viaje/vacaciones/exámenes no ocultan ni reordenan módulos.
36. No inventar cifras numéricas sobre campos de texto libre.
37. Estadísticas, Predicciones y Logros son solo lectura, sin datos propios ni exportación.
38. No generar recordatorios de pareja automáticamente por conteo de tiempo. No registrar el ciclo
    menstrual de la pareja.

**Navegación y personalización**
39. Exactamente 5 pestañas en la barra inferior. Nunca una sexta.
40. `PRIMARY_NAV` y "Ajustes" nunca se ocultan ni se reordenan.
41. Ocultar un módulo nunca borra sus datos.
42. "Crear/eliminar apartados" ≠ constructor de módulos arbitrarios.

**Proceso**
43. **No construir varias fases a la vez.**
44. No prometer funciones no viables en PWA sin dejarlo claro en la propia interfaz.
45. No dejar notas internas de desarrollo ("Fase X", "apartados X-X", "queda pendiente") en
    pantallas que ve Josué. La información honesta sobre limitaciones **reales y permanentes** sí
    se conserva, pero escrita como explicación, no como hoja de ruta.
46. Actualizar `HANDOFF.md` y `CHANGELOG.md` al terminar cada fase — nunca generarlos de cero.
47. Entregar siempre el zip actualizado; nunca dejar un turno sin él.
48. Verificar con `esbuild` antes de entregar (cuando el entorno lo permita).
49. **Una contradicción nueva entre especificaciones no se resuelve por cuenta propia: se pregunta.**
    Regla añadida por Josué al empezar la Entrega 2. Detiene *la fase afectada*, no la sesión: se
    anota en `docs/03` como **⏸ PENDIENTE DE JOSUÉ**, se sigue con las fases que no dependan de ella
    y la pregunta se le hace al cerrar el turno, corta y con opciones concretas. No aplica a las
    contradicciones ya listadas con decisión tomada — esas están cerradas y no se reabren.

---

## 12. Convenciones de código y patrones establecidos

Estos patrones no son estilo, son decisiones ya tomadas. **Reutilizarlos antes de inventar uno
nuevo.**

| Patrón | Regla |
|---|---|
| **Texto largo** | Usar el componente `Textarea` de `ui.jsx`, nunca un `<textarea>` suelto |
| **Módulo con archivos** | Split en dos estados: texto puro con deshacer (`biblioteca`) + archivos sin deshacer (`bibliotecaArchivos`). Igual que `salud`/`saludFotos` y `calistenia`/`calisteniaVideos` |
| **Subida a Storage** | Trío exacto `uploadX(userId, file) → path` / `getSignedXUrl(path)` / `deleteX(path)` |
| **Búsqueda en texto largo** | Reutilizar la idea de `snippet()` de `LibraryView.jsx`: índice de coincidencia + recorte alrededor |
| **Módulo entero protegido** | `PinGate` envuelve el `case` completo en `renderTab()`, no dentro de la vista |
| **Adelanto de dato protegido** | Resumen fuera del `PinGate`, detalle completo dentro (`diasHasta`/`proximaOcurrencia`) |
| **Atajos/plantillas** | Una subpestaña de chips que rellena el **mismo** array que la pestaña manual — nunca un modelo de datos paralelo |
| **Restricción de IA por módulo** | Texto extra dentro de `buildPrompt()`, con constante propia si se repite |
| **Dos listas parecidas** | Antes de fusionar, preguntarse si responden a la **misma pregunta**. Si no, separadas |
| **Temporizador nuevo** | Copiar el `useRef`/`setInterval` de 1 s del Pomodoro |
| **Limitación técnica** | Dejarla explícita en la UI con una frase corta |
| **Módulo solo lectura** | Sin `DEFAULT_X`, sin clave `app_data`, sin exportación. Solo nav + `case` |
| **Dato de texto libre** | No convertirlo en número para poder graficarlo si ese número sería inventado |
| **Funcionalidad transversal** | Va en el componente compartido (`ui.jsx`/`ai.js`), no repetida vista por vista |
| **Adjunto a la IA** | Imagen → `askAIWithImage`. PDF → `extractPdfText` + contexto de texto. No un tercer mecanismo |
| **Acceso global** | `position: fixed` en `App.jsx`, fuera de `renderTab()`, con z-index ordenado |
| **Contexto seguro para IA** | Partir siempre de `currentState` |
| **Config. de interfaz** | `saveData` directo, nunca `snapshotAndSave` |
| **Referencia a un icono** | Clave string + mapa central, nunca el componente |
| **Condición sobre cualquier pestaña** | Decidir fuera del `switch` y envolver el resultado, no repetir en cada `case` |
| **Elemento fijo por diseño** | Documentar explícitamente por qué no es personalizable |
| **Cambio atómico multi-campo** | Construir el payload a mano con los valores nuevos explícitos (`aplicarConjuntoTema`), nunca encadenar dos setters que leen el closure |
| **Deep-link** | `foco` + `onFocoConsumido()`, consumido una sola vez, reutilizando el estado ya existente de la vista |
| **Campo nuevo en un `DEFAULT_X`** | Cargar con `{ ...DEFAULT_X, ...guardado }`, siempre |
| **Icono de lucide nuevo** | Verificar que el nombre existe en la versión `0.383.0` antes de importarlo (`Palmtree` → `TreePalm` fue un caso real evitado) |
| **Hooks en `App.jsx`** | Todos los `useEffect` y `aplicarTema()` van **antes** de los `return` condicionales de sesión/carga (error real ya cometido y corregido en A3) |

---

## 13. Limitaciones técnicas permanentes

No son tareas pendientes. Son cosas que **una PWA no puede hacer**, y la app ya lo dice
honestamente en pantalla donde corresponde.

| Limitación | Consecuencia | Cómo se comunica hoy |
|---|---|---|
| Un navegador **no puede leer el tiempo de uso del sistema operativo** | Bienestar digital solo puede registrar lo que Josué escriba a mano | Explicado como motivo permanente en la propia pestaña |
| Un temporizador web **no puede bloquear otras apps** | "Concentración" es un bloque simulado | Frase explícita en la pestaña |
| **Web Push** exige Service Worker + servidor | Las notificaciones solo llegan con la PWA abierta | Nota honesta en la categoría Notificaciones |
| **WebAuthn sin servidor** no verifica firma | La biometría es un gesto local, con la misma confianza que el PIN | Documentado en `biometria.js` |
| **Sin backend de autorización**, una SPA es manipulable desde las devtools | El PIN protege del uso casual, no de un atacante con el dispositivo y conocimientos | Documentado |
| Sin **permisos de admin de Supabase** | Dispositivos autorizados, sesiones, auditoría y borrado de cuenta son imposibles | Documentado como pendiente real, sin promesas |
| **`EyeDropper` API no existe en Safari/iOS** | El cuentagotas del selector de color no aparece en el móvil de Josué | El botón se oculta por detección de función, nunca se muestra roto |
| **`BarcodeDetector` no existe en Safari/iOS** | Se usa `@zxing/library` | — |
| Sin acceso a npm en el entorno de la IA | Ni `esbuild`, ni `npm install`, ni librerías de hash lento, ni librerías de color | Documentado en cada fase desde v1.0.1 |
