# JosStyle — LÍNEAS DE TRABAJO, HISTORIA Y ORDEN DE EJECUCIÓN

> Este documento responde a tres preguntas: **¿qué fases existen y de dónde vienen?**,
> **¿qué está construido de verdad?** y **¿en qué orden hay que hacer lo que queda?**

---

## PARTE A — Las 9 líneas de trabajo ("tracks")

El proyecto no es una única secuencia de fases. Son **nueve líneas de trabajo independientes**, con
numeraciones propias que se solapan. Confundirlas es el error más fácil de cometer al retomar el
proyecto: hay una "Fase 1", "Fase 2" y "Fase 3" en **tres tracks distintos** (Prompt Maestro,
Personalización Visual y Calendario), y una "Fase 3" del Calendario que no tiene nada que ver con la
"Fase 3 — Salud" del Prompt Maestro.

| Track | Nombre | Origen | Numeración | Estado |
|---|---|---|---|---|
| **M** | Prompt Maestro | Josué, pegado en el chat de la Fase 11 | Fases 1–21 | ✅ **CERRADO** (v1.0.0) |
| **A** | Ajustes / Entrega 1 | `ESPECIFICACION_AJUSTES_ENTREGA1.md`, apartados 1–202 | Fases A1–A7 | ✅ **CERRADO** (v1.6.0 + A7) |
| **X** | AXION | Misma especificación, apartados 203–1300 | — | ⛔ **BLOQUEADO** — requiere conversación de diseño |
| **N** | Navegación por áreas | Prompt propio de Josué | Fases N1–N4 | ✅ **CERRADO** (v1.10.0) |
| **V** | Personalización Visual Extrema | "Contexto maestro" propio de Josué | Fases 1–4 (aquí V1–V4) | ✅ **CERRADO** (v1.14.0) |
| **C** | Calendario Universal | Prompt maestro propio de 3 fases | Fases 1–3 (aquí C1–C3) | 🟡 **C3 PARCIAL** (v1.17.0 + v1.22.0) |
| **S** | Seguridad Centralizada | Especificación propia de 14 apartados + añadido | — | 🟡 **PARCIAL** (v1.18.0) |
| **U** | Optimización móvil | Especificación propia de 12 apartados | — | 🟡 **PARCIAL** (v1.19.0) |
| **D** | Dashboard — Centro de Control | Especificación propia de 23 apartados | — | 🟡 **PARCIAL** (v1.20.0 + v1.21.0) |

*(Más un track de limpieza, **L**, sin numeración: la auditoría de notas internas de v1.22.0.)*

---

## PARTE B — Historia real, versión a versión

### Track M — Prompt Maestro (Fases 1–21)

| Fase | Contenido | Estado real |
|---|---|---|
| 1 | Dashboard, Sueño, Entrenamiento, Economía; modo oscuro; paleta azul metálica con selector de acento | ✅ verificada por Josué en ejecución real |
| 2 | **Backend real**: Supabase (login, BD, sync), migración fuera de Artifacts a proyecto Vite, exportación CSV/Excel, historial + deshacer, mecanismo de PIN preparado, `manifest.json`, `SETUP.md` | ✅ verificada por Josué (schema ejecutado, `npm install`/`npm run dev` OK) |
| 3 | **Salud** | ✅ verificada |
| 4 | **Nutrición** (+ reestructuración de la barra a 4 accesos + "Más") | ✅ verificada |
| 5 | **Calistenia a fondo + Fútbol** | ✅ verificada (el riesgo de CORS al leer fotogramas de un vídeo remoto **no se materializó**) |
| 6 | **Estudios** (+ primera correlación sueño↔estudio) | ✅ verificada |
| 7 | **Negocio** | ✅ verificada |
| 8 | **Productividad** | 🟡 código completo, **nunca ejecutada de verdad** |
| 9 | **Objetivos** | 🟡 código completo, nunca ejecutada |
| 10 | **Diario** | 🟡 código completo, nunca ejecutada |
| 11 | **Biblioteca** (+ dependencia `pdfjs-dist`, requiere `npm install`) | 🟡 código completo, nunca ejecutada |
| 12 | **Relación** (privado, `PinGate` sobre el módulo entero) | 🟡 código completo, nunca ejecutada |
| 13 | **Recordatorios románticos** (11 chips dentro de Relación) | 🟡 código completo, nunca ejecutada |
| 14 | **Fe y vida espiritual** | 🟡 código completo, nunca ejecutada |
| 15 | **Bienestar digital** | 🟡 código completo, nunca ejecutada |
| 16 | **Estadísticas y correlaciones** | 🟡 código completo, nunca ejecutada |
| 17 | **Predicciones** | 🟡 código completo, nunca ejecutada |
| 18 | **IA con memoria a fondo** (multimodal, buscador universal, sugerencias) | 🟡 código completo, nunca ejecutada |
| 19 | **Personalización total** | 🟡 código completo, nunca ejecutada |
| 20 | **Funciones transversales avanzadas** | 🟡 **parcial** — ver aviso abajo |
| 21 | **Pulido final y QA** (3 pasadas: colores → exportación/tono de IA → repaso visual) | ✅ cerrada, con el límite honesto de ser lectura de código, no la app renderizada |

> ⚠️ **La Fase 20 se dio por cerrada sin construir dos de sus cinco piezas.** El Prompt Maestro
> pedía: *"Centro de logros y mapa de vida. **Revisión automática semanal/mensual/anual. Sistema de
> puntuación diaria (ese punto intermedio entre informativo y juego).** Motor de automatizaciones
> empezando por 2-3 fijas. Plantillas y modos viaje/vacaciones/exámenes."*
> Se construyeron Logros + Mapa de vida, las 3 automatizaciones fijas y los 3 modos. **La revisión
> automática periódica nunca se construyó** (lo que existe es el aviso de revisión de Objetivos a los
> 30 días, de la Fase 9, que es otra cosa), y **el sistema de puntuación diaria tampoco** — la
> `ScoreGauge` del Dashboard es una heurística de la Fase 1 que además está rota (ver **C-12**).
> Estas dos piezas se recogen abajo en el bloque **R4**.

**Pospuesto indefinidamente por el propio Prompt Maestro** ("para más adelante, no ahora"): editor
visual de automatizaciones · API externa · chat único de IA con acceso a todos los módulos a la vez.
Añadidos después a esa lista: funciones nativas de Bienestar digital · acceso propio de la pareja al
módulo de Relación · constructor de módulos arbitrarios desde cero.

### Track A — Ajustes (A1–A7)

