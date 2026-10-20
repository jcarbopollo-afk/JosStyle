# Inventario para el sistema de asistentes (Fase 1)

> Parte de [`../15_ASISTENTES_MAESTRO.md`](../15_ASISTENTES_MAESTRO.md).
> **Hecho el 2026-10-19 sobre `main` en la v3.158.0 (commit `200f8b4`)**, solo leyendo y ejecutando
> el código: **no se ha cambiado ni una línea de `src/` ni de `scripts/`**.
> Si `package.json` dice otra versión cuando leas esto, lo marcado como verificado puede haber
> quedado viejo: vuelve a ejecutar las comprobaciones del anexo A antes de fiarte.
>
> El detalle de qué funciones usa cada pantalla y qué suites prueban cada librería está en el anexo
> generado [`INVENTARIO_ANEXO_LIBRERIAS.md`](INVENTARIO_ANEXO_LIBRERIAS.md).

---

## 0. Lo importante, en corto

> 🔓 **Actualización · Fase 1B (2026-10-19, v3.159.0).** **CX-09, CX-11, CX-14 y CX-15 están
> corregidos, y CX-12 también** salvo dos cosas a propósito: el logro «Primer PR» se conserva (no hay
> equivalencia segura) y la IA generativa no se toca (DA-09). Salieron dos más: **CX-16** (corregido)
> y **CX-17** (decisión de Josué). Estado y motivos en [`DECISIONES.md`](DECISIONES.md) (DA-10 y la
> tabla CX); lo que sigue es la **foto de la Fase 1**, que se conserva tal cual para saber de dónde se
> partió.
>
> 🔓 **Y la Fase 1C (2026-10-20, v3.160.0)**, tras una auditoría adversarial: CX-09 ya no fabrica una
> diferencia cuando deja de registrar (solo compara las semanas con algún entrenamiento registrado,
> entre el primero y el último), el ánimo se valida estricto (1–5) y las sesiones se cuentan por `id`;
> **«Primer PR» se puede conseguir** con un récord de Fitness (el de calistenia se conserva); Imagen
> personal → «Tu entrenamiento» lee Fitness (**CX-18**); y un entrenamiento con fecha futura ya no es
> «hoy», y «hoy» cambia a medianoche (**CX-19**). Motivos en **DA-11**.

1. **Existe mucha inteligencia por reglas, pero repartida de forma desigual.** Fitness, Nutrición,
   Imagen personal, Organización (Horario y Calendario), Productividad, Estudios y Armario tienen
   motores de análisis con pruebas. **Fe, Diario, Negocio y Bienestar digital no tienen ninguno**:
   sus pocas cuentas están escritas dentro de la pantalla. **Economía** tiene `hucha.js`, pero el
   saldo y los ingresos/gastos del mes se calculan dentro de `FinanceView.jsx`.
2. **CX-09 es un error real** (verificado ejecutándolo): «Entrenar calistenia y ánimo» solo cuenta
   la calistenia antigua. Con entrenamientos de Fitness dice que hay 0 días con sesión, y con datos
   viejos de calistenia **puede dar la conclusión al revés**.
3. **CX-10 no es un error de fórmula, pero depende de una suposición sin escribir.** Además salió un
   error real al lado (**CX-11**): varias sesiones de estudio del mismo día cuentan como varios días.
4. **Seis sitios siguen leyendo la calistenia antigua**, que ya no se puede registrar: dos tarjetas
   «Entreno» (Inicio y Bienestar), la puntuación del día, Predicciones, un logro y la correlación.
   Ninguno lee `fitness.sesiones` (**CX-12**). Diagnóstico y propuesta en §5.
5. **Imagen personal está menos terminada de lo que dice su informe de cierre** (**CX-13**): 7 de sus
   17 apartados no tienen pantalla, y seis librerías construidas y probadas (F54 y F56–F60, entre
   ellas toda su «IA» por reglas) **no las carga la aplicación**. Detalle en §3.
6. **Hay 12 paneles de IA generativa** (`AIPanel`), tres llamadas directas a `askAI` (Estudios ×2 y
   Objetivos), la foto del plato y tres usos en `ui.jsx` (buscador 🔍, sugerencias y el propio panel). No se han tocado
   (decisión **DA-09**).
7. **Dos fallos pequeños más, no arreglados:** cuatro tarjetas de los hubs dicen «hace 1 día» de algo
   registrado hoy después de mediodía (**CX-14**), y la comprobación de «hay datos» de Estadísticas
   no ve el Diario (**CX-15**).

## 1. Método y niveles de verificación

Cada afirmación lleva el nivel al que se comprobó. **Que exista un archivo o una exportación no
cuenta como «disponible»**: el uso real se comprobó siguiendo los `import` desde `src/main.jsx` y
mirando que el nombre importado se use de verdad en el cuerpo del archivo.

| Nivel | Qué significa |
|---|---|
| **V1** | Leído en el código con un analizador (Babel): firma, claves de primer nivel de los objetos que devuelve, quién lo importa y lo usa. |
| **V2** | Ejecutado con datos vacíos o mínimos (los `DEFAULT_*` de la app): no revienta y devuelve esa forma. |
| **V3** | Reproducido con un escenario realista y comparado con lo que debería salir. |
| **P** | Hay una suite en `verificar.sh` que comprueba **valores**, no solo que la función exista. |
| **D** | Solo documentado (comentario, `CLAUDE.md`, `docs/`), sin volver a comprobar ahora. |

**Cifras del barrido (V1):** 339 archivos en `src/`, **303 alcanzables** desde `main.jsx` y **36
no** (§6). 245 librerías en `src/lib/`. Las 90 pantallas y componentes hacen 2415 imports de
`src/lib/`, y 88 de ellos están **importados sin usar** (38 solo en `EstiloHombreView.jsx`): no rompe
nada, pero quiere decir que «está importado» no basta como prueba de uso. **Todas** las suites
`scripts/test-*` las ejecuta `verificar.sh`.

**Lo que esta fase NO comprueba:** Supabase real, lo que hay de verdad en la cuenta de Josué, el
aspecto en el iPhone (R1), y si `ANTHROPIC_API_KEY` está puesta en Vercel.

## 2. Datos guardados (`app_data`, una fila por usuario y clave)

`App.jsx` carga **35 claves** (líneas ~652–690) y aplica su normalizador **al cargar** (V1). Una
36.ª, `calisteniaVideos`, **sigue guardada pero ya no se carga** desde la v3.158.0.

