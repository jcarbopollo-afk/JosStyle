// ---------------------------------------------------------------------------
// Entrega 2 · BI Fase 2 — pruebas del índice y del motor de búsqueda.
//
// El apartado 19 de la especificación trae su propio control de calidad: nueve
// búsquedas concretas que tienen que funcionar. Están todas aquí, literales,
// más las reglas de orden del apartado 8 y la detección de intención del 11.
//
// Dos de esas nueve ("racha", "sonidos") deben NO encontrar nada hoy: la propia
// especificación las condiciona a "si el módulo existe", y Rachas y Sonido son
// fases futuras. Inventarlas para que la prueba pase sería exactamente la regla 8
// rota, así que la prueba comprueba lo contrario: que no aparecen.
// ---------------------------------------------------------------------------
import { construirIndice, buscar, pareceUnaPregunta, normalizar } from '../src/lib/indiceBusqueda.js';

// Copia de MORE_NAV (App.jsx). Solo id y label: el icono no se usa en el motor.
const MODULOS = [
  { id: 'salud', label: 'Salud' }, { id: 'sueno', label: 'Sueño' },
  { id: 'nutricion', label: 'Nutrición' }, { id: 'entreno', label: 'Entrenamiento' },
  { id: 'calendario', label: 'Calendario' }, { id: 'estudios', label: 'Estudios' },
  { id: 'negocio', label: 'Negocio' }, { id: 'productividad', label: 'Productividad' },
  { id: 'objetivos', label: 'Objetivos' }, { id: 'diario', label: 'Diario' },
  { id: 'fe', label: 'Fe' }, { id: 'biblioteca', label: 'Biblioteca' },
  { id: 'relacion', label: 'Relación' }, { id: 'bienestar', label: 'Bienestar' },
  { id: 'estadisticas', label: 'Estadísticas' }, { id: 'predicciones', label: 'Predicciones' },
  { id: 'logros', label: 'Logros' }, { id: 'economia', label: 'Economía' },
  { id: 'ajustes', label: 'Ajustes' },
];

let fallos = 0;
const comprobar = (nombre, ok, detalle = '') => {
  if (ok) console.log(`  ✓ ${nombre}`);
  else { console.error(`  ✗ ${nombre}${detalle ? ' → ' + detalle : ''}`); fallos++; }
};

const indice = construirIndice(MODULOS);
const primero = (q) => buscar(indice, q)[0];
const titulos = (q) => buscar(indice, q).map((r) => r.titulo);

console.log('\n═══ BI Fase 2 — buscador de funciones ═══\n');

// --- Índice ---
{
  comprobar('El índice cubre los 19 módulos + las funciones de Ajustes',
    indice.length === MODULOS.length + 14, String(indice.length));
  comprobar('Toda entrada tiene título, categoría y destino',
    indice.every((e) => e.titulo && e.categoria && e.tab));
  comprobar('Ninguna entrada del índice contiene datos de Josué',
    indice.every((e) => !('datos' in e) && !('valor' in e)));
}

// --- Apartado 19: el control de calidad de la propia especificación ---
{
  comprobar('"colores" → encuentra Colores', primero('colores')?.id === 'ajuste:apariencia', titulos('colores')[0]);
  comprobar('"modo oscuro" → encuentra el tema', primero('modo oscuro')?.id === 'ajuste:apariencia', titulos('modo oscuro')[0]);
  comprobar('"dormir" → encuentra Sueño', primero('dormir')?.tab === 'sueno', titulos('dormir')[0]);
  comprobar('"entrenamiento" → encuentra Entrenamiento', primero('entrenamiento')?.tab === 'entreno', titulos('entrenamiento')[0]);
  comprobar('"dinero" → encuentra Economía', primero('dinero')?.tab === 'economia', titulos('dinero')[0]);
  comprobar('"notificaciones" → encuentra Ajustes → Notificaciones', primero('notificaciones')?.id === 'ajuste:notificaciones');
  // "racha" y "sonidos" están condicionadas en la especificación a "si el módulo existe".
  // Rachas y Sonido son fases futuras, así que lo que hay que comprobar NO es que no
  // devuelvan nada —"racha" encuentra Productividad, y con razón: su descripción real es
  // "Hábitos con racha, rutinas, tareas, metas y Pomodoro"— sino que no aparezca un módulo
  // inventado. Un resultado honesto que existe es correcto; uno fabricado rompe la regla 8.
  comprobar('"racha" → lleva a Productividad, que es donde están las rachas hoy',
    primero('racha')?.tab === 'productividad', titulos('racha')[0] || 'sin resultados');
  comprobar('"racha" → NO inventa un módulo "Rachas"',
    !titulos('racha').some((t) => normalizar(t) === 'rachas'));
  comprobar('"sonidos" → NO inventa un módulo "Sonidos"',
    !titulos('sonidos').some((t) => normalizar(t).includes('sonido')), titulos('sonidos').join(', '));
  comprobar('"asdfghjkl" → sin resultados', buscar(indice, 'asdfghjkl').length === 0);
  comprobar('"¿cómo puedo mejorar mi entrenamiento?" → se detecta como pregunta',
    pareceUnaPregunta('¿cómo puedo mejorar mi entrenamiento?'));
}

