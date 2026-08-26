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
import PapeleraView from '../src/views/PapeleraView.jsx';
import ArmarioView, { PanelOutfits, PanelCalendario, PanelIdeas } from '../src/views/ArmarioView.jsx';

import {
  DEFAULT_PERFIL, DEFAULT_ECONOMIA, DEFAULT_CALISTENIA, DEFAULT_SALUD, DEFAULT_NUTRICION,
  DEFAULT_ESTUDIOS, DEFAULT_NEGOCIO, DEFAULT_PRODUCTIVIDAD, DEFAULT_OBJETIVOS, DEFAULT_DIARIO,
  DEFAULT_BIBLIOTECA, DEFAULT_RELACION, DEFAULT_FE, DEFAULT_BIENESTAR, DEFAULT_PERSONALIZACION,
  DEFAULT_NOTIFICACIONES, DEFAULT_CALENDARIO, ACCENTS,
} from '../src/tokens.js';
import { DEFAULT_PAPELERA } from '../src/lib/papelera.js';
import { DEFAULT_ARMARIO, crearPrenda, crearOutfit, crearUso } from '../src/lib/armario.js';
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
  notificaciones: DEFAULT_NOTIFICACIONES, papelera: DEFAULT_PAPELERA,
  armario: DEFAULT_ARMARIO,
};