| Clave | Qué guarda (primer nivel) | Al cargar | Vacío / `null` significa (V2 donde se ejecutó) | Privacidad |
|---|---|---|---|---|
| `ajustes` | `accent`, `apariencia`, `seguridad` (PIN con hash, áreas y acciones protegidas, biometría) | fusión con el default + migración de seguridad | — | El PIN nunca en claro |
| `perfil` | nombre, fecha de nacimiento, altura, peso, actividad, sexo, foto (`data:` 256 px)… | `normalizarPerfilFoto` | Edad **derivada** de la fecha | Peso: Nutrición no lo manda a la IA |
| `sueno` | lista `{fecha, horaDormir, horaDespertar, calidad 1-5, interrupciones, siestaAyer, siestaMinutos}` | `normalizarSueno` | `calidad: null` = no la contestó (V2). La duración **no se guarda** | — |
| `calistenia` | 7 habilidades `{nivel, progresion, prs, sesiones}` | **ninguno** | **Ya no se puede escribir** (v3.158.0) | — |
| `futbol` | lista de partidos | **ninguno** | Ya no se puede escribir; `SOLO_PARA_RESTAURAR` | — |
| `economia` | `saldoInicial`, `movimientos`, `hucha`, `objetivoHucha`, `aportaciones` | `normalizarEconomiaHucha` | — | — |
| `salud` | `medidas`, `historial` | **ninguno** | — | — |
| `saludFotos` | fotos de progreso `{path, fecha, nota, tags, createdFromWorkoutId, visibility…}` | `normalizarFotosProgreso` | Solo el camino, nunca la URL firmada | Acción `fotos_privadas` (PIN, activa por defecto) |
| `nutricion` | `comidas`, `agua` por día, `favoritos`, objetivos, alimentos propios | 4 normalizadores en cadena | `momento: null` = «Extras» (V2) | Ni comidas ni peso a la IA |
| `estudios` | `programas`, `asignaturas`, `examenes`, `horas`, `temas`, `entregas`, `eventos`, `actividades` | 3 normalizadores | Examen sin `fecha`/`hora` = `null` (V2) | — |
| `negocio` | `proyectos` | **ninguno** | — | — |
| `productividad` | hábitos, rutinas, tareas, metas, pomodoros (proyección), sesiones, ejecuciones | 3 normalizadores (la config del pomodoro se normaliza al usarla) | Tarea sin fecha, categoría, meta u objetivo = `null` (V2) | — |
| `objetivos` | `lista` `{texto, plazo, cumplido, estado, fechaObjetivo…}`, `ultimaRevision` | `normalizarObjetivosDe` | `fechaObjetivo`/`cumplidoEn` `null` (V2) | — |
| `calendario` | `eventos` | fusión + lista segura | Recurrencias guardadas como regla | — |
| `diario` | `entradas` (una por día; `animo` 1-5, por defecto 3) | **ninguno** | — | ⚠️ Viaja entero en `currentState` (CX-02) |
| `biblioteca` | `apuntes`, `enlaces`, `libros`, `ideas`, `colecciones`, `documentos` | `normalizarBiblioteca` | — | — |
| `bibliotecaArchivos` | archivos subidos (camino) | **ninguno** | — | — |
| `relacion` | `nombre`, `fechas`, `album` | `normalizarRelacion` | — | 🔒 **Siempre** tras PIN; fuera de `currentState` y de la exportación |
| `fe` | `servicio`, `eventos`, `diario`, `objetivos` | **ninguno** | — | `AVISO_DOCTRINAL` en sus paneles de IA |
| `bienestar` | `registros` (tiempo de uso), `reflexiones`, `sesiones` | **ninguno** | — | — |
| `personalizacion`, `notificaciones`, `historialColor`, `temaPersonalizado`, `temasGuardados` | preferencias de la app | fusión con el default | — | — |
| `historial`, `papelera` | deshacer (10 pasos) y Eliminados recientes | tal cual / papelera cargada | — | — |
| `armario` | prendas, outfits, usos… | fusión superficial con el default | Sin normalizador por elemento | — |
| `rachas`, `gamificacionRachas` | estado del motor de rachas (sin contadores: se derivan) | `normalizarEstado`, `normalizarGamificacion` | — | — |
| `audio` | preferencias de sonido | migración | — | — |
| `horarioTop` | horarios, actividades, bloques, excepciones, mochila, automatizaciones… (17 listas) | `normalizarHorarioTop` | — | Notas privadas de una actividad fuera de la IA |
| `estiloHombre` | `modulos`, `datos` (registro compartido), `asistente`, `version`… | migración + `normalizarEstiloHombre` | Ningún apartado activo por defecto (V2) | Fuera de `currentState`; tipo de piel y sensibilidad nunca a la IA |
| `fitness` | `ejercicios`, `planes`, `plantillas`, `sesiones`, `objetivos`, `clasificaciones`, `planesAnteriores`, `cuarentena`… | 4 capas + migración + cuarentena | `planActivo: null` = sin plan (V2) | Fuera de `currentState` |
| `cumpleanos` | `lista`, `apartados` | `normalizarCumpleanos` | — | — |

**Qué ve la IA generativa hoy (V1, `App.jsx` línea ~2737):** `currentState = { sueno, calistenia,
futbol, economia, salud, nutricion, estudios, negocio, productividad, objetivos, calendario, diario,
biblioteca, fe, bienestar }`. **No** entran Relación, Imagen personal, Fitness, fotos, Armario,
Horario ni Cumpleaños. ⚠️ Es decir: el buscador 🔍 ve la **calistenia antigua** y **no ve Fitness**.

**Protecciones (V1):** Relación siempre tras `PinGate`; cualquier otra área se puede proteger
(`protectedAreas`); tres acciones protegibles (`fotos_privadas` activa por defecto,
`exportar_datos`, `eliminar_datos`).

## 3. Imagen personal: estado real

Su informe de cierre (`docs/09`, generado desde `cierre.js`) dice **«65 de 65» y «los 17 apartados
del catálogo terminados»**. Mirando lo que la aplicación **carga y pinta**, no es del todo así.

### 3.1 Los 17 apartados de `MODULOS_EH` (V1)

