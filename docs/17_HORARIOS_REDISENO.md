# 17 · Horarios — Documento Maestro del rediseño y Anexo de decisiones cerradas

> **Qué es este documento.** El objetivo funcional del rediseño de Horarios, tal como lo definió Josué, más el anexo de
> decisiones que cerró después y los cuatro detalles técnicos que se le comunicaron al recibir ese anexo.
>
> **Qué NO es.** No autoriza cambios en código, datos, Supabase, ramas, commits, push, merge ni despliegues. El desarrollo
> se hará por fases y con prompts específicos (§15).
>
> **Precedencia.** El **Anexo de decisiones cerradas (Parte B)** complementa el Documento Maestro (Parte A) y **prevalece
> sobre cualquier interpretación anterior que lo contradiga**. Donde un punto del Maestro queda matizado por el Anexo, se
> indica con **«→ Anexo §N»**. Los detalles técnicos (Parte C) no cambian ninguna decisión: dicen qué hace falta para
> cumplirlas.
>
> **De dónde sale.** La auditoría integral de Horarios del 2026-11-07, hecha en solo lectura sobre `main` `bf9bb46`. Sus
> hallazgos están resumidos en el §11.
>
> Estado: diseño funcional definido. Pendiente de la auditoría complementaria, la planificación técnica y la
> implementación.

---

## PARTE A — DOCUMENTO MAESTRO DEL REDISEÑO DE HORARIOS

### 1. Objetivo principal

Rediseñar completamente Horarios para conseguir que sea mucho más sencillo, rápido e intuitivo.

La prioridad no es aumentar el número de funciones. Es facilitar la creación, la consulta y la modificación de horarios.

**Principio fundamental: potencia por dentro, sencillez por fuera.**

El usuario debe poder crear un horario sin conocimientos técnicos, sin tener que completar formularios interminables y sin
depender de un chatbot.

### 2. Estructura de navegación

Dentro de **Gestión → Organización** habrá dos apartados.

**Horario**
- Consulta de la agenda conjunta.
- Reúne las actividades de todos los horarios activos.
- Vista semanal de lunes a domingo (→ Anexo §11: en el móvil, la vista diaria es la principal).
- Conexión con el apartado Hoy de Inicio.
- Consulta de los detalles y la procedencia de las actividades.

**Mis horarios**
- Crear horarios.
- Editar horarios.
- Activar y desactivar.
- Archivar.
- Duplicar.
- Recuperar horarios eliminados.
- Administrar versiones y borradores.

No se creará un apartado independiente de historial.

### 3. Gestión de múltiples horarios

Se podrán crear tantos horarios como permitan razonablemente el almacenamiento y el rendimiento. Por ejemplo:
- Horario escolar.
- Horario de conservatorio.
- Horario de entrenamiento.
- Horario de vacaciones.
- Horario personal.

Se podrán mantener **varios horarios activos a la vez**.

**Estados**
- **Activo:** sus actividades aparecen en la agenda conjunta.
- **Desactivado:** se conserva entero, pero sus actividades no aparecen en Hoy.
- **Archivado:** se conserva como histórico y no participa en la agenda actual.

Un horario desactivado se puede reactivar sin reconstruirlo.

**Fechas**
- La fecha de inicio es opcional.
- La fecha de finalización es opcional.
- Sin fecha de finalización, el horario puede mantenerse indefinidamente.
- Se admite la activación manual y la activación según fechas.

**Solapamientos** (→ Anexo §4)
- Se comprobarán los solapamientos entre **todos** los horarios activos.
- Si una actividad coincide con otra:
  - No se permitirá incorporarla mientras exista el conflicto.
  - Se identificará la actividad que provoca el problema.
  - Se ofrecerá modificarla, eliminarla o desactivar el horario correspondiente.
  - **Nunca se cambiará ni se eliminará otra actividad automáticamente.**
- Antes de activar un horario también se comprobarán los posibles conflictos.

### 4. Creación de horarios

Al pulsar «Crear un horario» aparecerán tres opciones.

**A. Crear con el Asistente** (→ Anexo §1: se llama «Asistente», no «IA», y funciona por reglas)
- Conversación escrita.
- Preguntas concretas cuando falte información.
- Interpretación de las necesidades del usuario.
- Organización de actividades.
- Propuestas de distribución.
- Vista previa actualizada.
- Confirmación obligatoria antes de aplicar los cambios.

