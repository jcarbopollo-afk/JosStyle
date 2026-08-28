# JosStyle — CHECKLIST GLOBAL · ENTREGA 2 (7 MÓDULOS NUEVOS, 106 FASES)

> **Qué es esto.** El desglose verificable de la segunda tanda de especificaciones que Josué ha
> entregado: un único documento de **953 KB / 50 016 líneas** que contiene **siete
> especificaciones de módulo independientes**, con **106 fases** en total.
>
> **Estado: 53 de las 106 fases construidas y verificadas** — ME 4/4, BI 4/4, **AR 4/4 (cerrado)**,
> **FO 12/12 (cerrado)**, **RA 4/4 (cerrado)**, **🔒 HT 12/12 (CERRADO)**, **SO 3/5** y **EH 10/65**
> (hasta v1.76.0). Quedan **53**: SO (2, con **F2 bloqueada** por los archivos de audio) y EH (51). Cada fase completada lleva su marca `✅ COMPLETADA (vX.Y.0)` en su
> encabezado, y ninguna casilla se marca sin estar implementada, comprobada y sin romper nada.
>
> ⚠️ **El número "106" no cuadra con el desglose por módulos, y no lo he tocado por mi cuenta.**
> Sumando la tabla de más abajo salen **110** (EH 65 + HT 12 + FO 12 + SR 9 + ME 4 + BI 4 + AR 4).
> El 106 viene de `docs/06`; las fases de EH están numeradas *"x/65"* dentro de la propia
> especificación de Josué, así que el desglose es el que manda sobre el trabajo real. Se conserva el
> rótulo "106" para no romper las referencias de los demás documentos. Ver **C-24** en `docs/03`.
>
> **Fuente:** `especificaciones/` — transcripción íntegra, dividida por módulo, más el archivo
> original sin tocar en `especificaciones/ORIGINAL_JC_FITNESS_ESTILO_DE_HOMBRE.txt`.
>
> **Leyenda:** `[ ]` pendiente · `[x]` construido y verificado en código · `[~]` parcial ·
> `[-]` descartado o imposible · `[?]` construido sin verificar en ejecución real.

---

## Cómo leer esta checklist

Cada casilla corresponde a un **apartado numerado** de la especificación original. Las casillas se
han extraído automáticamente del texto y **conservan su redacción literal**, así que algunas son
títulos de bloque ("PRUEBAS OBLIGATORIAS") y otras son requisitos concretos ("Desactivar un módulo
NO elimine sus datos"). Ambas cosas son verificables.

⚠️ **Una casilla marcada no significa "he leído el apartado", significa "está implementado,
comprobado y no rompe nada anterior".** Antes de marcar cualquier casilla hay que **leer la fase
completa en `especificaciones/`** — la checklist es el índice, no la especificación.

---

## Los 7 módulos, de un vistazo

| Cód. | Módulo | Fases | Líneas | Especificación | Naturaleza |
|---|---|---|---|---|---|
| **EH** | **Estilo de Hombre** | 65 | 19 527 | `ESPECIFICACION_ESTILO_DE_HOMBRE.md` | Módulo nuevo enorme: central de salud, cuidado, bienestar y estilo masculino |
| **FO** | **Fondos y Fotografías** (Aspecto) | 12 | 5 967 | `ESPECIFICACION_FONDOS_Y_FOTOGRAFIAS.md` | Amplía el sistema de apariencia existente con fondos fotográficos y color derivado de la foto |
| **BI** | **Buscador global + IA + Inicio** | 4 | 1 668 | `ESPECIFICACION_BUSCADOR_E_IA.md` | Rediseña el desplegable de Inicio y convierte el botón superior izquierdo en buscador + IA |
| **ME** | **Módulos activables + Eliminados** | 4 | 1 008 | `ESPECIFICACION_MODULOS_Y_ELIMINADOS.md` | Libertad total de apartados + papelera universal con recuperación |
| **HT** | **Horario Top** | 12 | 11 601 | `ESPECIFICACION_HORARIO_TOP.md` | Motor temporal y de planificación: horario, HOY, mochila, planificador, analítica |
| **AR** | **Armario JC Lifestyle** | 4 | 3 747 | `ESPECIFICACION_ARMARIO.md` | Armario digital, outfits, historial de uso y sistema anti-repetición |
| **SR** | **Sonido y Rachas** | 5 + 4 | 6 498 | `ESPECIFICACION_SONIDO_Y_RACHAS.md` | Identidad sonora propia + sistema de rachas reutilizable |

**Total: 106 fases · 3 761 casillas verificables.**

---

## ⚠️ Cinco avisos antes de empezar a implementar

### 1. Esto no es una continuación del Prompt Maestro — es un proyecto varias veces mayor

Para dimensionarlo con honestidad: el Prompt Maestro completo (las 21 fases que construyeron
Dashboard, Sueño, Salud, Nutrición, Calistenia, Estudios, Negocio, Productividad, Objetivos, Diario,
Biblioteca, Relación, Fe, Bienestar, Estadísticas, Predicciones, IA y Personalización) cabía en
**~40 líneas de especificación**. Estas 106 fases ocupan **50 016**.

**Estilo de Hombre por sí solo (65 fases) es más grande que todo JC Fitness construido hasta hoy.**
No es una crítica a la ambición del proyecto — es el dato que hace falta para planificar. Ver
`docs/06_ENTREGA2_ANALISIS.md` para el análisis de viabilidad.

### 2. El documento original está en orden inverso y mezcla conversación con especificación

Dentro de cada módulo, **la última fase aparece primero** (Estilo de Hombre empieza por la Fase
65/65 y termina por la 1/65). Además hay fragmentos de conversación de Josué intercalados entre
fases, y algunas fases aparecen duplicadas o parcialmente repetidas.

Esta checklist ya está **reordenada ascendentemente** (Fase 1 → Fase N). La especificación original
se conserva tal cual, sin reordenar, porque reordenarla sería editarla.

### 3. El bloque SR mezcla DOS especificaciones con numeración solapada

`ESPECIFICACION_SONIDO_Y_RACHAS.md` contiene en realidad **dos sistemas distintos**:

- **Sistema de Sonido** — 5 fases (Base · Motor de sonido · Eventos/feedback/recompensas · Diseño de
  los sonidos · Producción/integración/test).
- **Sistema de Rachas** — 4 fases (Arquitectura y lógica · Base de datos/Supabase/seguridad ·
  Gamificación/hitos/logros · UI/Centro de rachas).

Sus números de fase **colisionan** ("Fase 2" existe en los dos), y en el documento original están
intercalados. La checklist los ha fusionado bajo el código `SR` porque no hay forma automática de
separarlos con certeza.

> **❓ Pregunta abierta para Josué:** ¿son dos módulos independientes que quieres construir por
> separado, o un único sistema "Sonido + Rachas" de 5 fases? **Antes de tocar este bloque hay que
> aclararlo** — construirlos mezclados sería un error caro de deshacer.

### 4. Hay solapamiento fuerte con lo que JC Fitness YA tiene

La propia especificación de Estilo de Hombre insiste en ello (sus apartados 4 y 5 son literalmente
*"JC Fitness ya tiene muchas funciones"* y *"regla absoluta contra duplicaciones"*). Los solapamientos
detectados están catalogados en `docs/06_ENTREGA2_ANALISIS.md`, pero los cuatro más grandes son:

| Especificación nueva | Ya existe en JC Fitness |
|---|---|
| **ME** · módulos activables + personalización | `PersonalizationView` + `personalizacion.ocultos` (Fase 19) |
| **BI** · buscador global + IA | `UniversalSearchModal` + `SuggestionsButton` (Fase 18) |
| **FO** · sistema de color derivado de foto | Motor de color completo `colorEngine.js` + `TemaBuilder` + `GestionTemas` (V1–V4) |
| **HT** · calendario, HOY, tareas, exámenes | Calendario Universal (C1–C3) + Productividad + Estudios + Dashboard Centro de Control |

🔒 **La regla es CONECTAR / INTEGRAR / REUTILIZAR antes que CREAR.** Está escrita por Josué en la
propia especificación. Implementar estos módulos ignorando lo que ya existe crearía sistemas
duplicados que después habría que fusionar.

### 5. Nada de lo construido hasta hoy está verificado en ejecución real

Las Fases 8–21 del Prompt Maestro y **todo** lo posterior (v1.1.0 → v1.22.0) siguen sin haberse
ejecutado nunca en un navegador. Añadir 106 fases encima de una base sin verificar multiplica el
riesgo: cuando algo falle, no se sabrá si el fallo es de lo nuevo o de lo que ya había.

> **Recomendación:** ejecutar el bloque **R0** (correcciones críticas) y al menos parte de **R1**
> (verificación real) de `docs/02_ORDEN_DE_FASES.md` **antes** de empezar la Entrega 2.

---

## Orden de ejecución propuesto para la Entrega 2

Este orden **no** es el orden en que aparecen en el documento. Está ordenado por **dependencia
técnica** y por **cuánto desbloquea cada módulo**:

```
E2-0  R0 + R1 de la Entrega 1        ← arreglar lo roto y verificar la base ANTES de añadir
E2-1  ME · Módulos activables + Eliminados (4)    ← la infraestructura que EH da por supuesta
E2-2  BI · Buscador + IA + Inicio (4)             ← amplía lo que ya existe, no lo duplica
E2-3  AR · Armario (4)                            ← EH lo da por construido ("NO rehacer el armario")
E2-4  FO · Fondos y Fotografías (12)              ← se apoya en el motor de color ya existente
E2-5  SR · Sonido y Rachas (5+4)   ⚠️ aclarar primero si son uno o dos módulos
E2-6  HT · Horario Top (12)                       ← el más acoplado al Calendario existente
E2-7  EH · Estilo de Hombre (65)                  ← el mayor; depende de casi todos los anteriores
```

**Por qué EH va el último aunque sea el que Josué entregó primero:** su propia especificación
declara que depende del armario ya construido (ap. 16), del sistema de fotos existente (ap. 17), del
calendario y recordatorios globales (ap. 11), del sistema de módulos activables (ap. 2) y del sistema
de productos transversal (ap. 10). Construirlo antes que sus dependencias obligaría a rehacerlo.

---

## Reglas transversales que TODAS estas fases comparten

Extraídas de los cuatro documentos de contexto general. Son de Josué, no interpretaciones:

1. **Una fase por turno.** No avanzar hasta que la anterior esté implementada, comprobada y
   funcionando. *(Se repite literalmente en los 4 contextos generales.)*
2. **Comprobar primero si JC Fitness ya lo tiene.** CONECTAR → INTEGRAR → REUTILIZAR → CREAR, en ese
   orden. Nunca duplicar por comodidad de implementación.
3. **Todo es modular y opcional.** El usuario decide qué usa. **Desactivar un módulo NUNCA elimina
   sus datos.**
4. **Interfaz limpia por fuera, compleja por dentro.** Plaquitas pequeñas en la pantalla principal;
   la complejidad vive dentro de cada módulo.
5. **La IA queda prácticamente fuera de Estilo de Hombre.** Las recomendaciones salen de datos,
   formularios, preferencias y reglas integradas — no de preguntarle a un modelo cada vez.
   *(En HT y BI la IA sí participa, pero siempre sobre datos reales y sin inventar.)*
6. **El usuario tiene el control.** Recomendar, nunca obligar. Poder elegir, rechazar, cambiar,
   ocultar, activar, desactivar.
7. **No preguntar dos veces lo mismo.** Lo que el usuario ya ha dicho se guarda y se reutiliza.
8. **Sistemas transversales únicos**: un solo sistema de productos, un solo calendario, un solo
   sistema de recordatorios, un solo sistema de fotos. Nunca uno por módulo.
9. **Nada de diagnósticos médicos automáticos.** Cuando algo requiera atención profesional, decirlo
   claramente.
10. **Funciones dependientes de wearables solo aparecen si hay dispositivo conectado.** Nunca datos
    inventados ni campos para simularlos.
11. **Móvil primero**, diseño premium, rápido y coherente con lo existente.
12. **No romper nada.** Cada fase deja el proyecto funcionando y preparado para la siguiente.
13. **No implementar fases futuras** aunque aparezcan mencionadas en el contexto general.
14. **Si una funcionalidad necesita arquitectura adicional, se construye esa arquitectura** — no se
    simplifica por comodidad *(regla explícita de HT)*.

---

## Peticiones sueltas detectadas fuera de las 106 fases

Al final del contexto de Estilo de Hombre hay una petición de Josué **que no está formalizada como
fase** y que conviene no perder:

- ⬜ **Rediseño de la pantalla de Inicio.** Literal: *"la veo muy cargada… quiero que la pantalla de
  inicio se pueda tocar un montón, poner la acción que quiera —por ejemplo un ingreso, un gasto, una
  fecha importante— y que se pueda quitar… que cada uno se ajuste la experiencia como la quiera"*.
  Marcado en el propio documento como **"ESTÀ EN CHAT Y ES REDISEÑAR PANTALLA DE INICIO"**.
  → Se solapa fuertemente con **BI · Fase 1** y con **ME · Fase 2**, y con el editor de
  `dashboardOcultos` ya pendiente (**R3.1** de la Entrega 1). **Unificar las cuatro cosas en una
  sola conversación antes de construir.**

---

# LAS 106 FASES


## EH · ESTILO DE HOMBRE — 65 fases

El módulo más grande de todo el proyecto. Una central personal de salud, cuidado, bienestar, físico y estilo masculino, completamente modular: el usuario elige qué apartados usa y el resto no ocupa espacio. **Fases 1–6** son la arquitectura base; **7–29** los módulos de contenido (pelo, peluquería, skincare, cuerpo, barba, manos, higiene bucal, perfumes, accesorios, gustos, objetivos, perfil de estilo); **30–39** organización, recomendaciones e integración; **40–55** calidad, rendimiento, datos y producción; **56–61** IA e insights; **62–65** accesibilidad, seguridad y cierre.

#### EH · Fase 1/65 — ARQUITECTURA BASE Y SISTEMA MODULAR ✅ COMPLETADA (v1.67.0)

> **`src/lib/estiloDeHombre.js`** (motor, 69 comprobaciones) + **`src/views/EstiloHombreView.jsx`**
> (pantalla) + `scripts/test-estilo-hombre.mjs`. Los datos viven en `app_data` bajo la clave
> `estiloHombre`; **no hay SQL nuevo**.
>
> **Añadir un módulo es añadir una línea a `MODULOS_EH`.** Eso es el apartado 9 —*"la arquitectura
> permita añadir decenas de módulos posteriormente sin rehacer este sistema"*— y es la única razón
> por la que este archivo existe antes que ninguna pantalla de contenido.
>
> ⚠️ **`normalizarEstiloHombre` aguanta el catálogo cambiando en las dos direcciones:** un módulo
> guardado que ya no está en el catálogo se descarta, y un módulo nuevo del catálogo aparece
> **apagado**. Si apareciera encendido, cada fase futura le encendería un apartado a Josué sin
> preguntarle.
>
> ⚠️ **`alternarModulo` no toca `config` jamás** (apartado 7: *"desactivar un módulo NO elimine sus
> datos"*). Es la trampa clásica del normalizador al revés: aquí el peligro no es olvidar un campo,
> es limpiarlo "por orden".
>
> ⚠️ **`FUENTES_GLOBALES` + `esDatoGlobal()` son el apartado 10 en código** (*"Estilo de hombre NO
> debe crear una copia de los datos globales"*): declaran dónde vive ya cada dato —peso, altura,
> sueño, agua, entrenamiento— para que una fase futura que pida "guardar el peso aquí" choque con
> una función, no con la buena memoria de quien lea el documento.
>
> **Las plaquitas dicen la verdad** (regla 8 + apartado 14): ningún apartado tiene contenido
> todavía, así que **no llevan a ninguna parte y la pantalla lo escribe**, en vez de abrir trece
> pantallas vacías.

- [x] Se pueda entrar en Estilo de hombre.
- [x] Aparezca una pantalla inicial limpia.
- [x] Se pueda configurar qué módulos quiere utilizar el usuario.
- [x] Los módulos seleccionados aparezcan como plaquitas.
- [x] Los módulos no seleccionados no ocupen espacio.
- [x] Se puedan activar/desactivar posteriormente.
- [x] Desactivar un módulo NO elimine sus datos.
- [x] La configuración permanezca guardada.
- [x] La arquitectura permita añadir decenas de módulos posteriormente sin rehacer este sistema.
- [x] CREAR LA ESTRUCTURA PRINCIPAL
- [x] PANTALLA PRINCIPAL
- [x] PRIMERA CONFIGURACIÓN
- [x] SELECCIÓN DE MÓDULOS
- [x] PLAQUITAS
- [x] GESTIONAR APARTADOS
- [x] DESACTIVACIÓN
- [x] DATOS Y CONFIGURACIÓN
- [x] ORDEN DE LOS MÓDULOS
- [x] Skincare
- [x] Pelo
- [x] Hábitos
- [x] Fitness
- [x] CONEXIÓN CON JC FITNESS
- [x] SISTEMA PREPARADO PARA CRECER
- [x] RESPONSIVE
- [x] ESTADOS VACÍOS
- [x] NO IMPLEMENTAR TODAVÍA
- [x] PRUEBAS OBLIGATORIAS
- [x] OBJETIVO GENERAL
- [x] PRINCIPIO FUNDAMENTAL: TODO ES MODULAR
- [x] INTERFAZ: PEQUEÑAS PLAQUITAS
- [x] JC FITNESS YA TIENE MUCHAS FUNCIONES
- [x] REGLA ABSOLUTA CONTRA DUPLICACIONES
- [x] IA: PRÁCTICAMENTE FUERA DE ESTE APARTADO
- [x] EL USUARIO TIENE EL CONTROL
- [ ] FORMULARIOS Y PREFERENCIAS
- [ ] SISTEMA DE RECOMENDACIONES
- [ ] SISTEMA DE PRODUCTOS
- [ ] CALENDARIO Y RECORDATORIOS
- [ ] EDUCACIÓN Y GUÍAS
- [ ] SALUD
- [ ] DISPOSITIVOS WEARABLES
- [x] MÓDULOS ESPECIALMENTE IMPORTANTES
- [ ] ESTILO Y ARMARIO
- [ ] FOTOS
- [ ] PRIVACIDAD
- [x] DESACTIVACIÓN DE MÓDULOS IMPORTANTES
- [x] ARQUITECTURA DE DESARROLLO
- [x] REGLA DE ORO DURANTE TODAS LAS FASES
- [ ] OBJETIVO FINAL

> **Las once casillas que siguen sin marcar son deliberadas.** Son el preámbulo de contexto de la
> especificación —describe el módulo entero, no esta fase— y el propio enunciado las mete bajo
> *"NO IMPLEMENTAR TODAVÍA"*. Formularios, recomendaciones, productos, calendario, educación, salud,
> wearables, armario, fotos y privacidad llegan en las fases 2-65; `OBJETIVO FINAL` se marca cuando
> se cierre el bloque. Marcarlas ahora sería decir que hay algo construido que no existe.

#### EH · Fase 2/65 — SISTEMA DE GESTIÓN Y PERSONALIZACIÓN DE MÓDULOS ✅ COMPLETADA (v1.68.0)

> **`src/lib/gestionModulos.js`** (157 comprobaciones) + la pantalla de gestión reescrita en
> `src/views/EstiloHombreView.jsx`. Sin SQL nuevo y **sin una segunda fuente de verdad**.
>
> ⚠️ **Esta fase arregló un fallo real de la Fase 1**, y lo avisaba la propia especificación
> (apartado 17: *"Módulo eliminado del catálogo en una futura actualización → los datos NO deben
> borrarse automáticamente"*). `normalizarEstiloHombre` descartaba el módulo entero, y con la regla 5
> del proyecto —`saveData` sobrescribe, no fusiona— **el siguiente guardado se llevaba su `config`
> para siempre**. Es la cuarta vez que este proyecto tropieza con el mismo fallo de normalizador.
> Ahora va a la cuarentena `retirados`, y si el módulo vuelve al catálogo, `restaurarRetirados` lo
> devuelve con sus datos.
>
> ⚠️ **El catálogo sigue siendo el único sitio donde vive un módulo** (apartado 15). Categoría,
> confirmación, recomendación y sinónimos de búsqueda **están en la línea del módulo**, no en un
> segundo mapa: por eso la Fase 2 pudo añadir las cuatro cosas sin tocar nada más que esas trece
> líneas, y hay una prueba que lee el código y comprueba que `gestionModulos.js` no redefine nada.
>
> ⚠️ **El aviso al desactivar solo sale si hay algo que perder.** Un cartel que dice *"tus datos no
> se eliminarán"* sobre un módulo vacío no protege nada: enseña a pulsar sin leer, y entonces no
> sirve el día que sí importa. Se declara el módulo como importante **y** se mira si tiene datos.
>
> ⚠️ **Subir y bajar se mueven dentro de los ACTIVOS**, no del catálogo: si la flecha saltara por
> encima de un módulo apagado, Josué vería una plaquita que no se mueve al pulsarla.
>
> **Los duplicados se quitan al cargar** (apartado 17), fusionando las `config` y dejando mandar a la
> última entrada, que es la intención más reciente.

- [x] ACCESO A “GESTIONAR APARTADOS”
- [x] LISTADO COMPLETO
- [x] AGRUPACIÓN
- [x] ACTIVAR UN MÓDULO
- [x] El módulo pasa a estar activo.
- [x] Aparece en la pantalla principal.
- [x] Se guarda automáticamente.
- [x] No es necesario volver a realizar la configuración inicial.
- [x] DESACTIVAR UN MÓDULO
- [x] AVISO AL DESACTIVAR
- [x] REACTIVACIÓN
- [x] FILTRO DE MÓDULOS ACTIVOS
- [x] REORDENACIÓN
- [x] ESTADO VACÍO
- [x] MÓDULOS RECOMENDADOS
- [x] BÚSQUEDA DE MÓDULOS
- [x] INFORMACIÓN DEL MÓDULO
- [x] CONFIGURACIÓN PERSISTENTE
- [x] NO CREAR BASES DE DATOS DUPLICADAS
- [x] PREPARACIÓN PARA FUTUROS MÓDULOS
- [x] CASOS LÍMITE
- [x] PRUEBAS

> **Dos de los diez tests del apartado 18 no se pueden ejecutar aquí, y está dicho en el archivo de
> pruebas en vez de darse por buenos:** el **Test E** (*"cerrar aplicación → configuración intacta"*)
> se comprueba hasta donde llega Node —el estado sobrevive al viaje por JSON y por el normalizador,
> que es lo que hacen `saveData`/`loadData`—; que Supabase responda es **R1**. El **Test J**
> (*"probar en móvil"*) necesita un iPhone: también **R1**.
>
> ⚠️ **Seis módulos que el apartado 3 nombra dentro de las categorías NO se han creado**, y cada uno
> lleva su motivo escrito en `MODULOS_DEL_ENUNCIADO_NO_CREADOS`: **Nutrición** y **Objetivos** ya son
> módulos enteros de JosStyle (copiarlos es justo lo que prohíben el apartado 10 de la Fase 1 y el 15
> de esta), **Recuperación** es contenido de Fitness (fase 26) y **Salud preventiva, dental y visual**
> son subdivisiones de Salud (fase 33) e Higiene (fase 18): partirlas hoy sería decidir por adelantado
> la forma de fases que no tocan. Las siete categorías están las siete: si una fase futura crea uno de
> esos módulos, entra **con una línea**.

#### EH · Fase 3/65 — SISTEMA DE PRIMERA CONFIGURACIÓN Y PERFIL DE USUARIO ✅ COMPLETADA (v1.69.0)

> **`src/lib/configuracionInicial.js`** (139 comprobaciones) + el asistente en
> `src/views/EstiloHombreView.jsx`. Sin SQL nuevo.
>
> ⚠️ **El asistente guarda por dónde va, NO lo que sabe.** El apartado 7 lo pide con esas palabras:
> *"No preguntar información que JC Fitness ya conoce."* Así que se guardan cinco cosas —el paso, la
> selección en curso, el estado y dos fechas— y **ni un dato de Josué**. Su peso, su altura y su
> nombre se **leen** de Perfil, Salud y Objetivos cada vez. Hay cuatro pruebas que buscan esos valores
> dentro de lo guardado y fallan si aparecen.
>
> ⚠️ **`asistente` es el quinto campo nuevo que se añade a una entidad de este proyecto, y el primero
> que NO se olvidó el normalizador.** Las cuatro veces anteriores el siguiente guardado se lo llevaba
> (regla 5). Hay una prueba que serializa, recarga y comprueba que el paso sigue ahí.
>
> ⚠️ **Un fallo real que encontró la prueba:** entrar en *"Modificar mi configuración"* y confirmar
> **sin cambiar nada** reordenaba las plaquitas, porque la selección salía en orden de catálogo y
> `terminarAsistente` reescribe el `orden` a partir de ella. Nada se mueve en silencio.
>
> ⚠️ **Y otro en el enlazado:** pulsar "Empezar" en la bienvenida pasaba el asistente a `en_curso` y
> acto seguido le enseñaba *"Lo dejaste a medias"*. Lo que el apartado 15 distingue es **volver** de
> **seguir**, y eso no está en el estado guardado: está en si ya estaba a medias al abrir la pantalla.
>
> **Omitir marca `configurado`.** Si no, la próxima vez le saldría otra vez la bienvenida — que es
> justo lo contrario de saltárselo. Y no enciende nada: entra en la pantalla vacía de F2, que ya sabe
> qué decir.
>
> **"Empezar de nuevo" reinicia el asistente, no los módulos.** Los datos de cada apartado siguen
> donde estaban: es la diferencia entre *volver a elegir* y *perderlo todo*, y el enunciado pide la
> primera.

- [x] PRIMERA ENTRADA
- [x] EXPLICACIÓN BREVE
- [x] SELECCIÓN INICIAL
- [x] CONTADOR
- [x] PODER SALTAR
- [x] NO PREGUNTAR LO QUE YA SABEMOS
- [x] FORMULARIOS PROGRESIVOS
- [x] CADA MÓDULO ES INDEPENDIENTE
- [x] INFORMACIÓN OPCIONAL
- [x] PREFERENCIAS
- [x] REUTILIZACIÓN DE INFORMACIÓN
- [x] MODIFICAR INFORMACIÓN
- [x] COMPLETAR CONFIGURACIÓN
- [x] CONFIGURACIÓN PARCIAL
- [x] VOLVER A CONFIGURAR
- [x] NO CREAR TODAVÍA LOS FORMULARIOS INTERNOS
- [x] PRUEBAS


> **Apartado 17 — aquí NO hay ni una pregunta construida.** *"Esta fase solo construye el sistema que
> las podrá alojar."* Lo que hay es, por módulo, **qué datos globales reutilizará** (`usa`) y **en qué
> fase hará sus propias preguntas** (`pregunta`): un número, no un formulario. Hay una prueba que
> comprueba que en todo `NECESIDADES_MODULO` no aparece ni un signo de interrogación.
>
> ⚠️ **El Test 10 (*"probar todo el flujo en móvil"*) necesita un iPhone: es R1**, igual que el Test J
> de la Fase 2. El archivo de pruebas lo imprime en vez de darlo por bueno.

#### EH · Fase 4/65 — SISTEMA DE DATOS, PERFIL Y REUTILIZACIÓN GLOBAL ✅ COMPLETADA (v1.70.0)

> **`src/lib/datosEstiloHombre.js`** (141 comprobaciones) + el panel **Mis datos** en
> `src/views/EstiloHombreView.jsx`. Sin SQL nuevo: `app_data` / clave `estiloHombre`, campo `datos`.
>
> ⚠️ **Una sola función lee, venga el dato de donde venga.** `leerDato()` resuelve igual el peso —que
> vive en Salud— que el tipo de piel —que vive aquí— y **devuelve exactamente la misma forma**, con
> una prueba que compara las claves de las dos respuestas. Cuando llegue la fase 13 y Skincare
> necesite los dos, no tendrá que saber cuál es cuál: si tuviera que distinguirlos, tarde o temprano
> alguien pediría el peso por el camino equivocado y acabaría habiendo dos.
>
> ⚠️ **Y su gemela: `guardarDato()` se NIEGA a escribir un dato global.** El apartado 3 lo dice con un
> ejemplo — *"No puede existir Perfil → 72 kg, Estilo de hombre → 70 kg"*— y aquí es un `error` con el
> sitio donde sí se edita, no un fallo en silencio. Hay una prueba que intenta guardar 70 y comprueba
> que el peso sigue siendo el 73 de Salud **y que no se ha creado ninguna copia**.
>
> ⚠️ **El Test 4 sale gratis porque no hay copias.** *"Modificar dato → todos los módulos compatibles
> reciben el cambio"*: Productos cambia el tipo de piel y Skincare lo ve, porque es **el mismo dato**,
> no dos que se sincronizan.
>
> **El historial es opcional y está declarado** (apartado 9): las tallas lo llevan, el tipo de piel
> no. Ponérselo a todo llenaría el guardado de ruido. Y guardar el mismo valor dos veces no crea dos
> entradas.
>
> **La antigüedad describe, no juzga** (apartado 10): *"Actualizado hace 3 meses"* —el ejemplo literal
> del enunciado, con su prueba— y hay cinco comprobaciones de que el texto nunca reprocha. Misma línea
> que la analítica del Horario (HT F11).
>
> ⚠️ **El apartado 14 pide NO ROMPER, y eso empieza por el texto.** Si a Productos le falta el tipo de
> piel, lo que sale es *"Añade tu tipo de piel para personalizar esto"* — hay cinco pruebas de que
> nunca aparecen las palabras "error", "undefined", "null", "falta" ni "no se puede".
>
> **`datos` es el sexto campo nuevo de este proyecto, y el segundo seguido que no se olvidó el
> normalizador.** Y un dato guardado de una versión anterior del registro **no se borra solo**
> (apartados 12 y 17).

- [x] CREAR UNA CAPA DE DATOS COMPARTIDOS
- [x] COMPROBAR QUÉ EXISTE YA
- [x] FUENTE ÚNICA DE VERDAD
- [x] DATOS PROPIOS DE ESTILO DE HOMBRE
- [x] PREFERENCIAS
- [x] INFORMACIÓN DESCONOCIDA
- [x] NO PREGUNTAR DOS VECES
- [x] DATOS MODIFICABLES
- [x] HISTORIAL CUANDO SEA NECESARIO
- [x] FECHA DE ACTUALIZACIÓN
- [x] CONSENTIMIENTO Y PRIVACIDAD
- [x] ELIMINACIÓN
- [x] DESACTIVAR NO ES ELIMINAR
- [x] DEPENDENCIAS
- [x] DATOS FALTANTES
- [x] SINCRONIZACIÓN
- [x] COMPATIBILIDAD FUTURA
- [x] PRUEBAS


> ⚠️ **Solo están los datos que la especificación nombra**, y ni uno inventado: tipo de piel
> (apartados 6 y 7), sensibilidad y preferencia de textura (17), tipo de pelo y preferencia de corte
> (4), productos sin perfume y ropa oversize (5) y las tallas (4). *"No crear todavía todos los campos
> específicos. Solo preparar la arquitectura."* Añadir uno es añadir una línea.
>
> ⚠️ **Ningún dato está marcado como privado hoy**, y decirlo es más honesto que fingir una protección
> que no protege nada todavía. Lo que sí existe es el filtro (`datosCompartibles`), para que la fase
> que marque el primero no tenga que construirlo — y para que nadie mande a la IA lo que no debe.
>
> ⚠️ **El Test 10 (*"sincronización → no aparecen duplicados"*) se comprueba hasta donde llega Node**:
> que el estado sobreviva al viaje por JSON sin duplicar entradas. Que dos iPhones acaben con lo mismo
> es **R1**, y el archivo de pruebas lo imprime.

#### EH · Fase 5/65 — ESTILO + ARMARIO: INTEGRACIÓN CON EL SISTEMA EXISTENTE ✅ COMPLETADA (v1.71.0)

> **`src/lib/armarioEnEstiloHombre.js`** (138 comprobaciones). Sin SQL nuevo, **y sin una sola prenda
> guardada en Estilo de Hombre**.
>
> El enunciado empieza con tres avisos seguidos —*"NO reconstruir el armario. NO duplicar sus datos.
> NO crear un segundo sistema de ropa"*— así que este archivo **solo lee**. Todo sigue en
> `armario.js` y `armarioInteligencia.js` (AR F1-F4).
>
> ⚠️ **La prueba que más importa no es ninguna de las diez del enunciado: es la que lee el código
> fuente** y falla si aquí aparece `crearPrenda(`, `crearOutfit(`, `crearUso(` o una llamada a la IA.
> El apartado 7 dice que *"una recomendación nunca debe convertirse automáticamente en una
> modificación del armario"*, y la forma de garantizarlo no es acordarse: es que **la capacidad no
> exista**.
>
> ⚠️ **Un solo perfil de tallas** (apartado 3, Test 8). El armario ya sabe qué gasta Josué —lo dice
> cada prenda— así que la talla **se deriva de ahí**, y lo guardado en la capa de la Fase 4 solo
> rellena los huecos. Si los dos existen y no coinciden, **se enseña el choque** en vez de elegir en
> silencio; y **un empate en el armario no es una respuesta**.
>
> ⚠️ **El motor de recomendación tampoco se reescribe**: `recomendarOutfits()` es de AR F4 y ya sabe
> de repetición, disponibilidad y olvido. Lo que añade esta fase es la capa de preferencias por
> encima — y **si no ha indicado colores favoritos, no se afirma que algo encaje**.
>
> ⚠️ **Un fallo real que encontró la prueba:** el puente leía `outfit.ocasiones` como si fuera una
> lista, y un outfit guarda **una** ocasión (`ocasion`). Devolvía cero ocasiones siempre, y en
> silencio. La forma que existe manda sobre la que uno supone.
>
> **Apagar el apartado no esconde el armario, lo saca de aquí** (apartado 10): la nota lo dice —*"el
> armario sigue en su sitio de siempre"*— en vez de dejar un hueco.
>
> **Y el apartado 8 no bloquea:** falta la talla de calzado, se dice *"No tenemos registrada tu talla
> de calzado"* con su *"Añadir talla"*… **y la recomendación sale igual**.

- [x] CONECTAR EL ARMARIO EXISTENTE
- [x] MANTENER LOS DATOS EXISTENTES
- [x] TALLAS
- [x] INFORMACIÓN DEL PERFIL
- [x] PREFERENCIAS DE ESTILO
- [x] RECOMENDACIONES
- [x] EL USUARIO DECIDE
- [x] INFORMACIÓN FALTANTE
- [x] ARMARIO COMO FUENTE DE INFORMACIÓN
- [x] ACTIVACIÓN/DESACTIVACIÓN
- [x] NO CREAR IA DE ESTILO
- [x] CONEXIÓN FUTURA CON PRODUCTOS
- [x] CONEXIÓN CON OCASIONES
- [x] CONEXIÓN CON EL PERFIL FÍSICO
- [x] PRUEBAS DE INTEGRACIÓN


> ⚠️ **Las preferencias que el armario ya tiene NO se declaran como dato propio** (marcas, colores y
> ocasiones): se derivan de él. Hay cinco pruebas que fallan si aparecen en el registro de la Fase 4.
> Solo se guardan las tres que no existían: estilos favoritos, colores favoritos y formalidad.
>
> ⚠️ **El puente a Productos declara el enlace y ni un producto** (apartado 12 + **D2-03** de Josué:
> arquitectura sí, afiliación no). Hay cinco pruebas que buscan "amazon", "afiliad", "precio",
> "comprar" y "http" dentro de él.
>
> ⚠️ **El Test 10 (navegación en móvil) necesita un iPhone: es R1**, y la auditoría lo declara en
> `noComprobableAqui` en vez de darlo por bueno.

#### EH · Fase 6/65 — PERFIL DE ESTILO Y PREFERENCIAS PERSONALES ✅ COMPLETADA (v1.72.0)

> **`src/lib/perfilEstilo.js`** (119 comprobaciones) + el panel **Mi estilo** en
> `src/views/EstiloHombreView.jsx`. Sin SQL nuevo **y sin almacén propio**.
>
> ⚠️ **Los once campos del perfil viven en la capa de datos de la Fase 4**, una línea cada uno en
> `REGISTRO_DATOS`. No es por ahorrar: `estilosFavoritos` y `coloresFavoritos` **ya existían** desde
> la Fase 5, y crear aquí unos paralelos habría dado dos listas que se separan con el tiempo — que es
> exactamente lo que comprueba el Test 9. El efecto secundario bueno: el panel *Mis datos* enseña el
> perfil entero sin que nadie lo enchufe.
>
> ⚠️ **Tres listas se toman prestadas y no se declaran**: los colores son `COLORES_ARMARIO`
> (apartado 4: *"no duplicar el sistema de paletas"*), las marcas salen de sus propias prendas
> (apartado 5) y las ocasiones son `OCASIONES_OUTFIT` (apartado 6). Hay pruebas que leen el código y
> fallan si aparece una lista nueva.
>
> ⚠️ **Los NIVELES (🟢🟡🔴) nacen aquí.** El apartado 10 dice *"mantener el sistema que ya
> definimos"*, pero en la especificación se definen en las fases 18 y 22, que aún no existen. Así que
> se definen una vez, aquí, y esas fases los importarán en vez de escribir los suyos.
>
> ⚠️ **Un perfil vacío es un perfil válido** (Test 7 + apartado 13). No hay barra de progreso, ni
> porcentaje, ni la palabra "incompleto": hay una prueba que lo comprueba. Y quitar el último valor
> **borra el dato** en vez de guardar `[]` y decir después "no lo has indicado".
>
> ⚠️ **Lo que refleja tu armario NO clasifica prendas** (apartado 14). Deducir el estilo de un
> pantalón es adivinar, así que la tabla va de **ocasión** —que la eligió él— a estilo, y de categoría
> a estilo **solo donde la prenda lo dice sin ambigüedad**: `pantalones` no está, y hay una prueba de
> que no está. Por debajo de cuatro prendas no se afirma nada, y cada frase dice de dónde sale.
>
> **Y el contraste describe, no corrige:** si dice "elegante" y su armario refleja "deportivo", el
> texto es *"puede ser justo lo que buscas cambiar"*. Cinco pruebas comprueban que nunca aparece
> "deberías", "error", "incorrecto", "mal" ni "no encaja".
>
> ⚠️ **Lo que le gustaría hacer NO viaja al contexto de recomendaciones** (apartado 15), con su
> motivo escrito y una prueba que lo busca.

- [x] ACCESO
- [x] PRIORIDADES
- [x] COLORES
- [x] MARCAS
- [x] OCASIONES
- [x] COSAS QUE LE GUSTAN
- [x] COSAS QUE LE GUSTARÍA HACER
- [x] IMAGEN PERSONAL
- [x] NIVELES
- [x] RECOMENDACIONES
- [x] EL USUARIO SIEMPRE PUEDE CAMBIARLO
- [x] NO OBLIGAR A COMPLETAR TODO
- [x] CONEXIÓN CON EL ARMARIO
- [x] PRIVACIDAD
- [x] PRUEBAS


> ⚠️ **Esta fase obligó a afinar una prueba de la Fase 5.** Aquella comprobaba que ningún id del
> registro contuviera la palabra "marca" u "ocasion", y `marcasFavoritas` la hizo saltar. No era una
> duplicación: el armario sabe qué marcas **tiene**, no cuáles le **gustan**. Lo que hay que prohibir
> es el catálogo, no la preferencia, así que ahora compara ids exactos.
>
> ⚠️ **Y dos comprobaciones nuevas cazaban comentarios en vez de código**: una saltaba con la frase
> que explica que *no* hay un almacén paralelo, y otra con "con**seguir**". Ahora las dos leen el
> archivo con los comentarios quitados — una prueba que salta con la prosa acaba haciendo que se
> reescriba la prosa en vez del código.

#### EH · Fase 7/65 — PELO: PERFIL CAPILAR Y NECESIDADES ✅ COMPLETADA (v1.73.0)

> **`src/lib/cuestionarios.js`** (el motor) + **`src/lib/perfilCapilar.js`** (las doce preguntas) +
> la pantalla, con **118 comprobaciones**. Sin SQL nuevo.
>
> **Es la primera fase que pregunta cosas de verdad, y no será la última:** Skincare (13), Cuerpo
> (18), Barba (20), Manos (22) y Perfumes (24) traen cada una su cuestionario. Así que lo que se
> construye es **el motor**, y las doce preguntas de Pelo son su primera configuración: están en un
> array, y las fases siguientes traerán el suyo **sin tocar una línea de aquí**.
>
> ⚠️ **El motor no guarda nada por su cuenta.** Cada respuesta va a uno de los dos sitios que ya
> existen, y la elección es una regla, no un `if`: si el dato está en `REGISTRO_DATOS` (F4) va allí
> —lo comparte con otro módulo y por tanto no se puede volver a preguntar—; si no está, es solo de ese
> módulo y va a su `config` (F1, apartado 8), que `alternarModulo` nunca toca. **De las doce, solo
> `tipoPelo` es compartida**, con Productos.
>
> Esa única decisión es la que hace pasar los Tests 7, 8 y 9 a la vez. Si estuviera mal, nada
> reventaría: simplemente Productos volvería a preguntar el tipo de pelo, o apagar Pelo se llevaría
> once respuestas.
>
> ⚠️ **"No lo sé" es una respuesta, no un hueco** (apartados 2 y 14: *"nunca obligar a inventar una
> respuesta"*). Se guarda, cuenta como contestada, y **es lo que abre la puerta al contenido
> educativo**. Y es **exclusivo**: marcarlo borra lo demás y marcar algo de verdad lo quita, porque
> *"cuero cabelludo graso y no lo sé"* es un estado imposible que luego nadie sabe interpretar.
> Por defecto toda pregunta lo admite — el valor por defecto tiene que ser el que no obliga a
> inventar— y solo se quita donde el enunciado no lo ofrece.
>
> ⚠️ **"No diagnosticar problemas"** (apartado 7). Se pregunta qué quiere cuidar, no qué le falla, y
> hay siete pruebas que buscan "caspa", "alopecia", "problema", "diagnos"… en el código. Un chaval de
> 16 años no necesita una aplicación diciéndole que tiene un problema.
>
> **Ni calendario, ni inventario de productos, ni recomendaciones.** El enunciado lo prohíbe tres
> veces (apartados 11, 12 y 17) y hay pruebas de que no se define ninguno — **pero sí se dice cuándo
> llegan**, que es la regla 8.

- [x] ENTRADA AL MÓDULO
- [x] TIPO DE PELO
- [x] GROSOR
- [x] DENSIDAD
- [x] LONGITUD ACTUAL
- [x] CUERO CABELLUDO
- [x] NECESIDADES
- [x] PREFERENCIAS
- [x] PEINADO
- [x] TIEMPO DISPONIBLE
- [x] PRODUCTOS
- [x] BARBERÍA / PELUQUERÍA
- [x] FRECUENCIA DE CORTE
- [x] DATOS DESCONOCIDOS
- [x] EDITAR INFORMACIÓN
- [x] CONEXIÓN CON EL SISTEMA DE DATOS
- [x] RECOMENDACIONES FUTURAS
- [x] PRUEBAS


> ⚠️ **Una prueba mal escrita, corregida:** la primera versión prohibía la palabra "calendario" en
> todo el archivo, y saltaba con la frase que le dice a Josué que el calendario llega en la fase 11 —
> justo lo que manda la regla 8. Ahora comprueba que no se **defina** ninguno, y además comprueba que
> **sí se diga cuándo llega**. Una prueba que castiga la honestidad está mal escrita.
>
> ⚠️ **El Test 10 (flujo completo en móvil) necesita un iPhone: es R1**, y el archivo de pruebas lo
> imprime en vez de darlo por bueno.

#### EH · Fase 8/65 — PELO: RUTINA, CUIDADOS Y SEGUIMIENTO ✅ COMPLETADA (v1.74.0)

> **`src/lib/rutinasPelo.js`** (170 comprobaciones) + el panel de Pelo, sus rutinas y su seguimiento.
> Sin SQL nuevo: todo vive en la `config` del módulo Pelo, que `alternarModulo` **nunca toca** — que
> es literalmente lo que pide el apartado 16.
>
> ⚠️ **No castigar** (apartado 7). *"No queremos 'Has fallado'. Simplemente 'Pendiente'."* Un día sin
> hacer la rutina no es un día perdido. Hay una prueba que monta **el peor escenario posible** —una
> rutina diaria abandonada durante dos meses— y recorre todos los textos generados buscando
> "fallado", "perdido", "deberías", "incumplido", "abandonado", "racha rota" y "castigo". Nueve
> comprobaciones.
>
> ⚠️ **Y sin días en los que tocara, NO hay cumplimiento** — ni 0 % ni 100 %. Decir "0 %" de algo que
> nunca tocó es exactamente el reproche que prohíbe ese apartado.
>
> ⚠️ **Nada se materializa** (apartado 17 + regla 11). Una rutina "cada 3 días" guarda **su regla**,
> no cien fechas: hay una prueba que pide un año entero de eventos, comprueba que salen más de cien
> **y que el estado guardado sigue por debajo de 3 KB**. Cambiar la frecuencia cambia los eventos al
> momento, porque no hay nada que sincronizar.
>
> ⚠️ **Ni un contador guardado.** Cuántas veces la ha hecho y el cumplimiento se derivan del
> historial. Un contador guardado miente en cuanto Josué borra un registro.
>
> ⚠️ **Sin gamificación** (D2-02 de Josué): ni XP, ni niveles, ni medallas, con prueba sobre el
> código. **Ni fotos** (apartado 10). **Ni catálogo de productos** (apartado 11 + D2-03): un producto
> aquí es un nombre que él escribe, y hay seis pruebas que buscan "amazon", "afiliad", "precio",
> "comprar", "http" y "marca:".
>
> **Recordatorios nace apagado** (apartado 5: *"nunca deben ser obligatorios"*), tal y como el propio
> enunciado lo dibuja: `☐ Recordatorios`.
>
> **Borrar una rutina dice antes qué se lleva por delante** —*"se borrará X y 3 días registrados"*—
> y borrar un producto **desengancha** los pasos que lo usaban, no los borra.
>
> **Las rutinas entran en el Calendario que ya existe**, con la misma forma que las del Armario, así
> que encajan sin adaptadores (apartado 17: *"no crear un segundo calendario"*).

- [x] PANEL PRINCIPAL DE PELO
- [x] RUTINA CAPILAR
- [x] CREAR UNA RUTINA
- [x] FRECUENCIAS
- [x] SIN RECORDATORIOS OBLIGATORIOS
- [x] CHECKLIST
- [x] NO CASTIGAR AL USUARIO
- [x] HISTORIAL
- [x] CAMBIOS
- [x] FOTOS
- [x] PRODUCTOS UTILIZADOS
- [x] PRODUCTOS SIN REGISTRAR
- [x] RECOMENDACIONES
- [x] PERSONALIZACIÓN
- [x] ACTIVAR/DESACTIVAR COMPONENTES
- [x] DATOS CONSERVADOS
- [x] INTEGRACIÓN CON CALENDARIO
- [x] PRUEBAS


> ⚠️ **Otra prueba mal escrita, corregida:** los barridos de *"esto NO existe"* cazaban su propia
> evidencia — `fotos: 0` y `xp: 0` dentro de `auditarPelo()` son **la prueba** de que no hay fotos ni
> gamificación, no una infracción. Ahora el barrido excluye la función de auditoría. Es la tercera
> vez en este bloque que una comprobación salta con algo que estaba bien: conviene mirar **qué línea**
> la hace saltar antes de cambiar el código.

#### EH · Fase 9/65 — PELO: SISTEMA DE RECOMENDACIONES ✅ COMPLETADA (v1.75.0)

> **`src/lib/recomendacionesPelo.js`** (146 comprobaciones) + la pantalla. Sin SQL nuevo.
>
> El enunciado abre con dos palabras en mayúsculas: **NO IA.** Hay seis pruebas que buscan `askAI`,
> `anthropic`, `fetch(`, `XMLHttpRequest` y `openai` en el código: se comprueba sobre el archivo, no
> sobre la buena voluntad.
>
> ⚠️ **Si un dato no existe, NO SE ASUME** (apartado 2). Cada una de las catorce reglas declara qué
> necesita saber, y si falta algo **no se dispara**. Con el perfil vacío salen **cero**
> recomendaciones, y hay una prueba de que **una regla sin requisitos no se aplica nunca** — porque se
> dispararía con el contexto vacío y acabaría recomendándole cosas a alguien de quien no sabemos nada.
>
> Y **"No lo sé" no es un valor**: es la ausencia declarada de uno (F7), así que tampoco dispara nada.
>
> ⚠️ **Nunca "debes"** (apartado 4). Hay una prueba que genera **todos** los textos posibles del motor
> —con el perfil entero contestado y con el perfil de ejemplo— y busca diez imperativos: "debes",
> "tienes que", "deberías", "obligatorio", "necesitas", "hay que", "error", "mal", "problema" y
> "fallo". Y comprueba que **sí** aparecen las fórmulas del enunciado: *"podría venirte bien"*,
> *"podrías probar"*, *"una opción compatible contigo"*.
>
> ⚠️ **Una recomendación NUNCA modifica nada** (apartado 10). `aplicarARutina` **exige
> `confirmado: true`**, y hay una prueba que **serializa el estado antes y después** y comprueba que
> no ha cambiado ni un byte. Es la regla 7 del proyecto en código, igual que `aplicarPlan` en HT F9.
> Y calcular recomendaciones tampoco escribe: **mostrar y registrar que se ha mostrado son dos
> llamadas distintas**, para que repintar una pantalla no ensucie el historial.
>
> **Los dos ejemplos literales del enunciado son dos reglas con su id**: rizado + definición, y cuero
> graso. Y el tercero — *"buscas hidratación y tu rutina tiene pocos pasos de hidratación"* — mira de
> verdad los pasos de su rutina.
>
> **Los niveles 🟢🟡🔴 se importan de la Fase 6**, no se redefinen, y hay reglas en los tres: un nivel
> vacío sería un control decorativo.
>
> ⚠️ **Descartar tiene memoria, pero con caducidad**: *"no me interesa"* calla 30 días, *"ya lo hago"*
> 90, y **"no quiero verlo" es para siempre** — por eso es el único sin plazo, porque "para siempre"
> no es un número de días. Y todo se puede deshacer: un toque no condena una recomendación.

- [x] ZONA DE RECOMENDACIONES
- [x] UTILIZAR TODA LA INFORMACIÓN DISPONIBLE
- [x] REGLAS INTERNAS
- [x] RECOMENDACIONES NO OBLIGATORIAS
- [x] MOSTRAR EL MOTIVO
- [x] NIVEL DE RECOMENDACIÓN
- [x] CANTIDAD
- [x] DESCARTAR
- [x] GUARDAR
- [x] NO MODIFICAR AUTOMÁTICAMENTE LA RUTINA
- [x] PRODUCTOS
- [x] INFORMACIÓN INSUFICIENTE
- [x] ACTUALIZACIÓN
- [x] EVITAR REPETICIONES
- [x] CONEXIÓN CON EL RESTO DE ESTILO DE HOMBRE
- [x] PRIVACIDAD
- [x] PRUEBAS
- [x] Usuario con perfil completo → recomendaciones personalizadas.
- [x] Perfil incompleto → recomendaciones básicas.
- [x] Cambiar tipo de pelo → recomendaciones actualizadas.
- [x] Ignorar → no insistir inmediatamente.
- [x] Guardar → aparece en guardados.
- [x] Añadir recomendación a rutina → solo si el usuario lo confirma.
- [x] Desactivar recomendaciones → desaparecen.
- [x] Reactivar → configuración conservada.
- [x] No utilizar IA.
- [x] No crear datos duplicados.


> ⚠️ **Un fallo real, encontrado por la prueba en el mismo turno:** `normalizarPelo` (F8) no conocía
> el campo `recomendaciones`, así que **lo descartaba en cada lectura** — descartar o guardar una
> recomendación no tenía ningún efecto. Es la **séptima vez** que este proyecto se topa con el mismo
> fallo de normalizador, y la primera en que se detecta en el turno en que se introduce.
>
> ⚠️ **El apartado 9 pide integrar el sistema global de guardados "si existe". No existe:** Nutrición
> y los colores tienen cada uno los suyos, y no hay ninguno general. Así que los guardados de pelo
> viven en la `config` de Pelo, y queda dicho para que la fase que cree el global sepa que tiene que
> absorberlos.

#### EH · Fase 10/65 — PELO: PRODUCTOS, CATÁLOGO Y RECOMENDACIONES ✅ COMPLETADA (v1.76.0)

> **`src/lib/productosPelo.js`** (169 comprobaciones) + la pantalla. Sin SQL nuevo.
>
> ⚠️ **El enunciado habla de catálogo, de Amazon y de afiliación. D2-03 de Josué dice
> *"arquitectura sí, afiliación no; ni catálogo, ni productos, ni API, ni cuenta de afiliados
> inventados"*. No hay contradicción que resolver: el propio enunciado dice lo mismo** — apartado 3,
> *"no llenar todavía la aplicación con cientos de productos"*; apartado 11, *"**no poner enlaces
> inventados**"*.
>
> Así que se construye **la arquitectura entera** —la ficha con sus doce campos, las cinco clases de
> tienda, la distinción entre enlace normal y de afiliado, el aviso de transparencia, los packs, la
> comparación, los favoritos, "ya lo tengo" y la valoración— y **el catálogo está vacío, declarado
> vacío y comprobado vacío**. Todo producto que existe lo ha metido él (apartado 9).
>
> ⚠️ **Nunca un enlace inventado.** Una "url" que no lo es se guarda como `null`, y la pantalla
> **dice que no hay enlace** en vez de fabricar una búsqueda de Amazon "por si acaso". Hay una prueba
> de que **no aparece ni una URL literal ni un dominio de tienda en todo el código**.
>
> ⚠️ **Nunca una compra automática** (apartado 19). Cinco pruebas buscan funciones de "comprar",
> "checkout", "carrito", "pagar" y "pedido". Lo más lejos que llega la aplicación es *"Ver
> producto"* — y el usuario **ve siempre esa misma etiqueta**, lleve el enlace la marca que lleve
> (apartado 12), con el aviso de transparencia **solo si alguno es de afiliado**.
>
> ⚠️ **No disponible no es borrado** (apartado 10): se marca, se avisa y se ofrecen alternativas de
> entre los suyos — y **una alternativa que tampoco está disponible no se ofrece**.
>
> ⚠️ **Una sola lista de productos.** La Fase 8 creó una con nombre y paso; esta le añadió marca,
> categoría, tiendas y valoración **en la misma lista**. *"No duplicar productos"* está en la lista de
> pruebas del apartado 20, y dos listas de productos capilares es exactamente cómo se incumple. Mismo
> nombre y misma marca es el mismo producto, aunque cambien las mayúsculas.
>
> **El precio lleva la fecha en la que se anotó** (apartado 16: *"si el precio puede cambiar, no
> tratarlo como un dato permanente"*), y se re-sella al cambiarlo.
>
> ⚠️ **El pack sugerido SUGIERE, no crea** (apartado 15): devuelve una propuesta y hay una prueba de
> que el estado **no cambia**. Guardarlo es `crearPack`, y eso lo hace él — igual que
> `aplicarARutina` en la Fase 9.
>
> **Las recomendaciones se pueden apagar y los productos siguen** (apartado 18), con su prueba: es lo
> que el apartado dice con esas palabras.

- [x] SECCIÓN DE PRODUCTOS
- [x] CATEGORÍAS
- [x] FICHA DE PRODUCTO
- [x] PRODUCTOS RECOMENDADOS
- [x] MOTIVO DE LA RECOMENDACIÓN
- [x] COMPARAR
- [x] FAVORITOS
- [x] PRODUCTOS QUE YA UTILIZA
- [x] AÑADIR PRODUCTO PERSONAL
- [x] PRODUCTOS NO DISPONIBLES
- [x] AMAZON
- [x] AFILIACIÓN
- [x] OTRAS TIENDAS
- [x] PACKS
- [x] PACK PERSONALIZADO
- [x] Producto A
- [x] Producto B
- [x] Producto C
- [x] PRECIO
- [x] VALORACIÓN PERSONAL
- [x] RECOMENDACIONES CONTROLADAS
- [x] NO COMPRAR AUTOMÁTICAMENTE
- [x] PRUEBAS


> ⚠️ **`packs` es el octavo campo que se enseña a un normalizador en este proyecto.** Y como en la
> Fase 9, el que se olvidó (`recomendaciones`) lo cazó la prueba en el mismo turno. La costumbre está
> funcionando.

#### EH · Fase 11/65 — PELUQUERÍA: CALENDARIO Y SEGUIMIENTO DE CORTES ✅ COMPLETADA (v1.77.0)

> **`src/lib/peluqueria.js`** (189 comprobaciones) + la pantalla `PeluqueriaEH`. Sin SQL nuevo.
>
> ⚠️ **La decisión que gobierna la fase entera es el apartado 15: *"Esto eliminará el evento del
> calendario, pero no el historial del corte."*** Un evento planificado y un corte que ocurrió **no
> son la misma cosa**, así que no viven en la misma lista: `cortes` es la historia y `cita` es el
> plan. Quitar la cita no puede tocar un corte porque **no tiene manera de hacerlo**, y hay una
> prueba que cuenta los cortes antes y después de borrarla. Un solo array con un campo `hecho` habría
> puesto las dos cosas a un `filter` de distancia.
>
> ⚠️ **`frecuenciaDeCorte()` es la única respuesta a "cada cuánto"**, y hace lo mismo que `tallaDe()`
> en la Fase 5: lo que ya contestó en el perfil capilar (F7) manda, lo que ponga a mano rellena el
> hueco, y **si los dos existen y no coinciden se enseña el choque** en vez de elegir en silencio.
> *"Cuando lo necesito"* es una respuesta legítima que sencillamente no permite calcular una fecha:
> se dice, y no se inventa una frecuencia por defecto.
>
> ⚠️ **`sugerirProximoCorte()` sugiere, no reserva** (apartado 16). Devuelve la fecha con
> `guardado: false` escrito en el propio dato; guardarla es `planificarCorte`, y esa la llama él.
> Tercera vez que aparece el mismo patrón tras `aplicarPlan` (HT F9) y `aplicarARutina` (EH F9).
>
> ⚠️ **`avisoDeCorte()` DECIDE, `notificaciones.js` MANDA.** Mismo reparto que `avisosHorario.js`.
> El recordatorio **nace apagado** (apartado 5: *"nunca activarlos de forma invasiva"*) y el
> apartado 13 se cumple literalmente: **el calendario funciona sin recordatorios**, son dos cosas
> independientes, y la pantalla lo dice.
>
> ⚠️ **Desactivar oculta, no borra** (apartado 14). `impactoDesactivarPeluqueria()` avisa de la cita
> futura antes de apagar y devuelve `seBorraAlgo: false`; reactivar lo devuelve todo — historial,
> sitios, preferencias y la propia cita.
>
> ⚠️ **`anadirSitio` no es un sistema de reservas** (apartado 12): un nombre, un lugar y una nota.
> Y la pantalla lo dice — *"aquí solo se apunta dónde vas"* — en vez de dejar un botón muerto
> (regla 8). Borrar un sitio **desengancha** los cortes que lo usaban; no los borra.
>
> **La frecuencia real es derivada** (apartado 9), y **con menos de dos intervalos no se afirma
> nada**: misma disciplina que HT F11 y AR F4.
>
> **Dos fallos silenciosos que encontró la prueba:** `planificarCorte({modo:'semanas'})` sin cantidad
> planificaba el corte para HOY (`Number(null)` es 0 y `Number.isInteger(0)` es `true`), y `'25:99'`
> encajaba con `/^\d{2}:\d{2}$/` y se guardaba como hora.

- [x] PLAQUITA DE PELUQUERÍA
- [x] REGISTRAR ÚLTIMO CORTE
- [x] PRÓXIMO CORTE
- [x] FRECUENCIA
- [x] RECORDATORIOS
- [x] CALENDARIO GENERAL
- [x] CANCELAR / CAMBIAR
- [x] REGISTRAR CORTE REALIZADO
- [x] HISTORIAL
- [x] NOTAS
- [x] PREFERENCIAS DEL CORTE
- [x] PELUQUERÍA / BARBERÍA
- [x] RECORDATORIOS DESACTIVADOS
- [x] DESACTIVAR PELUQUERÍA
- [x] ELIMINAR EVENTO
- [x] PRÓXIMO CORTE INTELIGENTE
- [x] PRUEBAS
- [x] Registrar último corte.
- [x] Elegir próximo corte.
- [x] Crear frecuencia.
- [x] Modificar frecuencia.
- [x] Crear recordatorio.
- [x] Desactivar recordatorio.
- [x] Marcar corte realizado.
- [x] Ver historial.
- [x] Editar evento.
- [x] Eliminar evento.
- [x] Integrarlo con calendario general.
- [x] Desactivar Peluquería.
- [x] Reactivarla.
- [x] Confirmar que todos los datos permanecen.

> ⚠️ **`peluqueria` es el noveno campo que se enseña a un normalizador en este proyecto**, y el
> tercero seguido que se recuerda a la primera. La costumbre ya está.

#### EH · Fase 12/65 — PELUQUERÍA: CORTES, PREFERENCIAS Y RECOMENDACIONES ✅ COMPLETADA (v1.78.0)

> **`src/lib/cortesPelo.js`** (209 comprobaciones) + la pantalla `MiEstiloDeCorteEH`. Sin SQL nuevo.
>
> ⚠️ **EL APARTADO 5 YA ESTABA CONTESTADO, y no se vuelve a preguntar.** Pide *"¿Cuánto tiempo
> quieres dedicar a peinarte?"* con cinco opciones — y **la Fase 7 ya hizo esa pregunta**
> (`tiempoPelo`) **con esas cinco opciones exactas**, dejando escrito para qué: *"así las
> recomendaciones futuras no propondrán una rutina de 20 minutos a alguien que quiere tardar 3"*.
> Repetirla habría dejado a Josué con **dos respuestas a la misma pregunta y ninguna forma de saber
> cuál manda**. Así que se **lee** de allí y la pantalla dice dónde se cambia. Está anotado como
> **D-15** en `docs/03`: no activa la regla 49 porque no es una contradicción — es la duplicación que
> el apartado 10 de F1 ya prohíbe, con decisión tomada. **Consecuencia visible: el perfil de corte
> tiene seis preguntas, no siete. La séptima no falta: ya está contestada.**
>
> ⚠️ **Los niveles 🟢🟡🔴 se importan de la Fase 6**, no se reescriben. `NIVELES_MANTENIMIENTO` toma
> **los ids y los iconos** de `NIVELES_ESTILO` —para que un nivel siga significando lo mismo entre
> módulos— con **los nombres que escribió Josué**: Bajo / Medio / Alto, no Básico / Intermedio /
> Avanzado. Una segunda escala de tres niveles habría sido el segundo sistema de siempre.
>
> ⚠️ **Añadir un corte es añadir una línea.** Mantenimiento, minutos, longitudes, tipos de pelo y
> estilos compatibles van EN LA LÍNEA del catálogo, así que el motor no lleva un `if` por corte. Y
> *"la lista debe ser ampliable"* (apartado 3): los que añade Josué salen mezclados con los nueve del
> enunciado, y llegan hasta la pregunta de estilos, porque la pregunta **lee el catálogo**, no una
> copia congelada al importar el archivo.
>
> ⚠️ **Nada sin confirmar** (apartado 18). Mirar recomendaciones, comparar, ver patrones y abrir el
> panel **no cambian ni un byte del estado**, con una prueba que serializa antes y después. Guardar
> un favorito, fijar el corte actual y marcar un objetivo son tres llamadas distintas que hace él.
> Y **el corte que ya lleva no se le recomienda**: eso no es una recomendación.
>
> ⚠️ **El historial no diagnostica** (apartado 15). Con **un** corte valorado bien no se afirma nada;
> hacen falta dos, y entonces la frase es la del enunciado — *"parece que este estilo encaja bastante
> con tus preferencias"*. Misma disciplina que `frecuenciaReal` (F11), HT F11 y AR F4.
>
> **Sin IA**, como la Fase 9 y comprobado sobre el código. Y la frase que el enunciado prohíbe
> expresamente —*"este es el mejor corte para ti"*— tiene su propio guardián, porque no lleva ninguna
> palabra de la lista de la Fase 9; los textos se comprueban contra **las dos** listas.
>
> **El objetivo entra en el evento que YA existe** (apartado 12 + apartado 6): en la `notas` de la
> cita de la Fase 11, no en una clave nueva y desde luego no en un segundo evento. Y lleva su nombre
> encima, así que borrar el corte del catálogo no lo deja apuntando a un fantasma.
>
> ⚠️ **`corte` es el DÉCIMO campo que se enseña a un normalizador en este proyecto**, y otra vez lo
> cazó la prueba en el mismo turno: sin esa línea en `normalizarPelo`, añadir un corte y guardar una
> referencia no tenían ningún efecto. `corteId`, `valoracion` y `objetivo` en `peluqueria.js` son el
> undécimo, duodécimo y decimotercero.

- [x] PERFIL DE CORTE
- [x] LONGITUD
- [x] ESTILO DE CORTE
- [x] CÓMO QUIERE PEINARLO
- [x] TIEMPO PARA PEINARSE
- [x] MANTENIMIENTO
- [x] RECOMENDACIONES DE CORTE
- [x] EXPLICACIÓN
- [x] COMPARACIÓN
- [x] FAVORITOS
- [x] CORTE ACTUAL
- [x] CORTE QUE QUIERE PROBAR
- [x] HISTORIAL
- [x] VALORACIÓN
- [x] RECOMENDACIONES BASADAS EN HISTORIAL
- [x] CONEXIÓN CON PELO
- [x] CONEXIÓN CON ESTILO
- [x] USUARIO SIEMPRE DECIDE
- [x] PRUEBAS

#### EH · Fase 13/65 — SKINCARE: PERFIL DE PIEL Y CONFIGURACIÓN INICIAL ✅ COMPLETADA (v1.79.0)

> **`src/lib/perfilPiel.js`** (227 comprobaciones) + las pantallas `SkincareEH` y `PerfilPielEH`.
> Sin SQL nuevo.
>
> ⚠️ **EL APARTADO 15 YA ERA CÓDIGO, Y YA ESTABA ESCRITO.** *"Antes de preguntar, comprobar la
> información ya registrada. Si un dato compatible ya existe, reutilizarlo. No preguntar dos veces."*
> El registro de la **Fase 4 ya declaraba `tipoPiel` y `sensibilidadPiel` como datos de esta fase**
> (`desde: 13`), compartidos con Productos, Barba y Cuerpo — más `sinPerfume`, de Cuerpo y Productos.
> Así que esas tres respuestas van solas a la capa compartida: **no hay un `if` que lo decida**, lo
> decide `destinoDe()`. Y funciona en las dos direcciones, con prueba: un `tipoPiel` que guardó
> Productos aparece aquí ya contestado, y contestarlo aquí lo deja donde los demás lo encuentran.
>
> ⚠️ **EL FORMULARIO ADAPTATIVO VIVE EN EL MOTOR, no en la pantalla** (apartado 14). Se le ha añadido
> `cuando` a la forma de una pregunta y `preguntasVisibles()` / `progresoVisible()` a
> `cuestionarios.js`. **Barba, Cuerpo, Manos y Perfumes van a querer lo mismo**, y una pregunta que
> se esconde con un `if` en el JSX es una pregunta que nadie puede comprobar. El ejemplo literal del
> enunciado —*"si el usuario dice 'no utilizo productos', no mostrar inmediatamente 15 preguntas
> sobre productos"*— es una prueba.
>
> ⚠️ **Y ESCONDER NO ES BORRAR.** Si dice que no usa productos, esas preguntas desaparecen **y sus
> respuestas de antes siguen ahí**; si mañana dice que sí, reaparecen contestadas. Es la regla 5 otra
> vez, aplicada a lo que se ve en vez de a lo que se guarda.
>
> ⚠️ **El progreso cuenta lo VISIBLE.** Decirle *"has contestado 4 de 13"* de un formulario donde
> cuatro preguntas no le aplican sería una nota inventada.
>
> ⚠️ **OBJETIVOS DE CUIDADO, NUNCA UN DIAGNÓSTICO** (apartado 4, con la advertencia en el propio
> enunciado, y el objetivo de la fase: *"sin diagnósticos médicos"*). La pregunta es *"¿qué te
> gustaría mejorar o cuidar?"*, **no** *"¿qué te pasa?"*, y hay una prueba que recorre todos los
> textos de la fase buscando veinte palabras clínicas.
>
> ⚠️ **APARTADO 17 — ESTO NO SALE DE AQUÍ.** *"No enviar estos datos a una IA. No crear perfiles
> externos."* Siete pruebas sobre el código (`askAI`, `anthropic`, `fetch(`, `openai`, `supabase`…),
> y el contexto que entrega lleva `paraIA: false` escrito en el propio dato.
>
> **Los niveles 🟢🟡🔴 se importan de la Fase 6**, porque el apartado 9 dice literalmente *"esto
> conecta directamente con el sistema de niveles"*. Segunda fase seguida que lo hace.
>
> ⚠️ **Y LO QUE ESTA FASE NO CONSTRUYE, DECLARADO Y COMPROBADO:** el enunciado cierra con *"todavía
> no implementar esas funciones dentro de esta fase"*, así que `auditarPiel()` devuelve cero rutinas,
> cero seguimiento, cero recomendaciones, cero catálogo y cero packs, y hay cinco pruebas que buscan
> `crearRutina`, `recomendar`, `CATALOGO`, `crearPack` y `aplicarA` en el archivo. Un producto aquí
> **es un nombre**: ni marca, ni precio, ni tienda.
>
> **Un detalle que se corrigió sobre la marcha:** el módulo tenía dos vocabularios de estado
> —`estadoPerfilPiel` devolvía las palabras del motor (`contestado`) y `estadoDeEntrada` las suyas
> (`configurado`)—. Dos nombres para lo mismo en el mismo archivo es cómo se acaba comparando contra
> la palabra equivocada, así que se ha quedado uno: el que sabe de *"Ahora no"*.


- [x] ENTRADA A SKINCARE
- [x] FORMULARIO
- [x] TIPO DE PIEL
- [x] NECESIDADES
- [x] SENSIBILIDAD
- [x] ZONAS
- [x] OBJETIVO PRINCIPAL
- [x] TIEMPO DISPONIBLE
- [x] COMPLEJIDAD
- [x] PRODUCTOS ACTUALES
- [x] PREFERENCIAS DE PRODUCTOS
- [x] PRESUPUESTO
- [x] PROTECCIÓN SOLAR
- [x] FORMULARIO ADAPTATIVO
- [x] INFORMACIÓN EXISTENTE
- [x] DATOS EDITABLES
- [x] PRIVACIDAD
- [x] PRUEBAS
- [x] Usuario que completa todo.
- [x] Usuario que responde parcialmente.
- [x] Usuario que pulsa “No lo sé”.
- [x] Usuario que salta el formulario.
- [x] Usuario con información existente.
- [x] Usuario sin productos.
- [x] Usuario con productos.
- [x] Cambiar preferencias.
- [x] Cambiar nivel.
- [x] Desactivar Skincare.
- [x] Reactivar Skincare.
- [x] Comprobar que no se pierde información.
- [x] Probar móvil.

#### EH · Fase 14/65 — SKINCARE: RUTINAS Y CUIDADO DIARIO ✅ COMPLETADA (v1.80.0)

> **`src/lib/motorRutinas.js`** (el motor extraído) + **`src/lib/rutinasPiel.js`** (148
> comprobaciones) + las pantallas `PanelPiel` y `RutinasPielEH`. Sin SQL nuevo.
>
> ⚠️ **EL APARTADO 19 SE TITULA "NO DUPLICAR", Y ESTA FASE PEDÍA LA MÁQUINA QUE YA EXISTÍA.** Pasos,
> frecuencia, lista del día, historial y eventos de calendario: lo que la Fase 8 construyó para el
> pelo, otra vez para la piel. Copiar `rutinasPelo.js` habría sido el segundo sistema —y el segundo
> sitio donde arreglar el mismo fallo—, así que **lo genérico se extrajo a `motorRutinas.js`** y los
> dos módulos lo usan. **Las 171 pruebas de la Fase 8 son la red que demuestra que la extracción no
> cambió nada**: pasaron sin tocar ni una.
>
> ⚠️ **La lista de frecuencias es de cada módulo; el COMPORTAMIENTO es del motor.** La Fase 8 ofrecía
> cinco opciones y esta pide seis, pero **debajo solo hay cuatro reglas**: *"días concretos"*,
> *"varias veces por semana"* y *"semanal"* son tres formas de decir "estos días de la semana". Cada
> etiqueta declara **de qué tipo es**, se guarda la palabra que eligió Josué, y hay una prueba de que
> Pelo y Skincare dan **la misma respuesta al mismo caso**.
>
> ⚠️ **OMITIR NO ES FALLAR** (apartado 10: *"sin penalización"*). Un paso omitido es una **tercera
> cosa**: no pendiente —eso sería el reproche— y no hecho —eso sería mentir—. **Sale de la cuenta del
> día**, así que una rutina de tres pasos con uno omitido y dos hechos está **HECHA**. Y un paso no
> puede estar hecho y omitido a la vez: marcar quita lo uno, omitir quita lo otro.
>
> ⚠️ **Los productos son los de la Fase 13** (apartados 6 y 19: *"no crear un segundo inventario"*).
> Un paso guarda el `id` de un producto que ya existe en el perfil de piel, y *"+ Añadir producto"*
> **escribe allí** y luego lo engancha: dos escrituras, un solo inventario. Hay una prueba que lee
> este código y falla si aparece una lista de productos propia.
>
> ⚠️ **Las plantillas SUGIEREN** (apartados 12 y 13). *"Son plantillas, no obligaciones"*, y *"el
> usuario debe confirmar: Usar esta rutina"*. `plantillaSugerida()` devuelve una propuesta con
> `guardado: false` en el propio dato y **no escribe nada** —la prueba serializa el estado antes y
> después—; `usarPlantilla()` **sin `confirmado` no crea nada**. Cuarto `aplicarPlan` del proyecto.
> Y la propuesta se adapta al perfil: si ha dicho que no usa protección solar, ese paso no aparece.
>
> ⚠️ **CAMBIAR DE NIVEL NO BORRA LA RUTINA ANTERIOR** (apartado 14, con esas palabras). El nivel
> filtra **lo que se ofrece**, no lo que existe, y hay una prueba que baja de avanzado a básico y
> cuenta las rutinas y los pasos antes y después. **Sin nivel elegido se ofrece todo**: esconder
> opciones a quien no ha dicho nada es decidir por él.
>
> **El seguimiento es una frase** (apartado 16: *"no hace falta llenar la pantalla de
> estadísticas"*): *"Esta semana: 3 rutinas realizadas."* Sin porcentajes, sin rachas y sin
> comparaciones con la semana pasada, con una prueba que lo busca.
>
> **Y el calendario es el que ya existe** (apartado 17), con la misma forma de evento que el Armario
> y las rutinas de pelo. Un año de eventos no guarda ni una fecha (regla 11) — y **ninguno anterior
> al día en que la creó**: una rutina no existe antes de existir.

- [x]

- [x] PANEL DE SKINCARE
- [x] CREAR RUTINA
- [x] Limpieza
- [x] Hidratación
- [x] Protección solar
- [x] MAÑANA Y NOCHE
- [x] PASOS
- [x] ORDEN
- [x] PRODUCTOS
- [x] FRECUENCIA
- [x] RECORDATORIOS
- [x] CHECKLIST
- [x] OMITIR PASOS
- [x] CAMBIAR RUTINA
- [x] RUTINAS PREDEFINIDAS
- [x] PERSONALIZACIÓN
- [x] NIVELES
- [x] SEGUIMIENTO
- [x] HISTORIAL
- [x] CONEXIÓN CON CALENDARIO
- [x] ACTIVAR/DESACTIVAR
- [x] NO DUPLICAR
- [x] PRUEBAS
- [x] Crear rutina.
- [x] Crear rutina mañana.
- [x] Crear rutina noche.
- [x] Añadir pasos.
- [x] Cambiar orden.
- [x] Asociar productos.
- [x] Cambiar frecuencia.
- [x] Activar/desactivar recordatorios.
- [x] Marcar pasos.
- [x] Omitir rutina.
- [x] Editar rutina.
- [x] Eliminar rutina.
- [x] Consultar historial.
- [x] Conectar con calendario.
- [x] Desactivar módulo.
- [x] Reactivarlo.
- [x] Comprobar que no existen duplicados.

#### EH · Fase 15/65 — SKINCARE: SEGUIMIENTO Y EVOLUCIÓN ✅ COMPLETADA (v1.81.0)

> **`src/lib/seguimientoPiel.js`** (121 comprobaciones) + la pantalla `SeguimientoPielEH`, y una
> **regla invariante nueva** (`scripts/test-imports.mjs`). Sin SQL nuevo.
>
> 🐛 **Y un fallo REAL, grave y antiguo, encontrado por esa regla: `App.jsx` nunca importó
> `papelera.js`.** `DEFAULT_PAPELERA` se usa en un `useState` de la línea 262, así que **la
> aplicación lanzaba un `ReferenceError` en el primer render**. Ni `vite build` ni los 648 casos de
> renderizado podían verlo: JavaScript no comprueba los identificadores al compilar, y `App.jsx` no
> se renderiza en las pruebas porque necesita Supabase. Ver la sección de abajo.
>
> ⚠️ **NO se crea otro diario** (apartado 11, con esas palabras). JosStyle ya tiene el Diario
> general, y lo que Josué escriba ahí sobre su piel **sigue siendo de ese módulo**. Aquí solo viven
> *"los datos específicos necesarios para este módulo"*: una valoración, unos aspectos y una nota
> corta —280 caracteres a propósito, porque el sitio para escribir es el Diario—.
>
> ⚠️ **NO se crea otra papelera** (apartado 13). Y no hizo falta tocar el motor de ME F3: es genérico
> sobre la lista que se le pasa, así que bastó con **una línea en `CATALOGO_PAPELERA`**. El borrado
> sale por `eliminarConPapelera`, la única puerta de borrado de la app — que es además lo que hace
> que **la auditoría de ME F4 lo vea**: cuando iba por un atajo, la auditoría lo cazó y dijo *"el
> catálogo describe colecciones sin borrado real"*. Tenía razón.
>
> ⚠️ **NO se registra cada día** (apartado 9, que el enunciado marca como *"esto es importante"*).
> Nada de *"has perdido tu racha"*, ninguna exigencia diaria, ningún hueco pintado como fallo: **un
> día sin registrar no existe** — no es un cero. Siete pruebas barren todos los textos, y
> `resumenSeguimientoPiel` devuelve `racha: null` a propósito.
>
> ⚠️ **Las tendencias NUNCA afirman causalidad** (apartados 7 y 12): *"no afirmar que un producto ha
> causado un resultado"*. Se enseña *"↑ Mejorando"* y *"desde que empezaste a utilizar X has
> registrado N valoraciones"*, y ahí se para — con una prueba que busca siete formas de decir "por su
> culpa". Y **con menos de cuatro registros no se afirma nada**, con la frase literal del apartado 8;
> que dice que faltan **datos**, no que él haya fallado.
>
> **Medio punto de margen** para llamar a algo "mejorando": sin él, una diferencia de 0,1 entre cinco
> registros se anunciaría como una mejora que no existe.
>
> ⚠️ **Sin fotos** (apartado 10) y **sin exportación propia** (apartado 14): `datosParaExportar()`
> **prepara** los datos con `exporta: false` escrito en el propio dato, y no hay nada que descargue.
>
> **Un fallo propio, cazado por la prueba:** `evolucionPiel` hacía `{ id: a.id, ...tendencia(t) }`, y
> la tendencia **también tiene `id` y `nombre`** —'sube' y 'Mejorando'—, así que el spread se llevaba
> por delante los del aspecto: la hidratación pasaba a llamarse "sube". Ahora los campos se copian
> uno a uno.

- [x]

- [x] PLAQUITA DE SEGUIMIENTO
- [x] VALORACIÓN RÁPIDA
- [x] ASPECTOS CONCRETOS
- [x] NOTA PERSONAL
- [x] REGISTRO DE PRODUCTOS
- [x] CAMBIOS DE RUTINA
- [x] EVOLUCIÓN
- [x] PERIODOS
- [x] NO OBLIGAR A REGISTRAR CADA DÍA
- [x] FOTOS
- [x] CONEXIÓN CON EL DIARIO
- [x] CONEXIÓN CON PRODUCTOS
- [x] ELIMINAR REGISTROS
- [x] EXPORTACIÓN
- [x] DESACTIVAR
- [x] PRUEBAS
- [x] Crear valoración.
- [x] Editarla.
- [x] Eliminarla.
- [x] Añadir nota.
- [x] Asociar producto.
- [x] Registrar cambio de rutina.
- [x] Consultar evolución.
- [x] Cambiar periodo.
- [x] Sin registros suficientes.
- [x] Desactivar seguimiento.
- [x] Reactivarlo.
- [x] Comprobar que no se crea otro diario.
- [x] Comprobar integración con eliminados recientemente.
- [x] Comprobar móvil.

#### EH · Fase 16/65 — SKINCARE: MOTOR DE RECOMENDACIONES ✅ COMPLETADA (v1.82.0)

> **`src/lib/motorRecomendaciones.js`** (el motor extraído) + **`src/lib/recomendacionesPiel.js`**
> (160 comprobaciones) + la pantalla `RecomendacionesPielEH`. Sin SQL nuevo.
>
> ⚠️ **Tercera fase que necesitaba reglas con `requiere`/`cuando`/`porque`.** La 9 lo construyó para
> el pelo, la 12 escribió su propia copia del mismo `if`, y ésta era la tercera. Lo genérico se
> extrajo a `motorRecomendaciones.js` y las tres lo usan — **las 146 pruebas de F9 y las 209 de F12
> pasaron sin tocar ni una**, y hay una prueba de que F9 usa literalmente la misma función.
>
> ⚠️ **La aplicación NUNCA modifica la rutina** (apartados 4 y 11, los dos con esas palabras).
> `anadirARutina` exige `confirmado: true`, y calcular recomendaciones no escribe nada — la prueba
> serializa el estado antes y después. Quinto `aplicarPlan` del proyecto.
>
> ⚠️ **La prioridad la marca ÉL** (apartado 2) y **pesa sin tapar el resto**: lo de su objetivo sale
> primero, pero una recomendación de otro tema sigue pudiendo aparecer.
>
> ⚠️ **El nivel se respeta** (apartado 7): un básico no ve lo avanzado, con prueba en las dos
> direcciones. Y **sin nivel elegido se enseña todo**, como en la Fase 14.
>
> ⚠️ *"No quiero recomendaciones similares"* **calla el TEMA entero**, no solo esa regla — que es lo
> que "similares" significa. Los otros tres motivos caducan (30/90/90 días).
>
> ⚠️ **Apartado 16, la comprobación explícita de "sin IA"**: seis pruebas sobre el código y cuatro
> ceros declarados (llamadas, envío de datos, diagnósticos, análisis de fotos).
>
> **El catálogo de productos sigue vacío**: `queBuscarEnProductos()` dice **qué se buscaría** con lo
> que ya se sabe, y declara `catalogo: 0` — el catálogo llega en la fase 17 (D2-03).


- [x] PLAQUITA
- [x] PRIORIDADES
- [x] REGLAS
- [x] RECOMENDACIONES DE RUTINA
- [x] RECOMENDACIONES DE PRODUCTOS
- [x] EXPLICACIÓN
- [x] NIVEL
- [x] CANTIDAD
- [x] DESCARTAR
- [x] GUARDAR
- [x] AÑADIR A RUTINA
- [x] AÑADIR PRODUCTO
- [x] INFORMACIÓN INSUFICIENTE
- [x] ACTUALIZACIÓN
- [x] HISTORIAL DE RECOMENDACIONES
- [x] NO IA
- [x] DESACTIVAR
- [x] PRUEBAS

#### EH · Fase 17/65 — SKINCARE: SISTEMA DE PRODUCTOS, FARMACIA, AMAZON Y PACKS ✅ COMPLETADA (v1.83.0)

> **`src/lib/motorProductos.js`** (el motor extraído) + **`src/lib/productosPiel.js`**
> (199 comprobaciones) + la pantalla `ProductosPielEH`. Sin SQL nuevo.
>
> ⚠️ **La condición de finalización pedía el motor**, con esas palabras: *"reutilizar exactamente la
> misma arquitectura de productos para Pelo, Cuerpo, Higiene y otros módulos, **evitando crear cinco
> catálogos diferentes**"*. La Fase 10 ya la había construido para el pelo, así que lo genérico se
> extrajo a `motorProductos.js` y los dos módulos lo usan — **las 169 pruebas de F10 pasaron sin
> tocar ni una**. Lo que se queda en cada módulo es lo suyo: las diez categorías de la piel y su
> tabla de comparación, que este enunciado dibuja con **cinco** filas donde el de la Fase 10 dibuja
> **cuatro**.
>
> ⚠️ **UN inventario, el de la Fase 13** (apartado 13: *"Ya lo tengo alimentará la información de
> productos del usuario"*). Esa lista **ya existía**: la creó F13 y la usa F14 para enganchar
> productos a los pasos. Esta fase le añade la ficha entera **en la misma lista**, y hay una prueba
> de que un producto creado aquí lo ve `productosDePiel()` de la Fase 14.
>
> ⚠️ **DECIMOCTAVA VEZ del mismo fallo de normalizador**, y la más cara: `normalizarPiel` recortaba
> cada producto a `{ id, nombre }`, así que el siguiente guardado se habría llevado marca, categoría,
> precio, tiendas, objetivos y valoración. Cuatro pruebas normalizan dos veces seguidas para que no
> vuelva a pasar. `packs` también se declaró en `DEFAULT_PIEL`.
>
> ⚠️ **El catálogo está VACÍO, y es D2-03**: *"Amazon: arquitectura sí, afiliación no. Ni catálogo,
> ni productos, ni API, ni cuenta de afiliados inventados."* Se construye la arquitectura entera y
> **todo producto que existe lo ha metido él**; la pantalla lo dice con una frase en vez de fingir
> una tienda. Y **nunca un enlace inventado** (apartado 4): una "url" que no lo es se guarda como
> `null` y se dice que no hay enlace, en vez de fabricar una búsqueda de Amazon "por si acaso".
>
> ⚠️ **Amazon no es una limitación** (apartados 5 y 6): un producto que solo está en la farmacia se
> recomienda igual, y *"Disponible en farmacia"* es una respuesta completa aunque no haya enlace.
> El aviso de afiliación sale **solo donde hay afiliación**, y el usuario ve siempre *"Ver producto"*.
>
> ⚠️ **Nunca comprar, nunca añadir al carrito, nunca elegir por él** (apartado 22): cinco pruebas
> sobre el código y tres ceros declarados. `packSugeridoPiel` **sugiere y no escribe** —la prueba
> serializa el estado antes y después—, como `aplicarARutina`. Sexto `aplicarPlan` del proyecto.
>
> ⚠️ **Y una frase que estaba escrita dos veces**: `CATALOGO_VACIO_PORQUE` era idéntica, palabra por
> palabra, en `productosPelo.js` y aquí. Se mudó al motor, donde vive la decisión. Al hacerlo apareció
> un fallo de verdad que cazaron las pruebas de renderizado: `export … from` **no crea binding
> local**, así que el propio archivo la usaba sin tenerla — cuatro pantallas reventaban con
> `CATALOGO_VACIO_PORQUE is not defined`.

- [x] PLAQUITA DE PRODUCTOS
- [x] CATEGORÍAS
- [x] FICHA DEL PRODUCTO
- [x] AMAZON
- [x] FARMACIA
- [x] SI NO ESTÁ EN AMAZON
- [x] AFILIACIÓN
- [x] PRODUCTOS RECOMENDADOS
- [x] MOTIVO
- [x] FILTROS
- [x] BUSCADOR
- [x] FAVORITOS
- [x] PRODUCTOS QUE YA TIENE
- [x] PRODUCTOS PERSONALIZADOS
- [x] COMPARACIÓN
- [x] PACKS
- [x] PACK PERSONALIZADO
- [x] ALTERNATIVAS
- [x] PRECIO
- [x] VALORACIÓN PERSONAL
- [x] DESACTIVAR PRODUCTOS
- [x] NO COMPRA AUTOMÁTICA
- [x] PRUEBAS

#### EH · Fase 18/65 — CUERPO E HIGIENE MASCULINA: CONFIGURACIÓN Y PERFIL ⏸ **BLOQUEADA (C-25)**

> ⏸ **Pendiente de Josué, por la regla 49.** Su Fase 2 dice que *Higiene* y *Cuidado corporal* son
> **dos módulos** del catálogo; el objetivo de esta fase y el apartado 1 de la Fase 19 dicen que son
> **uno solo** llamado *"Cuerpo e higiene"* con plaquitas dentro. Las dos lecturas rompen un prompt
> suyo y cambian lo que ve en pantalla, así que **no se resuelve por cuenta propia**. Ver **C-25** en
> `docs/03`, con las tres preguntas concretas. Mientras tanto se ha seguido por la **Fase 20**, que
> no depende de esto.

- [ ] ACTIVACIÓN INICIAL
- [ ] FORMULARIO
- [ ] HIGIENE DIARIA
- [ ] PREFERENCIAS
- [ ] TIPO DE PRODUCTO
- [ ] FRAGANCIAS
- [ ] SENSIBILIDAD
- [ ] NECESIDADES ESPECÍFICAS
- [ ] TIEMPO
- [ ] NIVEL
- [ ] PRODUCTOS EXISTENTES
- [ ] RUTINAS
- [ ] RECORDATORIOS
- [ ] RECOMENDACIONES
- [ ] PRODUCTOS
- [ ] FARMACIA Y TIENDAS
- [ ] ACTIVAR Y DESACTIVAR CADA PARTE
- [ ] NO DUPLICAR CON OTROS MÓDULOS
- [ ] ELIMINACIÓN
- [ ] PRUEBAS
- [ ] Entrar sin configurar.
- [ ] Saltar formulario.
- [ ] Activar solo una sección.
- [ ] Activar varias.
- [ ] Desactivar una.
- [ ] Reactivarla.
- [ ] Crear rutina.
- [ ] Editarla.
- [ ] Asociar productos existentes.
- [ ] Añadir un producto nuevo.
- [ ] Activar/desactivar recordatorios.
- [ ] Ver recomendaciones.
- [ ] Utilizar productos de farmacia.
- [ ] Utilizar productos de Amazon.
- [ ] Comprobar que no existen catálogos duplicados.
- [ ] Comprobar que los datos permanecen al desactivar módulos.
- [ ] Probar todo en móvil.

#### EH · Fase 19/65 — CUERPO E HIGIENE: RUTINAS Y RECOMENDACIONES
- [ ] PLAQUITA «MI RUTINA»
- [ ] RUTINA BÁSICA
- [ ] RUTINAS PERSONALIZADAS
- [ ] PEQUEÑAS PLAQUITAS
- [ ] CHECKLIST
- [ ] FRECUENCIA
- [ ] RECORDATORIOS
- [ ] RECOMENDACIONES
- [ ] RECOMENDACIONES SEGÚN PERFIL
- [ ] RECOMENDACIONES DE PRODUCTOS
- [ ] PRODUCTOS QUE YA TIENE
- [ ] ALTERNATIVAS
- [ ] PACKS
- [ ] NIVEL
- [ ] EDITAR
- [ ] OMITIR
- [ ] DESACTIVAR
- [ ] CONEXIONES GLOBALES
- [ ] PRUEBAS
- [ ] Crear rutina.
- [ ] Usar plantilla.
- [ ] Personalizar plantilla.
- [ ] Crear desde cero.
- [ ] Añadir pasos.
- [ ] Reordenarlos.
- [ ] Asociar productos.
- [ ] Cambiar frecuencia.
- [ ] Activar/desactivar recordatorio.
- [ ] Marcar rutina.
- [ ] Omitir paso.
- [ ] Recibir recomendación.
- [ ] Ignorar recomendación.
- [ ] Guardar producto.
- [ ] Crear pack.
- [ ] Desactivar módulos.
- [ ] Reactivarlos.
- [ ] Comprobar persistencia.

#### EH · Fase 20/65 — BARBA Y AFEITADO: PERFIL Y CONFIGURACIÓN ✅ COMPLETADA (v1.84.0)

> **`src/lib/perfilBarba.js`** (141 comprobaciones) + las pantallas `BarbaEH`, `ElegirPartesBarba`,
> `PerfilBarbaEH`, `ProductosBarbaEH` y `PanelBarba`. Sin SQL nuevo.
>
> ⚠️ **Construida fuera de orden, y a propósito**: las Fases 18 y 19 están **bloqueadas por C-25**
> (regla 49), y la 20 no depende de ellas. Cuando Josué conteste, se retoman en su sitio.
>
> ⚠️ **El apartado 17 es una lista de siete cosas que hay que REUTILIZAR**, y termina con *"no crear
> sistemas paralelos"*. Así que esta fase es, casi entera, llamadas: el motor de cuestionarios de la
> F7, el registro de datos de la F4, los inventarios de F10/F17 y los tres niveles de la F6. La
> auditoría declara **nueve ceros**.
>
> ⚠️ **`sensibilidadPiel` NO se vuelve a preguntar**: el registro de la Fase 4 ya la declaraba con
> `usan: ['skincare', 'barba', 'productos']` —con "barba" escrito dentro, siete fases antes de que
> existiera este archivo—. Se lee, y la pantalla dice dónde se cambia. Lo que sí es nuevo es
> `molestiaAfeitado`, que **no es la misma pregunta**. Séptima vez que esta comprobación evita una
> pregunta repetida (D-15).
>
> ⚠️ **Los productos son los del catálogo global, y aquí solo se guardan IDS.** Un aftershave de
> Skincare se marca para la barba **sin duplicarse**, desmarcarlo no lo borra de su módulo, y si lo
> borra allí, aquí desaparece — no se queda su nombre huérfano, que sería media ficha guardada aquí.
>
> ⚠️ **El formulario adaptativo se amplió EN EL MOTOR, no con un `if`.** El apartado 7 dice *"si
> selecciona afeitado"*, y "afeitado" no es una respuesta: es una casilla del apartado 2. Así que
> `cuando` pasó a recibir **dos** cosas —las respuestas y un contexto del módulo—, y las preguntas de
> F13 siguieron funcionando sin tocar ni una.
>
> ⚠️ **`frecuenciaDeAfeitado()` es la ÚNICA respuesta a "cada cuánto"**, como `frecuenciaDeCorte()`
> en F11: *"cuando lo necesito"* **es una respuesta** y no se traduce a días, "Personalizado" sin
> cifra **no es una frecuencia**, y el choque entre el perfil y lo puesto a mano **se enseña**.
>
> ⚠️ **Nunca un diagnóstico** (apartados 10 y 11): `PALABRAS_CLINICAS` es **la lista de la Fase 13,
> importada**, y una prueba barre los 82 textos de esta fase. La ayuda de la pregunta de molestias
> tuvo que reescribirse porque *"no es un diagnóstico"* **contiene la palabra**: octava vez que una
> comprobación de este proyecto salta con algo bien dicho.
>
> ⚠️ **RUTINA y RECORDATORIOS quedan como ESTRUCTURA, y es lo que pide el enunciado**: su apartado
> 14 dice *"preparar 🧔 Mi rutina"* y la condición de finalización lo remata — *"todavía no
> desarrollamos rutinas avanzadas, recomendaciones, productos, packs ni seguimiento"*. Así que la
> plaquita existe y **dice que llega en la Fase 21** (regla 8), en vez de abrir una pantalla vacía.
> Por eso dos de las trece pruebas del apartado 18 —*"crear rutina"* y *"desactivar
> recordatorios"*— quedan sin marcar: no hay rutinas que crear todavía.

- [x] ACTIVACIÓN
- [x] QUÉ UTILIZA
- [x] TIPO DE BARBA
- [x] LONGITUD
- [x] ESTILO
- [x] OBJETIVO
- [x] AFEITADO
- [x] FRECUENCIA
- [x] PREFERENCIAS
- [x] SENSIBILIDAD
- [x] PROBLEMAS PERCIBIDOS
- [x] PRODUCTOS ACTUALES
- [x] NIVEL
- [x] RUTINA
- [x] RECORDATORIOS
- [x] ACTIVAR/DESACTIVAR
- [x] CONEXIONES
- [x] PRUEBAS
- [x] Activar módulo.
- [x] Saltarlo.
- [x] Elegir barba.
- [x] Elegir afeitado.
- [x] Configurar ambos.
- [x] Editar preferencias.
- [x] Añadir productos existentes.
- [ ] Crear rutina.  ⏸ *(llega con las rutinas, en la Fase 21)*
- [ ] Desactivar recordatorios.  ⏸ *(llega con las rutinas, en la Fase 21)*
- [x] Desactivar módulo.
- [x] Reactivarlo.
- [x] Comprobar que todo sigue guardado.
- [x] Comprobar que no existen datos duplicados.

#### EH · Fase 21/65 — BARBA Y AFEITADO: RUTINAS Y SEGUIMIENTO ✅ COMPLETADA (v1.85.0)

> **`src/lib/rutinasBarba.js`** (155 comprobaciones) + la pantalla `RutinasBarbaEH`. Sin SQL nuevo.
>
> ⚠️ **Casi todo esto ya existía.** Rutinas, plantillas, checklist, omitir, historial, calendario y
> papelera los construyeron F8 y F14, y `motorRutinas.js` los tiene extraídos desde F14 justo para
> esto. Lo propio de la fase son sus tres plantillas, sus etiquetas de frecuencia y sus cuatro
> aspectos. La auditoría declara **ocho ceros**.
>
> 🐛 **Y arregló un fallo de verdad de la Fase 20:** las rutinas colgaban de la casilla *"Afeitado"*,
> así que **quien solo marcaba "Barba" no podía crear ninguna** — cuando el apartado 3 dice
> literalmente *"RUTINA DE BARBA: si tiene barba, 🧔 Cuidado de barba"*. Ahora `rutinas` es un
> interruptor propio, que además es el que pedía el apartado 16 de la F20, y **elegir las casillas no
> lo toca**: volver a elegir qué gestionas no puede apagarte las rutinas por la espalda.
>
> 🐛 **Dos fallos más, cazados por el navegador:** `TEXTOS_ESTADO_DIA` son **textos, no objetos**, y
> la pantalla leía `.nombre` — el estado del día salía en blanco, y el barrido de palabras clínicas
> no miraba ninguna de esas etiquetas.
>
> ⚠️ **Omitir es una TERCERA cosa** (apartado 7: *"sin penalización"*): ni hecho ni pendiente, y
> **sale de la cuenta del día**. Dos pasos hechos y uno omitido es una rutina **HECHA**.
>
> ⚠️ **Nunca un segundo calendario** (apartado 14) ni **una papelera propia** (apartado 19): las dos
> cosas son dos líneas de catálogo y una llamada al motor de siempre. Tercer módulo de Estilo de
> Hombre que entra en el calendario global por la misma puerta.
>
> ⚠️ **Borrar la rutina NO borra su historial**: *"23/08 — Afeitado ⭐ 5/5"* pasó, y sus registros se
> quedan huérfanos en vez de desaparecer. Misma decisión que la F11 con los cortes y las citas.
>
> ⚠️ **Y sin valoraciones no hay estrella**: `null`, nunca un 0. Ni rachas, ni promedios, ni
> porcentajes (D2-02).

- [x] PLAQUITA «MI RUTINA»
- [x] RUTINA DE AFEITADO
- [x] Preparación.
- [x] Afeitado.
- [x] Limpieza.
- [x] Cuidado posterior.
- [x] RUTINA DE BARBA
- [x] PERFILADO
- [x] RUTINAS PERSONALIZADAS
- [x] CHECKLIST
- [x] OMITIR
- [x] RECORDATORIOS
- [x] SEGUIMIENTO
- [x] VALORACIÓN DEL AFEITADO
- [x] NOTAS
- [x] HISTORIAL
- [x] PRODUCTOS
- [x] CALENDARIO
- [x] RECOMENDACIONES BÁSICAS
- [x] GUARDAR COMO FAVORITA
- [x] DESACTIVAR SEGUIMIENTO
- [x] DESACTIVAR TODO
- [x] ELIMINAR
- [x] PRUEBAS

#### EH · Fase 22/65 — MANOS, UÑAS Y PIES: CONFIGURACIÓN ⏸ **BLOQUEADA (C-25)**

> ⏸ **Pendiente de Josué, por la regla 49 — y es la tercera pregunta de C-25.** Su apartado 1 dice
> *"dentro de 🧼 **Cuidado personal**"*, que es el módulo `higiene`, justo uno de los dos en disputa;
> y dos de las siete casillas de la Fase 18 son *"Cuidado de manos"* y *"Cuidado de pies"*, que es
> exactamente lo que esta fase construye. Hasta saber si Higiene y Cuidado corporal son uno o dos, no
> se sabe dónde vive esto ni si sus datos se quedarían huérfanos. Se siguió por la **Fase 23**.

- [ ] ACTIVACIÓN
- [ ] UÑAS
- [ ] LONGITUD
- [ ] MANOS
- [ ] PIES
- [ ] FRECUENCIA
- [ ] RECORDATORIOS
- [ ] RUTINAS
- [ ] CHECKLIST
- [ ] CALENDARIO
- [ ] PRODUCTOS
- [ ] SEGUIMIENTO
- [ ] NOTAS
- [ ] DESACTIVACIÓN INDIVIDUAL
- [ ] DATOS CONSERVADOS
- [ ] ELIMINADOS RECIENTEMENTE
- [ ] PRUEBAS
- [ ] Activar uñas.
- [ ] Activar manos.
- [ ] Activar pies.
- [ ] Activar solo una.
- [ ] Crear rutina.
- [ ] Configurar frecuencia.
- [ ] Crear recordatorio.
- [ ] Añadir producto.
- [ ] Registrar seguimiento.
- [ ] Editar.
- [ ] Eliminar.
- [ ] Recuperar.
- [ ] Desactivar individualmente.
- [ ] Reactivar.
- [ ] Comprobar que no existen duplicados.

#### EH · Fase 23/65 — HIGIENE BUCAL Y SONRISA ✅ COMPLETADA (v1.86.0)

> **`src/lib/sonrisa.js`** (191 comprobaciones) + la pantalla `SonrisaEH`. Sin SQL nuevo.
>
> ⚠️ **Construida fuera de orden**: la **Fase 22** está ⏸ bloqueada por **C-25**, y ésta no depende
> de ella.
>
> ⚠️ **Es un módulo nuevo, y se añadió como manda la Fase 1**: *una línea* en `MODULOS_EH`, con su
> categoría, su icono y sus ocho sinónimos de búsqueda. Ni un `case`, ni un `if`, ni un registro
> aparte — hay una prueba que lo comprueba sobre el código de `estiloDeHombre.js`.
>
> ⚠️ **La racha es la GLOBAL, y si no la tiene NO se pinta** (apartado 10, con esas palabras: *"como
> ya existe el sistema global de rachas, no crear otra racha… Si no: no mostrarla"*). Aquí **no se
> guarda ni un contador**: `rachaDeSonrisa()` mira las definiciones que ya existen y devuelve `null`
> si no hay ninguna suya. Ni se le propone crearla, que sería empujarle a algo que no ha pedido.
>
> ⚠️ **El cambio de cepillo se SUGIERE, no se agenda** (apartado 6): `sugerirCambioCepillo()` propone
> y **no escribe**, y guardarla exige `confirmado`. Octavo `aplicarPlan` del proyecto. Y **cambiarlo
> de verdad borra el plan anterior**: avisar de algo que ya hizo sería mentir.
>
> 🐛 **Un fallo real, cazado por sus propias pruebas:** las revisiones y el cambio de cepillo salían
> en `eventosDeSonrisa` **sin filtrar por el rango pedido** — una revisión de octubre aparecía al
> pedir los eventos de agosto, y el calendario la habría pintado en el mes equivocado.
>
> ⚠️ **Ni un calendario dental** (apartado 15), **ni una papelera propia** (apartado 16), **ni otro
> inventario de productos** (apartado 3): tres líneas de catálogo en `papelera.js`, una entrada más en
> `eventosDerivados` y el catálogo global de la Fase 17. Cuarto módulo de Estilo de Hombre que entra
> en el calendario general por la misma puerta.
>
> ⚠️ **Consejos GENERALES, nunca un diagnóstico** (apartado 11): son frases fijas, iguales para todo
> el mundo, y **no miran sus datos** — eso es justo lo que las mantiene generales. Hay una prueba de
> que el panel devuelve la lista tal cual.
>
> ⚠️ **Y la cuenta de la semana se DERIVA** (apartado 9): *"esta semana: 10 rutinas realizadas"* sale
> de lo hecho, no de un contador. Con cero se dice *"todavía no"*, no *"0 rutinas"*.
>
> ⚠️ **Dos pruebas con bomba de relojería, desactivadas:** `test-estilo-hombre.mjs` comprobaba
> `MODULOS_EH.length === 13` **nueve veces**, y su propio Test 7 se llama *"un estado viejo no se
> rompe al crecer el catálogo"*. Ahora comprueba que estén los trece que escribió Josué, y compara
> contra el tamaño real.

- [x] ACTIVACIÓN
- [x] HIGIENE DIARIA
- [x] PRODUCTOS
- [x] FRECUENCIA
- [x] RECORDATORIOS
- [x] CAMBIO DE CEPILLO
- [x] REVISIONES DENTALES
- [x] RECORDATORIO DE REVISIÓN
- [x] SEGUIMIENTO
- [x] RACHAS
- [x] CONSEJOS
- [x] PRODUCTOS RECOMENDADOS
- [x] COMPRAS
- [x] DESACTIVAR
- [x] CALENDARIO
- [x] ELIMINACIÓN
- [x] PRUEBAS
- [x] Activar higiene.
- [x] Crear rutina.
- [x] Editar pasos.
- [x] Registrar productos.
- [x] Programar cambio de cepillo.
- [x] Crear revisión.
- [x] Añadir recordatorio.
- [x] Añadir evento al calendario.
- [x] Activar/desactivar seguimiento.
- [x] Utilizar rachas globales.
- [x] Desactivar cada plaquita individualmente.
- [x] Reactivar.
- [x] Eliminar.
- [x] Recuperar.
- [x] Comprobar que no hay calendarios/productos/rachas duplicados.

#### EH · Fase 24/65 — PERFUMES Y FRAGANCIAS: PERFIL PERSONAL ✅ COMPLETADA (v1.87.0)

> **`src/lib/perfumes.js`** (147 comprobaciones) + la pantalla `PerfumesEH`. Sin SQL nuevo.
>
> ⚠️ **Los aromas son un dato COMPARTIDO, y se declaran aquí.** El apartado 6 de la **Fase 18**
> pregunta *"¿qué tipo de aromas te gustan?"* con casi las mismas opciones, y ésta es la fase dedicada
> a las fragancias. Así que `aromasFavoritos` y `aromasQueNoGustan` entran en el **registro de la Fase
> 4** con `usan: ['perfumes', 'cuerpo', 'productos']`, y la Fase 18 **los leerá** en vez de volver a
> preguntarlos. Tercera vez que este registro evita una pregunta repetida antes de escribirla.
>
> ⚠️ **Lo que NO le gusta pesa tanto como lo que le gusta.** El apartado 3 empieza con *"muy
> importante"*: *"servirá para **evitar** recomendaciones que no encajen"*. Por eso
> `chocaConSusGustos()` existe ya, aunque las recomendaciones lleguen en la 25 — y lo dice **con sus
> palabras**: *"dijiste que preferías evitar…"*, no *"no te gusta"*.
>
> ⚠️ **"Mi perfume actual" NO es "mi favorito"** (apartado 12, con esas palabras). Son dos campos
> distintos, ninguno se deduce del otro, y hay una prueba en las dos direcciones — también en el
> navegador.
>
> ⚠️ **Los perfumes usan el catálogo global** (apartado 17): aquí se guarda lo que es del perfume
> —sus aromas, sus ocasiones, su temporada— y **el id** del producto si lo enlazó. Nunca su ficha, y
> **ni una tienda ni un precio**: *"la idea no es convertirlo en una tienda de perfumes"*.
>
> ⚠️ **Y el normalizador limpia lo que apunta a la nada**: borrar un perfume deja de hacerlo "el
> actual" y saca su ocasión, en vez de guardar un id colgando que mentiría.

- [x] ACTIVACIÓN
- [x] PERFIL DE FRAGANCIA
- [x] AROMAS QUE NO LE GUSTAN
- [x] INTENSIDAD
- [x] DURACIÓN
- [x] OCASIONES
- [x] ESTACIONES
- [x] PRESUPUESTO
- [x] PERFUMES QUE YA TIENE
- [x] FAVORITOS
- [x] VALORACIÓN
- [x] PERFUME ACTUAL
- [x] PERFUME PARA CADA OCASIÓN
- [x] PERFUMES QUE QUIERE PROBAR
- [x] HISTORIAL
- [x] RECOMENDACIONES
- [x] PRODUCTOS
- [x] DESACTIVACIÓN
- [x] PRUEBAS
- [x] Activar módulo.
- [x] Configurar gustos.
- [x] Configurar disgustos.
- [x] Añadir perfume.
- [x] Marcar favorito.
- [x] Valorar.
- [x] Asignar ocasión.
- [x] Asignar temporada.
- [x] Crear lista “Quiero probar”.
- [x] Configurar perfume actual.
- [x] Consultar historial.
- [x] Ver recomendaciones.
- [x] Desactivar partes.
- [x] Reactivar.
- [x] Comprobar que no se duplica el catálogo de productos.

#### EH · Fase 25/65 — PERFUMES: RECOMENDACIONES, OCASIONES Y COLECCIÓN ✅ COMPLETADA (v1.88.0)

> **`src/lib/recomendacionesPerfumes.js`** (122 comprobaciones) + la pantalla
> `RecomendacionesPerfumesEH`. Sin SQL nuevo.
>
> ⚠️ **No es una puntuación: es una explicación.** El apartado 7 dibuja la recomendación con su
> porqué —*"encaja con tus preferencias y lo has marcado como adecuado para ocasiones nocturnas"*—,
> así que cada motivo es **una frase entera** y el que no tiene ninguna **no se propone**.
>
> ⚠️ **"Otra opción" tiene memoria, y POR OCASIÓN** (apartado 8). Descartar un perfume para la noche
> **no lo descarta para el trabajo**, y el descarte **caduca a los 30 días**: *"no repetir
> continuamente"* no es *"nunca más"*.
>
> ⚠️ **"No repetir" BAJA de sitio, no esconde** (apartado 11). Un perfume usado hace poco pierde
> posiciones, pero si es el único que encaja **se propone igual y se dice cuándo lo usó**. Esconderlo
> sería decidir por él.
>
> ⚠️ **La rotación y las estadísticas son opt-in**, con esas palabras en los apartados 10 y 17
> (*"pero solamente si el usuario activa esta función"*). Nacen apagadas y, si lo están, devuelven
> **`null` — no una lista vacía**: apagada y vacía son dos cosas distintas.
>
> ⚠️ **La tabla de comparar es la del motor de la Fase 17.** Cuarta del proyecto, y ni una línea
> nueva de mecánica: el tope de tres, la raya para lo que no se sabe y *"la comparación no elige"* ya
> estaban. Lo único de esta fase son sus cuatro filas.
>
> ⚠️ **Y la compra es la del catálogo global** (apartados 14 y 15): tienda, precio, enlace y
> afiliación salen de la ficha de la Fase 17 por el `productoId`. **Ni un precio guardado aquí.**
>
> ⚠️ **Sin ni un uso registrado NO hay "más utilizado"** (apartado 17): todos empatan a cero, y
> nombrar a uno sería inventarlo. Se dice que cuando apunte algo, se verá.

- [x] PLAQUITA «MIS PERFUMES»
- [x] AÑADIR PERFUME
- [x] DISPONIBILIDAD
- [x] PERFUME ACTIVO
- [x] OCASIONES
- [x] TEMPORADA
- [x] RECOMENDACIÓN
- [x] OTRA OPCIÓN
- [x] COMPARACIÓN
- [x] ROTACIÓN
- [x] NO REPETIR
- [x] PERFUMES FAVORITOS
- [x] QUIERO PROBAR
- [x] RECOMENDACIONES DE COMPRA
- [x] ALTERNATIVAS
- [x] HISTORIAL
- [x] ESTADÍSTICAS
- [x] DESACTIVACIÓN
- [x] PRUEBAS
- [x] Añadir perfume.
- [x] Añadir manualmente.
- [x] Marcar favorito.
- [x] Seleccionar actual.
- [x] Asignar ocasión.
- [x] Asignar temporada.
- [x] Recomendar.
- [x] Pedir otra opción.
- [x] Comparar.
- [x] Activar rotación.
- [x] Evitar repetición.
- [x] Gestionar colección.
- [x] Añadir “Quiero probar”.
- [x] Ver alternativas.
- [x] Consultar historial.
- [x] Desactivar partes.
- [x] Reactivar.
- [x] Comprobar integración con catálogo global.

#### EH · Fase 26/65 — ACCESORIOS Y ESTILO PERSONAL ✅ COMPLETADA (v1.89.0)

> **`src/lib/accesorios.js`** (237 comprobaciones) + la pantalla `AccesoriosEH`. Sin SQL nuevo.
>
> ⚠️ **Un accesorio ES una prenda del Armario.** El objetivo lo dice con mayúsculas —*"NO crear otro
> armario"*— y el armario ya tenía la categoría `accesorios` desde AR F1. Así que el reloj vive
> **allí, una sola vez**, y lo que se guarda aquí es un **envoltorio** con lo que el armario no sabe:
> estilo, ocasiones, con qué combina y el id del producto. `CAMPOS_DE_LA_PRENDA` es esa frontera
> escrita, y hay una prueba por cada uno de sus quince campos.
>
> ⚠️ **Añadir un accesorio ESCRIBE EN EL ARMARIO.** `prepararAltaAccesorio` devuelve un plan con las
> dos piezas y quien guarda es App.jsx, que es el dueño de los dos almacenes. La prenda se construye
> con `crearPrenda`, la fábrica del armario. En el navegador se comprueba que se escriben **los dos**.
>
> ⚠️ **El duplicado se comprueba ANTES** (apartado 3). Con el nombre repetido **no hay plan**: se
> devuelve la prenda encontrada para ofrecer usarla, y crear otra igual exige `forzarNueva`. Sin
> valor por defecto: elegir por él sería crear la copia que el apartado prohíbe.
>
> ⚠️ **La combinación es una preferencia, no un outfit** (apartado 9). Devuelve **una frase**; ni
> `crearOutfit(` aparece en el archivo, y hay una prueba que lee el código.
>
> ⚠️ **Ni otra lista de estilos ni otra de ocasiones.** Los siete estilos del apartado 5 ya estaban en
> `ESTILOS_VESTIR` (F6) y las siete ocasiones del apartado 6 en `OCASIONES` (F24): se importan, y las
> ocasiones son un subconjunto declarado por sus ids.
>
> ⚠️ **El favorito es el de la prenda** (apartado 7). `alternarFavoritoAccesorio` **no devuelve un
> estado de Estilo de hombre**: devuelve un armario. Es la manera de que no haya dos.
>
> ⚠️ **Y "estoy usando" es una LISTA** (apartado 8): un reloj y unas gafas se llevan a la vez, al
> revés que el perfume de la F24.
>
> 🐛 **Un fallo real, cazado por la prueba:** `restaurarAccesorio` escribía el `{ moduloActualizado,
> yaExistia }` entero en vez de `r.moduloActualizado`, así que recuperar un accesorio de la papelera
> **se habría llevado por delante todo el módulo**.

- [x] ACTIVACIÓN
- [x] QUÉ QUIERE GESTIONAR
- [x] IMPORTANTE: CONEXIÓN CON ARMARIO
- [x] AÑADIR ACCESORIO
- [x] ESTILO
- [x] OCASIONES
- [x] FAVORITOS
- [x] ACCESORIO ACTUAL
- [x] COMBINACIONES
- [x] RECOMENDACIONES
- [x] QUÉ NO HACEMOS
- [x] PRODUCTOS
- [x] LISTA DE DESEADOS
- [x] DESACTIVACIÓN INDIVIDUAL
- [x] PRUEBAS
- [x] Activar accesorios.
- [x] Seleccionar categorías.
- [x] Añadir accesorio.
- [x] Editarlo.
- [x] Añadir preferencias.
- [x] Marcar favorito.
- [x] Añadir a deseos.
- [x] Asociarlo al catálogo.
- [x] Comprobar duplicados con Armario.
- [x] Desactivar una categoría.
- [x] Reactivarla.
- [x] Desactivar todo.
- [x] Reactivar.
- [x] Comprobar persistencia.
- [x] Probar móvil.

#### EH · Fase 27/65 — GUSTOS, INTERESES Y COSAS QUE QUIERO HACER ✅ COMPLETADA (v1.90.0)

> **`src/lib/gustos.js`** (191 comprobaciones) + la pantalla `GustosEH`. Sin SQL nuevo.
>
> ⚠️ **"Cosas que te gustan" y "cosas que te gustaría hacer" YA EXISTÍAN.** Están en el registro de
> la **Fase 4** desde la **Fase 6** —`intereses` y `quiereHacer`, las dos con `libre: true`— y el
> perfil de estilo las pregunta. Así que esta fase **no crea una segunda lista**: guarda la **ficha**
> de cada cosa y **deja los nombres donde ya vivían**. Lo que él escribió en el perfil sale aquí como
> una entrada suelta con un botón para completarla. **Cuarta vez** que el registro evita un duplicado.
>
> ⚠️ **Borrar y renombrar sacan el nombre del registro.** Sin eso, borrar "Fútbol" lo devolvía como
> entrada suelta del perfil: el módulo diría que ya no le gusta y el perfil seguiría diciendo que sí.
> Lo cazó la prueba.
>
> ⚠️ **"Quiero hacer" NO es una tarea** (apartado 4, con esas palabras). El módulo no importa nada de
> Productividad, y hay una prueba que lee el código. Y se le dice **en la pantalla**, no solo aquí.
>
> ⚠️ **El estado es SOLO de "Quiero hacer"** (apartado 6). Un "Me gusta" no lo tiene: dárselo obligaría
> a decidir qué significa *"ya lo hice"* sobre *"me gusta el fútbol"*. Y **"Ya lo hice" no borra nada**
> —*"permite conservar el historial"*—, solo deja de salir en el calendario.
>
> ⚠️ **La fecha llega al calendario, pero nadie crea un evento** (apartado 7): derivados, de solo
> lectura, filtrados por el rango pedido y por la puerta que ya usan Pelo, Piel, Barba y Sonrisa.
>
> ⚠️ **"Mis preferencias" no es una cuarta lista.** El apartado 1 la nombra y no la define en ningún
> sitio; el registro de la Fase 4 ya clasifica las suyas con `clase: 'preferencia'`. Es una **vista de
> solo lectura** que dice dónde se cambia cada cosa, como la Fase 12 con `tiempoPelo`.
>
> ⚠️ **La nota es corta y lo extenso es del Diario** (apartado 10): la pantalla **lleva** al Diario;
> no copia nada allí ni trae nada de allí.
>
> ⚠️ **Y `paraPersonalizar()` devuelve, no aplica** (apartado 11): *"nunca modificar automáticamente
> otros módulos"*, con `soloLectura: true` escrito en el propio dato.

- [x] PLAQUITA PRINCIPAL
- [x] CATEGORÍAS
- [x] PRIORIDAD
- [x] ESTADO
- [x] FECHA
- [x] LUGARES
- [x] FAVORITOS
- [x] NOTAS
- [x] CONEXIÓN CON EL RESTO DE JC FITNESS
- [x] EJEMPLO
- [x] DESACTIVAR
- [x] ELIMINAR
- [x] PRUEBAS
- [x] Añadir gusto.
- [x] Editarlo.
- [x] Eliminarlo.
- [x] Recuperarlo.
- [x] Añadir interés.
- [x] Añadir algo que quiere hacer.
- [x] Cambiar estado.
- [x] Añadir fecha.
- [x] Conectarlo con calendario.
- [x] Añadir favorito.
- [x] Añadir nota.
- [x] Abrir nota extensa en Diario.
- [x] Desactivar cada plaquita.
- [x] Reactivar.
- [x] Comprobar persistencia.

#### EH · Fase 28/65 — OBJETIVOS Y EXPERIENCIAS PERSONALES
- [ ] DESDE «QUIERO HACER»
- [ ] UTILIZAR OBJETIVOS GLOBAL
- [ ] INFORMACIÓN
- [ ] EXPERIENCIAS
- [ ] COMPLETADO
- [ ] DIARIO
- [ ] FOTOS
- [ ] CALENDARIO
- [ ] RECORDATORIOS
- [ ] PROGRESO
- [ ] FAVORITOS
- [ ] DESACTIVACIÓN
- [ ] ELIMINACIÓN
- [ ] PRUEBAS
- [ ] Crear “Quiero hacer”.
- [ ] Convertirlo en objetivo.
- [ ] Abrir Objetivos global.
- [ ] Añadir fecha.
- [ ] Añadir calendario.
- [ ] Crear recordatorio.
- [ ] Completar objetivo.
- [ ] Actualizar automáticamente “Ya lo hice”.
- [ ] Abrir Diario.
- [ ] Añadir fotos mediante sistema existente.
- [ ] Desactivar módulo.
- [ ] Reactivarlo.
- [ ] Comprobar que no se duplican objetivos, tareas, calendario, diario ni fotos.

#### EH · Fase 29/65 — PERFIL DE ESTILO PERSONAL
- [ ] PLAQUITA «MI ESTILO»
- [ ] PERFIL VISUAL
- [ ] PREFERENCIAS GENERALES
- [ ] COLORES
- [ ] ESTILO DE ROPA
- [ ] CUIDADO PERSONAL
- [ ] PERFUMES
- [ ] ACCESORIOS
- [ ] GUSTOS
- [ ] COMPLETAMENTE OPCIONAL
- [ ] PERSONALIZACIÓN
- [ ] ORDEN
- [ ] Skincare.
- [ ] Pelo.
- [ ] Perfumes.
- [ ] Barba.
- [ ] Armario.
- [ ] Accesorios.
- [ ] ESTADO DE CONFIGURACIÓN
- [ ] NO CREAR UN «TEST DE ESTILO»
- [ ] PRIVACIDAD Y CONTROL
- [ ] PRUEBAS
- [ ] Entrar sin datos.
- [ ] Entrar con un solo módulo.
- [ ] Activar varios.
- [ ] Mostrar resumen.
- [ ] Cambiar preferencias.
- [ ] Comprobar actualización automática.
- [ ] Reordenar plaquitas.
- [ ] Ocultar una.
- [ ] Reactivarla.
- [ ] Desactivar “Mi estilo”.
- [ ] Comprobar que los módulos originales siguen intactos.
- [ ] Verificar que no existen datos duplicados.

#### EH · Fase 30/65 — PANTALLA PRINCIPAL Y ORGANIZACIÓN
- [ ] CABECERA
- [ ] PLAQUITAS PRINCIPALES
- [ ] DISEÑO DE PLAQUITAS
- [ ] ESTADO
- [ ] ORDEN PERSONALIZABLE
- [ ] MENOS ES MÁS
- [ ] ACCESO RÁPIDO
- [ ] PERSONALIZACIÓN TOTAL
- [ ] REORDENAR
- [ ] ANIMACIONES
- [ ] VACÍO INICIAL
- [ ] PROGRESIVIDAD
- [ ] NO DUPLICAR INFORMACIÓN
- [ ] CONFIGURACIÓN GLOBAL
- [ ] ELIMINACIÓN
- [ ] PRUEBAS DE UX
- [ ] Usuario nuevo.
- [ ] Usuario con un módulo.
- [ ] Usuario con 5 módulos.
- [ ] Usuario con todos.
- [ ] Ocultar.
- [ ] Mostrar.
- [ ] Reordenar.
- [ ] Añadir.
- [ ] Quitar.
- [ ] Accesos rápidos.
- [ ] Modo oscuro.
- [ ] Pantallas pequeñas.
- [ ] Pantallas grandes.
- [ ] Rotación.
- [ ] Animaciones.
- [ ] Persistencia.

#### EH · Fase 31/65 — PERSONALIZACIÓN PROFUNDA DE LAS PLAQUITAS
- [ ] MODO «PERSONALIZAR»
- [ ] CADA PLAQUITA
- [ ] ARRASTRAR
- [ ] TAMAÑO
- [ ] CONTENIDO
- [ ] ACCESOS RÁPIDOS
- [ ] LÍMITE DE ACCESOS
- [ ] OCULTAR
- [ ] RECUPERAR
- [ ] RESTABLECER
- [ ] CONFIGURACIÓN POR USUARIO
- [ ] NO AFECTAR A OTROS MÓDULOS
- [ ] DATOS CONSERVADOS
- [ ] ANIMACIONES
- [ ] MÓVIL
- [ ] PREVENIR ERRORES
- [ ] PERSONALIZACIÓN RÁPIDA
- [ ] PRUEBAS
- [ ] Mover.
- [ ] Ocultar.
- [ ] Mostrar.
- [ ] Cambiar tamaño.
- [ ] Cambiar contenido.
- [ ] Crear acceso rápido.
- [ ] Eliminar acceso rápido.
- [ ] Restablecer.
- [ ] Salir y volver a entrar.
- [ ] Cerrar sesión y volver.
- [ ] Probar otro dispositivo.
- [ ] Modo oscuro.
- [ ] Pantalla pequeña.
- [ ] Comprobar que los datos internos no cambian.

#### EH · Fase 32/65 — RECOMENDACIONES GENERALES DE ESTILO
- [ ] PLAQUITA
- [ ] TIPO DE CONSEJO
- [ ] NO REPETIR
- [ ] ACCIONES
- [ ] FRECUENCIA
- [ ] CONSEJO EXPLICADO
- [ ] PERSONALIZACIÓN
- [ ] CONSEJOS SUBJETIVOS
- [ ] CONSEJOS DE PRODUCTOS
- [ ] CONSEJOS DE OUTFITS
- [ ] CONSEJOS DE RUTINA
- [ ] DIARIO
- [ ] GUARDAR CONSEJO
- [ ] OCULTAR SISTEMA
- [ ] PRIVACIDAD
- [ ] PRUEBAS
- [ ] Activar recomendaciones.
- [ ] Recibir sugerencia.
- [ ] Ver motivo.
- [ ] Marcar “me interesa”.
- [ ] Marcar “no me interesa”.
- [ ] Marcar “ya lo hago”.
- [ ] Guardar.
- [ ] Abrir módulo relacionado.
- [ ] Abrir Diario.
- [ ] Desactivar recomendaciones.
- [ ] Reactivarlas.
- [ ] Comprobar que no se repiten innecesariamente.
- [ ] Comprobar que no aparecen recomendaciones contradictorias.

#### EH · Fase 33/65 — DESCUBRIR E INSPIRACIÓN
- [ ] PLAQUITA «DESCUBRIR»
- [ ] QUÉ PUEDE DESCUBRIR
- [ ] TARJETAS PEQUEÑAS
- [ ] PERSONALIZACIÓN
- [ ] FILTROS
- [ ] GUARDAR
- [ ] ABRIR MÓDULO
- [ ] PRODUCTOS
- [ ] SIN COMPRAS FORZADAS
- [ ] FRECUENCIA
- [ ] OCULTAR
- [ ] CONTENIDO REPETIDO
- [ ] CONTENIDO SUBJETIVO
- [ ] SIN RED SOCIAL
- [ ] PRUEBAS
- [ ] Activar Descubrir.
- [ ] Mostrar tarjetas.
- [ ] Filtrar categorías.
- [ ] Guardar.
- [ ] Descartar.
- [ ] Abrir módulo.
- [ ] Abrir producto.
- [ ] Cambiar frecuencia.
- [ ] Ocultar.
- [ ] Reactivar.
- [ ] Comprobar que no aparecen categorías desactivadas.
- [ ] Comprobar que no se duplican favoritos ni productos.

#### EH · Fase 34/65 — PERFIL Y PREFERENCIAS AVANZADAS
- [ ] PLAQUITA «MIS PREFERENCIAS»
- [ ] CATEGORÍAS
- [ ] EDITAR
- [ ] RESUMEN
- [ ] INFORMACIÓN NO CONFIGURADA
- [ ] PREFERENCIAS UTILIZADAS
- [ ] CONTROL DE RECOMENDACIONES
- [ ] BORRAR UNA PREFERENCIA
- [ ] RESTABLECER CATEGORÍA
- [ ] BORRAR TODO ESTILO
- [ ] PRIVACIDAD
- [ ] DESACTIVACIÓN
- [ ] REACTIVACIÓN
- [ ] EXPORTACIÓN
- [ ] SIN DUPLICADOS
- [ ] PRUEBAS
- [ ] Ver preferencias.
- [ ] Editarlas.
- [ ] Eliminar una.
- [ ] Restablecer categoría.
- [ ] Desactivar recomendaciones.
- [ ] Ocultar módulo.
- [ ] Reactivar módulo.
- [ ] Eliminar datos.
- [ ] Exportar.
- [ ] Comprobar que no se modifican otros módulos.
- [ ] Comprobar que no existen duplicados.

#### EH · Fase 35/65 — ESTADÍSTICAS Y PROGRESO DE ESTILO
- [ ] PLAQUITA «PROGRESO»
- [ ] NO PUNTUAR AL USUARIO
- [ ] RESUMEN
- [ ] PERIODOS
- [ ] GRÁFICOS
- [ ] OBJETIVOS
- [ ] RACHAS
- [ ] COMPARACIONES
- [ ] DATOS INCOMPLETOS
- [ ] PERSONALIZACIÓN
- [ ] DESACTIVACIÓN
- [ ] HISTORIAL
- [ ] PRIVACIDAD
- [ ] PRUEBAS
- [ ] Registrar rutina.
- [ ] Registrar afeitado.
- [ ] Registrar perfume.
- [ ] Ver estadísticas.
- [ ] Cambiar periodo.
- [ ] Ocultar una métrica.
- [ ] Ocultar todo.
- [ ] Reactivar.
- [ ] Comprobar datos sin registros.
- [ ] Comprobar integración con rachas.
- [ ] Comprobar integración con objetivos.
- [ ] Verificar que las estadísticas no duplican datos.

#### EH · Fase 36/65 — GESTIÓN GLOBAL DE MÓDULOS
- [ ] CENTRO «GESTIONAR ESTILO»
- [ ] CADA MÓDULO
- [ ] OCULTAR
- [ ] DESACTIVAR
- [ ] ELIMINAR
- [ ] RECUPERACIÓN
- [ ] REACTIVAR
- [ ] RESTABLECER
- [ ] ACTIVACIÓN POR PARTES
- [ ] MÓDULOS OBLIGATORIOS
- [ ] DEPENDENCIAS
- [ ] NO BORRAR POR DESACTIVAR
- [ ] CONFIGURACIÓN POR DEFECTO
- [ ] BÚSQUEDA
- [ ] ORDEN
- [ ] INDICADOR DE ESTADO
- [ ] PRUEBAS CRÍTICAS
- [ ] Ocultar módulo.
- [ ] Volver a mostrarlo.
- [ ] Desactivarlo.
- [ ] Reactivarlo.
- [ ] Eliminarlo.
- [ ] Recuperarlo.
- [ ] Eliminarlo definitivamente.
- [ ] Restablecer diseño.
- [ ] Comprobar que los datos no se pierden al ocultar.
- [ ] Comprobar que no se pierden al desactivar.
- [ ] Comprobar dependencias.
- [ ] Comprobar móvil.
- [ ] Cerrar sesión.
- [ ] Volver a entrar.
- [ ] Comprobar persistencia.

#### EH · Fase 37/65 — BUSCADOR Y NAVEGACIÓN INTERNA
- [ ] BUSCADOR
- [ ] RESULTADOS AGRUPADOS
- [ ] BÚSQUEDA RÁPIDA
- [ ] SIN RESULTADOS
- [ ] ACCESOS RECIENTES
- [ ] FAVORITOS
- [ ] NAVEGACIÓN INTERNA
- [ ] BREADCRUMBS MÓVILES
- [ ] BOTÓN «VOLVER»
- [ ] ENLACES ENTRE MÓDULOS
- [ ] BÚSQUEDA GLOBAL
- [ ] RESULTADOS CONTEXTUALES
- [ ] MÓDULOS OCULTOS
- [ ] MÓDULOS DESACTIVADOS
- [ ] ELIMINADOS
- [ ] RENDIMIENTO
- [ ] PRUEBAS
- [ ] Buscar módulo.
- [ ] Buscar elemento.
- [ ] Buscar producto.
- [ ] Buscar favorito.
- [ ] Buscar un módulo oculto.
- [ ] Buscar uno desactivado.
- [ ] Buscar elemento eliminado.
- [ ] Búsqueda sin resultados.
- [ ] Resultados parciales.
- [ ] Abrir resultado.
- [ ] Volver atrás.
- [ ] Mantener posición anterior.
- [ ] Probar teclado móvil.
- [ ] Probar modo oscuro.
- [ ] Comprobar que no se duplican resultados.

#### EH · Fase 38/65 — NOTIFICACIONES Y RECORDATORIOS
- [ ] CENTRO DE NOTIFICACIONES
- [ ] TIPOS DE AVISO
- [ ] NADA AUTOMÁTICO SIN PERMISO
- [ ] CREAR RECORDATORIO
- [ ] REPETICIÓN
- [ ] SILENCIAR
- [ ] HORARIO DE SILENCIO
- [ ] LÍMITE DE NOTIFICACIONES
- [ ] NOTIFICACIONES INTELIGENTES
- [ ] RECOMENDACIONES
- [ ] CONTROL GLOBAL
- [ ] DESACTIVACIÓN TOTAL
- [ ] HISTORIAL
- [ ] ACCIÓN DESDE LA NOTIFICACIÓN
- [ ] PRUEBAS
- [ ] Activar aviso.
- [ ] Crear recordatorio.
- [ ] Programarlo.
- [ ] Recibirlo.
- [ ] Abrirlo.
- [ ] Comprobar que lleva al módulo correcto.
- [ ] Silenciar categoría.
- [ ] Desactivar todo.
- [ ] Reactivar.
- [ ] Probar repetición.
- [ ] Probar varios avisos.
- [ ] Comprobar agrupación.
- [ ] Comprobar horario de silencio.
- [ ] Comprobar persistencia.

#### EH · Fase 39/65 — INTEGRACIÓN CON EL RESTO DE JC FITNESS
- [ ] CALENDARIO 📅
- [ ] OBJETIVOS 🎯
- [ ] TAREAS ✅
- [ ] RECORDATORIOS 🔔
- [ ] FAVORITOS ❤️
- [ ] PRODUCTOS 🛒
- [ ] ARMARIO 👕
- [ ] DIARIO 📝
- [ ] FOTOS 📷
- [ ] RACHAS 🔥
- [ ] SONIDOS 🔊
- [ ] ELIMINADOS 🗑️
- [ ] BÚSQUEDA 🔍
- [ ] NOTIFICACIONES 🔔
- [ ] AJUSTES ⚙️
- [ ] AUTENTICACIÓN 👤
- [ ] SINCRONIZACIÓN ☁️
- [ ] FUENTE ÚNICA DE VERDAD
- [ ] ELIMINACIÓN EN CASCADA
- [ ] DESACTIVACIÓN
- [ ] PRUEBA MAESTRA

#### EH · Fase 40/65 — PRIMER USO Y CONFIGURACIÓN INICIAL
- [ ] PRIMERA ENTRADA
- [ ] SALTAR
- [ ] CONFIGURACIÓN PROGRESIVA
- [ ] NADA DE «PERFIL 100%»
- [ ] PANTALLA RESULTANTE
- [ ] RECOMENDACIONES INICIALES
- [ ] APRENDER CON EL USO
- [ ] VOLVER A CONFIGURAR
- [ ] USUARIO QUE YA TIENE DATOS
- [ ] IMPORTAR
- [ ] USUARIO QUE NO QUIERE NADA
- [ ] VOLVER MÁS TARDE
- [ ] TUTORIAL
- [ ] Plaquitas.
- [ ] Personalización.
- [ ] Conexiones con otros módulos.
- [ ] Cómo ocultar/desactivar.
- [ ] RECORDAR EL ESTADO
- [ ] PRUEBAS
- [ ] Usuario nuevo.
- [ ] Empezar.
- [ ] Seleccionar un módulo.
- [ ] Seleccionar varios.
- [ ] Saltar.
- [ ] Salir.
- [ ] Volver.
- [ ] Añadir posteriormente módulos.
- [ ] Usuario con datos existentes.
- [ ] Importar referencias.
- [ ] Comprobar que no hay duplicados.
- [ ] Repetir tutorial.
- [ ] Saltar tutorial.
- [ ] Comprobar persistencia.

#### EH · Fase 41/65 — ESTADOS VACÍOS, CARGA, ERRORES Y RECUPERACIÓN
- [ ] SIN DATOS
- [ ] PRIMERA VEZ
- [ ] CARGANDO
- [ ] ERROR DE CONEXIÓN
- [ ] MODO SIN CONEXIÓN
- [ ] ERROR DE GUARDADO
- [ ] EVITAR PÉRDIDA DE DATOS
- [ ] SINCRONIZACIÓN
- [ ] CONFLICTOS
- [ ] MÓDULO DESACTIVADO
- [ ] ELEMENTO ELIMINADO
- [ ] PERMISO DENEGADO
- [ ] ERROR IRRECUPERABLE
- [ ] DATOS CORRUPTOS
- [ ] ACCIONES DESTRUCTIVAS
- [ ] FEEDBACK VISUAL
- [ ] PRUEBAS
- [ ] Sin datos.
- [ ] Sin conexión.
- [ ] Con conexión lenta.
- [ ] Error de servidor.
- [ ] Error de guardado.
- [ ] Sincronización.
- [ ] Conflicto.
- [ ] Permiso denegado.
- [ ] Elemento eliminado.
- [ ] Módulo desactivado.
- [ ] Recuperación.
- [ ] Reintento.
- [ ] Cierre durante guardado.
- [ ] Volver a abrir.
- [ ] Comprobar que no se pierden datos.

#### EH · Fase 42/65 — ACCESIBILIDAD Y USABILIDAD
- [ ] BOTONES
- [ ] PLAQUITAS
- [ ] TEXTO
- [ ] ICONOS
- [ ] CONTRASTE
- [ ] COLOR
- [ ] ANIMACIONES
- [ ] NAVEGACIÓN
- [ ] SCROLL
- [ ] TECLADO
- [ ] FORMULARIOS
- [ ] ERRORES
- [ ] CONFIRMACIONES
- [ ] ACCESIBILIDAD DEL TEXTO
- [ ] TAMAÑO DE FUENTE
- [ ] ORIENTACIÓN
- [ ] DISPOSITIVOS
- [ ] RENDIMIENTO
- [ ] PRUEBAS
- [ ] Modo claro.
- [ ] Modo oscuro.
- [ ] Texto grande.
- [ ] Lector de pantalla.
- [ ] Teclado abierto.
- [ ] Pantalla pequeña.
- [ ] Pantalla grande.
- [ ] Scroll.
- [ ] Arrastrar plaquitas.
- [ ] Formularios.
- [ ] Errores.
- [ ] Confirmaciones.
- [ ] Animaciones.
- [ ] Rotación.
- [ ] Rendimiento.

#### EH · Fase 43/65 — SEGURIDAD, PRIVACIDAD Y CONTROL DE DATOS
- [ ] DATOS PRIVADOS
- [ ] CUENTA
- [ ] ACCESO
- [ ] PRIVACIDAD POR MÓDULO
- [ ] DATOS SENSIBLES
- [ ] ELIMINAR
- [ ] RECUPERAR
- [ ] ELIMINACIÓN DEFINITIVA
- [ ] EXPORTAR
- [ ] SINCRONIZACIÓN SEGURA
- [ ] PRODUCTOS Y AFILIACIÓN
- [ ] ANALÍTICA
- [ ] BORRADO DE CUENTA
- [ ] COPIAS DE SEGURIDAD
- [ ] SESIONES
- [ ] PRUEBAS
- [ ] Crear datos.
- [ ] Cerrar sesión.
- [ ] Iniciar sesión.
- [ ] Verificar recuperación.
- [ ] Probar otro dispositivo.
- [ ] Eliminar.
- [ ] Recuperar.
- [ ] Eliminar definitivamente.
- [ ] Exportar.
- [ ] Comprobar permisos.
- [ ] Comprobar privacidad.
- [ ] Eliminar cuenta en entorno de pruebas.
- [ ] Verificar que no quedan datos accesibles.

#### EH · Fase 44/65 — RENDIMIENTO Y OPTIMIZACIÓN
- [ ] CARGAR SOLO LO NECESARIO
- [ ] CARGA PROGRESIVA
- [ ] LISTAS GRANDES
- [ ] FOTOS
- [ ] CACHÉ
- [ ] DATOS LOCALES
- [ ] SINCRONIZACIÓN EFICIENTE
- [ ] DEBOUNCE
- [ ] ANIMACIONES
- [ ] MEMORIA
- [ ] COMPONENTES
- [ ] DATOS DUPLICADOS
- [ ] ACTUALIZACIONES
- [ ] ERROR DE RENDIMIENTO
- [ ] DISPOSITIVOS ANTIGUOS
- [ ] PRUEBAS DE CARGA
- [ ] PRUEBAS DE RED
- [ ] PRUEBAS DE MEMORIA

#### EH · Fase 45/65 — ESTRUCTURA INTERNA DE DATOS
- [ ] USUARIO
- [ ] MÓDULOS
- [ ] CONFIGURACIÓN DE PLAQUITAS
- [ ] PREFERENCIAS
- [ ] GUSTOS
- [ ] EXPERIENCIAS
- [ ] RELACIONES
- [ ] ELIMINACIÓN
- [ ] HISTORIAL
- [ ] FECHAS
- [ ] SINCRONIZACIÓN
- [ ] CONFLICTOS
- [ ] SEGURIDAD
- [ ] ESCALABILIDAD
- [ ] NO SOBREDISEÑAR
- [ ] PRUEBAS
- [ ] Crear registro.
- [ ] Modificarlo.
- [ ] Eliminarlo.
- [ ] Recuperarlo.
- [ ] Sincronizarlo.
- [ ] Abrirlo desde otro dispositivo.
- [ ] Relacionarlo con otro módulo.
- [ ] Eliminar la relación.
- [ ] Comprobar permisos.
- [ ] Comprobar que no existen duplicados.

#### EH · Fase 46/65 — MIGRACIÓN Y COMPATIBILIDAD
- [ ] NO REHACER LA APP
- [ ] ANALIZAR ANTES DE MODIFICAR
- [ ] MAPEAR DATOS EXISTENTES
- [ ] MIGRACIÓN
- [ ] BACKUP ANTES DE MIGRAR
- [ ] COMPATIBILIDAD
- [ ] FUNCIONES ANTIGUAS
- [ ] DUPLICADOS
- [ ] VERSIONADO
- [ ] MIGRACIONES FUTURAS
- [ ] USUARIO ANTIGUO
- [ ] USUARIO NUEVO
- [ ] MIGRACIÓN PARCIAL
- [ ] DATOS INCOMPATIBLES
- [ ] PRUEBAS
- [ ] FALLA DURANTE MIGRACIÓN
- [ ] DESPLIEGUE
- [ ] COMPATIBILIDAD CON SUPABASE
- [ ] COMPATIBILIDAD ENTRE VERSIONES
- [ ] PRUEBA FINAL

#### EH · Fase 47/65 — PRUEBAS INTEGRALES
- [ ] PRUEBA DE ENTRADA
- [ ] PRUEBA DE PLAQUITAS
- [ ] PRUEBA DE ACTIVACIÓN
- [ ] PRUEBA DE ELIMINACIÓN
- [ ] PRUEBA DE OBJETIVOS
- [ ] PRUEBA DE CALENDARIO
- [ ] PRUEBA DE DIARIO
- [ ] PRUEBA DE FAVORITOS
- [ ] PRUEBA DE PRODUCTOS
- [ ] PRUEBA DE NOTIFICACIONES
- [ ] PRUEBA DE RECOMENDACIONES
- [ ] PRUEBA DE BÚSQUEDA
- [ ] PRUEBA DE PERFIL
- [ ] PRUEBA DE ESTADÍSTICAS
- [ ] PRUEBA DE DESCONEXIÓN
- [ ] PRUEBA DE DOS DISPOSITIVOS
- [ ] PRUEBA DE CONFLICTO
- [ ] PRUEBA DE CUENTA
- [ ] PRUEBA DE USUARIO NUEVO
- [ ] PRUEBA DE USUARIO AVANZADO
- [ ] PRUEBA DE INTERFAZ
- [ ] PRUEBA DE ACCESIBILIDAD
- [ ] PRUEBA DE ERRORES
- [ ] PRUEBA DE RENDIMIENTO
- [ ] PRUEBA DE DATOS
- [ ] PRUEBA DE SEGURIDAD
- [ ] PRUEBA DE MIGRACIÓN
- [ ] PRUEBA DE ACTUALIZACIÓN
- [ ] PRUEBA DE DESINSTALACIÓN / REINSTALACIÓN
- [ ] PRUEBA FINAL DEL USUARIO

#### EH · Fase 48/65 — AUDITORÍA FINAL DE FUNCIONES Y DUPLICADOS
- [ ] INVENTARIO COMPLETO
- [ ] CLASIFICAR CADA FUNCIÓN
- [ ] REVISAR DUPLICADOS
- [ ] PLAQUITAS DUPLICADAS
- [ ] PREFERENCIAS DUPLICADAS
- [ ] DATOS DUPLICADOS
- [ ] SISTEMAS QUE DEBEN SALIR DE ESTILO
- [ ] SISTEMAS QUE DEBEN QUEDARSE
- [ ] REVISAR EL FLUJO
- [ ] REVISAR NAVEGACIÓN
- [ ] REVISAR NOMBRES
- [ ] REVISAR ICONOS
- [ ] REVISAR ACCIONES
- [ ] REVISAR CONFIGURACIÓN
- [ ] REVISAR ELIMINACIÓN
- [ ] REVISAR RECOMENDACIONES
- [ ] REVISAR ESTADÍSTICAS
- [ ] REVISAR NOTIFICACIONES
- [ ] REVISAR PANTALLA PRINCIPAL
- [ ] DOCUMENTAR DECISIONES
- [ ] NO AÑADIR FUNCIONES DURANTE LA AUDITORÍA
- [ ] RESULTADO FINAL

#### EH · Fase 49/65 — REVISIÓN VISUAL FINAL Y COHERENCIA
- [ ] IDENTIDAD JC FITNESS
- [ ] PERSONALIDAD PROPIA
- [ ] PLAQUITAS
- [ ] JERARQUÍA
- [ ] ESPACIO
- [ ] ICONOS
- [ ] MODO OSCURO
- [ ] ANIMACIONES
- [ ] ESTADOS
- [ ] BOTONES
- [ ] MODALES
- [ ] FORMULARIOS
- [ ] NAVEGACIÓN
- [ ] ICONO Y TÍTULO
- [ ] MICRODETALLES
- [ ] RESPONSIVE
- [ ] NO SOBREDECORAR
- [ ] REVISIÓN VISUAL COMPLETA
- [ ] COMPARACIÓN CON JC FITNESS
- [ ] RESULTADO

#### EH · Fase 50/65 — MICROINTERACCIONES Y ANIMACIONES
- [ ] TOCAR UNA PLAQUITA
- [ ] MANTENER PULSADO
- [ ] ARRASTRAR
- [ ] AÑADIR
- [ ] OCULTAR
- [ ] DESACTIVAR
- [ ] RECUPERAR
- [ ] GUARDAR
- [ ] ELIMINAR
- [ ] CAMBIAR TAMAÑO
- [ ] ABRIR MÓDULO
- [ ] VOLVER
- [ ] BUSCADOR
- [ ] FILTROS
- [ ] CHECKBOX / SELECTORES
- [ ] SLIDERS
- [ ] ERRORES
- [ ] ÉXITO
- [ ] CARGA
- [ ] REDUCIR ANIMACIONES
- [ ] VELOCIDAD
- [ ] CONSISTENCIA
- [ ] SIN ANIMACIONES GRATUITAS
- [ ] PRUEBA DE MICROINTERACCIONES

#### EH · Fase 51/65 — CONTROL DE CALIDAD DE LA EXPERIENCIA REAL
- [ ] PRUEBA DEL PRIMER DÍA
- [ ] PRUEBA DEL TERCER DÍA
- [ ] PRUEBA DE USO RÁPIDO
- [ ] PRUEBA DE DESCUBRIMIENTO
- [ ] PRUEBA DE SOBRECARGA
- [ ] PRUEBA DE USUARIO SIMPLE
- [ ] PRUEBA DE USUARIO AVANZADO
- [ ] PRUEBA DE PERSONALIZACIÓN
- [ ] PRUEBA DE «NO QUIERO ESTO»
- [ ] PRUEBA DE «QUIERO RECUPERARLO»
- [ ] PRUEBA DE ERRORES HUMANOS
- [ ] PRUEBA DE VELOCIDAD
- [ ] PRUEBA DE NOTIFICACIONES
- [ ] PRUEBA DE RECOMENDACIONES
- [ ] PRUEBA DE CONFIANZA
- [ ] PRUEBA DE COHERENCIA
- [ ] PRUEBA DE «¿REALMENTE HACE FALTA?»
- [ ] LISTA DE FALLOS
- [ ] PRUEBA FINAL SIN INSTRUCCIONES

#### EH · Fase 52/65 — PREPARACIÓN PARA PRODUCCIÓN
- [ ] SEPARAR ENTORNOS
- [ ] VARIABLES Y SECRETOS
- [ ] BASE DE DATOS
- [ ] BACKUP
- [ ] MIGRACIONES
- [ ] DATOS EXISTENTES
- [ ] CUENTA NUEVA
- [ ] CUENTA EXISTENTE
- [ ] PRODUCCIÓN MÓVIL
- [ ] RENDIMIENTO REAL
- [ ] MONITORIZACIÓN
- [ ] RECUPERACIÓN
- [ ] DESPLIEGUE GRADUAL
- [ ] PLAN DE RETROCESO
- [ ] CHECKLIST DE PUBLICACIÓN
- [ ] DESPUÉS DE PUBLICAR
- [ ] SI APARECE UN ERROR
- [ ] NO AÑADIR FUNCIONES POST-LANZAMIENTO SIN CONTROL

#### EH · Fase 53/65 — DOCUMENTACIÓN TÉCNICA Y MANTENIMIENTO
- [ ] DOCUMENTO DEL MÓDULO
- [ ] MAPA DE MÓDULOS
- [ ] SISTEMAS GLOBALES UTILIZADOS
- [ ] FUENTE DE CADA DATO
- [ ] ESTADOS
- [ ] ELIMINACIÓN
- [ ] ESTRUCTURA DE DATOS
- [ ] MIGRACIONES
- [ ] COMPONENTES REUTILIZABLES
- [ ] REGLAS DE DISEÑO
- [ ] REGLAS DE UX
- [ ] NOTIFICACIONES
- [ ] PRIVACIDAD
- [ ] PRUEBAS
- [ ] CAMBIOS FUTUROS
- [ ] BACKLOG
- [ ] REGLA PARA CLAUDE
- [ ] DOCUMENTACIÓN PARA MANTENIMIENTO

#### EH · Fase 54/65 — BACKUP, RESTAURACIÓN Y RECUPERACIÓN AVANZADA
- [ ] BACKUP GLOBAL
- [ ] COPIAS AUTOMÁTICAS
- [ ] BACKUP ANTES DE CAMBIOS IMPORTANTES
- [ ] RESTAURACIÓN
- [ ] NO RESTAURAR TODA LA APP SIN NECESIDAD
- [ ] RECUPERACIÓN DE UN ELEMENTO
- [ ] RECUPERACIÓN DE UN MÓDULO
- [ ] RESTAURACIÓN COMPLETA
- [ ] HISTORIAL DE CAMBIOS
- [ ] RECUPERACIÓN DE CONFIGURACIÓN
- [ ] RESTAURACIÓN Y SINCRONIZACIÓN
- [ ] CONFLICTOS DE RESTAURACIÓN
- [ ] SEGURIDAD
- [ ] EXPORTACIÓN
- [ ] IMPORTACIÓN
- [ ] PRUEBA DE RESTAURACIÓN
- [ ] PRUEBA DE DESASTRE
- [ ] REGISTRO

#### EH · Fase 55/65 — ESCALABILIDAD Y FUTURAS FUNCIONES
- [ ] MÓDULOS MODULARES
- [ ] NUEVAS PLAQUITAS
- [ ] FUNCIONES FUTURAS
- [ ] SISTEMA DE PLUGINS NO NECESARIO
- [ ] DATOS EXTENSIBLES
- [ ] CATEGORÍAS
- [ ] CONFIGURACIÓN
- [ ] INTEGRACIONES
- [ ] IA
- [ ] PERSONALIZACIÓN
- [ ] COMPATIBILIDAD
- [ ] VERSIONADO
- [ ] RENDIMIENTO
- [ ] CONTROL DE COMPLEJIDAD
- [ ] BACKLOG
- [ ] PRIORIDADES
- [ ] PRUEBA DE CRECIMIENTO

#### EH · Fase 56/65 — INTEGRACIÓN PROFUNDA CON LA IA
- [ ] CONTEXTO PERSONAL
- [ ] RECOMENDACIONES PERSONALIZADAS
- [ ] APRENDER DE LAS RESPUESTAS
- [ ] NO REPETIR
- [ ] CONTEXTO
- [ ] CONEXIÓN CON OTROS MÓDULOS
- [ ] OBJETIVOS
- [ ] IA CONVERSACIONAL
- [ ] EXPLICACIONES
- [ ] NIVEL DE CONFIANZA
- [ ] PRIVACIDAD
- [ ] CONTROL DEL USUARIO
- [ ] MEMORIA DE LA IA
- [ ] CORRECCIÓN DEL USUARIO
- [ ] EVITAR AUTOMATISMOS
- [ ] ACCIONES SUGERIDAS
- [ ] APRENDIZAJE PROGRESIVO
- [ ] PRUEBAS DE IA

#### EH · Fase 57/65 — APRENDIZAJE Y PERSONALIZACIÓN PROGRESIVA
- [ ] APRENDER DE FORMA NATURAL
- [ ] PREFERENCIAS EXPLÍCITAS
- [ ] PREFERENCIAS INFERIDAS
- [ ] CONFIRMACIÓN
- [ ] NIVEL DE CONFIANZA
- [ ] CAMBIO DE GUSTOS
- [ ] PREFERENCIAS ACTUALES
- [ ] CONTRADICCIONES
- [ ] EXPLICAR RECOMENDACIONES
- [ ] CORREGIR EL SISTEMA
- [ ] CONTROL DE MEMORIA
- [ ] BORRAR APRENDIZAJE
- [ ] NO PERFILAR EN EXCESO
- [ ] NO TOMAR DECISIONES IMPORTANTES
- [ ] APRENDIZAJE ENTRE MÓDULOS
- [ ] PRIVACIDAD
- [ ] PRUEBAS

#### EH · Fase 58/65 — INSIGHTS Y RESÚMENES INTELIGENTES
- [ ] RESUMEN PERSONAL
- [ ] EVOLUCIÓN
- [ ] CAMBIOS DESTACADOS
- [ ] HÁBITOS
- [ ] PREFERENCIAS
- [ ] OBJETIVOS
- [ ] RECOMENDACIÓN INTELIGENTE
- [ ] INSIGHTS PEQUEÑOS
- [ ] NO INVENTAR PATRONES
- [ ] CONFIDENCIALIDAD
- [ ] CONTROL DE FRECUENCIA
- [ ] INSIGHT → ACCIÓN
- [ ] HISTORIAL
- [ ] OCULTAR INSIGHTS
- [ ] ESTADÍSTICAS AVANZADAS
- [ ] IA + INSIGHTS
- [ ] COMPARACIONES
- [ ] DATOS VACÍOS

#### EH · Fase 59/65 — RESUMEN SEMANAL Y MENSUAL
- [ ] RESUMEN SEMANAL
- [ ] RESUMEN MENSUAL
- [ ] SIN INFORMACIÓN INNECESARIA
- [ ] PERSONALIZACIÓN
- [ ] CONFIGURACIÓN
- [ ] PRIVACIDAD
- [ ] NOTIFICACIÓN
- [ ] RESUMEN DENTRO DE LA APP
- [ ] ESTRUCTURA
- [ ] COMPARACIÓN
- [ ] IA
- [ ] CORRECCIONES
- [ ] COMPARTIR
- [ ] HISTORIAL
- [ ] RENDIMIENTO
- [ ] PRUEBAS

#### EH · Fase 60/65 — RECOMENDACIONES CONTEXTUALES
- [ ] CONTEXTO TEMPORAL
- [ ] CONTEXTO DE EVENTOS
- [ ] CONTEXTO DE RUTINA
- [ ] CONTEXTO CLIMÁTICO
- [ ] CONTEXTO DE VIAJE
- [ ] CONTEXTO DE OCASIONES
- [ ] NO ASUMIR
- [ ] FRECUENCIA
- [ ] PRIORIZACIÓN
- [ ] RECHAZAR
- [ ] GUARDAR
- [ ] CONVERTIR EN OBJETIVO
- [ ] CONVERTIR EN TAREA
- [ ] IA
- [ ] PRIVACIDAD
- [ ] MODO SILENCIOSO
- [ ] PRUEBA DE RELEVANCIA

#### EH · Fase 61/65 — ACCIONES RÁPIDAS E INTELIGENTES
- [ ] ACCIONES RÁPIDAS PRINCIPALES
- [ ] ACCESO RÁPIDO
- [ ] BOTÓN +
- [ ] ACCIONES CONTEXTUALES
- [ ] DESLIZAR
- [ ] MANTENER PULSADO
- [ ] ATAJOS
- [ ] ACCIONES DESDE RECOMENDACIONES
- [ ] ACCIONES DESDE INSIGHTS
- [ ] ACCIONES GLOBALES
- [ ] CONFIRMACIONES
- [ ] DESHACER
- [ ] ACCIONES EN LOTE
- [ ] ACCIONES INTELIGENTES
- [ ] VELOCIDAD
- [ ] ACCESIBILIDAD
- [ ] PRUEBA

#### EH · Fase 62/65 — ACCESIBILIDAD Y USABILIDAD AVANZADA
- [ ] TAMAÑO DEL TEXTO
- [ ] CONTRASTE
- [ ] ZONAS TÁCTILES
- [ ] ICONOS
- [ ] ESTADOS
- [ ] REDUCIR MOVIMIENTO
- [ ] NAVEGACIÓN
- [ ] TECLADO
- [ ] FORMULARIOS
- [ ] MENSAJES
- [ ] GESTOS
- [ ] USO CON UNA MANO
- [ ] ORIENTACIÓN
- [ ] PANTALLAS PEQUEÑAS
- [ ] ESTADOS VACÍOS
- [ ] ERRORES DE RED
- [ ] LECTORES DE PANTALLA
- [ ] ORDEN DE LECTURA
- [ ] PRUEBA REAL

#### EH · Fase 63/65 — SEGURIDAD, PRIVACIDAD Y CONTROL DE DATOS
- [ ] INVENTARIO DE DATOS
- [ ] DATOS SENSIBLES
- [ ] ACCESO
- [ ] AUTENTICACIÓN
- [ ] AUTORIZACIÓN
- [ ] IA
- [ ] MEMORIA
- [ ] ELIMINACIÓN
- [ ] ELIMINACIÓN DEFINITIVA
- [ ] EXPORTACIÓN
- [ ] PRIVACIDAD DE IA
- [ ] DATOS LOCALES
- [ ] LOGS
- [ ] SEGURIDAD DE API
- [ ] VALIDACIÓN
- [ ] INYECCIONES Y ENTRADAS MALICIOSAS
- [ ] BORRADO DE CUENTA
- [ ] COPIAS DE SEGURIDAD
- [ ] AUDITORÍA
- [ ] PRUEBA FINAL

#### EH · Fase 64/65 — PRUEBA INTEGRAL END-TO-END
- [ ] USUARIO NUEVO
- [ ] USUARIO EXISTENTE
- [ ] NAVEGACIÓN COMPLETA
- [ ] PERSONALIZACIÓN
- [ ] DATOS
- [ ] ELIMINACIÓN
- [ ] IA
- [ ] RECOMENDACIONES
- [ ] INSIGHTS
- [ ] RESUMEN SEMANAL
- [ ] RESUMEN MENSUAL
- [ ] CONTEXTO
- [ ] ACCIONES RÁPIDAS
- [ ] OFFLINE
- [ ] SINCRONIZACIÓN
- [ ] CONFLICTOS
- [ ] MÓVIL
- [ ] MODO OSCURO
- [ ] ACCESIBILIDAD
- [ ] SEGURIDAD
- [ ] RENDIMIENTO
- [ ] DATOS MASIVOS
- [ ] ERRORES
- [ ] BACKUP
- [ ] PRUEBA DE REGRESIÓN
- [ ] PRUEBA FINAL DEL USUARIO

#### EH · Fase 65/65 — CIERRE, CONGELACIÓN Y ENTREGA FINAL
- [ ] CONGELAR FUNCIONALIDADES
- [ ] INVENTARIO FINAL
- [ ] COMPROBAR QUE NO HAYA DUPLICADOS
- [ ] REVISIÓN DE DISEÑO
- [ ] REVISIÓN DE UX
- [ ] REVISIÓN DE DATOS
- [ ] REVISIÓN DE IA
- [ ] REVISIÓN DE SEGURIDAD
- [ ] REVISIÓN MULTIDISPOSITIVO
- [ ] RENDIMIENTO FINAL
- [ ] BACKUP FINAL
- [ ] ETIQUETAR VERSIÓN
- [ ] DOCUMENTACIÓN FINAL
- [ ] BACKLOG FUTURO
- [ ] NO ROMPER LO TERMINADO
- [ ] INTEGRACIÓN CON JC FITNESS
- [ ] CRITERIO DE ENTREGA
- [ ] INFORME FINAL PARA EL PROYECTO

---

## FO · FONDOS Y FOTOGRAFÍAS (ASPECTO) — 12 fases

Amplía el sistema de apariencia ya existente para permitir usar una fotografía como fondo y derivar de ella una paleta coherente. **Se apoya directamente en `colorEngine.js`, `ColorPicker`, `TemaBuilder` y `GestionTemas` (fases V1–V4, ya construidas): no debe crear un segundo motor de color.**

#### FO · Fase 1/12 — SISTEMA BASE DE FONDOS Y FOTOGRAFÍAS ✅ COMPLETADA (v1.36.0)

Todo el modelo vive en `src/lib/fondos.js`, un motor puro nuevo que solo depende de
`colorEngine.js`. El fondo se guarda dentro de `apariencia`, **no en una clave suya**.

- [x] **1 · Objetivo** — arquitectura completa y escalable, sin las funciones avanzadas de las
      fases 2-12. Ninguna de ellas obligará a rehacer esta base.
- [x] **2 · Principio fundamental** — el fondo es un elemento propio, no "una imagen detrás".
      Un solo sistema sabe qué fondo está activo, cuál usa, cómo se muestra y con qué ajustes.
- [x] **3 · Tipos de fondo** — los cinco desde el primer día: sin fondo, color sólido, degradado,
      fotografía e incluido. **Solo se ofrecen en Ajustes los cuatro que ya funcionan**: la
      fotografía es de la Fase 2, y un "Fotografía (próximamente)" sería el control decorativo
      que prohíbe la regla 8. Existe en el modelo; la interfaz la ofrecerá cuando exista.
- [x] **4 · Modelo central** — los once campos del apartado, con los nombres del proyecto y la
      correspondencia documentada al lado (`type→tipo`, `overlay→velo`, `isActive→activo`…).
- [x] **5 · Sistema único de apariencia** — el fondo vive en `apariencia`, junto a tema,
      densidad, radio y alto contraste, y se resuelve en el mismo sitio y el mismo momento que
      el tema. **No hay un segundo sistema de apariencia.**
- [x] **6 · Prioridad** — la cadena del apartado, y `resolverFondo` **nunca devuelve null**: el
      peor caso es el fondo normal de JosStyle. Un color roto, un degradado a medias o una foto
      que ya no está bajan un escalón en vez de dejar un hueco, y dicen por qué (`motivo`).
- [x] **7 · Preparado para fotografías** — `foto` declara id, ruta, origen, ancho, alto y
      proporción. Nace vacía; la llena la Fase 2.
- [x] **8 · Preparado para colores** — `analisis` y `paleta`, en `null`. Sin detector, que es
      de la Fase 5.
- [x] **9 · Preparado para recomendaciones** — `recomendacion`, en `null`, para la Fase 6.
- [x] **10 · Claro y oscuro** — cambiar de tema **no puede tocar el fondo**, y no es una promesa:
      los fondos incluidos se definen con TOKENS, no con hex, así que se pintan distinto en cada
      tema sin que la configuración guardada cambie. Hay prueba que pinta el mismo fondo con dos
      paletas y comprueba que sale distinto y que lo guardado sigue igual.
- [x] **11 · Componente centralizado** — una sola resolución en `App.jsx`, justo después de
      `aplicarTema`. Ninguna pantalla gestiona su propio fondo.
- [x] **12 · Persistencia** — el `saveData` que ya existe. **Ninguna base de datos nueva.**
- [x] **13 · Cambio de fondo** — `seleccionarFondo` es la función central, y el cambio es
      reactivo: se ve al instante, sin recargar.
- [x] **14 · Restablecer** — vuelve al fondo normal **sin borrar nada**, y la interfaz lo dice
      para que nadie evite el botón por miedo a perder lo que eligió.
- [x] **15 · Preparado para las fases 2-12** — sí, y por un motivo concreto: la regla 5 del
      proyecto dice que `loadData` NO fusiona con el valor por defecto. Un campo que aparezca en
      la Fase 5 no lo tendría la configuración ya guardada, y arreglarlo entonces exige una
      migración a mano. Declararlo hoy, vacío, cuesta cero. Es la misma decisión que las 21
      propiedades de la prenda en AR Fase 1.
- [x] **16 · Restricciones** — ni detector de colores, ni IA, ni editor fotográfico, ni filtros,
      ni presets, ni eliminados, ni análisis de contraste, ni editor de degradados avanzado.
- [x] **17 · Criterios de finalización** — los trece, con 101 comprobaciones propias y 882 en
      total en verde.

**Un fallo de apilamiento CSS corregido al escribirlo:** una capa `position: fixed; z-index: 0`
se pinta en el paso 6 del orden de pintado, **por encima** del contenido en flujo normal (paso 3).
Tal cual, el fondo habría tapado la aplicación entera. Se arregla con `isolation: isolate` en el
contenedor —que lo convierte en contexto de apilamiento propio— y `z-index: -1` en las capas, que
las deja entre el `background` del contenedor y el contenido. `isolation` no crea bloque contenedor
para `position: fixed`, así que los overlays fijos de la app no se ven afectados, y los modales van
por `createPortal` a `document.body`, fuera de este contenedor.

**Por qué el velo va en su propia capa y no en la del fondo:** si compartieran capa, subir el
desenfoque difuminaría también el velo y dejaría de proteger la lectura, que es justo para lo que
existe.

**Un hueco de cobertura que se cerró de paso:** `SettingsView` no se renderizaba en ninguna prueba.
Ahora su bloque de fondo sí, con cuatro escenarios — incluido **un fondo guardado por una versión
anterior, sin los campos nuevos**, que es exactamente lo que devuelve `loadData` y lo que la regla
5 obliga a soportar.

#### FO · Fase 2/12 — GALERÍA Y SELECCIÓN DE FOTOGRAFÍAS ✅ COMPLETADA (v1.37.0)

- [x] **1 · Objetivo** — el flujo completo: Ajustes → Apariencia → Fondo → Foto → galería →
      vista previa → aplicar.
- [x] **2 · Acceso a la galería** — `<input type="file" accept="image/*">`, que en iPhone abre
      la galería nativa y en escritorio el selector del sistema. **No pide ningún permiso**: el
      navegador solo entrega el archivo que el usuario elige.
- [x] **3 · Selección** — la foto **NO se aplica al elegirla**. Primero la vista previa, después
      "Aplicar". Y la subida a Storage ocurre al APLICAR, no al elegir: si subiera al elegir,
      cada foto que Josué mirara y descartara dejaría un archivo huérfano en su bucket para
      siempre. La previa se hace con `URL.createObjectURL`, local e instantánea.
- [x] **4 · Vista previa** — la foto **dentro de una representación de JosStyle**, con una
      tarjeta y su texto secundario encima. Un rectángulo con la foto solo enseña la foto; lo
      que hay que poder juzgar es si el contenido se sigue leyendo.
- [x] **5 · Adaptación a la pantalla** — `cover` siempre, así que **la imagen nunca se deforma**.
      Verticales, horizontales, cuadradas y panorámicas, deducidas de las medidas reales.
- [x] **6 · Encuadre inicial** — no es "centrar y ya": una foto muy vertical se ancla **arriba**,
      que es donde está el cielo o el rostro en la inmensa mayoría de fotos de móvil, en vez de
      cortar por la cintura. El resto se centran.
- [x] **7 · Fotografía activa** — al aplicar, el tipo pasa a `foto` y queda registrada cuál es.
- [x] **8 · Cambiar de fotografía** — sin tener que quitar la anterior primero.
- [x] **9 · Quitar foto** — vuelve al fondo anterior (el color o el degradado que hubiera, y si
      no, al fondo normal), y **la fotografía no se elimina**: se conserva en el modelo para la
      recuperación de la Fase 12. La interfaz lo dice.
- [x] **10 · Estado sin fotografía** — con el texto de la especificación y un botón. Ni un hueco
      ni un elemento roto.
- [x] **11 · Información de la foto** — id, ruta, origen, formato, ancho, alto, proporción, peso
      y fecha. La proporción **se calcula**, no se pide.
- [x] **12 · Optimización inicial** — se rechaza lo que no es imagen y lo que pesa más de 12 MB,
      diciendo cuánto pesa y cuál es el máximo. Un archivo sin `type` declarado **no** se rechaza
      por formato: algunos navegadores no lo rellenan, y rechazar una foto válida por eso es peor
      que aceptar una rara. La optimización avanzada es de la Fase 11.
- [x] **13 · Persistencia** — el `saveData` de la Fase 1. Hay prueba que simula el viaje entero:
      guardar → JSON → cargar → normalizar.
- [x] **14 · Cambio entre tipos** — y lo que importa: **elegir una foto NO borra el color ni el
      degradado** que hubiera configurados. Comprobado con prueba propia.
- [x] **15 · Experiencia** — los cinco tipos en una fila, con el activo marcado.
- [x] **16 · Transición visual** — mientras la URL se firma, `resolverFondo` baja al fondo
      incluido, así que **nunca se ve la pantalla sin fondo** mientras carga la imagen.
- [x] **17 · Compatibilidad** — 941 comprobaciones en verde; ninguna pantalla existente tocada.
- [x] **18 · Preparado para la Fase 3** — zoom, posición, encuadre, desenfoque, oscurecimiento y
      overlay ya existen en el modelo y en `estilosDeFondo`; la Fase 3 les pone controles.
- [x] **19 · Criterios de finalización** — los catorce.
- [x] **20 · Regla para Claude** — no es un selector de archivos: la foto entra en el sistema de
      la Fase 1, con su encuadre, su validación, su persistencia y su cadena de prioridad.

**Bucket nuevo `fondos` en `supabase/schema.sql`**, con las tres políticas RLS por carpeta de
usuario, mismo patrón que `armario`. Va en su propio bucket y no dentro de `armario` a propósito:
son cosas con ciclos de vida distintos (una prenda se borra con la prenda; el fondo se sustituye
al elegir otra foto), y mezclarlas obligaría a distinguirlas por convenio de nombre de archivo,
que es el tipo de acuerdo implícito que se rompe solo.
⚠️ **Josué tiene que ejecutar ese bloque en el SQL Editor.** Hasta entonces funciona todo menos
la fotografía — color, degradado e incluidos no tocan Storage.

**Dos detalles que no son evidentes y estaban mal si no se piensan:**

1. **`URL.createObjectURL` sin `revokeObjectURL` es memoria retenida** hasta recargar la página.
   Se suelta al desmontar y cada vez que se sustituye por otra foto.
2. **Una firma en vuelo puede pisar a la siguiente.** Si Josué cambia de foto mientras la URL
   anterior se estaba firmando, la respuesta lenta de la vieja llegaría después y sobrescribiría
   a la nueva. El efecto lleva una bandera `cancelado` que descarta el resultado obsoleto.

#### FO · Fase 3/12 — EDITOR DE FOTOGRAFÍAS ✅ COMPLETADA (v1.38.0)

- [x] **1 · Objetivo** — elegir → editar → vista previa en tiempo real → aplicar, encima del
      sistema de las fases 1 y 2.
- [x] **2 · Regla principal** — **la fotografía original nunca se modifica**. Los ajustes son
      configuración del fondo: misma ruta, mismas medidas, mismo id después de editar.
- [x] **3 · Vista previa en tiempo real** — el editor lee su propio borrador, así que cada
      deslizador se ve al instante sin haber guardado nada.
- [x] **4 · Zoom** — de 100 a 300 %. El mínimo es 100 porque por debajo la foto dejaría huecos:
      100 % es `cover`, no "tamaño original".
- [x] **5 · Posición horizontal** y **6 · Posición vertical** — encuadre libre en porcentajes.
- [x] **7 · Encuadre** — `cover` o un único porcentaje, **nunca `100% 100%`**: la relación de
      aspecto se conserva siempre.
- [x] **8 · Desenfoque** — 0 a 40 px, con el 0 como "sin desenfoque".
- [x] **9 · Oscurecimiento** y **10 · Aclarado** — **un solo control bipolar** en vez de dos
      deslizadores. Dos controles para dos mitades del mismo eje se contradicen en cuanto los dos
      valen algo (¿qué es "oscurecer 40 y aclarar 30"?), y el apartado 17 pide no llenar la
      pantalla de controles. El aclarado llega menos lejos a propósito (apartado 10: "no debe
      provocar pérdida exagerada de contraste").
- [x] **11 · Opacidad** — 10 a 100 %.
- [x] **12 · Overlay** — capa de color con intensidad. Sin color elegido usa el del tema, que es
      lo que hacía el `velo` de la Fase 1.
- [x] **13 · Restablecer ajustes** — devuelve todo a fábrica **sin eliminar la fotografía**, y el
      encuadre vuelve al **inicial de su orientación**, no a "centro" a secas: para una foto
      vertical, "original" es anclada arriba, que es como se aplicó. El botón solo aparece si hay
      algo que restablecer.
- [x] **14 · Cancelar cambios** — el editor trabaja sobre un **borrador local**: mientras está
      abierto no se llama a `onCambiar` ni una vez. Hay prueba que hace 40 cambios seguidos y
      comprueba que el fondo guardado no se ha tocado.
- [x] **15 · Aplicar cambios** — guarda y se ve al instante, sin recargar.
- [x] **16 · Cambiar de foto desde el editor** — y la parte que importa: *"los ajustes no deben
      transferirse accidentalmente si no tiene sentido"*. La línea está en si el ajuste habla de
      ESA imagen o del gusto de quien mira: **encuadre y zoom se recalculan** (el encuadre bueno
      de un retrato vertical no significa nada en una panorámica); **desenfoque, luz, opacidad y
      overlay se heredan** (si querías la foto discreta y oscura para leer mejor, la sigues
      queriendo así con otra imagen).
- [x] **17 · Interfaz** — vista previa grande arriba, controles debajo, y el editor entero detrás
      de "Ajustar foto" para no llenar Ajustes de deslizadores.
- [x] **18 · Experiencia móvil** — deslizadores nativos, botones grandes, nada pensado para ratón.
- [x] **19 · Rendimiento** — el borrador es un objeto plano y las capas son CSS puro; no se
      recodifica la imagen ni se toca un canvas.
- [x] **20 · Guardado por fotografía** — los ajustes quedan **vinculados a su foto** por id, así
      que volver a una imagen ya usada recupera su encuadre en vez de heredar el de otra. Limitado
      a las últimas 10 para que no crezca sin fin dentro de la configuración.
- [x] **21 · Compatibilidad** — 1000 comprobaciones en verde.
- [x] **22 · Preparado para la Fase 4** — el overlay ya acepta color, que es por donde entrará la
      paleta.
- [x] **23 · Criterios de finalización** — los diecisiete.
- [x] **24 · Regla para Claude** — no son filtros sueltos: es **una sola configuración coherente**
      del fondo (`AJUSTES_PRESENTACION`, una única lista que usan restablecer, cambiar de foto y
      guardar por foto — si cada una tuviera la suya, acabarían discrepando).

**Una decisión de modelo que había que tomar y no era neutral:** la Fase 1 guardaba `posicion` con
cinco valores fijos; esta fase necesita un encuadre libre. **No conviven**: dos formas de decir
dónde va la foto son dos fuentes de verdad. `posicion` se ha traducido a `encuadre {x, y}` y
`normalizarFondo` migra lo guardado por v1.36/37. Lo mismo con `velo`, que era el overlay sin
color: ahora es `overlay.intensidad`.

**Un fallo real que encontró la prueba de esa migración:** el traslado de `velo` a `overlay` estaba
escrito como `f.overlay?.intensidad ?? f.velo`, y **nunca se ejecutaba**. `f` ya viene fusionado con
`DEFAULT_FONDO`, así que `f.overlay` siempre existe con `intensidad: 0`, y `??` no salta con 0. A
quien tuviera un velo puesto se le habría perdido en silencio al actualizar. Se arregla mirando el
objeto **guardado**, no el fusionado.

**Y otro que cazó la regla invariante de colores:** la capa de luz usaba `#000000`/`#FFFFFF`
sueltos. No son colores de interfaz —oscurecer es acercar al negro en tema claro y en oscuro— así
que no pertenecen a `tokens.js`; pero añadir una excepción al comprobador lo habría debilitado. Se
usan las palabras clave de CSS `black` y `white`, que lo dicen al leerlo y no son un hex.

**Tres capas y no una**, y el orden importa: foto → luz → overlay. "Oscurecer la foto" no debe
oscurecer el overlay que va encima, y el overlay no debe desenfocarse con la foto. Tampoco se usa
`filter: brightness()` sobre la capa de la foto por el mismo motivo.

#### FO · Fase 4/12 — SISTEMA AVANZADO DE COLORES ✅ COMPLETADA (v1.39.0)

**Esta fase AMPLÍA el sistema de color que ya existía** (`colorEngine.js`, `aplicarTema`,
`ColorPicker`, `TemaBuilder`, temas guardados — fases V1-V4). El apartado 23 pide un sistema
centralizado y ya lo había; crear otro habría sido exactamente lo que prohíbe.

- [x] **1 · Objetivo** — fondo y colores son sistemas **relacionados pero independientes**: se
      guardan en claves distintas, así que se pueden combinar libremente.
- [x] **2 · Estructura** — dentro de Apariencia: Tema · Fondo · Tarjetas y barra · Color de
      acento · Constructor de temas.
- [x] **3, 4, 5 · Principal, secundario y acento** — ya existían y siguen igual.
- [x] **6 · Botones** — fondo, texto e iconos ya salen de `buildRolesFromAccent`.
- [x] **7 · Tarjetas** — fondo, borde y **transparencia**. Esta es la pieza que faltaba.
- [x] **8 · Jerarquía de texto** — principal, secundario (nuevo), atenuado y sobre acento. Con
      red de seguridad: un texto secundario del color del fondo **no se queda invisible**,
      `ensureContrast` lo corrige. El apartado lo pide literalmente.
- [x] **9 · Iconos** — activo e inactivo **por separado**: forzar un solo color para los dos
      destruye la jerarquía, que es lo que el apartado pide no hacer.
- [x] **10 · Navegación** — la barra inferior sale ya del sistema de colores.
- [x] **11 · Degradados** — ya soportados desde FO F1.
- [x] **12 · Transparencia** — tarjetas y barra, con `backdropFilter` para que el texto se siga
      leyendo sobre una foto con detalle.
- [x] **13 · Selector de color** — `ColorPicker` ya da espectro completo y hex.
- [x] **14 · Colores predeterminados** — `PALETAS_PREDEFINIDAS` ya existían; se añade
      `aplicarPresetColor`, que **conserva la transparencia** que el preset no menciona.
- [x] **15 · Restablecer colores** — con confirmación, y **sin tocar la fotografía**.
- [x] **16 · Guardado independiente** — `fondo` y `temaPersonalizado` son claves distintas (de
      hecho, claves distintas de Supabase). Hay prueba que lo comprueba estructuralmente.
- [x] **17 · Foto + colores** — explícitamente válido: nada obliga a usar colores detectados.
- [x] **18 · Vista previa** — inmediata, como ya lo era.
- [x] **19 · Cancelar** — el constructor de temas ya trabajaba así; el restablecer lleva
      confirmación propia.
- [x] **20 · Aplicar** — al instante, sin recargar.
- [x] **21 · Compatibilidad con el fondo** — los colores funcionan con los cinco tipos.
- [x] **22 · Claro y oscuro** — la transparencia se aplica **sobre el color de superficie de cada
      tema**, y lo personalizado sobrevive al cambio. Con prueba.
- [x] **23 · Sistema centralizado** — un solo `COLORS`, mutado en un solo sitio.
- [x] **24 · Preparado para el detector** — `fondo.analisis` y `fondo.paleta` esperan a la Fase 5.
- [x] **25 · Preparado para "Recomendado"** — `fondo.recomendacion`, para la Fase 6.

**LA TRANSPARENCIA NO ES UN EFECTO BONITO, ERA LA PIEZA QUE FALTABA.** Con una fotografía detrás,
las tarjetas opacas la tapan entera y solo se ve en los márgenes: sin esto, las fases 2 y 3
quedaban a medias — podías poner tu foto y no verla. Por eso se ha llevado hasta los tokens de
verdad (`COLORS.surfaceAlpha`, `COLORS.navBgAlpha`) y hasta los componentes (`Card`, la barra
inferior), no solo al modelo. **Al 100 % es exactamente el color sólido de siempre**, así que sin
tocar nada nada cambia.

**Un fallo real corregido de paso:** la barra de navegación tenía un `rgba(5,6,10,0.75)` fijo en el
código, así que **en tema claro seguía siendo negra**. Ahora sale de `COLORS.navBgAlpha` y respeta
el tema.

**Y un fallo que estas pruebas existen para que no vuelva:** `Object.assign(COLORS, base)`
sobrescribe las claves de `base` pero **no borra** las que no están en él. `iconActive`, `iconMuted`
y `navBg` no existen en `COLORS_OSCURO`/`COLORS_CLARO`, así que sin limpiarlos antes se quedaban
pegados del render anterior — quitar un color personalizado habría parecido que no funcionaba.

**Por qué "Restablecer colores" no puede tocar la fotografía:** no es que se acuerde de no hacerlo,
es que **ni siquiera la recibe**. `restablecerColores()` no tiene parámetros. Hay una prueba que
comprueba justamente eso (`restablecerColores.length === 0`), porque una garantía que depende de
acordarse no es una garantía.

**El mínimo de opacidad es 20 y no 0**, y la interfaz lo explica cuando te acercas: por debajo, una
tarjeta sobre una foto no es "translúcida", es texto suelto encima de una imagen. La Fase 9 afinará
esto con medidas de contraste reales.

#### FO · Fase 5/12 — DETECTOR INTELIGENTE DE COLORES ✅ COMPLETADA (v1.40.0)

Todo en `src/lib/detectorColores.js`. **Aritmética sobre píxeles, no IA.**

- [x] **1 · Objetivo** — foto → análisis → colores → paleta estructurada, lista para la Fase 6.
- [x] **2 · Cuándo analizar** — al cambiar de fotografía, **no** mientras se mueve el zoom: eso
      sería analizar decenas de veces por segundo para nada.
- [x] **3 · Colores dominantes** — hasta 6, agrupados en una rejilla de 4×4×4 por canal. El color
      de cada grupo es la **media de sus píxeles**, no el centro de la caja, así que es un color
      que de verdad está en la foto.
- [x] **4 · Paleta estructurada** — dominante, acento, secundario, neutro, claro y oscuro. Cada
      papel se elige por lo que ese papel necesita: **"no asumir que el color más frecuente es
      automáticamente el mejor color para botones"**, literal del apartado.
- [x] **5 · Claros, medios y oscuros** — por luminancia percibida.
- [x] **6 · Saturación** — neutro, apagado, moderado y vivo.
- [x] **7 · Neutros** — blancos, negros, grises y lo que se les parece.
- [x] **8 · Colores destacables** — **la prueba que define esta fase.** Cada color lleva dos
      números distintos: `peso` (cuánta superficie ocupa) e `interes` (cuánto destaca). El ejemplo
      literal del apartado está automatizado: una foto 95 % negra con un 5 % de azul eléctrico
      devuelve el **negro como dominante y el azul como acento**.
- [x] **9 · Distribución** — en qué tercio vertical vive cada color.
- [x] **10 · Análisis optimizado** — sobre una miniatura de 96 px de lado (~9.000 píxeles). **La
      fotografía original no se toca.**
- [x] **11 · Resultado** — hex, luminosidad, saturación, tono, peso, interés, zona y clasificación.
- [x] **12 · Representación visual** — las muestras en Ajustes, con su descripción, y tocar una la
      copia.
- [x] **13 · Actualización** — cada análisis va **sellado con el id de su fotografía**. Cambiar de
      foto y seguir viendo la paleta de la anterior es imposible por construcción.
- [x] **14 · Caché** — una foto ya analizada no se vuelve a analizar.
- [x] **15 · NO cambiar colores automáticamente** — detectar no es aplicar. Una foto azul con una
      paleta roja deja la paleta roja **intacta**, y la interfaz lo dice: *"Solo te los enseño:
      tus colores no cambian solos"*. Decidir es la Fase 6.
- [x] **16 · Integración con el sistema de colores** — tocar un color lo copia, y de ahí al
      selector que ya existe. El control sigue siendo de Josué.
- [x] **17 · Fotografías problemáticas** — ocho casos automatizados (toda negra, toda blanca, gris
      plano, extremadamente oscura, extremadamente clara, dos colores, un solo píxel, saturadísima)
      y ninguno produce una configuración rota.
- [x] **18 · Monocromáticas** — se identifican como paleta neutra y **no se inventa un acento que
      la foto no tiene**: `acento` es `null`, y eso es información honesta que la Fase 6 podrá usar.
- [x] **19 · Privacidad** — **la foto no sale del teléfono**. Ni IA, ni servicio externo, ni una
      sola petición: es `getImageData` sobre un `<canvas>` local.
- [x] **20 · Rendimiento** — "Analizando colores…" mientras trabaja, y una miniatura de 96 px en
      vez de la foto entera.

**Un fallo real, y de los que no dan ningún error:** `rgbToHsl`/`hexToHsl` de `colorEngine.js`
devuelven la saturación y la luminosidad en **0-100, no en 0-1**. Mis umbrales estaban en la escala
equivocada, así que **todo color con más de un 0,6 % de saturación salía como "vivo"** y solo un
gris exacto contaba como neutro: la clasificación entera habría sido inútil, y la Fase 6 habría
construido recomendaciones sobre datos sin sentido. Lo cazó la prueba que clasifica el propio
acento de la app (`#5C7E9A`, s = 25,2). La conversión está ahora en **un solo sitio**, con el aviso
escrito al lado.

**Por qué `interes` y `peso` son dos números y no uno:** el color que más superficie ocupa suele ser
el peor candidato a acento — en una foto nocturna es "casi negro" y en una de playa "casi blanco".
Fundirlos en una sola cifra habría hecho imposible la prueba del apartado 8.

**Los píxeles transparentes no cuentan.** Un agujero no es un color: contarlo metería un falso
negro en toda imagen con transparencia. Con prueba propia.

#### FO · Fase 6/12 — SISTEMA «RECOMENDADO» ✅ COMPLETADA (v1.41.0)

En `src/lib/recomendadorApariencia.js`. **Sin IA**: teoría del color sobre los colores reales que
sacó el detector de la Fase 5.

- [x] **1 · Objetivo** — foto → analizar → generar → mostrar → previsualizar → elegir → aplicar.
- [x] **2 · Botón "Recomendado"** — dentro de Apariencia, y **solo aparece si hay una foto
      analizada**: sin ella no hay nada que recomendar y un botón vacío sería decorativo.
- [x] **3 · Varias propuestas** — cinco: Equilibrada, Con contraste, Serena, Intensa y
      Minimalista.
- [x] **4 · Combinación completa** — cada propuesta es un tema entero: principal, secundario,
      terciario, transparencia de tarjetas, de la barra, overlay del fondo, texto sobre acento y
      su ratio de contraste.
- [x] **5 · La fotografía como base** — los tres ejemplos del apartado (azul+azul claro /
      azul+naranja complementario / azul desaturado+gris) son literalmente las tres primeras
      estrategias. **Nada aleatorio**: hay prueba de que generar dos veces da lo mismo.
- [x] **6 · Armonía cromática** — análogos, complementarios, desaturación y neutros.
- [x] **7 · Contraste** — cada propuesta pasa por `ensureContrast` **antes** de enseñarse, en los
      dos temas. Hay pruebas con acentos deliberadamente horribles (casi negro, casi blanco,
      saturadísimo) que comprueban que ninguna sale ilegible.
- [x] **8 · Propuestas realmente diferentes** — el apartado lo dice con un ejemplo: azul #123456,
      #123457 y #123458 **no son tres opciones, son una**. Por eso cada propuesta parte de una
      **estrategia cromática distinta**, no de un retoque de la anterior; se comprueba que no hay
      dos acentos iguales y que la distancia entre ellas es perceptible.
- [x] **9 · Previsualización** — muestras de color por propuesta, y "Probar" la aplica de verdad.
- [x] **10 · Aplicar** — cambia acento, tema y overlay. **No toca la fotografía**, y no porque se
      acuerde: `aplicarPropuesta` ni siquiera la recibe.
- [x] **11 · Probar sin aplicar** — tocar "Probar" la pone en la app al instante, sin guardarla.
- [x] **12 · Cancelar** — "Volver" recupera **exactamente** lo anterior.
- [x] **13 · Generar otras** — con una semilla **determinista**, no aleatoria: da algo distinto
      pero igual de justificable, y la misma semilla da siempre lo mismo (que es lo que permite
      probarlo).
- [x] **14 · Favorito** — la gestión de presets es de la Fase 8; el modelo ya lo permite.
- [x] **15 · Modo automático** — no se implementa: el apartado dice que **debe ser opcional** y
      "nunca obligar", y activarlo por defecto sería justo lo contrario. Entra con los presets.
- [x] **16 · Libertad manual** — aplicar una propuesta deja todo editable como siempre.

**Cómo se garantiza que "Volver" funciona:** no deshaciendo cambio por cambio, sino haciendo una
**copia profunda de la apariencia ANTES de tocar nada** y restaurándola entera — el mismo patrón
que el borrador del editor de fotos (FO F3). Y la copia se hace **una sola vez**, al empezar a
probar: si se rehiciera en cada prueba, la segunda guardaría la apariencia de la primera y "Volver"
devolvería a una propuesta en vez de a lo que Josué tenía.

**Una foto en blanco y negro sigue dando propuestas.** La Fase 5 dejó `acento: null` como dato
honesto; aquí se usa: en vez de inventar un color, se parte del que Josué **ya tenía**.

**UN FALLO REAL Y PREEXISTENTE, encontrado por las pruebas de contraste de esta fase:**
`ensureContrast` en `colorEngine.js` elegía la dirección con `l <= bgL ? -1 : 1`, o sea por el
**orden relativo** entre los dos colores. Sobre un fondo oscuro, un color aún más oscuro se
oscurecía todavía más: lo empujaba hasta el negro puro y salía del bucle **sin contraste ninguno**.
Afectaba también a la red de seguridad de `aplicarTema` — un texto personalizado casi negro sobre
el fondo oscuro de la app se habría quedado ilegible. Ahora la dirección la decide **el fondo**:
sobre fondo oscuro se aclara, sobre fondo claro se oscurece. Para los casos normales el resultado
es idéntico al de antes, y hay prueba de las dos cosas.

**Y otro hex duplicado que cazó la regla invariante:** el recomendador comparaba el contraste contra
`'#0A0C10'` y `'#F3F4F7'` escritos a mano, que son literalmente `COLORS_OSCURO.bg` y
`COLORS_CLARO.bg`. Ahora se importan: si los temas base cambian, el recomendador se entera solo.

#### FO · Fase 7/12 — PERSONALIZACIÓN MANUAL AVANZADA ✅ COMPLETADA (v1.42.0)

**Esta fase cierra un hueco que las anteriores habían abierto.** FO F4 metió en el modelo el texto
secundario, los iconos activo e inactivo y el fondo de la barra — pero **sin control**: se podían
guardar y no había forma de tocarlos. Aquí se les pone uno.

- [x] **1 · Objetivo** — se puede partir de lo predeterminado, de una foto, de una paleta manual,
      de una recomendación o de un preset, y modificarlo después. *"La recomendación ayuda. El
      usuario decide."*
- [x] **2 · Acceso al editor completo** — el constructor de temas que ya existía (fase V3), ahora
      con los diez campos.
- [x] **3 · Estructura** — Fondo · Colores · Tarjetas, bordes y barra · Estados, en secciones
      plegables.
- [x] **4 · Libertad total** — nada limita a las recomendaciones: se aplican y se editan encima.
- [x] **5 · Editar una recomendación** — aplicar una propuesta deja todos sus valores editables, y
      **no se regenera** nada al cambiar algo: aplicar solo escribe el tema.
- [x] **6 · Control individual** — diez campos de color independientes más cuatro de estados.
- [x] **7 · Color manual** — `ColorPicker` con espectro completo y HEX, de la Fase 4.
- [x] **8 · Transparencia** — tarjetas, barra y ahora **bordes**.
- [x] **9 · Overlay** — activar, color e intensidad, desde el editor de fotografía (FO F3).
- [x] **10 · Bordes** — color (ya estaba) e **intensidad** (nueva). Un borde al 100 % sobre una
      tarjeta translúcida encima de una foto se ve como una caja pegada; bajarlo la integra sin
      quitarle la separación.
- [x] **11 · Sombras** — con tope bajo **a propósito**: el propio apartado pide *"evitar que el
      usuario pueda crear configuraciones visualmente exageradas que hagan que la aplicación
      parezca desordenada"*. De fábrica están apagadas, así que sin tocar nada nada cambia.
- [x] **12 · Degradados** — color inicial, final y dirección, desde FO F1.
- [x] **13 · Navegación** — fondo, iconos activos e inactivos, y su transparencia.
- [x] **14 · Tarjetas** — fondo, transparencia, borde, texto y sombra.
- [x] **15 · Botones** — salen de `buildRolesFromAccent`, que ya deriva fondo, texto y estados.

**El detalle que hace que todo esto sea seguro:** cada añadido nuevo tiene su valor de fábrica
igual al comportamiento anterior — sombra 0, borde al 100 %, transparencias al 100 %. **Sin tocar
nada, la app se ve exactamente como antes.** Es lo que permite añadir controles sin arriesgar una
regresión visual.

**Y el que evita un coste inútil:** sin sombra, `cardShadow` es `'none'`, no una sombra de opacidad
cero. Una sombra invisible sigue costando pintado en cada tarjeta, y hay muchas por pantalla.

#### FO · Fase 8/12 — PRESETS Y CONFIGURACIONES GUARDADAS ✅ COMPLETADA (v1.43.0)

**Reutiliza `temasGuardados` (fase V4) tal cual**: misma clave de Supabase, mismo estado, mismo
límite. Lo único que cambia es QUÉ se guarda dentro — ahora también **el fondo**. Crear un segundo
almacén al lado habría dejado dos listas de apariencias guardadas en Ajustes.

- [x] **1 · Objetivo** — crear estilos y cambiar entre ellos de un toque.
- [x] **2 · Qué es un preset** — la configuración **completa**: tema, acento, colores,
      transparencias, sombras, bordes, degradado, overlay **y la fotografía con sus ajustes**.
      Guardar solo los colores, que es lo que hacía el sistema anterior, deja media configuración.
- [x] **3 · Crear preset** — "Guardar la de ahora", con su nombre.
- [x] **4 · Nombres personalizados** — libres, sin nombres técnicos impuestos.
- [x] **5 · Lista visual** — cada preset con su miniatura, pintada con **las mismas funciones que
      pintan el fondo de verdad**: una imitación acabaría divergiendo y enseñaría algo que no es
      lo que se va a aplicar.
- [x] **6 · Preset activo** — con ✓, y **comparando lo que se ve, no ids** (ver abajo).
- [x] **7 · Cambiar de preset** — "Usar", y se aplica entero.
- [x] **8 · Vista previa** — la miniatura, y la vuelta atrás la da el sistema de FO F6.
- [x] **9 · Duplicar** — copia independiente de verdad (copia profunda, con prueba).
- [x] **10 · Editar** — "Actualizar" recoge la apariencia actual sin crear otro.
- [x] **11 · Guardar como nuevo** — "Guardar la de ahora" con otro nombre.
- [x] **12 · Eliminar** — con `BotonBorrar`; la conexión con Eliminados recientes es de la F12.
- [x] **13 · Presets incluidos** — JosStyle, Profundo, Claro y Minimal. **Ninguno trae una
      fotografía**: una foto es de quien la hizo, y un preset de fábrica con una imagen de archivo
      sería contenido inventado (regla 8).
- [x] **14 · No modificar los oficiales** — `esEditable` lo decide en un solo sitio. Intentar
      actualizar uno **no hace nada** en vez de fallar, y duplicarlo da un preset **tuyo**, que es
      la vía que da el propio apartado para personalizarlo.
- [x] **15 · Favoritos** — marcables, y arriba de la lista.
- [x] **16 · Orden** — favoritos primero, y **los oficiales al final**: son cuatro y siempre están,
      así que arriba ocuparían la primera pantalla y empujarían fuera lo que Josué ha creado.

**"Activo" tiene que decir la verdad, y por eso no se compara por id.** El id no dice nada: Josué
puede aplicar un preset y luego cambiar un color a mano, y entonces ya no está usando ese preset
aunque fuera el último que tocó. Se compara una **huella de lo que se ve** — y de ahí quedan fuera
el historial de ajustes por foto y el análisis de colores, porque no se ven y no deberían
desactivar un preset.

**`accent: null` en los oficiales significa "no toques el acento", no "ponlo a null".** Es lo que
permite que "JosStyle" devuelva la app a su estado de fábrica sin imponerle a Josué un color que él
no eligió. Con prueba propia.

**UN FALLO QUE HABRÍA APARECIDO SEGURO, evitado por un aviso que dejó la fase V4:** aplicar un
preset cambia cuatro cosas a la vez (tema, acento, colores y fondo), y encadenar
`updateAccent` + `updateTemaPersonalizado` + `updateApariencia` **habría perdido el fondo o el
tema sin dar ningún error** — cada una guarda el paquete `ajustes` entero leyendo el resto del
closure, y dos llamadas seguidas en la misma función no ven el `setState` de la anterior. El
payload se construye a mano con los valores nuevos explícitos, igual que ya hacía
`aplicarConjuntoTema`.

#### FO · Fase 9/12 — LEGIBILIDAD Y CONTRASTE INTELIGENTE ✅ COMPLETADA (v1.44.0)

En `src/lib/legibilidad.js`. La filosofía, literal del apartado 1: *"libertad total para
personalizar, pero con protección inteligente para que la interfaz siga siendo usable"*.

- [x] **1 · Objetivo** — comprueba fondo + foto + colores + textos + botones + tarjetas +
      navegación, todo junto.
- [x] **2 · Comprobación automática** — se recalcula solo cuando cambia algo relevante (`useMemo`
      sobre colores, fondo, análisis, tema y acento).
- [x] **3 · Texto sobre fotografías** — y aquí está lo difícil: **con una foto detrás no hay un
      color de fondo único**. `fondoEfectivo` compone las capas de verdad, en el mismo orden en
      que se pintan: tema → foto → luz → overlay → tarjeta.
- [x] **4 · Texto sobre colores** — texto sobre tarjeta, texto sobre botón, icono sobre barra.
- [x] **5 · Indicador** — *"El texto de las tarjetas cuesta leerlo con tu combinación actual"*.
      Sin tecnicismos, y los números están disponibles pero no en la cara.
- [x] **6 · Propuesta de corrección** — cada aviso trae **qué campo cambiar y a qué valor**, y
      toca **solo el parámetro problemático**: corregir el texto no toca la foto ni el acento.
- [x] **7 · No cambiar sin permiso** — **detectar y corregir son funciones distintas.** Revisar no
      muta nada; `correccionesDe` devuelve qué habría que cambiar, y aplicarlo es un botón.
- [x] **8 · Modo automático** — apagado de fábrica. El apartado es explícito: *"debe ser opcional,
      nunca obligar"*.
- [x] **9 · Control manual** — un color flojo **se avisa, no se impide**. Nada se bloquea.
- [x] **10 · Overlay inteligente** — foto clara + interfaz oscura → se propone oscurecerla.
- [x] **11 · Desenfoque como recurso** — foto con mucho detalle → desenfoque ligero. "Mucho
      detalle" es *"muchos colores sin que ninguno domine"*, medido sobre el análisis real.
- [x] **12 · Tarjetas y superficies** — *"no intentar resolver todos los problemas modificando el
      texto"*: cuando el problema es la foto, la propuesta toca **el fondo**, no los colores.
- [x] **13 · Navegación** — comprobada aparte, y **mirando la zona de abajo de la foto**, que es
      lo que tiene detrás.
- [x] **14 · Botones** — que no desaparezcan contra el fondo.
- [x] **15 · Iconos** — con umbral propio: *"un icono pequeño puede necesitar más contraste que un
      texto grande"*, así que el tamaño de fuente no es la referencia.
- [x] **16 · Contraste local** — el color de **la zona concreta**, no el medio de toda la imagen.
      Un texto arriba no está sobre el mismo color que un botón abajo.
- [x] **17 · Diferenciación entre elementos** — tarjeta contra fondo (ver abajo).

**Dos falsos positivos sobre la propia app, cazados por las pruebas y corregidos.** Los dos
importan porque **un aviso falso enseña a ignorar los avisos**, que es peor que no avisar:

1. **El texto de los botones.** Mi prueba ponía blanco a mano sobre el acento (4,28, por debajo de
   AA). La app **no usa blanco**: deriva el color con `bestReadableText`, que da 4,54. Estaba
   probando un color que la app nunca usa.
2. **La separación entre tarjeta y fondo.** JosStyle separa sus tarjetas **con el borde, no con el
   relleno**: la superficie es apenas más clara que el fondo (1,07 en oscuro, 1,10 en claro) y se
   ve perfectamente porque cada tarjeta lleva su borde. Comprobar solo el relleno marcaba la
   apariencia de fábrica como rota. Ahora se miran **las dos vías**, y solo hay problema cuando
   fallan ambas.

**Y una limpieza de raíz:** `NEGRO` y `BLANCO` viven ahora en `colorEngine.js`, que es el motor de
color, en vez de escribirse a mano en cada archivo que compone capas. No son colores de interfaz
—oscurecer es acercar al negro en tema claro y en oscuro— así que no pertenecen a `tokens.js`, y
ahora la capa de luz del fondo y el auditor usan exactamente el mismo par.

#### FO · Fase 10/12 — INTEGRACIÓN COMPLETA EN ASPECTO ✅ COMPLETADA (v1.45.0)

**Esta fase no añade funciones: ordena las que ya hay.** Ajustes → Apariencia había llegado a
**trece tarjetas seguidas** después de las fases 1-9, que en un iPhone es una pantalla entera de
scroll para encontrar cualquier cosa.

- [x] **1 · Objetivo** — un único centro de personalización visual. Nada vive en un menú aparte.
- [x] **2 · Estructura principal** — vista previa · Tema · **Fondo · Colores · Recomendado ·
      Apariencias guardadas · Legibilidad · Texto y movimiento** · Acciones.
- [x] **3 · No saturar la pantalla** — secciones plegables. Solo **Fondo** viene abierta, porque
      es de lo que va esta entrega; el resto se abren al tocarlas.
- [x] **4 · Fondo actual** — el subtítulo de la sección **Fondo** dice qué fondo hay puesto
      (`describirFondo`), así que se sabe sin abrirla.
- [x] **5 · Acceso rápido** — Tema y la vista previa quedan **fuera** de las secciones: son lo
      que más se toca y lo que sirve de referencia para todo lo demás.
- [x] **6 · Vista previa global** — fondo, tarjeta, botón, texto, iconos y barra inferior, en una
      sola pieza arriba del todo. Pintada con **las mismas funciones y los mismos tokens que la app
      de verdad** (`resolverFondo`, `estilosDeFondo`, `COLORS.surfaceAlpha`, `COLORS.navBgAlpha`,
      `COLORS.cardShadow`): una imitación acabaría divergiendo y enseñaría algo que no se aplica.
- [x] **7 · Navegación entre editores** — el editor de foto (F3), el recomendado (F6), la
      personalización (F7) y los presets (F8) se abren desde su sección. **No se duplica ninguno.**
- [x] **8 · Flujo completo** — elegir foto → editarla → recomendado → personalizar → comprobar
      legibilidad → guardar como preset, todo dentro de Apariencia.
- [x] **9 · Cambiar de fondo sin perder configuraciones** — ya garantizado desde F2 y F8.

**Lo que NO se ha tocado, y es deliberado:** tema, acento, tamaño de texto, densidad, bordes y
animaciones llevan en Apariencia desde la Fase A3 y **Josué ya sabe dónde están**. Se han agrupado,
no reordenado ni renombrado. Mover controles que alguien ya tiene memorizados es una regresión
aunque el orden nuevo sea "mejor".

**Dos roturas mías durante el trabajo, cazadas por la compilación:** reorganizar por rangos de
líneas partió un comentario JSX multilínea por la mitad y dejó una sección sin cerrar. `esbuild` lo
señaló con la línea exacta antes de que llegara a ninguna parte. Después se comprobó pieza por
pieza que las trece tarjetas originales siguen todas ahí.

#### FO · Fase 11/12 — RENDIMIENTO Y OPTIMIZACIÓN ✅ COMPLETADA (v1.46.0)

**El problema real no era ninguno de los que uno se imagina.** Las capas del fondo son CSS puro
(baratas), el análisis va sobre una miniatura de 96 px desde F5, y las propuestas son aritmética.
Lo caro era otra cosa: **la fotografía se subía y se servía a resolución original**. Una foto de
iPhone son 4032×3024 y unos 4 MB, y se estaba usando como fondo de una pantalla de 390 px de
ancho — megabytes descargados para pintar algo que no puede enseñar ni una décima parte de esos
píxeles.

- [x] **1 · Objetivo** — usar fotos, efectos y transparencias sin que la app se vuelva pesada.
- [x] **2 · Principio fundamental** — calidad visual ≠ coste de rendimiento. Se guarda una versión
      **optimizada** (1600 px de lado largo, JPEG 82 %) para usarla de fondo.
- [x] **3 · Optimización de fotografías** — se miden, se redimensionan y se recomprimen **justo
      antes de subir**, no al elegir: si se hiciera al elegir, cada foto que Josué mirase y
      descartara pagaría el trabajo para nada.
- [x] **4 · Diferentes versiones** — `LADO_FONDO` (1600) y `LADO_MINIATURA` (240) salen del mismo
      cálculo, con objetivos distintos.
- [x] **5 · Carga diferida** — la URL de la foto se firma solo cuando hay foto, y solo cuando
      cambia su ruta.
- [x] **6 · Caché** — **caché de URLs firmadas**. Duran una hora, y sin caché cada vez que se
      montaba Ajustes se pedía otra firma para la misma foto. Ahora, si hay una válida, el fondo
      aparece **al instante** en vez de parpadear.
- [x] **7 · Caché del detector** — ya estaba desde F5: el análisis va sellado con el id de su
      fotografía y no se repite si no ha cambiado.
- [x] **8 · Previsualización optimizada** — la vista previa usa `URL.createObjectURL`, que es
      local: no se procesa nada mientras se mueven los deslizadores.
- [x] **9 · Aplicación final** — al aplicar se sube la versión optimizada, con sus medidas reales.
- [x] **10 · Efectos visuales** — `backdropFilter` **solo cuando hay transparencia de verdad** (ya
      desde F4), y `cardShadow` es `'none'` sin sombra, no una sombra de opacidad cero.
- [x] **11 · Animaciones** — sin cambios: la app ya tiene el ajuste de animaciones desde la A3.
- [x] **12 · Renderizado** — cada cálculo caro va en su `useMemo` con sus dependencias reales.
- [x] **13 · Estado centralizado** — fondo, colores, presets y preferencias están en claves
      separadas desde F4 y F8, así que tocar un color no invalida el análisis de la foto.

**Tres decisiones que evitan hacer daño al optimizar:**

1. **Nunca agrandar.** Si la imagen ya es más pequeña que el objetivo se deja tal cual: escalar
   hacia arriba no añade detalle, solo peso y una imagen más borrosa.
2. **Si la copia pesa más, se queda la original.** Pasa con imágenes ya muy comprimidas.
   Recomprimir una foto ya ligera solo le quita calidad sin ahorrar nada.
3. **Si algo falla, se devuelve el archivo original** en vez de lanzar. No poder optimizar una
   foto no debe impedir usarla: es peor una foto pesada que ninguna foto.

**Un detalle que habría pasado desapercibido:** al optimizar hay que guardar **las medidas de la
foto ORIGINAL**, no las de la copia. La proporción y la orientación deciden el encuadre inicial
(F2, apartado 6), y calcularlo sobre la copia habría funcionado por casualidad —la proporción se
conserva— pero habría dejado en el modelo unas dimensiones que no son las de la imagen que Josué
eligió.

**Una URL a punto de caducar no se entrega.** La caché la considera vencida un minuto antes de
tiempo, para no dar una firma que expire mientras la imagen se está descargando.

**Y se aplicó también a las fotos de prenda del Armario**, que tenían exactamente el mismo problema:
~4 MB para pintar una miniatura de 150 px en una rejilla.

#### FO · Fase 12/12 — ELIMINADOS RECIENTEMENTE, RECUPERACIÓN Y CIERRE DEL SISTEMA ✅ COMPLETADA (v1.47.0)

**La fase entera se apoya en un hecho del que nadie se había dado cuenta: en Apariencia no se borra
nada.** Cambiar de fotografía no borra la anterior de Storage. Quitar el fondo tampoco. Y eso
cambia el sentido de "eliminados recientemente" aquí: en Salud o Calistenia la papelera guarda el
registro treinta días mientras el archivo desaparece; aquí el archivo **sigue estando**, así que
recuperar no es restaurar una copia — es volver a apuntar a algo que nunca se fue.

Por eso la fase no monta una papelera nueva. Reutiliza la de ME F3 para lo que sí se borra (los
presets) y añade una lista de fotografías sustituidas dentro del propio fondo para lo que no.

- [x] **1 · Objetivo** — que ninguna acción de Apariencia pierda nada de forma definitiva sin
      decirlo primero.
- [x] **2 · Información del elemento** — cada fotografía anterior enseña su miniatura, cuándo se
      sustituyó y sus medidas. Si la ficha es de antes de esta fase y no las tiene, dice
      "Fotografía anterior" y no se inventa una fecha (`describirFotoAnterior`, regla 8).
- [x] **3 · Recuperar** — `recuperarFoto` devuelve la imagen **con sus ajustes de entonces**
      (encuadre, zoom, luz, overlay), que `ajustesPorFoto` ya guardaba desde F3. Y la que estaba
      puesta pasa a la lista, así que recuperar tampoco pierde nada.
- [x] **4 · Eliminar definitivamente** — los presets, por la papelera de ME F3 (`eliminarPreset`);
      las fotografías anteriores, con `olvidarFotoAnterior`, que sí es irreversible y por eso pide
      confirmación.
- [x] **5 · Vaciar eliminados recientemente** — el de siempre, en Ajustes → Eliminados
      recientemente. No se ha creado una segunda pantalla.
- [x] **6 · Tiempo de retención** — el mismo ajustable de ME F3 (30 días por defecto) para los
      presets. Las fotografías anteriores no caducan: el archivo sigue en Storage, así que ponerles
      un reloj sería inventar un vencimiento que no existe.
- [x] **7 · No eliminar el fondo activo accidentalmente** — `recordarFotoAnterior` solo guarda
      fichas de fotos que **ya no están puestas**; la activa nunca entra en la lista, así que no
      hay ningún botón que pueda quitarla desde ahí.
- [x] **8 · Presets que utilizan fotografías** — se detecta la dependencia y **se marca**: la
      miniatura de un preset con foto lleva su icono. Sin eso parecía un degradado cualquiera,
      porque la miniatura no firma URLs (serían varias firmas a la vez para un recuadro de 44 px).
- [x] **9 · Recuperación de dependencias** — no hace falta ninguna reparación: como la foto nunca
      se borra, un preset que la use sigue funcionando siempre.
- [x] **10 · Eliminar un preset** — no toca la fotografía. Va a la papelera, así que se recupera.
- [x] **11 · Eliminar una fotografía** — no toca los presets que la usen.
- [x] **12 · Sustituir fotografía** — la sustituida se recuerda en vez de desaparecer. Este era el
      agujero real: hasta ahora cambiar de foto dejaba el archivo en Storage y ninguna forma de
      volver a él.
- [x] **13 · Confirmación inteligente** — solo lo irreversible la pide. Borrar un preset no
      (vuelve de la papelera); olvidar una fotografía anterior sí. Mismo criterio que ME F3.
- [x] **14 · Recuperar configuración completa** — un preset restaurado vuelve con tema, acento,
      colores y fondo enteros, porque `crearPreset` guarda copia profunda desde F8.
- [x] **15 · Recuperación de fotografías** — hasta **8** (`MAX_FOTOS_ANTERIORES`). No más: la
      lista viaja entera en cada `saveData`, como `ajustesPorFoto`.
- [x] **16 · Estados** — sin fotografías anteriores el bloque no se dibuja; mientras se firma cada
      miniatura se ve su hueco con icono, nunca un `img` roto.
- [x] **17 · Protección contra duplicados** — una foto que va y vuelve se mueve al frente de la
      lista, no se duplica.
- [x] **18 · Sincronización futura** — todo vive dentro de `ajustes.apariencia.fondo`, que ya
      sincroniza. No hay ninguna tabla ni clave nueva.
- [x] **19 · Seguridad** — el bucket `fondos` es privado y sus políticas RLS son por carpeta de
      usuario (F2). Las miniaturas se firman una a una y solo al montarse; nadie puede pedir la
      ruta de otro.
- [x] **20 · Copias y restauración** — la exportación de apariencia ya incluye el fondo entero.
- [x] **21 · Experiencia visual** — filas con miniatura, texto y dos acciones. Se esconde mientras
      hay una foto pendiente o el editor abierto: ahí Josué está decidiendo sobre UNA imagen y una
      lista de otras solo estorba.
- [x] **22 · Elementos vacíos** — sin lista no hay bloque; sin ficha completa, texto neutro.
- [x] **23 · Cierre del sistema** — el bloque FO queda cerrado, 12 de 12.
- [x] **24 · Prueba final obligatoria** — 1414 comprobaciones y 9 reglas invariantes, todas en
      verde, con el build de Vite incluido.
- [x] **25 · Criterios de finalización** — los doce.
- [x] **26 · Resultado final de las 12 fases** — fondo, fotografía, editor, colores, detector,
      recomendado, personalización manual, presets, legibilidad, integración, rendimiento y
      recuperación.
- [x] NO romper funcionalidades existentes.
- [x] NO eliminar módulos actuales.
- [x] NO implementar las 12 fases de golpe.
- [x] Ejecutar únicamente la fase que yo indique.
- [x] Mantener compatibilidad con las fases anteriores.
- [x] Preparar las estructuras necesarias para fases posteriores sin implementar prematuramente toda su funcionalidad.
- [x] El usuario siempre debe conservar control manual.
- [x] Recomendado nunca debe sobrescribir modificaciones manuales.
- [x] Las fotografías originales no deben modificarse destructivamente.
- [x] Los presets deben conservar configuraciones completas.
- [x] Las eliminaciones importantes deben poder recuperarse.
- [x] La interfaz debe seguir siendo premium y sencilla.
- [x] Todo debe funcionar correctamente en móvil/PWA.
- [x] Optimizar antes de introducir efectos innecesariamente pesados.
- [x] Si existe una funcionalidad ya implementada que puede reutilizarse, reutilizarla en lugar de duplicarla.
- [x] Si una fase requiere modificar arquitectura existente, hacerlo de forma compatible y segura.
- [x] Antes de terminar una fase, comprobar que las funcionalidades existentes siguen funcionando.
- [x] RESTRICCIONES IMPORTANTES
- [x] REGLA PRINCIPAL PARA CLAUDE

**Lo que esta fase arregló sin buscarlo:** los presets se podían crear y no borrar. El botón
existía, pero se limitaba a filtrarlos de la lista y se perdían para siempre. Ahora pasan por la
papelera de ME F3 como todo lo demás — es el noveno módulo con ese mismo fallo desde que existe la
verificación automática.

**Un error de test que valió la pena:** la comprobación de que la lista conserva las más recientes
fallaba por uno. La `h12` es la foto **activa**, así que la primera de las *anteriores* es la
`h11`, no la `h12`. El código estaba bien; la expectativa, mal.

⚠️ **Recordatorio para Josué:** el bucket `fondos` de `supabase/schema.sql` sigue pendiente de
ejecutar en el SQL Editor. Sin él, subir fotos de fondo no funciona (todo lo demás sí).

---

## BI · BUSCADOR GLOBAL + IA + DESPLEGABLE DE INICIO — 4 fases

Rediseña el desplegable de Inicio y convierte el botón superior izquierdo en un acceso único de búsqueda + IA. **Amplía `UniversalSearchModal` y `SuggestionsButton` (Fase 18), no los sustituye.** La Fase 1 se solapa con el `IndicadorContexto` del Dashboard ya construido.

#### BI · Fase 1/4 — REDISEÑO DEL DESPLEGABLE DE INICIO ✅ COMPLETADA (v1.28.0)
- [x] COMPORTAMIENTO PRINCIPAL — cerrado por defecto, una sola fila de alto.
- [x] ESTADO ABIERTO — muestra las tres situaciones **y sus consejos**.
- [x] ANIMACIÓN DE APERTURA — `grid-template-rows` 0fr↔1fr + opacidad + desplazamiento de 4px,
      con `--ease-premium`. **No** es `display:none → block`.
- [x] BOTÓN DE EXPANSIÓN — chevron que rota 180° con transición; **toda la cabecera** es pulsable,
      no solo el icono.
- [x] CONTENIDO DEL DESPLEGABLE — **este era el hueco real de la fase.** Antes solo se podían LEER
      consejos; para cambiar de situación había que salir a Personalización. Ahora las tres
      situaciones se activan desde el propio desplegable.
- [x] DISEÑO VISUAL — mismo lenguaje que el resto: `COLORS.surface`, borde de 1px, `rounded-3xl`,
      sin sombras ni adornos nuevos.
- [x] PRIORIDAD: ESPACIO EN PANTALLA — el alto cambia **físicamente**; cerrado no reserva nada.
- [x] RESPONSIVE / MÓVIL — zona táctil de fila completa, chips con `flex-wrap`, `truncate` en la
      etiqueta. ⚠️ El aspecto final en un iPhone real sigue pendiente de Josué (**R1**).
- [x] ESTADO Y PERSISTENCIA — un único `expandido` local. **No se guarda en Supabase**: la
      especificación dice que no se creen datos innecesarios, y abrir/cerrar no es una preferencia.
- [x] ACCESIBILIDAD Y USABILIDAD — `aria-expanded`, `aria-controls` apuntando a un id que existe de
      verdad, `role="region"` con nombre, y `aria-pressed` en cada situación (son interruptores).
- [x] NO ROMPER NADA EXISTENTE
  - [x] Localiza cómo está implementado actualmente. — `IndicadorContexto` en `DashboardView.jsx`.
  - [x] Identifica todos los estados relacionados. — `personalizacion.modo` y el `expandido` local.
  - [x] Identifica todos los datos que utiliza. — `MODOS_APP` de `tokens.js`. Nada más.
  - [x] Identifica todas las acciones que ejecuta. — `setModoApp` (toggle) en `App.jsx`.
  - [x] Mantén esas funcionalidades. — cero datos nuevos; el selector de Personalización sigue ahí
        y toca el mismo interruptor (decisión **D2-07**: integrar, no duplicar).
  - [x] Cambia únicamente la presentación y el comportamiento necesario. — un solo componente
        tocado, más la prop `onSetModo` que lo alimenta.
- [x] CONTROL DE CALIDAD — 18 comprobaciones automáticas (`scripts/test-inicio.jsx`), en
      `verificar.sh`.
- [x] REGLA IMPORTANTE — el espacio ocupado cambia de verdad, no es una tarjeta grande que recorta
      contenido.
- [x] RESULTADO FINAL ESPERADO — cerrado: `Situación · etiqueta ⌄`. Abierto: las tres situaciones
      con sus opciones y consejos.
- [x] Comprueba que no se ha roto ninguna funcionalidad existente. — 223 comprobaciones en verde.
- [ ] Comprueba el comportamiento en móvil. — ⚠️ **solo lo puede hacer Josué** (R1).
- [x] Comprueba apertura y cierre repetidos. — es un booleano con transición CSS, sin estado
      acumulado que se pueda desincronizar.
- [ ] Comprueba modo oscuro/claro si ambos existen. — ⚠️ **pendiente de verificación visual**. El
      componente solo usa tokens de `COLORS`, así que sigue el tema por construcción.
- [x] Comprueba que no quedan espacios vacíos al cerrar. — el contenedor colapsa a 0fr; el padding
      inferior vive **dentro** del panel, no en el contenedor.
- [x] No avances automáticamente a la Fase 2. — respetado: BI F2 va en su propio turno.

**Hallazgo de esta fase, apuntado para no repetirlo:** el componente entero era un `<button>`. Meter
dentro los selectores de situación habría dado **botones anidados** — HTML inválido que no rompe el
render y que en iOS hace que el toque interior se lo coma el exterior. Ahora la cabecera es el botón
y el contenido su hermano, y `scripts/smoke-vistas.jsx` comprueba lo mismo en **las 13 vistas × 4
escenarios**, para que no vuelva a colarse en ningún sitio.

#### BI · Fase 2/4 — Acceso superior izquierdo: búsqueda/IA ✅ COMPLETADA (v1.29.0)
- [x] Buscar cualquier función, pantalla, ajuste u opción existente. — 19 módulos + 14 funciones
      de dentro de Ajustes.
- [x] Encontrar opciones aunque el usuario no escriba exactamente su nombre. — "dinero" → Economía,
      "dormir" → Sueño, "modo noche" → Colores y tema. Sin tildes y sin mayúsculas también.
- [x] Acceder directamente al resultado encontrado. — pulsar abre el sitio exacto, categoría de
      Ajustes incluida; no deja a Josué en la lista para que la busque él.
- [x] Hacer preguntas a la IA cuando no esté buscando una función concreta.
- [x] Mantener una experiencia rápida, limpia y premium. — búsqueda local sobre ~33 entradas, sin
      red y sin debounce.
- [x] BOTÓN SUPERIOR IZQUIERDO — la lupa se muda a la izquierda; el panel de sugerencias se va a la
      derecha. **Se intercambian, no se elimina ninguno**: son cosas distintas y la especificación
      prohíbe quitar funcionalidad.
- [x] APERTURA DEL BUSCADOR — el mismo modal con `createPortal` de siempre (regla 3).
- [x] CAMPO DE BÚSQUEDA — icono, campo, botón de limpiar, botón de cerrar y foco automático al
      abrirse.
- [x] DOS TIPOS DE BÚSQUEDA — funciones (índice local) y preguntas (IA sobre los datos).
- [x] BÚSQUEDA INTELIGENTE — nombre, descripción y palabras clave, con sinónimos escritos a mano
      porque no se pueden derivar de nada ("dinero" no aparece en ningún sitio del código).
- [x] ÍNDICE INTERNO DE FUNCIONES — `src/lib/indiceBusqueda.js`, con `id/titulo/descripcion/
      palabras/categoria/tab/icono`, tal cual pide el apartado 6.
- [x] RESULTADOS — aparecen mientras escribe, con icono, nombre, ubicación y descripción.
- [x] ORDEN DE RESULTADOS — los cinco escalones del apartado 8, con los pesos lo bastante separados
      como para que ninguna suma de coincidencias débiles adelante a una fuerte:
  - [x] Coincidencia exacta. (1000)
  - [x] Coincidencia con el nombre. (800 empieza / 600 contiene)
  - [x] Coincidencia con palabras clave. (500 / 400 / 300)
  - [x] Coincidencia con descripción. (150)
  - [x] Coincidencias semánticamente relacionadas. (80 — todas las palabras sueltas presentes)
- [x] RESULTADO SIN COINCIDENCIAS — "No hemos encontrado esa función" + ofrecer la IA. Nunca una
      pantalla vacía.
- [x] IA — recibe el texto ya escrito; no se le pide que lo repita.
- [x] DIFERENCIACIÓN ENTRE BÚSQUEDA Y PREGUNTA — detecta la intención y, cuando hay las dos cosas,
      **enseña las dos**. "¿cómo cambio los colores?" saca la IA arriba y Apariencia debajo.
- [x] ACCESO DIRECTO — reutiliza `navegarDesdeHoy`, el deep-link que ya existía. Ni un sistema de
      navegación nuevo.
- [x] ANIMACIONES — `active:scale` en la lupa y en cada resultado. Sin efectos de entrada por
      resultado: el apartado 13 dice "VELOCIDAD > EFECTOS" y animar una lista que cambia con cada
      tecla la haría parecer más lenta, no más premium.
- [x] MÓVIL — la lista de resultados scrollea dentro de `46vh`, así que con el teclado abierto el
      campo sigue visible y los resultados no quedan detrás. ⚠️ Comprobación real en iPhone:
      pendiente de Josué (**R1**).
- [x] CIERRE — botón X, toque fuera del panel, y el estado temporal se va con el modal.
- [x] NO MODIFICAR LA IA ACTUAL SIN NECESIDAD — se **amplía** `UniversalSearchModal`; `askAI` y la
      función serverless no se tocan, y ninguna clave sale al frontend.
- [x] ARQUITECTURA PREPARADA PARA CRECER — el índice se **deriva de `MORE_NAV`**, así que un módulo
      que una fase futura añada ahí aparece solo. Y `comprobar-navegacion.mjs` falla si alguien
      añade un módulo sin palabras clave, o deja palabras de uno que ya no existe.
- [x] SEGURIDAD — el índice es de funciones, **no contiene ni un dato de Josué**. Relación se
      encuentra como pantalla, pero abrirla sigue pasando por su PIN: el buscador navega, no salta
      protecciones.
- [x] CONTROL DE CALIDAD — las nueve búsquedas del apartado 19, automatizadas en
      `scripts/test-buscador.mjs` (58 comprobaciones).
- [x] REGLA FUNDAMENTAL — BUSCAR → ENCONTRAR → ABRIR, y PREGUNTAR → IA → RESPUESTA, desde el mismo
      acceso.

**Decisión de honestidad, apuntada:** el control de calidad pide que "racha" y "sonidos" encuentren
sus módulos *"si el módulo existen"*. Rachas y Sonido son fases futuras y **no se han fingido**
(regla 8). "racha" lleva a Productividad, que es donde están hoy las rachas de hábitos de verdad;
"sonidos" no devuelve nada. La prueba comprueba justo eso: que no aparezca un módulo inventado.

**Un fallo silencioso corregido de paso:** `TextInput` era un componente de función normal, así que
se tragaba la `ref` sin decir nada — el foco automático del campo simplemente no habría ocurrido, sin
error ni aviso. Ahora usa `forwardRef`. Es aditivo: ninguno de los ~60 usos anteriores pasa `ref`.

#### BI · Fase 3/4 — MOTOR DE BÚSQUEDA GLOBAL E ÍNDICE INTELIGENTE ✅ COMPLETADA (v1.30.0)
- [x] PRINCIPIO FUNDAMENTAL — el flujo del apartado 1, entero y **local**: normalizar → analizar →
      índice → relevancia → resultados → acción. La IA no interviene para encontrar una función.
- [x] ÍNDICE GLOBAL — `src/lib/indiceBusqueda.js`, una única fuente de verdad.
- [x] INFORMACIÓN DE CADA FUNCIÓN — `id`, `titulo`, `descripcion`, `categoria`, `palabras`,
      `sinonimos`, `icono`, `tab`, `foco`, `tipo` y `prioridad`. Los once campos del apartado 3,
      con nombres en castellano como el resto del proyecto.
- [x] NORMALIZACIÓN DE TEXTO — minúsculas, tildes, espacios, signos de puntuación y **singular /
      plural**. "Configuración" y "configuracion" son lo mismo; "colores" y "color", también.
- [x] COINCIDENCIA EXACTA — máxima prioridad, por delante de cualquier descripción.
- [x] COINCIDENCIA PARCIAL — "colo" → Colores, "entren" → Entrenamiento, "dormi" → Sueño.
- [x] PALABRAS RELACIONADAS — palabras clave **y** sinónimos, en dos escalones distintos.
      Controlado y escrito a mano; nada de asociaciones automáticas impredecibles.
- [x] RANKING DE RESULTADOS — nueve escalones, del título exacto (1000) a la errata (40).
- [x] DESAMBIGUACIÓN — "objetivo" devuelve varias opciones ordenadas, con Objetivos primero. No
      elige arbitrariamente, y el orden es **determinista**: la misma consulta da siempre lo mismo.
- [x] ACCIONES DIRECTAS — "nueva tarea" no abre Productividad para que Josué busque el botón: abre
      el formulario.
- [x] FUNCIONES SIN RUTA — tres tipos de destino: `pantalla`, `ajuste` (abre su categoría) y
      `accion` (abre un formulario). El buscador ya no está limitado a páginas.
- [x] ÍNDICE POR CATEGORÍAS — Módulo / Ajustes / Acción. **Sin inventar Rachas ni Sonidos**, que
      todavía no existen (lo dice el propio apartado 12).
- [x] ACTUALIZACIÓN DEL ÍNDICE — los módulos se **derivan de `MORE_NAV`**, así que uno nuevo
      aparece solo. Y `comprobar-navegacion.mjs` falla si se añade sin palabras clave: el índice no
      puede quedarse desconectado de la aplicación, que es lo que el apartado 13 quiere evitar.
- [x] BÚSQUEDA DE AJUSTES — 15 entradas de configuración, cada una abriendo su categoría.
- [x] BÚSQUEDA DE FUNCIONES PROFUNDAS — el ejemplo literal del apartado 15: "modo oscuro" tiene
      entrada propia aunque viva dentro de Apariencia, y abre directamente ahí.
- [x] HISTORIAL RECIENTE — 4 accesos, con botón de limpiar. **Guarda ids de funciones, nunca el
      texto escrito** (una búsqueda puede ser una pregunta personal) y vive en `localStorage`, no
      en Supabase: no es un dato que merezca sincronizarse ni entrar en la copia de seguridad.
- [x] SUGERENCIAS INICIALES — Sueño, Entrenamiento, Economía y Ajustes, **sacadas del índice real**;
      un módulo desactivado no se sugiere.
- [x] TOLERANCIA A ERRORES — "colroes" encuentra Colores y avisa con "¿Quizá buscas…?".
- [x] RENDIMIENTO — todo local sobre ~38 entradas normalizadas una sola vez al construir el índice.
      Ni red, ni IA, ni debounce.
- [x] IA COMO FALLBACK — el flujo del apartado 20 exacto: si hay función, se muestra; si no la hay
      o es una pregunta, se ofrece la IA. Y si hay las dos cosas, se enseñan las dos.
- [x] PRIVACIDAD — escribir "colores" **no sale del dispositivo**. La prueba lo comprueba leyendo
      el propio archivo del motor: no importa `askAI` ni hace `fetch`.
- [x] PRUEBAS OBLIGATORIAS — las seis categorías del apartado 22 (exactas, parciales, sinónimos,
      erratas, preguntas y sin resultados), en `scripts/test-buscador.mjs` — 99 comprobaciones.
- [x] CRITERIO DE ÉXITO — los nueve puntos del apartado 23.
- [x] REGLA FINAL — añadir una función al buscador es **una entrada** en el índice; un módulo nuevo
      en `MORE_NAV` ni eso.

**Dos bugs reales que encontraron las pruebas de esta fase:**

1. **El singular/plural atropellaba palabras clave escritas literalmente.** Buscar "pantallas"
   abría *Pantalla principal* (que solo coincide después de quitarle la 's') en vez de Bienestar,
   que tiene "pantallas" tal cual entre sus palabras. La causa era estructural: `puntuar` iba
   devolviendo el primer acierto por campos, así que una coincidencia floja en el título ganaba a
   una fuerte en las palabras clave. Ahora se evalúan todos los escalones y se coge el mayor, y el
   plural tiene su propio escalón por debajo de la coincidencia literal.
2. **La raíz destrozaba palabras cortas acabadas en 's'**: "tres" se quedaba en "tre", "mes" en
   "me". El umbral pasó de 3 a 4 letras.

**Y una decisión de diseño que salió de una prueba fallida:** la distancia de edición es de
**Damerau**-Levenshtein, no Levenshtein a secas. Con Levenshtein, "colroes" está a 2 errores de
"colores" y no se encontraba; contando el intercambio de dos letras seguidas como UN error, se
encuentra. Las transposiciones son con diferencia la errata más común escribiendo deprisa en un
móvil — y es justo el ejemplo que pone la especificación.

#### BI · Fase 4/4 — INTEGRACIÓN FINAL: BUSCADOR + IA + INTENCIÓN ✅ COMPLETADA (v1.31.0)
- [x] EXPERIENCIA PRINCIPAL — un solo sistema desde la lupa. Josué no tiene que decidir si busca o
      pregunta: escribe y JosStyle decide.
- [x] CASO: EL USUARIO BUSCA UNA FUNCIÓN — resultado + abrir directo, sin pantallas intermedias.
- [x] CASO: EL USUARIO HACE UNA PREGUNTA — la IA arriba, con la pregunta ya escrita.
- [x] CASO: EXISTEN LAS DOS POSIBILIDADES — "¿Cómo cambio los colores?" enseña **las dos**.
- [x] DETECCIÓN DE INTENCIÓN — las tres categorías del apartado 5: navegación, pregunta y **acción**.
- [x] DETECCIÓN HÍBRIDA — no depende del signo '¿'. "cambiar colores" se detecta como acción por el
      verbo; una frase larga sin verbo ni interrogación va a la IA.
- [x] PRIORIDAD — con una función encontrada y una intención que no sea preguntar, **la función va
      primero** y la IA queda debajo. No se gasta una llamada a la IA en algo que la app hace sola.
- [x] PREGUNTAS ABIERTAS — "¿Qué ejercicios para mejorar mi planche?" → la IA manda.
- [x] RESPUESTA DE LA IA — dentro del mismo modal, con los mismos tokens, tipografía y bordes. No
      hay una segunda experiencia visual.
- [x] CONTEXTO DE JOSSTYLE — se mantiene el `buildContext` de siempre; ni más datos ni menos.
- [x] NAVEGACIÓN DE VUELTA — **arreglado un hueco real**: buscar "colores" desde Inicio y pulsar
      atrás dejaba a Josué en el hub de "Más", donde no había estado. Ahora vuelve a donde estaba.
- [x] CIERRE DEL SISTEMA — cerrar no toca ningún dato ni ejecuta nada.
- [x] ESTADOS DE LA INTERFAZ — los ocho:
  - [x] 1 cerrado · [x] 2 abierto sin texto (recientes + sugerencias) · [x] 3 escribiendo
  - [x] 4 con resultados · [x] 5 pregunta detectada · [x] 6 sin resultados
  - [x] 7 respuesta de la IA · [x] 8 error con reintentar
- [x] ESTADO DE CARGA — "Pensando…" con su rueda; el resto de la app sigue viva.
- [x] ERRORES DE IA — **nada técnico**: un mensaje con pinta de código o número de estado se
      sustituye por "No he podido responder ahora mismo", con **Reintentar** y el buscador intacto.
- [x] SEGURIDAD DE LA IA — sigue pasando por `api/ask-ai.js`; ninguna clave en el frontend.
- [x] RENDIMIENTO — la búsqueda es local e instantánea; la IA solo cuando se pulsa.
- [x] DISEÑO MÓVIL — lista con scroll propio, campo siempre visible con el teclado abierto.
      ⚠️ Comprobación real en iPhone: pendiente de Josué (**R1**).
- [x] MICROINTERACCIONES — solo las que pide el apartado: pulsación, apertura, selección, cierre.
- [x] PRUEBAS COMPLETAS — **los ocho casos del apartado 20, literales**, en
      `scripts/test-buscador.mjs`.
- [x] PRUEBA DE NO REGRESIÓN — 352 comprobaciones en verde: build, 52 casos de renderizado de las
      13 vistas y las 9 reglas invariantes.
- [x] NO SOBREDISEÑAR — un campo, una lista, un botón de IA. Sin menús ni pestañas dentro.
- [x] RESULTADO FINAL — lupa arriba a la izquierda, sugerencias arriba a la derecha, y **los paneles
      de IA de cada módulo intactos**: el apartado 23 pide expresamente que el buscador nuevo no
      rompa el acceso inferior existente.
- [x] CRITERIO DEFINITIVO DE ÉXITO — "no sé dónde está algo" → lupa → "colores" → abrir → allí.

**Lo que hacía falta para cumplir el apartado 7, y no era obvio:** buscar la frase entera no
encontraba nada. "quiero añadir un objetivo" no coincide con ninguna entrada, porque ninguna
contiene la palabra "quiero". Sin quitar ese envoltorio, la prioridad de la función sobre la IA era
imposible de cumplir: no había función que priorizar. Ahora `nucleoDeConsulta` deja "anadir
objetivo" y el resultado sale — pero solo **si la frase entera no ha encontrado nada**, para no
aflojar una búsqueda que ya era precisa.

**La decisión sobre toda la lógica de intención:** vive en `indiceBusqueda.js`, no en el componente.
Así los ocho casos del apartado 20 son ocho llamadas a `resolverConsulta()` que se prueban sin
renderizar nada, y la interfaz solo pinta lo que le dicen.

---

---

## ME · LIBERTAD DE APARTADOS + ELIMINADOS RECIENTEMENTE — 4 fases

Sistema global de módulos activables/desactivables, personalización y papelera universal con recuperación. **Las fases 1 y 2 se solapan casi por completo con `PersonalizationView` y `personalizacion.ocultos` (Fase 19), ya construidos** — aquí el trabajo real es la papelera (fase 3) y la auditoría de integración global (fase 4).

#### ME · Fase 1/4 — SISTEMA DE MÓDULOS ACTIVABLES/DESACTIVABLES ✅ **COMPLETADA (v1.24.0)**

> **Qué se construyó:** "Personalizar mi sistema" en Ajustes → Pantalla principal — centro de
> módulos agrupado por área, con icono, nombre, **descripción**, estado e **interruptor ON/OFF**
> real (nuevo componente `Switch` compartido). Confirmación al desactivar que insiste en que los
> datos se conservan; ninguna al reactivar.
>
> **La parte importante:** desactivar ahora **reconstruye de verdad la interfaz**. Antes de esta
> fase `personalizacion.ocultos` solo filtraba los hubs, así que un módulo desactivado seguía
> apareciendo en "Hoy". Ahora desaparece también de las tarjetas de Nivel 1/2/3, de los avisos, de
> los accesos a Calendario y Agenda, del recordatorio de Relación, de las acciones rápidas (y la
> fila entera se va si no queda ninguna) y **de la puntuación diaria** — si has dicho que no usas
> Sueño, no te baja la nota por no registrarlo.
>
> **Verificado con 16 pruebas de comportamiento** sobre el HTML renderizado (`scripts/test-modulos.jsx`),
> no solo "no revienta": se comprueba que lo desactivado *desaparece* y que lo demás sigue ahí.

**Objetivo**
- [x] El usuario puede decidir qué apartados quiere utilizar

**Centro de módulos**
- [x] Apartado dentro de Ajustes: "Personalizar mi sistema"
- [x] Aparecen todos los módulos disponibles
- [x] Cada módulo con **icono**
- [x] Cada módulo con **nombre**
- [x] Cada módulo con **descripción** (nueva constante `DESCRIPCIONES_MODULOS`, ≤80 caracteres)
- [x] Cada módulo con **estado** visible
- [x] Cada módulo con **interruptor ON/OFF** (nuevo componente `Switch`, accesible por teclado)
- [x] Agrupado por áreas, como muestra la especificación
- [x] Contador de cuántos módulos están activos

**Desactivar no significa eliminar**
- [x] Desactivar **NO borra los datos**
- [x] Deja de aparecer en navegación
- [x] Deja de aparecer en el Dashboard
- [x] Deja de aparecer en accesos rápidos
- [x] Deja de ocupar espacio visual (la fila entera se retira si queda vacía)
- [x] Deja de mostrarse como módulo activo
- [x] Al reactivarlo, todo sigue ahí
- [x] Confirmación al desactivar que dice explícitamente que no se borra nada
- [x] Sin confirmación al reactivar (acción segura y reversible)

**Navegación dinámica**
- [x] Hubs de área (ya funcionaba desde la Fase 19)
- [x] Dashboard — tarjetas de Nivel 1, 2 y 3
- [x] Avisos automáticos (sueño corto, racha en riesgo, examen sin horas)
- [x] Accesos a Calendario y Agenda
- [x] Recordatorio de Relación
- [x] Acciones rápidas
- [x] Puntuación diaria (un módulo desactivado no cuenta ni penaliza)
- [x] "Ajustes" nunca se puede desactivar (regla 40 — sin él no habría vuelta atrás)
- [-] Menú lateral — no existe en esta app (la navegación es de 5 pestañas + hubs)
- [ ] Buscador universal — sigue buscando sobre datos, no sobre funciones. Se aborda en **BI Fase 3**, que es donde se construye el índice de funciones
- [ ] Estadísticas — `StatsView` calcula correlaciones sobre datos, no muestra módulos; se revisará si al construir **ME Fase 2** aparece un caso real

#### ME · Fase 2/4 — PERSONALIZACIÓN TOTAL ✅ **COMPLETADA (v1.25.0)**

**Orden de módulos**
- [x] Permitir cambiar el orden (flechas arriba/abajo, ya existentes desde la Fase 19)
- [ ] **Drag & drop** — decisión documentada: el apartado 103 de Ajustes admite explícitamente
      "controles accesibles equivalentes", y las flechas lo son. Pendiente solo si Josué lo pide

**Dashboard personalizable ("Mi pantalla de inicio")**
- [x] Elegir qué información se ve en la pantalla principal
- [x] Lista de módulos con casilla/interruptor por cada uno
- [x] **Módulo activado ≠ necesariamente visible en Dashboard** (dos listas separadas)
- [x] Contador de cuántos están visibles
- [x] Solo se listan módulos activos (no ofrecer un control que no haría nada)
- [x] Estado vacío honesto si no hay ningún módulo activo

**Navegación personalizable**
- [x] El contenido de cada hub respeta orden, iconos y módulos activos
- [-] Accesos principales configurables — **choca con una regla del propio Josué** (barra inferior
      de exactamente 5 pestañas, nunca una sexta, repetida en dos prompts). Requiere que él decida

**Configuraciones predefinidas**
- [x] Perfil **Completo** (todos los módulos activados)
- [x] Perfil **Estudiante** (Estudios + Productividad + Salud)
- [x] Perfil **Fitness** (Entrenamiento + Nutrición + Sueño + Salud)
- [x] Perfil **Minimalista** (solo lo esencial)
- [x] Los perfiles **NO bloquean** la personalización posterior
- [x] Confirmación previa que dice cuántos apartados quedarán activos
- [x] Un perfil solo cambia qué módulos están activos, nunca el orden/iconos/PIN/favoritas

**Guardado de la personalización**
- [x] Asociada a la cuenta (clave `personalizacion` en Supabase, ya existente)
- [x] Se mantiene al cerrar sesión y volver a entrar
- [x] Se mantiene al cambiar de dispositivo o navegador
- [x] Se mantiene al instalar la PWA
- [x] Sincronizada por la arquitectura actual, sin backend nuevo

**Dependencias entre módulos**
- [x] Modeladas explícitamente (`DEPENDENCIAS_MODULOS`) y verificables por script
- [x] Aviso al desactivar un módulo del que dependen otros activos
- [x] El aviso nombra los módulos afectados
- [x] Nunca deja la app en un estado roto: avisa, no bloquea ni desactiva en cascada
- [x] No avisa de dependientes que Josué ya tiene desactivados (sería ruido)

#### ME · Fase 3/4 — SISTEMA DE ELIMINADOS RECIENTEMENTE ✅ **COMPLETADA (v1.26.0)**

**Objetivo**
- [x] Al eliminar, el elemento NO desaparece para siempre: pasa a la papelera
- [x] Apartado "🗑️ Eliminados recientemente" dentro de Ajustes
- [x] Sistema **global y reutilizable**, no una solución por módulo (26 colecciones)

**Contenido de la papelera**
- [x] Cada elemento muestra información suficiente para identificarlo
- [x] Tipo de elemento visible ("Tarea", "Examen", "Movimiento"...)
- [x] Cuánto hace que se eliminó ("hace 2 horas", "ayer", "hace 3 días")
- [x] Datos relevantes según el tipo de elemento
- [x] Cuántos días le quedan antes de borrarse solo

**Acciones**
- [x] **Recuperar** — devuelve el elemento exactamente donde estaba
- [x] **Eliminar definitivamente** — permanente
- [x] Confirmación previa: "¿Eliminar definitivamente? Este elemento no podrá recuperarse después"
- [x] **Vaciar papelera** con su propia confirmación

**Recuperación (los 7 puntos de la especificación)**
- [x] 1. El elemento vuelve a su módulo original
- [x] 2. Recupera sus datos (el objeto íntegro, no una copia nueva)
- [x] 3. Recupera sus relaciones cuando es posible (cascada asignatura → exámenes + horas)
- [x] 4. Vuelve a aparecer en estadísticas (al volver a su módulo, los cálculos lo recogen solos)
- [x] 5. Vuelve a aparecer en el Dashboard si correspondía
- [x] 6. Se sincroniza con la cuenta (clave `papelera` en Supabase)
- [x] 7. Desaparece de Eliminados recientemente
- [x] **Es una recuperación REAL**, no volver a mostrar una copia — verificado comprobando que el
      estado restaurado es idéntico al de partida

**Tiempo de retención**
- [x] Sistema preparado para establecer un tiempo de retención
- [x] 30 días por defecto
- [x] Fácil de cambiar (constante + selector en la interfaz)
- [x] Opción "Conservar hasta que yo lo elimine definitivamente"
- [x] La purga se aplica al abrir la app y al acortar el plazo

**Información del elemento eliminado (metadatos)**
- [x] ID original
- [x] Tipo de elemento
- [x] Módulo (y colección)
- [x] Fecha de creación
- [x] Fecha de eliminación
- [x] Datos necesarios para la recuperación (el objeto completo)
- [x] Usuario propietario (implícito: la clave vive bajo su `user_id` con RLS)
- [x] Relaciones necesarias (`relacionados`, para el borrado en cascada)
- [x] Información de posición/origen (`indice`)
- [x] **NO se almacena simplemente una etiqueta de "eliminado"**

**Decisiones y límites**
- [x] La papelera entra en el snapshot del deshacer, para que los dos sistemas no se pisen
- [x] Borrado definitivo y vaciado quedan fuera del deshacer (sería contradictorio)
- [x] Privacidad: las entradas de Relación se ocultan mientras el módulo esté bloqueado
- [-] Fotos, vídeos y archivos de Biblioteca — fuera, igual que ya lo estaban del deshacer:
      viven en Storage y mandarlos a la papelera dejaría ficheros huérfanos

#### ME · Fase 4/4 — INTEGRACIÓN GLOBAL ✅ COMPLETADA (v1.27.0)
- [x] Analiza la arquitectura actual. — 21 módulos de datos en `app_data`, sin router, 5 pestañas.
- [x] Identifica los módulos existentes. — 19 en `MORE_NAV`, 4 áreas, 20 `case` de `renderTab`.
- [x] Identifica cómo se almacenan. — `saveData` sobrescribe, `loadData` no fusiona; 22 claves.
- [x] Identifica las relaciones entre datos. — dos cascadas reales: programa → asignatura →
      exámenes/horas. Ninguna otra colección referencia ids de otra.
- [x] Identifica la navegación. — comprobada automáticamente por `scripts/comprobar-navegacion.mjs`.
- [x] Identifica el Dashboard. — respeta `dashboardOcultos` y `modulosDesactivados` desde ME F1/F2.
- [x] Identifica los sistemas actuales de eliminación. — eran 22 `.filter()` repetidos; hoy hay
      **uno**: `eliminarConPapelera(modulo, coleccion, id)`, más 2 cascadas.
- [x] PRINCIPIO FUNDAMENTAL — todo lo que Josué crea, Josué lo puede borrar. Verificado por
      `scripts/auditar-modulos.mjs` (P3), no a ojo.
- [x] PAPELERA / BOTÓN DE ELIMINAR — `BotonBorrar` en `components/ui.jsx`, mismo control en todas
      las listas.
- [x] CONFIRMACIÓN DE ELIMINACIÓN — deliberadamente **no** la pide el borrado normal (es
      reversible vía papelera); sí la piden el borrado definitivo y vaciar la papelera.
- [x] ELIMINACIÓN PERMANENTE — `eliminarDefinitivo` + `vaciarPapelera` + purga por retención.
- [x] El elemento debe desaparecer inmediatamente de la interfaz. — estado local + `snapshotAndSave`.
- [x] Debe eliminarse también de la base de datos/estado correspondiente. — misma llamada.
- [x] Debe mantenerse sincronizado en todos los dispositivos. — va por `app_data`, como el resto.
- [x] No debe reaparecer después de recargar la página.
- [x] No debe reaparecer después de cerrar y abrir la aplicación.
- [x] No debe quedar como un elemento “fantasma” en otra sección. — las cascadas se llevan los
      hijos; comprobado por P5 de la auditoría.
- [x] Las estadísticas relacionadas deben actualizarse correctamente. — todas se derivan del estado,
      no se guardan agregados.
- [x] CUIDADO CON LAS RELACIONES — `conArrastrados` guarda los hijos en la MISMA entrada de
      papelera, así que restaurar devuelve el árbol entero (asignatura → exámenes + horas;
      programa → asignaturas + exámenes + horas).
- [x] ELIMINAR ELEMENTOS PERSONALIZADOS — temas de color guardados y favoritos de Nutrición tienen
      su propio borrado; documentado por qué no van a la papelera.
- [x] EDITAR + ELIMINAR — conviven en la misma fila, sin menú intermedio.
- [x] COMPONENTE REUTILIZABLE — `BotonBorrar`.
- [x] MENÚ DE ACCIONES — **descartado a propósito**: con una sola acción destructiva por fila, un
      menú de tres puntos añade un toque sin añadir nada (regla 8).
- [x] BORRADO EN TODOS LOS MÓDULOS — **la auditoría encontró 7 huecos reales** y se taparon los 7:
  - [x] Sueño — registros de noche
  - [x] Economía — movimientos
  - [x] Salud — medidas
  - [x] Salud — historial médico
  - [x] Nutrición — comidas
  - [x] Fútbol — partidos
  - [x] Estudios — horas de estudio
  - [x] Estudios — **programas** (lo encontró el script, no la revisión a mano)
- [x] DATOS HISTÓRICOS — nada se borra en cascada "por antigüedad"; solo la purga de la papelera.
- [x] ELIMINACIÓN Y ESTADÍSTICAS — ver arriba: derivadas, se recalculan solas.
- [x] PAPELERA / UNDO — los dos sistemas conviven: `papelera` entra en el snapshot de deshacer, así
      que no pueden desincronizarse.
- [x] SEGURIDAD — lo borrado de Relación se enmascara en la papelera mientras el módulo esté
      bloqueado (`describirEntrada` + `privado: true`).
- [x] FUTURAS FUNCIONALIDADES — añadir un módulo a la papelera es **una línea** en
      `CATALOGO_PAPELERA`; la auditoría avisa si alguien olvida ponerla.
- [x] NO ROMPER NADA EXISTENTE — 205 comprobaciones verdes (`bash scripts/verificar.sh`).
- [x] AUDITORÍA FINAL — **ejecutable**, no un documento: `scripts/auditar-modulos.mjs` responde las
      preguntas P3, P5, P7, P7b y P9 en cada verificación.

---

---

## HT · HORARIO TOP — 12 fases

Motor temporal y de planificación: horario configurable, pantalla HOY consciente del tiempo real, mochila inteligente, planificador de huecos, notificaciones contextuales y analítica de uso del tiempo. **Es el módulo más acoplado a lo existente**: Calendario Universal (C1–C3), Productividad, Estudios y el Dashboard Centro de Control cubren ya parte de su superficie.

#### HT · Fase 1/12 — ARQUITECTURA GENERAL DEL SISTEMA ✅ COMPLETADA (v1.52.0)

**Esta fase no pide construir: pide definir.** *"No estamos construyendo todavía la interfaz
definitiva, la base de datos definitiva, el editor definitivo, la mochila, las notificaciones ni la
IA. Estamos estableciendo cómo debe funcionar todo el ecosistema antes de empezar a construirlo"*
(apartado 31).

En este proyecto "arquitectura definida" ha significado siempre lo mismo —AR F1, FO F1, RA F1—: **un
módulo puro y probado, no un documento.** Un documento se contradice con el código en la segunda
fase; un modelo con 131 comprobaciones no puede. Así que `src/lib/horario.js` es el ecosistema
entero como código, **sin una sola pantalla**.

- [x] **1 · Objetivo** — un sistema central de planificación temporal, no una pantalla de consulta.
      Todo lo que otros módulos necesitarán leer está en funciones, no en la vista.
- [x] **2 · Principio fundamental** — **el horario y lo que pasa un día son DOS cosas.** La regla
      base vive en `bloques`; los cambios puntuales, en `excepciones`.
- [x] **3 · Estructura general** — las cinco capas: horarios, bloques, calendario (excepciones y
      eventos resueltos), HOY (`lineaDelDia`) e inteligencia (conflictos y huecos, ya utilizables).
- [x] **4 · Tipos de horario** — seis, y el tipo **no cambia la mecánica**: solo lo que la interfaz
      ofrecerá por defecto. Un horario de entrenamiento no necesita aula ni profesor.
- [x] **5 · Recurrente vs. real** — **`resolverDia()` compone, no materializa.** El mismo bloque
      resuelve en todos los martes del curso: hay una prueba que lo comprueba con dos martes
      distintos. Cambiar la hora de una clase la cambia en todos, y un festivo se declara **una
      vez** con `dia_libre` en vez de cancelar seis clases a mano.
- [x] **6 · Diseño de la cuadrícula** — el modelo es un editor, no una imagen: columnas y filas son
      datos, no constantes. La interfaz es de la Fase 3.
- [x] **7 · Columnas** — **una columna guarda su `dia` aparte de su nombre.** Es la pieza que
      permite las dos cosas del apartado a la vez: que "Martes" resuelva a una fecha y que
      "Semana A" o "Persona 2" sigan siendo posibles. Sin ese campo habría que adivinar el día por
      el nombre, y "Semana A" no es ningún día. Una columna sin `dia` no cae en ninguna fecha —
      probado.
- [x] **8 · Filas** — guardan **inicio y fin**, no una duración implícita. Con solo la hora de
      inicio, un recreo de 20 minutos entre clases de 50 no se podría representar.
- [x] **9 · Bloques visuales** — el bloque guarda solo lo suyo (cuándo, y dónde si ese día cambia);
      color, icono y material viven en la **actividad**, porque tres bloques de Matemáticas son la
      misma entidad (apartado 11).
- [x] **10 · Personalización visual** — color e icono por actividad, en el modelo. Tipografía y
      estilo son de la app entera y ya existen desde la Fase A3: **no se ha creado un segundo
      sistema de apariencia** para el horario.
- [x] **11 · Identidad de las actividades** — una actividad es una entidad reutilizable, y los
      bloques la referencian por id.
- [x] **12 · Sistema de entidades** — horario, bloque, actividad, excepción y evento resuelto,
      separados de verdad y en listas planas.
- [x] **13 · Conexión con el sistema personal** — el módulo no guarda nada de otros módulos: los
      lee. Las asignaturas entran como parámetro, nunca copiadas.
- [x] **14 · El sistema HOY** — `lineaDelDia()` responde a "qué tengo", "qué viene después" y "qué
      necesito"; `proximoEvento()` salta al día siguiente si hoy ya se acabó. La agregación con
      tareas y exámenes es de la Fase 6, y encaja **añadiendo fuentes**, no rehaciendo la vista.
- [x] **15 · Sistema de prioridades** — cuatro, con peso, para que HOY pueda ordenar en vez de
      listar.
- [x] **16 · Preparación para la mochila** — `materialDelDia()` agrupa el material y dice **para qué
      hace falta cada cosa**: "Libreta — para Biología y Matemáticas" es más útil que la libreta
      repetida dos veces. La mochila de verdad es la Fase 7.
- [x] **17 · Preparación para notificaciones** — `avisosDelDia()` **describe, no notifica**. Devuelve
      qué se podría avisar y a qué hora; quién avise es la Fase 10. Mismo criterio que RA F2, y evita
      que dos sistemas manden el mismo aviso.
- [x] **18 · Preparación para IA** — `contextoIA()` devuelve estructura, no una lista de textos, y
      omite los campos vacíos para no ensuciar el contexto. Y **la IA no se dispara sola** (regla 7):
      esto solo prepara el contexto.
- [x] **19 · Preparación para Supabase** — mismo camino que RA F2: `app_data`, clave `horarioTop`,
      con la RLS que ya existe. **Sin tabla nueva y sin SQL que Josué tenga que ejecutar.** La Fase
      2 de HT es justo la del modelo de datos y confirmará o cambiará esto con su propia
      especificación delante.
- [x] **20 · Sincronización** — el estado no depende del almacenamiento local: viaja en `app_data`
      como los otros veintiún módulos.
- [x] **21 · Offline** — el módulo es puro y sin efectos, así que una cola de sincronización se
      monta encima sin tocarlo. El enganche queda identificado.
- [x] **22 · Escalabilidad** — varios horarios a la vez, y un festivo de instituto **no cancela el
      entrenamiento**: hay una prueba de ello.
- [x] **23 · Periodos y semanas** — un horario tiene `periodo`. Las columnas sin `dia` son
      exactamente el hueco donde entrarán "Semana A" y "Semana B" sin tocar el modelo.
- [x] **24 · Cambio de horario** — se desactiva, no se borra: *"sin destruir el anterior"*. Un
      horario desactivado no resuelve nada pero conserva sus bloques — probado.
- [x] **25 · Principio de no duplicación** — ⚠️ **el apartado que más ha decidido.** JosStyle ya
      tiene las asignaturas de Josué en `estudios.asignaturas` desde la Fase 6, así que **una
      actividad escolar no las copia: apunta a ellas** por `asignaturaId`, y el nombre se resuelve al
      leer. Renombrar "Bio" a "Biología" en Estudios lo cambia en el horario sin tocar el horario.
      Sin esto habría dos "Biología" y ningún examen podría enlazarse con su clase.
- [x] **26 · Experiencia de usuario** — *"máxima potencia con mínima fricción"*: un bloque puede
      tener título propio sin actividad, así que poner "Recreo" no obliga a crear una entidad.
- [x] **27 · Mobile-first** — no aplica todavía (no hay interfaz), y por eso **no se ha marcado nada
      de diseño que no exista**. Es de la Fase 3.
- [x] **28 · Arquitectura modular** — cada pieza es una función suya, y las de fases posteriores
      (mochila, avisos, IA) están separadas y ya probadas, para que esa fase no toque el modelo.
- [x] **29 · Eventos del sistema** — la cascada del apartado es aquí integridad referencial:
      `eliminarHorario`, `eliminarActividad`, `eliminarColumna` y `revisarHorario`.
- [x] **30 · Futuro sistema de automatizaciones** — `conflictosDelDia` y `huecosDelDia` contestan ya
      "qué choca" y "cuándo tengo un hueco", que es lo que necesitará la Fase 8.
- [x] **31 · Resultado esperado** — la arquitectura conceptual completa, en código y probada.

**Dos decisiones que se llevan por delante un error futuro:**

1. **Borrar una actividad NO borra sus bloques**: los deja sin actividad. Perder la hora de una clase
   porque se borró la asignatura sería mucho peor que quedarse con un hueco que se vuelve a
   rellenar. Es la misma decisión que AR F2 con una prenda borrada de un outfit.
2. **Un evento resuelto no tiene id propio.** No es una entidad guardada, es el resultado de
   componer otras; darle un id invitaría a guardarlo, que es justo lo que esta arquitectura evita.

**Un fallo mío, cazado por su propia prueba:** `crearColumna({ dia: 9 })` reventaba. El día es
*truthy* pero está fuera de rango, y se usaba para el nombre **antes** de validarlo, así que
indexaba `DIAS_SEMANA[8]`. Ahora se valida primero.

⏸ **Una cosa que decidirá la Fase 2, no esta:** dónde se guarda. Aquí se ha asumido `app_data` con la
clave `horarioTop`, por coherencia con los otros veintiún módulos y para no añadir SQL pendiente.
**HT F2 es literalmente la fase del modelo de datos y Supabase**, así que lo confirmará o lo cambiará
con su especificación delante. Nada de lo construido aquí depende de esa elección: el módulo es puro.

#### HT · Fase 2/12 — MODELO DE DATOS, CLOUD Y SUPABASE ✅ COMPLETADA (v1.53.0)

**El apartado 51 decide dónde va todo:** *"HORARIO TOP no podrá crear una arquitectura incompatible
con los demás módulos. Antes de implementar las tablas definitivas se deberá comprobar nombres de
tablas, convenciones de IDs, autenticación, RLS, timestamps, patrones de Supabase existentes… **La
implementación final deberá adaptarse a la arquitectura global del Sistema Personal.**"*

Comprobado: **JosStyle no tiene una tabla por entidad.** Tiene una, `app_data`, una fila por usuario
y clave, con RLS por `auth.uid()`, que usan los veintiún módulos. Las trece tablas del apartado 45
serían el segundo sistema de persistencia del proyecto y **trece bloques de SQL que Josué tendría que
ejecutar a mano desde el iPhone**. Así que se adaptan, que es lo que el apartado manda: cada "tabla"
es una lista dentro de `horarioTop`, y lo que en PostgreSQL serían restricciones son aquí funciones
que se ejecutan de verdad.

- [x] **1-2 · Objetivo y principio** — *"cada dato importante debe existir una sola vez"*. Las
      asignaturas ya se apuntan a Estudios desde F1; aquí les toca a los materiales.
- [x] **3 · Usuario** — el modelo **no tiene campo `user_id`**: el estado es del usuario autenticado
      y no hay otro del que sacar nada.
- [x] **4 · Identificadores** — `uid()`, el de toda la app.
- [x] **5 · Tabla `schedules`** — `nombre`, `tipo`, `descripcion`, `activo`, `porDefecto`, `desde`,
      `hasta`, timestamps.
- [x] **6 · Horarios simultáneos** — ya desde F1; un festivo de instituto no cancela el
      entrenamiento.
- [x] **7 · Periodos de validez** — `desde` y `hasta` **de verdad**, no una etiqueta. Y
      `resolverDia` los respeta: **el curso pasado deja de resolver solo**, sin desactivarlo a mano.
- [x] **8 · `schedule_columns`** — `corto`, `posicion`, `visible`, color e icono. El corto **no se
      deriva del nombre**: "Miércoles" abrevia a "X" en España, no a "Mié".
- [x] **9-10 · `schedule_rows` y no limitar** — `posicion` y `visible`; ni columnas ni filas tienen
      número fijo.
- [x] **11-12 · `subjects` y tipos** — `corto`, `profesor`, `aula`, `descripcion`, `activa`.
- [x] **13-14 · `schedule_blocks` y duraciones** — `filaId` es **informativo**: el que manda es
      `inicio`/`fin`, porque el apartado 14 pide expresamente que un bloque pueda no ocupar una fila
      exacta ("09:00–09:30 Recreo" entre filas de una hora).
- [x] **15-16 · Color e icono override** — el del bloque gana; sin override, el de la asignatura.
      **Y los demás bloques de esa asignatura no cambian** — probado.
- [x] **17-19 · `schedule_exceptions` y prioridad** — desde F1, con los cuatro tipos y la excepción
      ganando siempre al horario base.
- [x] **20-21 · Calendario** — ⚠️ *"No se recomienda crear un calendario completamente
      independiente."* JosStyle ya tiene el común (`calendarioIntegracion.js`), donde cada módulo
      aporta eventos **derivados** con `origen` y `origenId` — exactamente los `source` y `source_id`
      del apartado. `eventosDeHorario()` produce esa aportación; **no crea una tabla nueva**.
- [x] **22 · Evitar duplicaciones** — catorce días de calendario **no crean catorce registros**: se
      calculan. Hay una prueba que lo comprueba.
- [x] **23 · Recurrencia** — la mayoría ya la daba F1 (la columna dice qué día, el horario desde
      cuándo, las excepciones son las excepciones). Lo que no se podía expresar era **la
      alternancia**, y es lo único que se añade: se resuelve **contando semanas desde un ancla**, no
      guardando "esta semana toca" — un contador guardado se desincroniza en cuanto pasa una semana
      sin abrir la app. Sin ancla no se hace desaparecer nada en silencio.
- [x] **24 · `tasks`** — las tareas son de Productividad y **no se copian**: entran en `agendaDelDia`
      como parámetro.
- [x] **25-26 · `materials` y `subject_materials`** — mejora real sobre F1, donde el material era
      texto. Con textos, "Libreta" en Biología y en Matemáticas eran dos cosas que solo se parecían
      al escribirlas. La migración **une los repetidos** —tres asignaturas con libreta dan UN
      material y tres enlaces— y es idempotente.
- [x] **27-28 · Mochila** — *"será una consecuencia de los datos existentes y no una lista
      completamente independiente"*. `mochilaDelDia()` **deriva**; lo único que se guarda es lo que
      no se puede derivar: si ya está metido, y lo añadido a mano. Y agrupa: "Libreta — para Biología
      y Matemáticas", no dos libretas.
- [x] **29-30 · Recordatorios y notificaciones** — el modelo los admite; `avisosDelDia` (F1)
      describe sin notificar. Se construyen en la Fase 10.
- [x] **31-32 · Vista HOY** — `agendaDelDia()` agrega clases, tareas, eventos y recordatorios en una
      sola experiencia, con lo que tiene hora ordenado por hora y lo que no, **por importancia** —
      no intercalado a las 00:00. Las fuentes de fuera son **parámetros**, así que la Fase 6 añadirá
      fuentes sin tocar la función.
- [x] **33-35 · Supabase, RLS y seguridad** — las políticas de `app_data`, ya vigentes. *"Nunca
      confiar en el user_id enviado desde la interfaz"*: no hay ninguno que enviar.
- [x] **36 · Índices** — `construirIndices()`. En Postgres son índices; aquí, mapas. El efecto y el
      motivo son el mismo: que HOY siga siendo rápido con tres cursos de historial.
- [x] **37 · `created_at` / `updated_at`** — en cada entidad.
- [x] **38 · Soft delete** — ⚠️ **la papelera de ME F3**, que ya es el borrado reversible del
      proyecto, con retención, restauración y purga. Un `deleted_at` propio sería un segundo sistema
      de recuperación con sus propias reglas.
- [x] **39-40 · Sincronización y conflictos** — `detectarConflicto()` usa `actualizadoEn` para decir
      *"esto lo cambió otro dispositivo después de que tú lo abrieras"*. **Detecta y avisa; no
      resuelve**: *"no se deberá sobrescribir información silenciosamente sin criterio"*, y la
      política de quién gana es una decisión de producto que el apartado deja para después.
- [x] **41 · Cache local** — el de siempre: estado en React, `saveData` detrás.
- [x] **42 · Datos mínimos vs avanzados** — un bloque necesita horario, columna y horas. Profesor,
      aula, material, icono y etiquetas son opcionales.
- [x] **43 · Configuración del usuario** — vista, inicio de semana, 12/24 h, aulas, iconos, colores.
      ⚠️ **Densidad y tamaño de texto NO están**, aunque el apartado los mencione: existen desde la
      Fase A3 para toda la app, y duplicarlos daría dos ajustes diciendo cosas distintas sobre lo
      mismo.
- [x] **44 · Historial** — los timestamps lo permiten; no se construye.
- [x] **45-46 · Estructura relacional y flujo** — `describirModelo()` la dice **leyendo el estado
      real**, no una lista escrita a mano que se quedaría desfasada en la primera fase que añada una
      entidad.
- [x] **47-48 · IA** — `contextoIA` (F1) da estructura; la capa de acciones pasará por estas mismas
      validaciones. *"La IA no tendrá permisos especiales para saltarse las reglas."*
- [x] **49 · Validaciones** — `validarBloque`, `validarExcepcion`, `validarHorario`. Devuelven el
      motivo en vez de lanzar, para que la interfaz lo diga con una frase corta.
- [x] **50 · Escalabilidad** — profesores, aulas, grupos y etiquetas caben como campos o entidades
      nuevas sin tocar lo que hay.
- [x] **51 · Compatibilidad** — el apartado que ha decidido la fase entera.
- [x] **52 · Resultado** — el modelo técnico completo, en código y probado.
- [x] **53-54 · Lo que no se implementa** — ni editor, ni cuadrícula, ni drag & drop, ni interfaz, ni
      mochila inteligente, ni notificaciones, ni automatizaciones.

**Tres bugs míos, cazados por sus propias pruebas — y uno perdía datos:**

1. **El normalizador de horarios tiraba los campos nuevos de columnas y filas.** Ocultar el sábado
   funcionaba… hasta recargar la app. Es la trampa de siempre: `crearColumna` escribía `visible`,
   pero `normalizarHorarioObj` no lo conocía, así que se perdía en el primer guardado.
2. **Un item de mochila añadido a mano se borraba solo.** El normalizador exigía `materialId`, y un
   "Bocadillo" escrito a mano no sale de ningún material.
3. **`validarHorario` no detectaba un nombre vacío**, porque miraba el objeto ya normalizado y el
   normalizador lo rellena con la etiqueta del tipo. Ahora mira el crudo — misma lección que la
   revisión de integridad de RA F2.

⏸ **Queda confirmada la decisión que HT F1 dejó abierta:** el horario se guarda en `app_data` con la
clave `horarioTop`. **Sin tabla nueva y sin SQL que Josué tenga que ejecutar**, y con el aislamiento
por usuario que ya dan las políticas existentes.

#### HT · Fase 3/12 — EDITOR VISUAL DE HORARIOS ✅ COMPLETADA (v1.55.0)

**Un módulo nuevo, "Horario"**, en el área Vida junto al Calendario. La barra inferior sigue con
cinco pestañas.

*"El usuario ve una cuadrícula sencilla. El sistema se encarga de toda la complejidad."* Toda la
complejidad está en `src/lib/horarioEditor.js`, que es puro y tiene 132 comprobaciones; la pantalla
no calcula ni un solape.

- [x] **1-4 · Objetivo, entrada, plantillas y primera vista** — cuatro plantillas (Colegio, Semana
      completa, Tardes, Desde cero) que son **solo un punto de partida**: en cuanto se crea el
      horario dejan de existir.
- [x] **5-7 · Mobile-first, scroll y columna de horas fija** — ⚠️ **la hora vive FUERA del
      contenedor que hace scroll**, no con `position: sticky`: en iOS, `sticky` dentro de un scroll
      horizontal es irregular, y aquí la solución simple es además la robusta. Con siete días la
      cuadrícula se desplaza y la franja sigue visible.
- [x] **8-10 · Columnas** — añadir, editar, ocultar, mover y eliminar. **Ocultar no borra**, y
      mover en el borde no saca la columna de la lista.
- [x] **11-14 · Filas** — añadir (que **continúa a la última sola**, con su misma duración), editar,
      eliminar y franjas irregulares. ⚠️ **Eliminar una franja NO borra los bloques que caen en
      ella**: las filas son la rejilla visual, los bloques guardan sus propias horas (HT F2). Quitar
      la fila de las 10:00 no puede hacer desaparecer la clase de las 10:00.
- [x] **15-19 · Crear un bloque** — ⚠️ **la creación rápida es lo que decide si montar un horario son
      minutos o media hora**: tocar celda → escribir → Enter hace los seis pasos del apartado 16 en
      una llamada. Y el que importa es **reutilizar**: escribir "Matemáticas" otro día usa la misma
      actividad, con su mismo color. Sin eso habría cuatro Matemáticas de cuatro colores.
- [x] **17-18 · Autocompletado** — sugiere lo que ya existe **y las asignaturas de Estudios que aún
      no están en el horario**. Sin eso, el apartado 25 de HT F1 no serviría de nada en la práctica.
- [x] **20-22 · Editar, duplicar, copiar** — duplicar reutiliza la **misma** actividad, que es lo
      que hace que cambiar el color de Matemáticas lo cambie en los cuatro días a la vez.
- [x] **23-24 · Duplicar y vaciar día** — duplicar sobre un día que ya tiene clases **se rechaza**
      con el número; forzar **sustituye, no acumula**. Vaciar dice cuántos se van antes de hacerlo.
- [x] **25-27 · Mover y redimensionar** — ⚠️ **no hay drag & drop, y es una decisión**: el apartado
      25 lo pide *"en dispositivos compatibles"* y el 26 exige que en móvil exista igualmente "Mover
      a…". Se ha construido **lo segundo**, que es lo que Josué usará desde el iPhone; el arrastre se
      añade encima sin tocar nada porque acaba en la misma función. Y **mover conserva la
      duración**: arrastrar una clase de una hora no puede convertirla en una de diez minutos.
- [x] **28-29 · Conflictos** — se detectan **antes** de escribir y la opción por defecto los evita;
      forzar existe pero hay que pedirlo. La celda en conflicto se marca en la cuadrícula.
- [x] **30-32 · Colores e iconos** — **color automático**: que Josué tenga que elegir uno por
      asignatura convertiría seis clases en seis decisiones antes de haber escrito nada. La paleta
      es un dato de la asignatura, no de interfaz — misma exclusión documentada que `armario.js`.
- [x] **33 · Información compacta** — en la cuadrícula, el nombre. Aula, profesor y material al
      abrirlo: con cinco días delante, una celda de cuatro líneas es ilegible.
- [x] **35 · Modo edición vs consulta** — en un iPhone no es estética: los controles ocupan media
      pantalla y el 95 % de las veces solo se quiere mirar qué toca ahora.
- [x] **36-39 · Guardado, sincronización, deshacer y rehacer** — ⚠️ **no se ha construido ninguno de
      los cuatro, porque los cuatro ya existen.** Cada operación entra por `snapshotAndSave`, que
      guarda y alimenta el "Deshacer" global — que cubre literalmente la lista del apartado 38.
      Montar un segundo autoguardado daría dos sistemas escribiendo la misma clave.
- [x] **40 · Confirmaciones inteligentes** — una columna con bloques pregunta; una vacía se borra sin
      ceremonia. El editor da el número, así que la pantalla puede distinguirlo.
- [x] **41-44 · Menús, gestos y edición masiva** — menú por bloque y por columna, en panel táctil.
      La selección múltiple es de la Fase 4.
- [x] **45-51 · Vistas, HOY y fechas** — semana, día y agenda, **de la misma fuente**: hay una
      prueba que comprueba que las tres devuelven el mismo id de bloque. Acceso a HOY y navegación
      por días.
- [x] **52-53 · Solo este día vs todos** — ⚠️ **lo más delicado de la fase.** Cambiar la hora porque
      hoy hubo un cambio no puede cargarse todos los lunes del curso. Se resuelve con `ALCANCES`, y
      **sin valor por defecto**: si no se dice, no se escribe. Un defecto silencioso sería justo el
      error que el apartado quiere evitar, y sería irreversible sin darse cuenta.
- [x] **54-56 · Aula, profesor y etiquetas** — solo si existen. Nada de filas vacías.
- [x] **57-59 · Filtros, visibilidad y bloqueo** — visibilidad por columna y por horario; el modo
      consulta es el "bloquear edición" del apartado 59.
- [x] **60-63 · Accesibilidad, dark mode y diseño** — `aria-label` en celdas, bloques y flechas;
      **el color nunca identifica solo** (siempre hay nombre); y **ni un color propio de interfaz**,
      así que claro y oscuro funcionan solos. El color de la asignatura va tintado al 16 % detrás
      del texto del tema, que es lo que mantiene la legibilidad en los dos.
- [x] **64-67 · Rendimiento, estado local y errores** — la cuadrícula va en `useMemo`; el estado
      local es inmediato porque ninguna operación toca la red; y los conflictos entre dispositivos
      los cubre `detectarConflicto` de HT F2.
- [x] **68-70 · Importación** — ⚠️ **no se construye, pero su puerta sí, y de forma que no se pueda
      saltar la revisión**: `previsualizarImportacion` no escribe nada y `aplicarImportacion` solo
      acepta lo que salió de ella. *"Nunca se deberá permitir que una importación automática
      modifique el horario sin revisión."* Y avisa de las actividades que ya existen, para que
      importar no cree una segunda Matemáticas.
- [x] **71-72 · Autoguardado y estado de sincronización** — el de la app.
- [x] **73-75 · Creación ultrarrápida** — plantilla → tocar celda → escribir → duplicar. El ejemplo
      completo del apartado 74 funciona tal cual.
- [x] **76 · Criterios de aceptación** — los veinticuatro. Los veinte comprobables tienen prueba
      marcada `CRITERIO`; ⚠️ **los cuatro que no —móvil, dark mode y rapidez percibida— se dicen en
      la propia salida de las pruebas** en vez de darse por buenos.
- [x] **77-78 · Resultado y conexión** — el editor queda listo para que la Fase 4 añada estructuras
      personalizables y semanas A/B, que ya tienen su hueco desde HT F2.

**Lo que sigue sin estar probado, y hay que decirlo:** el aspecto real en un iPhone, los gestos, el
arrastre y el modo oscuro. Como todo desde R1.

#### HT · Fase 4/12 — CONFIGURACIÓN AVANZADA DE COLUMNAS, FILAS Y BLOQUES ✅ COMPLETADA (v1.56.0)

*"Toda la potencia estará disponible, pero sin complicar la interfaz básica."* (apartado 63) Por eso
lo de esta fase vive entero detrás de **un solo botón, "Opciones avanzadas", dentro del modo
edición**: quien solo quiera mirar su horario no ve nada de esto.

La lógica está en `src/lib/horarioEstructura.js` (121 comprobaciones); la pantalla solo pinta.

⚠️ **El apartado que manda sobre todos los demás es el 30: *"No se deben mover datos
silenciosamente."*** Cada operación que puede dejar clases fuera de sitio **calcula el impacto y lo
enseña ANTES de escribir**, con el número exacto de clases afectadas y un botón de "Hacerlo
igualmente". Nunca se escribe primero y se avisa después.

- [x] **1-3 · Objetivo, flexibilidad y configurador** — el configurador es el panel avanzado, no una
      pantalla aparte: en un iPhone, una pantalla más es una pantalla que no se encuentra.
- [x] **4-9 · Columnas: tipos, especiales, ocultar, bloquear, agrupar** — ocho tipos
      (`TIPOS_COLUMNA`), `visible`, `bloqueada` y `grupo`. ⚠️ **Bloquear no es ocultar**: una columna
      bloqueada se sigue viendo y sigue resolviendo fechas, solo no se edita sin querer.
- [x] **10-11 · Semanas A/B y ciclos personalizados** — de 1 a 8 semanas, con nombres propios o
      A/B/C… ⚠️ **La semana se CALCULA desde una fecha ancla, no se guarda.** Guardar "esta semana es
      la B" es un contador que miente en cuanto pasa un lunes sin abrir la app. Y **sin ancla no se
      adivina**: se enseña la A y se dice por qué. Una columna sin grupo vale para todas las
      semanas, que es lo que permite "Lunes fijo, Miércoles A/B".
- [x] **12-14 · Filas avanzadas, sin hora y de separación** — tres tipos (`TIPOS_FILA`). Una fila sin
      hora se queda **genuinamente vacía**, no rellena con un `08:00` inventado (regla 8).
- [x] **19-23 · Densidad, tamaño de filas, zoom y ajuste automático** — tres densidades y zoom
      60-140 %. ⚠️ **Van a `localStorage`, no a Supabase** (apartado 59): el iPhone y el ordenador no
      tienen la misma pantalla, y sincronizar el zoom haría que ajustarlo en uno estropeara el otro.
      El zoom escala **alto y ancho**: solo hacia abajo dejaría las columnas ilegibles.
- [x] **24 · Reordenación masiva** — ⚠️ **una columna que no venga en el orden nuevo NO desaparece**:
      se queda al final. Un reordenamiento parcial no puede ser un borrado.
- [x] **25-27 · Duplicar estructura, plantillas propias y del sistema** — duplicar copia columnas,
      filas y bloques con ids nuevos; **las actividades se comparten, no se copian** (apartado 25 de
      HT F1: Matemáticas del curso que viene es la misma Matemáticas). **Las excepciones del curso
      pasado no se arrastran.** Una plantilla guarda estructura y nada más, y sin ids.
- [x] **28-29 · Intervalos y horarios irregulares** — generador de franjas con descanso, **topado a
      40 filas**: un intervalo de 1 minuto sobre doce horas daría 720 filas y dejaría la app
      inservible (apartado 20).
- [x] **30-32 · Cambios con datos existentes, previsualización y migración** — `impactoEliminarColumna`,
      `impactoCambiarFila` e `impactoRegenerarFranjas` devuelven qué pasaría **antes** de tocar nada.
      Regenerar la rejilla **no mueve ni un bloque**: conservan sus horas y solo pierden la fila.
- [x] **33-35 · Validación estructural, horas solapadas y modo libre** — `validarEstructura` detecta
      posiciones repetidas, ids duplicados, filas sin horas, filas solapadas, bloques huérfanos y
      conflictos. Un horario sin columnas de día es **un aviso, no un error**: puede ser un tablero.
- [x] **37-38 · Metadatos y color del horario** — nombre, periodo, fechas, icono, color y zona
      horaria. ⚠️ **Solo se aceptan campos de una lista blanca**: pasarle `bloques` a los metadatos
      no puede vaciar el horario.
- [x] **39-41 · Filtros por horario, por actividad y búsqueda** — la búsqueda mira título, aula,
      profesor y etiquetas, sin distinguir mayúsculas.
- [x] **43-45 · Selección, acciones sobre la selección y eliminación segura** — seleccionar un día,
      una franja o **todos los bloques de una asignatura** (el ejemplo del apartado 24: Matemáticas
      lunes, martes y jueves → cambiar color → los tres). ⚠️ El color de una selección es el de los
      **bloques**, no el de la asignatura: teñir tres bloques no puede repintar la asignatura entera
      en el resto de la app.
- [x] **53 · Zona horaria** — se guarda la del aparato al crear el horario, para no perderla al
      viajar.
- [x] **55-57 · Cambios de curso, archivar y recuperación** — ⚠️ **archivar en lugar de eliminar**
      (apartado 56). Un horario archivado sale del selector y **deja de resolver fechas**, pero sus
      bloques siguen guardados y se recupera de un toque. Y si están **todos** archivados, la
      pantalla vacía ofrece recuperarlos: si no, sería un callejón sin salida.
- [x] **59 · Configuración local vs cloud** — la línea está clara: **estructura y datos a Supabase,
      preferencias de vista al aparato.**
- [x] **63-64 · Regla de diseño y criterios de aceptación** — los 25 criterios comprobables sin
      navegador están en `scripts/test-horario-estructura.mjs`. Los dos que no —zoom real y uso en
      un iPhone— se dicen en la propia prueba.

**Lo que NO se ha construido, y por qué (regla 8: nada decorativo):**

- [-] **15-18 · Bloques multifila, multicolumna, flotantes y anidados** — el modelo de HT F2 ya los
      permite (un bloque tiene sus propias horas, no una fila), así que un bloque de 8:00 a 10:00 ya
      ocupa dos franjas en los datos. Lo que falta es **pintarlo estirado**, que es trabajo de
      cuadrícula y va con la Fase 5, donde se rehace la celda.
- [-] **42 · Atajos** — de teclado. Josué trabaja desde el iPhone: sería un control decorativo.
- [-] **46-52 · Versionado, importación, exportación, imprimir, compartir y privacidad** — la propia
      especificación llama al 46 *"versionado futuro"*. Exportar e imprimir son de la Fase 12
      (Cloud), y compartir depende de decisiones de privacidad que Josué no ha tomado.
- [-] **54 · Cambio de hora** — el cambio de hora español no mueve las clases: a las 8:00 sigue
      habiendo clase a las 8:00. No hay nada que construir.
- [-] **60-62 · Rendimiento de horarios enormes y arquitectura futura** — un horario de instituto
      son 5 columnas y 7 franjas. Optimizar para mil bloques ahora sería inventar un problema.

**Lo que sigue sin estar probado, y hay que decirlo:** el zoom y la densidad en pantalla real, el
aspecto en un iPhone y el recorrido tocando. Como todo desde R1.

#### HT · Fase 5/12 — ASIGNATURAS, ACTIVIDADES, COLORES, ICONOS Y CONTEXTO ✅ COMPLETADA (v1.57.0)

*"«Biología» no será solamente una palabra dentro de una celda. Será una entidad."* (apartado 1)

La lógica está en `src/lib/actividades.js` (116 comprobaciones); la ficha, en `HorarioView.jsx`.

⚠️ **La decisión que gobierna la fase: todo lo que se puede derivar, se deriva.** Los usos, el tiempo
semanal, las más utilizadas, las recientes y la carga por día **no se guardan**. Un contador de
"veces usada" empieza a mentir en cuanto se borra un bloque — y ese número es justo el que el
apartado 58 usa para decidir si una actividad se borra o se archiva.

- [x] **2-4 · Actividad genérica, asignatura como tipo, identidad** — nueve tipos (`TIPOS_ACTIVIDAD`).
      ⚠️ `descanso` no está en la lista de la especificación pero venía de F1: quitarlo dejaría sin
      tipo a lo que Josué ya hubiera creado.
- [x] **5-7 · Nombre, nombre corto y alias** — ⚠️ **renombrar en Estudios sigue mandando** (apartado 25
      de F1): el horario apunta a la asignatura, no la copia. El nombre corto se **deriva** si no se
      pone, porque una celda sin texto no se distingue de una celda libre.
- [x] **8-10 · Tipo e iconos** — dieciséis emojis y uno por defecto según el tipo, para que crear no
      obligue a elegir. El campo acepta cualquier cadena, así que las imágenes del apartado 10
      caben mañana sin migrar nada.
- [x] **11-15 · Colores, paleta, automático y bloque vs actividad** — la cadena es **bloque →
      actividad → grupo → acento**. ⚠️ El color de un bloque **no toca la actividad**: marcar un
      examen en rojo no puede repintar Biología entera (apartado 44).
- [x] **16-17, 49 · Estados** — activa, archivada y **oculta**. ⚠️ **Oculta no es archivada**: la
      especificación las distingue, y juntarlas haría imposible una actividad viva que no salga en
      el horario escolar (apartado 51). Un `activa: false` guardado en F1 se **traduce**, no se pierde.
- [x] **18, 28, 56, 57 · Reutilizar y no duplicar** — antes de crear "Biología" se dice si ya existe,
      sin importar tildes ni mayúsculas, y se enseñan las parecidas. ⚠️ **Nunca se fusionan solas**
      (apartado 57, literal): "Biología" y "Biología 2" pueden ser dos asignaturas de dos cursos, y
      juntarlas no se deshace.
- [x] **19-23 · Profesor, aula y descripción** — campos de la actividad, no del bloque: el profesor de
      Biología es el mismo los tres días (ya venía de HT F2).
- [x] **24-27, 83-84 · Etiquetas, favoritos, recientes y buscador** — la búsqueda mira nombre, corto,
      alias y etiquetas: "bio" encuentra Biología. El orden recomendado es el del apartado 83
      (favoritas → recientes → más usadas → A-Z), y **solo "favorita" se guarda**: lo pone Josué.
- [x] **29-30, 77, 79, 100 · La ficha** — qué días toca, cuánto a la semana, profesor, aula, material,
      etiquetas, exámenes, tareas y notas. Es *"la puerta de entrada al resto de la información"*.
- [x] **31-32 · Tareas y exámenes** — los exámenes se enlazan **de verdad** por `asignaturaId`. ⚠️ Las
      tareas de Productividad **no tienen campo de asignatura**, así que se enseñan las que la
      MENCIONAN y la pantalla lo dice con esas palabras. Fingir un enlace sería un dato inventado
      (regla 8).
- [x] **45-47 · Estadísticas, tiempo semanal y carga** — *"esta semana tienes 4 h de Biología"*, todo
      derivado de los bloques. La carga por día se **calcula pero no juzga**: avisar es Fase 11.
- [x] **50-51 · Visibilidad** — cuatro interruptores (horario, hoy, calendario, mochila), **todos
      encendidos de fábrica**: esconder es la excepción. Es lo que permite el "Trabajo personal" del
      apartado 51.
- [x] **52, 73 · Notas privadas** — ⚠️ **salen en la ficha y NO viajan en el contexto de la IA.** Hay
      una prueba que falla si aparecen. Lo que no sale de aquí no puede acabar en un servidor.
- [x] **53-54 · Contexto para la IA** — devuelve **estructura, no un texto**, y **no llama a nadie**
      (regla 7). Quien la use decide si la manda y cuándo, a un toque.
- [x] **58-61 · Eliminar, archivar, restaurar y duplicar** — ⚠️ borrar **enseña el impacto con
      números antes de decidir** y **recomienda archivar**. Duplicar crea una **entidad nueva** que
      no arrastra ni los bloques ni el enlace con Estudios, o renombrar una cambiaría las dos.
- [x] **63-65 · Jerarquía, agrupaciones y colores de grupo** — una actividad puede heredar el color de
      su grupo o sobrescribirlo. ⚠️ Una actividad **no puede ser su propia madre ni su propia
      abuela**: sin esa comprobación, pintar el árbol se colgaría y la pantalla quedaría en blanco.
- [x] **86 · Sugerencias** — lo que suele ir a esa hora pesa más que lo que suele ir ese día. ⚠️
      **Sugerir no escribe nada**, y hay una prueba que fotografía el estado antes y después.
- [x] **92-93 · Referencia única** — los exámenes son de Estudios y las tareas de Productividad: aquí
      se LEEN, nunca se escriben.
- [x] **98 · Seguridad** — el modelo **no tiene `user_id`** (viene de HT F2): no hay ninguno que
      falsear, y el aislamiento lo dan las políticas RLS de `app_data`.
- [x] **101 · Criterios de aceptación** — los treinta, en `scripts/test-actividades.mjs`.

**Lo que NO se ha construido, y por qué (regla 8):**

- [-] **20, 22 · Profesor y ubicación como entidades propias** — la propia especificación las llama
      *"entidad futura"* y *"futura ampliación"*. Hoy son campos de texto, que es lo que Josué
      necesita para escribir "Ana Ruiz" y "Lab 2.14".
- [-] **33 · Archivos** — subir documentos por asignatura necesita un bucket de Supabase, y Josué ya
      tiene dos bloques de SQL pendientes de ejecutar. No se le añade un tercero por una función que
      no ha pedido.
- [-] **55 · Creación mediante IA** — *"añade Física los martes y jueves"* exige
      validación → previsualización → confirmación, y eso es la Fase 9 (IA de Horario). Aquí está
      hecho el contexto que la alimentará.
- [-] **74-76 · Cloud, offline y caché** — resuelto desde HT F2: todo vive en `app_data`, que ya
      sincroniza y ya tiene RLS. No hay nada nuevo que construir.
- [-] **87-91 · Patrones, objetivos, hábitos y entrenamiento** — enganches para las Fases 9 y 11. El
      apartado 87 dice literalmente *"en fases posteriores"*.
- [-] **94-95 · Eventos externos** — los campos `origen` y `origenId` ya están en el modelo para no
      importar dos veces lo mismo; el importador es de la Fase 12.

**Lo que sigue sin estar probado, y hay que decirlo:** la ficha en pantalla, el selector de iconos y
el recorrido tocando en un iPhone. Como todo desde R1.

#### HT · Fase 6/12 — CALENDARIO + AGENDA + SISTEMA «HOY» ✅ COMPLETADA (v1.58.0)

*"Se deberá crear un servicio central que pueda responder: ¿qué está ocurriendo ahora? ¿qué viene
después? ¿qué tengo hoy? ¿qué está pendiente? ¿qué es importante?"* (apartado 101)

El motor está en `src/lib/hoy.js` (83 comprobaciones) y la pantalla es **una cuarta vista dentro de
Horario**, la primera y la que sale por defecto. La barra inferior sigue con cinco pestañas.

⚠️ **El apartado 102 decide la forma del archivo entero:** *"HOY no almacenará una copia
independiente de todo. Consultará las entidades originales."* Así que `hoy.js` **no guarda nada**.
Completar una tarea desde Productividad cambia HOY sin que HOY se entere, y hay una prueba que lo
demuestra.

⚠️ **Y el 90 % del trabajo fue NO volver a construir lo que ya existía.** La especificación describe
HOY como si el proyecto empezara de cero, y no empieza: `eventosDerivados` ya reúne exámenes, tareas
y entrenamientos desde el Calendario; `lineaDelDia`, `huecosDelDia`, `conflictosDelDia` y
`avisosDelDia` ya están desde HT F1; y **la puntuación del día (apartado 37) ya es `puntuacion.js`**,
del Dashboard. Una segunda puntuación daría dos números distintos para el mismo día.

- [x] **1-7 · HOY, línea temporal, ahora, siguiente, tiempo restante, estado y agenda** — el orden de
      la pantalla es el del ejemplo del apartado 1: AHORA · SIGUIENTE · PENDIENTE · MAÑANA, que es el
      orden de las preguntas que uno se hace. ⚠️ **El contador se actualiza solo** (apartado 5), con
      un tic de un minuto: decir "empieza en 42 min" cuando empezó hace diez es peor que no decirlo.
- [x] **8-14 · Vistas y navegación temporal** — HOY, semana, día y agenda, con "Hoy" y navegación por
      días, que ya venían de HT F3.
- [x] **15-16 · El calendario como capa** — horario + eventos + tareas + exámenes + entrenamientos →
      HOY. ⚠️ **Horario y evento no se confunden**: el horario es una regla ("los lunes a las 8"), el
      evento es un hecho ("el examen el 15"). Es la distinción de HT F1, y aquí se ve en que los
      eventos de otros módulos llegan como **solo lectura**.
- [x] **17-21, 32-35 · Tareas, exámenes y lo pendiente** — el orden del apartado 32 (vencidas → hoy →
      próximas → sin fecha). ⚠️ **Una tarea vencida NO desaparece** (apartado 33): sigue arriba, con
      cuántos días lleva. Se puede **completar sin abrir Productividad** (35) y **reprogramar en un
      toque** (34): mañana, este fin de semana o la semana que viene.
- [x] **36 · Prioridades** — un examen pesa siempre: es la única fecha que no se puede mover.
- [x] **38 · Carga del día** — cuatro niveles. ⚠️ **Describe, no riñe**: el apartado 37 dice
      expresamente *"no deberá convertirse en una obligación ni penalizar al usuario injustamente"*.
- [x] **39-40 · Conflictos** — se ven arriba del todo, no escondidos.
- [x] **41-46 · Mochila** — `materialDelDia` ya la deriva desde HT F1 y F2, y **la de mañana sale en
      HOY**, que es cuando hace falta: por la noche.
- [x] **65-68 · Tiempo libre y descanso** — ⚠️ **el descanso es una actividad válida**, no tiempo
      perdido (apartado 68), así que un hueco entre clases y un bloque de descanso se cuentan aparte.
- [x] **69 · Día sin actividades** — ⚠️ *"la pantalla no deberá parecer rota o vacía"*. Dice que no
      hay nada programado y ofrece montar el día. Tiene su propia prueba de renderizado.
- [x] **70-72 · Fin de semana, vacaciones y festivos** — un domingo **no dice "clase pendiente"** si
      el horario es de lunes a viernes, y un festivo se declara una vez (HT F1) en vez de cancelar
      seis clases a mano.
- [x] **80-84 · Notificaciones agrupadas** — ⚠️ *"no se debe bombardear al usuario"*: **un mensaje**
      ("tienes 3 cosas importantes hoy"), con las tres prioridades del apartado 82. Aquí se
      **describen**; mandarlas es la Fase 10, y el proyecto ya tiene su emisor.
- [x] **85 · Vista «mañana»** — con su material, que es lo que hace falta para la mochila.
- [x] **101 · El motor de contexto temporal** — `contextoTemporal()` responde las ocho preguntas en
      una llamada. Si cada tarjeta preguntara por su cuenta, acabarían diciendo cosas distintas.
- [x] **102 · Fuente única de verdad** — el archivo entero es una función de lectura.
- [x] **104-107 · Cloud, seguridad y deshacer** — resueltos desde antes: `app_data` con RLS, sin
      `user_id` que falsear (HT F2), y cada cambio entra por `snapshotAndSave`, que ya alimenta el
      "Deshacer" global.
- [x] **110 · Inteligencia sin automatismos peligrosos** — nada se mueve solo. El contexto para la IA
      **describe el día y no lo cambia**, y no incluye notas privadas (HT F5).
- [x] **112 · Criterios de aceptación** — los comprobables sin navegador, en `scripts/test-hoy.mjs`.

**Lo que NO se ha construido, y por qué (regla 8):**

- [-] **30-31 · Arrastrar bloques** — misma decisión que HT F3: el apartado 26 de esa fase exige que
      en móvil exista igualmente "Mover a…", y eso es lo que Josué usa desde el iPhone.
- [-] **37 · Puntuación del día** — **ya existe** (`puntuacion.js`, Dashboard). Una segunda daría dos
      números distintos para el mismo día.
- [-] **47-52 · Recordatorios, ubicación y tiempo de desplazamiento** — los recordatorios son la Fase
      10; el tiempo de desplazamiento necesita mapas, que el proyecto no tiene ni ha pedido.
- [-] **59, 61, 66-67 · Automatización del estudio, IA proactiva y planificación desde un hueco** —
      todo eso es la Fase 9. Aquí está el contexto que la alimentará, y **la IA nunca se dispara
      sola** (regla 7).
- [-] **75-79 · Importación y sincronización** — resuelto desde HT F2 (`app_data`) o aplazado a la
      Fase 12.
- [-] **83 · Centro de notificaciones** — el proyecto ya tiene su sistema de notificaciones; un
      segundo historial sería la duplicación que el apartado 102 prohíbe.
- [-] **108-109 · Acciones rápidas y comando rápido** — el buscador global de BI F3-F4 ya es
      exactamente eso, y D2-07 prohíbe una cuarta lista.

**Lo que sigue sin estar probado, y hay que decirlo:** el contador que baja solo en pantalla, el
aspecto en un iPhone y el recorrido tocando. Como todo desde R1.

#### HT · Fase 7/12 — MOCHILA INTELIGENTE + MATERIALES + PREPARACIÓN AUTOMÁTICA ✅ COMPLETADA (v1.59.0)

*"Día → actividades → materiales → excepciones → mochila."* (apartado 1)

El motor está en `src/lib/mochila.js` (85 comprobaciones) y la mochila se ve **dentro de HOY**: la de
hoy y la de mañana, que es la que de verdad se prepara por la noche.

⚠️ **La cadena entera es una consecuencia, no una lista.** Nada de lo que sale en la mochila se ha
escrito a mano. Lo único que se guarda es lo que **no se puede deducir**: qué has metido ya, qué has
añadido tú, en qué estado está cada cosa y dónde la tienes.

- [x] **2-13 · La mochila como entidad y los materiales** — extiende los materiales de HT F2, que ya
      eran entidades reutilizables. No se creó una segunda lista.
- [x] **14-20 · Mochila de hoy, de mañana, preparación y progreso** — ⚠️ **con la mochila vacía el
      porcentaje es 100, no `NaN`**: 0/0 habría hecho desaparecer la barra sin decir nada.
- [x] **21 · Diferenciar obligatorio** — dos listas separadas, porque el apartado lo justifica:
      *"evita que el usuario confunda recomendaciones con necesidades reales"*.
- [x] **22-23 · Preparar todo y vaciar** — ⚠️ **"Meter todo" NO marca lo que está perdido o
      prestado**: sería mentira, y la mochila dejaría de servir justo el día que importa.
- [x] **24-30 · Mochila base y mochilas múltiples** — colegio, deporte, viaje. La base (estuche,
      botella, cargador) aparece **siempre**, sin depender del horario.
- [x] **32-33, 40-42 · Inventario, cantidad y ubicación física** — con `ubicacion` se podrá contestar
      la pregunta del apartado 40 (*"¿dónde está mi bata?"*), y las ubicaciones ya usadas se ofrecen
      para no reescribirlas.
- [x] **34-38 · Prestado, perdido, roto y alerta de disponibilidad** — ⚠️ *"mañana necesitas la
      calculadora, pero está prestada"*, **diciendo a quién**. Devolverla borra ese nombre: si no,
      seguiría diciendo "lo tiene Jorge" para siempre.
- [x] **44-46 · Preparación automática y anticipada** — la mochila de mañana **ya existe hoy**, sin
      esperar a las 00:00: se deriva, así que no hay nada que generar.
- [x] **50-52 · Prioridad del material** — imprescindible, obligatorio, recomendado y opcional.
- [x] **57 · No borrar material manual** — ⚠️ **la regla que se rompe sin que nadie se entere.** Si
      escribes "llevar bata igualmente", el recálculo de mañana **no puede** hacerla desaparecer. Por
      eso `manual` se guarda por escrito y el motor solo toca lo automático. Tiene su prueba.
- [x] **58-59 · Origen y explicación** — ocho orígenes, y **cada cosa dice por qué está**: *"la
      necesitas porque tienes Biología"*. Una checklist muda se ignora.
- [x] **60-61 · Material duplicado y cantidades inteligentes** — ⚠️ **dos asignaturas con libreta dan
      UNA libreta**, pero **dos hojas y tres hojas son cinco hojas**: lo segundo solo pasa con los
      consumibles, y el inventario es quien sabe cuáles lo son.
- [x] **62-64 · Consumibles y lista de compra** — lo perdido, lo roto y lo agotado.
- [x] **68-73 · Mochila + HOY, calendario y semana** — la preparación semanal ve los siete días.
- [x] **75-79 · Reglas** — tres condiciones (por actividad, por día de la semana, por etiqueta).
      Deliberadamente simple: un motor con anidamiento sería un lenguaje de programación dentro de
      una mochila.
- [x] **94-97, 100-101 · Digital, dispositivos, cargadores, dependencias y kits** — *"iPad → cargador
      → cable"* se resuelve en cadena. ⚠️ Y **un ciclo no cuelga la app**: A necesita B y B necesita
      A se corta, porque sin eso la pantalla se quedaría en blanco.
- [x] **102-104 · Historial, estadísticas y detección de olvidos** — se detecta qué faltó.
- [x] **105-107 · SIN CASTIGO** — ⚠️ el apartado 105 se titula así. El mensaje es *"pasa"*, y hay una
      prueba que falla si aparece la palabra "fallo", "mal" o "penalización". Y **ni puntos, ni
      niveles, ni rachas de mochila** (D2-02), con su propia comprobación.
- [x] **113-116 · Cloud, offline, seguridad y rendimiento** — resueltos desde HT F2: todo en
      `app_data`, con RLS y sin `user_id` que falsear.
- [x] **117-123 · El motor y los criterios de aceptación** — en `scripts/test-mochila.mjs`.

**Lo que NO se ha construido, y por qué (regla 8):**

- [-] **47-49 · Recordatorio a las 21:00** — es una notificación, y las notificaciones son la Fase 10.
      Lo que sí está es **qué** diría: `progresoMochila` ya devuelve el aviso con los nombres.
- [-] **65-67 · Conexión con Economía, tareas y recordatorios** — la lista de compra dice qué falta;
      **crear un gasto** por una libreta que no se ha comprado sería inventarse un movimiento.
- [-] **80 · IA para configurar reglas** — la IA nunca se dispara sola (regla 7), y esto es Fase 9.
- [-] **111-112 · Widget y pantalla de bloqueo** — la propia especificación los llama *"futuro"*, y
      una PWA en iOS no puede hacerlos.

**Lo que sigue sin estar probado, y hay que decirlo:** la pantalla, los gestos y el recordatorio de
las 21:00 (que es de la Fase 10). Como todo desde R1.

#### HT · Fase 8/12 — MOTOR TEMPORAL + REGLAS + AUTOMATIZACIONES INTELIGENTES ✅ COMPLETADA (v1.60.0)

*"La aplicación dejará de ser una agenda estática. Será un sistema temporal vivo."* (apartado 1)

Dos cosas en `src/lib/automatizaciones.js` (74 comprobaciones), porque la segunda depende de la
primera: **el estado temporal de cada actividad** y **el motor de reglas**.

⚠️ **La distinción que sostiene la fase (apartados 6, 7 y 8): PASADA no es COMPLETADA.** *"La hora
terminó"* y *"la actividad se realizó"* son cosas distintas, y confundirlas rompe el histórico: una
clase a la que no fuiste terminó igual, pero no la hiciste. Por eso **"pasada" se calcula del reloj y
"completada" se guarda** — y es lo único que se guarda de todo esto.

- [x] **2-9 · Los cinco estados** — programada → próxima → en curso → pasada → completada. ⚠️ El
      estado **se calcula**: guardarlo dejaría de ser verdad en un minuto, y a las 23:59 media app
      diría "en curso" de algo de por la mañana. Confirmar es **siempre opcional** (apartado 9).
- [x] **15-17 · El tablón y "ver pasado"** — lo terminado **sale del tablón principal** pero se
      consulta con un toque, y el día lleva su contador de cuántas se hicieron de verdad.
- [x] **18-20 · Línea dinámica y actualización automática** — el tic de un minuto de HT F6 sirve para
      las dos cosas: el contador que baja y el estado que cambia al pasar la hora.
- [x] **22-24 · Cambio de día y reanudación** — ⚠️ **no hay proceso de fondo en una PWA**, así que el
      "cambio de día" es comparar la fecha que la pantalla creía con la de ahora. Es honesto y
      funciona; un temporizador toda la noche no existe en iOS.
- [x] **27-29 · Actividades sin hora y de todo el día** — ⚠️ una actividad **sin hora no está ni en
      curso ni pasada**: no tiene reloj al que agarrarse, y decir que "terminó" sería inventarlo.
- [x] **43-44 · El motor de reglas** — trigger → condiciones → acción, con **todas** las condiciones
      exigidas. Cuatro triggers, cinco condiciones y cuatro acciones: deliberadamente cerrado, porque
      un motor abierto sería un lenguaje de programación dentro de una app de instituto y nadie
      podría depurar por qué apareció una bata.
- [x] **45-46 · Prioridades y excepciones** — ⚠️ **la excepción gana a la regla**: *"añadir bata"* y
      *"no llevar bata el 15"* conviven, y el 15 no se lleva bata. Sin esto, una regla general no se
      podría matizar nunca.
- [x] **47-48 · Activar, desactivar y ejecutar a mano** — y **previsualizar sin escribir nada**,
      igual que los `impacto*()` de HT F4.
- [x] **49-52 · Registro, historial, deshacer y explicación** — *"21:00 → Añadida bata automáticamente
      por Biología"*, con su hora y su botón. ⚠️ **Deshacer un aviso ya dado no revierte nada** — no
      se puede "no avisar" —, así que se marca y se dice que no tuvo efecto, en vez de fingirlo.
- [x] **53 · Automatizaciones seguras** — informativa, reversible e importante. ⚠️ **No hay acciones
      críticas**: nada de lo que puede hacer una regla borra datos, y lo importante **no se ejecuta
      sin confirmar** — ni siquiera dentro de un "hacerlo todo", donde se queda fuera y se pregunta.
- [x] **55 · La IA no es el motor** — el motor es determinista y se prueba entero con Node. La IA,
      cuando llegue (Fase 9), **propondrá** reglas para que las apruebe Josué.
- [x] **59 · Criterios de aceptación** — en `scripts/test-automatizaciones.mjs`.

**Lo que NO se ha construido, y por qué (regla 8):**

- [-] **21, 25-26 · Cambio de hora y zona horaria** — el cambio de hora español no mueve las clases:
      a las 8:00 sigue habiendo clase a las 8:00. La zona horaria se guarda desde HT F4.
- [-] **30-31 · Bloques flexibles** — *"a alguna hora de la tarde"* necesita un planificador que
      decida cuándo, y eso es la Fase 9.
- [-] **54, 56 · IA + automatizaciones** — Fase 9. Aquí está el motor que ejecutará lo que ella
      proponga, y **la IA nunca se dispara sola** (regla 7).

**Lo que sigue sin estar probado, y hay que decirlo:** que la pantalla se refresque sola al pasar la
hora y el cambio de día con la app cerrada. Como todo desde R1.

#### HT · Fase 9/12 — IA DE HORARIO + PLANIFICADOR PERSONAL INTELIGENTE ✅ COMPLETADA (v1.61.0)

La arquitectura del apartado 52, que decide todo lo demás:

    DATOS → MOTOR TEMPORAL → **MOTOR DE PLANIFICACIÓN** → IA → PROPUESTA → CONFIRMACIÓN → CAMBIOS

⚠️ **Fíjate dónde está la IA: después del planificador y antes de la confirmación.** No calcula y no
escribe. `src/lib/planificador.js` (72 comprobaciones) es **determinista**: los mismos datos dan el
mismo plan, y se prueba entero con Node.

- [x] **2, 49-51 · Contexto temporal real** — ⚠️ *"tienes 1 h 20 min libres"* lo dice el motor, **no
      la IA**. El contexto lleva los números **ya calculados**, así que la respuesta sale de los
      datos y no de una estimación.
- [x] **6, 7, 55, 56 · Nunca sobrescribe sin permiso** — ⚠️ **`aplicarPlan` sin `confirmado` no hace
      nada.** No es una comprobación defensiva: es la **regla 7 del proyecto puesta en código**, para
      que sea imposible que una respuesta de la IA cambie el horario sola. Y el botón dice
      exactamente qué va a pasar.
- [x] **10, 13, 14, 28, 30 · Huecos adecuados** — ⚠️ un hueco de 35 minutos **no sirve** para una
      sesión de 30: hay que levantarse, llegar y sentarse. Por eso hay margen y transición, y el
      hueco empieza **después** de la transición, no pegado a la clase.
- [x] **16-18 · Plan de estudio y plan adaptativo** — ⚠️ **la víspera es repaso, no materia nueva**:
      meter el último tema el día antes es lo que hace llegar al examen sin haberlo visto dos veces.
      Y el día del examen no se estudia.
- [x] **19 · No castigar** — ⚠️ el apartado se titula así. Si el plan hay que rehacerlo, dice *"el
      plan necesita reajustarse"* y **cuántas sesiones quedan**. Hay una prueba que falla si aparece
      "has fallado", "mal", "deberías" o "penalización".
- [x] **20-21 · Prioridades y puntuación** — determinista: vencido, hoy, examen, prioridad y días de
      margen. ⚠️ **El número no se enseña**: "esto vale 87 puntos" no le dice nada a nadie. Lo que se
      enseña es el orden y el motivo.
- [x] **9, 34-36 · Replanificar, mapa de carga y sobrecarga** — *"he encontrado dos huecos"*. ⚠️ **Da
      opciones, no una decisión** (apartado 37), y el aviso de sobrecarga **informa sin reñir**.
- [x] **31, 44-45 · Preferencias** — ⚠️ *"no estudiar después de entrenar"* funciona de verdad: lo
      que se pidió evitar **no sale en la lista**, no se ordena al final. Si saliera, acabaría
      eligiéndose un día con prisa.
- [x] **50, 62, 64 · No mandar todo a la IA** — solo el contexto relevante. ⚠️ **Nunca las notas
      privadas** (HT F5) **ni una palabra de Relación**, con pruebas de las dos cosas.
- [x] **52-57 · Motor determinista + IA, acciones, validación y previsualización** — cuatro acciones
      estructuradas y cerradas. ⚠️ **Ninguna borra nada**: una IA que pueda proponer un borrado
      acabará proponiéndolo el día que no te fijes. Se validan antes de tocar nada y se previsualizan
      sin escribir.
- [x] **61 · Nivel de autonomía** — ⚠️ existen los niveles, pero **ninguno permite ejecutar sin
      confirmar**: gana la regla 7. Lo que cambia es cuánto trabajo hace antes de preguntar.
- [x] **67-69 · Explicación, plan alternativo y comparación** — el mismo temario repartido de otra
      forma, con los minutos de cada opción.
- [x] **80 · Conexión con el resto del sistema** — ⚠️ una tarea **no se escribe aquí**: se devuelve
      marcada para Productividad, que es su dueña (apartado 92 de F5).

**Lo que NO se ha construido, y por qué (regla 8):**

- [-] **3, 41, 46-48 · Chat contextual y comandos** — el proyecto **ya tiene** buscador con IA
      (BI F3-F4) y el proxy de `api/ask-ai.js`. Un segundo chat sería la cuarta lista que D2-07
      prohíbe. Lo que faltaba —el contexto que se le manda— es lo que está hecho.
- [-] **22-24 · Descomposición de tareas grandes y dependencias** — trocear "hacer el trabajo de
      Historia" exige entender el trabajo, no el horario. Es la IA quien lo propondría, y aquí solo
      se construye el motor.
- [-] **29 · Tiempo de desplazamiento** — necesita mapas, que el proyecto no tiene ni ha pedido.
- [-] **65 · Memoria de IA** — guardar preferencias aprendidas sin que Josué las vea sería
      exactamente lo que la regla 7 evita. Las preferencias **se declaran**, no se deducen.

**Lo que sigue sin estar probado, y hay que decirlo:** la respuesta real de la IA (que llega por
`api/ask-ai.js`) y la pantalla. Como todo desde R1.

#### HT · Fase 10/12 — NOTIFICACIONES + RECORDATORIOS + CONTEXTO PROACTIVO ✅ COMPLETADA (v1.62.0)

*"La idea no es llenar el móvil de avisos. La idea es que el sistema se adelante a lo que necesitas,
pero sin molestarte."*

⚠️ **El proyecto YA tiene quien manda notificaciones:** `notificaciones.js`, de la Fase A4, con el
permiso, el interruptor global, las categorías y el horario de descanso. Un segundo emisor daría dos
avisos por lo mismo.

Así que lo construido es **la otra mitad**, la que faltaba: `src/lib/avisosHorario.js` (71
comprobaciones) **decide** qué avisar, cuándo y con qué prioridad; `notificaciones.js` **manda**. Es
el mismo reparto de SO F1 (`audio.js` decide, `audioEngine.js` suena), y por el mismo motivo: la
decisión es donde están los errores que importan, y la decisión sí se puede probar.

- [x] **1-3 · El motor, los tipos y las prioridades** — siete tipos y cuatro prioridades, y **cada
      tipo apunta a una categoría de las que ya existían** en la Fase A4.
- [x] **4-5 · No todo debe notificar** — ⚠️ *"que exista un evento no significa automáticamente que
      haya que enviar una notificación"*. Es la regla fundamental, y por eso hay un motor con seis
      preguntas en vez de un `if`. Y **cada rechazo tiene su motivo por escrito**: sin eso, contestar
      "¿por qué no me ha avisado?" sería adivinar.
- [x] **9-16 · Recordatorios de clases y tareas** — los minutos antes son configurables, y las tareas
      vencidas se avisan **diciendo cuál**, no solo cuántas.
- [x] **17-19 · Exámenes** — ⚠️ **un examen mañana es lo único que sube a crítica solo.** Uno de
      dentro de tres días es alta, y uno de dentro de un mes **no avisa todavía**.
- [x] **20-22 · Mochila** — ⚠️ **si la mochila está completa NO se avisa** (apartado 4 en acción), y
      **que falte material no es crítico**: crítico es un examen mañana. Confundirlos hace que lo
      crítico deje de serlo.
- [x] **34-38 · No crear cientos de recordatorios y resúmenes** — ⚠️ **tres avisos se convierten en
      uno**, con lo más importante primero. Y el resumen nocturno **calla si mañana no hay nada**: uno
      que dice "mañana no tienes nada" todas las noches de vacaciones es justo el ruido a evitar.
- [x] **39-43 · No molestar** — ⚠️ **se respeta siempre, también con lo crítico.** Un aviso de mochila
      a las 3 de la mañana no es más útil por ser urgente. Tiene su propia prueba.
- [x] **51-57 · Historial, snooze, posponer y acciones rápidas** — posponer vive en la sesión, no se
      guarda: es una decisión de este rato, no un dato.
- [x] **52 · Cancelación automática** — ⚠️ **un aviso caduca.** Si la clase ya pasó o la tarea ya está
      hecha, no se manda: avisar de algo que ya no aplica es peor que no avisar. Y con más de dos
      horas de retraso tampoco, porque solo haría ruido.
- [x] **72-75 · Centro de avisos, leído/no leído, archivar y filtros** — los **sin leer salen
      primero**, y archivar da por leído: nadie archiva algo sin mirarlo.
- [x] **76-80 · Configuración** — ⚠️ **no hay un segundo interruptor global.** El de la Fase A4 sigue
      mandando; esto solo añade lo que es del horario y no cabía allí.

**Lo que NO se ha construido, y por qué (regla 8):**

- [-] **44-45 · Contexto de ubicación y de dispositivo** — necesita GPS, que el proyecto no tiene ni
      ha pedido.
- [-] **47-49 · Push Cloud y multidispositivo** — **Web Push de verdad** (con la app cerrada) exige
      un Service Worker que escuche `push`, una tabla de suscripciones y otra función serverless. Es
      infraestructura nueva, ya documentada como fuera de alcance desde la Fase A4, y añadiría un
      tercer bloque de SQL a los dos que Josué ya tiene pendientes.
- [-] **82-84 · Sonido y vibración** — el sonido es **SO · Sonido**, que tiene su propio motor
      (`audioEngine.js`) y su regla invariante. Meterlo aquí sería el segundo sistema que esa regla
      impide.
- [-] **86-88 · Cloud y conflictos de sincronización** — resuelto desde HT F2: todo en `app_data`.

**Lo que sigue sin estar probado, y hay que decirlo:** que la notificación llegue de verdad al
iPhone, el permiso del navegador y Web Push con la app cerrada. Como todo desde R1 y la Fase A4.

#### HT · Fase 11/12 — ANALÍTICA PERSONAL + CARGA + PROGRESO + APRENDIZAJE ✅ COMPLETADA (v1.63.0)

⚠️ **Esta fase tiene la especificación más corta de las doce:** veintitrés puntos y ninguna letra
pequeña. Uno de ellos, sin embargo, dice cómo hay que construir todo lo demás:

> *"…y un sistema de aprendizaje que mejore las sugerencias **sin convertirlo en una caja negra**."*

Así que en `src/lib/analiticaHorario.js` (49 comprobaciones) **no hay ni un número que no se pueda
explicar**: cada cifra viene con **de dónde sale**, y lo que el sistema "aprende" son frases que se
leen y se comprueban — *"por la tarde confirmas menos (3 de 12)"*. Nada de pesos ocultos.

- [x] **Estadísticas de cumplimiento · planificado vs. realizado** — lo primero sale del horario, lo
      segundo de lo que Josué confirmó en HT F8. ⚠️ **Solo cuentan los días ya pasados**: incluir el
      futuro daría un cumplimiento que baja solo según avanza la semana.
- [x] **Carga diaria/semanal y horas libres** — ⚠️ la media es **de los días ocupados**: incluir los
      domingos vacíos la hunde y deja de describir cómo es un día de instituto.
- [x] **Tareas completadas y aplazadas** — las que no tienen fecha se cuentan aparte, no como
      vencidas.
- [x] **Mochila** — ⚠️ los días sin mochila **no cuentan**: un domingo no es un olvido.
- [x] **Patrones de organización y aprendizaje** — ⚠️ **cada patrón es una frase con sus números
      dentro**, y **por debajo de 3 ocurrencias no se dice nada**: "los martes te saltas el estudio"
      basado en un martes es una afirmación inventada.
- [x] **Tendencias y comparativas** — ⚠️ **hacen falta los DOS periodos con datos.** Comparar una
      semana llena con una de vacaciones diría "has bajado un 80 %", y sería mentira. Y menos de 10
      puntos de diferencia no es tendencia: es ruido de una semana.
- [x] **Detección de sobrecarga y evolución** — el día más cargado y el más libre, con sus minutos.
- [x] **Informes y recomendaciones** — ⚠️ **las recomendaciones no las hace la IA ni se disparan
      solas** (regla 7): son consecuencias directas de un patrón ya medido, con su número delante.
- [x] **Un bug de diseño que cazó su propia prueba** — `suficientesDatos` solo miraba si había clases
      planificadas. Con cero confirmaciones, eso daba *"esta semana 0 %, la anterior 0 %"*, que
      **da por hecho que Josué no hizo nada** cuando lo que pasa es que no usa el botón de confirmar.
      Ahora hace falta también **alguna confirmación**, y si no la hay se dice con esas palabras.

⚠️ **Y la regla que gobierna la fase entera: describe, no juzga.** Es la misma línea de HT F7
(*"sin castigo"*), HT F9 (*"no castigar"*) y D2-02 (*"no sobregamificar"*). Un 40 % es un dato, no
una nota. Hay **una lista declarada de palabras prohibidas** y una prueba que **recorre todos los
textos que genera el archivo** —resumen, orígenes, patrones, tendencia y recomendaciones— buscando
reproches, en el peor escenario posible: cuatro semanas de clases y nada confirmado. Más otra que
comprueba que no hay ni puntos, ni niveles, ni rachas.

**Lo que NO se ha construido, y por qué (regla 8):**

- [-] **Gráficas** — la especificación no las pide, y el proyecto **ya tiene** un módulo de
      Estadísticas (Fase 12 de la Entrega 1) con las suyas. Un segundo sistema de gráficas dentro del
      horario sería la duplicación de siempre.
- [-] **Cumplimiento de objetivos y hábitos** — los objetivos son su propio módulo y los hábitos
      viven en Productividad con sus rachas (RA F1-F4). El horario **lee** lo suyo; medir el
      cumplimiento de un hábito aquí daría dos números distintos para lo mismo.

**Lo que sigue sin estar probado, y hay que decirlo:** la pantalla del informe. Como todo desde R1.

#### HT · Fase 12/12 — CLOUD + SUPABASE + SINCRONIZACIÓN + ARQUITECTURA DEFINITIVA ✅ COMPLETADA (v1.64.0) 🔒 **CIERRA EL BLOQUE HT: 12/12**

*"HORARIO TOP queda preparado para crecer. No lo vamos a diseñar como «una tabla para ver las
clases»: lo estamos diseñando como un motor temporal del Sistema Operativo Personal."* (apartado 104)

`src/lib/horarioTop.js` (45 comprobaciones) hace tres cosas y cierra el módulo.

- [x] **90-91 · API interna y separación de responsabilidades** — once archivos de horario no pueden
      ser once puertas de entrada. `diaCompleto()`, `resumenModulo()` y `contextoCompletoIA()` son
      la única puerta desde fuera; cada archivo sigue siendo dueño de lo suyo.
- [x] **82-83 · Exportar e importar** — ⚠️ se exporta **la estructura y los datos, no el histórico de
      uso**: lo confirmado, los avisos ya dados y la mochila de cada día **no viajan**, porque son de
      este curso y de este aparato — llevárselos daría un histórico que no ocurrió. Y está escrito
      **por qué** no viajan, para que nadie los añada sin pensarlo.
- [x] **82 · Importar sin romper nada** — se **revisa antes de escribir** (como todo desde HT F4),
      diciendo cuánto traería y **qué no va a traer**. ⚠️ **Importar dos veces el mismo archivo no
      duplica el curso**: es la misma idempotencia de RA F2. Un archivo de una versión más nueva se
      rechaza en vez de intentar adivinarlo.
- [x] **103 · La auditoría, comprobada contra el código** — ⚠️ **las 38 capacidades comprobables
      están atadas a una función que tiene que existir.** Si alguien borra una, la prueba falla —
      que es justo lo que un documento no hace. Es la misma decisión de HT F1: código probado en vez
      de un documento de arquitectura.
- [x] **Cloud, Supabase, RLS, offline, multidispositivo y seguridad** — ⚠️ **resueltos desde HT F2**,
      y con la decisión más importante del módulo: el apartado 51 obliga a *"adaptarse a la
      arquitectura global"*, así que el horario vive en `app_data` con RLS por usuario, **sin una
      tabla propia y sin un SQL que Josué tenga que ejecutar**. La auditoría comprueba de verdad que
      **no hay `user_id` que falsear**.
- [x] **104 · Preparado para crecer** — la cadena `Horario → Estudios → Mochila → Tareas → Objetivos
      → Entrenamiento → Productividad → IA → Notificaciones → Analítica` está construida entera, y
      cada eslabón **lee** del dueño del dato en vez de copiarlo.

⚠️ **Lo que la auditoría NO da por bueno, y lo dice ella misma:** el responsive y el móvil (93-95),
la accesibilidad real con lector de pantalla (96), las animaciones y el modo oscuro en pantalla
(97-98), el diseño premium (99), los backups y migraciones de Supabase (son de la consola, no del
código) y las Edge Functions y la monitorización (infraestructura que el proyecto no tiene). Decir
que están porque hay una clase de CSS sería mentir — misma honestidad que R1.

**Lo que NO se ha construido, y por qué (regla 8):**

- [-] **88 · Importar un calendario escolar externo** — necesita un formato que Josué no tiene. Lo
      que sí está es el importador, listo para cuando lo haya.
- [-] **89 · Futuras integraciones** — la propia especificación las llama *"futuras"*.
- [-] **Edge Functions, backups y monitorización** — infraestructura de Supabase y Vercel, no código
      de la app. Y añadir una Edge Function sería otra cosa que desplegar desde el iPhone.

**Lo que sigue sin estar probado, y hay que decirlo:** todo lo de la lista de arriba. Como siempre
desde R1.

#### AR · Fase 1/4 — ARMARIO DIGITAL + GESTIÓN DE PRENDAS ✅ COMPLETADA (v1.32.0)

*(La extracción automática no encontró apartados numerados en esta fase; el desglose de abajo sale
de leer la especificación entera, apartado a apartado.)*

- [x] **1 · Acceso** — Gestión → Armario, con la navegación y los componentes de siempre. Dado de
      alta en `MORE_NAV`, `AREAS_NAV`, su `case` de `renderTab`, `DESCRIPCIONES_MODULOS`,
      `PALABRAS_MODULOS`, `SINONIMOS_MODULOS`, `CATALOGO_PAPELERA` y `resumenesHub`.
- [x] **2 · Pantalla principal** — cabecera con el contador de prendas, buscador, filtros y botón
      de añadir.
- [x] **3 · Categorías** — las 14 de la especificación, en una lista ampliable. Una categoría
      desconocida no rompe la prenda: cae en "Otros".
- [x] **4 · Añadir prenda** — nombre, categoría, color y foto **opcional**.
- [x] **5 · Información adicional** — temporada, material, color secundario, notas, precio, fecha de
      compra y estado, todo detrás de "Más información".
- [x] **6 · Tarjeta de prenda** — con foto si la hay; si no, un degradado del color de la prenda con
      su categoría. **Del mismo alto en los dos casos**, para que la rejilla no se desalinee según
      quién tenga fotografía.
- [x] **7 · Detalle** — todos los campos que tenga, editar y eliminar con confirmación.
- [x] **8 · Edición** — todo modificable. `usos`, `ultimoUso` y `outfits` NO se dejan sobrescribir
      desde el formulario: editar la talla no puede borrar cuántas veces te has puesto la prenda.
- [x] **9 · Búsqueda** — explícitamente no solo por nombre: "gris" encuentra por color y "Nike" por
      marca. También por categoría, talla, estado y notas, sin acentos ni mayúsculas.
- [x] **10 · Filtros combinables** — categoría, color, marca, temporada, estado y favoritas. El
      ejemplo literal de la especificación ("Pantalones + Gris + Nike") está en las pruebas.
- [x] **11 · Ordenación** — cinco activas. Las tres que dependen del uso están **escritas y
      probadas**, pero la interfaz no las ofrece mientras no haya ni un uso registrado: un
      "Más usadas" sobre un armario sin usos sería un control decorativo (regla 8).
- [x] **12 · Favoritos** — el modelo lo soporta y la tarjeta ya lo marca.
- [x] **13 · Estados** — los cinco. Solo "Disponible" cambia algo hoy; el resto existen porque la
      Fase 2 los necesita para no proponer una prenda que está en la lavadora.
- [x] **14 · Arquitectura de datos** — los 21 campos, **todos desde el primer día**.
- [x] **15 · Futuro sistema de uso** — `usos`, `ultimoUso` y `outfits` ya están, vacíos.
- [x] **16 · Experiencia de añadir** — cuatro campos visibles y el resto plegado. El objetivo de la
      especificación es "añadir una prenda en pocos segundos", y eso es lo que manda en la pantalla.
- [x] **17 · Diseño visual** — tokens, tipografía y componentes de siempre. La foto manda cuando
      existe.
- [x] **18 · Móvil** — rejilla de dos columnas, filtros plegables, categorías con scroll
      horizontal. ⚠️ Comprobación real en iPhone: pendiente de Josué (**R1**).
- [x] **19 · Datos vacíos** — "Tu armario está esperando" con su botón, no una pantalla en blanco.
- [x] **20 · Rendimiento** — búsqueda, filtro y orden memoizados; la URL de cada foto se firma una
      vez por prenda y dura una hora.
- [x] **21 · Persistencia** — clave `armario` en la tabla `app_data` de siempre. **Ninguna segunda
      base de datos.**
- [x] **22 · Seguridad** — RLS de `app_data` heredada, y el bucket `armario` con las mismas
      políticas por carpeta de usuario que `progreso` y `entrenamiento-videos`.
- [x] **23 · Compatibilidad con futuras fases** — `outfits` y `usos` ya declarados en
      `DEFAULT_ARMARIO`.
- [x] **24 · No implementar todavía** — respetado: ni outfits, ni calendario, ni recomendaciones,
      ni anti-repetición, ni estadísticas.
- [x] **25 · Calidad** — 87 comprobaciones automáticas + 4 casos de renderizado.
- [x] **26 · No romper nada** — 443 comprobaciones en verde.

**Decisión que hubo que tomar, y su porqué:** la eliminación de una prenda **sí pide confirmación**,
a diferencia del resto de la app, donde ME Fase 3 la quitó porque la papelera lo hace todo
reversible. No es una excepción caprichosa: la papelera guarda el objeto de la prenda, pero **la
fotografía vive en Supabase Storage y no vuelve** — igual que las fotos de Salud y los vídeos de
Calistenia, excluidos de la papelera desde ME Fase 3. Borrar una prenda con foto es en parte
irreversible, y eso es justo lo que la regla del proyecto reserva para la confirmación. El texto de
la confirmación lo dice: cambia según la prenda tenga foto o no.

**Dos cosas nuevas que hicieron falta:**

1. **`SelectInput`** — el proyecto no tenía ni un `<select>`: todas las elecciones se hacían con
   filas de botones, que funcionan con 3 o 4 opciones. El Armario tiene 14 categorías y 13 colores,
   y catorce pastillas en fila no caben en un iPhone. Un desplegable nativo abre además la rueda de
   iOS, que se maneja con el pulgar mucho mejor.
2. **El bucket `armario`** en `supabase/schema.sql`. ⚠️ **Josué tiene que ejecutar ese bloque en el
   SQL Editor de Supabase.** Hasta que lo haga, el Armario funciona **entero sin fotos** — la
   fotografía es opcional por diseño; lo único que fallará es subir una imagen, y la prenda se
   guarda igual con un aviso en vez de perder lo escrito.

**Un fallo que destapó el smoke test:** `ArmarioView` es la primera vista de la prueba de
renderizado que toca Storage, y `lib/supabase.js` lee `import.meta.env` al cargarse — algo que solo
existe dentro de Vite. Ahora está stubeado, y de paso queda comprobado algo que importa: ninguna
vista debe necesitar la red para pintarse.

#### AR · Fase 2/4 — CONSTRUCTOR Y GESTIÓN DE OUTFITS ✅ COMPLETADA (v1.33.0)

- [x] **1 · Objetivo** — un outfit es una entidad propia que **referencia** prendas. Cambiar el
      nombre, el color o la foto de una prenda se ve en todos sus outfits, sin tocarlos.
- [x] **2 · Acceso** — pestañas **Prendas | Outfits** dentro de Gestión → Armario, con el mismo
      `ToggleTab` que ya separa Mes/Agenda en el Calendario. Con el contador en cada pestaña.
- [x] **3 · Pantalla de outfits** — título, subtítulo, total, buscador, filtros y botón de crear.
- [x] **4 · Crear outfit** — nombre editable, con su flujo propio.
- [x] **5 · Selección de prendas** — agrupadas por **zona del cuerpo** (superior, inferior, calzado,
      abrigo, accesorios, otros), no por las 14 categorías: es como se piensa al vestirse. **Sin
      límite de prendas** ni por outfit ni por zona — camiseta + camiseta + sudadera es válido.
- [x] **6 · Buscador de prendas** — **reutiliza `prendasVisibles` de la Fase 1 tal cual**. Ni un
      segundo sistema de búsqueda.
- [x] **7 · Selección visual** — mismo fallback de la Fase 1 sin foto; borde de acento y ✓ en la
      esquina al elegirla; volver a pulsar la quita.
- [x] **8 · Vista previa** — las prendas agrupadas por zona mientras se construye. Sin silueta
      artificial: la especificación dice expresamente que no hace falta.
- [x] **9 · Foto del outfit** — opcional. Sin ella, la portada se compone con las fotos de sus
      prendas.
- [x] **10 · Información** — nombre (obligatorio), descripción, ocasión (11), estación (5) y lugar.
- [x] **11 · Personas** — lista de texto libre, **no un sistema social** (lo prohíbe el apartado).
      Se guarda como array para que la Fase 3 pueda preguntar "¿qué outfit usé con esta persona?".
- [x] **12 · Favoritos** — marcables desde la tarjeta y desde el detalle, y filtrables.
- [x] **13 · Editar** — los nueve campos.
- [x] **14 · Duplicar** — desde la tarjeta y desde el detalle.
- [x] **15 · Eliminar** — con confirmación, y **sin tocar ninguna prenda**. La interfaz lo dice.
- [x] **16 · Detalle** — todo lo que tenga, más editar / duplicar / eliminar / favorito.
- [x] **17 · Acceso directo a las prendas** — pulsar una prenda dentro del outfit cambia a la
      pestaña Prendas y abre **su** detalle, el mismo de la Fase 1.
- [x] **18 · Información de uso** — `usos` y `ultimoUso` existen, vacíos. **No se tocan** en esta
      fase (apartado 8 del cierre: "no inventes datos").
- [x] **19 · Modelo de datos** — los 14 campos, con `prendaIds` como única relación.
- [x] **20 · Usuario** — clave `armario` en `app_data`, con la RLS por `user_id` de siempre.
- [x] **21 · Imágenes** — bucket `armario`, URLs firmadas de una hora. **La foto de una prenda no
      se copia dentro del outfit**: se reutiliza la de la prenda.
- [x] **22 · Filtros** — favoritos, ocasión, estación, lugar y **prenda utilizada**.
- [x] **23 · Búsqueda** — con el ejemplo literal funcionando: **"negro" encuentra "Total Black"**
      porque contiene una prenda negra, aunque su nombre no lleve esa palabra.
- [x] **24 · Ordenación** — 5 activas; las 3 que dependen del uso están escritas y probadas pero
      no se ofrecen hasta que haya un uso registrado (regla 8).
- [x] **25 · Experiencia rápida** — nombre → prendas → guardar. Todo lo demás, plegado.
- [x] **26 · Diseño** — mismos componentes, tokens y tarjetas que la pestaña de Prendas.
- [x] **27 · Estado vacío** — con el texto exacto de la especificación.
- [x] **28 · Compatibilidad con Fase 3** — `armario.usos` ya está declarado como lista: cada uso
      será **un registro independiente** con fecha, lugar, personas y evento. Un outfit podrá
      tener muchos usos, no una sola fecha.
- [x] **29 · Compatibilidad con Fase 4** — nada de lo necesario se pierde: `prendaIds` permite
      contar prendas más repetidas, y `usos`/`ultimoUso` esperan a la Fase 3 sin datos inventados.
- [x] **30 · No romper nada** — 545 comprobaciones en verde.
- [x] **31 · Pruebas obligatorias** — las de crear, editar, relaciones, duplicar, eliminar y
      búsqueda están automatizadas (185 comprobaciones del armario). Las de responsive y
      persistencia real en Supabase siguen siendo de Josué (**R1**).

**La decisión que la especificación dejaba abierta (apartado 10 de la continuación): qué pasa al
borrar una prenda que está en un outfit.** De las tres salidas posibles se elige **conservar la
referencia y mostrarla como no disponible**, y el motivo es concreto: desde ME Fase 3 borrar una
prenda la manda a la papelera, así que **se puede restaurar**. Si al borrarla le quitáramos su id a
todos los outfits, restaurarla dejaría los outfits rotos para siempre — el dato volvería pero el
vínculo no. Conservando la referencia, **restaurar la prenda cura los outfits solos**, sin ningún
código de reparación. Mientras tanto el outfit lo dice, y el detalle explica que se recupera desde
Eliminados recientemente. Además, la confirmación de borrado avisa: *"está en 2 outfits"*.

**Del pulido final (los tres bloques de la fase):** contador de selección, quitar una prenda
volviendo a pulsarla, aviso de "Outfit guardado ✓" que se va solo, editar y duplicar a un toque
desde la tarjeta, eliminar **separado** de esas dos y solo dentro del detalle con confirmación,
indicador de "1 prenda no disponible" (que cuenta tanto la lavadora como una prenda borrada), y el
detalle releyéndose del array para que un cambio se vea al instante sin recargar.

**Un fallo mío corregido durante la fase:** al escribir el detalle del outfit dejé un `</div>` de
más, y el proyecto dejó de compilar. Lo cazó `scripts/smoke.mjs` antes de llegar a ninguna parte.

#### AR · Fase 3/4 — CALENDARIO + HISTORIAL DE USO DEL ARMARIO ✅ COMPLETADA (v1.34.0)

- [x] **1 · Concepto principal** — cada uso es **un registro independiente**. Ponerse el mismo
      outfit el 1, el 5 y el 12 son tres registros, no una fecha que se pisa.
- [x] **2 · Calendario** — tercera pestaña del Armario: **Prendas | Outfits | Calendario**.
      Reutiliza `celdasMes` del Calendario Universal; **ni un segundo motor de calendario**.
- [x] **3 · Vista mensual** — rejilla del mes con navegación, "hoy" marcado y vuelta a hoy
      pulsando el nombre del mes.
- [x] **4 · Día con outfit** — se pinta la **miniatura de la prenda** al 55 % detrás del número,
      no un punto de color.
- [x] **5 · Varios outfits en un mismo día** — se admiten y se cuentan: una insignia con el número
      en la esquina de la celda, y el detalle del día los lista todos.
- [x] **6 · Registrar uso** — outfit + fecha es lo único obligatorio; el resto es opcional.
- [x] **7 · Registrar desde el outfit** — botón **"Me lo he puesto hoy"** en su detalle, a un toque.
- [x] **8 · Registrar desde el calendario** — pulsar un día vacío abre el formulario con esa fecha
      ya puesta.
- [x] **9 · Fecha y hora** — la fecha es un **día local "AAAA-MM-DD"**, nunca un instante UTC. Aquí
      se destapó el fallo de `todayISO()` que afectaba a toda la app (ver abajo).
- [x] **10 · Lugar** — texto libre; los lugares escritos alimentan el filtro sin repetirse.
- [x] **11 · Personas** — lista de texto libre, **no un sistema social**.
- [x] **12 · Evento / ocasión** — los 9 del apartado, **distintos de la ocasión del outfit**: el
      outfit puede ser "de cena"; este uso concreto, "la cena de cumpleaños de Jorge".
- [x] **13 · Notas** — opcionales, visibles en la fila del historial.
- [x] **14 · Editar un uso** — todos los campos, desde el calendario y desde la lista.
- [x] **15 · Eliminar un uso** — pasa por la papelera (`armario.usos`), así que se puede restaurar.
- [x] **16 · Cambio de fecha** — editar la fecha mueve el uso de día sin duplicarlo.
- [x] **17 · Calendario como centro visual** — es la pestaña que abre la vista mensual por defecto.
- [x] **18 · Vista de lista** — alternativa cronológica al mes, con los 60 más recientes.
- [x] **19 · Filtros del historial** — outfit, **prenda**, ocasión, lugar y persona, combinables.
- [x] **20 · Rango de fechas** — los 5 del apartado (todo / 7 / 30 / 90 / 365 días).
- [x] **21 · Outfits sin historial** — lo dicen con una frase y un botón para registrar el primero.
- [x] **22 · Prendas sin historial** — **"Todavía no hay datos de uso."**, nunca "0 días" ni una
      fecha inventada (apartado 28, literal).
- [x] **23 · Relación con prendas** — el historial de una prenda **se deduce**: sus outfits → los
      usos de esos outfits. Josué nunca registra una prenda suelta y aun así la prenda tiene
      historial.
- [x] **24 · Modelo de datos** — 10 campos por uso. **Ningún contador guardado** (apartado 17): se
      quitaron `usos`/`ultimoUso` de prenda y outfit.
- [x] **25 · Seguridad** — clave `armario` en `app_data` con la RLS por `user_id` de siempre. Un
      uso viaja dentro del mismo paquete que las prendas y los outfits: **no hay una tabla nueva
      ni una vía nueva de acceso**, así que hereda el aislamiento ya verificado. Ninguna clave de
      API en el cliente; nada nuevo sale del dispositivo.
- [x] **26 · Borrado de outfit** — **el historial se conserva** (ver la decisión, abajo).
- [x] **27 · Edición de prenda** — no toca ningún uso: los usos apuntan al outfit, no a la prenda.
- [x] **28 · Rendimiento** — las ordenaciones por uso van contra un **índice construido en una
      pasada** (`indiceUsoPrendas` / `indiceUsoOutfits`), no recorriendo el historial dentro de
      cada comparación del `sort`.
- [x] **29 · Móvil** — mismos componentes, celdas cuadradas y modales por `createPortal`.
- [x] **30 · Acceso rápido** — el uso aparece en el **Calendario Universal** como fuente
      **derivada** (regla 11): se genera en cada render desde `armario.usos`, nunca se copia.
      Borrar un uso lo quita del calendario en el mismo render, sin código de limpieza.
- [x] **31 · Integración con Fase 1 y Fase 2** — las tres ordenaciones por uso que la Fase 1 dejó
      escondidas **ya se ofrecen** en cuanto hay un uso, y ahora salen del historial real.
- [x] **32 · Preparación para Fase 4** — todo lo que el anti-repetición necesita ya está y es
      consultable: `diasDesde`, `usosDePrenda`, `usosDeOutfit`, los índices de uso y los filtros
      por persona y por lugar.
- [x] **33 · Experiencia final** — un toque para registrar lo de hoy; todo lo demás, plegado.
- [x] **34 · Pruebas obligatorias** — la batería del apartado 40 está automatizada.
- [x] **35 · Prueba crítica** — la del apartado 41, número a número:
      `Vaquero gris → 3 usos, último 2026-08-20` · `Casual Gris → 2, 2026-08-20` ·
      `Cena Negra → 1, 2026-08-15`. Todo derivado; nada escrito a mano.
- [x] **36 · No romper nada** — **661 comprobaciones en verde**.

**La decisión del apartado 32 (borrar un outfit que tiene historial):** se **conserva el
historial**, igual que la Fase 2 conservó las prendas dentro de los outfits y por el mismo motivo:
el outfit va a la papelera, o sea que puede volver. Si al borrarlo se borraran sus usos,
restaurarlo devolvería el outfit pero no su historia. Conservándolos, **restaurar lo cura todo
solo**. Mientras el outfit no esté, la fila del historial dice *"Outfit eliminado"* en vez de
fingir que ese día no pasó nada, y la confirmación de borrado avisa de cuántos usos hay.

**Dos fallos reales de toda la app que destapó esta fase** (los dos en `src/lib/helpers.js`, los
dos por usar `toISOString()`, que da siempre UTC):

1. **`todayISO()` devolvía AYER entre las 00:00 y las 01:00/02:00** en España. Registrar el sueño a
   las 00:30 lo archivaba en el día anterior — y lo mismo un gasto, una comida, un hábito o una
   entrada del diario. Lo avisaba el apartado 9 para el armario; el fallo era de todo el proyecto.
2. **`addDays()` restaba un día entero**: `addDays('2026-08-25', 1)` devolvía `'2026-08-25'`, y
   `addDays('2026-01-15', 7)` devolvía el 21 en vez del 22. Lo usan la recurrencia del Calendario y
   las predicciones.

#### AR · Fase 4/4 — SISTEMA INTELIGENTE ANTI-REPETICIÓN + ESTADÍSTICAS + RECOMENDACIONES ✅ COMPLETADA (v1.35.0)

Cierra el bloque **AR (4/4)**. Todo vive en `src/lib/armarioInteligencia.js`, un módulo puro nuevo
que **consume** lo de las fases 1-3 y no recalcula ni una relación por su cuenta.

- [x] **1 · Fuente de verdad** — cero contadores nuevos. Los índices se construyen al vuelo, se
      consultan y se tiran al acabar el render: nunca se guardan, así que nunca se desincronizan.
- [x] **2 · "Hace X días"** — ahora también en la tarjeta de prenda y en la de outfit, no solo en
      el detalle. Calculado, nunca guardado. Sin historial no se pinta: "Nunca utilizado" en cada
      tarjeta de un armario recién creado es ruido, no información.
- [x] **3 · Estadísticas de outfits** — total, usados, sin estrenar, más usado, menos usado,
      último usado y rankings.
- [x] **4 · Estadísticas de prendas** — más usadas, nunca usadas, la más reciente y las que llevan
      más tiempo sin aparecer en un outfit. **El uso de una prenda se deriva de sus outfits**, con
      el ejemplo literal del apartado comprobado: 3 usos + 5 usos = 8, y sigue siendo UNA prenda.
- [x] **5 · Diversidad del armario** — `prendas usadas ÷ prendas disponibles`, una división que
      cualquiera puede rehacer a mano. **No cuenta las que están en la lavandería**: una camiseta
      que ha estado el mes entero en el cesto no se ha usado, pero eso no es falta de diversidad.
- [x] **6 · Anti-repetición** — cuatro estados (sin estrenar / usado hace poco / usado esta semana
      / hace tiempo que no lo usas). **Ninguno prohíbe nada**: solo cambia lo que se dice.
- [x] **7 · Recomendación de outfit** — con sus **motivos en texto**, sacados de los mismos números
      que la ordenaron. Si no se puede explicar, no se enseña.
- [x] **8 · Contexto** — lugar, ocasión, personas y temporada **suman señales, nunca excluyen**. El
      lugar se mira en el HISTORIAL REAL, no solo en la etiqueta del outfit: haberlo llevado tres
      veces a la universidad pesa más que una etiqueta puesta al crearlo.
- [x] **9 · Prendas no disponibles** — penalización fuerte, no veto: cualquier alternativa completa
      gana, pero el outfit sigue apareciendo y **dice qué prenda concreta le falta**.
- [x] **10 · Repetición de prendas** — "la has usado 8 veces en los últimos 14 días", como
      información. Solo mira la ventana reciente: 40 usos en dos años no es sobreutilización.
- [x] **11 · Combinaciones repetidas** — detecta el mismo CONJUNTO de prendas aunque esté guardado
      en outfits distintos (el caso de un outfit duplicado y renombrado). No crea outfits nuevos.
- [x] **12 · Outfits poco utilizados** — los que existen y llevan 30 días o más sin usarse. Los
      que nunca se han estrenado **no** entran: eso es otra cosa y tiene su propia lista.
- [x] **13 · Prendas infrautilizadas** — nunca usadas primero, después las olvidadas. Las que están
      en la lavandería quedan fuera: sugerirlas no es una sugerencia, es un despiste.
- [x] **14 · Panel inteligente** — "Tu armario hoy", con frases generadas de los números reales.
      Cada frase aparece solo si su dato existe.
- [x] **15 · Filtros temporales** — 7 / 30 / 90 días, este año, todo y desde una fecha. "Este año"
      empieza el 1 de enero, que no es lo mismo que "hace 365 días".
- [x] **16 · Puntuación** — la única que hay es la diversidad, y es una fracción explicada con sus
      dos números crudos a la vista. No se ha inventado ningún "índice de estilo" sin sentido.
- [x] **17 · Privacidad** — ni una consulta nueva, ni una tabla nueva. Todo se calcula en el
      dispositivo sobre el `armario` que ya viajaba con la RLS por `user_id`.
- [x] **18 · Rendimiento** — un índice por rejilla, no un recorrido por tarjeta; los períodos
      recortan antes de agregar. **Se corrigió un fallo mío de este tipo** durante la fase.
- [x] **19 · Móvil** — tarjetas compactas, bloques plegables y el flujo rápido entero:
      **Recomiéndame → outfit con sus motivos → "Me lo pongo"**, tres toques.
- [x] **20 · Integración** — cuatro subpestañas con `flex-wrap`, el mismo patrón que Productividad
      ya usa con cinco. Las estadísticas se abren **desde Prendas y desde Outfits**, y son LAS
      MISMAS: un solo sistema, no tres pantallas de estadísticas.
- [x] **21 · Estados vacíos** — sin historial, la pestaña dice qué hacer para tenerlo.
- [x] **22 · Datos insuficientes** — por debajo de 5 usos **no se recomienda**, y se dice cuántos
      faltan. Con menos, "el que hace más tiempo que no usas" es solo el que registraste primero.
- [x] **23 · Pruebas obligatorias** — automatizadas las que no necesitan navegador.
- [x] **24 · Prueba crítica** — el escenario literal del apartado, comprobado número a número.
- [x] **25 · No implementar** — ni IA de moda, ni generación por IA, ni compras, ni tiendas, ni
      nada social. **Ninguna llamada a la IA en toda la fase.**
- [x] **26 · Calidad** — código muerto eliminado (un import sin usar), imports revisados, y las
      fases 1-3 intactas.
- [x] **27 · Criterio de finalización** — 777 comprobaciones en verde.

**Un fallo real encontrado y corregido durante la fase:** `noDisponiblesDeOutfit` devuelve un
**número**, y yo lo estaba tratando como una lista. `noDisponibles.length` era `undefined`, así que
`> 0` era siempre falso y **la penalización del apartado 9 no se aplicaba nunca**: el outfit con una
prenda en la lavandería salía como primera recomendación. No daba error ni en consola ni al
compilar — lo cazó la prueba del apartado 9. Arreglado en el origen: se ha añadido
`prendasNoDisponiblesDeOutfit`, que devuelve la lista, y `noDisponiblesDeOutfit` pasa a ser su
longitud, para que las dos respuestas salgan siempre del mismo cálculo.

**Dos cosas más que se corrigieron al releer el código antes de cerrar:**

1. **La recomendación se guardaba en el estado**, así que registrar un uso desde la propia tarjeta
   dejaba en pantalla un "hace 20 días" que acababa de dejar de ser verdad — la tarjeta se
   contradecía con el botón que se acababa de pulsar. Ahora solo se guarda *si* se ha pedido; el
   resultado se deriva del historial actual.
2. **"Más usados" y "menos usados" mostraban la misma lista al revés** cuando había 5 outfits
   usados o menos. Ahora el segundo ranking solo aparece cuando hay más de 5, que es cuando las
   dos listas contienen outfits distintos.

**Por qué las estadísticas están en una pestaña y no repartidas:** el apartado 3 las pide "dentro
del área de Outfits" y el 4 "dentro del Armario", pero las dos se apoyan en el mismo historial y
comparten el filtro temporal del apartado 15. Partirlas obligaría a mantener dos veces el mismo
selector de período y a que Josué eligiera "30 días" dos veces para ver una foto coherente. Están
juntas en **Ideas** y se llega desde las dos pestañas, con el botón "Ver estadísticas" que cada una
tiene arriba. El apartado 20 lo pide expresamente: no duplicar sistemas.

## SR · SONIDO Y RACHAS — 5 + 4 fases

⚠️ **Este bloque contiene DOS especificaciones con numeración solapada** (Sistema de Sonido, 5 fases; Sistema de Rachas, 4 fases). La checklist de más abajo las fusiona porque no hay forma automática de separarlas con certeza.

**Ya no hay que aclarar si son uno o dos módulos: D2-01 lo decidió** — son **dos**, con su propia
numeración y su propia clave. Lo que sigue sin estar claro es **qué texto pertenece a qué fase**, y
eso está anotado como **C-23** en `docs/03` a la espera de Josué (regla 49). Mientras tanto se ha
construido lo único que el archivo identifica sin ambigüedad: la Fase 1 de **Rachas**.

---

### RA · RACHAS — 4 fases

#### RA · Fase 1/4 — ARQUITECTURA Y LÓGICA DEL SISTEMA DE RACHAS ✅ COMPLETADA (v1.48.0)

**El apartado 24 describe, sin saberlo, el código que el proyecto ya tenía:** *"No hagas una
solución rápida que simplemente incremente un contador."* Los hábitos de Productividad guardaban
`rachaActual` y `mejorRacha` como números sueltos, y al desmarcar el día de hoy le restaban uno al
contador **a mano**. Consecuencia: bastaba con desmarcar y volver a marcar el mismo día para subir
el récord sin haber cumplido nada — y con ello desbloquear el logro "Un mes de constancia".

Ahora no se guarda ni un número. Todo —racha actual, récord, historial, porcentaje— sale del
historial de días, que es el mismo que Josué ya tenía. Es el camino de AR Fase 3, donde
desaparecieron por lo mismo los contadores de uso del Armario.

- [x] **1 · Objetivo principal** — `src/lib/rachas.js`: fiable, persistente, sincronizable e
      **independiente de la interfaz**. No toca React, ni Supabase, ni el reloj — el día de hoy
      entra como parámetro, y por eso se prueba entero con Node.
- [x] **2 · Concepto fundamental** — días consecutivos que cumplen una condición, sin asumir que
      todas las rachas se comportan igual.
- [x] **3 · Tipos de racha** — los nueve del apartado, con identificador estable: lo que se guarda
      en un evento es el `id`, así que renombrar "Estudio" no rompe ningún historial.
- [x] **4 · Regla de día** — **el día local de Josué, nunca el UTC.** Se apoya en `todayISO` y
      `addDays`, ya corregidos en AR F3. Cada evento guarda su día local (que decide) y su instante
      UTC (que solo desempata). A las 23:59 cuenta para hoy; a las 00:01, para mañana — probado.
- [x] **5 · Qué significa completar un día** — cuatro conceptos separados: **Racha** (definición),
      **Regla** (condición), **Evento** (cumplimiento) y **Estado** (derivado, nunca guardado).
- [x] **6 · Eventos de racha** — la racha se reconstruye del historial. No hay `currentStreak = 17`
      en ninguna parte.
- [x] **7 · Racha actual** — `rachaActual()`, anclada en hoy y recorriendo hacia atrás.
- [x] **8 · No penalizar prematuramente** — **lo más importante de la fase.** Con lunes ✅, martes ✅
      y el miércoles todavía por hacer, a las 10:00 la racha vale 2 y está VIVA, no 0 y perdida.
- [x] **9 · Mejor racha** — se calcula del historial. Corregir un día corrige el récord solo, y no
      hay forma de inflarlo desde la interfaz porque no hay nada que escribir.
- [x] **10 · Historial** — `historialDeRachas()` da todos los tramos con inicio, fin, duración y si
      está vivo. Fuente independiente, lista para el calendario de RA F4.
- [x] **11 · Días perdidos** — los cuatro estados sin mezclar: `completado`, `perdido`,
      `pendiente`, `futuro`.
- [x] **12 · Futura flexibilidad** — registro `CLASES_REGLA`. Añadir "estudiar 30 minutos" es una
      entrada más, no tocar el motor. Ya funcionan `diaria`, `diaria_con_gracia`, `minimo` y
      `cantidad`. ⚠️ Una regla **semanal** cuenta semanas, no días: cambia el recorrido entero, así
      que **no se ha fingido que existe** (regla 8); el punto exacto donde entraría está marcado.
- [x] **13 · Racha global** — `rachaGlobal()`, capa superior que no sustituye a las individuales:
      las señala. ⚠️ **He tenido que elegir un significado**, porque el ejemplo del apartado no
      cuadra (18, 12, 7 y 24 → dice 18, que no es ni el máximo ni el mínimo). Se ha implementado
      como **días seguidos cumpliendo al menos una racha**. Anotado en `docs/03` para que lo
      confirme; cambiarlo es tocar una sola función.
- [x] **14 · Rachas personalizadas** — el tipo `custom` existe y el motor no distingue. La interfaz
      para crearlas es de una fase posterior.
- [x] **15 · Supabase** — se guarda en `app_data`, la misma tabla por usuario que los otros veinte
      módulos. Nada de `localStorage` como fuente de verdad.
- [x] **16 · Seguridad** — *"nunca confiar en un user_id enviado desde el cliente"*: aquí el cliente
      no manda ninguno, porque no existe ninguno que mandar. RLS por `auth.uid()`, sin tabla nueva.
      Y el récord no se puede manipular desde la interfaz porque no se guarda.
- [x] **17 · Consistencia** — `resumenRacha()` es la función única: una llamada devuelve todo lo que
      enseña una pantalla. Dashboard, hub, exportación y Productividad ya la usan; que uno diga 15 y
      otro 16 solo podría pasar si alguien contara por su cuenta, y ya nadie lo hace.
- [x] **18 · Idempotencia** — clave lógica `racha + día local`. Pulsar cinco veces "completado" deja
      **un** día, no cinco. Es también lo que permite que una cola offline reintente sin duplicar.
- [x] **19 · Sincronización** — el estado vive en `app_data`, nunca en la memoria de un componente,
      y como todo se deriva del historial, dos dispositivos con los mismos eventos no pueden
      enseñar rachas distintas.
- [x] **20 · Offline** — no se construye aquí, pero el punto de enganche queda identificado y
      documentado: la lista de eventos, idempotente por diseño.
- [x] **21 · Casos extremos** — los quince, con prueba: medianoche, fin de año, cambio de mes, 29 de
      febrero, volver tras semanas fuera, duplicados, datos desordenados, borrar la actividad que
      sostenía la racha, restaurarla, cuenta nueva y usuario sin historial.
- [x] **22 · Nada de gamificación todavía** — ni niveles, ni medallas, ni logros, ni confeti, ni
      sonidos. Hay una prueba que **falla si aparecen**. Y por D2-02, cuando lleguen, se quedan
      dentro de Rachas y Sonido.
- [x] **23 · Resultado esperado** — arquitectura, modelo, motor y preparación, los cuatro.
- [x] **24 · Regla fundamental** — cero contadores guardados. Todo derivado.
- [x] **25 · Antes de modificar el proyecto** — se inspeccionó primero, y por eso la regla de los
      hábitos ("un fallo suelto no rompe la racha") **se ha conservado tal cual**, convertida en la
      regla `diaria_con_gracia` en vez de cambiarle el comportamiento a Josué sin avisar.
- [x] **26 · Documentación** — los siete puntos, en `CHANGELOG.md` y `HANDOFF.md`.
- [x] **27 · Criterio de finalización** — RA F2 (Supabase), F3 (hitos y logros) y F4 (interfaz y
      Centro de Rachas) pueden construirse encima sin rehacer nada de esto.

**Cuatro fallos reales, tres de ellos ya en producción:**

1. **El récord de los hábitos se podía inflar** desmarcando y volviendo a marcar el mismo día. Hay
   una prueba que lo hace diez veces y comprueba que ahora el récord no se mueve.
2. **Un hábito sin `historial` dejaba Productividad en blanco.** Nunca se había visto porque esa
   vista **no se renderizaba en ninguna prueba**; salió en cuanto se añadió. Puede pasar de verdad
   con un dato importado o restaurado a medias.
3. **La exportación podía no cuadrar con la pantalla**, porque leía el contador y la pantalla otro.
4. **Mío, durante la fase:** `[].every()` es `true`, así que la primera racha de la vida "batía el
   récord" sin haber ningún récord anterior. Lo cazó su propia prueba.

⏸ **PENDIENTE DE JOSUÉ (regla 49) — ver C-23 en `docs/03`:** en el archivo de especificación, el
encabezado *"FASE 1 — Arquitectura + motor global de audio"* va seguido del texto de *"FASE 4 ·
Sistema de Rachas: interfaz"*. Falta saber **dónde está la Fase 1 real del Sonido** y **en qué orden
van los dos módulos**. Nada de eso bloquea esta fase, que ya está cerrada.

#### RA · Fase 2/4 — PERSISTENCIA, SUPABASE, SEGURIDAD Y SINCRONIZACIÓN ✅ COMPLETADA (v1.49.0)

**La decisión que define la fase.** El apartado 3 propone tablas `streaks` y `streak_days`, y acto
seguido dice: *"No copies estos nombres obligatoriamente si el proyecto ya utiliza otra
convención"*. El apartado 1 lo remata: *"No dupliques sistemas existentes."*

La convención de JosStyle es **una sola tabla `app_data`**, una fila por usuario y clave, con RLS
por `auth.uid()`, que usan los veinte módulos. Las rachas entran ahí, con la clave `rachas`. Montar
tablas propias habría sido el segundo sistema de persistencia del proyecto **y un tercer bloque de
SQL que Josué tendría que ejecutar a mano desde el iPhone** —ya tiene dos pendientes— sin el cual las
rachas no funcionarían. Así no hay nada que ejecutar.

- [x] **1 · Inspeccionar primero** — se hizo, y de ahí sale la decisión de arriba.
- [x] **2 · Objetivo** — la racha sobrevive a cerrar sesión, cerrar la PWA, cambiar de dispositivo,
      reinstalar y perder la conexión, porque vive donde vive todo lo demás.
- [x] **3 · Modelo de datos** — `Racha` (estable) y `Cumplimiento` (histórico), separados, con la
      convención del proyecto y no con la de la especificación, como ella misma permite.
- [x] **4 · user_id** — **el modelo no tiene campo `user_id`.** El cliente no puede elegir el de
      otro porque no manda ninguno. Hay una prueba que comprueba que la palabra no aparece.
- [x] **5 · Row Level Security** — las cuatro políticas de `app_data` (SELECT/INSERT/UPDATE/DELETE)
      con `auth.uid() = user_id`. Ninguna del tipo permisivo `auth.uid() IS NOT NULL` que el
      apartado prohíbe expresamente.
- [x] **6 · Integridad** — el `UNIQUE(streak_id, local_date)` se aplica en el servicio, que es el
      único sitio del proyecto que escribe cumplimientos. El apartado lo admite: *"siempre que
      encaje con el modelo final"*.
- [x] **7 · Fechas** — día lógico local (decide) y timestamp UTC (solo desempata), separados desde
      RA F1.
- [x] **8 · Zona horaria** — la fecha lógica se fija **antes de persistir**, en el dispositivo.
      Nunca la deduce el servidor de un timestamp: ese es el fallo de "completar a las 00:30 y que
      se archive ayer", que este proyecto ya sufrió de verdad y corrigió en AR F3.
- [x] **9 · Creación de rachas** — `crearRacha()` valida tipo, regla y nombre repetido, y **no
      permite cumplimientos huérfanos**: completar una racha inexistente devuelve error y no
      escribe nada. Una regla de mínimo sin objetivo se rechaza, porque ningún día podría cumplirse.
- [x] **10 · Registrar cumplimiento** — `completarDia()`, idempotente por `racha + día`.
- [x] **11 · No confiar en el cliente** — mandar `{currentStreak: 9999}` **no tiene dónde
      aterrizar**: no se guarda ningún contador. Probado: el número inyectado no cambia nada.
- [x] **12 · Contadores derivados** — no hay caché de contadores. La fuente de verdad es el
      historial, siempre.
- [x] **13 · Servicio de recálculo** — `recalcularRacha()` reconstruye `currentStreak`,
      `longestStreak`, `currentStartDate` y `lastCompletedDate`. Aquí recalcular no es una
      reparación excepcional: es la única forma de saber el número.
- [x] **14 · Sincronización por capas** — `src/lib/rachasServicio.js` es **el único sitio que
      escribe rachas**. Ningún componente llama a `supabase.from(...)` ni recalcula por su cuenta,
      y los hábitos de Productividad también se consultan por aquí.
- [x] **15 · Cache local** — el de siempre: estado en React, `saveData` detrás. El cache **no** es
      la fuente de verdad.
- [x] **16 · Offline** — cola pequeña (`encolar` / `vaciarCola`), como pide el apartado (*"no
      construyas un sistema offline gigantesco"*). Funciona por una sola razón: **reintentar es
      idempotente**. Cinco reintentos siguen siendo un día — probado.
- [x] **17 · Conflictos** — iPhone y ordenador completando el mismo día dan **un** día.
- [x] **18 · Eliminación de eventos de origen** — `invalidarPorOrigen()`. Al borrar el
      entrenamiento que sostenía la racha, su día desaparece y **el número se corrige solo**,
      porque nunca estuvo guardado. El acoplamiento con Entrenamiento es de otra fase, como pide
      el apartado; aquí queda el mecanismo.
- [x] **19 · Event source** — `origen` + `origenId` en cada cumplimiento. Permite responder a
      "¿por qué se completó esta racha?" e invalidarla si la actividad desaparece.
- [x] **20 · Auditoría básica** — `registradoEn`, `origen`, `origenId`, y nada más. Hay una prueba
      que **falla si un cumplimiento crece con campos innecesarios**.
- [x] **21 · Migraciones** — `supabase/schema.sql`, la estructura reproducible que ya existe,
      documenta por qué las rachas no añaden nada. Cero cambios manuales irreproducibles.
- [x] **22 · Tipos** — ⚠️ **el proyecto no usa TypeScript**: es JavaScript con Vite y no hay un solo
      `.ts` en `src/`. Meterlo por un módulo obligaría a configurar el compilador para el resto, que
      es el "duplicar sistemas" del apartado 1. El equivalente honesto es lo que se ha hecho:
      `@typedef` para `Racha`, `Regla`, `Cumplimiento` y `EstadoRachas` —que el editor sí lee— y
      **normalizadores que se ejecutan de verdad**. Un typedef avisa; un normalizador impide.
- [x] **23 · Hook central** — `src/hooks/useRachas.js`. El proyecto no tenía carpeta `hooks/`
      (lógica pura en `lib/`, estado en `App.jsx`); ese reparto no se toca. El hook **no añade
      lógica**: envuelve el servicio y memoiza lo caro.
- [x] **24 · Rendimiento** — el panel se calcula una vez por cambio real de estado, no una por
      render, y no hay ni una consulta: los datos ya están en memoria.
- [x] **25 · Preparación para notificaciones** — `eventosDeRacha()` emite `streak_at_risk`,
      `streak_completed`, `streak_broken` y `streak_milestone`. **Describe, no notifica**: llamarlo
      dos veces no produce dos avisos. Y con hoy pendiente emite "en riesgo", nunca "rota".
- [x] **26 · Preparación para gamificación** — los hitos (7, 14, 30, 50, 100, 365) son números de
      referencia, no logros: sin XP, sin nivel, sin medalla. Prueba que **falla si aparecen**.
      Pasado el último, `siguienteHito()` devuelve `null` en vez de inventarse uno.
- [x] **27 · Pruebas** — **los diez casos, uno por uno y marcados como tales**, más lo que sostiene
      cada uno. 104 comprobaciones.
- [x] **28 · No implementar todavía** — ni Centro de Rachas, ni animaciones, ni confeti, ni sonidos,
      ni logros, ni niveles, ni recompensas, ni rankings.
- [x] **29 · Criterio de finalización** — crear → registrar → persistir → sincronizar → recuperar →
      calcular racha → calcular récord → evitar duplicados → aislar usuarios. Los nueve.
- [x] **30 · Informe final** — los ocho puntos, en `CHANGELOG.md` y `HANDOFF.md`.

**Un fallo mío, cazado por su propia prueba (el caso 10):** la revisión de integridad buscaba los
contadores corruptos **después** de normalizar, y `normalizarRacha` ya los había descartado al pasar.
Que el motor sea inmune a ellos es bueno; que la revisión no pudiera avisar de que venían, no. Ahora
se miran en el estado crudo.

**Lo que todavía no tiene pantalla, y es deliberado:** no hay forma de crear una racha desde la
interfaz. El apartado 28 prohíbe expresamente el Centro de Rachas en esta fase; llega en RA F4. Lo
que sí funciona hoy de punta a punta son los hábitos, que ya consultan por el servicio central.

#### RA · Fase 3/4 — GAMIFICACIÓN, HITOS, LOGROS Y PROGRESIÓN ✅ COMPLETADA (v1.50.0)

**La frase que marca el tono** (apartado 23): *"No quiero que el usuario sienta «tengo que usar la
app para ganar puntos». Quiero que sienta «estoy progresando en mi vida y la app me ayuda a
verlo»."* De ahí salen las tres decisiones que se notan en el código: sin XP ni niveles, doce logros
en vez de cien, y celebraciones que se reservan.

Es una capa **encima**: no calcula ni una racha, se las pide al motor de F1 a través del servicio de
F2. Si se borrara el archivo entero, las rachas seguirían funcionando igual.

- [x] **1 · Regla principal** — el motor no se ha tocado. La gamificación consume.
- [x] **2 · Sistema de hitos** — los doce del apartado (1, 3, 7, 14, 21, 30, 50, 75, 100, 150, 200,
      365) en una configuración central. **Una sola lista**, la de RA F2, reexportada aquí como
      `STREAK_MILESTONES`: no dos que puedan desincronizarse.
- [x] **3 · Múltiples tipos de racha** — los hitos son días. Una racha de entreno de 30 llega al
      mismo hito que una de sueño de 30. Cero lógica por módulo.
- [x] **4 · Logros** — `DefinicionLogro` (estático y global, cacheable) separado de lo desbloqueado.
      La condición recibe el contexto entero, no un número, así que "haber creado 5 rachas" será una
      fila más de la tabla.
- [x] **5 · Logros desbloqueados** — clave única `logro + racha`. La racha entra porque llegar a 30
      días entrenando y a 30 estudiando son **dos conquistas**, no una repetida.
- [x] **6 · No repetir recompensas** — se guardan con su fecha. Cerrar y abrir la app no vuelve a
      desbloquear nada. Probado con cinco evaluaciones seguidas.
- [x] **7 · Hito ≠ logro** — separados de verdad: distinta estructura, distinta persistencia.
- [x] **8 · Progresión** — derivada, nunca guardada. **Y medida desde el hito anterior, no desde
      cero**: con 25 días y el hito en 30 va por el 44 %, no por el 83 %. Medirlo desde cero haría
      que la barra apenas se moviera entre 200 y 365.
- [x] **9 · Récord personal** — viene del motor de F1. No hay un segundo contador.
- [x] **10 · Récord superado** — `STREAK_PERSONAL_RECORD`. Y **la primera racha de la vida no
      cuenta**: no hay récord anterior que batir.
- [x] **11 · Eventos de gamificación** — los seis que pide, desde una capa central. Ningún
      componente tiene que averiguar por su cuenta qué ha pasado.
- [x] **12 · Transiciones** — un hito se anuncia **una sola vez**, porque se apunta cuál ya se
      anunció. Un evento derivado del estado se emitiría cada vez que alguien mirase. Y al volver
      tras una semana fuera se anuncian **todos los hitos intermedios**, no solo el último.
- [x] **13 · Recompensas** — la arquitectura las soporta (un logro es una definición con condición);
      no se ha construido ninguna tienda ni economía.
- [x] **14 · Niveles** — ⚠️ **deliberadamente no implementados.** El apartado los deja en
      condicional (*"no conviertas automáticamente las rachas en niveles si no es necesario"*) y no
      es necesario: no hay nada con qué compararse. Un nivel sin uso sería un control decorativo
      (regla 8).
- [x] **15 · Puntos / XP** — ⚠️ **igual, y por lo mismo**: *"si decides preparar XP"*. No hay nada
      que gastar. Lo que sí queda es el enganche: los eventos llevan los días y el hito, que es todo
      lo que necesitaría una capa de XP futura. Y D2-02 obliga a que, si llega, se quede dentro de
      Rachas y Sonido.
- [x] **16 · Rachas especiales** — "Primera llama", "Mejor que nunca", "Constancia" (30 días en
      total, aunque se falle: premia volver) y "Leyenda". Base sólida, no cien logros.
- [x] **17 · Logros ocultos** — uno, "Mes perfecto". Hasta desbloquearlo se enseña como `???` y no
      cuenta de qué va: contarlo antes convertiría un descubrimiento en una tarea.
- [x] **18 · Estados** — `locked` / `unlocked`, más `oculto` / visible.
- [x] **19 · Progreso hacia logros** — cuando tiene sentido. El de récord **no lleva barra**: nadie
      sabe cuánto le falta para batirse a sí mismo. Y un logro ya conseguido tampoco.
- [x] **20 · Estadísticas** — los ocho datos que pide, todos derivados. Sin dashboard.
- [x] **21 · Calendario futuro** — `diasDelMes()` da el estado de cada día. No pinta nada.
- [x] **22 · Rachas globales** — *"no debe ser simplemente `max(streaks)`. Debe existir una
      condición real."* La suya es "días seguidos cumpliendo al menos una racha", y hay una prueba
      que lo demuestra: **dos rachas que se turnan dan una global mayor que cualquiera de las dos**,
      que es imposible con `max()`.
- [x] **23 · Filosofía** — sin pop-ups, sin recompensas constantes. Un día normal después de otro no
      genera ninguna celebración: hay una prueba de ello.
- [x] **24 · Celebraciones** — tres niveles. Grande solo para 30, 100 y 365.
- [x] **25 · Preparación para sonidos** — los eventos son consumibles tal cual por el sistema de
      audio, sin tocar el motor. Aquí no suena nada.
- [x] **26 · Preparación para notificaciones** — igual, con los de RA F2.
- [x] **27 · Anti-exploit** — **el requisito con más filo, y se cumple por construcción**: el
      contexto no acepta ningún número de fuera, lo pide todo al servicio, que lo deriva del
      historial. `currentStreak = 1000` sin días detrás no desbloquea nada — probado. Y un logro
      inyectado a mano que no esté en el catálogo se descarta al cargar.
- [x] **28 · Recálculo y revocación** — **decisión tomada y documentada: un logro no se revoca
      nunca solo.** Josué cumplió treinta días; corregir después un entrenamiento mal apuntado no
      deshace haberlos cumplido, y quitárselo por eso sería castigarle por ordenar sus datos. Los
      números sí se corrigen solos, porque se derivan. `revisarLogros()` **informa**; revocar es
      explícito, y solo pasa solo al borrar la racha entera.
- [x] **29 · Modelo de datos** — misma decisión y mismos motivos que RA F2: dentro de `app_data`,
      clave `gamificacionRachas`. *"No uses exactamente estos nombres si contradicen las
      convenciones existentes."* Sin tabla nueva, sin SQL nuevo.
- [x] **30 · Rendimiento** — las definiciones son estáticas y se leen una vez; el panel se calcula
      una vez por cambio real de estado, no una por render. Y todo es del usuario autenticado
      porque no hay otro.
- [x] **31 · Tipado** — mismo criterio honesto que RA F2: el proyecto es JavaScript, así que
      `@typedef` más normalizadores que se ejecutan de verdad.
- [x] **32 · Servicio central** — `src/lib/rachasGamificacion.js`, con las cinco operaciones que
      pide. Nada de esto vive en un componente.
- [x] **33 · Hook** — `src/hooks/useGamificacion.js`.
- [x] **34 · Pruebas obligatorias** — **las diez, una por una y marcadas como tales.** 118
      comprobaciones.
- [x] **35 · No implementar todavía** — ni diseño, ni Centro de Rachas, ni calendario, ni confeti,
      ni sonidos, ni vibraciones, ni notificaciones, ni tienda, ni ranking.
- [x] **36 · Criterio de finalización** — racha → progreso → hito → detección → evento → logro →
      persistencia, y todos los datos que RA F4 necesitará, listos en `panelGamificacion()`.
- [x] **37 · Informe final** — los ocho puntos, en `CHANGELOG.md` y `HANDOFF.md`.

**Dos expectativas mías mal puestas, cazadas por las pruebas:** con la lista de doce hitos, el
siguiente después de 17 días es **21**, no 30 — y con 5 días los hitos alcanzados son dos (el 1 y el
3), no tres, porque **5 no es un hito**. El código estaba bien las dos veces.

⚠️ **Un duplicado que hay que resolver en RA F4:** el proyecto ya tiene `src/lib/logros.js` (Fase
20) con doce insignias de toda la app, dos de ellas de racha (`racha7`, `racha30`). Los logros de
aquí son de racha y todavía **no tienen pantalla**, así que hoy no hay duplicación visible. Cuando
RA F4 construya el Centro de Rachas habrá que decidir si son dos listas o una — anotado para
entonces, no resuelto por mi cuenta.

#### RA · Fase 4/4 — UI/UX, CENTRO DE RACHAS Y EXPERIENCIA VISUAL ✅ COMPLETADA (v1.51.0) 🔒 CIERRA EL BLOQUE RA

Las tres fases anteriores construyeron el motor, la persistencia y la gamificación. **Esto es lo
único que Josué ve**, y por eso no calcula ni un número: todo viene de `rachasGamificacion.js`.

`src/views/RachasView.jsx` + un módulo nuevo, **Rachas**, en el área Vida junto a Productividad,
que es donde viven los hábitos. La barra inferior sigue teniendo cinco pestañas (regla 10).

- [x] **1 · Inspeccionar la app** — se hizo, y por eso no hay ni un color suelto ni un componente
      que duplique otro: `Card`, `PrimaryButton`, `GhostBtn`, `ListRow` y los tokens de `COLORS`
      son los de siempre. Lo propio es solo lo que no existía.
- [x] **2 · Mobile-first** — nada depende de `hover`, sin scroll horizontal, todo pulsable con el
      dedo, y las mismas `Card` que ya respetan las safe areas del iPhone.
- [x] **3 · Racha principal en el Dashboard** — `ResumenRachaHoy`. Visible sin dominar la pantalla,
      y **si no hay ninguna racha viva no se pinta nada**: una tarjeta que dice "0 días" todos los
      días deja de significar algo y ocupa sitio.
- [x] **4 · Tarjeta de racha** — `TarjetaRacha`, genérica. Recibe un resumen y no sabe de qué
      módulo viene: sirve igual para una racha propia que para un hábito de Productividad.
- [x] **5 · Estados visuales** — los cinco, **y nunca solo por color**: cada uno lleva su palabra y
      su icono. Un estado que solo se distingue por el tinte no existe para quien no lo distingue.
- [x] **6 · Centro de Rachas** — resumen arriba (actual · mejor · logros), principal, secundarias,
      logros y totales.
- [x] **7 · Jerarquía** — la principal grande, las demás compactas. *"No quiero que 10 tarjetas
      ocupen toda la pantalla."*
- [x] **8 · Detalle de una racha** — los nueve datos que pide, incluido el historial de tramos.
- [x] **9 · Calendario de racha** — rejilla de puntos, no emojis: el apartado los propone *"pero
      quiero algo más elegante si el sistema de iconografía actual permite algo mejor"*. Con
      leyenda, `aria-label` por día y navegación entre meses. Lunes primero.
- [x] **10 · Calendario compacto** — un mes cabe entero sin scroll.
- [x] **11 · Progreso hacia el hito** — `BarraHito`, con el porcentaje que ya calcula RA F3. **Sin
      hito siguiente no se dibuja nada**: quien lleva 400 días no tiene barra que llenar.
- [x] **12 · Récord personal** — destacado sin competir con la racha actual: pequeño y debajo. Y
      "estás batiendo tu récord" solo cuando de verdad lo está batiendo.
- [x] **13 · Logros** — desbloqueados destacados, bloqueados discretos, con progreso cuando existe.
- [x] **14 · Detalle de logro** — *"no hagas una ventana enorme"*: una tarjeta que se despliega bajo
      la lista, no un modal. Un logro oculto sin desbloquear **tampoco se destapa aquí**.
- [x] **15 · Celebraciones** — una tarjeta, no una pantalla invasiva.
- [x] **16 · Niveles de celebración** — los de RA F3. Completar un día normal **no abre nada**: su
      microfeedback va en la propia tarjeta.
- [x] **17 · Animaciones** — una transición de 0.35 s en la barra, y ya. Sin bucles, sin efectos
      pesados y **sin un segundo sistema de animaciones**: `prefers-reduced-motion` y el ajuste de
      animaciones de la Fase A3 las gobiernan desde `index.css`, como al resto de la app.
- [x] **18 · Feedback al completar** — "Día completado · Racha: N días", con el número del motor
      real.
- [x] **19 · No duplicar feedback** — **`Celebracion` recibe la lista entera de eventos y saca UN
      solo mensaje.** Hito, récord y logro a la vez salen en una tarjeta, no en tres avisos. Hay una
      prueba de renderizado con los tres a la vez.
- [x] **20 · Sonido** — ⚠️ **no se implementa**, y no hay ni un archivo de audio en un componente.
      La pantalla emite eventos; el sistema de audio los escuchará cuando exista.
- [x] **21 · Haptics** — igual: eventos, nada de vibración.
- [x] **22 · Colores** — `COLORS` y el acento del usuario. Cero hex sueltos: lo comprueba la regla
      invariante de siempre.
- [x] **23 · Dark mode** — funciona en los dos porque **no hay ni un color propio**: todo sale de
      los tokens, que ya cambian con el tema.
- [x] **24 · Accesibilidad** — `aria-label` en botones, días y barra de progreso; `role="progressbar"`
      con sus valores; estados que no dependen solo del color; leyenda en el calendario.
- [x] **25 · Empty states** — *"Empieza tu primera racha"*, con su botón. Ni un hueco.
- [x] **26 · Primer día** — el estado `NUEVA` dice "Recién empezada", no "1 día" a secas, y el hito
      de 1 día se celebra: no parece que un número haya pasado de 0 a 1.
- [x] **27 · Racha rota** — *"La racha terminó. Hoy puedes empezar una nueva"*, literal. Nada de
      "HAS FALLADO".
- [x] **28 · Recuperación** — el récord y el historial siguen ahí, con la frase *"tu mejor marca de
      N días sigue siendo tuya"*.
- [x] **29 · Recordatorio visual** — solo si el día está pendiente. Si ya está completado, no
      aparece.
- [x] **30 · Móvil** — ⚠️ **probado por renderizado, no en un iPhone de verdad.** Es el límite
      honesto de este entorno, el mismo de siempre (R1): el layout real, los gestos y el scroll solo
      los puede ver Josué.
- [x] **31 · Rendimiento** — el panel va en `useMemo`; y el resumen del hub de Rachas, que recorre
      historiales, ha obligado a **memoizar `resumenesTodos` en `App.jsx`**, que hasta ahora se
      recalculaba en cada render porque todo lo que había era barato.
- [x] **32 · Componentes** — `TarjetaRacha`, `BarraHito`, `CalendarioRacha`, `TarjetaLogro`,
      `DetalleLogro`, `Celebracion`, `DetalleRacha`, `CrearRacha`, `ResumenRachaHoy`. Ninguno
      duplica otro que ya existiera.
- [x] **33 · Navegación** — **un módulo más**, en el área Vida. Mismo hub, mismo botón de volver,
      mismas cinco pestañas. Cero navegación paralela.
- [x] **34 · Microinteracciones** — la barra que avanza y el estado que cambia. Poco y suave.
- [x] **35 · No sobrecargar** — *"si una animación o componente no mejora la comprensión, elimínalo"*.
- [x] **36 · Pruebas visuales** — las doce que pide, **montadas con el servicio real** y no con
      datos escritos a mano: si el motor cambiara de forma, estas pruebas se enterarían. Los casos
      de renderizado suben de 140 a 192.
- [x] **37 · Criterio de finalización** — el recorrido entero: Hoy → racha → Centro → detalle →
      historial → progreso → récord → logros → feedback al completar.
- [x] **38 · No avanzar a sonido** — no se ha tocado.
- [x] **39 · Informe final** — los doce puntos, en `CHANGELOG.md` y `HANDOFF.md`.

**Cómo se ha resuelto el duplicado que RA F3 dejó anotado.** El proyecto ya tiene `logros.js` (Fase
20) con doce insignias de **toda la app** —Diario, Objetivos, Nutrición, Calistenia…—. Los de aquí
son de **las rachas** y son por racha, así que pueden ser muchos. Juntarlos daría una lista larguísima
que mezcla dos cosas distintas. Se quedan separados: los de racha en el Centro de Rachas, los
generales en Logros. **No es una decisión irreversible**: si Josué prefiere verlos juntos, es mover
una lista.

**Un hábito no se marca desde aquí.** Aparece en el Centro con su racha, pero el botón de completar
solo sale en las rachas propias: el dato de un hábito vive en Productividad, y ofrecer un segundo
sitio donde escribirlo sería duplicar el camino.

**Lo que sigue sin estar probado, y hay que decirlo:** el aspecto real en un iPhone, los gestos y el
scroll. Como todo lo demás desde R1.

---

### SO · SONIDO — 5 fases

#### SO · Fase 1/5 — ARQUITECTURA Y MOTOR GLOBAL DE AUDIO ✅ COMPLETADA (v1.54.0)

✅ **C-23 queda resuelta a medias:** Josué pasó el texto que faltaba. El orden de los dos módulos ya
no importa —Rachas está entero— y esta es la Fase 1 real del Sonido.

**Lo primero que hay que decir: no hay ni un archivo de audio en el proyecto**, y el apartado 38
prohíbe crearlos (*"En esta fase NO quiero: biblioteca completa de sonidos"*). El 21 lo remata:
*"NO es necesario crear todavía una biblioteca completa. Esta fase solo necesita dejar la
arquitectura lista."* Así que el motor está entero y **hoy no suena nada, porque no hay nada que
sonar** — que es exactamente el camino de fallback del apartado 25 (*"si tampoco existe: silencio"*).
En cuanto Josué deje los archivos en `public/sonidos/`, suena sin tocar una línea.

Y **el interruptor de sonido está apagado de fábrica**, a propósito: encenderlo sin biblioteca daría
un control que dice "Sonidos: sí" y no suena nunca — lo que prohíbe la regla 8.

- [x] **1 · Inspeccionar primero** — hecho: **no había audio, ni EventBus, ni preferencias de
      sonido.** De ahí salen las tres piezas.
- [x] **2 · Objetivo** — la cadena entera: componente → evento → motor → preferencias → sonido.
- [x] **3 · Nada de audio suelto** — ⚠️ **hay una regla invariante nueva en `verificar.sh` que falla
      si `new Audio(` o un contexto de audio aparecen fuera de `audioEngine.js`**, aunque sea en un
      comentario. Sin ella, el primer botón que quiera sonar se traería el suyo y el motor dejaría
      de ser central: no se le aplicarían ni el volumen por categoría, ni el cooldown, ni las
      colisiones. Ya me cazó a mí dos veces mientras escribía esta fase.
- [x] **4 · Catálogo de eventos** — los once mínimos y los seis preparados, **sin conectar** los
      módulos que aún no toca.
- [x] **5 · Evento ≠ sonido** — tres saltos: evento → asignación → sonido → archivo. Cambiar el
      sonido de un hito es escribir una asignación, no editar código.
- [x] **6 · La interfaz del motor** — `reproducir`, `silenciar`, `activar`, `ajustarVolumen`,
      `pausar`, `reanudar`, `precargar`, `detener`. Un componente no sabe qué archivo suena.
- [x] **7 · Configuración global** — si está apagado, **ningún** evento suena, y la comprobación está
      en un sitio.
- [x] **8 · Categorías** — siete, con volumen propio. Es lo que permite bajar los clics sin
      renunciar al sonido de un récord.
- [x] **9 · Prioridades** — cuatro. `UI_CLICK` es LOW, `STREAK_MILESTONE` y `NEW_RECORD` HIGH.
- [x] **10 · Colisiones** — *"nunca como una máquina tragaperras"*. Completar algo dispara
      `ACTION_COMPLETED` + `STREAK_CONTINUED` + `SUCCESS` a la vez, y **suena una sola vez**: hay
      una prueba con ese caso exacto.
- [x] **11 · Cooldown** — **veinte toques rapidísimos dan un sonido, no veinte.** Probado.
- [x] **12 · Sonidos de interfaz** — los más discretos, con el cooldown más corto.
- [x] **13 · Sonidos de importancia** — los reservados llevan el cooldown más largo: un récord que
      sonara dos veces dejaría de ser un récord.
- [x] **14 · Tecnología** — ⚠️ **Web Audio API con `HTMLAudioElement` de respaldo**, y sin librería.
      Con un `<audio>` solo se pierde una prioridad de las siete, pero es la que sostiene el apartado
      8: **un elemento tiene un `volume` y nada más**, así que "Interfaz al 30 % y Rachas al 90 %"
      habría que calcularlo a mano en cada reproducción. Con Web Audio es un `GainNode` por
      categoría, que es la forma exacta del problema. Además iOS limita los `<audio>` simultáneos.
- [x] **15 · Restricciones de iOS** — el motor se engancha al primer gesto y se desbloquea ahí.
      **Hasta entonces no falla: simplemente no suena.** No se intenta saltar nada.
- [x] **16 · AudioContext** — **uno solo**, creado en el primer toque y no antes: crearlo al arrancar
      lo dejaría suspendido y ocupando memoria si Josué nunca enciende el sonido.
- [x] **17 · Preload** — solo lo crítico: interfaz y confirmaciones, que son las que tienen que
      sonar **en el mismo instante** del gesto. Un clic con 200 ms de retraso se siente roto; un
      logro con 200 ms, no.
- [x] **18 · Cache** — la del navegador y la del service worker de la PWA. *"No construyas un sistema
      paralelo"*, así que no hay caché propia. Y **apagado no se descarga nada**.
- [x] **19 · Archivos** — `public/sonidos/{ui,feedback,streak,achievements}/`. Los del usuario irán a
      Storage, en su carpeta: **no se mezclan**.
- [x] **20 · Formatos** — WebM/Opus primero, con MP3/M4A/WAV admitidos. Nada pesado por defecto.
- [x] **21 · Sonidos del sistema** — nueve definidos **por nombre**. Ninguno existe todavía.
- [x] **22 · Sonidos personalizados** — la abstracción `origen: system | custom`. El motor recibe
      cualquiera de los dos por el mismo camino. La subida es de otra fase.
- [x] **23 · Metadata** — id, nombre, categoría, duración, formato, tamaño, origen, fecha. Y nada
      más.
- [x] **24 · Asignaciones** — `evento → sonido`, cambiables sin tocar componentes.
- [x] **25 · Fallback** — asignación de Josué → asignación de fábrica → **silencio**. Probado con un
      sonido borrado.
- [x] **26 · Error handling** — un fallo de audio se apunta y se sigue. **Y el bus garantiza que un
      suscriptor que revienta no tumba al emisor**: si el motor falla, el entrenamiento queda
      guardado igual.
- [x] **27 · Ajustes futuros** — el motor ya consume esas preferencias. **La pantalla no se ha
      construido** (apartado 38).
- [x] **28 · Preferencias persistentes** — en `app_data`, clave `audio`. ⚠️ **No dentro del paquete
      `ajustes`**: ese se guarda entero en cada escritura (regla 5), así que un `saveData` que se
      olvidara del audio lo borraría.
- [x] **29 · Sincronización** — la de siempre, por `app_data`.
- [x] **30 · Event Bus** — no había, así que se ha creado uno ligero (`eventos.js`). ⚠️ **No define
      ni un evento propio de rachas**: los de RA F3 llegan con sus nombres y se traducen con dos
      alias. Redefinirlos sería el "sistema de eventos paralelo" que el apartado prohíbe.
- [x] **31 · Desacoplamiento** — Rachas no sabe que existe el audio, y el audio no sabe qué es una
      racha. Haptics, notificaciones y analítica se enganchan al mismo bus cuando toque.
- [x] **32 · Test mode** — `probarSonidos()`, que además **dice por qué no ha sonado** — hoy siempre
      "no hay archivo", y así se ve de un vistazo en vez de parecer que el motor está roto.
- [x] **33 · Pruebas** — las nueve que se pueden comprobar sin navegador: activado, desactivado,
      volumen 0/50/100, evento inexistente, archivo inexistente, spam y dos eventos simultáneos.
      ⚠️ **Las cuatro que no —iOS, Android, PWA y escritorio— se dicen en la propia salida de las
      pruebas en vez de darlas por buenas.**
- [x] **34 · Rendimiento** — un contexto, un nodo por categoría, buffers que se sueltan al apagar y
      oyentes que se quitan al desmontar.
- [x] **35 · Accesibilidad** — *"el sonido nunca debe ser la única forma de comunicar algo"*. Se
      impone **no dándole al motor ninguna forma de suprimir la interfaz**: la decisión solo dice si
      suena y por qué. Hay una prueba que falla si aparece un campo que pudiera usarse para ocultar
      algo.
- [x] **36-37 · Privacidad y seguridad futura** — los sonidos de Josué en su carpeta, y las reglas de
      validación **en código y no solo documentadas**: MIME primero, porque la extensión la pone
      quien quiera. Un ejecutable llamado `.webm` se rechaza — probado.
- [x] **38 · No implementar todavía** — ni biblioteca, ni subida, ni editor, ni pantalla de Ajustes,
      ni vibración, ni notificaciones sonoras.
- [x] **39 · Criterio de finalización** — evento → resolver → preferencias → volumen →
      prioridad/cooldown → reproducir → fallback, sin que ningún módulo sepa nada de audio.
- [x] **40 · Informe final** — los doce puntos, en `CHANGELOG.md` y `HANDOFF.md`.

**Lo que queda para la Fase 2:** la biblioteca de sonidos, sus categorías y las asignaciones — que es
justo lo que necesita los archivos que Josué dará *"cuando la web ya tenga todos los botones
activos"*.

---

#### SO · Fase 3/5 — EVENTOS, FEEDBACK, RECOMPENSAS Y RACHA ✅ COMPLETADA (v1.65.0)

*"Si ocurren varios eventos simultáneamente, no quiero cinco sonidos superpuestos. […] El sistema
deberá seleccionar el evento sonoro dominante."*

`src/lib/audioEventos.js` (47 comprobaciones). SO F1 dejó 17 eventos y cuatro prioridades, que era lo
que el motor necesitaba; esta fase trae **los 42 del catálogo**, la escala de 0 a 5 y la progresión
de la racha. ⚠️ **No se redefine nada de F1**: se traduce, porque dos catálogos que se separan es lo
que su apartado 30 prohíbe.

⚠️ **Se construye ANTES que SO F2 a propósito**: F2 es la biblioteca de sonidos y **está bloqueada**
por los archivos de audio, que no existen. El catálogo y la jerarquía no los necesitan, así que se
adelanta en vez de dejar el bloque parado.

- [x] **El catálogo completo** — los 42 exactos: 5 de interfaz, 4 de confirmación, 4 de
      tarea/objetivo, 3 de XP, 5 de nivel/recompensa/insignia, 2 de racha, 10 milestones, 4 de estado
      de racha, 2 de logro y 3 de sistema.
- [x] **La escala 0-5 y el evento dominante** — el ejemplo literal de la especificación (tarea → XP →
      nivel → milestone → récord) **suena como PERSONAL_RECORD**, y tiene su prueba.
- [x] **Un bug que cazó esa prueba** — ⚠️ el desempate por días hacía ganar al milestone de 30 sobre
      el récord, que es **justo lo contrario** de lo que dice la especificación. Ahora el récord
      lleva su propio peso de desempate.
- [x] **La interfaz enseña todo, el audio jerarquiza** — los silenciados **se devuelven**, no se
      pierden: es literal en la especificación.
- [x] **La progresión de la racha** — ⚠️ *"no quiero simplemente el mismo sonido con más volumen"*,
      así que **el nivel sube con los días**, con una prueba que recorre los diez milestones y falla
      si dos consecutivos bajan, y otra de punta a punta: el de 365 **no puede** sonar como el de 7.
- [x] **El récord es independiente del milestone** — la especificación lo dice expresamente: *"has
      alcanzado un milestone"* y *"has superado tu propio récord"* son acontecimientos distintos.
- [x] **Los eventos que hoy no emite nadie, declarados con su motivo** — ⚠️ **XP y niveles existen en
      el catálogo y nadie los emite**, porque **RA F3 decidió no construirlos** (sus apartados los
      dejaban en condicional, y sin nada que gastar un contador de XP es un control decorativo —
      regla 8). D2-02 lo respalda. Lo mismo con las recompensas y el "congelar racha", que no existe
      en RA F1 porque el motor deriva del historial y no tiene comodines. **Está dicho en el código y
      comprobado en una prueba, en vez de dejar eventos fantasma.**

**Lo que sigue sin estar probado, y es lo mismo desde SO F1:** ⏸ **HOY NO SUENA NADA**, porque no hay
ni un archivo de audio en el proyecto. **SO F2 es justo la fase que los necesita y sigue esperando** a
que Josué los dé *"cuando la web ya tenga todos los botones activos"*.

#### SO · Fase 4/5 — DISEÑO Y ESPECIFICACIÓN DE LOS SONIDOS ✅ COMPLETADA (v1.66.0)

*"Definir y preparar la biblioteca sonora."*

⚠️ **Esta fase no crea los sonidos, y no puede.** No hay ni un archivo de audio en el proyecto, y
generarlos sería inventarse la mitad del trabajo (regla 8). Lo que sí hace —y es exactamente el verbo
que usa el enunciado— es **definir**: `src/lib/especificacionSonidos.js` (59 comprobaciones) escribe
la ficha de cada archivo como código.

**Esto convierte *"dame los sonidos"* en una lista precisa.** El día que estén en `public/sonidos/`
con estos nombres, **suenan sin tocar una línea**: el motor de SO F1 ya los busca ahí.

- [x] **Las ocho familias y sus duraciones** — ⚠️ **la familia manda sobre el tramo cuando es más
      estricta**: un `ui_click` de 300 ms cumpliría "feedback" y aun así **se pisaría con el siguiente
      toque**. Hay una prueba de que ningún sonido tiene un rango imposible.
- [x] **El carácter y lo que hay que evitar** — como datos, no como comentario: es lo que se le
      entrega a quien los produzca, y una frase suelta en un README se pierde.
- [x] **La firma sonora** — ⚠️ definida **como intervalos, no como notas concretas**, para que se
      transporte y siga reconociéndose. Tres notas, con sus cinco evoluciones de menor a mayor, y
      declarada en los ocho sonidos que el enunciado enumera. ⚠️ **Se llama "de JosStyle"** (D2-08):
      *JC Lifestyle* es el nombre histórico de la especificación.
- [x] **Variantes y sonidos únicos** — los que se repiten mucho llevan variantes numeradas (oír el
      mismo clic doscientas veces al día es lo que cansa). ⚠️ **Y los importantes son únicos**, con la
      lista literal del enunciado: `level_up`, `personal_record`, `grand_achievement` y los
      milestones grandes. Un récord con tres variantes deja de ser un momento.
- [x] **El validador** — caza un archivo demasiado largo, demasiado corto, que pesa de más, con
      formato equivocado, con un nombre que no está en la lista, o **una variante de un sonido que
      tenía que ser único**.
- [x] **`queFalta()`, la función más honesta del archivo** — hoy devuelve **la lista entera**, porque
      no hay ni uno. Dice cuántos faltan, cuáles son los únicos (que son los que más cuestan) y **por
      dónde empezar**: los de interfaz, que son los que se notan al usar la app.
- [x] **Un hueco que cazó la comprobación cruzada** — `goal_progress` estaba en el catálogo de SO F3,
      podía sonar, y **no tenía archivo definido**. La prueba que cruza catálogo y biblioteca lo
      encontró.

**Lo que NO se ha construido, y es un límite de fase, no una omisión:**

- [-] **La pantalla de Ajustes de sonido** — SO F1 terminaba con *"DETENTE. No empieces todavía la
      biblioteca de sonidos ni la pantalla de Ajustes"*, y esa pantalla es de **SO F5**.
- [-] **Los archivos de audio** — ⏸ los da Josué *"cuando la web ya tenga todos los botones
      activos"*. **SO F2 es la fase que los necesita y sigue bloqueada.**

#### SR · Fase 1/5+4 — ARQUITECTURA + MOTOR GLOBAL DE AUDIO (encabezado antiguo)

⚠️ **Los apartados de abajo NO son de audio.** Son los de Rachas F1 y F4, que la extracción
automática colocó bajo este encabezado. Ver **C-23**. Se dejan tal cual porque la checklist conserva
la redacción literal — el trabajo real está arriba, en los bloques RA y SO.
- [ ] OBJETIVO PRINCIPAL
- [ ] CONCEPTO FUNDAMENTAL
- [ ] TIPOS DE RACHAS
- [ ] REGLA DE DÍA
- [ ] QUÉ SIGNIFICA “COMPLETAR UN DÍA”
- [ ] EVENTOS DE RACHA
- [ ] RACHA ACTUAL
- [ ] NO PENALIZAR PREMATURAMENTE
- [ ] MEJOR RACHA
- [ ] HISTORIAL
- [ ] DÍAS PERDIDOS
- [ ] FUTURA FLEXIBILIDAD
- [ ] GRACIAS A ESTO, EL SISTEMA PODRÁ CRECER
- [ ] RACHAS FUTURAS PERSONALIZADAS
- [ ] SUPABASE
- [ ] SEGURIDAD
- [ ] CONSISTENCIA
- [ ] IDEMPOTENCIA
- [ ] SINCRONIZACIÓN
- [ ] OFFLINE
- [ ] CASOS EXTREMOS
- [ ] NO QUIERO GAMIFICACIÓN TODAVÍA
- [ ] RESULTADO ESPERADO DE ESTA FASE
- [ ] REGLA FUNDAMENTAL PARA IMPLEMENTARLO
- [ ] ANTES DE MODIFICAR EL PROYECTO
- [ ] DOCUMENTACIÓN DE LA IMPLEMENTACIÓN
- [ ] Qué has encontrado en el proyecto.
- [ ] Qué arquitectura has elegido.
- [ ] Qué archivos has creado o modificado.
- [ ] Qué lógica de rachas has implementado.
- [ ] Qué queda preparado para futuras fases.
- [ ] Qué NO has implementado porque corresponde a fases posteriores.
- [ ] Cómo puedo probar que el motor funciona correctamente.
- [ ] CRITERIO DE FINALIZACIÓN
- [ ] PRIMERO: INSPECCIONA LA APP ACTUAL
- [ ] PRINCIPIO MOBILE-FIRST
- [ ] RACHA PRINCIPAL EN DASHBOARD
- [ ] TARJETA DE RACHA
- [ ] ESTADOS VISUALES
- [ ] CENTRO DE RACHAS
- [ ] JERARQUÍA
- [ ] DETALLE DE UNA RACHA
- [ ] CALENDARIO DE RACHA
- [ ] NO HACER UN CALENDARIO GIGANTE
- [ ] PROGRESO HACIA EL SIGUIENTE HITO
- [ ] RÉCORD PERSONAL
- [ ] LOGROS
- [ ] DETALLE DE LOGRO
- [ ] CELEBRACIONES
- [ ] NIVELES DE CELEBRACIÓN
- [ ] ANIMACIONES
- [ ] FEEDBACK AL COMPLETAR
- [ ] NO DUPLICAR FEEDBACK
- [ ] SONIDO
- [ ] HAPTICS
- [ ] COLORES
- [ ] DARK MODE
- [ ] ACCESIBILIDAD
- [ ] EMPTY STATES
- [ ] PRIMER DÍA
- [ ] RACHA ROTA
- [ ] RECUPERACIÓN
- [ ] RECORDATORIO VISUAL
- [ ] MÓVIL
- [ ] RENDIMIENTO
- [ ] COMPONENTES
- [ ] NAVEGACIÓN
- [ ] MICROINTERACCIONES
- [ ] NO SOBRECARCAR
- [ ] PRUEBAS VISUALES
- [ ] NO AVANCES A SONIDO
- [ ] INFORME FINAL
- [ ] Componentes creados/modificados.
- [ ] Pantallas creadas/modificadas.
- [ ] Integración con Dashboard.
- [ ] Sistema de estados.
- [ ] Calendario.
- [ ] Logros.
- [ ] Celebraciones.
- [ ] Animaciones.
- [ ] Adaptación móvil.
- [ ] Accesibilidad.
- [ ] Pruebas realizadas.
- [ ] Qué queda para la Fase 5.

#### SR · Fase 2/5+4 — BASE DE DATOS + SUPABASE + SEGURIDAD + SINCRONIZACIÓN
- [ ] OBJETIVO
- [ ] BIBLIOTECA CENTRAL
- [ ] CATEGORÍAS
- [ ] BIBLIOTECA INICIAL
- [ ] FILOSOFÍA DEL SONIDO
- [ ] JERARQUÍA SONORA
- [ ] DURACIÓN
- [ ] NO HACER LOUDNESS EXCESIVO
- [ ] ASIGNACIONES
- [ ] NO CODIFICAR ASIGNACIONES EN COMPONENTES
- [ ] SONIDO PREDETERMINADO
- [ ] FALLBACK
- [ ] PREPARACIÓN PARA PERSONALIZACIÓN
- [ ] METADATA
- [ ] PRESETS
- [ ] PACK PREDETERMINADO
- [ ] SONIDOS DE RACHA
- [ ] PROGRESIÓN SONORA
- [ ] RÉCORD
- [ ] LOGRO
- [ ] RUPTURA DE RACHA
- [ ] VOLUMEN POR CATEGORÍA
- [ ] MUTE
- [ ] VOLUMEN 0
- [ ] MEMORIA
- [ ] CONCURRENCIA
- [ ] COLA DE SONIDOS
- [ ] INTERRUPCIÓN
- [ ] TEST DE BIBLIOTECA
- [ ] ESTRUCTURA DE ARCHIVOS
- [ ] SUPABASE
- [ ] CACHE/PWA
- [ ] COMPATIBILIDAD
- [ ] NO AÑADIR SONIDOS A TODO
- [ ] CRITERIO DE FINALIZACIÓN
- [ ] NO IMPLEMENTAR TODAVÍA
- [ ] INFORME FINAL
- [ ] Biblioteca creada.
- [ ] Categorías.
- [ ] Eventos conectados.
- [ ] Asignaciones.
- [ ] Prioridades.
- [ ] Fallback.
- [ ] Control de volumen.
- [ ] Gestión de concurrencia.
- [ ] Compatibilidad PWA/iOS.
- [ ] Pruebas.
- [ ] Problemas encontrados.
- [ ] Qué queda para la Fase 3.

#### SR · Fase 3/5+4 — MOTOR DE EVENTOS, FEEDBACK Y RECOMPENSAS SONORAS
- [ ] OBJETIVO DE LA FASE
- [ ] PRINCIPIO FUNDAMENTAL
- [ ] CATEGORÍAS DE EVENTOS SONOROS
- [ ] PRIORIDAD DE LOS SONIDOS
- [ ] REGLA DE NO SATURACIÓN
- [ ] COOLDOWN SONORO
- [ ] SISTEMA DE EVENTOS
- [ ] EVENTOS COMPUESTOS
- [ ] SISTEMA ESPECIAL DE RACHA
- [ ] RACHA NORMAL VS. MILESTONE
- [ ] RÉCORD PERSONAL
- [ ] RACHA EN RIESGO
- [ ] RECUPERACIÓN DE RACHA
- [ ] PROTECCIÓN DE RACHA
- [ ] RECOMPENSAS
- [ ] XP
- [ ] NIVELES
- [ ] INSIGNIAS
- [ ] OBJETIVOS
- [ ] VIBRACIÓN + SONIDO
- [ ] CONFIGURACIÓN DEL USUARIO
- [ ] MODOS DE SONIDO
- [ ] MODO PERSONALIZADO
- [ ] REGLA DE PRIORIDAD DEL VOLUMEN
- [ ] PREVISUALIZACIÓN
- [ ] SISTEMA DE SILENCIO INTELIGENTE
- [ ] SONIDOS DURANTE SESIONES
- [ ] IDENTIDAD SONORA
- [ ] ESTRUCTURA TÉCNICA RECOMENDADA
- [ ] REGISTRO CENTRAL DE SONIDOS
- [ ] COLA DE SONIDOS
- [ ] PERSISTENCIA
- [ ] SEGURIDAD Y ROBUSTEZ
- [ ] CARGA DE AUDIO
- [ ] PRIMER ARRANQUE
- [ ] EVENTO DE PRIMERA INTERACCIÓN
- [ ] REGLA DE ACCESIBILIDAD
- [ ] CRITERIOS DE ACEPTACIÓN
- [ ] RESULTADO FINAL DE LA FASE
- [ ] PRIMERO: INSPECCIONA EL PROYECTO
- [ ] OBJETIVO
- [ ] MODELO DE DATOS
- [ ] USER_ID
- [ ] ROW LEVEL SECURITY
- [ ] INTEGRIDAD DE DATOS
- [ ] FECHAS
- [ ] ZONA HORARIA
- [ ] CREACIÓN DE RACHAS
- [ ] REGISTRAR CUMPLIMIENTO
- [ ] NO CONFÍES EN EL CLIENTE
- [ ] CONTADORES DERIVADOS
- [ ] SERVICIO DE RECÁLCULO
- [ ] SINCRONIZACIÓN
- [ ] CACHE LOCAL
- [ ] OFFLINE
- [ ] CONFLICTOS
- [ ] ELIMINACIÓN O MODIFICACIÓN DE EVENTOS
- [ ] EVENT SOURCE
- [ ] AUDITORÍA BÁSICA
- [ ] MIGRACIONES
- [ ] TIPOS TYPESCRIPT
- [ ] HOOK CENTRAL
- [ ] RENDIMIENTO
- [ ] PREPARACIÓN PARA NOTIFICACIONES
- [ ] PREPARACIÓN PARA GAMIFICACIÓN
- [ ] PRUEBAS
- [ ] NO IMPLEMENTAR TODAVÍA
- [ ] CRITERIO DE FINALIZACIÓN
- [ ] INFORME FINAL
- [ ] Arquitectura utilizada.
- [ ] Tablas/migraciones creadas o modificadas.
- [ ] Políticas RLS implementadas.
- [ ] Servicios/hooks creados.
- [ ] Sistema de sincronización.
- [ ] Pruebas realizadas.
- [ ] Problemas encontrados.
- [ ] Qué queda pendiente para la Fase 3.

#### SR · Fase 4 — DISEÑO Y ESPECIFICACIÓN DE LOS SONIDOS INDIVIDUALES
- [ ] OBJETIVO
- [ ] IDENTIDAD SONORA DE JC LIFESTYLE
- [ ] REGLA DE DURACIÓN
- [ ] FAMILIAS SONORAS
- [ ] FAMILIA UI
- [ ] FAMILIA FEEDBACK
- [ ] FAMILIA PROGRESS
- [ ] XP
- [ ] LEVEL UP
- [ ] RECOMPENSA
- [ ] INSIGNIAS
- [ ] OBJETIVO COMPLETADO
- [ ] SISTEMA DE RACHA
- [ ] STREAK_START
- [ ] STREAK_INCREMENT
- [ ] STREAK MILESTONES
- [ ] MILESTONE 3
- [ ] MILESTONE 7
- [ ] MILESTONE 14
- [ ] MILESTONE 21
- [ ] MILESTONE 30
- [ ] MILESTONE 50
- [ ] MILESTONE 75
- [ ] MILESTONE 100
- [ ] MILESTONE 180
- [ ] MILESTONE 365
- [ ] RÉCORD PERSONAL
- [ ] RACHA EN RIESGO
- [ ] STREAK FREEZE
- [ ] STREAK RECOVERED
- [ ] ACHIEVEMENT
- [ ] GRAND ACHIEVEMENT
- [ ] SONIDOS DE SISTEMA
- [ ] HAPTICS
- [ ] DISEÑO DE LA ESCALA SONORA
- [ ] MOTIVO SONORO DE JC LIFESTYLE
- [ ] REGLA DE NO REPETICIÓN
- [ ] VARIANTES
- [ ] REGLA PARA LA ALEATORIEDAD
- [ ] TRANSICIONES
- [ ] MASTERING
- [ ] FORMATO
- [ ] NOMENCLATURA
- [ ] REGISTRO DEFINITIVO
- [ ] TESTING
- [ ] TEST DE SATURACIÓN
- [ ] TEST DE EVENTOS SIMULTÁNEOS
- [ ] OBJETIVO FINAL
- [ ] CRITERIOS DE ACEPTACIÓN DE LA FASE 4
- [ ] RESULTADO
- [ ] INSPECCIONA PRIMERO EL PROYECTO
- [ ] NO REPRODUCIR AUDIO DIRECTAMENTE
- [ ] EVENTOS DE AUDIO
- [ ] EVENTO ≠ SONIDO
- [ ] AUDIO ENGINE
- [ ] CONFIGURACIÓN GLOBAL
- [ ] CATEGORÍAS
- [ ] PRIORIDADES
- [ ] COLISIONES
- [ ] COOLDOWN
- [ ] SONIDOS DE INTERFAZ
- [ ] SONIDOS DE IMPORTANCIA
- [ ] WEB AUDIO / HTML AUDIO
- [ ] PWA;
- [ ] RESTRICCIONES DE IOS
- [ ] AUDIO CONTEXT
- [ ] PRELOAD
- [ ] CACHE
- [ ] ARCHIVOS DE AUDIO
- [ ] FORMATOS
- [ ] SONIDOS DEL SISTEMA
- [ ] SONIDOS PERSONALIZADOS
- [ ] METADATA
- [ ] ASIGNACIONES
- [ ] FALLBACK
- [ ] ERROR HANDLING
- [ ] AJUSTES FUTUROS
- [ ] PREFERENCIAS PERSISTENTES
- [ ] SINCRONIZACIÓN
- [ ] EVENT BUS
- [ ] DESACOPLAMIENTO
- [ ] TEST MODE
- [ ] PRUEBAS
- [ ] RENDIMIENTO
- [ ] ACCESIBILIDAD
- [ ] PRIVACIDAD
- [ ] SEGURIDAD FUTURA
- [ ] NO IMPLEMENTAR TODAVÍA
- [ ] CRITERIO DE FINALIZACIÓN
- [ ] INFORME FINAL
- [ ] Arquitectura elegida.
- [ ] Tecnología de audio utilizada y por qué.
- [ ] Archivos creados/modificados.
- [ ] Eventos soportados.
- [ ] Sistema de prioridades.
- [ ] Sistema de volumen.
- [ ] Sistema de fallback.
- [ ] Gestión de iOS/PWA.
- [ ] Preparación para sonidos personalizados.
- [ ] Pruebas realizadas.
- [ ] Problemas encontrados.
- [ ] Qué queda para la Fase 2.
- [ ] REGLA PRINCIPAL
- [ ] SISTEMA DE HITOS
- [ ] MÚLTIPLES TIPOS DE RACHA
- [ ] LOGROS
- [ ] LOGROS DESBLOQUEADOS
- [ ] NO REPETIR RECOMPENSAS
- [ ] HITO ≠ LOGRO
- [ ] PROGRESIÓN
- [ ] RÉCORD SUPERADO
- [ ] EVENTOS DE GAMIFICACIÓN
- [ ] RECOMPENSAS
- [ ] NIVELES
- [ ] PUNTOS / XP
- [ ] RACHAS ESPECIALES
- [ ] LOGROS OCULTOS
- [ ] ESTADOS
- [ ] PROGRESO HACIA LOGROS
- [ ] ESTADÍSTICAS
- [ ] CALENDARIO FUTURO
- [ ] RACHAS GLOBALES
- [ ] FILOSOFÍA DE GAMIFICACIÓN
- [ ] CELEBRACIONES
- [ ] PREPARACIÓN PARA SONIDOS
- [ ] PREPARACIÓN PARA NOTIFICACIONES
- [ ] ANTI-EXPLOIT
- [ ] RECÁLCULO
- [ ] MODELO DE DATOS
- [ ] TIPADO
- [ ] SERVICIO CENTRAL
- [ ] HOOK
- [ ] PRUEBAS OBLIGATORIAS
- [ ] Resume qué has implementado.
- [ ] Indica las tablas/migraciones nuevas.
- [ ] Indica los servicios/hooks.
- [ ] Indica los eventos creados.
- [ ] Indica los logros/hitos configurados.
- [ ] Indica las pruebas realizadas.
- [ ] Explica brevemente cualquier decisión arquitectónica importante.
- [ ] Indica qué queda para la Fase 4.

#### SR · Fase 5/5+4 — PRODUCCIÓN, INTEGRACIÓN Y TEST FINAL
- [ ] Implementa realmente todo lo correspondiente a esa fase.
- [ ] Comprueba que funciona.
- [ ] Comprueba que no has roto funcionalidades existentes.
- [ ] Explícame brevemente qué has hecho.
- [ ] Indica claramente:
- [ ] Analiza la arquitectura existente.
- [ ] Identifica cómo están organizados actualmente los módulos.
- [ ] No reemplaces funcionalidades existentes innecesariamente.
- [ ] No elimines código funcional.
- [ ] No cambies diseños que no estén relacionados con esta implementación.
- [ ] Mantén compatibilidad con los módulos existentes.
- [ ] Integra el sistema de sonido de forma modular.
- [ ] Qué has implementado.
- [ ] Qué archivos/componentes has creado o modificado.
- [ ] Qué has comprobado.
- [ ] Qué porcentaje llevamos.
- [ ] Qué fase toca después.
- [ ] OBJETIVO
- [ ] ESTRUCTURA DE ARCHIVOS
- [ ] NOMBRES DE ARCHIVO
- [ ] FORMATOS DE AUDIO
- [ ] CALIDAD
- [ ] OPTIMIZACIÓN
- [ ] PRELOAD
- [ ] CACHE
- [ ] SOUND ENGINE
- [ ] API DEL MOTOR
- [ ] HOOK DE REACT
- [ ] NO ACOPLAR UI Y AUDIO
- [ ] EVENT BUS
- [ ] ORDEN DE PROCESAMIENTO
- [ ] SISTEMA DE PRIORIDADES
- [ ] SISTEMA DE INTERRUPCIÓN
- [ ] SISTEMA DE SECUENCIAS
- [ ] RACHA + RECOMPENSA
- [ ] RÉCORD + MILESTONE
- [ ] MULTITAREA
- [ ] MODO SILENCIOSO
- [ ] HAPTICS INDEPENDIENTES
- [ ] CONTROL DE VOLUMEN
- [ ] AJUSTES
- [ ] PERFILES
- [ ] BOTONES DE PRUEBA
- [ ] INDICADOR DE VOLUMEN
- [ ] ACCESIBILIDAD
- [ ] PRIMERA INTERACCIÓN
- [ ] ERROR DE AUDIO
- [ ] FALLBACK
- [ ] TELEMETRÍA
- [ ] TEST AUTOMÁTICO
- [ ] TEST DE RACHA
- [ ] TEST DE RÉCORD
- [ ] TEST DE RACHA EN RIESGO
- [ ] TEST DE RECUPERACIÓN
- [ ] TEST DE MODO SILENCIOSO
- [ ] TEST DE HAPTICS
- [ ] TEST DE CAMBIO DE VOLUMEN
- [ ] TEST DE CAMBIO DE PERFIL
- [ ] TEST EN MÓVIL
- [ ] TEST DE AURICULARES
- [ ] TEST DE INTERRUPCIÓN
- [ ] TEST DE CARGA
- [ ] CRITERIO DE CALIDAD
- [ ] CONTROL DE VERSIONES
- [ ] SISTEMA DE REEMPLAZO
- [ ] CHECKLIST FINAL DE PRODUCCIÓN
- [ ] ARQUITECTURA FINAL
- [ ] RESULTADO
- [ ] ESTADO FINAL DEL SISTEMA DE SONIDO
