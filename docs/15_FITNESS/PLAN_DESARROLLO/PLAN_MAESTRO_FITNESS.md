# PLAN MAESTRO — FITNESS DE JOS STYLE (8 FASES)

> **Qué es este documento.** Las instrucciones de Josué para la reorganización de Fitness: la
> instrucción inicial de consolidación (§0) y los **ocho prompts**, del 1/8 al 8/8, completos. Se
> copiaron literalmente el 2026-11-03 y, ese mismo día, Josué fijó **cinco decisiones definitivas**
> (D-01 a D-05, Anexo E) que se han **incorporado al texto de cada prompt afectado**. Cada pasaje
> cambiado lleva su etiqueta `[D-0X]`, y su redacción original está en el **Anexo D**. El estado de
> cada fase vive en **`SEGUIMIENTO_FASES.md`** (misma carpeta).
>
> **Cómo se relaciona con el resto de la documentación**
> - **`docs/FITNESS_DOCUMENTO_MAESTRO.md`** es, por decisión de Josué, la referencia principal del
>   estado funcional y técnico de Fitness. Lo crea la **Fase 1**. Este plan y el seguimiento lo
>   complementan: el maestro manda sobre el **estado**; este plan, sobre los **requisitos**.
> - `docs/15_FITNESS/ARQUITECTURA_TECNICA.md` lo crea la **Fase 2** (prompt 2/8).
> - `docs/15_FITNESS/INFORME_AUDITORIA_FINAL.md` lo puede crear la **Fase 8** (prompt 8/8).
> - `docs/12_ENTREGA4_FITNESS_ORDEN.md` es **historia**: el índice de la Entrega 4 (FIT F1–F45, cerrada
>   en la v3.127.0). No se modifica.
> - ⚠️ El prefijo `15_` lo usan también `docs/15_ASISTENTES_MAESTRO.md` y `docs/15_asistentes/` (los
>   asistentes). No es el mismo proyecto: **`docs/15_FITNESS/` es solo de Fitness**, y así consta en
>   `docs/00_INDICE.md`. La ruta la fijó Josué y no se cambia.
>
> **Dónde vive:** rama `claude/fitness-rediseno`, creada desde `main` (`4881673`), en su propia copia de
> trabajo. **Nada de Imagen personal** (decisión D-01). Sin commit ni push hasta que Josué lo autorice.
>
> **Reglas de lectura**
> - El texto de §0 es literal. El de los prompts es el **vigente**: literal salvo los pasajes marcados
>   `[D-0X]`, que incorporan las decisiones del Anexo E.
> - Las contradicciones y su resolución están en `SEGUIMIENTO_FASES.md` → «Conflictos».

## Índice

0. Instrucción inicial — consolidación y almacenamiento del plan (literal)
1. Prompt 1/8 — Contexto general, auditoría técnica y documento maestro
2. Prompt 2/8 — Arquitectura técnica, modelo de datos y estrategia de migración
3. Prompt 3/8 — Biblioteca de rutinas, plantillas y planificación de entrenamientos
4. Prompt 4/8 — Motor de cumplimiento, descansos y recuperación de entrenamientos
5. Prompt 5/8 — Sistema de progresión: Manual, Progresivo y Experto
6. Prompt 6/8 — Sistema de anotaciones por ejercicio y consulta de notas anteriores
7. Prompt 7/8 — Historial, calendario de cumplimiento y estadísticas de evolución
8. Prompt 8/8 — Integración global, auditoría final y verificación completa
- Anexo A — Dependencias entre fases
- Anexo B — Notas de transcripción
- Anexo C — Contexto de las auditorías del 2026-11-02
- Anexo D — Texto original de los pasajes sustituidos
- Anexo E — Decisiones definitivas del 2026-11-03 (literal)

---

## 0 · INSTRUCCIÓN INICIAL (literal)

INSTRUCCIÓN INICIAL — CONSOLIDACIÓN Y ALMACENAMIENTO DEL PLAN FITNESS

Antes de ejecutar cualquiera de las ocho fases de desarrollo de Fitness de Jos Style, quiero que consolides y almacenes todas las instrucciones que te he proporcionado.

1. ALMACENAMIENTO PERMANENTE

Crea una carpeta específica:

docs/15_FITNESS/PLAN_DESARROLLO/

Dentro, crea un documento:

PLAN_MAESTRO_FITNESS.md

Este documento debe contener íntegramente los ocho prompts que te he proporcionado, del 1 al 8, respetando:

* Objetivos.
* Instrucciones.
* Requisitos funcionales.
* Decisiones de producto.
* Restricciones.
* Criterios de aceptación.
* Pruebas.
* Dependencias entre fases.

No resumas ni elimines requisitos para reducir su extensión.

Si ya existe documentación equivalente, intégrala sin duplicar información y conserva una referencia clara a los documentos originales.

2. SISTEMA DE SEGUIMIENTO

Crea también un documento:

SEGUIMIENTO_FASES.md

Debe incluir una tabla con las ocho fases y estos estados:

* No iniciada.
* En análisis.
* En desarrollo.
* En verificación.
* Completada.
* Bloqueada.

Para cada fase registra:

* Objetivo.
* Dependencias.
* Tareas realizadas.
* Archivos modificados.
* Pruebas ejecutadas.
* Resultado.
* Problemas encontrados.
* Decisiones pendientes.
* Fecha de actualización.

No marques ninguna fase como completada sin haber comprobado sus criterios de aceptación.

3. DOCUMENTO MAESTRO EXISTENTE

Respeta y utiliza:

docs/FITNESS_DOCUMENTO_MAESTRO.md

No lo sustituyas ni lo elimines.

Debe seguir siendo la referencia principal del estado funcional y técnico de Fitness.

Los nuevos documentos deben complementarlo, no crear sistemas de documentación contradictorios.

4. REGLAS DE CONTINUIDAD

Quiero poder trabajar contigo de forma sencilla.

Cuando te diga «sigue», debes:

1. Leer el plan maestro.
2. Leer el seguimiento.
3. Revisar el estado real del repositorio.
4. Identificar la primera fase pendiente.
5. Comprobar sus dependencias.
6. Continuar desde el punto exacto en el que se quedó el trabajo.

No debes volver a preguntarme cuestiones que ya estén resueltas en los documentos.

No debes repetir fases terminadas.

No debes asumir que una tarea está terminada porque aparezca marcada como completada si el código y las pruebas no lo demuestran.

Si encuentras contradicciones entre instrucciones, código y documentación, detente en esa decisión concreta, documenta el conflicto y no inventes una solución.

5. ORDEN DE TRABAJO

Respeta estrictamente el orden de las ocho fases.

No empieces una fase posterior si sus dependencias esenciales no están resueltas.

Puedes dividir internamente una fase en subtareas cuando sea necesario, pero no cambies su objetivo ni elimines requisitos.

No empieces a desarrollar directamente al recibir los ocho prompts.

Primero consolida la documentación y verifica que los ocho prompts están almacenados íntegramente.

Después, presenta un resumen de:

* Documentos creados o actualizados.
* Ubicación de cada documento.
* Confirmación de que están almacenados los ocho prompts.
* Estado inicial de las ocho fases.
* Problemas o contradicciones detectados.

6. AUTORIZACIÓN Y SEGURIDAD

En esta primera operación solamente autorizo:

* Crear y actualizar documentación.
* Organizar los ocho prompts.
* Crear el sistema de seguimiento.
* Consultar el estado del repositorio.

No autorizo todavía ejecutar las fases de desarrollo.

No modifiques código funcional.
No modifiques datos.
No ejecutes migraciones.
No modifiques Supabase.
No hagas commits.
No hagas push.
No fusiones ramas ni pull requests.
No publiques ni despliegues cambios.

Cuando termines esta consolidación documental, detente y espera mi siguiente instrucción.

La idea es que toda la planificación quede guardada en el propio repositorio y que no dependa de la memoria de esta conversación ni de la sesión de Claude Code.

---

## 1 · PROMPT 1/8 (texto vigente)

PROMPT 1/8 — FITNESS JOS STYLE
Contexto general, auditoría técnica y documento maestro
1. OBJETIVO
Vamos a realizar una reorganización funcional y técnica del módulo Fitness de Jos Style.
Este proyecto se desarrollará mediante varias fases consecutivas. Recibirás distintos documentos y especificaciones que, en conjunto, definirán todo el comportamiento esperado.
Tu primera tarea NO es implementar funcionalidades.
Tu objetivo es comprender el proyecto actual, contrastar las decisiones funcionales con el código existente y preparar una documentación maestra que permita desarrollar el proyecto posteriormente sin perder contexto ni depender de conversaciones anteriores.
2. REGLAS INNEGOCIABLES
* No modifiques funcionalidades ni lógica de la aplicación durante esta fase.
* No elimines, sustituyas ni reorganices archivos existentes.
* No modifiques datos de usuarios ni estructuras de Supabase.
* No realices migraciones.
* No crees commits ni hagas push.
* No fusiones ramas ni pull requests.
* No publiques ni despliegues cambios.
* No des por implementada ninguna funcionalidad por el simple hecho de que esté documentada.
* No inventes información sobre el estado del proyecto.
* Distingue siempre entre lo que existe, lo que está parcialmente implementado y lo que todavía no existe.
Esta primera fase es de análisis y documentación.
3. COMPRENSIÓN DEL PROYECTO
Examina el repositorio y comprende especialmente:
* Arquitectura general de Fitness.
* Estructura de carpetas y archivos.
* Motores de cálculo y lógica de negocio.
* Componentes visuales y navegación.
* Gestión de rutinas y plantillas.
* Gestión de sesiones y ejercicios.
* Sistema de progresión actual.
* Anotaciones.
* Historial y estadísticas.
* Persistencia de datos.
* Integración con Supabase.
* Pruebas automatizadas y herramientas de verificación.
* La función «Completar entrenamiento» de la PR #2 y su integración con el nuevo sistema. [D-03]
Utiliza las auditorías anteriores y la documentación existente cuando estén disponibles, pero comprueba cualquier dato importante directamente en el repositorio.
No repitas auditorías innecesarias si ya existe evidencia suficiente.
4. TERMINOLOGÍA OFICIAL
Utiliza siempre estas tres definiciones:
RUTINA: estructura de entrenamiento que organiza un ciclo de entre 1 y 30 días. Puede incluir días de entrenamiento y días de descanso. Al terminar el ciclo, vuelve automáticamente al día 1.
PLANTILLA: entrenamiento individual diseñado por el usuario, compuesto por ejercicios y sus correspondientes series.
SESIÓN: ejecución real de una plantilla. Representa lo que el usuario ha hecho, no lo que tenía previsto hacer.
No confundas estos tres conceptos en el código, la interfaz ni la documentación.
5. PRINCIPIOS DEL REDISEÑO
El nuevo Fitness deberá cumplir estos principios:
1. Interfaz intuitiva y orientativa, incluso para alguien que nunca haya utilizado la aplicación.
2. Una sola sesión como máximo por día.
3. Separación clara entre planificación, ejecución e historial.
4. Conservación de los registros históricos.
5. Progresión basada en la plantilla correspondiente, no únicamente en el ejercicio.
6. Sistema de cumplimiento centrado en la disciplina.
7. Libertad del usuario para elegir entre las recuperaciones permitidas.
8. Experiencia de entrenamiento actual conservada siempre que sea posible.
9. Lógica determinista, sin depender de una IA generativa para las operaciones esenciales.
10. Protección de los datos existentes durante cualquier futura migración.
11. Conservación de Fitness: no rehacerlo desde cero; conservar la estructura, las funcionalidades y el flujo de entrenamiento existentes siempre que sean compatibles con las mejoras aprobadas; reutilizar componentes y motores existentes; no eliminar funcionalidades útiles por simplificar la arquitectura; no duplicar pantallas ni sistemas; corregir los defectos que impidan el funcionamiento correcto. [D-04]
12. Imagen personal está terminado y es un trabajo separado: Fitness no depende de él, no lo reabre ni toca sus cambios ni su rama de respaldo. [D-01]
6. DOCUMENTO MAESTRO
Crea un documento específico dentro de docs/:
docs/FITNESS_DOCUMENTO_MAESTRO.md
Este archivo será la fuente principal de referencia para todo el desarrollo.
Debe contener:
* Objetivo general del rediseño.
* Terminología oficial.
* Decisiones funcionales confirmadas.
* Arquitectura actual verificada.
* Diferencias entre el estado actual y el estado deseado.
* Las ocho fases del proyecto.
* Estado de cada fase.
* Criterios de aceptación.
* Pruebas pendientes.
* Incidencias y decisiones todavía no resueltas.
* Registro de cambios realizados durante el proyecto.
No inventes las especificaciones que todavía no hayas recibido. Deja identificados los apartados pendientes de completar con los siguientes documentos.
7. SISTEMA DE SEGUIMIENTO
El documento maestro debe funcionar como memoria permanente del proyecto.
Cada vez que se complete una fase:
* Actualiza su estado.
* Registra los archivos modificados.
* Registra las pruebas ejecutadas y sus resultados.
* Identifica los problemas encontrados.
* Anota las decisiones tomadas.
* Indica qué queda pendiente.
* Identifica exactamente cuál es la siguiente fase.
Estados permitidos:
* No iniciada.
* En análisis.
* En desarrollo.
* En verificación. [D-05]
* Completada.
* Bloqueada.
Nunca marques una fase como completada si no cumple sus criterios de aceptación.
8. AUTONOMÍA DE TRABAJO
Cuando el usuario escriba «sigue», deberás:
1. Consultar el documento maestro.
2. Comprobar el estado real del repositorio.
3. Identificar la última fase completada.
4. Continuar desde la siguiente tarea pendiente.
5. Respetar las instrucciones y límites de esa fase.
6. Actualizar la documentación al terminar.
No vuelvas a preguntar cuestiones que ya estén resueltas en la documentación.
Si encuentras una contradicción entre una decisión funcional confirmada y el código existente, prevalece la especificación funcional. No cambies nada sin seguir las instrucciones de autorización.
Si existe una decisión verdaderamente imprescindible que no está resuelta, documenta el bloqueo y explica exactamente qué decisión falta. No inventes una respuesta.
9. ENTREGA DE ESTA FASE
Al terminar:
1. Presenta un resumen de la arquitectura actual.
2. Indica qué partes están implementadas y cuáles necesitan cambios.
3. Identifica riesgos técnicos y posibles pérdidas de datos.
4. Presenta el índice del documento maestro.
5. Indica qué información necesitas recibir en las siguientes fases.
6. Confirma que no has modificado código, datos, ramas ni publicado nada.
IMPORTANTE: En esta fase solo está autorizada la creación y actualización del documento maestro y de la documentación estrictamente necesaria para esta fase. No implementes funcionalidades.
No hagas commit ni push.
El resultado debe dejar preparado el terreno para que las siguientes fases puedan ejecutarse de manera autónoma y ordenada.

---

## 2 · PROMPT 2/8 (texto vigente)

