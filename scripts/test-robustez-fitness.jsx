// ---------------------------------------------------------------------------
// FIT F39 — Fitness con datos que no son perfectos (apartados 2, 3, 51, 58-60).
//
//   node scripts/smoke.mjs test-robustez-fitness.jsx
//
// El banco de renderizado (`smoke-vistas.jsx`) pinta cada pantalla con datos
// BUENOS y comprueba que no revienta. Esto pinta las pantallas principales de
// Fitness con tres juegos de datos —el de un usuario recién llegado, uno
// completo y uno CORRUPTO a propósito— y busca en lo que sale lo que el
// apartado 2 prohíbe ver: `NaN`, `undefined`, `null`, `[object Object]`,
// `Invalid Date`, `Infinity`, un porcentaje imposible o un id técnico.
//
// 🚨 El corrupto pasa por LA PUERTA DE CARGA DE VERDAD
// (`normalizarFitnessConSesiones`, la que llama `App.jsx`): lo que hay que
// demostrar es que lo que llega a la pantalla desde el disco no la rompe. Y
// además se pinta una parte SIN normalizar (apartado 51: *"No asumir que todas
// las propiedades existen"*), que es lo que recibe un componente cuando alguien
// le pasa un dato a medias.
// ---------------------------------------------------------------------------
import React from 'react';
import { renderToString } from 'react-dom/server';
import FitnessView, { AreaRangos } from '../src/views/FitnessView.jsx';
import RangosView from '../src/views/RangosView.jsx';
import ProgresoView, { DetalleProgreso, DetalleObjetivo } from '../src/views/ProgresoView.jsx';
import HistorialView, { DetalleSesionHistorial, TarjetaHistorial } from '../src/views/HistorialView.jsx';
import TuPlanView from '../src/views/TuPlanView.jsx';
import EjerciciosView from '../src/views/EjerciciosView.jsx';
import PlantillasView from '../src/views/PlantillasView.jsx';
import BibliotecaPlanesView from '../src/views/BibliotecaPlanesView.jsx';
import ClasificacionView from '../src/views/ClasificacionView.jsx';
import EntrenamientoVivoView, { SesionRecuperable } from '../src/views/EntrenamientoVivoView.jsx';
import FinalizacionView from '../src/views/FinalizacionView.jsx';
import { ACCENTS, DEFAULT_CALISTENIA } from '../src/tokens.js';
import { DEFAULT_FITNESS } from '../src/lib/fitness.js';
import { normalizarFitnessConSesiones, sesionActiva } from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion } from '../src/lib/finalizacion.js';
import { detalleCompletoDeEjercicio } from '../src/lib/detalleEjercicio.js';
import { sesionesDelHistorial, fichaDeHistorial, detalleDeSesion } from '../src/lib/historial.js';
import { listaDeObjetivos } from '../src/lib/objetivosProgreso.js';
import { detalleDeObjetivo } from '../src/lib/objetivosFitness.js';
import { textoRoto, textoVisible } from '../src/lib/robustezFitness.js';

const accent = ACCENTS[0].value;
const noop = () => {};
const DIA = 86400000;
const AHORA = Date.now();

let fallos = 0;
let total = 0;
const ok = (cond, nombre, detalle = '') => {
  total++;
  if (cond) console.log(`  ✓ ${nombre}`);
  else { console.error(`  ✗ ${nombre}${detalle ? ' → ' + detalle : ''}`); fallos++; }
};

/* ═══ Los datos ═══════════════════════════════════════════════════════════ */

const serie = (id, hecho, extra = {}) => ({ id, numero: 1, origen: 'planificada', estado: 'hecha', modo: 'reps', plan: { reps: 10, repsHasta: null, peso: 20, duracion: null }, hecho, ...extra });

/* Lo que puede traer el disco de una cuenta vieja, de otro dispositivo o de
   una versión con un fallo: cada línea es una forma distinta de estar mal. */
