# 20 · Horarios — Diseño de interfaz y experiencia de usuario (Fase 3 de 8)

> **Fase 3 del rediseño de Horarios. Solo diseño.** No se ha implementado ninguna pantalla, ni tocado el motor, los datos,
> Supabase ni las dependencias. No hay commits, push, merge ni despliegue.
>
> Referencias obligatorias:
> - **`docs/17`**: el objetivo funcional. Su Anexo prevalece.
> - **`docs/18`**: la auditoría.
> - **`docs/19`**: la arquitectura. **Su §17 prevalece** donde haya diferencias.
>
> Las decisiones pendientes de Josué (TP-1, TP-3, TP-4, TP-5, TP-7, TP-13, TP-14 y TP-15) **siguen pendientes**: el diseño
> enseña qué cambia según la respuesta, pero no decide ninguna (§12.13).
>
> Fecha: 2026-11-08 · Rama `claude/horarios-rediseno` · Base `bf9bb46`.

**Cómo leer los esquemas**: son de texto, para que se lean en el móvil. `[ … ]` es un botón, `( … )` una opción elegible,
`▸` un plegable y `⋯` un menú secundario. Las medidas son orientativas: las exactas salen de la escala de JosStyle (§0.3).

**Prototipo visual aislado**: hay capturas de un prototipo estático, fuera del repositorio y sin tocar la aplicación,
hechas con el navegador de pruebas que ya existe (§17).

---

## Índice

0. Auditoría visual previa
1. Principios visuales
2. Navegación
3. Vista móvil
4. Vista escritorio
5. Agenda diaria
6. Agenda semanal
7. Mis horarios
8. Creación de horarios
9. Detalle de actividad
10. Conflictos
11. Borradores y versiones
12. Estados especiales
13. Componentes reutilizables
14. Jerarquía de acciones
15. Accesibilidad
16. Criterios de aceptación
17. Prototipo y comprobaciones

---

## 0. Auditoría visual previa

### 0.1 Horarios hoy [CÓDIGO, `docs/18` §9]

| Aspecto | Hoy | Qué hacer |
|---|---|---|
| Entrada | Una sola pantalla con pestañas **Hoy · Semana · Día · Agenda**, más un botón **Hoy** aparte | Dos apartados (Horario y Mis horarios) y dos vistas (Día y Semana) |
| Vista Hoy | Panel cargado: ahora, siguiente, el día, pendiente, dos mochilas, tablón, automatizaciones, plan, avisos e informe; modos «Lo justo» y «Todo» | El día primero; lo demás, plegado o en el menú de herramientas (§5.4). Nada se pierde |
| Semana | Rejilla por **franjas** con desplazamiento horizontal (columnas de 92 px con más de 5 días) | Por **horas y proporcional**; en el móvil, en vertical (§6) |
| Edición | «Editar horario», modo edición, menú ⋮ de columna, «Franjas», «Opciones avanzadas» | Un borrador con un editor claro (§11); sin «columna» a la vista. Las franjas **se conservan** como herramienta del editor («Franjas horarias», §5.4, corrección 2026-11-09), pero ya no deciden dónde se pinta una actividad |
| Horas | Texto libre en franjas y bloques; `type="time"` solo al generar franjas | Siempre el campo de hora del sistema |
| Texto | 92 usos de `text-[11px]`, 52 de `text-[10px]` y 3 de `text-[9px]` | **Mínimo 12 px** en lo que se lee (§15) |
| Toques | El ⋮ de columna con `p-0.5` | 44 px de zona táctil (`toque-44`, EH F42) |
| Accesibilidad | `aria-label` en celdas y bloques; los choques llevan icono y palabra | **Se conserva** y se amplía |
| Choques | «⚠ Choque» en la celda; «Ponerlo igualmente» | Lenguaje sereno («Coincide con…»); el bloqueo, sin forzar (§10) |

### 0.2 Componentes de JosStyle que se reutilizan (comprobados en el código)

- **`ui.jsx`**: `Card`, `SectionTitle`, `PrimaryButton` y `GhostBtn` (con `estado="cargando"`), `ToggleTab`, `Switch` y
  `PistaInterruptor`, `Field`, `TextInput`, `Textarea`, `Select`, `SelectInput`, `MensajeDeCampo`, `EmptyHint`, `Esqueleto`,
  `BotonBorrar`, `ListRow` y `TextoDeBoton`.
- **`quickAdd.jsx`**: `BotonAnadir`, `MenuElemento` (el `⋯` de un elemento), `CambiarFecha`, `CambiarHora` y `AvisoAccion`
  (el aviso con «Deshacer»).
- **Movimiento** (`motion.jsx`, `layoutMotion.jsx`, `gestosMotion.jsx`): `Presencia`, `CambioDeContenido`,
  `ChevronDespliegue`, `IconoQueCambia`, `Plegable`, `ListaAnimada` (con `data-flip-id`), `AsaHoja` y
  `useDeslizarParaCambiar`.
- **Capas y diálogos**: `useCapasMotion` (en App.jsx, gobierna las ventanas), `CAPAS` (`tokens.js`: velo y escenario) y
  `useDialogoAccesible`.
- **Estados**: `VacioQueLlega` / `useVacioQueLlega`, `IndicadorDeSincronizacion` (arriba, en App.jsx), `AvisoDeEspera`,
  `GiroDeCarga` (con texto) y `AnuncioDeNavegacion`.
- **Otros**: `SelectorDeArchivos` (P1; sin menú propio delante); `asistenteChat.jsx` (`BotonAsistente`, `HojaAsistente`,
  `ConversacionAsistente`) para el Asistente (Fase 6); `continuidad.jsx` (`Compartido`, `apuntarOrigen`) para que el
  detalle salga de la actividad tocada.
- **No se reutilizan**: `piezasFitness.jsx` (`PastillaFiltro`, `OpcionSegmentada`, `BotonCerrarHoja`). Son de Fitness **a
  propósito** (FIT F42: no son de `ui.jsx`). Donde haga falta, se usa `ToggleTab` o el patrón de `ui.jsx`.

### 0.3 Sistema visual que se respeta

| Elemento | Regla de JosStyle |
|---|---|
| Colores | `COLORS` de `tokens.js` (singleton mutable, temas claro, oscuro y alto contraste, más el acento del usuario). **Ni un hex suelto** (regla 2). Las capas fijas, de `CAPAS` |
| Tipografía | **Manrope** para títulos (600–800) e **Inter** para el texto (400–600), las mismas de `index.css`. Cifras tabulares en horas y relojes |
| Tamaños | 18 px para el título de sección (`SectionTitle`), 14 px para el texto, **12 px como mínimo** para lo secundario, y 14 px en los campos (C-32 resuelta: no hace zoom en su iPhone) |
| Espacios | Pasos de 4 px |
| Bordes y tarjetas | `rounded-xl` en tarjetas, `rounded-lg` en elementos interiores y `rounded-full` en pastillas. Borde `COLORS.border` y superficie `surface` / `surface2` |
| Ventanas | Portal sobre `document.body`, `fixed inset-0 z-capa`, velo `CAPAS.veloHoja` y `AsaHoja` en las que salen por abajo (regla 3, MS F6, MS F5). **En el móvil, una hoja; desde `sm`, una ventana** (el único corte de movimiento, MS F15) |
| Áreas seguras | `pantalla-segura`, `accion-superior`, `velo-pie-seguro`, `caja-cabe` y `toque-44` (E3 F1, MS F15) |
| Movimiento | El Motion System **sellado**: ninguna pantalla escribe el suyo |
| Navegación | La pila de `navegacion.js` (NAVO F1): «← Volver» lleva de donde vino |

### 0.4 Patrones que se conservan y complejidad que se quita

**Se conservan**:
- La agenda que se deriva sin copiar nada.
- Los colores de las actividades.
- La marca «cambiado» en un día con excepción.
- Los `aria-label` de los bloques.
- La mochila de hoy y de mañana.
- La ficha de actividad (profesor, aula y notas).
- Archivar y restaurar.
- La copia JSON.
- La densidad y el zoom por aparato.
- El tablón, las automatizaciones, el plan, el centro de avisos y el informe.

**Se quita**:
- La pestaña **Hoy** duplicada con el botón **Hoy**.
- Las palabras «columna», «modo edición» y «Opciones avanzadas». «Franja» solo se usa en el nombre de su herramienta,
  «Franjas horarias», nunca para explicar la agenda (corrección 2026-11-09). **Ninguna función de «Opciones avanzadas»
  desaparece**: cada una tiene su sitio en §5.4.
- «Ponerlo igualmente».
- Las celdas casi invisibles (opacidad 0,35).
- Los textos de 9–11 px.
- El borrado de columna durante el pintado (C3).
- El borrado propio que dejaba excepciones huérfanas (C2).

---

## 1. Principios visuales

1. **Potencia por dentro, sencillez por fuera.** Cada pantalla enseña lo que se usa a diario. Lo avanzado está **a un toque**
   (un `⋯` o un `▸ Más opciones`), nunca a la vista de forma permanente.
2. **Una acción principal por pantalla**, con `PrimaryButton`. El resto, `GhostBtn` o dentro del `⋯`.
3. **Consultar y administrar no se mezclan.** En **Horario** se mira y se hacen los cambios de un día. En **Mis horarios** se
   crea y se administra.
4. **Lo que se ve es lo que hay.** Una actividad de 11:00 a 13:00 es **un** bloque de dos horas de alto. Nada se parte, nada
   se esconde para ahorrar sitio, y nada se pinta sin acción detrás (regla 8).
5. **El color nunca va solo.** La procedencia y los estados llevan siempre **palabra o icono** además del color.
6. **Lenguaje de todos los días.**

   | Se dice | No se dice |
   |---|---|
   | «Coincide con…» | «Conflicto» o «Choque» |
   | «Borrador» | «Draft» |
   | «Desactivado» | «`activo: false`» |
   | «Elegir día» | «Columna» |
   | Actividad | Franja o bloque |

7. **Serenidad.**
   - Ni rojos de alarma ni signos de exclamación.
   - El rojo (`danger`) solo para lo destructivo, y nunca encoge al pulsar (`toque-destructivo`).
   - Lo que se bloquea se explica con una frase y una salida.
8. **Coherencia total con JosStyle**: sus componentes, sus tokens y su movimiento. Ningún sistema visual nuevo.

---

## 2. Navegación

### 2.1 Mapa

```
Gestión ─▶ Organización (hub)
              ├─ Tareas
              ├─ Calendario
              ├─ Horario ──────────────┐   (la agenda conjunta: consultar y cambios de un día)
              └─ Mis horarios ─────────┤   (administrar: crear, editar, activar, archivar, recuperar)
                                        │
   Horario ⇄ Mis horarios  (cada una tiene un acceso directo a la otra en su cabecera)
   Mis horarios ─▶ Crear un horario ─▶ (Asistente | Crear a mano | Importar) ─▶ Editor del borrador ─▶ Revisar y guardar
   Mis horarios ─▶ un horario ─▶ (Ver solo este | Editar → Editor del borrador | ⋯)
   Horario ─▶ tocar una actividad ─▶ Detalle (hoja) ─▶ (Cambiar este día | Editar la actividad → Editor del borrador)
```

> 🔎 **Corrección 2026-11-09 (D-H3)**: se retiran los dos accesos que este mapa añadía desde fuera de Horarios.
> - **Calendario**: las clases del día **siguen sin poder tocarse**, como hoy (solo las tareas tienen menú).
> - **Inicio**: la tarjeta de Hoy **sigue llevando al Calendario, vista día** («Ver todas»), como hoy.
>
> Calendario e Inicio se quedan **exactamente** como funcionan ahora. Lo único que reciben es la misma lectura de la agenda
> conjunta que ya tienen (`docs/19` §8.4 y §8.5).

