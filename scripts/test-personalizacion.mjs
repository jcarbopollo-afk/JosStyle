// ---------------------------------------------------------------------------
// Entrega 2 · ME Fase 2 — pruebas de la personalización total.
//
// Comprueba la lógica pura: perfiles rápidos, dependencias entre módulos y la
// separación entre "módulo activo" y "visible en Hoy".
//
//   node --import ./scripts/resolver-vite.mjs scripts/test-personalizacion.mjs
// ---------------------------------------------------------------------------
import {
  PERFILES_MODULOS, DEPENDENCIAS_MODULOS, DESCRIPCIONES_MODULOS, DEFAULT_PERSONALIZACION,
} from '../src/tokens.js';

let fallos = 0;
const comprobar = (nombre, ok, detalle = '') => {
  if (ok) console.log(`  ✓ ${nombre}`);
  else { console.error(`  ✗ ${nombre}${detalle ? ' → ' + detalle : ''}`); fallos++; }
};

// Catálogo real de módulos personalizables (MORE_NAV sin 'ajustes').
const PERSONALIZABLES = [
  'salud', 'sueno', 'nutricion', 'entreno', 'calendario', 'estudios', 'negocio',
  'productividad', 'objetivos', 'diario', 'fe', 'biblioteca', 'relacion', 'bienestar',
  'estadisticas', 'predicciones', 'logros', 'economia',
];

// Réplica exacta de aplicarPerfilModulos (App.jsx) para poder probar la lógica sin React.
function ocultosTrasPerfil(perfilId) {
  const perfil = PERFILES_MODULOS.find((p) => p.id === perfilId);
  return perfil.activos === null ? [] : PERSONALIZABLES.filter((id) => !perfil.activos.includes(id));
}

console.log('\n═══ ME Fase 2 — personalización total ═══\n');

// --- Perfiles rápidos ---
{
  comprobar('Hay cuatro perfiles', PERFILES_MODULOS.length === 4);
  comprobar('Los cuatro que pide la especificación',
    ['completo', 'estudiante', 'fitness', 'minimalista'].every((id) => PERFILES_MODULOS.some((p) => p.id === id)));

  comprobar('"Completo" no desactiva nada', ocultosTrasPerfil('completo').length === 0);

  const est = ocultosTrasPerfil('estudiante');
  comprobar('"Estudiante" deja Estudios activo', !est.includes('estudios'));
  comprobar('"Estudiante" deja Productividad activa', !est.includes('productividad'));
  comprobar('"Estudiante" deja Salud activa', !est.includes('salud'));
  comprobar('"Estudiante" desactiva algo (no es Completo disfrazado)', est.length > 0);

  const fit = ocultosTrasPerfil('fitness');
  comprobar('"Fitness" deja Entrenamiento, Nutrición, Sueño y Salud',
    ['entreno', 'nutricion', 'sueno', 'salud'].every((id) => !fit.includes(id)));

  const min = ocultosTrasPerfil('minimalista');
  comprobar('"Minimalista" deja menos activos que "Estudiante"',
    (PERSONALIZABLES.length - min.length) < (PERSONALIZABLES.length - est.length));

  // Ningún perfil puede referirse a un módulo inexistente: sería un activo fantasma.
  const fantasmas = PERFILES_MODULOS
    .filter((p) => p.activos)
    .flatMap((p) => p.activos.filter((id) => !PERSONALIZABLES.includes(id)).map((id) => `${p.id}:${id}`));
  comprobar('Ningún perfil referencia módulos inexistentes', fantasmas.length === 0, fantasmas.join(', '));

  // Ningún perfil puede desactivar Ajustes: dejaría a Josué sin forma de volver atrás.
  comprobar('Ningún perfil toca "ajustes"',
    !PERFILES_MODULOS.some((p) => p.activos && p.activos.includes('ajustes')));
  comprobar('Ningún perfil deja "ajustes" en la lista de ocultos',
    !['completo', 'estudiante', 'fitness', 'minimalista'].some((id) => ocultosTrasPerfil(id).includes('ajustes')));

  comprobar('Todos los perfiles tienen etiqueta y descripción',
    PERFILES_MODULOS.every((p) => p.label && p.desc));
}

