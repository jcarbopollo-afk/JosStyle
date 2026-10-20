# Seguimiento y continuidad — asistentes, patrones y planes

> Parte de [`../15_ASISTENTES_MAESTRO.md`](../15_ASISTENTES_MAESTRO.md). **Se actualiza al cerrar
> cada fase**, nunca se reescribe desde cero: lo antiguo se queda como historia.
> Una tarea solo se marca ✅ con evidencia (archivo, prueba o comprobación); lo planificado es ⬜.

---

## Estado en una línea

**Última fase terminada: Fase 1C — correcciones finales tras la auditoría adversarial (2026-10-20,
v3.160.0, sin commit ni push por orden de Josué).** CX-09 (el registro interrumpido ya no fabrica una
diferencia), CX-12 («Primer PR» se puede conseguir), CX-18 (Imagen personal lee Fitness) y CX-19 (fechas
futuras y cambio de día) corregidos; decisión **DA-11**. Antes, la **Fase 1B** (v3.159.0, DA-10). Abierta
para Josué: **CX-17**. La **Fase 2** sigue bloqueada por **P-01, P-02 y P-04…P-07** (P-03 ya está
contestada: solo reglas, **DA-09**).

## Cómo retomar en una sesión nueva

1. Leer `CLAUDE.md` (reglas del proyecto; manda sobre esto si choca).
2. Leer [`../15_ASISTENTES_MAESTRO.md`](../15_ASISTENTES_MAESTRO.md) entero.
3. Leer este archivo y [`DECISIONES.md`](DECISIONES.md) (sobre todo las P- y las CX- abiertas).
4. `git fetch origin main` y comprobar la versión de `package.json`: si el código ha cambiado desde
   la fecha de la última entrada, lo marcado «verificado» puede haber quedado viejo.
5. Hacer **solo** la fase siguiente que Josué haya autorizado y, al terminar, añadir aquí su entrada.

## Registro de fases

### Fase 0 — Auditoría y estructura documental · ✅ 2026-10-19

**Hecho (con evidencia):**
- Auditoría del repositorio en `main` v3.157.0, solo lectura: `CLAUDE.md`, `docs/00`–`14`,
  `ESPECIFICACION_AJUSTES_ENTREGA1.md`, `especificaciones/ESPECIFICACION_BUSCADOR_E_IA.md`,
  `api/ask-ai.js`, `src/lib/ai.js`, `src/lib/disponibilidadIA.js`, `src/lib/correlaciones.js` (entero),
  los 13 `AIPanel` (sus `buildPrompt`), las llamadas directas a `askAI`/`askAIWithImage(s)`,
  `SuggestionsButton`, `UniversalSearchModal` y su `buildContext`, `currentState` (`App.jsx`),
  `supabase/schema.sql`, `.claude/settings.json` y las exportaciones de 27 motores de `src/lib/` con
  quién los usa y qué suite los prueba.
- Búsqueda de planes, pagos, suscripciones, créditos y chatbots en documentación y código: **no hay
  nada** (lo que aparece como «premium» o «suscripción» es diseño visual o notificaciones push).
- Creados: `docs/15_ASISTENTES_MAESTRO.md`, `docs/15_asistentes/CATALOGO_ASISTENTES.md`,
  `CATALOGO_PATRONES.md`, `DECISIONES.md` y este archivo.
- Modificado: `docs/00_INDICE.md` (una fila nueva en la tabla, apuntando al maestro).
- Comprobado que existen todos los archivos de `src/lib/` y `scripts/test-*.mjs` citados en el
  catálogo de asistentes, y que los enlaces relativos entre los cinco documentos resuelven.

**No hecho (a propósito):** ni código, ni pruebas ejecutadas (la fase no las necesitaba), ni commit,
ni push, ni cambios en `CLAUDE.md`, `docs/02`, `docs/03` o `HANDOFF.md`.

**Descubierto:** el buscador 🔍 ya hace preguntas libres a la IA con `currentState` entero (CX-02);
los paneles de IA usan la API generativa (CX-05); dos dudas reales en `correlaciones.js` (CX-09 y
CX-10); `predicciones.js` no tiene suite propia localizada; `prediccionPeso` puede chocar con la regla 7.

**Pruebas ejecutadas:** ninguna (fase documental). La última pasada completa de `verificar.sh`
(2026-10-19, v3.157.0) salió **TODO CORRECTO**.

