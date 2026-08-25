// ---------------------------------------------------------------------------
// Entrega 2 · BI Fase 1 — pruebas del desplegable de situación de Inicio.
//
// Lo que la especificación exige y NO se puede comprobar aquí: que la animación
// se sienta fluida en un iPhone. Eso solo lo puede decir Josué mirándolo.
//
// Lo que sí se puede comprobar, y es donde estaban los fallos de verdad:
//
//   · Que arranca CERRADO (apartado 1) y lo anuncia con `aria-expanded="false"`.
//   · Que `aria-controls` apunta a un id que existe de verdad (apartado 10). Un
//     `aria-controls` colgando es peor que no ponerlo: el lector de pantalla
//     anuncia una relación que no lleva a ninguna parte.
//   · Que NO hay botones anidados. Este es el que importa: antes de esta fase el
//     componente entero era un `<button>`, y meter dentro los botones de
//     situación habría dado HTML inválido y, en iOS, un toque que se come el
//     exterior. Es un fallo que no revienta el render — pasa desapercibido.
//   · Que las tres situaciones están DENTRO del desplegable (apartado 5), que es
//     el hueco real que tenía la fase: antes solo se podían leer consejos.
//   · Que la situación activa se marca con `aria-pressed` (es un interruptor, no
//     una navegación) y que sigue saliendo su consejo.
// ---------------------------------------------------------------------------
import React from 'react';
import { renderToString } from 'react-dom/server';
import DashboardView from '../src/views/DashboardView.jsx';
import {
  DEFAULT_PERFIL, DEFAULT_CALISTENIA, DEFAULT_ESTUDIOS, DEFAULT_NEGOCIO,
  DEFAULT_PRODUCTIVIDAD, DEFAULT_DIARIO, DEFAULT_BIBLIOTECA, DEFAULT_FE,
  DEFAULT_BIENESTAR, DEFAULT_PERSONALIZACION, DEFAULT_NOTIFICACIONES,
  DEFAULT_CALENDARIO, ACCENTS, DESCRIPCIONES_MODULOS, MODOS_APP,
} from '../src/tokens.js';
import { calcularResumenModulo } from '../src/lib/resumenesHub.js';

const accent = ACCENTS[0].value;
const noop = () => {};

let fallos = 0;
const comprobar = (nombre, ok, detalle = '') => {
  if (ok) console.log(`  ✓ ${nombre}`);
  else { console.error(`  ✗ ${nombre}${detalle ? ' → ' + detalle : ''}`); fallos++; }
};

const base = {
  perfil: { ...DEFAULT_PERFIL, nombre: 'Josué' },
  sueno: [], calistenia: DEFAULT_CALISTENIA, futbol: [],
  economia: { saldoInicial: 0, hucha: 0, movimientos: [] },
  salud: { medidas: [], historial: [] },
  nutricion: { comidas: [], agua: {}, favoritos: [] },
  estudios: DEFAULT_ESTUDIOS, negocio: DEFAULT_NEGOCIO, productividad: DEFAULT_PRODUCTIVIDAD,
  objetivos: { lista: [], ultimaRevision: null },
  diario: DEFAULT_DIARIO, biblioteca: DEFAULT_BIBLIOTECA,
  relacion: { nombre: '', fechas: [] },
  fe: DEFAULT_FE, bienestar: DEFAULT_BIENESTAR, calendario: DEFAULT_CALENDARIO,
  notificaciones: DEFAULT_NOTIFICACIONES,
  personalizacion: DEFAULT_PERSONALIZACION,
};

function render(modo) {
  return renderToString(React.createElement(DashboardView, {
    ...base, favoritas: [], modo, onSetModo: noop, derivadosCalendario: [],
    resumenes: Object.fromEntries(Object.keys(DESCRIPCIONES_MODULOS).map((id) => [id, calcularResumenModulo(id, base)])),
    dashboardOcultos: [], modulosDesactivados: [], onNavegar: noop, accent,
  }));
}

/** Detecta un `<button>` abierto dentro de otro `<button>` sin cerrar. */
function tieneBotonesAnidados(html) {
  let profundidad = 0;
  for (const etiqueta of html.match(/<\/?button\b/g) || []) {
    if (etiqueta === '<button') {
      profundidad++;
      if (profundidad > 1) return true;
    } else {
      profundidad--;
    }
  }
  return false;
}

console.log('\n═══ BI Fase 1 — desplegable de situación de Inicio ═══\n');

// --- 1. Estado cerrado por defecto y accesibilidad ---
{
  const html = render(null);
  comprobar('Arranca cerrado (aria-expanded="false")', html.includes('aria-expanded="false"'));

  const m = html.match(/aria-controls="([^"]+)"/);
  comprobar('La cabecera declara aria-controls', !!m);
  if (m) {
    comprobar('...y ese id existe de verdad en el HTML', html.includes(`id="${m[1]}"`), m[1]);
  }
  comprobar('El panel se anuncia como región con nombre', html.includes('aria-label="Opciones de la situación actual"'));
}

// --- 2. Sin botones anidados (el fallo silencioso que traía el diseño anterior) ---
{
  comprobar('Sin situación activa: ningún botón dentro de otro botón', !tieneBotonesAnidados(render(null)));
  comprobar('Con situación activa: ningún botón dentro de otro botón', !tieneBotonesAnidados(render('examenes')));
}

// --- 3. Las opciones están dentro del desplegable (apartado 5) ---
{
  const html = render(null);
  for (const m of MODOS_APP) {
    comprobar(`La situación "${m.label}" se puede activar desde Inicio`, html.includes(`>${m.label}`));
  }
  comprobar('Sin situación activa, la cabecera dice "Rutina normal"', html.includes('Rutina normal'));
  comprobar('...y explica para qué sirve, sin dejar el hueco vacío',
    html.includes('Activa una situación si estos días son distintos'));
}

// --- 4. Situación activa: se marca como pulsada y conserva sus consejos ---
{
  const html = render('examenes');
  const examenes = MODOS_APP.find((m) => m.id === 'examenes');
  comprobar('La situación activa se marca con aria-pressed="true"', html.includes('aria-pressed="true"'));
  comprobar('Las otras dos NO están marcadas', (html.match(/aria-pressed="false"/g) || []).length === MODOS_APP.length - 1);
  comprobar('La cabecera muestra la situación activa', html.includes('Exámenes'));
  comprobar('Los consejos de siempre siguen ahí (no se ha perdido funcionalidad)',
    html.includes(examenes.tips[0].slice(0, 30)));
}

// --- 5. Cada situación de MODOS_APP funciona, no solo la primera ---
{
  for (const m of MODOS_APP) {
    const html = render(m.id);
    comprobar(`"${m.label}" activa muestra su primer consejo`, html.includes(m.tips[0].slice(0, 30)));
  }
}

console.log(fallos === 0 ? '\n  Todo correcto.\n' : `\n  ${fallos} fallo(s).\n`);
process.exit(fallos === 0 ? 0 : 1);