PROMPT 2/8 — FITNESS JOS STYLE
Arquitectura técnica, modelo de datos y estrategia de migración
1. OBJETIVO
Diseñar la arquitectura técnica definitiva del nuevo módulo Fitness de Jos Style.
Esta fase debe convertir las decisiones funcionales del proyecto en un modelo técnico coherente, preparado para su implementación en las siguientes fases.
Debes estudiar la arquitectura real existente, detectar incompatibilidades y diseñar las estructuras necesarias para soportar:
* Rutinas cíclicas de 1 a 30 días.
* Biblioteca de plantillas individuales.
* Sesiones reales de entrenamiento.
* Recuperación de entrenamientos pendientes.
* Cumplimiento diario.
* Progresión en tres modos.
* Anotaciones por ejercicio.
* Historial y estadísticas.
* Eliminados recientemente.
* Conservación y migración de datos históricos.
No implementes todavía estas funcionalidades. Diseña y documenta cómo deben funcionar técnicamente.
2. DOCUMENTACIÓN OBLIGATORIA
Lee primero:
docs/FITNESS_DOCUMENTO_MAESTRO.md
Este documento es la referencia principal del proyecto.
Comprueba también el código y los documentos técnicos existentes. No des por válidas estructuras antiguas sin verificarlas.
Actualiza el documento maestro con el resultado de esta fase.
3. ARQUITECTURA CONCEPTUAL
La arquitectura debe separar estrictamente tres entidades:
A. Rutina
* Identificador estable.
* Nombre y metadatos.
* Duración de 1 a 30 días.
* Secuencia ordenada de días.
* Cada día debe estar configurado obligatoriamente como entrenamiento o descanso.
* Un día de entrenamiento referencia una plantilla individual.
* Una plantilla puede utilizarse en varios días de la misma rutina.
* Al terminar el último día, comienza un nuevo ciclo desde el día 1.
* Debe poder duplicarse, editarse, renombrarse, eliminarse y recuperarse.
* Las rutinas predeterminadas existentes se integran en este modelo conservando sus identificadores, sus días y sus ejercicios, sin pérdida de datos ni de funcionalidades. [D-05]
B. Plantilla
* Identificador estable.
* Nombre y metadatos.
* Lista ordenada de ejercicios.
* Series y objetivos configurables.
* Configuración individual de progresión por ejercicio.
* Anotaciones y referencias necesarias.
* Puede asignarse a varios días y rutinas.
* Debe poder duplicarse, editarse, eliminarse y recuperarse.
C. Sesión
* Representa una ejecución real.
* Conserva una fotografía inmutable de la plantilla utilizada.
* Guarda los ejercicios y series planificados.
* Guarda los ejercicios y series realmente ejecutados.
* Conserva fechas, resultados, anotaciones y datos de cumplimiento.
* No debe depender de que la plantilla original siga existiendo.
* Identifica si se completó mediante la función «Completar entrenamiento», sin inventar pesos, repeticiones ni resultados. [D-03]
4. MODELO DE DATOS
Diseña las estructuras necesarias para cada entidad.
Para cada campo especifica:
* Nombre.
* Tipo.
* Obligatorio u opcional.
* Función.
* Reglas de validación.
* Relaciones con otras entidades.
No introduzcas campos redundantes sin justificar su necesidad.
Analiza especialmente cómo resolver:
* Identificación de la rutina y del día concreto del ciclo.
* Identificación de la plantilla utilizada.
* Identificación estable de cada línea de ejercicio dentro de una plantilla.
* Relación entre una sesión y su día previsto.
* Relación entre una recuperación y el entrenamiento original pendiente.
* Identificación de la rutina de origen cuando se cambia de rutina activa.
* Conservación de registros históricos tras modificaciones o eliminaciones.
Los identificadores de los días y de las plantillas deben ser independientes. No reutilices un mismo identificador para representar conceptos diferentes.
5. CICLOS DE RUTINA
Define cómo se calcula el día actual de una rutina de duración variable.
Debe quedar especificado:
* Fecha de inicio del ciclo.
* Posición actual dentro del ciclo.
* Duración total.
* Cálculo del día correspondiente.
* Reinicio automático al terminar el ciclo.
* Comportamiento ante cambios de rutina.
* Comportamiento al editar la duración o el orden de una rutina.
No permitas que una modificación de la rutina altere retroactivamente las sesiones históricas.
Si una modificación puede afectar a días pendientes, define cómo se evita que se pierdan referencias o se asignen entrenamientos incorrectos.
6. CUMPLIMIENTO Y RECUPERACIONES
Diseña un motor independiente y determinista para calcular el cumplimiento.
Debe soportar:
* Últimos siete días naturales, como vista de seguimiento (no deciden la caducidad de los pendientes). [D-02]
* Entrenamientos completados.
* Entrenamientos parciales.
* Entrenamientos no realizados.
* Descansos respetados.
* Descansos sacrificados.
* Entrenamientos recuperados.
* Entrenamientos pendientes.
* Entrenamientos caducados.
* Recuperaciones que sustituyen al entrenamiento previsto para hoy.
Reglas confirmadas:
1. Un día de entrenamiento no realizado pasa a pendiente cuando termina ese día.
2. Un día de descanso respetado cuenta como cumplimiento.
3. Recuperar un entrenamiento durante un descanso sacrifica ese descanso.
4. Recuperar un entrenamiento en lugar del entrenamiento previsto para hoy deja pendiente el entrenamiento de hoy.
5. Un entrenamiento recuperado se vincula con su fecha original.
6. No se permite más de una sesión por día.
7. El sistema recomienda recuperar primero los entrenamientos pendientes más antiguos, pero permite elegir entre las opciones válidas.
8. Un pendiente caduca cuando se han realizado dos entrenamientos posteriores a su fecha prevista; hasta entonces puede recuperarse. No se usa una ventana fija de días naturales. [D-02]
9. Los pendientes pertenecientes a una rutina anterior solo se pueden recuperar cuando se vuelve a activar esa rutina original.
10. Cambiar de rutina no elimina el historial ni el progreso acumulado.
La regla de caducidad de la recuperación debe quedar modelada así: [D-02]
* Un entrenamiento perdido puede recuperarse mientras no se hayan realizado dos entrenamientos posteriores a su fecha prevista.
* Cuando se realizan dos entrenamientos posteriores, el entrenamiento perdido caduca y deja de ser recuperable.
* La caducidad depende del número de entrenamientos realizados, no del número de días naturales transcurridos.
* La regla se aplica de forma individual a cada entrenamiento pendiente.
* Los días de descanso no cuentan como entrenamientos realizados.
* Una recuperación realizada cuenta como entrenamiento realizado posterior para los pendientes de fechas anteriores (se desprende del ejemplo obligatorio de la decisión D-02).
* No se utiliza una ventana fija de siete días ni una regla basada exclusivamente en los descansos disponibles.
* El usuario puede elegir libremente entre las recuperaciones válidas.
* El sistema debe explicar qué entrenamientos siguen siendo recuperables, cuáles han caducado y las consecuencias de cada elección antes de ejecutarla.
No inventes una regla de caducidad diferente de la aprobada por el usuario. Si una secuencia no queda completamente determinada, documenta el caso como pendiente de resolución y no lo implementes por intuición.
7. ESTADOS DE CUMPLIMIENTO
Diseña una representación inequívoca de los estados:
* Verde: entrenamiento completado o descanso respetado.
* Amarillo verdoso: entrenamiento parcial.
* Rojo: entrenamiento perdido o descanso sacrificado.
* Futuro: todavía no evaluable.
* Pendiente: entrenamiento no realizado que aún puede recuperarse.
No confundas el estado de una fecha con el estado de una sesión.
Una fecha puede tener un registro de sesión parcial y un estado de cumplimiento diferente al de una sesión completada.
8. ELIMINADOS RECIENTEMENTE
Diseña un sistema común para eliminar y recuperar rutinas y plantillas.
Requisitos:
* La eliminación no borra las sesiones históricas.
* Los elementos eliminados se conservan temporalmente en Eliminados recientemente.
* Debe poder recuperarse un elemento eliminado.
* La recuperación debe restaurar sus datos y relaciones cuando sea posible.
* Si se elimina una plantilla asignada a la rutina activa, la aplicación debe pedir confirmación.
* Al confirmar, el día correspondiente se convierte automáticamente en descanso.
* El historial anterior de esa plantilla permanece intacto.
* El sistema debe evitar referencias rotas.
Define qué ocurre si se intenta recuperar una plantilla cuyo hueco en la rutina ya ha sido ocupado o si la rutina original también está eliminada.
Utiliza la política de la papelera general de Jos Style (Eliminados recientemente, `src/lib/papelera.js`: retención configurable, 30 días por defecto, borrado definitivo y vaciado con confirmación) siempre que sea compatible con estos requisitos. No inventes una política distinta: documenta cualquier incompatibilidad. [D-05]
9. PROGRESIÓN
Diseña el soporte técnico para tres modos:
Manual
* Sin recomendaciones automáticas de mejora.
Progresivo
* Propone objetivos de mejora cuando corresponda.
* No impone resultados.
Experto
* Permite objetivos de mejora por serie.
* Utiliza la última sesión comparable de la misma plantilla.
* Solo aplica a ejercicios que tengan activada la opción «Progresión».
La opción debe ser independiente por ejercicio y estar disponible en los modos Progresivo y Experto.
Los objetivos recomendados nunca deben sobrescribir los resultados realmente ejecutados.
Admite repeticiones enteras o terminadas en 0,5. No admitas otros decimales.
10. ANOTACIONES
Diseña un sistema de anotaciones por ejercicio y sesión.
Debe permitir:
* Escribir anotaciones durante una sesión.
* Guardar las anotaciones asociadas a esa ejecución.
* Consultar discretamente la anotación de la última ejecución de la misma plantilla.
* Consultar anotaciones anteriores mediante un apartado de historial.
* Conservarlas aunque se edite o elimine la plantilla.
Evita duplicar innecesariamente notas entre plantilla, ejercicio y sesión.
11. HISTORIAL Y ESCALABILIDAD
Diseña el almacenamiento para soportar muchos años de entrenamiento.
Compara:
* Mantener sesiones dentro del JSON actual de Fitness.
* Separar las sesiones en una tabla propia de Supabase.
* Otras alternativas razonables si existen.
Evalúa:
* Tamaño de datos.
* Frecuencia de escritura.
* Coste de lectura.
* Consultas históricas.
* Integridad.
* Sincronización entre dispositivos.
* Riesgos de concurrencia.
* Migraciones necesarias.
La restricción de una sesión por fecha debe poder garantizarse también en el servidor, no solamente ocultando botones en la interfaz.
Si el diseño exige modificaciones SQL, documenta el esquema y las restricciones necesarias. No ejecutes SQL ni modifiques Supabase.
12. MIGRACIÓN Y COMPATIBILIDAD
Diseña una estrategia de migración conservadora.
Debe preservar:
* Plantillas existentes.
* Sesiones anteriores.
* Ejercicios y sus identificadores.
* Series y resultados.
* Anotaciones.
* Historial.
* Referencias que puedan reconstruirse con seguridad.
* Rutinas predeterminadas existentes y sus identificadores. [D-05]
* Sesiones registradas con «Completar entrenamiento». [D-03]
Los datos antiguos ambiguos no deben asociarse arbitrariamente a nuevas rutinas o plantillas.
Define:
* Versionado de datos.
* Migraciones idempotentes.
* Validación previa.
* Copia de seguridad.
* Cuarentena de registros ambiguos.
* Recuperación ante errores.
* Compatibilidad con versiones anteriores durante la transición.
Nunca elimines datos antiguos para simplificar el nuevo modelo.
13. ENTREGABLES
Documenta el resultado en:
docs/15_FITNESS/ARQUITECTURA_TECNICA.md
Si el directorio no existe, puedes crearlo.
Actualiza también:
docs/FITNESS_DOCUMENTO_MAESTRO.md
Incluye diagramas de entidades y relaciones cuando ayuden a comprender la arquitectura.
Incluye una tabla que compare:
Área	Situación actual	Arquitectura propuesta	Cambios necesarios
Incluye también un apartado de decisiones pendientes, sin resolverlas unilateralmente.
14. RESTRICCIONES DE ESTA FASE
Esta fase es exclusivamente de diseño técnico y documentación.
No implementes funcionalidades. No modifiques lógica de negocio. No modifiques componentes visuales. No alteres datos. No ejecutes migraciones. No modifiques SQL ni Supabase. No crees commits. No hagas push. No fusiones ramas. No publiques cambios.
Solo puedes crear o actualizar los documentos expresamente autorizados en esta fase.
15. CRITERIOS DE FINALIZACIÓN
La fase estará completada únicamente cuando:
1. El modelo de datos esté definido.
2. Las tres entidades principales estén claramente separadas.
3. Las relaciones estén documentadas.
4. Los ciclos de rutina estén definidos.
5. El motor de cumplimiento y recuperación tenga sus reglas documentadas.
6. Los estados de cumplimiento estén diferenciados.
7. Eliminados recientemente esté diseñado.
8. La progresión esté contemplada.
9. Las anotaciones estén contempladas.
10. La estrategia de historial y escalabilidad esté evaluada.
11. La migración esté diseñada sin pérdida de datos.
12. Las decisiones pendientes estén identificadas.
13. El documento maestro esté actualizado.
Al terminar, presenta un resumen técnico y señala cualquier bloqueo que impida pasar a la fase 3.
No marques como resueltas las decisiones que todavía necesiten confirmación del usuario.

---

## 3 · PROMPT 3/8 (texto vigente)

