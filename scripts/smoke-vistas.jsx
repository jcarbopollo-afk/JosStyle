// ---------------------------------------------------------------------------
// Prueba de humo: renderiza de verdad las vistas principales con datos reales
// y con datos vacíos, y falla si alguna lanza una excepción.
//
// POR QUÉ IMPORTA
// Hasta ahora, la única verificación posible en este proyecto era "compila".
// Compilar no detecta un `undefined.map()`, un `Object.keys(null)` ni un hook
// mal colocado — que son exactamente los errores que han aparecido varias veces
// en la historia del proyecto (ver el error de orden de Hooks de la Fase A3).
//
// Esto renderiza los componentes a HTML con react-dom/server. No sustituye a
// probar la app en un iPhone (no hay layout, ni gestos, ni navegador real),
// pero sí detecta el tipo de fallo que deja una pantalla en blanco.
//
// Se ejecuta mediante scripts/smoke.mjs, que lo compila antes con esbuild
// (Node no entiende JSX por sí mismo).
// ---------------------------------------------------------------------------
import React from 'react';
import { renderToString } from 'react-dom/server';

import DashboardView from '../src/views/DashboardView.jsx';
import SleepView from '../src/views/SleepView.jsx';
import FinanceView from '../src/views/FinanceView.jsx';
import ObjectivesView from '../src/views/ObjectivesView.jsx';
import DiaryView from '../src/views/DiaryView.jsx';
import StatsView from '../src/views/StatsView.jsx';
import PredictionsView from '../src/views/PredictionsView.jsx';
import AchievementsView from '../src/views/AchievementsView.jsx';
import HubView from '../src/views/HubView.jsx';
import WellbeingView from '../src/views/WellbeingView.jsx';
import BusinessView from '../src/views/BusinessView.jsx';
import PersonalizationView from '../src/views/PersonalizationView.jsx';

import {
  DEFAULT_PERFIL, DEFAULT_ECONOMIA, DEFAULT_CALISTENIA, DEFAULT_SALUD, DEFAULT_NUTRICION,
  DEFAULT_ESTUDIOS, DEFAULT_NEGOCIO, DEFAULT_PRODUCTIVIDAD, DEFAULT_OBJETIVOS, DEFAULT_DIARIO,
  DEFAULT_BIBLIOTECA, DEFAULT_RELACION, DEFAULT_FE, DEFAULT_BIENESTAR, DEFAULT_PERSONALIZACION,
  DEFAULT_NOTIFICACIONES, DEFAULT_CALENDARIO, ACCENTS,
} from '../src/tokens.js';
import { calcularResumenModulo } from '../src/lib/resumenesHub.js';

const accent = ACCENTS[0].value;
const noop = () => {};
const HOY = new Date().toISOString().slice(0, 10);

// --- Dos escenarios: usuario recién registrado y usuario con datos reales ---
const vacio = {
  perfil: DEFAULT_PERFIL, sueno: [], calistenia: DEFAULT_CALISTENIA, futbol: [],
  economia: DEFAULT_ECONOMIA, salud: DEFAULT_SALUD, nutricion: DEFAULT_NUTRICION,
  estudios: DEFAULT_ESTUDIOS, negocio: DEFAULT_NEGOCIO, productividad: DEFAULT_PRODUCTIVIDAD,
  objetivos: DEFAULT_OBJETIVOS, diario: DEFAULT_DIARIO, biblioteca: DEFAULT_BIBLIOTECA,
  relacion: DEFAULT_RELACION, fe: DEFAULT_FE, bienestar: DEFAULT_BIENESTAR,
  calendario: DEFAULT_CALENDARIO, personalizacion: DEFAULT_PERSONALIZACION,
  notificaciones: DEFAULT_NOTIFICACIONES,
};