**Reglas:**
- **Dos apartados en el hub de Organización**: «Horario» (el id actual `horario`, que conserva los enlaces del buscador, la
  pila y los accesos de siempre) y «**Mis horarios**» (id nuevo).
  - Son dos líneas del catálogo `APPS_ORGANIZACION`, la lista única de D2-07: no una cuarta lista.
  - Su línea de resumen en el hub: «3 clases hoy» y «2 activos · 1 borrador».
- **«← Volver» lleva a donde se estaba** (la pila de NAVO F1). Desde el editor, si hay cambios sin guardar, vuelve **sin
  perderlos**: el borrador ya está guardado (§11.2).
- **Sin pestañas nuevas en la barra inferior**: siguen siendo cinco (regla 10).
- **El botón de atrás del sistema**: sigue declarado como C-53 (sin `history.pushState`, lo decide Josué). El diseño no lo
  da por resuelto.

### 2.2 Cabeceras

```
Horario                                   Mis horarios
┌───────────────────────────────────┐     ┌───────────────────────────────────┐
│ ← Organización        Mis horarios ⋯│     │ ← Organización          Agenda  ⋯ │
│ Horario                           │     │ Mis horarios                      │
│ Lunes 9 de noviembre    [Hoy]     │     │ 2 activos                          │
│ (Día) (Semana)        ‹  ›        │     │ [+ Crear un horario]               │
└───────────────────────────────────┘     └───────────────────────────────────┘
```

- **Horario**:
  - El `⋯` lleva a las herramientas (§5.4): exportar, avisos, informe, plan de estudio, organizar, vista e intervalo.
  - `[Hoy]` solo aparece **si no se está viendo hoy**: un botón que no hace nada sería decorativo.
- **Mis horarios**: el `⋯` lleva a «Revisión» (si hay algo que revisar), «Copiar todos» y «Pegar una copia» (la copia JSON
  que ya existe).

---

## 3. Vista móvil (prioritaria)

**Por debajo de `lg` (1024 px)** se entra en **Día**; desde `lg`, en **Semana**. La elección del usuario se recuerda **por
aparato** en `localStorage`, como la densidad y el zoom (HT F4), nunca en `app_data`.

| Necesidad | Solución |
|---|---|
| Ver claramente las actividades del día | Una línea de tiempo vertical **proporcional** a la duración (§5.2) |
| Cambiar de día rápido | Botones `‹` `›` de 44 px. **Además**, deslizar en horizontal la línea de tiempo (`useDeslizarParaCambiar`, `touch-action: pan-y`). El gesto es un atajo; los botones son la forma principal (EH F50) |
| Saber la fecha | «Lunes 9 de noviembre», y «Hoy · …» o «Mañana · …» cuando lo es |
| Volver a hoy | `[Hoy]`, visible solo fuera de hoy |
| Ir a una fecha concreta | Tocar la fecha abre el selector de fecha del sistema (`CambiarFecha`) |
| Saber de qué horario es cada actividad | La **chapa** de procedencia (§5.3), solo si hay más de un horario activo |
| Ir a la semana | `(Semana)` en `ToggleTab` |
| Semana sin desplazamiento horizontal | En vertical, día por día, con un mapa de la semana arriba (§6.2) |

**Al cambiar de día** se usa `CambioDeContenido` (un fundido del contenido, sin rehacer la página, MS F2). Al volver de un
detalle, el desplazamiento se queda donde estaba (MS F2, `useNavegacionEnLaPagina`).

---

## 4. Vista escritorio

- **Semana de lunes a domingo**: siete columnas de igual ancho y una columna de horas fija a la izquierda, que se mantiene
  al desplazarse. 🔎 **El orden es fijo** (TP-18 resuelta, 2026-11-09): no hay ningún control para reordenar los días, ni
  aquí ni en el móvil.
- **Rango de horas**:
  - Por defecto, de la primera a la última actividad de la semana, con media hora de margen.
  - Se puede cambiar en `⋯ → Vista` (`horario.vista.desde` y `hasta`, que es la configuración de visualización de
    `docs/19` §2.3).
  - **Una actividad fuera del rango nunca desaparece**: el rango se amplía solo para incluirla. Esto arregla P3.
- **Proporción**: altura = duración × escala.
  - La escala depende del **intervalo** elegido (15, 30 o 60 minutos, «el selector de intervalos que ya existe»).
  - Las líneas de guía se dibujan cada intervalo; las de hora en punto, más marcadas.
- **Varias actividades a la vez en el mismo día**: se reparten el ancho de la columna (dos mitades, tres tercios), con la
  marca de coincidencia (§10).
- **Procedencia**: la chapa del horario en cada bloque, más una **leyenda** arriba («Instituto · Conservatorio ·
  Entrenamiento», cada uno con su marca).
  - La leyenda **no es un filtro**: filtrar se confundiría con desactivar un horario.
  - Para ver uno solo: `Mis horarios → ese horario → Ver solo este`.
- **Detalle**: al pulsar, una **ventana** (desde `sm` la hoja pasa a ventana por `useCapasMotion`). Con teclado, `Enter`
  abre y `Esc` cierra (`useDialogoAccesible`).
- **Densidad**: con el intervalo de 60 minutos y el rango ajustado, la semana cabe sin barras de desplazamiento en una
  pantalla de 1280 × 800 [HIPÓTESIS, se medirá en la Fase 4 con `CONTEXTOS_FISICOS`].

```
┌──────┬─────────┬─────────┬─────────┬─────────┬─────────┬────────┬────────┐
│      │ Lun 9   │ Mar 10  │ Mié 11  │ Jue 12  │ Vie 13  │ Sáb 14 │ Dom 15 │
├──────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┼────────┤
│ 8:00 │┃Mates IN│┃Lengua IN│┃Mates IN│┃Inglés IN│┃Física IN│        │        │
│ 9:00 │┃        │┃Inglés IN│┃        │┃         │┃         │        │        │
│10:00 │┃Hist. IN│┃         │┃Quím. IN│┃Mates IN │┃Hist. IN │        │        │
│11:00 │┃Física  │┃Biolog.  │┃Lengua   │┃Tecno.   │┃Filo.    │        │        │
│12:00 │┃  IN    │┃  IN     │┃  IN     │┃  IN     │┃  IN     │        │        │
│ ...  │         │         │         │         │         │        │        │
│17:00 │┃Piano CO│         │┃Piano CO│         │         │        │        │
│18:00 │         │┃Entreno│EN│        │┃Entreno│EN│       │        │        │
└──────┴─────────┴─────────┴─────────┴─────────┴─────────┴────────┴────────┘
 IN Instituto · CO Conservatorio · EN Entrenamiento (la chapa: icono o iniciales + color)
```

En el esquema, Física de 11:00 a 13:00 es **un solo bloque** que ocupa las dos horas.

---

## 5. Agenda diaria (la pantalla principal en el móvil)

### 5.1 Composición

```
┌─────────────────────────────────────┐
│ ← Organización      Mis horarios  ⋯ │
│ Horario                             │
│ Hoy · lunes 9 de noviembre          │
│ (Día) (Semana)            ‹   ›     │
├─────────────────────────────────────┤
│ AHORA  Matemáticas · hasta 9:00     │   ← solo hoy, y solo si hay algo en curso
│ DESPUÉS Inglés · 9:00 (en 12 min)   │
├─────────────────────────────────────┤
│ 8:00 ┃ Matemáticas           [IN]   │   ← altura proporcional (1 h)
│      ┃ Aula 12                       │
│ 9:00 ┃ Inglés                [IN]   │
│10:00 ┃ Historia              [IN]   │
│11:00 ┃ Física                [IN]   │   ← 11:00–13:00: UN bloque de 2 h
│      ┃                               │
│12:00 ┃                               │
│13:00 ·  libre hasta 17:00            │   ← hueco largo: una línea, no espacio vacío
│17:00 ┃ Piano                 [CO]   │
│18:00 ┃ Entrenamiento: Push   [EN]   │   ← vinculada a Fitness (§9.3)
├─────────────────────────────────────┤
│ Sin hora                             │   ← solo si hay algo (Fitness o rutinas, si él lo activó)
│  · Rutina de piel (noche) · Imagen   │
├─────────────────────────────────────┤
│ ▸ Para hoy  Mochila 3/5 · 2 tareas  │   ← plegable: mochila, pendiente, tablón
└─────────────────────────────────────┘
 Acción principal de la pantalla: ninguna fija. La acción es tocar una actividad. El «+» de añadir está en el día (5.5).
```

### 5.2 La línea de tiempo

- **Proporcional**: 1 hora = 64 px por defecto (≈ 1,07 px por minuto).
  - Una actividad de 30 minutos mide 32 px: el nombre en una línea.
  - Una de 15 minutos mide 16 px: se dibuja con su altura real y el texto **fuera**, a la derecha, con una guía. **El área
    táctil se amplía a 44 px** sin cambiar el dibujo (`p-… -m-…`, EH F42).
  - Con la letra del sistema grande, la escala crece en vez de cortar el texto (EH F62) [HIPÓTESIS sobre la escala exacta,
    Fase 4].
- **Los huecos largos se comprimen**: más de 90 minutos libres se pintan como una línea («libre hasta 17:00») en vez de un
  hueco en blanco. **El hueco no se oculta: se resume**, y tocarlo propone añadir algo a esa hora.
- **La hora de ahora**: una línea fina del acento con la hora, solo cuando es hoy (en Reducido, sin animación).
- **«Cambiado este día»**: la actividad lleva «Cambiado este día» (palabra e icono) cuando tiene una excepción, y
  **«No hay este día»** atenuada y tachada cuando está cancelada. **Se ve, no desaparece**: así se puede deshacer.
- **Un día libre**: una tarjeta «Día libre · Instituto» en lugar de las actividades de ese horario, con «Quitar el día
  libre».

### 5.3 La chapa de procedencia (el horario de cada actividad)

- **Qué es**: una pastilla pequeña dentro del bloque, con el **icono del horario** (el campo `icono`, que ya existe) o, si
  no tiene, sus **dos iniciales**, sobre su color. 🔎 **Corrección 2026-11-09 (contraste, §15.1)**: dentro de un bloque, la
  pastilla es **opaca** (`surface`, con `border` y las iniciales en `text`), y el color del horario va en un **punto o
  borde** de la pastilla. Así se lee sobre cualquier color de actividad. Fuera de un bloque (leyenda, listas,
  Mis horarios) puede ir sobre su color, con su texto legible.
- **Cuándo sale**: **solo si hay más de un horario activo** ese día. Con uno solo sería ruido.
- **No depende del color**: lleva iniciales o icono, y el nombre completo está en el detalle y en el `aria-label`
  («Matemáticas, de 8:00 a 9:00, horario Instituto»).
- **El bloque**: lleva el color de la **actividad** o de su categoría (los colores personalizados que ya existen); la chapa,
  el del **horario**. Dos funciones distintas y dos sitios distintos: no compiten.
- **La categoría**: no se pinta en la tarjeta (se recarga). Está en el detalle y, si él quiere, da el color del bloque.

### 5.4 Lo que había en «Hoy» y dónde queda (nada se pierde)

