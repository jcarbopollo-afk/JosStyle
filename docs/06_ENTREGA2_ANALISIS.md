# JosStyle — ENTREGA 2: ANÁLISIS DE ALCANCE, SOLAPAMIENTOS Y VIABILIDAD

> Análisis de la segunda tanda de especificaciones (7 módulos, 106 fases, 50 016 líneas) frente al
> proyecto real en v1.22.0.
>
> **Estado: análisis. Nada implementado.** El desglose verificable está en
> `07_CHECKLIST_ENTREGA2.md`; la transcripción íntegra en `especificaciones/`.

---

## 1. Qué ha llegado

Un único archivo de **953 KB** que en realidad contiene **siete especificaciones de módulo
independientes**, cada una con su propio contexto general, su propia numeración de fases y su propia
regla de "una fase por turno":

| Cód. | Módulo | Fases | Líneas | % del documento |
|---|---|---|---|---|
| EH | Estilo de Hombre | 65 | 19 527 | 39 % |
| HT | Horario Top | 12 | 11 601 | 23 % |
| SR | Sonido y Rachas | 5 + 4 | 6 498 | 13 % |
| FO | Fondos y Fotografías | 12 | 5 967 | 12 % |
| AR | Armario JC Lifestyle | 4 | 3 747 | 7 % |
| BI | Buscador + IA + Inicio | 4 | 1 668 | 3 % |
| ME | Módulos activables + Eliminados | 4 | 1 008 | 2 % |
| | **TOTAL** | **106** | **50 016** | |

### Particularidades del documento que hay que conocer

1. **Orden inverso dentro de cada módulo.** Estilo de Hombre empieza por la Fase 65/65 y termina por
   la 1/65. La checklist ya está reordenada; la especificación original no se toca.
2. **Fragmentos de conversación intercalados.** Hay trozos de diálogo de Josué entre fases
   ("Sí. Ahora sí: pasamos directamente a la FASE 4/4…"), informes de estado ("FASE 2 COMPLETADA",
   "SISTEMA DE SONIDO: 100% COMPLETADO") y repeticiones parciales de fases.
   ⚠️ **Esos "COMPLETADA" son de otra conversación, no de este proyecto.** No hay ni una línea de
   código de estos 7 módulos en el repositorio.
3. **El bloque SR mezcla dos especificaciones** con numeración solapada — ver §5.

---

## 2. Dimensión real, dicha sin rodeos

| | Prompt Maestro (21 fases) | Entrega 1 · Ajustes (A1–A7) | **Entrega 2 (106 fases)** |
|---|---|---|---|
| Líneas de especificación | ~40 | 954 | **50 016** |
| Módulos construidos | 18 | 1 (Ajustes) | **7** |
| Estado | ✅ cerrado | ✅ cerrado | ⬜ **nada** |

**Estilo de Hombre por sí solo, con sus 65 fases y 19 527 líneas, es más grande que todo JC Fitness
construido hasta hoy.** El proyecto entero — Dashboard, Sueño, Salud, Nutrición, Calistenia,
Estudios, Negocio, Productividad, Objetivos, Diario, Biblioteca, Relación, Fe, Bienestar,
Estadísticas, Predicciones, IA, Personalización, Calendario, Seguridad y todo el motor de color —
salió de menos de mil líneas de especificación.

Esto no es un argumento para recortar nada. Es el dato que hace falta para planificar con
expectativas realistas: **la Entrega 2 no es "unas cuantas fases más", es un proyecto de varias veces
el tamaño del actual.**

Un dato adicional relevante: el bloque **AXION** (apartados 203–1300 de la Entrega 1) sigue sin
empezar y también está pendiente. Entre AXION y la Entrega 2 hay, sumadas, más de 1 200 fases y
apartados por delante.

---

## 3. Solapamientos con lo que ya existe

La propia especificación de Estilo de Hombre dedica sus apartados 4 y 5 a este problema
(*"JC Fitness ya tiene muchas funciones"* / *"regla absoluta contra duplicaciones"*). Estos son los
solapamientos concretos detectados:

### 3.1 Solapamientos grandes — hay que integrar, no crear

| Especificación nueva | Ya construido | Qué hacer |
|---|---|---|
| **ME · Fase 1** — módulos activables/desactivables | `PersonalizationView` + `personalizacion.ocultos` (Fase 19): ya permite ocultar/mostrar cualquier módulo de `MORE_NAV` con confirmación al ocultar y sin borrar datos | **Ampliar** lo existente: falta el aviso reforzado para módulos importantes y la extensión a módulos futuros |
| **ME · Fase 2** — personalización total | Misma vista: reordenar, cambiar icono, proteger con PIN, métricas favoritas, `dashboardOcultos` | **Ya está casi entero.** El hueco real es el editor de `dashboardOcultos` (**R3.1**) |
| **BI · Fase 2–4** — buscador global + IA | `UniversalSearchModal` (Fase 18, pregunta libre sobre `currentState`) + `SuggestionsButton` | **Ampliar**: hoy busca en *datos*, la especificación pide buscar *funciones, pantallas y ajustes* con índice, ranking y tolerancia a errores. Es una capa nueva sobre el mismo botón |
| **BI · Fase 1** — desplegable de Inicio | `IndicadorContexto` (v1.21.0): acordeón de Viaje/Vacaciones/Exámenes/Rutina normal | **Es literalmente el mismo componente.** La especificación pide expandirlo a "situaciones" configurables |
| **FO · Fases 4–9** — color, contraste, presets | `colorEngine.js` completo (OKLCH, WCAG, escalas de 11 pasos), `ColorPicker`, `TemaBuilder`, `GestionTemas`, 10 paletas, `ensureContrast` como red de seguridad | 🔒 **Bajo ningún concepto un segundo motor de color.** Lo genuinamente nuevo es: extracción de paleta desde una fotografía (FO 5) y el sistema "Recomendado" (FO 6) |
| **FO · Fase 12** — eliminados y recuperación | Nada equivalente | **Se solapa con ME · Fase 3.** Unificar: una sola papelera para toda la app |
| **HT · Fase 6** — calendario + agenda + HOY | Calendario Universal C1–C3 (motor, eventos derivados, recurrencia, Agenda, filtros, búsqueda) + Dashboard Centro de Control | **Conectar, no reconstruir.** HT debe alimentar `eventosDerivados()`, igual que hacen Estudios o Productividad |
| **HT · Fases 5, 7** — asignaturas, materiales | `EstudiosView` (programas, asignaturas, exámenes, horas) | **Reutilizar `estudios`.** Crear una segunda lista de asignaturas sería exactamente lo que la regla prohíbe |
| **HT · Fase 10** — notificaciones | `notificaciones.js` + 10 categorías + horario de descanso (A4) | **Ampliar.** La categoría "Calendario" que HT necesita ya está prevista en la especificación de A4 y falta por añadir |
| **HT · Fase 12** — Cloud + Supabase + RLS | `app_data` + RLS ya funcionando | **Reutilizar la tabla genérica**, no crear un esquema paralelo |
| **AR · Fase 3** — calendario de uso | Calendario Universal | Conectar como fuente derivada |
| **EH · Fase 5** — integración con el armario | AR debe existir primero | Dependencia dura |
| **EH · Fase 38** — notificaciones | A4 | Ampliar |
| **EH · Fase 39** — integración con JC Fitness | Todo lo anterior | Es una fase de conexión, no de creación |
| **SR** — rachas | Rachas de hábitos con lógica "en pausa" (Fase 8) + 12 insignias binarias (Fase 20) | ⚠️ **Conflicto de filosofía**, ver §4 |

### 3.2 Lo genuinamente nuevo

Estos no tienen equivalente y son trabajo real de creación:

- **EH**: todos los módulos de contenido (pelo, peluquería, skincare, cuerpo e higiene, barba, manos
  y pies, higiene bucal, perfumes, accesorios) — fases 7–26. Sistema transversal de **productos con
  afiliación**. Biblioteca de **contenido educativo**. Perfil de estilo.
- **HT**: el horario en sí (cuadrícula configurable), el **motor temporal** consciente de la hora
  real, la **mochila inteligente**, el **planificador de huecos**, la **analítica de uso del tiempo**.
- **AR**: prendas, outfits, historial de uso, **anti-repetición**.
- **FO**: fondos fotográficos, editor de imagen, **extracción de paleta desde la foto**.
- **SR**: toda la capa de **audio** (identidad sonora, motor, biblioteca de sonidos).
- **ME**: la **papelera universal** con recuperación.

---

## 4. Contradicciones con reglas ya vigentes del proyecto

Estas chocan con reglas que Josué mismo estableció antes. **Ninguna se resuelve sola: hay que
preguntárselo.**

### ✅ E2-C-01 · Gamificación sonora vs. "no sobregamificar" — **RESUELTA** (ver D2-02 en §7)

**Choque:** SR pide *"XP, recompensas, niveles, logros, rachas, milestones, récords personales"* con
identidad sonora propia y un "Centro de Rachas" con progresión.

**Contra:** las reglas 33 y 34 del proyecto (`docs/01_ESPECIFICACION_MAESTRA.md` §11) dicen
literalmente: *"No sobregamificar Bienestar digital — sin puntos, niveles, monedas ni rachas
nuevas"* y *"Logros: insignias binarias, nunca puntos/niveles/monedas"*. Ambas salieron de una
petición explícita del Prompt Maestro.

**Quién gana:** no está claro, y **no debe decidirlo la IA**. Es un cambio de filosofía de producto,
no un detalle de implementación.
❓ **Preguntar a Josué:** ¿la regla de no sobregamificar se deroga para toda la app, se mantiene solo
para Bienestar y Logros, o SR debe adaptarse a insignias binarias sin XP ni niveles?

### E2-C-02 · 🟠 "IA fuera de Estilo de Hombre" vs. las fases 56–61 del propio EH

**Choque:** el apartado 6 del contexto general de EH dice *"IA: PRÁCTICAMENTE FUERA DE ESTE
APARTADO"* y la regla de oro nº 5 insiste: *"No introducir IA salvo que una fase futura lo indique
expresamente"*. Pero las fases **56 (integración profunda con la IA)**, **57 (aprendizaje y
personalización progresiva)**, **58 (insights)**, **59 (resúmenes)** y **60 (recomendaciones
contextuales)** son exactamente eso.