const lleno = {
  ...vacio,
  sueno: [{ id: '1', fecha: HOY, horaDormir: '23:30', horaDespertar: '07:00', calidad: 4, notas: '' }],
  calistenia: { ...DEFAULT_CALISTENIA, Planche: { nivel: 35, progresion: [{ id: 'p', texto: 'Tuck', hecho: true }], prs: [{ id: 'r', fecha: HOY, valor: '20s' }], sesiones: [{ id: 's', fecha: HOY }] } },
  futbol: [{ id: 'f', fecha: HOY, resultado: '3-2' }],
  economia: { saldoInicial: 100, hucha: 50, movimientos: [{ id: 'm', fecha: HOY, tipo: 'gasto', cantidad: 12, concepto: 'Café' }] },
  salud: { medidas: [{ id: 'x', fecha: HOY, peso: 72, grasa: 12 }], historial: [] },
  nutricion: { comidas: [{ id: 'c', fecha: HOY, nombre: 'Avena', kcal: 350, prot: 12, carbs: 55, grasas: 8 }], agua: { [HOY]: 1500 }, favoritos: [] },
  productividad: { habitos: [{ id: 'h', nombre: 'Leer', historial: { [HOY]: true }, rachaActual: 3, mejorRacha: 5 }], rutinas: [], tareas: [{ id: 't', texto: 'Repasar', hecha: false, fechaLimite: HOY }], metas: [], pomodoros: { [HOY]: 2 } },
  objetivos: { lista: [{ id: 'o', texto: 'Handstand 30s', plazo: '90 días', cumplido: false, fechaCreacion: HOY }], ultimaRevision: null },
  diario: { entradas: [{ id: 'd', fecha: HOY, animo: 4, comoMeSiento: 'Bien', queHeAprendido: 'Algo', queMejorareManana: 'Otra cosa' }] },
  relacion: { nombre: 'A', fechas: [{ id: 'r', etiqueta: 'Aniversario', fecha: HOY, tipo: 'aniversario', repetir: true }] },
  bienestar: { registros: [{ id: 'b', fecha: HOY, categoria: 'productivo', minutos: 60 }], reflexiones: [], sesiones: [{ id: 'z', fecha: HOY, minutos: 25 }] },
  negocio: { proyectos: [{ id: 'n', nombre: 'Idea', estado: 'Idea', notas: '', ingresos: 0, gastos: 0 }] },
};

function propsDashboard(e) {
  return {
    ...e, favoritas: [], modo: null, derivadosCalendario: [],
    resumenes: Object.fromEntries(['salud', 'sueno', 'nutricion', 'entreno', 'calendario', 'estudios',
      'productividad', 'objetivos', 'diario', 'biblioteca', 'economia', 'negocio', 'relacion', 'fe',
      'bienestar', 'estadisticas', 'predicciones', 'logros', 'ajustes']
      .map((id) => [id, calcularResumenModulo(id, e)])),
    dashboardOcultos: [], modulosDesactivados: e.personalizacion.ocultos || [], onNavegar: noop, accent,
  };
}

// Catálogo reducido de módulos y áreas, con la misma forma que MORE_NAV/AREAS_NAV de App.jsx.
const MODULOS_PRUEBA = [
  { id: 'salud', label: 'Salud', icon: () => null },
  { id: 'sueno', label: 'Sueño', icon: () => null },
  { id: 'nutricion', label: 'Nutrición', icon: () => null },
  { id: 'economia', label: 'Economía', icon: () => null },
  { id: 'relacion', label: 'Relación', icon: () => null },
];
const AREAS_PRUEBA = [
  { id: 'area-salud', label: 'Salud', modulos: ['salud', 'sueno', 'nutricion'] },
  { id: 'area-gestion', label: 'Gestión', modulos: ['economia'] },
  { id: 'area-mas', label: 'Más', modulos: ['relacion'] },
];