| Fase | Apartados | Versión | Estado |
|---|---|---|---|
| **A1** | 1–48 | v1.1.0 | ✅ `SettingsView` reescrito como centro de categorías con el orden fijo del apartado 4 |
| **A2** | 49–78 | v1.2.0 | ✅ Perfil expandido a 7 tarjetas y 26 campos + exportar/importar/restablecer |
| **A3** | 79–110 | v1.3.0 | ✅ Tema Claro/Oscuro/Automático real, tamaño de texto, radios, animaciones |
| **A4** | 111–138 | v1.4.0 | 🟡 Notificaciones reales (sin Web Push) |
| **A5** | 139–172 | v1.5.0 | 🟡 Biometría WebAuthn + bloqueo automático |
| **A6** | 173–202 | v1.6.0 | 🟡 Privacidad: transparencia + borrado por categoría |
| **A7** | (ap. 43, 86, 91) | registrada retroactivamente en v1.23.0 | ✅ Alto contraste, las 7 paletas predefinidas originales y la densidad — esta última **no llegó a funcionar hasta el bloque R0** (v1.23.0). Ver **C-02** y **C-01**, ambas resueltas |

### Track N — Navegación por áreas

| Fase | Versión | Contenido |
|---|---|---|
| **N1** | v1.7.0 | Estructura de 5 pestañas + `AREAS_NAV` + `HubView` + `resumenesHub` + cascada de 80 ms + `moduleSlideIn` + barra "← Área" |
| **N2** | v1.8.0 | `--ease-premium`, escalados, `hubHeaderIn`, `backBarIn` — efecto de capas |
| **N3** | v1.9.0 | Microinteracción de pulsación: `:active` → expansión → navegación a los 190 ms |
| **N4** | v1.10.0 | Cristal/`backdrop-filter`, indicador de estado por tarjeta, jerarquía tipográfica, píldora de volver |

🔒 **No hay N5 planificada.** Cualquier ajuste futuro a esta parte es pulido puntual.

### Track V — Personalización Visual Extrema

| Fase | Versión | Contenido |
|---|---|---|
| **V1** | v1.11.0 | `colorEngine.js` (OKLCH, contraste WCAG, escalas de 11 pasos, roles derivados) + migración de ~20 colores hardcodeados. **Hallazgo real:** `#080A0D` era texto fijo sobre cualquier botón de acento — ilegible con acentos oscuros. Ahora `COLORS.textOnAccent` garantiza AA en los 24 casos (12 acentos × 2 temas) |
| **V2** | v1.12.0 | `ColorPicker.jsx`: espectro 2D HSV, slider de tono, HEX/RGB/HSL, favoritos/recientes, copiar/pegar, cuentagotas con detección de función. **Separación preview/commit** para no saturar Supabase durante un arrastre |
| **V3** | v1.13.0 | `TemaBuilder.jsx`: override por rol, Secundario/Terciario derivados por rotación ±35°, Estados en sección avanzada colapsada, red de seguridad de contraste en `aplicarTema()` |
| **V4** | v1.14.0 | `GestionTemas.jsx`: 10 paletas predefinidas (3 nuevas con overrides reales), CRUD de temas propios con límite 12, exportar/importar `.json`, `modoColorAvanzado`, `aplicarConjuntoTema` atómica |

🔒 **Las 4 fases están completas.** Una ampliación futura sería una 5ª fase, a describir antes de
escribir código.

### Track C — Calendario Universal

| Fase | Versión | Estado |
|---|---|---|
| **C1** — Motor y calendario base | v1.15.0 | ✅ completa |
| **C2** — Calendario inteligente e integración | v1.16.0 | ✅ completa (con dos exclusiones que luego cambiaron) |
| **C3** — Experiencia premium | v1.17.0 | 🟡 **primera pasada**: recurrencia, Agenda, filtros, búsqueda. El resto sigue abierto |
| *Finalización parcial* | v1.22.0 | ✅ fechas recurrentes de Relación, con privacidad condicionada |

### Tracks S / U / D / L — especificaciones puntuales posteriores

| Versión | Track | Contenido |
|---|---|---|
| v1.18.0 | **S** | Seguridad Centralizada: hash SHA-256+salt, `protectedAreas`/`protectedActions`, verificación centralizada, sesión temporal, recuperación por correo, migración sin pérdida. **10 comprobaciones obligatorias trazadas a mano sobre el código** |
| v1.19.0 | **U** | Optimización móvil: **corrección del bug de `containing block`** con `createPortal` en los 10 overlays, `ListCard`/`ListRow`, compactación de Hoy/Sueño/Economía/Entreno |
| v1.20.0 | **D** | Dashboard Centro de Control: 3 niveles, deep-link en 6 vistas, acciones rápidas, `dashboardOcultos` |
| v1.21.0 | **D** | `IndicadorContexto` acordeón + acceso directo a Agenda |
| v1.22.0 | **L** + **C** | Limpieza de notas internas + fechas recurrentes de Relación |

### Track E2 — Entrega 2 (7 módulos nuevos, 106 fases)

