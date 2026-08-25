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
    .trim();
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

// Funciones que viven DENTRO de Ajustes y no tienen entrada propia en ninguna
// lista de navegación. `ajuste` es el id de categoría que abre `SettingsView`,
// así que pulsar un resultado abre esa categoría directamente — no deja a Josué
// en la lista de Ajustes para que la busque él (apartado 12).
export const FUNCIONES_AJUSTES = [
  {
    id: 'ajuste:apariencia', titulo: 'Colores y tema', ajuste: 'apariencia',
    descripcion: 'Color de acento, tema oscuro o claro y temas guardados.',
    palabras: ['colores', 'color', 'tema', 'acento', 'apariencia', 'paleta', 'modo oscuro', 'modo claro', 'modo noche', 'oscuro', 'claro', 'personalizar colores'],
  },
  {
    id: 'ajuste:texto', titulo: 'Tamaño de texto y densidad', ajuste: 'apariencia',
    descripcion: 'Texto más grande o más pequeño, bordes y espaciado de la interfaz.',
    palabras: ['texto', 'letra', 'tamano', 'fuente', 'grande', 'pequeno', 'densidad', 'espaciado', 'bordes', 'redondeo', 'animaciones', 'ver mejor'],
  },
  {
    id: 'ajuste:pantalla-principal', titulo: 'Pantalla principal', ajuste: 'pantalla-principal',
    descripcion: 'Qué módulos usas, qué ves en Hoy y en qué orden aparece el menú.',
    palabras: ['personalizar', 'personalizacion', 'inicio', 'hoy', 'dashboard', 'modulos', 'activar modulo', 'desactivar modulo', 'ocultar', 'orden', 'reordenar', 'favoritas', 'perfiles'],
  },
  {
    id: 'ajuste:notificaciones', titulo: 'Notificaciones', ajuste: 'notificaciones',
    descripcion: 'Permiso, categorías de aviso y horario de descanso.',
    palabras: ['notificaciones', 'avisos', 'alertas', 'recordatorios', 'silenciar', 'no molestar', 'horario de descanso'],
  },
  {
    id: 'ajuste:seguridad', titulo: 'Seguridad y PIN', ajuste: 'seguridad',
    descripcion: 'PIN de acceso, biometría y qué secciones se protegen.',
    palabras: ['pin', 'seguridad', 'contrasena', 'clave', 'bloquear', 'biometria', 'face id', 'huella', 'proteger', 'cerrar sesion'],
  },
  {
    id: 'ajuste:privacidad', titulo: 'Privacidad', ajuste: 'privacidad',
    descripcion: 'Qué usa la inteligencia artificial y borrado por categoría.',
    palabras: ['privacidad', 'datos privados', 'que usa la ia', 'borrar categoria', 'transparencia'],
  },
  {
    id: 'ajuste:datos', titulo: 'Copia de seguridad y exportar', ajuste: 'datos',
    descripcion: 'Descargar tus datos y hacer una copia de seguridad.',
    palabras: ['exportar', 'descargar', 'copia de seguridad', 'backup', 'csv', 'excel', 'importar', 'guardar datos'],
  },
  {
    id: 'ajuste:papelera', titulo: 'Eliminados recientemente', ajuste: 'papelera',
    descripcion: 'Recupera algo que hayas borrado por error.',
    palabras: ['papelera', 'eliminados', 'borrado', 'recuperar', 'restaurar', 'deshacer borrado', 'basura'],
  },
  {
    id: 'ajuste:perfil', titulo: 'Tu perfil', ajuste: 'perfil',
    descripcion: 'Nombre, fecha de nacimiento, altura, peso y nivel de actividad.',
    palabras: ['perfil', 'mis datos', 'nombre', 'edad', 'altura', 'cuenta'],
  },
  {
    id: 'ajuste:preferencias', titulo: 'Idioma, zona horaria y unidades', ajuste: 'preferencias',
    descripcion: 'Preferencias generales de la aplicación.',
    palabras: ['idioma', 'lengua', 'zona horaria', 'unidades', 'kilos', 'pais', 'formato'],
  },
  {
    id: 'ajuste:accesibilidad', titulo: 'Accesibilidad', ajuste: 'accesibilidad',
    descripcion: 'Dónde están el tamaño de texto y reducir movimiento.',
    palabras: ['accesibilidad', 'contraste', 'alto contraste', 'reducir movimiento', 'lector de pantalla'],
  },
  {
    id: 'ajuste:sincronizacion', titulo: 'Sincronización', ajuste: 'sincronizacion',
    descripcion: 'Cómo viajan tus datos entre dispositivos.',
    palabras: ['sincronizacion', 'sincronizar', 'dispositivos', 'nube', 'supabase', 'otro movil'],
  },
  {
    id: 'ajuste:integraciones', titulo: 'Integraciones', ajuste: 'integraciones',
    descripcion: 'Conexiones con otros servicios.',
    palabras: ['integraciones', 'conectar', 'apps', 'reloj', 'wearable'],
  },
  {
    id: 'ajuste:informacion', titulo: 'Información y versión', ajuste: 'informacion',
    descripcion: 'Versión de la aplicación, créditos e información técnica.',
    palabras: ['version', 'informacion', 'acerca de', 'creditos', 'ayuda'],
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
      categoria: 'Módulo',
      icono: m.icon,
      tab: m.id,
    });
  }

  // Las funciones de Ajustes solo tienen sentido si Ajustes está activo. No puede
  // desactivarse (es la única excepción de MORE_NAV), pero la comprobación se deja
  // por si una fase futura cambia esa regla.
  if (!apagados.has('ajustes')) {
    for (const f of FUNCIONES_AJUSTES) {
      entradas.push({ ...f, categoria: 'Ajustes', tab: 'ajustes' });
    }
  }

  // Se normaliza una sola vez, al construir, no en cada tecla.
  return entradas.map((e) => ({
    ...e,
    _titulo: normalizar(e.titulo),
    _descripcion: normalizar(e.descripcion),
    _palabras: (e.palabras || []).map(normalizar),
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
  DESCRIPCION: 150,
  TODAS_LAS_PALABRAS: 80,
};

function puntuar(entrada, q) {
  if (entrada._titulo === q) return PUNTOS.TITULO_EXACTO;
  if (entrada._titulo.startsWith(q)) return PUNTOS.TITULO_EMPIEZA;
  if (entrada._titulo.includes(q)) return PUNTOS.TITULO_CONTIENE;

  let mejor = 0;
  for (const p of entrada._palabras) {
    if (p === q) mejor = Math.max(mejor, PUNTOS.PALABRA_EXACTA);
    else if (p.startsWith(q)) mejor = Math.max(mejor, PUNTOS.PALABRA_EMPIEZA);
    else if (p.includes(q) || q.includes(p)) mejor = Math.max(mejor, PUNTOS.PALABRA_CONTIENE);
  }
  if (mejor) return mejor;

  if (entrada._descripcion.includes(q)) return PUNTOS.DESCRIPCION;

  // Última red: cada palabra suelta de la consulta aparece en alguna parte de la
  // entrada. Es lo que hace que "cambiar colores" encuentre "Colores y tema"
  // aunque la frase entera no aparezca en ningún sitio.
  const trozos = q.split(/\s+/).filter((t) => t.length > 2);
  if (trozos.length > 1) {
    const todo = `${entrada._titulo} ${entrada._descripcion} ${entrada._palabras.join(' ')}`;
    if (trozos.every((t) => todo.includes(t))) return PUNTOS.TODAS_LAS_PALABRAS;
  }
  return 0;
}

/**
 * Busca en el índice. Devuelve las entradas con puntuación > 0, de mayor a menor.
 * A igualdad de puntos gana el título más corto: "Colores y tema" antes que una
 * entrada larga que casualmente empate.
 */
export function buscar(indice, consulta, limite = 8) {
  const q = normalizar(consulta);
  if (!q) return [];
  return (indice || [])
    .map((e) => ({ entrada: e, puntos: puntuar(e, q) }))
    .filter((r) => r.puntos > 0)
    .sort((a, b) => b.puntos - a.puntos || a.entrada._titulo.length - b.entrada._titulo.length)
    .slice(0, limite)
    .map((r) => r.entrada);
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
