/* Fase 2 · Chatbots — el catálogo: qué módulo tiene asistente y qué puede leer
   ═══════════════════════════════════════════════════════════════════════════

   Lo único que `App.jsx` importa del sistema de chatbots, además de la hoja.
   Especificación: `docs/15_asistentes/ESPECIFICACION_CHATBOTS.md` §4 (matriz),
   §6.4 (registro) y §9 (datos y privacidad).

   🚨 **`datosParaAsistente` es la lista blanca**: un asistente recibe SOLO las
   claves de su `lee`, nunca el estado entero («no cruces información entre
   módulos por comodidad»). Y ningún `lee` puede contener una clave privada de
   otro sitio —Relación, Diario, Imagen personal, el perfil, Salud—: lo
   comprueba `CLAVES_QUE_NINGUN_ASISTENTE_LEE` y su prueba.

   🚨 **Imagen personal está excluida entera** (categoría 4): ni asistente, ni
   una librería suya importada, ni un dato suyo en ningún contexto. Los 12
   paneles de IA tampoco se tocan: ni se importan aquí ni importan esto.

   ⚠️ **Añadir un asistente es una línea en `ASISTENTES`** (y su fila en la
   matriz, con categoría 1). La suite exige que solo la categoría 1 tenga uno. */

import { ASISTENTE_SUENO } from './asistenteSueno';
import { ASISTENTE_FITNESS } from './asistenteFitness';
import { ASISTENTE_NUTRICION } from './asistenteNutricion';
import { ASISTENTE_ESTUDIOS } from './asistenteEstudios';
import { ASISTENTE_PRODUCTIVIDAD } from './asistenteProductividad';

export const ASISTENTES = [ASISTENTE_SUENO, ASISTENTE_FITNESS, ASISTENTE_NUTRICION, ASISTENTE_ESTUDIOS, ASISTENTE_PRODUCTIVIDAD];

/** El asistente de una pantalla (`tab` de `App.jsx`), o `null`. */
export const asistenteDeModulo = (tab) => ASISTENTES.find((a) => a.modulo === tab) || null;

export const CLAVES_QUE_NINGUN_ASISTENTE_LEE = ['relacion', 'diario', 'estiloHombre', 'perfil', 'salud', 'saludFotos', 'economia', 'calendario', 'horarioTop', 'ajustes', 'papelera'];

/**
 * Los datos que recibe un asistente: SOLO sus claves, congeladas en profundidad para que ninguna
 * capacidad pueda cambiarlas sin querer (escribir lanza en modo estricto, y no hay nada que guardar).
 * @param {object} asistente
 * @param {Record<string, unknown>} estado  lo que `App.jsx` tiene en memoria
 */
export function datosParaAsistente(asistente, estado = {}) {
  const salida = {};
  for (const clave of (asistente && asistente.lee) || []) {
    if (CLAVES_QUE_NINGUN_ASISTENTE_LEE.includes(clave)) continue;
    salida[clave] = congelado(estado[clave]);
  }
  return Object.freeze(salida);
}

/* Una copia congelada: los datos de la aplicación no se tocan (ni se congelan ellos). */
function congelado(valor) {
  if (valor === null || typeof valor !== 'object') return valor;
  let copia;
  try { copia = typeof structuredClone === 'function' ? structuredClone(valor) : JSON.parse(JSON.stringify(valor)); } catch { copia = JSON.parse(JSON.stringify(valor)); }
  return congelarProfundo(copia);
}
function congelarProfundo(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o)) congelarProfundo(v);
  }
  return o;
}

/* ── Los otros módulos: para decir «eso es de Nutrición» sin leer nada suyo ──
   Solo nombres y palabras **distintivas**. No se reutiliza `PALABRAS_MODULOS` del buscador a
   propósito: allí «datos», «lista», «notas» u «organizar» sirven para ordenar resultados, y aquí
   mandarían a otro módulo una pregunta que era de este (auditoría, H-17/F). */
