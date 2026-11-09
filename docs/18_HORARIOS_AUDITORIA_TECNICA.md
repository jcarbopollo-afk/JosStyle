# 18 · Horarios — Auditoría técnica, inventario y protección (Fase 1 de 8)

> **Fase 1 del rediseño de Horarios.** Solo lectura: no se ha modificado código ni datos, no se ha ejecutado SQL, no se
> ha instalado nada y no hay commits, push, merge ni despliegue. El objetivo funcional está en
> **`docs/17_HORARIOS_REDISENO.md`** (Documento Maestro + Anexo, que prevalece + detalles técnicos C1–C4). Este documento
> describe **lo que hay** y **cómo llegar** a lo que pide aquél; no decide nada que no esté ya decidido.
>
> Fecha: 2026-11-08 · Rama `claude/horarios-rediseno` · Base `bf9bb46` (= `origin/main`) · `package.json` 3.161.3.

**Cómo leer las marcas** (el enunciado pide separar hechos, hipótesis y recomendaciones):

| Marca | Significado |
|---|---|
| **[EJECUTADO]** | Comprobado ejecutando el código real con datos inventados, en memoria, sin guardar nada. |
| **[CÓDIGO]** | Comprobado leyendo el código; no ejecutado. |
| **[FUENTE]** | Comprobado en documentación pública o en el registro de npm (enlace en el apartado). |
| **[HIPÓTESIS]** | Razonable, pero sin comprobar. Se dice cómo comprobarlo y en qué fase. |
| **[NO VERIFICADO]** | No se puede comprobar desde esta sesión (datos reales de Supabase, un iPhone, varios dispositivos). |
| **[RECOMENDACIÓN]** | Propuesta técnica para fases futuras. **No es una decisión**: la arquitectura se cierra en la Fase 2. |

---

## Índice

1. Resumen ejecutivo
2. Estado real
3. Inventario funcional
4. Mapa de archivos y arquitectura
5. Modelo de datos actual
6. Dependencias entre módulos
7. Motor temporal y conflictos
8. Repeticiones y excepciones
9. Auditoría móvil e interfaz
10. Viabilidad de las nuevas funciones
11. Auditoría de pruebas
12. Matriz de protección
13. Arquitectura futura
14. Estrategia de migración
15. Plan técnico de las 8 fases
16. Riesgos y cuestiones pendientes
17. Criterios de aceptación de la Fase 1

---

## 1. Resumen ejecutivo

- **El motor es grande y está bien probado por piezas; la pantalla solo deja usar una parte.** Horarios son
  unas 9 800 líneas en 14 librerías más una pantalla de 2 430 líneas (`src/views/HorarioView.jsx`). Sus 20 suites de Node
  pasan con **1 554 comprobaciones** [EJECUTADO]. Muchas capacidades —excepciones de un día (festivo, cancelación,
  añadido), semanas alternas, dar día a una columna, renombrar el horario, fechas de vigencia, material por asignatura—
  existen como funciones y **no tienen ningún control en pantalla** [CÓDIGO].
- **Hay 17 fallos de comportamiento reproducidos en esta rama** [EJECUTADO] (§7, §8, tabla P1–P17) y 13 más
  vistos en el código [CÓDIGO]. Los que más condicionan el rediseño:
  1. El ciclo de semanas A/B se configura pero **no se aplica** al resolver el día (P1).
  2. «Añadir día» crea una columna **sin día de la semana**, que nunca sale en ninguna fecha (P2).
  3. La cuadrícula pinta por **franjas**, no por horas: lo que queda fuera de las franjas **no se ve** (P3), y una clase de
     dos horas sale **dos veces** (P4). Esto choca de frente con el Anexo §10.
  4. **Cuatro reglas distintas de «choque»** que se contradicen (P5, P6, P7, P13).
  5. «Solo este día» **no valida nada** (P8, P9).
  6. El plan de estudio de **una fecha** crea una clase **semanal** (P10).
  7. Los avisos solo existen **con la pantalla Horario abierta**, y no hay service worker (C1, §10.3).
- **No hay agenda conjunta coherente** [CÓDIGO]. Cada vista suma los horarios a su manera:
  - **Semana** enseña un solo horario.
  - La **línea de Horario → Hoy** se filtra por el horario seleccionado.
  - **Día**, **Agenda**, **Inicio** y el **Calendario** suman todos los vigentes.

  El «Horario = agenda conjunta» del Documento Maestro no existe todavía como concepto.
- **Lo que piden `docs/17` y su Anexo es viable sin cambiar de plataforma**, con dos dependencias de Josué:
  - El **OCR local** es viable con `tesseract.js` (Apache-2.0). Habría que descargar unos 5 MB la primera vez, autoalojados
    y cargados bajo demanda [FUENTE].
  - El **PDF escaneado** ya se puede convertir en imagen con `pdfjs-dist` 4.10.38, que está instalado [CÓDIGO].
  - La **exportación a PDF e imagen** se puede hacer sin dependencias nuevas, con Canvas y un escritor de PDF mínimo
    [RECOMENDACIÓN].
  - Las **notificaciones push con la app cerrada** necesitan cuatro piezas nuevas: un service worker, claves VAPID, una
    tabla con SQL y un programador. Vercel Hobby solo permite crons diarios [FUENTE], así que el disparador viable es
    `pg_cron` + `pg_net` en Supabase [FUENTE]. Las claves VAPID y el SQL dependen de Josué.
  - El **Asistente por reglas** puede reutilizar el motor de conversación que ya existe (`motorConversacion.js`).
- **Lo más arriesgado de tocar no es la pantalla** sino estas piezas:
  - `resolverDia`, que alimenta Inicio, el Calendario, la mochila, los avisos y la analítica.
  - `normalizarHorarioTop`, porque lo que no conoce se borra en el siguiente guardado.
  - El contrato con Estudios (`asignaturaId`).
  - Las utilidades de fecha que comparten **Fitness y Sueño**: `DIAS_SEMANA` y `diaDeFecha` de `horario.js`, y `diasEntre`
    de `hoy.js`. Las importan 11 archivos de fuera.
- **Recomendación central** [RECOMENDACIÓN]:
  1. Sanear y unificar el núcleo temporal antes de la interfaz: una sola regla de choque, el ciclo aplicado, una
     validación común y pintar por horas.
  2. Separar en un archivo hoja las utilidades de fecha que usa Fitness, sin cambiar su firma.
  3. Versionar `horarioTop`, con una cadena de migraciones como la de Fitness.
  4. Guardar los borradores y las versiones **fuera** de la clave `horarioTop`, para no engordarla.

---

## 2. Estado real

### 2.1 Git (comprobado al empezar y al terminar)

| Comprobación | Resultado |
|---|---|
| Rama | `claude/horarios-rediseno` |
| `HEAD` | `bf9bb46b1236de0cbb542a729e431ef35004414a` |
| `origin/main` (tras `git fetch origin main`) | `bf9bb46…`: idéntico, nadie ha subido nada desde que se creó la rama |
| Cambios | Solo `?? docs/17_HORARIOS_REDISENO.md` (sin seguimiento), y este documento al terminar |
| `docs/17` | md5 `cdf54103952304e0d419f01339679479`, 481 líneas: **sin cambios** |
| Stash / diff de archivos versionados | Vacío / vacío |

### 2.2 Lo que hay en `main` relacionado con Horarios

- **El código de Horarios no ha cambiado desde el cierre de HT F12, AS F1/F2, GE F2 y E3 F5** [CÓDIGO]. La auditoría
  integral del 2026-11-07 se hizo sobre este mismo commit (`bf9bb46`). Todas sus referencias de línea se han vuelto a
  comprobar en esta rama y coinciden: `HorarioView.jsx` tiene 2 430 líneas, y siguen en su sitio las líneas 532, 1819,
  2094–2112, 2314–2318 y 2400.