**B. Crear manualmente**
- Constructor visual.
- Añadir actividades.
- Editar, duplicar, mover y eliminar.
- Organizar días y horas.
- Configurar repeticiones.
- Copiar días completos.
- Sin necesidad de usar el Asistente.

**C. Importar horario** (→ Anexo §2)

Se usará el selector nativo del dispositivo:
- Hacer una fotografía.
- Elegir una fotografía.
- Seleccionar archivos.
- Abrir el explorador de archivos en el ordenador.

Se admitirán imágenes, varias fotografías y documentos compatibles, PDF incluidos. El reconocimiento estará optimizado
para horarios escolares, pero será universal.

Proceso:
1. Seleccionar o fotografiar el documento.
2. Extraer la información.
3. Identificar actividades, días y horas.
4. Marcar los datos dudosos.
5. Mostrar una pantalla de revisión.
6. Permitir corregir los resultados.
7. Guardar como borrador.
8. Decidir cuándo incorporarlo y activarlo.

**La importación nunca debe incorporar información incorrecta sin revisión.**

### 5. Actividades

Cada usuario podrá crear sus propias categorías. No habrá categorías prediseñadas obligatorias (→ Anexo §6).

Una actividad podrá tener:
- Nombre.
- Categoría personalizada.
- Hora de inicio y de finalización.
- Duración.
- Días de repetición.
- Fechas de vigencia (→ Anexo §5: cada actividad gestiona las suyas).
- Información adicional opcional.
- Color.
- Relación con otros apartados cuando corresponda (→ Anexo §7).

La información adicional dependerá del tipo de actividad y no será obligatoria.

- Se admitirán diferentes días, repeticiones y configuraciones, y se podrán dejar días en blanco.
- No se introducirán sistemas complejos de dependencias entre actividades.
- Las actividades serán editables: que una actividad tenga normalmente una hora fija no significa que sea inamovible.

### 6. Asistente y organización automática

El Asistente será complementario. **La creación manual será el método principal.**

El Asistente podrá:
- Interpretar instrucciones.
- Añadir actividades.
- Modificar actividades.
- Dejar días vacíos.
- Reorganizar una semana.
- Detectar huecos.
- Proponer distribuciones.

Todos los cambios se mostrarán en la vista previa y necesitarán aceptación.

También existirá una **herramienta independiente de organización automática**, sin necesidad de usar el chatbot. Las
propuestas serán opcionales: el usuario siempre podrá organizarlo todo a mano.

### 7. Edición visual

**Acciones**
- Editar.
- Duplicar.
- Mover.
- Eliminar.

**Interacciones**
- Pulsar una actividad para abrir su edición.
- Adaptar la ventana o el panel al dispositivo.
- Arrastrar actividades por el calendario.
- Cambiar su duración arrastrando sus bordes.
- Copiar un día completo a otro.
- Deshacer y rehacer modificaciones.

Al modificar una actividad repetida, se preguntará el alcance del cambio (→ Anexo §5):
1. Solo ese día.
2. Ese día y las siguientes repeticiones.
3. Todas las repeticiones correspondientes.

La vista previa se actualizará mientras se edita.

### 8. Guardado y seguridad

(→ Anexo §8)
- Autoguardado durante la edición.
- Botones para deshacer y rehacer.
- Los borradores se conservan al salir.
- Se puede continuar más tarde.
- Las versiones importantes se guardan manualmente.
- También se conservan versiones mediante el autoguardado.
- Pantalla de resumen antes de confirmar.
- Los cambios llegan a Hoy **solo después de confirmar** la edición.
- Papelera, o apartado Eliminados, para recuperar horarios.
- Duplicación de horarios completos.

**Los borradores no modificarán la agenda que se está usando.**

### 9. Visualización

**Vista principal**
- Semana de lunes a domingo (en el ordenador; → Anexo §11).
- El selector de intervalos que ya existe.
- Los colores personalizados que ya existen.
- Al pulsar una actividad, se identifica el horario del que procede.

**Móvil** (→ Anexo §11)
- Diseño principalmente vertical.
- Interfaz limpia.
- Sin saturar de información.
- Prioridad a la consulta rápida y a la facilidad de edición.

**Exportación** (→ Anexo §9)
- Exportar a PDF e imagen.
- El resultado debe estar bien centrado, organizado, ser visualmente atractivo y estar preparado para imprimir o
  compartir.