export const DOMINIOS_AJENOS = [
  { modulo: 'sueno', nombre: 'Sueño', asistente: true, palabras: ['dormir', 'dormi', 'dormido', 'sueno', 'siesta', 'acostarme', 'me desperte', 'horas de sueno', 'sobar'] },
  { modulo: 'entreno', nombre: 'Fitness', asistente: true, palabras: ['entrenar', 'entrene', 'entrenamiento', 'entreno', 'gimnasio', 'pesas', 'dominadas', 'flexiones', 'sentadillas', 'press de banca', 'fitness'] },
  { modulo: 'nutricion', nombre: 'Nutrición', asistente: true, palabras: ['calorias', 'proteina', 'carbohidratos', 'comida', 'comi', 'he comido', 'desayune', 'cene', 'beber agua', 'dieta', 'macros'] },
  { modulo: 'estudios', nombre: 'Estudios', asistente: true, palabras: ['examen', 'examenes', 'asignatura', 'asignaturas', 'estudiar', 'estudie', 'temario', 'deberes'] },
  { modulo: 'productividad', nombre: 'Productividad', asistente: true, palabras: ['habito', 'habitos', 'pomodoro', 'pomodoros', 'racha', 'rachas'] },
  { modulo: 'organizacion', nombre: 'Organización', asistente: false, palabras: ['tarea', 'tareas', 'calendario', 'agenda', 'horario'] },
  { modulo: 'economia', nombre: 'Economía', asistente: false, palabras: ['dinero', 'gaste', 'gastado', 'gastos', 'ahorro', 'hucha', 'saldo', 'presupuesto', 'euros', 'pague'] },
  { modulo: 'salud', nombre: 'Mi salud', asistente: false, palabras: ['peso', 'cuanto peso', 'imc', 'medidas', 'altura', 'analitica', 'lesion'] },
  { modulo: 'diario', nombre: 'Diario', asistente: false, palabras: ['diario', 'animo', 'como me siento', 'emociones'] },
  { modulo: 'relacion', nombre: 'Relación', asistente: false, palabras: ['pareja', 'novia', 'novio', 'aniversario'] },
  { modulo: 'fe', nombre: 'Fe', asistente: false, palabras: ['oracion', 'rezar', 'biblia', 'misa'] },
  { modulo: 'negocio', nombre: 'Negocio', asistente: false, palabras: ['negocio', 'clientes', 'emprender', 'empresa'] },
  { modulo: 'biblioteca', nombre: 'Biblioteca', asistente: false, palabras: ['libro', 'libros', 'leyendo', 'apuntes', 'documentos'] },
  { modulo: 'armario', nombre: 'Armario', asistente: false, palabras: ['ropa', 'prendas', 'outfit', 'camiseta', 'pantalon', 'zapatillas'] },
  { modulo: 'estilo-hombre', nombre: 'Imagen personal', asistente: false, palabras: ['perfume', 'colonia', 'skincare', 'barba', 'corte de pelo', 'peinado'] },
  { modulo: 'cumpleanos', nombre: 'Cumpleaños', asistente: false, palabras: ['cumpleanos', 'cumple'] },
  { modulo: 'bienestar', nombre: 'Bienestar digital', asistente: false, palabras: ['tiempo de pantalla', 'redes sociales', 'uso del movil'] },
];

/* ── La matriz de candidatos del §4, como datos (la vigila la suite) ──────── */
export const MATRIZ_CANDIDATOS = [
  { modulo: 'sueno', categoria: 1, asistente: 'sueno' },
  { modulo: 'entreno', categoria: 1, asistente: 'fitness' },
  { modulo: 'nutricion', categoria: 1, asistente: 'nutricion' },
  { modulo: 'estudios', categoria: 1, asistente: 'estudios' },
  { modulo: 'productividad', categoria: 1, asistente: 'productividad' },
  { modulo: 'organizacion', categoria: 2, espera: 'P-06: la agenda junta datos de otros módulos (Relación incluida)' },
  { modulo: 'economia', categoria: 2, espera: 'sacar el saldo de FinanceView a una librería (cambio funcional que hay que autorizar)' },
  { modulo: 'salud', categoria: 2, espera: 'decidir si puede hablar de peso (regla 7)' },
  { modulo: 'diario', categoria: 2, espera: 'P-06 / P-07: texto íntimo' },
  { modulo: 'relacion', categoria: 2, espera: 'aprobación expresa (regla 6)' },
  { modulo: 'cumpleanos', categoria: 2, espera: 'P-08 (prioridad)' },
  { modulo: 'biblioteca', categoria: 2, espera: 'decidir si lee el contenido de notas y documentos' },
  { modulo: 'armario', categoria: 2, espera: 'decidir si cuentan las prendas creadas desde Imagen personal; P-08' },
  { modulo: 'numeros', categoria: 2, espera: 'P-06 y CX-17: cruza módulos por naturaleza' },
  { modulo: 'hoy', categoria: 2, espera: 'P-01 (b) y P-06: el asistente general' },
  { modulo: 'fe', categoria: 3, espera: 'un motor de análisis y AVISO_DOCTRINAL' },
  { modulo: 'negocio', categoria: 3, espera: 'un motor de análisis' },
  { modulo: 'bienestar', categoria: 3, espera: 'un motor de análisis' },
  { modulo: 'estilo-hombre', categoria: 4, espera: 'excluido por orden expresa de Josué' },
];