export const CRUDO_CORRUPTO = {
  ...DEFAULT_FITNESS,
  sesiones: [
    null,
    'no soy una sesión',
    /* Fecha imposible, marcas de tiempo que no son números y un ejercicio que
       el catálogo no conoce, con un id de catálogo (con guiones). */
    {
      id: 'rota-1', estado: 'completada', fecha: '2026-13-45', iniciadaEn: 'abc', terminadaEn: 'def', nombre: 'Rota',
      origen: { tipo: 'plan', ejercicios: [
        { id: 'e1', exerciseId: 'dominada-pronada-antigua', series: [serie('s1', { reps: 8, peso: null, duracion: null })] },
        { id: 'e2', exerciseId: 'press-banca-barra', series: [serie('s2', { reps: 'diez', peso: 'mucho', duracion: null }), serie('s3', { reps: -5, peso: -20, duracion: null })] },
      ] },
    },
    /* Un fin ANTERIOR al inicio y un ejercicio propio que ya se borró (un id
       aleatorio, sin guiones). */
    {
      id: 'rota-2', estado: 'completada', fecha: '2026-09-10', iniciadaEn: AHORA - 3 * DIA, terminadaEn: AHORA - 4 * DIA, nombre: '',
      pesoCorporal: 'NaN',
      origen: { tipo: 'plan', ejercicios: [
        { id: 'e3', exerciseId: 'k3j9x2ab', series: [serie('s4', { reps: 12, peso: 10, duracion: null })] },
      ] },
    },
    /* La misma sesión dos veces (otro dispositivo). */
    { id: 'rota-2', estado: 'completada', fecha: '2026-09-10', iniciadaEn: AHORA - 3 * DIA, terminadaEn: AHORA - 3 * DIA + 3600000, origen: { tipo: 'plan', ejercicios: [] } },
    /* Una que se quedó a medias hace tres días (apartado 19). */
    {
      id: 'olvidada', estado: 'en_curso', fecha: '2026-09-14', iniciadaEn: AHORA - 3 * DIA, terminadaEn: null, nombre: 'Push',
      origen: { tipo: 'plan', ejercicios: [
        { id: 'e4', exerciseId: 'press-banca-barra', series: [serie('s5', { reps: 10, peso: 40, duracion: null }), serie('s6', { reps: null, peso: null, duracion: null }, { estado: 'pendiente' })] },
      ] },
    },
    /* Una normal, para que haya algo con lo que comparar. */
    {
      id: 'buena', estado: 'completada', fecha: '2026-09-12', iniciadaEn: AHORA - 5 * DIA, terminadaEn: AHORA - 5 * DIA + 3000000, nombre: 'Pierna',
      origen: { tipo: 'plan', ejercicios: [
        { id: 'e5', exerciseId: 'sentadilla-barra', series: [serie('s7', { reps: 8, peso: 60, duracion: null })] },
      ] },
    },
  ],
  objetivos: [
    { id: 'o1', exerciseId: 'dominada-prona', tipo: 'reps', valor: 'x', creadoEn: 'ayer', fechaObjetivo: '2026-02-30', estado: 'activo' },
    { id: 'o2', exerciseId: 'ejercicio-que-no-existe', tipo: 'peso', valor: 80, creadoEn: AHORA - 10 * DIA, fechaObjetivo: '2026-01-01', estado: 'activo' },
    { id: 'o3', tipo: 'inventado', valor: -3 },
    null,
  ],
  clasificaciones: [{ exerciseId: 'no-existe', respuestas: 'x' }, 42],
  plantillas: [
    { id: 'p1', nombre: 'Con un ejercicio borrado', lineas: [{ id: 'l1', exerciseId: 'ejercicio-borrado', series: -3, repeticiones: 'mil' }] },
    { id: 'p2', nombre: null, lineas: 'no es una lista' },
  ],
  ejercicios: [
    {
      id: 'propio-roto', nombre: 'Mi ejercicio raro', grupo: 'pecho', dificultad: 'imposible',
      musculos: [{ subgrupoId: 'pecho-medio', porcentaje: 145, papel: 'principal' }, { subgrupoId: 'no-existe', porcentaje: -20 }],
      variantes: ['variante-rota'], base: 'base-rota',
    },
  ],
  favoritosEjercicios: ['no-existe', 42, null, 'press-banca-barra'],
  favoritosPlanes: ['plan-que-no-existe'],
  planActivo: { planId: 'plan-que-no-existe', origen: 'preset', desde: 'nunca' },
  planesAnteriores: [{ planId: null, desde: 'x', hasta: 'y' }, 'basura'],
};

