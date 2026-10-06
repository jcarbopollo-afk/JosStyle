# JosStyle — CONTRADICCIONES, DUPLICADOS Y DEPENDENCIAS

> Resultado del cruce sistemático de `HANDOFF.md` × `CHANGELOG.md` ×
> `ESPECIFICACION_AJUSTES_ENTREGA1.md` × el código real.
>
> **Leer antes de tocar Ajustes, Seguridad, Calendario, IA o el Dashboard.**
>
> **Actualizado en v1.23.0 (bloque R0):** resueltas **C-01, C-02, C-05, C-06, C-11, C-12 y C-20**;
> **C-22** parcialmente (falta la revisión periódica). El texto de cada una se conserva tal cual
> para que quede constancia del problema y de cómo se resolvió — no se borra, se marca.

---

## PARTE A — CONTRADICCIONES (28)

Formato: **qué choca con qué** → **cuál gana y por qué** → **qué hay que hacer**.
Severidad: 🔴 rompe algo hoy · 🟠 engaña a quien lea la documentación · 🟡 tensión de diseño asumida
· ⚪ histórico ya resuelto, se anota para que nadie lo reabra.

---

### ✅ C-01 — RESUELTA (v1.23.0) — La densidad de interfaz decía que funcionaba y no funcionaba

- `src/tokens.js:137` afirma: *"densidad: 'estandar' — **Fase A7: ya tiene efecto visual real
  (ver index.css)**"*.
- `src/index.css` **no tiene ni una regla `data-densidad`** (verificado por `grep`).
- `src/views/SettingsView.jsx:726` le dice al usuario: *"Se guarda tu preferencia, pero cambiar de
  verdad el espaciado de cada pantalla es trabajo pendiente — **hoy las tres densidades se ven
  igual**"*.
- El apartado **91** de la especificación la exige real (Compacta / Estándar / Cómoda).

**Gana la UI y el `grep`: la densidad NO tiene efecto.** El comentario del código es falso — se
escribió anticipando una implementación que nunca llegó.

**Acción (R0.3):** corregir el comentario de `tokens.js` **ya**, e implementar la densidad de verdad
en R6.1. Que un comentario del código mienta es peor que la función faltante: la próxima IA se fiará
de él y dará el apartado 91 por cerrado.

---

### ✅ C-02 — RESUELTA (v1.23.0) — Fase A7 construida sin registrar

- El código la cita **6 veces**: `tokens.js:58` (alto contraste), `:137` (densidad), `:141`
  (`altoContraste`), `:150` y `:158` (paletas predefinidas), y `GestionTemas.jsx:10`.
- `HANDOFF.md` §0bis lista **solo A1–A6** y declara *"con esta fase se cierra el bloque Ajustes
  completo (A1-A6)"*.
- `CHANGELOG.md` tiene un encabezado por cada fase A1–A6. **No hay ninguno de A7.**

**Gana el código: A7 existe.** Aportó, como mínimo: `altoContraste` +
`CONTRASTE_ALTO_OSCURO`/`CONTRASTE_ALTO_CLARO` (apartado 43, Accesibilidad), las 7 paletas
predefinidas originales (apartado 86) y un intento de densidad (apartado 91) que no llegó a
funcionar.

**Acción (R0.4):** documentar A7 retroactivamente en ambos archivos. Sin esto, cualquier auditoría
futura de "qué apartados de Ajustes están cubiertos" dará un resultado equivocado en dos apartados.

---

### 🔴 C-03 — El orden fijo de 14 categorías de Ajustes contra la limpieza de v1.22.0

- El **apartado 4** define un orden de **14 categorías** y dice literalmente: *"No se permite
  reordenar estas categorías automáticamente"*. Incluye **Inteligencia Artificial** (posición 6) y
  **Funciones experimentales** (posición 13).
- v1.22.0 las **retiró las dos** de `useCategorias()` — la IA porque AXION es una iniciativa aparte
  sin sitio en esa fase, y Experimental porque nunca llegó a tener contenido.
- Hoy `SettingsView.jsx` tiene **12 categorías**.

**Gana v1.22.0 a corto plazo** — la regla nº 45 ("no mostrar controles ni categorías que no hacen
nada") es más fuerte que el orden fijo cuando la categoría estaría vacía. Pero **el orden fijo sigue
vigente**: cuando AXION exista, la categoría "Inteligencia Artificial" debe reaparecer **en la
posición 6**, no al final. Lo mismo con Experimental el día que haya una función experimental real.

**Acción:** ninguna ahora. Anotado como precondición de **R10**. El orden actual ya respeta las
posiciones relativas, así que reinsertar es trivial.

---

### ✅ C-11 — RESUELTA (v1.23.0) — El modelo de IA configurado estaba obsoleto

`api/ask-ai.js:47` → `model: 'claude-sonnet-4-6'`.

Ese identificador no corresponde a ningún modelo vigente. En cuanto Josué active
`ANTHROPIC_API_KEY` en Vercel, **las 13 secciones con `AIPanel`, el buscador universal, el panel de
sugerencias, el escaneo de comida por foto y el análisis de vídeo fallarán todos** con un error de
modelo desconocido — y el síntoma que verá Josué será "la IA no funciona", sin pista de la causa.

Ha pasado desapercibido precisamente porque la clave **nunca se ha activado**: hoy la función
devuelve `503` "IA no configurada" antes de llegar a llamar a Anthropic.

**Acción (R0.1, prioridad máxima entre las baratas):** actualizar a un identificador de modelo
actual antes de que Josué active la clave. Es una línea. Considerar además leerlo de una variable de
entorno (`ANTHROPIC_MODEL`) para que un cambio futuro no requiera tocar código.

---

### ✅ C-12 — RESUELTA (v1.23.0) — La "Puntuación de hoy" no era de hoy

`DashboardView.jsx:248-252`:

```js
let score = 30;
if (ultimoSueno) score += 25;                                   // ultimoSueno = sueno[sueno.length-1]
if (habilidadesActivas > 0 || futbol.length > 0) score += 25;   // "alguna habilidad con nivel > 0, alguna vez"
if (economia.movimientos.length > 0) score += 20;               // "hay algún movimiento, alguna vez"
```

Ninguna de las tres condiciones mira la fecha de hoy. `ultimoSueno` es el **último registro
existente**, no el de anoche. El resultado: en cuanto Josué haya registrado un sueño, tenga una
habilidad con nivel > 0 y un movimiento en Economía, **la puntuación se queda en 100 para siempre**,
mientras la etiqueta debajo dice *"Puntuación de hoy — orientativa, mejora según registres más
datos"*.

Se cruza con dos cosas más:
- El TODO de `HANDOFF.md` §18: *"Revisar si la 'puntuación diaria' del Dashboard debería basarse en
  el día calendario real (heredado)"* — abierto desde la Fase 1.
- La Fase 20 del Prompt Maestro pedía un **"sistema de puntuación diaria (ese punto intermedio entre
  informativo y juego)"** que nunca se construyó (ver **C-22**).

**Acción (R0.2 / R4.1):** rehacer el cálculo sobre el día calendario real. 🔒 Sin puntos
acumulables, niveles ni monedas — mismo espíritu "no sobregamificar" que rige Bienestar y Logros.

---

### ✅ C-20 — RESUELTA (v1.23.0) — `HANDOFF.md` se contradecía a sí mismo

Es la contradicción con más impacto práctico, porque `HANDOFF.md` es **el documento que Josué pasa
de una conversación a otra**.

Los **banners `> ✅ ACTUALIZACIÓN`** de las líneas 5–59 están al día (llegan hasta v1.22.0). Pero las
**secciones numeradas** se quedaron congeladas:

| Sección | Qué dice | Realidad |
|---|---|---|
| §3 "Arquitectura actual" | *"(Fase 21, CERRADA — v1.0.0)"*; describe `PRIMARY_NAV` + hoja "Más" | La navegación es de 5 áreas desde N1 (v1.7.0); `PRIMARY_NAV` **ya no existe** |
| §3 | `personalizacion` = `{ orden, ocultos, iconos, pinExtra, favoritas }` | Faltan `modo` y `dashboardOcultos`; `pinExtra` es vestigial |
| §5 "Estructura de carpetas" | *"package.json (v0.21.0)"*, *"public/manifest.json (faltan los iconos)"* | v1.22.0; los iconos existen desde v1.0.1. Faltan 8 archivos de `lib/` y 5 vistas creados después |
| §8 "Funcionalidades implementadas" | Encabezada *"Nuevas en esta fase (Fase 19)"* | Han pasado 15 versiones |
| §9 "Funcionalidades pendientes" | *"Todo lo demás: Personalización total, Funciones transversales, Pulido final"* | Las tres están construidas |
| §10 "Estado exacto de cada fase" | Fase 20 ⏳ Pendiente, Fase 21 ⏳ Pendiente | Ambas cerradas |
| §13 "Dependencias" | *"package.json en v0.21.0"* | v1.22.0 |
| §15 "Archivos importantes" | *"Nuevos/modificados en la Fase 20"* | Congelado ahí |

**Gana lo más reciente siempre** (banners > secciones numeradas > `CHANGELOG` antiguo).

**Acción (R0.5):** sanear esas ocho secciones. Riesgo cero, valor alto — hoy una IA que lea
`HANDOFF.md` de arriba abajo y se quede con las secciones numeradas creerá que la Fase 20 está
pendiente y que la navegación es la vieja.

---

### ✅ C-05 — RESUELTA (v1.23.0) — `personalizacion.pinExtra` vestigial

- La Seguridad Centralizada (v1.18.0) migró todo a `seguridad.protectedAreas` y **abandonó**
  `pinExtra`; `PersonalizationView` lee y escribe `protectedAreas`.
- Pero `DEFAULT_PERSONALIZACION` **sigue incluyendo `pinExtra: []`** (`tokens.js:426`).
- Y `HANDOFF.md` §3, §6 y §17 siguen describiendo `pinExtra` como el mecanismo vigente:
  *"`renderTab()` envuelve el resultado en `PinGate` si `tab === 'relacion'` o si
  `personalizacion.pinExtra` incluye la pestaña activa"*.

**Gana el código de v1.18.0.** `pinExtra` solo se lee **una vez**, durante la migración, y las
banderas `migradoAreas`/`migradoAcciones` impiden que vuelva a aplicarse.

**Acción (R0.6):** dejar el campo (borrarlo rompería la migración de un usuario que aún no la haya
corrido) pero **marcarlo explícitamente como vestigial** en `tokens.js`, y corregir las tres
menciones de `HANDOFF.md`.

---

### ✅ C-06 — RESUELTA (v1.23.0) — "Josué no usa Face ID — solo PIN"

`HANDOFF.md` §11 sigue diciéndolo. Está **derogado dos veces**:
1. Josué confirmó explícitamente que **sí quiere biometría** (documentado en §0bis y en el
   CHANGELOG "Decisiones de Josué sobre la Entrega 1").
2. La **Fase A5 la construyó** (`biometria.js`, WebAuthn).

§17 ya marca la regla antigua como derogada, pero §11 no se actualizó.

**Acción:** corregir §11 en R0.5.

---

### 🟠 C-04 — Las fechas de Relación en el Calendario: excluidas y luego incluidas

- **Fase 2 del Calendario (v1.16.0)** decidió, con un aviso ⚠️ destacado: *"las fechas importantes
  de Relación quedan fuera a propósito, por privacidad"*, porque el Calendario no pide PIN.
- **v1.22.0 lo revirtió**: ahora se incluyen, pero **condicionadas** a que Relación esté desbloqueada
  en la sesión (`estaDesbloqueado('area:relacion')`) o a que no haya ningún PIN configurado.

**Gana v1.22.0.** No es un cambio de criterio de privacidad, es que apareció la pieza que faltaba: la
Seguridad Centralizada (v1.18.0) trajo el concepto de "desbloqueado en esta sesión", que permite
**condicionar** en vez de **excluir**. La solución no inventa un segundo sistema de permisos, reutiliza
la misma comprobación que ya protege la pestaña.

**Acción:** ninguna, pero **no reabrir**: si una IA futura lee el CHANGELOG de v1.16.0 aislado, creerá
que integrar Relación es una regresión de privacidad. Con la condición de desbloqueo, **no lo es**.

---

### 🟠 C-15 — Hábitos y Rutinas en el Calendario: prometidos y nunca entregados

- El **prompt del Calendario los pide explícitamente** como fuentes derivadas.
- La **Fase 2** los excluyó con un motivo válido: un hábito guarda `historial: { fecha: true }` —
  marcas de cuándo **se hizo**, no de cuándo **toca** — y una rutina no tiene fecha en absoluto.
  Integrarlos exigía un motor de recurrencia real, *"que es trabajo explícito de la Fase 3"*.
- La **Fase 3 construyó el motor** (`expandirRecurrentes`)... y **no volvió a Hábitos ni Rutinas.**