| Función de hoy | Dónde queda |
|---|---|
| Ahora y siguiente | Arriba de la Agenda diaria, **solo hoy** |
| El día | La línea de tiempo |
| Pendiente (tareas que mencionan la asignatura), tablón y automatizaciones | `▸ Para hoy` (plegable, abajo) |
| Mochila de hoy | `▸ Para hoy` → Mochila |
| Mochila de mañana | `▸ Para hoy` → «Para mañana», a partir de la tarde, como hoy |
| Plan de estudio y sobrecarga (HT F9) | `⋯ → Plan de estudio`. La organización automática (Fase 6) entrará por el mismo sitio |
| Centro de avisos (HT F10) | `⋯ → Avisos` |
| Informe (HT F11) | `⋯ → Informe de la semana` |
| Modos «Lo justo» y «Todo» | Sustituidos por el plegable `▸ Para hoy`: lo justo siempre a la vista y el resto a un toque. **No se pierde ninguna información** |
| Densidad, zoom e intervalo | `⋯ → Vista` (por aparato; el intervalo y el rango, del horario) |
| Exportar (PDF e imagen, D-H7) | `⋯ → Exportar` (§5.6) |
| 🔎 **Buscar en el horario** (hoy en «Opciones avanzadas → Buscar», corrección 2026-11-09) | `⋯ → Buscar en el horario`: una hoja con un campo y los resultados (actividad, día, hora y horario). Busca en el nombre, el aula, el profesor y las etiquetas, como hoy (`buscarEnHorario`). Tocar un resultado abre su detalle. **También en el editor del borrador** (`⋯ → Buscar`), para encontrar una actividad que cambiar |
| 🔎 **Franjas** y **Generar franjas** (hoy en «Opciones avanzadas → Franjas» y en el panel «Franjas» del modo edición) | En el **editor del borrador**, `⋯ → Franjas horarias`: la lista de franjas para editar o borrar, «Añadir franja» y **«Generar franjas»** con desde, hasta, cada y descanso (`generarFranjas`, con su aviso de impacto). Ver §11.2 |
| 🔎 **Semanas A/B** (hoy en «Opciones avanzadas → Semanas A/B») | Ubicación reservada en el editor: `⋯ → Semanas A/B`. **No se muestra mientras TP-5 esté pendiente** (§12.13); la configuración guardada se conserva intacta |
| 🔎 **Validación del horario** (hoy en «Opciones avanzadas → El horario») | Integrada en **«Revisar y guardar»** (§11.3) |
| 🔎 **Tus asignaturas y actividades** (hoy, la lista bajo la rejilla, con la ficha de cada una; revisión del 2026-11-09) | En **Mis horarios**, `▸ Tus asignaturas y actividades (N)` al final (§7.1). Cada fila dice si está en uso («6 clases»), «Sin usar», «Oculta» o «Archivada», y abre **su ficha** con lo de hoy: editar, favorita, **archivar o recuperar**, duplicar y eliminar (`fichaDe`, `archivarActividad`…). Es el único sitio desde el que se llega a una actividad archivada, que ya no tiene ninguna clase (HT F5) |
| 🔎 **Vaciar día** (hoy, en el menú de cada día) | En el **editor del borrador**, al tocar el nombre del día → «Vaciar este día». Pide confirmación con el recuento: «Este día tiene 6 actividades. ¿Las quitas de este horario?». Queda en el borrador y se ve en «Revisar y guardar» (§11.2) |
| 🔎 **Agenda de 7 días** (hoy, la vista «Agenda»: los próximos siete días desde hoy, en lista, con «Libre» si no hay nada) | En la **Agenda semanal del móvil** (§6.2), la opción «Próximos 7 días», junto a «Esta semana». La misma lista, contada desde hoy (`vistaAgenda`) |

### 5.5 Añadir algo a un día desde la agenda

- **El hueco** («libre hasta 17:00») y un `BotonAnadir` al final del día ofrecen **«Añadir solo este día»**, que crea una
  excepción `anadido` con su hoja de confirmación (`docs/19` §6.6), y **«Añadir al horario…»**, que lleva al editor de un
  horario con la hora puesta.
- **Con varios horarios activos**, se pregunta a cuál, y **no hay valor por defecto**.
- **Sin ningún horario**, el estado de §12.1.
- 🔎 **Marcar un día libre** (revisión del 2026-11-09; la excepción `dia_libre` existe en el modelo, pero hoy ninguna
  pantalla la crea, `docs/19` §6.6 y §18.8):
  - En `⋯ → Marcar este día como libre` de la Agenda diaria.
  - Una hoja corta pregunta **de qué horarios**: «Todos los activos» o uno de ellos, sin valor por defecto si hay más de
    uno.
  - Confirmar crea la excepción (pasa por `validarCambio`, no crea versión) y el día se pinta como en §5.2: «Día libre ·
    Instituto» con **«Quitar el día libre»**.

### 5.6 Exportar (Fase 4, D-H7)

`⋯ → Exportar` abre una hoja con tres decisiones y una acción:
- **Qué**: (Este día) (Esta semana).
- **Formato**: (Imagen) (PDF).
- **Horarios**: todos los activos, o uno de ellos.
- **[Compartir o guardar]**.

Se enseña una **vista previa en miniatura** del resultado (centrado y con los colores configurados). Si el navegador no
puede compartir archivos, la acción es «Guardar» (descarga). Sin opciones de diseño: el resultado es uno, bien hecho
(Anexo §9).

🔎 **Colores al exportar (decisión B de Josué, 2026-11-09)**:
- La imagen y el PDF usan **la misma regla de color que la pantalla**: `fondoLegible` para el fondo y `bestReadableText` para
  el texto (§15.1).
- Un color que no llega a 4,5 : 1 sale **ajustado para que se lea** (hoy, solo `#6270A0` → `#5C6996`).
- **El color original no cambia**: el ajuste solo existe al pintar y al exportar. Exportar **no escribe nada**: ni el
  horario, ni la agenda, ni las versiones (`docs/19` §18.5).

---

## 6. Agenda semanal

### 6.1 Escritorio: §4.

### 6.2 Móvil: vertical, legible y sin desplazamiento horizontal

```
┌─────────────────────────────────────┐
│ Semana del 9 al 15 de noviembre ‹ › │
│ L  M  X  J  V  S  D                 │   ← mapa de la semana: 7 columnitas con la ocupación
│ ▆  ▆  ▆  ▆  ▅  ·  ·                 │     (tocar una lleva a ese día; hoy, marcado)
├─────────────────────────────────────┤
│ LUNES 9 · hoy                       │
│  8:00–9:00   Matemáticas       IN   │
│  9:00–10:00  Inglés            IN   │
│ 11:00–13:00  Física            IN   │
│ 17:00–18:00  Piano             CO   │
│ MARTES 10                            │
│  8:00–10:00  Lengua            IN   │
│  …                                   │
│ SÁBADO 14 · sin actividades          │
└─────────────────────────────────────┘
```

- **Cada día es una lista** con la hora completa, el nombre entero (con salto de línea si hace falta, nunca recortado a
  «Mate…») y la chapa. No se oculta nada.
- **El mapa de la semana** (siete columnas de unos 40 px que caben en 320 px) enseña de un vistazo qué días están cargados y
  dónde hay huecos. Es orientación, y cada columna lleva su `aria-label` («Lunes, 6 actividades, de 8:00 a 18:00»).
- Tocar una actividad abre su detalle; tocar el nombre del día abre ese día en la vista Día.
- 🔎 **Los días, siempre de lunes a domingo** (TP-18 resuelta), igual que en el escritorio.
- Coincidencias: la marca de §10 en las dos filas.
- **No es una rejilla de siete columnas comprimidas**: a 375 px saldría ilegible o con desplazamiento horizontal, que es lo
  que el prompt prohíbe.
- 🔎 **«Esta semana» · «Próximos 7 días»** (revisión del 2026-11-09): la segunda opción es la vista «Agenda» de hoy. La misma
  lista, empezando en hoy y siguiendo siete días, con «Sin actividades» en los vacíos. Se conserva entera.

---

## 7. Mis horarios

### 7.1 Composición

```
┌─────────────────────────────────────┐
│ ← Organización            Agenda  ⋯ │
│ Mis horarios                        │
│ [+ Crear un horario]                │   ← la acción principal
├─────────────────────────────────────┤
│ ✎ Sin terminar                      │   ← solo si hay borradores de horarios nuevos
│   «Vacaciones» · borrador de ayer   │
│   [Seguir]                       ⋯  │
├─────────────────────────────────────┤
│ ACTIVOS (2)                          │
│ ┌─────────────────────────────────┐ │
│ │ IN Instituto            ● Activo │ │
│ │ L–V · 30 actividades             │ │
│ │ Hasta el 23 de junio             │ │
│ │ ✎ Tienes cambios sin guardar     │ │   ← solo si tiene un borrador
│ │ [Editar]                     ⋯  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ CO Conservatorio        ● Activo │ │
│ │ L, X · 2 actividades             │ │
│ │ [Editar]                     ⋯  │ │
│ └─────────────────────────────────┘ │
│ ▸ Desactivados (1)                   │
│ ▸ Archivados (3)                     │
│ ▸ Eliminados (1) · se guardan 30 días│
│ ▸ Versiones de horarios eliminados   │   ← solo si hay alguna (§11.5)
├─────────────────────────────────────┤
│ ▸ Tus asignaturas y actividades (14) │   ← la lista de hoy, con su ficha (§5.4)
├─────────────────────────────────────┤
│ ◌ 2 cosas por revisar   [Revisar]    │   ← solo si hay coincidencias o elementos apartados
└─────────────────────────────────────┘
```

### 7.2 Estados del horario (palabra, icono y explicación en una frase)

| Estado | Rótulo | Frase (en la propia tarjeta, la primera vez y en el detalle) |
|---|---|---|
| Activo | ● Activo | «Sale en tu agenda y en Hoy.» Y si tiene fechas: «del 15 de septiembre al 23 de junio» |
| Activo, todavía no vigente | ◔ Empieza el 15 de septiembre | «Está activo, pero no sale hasta esa fecha.» |
| Activo, ya caducado | ◑ Terminó el 23 de junio | «Ya no sale en tu agenda. Archívalo si no lo vas a usar.» |
| Desactivado | ○ Desactivado | «Se guarda entero, pero no sale en tu agenda.» |
| Archivado | ▣ Archivado | «Guardado como recuerdo de otro curso.» |
| Eliminado | 🗑 Eliminado | «Puedes recuperarlo hasta el 8 de diciembre.» (la retención de la papelera global) |

El estado se **deriva** de `activo`, `archivado` y las fechas (`docs/19` §2.3): ni una palabra técnica.

### 7.3 Acciones según el estado (una principal y el resto en `⋯`)

| Estado | Principal | En `⋯` |
|---|---|---|
| **Activo** | **Editar** | Ver solo este · Cambiar nombre y fechas · Desactivar · Duplicar · Guardar una versión · Versiones anteriores · Exportar · Archivar · Eliminar |
| **Desactivado** | **Activar** (comprueba coincidencias, §10.3) | Ver solo este · Editar · Cambiar nombre y fechas · Duplicar · Guardar una versión · Versiones anteriores · Archivar · Eliminar |
| **Archivado** | **Recuperar** (vuelve **desactivado**: se activa después, con su comprobación) | Ver solo este · Versiones anteriores (solo ver) · Duplicar · Eliminar |
| **Eliminado** | **Restaurar** (vuelve desactivado si coincidiría con algo, `docs/19` §7) | — (vaciar la papelera es de la papelera global; **sus versiones se quedan**, §11.5) |
| **Borrador de un horario nuevo** | **Seguir** | Descartar el borrador |

