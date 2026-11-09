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
18. Correcciones del 2026-11-09 (versiones manuales, TP-5/TP-7, funciones que se conservan, colores al exportar, «Cada dos semanas», conservación de versiones, coherencia, TP-18 resuelta, versiones eliminadas entre aparatos —sin nada pendiente en el aparato y con escritura condicional— y la regla definitiva del autoguardado)

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
| **D-H4** | La especificación HT es documentación histórica cuando contradiga el Documento Maestro | Donde `docs/17` y `ESPECIFICACION_HORARIO_TOP.md` choquen, manda `docs/17`. La especificación HT **no se edita** (es literal). Queda **pendiente de anotar en `docs/03`** cuando se autorice tocar ese documento (§15) |
| **D-H5** | Diagnóstico de datos reales exclusivamente de lectura antes de la Fase 4 | §12.2: `diagnosticoHorarios(crudo)` es pura y **no escribe**. La forma de llevarla a sus datos (un despliegue o un `select` que él ejecute) necesita su autorización, y es la **condición de entrada de la migración** |
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
> - `horarioAparatos` y `horarioGuardia` (17.2).
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
>   - No va a la papelera (la papelera guarda horarios). Es un borrado que pide él, no una poda: **TP-13 sigue intacto**.
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

**Cómo se lleva a sus datos** [PENDIENTE, lo autoriza él], dos opciones:
1. **Un despliegue con un panel de diagnóstico** (solo lectura) que enseñe esos recuentos en su iPhone. Necesita
   autorizar un despliegue.
2. **Un `select` de solo lectura** que él ejecute en el SQL Editor de Supabase y cuyo resultado pegue. Necesita su
   autorización, aunque no modifica nada. Por ejemplo, el tamaño y los recuentos de `value -> 'horarios'`, `'bloques'` y
   `'excepciones'` de la fila `key = 'horarioTop'`. El texto exacto se le dará cuando lo autorice.

**Sin diagnóstico no se activa la migración.** Es la condición de entrada.

### 12.3 La guardia de versión, en dos entregas (N1, N2, N6)

**Entrega A** (el inicio de la Fase 4, sin cambiar todavía la forma de los datos):
- El normalizador **conserva lo desconocido**.
- **Guardia**: si `horarioTop.version` es mayor que la que conoce la app, se pone en **solo lectura**, no guarda y lo
  dice, como `fitnessSoloLectura`.
- El diagnóstico.
- La hoja `fechasSemana.js`.

Desde esa entrega, ninguna copia de la app puede borrar campos nuevos.

**Entrega B** (después, con margen para que su iPhone y sus pestañas hayan recargado la A):
- La versión 2 de verdad: migración, campos nuevos, borradores, versiones y papelera.

> 🔎 **Revisión 2026-11-08**: esperar un margen **no garantiza** que no quede una copia antigua. Las señales que deja la A
> (testigo, registro de aparatos, registro de la guardia), las cinco condiciones para que la B migre, entre ellas la
> confirmación de Josué, y la recuperación si una copia antigua escribe después están en el **§17.2**.

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