| Versión | Bloque | Contenido |
|---|---|---|
| v1.23.0 | **R0** | Modelo de IA vigente, puntuación diaria real, densidad de interfaz real, saneado documental. **Además: `npm` volvió a funcionar** — desde aquí todo se compila y se prueba de verdad (`scripts/verificar.sh`) |
| v1.24.0 | **ME F1** | Módulos activables/desactivables: catálogo con descripciones, dependencias, aviso reforzado, y el Dashboard respetando por fin lo desactivado |
| v1.25.0 | **ME F2** | Personalización total: **"Mi pantalla de inicio"** (cierra **R3.1**), perfiles rápidos (Completo/Estudiante/Fitness/Minimalista) |
| v1.26.0 | **ME F3** | Papelera global "Eliminados recientemente": 26 colecciones, retención configurable, restauración en su posición original, Relación enmascarada mientras esté bloqueada |
| v1.27.0 | **ME F4** | Integración global y **auditoría ejecutable**. Tapó 8 huecos de borrado que nadie había visto, añadió la 27ª colección a la papelera (programas de Estudios) y aplicó el **renombrado a JosStyle** |
| v1.28.0 | **BI F1** | Desplegable de situación de Inicio: las tres situaciones se activan desde ahí, en vez de solo leerse. Descubrió el fallo de **botones anidados**, ahora comprobado en las 13 vistas |
| v1.29.0 | **BI F2** | Buscador de funciones: escribir "colores" abre Apariencia. Índice derivado de `MORE_NAV`, con la lupa mudada arriba a la izquierda |
| v1.30.0 | **BI F3** | El motor de verdad: sinónimos, plurales, erratas (Damerau), acciones directas, sugerencias y recientes. Dos bugs de ranking encontrados por las pruebas |
| v1.31.0 | **BI F4** | Intención del usuario: navegación / pregunta / **acción**. Cierra el bloque BI. Arreglada la vuelta atrás desde el buscador |
| v1.32.0 | **AR F1** | Armario digital: el primer módulo **nuevo** de la Entrega 2. 21 campos por prenda desde el día uno, para que las fases 2-4 no exijan migración |
| v1.33.0 | **AR F2** | Constructor de outfits: referencias en vez de copias, y borrar una prenda ya no rompe nada — se conserva el vínculo para que restaurarla cure el outfit sola |
| v1.34.0 | **AR F3** | Calendario e historial de uso: cada uso es un registro independiente y **todos los contadores guardados desaparecen** — se derivan. Destapó dos fallos de UTC en `helpers.js` que afectaban a toda la app |
| v1.35.0 | **AR F4** | Anti-repetición, estadísticas y recomendaciones explicadas. **Cierra el bloque AR.** Sin una sola llamada a la IA: todo son reglas sobre el historial real |
| v1.36.0 | **FO F1** | Arquitectura del sistema de fondos: cinco tipos, cadena de prioridad que nunca deja un hueco, y el fondo dentro de `apariencia` en vez de un sistema paralelo |
| v1.37.0 | **FO F2** | Fotografía de fondo: elegir → previsualizar → aplicar, con encuadre inicial según la orientación y sin perder el color anterior |
| v1.38.0 | **FO F3** | Editor de fotografía: zoom, encuadre libre, desenfoque, luz y tinte, sobre un borrador para que Cancelar funcione de verdad |
| v1.39.0 | **FO F4** | Colores avanzados: **transparencia de tarjetas y barra**, la pieza sin la cual poner una foto de fondo no servía de nada |
| v1.40.0 | **FO F5** | Detector de colores en el dispositivo, sin IA. Frecuencia ≠ utilidad: el color que más ocupa no es el mejor acento |
| v1.41.0 | **FO F6** | Sistema Recomendado: cinco apariencias completas sacadas de la foto, con probar y volver. Destapó un fallo real en `ensureContrast` |
| v1.42.0 | **FO F7** | Personalización manual: los cuatro campos que F4 dejó sin control, más intensidad de bordes y sombras |
| v1.43.0 | **FO F8** | Presets de apariencia: colores **y fondo** juntos. "Activo" se decide por lo que se ve, no por el id |
| v1.44.0 | **FO F9** | Legibilidad inteligente: el fondo efectivo se **compone** capa a capa y se mide por zona. Detectar no es corregir |
| v1.45.0 | **FO F10** | Aspecto ordenado: vista previa global y seis secciones plegables. No añade funciones, ordena las que ya había |
| v1.46.0 | **FO F11** | Rendimiento: la foto se sube optimizada (4 MB → ~400 KB) y las URLs firmadas se cachean. El coste real estaba ahí, no en los efectos |
| v1.47.0 | **FO F12** | Eliminados y recuperación. **Cierra el bloque FO.** En Apariencia no se borra nada: la foto sustituida sigue en Storage, así que recuperar es volver a apuntar a ella, no restaurar una copia |

| v1.48.0 | **RA F1** | Motor de rachas: **todo derivado del historial, ni un contador guardado**. Destapó que el récord de los hábitos se podía inflar desmarcando y volviendo a marcar el mismo día |

| v1.49.0 | **RA F2** | Persistencia y servicio central: las rachas en `app_data` en vez de tablas propias, **sin un solo SQL nuevo que ejecutar**. Cola offline idempotente e invalidación por origen |

| v1.50.0 | **RA F3** | Gamificación: hitos irrepetibles, doce logros y progresión. **Sin XP ni niveles** — los apartados los dejan en condicional y no hacían falta. Un logro conseguido no se revoca al corregir el historial |

| v1.51.0 | **RA F4** | Centro de Rachas: módulo nuevo en el área Vida, racha principal en Hoy, calendario compacto, logros y celebración **agrupada**. Cierra el bloque RA |

| v1.52.0 | **HT F1** | Arquitectura de Horario Top: **el horario es una regla, no una lista de eventos**. Y las asignaturas no se duplican — se apuntan a las de Estudios |

| v1.53.0 | **HT F2** | Modelo de datos: **el apartado 51 obliga a adaptarse al proyecto**, así que ni una tabla nueva ni un SQL pendiente. Materiales como entidades, mochila derivada y detección de conflictos entre dispositivos |

| v1.54.0 | **SO F1** | Sistema global de sonido: motor central, bus de eventos y **regla invariante nueva** que impide tocar el audio fuera de él. Hoy no suena nada porque no hay archivos, y eso está dicho |

| v1.55.0 | **HT F3** | Editor visual: módulo nuevo con cuadrícula, día y agenda. Tocar celda + escribir crea y **reutiliza** la asignatura, y "solo este lunes" no puede cargarse todos los lunes |

| v1.56.0 | **HT F4** | Configuración avanzada: semanas A/B **calculadas desde una fecha ancla, nunca guardadas**, y toda operación que pueda dejar clases fuera de sitio enseña el impacto **antes** de escribir. Archivar en vez de borrar; zoom y densidad al aparato, no a Supabase |

| v1.57.0 | **HT F5** | La actividad deja de ser texto: identidad, color, icono, profesor, aula, exámenes y tareas. **Todo lo derivable se deriva** y **las notas privadas no viajan en el contexto de la IA** |

| v1.58.0 | **HT F6** | El motor de contexto temporal y HOY: ahora, siguiente, pendiente y mañana. **No guarda una copia de nada** (apartado 102) y **el 90 % del trabajo fue no volver a construir** lo que el proyecto ya tenía |

| v1.59.0 | **HT F7** | La mochila inteligente: día → actividades → materiales → mochila, derivada entera. **Lo que añades a mano no se borra solo**, una libreta es una libreta pero dos hojas y tres son cinco, y **sin castigo** cuando falta algo |

| v1.60.0 | **HT F8** | Motor temporal y automatizaciones: **pasada no es completada**, el estado se calcula del reloj, **la excepción gana a la regla** y nada importante se ejecuta sin confirmar |

| v1.61.0 | **HT F9** | El planificador: **determinista, y la IA va después de él y antes de la confirmación**. Sin confirmar no se escribe nada, el contexto lleva los números ya calculados y **nunca salen las notas privadas** |

| v1.62.0 | **HT F10** | El motor de DECISIÓN de avisos, separado del emisor que ya existía. **Que exista un evento no significa avisar**, tres avisos se agrupan en uno y **no molestar se respeta también con lo crítico** |