- **«Duplicar»** pregunta **desde cuándo** empieza la copia (por defecto: sin fecha y **desactivada**), para no repetir
  P14/GE F2. Una copia nunca nace activa encima del original.
- **«Eliminar»** va a la papelera (`BotonBorrar`, sin pregunta dramática): un aviso «Instituto se ha movido a Eliminados»
  con **Deshacer** (`AvisoAccion`). Lo que no se recupera (nada, en este caso) no se promete.
- **«Guardar una versión»**: el Maestro §8 dice que «las versiones importantes se guardan manualmente».
  🔎 **Corrección 2026-11-09 (opción A de Josué; contrato en `docs/19` §6.5 y §14.6)**:
  - Abre una hoja corta con «Nombre de la versión» (se propone «Versión del 9 de noviembre») y **[Guardar la versión]**.
  - Guarda **el horario tal como está confirmado en tu agenda**. Si hay un borrador sin guardar, la hoja lo dice: «Tus
    cambios del borrador no se incluyen: guárdalos antes si quieres que estén».
  - **Si ya existe una versión idéntica**, no se crea otra y se dice cuál: «Ya tienes una versión igual: «Antes del
    segundo trimestre» (8 de noviembre)».
  - Está en los horarios **activos** y **desactivados**.

### 7.4 «Ver solo este»

La misma agenda (Día o Semana) **filtrada por ese horario**, con una franja arriba: «Viendo solo Instituto ·
[Ver todos]». Sirve también para los desactivados y archivados («así era»), **en solo lectura**: sin añadir ni cambiar.

### 7.5 Revisión

Una sola entrada para lo que necesita sus ojos:
- **Coincidencias** antiguas pendientes (§10.2).
- **Elementos apartados** (la cuarentena, `docs/19` §17.5): «Una clase que no pertenece a ningún horario», «Un cambio con una
  fecha que no existe»…
- **Días sin elegir**: actividades guardadas en un «día» sin día de la semana (P2): «Elige qué día es».

Cada una con su explicación y sus salidas (Resolver, Mantener así, Recuperar, Descartar). Si no hay nada, la entrada no
existe.

---

## 8. Creación de horarios

### 8.1 «Crear un horario»: tres opciones, sin formulario largo

```
┌─────────────────────────────────────┐
│ ← Mis horarios                      │
│ Crear un horario                    │
│ ¿Cómo quieres empezar?              │
│ ┌─────────────────────────────────┐ │
│ │ ✎ Crear a mano                  │ │
│ │ Añade tus actividades día a día.│ │
│ │ Puedes partir de una plantilla. │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 💬 Asistente                    │ │
│ │ Cuéntale cómo es tu semana y te │ │
│ │ prepara una propuesta. Tú la    │ │
│ │ revisas antes de guardarla.     │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ⇪ Importar un horario           │ │
│ │ Desde una foto o un PDF. Se lee │ │
│ │ en tu móvil y revisas lo dudoso.│ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

- **El orden pone primero «Crear a mano»**: el Maestro §6 dice que la creación manual es el método principal. Las tres
  tarjetas tienen el mismo peso visual.
- **Nombres**: «Asistente», nunca «IA» (Anexo §1, DA-09).
- **Solo aparecen las opciones que existen** (regla 8):
  - En la entrega de la Fase 4 solo existe «Crear a mano».
  - «Importar» aparece con la Fase 5 y «Asistente» con la Fase 6.
  - Nada de «próximamente».
  - Mientras haya una sola opción, esta pantalla **no existe**: «+ Crear un horario» va directo a «Crear a mano».
- **Volver atrás no pierde nada**: en cuanto hay algo (un nombre, una actividad), es un **borrador** guardado (§11), y
  aparece en «Sin terminar».

### 8.2 Crear a mano: primer paso corto

```
 Nombre           [ Instituto              ]     (opcional; si se deja vacío, «Horario nuevo»)
 ¿Desde dónde?    (Vacío)  (Colegio L–V 8–14)  (Tardes L–V 16–21)  (Semana completa)
                  (Una plantilla tuya ▸)  (Copiar uno de mis horarios ▸)
 [Empezar]
```

- **Se conservan** las plantillas de HT F3 (Colegio, Semana completa, Tardes y Vacío) y las **plantillas propias** (HT F4,
  `guardarComoPlantilla`, que hoy no tienen pantalla).
- **El tipo** («Clases», «Entrenamiento»…) **no se pregunta aquí**: va en «Cambiar nombre y fechas». Tiene efecto (crear
  asignaturas en Estudios desde un horario de «Clases»), y en ese caso se pregunta **en el momento** de añadir una
  asignatura nueva, con la sugerencia de §9.3.
- **Las fechas de inicio y fin** también se dejan para después (son opcionales).
- **«Empezar»** abre el **editor del borrador** (§11.2).

### 8.3 Asistente (Fase 6)

La hoja de conversación de los asistentes (`HojaAsistente`), con un **panel de vista previa** de la semana:
- Arriba en el móvil, plegable.
- Al lado en el escritorio.

Cada propuesta se puede **aceptar, cambiar o quitar** línea a línea; nada se guarda en la agenda hasta «Revisar y guardar».
El diseño detallado es de la Fase 6.

### 8.4 Importar (Fase 5)

1. `SelectorDeArchivos`: el selector del sistema directamente, sin menú propio. En el iPhone ofrece cámara, fototeca y
   archivos.
2. Pantalla «Leyendo tu horario…» con `GiroDeCarga` **y texto** («Leyendo la foto 1 de 2»), y la frase «Se lee en tu móvil:
   no se envía a ningún sitio».
3. **Revisión**: la semana leída, con lo **dudoso resaltado** con palabra («Revisa la hora») y no solo con color. Hay que
   tocar o descartar cada dudoso antes de seguir.
4. Abre el editor del borrador. El diseño detallado es de la Fase 5.

---

## 9. Detalle de actividad

### 9.1 La hoja (en el escritorio, una ventana)

```
┌─────────────────────────────────────┐
│            ━━━━ (asa)               │
│ Matemáticas                       ✕ │
│ Hoy, lunes 9 · 8:00–9:00 (1 h)      │
│ IN Instituto · Clases                │   ← procedencia: horario + categoría
│ Aula 12 · Profesora Ruiz             │   ← solo lo que tenga
│ Se repite: lunes y miércoles         │
│ Desde el 15 sep hasta el 23 jun      │   ← solo si tiene vigencia propia
│ ◌ Coincide con Piano (Conservatorio) │   ← solo si coincide (§10)
│   de 8:30 a 9:00 · [Ver]             │
│ ↗ De Estudios: Matemáticas  [Abrir]  │   ← entidad vinculada (§9.3)
├─────────────────────────────────────┤
│ [Cambiar este día]                  │   ← la acción principal
│ [Editar la actividad]               │
│ ⋯  Duplicar · Mover · Eliminar ·    │
│    No hay este día · Notas          │
└─────────────────────────────────────┘
```

- **Lo principal arriba**: nombre, cuándo, cuánto dura y de qué horario es. Lo demás, **solo si existe**: ninguna fila
  vacía.
- **Acción principal: «Cambiar este día»**. Es lo más frecuente desde la agenda (moverla hoy, cambiar el aula hoy). Abre la
  hoja corta de §9.2 con el alcance ya elegido («Solo este día»).
- **«Editar la actividad»** abre el editor del borrador de su horario, con esa actividad seleccionada. Ahí se eligen los
  tres alcances si es repetida (§9.2).
- **En el `⋯`**:
  - Duplicar.
  - Mover (a otro día u hora; en el escritorio también se puede arrastrar en el editor, §11.2).
  - Eliminar (con alcance si es repetida).
  - **«No hay este día»** (cancelar solo hoy: la excepción `cancelado`, que hoy no tiene pantalla) y **«Hay este día otra
    vez»** si ya estaba cancelada.
  - Notas.
- **Consultar procedencia**: la línea del horario se puede tocar y abre ese horario en Mis horarios.
- **Consultar la entidad vinculada**: la línea «↗ De Estudios» se puede tocar y abre la asignatura en Estudios; a la vuelta,
  «← Volver» regresa aquí (NAVO F1).

### 9.2 Elegir el alcance (solo con una actividad repetida)

```
 ¿A qué repeticiones afecta?
 ( Solo este día — lunes 9 )
 ( Este día y los siguientes )
 ( Todas las repeticiones )
 Lo que ya pasó no cambia.        ← la regla de docs/19 §4.2, dicha en palabras
 [Continuar]
```

- **Sin opción marcada por defecto**: `ALCANCES` no tiene valor por defecto (HT F3). Pulsar «Continuar» sin elegir muestra
  «Elige a qué repeticiones afecta».
- **Solo aparece si la actividad se repite.** Con una actividad de un solo día, la pregunta no existe.
- «Cambiar este día» llega ya con «Solo este día» elegido (es lo que dice su nombre) y deja cambiarlo.

### 9.3 Actividades vinculadas e independientes

| Caso | Cómo se ve en el detalle |
|---|---|
| Vinculada a **Estudios** | «↗ De Estudios: Matemáticas · [Abrir]». El nombre lo pone Estudios: en el editor, el campo de nombre dice «El nombre se cambia en Estudios» con su enlace |
| Vinculada a **Fitness** | «↗ De Fitness: lo que toque cada día · hoy, **Push**». Sin plan: «Fitness no tiene plan para este día». **Las horas son tuyas** (D-H6). 🔎 **Un día de descanso según Fitness es TP-7, pendiente** (corrección 2026-11-09): cómo se ve en Horarios y si cuenta en Inicio no está decidido. Las posibilidades están en §12.13 y no se aprueba ninguna |
| Vinculada a **Imagen personal** | Solo **sin hora** («Rutina de piel (noche) · de Imagen personal»), y solo si él activó que salga en su horario |
| El origen ya no existe | «Ya no existe en Estudios. Se guarda con su último nombre.» · [Desvincular] |
| **Independiente** | Sin línea de vínculo. En el editor, «Vincular con…» está dentro de `▸ Más opciones` |

**Al escribir un nombre** (en el editor, el Asistente o la revisión de una importación), la lista de sugerencias enseña la
**procedencia**:

```
 Nombre [ mat                                  ]
   Matemáticas            de Estudios
   Matemáticas II         de Estudios
   + Crear «mat» como actividad nueva
```

Nunca se vincula por coincidir el nombre: solo al tocar la sugerencia (Anexo §7, E3 F12).

---

## 10. Conflictos

**Palabra en pantalla: «coincide»** (lo que pasa), nunca «conflicto», «choque» ni «error». Icono `◌` con dos círculos
solapados, color **`warning`** (nunca `danger`), y siempre con el texto.

> 🔎 **Corrección 2026-11-09 (contraste)**: el ámbar `warning` **solo se usa sobre las superficies normales** (tarjetas,
> mensajes, filas de lista). **Dentro de un bloque de color**, la marca va en la **pastilla opaca** de §15.1: el ámbar sobre
> los colores de actividad da entre 1,02 y 2,25:1 [EJECUTADO].

### 10.1 Coincidencia nueva: se bloquea con una salida

Al guardar algo que coincidiría (en el editor, «Cambiar este día», mover, duplicar, activar o restaurar):

```
 ◌ Esto coincidiría con otra actividad
   Inglés · Academia · martes de 10:00 a 11:00
   Para guardarlo, cambia la hora o el día, o revisa la otra actividad.
   [Cambiar la hora]  [Ver Inglés]