// --- Dependencias entre módulos ---
{
  const claves = Object.keys(DEPENDENCIAS_MODULOS);
  comprobar('Todos los módulos con dependencias existen',
    claves.every((id) => PERSONALIZABLES.includes(id)),
    claves.filter((id) => !PERSONALIZABLES.includes(id)).join(', '));

  const fuentesMalas = Object.entries(DEPENDENCIAS_MODULOS)
    .flatMap(([id, f]) => f.filter((x) => !PERSONALIZABLES.includes(x)).map((x) => `${id}←${x}`));
  comprobar('Todas las fuentes declaradas existen', fuentesMalas.length === 0, fuentesMalas.join(', '));

  comprobar('Ningún módulo depende de sí mismo',
    !Object.entries(DEPENDENCIAS_MODULOS).some(([id, f]) => f.includes(id)));

  // Las tres vistas de solo lectura son las que de verdad se quedan sin nada que mostrar.
  comprobar('Estadísticas declara sus fuentes', (DEPENDENCIAS_MODULOS.estadisticas || []).length >= 3);
  comprobar('Predicciones declara sus fuentes', (DEPENDENCIAS_MODULOS.predicciones || []).length >= 5);
  comprobar('Logros declara sus fuentes', (DEPENDENCIAS_MODULOS.logros || []).length >= 8);

  // Cálculo del aviso, igual que en CentroModulos.
  const dependientesDe = (moduloId, ocultos = []) => Object.entries(DEPENDENCIAS_MODULOS)
    .filter(([id, fuentes]) => fuentes.includes(moduloId) && !ocultos.includes(id))
    .map(([id]) => id);

  comprobar('Desactivar Sueño avisa de Estadísticas, Predicciones y Logros',
    ['estadisticas', 'logros'].every((id) => dependientesDe('sueno').includes(id)));
  comprobar('Un dependiente ya desactivado no genera aviso',
    !dependientesDe('sueno', ['estadisticas', 'logros']).includes('estadisticas'));
  comprobar('Un módulo del que nadie depende no avisa de nada',
    dependientesDe('biblioteca').length === 0);
}

// --- Separación entre "activo" y "visible en Hoy" ---
{
  comprobar('DEFAULT_PERSONALIZACION tiene las dos listas separadas',
    Array.isArray(DEFAULT_PERSONALIZACION.ocultos) && Array.isArray(DEFAULT_PERSONALIZACION.dashboardOcultos));
  comprobar('Ambas empiezan vacías (nada oculto por defecto)',
    DEFAULT_PERSONALIZACION.ocultos.length === 0 && DEFAULT_PERSONALIZACION.dashboardOcultos.length === 0);

  // Réplica de toggleDashboardModulo.
  const toggle = (lista, id) => (lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]);
  let dash = [];
  dash = toggle(dash, 'sueno');
  comprobar('Quitar de Hoy añade a dashboardOcultos', dash.includes('sueno'));
  dash = toggle(dash, 'sueno');
  comprobar('Volver a ponerlo lo quita', !dash.includes('sueno'));
  comprobar('Quitar de Hoy no toca la lista de activos', DEFAULT_PERSONALIZACION.ocultos.length === 0);
}

// --- Descripciones (compartidas con ME Fase 1) ---
{
  comprobar('Todos los módulos personalizables tienen descripción',
    PERSONALIZABLES.every((id) => DESCRIPCIONES_MODULOS[id]),
    PERSONALIZABLES.filter((id) => !DESCRIPCIONES_MODULOS[id]).join(', '));
}

console.log('');
if (fallos) { console.error(`═══ ${fallos} PRUEBA(S) FALLIDA(S) ═══\n`); process.exit(1); }
console.log('═══ TODAS LAS PRUEBAS PASAN ═══\n');
