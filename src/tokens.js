import { buildRolesFromAccent } from './lib/colorEngine';

// Fase 1 del Sistema de Personalización Visual Extrema — `warning`/`info` se suman aquí a los
// ya existentes `positive`/`negative` (mismo criterio: colores de "Estados" fijos y curados por
// tema, no derivados del acento del usuario — un error que cambiara de color con la personalización
// sería una regresión de usabilidad). `warning` reutiliza el mismo dorado (#C9A24B) que ya estaba
// hardcodeado en varios sitios (HealthView, TrainingView) — al convertirlo en token no cambia
// nada visualmente hoy, solo deja de estar repetido y sin nombre.
export const COLORS = {
  bg: '#0A0C10',
  surface: '#12151B',
  surface2: '#171B23',
  border: '#222834',
  text: '#EDEFF2',
  textMuted: '#8891A3',
  positive: '#7CB88F',
  negative: '#C77C7C',
  warning: '#C9A24B',
  info: '#6C99C9',
};

export const ACCENTS = [
  { name: 'Azul metálico', value: '#5C7E9A' },
  { name: 'Índigo', value: '#6270A0' },
  { name: 'Turquesa', value: '#4F9494' },
  { name: 'Verde salvia', value: '#5E8C6A' },
  { name: 'Verde azulado', value: '#3F7A78' },
  { name: 'Dorado', value: '#C9A24B' },
  { name: 'Naranja tostado', value: '#B3805A' },
  { name: 'Terracota', value: '#B06A55' },
  { name: 'Rojo vino', value: '#A15C5C' },
  { name: 'Rosa palo', value: '#B37A93' },
  { name: 'Morado', value: '#7A6A9E' },
  { name: 'Gris grafito', value: '#7C8592' },
];

// Fase A3 — Apariencia avanzada (Entrega 1 de la especificación extendida, apartados 79-110):
// sistema de temas real. COLORS sigue siendo el mismo objeto que ya usan por referencia unas
// 20 vistas (`COLORS.texto`, etc.) — en vez de sustituirlo por un hook/contexto y tocar cada
// archivo, se muta en el sitio con Object.assign() al cambiar de tema y App.jsx llama a
// aplicarTema() de forma síncrona en cada render (antes de que se generen los estilos de los
// componentes hijos), así ningún archivo existente necesita cambiar para heredar el tema.
export const COLORS_OSCURO = { ...COLORS };

export const COLORS_CLARO = {
  bg: '#F3F4F7',
  surface: '#FFFFFF',
  surface2: '#EAEDF1',
  border: '#DBE0E7',
  text: '#161A21',
  textMuted: '#5B6472',
  positive: '#2F7D4F',
  negative: '#B23D3D',
  warning: '#8A6516',
  info: '#3D6FA3',
};

// Fase A7 — cierre de Ajustes (Accesibilidad): alto contraste. Solo ajusta `textMuted` y `border`
// — los dos valores de la paleta con menos contraste por diseño — nunca `text`/`bg` (ya son el
// máximo contraste posible) ni `positive`/`negative` (colores semánticos fijos, apartado 84).
export const CONTRASTE_ALTO_OSCURO = { textMuted: '#C4C9D2', border: '#3A4250' };
export const CONTRASTE_ALTO_CLARO = { textMuted: '#33383F', border: '#B9C0CB' };