**Resolución:** no es una contradicción real — la propia regla deja la puerta abierta ("salvo que una
fase futura lo indique expresamente"), y las fases 56–61 son esas fases. **Pero el orden importa:**
las fases 7–55 deben construirse **sin IA**, con reglas y datos, tal y como pide el apartado 6. Meter
IA antes de la fase 56 sería romper la especificación.

### ✅ E2-C-03 · Sistema de productos con afiliación de Amazon — **RESUELTA** (ver D2-03 en §7)

**Novedad sin precedente:** EH introduce un sistema transversal de productos con **enlaces de
afiliado**, packs, lista de compra, comparaciones y tiendas.

**Implicaciones que no están en la especificación:**
- Un **catálogo de productos** que alguien tiene que rellenar y mantener ("podrá actualizarse desde
  administración" — no existe ninguna administración en este proyecto).
- **Cumplimiento legal**: la afiliación de Amazon exige divulgación explícita (la especificación ya
  lo pide: *"cuando exista afiliación, debe indicarse de forma transparente"*) y tiene requisitos
  propios de programa.
- Es el **primer elemento comercial** de una app hasta ahora estrictamente personal.

❓ **Preguntar a Josué** antes de construirlo: ¿de dónde sale el catálogo? ¿Quién lo mantiene?
¿Tiene ya una cuenta de afiliados?

### E2-C-04 · 🟡 Wearables

EH prevé frecuencia cardíaca, sueño profundo, HRV y recuperación *"solo cuando el usuario tenga un
dispositivo compatible conectado"*. **Hoy no existe ninguna integración con wearables**, y una PWA en
iOS no puede leer HealthKit. La regla de la propia especificación resuelve el caso bien (*"si no hay
dispositivo, esas funciones simplemente no aparecen"*), pero conviene decirlo claro: **con la
arquitectura actual, no aparecerán nunca.**

### ✅ E2-C-05 · "Contenido educativo integrado en la aplicación" — **RESUELTA** (ver D2-04 en §7)

EH pide una biblioteca de guías, artículos y tutoriales *"preparado e integrado en la aplicación"*,
sin IA. Eso significa **escribir y mantener contenido editorial** — decenas o cientos de artículos.
No es trabajo de programación. ❓ Preguntar quién los escribe.

### 🟡 E2-C-06 · Cuatro sistemas de "ocultar cosas" — **resuelta en su parte de Inicio** (D2-07)

Si se implementa todo tal cual, la app tendría: `personalizacion.ocultos` (módulos de "Más"),
`personalizacion.dashboardOcultos` (tarjetas del Dashboard), los módulos activables de **ME**, y las
plaquitas activables de **EH**. **Son cuatro mecanismos para la misma idea.** Deben unificarse en uno
solo desde el principio, no fusionarse después.

### E2-C-07 · 🟡 Dos papeleras

**ME · Fase 3** y **FO · Fase 12** especifican, por separado, un sistema de "eliminados
recientemente". Debe ser **uno solo, global y reutilizable** — que es además lo que ME · Fase 4 pide
explícitamente.

---

## 5. El bloque SR: dos especificaciones, una numeración

`ESPECIFICACION_SONIDO_Y_RACHAS.md` contiene dos sistemas distintos cuyas fases colisionan:

| | Sistema de Sonido (5 fases) | Sistema de Rachas (4 fases) |
|---|---|---|
| Fase 1 | Base del sistema / arquitectura + motor global de audio | Arquitectura, reglas y lógica central de rachas |
| Fase 2 | Motor de sonido / biblioteca + categorías + asignaciones | Base de datos + Supabase + seguridad + sincronización |
| Fase 3 | Eventos, feedback y recompensas sonoras | Gamificación + hitos + logros + progresión |
| Fase 4 | Diseño y especificación de los sonidos individuales | UI/UX + Centro de Rachas + experiencia visual |
| Fase 5 | Producción, integración y test final | — |

En el documento original están **intercalados**, y la checklist los fusiona bajo `SR` porque no hay
forma automática de separarlos con certeza.

❓ **Pregunta abierta y bloqueante:** ¿son dos módulos independientes o un único sistema? Construirlos
mezclados sería caro de deshacer.

---

## 6. Orden de ejecución propuesto

Ordenado por **dependencia técnica**, no por el orden en que llegaron:

```
E2-0  R0 + R1 de la Entrega 1        ← arreglar lo roto y verificar la base ANTES de añadir
E2-1  ME · Módulos activables + Eliminados (4)    ← infraestructura que EH da por supuesta
E2-2  BI · Buscador + IA + Inicio (4)             ← amplía lo existente
E2-3  AR · Armario (4)                            ← EH dice literalmente "NO rehacer el armario"
E2-4  FO · Fondos y Fotografías (12)              ← se apoya en el motor de color existente
E2-5  SR · Sonido y Rachas (5+4)   ⚠️ aclarar antes si son uno o dos módulos
E2-6  HT · Horario Top (12)                       ← el más acoplado al Calendario existente
E2-7  EH · Estilo de Hombre (65)                  ← el mayor; depende de casi todos los anteriores
```

**Por qué EH va el último aunque Josué lo entregó primero:** su propio contexto general declara que
depende del armario ya construido (ap. 16), del sistema de fotos existente (ap. 17), del calendario y
los recordatorios globales (ap. 11), del sistema de módulos activables (ap. 2) y del sistema
transversal de productos (ap. 10). Construirlo antes que sus dependencias obligaría a rehacerlo.

**Por qué E2-0 va primero:** la Entrega 1 tiene un modelo de IA obsoleto que romperá toda la IA al
activar la clave (**C-11**), una puntuación diaria que muestra un dato falso (**C-12**) y **nada
verificado en ejecución real desde la Fase 8**. Añadir 106 fases encima de eso significa que, cuando
algo falle, no se sabrá si el fallo es de lo nuevo o de lo que ya había.

---

## 7. Decisiones de Josué — RESUELTAS

Las ocho preguntas de esta sección se le plantearon antes de empezar y **las ha contestado todas**.
Sus respuestas son vinculantes y están recogidas aquí en su forma operativa. Ninguna se reabre.

### D2-01 · Sonido y Rachas son **dos módulos independientes**

> *"Son dos módulos independientes, aunque estén relacionados. Cada uno debe mantener su propia
> estructura y fases. No mezclar especificaciones."*

**Consecuencia:** el bloque E2-5 se parte en dos — **SO · Sonido** (5 fases) y **RA · Rachas**
(4 fases), con su propia numeración, su propia checklist y su propia clave en `app_data`. La
numeración solapada que describe §5 se resuelve así, no fusionando. Ver también E2-C-01.

### D2-02 · La regla de "no sobregamificar" **NO se deroga**

> *"No se deroga la regla de no sobregamificar. Nada de puntos, niveles ni monedas en Bienestar. Si
> Sonido necesita XP/niveles/recompensas, debe quedar limitado exclusivamente al sistema de
> Rachas/Sonido y no contaminar el resto de la app."*

**Consecuencia:** **E2-C-01 queda resuelta.** La regla 34 sigue vigente sin excepciones en Bienestar
Digital. XP, niveles y recompensas existen **únicamente dentro de Sonido y Rachas** y no pueden:
aparecer en el Dashboard como puntuación global, sumar a la puntuación diaria, mostrarse en hubs de
otras áreas, ni convertirse en moneda que se gaste en ningún sitio. Es una frontera, no un permiso.

### D2-03 · Amazon: **arquitectura sí, afiliación no**

> *"Por ahora NO implementar afiliación ni catálogo comercial real. Dejar el sistema
> preparado/arquitecturado para poder añadirlo posteriormente. No inventar productos, API, cuenta de
> afiliados ni catálogo."*

**Consecuencia:** **E2-C-03 queda resuelta.** Se construye la capa de datos y la interfaz que un
catálogo usaría, con **cero productos dentro**. Prohibido explícitamente: inventar productos, URLs
de afiliado, precios o valoraciones. Donde la especificación pida "recomendaciones de productos", la
pantalla dice en una frase que todavía no hay catálogo — nunca un listado de ejemplo (regla 8).

### D2-04 · Contenido educativo: **estructura ahora, contenido después**

> *"El contenido lo definiremos/generaremos nosotros progresivamente. De momento, crear la
> estructura preparada para introducir guías y artículos, sin bloquear el desarrollo por tener todo
> el contenido escrito."*

**Consecuencia:** **E2-C-05 queda resuelta.** Las guías y artículos van en un módulo de datos
separado del código de la vista, para poder añadirlos sin tocar componentes. Una sección sin
artículos todavía **no se muestra vacía con un "próximamente"**: o no aparece, o dice en una frase
qué contendrá. Ninguna fase se da por bloqueada por falta de contenido.

### D2-05 · El orden de §6 se acepta

> *"Estoy de acuerdo. Estilo de Hombre debe ir de los últimos, respetando sus dependencias con
> Armario, Fotos, Calendario y módulos activables."*

**Consecuencia:** el orden E2-0 → E2-7 de §6 queda confirmado, con EH al final.

### D2-06 · AXION sigue pendiente, y **no bloquea**

> *"Mantenerlo pendiente, pero no dejar que bloquee las 106 fases actuales. Prioridad: completar
> primero el desarrollo actual; AXION se retomará después."*

**Consecuencia:** el bloque X de `docs/02_ORDEN_DE_FASES.md` se queda donde está, después de la
Entrega 2 completa. No se avanza en él ni se usa como excusa para no avanzar en lo demás.

### D2-07 · Inicio: **un solo sistema, no tres**

> *"Sí, hay solapamiento. No hacer tres sistemas distintos. Integrar el rediseño de Inicio con el
> Buscador, Módulos y dashboardOcultos, reutilizando lo existente y evitando duplicaciones."*

**Consecuencia:** **E2-C-06 queda resuelta en su parte de Inicio.** El rediseño de la pantalla de
Inicio **no es un módulo nuevo**: es trabajo dentro de BI (E2-2), y debe apoyarse en lo que ME ya
construyó — `personalizacion.dashboardOcultos`, `personalizacion.ocultos` y el catálogo de acciones
rápidas. Prohibido crear una cuarta lista de "qué se ve en Inicio".

### D2-08 · El nombre oficial es **JosStyle**

> *"El nombre oficial y definitivo del proyecto será JosStyle. JC Fitness, JC Lifestyle y JC STYLE
> quedan como nombres anteriores o referencias históricas. A partir de ahora, utiliza JosStyle como
> nombre principal del proyecto, tanto en la interfaz como en la documentación y desarrollo, salvo
> que una especificación concreta indique expresamente otro nombre."*

**Consecuencia:** **C-21 queda resuelta.** Ver la nota de aplicación en `docs/03` (C-21) para qué se
ha renombrado y qué se ha dejado intencionadamente como está.

---

## 7.bis Regla de trabajo añadida por Josué

> *"Si encuentras cualquier otra contradicción entre las 100 prompts, no la resuelvas por tu cuenta:
> detente y pregúntamela antes de implementar esa parte."*

Esto **cambia el protocolo de ejecución automática**. Hasta ahora, encontrar una contradicción se
resolvía documentándola y eligiendo la lectura más conservadora. A partir de ahora:

1. Una contradicción **nueva** entre especificaciones (no una ya listada en `docs/03` con decisión
   tomada) **detiene la fase afectada**, no la sesión entera.
2. Se anota en `docs/03_CONTRADICCIONES_DUPLICADOS_DEPENDENCIAS.md` con su identificador y se marca
   **⏸ PENDIENTE DE JOSUÉ**.
3. Se sigue con las fases que **no** dependan de ella. Pararlo todo por una contradicción de un
   módulo sería justo lo contrario de lo que Josué ha pedido.
4. La pregunta se le hace en el mensaje de cierre del turno, corta y con las opciones concretas.

Esta regla queda incorporada como **regla 49** en `docs/01_ESPECIFICACION_MAESTRA.md` §11.

---

## 8. Recomendación honesta

**Construir estos 7 módulos en orden y con la calidad que la propia especificación exige es un
trabajo de muchos meses, no de unas sesiones.** Cada fase pide análisis previo, implementación
completa, comprobación de que no rompe nada anterior y documentación — que es exactamente lo que
Josué ha pedido, y es lo correcto.

Tres cosas harían el proceso mucho más sólido:

1. **Verificar la base antes de ampliarla.** Un bloque R0+R1 corto tiene más valor que cinco fases
   nuevas encima de código nunca ejecutado.
2. **Empezar por los módulos pequeños que amplían lo existente** (ME, BI) en lugar de por el más
   grande. Dan resultado visible pronto y validan que la integración con lo ya construido funciona.
3. ~~**Resolver las 8 preguntas de §7 primero.**~~ ✅ Hecho: Josué las ha contestado todas y sus
   decisiones están en §7 como D2-01 … D2-08. Varias son decisiones de producto que, tomadas mal,
   cuestan semanas de trabajo rehecho.