```

- **No hay «Ponerlo igualmente»** ni ninguna forma de saltarse el bloqueo.
- **«Ver Inglés»** abre su detalle. Desde ahí se puede cambiar, eliminar o desactivar su horario: son las tres salidas del
  Maestro §3. **Nunca se cambia la otra sola.**
- **El botón de guardar no se apaga**: pulsarlo enseña este mensaje (EH F62: un botón apagado no dice qué corregir).
- **Si coincide con varias**: «Coincidiría con 3 actividades» y la lista, con un «Ver» cada una.
- **En el editor**: la actividad que coincidiría se ve en la vista previa marcada con `◌`, antes incluso de pulsar
  guardar.

### 10.2 Coincidencia antigua: para revisar, sin tocar nada

- **En la agenda**: las dos actividades se dibujan **una al lado de la otra**, cada una a la mitad del ancho, con la marca
  `◌ Coincide`.
- **En su detalle**:

```
 ◌ Coincide con Piano (Conservatorio) de 8:30 a 9:00
   Ya estaba así antes. No se ha cambiado nada.
   [Resolver]  [Mantener así]
```

- **«Resolver»** abre el borrador del horario con las dos actividades a la vista para moverlas o acortarlas, y pasa por la
  confirmación normal.
- **«Mantener así»** la marca como revisada: no vuelve a avisar y la marca de la agenda se atenúa («Revisado»). Se puede
  volver a abrir.
- **En Mis horarios → Revisión**: la lista de todas, con el horario de cada lado.
- **Resuelta** (porque él cambió algo): un aviso «Ya no coinciden» una vez, en Revisión.

### 10.3 Activar o restaurar un horario

- Antes de activar, se comprueba. Si coincide: «Conservatorio coincide con Instituto en 2 momentos de la semana» y la lista.
- Salidas:
  - **[Editar Conservatorio]**: abre su borrador.
  - **[Dejarlo desactivado]**.
- **No se activa a medias.**

---

## 11. Borradores y versiones

### 11.1 La diferencia, siempre visible

| Dónde estás | Cómo se nota |
|---|---|
| **En tu agenda** (Horario) | La cabecera normal. Lo que ves es lo que hay |
| **En un borrador** (editor) | Cabecera con «**Borrador** · Instituto» y una franja del color `info`: «Los cambios no se ven en tu agenda hasta que los guardes». El fondo de la vista previa lleva una trama muy suave para que no se confunda con la agenda [HIPÓTESIS sobre la trama, se probará con contraste] |

### 11.2 El editor del borrador

```
┌─────────────────────────────────────┐
│ ← Mis horarios     ↶ ↷              │   ← deshacer / rehacer (del borrador)
│ Borrador · Instituto                │
│ ⓘ No se ve en tu agenda hasta que   │
│   lo guardes. Guardado hace un      │
│   momento.                           │   ← estado del autoguardado
│ (Día) (Semana)   lunes ‹ ›           │
├─────────────────────────────────────┤
│  … la misma agenda, solo de este     │
│  horario, con cada actividad tocable │
│  [+ Añadir actividad]                │
├─────────────────────────────────────┤
│ 3 cambios                [Revisar y guardar] │   ← la acción principal, fija abajo
└─────────────────────────────────────┘
```

- **Añadir o editar una actividad** abre su hoja:
  - Nombre, con sugerencias y procedencia.
  - **Días**: siete botones L M X J V S D, que se pueden marcar varios (la «serie»).
  - **Hora de inicio y fin**: el campo de hora del sistema.
  - `▸ Más opciones`, plegado:
    - Categoría.
    - Color.
    - Aula, profesor y material.
    - Notas.
    - **Desde y hasta** (vigencia propia).
    - **Repetición**: «Cada semana» o «Cada dos semanas» (la recurrencia `alternas` por actividad, que ya existe en el
      motor sin pantalla, `docs/17` §11.12).
      - 🔎 **«Cada dos semanas» se ve siempre**: no depende de TP-5 y TP-5 no la oculta. Al elegirla se pide **la semana
        en que empieza** (su fecha de referencia), con «esta semana» o «la que viene» y la frase «Toca esta semana, no la
        siguiente…».
      - 🔎 **Semanas A/B no aparecen aquí** mientras TP-5 esté pendiente. Son otra función: un sistema del horario entero,
        con su propia semana A. Una actividad «cada dos semanas» sigue su propia fecha aunque el horario tenga semanas A/B
        (`docs/19` §18.6).
    - Vincular con….
- **Arrastrar y cambiar la duración** (Maestro §7):
  - En el **escritorio**, el bloque se arrastra y su borde inferior cambia la duración, con el motor de gestos
    (`fisicaMotion`, un dedo, la máquina de estados; MS F8).
  - En el **móvil** también se puede, tras **mantener pulsado**.
  - **Siempre hay botones** que hacen lo mismo: «Mover» y la hora de fin en la hoja. Ninguna acción depende de un gesto (EH
    F50/F61).
- **Copiar un día a otro**: tocar el nombre del día → «Copiar este día a…». Si el destino tiene actividades: «Sustituir lo
  que hay» o «Cancelar» (HT F3).
- 🔎 **Vaciar un día**: en el mismo menú, «Vaciar este día», con la confirmación y el recuento de §5.4. Solo cambia el
  borrador.
- 🔎 **Los días no se reordenan** (TP-18, **resuelta por Josué el 2026-11-09**):
  - Van siempre de lunes a domingo.
  - «Izquierda» y «Derecha» de la pantalla actual desaparecen, y el menú del día no tiene ningún control de orden.
  - El orden que se guardó antes (`posicion`) se conserva intacto y ya no cambia lo que se ve (`docs/19` §18.8).
- **Organizar días** (los que salen):
  - En `⋯ → Días`: qué días de la semana se muestran (`horario.vista.diasOcultos`).
  - Ocultar un día con actividades pide confirmación con el recuento.
  - «Añadir día» deja de existir como tal: los días son los siete de la semana (arregla P2).
- 🔎 **Franjas horarias** (corrección 2026-11-09: **se conserva entera**, incluido **Generar franjas**):
  - En `⋯ → Franjas horarias`: la lista de franjas (inicio, fin y nombre opcional, como «Recreo»), editar, borrar y
    «Añadir franja».
  - **«Generar franjas»**: desde, hasta, cada (minutos) y descanso, con el campo de hora del sistema. Antes de aplicar,
    enseña el aviso de impacto que ya existe (`impactoRegenerarFranjas`).
  - **Para qué sirven en el diseño nuevo**:
    1. **Crear rápido**: en el editor, tocar una franja vacía de un día propone una actividad **con las horas de la
       franja**, que se pueden cambiar.
    2. **Guías con nombre** en la vista del editor y, si él quiere, en la semana: líneas y rótulos como «Recreo».
  - **Lo que ya no hacen**: decidir dónde se pinta una actividad. Una actividad fuera de las franjas **se ve igual**
    (arregla P3), y una de dos horas es **un** bloque aunque cruce dos franjas (P4).
  - Editar una franja con horas imposibles **avisa** con su frase (arregla P15) y usa el campo de hora del sistema.
- 🔎 **Semanas A/B**: ubicación reservada en `⋯ → Semanas A/B`, **oculta mientras TP-5 esté pendiente**. La configuración
  guardada (número de semanas, fecha de la semana A y nombres) se conserva intacta y vuelve a ser editable cuando Josué
  decida.
- 🔎 **Buscar**: `⋯ → Buscar`, la misma hoja que en la agenda (§5.4), limitada al horario del borrador.
- **El estado del guardado del borrador**, en palabras: «Guardado hace un momento», «Guardando…» o «No se ha podido
  guardar el borrador. Sigue abierto aquí, pero si cierras la app se pierde lo último. [Reintentar]». Lo de siempre de
  `saveData`, que solo dice lo que pasa: lo pendiente vive en memoria, nunca en el aparato (MS F16, decisión de Josué).
- **Salir**: «← Mis horarios» sale **sin preguntar**, porque el borrador está guardado, y en la tarjeta del horario aparece
  «✎ Tienes cambios sin guardar · [Seguir]».

### 11.3 Revisar y guardar (resumen antes de confirmar)

```
┌─────────────────────────────────────┐
│ Revisar cambios · Instituto          │
│ Esto es lo que va a cambiar en tu    │
│ agenda:                              │
│ + Física · viernes 11:00–13:00       │
│ ~ Inglés pasa a las 10:00            │
│   desde el lunes 16                  │
│ − Tutoría (jueves)                   │
│ ✓ No coincide con nada               │
│ ◌ 1 cambio de un día dejará de tener │
│   sentido (Inglés, día 12). Se queda │
│   como está; revísalo si quieres.    │
├─────────────────────────────────────┤
│ [Guardar en mi horario]              │
│ [Seguir editando]                    │
└─────────────────────────────────────┘
```

- Se cuenta en palabras, agrupado (lo que se añade, lo que cambia y lo que se quita), con **desde cuándo**.
- **Si algo coincidiría**: el bloque de §10.1 sustituye a «✓ No coincide con nada», y «Guardar en mi horario» explica por
  qué no puede.
- **Si hay dudosos sin revisar** (importación o Asistente): «Quedan 2 datos por revisar» y el botón lleva a ellos.
- 🔎 **Validación del horario** (corrección 2026-11-09: la que hoy está en «Opciones avanzadas → El horario»,
  `validarEstructura`):
  - Se ejecuta aquí, sobre el borrador, y enseña cada problema con su frase (`describirProblema`) en un bloque «Revisa
    esto»: franjas que se solapan, una franja sin horas, actividades en un día sin elegir…
  - **Lo que bloquea guardar** es lo mismo que rechaza la validación común (horas imposibles, fechas inválidas, una
    coincidencia nueva: `docs/19` §4.4).
  - **El resto avisa sin bloquear**, como hoy, con «Ir a corregirlo».
  - Si no hay nada: «✓ El horario está bien».
- **Si el horario cambió mientras tanto** (desde otra edición en este aparato): «Este horario ha cambiado desde que
  empezaste el borrador» con **[Ver qué cambió]**, **[Sustituir por lo mío]** y **[Descartar mi borrador]**.
  - ⚠️ Esto **no** protege de otro aparato que guarde a la vez (`docs/19` §17.3). La pantalla **no dice nunca** que esté a
    salvo de eso.
- **Al guardar**: el botón pasa a «Guardando…» (`estado="cargando"`, sin cambiar de ancho). Después, un aviso «Guardado en
  tu agenda» con **«Ver la versión anterior»**, y la vuelta a Mis horarios.
- **Si falla**: «No se ha podido guardar. Tu borrador sigue intacto.» · [Reintentar]. La agenda no ha cambiado (`docs/19`
  §6.4).
- 🔎 **Si no se puede comprobar que tus versiones anteriores siguen a salvo** (sin conexión o un error al releerlas,
  `docs/19` §18.7): no se guarda. Se dice «No se puede comprobar que tus versiones anteriores están a salvo. Tu borrador
  sigue guardado. Inténtalo con conexión.» · [Reintentar]. Nunca se sigue a medias.

### 11.4 Versiones anteriores (sin pantalla de historial)

Desde el `⋯` del horario se abre una **hoja** con la lista de versiones:

```
 Versiones anteriores · Instituto
  Hoy, 18:40 · antes de tus últimos cambios           (automática)   [Ver]
  Ayer, 09:12 · «Antes del segundo trimestre»         (tuya)         [Ver] ⋯
  2 nov · al actualizar Horarios                      (automática)   [Ver]
 [Guardar una versión]
