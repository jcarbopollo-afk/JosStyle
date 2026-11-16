# 19 · Horarios — Arquitectura y modelo de datos (Fase 2 de 8)

> **Fase 2 del rediseño de Horarios.** Es solo diseño:
> - No se ha modificado código.
> - No se ha ejecutado ninguna migración ni SQL.
> - No se ha tocado Supabase ni instalado nada.
> - No hay commits, push, merge ni despliegue.
>
> Referencias obligatorias:
> - **`docs/17_HORARIOS_REDISENO.md`**: el objetivo funcional. Su Anexo prevalece.
> - **`docs/18_HORARIOS_AUDITORIA_TECNICA.md`**: la auditoría de la Fase 1.
>
> Incorpora las **siete decisiones cerradas por Josué el 2026-11-08** sobre el apartado 16.2 de `docs/18` (§0.3).
>
> Fecha: 2026-11-08 · Rama `claude/horarios-rediseno` · Base `bf9bb46` · `package.json` 3.161.3.
>
> 🔎 **Estado al 2026-11-15**: la **entrega A** y la **A-bis** de la Fase 4 están implementadas y publicadas (v3.162.0,
> PR #6, `main` en `dcb649e`). Lo que hacen está en el **§18.13**, que manda sobre los apartados anteriores donde
> difieran. La entrega B no ha empezado.

**Marcas** (las mismas de `docs/18`):

| Marca | Significado |
|---|---|
| **[EJECUTADO]** | Comprobado ejecutando el código real en memoria |
| **[CÓDIGO]** | Comprobado leyendo el código |
| **[FUENTE]** | Comprobado en documentación pública o en el registro de npm |
| **[HIPÓTESIS]** | Razonable, sin comprobar; se dice en qué fase se comprueba |
| **[DECISIÓN]** | Decisión de arquitectura de esta fase, con su motivo |
| **[PENDIENTE]** | Necesita una autorización o una comprobación posterior |

Los nombres de archivos y funciones nuevos son **provisionales**. Se ha comprobado que **ninguno existe hoy** en `src/`,
`api/`, `public/` ni `scripts/`. La excepción es `exportarHorario`, que ya existe (copia JSON, `horarioTop.js`); por eso la
exportación visual lleva otro nombre.

---

## Índice

0. Revisión de la Fase 1 y decisiones de partida
1. Resumen arquitectónico
2. Modelo de datos
3. Motor temporal
4. Repeticiones y excepciones
5. Conflictos
6. Borradores y versiones
7. Papelera
8. Integraciones
9. Notificaciones
10. OCR (importación)
11. Asistente
12. Migración
13. Diagramas
14. Contratos
15. Decisiones técnicas pendientes
16. Criterios de aceptación
17. Aclaraciones de la revisión (2026-11-08) — **mandan sobre los apartados anteriores donde difieran**
18. Correcciones del 2026-11-09 (versiones manuales, TP-5/TP-7, funciones que se conservan, colores al exportar, «Cada dos semanas», conservación de versiones, coherencia, TP-18 resuelta, versiones eliminadas entre aparatos —sin nada pendiente en el aparato y con escritura condicional— y la regla definitiva del autoguardado). §18.12: el cierre documental previo a la Fase 4 (TP-4, el historial de versiones tal como está implementado, TP-8 con TP-15, y sus riesgos) y la decisión aprobada del TP-15 (A + B + C, 2026-11-10). §18.13: la entrega A y la A-bis tal como están implementadas (2026-11-15): la guardia `horarioGuardia:<aparato>`, el testigo, la intención, la clasificación E0/E1/E2/AI/B/C, los estados E3–E7, la supresión, el evaluador de la B y C-1 a C-4. §18.14: la entrega E1 (2026-11-16): el escritor protegido de `horarioTop` (TP-15 A y C), el conflicto entre aparatos con la copia apartada (D2 y D2-bis), Deshacer, la incidencia #5 corregida, la entrega corta (retirar, resolver y reabrir, D1) y la regla del servidor preparada y probada solo en local (TP-15 B, sin activar)

---

## 0. Revisión de la Fase 1 y decisiones de partida

### 0.1 Problemas de la auditoría que condicionan el modelo

| Hallazgo (`docs/18`) | Qué obliga a decidir en el modelo |
|---|---|
| P1: el ciclo A/B no se aplica | Una sola definición de «qué semana toca», aplicada en el motor |
| P2: columnas sin día | El día de la semana debe ser explícito; una regla sin día es un dato a revisar, no una regla silenciosa |
| P3, P4, P5: la rejilla pinta por franjas | El motor y la vista trabajan con **intervalos** (minutos), nunca con franjas |
| P5, P6, P7, P13: cuatro reglas de choque | **Una** función de choques para todo |
| P8, P9: «Solo este día» sin validar | **Una** validación común para cualquier escritura |
| P10: el plan de una fecha crea una regla semanal | Lo puntual es una excepción con fecha, nunca una regla |
| P12: una excepción con fecha inválida se muda a hoy | Lo dañado se **aparta**; nunca se reescribe con un valor inventado |
| P14: restaurar una copia duplica clases | Activar o restaurar **comprueba los choques** antes |
| P16: los acentos duplican actividades | Las búsquedas e identidades por nombre, siempre sin acentos, y solo como **sugerencia** |
| C4: `config` y `ajustesAvisos` se pierden al cargar | **Un solo normalizador**, que conserva lo que no conoce |
| C5: sin papelera | Los horarios entran en la papelera global |
| C7: sin versión de esquema | `horarioTop.version` y una cadena de migraciones |
| C8: cada aviso gasta un paso del Deshacer | Lo enviado se apunta fuera de `horarioTop` |
| C1: avisos solo con la pantalla abierta | Una cola de avisos fuera de la pantalla y el push |

### 0.2 Hallazgos nuevos de esta fase [CÓDIGO]

| # | Hallazgo | Consecuencia |
|---|---|---|
| **N1** | `normalizarHorarioTop` reconstruye cada objeto campo a campo: **descarta todo lo que no conoce**, incluido un campo `version` de primer nivel | Una copia antigua de la aplicación, abierta en otra pestaña o en otro aparato, que cargue datos de la versión 2 y guarde, **borraría los campos nuevos**, sin poder saber siquiera que eran de una versión más nueva. Obliga a la **guardia de versión en dos entregas** (§12.3) |
| **N2** | El mismo normalizador **descarta los bloques sin `horarioId` o sin `columnaId`** | La versión 2 tiene que seguir escribiendo un `columnaId` válido en cada bloque. Si no, una copia antigua **borraría todas las clases** al guardar |
| **N3** | `normalizarExcepcion` convierte un **tipo desconocido** en `cancelado` | Un tipo de excepción nuevo leído por una copia antigua **cancelaría la clase**. Tipos nuevos, no; o, si hacen falta, tras la guardia |
| **N4** | `normalizarBloque` da `uid()` a un bloque sin id **en cada carga** | Es la lección de la FIT F41: el id no es estable y rompe las referencias (excepciones, completadas). El id ausente se deduce de algo estable o el bloque se aparta |
| **N5** | `normalizarRecurrencia` convierte una clase desconocida en `siempre` | Igual que N3: una regla de repetición nueva vista por una copia antigua sale **todas las semanas** |
| **N6** | Fitness ya resolvió este mismo problema | Tiene una guardia de versión (`fitnessSoloLectura`, `NO_GUARDA_FITNESS`, App.jsx 547–556 y 1267), una copia de seguridad antes de migrar (`fitness_respaldo_v1`), una cuarentena (`apartarLoQueNoCarga`) y migraciones puras (`MIGRACIONES_FITNESS`). **Se reutiliza el patrón; no se inventa otro** |

### 0.3 Decisiones cerradas por Josué (2026-11-08, sobre `docs/18` §16.2)

| # | Decisión | Consecuencia técnica en esta arquitectura |
|---|---|---|
| **D-H1** | Evaluar la solución estándar de cifrado y envío de notificaciones en servidor, respetando la restricción de dependencias y sin añadir peso al navegador | Evaluada en §9.6. La estándar es **`web-push`**: se ejecuta **solo en la función de servidor**, con cero bytes en el navegador. Es una dependencia nueva de servidor, así que **instalarla necesita autorización expresa en la Fase 7**. Si no se autoriza, hay una alternativa sin dependencia con `node:crypto`. La 4.0.0 se publicó hace dos días: no se usaría hasta que tenga al menos dos semanas, y se fijaría la versión exacta |
| **D-H2** | `pg_cron` es una propuesta pendiente de comprobación en la Fase 7 | §9.4: el disparador se diseña con `pg_cron` + `pg_net`, con la comprobación del plan gratuito como **condición de entrada de la Fase 7**, y una alternativa si falla |
| **D-H3** | No ampliar las integraciones de Calendario e Inicio más allá de lo acordado | §8.5 y §8.6: Inicio sigue contando «N eventos» y el día del Calendario sigue enseñando las clases, **ahora con la regla de choques única**. El **mes del Calendario no enseña las clases** y **no hay lista nueva en Inicio** |
| **D-H4** | La especificación HT es documentación histórica cuando contradiga el Documento Maestro | Donde `docs/17` y `ESPECIFICACION_HORARIO_TOP.md` choquen, manda `docs/17`. La especificación HT **no se edita** (es literal). ~~Queda pendiente de anotar en `docs/03`~~ 🔎 **Anotada en `docs/03` como C-80 (2026-11-10, TP-9)** |
| **D-H5** | Diagnóstico de datos reales exclusivamente de lectura antes de la Fase 4 | §12.2: `diagnosticoHorarios(crudo)` es pura y **no escribe**. 🔎 **TP-4 resuelto (2026-11-09)**: se lleva a sus datos con un **panel de solo lectura dentro de la entrega A** de la Fase 4, **sin SQL en producción**. Haberlo visto y revisado es la **condición de entrada de la entrega B y de cualquier migración** |
| **D-H6** | Fitness mostrará la rutina que corresponda a cada fecha sin inventar horarios | §8.2: se lee `planificadoEnFecha` en cada fecha. Sin hora, sale como elemento **«sin hora»** del día. Con hora, **solo** si Josué coloca una actividad vinculada con sus propias horas. Nunca se copia una rutina ni se crea una sesión |
| **D-H7** | La exportación se incorpora en la Fase 4 | §14.11: el contrato de la exportación visual (día o semana, PNG y PDF, sin dependencias) forma parte de la Fase 4 y de sus criterios de aceptación |

### 0.4 Decisiones funcionales ya cerradas que esta arquitectura respeta (`docs/17`, Anexo)

- **Asistente**: se llama «Asistente», nunca «IA». Va por reglas, sin API ni coste. Pregunta lo que falte, enseña una vista
  previa y no sustituye a la creación manual (Anexo §1, DA-09).
- **Importación**: OCR local, sin enviar nada fuera. La librería se carga bajo demanda. Lo dudoso se marca y el resultado
  es un **borrador** (§2).
- **Push con la app cerrada**: sin eso no está terminado (§3).
- **Conflictos**: se conservan los históricos y se revisan a mano; nunca se modifica nada solo; se bloquean los nuevos,
  también al activar un horario (§4).
- **Tres alcances** y vigencia por actividad (§5).
- **Categorías** opcionales, con nombre y color. Borrar una categoría no borra sus actividades (§6).
- **Vincular** sugiriendo, con su procedencia; él elige; sin duplicados (§7).
- **Borradores, versiones y papelera**: la agenda activa no cambia hasta confirmar, y no hay un apartado de historial (§8).
- **PDF e imagen**, de un día o de la semana (§9).
- **11:00–13:00 es un bloque**, sin cruzar la medianoche (§10).
- **Móvil**: la vista diaria es la principal y la semana va en el ordenador (§11).
- **Potencia por dentro, sencillez por fuera** (§12).

### 0.5 Limitaciones técnicas reales

1. **Una fila JSON por clave**, en la que gana el último que escribe [CÓDIGO]. No hay transacciones entre claves:
   guardar en tres claves no es atómico.
2. **Copias antiguas de la aplicación** pueden borrar campos nuevos (N1, N2).
3. **No hay service worker** y Vercel Hobby solo permite crons diarios [FUENTE, `docs/18` §10.3].
4. **iOS** necesita la app añadida a la pantalla de inicio, iOS 16.4 o posterior y el permiso pedido desde un botón
   [FUENTE].
5. **Las horas son `HH:MM` dentro del mismo día.** Es la intención: no se cruza la medianoche.
6. **Fitness no tiene hora prevista** [CÓDIGO, `docs/18` §6.3].
7. **No hay datos reales a la vista** [NO VERIFICADO], de ahí D-H5.

### 0.6 Incompatibilidades técnicas

**Ninguna incompatibilidad impide cumplir lo decidido**, así que esta fase no se detiene. Hay tres puntos que necesitan
autorización, no una decisión funcional nueva (§15):
1. Instalar `web-push` en el servidor (o aceptar la alternativa propia).
2. Las piezas que hace Josué para el push: las claves VAPID, la clave de servicio en Vercel y el SQL.
3. La forma de ejecutar el diagnóstico sobre sus datos reales.

---

## 1. Resumen arquitectónico

**Principio:** se conserva el núcleo que funciona («un horario es una regla, nada derivado se guarda») y se le añaden tres
cosas:

1. **Una sola fuente de verdad para cada pregunta.**

   | Pregunta | Función única |
   |---|---|
   | ¿Qué horarios cuentan? | `horariosQueCuentan` |
   | ¿Qué pasa un día? | `resolverDia` |
   | ¿Qué chocan? | `choques*` |
   | ¿Es válido? | `validarCambio` |
   | ¿Qué toca en otro módulo? | `FUENTES_VINCULABLES` |

2. **Un circuito de escritura seguro**: borrador → validación → vista previa → confirmación → versión. La agenda activa
   solo cambia al confirmar.
3. **Compatibilidad hacia atrás**: la versión 2 sigue escribiendo los campos que lee la versión 1 (columna del día,
   `activo`/`archivado`, `asignaturaId`), y la guardia de versión llega **una entrega antes** que la versión 2.

**Capas** (las de dentro no importan a las de fuera):

```
 hoja de fechas         fechasSemana.js        DIAS_SEMANA · diaDeFecha · diasEntre   (Fitness y Sueño la importan, reexportada)
        ▲
 modelo + carga         horario.js (ampliado) · migracionHorario.js · normalizador ÚNICO · cuarentena
        ▲
 motor                  motorHorario.js        horariosQueCuentan · resolverDia · agendaConjunta · agendaSemana
                        choquesHorario.js      choquesDelDia · choquesDeLaRegla · registro histórico
                        validacionHorario.js   validarCambio (horas, orden, vigencia, choques)
                        alcancesHorario.js     editarConAlcance (solo este día · este y siguientes · todas)
        ▲
 servicios              borradoresHorario.js · versionesHorario.js · papelera (catálogo global)
                        fuentesVinculables.js  (Estudios, Fitness, Imagen personal)
                        importacionHorario.js · ocrLocal.js (bajo demanda) · asistenteHorario.js
                        exportacionVisualHorario.js (PNG/PDF) · avisosPush.js (cola de avisos)
                        diagnosticoHorario.js (solo lectura)
        ▲
 pantallas (Fase 3)     «Horario» (agenda conjunta) · «Mis horarios» · editor del borrador · revisión de choques
 servidor (Fase 7)      public/sw.js (solo push) · api/push-enviar.js · tablas push en Supabase (SQL de Josué)
```

**Lo que NO cambia:**
- La clave `horarioTop`.
- Los ids guardados.
- Las cuatro políticas RLS.
- El emisor de avisos A4 y sus ajustes.
- El contrato con Estudios (`asignaturaId`, el nombre lo manda Estudios, una sola escritura).
- Las preferencias visuales en `localStorage`.
- El Motion System sellado.
- Las funciones útiles: mochila, tablón, plan, centro de avisos, informe y copia JSON.

---

## 2. Modelo de datos

### 2.1 Dónde vive cada cosa

| Clave de `app_data` | Contenido | Por qué ahí |
|---|---|---|
| `horarioTop` (existe) | Horarios, actividades, reglas (bloques), excepciones, categorías, registro de choques y lo que ya tenía (mochila, tablón…) | Es la agenda activa. Se conserva la clave |
| `horarioBorradores` (nueva) | Borradores en curso | Que autoguardar un borrador no reescriba la agenda activa |
| `horarioVersiones` (nueva) | Versiones recuperables | Que no engorden `horarioTop`. Además, **una copia antigua de la app no las toca**: son el respaldo ante N1. 🔎 **Sustituida (2026-11-09) por un registro por aparato, `horarioVersiones:<aparato>`, y su vista fusionada (§18.9)** |
| `horarioTop_respaldo_v1` (nueva, una vez) | Copia exacta de `horarioTop` antes de la primera migración | El mismo patrón que `fitness_respaldo_v1` |
| `papelera` (existe) | Horarios eliminados, con sus reglas y excepciones | El catálogo global |
| Supabase `push_suscripciones`, `avisos_programados` (Fase 7, SQL de Josué) | Aparatos y cola de avisos | Necesitan que el servidor las lea |

Las tres claves nuevas usan la **misma tabla y las mismas políticas RLS**: no hace falta SQL para ellas.

> 🔎 **Revisión 2026-11-08 (§17)**: se añaden tres claves más en la misma tabla, también sin SQL:
> - `horarioCuarentena` (17.5): la cuarentena sale de `horarioTop`.
> - ~~`horarioAparatos` y `horarioGuardia` (17.2)~~. 🔎 **Sustituidas (TP-17, 2026-11-14, implementado en la A-bis)** por
>   **una fila por aparato, `horarioGuardia:<aparato>`** (§17.2 y §18.13). Las claves `horarioAparatos`,
>   `horarioAparatos:*` y `horarioGuardia` sin sufijo **no existen**: `saveData` y su cola las rechazan, igual que
>   `horarioGuardia:*`, que solo escribe su escritor condicional.
>
> `horarioTop_respaldo_v1` pasa a ser una lista de copias que solo crece (17.4).

### 2.2 `horarioTop` versión 2

```
horarioTop = {
  version: 2,                        // NUEVO. Ausente = 1.
  horarios: [Horario],
  actividades: [Actividad],
  bloques: [Regla],                  // se conserva el nombre de la clave: los ids y los consumidores no cambian
  excepciones: [Excepcion],
  categorias: [Categoria],           // NUEVO
  choques: { historicos: [], revisados: [] },   // NUEVO (§5)
  // (cuarentena: NO va aquí. Revisión 2026-11-08 → clave aparte `horarioCuarentena`, §17.5)
  ...todo lo que existe hoy (grupos, materiales, enlacesMaterial, mochila, mochilas, inventario, kits, dependencias,
     reglas, completadas, automatizaciones, historialAuto, avisos, config, ajustesAvisos),
  ...cualquier clave desconocida, conservada tal cual   // NUEVO: el normalizador deja de descartar
}
```

> 🔎 **Desde la A-bis (2026-11-15)**: `horarioTop` en la versión 1 ya lleva `version: 1` en toda escritura y, fuera del
> arranque, `testigo` (§17.2 y §18.13); el normalizador de la entrega A los conserva como campos conocidos. Qué hace la
> versión 2 con `testigo` se decide al diseñar la entrega B: no está decidido.

### 2.3 Horario

| Campo | Estado | Notas |
|---|---|---|
| `id` | Existe | Estable; `uid()` solo al crear |
| `nombre` | Existe | |
| `tipo` | Existe | `escolar`, `entrenamiento`, `estudio`, `trabajo`, `rutina`, `personalizado` |
| **Estado** | **Se deriva** de `activo` + `archivado` | Ver la tabla de estados abajo [DECISIÓN] |
| `desde`, `hasta` | Existen (opcionales) | Fechas locales `AAAA-MM-DD` |
| `ciclo` | Existe | `{ semanas (1-8), ancla, nombres }` o `null`. **Ahora se aplica** (§3) |
| `columnas` | Existe | **Una por día de la semana usado**, gestionada por el sistema. Las columnas sin día que ya existan se conservan y se revisan (§12). 🔎 **Orden fijo de lunes a domingo (TP-18 resuelta, §18.8)**: `posicion` se conserva intacto y deja de decidir el orden |
| `filas` | Existe | 🔎 **Corrección 2026-11-09**: siguen siendo **las franjas del horario**, y la función **Generar franjas se conserva** (`generarFranjas`, `regenerarFranjas`, `impactoRegenerarFranjas`, `editarFila`). Sirven para crear rápido (tocar una franja propone sus horas) y como guías con nombre en la vista («Recreo»). **No deciden** dónde se pinta una actividad ni cuándo ocurre: eso lo deciden `inicio` y `fin` (P3, P4). Ver §18 |
| **`vista`** | **NUEVO** | Configuración de visualización sincronizada: `{ desde: 'HH:MM', hasta: 'HH:MM', diasOcultos: [1-7] }`. La densidad y el zoom siguen por aparato en `localStorage` |
| `color`, `icono`, `descripcion`, `periodo`, `porDefecto`, `zonaHoraria` | Existen | |
| `creadoEn`, `actualizadoEn` | Existen | `actualizadoEn` sirve de marca para detectar que un borrador quedó viejo (§6) |

**Estados del horario:**

| Estado | `activo` | `archivado` | Cuenta en la agenda | Se comprueba al activarlo |
|---|---|---|---|---|
| **Activo** | `true` | `false` | Sí, si está dentro de `desde`/`hasta` | — |
| **Desactivado** | `false` | `false` | No | Sí |
| **Archivado** | `false` | `true` | No | Sí (al restaurarlo) |
| **Eliminado** | — | — | No: está **en la papelera**, fuera de `horarios` | Sí (al restaurarlo) |

**Por qué no hay un campo `estado` nuevo** [DECISIÓN]: `activo` y `archivado` los leen hoy `horarioVigente`, `avisosHorario`
y las copias antiguas. Un campo `estado` al lado sería **una segunda fuente de verdad**: el día que no coincidieran, cada
pantalla diría una cosa (E3 F26, E3 F44). `estadoDeHorario(h)` lo deriva, y `cambiarEstado(…)` escribe los dos campos a
la vez.

**Varios activos a la vez**: sin límite, como hoy. Lo que impide el desorden es el bloqueo de choques al activar (§5).

### 2.4 Actividad (la identidad: «qué es»)

La «actividad» del enunciado se reparte en **dos entidades** que ya existen [DECISIÓN]:
- La **actividad** (qué es: nombre, categoría, vínculo, profesor…), compartida entre horarios.
- La **regla** (`bloques`): cuándo ocurre.

Así «Matemáticas» es una sola cosa aunque tenga diez horas a la semana en dos horarios. Fusionarlas duplicaría el nombre en
cada hora, que es justo lo que AS F1 eliminó.

| Campo | Estado | Notas |
|---|---|---|
| `id` | Existe | |
| `nombre` | Existe | Si está vinculada a Estudios, **manda el nombre de Estudios** (`nombreDeActividad`) |
| `tipo` | Existe | Catálogo cerrado con significado para el motor (`descanso` para el tiempo libre, `estudio` para el plan). **No es la categoría** |
| **`categoriaId`** | **NUEVO**, opcional | Una categoría que no existe se lee como `null` (sin categoría) |
| `color` | Existe | Sin categoría o con color propio. Ver §2.6 sobre la regla 2 |
| `asignaturaId` | Existe | **El vínculo con Estudios sigue siendo este campo** [DECISIÓN] |
| **`vinculo`** | **NUEVO**, opcional | `{ modulo: 'fitness' \| 'imagen', tipo, id }` para los otros módulos. **Nunca para Estudios**: eso ya es `asignaturaId`, y dos campos para lo mismo se desincronizan. `vinculoDe(actividad)` da la vista unificada |
| `persona` (profesor), `ubicacion` (aula), `material[]`, `notas` | Existen | |
| `origen`, `origenId` | Existen | Procedencia: `manual`, `asistente`, `importacion`, `estudios`, `fitness`, `imagen` |
| `estado`, `visibilidad`, `alias`, `etiquetas`, `favorita`, `grupoId`, `padreId`, `prioridad`, `corto`, `descripcion` | Existen | Se conservan |
| `creadoEn`, `actualizadoEn` | Existen | |

### 2.5 Regla de repetición (clave `bloques`: «cuándo ocurre»)

| Campo | Estado | Notas |
|---|---|---|
| `id` | Existe | **Estable** (N4) |
| `horarioId` | Existe | Obligatorio |
| `columnaId` | Existe | **Obligatorio**, y sigue siendo **el día de la semana** de la regla: apunta a la columna de ese día (N2). Una regla = un día de la semana |
| `actividadId` | Existe | O `titulo` propio («Recreo») |
| `inicio`, `fin` | Existen | `HH:MM`, con `fin > inicio` (sin medianoche). **La duración se deriva** y no se guarda |
| **`serieId`** | **NUEVO**, opcional | Agrupa las reglas creadas juntas: «Mates lunes y jueves 8–9» son dos reglas con el mismo `serieId`. Los alcances actúan sobre la serie entera (§4) |
| **`desde`, `hasta`** | **NUEVOS**, opcionales | La **vigencia de esa regla**, que es la vigencia por actividad del Anexo §5. Se cruza con la del horario |
| `recurrencia` | Existe | `{ clase: 'siempre' }`, `{ clase: 'alternas', ancla }` (heredada, se sigue leyendo) y, **nueva, solo tras la guardia** (N5): `{ clase: 'ciclo', semanas: [índices] }`, que usa el `ciclo` del horario. 🔎 **Corrección 2026-11-09**: `alternas` es la repetición **«Cada dos semanas»** de una actividad, con su propia fecha de referencia (`ancla`). **Se conserva, se puede crear desde la pantalla y no depende de TP-5.** `ciclo` (las semanas A/B del horario) sí depende de TP-5: ninguna pantalla lo escribe mientras esté pendiente. Ver §18.6 |
| `filaId` | Existe | Solo informativo; el motor no lo usa |
| `ubicacion`, `notas`, `etiquetas`, `colorPropio`, `iconoPropio`, `titulo`, `descripcion`, `posicion` | Existen | |
| `creadoEn`, `actualizadoEn` | Existen | |

**Por qué una regla por día y no `dias: [1, 4]`** [DECISIÓN]:
1. Es la forma actual, y una copia antigua la sigue entendiendo (N2).
2. El choque se calcula por día de la semana sin desdoblar nada.
3. Cambiar la hora de **solo los lunes** de una serie es editar una regla; con `dias: [1, 4]` habría que partirla.

Los «días de repetición» del enunciado son **el conjunto de reglas de una serie**: se crean y se editan juntos desde la
pantalla, y se guardan uno por día.

**Configuración de excepciones**: la de una regla son las `excepciones` con su `bloqueId`. No se guarda nada más en la regla.

### 2.6 Categoría

```
Categoria = { id, nombre, color, orden?, creadoEn, actualizadoEn }
```

- Vive en `horarioTop.categorias`, **compartida por todos los horarios**, igual que las actividades [DECISIÓN].
  - Es «Estudio» en el horario de clases y en el de tardes, sin duplicarla.
  - Las categorías de un horario se **derivan** de las actividades de sus reglas: es el «Categorías» del apartado 4.1 del
    prompt, sin una segunda lista que mantener.
- **Opcional**: una actividad sin `categoriaId` es una actividad normal.
- **Borrarla**: se quita de la lista, y el normalizador deja `categoriaId = null` en las actividades que apuntaban a ella.
  **Ninguna actividad se borra ni se toca de otra forma** (Anexo §6). Pide confirmación con el recuento de actividades
  afectadas.
- **El color** [DECISIÓN]: se guarda **un identificador de la paleta** (`'azul'`, `'verde'`…), nunca un hex, para cumplir
  la regla 2 y que siga al tema.
  - Hoy `actividad.color` guarda un hex de `PALETA_ACTIVIDADES`, que vive en `horarioEditor.js`, fuera de `tokens.js`
    [CÓDIGO].
  - La Fase 4 lleva esa paleta a `tokens.js` con sus identificadores, y **lee los dos formatos**: un hex guardado se
    traduce al identificador más cercano solo al pintar. No se reescribe lo guardado (regla 6).
- **No va a la papelera**: no contiene datos, solo un nombre y un color. La confirmación basta. Así se evita una sexta
  colección que mantener.

### 2.7 Excepción

```
Excepcion = { id, fecha (AAAA-MM-DD, local), tipo, bloqueId, horarioId, cambios { inicio, fin, actividadId, titulo, ubicacion }, motivo }
```

- **Tipos: solo los cuatro de hoy** (`cancelado`, `modificado`, `anadido`, `dia_libre`), por N3. Todo lo que pide el
  rediseño cabe en ellos:
  - Un plan de una fecha es un `anadido` (arregla P10).
  - Una actividad puntual, también.
  - Un festivo es un `dia_libre`.
- **Una fecha inválida no se muda a hoy**: la excepción va a la **cuarentena** (§12), arreglando P12.

### 2.8 Registro de choques (§5)

```
choques = {
  historicos: [{ clave, detectadoEn (fecha), origen: 'migracion' | 'detectado' }],
  revisados:  [{ clave, revisadoEn (fecha), decision: 'mantener' }]
}
```

Solo se guardan **marcas**: el choque en sí se calcula siempre. Ver §5.

### 2.9 Cuarentena (§12)

```
Apartado = { id, coleccion, original (tal cual llegó), motivo, apartadoEn }
```

Es el mismo patrón que `fitness.cuarentena` (FIT F41). Recoge lo que la carga no entiende: reglas sin horario o sin
columna, excepciones con fecha inválida, ids repetidos con contenido distinto. Es **idempotente**: un mismo original no se
aparta dos veces.

> 🔎 **Revisión 2026-11-08**: la cuarentena **no** vive en `horarioTop` sino en la clave aparte `horarioCuarentena`, porque
> una copia antigua la borraría al guardar (N1). La consulta, la recuperación y el descarte están en el **§17.5**.

---

## 3. Motor temporal

### 3.1 Qué horarios cuentan (una sola función)

`horariosQueCuentan(estado, fecha, { horarioId })` devuelve los horarios **activos**, no archivados y con `fecha` dentro de
`desde`/`hasta`. Con `horarioId`, solo ese.

**Es la única que decide**, para acabar con la incoherencia de `docs/18` §1: Semana con uno, la línea de Hoy con el
seleccionado y Día/Agenda/Inicio con todos.

| Vista | Qué pasa |
|---|---|
| **«Horario»** (agenda conjunta) | Todos los activos |
| **«Mis horarios» → uno** | Ese, de forma explícita |
| **Editor** | El borrador compuesto sobre lo activo (§6.3) |
| **Inicio** y día del **Calendario** | La agenda conjunta (D-H3) |

### 3.2 Si una regla toca en una fecha

Una regla toca en una fecha si se cumplen las cuatro condiciones:
1. **Su horario cuenta** ese día (3.1).
2. **El día de la semana coincide**: la columna de la regla tiene `dia === diaDeFecha(fecha)` y no está en
   `horario.vista.diasOcultos`. Hoy, una columna oculta saca sus clases del cálculo, y eso se conserva.
3. **La vigencia de la regla** (`desde`/`hasta`) incluye la fecha.
4. **La recurrencia** lo permite:
   - `siempre`.
   - `alternas` con su ancla (como hoy).
   - `ciclo` con la semana del ciclo del horario (`semanaDelCiclo`, que ya existe).
   - Además, **la columna con `grupo` heredado se filtra por el ciclo** (`columnasDeLaFecha`, que ya existe y que hoy no
     se usa). **Esto arregla P1.**

### 3.3 `resolverDia(estado, fecha, contexto)`

- **Firma y salida compatibles** con las de hoy: los consumidores (Inicio, Calendario, mochila, avisos, plan, informe) no
  cambian.
- **Orden de composición** (el mismo que hoy, con la vigencia y el ciclo añadidos):
  1. Los `dia_libre` vacían el día (todos los horarios o uno).
  2. Por cada regla que toca: si hay un `cancelado`, fuera; si hay un `modificado`, se aplica.
  3. Se añaden los `anadido` de la fecha.
  4. Se ordena por inicio.
- **El evento resuelto gana campos** (solo se añaden): `tipo` de la actividad (arregla P11), `categoriaId`, `vinculo`,
  `serieId`, `intervalo: { ini, fin }` en minutos y, si viene de Fitness o de Imagen personal, lo que diga el vínculo
  (§8).
- **Intervalo continuo**: 11:00–13:00 es **un** evento con `ini = 660` y `fin = 780`. La vista lo pinta como un bloque que
  ocupa su altura proporcional, sin franjas (Anexo §10, arregla P3 y P4).

### 3.4 Agenda diaria y semanal

```
agendaConjunta(estado, fecha, contexto) → {
  fecha,
  eventos,        // con hora, de resolverDia (todos los horarios que cuentan)
  sinHora,        // de las fuentes vinculables activadas (Fitness: «Hoy toca Push»), §8
  choques,        // choquesDelDia(fecha), la ÚNICA fuente
  diaLibre        // si hay un día libre
}
agendaSemana(estado, fechaDeLaSemana, contexto) → 7 × agendaConjunta, de lunes a domingo
```

- `centroDelDia` (Inicio), `agendaDelDia` (Calendario) y `contextoTemporal` (Hoy) pasan a **leer de `agendaConjunta`**, sin
  cambiar su salida.
- Así el editor, Hoy, la semana, Inicio y el Calendario **no pueden contradecirse**: todos parten del mismo cálculo.

### 3.5 Medianoche

- `fin > inicio` en el mismo día, siempre. `validarCambio` rechaza el resto.
- **El mensaje deja de ser engañoso**: en vez de «Faltan las horas de esa franja», dirá «Las actividades no pueden pasar
  de la medianoche: termina a las 23:59 o divídela en dos días».

### 3.6 Fechas

- Siempre **locales** (`fechaLocalISO`, `addDays`, `diaDeFecha`), nunca `toISOString` (la lección se ha repetido seis veces
  en el proyecto).
- La unidad del ciclo es la semana de lunes a domingo (`lunesDe`).

---

## 4. Repeticiones y excepciones

### 4.1 Los tres alcances (Anexo §5)

`editarConAlcance(estado, { reglaId, fecha, alcance, cambios, hoy })` **no tiene alcance por defecto**: sin él, no escribe
(se conserva `ALCANCES` de HT F3, ampliado a tres). **Actúa siempre sobre un borrador** (§6) y pasa por `validarCambio`
antes de devolver nada.

| Alcance | Representación | Qué se toca |
|---|---|---|
| **Solo este día** | Una excepción `modificado` o `cancelado` en `fecha` para esa regla | Nada de la regla |
| **Este día y los siguientes** | **Se parte la serie** en `fecha`: cada regla de la serie recibe `hasta = fecha − 1` y nace una copia con `desde = fecha`, los cambios, **un id nuevo** y el **mismo `serieId`**. Las excepciones de esas reglas **con fecha ≥ `fecha`** pasan a la regla nueva | Las reglas de la serie, a partir de esa fecha |
| **Todas las repeticiones** | Ver la regla de no-retroactividad abajo | La serie entera, **sin reescribir el pasado** |

### 4.2 Que un cambio no afecte a fechas que no tocan

**El pasado no se reescribe** [DECISIÓN].
- Hay cosas guardadas que dependen de fechas pasadas: las clases marcadas como hechas (`completadas`, con `bloqueId` y
  fecha), el informe semanal (HT F11) y lo que se vio en el Día de una fecha pasada.
- Si «Todas las repeticiones» cambiara la regla en su sitio, el lunes pasado diría que la clase fue a las 10 cuando fue a
  las 9.

**Cómo se aplica:**
- «Todas las repeticiones» **parte la serie en `hoy`** si la serie ya tenía repeticiones antes de hoy. Si no las tenía (se
  creó hoy o empieza en el futuro), la edita en su sitio.
- Para él es indistinguible de editar «todas»: lo que queda por delante cambia entero, y el pasado no se mueve.

**Las excepciones que ya existían:**
- **Antes del corte**: se quedan con la regla antigua.
- **A partir del corte**: van con la nueva.
- Un `modificado` cuyos cambios **dejan de tener sentido** (por ejemplo, movía la clase de las 9 a las 11 y ahora la regla
  ya es a las 11) **se avisa en la vista previa y no se borra solo**.

**Corregir un error desde el principio** («la puse a las 9 y siempre fue a las 10»): no existe como alcance; es una
**cuestión pendiente** (§15).

**Las reglas que nacen de un corte:**
- Son **pequeñas**: unos 344 bytes [EJECUTADO, `docs/18` §5.1].
- Su crecimiento está acotado por el número de ediciones que él hace.
- Dos tramos contiguos **idénticos** se vuelven a juntar al confirmar (`fusionarTramos`): editar y deshacer no deja
  restos.

### 4.3 Vigencia propia

- Una regla con `desde`/`hasta` solo toca dentro de ese tramo.
- La **ficha de la actividad** permite poner la vigencia a todas sus reglas a la vez («Inglés intensivo solo en enero») o a
  una regla concreta.
- **Se cruza con la del horario**: cuenta lo más estrecho de las dos.

### 4.4 Lo que se rechaza siempre (`validarCambio`, §14.4)

- Horas imposibles (P8).
- Inicio ≥ fin (P9) o que crucen la medianoche.
- Una vigencia con `hasta < desde`.
- Una fecha inválida.
- Un choque nuevo (§5).
- Un alcance ausente.

**Una sola validación** para crear, editar, mover, duplicar, importar, el Asistente y el plan: cualquier escritura pasa por
ella. Hoy hay validaciones dispersas y «Solo este día» no tiene ninguna.

---

## 5. Conflictos

### 5.1 Una única fuente de verdad

- **`choquesDelDia(estado, fecha, contexto)`**:
  - Calcula los pares de eventos de la **agenda conjunta** de ese día que se solapan: `seSolapan` sobre `intervalo`, y dos
    eventos que solo se tocan (08:30–09:00 y 09:00–09:30) **no** chocan.
  - Ya tiene en cuenta ciclo, alternas, excepciones y vigencias, porque parte de `resolverDia`.
  - **Solo entran las actividades de Horarios.** Los elementos sin hora de Fitness o de Imagen personal no tienen
    intervalo y no chocan (D-H3, D-H6).
- **`choquesDeLaRegla(estado, candidata, { ignorar })`**: el choque de una **regla** con todas las demás, sin recorrer las
  fechas una a una:
  - Dos reglas pueden chocar si se solapan sus **vigencias** (cruzadas con la de su horario), comparten **día de la
    semana**, se solapan sus **horas** y sus **recurrencias coinciden alguna semana**.
  - La coincidencia de recurrencia se comprueba sobre una ventana **acotada**: el mínimo común múltiplo de sus periodos de
    semanas (1, 2 o el ciclo, como mucho 8, así que la ventana es de 840 semanas en el peor caso; en la práctica, 1 o 2).
  - Las excepciones fechadas (`anadido`, `modificado`) se comprueban **en su fecha**.
- Las cuatro reglas de hoy (`conflictosCon`, `conflictosDelDia`, `celda.conflicto`, `agendaDelDia.solapado`) **pasan a
  llamar a estas dos o desaparecen**.
  - La de la rejilla desaparece: al pintar por horas no existe «dos en una franja».
  - Sus pruebas se **dan la vuelta**, no se borran (Cambio mínimo, punto 6).

### 5.2 Identidad de un choque

`claveDeChoque(a, b)` es **determinista**, sin aleatorios:

| Tipo de choque | Clave |
|---|---|
| Entre dos reglas | `r:<idMenor>|<idMayor>` (los dos ids ordenados) |
| Con una excepción | `e:<idExcepción>|<idOtro>|<fecha>` |

Así el mismo choque se reconoce en cualquier aparato, el día que sea.

### 5.3 Estados de un choque (derivados; solo se guardan marcas)

| Estado | Cómo se sabe | Qué se enseña |
|---|---|---|
| **Pendiente de revisar** | Existe ahora, está en `historicos` (o es inesperado, ver abajo) y no está en `revisados` | En la lista de revisión, con «Resolver» (abre el editor en esas dos actividades) y «Mantener tal cual» |
| **Revisado (mantenido)** | Existe y está en `revisados` | Se ve marcado y no molesta. Se puede volver a abrir |
| **Resuelto** | Estaba en `historicos` y **ya no existe**, porque él movió, acortó, canceló o desactivó algo | «Resuelto», una vez. La marca se poda a los 30 días |
| **Desaparecido por un cambio legítimo** | Igual que «resuelto», pero desaparece por algo que no se hizo para resolverlo (se acaba la vigencia o se archiva un horario) | Igual que resuelto, con su motivo cuando se puede deducir |
| **Nuevo bloqueado** | **No se guarda nunca**: la operación que lo crearía no se aplica | La frase del choque en la propia pantalla («Ya tienes Inglés de 10:00 a 11:00 el martes, en «Academia»») |

**Choque inesperado**:
- Un choque que existe y **no está registrado** es inesperado. Puede llegar de otro aparato, de una copia antigua de la
  app o de la propia migración del ciclo.
- Se trata **como un histórico** (se enseña para revisar) y se registra con `origen: 'detectado'` en la siguiente
  escritura confirmada. **Nunca se resuelve solo.**

**Ningún cálculo modifica actividades**: el registro solo guarda claves y fechas, y los datos originales quedan intactos
(Anexo §4).

### 5.4 Dónde se bloquea

Se bloquea en todas las escrituras:
- Crear, editar (cualquiera de los tres alcances), mover y duplicar.
- Importar: `aplicarImportacion` deja de forzar.
- El Asistente.
- El plan (`aplicarPlan`).
- Confirmar un borrador.
- Activar un horario desactivado.
- Restaurarlo del archivo o de la papelera.

**Cuánto se comprueba:**
- Se comprueba **lo que cambia** contra todo lo demás, no todo el horario.
- Los choques históricos **no bloquean** cambios que no los toquen. Si no, un choque antiguo impediría editar cualquier
  otra cosa.

**«Ponerlo igualmente» y `forzar` desaparecen de la interfaz** (C4 de `docs/17`).

---

## 6. Borradores y versiones

### 6.1 Borrador (clave `horarioBorradores`)

```
horarioBorradores = { version: 1, borradores: [Borrador] }
Borrador = {
  id, horarioId (null si es un horario nuevo), origen: 'manual' | 'asistente' | 'importacion' | 'version',
  base: { actualizadoEn, versionNumero },           // con qué estado de la agenda empezó
  contenido: { horario, reglas: [Regla], excepciones: [Excepcion] },   // SOLO ese horario
  actividades: { nuevas: [Actividad], cambiadas: [Actividad] },        // SOLO las tocadas, nunca la lista entera
  categorias:  { nuevas: [Categoria] },
  dudosos: [{ ref, motivo }],                       // importación / Asistente (§10, §11)
  creadoEn, actualizadoEn
}
```

- **Qué se copia**: el horario que se edita, con sus reglas y excepciones, unos 16 KB para un horario de instituto
  [EJECUTADO]. No se copia `horarioTop` entero: actividades, categorías y otros horarios se **referencian**, y solo viajan
  las nuevas o las cambiadas.
- **Cuándo se guarda**: autoguardado con el patrón de Fitness (FIT F40):
  - A los **700 ms** de dejar de tocar.
  - Al esconder la página (`visibilitychange`, `pagehide`).
  - Al salir del editor.
  - Lo que se confirma tarde va sobre el borrador **de ahora** (`ref`), nunca sobre el del pintado.
- **Cuánto dura**:
  - Hasta confirmarlo o descartarlo.
  - Como mucho **un borrador por horario** más **tres de horarios nuevos**. Al llegar al tope se pide terminar o descartar
    uno.
  - Un borrador sin tocar en **30 días** se ofrece para descartar; **nunca se borra solo**.
- **La agenda activa no cambia**: `horarioTop` no se escribe hasta confirmar.

### 6.2 Cambios pendientes de confirmación

- `diferencias(borrador, estadoActivo)` es **derivado**, nunca guardado. Da lo que se añade, lo que se quita, lo que
  cambia y los choques nuevos.
- Es la vista previa: «3 clases nuevas, 1 cambiada (Inglés pasa a las 10:00 desde el 12/11), 0 choques».
- **Borrador viejo**:
  - Si el `actualizadoEn` del horario activo ya no coincide con `base`, **otro aparato o una edición rápida lo cambió
    mientras tanto**.
  - La vista previa lo dice, y antes de confirmar pide **«Sustituir por lo mío»** o **«Descartar mi borrador»**.
  - No hay fusión automática: el Anexo §12 pide sencillez, y una fusión equivocada perdería cambios en silencio.

> 🔎 **Revisión 2026-11-08**: esta comprobación es **del cliente**: solo ve los cambios que ese aparato ya ha recibido. **No
> protege de otro aparato que confirme casi a la vez**, ni es atómica. El análisis y las opciones de escritura condicional
> en el servidor están en el **§17.3** (TP-15).

### 6.3 Ver el horario mientras se edita

`componer(estadoActivo, borrador)` aplica el borrador **en memoria** para la vista previa del editor y para la validación.
Nunca se guarda.

### 6.4 Confirmación

**Orden de escritura** (no hay transacción entre claves; §0.5; con dos aparatos a la vez, ver el **§17.3**: este orden no lo
protege):

1. **Versión**: se añade el estado **anterior** del horario a `horarioVersiones`. Si falla, **no se sigue**, y el borrador y
   la agenda quedan como estaban. 🔎 **Corrección 2026-11-09**: esta escritura es **segura para las versiones anteriores**
   (§18.7): se escribe en el registro de este aparato, sin tocar el de ningún otro (§18.9). Si no se puede comprobar, la
   operación se detiene.
2. **Agenda**: se escribe `horarioTop` con el horario confirmado (`snapshotAndSave`, así el Deshacer global sigue
   funcionando). Si falla, la versión de más es inofensiva (§6.5).
3. **Borrador**: se quita de `horarioBorradores`. Si falla, el borrador sobrante se reconoce en la próxima carga, porque su
   contenido es igual al activo, y se ofrece descartarlo.

### 6.5 Versiones (clave `horarioVersiones`)

```
horarioVersiones = { version: 1, versiones: [Version] }   // 🔎 2026-11-09: es la VISTA fusionada; se guarda por aparato (§18.9)
Version = { id, horarioId, numero, creadaEn,
            motivo: 'confirmacion' | 'restauracion' | 'migracion' | 'manual',   // 'manual': corrección 2026-11-09
            nombre,                // texto que pone él; obligatorio-propuesto en las manuales, opcional en las automáticas
            renombradaEn,          // solo manuales: la última vez que cambió el nombre (o null)
            huella,                // SHA-256 del contenido con claves ordenadas: para reconocer una versión idéntica
            resumen: { reglas, excepciones },
            contenido: { horario, reglas, excepciones },
            actividadesUsadas: [Actividad] }   // solo las que esa versión usa, para poder rehacerlas si se borraron
```

> 🔎 **Corrección 2026-11-09 — versiones manuales (decisión de Josué, opción A)**:
> - **Automáticas** (`confirmacion`, `restauracion` y `migracion`): se crean solas al confirmar cambios importantes, al
>   restaurar y al migrar. **No se pueden renombrar ni eliminar** con las acciones de versiones.
> - **Manuales** (`manual`): las crea él con «Guardar una versión».
>   - Capturan **el horario tal como está confirmado en la agenda** (`horarioTop`), **nunca un borrador sin confirmar**,
>     aunque lo haya.
>   - Llevan el `nombre` que él escriba. Si lo deja vacío, se propone «Versión del 9 de noviembre».
>   - **Se pueden renombrar y eliminar a mano**, una a una.
> - **Una versión idéntica no se simula**:
>   - Si ya existe **una versión de ese horario con la misma `huella`**, no se crea otra.
>   - Se informa: «Ya tienes una versión igual: «Antes del segundo trimestre» (8 de noviembre)».
>   - 🔎 **Corregido (segunda revisión del 2026-11-09)**: una versión **automática** solo se da por «ya existente» si hay
>     otra **automática** con la misma huella. Una manual idéntica **no cuenta**, porque él puede eliminarla y la copia de
>     seguridad se perdería. Una **manual** se compara con todas.
> - **Eliminar una versión manual**:
>   - Con confirmación clara: «Se eliminará solo la versión «X». Tu horario y las demás versiones no cambian».
>   - Afecta **exclusivamente a esa versión**: ni al horario actual ni a otras versiones.
>   - No va a la papelera (la papelera guarda horarios). Es un borrado que pide él, no una poda: **TP-13 sigue intacto** (🔎 resuelta el 2026-11-09: se conserva todo, §18.12).
> - **Ninguna versión se elimina automáticamente**: ni por número, ni por antigüedad, ni por espacio (§17.1).
>   🔎 **Corregido (segunda revisión del 2026-11-09)**: tampoco al vaciar o caducar un horario en la papelera. **Sus
>   versiones se conservan** («Versiones de horarios eliminados», §7 y §18.7). Las automáticas no se pueden eliminar desde
>   la interfaz, y las manuales solo con «Eliminar esta versión».
> - **El autoguardado conserva el borrador; no crea versiones**: no hay copias periódicas mientras se edita.
> - **Horarios desactivados**: «Guardar una versión», «Versiones anteriores», renombrar, eliminar una manual y recuperar
>   (que crea un borrador) funcionan igual que en los activos: el horario existe entero y solo no sale en la agenda.
> - **Archivados**: se pueden **ver** sus versiones (solo lectura). Guardar, renombrar, eliminar o recuperar exige primero
>   recuperar el horario del archivo.
> - **Eliminados (en la papelera)**: sin acciones de versiones. Se conservan con el horario hasta que se restaure o se
>   vacíe.

- **Cuándo**: al confirmar un borrador, se guarda la versión **anterior**. Al migrar, una versión `migracion` por horario.
  Y la manual, cuando él la pide (ver la corrección de arriba).
- **Sin copias innecesarias**:
  - Si el contenido es igual al de la versión anterior, no se guarda.
  - Cada versión guarda **un** horario, no todos.
  - No se guardan versiones de las ediciones de un solo día («solo este día» sin borrador largo, §6.6).
- **Cuánto dura**:
  - Las **últimas 10 por horario**, unos 165 KB como mucho por horario [EJECUTADO, sobre 16,5 KB]. 🔎 **Revisión
    2026-11-08**: ese tope implica borrar versiones y **queda retirado** hasta que Josué lo autorice; se conservan todas
    (§17.1, TP-13).
  - ~~Las de un horario que se vacía de la papelera se borran con él.~~ 🔎 **Retirado (2026-11-09)**: se conservan (§18.7).
- **Restaurar una versión** crea un **borrador** (`origen: 'version'`): pasa por la vista previa y el bloqueo de choques
  como cualquier cambio. Un solo camino de escritura. 🔎 Al confirmarlo, el estado confirmado de ese momento se guarda
  antes como versión automática `restauracion` (§18.7).
- **Sin apartado de historial** (Anexo §8): las versiones se ven desde la ficha del horario («Versiones anteriores»).
- **Respaldo ante N1**: una copia antigua de la app no conoce esta clave y no la toca. Si `horarioTop` llega sin `version`
  y hay versiones de la 2, **una copia antigua lo sobrescribió**. Se avisa y se ofrece restaurar la última (§12.3).

### 6.6 Ediciones rápidas de un día

**«Cancelar hoy», «Mover solo hoy» y «Día libre»** son una excepción. Se hacen desde la agenda con **una hoja de
confirmación** que es su borrador en memoria, porque abrir el editor para cancelar una clase sería la fricción que el
Anexo §12 prohíbe.
- **Pasan por `validarCambio`** igual que el resto.
- **No crean versión**: se deshacen borrando la excepción, y el Deshacer global las cubre durante la sesión.

### 6.7 Crecimiento: qué se poda, cuándo y cuánto

> 🔎 **Revisión 2026-11-08 — esta tabla queda SUSTITUIDA por el §17.1**: **ninguna poda está aprobada**, ni de datos
> existentes ni de las estructuras nuevas. Todo se conserva y se mide. La tabla se deja como registro de lo que se propuso.

| Lista | Hoy | Tope propuesto | Cuándo se poda |
|---|---|---|---|
| Versiones | — | 10 por horario | Al añadir una |
| Borradores | — | 1 por horario + 3 nuevos | Al crear (pide elegir) |
| `choques.historicos` resueltos | — | 30 días tras resolverse | Al confirmar |
| `completadas` | Sin límite (C6) | 60 días | En las escrituras confirmadas, con `hoy` como parámetro |
| `mochila` | Sin límite (C6) | Lo que ya hace `podarMochila` (existe, nadie la llama) | En las escrituras confirmadas, con `hoy` como parámetro |
| `avisos` / `historialAuto` | 80 / 60 | Igual | Igual |
| Papelera | 30 días (global) | Igual | Lo de siempre |
| `avisos_programados` (Supabase) | — | 14 días por delante + 7 de enviados | La función de envío |

⚠️ **Nunca se poda en el normalizador**: dependería de la fecha de cada carga y dejaría de ser determinista. Es la lección
de FIT F41: «un valor por defecto que cambia en cada carga no es un valor por defecto».

---

## 7. Papelera

- **Se registra** `horarioTop.horarios` en la papelera global, con **los tres cambios** que exige CLAUDE.md:
  `CATALOGO_PAPELERA`, `MODULOS_PAPELERA` y su `if` en `snapshotAndSave`.
- Las **reglas y excepciones** del horario van en `relacionados` (`conArrastrados`), así que restaurar lo devuelve entero.
- **Las actividades no se borran con el horario**: son compartidas, igual que hoy. Una actividad que se queda sin ninguna
  regla se sigue viendo en «Tus actividades».
- **Restaurar**:
  - Si el horario volvería **activo** y **choca** con otro activo, se restaura **desactivado** y se dice por qué. No se
    activa a medias ni se toca nada del otro horario (Anexo §4).
- **Vaciar o caducar** (30 días, o la retención que haya elegido él) borra el horario de la papelera, como hoy cualquier
  elemento de la papelera global. `eliminarDeVerdad` (E3 F5) pasa a ser esa acción. 🔎 **Corregido (2026-11-09)**: **sus
  versiones y su borrador NO se borran** (ninguna versión se elimina sola, y un borrador nunca se borra solo, §6.1). Quedan
  en «Versiones de horarios eliminados», desde donde una versión se puede **recuperar como horario nuevo**
  (`versionComoBorrador` con `horarioId: null`).
- **Eliminación lógica**: el horario sale de `horarios` y entra en la papelera. Mientras está ahí, «Eliminado» es su estado
  (§2.3).

---

## 8. Integraciones

### 8.0 Reglas comunes (prompt §6 y Anexo §7)

- Un registro **`FUENTES_VINCULABLES`**, una línea por módulo, como `MODULOS_EH`.
- Cada línea define **cómo buscar**, **cómo leer en una fecha** y **qué se permite escribir**. Ninguna escribe en otro
  módulo, salvo la de Estudios, que ya lo hacía.

```
FuenteVinculable = {
  modulo, tipo, etiqueta ('de Estudios', 'de Fitness', 'de Imagen personal'),
  buscar(datosDelModulo, texto) → [{ id, nombre, detalle }],   // sin acentos (P16), nunca vincula sola
  existe(datosDelModulo, id) → boolean,
  nombre(datosDelModulo, id) → string | null,
  enFecha?(datosDelModulo, id, fecha) → { nombre, descanso?, sinPlan? } | null,
  escritura: 'ninguna' | 'crear-en-la-misma-llamada'
}
```

- **Mientras escribe**, el campo de nombre consulta `buscar` de todas las fuentes y enseña la procedencia.
- **Él elige**: vincular o «Crear una actividad independiente».
- **Nunca se vincula por coincidencia de nombre** (E3 F12): solo cuando él toca la sugerencia.
- **Identidad**: la actividad vinculada guarda la referencia (`asignaturaId` o `vinculo`), nunca una copia del elemento.
- **Si el elemento de origen desaparece**: la actividad no se borra. Se queda con su último nombre conocido, con «Ya no
  existe en Estudios» y la opción de desvincularla. Se avisa, no se decide.

### 8.1 Estudios (ya existe; se mantiene)

| Aspecto | Contrato |
|---|---|
| Qué se vincula | Asignaturas (`estudios.asignaturas`) |
| Identidad | `actividad.asignaturaId` |
| Nombre | Lo manda Estudios (`nombreDeActividad`) |
| Escritura | Crear una asignatura desde Horarios devuelve `asignaturaNueva`, y `App.jsx` guarda **los dos almacenes en una sola llamada** (`onCambiarConAsignatura`, E3 F26) |
| Borrado | `deleteAsignatura` → `limpiarHorarioDeAsignatura` y el aviso de `usosDeAsignatura`. ⚠️ Restaurar la asignatura **no devuelve sus clases** (C9): queda como cuestión aparte, fuera del alcance (§15) |
| Lectura | Exámenes para el plan, la sobrecarga y la ficha, como ahora |

### 8.2 Fitness (D-H6)

- **Qué se vincula**: «tu entrenamiento del día», es decir, **lo que diga el plan de Fitness en cada fecha**, no una rutina
  concreta ni una plantilla. Las rutinas cambian y se activan; el vínculo con el plan **sigue a lo vigente** y respeta los
  tramos anteriores (`planesAnteriores`): el pasado no se reescribe.
- **Lectura**: `enFecha(fitness, 'plan', fecha)` llama a **`planificadoEnFecha(fecha, contexto)`** de `tuPlan.js`, con el
  contexto que ya construye `tuPlan(fitness, { hoy })`.
  - Devuelve el nombre del día («Push»), si es descanso, o «sin plan».
  - Con `null` no inventa nada: «Fitness no tiene plan para ese día».
- **Dos formas de verlo**:
  1. **Sin hora**: si él activa «Mostrar mi entrenamiento en el horario» (nace apagado), la agenda conjunta enseña en
     `sinHora` «Hoy toca Push · Fitness». **No se le pone hora.**
  2. **Con hora**: solo si **él** crea una actividad vinculada («Entrenamiento», 18:00–19:30, lunes a viernes). Esa regla
     es suya, con sus horas. En cada fecha su título es lo que diga Fitness.

     🔎 **Corrección 2026-11-09 — un día de descanso según Fitness es TP-7, pendiente**: ni cómo se ve en Horarios ni si
     cuenta en Inicio están decididos. Las posibilidades, sin elegir ninguna, están en §15 (TP-7). Lo único fijo es lo
     técnico: la regla sigue existiendo ese día (sus horas son suyas) y `enFecha` devuelve `descanso: true`; qué se hace
     con eso en pantalla lo decide Josué.
- **Nunca**:
  - Copiar rutinas.
  - Crear sesiones.
  - Recuperar «semanas»: Fitness es cíclico desde su rediseño.
  - Importar nada de la sesión en vivo.
- **Escritura**: ninguna. **Fitness no se toca.**

### 8.3 Imagen personal

- **Útil vincular**: las **rutinas con días**, que ya generan eventos con `eventosDeRutinas` (`motorRutinas.js`):
  - Piel (que además guarda `hora` y `momento`).
  - Pelo, barba, cuerpo, manos y pies, y sonrisa.
- **Lectura**: `tocaEnFechaGenerico(rutina, fecha, tipoDe)`, la de cada módulo.
  - Sin hora → `sinHora` («Rutina de piel (noche)»), solo si él la activa.
  - Con la `hora` de la rutina de piel, se enseña **como dato de su recordatorio, no como regla de Horarios**: tampoco
    choca.
- **No útil (no se fuerza)**: productos, perfumes, armario y accesorios, perfil de estilo, ideas y descubrir. No son
  cosas que ocurran a una hora.
- **Escritura**: ninguna. Imagen personal está **congelada** (F65): no se modifica ni un archivo suyo.

### 8.4 Inicio / Hoy (D-H3)

- `centroDelDia.resumenDelDia` sigue contando «N eventos» y respetando `visibilidad.hoy`, ahora leídos de
  `agendaConjunta(hoy)`.
- **No se añade una lista de clases en Inicio.**
- `contextoTemporal` (el panel Hoy de Horarios) pasa a leer la agenda conjunta. Deja de filtrar la línea por el horario
  seleccionado, que era la incoherencia de `docs/18` §1.

### 8.5 Calendario (D-H3)

- El **día** sigue enseñando las clases (`agendaDelDia`), con `solapado` calculado por `choquesDelDia`. Esto arregla P13.
- El **mes no cambia**: no enseña las clases (C11 queda así por decisión).

### 8.6 Mochila

- No cambia de contrato: sigue derivando de `resolverDia` más `actividad.material`.
- Lo `manual: true` no se borra al recalcular (HT F7).
- La poda pasa a hacerse en las escrituras confirmadas (§6.7).

### 8.7 Sueño

- **Ninguna integración de datos.**
- Solo se protegen `DIAS_SEMANA` y `diaDeFecha`: pasan a la hoja `fechasSemana.js` y se reexportan desde `horario.js` y
  `hoy.js` con `export { }` (nunca `export … from`, EH F17), **con la misma firma**.

### 8.8 Notificaciones

- Un solo emisor y unos solos ajustes: los de la Fase A4 (`ajustes.notificaciones`: interruptor, categorías y horas de
  descanso), con la categoría `horario`.
- El push (§9) **lee los mismos ajustes**: nunca un segundo horario de silencio.

---

## 9. Notificaciones

### 9.1 Piezas

```
 aparato (PWA instalada)                         Supabase                               Vercel
 ───────────────────────                         ────────                               ──────
 public/sw.js (solo push)  ◀── push ──────────────────────────────────────────── api/push-enviar.js
 App: permiso + suscripción ── upsert ──▶ push_suscripciones                       ▲ (web-push o node:crypto)
 App: cola de avisos ───────── upsert ──▶ avisos_programados ◀── reclamar ─────────┤
                                          pg_cron (cada minuto) ── pg_net POST ───┘ (solo si hay algo debido)
```

### 9.2 Registro de aparatos, suscripciones y permisos

- **Permiso**:
  - Se pide **solo desde un botón** en Ajustes → Notificaciones → «Avisos con la app cerrada», un gesto del usuario como
    exige iOS [FUENTE].
  - Antes se comprueba que el navegador puede: `serviceWorker`, `PushManager`, `Notification`.
  - En iOS, que la app **esté instalada** (`display-mode: standalone` o `navigator.standalone`).
  - Si no lo está, se explica cómo añadirla a la pantalla de inicio. Nunca un botón que no funcione (regla 8).
- **Suscripción**:
  - `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID público })`.
  - Se guarda en `push_suscripciones`: usuario, `endpoint`, `p256dh`, `auth` y `aparato` (un nombre legible).
  - **Una por aparato.**
  - En Ajustes, la lista de aparatos con «Quitar».
- **Comprobación al abrir**: la app compara la suscripción del navegador con la guardada. Si cambió (renovación o
  `pushsubscriptionchange`), la actualiza.
  - El service worker no tiene la sesión de Supabase, así que **la renovación se completa al abrir la app** [DECISIÓN].
    Hay que comprobar en la Fase 7 si iOS renueva sin abrir [HIPÓTESIS].
- **Quitar el permiso o desactivar**: se borra la suscripción de ese aparato y su endpoint deja de recibir.

### 9.3 Service worker

`public/sw.js`:
- **Solo** los eventos `push` (→ `showNotification(título, { body, icon, tag: clave, data: { url } })`) y
  `notificationclick` (enfoca la app o la abre en `/?ir=horario`).
- **Sin manejador `fetch` y sin precaché**: no guarda páginas, así que **no puede congelar la aplicación en una versión
  vieja** (el riesgo histórico DEP-30).
- Se sirve con `Cache-Control: no-cache`, una línea más en `vercel.json`.
- Se registra en `main.jsx` solo si el navegador lo admite y solo cuando el usuario activa los avisos.
- En iOS, cada `push` tiene que terminar en `showNotification` o el sistema puede retirar la suscripción [HIPÓTESIS, Fase
  7]: el SW nunca recibe un `push` «vacío».

### 9.4 Programación (D-H2)

**Quién calcula** [DECISIÓN]:
- El **cliente** calcula los avisos de los **próximos 14 días** con la lógica de `avisosHorario.js`, ampliada a
  `avisosProgramables(estado, { desde, dias, ajustes })`.
- Los sube a `avisos_programados`, con una **clave determinista** por aviso (`<bloqueId>|<fecha>|<tipo>`).
- Se recalcula al cambiar el horario, al cambiar los ajustes de avisos y al abrir la app.
- El servidor **solo envía**: así no hace falta llevar el motor temporal a otro entorno.

**Límite honesto**: si no abre la app en 14 días, los avisos se acaban. **Se dice en Ajustes.**

**Las horas de descanso y las categorías** se aplican al calcular (como A4). Un aviso que caería en horas de descanso no
se programa.

**Zona horaria**: la hora se calcula en local en el aparato y se guarda como `timestamptz`. Al calcular 14 días por
delante con fechas locales, el cambio de hora de octubre y marzo queda bien.

**Disparador**:
- `pg_cron` cada minuto, que **solo** llama con `pg_net` si existe algún aviso debido:
  `select … where exists (select 1 from avisos_programados where estado = 'pendiente' and enviar_en <= now())`.
- Así la función de Vercel solo se invoca cuando hay algo que mandar.
- Supabase documenta `pg_cron` + `pg_net` cada minuto [FUENTE]. Que esté en el **plan gratuito** sin pausar el proyecto
  es la **comprobación de entrada de la Fase 7** [PENDIENTE].
- Un usuario del plan gratuito tuvo que envolver `net.http_post` en una función de base de datos [FUENTE, de terceros].

**Alternativa si `pg_cron` no sirve** [PENDIENTE]: un programador externo gratuito que llame a la función cada minuto. Se
evaluaría en la Fase 7: añade un servicio externo, y por eso es la segunda opción.

**Vercel Hobby no sirve como disparador**: solo cron diario [FUENTE].

### 9.5 Envío, reintentos, cancelaciones y suscripciones inválidas

**Función `api/push-enviar.js`** (Node, Vercel):
1. Comprueba un **secreto compartido** en la cabecera. El secreto lo guarda Josué en la Vault de Supabase y en las
   variables de Vercel.
2. **Reclama** los avisos debidos de forma atómica con una función SQL `reclamar_avisos(limite)` (`security definer`,
   solo para el rol de servicio), que los pasa a `enviando` y los devuelve. Así dos ejecuciones solapadas no mandan el
   mismo aviso dos veces.
3. Para cada aviso, lo envía a **todas las suscripciones** de ese usuario, con TTL de 1 hora y urgencia alta.

**Resultado de cada envío:**

| Respuesta | Qué se hace |
|---|---|
| 201 | `enviado`, con `enviado_en` |
| 404 o 410 | La **suscripción es inválida**: se borra |
| 429, 5xx o error de red | `intentos + 1` y `siguiente_intento` a 1, 5 y 15 minutos. Con 3 intentos fallidos, `fallido` |
| El aviso ya llega **más de 30 minutos tarde** | `caducado`: no se envía. «Nada de avisos atrasados» (E3 F11) |

**Cancelaciones**: al recalcular la cola, el cliente **borra los avisos pendientes** cuya clave ya no está (una clase
borrada o cancelada ese día) y actualiza los que cambiaron de hora. **Los enviados no se tocan.**

**Sin duplicados**:
- Con la app abierta, el emisor A4 **no muestra** los avisos de la categoría `horario` cuando hay una suscripción push
  activa en ese aparato.
- El aviso llega por el push o por la pantalla, nunca por los dos.

**Lo enviado ya no toca `horarioTop`**: se acaba con C8 (cada aviso gastaba un paso del Deshacer).

### 9.6 Evaluación del cifrado y envío estándar (D-H1)

| Opción | Qué es | Peso en el navegador | Dependencias | Riesgo |
|---|---|---|---|---|
| **A · `web-push`** (la estándar) | Librería de Node que firma con VAPID (RFC 8292) y cifra con aes128gcm (RFC 8291) | **0 bytes**: solo la importa `api/push-enviar.js`. Vite solo empaqueta lo que importa `src/` | `web-push` + `jws`, `asn1.js`, `http_ece`, `https-proxy-agent` (y `minimist` en la 3.6.7) [FUENTE: npm] | La **4.0.0 se publicó el 2026-11-06**, hace 2 días: demasiado reciente. La **3.6.7** (2024-01-16) es la candidata. Licencia **MPL-2.0** (copyleft por archivo; usarla sin modificarla no obliga a nada en el código propio) |
| **B · Propia con `node:crypto`** | ECDH P-256 + HKDF + AES-128-GCM y JWT ES256, unas 150–250 líneas [HIPÓTESIS sobre el tamaño] | 0 bytes | Ninguna | Hay que probarla contra los vectores de prueba del RFC 8291. Más código propio que mantener |
| **C · Edge Function de Supabase** | El envío en Deno (con `npm:web-push` o la B) | 0 bytes | Igual que A o B | La compatibilidad de `web-push` en Deno no está verificada [HIPÓTESIS]. Las claves irían a los secretos de Supabase y no a Vercel, al revés de lo que dice C2 |

**Recomendación** [PENDIENTE de autorización en la Fase 7]:
- **A con la versión 3.6.7 fijada exactamente** en `dependencies`, en la función de Vercel, con dos pruebas:
  1. Ningún archivo de `src/` importa `web-push`.
  2. El empaquetado del navegador no la contiene.

  Respeta «sin peso en el navegador» y usa lo estándar. Lo que no respeta al pie de la letra es C1 («la única dependencia
  nueva»): por eso **se pide su autorización expresa** antes de instalarla.
- **Si no se autoriza, B**, con sus vectores de prueba.
- C queda descartada salvo que la Fase 7 encuentre un motivo.

**Lo que hace Josué en la Fase 7** (no se hace nada de esto ahora):
1. Generar las claves VAPID. Se le da el comando o el método exacto.
2. Poner en Vercel `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`, `SUPABASE_SERVICE_ROLE_KEY` y
   `PUSH_CRON_SECRET`.
3. Ejecutar el SQL de las dos tablas, sus políticas, `reclamar_avisos` y el `cron.schedule`, con su consulta de
   comprobación.

### 9.7 Tablas (borrador del SQL de la Fase 7; no se ejecuta)

```
push_suscripciones (id uuid pk, user_id uuid not null → auth.users on delete cascade, endpoint text unique not null,
                    p256dh text not null, auth text not null, aparato text, creada_en timestamptz default now(),
                    ultima_ok timestamptz, fallos int default 0)
avisos_programados (id uuid pk, user_id uuid not null, clave text not null, modulo text not null default 'horario',
                    enviar_en timestamptz not null, titulo text not null, cuerpo text, url text,
                    estado text not null default 'pendiente'  -- pendiente | enviando | enviado | fallido | caducado
                    intentos int default 0, siguiente_intento timestamptz, enviado_en timestamptz,
                    unique (user_id, clave))
índice (estado, enviar_en); RLS activada; cuatro políticas auth.uid() = user_id en las dos
```

### 9.8 Criterio de aceptación del push

Un aviso **recibido con JosStyle cerrada en su iPhone** (Anexo §3). Solo él puede comprobarlo (R1).

---

## 10. OCR (importación)

### 10.1 Flujo

| # | Paso | Pieza | Dónde corre |
|---|---|---|---|
| 1 | Selección de archivos | `SelectorDeArchivos` (P1, que ya existe; `accept`: imágenes y PDF; sin `capture`) | Navegador |
| 2 | Lectura | Una imagen se reduce a unos 2 000 px de lado (`imagenes.js` ya redimensiona). Un PDF se abre con `pdfjs-dist` 4.10.38, que ya está: **con texto**, `getTextContent` con la posición de cada trozo (sin OCR); **escaneado**, cada página a un `<canvas>` (`page.render`) | Navegador |
| 3 | OCR local | `ocrLocal.js`: `import()` **dinámico** de `tesseract.js` **solo al importar**. Núcleo WASM, *worker* y `spa.traineddata.gz` (`best_int`, 2,1 MB) **servidos desde `public/ocr/`** con `workerPath`, `corePath` y `langPath` [HIPÓTESIS sobre las opciones de la v7, Fase 5]. El *worker* se termina al acabar | Navegador (*Web Worker*) |
| 4 | Extracción | `cajasATabla(palabras)` (pura): agrupa las cajas en columnas y filas por su posición. Reconoce la cabecera de días («Lunes», «L», «Lun») y la columna de horas | Pura |
| 5 | Interpretación de días y horas | `interpretarCeldas(tabla)` (pura): admite «8:00–9:00», «8-9», «08.00», «8h–9h», «de 8 a 9». Normaliza a `HH:MM`. Un nombre se compara **sin acentos** con las fuentes vinculables, **solo como sugerencia** | Pura |
| 6 | Información dudosa | `marcarDudosos`: confianza del OCR por debajo del umbral, hora no reconocida, día no reconocido, celda partida, choque entre dos celdas o un nombre que se parece a una asignatura (sugerencia). Cada dudoso con **su motivo** | Pura |
| 7 | Corrección manual | El **editor del borrador** (Fase 4) con los dudosos resaltados | Pantalla |
| 8 | Vista previa | `diferencias` + `choquesDeLaRegla` | Pura |
| 9 | Guardado como borrador | `crearBorrador({ origen: 'importacion', dudosos })` | `horarioBorradores` |
| 10 | Confirmación | §6.4. **No se confirma con dudosos sin revisar**: hay que tocarlos o descartarlos | Pantalla |

### 10.2 Garantías

- **Ningún archivo sale del aparato**:
  - Ni la imagen ni el PDF se suben a Storage ni a ninguna API.
  - El OCR no contacta con ninguna CDN.
  - Hay una prueba que barre `ocrLocal.js` buscando URLs externas.
- **No pesa en el arranque**: el trozo del OCR se mide fuera del principal y la prueba compara el tamaño del trozo de
  arranque antes y después.
- **Pegar texto** (desde un correo o un documento) usa los mismos pasos desde el 5.
- `previsualizarImportacion` y `aplicarImportacion` (HT F3) **se adaptan**: la segunda **deja de forzar** y escribe en un
  borrador.

### 10.3 Lo difícil, dicho

- Tesseract lee palabras con su caja; **no reconoce la tabla**. Reconstruirla es lógica propia por reglas.
- Se escribe pura y se prueba en Node con **cajas de ejemplo** (horarios reales anonimizados, si Josué aporta alguno).
- La velocidad en su iPhone está **sin medir**.

---

## 11. Asistente

### 11.1 Qué es (y qué no)

- Es una **ruta de creación** con conversación, por reglas, sin IA generativa ni API (DA-09, Anexo §1).
- Se llama **«Asistente»**.
- **No escribe la agenda**: cada orden produce o modifica un **borrador**, y lo confirma él.
- La creación manual sigue existiendo, igual de completa.

### 11.2 Piezas

| Pieza | Responsabilidad | Reutiliza |
|---|---|---|
| `interpretarOrden(texto, contexto)` (pura) | Texto → **intención** (`crear`, `mover`, `cancelar_dia`, `dia_libre`, `quitar`, `cambiar_vigencia`, `consultar`) con **huecos** (actividad, días, horas, fechas, alcance, horario, vigencia) | El léxico con tolerancia a erratas y la normalización de `motorConversacion.js`; las fechas y rangos de `fechasConversacion.js` |
| `queFalta(intencion)` | Lo que falta para poder construir la propuesta | — |
| `dialogoAsistente(estado, mensaje)` | Máquina de estados: pregunta lo que falta **con botones** (las opciones caducan con `origen`, como en el núcleo de chat), acumula la propuesta y **pregunta siempre el alcance**, que no tiene valor por defecto | El patrón de aclaraciones del núcleo de chat |
| `proponer(intencion, estado)` | Intención completa → **cambios sobre el borrador** (reglas, excepciones) | `editarConAlcance`, `validarCambio` |
| `organizar(peticion, estado)` | **Organización automática**: «3 horas de estudio por las tardes», «reparte Inglés en dos días». Busca huecos y propone | `huecosDelDia`, `planificador.js` (corregido: lo puntual va como excepción, P10) |
| Vista previa y correcciones | `diferencias` + `choquesDeLaRegla`; cada línea de la propuesta se puede cambiar o quitar antes de confirmar | Editor del borrador |

### 11.3 Reglas

- **Cuando dude, pregunta.** Nunca rellena un dato que no se dijo: ni días, ni horas, ni alcance, ni horario de destino si
  hay varios.
- **Los choques se enseñan y no se proponen**: el Asistente no puede saltarse el bloqueo (§5).
- **Las consultas** («¿qué tengo el jueves?», «¿cuándo tengo Inglés?») se contestan con `agendaConjunta`. Ahí sí puede
  entrar en el registro de chatbots (`ASISTENTES`, `MATRIZ_CANDIDATOS`):
  - Se quita `horarioTop` de `CLAVES_QUE_NINGUN_ASISTENTE_LEE`.
  - Recibe solo sus claves (`datosParaAsistente`, congeladas).
  - **No importa** `ui.jsx`, `ai.js` ni `supabase.js` (`test-asistentes-chat` lo vigila).
- **La escritura** la hace la pantalla del borrador, no el chat: se mantiene la regla «el chat no guarda nada».

---

## 12. Migración

### 12.1 Principios (condiciones del prompt §7)

1. **Nunca se descartan campos desconocidos.**
   - El normalizador único conserva con `...g` lo que no conoce, en el primer nivel y en cada entidad.
   - ⚠️ Esto se entrega **antes** que la versión 2 (12.3).
2. **No se elimina ningún dato original**:
   - Lo que no se entiende va a la **cuarentena**.
   - Se guarda una **copia exacta** en `horarioTop_respaldo_v1` antes del primer guardado en la versión 2, y **solo si esa
     clave no existe**: nunca se pisa una copia anterior.
   - Si la copia no se puede guardar, **no se migra** y se reintenta en la próxima carga (el patrón de Fitness, App.jsx
     915–935).
   - 🔎 **Revisión 2026-11-08**: «solo si la clave no existe» podría reutilizar una copia vieja de un intento anterior.
     Queda **sustituido por el §17.4**: una lista de copias con huella, que solo crece, verificada leyéndola antes de migrar.
3. **Validación antes y después**:
   - `diagnosticoHorarios` sobre lo crudo y sobre lo migrado.
   - Una **huella** del contenido que no debe cambiar: el número de reglas y excepciones válidas, los ids, las horas y las
     actividades.
   - Si la huella no cuadra, la migración **lanza** y se devuelve lo de antes tal cual (como `migrarFitness`).
4. **Integridad**: reglas sin horario o sin columna, excepciones con fecha inválida, ids repetidos, referencias a
   actividades que no existen y columnas sin día.
5. **Recuperar el estado anterior**: desde `horarioTop_respaldo_v1` (manual, con su confirmación) y desde
   `horarioVersiones` (una versión `migracion` por horario).
6. **Una migración parcial no inutiliza la app**: la migración es **pura y en memoria**. Si falla, se usa lo de antes y la
   app funciona como hoy. Lo migrado llega a la cuenta con el siguiente guardado normal.
7. **Compatibilidad con los demás módulos**:
   - La salida de `resolverDia` solo gana campos.
   - `asignaturaId`, `columnaId`, `activo` y `archivado` se siguen escribiendo.
   - Las utilidades de fecha conservan su firma.

### 12.2 Diagnóstico de solo lectura (D-H5, antes de la Fase 4)

`diagnosticoHorarios(crudo)` es pura y no escribe nada. Devuelve:
- Horarios por estado (activo, desactivado, archivado).
- Reglas, excepciones y actividades.
- **Columnas sin día** y reglas en ellas (P2).
- Reglas en columnas ocultas.
- Reglas sin horario o sin columna (las que hoy se pierden).
- Excepciones con fecha inválida (P12) o de tipo desconocido.
- **Ciclos con columnas con `grupo`** (P1: lo que cambiaría al aplicar el ciclo).
- Reglas `alternas`.
- **Choques actuales** con la regla única.
- Bloques de estudio creados por el plan (P10).
- Tamaño de `horarioTop` en bytes, y tamaño de `mochila` y `completadas`.
- Campos desconocidos.

**Cómo se lleva a sus datos** — 🔎 **TP-4 resuelto por Josué (2026-11-09)**:
- Con **un panel de diagnóstico de solo lectura**, que forma parte de la **entrega A** de la Fase 4 (§12.3). Enseña esos
  recuentos en su iPhone con los datos que la app ya carga. No escribe nada, no migra nada y no cambia ningún dato.
- **No se ejecuta ni se prepara ninguna consulta SQL en producción** como alternativa. La opción del `select` que había
  aquí queda descartada.
- El panel llega con el despliegue de la entrega A, que necesita su autorización como cualquier entrega.

**Sin diagnóstico no hay entrega B ni migración.** La entrega B no puede empezar hasta que:
1. el panel se haya ejecutado con sus datos reales;
2. él lo haya visto y revisado; y
3. se haya resuelto cualquier incidencia que lo pida (por ejemplo, TP-5 si aparecen ciclos con grupo, o los días sin
   elegir y las reglas que irían a la cuarentena, que se le enseñan antes).

### 12.3 La guardia de versión, en dos entregas (N1, N2, N6)

**Entrega A** (el inicio de la Fase 4, sin cambiar todavía la forma de los datos):
- El normalizador **conserva lo desconocido**.
- **Guardia**: si `horarioTop.version` es mayor que la que conoce la app, se pone en **solo lectura**, no guarda y lo
  dice, como `fitnessSoloLectura`.
  - 🔎 **Tal como está implementada** (v3.162.0, con las correcciones A, A3 y A4 aprobadas por Josué):
    `guardiaDeVersionHorario` (`horario.js`) se calcula **sobre lo que llegó de la cuenta, antes de normalizarlo**, y da
    solo lectura con tres motivos: `version_futura`, `version_ilegible` (una `version` **presente y no nula** que no es un
    entero mayor o igual que 1, como `'dos'`, `0` o `1.5`) y `datos_malformados` (la raíz no es un objeto, o una
    colección no tiene la forma esperada: guardarla la sustituiría por una vacía). **Una `version` ausente, `null` o
    `undefined` cuenta como «sin versión»** —la forma de todo lo guardado antes de la A— y **no bloquea por este motivo**;
    se sigue comprobando si los datos están malformados. Una cuenta **sin** `horarioTop` se puede guardar. El solo lectura alcanza **todas las
    rutas de escritura** de Horarios.
- **El panel de diagnóstico de solo lectura** (§12.2, TP-4 resuelto).
- La hoja `fechasSemana.js`.
- 🔎 **La A-bis** (publicada junto con la A, v3.162.0): las señales del §17.2 —`version` y testigo en `horarioTop` y la
  fila `horarioGuardia:<aparato>`—, la clasificación al cargar y el evaluador de las condiciones de la B (§18.13).

Desde esa entrega, ninguna copia de la app puede borrar campos nuevos.

**Entrega B** (después, con margen para que su iPhone y sus pestañas hayan recargado la A):
- La versión 2 de verdad: migración, campos nuevos, borradores, versiones y papelera.
- 🔎 **Condición previa (TP-4, 2026-11-09)**: el diagnóstico de la entrega A ejecutado con sus datos, revisado por él y
  con sus incidencias resueltas (§12.2). Sin eso, la entrega B no empieza.

> 🔎 **Revisión 2026-11-08**: esperar un margen **no garantiza** que no quede una copia antigua. Las señales que deja la A
> (testigo, registro de aparatos, registro de la guardia), las cinco condiciones para que la B migre, entre ellas la
> confirmación de Josué, y la recuperación si una copia antigua escribe después están en el **§17.2**. 🔎 **Desde la
> A-bis (2026-11-15)**: el registro de aparatos y el de la guardia son **una sola fila por aparato**,
> `horarioGuardia:<aparato>`; el detalle implementado está en el **§18.13**.

**El riesgo que queda**:
- Una copia **anterior a la A**, abierta todo ese tiempo sin recargar, aún podría guardar encima.
- Se detecta: `horarioTop` llega **sin `version`** y `horarioVersiones` tiene versiones de la 2.
- Se avisa y se ofrece restaurar la última versión.
- Lo único que lo eliminaría del todo es la escritura condicional en el servidor («el servidor no deja ganar a una escritura
  vieja»), que necesita SQL de Josué y es una fase pendiente aparte (§15).

### 12.4 Migración 1 → 2 (pura, `MIGRACIONES_HORARIO`)

| Dato antiguo | Qué hace la migración | Qué no hace |
|---|---|---|
| Sin `version` | `version: 2` | — |
| Campos desconocidos | Se conservan tal cual | Descartarlos |
| Horarios duplicados (mismo id repetido) | Si el contenido es idéntico, uno solo. Si difiere, el segundo va a la cuarentena | Elegir uno por su cuenta |
| Horarios «copia» que chocan (P14) | Nada: el choque se registra como histórico | Desactivarlos o tocarlos |
| Actividades sin categoría | `categoriaId: null` (no hace falta escribirlo) | Inventarles una |
| Reglas | `serieId: null`, sin `desde`/`hasta`. Recurrencia tal cual | Agruparlas en series por su nombre |
| Reglas sin horario o sin columna | A la cuarentena (hoy se pierden) | Borrarlas |
| Reglas en columnas **sin día** (P2) | Se conservan **sin tocar**: siguen sin salir en ningún día, como hoy, y salen en la revisión («Elige qué día es») | Adivinar el día |
| Columnas con `grupo` + ciclo (P1) | Se conservan. El motor **aplicará** el ciclo, y eso cambia lo que se ve: el diagnóstico lo enseña y **se le pregunta antes** (§15) | Aplicarlo en silencio |
| Excepciones con fecha inválida (P12) | A la cuarentena | Mudarlas a hoy |
| Excepciones de tipo desconocido (N3) | A la cuarentena | Convertirlas en `cancelado` |
| Reglas sin id (N4) | Id derivado de forma estable (horario + columna + inicio + posición) o cuarentena si choca con otro | Un `uid()` distinto en cada carga |
| Choques existentes | Registrados en `choques.historicos` con `origen: 'migracion'` | Resolverlos |
| `config` y `ajustesAvisos` | Se conservan (el normalizador único) | Perderlos |
| Bloques de estudio del plan (P10) | Se conservan; el diagnóstico los cuenta | Convertirlos (cambiaría su horario) |
| Borradores | No existen antes: no hay nada que migrar | — |
| Relaciones con otros módulos | `asignaturaId` tal cual; `vinculo` no existe antes | Vincular por nombre |
| Paleta en hex | Se lee tal cual | Reescribirla |

### 12.5 La migración real, paso a paso (sin ejecutar)

1. Entrega A desplegada (con su autorización), con el panel de diagnóstico de solo lectura (§12.2).
2. Él ve el diagnóstico con sus datos reales. Si aparecen casos raros (ciclos con grupo, columnas sin día, choques), se le
   enseñan y se resuelven **antes** de la B (TP-5 incluido). La A sigue en uso unos días (TP-12, §17.2).
3. Entrega B: en la primera carga, `migrarHorarioTop(crudo)` en memoria.
   - Si va bien, se guarda `horarioTop_respaldo_v1` (solo si no existe). Si eso falla, no se migra.
   - Luego las versiones `migracion` y, con el siguiente guardado, `horarioTop` en la versión 2.
4. Comprobación posterior: `diagnosticoHorarios(migrado)` y huella iguales. Recuento visible en la pantalla de revisión.
5. Vuelta atrás: «Restaurar la copia de antes del cambio» (respaldo) o una versión concreta.

---

## 13. Diagramas

### 13.1 Entidades

```
                          ┌──────────────┐ 0..n  ┌─────────────┐
                          │  Categoria   │◀──────│  Actividad  │──asignaturaId──▶ Estudios.asignatura
                          │ id,nombre,   │categ. │ id,nombre,  │──vinculo───────▶ Fitness (plan) / Imagen (rutina)
                          │ color,orden  │ oriaId│ tipo,color… │
                          └──────────────┘       └─────▲───────┘
                                                       │ actividadId (0..1)
 ┌───────────────┐ 1   n ┌────────────────────┐ n      │
 │   Horario     │──────▶│  Regla (bloque)    │────────┘
 │ id,nombre,    │       │ id,horarioId,      │ 1    n ┌────────────────────┐
 │ activo,       │       │ columnaId(=día),   │───────▶│ Excepcion          │
 │ archivado,    │       │ inicio,fin,serieId,│        │ fecha,tipo,cambios │
 │ desde,hasta,  │       │ desde,hasta,       │        └────────────────────┘
 │ ciclo,vista,  │       │ recurrencia        │
 │ columnas[día] │       └────────────────────┘
 └──────┬────────┘
        │ (claves aparte)
        ├──▶ Borrador (1 por horario)  ── contenido: horario + reglas + excepciones
        ├──▶ Version (sin tope, §18.1) ── contenido: horario + reglas + excepciones + actividades usadas
        └──▶ Papelera (entrada con relacionados: reglas, excepciones)
 choques { historicos[clave], revisados[clave] }   cuarentena[original, motivo]
```

### 13.2 Dependencias

```
 fechasSemana.js ◀── horario.js, hoy.js (reexportan) ◀── Fitness (9 archivos), Sueño
 horario.js ◀── migracionHorario, motorHorario ◀── choquesHorario ◀── validacionHorario ◀── alcancesHorario
 motorHorario ◀── hoy.js (contextoTemporal), centroDelDia (Inicio), agendaDia (Calendario), mochila, avisosHorario, analitica
 fuentesVinculables ──lee──▶ asignaturas (Estudios), tuPlan.planificadoEnFecha (Fitness), motorRutinas (Imagen personal)
 borradoresHorario, versionesHorario ◀── alcancesHorario, importacionHorario, asistenteHorario
 ocrLocal ──import() dinámico──▶ tesseract.js (public/ocr)        pdfjs-dist (ya existe)
 avisosPush ◀── avisosHorario (avisosProgramables) ──▶ Supabase avisos_programados
 Ningún módulo de fuera importa los servicios de Horarios: solo motorHorario (lectura) y las utilidades de fecha.
```

### 13.3 Guardado (un cambio en el editor)

```
 toque ─▶ cambio sobre el BORRADOR (en memoria) ─▶ validarCambio ─┬─ error ─▶ frase en pantalla, nada cambia
                                                                  └─ ok ─▶ borrador actualizado
                                                                            └─(700 ms / pagehide)─▶ saveData('horarioBorradores')
 La agenda activa (horarioTop) NO se escribe.
```

### 13.4 Confirmación

```
 «Revisar y guardar» ─▶ diferencias + choquesDeLaRegla (vista previa)
     ├─ dudosos sin revisar ─▶ no deja confirmar
     ├─ choques nuevos ─▶ no deja confirmar (dice cuáles)
     ├─ base cambiada ─▶ «Sustituir por lo mío» / «Descartar mi borrador»
     └─ confirmar ─▶ 1) guardar versión anterior (si falla: parar)
                    2) snapshotAndSave(horarioTop)  (Deshacer global)
                    3) quitar el borrador
                    4) recalcular la cola de avisos (Fase 7)
```

### 13.5 Migración

```
 carga ─▶ crudo ─▶ ¿version > conocida? ─sí─▶ SOLO LECTURA (no guarda, lo dice)
                       │no
                       ▼
            ¿version < 2? ─no─▶ normalizador único ─▶ cuarentena ─▶ estado
                       │sí
                       ▼
            migrarHorarioTop(copia) ─▶ huella ok? ─no─▶ lo de antes tal cual (+ aviso en desarrollo)
                       │sí
                       ▼
            ¿existe respaldo_v1? ─no─▶ guardar respaldo ─▶ ¿ok? ─no─▶ no migrar (reintentar en la próxima carga)
                       │sí / ok
                       ▼
            versiones 'migracion' ─▶ estado v2 ─▶ siguiente guardado normal
```

### 13.6 Resolución de choques

```
 choquesDelDia / choquesDeLaRegla ─▶ clave determinista
   ├─ en revisados ─▶ «Revisado» (no molesta)
   ├─ en historicos o inesperado ─▶ «Pendiente» ─▶ [Resolver: abre el borrador en esas dos] / [Mantener tal cual: revisados]
   └─ estaba en historicos y ya no existe ─▶ «Resuelto» (se poda a los 30 días)
 Operación nueva que lo crearía ─▶ BLOQUEADA (no se guarda nada)
```

### 13.7 Integración al escribir un nombre

```
 escribe «mat» ─▶ buscar() en Estudios, Fitness, Imagen personal (sin acentos)
    ─▶ sugerencias con procedencia: «Matemáticas · de Estudios»
    ├─ toca la sugerencia ─▶ actividad vinculada (asignaturaId / vinculo), sin copiar nada
    └─ «Crear una actividad independiente» ─▶ actividad nueva sin vínculo
 Nunca: vincular porque el nombre coincide.
```

---

## 14. Contratos

**Son firmas, no implementaciones.** Todas son puras salvo donde se dice. Ninguna escribe si le falta `confirmado` o el
alcance. Los errores se devuelven como frases que puede leer Josué, nunca como excepciones sin capturar.

### 14.1 Hoja de fechas (`fechasSemana.js`)

```
DIAS_SEMANA: [{ dia: 1..7, label, corto }]       // lunes = 1 (sin cambios)
diaDeFecha(fechaISO) → 1..7 | null                // sin cambios
diasEntre(desde, hasta) → entero                  // la de hoy.js, sin cambios (≠ la de rachas.js)
```

### 14.2 Modelo y carga (`horario.js`, `migracionHorario.js`)

```
VERSION_HORARIO = 2
normalizarHorarioTop(crudo) → estado            // ÚNICO; conserva lo desconocido
migrarHorarioTop(crudo, { migraciones, hasta }) → { estado, migrada, desde, futura, error }
apartarLoQueNoCarga(crudo, normalizado, { ahora }) → { estado, nuevos }   // cuarentena idempotente
diagnosticoHorarios(crudo) → Diagnostico        // solo lectura (§12.2)
estadoDeHorario(h) → 'activo' | 'desactivado' | 'archivado'
cambiarEstado(estado, horarioId, nuevo, { hoy, confirmado }) → { estado, error, choques }
```

### 14.3 Motor (`motorHorario.js`)

```
horariosQueCuentan(estado, fecha, { horarioId }) → Horario[]
reglaTocaEn(estado, regla, fecha) → boolean
resolverDia(estado, fecha, { asignaturas, horarioId, fuentes }) → Evento[]   // salida compatible + campos nuevos
agendaConjunta(estado, fecha, contexto) → { fecha, eventos, sinHora, choques, diaLibre }
agendaSemana(estado, fecha, contexto) → [7 × agendaConjunta]
```

### 14.4 Choques y validación (`choquesHorario.js`, `validacionHorario.js`)

```
seSolapan(a, b) → boolean                                        // sin cambios: los extremos no chocan
claveDeChoque(a, b) → string
choquesDelDia(estado, fecha, contexto) → Choque[]
choquesDeLaRegla(estado, candidata, { ignorar }) → Choque[]
estadoDeChoque(estado, clave, existe) → 'pendiente' | 'revisado' | 'resuelto'
marcarRevisado(estado, clave, { hoy }) → estado
validarCambio(estado, cambio, { hoy }) → { ok: true } | { ok: false, motivo, choques? }
```

### 14.5 Alcances (`alcancesHorario.js`)

```
ALCANCES = { SOLO_ESTE_DIA, ESTE_Y_SIGUIENTES, TODAS }           // sin valor por defecto
editarConAlcance(borrador, estado, { reglaId, fecha, alcance, cambios, hoy }) → { borrador, error, avisos }
partirSerie(borrador, serieId | reglaId, fecha) → borrador
fusionarTramos(borrador) → borrador
```

### 14.6 Borradores y versiones

```
crearBorrador(estado, { horarioId | null, origen, hoy }) → Borrador
aplicarAlBorrador(borrador, cambio) → { borrador, error }
componer(estado, borrador) → estado              // en memoria, nunca se guarda
diferencias(borrador, estado) → { anadidas, quitadas, cambiadas, choquesNuevos, baseCambiada }
confirmarBorrador(estado, borrador, { hoy, confirmado }) → { estado, version, error }   // sin confirmado no escribe
descartarBorrador(borradores, id) → borradores
// 🔎 Corrección 2026-11-09: SIN tope (el «tope 10» anterior contradecía el §17.1) y con versiones manuales.
guardarVersion(versiones, horarioId, contenido, { motivo, nombre = '', hoy })
  → { versiones, version }                      // creada
  | { versiones, igualA: Version }             // ya existía una idéntica (misma huella): NO se crea otra; se informa
  // motivo 'manual': `contenido` sale SIEMPRE del horario confirmado (horarioTop), nunca de un borrador
renombrarVersion(versiones, versionId, nombre) → { versiones, error }        // solo manuales; error si es automática
eliminarVersionManual(versiones, versionId, { confirmado }) → { versiones, error }
  // solo manuales; sin `confirmado` no borra; quita ÚNICAMENTE esa versión; nunca toca horarioTop ni otras versiones
accionesDeVersion(version, estadoDelHorario) → ['ver', 'recuperar', 'renombrar', 'eliminar', …]
  // según el motivo (manual/automática) y el estado del horario (activo, desactivado, archivado, eliminado)
versionComoBorrador(version, estado) → Borrador
```

> 🔎 **2026-11-09 (§18.9)**: `versiones` es la **vista fusionada** de todos los registros. `guardarVersion`, `renombrarVersion`
> y `eliminarVersionManual` no reescriben esa lista. Devuelven además **la operación** que se añade al registro de este
> aparato: una versión creada, un renombre o una marca de eliminación. Eliminar es escribir una marca; nunca se quita nada
> de un registro. `versionId` = el `opId` de la operación que creó la versión.

### 14.7 Papelera (catálogo global)

```
CATALOGO_PAPELERA['horarioTop.horarios'] = { modulo: 'horarioTop', coleccion: 'horarios', tipo: 'Horario', campos: ['nombre'] }
eliminarHorarioAPapelera(estado, horarioId, { ahora }) → { estado, entrada }      // con relacionados
restaurarHorario(estado, entrada, { hoy }) → { estado, desactivado: boolean, choques }
```

### 14.8 Categorías

```
crearCategoria(estado, { nombre, color }) → { estado, error }
editarCategoria(estado, id, cambios) → { estado, error }
impactoDeBorrarCategoria(estado, id) → { actividades: n }
borrarCategoria(estado, id, { confirmado }) → estado                // sus actividades quedan sin categoría
```

### 14.9 Integraciones (`fuentesVinculables.js`)

```
FUENTES_VINCULABLES: FuenteVinculable[]                          // §8.0
sugerencias(texto, datos) → [{ modulo, etiqueta, id, nombre, detalle }]
vincular(actividad, { modulo, id }) → actividad                  // estudios → asignaturaId; otros → vinculo
vinculoDe(actividad) → { modulo, id } | null
enFecha(vinculo, datos, fecha) → { nombre, descanso?, sinPlan? } | null
```

### 14.10 Importación y Asistente

```
leerPdf(archivo) → { paginas: [{ texto: [{ str, x, y, w, h }] } | { imagen: Canvas }] }   // pdfjs, bajo demanda
reconocer(imagen, { alProgresar }) → { palabras: [{ texto, confianza, caja }] }           // ocrLocal, bajo demanda
cajasATabla(palabras) → Tabla
interpretarCeldas(tabla, datos) → { reglas, dudosos }
propuestaDeImportacion(resultado, estado, { hoy }) → Borrador                              // origen 'importacion'
interpretarOrden(texto, contexto) → Intencion
queFalta(intencion) → Pregunta[]
dialogoAsistente(sesion, mensaje, estado) → { sesion, respuesta, botones, borrador? }      // no guarda nada
organizar(peticion, estado, { hoy }) → Propuesta
```

### 14.11 Exportación visual (Fase 4, D-H7; `exportacionVisualHorario.js`)

```
dibujarDia(lienzo, agendaConjunta, { tema, colores }) → void          // Canvas 2D, colores desde tokens
dibujarSemana(lienzo, agendaSemana, { tema, colores }) → void
exportarPng({ alcance: 'dia' | 'semana', fecha }) → Blob               // toBlob
exportarPdf({ alcance, fecha }) → Blob                                 // escritor PDF mínimo: 1 página A4, JPEG (DCTDecode)
compartir(blob, nombre) → navigator.share({ files }) o descarga
```

- Sin dependencias: no hay `jspdf` ni `html2canvas` [CÓDIGO].
- Centrado, legible, preparado para imprimir y con los colores configurados (Anexo §9).
- 🔎 **Colores, decisión B de Josué (2026-11-09)**:
  - El PDF y la imagen usan **el mismo color ajustado** que la pantalla: `fondoLegible(hex)` (`docs/20` §15.1) y su texto
    `bestReadableText`. Es **una sola regla** para la pantalla y la exportación.
  - El color que él eligió **no se toca**: `fondoLegible` es pura, recibe el valor guardado y devuelve el que se pinta.
  - Exportar **no escribe nada**: ni `horarioTop`, ni la agenda, ni el color.
  - Prueba de la Fase 4: la misma actividad da el mismo color en `dibujarDia` que en la pantalla, y `horarioTop` sigue
    idéntico (por huella) antes y después de exportar.
- El escritor de PDF se prueba en Node (estructura, `xref`, tamaño de la página).
- `navigator.share` con archivos, en su iPhone [NO VERIFICADO].

### 14.12 Avisos push

```
avisosProgramables(estado, { desde, dias = 14, ajustes, agenda }) → [{ clave, enviarEn, titulo, cuerpo, url }]
sincronizarCola(cliente, usuario, avisos) → { creados, cambiados, borrados }       // efecto: Supabase (Fase 7)
suscribirAparato() → { ok, motivo }                                               // efecto: permiso + suscripción
// servidor
POST /api/push-enviar  (cabecera x-cron-secreto) → { enviados, fallidos, caducados, suscripcionesBorradas }
reclamar_avisos(limite int) → setof avisos_programados                           // SQL, security definer
```

---

## 15. Decisiones técnicas pendientes

Ninguna bloquea la Fase 3.

| # | Cuestión | Propuesta | Quién o cuándo |
|---|---|---|---|
| **TP-1** | Instalar `web-push` 3.6.7 (solo en el servidor) o la implementación propia con `node:crypto` (D-H1) | `web-push` 3.6.7 fijada, con la prueba de que no llega al navegador | **Autorización expresa** en la Fase 7 |
| **TP-2** | `pg_cron` + `pg_net` en el plan gratuito sin pausar el proyecto (D-H2) | Comprobarlo al entrar en la Fase 7; si no, un programador externo | Fase 7 |
| **TP-3** | Claves VAPID, la clave de servicio de Supabase y el secreto del cron en Vercel; el SQL de las tablas y del cron | Se le dan los pasos y el SQL exactos | **Josué**, Fase 7 |
| **TP-4** | Cómo llevar el diagnóstico a sus datos (D-H5) | 🔎 **RESUELTA por Josué el 2026-11-09**: un **panel de solo lectura en la entrega A**; ningún SQL en producción. Haberlo visto, revisado y resuelto sus incidencias es la condición de la entrega B y de cualquier migración (§12.2) | Resuelta |
| **TP-5** | Si el diagnóstico encuentra **ciclos con grupo**: aplicar el ciclo cambia lo que ve | 🔎 **2026-11-09: se decide después del diagnóstico de la entrega A, y solo si aparecen.** Enseñárselo y preguntar antes de la entrega B. **Pendiente de Josué; no se implementa ninguna opción sin preguntarle** (§17.6). 🔎 **2026-11-09**: mientras esté pendiente, **ninguna pantalla muestra controles de semanas A/B**; la configuración del ciclo se conserva en los datos y en el diseño, inactiva (§18) | **Josué**, si aparece |
| **TP-6** | «Corregir desde el principio» (cambiar también el pasado) como cuarto alcance | **No añadirlo** (Anexo §5 fija tres); el pasado se conserva (§4.2) | Fase 3 (si en la interfaz hiciera falta) |
| **TP-7** | Una actividad vinculada a Fitness en un día de descanso: cómo se ve en Horarios y si cuenta en «N eventos» de Inicio | 🔎 **2026-11-09: ninguna opción aprobada**, ni la visual ni la de Inicio. **En Horarios**: (A) verse atenuada con «Descanso según tu plan»; o (B) verse igual que cualquier día, con el título que dé Fitness («Descanso»). **En Inicio**: contarla, no contarla o contarla con otra etiqueta. En todos los casos sigue contando en las coincidencias, porque sus horas son suyas. **Pendiente de Josué; no se implementa ninguna sin preguntarle** (§17.6) | **Josué** |
| **TP-8** | La escritura condicional en el servidor contra copias antiguas | 🔎 **Unificada en el TP-15 (2026-11-09)**: es la misma cuestión. Se trata allí (§17.7), para no tener dos decisiones sobre lo mismo | Ver TP-15 |
| **TP-9** | Anotar en `docs/03` D-H4 y las decisiones de esta fase | 🔎 **RESUELTA documentalmente el 2026-11-10**: anotadas en `docs/03` como C-80 a C-86 y DEP-31 a DEP-33, con DEP-22, DEP-30 y C-71 ampliadas. TP-10 queda fuera (no es de Horarios) | Resuelta |
| **TP-10** | C9: restaurar una asignatura no devuelve sus clases | Fuera del alcance de Horarios (es de la papelera de Estudios); anotarlo | Josué |
| **TP-11** | Las opciones de `tesseract.js` 7 para servir sus archivos desde la app, y la velocidad en su iPhone | Comprobarlo al empezar la Fase 5; la instalación necesita autorización | Fase 5 |
| **TP-12** | El margen entre la entrega A y la B | Al menos unos días de uso real de la A, **más las condiciones del §17.2**: el margen solo no basta. 🔎 **Sigue sin decidir (2026-11-15)**: el evaluador de la A-bis recibe el margen como parámetro (`margenDias`) y, mientras no estén fijados el margen y los requisitos de la hora del servidor, la condición 1 da «no verificable» (§18.13) | Fase 4 |

> 🔎 **Revisión 2026-11-08**: se añaden **TP-13 a TP-17** (§17.7): la poda, el aviso de versión nueva, la protección real
> entre aparatos, pedir `updated_at` en la carga y las claves nuevas.

---

## 16. Criterios de aceptación

### 16.1 De esta fase (Fase 2)

| Criterio (prompt de la Fase 2) | Estado |
|---|---|
| Revisión de la Fase 1: hallazgos, problemas que condicionan, dependencias, limitaciones, decisiones cerradas y pendientes | ✅ §0 |
| Modelo: horarios (estados, fechas, visualización, categorías, metadatos, varios activos) | ✅ §2.3 |
| Modelo: actividades (identidad, horas, duración derivada, días, vigencia, categoría, color, notas, profesor, aula, material, procedencia, vínculo, excepciones) | ✅ §2.4, §2.5 |
| Repeticiones con los tres alcances y sin retroactividad indebida | ✅ §4 |
| Categorías opcionales que, al borrarse, no borran actividades | ✅ §2.6 |
| Conflictos: históricos, nuevos bloqueados, resueltos, desaparecidos, sin alterar datos | ✅ §5 |
| Borradores, cambios pendientes, versiones, eliminación lógica, papelera y restauración, con qué se guarda, cuándo, cuánto tiempo y cómo se evita el crecimiento | ✅ §6, §7 |
| Motor temporal unificado, con intervalo continuo, una fuente de choques y sin medianoche | ✅ §3, §5 |
| Contratos de integración: Estudios, Fitness (cíclico), Imagen personal, Inicio/Hoy, Calendario, Mochila, Sueño, Notificaciones, con las 7 reglas | ✅ §8 |
| Migración reversible con las 10 situaciones y las 8 condiciones, explicada y sin ejecutar | ✅ §12 |
| Notificaciones push: aparatos, suscripciones, permisos, SW, envío, programación, reintentos, cancelaciones, suscripciones inválidas, iOS y Supabase | ✅ §9 |
| Importación en 10 pasos, sin servicios externos, con la librería bajo demanda | ✅ §10 |
| Asistente por reglas que interpreta, pregunta, propone, detecta choques, enseña la vista previa, corrige y genera un borrador | ✅ §11 |
| Los 7 diagramas | ✅ §13 |
| Contratos de funciones sin implementar | ✅ §14 |
| Las 7 decisiones de Josué incorporadas, con sus consecuencias | ✅ §0.3 |
| Sin código, migraciones, SQL, Supabase, dependencias, datos, commits, push, merge ni despliegue | ✅ (ver el cierre) |

### 16.2 Para las fases que construyen (se comprobarán allí)

- **Fase 4**:
  - `verificar.sh` entero en verde.
  - **La regresión de lo que ven los demás**: el mismo escenario por `resolverDia`, `centroDelDia`, `agendaDelDia`,
    `resumenHorario`, la mochila y los avisos, antes y después.
  - P1–P16 con su prueba (P17 se conserva como regla).
  - Las suites de Fitness y Sueño sin tocar y en verde.
  - Una prueba de firma de `DIAS_SEMANA`, `diaDeFecha` y `diasEntre`.
  - La guardia de versión probada con datos de una versión «del futuro».
  - La migración idempotente, reversible y con la huella comprobada.
  - Un recorrido de Chromium que crea un horario desde cero, pasa por el borrador, lo confirma, comprueba la agenda
    conjunta y exporta a PNG y a PDF.
- **Fase 5**:
  - El reconstructor de tablas en Node.
  - El trozo de arranque del mismo tamaño que antes.
  - Ninguna URL externa en el OCR.
  - La prueba en su iPhone.
- **Fase 6**:
  - `test-asistentes-chat` en verde.
  - Ninguna escritura sin borrador.
  - Sin IA generativa.
- **Fase 7**:
  - El cifrado y la firma contra los vectores del RFC.
  - `web-push` fuera del empaquetado del navegador (si se usa).
  - **Un aviso recibido con la app cerrada en su iPhone.**
- **Fase 8**: lista de aceptación calculada contra `docs/17`, punto por punto.

---

## 17. Aclaraciones de la revisión (2026-11-08)

> Revisión documental autorizada por Josué tras leer los apartados 0.2, 6, 12 y 15. **Donde este apartado y uno anterior
> digan cosas distintas, manda este**, y el anterior lleva una nota que remite aquí. No autoriza la Fase 3 ni ningún
> cambio de código, datos, SQL o dependencias.

### 17.1 Poda de datos: **no se borra nada sin autorización expresa**

**Lo que proponía el §6.7 y queda retirado**:
- Limitar `completadas` a 60 días.
- Llamar a `podarMochila`.
- Podar los choques históricos resueltos a los 30 días.
- Podar los avisos enviados de Supabase a los 7 días.
- El tope de 10 versiones por horario.

**Regla de esta arquitectura** [DECISIÓN]: **ninguna fase borrará automáticamente datos existentes, ni los que generen las
estructuras nuevas, sin una autorización expresa de Josué para cada caso.** Hasta entonces todo se conserva, y lo que se
hace es **medir** el tamaño con el diagnóstico (§12.2).

**Qué se perdería con cada poda propuesta y quién lo lee** [CÓDIGO]:

| Lista | Qué contiene | Quién la lee | Qué se perdería al podar |
|---|---|---|---|
| `completadas` | Claves «clase + fecha» que él confirmó como hechas (HT F8) | `automatizaciones.js` (`estadoTemporal: 'completada'`, el resumen del tablón: «N de M confirmadas»); `analiticaHorario.js` (`cumplimiento`: «confirmadas a mano» en una ventana de 14 días por defecto, y lo que de ahí sale en el informe y las recomendaciones); el Día de una fecha pasada | El «hecha» de las clases antiguas. El informe de una ventana más larga que la poda cambiaría sus cifras. Lo que él confirmó **desaparecería sin que lo pidiera** |
| `mochila` | Por día: lo metido y lo añadido a mano (`manual: true`) | `mochila.js` (`mochilaDeFecha`, guardar y marcar); `automatizaciones.js` (lo que añaden las reglas); `analiticaHorario.js` (`estadisticasDeMochila`: «la mochila salió completa X de Y días») | Las marcas y lo añadido a mano en días pasados. El porcentaje de la mochila del informe cambiaría |
| `choques.historicos` (nueva) | Marcas de choques que ya existían | La lista de revisión (§5) | Solo el aviso «Resuelto» |
| `horarioVersiones` (nueva) | Versiones anteriores de cada horario | «Versiones anteriores» y la recuperación ante N1 | Poder volver a una versión antigua |
| `avisos_programados` enviados (nueva, Fase 7) | Lo que ya se envió | El envío (para no repetir) | El rastro de lo enviado |
| `avisos` (80) e `historialAuto` (60) | Lo que ya topa hoy el código (HT F8 y F10) | Centro de avisos y tablón | **Nada cambia**: es el comportamiento actual, no una poda nueva |

**Riesgo técnico encontrado** [CÓDIGO]: `podarMochila` (`horarioDatos.js` 357) devuelve `normalizarDatos(datos)`, que es
el **segundo normalizador** (C4). Aplicada al `horarioTop` entero, podría perder los campos que ese normalizador no
conoce. Por eso no se llama, y si algún día se autoriza la poda, se hará sobre la lista y no sobre el objeto.

**Cuánto crece si no se poda** [HIPÓTESIS, se medirá en el diagnóstico]:
- Una clave de `completadas` ocupa unos 20–40 bytes. Con 30 clases a la semana confirmadas todo un curso, unas 1 200 claves:
  **entre 25 y 50 KB al año**.
- La mochila, unos 150 bytes por elemento: con 5 elementos al día en los días de clase, unos **150 KB al año**.
- Una versión, unos 16,5 KB [EJECUTADO]: **cada 10 confirmaciones de un horario suman unos 165 KB**.
- Es crecimiento lento, pero `horarioTop` y `horarioVersiones` se reescriben enteros en cada guardado.

**Propuesta de seguimiento** (sin borrar nada):
- El diagnóstico informa del tamaño de cada clave y de cada lista.
- A partir de un **umbral de aviso** (propuesto: 500 KB por clave), la aplicación **avisa** de que convendría decidir qué
  hacer, en vez de podar.
- Cada poda concreta (qué lista, desde qué antigüedad, si se archiva antes) es una **decisión de Josué** (TP-13).

### 17.2 Cómo se comprueba que la entrega A está activa antes de permitir la B

**Lo que no garantiza nada**: esperar unos días. Una pestaña abierta sin recargar o una PWA del iPhone que vuelve del
segundo plano siguen ejecutando el código de cuando se cargaron. Y **no hay service worker que las actualice** [CÓDIGO,
`docs/18` §10.3].

**El límite de fondo** [HECHO]:
- Una copia **anterior a la A** no sabe que existe nada de esto: no se puede identificar ni detener desde el cliente hasta
  que **escribe**, y solo se nota **después** de que escriba.
- Lo único que impediría su escritura es que el servidor rechazara escrituras de clientes que no conocen la guardia (17.3).
- Por eso la comprobación reduce el riesgo, **no lo elimina**, y la B debe seguir siendo segura **aunque una copia antigua
  escriba después** (detección y recuperación, abajo).

**Las señales que deja la entrega A** (todas en claves que una copia antigua no toca, salvo el testigo, que se coloca a
propósito donde sí la toca). 🔎 **Definitivas desde la A-bis** (especificación consolidada y aprobada el 2026-11-14,
implementada en v3.162.0); el detalle completo está en el **§18.13**, que manda donde difieran:

1. **`version` y el testigo en `horarioTop`**:
   - **Toda escritura de la A-bis lleva `version: 1`**, con testigo o sin él (C-4).
   - El testigo es `{ formato: 1, desde, ultimaEscritura, revision, base, aparato }`, más lo desconocido de un testigo
     anterior. Va en toda escritura **fuera del arranque**; durante el arranque, solo si hay una **intención confirmada**
     (§18.13).
   - Solo lo ponen los dos puntos de escritura de `horarioTop` (`snapshotAndSave` y Deshacer) cuando él guarda algo:
     **nunca al cargar** ni en ningún otro momento.
   - Una copia anterior a la A, al guardar, **los borra** (N1). Esa ausencia, **después de haberse demostrado un
     testigo**, es la huella de que una copia antigua escribió.
2. **Una fila de guardia por aparato**, en la clave `horarioGuardia:<aparato>` (TP-17, decisión del 2026-11-14). Sustituye a
   las dos claves compartidas que proponía la revisión del 2026-11-08 (abajo):
   - el id del aparato (el mismo que usa el historial de versiones, en el almacén del navegador), una etiqueta opcional
     (la A-bis la deja vacía) y, por cada **versión de la aplicación** (`VERSION`, `src/lib/version.js`, la de
     `package.json` inyectada al compilar), su primera y su última visita, como mucho una por día y versión;
   - cuándo se vio la A por primera vez (la fecha que cuenta es `updated_at`, que pone el servidor al crear la fila);
   - el testigo **visto** o **escrito** que el aparato ha demostrado y las **intenciones** de escribir el primero;
   - los **registros de incidencias** y, para la entrega corta, las retiradas y resoluciones. Esas listas **solo crecen**;
   - **solo la escribe su escritor condicional** (condición sobre su última operación); `saveData` y su cola la rechazan;
   - no guarda nada personal más.

**Lo que se detecta al cargar** (§18.13): con un testigo demostrado antes, que falte o no se pueda leer es una **pérdida
demostrable (B)**, y que falte con `version: 1` es un **caso ambiguo (C)**; las dos se registran en la fila de la guardia.
Sin ningún testigo demostrado (el arranque) no se registra nada.

**Condiciones para que la B migre** (las comprueba la propia B al cargar; si falta alguna, **no migra** y sigue
funcionando como la A). 🔎 **Definitivas desde la A-bis**: las calcula el evaluador puro `evaluarCondicionesB`
(`guardiaHorario.js`), que da para cada una «cumple», «no cumple» o «no verificable», con su motivo; la B exige las cinco en
«cumple», y cualquier falta de lectura, algo pendiente o una versión no comparable da «no verificable»:

| # | Condición | Qué demuestra |
|---|---|---|
| 1 | **Margen**: la A se vio por primera vez hace al menos el margen acordado (TP-12), medido con la hora del servidor. «No verificable» mientras no estén fijados el margen y los requisitos de la hora del servidor | Que la A llegó a ejecutarse |
| 2 | **Ninguna incidencia abierta**: ningún registro, de B ni de C, sin una resolución reconocida que nombre su `id`. E2 y AI no son registros | Que no escribió ninguna copia antigua sin que él lo haya revisado. Es la única señal real sobre las copias antiguas |
| 3 | **Testigo demostrado ahora**: la lectura de **esta** evaluación encuentra un testigo válido presente (concepto 2 del §18.13, que incluye `version: 1`) **y** no hay ninguna C sin resolver (C-2). En E2, AI o con una C sin resolver, «no verificable»; con una B y el testigo ahora ausente, ilegible o sin fila, «no cumple». **El evaluador no lee las intenciones**: una intención nunca la cumple | Lo mismo, en el momento de migrar |
| 4 | **Versiones de los aparatos**: las versiones (`^\d+\.\d+\.\d+$`, comparadas número a número) con visitas en los últimos 30 días tienen que ser comparables y mayores o iguales que `versionMinima`. **Las fechas inválidas o futuras cuentan como recientes.** Un aparato sin visitas en 30 días cuya versión más reciente sea menor, o no comparable, bloquea salvo que tenga una retirada vigente (`secuenciaVista` igual a la `secuencia` actual de su fila) | Que no hay aparatos conocidos con una copia intermedia |
| 5 | **Confirmación de Josué en pantalla**: la B enseña la lista de aparatos con su última visita y le pide cerrar JosStyle en los demás (en el iPhone, deslizarla fuera del selector de apps) y abrirla una vez en cada uno. En la A-bis es siempre «no verificable» | Lo que ninguna señal puede comprobar: pestañas o aparatos que no han escrito ni se han registrado |

> 📜 **Histórico — redacción de la revisión del 2026-11-08 (tal como entró en `017a488`).**
> **No es la definición vigente**: la sustituyen las señales y condiciones de arriba (A-bis, TP-17) y el §18.13.
> Se conserva literal como registro; sus claves `horarioAparatos` y `horarioGuardia` **no son claves vigentes y se rechazan**.
>
> **Las señales que deja la entrega A** (todas en claves que una copia antigua no toca, salvo el testigo, que se coloca a
> propósito donde sí la toca):
>
> 1. **El testigo en `horarioTop`**:
>    - La A escribe `version: 1` y `testigo: { desde, ultimaEscritura }` en cada guardado.
>    - Una copia anterior a la A, al guardar, **los borra** (N1). Esa ausencia es la huella de que una copia antigua escribió.
> 2. **El registro de aparatos**, en la clave nueva `horarioAparatos`:
>    - Cada copia A o posterior apunta, como mucho una vez al día al cargar: un id del aparato (aleatorio, en `localStorage`),
>      una etiqueta legible, la **versión de la aplicación** (la de `package.json`, inyectada al compilar) y cuándo se vio.
>    - No guarda nada personal más.
> 3. **El registro de la guardia**, en la clave nueva `horarioGuardia`:
>    - Cuándo se vio la A por primera vez.
>    - Y **cada vez que una copia A encuentra el testigo borrado**: la fecha y la conclusión «una copia antigua escribió
>      aquí».
>
> **Condiciones para que la B migre** (las comprueba la propia B al cargar; si falta alguna, **no migra** y sigue
> funcionando como la A):
>
> | # | Condición | Qué demuestra |
> |---|---|---|
> | 1 | `horarioGuardia` existe y la A se vio por primera vez hace al menos el margen acordado (TP-12) | Que la A llegó a ejecutarse |
> | 2 | **Ningún testigo borrado** en ese margen (`horarioGuardia` sin detecciones) | Que en ese tiempo no escribió ninguna copia antigua. Es la única señal real sobre las copias antiguas |
> | 3 | El testigo está presente ahora | Lo mismo, en el momento de migrar |
> | 4 | Todos los aparatos de `horarioAparatos` vistos en los últimos 30 días llevan la A o posterior | Que no hay aparatos conocidos con una copia intermedia |
> | 5 | **Confirmación de Josué en pantalla**: la B enseña la lista de aparatos con su última visita y le pide cerrar JosStyle en los demás (en el iPhone, deslizarla fuera del selector de apps) y abrirla una vez en cada uno | Lo que ninguna señal puede comprobar: pestañas o aparatos que no han escrito ni se han registrado |
>
> **Después de migrar** (la B no se fía solo de las condiciones):
> - Si `horarioTop` llega **sin `version: 2`** y `horarioVersiones` o `horarioGuardia` dicen que ya se migró, **una copia
>   antigua escribió encima**.
>
> 📜 *Fin del histórico del 2026-11-08.*

**Después de migrar** (la B no se fía solo de las condiciones; lo diseña la entrega B):
- Si `horarioTop` llega **sin `version: 2`** y `horarioVersiones:*` o las filas `horarioGuardia:*` dicen que ya se migró,
  **una copia antigua escribió encima**.
- Entonces la B:
  1. **No guarda nada de Horarios** (solo lectura, como `fitnessSoloLectura`).
  2. Lo dice.
  3. Ofrece dos salidas, **sin elegir por él**:
     - «Recuperar la última versión (las HH:MM del día X): se perdería lo que se hizo en la copia antigua».
     - «Quedarme con lo que hay ahora y volver a actualizarlo»: se migra lo que hay, sin los campos nuevos que la copia
       antigua borró, y estos se pueden recuperar uno a uno desde la versión.

**Un aviso de versión nueva para el futuro** [TP-14 — 🔎 **RESUELTA el 2026-11-09: no se incorpora en esta fase**; lo de abajo queda como opción descartada por ahora]:
- Una comprobación ligera (un `version.json` servido sin caché, consultado al volver a la app) que pida recargar cuando
  haya una versión más nueva.
- No ayuda con las copias anteriores a la A, pero sí con todo lo que venga después.
- **Afecta a toda la aplicación, no solo a Horarios**, así que necesita su autorización.

### 17.3 Escrituras simultáneas desde dos aparatos

**Lo que pasa hoy** [CÓDIGO]:
- `saveData` hace un `upsert` **incondicional** de la fila entera, y `updated_at` lo pone **el reloj del aparato**
  (`supabase.js` 146). No hay ningún trigger en `schema.sql`.
- Cuando una escritura se cruza con otra, `sincronizacion.js` **vuelve a enviar a ciegas** el último valor de ese aparato.
- **Gana el último que llega al servidor**, y el otro pierde sus cambios **en silencio**.
- Lo mismo vale para un aparato que estuvo sin conexión: al recuperarla reenvía su último valor y puede pisar algo más
  nuevo.

**Ejemplo con la arquitectura del §6, sin protección de servidor**:
1. El iPhone y el ordenador cargan el horario a las 10:00 (`actualizadoEn` = T0).
2. El iPhone confirma un borrador a las 10:05:00. Su comprobación de `base` pasa: lo que tiene en memoria sigue siendo T0.
3. El ordenador confirma otro a las 10:05:01. Su comprobación **también pasa**, porque compara con lo que **él** cargó, no
   con lo que hay ahora en el servidor.
4. Resultado:
   - `horarioTop` queda con lo del ordenador; **los cambios del iPhone desaparecen**.
   - `horarioVersiones` también se reescribe entera desde cada aparato, así que **la versión que guardó el iPhone se pierde
     también**. 🔎 **Con el diseño del §18.9 (2026-11-09) esto deja de pasar con las versiones**, en cuanto se haya
     comprobado la escritura condicional: cada aparato escribe solo su registro y con condición. `horarioTop` sigue igual:
     lo protegería TP-15.
   - Nadie avisa a nadie.

**La comprobación de `actualizadoEn` en el cliente (§6.2) NO protege de esto** [ACLARACIÓN]:
- Solo detecta los cambios que **ese aparato ya ha recibido**: cuando el borrador se queda viejo porque el usuario hizo una
  edición rápida en el mismo aparato, o porque recargó y llegó otra cosa.
- **No detecta una escritura de otro aparato que aún no ha cargado.**
- No es atómica y no debe presentarse como protección entre aparatos. El §6.4 lleva una nota que remite aquí.

**Lo que sí sería una escritura condicional en el servidor**:

| Opción | Cómo | SQL | Qué protege | Qué no |
|---|---|---|---|---|
| **A · Token sin SQL** [HIPÓTESIS] | En vez de `upsert`, un `update` con condición: `update app_data set value=…, updated_at=<nuevo> where user_id=… and key='horarioTop' and updated_at=<el que se leyó>`, por PostgREST (`.update(…).eq('updated_at', leido)`), pidiendo la fila de vuelta. Postgres evalúa un `UPDATE … WHERE` de forma atómica sobre la fila: si otro escribió entre medias, **actualiza 0 filas** y el cliente lo sabe. Usa la política de `update` que ya existe. `updated_at` se usa como **testigo por igualdad**, nunca para decidir cuál es más nuevo, así que el reloj de cada aparato no importa (la advertencia de CLAUDE.md sobre la hora del dispositivo se refiere a comparar por orden) | Ninguno | Las escrituras de copias **que lo usen**: dos aparatos con la versión nueva | Las copias antiguas y cualquier otro camino que siga haciendo `upsert` a ciegas, incluidos `snapshotAndSave` → `saveData` y el reenvío de `sincronizacion.js` si no se adaptan |
| **B · Versión en el servidor con SQL** | La fase pendiente de CLAUDE.md: una columna de versión y una función o regla en la base de datos que rechace una escritura con una versión vieja **venga de quien venga** | Sí (lo ejecuta Josué) | También las copias antiguas, si la regla rechaza **todo** lo que no traiga la versión | Necesita el SQL y cambiar `saveData` para todos los módulos |

**Lo que hay que comprobar antes de prometer la A** [PENDIENTE, TP-15]:
- Que PostgREST compara bien un `timestamptz` por igualdad con el valor leído (la precisión de ida y vuelta).
- Que la respuesta permite saber cuántas filas se actualizaron.
- Que dos escrituras del mismo milisegundo no generan el mismo testigo. Si eso preocupa, se usaría un testigo aleatorio
  dentro de `value`.

Se probaría contra el Supabase real solo con autorización, porque escribir en la tabla es escribir en producción.

**Qué haría la versión nueva cuando una escritura condicional falla**:
- No reintenta a ciegas.
- Conserva el borrador.
- Recarga lo del servidor y lo dice: «Otro aparato guardó cambios en este horario a las HH:MM».
- Vuelve a la vista previa con la base nueva, para que él decida.
- Las versiones también se escribirían de forma condicional.

**Hasta que se implante una de las dos** [ACLARACIÓN]:
- La arquitectura **no promete** protección entre aparatos.
- Lo que sí hay: las versiones, el respaldo y la detección **posterior** (17.2) para recuperar.
- La pantalla no dirá nunca «sincronizado» en el sentido de «a salvo de otro aparato».

> 🔎 **TP-15 decidido por Josué el 2026-11-10**: se adopta **A + B + C**, en ese orden (§18.12, «TP-15: la decisión
> aprobada»). Lo de este apartado sigue describiendo **cómo está hoy** y lo que hay que comprobar, y lo de «hasta que se
> implante» sigue valiendo **hasta que esté implementado y probado**: nada de eso está hecho todavía. La revisión que se
> compara es un identificador aleatorio guardado en `value`, no `updated_at` (§18.12).

### 17.4 El respaldo `horarioTop_respaldo_v1`: exacto y nunca reutilizado por error

**El problema** [ACLARACIÓN]: con la regla «solo si la clave no existe» (§12.1, copiada de Fitness), un respaldo que se
guardó en un intento anterior de migrar, que luego no se completó, **se tomaría por bueno** aunque desde entonces hubiera
más cambios en la versión 1. El respaldo ya no correspondería al estado de justo antes de migrar.

**Cómo se garantiza que es el estado exacto anterior** [DECISIÓN]:

1. **La copia sale del dato crudo**: el valor tal cual llega de `loadData`, **antes** de cualquier normalizador o
   migración. Es el mismo objeto que se pasa a `migrarHorarioTop`.
2. **Huella**: SHA-256 de su JSON con las claves ordenadas, con `crypto.subtle` (nativo, sin dependencias).
3. **Cada copia lleva sus metadatos**: `{ huella, copiadoEn, origenUpdatedAt (el updated_at de la fila leída; la carga
   tendría que pedirlo), versionApp, recuentos (horarios, reglas, excepciones) }`.
4. **Es una lista que solo crece**: `horarioTop_respaldo_v1 = { copias: [ … ] }`.
   - Una copia **nunca se sobrescribe ni se borra**.
   - Si la huella del crudo actual coincide con una copia ya guardada, no se duplica.
   - Si no coincide con ninguna, **se añade una nueva**: la vieja se conserva, pero no se usa como respaldo de esta
     migración.
5. **Se comprueba leyendo**: tras guardar la copia, se **vuelve a leer** la clave y se compara la huella. Solo si la huella
   leída coincide con la del crudo que se va a migrar, la migración continúa.
6. **El estado migrado guarda su origen**: `migracion: { desde: 1, respaldoHuella, fecha }`, para saber siempre qué copia
   corresponde a esa migración.
7. **Tope sin borrar**: si ya hay 3 copias y ninguna coincide (intentos fallidos repetidos), **no se migra** y se avisa,
   en vez de borrar una para hacer sitio. Es una situación anómala que tiene que ver él.

**Restaurar**: «Restaurar la copia de antes del cambio» enseña cada copia con su fecha y sus recuentos, y la restauración
pasa por un borrador y la vista previa (§6.5), con confirmación.

### 17.5 Cuarentena: consultar, recuperar y descartar sin perder el original

**Dónde vive** [DECISIÓN que corrige el §2.9]:
- En una **clave aparte**, `horarioCuarentena`, no dentro de `horarioTop`.
- Motivo: una copia antigua de la app borraría al guardar cualquier lista nueva de `horarioTop` (N1), y la cuarentena
  contiene justo lo que hoy ya se pierde.
- Además, los originales siguen también en el respaldo (17.4).

**Forma**:

```
horarioCuarentena = { version: 1, elementos: [{
  id, firma (SHA-256 del original), coleccion ('bloques' | 'excepciones' | 'horarios' | 'actividades'),
  original (tal cual llegó, sin normalizar), motivo (texto legible + código),
  apartadoEn, estado: 'pendiente' | 'recuperado' | 'descartado', resueltoEn, recuperadoComo (id del elemento nuevo)
}] }
```

**Orden de escritura**:
1. Se guarda la cuarentena y se comprueba que llegó.
2. Solo entonces se guarda `horarioTop` sin esos elementos.
3. Si la cuarentena no se pudo guardar, `horarioTop` **conserva los elementos tal cual**: se ignoran al calcular, pero no
   se quitan al guardar.

**Idempotencia**: un mismo original (misma firma) no se aparta dos veces.

**Consultar** (desde «Mis horarios» → «Revisión»):
- Una lista con cada elemento contado en palabras. Por ejemplo: «Clase "Matemáticas" de 08:00 a 09:00 que no pertenece a
  ningún horario» o «Cambio del día 2026-13-45, que no es una fecha válida».
- El motivo.
- «Ver el dato original»: el JSON, de solo lectura y con «Copiar».

**Recuperar**:
1. Un asistente corto pide **solo lo que falta**:
   - Una regla sin horario o sin columna: a qué horario y qué día.
   - Una excepción con fecha inválida: qué fecha.
   - Una excepción de tipo desconocido: si es «cancelar», «cambiar» o «añadir».
2. Con eso se construye el elemento, que pasa por `validarCambio` (horas, fechas y **choques**) y entra en un **borrador**
   del horario.
3. Al confirmar, el elemento de cuarentena pasa a `recuperado` con `recuperadoComo`, y **el original se conserva**.

**Descartar**:
- Pasa a `descartado`, sale de la lista principal (sigue en «Descartados») y el original **se conserva**.
- **No hay borrado definitivo** sin una autorización expresa (17.1, TP-13).

**Sin decisiones automáticas**: nada sale de la cuarentena sin un toque suyo y su confirmación.

### 17.6 TP-5 y TP-7 siguen siendo de Josué

- **TP-5** (aplicar el ciclo A/B si el diagnóstico lo encuentra):
  - Es una decisión de Josué y no se implementa ninguna opción sin preguntarle.
  - Mientras no conteste, la versión 2 **no aplica el ciclo** a los horarios que ya lo tuvieran: se comportan como hoy.
- **TP-7** (cómo cuenta en Inicio una actividad vinculada a Fitness en un día de descanso):
  - Es una decisión de Josué y no se implementa ninguna opción sin preguntarle.
  - Las opciones son: contarla, no contarla, o contarla con otra etiqueta.
  - La propuesta del §15 queda como **opción**, no como diseño aprobado.

### 17.7 Decisiones nuevas que necesitan autorización (se añaden al §15)

| # | Cuestión | Opciones | Quién |
|---|---|---|---|
| **TP-13** | Cualquier poda o borrado automático: `completadas`, `mochila`, choques resueltos, versiones, avisos enviados, cuarentena | 🔎 **RESUELTA por Josué el 2026-11-09**: **se conserva todo**. No hay ninguna poda automática. El crecimiento queda como riesgo aceptado (§17.8.4) | Resuelta |
| **TP-14** | Aviso de versión nueva para toda la aplicación (`version.json`) | 🔎 **RESUELTA por Josué el 2026-11-09**: **no se incorpora en esta fase**. Las copias antiguas siguen tratándose con la guardia, el testigo y la recuperación (§17.2) | Resuelta |
| **TP-15** (incluye el **TP-8**) | **Protección de las escrituras entre aparatos.** 🔎 **Unificada con el TP-8 el 2026-11-09.** Hay que separar dos cosas: **(1) el historial de versiones**: protegido por diseño y **ya implementado en código** con la escritura condicional por aparato (§18.9 y §18.12), comprobada con un PostgREST local y pendiente de comprobar en Supabase alojado y en su iPhone; **(2) `horarioTop` y los borradores**: **siguen sin protección**; hoy gana el último que escribe, y una copia anterior a la entrega A puede borrar campos nuevos | ~~Para (2): A, el token sin SQL; B, la versión en el servidor con SQL; o ninguna~~. 🔎 **DECIDIDA por Josué el 2026-11-10: A + B + C**, en ese orden (§18.12): escritor condicional propio en el cliente, regla en el servidor solo para las claves de Horarios y recarga al volver a la app. 🔎 **E1 (2026-11-16, commits locales, sin publicar)**: **A y C construidas para `horarioTop`** (§18.14); **B preparada** (`supabase/horarios-regla-revision.sql`) y **probada solo en un PostgREST local**, sin activar en ningún entorno alojado; `horarioBorradores` tiene su contrato de sello (D3) y nadie lo escribe todavía. B se activa en producción solo con su autorización expresa, después de probarla en local y en un Supabase independiente | A y C hechas (sin publicar); B en producción, **Josué** |
| **TP-16** | Pedir `updated_at` en la carga (para el respaldo y para la opción A del TP-15) | Ampliar `loadData` para Horarios. 🔎 **2026-11-10**: el TP-15 aprobado compara una revisión guardada en `value`, **no** `updated_at`, así que para el TP-15 ya no hace falta; queda, si acaso, para el respaldo. 🔎 **2026-11-15**: la A-bis lee el `updated_at` de las filas de la guardia con **su propio transporte** (`supabase.js`), sin ampliar `loadData`; el TP-16 sigue abierto solo para el respaldo | Fase 4 |
| **TP-17** | Las claves nuevas ~~`horarioAparatos`, `horarioGuardia`~~ y `horarioCuarentena` (misma tabla, mismas políticas, sin SQL). 🔎 Y los registros `horarioVersiones:<aparato>` (§18.9, 2026-11-09) | Como se describen en 17.2, 17.5 y 18.9. 🔎 **RESUELTA para la guardia (decisión del 2026-11-14, implementada en la A-bis, v3.162.0)**: **una fila por aparato, `horarioGuardia:<aparato>`**, que sustituye a `horarioAparatos` y `horarioGuardia`; las dos y `horarioAparatos:*` se rechazan en `saveData` y en su cola (§17.2, §18.13). `horarioCuarentena` sigue para la entrega B (17.5) | Resuelta (guardia); `horarioCuarentena`, Fase 4 entrega B |
| **TP-18** | El orden de los días | 🔎 **RESUELTA por Josué el 2026-11-09**: siempre de lunes a domingo, sin controles para reordenar, en el móvil y en el escritorio; `posicion` se conserva intacto y deja de controlar la presentación (§18.8) | Resuelta |

### 17.8 Riesgos que permanecen después de esta revisión

1. **Una copia anterior a la entrega A que escriba después de migrar** borrará los campos nuevos. Se detecta y se recupera,
   pero no se puede impedir sin la opción B del TP-15.
2. **Dos aparatos que confirman a la vez**: el último gana y el otro pierde sus cambios hasta que exista la escritura
   condicional (TP-15). Hoy pasa igual en toda la aplicación.
3. **Escribir en varias claves no es atómico** (versión, agenda, borrador, cuarentena). El orden del §6.4 y del 17.5 deja
   cada fallo en un estado recuperable, no en uno perfecto.
4. **Sin poda, las claves crecen**, despacio. El diagnóstico y el umbral lo vigilan; la decisión es de Josué.
5. **Las condiciones del 17.2 dependen de una confirmación suya** que ninguna prueba puede sustituir.

---

## 18. Correcciones del 2026-11-09

> Corrección documental autorizada por Josué antes de la Fase 4. **Manda sobre los apartados anteriores donde difieran**,
> igual que el §17. No autoriza la Fase 4 ni ningún cambio de código, datos, SQL o dependencias.

### 18.1 Versiones manuales (opción A de Josué)

Recogidas en el §6.5 (modelo y reglas) y en el §14.6 (contrato). En resumen:
- `motivo: 'manual'`, `nombre`, `renombradaEn` y `huella` en `Version`.
- La manual captura **el horario confirmado**, nunca un borrador.
- Las manuales se renombran y se eliminan a mano, una a una, con confirmación. Las automáticas, no.
- Una versión idéntica no se simula: se dice cuál es la igual.
- **Ninguna versión se elimina sola.** Queda corregido el «tope 10» del §14.6, que contradecía el §17.1.
- El autoguardado conserva el borrador y no crea versiones.
- Las acciones de versiones valen también para los horarios desactivados; en los archivados solo se pueden ver.

### 18.2 Decisiones pendientes: siguen pendientes

- **Estado vigente** (🔎 desde el §18.12, 2026-11-09, actualizado el 2026-11-10): siguen pendientes TP-1, TP-3, TP-5
  (después del diagnóstico) y TP-7, además de las de las Fases 5 y 7 (la lista completa está en el §18.12). **TP-4, TP-13 y
  TP-14 están resueltas**, y **el TP-15 (que incluye el TP-8) está decidido: A + B + C, sin implementar**.
- **Estado anterior** (cuando se escribió este apartado, antes del §18.12; se conserva como registro): TP-1, TP-3, TP-4,
  TP-5, TP-7, TP-13, TP-14 y TP-15 seguían sin resolver.

Lo que sigue vale en el estado vigente:
- **TP-5**: ninguna pantalla muestra semanas A/B mientras no se decida.
- **TP-7**: ninguna opción visual ni de Inicio está aprobada. Las posibilidades están en la fila del §15, y el §8.2 ya no da
  por hecha ninguna.

### 18.3 Funciones existentes que se conservan (contratos, sin cambiar su comportamiento)

| Función | Funciones que la sostienen (existen hoy) | Qué cambia en la arquitectura |
|---|---|---|
| **Buscar en el horario** | `buscarEnHorario(estado, texto, { asignaturas })` (`horarioEstructura.js`): busca en el título, el aula, el profesor y las etiquetas | Nada en el motor. Solo hay que resolver el nombre de la actividad por `nombreDeActividad`, como ya hace, y buscar **sin acentos** (P16) como mejora de la Fase 4, sin quitar resultados que hoy salen |
| **Semanas A/B** | `normalizarCiclo`, `guardarCiclo`, `semanaDelCiclo`, `cicloDe`, `columnasDeLaFecha` y `columna.grupo` | **Se conservan los datos y las funciones.** Mientras TP-5 esté pendiente, la configuración no se muestra y la versión 2 no aplica el ciclo a los horarios que ya lo tuvieran (§17.6) |
| **Generar franjas** | `generarFranjas({ desde, hasta, intervalo, descanso })`, `impactoRegenerarFranjas`, `regenerarFranjas`, `editarFila` y `eliminarFila` | Las franjas siguen guardadas en `horario.filas` y se pueden generar, editar y borrar como hoy, con su aviso de impacto. **No deciden** dónde se pinta una actividad ni cuándo ocurre (§2.3, corrección): eso es lo que arregla P3 y P4 sin quitar la función |
| **Validación del horario** | `validarEstructura(estado, horarioId)`, con sus tipos de problema (`bloque_en_conflicto`, `bloque_sin_columna`, `fila_sin_horas`, `filas_solapadas`, `ids_columna_repetidos`, `posiciones_columna_repetidas`, `posiciones_fila_repetidas`, `sin_columnas_de_dia`, `sin_horario`) y `describirProblema` | Pasa a ejecutarse en **«Revisar y guardar»** sobre el borrador compuesto. `bloque_en_conflicto` lo sustituye la regla única de coincidencias (§5), y lo demás se enseña con su frase. Qué problemas **bloquean** el guardado: los que ya rechaza `validarCambio` (§4.4). El resto **avisa sin bloquear**, como hoy |

### 18.4 D-H3 en la interfaz

`docs/20` dibujaba dos accesos nuevos:
1. Del día del Calendario al detalle de una clase. Hoy las clases del Calendario no se pueden tocar: solo las tareas tienen
   menú.
2. De la tarjeta de Hoy de Inicio a Horario. Hoy su «Ver todas» lleva al **Calendario, vista día**.

Los dos se **retiran** (corrección en `docs/20` §2.1). En la arquitectura no cambia nada: el §8.4 y el §8.5 ya decían que
Inicio y el Calendario solo leen la agenda conjunta y no ganan accesos.

### 18.5 Colores al pintar y al exportar (decisión B de Josué)

| Regla | Detalle |
|---|---|
| Una sola regla | La pantalla y la exportación (PDF e imagen) usan `fondoLegible(hex)` para el fondo y `bestReadableText` para el texto (`docs/20` §15.1). |
| El dato no cambia | `fondoLegible` es **pura**: lee el color guardado y devuelve el que se pinta. **Nunca se escribe** en `actividad.color`, `colorPropio`, `categoria.color` ni `horario.color`. |
| Exportar no escribe | Ni `horarioTop`, ni la agenda, ni las versiones. |
| Cuándo actúa | Solo cuando el color original no llega a 4,5:1 con ningún texto. Hoy, de los 10 de la paleta, solo `#6270A0` (§14.11) |

### 18.6 «Cada dos semanas» frente a semanas A/B

| | «Cada dos semanas» | Semanas A/B |
|---|---|---|
| Qué es | Una **regla de repetición de una actividad**: toca una semana sí y otra no | Un **sistema del horario**: las semanas se alternan (A, B…) y cada día puede tener contenido distinto según la semana |
| Dónde vive | `bloque.recurrencia = { clase: 'alternas', ancla }` | `horario.ciclo` + `columna.grupo` (lo existente) y `recurrencia.clase = 'ciclo'` (lo nuevo, tras la guardia) |
| Con qué semana empieza | La fecha de referencia de **esa** actividad (`ancla`) | El `ancla` del **ciclo del horario** |
| Pantalla | En «Repetición» de cada actividad: **visible** | **Oculta** mientras TP-5 esté pendiente |
| TP-5 | **No le afecta** | Pendiente de Josué |
| Dependencia entre ellas | Ninguna: no se leen la una a la otra, y una actividad «cada dos semanas» en un horario con ciclo sigue su propia `ancla` | — |

### 18.7 Conservación de versiones al restaurar y al migrar

**Reglas** (mandan en todo el documento):
1. **Antes de restaurar una versión**, se guarda una copia automática **del estado confirmado actual** (`motivo:
   'restauracion'`).
   - Solo se da por existente si ya hay una **automática** con la misma huella (§6.5).
2. **Antes de migrar**, se guarda la copia de seguridad del §17.4 y **se verifica su huella leyéndola**. Después, las
   versiones `migracion` de cada horario.
3. **Restaurar y migrar solo AÑADEN versiones**: nunca eliminan ni modifican una anterior.
   - La migración de `horarioTop` no toca la clave `horarioVersiones`, salvo para añadir.
   - Si algún día cambia el formato de `horarioVersiones`, su migración será también solo aditiva.
4. Las **manuales** solo se renombran o se eliminan con una acción expresa de Josué. Las **automáticas** no se pueden
   renombrar ni eliminar desde la interfaz. **Ninguna versión se elimina sola**, tampoco al vaciar o caducar el horario en
   la papelera (§7).
5. **Si no se puede garantizar que las versiones anteriores se conservan, la operación se detiene** y lo explica. Nunca
   sigue de forma destructiva.

**Cómo se escribe una versión sin perder las anteriores**: 🔎 **sustituido el mismo 2026-11-09 por el §18.9**.

> El procedimiento que había aquí (releer una lista compartida, añadir y escribir la unión por id) tenía dos fallos:
> - Una manual eliminada en otro aparato podía **reaparecer**.
> - Con dos escrituras casi a la vez, la segunda podía pisar la versión de la primera **sin que ninguna lo notara**: «nunca
>   se pierde una versión» no era cierto sin escritura condicional.
>
> El §18.9 escribe cada versión y cada eliminación en el registro del aparato que la hace.

La regla 5 sigue igual: **si no se puede leer o escribir** (sin conexión o error), se **detiene la operación**: «No se puede
comprobar que tus versiones anteriores están a salvo. Inténtalo con conexión». No se restaura ni se migra.

**Qué pasa si algo falla después de la copia de seguridad**:

| Operación | Fallo | Estado que queda | ¿Se pierde el horario confirmado? |
|---|---|---|---|
| Restaurar | La copia `restauracion` no se puede guardar ni comprobar | No se escribe nada. El borrador (`origen: 'version'`) sigue ahí | No |
| Restaurar | La copia está guardada, pero `horarioTop` no se escribe | La agenda sigue con el horario de antes y hay una versión de más, inofensiva. El borrador sigue ahí para reintentar | No |
| Restaurar | Todo escrito, pero no se quita el borrador | El borrador sobrante es igual a lo activo: se reconoce y se ofrece descartarlo (§6.4) | No |
| Restaurar | Una coincidencia nueva | Bloqueado **antes** de escribir nada (§5) | No |
| Migrar | La copia de seguridad no se guarda o su huella no coincide al releerla | **No se migra**. La app sigue en la versión 1, como hoy, y se reintenta en la próxima carga | No |
| Migrar | La migración en memoria falla (lanza o la huella del contenido no cuadra) | Se usa lo de antes tal cual (§12.1.3). La copia queda guardada, inofensiva | No |
| Migrar | Copia guardada, pero las versiones `migracion` no se pueden escribir o comprobar | **No se escribe `horarioTop` en la versión 2**. Sigue la 1 y se reintenta en la próxima carga; la copia con la misma huella se reutiliza (§17.4) | No |
| Migrar | Copia y versiones guardadas, pero `horarioTop` en la versión 2 no se escribe | En el servidor sigue la versión 1. Las versiones `migracion` no se duplican al reintentar (misma huella, automática) | No |

**Orden de una migración**:
1. Copia de seguridad verificada.
2. Versiones `migracion` escritas de forma segura.
3. `horarioTop` en la versión 2, con el siguiente guardado normal.

Cada paso exige el anterior.

### 18.8 Revisión de coherencia de `docs/17`, `docs/18`, `docs/19` y `docs/20` (2026-11-09)

**Contradicciones encontradas y corregidas** en este documento:
1. «Al vaciar de la papelera un horario se van sus versiones con él» y «vaciar o caducar borra sus versiones y su borrador»
   contradecían «ninguna versión se elimina sola» y «un borrador nunca se borra solo». Corregido en el §6.5 y el §7.
2. La versión automática de seguridad se daba por existente si había una **manual** idéntica, que él puede eliminar.
   Corregido en el §6.5.
3. El diagrama del §13 seguía diciendo «≤10 por horario». Corregido: sin tope (§18.1).

**Y en `docs/20`**:
1. Sin conexión, «Guardar en mi horario» prometía guardarse al recuperarla. Eso contradecía la regla 5 del §18.7. Ahora
   guardar, recuperar una versión y «Guardar una versión» piden conexión, y lo dicen. Las ediciones de un día siguen igual.
2. Un horario restaurado de la papelera «volvía desactivado» siempre (§11.5) y solo si coincidiría (§7.3). Corregido como
   aquí, en el §7: vuelve como estaba, y desactivado solo si coincidiría.

**`docs/17` §8** («También se conservan versiones mediante el autoguardado»): 🔎 **sustituido por la regla definitiva de
Josué del §18.10**. El autoguardado conserva el borrador y no crea versiones. Queda escrito aquí porque `docs/17` no se
modifica.

**Comprobado sin contradicciones** (🔎 registro de aquella revisión, antes del §18.12: refleja el estado de entonces, no
el vigente; el estado vigente de las decisiones lo determina el §18.12):
- D-H3 se respeta: Calendario e Inicio sin accesos nuevos (§18.4, `docs/20` §2.1).
- En aquella revisión, TP-1, TP-3, TP-4, TP-5, TP-7, TP-13, TP-14 y TP-15 seguían pendientes (§15, `docs/20` §12.13).
  TP-18 se planteó en esa revisión y Josué la resolvió el mismo día. **Estado vigente** (§18.12): TP-4, TP-13 y TP-14
  están resueltas, y el TP-8 queda unificado en el TP-15.
- La exportación usa la regla de color de la pantalla sin escribir datos.
- «Cada dos semanas» no depende de TP-5.

**Las funciones que `docs/20` no ubicaba** se han ubicado allí:
- De la pantalla actual: la lista «Tus asignaturas y actividades» con su ficha (favorita, archivar, duplicar y eliminar),
  «Vaciar día» y la vista «Agenda» de 7 días.
- Prevista en el §6.6 y sin pantalla hoy: **marcar un día libre**. Hoy solo se pinta si ya existe la excepción
  `dia_libre`; ninguna pantalla la crea.

**TP-18 · El orden de los días** (planteada en esta revisión): 🔎 **RESUELTA por Josué el mismo 2026-11-09**:
- Los días van **siempre de lunes a domingo**, en el móvil y en el escritorio, como dice el maestro (`docs/17` §2 y §9).
- **No hay botones ni controles para reordenarlos**: «Izquierda» y «Derecha» desaparecen de la pantalla.
- **Los datos antiguos se conservan**:
  - `columna.posicion` no se borra ni se modifica, ni en la migración ni al guardar.
  - Solo deja de decidir el orden.
- **Cómo se ordena**:
  - Por `columna.dia`, de lunes a domingo.
  - Si un horario tiene dos columnas del mismo día (las de un ciclo A/B, por ejemplo), se ordenan entre sí por `posicion` y
    después por `id`. Eso no cambia nunca el orden de los días.
  - Las columnas sin día siguen en «Revisión» (§12, `docs/20` §7.5).
- **Las columnas que cree la versión nueva**:
  - Reciben una `posicion` libre al final, sin mover las de antes.
  - Así una copia antigua de la app, que sí ordena por `posicion`, las pinta en un sitio razonable.
- **`moverColumna`**:
  - No la llama ninguna pantalla.
  - Se queda en el código: no toca datos y retirarla no es de esta fase.
- **`validarEstructura`**:
  - Sigue calculando `posiciones_columna_repetidas`, como antes.
  - «Revisar y guardar» ya no lo enseña: avisar de un dato que ya no decide nada sería ruido.

### 18.9 Versiones entre aparatos: que una eliminada no reaparezca

> 🔎 **Cerrado el 2026-11-09 con la decisión definitiva de Josué**: **en Horarios no se guarda en el aparato nada
> pendiente de sincronizar**; ahí MS F16 se cumple sin excepciones. 🔎 **Alcance (2026-11-10, `docs/03` C-84)**: esta
> prohibición es de Horarios; en el resto de la aplicación sigue vigente C-71 (la fase que guardará en el iPhone lo
> pendiente), que tendrá que excluir las claves de Horarios.
> - Ni versiones ni marcas de eliminación pendientes en `localStorage`, IndexedDB ni ningún otro almacenamiento local.
> - Ningún «diario local» de operaciones.
> - Lo que no se confirma en el servidor **no se enseña como hecho**.
>
> Este apartado sustituye a la primera redacción del §18.9, del mismo día.

**El problema**:
- Con una lista de versiones compartida por todos los aparatos, que cada uno relee, une y reescribe, una versión manual
  eliminada en un aparato podía **reaparecer** al escribir otro.
- Sin escritura condicional, además, dos escrituras casi simultáneas podían **perder** una versión sin que nadie lo notara.

**Mecanismos estudiados**:

| Mecanismo | Ventajas | Limitaciones |
|---|---|---|
| **A · Lista compartida con unión por id** | Sencillo | Una eliminada reaparece. Una escritura simultánea pierde otra. **Descartado** |
| **B · Marcas de eliminación (tombstones) en la lista compartida** | Una eliminada no reaparece **mientras la marca exista** | Sin escritura condicional, una escritura vieja puede pisar la marca, y la versión reaparece. **Insuficiente solo** |
| **C · Marcas + un registro por aparato + escritura condicional sobre la última operación** | Cada fila tiene un solo escritor. Una escritura vieja, repetida o de un clon **no se aplica**. Sin SQL ni dependencias, y sin guardar nada pendiente en el aparato | Depende de que la escritura condicional funcione en Supabase como se describe. 🔎 **Comprobada en Postgres y PostgREST locales**: 33 de 33 con el código de entonces (`017a488`, el 2026-11-09; la prueba del historial de versiones, no la guardia de la A-bis). **Sin comprobar todavía en Supabase alojado** (nivel 4) ni en Safari/iPhone: hasta entonces no se da por garantizada la protección entre aparatos (ver «Pruebas») |
| **D · Versión en el servidor con SQL** (aquí, para el historial) | El servidor rechaza cualquier escritura vieja, venga de donde venga | Necesita SQL de Josué. 🔎 **No es la B aprobada del TP-15** (2026-11-10, §18.12), que protege **solo** `horarioTop` y `horarioBorradores`. Proteger el historial desde el servidor necesitaría **su propio diseño y su propia decisión de Josué**, y **no está aprobado** |

**Se propone C.** Si las pruebas demuestran que la condición no funciona, la C deja de valer y **no se implanta el
historial entre aparatos hasta tener D** (ver «Si la condición no funciona»).

#### Qué se guarda y dónde

**En el servidor**: una fila de `app_data` por aparato, con la misma tabla y las mismas políticas, sin SQL.

```
key   = 'horarioVersiones:' + aparato
value = { formato: 1,
          aparato,
          secuencia,                 // número de la última operación aplicada en esta fila
          ultimaOperacion,           // opId de esa operación: ES LA CONDICIÓN DE ESCRITURA
                                     // (la fila nace con un insert que ya lleva su primera operación)
          operaciones: [Operacion] } // solo crece; ninguna se quita ni se cambia

Operacion = { opId,                  // crypto.randomUUID(), creado al pulsar; identifica la operación para siempre
              n,                     // = secuencia + 1 en el momento de aplicarla: su sitio en la fila
              base,                  // opId que había como ultimaOperacion cuando se escribió (null en la primera)
              sesion,                // id de la ejecución de la app que la escribió (en memoria, ver abajo)
              tipo: 'crear' | 'eliminar' | 'renombrar',
              version | { versionId } | { versionId, nombre, sustituye },
                                     // 🔎 version.id = el opId de su operación 'crear' (corrección 2026-11-09);
                                     //    versionId, en eliminar y renombrar, apunta a ese id
              en }                   // la hora del aparato: solo para enseñarla, nunca para decidir nada
```

**En el aparato** (`localStorage`). **Nada de esto es un dato pendiente**: son identificadores y lo último **ya
confirmado** en el servidor. Perderlos no pierde nada (ver la tabla de identidad).

| Clave local | Qué es | Si se pierde |
|---|---|---|
| `aparato` | `crypto.randomUUID()` la primera vez (Safari 15.4+). El mismo id que usa ~~`horarioAparatos`~~ 🔎 la fila `horarioGuardia:<aparato>` (§17.2, §18.13): desde la A-bis, si todavía no existe lo crea la guardia al cargar, con `crypto.randomUUID()` o, sin él, un uuid v4 hecho con `crypto.getRandomValues()`, con una sola instancia del almacén para toda la app. **No se usa `uid()`**: son 8 caracteres de `Math.random`, demasiado pocos para esto | Id nuevo y fila nueva. La vieja se sigue leyendo |
| `confirmada` | `{ opId, n }` de la última operación de este aparato **confirmada al releer** | Al escribir no se puede reconocer la fila como propia: se cambia de id (es seguro) |
| `sesiones` | Los ids de sesión de esta instalación (uno por apertura de la app o pestaña), con un tope (las últimas 200) | Igual: una operación propia de antes se toma por ajena y se cambia de id (seguro). Recortar la lista tiene el mismo efecto |

**En memoria** (MS F16 lo permite): la operación que se está intentando, con su `opId`, mientras la pantalla la enseña.
Sirve para **reintentarla con el mismo `opId`**. Al cerrar la app desaparece: no se reintenta sola nunca.

#### Cómo se escribe una operación

1. Él pulsa (crear una versión, eliminar una manual con `confirmado` o renombrarla). Se crea un `opId` nuevo.
2. Se toma el candado `navigator.locks` de las versiones. Sin él, no se escribe y se dice por qué.
3. Se **lee la fila propia** y se comprueba la identidad (ver la tabla de abajo). Si hay duda, se cambia de id antes de
   seguir. 🔎 **Implementado así (§18.12)**: si la operación ya está en la fila, se confirma sin escribir. Si no, antes de
   escribir se lee **el historial entero** (todas las filas): si esa lectura falla, si hay una fila de un formato posterior
   o si alguna fila no se entiende (la propia incluida), **no se escribe nada**.
4. Se construye la fila nueva: la leída más la operación, con `n = secuencia + 1` y `base = ultimaOperacion`.
5. **Escritura condicional** (PostgREST, con la política de `update` que ya existe):
   - **Fila que ya existe**: `update` del valor `where user_id = … and key = … and value->>'ultimaOperacion' = <base>`,
     pidiendo las filas actualizadas.
     - Una fila: se ha aplicado.
     - Cero filas: otro escribió antes; no se ha aplicado nada.
   - **Fila nueva**: `insert` simple, no `upsert`. Si la fila ya existe, la clave primaria `(user_id, key)` lo rechaza.
   - **Nunca pasa por `saveData` ni por su cola**: `saveData` debe negarse a escribir una clave que empiece por
     `horarioVersiones:`. Así ningún reintento ciego ni ninguna reescritura tardía las toca.
6. **Se relee la fila** y se busca el `opId`:
   - **Está**: confirmada. Se guarda `confirmada` y se enseña como hecha.
   - **No está**: no se enseña como hecha (ver «Respuestas perdidas»).
7. Se suelta el candado.

#### Cómo se distingue quién cambió la fila (identifica la operación exacta, no solo el número)

> 🔎 **Corrección 2026-11-09: esta identificación es ORIENTATIVA.** Solo sirve para repartir filas y que haya menos
> choques. **La integridad no depende de ella**: depende de la escritura condicional (paso 5). Con la condición, dos
> instalaciones pueden compartir una fila para siempre sin pisarse, porque cada una solo añade sobre la `base` exacta.
>
> **Casos que no se pueden distinguir**, y no se promete hacerlo:
> - Un clon hecho con una copia de seguridad, mientras el original tenía una sesión abierta que sigue escribiendo después:
>   el clon conoce esa sesión (viene en `sesiones`) y toma esas operaciones por suyas.
> - Un clon cuyo original no vuelve a escribir: no hay nada que lo delate, y sigue en la misma fila.
> - Una sesión propia antigua que se recortó de `sesiones`: parece ajena.
>
> Para distinguirlos haría falta un secreto que no viaje en la copia de seguridad, y una PWA de Safari no tiene ninguno.
> Un error de esta tabla solo hace que se cambie de id cuando no hacía falta, o que dos instalaciones sigan en la misma
> fila. En los dos casos, **no se pierde ni se pisa nada**.

Al leer la fila propia se compara su `ultimaOperacion`, y cada operación posterior a la `confirmada` local, con lo que
sabe este aparato. «Qué es» es **lo más probable**, no una certeza.

| Lo que se lee | Qué es | Qué se hace |
|---|---|---|
| `ultimaOperacion` = la `confirmada` local | Nadie más ha escrito | Se sigue |
| Aparece el `opId` que **se está intentando ahora**, en memoria | **Una escritura propia que llegó tarde**, o la respuesta se perdió y sí se aplicó | Confirmada. No se escribe otra vez |
| Aparece un `opId` desconocido con una `sesion` que **está** en `sesiones` | Probablemente **una escritura propia anterior**, de otra pestaña o de una sesión cuya respuesta se perdió. También puede ser un clon (ver arriba) | Se actualiza `confirmada` y se sigue en la fila. **No se avisa de nada**: la lista se recalcula del servidor y enseña lo que hay, sin atribuirlo a ningún aparato (corrección 2026-11-09) |
| Aparece un `opId` con una `sesion` que **no está** en `sesiones`, o la `confirmada` local no aparece en la fila | Probablemente **otra instalación con el mismo id** (un iPhone restaurado desde la copia de seguridad de otro), o se perdieron las claves locales | Por prudencia, **este aparato deja de escribir en esa fila**: se crea un id nuevo y se escribe en una fila nueva. La vieja se conserva entera y se sigue leyendo |
| Un **reintento** con un `opId` que ya está en la fila | Ya se aplicó | Nada que escribir: confirmada |
| La condición devuelve cero filas | Cambió entre leer y escribir: otra pestaña o un clon | Se relee y se vuelve a la tabla. Como mucho **un** intento más dentro del candado; si vuelve a fallar, se detiene y se dice |

**Por qué basta**:
- Cada operación lleva un `opId` único y la `base` sobre la que se escribió.
- La condición exige esa `base` **exacta**, no un número que podría repetirse.
- Una escritura vieja —tardía, reintentada o de un clon— lleva una `base` que ya no es la actual, **así que no se aplica**.
  No puede pisar nada.

#### Respuestas perdidas, sin guardar nada pendiente

- Si la respuesta no llega (corte o tope de tiempo), se relee la fila:
  - **El `opId` está**: confirmada.
  - **No está**: «No se ha podido confirmar. Puede que no se haya hecho; vuelve a mirarlo cuando tengas conexión.» ·
    [Reintentar]. El reintento usa **el mismo `opId`**, en memoria.
- **Si la app se cierra sin confirmar, la operación no se guarda en ninguna parte.**
  - Si la petición llegó a aplicarse, la próxima carga la enseña: la versión creada aparece, o la eliminada desaparece.
    🔎 **No hay ningún aviso de «sí se aplicó»** (corrección 2026-11-09): podría atribuir la operación al aparato
    equivocado. La lista enseña lo que hay en el servidor, y nada más.
  - Si no llegó, no existe, y él puede volver a hacerla con un `opId` nuevo.
- **Una petición que se aplica más tarde** solo puede aplicarse si su `base` sigue siendo la última. Si mientras tanto se
  escribió otra cosa, **nunca se aplicará**.
- **Si se rehace una operación cuya primera copia llegó tarde**, el resultado no cambia:
  - Una versión manual idéntica se reconoce por la huella (`igualA`, §6.5) y no se crea otra.
  - Una segunda marca sobre la misma versión no cambia nada.
  - Un renombre al mismo nombre no cambia nada.
- **Las operaciones de seguridad** (copia `restauracion`, versiones `migracion`, la versión de `confirmacion`) **detienen
  la operación principal** si no se confirman (§18.7, regla 5). Nunca se restaura, migra o confirma sobre una copia sin
  confirmar.
- **Lo que no se puede garantizar sin un diario local**: que una operación cuya respuesta se perdió **acabe aplicándose**.
  Solo se garantiza que **no se enseña como hecha sin estarlo** y que, si se aplica, se ve. Rehacerla es cosa de él. Es el
  precio de cumplir MS F16, y se dice en la pantalla.

#### Cómo se leen todas las filas

- **Hoy no existe**: `loadData` lee una clave exacta (`eq('key')` + `maybeSingle`), y `App.jsx` carga una lista fija.
- **Hace falta una función nueva** en `supabase.js`: `select key, value` con `like('key', 'horarioVersiones:%')`.
  - El filtro existe en `@supabase/postgrest-js` 2.112, la versión instalada, aunque la app no lo usa todavía.
  - La política de lectura (`auth.uid() = user_id`) deja ver todas las filas propias.
  - El límite de filas por petición de Supabase no afecta: hay una por aparato.
- **Vista**:
  - 🔎 **Las operaciones se cuentan por su `opId`, no por la fila donde están** (corrección 2026-11-09). Si la misma operación
    aparece en dos filas (se rehízo con el mismo `opId` tras cambiar de id, o la escribieron dos instalaciones que
    compartían fila), cuenta **una vez**.
    - Como `version.id` es el `opId` de su creación, la misma versión no sale dos veces. Una marca o un renombre repetidos
      tampoco.
    - **No se borra nada para conseguirlo**: las dos copias siguen en sus filas, y la vista las junta.
    - Si dos copias del mismo `opId` no son idénticas (no debería pasar), no se elige una en silencio. 🔎 **Implementado
      así (§18.12)**: queda como **conflicto** con todas sus variantes y sus filas. Una eliminación o un renombre en
      conflicto no se aplican. Una creación en conflicto se enseña con una de sus variantes, marcada como no resuelta, y la
      versión queda bloqueada. «Revisión» lo avisa.
  - Las versiones de todas las filas, menos las que tengan una marca **válida** (de una fila que se entiende entera) en
    cualquier fila. Una marca sobre una automática se ignora y se avisa en «Revisión». 🔎 Una marca leída de una fila
    dañada **no elimina**: es una eliminación dudosa (§18.12).
  - El nombre de cada versión es el último de su cadena de renombres (`sustituye`). Dos renombres que sustituyen al mismo
    son un conflicto que él elige.
- Si la lectura falla, **no se enseña una lista a medias** y no se escribe nada.
- 🔎 Si la lectura funciona pero alguna fila no se entiende (dañada o de un formato posterior), la vista sale
  **incompleta**: se pueden enseñar las versiones recuperables con un aviso inequívoco, y **no se modifica el historial**
  (§18.12).

#### Por qué una marca confirmada no puede desaparecer

1. Solo la escribe el aparato que elimina, en su fila, y solo añadiendo.
2. Ninguna otra fila puede quitarla: ningún aparato escribe la fila de otro.
3. En su propia fila, toda escritura exige la `base` actual, así que **una copia vieja de la fila no puede escribirse
   encima**. Eso cubre una respuesta tardía, un reintento, una pestaña desfasada y un clon.
4. `saveData` y su cola no tocan estas claves.
5. Las copias antiguas de la app no conocen estas claves (N1).
6. Restaurar una versión, migrar o vaciar la papelera solo añaden filas u operaciones.

Lo único que podría quitarla está **fuera de la app**: editar la tabla a mano en Supabase o borrar la cuenta.

#### Si la condición no funciona

Si las pruebas demuestran que PostgREST no aplica bien la condición sobre `value->>'ultimaOperacion'`, o que no se puede
saber cuántas filas cambió:
- Como posible **respaldo del historial**, se puede probar la misma condición con `updated_at` por igualdad, con su misma
  comprobación. 🔎 Es una alternativa **solo para el historial e independiente de la A aprobada del TP-15** (§18.12), que no
  usa `updated_at`. La condición sobre `value` ya se comprobó en local (nivel 3).
- Si tampoco funciona, **no se implanta el historial entre aparatos con C**.
  - Las versiones seguirían en el registro de cada aparato.
  - Una escritura de un clon o una tardía **podría pisar la fila propia**, y se dice. No se promete nada que no se pueda
    cumplir.
  - 🔎 **La B del TP-15 no lo soluciona**: la aprobada el 2026-11-10 (§18.12) protege **solo** `horarioTop` y
    `horarioBorradores`, no las filas `horarioVersiones:*`, que tienen su propio escritor condicional (`docs/03` DEP-31).
  - Una protección del historial en el servidor (la D de la tabla de arriba) necesitaría **un diseño y una decisión
    específicos de Josué**. **No está aprobada.**

#### Pruebas (sin tocar Supabase real ni ejecutar SQL)

| Nivel | Qué comprueba | Qué no | Qué hace falta |
|---|---|---|---|
| **1 · Node, con un doble en memoria** que imita PostgREST: `update` con filtro y número de filas, `insert` con clave primaria, `like` | La lógica: identidad, `opId`, `base`, reintentos, respuestas perdidas simuladas, dos «aparatos» y dos «pestañas» intercalados, una fila de un clon, la vista con marcas, que `saveData` rechaza estas claves | Que Supabase se comporte igual que el doble | Nada: es código de la Fase 4 |
| **2 · Chromium** (el recorrido), con el doble de Supabase de `test-app-real.mjs` y dos contextos de navegador | Web Locks entre pestañas, cortes de red, la pantalla diciendo «sin confirmar», que una eliminada no vuelve tras reconectar | Supabase real | Nada nuevo: ya existe el doble |
| **3 · Postgres y PostgREST locales** (por ejemplo, `supabase start` con Docker), con la tabla y las políticas de `schema.sql` en esa base local | **La condición de verdad**: `value->>` por igualdad, el número de filas devuelto, el `insert` duplicado, `like` con RLS y dos clientes compitiendo | Las cuotas y tiempos del servicio alojado | ~~Instalar herramientas (Supabase CLI o Postgres y PostgREST, y Docker): necesita autorización expresa~~. 🔎 **Hecho**: con Postgres 16 y PostgREST v12.2.3 locales, sin Docker, con autorización; la prueba pasó 33 de 33 con el código de entonces (`017a488`, el 2026-11-09; la prueba del historial de versiones, no la guardia de la A-bis). No toca producción. **No valida** Supabase alojado (nivel 4), Safari ni el iPhone, que siguen pendientes |
| **4 · Un proyecto de Supabase aparte, de pruebas**, creado por Josué y vacío | Lo mismo que el 3, en el servicio alojado | — | Que Josué lo cree y ejecute en él el `schema.sql`: es SQL, pero no en producción. Necesita su autorización y sus claves de ese proyecto |
| **5 · Producción** | — | — | **No se propone.** Cualquier prueba ahí escribe filas en su cuenta. Necesitaría una autorización expresa e independiente que dijera qué claves de prueba se escriben, bajo qué usuario, y que se borran después |
| **Dos aparatos reales** (tras la Fase 4, con su autorización) | Su iPhone y otro aparato: eliminar en uno con el otro días sin conexión, un iPhone restaurado desde copia, cortar la red a mitad, Web Locks en Safari | — | Sus aparatos y su tiempo |

#### Garantías, por separado

- **Del diseño** (sin implementar):
  - Con la condición funcionando, una marca confirmada no desaparece y una versión eliminada no reaparece.
  - Ninguna escritura vieja, repetida o de un clon pisa nada.
  - Lo no confirmado nunca se enseña como hecho.
  - No se guarda nada pendiente en el aparato.
- **Del código actual**:
  - Solo que cada clave es una fila independiente (clave primaria `(user_id, key)`) y que RLS aísla por usuario.
  - Nada más. Su `saveData` hace `upsert` sin condición y su cola reenvía a ciegas, y por eso no puede usarse aquí.
- **Implementado en código** 🔎 (commit `017a488`, todavía **sin pantalla** y sin usarse en la app; §18.12):
  - La lectura por prefijo y el escritor condicional.
  - Que `saveData` y su cola rechacen estas claves.
  - El id con `crypto.randomUUID`, `confirmada`, `sesiones` y la tabla de identidad, que es **orientativa**.
  - La vista fusionada.
- **Pendiente de implementar**: los avisos y toda la interfaz (Fase 4, `docs/20` §11.4).
- **Pendiente de probar**:
  - 🔎 La condición en PostgREST **se comprobó en el nivel 3** (Postgres y PostgREST locales) **con el código de entonces**
    (`017a488`, el 2026-11-09): **33 de 33** en `scripts/test-historial-versiones-postgrest.mjs`, sola y otra vez dentro
    de `verificar.sh`. Ese `verificar.sh` completo (lunes 2026-11-09) tuvo un único fallo, **en Fitness**: «FIT 8/8 — la
    semana: hoy y el pendiente de ayer, con sus estados». La explicación que se dio entonces —que un lunes el día anterior
    cae en la semana anterior— **no se confirmó** repitiéndolo otro día. **Es otra comprobación distinta** de la que falla
    el 2026-11-15 (§18.13). Esto comprueba la condición en local, no el sistema entero.
  - Falta el nivel 4 (Supabase alojado, de pruebas).
  - Web Locks en su iPhone.
  - Los casos con dos aparatos reales.
- **Lo que no se garantiza**:
  - Que se identifique bien cada instalación: un clon puede pasar por la original, y una sesión antigua por un clon. No
    afecta a la integridad, que depende solo de la condición.
  - Que una operación cuya respuesta se perdió acabe aplicándose (solo que no se enseña como hecha).
  - Que la condición funcione, hasta probarla.
  - Nada frente a ediciones manuales de la base de datos.

#### Efecto en el resto del documento

- Donde dice `horarioVersiones`, léase **la vista fusionada**. Se escribe por aparato con este procedimiento.
- Los contratos del §14.6 calculan sobre la vista y devuelven **la operación** que se añade. `versionId` es el `opId` de
  la creación de esa versión.
- La copia `restauracion` y las versiones `migracion` se escriben igual. Si dos aparatos migran a la vez, quedan dos
  versiones iguales, que se enseñan como una sola línea con «2 copias iguales».
- **No cambia datos de producción**: `horarioVersiones` no existe todavía.

### 18.10 La regla definitiva del autoguardado (decisión de Josué)

🔎 **Esta regla sustituye a la redacción histórica de `docs/17` §8** («También se conservan versiones mediante el
autoguardado») en lo que toca a crear versiones. `docs/17` no se modifica: manda esta.
- **El autoguardado conserva el borrador** (`horarioBorradores`, §6.1). **No crea versiones históricas.**
- **Las versiones automáticas** se crean:
  - Al **confirmar** cambios (`confirmacion`, §6.4).
  - En las operaciones de seguridad: **restaurar** (`restauracion`) y **migrar** (`migracion`) (§18.7).
- **Las versiones manuales** se crean **solo** cuando él lo pide («Guardar una versión», §18.1).
- **Ninguna otra cosa crea versiones**:
  - Ni los cambios de un día (§6.6).
  - Ni exportar (§18.5).
  - Ni abrir, ver o salir del editor.

### 18.11 Revisión final (2026-11-09)

| Parte | Comprobado con TP-18, el §18.9 y el §18.10 |
|---|---|
| **Borradores** (§6.1–6.3) | Siguen en `horarioBorradores`, se autoguardan y no crean versiones. Su protección entre aparatos sigue siendo la del §17.3 (detectar y recuperar), sin cambios. Los días del editor van de lunes a domingo |
| **Historial de versiones** (§6.5, §18.1) | Automáticas y manuales como estaban. Solo cambia dónde se guardan (§18.9). Renombrar y eliminar, solo las manuales y con acción expresa. Ninguna se elimina sola |
| **Restaurar y migrar** (§18.7) | La copia previa, el orden y la tabla de fallos se mantienen. Las escrituras de versiones usan el §18.9 |
| **Entre aparatos** (§17.3) | Las versiones quedan protegidas por diseño (§18.9), **siempre que se compruebe la escritura condicional**. Nada pendiente se guarda en el aparato (MS F16). `horarioTop` y los borradores siguen sin protección real hasta TP-15, y se sigue diciendo |
| **Papelera y recuperación** (§7) | Vaciar o caducar la papelera no toca los registros de versiones. «Versiones de horarios eliminados» sale de la vista fusionada |
| **Maestro** (`docs/17`) | Lunes a domingo (§2 y §9) se cumple ahora sin excepciones. El §8 queda sustituido en lo del autoguardado por el §18.10 |
| **Diseño** (`docs/20`) | Actualizados §4, §6.2, §11.2, §11.4, §12.12, §12.13 y §16.2 |
| **Identidad e ids de versión** (corrección autorizada el 2026-11-09) | La detección de clones es orientativa y no sostiene la integridad. `version.id` = `opId` de su creación, y la vista cuenta cada `opId` una vez. Retirado el aviso de «sí se aplicó». Nada se enseña como hecho sin confirmar |
| **MS F16, sin excepciones** (decisión de Josué, 2026-11-09; 🔎 en Horarios, `docs/03` C-84) | Nada pendiente se guarda en el aparato: ni versiones, ni marcas, ni borradores. En el aparato solo hay identificadores y lo ya confirmado (§18.9). `docs/20` §11.2 y §12.12 decían que un borrador sin guardar «sigue en este aparato»: corregido a «en memoria, mientras la app siga abierta» |

**Decisiones pendientes**:
- **Estado vigente** (🔎 desde el §18.12, actualizado el 2026-11-10): TP-1, TP-3, TP-5 y TP-7, además de las de las
  Fases 5 y 7 (lista completa en el §18.12). Resueltas: TP-4, TP-13, TP-14 y TP-18. Decidida, sin implementar: TP-15 (que
  incluye el TP-8), A + B + C.
- **Estado en esta revisión final, antes del §18.12** (se conserva como registro): pendientes TP-1, TP-3, TP-4, TP-5,
  TP-7, TP-13, TP-14 y TP-15; TP-18 ya estaba resuelta.

### 18.12 Cierre documental previo a la Fase 4 (2026-11-09)

> Corrección documental autorizada por Josué. **Manda sobre los apartados anteriores donde difieran.** No autoriza la Fase 4
> ni ningún cambio de código, datos, SQL o dependencias.

#### Decisiones de Josué

| # | Decisión | Dónde queda |
|---|---|---|
| 1 | **TP-4**: el diagnóstico de sus datos es un **panel de solo lectura en la entrega A**. No se ejecuta ni se prepara SQL en producción | §12.2, §12.3, §12.5, §15 |
| 2 | El diagnóstico, **ejecutado, revisado y con sus incidencias resueltas**, es condición necesaria de la entrega B y de cualquier migración | §12.2, §12.3 |
| 3 | **Vista incompleta**: se pueden enseñar las versiones recuperables, con un aviso inequívoco de que el historial está incompleto. **No se modifica el historial** mientras esté incompleta | Abajo y `docs/20` §11.4 |
| 4 | Una fila de un **formato posterior** se trata como **solo lectura** | Abajo y `docs/20` §11.4 |
| 5 | **TP-5** se decide después del diagnóstico, y solo si aparecen ciclos con grupo | §15 |
| 6 | **TP-8** se trata junto con el **TP-15** | §15, §17.7 |
| 7 | **TP-13**: se conserva todo; no hay poda automática | §17.7 |
| 8 | **TP-14**: no hay aviso global de versión nueva en esta fase | §17.7 |
| 9 | **TP-7** y las de las Fases 5 y 7 siguen pendientes para su fase | Abajo |
| 10 | 🔎 **TP-15** (con el TP-8), **2026-11-10**: se adopta **A + B + C**, en ese orden, con la política de conflictos aprobada | Abajo, «TP-15: la decisión aprobada»; §17.3 y §17.7 |
| 11 | 🔎 **TP-9**, **2026-11-10**: las decisiones de Horarios quedan anotadas en `docs/03` (C-80 a C-86, DEP-31 a DEP-33). **C-84**: la prohibición de guardar en el aparato lo pendiente es **solo de Horarios**; C-71 sigue vigente para el resto | §15; `docs/03` |
| 12 | 🔎 **A-bis**, **2026-11-14** (especificación consolidada, con [ABIERTO-1] a [ABIERTO-4], C-1 a C-4 y la corrección del §6.6) y **implementada en v3.162.0** (2026-11-15). **TP-17** queda resuelto para la guardia: una fila por aparato | §18.13; §17.2; `docs/03` DEP-34 |

#### El historial de versiones tal como está implementado

**Estado** [CÓDIGO]: `src/lib/historialVersiones.js` (la vista y el escritor) y el transporte de `src/lib/supabase.js`, en
el commit `017a488`. **No tiene pantalla y la app no lo usa todavía**: nada escribe `horarioVersiones:*` en producción. Lo
que la interfaz enseñará es **diseño de la Fase 4** (`docs/20` §11.4), no comportamiento existente. 🔎 **Desde la A-bis
(v3.162.0, publicada en `main` junto con `017a488`, PR #6)**: además del rechazo de sus claves en `saveData` y en la cola (desde `017a488`),
la app solo usa de este archivo `almacenDelNavegador`, del que la guardia saca el id del aparato (§18.13); el escritor y la
vista siguen sin usarse.

**Lo que devuelve la vista** (`vistaFusionadaDeVersiones`; solo lee, no escribe):

| Campo | Qué es |
|---|---|
| `visibles` | Las versiones que se enseñan, en un orden fijo (fecha de creación y luego id) que **no depende del orden de lectura**. Cada una lleva: `protegida`, `afectada`, `afectadaPor`, `enConflicto`, `eliminacionDudosa`, y del renombre, `conflictoDeNombre` y `cabezas` |
| `eliminadas` | Las ocultadas por una marca **válida** (de una fila que se entiende entera) y sin conflicto |
| `eliminacionesDudosas` | Las marcas leídas de una fila dañada. **No eliminan nada.** Cada una: `opId`, `versionId`, `objetivo` (`visible`, `automatica`, `ya_eliminada` o `desconocida`), `nombre`, `filas`, `en` y `sesion` |
| `conflictos` | Cada `opId` con copias que no dicen lo mismo: `origen` (`filas_validas`, `valida_y_recuperada`, `recuperadas` o `copias_en_fila_ilegible`) y **todas sus variantes con sus filas**. Ninguna se elige |
| `afectadas` | Todas las versiones sin resolver, visibles o no, con su `afectadaPor` |
| `marcasIgnoradas` | Marcas válidas sobre una versión automática (no tienen efecto) |
| `ilegibles`, `detalleIlegibles`, `formatoFuturo` | Las filas que no se entienden: `fila_ilegible` (con cuántas marcas se leyeron y cuántas operaciones quedaron sin leer) o `formato_futuro` (con su número de formato) |
| `completa` | Se han entendido **todas** las filas |
| `definitiva` | `completa` y, además, sin conflictos ni eliminaciones dudosas |

**Reglas de la vista**:
1. **Las filas válidas mandan.** Lo leído de una fila dañada nunca sustituye una operación válida, aunque comparta su
   `opId`. Si dice otra cosa, es un conflicto (`valida_y_recuperada`) que afecta a la versión que **nombra la copia
   dañada**, no a la creación válida con la que comparte id.
2. **De una fila de formato 1 dañada** solo se leen las marcas de eliminación completas (con `opId` y `versionId`) cuyas
   copias dentro de la fila sean idénticas **campo a campo**. Son **eliminaciones dudosas**: la versión sigue visible. De
   esa fila no se recuperan versiones ni renombres.
3. **Conflictos**: una eliminación o un renombre en conflicto **no se aplican**. Una creación en conflicto **no hace
   desaparecer la versión**: se enseña con una de sus variantes (la primera en un orden fijo, que **no significa que sea
   la buena**), marcada como no resuelta, y todas sus variantes quedan en `conflictos`.
4. **Automáticas**: basta con que **una** variante de la creación sea automática para que toda la identidad quede
   `protegida`. Una marca válida sobre ella, venga del aparato que venga, se ignora; una dudosa queda con objetivo
   `automatica`.
5. **`afectadaPor`** dice qué deja sin resolver a una versión, con su `opId`, su `origen` y su `motivo`:
   `creacion_en_conflicto`, `renombre_en_conflicto`, `eliminacion_en_conflicto`, `marca_recuperada_en_conflicto` o
   `eliminacion_dudosa`. `enConflicto` es cualquiera de ellos salvo `eliminacion_dudosa`.
6. **Una fila de un formato posterior** no se interpreta en absoluto.
7. **Dos renombres a la vez** que sustituyen al mismo nombre no son un conflicto de operación: es `conflictoDeNombre`
   (dos `cabezas`) y se resuelve eligiendo uno con un renombre nuevo, cuando la vista esté completa.

**Lo que hace el escritor** (`crearEscritorDeVersiones`). Cada operación acaba en `confirmada`, `sin_confirmar` o
`no_aplicada`, con un `motivo`:
1. Si la operación ya está en la fila propia, se confirma **sin escribir** (cuenta en `yaAplicadas`).
2. Si no, **antes de escribir cualquier cosa** (crear, eliminar, renombrar o un reintento) se lee **el historial entero**:
   | Lo que encuentra | Motivo | Si no se había enviado | Si ya se había enviado |
   |---|---|---|---|
   | No se puede leer | `sin_conexion` o `lectura` | `no_aplicada`, en memoria para reintentarla con el mismo `opId` | `sin_confirmar` |
   | Una fila de un formato posterior | `formato_nuevo` | Igual | Igual |
   | Una fila que no se entiende (también la propia) | `vista_incompleta` | Igual | Igual |
3. **Eliminar y renombrar** comprueban además la versión, con la vista recién leída: `version_desconocida`; `ya_eliminada`
   (al eliminar, devuelve `confirmada` sin escribir; al renombrar, `no_aplicada`); `version_automatica` (si es automática o `protegida`); `version_afectada` (si tiene
   algo en `afectadaPor`). Eliminar exige `confirmado` (`sin_confirmacion`).
4. Sin `navigator.locks` no escribe (`sin_candado`). Si la condición rechaza dos intentos seguidos, se para
   (`conflictos_repetidos`) y la operación queda en memoria.
5. Con la vista **completa pero no definitiva** por un conflicto, se puede seguir operando con las versiones **no
   afectadas**, y crear versiones nuevas.
6. 🔎 **Cambio respecto al §18.9**: con la fila **propia** dañada, el escritor **ya no cambia de id para seguir en una fila
   nueva**: la vista sale incompleta y no escribe.

**Consecuencias para el resto del diseño** (lo construye la Fase 4; aquí se fija para que no se invente):
- Confirmar un borrador, restaurar una versión y migrar **escriben antes una versión automática** (§6.4, §18.7). Con el
  historial incompleto, de un formato posterior o sin poder leerse, esa versión no se puede escribir, y por la regla 5 del
  §18.7 **la operación se detiene**. Es decir: **una fila dañada o de un formato posterior, de cualquier aparato, impide
  confirmar cambios del horario, restaurar y migrar** hasta que se resuelva. El borrador no se pierde (sigue en
  `horarioBorradores`, que no pasa por este escritor).
- **No existe ninguna operación para resolver** un conflicto, una eliminación dudosa o una fila dañada. Añadirla
  necesitaría un tipo de operación nuevo, es decir, un cambio del formato, y es una decisión de Josué.

#### TP-15: la decisión aprobada (2026-11-10)

> **Decisión de Josué**, que incluye el TP-8. Sustituye a las opciones del §17.3 y del §17.7. **Nada de esto está
> implementado ni probado**: fija qué se construye en la Fase 4 y con qué condiciones. No autoriza ningún SQL ni ninguna
> escritura en Supabase.

**Se adopta A + B + C, en este orden.**

**A · Escritura condicional en el cliente**
- `horarioTop` y `horarioBorradores` tienen **un escritor propio**, con el mismo patrón que el del historial de versiones
  (`docs/03` DEP-31).
- **`saveData` y su cola ordinaria no pueden escribir esas claves**: se rechazan como hoy se rechazan las
  `horarioVersiones:*`, sin tocar la red.
- **Todas las rutas de escritura usan el escritor protegido.** Las que escriben `horarioTop` hoy [CÓDIGO]:
  - `snapshotAndSave` (`App.jsx`), por donde pasan casi todos los cambios del módulo;
  - **Deshacer** (`App.jsx`), que restaura una copia de `horarioTop` guardada en `historial`;
  - **Estudios**, al eliminar una asignatura (`limpiarHorarioDeAsignatura`);
  - **el registro automático de avisos enviados** (`HorarioView.jsx`), que se guarda solo, sin que Josué toque nada;
  - el editor, importar, archivar, eliminar, el ciclo y las franjas (`onCambiar`).
  - Y las nuevas de la Fase 4: confirmar un borrador, restaurar, migrar, los cambios de un día y el autoguardado del
    borrador.
- **La condición es por igualdad con una revisión anterior**: cada escritura lleva un identificador de revisión nuevo y
  aleatorio, y la revisión sobre la que se calculó. **Nunca una marca de tiempo del dispositivo**, tampoco `updated_at`
  (lo pone el reloj del aparato).
- **Un conflicto se detecta y no se escribe**: se relee y se aplica la política de abajo. Nunca se reenvía el valor viejo.

**B · Protección en el servidor**
- **Solo para las claves de Horarios** (`horarioTop` y `horarioBorradores`). El resto de `app_data` no cambia.
- Una **regla en la base de datos** (por ejemplo, un disparador sobre `app_data` para esas claves) que rechace cualquier
  escritura que no respete la revisión vigente. Así una **copia antigua de la aplicación**, que no conoce la revisión, no
  puede sobrescribir: su guardado falla.
- **Análisis por vía de escritura**. Es lo que la regla tiene que cubrir; cada fila es algo que **las pruebas deben
  demostrar**, no algo que se da por hecho:

  | Vía | Qué ocurre en Postgres | Qué debe hacer la regla |
  |---|---|---|
  | **UPDATE** (lo que usará el escritor A) | Se evalúa sobre la fila bloqueada. Con dos a la vez, la segunda espera y se vuelve a evaluar sobre la fila ya cambiada | Rechazar si la base no es la revisión vigente o si no trae una revisión nueva |
  | **UPSERT** (`insert … on conflict do update`, lo que hacen `saveData` y las copias antiguas) | Se ejecutan los disparadores de **inserción** con la fila propuesta y, si hay conflicto, los de **actualización** | Rechazar por cualquiera de las dos vías una fila sin revisión nueva o con una base que no es la vigente |
  | **INSERT de la primera fila** (una cuenta sin la clave todavía) | Si la fila ya existe, choca con la clave primaria (23505) | Permitirla solo si no existe la fila y trae revisión nueva, sin base |
  | **La fila que ya existe sin revisión** (todas las de hoy, escritas antes de A) | — | Aceptar la primera escritura del escritor A (base vacía sobre una fila sin revisión) y **exigir siempre una revisión nueva**, para que una copia antigua tampoco entre por ahí |
  | **Reintentos y respuestas perdidas** | Una operación repetida lleva la misma base y la misma revisión | Si ya se aplicó, la base ya no es la vigente y se rechaza; el escritor relee y la reconoce por su revisión. Ni duplicado ni sobrescritura |
  | **DELETE** | La aplicación no borra filas de `app_data` [CÓDIGO], pero la política de borrado existe | Un borrado seguido de un INSERT saltaría la condición. **La protección frente a DELETE de esas claves es obligatoria**; cómo se hace se decide al implementarla (cuestión 3) |
  | **Otros caminos** (el panel de Supabase, SQL, la clave de servicio) | Las políticas de RLS no se aplican a la clave de servicio; los disparadores sí, salvo que se desactiven a propósito | Comprobar que no queda ninguna vía sin la regla |

- **No se da por garantizada** hasta que las pruebas demuestren que **no puede eludirse** mediante DELETE, INSERT, UPDATE,
  UPSERT ni ninguna otra vía de escritura.
- **Pruebas antes de activarla**: con Postgres y PostgREST locales y, después, en un **proyecto Supabase independiente**.
  **Ninguna prueba con datos reales.**
- **Activación en producción**: solo con la **autorización expresa de Josué**, que ejecuta el SQL, y con su marcha atrás
  preparada (quitar la regla).
- **Orden**: A tiene que estar en **todos** los caminos de escritura antes de activar B. Si no, la propia aplicación no
  podría guardar Horarios.

**C · Recarga al volver a la aplicación**
- Se vuelven a leer `horarioTop` y `horarioBorradores` **al volver a primer plano** y **al recuperar la conexión**.
- Reduce los conflictos, pero **complementa A y B; no las sustituye**: entre la recarga y la escritura otro aparato puede
  escribir.

**Política de conflictos aprobada**

| Caso | Qué se hace |
|---|---|
| Avisos automáticos y marcas del día | Se recalculan y se **vuelven a aplicar sobre los datos actuales**, si no se pierde ningún cambio |
| Cambios de un día | Se vuelven a aplicar **solo si la actividad sigue existiendo y no hay ambigüedad**; si no, se para y se dice |
| Deshacer | **Se bloquea** si hay cambios de otro aparato posteriores |
| Confirmar un borrador | **Se bloquea** ante un conflicto y **se conserva el borrador** |
| Importar | **Se bloquea** ante un conflicto y **se conserva la importación preparada** |
| Borradores | **Una clave compartida entre dispositivos** (`horarioBorradores`, §6.1) |
| Respuestas de red perdidas | La operación se reconoce por un **identificador estable**: ni se duplica ni pisa después nada más nuevo |

**Cuestiones de implementación** (no cambian la decisión; se resuelven al construirla):
1. El nombre y el sitio de la revisión y de la base dentro de `value` (por ejemplo, junto al testigo del §17.2), y que la
   normalización los conserve.
2. Cómo distingue el cliente el rechazo de la regla de un fallo de red (el código del error que devuelva PostgREST).
3. **Obligatoria**: cómo impide la regla el DELETE de esas claves (un borrado seguido de un INSERT no puede servir para
   saltarla). Lo que queda por decidir es el cómo, no si se hace.
4. Cómo se vuelve a aplicar una operación automática: **recalcularla sobre el estado nuevo**, nunca reenviar el valor
   viejo; y qué es «sin ambigüedad» en un cambio de un día.
5. Deshacer: cómo sabe que hay cambios ajenos posteriores (la revisión de su copia frente a la vigente).
6. **El autoguardado de un borrador con la clave compartida**: qué se hace si otro aparato cambió otro borrador, o ese
   mismo, entre medias.
7. **Las operaciones que tocan varias claves no son atómicas** (versión → `horarioTop` → borrador, §6.4; el respaldo antes
   de migrar, §17.4): su orden y su recuperación tienen que ser seguros si una falla a medias. **Es una condición
   obligatoria**: no se da por resuelta porque cada escritura por separado funcione; tiene que probarse el fallo a medias de
   cada operación.
8. La relación con la guardia, el testigo y las condiciones de la entrega B (§17.2): mientras B no esté activa, **no las
   sustituye**.
9. Que el filtro sobre `value` de PostgREST se comporte igual en un Supabase alojado (nivel 4).
10. A y C respetan la decisión C-84 de `docs/03`: en Horarios no se guarda en el aparato nada pendiente.

**Riesgos y condiciones**
- La protección A **solo vale si está en todos los caminos de escritura**. Uno que se olvide sigue escribiendo a ciegas.
  Se vigilará con una prueba que lo busque, como la del historial.
- B tiene que probarse **en local y en un proyecto Supabase independiente** antes de activarse.
- **Las copias antiguas pueden recibir errores** al guardar Horarios hasta que se recargue la aplicación.
- **Las operaciones entre varias claves no son atómicas** y necesitan recuperación segura (cuestión 7), probada con fallos a
  medias; que las escrituras individuales funcionen no basta.
- **B no se activa en producción sin la autorización expresa de Josué.**
- **No se usan datos reales para experimentar.**
- Hasta que A, B y C estén implementadas y probadas, siguen valiendo los riesgos 3 y 7 de abajo.

#### Riesgos y límites (aceptados mientras no se decida otra cosa)

1. **Una fila dañada bloquea las escrituras** del historial en todos los aparatos, también la del propio, y con ellas
   confirmar, restaurar y migrar (arriba). No hay reparación.
2. **No hay forma de resolver conflictos ni eliminaciones dudosas**: esas versiones se quedan sin poder renombrarse ni
   eliminarse.
3. **Hay una ventana entre la lectura global y la escritura**: otro aparato puede dañar o cambiar una fila en ese
   momento. La integridad de lo ya escrito no depende de esa lectura, sino de la escritura condicional sobre la fila
   propia.
4. **Cada escritura hace una lectura global más** (todas las filas), en cada uno de sus dos intentos como mucho.
5. **Pruebas simuladas frente a reales**:
   - **Simulado (Node, doble en memoria)**: la lógica completa, 136 comprobaciones.
   - **Real, pero local**: la escritura condicional, el `insert` duplicado y `like` con RLS en Postgres 16 y PostgREST
     v12.2.3 locales, y Web Locks en **Chromium**. 🔎 **Repetida con el código de `017a488`** (el de entonces, el
     2026-11-09): **33 de 33** en `scripts/test-historial-versiones-postgrest.mjs`, sola y otra vez dentro de
     `verificar.sh`. ⚠️ **Es la prueba del historial de versiones**: no cubre la guardia de la A-bis, cuyo nivel 3
     (`scripts/test-guardia-horario-postgrest.mjs`) existe y **no se ha ejecutado** (§18.13).
   - **`verificar.sh` completo con el código de `017a488`** (lunes 2026-11-09): un único fallo, **en Fitness**: «FIT 8/8 —
     la semana: hoy y el pendiente de ayer, con sus estados». La explicación que se dio entonces —que un lunes el día
     anterior cae en la semana anterior— **no se confirmó** repitiéndolo otro día. **Es otra comprobación distinta** de la
     que falla el 2026-11-15 (§18.13).
   - **Sin probar**: Supabase alojado (nivel 4); Safari e iPhone (Web Locks, `crypto.randomUUID`, la app en segundo plano);
     dos aparatos reales; un iPhone restaurado desde una copia.
   - Nada de lo anterior se presenta como probado en Safari, en el iPhone ni en Supabase.
6. **`crypto.randomUUID` y `navigator.locks` solo existen en un contexto seguro** (`isSecureContext`): una página servida
   por HTTPS **o** desde la propia máquina (`http://localhost`, `http://127.0.0.1`), aunque vaya por HTTP. No depende de
   HTTPS, sino de que el origen sea de confianza.
   - **Comprobado en Chromium (Playwright 1.62.1, 2026-11-09)**: en `http://127.0.0.1` y `http://localhost` los dos
     existen. En HTTP con una dirección de red (`http://192.0.2.2`, como abrir el servidor de desarrollo desde el iPhone
     por la IP del ordenador), `isSecureContext` es falso, `crypto.randomUUID` no existe (llamarlo lanza `TypeError`) y
     `navigator.locks` tampoco.
   - **Consecuencia**: ahí el escritor **no se puede crear** (sus valores por defecto llaman a `crypto.randomUUID`), y
     aunque se le diera un id, sin candado no escribiría (`sin_candado`). En producción (Vercel, HTTPS) no afecta.
   - **En Safari no se ha comprobado**: según la especificación de contextos seguros debería comportarse igual. La Fase 4
     tiene que tratar este caso.
7. **`horarioTop` y los borradores siguen sin protección entre aparatos** (TP-15, punto 2). 🔎 La protección está
   **decidida** (A + B + C, arriba) pero **no implementada**: hasta entonces este riesgo sigue en pie.

#### Decisiones que siguen pendientes

- **TP-5**: después del diagnóstico, y solo si aparecen ciclos con grupo.
- **TP-7**: antes de la Fase 7.
- **TP-1, TP-2 y TP-3** (Fase 7) y **TP-11** (Fase 5).
- **TP-10** (fuera de Horarios) y **TP-12** (el margen entre la A y la B, Fase 4).
- **Resueltas**: TP-4, TP-6, TP-9 (documentalmente, el 2026-11-10), TP-13, TP-14 y TP-18. **Unificada**: TP-8, en el TP-15.
  🔎 **TP-17**, resuelta para la guardia (2026-11-14, implementada el 2026-11-15, §18.13).
- 🔎 **Decidida el 2026-11-10, sin implementar**: TP-15 (con el TP-8), A + B + C. Lo que queda es construirla, probarla y
  la autorización de Josué para activar B en producción. **La A-bis no la implementa** (§18.13).
- 🔎 **De la A-bis, pendientes para la entrega corta** (§18.13): retirar aparatos y resolver incidencias (C-3), y la lista
  definitiva de decisiones de una resolución.

### 18.13 Entrega A y A-bis tal como están implementadas (2026-11-15)

> Sincronización documental autorizada por Josué el 2026-11-15. Recoge la **especificación consolidada de la A-bis**
> (aprobada el 2026-11-14, con [ABIERTO-1] a [ABIERTO-4], C-1 a C-4 y la corrección del §6.6, que separa los cuatro
> conceptos) y lo que hace el código publicado. **Manda sobre los apartados anteriores donde difieran** (C-80: manda lo más
> reciente). No añade decisiones: donde algo no está decidido, lo dice. No autoriza la entrega B, la entrega corta ni
> ningún SQL.

#### Estado

| | |
|---|---|
| Publicado | v3.162.0, PR #6 fusionado en `main` (`dcb649e`), despliegue de producción correcto. Commits `71a2d69` (A y A-bis) y `bcac642` (la prueba de Chromium con reloj fijo), sobre `017a488` y `ba7e258` |
| Código | `src/lib/guardiaHorario.js` (nuevo: forma de la fila, invariante, huella, clasificación, estados, escritor, intención, testigo, evaluador e id); `src/lib/supabase.js` (transporte de la guardia, lectura propia de `horarioTop`, rechazos en `saveData`); `src/lib/sincronizacion.js` (rechazos en la cola); `src/lib/horario.js` (`version` y `testigo`, campos conocidos); `src/App.jsx` (integración); `src/components/guardiaHorarioPanel.jsx`, `src/views/HorarioView.jsx` (pantalla de consulta y avisos); `src/lib/estadosAsincronos.js`. `historialVersiones.js` no cambia |
| Probado | `test-guardia-horario.mjs` (267, casos 1–30 y concurrencia), `test-guardia-horario-vista.jsx` (60), la sección A-bis del recorrido de Chromium, con el doble de Supabase ampliado y un reloj fijo (**38 comprobaciones contadas en una ejecución aislada de esa sección**; en el `verificar.sh` final, cuyo registro solo enumera los fallos, **ninguna de esa sección figura entre ellos**), las de la entrega A (507 y 33), y `verificar.sh` en una copia limpia sin `.env.local` (2026-11-15): un único fallo, **«FIT 8/8 — con plan: los mismos entrenamientos por día, y nada perdido antes del seguimiento»**, que **también falla en la base `ba7e258`**, sin A ni A-bis, en una ejecución parcial del mismo día, y que **pasó** en las ejecuciones del 2026-11-14. **Su causa no está determinada**; queda pendiente repetirlo en un día entre semana |
| Sin probar | El **nivel 3** de la guardia (`test-guardia-horario-postgrest.mjs`: existe y se omite sin un PostgREST local configurado; **no se ha ejecutado**); Supabase alojado; Safari e iPhone; dos aparatos reales. 🔎 **E1 (2026-11-16)**: el nivel 3 de la guardia **ya se ha ejecutado** en el laboratorio local de E1 (19 de 19, §18.14), y el fallo de «FIT 8/8 — con plan…» tenía causa —el día de la semana— y está corregido en la prueba (D5, §18.14). Siguen sin probar Supabase alojado, Safari, el iPhone y dos aparatos reales |

#### 1. `version` y testigo dentro de `horarioTop`

```
version: 1
testigo: { formato: 1, desde, ultimaEscritura, revision, base, aparato, ...desconocidos del testigo anterior }
```

- `desde` y `ultimaEscritura`: hora del aparato, solo informativas. `revision`: un uuid nuevo en cada escritura. `base`: la
  `revision` del estado actual de la pantalla, o `null`. `aparato`: el que escribe.
- **Toda escritura de la A-bis lleva `version: 1`**, con testigo o sin él (C-4). `version` **solo** sirve para separar B
  de C; nunca hace inocua una falta de testigo.
- **El testigo va en toda escritura fuera del arranque.** Durante el arranque, solo si existe **alguna intención
  confirmada** (leída en el servidor al cargar, de cualquier aparato, o confirmada por esta sesión); si no, el guardado
  sale sin testigo y sin esperar.
- Solo en los dos puntos de escritura (`snapshotAndSave` y Deshacer); el mismo objeto va a la pantalla y a `saveData` (🔎 **E1**: ya no a `saveData`, sino al escritor protegido, que es quien llama a `prepararEscritura`, §18.14);
  `base` sale del estado actual, nunca de la copia que restaura Deshacer; un testigo anterior mal formado se sustituye.
- **Nunca se escribe `horarioTop` al cargar** ni sin que él guarde algo.
- `revision` y `base` **no protegen nada** hasta el TP-15. 🔎 **E1**: desde el §18.14 la `revision` es la condición de toda escritura de `horarioTop` (TP-15 A), y `base` es lo que comprobará la regla del servidor cuando se active (TP-15 B).

#### 2. La fila `horarioGuardia:<aparato>`

La clave lleva el id del aparato, y el sufijo tiene que ser igual a `value.aparato`.

| Campo | ¿Obligatorio? | ¿Cambia? | Contenido |
|---|---|---|---|
| `formato` | Sí (`1`) | No | Si es mayor que 1, no se escribe en la fila: lectura no verificable |
| `aparato` | Sí | No | uuid del aparato |
| `secuencia` | Sí | Sube de uno en uno | Número de la última escritura aplicada |
| `ultimaOperacion` | Sí | Sí | `opId` de la última escritura (la condición) |
| `primeraVezA` | Sí | No | `{ en, versionApp }`. La fecha que cuenta es `updated_at`, que pone el servidor al crear la fila |
| `etiqueta` | No (o `null`) | Sí | Genérica. La A-bis la deja en `null` |
| `visitas` | Sí (al menos una) | Sí | `{ [versionApp]: { primera, ultima } }`, cada una con `{ en, fecha, secuencia }` |
| `testigo` | No | Sí, a partir de lo leído | `intenciones`, `escrito` y `visto` |
| `detecciones` | Sí (puede estar vacía) | **Solo crece** | Los registros de incidencias |
| `retiradas` | Sí (vacía en la A-bis) | **Solo crece** | `{ id, secuencia, en, fecha, aparatoRetirado, secuenciaVista, versionMasRecienteVista, ultimaVisitaVista, etiquetaVista }` |
| `resoluciones` | Sí (vacía en la A-bis) | **Solo crece** | `{ id, secuencia, en, fecha, deteccionIds, decision, nota? }` |
| (desconocidos) | — | — | Se conservan |

- **`testigo.intenciones`**: lista que solo crece, de `{ id, secuencia, en }`. Autoriza a escribir el testigo y se enseña
  en la pantalla de consulta, pero **no es evidencia de que exista un testigo** y no interviene en ninguna condición.
- **`testigo.escrito`**: `{ primera, ultima }`, cada una `{ revision, secuencia, en }`. Solo cuando una relectura del
  servidor encuentra una `revision` escrita por esta sesión.
- **`testigo.visto`**: igual, y la última con `conocidas` (los `id` de todas las incidencias de todas las filas). Solo
  cuando una lectura del servidor encuentra un **testigo válido presente** (concepto 2).
- **Un registro de incidencia**:
  `{ id, secuencia, en, fecha, versionApp, clase: 'perdida' | 'ambigua', motivo: 'testigo_ausente' | 'testigo_ilegible' |
  'fila_ausente', huella, evidencia: { teniaVersion, version, horarios, reglas, excepciones, actividades,
  revisionesDemostradas } }`. `perdida` es la clase B y `ambigua` la C (siempre `testigo_ausente`). La evidencia no guarda
  nada personal. `no_verificable_arranque` **no existe**.
- **Retiradas y resoluciones** las escribe la entrega corta, también para C (C-3). Una resolución nombra los `id` que
  cubre, y un valor de `decision` que esta versión no reconozca no cuenta. ⚠️ La lista de decisiones reconocidas
  (`DECISIONES_RESOLUCION`) es **provisional**: la fija la entrega corta.
- **El invariante**, antes de enviar cualquier escritura (si no se cumple, no se envía nada): `formato`, `aparato` y
  `primeraVezA` no cambian; `secuencia` es la anterior más uno; `detecciones`, `retiradas`, `resoluciones` y
  `testigo.intenciones` siguen empezando exactamente por lo que ya había. El valor nuevo se construye siempre a partir de
  la fila recién leída.
- **La huella**: SHA-256 de `horarioTop` en crudo, como JSON con las claves ordenadas en todos los niveles y las listas en
  su orden; sin fila, la de `null`; sin `crypto.subtle`, `null`. Solo agrupa y sirve para la supresión: nunca se fusionan
  ni reescriben registros.

#### 3. Identidad, versión y transporte

- **Id del aparato**: `almacenDelNavegador().leer('aparato')`, con una sola instancia para toda la app (el mismo que el
  historial de versiones). Si no existe, se crea con `crypto.randomUUID()` o un uuid v4 hecho con
  `crypto.getRandomValues()`; nunca con `Math.random`. Sin ninguno, no se registra nada y cuenta como lectura no
  verificable.
- **Versión de la app**: `VERSION` (`src/lib/version.js`); `'desarrollo'` no es comparable.
- **Transporte** (`supabase.js`): leer todas las filas (`like 'horarioGuardia:%'`, con `updated_at`) y la propia; `insert`
  simple (23505 es conflicto); `update … where value->>ultimaOperacion = base`, pidiendo las filas de vuelta. Solo admite
  ese prefijo y **nunca envía `updated_at`**. Más **una lectura propia de `horarioTop`**, solo de lectura, que dice si la
  fila existe y **no toca el estado de carga de `loadData`**.
- **`saveData` y la cola rechazan**, antes de la red y sin dejar nada pendiente: `horarioGuardia:*`, `horarioGuardia`,
  `horarioAparatos` y `horarioAparatos:*`.
- **El escritor condicional**: usa `navigator.locks` si existe; lee la fila propia y construye la nueva con el invariante;
  `insert` si no existe, `update` con condición si existe. Si choca (el `update` no aplica nada o el `insert` da 23505),
  relee y reconstruye **conservando el `opId` y el `id`**; como mucho dos intentos, después «conflicto repetido». **Solo
  está confirmada si, al releer, aparece su `id`**. Reintenta al volver la conexión, desde memoria y con los mismos
  identificadores, sin crear nunca un registro nuevo. **Nada se guarda pendiente en el aparato** (C-84). Es independiente
  de la cola de `saveData`, que no cambia.

#### 4. Carga, comprobación y clasificación

1. **E0 · Comprobación inicial**: solo Horarios queda en solo lectura («Comprobando tu horario»).
2. Se leen primero todas las filas de la guardia y después la lectura propia de `horarioTop`.
3. **Variables**, solo con lo leído en el servidor: **testigo demostrado** (alguna fila tiene `testigo.visto` o
   `testigo.escrito`); **arranque** (no hay ninguno); **intención confirmada** (alguna fila tiene una entrada en
   `testigo.intenciones`); **fila de `horarioTop`** (presente o ausente: ausente es que la lectura confirma que no existe);
   **`version`** (ausente, 1 o no reconocida).
4. **Los cuatro conceptos** (solo con la fila presente):
   1. **Estructuralmente válido**: un objeto, con `version` ausente o 1. Solo dice que se puede leer: **nunca da E1 por sí
      solo**. Si el valor no es un objeto, su testigo cuenta como ilegible (4a).
   2. **Testigo válido presente**: estructuralmente válido, con `version: 1` y `testigo` un objeto con `formato === 1` y
      `revision` de texto no vacío. Los demás campos del testigo no cuentan para la validez.
   3. **Testigo ausente**: estructuralmente válido y sin la propiedad `testigo` (o con `undefined`).
   4. **4a · Ilegible**: un valor que no es un objeto; un `testigo` que no es un objeto (o es lista o `null`); un
      `formato` que no es un entero o es menor que 1; `formato === 1` sin `revision` de texto no vacío; un testigo con
      forma válida en un `horarioTop` sin `version`. **4b · Formato posterior**: `formato` entero mayor que 1, que es
      lectura no verificable.
5. **Lectura no verificable**: falla una lectura; una fila no se entiende, es de un formato futuro o su `aparato` no
   coincide con la clave; no hay id del aparato; `horarioTop` no se pudo cargar; o el caso 4b. Horarios queda bloqueado
   hasta conseguir una comprobación válida (se reintenta al volver la conexión o con «Reintentar») y no se escribe nada en
   la guardia. Si `horarioTop` no se cargó, la regla de la MS F16 lo mantiene sin guardarse hasta recargar.
6. **Sin clasificar**: si la guardia de la entrega A no reconoce la `version` (posterior o ilegible), no se clasifica
   nada; solo se apunta la visita, y la guardia de la A ya pone Horarios en solo lectura.
7. **Clasificación** (orden fijo: lectura no verificable, incluido 4b → `version` no reconocida → esta tabla):

| Fila de `horarioTop` | Testigo | ¿Testigo demostrado? | `version` | Clase | ¿Se registra algo? |
|---|---|---|---|---|---|
| Presente | **2 · Válido presente** | Indiferente | 1 | **E1 · Sin incidencia** | Se apunta `visto`, con sus `conocidas`: la primera vez, cuando cambian las `conocidas` y una vez al día |
| Presente | 3 · Ausente | No | Ausente o 1 | **E2 · Inicial** sin intenciones; **AI · Arranque incompleto** con intenciones | Nada |
| Presente | 4a · Ilegible | No | Cualquiera | **E2** o **AI** | Nada |
| Ausente | — | No | — | **E2** o **AI** | Nada |
| Presente | 3 · Ausente | **Sí** | **Ausente** | **B · Pérdida demostrable** | `perdida` / `testigo_ausente`, salvo supresión |
| Presente | 3 · Ausente | **Sí** | **1** | **C · Ambiguo** | `ambigua` / `testigo_ausente`, salvo supresión |
| Presente | 4a · Ilegible | **Sí** | Cualquiera | **B** | `perdida` / `testigo_ilegible`, salvo supresión |
| Ausente | — | **Sí** | — | **B** | `perdida` / `fila_ausente`, salvo supresión |

   - **E1 exige el concepto 2**: con un testigo demostrado antes, un `horarioTop` estructuralmente válido sin testigo es B
     sin `version` y C con `version: 1`; sin testigo demostrado, E2 o AI. Con la fila presente, todo `horarioTop` cae en
     exactamente uno de los conceptos 2, 3 o 4.
   - **AI no es una incidencia** ([ABIERTO-3]): una intención confirmada sin testigo demostrado no prueba una pérdida, no se
     registra y no bloquea Horarios; la condición 3 queda no verificable.
   - **C** ([ABIERTO-4]) significa que la última escritura fue de la A-bis, sin testigo: no se puede saber si antes escribió
     una copia antigua. Nunca se trata como inocua (C-4).
8. **Supresión** (igual para B y C): no se crea un registro nuevo si existe uno D con la misma huella (no nula) y ninguna
   fila tiene un `visto` cuyas `conocidas` incluyan D. Con huella `null`, se suprime si la fila propia tiene un registro sin
   un `visto` posterior en esa misma fila. Misma huella con el testigo visto después de D es una **repetición legítima**;
   dos registros a la vez desde dos aparatos se conservan los dos y se agrupan.
9. **Comprobar otra vez dentro de la sesión** usa la misma tabla; lo que esta sesión ha escrito y todavía no ha demostrado
   no cambia nada (sin testigo demostrado, nunca sale B ni C). **Visitas**: como mucho una por día y por versión.

#### 5. Intención y primer testigo ([ABIERTO-1] y [ABIERTO-3])

1. **En E2**, el primer guardado de la sesión pone en marcha la intención con el escritor de la guardia. Ese guardado **no
   espera** y sale sin testigo (con `version: 1`).
2. Cuando la intención se confirma (aparece al releer), los guardados siguientes llevan testigo.
3. **En AI**, como ya hay una intención confirmada, el **siguiente guardado normal lleva el testigo** directamente, sin otra
   intención.
4. Los guardados salen por la cola de siempre; si están pendientes, no bloquean nada (`docs/20` §12.12).
5. **Demostrar el testigo**: durante el arranque, después de cada guardado con testigo (con `ok`, con error o sin
   respuesta), la lectura propia de `horarioTop` se evalúa con los conceptos: concepto 2 con una `revision` de esta sesión
   (cualquiera) → `escrito`; concepto 2 con la `revision` de otra sesión o aparato → `visto`; conceptos 3 o 4a, o sin fila →
   nada, se reintenta tras el siguiente resultado de la cola; 4b o una lectura fallida → lectura no verificable. Una
   `revision` dentro de un testigo 4a no cuenta.
6. La sesión guarda en memoria las revisiones que ha escrito; **nada en el aparato** (C-84). Si termina sin demostrarlo, la
   siguiente carga lo clasifica por la tabla: E1 si el testigo está, AI si no.
7. **Fin del arranque**: en cuanto se confirma un `escrito` o un `visto`. Una sesión que empezó en E2 sigue con las reglas
   del arranque hasta que confirma su intención o su propia relectura encuentra un testigo; es lo que puede producir C.

#### 6. Estados de un registro y bloqueo de Horarios ([ABIERTO-2] y C-1)

Un registro de B o C está en **E3** (sin enviar), **E4** (enviado sin respuesta), **E5** (conflicto), **E7** (conflicto
repetido) o **E6** (confirmado en el servidor).

| Estado | ¿Bloquea Horarios? | Efecto en la B |
|---|---|---|
| E0 · Comprobación inicial | **Sí** (`guardia_comprobando`) | — |
| Lectura no verificable | **Sí** (`guardia_no_verificable`), hasta una comprobación válida | Todo no verificable |
| Registro B o C en E3, E4, E5 o E7 | **Sí** (`guardia_incidencia_sin_confirmar`). C-1: también sin conexión, con errores o respuestas inciertas | Bloquea |
| Registro B o C en E6 | No | Bloquea hasta una resolución válida |
| Episodio suprimido | No | Bloquea si su registro no está resuelto |
| E1 · Sin incidencia | No | — |
| E2 · Inicial y AI · Arranque incompleto | No | Condición 3 no verificable |
| Intención pendiente o sin confirmar | No | — |
| Guardado de `horarioTop` pendiente de sincronizar | No | — |

- El bloqueo usa el mismo solo lectura que la entrega A, con estos tres motivos nuevos, y **el motivo de la A tiene
  prioridad**.
- **Impide escrituras nuevas, pero no toca la cola**: no borra, para ni reordena `sincronizacion.js`, y solo empieza al
  cargar (E0) o desde un estado que ya bloquea.
- Cada vía lo respeta: el efecto de avisos no escribe (el aviso se envía igual); planificador, mochila, automatizaciones y
  centro de avisos no guardan; Deshacer no restaura el horario y los pasos creados durante el bloqueo no lo llevan;
  `deleteAsignatura` borra la asignatura sin tocar el horario; Estudios recibe `horarioTop = null`.
- Al cerrar la app no se confirma ni se descarta nada; al volver a abrirla, todo se reconstruye desde el servidor.

#### 7. El evaluador de la B (puro, solo lectura)

`evaluarCondicionesB` recibe `versionMinima` y `margenDias` (los dos **sin fijar**: TP-12 y la entrega B), las filas, la
lectura propia de `horarioTop` y el estado de la sesión, y devuelve las cinco condiciones del §17.2 con su motivo. Nadie
lo usa todavía para migrar: la entrega B no existe.

- **C-2**: toda C sin resolver bloquea la B por la condición 2, y la condición 3 queda no verificable mientras exista.
- **C-3**: las ambigüedades se resuelven a mano en la entrega corta, junto con las pérdidas.
- **C-4**: `version: 1` solo separa B de C; nunca permite considerar inocua una ausencia de testigo.

#### 8. Pantalla de consulta (sin acciones) — 🔎 desde E1, con las tres acciones de la entrega corta (§18.14)

«Comprobación de tus aparatos», en Horarios, con la indicación «Solo consulta: no cambia nada»: los aparatos (etiqueta,
versiones, visitas y estado), las **pérdidas (B)** y los **casos ambiguos (C)** en dos bloques, agrupados por huella y
episodio, con su `id`, motivo, aparato, fecha, evidencia y si están abiertos o resueltos (el de C dice que no se puede saber
si escribió una copia antigua); el historial de retiradas y resoluciones; las intenciones, solo como información; el estado
del testigo; y las cinco condiciones con su estado y su motivo. Los avisos de los tres motivos de bloqueo se ven en la propia
pantalla de Horarios. **Retirar y resolver van en la entrega corta obligatoria** (C-3).

#### 9. Lo que la A-bis no hace

Retirar aparatos ni resolver incidencias; nada del TP-15 ni ninguna comprobación antes de guardar; SQL, cambios del esquema
o guardar nada pendiente en el aparato; migrar; cambios en la cola; ninguna escritura automática de `horarioTop`.

#### 10. Garantías, límites y ventanas

**Garantiza**, frente al código de la app: ninguna vía se salta el escritor; nada de lo que solo crece desaparece; nada se
confirma sin releer; nada borra la prueba mientras se comprueba o mientras un registro de B o C sigue sin confirmar; una
intención nunca hace pasar la condición 3; un arranque incompleto nunca produce una incidencia; una falta de testigo con
`version: 1` nunca se trata como inocua; una C sin resolver nunca deja pasar la B.

**Solo lo cerrarán el TP-15 o una protección del servidor**:

| # | Ventana |
|---|---|
| V1 | **Arranque**: un testigo escrito sin demostrar, que una copia antigua borra antes de que nadie lo vea, se clasifica como AI y no deja rastro. La B podría empezar sin saberlo |
| V2 | Una escritura de la A-bis **con testigo** después de una copia antigua tapa su rastro por completo |
| V3 | Un registro en memoria sin confirmar, la app se cierra y otro aparato vuelve a poner el testigo antes de volver a abrir |
| V4 | Dentro de la sesión, durante el arranque, el guardado devuelve `ok` y otro aparato lo pisa antes de releer |
| V5 | Escrituras o borrados de la fila o de `horarioTop` hechos desde fuera de la app |
| V6 | **C no se resuelve con datos**: ningún dato de la guardia ordena las escrituras entre aparatos. Solo se resuelve con su decisión; el TP-15 evitaría que se produjera |
| V7 | Una pestaña abierta en E2 durante mucho tiempo puede producir C días después del arranque |

**No garantiza** que se detecte toda copia antigua, que dos aparatos no se pisen, ni lo que hagan las publicaciones
antiguas de Vercel.

#### 11. Lo que queda pendiente

- ~~**La entrega corta** (retirar y resolver, C-3) y la lista definitiva de decisiones de una resolución.~~ 🔎 **Hecha en
  E1** (§18.14): retirar, resolver con la lista cerrada `conforme` / `asumida` y reabrir (D1).
- **Los requisitos previos de la B**: el diagnóstico revisado (§12.2), el margen y la hora del servidor (TP-12),
  `versionMinima`, la confirmación en pantalla y TP-5 si aparecen ciclos con grupo.
- **El nivel 3 de la guardia** (con su autorización para montar PostgREST local) y las pruebas en Safari, el iPhone y
  Supabase alojado. 🔎 **E1**: el nivel 3 ya se ha ejecutado en local (§18.14); lo demás sigue pendiente.
- **La incidencia #5** (GitHub): el bucle de guardados de avisos del horario cerca de medianoche, **anterior a la entrega
  A**, sin corregir. La sección A-bis del recorrido usa un reloj fijo para no depender de ella. 🔎 **Corregida en E1**
  (§18.14, sin publicar; la incidencia de GitHub no se ha tocado).
- **El TP-15**, decidido y sin implementar. 🔎 **E1**: A y C construidas para `horarioTop`; B preparada y probada solo en
  local (§18.14).

### 18.14 E1: el escritor protegido de `horarioTop` y la entrega corta (2026-11-16)

> Construida con la autorización expresa de Josué del 2026-11-16, conforme al alcance definitivo y a las decisiones **D1,
> D2 (opción B), D2-bis (opción A, con sus cuatro condiciones), D3, D4 y D5**. **Commits solo locales** en
> `claude/horarios-rediseno`, sobre `c9ec0cc`: **sin push, sin PR, sin fusión, sin despliegue**, sin tocar Supabase ni datos
> reales y **sin activar la regla SQL en ningún entorno alojado**. No empieza E2 ni E3 y no cambia nada de Fitness salvo las
> dos comprobaciones de su prueba que autoriza D5. **Manda sobre los apartados anteriores donde difieran** (C-80).

#### Estado

| | |
|---|---|
| Código | `src/lib/escritorHorario.js` (nuevo: el contrato del sello, el escritor protegido y la política de conflictos); `src/lib/supabase.js` (el transporte de `horarioTop`, y `saveData` lo rechaza); `src/lib/sincronizacion.js` (la cola lo rechaza; el indicador global enseña lo pendiente del escritor con `apuntarExterno`); `src/lib/guardiaHorario.js` (la entrega corta); `src/lib/historialVersiones.js` (el motivo `conflicto`); `src/lib/avisosHorario.js` (#5); `src/lib/accionesHoyAgenda.js` (los dos avisos de Deshacer); `src/App.jsx`, `src/views/HorarioView.jsx` y `src/components/guardiaHorarioPanel.jsx` (la integración y las pantallas). `supabase/horarios-regla-revision.sql` y su vuelta atrás, **preparados y sin ejecutar** fuera del laboratorio |
| Probado | Node: `test-escritor-horario.mjs` (23 secciones), `test-escritor-horario-vista.jsx`, y las suites de la A, la A-bis, el historial, los avisos, Horario Top y la solo lectura, con sus comprobaciones dadas la vuelta donde E1 cambia lo que guardaban. Chromium: la sección A-bis actualizada y una sección **E1** nueva, con dos aparatos de verdad (dos contextos) sobre el doble de Supabase ampliado (150 comprobaciones en la ejecución aislada de las dos). **Nivel 3** en un Postgres 16 + PostgREST 12 **locales** (127.0.0.1, sin credenciales reales, desmontados al terminar): historial 34, guardia 19 y escritor 47 comprobaciones, regla incluida. D5: las dos comprobaciones de Fitness, validadas los siete días de una semana con el reloj fijado. Las cifras exactas y el `verificar.sh` de la copia limpia están en el informe de la entrega |
| Sin probar | Supabase alojado, Safari, el iPhone y dos aparatos reales (el protocolo está en el informe). La regla del servidor en un Supabase independiente (es de E2) |

#### 1. El contrato del sello (D3)

- **Una sola ruta por clave** (`RUTA_SELLO`): `horarioTop` → `testigo`; `horarioBorradores` → `sello`. La revisión es
  `value-><ruta>->>revision`, **el texto en crudo** que compara PostgREST (`campoDelSello`). Nadie escribe todavía
  `horarioBorradores`: su contrato está para cuando exista.
- `revisionDelSello` devuelve la revisión como texto, `null` si no hay sello o no tiene revisión, o **ilegible** si es algo
  que no se puede comparar igual en el cliente y en el servidor (un objeto, un decimal, un entero fuera del rango seguro):
  entonces **no se escribe nada** (L-E1-1).

#### 2. El escritor protegido (TP-15 A)

- **Lo único que escribe `horarioTop`.** `saveData` y su cola lo rechazan antes de la red (`ERROR_CLAVE_HORARIO`), igual
  que las filas de la guardia y del historial. Todas las rutas de la app (Horario, planificador, mochila, automatizaciones,
  centro de avisos, avisos, Deshacer, borrar una asignatura) llegan por `snapshotAndSave` → `guardarHorario`.
- **Toda escritura es condicional**: `update … where value->testigo->>revision = <la que vio>` (o `is null` si la vio sin
  testigo), pidiendo la fila de vuelta; la primera fila de una cuenta, `insert` simple (23505 = otro la creó antes).
- **Un envío a la vez**; lo que se pide mientras vuela sale después con la revisión nueva. **Una respuesta perdida** se
  reconoce al releer (si en la cuenta está exactamente lo enviado, es suyo): nunca se repite a ciegas.
- **Sin conexión**: el cambio queda **pendiente en memoria** (C-84: nada en el aparato) y el indicador global lo dice; al
  volver la conexión sale **con su condición**. Si otro aparato escribió entretanto, es un conflicto (abajo), nunca una
  escritura encima.
- **El testigo lo pone la guardia de la A-bis** (`prepararEscritura`): revisión nueva, `base` = la revisión que había,
  este aparato. El escritor es quien la llama.

#### 3. El conflicto (D2, opción B, y D2-bis, opción A)

- **Un cambio tuyo** (manual) que choca con el de otro aparato **no se escribe y no se pierde**: sigue en pantalla, Horarios
  pasa a solo lectura (`horario_conflicto`, con la prioridad más baja de los motivos) y el aviso «Otro aparato ha cambiado
  tu horario» dice qué ha pasado, cómo está tu cambio y ofrece **dos salidas**, ninguna que fuerce la escritura:
  - **«Ver lo que hay ahora»**: la pantalla pasa a lo de la cuenta y puedes seguir editando; tu cambio queda apartado.
  - **«Descartar mi cambio»**, con confirmación: la pantalla pasa a lo de la cuenta y su copia apartada se borra.
- **La copia apartada** va al historial de versiones del aparato (`horarioVersiones:<aparato>`) con el motivo
  **`conflicto`**, que es **no automático** (condición 1), se puede borrar a mano con confirmación (condición 2) y puede
  hacer crecer la fila unos 45 KB por conflicto manual (condición 3). Si no se puede apartar (sin conexión), la pantalla lo
  dice («si cierras la aplicación ahora, se pierde») y se reintenta al volver la conexión, desde memoria.
- **Un guardado automático** (los avisos) que choca **adopta lo de la cuenta** y se recalcula: ni conflicto ni copia
  (condición 4). Si detrás hay un cambio tuyo calculado sobre lo viejo, ese sí es un conflicto.
- 🐛 **Corregido en la auditoría global de E1**: un conflicto que se abre **fuera de Horarios** (borrar una asignatura desde
  Estudios, Deshacer sin conexión desde Ajustes) se callaba hasta abrir Horarios. Ahora sale donde está un aviso de la
  aplicación («Otro aparato ha cambiado tu horario. Tu cambio no se ha perdido: ábrelo en Horarios para elegir qué hacer.»),
  una vez por conflicto.
- **Un rechazo de la regla del servidor** (cuando se active) se trata igual que un choque: se relee y se decide; si la
  cuenta sigue con lo que vio, se reintenta y, tras dos vueltas, queda pendiente («conflicto repetido»).
- **Verificado sin conexión y al recuperarla**, en Node, en Chromium y contra el PostgREST local.

#### 4. Deshacer

- Solo reescribe el horario si **ese paso lo cambió** (comparado sin el testigo): deshacer algo de otro módulo no toca el
  horario.
- Si lo cambió, antes **mira la cuenta**: si otro aparato escribió después, **no deshace nada** (ningún módulo) y lo dice
  («tu horario cambió en otro aparato después»); si mientras miraba se guardó otro cambio, tampoco («acabas de guardar otro
  cambio»). Sin conexión no se puede saber, y decide la escritura condicional (un choque es un conflicto con tu cambio
  apartado).
- 🐛 **Corregido en la auditoría global de E1**: mirar la cuenta no basta cuando la pantalla **ya ha adoptado** lo de otro
  aparato (al volver a la pestaña, con «Ver lo que hay ahora» o en un guardado automático que choca): la cuenta está «al
  día» y Deshacer habría escrito un paso de antes encima de lo suyo. Ahora cada paso dice **si tocó el horario**
  (`tocaHorario`; un paso de antes de E1 se compara con la pantalla), y los pasos que había cuando se adoptó lo de otro
  aparato —y, al cargar, todos los guardados si lo último de la cuenta no lo escribió este aparato— **no pueden reescribir
  el horario**: Deshacer no hace nada y lo dice. Un paso que no tocó el horario se deshace sin tocarlo. Es conservador:
  después de recargar, si el último en escribir fue otro aparato, no se deshace un cambio del horario aunque fuera suyo.

#### 5. Releer al volver (TP-15 C)

Al volver la pestaña a primer plano (`visibilitychange`) y al recuperar la conexión (`online`): si no hay nada tuyo sin
guardar, se lee la cuenta y la pantalla enseña lo de ahora **sin escribir nada**; si hay algo pendiente, sale con su
condición; con un conflicto abierto, se reintenta apartar la copia.

#### 6. La incidencia #5, corregida

`registrarEnviado` apunta las claves que incluye un resumen de avisos y **devuelve el mismo objeto** si no cambia nada, y
`HorarioView` solo guarda si el estado cambió, marcado como **automático**. Con el código de antes, tres clases entre las
00:00 y las 00:03 consultadas a las 00:05 daban 6 y 6 guardados en bucle; ahora, uno. (La incidencia de GitHub no se ha
tocado: es una acción externa.)

#### 7. La entrega corta (D1, lista cerrada)

En «Comprobación de tus aparatos», cada una con su confirmación y escrita por el escritor condicional de la guardia:

- **Retirar** un aparato: con el motivo `sin_uso`, `reinstalada` o `no_reconocido`; nunca este aparato; solo si su fila se
  puede leer y no tiene visitas en 30 días. La retirada apunta la secuencia vista y **se anula sola** si esa secuencia
  cambia (el aparato vuelve a usarse). No toca la fila retirada.
- **Resolver** avisos abiertos concretos (por su `id`) con la decisión `conforme` («Revisado: el horario está bien») o
  `asumida` («Acepto lo que hay, aunque falte algo»). Exige el **concepto 2 ahora** (un testigo válido presente) y escribe un
  `visto` en la misma operación. No cambia nada del horario.
- **Reabrir** una resolución: anula **esa** resolución por su `anula`, y sus avisos vuelven a quedar abiertos.
- `restaurada` queda **reservada para E3**. Una pantalla sin las acciones sigue siendo solo consulta.

#### 8. La regla del servidor (TP-15 B): preparada, sin activar

`supabase/horarios-regla-revision.sql` (y `…-deshacer.sql`): un disparador sobre `app_data` que, para `authenticated` y
`anon`, deja insertar la primera fila, deja actualizar sin testigo antes ni después (arranque) o con un testigo **nuevo** cuya
`base` es la revisión que había, y **rechaza** quitar el testigo, repetir la revisión, una `base` que no es la que había y
borrar la fila, con `P0001` / `horario_revision_obsoleta`. Lo del propietario (el borrado en cascada de una cuenta, el
editor SQL) no pasa por ella. **Solo se ha ejecutado en el laboratorio local**: allí para el upsert ciego de una copia
antigua, el `update` sin condición y el borrado, deja pasar al escritor de E1 y se quita entera con su vuelta atrás.
Activarla en un entorno alojado es de E2 y lo autoriza Josué.

#### 9. Limitaciones

| | |
|---|---|
| **L-E1-1** | Una revisión que no se puede comparar igual en los dos lados (un objeto, un decimal) **bloquea la escritura** (estado `bloqueado`, con su frase): no se guarda nada, ni se pierde lo que hay. No la produce la app |
| **L-E1-2** | Un guardado que lleva el horario **y otras claves** (borrar una asignatura con clases en el horario) guarda las otras claves como siempre; si la parte del horario choca, **se aparta** como cualquier cambio tuyo. 🔎 **Se desvía de la frase «se guarda entero o se retiene entero»** del plan: sigue el precedente de la entrega A con `deleteAsignatura` en solo lectura |
| **Arranque** | En una cuenta sin testigo todavía, la primera escritura se condiciona con `is null`, que es más débil: cualquiera que vea la fila sin testigo puede escribir. La cuenta real ya está en E1 |
| **Copias antiguas** | Hasta que se active la regla (E2), una copia de la app anterior a E1 **todavía puede pisar** el horario con su upsert ciego. E1 lo detecta (la guardia) pero no lo impide |
| **Ventanas de la A-bis** (§18.13 §10) | V4 (un guardado pisado antes de releer) **se cierra** con la escritura condicional; V2 y V5 siguen abiertas hasta la regla del servidor |

#### 10. Lo que queda pendiente

- Probar en Supabase alojado, Safari, el iPhone y con dos aparatos reales (el protocolo de la entrega).
- **E2**: activar la regla en un Supabase independiente y después en producción, con su autorización; y **E3**
  (`restaurada`).
- Lo que ya estaba pendiente del §18.13 que E1 no toca: los requisitos previos de la B (TP-12, `versionMinima`, el
  diagnóstico revisado), el TP-16 para el respaldo y la escritura de `horarioBorradores`.

---

*Fase 2 de 8 terminada, con la revisión documental del 2026-11-08, las correcciones del 2026-11-09, el cierre documental
previo a la Fase 4 (§18.12), la decisión del TP-15 (2026-11-10) y la sincronización con la entrega A y la A-bis implementadas
(§18.13, 2026-11-15) y la entrega E1 (§18.14, 2026-11-16, commits locales). Esta documentación no autoriza la entrega B
ni ninguna instalación, migración, SQL alojado, publicación, despliegue o cambio de datos.*