PROMPT 3/8 — FITNESS JOS STYLE
Biblioteca de rutinas, plantillas y planificación de entrenamientos
1. OBJETIVO
Implementar el nuevo sistema de planificación de Fitness de Jos Style.
Esta fase debe permitir al usuario organizar sus entrenamientos mediante rutinas cíclicas de entre 1 y 30 días y una biblioteca independiente de plantillas individuales.
La experiencia debe ser intuitiva, visual y fácil de entender, incluso para una persona que entra por primera vez en Fitness.
No se trata simplemente de añadir formularios para crear rutinas: queremos un sistema de planificación bien organizado, con una biblioteca clara y una relación visual evidente entre las rutinas y las plantillas que utilizan.
2. DOCUMENTACIÓN Y CONTEXTO
Antes de modificar nada:
1. Lee docs/FITNESS_DOCUMENTO_MAESTRO.md.
2. Lee docs/15_FITNESS/ARQUITECTURA_TECNICA.md.
3. Comprueba el estado real del repositorio.
4. Comprueba las funcionalidades existentes y las pruebas disponibles.
5. Identifica las decisiones pendientes que afecten directamente a esta fase.
Si los documentos no existen o están incompletos, no inventes su contenido ni continúes como si estuvieran terminados.
Utiliza siempre la terminología oficial:
* Rutina: ciclo de entrenamiento de 1 a 30 días.
* Plantilla: entrenamiento individual diseñado.
* Sesión: ejecución real de una plantilla.
3. BIBLIOTECA DE RUTINAS
Crea una biblioteca donde el usuario pueda consultar y gestionar sus rutinas.
Debe permitir:
* Crear una rutina.
* Elegir su nombre.
* Elegir una duración entre 1 y 30 días.
* Consultar su estructura completa.
* Editarla.
* Renombrarla.
* Duplicarla.
* Eliminarla.
* Recuperarla desde Eliminados recientemente.
* Activarla como rutina actual.
Debe existir una única rutina activa a la vez.
Las demás permanecen guardadas en la biblioteca.
Las rutinas predeterminadas que ya existen en Jos Style deben integrarse en este sistema. No deben desaparecer ni perderse por el rediseño.
El usuario también debe poder eliminar las rutinas predeterminadas y recuperarlas desde Eliminados recientemente.
No conviertas automáticamente las rutinas predeterminadas en estructuras nuevas sin preservar sus identificadores y relaciones históricas cuando sean necesarios.
Las rutinas predeterminadas actuales (los 17 planes de 7 días) se conservan con sus identificadores, sus días y sus ejercicios; su integración no puede perder datos ni funcionalidades. [D-05]
4. CREACIÓN DE UNA RUTINA
Al crear una rutina, el usuario debe poder configurar su duración entre 1 y 30 días.
La rutina mostrará todos sus días desde el principio.
Cada día comenzará sin asignación y deberá configurarse obligatoriamente como una de estas dos opciones:
ENTRENAMIENTO
* Seleccionar una plantilla existente de la biblioteca.
* Crear una plantilla nueva.
* Asignar una plantilla ya utilizada en otro día.
DESCANSO
* Marcar el día como descanso.
No se puede guardar una rutina mientras queden días sin configurar.
No se deben crear días automáticamente como descanso para permitir guardar una rutina incompleta.
La interfaz debe explicar claramente qué significa cada opción.
5. ASIGNACIÓN DE PLANTILLAS
Una misma plantilla puede utilizarse tantas veces como se quiera dentro de una rutina.
Ejemplo:
Día	Asignación
1	Push
2	Pull
3	Descanso
4	Legs
5	Push
6	Pull
7	Descanso
No limites la asignación a una única utilización de cada plantilla.
Cada día de entrenamiento puede tener una sola plantilla.
No permitas asignar dos entrenamientos independientes al mismo día.
La filosofía del módulo es un máximo de una sesión diaria. Si el usuario quiere entrenar más ejercicios, debe ampliar su plantilla, no crear varios entrenamientos para una misma fecha.
6. CICLO AUTOMÁTICO
Una rutina debe repetirse automáticamente.
Ejemplo de una rutina de 10 días:
* Día 1 a día 10.
* Al terminar el día 10, vuelve al día 1.
* Comienza otro ciclo de 10 días.
* El comportamiento se repite indefinidamente mientras la rutina esté activa.
No confundas el número del día de la rutina con la fecha del calendario.
La posición dentro del ciclo debe calcularse mediante la lógica definida en la arquitectura técnica.
No reinicies el ciclo al cerrar y volver a abrir la aplicación.
No alteres las fechas históricas cuando se cambie o edite una rutina.
7. BIBLIOTECA DE PLANTILLAS
Implementa una biblioteca independiente para gestionar los entrenamientos individuales.
Debe incluir:
* Plantillas predeterminadas existentes (hoy son los días de las rutinas predeterminadas; cómo se convierten en plantillas sin perder identificadores lo define la Fase 2). [D-05]
* Plantillas creadas por el usuario.
* Plantillas duplicadas.
* Plantillas que estén siendo utilizadas por alguna rutina.
* Plantillas que no estén asignadas a ninguna rutina.
Cada plantilla debe poder:
* Crearse.
* Editarse.
* Renombrarse.
* Duplicarse.
* Eliminarse.
* Recuperarse.
Mantén la funcionalidad existente de edición de ejercicios, series, repeticiones, descansos y demás parámetros de las plantillas.
No elimines capacidades actuales que no entren en conflicto con las decisiones del rediseño.
8. IDENTIFICACIÓN VISUAL DE PLANTILLAS UTILIZADAS
Este requisito es especialmente importante.
Dentro de la biblioteca, las plantillas que estén asignadas a alguna rutina deben aparecer visualmente identificadas.
El usuario debe poder distinguir inmediatamente:
* Plantillas utilizadas en la rutina activa.
* Plantillas utilizadas en otras rutinas guardadas.
* Plantillas que no están asignadas.
La identificación debe ser discreta, clara y coherente con el diseño visual de Jos Style.
No conviertas toda la biblioteca en una pantalla llena de etiquetas.
Al abrir una plantilla, debe ser posible consultar en qué rutinas y días está utilizada.
No muestres relaciones incorrectas ni referencias obsoletas.
9. ELIMINAR PLANTILLAS
Cuando el usuario intente eliminar una plantilla que esté asignada a la rutina activa, muestra una confirmación específica.
El mensaje debe explicar que esa plantilla está siendo utilizada en la rutina activa.
Si el usuario confirma:
1. La plantilla se elimina de la biblioteca activa.
2. Se conserva en Eliminados recientemente.
3. Los días de la rutina activa que utilizaban esa plantilla se convierten automáticamente en días de descanso.
4. La rutina sigue siendo válida.
5. El historial de sesiones anteriores permanece intacto.
Si la plantilla está asignada a otras rutinas no activas, no alteres sus estructuras silenciosamente.
Define el comportamiento coherente para evitar referencias rotas y documenta cualquier limitación técnica.
La eliminación no debe borrar los ejercicios ni los resultados históricos de sesiones anteriores.
10. ELIMINADOS RECIENTEMENTE
Integra rutinas y plantillas con el sistema general de Eliminados recientemente de Jos Style, situado en Ajustes.
No crees un sistema aislado si ya existe una infraestructura general reutilizable.
Desde ese apartado el usuario debe poder:
* Consultar rutinas eliminadas.
* Consultar plantillas eliminadas.
* Identificar qué tipo de elemento está viendo.
* Recuperar un elemento.
* Consultar información suficiente para saber qué está recuperando.
La recuperación debe restaurar los datos del elemento.
Si la rutina original sigue existiendo y tiene un hueco disponible, conserva la posibilidad de restaurar sus relaciones cuando sea seguro.
Si el hueco ha sido ocupado, no sobrescribas una asignación posterior ni modifiques silenciosamente la rutina.
Si una plantilla se recupera después de que su rutina haya sido modificada, conserva la plantilla en la biblioteca sin crear relaciones incorrectas.
El comportamiento de borrado definitivo debe respetar la política general de Jos Style y la arquitectura aprobada.
11. ACTIVACIÓN Y CAMBIO DE RUTINA
Permite activar cualquier rutina válida de la biblioteca.
Al cambiar la rutina activa:
* La nueva rutina pasa a ser la referencia de la planificación futura.
* La rutina anterior permanece guardada.
* No se eliminan sesiones.
* No se elimina el progreso.
* No se modifica el historial.
* No se reasignan sesiones antiguas a la nueva rutina.
* No se deben recuperar automáticamente entrenamientos pendientes de una rutina distinta.
La gestión detallada de pendientes y recuperaciones se desarrollará en la fase 4.
Si el cambio de rutina afecta al ciclo, aplica la estrategia definida en la arquitectura y documenta cualquier limitación.
12. EXPERIENCIA VISUAL Y USABILIDAD
La interfaz debe sentirse como una parte natural de Jos Style.
Requisitos:
* Diseño móvil prioritario.
* Jerarquía visual clara.
* Acciones fáciles de localizar.
* Explicaciones breves cuando una función pueda resultar confusa.
* Estados vacíos útiles.
* Confirmaciones para acciones destructivas.
* Navegación sencilla entre rutinas y plantillas.
* No repetir información innecesariamente.
* No saturar las pantallas con botones, etiquetas o formularios.
La persona debe entender sin conocimientos previos:
* Qué es una rutina.
* Qué es una plantilla.
* Qué significa asignar una plantilla a un día.
* Qué significa descansar.
* Qué significa que una plantilla esté en uso.
Evita introducir gamificación, monedas, puntos o niveles.
13. CONSERVACIÓN DE LA EXPERIENCIA DE ENTRENAMIENTO
Esta fase afecta principalmente a la planificación y biblioteca.
No rediseñes la experiencia de ejecución de una sesión.
No modifiques innecesariamente:
* Temporizadores.
* Descansos entre series.
* Marcado de series.
* Ajuste de repeticiones.
* Ajuste de pesos.
* Sustitución de ejercicios.
* Finalización de sesiones.
* «Completar entrenamiento». [D-03]
Los cambios necesarios para conectar la nueva planificación con el sistema de ejecución deben ser mínimos y estar justificados.
14. PRUEBAS OBLIGATORIAS
Añade pruebas automatizadas para verificar, como mínimo:
Rutinas
* Crear una rutina de 1 día.
* Crear una rutina de 7 días.
* Crear una rutina de 30 días.
* Rechazar duraciones inferiores a 1 o superiores a 30.
* Impedir guardar rutinas incompletas.
* Repetir una plantilla en varios días.
* Marcar días como descanso.
* Duplicar y editar rutinas.
* Activar y cambiar rutinas.
* Comprobar el reinicio cíclico.
Plantillas
* Crear, editar y duplicar.
* Asignar a varios días.
* Identificar visualmente las asignadas.
* Eliminar una plantilla de la rutina activa.
* Comprobar la conversión automática de sus días a descanso.
* Conservar el historial anterior.
Eliminados recientemente
* Eliminar y recuperar rutinas.
* Eliminar y recuperar plantillas.
* Recuperar sin sobrescribir asignaciones posteriores.
* Evitar referencias rotas.
Integridad
* No duplicar sesiones.
* No perder identificadores históricos.
* No alterar sesiones anteriores al editar plantillas.
* No romper rutinas antiguas ni plantillas predeterminadas.
Ejecuta las pruebas pertinentes del proyecto y su verificación completa cuando sea viable.
No ocultes fallos ni rebajes pruebas existentes para conseguir resultados verdes.
15. DOCUMENTACIÓN Y SEGUIMIENTO
Actualiza:
docs/FITNESS_DOCUMENTO_MAESTRO.md
Registra:
* Funcionalidades implementadas.
* Archivos modificados.
* Cambios en el modelo de datos.
* Pruebas ejecutadas.
* Resultados.
* Problemas encontrados.
* Limitaciones.
* Decisiones pendientes.
* Estado de la fase.
Crea documentación técnica adicional únicamente si es necesaria para mantener el proyecto comprensible.
16. AUTONOMÍA Y LÍMITES
Trabaja de forma autónoma dentro del alcance de esta fase.
No detengas el trabajo para preguntar por decisiones que ya estén resueltas en el documento maestro.
Si encuentras una decisión verdaderamente imprescindible que no esté documentada, registra el bloqueo y no inventes una solución.
No empieces la fase 4 por iniciativa propia.
No hagas commits. No hagas push. No fusiones ramas ni pull requests. No publiques ni despliegues cambios.
Puedes modificar el código y las pruebas necesarias para completar esta fase, respetando el estado inicial del repositorio y sin sobrescribir trabajo ajeno.
17. CRITERIOS DE FINALIZACIÓN
La fase solo estará completada cuando:
1. La biblioteca de rutinas funcione.
2. Las rutinas admitan entre 1 y 30 días.
3. Los ciclos se repitan correctamente.
4. Todos los días deban configurarse.
5. Se puedan asignar y repetir plantillas.
6. La biblioteca de plantillas funcione.
7. Se identifiquen las plantillas utilizadas.
8. La eliminación de plantillas activas convierta sus días en descanso.
9. Eliminados recientemente permita recuperar elementos.
10. Se conserve el historial.
11. Se pueda cambiar de rutina sin perder progreso.
12. Las pruebas estén superadas.
13. La documentación maestra esté actualizada.
Al terminar, presenta un resumen claro del resultado, los archivos modificados, las pruebas y cualquier incidencia.
No marques la fase como completada si queda algún criterio sin verificar.

---

## 4 · PROMPT 4/8 (texto vigente)