1. Él autoriza el diagnóstico y lo ve. Si aparecen casos raros (ciclos, columnas sin día, choques), se le enseñan antes.
2. Entrega A desplegada y en uso unos días.
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
| **TP-4** | Cómo llevar el diagnóstico a sus datos: un despliegue o un `select` (D-H5) | La opción que él prefiera; sin diagnóstico no hay migración | **Josué**, antes de la Fase 4 |
| **TP-5** | Si el diagnóstico encuentra **ciclos con grupo**: aplicar el ciclo cambia lo que ve | Enseñárselo y preguntar antes de la entrega B. **Pendiente de Josué; no se implementa ninguna opción sin preguntarle** (§17.6). 🔎 **2026-11-09**: mientras esté pendiente, **ninguna pantalla muestra controles de semanas A/B**; la configuración del ciclo se conserva en los datos y en el diseño, inactiva (§18) | **Josué**, si aparece |
| **TP-6** | «Corregir desde el principio» (cambiar también el pasado) como cuarto alcance | **No añadirlo** (Anexo §5 fija tres); el pasado se conserva (§4.2) | Fase 3 (si en la interfaz hiciera falta) |
| **TP-7** | Una actividad vinculada a Fitness en un día de descanso: cómo se ve en Horarios y si cuenta en «N eventos» de Inicio | 🔎 **2026-11-09: ninguna opción aprobada**, ni la visual ni la de Inicio. **En Horarios**: (A) verse atenuada con «Descanso según tu plan»; o (B) verse igual que cualquier día, con el título que dé Fitness («Descanso»). **En Inicio**: contarla, no contarla o contarla con otra etiqueta. En todos los casos sigue contando en las coincidencias, porque sus horas son suyas. **Pendiente de Josué; no se implementa ninguna sin preguntarle** (§17.6) | **Josué** |
| **TP-8** | La escritura condicional en el servidor contra copias antiguas | Fuera de este rediseño; el riesgo queda mitigado por la guardia, el respaldo y las versiones aparte | Fase pendiente de Josué (SQL) |
| **TP-9** | Anotar en `docs/03` D-H4 y las decisiones de esta fase | Cuando se autorice modificar ese documento (el prompt de la Fase 2 solo autoriza crear documentación) | Fase 4 o la que se autorice |
| **TP-10** | C9: restaurar una asignatura no devuelve sus clases | Fuera del alcance de Horarios (es de la papelera de Estudios); anotarlo | Josué |
| **TP-11** | Las opciones de `tesseract.js` 7 para servir sus archivos desde la app, y la velocidad en su iPhone | Comprobarlo al empezar la Fase 5; la instalación necesita autorización | Fase 5 |
| **TP-12** | El margen entre la entrega A y la B | Al menos unos días de uso real de la A, **más las condiciones del §17.2**: el margen solo no basta | Fase 4 |

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
propósito donde sí la toca):

1. **El testigo en `horarioTop`**:
   - La A escribe `version: 1` y `testigo: { desde, ultimaEscritura }` en cada guardado.
   - Una copia anterior a la A, al guardar, **los borra** (N1). Esa ausencia es la huella de que una copia antigua escribió.
2. **El registro de aparatos**, en la clave nueva `horarioAparatos`:
   - Cada copia A o posterior apunta, como mucho una vez al día al cargar: un id del aparato (aleatorio, en `localStorage`),
     una etiqueta legible, la **versión de la aplicación** (la de `package.json`, inyectada al compilar) y cuándo se vio.
   - No guarda nada personal más.
3. **El registro de la guardia**, en la clave nueva `horarioGuardia`:
   - Cuándo se vio la A por primera vez.
   - Y **cada vez que una copia A encuentra el testigo borrado**: la fecha y la conclusión «una copia antigua escribió
     aquí».

**Condiciones para que la B migre** (las comprueba la propia B al cargar; si falta alguna, **no migra** y sigue
funcionando como la A):

| # | Condición | Qué demuestra |
|---|---|---|
| 1 | `horarioGuardia` existe y la A se vio por primera vez hace al menos el margen acordado (TP-12) | Que la A llegó a ejecutarse |
| 2 | **Ningún testigo borrado** en ese margen (`horarioGuardia` sin detecciones) | Que en ese tiempo no escribió ninguna copia antigua. Es la única señal real sobre las copias antiguas |
| 3 | El testigo está presente ahora | Lo mismo, en el momento de migrar |
| 4 | Todos los aparatos de `horarioAparatos` vistos en los últimos 30 días llevan la A o posterior | Que no hay aparatos conocidos con una copia intermedia |
| 5 | **Confirmación de Josué en pantalla**: la B enseña la lista de aparatos con su última visita y le pide cerrar JosStyle en los demás (en el iPhone, deslizarla fuera del selector de apps) y abrirla una vez en cada uno | Lo que ninguna señal puede comprobar: pestañas o aparatos que no han escrito ni se han registrado |

**Después de migrar** (la B no se fía solo de las condiciones):
- Si `horarioTop` llega **sin `version: 2`** y `horarioVersiones` o `horarioGuardia` dicen que ya se migró, **una copia
  antigua escribió encima**.