| v1.63.0 | **HT F11** | Analítica personal **sin caja negra**: cada cifra con su origen, los patrones como frases con sus números dentro, y **sin datos no se inventa una tendencia**. Describe, no juzga |

| v1.64.0 | **HT F12** | **Cierra el bloque HT (12/12).** Una sola puerta al módulo, exportar/importar idempotente y **una auditoría comprobada contra el código**: si alguien borra una función, falla sola |

| v1.65.0 | **SO F3** | El catálogo entero (42 eventos) y la jerarquía: **un solo sonido cuando pasan cinco cosas a la vez**, el récord gana al milestone, y la racha **sube de identidad** con los días. Se adelanta a F2, que sigue bloqueada por los archivos de audio |

| v1.66.0 | **SO F4** | La biblioteca sonora **definida como código**: familias, duraciones, la firma en intervalos, qué es único y qué lleva variantes, un validador y `queFalta()`. Convierte "dame los sonidos" en una lista precisa |

| v1.67.0 | **EH F1** | **Empieza el último bloque y el más grande (65 fases).** La arquitectura modular: trece apartados en un catálogo donde **añadir uno es añadir una línea**, un normalizador que aguanta el catálogo cambiando en las dos direcciones, `alternarModulo` **que no toca los datos jamás**, y `FUENTES_GLOBALES` para que el apartado 10 —*no dupliques lo que ya existe*— sea una función y no un recordatorio |

| v1.68.0 | **EH F2** | La gestión de apartados de verdad: siete categorías, buscador con sinónimos (*"pelo"* encuentra Barba, que es el ejemplo del enunciado), ↑↓ que se mueven **dentro de los activos**, recomendados **sin IA** y ficha. Y **arregla un fallo real de F1**: un módulo retirado del catálogo perdía sus datos en el siguiente guardado — ahora va a cuarentena |

| v1.69.0 | **EH F3** | El asistente de primera entrada: cuatro pasos, **saltable en tres de ellos**, recuperable a medias y **sin preguntar nada que JosStyle ya sepa** — el peso, la altura y el nombre se LEEN de su módulo y no se copian, con pruebas que fallan si aparecen guardados. Encontró dos fallos reales: modificar y confirmar reordenaba las plaquitas, y pulsar "Empezar" enseñaba *"lo dejaste a medias"* |

| v1.70.0 | **EH F4** | La capa de datos compartidos: **una sola función lee**, venga el dato de Salud o de aquí dentro, y devuelve la misma forma — y su gemela **se niega a escribir un dato global**, con el sitio donde sí se edita. *"No puede existir Perfil → 72 kg, Estilo de hombre → 70 kg"* escrito como código. Historial opcional y declarado, antigüedad que describe sin juzgar, y dependencias que **no rompen**: enseñan una frase, no un error |

| v1.71.0 | **EH F5** | El armario **conectado, no reconstruido**: cero prendas guardadas aquí, y una prueba que lee el código fuente y falla si este archivo puede escribir en él. **Un solo perfil de tallas**, derivado de las prendas, con el choque enseñado en vez de resuelto en silencio. Y un fallo real encontrado: leía `ocasiones` donde un outfit guarda `ocasion` |

| v1.72.0 | **EH F6** | El perfil de estilo: once campos, **todos opcionales y sin almacén propio** —viven en la capa de la Fase 4, una línea cada uno—, con los colores, las marcas y las ocasiones **prestados del armario**. *"Lo que refleja tu armario"* no clasifica prendas: va de la ocasión que él eligió al estilo, y por debajo de cuatro prendas no afirma nada |

| v1.73.0 | **EH F7** | El perfil capilar, y con él **el motor de cuestionarios** que usarán Skincare, Cuerpo, Barba, Manos y Perfumes. ⚠️ **No guarda nada por su cuenta**: lo compartido va a la capa de F4 y lo del módulo a su `config`, y esa única decisión hace pasar tres tests a la vez. **"No lo sé" es una respuesta**, cuenta como contestada y es exclusiva. Y no se diagnostica nada |

| v1.74.0 | **EH F8** | Rutinas capilares y seguimiento. **No castigar**: un día sin hacer es "Pendiente", con nueve pruebas sobre el peor escenario, y **sin días en los que tocara no hay cumplimiento** —decir "0 %" de algo que nunca tocó es el mismo reproche—. **Nada materializado**: "cada 3 días" guarda su regla, y un año de eventos deja el estado por debajo de 3 KB. Entra en el Calendario que ya existe |

| v1.75.0 | **EH F9** | El motor de recomendaciones capilares, **sin IA y comprobado sobre el código**. ⚠️ **Si un dato no existe no se asume**: cada regla declara qué necesita y con el perfil vacío salen CERO. **Nunca "debes"**, con una prueba sobre todos los textos posibles. Y **una recomendación no modifica nada**: `aplicarARutina` exige confirmación, y la prueba compara el estado byte a byte |

| v1.76.0 | **EH F10** | Productos capilares: **la arquitectura entera y el catálogo vacío** (D2-03, y el propio enunciado dice lo mismo). ⚠️ **Ni un enlace inventado** —una "url" que no lo es se guarda como `null` y se dice— ni una función que compre, con pruebas sobre el código. **No disponible no es borrado**, y **el pack sugerido sugiere, no crea** |

| v1.77.0 | **EH F11** | Peluquería: el calendario de cortes. ⚠️ **Evento planificado y corte que ocurrió son dos listas, no una** (apartado 15): borrar la cita no puede tocar el historial porque no tiene manera de hacerlo. **`frecuenciaDeCorte` enseña el choque** entre el perfil y lo puesto a mano, como `tallaDe`. **Sugerir no es reservar**, y `avisoDeCorte` DECIDE mientras `notificaciones.js` manda. Dos fallos silenciosos cazados: "en X semanas" sin la X planificaba para HOY, y `'25:99'` pasaba por hora |

| v1.78.0 | **EH F12** | El perfil de corte y sus recomendaciones. ⚠️ **El apartado 5 ya lo preguntó la Fase 7**, con las mismas cinco opciones: se LEE de allí y se dice dónde se cambia, así que el perfil tiene seis preguntas y no siete (D-15). **Los niveles 🟢🟡🔴 se importan de la Fase 6** con los nombres de Josué. **Añadir un corte es añadir una línea**, y la lista es ampliable de verdad. **Nada sin confirmar**, con prueba byte a byte. Y **el historial no diagnostica**: con un corte valorado bien no se afirma nada |