```

🔎 **Corrección 2026-11-09 (opción A de Josué)**:
- **Cada versión dice si es tuya o automática**, con palabra, no solo con un icono.
- **«Ver»** enseña la semana de esa versión en solo lectura, con **[Recuperar esta versión]**. Recuperar crea un borrador y
  pasa por «Revisar y guardar» (`docs/19` §6.5).
  - 🔎 **Antes de recuperar, se guarda lo que tienes ahora** (`docs/19` §18.7): «Revisar y guardar» lo dice así: «Antes de
    cambiarlo, se guardará una copia de tu horario actual en «Versiones anteriores»». Si ya hay una versión automática
    igual, no se repite.
  - **Recuperar no borra ni cambia ninguna versión**: la recuperada sigue en la lista, y la de seguridad se añade arriba.
  - Si la copia de seguridad no se puede guardar o comprobar, **no se recupera nada** y se dice el mensaje de §11.3.
- **Solo las tuyas tienen `⋯`**, con «Cambiar el nombre» y «Eliminar esta versión».
  - **Las automáticas no se pueden renombrar ni eliminar**: no tienen ese menú.
- **Eliminar una versión tuya** pide confirmación clara, en una hoja:

  ```
   ¿Eliminar la versión «Antes del segundo trimestre»?
   Se elimina solo esta versión. Tu horario y las demás versiones no cambian.
   [Eliminar esta versión]   [Cancelar]
  ```

  - El botón de eliminar no encoge al pulsarlo (`toque-destructivo`).
  - Después, un aviso: «Versión eliminada».
  - No va a la papelera: es un borrado que pides tú, una versión cada vez.
  - 🔎 **Se elimina en todos tus aparatos** y no vuelve a aparecer (`docs/19` §18.9). Necesita conexión. Sin ella: «Sin
    conexión: no se puede eliminar ahora. No ha cambiado nada.»
  - 🔎 **«Versión eliminada» solo sale cuando el servidor lo ha confirmado** (decisión de Josué: nada pendiente se guarda en
    el aparato, MS F16). Si la respuesta se pierde:
    - La fila sigue en la lista con «Sin confirmar» y el texto «No se ha podido confirmar. Puede que no se haya hecho;
      vuelve a mirarlo cuando tengas conexión.» · [Reintentar].
    - Si cierras la app, no se reintenta sola.
    - Si al volver resulta que sí se aplicó, la lista simplemente lo enseña (la versión ya no está) y el «Sin confirmar»
      desaparece. 🔎 **No hay aviso de «sí se aplicó»** (corrección 2026-11-09): podría atribuir la operación al aparato
      equivocado (`docs/19` §18.9).
  - Lo mismo vale para **«Guardar una versión»** y **«Cambiar el nombre»**: ninguna se enseña como hecha sin estar
    confirmada.
- 🔎 **Si le cambiaste el nombre a la misma versión en dos aparatos a la vez**:
  - La fila lo dice: «Tiene dos nombres: «Antes del examen» o «Segundo trimestre» · [Elegir]». No dice de qué aparato es
    cada uno, porque no se puede saber con certeza.
  - No se elige uno en silencio. Elegir deja ese nombre en todos.
- 🔎 **Si no se puede leer la lista de versiones**: la hoja no enseña una lista a medias. Dice «No se han podido cargar tus
  versiones. No se ha perdido nada.» · [Reintentar].
- 🔎 Dos versiones automáticas idénticas de dos aparatos (por ejemplo, de una actualización hecha a la vez) salen en una
  línea con «2 copias iguales». No se elimina ninguna.
- **Ninguna versión se elimina sola** (`docs/19` §17.1). No existe «Borrar versiones antiguas»: eso sería una poda, y es
  TP-13, pendiente.
- **En un horario desactivado**: lo mismo que en uno activo.
- **En uno archivado**: solo «Ver», sin recuperar, guardar, renombrar ni eliminar, hasta recuperar el horario del
  archivo.
- **El autoguardado no crea versiones**: el borrador se guarda solo, y las versiones nacen al confirmar o cuando tú guardas
  una.
  - 🔎 **Regla definitiva de Josué** (`docs/19` §18.10): sustituye a la redacción histórica de `docs/17` §8 («También se
    conservan versiones mediante el autoguardado») en lo que toca a crear versiones.
  - Las automáticas nacen al confirmar cambios, al restaurar y al actualizar Horarios (migrar). Las tuyas, solo cuando las
    pides.

### 11.5 Papelera y restauración

- **Eliminar un horario**: el aviso «Instituto se ha movido a Eliminados · [Deshacer]».
- En Mis horarios → `▸ Eliminados`: «Se puede recuperar hasta el 8 de diciembre · [Restaurar]».
- **Al restaurar**:
  - Normal: vuelve **como estaba** («Instituto ha vuelto»), como dicen §7.3 y `docs/19` §7 (🔎 corregido el 2026-11-09:
    aquí decía que volvía siempre desactivado).
  - Si volvería activo y coincidiría con algo: vuelve **desactivado**, con el mensaje de §10.3 y [Activar].
- Es **la papelera global** de JosStyle (Ajustes → Eliminados recientes), vista desde aquí y filtrada: no hay una segunda
  papelera.
- 🔎 **Cuando un horario sale de la papelera** (al vaciarla o al pasar los 30 días), **sus versiones y su borrador se
  quedan** (`docs/19` §7 y §18.7):
  - Aparecen en Mis horarios → `▸ Versiones de horarios eliminados`, agrupadas por el nombre que tenía el horario.
  - Cada una tiene **[Ver]** y **[Recuperar como horario nuevo]**: crea un borrador de un horario nuevo que pasa por «Revisar
    y guardar» y nace **desactivado**, como una copia de «Duplicar» (§7.3), para que no coincida con nada sin que él lo
    active.
  - Las tuyas se pueden renombrar y eliminar como siempre (§11.4). Las automáticas, no. Ninguna se elimina sola.

### 11.6 Estados resumidos

| Estado | Señal visual |
|---|---|
| Borrador | «✎ Borrador» + franja `info` + trama en la vista previa |
| Cambios sin confirmar | «N cambios» junto a «Revisar y guardar»; «✎ Tienes cambios sin guardar» en la tarjeta |
| Versión guardada | El aviso «Guardado en tu agenda · Ver la versión anterior» |
| Confirmación pendiente | La pantalla de §11.3 |
| Papelera | «🗑 Eliminado · hasta el …» |
| Restauración | El aviso con su estado de llegada (como estaba, o desactivado si coincidiría) |

---

## 12. Estados especiales

| Estado | Diseño |
|---|---|
| **12.1 Primer uso (ningún horario)** | Horario: `EmptyHint` «Todavía no tienes ningún horario» · «Crea uno y verás aquí tus clases y actividades de cada día» · **[Crear mi primer horario]** (la única acción). Mis horarios: el mismo mensaje, con «+ Crear un horario» |
| **12.2 Sin horarios activos (los hay desactivados o archivados)** | Horario: «No tienes ningún horario activo» · «Tienes 2 desactivados y 3 archivados» · **[Ir a Mis horarios]**. Nada de «Crear» como primera acción: ya tiene horarios |
| **12.3 Día sin actividades** | «Nada en tu horario este día» y la línea de tiempo vacía **no se dibuja**. Debajo: «Añadir algo solo este día» y, si es fin de semana, nada más. Lo que no es del horario (tareas, eventos) no se inventa aquí: está en `▸ Para hoy` y en el Calendario |
| **12.4 Varios horarios activos** | Las chapas (§5.3) y la leyenda en el escritorio. En Mis horarios, «2 activos». Las coincidencias entre ellos, con la marca de §10 |
| **12.5 Horarios desactivados** | No salen en la agenda. En Mis horarios, plegados con su número, y la acción principal «Activar» |
| **12.6 Horarios archivados** | Plegados. «Ver solo este» en solo lectura y «Recuperar» |
| **12.7 Actividades vinculadas** | §9.3; la línea «↗ De…» en el detalle, y nada en la tarjeta (sin recargar) |
| **12.8 Actividades independientes** | Sin marca; «Vincular con…» en `▸ Más opciones` |
| **12.9 Conflictos pendientes** | §10.2 y la entrada «Revisión» con su número |
| **12.10 Borradores** | §11; «Sin terminar» en Mis horarios para los horarios nuevos |
| **12.11 Errores de carga** | Si la carga de Horarios falla, la app ya **no escribe** esa clave (MS F16). La pantalla: «No se ha podido cargar tu horario» · «Comprueba la conexión. No se ha perdido nada.» · [Reintentar]. Mientras carga: **`Esqueleto`** con la forma de la agenda (E3 F14), nunca un giro sobre fondo vacío |
| **12.12 Sin conexión** | Se ve lo último cargado, con el indicador global arriba (`IndicadorDeSincronizacion`). Editar un borrador funciona (se guarda al volver la conexión **mientras la app siga abierta**, como todo `saveData`: lo pendiente no se guarda en el aparato, MS F16). 🔎 **«Guardar en mi horario», recuperar una versión, «Guardar una versión» y eliminar o renombrar una versión necesitan conexión** (revisión del 2026-11-09): hay que comprobar que las versiones anteriores siguen a salvo (`docs/19` §18.7), así que sin ella el botón dice «Sin conexión: tu borrador sigue guardado; podrás guardarlo en tu horario al recuperarla» y no hace nada a medias. Los cambios de un solo día (cancelar, mover solo hoy, día libre) no crean versión y se guardan como siempre con `saveData`. ⚠️ No se promete que no pisará cambios de otro aparato (`docs/19` §17.3, TP-15) |
| **Solo lectura por versión nueva** | Si la guardia de versión se activa (`docs/19` §12.3): «Tu horario se guardó con una versión más nueva de JosStyle. Recarga la aplicación para editarlo.» · [Recargar]. Todo se ve; nada se edita |
| **Copia antigua detectada** | `docs/19` §17.2: «Una versión antigua de JosStyle guardó tu horario el día X» con las dos salidas, sin elegir por él |

### 12.13 Decisiones pendientes que afectan a la interfaz (no se deciden aquí)

| TP | Qué cambia en la interfaz según la respuesta |
|---|---|
| **TP-5** (aplicar el ciclo A/B si existe) | 🔎 **Mientras esté pendiente, ninguna pantalla muestra semanas A/B**: ni «Semana A» en la cabecera, ni la opción «Semanas A/B» en «Repetición», ni `⋯ → Semanas A/B` en el editor (corrección 2026-11-09). La configuración guardada se conserva intacta. Si Josué decide aplicarlo, esos tres controles aparecen en el sitio ya reservado. ⚠️ **«Cada dos semanas» no es esto**: se ve siempre y TP-5 no le afecta (§11.2, `docs/19` §18.6) |
| **TP-7** (Fitness en un día de descanso) | 🔎 **Ninguna opción aprobada** (corrección 2026-11-09). **En Horarios**: (A) la actividad se ve atenuada con «Descanso según tu plan»; o (B) se ve igual que cualquier día, con el título que dé Fitness («Descanso»). **En Inicio**: contarla, no contarla o contarla con otra etiqueta en «N eventos». La Fase 4 no implementa ninguna de las dos de Horarios sin su respuesta |
| **TP-13** (podar o borrar) | Si se autoriza, aparecería una acción en `⋯` («Borrar versiones antiguas», etc.). Mientras no, **no existe ningún botón de vaciar** salvo la papelera global de siempre |
| **TP-14** (aviso de versión nueva) | Si se autoriza: un aviso «Hay una versión nueva de JosStyle · [Recargar]», de toda la app. Si no, no existe |
| **TP-15** (protección entre aparatos) | Si se implanta: el mensaje «Otro aparato guardó cambios en este horario a las HH:MM» en Revisar y guardar. Mientras no, ese mensaje no existe y nada promete esa protección |
| **TP-1 / TP-3** (push) | Hasta la Fase 7, en Ajustes → Notificaciones no hay ningún «Avisos con la app cerrada». Después, el botón con sus requisitos del iPhone dichos en pantalla |
| **TP-4** (diagnóstico) | Una pantalla de solo lectura con los recuentos, si él elige verla en la app (`docs/19` §12.2) |
| **TP-18** (el orden de los días) | 🔎 **RESUELTA por Josué el 2026-11-09**: siempre de lunes a domingo, en el móvil y en el escritorio, sin ningún control para reordenar. El orden guardado antes se conserva y no se usa para pintar (§4, §6.2, §11.2, `docs/19` §18.8) |

---

## 13. Componentes reutilizables

### 13.1 De JosStyle (se usan tal cual): §0.2

### 13.2 Nuevos de Horarios (se crean en la Fase 4, en archivos propios, sin tocar `ui.jsx`)

| Componente | Qué hace | Se apoya en |
|---|---|---|
| `LineaDeTiempoDia` | La agenda de un día, proporcional, con huecos resumidos y la hora actual | `Presencia`, `CambioDeContenido`, `useDeslizarParaCambiar` |
| `BloqueActividad` | Una actividad en la línea o en la rejilla: nombre, hora, chapa, «Cambiado» y «Coincide» | `Compartido` (continuidad hacia el detalle), tokens |
| `ChapaHorario` | Icono o iniciales del horario + color + nombre en `aria-label` | — |
| `RejillaSemana` (escritorio) | Las siete columnas proporcionales | `BloqueActividad` |
| `ListaSemana` + `MapaSemana` (móvil) | La semana en vertical y su mapa de ocupación | `ListaAnimada` |
| `HojaActividad` | El detalle de §9.1 | El patrón de hoja de JosStyle (portal, `z-capa`, `CAPAS.veloHoja`, `AsaHoja`, `useDialogoAccesible`) |
| `ElegirAlcance` | §9.2: tres opciones sin valor por defecto | `PistaInterruptor` o un grupo de radio con `role="radiogroup"` |
| `AvisoCoincidencia` | §10.1 y §10.2 | `MensajeDeCampo`, iconos con palabra |
| `TarjetaHorario` | Una tarjeta de Mis horarios con su estado y sus acciones | `Card`, `MenuElemento` |
| `FranjaBorrador` | §11.1 | Tokens `info` |
| `ResumenDeCambios` | §11.3 | `ListaAnimada` |
| `HojaVersiones` | §11.4 | Hoja |
| `CampoNombreConSugerencias` | El nombre con la procedencia de cada sugerencia (§9.3) | `TextInput` |
| `SelectorDias` | L M X J V S D (varios) | `ToggleTab` como patrón; botones de 44 px con `aria-pressed` |

Cada componente nuevo se integra en el Motion System **sin movimiento propio** (MS F20): entra por las clases de
`index.css`, las listas por `ListaAnimada` y las hojas por `useCapasMotion`.

---

## 14. Jerarquía de acciones

| Pantalla | Principal (una) | Secundarias visibles | En `⋯` |
|---|---|---|---|
| Horario · Día | — (tocar una actividad) | ‹ › · Hoy · Día/Semana · Mis horarios | Exportar · Avisos · Informe · Plan de estudio · Organizar (Fase 6) · Vista |
| Horario · Semana | — | Igual | Igual |
| Detalle | Cambiar este día | Editar la actividad | Duplicar · Mover · Eliminar · No hay este día · Notas |
| Mis horarios | + Crear un horario | Por tarjeta: su principal (Editar, Activar, Recuperar, Restaurar o Seguir) | Por tarjeta: §7.3. De la pantalla: Revisión · Copiar todos · Pegar una copia |
| Crear un horario | (tocar una opción) | — | — |
| Editor del borrador | Revisar y guardar | Añadir actividad · ↶ ↷ · Día/Semana | Días · Franjas horarias (con Generar franjas) · Buscar · Cambiar nombre y fechas · Guardar como plantilla · Descartar el borrador · (Semanas A/B: reservado, oculto mientras TP-5 esté pendiente) |
| Revisar y guardar | Guardar en mi horario | Seguir editando | — |
| Revisión | (por elemento) Resolver / Recuperar | Mantener así / Descartar | — |

**Reglas**:
- Ningún botón repetido en la misma pantalla con el mismo nombre (E3 F30): «Añadir actividad» en el editor y «Añadir algo
  solo este día» en la agenda se llaman distinto porque hacen cosas distintas.
- Lo destructivo nunca es la acción principal ni está a un toque sin aviso de deshacer.

---

## 15. Accesibilidad

- **Zonas táctiles de 44 px** (`toque-44`), también en ‹ ›, en los días del selector y en las chapas, que se pueden tocar en
  el detalle.
- **Texto de 12 px como mínimo** en lo que se lee, y 14 px en el cuerpo. Con la letra del sistema grande, nada se corta:
  sin alturas fijas por debajo de 44 px donde haya texto (EH F62).
- **El color nunca va solo**: las chapas llevan iniciales o icono; los estados, palabra e icono; las coincidencias, `◌` y
  «Coincide»; los dudosos de una importación, «Revisa…».
- **Contraste**: los colores de actividad y de horario son **fondos**; el texto encima usa `bestReadableText` / el token
  `textOnAccent` (EH F49), y el texto de acento, `ensureContrast` sobre la superficie real. 🔎 Concretado en §15.1
  (corrección 2026-11-09).
- **Lector de pantalla**:
  - Cada actividad: «Física, de 11:00 a 13:00, dos horas, horario Instituto, coincide con Piano».
  - Cada día del mapa, su resumen.
  - La navegación se anuncia (`AnuncioDeNavegacion`).
  - Las hojas: `role="dialog"`, `aria-modal`, foco dentro y foco de vuelta al cerrar (`useDialogoAccesible`).
  - `ElegirAlcance` es un `radiogroup`.
  - El selector de días usa `aria-pressed`.
- **Teclado** (escritorio):
  - Las flechas mueven entre días y actividades de la rejilla.
  - `Enter` abre y `Esc` cierra.
  - Mover y cambiar la duración también con botones.
- **Gestos**: deslizar entre días y arrastrar en el editor son **atajos**; siempre hay un botón que hace lo mismo (EH F50).
  Un dedo a menos de `bordeSistema` del borde no empieza un gesto («atrás» de Safari, MS F15).
- **Movimiento**:
  - Con «Reducir movimiento», fundidos sin desplazamientos (MS F1).
  - La hora actual no parpadea.
  - Nada vibra fuera del motor de audio (MS F12).
- **Formularios**: `aria-invalid` + `MensajeDeCampo` con `aria-describedby`; el foco lo marca la clase `campo` (MS F9).
- **Áreas seguras del iPhone**: la barra de «Revisar y guardar» y las hojas usan `velo-pie-seguro` y `caja-cabe`.

### 15.1 Contraste de las actividades y del aviso «Coincide» (corrección 2026-11-09)

**Medido** [EJECUTADO, en memoria, con `contrastRatio` y `bestReadableText` de `src/lib/colorEngine.js` sobre los diez
colores de `PALETA_ACTIVIDADES`]:

| Medida | Resultado |
|---|---|
| Ámbar `warning` (oscuro `#C9A24B`, claro `#8A6516`) sobre los 10 colores | Entre **1,02 y 2,25 : 1**. Ilegible: no se usa sobre un bloque de color |
| El mejor texto (`bestReadableText`) sobre cada color | ≥ 4,5 en 9 de los 10. **`#6270A0` se queda en 4,32** con cualquier texto |
| Texto sobre una pastilla de superficie opaca | **15,87** (oscuro: `text` sobre `surface`) y **17,44** (claro) |
| Icono ámbar sobre esa pastilla | **7,62** (oscuro) y **5,31** (claro) |