const FOTOS_CORRUPTAS = [
  { id: 'f1', path: 'u/1.jpg', fecha: '2026-13-01', tags: 'frontal' },
  { id: 'f2', path: null, fecha: null },
  null,
];

const ENTRENADO = normalizarFitnessConSesiones(CRUDO_CORRUPTO);
/* Los ids del escenario que no pueden leerse nunca en una pantalla. */
const IDS_TECNICOS = ['k3j9x2ab', 'dominada-pronada-antigua', 'ejercicio-que-no-existe', 'ejercicio-borrado', 'plan-que-no-existe', 'propio-roto', 'rota-1', 'rota-2', 'olvidada'];
const PROPIOS = ENTRENADO.ejercicios || [];

/* ═══ Qué se pinta ════════════════════════════════════════════════════════ */

const html = (C, props) => renderToString(React.createElement(C, props));

function pantallas(f, etiqueta) {
  const propios = (f && f.ejercicios) || [];
  const activa = f ? sesionActiva(f) : null;
  const historial = f ? sesionesDelHistorial(f) : [];
  const objetivos = f ? listaDeObjetivos(f).objetivos : [];
  const lista = [
    ['Fitness (Entrenamiento)', FitnessView, { fitness: f, calistenia: DEFAULT_CALISTENIA, onUpdateSkill: noop, futbol: [], onAddPartido: noop, onDeletePartido: noop, videos: [], onAddVideo: noop, onDeleteVideo: noop, onSetVideoFeedback: noop, fotos: FOTOS_CORRUPTAS, rachas: undefined, accent, onIr: noop, onGuardarFitness: noop }],
    ['Rangos (área)', AreaRangos, { fitness: f, accent, onMusculo: noop, onEntrenar: noop }],
    ['Rangos', RangosView, { fitness: f, propios, perfil: { peso: 'x' }, accent, onEntrenar: noop, onClasificar: noop, onEjercicio: noop }],
    ['Progreso', ProgresoView, { fitness: f, fotos: FOTOS_CORRUPTAS, accent, onEntrenar: noop, onIrAFotos: noop, onGuardarFitness: noop }],
    ['Historial', HistorialView, { fitness: f, propios, accent, onVolver: noop, onEmpezar: noop, onEliminar: noop }],
    ['Tu Plan', TuPlanView, { fitness: f, accent, onExplorar: noop, onCrear: noop, onVerPlantillas: noop, onCambiarPlan: noop }],
    ['Biblioteca de ejercicios', EjerciciosView, { propios, fitness: f, accent, onVolver: noop, onGuardarFitness: noop }],
    ['Plantillas', PlantillasView, { plantillas: (f && f.plantillas) || [], propios, accent, onVolver: noop, onCrear: noop, onEditar: noop, onDuplicar: noop, onEliminar: noop }],
    ['Planes', BibliotecaPlanesView, { fitness: f, accent, onVolver: noop, onUsar: noop, onPersonalizar: noop, onFavorito: noop }],
    ['Clasificación', ClasificacionView, { fitness: f, accent, onGuardarFitness: noop, onVolver: noop }],
  ];
  if (activa) {
    lista.push(['Entrenamiento en vivo', EntrenamientoVivoView, { sesion: activa, propios, accent, onGuardar: noop, onSalir: noop, onTerminada: noop }]);
    lista.push(['Tarjeta de sesión sin terminar', SesionRecuperable, { sesion: activa, accent, onContinuar: noop, onDescartar: noop, onFinalizar: noop }]);
    lista.push(['Resumen al terminar', FinalizacionView, { sesion: pasarAFinalizacion(activa), propios, accent, onGuardar: noop, onDescartar: noop, onSeguir: noop, onVolver: noop }]);
  }
  historial.forEach((s) => {
    lista.push([`Tarjeta de historial «${s.id}»`, TarjetaHistorial, { ficha: fichaDeHistorial(s, { fitness: f, propios }), accent, onAbrir: noop }]);
    lista.push([`Detalle de sesión «${s.id}»`, DetalleSesionHistorial, { detalle: detalleDeSesion(s, { fitness: f, propios }), accent, onVolver: noop, onEliminar: noop }]);
  });
  ['dominada-pronada-antigua', 'k3j9x2ab', 'press-banca-barra', 'propio-roto', 'no-existe'].forEach((id) => {
    lista.push([`Detalle del ejercicio «${id}»`, DetalleProgreso, { detalle: detalleCompletoDeEjercicio(f || {}, id, { propios }), accent, rango: 'todo', onRango: noop, onVolver: noop, onVerSesion: noop, onMetrica: noop }]);
  });
  objetivos.forEach((o) => {
    lista.push([`Detalle del objetivo «${o.id}»`, DetalleObjetivo, { objetivo: o, detalle: detalleDeObjetivo(f || {}, o), accent, onVolver: noop, onVerProgreso: noop, onEditar: noop, onCancelarObjetivo: noop, onEliminar: noop }]);
  });
  return lista.map(([n, C, p]) => [`${n} (${etiqueta})`, C, p]);
}

