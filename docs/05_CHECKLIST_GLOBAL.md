# JC Fitness — CHECKLIST GLOBAL

> Instrumento de verificación exhaustivo. Cubre **todo** lo especificado en el Prompt Maestro
> (21 fases), la Especificación de Ajustes (apartados 1–202), el resumen de AXION (203–1300), los
> cuatro prompts propios posteriores y las tres especificaciones puntuales.
>
> **Leyenda**
> `[x]` construido y verificado en código · `[~]` construido parcialmente ·
> `[ ]` especificado, no construido · `[-]` imposible con la arquitectura actual o descartado
> explícitamente · `[?]` construido pero **no verificado en ejecución real**
>
> ⚠️ **Casi todo lo marcado `[x]` desde v1.0.1 en adelante es en realidad `[?]`** — ver
> `04_INVENTARIO_ESTADO_ACTUAL.md` §8. La sección **Z** de esta checklist recoge la verificación
> real como bloque aparte.

---

## A. PROMPT MAESTRO — Fases 1 a 21

### A.1 Fase 1 — Base (Dashboard, Sueño, Entrenamiento, Economía)
- [x] Dashboard "Hoy" con saludo contextual y fecha
- [x] Módulo Sueño con registro y duración calculada
- [x] Módulo Entrenamiento (calistenia con nivel por habilidad + fútbol)
- [x] Módulo Economía (saldo, movimientos, hucha)
- [x] Modo oscuro con paleta azul metálica
- [x] Selector de color de acento
- [x] Puntuación diaria — **rehecha en v1.23.0**: mide el día real, solo cuenta las áreas que Josué usa, con desglose explicable (`src/lib/puntuacion.js`, 22 pruebas)

### A.2 Fase 2 — Backend real
- [x] Supabase: registro, inicio y cierre de sesión con email/contraseña
- [x] Tabla `app_data` con RLS y 4 políticas por usuario
- [x] Sincronización entre dispositivos
- [x] Migración de Artifact único a proyecto Vite con estructura de carpetas
- [x] Proxy serverless `api/ask-ai.js` con la clave solo en servidor
- [x] Manejo elegante de "IA no configurada" (503 + la app sigue funcionando)
- [x] Exportación a **CSV**
- [x] Exportación a **Excel**
- [ ] Exportación a **PDF** → **R8.8**
- [x] Historial de cambios (10 pasos) + botón "Deshacer último cambio"
- [x] Mecanismo de PIN preparado
- [x] `manifest.json` — PWA instalable desde Safari
- [x] `SETUP.md` con la guía completa
- [ ] Importación CSV del banco → **R2 pendiente / DEP-21**
- [ ] Detección de duplicados en la importación

### A.3 Fase 3 — Salud
- [x] Peso · [x] grasa corporal · [x] frecuencia cardíaca · [x] tensión sistólica/diastólica
- [x] Notas libres por medida
- [x] Gráfico de evolución del peso (recharts, desde 2 registros)
- [x] Aviso in-app si han pasado ≥7 días sin registrar
- [x] Historial médico: Lesión / Enfermedad / Medicamento / Síntoma / Vacuna / Análisis / Otro
- [x] Fotos de progreso en bucket privado `progreso`, con nota, miniatura y borrado
- [x] Fotos protegidas por PIN (hoy vía la acción `fotos_privadas`)
- [x] URLs firmadas de 1 hora, nunca públicas
- [x] IMC / BMR / TDEE **siempre orientativos**, en Ajustes → Perfil
- [x] Fotos fuera del sistema de deshacer y fuera de la exportación
- [x] Pestaña separada de Sueño y de Nutrición

### A.4 Fase 4 — Nutrición
- [x] Comidas: nombre, kcal, proteínas, carbohidratos, grasas, fibra
- [x] Totales del día
- [x] Agua: contador en ml con ±1 vaso (250 ml)
- [x] Favoritos: guardar comida como plantilla y volver a registrarla de un toque
- [x] Escaneo por **código de barras** (`@zxing/library`, cámara trasera)
- [x] Open Food Facts: nombre, marca y macros por 100 g, sin clave
- [x] Recálculo automático según los gramos reales indicados
- [x] Escaneo **por foto** que rellena el formulario (nunca guarda solo)
- [x] IA centrada en hábitos, **nunca cifras estrictas**
- [-] "Recetas" como estructura propia — cubierto por Favoritos, no se pidió más detalle

### A.5 Fase 5 — Calistenia a fondo + Fútbol
- [x] Las 7 habilidades: Handstand, Front Lever, Back Lever, Planche, Human Flag, Muscle Up, L-Sit
- [x] Tarjeta desplegable por habilidad con slider de nivel
- [x] **Progresión** editable a mano
- [x] Progresión **generada por IA** (4–6 pasos en JSON según nivel)
- [x] Progresión **mixta** (IA + edición posterior)
- [x] **PRs** con fecha automática, valor de texto libre y nota
- [x] **Sesiones**: "He entrenado esto hoy", una vez al día por habilidad
- [x] Racha de días consecutivos
- [x] **Aviso de sobreentrenamiento** a los 4 días seguidos
- [x] Subida de **vídeo** a bucket privado (100 MB, mp4/mov/webm)
- [x] **Análisis de técnica** por 4 fotogramas extraídos en el navegador
- [x] Análisis guardado en el propio vídeo para no repetirlo
- [x] Análisis **nunca automático**, solo a toque explícito
- [x] **Comparación mes a mes**: hasta 2 vídeos de la misma habilidad lado a lado
- [x] **Fútbol**: registro ligero de partidos puntuales
- [x] Vídeos fuera del sistema de deshacer

### A.6 Fase 6 — Estudios
- [x] Programas en pestañas (Bachillerato y Música por defecto)
- [x] Programas **ampliables desde la propia vista** (lista editable, no enum)
- [x] Asignaturas en tarjetas desplegables
- [x] Registro rápido de horas de estudio + total de la última semana
- [x] Exámenes: fecha, tema, nota objetivo, días restantes, nota obtenida
- [x] **Plan de repaso por IA** (3–7 pasos según días restantes), siempre editable
- [x] Plan que la IA propone pero **Josué decide y ejecuta**
- [x] "Explícame un concepto" — caja de pregunta libre
- [x] **Correlación sueño ↔ estudio** (umbral 7 h, mín. 2 días por grupo)
- [x] `cruzarPorFecha` genérica, pensada para reutilizarse en la Fase 16

### A.7 Fase 7 — Negocio
- [x] Lista de proyectos/ideas: nombre, estado, notas
- [x] Estados: Idea / En marcha / Pausado
- [x] Ingresos y gastos totales editables + balance calculado
- [x] `AIPanel` "Mejorar mis ideas"
- [x] Exportación incluida
- [-] Clientes, tareas y movimientos como listas separadas — 🔒 **descartado a propósito**

### A.8 Fase 8 — Productividad
- [x] Hábitos con **racha en pausa** (un día fallado no la rompe; dos seguidos sí)
- [x] Mejor racha guardada aparte
- [x] Rutinas / checklists con progreso X/Y
- [x] "Reiniciar rutina para hoy"
- [x] Pomodoro 25/5 con contador de sesiones de hoy
- [x] Tareas con fecha límite opcional, pendientes/hechas separadas
- [x] Metas a corto plazo (periodo, objetivo numérico, barra de progreso)
- [x] `addDays` en `helpers.js`
- [x] Pomodoros fuera del deshacer y de la exportación
- [ ] **Periodicidad en hábitos y rutinas** ("toca a diario", "toca los lunes") → **R2.1**