PROMPT 4/8 — FITNESS JOS STYLE
Motor de cumplimiento, descansos y recuperación de entrenamientos
1. OBJETIVO
Implementar el sistema de disciplina y recuperación de Fitness de Jos Style.
El objetivo es que la aplicación gestione correctamente:
* Entrenamientos previstos.
* Entrenamientos realizados.
* Entrenamientos parciales.
* Entrenamientos pendientes.
* Entrenamientos recuperados.
* Entrenamientos perdidos definitivamente.
* Días de descanso respetados.
* Días de descanso sacrificados.
* Sustituciones del entrenamiento previsto para hoy.
Este sistema debe funcionar de forma determinista y coherente, sin depender de una IA generativa.
La disciplina es el criterio principal del sistema. No se trata de castigar al usuario por fallar un día, sino de mostrar de forma honesta qué ha cumplido, qué puede recuperar y qué ha perdido.
2. DOCUMENTACIÓN OBLIGATORIA
Antes de comenzar:
1. Lee docs/FITNESS_DOCUMENTO_MAESTRO.md.
2. Lee docs/15_FITNESS/ARQUITECTURA_TECNICA.md.
3. Comprueba los cambios reales de la fase 3.
4. Comprueba el estado del repositorio y las pruebas.
5. Identifica las reglas de recuperación confirmadas y cualquier decisión todavía pendiente.
No vuelvas a implementar la biblioteca ni las rutinas.
Utiliza las estructuras ya desarrolladas en la fase 3.
No inventes reglas que no estén confirmadas.
3. REGLAS FUNDAMENTALES
3.1. Ventana temporal
El seguimiento visual del cumplimiento muestra los últimos siete días naturales, incluyendo hoy. [D-02]
No utilices semanas fijas de lunes a domingo.
La ventana de siete días es una vista: no decide la caducidad de los pendientes, que sigue la regla del apartado 7. [D-02]
Las fechas futuras nunca deben marcarse como incumplidas.
Un entrenamiento previsto para hoy permanece como «Hoy» durante el día.
Si termina el día sin realizarse, pasa a pendiente cuando comienza el siguiente día natural.
3.2. Un entrenamiento por día
Solo se permite una sesión de entrenamiento por fecha.
Esta regla debe garantizarse en la lógica de negocio y en el servidor, no únicamente ocultando botones.
Si ya existe una sesión válida ese día, no se puede iniciar otra.
La función «Completar entrenamiento» también respeta esta regla: no puede crear una segunda sesión en una misma fecha. [D-03]
Las sesiones históricas que ya contengan más de un entrenamiento deben conservarse.
La nueva restricción se aplica a partir de la implantación del sistema.
3.3. Descansos
Un descanso respetado aparece en verde.
Un descanso utilizado para recuperar un entrenamiento pendiente aparece en rojo, porque se ha sacrificado ese descanso.
Entrenar libremente en un día de descanso también aparece en rojo en cuanto al cumplimiento del descanso.
La sesión libre debe conservarse en el historial y sus resultados deben registrarse normalmente.
Un día de descanso nunca se convierte en un entrenamiento pendiente por el simple hecho de no entrenar.
4. ESTADOS DEL ENTRENAMIENTO
Implementa estados claramente diferenciados:
* Previsto para hoy.
* Pendiente de recuperación.
* Recuperado.
* Completado (también mediante «Completar entrenamiento», identificado como tal). [D-03]
* Parcial.
* Perdido definitivamente.
* Sesión libre.
* Descanso respetado.
* Descanso sacrificado.
No confundas el estado de una sesión con el estado de cumplimiento de la fecha.
El sistema debe poder explicar por qué una fecha está verde, amarilla o roja.
5. GENERACIÓN DE ENTRENAMIENTOS PENDIENTES
Cuando un día de entrenamiento termina sin que se haya realizado:
1. Se registra como incumplido.
2. Pasa a estar pendiente si todavía puede recuperarse.
3. Se conserva su identidad original.
4. Se mantiene vinculada a la rutina, día del ciclo y plantilla que correspondían.
5. Aparece como opción de recuperación cuando sea válida.
Nunca conviertas un descanso no utilizado en un entrenamiento pendiente.
Nunca elimines automáticamente el historial de un entrenamiento perdido.
6. DOS FORMAS DE RECUPERACIÓN
El usuario puede recuperar un entrenamiento pendiente de dos formas.
A. Recuperar durante un día de descanso
Si hoy corresponde descansar y hay entrenamientos pendientes válidos:
* La aplicación debe informar de que puede recuperar uno.
* Debe indicar qué entrenamientos pendientes siguen siendo recuperables y cuál recomienda el sistema: el más antiguo, que es el más próximo a caducar. [D-05]
* También debe permitir consultar y elegir otros pendientes que sigan siendo recuperables según la regla de caducidad del apartado 7. [D-02]
* Si recupera uno, hoy queda marcado como descanso sacrificado y aparece en rojo.
* El entrenamiento original recuperado queda vinculado a su fecha original y aparece como cumplido.
Si el usuario decide no recuperar nada, el descanso se respeta.
B. Recuperar sustituyendo el entrenamiento de hoy
Si hoy corresponde entrenar y existe un entrenamiento pendiente válido:
* La aplicación ofrece realizar el entrenamiento previsto para hoy.
* También ofrece recuperar uno de los pendientes válidos.
* El usuario puede elegir libremente.
* Si recupera uno, el entrenamiento de hoy no se realiza y pasa a estar pendiente cuando termine el día, sometido a la misma regla de caducidad. [D-02]
* La sesión ejecutada se vincula al entrenamiento original recuperado.
* No se permite una segunda sesión ese mismo día.
El sistema debe explicar claramente qué entrenamiento se recupera y cuál queda pendiente.
7. CADUCIDAD DE LA RECUPERACIÓN [D-02]
Esta es la regla central del sistema y debe implementarse sin simplificaciones.
Un entrenamiento perdido puede recuperarse mientras no se hayan realizado dos entrenamientos posteriores a su fecha prevista.
Cuando se realizan dos entrenamientos posteriores, el entrenamiento perdido caduca y deja de ser recuperable.
La caducidad depende del número de entrenamientos realizados, no del número de días naturales transcurridos.
La regla se aplica de forma individual a cada entrenamiento pendiente.
Los días de descanso no cuentan como entrenamientos realizados.
No utilices una ventana fija de siete días ni una regla basada exclusivamente en los descansos disponibles.
Ejemplo obligatorio 1:
* Lunes: Push previsto, pero no realizado. Queda pendiente.
* Martes: Pull previsto, pero tampoco realizado. Queda pendiente.
* Miércoles: se recupera Pull.
* Jueves: Push todavía puede recuperarse, porque solamente se ha realizado un entrenamiento posterior a su fecha prevista.
* Si antes de recuperar Push se realizan dos entrenamientos posteriores a su fecha prevista, Push caduca.
Ejemplo obligatorio 2:
* Lunes: Push perdido.
* Martes: Pull realizado.
* Miércoles: Piernas realizado.
* Jueves: Push ya no se puede recuperar.
Como muestra el ejemplo 1, una recuperación realizada cuenta como entrenamiento realizado posterior para los pendientes de fechas anteriores.
La recuperación conserva siempre la fecha prevista original y registra la fecha real de ejecución.
Si se recupera un entrenamiento durante un día de descanso, ese descanso se considera sacrificado.
Si se recupera sustituyendo el entrenamiento previsto para hoy, el entrenamiento de hoy pasa a estar pendiente y queda sometido a la misma regla.
Libertad de elección
El sistema recomienda recuperar primero el entrenamiento más antiguo, que es el más próximo a caducar.
Sin embargo, el usuario puede elegir otro entrenamiento pendiente válido.
Cuando elegir uno implique que otro caduque, la interfaz debe explicarlo antes de confirmar.
No escondas las consecuencias de una elección.
El sistema debe explicar claramente qué entrenamientos siguen siendo recuperables y cuáles han caducado.
Cálculo obligatorio
Implementa un motor que evalúe:
* Antigüedad de cada entrenamiento pendiente.
* Fecha original prevista.
* Entrenamientos realizados después de cada fecha prevista, incluidas las recuperaciones.
* Entrenamientos que sustituyen a otros días.
* Entrenamientos que caducan.
* Consecuencias de cada posible elección.
No implementes una regla simplista basada en una ventana fija de días o en los descansos disponibles.
La lógica debe considerar la secuencia temporal completa.
Si existe una secuencia que no pueda resolverse inequívocamente a partir de las decisiones documentadas, detén esa parte y registra el caso como bloqueo. No inventes una política.
8. EJEMPLOS OBLIGATORIOS DE COMPORTAMIENTO
Implementa y prueba estos casos:
Caso 1. Un entrenamiento perdido y un descanso posterior
* Lunes: Push no realizado.
* Martes: Pull realizado.
* Miércoles: descanso.
* Miércoles se recupera Push.
Resultado:
* Lunes: verde por recuperación.
* Martes: verde por cumplimiento.
* Miércoles: rojo por descanso sacrificado.
Caso 2. Se sustituye el entrenamiento de hoy
* Lunes: Push no realizado.
* Martes: Pull previsto.
* Martes se recupera Push.
Resultado:
* Lunes: verde por recuperación.
* Martes: sesión Push registrada.
* Martes: Pull queda pendiente al terminar el día.
* Máximo una sesión.
Caso 3. Dos entrenamientos pendientes y dos descansos
* Lunes: Push perdido.
* Martes: Pull perdido.
* Miércoles: descanso.
* Jueves: descanso.
Debe permitir recuperar ambos en los dos descansos: al recuperar el primero, el otro solo tiene un entrenamiento posterior a su fecha prevista y sigue siendo recuperable. [D-02]
Caso 4. Tres pendientes y dos descansos
* Lunes: Push perdido.
* Martes: Pull perdido.
* Miércoles: Legs perdido.
* Jueves: descanso.
* Viernes: descanso.
Puede recuperar dos de ellos en los dos descansos. Tras la segunda recuperación, el que quede acumula dos entrenamientos posteriores a su fecha prevista y caduca, así que no es posible recuperar los tres. [D-02]
Debe recomendar primero el más antiguo y explicar las consecuencias de cada elección.
Caso 5. Recuperar el más reciente primero
Con tres pendientes y dos descansos, si el usuario elige primero el más reciente, el motor debe recalcular qué otros pendientes siguen siendo recuperables: los demás suman un entrenamiento posterior y siguen siéndolo hasta acumular dos. [D-02]
No debe aplicar una selección automática que contradiga la libertad del usuario.
Caso 6. Descanso respetado
Si existe un pendiente pero el usuario decide descansar, el descanso debe quedar verde.
Los pendientes siguen sujetos a sus reglas de caducidad; un descanso no cuenta como entrenamiento realizado. [D-02]
Caso 7. Entrenamiento libre en descanso
La sesión se registra, pero el descanso aparece rojo.
Caso 8. Segundo entrenamiento en la misma fecha
Debe impedirse, aunque el usuario intente iniciar otra sesión desde otra pantalla o dispositivo.
Caso 9. Cambio de rutina
Los pendientes de una rutina anterior no se pueden recuperar mientras esté activa otra rutina.
Si se vuelve a activar la rutina original y esos entrenamientos no han caducado (no se han realizado dos entrenamientos posteriores a su fecha prevista), pueden volver a recuperarse. [D-02]
Caso 10. Sesión parcial
Si se completan algunas series, pero no todas:
* La sesión queda registrada como parcial.
* La fecha aparece amarillo verdoso.
* No se considera un entrenamiento completamente cumplido.
Caso 11. Ninguna serie completada
Si no se completa ninguna serie:
* No se considera entrenamiento realizado.
* La fecha queda incumplida.
* El entrenamiento sigue las reglas de pendiente y recuperación.
Caso 12. Recuperar el más reciente y después el más antiguo [D-02]
* Lunes: Push no realizado.
* Martes: Pull no realizado.
* Miércoles: se recupera Pull.
* Jueves: Push sigue siendo recuperable (un solo entrenamiento posterior a su fecha prevista).
* Si antes de recuperar Push se realizan dos entrenamientos posteriores, Push caduca.
Caso 13. Caducidad por dos entrenamientos posteriores [D-02]
* Lunes: Push perdido.
* Martes: Pull realizado.
* Miércoles: Piernas realizado.
* Jueves: Push ya no se puede recuperar, y el sistema explica por qué.
Caso 14. Completar entrenamiento [D-03]
* El usuario utiliza «Completar entrenamiento».
* Se simula que se han completado todas las series y la sesión queda registrada como completa, no parcial.
* Cuenta como entrenamiento realizado a efectos de disciplina y de caducidad.
* No se inventan pesos, repeticiones ni resultados de rendimiento.
* Queda identificado que se completó mediante esta función.
* No puede crear una segunda sesión en la misma fecha.
9. SESIONES Y VINCULACIÓN HISTÓRICA
Cada sesión debe guardar claramente:
* Fecha real de ejecución.
* Fecha original prevista.
* Rutina de origen.
* Día del ciclo.
* Plantilla original.
* Tipo de cumplimiento: previsto, recuperación o libre.
* Identificador del entrenamiento original recuperado, si corresponde.
* Si se completó mediante «Completar entrenamiento». [D-03]
No reutilices identificadores de forma ambigua.
No alteres la fecha real de ejecución para hacer parecer que se entrenó en otro día.
Una recuperación conserva dos fechas diferentes:
1. Fecha en la que debía realizarse.
2. Fecha en la que realmente se realizó.
Ambas deben poder consultarse en el historial.
10. INTERFAZ DE RECUPERACIÓN
La experiencia debe ser clara y no intimidante.
Cuando exista una recuperación disponible, informa al usuario de:
* Qué entrenamiento está previsto hoy.
* Qué entrenamientos están pendientes.
* Cuáles siguen siendo recuperables.
* Cuál recomienda recuperar el sistema.
* Qué consecuencias tiene elegir cada uno.
* Qué entrenamientos se perderían si no se recuperan.
* Cuáles han caducado y por qué. [D-02]
No muestres información innecesaria cuando no haya pendientes.
En un día de descanso, la pantalla debe seguir transmitiendo que descansar es una opción válida.
No conviertas todos los descansos en una obligación de recuperar.
El usuario siempre puede respetar su descanso.
11. CALENDARIO Y COLORES
El motor debe proporcionar estados claros para el futuro calendario:
* Verde: entrenamiento completado o descanso respetado.
* Amarillo verdoso: entrenamiento parcial.
* Rojo: entrenamiento perdido o descanso sacrificado.
* Futuro: sin evaluar.
* Pendiente: disponible para recuperación.
Los colores deben derivarse de los estados reales, no calcularse independientemente en varios componentes.
La lógica de cumplimiento debe tener una única fuente de verdad.
12. ARQUITECTURA Y RENDIMIENTO
Implementa la lógica en motores independientes y testeables.
Evita introducir reglas complejas directamente en componentes visuales.
Las funciones principales deben ser puras siempre que sea posible.
Evita cálculos diferentes de recuperación entre la pantalla principal, el calendario y el historial.
La garantía de una sesión por fecha debe considerar concurrencia y sincronización con Supabase.
Si la arquitectura actual no permite garantizarla, implementa únicamente las partes seguras y documenta el bloqueo técnico. No afirmes que existe una garantía de servidor si solo se ha implementado en cliente.
13. PRUEBAS OBLIGATORIAS
Crea pruebas unitarias para:
* Cálculo de la ventana móvil de siete días.
* Cambio de fecha y finalización del día.
* Generación de pendientes.
* Caducidad por dos entrenamientos posteriores, individual por pendiente y sin ventana fija. [D-02]
* Varios pendientes y recuperaciones encadenadas, con los dos ejemplos obligatorios del apartado 7. [D-02]
* Selección del pendiente más antiguo.
* Elección de un pendiente más reciente.
* Recuperación en descanso.
* Recuperación sustituyendo el entrenamiento previsto.
* Cambio de rutina.
* Entrenamiento libre.
* Sesión parcial.
* Sesión sin series completadas.
* Prevención de sesiones duplicadas.
* «Completar entrenamiento»: sesión completa, sin resultados inventados y sin duplicar la fecha. [D-03]
* Diferencia entre fecha prevista y fecha real.
* Persistencia y sincronización.
Crea pruebas de integración para verificar que el comportamiento real de la aplicación coincide con el motor.
Incluye pruebas de secuencias largas y casos límite.
No elimines ni rebajes pruebas existentes para conseguir resultados verdes.
14. DOCUMENTACIÓN Y SEGUIMIENTO
Actualiza:
docs/FITNESS_DOCUMENTO_MAESTRO.md
Registra:
* Motor implementado.
* Reglas aplicadas.
* Decisiones pendientes.
* Casos de prueba.
* Resultados.
* Archivos modificados.
* Problemas detectados.
* Garantías reales de integridad.
* Estado de la fase.
Si la regla de caducidad de la recuperación requiere una decisión adicional, deja constancia del caso exacto y no lo resuelvas unilateralmente. [D-02]
15. AUTONOMÍA Y LÍMITES
Trabaja autónomamente dentro del alcance de esta fase.
No vuelvas a preguntar decisiones ya documentadas.
No empieces la fase 5.
No modifiques innecesariamente la biblioteca de rutinas o plantillas desarrollada en la fase 3.
No hagas commits. No hagas push. No fusiones ramas ni pull requests. No publiques ni despliegues cambios.
Puedes modificar código y pruebas necesarios para esta fase, respetando el trabajo existente.
16. CRITERIOS DE FINALIZACIÓN
La fase solo se podrá marcar como completada si:
1. Los entrenamientos pendientes se generan correctamente.
2. La ventana de seguimiento de siete días funciona. [D-02]
3. Los descansos se contabilizan correctamente.
4. Se pueden recuperar entrenamientos en días de descanso.
5. Se pueden recuperar sustituyendo el entrenamiento previsto.
6. La caducidad de la recuperación respeta la regla de los dos entrenamientos posteriores. [D-02]
7. Las elecciones muestran sus consecuencias.
8. Los entrenamientos caducados se identifican correctamente.
9. Los cambios de rutina no mezclan pendientes.
10. Las sesiones parciales se distinguen de las completas.
11. No se permiten sesiones duplicadas por fecha.
12. El calendario puede obtener estados coherentes.
13. «Completar entrenamiento» registra la sesión como completa, sin inventar resultados y sin duplicar la fecha. [D-03]
14. Las pruebas están superadas.
15. La documentación maestra está actualizada.
Al terminar, presenta un informe claro con los resultados y cualquier bloqueo.
No marques la fase como completada si existe una regla esencial sin resolver o verificar.

---

## 5 · PROMPT 5/8 (texto vigente)