| Estado | Apartados | Evidencia |
|---|---|---|
| ✅ **Con pantalla** (9) | Pelo, Skincare, Barba, Sonrisa, Perfumes, Accesorios, Mis gustos, Higiene (con Manos, uñas y pies dentro) y Cuidado corporal | `abrirModulo` en `EstiloHombreView.jsx` (~l. 9986) abre su pantalla; tienen línea en `FUENTES_DE_ESTADO` y en `LINEAS_DE_PLAQUITA` |
| ↪️ **Lleva a otro módulo** (1) | Estilo y armario | Abre el módulo Armario (`DESTINO_ARMARIO`) |
| 🟡 **En el catálogo, sin pantalla** (7) | Fitness, Sueño, Salud, Hábitos y rutinas, Progreso, Educación, Productos | Se pueden encender en «Gestionar apartados», pero `abrirModulo` no hace nada al tocarlos (lo dice su propio comentario: *«un módulo cuya pantalla todavía no existe no hace nada al tocarlo»*). Sin línea en `FUENTES_DE_ESTADO` → salen como «sin configurar» |

Por defecto **no hay ningún apartado activo** (V2): los enciende él.

### 3.2 Lo que está en pantalla (V1)

Además de los apartados: el asistente de configuración, Mis datos, Mi estilo, Mis preferencias,
Gestionar apartados, el buscador interno, los avisos (apagados por defecto), la integración con
Tareas/Objetivos/Calendario, el tutorial, la privacidad, **💡 Ideas para ti** (`ideasEstilo.js`),
**📊 Mi progreso** (`progresoEstilo.js`) y **✨ Descubrir** (`descubrir.js`). Recomendaciones por
reglas de pelo, piel y perfumes sobre `motorRecomendaciones.js` (7 suites, P).

> 🔓 **Fase 1C (CX-18):** en «Mis datos», **«Tu entrenamiento»** lee los entrenamientos completados de
> Fitness (`lecturaDeEntrenamiento` en `configuracionInicial.js`; `App.jsx` le pasa `fitness`). La
> calistenia de antes solo sale si no hay ninguno, dicha como de antes y con su última fecha; sin nada,
> «Abrir Fitness». Antes leía solo la calistenia y decía que se editaba en «Calistenia», que ya no
> existe. Las librerías de §3.3 **siguen sin conectar**.

### 3.3 Construido y probado, pero **no conectado** (V1: ningún archivo de la app lo importa)

| Librería | Fase | Qué hace | Suites (P) |
|---|---|---|---|
| `iaEstilo.js` | EH F56 | Permiso de IA (apagado por defecto), intenciones, `contextoParaIA()` filtrado sin campos privados | 5 |
| `aprendizaje.js` | EH F57 | Aprender preferencias del comportamiento, solo con el permiso de la F56; contradicciones; borrar lo aprendido | 1 |
| `insights.js` | EH F58 | Insights por periodo con mínimos y sin tono de reproche | 3 |
| `resumenPeriodico.js` | EH F59 | Resumen periódico (apagado por defecto) | 1 |
| `contextual.js` | EH F60 | Recomendaciones según ocasión, con fuentes autorizadas una a una | 2 |
| `recuperacion.js` | EH F54 | Copia y restauración por apartado (`IMPORTAR_EXISTE = false`) | 3 |

⚠️ Su informe marca **IA ✅ «F56, F57, F58, F59 y F60»** porque las auditorías ejecutan estas
librerías en Node. **Ninguna pantalla las usa.** Para los asistentes son **la pieza más reutilizable
del proyecto** —ya resuelven permiso, mínimos de datos, tono y privacidad—, pero hay que tratarlas
como **«construidas y probadas, sin integrar»**, no como funciones disponibles.

### 3.4 Pendiente que ya declara el propio módulo (D, `docs/09`)

Avisar cuando falla un guardado (F52, «imprescindible»), avisar al restaurar una versión más
reciente (F54), «Deshacer» de unos segundos y selección múltiple (F61); bloqueados: conflictos entre
dispositivos, copias globales, favoritos comunes; futuro: catálogo de productos real (D2-03).

### 3.5 Para que un asistente futuro se pueda extender cuando Imagen personal se termine

- Leer el estado por **`FUENTES_DE_ESTADO`** y **`LINEAS_DE_PLAQUITA`**: un apartado nuevo con
  pantalla añade ahí su línea, y el asistente lo ve sin cambiar nada.
- Las recomendaciones van por **`motorRecomendaciones.js`** (reglas con `requiere`).
- El contexto, si alguna vez sale de la app, **solo** por `contextoParaIA()` y con su permiso.
- **No completar Imagen personal desde los asistentes**: está congelado a funciones nuevas (EH F65).

## 4. Las dos correlaciones (CX-09 y CX-10)

Fuente: `src/lib/correlaciones.js` (leído entero). Las pintan `StatsView.jsx` (las tres) y
`EstudiosView.jsx` (sueño ↔ estudio). Reproducción en el anexo A.

### 4.1 CX-09 · `correlacionEntrenoAnimo` — ❌ error real (V3) · ✅ corregido en la Fase 1B

Solo junta las fechas de `calistenia[habilidad].sesiones`. **No lee `fitness.sesiones`.**

| Escenario (10 días de Diario; ánimo 5 los días entrenados, 2 los demás) | Lo que devuelve |
|---|---|
| Entrena 5 días con Fitness, calistenia vacía | `diasConEntreno: 0`, sin datos suficientes — *«llevas 0 día(s) con sesión registrada»* |
| Igual, más 3 sesiones viejas de calistenia en días de ánimo 2 | `suficientesDatos: true`, **ánimo 2,0 con entreno y 4,1 sin entreno**: **lo contrario de la verdad** |

**Cuándo aparece:** siempre que entrene con Fitness (es el único registro posible desde la
v3.158.0). Con calistenia vieja, además, mezcla los días de Fitness con los «sin entreno». La
tarjeta se titula «Entrenar calistenia y ánimo», que ya no se puede registrar.

**Pruebas:** ninguna comprueba sus valores. Solo la pinta el banco de renderizado (`StatsView`).

> 🔓 **Fase 1B:** unión de Fitness y calistenia por días, desde el primer entrenamiento (DA-10).
> 🐛 **Fase 1C:** la auditoría vio que, al **dejar de registrar**, todo el Diario posterior caía en
> «sin entreno» (6 días con ánimo 4 frente a 134 con 3,1, solo porque dejó de apuntar). Ahora compara
> **las semanas con algún entrenamiento registrado, entre el primero y el último**, cuenta lo que deja
> fuera (`diasFuera`) y lo dice; valida el ánimo (entero 1–5) y las sesiones por `id`. Con el mismo
> escenario: 6 y 6 días, ánimo 4 y 4. ⚠️ Coste conocido: una semana entera de descanso de verdad
> también queda fuera (DA-11). `test-correcciones-1c.mjs` §1–3.

### 4.2 CX-10 · `correlacionSuenoEstudio` — ✅ fórmula coherente, ⚠️ suposición sin escribir (V3)

