# Fase 2.x de los chatbots — 2.1, 2.2, 2.3 (B0–B7) y E2

> Preparada el 2026-10-31 (paso 21 de la recuperación) en la copia de trabajo del paso 17. **Recoge lo que se decidió y lo
> que está construido; no añade decisiones.** Cada apartado dice de dónde sale (§10, fuentes). Donde una fuente es una
> propuesta de Claude que Josué no aprobó expresamente, se dice «propuesta». Lo que no consta en ninguna fuente se marca
> **«no consta»** y no se rellena.
>
> Continúa la especificación de los chatbots (`ESPECIFICACION_CHATBOTS.md`, §1–§20, v3.161.3). Las reglas de allí siguen
> en pie: deterministas, sin IA generativa ni red (DA-09), lista blanca de datos, un día sin registro no es un cero, ni
> consejos ni diagnósticos.
>
> El corpus de 130 preguntas y las 37 preguntas de ejemplo tienen su propio documento: `CORPUS_FASE_2X.md`.

## 0. Estado en una tabla

| Bloque | Qué es | Estado (2026-10-31) | Dónde está |
|---|---|---|---|
| **2.1** | Motor honesto: fechas, entidades, aclaraciones (A1, A2, A3, A7, A8, A9) | ✅ Construida. Parte reconstruida (§9) | Copias de trabajo; no en el repositorio |
| **2.2** | Contexto: «la anterior», unidades sobreentendidas, continuidad (P1–P7) | ✅ Construida. Casi toda original verificada | Ídem |
| **B0** | Comparación como pareja; «¿y la anterior?» mueve los dos; varias aclaraciones vivas | ✅ Construida y probada (pasos 18 y 19). Dos riesgos abiertos (§4.1) | Ídem |
| **B1** | Comparador común de métricas y su contrato | ✅ Construida | Ídem |
| **B2** | Métricas de Fitness y Productividad | ✅ Construida | Ídem |
| Correcciones del paso 4 | Defectos de A2/A7 en lo reconstruido, pruebas de B0–B2, H-25 | ✅ Construidas | Ídem (H-25 y C ya están en el repositorio, `14f225c`) |
| **E2** | Clasificar las menciones (entidad, circunstancia, no filtrable) | ✅ Construida | Copia del paso 17 |
| **B3** | Nutrición en el comparador | ⬜ Pendiente | — |
| **B4** | Estudios en el comparador | ⬜ Pendiente | — |
| **B5** | Sueño en el comparador, sin regresiones | ⬜ Pendiente | — |
| **B6** | Funcionalidades adicionales justificadas | ⬜ Pendiente; cada una con aprobación | — |
| **B7** | Pruebas completas, corpus e informe final | ⬜ Pendiente | — |

**Orden de integración decidido por Josué (2026-10-31):** primero se integra todo lo verificado (2.1 → 2.2 → B0 → B1 → B2 →
correcciones del paso 4 → E2), en una rama nueva desde `14f225c`, **nunca directamente en `main`**; después se construye
B3–B7 encima. La procedencia del paso 15 (14 marcas `⟦Procedencia · paso 15⟧` y `PROCEDENCIA_PASO15.md`) está aceptada.

## 1. Fase 2.1 — motor honesto

Fuente: resumen de las 11:11 del 25/10 [F1], encargo del paso 2 [F6], trazabilidad del paso 2 [F7] y auditoría del
paso 4 [F8]. **El texto original del encargo de la 2.1 no se conserva**: solo su resumen.