/* ═══ Las pasadas ═════════════════════════════════════════════════════════ */

console.log('\n── Usuario recién llegado, datos corruptos y datos sin normalizar ──');
const PASADAS = [
  ...pantallas(undefined, 'sin la clave fitness'),
  ...pantallas({ ...DEFAULT_FITNESS }, 'usuario nuevo'),
  ...pantallas(ENTRENADO, 'datos corruptos, tras la puerta de carga'),
];
for (const [nombre, C, props] of PASADAS) {
  let salida = '';
  let error = null;
  try { salida = html(C, props); } catch (e) { error = e; }
  ok(!error, `${nombre}: se pinta`, error ? error.message : '');
  if (error) continue;
  const rotos = textoRoto(salida);
  ok(rotos.length === 0, `${nombre}: sin nada roto a la vista`, rotos.join(' | '));
  /* 🚨 Apartado 55 — ni un id técnico a la vista. Un ejercicio que ya no está
     en el catálogo se llamaba por su id (F11, C-36): «k3j9x2ab». */
  const ids = IDS_TECNICOS.filter((id) => textoVisible(salida).includes(id));
  ok(ids.length === 0, `${nombre}: sin ids técnicos a la vista`, ids.join(', '));
  /* 🚨 Apartados 19 y 26 — ni un reloj de días: una sesión olvidada hace tres
     días no «dura» 72 horas. */
  const reloj = textoVisible(salida).match(/\b\d{2,}:\d{2}:\d{2}\b|\b\d{2,} h \d+ min\b|\b\d{2,} h\b/);
  ok(!reloj, `${nombre}: ninguna duración imposible`, reloj ? reloj[0] : '');
}

/* 🚨 Y sin normalizar (apartado 51): algunas pantallas reciben un dato a
   medias de quien las llama. No se exige que pinten todo —un dato roto no se
   inventa—, pero sí que no revienten ni enseñen basura. */
console.log('\n── Sin pasar por la puerta de carga (apartado 51) ──');
for (const [nombre, C, props] of [
  ['Historial', HistorialView, { fitness: CRUDO_CORRUPTO, propios: [], accent, onVolver: noop }],
  ['Tu Plan', TuPlanView, { fitness: CRUDO_CORRUPTO, accent, onExplorar: noop, onCrear: noop }],
  ['Progreso', ProgresoView, { fitness: CRUDO_CORRUPTO, fotos: FOTOS_CORRUPTAS, accent }],
  ['Rangos', RangosView, { fitness: CRUDO_CORRUPTO, accent }],
]) {
  let salida = '';
  let error = null;
  try { salida = html(C, props); } catch (e) { error = e; }
  ok(!error, `${nombre} (sin normalizar): se pinta`, error ? error.message : '');
  if (error && process.env.PILA) console.error(error.stack.split('\n').slice(0, 10).join('\n'));
  if (!error) {
    const rotos = textoRoto(salida);
    ok(rotos.length === 0, `${nombre} (sin normalizar): sin nada roto a la vista`, rotos.join(' | '));
  }
}

console.log('');
if (fallos) { console.error(`FIT F39 · robustez: ${fallos} FALLO(S) — ${total} comprobaciones`); process.exit(1); }
console.log(`FIT F39 · robustez: TODO EN VERDE — ${total} comprobaciones`);