- Entonces la B:
  1. **No guarda nada de Horarios** (solo lectura, como `fitnessSoloLectura`).
  2. Lo dice.
  3. Ofrece dos salidas, **sin elegir por él**:
     - «Recuperar la última versión (las HH:MM del día X): se perdería lo que se hizo en la copia antigua».
     - «Quedarme con lo que hay ahora y volver a actualizarlo»: se migra lo que hay, sin los campos nuevos que la copia
       antigua borró, y estos se pueden recuperar uno a uno desde la versión.

**Un aviso de versión nueva para el futuro** [PENDIENTE, TP-14]:
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
| **TP-13** | Cualquier poda o borrado automático: `completadas`, `mochila`, choques resueltos, versiones, avisos enviados, cuarentena | Conservar todo y avisar a partir de un umbral (lo propuesto); o una poda concreta por lista y antigüedad | **Josué** |
| **TP-14** | Aviso de versión nueva para toda la aplicación (`version.json`) | Añadirlo con la entrega A; o no | **Josué** (afecta a toda la app) |
| **TP-15** | Protección real entre aparatos: el token sin SQL (A) o la versión en el servidor con SQL (B) | A, comprobada antes contra Supabase con autorización; B, con su SQL; o ninguna, y quedarse con la detección y la recuperación | **Josué** |
| **TP-16** | Pedir `updated_at` en la carga (para el respaldo y para la opción A del TP-15) | Ampliar `loadData` para Horarios | Fase 4 |
| **TP-17** | Las claves nuevas `horarioAparatos`, `horarioGuardia` y `horarioCuarentena` (misma tabla, mismas políticas, sin SQL). 🔎 Y los registros `horarioVersiones:<aparato>` (§18.9, 2026-11-09) | Como se describen en 17.2, 17.5 y 18.9 | Fase 4 |
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

TP-1, TP-3, TP-4, TP-5, TP-7, TP-13, TP-14 y TP-15 siguen sin resolver.
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

**Comprobado sin contradicciones**:
- D-H3 se respeta: Calendario e Inicio sin accesos nuevos (§18.4, `docs/20` §2.1).
- TP-1, TP-3, TP-4, TP-5, TP-7, TP-13, TP-14 y TP-15 siguen pendientes (§15, `docs/20` §12.13). TP-18 se planteó en esta
  revisión y Josué la resolvió el mismo día.
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

> 🔎 **Cerrado el 2026-11-09 con la decisión definitiva de Josué**: **no se guarda en el aparato nada pendiente de
> sincronizar, tampoco en Horarios**. MS F16 se cumple sin excepciones.
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
| **C · Marcas + un registro por aparato + escritura condicional sobre la última operación** | Cada fila tiene un solo escritor. Una escritura vieja, repetida o de un clon **no se aplica**. Sin SQL ni dependencias, y sin guardar nada pendiente en el aparato | Depende de que la escritura condicional funcione en Supabase como se describe: **sin comprobar** (ver «Pruebas») |
| **D · Versión en el servidor con SQL** (TP-15 B) | El servidor rechaza cualquier escritura vieja, venga de donde venga | Necesita SQL de Josué. TP-15 sigue pendiente |

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
| `aparato` | `crypto.randomUUID()` la primera vez (Safari 15.4+). El mismo id que usa `horarioAparatos` (§17.2). **No se usa `uid()`**: son 8 caracteres de `Math.random`, demasiado pocos para esto | Id nuevo y fila nueva. La vieja se sigue leyendo |
| `confirmada` | `{ opId, n }` de la última operación de este aparato **confirmada al releer** | Al escribir no se puede reconocer la fila como propia: se cambia de id (es seguro) |
| `sesiones` | Los ids de sesión de esta instalación (uno por apertura de la app o pestaña), con un tope (las últimas 200) | Igual: una operación propia de antes se toma por ajena y se cambia de id (seguro). Recortar la lista tiene el mismo efecto |

**En memoria** (MS F16 lo permite): la operación que se está intentando, con su `opId`, mientras la pantalla la enseña.
Sirve para **reintentarla con el mismo `opId`**. Al cerrar la app desaparece: no se reintenta sola nunca.

