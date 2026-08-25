// ---------------------------------------------------------------------------
// Entrega 2 · BI Fase 2 — Índice de funciones y motor de búsqueda.
//
// QUÉ PROBLEMA RESUELVE
// El buscador que ya existía (Fase 18) busca en los DATOS de Josué: "¿cuántas
// horas dormí de media?". Lo que esta fase pide es distinto y complementario:
// buscar FUNCIONES, PANTALLAS Y AJUSTES —"colores", "modo oscuro", "dinero"—
// y abrirlos directamente, sin obligarle a saber cómo se llama cada apartado
// ni a recorrer Más → Ajustes → Apariencia → Colores.
//
// POR QUÉ EL ÍNDICE SE CONSTRUYE Y NO SE ESCRIBE
// El apartado 17 exige que añadir un módulo nuevo sea "añadir una entrada", no
// tocar la lógica del buscador. Así que los 19 módulos NO están escritos aquí:
// se derivan de `MORE_NAV` (el catálogo que ya usan la navegación, Personalización
// y Seguridad) más `DESCRIPCIONES_MODULOS` de tokens.js. Un módulo que una fase
// futura añada a MORE_NAV aparece solo en el buscador. Lo único escrito a mano
// son las palabras clave —que no se pueden derivar de nada— y las funciones de
// dentro de Ajustes, que no tienen entrada propia en ninguna lista de navegación.
//
// LO QUE ESTE ARCHIVO NO HACE, A PROPÓSITO
//   · No conoce ningún dato de Josué. Un índice de funciones que además leyera
//     sus datos sería justo lo que prohíbe el apartado 18.
//   · No inventa módulos que no existen. "racha" y "sonidos" son del control de
//     calidad del apartado 19 y hoy NO deben encontrar nada: esos módulos están
//     especificados pero no construidos, y fingirlos rompería la regla 8.
//   · No llama a la IA. Solo dice si el texto PARECE una pregunta; quien decide
//     qué hacer con eso es la interfaz.
// ---------------------------------------------------------------------------

import { DESCRIPCIONES_MODULOS } from '../tokens';

