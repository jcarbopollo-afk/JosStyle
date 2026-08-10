export const COLORS = {
  bg: '#0A0C10',
  surface: '#12151B',
  surface2: '#171B23',
  border: '#222834',
  text: '#EDEFF2',
  textMuted: '#8891A3',
  positive: '#7CB88F',
  negative: '#C77C7C',
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

export const SKILLS = ['Handstand', 'Front Lever', 'Back Lever', 'Planche', 'Human Flag', 'Muscle Up', 'L-Sit'];

export const ACTIVIDAD_FACTORES = { sedentario: 1.2, ligero: 1.375, moderado: 1.55, intenso: 1.725 };

export const DEFAULT_PERFIL = { nombre: 'Josué', fechaNacimiento: '2010-07-29', altura: 187, peso: 72, actividad: 'moderado' };
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