const lleno = {
  ...vacio,
  armario: (() => {
    const p1 = { ...crearPrenda({ nombre: 'Vaquero gris', categoria: 'pantalones', color: 'gris', marca: "Levi's", talla: '30' }), creadaEn: '2026-01-01T00:00:00Z' };
    const p2 = { ...crearPrenda({ nombre: 'Sudadera Nike', categoria: 'sudaderas', color: 'negro', marca: 'Nike', favorita: true, estado: 'lavanderia' }), creadaEn: '2026-02-01T00:00:00Z' };
    const o1 = { ...crearOutfit({ nombre: 'Casual gris', prendaIds: [p1.id, p2.id], ocasion: 'casual', lugar: 'Instituto', personas: ['Amigos'], favorito: true, descripcion: 'El de todos los días' }), creadoEn: '2026-03-01T00:00:00Z' };
    return {
      ...DEFAULT_ARMARIO,
      prendas: [p1, p2],
      outfits: [
        o1,
        // Un outfit con una prenda que YA NO EXISTE y otro sin ninguna: los dos casos
        // límite del apartado 4 y del 5 del cierre técnico, que tienen que pintarse sin
        // reventar ni dejar un hueco vacío.
        { ...crearOutfit({ nombre: 'Con prenda borrada', prendaIds: [p1.id, 'fantasma'] }), creadoEn: '2026-03-02T00:00:00Z' },
        { ...crearOutfit({ nombre: 'Sin prendas', prendaIds: [] }), creadoEn: '2026-03-03T00:00:00Z' },
      ],
      // AR Fase 3 — historial con los tres casos que el calendario tiene que saber pintar:
      // un uso normal, DOS el mismo día (la insignia con el número) y uno HUÉRFANO, cuyo
      // outfit ya no existe: ese debe decir "outfit eliminado", no reventar ni desaparecer.
      usos: [
        crearUso({ outfitId: o1.id, fecha: HOY, hora: '09:00', lugar: 'Instituto', personas: ['Jorge'], evento: 'universidad', notas: 'Día normal' }),
        crearUso({ outfitId: o1.id, fecha: HOY, hora: '21:00', evento: 'cena' }),
        crearUso({ outfitId: 'fantasma', fecha: HOY, evento: 'otro' }),
      ],
    };
  })(),
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
  papelera: { retencionDias: 30, elementos: [
    { id: 'p1', modulo: 'productividad', coleccion: 'tareas', tipo: 'Tarea', icono: 'productividad', idOriginal: 't9', indice: 0, eliminadoEn: new Date().toISOString(), datos: { id: 't9', texto: 'Algo borrado' } },
    { id: 'p2', modulo: 'relacion', coleccion: 'fechas', tipo: 'Fecha importante', icono: 'relacion', privado: true, idOriginal: 'f9', indice: 0, eliminadoEn: new Date().toISOString(), datos: { id: 'f9', etiqueta: 'Privado' } },
  ] },
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
  ['ArmarioView', ArmarioView, (e) => ({
    armario: e.armario, onAddPrenda: noop, onUpdatePrenda: noop, onDeletePrenda: noop,
    onSubirFoto: async () => '', onAddOutfit: noop, onUpdateOutfit: noop,
    onDeleteOutfit: noop, onDuplicarOutfit: noop,
    onAddUso: noop, onUpdateUso: noop, onDeleteUso: noop, accent,
  })],
  // La pestaña de outfits aparte: `renderToString` no puede pulsar una pestaña, así que
  // sin esto la mitad de AR Fase 2 no se renderizaría nunca en las pruebas.
  ['ArmarioView · Outfits', PanelOutfits, (e) => ({
    outfits: e.armario.outfits, prendas: e.armario.prendas, usos: e.armario.usos,
    onAddOutfit: noop, onUpdateOutfit: noop, onDeleteOutfit: noop, onDuplicarOutfit: noop,
    onSubirFoto: async () => '', onAbrirPrenda: noop, onRegistrarUso: noop, accent,
  })],
  // Y la tercera pestaña, por el mismo motivo. El escenario "lleno" incluye un uso
  // huérfano a propósito: si el calendario diera por hecho que todo uso tiene outfit,
  // este caso lo dejaría en blanco o lo haría reventar, y aquí se ve.
  ['ArmarioView · Calendario', PanelCalendario, (e) => ({
    usos: e.armario.usos, outfits: e.armario.outfits, prendas: e.armario.prendas,
    hoyISO: HOY, onAddUso: noop, onUpdateUso: noop, onDeleteUso: noop, onAbrirOutfit: noop, accent,
  })],
  // Y la cuarta. El escenario "lleno" trae un uso huérfano y una prenda en la
  // lavandería: las estadísticas tienen que salir sin contarlos mal ni reventar.
  ['ArmarioView · Ideas', PanelIdeas, (e) => ({
    usos: e.armario.usos, outfits: e.armario.outfits, prendas: e.armario.prendas,
    hoyISO: HOY, onAbrirOutfit: noop, onAbrirPrenda: noop, onRegistrarUso: noop, accent,
  })],
  ['PersonalizationView', PersonalizationView, (e) => ({
    areas: AREAS_PRUEBA,
    modulos: MODULOS_PRUEBA,
    personalizacion: e.personalizacion,
    protectedAreas: [], onMove: noop, onToggleOculto: noop, onToggleDashboard: noop,
    onAplicarPerfil: noop, onSetIcono: noop,
    onTogglePinExtra: noop, onToggleFavorita: noop, onMoveFavorita: noop,
    modo: e.personalizacion.modo, onSetModo: noop, accent,
  })],
  ['PapeleraView', PapeleraView, (e) => ({
    papelera: e.papelera, relacionDesbloqueada: false,
    onRestaurar: noop, onEliminarDefinitivo: noop, onVaciar: noop, onSetRetencion: noop, accent,
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
  // Entrega 2 · AR Fase 1 — una prenda a medio rellenar: sin marca, sin talla y sin foto.
  // Es el caso normal de verdad, porque la especificación insiste en que añadir una prenda
  // tiene que poder hacerse en segundos con solo tres campos.
  armario: { ...DEFAULT_ARMARIO, prendas: [{ id: 'pr', nombre: 'Camiseta', categoria: 'camisetas', color: 'negro', estado: 'disponible' }] },
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

// Un `<button>` dentro de otro `<button>` es HTML inválido, no revienta el render y en iOS
// hace que el toque del botón interior se lo coma el exterior. Se encontró en BI Fase 1, al
// meter los selectores de situación dentro de un indicador que era él mismo un botón. Como es
// un fallo silencioso y fácil de repetir, se comprueba en todas las vistas y escenarios.
function botonesAnidados(html) {
  let profundidad = 0;
  for (const etiqueta of html.match(/<\/?button\b/g) || []) {
    if (etiqueta === '<button') { profundidad++; if (profundidad > 1) return true; }
    else profundidad--;
  }
  return false;
}

let fallos = 0;
for (const [nombre, Componente, props] of CASOS) {
  for (const [etiqueta, estado] of [['vacío', vacio], ['con datos', lleno], ['datos parciales', parcial], ['todo desactivado', desactivados]]) {
    try {
      const html = renderToString(React.createElement(Componente, props(estado)));
      if (typeof html !== 'string' || html.length === 0) throw new Error('render vacío');
      if (botonesAnidados(html)) throw new Error('tiene un <button> dentro de otro <button>');
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