const CASOS = [
  ['DashboardView', DashboardView, propsDashboard],
  ['SleepView', SleepView, (e) => ({ sueno: e.sueno, onAdd: noop, onDelete: noop, accent })],
  ['FinanceView', FinanceView, (e) => ({ economia: e.economia, onAdd: noop, onDelete: noop, onUpdate: noop, accent })],
  ['ObjectivesView', ObjectivesView, (e) => ({ objetivos: e.objetivos, onAdd: noop, onToggle: noop, onDelete: noop, onRevisar: noop, accent })],
  ['DiaryView', DiaryView, (e) => ({ diario: e.diario, onAdd: noop, onDelete: noop, accent })],
  ['StatsView', StatsView, (e) => ({ sueno: e.sueno, estudios: e.estudios, diario: e.diario, calistenia: e.calistenia, accent })],
  ['PredictionsView', PredictionsView, (e) => ({ objetivos: e.objetivos, productividad: e.productividad, salud: e.salud, calistenia: e.calistenia, economia: e.economia, estudios: e.estudios, accent })],
  ['AchievementsView', AchievementsView, (e) => ({ ...e, accent })],
  ['WellbeingView', WellbeingView, (e) => ({ bienestar: e.bienestar, onAdd: noop, onDelete: noop, onAddReflexion: noop, onCompletarSesion: noop, accent })],
  ['BusinessView', BusinessView, (e) => ({ negocio: e.negocio, onAdd: noop, onUpdate: noop, onDelete: noop, accent })],
  ['PersonalizationView', PersonalizationView, (e) => ({
    areas: AREAS_PRUEBA,
    modulos: MODULOS_PRUEBA,
    personalizacion: e.personalizacion,
    protectedAreas: [], onMove: noop, onToggleOculto: noop, onToggleDashboard: noop,
    onAplicarPerfil: noop, onSetIcono: noop,
    onTogglePinExtra: noop, onToggleFavorita: noop, onMoveFavorita: noop,
    modo: e.personalizacion.modo, onSetModo: noop, accent,
  })],
  ['HubView', HubView, (e) => ({
    area: { id: 'area-salud', label: 'Salud', modulos: ['salud', 'sueno'] },
    modulos: [{ id: 'salud', label: 'Salud', icon: () => null }, { id: 'sueno', label: 'Sueño', icon: () => null }],
    personalizacion: e.personalizacion,
    resumenes: { salud: calcularResumenModulo('salud', e), sueno: calcularResumenModulo('sueno', e) },
    accent, onOpenModulo: noop,
  })],
];

// Tercer escenario: datos guardados a los que les faltan campos, tal y como
// llegarían de una versión anterior de la app. `loadData` no fusiona con el
// valor por defecto, así que este caso es real, no teórico — ya ha provocado
// tres fallos en la historia del proyecto (Perfil/A2, apariencia/A3,
// personalizacion/Dashboard) y un cuarto en DiaryView, encontrado justamente
// con esta prueba.
const parcial = {
  ...vacio,
  sueno: [{ id: '1', fecha: HOY }],
  diario: { entradas: [{ id: 'd', fecha: HOY }] },
  salud: { medidas: [{ id: 'x', fecha: HOY }], historial: [] },
  economia: { saldoInicial: 0, hucha: 0, movimientos: [{ id: 'm', fecha: HOY, tipo: 'gasto', cantidad: 5 }] },
  objetivos: { lista: [{ id: 'o', plazo: '30 días' }], ultimaRevision: null },
  productividad: { ...DEFAULT_PRODUCTIVIDAD, habitos: [{ id: 'h', nombre: 'X' }], tareas: [{ id: 't' }] },
  bienestar: { registros: [{ id: 'b', fecha: HOY }], reflexiones: [], sesiones: [] },
  negocio: { proyectos: [{ id: 'n' }] },
  relacion: { nombre: '', fechas: [{ id: 'r', fecha: HOY }] },
};

// Cuarto escenario: con módulos desactivados desde el centro de módulos (Entrega 2 · ME Fase 1).
// Es el comportamiento central de esa fase: la interfaz debe reconstruirse sola, sin dejar
// encabezados vacíos ni tarjetas huérfanas, y sin reventar por quedarse sin nada que pintar.
const desactivados = {
  ...lleno,
  personalizacion: {
    ...DEFAULT_PERSONALIZACION,
    ocultos: ['sueno', 'economia', 'productividad', 'objetivos', 'relacion', 'nutricion',
              'salud', 'estudios', 'entreno', 'calendario', 'diario', 'negocio',
              'biblioteca', 'fe', 'bienestar', 'estadisticas', 'predicciones', 'logros'],
  },
};

let fallos = 0;
for (const [nombre, Componente, props] of CASOS) {
  for (const [etiqueta, estado] of [['vacío', vacio], ['con datos', lleno], ['datos parciales', parcial], ['todo desactivado', desactivados]]) {
    try {
      const html = renderToString(React.createElement(Componente, props(estado)));
      if (typeof html !== 'string' || html.length === 0) throw new Error('render vacío');
      console.log(`  ✓ ${nombre} (${etiqueta})`);
    } catch (e) {
      console.error(`  ✗ ${nombre} (${etiqueta}) → ${e.message}`);
      fallos++;
    }
  }
}

console.log('');
if (fallos) { console.error(`═══ ${fallos} VISTA(S) FALLAN AL RENDERIZAR ═══\n`); process.exit(1); }
console.log('═══ TODAS LAS VISTAS RENDERIZAN ═══\n');