### 10. Integraciones

**Inicio → Hoy**
- Debe seguir funcionando y reunir las actividades de todos los horarios activos.
- No se crea una agenda paralela ni se rompe la conexión existente.

**Estudios** (→ Anexo §7)
- Evitar duplicar asignaturas.
- Si se introduce una asignatura cuyo nombre ya existe en el otro apartado, se ofrece usar la existente.
- Funciona en las dos direcciones: de Horarios a Estudios y de Estudios a Horarios.
- La conexión conserva la identidad de cada asignatura y evita duplicados innecesarios.

**Notificaciones** (→ Anexo §3)
- Los avisos de actividades deben funcionar aunque JosStyle no esté abierta, dentro de lo que permitan el dispositivo y
  el navegador.

**Calendario**
- Conservar y aprovechar la conexión existente, si está implementada.

**Sincronización**
- Los cambios hechos desde otros apartados deben reflejarse en Horarios cuando corresponda.

### 11. Problemas de la auditoría que deben resolverse

La auditoría previa (2026-11-07) identificó estos problemas, que no deben perderse durante el rediseño:

1. Dos sistemas distintos para comprobar conflictos. La auditoría encontró **cuatro reglas** que no coinciden: la del
   editor (`conflictosCon`), la del día (`conflictosDelDia`), la de la celda de la cuadrícula y la de la agenda del
   Calendario.
2. Ciclos A/B configurables pero que el motor no aplica (`resolverDia` no usa `columnasDeLaFecha`).
3. Semanas alternas por actividad sin ningún control en pantalla.
4. «Añadir día» no crea un día de la semana: la columna queda sin `dia`.
5. Los horarios creados «Desde cero» no aparecen bien en Hoy.
6. Las actividades fuera de las franjas desaparecen de la vista semanal.
7. Los conflictos que detecta el editor no coinciden con los de Hoy.
8. Validación insuficiente de las horas en las excepciones («solo este día» acepta 25:00 y horas al revés).
9. Los planes de estudio de un día se repiten cada semana.
10. Los avisos dependen de tener abierta la pantalla Horario.
11. Riesgo de duplicación al duplicar horarios para otro curso o al restaurar copias.
12. Funciones que existen pero no se pueden usar desde la interfaz:
    - Festivos.
    - Cancelar una actividad un día.
    - Añadir actividades puntuales.
    - Semanas alternas.
    - Cambiar el nombre y las fechas.
    - Asignar material a una asignatura.

Estas funciones útiles deben conservarse, pero reorganizadas para que no compliquen la interfaz.

### 12. Protección técnica

Antes de implementar:
- Revisar el motor `src/lib/horario.js`.
- Revisar `resolverDia`.
- Revisar el normalizador de datos.
- Revisar la integración con Estudios.
- Revisar Inicio, Calendario, Mochila y notificaciones.
- Revisar el almacenamiento en Supabase.
- Revisar las utilidades compartidas con Fitness y Sueño (`DIAS_SEMANA` y `diaDeFecha` de `horario.js`; `diasEntre` de
  `hoy.js`).

Además:
- No perder datos existentes.
- No simplificar eliminando funciones útiles.
- No modificar conexiones de otros módulos sin comprobar sus dependencias.

### 13. Fases propuestas de implementación

| Fase | Contenido |
|---|---|
| **1. Auditoría y protección** | Revisar el estado actual · documentar datos y dependencias · identificar riesgos · establecer pruebas de regresión. |
| **2. Arquitectura y modelo de datos** | Varios horarios · estados · actividades · repeticiones · versiones y borradores · compatibilidad con los datos existentes. |
| **3. Nueva interfaz** | Horario · Mis horarios · vista semanal · gestión de cada horario. |
| **4. Constructor manual** | Crear actividades · editar · duplicar · arrastrar · copiar días · deshacer y rehacer. |
| **5. Importación** | Selector nativo · reconocimiento · revisión · corrección · borradores. |
| **6. Asistente y organización automática** | Conversación · propuestas · vista previa · confirmación. |
| **7. Integraciones** | Hoy · Estudios · Calendario · notificaciones · sincronización. |
| **8. Verificación y lanzamiento** | Pruebas funcionales, de regresión, móviles y de datos · comprobación de integraciones · revisión final antes de publicar. |

### 14. Criterios de aceptación