- Cruza **la misma fecha** (`cruzarPorFecha`).
- Un registro de sueño se guarda con la **fecha del día en que se apunta**: el formulario no tiene
  campo de fecha (`crearRegistroSueno` pone `todayISO()`), y pregunta *«¿Has dormido siesta
  **ayer**?»*. `puntuacion.js` lo dice explícitamente: *«El sueño se registra por la mañana pero
  describe la noche anterior»*.
- Las horas de estudio se guardan con la fecha del día en que se apuntan.
- **Por tanto, si apunta la noche al levantarse, «misma fecha» = «la noche anterior a ese día de
  estudio»**, que es lo que dicen el comentario y el texto de Estudios. **No es un error de fórmula.**
- ⚠️ **Se descuadra un día** si apunta la noche al acostarse (antes de las 00:00) o después de
  medianoche del día siguiente. Nada lo detecta, porque el registro no guarda «de qué noche es».

### 4.3 CX-11 · varias sesiones de estudio el mismo día — ❌ error real (V3), descubierto aquí · ✅ corregido en la Fase 1B

`cruzarPorFecha` recorre **cada registro de horas**, no cada día. Estudios apunta una entrada **por
asignatura** (`onAddHoras({ asignaturaId, fecha: todayISO(), horas })`), así que estudiar tres
asignaturas un día cuenta como **tres días**.

| Escenario | Devuelve | Debería |
|---|---|---|
| Día 5 (8,5 h de sueño): 3 asignaturas × 1 h · Día 6 (8,5 h): 3 h · Días 7 y 8 (5,5 h): 2 h cada uno | `diasBuenSueno: 4`, **media 1,5 h** | 2 días, **3 h** de media |

La pantalla de Estudios lo dice como *«(4 días con datos), has estudiado de media 1,5 h»*.
**Pruebas:** `test-sueno-grafica.mjs` solo comprueba que las dos funciones devuelvan un objeto.

### 4.4 Caso límite de sueño ↔ ánimo (V3, solo con datos corruptos) · ✅ corregido en la Fase 1B (un ánimo que no está no cuenta)

Una entrada del Diario sin `animo` da `NaN` en la media y la tarjeta pintaría «NaN /5». **Desde la
pantalla no puede pasar** (el Diario pone 3 por defecto y hay una entrada por día); sí con datos
importados o corruptos, porque `diario` se carga **sin normalizador**.

## 5. Tarjetas que enseñan calistenia antigua — diagnóstico y propuesta (sin cambios)

### 5.1 Quién lee `calistenia` o `futbol` (V1, comprobado con `grep` y leyendo cada sitio)

| # | Dónde | Qué enseña o calcula | Con calistenia vacía (cuenta nueva) | Con calistenia vieja | Verificado |
|---|---|---|---|---|---|
| 1 | **Inicio · tarjeta «Entreno»** (`DashboardView.jsx` ~l. 658–786) | La habilidad «destacada» y su % | Vacía, *«Toca para empezar a registrar»*, aunque entrene a diario en Fitness | *«Handstand: 72%»*, congelado | V1 |
| 2 | **Bienestar · tarjeta Entrenamiento** (`resumenesHub.js`, caso `entreno`) | Habilidades activas y última sesión | *«Sin sesiones todavía · Toca para registrar un entreno»* | *«1 habilidad activa · Última sesión hace 41 días»* | V3 |
| 3 | **Estadísticas · «Entrenar calistenia y ánimo»** | CX-09 | 0 días con sesión | Conclusión que puede salir invertida | V3 |
| 4 | **Predicciones · «Constancia de entreno»** (`prediccionFuerza`) | Ritmo de la habilidad más entrenada | *«hacen falta al menos 4 sesiones registradas en alguna habilidad»*: pide algo **que ya no se puede hacer** | *«Handstand… tu ritmo va estable»* (0 y 0 sesiones) | V3 |
| 5 | **Logros · «Primer PR»** (`logros.js`) | Récord de calistenia | Bloqueado para siempre: *«Registra un récord personal de calistenia»* | Conseguido (se queda) | V3 |
| 6 | **Puntuación del día · área «Entrenamiento»** (`puntuacion.js`) | Si «usa» el área y si la ha hecho hoy | El área no cuenta | **Cuenta y nunca está hecha**: la nota baja cada día aunque entrene en Fitness (V3: 50 % con sueño hecho) | V3 |
| 7 | Calendario · eventos de entreno derivados (`calendarioIntegracion.js`) | Sesiones de calistenia y partidos como eventos | Nada | Salen como historia (correcto) | V3 |
| 8 | IA: «Consejo del día» (Inicio), Sugerencias, buscador 🔍 (`currentState`) | Mandan calistenia y fútbol | — | Datos viejos a la IA; **Fitness no va** | V1 |
| 9 | Papelera, Deshacer, exportación, «Eliminar datos» | Restaurar/exportar/borrar lo guardado | — | **Correcto: son los datos y se conservan** | V1 |
| 10 | **Imagen personal · «Mis datos» → «Tu entrenamiento»** (`configuracionInicial.js`) — *añadida por la auditoría de la Fase 1C* | Días de calistenia | *«Todavía no tienes esta información»* y manda a «Calistenia», que ya no existe, aunque entrene en Fitness | Un recuento viejo como si fuera actual | V3 |

> 🔓 **Fase 1C (DA-11):** la fila 5 —**«Primer PR»**— se puede conseguir superando una marca en Fitness
> (`primerRecordPersonal`, `progresion.js`, con la comparación de la F11), y el PR de calistenia se
> conserva; total 12. La fila 10 lee Fitness (CX-18). Las tarjetas 1 y 2 ya no toman un entrenamiento
> con fecha futura como «hoy», y la 4 no lo cuenta (CX-19).

⚠️ Hallazgo relacionado: **ni el Calendario ni Hoy enseñan los entrenamientos de Fitness** (ninguna
librería de calendario lee `fitness`). No es un fallo de la v3.158.0 —nunca los enseñaron—, pero un
asistente de Organización no los encontraría ahí.

### 5.2 Propuesta mínima (para revisar; **no implementada**) · 🔓 implementada en la Fase 1B, con DA-10

