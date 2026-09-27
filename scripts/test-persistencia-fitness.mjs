/* Entrega 4 · FIT F41/45 — Persistencia, recuperación y resiliencia de Fitness.
   ═══════════════════════════════════════════════════════════════════════════
   *"Que el usuario pueda cerrar, recargar, volver a abrir o experimentar un
   fallo sin perder información válida."* Lo que se mide en Node: dónde vive
   cada cosa; la versión de la F1 y las migraciones (apartado 57, con
   migraciones de ensayo: hoy no hay ninguna que correr); la cuarentena —lo que
   la puerta de carga no entiende se aparta con su original en vez de perderse
   en el siguiente guardado—; los fallos de guardado (sin espacio, sin conexión)
   y el borrador que no se puede escribir; Fitness en la exportación global; la
   foto que ya no cambia de id ni de fecha en cada carga; duplicados (56) y
   datos corruptos (58). Recargar, cerrar e interrumpir de verdad, en Chromium. */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FUENTES_PERSISTENCIA, VERSION_FITNESS, PRIMERA_VERSION, MIGRACIONES_FITNESS, versionDeFitness, migrarFitness,
  LISTAS_EN_CUARENTENA, MOTIVOS_CUARENTENA, normalizarCuarentena, apartarLoQueNoCarga,
  SIN_ESPACIO, motivoDeFallo, avisoDeFallo, filasDeFitnessParaExportar,
  YA_EXISTIA_F41, HECHO_F41, NO_EN_FIT41, DECISIONES_FIT41,
} from '../src/lib/persistenciaFitness.js';
import { DEFAULT_FITNESS, normalizarFitness } from '../src/lib/fitness.js';
import { crearRutina, anadirEjercicio, editarLinea, guardarRutina, CLAVE_BORRADOR, guardarBorrador, leerBorrador, borradorVacio, BORRADOR_NO_SE_GUARDA, SALIR_SIN_BORRADOR } from '../src/lib/constructor.js';
import {
  empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie, normalizarFitnessConSesiones, guardarSesion, avisoDeRecuperacion,
} from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento, resumenDeSesion } from '../src/lib/finalizacion.js';
import { sesionesDelHistorial } from '../src/lib/historial.js';
import { consultarBiblioteca } from '../src/lib/bibliotecaEjercicios.js';
import { resumenDeRangos } from '../src/lib/resumenRangos.js';
import { centroDeProgreso } from '../src/lib/resumenProgreso.js';
import { resumenDeActividad } from '../src/lib/actividadEntrenamiento.js';
import { listaDeObjetivos } from '../src/lib/objetivosProgreso.js';
import { historialDeRango } from '../src/lib/historialRangos.js';
import { CAMPOS_GUARDADOS, DERIVADOS_PROHIBIDOS, auditarDatosFitness } from '../src/lib/integracionFitness.js';
import { AVISOS_ACCION } from '../src/lib/accionesHoyAgenda.js';
import { TEXTOS_GUARDADO, AVISOS_FITNESS } from '../src/lib/feedbackFitness.js';
import { normalizarFotoProgreso, normalizarFotosProgreso } from '../src/lib/fotosProgreso.js';
import { escenarioGrande } from '../src/lib/rendimientoFitness.js';
import { buildExportRows } from '../src/lib/exportData.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const HOY = '2026-09-17';

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const copia = (x) => JSON.parse(JSON.stringify(x));
/* Quita comentarios y cadenas: un barrido que mira la tabla que declara lo que
   busca salta con el código bien (FIT F25, F28, F30). */
const codigo = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1')
  .replace(/'(?:[^'\\\n]|\\.)*'/g, "''").replace(/`(?:[^`\\]|\\.)*`/g, '``');

/* Sesiones de verdad: constructor (F3) → en vivo (F7) → guardado (F8). */
function sesion(exerciseId, fecha, valores, { id = null } = {}) {
  let r = anadirEjercicio(crearRutina({ nombre: exerciseId }), exerciseId);
  if (!r.lineas.length) throw new Error(`El escenario pide «${exerciseId}», que no está en el catálogo`);
  r = editarLinea(r, r.lineas[0].id, { series: valores.length });
  const inicio = new Date(`${fecha}T18:00:00`).getTime();
  let s = empezarSesion({ nombre: exerciseId, lineas: r.lineas, hoy: fecha, ahora: inicio });
  const e = ejerciciosDeSesion(s)[0];
  valores.forEach((v, i) => {
    s = editarSerie(s, e.id, e.series[i].id, v);
    s = marcarSerie(s, e.id, e.series[i].id, true);
  });
  const hecha = guardarEntrenamiento(pasarAFinalizacion(s, { ahora: inicio + 3600000 }), { confirmado: true, ahora: inicio + 3601000 }).sesion;
  return id ? { ...hecha, id } : hecha;
}
/* Lo que hace App.jsx al cargar, en el mismo orden. */
function cargarComoApp(crudo, opciones = {}) {
  const m = migrarFitness(crudo, opciones);
  const n = normalizarFitnessConSesiones(m.fitness);
  return { migracion: m, ...apartarLoQueNoCarga(m.fitness, n, { ahora: new Date(`${HOY}T12:00:00`).getTime() }) };
}

console.log('\n═══ FIT F41/45 · Persistencia, recuperación y resiliencia ═══');

