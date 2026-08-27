# CLAUDE.md — JosStyle

> Punto de entrada para cualquier sesión de Claude Code en este proyecto. **Léelo entero antes de
> escribir código.**

## Qué es esto

Una **PWA personal** ("sistema operativo personal") para **Josué**, 16 años: salud, sueño,
nutrición, calistenia, fútbol, estudios, negocio, economía, productividad, objetivos, diario,
biblioteca, relación de pareja (privada), bienestar digital, fe, calendario, estadísticas,
predicciones y logros. La IA **analiza y sugiere, nunca decide**.

**El nombre oficial y definitivo es JosStyle.** *JC Fitness*, *JC Lifestyle* y *JC STYLE* son nombres
históricos: aparecen en `CHANGELOG.md` y dentro de `especificaciones/` porque son historia y
transcripción literal, pero **no se usan en código nuevo, documentación nueva ni interfaz**.

**Estado:** `package.json` **v1.73.0**. Vite + React 18 + Tailwind + Supabase + una función
serverless en Vercel que hace de proxy a Anthropic.

**Pendiente por delante:** la **Entrega 2** (7 módulos nuevos — Estilo de Hombre, Horario Top,
Armario ✅, Fondos ✅, Buscador+IA ✅, Módulos activables ✅, Sonido y Rachas — **106 fases**; los
bloques **ME**, **BI**, **AR**, **FO**, **Rachas** y **Horario Top** están terminados, **Sonido** va
por 3/5, **Estilo de Hombre va por 7/65**, quedan 56) y el bloque **AXION** de la
Entrega 1 (≈1100 apartados, aplazado por decisión de Josué hasta terminar la Entrega 2).

⚠️ **El "106" es un rótulo, no una suma** (C-24, detectada en v1.67.0): el desglose por módulos da
**110** (EH 65 + HT 12 + FO 12 + SR 9 + ME 4 + BI 4 + AR 4). Las fases de EH van numeradas *"x/65"*
en la especificación de Josué, así que **el desglose es el que manda sobre el trabajo**; el rótulo se
conserva para no romper las referencias de los ocho documentos que lo citan. No bloquea nada.

## Decisiones cerradas de Josué (no reabrir)

Las contestó él por escrito al empezar la Entrega 2. Están desarrolladas en
`docs/06_ENTREGA2_ANALISIS.md` §7 como **D2-01 … D2-08**. En corto:

| | Decisión |
|---|---|
| **D2-01** | **Sonido y Rachas son DOS módulos independientes.** No mezclar sus especificaciones ni su numeración. |
| **D2-02** | **La regla de "no sobregamificar" NO se deroga.** Nada de puntos, niveles ni monedas en Bienestar. XP y niveles solo dentro de Sonido/Rachas, sin salir de ahí. |
| **D2-03** | **Amazon: arquitectura sí, afiliación no.** Ni catálogo, ni productos, ni API, ni cuenta de afiliados inventados. |
| **D2-04** | **Contenido educativo: estructura ahora, contenido después.** Ninguna fase se bloquea por falta de artículos. |
| **D2-05** | **Orden confirmado**, con Estilo de Hombre al final. |
| **D2-06** | **AXION se aplaza** y no bloquea las 106 fases. |
| **D2-07** | **Inicio, Buscador y Módulos son un solo sistema.** Prohibido crear una cuarta lista de "qué se ve en Inicio". |
| **D2-08** | **El proyecto se llama JosStyle.** |

⚠️ **Regla 49 (nueva, de Josué):** *"Si encuentras cualquier otra contradicción entre las 100
prompts, no la resuelvas por tu cuenta: detente y pregúntamela antes de implementar esa parte."*
Detiene **la fase afectada, no la sesión**: se anota en `docs/03` como ⏸ PENDIENTE DE JOSUÉ, se sigue
con lo que no dependa de ella y se le pregunta al cerrar el turno. No aplica a las contradicciones ya
listadas con decisión tomada.

## Documentación: qué leer y en qué orden