// Fase 1 del Sistema de Personalización Visual Extrema — `aplicarTema` gana un tercer parámetro,
// `accentHex`: además de mutar `COLORS` con la paleta base del tema (como ya hacía desde la Fase
// A3), ahora también calcula y añade los roles derivados del acento (escala de marca, texto
// legible sobre el acento, bordes/texto secundarios, estados de interacción, efectos — ver
// `buildRolesFromAccent` en `src/lib/colorEngine.js`). Sigue siendo el mismo patrón de mutación
// en el sitio sobre el objeto singleton `COLORS` que ya leen por referencia ~20 vistas — ningún
// archivo existente necesita cambiar de import para heredar estos tokens nuevos.
export function aplicarTema(nombreResuelto, altoContraste, accentHex) {
  const base = nombreResuelto === 'claro' ? COLORS_CLARO : COLORS_OSCURO;
  Object.assign(COLORS, base);
  if (altoContraste) Object.assign(COLORS, nombreResuelto === 'claro' ? CONTRASTE_ALTO_CLARO : CONTRASTE_ALTO_OSCURO);
  if (accentHex) Object.assign(COLORS, buildRolesFromAccent(accentHex, COLORS));
}

export const DEFAULT_APARIENCIA = {
  tema: 'oscuro', // 'oscuro' | 'claro' | 'automatico'
  tamanoTexto: 'predeterminado', // 'pequeno' | 'predeterminado' | 'grande'
  densidad: 'estandar', // 'compacta' | 'estandar' | 'comoda' — Fase A7: ya tiene efecto visual real (ver index.css)
  radioBorde: 'redondeado', // 'recto' | 'suave' | 'redondeado'
  animaciones: 'completa', // 'completa' | 'reducida' | 'minima' | 'desactivadas'
  reducirMovimiento: false,
  altoContraste: false, // Fase A7 — Accesibilidad
};

// Fase A7 — apartado 86: paletas predefinidas. Con la arquitectura real de la app (un tema
// claro/oscuro + un acento, no un sistema de colores derivados independiente), la forma honesta
// de ofrecer "paletas completas" es una combinación fija de tema + acento aplicados juntos de un
// toque — no un sistema de color paralelo nuevo.
export const PALETAS_PREDEFINIDAS = [
  { id: 'clasico', label: 'Clásico', tema: 'oscuro', accent: '#5C7E9A' },
  { id: 'oceano', label: 'Océano', tema: 'oscuro', accent: '#4F9494' },
  { id: 'bosque', label: 'Bosque', tema: 'oscuro', accent: '#5E8C6A' },
  { id: 'medianoche', label: 'Medianoche', tema: 'oscuro', accent: '#7A6A9E' },
  { id: 'grafito', label: 'Grafito', tema: 'oscuro', accent: '#7C8592' },
  { id: 'arena', label: 'Arena', tema: 'claro', accent: '#C9A24B' },
  { id: 'aurora', label: 'Aurora', tema: 'claro', accent: '#B37A93' },
];

export const TEMAS_DISPONIBLES = [
  { value: 'oscuro', label: 'Oscuro' },
  { value: 'claro', label: 'Claro' },
  { value: 'automatico', label: 'Automático' },
];

export const TAMANOS_TEXTO = [
  { value: 'pequeno', label: 'Pequeño', px: 14 },
  { value: 'predeterminado', label: 'Predeterminado', px: 16 },
  { value: 'grande', label: 'Grande', px: 18 },
];

export const DENSIDADES_INTERFAZ = [
  { value: 'compacta', label: 'Compacta' },
  { value: 'estandar', label: 'Estándar' },
  { value: 'comoda', label: 'Cómoda' },
];

export const RADIOS_BORDE = [
  { value: 'recto', label: 'Recto' },
  { value: 'suave', label: 'Suave' },
  { value: 'redondeado', label: 'Redondeado' },
];

export const NIVELES_ANIMACION = [
  { value: 'completa', label: 'Completa' },
  { value: 'reducida', label: 'Reducida' },
  { value: 'minima', label: 'Mínima' },
  { value: 'desactivadas', label: 'Desactivadas' },
];

export const SKILLS = ['Handstand', 'Front Lever', 'Back Lever', 'Planche', 'Human Flag', 'Muscle Up', 'L-Sit'];

export const ACTIVIDAD_FACTORES = { sedentario: 1.2, ligero: 1.375, moderado: 1.55, intenso: 1.725 };