| Id | Comportamiento aprobado | Dónde vive |
|---|---|---|
| **A1** | La única fecha de un mensaje con varias preguntas solo pasa a otra pregunta si es de su mismo tiempo («¿cuánto dormí ayer y qué me toca?»: «qué me toca» no mira ayer) | `periodoParaCapacidad` (`prestada`) |
| **A2** | Una entidad que no existe se dice («No encuentro «X» entre tus …», con las que hay) y **nunca se sustituye por la del contexto**; deja de ser «de lo que hablamos» | `mencionSinResolver`, `noEncontrada`, `pluralDe`, `argumentosPara`, `recordar` |
| **A3** | Una fecha que la capacidad no puede filtrar se avisa («Esto no lo puedo filtrar por fechas…»), y «¿y ayer?» tras algo sin fechas pregunta (`fecha_no_aplicable`) | `contestarUno`, elipsis |
| **A7** | Erratas de fecha: solo se corrige una lista cerrada; lo demás se avisa («No he entendido «ayet»…»), nunca se devuelve otro día | `ERRATAS_FECHA`, `corregirFecha`, `palabrasParecidasAFecha` |
| **A8** | La misma pregunta repetida en un mensaje, una sola respuesta | bucle de respuestas |
| **A9** | Una opción se resuelve sola solo si la nombra una palabra entera; si no, se pregunta («¿Te refieres a «X»?»). Caso exigido: «Leer 30 minutos» frente a «Leer la Biblia» | `resolverEntidad` (`mismasPalabras`, `propia`), `aclaracionDeEntidad` |

- **A4, A5 y A6: no constan.** El resumen enumera solo A1, A2, A3, A7, A8 y A9 como implementados.
- **Correcciones del paso 4** sobre lo reconstruido: A2 («¿cuál es mi racha de leer la biblia?» con solo «Leer 30 minutos»
  ya pregunta) y A7 (noche, mates, sacado y sobado no son erratas de fecha).
- **Corrección C** (`normalizarMensaje`, palabras como «constructor» o «__proto__»): commit `14f225c`, ya en el repositorio.

## 2. Fase 2.2 — contexto conversacional

Fuente: [F1] y [F7]. **Las siete decisiones de Josué**, tal como las recoge el resumen de las 11:11 (el mensaje original no
se conserva):

1. «La anterior» es el periodo anterior del calendario.
2. «Semana anterior» o «mes anterior» se entienden respecto al contexto.
3. Una comparación sin calcular se contesta con los periodos por separado y una nota (`TEXTO_SIN_DIFERENCIA`); sin tema,
   se pregunta qué comparar. ⚠️ **Desde B1/B2 esto vale solo para lo que no declara métrica** (§5).
4. Continuidad de intención: nombrar solo otra entidad sigue con la pregunta anterior. Por esta decisión, «press militar»
   tras un récord pasa a «récord» (la prueba antigua se dio la vuelta y la conducta sin contexto se sigue comprobando).
5. Vocabulario de Estudios y Sueño.
6. Se guardan los periodos usados, también los puestos por defecto, solo para resolver referencias.
7. Se mantienen la caducidad (6 turnos, 30 minutos) y el aislamiento.

| Id | Comportamiento | Dónde vive |
|---|---|---|
| **P1** | Lo que se contestó de verdad en el turno: cada capacidad con su periodo y su entidad | `recordar` (`ultimaRespuesta.items`) |
| **P2** | «La anterior»: sin contexto, sin unidad, sin periodo, ambigua o futura → se pregunta o se explica | `referenciaAnterior`, `resolverAnterior`, `relativizarAnteriores`; `periodoPrevio`, `unidadDePeriodo` |
| **P3** | Unidad sobreentendida («este mes y el pasado»; dudosa → «¿anterior a cuál?») | `completarSobreentendida` |
| **P4** | Continuidad de intención (decisión 4) | `senalesPropias` |
| **P5** | Comparar sin tema: pregunta qué; el botón contesta cada periodo | `preguntaQueComparar`, rama `plan.periodos` |
| **P6/P7** | Vocabulario: Estudios (`agenda`: «¿tengo algo esta semana?») y Sueño (`'=a medias'`: «a la media» no son noches incompletas). «¿Qué hay?» sigue siendo un saludo | `asistenteEstudios.js`, `asistenteSueno.js` |

## 3. Decisiones de la Fase 2.3 (D1–D6)

Mensaje de Josué del 25/10 a las 11:17 [F3]. Recogidas con sus palabras.