| Necesitas... | Lee |
|---|---|
| Entender el proyecto entero | **`docs/01_ESPECIFICACION_MAESTRA.md`** |
| Saber qué construir a continuación | **`docs/02_ORDEN_DE_FASES.md`** |
| Evitar romper algo o repetir un debate ya cerrado | **`docs/03_CONTRADICCIONES_DUPLICADOS_DEPENDENCIAS.md`** |
| Saber qué archivo tocar | **`docs/04_INVENTARIO_ESTADO_ACTUAL.md`** |
| Comprobar que no falta nada | **`docs/05_CHECKLIST_GLOBAL.md`** |
| Trabajar en la **Entrega 2** (7 módulos nuevos, 106 fases) | **`docs/06_ENTREGA2_ANALISIS.md`** y **`docs/07_CHECKLIST_ENTREGA2.md`** |
| La especificación literal de la Entrega 2 | `especificaciones/` 🔒 **intocable** |
| El contexto histórico turno a turno | `CHANGELOG.md` |
| El documento que Josué pasa entre conversaciones | `HANDOFF.md` ⚠️ *sus secciones numeradas están desactualizadas — ver C-20* |
| La especificación literal de Ajustes | `ESPECIFICACION_AJUSTES_ENTREGA1.md` 🔒 **intocable** |

`docs/00_INDICE.md` es el índice completo de la carpeta.

## Las 12 reglas que más se rompen

1. **Una fase por turno.** Nunca construir varias a la vez, ni adelantar la siguiente.
2. **`COLORS` es un singleton mutable.** Nunca `const { x } = COLORS`. Nunca un segundo sistema de
   tokens. Nunca un hex suelto fuera de `tokens.js`.
3. **Todo overlay `fixed inset-0` va con `createPortal(..., document.body)`.** Si no, se ancla al
   contenedor de `.module-enter` y aparece "abajo del todo" (bug real ya corregido).
4. **En `App.jsx`, todos los `useEffect` y `aplicarTema()` van ANTES de los `return` condicionales.**
   Ya se produjo el error "Rendered more hooks than during the previous render".
5. **`saveData` sobrescribe, no fusiona.** Guardar `ajustes` exige mandar el paquete completo.
   **`loadData` no fusiona con el default:** todo campo nuevo se carga con
   `{ ...DEFAULT_X, ...guardado }`.
6. **Relación nunca sale de su sitio:** `PinGate` sobre el módulo entero, fuera del export, fuera de
   `currentState`, y en el Calendario solo si está desbloqueada en la sesión.
7. **La IA nunca se dispara sola.** Siempre a un toque explícito. Nunca añade objetivos. Nunca
   objetivos calóricos o de peso estrictos. `AVISO_DOCTRINAL` obligatorio en los paneles de Fe.
8. **Nunca simular una función que no existe.** Nada de controles decorativos, cifras inventadas ni
   "próximamente". Si algo no es posible, se dice con una frase corta en la propia interfaz.
9. **Nunca dejar notas internas de desarrollo** ("Fase X", "apartados X-X", "queda pendiente") en
   pantallas que ve Josué.
10. **Exactamente 5 pestañas** en la barra inferior. Un módulo nuevo entra en un área existente.
11. **Nunca duplicar el dato de otro módulo en el Calendario** — siempre derivado y de solo lectura.
    Nunca materializar ocurrencias de un evento recurrente.
12. **Josué despliega vía Vercel, no Replit.** Las menciones a Replit en `CHANGELOG.md` son historia
    obsoleta: no investigarlas ni reabrirlas.

La lista completa (49 reglas) está en `docs/01_ESPECIFICACION_MAESTRA.md` §11.

## Contexto operativo de Josué

- **No tiene ordenador**: todo desde el iPhone. Comandos simples, uno a la vez.
- **Despliega vía Vercel.** El detalle exacto de cómo sube el código desde el iPhone **no se conoce**
  — preguntárselo si hace falta para depurar un despliegue, no asumirlo.
- **Rota entre varias cuentas de Claude**, pasando `HANDOFF.md` + zip. Puede haber resuelto en otra
  conversación algo que aquí parece pendiente.
- ⚠️ **UNA FASE POR TURNO, y se para.** Josué cambió el modo de trabajo: él pasa la fase, se
  construye entera y verificada, se le avisa con `PushNotification` y **se espera**. No encadenar
  fases ni adelantar la siguiente aunque parezca obvia cuál es. (Antes pedía lo contrario; ya no.)
- **Al terminar, decirle siempre dos cosas:** qué se ha hecho y hasta dónde se ha llegado.
- **Lo que más le importa es recibir la entrega actualizada cuanto antes.** Priorizarlo sobre
  explicaciones largas; nunca dejar un turno a medias sin entregarla.

## Verificación: qué está probado y qué no

**Ejecuta `bash scripts/verificar.sh` antes de dar por terminada cualquier fase.** Desde v1.23.0 el
entorno tiene acceso a npm otra vez, así que el proyecto **compila y se prueba de verdad**: build de
Vite, 3809 pruebas unitarias con Node, 5 de auditoría, 448 casos de renderizado real con
`react-dom/server` y 10 reglas invariantes — **4262 comprobaciones**.