> Se hizo así: 1 y 2 tal cual (las dos tarjetas leen el mismo resumen); 3 tal cual, contando **días** y
> solo **desde el primer entrenamiento**; 4 con `prediccionConstanciaEntreno` (días con entreno, y dice
> por qué no compara cuando la historia no cubre las dos quincenas); 5 **se conserva** el logro (no hay
> equivalencia segura); 6 con la unión de días; 7 y 8 sin tocar. 🔓 **Fase 1C:** el 5 pasa a la segunda
> opción de la propuesta —redefinirlo sobre un récord de Fitness— **sin quitar** el camino de calistenia
> (DA-11).

Principio: **una tarjeta sobre el entrenamiento actual lee la fuente actual**, que es
`fitness.sesiones` a través de las lecturas que ya existen (`historialPorReciente` /
`ultimaDelHistorial` en `historial.js`, `entrenamientosEnPeriodo` en `actividadEntrenamiento.js`).
**Donde no hay un equivalente actual, estado vacío coherente**, sin pedir algo imposible. **Ni un
dato se borra** y **no se reconstruye el bloque quitado**.

| # | Cambio mínimo propuesto | Por qué |
|---|---|---|
| 1 y 2 | Leer el último entrenamiento **completado** de Fitness: *«Último: Tirón · hace 2 días»*. Sin ninguno, el estado vacío que ya existe (*«Toca para empezar a registrar»*, que abre Fitness). | Es el mismo dato que ya enseña Fitness; no hace falta un cálculo nuevo. Hay que pasar `fitness` a `DashboardView` y a `calcularResumenModulo` |
| 3 | Fechas con entreno = **unión** de las sesiones completadas de Fitness **y** las de calistenia antiguas; título «Entrenar y ánimo». | Los días viejos de calistenia **sí fueron días de entreno**: quitarlos borraría historia; ignorar Fitness es el error |
| 4 | Dejar de alimentar la tarjeta con calistenia y enseñar un vacío que no pida lo imposible, o basarla en `entrenamientosEnPeriodo` (sesiones de los últimos 14 frente a los 14 anteriores). | El texto actual pide «sesiones en alguna habilidad» |
| 5 | Mantener el logro **conseguido** si ya lo estaba; si no, no ofrecerlo (o redefinirlo sobre un récord de Fitness, que ya calcula `progresion.js`). | Un logro que no se puede conseguir es un control decorativo (regla 8). **Lo decide Josué** (D2-02: nada de gamificar fuera de Rachas/Sonido) |
| 6 | `usa`/`hecho` del área a partir de las sesiones completadas de Fitness (y, si se quiere, `usa` también con calistenia antigua **solo** si hay alguna sesión reciente). | Si no, castiga cada día a quien tenga calistenia vieja |
| 7 | Nada. Opcional y aparte: decidir si los entrenamientos de Fitness salen en el Calendario. | Es una función nueva, no un arreglo |
| 8 | **No tocar ahora** (DA-09: los 12 paneles y el buscador no se cambian en esta fase). Anotarlo para cuando se decida su futuro (CX-05). | — |

Pruebas que habría que dar la vuelta o añadir si se autoriza: el caso `entreno` de `test-inicio.jsx`
/ `test-modulos.jsx`, `test-puntuacion.mjs`, el banco de renderizado de `StatsView`,
`PredictionsView` y `AchievementsView`, una suite propia para `correlaciones.js` (hoy no tiene) y la
sección del recorrido que mira Inicio.

## 6. Archivos que la aplicación no carga (36, V1)

| Tipo | Archivos | ¿Es un problema? |
|---|---|---|
| **Auditorías, cierres y declaraciones** (las ejecutan las suites, a propósito; C-68) | `arquitecturaFitness`, `auditoriaDist`, `auditoriaFinal`, `auditoriaFuncionalFitness`, `auditoriaPWA`, `cierre`, `cierreNutricion`, `coherenciaVisual`, `contratosMotion`, `documentacionEH`, `escalabilidad`, `estructuraDatos`, `experienciaReal`, `integracionFitness`, `lenguajeMotion`, `motionMapa`, `produccion`, `pruebaFinal`, `pruebasIntegrales`, `pulidoMotion`, `qaMotion`, `releaseFitness`, `robustezFitness`, `safari`, `seguridadEH`, `usabilidad`, `microinteracciones` (EH F50), `accionesRapidas` (EH F61) | No |
| **Funciones construidas sin conectar** | `iaEstilo`, `aprendizaje`, `insights`, `resumenPeriodico`, `contextual`, `recuperacion` (§3.3) | Sí para los asistentes: **no son «disponibles»** |
| **Hooks sin uso** | `src/hooks/useRachas.js`, `src/hooks/useGamificacion.js` (preparados para «la futura UI»; la app usa las librerías directamente) | No |

## 7. Módulo a módulo

Formato de cada ficha: **Datos** · **Motores** (firma → lo que devuelve, nivel) · **Pruebas** ·
**Cruces posibles** · **Privacidad** · **Estado** · **Reutilizar**. «Sin uso» quiere decir que
ningún otro archivo de la app lo importa (puede usarse dentro de su propia librería).

### 7.1 Inicio (Hoy) — `DashboardView`, `HubView`, `AgrupadorView`, `quickAdd`
- **Datos:** no tiene clave propia; lee perfil, sueño, calistenia, fútbol, economía, nutrición,
  productividad, estudios, diario, salud, objetivos y personalización.
- **Motores:** `puntuacionDelDia(estado, hoyISO, desactivados)` → `{valor, hechos, total, detalle,
  hayDatos}` (V3, P `test-puntuacion`); `calcularResumenModulo(id, s)` → `{linea1, linea2, estado}`
  (V3; P `test-inicio`, `test-modulos`); `centroDelDia.resumenDelDia(estado, opciones)` →
  `{tareas, eventos, habitos, linea, vacio}` y `progresoDelDia` (V1, P `test-centro-dia`);
  `rachasHoy.mantenimientoHoy(rachas, habitos, hoy)` (V1, P `test-rachas-hoy`).
- **Cruces:** es el sitio donde ya se cruzan módulos (puntuación del día).
- **Privacidad:** Relación solo desbloqueada (regla 6, D).
- **Estado:** completo; ⚠️ CX-12 (tarjeta Entreno y puntuación) y CX-14 (días en los resúmenes).
- **IA generativa:** «Consejo del día» (AIPanel).
- **Reutilizar:** `puntuacionDelDia` y `resumenDelDia` son la base natural de un resumen del día por
  reglas.

### 7.2 Salud física — `HealthView`, fotos de progreso
- **Datos:** `salud` (medidas e historial, sin normalizador), `saludFotos`, lesiones también en
  `perfil.lesiones`.