**Nadie gana: es una promesa abierta.** El bloqueo técnico que justificó el aplazamiento ya no
existe, pero sigue faltando **el modelo de periodicidad** en el propio hábito/rutina ("este hábito
toca a diario", "esta rutina toca los lunes").

**Acción (R2.1):** primero añadir periodicidad al modelo de hábitos/rutinas, después conectarlos a
`eventosDerivados()`. Es la pieza que más se acerca a "cerrar el Calendario de verdad".

---

### 🟡 C-07 — "Mínimo scroll en pantallas principales" vs. "Hoy como Centro de Control"

- La especificación de **Optimización móvil** (v1.19.0) exigía que las pantallas principales se
  sintieran compactas, con el mínimo scroll posible.
- La especificación del **Dashboard Centro de Control** (v1.20.0) pidió 3 niveles de información,
  6 mini-accesos, acciones rápidas y métricas favoritas — **más contenido**, y por tanto más scroll.

**Tensión asumida y reconocida por la propia especificación nueva** (su apartado 20: *"si hay
demasiados módulos, prioriza, permite personalización, usa una sección Más"*). Se mitigó con
rejillas compactas y mini-accesos de un renglón, y se dejó `dashboardOcultos` como vía de escape.

**Acción:** **R3.1 (editor de `dashboardOcultos`) es la resolución real de esta tensión**, no un
extra. Es lo que le da a Josué la herramienta para recortar "Hoy" a lo que de verdad usa.

---

### 🟡 C-17 — El sistema de deshacer no cubre Ajustes

- El **apartado 26** exige que cualquier modificación reversible ofrezca "Deshacer" durante unos
  segundos, **con prioridad sobre los diálogos de confirmación**, citando como ejemplos exactos
  *"restablecer un color, ocultar un módulo, cambiar una configuración visual"*.
- La app tiene un deshacer de **10 pasos**, pero **solo para datos** (`snapshotAndSave`). Toda la
  configuración se guarda directo, sin deshacer, y ocultar un módulo usa **confirmación inline** —
  exactamente lo que el apartado 26 dice que hay que evitar.

**Gana el apartado 26 como objetivo, la implementación actual como estado.** El patrón de guardado
directo para configuración (regla nº 22) es correcto y no hay que tocarlo: un deshacer de Ajustes
sería un mecanismo **aparte**, de tipo toast con ventana corta, no meter la configuración en el
histórico de 10 pasos.

**Acción:** R3.11.

---

### 🟡 C-16 — Un único `AI_SYSTEM` vs. la personalidad configurable de AXION

`AIPanel` usa un system prompt único para toda la app, y hay una regla explícita de no cambiarlo
globalmente (las restricciones van dentro de `buildPrompt()`). AXION exige personalidad, nivel de
asistencia, contexto y permisos **por módulo** (apartados 203–330), más memoria y perfiles.

**No es un conflicto hoy** — es un conflicto que aparecerá **el día que se diseñe AXION**. Anotado
como restricción de entrada para esa conversación: cualquier diseño de AXION tiene que decidir si
sustituye el `AI_SYSTEM` único o lo envuelve, **sin romper la firma `buildPrompt()`** de las 13
vistas (regla nº 9).

---

### 🟡 C-18 — "Sin botones Guardar" — alcance del apartado 7

El apartado 7 dice: *"No existen botones 'Guardar', 'Aceptar' o 'Aplicar'"*. Los módulos de datos
(Sueño, Nutrición, Salud...) **sí tienen** botones de añadir/guardar en sus formularios de alta.

**No es una contradicción real: el apartado 7 pertenece a la especificación del módulo Ajustes**, no
de toda la app. Un formulario de alta de un registro no es un ajuste.

**Acción:** ninguna. Anotado para que una IA futura **no vaya a quitar los botones de alta de los
módulos** creyendo que cumple la especificación.

---

### 🟡 C-13 — Recurrencia sin edición de ocurrencia individual

La Fase 3 del Calendario avisa en el propio editor de que guardar cambia toda la serie. El prompt de
la Fase 3 es una lista abierta (*"incluirá potencialmente..."*) sin criterio de finalización, así que
esto es un **hueco declarado**, no un incumplimiento.

**Acción:** R2.4.

---

### 🟡 C-22 — PARCIALMENTE RESUELTA (v1.23.0) — La Fase 20 se cerró sin dos de sus cinco piezas

El Prompt Maestro pedía cinco cosas para la Fase 20. Se entregaron tres:

| Pedido | Estado |
|---|---|
| Centro de logros y mapa de vida | ✅ |
| **Revisión automática semanal/mensual/anual** | ❌ **nunca construida** |
| **Sistema de puntuación diaria** | ✅ **construido en v1.23.0** |
| Motor de automatizaciones empezando por 2-3 fijas | ✅ (3 fijas; el "motor" no existe, pero el texto decía "empezando por") |
| Plantillas y modos viaje/vacaciones/exámenes | ✅ |

Sin embargo, `HANDOFF.md` §11 afirma: *"Fase 20 ya construida **completa**"*, y el CHANGELOG titula
su sección *"Fase 20 — Funciones transversales avanzadas (**completa**)"*.

**Gana el Prompt Maestro: la Fase 20 no está completa.**

**Acción:** R4.1 y R4.2, y corregir la afirmación de "completa" en R0.5.

---

### ⚪ C-08 — Modo oscuro único vs. claro + oscuro + automático

La Fase 1 estableció "solo modo oscuro". La Entrega 1 (apartado 82) exige los tres modos, y Josué lo
**confirmó explícitamente**. La Fase A3 lo construyó.
**Resuelto. No reabrir.** `HANDOFF.md` §2 ya está corregido.

### ⚪ C-09 — "No implementar biometría"

Regla antigua de §17, **derogada** por decisión explícita de Josué y ya construida en A5.
**No volver a bloquear una petición de biometría citándola.**

### ⚪ C-10 — Replit vs. Vercel

`CHANGELOG.md` menciona Replit **7 veces** como entorno de Josué y describe un "atasco exponiendo el
puerto". Josué confirmó que **no usa Replit**; despliega vía **Vercel**.
**El problema nunca fue real para su flujo. No investigarlo, no mencionarlo como pendiente.** Las
menciones se conservan solo como historia.

### ⚪ C-14 — "Fase 22 en adelante"

La nota de procedencia de `ESPECIFICACION_AJUSTES_ENTREGA1.md` remite a *"el plan de fases propuesto
(Fase 22 en adelante)"*. El plan real las llamó **A1–A6** precisamente para no mezclarlas con la
numeración 1–21. Referencia cruzada obsoleta, sin impacto.

### ⚪ C-19 — Datos fósiles en `HANDOFF.md` §5 y §13

`package.json (v0.21.0)` y *"faltan los iconos"*. Absorbido por **C-20**.

---

### ✅ C-21 — Cuatro nombres para el mismo proyecto · **RESUELTA por Josué**

El proyecto llegó a acumular cinco nombres: **JC Fitness** (como lo llamaba él), **JC Lifestyle** y
**JC STYLE** (en las especificaciones de la Entrega 2), **JosStyle** (repositorio de GitHub) y
**Sistema Operativo Personal de Josué** / `sistema-personal-josue` (documentación y `package.json`).
Para rematarlo, la interfaz no usaba ninguno de los cinco: se presentaba como *"Mi Sistema Personal"*.

**Decisión de Josué (D2-08 en `docs/06`):** el nombre oficial y definitivo es **JosStyle**. Los demás
quedan como referencias históricas. Se usa en la interfaz, la documentación y el desarrollo, *salvo
que una especificación concreta indique expresamente otro nombre*.

**Qué se renombró** (v1.27.0):

| Sitio | Antes | Ahora |
|---|---|---|
| Pantalla de acceso (`Auth.jsx`) | Mi Sistema Personal | **JosStyle** |
| `<title>` de `index.html` | Mi Sistema Personal | **JosStyle** |
| Nombre en la pantalla de inicio de iOS | Mi Sistema | **JosStyle** |
| `manifest.json` (`name`, `short_name`) | Mi Sistema Personal / Sistema | **JosStyle** |
| `package.json` (`name`) | `sistema-personal-josue` | `josstyle` |

**Qué NO se ha tocado, y por qué:**

- **El nombre del proyecto en Vercel y la URL de despliegue.** Cambiarlos cambia la dirección con la
  que Josué entra a la app y puede dejar fuera de servicio la PWA que ya tiene instalada. Es una
  acción suya en el panel de Vercel, no del código.
- **El nombre del repositorio.** Ya es `JosStyle`; no hace falta tocarlo.
- **`start_url` del manifiesto.** Sigue siendo `/`: cambiarlo desvincularía la app instalada de sus
  datos guardados en el navegador.
- **Las citas literales dentro de `especificaciones/`.** Es la especificación original de Josué y es
  intocable (regla 47); allí siguen apareciendo "JC Fitness" y "JC Lifestyle" tal cual él los
  escribió.
- **El histórico de `CHANGELOG.md`.** Es historia, no documentación viva.

**Efecto visible para Josué:** la próxima vez que abra la app en el navegador verá "JosStyle" en la
pantalla de acceso y en la pestaña. **El icono que ya tiene en la pantalla de inicio del iPhone
seguirá con el nombre viejo** hasta que lo borre y lo vuelva a añadir — iOS no renombra los accesos
directos ya creados. No pierde ningún dato al hacerlo.

---

### 🟡 C-23 — RESUELTA A MEDIAS (v1.54.0) — En `ESPECIFICACION_SONIDO_Y_RACHAS.md` los títulos de fase no coinciden con su contenido

**Encontrada al empezar el bloque SR (v1.48.0).** D2-01 ya decidió lo importante —Sonido y Rachas
son **dos módulos independientes**, 5 fases y 4— pero eso no dice **qué texto pertenece a cada
fase de cada módulo**, y el archivo está intercalado de una forma que no se puede resolver leyendo:

| Línea | Título que se lee | Contenido que sigue de verdad |
|---|---|---|
| 529 | `FASE 1 — BASE DEL SISTEMA` | Rachas Fase 1 (motor: reglas, historial, idempotencia). **Coherente.** |
| 1002 | *(fin del bloque anterior)* | `Esta es la FASE 1 — ARQUITECTURA Y LÓGICA DEL SISTEMA DE RACHAS` — lo confirma |
| 1008 | `FASE 5 — PRODUCCIÓN…` | Sonido Fase 5, **pegado justo detrás** de la Fase 1 de Rachas |
| **4837** | **`FASE 1 — ARQUITECTURA + MOTOR GLOBAL DE AUDIO`** | **`PROMPT PARA CLAUDE — FASE 4 · Sistema de Rachas: interfaz…`** ← el título dice Sonido F1 y debajo hay Rachas F4 |

`docs/07` ya avisaba de esto ("la checklist las fusiona porque no hay forma automática de separarlas
con certeza"), y se ve en su propia lista: bajo el encabezado *SR · Fase 1/5+4 — Arquitectura +
motor global de audio* hay 27 apartados del **motor de rachas** seguidos de 40 de la **interfaz de
rachas**, y **ni uno solo de audio**.

**Lo que sí está claro y por eso se ha construido:** el texto de las líneas 529-1000 es, sin
ambigüedad, **Rachas Fase 1** — lo dice su propio cierre. Es una fase completa, cerrada y que no
depende de resolver nada de esto. Se ha implementado como **RA · Fase 1/4** (v1.48.0).

**Lo que está detenido hasta que Josué conteste** (regla 49: para la fase afectada, no la sesión):

1. **¿Dónde está el texto real de la Fase 1 del Sistema de Sonido** (arquitectura y motor global de
   audio)? En el archivo no aparece: donde debería estar hay una fase de Rachas.
2. **¿En qué orden van los dos módulos?** ¿Las 4 fases de Rachas primero y luego las 5 de Sonido, o
   alternándose? Sonido F3 ("eventos, feedback y recompensas sonoras") **necesita** el motor de
   rachas, así que Rachas parece ir antes, pero eso es deducción mía, no una decisión suya.

**✅ Contestado por Josué (v1.54.0).** Pasó el texto que faltaba de la Fase 1 del Sonido —el que la
especificación no contenía— así que las dos preguntas quedan resueltas: el texto existe, y el orden
ya no importa porque Rachas está entero (4/4). **SO F1 está construida.**

**⏸ Lo que sigue pendiente, y no es una contradicción sino un límite real:** el módulo de Sonido necesita
**archivos de audio** que no existen en el proyecto. El propio Josué lo escribió dentro de la
especificación: *"esto lo voy a hacer cuando la web ya tenga todos los botones activos y todo, no te
lo voy a dar aún"*. Sin los sonidos, un motor de audio sería un control decorativo — justo lo que
prohíbe la regla 8.

---

### ✅ C-25 — ¿Higiene y Cuidado corporal son UN módulo o DOS? · **RESUELTA por Josué (v2.7.0)**

**Estuvo bloqueando EH F18, F19 y F22 desde v1.67.0.** La Fase 2 los pone como **dos** módulos del
catálogo; las Fases 18 y 19 los tratan como **uno solo** llamado *"Cuerpo e higiene"*. Las dos
lecturas rompían un prompt suyo y cambiaban lo que ve en pantalla, así que se aplicó la **regla 49**:
se anotó, se siguió por lo que no dependía de ella (F20, F21, F23-F43) y se le preguntó.

**Josué preguntó *"dime en qué se diferencian aseo y cuidado corporal"*, y al contestarle se le
pusieron las tres preguntas. Sus respuestas:**

| | Pregunta | Respuesta de Josué |
|---|---|---|
| 1 | ¿Dos apartados separados o uno solo? | **Dos apartados separados**, como en la Fase 2 |
| 2 | *Cuidado de manos* y *Cuidado de pies*: ¿aquí o la Fase 22? | **Son la Fase 22.** Aquí solo se encienden |
| 3 | ¿*Higiene* o *Aseo*? | **Higiene**, como estaba |

**Lo que eso significa en código:**

- `MODULOS_EH` **no cambia**: `higiene` y `cuerpo` siguen siendo dos líneas, con sus dos
  interruptores. No se retira nada del catálogo, y el apartado 17 de la F18 —*"puede quitar 🚿
  Higiene diaria sin quitar 🧴 Cuidado corporal"*— se cumple **literalmente**.
- Las **siete casillas** del apartado 1 de la F18 se reparten entre los dos:

| Casilla | Módulo | Dónde se configura |
|---|---|---|
| Higiene diaria · Desodorante | `higiene` | F18/F19 |
| Cuidado de manos · Cuidado de pies | `higiene` | **F22** (aquí solo el interruptor) |
| Cuidado corporal · Cuidado específico · Seguimiento | `cuerpo` | F18/F19 |

- La F22 vive **dentro de `higiene`**, que es exactamente el *"🧼 Cuidado personal"* de su apartado 1
  — el módulo se llama *Higiene* y su icono ya era 🧼.

**⚠️ Y de paso se cerró un solape interno de la propia F18** que no estaba anotado: su apartado 1
lista *Desodorante*, *Cuidado de manos* y *Cuidado de pies* como casillas sueltas, pero su
apartado 3 las mete **dentro de "Higiene diaria"**. Con dos módulos y el reparto de arriba, las
cuatro son partes de `higiene` y el solape desaparece sin tener que elegir.

---

### 🟡 C-24 — "106 fases" no cuadra con el desglose por módulos · **detectada en v1.67.0, no bloquea nada**

**Encontrada al abrir el bloque EH.** Toda la documentación llama a la Entrega 2 *"las 106 fases"*,
pero el desglose por módulos de `docs/07` suma **110**:

| EH | HT | FO | SR | ME | BI | AR | **Suma** |
|---|---|---|---|---|---|---|---|
| 65 | 12 | 12 | 5+4 | 4 | 4 | 4 | **110** |

El 106 viene de `docs/06_ENTREGA2_ANALISIS.md` (línea 26, tabla TOTAL) y de ahí se copió a todos los
demás documentos. La diferencia son cuatro fases de **Estilo de Hombre**, y ahí el desglose tiene
razón: las fases de EH están numeradas ***"x/65"* dentro de la propia especificación de Josué**, y
`docs/07` contiene **65 encabezados `#### EH · Fase n/65`**, del 1/65 al 65/65, ninguno inventado.

**Por qué no la he resuelto por mi cuenta:**

- **No cambia el trabajo.** El número de fases que hay que construir es el que dice el desglose, y
  ese ya se está siguiendo: EH F1 se ha construido como *"1/65"*, no como *"1/61"*.
- **Cambiar el rótulo tocaría siete documentos** (`00`, `02`, `03`, `05`, `06`, `07`, `CLAUDE.md`,
  `HANDOFF.md`) y rompería las referencias cruzadas de todos ellos por una cifra de portada.
- **Es contabilidad, no una contradicción de especificación**, así que la regla 49 no obliga a
  detener ninguna fase. Se anota, se sigue, y se le pregunta.

**⏸ Lo que se le pregunta a Josué:** ¿se corrige el rótulo a **110 fases** en todos los documentos,
o se deja "106" como nombre histórico de la entrega —igual que *JC Fitness*— sabiendo que el
desglose real son 110?

**Mientras tanto:** los recuentos de avance se escriben con las dos cifras a la vista (*"44 de las
106"* con la nota de C-24 al lado), y el progreso por bloque —**EH 1/65**— es el que no miente.

---

### C-31 — 🔓 RESUELTA (DIST F1, v3.77.0) · Productividad no se puede repartir entre Vida y Gestión

**Dónde:** su encargo de la reorganización de áreas (2026-09-12), puntos 1 y 2.

**Qué dice.** Pide dos listas que se solapan:

- **Vida** = Objetivos, Diario, Biblioteca, Rachas, **Hábitos**
- **Gestión** = **Tareas**, Calendario, Horario, **Rutinas**, Economía, **Metas/planificación**

**El problema.** *Objetivos, Hábitos, Tareas, Rutinas y Metas no son módulos*: son **cinco de las
seis mini-apps de Productividad**, que es **una sola pantalla** construida entre la E3 F23 y la
E3 F29. Repartirlas entre dos áreas exigiría **partir ese lanzador**, y eso es exactamente lo que su
propio encargo prohíbe dos párrafos más abajo: *"No quiero rediseñar Jos Style desde cero. No
eliminar funcionalidades. No crear módulos duplicados."*

⚠️ Y él ya lo sospechaba, porque escribió: *"Revisa cómo están implementados actualmente y
mantenlos funcionales. No crees módulos duplicados."* Esto es el resultado de esa revisión.

**Lo que se ha hecho mientras tanto (NAV F1, v3.69.0):** todo lo demás de su encargo, que **no
depende de esto**. Calendario y Horario están en Gestión, el resto de Vida está como él lo quiere, y
**Productividad se queda entera en Vida**, que es donde estaba: no se parte, no se duplica y no se
mueve a medias.

**⏸ Lo que se le pregunta a Josué**, con las tres salidas reales:

1. **Productividad entera a Gestión.** Es donde caen 4 de sus 6 mini-apps (Tareas, Rutinas, Metas,
   Pomodoro). Objetivos y Hábitos se abrirían desde Gestión. Un cambio de una línea.
2. **Productividad se queda entera en Vida** (lo que hay ahora). Tareas y Rutinas se abren desde
   Vida.
3. **Partir el lanzador de verdad**: convertir las seis mini-apps en módulos independientes y
   repartirlas. Es una fase grande, deshace la E3 F23 y hay que decirlo: **no es reorganizar, es
   rediseñar**.

**No bloquea nada** (regla 49): se anota, se sigue con el resto y se le pregunta al cerrar el turno.

---

🔓 **RESUELTA POR JOSUÉ (2026-09-13, encargo «DISTRIBUCIÓN DE TODO» → DIST F1).** No eligió ninguna
de las tres salidas que se le ofrecían: dio **una cuarta, mejor**, y lo hizo con precisión.

> *"Organización — Crear este módulo como agrupador de: Tareas, Calendario, Horario. […] **Tareas
> debe quedar dentro de Organización, no dentro de Productividad**."*

> *"Productividad debe quedar preparada para contener funcionalidades como: Hábitos, Rachas,
> Objetivos, Pomodoro, y otras herramientas relacionadas con productividad. **No elimines las
> funcionalidades existentes; reorganízalas**."*

**Por qué funciona y las tres salidas de arriba no:** el problema era que repartir las mini-apps
exigía partir el lanzador. Él saca **una sola** —Tareas— y la mete en un **agrupador nuevo**
(Organización), que es una pantalla más, no un trozo del lanzador. Productividad conserva las otras
cinco **y gana Rachas**, así que sigue siendo seis y **no se parte nada**.

⚠️ **Y no había que adivinarlo.** Si en NAV F1 se hubiera elegido por él —mover Productividad entera
a Gestión, que era la opción 1 y parecía la más razonable— hoy habría que deshacerlo: Josué la quería
en Vida. La regla 49 hizo su trabajo.

**Qué se construyó:** `src/lib/agrupadores.js` declara Mente y Organización; `TareasTab` se
**exporta** desde `ProductivityView` y la pinta Organización —no se ha reescrito—; y Rachas entra en
`MINI_APPS_PR` con su `RachasView` de siempre. Ni un dato se movió.

---

### C-32 — ⏸ PENDIENTE DE JOSUÉ (SF F1, v3.82.0) · El zoom al tocar un campo, y el pellizco bloqueado

**Son dos cosas enganchadas, y por eso no se ha tocado ninguna: arreglar una sin la otra empeora
algo.** Salió al barrer el código buscando lo que Safari hace distinto (SF F1).

1. **`TextInput` usa `text-sm`, o sea 14 px.** En Safari de iOS, enfocar un campo con la letra por
   debajo de 16 px **hace zoom a la página**: tocas para escribir y toda la pantalla se te acerca,
   y hay que pellizcar para volver. Es de los detalles que más molestan en un móvil.
2. **`index.html` lleva `maximum-scale=1` en el `viewport`.** Eso es justamente lo que se pone para
   evitar ese zoom… y de paso **intenta bloquear el pellizco para ampliar**, que es un problema de
   accesibilidad — y este proyecto tiene un revisor de accesibilidad desde EH F42. ⚠️ Además,
   **Safari moderno lo ignora en parte**, así que puede que no esté ni evitando el zoom.

**Por qué no se decide solo:** subir todos los campos a 16 px es el arreglo estándar y el que quita
la causa de raíz, pero **cambia el aspecto de todos los formularios de la aplicación**, y eso no
entra en ninguna fase que él haya pedido. Quitar el `maximum-scale` sin subir la letra reintroduce
el zoom del que se quería escapar.

**La pregunta, en una línea:** *¿al tocar un campo de texto se te hace zoom a la pantalla?*

- **Si sí** → se sube la letra de los campos a 16 px y se quita `maximum-scale=1`. Queda mejor y más
  accesible, con formularios algo más grandes.
- **Si no** → se deja como está, y se anota que en su iPhone no ocurre.

⚠️ **Y esto no se puede comprobar desde aquí**: el recorrido corre en Chromium, que no hace ese zoom.
Es R1 puro.

🔓 **La FIT F38 (v3.120.0) cayó encima —sus apartados 8, 9, 26 y 27— y no hizo falta tocarla.** Los
campos que más se usan con el dedo, los del **entrenamiento en vivo**, **ya van a 16 px** (el
recorrido lo mide) y no hacen zoom; lo que añadió la fase son las props de teclado (sin
autocorrector ni autocompletado y con la tecla de Intro que toca), que no cambian el aspecto. Subir
el resto de formularios sigue siendo **su** decisión, y está declarado en `NO_EN_FIT38`.

---

### C-33 — 🔓 RESUELTA POR JOSUÉ (FIT F1, v3.83.0) · Los diez rangos de Fitness contra D2-02

**La Entrega 4 fija *"Rangos: 10 niveles"* como decisión de producto (apartado 22 de la FIT F1), y
D2-02 —decisión cerrada de Josué— dice que no hay niveles fuera de Sonido y Rachas:** *"Nada de
puntos, niveles ni monedas en Bienestar. XP y niveles solo dentro de Sonido/Rachas, sin salir de
ahí."* Fitness vive en Bienestar.

**No se ha parado la fase, y ésta es la lectura con la que se ha construido**, escrita para que él
pueda desmontarla en una línea si no le convence:

Lo que D2-02 prohíbe es **gamificar la aplicación**: puntos por usarla, monedas, niveles que suben
por abrir pantallas. Un rango de Fitness no es eso, es **una medida de lo que hace su cuerpo**,
como los estándares de fuerza que usa cualquier gimnasio:

- **no se gana usando la aplicación**, sino registrando ejercicios reales;
- **no se canjea por nada** y **no desbloquea nada**;
- **no existe hasta que hay datos**: sin ejercicios clasificados el rango es `null` y la pantalla
  dice «Sin Rango», que es lo que pide el propio enunciado;
- **ni XP, ni monedas, ni recompensas, ni premios**: hay una comprobación en `test-fitness.mjs` que
  barre todos los textos que ve Josué buscando esas palabras;
- y los diez se llaman por **lo que miden** —Iniciación, Intermedio, Avanzado, Élite—, nunca
  «Nivel 4»: hay otra comprobación para eso.

🔓 **Y LA CONTESTÓ ÉL EL MISMO DÍA (2026-09-13):** *"Tienes permiso para eso que me has preguntado.
Siempre: no me preguntes, porque si no paras el flujo."* Los diez rangos se quedan como están, con
esta lectura, y **D2-02 sigue en pie para todo lo demás**: lo que él ha autorizado es el rango como
medida física, no gamificar Bienestar.

⚠️ **Y hay una segunda cosa dicha ahí, que vale para todas las fases que quedan:** no se para a
preguntar. Una contradicción se **anota con la lectura elegida y su motivo** —como ésta— y se sigue;
la regla 49 se cumple dejándolo escrito y contándoselo al cerrar, nunca deteniendo el trabajo.

**Si algún día cambia de opinión**, se cambia `NIVELES_RANGO` en `src/lib/fitness.js` y ya está: es
un catálogo, no una arquitectura.

### C-34 — ✅ RESUELTA AL CONSTRUIR (FIT F25, v3.107.0) · La confianza del rango general

**El apartado 6 de la FIT F25 pide enseñar la confianza del rango global —*"Utilizar la confianza
real del RankEngine. No crear una puntuación de confianza nueva"*— y el apartado 35 dice, en la
misma fase, *"NO modificar el RankEngine"*. Y el rango global no devolvía su confianza**, así que
cumplir el 6 sin tocar el motor era imposible.

**La lectura con la que se ha construido, que respeta las dos:**

Lo que el apartado 35 protege es **el cálculo**: la fórmula de la puntuación, los umbrales de los
diez rangos, el peso de lo estimado frente a lo real. Nada de eso se toca — ni un score cambia, y
las ocho suites de rangos siguen en verde sin editar una sola comprobación. Lo que se ha añadido es
**una agregación** de valores que el motor ya tenía: `confianzaCombinada()` devuelve **la del
eslabón más flojo** entre los grupos que entran en la media, usando el catálogo `CONFIANZA` de la
F15 y sin inventar un cuarto nivel ni un umbral nuevo.

🔁 **Y es exactamente el precedente de la FIT F22**, que sacó `fuenteCombinada()` por el mismo
motivo: `rangoDeGrupo` agregaba puntuaciones y no procedencias, así que el historial de Espalda no
podía decir de dónde venía un cambio. La regla ya se aplicaba dentro de `rangoGlobalEfectivo`; se
escribió una vez y la llamaron los dos.

🐛 **Y por el camino apareció un fallo real, vivo desde la FIT F20.** `base()`, en
`explicacionRangos.js`, lee `r.confianza` para componer el bloque de confianza de la explicación. El
rango de un **ejercicio** la devuelve y el de un **grupo** también, pero el **global** no: así que
`confianzaExplicada(undefined)` daba `null` y **el bloque de confianza del rango general no se ha
enseñado nunca**. No fallaba: callaba — la familia de fallos que este proyecto lleva contando desde
la FIT F7 (*la FORMA de lo que devuelve una función*). Hay dos comprobaciones en
`test-resumen-rangos.mjs` que lo miden, y una tercera que exige que sin rango siga sin enseñarse.

**Si algún día se quiere otra agregación** —la media en vez del mínimo, o ponderar por cobertura—
se cambia `confianzaCombinada` en `src/lib/motorRangos.js` y ya está: son cuatro líneas, y los tres
niveles siguen siendo los de la F15.

### C-35 — ✅ RESUELTA AL CONSTRUIR (FIT F26, v3.108.0) · El PIN de las fotos de progreso

**La FIT F26 dibuja una galería de fotos en Fitness → Progreso y no menciona el PIN en ningún
apartado. Pero las fotos de progreso de Josué están detrás de `fotos_privadas`** desde la fase de
Seguridad Centralizada, porque él lo configuró así. Son **la misma lista** (`saludFotos`), así que
una galería nueva sin protección habría sido una segunda puerta a lo mismo, sin PIN.

**La lectura con la que se ha construido:** el apartado 38 de esa misma fase dice *"No exponer
fotografías públicamente"* y el 21 *"Por defecto: Private"*. Saltarse una protección que el usuario
eligió es exactamente lo contrario de lo que piden, así que la galería de Fitness lleva **la misma**,
leída **del mismo sitio**: `seguridad.protectedActions.includes('fotos_privadas')` y
`estaDesbloqueado('accion:fotos_privadas')`.

🐛 **Y LA PRIMERA IMPLEMENTACIÓN ESTABA MAL — corregida en la FIT F27 (v3.109.0).** La F26 leía
bien la decisión, pero la aplicaba pasando `onAddFoto: null`, así que con el PIN puesto la pestaña
se quedaba en el acceso mudo de la F12 **y no había forma de desbloquearla desde Fitness**. Y
`fotos_privadas` entra en `protectedActions` **en la primera carga de toda cuenta** —lo hace la
migración de Seguridad Centralizada, porque Salud ya protegía esa pestaña siempre—, o sea que la
galería **no se podía abrir nunca**: una pantalla inalcanzable es la regla 8 exacta. La sección del
recorrido llevaba **tres pasadas en rojo** diciéndolo y se achacó dos veces a las bombas de
relojería de otras secciones y una tercera a un `package.json` tocado a media pasada.

**Heredar una protección es heredarla ENTERA: la puerta y su llave.** Fitness recibe ahora las
**mismas cinco props** que `HealthView` —`protegidoFotos`, `pinHash`, `pinSalt`,
`desbloqueadoFotos`, `onDesbloquearFotos`, `onOlvidoPin`— y enseña el **mismo `PinGate`**. Con la
protección quitada se ve la galería; con ella puesta se pide el PIN, no un hueco. El recorrido lo
comprueba **por los dos lados**, que es la comprobación que faltaba.

⚠️ **Y se escribe una vez, no dos.** Un segundo criterio aquí habría sido dos decisiones de
seguridad sobre la misma lista, y el día que una cambiara dirían cosas distintas — que es cómo este
proyecto acabó con la mentira de los sonidos escrita en tres sitios.

**Si algún día quiere la galería de Fitness sin PIN**, la respuesta no es tocar esto: es quitar
`fotos_privadas` de las acciones protegidas en Ajustes, que es donde esa decisión vive.

### C-36 — ✅ RESUELTA AL CONSTRUIR (FIT F29, v3.111.0) · El «nombre histórico» de un ejercicio archivado

**El apartado 28 de la FIT F29 pide que, si un ejercicio se borra del catálogo pero existe en
sesiones guardadas, se conserven *"nombre histórico, resultados y fechas"*. Los resultados y las
fechas están. El nombre histórico NO EXISTE EN NINGUNA PARTE, y es a propósito.**

Lo decidió la **FIT F3**, y está escrito en `crearWorkoutExercise`: una línea guarda `exerciseId`
*"y nada más del ejercicio — ni el nombre, ni los músculos, ni el equipamiento"*, y
`nombreDeLinea()` **le pregunta al catálogo**. Esa decisión es la que hace que renombrar un
ejercicio lo renombre en las veinte rutinas donde esté (AS F1 con las asignaturas, exactamente lo
mismo). Y la **F11** hace `nombre: ej ? ej.nombre : exerciseId`, así que al desaparecer del catálogo
lo único que sobrevive es **el id**.

**La lectura con la que se ha construido, que respeta las dos partes:**

- Lo que ese apartado protege de verdad —*"NO eliminar los datos históricos"*— **se cumple entero**:
  los resultados, las series y las fechas siguen ahí, y el detalle se abre con normalidad. Hay
  comprobaciones que lo miden sobre un ejercicio que no está en el catálogo.
- El nombre **no se inventa**. Guardarlo ahora sería crear la segunda fuente de verdad que la F3
  quitó, y escribirle uno a posteriori sería **reescribir el pasado** (FIT F22, apartado 12).
- Se enseña **su id**, que es el único identificador que sobrevive, con la etiqueta **«Ejercicio
  archivado»** y su frase. Esconderlo dejaría varios archivados indistinguibles entre sí.

⚠️ **Por qué no se arregla guardando el nombre en la sesión.** Se podría —el snapshot de la F7 es
*"la única copia que este proyecto sí debe hacer"*—, pero cambiaría `crearWorkoutExercise`, que es
el modelo que normaliza **cada carga**, y la F3 dejó escrito por qué no lleva nombre. Hacerlo desde
una fase de *lectura* como la F29 sería cambiar cómo se guardan sus entrenamientos por la puerta de
atrás (AS F1, apartado 10). **Si algún día Josué quiere el nombre histórico**, es una fase suya: se
añade a `crearWorkoutExercise`, se normaliza y **solo vale para lo que entrene a partir de ese
día** — lo de antes ya no se puede recuperar.

🔓 **Y la FIT F39 (v3.121.0) lo matiza sin reabrirlo.** Su apartado 21 pide *"mostrar snapshot
histórico si existe"* —y no existe, por lo de arriba— y su apartado 55 prohíbe enseñar *"IDs
técnicos"*, que es justo lo que se enseñaba: «k3j9x2ab» si el ejercicio era uno propio. **La lectura
que respeta las tres cosas**: se sigue sin guardar nombre (C-36 en pie), y lo que se enseña es lo que
se **lee** del id — uno del catálogo es una ranura en español, así que *«dominada-pronada-antigua»*
se lee **«Dominada pronada antigua»** (el ejemplo del propio apartado 21); uno propio lo pone
`uid()`, no dice nada, y es **«Ejercicio no disponible»**. Vive en `nombreSinCatalogo()`
(`ejercicios.js`), y las comprobaciones de la F29 que exigían el id pelado **se dieron la vuelta**.

---

### C-37 — ✅ RESUELTA AL CONSTRUIR (FIT F30, v3.112.0) · El `completedAt` que el apartado 15 pide guardar

**El apartado 15 de la FIT F30 enumera los campos de un objetivo e incluye `completedAt`. La
FIT F14 decidió lo contrario: `fitness.objetivos` guarda SOLO el objetivo, y todo lo demás
—conseguido, porcentaje, valor actual— se deduce de las sesiones con la F11.**

Y no es una decisión suelta: es la misma que tomaron la **F15** con los rangos (*"los rangos se
calculan, no se guardan"*), la **F22** con el historial de rangos, la **F24** con la cola de
clasificación y la **F28** con la línea temporal. Cinco veces en esta entrega.

**La lectura con la que se ha construido, que respeta las dos partes:**

- **La fecha existe y se enseña**: `conseguidoEn` sale de **la sesión que superó el objetivo**, que
  es el dato que lo sostiene. Lo que pide el apartado 15 —saber cuándo se consiguió— se cumple
  entero, y se ve en el detalle y en la microcelebración.
- **No se guarda**, porque una copia **mentiría en cuanto él borrara esa sesión**: el objetivo
  seguiría diciendo «conseguido el 14 de septiembre» sin una sola marca detrás, que es exactamente
  lo que prohíbe el **apartado 17** del mismo enunciado (*"Debe existir evidencia real"*). Los dos
  apartados no pueden cumplirse a la vez con un campo guardado.
- Y de paso resuelve el **apartado 41** sin una línea: *"si se borra una sesión, recalcular"* sale
  gratis cuando no hay nada que invalidar.

⚠️ **Lo que sí se comprueba es que una sesión posterior PEOR no lo descomplete** (apartado 27, con
su ejemplo exacto): sale gratis también, porque `valorActual` devuelve la **mejor marca histórica**
y un máximo no baja al añadir. Está medido en la suite, con el ejemplo del enunciado.

### C-38 — ✅ RESUELTA AL CONSTRUIR (FIT F31, v3.113.0) · «Las mismas convenciones temporales» cuando la convención contaba un día de más

**El apartado 5 de la FIT F31 pide *"utilizar las mismas convenciones temporales del resto de
Fitness"*, y el apartado 8 pide una frase exacta: *"Entrenaste 8 de los últimos 14 días"*. Las dos
cosas no cabían juntas, porque la convención de Fitness contaba N + 1 días**: cada pantalla
calculaba el primer día de un periodo a mano con `addDays(hoy, -p.dias)` —siete veces en seis
archivos: F12, F13, F22, F28 y F29—, y eso es de hoy hacia atrás **ocho** fechas para «7 días».
Reutilizarla tal cual habría escrito *«Entrenaste 15 de los últimos 14 días»* el día que entrenara
todos.

Y había un segundo choque dentro del primero: la F29 dejó escrito que hay *"un solo catálogo de
periodos"*, y el historial de rangos de la **F22 tenía el suyo**, con **90** días para «3 meses» y
**180** para «6 meses», donde el catálogo único dice 91 y 182.

**La lectura con la que se ha construido, que respeta las dos partes:**

- **Una sola convención, y la correcta**: `inicioDePeriodo(dias, hoy)` en `progresoEjercicios.js`
  (el archivo del catálogo único), con hoy como uno de los N. **Las siete llamadas pasan a usarla**,
  así que «las mismas convenciones» se cumple **literalmente**: ya no hay dos.
- **Un solo catálogo**: `PERIODOS_HISTORIAL` es ahora un subconjunto **por ids** de `PERIODOS`.
- ⚠️ **Lo que cambia para Josué, y es poco**: en las gráficas del progreso, el progreso muscular,
  el detalle de un ejercicio y el resumen, **cada periodo empieza un día más tarde** —el día que
  sobraba—. En el historial de rangos «3 meses» **empieza el mismo día que antes** (90 días atrás),
  «6 meses» uno antes (181 en vez de 180, porque ahora vale 182 como en todas partes) y «1 año» uno
  después. Ninguna suite de las cinco fases se puso roja: ninguna comprobación medía el día de más.
- Y la **semana** (apartado 22) empieza el **lunes** porque **ya era así** (`diaDeFecha`, HT F1; la
  F10; RA F1): *"Si Jos Style ya tiene una configuración global: REUTILIZARLA"*.

⚠️ **La F31 destapó otros tres fallos de antes, que no son contradicciones sino fallos, y se
arreglaron donde nacían**: la «última sesión» del bloque de entrenamientos de la F28 era **la más
antigua** (se guardan al final de la lista); una sesión guardada **sin fecha se mudaba a hoy en cada
carga** (la fábrica ponía `todayISO()` y el normalizador la llamaba igual al cargar); y una sesión
**repetida por id contaba dos veces** (nada la quitaba en la puerta de carga). Están en el CHANGELOG
de la v3.113.0, cada uno con su comprobación.

---

### C-39 — ✅ RESUELTA AL CONSTRUIR (FIT F32, v3.114.0) · «El pasado no se reescribe» con un plan activo que solo guarda uno

**El apartado 2 de la FIT F32 pide que la planificación *"se derive de activePlan y su estructura
de días. No crear una segunda planificación independiente"*, y el apartado 22 pide que, al cambiar
de plan, *"las semanas históricas mantengan la información original. No reescribir el pasado"*.
Con lo que había, las dos cosas no cabían juntas**: `fitness.planActivo` (F5) guarda **un** plan y
desde cuándo, así que derivar la semana pasada del plan activo la reescribía con el plan nuevo en
cuanto él cambiara —justo lo que prohíbe el 22—. Y el plan que seguía antes **no se puede derivar
de nada**: es un hecho que pasó.

**La lectura con la que se ha construido, que respeta las dos partes:**

- **Lo planificado se sigue derivando del plan** —del activo desde su activación y, antes, del que
  había entonces—, sin una segunda planificación: ni una semana guardada, ni una sesión creada al
  navegar. Toda la lectura pasa por `semanaDelPlan` (F6), ampliada.
- **Lo único nuevo que se guarda es el tramo que se cierra al cambiar de plan**, en
  `fitness.planesAnteriores`: qué plan, desde y hasta cuándo, y **la estructura de sus días**
  —nombre y si descansaba—. Lo apuntan `usarPlan` y `quitarPlanActivo` (`planes.js`), las dos
  únicas puertas que cambian el plan activo, y tiene su normalizador en la puerta de carga (regla 5).
  Es la copia que este proyecto sí hace de lo que es **historia** (el snapshot de una sesión, F7):
  sin ella, un plan borrado o una plantilla editada cambiarían lo que dice el pasado.
- ⚠️ **Solo la estructura, ni un ejercicio**: lo que hizo de verdad ya lo congela cada sesión. Por
  eso de un día de un plan anterior se enseña su nombre y no se ofrece «Ver entrenamiento» ni
  «Empezar» (está declarado en `NO_EN_FIT32`).
- ⚠️ **Lo que no puede saberse, no se inventa**: antes del primer tramo apuntado —lo guardado antes
  de la F32 no tenía historial de planes— un día es `unknown` («Sin datos del plan»). Entre quitar un
  plan y poner otro sí se sabe: no había plan.

⚠️ **Y la F32 destapó un fallo de la F5 que no es una contradicción, y se arregló donde nacía:
los días de un plan de la biblioteca nacían con un id ALEATORIO en cada carga** (`crearDiaDePlan`
con `uid()`, porque el catálogo es código y no trae ids). Una sesión empezada desde el Push del
PPL guardaba en su `origen` y en su `diaDePlan` un id que al recargar ya no existía, así que el
apartado 19 —relacionar la sesión con su día por `planId + dayId`— no podía cumplirse. Ahora el id
es la ranura del día en la semana (`ppl-estetico-dia-1` es el lunes). Lo guardado antes con un id
aleatorio no se da por «otro entrenamiento»: se dice **«Entrenamiento realizado»**, porque no se
sabe qué día fue.

### C-40 — ✅ RESUELTA AL CONSTRUIR (FIT F33, v3.115.0) · El plan de una serie se congela (F7) y el peso no puede viajar al sustituto (F33)

**La FIT F7 congela lo planificado de cada serie al empezar la sesión** —su comentario lo dice con
todas las letras: *"Lo que decía el plan. No se toca nunca después de crear la sesión"*— **y la
FIT F33 manda conservar al sustituir *"series, repeticiones, descanso, notas"*** (su apartado 11),
**que deja fuera el peso a propósito**. Con el plan congelado entero, el peso de la barra seguía en
`plan.peso` de unas mancuernas, y el «+» de la F9 (su apartado 10) **parte de ese número**: sumar
2,5 kg a unas mancuernas vacías daba 62,5.

**La lectura con la que se ha construido, que respeta las dos partes:**

- **El plan sigue congelado**: las repeticiones y la duración planificadas no se tocan al sustituir.
  Si la medida cambia —un press por un L-sit—, las 10 repeticiones no se leen como 10 segundos,
  porque `textoPlanificado` lee la duración, que está vacía: la serie queda «sin planificar», que es
  la verdad (apartado 12).
- **Lo único que se quita es `plan.peso`**, porque era del otro ejercicio (la F7 ya quitaba el peso
  **registrado** por lo mismo). Lo que decía la plantilla sigue entero en `linea`, así que el
  historial no pierde nada.
- Está declarado en `DECISIONES_FIT33` y medido en `test-sustitucion.mjs` y en el recorrido.

⚠️ **Y dos cosas del mismo apartado que no son contradicciones, dichas para que nadie las reabra:**
el apartado 4 enumera *isométrico, explosivo y skill* entre los patrones y en la línea siguiente
manda *"Si el ejercicio actual ya dispone de un patrón equivalente: REUTILIZARLO"* — ya existían en
`tipos` y `explosivo`, así que son **modalidades**, no patrones nuevos. Y el apartado 3 pide
considerar *"rango de movimiento"*, que el catálogo **no guarda**: se usa lo único que sí sabe (si
el ejercicio es estático) y el límite está escrito en `CRITERIOS_COMPATIBILIDAD`, sin inventar un
recorrido que nadie ha medido (regla 8).

### C-41 — ✅ RESUELTA AL CONSTRUIR (FIT F35, v3.117.0) · Tipos estrictos (apartado 35) en un proyecto sin TypeScript, contra *"no sobreingenierizar"* (apartado 40)

**El apartado 35 pide *"tipos o interfaces claros"* para el `Exercise` —*"si el proyecto usa
TypeScript"*— y el 40 prohíbe *"sobreingenierizar"*.** JosStyle es JavaScript de principio a fin:
migrarlo cambiaría la cadena de compilación de las 70 vistas para ganar lo que ya da el editor.

**La lectura con la que se ha construido, que respeta las dos partes:** los tipos van en **JSDoc**
(`@typedef Exercise` y sus ids en `ejercicios.js`, y `@returns {Exercise}` en la fábrica). El editor
avisa de un campo mal escrito, **la compilación no cambia** y el contrato real lo hace cumplir la
validación de la F35, que es lo que el apartado quería proteger. Declarado en `NO_EN_FIT35`.

⚠️ **Y la C-36 se cierra del todo aquí:** el apartado 37 da el `isArchived` que la F29 no tenía, así
que un ejercicio que se archiva **conserva su nombre** en el historial. Lo que ya no está en el
catálogo sigue siendo «Ejercicio archivado» con su id, como decidió la C-36: inventarle un nombre
seguiría siendo reescribir el pasado.

### C-42 — ⏸ PENDIENTE DE JOSUÉ (FIT F40, v3.122.0) · Dividir el bundle en trozos (apartados 22 y 23) contra una aplicación que se publica en cada fase y se queda abierta en el iPhone

**Los apartados 22 y 23 piden *"cargar determinadas partes de Fitness bajo demanda"* y revisar el
bundle.** Revisado y medido: la aplicación es **un solo archivo de 4,4 MB** (1,18 MB comprimido),
de los que Fitness son unos **670 KB**; lo más pesado **no es Fitness**: el lector de códigos de
barras (`@zxing/library`, 408 KB, Nutrición), el de PDF (`pdfjs-dist`, 323 KB, Biblioteca) y el de
Excel (`xlsx`, 285 KB, la exportación) suman **1 MB** y se descargan aunque no se usen.

**Por qué no se hace en esta fase, sin preguntar y anotado:** partir el bundle funciona con
`import()`, y **Vercel borra los trozos de una versión al publicar la siguiente**. Josué publica en
cada fase y deja la aplicación abierta en su iPhone: la primera vez que abriera una parte partida
después de una publicación, **fallaría al descargarla** hasta recargar. Arreglarlo exige decidir qué
pasa con las versiones viejas —recargar sola, avisar, o el service worker—, que es exactamente la
**DEP-30**, y este proyecto ya perdió meses con una aplicación congelada en una versión vieja. El
apartado 66 lo dice: *"si aparece un problema que requiere una reestructuración arquitectónica: NO
resolverlo improvisando. Documentarlo."*

**Lo que sí queda hecho:** medido (`NO_EN_FIT40`), y lo que cuesta de verdad al abrir Fitness —el
cálculo de Rangos y Progreso, 6,4 s con 1 000 sesiones— arreglado. **Si Josué lo decide**, lo más
rentable es partir esas tres librerías (un `import()` en cada uno de sus tres sitios) con un aviso de
«Hay una versión nueva: recargar» cuando falle la descarga.

### C-43 — ✅ RESUELTA AL CONSTRUIR (FIT F41, v3.123.0) · «Finalizar» en la sesión reciente al volver (apartado 6) contra la F39, que lo dejó solo para la de hace horas

**El apartado 6 de la F41 pide**, al abrir la aplicación con una sesión activa, *"Continuar
entrenamiento · Finalizar · Descartar"*. **La F39 decidió** que la tarjeta de una sesión reciente no
llevara «Finalizar» —*"lo lleva la cabecera"*— y solo lo ofreciera en la que se quedó abierta horas.

**La lectura que respeta las dos:** lo que la F39 protegía era que una sesión olvidada no «durara»
72 horas y que no se decidiera nada solo; eso sigue igual. Pero **al volver a la aplicación no hay
cabecera: hay tarjeta**, y es justo el momento que describe el apartado 6. Así que la reciente también
lleva «Finalizar», que lleva al resumen de la F8 —donde él decide si se guarda—. Manda la fase que
construye esa pantalla ahora. La comprobación de la F39 **se dio la vuelta**, no se borró
(`test-robustez-fitness.mjs`).

### C-44 — ✅ RESUELTA AL CONSTRUIR (FIT F42, v3.124.0) · «Entrenamiento» y «plantilla» (apartado 57) contra los textos literales de fases anteriores que decían «sesión» y «rutina»

**El apartado 57 de la F42 pide** *"utilizar siempre los mismos términos… no alternar
arbitrariamente entre Workout, Sesión, Rutina cuando representan el mismo concepto"*. **Varias fases
anteriores dejaron textos literales de su enunciado** con esas palabras: *"Descartar sesión"* y *"Tu
sesión está en curso"* (F7), *"Se perderán los datos registrados en esta sesión"* (F8), *"Esta acción
eliminará la sesión del historial"* (F10), *"Construye tu primera rutina"* (F4), *"crea tu propia
rutina"* (F6) y *"3 / 4 sesiones planificadas"* (F31).

**La lectura que respeta las dos:** aquellos textos decían lo que había que decir en ese momento, y
la F42 es la fase que revisa el lenguaje de Fitness entero. Se conserva **lo que dice** cada uno y se
cambia **la palabra**: «entrenamiento» para lo que se entrena y queda en el historial (la pestaña, el
historial y «Empezar entrenamiento» ya lo llamaban así) y «plantilla» para lo que él se construye (la
sección ya se llamaba «Tus plantillas»). ⚠️ **Por dentro el dato sigue siendo `sesion`**: es la clave
guardada desde la F7, y un id se renombra por fuera, nunca por dentro (FIT F1). Las comprobaciones que
guardaban el texto viejo **se dieron la vuelta**, no se borraron. Y de paso se cambió un texto que
nadie había pedido: **«Cerrar la sesión»** en Tu Plan, que se leía como salir de la cuenta.

### C-45 — 📝 DOCUMENTADA (FIT F43, v3.125.0) · «Completado» en Tu Plan y «Parcial» en Actividad para el mismo día

**La F32 define** el estado «Completado» de un día como *«el plan tenía entrenamiento ese día y hay
uno guardado»*; **la F31** describe cada sesión como completa o **parcial** según las series que se
marcaron. Un día con un entrenamiento guardado a medias dice, por tanto, «Completado» en Tu Plan y
«Parcial» en Actividad. **Las dos cosas son ciertas**, y juntarlas en una etiqueta («Completado a
medias») sería un estado nuevo de la F32, que el apartado 66 de la F43 no deja añadir
(*"NO añadir: métricas nuevas"*). Queda como **P3** en `BUGS_F43`, con su motivo.

### C-46 — ✅ RESUELTA AL CONSTRUIR (FIT F43, v3.125.0) · «NO avances automáticamente a la Fase 44. ESPERA INSTRUCCIONES»

El apartado 71 de la F43 termina así, como las fases anteriores. **Josué lo dejó dicho el
2026-09-13**: *"no pares de currar… la cosa está en que literal puedas continuar sin que yo te diga
nada"*, y *"no me preguntes, porque si no paras el flujo"*. Manda lo último que ha dicho: se entrega la
F43 con la verificación en verde, se le cuenta al cerrar y se sigue con la F44.

### C-47 — ✅ RESUELTA AL CONSTRUIR (FIT F44, v3.126.0) · Componentes que pidió su fase y no pinta ninguna pantalla

**La F44** pide eliminar el código muerto (apartado 57) y **la F15, la F18, la F30 y la F39** pidieron
crear, por su nombre, piezas «reutilizables posteriormente» —`RankStatus`, `RankProgress`,
`MuscleContribution`, `GoalProgress`, `GoalEmpty`, `GoalCompletion`, `MissingData`— que al final no
pinta ninguna pantalla: lo que se ve lo pintan otros componentes. La lectura que respeta las dos:
**se quedan, pero declaradas** (`COMPONENTES_SIN_PANTALLA`, con lo que se ve en su lugar), y la suite
se pone roja con un componente nuevo en la misma situación. Unirlas con las de pantalla cambiaría el
aspecto que dejó la F42. `VacioFitness` (F1), que no pidió nadie por su nombre y ya no usaba nada, se
retira.

### C-48 — ✅ RESUELTA AL CONSTRUIR (FIT F44, v3.126.0) · «Ejecutar typecheck y lint» en un proyecto sin ninguno de los dos

El apartado 65 de la F44 (y el 41 y el 42 de la F45) piden typecheck y lint. JosStyle es JavaScript
con JSDoc (FIT F35, apartado 35) y no tiene lint; la F45 prohíbe añadir dependencias sin necesidad
(apartado 40). Se pasó ESLint **una vez, fuera del proyecto**, sobre los 84 archivos de Fitness —ni
una regla de hooks rota, 28 imports sin usar que se retiraron— y lo que se queda vigilando en cada
pasada es `importsSinUso`, más el build y las reglas de `test-imports.mjs`. En la lista del release
se dice «no aplica», con su motivo.

### C-49 — ✅ RESUELTA AL CONSTRUIR (FIT F45, v3.127.0) · «Encadenar sin parar» contra «NO continuar con otra fase»

**Josué pidió el 2026-09-13** encadenar las fases sin esperarle (*"no pares de currar… la cosa está en
que literal puedas continuar sin que yo te diga nada"*), y así se leyó el «ESPERA INSTRUCCIONES» de
las fases anteriores (C-46). **El apartado 63 de la F45** dice otra cosa, y no es la misma frase: *"NO
continuar automáticamente con otra fase. No crear una Fase 46. Si posteriormente se quieren añadir
nuevas funcionalidades: deberán tratarse como un nuevo ciclo de desarrollo."* Las dos se respetan a la
vez, porque **no hay una fase siguiente**: la entrega tiene 45. Encadenar se acaba donde se acaba el
documento; inventar una F46 —o seguir «mejorando» Fitness por cuenta propia— sería lo que el apartado
prohíbe. Se entrega la F45 con la verificación en verde, se le cuenta qué se hizo y hasta dónde, y lo
siguiente lo abre él.

### C-50 — ✅ RESUELTA AL CONSTRUIR (v3.129.1) · Cabecera «transparente como un cristal» contra la cabecera fija de la SC F1

**Josué, con un vídeo de su iPhone (2026-10-04):** *"arriba, cuando bajas para abajo, se ve como que
una parte borrosa que es un rectángulo en vez de estar transparente… quiero que sea transparente
totalmente, como un cristal"* — solo en Bienestar, Vida y Gestión, *"sin contar inicio y ajustes"*. Y
**la SC F1 (v3.80.0), también suya:** *"HEADER / CONTROLES SUPERIORES → FIJOS. CONTENIDO / TARJETAS →
SCROLL"*. La banda borrosa era justamente lo que hacía que la cabecera fija no se pisara con las
tarjetas que suben por debajo: quitarle el fondo a secas deja el título escrito encima de una tarjeta
en cuanto hay que desplazar (en un iPhone de 375 × 667, 133 px).

**Lectura que respeta las dos:** la cabecera **sigue fija** y **no pinta nada** —ni fondo ni
desenfoque: se ve su fondo de pantalla, como en Inicio—, y lo que la banda tapaba lo hacen las
tarjetas: cada una se recorta con una máscara **justo en el borde de abajo de la cabecera**, con una
rampa de 12 px (`useFundidoBajoCabecera`, `mascaraBajoCabecera`). En su iPhone (414 × 896) los tres
hubs caben enteros, así que en reposo ninguna tarjeta lleva máscara y no cambia nada más que la franja.

⚠️ **Y la otra mitad de su mensaje no es una contradicción, es un error mío que se deshace:** la
v3.127.1 cortó el rebote de la página (`overscroll-behavior-y: none`) creyendo que era la «placa» de
una captura suya. Era la banda. Con los hubs cabiendo enteros, el rebote era lo único que dejaba
moverlos: *"a mí me gustaba que podías scrollear y bajar y que se escondieran las de abajo… ahora ya
no puedo ni scrollear en las de en medio"*. Vuelve, y `condicionSF` (casilla `con_rebote`) se pone
roja si alguien lo corta otra vez.

### C-51 — ✅ RESUELTA AL CONSTRUIR (Motion System F0, v3.130.0) · El documento del Motion System trae fases repetidas, una F11 que son dos, y un plan de 25 fases contra las 20 que vienen escritas

**Josué, 2026-10-04:** *"Están desordenadas, pero ordenadlas. Y volverás y ejecutarás todas y no pares
hasta acabarlo."* El documento tiene 21 fases (F0–F20) en este orden: F16–F20, F0–F15. Además:

1. **La F2 está dos veces** (líneas 5491 y 6038). La primera se corta a media palabra (*"naveg"*);
   la segunda está entera. **Se construye la segunda.**
2. **Hay dos F11 distintas.** Una, *"Navegación global, back, routing y transiciones de sistema"*
   (12785), se corta en su apartado 41 (*"Si el proyecto"*). La otra, *"Orquestación global,
   coordinación y motion engine avanzado"* (13290), está entera, **copiada otra vez idéntica** (14128,
   comprobado con `diff`), y es a la que encadena la F10 y la que encadena con la F12. **Se construye la
   de orquestación**; lo que pedía el borrador (back, routing, swipe-back, foco al navegar) lo cubren la
   **F2** y la pila de navegación de **NAVO F1**, y la F11 lo repasa al orquestar. Nada se tira.
3. **El apartado 22 de la F0 propone 25 fases** «como mínimo» y dice que el orden se puede cambiar si el
   análisis lo justifica. Las otras veinte fases del mismo documento **son** su plan, escrito por él:
   se construyen esas, en su orden. La F0 aporta qué significa cada una en JosStyle (`ROADMAP_MOTION`).
4. **Cinco temas se pisan entre fases** (navegación F2/F7/F11, microinteracciones F3/F9, física F5/F8,
   listas y datos F4/F10/F17, lenguaje F14/F18). Se reparten por escrito en `SOLAPES_ROADMAP`
   (`src/lib/motionMapa.js`): cada fase hace su parte y no rehace la de la otra.
5. **El apartado 14 de la F0 pide «Premium» y «Ultra»** además de Sin movimiento, Reducido y Normal, y en
   la línea siguiente *"No añadas controles inútiles"*. Se respetan las dos: la arquitectura los admitiría
   (una escala global), pero **no se ofrecen** salvo que la F1 demuestre una diferencia visible que quepa
   en el presupuesto. Y **los cuatro ids que ya se guardan** (`completa`, `reducida`, `minima`,
   `desactivadas`) no se renombran: lo que cambia es que hagan algo de verdad.

### C-52 — ✅ RESUELTA AL CONSTRUIR (Motion System F1, v3.131.0) · Cuatro niveles guardados contra cinco modos pedidos, «reducir» contra «apagar», y un techo de escala que la F0 escribió una sola vez

La F1 (*"Motor de movimiento + tokens + primitivas"*) pide en su apartado 14 cinco modos —OFF, REDUCED,
NORMAL, PREMIUM y ULTRA— y Ajustes guardaba cuatro desde la A7 (`completa`, `reducida`, `minima`,
`desactivadas`), de los que tres no hacían nada (hallazgo `niveles_animacion` de la F0). Cuatro choques,
y la lectura de cada uno:

1. **«Mínima» y REDUCED son lo mismo dicho dos veces.** *"Solo el feedback imprescindible"* (lo que decía
   Ajustes) y *"solo movimiento esencial"* (el enunciado). Ofrecer los dos sería un control que no cambia
   nada visible (regla 8). **Lo guardado como `minima` no se reescribe**: se lee como Reducido
   (`GUARDADOS_ANTIGUOS`), y si él elige otro, se guarda el nuevo. Los ids de siempre siguen siendo los
   de siempre (`desactivadas`, `reducida`, `completa`); solo nacen `premium` y `ultra`.
2. **Premium y Ultra se ofrecen, porque la F1 demuestra la diferencia** que la C-51 puso como condición.
   No son *"más duración"* —el apartado 14 lo prohíbe—: son **más intensidad** (desplazamientos y escalas
   algo más amplios, recortados al presupuesto) y, en Ultra, **profundidad**: el velo de una hoja
   desenfoca lo de detrás. El recorrido de Chromium mide en una pantalla de verdad que el desplazamiento
   de entrada crece de Normal a Premium a Ultra con la misma duración.
3. **«Reducir movimiento» no es «Sin movimiento».** El apartado 15 lo dice literal (*"Reducido no
   significa eliminar toda la animación"*) y hasta hoy el interruptor de Ajustes y el del sistema dejaban
   todo a 0,01 ms. Ahora los dos llevan a **Reducido**: fundidos, sin desplazamientos ni escalas. Solo
   «Sin movimiento» apaga, y la comprobación de la FIT F37 que exigía el 0,01 ms con el sistema reducido
   **se dio la vuelta**: ahora exige que no haya transformación y sí fundido.
4. **El techo de escala de la F0 era uno y tenían que ser dos.** La F0 escribió *"nunca por encima de
   1,03"*, y la llama de una racha late a 1,35 desde la E3 F2. Las dos cosas son ciertas para cosas
   distintas: una **superficie** (tarjeta, hoja, módulo) entra desde 0,95 como poco y crece hasta 1,03
   como mucho; una **marca** pequeña (llama, ✓, estrella) puede latir hasta 1,35, porque mide 16 px y el
   pulso es el mensaje. Los dos topes viven en `TOPES_ESCALA` (`motion.js`) y la regla del presupuesto de
   la F0 los lee de ahí.

Y uno que no es choque, pero se escribe para que no se reabra: **la intensidad no toca ni el escalonado ni
la duración**. Los dos los decide la velocidad (y en Reducido el escalonado desaparece). Así un modo nunca
alarga lo que tarda la aplicación en responder.

### C-53 — ⏸ DECLARADA AL CONSTRUIR (Motion System F2, v3.132.0) · El «back» del sistema contra una aplicación sin rutas, y cinco apartados de la F2 que son de otras fases

La F2 (*"Navegación, transiciones y continuidad espacial"*) pide en su apartado 7 que **el gesto de
volver del sistema y el botón de atrás del navegador** hagan la transición de volver, y en sus apartados
10, 11, 12, 14 y 16 que se animen las ventanas, las hojas, su arrastre, el paso de una tarjeta a su
detalle y los filtros. Choca con dos cosas, y la lectura de cada una:

1. **JosStyle no tiene rutas: navega con una pila de React** (NAVO F1). Sin `history.pushState` no hay
   entradas de historial que retroceder, así que el gesto del sistema **sale de la aplicación** — es el
   mismo hueco que dejó declarado la E3 F22, y lo decide Josué. ⚠️ **Y en su iPhone no existe**: la
   aplicación se instala como `display: standalone`, sin barra de Safari ni botón de atrás. Meterlo
   ahora sería cambiar la navegación de **toda** la aplicación por la puerta de una fase de movimiento,
   y a medias sería peor que no tenerlo. **Lo que sí hace la F2** es que **la barra «← …» de la
   aplicación vuelva de verdad**: desde la izquierda, sin repetir las entradas de la pantalla de antes y
   al scroll donde la dejó.
2. **Cinco apartados son, palabra por palabra, el tema de otra fase del mismo documento**: las ventanas
   y su fondo (10) son la **F6** (capas); las hojas y su arrastre (11 y 12), la **F5** y la **F8**
   (gestos y física); tarjeta → detalle con el elemento compartido (14), la **F7**; los filtros que
   recolocan una lista (16), la **F10**. Construirlos aquí los haría dos veces. Están en `NO_EN_F2`
   (`src/lib/transicionNavegacion.js`) con la fase de cada uno, y **la F2 garantiza lo suyo**: navegar
   con una ventana abierta no la deja atrapada: se monta en `document.body` (regla 3) y se desmonta
   con la pantalla que la abrió, porque cada pantalla es un contenedor con su propia `key`. Lo que sí es de la F2 en el 16 —**las pestañas de dentro de una pantalla**— lo hace
   `CambioDeContenido`.

Y uno que no es choque, pero se escribe para que no se reabra: **el apartado 18 (error durante la
transición) se resolvió con un límite de error por pantalla**. Hasta la F2 solo Fitness tenía uno
(`AreaSegura`, FIT F36); un fallo al pintar cualquier otra pantalla dejaba la aplicación **en blanco**.
Ahora todas van dentro del mismo, con su aviso, «Reintentar» y la barra de abajo funcionando para salir.

### C-54 — ✅ RESUELTA AL CONSTRUIR (Motion System F3, v3.133.0) · «Reducir» contra la escala de Tailwind, el hover de escritorio en una aplicación de iPhone, y cuatro apartados de la F3 que son de otras fases

La F3 (*"Microinteracciones, componentes y feedback"*) pide que cada interacción tenga *"exactamente el
movimiento que necesita"*. Tres choques, y la lectura de cada uno:

1. **La escalera de pulsar (EH F50) es de Tailwind, no del motor**: `active:scale-95` escribe 0,95 a
   pelo, así que **el modo Reducido no la apagaba** —y la C-52 dice *"Reducido: sin desplazamientos ni
   escalas"*—. No se reescriben las 138 clases (la escalera sigue siendo `ESCALAS_AL_TOCAR`, y cuánto
   encoge cada cosa lo decidió su fase): una regla de `index.css` deja la escala en 1 en Reducido y
   **baja la opacidad**, que es lo que ya hacía lo destructivo de Fitness (FIT F37). Pulsar sigue teniendo
   respuesta, sin moverse.
2. **El hover de escritorio** (apartados 6 y 13: *"la card puede elevarse ligeramente"*). JosStyle se usa
   en un iPhone; Tailwind ya solo genera un `hover:` con puntero de verdad (F2), y una tarjeta que se
   eleva al pasar el ratón es, en el único sitio donde habría ratón, una cosa más que se mueve sin decir
   nada (apartado 35). **No se añade**, y el foco de teclado —que sí sirve en un escritorio— se ve ahora
   en toda la aplicación.
3. **Cuatro apartados son, palabra por palabra, el tema de otra fase**: el botón que pasa a «cargando» y
   a «Guardado» (8-10) son **estados**, y `SOLAPES_ROADMAP` los da a la **F9**; añadir, quitar y deshacer
   en una lista sin que salte (17-19), y cerrar un desplegable recolocando el resto (15), son la **F10**
   (el diseño que cambia); arrastrar y reordenar (30-31) son la **F5** y la **F8**, y hoy no hay nada
   arrastrable. Están en `NO_EN_F3` con la fase de cada uno.

Y un error de esta fase que se deja escrito: **la librería se estrenó como `microinteracciones.js`, que ya
era de la EH F50**, y la pisó. Lo cantaron seis suites al no encontrar sus exportaciones; se recuperó de
git y la de la F3 es `microinteraccionesMotion.js`. Es la E3 F9 (`accionesRapidas.js`) otra vez: **antes
de crear un archivo, mirar si ese nombre ya es de alguien.**

### C-55 — ✅ RESUELTA AL CONSTRUIR (Motion System F4, v3.134.0) · Las cifras que el plan de la F0 dio a la F17, las listas que dio a la F10, y un rollback que no existe

La F4 (*"Datos dinámicos, listas, gráficas y estados"*) pide en su apartado 3 *"crear un sistema
reutilizable"* de transiciones numéricas, y el plan de la F0 (`SOLAPES_ROADMAP`, hallazgo
`cifras_de_golpe`) había dado las cifras a la **F17**. Tres choques, y la lectura de cada uno:

1. **Las cifras: la F4 hace el sistema; la F17, la capa entera.** `CifraQueCambia` nace aquí —con sus
   dos maneras (contar y relevarse), su presupuesto y su regla de no contar nunca al aparecer— y se pone
   en las cifras principales: la puntuación y el progreso de Hoy, las calorías y macros de Nutrición y el
   saldo de Economía. Llevarla a todos los paneles y estadísticas es la F17, y el hallazgo
   `cifras_de_golpe` **sigue abierto a su nombre**.
2. **Las listas (apartados 7-12) son la F10**, palabra por palabra (*"el diseño que cambia: FLIP, listas
   que no saltan"*). La F4 comprueba lo que sí es suyo —que cada fila tenga su `id` como `key`, así que
   completar una tarea es el mismo objeto cambiando— y deja el resto donde el plan lo puso.
3. **El rollback animado de una acción optimista (apartados 36-37) no tiene qué animar**: hoy un guardado
   que falla no se deshace en la pantalla (solo Fitness lo avisa, FIT F37). Animar un rollback que no existe
   sería la regla 8; es la F16 (sincronización y errores).

Y una decisión que se escribe para que no se reabra: **una cifra que se releva ya tiene escrito el valor
nuevo** desde el primer fotograma (lo que se mueve es su llegada), y **una que cuenta acaba pintando
EXACTAMENTE el texto de siempre**. Así VoiceOver y las pruebas leen el dato, no un número a medias.

### C-56 — ✅ RESUELTA AL CONSTRUIR (Motion System F5, v3.135.0) · Deslizar para volver, la física que el plan dio a la F8 y un asa que la FIT F42 prohibió

La F5 (*"Física, gestos, touch y comportamiento táctil"*) choca con tres cosas ya decididas, y la lectura de
cada una:

1. **Deslizar desde el borde para volver (apartado 18), con la pantalla siguiendo al dedo**: *"Si la
   navegación lo permite"*. **No lo permite**: JosStyle navega con una pila de React (NAVO F1) y pinta
   **solo** la pantalla de arriba (F2: un contenedor por pantalla), así que la de debajo no existe mientras
   el dedo arrastra; seguir al dedo enseñaría un hueco. Hacerlo exige mantener montada la pantalla anterior
   y el gesto del sistema (C-53, `history.pushState`), que es de Josué. Se declara en `NO_EN_F5`.
2. **La física al soltar es de la F8 según `SOLAPES_ROADMAP`** (*"F5: el gesto en sí; F8: la física al
   soltar"*), y la F5 pide en sus apartados 5, 9, 14 y 17 velocidad, muelles y «seguir el momentum».
   Lectura que respeta las dos: **la F5 construye lo mínimo que sus apartados piden y lo deja en el motor**
   —la velocidad de las muestras, `decidirSoltar`, la vuelta con el muelle `responsive` y la salida con
   inercia—, y la F8 lo amplía (puntos de anclaje, reordenar arrastrando) **sobre las mismas funciones**,
   sin un segundo motor.
3. **La FIT F42 dejó las hojas «sin asa»** porque *"un asa promete un gesto"* que no existía (regla 8).
   **Ahora existe**, así que el asa ya no promete nada falso: la comprobación de la F42 se da la vuelta, no
   se borra (`NO_EN_FIT42`, apartado 38, lo dice con la fecha). ⚠️ Y las hojas de **Imagen personal** no
   se tocan: está congelada (EH F65). Tampoco las confirmaciones: una decisión no se tira con un gesto.

Y dos decisiones que se escriben para que no se reabran: **en Reducido el dedo sigue moviendo lo que
arrastra** (manipular no es animar) y solo desaparecen el muelle y la inercia al soltar; y **un muelle que
mueve píxeles está en reposo a un cuarto de píxel** (`reposoPx`): con el reposo genérico del motor, una
vuelta de 30 px seguía animando 900 ms y un arrastre nuevo en ese rato se peleaba con ella.

### C-57 — ✅ RESUELTA AL CONSTRUIR (Motion System F6, v3.136.0) · Cuarenta ventanas sin tocar ninguna, una hoja de Fitness que era una ventana y una escala de desenfoques que ya existía

La F6 (*"Profundidad, capas, z-index y contexto visual"*) choca con tres cosas ya decididas, y la lectura de cada
una:

1. **"Cada capa debe tener su propia animación coordinada" (apartado 8) contra "ningún componente flotante crea su
   propia lógica" (apartado 40).** Escribir una entrada y una salida en cada una de las cuarenta ventanas cumpliría
   el 8 y rompería el 40 cuarenta veces. Lectura que respeta las dos: **un solo vigilante** (`useCapasMotion`) sobre
   los hijos del `body` —toda capa es un portal, regla 3— que decide con el estilo calculado qué tipo de capa es y le
   da su entrada y su salida. La salida necesita que la capa siga viéndose cuando React ya la ha quitado: se pone una
   **copia inerte** (sin `role`, fuera de VoiceOver, sin toques) en su mismo sitio y la copia hace el camino de vuelta.
   No se copia lo que lleva vídeo (el escáner) ni lo enorme (más de 1500 nodos).
2. **Las hojas de Fitness (FIT F37/F42) entraban con la animación de una ventana** (`calendarSheetIn`: fundido, 14 px
   y escala), y el apartado 11 dice *"no utilizar una animación genérica de modal"*. Lectura: **donde es una hoja (el
   iPhone) sube desde su borde** (`hojaSubeDelBorde`), y **donde es una ventana (el escritorio, centrada) conserva la
   del Calendario**. Misma duración y curva, así que la auditoría de movimiento de la F37 sigue cuadrando; su
   comprobación de «una sola regla» se da la vuelta, no se borra.
3. **El apartado 6 pide definir los desenfoques `none/subtle/medium/strong`, y la F1 ya los había definido**
   (`DESENFOQUES_MOTION`, `--motion-blur-*`). No se crea una segunda escala: la F6 dice **cuándo** se usa cada uno y
   pasa los siete desenfoques escritos a mano (8, 10, 12, 18 y 20 px) a `medium` o `strong`.

Y dos decisiones que se escriben para que no se reabran: **los z-index conservan sus valores** —la F6 les pone
nombre, no mueve nada de sitio—, y **el velo es uno** (`CAPAS.veloHoja`, 0,55): las ventanas usaban 0,5, 0,55 y 0,6
sin motivo. ⚠️ **Imagen personal está congelada (EH F65)**: sus tres avisos cambian `z-[70]` por `z-alerta` y su velo
literal por el token —el mismo valor—, y reciben la entrada y salida comunes porque viven fuera del módulo, como el
pulsar de la F3; no se les añade nada propio.

### C-58 — ✅ RESUELTA AL CONSTRUIR (Motion System F7, v3.137.0) · Elementos compartidos sin dos pantallas vivas, qué tarjeta crece y el indicador de las pestañas

La F7 (*"Continuidad espacial, shared elements y transiciones entre vistas"*) da por hecho algo que JosStyle no
tiene, y pide cosas que otras fases ya reparten:

1. **Un elemento compartido clásico necesita las dos pantallas vivas a la vez** (el origen y el destino se cruzan),
   y JosStyle pinta UNA (F2: un contenedor por pantalla, `key={tab}`). Mantener la de antes montada es lo mismo que
   pide deslizar para volver (C-56) y es arquitectura de navegación. Lectura que respeta las dos cosas —el
   apartado 4 pide continuidad y el 37 *"no reescribir arquitectura estable"*—: **el origen se APUNTA** (su
   rectángulo, sus esquinas y su letra, al tocarlo o al desaparecer) y lo nuevo sale de él. Caduca a los 700 ms y
   se gasta al usarlo.
2. **"Auditar todas las cards clicables" y "no convertir cada card en una animación compleja"** (apartado 5). Solo
   crecen las tarjetas que **son** lo que abren —las de la portada de un área—; las de Inicio son un resumen y
   entran como cualquier pantalla (su comprobación de la F2 sigue igual). Y un elemento viaja donde es el mismo
   en los dos sitios: el nombre de un ejercicio. `AUDITORIA_F7` dice cada decisión.
3. **El indicador que viaja entre pestañas** (apartado 9) en `ToggleTab`, que usan diez vistas y que se parte en dos
   líneas cuando no cabe (GE F1), es la F10 (el diseño que cambia). La barra de abajo ya lo tiene (F2).

### C-59 — ✅ RESUELTA AL CONSTRUIR (Motion System F8, v3.138.0) · Una F8 que repite la F5, un muelle «snappy» que no es un muelle y una vibración que el iPhone sí da

La F8 (*"Física, springs, gestos e interacción directa"*) vuelve sobre lo que la F5 ya construyó —seguir al dedo,
la velocidad, la resistencia, cerrar o volver— y pide además cosas que chocan con decisiones ya tomadas:

1. **Rehacer lo de la F5 o ampliarlo.** El apartado 1 pide auditar y el 42 *"no sobreingenierizar"*; `SOLAPES_ROADMAP`
   ya repartía las dos fases (F5: el gesto en sí; F8: la física al soltar). Lectura que respeta las dos cosas:
   **no hay un segundo motor de gestos**. La F8 ordena el que hay —la jerarquía de muelles, la máquina de estados
   escrita en el mismo `data-arrastre` de la F5, el velo que responde al dedo y la regla de un solo dedo— en
   `src/lib/fisicaMotion.js`, y `AUDITORIA_F8` dice qué hacía cada pieza y qué queda.
2. **El tier «snappy» del apartado 3 es para interruptores, botones e indicadores**, y el 4 dice *"no todo debe ser
   spring"*. Son toques: no sueltan nada con velocidad. Se quedan por tiempo (F3) y «snappy» figura en la jerarquía
   **sin muelle**; un sexto muelle sería una configuración sin nadie que la use (apartado 42).
3. **"Haptic-ready" (apartado 22) y la vibración.** Mi primer borrador decía que el iPhone no deja vibrar a una web, y
   no era verdad del todo: el motor de audio ya da un toque con el interruptor nativo de iOS 17.4+ (`vibrar`). Lo
   que se hace: los puntos hápticos se declaran (`PUNTOS_HAPTICOS`) y van por el bus como todo lo demás; los del
   gesto **no se emiten**, porque cerrar una hoja con su botón no suena y un gesto no puede sentirse distinto que el
   botón que hace lo mismo.
4. **Puntos de anclaje (apartado 14).** Ninguna hoja de JosStyle tiene dos alturas; inventar una media altura sería
   un control que nadie ha pedido (regla 8). Está en `NO_EN_F8`, con `decidirSoltar` listo para cuando la haya.
5. 🐛 **Lo que la auditoría encontró**: el divisor y el zoom del comparador de fotos (FIT F27) eran un booleano que
   cualquier dedo encendía y apagaba —con dos apoyados, el divisor saltaba entre ellos (apartados 34 y 36)—; y en
   la hoja y en la tarjeta del ejercicio, un segundo dedo empezaba un gesto nuevo encima del primero y su `pointerup`
   lo soltaba. Arreglados. ⚠️ Y al proteger el gesto había que evitar el fallo contrario: un dedo que se levanta
   sin que se le oiga no puede dejar el siguiente gesto bloqueado (apartado 33), así que un gesto sin muestras en
   600 ms **y sin su puntero capturado** se da por perdido —con la captura, un dedo quieto no se confunde con uno
   que ya no está—.

### C-60 — ✅ RESUELTA AL CONSTRUIR (Motion System F9, v3.139.0) · El foco de un campo contra la C-32, un botón que carga sin apagarse y un aviso que no sabía irse

La F9 (*"Microinteracciones, estados y feedback de interfaz"*) pide que cada componente comunique su estado —foco,
cargando, éxito, error— y choca con tres cosas ya decididas:

1. **El foco de un campo y la C-32.** La C-32 (SF F1) deja a Josué decidir el tamaño de letra de los formularios y el
   `maximum-scale` del viewport, porque cambiarlos cambia el aspecto de todos. El apartado 21 pide que el foco *"no
   aparezca de manera violenta"*. Lectura que respeta las dos: **ni un píxel de letra ni de relleno cambia**; lo único
   que cambia es el COLOR del borde al enfocar (al acento, con un halo suave, `fast`) y el rojo con `aria-invalid`.
   🐛 Y era un hallazgo, no un adorno: con `outline-none` un campo enfocado no cambiaba nada fuera de Fitness (FIT F39).
2. **Un botón que carga no se apaga.** Cuatro botones decían «Guardando…» a mano y se ponían a opacidad 0,6, que es
   como se pinta un botón que no se puede pulsar. El apartado 6 pide lo contrario (*"no desactivar sin motivo"*), y
   la regla de siempre pide no repetir la acción. Las dos: `estado="cargando"` **no lo apaga**, lleva `aria-busy` y
   el toque no llama a nada mientras tanto. Los botones que cambiaban su texto a mano —Armario, Relación, Fotos,
   Nutrición, Biblioteca, Entrenamiento, Salud, Ajustes, Estudios y la entrada— pasan por `TextoDeBoton`, y una
   auditoría caza al siguiente que lo escriba a mano.
3. 🐛 **El acento no llegaba a las hojas.** `--accent` vivía en el `div` de la aplicación, y las hojas son portales
   sobre el `body` (regla 3), así que el foco de un campo dentro de una hoja caía al color del texto. Ahora también
   se pone en `documentElement`, en un efecto **antes** de los `return` condicionales (regla 4).
4. **El aviso que desaparecía de golpe.** `AvisoAccion` se montaba con `{aviso && …}`, así que al irse no había nada
   que animar. Ahora se monta siempre y sale con `toastExit`; «Deshacer» solo está mientras el aviso está vivo.

⚠️ **Lo que no se hace aquí** (`NO_EN_F9`): temblar un campo con un error, quitar un elemento de una lista con su
hueco (F10), los estados del sistema (F16), los contadores (F17) y una bandeja de notificaciones, que no existe.

### C-61 — ✅ RESUELTA AL CONSTRUIR (Motion System F10, v3.140.0) · El indicador de las pestañas que la F7 dejó aquí, un desplegable que no se calcula cerrado, las fuentes y lo que se va de una lista

La F10 (*"Layout motion, scroll, listas y contenido dinámico"*) pide que nada salte cuando el diseño cambia, y
choca con cuatro cosas:

1. **El indicador que viaja entre las pestañas de dentro** (C-58 lo dejó para aquí). El apartado 15 lo pide para
   *"tabs con indicador"*, y en el mismo apartado prohíbe las *"transformaciones extrañas"*. `ToggleTab` no tiene
   una pista: son **pastillas separadas**, cada una con su fondo y su borde, que **se parten en dos líneas** cuando no
   caben (GE F1). Un indicador tendría que cruzar los huecos y saltar en diagonal de una línea a otra. Lectura que
   respeta las dos: **no se construye**; la pestaña funde su color al ritmo del contenido (F3) y donde sí hay una pista
   —la barra de abajo— el indicador ya viaja (F2). Está en `NO_EN_F10`.
2. **Un desplegable que se anima al cerrarse tiene que seguir montado mientras se cierra**, y los veinte se
   escribían `{abierto && …}` para no calcular nada cerrados (algunos, como el de Ajustes, pintan mucho). `Plegable`
   acepta lo de dentro **como función** (`{() => …}`): cerrado no se llama, y mientras se cierra lo de dentro es
   `inert` y `aria-hidden` —se ve irse, pero ni el foco ni VoiceOver lo encuentran—. En Reducido se va en el acto.
3. **Las fuentes** (apartado 6): `display=swap` deja que el texto cambie de ancho si Manrope llega tarde, y llegaba
   justo al pintar Hoy (una fuente no se pide hasta que algo la usa, y la pantalla de carga no tiene texto). Quitar
   `swap` dejaría el texto invisible con una red lenta. Las dos: **se piden mientras se cargan los datos** y la
   aplicación espera **como mucho `TOPE_FUENTES_MS` (800 ms)**; la segunda vez ya están en la caché. ⚠️ El hook va
   antes de los `return` condicionales (regla 4).
4. **Lo que se va de una lista ya no está en React** cuando se sabe que se ha ido. En vez de retrasar el borrado del
   dato —que dejaría una tarea borrada viva unos milisegundos, también para quien la cuente—, se deja una **copia
   inerte** del DOM (sin `id`, `aria-hidden`, sin toques) que se desvanece en `fast`, y lo demás se recoloca con FLIP.
   Una comprobación del recorrido que busque «ya no está» justo después **tiene que esperar a que se vaya**: por eso
   `esperarTexto` espera a las copias (`data-capa-saliendo`, F6, y `data-lista-saliendo`).

🐛 **Y la F10 destapó tres cosas de fases anteriores**, que se arreglaron antes:
- **F7**: al volver a la biblioteca «viajaban» los veinte nombres de ejercicio, a su propio sitio. `StrictMode`
  deshace y rehace cada efecto sobre el mismo nodo, y la despedida apuntaba un origen que la vuelta tomaba. Ahora un
  origen dice qué elemento lo dejó, nadie sale del suyo, y el de una despedida dura solo ese cambio (`TTL_EFIMERO_MS`).
- **F6**: «la explicación se cierra al pasar al historial» salía roja porque `innerText` leía la copia inerte.
- **F9**: dos comprobaciones medían a mitad de una transición (las capas del botón, el borde rojo), y una comparaba
  un `rgb(…)` con el hex del token. La aplicación estaba bien en los tres.

⚠️ **Lo que no se hace aquí** (`NO_EN_F10`): una cabecera que se compacta (no hay ninguna), datos en tiempo real y
actualizaciones optimistas (no hay), el esqueleto que se funde con el contenido (F16), contadores de notificaciones
y listas virtualizadas (no hay ninguna).

## PARTE B — DUPLICADOS (15)

Dos categorías: **deliberados** (decisiones tomadas, no tocar) y **reales** (código o datos
repetidos que sí conviene resolver).

### Duplicados deliberados — 🔒 NO FUSIONAR

| # | Qué parece duplicado | Por qué no lo es |
|---|---|---|
| **D-03** | Metas cortas (Productividad) vs. Objetivos 30d–10a | Dos sistemas distintos: una meta corta es un objetivo numérico con periodo; un Objetivo es una aspiración con plazo largo. Regla explícita del Prompt Maestro |
| **D-04** | `fe.diario` vs. `diario.entradas` | Dos diarios con propósito distinto (vida en general vs. vida de fe). Josué puede querer llevarlos por separado |
| **D-05** | `fe.servicio` vs. `fe.eventos` | Responden a preguntas distintas: *"¿cuándo he servido yo?"* vs. *"¿qué evento tengo?"*. Fusionar habría forzado campos condicionales |
| **D-02** | "Agenda" en el Dashboard y en el Calendario | **Una sola implementación, dos puertas.** La Agenda es el mismo toggle de `CalendarView` desde la Fase 3; el acceso desde "Hoy" solo cambia el punto de entrada vía `foco.vista === 'agenda'` |
| **D-11** | Clave `notificaciones` separada de `ajustes` | Decisión consciente: evita agrandar el objeto que las 4 funciones de guardado de `ajustes` tienen que reenviar completo |
| **D-14** | `salud` (medidas históricas) vs. Ajustes → Perfil (cálculos corporales) | Salud registra **evolución en el tiempo**; Perfil muestra el **cálculo orientativo** del estado actual. Coexistencia intencionada desde la Fase 3 |
| **D-15** | EH F12 apartado 5 (*"¿cuánto tiempo quieres dedicar a peinarte?"*) vs. EH F7 `tiempoPelo` | **NO son dos preguntas: son la misma, y solo se hace una vez.** Ver más abajo |

### Duplicados reales — conviene resolver

| # | Duplicado | Impacto | Acción |
|---|---|---|---|
| **D-08** | `personalizacion.pinExtra` (vestigial) vs. `seguridad.protectedAreas` (real) | Confusión documental; un campo muerto en el modelo | Ver **C-05** → R0.6 |
| **D-10** | 🔴 **`perfil.peso` vs. `salud.medidas[].peso`** | El apartado 57 dice que Perfil guarda "el valor vigente de referencia global" y el historial vive en Salud. Pero **añadir un peso en Salud no actualiza `perfil.peso`**: el Dashboard ya lo parchea (usa el peso más reciente de Salud, o el de Perfil si no hay ninguno), pero BMR/TDEE en Ajustes siguen calculándose sobre un `perfil.peso` que puede llevar meses desactualizado. Rompe el principio de Single Source of Truth (ap. 50, 76, 77) | **R5.2** |
| **D-07** | Fórmula de IMC escrita dos veces: `SettingsView` (Cálculos corporales) y `DashboardView` (tarjeta Salud) | Si se corrige en un sitio y no en otro, dos pantallas dan cifras distintas | Extraer a `helpers.js`. Barato, hacerlo junto con R5.2 |
| **D-06** | 🟠 **Dos calendarios**: `fe.eventos` (Calendario de Fe) y `calendario.eventos` (Calendario Universal) | `fe.eventos` es el **único módulo con fechas reales que no llega** a `eventosDerivados()`. Objetivos, Estudios, Entrenamiento, Productividad y Relación sí. Es una inconsistencia, no una decisión documentada | **R2.2**. 🔒 Sin recurrencia anual (regla nº 29) |
| **D-09** ✅ **RESUELTO (v1.25.0)** | `ocultos` ("no uso este apartado") vs. `dashboardOcultos` ("sí lo uso, pero no en Hoy") — la especificación de ME Fase 2 confirma que son dos preguntas distintas (*"Módulo activado ≠ necesariamente visible en Dashboard"*). Ahora ambas viven en la misma pantalla, en tarjetas separadas y etiquetadas | Dos sistemas de ocultación con nombres casi idénticos, en el mismo objeto. Además el apartado 103 trata la personalización del Dashboard como parte de **Apariencia**, mientras la app la tiene en **"Pantalla principal"** | Al construir R3.1, **unificarlos en una sola pantalla** ("Pantalla principal") con dos bloques claramente etiquetados, no dos editores en categorías distintas |
| **D-13** | **Cinco mecanismos de exportación**: CSV/Excel de datos · perfil JSON · apariencia JSON · notificaciones JSON · temas JSON | Ninguno versionado, ninguno unificado. Los apartados 36 (copia de seguridad de configuración) y 194 (exportación de datos personales) piden justo lo contrario | **R3.4** + **R8.8** |
| **D-12** | **Cuatro claves para la apariencia**: `ajustes.apariencia`, `temaPersonalizado`, `temasGuardados`, `historialColor` | No es un defecto (cada una tiene motivo), pero **cualquier copia de seguridad de configuración tiene que incluir las cuatro** o restaurará un estado visual incompleto | Anotar como requisito de R3.4 |
| **D-01** | Resúmenes del Dashboard: Nivel 2 reutiliza `calcularResumenModulo`, Nivel 1 calcula lo suyo | Parcial y justificado (Nivel 1 necesita además el elemento concreto para el deep-link), pero significa que un cambio en cómo se resume Sueño o Entreno hay que hacerlo en dos sitios | Vigilar; no urgente |

---

---

### 🟢 D-15 — El apartado 5 de EH F12 ya lo preguntó EH F7 · **resuelto por la regla existente, v1.78.0**

**El apartado 5 de la Fase 12** pide preguntar *"¿Cuánto tiempo quieres dedicar a peinarte?"* con
cinco opciones: menos de 5 min, 5–10, 10–20, más de 20, me da igual.

**La Fase 7 ya hizo esa pregunta** (`tiempoPelo`, apartado 10 de su enunciado) **con esas cinco
opciones exactas**, y dejó escrito para qué servía: *"así las recomendaciones futuras no propondrán
una rutina de 20 minutos a alguien que quiere tardar 3"*. La Fase 12 la quiere justamente para eso.

**Por qué esto NO activa la regla 49:** la regla 49 detiene una fase ante una *contradicción* entre
prompts sobre la que no haya decisión tomada. Aquí no hay contradicción —los dos enunciados quieren
lo mismo— y **la decisión ya está tomada**: es el apartado 10 de EH F1 (*"no dupliques lo que ya
existe"*), que en este proyecto es código (`FUENTES_GLOBALES`, `esDatoGlobal()`, `destinoDe()`) y no
un recordatorio. Preguntarla otra vez habría dejado a Josué con **dos respuestas a la misma pregunta
y ninguna forma de saber cuál manda**, que es exactamente el fallo que esa regla existe para evitar.

**Qué se ha hecho:** `cortesPelo.js` **lee** la respuesta de la Fase 7 (`tiempoParaPeinarse()`), la
pantalla la enseña con **dónde se cambia** —*"lo dijiste en Pelo → Mi pelo, ahí se cambia"*— y hay
cuatro pruebas: que la pregunta de F7 tiene esas cinco opciones, que F12 **no** la repite, que no la
repite con otro nombre, y que lo contestado allí llega hasta aquí.

**Consecuencia visible para Josué:** el perfil de corte tiene **seis** preguntas, no siete. La
séptima no falta: ya está contestada.

## PARTE C — DEPENDENCIAS (24)

### C.1 — Dependencias entre fases ya construidas *(no romper)*

| # | Depende de | Detalle |
|---|---|---|
| DEP-01 | Calendario C2 → **Fase 17** | `eventosDerivados()` usa `prediccionObjetivo()` para estimar el plazo de un objetivo. Tocar `predicciones.js` cambia lo que aparece en el Calendario |
| DEP-02 | Calendario v1.22.0 → **Seguridad S** | La inclusión de Relación depende de `estaDesbloqueado('area:relacion')`. Si cambia el sistema de sesiones de desbloqueo, **revisar la privacidad del Calendario** |
| DEP-03 | Dashboard D → **7 vistas** | `foco`/`onFocoConsumido` está cableado en Sleep, Finance, Objectives, Training, Estudios, Productivity y Calendar. Cambiar la firma obliga a tocar las 7 |
| DEP-04 | Notificaciones A4 → **Dashboard Fase 20** | Los 3 avisos son el único disparador real conectado. Si se rehacen, las notificaciones se quedan sin caso de uso |
| DEP-05 | Biometría A5 → **PIN** | Regla dura: borrar el PIN desactiva la biometría en el mismo guardado |
| DEP-06 | Todo el color → **singleton `COLORS`** | Nunca desestructurar. `aplicarTema()` síncrona antes de los `return` condicionales |
| DEP-07 | `TemaBuilder` → `ColorPicker` → `colorEngine` | Cadena de reutilización de V2/V3. `TemaBuilder` abre el `ColorPicker` **anidado** (dos bottom-sheets) — el `stopPropagation` que evita que cerrar uno cierre el otro es frágil, no tocarlo a la ligera |
| DEP-08 | `GestionTemas` → `aplicarConjuntoTema` | 🔒 **Nunca** volver a encadenar `updateAccent` + `updateApariencia`: la segunda lee el closure sin el `setState` de la primera y pisa el acento |
| DEP-09 | `AIPanel` multimodal → `extractPdfText` (F11) + `askAIWithImage` (F4) | Reutilización, no mecanismos nuevos |
| DEP-10 | Buscador universal + sugerencias → `currentState` | Única fuente de "qué ve la IA". Si se amplía, mantener la exclusión de `relacion` |
| DEP-11 | `HubView` + Dashboard Nivel 2 → `resumenesHub` | Los 18 `case` + `default` deben devolver siempre `{ linea1, linea2, estado }` |
| DEP-12 | Overlays → `createPortal` | Consecuencia del bug de `containing block`. **Todo overlay nuevo lo necesita** |
| DEP-13 | Seguridad → `MORE_NAV` | `AREAS_PROTEGIBLES` se construye de `MORE_NAV`: un módulo nuevo se vuelve protegible solo con existir ahí |
| DEP-14 | Relación recurrente → `expandirRecurrentes` | Reutiliza el motor de C3 tal cual, aplicado indistintamente a eventos propios y derivados |

### C.2 — Dependencias del trabajo pendiente

| # | Tarea | Bloqueada por |
|---|---|---|
| DEP-15 | **Hábitos/Rutinas en el Calendario** (R2.1) | Falta un **modelo de periodicidad** en el propio hábito/rutina. El motor de recurrencia ya existe |
| DEP-16 | **IA en producción** | `ANTHROPIC_API_KEY` (decisión de Josué, tiene coste real) **+ arreglar el modelo obsoleto** (C-11). Las dos cosas, no una |
| DEP-17 ✅ | **Editor de `dashboardOcultos`** (R3.1) | **Resuelto en v1.25.0** (Entrega 2 · ME Fase 2) |
| DEP-18 | **Copia de seguridad de configuración** (R3.4) | Debe abarcar las 4 claves de apariencia (D-12) + perfil + notificaciones + seguridad-sin-secretos, en **formato versionado** |
| DEP-19 | **Migración entre dispositivos** (R9.6) | Requiere R3.4 primero |
| DEP-20 | **Exportación a PDF** | Librería nueva → `npm install` → el entorno de la IA no puede instalarla; hay que escribirla a ciegas o generar el PDF sin librería |
| DEP-21 | **Importación CSV del banco** | `papaparse` ya está como dependencia. Falta además **detección de duplicados** |
| DEP-22 | **Web Push** (R9.1) | Service Worker + tabla de suscripciones + función serverless de envío. **Infraestructura nueva** |
| DEP-23 | **Dispositivos / sesiones / auditoría / borrado de cuenta** | Servidor con permisos de **administrador de Supabase**. No existe |
| DEP-24 | **AXION** (R10) | 🔒 **Conversación de diseño con Josué**, explícitamente pedida por él. Además, la categoría "IA" de Ajustes (C-03) y la tarjeta 🤖 IA del hub "Más" están enganchadas a esta decisión |

### C.3 — Dependencias operativas *(no de código)*

| # | Qué |
|---|---|
| DEP-25 | Los **3 bloques de `supabase/schema.sql`** (tabla + bucket `progreso` + bucket `entrenamiento-videos` + bucket `biblioteca`) los ejecuta Josué a mano en el SQL Editor. Cualquier bucket nuevo requiere un bloque nuevo **y una instrucción explícita** |
| DEP-26 | Cualquier **dependencia npm nueva** exige avisarle de que ejecute `npm install` — y el entorno de la IA **no puede verificar que funcione** |
| DEP-27 | El **permiso de cámara en Safari** es necesario para el escáner de códigos de barras (documentado en `SETUP.md`) |
| DEP-28 | Un **icono de lucide-react nuevo** debe verificarse contra la versión `0.383.0` antes de importarlo. Caso real evitado: `Palmtree` → renombrado a `TreePalm` en versiones intermedias |
| DEP-29 | ⏸ **Conectar Google Calendar y Outlook necesita a Josué** (E3 F12 / HC F7, regla 49). Hacen falta **tres** cosas que solo puede dar él: registrar JosStyle en Google Cloud Console, registrarla en el portal de Microsoft (las dos van atadas a su cuenta) y **un sitio seguro donde guardar el acceso** — el apartado 26 prohíbe expresamente el navegador y el código del frontend, y hoy hay una sola función de servidor y ninguna tabla para esto. **Mientras tanto NO se construye el botón "Conectar"**: sería un control decorativo (regla 8) y, peor, le haría creer que sus exámenes están sincronizados. Lo que sí quedó hecho y funcionando es el **archivo `.ics`**, que es la alternativa que pide el propio apartado 4 para Apple y sirve igual para los tres. Está declarado en `LO_QUE_NECESITA_JOSUE` (`src/lib/calendariosExternos.js`) y se ve en Ajustes → Integraciones. **Los apartados 19 y 20 (enviar un evento de JosStyle a Google) dependen de lo mismo.** |
| DEP-30 | ⏸ **El service worker lo decide Josué** (E3 F15 / HC F10, apartado 11). Es la pieza que falta para **dos** cosas: abrir la aplicación sin conexión y los avisos con la app cerrada (E3 F11). 🚨 **Y no se añade a ciegas porque el riesgo es exactamente el fallo histórico de este proyecto:** un service worker mal configurado deja la aplicación **congelada en una versión vieja** —se abriría siempre la de antes por más código nuevo que se suba—, y JosStyle ya perdió meses con `main` sirviendo el `src/` del 11 de agosto mientras Josué decía *"la web sigue igual"*. El patrón seguro existe (red primero para el HTML, caché para los archivos con hash), pero es un cambio de arquitectura que hay que poder probar en su iPhone antes de dejarlo puesto. Declarado en `LO_QUE_DECIDE_JOSUE` (`src/lib/auditoriaPWA.js`) con su riesgo escrito. |

### C.4 — Contradicciones del documento de la Entrega 3

| # | Qué |
|---|---|
| C-30 | ⏸ **PARA JOSUÉ — la NU F3 pide un objetivo calórico y la regla 12 prohíbe los estrictos** (detectada al empezar la E3 F35 / NU F3, regla 49). El enunciado de la **Fase 3 de Nutrición** pide calcular **BMR (Mifflin-St Jeor) → TDEE → déficit o superávit según el objetivo**, y de ahí unos objetivos diarios de kcal, proteína, carbohidratos y grasas. Y la especificación maestra dice dos cosas: 🔒 *"Ni Salud ni Nutrición pueden **prescribir** objetivos calóricos o de peso **estrictos**"* (§7.4) y, en la regla 12, *"Nada de objetivos calóricos ni de peso estrictos en Salud ni Nutrición"*. **Leyéndolas juntas, NO se contradicen del todo:** la maestra permite expresamente **BMR/TDEE «siempre orientativos»** (§7.5, y Ajustes → Perfil ya los enseña hoy con esa frase), y lo que prohíbe es *prescribir* algo *estricto* — mientras que la NU F3 pide que los valores sean *"razonables y **configurables**"* y que permitan *"**ajustes manuales**"*, es decir, que **los ponga él**. Esa es exactamente la resolución que ya dejó escrita la **NU F1** en `NO_EN_NU1`: *"Los pondrá él"*. **Pero hay una parte que no me corresponde decidir a mí:** el apartado 4 ofrece *"Perder grasa — déficit calórico controlado"*, y **Josué tiene 16 años y está creciendo**. Un déficit calórico para un adolescente no es una decisión de diseño: es suya, y si acaso de quien le atienda. **Qué hace falta que conteste:** (a) si quiere las tres opciones —perder grasa, mantener, ganar masa— o solo mantener/ganar; (b) si el objetivo lo **calcula la app y él lo confirma y edita** (mi propuesta, con todo orientativo y nada puesto por defecto) o **lo escribe él a mano** desde cero. 🟢 **Mientras tanto Nutrición funciona sin objetivos**: la NU F1 y la NU F2 están construidas y la pantalla enseña lo consumido sin inventarse ninguna cifra. ⚠️ **Lo que sí bloquea:** las fases NU F4-F8 dan por hechos los objetivos, así que conviene contestarlo antes de seguir por ahí. |
| C-29 | 🟢 **RESUELTA EN LA PROPIA FASE — el historial de un hábito: ¿registro separado o dentro?** (detectada en E3 F24 / PR F2, regla 49). El enunciado de Hábitos pide *"un registro separado para las completaciones/historial. **No guardar todo el historial dentro de un único campo del hábito**"* y, tres párrafos después, *"utiliza el sistema de persistencia que actualmente tenga el proyecto… **No crear una segunda base de datos. No crear almacenamiento paralelo innecesario**"*. **Manda la segunda, y no es una decisión propia:** la primera describe una base de datos con tablas, y JosStyle no tiene ninguna — `app_data` guarda **una fila por (usuario, clave)** con un JSON dentro. Una "tabla" de completaciones sería otra lista dentro del **mismo** JSON, que habría que sincronizar a mano y que dejaría marcas colgando de hábitos borrados (la lección de E3 F20 con las etiquetas); y movería el suelo de `rachas.js` (RA F1), `rachasHoy.js` (E3 F2), `hoy.js` y `puntuacion.js`, que leen `habito.historial` desde la Fase 6. **Se le comenta a Josué al cerrar el turno, pero no bloquea nada.** |
| C-28 | 🟢 **RESUELTA EN LA PROPIA FASE — `collection_id` único frente a relaciones múltiples** (detectada en E3 F21 / BL F7, regla 49). La **BL F4** pidió *"preparar `collection_id` pero no implementar Colecciones todavía"*, y se guardó un `coleccionId` por guardado. La **BL F7** dice literalmente lo contrario: *"**No asumir que todos los elementos pueden tener un `collection_id` único.** Como un elemento puede pertenecer a múltiples colecciones, utilizar tablas de relación."* **No se ha decidido por cuenta propia:** la BL F4 solo dejaba un hueco para una función que aún no estaba especificada, y la BL F7 **es** esa especificación y dice cómo hacerlo. Se implementa lo que dice la BL F7 y `absorberColeccionId` migra cualquier `coleccionId` guardado a una relación de verdad, dejando el campo a `null` — hoy no mueve un solo dato de Josué, porque ninguna pantalla llegó a escribirlo. **Se le comenta a Josué al cerrar el turno, pero no bloquea nada.** |
| C-27 | ⏸ **En la especificación de la Entrega 3 FALTA la Fase 3 de Biblioteca, y la Fase 6 está DUPLICADA** (detectado en E3 F16 / BL F1, regla 49). El rótulo del bloque dice *"Biblioteca 8"* y el documento va **F1, F2, F4, F5, F6, F6, F7, F8**: no hay ninguna F3, y el bloque de Documentos aparece dos veces palabra por palabra (líneas 9565 y 10076). Por el orden de las seis mini-apps, **la que falta es Notas**. 🟢 **No bloquea nada:** la BL F1 ya deja las notas funcionando, porque son los `apuntes` que la Biblioteca tiene desde la Fase 11 —se crean, se ven, se buscan y se borran—; lo que no hay es enunciado para su desarrollo completo. La F6 se construirá **una sola vez**. **Preguntar a Josué** si tiene la F3 en otro sitio o si Notas se queda como está. |
