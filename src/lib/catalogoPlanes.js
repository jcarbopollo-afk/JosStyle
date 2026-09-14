/* Entrega 4 · Fase 5/45 — LOS DATOS DE LA BIBLIOTECA DE PLANIFICACIONES.
   ═══════════════════════════════════════════════════════════════════════════

   Diecisiete planes prediseñados, **compuestos por ejercicios que existen de
   verdad en el catálogo de la F2**. El apartado 2 lo pide con todas las letras:
   *"NO quiero que los planes sean simplemente nombres vacíos. Cada plan debe
   tener una estructura real y estar compuesto por ejercicios existentes en el
   catálogo creado en la Fase 2."*

   🚨 **Este archivo NO importa nada de `planes.js`**, igual que
   `catalogoEjercicios.js` no importa nada de `ejercicios.js`: los datos por un
   lado y el modelo por otro, sin ciclo (apartado 22: *"Separar datos, modelos,
   lógica y UI"*).

   🚨 **Y NO viven en `app_data`.** Son **datos de la aplicación**, como el
   catálogo de ejercicios: guardarlos por usuario significaría que corregir un
   plan no le llega nunca a quien ya tiene cuenta. Lo que sí se guarda es **cuál
   ha elegido** (`fitness.planActivo`) y **cuáles ha marcado** como favoritos.

   ⚠️ **Ni la duración ni la distribución muscular están escritas aquí**
   (apartado 10: *"No quiero porcentajes escritos manualmente si pueden
   calcularse"*). Salen de los ejercicios de cada día, con las funciones de la
   F3. Lo único escrito es lo que no se puede derivar: el nombre, para quién es
   y cómo se reparte la semana.

   ⚠️ **Y ni una imagen inventada** (apartado 5): `thumbnail` vale `null` en los
   diecisiete y la pantalla dibuja el icono del grupo muscular que más pesa. Una
   URL que nadie ha dado no existe (regla 8 y D2-03). */

/* Una línea por repeticiones y otra por tiempo. Escribirlas así —en vez de un
   objeto entero por ejercicio— es lo que hace que estos diecisiete planes se
   puedan leer de un vistazo y corregir sin miedo. */
const e = (exerciseId, series, repeticiones, descanso = 90, repsHasta = null) =>
  ({ exerciseId, series, repeticiones, repsHasta, descanso, modo: 'reps' });
const t = (exerciseId, series, duracion, descanso = 60) =>
  ({ exerciseId, series, duracion, descanso, modo: 'tiempo' });
/* Un día de descanso: existe en la semana y no tiene ejercicios (apartado 9). */
const off = (nombre = 'Descanso') => ({ nombre, descanso: true, lineas: [] });