/* ═══ 1 · Dónde vive cada cosa (apartado 1) ═════════════════════════════════ */
console.log('\n── 1 · Una fuente por entidad (apartado 1) ──');
ok(FUENTES_PERSISTENCIA.length === 12 && new Set(FUENTES_PERSISTENCIA.map((f) => f.entidad)).size === 12,
  'Doce entidades, cada una una vez: *"No debe existir una segunda copia desconocida de cada dato"*');
ok(FUENTES_PERSISTENCIA.every((f) => f.clave === null || f.clave in DEFAULT_FITNESS),
  '…y cada clave que nombra existe de verdad en `DEFAULT_FITNESS`');
ok(FUENTES_PERSISTENCIA.every((f) => f.donde && f.recupera),
  '…con dónde se guarda y cómo se recupera');
ok(/no se guarda/.test(FUENTES_PERSISTENCIA.find((f) => f.entidad === 'RankHistory').donde),
  'El historial de rangos no se guarda: se deriva (F22), así que no puede duplicar al recargar (apartado 24)');
ok(/camino|URL/.test(FUENTES_PERSISTENCIA.find((f) => f.entidad === 'ProgressPhoto').recupera),
  'Una foto se guarda como camino, nunca una URL (apartado 21)');

/* ═══ 2 · La versión y las migraciones (apartados 26, 27, 28 y 57) ══════════ */
console.log('\n── 2 · La versión de la F1 y las migraciones (apartados 26-28 y 57) ──');
ok(VERSION_FITNESS === DEFAULT_FITNESS.version && VERSION_FITNESS === 1,
  '🐛 La versión YA existía: `version: 1` en `DEFAULT_FITNESS` desde la F1. Es un solo número, no uno nuevo');
ok(/export const VERSION_FITNESS = DEFAULT_FITNESS\.version/.test(leer('src/lib/persistenciaFitness.js')),
  '…y la librería lo importa, no lo repite');
ok(MIGRACIONES_FITNESS.length === 0,
  'Hoy no hay ninguna migración que correr: de la F2 a la F40 todo cambio fue una suma que absorbe la puerta de carga');
ok(MIGRACIONES_FITNESS.every((m, i, l) => m.a === m.de + 1 && (i === 0 ? m.de === PRIMERA_VERSION : m.de === l[i - 1].a))
  && (MIGRACIONES_FITNESS.length === 0 ? VERSION_FITNESS === PRIMERA_VERSION : MIGRACIONES_FITNESS[MIGRACIONES_FITNESS.length - 1].a === VERSION_FITNESS),
  '…y la cadena cuadra con la versión: subir una sin su migración pone esto rojo');
ok(versionDeFitness(undefined) === 1 && versionDeFitness({}) === 1 && versionDeFitness({ version: 'x' }) === 1
  && versionDeFitness({ version: 0 }) === 1 && versionDeFitness({ version: 3 }) === 3,
  'Sin versión (o con una que no es un entero) es la primera: la F1 la escribió desde el primer guardado');