El rediseño no estará terminado hasta que:
- Crear un horario resulte sencillo.
- Se puedan mantener varios horarios activos.
- Los conflictos se detecten correctamente.
- La agenda conjunta funcione.
- No se pierdan actividades ni datos.
- Los borradores y las versiones se puedan recuperar.
- La importación sea revisable.
- El modo manual funcione sin el Asistente.
- Los cambios no se apliquen sin confirmación.
- Las conexiones con el resto de JosStyle sigan funcionando.
- La experiencia en el móvil sea rápida y clara.
- Los avisos funcionen también con la aplicación cerrada (→ Anexo §3).

### 15. Regla de trabajo con Claude

- Este documento define el objetivo funcional; **no autoriza cambios**.
- El desarrollo se hará por fases y con prompts específicos.
- Antes de cada implementación se revisarán las dependencias y los riesgos.
- No se harán commits, push, merge, cambios en `main` ni despliegues sin autorización expresa.

**Principio final: no añadir complejidad por añadir funciones. Cada decisión debe hacer que Horarios sea más fácil y rápido
de usar.**

---

## PARTE B — ANEXO DE DECISIONES CERRADAS DE HORARIOS

> Decisiones funcionales confirmadas por Josué. Complementan el Documento Maestro y **prevalecen sobre cualquier
> interpretación anterior que lo contradiga**.

### 1. Asistente
- Se llamará exclusivamente **«Asistente»**.
- No usará la denominación «IA».
- Funcionará **por reglas, sin API generativa ni costes por petición** (coherente con la decisión DA-09 de
  `docs/15_ASISTENTES_MAESTRO.md`).
- Interpretará instrucciones, preguntará cuando falte información y generará propuestas con vista previa.
- La creación manual seguirá siendo independiente.

### 2. Importación
- Se priorizará el **OCR local** para fotografías y PDF escaneados.
- Se evitará enviar documentos a servicios externos.
- La librería de reconocimiento se cargará **bajo demanda** cuando sea técnicamente viable.
- Los datos dudosos se marcarán y habrá que revisarlos antes de incorporarlos.
- La importación generará un **borrador**.

### 3. Notificaciones
- Objetivo: **notificaciones push avanzadas, incluso con JosStyle cerrada**.
- Investigar e implementar el service worker, el servidor y la configuración SQL necesaria.
- Documentar los requisitos específicos del iPhone.
- **La integración no se considera terminada si solo funciona con la aplicación abierta.**

### 4. Conflictos
- Conservar todos los conflictos históricos.
- Identificarlos y permitir revisarlos y resolverlos a mano.
- No borrar ni modificar actividades automáticamente.
- Bloquear los conflictos nuevos.
- Comprobar también los conflictos antes de activar un horario.

### 5. Repeticiones
Al modificar una actividad repetida, se ofrecerá:
1. Solo este día.
2. Este día y los siguientes.
3. Todas las repeticiones.

Cada actividad podrá gestionar sus propias fechas de vigencia.

### 6. Categorías
- Categorías personalizadas, con nombre y color.
- No serán obligatorias.
- Se podrán editar y eliminar.
- **Eliminar una categoría nunca eliminará sus actividades.**

### 7. Integración inteligente entre módulos
- Al escribir el nombre de una actividad, se sugerirán elementos existentes de otros módulos.
- Se indicará claramente su procedencia: Estudios, Fitness, Imagen personal u otros módulos compatibles.
- Se podrá elegir el elemento existente o crear una actividad independiente.
- Se evitarán los duplicados.
- Se mantendrá la identidad de los elementos vinculados.
- Se sincronizará en las dos direcciones cuando corresponda.
- Se aprovecharán las planificaciones existentes, como las de Fitness, sin introducir actividades duplicadas.
- Cada integración respetará las reglas y el modelo de datos de su módulo de origen.

### 8. Borradores, versiones y papelera
- Autoguardado de borradores.
- Versiones recuperables.
- Papelera para los horarios eliminados.
- La agenda activa no cambia hasta confirmar.
- No se crea un apartado independiente de historial.
- Almacenamiento eficiente y recuperación segura.

### 9. Exportación
- Exportar a PDF e imagen.
- Se podrá exportar un día o la semana completa.
- Diseño centrado, legible y preparado para imprimir o compartir.
- Se mantienen los colores configurados.