| | Decisión | Estado |
|---|---|---|
| **D1** | Porcentajes: diferencia absoluta **y** porcentaje cuando tenga sentido matemático, **solo si la referencia es mayor que cero**. Si es cero, la diferencia y la explicación de por qué no procede el porcentaje | ✅ En el comparador (B1) |
| **D2** | «¿He mejorado?»: **sin ejercicio**, preguntar si se quiere comparar el número de entrenamientos o el progreso de un ejercicio. **Con ejercicio**, estudiar comparar la mejor marca de cada periodo; incluirlo solo si es fiable y con pruebas suficientes, y si requiere una ampliación importante, detenerse y explicarlo | ❌ **Sin hacer.** Hoy «¿He mejorado?» pregunta solo «¿De qué ejercicio?» (comprobado el 2026-10-31). Toca en B6 |
| **D3** | Semana en curso: comparar los totales reales, con las fechas y los días de cada periodo; no comparar una semana incompleta como si hubiera terminado; no inventar ceros | ✅ En el comparador (B1) |
| **D4** | No añadir todavía comparaciones de hábitos de un periodo ni métricas nuevas de calidad o despertares del sueño; conservar las respuestas de Sueño que ya funcionan | ✅ Respetada hasta hoy. Condiciona B5 |
| **D5** | Nutrición con pocos registros: si un periodo no llega al mínimo de días, no presentarlo como comparación válida; decir cuántos días tienen datos y por qué no se puede; días sin registro ≠ cero | ⬜ El comparador lo admite (`minimoDias`); Nutrición aún no declara métricas (B3) |
| **D6** | Orden: B0 → B1 → B2 → B3 Nutrición → B4 Estudios → B5 Sueño → B6 extras justificadas → B7 pruebas, corpus e informe | Vigente. Integración intercalada tras E2 (§0) |

**Condiciones permanentes** que acompañaron a D1–D6 y a cada bloque [F3, F4, F5]: sin IA generativa ni API para las
comparaciones; no tocar Imagen personal ni la interfaz del chat salvo que sea imprescindible para las aclaraciones (y
entonces consultar); no debilitar pruebas; distinguir lo implementado de lo pendiente; no afirmar como probado lo no
ejecutado. (El stash «F5 WIP» que también se mandaba conservar **se da por perdido**, decisión del 2026-10-31; no se
reconstruye.)

## 4. B0 — corregir el contexto y las aclaraciones

Fuente: [F3] (encargo B0.1–B0.3 y opción A), [F4], decisiones del paso 19 [F10].

| | Comportamiento aprobado | Dónde vive |
|---|---|---|
| **B0.1** | Una comparación se guarda como **pareja de periodos**, nunca como su unión. Lo que espera un periodo simple sigue igual con un periodo simple. Si no hay información suficiente, se pregunta | `parejaValida`, `comparacionVigente`, `recordar` (rama de la pareja), `periodosComparados` en `comparar` (Sueño) y `compararDias` (Nutrición) |
| **B0.2** | **Opción A**: «¿y la anterior?» tras una comparación mueve **los dos** periodos un paso atrás, con la misma unidad y distancia (hoy/ayer → ayer/anteayer; semanas; meses con sus días reales). Si no se puede con seguridad, se pregunta (`referencia_pareja`). No cambia la métrica ni el tema | `desplazarPareja`, `resolverAnterior` |
| **B0.3** | Varias aclaraciones del mismo turno siguen vivas; cada botón contesta a la suya (`origen`); las antiguas caducan; sin cruces entre asistentes ni usuarios | `aclaracionesVivas`, `terminar`, `asistenteChat.jsx` (`pendientesIds`) |

**Decisiones del paso 19 (2026-10-31):**
- B0 se conserva tal como está.
- **Opción 4a:** tras una comparación, una pregunta de un solo periodo pregunta de cuál de los dos
  (`comparacion_que_periodo`). **No hay botón «los dos juntos».**
- Comprobado y fijado en pruebas: con la pareja vigente (menos de 6 turnos y de 30 minutos) se pregunta; al caducar, lo de
  antes de la comparación también ha caducado y se usa el periodo por defecto; el botón elegido pasa a ser el periodo de la
  conversación.

### 4.1 Riesgos abiertos de B0 (no se resuelven sin decisión de Josué)

1. **«Lo de antes» tras comparar y preguntar por otro periodo.** «Septiembre» → «compara esta semana con la anterior» →
   «¿cuánto dormí ayer?» → «compáralo con lo de antes» compara ayer con **septiembre** (el periodo de antes de la
   comparación, que B0 no toca), no con la comparación. Lo dice con fechas y no solapa.