ok(!/export function versionDe\(/.test(leer('src/lib/persistenciaFitness.js')) && /export function versionDe\(/.test(leer('src/lib/migracion.js')),
  '⚠️ Y se llama `versionDeFitness`: `versionDe` ya es de la EH F46 (un nombre, una responsabilidad)');

const s1 = sesion('curl-barra', '2026-09-01', [{ reps: 10, peso: 30 }, { reps: 8, peso: 30 }], { id: 'mig-1' });
const s2 = sesion('dominada-prona', '2026-09-03', [{ reps: 6 }], { id: 'mig-2' });
const crudoV1 = copia({
  ...DEFAULT_FITNESS,
  sesiones: [s1, s2],
  objetivos: [{ id: 'mig-o1', exerciseId: 'curl-barra', tipo: 'reps', valor: 15, unidad: 'reps', creadoEn: Date.parse('2026-08-01'), estado: 'activo' }],
});
const intacto = copia(crudoV1);
{
  const r = migrarFitness(crudoV1);
  ok(r.fitness === crudoV1 && !r.migrada && !r.error,
    'Con la versión al día no se copia ni se toca nada: devuelve lo mismo');
}
/* Migraciones de ENSAYO (apartado 57: "crear datos de versiones anteriores"). */
const ENSAYO = [
  { de: 1, a: 2, que: 'renombra nota → notas', migrar: (f) => ({ ...f, sesiones: f.sesiones.map((s) => { const { nota, ...resto } = s; return { ...resto, notas: nota ?? s.notas ?? '' }; }) }) },
  { de: 2, a: 3, que: 'añade un campo', migrar: (f) => ({ ...f, marcaDeEnsayo: true }) },
];
{
  const r = migrarFitness(crudoV1, { migraciones: ENSAYO, hasta: 3 });
  ok(r.migrada && r.desde === 1 && r.hasta === 3 && r.fitness.version === 3 && r.fitness.marcaDeEnsayo === true && !r.error,
    'Apartado 57 — con dos migraciones de ensayo, lo de la versión 1 llega a la 3 paso a paso');
  ok(igual(crudoV1, intacto), '🚨 …sin tocar lo que había: trabaja sobre una copia (apartado 28)');
  ok(igual(r.fitness.sesiones.map((s) => s.id), ['mig-1', 'mig-2']) && igual(r.fitness.objetivos.map((o) => o.id), ['mig-o1']),
    '…con los ids intactos');
  const cargado = normalizarFitnessConSesiones(r.fitness);
  ok(sesionesDelHistorial(cargado).length === 2 && cargado.objetivos.length === 1,
    '…con una estructura que la puerta de carga entiende entera');
  const antes = sesionesDelHistorial(normalizarFitnessConSesiones(crudoV1)).map((s) => resumenDeSesion(s).seriesCompletadas);
  const despues = sesionesDelHistorial(cargado).map((s) => resumenDeSesion(s).seriesCompletadas);
  ok(igual(antes, despues) && igual(antes, [2, 1]), '…y con los mismos resultados: las mismas series hechas en cada sesión');
  ok(cargado.version === 3, '…y la puerta de carga conserva la versión nueva (no la baja al default)');
}
{
  const rota = [{ de: 1, a: 2, migrar: () => { throw new Error('ensayo roto'); } }];
  const r = migrarFitness(crudoV1, { migraciones: rota, hasta: 2 });
  ok(r.fitness === crudoV1 && !r.migrada && /ensayo roto/.test(r.error) && igual(crudoV1, intacto),
    '🚨 Una migración que falla devuelve LO QUE HABÍA, entero, y dice por qué: nunca a medias (apartado 28)');
  const pierde = [{ de: 1, a: 2, migrar: (f) => ({ ...f, sesiones: f.sesiones.slice(1) }) }];
  const r2 = migrarFitness(crudoV1, { migraciones: pierde, hasta: 2 });
  ok(r2.fitness === crudoV1 && /ids/.test(r2.error), '🚨 Una que pierde un id no se aplica («IDs intactos», apartado 57)');
  const cambia = [{ de: 1, a: 2, migrar: (f) => ({ ...f, objetivos: f.objetivos.map((o) => ({ ...o, id: `${o.id}-x` })) }) }];
  ok(/ids/.test(migrarFitness(crudoV1, { migraciones: cambia, hasta: 2 }).error), '…ni una que cambia uno');
  ok(/no devolvió/.test(migrarFitness(crudoV1, { migraciones: [{ de: 1, a: 2, migrar: () => null }], hasta: 2 }).error),
    '…ni una que no devuelve un Fitness');
  ok(/Falta la migración/.test(migrarFitness(crudoV1, { migraciones: [], hasta: 2 }).error),
    '…y sin camino desde una versión, no se adivina: se deja como estaba');
}
{
  const futuro = { ...copia(crudoV1), version: 5, campoNuevo: { algo: 1 } };
  const r = migrarFitness(futuro);
  ok(r.fitness === futuro && r.futura && !r.migrada && !r.error,
    'Una versión MAYOR (otro dispositivo más nuevo) no se migra hacia atrás: se deja como está');
  const cargado = normalizarFitnessConSesiones(r.fitness);
  ok(cargado.version === 5 && igual(cargado.campoNuevo, { algo: 1 }),
    '…y la puerta de carga conserva su versión y lo que no conoce: el siguiente guardado no lo pierde (regla 5)');
}
{
  const app = leer('src/App.jsx');
  ok(/const migracionFit = migrarFitness\(fit\);[\s\S]{0,200}const cargaFit = apartarLoQueNoCarga\(migracionFit\.fitness, normalizarFitnessConSesiones\(migracionFit\.fitness\)\);[\s\S]{0,300}setFitness\(cargaFit\.fitness\);/.test(app),
    '🚨 App.jsx migra lo CRUDO, luego normaliza y luego aparta: después de normalizar ya no se sabría qué había (EH F46)');
}

/* ═══ 3 · La cuarentena (apartados 28, 32, 35 y 36) ═════════════════════════ */
console.log('\n── 3 · Lo que no carga se aparta, no se tira (apartados 28, 32, 35 y 36) ──');
ok(igual(LISTAS_EN_CUARENTENA, ['sesiones', 'objetivos', 'clasificaciones', 'plantillas', 'ejercicios']),
  'Las cinco listas con `id`: un tramo de `planesAnteriores` no lo lleva (es sus fechas), y con él dentro se habrían apartado TODOS');
ok(MOTIVOS_CUARENTENA.map((m) => m.id).join() === 'sin_id,no_se_entiende,repetido' && MOTIVOS_CUARENTENA.every((m) => m.texto),
  'Tres motivos, cada uno con su frase');
const valida = sesion('press-banca-barra', '2026-09-05', [{ reps: 8, peso: 60 }], { id: 'q-buena' });
const repetidaVieja = { ...copia(valida), nombre: 'La copia vieja' };
const plantillaBuena = guardarRutina([], anadirEjercicio(crearRutina({ nombre: 'Push' }), 'press-banca-barra'), []).plan;
const crudoRoto = copia({
  ...DEFAULT_FITNESS,
  sesiones: [repetidaVieja, valida, { nombre: 'Sin id', fecha: '2026-09-02', estado: 'completada' }, copia(s1), copia(s1)],
  objetivos: [{ id: 'q-o-sin-ejercicio', tipo: 'reps', valor: 10 }, { id: 'q-o-bueno', exerciseId: 'curl-barra', tipo: 'reps', valor: 12, creadoEn: Date.parse('2026-08-01'), estado: 'activo' }],
  clasificaciones: [
    { id: 'q-c1', exerciseId: 'curl-barra', respuesta: 'a', puntuacion: 300, fuente: 'cuestionario', confianza: 'baja', creadoEn: Date.parse('2026-08-01') },
    { id: 'q-c2', exerciseId: 'curl-barra', respuesta: 'b', puntuacion: 420, fuente: 'cuestionario', confianza: 'baja', creadoEn: Date.parse('2026-08-02') },
  ],
  plantillas: [plantillaBuena, { nombre: 'Plantilla sin id', lineas: [] }],
  planesAnteriores: [{ planId: 'ppl-estetico', desde: '2026-08-01', hasta: '2026-08-20', dias: [{ id: 'ppl-estetico-dia-1', nombre: 'Push', descanso: false }] }],
});
const crudoRotoAntes = copia(crudoRoto);
const sinCuarentena = normalizarFitnessConSesiones(crudoRoto);
ok(!sinCuarentena.sesiones.some((s) => s.nombre === 'La copia vieja') && !sinCuarentena.objetivos.some((o) => o.id === 'q-o-sin-ejercicio'),
  '🐛 El hueco es real: la puerta de carga los deja fuera, y el siguiente guardado los borraba de la cuenta');
const carga = cargarComoApp(crudoRoto);
const porMotivo = (de, motivo) => carga.nuevos.filter((x) => x.de === de && x.motivo === motivo);
ok(porMotivo('sesiones', 'sin_id').length === 1 && porMotivo('sesiones', 'sin_id')[0].original.nombre === 'Sin id',
  'Una sesión sin id se aparta como «sin_id»');
ok(porMotivo('sesiones', 'repetido').length === 1 && igual(porMotivo('sesiones', 'repetido')[0].original, repetidaVieja),
  '🚨 Dos copias con el mismo id y DISTINTO contenido: se queda la última y la otra se aparta ENTERA (apartado 32: no sobrescribir en silencio)');
ok(!carga.nuevos.some((x) => x.original.id === s1.id),
  '…y dos copias IDÉNTICAS no son un conflicto: sobra una y no se aparta nada');
ok(porMotivo('objetivos', 'no_se_entiende').length === 1 && porMotivo('objetivos', 'no_se_entiende')[0].original.id === 'q-o-sin-ejercicio',
  'Un objetivo sin ejercicio se aparta como «no_se_entiende»');
ok(porMotivo('clasificaciones', 'repetido').length === 1 && porMotivo('clasificaciones', 'repetido')[0].original.id === 'q-c1',
  'Dos clasificaciones del mismo ejercicio: la F17 se queda la última y la otra se aparta como «repetido», no como rota');
ok(porMotivo('plantillas', 'sin_id').length === 1, 'Una plantilla sin id se aparta');
ok(carga.nuevos.length === 5, `…y nada más: 5 apartados (${carga.nuevos.length})`);
ok(carga.fitness.planesAnteriores.length === 1 && !carga.nuevos.some((x) => x.de === 'planesAnteriores'),
  '🐛 …y el tramo de un plan anterior, que no lleva id, NO se aparta: se queda donde está');
ok(igual(crudoRoto, crudoRotoAntes), 'Apartar no toca lo que llegó');
ok(igual(carga.fitness.sesiones.map((s) => s.id).sort(), ['mig-1', 'q-buena']) && carga.fitness.sesiones.find((s) => s.id === 'q-buena').nombre !== 'La copia vieja',
  'Lo bueno pasa entero: dos sesiones, y de la repetida la última');
ok(carga.fitness.cuarentena.length === 5 && carga.fitness.cuarentena.every((x) => x.desde === HOY),
  '…y la cuarentena lleva el día en que se apartó cada cosa');
/* Apartado 35 — una entidad corrupta no impide abrir lo demás. */
{
  let vivo = true;
  try {
    consultarBiblioteca({ texto: 'press' });
    sesionesDelHistorial(carga.fitness);
    resumenDeRangos(carga.fitness, {});
    centroDeProgreso(carga.fitness, [], { hoy: HOY });
    resumenDeActividad(carga.fitness, { hoy: HOY });
    listaDeObjetivos(carga.fitness);
  } catch (e) { vivo = false; console.log(e); }
  ok(vivo, '🚨 Apartado 35 — con todo eso roto, la biblioteca, el historial, los rangos, el progreso, la actividad y los objetivos se abren');
}
/* Idempotencia: la segunda carga no aparta otra vez. */
{
  const guardado = copia(carga.fitness);
  const segunda = cargarComoApp(guardado);
  ok(segunda.nuevos.length === 0 && segunda.fitness.cuarentena.length === 5,
    'Recargar lo guardado no aparta nada nuevo: la cuarentena sigue con sus 5 (apartado 51)');
  const sinGuardar = cargarComoApp({ ...copia(crudoRoto), cuarentena: carga.fitness.cuarentena });
  ok(sinGuardar.nuevos.length === 0 && sinGuardar.fitness.cuarentena.length === 5,
    '…y recargar ANTES de guardar tampoco la duplica: se reconoce cada original por su firma');
  ok(igual(normalizarFitnessConSesiones(guardado).cuarentena, carga.fitness.cuarentena),
    '🚨 La puerta de carga CONOCE `cuarentena` (regla 5): lo apartado no se pierde en el siguiente guardado');
  ok(normalizarFitness({}).cuarentena.length === 0 && Array.isArray(DEFAULT_FITNESS.cuarentena) && DEFAULT_FITNESS.cuarentena.length === 0,
    '…nace vacía, en el modelo');
}
ok(normalizarCuarentena([null, 3, { de: 'otra', original: {} }, { de: 'sesiones' }, { de: 'sesiones', original: [] }, { de: 'sesiones', original: { a: 1 }, motivo: 'raro' }]).length === 1
  && normalizarCuarentena([{ de: 'sesiones', original: { a: 1 }, motivo: 'raro' }])[0].motivo === 'no_se_entiende',
  'Su normalizador tira lo que no es un apartado y deja un motivo desconocido como «no_se_entiende»');
ok(CAMPOS_GUARDADOS.includes('cuarentena') && !DERIVADOS_PROHIBIDOS.includes('cuarentena'),
  'Es un campo guardado de la F36, no una cifra derivada');
ok(auditarDatosFitness(carga.fitness).ok, '…y la auditoría de datos de la F36 sigue en verde con ella');
{
  const vistas = ['src/views/FitnessView.jsx', 'src/views/HistorialView.jsx', 'src/views/ProgresoView.jsx', 'src/views/RangosView.jsx', 'src/views/TuPlanView.jsx', 'src/views/EjerciciosView.jsx'];
  ok(vistas.every((v) => { try { return !/cuarentena/.test(codigo(leer(v))); } catch { return true; } }),
    '🚨 No se pinta en ninguna parte: *"No crear una pantalla técnica para usuarios normales"* (apartado 36)');
  ok(/console\.warn\(`\[Fitness\] \$\{cargaFit\.nuevos\.length\}/.test(leer('src/App.jsx')) && /import\.meta\.env\?\.DEV/.test(leer('src/App.jsx')),
    '…y se avisa en desarrollo, como aviso y no como error (el recorrido cuenta los errores)');
}

/* ═══ 4 · Cuando un guardado no llega (apartados 33 y 34) ════════════════════ */
console.log('\n── 4 · Sin espacio, sin conexión y el borrador (apartados 33 y 34) ──');
ok(SIN_ESPACIO === 'Hay poco espacio disponible para guardar estos datos.' && SIN_ESPACIO === AVISOS_ACCION.guardado_sin_espacio.texto
  && TEXTOS_GUARDADO.sinEspacio === SIN_ESPACIO,
  'Apartado 34, literal, escrito UNA vez (el catálogo del aviso) y leído por la librería y la pantalla de éxito');
ok(AVISOS_ACCION.guardado_sin_espacio.error === true && AVISOS_ACCION.guardado_sin_espacio.deshacer === false,
  '…como aviso de error, con su icono y su color (F37)');
ok(AVISOS_FITNESS.some((a) => a.id === 'guardado_sin_espacio'), '…y declarado entre los avisos de Fitness');
ok(motivoDeFallo({ name: 'QuotaExceededError', message: 'The quota has been exceeded.' }) === 'sin_espacio'
  && motivoDeFallo({ code: '54000', message: 'row is too big' }) === 'sin_espacio'
  && motivoDeFallo({ status: 413 }) === 'sin_espacio'
  && motivoDeFallo({ message: 'Payload Too Large' }) === 'sin_espacio'
  && motivoDeFallo({ code: 22 }) === 'sin_espacio',
  'Se reconoce la falta de espacio: la cuota del navegador y el «demasiado grande» del servidor');
ok(motivoDeFallo(new TypeError('Failed to fetch')) === 'sin_conexion' && motivoDeFallo({ message: 'Load failed' }) === 'sin_conexion'
  && motivoDeFallo({ message: 'permission denied' }) === 'otro' && motivoDeFallo(null) === null,
  '…y no se confunde con quedarse sin conexión ni con otro fallo');
ok(avisoDeFallo({ name: 'QuotaExceededError' }) === 'guardado_sin_espacio' && avisoDeFallo(new Error('Failed to fetch')) === 'guardado_fallido'
  && avisoDeFallo(undefined) === 'guardado_fallido',
  '🚨 Y SIEMPRE hay aviso de error: sin saber por qué, es el de la F37 (apartado 33: *"No mostrar éxito falso"*)');
{
  const fv = leer('src/views/FitnessView.jsx');
  ok((fv.match(/setAviso\(avisoDeFallo\(/g) || []).length === 3 && !/setAviso\('guardado_fallido'\)/.test(fv),
    'FitnessView elige el aviso en las TRES salidas de error (lanza, devuelve un fallo, rechaza)');
  const fin = leer('src/views/FinalizacionView.jsx');
  ok(/fallo === 'sin_espacio' && \([\s\S]{0,200}TEXTOS_GUARDADO\.sinEspacio/.test(fin),
    '…y la pantalla de éxito dice «poco espacio» junto a su «Reintentar», con el entrenamiento todavía en pantalla');
  const lib = codigo(leer('src/lib/persistenciaFitness.js'));
  ok(!/saveData|supabase|localStorage|setItem|removeItem|\.from\(/.test(lib),
    '🚨 Y nada se borra para hacer sitio: la librería no escribe ni borra nada (apartado 34), ni hay backend nuevo');
  ok(/saveData\(/.test(codigo("const x = 'a'; saveData(u, 'fitness', f);")), '…y el barrido sigue cazando una escritura de verdad');
}
/* El borrador del constructor (apartados 33, 38 y 39). */
{
  const almacen = new Map();
  let llena = false;
  globalThis.window = {
    localStorage: {
      getItem: (k) => (almacen.has(k) ? almacen.get(k) : null),
      setItem: (k, v) => { if (llena) { const e = new Error('The quota has been exceeded.'); e.name = 'QuotaExceededError'; throw e; } almacen.set(k, String(v)); },
      removeItem: (k) => almacen.delete(k),
    },
  };
  const conEjercicio = anadirEjercicio(crearRutina({ nombre: 'Pierna' }), 'sentadilla-barra');
  ok(guardarBorrador(conEjercicio) === true && leerBorrador()?.lineas.length === 1, 'Con sitio, el borrador se guarda y se lee');
  llena = true;
  ok(guardarBorrador(conEjercicio) === false, '🐛 Sin sitio (o en una ventana privada) `guardarBorrador` devuelve `false`…');
  const cv = leer('src/views/ConstructorView.jsx');
  ok(/setSinBorrador\(!guardarBorrador\(rutina\)\)/.test(cv) && /\{sinBorrador && !guardado && \(/.test(cv),
    '…y el constructor por fin LO LEE y lo dice');
  ok(/\{sinBorrador \? SALIR_SIN_BORRADOR : 'Lo que llevas escrito se queda como borrador en este dispositivo\.'\}/.test(cv),
    '🐛 …y el aviso de salir ya no promete «se queda como borrador» cuando no se ha quedado');
  ok(BORRADOR_NO_SE_GUARDA && SALIR_SIN_BORRADOR && !/error/i.test(BORRADOR_NO_SE_GUARDA + SALIR_SIN_BORRADOR),
    '…con frases que dicen qué hacer, no «Error» a secas (EH F62)');
  llena = false;
  almacen.set(CLAVE_BORRADOR, JSON.stringify(crearRutina({})));
  ok(leerBorrador() === null && !almacen.has(CLAVE_BORRADOR),
    'Apartado 39 — un borrador vacío (sin ejercicios ni nombre) se retira en vez de ofrecerse');
  almacen.set(CLAVE_BORRADOR, JSON.stringify(crearRutina({ nombre: 'Solo el nombre' })));
  ok(leerBorrador()?.nombre === 'Solo el nombre' && almacen.has(CLAVE_BORRADOR), '…uno con algo escrito se queda');
  almacen.set(CLAVE_BORRADOR, '{esto no es json');
  ok(leerBorrador() === null && almacen.has(CLAVE_BORRADOR),
    '…y uno que no se entiende no tumba nada y tampoco se borra: no se borra lo que no se sabe qué es');
  ok(borradorVacio(null) && borradorVacio(crearRutina({})) && !borradorVacio(conEjercicio), '`borradorVacio` dice lo que dice');
  delete globalThis.window;
}

/* ═══ 5 · Fitness en la exportación (apartado 29) ════════════════════════════ */
console.log('\n── 5 · Fitness en la exportación de siempre (apartado 29) ──');
const paraExportar = copia({
  ...DEFAULT_FITNESS,
  sesiones: [s1, s2, valida, { ...copia(valida), id: 'en-curso', estado: 'en_curso' }],
  plantillas: [plantillaBuena],
  objetivos: crudoV1.objetivos,
  clasificaciones: [{ id: 'x-c1', exerciseId: 'sentadilla-barra', respuesta: 'a', puntuacion: 400, fuente: 'cuestionario', confianza: 'baja', creadoEn: Date.parse('2026-08-02') }],
  planActivo: { planId: 'ppl-estetico', origen: 'biblioteca', desde: '2026-08-21' },
  planesAnteriores: crudoRoto.planesAnteriores,
});
const fitExp = normalizarFitnessConSesiones(paraExportar);
const fotosExp = normalizarFotosProgreso([{ id: 'f1', path: 'u/1726000000000-a.jpg', fecha: '2026-09-01', tags: ['frontal'], nota: 'Inicio' }]);
const filas = filasDeFitnessParaExportar(fitExp, { fotos: fotosExp });
const de = (m) => filas.filter((f) => f.modulo === m);
ok(de('Fitness (entrenamiento)').length === sesionesDelHistorial(fitExp).length && de('Fitness (entrenamiento)').length === 3,
  'Las sesiones: las del historial —las completadas—, ni una en curso');
ok(de('Fitness (entrenamiento)').some((f) => /2 series/.test(f.valor) && /Curl/i.test(f.extra)),
  '…con sus series y sus ejercicios por su nombre, no su id');
ok(de('Fitness (plantilla)').length === 1 && de('Fitness (plan activo)').length === 1 && de('Fitness (plan anterior)').length === 1,
  'Las plantillas, el plan activo y los anteriores');
ok(de('Fitness (plantilla)')[0].valor === '1 ejercicio' && /Press de banca/i.test(de('Fitness (plantilla)')[0].extra),
  `🐛 …y la plantilla con SUS ejercicios: se guardan en \`ejercicios\`, no en \`lineas\` (decía «0 ejercicios»; ahora «${de('Fitness (plantilla)')[0].valor}»)`);
ok(de('Fitness (objetivo)').length === 1 && de('Fitness (estimación de nivel)').length === 1,
  'Los objetivos y las clasificaciones (marcadas como estimación, no como entrenamiento)');
const cambios = historialDeRango(fitExp, { tipo: 'overall', id: '' }, {}).cambios || [];
ok(de('Fitness (rango)').length === cambios.length,
  'Los rangos históricos: los cambios del rango global, los mismos que enseña la aplicación (F22)');
ok(de('Fitness (foto de progreso)').length === 1 && !JSON.stringify(filas).includes('u/1726000000000-a.jpg') && !/https?:/.test(JSON.stringify(filas)),
  '🚨 Las fotos, como referencia: fecha, etiquetas y nota. Ni el camino del archivo ni una URL');
ok(filasDeFitnessParaExportar(fitExp).filter((f) => /foto/.test(f.modulo)).length === 0,
  '…y sin fotos cuando no se pasan (lo que hace App.jsx con `fotos_privadas`, C-35)');
ok(filas.every((f) => ['modulo', 'fecha', 'detalle', 'valor', 'extra'].every((k) => typeof f[k] === 'string')),
  'Todas con la forma de fila de siempre, y sin un `undefined` que acabe en el CSV');
ok(!filas.some((f) => /cuarentena/i.test(JSON.stringify(f))), '…y la cuarentena no sale: no es un dato suyo legible');
{
  const vacio = {
    sueno: [], calistenia: {}, futbol: [], economia: { movimientos: [] }, salud: { historial: [], medidas: [] },
    nutricion: { agua: {}, comidas: [] }, estudios: { examenes: [], horas: [] }, negocio: { proyectos: [] },
    productividad: { habitos: [], metas: [], tareas: [] }, objetivos: { lista: [] }, calendario: { eventos: [] },
    diario: { entradas: [] }, biblioteca: { apuntes: [], enlaces: [] }, fe: { diario: [], eventos: [], objetivos: [], servicio: [] },
    bienestar: { reflexiones: [], registros: [], sesiones: [] },
  };
  let conFit = [];
  let sinFit = [];
  try {
    conFit = buildExportRows({ ...vacio, fitness: fitExp, fotosFitness: fotosExp });
    sinFit = buildExportRows(vacio);
  } catch (e) { console.log(e); }
  ok(conFit.length === filas.length && sinFit.length === 0,
    '🚨 Entra por la exportación GLOBAL (`buildExportRows`), no por un exportador paralelo');
  const app = leer('src/App.jsx');
  ok(/const fotosExportables = seguridad\.protectedActions\.includes\('fotos_privadas'\) \? null : saludFotos;/.test(app)
    && /const paraExportar = \{ \.\.\.currentState, estiloHombre, fitness, fotosFitness: fotosExportables \};/.test(app),
    '…y App.jsx la pasa APARTE de `currentState` (que es también el contexto de la IA), con las fotos solo sin PIN');
  ok(!/const currentState = \{[^}]*\bfitness\b/.test(app), '…y `fitness` sigue fuera de `currentState`');
}

/* ═══ 6 · Al volver con un entrenamiento (apartado 6, C-43) ═════════════════ */
console.log('\n── 6 · Continuar, Finalizar y Descartar al volver (apartado 6) ──');
{
  const AHORA = new Date(`${HOY}T18:40:00`).getTime();
  const r = anadirEjercicio(crearRutina({ nombre: 'Push' }), 'press-banca-barra');
  const enCurso = empezarSesion({ nombre: 'Push', lineas: r.lineas, hoy: HOY, ahora: AHORA - 40 * 60000 });
  const a = avisoDeRecuperacion(enCurso, { ahora: AHORA });
  ok(a.continuar === 'Continuar entrenamiento' && a.finalizar === 'Finalizar' && a.descartar === 'Descartar sesión' && a.duracion === '40:00',
    '🔓 La reciente, con su reloj y las TRES salidas del apartado 6 (C-43: la F39 le dejaba solo dos)');
  ok(/onFinalizar=\{onFinalizarSesion\}/.test(leer('src/views/FitnessView.jsx')),
    '…y Fitness cablea Finalizar: lleva al resumen de la F8, donde él decide');
  ok(/C-43/.test(leer('docs/03_CONTRADICCIONES_DUPLICADOS_DEPENDENCIAS.md')), '…anotado como C-43');
}

/* ═══ 7 · La foto que cambiaba en cada carga (apartados 43 y 46) ═════════════ */
console.log('\n── 7 · Una foto sin id o sin fecha ya no cambia en cada carga (43 y 46) ──');
{
  const vieja = { path: 'u/1726000000000-abc.jpg', nota: 'x' };
  const a = normalizarFotoProgreso(vieja);
  const b = normalizarFotoProgreso(vieja);
  ok(a.id && a.id === b.id, '🐛 Sin id recibía uno ALEATORIO en cada carga; ahora sale de su camino, que es único');
  ok(normalizarFotoProgreso({ path: 'u/1726000000001-abc.jpg' }).id !== a.id, '…y dos fotos no comparten id');
  ok(a.fecha === new Date(1726000000000).toLocaleDateString('sv-SE'),
    '🐛 Sin fecha se mudaba a HOY en cada carga; ahora es el día en que se subió (la marca del nombre del archivo)');
  ok(normalizarFotoProgreso({ path: 'u/x.jpg', createdAt: '2026-03-02T10:00:00.000Z' }).fecha === '2026-03-02',
    '…o su `createdAt`, si lo tiene');
  ok(normalizarFotoProgreso({ id: 'f9', path: 'u/x.jpg', fecha: '2026-05-05' }).id === 'f9'
    && normalizarFotoProgreso({ id: 'f9', path: 'u/x.jpg', fecha: '2026-05-05' }).fecha === '2026-05-05',
    '…y a una foto con id y fecha no se le toca nada');
}

/* ═══ 8 · Duplicados (apartado 56) ═══════════════════════════════════════════ */
console.log('\n── 8 · Guardar dos veces, terminar varias veces (apartado 56) ──');
{
  let f = copia(DEFAULT_FITNESS);
  f = guardarSesion(f, valida);
  f = guardarSesion(f, valida);
  ok(f.sesiones.filter((s) => s.id === valida.id).length === 1, 'Guardar la misma sesión dos veces deja una (F7)');
  const otra = guardarEntrenamiento(valida, { confirmado: true });
  ok(otra.sesion === valida || igual(otra.sesion, valida), 'Terminar una ya completada la devuelve tal cual (F8, apartado 17)');
  const dosVeces = cargarComoApp(copia(cargarComoApp(copia(crudoRoto)).fitness));
  ok(dosVeces.fitness.cuarentena.length === 5, 'Cargar dos veces no duplica la cuarentena');
  ok(/no tiene importación global|Importar datos de Fitness/.test(JSON.stringify(NO_EN_FIT41)),
    '«Importar dos veces» no existe: JosStyle no tiene importación global, y se dice (apartados 30 y 31)');
}

/* ═══ 9 · Datos corruptos (apartado 58) ══════════════════════════════════════ */
console.log('\n── 9 · JSON inválido, propiedad faltante, id inexistente, fecha mala, array corrupto (58) ──');
{
  const casos = [
    ['JSON inválido (una cadena en vez de un objeto)', '{esto no es json'],
    ['nada', null],
    ['propiedad faltante', { sesiones: undefined, objetivos: undefined }],
    ['id inexistente', { objetivos: [{ id: 'o', exerciseId: 'no-existe-este', tipo: 'reps', valor: 5, creadoEn: 1, estado: 'activo' }], favoritosEjercicios: ['no-existe'] }],
    ['fecha incorrecta', { sesiones: [{ ...copia(valida), id: 'fm', fecha: '2026-13-45' }] }],
    ['array corrupto', { sesiones: { 0: 'x' }, plantillas: [null, 3, 'x', [1]], clasificaciones: 'no', cuarentena: 'tampoco' }],
  ];
  casos.forEach(([nombre, crudo]) => {
    let r = null;
    let error = null;
    try {
      r = cargarComoApp(crudo);
      sesionesDelHistorial(r.fitness);
      resumenDeRangos(r.fitness, {});
      centroDeProgreso(r.fitness, [], { hoy: HOY });
      listaDeObjetivos(r.fitness);
    } catch (e) { error = e; }
    ok(!error && r && Array.isArray(r.fitness.sesiones) && Array.isArray(r.fitness.cuarentena),
      `${nombre}: se recupera de forma segura y las pantallas principales se calculan${error ? ` (${error.message})` : ''}`);
  });
  const idInexistente = cargarComoApp({ objetivos: [{ id: 'o', exerciseId: 'no-existe-este', tipo: 'reps', valor: 5, creadoEn: 1, estado: 'activo' }] });
  ok(idInexistente.fitness.objetivos.length === 1 && idInexistente.nuevos.length === 0,
    '…y un objetivo de un ejercicio que ya no existe NO se aparta: es historia (C-36), no un dato roto');
}

/* ═══ 10 · Rendimiento (apartado 59) ═════════════════════════════════════════ */
console.log('\n── 10 · Sin «guardar todo constantemente» (apartado 59) ──');
{
  /* Sin clasificaciones: las del escenario de la F40 repiten ejercicio a
     propósito de su medida, y dos del mismo ejercicio SÍ se apartan (§3). */
  const { fitness: grande } = escenarioGrande({ sesiones: 1000, propios: 200, objetivos: 100, clasificaciones: 0, hoy: HOY });
  const crudo = copia({ ...DEFAULT_FITNESS, ...grande });
  const t0 = performance.now();
  const r = cargarComoApp(crudo);
  const ms = performance.now() - t0;
  const t1 = performance.now();
  normalizarFitnessConSesiones(crudo);
  const base = performance.now() - t1;
  ok(r.nuevos.length === 0 && r.fitness.sesiones.length === 1000, 'Con 1 000 sesiones sanas no se aparta nada');
  ok(ms - base < 150, `…y migrar y apartar cuestan poco encima de la puerta de carga: ${Math.round(ms - base)} ms más (${Math.round(ms)} en total)`);
  ok(!/saveData|guardarFitness/.test(codigo(leer('src/lib/persistenciaFitness.js'))),
    '…y corren una vez por carga, sin guardar: lo apartado viaja con el siguiente guardado de verdad');
}

/* ═══ 11 · Lo que ya existía, lo hecho y lo que no (apartados 1-61) ═════════ */
console.log('\n── 11 · Ni un apartado sin decir ──');
{
  const cubiertos = new Set();
  YA_EXISTIA_F41.forEach((y) => cubiertos.add(y.apartado));
  HECHO_F41.forEach((h) => h.apartados.forEach((a) => cubiertos.add(a)));
  DECISIONES_FIT41.forEach((d) => (d.apartados || []).forEach((a) => cubiertos.add(a)));
  NO_EN_FIT41.forEach((n) => (n.que.match(/apartados? (\d+)(?: y (\d+))?/g) || []).forEach((m) => m.match(/\d+/g).forEach((a) => cubiertos.add(Number(a)))));
  const faltan = Array.from({ length: 61 }, (_, i) => i + 1).filter((a) => !cubiertos.has(a));
  ok(faltan.length === 0, `Los 61 apartados están dichos: ya existía, hecho aquí o no se hace con su motivo${faltan.length ? ` (faltan ${faltan})` : ''}`);
  ok(YA_EXISTIA_F41.length >= 30 && YA_EXISTIA_F41.every((y) => y.que && y.donde), `${YA_EXISTIA_F41.length} apartados ya los resolvían otras fases, cada uno con dónde`);
  ok(NO_EN_FIT41.every((n) => n.porque && n.porque.length > 40), 'Lo que no se hace, con su motivo');
  ok(NO_EN_FIT41.some((n) => /dos dispositivos|pestañas/.test(n.que) && /columna/.test(n.porque)),
    '🚨 Y lo que la arquitectura no permite se dice: detectar dos dispositivos exige una columna nueva, y el «IMPORTANTE» la prohíbe');
  ok(DECISIONES_FIT41.some((d) => d.id === 'sin_backend_nuevo'), 'Ni una tabla ni una columna');
}

console.log(`\n${fallos === 0 ? '\x1b[32m' : '\x1b[31m'}FIT F41: ${total - fallos}/${total} — ${total} comprobaciones\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);