**1. El aviso «Coincide» dentro de un bloque**:
- **Una pastilla opaca**: fondo `COLORS.surface` **sin transparencia**, borde `COLORS.border`, texto `COLORS.text`, icono `◌`
  en `COLORS.warning` y la palabra «Coincide».
  - El contraste no depende del color de la actividad: las cifras de la tabla valen sobre cualquiera.
- **Además**, el bloque lleva un **contorno discontinuo de 2 px** en su color de texto legible, una señal que no es de color
  (≥ 3:1 frente al bloque).
- **Bloque estrecho** (menos de unos 120 px de ancho o menos de 32 px de alto): la pastilla solo con el icono `◌`, con el
  texto entero en el `aria-label` del bloque («Piano, de 17:00 a 18:00, Conservatorio, coincide con Tutoría») y en el
  detalle.
- **En listas** (semana del móvil, Revisión), que van sobre la superficie normal: el ámbar y la palabra directamente, sin
  pastilla.
- **La chapa de procedencia** sigue la misma idea: pastilla opaca con su borde (§5.3).

**2. El texto de cada actividad, según su fondo**:
- El nombre y la hora de un bloque usan **`bestReadableText(colorDeFondo)`**, que da texto oscuro o claro según el color.
  ⚠️ El prototipo pintaba blanco en todos y **no es representativo**: con la paleta real, 8 de los 10 colores llevan texto
  oscuro.
- La chapa, la pastilla de «Coincide» y la hora secundaria usan las mismas reglas.

**3. Corrección localizada de `#6270A0`, sin tocar el color guardado**:
- **Lo que pasa**: es un tono medio. Ni el texto oscuro ni el claro llegan a 4,5 (máximo 4,32 con texto casi negro).
- **Propuesta**: una función de presentación, `fondoLegible(hex)` (nombre provisional), que se aplica **solo al pintar**:
  - Si `bestReadableText(hex)` llega a 4,5, devuelve **el mismo color**: 9 de los 10 no cambian.
  - Si no, **oscurece** el tono en pasos del 2 % hasta que el texto claro llegue a 4,5. Para `#6270A0` basta un **6 %**:
    `#5C6996`, con texto `#F5F6F8` a **4,96 : 1** [EJECUTADO]. La alternativa sería aclararlo un 6 % (`#6B79A6`, con texto
    oscuro a 4,55), y se prefiere oscurecer porque el margen es mayor.
- **Lo que no cambia**: el valor guardado en la actividad sigue siendo `#6270A0` (regla 6); el selector de color sigue
  enseñando `#6270A0`; y vale igual para cualquier color propio que él elija y no llegue.
- **Exportación** (🔎 **decidido por Josué el 2026-11-09: opción B**): usa la misma función que la pantalla, así que el
  PDF y la imagen se leen igual. El color guardado no cambia y exportar no escribe nada (§5.6, `docs/19` §18.5).

**4. Pruebas de contraste que quedan definidas para la Fase 4** (Node, sin navegador):
1. Para **cada uno de los 10 colores** de `PALETA_ACTIVIDADES`: `contrastRatio(bestReadableText(fondoLegible(c)),
   fondoLegible(c)) ≥ 4,5`.
2. `fondoLegible(c) === c` en los 9 que ya llegan (no se toca lo que no hace falta).
3. La pastilla «Coincide» en los **dos temas** (`COLORS_OSCURO`, `COLORS_CLARO`) y en **alto contraste**
   (`CONTRASTE_ALTO_OSCURO`, `CONTRASTE_ALTO_CLARO`): texto ≥ 4,5 e icono ≥ 3 sobre `surface`. Su borde ≥ 3 frente al
   **peor** color de bloque.