2. **«¿Y el mes anterior?» tras comparar semanas.** Compara esta semana con septiembre (semana contra mes, medias por
   noche). Tras comparar meses sí mueve los dos. Es una cuestión funcional independiente.

Las dos están fijadas como comportamiento actual en las pruebas del paso 19; si Josué decide otra cosa, esas comprobaciones
se dan la vuelta, no se borran.

## 5. B1 — comparador común de métricas

Fuente: [F4] (requisitos y pruebas obligatorias).

- **Contrato de métrica** (`asistente.metricas`, `validarMetrica`): `id`, `nombre`, `tipo` (`entero` | `decimal`),
  `agregacion` (`total` | `media`), `admitePorcentaje`, `unidad` (o `formatear`), `minimoDias`, `diasParaFiable` y
  `calcular(datos, periodo, hoy)`, que reutiliza el cálculo del asistente y devuelve una **medida**. `comparable: false`
  la deja fuera.
- **Medida** (`medidaDePeriodo`): valor (`null` = no hay dato; un 0 es un 0 de verdad), días con datos, días del periodo,
  si basta para fiarse, motivo y notas.
- **`compararMedidas` / `compararMetrica`**: cuentas sobre medidas ya calculadas, nunca sobre texto. Reglas: sin dato no hay
  diferencia ni porcentaje y se dice cuál falta; por debajo del mínimo de días no se compara y se dice cuántos hay;
  porcentaje solo si se admite y la referencia es > 0 (D1); periodos de distinta duración o en curso se comparan tal cual
  con sus fechas y días, nunca «por día» por cuenta propia (D3); lenguaje neutral («más», «menos», nunca «mejor» o «peor»);
  la pareja sale tal cual (`periodosComparados`) para B0.
- **Fuera de B1** (por encargo): métricas reales de los asistentes, hábitos por periodo, calidad o despertares del sueño,
  récords por periodo, cambios de interfaz y documentación.

## 6. B2 — Fitness y Productividad

Fuente: [F5].

| Asistente | Métricas declaradas | Regla |
|---|---|---|
| Fitness | `entrenamientos` (completados), `dias_entreno` | Solo cuenta lo registrado como realizado; un descanso no necesita registro; no se inventan entrenamientos; cero real ≠ falta de datos |
| Productividad | `pomodoros` (completados), `enfoque` (minutos) | Solo métricas que existen de verdad en el asistente; hábitos sin comparar (D4) |

- **«Completar entrenamiento»** (decisión de producto del mismo encargo: apuntar uno hecho fuera de la aplicación, también
  en una fecha anterior, sin duplicar): **construido y en el repositorio** (commit `4531909`).
- Sin pedir comparar, dos periodos siguen siendo dos respuestas.

## 7. E2 — clasificar las menciones

Fuente: diseño del paso 16 y contrato del encargo del paso 17 [F9].

**Contrato (comprobado con pruebas):**

| Entrada | Comportamiento obligatorio |
|---|---|
| «De Biología» | Filtrar por Biología |
| «De Inglés» / «En Inglés» (sin Inglés) | Avisar de entidad desconocida |
| «En casa» / «Con mi amigo» | Ni filtrar ni avisar |
| «¿Y en casa?» / «¿Y con Marta?» tras Biología | Conservar Biología |
| «¿Y en Inglés?» / «¿Y de Inglés?» tras Biología | No heredar Biología; avisar |
| «¿Y de Matemáticas?» tras Biología | Cambiar a Matemáticas |
| «De Biología y Matemáticas» | Pedir aclaración |

**Reglas:** una desconocida nombrada nunca se hereda; una circunstancia no es una entidad desconocida ni borra la anterior;
«con» + persona no es asignatura, ejercicio ni hábito; las conocidas se resuelven igual; con entidad obligatoria se pide la
que falta; no se cambian las reglas históricas de herencia fuera de estos casos.

**Orden de clasificación** (`clasificarMencion`, una sola vez en el motor): vocabulario del asistente (p. ej.
`VOCABULARIO_ASIGNATURAS` de Estudios) → léxico de circunstancias (`CIRCUNSTANCIAS`: lugar, compañía, medio) → tras «con»,
compañía → tras «de», «del» o «sobre», desconocida → entidad obligatoria → pregunta elíptica → si no, **no filtrable**
(«No puedo filtrar por «X», así que te lo enseño sin filtrar»). E2 sustituye el arreglo A del paso 5, **rechazado** porque
heredaba en silencio («¿y en inglés?» tras Biología).