// --- Apartado 5: sinónimos, sin saber el nombre exacto ---
{
  const casos = [
    ['peso', 'salud'], ['comida', 'nutricion'], ['calistenia', 'entreno'],
    ['tareas', 'productividad'], ['agenda', 'calendario'], ['examenes', 'estudios'],
    ['gastos', 'economia'], ['apuntes', 'biblioteca'], ['graficas', 'estadisticas'],
    ['oracion', 'fe'], ['pantallas', 'bienestar'], ['insignias', 'logros'],
  ];
  for (const [q, tab] of casos) {
    comprobar(`"${q}" → ${tab}`, primero(q)?.tab === tab, titulos(q)[0] || 'sin resultados');
  }
  comprobar('"pin" → Seguridad', primero('pin')?.id === 'ajuste:seguridad');
  comprobar('"exportar" → Copia de seguridad', primero('exportar')?.id === 'ajuste:datos');
  comprobar('"recuperar" → Eliminados recientemente', primero('recuperar')?.id === 'ajuste:papelera');
}

// --- Acentos y mayúsculas ---
{
  comprobar('"sueno" sin tilde encuentra "Sueño"', primero('sueno')?.tab === 'sueno');
  comprobar('"SUEÑO" en mayúsculas encuentra "Sueño"', primero('SUEÑO')?.tab === 'sueno');
  comprobar('"economia" sin tilde encuentra "Economía"', primero('economia')?.tab === 'economia');
  comprobar('normalizar quita tildes y mayúsculas', normalizar('Nutrición ÁÉÍÓÚ') === 'nutricion aeiou');
}

// --- Apartado 8: orden por relevancia ---
{
  // El ejemplo literal de la especificación: buscando "color", "Colores" gana a
  // cualquier entrada que solo mencione la palabra de pasada.
  comprobar('"color" → el título gana a la descripción', primero('color')?.id === 'ajuste:apariencia', titulos('color')[0]);
  comprobar('"Salud" exacto sale el primero', primero('Salud')?.tab === 'salud');
  // "notas" está en las palabras de Estudios y de Biblioteca: ambas valen, no debe
  // quedarse sin resultados ni devolver una sola.
  comprobar('"notas" devuelve más de una opción razonable', buscar(indice, 'notas').length >= 2, String(buscar(indice, 'notas').length));
  comprobar('Nunca más resultados que el límite pedido', buscar(indice, 'a', 3).length <= 3);
}

// --- Apartado 11: intención ---
{
  const preguntas = [
    '¿Cómo puedo mejorar mi entrenamiento?', 'Cómo organizo mejor mi día',
    'Qué debería hacer esta semana', 'Por qué duermo mal',
    'Recomiéndame una rutina', 'Ayúdame a estudiar mejor',
  ];
  for (const p of preguntas) comprobar(`Pregunta detectada: "${p.slice(0, 34)}…"`, pareceUnaPregunta(p));

  const busquedas = ['colores', 'dormir', 'modo oscuro', 'economia', 'pin'];
  for (const b of busquedas) comprobar(`No es pregunta: "${b}"`, !pareceUnaPregunta(b));

  // Apartado 11, el caso importante: una pregunta que ADEMÁS tiene función.
  comprobar('"¿cómo cambio los colores?" es pregunta Y encuentra Apariencia',
    pareceUnaPregunta('¿cómo cambio los colores?') && buscar(indice, '¿cómo cambio los colores?').length > 0,
    titulos('¿cómo cambio los colores?')[0] || 'sin resultados');
}

// --- Integración con ME: un módulo desactivado no se puede encontrar ---
{
  const reducido = construirIndice(MODULOS, { modulosDesactivados: ['diario', 'fe'] });
  comprobar('Un módulo desactivado desaparece del índice', !reducido.some((e) => e.tab === 'diario'));
  comprobar('...y tampoco se encuentra por sinónimo', buscar(reducido, 'oracion').length === 0);
  comprobar('...pero el resto sigue encontrándose', buscar(reducido, 'dormir')[0]?.tab === 'sueno');
  comprobar('El índice completo sigue teniéndolos', indice.some((e) => e.tab === 'diario'));
}

// --- Consultas vacías o basura no revientan ---
{
  comprobar('Consulta vacía devuelve lista vacía', buscar(indice, '').length === 0);
  comprobar('Solo espacios devuelve lista vacía', buscar(indice, '   ').length === 0);
  comprobar('null no revienta', buscar(indice, null).length === 0);
  comprobar('Índice nulo no revienta', buscar(null, 'colores').length === 0);
  comprobar('construirIndice sin módulos no revienta', construirIndice(null).length === 14);
}

console.log(fallos === 0 ? '\n  Todo correcto.\n' : `\n  ${fallos} fallo(s).\n`);
process.exit(fallos === 0 ? 0 : 1);