### A.9 Fase 9 — Objetivos
- [x] Plazos 30 días / 90 días / 1 año / 5 años / 10 años
- [x] Estado activo / cumplido
- [x] Aviso de revisión a los 30+ días sin revisar
- [x] Revisión asistida por IA que valora el conjunto
- [x] La IA **sugiere como máximo un objetivo nuevo y nunca lo añade sola**
- [x] `AIPanel` "¿Voy por buen camino?"
- [x] `ultimaRevision` fuera del deshacer

### A.10 Fase 10 — Diario
- [x] Ánimo 1–5 con emoji
- [x] Cómo me he sentido / qué he aprendido / qué mejoraré mañana
- [x] **Una entrada por día** (precarga la de hoy en vez de duplicar)
- [x] Entradas anteriores en tarjetas plegables, con borrado
- [x] `AIPanel` "Detectar patrones emocionales" sobre las 20 más recientes
- [x] Admite abiertamente cuando hay pocas entradas
- [x] Nunca se dispara sola
- [x] `Textarea` compartido creado aquí
- [x] Sin PIN, por petición explícita

### A.11 Fase 11 — Biblioteca
- [x] PDFs · [x] vídeos · [x] fotos · [x] apuntes de texto · [x] enlaces
- [x] Un único bucket `biblioteca` con el tipo en la fila de datos
- [x] **Extracción de texto del PDF en el navegador** → `textoExtraido`
- [x] **Búsqueda dentro del contenido de los PDFs**
- [x] Un PDF escaneado sin texto no bloquea la subida — se avisa en la tarjeta
- [x] Buscador único sobre título, apuntes, enlaces y texto extraído
- [x] Fragmento de contexto alrededor de la coincidencia (`snippet()`)
- [x] Filtro por tipo (Todos / PDFs / Vídeos / Fotos / Apuntes / Enlaces)
- [x] Borrado que elimina también el archivo de Storage
- [x] Split `biblioteca` (con deshacer) / `bibliotecaArchivos` (sin deshacer)
- [-] IA en Biblioteca — 🔒 no pedida, no añadir

### A.12 Fase 12 — Relación (privado)
- [x] Nombre de la pareja, editable
- [x] Lista de fechas importantes (etiqueta + fecha)
- [x] **Módulo entero detrás de `PinGate`**
- [x] Recordatorio en el Dashboard con cuenta atrás, sin pedir PIN
- [x] `diasHasta()` / `proximaOcurrencia()`
- [x] Excluida de la exportación y de `currentState`
- [x] Fechas con año real, sirviendo para aniversarios y para fechas puntuales
- [x] Edición de fechas (añadida en v1.22.0)
- [x] Tipo de fecha + "repetir cada año" (v1.22.0)
- [-] Fotos en Relación — no pedidas
- [-] Sistema de múltiples personas/contactos — 🔒 descartado explícitamente
- [-] Acceso propio de la pareja al módulo — pospuesto indefinidamente

### A.13 Fase 13 — Recordatorios románticos
- [x] Los 11 días: Aniversario · Cumpleaños · Día de la Novia · Día del Peluche · Día de las Flores
      Amarillas · Día del Chocolate · Día del Cine · Día del Maquillaje · Día del Anillo de Promesa ·
      Día de los Collares · Día de los Poemas
- [x] Chips que rellenan y abren el **mismo formulario** de "Fechas"
- [x] Mismo array `relacion.fechas`, sin modelo paralelo
- [x] Chips ya usados marcados con check
- [x] Nada se autogenera: Josué escribe la fecha
- [x] Recurrencia anual como cálculo de visualización, no como entrada nueva

### A.14 Fase 14 — Fe y vida espiritual
- [x] **Servicio**: Eucaristía / Anuncio / Preparación / Palabra / Otro, con fecha y notas
- [x] **Calendario**: Convivencia / Reunión / Catequesis / Retiro / Otro, Próximos y Pasados
- [x] **Diario espiritual** en array propio, con `AIPanel`
- [x] **Objetivos** espirituales por plazo, con `AIPanel`
- [x] `AVISO_DOCTRINAL` en **ambos** paneles de IA
- [x] Sin PIN
- [x] Sin recurrencia anual en los eventos
- [x] Incluido en la exportación
- [ ] `fe.eventos` como fuente derivada del Calendario Universal → **R2.2 / D-06**

### A.15 Fase 15 — Bienestar digital
- [x] Índice de **productividad** · [x] de **distracción** · [x] de **equilibrio**
- [x] Ventana móvil de 7 días
- [x] Tiempo de uso: alta manual (categoría, actividad, minutos, fecha), últimos 25
- [x] Concentración: temporizador 10/20/30/45/60 min
- [x] Mensaje breve al completar + recuento semanal (no puntuación)
- [x] Reflexión: 3 preguntas guía + texto libre, nunca automática
- [x] Aviso explícito de que no intercepta apps reales
- [x] Aviso explícito de que el temporizador no bloquea otras apps
- [x] Sin sobregamificar: sin puntos, niveles, monedas ni rachas nuevas
- [-] **Importación automática del Tiempo de Uso — imposible** (un navegador no puede leerlo del SO)

### A.16 Fase 16 — Estadísticas y correlaciones
- [x] Correlación sueño ↔ estudio
- [x] Correlación sueño ↔ ánimo del Diario
- [x] Correlación entreno ↔ ánimo del Diario (umbral más alto: 3 días por grupo)
- [x] Mínimo de días por grupo antes de mostrar nada
- [x] Dice abiertamente qué le falta cuando no hay datos
- [x] Solo lectura, sin clave propia ni exportación
- [ ] Ampliar a más pares de módulos ("amplía de 3-4 correlaciones hacia el resto") → abierto

### A.17 Fase 17 — Predicciones
- [x] `prediccionObjetivo` — aritmética de fechas
- [x] `prediccionAbandonoHabito` — riesgo bajo/medio/alto
- [x] `prediccionPeso` — regresión lineal simple + estimación a 30 días
- [x] `prediccionFuerza` — **constancia, nunca una cifra inventada**
- [x] `prediccionAhorro` — neto medio mensual a 3 meses
- [x] `prediccionNotas` — media de los 3 últimos, **no regresión**
- [x] Todas admiten datos insuficientes
- [x] Solo lectura, sin clave propia ni exportación

### A.18 Fase 18 — IA con memoria a fondo
- [x] Tono a medio camino entre prudente y directo
- [x] `AIPanel` acepta adjuntar **foto/captura**
- [x] `AIPanel` acepta adjuntar **PDF** (texto extraído, no binario)
- [x] Aviso a la IA si el PDF no tiene texto extraíble
- [x] Adjunto limpiado tras cada pregunta
- [x] Multimodalidad dentro del componente compartido, sin tocar las 13 vistas
- [x] **Buscador universal** en lenguaje natural (icono fijo arriba a la derecha)
- [x] **Panel de sugerencias** fijo arriba a la izquierda (bombilla)
- [x] Máximo 2 sugerencias, **solo tras tocar "Generar sugerencias"**
- [x] Ambos usan `currentState`, que excluye `relacion`
- [x] `fileToBase64` compartido