PROMPT 5/8 — FITNESS JOS STYLE
Sistema de progresión: Manual, Progresivo y Experto
1. OBJETIVO
Implementar el sistema de progresión de Fitness de Jos Style.
El sistema debe ayudar al usuario a mejorar gradualmente en sus ejercicios, sin imponer aumentos de peso, repeticiones o rendimiento.
Debe contar con tres modos:
1. Manual.
2. Progresivo.
3. Experto.
La progresión debe ser independiente para cada ejercicio y respetar las series, repeticiones, cargas y características de cada plantilla.
Principio fundamental: la aplicación puede proponer objetivos, pero nunca debe falsificar ni modificar lo que el usuario realmente ha realizado.
2. DOCUMENTACIÓN Y REVISIÓN PREVIA
Antes de implementar:
1. Lee docs/FITNESS_DOCUMENTO_MAESTRO.md.
2. Lee docs/15_FITNESS/ARQUITECTURA_TECNICA.md.
3. Comprueba las fases 3 y 4 y sus cambios reales.
4. Inspecciona el motor de progresión existente y sus pruebas.
5. Identifica qué funciones pueden reutilizarse y cuáles deben corregirse.
Revisa especialmente:
* progresion.js.
* claseDe.
* compararSeries.
* mejorSerie.
* aparicionesDeEjercicio.
* anteriorComparable.
* compararApariciones.
* mejorHistorico.
* progresoDeEjercicio.
* comparacionEnSesion.
* primerRecordPersonal.
No dupliques motores ni crees una segunda fuente de verdad.
3. LOS TRES MODOS
3.1. Modo Manual
Es el modo más sencillo.
* No propone aumentos automáticos.
* No muestra objetivos de progresión.
* El usuario decide todos los pesos y repeticiones.
* La aplicación registra los resultados y conserva el historial.
* Las estadísticas siguen funcionando.
No debe existir ninguna intervención automática en el entrenamiento.
3.2. Modo Progresivo
La aplicación analiza las ejecuciones anteriores y propone pequeñas mejoras cuando tienen sentido.
* La mejora es una recomendación, no una obligación.
* El usuario decide si la acepta.
* La propuesta debe basarse en el historial del mismo ejercicio dentro de la misma plantilla.
* No debe recomendar aumentos sin datos suficientes.
* No debe aumentar automáticamente todas las series.
* Debe respetar el tipo de ejercicio y sus parámetros.
La aplicación debe poder recomendar mantener el rendimiento cuando no exista una mejora razonable.
3.3. Modo Experto
Es el modo más detallado.
La aplicación propone objetivos de mejora individualizados para cada serie.
Ejemplo:
Última ejecución:
* Serie 1: 10 repeticiones.
* Serie 2: 9 repeticiones.
* Serie 3: 8 repeticiones.
La nueva propuesta podría ser:
* Serie 1: 10,5.
* Serie 2: 9,5.
* Serie 3: 8,5.
Estos valores son ilustrativos. El motor debe calcular las propuestas reales según los datos disponibles y el tipo de ejercicio.
Cada serie debe poder progresar de forma independiente.
El usuario conserva siempre el control de los valores finales.
4. ACTIVACIÓN INDIVIDUAL DE LA PROGRESIÓN
En los modos Progresivo y Experto, cada ejercicio de una plantilla tendrá un pequeño interruptor para activar o desactivar la progresión.
El control debe ser discreto y no ocupar demasiado espacio.
Etiqueta provisional: «Progresión».
Comportamiento:
* Activado: el motor puede proponer mejoras.
* Desactivado: no se muestran recomendaciones para ese ejercicio.
* El estado se conserva al editar la plantilla.
* Cada ejercicio puede tener una configuración diferente.
* Duplicar una plantilla debe conservar la configuración de progresión de sus ejercicios.
En modo Manual no se utilizará este interruptor porque la progresión está desactivada globalmente.
No conviertas este control en una configuración complicada.
5. COMPARACIÓN CORRECTA
Esta regla es obligatoria:
La progresión debe comparar las ejecuciones del mismo ejercicio dentro de la misma plantilla individual.
No basta con que el nombre del ejercicio coincida.
Ejemplo:
* Plantilla Push A: Press banca.
* Plantilla Push B: Press banca.
Aunque ambos ejercicios tengan el mismo nombre, sus progresiones deben ser independientes.
Si se ejecuta Push A, el motor debe consultar la última ejecución válida de Press banca dentro de Push A.
No debe utilizar automáticamente el resultado de Push B.
La identidad de la línea del ejercicio debe utilizarse cuando exista.
Para sesiones antiguas que no tengan un identificador estable de línea, utiliza el mecanismo de compatibilidad documentado y evita asociaciones ambiguas.
Si no puede determinarse con seguridad la correspondencia, no inventes una comparación.
6. PROPUESTAS DE PROGRESIÓN
Las propuestas deben respetar:
* Historial de la misma plantilla.
* Número de series.
* Tipo de ejercicio.
* Peso o resistencia.
* Repeticiones.
* Tiempo, cuando corresponda.
* Características del ejercicio.
* Valores anteriores realmente realizados.
No mezcles ejercicios con unidades o métricas incompatibles.
No recomiendes aumentos arbitrarios.
Si los datos no permiten calcular una propuesta fiable, muestra el valor anterior como referencia o no propongas una mejora.
No confundas un récord histórico con el objetivo adecuado para la siguiente sesión.
7. REPRESENTACIÓN VISUAL DURANTE EL ENTRENAMIENTO
La recomendación debe aparecer integrada en el campo de repeticiones.
Diseño deseado:
* El valor recomendado aparece de fondo, en un verde muy suave.
* El valor introducido por el usuario aparece por encima.
* Una pequeña flecha ascendente puede indicar que existe una propuesta de mejora.
* Si el usuario introduce un valor propio, este tiene prioridad.
* Si supera el objetivo, se puede indicar discretamente que ha conseguido progresar.
La recomendación nunca debe parecer un valor ya realizado.
El usuario debe distinguir fácilmente:
1. Valor recomendado.
2. Valor que está introduciendo.
3. Valor finalmente registrado.
No bloquees el campo de entrada ni obligues a aceptar la recomendación.
Mantén el diseño móvil limpio y compacto.
8. REGLAS DE REPETICIONES
Se deben admitir:
* Números enteros.
* Incrementos de media repetición.
Ejemplos válidos: [D-05: lista corregida, ver Anexo B.1]
* 6.
* 6,5.
* 7.
* 7,5.
* 8.
No se deben admitir valores como 6,2 o 7,8.
Esta regla debe aplicarse coherentemente en:
* Plantillas.
* Edición de series.
* Entrenamiento en directo.
* Propuestas de progresión.
* Historial.
* Estadísticas.
* Importación y compatibilidad de datos.
No redondees silenciosamente valores introducidos.
Antes de modificar validaciones compartidas, identifica todas las dependencias y evita romper otros módulos.
9. RESPETO POR EL RENDIMIENTO REAL
El motor debe separar completamente:
* plan: lo que se propone realizar.
* hecho: lo que realmente se ha realizado.
Una recomendación nunca puede sobrescribir el resultado real.
Ejemplo:
La aplicación recomienda 10 repeticiones.
El usuario realiza 8.
Resultado:
* Plan: 10.
* Realizado: 8.
* Historial: 8.
No registres 10 como resultado.
No conviertas automáticamente una sesión incompleta en completa.
La única excepción es «Completar entrenamiento», que el usuario activa expresamente: la sesión queda completa sin inventar resultados, y esas series sin valores no se usan como referencia de progresión. [D-03]
Si el usuario no consigue mejorar, no debe recibir mensajes negativos ni penalizaciones.
Puede mostrarse un mensaje breve y natural, por ejemplo:
«No pasa nada. No todos los días se mejora. Lo importante es mantener la constancia».
No repitas mensajes motivacionales continuamente.
10. CAMBIOS EN LA PLANTILLA
La progresión debe seguir funcionando si el usuario:
* Cambia el nombre de una plantilla.
* Duplica una plantilla.
* Añade o elimina ejercicios.
* Cambia el orden de los ejercicios.
* Modifica el número de series.
* Cambia el peso o las repeticiones previstas.
Las comparaciones deben basarse en identidades estables, no únicamente en la posición del ejercicio.
Una duplicación debe generar una nueva identidad de plantilla.
La nueva plantilla no debe heredar automáticamente el historial de la original como si fueran ejecuciones propias.
El historial anterior debe seguir disponible.
11. EJERCICIOS CON MÉTRICAS DIFERENTES
Revisa los tipos de ejercicio existentes y adapta la progresión a sus unidades.
Por ejemplo:
* Ejercicios por repeticiones.
* Ejercicios con peso.
* Ejercicios con peso corporal.
* Ejercicios lastrados.
* Ejercicios por tiempo.
No apliques incrementos de repeticiones a ejercicios cuyo objetivo principal sea temporal.
No conviertas segundos en repeticiones ni mezcles métricas.
Si una categoría no dispone de una regla de progresión suficientemente fiable, documenta la limitación y evita ofrecer recomendaciones incorrectas.
12. HISTORIAL Y ESTADÍSTICAS
El sistema debe conservar las propuestas y los resultados reales de cada ejecución de forma que posteriormente se pueda analizar:
* Evolución del ejercicio.
* Mejoras conseguidas.
* Series que progresan.
* Series que mantienen rendimiento.
* Series que bajan temporalmente.
* Diferencias entre objetivo y resultado real.
No guardes recomendaciones como si fueran resultados históricos.
Evita duplicar datos que puedan derivarse de las sesiones.
13. PRUEBAS OBLIGATORIAS
Implementa pruebas para:
* Los tres modos.
* Activación y desactivación individual.
* Comparación dentro de la misma plantilla.
* Independencia entre plantillas diferentes.
* Correspondencia por identificador de línea.
* Compatibilidad con sesiones antiguas.
* Plantillas duplicadas.
* Ejercicios reordenados.
* Cambios en el número de series.
* Ejercicios con peso.
* Ejercicios por tiempo.
* Repeticiones enteras.
* Repeticiones de media unidad.
* Rechazo de otros decimales.
* Recomendación inferior al resultado real.
* Resultado inferior a la recomendación.
* Resultado superior a la recomendación.
* Ausencia de datos suficientes.
* Conservación de plan y hecho.
* Sesiones completadas con «Completar entrenamiento», que no tienen resultados que comparar. [D-03]
* No modificación de sesiones históricas.
Prueba también la interfaz móvil.
No elimines pruebas anteriores para conseguir resultados verdes.
14. INTEGRACIÓN CON EL ENTRENAMIENTO ACTUAL
El entrenamiento en directo ya tiene una estructura funcional.
Conserva, salvo necesidad justificada:
* Temporizadores.
* Descanso automático.
* Marcado de series.
* Edición de valores.
* Navegación entre ejercicios.
* Finalización.
* Guardado de sesión.
Integra las recomendaciones sin rehacer el flujo de entrenamiento.
No conviertas la pantalla en un panel de estadísticas.
La progresión debe ayudar mientras se entrena, no distraer.
15. DOCUMENTACIÓN Y SEGUIMIENTO
Actualiza:
docs/FITNESS_DOCUMENTO_MAESTRO.md
Registra:
* Funcionamiento de los tres modos.
* Reglas de cálculo.
* Correspondencia entre ejercicios y plantillas.
* Gestión de identificadores.
* Reglas de repeticiones.
* Integración visual.
* Pruebas.
* Limitaciones.
* Archivos modificados.
* Estado real de la fase.
16. LÍMITES DE AUTONOMÍA
Trabaja autónomamente dentro del alcance de esta fase.
No vuelvas a preguntar decisiones ya documentadas.
No empieces la fase 6.
No modifiques innecesariamente la lógica de recuperación de la fase 4.
No hagas commits. No hagas push. No fusiones ramas ni pull requests. No publiques ni despliegues cambios.
Puedes modificar el código y las pruebas necesarias para implementar esta fase.
17. CRITERIOS DE FINALIZACIÓN
La fase solo estará completa si:
1. Existen los tres modos.
2. Manual no propone progresión.
3. Progresivo ofrece recomendaciones no obligatorias.
4. Experto calcula objetivos por serie.
5. La progresión se puede desactivar por ejercicio.
6. Las comparaciones se realizan dentro de la misma plantilla.
7. Los ejercicios mantienen identidades estables.
8. Se admiten repeticiones enteras y medias.
9. Se rechazan otros decimales sin redondeo silencioso.
10. Las recomendaciones no modifican los resultados reales.
11. Los tipos de ejercicio se tratan correctamente.
12. La interfaz es clara y no interrumpe el entrenamiento.
13. El historial permanece íntegro.
14. Las pruebas están superadas.
15. La documentación maestra está actualizada.
Al terminar, presenta un informe con los resultados, las pruebas y cualquier limitación.
No marques la fase como completada si falta algún criterio esencial.

> **Nota de transcripción:** la lista de «Ejemplos válidos» del apartado 8 llegó con la numeración
> deformada; quedó corregida el 2026-11-03 (decisión D-05). El texto original está en el Anexo D.
---

## 6 · PROMPT 6/8 (texto vigente)

PROMPT 6/8 — FITNESS JOS STYLE
Sistema de anotaciones por ejercicio y consulta de notas anteriores
1. OBJETIVO
Implementar un sistema de anotaciones asociado a cada ejercicio durante una sesión de entrenamiento.
El usuario debe poder escribir observaciones sobre un ejercicio concreto y consultarlas posteriormente cuando vuelva a realizar ese ejercicio dentro de la misma plantilla.
El sistema debe permitir:
* Escribir anotaciones durante el entrenamiento.
* Guardarlas de forma segura.
* Consultar la anotación de la ejecución anterior.
* Consultar anotaciones más antiguas.
* Consultar las anotaciones desde el historial.
* Mantener las anotaciones aunque se editen o eliminen plantillas.
La experiencia debe ser discreta, rápida y especialmente cómoda desde el móvil.
Principio fundamental: las anotaciones pertenecen a una ejecución concreta de un ejercicio, no a la plantilla de forma permanente.
2. REVISIÓN PREVIA
Antes de implementar:
1. Lee docs/FITNESS_DOCUMENTO_MAESTRO.md.
2. Lee docs/15_FITNESS/ARQUITECTURA_TECNICA.md.
3. Comprueba los cambios reales de las fases 3, 4 y 5.
4. Inspecciona cómo se guardan actualmente las notas.
5. Identifica todos los componentes que muestran o editan anotaciones.
Revisa especialmente:
* sesion.notas.
* notaDeEjercicio.
* linea.notas.
* Las estructuras de instantáneas de sesión.
* El guardado automático.
* El historial de sesiones.
* La identidad de las líneas de ejercicios.
No elimines ni sobrescribas anotaciones antiguas.
3. MODELO DE ANOTACIONES
Cada anotación nueva debe quedar vinculada a:
* Identificador de sesión.
* Fecha real de ejecución.
* Identificador de plantilla de origen.
* Identificador estable de la línea del ejercicio, cuando exista.
* Identificador del ejercicio.
* Contenido de la anotación.
Las anotaciones deben conservarse como parte del historial de ejecución.
No deben depender de que la plantilla original siga existiendo.
Si el usuario elimina una plantilla o un ejercicio, las anotaciones históricas deben seguir disponibles.
No mezcles automáticamente anotaciones de ejercicios distintos solo porque compartan nombre.
4. ANOTACIÓN DURANTE EL ENTRENAMIENTO
En cada ejercicio de la sesión debe existir un campo sencillo para escribir una observación.
Características:
* Acceso rápido.
* Diseño compacto.
* Cómodo en móvil.
* Sin ocupar demasiado espacio cuando está vacío.
* Guardado automático seguro.
* Posibilidad de editar la anotación antes de finalizar la sesión.
La anotación debe asociarse al ejercicio concreto de esa ejecución.
No obligues a escribir nada.
Si el usuario deja el campo vacío, no generes una anotación artificial.
5. MOSTRAR LA ANOTACIÓN ANTERIOR
Cuando el usuario vuelva a iniciar una plantilla:
1. Busca la última ejecución válida de esa misma plantilla.
2. Identifica el ejercicio correspondiente mediante su identidad estable.
3. Recupera su anotación anterior, si existe.
4. Muéstrala discretamente como referencia.
5. Presenta un campo nuevo y vacío para la anotación actual.
Ejemplo:
Press banca
Nota anterior: «La última serie me costó bastante. Mejor descansar un poco más».
Nueva anotación: [Campo vacío para escribir]
La nota anterior es únicamente una referencia.
No debe copiarse automáticamente en la nueva sesión ni modificarse al escribir la anotación actual.
Si el ejercicio no tiene una nota anterior, no muestres un bloque vacío.
6. CONSULTA DE ANOTACIONES ANTIGUAS
Añade un control discreto de tres puntos (⋯) o una alternativa visual coherente con el diseño actual.
Al pulsarlo, el usuario podrá consultar las anotaciones anteriores de ese ejercicio.
Debe mostrar:
* Fecha de la sesión.
* Contenido de la anotación.
* Orden cronológico.
* Identificación de la plantilla cuando sea necesario distinguir ejecuciones.
La anotación más reciente debe aparecer primero.
No muestres todas las anotaciones permanentemente durante el entrenamiento.
La consulta de notas antiguas debe ser voluntaria.
7. HISTORIAL
Las anotaciones deben aparecer en el detalle histórico de cada sesión.
Al abrir una fecha y consultar un ejercicio, se deben poder ver:
* Series realizadas.
* Peso.
* Repeticiones.
* Resultado real.
* Anotación de esa ejecución.
Las anotaciones deben permanecer vinculadas a la sesión original aunque posteriormente se modifique la plantilla.
No muestres una nota actual como si fuera una nota histórica.
8. RELACIÓN CON LAS NOTAS EXISTENTES
Actualmente existen distintos sistemas de notas:
* Nota general de sesión: sesion.notas.
* Nota por ejercicio durante la sesión: notaDeEjercicio.
* Nota de línea en la plantilla: linea.notas.
Analiza su función antes de modificar nada.
La solución debe evitar duplicidades y conservar los datos.
Criterios:
Nota general de sesión
* Puede mantenerse para observaciones generales de toda la sesión.
* No debe sustituir las anotaciones individuales.
Nota por ejercicio
* Debe convertirse en el sistema principal de anotaciones históricas por ejercicio.
* Debe conservar su relación con la sesión y la línea correspondiente.
Nota de plantilla
* No debe confundirse con una anotación histórica.
* Si tiene una función útil como instrucción permanente del ejercicio, consérvala separada.
* No copies automáticamente notas de plantilla al historial como si fueran observaciones realizadas durante una sesión.
Si hay que migrar datos antiguos, define una estrategia que evite pérdidas y duplicados.
No borres datos originales hasta comprobar que la migración es correcta.
9. IDENTIDAD Y COMPATIBILIDAD
Utiliza identificadores estables de línea de ejercicio para vincular correctamente las anotaciones.
Si una plantilla contiene dos veces el mismo ejercicio, las anotaciones deben distinguir ambas líneas.
Si se cambia el orden de los ejercicios, las anotaciones anteriores deben seguir perteneciendo a la línea correcta.
Si se duplica una plantilla, la nueva plantilla tendrá su propia identidad.
Las anotaciones históricas de la plantilla original no deben aparecer automáticamente como ejecuciones anteriores de la duplicada.
Para sesiones antiguas sin identificadores estables, utiliza únicamente correspondencias fiables.
Si no es posible determinar la correspondencia, conserva la anotación histórica sin asignarla arbitrariamente.
10. GUARDADO Y SEGURIDAD
Comprueba que:
* Las notas se guardan sin necesidad de finalizar la sesión.
* Una interrupción de la aplicación no provoca pérdidas evitables.
* La sincronización no sobrescribe una anotación más reciente.
* Las notas de distintos ejercicios no se mezclan.
* La edición de una nota no altera sesiones anteriores.
* El guardado de la sesión conserva todas las anotaciones.
Evita crear registros duplicados por cada pulsación.
Utiliza el mecanismo de persistencia adecuado a la arquitectura actual.
11. DISEÑO Y EXPERIENCIA
El sistema debe ser visualmente ligero.
Prioridades:
1. El usuario ve el ejercicio y sus series.
2. Puede consultar la nota anterior sin esfuerzo.
3. Puede escribir una nota nueva rápidamente.
4. Puede consultar notas antiguas cuando lo necesite.
No conviertas las anotaciones en un diario independiente.
No añadas pantallas innecesarias.
No llenes el entrenamiento de tarjetas o avisos.
Mantén el flujo actual de ejecución y descanso.
12. PRUEBAS OBLIGATORIAS
Implementa pruebas para:
* Crear una anotación por ejercicio.
* Editar una anotación.
* Guardado automático.
* Recuperar la nota de la última ejecución.
* Mostrar un campo nuevo y vacío.
* Consultar anotaciones anteriores.
* Orden cronológico.
* Dos líneas con el mismo ejercicio.
* Ejercicios reordenados.
* Plantillas duplicadas.
* Plantillas eliminadas.
* Sesiones históricas.
* Sesiones antiguas sin identificador de línea.
* Notas generales de sesión.
* Notas permanentes de plantilla.
* Migración de anotaciones existentes.
* Sincronización.
* Prevención de duplicados.
* Conservación de anotaciones al finalizar.
Prueba también la interfaz móvil y el comportamiento al interrumpir una sesión.
No elimines ni rebajes pruebas existentes para obtener resultados verdes.
13. DOCUMENTACIÓN
Actualiza:
docs/FITNESS_DOCUMENTO_MAESTRO.md
Registra:
* Modelo definitivo de anotaciones.
* Relación entre sesión, plantilla y ejercicio.
* Diferencias entre notas de sesión, ejercicio y plantilla.
* Estrategia de migración.
* Comportamiento visual.
* Pruebas realizadas.
* Limitaciones.
* Archivos modificados.
* Estado de la fase.
14. LÍMITES DE AUTONOMÍA
Trabaja autónomamente dentro del alcance de esta fase.
No vuelvas a preguntar decisiones ya documentadas.
No empieces la fase 7.
No rehagas el flujo de entrenamiento en directo.
No modifiques innecesariamente los motores de recuperación o progresión.
No hagas commits. No hagas push. No fusiones ramas ni pull requests. No publiques ni despliegues cambios.
Puedes modificar código, pruebas y documentación necesarios para completar esta fase.
15. CRITERIOS DE FINALIZACIÓN
La fase solo estará completa si:
1. Cada ejercicio permite añadir anotaciones.
2. Las anotaciones quedan vinculadas a su ejecución.
3. Se guardan correctamente.
4. Se muestra la nota de la ejecución anterior.
5. La nueva anotación empieza vacía.
6. Se pueden consultar notas más antiguas.
7. El historial muestra las anotaciones correctas.
8. Las plantillas duplicadas no mezclan historiales.
9. Las líneas repetidas se distinguen correctamente.
10. Las anotaciones antiguas se conservan.
11. No se confunden notas de plantilla y notas históricas.
12. La interfaz sigue siendo compacta.
13. Las pruebas están superadas.
14. La documentación maestra está actualizada.
Al terminar, presenta un informe con los resultados, pruebas y posibles limitaciones.
No marques la fase como completada si falta algún criterio esencial.