4. El contorno discontinuo de una coincidencia: ≥ 3 frente a su bloque, en los 10 colores.
5. **Ninguna** regla de pintado pone `warning` como color de texto o de icono **sobre un bloque de color**: un barrido del
   componente lo caza, como `auditarAcabado` de Fitness.
6. Lo mismo con los **temas de acento** de `tokens.js` (`buildRolesFromAccent` puede cambiar las superficies), recorriendo
   los temas oficiales.
7. 🔎 **Exportación**: el color de cada actividad en el dibujo exportado es el mismo que en la pantalla, y la huella de
   `horarioTop` (y de `horarioVersiones`) es idéntica antes y después de exportar.

---

## 16. Criterios de aceptación

### 16.1 De esta fase (diseño)

| Criterio (prompt de la Fase 3) | Estado |
|---|---|
| Auditoría visual previa: diseño actual, componentes reutilizables, colores, tipografía, espacios, bordes, tarjetas, paneles en el móvil, patrones a conservar y complejidad | ✅ §0 |
| Sin sistema visual independiente; diseño global sin cambiar | ✅ §0.3, §13 |
| Navegación: Organización → Horario y Mis horarios, sin mezclar consulta y administración | ✅ §2 |
| Móvil: vista diaria principal, día anterior y siguiente, fecha, volver a hoy, procedencia, semana accesible, sin desplazamiento horizontal y sin ocultar información | ✅ §3, §5, §6.2 |
| Escritorio: lunes a domingo, horas, proporción, procedencia y detalle rápido | ✅ §4 |
| Agenda: navegación, vista según aparato, todos los activos, colores y categorías, procedencia, carga, vacío, error, detalle, acceso a Mis horarios, entrada al primer horario y nada sin acción | ✅ §5, §12 |
| 11:00–13:00 = un bloque continuo y proporcional | ✅ §4, §5.2 |
| Procedencia sencilla, sin recargar y sin depender del color | ✅ §5.3 |
| Mis horarios: los cuatro estados, acciones por estado, menú secundario y entrada de crear | ✅ §7 |
| Creación: tres opciones explicadas, sin «IA», sin formulario largo y sin perder el borrador | ✅ §8 |
| Detalle: información, acciones, procedencia, entidad vinculada y los tres alcances solo cuando hacen falta | ✅ §9 |
| Conflictos: qué, de qué horario, qué revisar y qué opciones; antiguos distintos de los nuevos; sin alarmas ni «Ponerlo igualmente» | ✅ §10 |
| Borradores y versiones: los seis estados, borrador frente a agenda, resumen previo y sin pantalla de historial | ✅ §11 |
| Simplicidad y jerarquía | ✅ §1, §14 |
| Los 12 estados especiales, no solo el caso ideal | ✅ §12 |
| Wireframes | ✅ En texto en cada apartado, más el prototipo (§17) |
| Decisiones pendientes como pendientes | ✅ §12.13 |
| Sin implementación funcional, datos, SQL, dependencias, commits, push, merge ni despliegue | ✅ (ver el informe de cierre) |

### 16.2 Para la Fase 4 (se comprobarán allí)

1. A 320, 375, 393 y 430 px (`CONTEXTOS_FISICOS`), Horario y Mis horarios **sin desplazamiento horizontal**
   (`scrollWidth ≤ innerWidth`).
2. Una actividad de 11:00 a 13:00 es **un** elemento en el DOM, con altura igual a dos veces la de una de una hora.
3. Una actividad fuera del rango visible **sigue apareciendo** (P3).
4. Las chapas aparecen solo con más de un horario activo y tienen `aria-label` con el nombre.
5. Ninguna pantalla enseña «columna», «choque», «IA» ni «Ponerlo igualmente» (barrido del texto pintado). «Franja» solo
   en la herramienta «Franjas horarias» del editor (corrección 2026-11-09).
5b. 🔎 Las funciones que se conservan tienen su sitio y funcionan: Buscar (agenda y editor), Franjas horarias con Generar
   franjas (con su aviso de impacto), y la validación en «Revisar y guardar». Semanas A/B: **ningún** control visible
   mientras TP-5 esté pendiente, y su configuración guardada intacta tras guardar un borrador.
5c. 🔎 Versiones: guardar una manual captura lo confirmado y no el borrador; una idéntica no se crea; renombrar y eliminar
   solo en las manuales; eliminar una quita solo esa; ninguna se elimina sola; y en desactivados funciona igual.
5d. 🔎 Las pruebas de contraste de §15.1.
5e. 🔎 Calendario e Inicio **sin cambios**: las clases del día del Calendario no se pueden tocar, y «Ver todas» de la
   tarjeta de Hoy sigue llevando al Calendario.
5f. 🔎 «Cada dos semanas» se ve y funciona con TP-5 pendiente; una actividad «cada dos semanas» en un horario con semanas
   A/B sigue su propia fecha de referencia.
5g. 🔎 Recuperar una versión guarda antes la copia `restauracion`, no borra ni cambia ninguna versión, y se detiene sin
   escribir nada si no puede comprobar las anteriores (sin conexión o un error simulado). Vaciar la papelera conserva las
   versiones del horario.
5h. 🔎 Se conservan «Tus asignaturas y actividades» (con archivar y recuperar), «Vaciar este día», «Próximos 7 días», y
   «Marcar este día como libre» funciona.
5i. 🔎 TP-18: con un horario cuyas columnas tienen `posicion` desordenadas, los días se pintan de lunes a domingo en el
   móvil y en el escritorio. No hay ningún control de orden. `posicion` es idéntico antes y después de guardar.
5j. 🔎 Versiones entre aparatos (`docs/19` §18.9, niveles 1 y 2 de sus pruebas), con dos aparatos simulados:
   - Una manual eliminada en A no reaparece tras escribir B.
   - Las versiones creadas a la vez en A y B están las dos.
   - Un renombre doble sale como conflicto para elegir.
   - Una marca sobre una automática se ignora.
   - Sin conexión no se escribe nada.
   - El autoguardado no crea ninguna versión.
5k. 🔎 Respuestas perdidas y escrituras viejas (con el doble):
   - Una respuesta perdida deja «Sin confirmar», nunca «hecho».
   - El reintento usa el mismo `opId` y no duplica.
   - Una escritura tardía con una `base` vieja no se aplica.
   - Dos instalaciones con el mismo id (un clon simulado) no se pisan nunca, se detecten o no. El cambio de id es
     orientativo: la prueba exige que no se pierda nada, no que se detecte el clon.
   - La misma operación (mismo `opId`) en dos filas sale **una sola vez**, y sus dos copias siguen guardadas.
     `version.id` es el `opId` de su creación.
   - Ninguna pantalla dice «sí se aplicó» ni atribuye una operación a un aparato.
   - `saveData` se niega a escribir `horarioVersiones:…`.
   - **No hay nada pendiente en `localStorage` ni en IndexedDB**: solo `aparato`, `confirmada` y `sesiones`.
   - ⚠️ Esto comprueba la lógica, no Supabase. **La condición real queda sin comprobar** hasta el nivel 3 o 4, que necesitan
     autorización.
6. Ningún texto pintado por debajo de 12 px; zonas táctiles de 44 px.
7. Cada estado de §12 tiene su caso en el banco de renderizado.
8. El recorrido de Chromium: crear un horario a mano, añadir una actividad de dos días, revisar, guardar, verla en la agenda
   conjunta, cambiar solo un día, la coincidencia bloqueada, archivar, eliminar y restaurar, y exportar.

---

## 17. Prototipo y comprobaciones

- **Prototipo estático aislado**: un HTML **fuera del repositorio** (en la carpeta temporal de la sesión) que dibuja las
  pantallas principales con los colores reales del tema oscuro de `tokens.js` y las tipografías de JosStyle.
  - Se fotografió a tamaño de iPhone y de escritorio con el Chromium de pruebas que ya existe.
  - **No forma parte de la aplicación**, no usa sus componentes y no es una implementación: sirve para ver la jerarquía y
    las proporciones.
- **Comprobaciones de esta fase**:
  - Que cada componente nombrado en §0.2 existe en el código (exportaciones leídas).
  - Las tipografías (`index.css`).
  - Los cortes (Tailwind por defecto: `sm` 640, `lg` 1024).
  - Los tamaños de letra de la pantalla actual (recuento en `HorarioView.jsx`).
  - Que los textos y la navegación coinciden con `docs/17`, el Anexo y `docs/19` §17 (§16.1).

🔎 **Estado del prototipo (comprobado el 2026-11-09)**:
- **Sigue disponible**, en la carpeta temporal de la sesión:
  `/tmp/claude-0/-home-user-JosStyle/be18ed71-8e74-5068-9a95-56909fd48a9f/scratchpad/proto-f3/`. Contiene:
  - `prototipo.html`
  - `capturar.cjs`
  - `horarios-f3-fila1.png` (md5 `4f06b6eb…`)
  - `horarios-f3-fila2.png` (`71741be4…`)
  - `horarios-f3-fila3.png` (`258d7dbd…`)
- **Es temporal**: no está en el repositorio, no está publicado y puede desaparecer si el contenedor de la sesión se
  recicla. Las capturas se le enviaron a Josué en la conversación.
- **Este documento es la referencia del diseño**, no el prototipo.
- **Ya no coincide con el diseño corregido** en tres cosas:
  1. Pinta el texto en blanco sobre todos los bloques (§15.1: lo correcto es `bestReadableText`).
  2. La marca «Coincide» va en ámbar sobre el bloque (§15.1: pastilla opaca).
  3. Dibuja el bloque «Descanso según tu plan», que es **una de las opciones de TP-7, no aprobada** (§12.13).
- No se ha rehecho ni publicado sin autorización.

### 17.1 Lo que enseñó el prototipo (problemas de usabilidad que la Fase 4 debe evitar)

1. **La chapa tapaba el nombre en los bloques estrechos**: «Pian[CO]», cuando dos actividades que coinciden se reparten el
   ancho. **Regla**: la chapa **reserva su sitio** a la derecha del bloque (el texto no pasa por debajo) y, en un bloque
   estrecho (menos de unos 120 px), **baja debajo del nombre**. Se corrigió en el prototipo y se comprobó en la segunda
   captura.
2. **«Coincide» en `warning` sobre el color de la actividad tiene poco contraste**: el ámbar sobre el rosa de Piano.
   🔎 **Regla corregida el 2026-11-09**: dentro de un bloque, la marca va en una **pastilla opaca** (§15.1), porque usar el
   texto legible del bloque no basta en todos los colores (`#6270A0` se queda en 4,32). El ámbar `warning` se reserva para
   la superficie normal.
3. **En la semana del móvil, la marca y la chapa se partían en dos líneas** («Piano ◌» y «CO» debajo). **Regla**: la fila
   tiene tres zonas fijas (hora · nombre con su marca · chapa) y el nombre es el único que puede saltar de línea.
4. **Riesgos que el prototipo no resuelve** [HIPÓTESIS, se medirán en la Fase 4]:
   - Las actividades de 15 minutos (16 px de alto) en el día del móvil.
   - Tres o más actividades que coinciden a la vez en una columna de escritorio (tercios de unos 50 px).
   - La trama del fondo del borrador con el tema claro y con alto contraste.

---

*Fase 3 de 8 terminada. Solo diseño: no autoriza la Fase 4 ni ninguna implementación, migración, SQL, dependencia,
despliegue o cambio de datos.*