Eso ya ha encontrado **cincuenta y dos bugs reales** que la revisión a mano no vio, entre ellos una
notificación falsa (`null < 7` es `true` en JavaScript), nueve módulos que dejaban crear y no borrar,
dos fechas en UTC que en España devolvían el día equivocado (`todayISO`, `addDays`) y una
comparación contra `undefined` que anulaba entera la penalización por prendas no disponibles.

⚠️ **Lo que las pruebas NO cubren, y sigue pendiente de que lo mire Josué (R1):** Supabase real, la
sincronización entre dispositivos, los permisos del navegador, el aspecto en un iPhone y el
recorrido completo tocando la pantalla. Para todo eso, cuando reporte un fallo, **pedirle el mensaje
de error exacto** antes de asumir nada.

⚠️ Lo anterior a v1.22.0 sigue siendo **código revisado a mano, nunca ejecutado**.

## Al terminar una fase

1. Marcar casillas en `docs/05_CHECKLIST_GLOBAL.md`.
2. Mover el bloque en `docs/02_ORDEN_DE_FASES.md`.
3. Actualizar `docs/04_INVENTARIO_ESTADO_ACTUAL.md`.
4. Añadir la entrada a `CHANGELOG.md` y actualizar `HANDOFF.md` — **nunca generarlos de cero**.
5. Subir la versión menor en `package.json`.
6. Verificar con `esbuild` si el entorno lo permite; si no, decirlo con honestidad.

## Lo primero que conviene hacer

**🔒 Horario Top está CERRADO (12/12)**, **Sonido va por 3/5** (F1, F3 y F4) y **Estilo de Hombre va
por 7/65** (v1.73.0). **Lo que queda de Sonido depende de los archivos de audio**: F2 es la
biblioteca y F5 la integración, que la necesita.

La siguiente candidata es **EH · Fase 8/65 — Pelo: rutina, cuidados y seguimiento**.
Ver `docs/07_CHECKLIST_ENTREGA2.md` y `especificaciones/`.

⚠️ **No empezarla sin que Josué pase la fase.**

⚠️ **EH F1-F7 dejaron quince cosas que las 58 fases siguientes tienen que respetar:**
- **Añadir un módulo es añadir una línea a `MODULOS_EH`.** Categoría, confirmación, recomendación y
  sinónimos de búsqueda van EN ESA LÍNEA. Si una fase futura necesita un `case`, un `if` o un
  registro aparte para su apartado, ha roto el apartado 9 de F1 y el 15 de F2, y hay una prueba que
  lee el código y lo comprueba.
- **`alternarModulo` no toca `config`.** Apagar no borra (F1, apartado 7). Nunca "limpiar por orden".
- **`FUENTES_GLOBALES` / `esDatoGlobal()` son el apartado 10 en código.** Antes de guardar un peso,
  una altura, horas de sueño, agua o un entrenamiento dentro de Estilo de Hombre: **ya existe en
  otro módulo**, y hay una función que lo dice.
- ⚠️ **Un módulo retirado del catálogo va a `retirados`, no a la basura** (F2, apartado 17). Era un
  fallo real de F1: con la regla 5 el siguiente guardado se llevaba su `config`. Es la **cuarta vez**
  que el mismo fallo de normalizador aparece en este proyecto.
- ⚠️ **`gestionModulos.js` no redefine nada de `estiloDeHombre.js`.** Decide qué hay que llamar;
  escribir sigue siendo de F1. Mismo reparto que `avisosHorario.js` / `notificaciones.js`.
- ⚠️ **El asistente guarda por dónde va, NO lo que sabe** (F3, apartado 7). Nada de Josué —peso,
  altura, nombre, objetivos— se copia dentro de `estiloHombre`: se lee de su módulo. Hay cuatro
  pruebas que buscan esos valores en lo guardado y fallan si aparecen.
- ⚠️ **`asistente` es el quinto campo nuevo y el primero que no se olvidó el normalizador.** Al
  añadir un campo a una entidad, añadirlo también a su normalizador — o el siguiente guardado se lo
  lleva (regla 5). Van seis (`datos`, de F4, es el sexto).
- ⚠️ **`leerDato()` es la ÚNICA forma de pedir un dato** (F4), y da la misma respuesta venga de Salud
  o de aquí dentro. Un módulo que lea `perfil.peso` por su cuenta se está saltando el apartado 3.
- ⚠️ **`guardarDato()` se niega a escribir un dato global**, con el sitio donde sí se edita. Nunca
  darle un camino alternativo: *"no puede existir Perfil → 72 kg, Estilo de hombre → 70 kg"*.
