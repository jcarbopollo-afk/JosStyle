/* Entrega 4 · FIT F36/45 — Integración global del sistema fitness.
   ═══════════════════════════════════════════════════════════════════════════
   *"NO queremos crear nuevas funcionalidades grandes. Queremos conectar
   correctamente las existentes."* Esta suite mide lo que eso significa: que
   cada pregunta tenga UNA función que la conteste, que cada puerta entre
   pantallas esté cableada de verdad, que guardar recalcule todo sin guardar
   nada derivado, y los cinco fallos de integración que encontró la fase. */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FUENTES_DE_VERDAD, CONEXIONES, EVENTOS_FITNESS, CAMPOS_GUARDADOS, DERIVADOS_PROHIBIDOS, afectadosPorSesion,
  auditarDatosFitness, PUERTA_DE_GUARDADO, NO_EN_FIT36, DECISIONES_FIT36,
} from '../src/lib/integracionFitness.js';
import {
  CATALOGO_EJERCICIOS, ejercicioPorId, crearEjercicioCompleto, todosLosEjercicios, ejerciciosParaLeer, buscarEjercicios,
} from '../src/lib/ejercicios.js';
import {
  empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie, guardarSesion, anadirEjercicioASesion, sesionActiva,
  normalizarFitnessConSesiones,
} from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import {
  DEFAULT_FITNESS, crearObjetivo, crearWorkoutSession, PESO_CORPORAL_VALIDO, pesoCorporalValido, subgrupoMuscular,
} from '../src/lib/fitness.js';
import { PESO_CORPORAL_VALIDO as PESO_DESDE_RANGOS } from '../src/lib/rangos.js';
import { crearRutina, anadirEjercicio, editarLinea, guardarRutina, planARutina } from '../src/lib/constructor.js';
import { usarPlan, quitarPlanActivo } from '../src/lib/planes.js';
import { sesionesDelHistorial } from '../src/lib/historial.js';
import { progresoDeEjercicio, aparicionesDeEjercicio } from '../src/lib/progresion.js';
import { rangoEfectivoDeEjercicio } from '../src/lib/motorRangos.js';
import { contribucionesDeMusculo } from '../src/lib/contribucionMuscular.js';
import { clasificacionDeEjercicios } from '../src/lib/pantallaRangos.js';
import { rangoGlobalEfectivo } from '../src/lib/motorRangos.js';
import { listaDeObjetivos } from '../src/lib/objetivosProgreso.js';
import { resumenDeActividad } from '../src/lib/actividadEntrenamiento.js';
import { sesionParaAnadir, anadirALaSesionEnCurso } from '../src/lib/bibliotecaEjercicios.js';
import { crearFotoProgreso, sesionDeFoto } from '../src/lib/fotosProgreso.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const soloCodigo = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '')
  .replace(/`(?:\\.|[^`\\])*`/g, '``')
  .replace(/'(?:\\.|[^'\\\n])*'/g, "''")
  .replace(/"(?:\\.|[^"\\\n])*"/g, '""');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

/* ── Sesiones de verdad: constructor (F3) → en vivo (F7) → guardado (F8) ── */
function sesion(exerciseId, fecha, valores, { pesoCorporal = null, id = null } = {}) {
  let r = anadirEjercicio(crearRutina({ nombre: exerciseId }), exerciseId);
  if (!r.lineas.length) throw new Error(`El escenario pide «${exerciseId}», que no está en el catálogo`);
  r = editarLinea(r, r.lineas[0].id, { series: valores.length });
  const inicio = new Date(`${fecha}T18:00:00`).getTime();
  let s = empezarSesion({ nombre: exerciseId, lineas: r.lineas, hoy: fecha, ahora: inicio, pesoCorporal });
  const e = ejerciciosDeSesion(s)[0];
  valores.forEach((v, i) => {
    s = editarSerie(s, e.id, e.series[i].id, v);
    s = marcarSerie(s, e.id, e.series[i].id, true);
  });
  const hecha = guardarEntrenamiento(pasarAFinalizacion(s, { ahora: inicio + 3600000 }), { confirmado: true, ahora: inicio + 3601000 }).sesion;
  return id ? { ...hecha, id } : hecha;
}
const conSesiones = (sesiones, extra = {}) => ({ ...DEFAULT_FITNESS, ...extra, sesiones });
/* Lo que hace App.jsx al cargar: pasar por la puerta de carga de verdad. */
const recargar = (f) => normalizarFitnessConSesiones(JSON.parse(JSON.stringify(f)));

console.log('\n═══ FIT F36/45 · Integración global del sistema fitness ═══');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Una función por pregunta (apartados 1, 2, 45 y 52) ──');

ok(FUENTES_DE_VERDAD.length >= 20 && FUENTES_DE_VERDAD.every((x) => typeof x.es === 'function'),
  `Las ${FUENTES_DE_VERDAD.length} fuentes de verdad son FUNCIONES importadas, no nombres`);
ok(new Set(FUENTES_DE_VERDAD.map((x) => x.concepto)).size === FUENTES_DE_VERDAD.length,
  '…y cada concepto sale una sola vez: dos fuentes para lo mismo es lo que prohíbe el apartado 45');
ok(new Set(FUENTES_DE_VERDAD.map((x) => x.es)).size === FUENTES_DE_VERDAD.length,
  '…ni una función contesta dos preguntas distintas');
const conceptos = FUENTES_DE_VERDAD.map((x) => x.concepto);
['ejercicio', 'sesion', 'historial', 'progreso', 'objetivo', 'rango', 'rango_global', 'actividad', 'sustitucion', 'ficha', 'foto']
  .forEach((c) => ok(conceptos.includes(c), `El concepto «${c}» del apartado 1 tiene su fuente`));

/* Un nombre exportado dos veces en Fitness es lógica duplicada (apartado 52). */
const LIBRERIAS_FITNESS = [
  'fitness', 'ejercicios', 'constructor', 'plantillas', 'planes', 'tuPlan', 'entrenamiento', 'entrenamientoUx',
  'finalizacion', 'historial', 'progresion', 'progresoEjercicios', 'progresoMuscular', 'objetivosProgreso', 'rangos',
  'pantallaRangos', 'clasificacion', 'motorRangos', 'detalleMuscular', 'explicacionRangos', 'contribucionMuscular',
  'historialRangos', 'siguienteRango', 'colaClasificacion', 'resumenRangos', 'fotosProgreso', 'comparadorFotos',
  'resumenProgreso', 'detalleEjercicio', 'objetivosFitness', 'actividadEntrenamiento', 'planificacionSemanal',
  'sustitucion', 'bibliotecaEjercicios', 'validacionCatalogo', 'integracionFitness',
].filter((n) => { try { leer(`src/lib/${n}.js`); return true; } catch { return false; } });
ok(LIBRERIAS_FITNESS.length >= 30, `El barrido mira ${LIBRERIAS_FITNESS.length} librerías de Fitness que existen de verdad`);
const exportadas = new Map();
LIBRERIAS_FITNESS.forEach((n) => {
  for (const m of soloCodigo(leer(`src/lib/${n}.js`)).matchAll(/export (?:async )?function (\w+)/g)) {
    if (!exportadas.has(m[1])) exportadas.set(m[1], []);
    exportadas.get(m[1]).push(n);
  }
});
const repetidas = [...exportadas.entries()].filter(([, l]) => l.length > 1);
ok(repetidas.length === 0,
  `🚨 Ni una función de Fitness escrita dos veces (apartado 52)${repetidas.length ? ` — ${repetidas.map(([k, l]) => `${k}: ${l.join(', ')}`).join('; ')}` : ''}`);
ok(FUENTES_DE_VERDAD.every((x) => (exportadas.get(x.es.name) || []).length === 1),
  '…y cada fuente de verdad está exportada en UNA sola librería');

/* 🐛 La regla del peso corporal válido estaba escrita dos veces (F15 y F17). */
const conLaRegla = LIBRERIAS_FITNESS.filter((n) => /PESO_CORPORAL_VALIDO\.min/.test(soloCodigo(leer(`src/lib/${n}.js`))));
ok(conLaRegla.length === 1 && conLaRegla[0] === 'fitness',
  `🐛 La regla «qué peso corporal es un dato» vive en UN sitio (${conLaRegla.join(', ') || 'ninguno'})`);
ok(!LIBRERIAS_FITNESS.some((n) => n !== 'fitness' && /Number\(perfil\?\.peso\)/.test(soloCodigo(leer(`src/lib/${n}.js`)))),
  '…y nadie más convierte el peso del perfil por su cuenta');
ok(PESO_DESDE_RANGOS === PESO_CORPORAL_VALIDO, '…y `rangos.js` sigue exportando el suyo, que ES el mismo objeto');
/* Que el barrido caza una copia de verdad (EH F42). */
ok(/PESO_CORPORAL_VALIDO\.min/.test(soloCodigo('const x = (p) => p >= PESO_CORPORAL_VALIDO.min;')),
  '…y el barrido sí caza una copia si alguien la vuelve a escribir');
ok(pesoCorporalValido(null) === null && pesoCorporalValido('') === null && pesoCorporalValido(undefined) === null,
  '`pesoCorporalValido`: un dato que no está no es un cero (`Number(null)` es 0)');
ok(pesoCorporalValido('72') === 72 && pesoCorporalValido(72.5) === 72.5,
  '…un número o su texto valen');
ok(pesoCorporalValido(20) === null && pesoCorporalValido(300) === null && pesoCorporalValido('abc') === null && pesoCorporalValido(NaN) === null,
  '…y un peso imposible no es un dato');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. Las puertas entre pantallas están cableadas (apartados 13-33 y 48) ──');

CONEXIONES.forEach((c) => {
  ok(c.cableado.test(leer(c.archivo)), `Apartado ${c.apartado} · ${c.de} → ${c.a} (${c.archivo.split('/').pop()})`);
});
ok(new Set(CONEXIONES.map((c) => c.apartado)).size >= 10, 'Las conexiones cubren al menos diez apartados distintos');
/* Una comprobación que no puede ponerse roja no sirve: se le quita el cable. */
const fitnessView = leer('src/views/FitnessView.jsx');
const historial = CONEXIONES.find((c) => c.de === 'Historial · sesión');
ok(historial && !historial.cableado.test(fitnessView.replace(/onEliminar=\{onEliminarSesion\}\s*onVerEjercicio=\{onVerProgresoEjercicio\}/, 'onEliminar={onEliminarSesion}')),
  '…y la del historial SE PONE ROJA si se desconecta (era la puerta que faltaba)');
const foto = CONEXIONES.find((c) => c.de === 'Foto');
ok(foto && !foto.cableado.test(leer('src/views/ProgresoView.jsx').replace(/onSesion=\{\(id\) => setVista\(\{ tipo: 'sesion', id \}\)\}/g, '')),
  '…igual que la de la foto');

/* 🐛 Historial → ejercicio: la prop llega de verdad al detalle de la sesión. */
const historialView = leer('src/views/HistorialView.jsx');
ok(/onVerEjercicio = null/.test(historialView) && /<DetalleSesionHistorial[\s\S]{0,400}onVerEjercicio=\{onVerEjercicio\}/.test(historialView),
  '🐛 Apartado 13 · `HistorialView` recibe `onVerEjercicio` y se lo pasa al detalle de la sesión');
ok(/<HistorialView[\s\S]{0,600}onVerEjercicio=\{onVerProgresoEjercicio\}/.test(fitnessView),
  '…y Fitness se lo da: tocar un ejercicio de una sesión del historial lleva a su progreso');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Un fallo en un área no se lleva Fitness (apartado 47) ──');

const areaSegura = leer('src/components/areaSegura.jsx');
ok(/static getDerivedStateFromError/.test(areaSegura) && /componentDidCatch/.test(areaSegura),
  '`AreaSegura` es un límite de error de verdad: React solo los hace con clases');
ok(/console\.error/.test(soloCodigo(areaSegura).replace(/''/g, '')),
  '⚠️ …que NO esconde el fallo: lo manda a la consola, y el recorrido lo cuenta como error');
ok(/getDerivedStateFromProps[\s\S]{0,200}props\.clave !== state\.clave/.test(areaSegura),
  '…y cambiar de área lo limpia: un fallo de Rangos no se queda pegado a Progreso');
['rangos', 'progreso', 'entrenamiento'].forEach((a) => {
  ok(new RegExp(`<AreaSegura clave="${a}"`).test(fitnessView), `El área «${a}» tiene su propio límite`);
});
ok(/export default function FitnessView\(props\)[\s\S]{0,300}<AreaSegura[\s\S]{0,200}<FitnessViewContenido/.test(fitnessView),
  '…y Fitness entero tiene otro, para que un fallo de la cabecera no deje la aplicación en blanco');
ok(/import \{ AreaSegura \} from '\.\.\/components\/areaSegura'/.test(fitnessView), '…importado, no copiado');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. El peso corporal de cada sesión (apartado 39) ──');

const HOY = '2026-09-20';
const s70 = sesion('press-banca-barra', '2026-06-10', [{ reps: 5, peso: 60 }], { pesoCorporal: 70, id: 'pc-70' });
ok(s70.pesoCorporal === 70, '🐛 Empezar una sesión guarda el peso corporal de ESE día con el snapshot (F7)');
ok(crearWorkoutSession({ pesoCorporal: 500 }).pesoCorporal === null && crearWorkoutSession({}).pesoCorporal === null,
  '…un peso imposible, o ninguno, se guarda como `null`');
const f70 = conSesiones([s70]);
ok(recargar(f70).sesiones[0].pesoCorporal === 70, '…y sobrevive a recargar: la puerta de carga lo conoce (regla 5)');
ok(aparicionesDeEjercicio(f70, 'press-banca-barra')[0].pesoCorporal === 70, '…y la progresión lo pasa en cada aparición');

const conPerfil = (peso) => rangoEfectivoDeEjercicio(f70, 'press-banca-barra', { perfil: { peso } });
const r70 = conPerfil(70);
const r90 = conPerfil(90);
ok(!r70.sinRango && r70.score === r90.score,
  `🚨 Cambiar de peso NO reescribe el rango de junio: ${r70.score} con 70 kg en el perfil, ${r90.score} con 90`);
const antigua = { ...s70, id: 'pc-null', pesoCorporal: null };
const fAntigua = conSesiones([antigua]);
const a70 = rangoEfectivoDeEjercicio(fAntigua, 'press-banca-barra', { perfil: { peso: 70 } });
const a90 = rangoEfectivoDeEjercicio(fAntigua, 'press-banca-barra', { perfil: { peso: 90 } });
ok(a70.score === r70.score, '…una sesión de antes, sin su peso, usa el del perfil: con el mismo peso sale lo mismo');
ok(a90.score < a70.score,
  `…y ése es el caso que SÍ cambia con el perfil (${a70.score} → ${a90.score}): no hay otro dato, y así se demuestra que la sesión nueva no depende de él`);
const sinPerfil = rangoEfectivoDeEjercicio(f70, 'press-banca-barra', { perfil: null });
ok(sinPerfil.score === r70.score, '…y sin perfil, la sesión se mide con el suyo');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Añadir a la sesión en curso (apartado 17) ──');

const plantilla = anadirEjercicio(crearRutina({ nombre: 'Pecho F36' }), 'press-banca-barra');
const gR = guardarRutina([], plantilla);
const fPlant = { ...DEFAULT_FITNESS, plantillas: gR.planes };
const plantGuardada = gR.plan;
ok(gR.ok && fPlant.plantillas.length === 1, 'Escenario: una plantilla suya, guardada (F3)');
/* Como `empezarDePlantilla` de FitnessView: la plantilla vuelve a rutina. */
const enCurso = empezarSesion({ nombre: 'Pecho F36', lineas: planARutina(plantGuardada).lineas, origenTipo: 'plantilla', origenId: plantGuardada.id, hoy: HOY });
ok(enCurso.estado === 'en_curso', '…y una sesión en curso que sale de ella');
const conCurl = anadirEjercicioASesion(enCurso, 'curl-barra');
const ejs = ejerciciosDeSesion(conCurl);
ok(ejs.length === 2 && ejs[1].exerciseId === 'curl-barra', 'Añadir un ejercicio lo pone AL FINAL de la sesión');
ok(ejs[1].series.length > 0 && ejs[1].series.every((x) => x.origen === 'anadida'),
  '…con sus series «añadida», no «planificada»: el plan no las pedía (F9, planificado frente a realizado)');
ok(ejs[1].linea === null, '…y sin línea del plan, porque no salió de él');
ok(ejs[1].series.every((x) => x.estado === 'pendiente'), '…y ninguna serie viene marcada: la marca él');
ok(ejerciciosDeSesion(enCurso).length === 1, '…sin tocar la sesión de antes (inmutable)');
const fConSesion = guardarSesion(fPlant, conCurl);
ok(JSON.stringify(fConSesion.plantillas) === JSON.stringify(fPlant.plantillas),
  '🚨 …ni la plantilla de la que salió: el snapshot es la sesión (F7)');
ok(CATALOGO_EJERCICIOS.find((e) => e.id === 'press-banca-barra') === ejercicioPorId('press-banca-barra'), '…ni el catálogo');
const hecha = { ...conCurl, estado: 'completada' };
ok(anadirEjercicioASesion(hecha, 'curl-barra') === hecha, 'Una sesión terminada es historial: no se le añade nada');
ok(anadirEjercicioASesion(enCurso, 'no-existe') === enCurso, 'Un ejercicio que no existe no entra');
const arch = crearEjercicioCompleto({ id: 'mi-archivado-f36', nombre: 'Curl viejo', archivado: true, musculos: [{ subgrupoId: 'biceps', porcentaje: 100, papel: 'principal' }], medidas: ['reps', 'peso'] });
ok(anadirEjercicioASesion(enCurso, 'mi-archivado-f36', [arch]) === enCurso, '…ni uno archivado (F35)');
ok(ejerciciosDeSesion(anadirEjercicioASesion({ ...enCurso, estado: 'pausada' }, 'curl-barra')).length === 2, '…y en pausa sí: sigue siendo la sesión de hoy');

const fActiva = guardarSesion({ ...DEFAULT_FITNESS }, enCurso);
ok(sesionParaAnadir(fActiva)?.id === enCurso.id && sesionParaAnadir(fActiva)?.id === sesionActiva(fActiva)?.id,
  'La ficha ofrece la sesión que dice el motor (`sesionActiva`), no una suya');
ok(sesionParaAnadir({ ...DEFAULT_FITNESS }) === null, '…y sin sesión en curso no ofrece nada (regla 8)');
const rA = anadirALaSesionEnCurso(fActiva, 'curl-barra');
ok(rA.ok && ejerciciosDeSesion(sesionActiva(rA.fitness)).some((e) => e.exerciseId === 'curl-barra'),
  '`anadirALaSesionEnCurso` guarda por `guardarSesion`, la puerta de siempre');
ok(rA.fitness.sesiones.length === 1, '…sustituyendo por id: no crea una segunda sesión');
ok(!anadirALaSesionEnCurso({ ...DEFAULT_FITNESS }, 'curl-barra').ok, '…y sin sesión, no hace nada');
ok(!anadirALaSesionEnCurso(fActiva, 'no-existe').ok, '…ni con un ejercicio que no existe');
const rec = recargar(rA.fitness);
ok(ejerciciosDeSesion(sesionActiva(rec)).some((e) => e.exerciseId === 'curl-barra' && e.series.every((x) => x.origen === 'anadida')),
  '…y lo añadido sobrevive a recargar, con su origen (apartados 42 y 43)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Un ejercicio archivado (apartado 41) ──');

const base = sesion('curl-barra', '2026-08-01', [{ reps: 10, peso: 30 }], { id: 'arch-1' });
const sArch = { ...base, origen: { ...base.origen, ejercicios: base.origen.ejercicios.map((e) => ({ ...e, exerciseId: 'mi-archivado-f36' })) } };
const base2 = sesion('curl-barra', '2026-08-08', [{ reps: 12, peso: 30 }], { id: 'arch-2' });
const sArch2 = { ...base2, origen: { ...base2.origen, ejercicios: base2.origen.ejercicios.map((e) => ({ ...e, exerciseId: 'mi-archivado-f36' })) } };
const objArch = crearObjetivo({ exerciseId: 'mi-archivado-f36', tipo: 'reps', valor: 15 });
const fArch = conSesiones([sArch, sArch2], { ejercicios: [arch], objetivos: [objArch] });
const propiosArch = [arch];
ok(!todosLosEjercicios(propiosArch).some((e) => e.id === 'mi-archivado-f36'), 'Desaparece de lo que se puede elegir');
ok(!buscarEjercicios('curl viejo', propiosArch).some((e) => e.id === 'mi-archivado-f36'), '…y de las búsquedas nuevas');
ok(sesionesDelHistorial(fArch).length === 2, 'Permanece en el historial');
ok(aparicionesDeEjercicio(fArch, 'mi-archivado-f36', propiosArch).length === 2, 'Mantiene su progreso: sus dos apariciones');
const rArch = rangoEfectivoDeEjercicio(fArch, 'mi-archivado-f36', { propios: propiosArch });
ok(!rArch.sinRango, 'Mantiene su rango');
const objLeido = listaDeObjetivos(fArch, { propios: propiosArch }).objetivos.find((p) => p.id === objArch.id);
ok(objLeido && objLeido.existe && objLeido.nombre === 'Curl viejo' && objLeido.actual === 12,
  `Mantiene sus objetivos, con su nombre y su mejor marca (${objLeido ? `${objLeido.nombre}: ${objLeido.actual}` : 'no está'})`);
/* 🐛 La F35 lo sacaba del reparto de su músculo mientras seguía en su rango. */
const contrib = contribucionesDeMusculo(fArch, { subgrupoId: 'biceps' }, { propios: propiosArch });
ok(contrib.conDatos.some((c) => c.exerciseId === 'mi-archivado-f36'),
  '🐛 …y sigue en el reparto de su músculo (F21): la F35 lo sacaba de ahí mientras seguía contando en el rango de bíceps');
const glob = rangoGlobalEfectivo(fArch, { propios: propiosArch });
const cl = clasificacionDeEjercicios(glob, propiosArch, fArch);
ok(cl.clasificados <= cl.total, `🐛 …y el «X de Y» de Rangos no puede decir más clasificados que ejercicios (${cl.clasificados} de ${cl.total})`);
const lectura = ejerciciosParaLeer(propiosArch, ['mi-archivado-f36']);
ok(lectura.some((e) => e.id === 'mi-archivado-f36') && lectura.length === todosLosEjercicios(propiosArch).length + 1,
  '`ejerciciosParaLeer`: lo elegible MÁS el archivado que tiene historia');
ok(ejerciciosParaLeer(propiosArch, []).length === todosLosEjercicios(propiosArch).length,
  '…un archivado sin nada registrado sigue fuera');
ok(ejerciciosParaLeer(propiosArch, ['curl-barra', 'curl-barra', 'no-existe']).length === todosLosEjercicios(propiosArch).length,
  '…sin duplicar lo que ya estaba ni inventar lo que no existe');
/* Y ninguna pantalla de LECTURA recorre el catálogo con la lista de lo elegible. */
['contribucionMuscular', 'pantallaRangos'].forEach((n) => {
  ok(!/todosLosEjercicios\(/.test(soloCodigo(leer(`src/lib/${n}.js`))), `…\`${n}.js\` ya no lee con la lista de lo elegible`);
});
ok(cabeceraArchivada(), 'Se sigue abriendo desde una sesión antigua, con su nombre');
function cabeceraArchivada() {
  const ej = ejercicioPorId('mi-archivado-f36', propiosArch);
  return !!ej && ej.nombre === 'Curl viejo' && ej.archivado === true;
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. Guardar recalcula, sin guardar nada derivado (apartados 7-10, 37, 44 y 51) ──');

const e1 = sesion('curl-barra', '2026-09-01', [{ reps: 8, peso: 25 }], { id: 'inv-1' });
const e2 = sesion('curl-barra', '2026-09-08', [{ reps: 10, peso: 30 }], { id: 'inv-2' });
const fUna = conSesiones([e1]);
const fDos = PUERTA_DE_GUARDADO(fUna, e2);
ok(PUERTA_DE_GUARDADO === guardarSesion, 'La puerta de guardado es `guardarSesion` (F7): no hay otra');
ok(fDos !== fUna && fDos.sesiones !== fUna.sesiones, 'Cada guardado crea un `fitness` y una lista nuevos: por eso las cachés por objeto se invalidan solas');
const p1 = progresoDeEjercicio(fUna, 'curl-barra');
const p2 = progresoDeEjercicio(fDos, 'curl-barra');
ok(JSON.stringify(p1) !== JSON.stringify(p2), 'WORKOUT_COMPLETED · el progreso cambia al guardar la sesión nueva');
ok(sesionesDelHistorial(fDos).length === 2 && sesionesDelHistorial(fUna).length === 1, '…el historial también');
const act1 = resumenDeActividad(fUna, { hoy: '2026-09-10' });
const act2 = resumenDeActividad(fDos, { hoy: '2026-09-10' });
ok(JSON.stringify(act1) !== JSON.stringify(act2), '…y la actividad');
const r1 = rangoEfectivoDeEjercicio(fUna, 'curl-barra');
const r2 = rangoEfectivoDeEjercicio(fDos, 'curl-barra');
ok(r2.dataPoints > r1.dataPoints, '…y el rango (con más datos detrás)');
/* Borrar: lo mismo al revés, y la foto se queda. */
const fBorrada = { ...fDos, sesiones: fDos.sesiones.filter((s) => s.id !== 'inv-2') };
ok(JSON.stringify(progresoDeEjercicio(fBorrada, 'curl-barra')) === JSON.stringify(p1),
  'WORKOUT_DELETED · borrar la sesión devuelve el progreso a lo de antes, sin limpiar nada');
const fotoTras = crearFotoProgreso({ path: 'u/1.jpg', fecha: '2026-09-08', createdFromWorkoutId: 'inv-2' });
ok(sesionDeFoto(fotoTras, fDos).existe && !sesionDeFoto(fotoTras, fBorrada).existe && sesionDeFoto(fotoTras, fBorrada).hay,
  '…y la foto de ese entrenamiento SE QUEDA: solo deja de enlazar (apartado 31)');
const guardado = recargar(fDos);
ok(Object.keys(guardado).every((k) => CAMPOS_GUARDADOS.includes(k)) && CAMPOS_GUARDADOS.every((k) => k in guardado),
  `Lo que se guarda de Fitness son ${CAMPOS_GUARDADOS.length} campos, y ninguno es una cifra derivada (apartado 51)`);
/* ⚠️ La puerta de carga CONSERVA las claves que no conoce (`...g`), y es a
   propósito: un campo que escriba una versión más nueva desde otro dispositivo
   no puede perderse en el siguiente guardado (regla 5). Así que la garantía no
   es que se borre un derivado: es que NADIE lo escribe, y que la auditoría lo
   cantaría. Se recorre un flujo entero y se mira lo que queda. */
ok('campoDelFuturo' in recargar({ ...fDos, campoDelFuturo: 1 }),
  '⚠️ La puerta de carga no tira lo que no conoce: un campo de una versión más nueva sobrevive (regla 5)');
let flujo = { ...DEFAULT_FITNESS };
flujo = guardarSesion(flujo, e1);
flujo = guardarSesion(flujo, e2);
flujo = { ...flujo, objetivos: [crearObjetivo({ exerciseId: 'curl-barra', tipo: 'reps', valor: 15 })] };
const conPlanFlujo = usarPlan(flujo, 'ppl-estetico', { confirmado: true, hoy: '2026-09-10' });
flujo = conPlanFlujo.fitness || conPlanFlujo;
flujo = (anadirALaSesionEnCurso(guardarSesion(flujo, empezarSesion({ nombre: 'x', lineas: [], hoy: HOY })), 'curl-barra').fitness) || flujo;
ok(DERIVADOS_PROHIBIDOS.every((k) => !(k in flujo)) && DERIVADOS_PROHIBIDOS.every((k) => !(k in recargar(flujo))),
  '🚨 Un flujo entero —dos entrenamientos, un objetivo, un plan, una sesión en curso— no deja ni un derivado guardado (apartados 36 y 51)');
ok(!auditarDatosFitness({ ...flujo, streak: 12 }).ok, '…y si alguno apareciera, la auditoría lo canta');
ok(DERIVADOS_PROHIBIDOS.every((k) => !CAMPOS_GUARDADOS.includes(k)), '…las dos listas no se pisan');
ok(EVENTOS_FITNESS.length === 6 && EVENTOS_FITNESS.every((e) => e.recalcula.every((c) => conceptos.includes(c))),
  'Los seis eventos del apartado 44 dicen qué recalculan, con conceptos que existen');
ok(EVENTOS_FITNESS.find((e) => e.id === 'WORKOUT_DELETED').noToca.includes('foto'), '…borrar un entrenamiento no toca las fotos');
ok(EVENTOS_FITNESS.find((e) => e.id === 'GOAL_UPDATED').noToca.includes('rango'), '…y un objetivo no mueve el rango (F30)');

/* Un plan que cambia no reescribe el historial (apartado 5 y PLAN_CHANGED). */
const conPlan = usarPlan(fDos, 'ppl-estetico', { confirmado: true, hoy: '2026-09-10' });
const fPlan = conPlan.fitness || conPlan;
const sinPlan = quitarPlanActivo(fPlan, { hoy: '2026-09-15' });
const fSinPlan = sinPlan.fitness || sinPlan;
ok(sesionesDelHistorial(fSinPlan).length === 2 && JSON.stringify(progresoDeEjercicio(fSinPlan, 'curl-barra')) === JSON.stringify(p2),
  'PLAN_CHANGED · quitar el plan no toca ni el historial ni el progreso: una sesión es independiente de su plan');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. Lo que toca una sesión (apartado 56) ──');

const af = afectadosPorSesion(e2);
ok(af.exerciseIds.length === 1 && af.exerciseIds[0] === 'curl-barra', 'Una sesión de curl toca el curl');
ok(af.subgrupos.includes('biceps'), '…el bíceps');
const gruposCurl = [...new Set(ejercicioPorId('curl-barra').musculos.map((m) => subgrupoMuscular(m.subgrupoId).grupoId))];
ok(JSON.stringify([...af.grupos].sort()) === JSON.stringify(gruposCurl.sort()) && af.grupos.includes(subgrupoMuscular('biceps').grupoId),
  `…sus grupos, los del catálogo (${af.grupos.join(', ')})`);
ok(!af.grupos.includes(subgrupoMuscular(ejercicioPorId('sentadilla-barra').musculos[0].subgrupoId).grupoId),
  '…y NO el de la sentadilla: el resto no se toca (apartado 56)');
ok(afectadosPorSesion(null).exerciseIds.length === 0, '…y una sesión que no existe no toca nada');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. La auditoría de los datos (apartados 5, 31, 41 y 55) ──');

const limpio = auditarDatosFitness(fDos, { fotos: [fotoTras] });
ok(limpio.ok, 'Un Fitness sano pasa las cuatro casillas');
ok(limpio.informa.fotosDeEntrenamientoBorrado.length === 0, '…sin fotos huérfanas mientras su sesión existe');
ok(auditarDatosFitness(fBorrada, { fotos: [fotoTras] }).informa.fotosDeEntrenamientoBorrado[0] === fotoTras.id,
  '…y con su sesión borrada la foto se INFORMA, no se corrige (lee `createdFromWorkoutId`, el campo de verdad)');
ok(auditarDatosFitness(fBorrada, { fotos: [fotoTras] }).ok, '…porque no es un error: la foto se queda a propósito');
const dosActivas = { ...DEFAULT_FITNESS, sesiones: [enCurso, { ...enCurso, id: 'otra' }] };
ok(!auditarDatosFitness(dosActivas).casillas.find((c) => c.id === 'una_sesion_activa').ok, 'Dos sesiones en curso a la vez → roja');
ok(!auditarDatosFitness({ ...fDos, sesiones: [e1, e1] }).casillas.find((c) => c.id === 'ids_unicos').ok, 'Un id repetido → roja');
ok(!auditarDatosFitness({ ...fDos, streak: 12 }).casillas.find((c) => c.id === 'sin_derivados_guardados').ok, 'Una racha guardada → roja');
ok(auditarDatosFitness(fArch, { propios: propiosArch }).informa.ejerciciosArchivados.includes('mi-archivado-f36'),
  'Un ejercicio archivado con historia se informa, no se toca');
ok(auditarDatosFitness(null).ok && auditarDatosFitness(undefined, {}).ok, 'Sin datos, la auditoría no revienta');
ok(!/saveData|guardar\w*\(/.test(soloCodigo(leer('src/lib/integracionFitness.js')).replace(/guardarSesion|guardarRutina|guardarEntrenamiento/g, '')),
  'La librería de integración no guarda nada');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 10. Los casos de borde del apartado 55 ──');

const seguro = (fn) => { try { fn(); return true; } catch (e) { console.log(`     (lanzó: ${e.message})`); return false; } };
const lecturas = (f, id = 'curl-barra', propios = []) => {
  sesionesDelHistorial(f);
  progresoDeEjercicio(f, id, { propios });
  rangoEfectivoDeEjercicio(f, id, { propios });
  rangoGlobalEfectivo(f, { propios });
  resumenDeActividad(f, { hoy: '2026-09-20' });
  listaDeObjetivos(f, { propios });
  contribucionesDeMusculo(f, { subgrupoId: 'biceps' }, { propios });
  auditarDatosFitness(f, { propios });
};
/* Sesión vacía y sesión parcial. */
const vacia = { ...crearWorkoutSession({ nombre: 'Vacía', fecha: '2026-09-02', estado: 'completada' }), id: 'vacia', origen: { tipo: 'plantilla', id: null, ejercicios: [] } };
const fVacia = conSesiones([vacia, e1]);
ok(seguro(() => lecturas(fVacia)) && sesionesDelHistorial(fVacia).length === 2, 'Sesión VACÍA: sale en el historial y ninguna pantalla revienta');
ok(JSON.stringify(progresoDeEjercicio(fVacia, 'curl-barra')) === JSON.stringify(p1), '…y no cambia el progreso de nadie');
const parcialBase = sesion('curl-barra', '2026-09-03', [{ reps: 8, peso: 25 }, { reps: 8, peso: 25 }], { id: 'parcial' });
const parcial = { ...parcialBase, origen: { ...parcialBase.origen, ejercicios: parcialBase.origen.ejercicios.map((e) => ({ ...e, series: e.series.map((x, i) => (i === 1 ? { ...x, estado: 'pendiente', hecho: { reps: null, peso: null, duracion: null } } : x)) })) } };
ok(seguro(() => lecturas(conSesiones([parcial]))) && aparicionesDeEjercicio(conSesiones([parcial]), 'curl-barra').length === 1,
  'Sesión PARCIAL: cuenta lo que marcó, sin inventarse la serie que no hizo');
/* Un ejercicio que ya no está en el catálogo, y uno archivado. */
const huerfana = { ...e1, id: 'huerfana', origen: { ...e1.origen, ejercicios: e1.origen.ejercicios.map((e) => ({ ...e, exerciseId: 'ya-no-existe' })) } };
const fHuerfana = conSesiones([huerfana]);
ok(seguro(() => lecturas(fHuerfana, 'ya-no-existe')) && sesionesDelHistorial(fHuerfana).length === 1,
  'Ejercicio ELIMINADO del catálogo: su sesión sigue en el historial y nada revienta (C-36)');
ok(auditarDatosFitness(fHuerfana).informa.ejerciciosArchivados.includes('ya-no-existe'), '…y la auditoría lo cuenta como archivado, sin tocarlo');
ok(seguro(() => lecturas(fArch, 'mi-archivado-f36', propiosArch)), 'Ejercicio ARCHIVADO: todas las lecturas aguantan');
/* Un plan y una plantilla que ya no existen. */
const dePlanBorrado = { ...e1, id: 'plan-borrado', planId: 'plan-que-no-existe', origen: { ...e1.origen, tipo: 'plantilla', id: 'plantilla-borrada' } };
const fPB = conSesiones([dePlanBorrado]);
ok(seguro(() => lecturas(fPB)) && sesionesDelHistorial(fPB).length === 1 && aparicionesDeEjercicio(fPB, 'curl-barra').length === 1,
  'PLAN y PLANTILLA eliminados: la sesión sigue siendo historia, con su progreso (apartado 5)');
/* Un objetivo borrado no mueve el rango. */
const conObj = { ...fDos, objetivos: [crearObjetivo({ exerciseId: 'curl-barra', tipo: 'reps', valor: 20 })] };
ok(rangoEfectivoDeEjercicio({ ...conObj, objetivos: [] }, 'curl-barra').score === rangoEfectivoDeEjercicio(conObj, 'curl-barra').score,
  'OBJETIVO eliminado: el rango no se entera (F30)');
/* Una clasificación antigua pierde contra tres entrenamientos (F19). */
const e3 = sesion('curl-barra', '2026-09-12', [{ reps: 10, peso: 32.5 }], { id: 'inv-3' });
const fTres = conSesiones([e1, e2, e3], { clasificaciones: [{ id: 'cl-vieja', exerciseId: 'curl-barra', respuesta: 'x', puntuacion: 990, rango: 10, fuente: 'cuestionario', confianza: 'baja', creadoEn: 1, actualizadoEn: null }] });
const rTres = rangoEfectivoDeEjercicio(recargar(fTres), 'curl-barra');
ok(rTres.fuente === 'entrenamiento' && rTres.score < 990,
  `CLASIFICACIÓN antigua: con tres entrenamientos manda la realidad (${rTres.fuente}, ${rTres.score})`);
/* Datos corruptos. */
const corrupto = { sesiones: 'no es una lista', objetivos: null, clasificaciones: [null, 7, { exerciseId: '' }], planActivo: 'x', ejercicios: [{}] };
ok(seguro(() => lecturas(recargar(corrupto))) && seguro(() => lecturas(corrupto)),
  'Datos CORRUPTOS: ni la puerta de carga ni las lecturas revientan');
ok(seguro(() => recargar({ sesiones: [{ estado: 'completada' }, null, { id: 'x', origen: 'raro' }] })),
  '…ni con sesiones sin id o con un snapshot que no es un objeto');
/* Doble guardado. */
const dos = PUERTA_DE_GUARDADO(PUERTA_DE_GUARDADO(fUna, e2), e2);
ok(dos.sesiones.length === 2 && sesionesDelHistorial(dos).length === 2, 'DOBLE guardado de la misma sesión: sigue habiendo una (F8, apartado 17)');
/* Recarga durante la sesión. */
ok(sesionActiva(recargar(fActiva))?.id === enCurso.id, 'RECARGA durante la sesión: la sesión en curso sigue ahí (F7)');
/* Apartado 56 — durante el entrenamiento no se recalcula Fitness entero. */
const vivo = soloCodigo(leer('src/views/EntrenamientoVivoView.jsx'));
ok(!/rangoGlobalEfectivo\(|progresoDeGrupo\(|resumenDeActividad\(|centroDeProgreso\(|contribucionesDeMusculo\(/.test(vivo),
  'Apartado 56 · la pantalla del entrenamiento en vivo no recalcula rangos, músculos ni actividad: solo el ejercicio que tiene delante');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 11. Lo que no se construye, y por qué ──');

ok(NO_EN_FIT36.length >= 4 && NO_EN_FIT36.every((x) => x.que && x.porque), 'Lo que no se hace va declarado con su motivo');
ok(NO_EN_FIT36.some((x) => /bus de eventos/i.test(x.que)), '…el bus de eventos (apartado 44)');
ok(NO_EN_FIT36.some((x) => /URL/.test(x.que)), '…los enlaces por URL (apartado 49)');
ok(NO_EN_FIT36.some((x) => /Editar una sesión/i.test(x.que)), '…editar una sesión histórica (apartado 38)');
ok(NO_EN_FIT36.some((x) => /persistencia/i.test(x.que) && /saveData/.test(x.porque)),
  '…y avisar de una pérdida de persistencia: lo que falta se dice, con dónde está (apartado 55)');
ok(DECISIONES_FIT36.length >= 3 && DECISIONES_FIT36.every((x) => x.que && x.porque), 'Las decisiones de la fase, con su motivo');
/* Ni un nombre de apartado ni de fase en lo que ve Josué (regla 9). */
const sinComentarios = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const vistasTocadas = ['src/components/areaSegura.jsx', 'src/components/bibliotecaEjercicios.jsx'];
ok(vistasTocadas.every((p) => !/\b(Fase|FIT F|apartado) ?\d/i.test(sinComentarios(leer(p)))),
  'Ni un «Fase 36» ni un «apartado 17» en lo que se pinta (regla 9)');
ok(/\b(Fase|FIT F|apartado) ?\d/i.test(sinComentarios('<p>Apartado 17</p>')), '…y el barrido sí caza uno de verdad');

console.log(`\n${fallos === 0 ? '\x1b[32m' : '\x1b[31m'}FIT F36: ${total - fallos}/${total} — ${total} comprobaciones\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);