- **Fitness se rediseñó y está en `main`** (PR #4). Su plan son **rutinas cíclicas de 1 a 30 días**, no semanas (§6.3).
- **Imagen personal** también está en `main` (PR #3). La rama `claude/imagen-personal-fase-a` **no se fusiona nunca**: lleva
  los commits de la PR #2 de chatbots y choca en 15 archivos.
- **La especificación literal de Horario Top** vive en `especificaciones/ESPECIFICACION_HORARIO_TOP.md` (11 614 líneas,
  12 fases HT). Es intocable. El rediseño de `docs/17` **la sustituye como objetivo funcional** donde la contradiga, por
  decisión de Josué. Se anotará en `docs/03` al cerrar la Fase 2.

### 2.3 Lo que esta auditoría no ha podido ver

- **Los datos reales de Josué en Supabase** [NO VERIFICADO]: cuántos horarios, bloques y excepciones tiene, cuánto ocupa
  `horarioTop`, si hay choques guardados o datos con `ciclo` o `grupo`. Solo se pueden ver con una consulta que él
  ejecute o con una sesión suya. Sin esos datos, la migración se diseña para **cualquier** forma válida y para los casos
  dañados que ya conoce el normalizador.
- **El aspecto y el tacto en su iPhone** [NO VERIFICADO].
- **La sincronización entre varios dispositivos** [NO VERIFICADO].

---

## 3. Inventario funcional

**Estados:**
- **Operativo**: funciona y se usa desde la pantalla.
- **Parcial**: existe, pero con fallos o a medias.
- **Inaccesible**: está en el motor, probado, pero ninguna pantalla lo llama.
- **Inexistente**: no hay código.

### 3.1 Frente a lo que pide `docs/17`

| Requisito (`docs/17`) | Estado | Dónde está o qué falta |
|---|---|---|
| Entrada Gestión → Organización → Horario | **Operativo** | `APPS_ORGANIZACION` (`agrupadores.js`), `case 'horario'` en `App.jsx` |
| Dos entradas: «Horario» (agenda conjunta) y «Mis horarios» | **Inexistente** | Hoy es una sola pantalla con chips «Mis horarios» si hay más de uno (`HorarioView` 2206–2223) |
| Agenda conjunta de todos los activos | **Parcial** | `resolverDia` suma los vigentes, pero cada vista decide si filtra (§1). No hay una vista «todo junto» coherente |
| Varios horarios activos a la vez | **Operativo en el motor** | `horarioVigente`. Sin control para desactivar sin archivar |
| Estados activo / desactivado / archivado | **Parcial** | Campos `activo` y `archivado`. Solo hay UI para archivar y restaurar; ninguna para «desactivado» [CÓDIGO] |
| Fechas de vigencia opcionales del horario | **Inaccesible** | `desde`/`hasta` + `actualizarMetadatos` |
| Vigencia por actividad | **Inexistente** | Ni `bloque` ni `actividad` tienen `desde`/`hasta` |
| Bloquear los conflictos nuevos | **Inexistente** | Existe «Ponerlo igualmente» (`forzar`), y `aplicarImportacion` fuerza siempre |
| Conservar y revisar los conflictos históricos | **Inexistente** | No hay marca ni lista de revisión |
| Comprobar conflictos antes de activar un horario | **Inexistente** | `restaurarHorario` y `duplicarHorario` no comprueban (P14) |
| Creación manual | **Parcial** | Plantilla → celda de franja → nombre. Sin hora libre al crear; «Desde cero» no produce días útiles (P2) |
| Creación con Asistente por reglas | **Inexistente** | `horarioTop` está en `CLAVES_QUE_NINGUN_ASISTENTE_LEE` |
| Importación (foto, PDF, texto) con borrador | **Inexistente** | Solo existe pegar una copia JSON propia. `previsualizarImportacion` existe sin pantalla |
| 3 alcances de edición (solo este día · este y siguientes · todas) | **Parcial** | `ALCANCES` tiene 2 (`solo_este_dia`, `todos`), y el primero no valida (P8, P9) |
| Categorías personalizadas (nombre + color, opcionales) | **Inexistente** como tal | `actividad.tipo` es un catálogo cerrado; los `grupos` (HT F5) no tienen pantalla |
| Borradores con autoguardado | **Inexistente** | Todo se guarda al instante sobre el horario real |
| Versiones recuperables | **Inexistente** | Solo el Deshacer global de 10 pasos, en memoria más `app_data.historial` |
| Papelera para horarios eliminados | **Inexistente** | No está en `CATALOGO_PAPELERA`; borrar es «permanente» |
| Exportar a PDF e imagen (día o semana) | **Inexistente** | No hay generador de PDF ni de imagen para esto |
| Un bloque de 11:00 a 13:00 = un solo bloque visual | **Incumplido** | Se pinta una vez por franja (P4) |
| Sin cruzar la medianoche | **Cumplido** | `duracionMinutos` rechaza fin ≤ inicio (P17) |
| Vista diaria principal en el móvil y semana en el ordenador | **Parcial** | Existen Hoy, Día, Semana y Agenda, pero la entrada por defecto es «Hoy» (panel cargado) y la Semana se desplaza en horizontal |
| Push con la app cerrada | **Inexistente** | `notificaciones.js` usa `new Notification` con la app abierta y no hay service worker (DEP-30) |
| Sugerencias de vínculo con otros módulos, eligiendo él | **Parcial** | Solo Estudios (`sugerencias` · «de Estudios»). Fitness e Imagen personal: no |

### 3.2 Capacidades del motor sin pantalla

| Capacidad | Función |
|---|---|
| Excepción cancelar / añadir / día libre | `crearExcepcion` con `cancelado`, `anadido` o `dia_libre`; `esDiaLibre` |
| Semanas alternas por bloque | `bloque.recurrencia { clase: 'alternas', ancla }` |
| Ciclo A/B por columna | `guardarCiclo` (sí tiene pantalla), `columna.grupo` (sin control), `columnasDeLaFecha` (sin uso) |
| Editar una columna (día, nombre, grupo) | `editarColumna`: no se llama desde ninguna pantalla |
| Metadatos del horario | `actualizarMetadatos` |
| Duplicar con fecha de inicio | `duplicarHorario(…, { desde })`: la pantalla no la pasa |
| Selección múltiple, reordenar de golpe, bloquear una columna | `seleccion*`, `reordenar*`, `bloquearColumna` |
| Visibilidad por vista, ocultar, grupos y padre de una actividad | `visibilidad`, `ocultarActividad`, `crearGrupo`, `padreId` |
| Material por asignatura | `actividad.material`, `crearEnlaceMaterial` |
| Importar desde filas | `previsualizarImportacion`, `aplicarImportacion` |
| Contexto para IA | `contextoIA` y otros: sin uso (y DA-09 lo descarta como IA) |
| Configuración y ajustes de avisos | `DEFAULT_CONFIG_HORARIO`, `ajustesAvisos`: **ni se escriben ni sobreviven a la carga** (C4) |

### 3.3 Lo operativo que conviene conservar (Anexo §12: «conservar las funciones útiles»)

- Vistas Hoy, Día, Semana y Agenda.
- Crear, editar, mover, duplicar y borrar bloques.
- Duplicar y vaciar un día.
- Franjas y generar franjas.
- Archivar y restaurar.
- Ficha de actividad (profesor, aula, notas).
- Copia JSON.
- Densidad y zoom por aparato.
- Mochila derivada (HT F7).
- Tablón y automatizaciones (HT F8).
- Plan de estudio (HT F9): sin el fallo P10.
- Centro de avisos (HT F10).
- Informe (HT F11).
- Asignaturas compartidas con Estudios (AS F1/F2).

**Ninguna de estas funciones se elimina sin la autorización de Josué.** Simplificar significa moverlas o esconderlas
tras un nivel, no quitarlas.

---

## 4. Mapa de archivos y arquitectura

**Columna «Futuro»** [RECOMENDACIÓN, a cerrar en la Fase 2]: **M** = mantener tal cual · **A** = adaptar · **S** = sustituir.

| Archivo | Líneas | Responsabilidad | Funciones clave | Depende de | Riesgo | Futuro |
|---|---|---|---|---|---|---|
| `src/lib/horario.js` | 1 147 | Núcleo: tipos, entidades, normalizadores, motor del día, conflictos, huecos, borrados, resumen | `DIAS_SEMANA`, `diaDeFecha`, `normalizarHorarioTop`, `resolverDia`, `conflictosDelDia`, `seSolapan`, `lineaDelDia`, `resumenHorario` | `helpers.js` | **Muy alto**: lo importan Fitness, Sueño, Inicio y el Calendario | **A** (sacar las utilidades de fecha a una hoja; aplicar el ciclo; una regla de choque) |
| `src/lib/horarioEditor.js` | 746 | Operaciones del editor, rejilla, vistas, importación | `crearDesdePlantilla`, `crearBloqueRapido`, `conflictosCon`, `editarBloque`, `ALCANCES`, `rejillaSemana`, `vistaDia`, `vistaAgenda` | `horario.js`, `asignaturas.js` | Alto | **A** (3 alcances, validación común, rejilla por horas) |
| `src/lib/horarioEstructura.js` | 700 | Ciclos, impactos, validación estructural, franjas, duplicar y archivar, plantillas propias, ajustes visuales | `semanaDelCiclo`, `columnasDeLaFecha`, `duplicarHorario`, `archivarHorario`, `regenerarFranjas`, `leerVisual` | `horario.js` | Medio | **A** |
| `src/lib/horarioDatos.js` | 624 | Materiales, configuración, mochila antigua, validaciones, segunda normalización | `normalizarDatos`, `validarBloque`, `detectarConflicto`, `COLECCIONES_PAPELERA_HORARIO` | `horario.js` | Medio (dos normalizadores) | **A** (un solo normalizador) |
| `src/lib/actividades.js` | 658 | Actividades como entidades, ficha, visibilidad, grupos | `normalizarActividad`, `fichaDe`, `archivarActividad`, `crearGrupo` | `horario.js` | Medio | **A** (categorías) |
| `src/lib/hoy.js` | 508 | Contexto temporal de un día | `contextoTemporal`, `agendaCompleta`, `tiempoLibre`, **`diasEntre`** | `horario.js` | **Muy alto** (`diasEntre` lo usa Fitness) | **M** + arreglo de P11 |
| `src/lib/mochila.js` | 666 | Mochila derivada (HT F7) | `mochilaDelDia`… | `horario.js` | Bajo | **M** (+ podar, C6) |
| `src/lib/automatizaciones.js` | 442 | Tablón y automatizaciones (HT F8) | — | `hoy.js` | Bajo | **M** |
| `src/lib/planificador.js` | 532 | Plan de estudio y sobrecarga (HT F9) | `aplicarPlan` | `horario.js`, `hoy.js` | Medio (P10) | **A** (excepción `anadido`) |
| `src/lib/avisosHorario.js` | 423 | Qué avisar y centro de avisos (HT F10) | `avisosAMandar`, `registrarEnviado` | `hoy.js` | Medio | **A** (calcular la cola para el push) |
| `src/lib/analiticaHorario.js` | 369 | Informe (HT F11) | `informe`, `recomendaciones` | `hoy.js` | Bajo | **M** |
| `src/lib/horarioTop.js` | 308 | Puerta única, exportar e importar JSON, auditoría | `exportarHorario`, `importarHorario` | todos | Bajo | **A** (versión de esquema) |
| `src/lib/misHorarios.js` | 152 | Secciones y borrado de verdad | `impactoEliminarHorario`, `eliminarDeVerdad` | `horario.js` | Medio | **S** por la papelera |
| `src/views/HorarioView.jsx` | 2 430 | **La única pantalla** (15 componentes) | `CrearHorario`, `Cuadricula`, `NuevoBloque`, `PanelBloque`, `MenuColumna`, `PanelFranjas`, `HoyView`, `FichaActividad`, `PanelAvanzado`… | todo lo anterior | Alto (efecto durante el pintado C3, borrado propio C2) | **S** por pantallas nuevas en archivos separados; se reutilizan sus paneles útiles |
| `src/lib/agendaDia.js` | 215 | Agenda de un día del Calendario | `agendaDelDia` | `hoy.js` | Medio (P13) | **A** (usar la regla única de choque) |
| `src/lib/centroDelDia.js` | 217 | «Hoy · N eventos» de Inicio | `resumenDelDia` | `hoy.js` | Alto | **M** (lee de la agenda conjunta) |
| `src/lib/calendarioMes.js`, `calendarioIntegracion.js` | — | Mes del Calendario | — | — | — | **A** si Josué quiere las clases en el mes (C11, pendiente) |
| `src/lib/resumenesHub.js` | — | Líneas de las tarjetas de Organización | `resumenHorario` | `horario.js` | Bajo | **M** |
| `src/lib/usosAsignatura.js` | — | Quitar y eliminar asignaturas sin huérfanos | `limpiarHorarioDeAsignatura` | `horario.js` | Alto (contrato AS F2) | **M** |
| `src/App.jsx` | 4 045 | Estado, carga, guardado y cableado | 610 estado · 714 carga · 887 normaliza · 2185 `snapshotAndSave` · 2377 limpieza · 3018 Inicio · 3133 Estudios · 3303–3330 Horario · 3401 Calendario | — | Alto (regla 4: hooks antes de los `return`) | **A** (claves nuevas, cola de push) |

**Flujo actual** [CÓDIGO]:

```
HorarioView ─ función pura ─▶ estado nuevo ─ onCambiar ─▶ App.snapshotAndSave({ horarioTop })
     ▲                                                     ├─ setHorarioTop
     │                                                     ├─ Deshacer global (10 copias de TODOS los módulos → app_data 'historial')
     │                                                     └─ saveData(uid, 'horarioTop', todo) → upsert de la fila entera
     └──── resolverDia / rejillaSemana / contextoTemporal (todo se deriva al pintar; nada derivado se guarda)
Carga: loadData('horarioTop') → normalizarHorarioTop → setHorarioTop
```

---

## 5. Modelo de datos actual

### 5.1 Hechos demostrados en el código

**Una fila de `app_data` con `key = 'horarioTop'`**, en JSON, con listas planas [CÓDIGO]:

```
horarioTop = {
  horarios:    [{ id, nombre, tipo, periodo, descripcion, desde, hasta, porDefecto, activo, archivado, icono, color,
                  zonaHoraria, ciclo({semanas, ancla, nombres}|null), creadoEn, actualizadoEn,
                  columnas: [{ id, nombre, corto, dia(1-7|null), posicion, visible, color, icono, tipo, bloqueada, grupo }],
                  filas:    [{ id, inicio, fin, etiqueta, posicion, visible, tipo('hora'|'etiqueta'|'separador'), color }] }],
  actividades: [{ id, nombre, tipo, color, icono, asignaturaId, material[], ubicacion, persona, corto, descripcion, prioridad,
                  alias[], etiquetas[], favorita, estado('activa'|'archivada'|'oculta'), visibilidad{horario,hoy,calendario,mochila},
                  notas, grupoId, padreId, origen, origenId, creadoEn, actualizadoEn }],
  bloques:     [{ id, horarioId, columnaId, actividadId, inicio, fin, titulo, ubicacion, notas, etiquetas[], colorPropio,
                  iconoPropio, filaId, descripcion, posicion, recurrencia({clase:'siempre'}|{clase:'alternas', ancla}),
                  creadoEn, actualizadoEn }],
  excepciones: [{ id, fecha, tipo('cancelado'|'modificado'|'anadido'|'dia_libre'), bloqueId, horarioId,
                  cambios{inicio, fin, actividadId, titulo, ubicacion}, motivo }],
  grupos[], materiales[], enlacesMaterial[], mochila[], mochilas[], inventario{}, kits[], dependencias{}, reglas[],
  completadas[string], automatizaciones[], historialAuto[], avisos[]
}
```

**Relaciones** [CÓDIGO]:
- Un bloque apunta a su horario (`horarioId`), a su columna (`columnaId`), a su actividad (`actividadId`) y a una fila
  (`filaId`, solo informativo).
- Una actividad apunta a una asignatura de **Estudios** con `asignaturaId`, y **el nombre lo manda Estudios**
  (`nombreDeActividad`).
- Una excepción apunta a su bloque y a su horario.
- El **día de la semana vive en la columna** (`columna.dia`), no en el bloque. Un bloque en una columna sin día no existe en
  ninguna fecha (P2).
- Las horas son **`HH:MM` dentro del mismo día**.

**Identificadores**: `uid()` aleatorio. Los eventos resueltos no tienen id propio; llevan `bloqueId` [CÓDIGO].

**Tamaño** [EJECUTADO]: un horario «Colegio» de 5 días × 6 franjas, con 30 clases y 10 actividades, ocupa **16,5 KB**
(unos 344 bytes por bloque). Un horario completo de instituto cabe holgadamente en una fila jsonb. Se sumará a eso la
mochila, las completadas y los avisos, que crecen (C6).

**Versión de esquema** [CÓDIGO]: **no hay ninguna**, y tampoco cadena de migraciones (Fitness sí tiene las dos:
`migrarFitness`, `VERSION_FITNESS`).

**Normalización** [CÓDIGO]:
- `normalizarHorarioTop` (`horario.js`) es la puerta de carga. Existe además `normalizarDatos` (`horarioDatos.js`), y un
  campo que solo conozca uno de los dos se pierde. Ejemplos: `config` y `ajustesAvisos` (C4).
- `normalizarHorarioTop` **descarta los bloques sin `horarioId` o sin `columnaId`**, sin apartarlos a ningún sitio.
- Una fila sin horas válidas se rellena con 08:00–09:00.
- `normalizarExcepcion` **cambia una fecha inválida por la de hoy** [EJECUTADO, P12]: «2026-13-45x» → «2026-11-08». Un
  `dia_libre` dañado vaciaría el horario de hoy.

**Persistencia** [CÓDIGO]:
- `saveData` hace un upsert de la fila entera, con cola ordenada por clave. Lo pendiente se queda en memoria.
- La carga fallida bloquea la escritura (MS F16).
- Gana el último que escribe.
- Las preferencias visuales van a `localStorage['josstyle.horario.visual']`.
- La papelera global (`papelera.js`) guarda **una copia del elemento** con sus dependientes (`conArrastrados`) y lo
  conserva 30 días. **Horarios no está registrado en ella** (C5).
- **`horarioTop` no está en `currentState`** ni en la exportación global.

### 5.2 Datos reales sin verificar

- **No se ha leído ni un byte de Supabase** [NO VERIFICADO]. No se sabe:
  - Cuántos horarios activos o archivados tiene Josué.
  - Si tiene **choques guardados**. Es probable [HIPÓTESIS], porque «Ponerlo igualmente» existe desde HT F3 (C4 de `docs/17`).
  - Si usó «Aplicar plan» (P10).
  - Si tiene columnas sin día (P2), excepciones con fecha inválida, ciclos configurados que no funcionan, o una `mochila`
    y unas `completadas` grandes.
- **Cómo comprobarlo sin tocar nada** [RECOMENDACIÓN]: en la Fase 4, antes de migrar, una función de diagnóstico **de
  solo lectura** que corra en su aplicación y le enseñe el recuento (como `auditarDatosFitness`). O, si él quiere, una
  consulta `select` de solo lectura que ejecute en el SQL Editor y cuyo resultado pegue.

### 5.3 Hipótesis

- [HIPÓTESIS] Lo más probable es que tenga **un** horario escolar creado desde la plantilla «Colegio», con clases sin
  excepciones. Es el único camino cómodo de la pantalla actual. Hay que comprobarlo antes de la migración (Fase 4).
- [HIPÓTESIS] Ningún dato suyo usa `recurrencia: alternas` ni `columna.grupo`, porque la pantalla no los escribe. El ciclo
  sí puede estar guardado, porque tiene pantalla.

---

## 6. Dependencias entre módulos

### 6.1 Tabla

| Origen → Destino | Qué se pasa | Mecanismo | Riesgo |
|---|---|---|---|
| Estudios → Horario | `estudios.asignaturas` | Prop `asignaturas` (App 3307); `nombreDeActividad`; `buscarAsignaturaDelCatalogo` | **Alto** |
| Horario → Estudios | Asignatura nueva escrita en el horario | `crearBloqueRapido` → `asignaturaNueva` → `onCambiarConAsignatura`, **en una sola llamada** (App 3321; E3 F26) | **Alto** |
| Estudios → Horario (borrar) | Limpieza en cascada | `deleteAsignatura` → `limpiarHorarioDeAsignatura` (App 2377); `usosDeAsignatura` avisa antes | **Alto**. ⚠️ Restaurar la asignatura **no devuelve sus clases** (C9) |
| Estudios → Horario (lectura) | Exámenes | Plan, sobrecarga y ficha | Medio |
| Productividad → Horario | Tareas | Lectura, `toggleTarea`, reprogramar | Medio |
| Calendario → Horario | Eventos | `agendaCompleta` | Medio |
| Horario → Calendario (día) | Clases del día | `CalendarView` 1271 → `agendaDelDia` | Medio |
| Horario → Calendario (mes) | — | **No existe** (C11) | — |
| Horario → Inicio | «N eventos» | `centroDelDia.resumenDelDia` (App 3018) | **Alto** |
| Horario → Hub de Organización | «N clases hoy» | `resumenesHub.resumenHorario` | Bajo |
| Horario → Notificaciones | Avisos | `avisosAMandar` → `notificarSiCorresponde` dentro de `HorarioView` | Medio. Solo con la pantalla abierta |
| Horario → Buscador | Palabras clave | `indiceBusqueda.js` | Bajo |
| Horario → Asistentes | — | `CLAVES_QUE_NINGUN_ASISTENTE_LEE` | — |
| **Horario → Fitness y Sueño** | **Utilidades**, no datos: `DIAS_SEMANA`, `diaDeFecha`, `diasEntre` | `import` en 11 archivos: `tuPlan`, `rutinasCiclicas`, `planificacionSemanal`, `actividadEntrenamiento`, `migracionFitnessV2`, `cumplimientoFitness`, `plantillas`, `disciplinaFitness.jsx`, `cumplimientoFitness.jsx`, `sueno`, `usosAsignatura` | **Muy alto** |
| Horario ↔ Imagen personal | — | **Ninguna** hoy | — |
| Horario ↔ Mochila | Material del día | `mochila.js` (deriva de `resolverDia` + material de la actividad) | Bajo |

### 6.2 Mapa

```
                 Estudios ──asignaturaId──▶ [ horarioTop ] ◀──onCambiar── HorarioView
            (asignaturaNueva, 1 llamada)        │
 Productividad, Calendario ──lectura──▶  resolverDia ──▶ hoy.js ──▶ HorarioView·Hoy, mochila, avisos, plan, informe
                                                │           └──▶ agendaCompleta ──▶ centroDelDia (Inicio), agendaDia (Calendario día)
                                                └──▶ resumenHorario ──▶ resumenesHub
 horario.js { DIAS_SEMANA, diaDeFecha } + hoy.js { diasEntre } ──▶ Fitness (9 archivos) y Sueño
 notificaciones.js (A4) ◀── avisosHorario ── (solo con HorarioView montada)
```

### 6.3 Fitness: cómo sabe qué toca en una fecha [CÓDIGO]

- **No va por semanas.**
  - Una rutina cíclica de 1 a 30 días (`rutinasCiclicas.js`, `crearRutinaCiclica`, `DURACION_RUTINA`) se activa en una
    fecha.
  - `posicionEnCiclo(n, inicio, fecha)` dice qué día del ciclo cae cada fecha.
  - `tuPlan.js` → **`planificadoEnFecha(fecha, contexto)`** devuelve `{ sinPlan, libre, descanso, nombre, diaId, planId,
    origen, planNombre, anterior, indice }`.
  - Respeta los **tramos anteriores** (`planesAnteriores`): el pasado no se reescribe.
  - Devuelve `null` cuando no se sabe.
- **El cumplimiento** (completo, perdido, recuperado…) sale de `cumplimientoFitness.estadoDeFecha`.
- **Una sesión de Fitness no tiene hora prevista**: el plan dice *qué* toca un día, no *a qué hora*.
  - Consecuencia [RECOMENDACIÓN]: Horarios solo puede **mostrar** «hoy toca Push» como elemento del día sin hora, o, si
    Josué lo coloca, una franja suya que **se refiere** a lo que diga Fitness ese día («Entrenamiento: lo que toque»).
  - Nunca se copia la rutina ni se materializan sesiones.
  - Si Horarios no encuentra el plan (`null`), dice «sin plan» y no inventa.
- **Lectura sin escribir**: basta con `planificadoEnFecha` con el contexto que ya construye `tuPlan(fitness, { hoy })`.
  Horarios no necesita importar nada de la sesión en vivo.

### 6.4 Imagen personal [CÓDIGO]

- Rutinas por módulo: piel, pelo, barba, cuerpo, manos y pies, sonrisa.
- Comparten `motorRutinas.js`:
  - `tocaEnFechaGenerico(rutina, fecha, tipoDe)` admite frecuencias `diaria`, `dias`, `cada_x` y personalizada. Sin `desde`,
    `cada_x` no toca: no se inventa.
  - `eventosDeRutinas({ rutinas, tipoDe, desde, hasta, prefijo, origen })` ya genera **eventos derivados** con la forma del
    Calendario.
- Las de piel guardan **`hora`** (`HH:MM` o `null`) y `momento` para su recordatorio (`rutinasPiel.js` 175–182).
- [RECOMENDACIÓN] Horarios puede **leer** `eventosDeRutinas` como el Calendario, con su `origen`, y enseñarlas en la agenda
  conjunta **solo si Josué lo activa** (Anexo §7: «elegir el elemento existente o crear uno independiente»). Nunca las
  copia a `bloques`.

### 6.5 Sueño [CÓDIGO]

- `sueno.js` importa `DIAS_SEMANA` y `diaDeFecha` y guarda por noche `horaDormir` y `horaDespertar` (registro, no plan).
- No hay una «hora objetivo de dormir» guardada en Sueño.
- [RECOMENDACIÓN] Ninguna integración de datos con Sueño en este rediseño. Solo hay que **proteger** las utilidades
  compartidas.

---

## 7. Motor temporal y conflictos

### 7.1 `resolverDia(estado, fecha, { asignaturas, horarioId })` [CÓDIGO]

1. Toma las excepciones de la fecha.
2. Un `dia_libre` sin `horarioId` vacía todos los horarios ese día; con `horarioId`, solo ese.
3. Recorre los horarios vigentes (`activo`, no `archivado`, dentro de `desde`/`hasta`). Por cada columna **visible con
   `dia === diaDeFecha(fecha)`** toma sus bloques:
   - `cancelado` quita el bloque.
   - `alternas` lo quita si esa semana no toca.
   - `modificado` aplica los cambios.
4. Añade los `anadido`.
5. Ordena por inicio.
6. **No aplica `horario.ciclo` ni `columna.grupo`** [EJECUTADO, P1]: con un ciclo de 2 semanas y «Lunes A»/«Lunes B», el
   lunes A da `["Física", "Química"]` y 1 choque, mientras `columnasDeLaFecha` devolvería solo «Lunes».
7. Sin `horarioId`, suma todos los vigentes.

### 7.2 Las cuatro reglas de choque [EJECUTADO]

| # | Función | Regla | Reproducido en esta rama |
|---|---|---|---|
| A | `horarioEditor.conflictosCon` | Mismo horario **y** misma columna, solape, sobre lo **guardado** | P6: dos horarios a la misma hora → el editor no da error; `conflictosDelDia` = 1. P7: alternas → choque falso |
| B | `horario.conflictosDelDia` | Todos los pares del día resuelto | Cruza horarios; suma A y B del ciclo (P1) |
| C | `rejillaSemana`, `celda.conflicto` | Más de un bloque **en la misma franja** | P5: 08:00–08:30 y 08:30–09:00 → «Choque» en la franja de las 08:00, mientras `resumenEditor.conflictos` = 0 |
| D | `agendaDia.agendaDelDia`, `solapado` | Mismo minuto de inicio | P13: 08–09 y 08:30–09:30 → 0 marcados; `conflictosDelDia` = 1 |

- `seSolapan(a, b) = ia < fb && ib < fa`. Los extremos que se tocan **no** chocan: es lo correcto y hay que conservarlo.
- No hay márgenes ni desplazamientos.

### 7.3 Lo que pide `docs/17` y lo que eso exige [RECOMENDACIÓN]

- **Una sola función de choque**. Nombre provisional: `choquesDelDia(estado, fecha, opciones)`.
  - Trabaja sobre el día **resuelto**, con el ciclo aplicado, alternas, excepciones y la vigencia de cada actividad.
  - Cruza **todos los horarios activos**, como la agenda conjunta.
  - Las otras cuatro reglas pasan a llamarla. La de la rejilla (C) deja de existir como regla propia, porque pintar por
    horas hace innecesaria la noción de «dos en una franja».
- **Bloquear lo nuevo**: crear, editar, mover, duplicar, importar, aplicar un plan, activar o restaurar un horario.
  - Todos comprueban **los días afectados en su rango de vigencia** y se niegan con la frase del choque.
  - `forzar` desaparece de la interfaz.
  - ⚠️ Un horario **sin fecha de fin** se comprueba como regla semanal (y por ciclo), no fecha a fecha hasta el infinito:
    basta con la combinación columna-día × semana del ciclo, más las excepciones con fecha.
- **Conservar lo histórico** (Anexo §4):
  - Los choques que ya existan al migrar **no se tocan**. Se identifican en el momento con la misma función: no hace falta
    guardarlos, porque se derivan.
  - Se guarda, como mucho, una marca de **«revisado»** por pareja, para no volver a molestar.
  - Se enseñan en una lista de revisión con «resolver a mano» (mover, acortar, cancelar un día).
  - Nunca se resuelven solos.

### 7.4 Otros fallos del motor temporal [EJECUTADO]

| # | Fallo | Prueba en esta rama |
|---|---|---|
| P3 | Una clase fuera de las franjas no está en la rejilla | «Tarde» 15–16 con franjas 08–14 → rejilla `false`, `resolverDia` `true` |
| P4 | Una clase de 2 horas se pinta 2 veces | «Doble» 10–12 → 2 veces |
| P10 | El plan de una fecha crea una clase semanal | Aplicado para el lunes 9 → aparece también el 16 |
| P11 | `tiempoLibre.descansos` siempre vale 0 | El evento resuelto no lleva `tipo` (auditoría del 11-07) |
| P16 | «Reunión» y «reunion» son dos actividades | 2 actividades |
| P17 | Sin medianoche | «Faltan las horas de esa franja.» (correcto según el Anexo §10, pero **el mensaje es engañoso**) |

---

## 8. Repeticiones y excepciones

### 8.1 Lo que hay [CÓDIGO]

- La regla de repetición **es la columna**: cada semana, el día `columna.dia`.
- Variantes: `bloque.recurrencia: alternas` (cada dos semanas desde un ancla) y el ciclo por columnas (que no se aplica,
  P1).
- **Excepciones** guardadas por fecha: `cancelado`, `modificado`, `anadido`, `dia_libre`.
- **Alcances** de edición: `ALCANCES = { SOLO_ESTE_DIA, TODOS }`, sin valor por defecto (HT F3): sin alcance no se escribe.
  `SOLO_ESTE_DIA` crea un `modificado` **sin validar** [EJECUTADO]:
  - P8: 25:00 se guarda; la clase sale como «cambiada» con la hora vieja.
  - P9: 10:00–09:00 se guarda tal cual.
- **No hay vigencia por bloque ni por actividad**.

### 8.2 Los tres alcances del Anexo §5 [RECOMENDACIÓN]

| Alcance | Cómo se implementa sin materializar ocurrencias (regla 11) |
|---|---|
| **Solo este día** | Una excepción `modificado` o `cancelado` con fecha, como ahora, **con la misma validación** que lo demás (horas, orden, choque ese día) |
| **Este día y los siguientes** | **Partir la serie**: el bloque original recibe `hasta = día − 1` y nace un bloque nuevo con `desde = día` y los cambios. Las excepciones posteriores a esa fecha se mueven al bloque nuevo |
| **Todas las repeticiones** | Editar el bloque. Las excepciones que dejen de tener sentido (un `modificado` con la hora antigua) se **avisan**, no se borran solas |

- Para esto, **el bloque necesita `desde`/`hasta`**: es la «vigencia por actividad» del Anexo §5.
  - Son campos nuevos del bloque, nacen vacíos, `resolverDia` los respeta, y van con su línea en el normalizador (regla 5).
  - Las fechas son **locales** (`fechaLocalISO`), nunca `toISOString` (lección repetida seis veces en el proyecto).
- **«La actividad gestiona sus propias fechas»**: la vigencia se edita desde la ficha y vale para todos los bloques de esa
  actividad, o para un bloque concreto si se elige así. Esto se cierra en la Fase 2.
- **Arreglos imprescindibles en el camino**:
  - El ciclo A/B aplicado en `resolverDia`. Antes: P1, prueba que lo cubra.
  - P10: el plan crea una excepción `anadido` con su fecha.
  - P12: una excepción con fecha inválida se **aparta**, no se muda a hoy.

---

## 9. Auditoría móvil e interfaz

**[CÓDIGO]** salvo donde se dice.

| Aspecto | Lo que hay | Problema para el rediseño |
|---|---|---|
| Entrada | Pestaña **Hoy** (panel cargado: ahora, siguiente, día, pendiente, 2 mochilas, tablón, automatizaciones, plan, avisos, informe) | El Anexo §11 pide la **vista diaria** como principal y sencilla |
| Semana | Cuadrícula con la columna de horas fija; columnas de 92 px con más de 5 días; desplazamiento horizontal | El Anexo §11 pide evitarlo en el móvil. Se mantiene en el ordenador |
| Pintado | Por franjas (P3, P4, P5) | El Anexo §10 pide un bloque por actividad, por horas |
| Crear | Tocar una celda de franja vacía (opacidad 0,35, no parece tocable) → nombre → horas de la franja | Sin hora libre al crear |
| Horas | `TextInput` de texto en `PanelFranjas` y `PanelBloque`; `type="time"` solo en «generar franjas» (1718–1719) | En el iPhone sale el teclado normal. Incoherente |
| Vocabulario | «Franja», «Columna», «Modo edición», «Todos los días iguales», «Opciones avanzadas» | Vocabulario interno |
| Dos «Hoy» | La pestaña Hoy y el botón Hoy (vista Día) | Confusión |
| Tamaños | Texto de 9–11 px en la cuadrícula; el ⋮ de las columnas con `p-0.5` | Por debajo de 44 px (EH F42) |
| Accesibilidad | `aria-label` en celdas y bloques; el choque con icono y palabra | Se conserva |
| Efectos en el pintado | `MenuColumna` borra una columna vacía **durante el render** (532) | Se elimina al rehacer |
| Movimiento | Usa clases del Motion System | Las pantallas nuevas usan `ListaAnimada`, `Plegable`, `CambioDeContenido`, `AsaHoja`, `useDialogoAccesible`… (sellado F20) |

- **Banco de renderizado** [EJECUTADO]: 120 casos de Horarios pintan sin errores: `HorarioView` (sin horario, recién
  creado, con clases, con un choque, con excepción, semana completa, dos horarios, archivados…), `HoyView`, `PanelAvanzado`
  y `FichaActividad`.
- **En un iPhone** [NO VERIFICADO]: ni el desplazamiento, ni los toques, ni el teclado. Se pide a Josué al cerrar las
  fases con interfaz (R1).

---

## 10. Viabilidad de las nuevas funciones

### 10.1 Asistente por reglas (Fase 6)

- **Existe la infraestructura** [CÓDIGO]: los chatbots deterministas de la Fase 2 de asistentes.
  - El núcleo `motorConversacion.js`, que da léxico con tolerancia a erratas, aclaraciones con `origen` y botones que
    caducan.
  - `fechasConversacion.js`, que entiende fechas y rangos en español.
  - El registro `asistentesModulos.js` (`ASISTENTES`, `MATRIZ_CANDIDATOS`, datos congelados por módulo).
  - Cinco asistentes de modelo: Sueño, Fitness, Nutrición, Estudios y Productividad.
  - Reglas que hay que respetar: el chat no importa `ui.jsx`, `ai.js` ni `supabase.js`, y **no guarda nada**.
- **Lo que falta**:
  - Un intérprete de **órdenes de creación**, no solo de preguntas. Por ejemplo: «Mates lunes y jueves de 8 a 9», «el
    viernes no hay clase», «mueve inglés a las 10».
  - Su salida es una **propuesta** (borrador) que pasa por la misma validación y el mismo detector de choques, con vista
    previa, y que solo se escribe al confirmar (regla 7, `confirmado: true`).
  - Cuando falte información, **pregunta**, empezando por el alcance, que no tiene valor por defecto.
- **Restricciones**:
  - DA-09 y el Anexo §1: sin IA generativa ni coste por petición, y el nombre es «Asistente», nunca «IA».
  - Hay que quitar `horarioTop` de `CLAVES_QUE_NINGUN_ASISTENTE_LEE`, darle sus claves (`datosParaAsistente`) y su fila
    en `MATRIZ_CANDIDATOS`.
  - ⚠️ El chat **no escribe**: la escritura la hace la pantalla del borrador, no el asistente. Así se mantiene la regla
    «el chat no guarda nada».
- **Viabilidad**: alta [RECOMENDACIÓN]. El riesgo es entender mal, y lo mitigan la previsualización obligatoria y las
  preguntas.

### 10.2 OCR local (Fase 5)

**Hechos del registro de npm** (consultado el 2026-11-08, sin instalar) [FUENTE]:

| Paquete | Versión | Licencia | Tamaño relevante |
|---|---|---|---|
| `tesseract.js` | 7.0.0 | Apache-2.0 | 1,4 MB desempaquetado (la librería y el *worker*) |
| `tesseract.js-core` | 6.1.2 | Apache-2.0 | `tesseract-core-simd-lstm.wasm` **2,87 MB** (más 125 KB del cargador). La versión no SIMD pesa lo mismo |
| `@tesseract.js-data/spa` | 1.0.0 | MIT | `4.0.0_best_int/spa.traineddata.gz` **2,10 MB**; `4.0.0/spa.traineddata.gz` 8,36 MB |
| `scribe.js-ocr` | 0.18.1 | **AGPL-3.0** | 47 MB. **Descartado por la licencia** |

- **Primera importación**: unos **5 MB** (WASM + español `best_int`). Las siguientes salen de la caché del navegador.
- `tesseract.js` permite indicar `workerPath`, `corePath` y `langPath` [HIPÓTESIS: comprobar en la Fase 5 con la v7].
  Con eso, **todo se sirve desde `public/` de la propia app** y no se contacta con nadie (Anexo §2). Por defecto los
  descarga de una CDN, y eso hay que impedirlo.
- **Carga bajo demanda**: `import()` dinámico al abrir la importación. No entra en el arranque (C1 de `docs/17`). Vite ya
  divide en trozos con `import()`, y `pdfText.js` ya usa `?url` para el *worker* de pdfjs.
- **iPhone**: WASM SIMD está en Safari desde 16.4 y los *Web Workers* también [HIPÓTESIS]. La velocidad real («unos
  segundos por foto») está **sin medir**: se medirá en su iPhone.
- **PDF**:
  - `pdfjs-dist` **4.10.38 está instalado** y `src/lib/pdfText.js` ya extrae texto [CÓDIGO].
  - Un PDF con texto se lee con posiciones (`getTextContent`, con `transform` de cada trozo), sin OCR.
  - Uno escaneado se pinta en un `<canvas>` (`page.render`) y se pasa al OCR.
- **El problema difícil no es leer letras, es la tabla.** Tesseract devuelve palabras con su caja, pero **no la rejilla
  de un horario**. Reconstruir días × horas a partir de las posiciones (agrupar por columnas y filas, reconocer
  «08:00–09:00», «Lunes») es **lógica propia por reglas**.
  - [RECOMENDACIÓN] Se escribe pura y probada en Node con cajas de ejemplo.
  - Todo lo dudoso se marca (baja confianza, celda sin hora, nombre que no casa con una asignatura) y el resultado es un
    **borrador**, nunca el horario activo (Anexo §2).
- **Sin servidor y sin coste**: todo corre en el dispositivo.
- **Dependencia**: `tesseract.js` es la **única dependencia nueva** prevista (C1). Su instalación la autoriza la Fase 5.

### 10.3 Notificaciones push con la app cerrada (Fase 7)

**Hechos** [CÓDIGO]:
- No hay service worker: ni archivo ni registro (`navigator.serviceWorker` no aparece en `src/` ni en `index.html`).
- `notificaciones.js` (A4) usa `new Notification()` con la app abierta y comprueba el permiso, el interruptor global, la
  categoría y el horario de descanso.
- `vercel.json` sirve `/`, `/index.html` y `/manifest.json` con `max-age=0, must-revalidate`, y `/assets/*` como inmutables.
- El manifiesto tiene `display: standalone`.
- `api/` solo contiene `ask-ai.js`.

**Hechos de fuentes públicas** [FUENTE]:
- Vercel Hobby limita los cron a **una vez al día**, y en cualquier momento de la hora programada. Una expresión más
  frecuente **falla al desplegar** ([docs de Vercel](https://vercel.com/docs/cron-jobs/usage-and-pricing)). **No sirve
  para avisos a su hora.**
- Supabase documenta `pg_cron` + `pg_net` para llamar a una función cada minuto (`* * * * *`)
  ([programar Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions),
  [pg_cron](https://supabase.com/docs/guides/database/extensions/pgcron)).
  - Que esté en el **plan gratuito** lo dicen fuentes de terceros, no la página de precios de Supabase [HIPÓTESIS: confirmar
    en la Fase 7].
  - Un usuario del plan gratuito tuvo que envolver `net.http_post` en una función de base de datos.
- iOS / iPadOS **16.4 o posterior**: el push web funciona solo con la web **añadida a la pantalla de inicio**, con
  manifiesto, HTTPS y un service worker, y el permiso solo se puede pedir **desde un gesto del usuario**
  ([WebKit](https://webkit.org/?p=13878), [Apple](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers)).
  - El «Declarative Web Push» de Safari no ha salido en la búsqueda [NO VERIFICADO]: no se cuenta con él.

**Las cuatro piezas y su diseño** [RECOMENDACIÓN, a cerrar en las Fases 2 y 7]:

1. **Service worker `public/sw.js` solo para push**: los eventos `push` y `notificationclick`, **sin manejador `fetch` y
   sin precaché**.
   - Así **no puede congelar la aplicación en una versión vieja**, que es el riesgo histórico DEP-30.
   - Se sirve con `no-cache` (una línea en `vercel.json`).
   - En iOS cada `push` debe acabar en `showNotification`, o el sistema retira la suscripción [HIPÓTESIS].
2. **Claves VAPID**: la pública en una variable `VITE_…` y la privada **solo** en las variables de Vercel. **Las pone
   Josué**, nunca en el código ni en el chat.
3. **SQL que ejecuta Josué**:
   - Una tabla `push_suscripciones` (usuario, `endpoint`, claves `p256dh`/`auth`, aparato, fechas) y una tabla
     `avisos_programados` (usuario, cuándo, título, cuerpo, enviado). Las dos con las **4 políticas
     `auth.uid() = user_id`**.
   - Un `cron.schedule` cada minuto que llama con `pg_net` a una función de envío con un secreto compartido.
   - Se le da el texto exacto y una consulta de comprobación (CLAUDE.md: «se le da el texto exacto para pegar»).
4. **El envío**: una función nueva en `api/` (Vercel) o una Edge Function de Supabase.
   - Lee los avisos debidos con la clave de servicio, firma con VAPID y cifra el contenido (RFC 8291/8292).
   - **Decisión pendiente** (§16): usar la dependencia `web-push` (solo en el servidor; sería una **segunda** dependencia
     nueva, contra C1) o escribir el cifrado con `node:crypto` (sin dependencia, unas 150 líneas que se pueden probar en
     Node) [HIPÓTESIS sobre el tamaño].

**Quién calcula qué avisar**:
- `resolverDia` y `avisosHorario` son JavaScript puro del cliente.
- [RECOMENDACIÓN] El cliente calcula los **próximos N días** de avisos y los sube a `avisos_programados` cada vez que
  cambia el horario o se abre la app. El servidor solo envía.
- Límite honesto: si Josué no abre la app en N días, los avisos se acaban. Se elige N (por ejemplo, 14) y se dice en
  pantalla.
- La alternativa (que el servidor resuelva el horario) duplicaría el motor en otro entorno.

**Desactivación al cerrar**:
- El aviso enviado ya no se apunta en el estado del horario (C8: hoy gasta un paso del Deshacer). Va a la tabla.
- **«No terminado si solo funciona con la app abierta»** (Anexo §3): el criterio de aceptación de la Fase 7 es recibir un
  aviso **con la app cerrada en su iPhone**, y eso solo lo puede comprobar él (R1).

### 10.4 Borradores, versiones y papelera (Fases 2 y 4)

**Hechos** [CÓDIGO]:
- No hay borradores.
- El Deshacer guarda 10 copias de **todos** los módulos en `app_data.historial` en cada cambio.
- La papelera global guarda una copia del elemento con `relacionados` y 30 días de retención. `horarioDatos` declara
  `COLECCIONES_PAPELERA_HORARIO` y nadie las registra.
- CLAUDE.md: una lista nueva en la papelera son **tres** cambios: `CATALOGO_PAPELERA`, `MODULOS_PAPELERA` y su `if` en
  `snapshotAndSave`.

[RECOMENDACIÓN]:
- **Borrador** = una copia de **un** horario (con sus bloques y excepciones) en una **clave aparte**, `horarioBorradores`.
  - Se autoguarda con retraso, como el autoguardado de Fitness (700 ms y al esconder la página).
  - Al confirmar sustituye al horario real en una sola escritura, tras pasar el detector de choques. La agenda activa no
    cambia hasta entonces (Anexo §8).
  - Las tres rutas de creación (Asistente, manual e importación) terminan en un borrador.
- **Versiones** = al confirmar, la versión anterior del horario va a `horarioVersiones`, una clave aparte con las últimas N
  por horario.
  - Con 16,5 KB por horario [EJECUTADO], 10 versiones son unos 165 KB: cabe, pero **no debe ir en `horarioTop`**, que se
    reescribe entera en cada cambio.
  - «No se crea un apartado de historial» (Anexo §8): las versiones se ven desde la ficha del horario.
- **Papelera**: `horarioTop.horarios` entra en `CATALOGO_PAPELERA`, y sus bloques y excepciones se van en
  `relacionados` (`conArrastrados`).
  - Restaurar comprueba los choques antes de reactivar (Anexo §4).
  - `eliminarDeVerdad` pasa a ser «vaciar la papelera».
- **Eficiencia**: claves separadas evitan reescribir los borradores y las versiones en cada cambio del horario.
- **Concurrencia**: sigue ganando el último (fase pendiente «el servidor no deja ganar a una escritura vieja»).

### 10.5 Integraciones inteligentes (Fase 7)

| Módulo | Qué se puede vincular | Identidad | Dirección | Viabilidad |
|---|---|---|---|---|
| Estudios | Asignaturas | `asignaturaId` (ya existe) | Las dos (ya existe: el nombre lo manda Estudios; crear desde Horario) | **Hecho**, se generaliza el mecanismo |
| Fitness | El entrenamiento de un día | `planificadoEnFecha` (sin id de bloque: es lo que toque ese día) | Solo lectura | Alta. Sin hora (§6.3) |
| Imagen personal | Rutinas (piel, pelo…) | `origen` + id de la rutina (`eventosDeRutinas`) | Solo lectura | Alta |
| Productividad, Calendario | Ya se leen en Hoy | — | Lectura | Hecho |

- [RECOMENDACIÓN] Un registro de **fuentes vinculables**, una línea por módulo (como `MODULOS_EH`), con:
  - `buscar(texto)` → sugerencias con su procedencia («de Estudios», «de Fitness»…).
  - `leerEnFecha(id, fecha)`.
  - Su regla de escritura (ninguna salvo Estudios).
- La actividad guarda `vinculo: { modulo, id }` (generaliza `asignaturaId`, que se conserva por compatibilidad).
- **Nunca se vincula por el nombre automáticamente** (E3 F12): solo si él elige la sugerencia.
- Al escribir, se busca **sin acentos** (arregla P16).

### 10.6 Exportación a PDF e imagen (Fase 4 o 7, a decidir en la Fase 2)

**Hechos** [CÓDIGO]:
- No hay `jspdf`, `html2canvas` ni `window.print` en `src/`.
- `canvas.toBlob` y `toDataURL` ya se usan en tres sitios (`imagenes.js`, `fotoPerfil.js`, `fotosProgreso.jsx`).
- `pdfjs-dist` lee PDF; no los genera.

[RECOMENDACIÓN] Sin dependencias:
- **Imagen**: dibujar el día o la semana con la API **Canvas 2D** desde los mismos datos de `resolverDia`. Diseño propio,
  centrado, con los colores configurados y mapeados desde los tokens (regla 2).
  - Se exporta con `toBlob('image/png')` y se comparte con `navigator.share({ files })` donde exista, o se descarga.
- **PDF**: un escritor de PDF mínimo (una página con una imagen JPEG, `DCTDecode`, unas decenas de líneas) que envuelve la
  misma imagen a tamaño A4. Determinista y comprobable en Node.
  - [HIPÓTESIS] `window.print()` dentro de una PWA instalada en el iPhone no es fiable. Se probará y no se depende de él.
- Hay que comprobar en su iPhone el `navigator.share` con archivos [NO VERIFICADO].

---

## 11. Auditoría de pruebas

### 11.1 Ejecutado en esta fase (solo lectura)

| Prueba | Resultado |
|---|---|
| 20 suites de Horarios (`test-horario`, `-datos`, `-editor`, `-estructura`, `actividades`, `hoy`, `mochila`, `automatizaciones`, `planificador`, `avisos-horario`, `analitica-horario`, `horario-top`, `mis-horarios`, `solapamientos-horario`, `usos-asignatura`, `asignaturas-compartidas`, `agenda-dia`, `acciones-hoy-agenda`, `calendario-mes`, `semana`) | **Las 20 terminan con código 0 y sin ningún ✗**. 1 554 líneas «✓» |
| 5 suites de los que dependen de las utilidades compartidas (`rutinas-ciclicas`, `tu-plan`, `cumplimiento-fitness`, `sueno`, `papelera`) | **Código 0 y sin ✗**. 119 + 124 + 157 + 92 + 78 líneas «✓» (cada recuento puede incluir su línea de resumen) |
| `vite build`, con la salida en el scratchpad (no se toca `dist/`) | **Correcto** (19,6 s) |
| Banco de renderizado (`node scripts/smoke.mjs`, que escribe solo en `node_modules/.cache`) | **«TODAS LAS VISTAS RENDERIZAN»**; 120 líneas de casos de Horarios |
| Reproducción en memoria de P1–P6, P8–P10, P12, P13, P16 y P17 (guion en el scratchpad, fuera del repositorio) | **Todos reproducidos** (tablas de §7 y §8) |

- ⚠️ La primera pasada recogió el código de salida de `tail`, no el de cada suite. Se repitió guardando el código
  verdadero; los datos de arriba son los de la segunda pasada.
- **No ejecutado**:
  - `bash scripts/verificar.sh` completo: compila en `dist/` y lanza el recorrido de Chromium (unos 50 minutos), que
    sobrescribe archivos generados.
  - El recorrido `test-app-real.mjs`.

  En esta fase se ha preferido no tocar ningún archivo del proyecto. Se ejecutarán enteros en la Fase 4, que es la primera
  que cambia código.

### 11.2 Lo que cubren y lo que no

- **Cubren** [CÓDIGO]:
  - Cada librería por separado.
  - Borrar un horario de verdad (E3 F5).
  - El falso solape de GE F2.
  - Asignaturas compartidas y su eliminación (AS F1/F2).
  - La navegación DIST/Organización.
  - Renderizado de los estados principales.
- **No cubren** (y por eso salieron P1–P17):
  - Crear un horario de principio a fin en Chromium.
  - El ciclo A/B **dentro de `resolverDia`**.
  - El «Choque» de la rejilla.
  - Clases fuera de las franjas.
  - La validación de «Solo este día».
  - El plan repitiéndose.
  - Avisos con la pantalla cerrada.
  - Una regla de choque **común**.
  - Consistencia entre vistas (Semana, Hoy, Día, Inicio y Calendario contando lo mismo).

### 11.3 Pruebas nuevas que necesitará el rediseño [RECOMENDACIÓN]

1. **Regresión de lo que ve el resto de la app**: el mismo escenario por `resolverDia`, `centroDelDia`, `agendaDelDia`,
   `resumenHorario`, la mochila y los avisos, **antes y después** de cada cambio del núcleo (como la F40 de Fitness).
2. **Una matriz de choques**: contiguos, solapes parciales, entre horarios, alternas, ciclo, excepciones, vigencias.
3. **Los tres alcances** con sus casos límite (primer y último día, excepciones posteriores).
4. **Migración**: cadena de versiones, copia antes de tocar, idempotencia, datos dañados apartados (no mudados).
5. **Protección de Fitness y Sueño**: sus suites intactas y una prueba de firma de `DIAS_SEMANA`/`diaDeFecha`/`diasEntre`.
6. **Recorrido de Chromium**: crear un horario de cero, el borrador, confirmar, la agenda conjunta, exportar e importar.
7. **OCR**: el reconstructor de tablas con cajas de ejemplo, en Node, sin el WASM.
8. **Push**: el cifrado y la firma contra vectores del RFC, en Node. La entrega real, en su iPhone.

---

## 12. Matriz de protección

| Sistema | Qué lee o usa de Horarios | Qué no debe cambiar | Cómo se protege |
|---|---|---|---|
| **Hoy (Inicio)** | `agendaCompleta` → `resolverDia` (clases como «eventos») | Que cuente lo de hoy; que respete `visibilidad.hoy` | Regresión antes/después (§11.3-1). La agenda conjunta se convierte en **la** fuente |
| **Estudios** | `asignaturaId`, `asignaturaNueva` en **una** llamada, `limpiarHorarioDeAsignatura`, `usosDeAsignatura` | El nombre lo manda Estudios; quitar ≠ eliminar (AS F2); una sola escritura (E3 F26) | `test-usos-asignatura` y `test-asignaturas-compartidas` en verde; la generalización a `vinculo` conserva `asignaturaId` |
| **Fitness** | `DIAS_SEMANA`, `diaDeFecha` (`horario.js`), `diasEntre` (`hoy.js`) en 9 archivos | Firma y significado (lunes = 1; `diasEntre` de `hoy.js` ≠ el de `rachas.js`) | Sacarlas a una **hoja** (`fechasSemana.js`, nombre provisional) y **reexportarlas** desde `horario.js` y `hoy.js` con `export { }` (nunca `export … from`, EH F17). Las suites de Fitness en verde. **Fitness no se toca** |
| **Imagen personal** | Nada hoy | Su modelo y su `motorRutinas.js` | Solo lectura (`eventosDeRutinas`); ni un archivo de Imagen personal se modifica (congelada en la F65 salvo correcciones) |
| **Calendario** | `agendaDelDia` (día); el mes no lee el horario | Lo que enseña el día | `test-agenda-dia`, `test-calendario-mes`; P13 se arregla usando la regla única |
| **Mochila** | `resolverDia` + material de la actividad | Lo `manual: true` no se borra al recalcular (HT F7) | `test-mochila` |
| **Sueño** | `DIAS_SEMANA`, `diaDeFecha` | Igual que Fitness | `test-sueno` |
| **Notificaciones (A4)** | `notificarSiCorresponde` | El interruptor global, las categorías, el horario de descanso: **un solo emisor** | El push pasa por los mismos ajustes; nunca un segundo horario de silencio |
| **Supabase** | Fila `horarioTop` en `app_data` | RLS `auth.uid() = user_id`; que la carga fallida no escriba (MS F16) | Claves nuevas en la misma tabla; tablas nuevas de push con sus 4 políticas; el SQL lo ejecuta Josué |
| **Papelera** | Nada hoy | Las entradas existentes y la retención | Los tres cambios de CLAUDE.md; `test-papelera` |
| **Deshacer global** | `snapshotAndSave` | Los 10 pasos para todos los módulos | Los avisos dejan de pasar por `onCambiar` (C8) |
| **Asistentes** | `horarioTop` excluido | Las reglas del chat (no guarda, no importa `ui.jsx`/`ai.js`/`supabase.js`) | `test-asistentes-chat`; el asistente propone y la pantalla del borrador escribe |
| **Motion System (sellado)** | Clases y primitivas | `auditoriaSellado` = SEALED | `test-motion-f20` en verde; nada de movimiento propio |
| **Buscador** | Palabras de Horarios | Que «horario», «clases», «franja» sigan encontrando | `test-buscador` |
| **Exportación global** | Nada | — | Si se añade, como Fitness: aparte de `currentState` (la IA no lo lee) |

---

## 13. Arquitectura futura

[RECOMENDACIÓN, solo una propuesta. Se cierra en la Fase 2 (`docs/19`).]

### 13.1 Capas

```
hoja de fechas (DIAS_SEMANA, diaDeFecha, diasEntre)  ← la usan Fitness y Sueño, reexportada sin cambiar
   ▲
modelo (horario.js ampliado: vigencia de bloque, categorías, vínculos, versión) + UN normalizador + migraciones
   ▲
motor temporal (resolverDia con ciclo + vigencias) · motor de choques único · validación común · alcances (3)
   ▲
servicios: agenda conjunta · borradores/versiones/papelera · importación (texto, PDF, OCR → filas → borrador)
           · asistente (reglas → propuesta → borrador) · exportación (canvas → PNG/PDF) · cola de avisos push
           · fuentes vinculables (Estudios, Fitness, Imagen personal)
   ▲
pantallas: «Horario» (agenda conjunta, vista diaria primero) · «Mis horarios» · editor del borrador · revisión de choques
```

### 13.2 Datos

- **`horarioTop`** (se conserva la clave y los ids). Cambios:
  - Gana un campo **`version`**.
  - Los bloques ganan `desde`/`hasta` opcionales.
  - Las actividades ganan una `categoriaId` opcional y un `vinculo` opcional.
  - Gana una lista `categorias` (`{ id, nombre, color }`, donde el color es un token, nunca un hex: regla 2).
  - Gana `choquesRevisados` (parejas marcadas como revisadas).
- **`horarioBorradores`** (clave nueva): un borrador por horario en edición, con su origen (manual, asistente o
  importación) y marcas de dudoso.
- **`horarioVersiones`** (clave nueva): las últimas N versiones por horario.
- **Papelera**: `horarioTop.horarios` con `relacionados`.
- **Supabase**: `push_suscripciones` y `avisos_programados` (SQL de Josué, Fase 7).

### 13.3 Principios que se mantienen

- Un horario es una regla y nada derivado se guarda (regla 11).
- `ALCANCES` sin valor por defecto.
- `confirmado: true` para escribir planes.
- Las notas privadas no viajan.
- Las preferencias visuales van en `localStorage`.
- **Potencia por dentro, sencillez por fuera** (Anexo §12).

---

## 14. Estrategia de migración

[RECOMENDACIÓN]

1. **Versionar** `horarioTop`: una ausencia de versión se lee como v1; el rediseño pasa a v2.
   - Se usa `migrarHorarioTop`, con una cadena `MIGRACIONES_HORARIO` sobre lo **crudo**, antes del normalizador (la
     lección de EH F46 y FIT F41).
   - Se **copia antes de tocar**: si algo falla, se devuelve lo original entero.
   - No se migra hacia atrás una versión más nueva.
2. **v1 → v2 no cambia ningún comportamiento visible por sí sola.** Solo:
   - Añade campos vacíos.
   - Une los dos normalizadores (conservando `config` y `ajustesAvisos`, C4).
   - **Aparta**, sin borrar ni mudar, lo que hoy se pierde: bloques sin horario o sin columna, excepciones con fecha
     inválida. Van a una `cuarentena` como la de Fitness (FIT F41).
3. **Los choques existentes no se tocan** (C4 de `docs/17`): se derivan con la regla única y se ofrecen para revisar.
4. **El ciclo A/B**: si un horario ya tiene `ciclo` y columnas con `grupo`, aplicarlo **cambia** lo que ve Josué. Antes de
   aplicarlo se le dice «a partir de ahora los lunes A y B se alternan».
   - [HIPÓTESIS] Es muy probable que no haya ninguno, porque el grupo no tiene pantalla.
5. **Columnas sin día** (P2): no se borran. La pantalla nueva le pide asignarles un día o las deja en «sin día».
6. **Las utilidades de fecha** se mueven sin cambiar ni una firma, con reexportación, en una fase propia o al inicio de la
   Fase 4, con las suites de Fitness y Sueño en verde.
7. **Diagnóstico de solo lectura antes de migrar** (§5.2), para saber qué casos tiene de verdad.
8. **Sin SQL** para la migración de datos: todo vive en `app_data`. El único SQL es el del push (Fase 7).

---

## 15. Plan técnico de las 8 fases

[RECOMENDACIÓN] Cada fase necesita **autorización expresa**. Ninguna hace commit, push, merge, despliegue, SQL ni toca datos
reales sin que Josué lo diga.

| Fase | Documento | Trabajo técnico | Depende de | Pruebas de cierre |
|---|---|---|---|---|
| **1 · Auditoría** | `docs/18` (este) | Inventario, protección y plan | — | §17 |
| **2 · Arquitectura** | `docs/19_HORARIOS_ARQUITECTURA.md` | Modelo v2, alcances, regla única de choque, borradores/versiones/papelera, agenda conjunta, vínculos, push (piezas y quién hace qué), decisión `web-push` sí o no, exportación, contradicciones a `docs/03` | Fase 1 | Revisión documental; prototipos de funciones puras **solo si se autorizan** |
| **3 · Diseño de interfaz** | `docs/20_HORARIOS_DISENO_INTERFAZ.md` | Navegación Horario / Mis horarios, vista diaria primero, semana del ordenador, editor del borrador, revisión de choques, los tres alcances, vocabulario sin «franja» ni «columna», con el Motion System | Fase 2 | Maquetas o capturas; criterios de accesibilidad (44 px, `aria`) |
| **4 · Constructor manual** | `docs/21_HORARIOS_CONSTRUCTOR_MANUAL.md` | **La primera que cambia código**: hoja de fechas, versión y migración v2, normalizador único, `resolverDia` con ciclo y vigencias, choque único y bloqueo, validación común, 3 alcances, borrador y versiones, papelera, pintar por horas, pantallas nuevas, arreglos P1–P16 | Fases 2 y 3 | `verificar.sh` entero en verde; regresión §11.3-1; recorrido nuevo; suites de Fitness y Sueño intactas |
| **5 · Importación** | `docs/22_HORARIOS_IMPORTACION.md` | Texto y PDF con texto (pdfjs) → filas; OCR local (`tesseract.js`, **autorizar la dependencia**, archivos autoalojados, `import()` dinámico); reconstructor de tablas; dudosos marcados; resultado = borrador | Fase 4 | Reconstructor en Node; medida de tamaño del arranque (que no cambie); prueba en su iPhone (R1) |
| **6 · Asistente** | `docs/23_HORARIOS_ASISTENTE.md` | `asistenteHorario.js` sobre `motorConversacion`; órdenes → propuesta → borrador; preguntas; consultas («¿qué tengo el jueves?») | Fase 4 | `test-asistentes-chat` y su suite; sin IA generativa (DA-09) |
| **7 · Integraciones** | `docs/24_HORARIOS_INTEGRACIONES.md` | Fuentes vinculables (Estudios, Fitness, Imagen personal); service worker solo de push; VAPID (Josué); SQL de suscripciones, cola y `pg_cron` (Josué); función de envío; exportación si no fue en la 4 | Fase 4 (y 5/6 para las sugerencias) | Cifrado contra vectores RFC; **aviso recibido con la app cerrada en su iPhone** (Anexo §3) |
| **8 · Cierre** | `docs/25_HORARIOS_CIERRE_FINAL.md` | Auditoría final contra `docs/17` punto por punto, regresión completa, documentación (CLAUDE.md, `docs/02`–`05`, CHANGELOG, HANDOFF) | Todas | `verificar.sh` en verde; lista de aceptación calculada, como `releaseFitness.js` |

---

## 16. Riesgos y cuestiones pendientes

### 16.1 Riesgos críticos

| Riesgo | Nivel | Mitigación |
|---|---|---|
| Tocar `DIAS_SEMANA`/`diaDeFecha`/`diasEntre` rompe Fitness y Sueño | **Crítico** | Hoja aparte + reexportación; ninguna firma cambia; sus suites como regresión |
| Cambiar `resolverDia` (ciclo, vigencias) cambia lo que ven Inicio, el Calendario, la mochila y los avisos | **Crítico** | Regresión antes/después del mismo escenario; avisar a Josué si su horario cambia de verdad |
| Un campo nuevo que el normalizador no conozca se borra en el siguiente guardado (ya pasó con `visible`, `archivado` y `grupos`) | **Alto** | Un solo normalizador; cada campo nuevo con su prueba de ida y vuelta |
| Migrar sin conocer los datos reales | **Alto** | Diagnóstico de solo lectura; copia antes de tocar; cuarentena; nada se muda ni se borra |
| Bloquear choques nuevos sin romper los antiguos | **Alto** | Los antiguos se derivan y solo se revisan; el bloqueo mira **lo que cambia**, no todo el horario |
| Service worker que congela la app en una versión vieja (DEP-30) | **Alto** | Solo push, sin `fetch` ni precaché, servido sin caché |
| La entrega real del push depende de iOS y de su instalación | **Alto** | Requisitos dichos en pantalla; criterio de aceptación en su iPhone |
| `HorarioView.jsx` de 2 430 líneas con efectos en el pintado | Medio | Pantallas nuevas en archivos separados; los paneles útiles se mudan, no se copian |
| Una sola fila JSON: dos dispositivos se pisan | Medio (conocido) | Claves separadas para borradores y versiones; la fase de escritura condicional sigue pendiente (SQL de Josué) |
| OCR: la tabla se reconstruye mal | Medio | Siempre borrador; dudosos marcados; revisión obligatoria |

### 16.2 Cuestiones para Josué

Ninguna bloquea la Fase 2. Según su instrucción, se resuelven con la lectura que respeta lo decidido, se anotan en
`docs/03` y se le cuentan.

1. **`web-push` en el servidor o cifrado propio.** C1 dice que el OCR es «la única dependencia nueva».
   - Propuesta: cifrado propio con `node:crypto`. Respeta C1 y no añade nada al navegador.
   - Se decide en la Fase 2.
2. **El disparador de los avisos.** `pg_cron` en Supabase, porque Vercel Hobby es diario [FUENTE].
   - Hay que confirmar en la Fase 7 que el plan gratuito lo permite sin pausar el proyecto.
   - Necesita su SQL.
3. **¿Las clases salen en el mes del Calendario y como lista en Inicio?** (C11, C10). `docs/17` no lo pide de forma
   explícita. Propuesta: no ampliarlo hasta que lo pida.
4. **La especificación HT (11 614 líneas)** queda como historia donde `docs/17` la contradiga. Se anota en `docs/03`.
5. **Datos reales**: ¿quiere ver el diagnóstico de solo lectura antes de la Fase 4?
6. **Fitness sin hora**: la integración enseña «lo que toque hoy» sin hora, salvo que él lo coloque en su horario.
   Coherente con el Anexo §7 («respetar el modelo de su módulo»).
7. **Exportación**: ¿en la Fase 4 (manual) o en la 7 (integraciones)? Propuesta: la 4, porque no depende de nadie.

### 16.3 Lo que no se ha podido comprobar

- Supabase real y los datos de Josué.
- Su iPhone (desplazamiento, teclado, OCR, push, `navigator.share` con archivos).
- Varios dispositivos.
- El plan gratuito de Supabase con `pg_cron`.
- El «Declarative Web Push».
- Las opciones de `tesseract.js` v7 para autoalojar.

Todo está marcado donde aparece.

---

## 17. Criterios de aceptación de la Fase 1

| Criterio | Estado |
|---|---|
| Git comprobado al empezar: rama, base `bf9bb46`, `docs/17` sin cambios (md5), sin más cambios | ✅ §2.1 |
| Inventario funcional con los cuatro estados (operativo, parcial, inaccesible, inexistente) | ✅ §3 |
| Mapa de arquitectura con ruta, responsabilidad, funciones, dependencias, riesgo y mantener/adaptar/sustituir | ✅ §4 |
| Modelo de datos y persistencia, separando hechos, datos reales sin verificar e hipótesis | ✅ §5 |
| Integraciones: Hoy, Estudios, Calendario, Mochila, Fitness (cíclico, no semanal), Imagen personal, Sueño, notificaciones | ✅ §6, §12 |
| Motor de conflictos; repeticiones, excepciones, los 3 alcances y la vigencia por actividad | ✅ §7, §8 |
| Interfaz móvil | ✅ §9 |
| Viabilidad: Asistente, OCR (librería, compatibilidad, tamaño, carga bajo demanda, licencia, pdfjs), push (SW, VAPID, Vercel, SQL, programación, Supabase, límites, iOS 16.4+), borradores/versiones/papelera, integraciones y exportación | ✅ §10, sin instalar nada |
| Pruebas relevantes ejecutadas en solo lectura, con su resultado verdadero | ✅ §11 |
| Matriz de protección | ✅ §12 |
| Arquitectura futura, migración y plan de las 8 fases | ✅ §13, §14, §15 |
| Riesgos y cuestiones pendientes | ✅ §16 |
| Hechos, hipótesis y recomendaciones separados | ✅ Marcas en todo el documento |
| Ningún cambio de código ni de datos, sin SQL, sin dependencias, sin commit, push, merge ni despliegue | ✅ Comprobado al terminar (§2.1) |
| Git comprobado al terminar | ✅ Ver el informe de cierre |
| **Detenerse y no empezar la Fase 2 sin autorización expresa** | ✅ |

---

*Fase 1 de 8 terminada. No autoriza ninguna de las siguientes. Las fuentes externas consultadas están enlazadas en §10.3
y los datos del registro de npm en §10.2.*