---

## 7 · PROMPT 7/8 (texto vigente)

PROMPT 7/8 — FITNESS JOS STYLE
Historial, calendario de cumplimiento y estadísticas de evolución
1. OBJETIVO
Desarrollar y consolidar el sistema de historial y estadísticas de Fitness.
Debe permitir consultar de forma sencilla:
* Qué entrenamientos se han realizado.
* Qué entrenamientos se han perdido.
* Qué entrenamientos se han recuperado.
* Qué descansos se han respetado.
* Qué descansos se han sacrificado.
* Cómo evoluciona el rendimiento de cada ejercicio.
* Cómo ha evolucionado la disciplina a lo largo del tiempo.
Prioridad principal: disciplina y constancia.
La aplicación no debe valorar únicamente los récords personales, los pesos levantados o el volumen de entrenamiento. Debe mostrar primero si el usuario está cumpliendo la planificación que ha diseñado.
2. REVISIÓN PREVIA
Antes de comenzar:
1. Lee docs/FITNESS_DOCUMENTO_MAESTRO.md.
2. Lee docs/15_FITNESS/ARQUITECTURA_TECNICA.md.
3. Comprueba los cambios reales de las fases 3, 4, 5 y 6.
4. Inspecciona el historial, calendario y estadísticas existentes.
5. Identifica qué componentes y motores pueden reutilizarse.
Revisa especialmente:
* Historial de sesiones.
* Calendario mensual.
* Resumen de progreso.
* Gráficas de ejercicios.
* Estadísticas derivadas de sesiones.
* Motor de cumplimiento.
* Motor de progresión.
* Anotaciones históricas.
No construyas pantallas duplicadas si ya existen vistas que pueden ampliarse.
3. ESTRUCTURA GENERAL
Mantén una estructura sencilla:
A. Calendario mensual
* Vista principal del historial.
* Permite identificar rápidamente cómo ha ido cada día.
B. Detalle de una fecha
* Muestra lo ocurrido ese día.
* Permite consultar ejercicios, series, resultados y anotaciones.
C. Historial por plantilla
* Permite revisar las ejecuciones de una plantilla concreta.
D. Evolución de ejercicios
* Muestra la progresión de un ejercicio a lo largo del tiempo.
* Permite analizar los resultados de cada plantilla de forma independiente.
No añadas secciones innecesarias ni repitas la misma información en diferentes pantallas.
4. CALENDARIO MENSUAL
El calendario debe ser la vista principal del historial.
Cada día debe mostrar un estado visual coherente con el motor de cumplimiento de la fase 4.
Colores:
* Verde: entrenamiento completado o descanso respetado.
* Amarillo verdoso: entrenamiento parcial.
* Rojo: entrenamiento perdido o descanso sacrificado.
* Sin evaluar: fechas futuras.
* Pendiente: indicador adicional cuando exista un entrenamiento recuperable.
El estado debe derivarse del motor de cumplimiento.
No calcules los colores por separado dentro del componente del calendario.
Comportamiento
* Navegar entre meses.
* Identificar el día actual.
* Consultar el estado de cada fecha.
* Distinguir días de entrenamiento y descanso.
* Identificar recuperaciones.
* Consultar días pendientes cuando corresponda.
No marques fechas futuras como incumplidas.
Los días anteriores a la existencia de una rutina o de datos fiables deben aparecer como no evaluados, no como días incumplidos.
5. DETALLE DE UNA FECHA
Al pulsar un día del calendario, debe abrirse el detalle correspondiente.
Si existe una sesión, mostrar:
* Nombre de la plantilla.
* Rutina de origen.
* Fecha prevista.
* Fecha real de ejecución.
* Tipo de sesión: prevista, recuperación o libre.
* Estado de cumplimiento.
* Ejercicios realizados.
* Series.
* Repeticiones.
* Pesos.
* Resultados.
* Anotaciones por ejercicio.
* Observaciones generales de la sesión, si existen.
* Si se completó mediante «Completar entrenamiento»: se indica y no se muestran resultados inventados. [D-03]
Si se trata de una recuperación, debe quedar claro qué día se estaba recuperando.
Si se trata de un descanso respetado, mostrarlo de forma sencilla.
Si se trata de un descanso sacrificado, explicar por qué aparece como incumplido.
Si el entrenamiento fue parcial, mostrar qué se completó y qué quedó sin completar.
No inventes sesiones para fechas sin registros.
6. HISTORIAL POR PLANTILLA
Debe existir una forma sencilla de consultar todas las ejecuciones de una plantilla.
Mostrar:
* Nombre de la plantilla.
* Fecha de cada ejecución.
* Tipo de ejecución.
* Estado de cumplimiento.
* Resultado general.
* Acceso al detalle completo.
Las ejecuciones deben aparecer en orden cronológico inverso, con la más reciente primero.
No mezcles ejecuciones de plantillas distintas aunque utilicen ejercicios con el mismo nombre.
Las plantillas duplicadas deben conservar historiales independientes.
Si una plantilla se elimina, sus sesiones históricas deben seguir siendo consultables.
7. EVOLUCIÓN POR EJERCICIO
Desarrolla o consolida las gráficas de evolución.
El usuario debe poder consultar la evolución de cada ejercicio a lo largo del tiempo.
Cuando existan datos suficientes, mostrar:
* Evolución de carga.
* Evolución de repeticiones.
* Evolución por serie.
* Mejores resultados.
* Comparación entre ejecuciones.
* Evolución temporal.
Respeta las unidades y características del ejercicio.
No mezcles en una misma gráfica datos incompatibles.
Cuando un ejercicio aparezca en varias plantillas, permite distinguir las evoluciones por plantilla.
La comparación general del ejercicio puede existir como vista complementaria, pero no debe sustituir la comparación específica de cada plantilla utilizada por el motor de progresión.
No dibujes gráficas engañosas cuando falten datos.
Indica claramente cuándo una serie de datos es insuficiente.
8. ESTADÍSTICAS DE DISCIPLINA
Esta sección tiene prioridad sobre las estadísticas de rendimiento.
Desarrolla indicadores que ayuden a comprender la constancia.
Indicadores principales:
* Entrenamientos previstos.
* Entrenamientos completados.
* Entrenamientos parciales.
* Entrenamientos perdidos (caducados: ya no recuperables). [D-02]
* Entrenamientos recuperados.
* Descansos respetados.
* Descansos sacrificados.
* Porcentaje de cumplimiento.
Los entrenamientos completados mediante «Completar entrenamiento» cuentan como completados. [D-03]
* Regularidad durante el periodo.
Evita contar una recuperación como si el entrenamiento se hubiera realizado en su fecha original.
Distingue entre:
* Cumplir en la fecha prevista.
* Recuperar un entrenamiento.
* No cumplir el entrenamiento.
* Respetar el descanso.
El porcentaje de cumplimiento debe tener una fórmula documentada y coherente con los estados reales.
No incluyas fechas futuras ni fechas sin evaluación en el denominador.
No penalices los días que no estaban planificados para entrenar.
No cuentes dos veces una recuperación.
9. PERIODOS DE ANÁLISIS
Permite consultar estadísticas por periodos útiles:
* Últimos siete días.
* Últimos treinta días.
* Mes actual.
* Mes anterior.
* Periodo personalizado, si encaja con la arquitectura actual.
Los periodos deben utilizar fechas naturales y límites claramente definidos.
No confundas los últimos siete días móviles con una semana fija de lunes a domingo.
Los resultados deben ser consistentes aunque el usuario cambie de mes o de rutina.
10. RACHAS Y CONSTANCIA
Puedes mostrar rachas y continuidad cuando aporten información útil.
Pero:
* No conviertas Fitness en un sistema de puntos.
* No añadas monedas, niveles ni recompensas.
* No castigues visualmente al usuario.
* No presentes una racha como indicador absoluto de progreso.
La regularidad debe entenderse teniendo en cuenta los descansos planificados.
Un descanso respetado forma parte de la disciplina.
No debe romper una racha de cumplimiento.
11. INTEGRIDAD DEL HISTORIAL
El historial debe conservar la realidad de lo que sucedió.
Reglas:
1. Editar una plantilla no modifica sesiones anteriores.
2. Eliminar una plantilla no elimina su historial.
3. Cambiar de rutina no reasigna sesiones antiguas.
4. Recuperar un entrenamiento conserva su fecha original prevista y su fecha real.
5. Una sesión parcial no se convierte en completa.
6. Una sesión libre no se convierte en entrenamiento planificado.
7. Las anotaciones históricas permanecen vinculadas a sus sesiones.
8. Los cambios de progresión no alteran resultados pasados.
No reconstruyas datos históricos con suposiciones.
Las sesiones antiguas ambiguas deben conservarse como históricas sin asignaciones inventadas.
12. ALMACENAMIENTO Y ESCALABILIDAD
Revisa el tamaño y el comportamiento del almacenamiento histórico.
La arquitectura actual puede almacenar Fitness dentro de un único objeto JSON en app_data, lo que puede provocar que cada guardado reescriba una cantidad creciente de información.
Evalúa si el sistema necesita almacenamiento separado para sesiones.
Si la fase 2 definió una arquitectura de persistencia escalable, respétala.
No vuelvas a diseñar el almacenamiento sin justificación.
Si para garantizar el rendimiento se necesita una migración SQL o una modificación remota de Supabase que no esté expresamente autorizada, prepara el diseño y las pruebas locales, pero no ejecutes cambios remotos.
No elimines ni migres datos reales sin autorización explícita.
13. RENDIMIENTO Y EXPERIENCIA MÓVIL
El historial debe seguir funcionando cuando existan cientos o miles de sesiones.
Evita cargar todo el historial innecesariamente en cada pantalla.
Utiliza paginación, consultas acotadas o agregaciones cuando corresponda.
Las gráficas deben poder mostrarse en móvil sin perder legibilidad.
El calendario debe seguir siendo rápido.
No llenes la portada de estadísticas.
Prioriza una jerarquía visual clara:
1. Disciplina.
2. Historial.
3. Evolución del rendimiento.
4. Información secundaria.
14. PRUEBAS OBLIGATORIAS
Implementa pruebas para:
* Estados del calendario.
* Días futuros.
* Días sin datos.
* Descansos respetados.
* Descansos sacrificados.
* Entrenamientos completos.
* Entrenamientos parciales.
* Entrenamientos perdidos.
* Recuperaciones.
* Caducidad de los pendientes (dos entrenamientos posteriores). [D-02]
* Sesiones completadas con «Completar entrenamiento». [D-03]
* Diferencia entre fecha prevista y real.
* Porcentajes de cumplimiento.
* Periodos móviles de siete días.
* Periodos de treinta días.
* Cambio de mes.
* Historial por plantilla.
* Plantillas duplicadas.
* Plantillas eliminadas.
* Anotaciones históricas.
* Evolución por ejercicio.
* Ejercicios en varias plantillas.
* Datos insuficientes para gráficas.
* Compatibilidad con sesiones antiguas.
* Grandes volúmenes de sesiones.
* Rendimiento en móvil.
Comprueba que ninguna estadística contradiga el motor de cumplimiento.
No elimines ni rebajes pruebas existentes para obtener resultados verdes.
15. DOCUMENTACIÓN Y SEGUIMIENTO
Actualiza:
docs/FITNESS_DOCUMENTO_MAESTRO.md
Registra:
* Estructura del historial.
* Funcionamiento del calendario.
* Fórmulas de disciplina.
* Definición de periodos.
* Indicadores.
* Gráficas disponibles.
* Estrategia de almacenamiento.
* Compatibilidad histórica.
* Pruebas realizadas.
* Limitaciones.
* Archivos modificados.
* Estado de la fase.
16. LÍMITES DE AUTONOMÍA
Trabaja autónomamente dentro del alcance de esta fase.
No vuelvas a preguntar decisiones ya documentadas.
No empieces la fase 8.
No rehagas los motores de las fases anteriores salvo que encuentres un defecto que impida la integración. En ese caso, documenta el problema y realiza únicamente la corrección necesaria y justificada.
No ejecutes migraciones remotas ni alteres datos reales sin autorización explícita.
No hagas commits. No hagas push. No fusiones ramas ni pull requests. No publiques ni despliegues cambios.
17. CRITERIOS DE FINALIZACIÓN
La fase solo estará completa si:
1. El calendario refleja correctamente el cumplimiento.
2. El detalle de cada fecha es completo y fiable.
3. Existe historial por plantilla.
4. La evolución por ejercicio funciona.
5. Las gráficas distinguen plantillas cuando corresponde.
6. Las estadísticas priorizan la disciplina.
7. Los porcentajes utilizan una fórmula coherente.
8. Los periodos temporales funcionan correctamente.
9. Las rachas respetan los días de descanso.
10. Las recuperaciones no duplican resultados.
11. Las sesiones históricas permanecen intactas.
12. El sistema puede escalar a grandes historiales.
13. La interfaz móvil funciona correctamente.
14. Las pruebas están superadas.
15. La documentación maestra está actualizada.
Al terminar, presenta un informe claro con los resultados, las pruebas, las limitaciones y cualquier decisión pendiente.
No marques la fase como completada si falta algún criterio esencial.

---

## 8 · PROMPT 8/8 (texto vigente)