### 10. Representación de actividades
- Una actividad de 11:00 a 13:00 será **un único bloque visual**.
- Ocupará correctamente las franjas 11:00–12:00 y 12:00–13:00.
- No se dividirá en dos actividades independientes.
- **No se pide permitir actividades que crucen la medianoche.**

### 11. Adaptación al móvil
- La **vista diaria** es la presentación principal.
- Navegación rápida entre días.
- Acceso sencillo a la semana completa.
- Evitar cuadrículas que obliguen a desplazarse en horizontal sin fin.
- Mantener una vista semanal adecuada en el ordenador.

### 12. Principio de simplicidad
La sencillez prevalece sobre la cantidad de funciones.
- Conservar las funciones útiles.
- Simplificar las que resulten complicadas.
- No añadir funciones que no aporten valor.
- Mantener las opciones avanzadas accesibles sin saturar la interfaz.
- No eliminar capacidades útiles sin justificación y autorización.

**Regla final: potencia por dentro, sencillez por fuera.**

Este anexo no autoriza por sí mismo cambios en código, datos, Supabase, ramas, commits, push, merge ni despliegues.

---

## PARTE C — DETALLES TÉCNICOS COMUNICADOS AL RECIBIR EL ANEXO

> Lo que hace falta para cumplir las decisiones del Anexo. No cambian ninguna decisión. Se tendrán en cuenta en la
> planificación técnica de las fases correspondientes.

### C1. OCR local (Anexo §2 · Fase 5)
- El reconocimiento local de fotos exige **una librería nueva**: la única dependencia nueva que se prevé para el rediseño.
  Se cargará **solo al importar** y no afectará al arranque de la aplicación.
- Para no contactar ningún servicio externo, **los archivos del idioma español (varios MB) se servirán desde la propia
  aplicación**. Este tipo de librería los descarga por defecto de un servidor externo.
- En el iPhone, el reconocimiento puede tardar **unos segundos por foto**.
- Los **PDF escaneados** se pasarán antes a imagen con `pdfjs-dist`, que ya está en el proyecto. Un PDF que lleve texto
  se puede leer directamente con esa misma librería.

### C2. Notificaciones con la aplicación cerrada (Anexo §3 · Fase 7)
Hacen falta cuatro piezas; dos dependen de Josué:
1. **Un service worker**, con una estrategia de actualización segura. El riesgo histórico del proyecto es que la app se
   quede servida en una versión vieja («la web sigue igual»; DEP-30 en `docs/03`).
2. **Unas claves de envío** de notificaciones (VAPID), guardadas por Josué en las variables de Vercel. Nunca en el código
   ni en el navegador.
3. **Una tabla de suscripciones con su SQL** y sus políticas RLS, que ejecuta Josué.
4. **Algo que dispare los avisos a su hora.** El plan gratuito de Vercel solo permite tareas programadas una vez al día;
   lo viable parece programarlo dentro de Supabase. Se confirmará en la Fase 7 antes de proponerlo.

**Requisitos del iPhone:** iOS 16.4 o posterior, JosStyle **añadida a la pantalla de inicio** como aplicación, y el
permiso pedido **desde un botón dentro de la aplicación instalada**.

### C3. Planificación de Fitness (Anexo §7 · Fase 7)
- **Fitness ya no va por semanas:** desde su rediseño, su plan son **rutinas cíclicas** (por ejemplo Push → Pull →
  Descanso).
- Para aprovecharlas, Horarios tendrá que **leer en cada fecha qué toca, sin copiar nada**, reutilizando el cálculo que
  ya existe en `src/lib/rutinasCiclicas.js` y `src/lib/tuPlan.js`.
- Lo mismo vale para las **rutinas de Imagen personal** (`src/lib/motorRutinas.js`).
- Cada integración respeta el modelo de datos de su módulo (Anexo §7).

### C4. Conflictos existentes (Anexo §4 · Fases 2 y 7)
- Hoy existe la opción **«Ponerlo igualmente»**, y la importación fuerza los choques (`aplicarImportacion` con
  `forzar: true`), así que **ya puede haber choques guardados**.
- Al migrar, esos choques **se marcarán para revisarlos, sin tocarlos**.
- A partir de ahí, «Ponerlo igualmente» desaparece y los choques nuevos se bloquean.

---

*Documento incorporado al repositorio el 2026-11-08 por autorización expresa de Josué, solo como documentación. No cambia
código, datos ni otros documentos.*