### A.19 Fase 19 — Personalización total
- [x] Reordenar cualquier sección de "Más"
- [x] Ocultar/mostrar cualquier sección
- [x] Confirmación **solo al ocultar**, nunca al volver a mostrar
- [x] Cambiar icono desde un catálogo de 8, o volver al original
- [x] Icono guardado como clave string, nunca como componente
- [x] Proteger con PIN cualquier sección
- [x] Hasta 4 métricas favoritas de 6, con orden propio
- [x] `PRIMARY_NAV` y "Ajustes" fuera de la personalización
- [x] Ocultar un módulo nunca borra sus datos
- [x] Guardado directo, sin deshacer
- [-] Constructor de módulos arbitrarios — 🔒 descartado
- [-] "Cambiar gráficos" — no se pidió con detalle; el color ya se personaliza

### A.20 Fase 20 — Funciones transversales avanzadas ⚠️ **NO COMPLETA**
- [x] **Centro de logros**: 12 insignias binarias sobre 10 módulos
- [x] **Mapa de vida**: Objetivos como línea de tiempo
- [x] Solo lectura, sin datos propios, sin exportación
- [x] Automatización 1: `AvisoSuenoCorto` (< 7 h)
- [x] Automatización 2: `AvisoRachaEnRiesgo`
- [x] Automatización 3: `AvisoExamenSinHoras`
- [x] Modos viaje / vacaciones / exámenes (3 plantillas fijas)
- [x] Modos que no ocultan ni reordenan módulos
- [x] 🔴 **Sistema de puntuación diaria** ("punto intermedio entre informativo y juego") — construido en v1.23.0
- [ ] 🔴 **Revisión automática semanal / mensual / anual** → **R4.2**
- [ ] Motor de automatizaciones más allá de las 3 fijas → **R4.3**, solo si Josué lo pide
- [-] Editor visual de automatizaciones — pospuesto indefinidamente

### A.21 Fase 21 — Pulido final y QA
- [x] Auditoría de colores hexadecimales sueltos fuera de `tokens.js`
- [x] Revisión de código de `exportData.js` y `supabase.js`
- [x] Revisión del tono de los 13 `AIPanel`
- [x] Confirmado que Salud/Nutrición evitan objetivos estrictos
- [x] Confirmado `AVISO_DOCTRINAL` en ambos paneles de Fe
- [x] Repaso visual/contraste leyendo el JSX de las 20 vistas
- [x] Dos inconsistencias corregidas (`SectionTitle` en Settings, `size={16}` en Training)
- [ ] **Pruebas reales de exportación, offline y sincronización de extremo a extremo** → **R1**

### A.22 Pospuesto indefinidamente por el propio Prompt Maestro
- [-] Editor visual de automatizaciones
- [-] API externa
- [-] Chat único de IA con acceso a todos los módulos a la vez

---

## B. AJUSTES — Arquitectura general (apartados 1–48)

- [x] Ap. 1 — Centro de configuración único, no pantalla secundaria
- [~] Ap. 1 — Efecto inmediato, consistente y **reversible** (falta reversibilidad, ver C-17)
- [x] Ap. 2 — Cualquier ajuste en <3 interacciones o por buscador
- [~] Ap. 3 — Cabecera: [x] nombre · [ ] fotografía · [ ] saludo contextual · [ ] nivel del sistema ·
      [x] acceso al perfil · [x] buscador · [ ] contracción progresiva al desplazar
- [~] Ap. 3 — Pie: [x] versión · [ ] número de compilación · [ ] enlaces legales · [ ] créditos ·
      [~] información técnica
- [x] Ap. 3 — El pie nunca se mezcla con las opciones
- [~] Ap. 4 — **Orden fijo de 14 categorías** (12 implementadas; faltan IA y Experimental — **C-03**)
- [x] Ap. 4 — Sin reordenación automática
- [x] Ap. 5 — Componente de tarjeta reutilizable con icono, título, descripción y flecha
- [ ] Ap. 5 — Indicadores extra: configuración incompleta / nueva función / sincronización
      desactivada / error / actualización disponible → **R3.10**
- [x] Ap. 5 — Animaciones ≤220 ms
- [x] Ap. 6 — Jerarquía por frecuencia de uso
- [x] Ap. 7 — Guardado automático, **sin botones Guardar/Aceptar/Aplicar**
- [x] Ap. 8 — Conjunto cerrado de 14 componentes
- [x] Ap. 9 — Todo ajuste es booleano / selección única / múltiple / numérico / texto / acción
- [~] Ap. 10 — Los 8 estados de control (reposo, pulsado, activo, desactivado, bloqueado, cargando,
      sincronizando, error) → **R3.10**
- [x] Ap. 11 — Descripción ≤80 caracteres que explica el efecto, no el uso
- [x] Ap. 12 — Transición lateral 200–250 ms Ease Out
- [ ] Ap. 12 — **Volver restaura la posición de scroll exacta** → **R3.7**
- [x] Ap. 13 — Categorías divididas en bloques con encabezado
- [x] Ap. 14 — Un mismo tipo de configuración nunca con componentes distintos
- [x] Ap. 15 — Categorías desacopladas y ampliables sin tocar las existentes
- [x] Ap. 16 — Pantalla independiente por categoría
- [x] Ap. 17 — Estructura interna idéntica en todas
- [x] Ap. 18 — Bloques temáticos
- [x] Ap. 19 — Tipos de elemento cerrados
- [x] Ap. 20 — Espaciado normativo
- [x] Ap. 21 — Jerarquía tipográfica compartida, sin tamaños arbitrarios
- [x] Ap. 22 — Iconografía de una única librería (Lucide), sin mezclar estilos
- [~] Ap. 23 — Los 9 estados de ajuste → **R3.10**
- [~] Ap. 24 — Ciclo de persistencia de 7 pasos ([x] interacción · [x] UI inmediata ·
      [~] validación · [x] guardado · [x] sync · [ ] confirmación visual · [ ] reversión en error)
- [ ] Ap. 25 — Confirmación visual: indicador de guardado, mensaje, animación, **háptica** → **R3.11**
- [x] Ap. 25 — Sin ventanas emergentes para acciones rutinarias
- [ ] Ap. 26 — **Deshacer con prioridad sobre confirmaciones** para lo reversible → **R3.11 / C-17**
- [~] Ap. 27 — Dependencias entre configuraciones comunicadas con **texto contextual**
- [x] Ap. 28 — Configuración contextual (permiso denegado → explicación, no controles inútiles)
- [~] Ap. 29 — Apartado "Configuración avanzada" por categoría (solo existe `modoColorAvanzado`)
- [ ] Ap. 30 — **Modo desarrollador** oculto tras una secuencia → **R3.9**
- [x] Ap. 31 — Helper text breve, sin tecnicismos
- [~] Ap. 32 — **Buscador global** que indexa nombre, descripción, categoría, palabras clave y
      sinónimos (hoy solo filtra tarjetas de categoría) → **R3.2**