PROMPT 8/8 — FITNESS JOS STYLE
Integración global, auditoría final y verificación completa
1. OBJETIVO
Completar el desarrollo de Fitness de Jos Style mediante una auditoría integral de todas las fases anteriores.
El objetivo es garantizar que todos los sistemas funcionen conjuntamente, que los datos sean coherentes, que no existan contradicciones entre motores y que la experiencia de usuario sea clara y estable.
Esta fase debe cerrar el proyecto funcional de Fitness.
No se trata de añadir funcionalidades nuevas ni de ampliar el alcance.
Se trata de comprobar que todo lo desarrollado funciona correctamente en conjunto.
2. DOCUMENTACIÓN OBLIGATORIA
Antes de comenzar:
1. Lee íntegramente docs/FITNESS_DOCUMENTO_MAESTRO.md.
2. Lee docs/15_FITNESS/ARQUITECTURA_TECNICA.md.
3. Lee la documentación adicional creada durante las fases anteriores.
4. Inspecciona el código real y el estado actual del repositorio.
5. Comprueba qué fases están realmente terminadas.
6. Identifica las decisiones pendientes, limitaciones y problemas conocidos.
No des por completada ninguna fase únicamente porque la documentación diga que está terminada.
Comprueba su implementación real.
3. AUDITORÍA DE LAS OCHO FASES
Verifica individualmente:
Fase 1. Contexto y documentación
* Documento maestro.
* Inventario de funcionalidades.
* Decisiones de producto.
* Registro de fases y dependencias.
Fase 2. Arquitectura técnica
* Modelo de datos.
* Identidades.
* Persistencia.
* Migraciones.
* Compatibilidad histórica.
* Escalabilidad.
Fase 3. Rutinas y plantillas
* Biblioteca de rutinas.
* Ciclos de 1 a 30 días.
* Asignación de plantillas.
* Días de descanso.
* Edición, duplicación y eliminación.
* Eliminados recientemente.
* Cambio de rutina activa.
Fase 4. Recuperaciones y disciplina
* Entrenamientos pendientes.
* Recuperaciones encadenadas y libertad de elección. [D-02]
* Caducidad por dos entrenamientos posteriores, individual por pendiente. [D-02]
* «Completar entrenamiento»: completa, sin resultados inventados y sin duplicar la fecha. [D-03]
* Sustitución del entrenamiento de hoy.
* Descansos respetados y sacrificados.
* Sesiones parciales.
* Prevención de sesiones duplicadas.
Fase 5. Progresión
* Manual.
* Progresivo.
* Experto.
* Activación individual por ejercicio.
* Comparación por plantilla.
* Objetivos por serie.
* Repeticiones enteras y medias.
* Separación entre plan y resultado real.
Fase 6. Anotaciones
* Notas por ejercicio.
* Recuperación de la nota anterior.
* Consulta de notas antiguas.
* Historial.
* Compatibilidad con notas anteriores.
Fase 7. Historial y estadísticas
* Calendario mensual.
* Detalle por fecha.
* Historial por plantilla.
* Gráficas.
* Disciplina.
* Porcentajes de cumplimiento.
* Periodos temporales.
No marques ninguna parte como verificada sin comprobarla.
4. INTEGRACIÓN ENTRE SISTEMAS
Comprueba especialmente las interacciones entre las distintas funcionalidades.
4.1. Rutinas y recuperación
* Cambiar de rutina no debe mezclar entrenamientos pendientes.
* Los pendientes deben seguir vinculados a su rutina original.
* Reactivar la rutina original debe respetar las reglas de recuperación.
* El cambio de plantilla de un día no debe alterar sesiones históricas.
* Los días de descanso deben seguir siendo descansos aunque cambie la plantilla de otros días.
4.2. Rutinas y progresión
* Cada plantilla conserva su identidad.
* Dos plantillas que utilizan el mismo ejercicio no deben compartir progresión automáticamente.
* Duplicar una plantilla no debe duplicar su historial.
* Cambiar el orden de ejercicios no debe romper sus identificadores.
4.3. Progresión y entrenamiento en directo
* Las recomendaciones aparecen dentro de los campos correspondientes.
* El usuario puede ignorarlas.
* El valor real siempre prevalece en el registro.
* Los temporizadores y el marcado de series siguen funcionando.
* Las recomendaciones no interrumpen la ejecución.
4.4. Anotaciones y plantillas
* Las notas anteriores corresponden al ejercicio y línea correctos.
* Las notas nuevas no sobrescriben las anteriores.
* Las plantillas duplicadas mantienen historiales separados.
* Eliminar una plantilla no elimina las anotaciones históricas.
4.5. Recuperación e historial
* Una recuperación conserva la fecha prevista y la fecha real.
* No se cuenta dos veces un entrenamiento.
* El calendario refleja la recuperación correctamente.
* Los descansos sacrificados aparecen como incumplidos.
* Los entrenamientos parciales no aparecen como completos.
4.6. Sesiones y estadísticas
* Las estadísticas utilizan los datos reales.
* Los porcentajes no duplican recuperaciones.
* Las fechas futuras no se contabilizan como incumplidas.
* Los descansos respetados cuentan como disciplina.
* Los ejercicios de plantillas diferentes se pueden analizar independientemente.
5. AUDITORÍA DE DATOS E INTEGRIDAD
Comprueba:
* Identificadores únicos.
* Relaciones entre rutinas, plantillas, ejercicios y sesiones.
* Sesiones sin referencias válidas.
* Anotaciones huérfanas.
* Datos duplicados.
* Registros históricos incompletos.
* Estados de sesión incoherentes.
* Fechas previstas y reales.
* Migraciones ejecutadas o pendientes.
* Compatibilidad entre versiones de datos.
No elimines registros históricos ambiguos.
No reconstruyas datos con suposiciones.
No sobrescribas información real para conseguir que los datos parezcan coherentes.
Cuando existan registros ambiguos, conserva los originales y documenta su situación.
6. EXPERIENCIA DE USUARIO Y DISEÑO
Realiza una auditoría completa de la experiencia móvil.
La aplicación debe ser intuitiva, rápida y visualmente coherente.
Comprueba:
* Portada de Fitness.
* Biblioteca de rutinas.
* Biblioteca de plantillas.
* Edición de rutinas.
* Edición de plantillas.
* Selección de entrenamiento.
* Entrenamiento en directo.
* Descansos y temporizadores.
* Recuperaciones.
* Finalización de sesiones.
* Anotaciones.
* Historial.
* Calendario.
* Estadísticas y gráficas.
* Eliminados recientemente.
Presta especial atención a:
* Botones duplicados.
* Información repetida.
* Pantallas demasiado cargadas.
* Etiquetas poco claras.
* Estados que no se entienden.
* Controles demasiado pequeños.
* Errores de navegación.
* Problemas de desplazamiento.
* Campos que se salen de pantalla.
* Mensajes contradictorios.
* Acciones sin confirmación cuando son necesarias.
No introduzcas gamificación.
No añadas puntos, monedas o niveles.
No sacrifiques claridad por incorporar más información.
7. CONSERVACIÓN DEL ENTRENAMIENTO EN DIRECTO
El flujo de entrenamiento actual debe conservarse prácticamente intacto.
Verifica expresamente:
* Inicio de sesión.
* Edición de series.
* Marcado de series.
* Descanso automático.
* Temporizadores.
* Ajuste de valores.
* Descanso manual.
* Cambio de ejercicio.
* Sustitución de ejercicios.
* Pausa y reanudación, si existen.
* Guardado.
* Finalización.
* Recuperación de una sesión interrumpida.
* «Completar entrenamiento». [D-03]
Los componentes existentes deben reutilizarse siempre que sea posible.
No rehagas el entrenamiento en directo por motivos estéticos.
Solo modifica lo necesario para corregir defectos o integrar funcionalidades.
8. SEGURIDAD Y PERSISTENCIA
Audita las operaciones de guardado y sincronización.
Comprueba:
* Que no se pierdan sesiones.
* Que no se dupliquen sesiones.
* Que las operaciones repetidas sean seguras.
* Que los conflictos entre dispositivos estén controlados.
* Que los datos de un usuario no puedan mezclarse con los de otro.
* Que las restricciones importantes se apliquen también en servidor.
* Que las políticas de acceso a datos sean correctas.
* Que las migraciones sean seguras y compatibles.
Si una garantía depende de una migración SQL que todavía no se ha ejecutado, no la presentes como garantizada.
No ejecutes migraciones remotas ni alteres datos reales sin autorización explícita.
Documenta cualquier limitación que impida garantizar la integridad.
9. RENDIMIENTO
Comprueba el comportamiento con historiales grandes.
Analiza:
* Carga inicial de Fitness.
* Apertura de rutinas.
* Apertura de plantillas.
* Inicio de entrenamiento.
* Guardado de sesiones.
* Cálculo de cumplimiento.
* Recuperaciones.
* Historial.
* Calendario.
* Gráficas.
* Consultas de anotaciones.
Evita cálculos repetidos e innecesarios.
No cargues todo el historial si solo necesitas un periodo limitado.
No introduzcas optimizaciones que alteren los resultados funcionales.
10. PRUEBAS INTEGRALES
Ejecuta el conjunto completo de pruebas del proyecto.
Incluye pruebas de extremo a extremo que simulen situaciones reales.
Escenario A. Uso normal
1. Crear una rutina.
2. Asignar plantillas.
3. Configurar descansos.
4. Activar la rutina.
5. Iniciar un entrenamiento.
6. Completar series.
7. Utilizar los descansos automáticos.
8. Finalizar la sesión.
9. Consultar el historial.
Escenario B. Progresión
1. Ejecutar una plantilla.
2. Registrar resultados.
3. Volver a ejecutarla.
4. Consultar la recomendación.
5. Ignorar o modificar el objetivo.
6. Registrar el resultado real.
7. Comprobar la evolución.
Escenario C. Recuperación
1. Dejar un entrenamiento sin realizar.
2. Comprobar que pasa a pendiente.
3. Llegar a un día de descanso.
4. Consultar las opciones.
5. Elegir una recuperación.
6. Comprobar el descanso sacrificado.
7. Verificar el calendario y el historial.
Escenario D. Cambio de rutina
1. Tener entrenamientos pendientes.
2. Cambiar de rutina.
3. Comprobar que no se mezclan los pendientes.
4. Reactivar la rutina original.
5. Comprobar si siguen siendo recuperables.
Escenario E. Anotaciones
1. Añadir una nota a un ejercicio.
2. Finalizar la sesión.
3. Volver a ejecutar la misma plantilla.
4. Consultar la nota anterior.
5. Escribir una nota nueva.
6. Consultar ambas desde el historial.
Escenario F. Eliminación y recuperación
1. Crear una plantilla.
2. Asignarla a una rutina.
3. Ejecutarla.
4. Eliminar la plantilla.
5. Comprobar la conservación del historial.
6. Recuperar la plantilla.
7. Comprobar que no se producen referencias rotas.
Escenario G. Sesiones duplicadas
1. Registrar un entrenamiento.
2. Intentar iniciar otra sesión el mismo día.
3. Repetir el intento desde otra vía de acceso.
4. Verificar que el servidor impide el duplicado.
Escenario H. Caducidad [D-02]
1. Dejar un entrenamiento sin realizar.
2. Realizar un entrenamiento posterior y comprobar que el pendiente sigue siendo recuperable.
3. Realizar un segundo entrenamiento posterior.
4. Comprobar que el pendiente ha caducado y que el sistema lo explica.
Escenario I. Completar entrenamiento [D-03]
1. Utilizar «Completar entrenamiento» en una sesión.
2. Comprobar que queda completa, identificada como tal y sin resultados inventados.
3. Comprobar que cuenta como entrenamiento realizado en el calendario y en la disciplina.
4. Intentar registrar otra sesión en la misma fecha y comprobar que se impide.
Si alguna garantía no puede comprobarse sin acceso a infraestructura remota, indícalo claramente.
11. VERIFICACIÓN TÉCNICA
Ejecuta el sistema de verificación completo del proyecto, incluido verificar.sh si sigue siendo el mecanismo oficial.
Comprueba, según corresponda:
* Tests unitarios.
* Tests de integración.
* Tests de navegador.
* Chromium.
* Renderizado.
* Accesibilidad.
* Compilación.
* Tipos y lint.
* Migraciones locales.
* Integridad de datos.
* Rendimiento.
No reduzcas el número de comprobaciones.
No elimines pruebas que fallen.
No ocultes errores ni conviertas fallos en advertencias para conseguir un resultado verde.
Si existe algún fallo, investígalo y corrígelo dentro del alcance de esta fase.
Si la corrección implica cambiar una decisión de producto ya confirmada, detente y documenta el bloqueo.
12. CORRECCIONES PERMITIDAS
Puedes corregir defectos necesarios para completar la integración:
* Errores de conexión entre motores.
* Referencias rotas.
* Estados incoherentes.
* Problemas de persistencia.
* Errores de navegación.
* Problemas visuales.
* Fallos de compatibilidad.
* Defectos detectados por las pruebas.
No aproveches esta fase para rediseñar funcionalidades ya aprobadas.
No añadas nuevas funcionalidades que no estén contempladas en las fases 1–7.
No cambies reglas de producto sin autorización.
13. DOCUMENTACIÓN FINAL
Actualiza:
docs/FITNESS_DOCUMENTO_MAESTRO.md
Debe incluir:
* Estado final de las ocho fases.
* Funcionalidades realmente implementadas.
* Arquitectura definitiva.
* Motores y responsabilidades.
* Modelo de datos.
* Persistencia.
* Migraciones.
* Pruebas ejecutadas.
* Resultados de verificación.
* Limitaciones conocidas.
* Decisiones pendientes.
* Archivos principales.
* Dependencias técnicas.
* Instrucciones para mantenimiento futuro.
Si resulta útil, crea un documento adicional:
docs/15_FITNESS/INFORME_AUDITORIA_FINAL.md
En él registra la auditoría integral, los defectos encontrados, las correcciones realizadas y las comprobaciones.
No dupliques innecesariamente el documento maestro.
14. INFORME FINAL OBLIGATORIO
Al terminar, presenta un informe estructurado con:
A. Estado de las fases
* Fases completadas.
* Fases incompletas.
* Fases bloqueadas.
B. Funcionalidades
* Qué está implementado.
* Qué está verificado.
* Qué sigue pendiente.
C. Pruebas
* Comandos ejecutados.
* Número de pruebas.
* Resultados.
* Fallos y correcciones.
D. Datos e infraestructura
* Estado de las migraciones.
* Garantías de persistencia.
* Restricciones de servidor.
* Limitaciones de Supabase.
E. Revisión visual
* Problemas detectados.
* Correcciones.
* Estado móvil.
F. Riesgos pendientes
* Problemas que requieren autorización.
* Decisiones no resueltas.
* Limitaciones técnicas.
G. Estado del repositorio
* Rama actual.
* Cambios sin commit.
* Archivos modificados.
* Estado de Git.
* Confirmación de que no se han publicado cambios.
No presentes un resultado parcialmente verificado como si fuera definitivo.
15. LÍMITES DE AUTONOMÍA
Trabaja autónomamente dentro del alcance de esta fase.
No vuelvas a preguntar decisiones que ya estén documentadas.
No añadas nuevas funcionalidades.
No cambies decisiones de producto aprobadas.
No ejecutes migraciones remotas ni modifiques datos reales sin autorización explícita.
No hagas commits. No hagas push. No fusiones ramas ni pull requests. No publiques ni despliegues cambios.
Puedes corregir código, pruebas y documentación necesarios para cerrar la integración.
16. CRITERIOS DE FINALIZACIÓN
Fitness solo podrá considerarse finalizado cuando:
1. Las ocho fases estén verificadas.
2. Rutinas y plantillas funcionen correctamente.
3. La recuperación respete todas las reglas.
4. La progresión funcione en sus tres modos.
5. Las anotaciones estén integradas.
6. El historial sea coherente.
7. El calendario refleje los estados reales.
8. Las estadísticas utilicen datos correctos.
9. La persistencia sea segura dentro de las garantías realmente disponibles.
10. El entrenamiento en directo siga funcionando.
11. La interfaz móvil sea estable.
12. Las pruebas completas estén superadas.
13. No existan errores críticos conocidos.
14. La documentación esté actualizada.
15. El informe final refleje fielmente el estado del proyecto.
Si falta una garantía esencial, no declares Fitness finalizado.
Al concluir, detente y espera instrucciones. No publiques ni fusiones nada.

---

## Anexo A — Dependencias entre fases

> Derivadas de los propios prompts (cada uno dice qué lee y qué no debe empezar). No añaden requisitos.

| Fase | Depende de | Por qué (cita del prompt) |
|---|---|---|
| 1 · Contexto y documento maestro | — | Es la primera; crea `docs/FITNESS_DOCUMENTO_MAESTRO.md`. |
| 2 · Arquitectura y migración | 1 | «Lee primero: docs/FITNESS_DOCUMENTO_MAESTRO.md». Crea `docs/15_FITNESS/ARQUITECTURA_TECNICA.md`. |
| 3 · Rutinas y plantillas | 1, 2 | Lee los dos documentos; «Si los documentos no existen o están incompletos, no inventes su contenido». |
| 4 · Cumplimiento y recuperación | 1, 2, 3 | «Comprueba los cambios reales de la fase 3», «Utiliza las estructuras ya desarrolladas en la fase 3». |
| 5 · Progresión | 1, 2, 3, 4 | «Comprueba las fases 3 y 4 y sus cambios reales». |
| 6 · Anotaciones | 1, 2, 3, 4, 5 | «Comprueba los cambios reales de las fases 3, 4 y 5». |
| 7 · Historial y estadísticas | 1–6 | «Comprueba los cambios reales de las fases 3, 4, 5 y 6». |
| 8 · Integración y auditoría final | 1–7 | Audita las ocho fases. |

**Imagen personal no es una dependencia de Fitness** (decisión D-01): está terminado y se mantiene separado.

Dependencias **externas** que las fases ya nombran: la garantía de una sesión por fecha en el servidor
(prompts 2 §11, 4 §3.2 y §12, 8 §8 y escenario G) necesita SQL que solo puede ejecutar Josué; y
«Eliminados recientemente» debe integrarse con el sistema general de Ajustes (prompt 3 §10).

## Anexo B — Notas de transcripción

1. **Prompt 5, apartado 8 («Ejemplos válidos»).** Llegó con la numeración automática deformada
   (`6. 6.` / `* 6,5.` / `6. 7.` / `* 7,5.` / `6. 8.`). **Corregido el 2026-11-03** (D-05, conflictos
   menores) a 6 · 6,5 · 7 · 7,5 · 8, que es lo que dice la regla («enteros o terminados en 0,5», también en
   el prompt 2 §9). El texto deformado se conserva en el Anexo D.
2. **Tablas con tabuladores.** El prompt 2 §13 («Área / Situación actual / Arquitectura propuesta /
   Cambios necesarios») y el prompt 3 §5 (Día / Asignación) llegaron separados por tabuladores. Se
   conservan así.
3. **Estados de seguimiento.** «En verificación» (§0.2) y «Pendiente de verificación» (prompt 1 §7)
   eran el mismo estado. **Unificado el 2026-11-03** como «En verificación» (D-05).

## Anexo C — Contexto de las auditorías del 2026-11-02 (para comprobar en la Fase 1)

> No son requisitos: son conclusiones de dos auditorías de solo lectura hechas sobre `main` en
> `4881673` (v3.161.3). El prompt 1 pide comprobar cualquier dato importante en el repositorio.

- **Persistencia:** todo Fitness es **un único objeto JSON** en `app_data` (clave `fitness`), que
  `saveData` sobrescribe entero; gana el último dispositivo en escribir. Medido: ~5,3 KB por sesión de
  19 series → ~1,1 MB/año a 4 sesiones por semana, en la misma fila.
- **Nombres en el código:** un «plan» es hoy la semana (17 predeterminados, en el código, todos de 7
  días); `fitness.plantillas` son los entrenamientos individuales del usuario; `fitness.sesiones` las
  ejecuciones. `planActivo = {planId, origen, desde}` y `planesAnteriores` guarda los tramos cerrados.