### Después de la Fase 0 — cambios en el código que tocan este catálogo · 2026-10-19

- **v3.158.0** (pedido por Josué, fuera de este plan): Fitness → Entrenamiento ya no tiene el bloque
  de calistenia y fútbol. Con `TrainingView.jsx` se fueron **tres puntos de entrada a la IA**
  (sugerencia de entrenamiento, pasos de progresión y análisis de vídeo): quedan **12 `AIPanel`**.
  Marcados como retirados en [`CATALOGO_ASISTENTES.md`](CATALOGO_ASISTENTES.md) y en CX-05.
  ⚠️ **Los datos siguen**: `calistenia`, `futbol` y `calisteniaVideos` en `app_data`, así que
  PAT-X-003 y **CX-09** siguen valiendo tal cual.
- Los documentos de la Fase 0 se subieron a `main` ese mismo día, cuando Josué dijo «súbelo todo».

### Fase 1 — Inventario completo · ✅ 2026-10-19

**Hecho (con evidencia), sin tocar ni una línea de `src/` ni de `scripts/`:**
- Barrido con `@babel/parser` de los 339 archivos de `src/` y todos los de `scripts/`: qué alcanza la
  aplicación desde `main.jsx` (303; los 36 que no, clasificados), qué exporta cada librería, quién
  la importa **y la usa de verdad**, y qué suites la importan (todas en `verificar.sh`).
- Firma y claves devueltas de los motores de 18 módulos (V1), y **20 motores principales
  ejecutados** con los datos vacíos de la app (V2): ninguno revienta.
- Normalizadores de carga ejecutados con un registro mínimo para ver qué queda a `null` (V2).
- **CX-09 y CX-10 reproducidos con las funciones de verdad** (V3), y de paso **CX-11**.
- **Las tarjetas con calistenia antigua**: los seis sitios reproducidos (V3) con una cuenta nueva y
  con datos viejos (CX-12), con propuesta mínima **sin implementar**.
- **Imagen personal**: estado real de sus 17 apartados y de sus librerías (CX-13).
- Recontados los puntos de entrada a la IA generativa: 12 `AIPanel` y los demás (CX-05).
- **Decisión firme DA-09** (sin inferencia generativa salvo la IA libre Premium) escrita en
  `DECISIONES.md`, en el maestro y en `CLAUDE.md`; **P-03 contestada**; DA-03 y DA-06 ajustadas.
- Creados: [`INVENTARIO.md`](INVENTARIO.md) y el anexo generado
  [`INVENTARIO_ANEXO_LIBRERIAS.md`](INVENTARIO_ANEXO_LIBRERIAS.md).
- Modificados: el maestro (§0 aviso DA-09, §2, §3, §4, §6, §7, §8), `CATALOGO_ASISTENTES.md`
  (§1 recuento, §2 rehecha con lo verificado, §3 con datos y motores verificados y tres fichas
  nuevas), `CATALOGO_PATRONES.md` (fichas PAT-X-001/002/003 y el índice), `DECISIONES.md` (DA-09,
  P-03, CX-05, CX-09…CX-15), este archivo, `docs/00_INDICE.md`, una línea en `CLAUDE.md` y una nota en
  `HANDOFF.md`.

**Correcciones a la Fase 0** (estaban mal en el catálogo): `insights.js`, `resumenPeriodico.js` e
`iaEstilo.js` **no los usa `EstiloHombreView`** —no los carga ninguna pantalla—; el maestro seguía
diciendo 13 paneles de IA y contando los de Entrenamiento.

**Descubierto:** CX-09 da datos falsos; CX-11 (días contados por registro); CX-12 (seis sitios con
la calistenia antigua y ninguno con Fitness, más la IA generativa); CX-13 (Imagen personal: 7
apartados sin pantalla y 6 librerías sin conectar); CX-14 («hace 1 día» de algo de hoy); CX-15
(Estadísticas no ve el Diario al decidir si hay datos). `predicciones.js` y `logros.js` sin una sola
suite que mire valores. Fe, Diario, Negocio y Bienestar digital, **sin motor**. Ni el Calendario ni
Hoy enseñan los entrenamientos de Fitness.

**No hecho (a propósito):** ni código, ni arreglos, ni asistentes, ni completar Imagen personal, ni
AXION, ni IA Premium, ni dependencias, ni commit, ni push. Los 12 paneles de IA, intactos.