/** Minúsculas y sin acentos: "Sueño" y "sueno" tienen que encontrarse igual. */
export function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // BI Fase 3 · apartado 4 — "gestionar caracteres especiales". Los signos de
    // interrogación y la puntuación no deben impedir una coincidencia; se quitan
    // aquí y no en la detección de intención, que sí los necesita.
    .replace(/[¿?¡!.,;:()"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// BI Fase 3 · apartado 4 — "evitar diferencias entre singular y plural cuando sea
// posible". Deliberadamente tonto: quitar una 's' o 'es' final cubre el 95% del
// español cotidiano ("colores"→"color", "tareas"→"tarea") sin meter un lematizador
// entero. Solo se aplica a palabras de más de 3 letras, para no destrozar "mes",
// "tres" o "fe".
function raiz(palabra) {
  if (palabra.length > 4 && palabra.endsWith('es')) return palabra.slice(0, -2);
  // Umbral de 4, no de 3: con 3 se destrozaban palabras cortas que acaban en 's'
  // por derecho propio — "tres" se quedaba en "tre", "mes" en "me", "gas" en "ga".
  if (palabra.length > 4 && palabra.endsWith('s')) return palabra.slice(0, -1);
  return palabra;
}

/** Normaliza y además reduce cada palabra a su raíz singular. */
export function normalizarRaiz(texto) {
  return normalizar(texto).split(' ').map(raiz).join(' ');
}

// BI Fase 3 · apartado 18 — tolerancia a errores de escritura ("colroes" → "Colores").
//
// Distancia de Damerau-Levenshtein, no Levenshtein a secas: cuenta el intercambio de
// dos letras seguidas como UN error, no dos. Es la diferencia entre encontrar "colroes"
// y no encontrarlo, y las transposiciones son con mucho la errata más común al escribir
// deprisa en un móvil — que es exactamente el ejemplo que pone la especificación.
//
// Con corte temprano: en cuanto la fila entera supera el máximo aceptable se abandona,
// que es lo que evita recorrer palabras largas enteras para nada. La especificación
// pide "una tolerancia razonable", no un corrector ortográfico.
function distancia(a, b, maximo) {
  if (Math.abs(a.length - b.length) > maximo) return maximo + 1;
  const filas = [Array.from({ length: b.length + 1 }, (_, i) => i)];
  for (let i = 1; i <= a.length; i++) {
    const fila = new Array(b.length + 1);
    fila[0] = i;
    let minimoFila = i;
    for (let j = 1; j <= b.length; j++) {
      const coste = a[i - 1] === b[j - 1] ? 0 : 1;
      fila[j] = Math.min(filas[i - 1][j] + 1, fila[j - 1] + 1, filas[i - 1][j - 1] + coste);
      // Transposición: "colroes" ↔ "colores" son un solo error, no dos.
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        fila[j] = Math.min(fila[j], filas[i - 2][j - 2] + 1);
      }
      if (fila[j] < minimoFila) minimoFila = fila[j];
    }
    filas.push(fila);
    if (minimoFila > maximo) return maximo + 1;
  }
  return filas[a.length][b.length];
}

// Cuántas letras de diferencia se toleran. Una palabra corta no puede permitirse
// ninguna —"mes" y "mas" son palabras distintas, no un error de dedo— y una larga
// aguanta dos sin volverse impredecible (apartado 7: "no convertirlo en un sistema
// impredecible").
function margenErratas(q) {
  if (q.length < 5) return 0;
  if (q.length < 8) return 1;
  return 2;
}

// Palabras con las que Josué buscaría cada módulo sin acordarse de su nombre
// exacto. Es lo único que no se puede derivar: "dinero" no aparece en ningún
// sitio del código, pero es como se busca Economía.
export const PALABRAS_MODULOS = {
  salud: ['peso', 'imc', 'medidas', 'medico', 'historial', 'altura', 'cuerpo', 'analitica'],
  sueno: ['dormir', 'descanso', 'noche', 'siesta', 'despertar', 'insomnio', 'horas de sueno'],
  nutricion: ['comida', 'comer', 'calorias', 'dieta', 'agua', 'alimentacion', 'macros', 'desayuno', 'cena'],
  entreno: ['entrenar', 'entrenamiento', 'calistenia', 'gimnasio', 'ejercicio', 'futbol', 'deporte', 'habilidades', 'dominadas', 'partido'],
  calendario: ['agenda', 'eventos', 'fechas', 'planificar', 'citas', 'mes'],
  estudios: ['estudiar', 'asignaturas', 'examenes', 'notas', 'clase', 'instituto', 'deberes', 'repaso'],
  negocio: ['proyectos', 'emprender', 'empresa', 'ingresos', 'clientes'],
  productividad: ['tareas', 'habitos', 'rutinas', 'pomodoro', 'metas', 'pendientes', 'organizar', 'lista'],
  objetivos: ['metas', 'propositos', 'retos', 'conseguir'],
  diario: ['escribir', 'animo', 'reflexion', 'como me siento', 'emociones'],
  fe: ['dios', 'oracion', 'iglesia', 'espiritual', 'biblia', 'servicio'],
  biblioteca: ['apuntes', 'archivos', 'enlaces', 'documentos', 'pdf', 'guardar', 'notas'],
  relacion: ['pareja', 'novia', 'aniversario', 'privado'],
  bienestar: ['movil', 'pantallas', 'tiempo de uso', 'digital', 'concentracion', 'desconectar'],
  estadisticas: ['graficas', 'datos', 'analisis', 'tendencias', 'evolucion', 'numeros'],
  predicciones: ['futuro', 'proyeccion', 'estimacion', 'prevision'],
  logros: ['insignias', 'medallas', 'trofeos', 'conseguidos'],
  economia: ['dinero', 'gastos', 'ahorro', 'hucha', 'saldo', 'presupuesto', 'finanzas', 'gastar', 'ingresos'],
  ajustes: ['configuracion', 'opciones', 'preferencias', 'settings'],
};

// BI Fase 3 · apartado 3 — `synonyms` es un campo aparte de `keywords`, y el
// apartado 8 lo coloca un escalón por debajo en el ranking. La diferencia práctica:
// una PALABRA CLAVE es como Josué llamaría a la función ("dinero" → Economía); un
// SINÓNIMO es un término vecino, más vago, que debe encontrarla pero sin adelantar
// a la función cuyo nombre es esa palabra ("salud" también evoca Nutrición, pero
// "Salud" el módulo tiene que ganar).
export const SINONIMOS_MODULOS = {
  salud: ['bienestar fisico', 'estado fisico', 'forma'],
  sueno: ['cansancio', 'energia', 'madrugar', 'trasnochar'],
  nutricion: ['alimento', 'nutrientes', 'proteina', 'hidratacion'],
  entreno: ['fuerza', 'musculo', 'rutina de entreno', 'sesion'],
  calendario: ['horario', 'dia', 'semana', 'organizacion'],
  estudios: ['colegio', 'universidad', 'academico', 'aprender'],
  negocio: ['trabajo', 'dinero extra', 'facturar'],
  productividad: ['eficiencia', 'concentracion', 'foco', 'planificar'],
  objetivos: ['objetivo', 'ambicion', 'lograr', 'progreso'],
  diario: ['pensamientos', 'sentimientos', 'desahogo'],
  fe: ['religion', 'creencias', 'gratitud'],
  biblioteca: ['recursos', 'material', 'lectura', 'guardado'],
  relacion: ['amor', 'citas'],
  bienestar: ['descanso mental', 'salud mental', 'adiccion', 'uso del movil'],
  estadisticas: ['informes', 'metricas', 'resumen'],
  predicciones: ['tendencia', 'que pasara'],
  logros: ['recompensas', 'hitos', 'progreso'],
  economia: ['pagar', 'cobrar', 'euros', 'cuenta', 'economico'],
  ajustes: ['ajuste', 'configurar', 'cambiar'],
};

// Funciones que viven DENTRO de Ajustes y no tienen entrada propia en ninguna
// lista de navegación. `ajuste` es el id de categoría que abre `SettingsView`,
// así que pulsar un resultado abre esa categoría directamente — no deja a Josué
// en la lista de Ajustes para que la busque él (apartado 12).
export const FUNCIONES_AJUSTES = [
  {
    id: 'ajuste:apariencia', titulo: 'Colores y tema', ajuste: 'apariencia',
    descripcion: 'Color de acento, tema oscuro o claro y temas guardados.',
    palabras: ['colores', 'color', 'tema', 'acento', 'apariencia', 'paleta', 'personalizar colores'],
    sinonimos: ['diseno', 'estilo', 'aspecto', 'look'],
  },
  // Apartado 15 — "funciones profundas": el tema claro/oscuro vive DENTRO de Apariencia,
  // pero Josué lo busca por su nombre, no por el de la pantalla que lo contiene. Entrada
  // propia, mismo destino. Es el ejemplo literal del apartado 14.
  {
    id: 'ajuste:modo-oscuro', titulo: 'Modo oscuro o claro', ajuste: 'apariencia',
    descripcion: 'Cambia entre el tema oscuro y el claro.',
    palabras: ['modo oscuro', 'modo claro', 'modo noche', 'oscuro', 'claro', 'noche', 'dia', 'tema oscuro', 'tema claro'],
    sinonimos: ['brillo', 'fondo negro', 'fondo blanco'],
  },
  {
    id: 'ajuste:texto', titulo: 'Tamaño de texto y densidad', ajuste: 'apariencia',
    descripcion: 'Texto más grande o más pequeño, bordes y espaciado de la interfaz.',
    palabras: ['texto', 'letra', 'tamano', 'fuente', 'grande', 'pequeno', 'densidad', 'espaciado', 'bordes', 'redondeo', 'animaciones', 'ver mejor'],
    sinonimos: ['legibilidad', 'zoom', 'interfaz'],
  },
  {
    id: 'ajuste:pantalla-principal', titulo: 'Pantalla principal', ajuste: 'pantalla-principal',
    descripcion: 'Qué módulos usas, qué ves en Hoy y en qué orden aparece el menú.',
    palabras: ['personalizar', 'personalizacion', 'inicio', 'hoy', 'dashboard', 'modulos', 'activar modulo', 'desactivar modulo', 'ocultar', 'orden', 'reordenar', 'favoritas', 'perfiles'],
    sinonimos: ['pantalla principal', 'menu', 'que veo', 'esconder'],
  },
  {
    id: 'ajuste:notificaciones', titulo: 'Notificaciones', ajuste: 'notificaciones',
    descripcion: 'Permiso, categorías de aviso y horario de descanso.',
    palabras: ['notificaciones', 'avisos', 'alertas', 'recordatorios', 'silenciar', 'no molestar', 'horario de descanso'],
    sinonimos: ['permiso', 'push', 'me avise'],
  },
  {
    id: 'ajuste:seguridad', titulo: 'Seguridad y PIN', ajuste: 'seguridad',
    descripcion: 'PIN de acceso, biometría y qué secciones se protegen.',
    palabras: ['pin', 'seguridad', 'contrasena', 'clave', 'bloquear', 'biometria', 'face id', 'huella', 'proteger', 'cerrar sesion'],
    sinonimos: ['candado', 'privado', 'acceso', 'salir'],
  },
  {
    id: 'ajuste:privacidad', titulo: 'Privacidad', ajuste: 'privacidad',
    descripcion: 'Qué usa la inteligencia artificial y borrado por categoría.',
    palabras: ['privacidad', 'datos privados', 'que usa la ia', 'borrar categoria', 'transparencia'],
    sinonimos: ['ia', 'inteligencia artificial', 'mis datos'],
  },
  {
    id: 'ajuste:datos', titulo: 'Copia de seguridad y exportar', ajuste: 'datos',
    descripcion: 'Descargar tus datos y hacer una copia de seguridad.',
    palabras: ['exportar', 'descargar', 'copia de seguridad', 'backup', 'csv', 'excel', 'importar', 'guardar datos'],
    sinonimos: ['respaldo', 'sacar datos', 'fichero'],
  },
  {
    id: 'ajuste:papelera', titulo: 'Eliminados recientemente', ajuste: 'papelera',
    descripcion: 'Recupera algo que hayas borrado por error.',
    palabras: ['papelera', 'eliminados', 'borrado', 'recuperar', 'restaurar', 'deshacer borrado', 'basura'],
    sinonimos: ['se me borro', 'volver atras', 'reciclaje'],
  },
  {
    id: 'ajuste:perfil', titulo: 'Tu perfil', ajuste: 'perfil',
    descripcion: 'Nombre, fecha de nacimiento, altura, peso y nivel de actividad.',
    palabras: ['perfil', 'mis datos', 'nombre', 'edad', 'altura', 'cuenta'],
    sinonimos: ['quien soy', 'usuario'],
  },
  {
    id: 'ajuste:preferencias', titulo: 'Idioma, zona horaria y unidades', ajuste: 'preferencias',
    descripcion: 'Preferencias generales de la aplicación.',
    palabras: ['idioma', 'lengua', 'zona horaria', 'unidades', 'kilos', 'pais', 'formato'],
    sinonimos: ['español', 'metrico', 'hora'],
  },
  {
    id: 'ajuste:accesibilidad', titulo: 'Accesibilidad', ajuste: 'accesibilidad',
    descripcion: 'Dónde están el tamaño de texto y reducir movimiento.',
    palabras: ['accesibilidad', 'contraste', 'alto contraste', 'reducir movimiento', 'lector de pantalla'],
    sinonimos: ['ver mejor', 'mareo'],
  },
  {
    id: 'ajuste:sincronizacion', titulo: 'Sincronización', ajuste: 'sincronizacion',
    descripcion: 'Cómo viajan tus datos entre dispositivos.',
    palabras: ['sincronizacion', 'sincronizar', 'dispositivos', 'nube', 'supabase', 'otro movil'],
    sinonimos: ['cloud', 'copia en linea', 'ordenador'],
  },
  {
    id: 'ajuste:integraciones', titulo: 'Integraciones', ajuste: 'integraciones',
    descripcion: 'Conexiones con otros servicios.',
    palabras: ['integraciones', 'conectar', 'apps', 'reloj', 'wearable'],
    sinonimos: ['enlazar', 'servicios'],
  },
  {
    id: 'ajuste:informacion', titulo: 'Información y versión', ajuste: 'informacion',
    descripcion: 'Versión de la aplicación, créditos e información técnica.',
    palabras: ['version', 'informacion', 'acerca de', 'creditos', 'ayuda'],
    sinonimos: ['sobre la app', 'soporte'],
  },
];

// BI Fase 3 · apartados 10 y 11 — "el índice debe poder manejar distintos tipos de
// destino: no queda limitado únicamente a páginas". Estas entradas no abren una
// pantalla a mirar: abren directamente el formulario de alta.
//
// Son EXACTAMENTE las cuatro acciones rápidas que el Dashboard ya tiene, con el mismo
// `foco` — no se inventa ninguna. Si un módulo no tiene un alta de un solo paso sin
// ambigüedad de qué crear, no entra aquí (misma regla que se aplicó al construir la
// fila de acciones rápidas).
export const ACCIONES_DIRECTAS = [
  {
    id: 'accion:sueno', titulo: 'Registrar sueño', tab: 'sueno', foco: { accion: 'registrar' },
    descripcion: 'Abre el formulario para anotar la noche de hoy.',
    palabras: ['registrar sueno', 'anotar sueno', 'apuntar sueno', 'nueva noche', 'he dormido'],
    sinonimos: ['dormir', 'noche'],
  },
  {
    id: 'accion:gasto', titulo: 'Anotar un gasto', tab: 'economia', foco: { accion: 'nuevoMovimiento' },
    descripcion: 'Abre el formulario de un movimiento nuevo.',
    palabras: ['anotar gasto', 'nuevo gasto', 'apuntar gasto', 'he gastado', 'nuevo movimiento', 'ingreso'],
    sinonimos: ['dinero', 'pagar', 'compra'],
  },
  {
    id: 'accion:tarea', titulo: 'Crear una tarea', tab: 'productividad', foco: { sub: 'tareas', accion: 'nueva' },
    descripcion: 'Abre el formulario de una tarea nueva.',
    palabras: ['nueva tarea', 'crear tarea', 'anadir tarea', 'apuntar tarea', 'pendiente nuevo'],
    sinonimos: ['recordar', 'to do', 'hacer'],
  },
  {
    id: 'accion:objetivo', titulo: 'Crear un objetivo', tab: 'objetivos', foco: { accion: 'nuevo' },
    descripcion: 'Abre el formulario de un objetivo nuevo.',
    palabras: ['nuevo objetivo', 'crear objetivo', 'anadir objetivo', 'proponerme'],
    sinonimos: ['meta', 'reto'],
  },
];

/**
 * Construye el índice buscable.
 *
 * @param modulos              MORE_NAV tal cual (id, label, icon) — la fuente de verdad.
 * @param modulosDesactivados  `personalizacion.ocultos`. Un módulo desactivado no aparece
 *                             en el buscador: si Josué lo apagó, encontrarlo aquí sería
 *                             justo la incoherencia que ME Fase 1 vino a arreglar.
 */
export function construirIndice(modulos, { modulosDesactivados = [] } = {}) {
  const apagados = new Set(modulosDesactivados || []);
  const entradas = [];

  for (const m of modulos || []) {
    if (apagados.has(m.id)) continue;
    entradas.push({
      id: `modulo:${m.id}`,
      titulo: m.label,
      descripcion: DESCRIPCIONES_MODULOS[m.id] || '',
      palabras: PALABRAS_MODULOS[m.id] || [],
      sinonimos: SINONIMOS_MODULOS[m.id] || [],
      categoria: 'Módulo',
      icono: m.icon,
      tab: m.id,
      // Apartado 11 — abre una pantalla.
      tipo: 'pantalla',
      // Apartado 3 — a igualdad de puntos, un módulo entero pesa más que un ajuste
      // suelto: es un destino más ancho y casi siempre lo que Josué quería.
      prioridad: 2,
    });
  }

  // Las funciones de Ajustes solo tienen sentido si Ajustes está activo. No puede
  // desactivarse (es la única excepción de MORE_NAV), pero la comprobación se deja
  // por si una fase futura cambia esa regla.
  if (!apagados.has('ajustes')) {
    for (const f of FUNCIONES_AJUSTES) {
      entradas.push({ ...f, categoria: 'Ajustes', tab: 'ajustes', tipo: 'ajuste', prioridad: 1 });
    }
  }

  // Las acciones directas solo aparecen si su módulo sigue activo: ofrecer "Anotar
  // un gasto" con Economía desactivada llevaría a una pantalla que Josué apagó.
  for (const a of ACCIONES_DIRECTAS) {
    if (apagados.has(a.tab)) continue;
    entradas.push({ ...a, categoria: 'Acción', tipo: 'accion', prioridad: 0 });
  }

  // Se normaliza una sola vez, al construir, no en cada tecla. `_raiz*` es la versión
  // sin plurales, que es la que usa la coincidencia tolerante.
  return entradas.map((e) => ({
    ...e,
    _titulo: normalizar(e.titulo),
    _tituloRaiz: normalizarRaiz(e.titulo),
    _descripcion: normalizar(e.descripcion),
    _palabras: (e.palabras || []).map(normalizar),
    _palabrasRaiz: (e.palabras || []).map(normalizarRaiz),
    _sinonimos: (e.sinonimos || []).map(normalizar),
  }));
}

// Apartado 8 — orden de relevancia. Los números no son arbitrarios: cada escalón
// está lo bastante separado del siguiente como para que ninguna suma de
// coincidencias débiles adelante a una fuerte. Es el ejemplo del propio apartado:
// buscando "color", "Colores" tiene que salir antes que cualquier función que
// simplemente mencione la palabra en su descripción.
const PUNTOS = {
  TITULO_EXACTO: 1000,
  TITULO_EMPIEZA: 800,
  TITULO_CONTIENE: 600,
  PALABRA_EXACTA: 500,
  PALABRA_EMPIEZA: 400,
  PALABRA_CONTIENE: 300,
  // BI Fase 3 · apartado 8 — los sinónimos van justo por debajo de las palabras
  // clave: deben encontrar la función, pero nunca adelantar a aquella cuyo nombre
  // o palabra clave es literalmente lo que se ha escrito.
  SINONIMO_EXACTO: 250,
  SINONIMO_PARCIAL: 200,
  // El singular/plural es una AYUDA, no una coincidencia real, así que su escalón va
  // por debajo de una palabra clave literal. Sin esto, buscar "pantallas" abría
  // "Pantalla principal" (que solo coincide tras quitarle la 's') en vez de Bienestar,
  // que tiene "pantallas" escrito tal cual entre sus palabras clave.
  TITULO_EMPIEZA_RAIZ: 450,
  PALABRA_RAIZ: 350,
  DESCRIPCION: 150,
  TODAS_LAS_PALABRAS: 80,
  // Última red de todas: se ha escrito mal. Por debajo de cualquier acierto real,
  // para que una errata nunca desplace a una coincidencia legítima.
  ERRATA: 40,
};

// Se evalúan TODOS los escalones y se coge el mayor, en vez de ir devolviendo el
// primero que acierte por campos. La diferencia importa: con los `return` tempranos,
// una coincidencia floja en el título (por ejemplo tras quitar un plural) ganaba a
// una palabra clave escrita literalmente, y el resultado era el equivocado.
function puntuar(entrada, q, qRaiz, margen) {
  let mejor = 0;
  const sube = (n) => { if (n > mejor) mejor = n; };

  if (entrada._titulo === q) return PUNTOS.TITULO_EXACTO;
  // El plural cuenta como exacto: "colores" y "color" son la misma intención.
  if (entrada._tituloRaiz === qRaiz) return PUNTOS.TITULO_EXACTO;
  if (entrada._titulo.startsWith(q)) sube(PUNTOS.TITULO_EMPIEZA);
  else if (entrada._tituloRaiz.startsWith(qRaiz)) sube(PUNTOS.TITULO_EMPIEZA_RAIZ);
  if (entrada._titulo.includes(q)) sube(PUNTOS.TITULO_CONTIENE);

  for (const p of entrada._palabras) {
    if (p === q) sube(PUNTOS.PALABRA_EXACTA);
    else if (p.startsWith(q)) sube(PUNTOS.PALABRA_EMPIEZA);
    else if (p.includes(q) || q.includes(p)) sube(PUNTOS.PALABRA_CONTIENE);
  }
  for (const p of entrada._palabrasRaiz) {
    if (p === qRaiz || p.startsWith(qRaiz)) sube(PUNTOS.PALABRA_RAIZ);
  }

  for (const sin of entrada._sinonimos) {
    if (sin === q) sube(PUNTOS.SINONIMO_EXACTO);
    else if (sin.startsWith(q) || sin.includes(q)) sube(PUNTOS.SINONIMO_PARCIAL);
  }

  if (entrada._descripcion.includes(q)) sube(PUNTOS.DESCRIPCION);
  if (mejor) return mejor;

  // Cada palabra suelta de la consulta aparece en alguna parte de la entrada. Es lo
  // que hace que "cambiar colores" encuentre "Colores y tema" aunque la frase entera
  // no aparezca en ningún sitio.
  const trozos = q.split(' ').filter((t) => t.length > 2);
  if (trozos.length > 1) {
    const todo = `${entrada._titulo} ${entrada._descripcion} ${entrada._palabras.join(' ')} ${entrada._sinonimos.join(' ')}`;
    if (trozos.every((t) => todo.includes(t))) return PUNTOS.TODAS_LAS_PALABRAS;
  }

  // Apartado 18 — tolerancia a erratas. Solo con una consulta de una sola palabra:
  // sobre una frase entera la distancia de edición deja de significar nada y empieza
  // a devolver cosas al azar, que es justo lo que prohíbe el apartado 7.
  if (margen > 0 && !q.includes(' ')) {
    const candidatos = [entrada._titulo, ...entrada._palabras];
    for (const c of candidatos) {
      if (c.includes(' ')) continue;
      if (distancia(q, c, margen) <= margen) return PUNTOS.ERRATA;
    }
  }
  return 0;
}

/**
 * Busca en el índice. Devuelve las entradas con puntuación > 0, de mayor a menor.
 *
 * Desempates, en orden (apartado 9 — desambiguación: no elegir arbitrariamente):
 *   1. Puntuación.
 *   2. `prioridad` — un módulo entero pesa más que un ajuste suelto o una acción.
 *   3. Título más corto — "Colores y tema" antes que una entrada larga que empate.
 * Es determinista: la misma consulta devuelve siempre el mismo orden.
 */
export function buscar(indice, consulta, limite = 8) {
  const q = normalizar(consulta);
  if (!q) return [];
  const qRaiz = normalizarRaiz(consulta);
  const margen = margenErratas(q);
  return (indice || [])
    .map((e) => ({ entrada: e, puntos: puntuar(e, q, qRaiz, margen) }))
    .filter((r) => r.puntos > 0)
    .sort((a, b) =>
      b.puntos - a.puntos
      || (b.entrada.prioridad || 0) - (a.entrada.prioridad || 0)
      || a.entrada._titulo.length - b.entrada._titulo.length)
    .slice(0, limite)
    .map((r) => r.entrada);
}

/**
 * Apartado 18 — "¿Quizá buscas «Colores»?".
 *
 * Devuelve el título sugerido solo cuando el ÚNICO motivo por el que algo ha
 * aparecido es una errata. Si la búsqueda ha encontrado algo de verdad no hay nada
 * que sugerir, y decirlo igualmente sería ruido.
 */
export function sugerenciaDeErrata(indice, consulta) {
  const q = normalizar(consulta);
  const margen = margenErratas(q);
  if (!q || q.includes(' ') || margen === 0) return null;
  const qRaiz = normalizarRaiz(consulta);
  const hayAcierto = (indice || []).some((e) => puntuar(e, q, qRaiz, 0) > 0);
  if (hayAcierto) return null;
  const conErrata = buscar(indice, consulta, 1);
  return conErrata.length ? conErrata[0].titulo : null;
}

/**
 * Apartado 17 — sugerencias con el buscador vacío.
 *
 * Salen del índice real, nunca de una lista escrita aparte: si un módulo está
 * desactivado no aparece, y no puede sugerirse un acceso que no existe.
 */
export function sugerenciasIniciales(indice, ids = ['sueno', 'entreno', 'economia', 'ajustes'], limite = 4) {
  const porTab = new Map((indice || []).filter((e) => e.tipo === 'pantalla').map((e) => [e.tab, e]));
  return ids.map((id) => porTab.get(id)).filter(Boolean).slice(0, limite);
}

// Apartado 11 — detectar la intención. No es adivinar: son las formas concretas
// que enumera la especificación, más los signos de interrogación.
//
// A propósito NO decide por Josué. Si escribe "¿cómo cambio los colores?" esto
// dice "parece una pregunta" y la interfaz enseña LAS DOS COSAS: el resultado de
// Apariencia y el botón de preguntar a la IA. El propio apartado 11 lo pide así:
// "esto es mejor que obligar al usuario a elegir entre búsqueda o IA desde el
// principio".
const ARRANQUES_DE_PREGUNTA = [
  'como ', 'que deberia', 'que hago', 'por que', 'porque ', 'cuando deberia',
  'recomiendame', 'recomienda', 'ayudame', 'ayuda a', 'puedes', 'podrias',
  'me puedes', 'necesito saber', 'explicame', 'dime ', 'aconsejame', 'cual es mejor',
];

export function pareceUnaPregunta(texto) {
  const t = normalizar(texto);
  if (!t) return false;
  if (t.includes('?') || t.includes('¿')) return true;
  if (ARRANQUES_DE_PREGUNTA.some((a) => t.startsWith(a))) return true;
  // Una frase larga rara vez es el nombre de una pantalla.
  return t.split(/\s+/).length >= 5;
}