## 8. B3–B7 — pendiente

El orden lo fija D6. **El contenido de cada bloque viene del análisis de Claude del 25/10 a las 11:09 [F2], que es una
propuesta**; lo que Josué decidió está marcado con su D.

| Bloque | Qué debe hacer | Decidido | Propuesta (no aprobada aún) | Depende de |
|---|---|---|---|---|
| **B3 Nutrición** | Comparar periodos con el comparador | D5 (mínimo de días, sin ceros) | Media diaria por indicador (`mediaDelRango`), conservando la comparación de días; hoy «compara las calorías de esta semana con la anterior» responde «Comparo días sueltos…» | B1, B0 |
| **B4 Estudios** | Comparar en Estudios | — | Horas (y días con estudio); cantidades de exámenes y entregas, diciendo que son cantidades, no cómo le fue; las notas son texto y no se comparan. Hoy «¿He estudiado más que la semana pasada?» contesta solo la semana pasada **sin decir que no compara** | B1 |
| **B5 Sueño** | Pasar Sueño al comparador **sin regresiones** | D4 (ni calidad ni despertares nuevos; conservar lo que funciona) | Media de duración por el contrato común | B1, B0 y sus dos riesgos (§4.1); las pruebas del paso 19 |
| **B6 Extras** | Lo justificado que quede | D2 (pregunta sin ejercicio; mejor marca solo si es fiable) | Mejor marca por periodo; hábitos de un periodo (excluidos hoy por D4) | B2–B5; cada extra con aprobación |
| **B7 Cierre** | Pruebas completas, corpus e informe | D6 | Las 130 preguntas más unas 25 de comparación, diferencias revisadas una a una; 37 de ejemplo; `verificar.sh` | Todo lo anterior; la línea base del corpus (`CORPUS_FASE_2X.md`) |

**Comportamientos actuales que B3–B5 cambiarán** (deben cambiar con pruebas que se den la vuelta, no aflojándolas): la
negativa de Nutrición a comparar semanas, las dos respuestas sueltas de Estudios con `TEXTO_SIN_DIFERENCIA`, y el formato de
la comparación de Sueño (hoy sin porcentaje).

## 9. Procedencia, dependencias y orden

- **Procedencia** (aceptada el 2026-10-31): `PROCEDENCIA_PASO15.md` y las marcas del código. En el motor: 1219 líneas
  originales verificadas, 144 editadas, 56 reconstruidas, 332 provisionales (328 idénticas a `14f225c`) y 103 nuevas
  (cifras del paso 15; E2 añadió código nuevo y sustituyó 4 líneas).
- **Pruebas reconstruidas:** las secciones de 2.1 y 2.2 tienen menos comprobaciones que las originales (4 menos en el
  motor y 12 en asistentes, por recuento). Lo que comprobaban exactamente no se puede recuperar.
- **Rechazado:** los arreglos A y B del paso 5 (A heredaba en silencio; B, «fechas vagas», no se incorpora). Viven solo en
  `paso1/copia` y no deben aparecer (`PREPOSICIONES_DE_TEMA`, `FECHAS_VAGAS`).
- **Dependencias reales:**

```
2.1 ──► 2.2 ──► B0 ──► B1 ──► B2 ──► correcciones del paso 4 ──► E2 (+ pruebas de los pasos 15, 18 y 19)
                 │       └──► B3 ──► B4 ──► B5 ──► B6 ──► B7
                 └── (los riesgos de B0 condicionan B5)
```

- Las etapas intermedias (2.1/2.2, B0, B1, B2 por separado) llevan defectos que corrigen el paso 4 y E2: **no se integran
  por separado en `main`**.
- **Base de integración:** `14f225c` (rama `claude/jc-fitness-spec-analysis-oe8iyz`, con C, H-25 y «Completar
  entrenamiento»). `main` está en `ea7bc4a` y no los tiene.

## 10. Pruebas y criterios de aceptación