// Fase A2 — Perfil expandido (Entrega 1 de la especificación extendida, apartados 49-78):
// campos nuevos añadidos a DEFAULT_PERFIL sin tocar los que ya existían (nombre, fechaNacimiento,
// altura, peso, actividad). App.jsx hace merge con este default al cargar (`{ ...DEFAULT_PERFIL,
// ...p }`) para que un perfil ya guardado antes de esta fase no se quede sin estos campos nuevos.
export const DEFAULT_PERFIL = {
  nombre: 'Josué', fechaNacimiento: '2010-07-29', altura: 187, peso: 72, actividad: 'moderado',
  apellidos: '', nombreMostrado: '', sexo: '', pronombres: '', manoDominante: '',
  pesoObjetivo: null, objetivoPrincipal: '', deportesPracticados: [], nivelDeportivo: '',
  aniosExperiencia: '', lesiones: [],
  nivelEducativo: '', estudiosActuales: '', profesion: '',
  idioma: 'es', zonaHorariaAutomatica: true, zonaHorariaManual: '', pais: '', region: '', sistemaUnidades: 'metrico',
};

export const SEXOS_PERFIL = ['Masculino', 'Femenino', 'Otro', 'Prefiero no decirlo'];
export const MANOS_DOMINANTES = ['Diestra', 'Zurda', 'Ambidiestra'];
export const OBJETIVOS_PRINCIPALES = [
  'Ganar masa muscular', 'Perder grasa', 'Mantener peso', 'Mejorar rendimiento',
  'Salud general', 'Calistenia', 'Fútbol', 'Productividad', 'Bienestar',
];
export const DEPORTES_DISPONIBLES = [
  'Calistenia', 'Fútbol', 'Running', 'Gimnasio', 'Natación', 'Ciclismo', 'Escalada', 'Baloncesto',
];
export const NIVELES_DEPORTIVOS = ['Principiante', 'Intermedio', 'Avanzado', 'Experto'];
export const ANIOS_EXPERIENCIA_OPCIONES = ['Menos de 1 año', '1-2 años', '3-5 años', '5-10 años', 'Más de 10 años'];
export const ESTADOS_LESION = ['Activa', 'En recuperación', 'Histórica'];
export const NIVELES_EDUCATIVOS = ['Educación Secundaria', 'Bachillerato', 'Formación Profesional', 'Universidad', 'Máster', 'Doctorado', 'Otros'];
export const IDIOMAS_DISPONIBLES = [{ value: 'es', label: 'Español' }]; // único disponible hoy — arquitectura lista para más (apartado 68), sin i18n real construido todavía
export const SISTEMAS_UNIDADES = [
  { value: 'metrico', label: 'Métrico (cm, kg)' },
  { value: 'imperial', label: 'Imperial (ft/in, lb)' },
]; // Fase A2 solo guarda la preferencia — la conversión real en el resto de la app (Salud, Nutrición...) queda pendiente, no prometerla como ya activa.
export const DEFAULT_ECONOMIA = { saldoInicial: 0, hucha: 0, movimientos: [] };
// Fase 5 — Calistenia a fondo: cada habilidad ya no es solo un "nivel 0-100", ahora también
// lleva su propia progresión (pasos, editables a mano y/o generados por IA), PRs (récords
// personales) y un registro de sesiones (para detectar sobreentrenamiento por racha de días).
export const DEFAULT_CALISTENIA = Object.fromEntries(
  SKILLS.map((s) => [s, { nivel: 0, progresion: [], prs: [], sesiones: [] }])
);

// Fase 3 — Salud: dos listas independientes de entrada manual.
// "medidas" = evolución numérica (peso, grasa corporal, frecuencia cardíaca, tensión).
// "historial" = eventos puntuales (lesiones, enfermedades, medicamentos, síntomas, vacunas, análisis).
export const DEFAULT_SALUD = { medidas: [], historial: [] };