- ⚠️ **`armarioEnEstiloHombre.js` NO ESCRIBE en el armario** (F5, apartado 7), y hay una prueba que
  lee su código fuente y falla si aparece `crearPrenda(`, `crearOutfit(` o una llamada a la IA. Una
  fase futura que necesite escribir lo hace desde el Armario, no desde aquí.
- ⚠️ **`tallaDe()` es la ÚNICA respuesta a "qué talla gasta"** (F5, Test 8). Se deriva de las
  prendas; lo guardado rellena huecos; el choque se enseña. Un módulo que lea `prenda.talla` por su
  cuenta para deducirlo está creando el segundo perfil.
- ⚠️ **El perfil de estilo NO tiene almacén propio** (F6): sus once campos son once líneas del
  registro de F4. Antes de añadir una preferencia, mirar si ya está — `estilosFavoritos` y
  `coloresFavoritos` los creó F5.
- ⚠️ **`NIVELES_ESTILO` (🟢🟡🔴) nace en F6 y lo usarán las fases 18 y 22.** Importarlo, no
  reescribirlo. Y una prueba que busque una palabra en el código **tiene que quitar los comentarios
  antes**: "conseguir" contiene "seguir".
- ⚠️ **Todo cuestionario de perfil usa `cuestionarios.js`** (F7). Skincare, Cuerpo, Barba, Manos y
  Perfumes traen **su array de preguntas**, no su motor. Y el motor decide dónde va cada respuesta:
  al registro de F4 si es compartida, a la `config` del módulo si no.
- ⚠️ **"No lo sé" es una respuesta y es exclusiva** (F7). Cuenta como contestada, abre la puerta al
  contenido educativo, y no convive con una respuesta de verdad. Por defecto toda pregunta la admite.
  Y **nunca se diagnostica**: se pregunta qué quiere cuidar, no qué le falla.

⏸ **SO · Fase 2 (biblioteca de sonidos) está bloqueada, y por un motivo real:** no hay ni un archivo
de audio en el proyecto. Josué escribió en la especificación que los daría *"cuando la web ya tenga
todos los botones activos"*, y F2 es literalmente la fase que los necesita. El motor de F1 está
entero y funciona; lo único que falta son los sonidos.

Seis cosas que conviene tener presentes al retomar:

- **D2-01: Sonido y Rachas son DOS módulos independientes** (5 fases + 4). Rachas está cerrado 4/4;
  Sonido va por 3/5 (F1, F3 y F4), y **F3 y F4 se adelantaron a F2 a propósito** porque no
  necesitan los archivos. Lo que queda (F2 y F5) sí.
- ⚠️ **`especificacionSonidos.js` DEFINE la biblioteca, no la crea** (SO F4). `queFalta()` dice
  exactamente qué archivos tiene que dar Josué y por dónde empezar.
- ⚠️ **`audioEventos.js` NO redefine el catálogo de SO F1: lo traduce** (SO F3). Y los eventos que
  nadie emite —XP, niveles, recompensas— llevan escrito por qué, con prueba.
- **D2-02 sigue en pie: no sobregamificar.** XP y niveles solo dentro de Sonido/Rachas.
- **El motor de rachas no guarda ni un contador** (`src/lib/rachas.js`, RA F1). Todo se deriva del
  historial. Si una fase futura pide "guardar la racha", hay que releer el apartado 24.
- **`src/lib/rachasServicio.js` es el ÚNICO sitio que escribe rachas** (RA F2), y
  **`src/lib/audioEngine.js` el ÚNICO que toca el audio** (SO F1, con regla invariante que lo
  comprueba). Ninguna pantalla toca Supabase ni reproduce sonido por su cuenta.
- **El horario es una REGLA, no una lista de eventos** (HT F1), **no tiene tablas propias en
  Supabase** (HT F2, apartado 51) y **sus asignaturas son las de Estudios** (apartado 25).
- ⚠️ **`ALCANCES` no tiene valor por defecto** (HT F3, apartados 52-53): editar un bloque sin decir
  si el cambio es de un día o de todos **no escribe nada**. Nunca ponerle un defecto: cambiar la
  hora "porque hoy hubo un cambio" se cargaría todos los lunes del curso, y sin avisar.
- ⚠️ **Un normalizador que no conoce un campo lo BORRA en el siguiente guardado.** Pasó en HT F2 con
  `visible` de las columnas **y otra vez en HT F4** con `archivado` (archivar un horario funcionaba
  hasta recargar). Al añadir un campo a una entidad, añadirlo también a su normalizador.