export const CATALOGO_PLANES_BRUTO = [
  /* ═══════════════════════ GYM (6) ═══════════════════════ */
  {
    id: 'ppl-estetico',
    nombre: 'PPL Estético',
    subtitulo: 'Empuje, tirón y pierna, dos veces por semana',
    descripcion: 'El reparto clásico de empuje, tirón y pierna, con dos días más para cerrar la semana. Mucho volumen repartido, sin machacar el mismo músculo dos días seguidos.',
    entorno: 'gym', objetivo: 'hipertrofia', dificultad: 'intermedio', frecuencia: 5,
    paraQuien: 'Ya llevas unos meses entrenando y quieres ganar tamaño sin vivir en el gimnasio.',
    tags: ['ppl', 'volumen', 'estetica', 'push', 'pull'],
    dias: [
      { nombre: 'Push', lineas: [
        e('press-banca-barra', 4, 8, 120, 10), e('press-inclinado-mancuernas', 3, 10, 90, 12),
        e('press-militar-barra', 3, 8, 120), e('elevaciones-laterales', 3, 15, 60),
        e('fondos-paralelas-triceps', 3, 10, 90), e('extension-polea', 3, 12, 60)] },
      { nombre: 'Pull', lineas: [
        e('dominada-prona', 4, 8, 120), e('remo-barra', 4, 10, 120),
        e('jalon-al-pecho', 3, 12, 90), e('face-pull', 3, 15, 60),
        e('curl-barra', 3, 10, 60), e('curl-martillo', 3, 12, 60)] },
      { nombre: 'Legs', lineas: [
        e('sentadilla-barra', 4, 8, 150), e('peso-muerto-rumano', 3, 10, 120),
        e('prensa-piernas', 3, 12, 90), e('curl-femoral', 3, 12, 60),
        e('elevacion-talones', 4, 15, 45), t('plancha-frontal', 3, 45)] },
      off(),
      { nombre: 'Upper', lineas: [
        e('press-banca-mancuernas', 3, 10, 90), e('remo-mancuerna', 3, 10, 90),
        e('press-arnold', 3, 10, 90), e('dominada-supina', 3, 8, 90),
        e('curl-predicador', 3, 12, 60), e('press-frances', 3, 12, 60)] },
      { nombre: 'Lower', lineas: [
        e('sentadilla-frontal', 4, 8, 150), e('hip-thrust', 3, 10, 90),
        e('zancada-bulgara', 3, 10, 90), e('extension-cuadriceps', 3, 15, 60),
        e('elevacion-piernas-colgado', 3, 12, 60)] },
      off(),
    ],
  },
  {
    id: 'upper-lower',
    nombre: 'Upper / Lower',
    subtitulo: 'Cuatro días, tren superior y tren inferior',
    descripcion: 'Dos días de tren superior y dos de tren inferior. Suficiente frecuencia para crecer y suficiente descanso para recuperarte.',
    entorno: 'gym', objetivo: 'hipertrofia', dificultad: 'intermedio', frecuencia: 4,
    paraQuien: 'Puedes ir cuatro días y quieres tocar cada músculo dos veces por semana.',
    tags: ['upper', 'lower', 'frecuencia', 'hipertrofia'],
    dias: [
      { nombre: 'Upper A', lineas: [
        e('press-banca-barra', 4, 8, 120), e('remo-barra', 4, 8, 120),
        e('press-militar-barra', 3, 10, 90), e('jalon-al-pecho', 3, 12, 90),
        e('curl-mancuernas', 3, 12, 60), e('extension-polea', 3, 12, 60)] },
      { nombre: 'Lower A', lineas: [
        e('sentadilla-barra', 4, 8, 150), e('peso-muerto-rumano', 3, 10, 120),
        e('zancadas', 3, 12, 90), e('curl-femoral', 3, 12, 60),
        e('elevacion-talones', 4, 15, 45)] },
      off(),
      { nombre: 'Upper B', lineas: [
        e('press-inclinado-barra', 4, 8, 120), e('dominada-prona', 4, 8, 120),
        e('press-hombro-mancuernas', 3, 10, 90), e('remo-polea-baja', 3, 12, 90),
        e('curl-martillo', 3, 12, 60), e('press-cerrado', 3, 10, 90)] },
      { nombre: 'Lower B', lineas: [
        e('peso-muerto', 4, 5, 180), e('prensa-piernas', 3, 12, 90),
        e('hip-thrust', 3, 10, 90), e('extension-cuadriceps', 3, 15, 60),
        t('plancha-lateral', 3, 30)] },
      off(), off(),
    ],
  },
  {
    id: 'full-body-gym',
    nombre: 'Full Body',
    subtitulo: 'Tres días, todo el cuerpo cada vez',
    descripcion: 'Los movimientos básicos tres veces por semana. Es lo que más rápido enseña a un principiante, y lo que menos tiempo pide.',
    entorno: 'gym', objetivo: 'fuerza', dificultad: 'principiante', frecuencia: 3,
    paraQuien: 'Estás empezando en el gimnasio y quieres aprender los movimientos que importan.',
    tags: ['full body', 'basicos', 'empezar', 'fuerza'],
    dias: [
      { nombre: 'Día A', lineas: [
        e('sentadilla-barra', 3, 8, 150), e('press-banca-barra', 3, 8, 120),
        e('remo-barra', 3, 10, 90), e('press-militar-barra', 3, 10, 90),
        t('plancha-frontal', 3, 40)] },
      off(),
      { nombre: 'Día B', lineas: [
        e('peso-muerto', 3, 5, 180), e('press-inclinado-mancuernas', 3, 10, 90),
        e('jalon-al-pecho', 3, 12, 90), e('elevaciones-laterales', 3, 15, 60),
        e('crunch', 3, 15, 45)] },
      off(),
      { nombre: 'Día C', lineas: [
        e('sentadilla-goblet', 3, 12, 90), e('fondos-paralelas-pecho', 3, 8, 90),
        e('dominada-prona', 3, 6, 120), e('curl-barra', 3, 12, 60),
        e('elevacion-talones', 3, 15, 45)] },
      off(), off(),
    ],
  },
  {
    id: 'hibrido-fuerza',
    nombre: 'Fuerza híbrida',
    subtitulo: 'Barra pesada y trabajo accesorio',
    descripcion: 'Los tres levantamientos grandes con series bajas, y accesorios para lo que la barra sola no cubre.',
    entorno: 'gym', objetivo: 'fuerza', dificultad: 'avanzado', frecuencia: 4,
    paraQuien: 'Quieres levantar más peso y ya tienes la técnica de sentadilla, banca y peso muerto.',
    tags: ['fuerza', 'barra', 'powerlifting', 'pesado'],
    dias: [
      { nombre: 'Sentadilla', lineas: [
        e('sentadilla-barra', 5, 5, 180), e('sentadilla-frontal', 3, 6, 150),
        e('prensa-piernas', 3, 10, 90), e('curl-femoral', 3, 12, 60)] },
      { nombre: 'Banca', lineas: [
        e('press-banca-barra', 5, 5, 180), e('press-inclinado-barra', 3, 8, 120),
        e('press-cerrado', 3, 8, 90), e('elevaciones-laterales', 3, 15, 60)] },
      off(),
      { nombre: 'Peso muerto', lineas: [
        e('peso-muerto', 5, 3, 210), e('peso-muerto-rumano', 3, 8, 120),
        e('remo-barra', 4, 8, 120), e('encogimientos-trapecio', 3, 15, 60)] },
      { nombre: 'Accesorios', lineas: [
        e('dominada-lastrada', 4, 6, 150), e('press-militar-barra', 4, 6, 150),
        e('curl-barra', 3, 10, 60), e('press-frances', 3, 10, 60),
        e('hiperextensiones', 3, 12, 60)] },
      off(), off(),
    ],
  },
  {
    id: 'hipertrofia-6',
    nombre: 'Hipertrofia avanzada',
    subtitulo: 'Seis días, un músculo cada vez',
    descripcion: 'Volumen alto repartido en seis sesiones cortas. Cada día se lleva uno o dos grupos, sin prisa.',
    entorno: 'gym', objetivo: 'hipertrofia', dificultad: 'avanzado', frecuencia: 6,
    paraQuien: 'Entrenas casi todos los días y quieres exprimir cada grupo muscular.',
    tags: ['volumen', 'hipertrofia', 'seis dias', 'avanzado'],
    dias: [
      { nombre: 'Pecho', lineas: [
        e('press-banca-barra', 4, 8, 120), e('press-inclinado-mancuernas', 4, 10, 90),
        e('aperturas-mancuernas', 3, 12, 60), e('cruce-poleas', 3, 15, 60),
        e('fondos-paralelas-pecho', 3, 10, 90)] },
      { nombre: 'Espalda', lineas: [
        e('dominada-prona', 4, 8, 120), e('remo-barra', 4, 10, 120),
        e('remo-polea-baja', 3, 12, 90), e('pullover-mancuerna', 3, 12, 60),
        e('encogimientos-trapecio', 3, 15, 60)] },
      { nombre: 'Piernas', lineas: [
        e('sentadilla-barra', 4, 8, 150), e('prensa-piernas', 4, 12, 90),
        e('curl-femoral', 4, 12, 60), e('extension-cuadriceps', 4, 15, 60),
        e('elevacion-talones', 4, 20, 45)] },
      { nombre: 'Hombros', lineas: [
        e('press-militar-barra', 4, 8, 120), e('press-arnold', 3, 10, 90),
        e('elevaciones-laterales', 4, 15, 45), e('pajaro-mancuernas', 3, 15, 45),
        e('face-pull', 3, 15, 45)] },
      { nombre: 'Brazos', lineas: [
        e('curl-barra', 4, 10, 60), e('curl-predicador', 3, 12, 60),
        e('curl-martillo', 3, 12, 60), e('press-frances', 4, 10, 60),
        e('extension-polea', 3, 15, 45), e('fondos-banco', 3, 12, 60)] },
      { nombre: 'Core y cuello', lineas: [
        e('elevacion-piernas-colgado', 4, 12, 60), t('plancha-frontal', 3, 60),
        e('rueda-abdominal', 3, 10, 60), e('russian-twist', 3, 20, 45),
        e('flexion-cuello', 3, 15, 45)] },
      off(),
    ],
  },
  {
    id: 'fuerza-estetica',
    nombre: 'Fuerza y estética',
    subtitulo: 'Pesado al principio, bombeo al final',
    descripcion: 'Cada sesión empieza con un básico pesado y termina con trabajo de repeticiones altas. Lo mejor de los dos mundos.',
    entorno: 'gym', objetivo: 'estetica', dificultad: 'intermedio', frecuencia: 4,
    paraQuien: 'Quieres ser más fuerte y que se note por fuera, sin elegir entre las dos cosas.',
    tags: ['fuerza', 'estetica', 'mixto', 'hibrido'],
    dias: [
      { nombre: 'Empuje pesado', lineas: [
        e('press-banca-barra', 5, 5, 180), e('press-inclinado-mancuernas', 3, 12, 90),
        e('elevaciones-laterales', 4, 15, 45), e('extension-polea', 3, 15, 45)] },
      { nombre: 'Tirón pesado', lineas: [
        e('peso-muerto', 4, 5, 180), e('dominada-lastrada', 4, 6, 150),
        e('remo-mancuerna', 3, 12, 90), e('curl-polea', 3, 15, 45)] },
      off(),
      { nombre: 'Pierna pesada', lineas: [
        e('sentadilla-barra', 5, 5, 180), e('zancada-bulgara', 3, 10, 90),
        e('curl-femoral', 3, 15, 60), e('elevacion-talones', 4, 20, 45)] },
      { nombre: 'Bombeo', lineas: [
        e('press-maquina-pecho', 4, 15, 60), e('jalon-al-pecho', 4, 15, 60),
        e('curl-mancuernas', 4, 15, 45), e('patada-triceps', 4, 15, 45),
        t('plancha-lateral', 3, 40)] },
      off(), off(),
    ],
  },

  /* ═══════════════════ CALISTENIA (6) ═══════════════════ */
  {
    id: 'calistenia-hipertrofia',
    nombre: 'Hipertrofia con calistenia',
    subtitulo: 'Crecer con tu propio peso',
    descripcion: 'Repeticiones altas en los básicos de calistenia y progresiones cuando se te quedan cortos. Se puede ganar músculo sin tocar una mancuerna.',
    entorno: 'calistenia', objetivo: 'hipertrofia', dificultad: 'intermedio', frecuencia: 4,
    paraQuien: 'Entrenas en un parque o en casa con barra, y quieres ganar tamaño.',
    tags: ['calistenia', 'hipertrofia', 'peso corporal', 'parque'],
    dias: [
      { nombre: 'Empuje', lineas: [
        e('fondos-paralelas-pecho', 4, 10, 120), e('flexion-declinada', 4, 15, 90),
        e('flexion-diamante', 3, 12, 90), e('pino-contra-pared', 3, 30, 90),
        e('fondos-banco', 3, 15, 60)] },
      { nombre: 'Tirón', lineas: [
        e('dominada-prona', 4, 8, 120), e('dominada-supina', 3, 10, 90),
        e('remo-invertido', 4, 12, 90), e('dominada-neutra', 3, 8, 90),
        e('curl-banda', 3, 15, 60)] },
      off(),
      { nombre: 'Pierna y core', lineas: [
        e('sentadilla-pistol', 3, 8, 120), e('sentadilla-salto', 3, 15, 90),
        e('puente-gluteo', 3, 20, 60), t('l-sit', 3, 20, 90),
        e('elevacion-piernas-colgado', 3, 15, 60)] },
      { nombre: 'Cuerpo entero', lineas: [
        e('muscle-up', 3, 3, 180), e('flexion-explosiva', 3, 10, 120),
        e('dominada-chest-to-bar', 3, 6, 120), e('burpee', 3, 15, 90),
        t('hollow-body', 3, 30)] },
      off(), off(),
    ],
  },
  {
    id: 'body-control',
    nombre: 'Body Control',
    subtitulo: 'Aguantar, no solo mover',
    descripcion: 'Isométricos y control del cuerpo. Todo se mide en segundos, no en repeticiones, que es como se aprende a mandar sobre tu propio peso.',
    entorno: 'calistenia', objetivo: 'core', dificultad: 'principiante', frecuencia: 3,
    paraQuien: 'Quieres empezar en calistenia y construir la base antes de los movimientos difíciles.',
    tags: ['core', 'isometrico', 'control', 'empezar'],
    dias: [
      { nombre: 'Base', lineas: [
        t('plancha-frontal', 4, 40), t('hollow-body', 4, 30),
        t('plancha-lateral', 3, 30), e('remo-invertido', 3, 12, 90),
        e('flexion', 3, 12, 60)] },
      off(),
      { nombre: 'Control', lineas: [
        t('l-sit', 4, 15, 90), t('pino-contra-pared', 4, 30, 90),
        e('mountain-climbers', 3, 20, 45), e('crunch', 3, 20, 45),
        t('puente-cuello', 3, 20)] },
      off(),
      { nombre: 'Tensión', lineas: [
        t('tuck-front-lever', 4, 10, 120), e('dominada-prona', 3, 6, 120),
        t('plancha-frontal', 3, 60), e('sentadilla-aire', 3, 20, 60),
        e('elevacion-piernas-colgado', 3, 12, 60)] },
      off(), off(),
    ],
  },
  {
    id: 'fuerza-calistenia',
    nombre: 'Fuerza en calistenia',
    subtitulo: 'Pocas repeticiones, mucha tensión',
    descripcion: 'Series cortas en las progresiones más duras. Aquí no se busca cansarse: se busca poder con lo que antes no podías.',
    entorno: 'calistenia', objetivo: 'fuerza', dificultad: 'avanzado', frecuencia: 4,
    paraQuien: 'Ya haces dominadas y fondos con soltura y quieres ir a por las progresiones serias.',
    tags: ['fuerza', 'calistenia', 'progresiones', 'avanzado'],
    dias: [
      { nombre: 'Tirón pesado', lineas: [
        e('dominada-lastrada', 5, 5, 180), t('advanced-tuck-front-lever', 4, 12, 150),
        e('remo-anillas', 4, 8, 120), e('dominada-chest-to-bar', 3, 6, 120)] },
      { nombre: 'Empuje pesado', lineas: [
        e('fondo-anillas', 5, 6, 180), t('tuck-planche', 4, 12, 150),
        e('flexion-pino', 4, 6, 150), e('flexion-diamante', 3, 12, 90)] },
      off(),
      { nombre: 'Explosivo', lineas: [
        e('muscle-up', 5, 3, 180), e('dominada-explosiva', 4, 5, 150),
        e('flexion-explosiva', 4, 8, 120), e('sentadilla-salto', 3, 15, 90)] },
      { nombre: 'Core duro', lineas: [
        e('dragon-flag', 4, 6, 150), t('back-lever', 4, 10, 150),
        t('l-sit', 4, 25, 90), e('rueda-abdominal', 3, 12, 90)] },
      off(), off(),
    ],
  },
  {
    id: 'skills-calistenia',
    nombre: 'Skills',
    subtitulo: 'Front lever, planche y bandera',
    descripcion: 'Tres días dedicados a las habilidades, cada uno con su progresión. Se entrena fresco y con descansos largos: una skill no se aprende cansado.',
    entorno: 'calistenia', objetivo: 'skills', dificultad: 'avanzado', frecuencia: 3,
    paraQuien: 'Quieres el front lever, la planche o la bandera, y estás dispuesto a ir despacio.',
    tags: ['skills', 'front lever', 'planche', 'bandera', 'pino'],
    dias: [
      { nombre: 'Front lever', lineas: [
        t('tuck-front-lever', 5, 15, 150), t('advanced-tuck-front-lever', 4, 10, 150),
        t('front-lever-una-pierna', 4, 8, 180), e('dominada-prona', 3, 8, 120)] },
      off(),
      { nombre: 'Planche', lineas: [
        t('tuck-planche', 5, 15, 150), t('advanced-tuck-planche', 4, 10, 150),
        t('pino-libre', 4, 20, 120), e('flexion-pino', 3, 6, 150)] },
      off(),
      { nombre: 'Bandera y transición', lineas: [
        t('human-flag', 5, 8, 180), e('transicion-asistida', 4, 4, 180),
        e('muscle-up', 3, 3, 180), t('l-sit', 3, 20, 90)] },
      off(), off(),
    ],
  },
  {
    id: 'upper-calistenia',
    nombre: 'Upper Body Calistenia',
    subtitulo: 'Solo tren superior, tres días',
    descripcion: 'Todo empuje y tirón con tu propio peso. Pensado para cuando las piernas ya las trabajas en otro sitio.',
    entorno: 'calistenia', objetivo: 'hipertrofia', dificultad: 'intermedio', frecuencia: 3,
    paraQuien: 'Juegas al fútbol o corres, y el gimnasio lo quieres solo para el tren superior.',
    tags: ['upper', 'calistenia', 'torso', 'brazos'],
    dias: [
      { nombre: 'Empuje', lineas: [
        e('fondos-paralelas-pecho', 4, 10, 120), e('flexion-declinada', 4, 15, 90),
        e('flexion-diamante', 3, 12, 90), e('fondos-paralelas-triceps', 3, 10, 90)] },
      off(),
      { nombre: 'Tirón', lineas: [
        e('dominada-prona', 4, 8, 120), e('dominada-supina', 3, 10, 90),
        e('remo-invertido', 4, 12, 90), e('curl-banda', 3, 15, 60)] },
      off(),
      { nombre: 'Mezcla', lineas: [
        e('muscle-up', 3, 3, 180), e('flexion-explosiva', 3, 10, 120),
        e('remo-anillas', 3, 10, 90), t('l-sit', 3, 20, 90),
        t('plancha-frontal', 3, 45)] },
      off(), off(),
    ],
  },
  {
    id: 'full-body-calistenia',
    nombre: 'Full Body Calistenia',
    subtitulo: 'Todo el cuerpo, con una barra',
    descripcion: 'Tres sesiones que tocan todo, con lo mínimo: una barra y el suelo. El plan con el que empezar si no tienes nada más.',
    entorno: 'calistenia', objetivo: 'resistencia', dificultad: 'principiante', frecuencia: 3,
    paraQuien: 'Empiezas de cero y tienes un parque cerca.',
    tags: ['full body', 'calistenia', 'empezar', 'barra'],
    dias: [
      { nombre: 'Día A', lineas: [
        e('flexion', 4, 12, 90), e('remo-invertido', 4, 12, 90),
        e('sentadilla-aire', 4, 20, 60), t('plancha-frontal', 3, 40)] },
      off(),
      { nombre: 'Día B', lineas: [
        e('dominada-prona', 4, 5, 120), e('fondos-banco', 4, 12, 60),
        e('zancadas', 3, 12, 60), e('crunch', 3, 20, 45)] },
      off(),
      { nombre: 'Día C', lineas: [
        e('flexion-rodillas', 4, 15, 60), e('remo-banda', 4, 15, 60),
        e('puente-gluteo', 4, 20, 45), t('hollow-body', 3, 25),
        e('burpee', 3, 10, 90)] },
      off(), off(),
    ],
  },

  /* ═══════════════════════ CASA (5) ═══════════════════════ */
  {
    id: 'transformacion-casa',
    nombre: 'Transformación en casa',
    subtitulo: 'Cuatro días con un par de mancuernas',
    descripcion: 'El plan más completo que se puede hacer en un salón: mancuernas, una silla y el suelo. Cuatro días repartidos para no repetir músculo.',
    entorno: 'casa', objetivo: 'estetica', dificultad: 'intermedio', frecuencia: 4,
    paraQuien: 'No vas a pisar un gimnasio, pero tienes mancuernas y ganas.',
    tags: ['casa', 'mancuernas', 'estetica', 'transformacion'],
    dias: [
      { nombre: 'Torso empuje', lineas: [
        e('press-banca-mancuernas', 4, 10, 90), e('press-inclinado-mancuernas', 3, 12, 90),
        e('press-hombro-mancuernas', 3, 10, 90), e('elevaciones-laterales', 3, 15, 45),
        e('flexion-diamante', 3, 12, 60)] },
      { nombre: 'Torso tirón', lineas: [
        e('remo-mancuerna', 4, 10, 90), e('remo-invertido', 3, 12, 90),
        e('pullover-mancuerna', 3, 12, 60), e('curl-mancuernas', 3, 12, 60),
        e('curl-martillo', 3, 12, 60)] },
      off(),
      { nombre: 'Pierna', lineas: [
        e('sentadilla-goblet', 4, 12, 90), e('zancada-bulgara', 3, 10, 90),
        e('peso-muerto-rumano', 3, 12, 90), e('puente-gluteo', 3, 20, 60),
        e('elevacion-talones', 4, 20, 45)] },
      { nombre: 'Core y cardio', lineas: [
        e('burpee', 4, 12, 90), e('mountain-climbers', 3, 25, 45),
        t('plancha-frontal', 3, 50), e('russian-twist', 3, 20, 45),
        e('crunch', 3, 20, 45)] },
      off(), off(),
    ],
  },
  {
    id: 'full-body-casa',
    nombre: 'Full Body Casa',
    subtitulo: 'Tres días, sin material',
    descripcion: 'Todo el cuerpo con el suelo y una silla. Ni una pesa.',
    entorno: 'casa', objetivo: 'resistencia', dificultad: 'principiante', frecuencia: 3,
    paraQuien: 'No tienes nada en casa y quieres empezar hoy mismo.',
    tags: ['casa', 'sin material', 'empezar', 'full body'],
    dias: [
      { nombre: 'Día A', lineas: [
        e('flexion', 3, 12, 60), e('sentadilla-aire', 4, 20, 60),
        e('remo-banda', 3, 15, 60), t('plancha-frontal', 3, 35)] },
      off(),
      { nombre: 'Día B', lineas: [
        e('flexion-rodillas', 3, 15, 60), e('step-up-silla', 3, 15, 60),
        e('puente-gluteo', 4, 20, 45), e('crunch', 3, 20, 45)] },
      off(),
      { nombre: 'Día C', lineas: [
        e('flexion-declinada', 3, 12, 60), e('zancadas', 3, 14, 60),
        e('fondos-banco', 3, 12, 60), e('mountain-climbers', 3, 25, 45),
        t('plancha-lateral', 3, 25)] },
      off(), off(),
    ],
  },
  {
    id: 'core-abs',
    nombre: 'Core & Abs',
    subtitulo: 'Quince minutos, tres veces por semana',
    descripcion: 'Solo core. Sesiones cortas que se pueden encajar después de cualquier otra cosa.',
    entorno: 'casa', objetivo: 'core', dificultad: 'principiante', frecuencia: 3,
    paraQuien: 'Ya entrenas y quieres añadir abdomen sin alargar las sesiones.',
    tags: ['core', 'abdominales', 'corto', 'casa'],
    dias: [
      { nombre: 'Core A', lineas: [
        t('plancha-frontal', 3, 45), e('crunch', 3, 20, 45),
        e('russian-twist', 3, 20, 45), t('hollow-body', 3, 25)] },
      off(),
      { nombre: 'Core B', lineas: [
        t('plancha-lateral', 3, 30), e('elevacion-piernas-colgado', 3, 12, 60),
        e('mountain-climbers', 3, 25, 45), t('l-sit', 3, 15, 60)] },
      off(),
      { nombre: 'Core C', lineas: [
        e('rueda-abdominal', 3, 10, 60), t('plancha-frontal', 3, 60),
        e('crunch', 4, 20, 40), t('puente-cuello', 3, 20)] },
      off(), off(),
    ],
  },
  {
    id: 'fuerza-casa',
    nombre: 'Fuerza en casa',
    subtitulo: 'Series cortas con mochila y mancuernas',
    descripcion: 'Menos repeticiones y más carga: mochila cargada, mancuernas y las progresiones de una pierna.',
    entorno: 'casa', objetivo: 'fuerza', dificultad: 'intermedio', frecuencia: 4,
    paraQuien: 'Entrenas en casa y las repeticiones altas se te han quedado cortas.',
    tags: ['casa', 'fuerza', 'mochila', 'unilateral'],
    dias: [
      { nombre: 'Pierna fuerte', lineas: [
        e('sentadilla-mochila', 5, 8, 150), e('sentadilla-pistol', 3, 6, 120),
        e('peso-muerto-rumano', 4, 8, 120), e('elevacion-talones', 4, 15, 45)] },
      { nombre: 'Empuje fuerte', lineas: [
        e('press-banca-mancuernas', 5, 6, 150), e('flexion-declinada', 4, 10, 90),
        e('press-arnold', 3, 8, 120), e('press-frances', 3, 10, 60)] },
      off(),
      { nombre: 'Tirón fuerte', lineas: [
        e('dominada-prona', 5, 6, 150), e('remo-mancuerna', 4, 8, 120),
        e('remo-invertido', 3, 12, 90), e('curl-mancuernas', 3, 10, 60)] },
      { nombre: 'Core y cuello', lineas: [
        e('rueda-abdominal', 4, 10, 90), t('hollow-body', 3, 35),
        e('hiperextensiones', 3, 15, 60), e('flexion-cuello', 3, 15, 45),
        e('extension-cuello', 3, 15, 45)] },
      off(), off(),
    ],
  },
  {
    id: 'minimal-equipment',
    nombre: 'Minimal Equipment',
    subtitulo: 'Una banda elástica y poco más',
    descripcion: 'Lo que se puede hacer con una banda, una silla y quince minutos. Pensado para viajes y semanas malas.',
    entorno: 'casa', objetivo: 'resistencia', dificultad: 'principiante', frecuencia: 3,
    paraQuien: 'Estás de viaje o con poco tiempo y no quieres parar del todo.',
    tags: ['casa', 'banda', 'viaje', 'minimo'],
    dias: [
      { nombre: 'Todo el cuerpo A', lineas: [
        e('flexion', 3, 12, 60), e('remo-banda', 3, 15, 60),
        e('sentadilla-aire', 3, 20, 60), e('press-banda-hombro', 3, 15, 60),
        t('plancha-frontal', 3, 35)] },
      off(),
      { nombre: 'Todo el cuerpo B', lineas: [
        e('flexion-rodillas', 3, 15, 60), e('curl-banda', 3, 15, 45),
        e('step-up-silla', 3, 15, 60), e('fondos-banco', 3, 12, 60),
        e('crunch', 3, 20, 45)] },
      off(),
      { nombre: 'Todo el cuerpo C', lineas: [
        e('burpee', 3, 10, 90), e('puente-gluteo', 3, 20, 45),
        e('remo-banda', 3, 18, 60), e('mountain-climbers', 3, 25, 45),
        t('plancha-lateral', 3, 25)] },
      off(), off(),
    ],
  },
];