- [ ] Ap. 33 — **Ajustes frecuentes** (automáticos) + **favoritos ⭐** → **R3.8**
- [ ] Ap. 34 — **Historial de cambios de configuración** → **R3.12**
- [~] Ap. 35 — Restablecer por categoría ([x] Perfil, Apariencia, Notificaciones) · [ ] global ·
      [ ] resumen previo · [ ] copia de seguridad automática previa → **R3.3**
- [~] Ap. 36 — **Copia de seguridad de configuración exportable/importable y versionada** → **R3.4**
- [~] Ap. 37 — Compatibilidad hacia atrás (patrón de merge aplicado; sin sistema formal)
- [ ] Ap. 38 — **Sistema de migración de configuraciones** → **R9.6**
- [~] Ap. 39 — Separación explícita configuración global (sincroniza) vs local
- [ ] Ap. 40 — Resolución de conflictos con registro
- [ ] Ap. 41 — **Configuración offline completa** con cola de sincronización → **R9.5**
- [~] Ap. 42 — Gestión de errores en lenguaje comprensible, nunca "Error 502"
- [~] Ap. 43 — Accesibilidad completa ([x] alto contraste · [x] escalado de texto · [x] reducir
      movimiento · [x] forma+color · [ ] lector de pantalla · [ ] navegación por teclado ·
      [~] áreas táctiles) → **R6.8**
- [~] Ap. 44 — Rendimiento y carga diferida por categoría
- [~] Ap. 45 — Consumo energético / modo ahorro
- [x] Ap. 46 — Nada sensible en texto plano (el PIN va hasheado con salt)
- [ ] Ap. 47 — **Registro de auditoría** de modificaciones importantes → **R3.12**
- [x] Ap. 48 — Fácil de encontrar, comprender, modificar, revertir y difícil de romper

---

## C. AJUSTES — Perfil (49–78)

- [x] 49–51 — Bloques: Identidad, Física, Deportiva, Académica, General, Acciones
- [ ] **52 — Fotografía de perfil**: tomar / elegir / eliminar / sustituir, recorte cuadrado,
      vista previa, compresión, caché, **avatar con iniciales si no hay foto** → **R5.1**
- [x] 53 — Nombre con validación y normalización
- [x] 54 — Fecha de nacimiento; **edad siempre calculada, nunca editable**
- [x] 55 — Sexo (solo para cálculos fisiológicos)
- [~] 56 — Altura con **unidad configurable y conversión automática** (falta la conversión)
- [x] 57 — Peso actual como valor de referencia
- [ ] 57 — **Sincronización real con el historial de Salud** → **R5.2 / D-10**
- [x] 58 — Peso objetivo
- [x] 59 — Nivel de actividad (5 niveles) que recalcula las métricas dependientes
- [x] 60 — Objetivo principal
- [x] 61 — Deportes practicados (selección múltiple, escalable)
- [x] 62 — Nivel deportivo (nunca limita acceso a funcionalidades)
- [x] 63 — Años de experiencia
- [x] 64 — Lesiones relevantes (zona, estado, fecha, observaciones)
- [x] 65 — Nivel educativo · [x] 66 — Estudios actuales · [x] 67 — Profesión
- [~] 68 — **Idioma principal** (solo `es`; arquitectura lista, sin i18n real) → **R5.6**
- [~] 69 — **Zona horaria** (se guarda; falta UTC interno + conversión en visualización) → **R5.4**
- [~] 70 — **País y región** (se guardan; sin efecto en formatos, moneda ni primer día) → **R5.5**
- [~] 71 — **Sistema de unidades** (se guarda la preferencia; **sin conversión real**) → **R5.3**
- [x] 72 — Exportación del perfil (sin contraseñas, tokens ni biometría)
- [x] 73 — Importación con confirmación previa
- [~] 73 — Sustituir completo **o fusionar bloques** (hoy solo sustituye completo)
- [x] 74 — Restablecimiento completo con advertencia
- [~] 74 — Restablecimiento **parcial** por campos
- [~] 75 — Validaciones globales con error junto al campo explicando el motivo
- [~] 76–77 — Single Source of Truth con propagación reactiva → ver **D-10**
- [x] 78 — Escalable, modular, consistente, ampliable

---

## D. AJUSTES — Apariencia (79–110)

- [x] 79–81 — Bloques: Tema, Colores, Tipografía, Interfaz, Animaciones, Dashboard, Avanzado
- [x] 82 — Tema **Claro / Oscuro / Automático** real, sin reiniciar
- [x] 82 — "Automático" sigue al SO en vivo (`matchMedia` + listener)
- [x] 83 — Arquitectura de tokens: cada componente consume tokens, no colores fijos
- [x] 84 — Acento que solo afecta a elementos interactivos y decorativos
- [x] 84 — **Nunca acento para estados críticos** (paleta semántica fija)
- [x] 85 — **Vista previa en tiempo real** con cancelación que restaura
- [x] 86 — **Paletas predefinidas** (10, con conjuntos coherentes de colores derivados)
- [x] 87 — Personalización avanzada del color con **validación automática de contraste**
- [x] 88 — Familia tipográfica única, nunca sustituible desde Apariencia
- [~] 89 — Tamaño de texto (**3 opciones**; la especificación pide **5**: Muy pequeño → Muy grande)
- [ ] 90 — **Escalado inteligente** que adapte también iconos, botones, campos, listas y barras → **R6.2**
- [x] 91 — **Densidad de interfaz** — efecto visual real desde v1.23.0 (`html[data-densidad]` sobre ritmo vertical y relleno de tarjetas)
- [x] 92 — Radios de borde consumidos globalmente
- [ ] 93 — **Transparencias y materiales** opcionales con desactivación por rendimiento → **R6.4**
- [x] 94 — Animaciones que comunican, nunca decorativas
- [~] 95 — Intensidad: Completa / Reducida / Mínima / Desactivadas (**solo "Desactivadas" tiene
      efecto real**) → **R6.3**
- [x] 96 — Duraciones dentro de los rangos normativos
- [x] 97 — Curvas: entrada Ease Out, salida Ease In, estado Ease In-Out
- [x] 98 — Reducción automática de movimiento respetando el SO
- [x] 99 — Microinteracciones breves
- [x] 100 — Familia de iconos única
- [ ] 101 — **Estilos de icono alternativos** (arquitectura preparada, no editable por defecto) → **R6.6**
- [~] 102 — **Fondos**: [x] color sólido · [~] degradado sutil (solo en la tarjeta de puntuación) ·
      [ ] textura ligera · [ ] material translúcido → **R6.5**
- [x] 103 — Personalización del Dashboard: mostrar/ocultar y reordenar
- [ ] 103 — Fijar elementos, elegir destacados, **definir pantalla inicial** → **R3.1**
- [ ] 104 — **Cada tarjeta como widget independiente** con configuración propia → **R6.7**
- [~] 105 — Ordenación de widgets (existe para "Más", no para el Dashboard) → **R3.1**
- [ ] 106 — **Configuración individual por widget** (nivel de detalle, qué información) → **R6.7**
- [~] 107 — Restablecimiento de apariencia ([x] completo · [ ] parcial por bloque · [ ] resumen previo)
- [x] 108 — Exportación e importación de temas con validación antes de aplicar
- [x] 109 — Funcionalidad > decoración; personalización que nunca compromete accesibilidad
- [x] 110 — Base ampliable sin romper compatibilidad