export const TIPOS_HISTORIAL_MEDICO = [
  'Lesión', 'Enfermedad', 'Medicamento', 'Síntoma', 'Vacuna', 'Análisis médico', 'Otro',
];

// Fase 4 — Nutrición: comidas registradas, agua por día (ml) y favoritos reutilizables.
export const DEFAULT_NUTRICION = { comidas: [], agua: {}, favoritos: [] };
export const VASO_ML = 250;

// Fase 6 — Estudios: varios "programas" en paralelo (por defecto Bachillerato y Música, pero
// se pueden añadir más), cada uno con sus propias asignaturas. Exámenes y horas estudiadas
// referencian su asignatura por id (mismo criterio relacional que el resto de la app).
export const DEFAULT_PROGRAMAS_ESTUDIO = [
  { id: 'bachillerato', nombre: 'Bachillerato' },
  { id: 'musica', nombre: 'Música' },
];
export const DEFAULT_ESTUDIOS = {
  programas: DEFAULT_PROGRAMAS_ESTUDIO,
  asignaturas: [], // { id, programaId, nombre }
  examenes: [],    // { id, asignaturaId, fecha, tema, notaObjetivo, notaObtenida, planRepaso: [{id, texto, hecho}] }
  horas: [],       // { id, asignaturaId, fecha, horas, notas }
};

// Fase 7 — Negocio: Josué pidió explícitamente que este módulo sea simple y no sea prioritario.
// Una sola lista de proyectos/ideas, sin sub-listas de movimientos: ingresos y gastos son aquí
// totales acumulados que el usuario actualiza a mano, no un libro de transacciones (eso ya lo
// cubre el módulo de Economía si algún día se quiere cruzar).
export const ESTADOS_NEGOCIO = ['Idea', 'En marcha', 'Pausado'];
export const DEFAULT_NEGOCIO = { proyectos: [] };

// Fase 8 — Productividad: hábitos con racha "en pausa" (un solo día fallado no la rompe a
// cero — se recalcula en el propio ProductivityView), rutinas/checklists reutilizables, tareas
// puntuales con fecha opcional, metas a corto plazo (distintas de los Objetivos a 30d-10a de la
// futura Fase 9) y un contador diario de pomodoros completados.
export const DEFAULT_PRODUCTIVIDAD = { habitos: [], rutinas: [], tareas: [], metas: [], pomodoros: {} };
export const PERIODOS_META = ['Diaria', 'Semanal', 'Mensual', 'Anual'];

// Fase 9 — Objetivos: narrativa larga (30 días a 10 años), deliberadamente distinta de las
// "metas" cortas de Productividad. Fijos (la IA no los cambia sola), con recordatorio periódico
// para revisarlos y una revisión asistida por IA que solo sugiere, nunca añade nada sola.
export const PLAZOS_OBJETIVO = ['30 días', '90 días', '1 año', '5 años', '10 años'];
export const DEFAULT_OBJETIVOS = { lista: [], ultimaRevision: null };
export const DIAS_ENTRE_REVISIONES = 30;

// Fase 10 — Diario: una entrada breve por día (cómo se siente, qué ha aprendido, qué mejorará
// mañana). Sin PIN adicional — Josué ya confirmó que no lo necesita aparte del PIN general de
// la app (a diferencia de la futura Fase 12, Relación, que sí lo usará vía PinGate).
export const ESTADOS_ANIMO = [
  { valor: 1, emoji: '😞', label: 'Mal' },
  { valor: 2, emoji: '😕', label: 'Regular' },
  { valor: 3, emoji: '😐', label: 'Normal' },
  { valor: 4, emoji: '🙂', label: 'Bien' },
  { valor: 5, emoji: '😄', label: 'Muy bien' },
];
export const DEFAULT_DIARIO = { entradas: [] };