**Pruebas ejecutadas:** solo las comprobaciones de lectura del anexo A de `INVENTARIO.md` (no
cambian nada). `verificar.sh` no hacía falta: no se ha tocado código. La última pasada completa
(v3.158.0, 2026-10-19) salió verde.

**Hasta dónde llega lo verificado:** datos, motores y pruebas de **todos** los módulos del árbol
(18 fichas en `INVENTARIO.md` §7). Lo que **no**: Supabase real y la cuenta de Josué, el iPhone
(R1), si `ANTHROPIC_API_KEY` está puesta, y el significado de `null` campo a campo en los módulos
que se cargan sin normalizador (`salud`, `negocio`, `diario`, `fe`, `bienestar`, `armario`): ahí no
hay quien lo fije, y se dice.

### Fase 1B — Corrección de datos y métricas · ✅ 2026-10-19 (v3.159.0)

Autorizada por Josué con un alcance cerrado (*«no empieces todavía la Fase 2… no alteres los 12 paneles
de IA… no hagas commit ni push»*).

**Hecho (con evidencia):**
- **CX-11** — `correlaciones.js` suma las horas **por día** (`horasDeEstudioPorDia`) y agrupa el Diario
  por día (`animoPorDia`); un ánimo o unas horas que faltan ya no cuentan como 0 ni dan `NaN`. Y, al lado,
  **CX-16**: Estudios ya no dice «la media baja a» cuando no baja.
- **CX-09** — «Entrenar y ánimo» con `fechasDeEntreno` (Fitness completados + **fechas** de la calistenia de
  antes, cada día una vez), solo desde el primer entrenamiento registrado (**DA-10**).
- **CX-12** — Inicio y el hub (el mismo resumen: el último entrenamiento completado), la puntuación del día y
  Predicciones (`prediccionConstanciaEntreno`, días con entreno, con su motivo cuando no compara) leen
  Fitness. «Primer PR» **se conserva** (no hay equivalencia segura; escrito en `logros.js` y en DA-10). La IA
  (Consejo del día, Sugerencias, `currentState`) **no se toca** (DA-09).
- **CX-14** — `resumenesHub.js` usa `diasDesde(fecha, hoy)` de `salud.js` (días de calendario) y dice «Fecha
  no disponible» si la fecha está rota.
- **CX-15** — `hayDatosPara` mira las series reales de cada pantalla (`SERIES_DE_NUMEROS`), con su forma de
  verdad; lo mismo arreglaba Predicciones y Logros. Relación no está.
- La regla de qué entrenamiento cuenta, mudada a la **hoja** `sesionesCompletadas.js` (sin ciclo con
  Predicciones → Calendario), en la capa de utilidades de `CAPAS_FITNESS`.

**Pruebas:** `scripts/test-correlaciones-metricas.mjs` (nueva, 134 comprobaciones de **valores**, en
`verificar.sh`), cinco casos nuevos del banco de renderizado, la sección «F1B» del recorrido de Chromium
(23 comprobaciones, pasada sola en verde antes de la pasada entera), la lista de hojas de
`test-arquitectura-fitness` sacada de la capa y el escenario de `test-numeros-navegacion` con la forma real
de `objetivos`. **Resultado real (2026-10-19): `bash scripts/verificar.sh` entero en verde** (`═══ TODO CORRECTO ═══`, salida 0, ni un ✗, ninguna suite omitida): build de Vite, 239 suites de Node con 25 158 comprobaciones, 4088 casos de renderizado y **3759 comprobaciones en Chromium** (la sección «F1B» dentro, sin un error de JavaScript en todo el recorrido).

**Descubierto:** **CX-16** (corregido) y **CX-17** (el área «Entrenamiento» de la puntuación cuenta los días
de descanso; ya pasaba con la calistenia y ahora también con Fitness: **decisión de diseño de Josué**).

**No hecho (a propósito):** ni asistentes, ni Fase 2, ni los 12 paneles de IA, ni llamadas a modelos, ni
dependencias, ni migraciones, ni borrar datos, ni commit, ni push. ⚠️ **El trabajo vive solo en esta
sesión** hasta que Josué diga que se suba.

### Fase 1C — Correcciones finales tras la auditoría adversarial · ✅ 2026-10-20 (v3.160.0)