- **Motores:** `salud.js`: `estadoActual({salud, perfil, hoy})` → `{peso, imc, dias, desdeElPerfil,
  hayMedidas, vacio}` (V2), `avisoDeRegistro` → `{avisa, dias, texto}`, `evolucionPeso`,
  `lesionesDe` → `{historial, perfil, total, hay}`, `imcDe` (null sin altura). P: solo
  `test-bienestar`. `predicciones.prediccionPeso(medidas)` → `{suficientesDatos, registros,
  pesoActual, tendenciaSemana, pesoEstimado30d}` (V2, **sin suite propia**; ⚠️ proyectar el peso
  roza la regla 7).
- **Privacidad:** fotos tras `fotos_privadas`; nada de diagnósticos.
- **Estado:** completo (E3 F30). **Reutilizar:** `estadoActual`, `evolucionPeso`.

### 7.3 Sueño — `SleepView`
- **Datos:** `sueno` (ver §2). Duración derivada con `calcularDuracion` (helpers).
- **Motores:** `sueno.js` es modelo y presentación: `ventanaDeDias(lista, {hoy, desplazamiento,
  dias})` → `{inicio, fin, puntos, esActual}` (V2), `mediaDeVentana`, `huecosDeVentana`,
  `resumenNoche(r)` → `{duracion, horas, calidad, extras}`. **No hay motor de análisis de sueño**
  más allá de las correlaciones (§4). P: `test-sueno`, `test-sueno-grafica`.
- **Estado:** completo (SU F1/F2). **IA generativa:** «Analizar mi sueño».
- **Reutilizar:** `ventanaDeDias` (respeta los huecos: un día sin registro no es un cero).

### 7.4 Nutrición — `NutritionView`, `JarraDeAgua`, escáner
- **Datos:** `nutricion` (4 normalizadores).
- **Motores (los más completos fuera de Fitness):** `analizarNutricion(nutricion, periodoId, hoy)` →
  `{nivel, diasConDatos, diasDelRango, resumen, sinDatos, patrones, proteina, calorias,
  regularidad, distribucion, recomendaciones, aviso}` (V2, P `test-inteligencia-nutricion`);
  `contextoIANutricion` (sin comidas ni peso); `estadisticasNutricion.js`: `promediosDelPeriodo`,
  `cumplimientoDelPeriodo`, `evolucion`, `constancia`, `mejorYPeorDia`, `analisisProteina`,
  `analisisCalorias` (V1, P `test-estadisticas-nutricion`); `objetivoDeAgua(nutricion, perfil)` →
  `{ml, manual, propuesta, texto}` (V2, P `test-agua-nutricion`).
- **Reglas que ya traen:** niveles de confianza por días con datos, «no registrado ≠ no consumido»,
  sin alarmismo, sin interpretar diferencias como buenas o malas.
- **Privacidad:** regla 7 (nada de objetivos calóricos estrictos); ni comidas ni peso a la IA.
- **Estado:** completo (NU F1–F8). **IA generativa:** «Analizar mi semana» y la foto del plato.
- **Reutilizar:** es el modelo a copiar **como forma** para otros asistentes (nivel de confianza →
  qué se permite decir).

### 7.5 Fitness — 13 pantallas y 16 componentes
- **Datos:** `fitness` (ver §2). Rangos, progresión, cola de clasificación y línea temporal **se
  derivan, no se guardan**.
- **Motores (todos alcanzables y con suites, P):** `historial.js` (`historialPorReciente`,
  `ultimaDelHistorial`, `sesionesPorDia`; 15 suites), `actividadEntrenamiento.js`
  (`entrenamientosEnPeriodo(fitness, {periodo, hoy})` → lista (V2), `adherenciaDelPlan`,
  `constancia`; 8), `progresion.js` (14), `progresoMuscular.js` (4), `motorRangos.js`
  (`rangoGlobalEfectivo(fitness, {propios, perfil, efectivos})` → `{sinRango, rango, nombre, score,
  cobertura, …, fuente, confianza}` (V2); 15), `resumenProgreso.centroDeProgreso(fitness, fotos,
  {…})` → `{estado, periodo, bloques, timeline, avisos, onboarding, parcial, objetivosActivos}`
  (V2), `objetivosFitness.js`, `colaClasificacion.js`, `planificacionSemanal.js`, `tuPlan.js`.
- **Reglas que ya traen:** sin datos = «Sin rango» (nunca el 1), «sin registro ≠ descanso», un
  periodo filtra lo que se ve y no lo que se calcula, nada de porcentajes inventados ni
  predicciones.
- **Privacidad:** fotos tras `fotos_privadas` (C-35). **Fuera de `currentState`**.
- **Estado:** completo (45/45). ⚠️ Nadie fuera de Fitness lee sus sesiones (CX-12, §5).
- **IA generativa:** ninguna desde la v3.158.0.
- **Reutilizar:** todo; **un asistente de Fitness no necesita cálculos nuevos**.

### 7.6 Imagen personal — ver §3
P: decenas de suites (`test-ideas-estilo`, `test-progreso-estilo`, `test-recomendaciones-*`,
`test-descubrir`…). Firmas clave (V1): `recomendarIdeas(estado, {armario, datosGlobales, objetivos,
hoy, limite})` → `{apagada, frecuencia, total, ideas, hayMas, guardadas, texto}`;
`panelProgreso(estado, {…})` → `{…, metricas, rachas, objetivos, vacio, apagado, resumen}`;
`contextoParaIA(estado, intencionId, {datosGlobales})` → `{intencion, resumen, datos,
privadosOmitidos, modulos}` (**sin conectar**).

### 7.7 Estudios — `EstudiosView`
- **Datos:** `estudios` (3 normalizadores).
- **Motores:** `fechasAcademicas(estudios, {asignaturaId, asignaturaIds})` → lista ordenada de
  exámenes, entregas y eventos (V2; usada por 4 sitios; P `test-fechas-academicas`);
  `estudiosApps.js`, `asignaturas.js`, `usosAsignatura.js`, `appsAprendizaje.js` (P);
  `predicciones.prediccionNotas(estudios)` (V2, sin suite); `correlacionSuenoEstudio` (§4).
- **Estado:** completo (ES F1–F6). **IA generativa:** «Analizar mis estudios», «Explícame un
  concepto», plan de repaso.
- **Reutilizar:** `fechasAcademicas` es la única fuente de «qué viene».

