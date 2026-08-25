# JC Fitness — CONTRADICCIONES, DUPLICADOS Y DEPENDENCIAS

> Resultado del cruce sistemático de `HANDOFF.md` × `CHANGELOG.md` ×
> `ESPECIFICACION_AJUSTES_ENTREGA1.md` × el código real.
>
> **Leer antes de tocar Ajustes, Seguridad, Calendario, IA o el Dashboard.**
>
> **Actualizado en v1.23.0 (bloque R0):** resueltas **C-01, C-02, C-05, C-06, C-11, C-12 y C-20**;
> **C-22** parcialmente (falta la revisión periódica). El texto de cada una se conserva tal cual
> para que quede constancia del problema y de cómo se resolvió — no se borra, se marca.

---

## PARTE A — CONTRADICCIONES (22)

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

### ⚪ C-21 — Cuatro nombres para el mismo proyecto

| Nombre | Dónde |
|---|---|
| **JC Fitness** | Como lo llama Josué hoy |
| **JosStyle** | Repositorio de GitHub y `README.md` (que solo contiene esa línea) |
| **Sistema Operativo Personal de Josué** | Título de `HANDOFF.md` y de la especificación |
| `sistema-personal-josue` / `sistema-personal-app` | `package.json` y carpeta del zip |

**No es una contradicción de producto, es una decisión pendiente de Josué.** Renombrar tiene efectos
reales (nombre en Vercel, `manifest.json` de una PWA ya instalada, URL del repo), así que **no se
toca nada sin que él lo pida**. Lo único que sí merece la pena hacer sin preguntar es **escribir un
`README.md` de verdad** — hoy es una sola línea.

---

## PARTE B — DUPLICADOS (14)

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

### Duplicados reales — conviene resolver

| # | Duplicado | Impacto | Acción |
|---|---|---|---|
| **D-08** | `personalizacion.pinExtra` (vestigial) vs. `seguridad.protectedAreas` (real) | Confusión documental; un campo muerto en el modelo | Ver **C-05** → R0.6 |
| **D-10** | 🔴 **`perfil.peso` vs. `salud.medidas[].peso`** | El apartado 57 dice que Perfil guarda "el valor vigente de referencia global" y el historial vive en Salud. Pero **añadir un peso en Salud no actualiza `perfil.peso`**: el Dashboard ya lo parchea (usa el peso más reciente de Salud, o el de Perfil si no hay ninguno), pero BMR/TDEE en Ajustes siguen calculándose sobre un `perfil.peso` que puede llevar meses desactualizado. Rompe el principio de Single Source of Truth (ap. 50, 76, 77) | **R5.2** |
| **D-07** | Fórmula de IMC escrita dos veces: `SettingsView` (Cálculos corporales) y `DashboardView` (tarjeta Salud) | Si se corrige en un sitio y no en otro, dos pantallas dan cifras distintas | Extraer a `helpers.js`. Barato, hacerlo junto con R5.2 |
| **D-06** | 🟠 **Dos calendarios**: `fe.eventos` (Calendario de Fe) y `calendario.eventos` (Calendario Universal) | `fe.eventos` es el **único módulo con fechas reales que no llega** a `eventosDerivados()`. Objetivos, Estudios, Entrenamiento, Productividad y Relación sí. Es una inconsistencia, no una decisión documentada | **R2.2**. 🔒 Sin recurrencia anual (regla nº 29) |
| **D-09** | `personalizacion.ocultos` (oculta módulos de "Más") vs. `personalizacion.dashboardOcultos` (oculta tarjetas del Dashboard) | Dos sistemas de ocultación con nombres casi idénticos, en el mismo objeto. Además el apartado 103 trata la personalización del Dashboard como parte de **Apariencia**, mientras la app la tiene en **"Pantalla principal"** | Al construir R3.1, **unificarlos en una sola pantalla** ("Pantalla principal") con dos bloques claramente etiquetados, no dos editores en categorías distintas |
| **D-13** | **Cinco mecanismos de exportación**: CSV/Excel de datos · perfil JSON · apariencia JSON · notificaciones JSON · temas JSON | Ninguno versionado, ninguno unificado. Los apartados 36 (copia de seguridad de configuración) y 194 (exportación de datos personales) piden justo lo contrario | **R3.4** + **R8.8** |
| **D-12** | **Cuatro claves para la apariencia**: `ajustes.apariencia`, `temaPersonalizado`, `temasGuardados`, `historialColor` | No es un defecto (cada una tiene motivo), pero **cualquier copia de seguridad de configuración tiene que incluir las cuatro** o restaurará un estado visual incompleto | Anotar como requisito de R3.4 |
| **D-01** | Resúmenes del Dashboard: Nivel 2 reutiliza `calcularResumenModulo`, Nivel 1 calcula lo suyo | Parcial y justificado (Nivel 1 necesita además el elemento concreto para el deep-link), pero significa que un cambio en cómo se resume Sueño o Entreno hay que hacerlo en dos sitios | Vigilar; no urgente |

---

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
| DEP-17 | **Editor de `dashboardOcultos`** (R3.1) | **Nada.** Modelo y filtrado listos. Es la tarea con mejor relación valor/esfuerzo pendiente |
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