- **Lo que no existe:** rutinas propias de 1 a 30 días, una sesión por día (hoy se permiten varias y
  hay «Repetir»), pendientes y recuperaciones, verde y rojo (la F31/F32 decidió estados neutros), modos
  de progresión, referencia «última ejecución de la misma plantilla» (`ultimaVez` es por ejercicio),
  historial por plantilla, preferencias de progresión.
- **Hallazgos concretos:** las repeticiones son enteras y **8,5 se redondea en silencio a 9**; las
  notas de la línea de una plantilla (`linea.notas`) **no se copian** a la sesión al empezar; la sesión
  no guarda el `id` de la línea de la plantilla; `origen.id` es a la vez id de día (predeterminados) e
  id de plantilla (propias); la racha de entrenamiento no se alimenta de las sesiones.
- **Lo que se reutiliza:** el motor de ejecución en vivo (`entrenamiento.js`, `entrenamientoUx.js`,
  `EntrenamientoVivoView`, `finalizacion.js`), la comparación de series (`progresion.js`), las
  migraciones versionadas y la cuarentena (`persistenciaFitness.js`), el calendario mensual
  (`mesDeActividad`) y los tramos de planes anteriores.
- **PR #2 (abierta, sin fusionar):** «Completar entrenamiento» permite apuntar a mano un entrenamiento
  en cualquier fecha pasada y varios distintos el mismo día; también amplía el chatbot de Fitness. Por la
  decisión **D-03** la función se conserva con un comportamiento nuevo (todas las series simuladas como
  hechas, completa, sin inventar resultados, una sesión por fecha); la PR no se fusiona ni se descarta
  automáticamente.

## Anexo D — Texto original de los pasajes sustituidos

> Registro de cada cambio aplicado el 2026-11-03 al incorporar las decisiones D-01 a D-05. Es el texto
> **anterior**, tal como estaba en la copia literal; el vigente está en el prompt correspondiente.

**D·01 · Prompt 1 · D-03**

```text
* Pruebas automatizadas y herramientas de verificación.
Utiliza las auditorías anteriores
```

**D·02 · Prompt 1 · D-04**

```text
10. Protección de los datos existentes durante cualquier futura migración.
```

**D·03 · Prompt 1 · D-05**

```text
* Pendiente de verificación.
```

**D·04 · Prompt 2 · D-05**

```text
* Debe poder duplicarse, editarse, renombrarse, eliminarse y recuperarse.
B. Plantilla
```

**D·05 · Prompt 2 · D-03**

```text
* No debe depender de que la plantilla original siga existiendo.
4. MODELO DE DATOS
```

**D·06 · Prompt 2 · D-02**

```text
* Últimos siete días naturales.
* Entrenamientos completados.
```

**D·07 · Prompt 2 · D-02**

```text
8. Los pendientes y las recuperaciones deben respetar la ventana temporal acordada.
```

**D·08 · Prompt 2 · D-02**

```text
La regla especial de capacidad de recuperación debe quedar modelada así:
* Si existen X entrenamientos pendientes, se necesitan X días de descanso posteriores para recuperarlos todos.
* Si hay menos días de descanso disponibles que entrenamientos pendientes, no todos podrán recuperarse.
* El entrenamiento más antiguo es el primero que caduca cuando la capacidad disponible no permite conservar todos los pendientes.
* El orden de elección puede modificar qué entrenamientos sobreviven.
* El usuario puede elegir libremente entre las recuperaciones válidas.
* El sistema debe explicar las consecuencias de cada elección antes de ejecutarla.
```

**D·09 · Prompt 2 · D-05**

```text
No inventes una política de borrado definitivo ni un periodo de retención: documenta las decisiones técnicas necesarias para resolverlo posteriormente.
```

**D·10 · Prompt 2 · D-03/D-05**

```text
* Referencias que puedan reconstruirse con seguridad.
Los datos antiguos ambiguos
```

**D·11 · Prompt 3 · D-05**

```text
No conviertas automáticamente las rutinas predeterminadas en estructuras nuevas sin preservar sus identificadores y relaciones históricas cuando sean necesarios.
```

**D·12 · Prompt 3 · D-05**

```text
* Plantillas predeterminadas existentes.
```

**D·13 · Prompt 3 · D-03**

```text
* Finalización de sesiones.
Los cambios necesarios para conectar
```

**D·14 · Prompt 4 · D-02**

```text
El cumplimiento se calcula sobre los últimos siete días naturales, incluyendo hoy.
No utilices semanas fijas de lunes a domingo para el motor de recuperación.
```

**D·15 · Prompt 4 · D-03**

```text
Si ya existe una sesión válida ese día, no se puede iniciar otra.
```

**D·16 · Prompt 4 · D-03**

```text
* Recuperado.
* Completado.
```

**D·17 · Prompt 4 · D-05 (CF-05)**

```text
* Debe indicar que tiene la oportunidad de recuperar el último entrenamiento pendiente válido.
```

**D·18 · Prompt 4 · D-02**

```text
* Si recupera uno, el entrenamiento de hoy no se realiza y pasa a estar pendiente cuando termine el día.
```

**D·19 · Prompt 4 · D-02**

```text
7. CAPACIDAD DE RECUPERACIÓN Y CADUCIDAD
Esta es la regla central del sistema y debe implementarse sin simplificaciones.
La capacidad de recuperación depende de los días de descanso posteriores disponibles.
Regla: X entrenamientos pendientes necesitan X días de descanso para poder recuperarse todos.
Ejemplo:
* Lunes: entrenamiento Push no realizado.
* Martes: entrenamiento Pull no realizado.
* Miércoles: entrenamiento Legs no realizado.
* Jueves: descanso.
* Viernes: descanso.
Existen tres entrenamientos pendientes y dos días de descanso disponibles.
Por tanto, no es posible recuperar los tres.
Si se empieza a recuperar el primer día de descanso
El jueves se puede elegir entre los entrenamientos pendientes válidos.
Al comenzar el proceso, el sistema debe identificar qué entrenamiento quedará fuera de la capacidad disponible.
Si se recupera primero el entrenamiento más antiguo, los dos restantes podrán recuperarse en los dos días disponibles solo si la secuencia y la ventana temporal siguen permitiéndolo.
La aplicación debe calcularlo antes de ofrecer la recuperación.
Si se espera hasta el segundo día de descanso
La capacidad restante es menor.
El usuario puede elegir entre los entrenamientos que todavía sigan siendo válidos, pero no debe ofrecer entrenamientos cuya recuperación ya haya caducado.
Libertad de elección
El sistema recomienda recuperar primero el entrenamiento más antiguo.
Sin embargo, el usuario puede elegir otro entrenamiento pendiente válido.
Cuando elegir uno implique que otro se pierda definitivamente, la interfaz debe explicarlo antes de confirmar.
No escondas las consecuencias de una elección.
Cálculo obligatorio
Implementa un motor que evalúe:
* Antigüedad de cada entrenamiento pendiente.
* Fecha original.
* Ventana temporal de siete días.
* Días de descanso disponibles.
* Entrenamientos que sustituyen a otros días.
* Capacidad restante.
* Entrenamientos que caducan.
* Consecuencias de cada posible elección.
No implementes una regla simplista como «si hay dos descansos, recupera los dos pendientes más recientes».
La lógica debe considerar la secuencia temporal completa.
Si existe una secuencia que no pueda resolverse inequívocamente a partir de las decisiones documentadas, detén esa parte y registra el caso como bloqueo. No inventes una política.
```

**D·20 · Prompt 4 · D-02**

```text
Debe permitir recuperar ambos en los dos descansos, siempre que se respeten la ventana temporal y el orden de los días.
```

**D·21 · Prompt 4 · D-02**

```text
Debe identificar que no es posible recuperar los tres.
Debe recomendar primero el más antiguo y explicar las consecuencias de cada elección.
```

**D·22 · Prompt 4 · D-02**

```text
Con tres pendientes y dos descansos, si el usuario elige primero el más reciente, el motor debe recalcular qué otros pendientes siguen siendo recuperables.
```

**D·23 · Prompt 4 · D-02**

```text
Los pendientes siguen sujetos a sus reglas de caducidad.
```

**D·24 · Prompt 4 · D-02**

```text
Si se vuelve a activar la rutina original y los entrenamientos siguen dentro de la ventana válida, pueden volver a recuperarse.
```

**D·25 · Prompt 4 · D-02/D-03**

```text
* El entrenamiento sigue las reglas de pendiente y recuperación.
9. SESIONES Y VINCULACIÓN HISTÓRICA
```

**D·26 · Prompt 4 · D-03**

```text
* Identificador del entrenamiento original recuperado, si corresponde.
```

**D·27 · Prompt 4 · D-02**

```text
* Qué entrenamientos se perderían si no se recuperan.
```

**D·28 · Prompt 4 · D-02**

```text
* Caducidad.
* Capacidad de recuperación.
```

**D·29 · Prompt 4 · D-03**

```text
* Prevención de sesiones duplicadas.
* Diferencia entre fecha prevista y fecha real.
```

**D·30 · Prompt 4 · D-02**

```text
2. La ventana temporal funciona.
```

**D·31 · Prompt 4 · D-02**

```text
6. La capacidad de recuperación respeta las reglas acordadas.
```

**D·32 · Prompt 4 · D-03**

```text
12. El calendario puede obtener estados coherentes.
13. Las pruebas están superadas.
14. La documentación maestra está actualizada.
```

**D·33 · Prompt 5 · D-05**

```text
Ejemplos válidos:
    6. 6. 
* 6,5.
    6. 7. 
* 7,5.
    6. 8. 
```

**D·34 · Prompt 5 · D-03**

```text
No conviertas automáticamente una sesión incompleta en completa.
```

**D·35 · Prompt 5 · D-03**

```text
* Conservación de plan y hecho.
* No modificación de sesiones históricas.
```

**D·36 · Prompt 7 · D-03**

```text
* Observaciones generales de la sesión, si existen.
```

**D·37 · Prompt 7 · D-02**

```text
* Entrenamientos perdidos.
* Entrenamientos recuperados.
* Descansos respetados.
* Descansos sacrificados.
* Porcentaje de cumplimiento.
```

**D·38 · Prompt 7 · D-02/D-03**

```text
* Recuperaciones.
* Diferencia entre fecha prevista y real.
```

**D·39 · Prompt 8 · D-02/D-03**

```text
* Entrenamientos pendientes.
* Capacidad de recuperación.
* Caducidad.
```

**D·40 · Prompt 8 · D-03**

```text
* Recuperación de una sesión interrumpida.
```

**D·41 · Prompt 8 · D-02/D-03**

```text
4. Verificar que el servidor impide el duplicado.
```

**D·42 · Prompt 4 · D-02**

```text
* También debe permitir consultar y elegir otros pendientes que sigan dentro de las reglas de capacidad.
```

**D·43 · Prompt 4 · D-02**

```text
Si la regla de capacidad de recuperación requiere una decisión adicional, deja constancia del caso exacto y no lo resuelvas unilateralmente.
```

**Prompt 5 · nota de transcripción del apartado 8** (sustituida por la de arriba): «la lista de «Ejemplos válidos» del apartado 8 llegó así en el mensaje original, con la numeración automática deformada (`6. 6.`, `6. 7.`, `6. 8.`). Se conserva tal cual. Por el contexto —«Números enteros. Incrementos de media repetición»— la lectura evidente es **6 · 6,5 · 7 · 7,5 · 8**; queda anotado en el Anexo B y se confirma en la Fase 5.»

## Anexo E — Decisiones definitivas del 2026-11-03 (literal)

> Copiadas tal cual del mensaje de Josué «ACTUALIZACIÓN DE DECISIONES Y AUTORIZACIÓN PARA COMENZAR
> FITNESS». Sustituyen cualquier regla contradictoria de los prompts y ya están incorporadas a su texto.

**D-01 · Estado de Imagen personal**

Imagen personal ya está terminado.

No debe considerarse un proyecto pendiente ni una dependencia de Fitness.

* No reabras su desarrollo.
* No modifiques sus funcionalidades.
* No toques sus 22 cambios ni ningún otro trabajo suyo.
* No utilices su rama de respaldo como rama de trabajo para Fitness.
* Mantén ambos trabajos completamente separados.

Los cambios pendientes de Imagen personal deben permanecer intactos.

**D-02 · Regla definitiva de recuperación**

Esta decisión sustituye cualquier regla contradictoria de los prompts anteriores.

Un entrenamiento perdido puede recuperarse mientras no se hayan realizado dos entrenamientos posteriores a su fecha prevista.

Cuando se realizan dos entrenamientos posteriores, el entrenamiento perdido caduca y deja de ser recuperable.

La caducidad depende del número de entrenamientos realizados, no del número de días naturales transcurridos.

Ejemplo obligatorio:

* Lunes: Push previsto, pero no realizado. Queda pendiente.
* Martes: Pull previsto, pero tampoco realizado. Queda pendiente.
* Miércoles: se recupera Pull.
* Jueves: Push todavía puede recuperarse, porque solamente se ha realizado un entrenamiento posterior a su fecha prevista.
* Si antes de recuperar Push se realizan dos entrenamientos posteriores a su fecha prevista, Push caduca.

Otro ejemplo:

* Lunes: Push perdido.
* Martes: Pull realizado.
* Miércoles: Piernas realizado.
* Jueves: Push ya no se puede recuperar.

El sistema debe aplicar esta regla de forma individual a cada entrenamiento pendiente.

No utilices una ventana fija de siete días ni una regla basada exclusivamente en descansos disponibles.

Los días de descanso no cuentan como entrenamientos realizados.

La recuperación debe conservar siempre la fecha prevista original y registrar la fecha real de ejecución.

Si se recupera un entrenamiento durante un día de descanso, ese descanso se considera sacrificado.

Si se recupera sustituyendo el entrenamiento previsto para hoy, el entrenamiento de hoy pasa a estar pendiente y queda sometido a la misma regla.

El sistema debe explicar claramente qué entrenamientos siguen siendo recuperables y cuáles han caducado.

Actualiza los prompts 2, 4, 7 y 8 donde sea necesario para que no exista ninguna contradicción con esta regla.

**D-03 · Función «Completar entrenamiento»**

La función existente «Completar entrenamiento» debe conservarse.

Su comportamiento definitivo:

* Simula que se han completado todas las series de la sesión.
* Registra el entrenamiento como completo.
* Cuenta como entrenamiento realizado a efectos de disciplina.
* No se considera parcial.
* No debe inventar pesos, repeticiones ni resultados de rendimiento que el usuario no haya registrado.
* Debe quedar identificado que se completó mediante esta función, si el modelo de datos lo permite.

Debe respetar la regla de una sesión por fecha y no permitir duplicados.

Revisa la PR #2 y su implementación para integrar esta función correctamente con el nuevo sistema. No la fusiones ni la descartes automáticamente. Si hay incompatibilidades, documenta la solución necesaria y resuélvela dentro de las fases correspondientes sin perder la funcionalidad.

Actualiza los prompts afectados y elimina las contradicciones.

**D-04 · Conservación de Fitness y alcance del rediseño**

No quiero rehacer Fitness desde cero.

Quiero conservar la estructura, las funcionalidades y el flujo de entrenamiento existentes siempre que sean compatibles con las mejoras aprobadas en los ocho prompts.

Principios obligatorios:

* Reutilizar los componentes y motores existentes cuando sea posible.
* No eliminar funcionalidades útiles por simplificar la arquitectura.
* No rediseñar el entrenamiento en directo innecesariamente.
* No perder sesiones, plantillas, rutinas ni datos históricos.
* No duplicar pantallas o sistemas existentes.
* Integrar las nuevas funcionalidades de manera coherente.
* Corregir los defectos existentes que impidan el funcionamiento correcto.

Las ocho fases deben mejorar y completar Fitness, no sustituirlo innecesariamente.

**D-05 · Resolución de los conflictos documentales**

Revisa los ocho prompts y el seguimiento completo.

Aplica las decisiones anteriores en todos los apartados afectados.

Resuelve también los conflictos menores que puedan solucionarse sin cambiar decisiones de producto.

En particular:

* Unifica los nombres de los estados de seguimiento.
* Evita conflictos con los prefijos de documentación existentes.
* Aprovecha la papelera general de Jos Style cuando sea compatible con los requisitos de Fitness.
* Utiliza «Experto» como nombre definitivo del modo.
* Revisa el tratamiento de sesiones sin series.
* Conserva las rutinas predeterminadas existentes y diseña su integración sin perder datos ni funcionalidades.

No inventes decisiones adicionales.

Si aparece una cuestión técnica que no puede resolverse con la información disponible, documenta la limitación y continúa con el resto del trabajo que no dependa de ella.