### 7.8 Productividad (Hábitos, Rachas, Objetivos, Pomodoro, Metas, Rutinas) — `ProductivityView`, `RachasView`, `ObjectivesView`
- **Datos:** `productividad`, `objetivos`, `rachas`, `gamificacionRachas`.
- **Motores:** `integracionPR.js`: `resumenDelDia(d)` → `{hechos, total, porcentaje, frase, texto}`
  (V2), `queMeQueda`, `paraHoyPR`, `cadenas`, `progresoGlobal`, `estadisticasPR(d, periodo)` →
  `{tareas, habitos, pomodoros, tiempoConcentrado, rutinas, metas…, objetivos…}` (V2),
  `rachaProductividad` (P `test-integracion-pr`); `rachas.js` (motor de rachas, sin contadores
  guardados; 5 suites), `habitos.js`, `metasObjetivos.js`, `pomodoro.js`, `rutinas.js`, `tareas.js`
  (P); `predicciones.prediccionAbandonoHabito` y `prediccionObjetivo` (V1, sin suite).
- **Reglas que ya traen:** `NO_TOCA` no rompe una racha, sin nada que hacer = `null` (no 0 %), frases
  por umbrales sin juicio.
- **Estado:** completo (E3 F23–F29). **IA generativa:** consejo de hábitos y revisión de objetivos.

### 7.9 Mente — Fe, Relación, Bienestar digital, Cumpleaños
- **Fe** (`FaithView`): datos `fe` sin normalizador; **sin motor** (cuentas en la vista); dos
  `AIPanel` con `AVISO_DOCTRINAL`. Pruebas: solo banco de renderizado.
- **Relación** (`RelationView`): `relacion` + bucket `relacion`; `albumRelacion.js` (P). 🔒 **Fuera
  de todo asistente por defecto** (regla 6).
- **Bienestar digital** (`WellbeingView`): `bienestar` sin normalizador; **sin motor**: el tiempo
  por categoría se suma dentro de la vista. Pruebas: banco de renderizado.
- **Cumpleaños** (`CumpleanosView`): `cumpleanos.js` (23 exportaciones; P `test-cumpleanos`);
  ordena por el próximo y entra en el Calendario como recurrencia anual.
- **Estado:** completos para lo que hacen; **sin inteligencia propia** salvo Cumpleaños.

### 7.10 Biblioteca — `LibraryView`
- **Datos:** `biblioteca` (6 listas), `bibliotecaArchivos`.
- **Motores:** de organización, no de análisis: `bibliotecaGlobal.js` (`buscarEnBiblioteca`,
  `recientes`, `favoritosDe`), `libros.js` (`progresoDe`), `ideas.js`, `documentos.js`,
  `colecciones.js`, `guardados.js`, `notas.js` (todas con P).
- **Estado:** completo (BL F1–F8 + editar notas). **Reutilizar:** su búsqueda.

### 7.11 Diario — `DiaryView`
- **Datos:** `diario.entradas` (una por día; sin normalizador).
- **Motores:** **ninguno** propio. Lo usan las correlaciones (§4).
- **Privacidad:** ⚠️ hoy viaja entero en `currentState` y en su panel de IA (CX-02). Para un
  asistente por reglas: **decisión P-06**.
- **IA generativa:** «Detectar patrones emocionales».

### 7.12 Organización (Tareas, Calendario, Horario) — `CalendarView`, `HorarioView`
- **Datos:** `calendario`, `productividad.tareas`, `horarioTop`.
- **Motores:** `estadisticasPlan.js` (`resumenPlanificacion(estado, periodoId)` → `{desde, hasta,
  planificados, completados, pendientes, cumplimiento, tareas, eventos}` (V2), `comparar`,
  `tendencia`, `horasPlanificadas`…; P), `agendaDia.js`, `calendarioMes.js`, `semana.js`,
  `calendarioIntegracion.eventosDerivados` (P en 7 suites), `avisosPlanificacion.js`;
  `analiticaHorario.informe(estado, {hoy, dias})` → `{cumplimiento, semana, tareas, mochila,
  patrones, tendencia, resumen}` (V2) + `recomendaciones(inf)`; `automatizaciones.js`,
  `avisosHorario.js`, `mochila.js`, `horarioTop.js` (P).
- **Preparado y sin pantalla:** `horarioTop.js` monta contextos para IA (`contextoHoyIA`,
  `contextoParaIA` del planificador): ninguna pantalla los manda.
- **Estado:** completo (HC F1–F10, HT 12/12). ⚠️ No enseña los entrenamientos de Fitness (§5.1).

### 7.13 Economía — `FinanceView`
- **Datos:** `economia` (`normalizarEconomiaHucha`).
- **Motores:** `hucha.js` (`panelHucha(economia, hoy)` → `{estado, ahorrado, objetivo, porcentaje,
  barra, titulo, detalle, periodo}` (V2), P `test-hucha`). ⚠️ **Saldo, ingresos y gastos del mes se
  calculan dentro de la vista** (`FinanceView.jsx` l. 220–223). `prediccionAhorro(economia)` (V2, sin
  suite) calcula su propio neto mensual: **dos cálculos parecidos en dos sitios**.
- **IA generativa:** «Consejo financiero».
- **Reutilizar:** antes de un asistente de Economía, sacar el saldo a una función (una sola fuente).

### 7.14 Negocio — `BusinessView`
- **Datos:** `negocio.proyectos` (sin normalizador). **Sin motor.** Pruebas: banco de renderizado.
- **IA generativa:** «Mejorar mis ideas».

### 7.15 Armario — `ArmarioView`
- **Datos:** `armario` (fusión superficial, sin normalizador por elemento).
- **Motores:** `armarioInteligencia.js`: `estadisticasOutfits`, `estadisticasPrendas`,
  `diversidadArmario` → `{porcentaje, usadas, base, explicacion}`, `prendasMuyRepetidas`,
  `combinacionesRepetidas`, `outfitsOlvidados`, `prendasInfrautilizadas`, `recomendarOutfits` →
  `{suficiente, motivo, recomendaciones, faltan}`, `panelInteligente` (V1/V2, P
  `test-armario-inteligencia`).
- **Estado:** completo (AR F1–F4). **Reutilizar:** casi un asistente hecho.

### 7.16 Progreso (Estadísticas, Predicciones, Logros) — `NumbersView` y sus tres pantallas
- **Motores:** `correlaciones.js` (§4), `predicciones.js` (6 funciones, **sin suite**),
  `logros.calcularLogros(…)` (**sin suite**), `numeros.js` (`hayDatosPara`, `panelNumeros`).
- ⚠️ **CX-15:** `hayDatosPara('estadisticas')` usa `largo()` (longitud de lista) sobre `diario`
  (un objeto) y `calistenia` (un objeto): **siempre 0**. Con 5 entradas de Diario y ninguna noche
  dice que no hay datos (V3). `'logros'` lo hace bien con `diario.entradas`.