| v1.79.0 | **EH F13** | Empieza Skincare. ⚠️ **El apartado 15 ya era código**: la Fase 4 declaraba `tipoPiel` y `sensibilidadPiel` como datos de esta fase, así que se reutilizan solos y `destinoDe()` lo decide, no un `if`. **El formulario adaptativo vive en el motor** —`cuando` + `preguntasVisibles()`— porque Barba, Cuerpo, Manos y Perfumes van a querer lo mismo. Y **esconder no es borrar**. **Objetivos de cuidado, nunca un diagnóstico**, con prueba sobre todos los textos. **Apartado 17: esto no sale de aquí** |

| v1.80.0 | **EH F14** | Rutinas de skincare. ⚠️ **El apartado 19 se titula "NO DUPLICAR" y esta fase pedía la máquina de la Fase 8**, así que lo genérico se extrajo a `motorRutinas.js` y lo usan los dos — **las 171 pruebas de F8 pasaron sin tocar ni una**. **Omitir no es fallar**: un paso omitido sale de la cuenta, así que dos hechos y uno omitido es una rutina HECHA. **Los productos son los de F13**, las **plantillas sugieren** y **cambiar de nivel no borra la rutina anterior** |

| v1.81.0 | **EH F15** | Seguimiento de la piel. 🐛 **Y un fallo REAL y grave encontrado de paso: `App.jsx` nunca importó `papelera.js`**, así que la app lanzaba un `ReferenceError` en el primer render — invisible para el build y para las 648 pruebas de renderizado. Lo cazó una **regla invariante nueva**, escrita justo después de cometer el mismo fallo. ⚠️ **Ni otro diario, ni otra papelera, ni otra exportación, ni rachas, ni causalidad**: las cinco prohibiciones del enunciado, con pruebas |

| v1.82.0 | **EH F16** + 🚨 **DOS FALLOS QUE IMPEDÍAN QUE LA APP ARRANCARA** | **La aplicación llevaba meses sin funcionar, y ninguna de las 5 800 comprobaciones lo veía.** (1) `App.jsx` nunca importó `papelera.js`: `purgarCaducados` lanzaba un TypeError EN MITAD de la carga, sin `try/catch`, así que **`setEstiloHombre`, `setArmario`, `setHorarioTop`, `setRachas` y `setAudio` no llegaban a ejecutarse** — ningún módulo de la Entrega 2 cargaba sus datos. (2) Cinco hooks estaban DESPUÉS de los `return` condicionales (regla 4): React lanzaba *"Rendered more hooks…"* y **tumbaba la app entera**. Las dos cosas explican por qué la interfaz "seguía igual" por más fases que se construyeran. Arreglado, y **`scripts/test-app-real.mjs` abre la app en Chromium** y comprueba la cadena entera. Además, EH F16: el motor de recomendaciones, extraído y compartido con F9 y F12 |

| v1.83.0 | **EH F17** | Productos, farmacia, Amazon y packs de skincare. ⚠️ **La condición de finalización pedía el motor** —*"evitando crear cinco catálogos diferentes"*—, así que lo genérico se extrajo a `motorProductos.js` y Pelo y Piel lo comparten: **las 169 pruebas de F10 pasaron sin tocar ni una**. ⚠️ **UN inventario, el de la Fase 13**, ampliado, no un segundo. 🐛 **Y el fallo de normalizador por decimoctava vez**: `normalizarPiel` recortaba cada producto a `{id, nombre}`, así que el siguiente guardado se habría llevado la ficha entera. ⚠️ **Catálogo vacío (D2-03), nunca un enlace inventado y nunca una compra**, con pruebas sobre el código |

| v1.84.0 | **EH F20** (fuera de orden) + ⏸ **C-25** | Barba y afeitado: perfil y configuración. ⚠️ **Construida saltándose la 18 y la 19, y a propósito**: la **C-25** las bloquea por la regla 49 —la Fase 2 de Josué dice que *Higiene* y *Cuidado corporal* son **dos** módulos, y las Fases 18 y 19 los tratan como **uno**—, y la 20 no depende de ellas. ⚠️ **El apartado 17 es una lista de siete cosas que hay que REUTILIZAR**, así que la fase es casi entera llamadas: nueve ceros en la auditoría. ⚠️ **`sensibilidadPiel` NO se vuelve a preguntar**: el registro de la Fase 4 ya decía que Barba la usa. ⚠️ **Los productos son los del catálogo global y aquí solo se guardan IDS.** ⚠️ Y el **formulario adaptativo se amplió en el MOTOR**, no con un `if`: `cuando` pasó a recibir también el contexto del módulo |

| v1.85.0 | **EH F21** | Barba y afeitado: rutinas y seguimiento. ⚠️ **Casi todo ya existía**: `motorRutinas.js` (F14), la papelera, el calendario global. 🐛 **Y arregló un fallo de la F20**: las rutinas colgaban de la casilla *"Afeitado"*, así que **quien solo marcaba "Barba" no podía crear ninguna** — ahora `rutinas` es el interruptor propio que pedía el apartado 16. 🐛 **Y dos más cazados por el navegador**: `TEXTOS_ESTADO_DIA` son textos, no objetos, y la pantalla leía `.nombre`. ⚠️ **Omitir es una TERCERA cosa** y sale de la cuenta; **borrar la rutina no borra su historial** |

| v1.86.0 | **EH F23** + ⏸ **C-25 crece** | Higiene bucal y sonrisa. ⚠️ **Un módulo nuevo se añade con UNA LÍNEA en `MODULOS_EH`**, que es el punto de extensión de la F1. ⚠️ **La racha es la GLOBAL y si no la tiene NO se pinta** (apartado 10): ni un contador guardado. ⚠️ **El cambio de cepillo se SUGIERE, no se agenda** (octavo `aplicarPlan`). 🐛 **Y un fallo real**: las revisiones salían sin filtrar por el rango pedido, así que una de octubre aparecía al pedir agosto. ⏸ **La F22 se suma a C-25**: su "🧼 Cuidado personal" es el módulo en disputa |

| v1.87.0 | **EH F24** | Perfumes y fragancias: perfil personal. ⚠️ **Los aromas son un dato COMPARTIDO** y se declaran en el registro de la F4, para que la F18 los lea en vez de repreguntarlos. ⚠️ **Lo que NO le gusta pesa tanto como lo que le gusta** (apartado 3, *"muy importante"*), y se dice con sus palabras. ⚠️ **"Mi perfume actual" NO es "mi favorito"** (apartado 12), con prueba en las dos direcciones. ⚠️ **Ni tiendas ni precios**: no es una tienda de perfumes |