#### Cómo se escribe una operación

1. Él pulsa (crear una versión, eliminar una manual con `confirmado` o renombrarla). Se crea un `opId` nuevo.
2. Se toma el candado `navigator.locks` de las versiones. Sin él, no se escribe y se dice por qué.
3. Se **lee la fila propia** y se comprueba la identidad (ver la tabla de abajo). Si hay duda, se cambia de id antes de
   seguir.
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
    - Si dos copias del mismo `opId` no son idénticas (no debería pasar), no se elige una en silencio: se enseñan las dos y
      «Revisión» lo avisa.
  - Las versiones de todas las filas, menos las que tengan una marca en cualquier fila. Una marca sobre una automática se
    ignora y se avisa en «Revisión».
  - El nombre de cada versión es el último de su cadena de renombres (`sustituye`). Dos renombres que sustituyen al mismo
    son un conflicto que él elige.
- Si la lectura falla, **no se enseña una lista a medias** y no se escribe nada.

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
- Se puede probar la misma condición con `updated_at` por igualdad (TP-15 A), con su misma comprobación.
- Si tampoco funciona, **no se implanta el historial entre aparatos con C**.
  - Las versiones seguirían en el registro de cada aparato.
  - Una escritura de un clon o una tardía **podría pisar la fila propia**, y se dice. No se promete nada que no se pueda
    cumplir.
  - La solución completa sería D (SQL, TP-15 B), que decide Josué.

#### Pruebas (sin tocar Supabase real ni ejecutar SQL)

| Nivel | Qué comprueba | Qué no | Qué hace falta |
|---|---|---|---|
| **1 · Node, con un doble en memoria** que imita PostgREST: `update` con filtro y número de filas, `insert` con clave primaria, `like` | La lógica: identidad, `opId`, `base`, reintentos, respuestas perdidas simuladas, dos «aparatos» y dos «pestañas» intercalados, una fila de un clon, la vista con marcas, que `saveData` rechaza estas claves | Que Supabase se comporte igual que el doble | Nada: es código de la Fase 4 |
| **2 · Chromium** (el recorrido), con el doble de Supabase de `test-app-real.mjs` y dos contextos de navegador | Web Locks entre pestañas, cortes de red, la pantalla diciendo «sin confirmar», que una eliminada no vuelve tras reconectar | Supabase real | Nada nuevo: ya existe el doble |
| **3 · Postgres y PostgREST locales** (por ejemplo, `supabase start` con Docker), con la tabla y las políticas de `schema.sql` en esa base local | **La condición de verdad**: `value->>` por igualdad, el número de filas devuelto, el `insert` duplicado, `like` con RLS y dos clientes compitiendo | Las cuotas y tiempos del servicio alojado | **Instalar herramientas** (Supabase CLI o Postgres y PostgREST, y Docker): necesita autorización expresa. No toca producción |
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
- **Pendiente de implementar**:
  - La lectura por prefijo y el escritor condicional.
  - Que `saveData` rechace estas claves.
  - El id con `crypto.randomUUID`, `confirmada`, `sesiones` y la tabla de identidad, que es **orientativa**.
  - La vista fusionada y los avisos.
- **Pendiente de probar**:
  - La condición en PostgREST, solo en los niveles 3 o 4 y con autorización.
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
| **MS F16, sin excepciones** (decisión de Josué, 2026-11-09) | Nada pendiente se guarda en el aparato: ni versiones, ni marcas, ni borradores. En el aparato solo hay identificadores y lo ya confirmado (§18.9). `docs/20` §11.2 y §12.12 decían que un borrador sin guardar «sigue en este aparato»: corregido a «en memoria, mientras la app siga abierta» |

**Decisiones pendientes**: TP-1, TP-3, TP-4, TP-5, TP-7, TP-13, TP-14 y TP-15. TP-18 está resuelta.

---

*Fase 2 de 8 terminada, con la revisión documental del 2026-11-08 y las correcciones del 2026-11-09. Solo documentación:
no autoriza la Fase 4 ni ninguna instalación, migración, SQL, despliegue o cambio de datos.*