---

## E. AJUSTES — Notificaciones (111–138)

- [x] 111–112 — Centro único, calidad sobre cantidad
- [~] 113 — Toda notificación pertenece a una categoría (**10 de las 13** de la especificación;
      faltan Calendario, Seguridad y Sincronización)
- [~] 114 — Bloques: [x] estado general · [x] categorías · [~] horarios · [ ] prioridades ·
      [ ] sonidos · [ ] vibración · [ ] resumen diario · [ ] avanzado
- [x] 115 — Detección del permiso del sistema; explicación en vez de controles inútiles
- [x] 116 — Activación global
- [~] 117 — Configuración por categoría (interruptor sí; **sin ajustes propios por módulo**)
- [ ] 118 — **10 tipos** de notificación con presentación coherente → **R7.1**
- [ ] 119 — **4 niveles de prioridad** → **R7.2**
- [~] 120 — Programación horaria (existe un horario de descanso; **falta por día de la semana**) → **R7.3**
- [ ] 121 — **Modo silencioso interno** → **R7.4**
- [x] 122 — Horas de descanso (soporta cruzar medianoche)
- [ ] 122 — Excepciones marcadas que sí pasan durante el descanso
- [ ] 123 — **Frecuencia de recordatorios** (una vez / diario / laborables / fines / semanal /
      mensual / personalizada) → **R7.5**
- [ ] 124 — **Posponer** (10 min / 30 min / 1 h / esta tarde / mañana / elegir) → **R7.6**
- [ ] 125 — **Resumen inteligente** agrupado por franja → **R7.7**
- [ ] 126 — **Agrupación inteligente** de avisos consecutivos → **R7.8**
- [ ] 127 — **Motor inteligente** que evalúa antes de enviar → **R7.9**
- [ ] 128 — **Adaptación al comportamiento** (local, revisable, desactivable) → **R7.10**
- [ ] 129 — **Notificaciones propias por módulo** → **R7.11**
- [ ] 130 — **Sonidos** → **R7.12**
- [ ] 131 — **Vibración y respuesta háptica** → **R7.13**
- [ ] 132 — **Indicadores internos**: badges, puntos, contadores, banners, mensajes temporales → **R7.14**
- [ ] 133 — **Historial de notificaciones** con estado y borrado configurable → **R7.15**
- [~] 134 — Separación sincronizable / local (aplicada de facto con `localStorage`, sin modelo) → **R7.17**
- [ ] 135 — **Diagnóstico** comprensible → **R7.16**
- [x] 136 — Exportación e importación de preferencias
- [x] 137 — Restablecimiento de la categoría
- [x] 138 — Notificar solo con beneficio claro
- [-] **Web Push real** (app cerrada) — requiere infraestructura nueva → **R9.1**

---

## F. AJUSTES — Seguridad (139–172)

- [x] 139–141 — Secure by Default; bloques de Acceso / Cuenta / Dispositivos / Sesiones /
      Recuperación / Avanzado (los tres últimos, vacíos por imposibilidad)
- [~] 142 — PIN: [x] teclado numérico · [x] ocultación al escribir · [x] confirmación al crear ·
      [x] modificable/eliminable tras autenticación · [ ] **longitud configurable** → **R8.2**
- [x] 142 — El PIN solo desbloquea la app, nunca sustituye credenciales de cuenta
- [x] 143 — **Nunca en texto plano**; representación criptográfica; nunca recuperable
- [ ] 143 — **Límite de intentos + espera progresiva + registro de fallos** → **R8.2**
- [x] 144 — Biometría vía APIs del SO; la app nunca accede a datos biométricos
- [x] 145 — Biometría = rápido, **PIN = respaldo obligatorio**
- [x] 146 — Bloqueo automático con 6 opciones
- [ ] 147–148 — Cambio de contraseña de la cuenta con requisitos e indicador comprensible
- [ ] 149 — Verificación del correo con estado Verificado/Pendiente/Error y reenvío
- [-] 150 — **Dispositivos autorizados** → requiere servidor admin
- [~] 151 — Sesión actual (existe la sesión de Supabase; sin panel informativo)
- [-] 152–153 — **Gestión y revocación de sesiones activas** → requiere servidor admin
- [-] 154 — **Historial de accesos** → requiere servidor admin
- [ ] 155 — **Alertas de seguridad** → **R8.4**
- [x] 156 — Recuperación de acceso que prioriza la identidad
- [~] 157 — Métodos: [x] correo verificado · [ ] código de recuperación · [-] segundo dispositivo
- [ ] 158 — **Códigos de recuperación** de un solo uso, alta entropía, regenerables → **R8.3**
- [~] 159 — Confirmación para acciones críticas ([x] cambiar/desactivar PIN, reducir protección,
      exportar, eliminar datos · [ ] el resto)
- [~] 160 — Cifrado en tránsito (HTTPS+Supabase) y del PIN; sin cifrado en reposo propio
- [x] 161 — El PIN hasheado vive en `seguridad`, separado del resto
- [-] 162 — Keychain/Keystore — no aplica a una PWA
- [x] 163 — Tokens gestionados por Supabase, nunca visibles al usuario ni en logs
- [x] 164 — Renovación automática de sesión (Supabase)
- [ ] 165 — Política de bloqueo por intentos fallidos → **R8.2**
- [ ] 166 — **Protección frente a capturas** en pantallas sensibles → **R8.10**
- [x] 167 — Protección frente a ingeniería social (acciones críticas explicadas)
- [-] 168 — **Auditoría de eventos de seguridad** → requiere servidor admin
- [-] 169 — **Servicio independiente de autenticación** → no existe
- [x] 170 — Defensa en profundidad dentro de lo posible
- [x] 171 — Seguridad orientada a generar confianza, no complejidad
- [x] 172 — Base para ampliaciones futuras

### F.2 — Especificación propia de Seguridad Centralizada (14 apartados + recuperación)
- [x] Ap. 1 — Catálogo de áreas protegibles **no limitado a los módulos actuales**
- [~] Ap. 2 — Protección **por función**: [x] `fotos_privadas` · [x] `exportar_datos` ·
      [x] `eliminar_datos` · [ ] modificar datos sensibles · [ ] restaurar copia de seguridad ·
      [ ] cambiar configuración de seguridad · [ ] información financiera ·
      [ ] contenido privado → **R8.1**
- [x] Ap. 3 — **Reducir la protección siempre pide el PIN actual**
- [x] Ap. 4 — Garantía real, no solo un candado de pantalla
- [x] Ap. 5 — PIN hasheado con salt, nunca en claro
- [x] Ap. 6 — Sesión de desbloqueo temporal configurable
- [x] Ap. 7 — Integrado con el bloqueo automático ya existente, no duplicado
- [x] Ap. 8–9 — `App.jsx` como único punto que decide y guarda la protección
- [~] Ap. — "Seguridad" como sub-zona con candado propio (**descartado con motivo**: `SettingsView`
      es una pantalla única con categorías internas; proteger "Ajustes" como área ya lo cubre)
- [x] Recuperación de PIN por correo verificado vía `PASSWORD_RECOVERY`
- [x] Migración sin pérdida (PIN en claro → hash; `pinExtra` → `protectedAreas`) con banderas
- [x] Las **10 comprobaciones obligatorias** trazadas a mano sobre el código
- [?] Las 10 comprobaciones **verificadas ejecutando la app** → **R1.6**