- ⚠️ **Nada se mueve en silencio** (HT F4, apartado 30). Toda operación de estructura que pueda dejar
  clases fuera de sitio tiene su `impacto*()`, que se enseña **antes** de escribir. Si una fase
  futura añade otra, tiene que traer la suya.
- **Las semanas A/B se CALCULAN desde una fecha ancla** (HT F4), igual que las rachas. Si algo pide
  guardar "esta semana es la B", es un contador y miente.
- **El zoom y la densidad del horario van a `localStorage`, no a Supabase** (HT F4, apartado 59): el
  iPhone y el ordenador no tienen la misma pantalla.
- ⚠️ **Los bloques multifila y multicolumna siguen sin pintarse** (apartados 15-18 de HT F4). El
  modelo ya los permite —un bloque guarda sus horas, no una fila—, así que uno de 8:00 a 10:00 ya
  ocupa dos franjas en los datos: falta **pintarlo estirado**, y eso es trabajo de cuadrícula.
- ⚠️ **Las notas privadas de una actividad NO viajan en el contexto de la IA** (HT F5, apartados 52
  y 73), y hay una prueba que falla si aparecen. Si una fase futura amplía `contextoActividadIA`,
  releer esa prueba antes.
- **Nada de la actividad que se pueda derivar se guarda** (HT F5): usos, tiempo semanal, recientes,
  más usadas y carga por día salen de los bloques. Lo único guardado es "favorita", que la pone él.
- ⚠️ **`horarioTop.js` es la ÚNICA puerta al módulo desde fuera** (HT F12). Y su auditoría está
  atada al código: borrar una función del horario hace fallar `test-horario-top.mjs`.
- ⚠️ **La exportación NO se lleva el histórico de uso** (HT F12): lo confirmado, los avisos dados y
  la mochila de cada día son de este curso. Importar es idempotente por id.
- ⚠️ **La analítica no tiene caja negra** (HT F11): toda cifra lleva su origen, y hay una prueba que
  recorre TODOS los textos generados buscando reproches. Si una fase futura añade texto, releerla.
- ⚠️ **`avisosHorario.js` DECIDE, `notificaciones.js` MANDA** (HT F10). Nunca añadir un segundo
  emisor: el interruptor global, las categorías y el horario de descanso son de la Fase A4.
- ⚠️ **`aplicarPlan` sin `confirmado` no hace nada** (HT F9): es la regla 7 en código, no una
  comprobación defensiva. Nunca darle un valor por defecto.
- ⚠️ **`contextoParaIA` nunca lleva notas privadas ni nada de Relación** (HT F9), con pruebas. Si
  una fase futura amplía lo que se manda, releerlas antes.
- ⚠️ **PASADA no es COMPLETADA** (HT F8): lo primero se calcula del reloj, lo segundo lo confirma
  Josué y es lo único que se guarda. Nunca guardar un estado temporal: miente en un minuto.
- ⚠️ **La excepción gana a la regla** (HT F8, apartado 45), y **nada importante se ejecuta sin
  confirmar** — ni dentro de un "hacerlo todo".
- ⚠️ **La mochila es DERIVADA** (HT F7) y lo añadido a mano lleva `manual: true` por escrito: es lo
  único que impide que el recálculo lo borre (apartado 57). Nunca quitar ese campo.
- ⚠️ **`src/lib/hoy.js` NO GUARDA NADA** (HT F6, apartado 102): es una función de lectura sobre las
  entidades originales. Si una fase futura quiere "guardar lo de hoy", es una copia y va a mentir.
- ⚠️ **Antes de construir algo de HOY, mirar si ya existe.** El 90 % de HT F6 fue no duplicar:
  `eventosDerivados`, `lineaDelDia`, `huecosDelDia` y `puntuacion.js` ya estaban.
- ⚠️ **Las tareas NO se enlazan con una asignatura**: Productividad no tiene ese campo, así que se
  buscan por mención y la pantalla lo dice. Si algún día se le añade `asignaturaId` a las tareas,
  `tareasQueMencionan` deja de hacer falta.

⚠️ **Recordatorio para Josué:** faltan por ejecutar en el SQL Editor de Supabase **dos** bloques
de `supabase/schema.sql` — el del bucket `armario` (AR F1) y el del bucket `fondos` (FO F2). Sin
ellos todo funciona menos subir fotos de prenda y fotos de fondo.

El bloque **R0** ya está completo (v1.23.0) y **C-11** —el modelo de IA obsoleto— está resuelto:
`api/ask-ai.js` lee `ANTHROPIC_MODEL` y por defecto usa un modelo vigente.