**Estado medido en la copia del paso 17 (2026-10-31):** motor 363/363, asistentes 441/441, integración 136/136;
`verificar.sh` completo «TODO CORRECTO», 3854 comprobaciones en Chromium.

**Criterios que fijaron los encargos** y siguen valiendo para B3–B7 y para la integración [F3, F4, F5]:
- Resultados exactos; nada de `resultadoA || resultadoB`; demostrar que una prueba se pone roja si se quita lo que protege.
- No debilitar pruebas ni cambiar expectativas para obtener verde; cada cambio de expectativa, justificado por una
  decisión.
- Cubrir siempre: periodos vacíos, datos incompletos, semana en curso, distinta duración, referencia cero, decimales,
  unidades, sin «mejor/peor», pareja de B0 conservada, regresión de 2.1/2.2 y aislamiento entre módulos y usuarios.
- **El corpus de 130 preguntas y las 37 de ejemplo se comparan antes y después de cada bloque**, y cada diferencia se
  revisa (B7). Su línea base actual es reconstruida: ver `CORPUS_FASE_2X.md`.
- **Integración:** tras cada etapa, las tres suites del chat, `test-imports` y el build (tras B0, también `smoke-vistas`);
  al final, `verificar.sh` completo. Cifras esperadas al terminar la integración: 363 / 441 / 136 y Chromium 3854.
  Se detiene ante cualquier rojo, una cifra distinta o un archivo del repositorio que no coincida con la etapa anterior.

**Huecos conocidos de pruebas:** el recorrido de Chromium (`test-app-real.mjs`) no ejercita nada de 2.x (las aclaraciones
dobles solo se prueban pintadas, en `smoke-vistas`); el iPhone (hoja, botones, VoiceOver) no se ha probado.

## 11. Pendiente de decisión

| Asunto | Quién decide |
|---|---|
| Los dos riesgos de B0 (§4.1) | Josué; siguen abiertos |
| D2 con ejercicio (mejor marca por periodo): si entra | Josué, cuando llegue B6 |
| El resto de B6 | Josué, extra por extra |
| Lo propuesto en B3–B5 que no cubre una D (§8) | Josué, al autorizar cada bloque |
| La nueva línea base del corpus | Josué (`CORPUS_FASE_2X.md`, §5) |
| «El otro día» y «hace poco» se contestan con hoy diciendo «terminó hoy» (anterior a la recuperación; el arreglo B se rechazó) | Josué |
| Prueba en el iPhone | Josué |

## 12. Fuentes

| | Fuente | Qué aporta |
|---|---|---|
| F1 | Resumen de contexto de las 11:11 del 25/10, conversación rescatada (`rescate/original`, entrada 7) | 2.1 (A1–A9 implementados), decisiones 1–7 de la 2.2, P1–P7 |
| F2 | Análisis de Claude, 25/10 11:09 (entrada 1) | Revisión de 2.1/2.2 y propuesta de B0–B7 |
| F3 | Mensaje de Josué, 25/10 11:17: «Autorización B0 y decisiones de la Fase 2.3» | D1–D6, B0.1–B0.3, opción A, condiciones |
| F4 | Mensajes de Josué, 25/10 11:41 y 17:54: cierre de B0 y autorización de B1 | Requisitos y pruebas de B1 |
| F5 | Mensaje de Josué, 25/10 19:08: «B2 — Métricas de Fitness y Productividad» | B2 y «Completar entrenamiento» |
| F6 | Encargo del paso 2, 26/10 | Requisitos de la reconstrucción de 2.1/2.2 |
| F7 | `PASO2_TRAZABILIDAD.md` (scratchpad del paso 1) y `PROCEDENCIA_PASO15.md` | Bloque a bloque, clases de procedencia |
| F8 | Informes de los pasos 4, 5 y 13 | Correcciones del paso 4; arreglos A y B rechazados |
| F9 | Encargo del paso 17 (31/10) e `INFORME_PASO17.md` | Contrato y diseño de E2 |
| F10 | Paso 18 (cinco ramas) y decisión del paso 19 (31/10) | Pruebas de cobertura, opción 4a, riesgos abiertos |
| F11 | Decisión de Josué tras el paso 20 (31/10) | Procedencia aceptada, F5 perdido, integrar primero, rama desde `14f225c` |