---

## G. AJUSTES — Privacidad (173–202)

- [x] 173–175 — Bloques: Permisos, Datos personales, IA, Compartición, Eliminación, Información
- [x] 176 — Minimización de datos
- [~] 177 — Transparencia: qué es, para qué, dónde se almacena, **cuánto tiempo se conserva**
- [x] 178–184 — Permisos de dispositivo — **documentado como "no aplica"**, verificado por `grep`
      (sin `getUserMedia`, `mediaDevices` ni `geolocation` fuera del escáner)
- [ ] 185–186 — **Gestión y registro de consentimientos versionado** → **R8.5**
- [x] 187 — Privacidad de la IA: qué recibe, para qué, procesamiento externo, qué nunca usa
- [ ] 188 — **Memoria personalizada de la IA** consultable, editable, vaciable, desactivable → **R10**
- [~] 189 — Anonimización (no se envía identidad a Anthropic, sin sistema formal)
- [x] 190–191 — Compartición: **no hay integraciones**, se dice honestamente
- [ ] 192 — **Panel "qué dato usa quién"** → **R8.6**
- [ ] 193 — **Historial de acceso a datos sensibles** → **R8.7**
- [~] 194 — **Exportación de datos personales** (existe CSV/Excel; falta el paquete completo
      explicando qué se incluye y qué queda fuera) → **R8.8**
- [ ] 196 — **Política de retención** explicada → **R8.9**
- [x] 195 — **Eliminación por categoría** (14 módulos con confirmación)
- [-] 197–198 — **Eliminación de la cuenta** y derecho al olvido → requiere serverless admin
- [ ] 199 — **Auditoría de privacidad** → **R8.7**
- [x] 200 — **Panel de transparencia** de un vistazo
- [x] 201–202 — Privacidad por diseño

---

## H. AXION (203–1300) — todo pendiente y bloqueado

- [-] Los 20 bloques temáticos completos → 🔒 **R10, requiere conversación de diseño**
- [ ] AXION Lite · pieza 1 — Permisos de la IA por módulo
- [ ] AXION Lite · pieza 2 — Niveles de autonomía simplificados (leer / sugerir / preparar)
- [ ] AXION Lite · pieza 3 — Seguimiento de coste y consumo de tokens
- [ ] AXION Lite · pieza 4 — Memoria de IA explícita y editable
- [ ] AXION Lite · pieza 5 — Auditoría básica de uso de la IA
- [ ] Categoría "Inteligencia Artificial" reinsertada en Ajustes **en la posición 6** (**C-03**)
- [ ] Tarjeta 🤖 IA dentro del hub "Más"
- [ ] ⚠️ **Releer el texto literal de los apartados 203–1300** antes de construir nada (solo hay
      resumen en el repositorio)

---

## I. NAVEGACIÓN POR ÁREAS (N1–N4)

- [x] Barra inferior de **exactamente 5 pestañas**, nunca una sexta
- [x] Inicio va directo a "Hoy"; las otras 4 abren primero un hub
- [x] Tarjetas grandes con icono, nombre, **resumen real de 2 líneas**, indicador de estado y flecha
- [x] Nunca una cifra inventada; estado vacío honesto
- [x] Los 19 ids de `MORE_NAV` repartidos exactamente una vez en `AREAS_NAV`
- [x] Respeta orden / ocultos / iconos personalizados
- [x] "Ajustes" fijo al final del hub "Más"
- [x] Barra "← {Área}" que vuelve al hub, no a Inicio
- [x] Todo alcanzable en menos de 2 toques
- [x] Cascada de 80 ms entre tarjetas (stagger no modificado)
- [x] `--ease-premium` compartida por las 4 animaciones del sistema
- [x] Efecto de capas (`hubHeaderIn` + `backBarIn`)
- [x] Microinteracción completa: `:active` → expansión → navegación a los 190 ms
- [x] Cancelación del `setTimeout` si el hub se desmonta
- [x] Tarjetas de cristal con `backdrop-filter` y prefijo `-webkit-`
- [x] Indicador de estado por tarjeta (`activo`/`vacio`/`info`)
- [x] Jerarquía tipográfica marcada; encabezado "Área" en mayúsculas con tracking
- [x] Barra de volver convertida en píldora
- [?] Rendimiento de `backdrop-filter` en Safari/iOS con varias tarjetas → **R1.7**
- [?] "Tacto" de los 190 ms en un dedo real → **R1.7**
- [-] Fase N5 — no planificada

---

## J. PERSONALIZACIÓN VISUAL EXTREMA (V1–V4)

- [x] Conversión HEX / RGB / HSL / HSV / OKLCH
- [x] Contraste WCAG con ajuste automático (`ensureContrast`, `bestReadableText`)
- [x] Escalas perceptuales de 11 pasos
- [x] Roles derivados del acento (marca, `textOnAccent`, bordes, 5 estados, 4 efectos)
- [x] `warning` e `info` como roles fijos por tema
- [x] Migración de ~20 colores hardcodeados a tokens
- [x] Corrección del `#080A0D` ilegible sobre acentos oscuros
- [x] Variables CSS en el contenedor raíz para consumir tokens desde `index.css`
- [x] Espectro 2D arrastrable (saturación × brillo)
- [x] Slider de tono de 360°
- [x] Campos HEX / RGB / HSL editables
- [x] Color actual vs. anterior con revertir de un toque
- [x] Favoritos (≤24) y recientes (≤12)
- [x] Copiar / pegar
- [x] Cuentagotas con **detección de función** (oculto en Safari/iOS)
- [x] Separación preview / commit para no saturar Supabase
- [x] Acento libre, no limitado a los 12 fijos
- [x] Constructor de temas: Secundario, Terciario, Fondo, Superficie, Texto, Bordes
- [x] Secundario/Terciario derivados por rotación ±35° si no se fijan a mano
- [x] Escala de 11 pasos y texto legible propios para Secundario y Terciario
- [x] Estados personalizables en sección avanzada colapsada con aviso
- [x] **Red de seguridad de contraste como última operación de `aplicarTema()`**
- [x] Tira de vista previa de las 3 escalas
- [x] 10 paletas predefinidas (3 con overrides reales de personalidad propia)
- [x] `esOficial` marcado en `clasico`
- [x] CRUD de temas propios: guardar, renombrar, duplicar, eliminar, exportar, importar
- [x] Límite de 12 que **rechaza la operación, nunca borra el más antiguo en silencio**
- [x] Importar añade a la lista, **nunca aplica directamente**
- [x] `modoColorAvanzado` como único interruptor de las dos tarjetas avanzadas
- [x] `aplicarConjuntoTema` atómica, sin condición de carrera
- [x] Verificado con Node: round-trips, contraste AA en los 24 casos, casos límite recuperados
- [?] Arrastre táctil del espectro y del slider en un iPhone real → **R1.7**
- [?] Dos bottom-sheets anidados (ColorPicker dentro de TemaBuilder) → **R1.7**
- [?] Exportar / importar un `.json` real → **R1.7**

---

## K. CALENDARIO UNIVERSAL (C1–C3)