// Fase 11 — Biblioteca: PDFs, vídeos, fotos, apuntes y enlaces en un mismo espacio de material
// de referencia (sobre todo del instituto). Los archivos (pdf/vídeo/foto) siguen el mismo patrón
// que las fotos de progreso (Fase 3) y los vídeos de calistenia (Fase 5): viven en Supabase Storage
// y se guardan fuera del sistema de deshacer, en su propio estado (bibliotecaArchivos en App.jsx),
// para no dejar un archivo huérfano en Storage si se deshace un cambio. Apuntes y enlaces son texto
// puro, así que sí pasan por snapshotAndSave/deshacer como el resto de módulos de datos.
export const TIPOS_ARCHIVO_BIBLIOTECA = [
  { id: 'pdf', label: 'PDF', accept: 'application/pdf' },
  { id: 'video', label: 'Vídeo', accept: 'video/*' },
  { id: 'foto', label: 'Foto', accept: 'image/*' },
];
export const DEFAULT_BIBLIOTECA = { apuntes: [], enlaces: [] };

// Fase 12 — Relación: módulo privado, protegido por el mismo PIN que ya usa la pestaña Fotos
// de Salud (PinGate). Solo nombre + lista de fechas importantes, entrada manual, sin IA (no la
// pide el Prompt Maestro para esta fase). "fechas" son texto puro, así que pasan por
// snapshotAndSave/deshacer como el resto de módulos de datos (Diario, Biblioteca-apuntes...).
export const DEFAULT_RELACION = { nombre: '', fechas: [] }; // fechas: [{ id, etiqueta, fecha }]

// Fase 14 — Fe y vida espiritual: cuatro sub-áreas independientes (servicio, calendario, diario
// espiritual, objetivos), todas de entrada manual y sin PIN (Josué no pidió privacidad extra
// aquí, a diferencia de Relación). "servicio" es un registro de cuándo has servido en cada rol;
// "eventos" es el calendario general de convivencias/reuniones/catequesis, con fecha puntual (no
// recurrente como las fechas de Relación — un retiro pasado no "vuelve" el año que viene solo).
// "diario" reutiliza el patrón de Textarea del Diario general (Fase 10) pero en su propio array,
// sin mezclarse con él. "objetivos" reutiliza PLAZOS_OBJETIVO, mismo patrón que la Fase 9 pero en
// su propia lista — objetivos espirituales, no de vida general.
export const TIPOS_SERVICIO_FE = ['Eucaristía', 'Anuncio', 'Preparación', 'Palabra', 'Otro'];
export const TIPOS_EVENTO_FE = ['Convivencia', 'Reunión', 'Catequesis', 'Retiro', 'Otro'];
export const DEFAULT_FE = { servicio: [], eventos: [], diario: [], objetivos: [] };

// Fase 15 — Bienestar digital: registro manual del Tiempo de Uso (la importación automática
// queda pendiente, igual que la del banco en Economía — ver TODOs). Cada registro se clasifica
// en una de tres categorías, que alimentan tres índices puramente descriptivos sobre el propio
// registro de Josué (% de minutos en cada una), no una medición real del dispositivo — la app
// NUNCA puede interceptar el uso real de Instagram/TikTok, eso no es viable en una PWA, y así se
// deja explícito en la UI. "Concentración" es un temporizador simulado dentro de la propia app,
// mismo patrón que el Pomodoro de Productividad pero con duración elegible. Las recompensas son
// deliberadamente discretas (un mensaje breve al completar) — Josué pidió no sobregamificar, así
// que no hay puntos, niveles ni rachas nuevas en este módulo.
export const CATEGORIAS_TIEMPO_USO = [
  { id: 'productivo', label: 'Productivo' },
  { id: 'distraccion', label: 'Distracción' },
  { id: 'neutro', label: 'Neutro' },
];
export const DURACIONES_CONCENTRACION = [10, 20, 30, 45, 60]; // minutos
export const DEFAULT_BIENESTAR = { registros: [], reflexiones: [], sesiones: [] };