| v1.88.0 | **EH F25** | Perfumes: recomendaciones, ocasiones y rotación. ⚠️ **No es una nota, es una explicación** (apartado 7): cada motivo es una frase, y el que no tiene ninguna no se propone. ⚠️ **"Otra opción" tiene memoria POR OCASIÓN**, y el descarte caduca. ⚠️ **"No repetir" BAJA de sitio, no esconde**. ⚠️ **Rotación y estadísticas son opt-in y devuelven `null` si están apagadas**, no una lista vacía. ⚠️ Y **la tabla de comparar es la del motor de la F17** |

🔒 **Bloques ME (4/4), BI (4/4), AR (4/4), FO (12/12), RA (4/4) y HT (12/12) cerrados.** SO va por
3/5 y **EH por 22/65** (F1-F17, F20, F21 y F23-F25; **F18, F19 y F22 ⏸ bloqueadas por C-25**).
Quedan **41** fases de la Entrega 2: SO (2, con **F2 bloqueada**) y EH (39, tres de ellas bloqueadas).

⚠️ **El "106" y el desglose por módulos no cuadran** (C-24): la tabla suma 110. Se conserva el
rótulo por compatibilidad con el resto de documentos; el desglose es el que manda sobre el trabajo.

✅ **C-23 resuelta a medias:** Josué pasó el texto que faltaba de la Fase 1 del Sonido (v1.54.0).
⏸ **Sigue pendiente lo de los archivos de audio**, que él dará *"cuando la web ya tenga todos los
botones activos"* — sin ellos el motor está entero pero no suena nada, y así está dicho.

⏸ **El orden dentro de E2-5 está pendiente de Josué (C-23):** en la especificación, el encabezado de
la Fase 1 de Sonido va seguido del texto de la Fase 4 de Rachas, así que no se sabe dónde está el
texto real del motor de audio ni si Sonido va antes o después de Rachas.

---

## PARTE C — Orden de ejecución propuesto para lo que queda

> **Criterio de ordenación:** primero lo que **desbloquea** o **corrige algo roto**, después lo que
> **cierra una fase ya empezada**, después lo **nuevo**, y al final lo que **depende de
> infraestructura que no existe**. Dentro de cada bloque, de menor a mayor riesgo.
>
> **Una fase por turno.** Ningún bloque de aquí abajo debe construirse a la vez que otro.

---

### ✅ R0 — Desbloqueo y correcciones críticas — **COMPLETADO (v1.23.0)**

Completado el 25/08/2026. Además de las seis tareas, este bloque trajo algo que el proyecto no
había tenido nunca: **el entorno de desarrollo ya tiene acceso a npm**, así que `npm install` y
`npm run build` funcionan y existe una suite de verificación automática (`scripts/verificar.sh`).
El proyecto **compila sin errores: 2604 módulos**.

Las pruebas nuevas destaparon además **cinco bugs reales** que no se habrían visto compilando —
todos corregidos: `calcularDuracion()` dejaba en blanco cuatro pantallas con un registro de sueño
incompleto; `AvisoSuenoCorto` mostraba "null h" y disparaba una notificación falsa; las dos
correlaciones de sueño contaban un registro incompleto como noche corta; la media de `SleepView`
se volvía `NaN`; y `DiaryView` dejaba el Diario en blanco con una entrada incompleta.

| # | Tarea | Por qué es lo primero | Riesgo |
|---|---|---|---|
| ✅ R0.1 | **Actualizar el modelo de IA** en `api/ask-ai.js` (`claude-sonnet-4-6` → un ID actual) | En cuanto Josué active `ANTHROPIC_API_KEY`, **las 13 secciones con IA fallarán**. Es una línea | Nulo |
| ✅ R0.2 | **Arreglar la puntuación diaria** del Dashboard (**C-12**) | Hoy dice "Puntuación de hoy" pero mide "he registrado algo alguna vez" → se queda en 100 para siempre. Es un dato visiblemente falso en la pantalla principal | Bajo |
| ✅ R0.3 | **Densidad de interfaz implementada de verdad** (**C-01**): o implementarla de verdad, o corregir el comentario mentiroso de `tokens.js` | Un comentario del código afirma que funciona y la UI dice al usuario que no. Cualquier IA futura se fiará del comentario | Bajo (comentario) / Medio (implementarla) |
| ✅ R0.4 | **Fase A7 registrada** en `CHANGELOG.md`/`HANDOFF.md` (**C-02**) | Hay una fase entera construida que no figura en ningún registro | Nulo |
| ✅ R0.5 | **`HANDOFF.md` saneado**: las secciones numeradas 3, 5, 8, 9, 10, 13 y 15 describen el estado en v0.21.0/v1.0.0 y contradicen los banners de arriba (**C-20**, **C-19**) | Es el documento que Josué pasa de una conversación a otra. Hoy engaña a quien lo lea de arriba abajo | Nulo |
| ✅ R0.6 | **`pinExtra` marcado vestigial** o marcarlo explícitamente como vestigial (**C-05**, **D-08**) | Campo muerto que la documentación todavía presenta como el mecanismo vigente | Bajo |

---

### 🟠 R1 — Verificación real *(depende de Josué, no de código)*

Nada de lo construido desde la Fase 8 se ha ejecutado nunca de verdad. **Esto es lo más valioso que
puede hacer Josué**, y bloquea la confianza en todo lo demás.

| # | Tarea | Quién |
|---|---|---|
| R1.1 | Confirmar que el proyecto **construye y despliega en Vercel** en su versión actual (v1.22.0) | Josué |
| R1.2 | Confirmar que `npm install` se ejecutó tras la Fase 11 (`pdfjs-dist`) | Josué |
| R1.3 | Probar las **Fases 8–21** de verdad, módulo por módulo, y reportar el error exacto de lo que falle | Josué |
| R1.4 | Confirmar los **3 bloques de `schema.sql`** (tabla + 3 buckets) ejecutados en su Supabase | Josué |
| R1.5 | Instalar la PWA en el iPhone y confirmar que los **iconos** le convencen | Josué |
| R1.6 | Probar el **flujo de recuperación de PIN** (que el enlace de Supabase dispara `PASSWORD_RECOVERY`) y la **migración de un PIN antiguo** | Josué |
| R1.7 | Confirmar en pantalla real: tema claro, "Automático" siguiendo al SO en iOS Safari, contraste, densidad de las rejillas nuevas, `backdrop-filter` sin lag, el "tacto" de los 190 ms | Josué |
| R1.8 | Recorrido completo del Calendario: crear cumpleaños en Relación → verlo en Calendario → editarlo → borrarlo → recargar | Josué |