### K.1 Fase 1
- [x] Clave `calendario` con `DEFAULT_CALENDARIO`
- [x] Evento con id, título, fecha, horas opcionales, todoElDía, tipo, ubicación, notas, timestamps
- [x] Campos reservados `recurrencia` y `estado`; `origen`/`origenId` desde el principio
- [x] 8 tipos de evento con color resuelto **en cada render** contra los tokens vivos
- [x] Motor puro: `celdasMes`, `eventosDelDia`, `tiposDelDia`, `resumenDelDia`, `eventosFuturos`
- [x] Años bisiestos resueltos por `Date` nativo; semana empezando en lunes
- [x] Cuadrícula mensual con navegación anterior / siguiente / hoy
- [x] Máximo **3 puntos por día**, nunca texto largo
- [x] Día actual y seleccionado distinguidos por **forma + color**, nunca solo color
- [x] Panel de día con resumen contextual
- [x] Editor modal único para crear / editar / eliminar
- [x] Módulo dentro del área "Vida", **nunca una sexta pestaña**
- [x] Acceso discreto desde "Hoy"
- [x] En `snapshotAndSave`, en `RESET_MODULOS`, en `currentState` y en la exportación
- [x] Exporta **solo** eventos con `origen: 'calendario'`
- [x] Dos animaciones nuevas reutilizando `--ease-premium`
- [x] Celdas vacías antes del día 1, sin días de otro mes

### K.2 Fase 2
- [x] `eventosDerivados()` recalculado en cada render, **nunca guardado**
- [x] Objetivos con plazo estimado (dicho explícitamente en las notas)
- [x] Estudios (exámenes) · [x] Entrenamiento (sesiones + partidos) · [x] Tareas con fecha límite
- [x] Icono de candado + detalle de solo lectura + "Abrir en {módulo}"
- [x] El calendario **nunca** edita ni borra un dato ajeno
- [x] Panel "Próximamente" (hasta 5 días en ~2 semanas, filas tocables)
- [x] Fusión aplicada también al acceso de "Hoy" y a la tarjeta del hub "Vida"
- [x] Sin duplicar datos por construcción
- [ ] **Hábitos** como eventos derivados → **R2.1 / C-15**
- [ ] **Rutinas** como eventos derivados → **R2.1 / C-15**
- [ ] **`fe.eventos`** como fuente derivada → **R2.2 / D-06**
- [ ] Economía → pagos como fuente derivada

### K.3 Fase 3 (primera pasada)
- [x] `expandirRecurrentes` con ocurrencias **virtuales**, nunca materializadas
- [x] Frecuencias diaria / semanal / mensual / anual con "hasta" opcional
- [x] Atajo de aritmética exacta para anclas antiguas (tope de 500 pasos)
- [x] Tocar cualquier ocurrencia abre el evento real completo
- [x] Aviso explícito de que guardar cambia toda la serie
- [x] **Vista Agenda** (60 días, tope de 50 con aviso al truncar)
- [x] **Filtros por tipo** aplicados a los 5 sitios a la vez
- [x] **Búsqueda** sobre título y notas (−60/+180 días) con salto al evento
- [x] `FilaEvento` compartido entre panel de día y Agenda
- [x] Acceso directo a Agenda desde "Hoy" (una sola implementación, dos puertas)
- [ ] **Intervalo personalizado** ("cada 2 semanas") → **R2.3**
- [ ] **Excepciones** (saltar un día sin romper la serie) → **R2.4**
- [ ] **Edición de una ocurrencia individual** → **R2.4**
- [ ] **Estadísticas temporales** del calendario → **R2.5**
- [ ] **Personalización avanzada** del calendario → **R2.6**
- [ ] ⚠️ **Automatizaciones / "eventos inteligentes"** — sin especificación; **no construir** → **R2.7**
- [-] Vista de día independiente — la Agenda cubre ese caso

### K.4 Fechas de Relación (v1.22.0)
- [x] `tipo` y `repetir` como campos opcionales, sin migración automática
- [x] Selector de tipo e interruptor "Repetir cada año" en el alta
- [x] Repetición activada por defecto al elegir un preset de "Días especiales"
- [x] **Edición real** de una fecha guardada
- [x] `eventosDeRelacion` reutilizando `expandirRecurrentes` sin tocar `CalendarView`
- [x] Título generado al vuelo; el nombre **nunca se guarda dos veces**
- [x] 🔒 Privacidad condicionada a `estaDesbloqueado('area:relacion')` o a que no haya PIN
- [x] Detalle de solo lectura con "Abrir en Relación"
- [x] Editar/eliminar afecta a toda la serie sin código de limpieza
- [?] Recorrido completo verificado en un navegador real → **R1.8**

---

## L. DASHBOARD — CENTRO DE CONTROL (23 apartados)

- [x] Ap. 23 — **Análisis previo** del código existente antes de construir (regla explícita)
- [x] Deep-link sin router paralelo (`dashboardFoco` + `navegarDesdeHoy` + `focoPara`)
- [x] Foco consumido una sola vez, con `onFocoConsumido()`
- [x] `DashboardModuleCard`, `MiniAccessCard`, `QuickActionButton`
- [x] `Card` acepta `id` opcional (cambio aditivo)
- [x] Ap. 9 — Jerarquía de 3 niveles
- [x] Ap. 8 — Rejillas compactas, nunca una tarjeta grande por fila
- [x] Nivel 1 (2×2) con deep-link al elemento concreto en Entreno, Objetivos y Estudios
- [x] Nivel 2 (2×2) reutilizando `calcularResumenModulo`
- [x] Nivel 3: 6 mini-accesos **sin resumen de datos** (privacidad de Relación)
- [x] Ap. 13/14 — Acciones rápidas visualmente distintas de las tarjetas
- [x] Métricas favoritas pulsables
- [x] Ap. 12 — Estado vacío honesto en cada tarjeta
- [x] Deep-link cableado en 6 vistas reutilizando su estado existente
- [x] PIN y deep-link conviven sin caso especial
- [x] Ap. 10/11 — `dashboardOcultos` en el modelo + filtrado activo
- [ ] Ap. 10 — **Editor de `dashboardOcultos` en Ajustes** → **R3.1**
- [x] Corrección de compatibilidad de `personalizacion` con merge del default
- [x] Regla de oro: ninguna tarjeta que no haga nada
- [x] Ninguna cifra inventada (sin objetivo de ahorro, sin % de objetivo calórico)
- [x] `IndicadorContexto` acordeón siempre visible, con "Rutina normal" como estado
- [x] Transición real de altura+opacity con `grid-template-rows`
- [x] `AccesoCalendarioYAgenda` con dos tarjetas del mismo alto total
- [x] Iconos nuevos verificados contra la versión de Lucide (`Palmtree` evitado)
- [ ] Ampliar acciones rápidas más allá de Sueño/Gasto/Tarea/Objetivo
- [ ] Botón "Ver detalles" del indicador si `MODOS_APP` crece
- [?] Densidad real de las rejillas en un iPhone → **R1.7**

---

## M. OPTIMIZACIÓN MÓVIL (12 apartados)