// Fase 19 — Personalización total: todo lo que toca a "cómo se organiza y se ve" la navegación
// vive en un único objeto separado de `ajustes` (accent/pin), porque crece con el tiempo y no
// tiene relación con la sesión. Los iconos alternativos NO se guardan como componentes (no son
// serializables) sino como una clave de este catálogo, resuelta en cada render en App.jsx.
// Deliberadamente excluidos de la personalización: los 4 accesos rápidos de la barra inferior
// (PRIMARY_NAV) y "Ajustes" mismo — mantenerlos fijos evita que Josué se quede sin forma de
// volver a mostrar algo que ocultó por error.
export const ICONOS_PERSONALIZABLES_IDS = ['star', 'zap', 'flame', 'sparkles', 'compass', 'gem', 'anchor', 'feather'];

// Métricas que se pueden fijar como favoritas en el panel "Hoy" — cada una se calcula a partir
// de datos que ya existen en otros módulos, igual que Estadísticas/Predicciones no crean datos
// propios. Máximo 4 a la vez, para no convertir el Dashboard en una segunda pantalla de datos.
export const METRICAS_FAVORITAS_DISPONIBLES = [
  { id: 'peso', label: 'Peso actual' },
  { id: 'hucha', label: 'Hucha' },
  { id: 'racha_habito', label: 'Mejor racha de hábito' },
  { id: 'proximo_objetivo', label: 'Objetivo más próximo' },
  { id: 'animo_medio', label: 'Ánimo medio (7 días)' },
  { id: 'sesiones_concentracion', label: 'Concentración esta semana' },
];
export const MAX_METRICAS_FAVORITAS = 4;

// orden/ocultos/iconos/pinExtra usan ids de MORE_NAV (App.jsx). "pinExtra" es aparte del PIN
// forzado de Relación (Fase 12) — aquí Josué elige voluntariamente qué otros módulos proteger
// con el mismo PIN, así que nunca incluye 'relacion' (ya protegido siempre, sin poder quitarlo).
// "modo" (Fase 20) es el modo "viaje/vacaciones/exámenes" activo — null si ninguno.
export const DEFAULT_PERSONALIZACION = { orden: [], ocultos: [], iconos: {}, pinExtra: [], favoritas: [], modo: null };

// Fase 20 — Modos "viaje/vacaciones/exámenes": Josué pidió esto como plantillas ligeras, no un
// motor genérico de modos configurables. Cada modo es solo un aviso discreto en el Dashboard
// con 2-3 recordatorios de texto fijo relevantes a esa situación — no oculta ni reordena ningún
// módulo (eso ya lo cubre Personalización, Fase 19, y mezclarlo complicaría deshacerlo). Se
// activa/desactiva a mano desde Ajustes → Personalización avanzada; nunca se activa solo.
export const MODOS_APP = [
  {
    id: 'viaje',
    label: 'Viaje',
    tips: [
      'Registra el sueño aunque cambie de horario — ayuda a ver el efecto del viaje.',
      'Si vas a gastar más de lo normal, anótalo en Economía para no perder la cuenta.',
      'La calistenia y el estudio pueden bajar de ritmo unos días — es normal, no rompe nada.',
    ],
  },
  {
    id: 'vacaciones',
    label: 'Vacaciones',
    tips: [
      'Las rachas de hábitos se pausan solas si fallas un día — no hace falta forzar nada.',
      'Buen momento para ponerte al día con el Diario o la revisión de Objetivos.',
      'Bienestar digital sigue siendo útil aunque cambie tu rutina de pantallas estos días.',
    ],
  },
  {
    id: 'examenes',
    label: 'Exámenes',
    tips: [
      'Revisa el plan de repaso de tus exámenes próximos en Estudios.',
      'Dormir bien ayuda a rendir mejor — vigila las horas de sueño estas semanas.',
      'Si el estrés sube, el Diario o el módulo de Fe pueden ayudarte a ordenar la cabeza.',
    ],
  },
];