- **Estado:** funciona, con CX-09, CX-11, CX-12 y CX-15.

### 7.17 Ajustes y personalización — `SettingsView`, `PersonalizationView`, `PapeleraView`
- Preferencias, seguridad (PIN, áreas y acciones protegibles), exportación (`exportData.js`),
  papelera. No es un candidato a asistente; sí es **donde viviría el permiso** de un asistente.

### 7.18 Transversal: buscador e IA — `App.jsx`, `ui.jsx`
- **Generativa (V1, recontado):** 12 `<AIPanel>` (Sueño, Estudios, Economía, Inicio, Fe ×2,
  Objetivos, Nutrición, Productividad, Negocio, Diario, Salud), `askAI` directo en Estudios (2) y
  Objetivos (1), foto del plato (`askAIWithImage`, Nutrición) y en `ui.jsx`: el propio panel, el
  buscador 🔍 (pregunta libre + `currentState`, con adjunto) y Sugerencias. `askAIWithImages` ya no
  tiene quien la llame.
- **Por reglas:** `indiceBusqueda.js` busca pantallas y acciones (P `test-buscador`), sin IA.
- **Estado de la IA no disponible:** `disponibilidadIA.js` (P).

## 8. Reutilización: qué motor serviría a cada asistente

| Asistente (ver catálogo) | Lo que ya existe y basta | Lo que falta antes |
|---|---|---|
| ASIS-FIT | Todo `historial`/`actividad`/`progresion`/`motorRangos`/`centroDeProgreso` | Nada de cálculo |
| ASIS-NUT | `analizarNutricion`, estadísticas, agua | Nada de cálculo |
| ASIS-ARM | `armarioInteligencia` | Nada de cálculo |
| ASIS-IMG | Ideas, progreso, recomendaciones; **y las 6 librerías sin conectar** | Integrarlas (está congelado a funciones nuevas: lo decide Josué) |
| ASIS-PRO | `integracionPR`, `rachas` | Suite para `predicciones` |
| ASIS-HOR / ASIS-CAL | `analiticaHorario`, `estadisticasPlan`, `centroDelDia`, `puntuacionDelDia` | Corregir CX-12 y CX-14 |
| ASIS-EST | `fechasAcademicas` | Corregir CX-11 |
| ASIS-SUE | `ventanaDeDias` + correlaciones | Motor de patrones de sueño (no existe) y CX-11 |
| ASIS-SAL | `salud.js` | Revisar `prediccionPeso` contra la regla 7 |
| ASIS-ECO | `hucha.js` | Sacar el saldo de la vista |
| ASIS-FE, ASIS-DIA, Negocio, Bienestar digital | — | No hay motor: habría que crearlo, y el Diario depende de P-06 |
| ASIS-GEN | `indiceBusqueda`, las fichas de arriba | P-01, P-06 |

## 9. Hallazgos que no se han tocado (para decidir)

> 🔓 **Fase 1B:** CX-09, CX-11, CX-14 y CX-15 corregidos; CX-12 corregido salvo «Primer PR» (se conserva) y la IA (DA-09); `predicciones.js` (constancia) y las correlaciones ya tienen suite de valores (`test-correlaciones-metricas.mjs`). CX-13 sigue igual. Nuevos: CX-16 (corregido) y CX-17 (abierto). Ver `DECISIONES.md`.
>
> 🔓 **Fase 1C:** CX-09 corregido otra vez (registro interrumpido), «Primer PR» alcanzable, CX-18 y CX-19
> nuevos y corregidos (DA-11); `logros.js` ya tiene suite de valores (`test-correcciones-1c.mjs` §5).

| ID | Qué | Gravedad | Dónde |
|---|---|---|---|
| CX-09 | Entreno ↔ ánimo ignora Fitness y puede invertir la conclusión | Alta (dato falso en pantalla) | `correlaciones.js` |
| CX-11 | Varias sesiones de estudio el mismo día cuentan como varios días | Media | `correlaciones.js` |
| CX-12 | Seis sitios leen la calistenia antigua y ninguno Fitness | Media | §5 |
| CX-13 | Imagen personal: 7 apartados sin pantalla y 6 librerías sin conectar; su informe dice «terminado» | Documental | §3 |
| CX-14 | «Hace 1 día» para algo de hoy (redondea horas desde la medianoche en vez de contar días): las tarjetas de Salud, Entreno, Diario y Fe de los hubs | Baja | `resumenesHub.js`, `diasDesde` |
| CX-15 | `hayDatosPara('estadisticas')` no ve el Diario ni la calistenia | Baja | `numeros.js` |
| — | `predicciones.js` y `logros.js` sin ninguna suite que compruebe valores | Riesgo | — |

## Anexo A · Cómo reproducirlo (sin tocar el código)

Todo se ejecuta desde la raíz con el cargador del proyecto, sobre las funciones de verdad:

```bash
node --import ./scripts/resolver-vite.mjs ruta/al/script.mjs
```

**CX-09** — construir 5 entrenamientos completados con el flujo real (`crearRutina` →
`anadirEjercicio(r, 'dominada-prona')` → `empezarSesion` → `editarSerie`/`marcarSerie` →
`pasarAFinalizacion` → `guardarEntrenamiento({ confirmado: true })`, como hace
`test-actividad-entrenamiento.mjs`), un Diario de 10 días y llamar a
`correlacionEntrenoAnimo(calistenia, diario.entradas)` con `{}` y con 3 sesiones viejas.

**CX-10 / CX-11** — `crearRegistroSueno({ horaDormir, horaDespertar })` devuelve `fecha: todayISO()`;
`correlacionSuenoEstudio(sueno, horas)` con tres registros de horas el mismo día.

**§5** — `calcularResumenModulo('entreno', { calistenia, futbol })`,
`puntuacionDelDia({ …, sueno: [noche de hoy] }, hoy, [])`, `prediccionFuerza(calistenia)`,
`calcularLogros({ …, calistenia })` y `eventosDerivados({ objetivos: null, estudios: null,
calistenia, futbol, productividad: { tareas: [] }, … })` con `DEFAULT_CALISTENIA` y con una
habilidad al 72 % y sesiones de hace 40 días.

**§6 y anexo de librerías** — recorrer los `import` desde `src/main.jsx` con `@babel/parser` (ya está
en `node_modules`) y, para cada nombre importado, comprobar que aparece en el cuerpo del archivo
quitando comentarios y la propia línea del `import`.