- [x] Análisis previo del código real antes de cambiar nada
- [x] 🔴 **Bug de `containing block` diagnosticado y corregido** con `createPortal` en los 10 overlays
- [x] Comentario de advertencia en `index.css` para no reintroducirlo
- [x] `ListCard` / `ListRow` como composición sobre `Card`, no un sistema visual nuevo
- [x] Aplicado a Sueño, Economía (con Hucha fusionada), partidos y PRs
- [x] Dashboard con avisos más apretados y rejilla única de métricas
- [x] Entrenamiento: 7 habilidades en rejilla 2 columnas; la abierta a ancho completo
- [x] "Más" (HubView) sin comprimir (excepción explícita de NIVEL 2)
- [x] Ajustes sigue con scroll (NIVEL 3), pero los controles aparecen donde se pulsan
- [x] **Nada de contenido ni de funciones eliminado** — solo agrupación y densidad
- [ ] Compactación del resto de vistas (Estudios, Negocio, Productividad, Objetivos, Diario,
      Biblioteca, Fe, Bienestar, Estadísticas, Predicciones, Logros) → **R6.9**
- [-] `VideosTab` compactada — descartado a propósito (contenido demasiado rico por fila)

---

## N. LIMPIEZA DE NOTAS INTERNAS (v1.22.0)

- [x] `ComingSoon` eliminado junto con su único uso
- [x] Categorías "Inteligencia Artificial" y "Funciones experimentales" retiradas (ver **C-03**)
- [x] "Accesibilidad" pasa a `listo: true, soloInfo: true` con un aviso real
- [x] Cinco bloques `InfoOnly` que citaban "apartados X-X" eliminados
- [x] El resto de `InfoOnly` reescrito sin lenguaje de hoja de ruta interna
- [x] La información honesta sobre limitaciones **reales** se conserva
- [x] Aviso de Tiempo de Uso reescrito como motivo permanente, no como pendiente
- [ ] **Auditoría periódica**: repetir esta revisión al cerrar cada fase futura (regla nº 45)

---

## Z. VERIFICACIÓN REAL — el bloque más importante

> Nada de esto lo puede hacer Claude. **Todo depende de Josué.**

### Z.1 Entorno y despliegue
- [ ] El proyecto **construye y despliega en Vercel** en v1.22.0
- [ ] `npm install` ejecutado tras la Fase 11 (`pdfjs-dist`)
- [ ] Los **3 bloques de `schema.sql`** ejecutados (tabla + 3 buckets)
- [ ] Documentar **cómo sube el código desde el iPhone a Vercel** (hoy desconocido)
- [ ] PWA instalada en el iPhone; iconos confirmados

### Z.2 Ejecución real por módulo (Fases 8–21, ninguna confirmada)
- [ ] Productividad · [ ] Objetivos · [ ] Diario · [ ] Biblioteca · [ ] Relación ·
      [ ] Días especiales · [ ] Fe · [ ] Bienestar · [ ] Estadísticas · [ ] Predicciones ·
      [ ] IA multimodal · [ ] Buscador universal · [ ] Panel de sugerencias · [ ] Personalización ·
      [ ] Logros · [ ] Mapa de vida · [ ] Modos

### Z.3 Ejecución real de los bloques posteriores (v1.1.0 → v1.22.0)
- [ ] Las 12 categorías de Ajustes abren y funcionan
- [ ] Perfil carga bien con los datos ya guardados; exportar/importar/restablecer funcionan
- [ ] Tema claro y "Automático" siguiendo al SO en iOS Safari
- [ ] Contraste del tema claro cómodo en pantalla real
- [ ] Permiso de notificaciones concedido en iOS Safari como PWA instalada
- [ ] Una notificación llega de verdad al cumplirse un aviso
- [ ] **WebAuthn funciona en iOS Safari como PWA instalada**
- [ ] El bloqueo automático no resulta intrusivo en el uso diario
- [ ] Borrado por categoría apunta a la clave correcta en todos los casos
- [ ] Los 4 hubs abren, con resúmenes correctos
- [ ] El selector de color aparece junto al botón, no al final de la página
- [ ] Enlace de recuperación de PIN → evento `PASSWORD_RECOVERY`
- [ ] Migración de un PIN antiguo (`pin: null`, `pinHash`/`pinSalt` rellenos)
- [ ] Calendario: crear / editar / eliminar / recargar; serie recurrente desde cualquier ocurrencia
- [ ] Agenda con datos reales no se siente pesada
- [ ] Los 6 deep-links del Dashboard aterrizan donde deben

### Z.4 Verificación técnica que la IA no ha podido hacer
- [x] **Build real verificado** — `npm install` + `vite build` funcionan; 2604 módulos sin errores (v1.23.0)
- [x] `npm run build` real — pasa
- [~] Renderizado — 11 vistas × 3 escenarios con `react-dom/server` (`scripts/smoke.mjs`). No sustituye a un navegador real
- [ ] Pruebas de exportación / offline / sincronización de extremo a extremo
- [ ] Comportamiento con datos reales de volumen (no listas vacías)

### Z.5 Decisiones que solo Josué puede tomar
- [ ] Activar `ANTHROPIC_API_KEY` en producción (tiene coste real)
- [ ] Nombre definitivo del proyecto (**C-21**)
- [ ] **AXION**: subconjunto pragmático ("AXION Lite") o apartado por apartado
- [ ] Si quiere la compactación del resto de vistas (**R6.9**)
- [ ] Si quiere ampliar las acciones rápidas del Dashboard
- [ ] Qué deben hacer exactamente las "automatizaciones / eventos inteligentes" del Calendario

---

## RESUMEN CUANTITATIVO

| Bloque | ✅ | 🟡 | ⬜ | ⛔ |
|---|---|---|---|---|
| A · Prompt Maestro (21 fases) | 148 | 2 | 9 | 9 |
| B · Ajustes, arquitectura (1–48) | 26 | 15 | 12 | 0 |
| C · Perfil (49–78) | 17 | 8 | 4 | 0 |
| D · Apariencia (79–110) | 20 | 6 | 7 | 0 |
| E · Notificaciones (111–138) | 8 | 5 | 16 | 1 |
| F · Seguridad (139–172 + 14 propios) | 26 | 8 | 9 | 8 |
| G · Privacidad (173–202) | 10 | 4 | 7 | 2 |
| H · AXION (203–1300) | 0 | 0 | 8 | 1 |
| I · Navegación (N1–N4) | 17 | 0 | 0 | 1 |
| J · Personalización Visual (V1–V4) | 30 | 0 | 0 | 0 |
| K · Calendario (C1–C3) | 44 | 0 | 10 | 1 |
| L · Dashboard Centro de Control | 21 | 0 | 3 | 0 |
| M · Optimización móvil | 10 | 0 | 1 | 1 |
| N · Limpieza de notas internas | 7 | 0 | 1 | 0 |
| **Z · Verificación real** | **0** | **0** | **~45** | **0** |

**Lectura honesta:** la superficie funcional construida es enorme y la calidad de las decisiones de
diseño es alta y consistente. Lo que falta se concentra en cuatro sitios: **(1) verificación real —
prácticamente todo está sin probar**, **(2) Notificaciones**, que es la categoría de Ajustes con más
apartados sin construir, **(3) AXION**, que está entero por delante y bloqueado por una decisión, y
**(4) un puñado de piezas concretas que se dieron por cerradas sin estarlo** — la puntuación diaria,
la revisión periódica, la densidad de interfaz y Hábitos/Rutinas en el Calendario.