// Fase A4 — Notificaciones reales (Entrega 1 de la especificación extendida, apartados 111-138).
// Alcance real: sin servidor de Web Push (exigiría Service Worker con push, tabla de
// suscripciones en Supabase y otra función serverless en Vercel — infraestructura nueva, no una
// ampliación de esto), así que las notificaciones del sistema solo llegan mientras la PWA está
// abierta en el navegador, usando la Notification API directamente (ver src/lib/notificaciones.js).
// "categorias" apagado por defecto en 'sistema' desactivado da igual — lo que manda es la doble
// puerta activadas + categoria + permiso concedido, todas deben cumplirse.
export const DEFAULT_NOTIFICACIONES = {
  activadas: false, // apagado hasta que Josué conceda el permiso y lo active a propósito
  categorias: {
    salud: true, sueno: true, entrenamiento: true, nutricion: true, economia: true,
    estudios: true, productividad: true, ia: true, objetivos: true, sistema: true,
  },
  horarioDescansoActivo: false,
  horarioDescansoInicio: '23:00',
  horarioDescansoFin: '07:00',
};

// Fase A5 — Seguridad avanzada (Entrega 1, apartados 139-172). `seguridad` vive dentro de la
// misma clave 'ajustes' que accent/pin/apariencia/notificaciones... no, notificaciones tiene
// clave propia (Fase A4) — `seguridad` sí va dentro de 'ajustes' porque está directamente ligada
// al PIN que ya vive ahí (biometría es un método de desbloqueo alternativo del mismo candado).
// `biometriaCredencialId` es el id (en base64) de la credencial WebAuthn creada en este
// dispositivo — ver src/lib/biometria.js para el límite honesto de qué tan "segura" es esto.
export const DEFAULT_SEGURIDAD = {
  bloqueoAutomatico: 'nunca', // 'inmediato' | '30s' | '1min' | '5min' | '15min' | 'nunca'
  biometriaActiva: false,
  biometriaCredencialId: null,
};

export const OPCIONES_BLOQUEO_AUTOMATICO = [
  { value: 'inmediato', label: 'Inmediatamente', ms: 3000 },
  { value: '30s', label: '30 segundos', ms: 30000 },
  { value: '1min', label: '1 minuto', ms: 60000 },
  { value: '5min', label: '5 minutos', ms: 300000 },
  { value: '15min', label: '15 minutos', ms: 900000 },
  { value: 'nunca', label: 'Nunca (no recomendado)', ms: null },
];

export const CATEGORIAS_NOTIFICACION = [
  { value: 'salud', label: 'Salud' },
  { value: 'sueno', label: 'Sueño' },
  { value: 'entrenamiento', label: 'Entrenamiento' },
  { value: 'nutricion', label: 'Nutrición' },
  { value: 'economia', label: 'Economía' },
  { value: 'estudios', label: 'Estudios' },
  { value: 'productividad', label: 'Productividad' },
  { value: 'ia', label: 'Inteligencia Artificial' },
  { value: 'objetivos', label: 'Objetivos' },
  { value: 'sistema', label: 'Sistema' },
];

// Fase 2 del Sistema de Personalización Visual Extrema — historial de colores del `ColorPicker`
// (recientes: los últimos usados, sin duplicados, más nuevo primero; favoritos: marcados a mano
// por Josué). Clave de Supabase propia (`historialColor`), guardado directo sin pasar por
// snapshotAndSave/deshacer — mismo criterio que `notificaciones`/`personalizacion`: es
// configuración/preferencia, no un dato de un módulo que tenga sentido deshacer.
export const DEFAULT_HISTORIAL_COLOR = { recientes: [], favoritos: [] };
export const MAX_COLORES_RECIENTES = 12;
export const MAX_COLORES_FAVORITOS = 24;