> Cuando reporte un error, **pedirle el mensaje exacto antes de asumir nada**. Si es un problema de
> despliegue, es sobre **Vercel** — nunca sobre Replit.

---

### 🟡 R2 — Cerrar el Calendario (Track C, Fase 3)

Es la única fase **explícitamente abierta** de un track activo. Orden interno sugerido:

| # | Tarea | Dependencia |
|---|---|---|
| R2.1 | **Hábitos y Rutinas como eventos derivados** (**C-15**) — es lo que la Fase 2 aplazó *explícitamente* a la Fase 3, y el motor de recurrencia ya existe. Requiere **añadir un modelo de periodicidad** a hábitos/rutinas (hoy un hábito solo guarda cuándo *se hizo*, no cuándo *toca*) | `expandirRecurrentes` ✅ · modelo de periodicidad ⬜ |
| R2.2 | **`fe.eventos` como fuente derivada** (**D-06**) — hoy Fe es el único módulo con fechas reales que no llega al Calendario. 🔒 Sin recurrencia anual | `eventosDerivados` ✅ |
| R2.3 | **Intervalo personalizado** de recurrencia ("cada 2 semanas") | `expandirRecurrentes` |
| R2.4 | **Excepciones** ("saltar este día sin romper la serie") + **edición de una ocurrencia individual** | R2.3 |
| R2.5 | **Estadísticas temporales** del calendario | — |
| R2.6 | **Personalización del calendario** (qué tipos se muestran por defecto, primer día de semana) | ap. 70 (país/región) |
| R2.7 | ⚠️ **Automatizaciones / "eventos inteligentes"** — el prompt los menciona **sin decir qué harían**. **No construir hasta que Josué lo especifique.** Mismo criterio de cautela que con AXION | Especificación de Josué |

---

### 🟢 R3 — Cerrar los pendientes baratos de Ajustes

Piezas con el modelo de datos ya listo, que solo necesitan interfaz. Alto valor, bajo riesgo.

| # | Tarea | Estado del modelo |
|---|---|---|
| ✅ R3.1 | **Editor de `dashboardOcultos`** — construido en v1.25.0 como "Mi pantalla de inicio" (Entrega 2 · ME Fase 2) | ✅ completo |
| R3.2 | **Buscador de ajustes individuales** (ap. 32), no solo de categorías — con palabras clave y sinónimos | ⬜ |
| R3.3 | **Restablecer todas las configuraciones** (ap. 35) con resumen previo y copia de seguridad automática | 🟡 existe por categoría |
| R3.4 | **Copia de seguridad unificada y versionada de la configuración** (ap. 36) — sustituye/engloba los 4 exports JSON sueltos | 🟡 |
| R3.5 | **Pie de Ajustes** completo (ap. 3): versión, compilación, legales, créditos, técnica | 🟡 solo versión |
| R3.6 | **Cabecera de Ajustes** completa (ap. 3): foto, saludo contextual, "nivel del sistema", contracción al desplazar | 🟡 |
| R3.7 | **Restaurar la posición de scroll** al volver de una categoría (ap. 12) | ⬜ |
| R3.8 | **Ajustes frecuentes + favoritos ⭐** (ap. 33) | ⬜ |
| R3.9 | **Modo desarrollador** oculto tras pulsar la versión N veces (ap. 30) | ⬜ |
| R3.10 | **Indicadores de estado en las tarjetas de categoría** (ap. 5) y los 8/9 estados de control (ap. 10, 23) | ⬜ |
| R3.11 | **Deshacer con toast para Ajustes** (ap. 26) + **confirmación visual/háptica** (ap. 25) | ⬜ |
| R3.12 | **Historial de cambios de configuración** (ap. 34) y **registro de auditoría** (ap. 47) | ⬜ |

---

### 🔵 R4 — Terminar la Fase 20 del Prompt Maestro

Las dos piezas que se dieron por cerradas sin construir.

| # | Tarea | Nota |
|---|---|---|
| R4.1 | **Sistema de puntuación diaria** — "ese punto intermedio entre informativo y juego" (literal). Debe basarse en el **día calendario real** y en señales que cambien día a día. 🔒 Sin puntos acumulables, niveles ni monedas: mismo espíritu "no sobregamificar" | Absorbe R0.2 si se hace bien |
| R4.2 | **Revisión automática semanal / mensual / anual** — distinta del aviso de revisión de Objetivos (Fase 9). 🔒 Nunca dispara la IA sola: prepara la revisión y Josué la abre | Reutilizar `correlaciones.js` + `predicciones.js` + `logros.js`, sin datos nuevos |
| R4.3 | **Motor de automatizaciones** más allá de las 3 fijas — solo si Josué lo pide; el Prompt Maestro decía "empezando por 2-3 fijas" y el editor visual está **pospuesto indefinidamente** | ⚠️ No adelantar |

---

### 🟣 R5 — Perfil, unidades e internacionalización

| # | Tarea | Apartado |
|---|---|---|
| R5.1 | **Fotografía de perfil** — nunca construida: tomar/elegir/eliminar/sustituir, recorte cuadrado, compresión, caché, **avatar con iniciales** por defecto. Requiere un 4º bucket o reutilizar `progreso` | 52 |
| R5.2 | **Sincronización peso Perfil ↔ Salud** (**D-10**) — hoy son dos fuentes que no se hablan, contra el principio de Single Source of Truth | 57, 76, 77 |
| R5.3 | **Conversión real de unidades** (cm/ft-in, kg/lb, °C/°F, km/mi) con unidad base interna | 71 |
| R5.4 | **Zona horaria real**: registros en UTC, conversión solo en visualización | 69 |
| R5.5 | **País/región** afectando formato de fecha, primer día de semana y moneda | 70 |
| R5.6 | **i18n real** — arquitectura ampliable, hoy solo `es` | 68 |

---

### ⚪ R6 — Apariencia y accesibilidad avanzadas

| # | Tarea | Apartado |
|---|---|---|
| R6.1 | **Densidad de interfaz real** (si no se resolvió en R0.3) — exige revisar el espaciado de las ~22 vistas | 91 |
| R6.2 | **Escalado inteligente**: que el tamaño de texto adapte también iconos, botones, campos, listas y barras | 90 |
| R6.3 | **Niveles intermedios de animación** (Completa/Reducida/Mínima) con efecto real | 95 |
| R6.4 | **Transparencias y materiales** opcionales, con desactivación automática por rendimiento | 93 |
| R6.5 | **Fondos**: sólido / degradado sutil / textura ligera / material translúcido | 102 |
| R6.6 | **Estilos de icono alternativos** (arquitectura preparada, no editable por defecto) | 100–101 |
| R6.7 | **Widgets del Dashboard con configuración individual** (visible, tamaño, posición, nivel de detalle) | 103–106 |
| R6.8 | **Auditoría de accesibilidad real**: lector de pantalla, navegación por teclado, áreas táctiles, indicadores no dependientes solo del color | 43 |
| R6.9 | **Compactación (`ListCard`/rejillas) del resto de vistas**: Estudios, Negocio, Productividad, Objetivos, Diario, Biblioteca, Fe, Bienestar, Estadísticas, Predicciones, Logros | Track U |