Una auditoría adversarial de solo lectura (2026-10-20) revisó las Fases 1 y 1B y encontró cuatro cosas que
seguían diciendo algo falso o imposible. Josué autorizó corregirlas con un alcance cerrado (*«no hagas commit
ni push… no cambies los 12 paneles de IA ni su contexto… no implementes asistentes nuevos ni empieces la Fase
2… conserva todos los datos históricos»*).

**Hecho (con evidencia):**
- **CX-09, otra vez** — la regla de la 1B metía todo el Diario posterior al primer entrenamiento, así que
  **dejar de apuntar** llenaba el grupo «sin entreno»: dos semanas apuntando y cuatro meses de Diario daban
  6 días «con» (ánimo 4) frente a 134 «sin» (3,1). Ahora `correlacionEntrenoAnimo` compara **solo las semanas
  con algún entrenamiento registrado, entre el primero y el último**; lo demás se cuenta en `diasFuera` y la
  tarjeta lo dice. Con el mismo escenario: 6 y 6, ánimo 4 y 4. El mínimo sigue en 3 por grupo. **Ánimo
  estricto** (`esAnimoValido`: entero del 1 al 5). **Ids** como la puerta de carga (`fechasConEntrenamiento`
  sigue a `sinDuplicadosPorId`). Sin afirmar causa (**DA-11**).
- **CX-18** — Imagen personal → «Mis datos» → «Tu entrenamiento» (`lecturaDeEntrenamiento`) lee los
  entrenamientos completados de Fitness; la calistenia de antes solo si no hay ninguno, **dicha como de antes
  con su última fecha**; vacío, ofrece «Abrir Fitness» (`irA: 'entreno'`). `App.jsx` le pasa `fitness` y
  `FUENTES_GLOBALES.entrenamientos` apunta a `fitness`. Las 6 librerías sin conectar de Imagen personal
  **siguen sin conectar** (orden expresa); su contexto de IA no lee Fitness.
- **CX-12 · «Primer PR»** — se consigue superando una marca en Fitness (`primerRecordPersonal` en
  `progresion.js`, con la comparación de la F11) **o** con el PR de calistenia de antes, que se conserva.
  Total: 12, como siempre. Ni un dato se migra (los logros se derivan). Progreso → Logros recibe `fitness`.
- **CX-19** — un entrenamiento con fecha futura ya no sale como «Último entrenamiento hoy» ni cuenta para la
  constancia de Predicciones; los resúmenes de los hubs reciben el día de `useHoyISO()` (el hook de la jarra
  de agua: un aviso a la medianoche siguiente y otro al volver a la app, sin intervalos), pedido antes de los
  `return` condicionales (regla 4).
- **CX-16** — ahora con prueba: la auditoría vio que nadie vigilaba que Estudios no volviera a decir «la
  media baja a».

**Pruebas:** `scripts/test-correcciones-1c.mjs` (nueva, 107 comprobaciones de **valores**: la interrupción
reproducida con la regla de la 1B y corregida, un hueco en medio, la cola de la misma semana, un registro
constante, el mínimo, 21 ánimos malos y buenos, ids y duplicados, Imagen personal con solo Fitness / solo
calistenia / nada, «Primer PR» nuevo / histórico / primera vez / empate / peor / otra clase / en curso / con
peso, fechas futuras y el cableado de `useHoyISO`) y `scripts/test-correcciones-1c.jsx` (nueva, 15
comprobaciones de lo que se **ve**: «Mis datos», Logros y Estadísticas pintados), las dos en `verificar.sh`;
la suite de la 1B dada la vuelta donde la regla cambió (ánimo `'4'` rechazado, días «sin» de las semanas
registradas, el regex de los resúmenes con `diaDeHoy`); la forma de `leerDato` igual en los dos caminos
(`irA`); y la sección «F1B» del recorrido de Chromium con los valores **calculados de la semana** (no
dependen del día en que se pase), la frase de los días fuera y la insignia «Primer PR» conseguida (28
comprobaciones, pasada sola en verde antes de la pasada entera). Una prueba de mutación sobre una copia
(17 mutaciones de la lógica nueva) las puso rojas **todas**.
**Resultado de `bash scripts/verificar.sh`:** **en verde** (2026-10-20: `═══ TODO CORRECTO ═══`, salida 0, ni un ✗, ninguna suite omitida): build de Vite, 241 suites de Node con 25 282 comprobaciones (las dos de la 1C dentro), 4088 casos de renderizado, las reglas invariantes y **3764 comprobaciones en Chromium** (la sección «F1B» dentro, sin un error de JavaScript en todo el recorrido).