---

### 🟤 R7 — Notificaciones a fondo

Todo esto **sin** Web Push, que va en R9. Es la categoría con más superficie pendiente.

R7.1 tipos de notificación (10) · R7.2 niveles de prioridad (4) · R7.3 programación horaria **por día
de la semana** · R7.4 modo silencioso interno · R7.5 frecuencia de recordatorios · R7.6 posponer ·
R7.7 resumen inteligente agrupado · R7.8 agrupación inteligente · R7.9 motor de evaluación previa al
envío · R7.10 adaptación al comportamiento (local, revisable y desactivable) · R7.11 notificaciones
propias por módulo · R7.12 sonidos · R7.13 vibración/háptica · R7.14 **indicadores internos**
(badges, contadores, banners — no todo tiene que ser una notificación del sistema) · R7.15 historial
· R7.16 diagnóstico comprensible · R7.17 separación explícita sincronizable/local.

---

### ⚫ R8 — Seguridad y privacidad avanzadas *(lo posible sin servidor)*

| # | Tarea | Apartado |
|---|---|---|
| R8.1 | **Catálogo completo de `protectedActions`**: modificar datos sensibles, restaurar copia de seguridad, cambiar configuración de seguridad, acceder a información financiera, acceder a contenido privado. El patrón de cableado ya existe: entrada en el array + un `if` en el punto real | S ap. 2 |
| R8.2 | **Longitud de PIN configurable** + **límite de intentos con espera progresiva** | 142–143, 165 |
| R8.3 | **Códigos de recuperación** de un solo uso, alta entropía, regenerables | 157–158 |
| R8.4 | **Alertas de seguridad** comprensibles | 155 |
| R8.5 | **Registro de consentimientos versionado** | 185–186 |
| R8.6 | **Panel "qué dato usa quién"** ("Peso → Salud, Nutrición, IA, Dashboard") | 192 |
| R8.7 | **Historial de acceso a datos sensibles** | 193 |
| R8.8 | **Exportación de datos personales completa** + **exportación a PDF** | 194 |
| R8.9 | **Política de retención** explicada en lenguaje claro | 196 |
| R8.10 | **Protección frente a capturas** en pantallas sensibles (donde la plataforma lo permita) | 166 |

---

### 🔒 R9 — Bloqueado por infraestructura que no existe

**No prometer ninguna de estas sin construir antes la infraestructura correspondiente.**

| # | Tarea | Qué hace falta |
|---|---|---|
| R9.1 | **Web Push real** (notificaciones con la app cerrada) | Service Worker con listener `push` + tabla de suscripciones en Supabase + función serverless de envío |
| R9.2 | **Dispositivos autorizados, sesiones activas, revocación, historial de accesos, auditoría de seguridad** | Servidor con permisos de administrador de Supabase |
| R9.3 | **Eliminación completa de la cuenta** (borrar el login, no solo los datos) | Función serverless con permisos de admin |
| R9.4 | **Importación automática del Tiempo de Uso** | ⛔ **Imposible.** Ya comunicado como limitación permanente, no como pendiente |
| R9.5 | **Funcionamiento offline completo** con cola de sincronización y resolución de conflictos | Capa de persistencia local + motor de sync |
| R9.6 | **Migración de configuraciones entre dispositivos** con validación de versiones | Formato versionado (R3.4) primero |

---

### ⛔ R10 — AXION *(bloqueado por decisión de Josué)*

**No escribir una línea de código.** El primer paso es una **conversación de diseño**: alcance real
vs. lo descrito, qué subconjunto es viable, y decidirle honestamente si quiere el **AXION Lite** de
5 piezas (ver `01_ESPECIFICACION_MAESTRA.md` §10.4) o ir apartado por apartado — en cuyo caso hay que
decirle sin rodeos que eso implica rediseñar la app entera con un backend que hoy no existe.

Dos piezas quedan **enganchadas a esta decisión**:
- La **categoría "Inteligencia Artificial"** de Ajustes, retirada en v1.22.0 pero exigida por el
  orden fijo del apartado 4 (**C-03**).
- La **tarjeta 🤖 IA** dentro del hub "Más", omitida en N1 porque no existe un módulo `ia` real.

---

## PARTE D — Resumen ejecutivo del orden

**Entrega 1 — lo que queda:**

```
R0  Correcciones críticas + saneado documental   ✅ COMPLETADO (v1.23.0)
R1  Verificación real en el dispositivo de Josué ← en paralelo, depende de él
R2  Cerrar Calendario Fase 3
R3  Pendientes baratos de Ajustes                ✅ R3.1 hecho en v1.25.0
R4  Terminar de verdad la Fase 20 del Prompt Maestro
R5  Perfil, unidades, i18n
R6  Apariencia y accesibilidad avanzadas
R7  Notificaciones a fondo
R8  Seguridad y privacidad avanzadas (lo posible sin servidor)
R9  Bloqueado por infraestructura
R10 AXION — aplazado por decisión de Josué (D2-06) hasta terminar la Entrega 2
```

**Entrega 2 — el orden que Josué ha confirmado (D2-05):**

```
E2-0  Verificación de la base                    ✅ COMPLETADO (v1.23.0, bloque R0)
E2-1  ME · Módulos activables + Eliminados (4)   ✅ COMPLETADO (v1.24.0 → v1.27.0)
E2-2  BI · Buscador + IA + Inicio (4)            ✅ COMPLETADO (v1.28.0 → v1.31.0)
E2-3  AR · Armario (4)                          ← EN CURSO (F1 ✅ F2 ✅, siguiente F3)
E2-4  FO · Fondos y Fotografías (12)
E2-5  SO · Sonido (5)  +  RA · Rachas (4)        ← dos módulos separados (D2-01)
E2-6  HT · Horario Top (12)
E2-7  EH · Estilo de Hombre (65)                 ← el último, por dependencias
```

**Si Josué pide algo concreto, eso manda sobre este orden.** Este es el orden por defecto para
cuando no haya una petición explícita encima de la mesa.