**No hecho (a propósito):** ni asistentes, ni Fase 2, ni los 12 paneles de IA ni su contexto (la IA sigue
recibiendo la calistenia y no Fitness, DA-09), ni las 6 librerías de Imagen personal, ni dependencias, ni
migraciones, ni borrar datos, ni commit, ni push.

**Sin probar en el iPhone (R1):** el cambio de día a medianoche con la aplicación abierta (se comprueba el
código, no un reloj real), el toque en «Abrir Fitness» y cualquier cosa de Supabase.

## Próxima tarea concreta

~~**Recomendada: Fase 1b — que los datos que leería un asistente sean ciertos**~~ ✅ **Hecha (v3.159.0)**, y
corregida tras la auditoría en la **Fase 1C (v3.160.0)**. Lo que queda por delante, en orden: (1) que Josué
diga si se suben a `main` (ni la 1B ni la 1C se han subido, por orden suya); (2) que conteste **P-01, P-02 y P-04…P-07** —sin ellas no empieza la Fase 2— y **CX-17**.

*(Lo que sigue es la recomendación original, que se conserva como historia.)* Antes de construir asistentes sobre los motores, arreglar lo que dan mal, porque un
asistente que se apoye en ellos repetiría el error:
1. CX-12 con la propuesta de `INVENTARIO.md` §5.2 (tarjetas «Entreno», puntuación, Predicciones; el
   logro «Primer PR» **lo decide Josué**).
2. CX-09 (unión de Fitness y calistenia antigua) y CX-11 (agrupar por día).
3. CX-14 (contar días de calendario) y CX-15.
4. Suites que miren **valores** de `correlaciones.js`, `predicciones.js` y `logros.js`.
Cada arreglo con sus pruebas dadas la vuelta, `verificar.sh` en verde y a `main` según las reglas
de `CLAUDE.md`. **Ni un dato se borra.**

**En paralelo (no es una fase, es de Josué):** contestar **P-01, P-02 y P-04…P-07**, que bloquean
la Fase 2, y decidir el sitio de los paneles de IA existentes (CX-05).

**Criterio de cierre de la Fase 1** (cumplido): ninguna fila del catálogo de asistentes con «por
localizar» o «por verificar»; cada motor con su firma comprobada; el seguimiento actualizado.

## Dependencias y bloqueos

- ~~**Fase 1b** depende de la autorización de Josué~~ ✅ hecha (v3.159.0) y corregida en la **Fase 1C** (v3.160.0): «Primer PR» se conserva y además se puede conseguir con Fitness (DA-11). Subirlas a `main` depende de Josué.
- **Fase 2** depende de las respuestas a P-01, P-02 y P-04…P-07 (P-03 contestada: DA-09).
- **Fase 4** depende de P-06 (cruces y privacidad).
- **IA libre** depende de DA-05/DA-01 (al final), de la conversación de diseño de AXION (`docs/02`
  R10) y de que Josué vuelva a pasar el texto literal de AXION (CX-07).
- **Planes** dependen de DA-01 (al final) y de las decisiones aplazadas de `DECISIONES.md`.

## Archivos de este sistema

| Archivo | Creado | Última actualización |
|---|---|---|
| `docs/15_ASISTENTES_MAESTRO.md` | 2026-10-19 (F0) | 2026-10-19 (F1: DA-09, recuento, estado) |
| `docs/15_asistentes/INVENTARIO.md` | 2026-10-19 (F1) | 2026-10-19 (F1) |
| `docs/15_asistentes/INVENTARIO_ANEXO_LIBRERIAS.md` | 2026-10-19 (F1, generado) | 2026-10-19 (F1) |
| `docs/15_asistentes/CATALOGO_ASISTENTES.md` | 2026-10-19 (F0) | 2026-10-19 (F1: §1–§3 verificadas) |
| `docs/15_asistentes/CATALOGO_PATRONES.md` | 2026-10-19 (F0) | 2026-10-19 (F1: PAT-X-001/002/003) |
| `docs/15_asistentes/DECISIONES.md` | 2026-10-19 (F0) | 2026-10-19 (F1: DA-09, P-03, CX-09…CX-15) |
| `docs/15_asistentes/SEGUIMIENTO.md` | 2026-10-19 (F0) | 2026-10-19 (F1) |
