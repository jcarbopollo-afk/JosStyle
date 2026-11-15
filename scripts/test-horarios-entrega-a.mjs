// ============================================================================
// HORARIOS · FASE 4, ENTREGA A — fechasSemana.js, normalizador conservador,
// guardia de versión, diagnosticoHorarios y panel de solo lectura
// (`docs/19` §12.2, §12.3 y §14.1).
//
// Todos los datos de esta prueba son DE PRUEBA, construidos aquí. Ninguno sale
// de una cuenta.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fechasSemana from '../src/lib/fechasSemana.js';
import * as horario from '../src/lib/horario.js';
import * as hoy from '../src/lib/hoy.js';
import { addDays } from '../src/lib/helpers.js';
import { diagnosticoHorarios, bytesDe, textoDeTamano, DIAS_DIAGNOSTICO, GRAVEDADES_DIAGNOSTICO } from '../src/lib/diagnosticoHorario.js';

const {
  normalizarHorarioTop, guardiaDeVersionHorario, versionDeHorario, VERSION_HORARIO, CAMPOS_CONOCIDOS_HORARIO,
  conflictosDelDia, DEFAULT_HORARIO_TOP,
} = horario;

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);
const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
// Solo para buscar USOS: quita comentarios de bloque y de línea entera.
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const copia = (x) => JSON.parse(JSON.stringify(x));
const congelar = (x) => { if (x && typeof x === 'object') { Object.values(x).forEach(congelar); Object.freeze(x); } return x; };

/* Quita, recursivamente, las claves que el normalizador NO conoce, para comparar lo conocido. */
function soloConocido(top) {
  const C = CAMPOS_CONOCIDOS_HORARIO;
  const pick = (o, claves) => Object.fromEntries(Object.entries(o).filter(([k]) => claves.includes(k)));
  const r = pick(top, C.horarioTop);
  r.horarios = top.horarios.map((h) => ({ ...pick(h, C.horario), columnas: h.columnas.map((c) => pick(c, C.columna)), filas: h.filas.map((f) => pick(f, C.fila)) }));
  r.actividades = top.actividades.map((a) => ({ ...pick(a, C.actividad), visibilidad: pick(a.visibilidad, horario.VISTAS_ACTIVIDAD) }));
  r.bloques = top.bloques.map((b) => ({ ...pick(b, C.bloque), recurrencia: pick(b.recurrencia, C.recurrencia) }));
  r.excepciones = top.excepciones.map((x) => ({ ...pick(x, C.excepcion), cambios: pick(x.cambios, C.cambios) }));
  return r;
}

// ── Fixture DE PRUEBA: un horario completo, todas las entidades con id ─────
const BASE = {
  horarios: [{
    id: 'h1', nombre: 'Instituto', tipo: 'colegio', activo: true, archivado: false, desde: '', hasta: '',
    columnas: [{ id: 'c1', nombre: 'Lunes', dia: 1 }, { id: 'c2', nombre: 'Martes', dia: 2 }],
    filas: [{ id: 'f1', inicio: '08:00', fin: '09:00' }],
  }],
  actividades: [{ id: 'a1', nombre: 'Física', profesor: 'Prueba', activa: false, visibilidad: { hoy: false } }],
  bloques: [
    { id: 'b1', horarioId: 'h1', columnaId: 'c1', actividadId: 'a1', inicio: '08:00', fin: '09:00' },
    { id: 'b2', horarioId: 'h1', columnaId: 'c2', inicio: '09:00', fin: '10:00', titulo: 'Tutoría', recurrencia: { clase: 'alternas', ancla: '2026-11-09' } },
  ],
  excepciones: [{ id: 'e1', fecha: '2026-11-10', tipo: 'modificado', bloqueId: 'b2', cambios: { inicio: '09:30' } }],
  completadas: ['b1@2026-11-09'],
};
// Lo mismo, con campos que esta versión no conoce en todos los niveles.
const CON_DESCONOCIDOS = {
  ...copia(BASE),
  version: 1, config: { prueba: true }, ajustesAvisos: { antes: 10 }, futuroTop: [1, 2],
};
CON_DESCONOCIDOS.horarios[0].zonaFutura = 'x';
CON_DESCONOCIDOS.horarios[0].columnas[0].semanaCiclo = 'A';
CON_DESCONOCIDOS.horarios[0].filas[0].nota = { a: 1 };
CON_DESCONOCIDOS.actividades[0].vinculo = { id: 'z' };
CON_DESCONOCIDOS.actividades[0].visibilidad.mapa = false;
CON_DESCONOCIDOS.bloques[0].serieId = 's1';
CON_DESCONOCIDOS.bloques[1].recurrencia.cadaSemanas = 2;
CON_DESCONOCIDOS.excepciones[0].origen = 'otra-version';
CON_DESCONOCIDOS.excepciones[0].cambios.notaDelDia = 'x';

console.log('\n── 1 · fechasSemana.js: misma firma, mismo resultado, reexportado ──');
ok(horario.DIAS_SEMANA === fechasSemana.DIAS_SEMANA, 'horario.js reexporta el MISMO DIAS_SEMANA');
ok(horario.diaDeFecha === fechasSemana.diaDeFecha, 'horario.js reexporta la MISMA diaDeFecha');
ok(hoy.diasEntre === fechasSemana.diasEntre, 'hoy.js reexporta la MISMA diasEntre');
eq(fechasSemana.DIAS_SEMANA.map((d) => `${d.dia}${d.corto}`), ['1L', '2M', '3X', '4J', '5V', '6S', '7D'], 'Siete días, lunes primero');
eq(fechasSemana.diaDeFecha('2026-11-09'), 1, '9-11-2026 es lunes');
eq(fechasSemana.diaDeFecha('2026-11-15'), 7, '15-11-2026 es domingo');
eq(fechasSemana.diaDeFecha('no-es-fecha'), null, 'Una fecha imposible da null');
eq(fechasSemana.diasEntre('2026-03-28', '2026-03-30'), 2, 'diasEntre cruza el cambio de hora sin perder un día');
eq(fechasSemana.diasEntre('2026-11-10', '2026-11-09'), -1, 'diasEntre hacia atrás es negativo');
eq(fechasSemana.diasEntre('', '2026-11-09'), 0, 'diasEntre sin fecha es 0 (como antes)');
{
  const fuente = leer('src/lib/fechasSemana.js');
  ok(!/^\s*import /m.test(fuente), 'fechasSemana.js es una hoja: no importa nada');
  const h = sinComentarios(leer('src/lib/horario.js')); const y = sinComentarios(leer('src/lib/hoy.js'));
  ok(/import \{ DIAS_SEMANA, diaDeFecha \} from '\.\/fechasSemana'/.test(h) && /export \{ DIAS_SEMANA, diaDeFecha \}/.test(h), 'horario.js: import + export { } (nunca export … from)');
  ok(/import \{ diasEntre \} from '\.\/fechasSemana'/.test(y) && /export \{ diasEntre \}/.test(y), 'hoy.js: import + export { }');
  ok(!/export \{[^}]*\} from '\.\/fechasSemana'/.test(h + y), 'Ni un export … from fechasSemana');
  ok(!/function diaDeFecha|const DIAS_SEMANA =/.test(h) && !/function diasEntre/.test(y), 'No quedan copias de las funciones en horario.js ni en hoy.js');
  ok(/function diasEntre|const diasEntre/.test(leer('src/lib/rachas.js')) && !/fechasSemana/.test(leer('src/lib/rachas.js')), 'La diasEntre de rachas.js sigue siendo suya (otra función, no se ha tocado)');
}

console.log('\n── 2 · Normalizador conservador: lo desconocido se conserva tal cual ──');
const N = normalizarHorarioTop(congelar(copia(CON_DESCONOCIDOS)));
eq(N.version, 1, 'Primer nivel: version');
eq(N.config, { prueba: true }, 'Primer nivel: config (C4)');
eq(N.ajustesAvisos, { antes: 10 }, 'Primer nivel: ajustesAvisos (C4)');
eq(N.futuroTop, [1, 2], 'Primer nivel: un campo inventado');
eq(N.horarios[0].zonaFutura, 'x', 'Horario: campo desconocido');
eq(N.horarios[0].columnas[0].semanaCiclo, 'A', 'Columna: campo desconocido');
eq(N.horarios[0].filas[0].nota, { a: 1 }, 'Fila: campo desconocido');
eq(N.actividades[0].vinculo, { id: 'z' }, 'Actividad: campo desconocido');
eq(N.actividades[0].visibilidad.mapa, false, 'Visibilidad: vista desconocida');
eq(N.bloques[0].serieId, 's1', 'Clase (regla): campo desconocido');
eq(N.bloques[1].recurrencia.cadaSemanas, 2, 'Recurrencia: campo desconocido');
eq(N.excepciones[0].origen, 'otra-version', 'Excepción: campo desconocido');
eq(N.excepciones[0].cambios.notaDelDia, 'x', 'Cambios de una excepción: campo desconocido');
ok(N.horarios[0].columnas[0].semanaCiclo === CON_DESCONOCIDOS.horarios[0].columnas[0].semanaCiclo, 'Se conserva el valor, no una copia transformada');

console.log('\n── 3 · Lo conocido se normaliza EXACTAMENTE como antes ──');
const SIN = normalizarHorarioTop(copia(BASE));
eq(soloConocido(N), soloConocido(SIN), 'Quitando lo desconocido, la salida es idéntica a la de los mismos datos sin desconocidos');
eq(Object.keys(SIN).sort(), [...CAMPOS_CONOCIDOS_HORARIO.horarioTop].sort(), 'Sin campos desconocidos no aparece ninguna clave nueva');
eq(normalizarHorarioTop(N), N, 'Normalizar dos veces no cambia nada (idempotente)');
eq(normalizarHorarioTop(SIN), SIN, 'Idempotente también sin desconocidos');
eq(SIN.actividades[0].persona, 'Prueba', 'Estructura antigua: «profesor» sigue traduciéndose a «persona»');
eq(SIN.actividades[0].estado, 'archivada', 'Estructura antigua: «activa: false» sigue traduciéndose a «archivada»');
ok(!('profesor' in SIN.actividades[0]) && !('activa' in SIN.actividades[0]), 'Los nombres antiguos traducidos no se duplican como «desconocidos»');
eq(SIN.actividades[0].visibilidad, { horario: true, hoy: false, calendario: true, mochila: true }, 'La visibilidad conocida se lee como siempre');
eq(SIN.bloques[1].recurrencia, { clase: 'alternas', ancla: '2026-11-09' }, 'La recurrencia conocida se lee como siempre');
eq(SIN.excepciones[0].cambios, { inicio: '09:30', fin: '', actividadId: null, titulo: '', ubicacion: '' }, 'Los cambios conocidos se leen como siempre');
eq(normalizarHorarioTop(DEFAULT_HORARIO_TOP), normalizarHorarioTop({}), 'El valor por defecto no gana campos');
eq(normalizarHorarioTop(null).horarios, [], 'null sigue siendo un horario vacío');
// Un campo desconocido NO puede pisar a uno conocido: lo conocido va encima.
{
  const r = normalizarHorarioTop({ horarios: 'no es lista', bloques: [{ id: 'b', horarioId: 'h', columnaId: 'c', inicio: '08:00', fin: '09:00', recurrencia: 'texto' }] });
  eq(r.horarios, [], 'Un «horarios» que no es lista sigue siendo []');
  eq(r.bloques[0].recurrencia, { clase: 'siempre' }, 'Una recurrencia que no es objeto no aporta claves');
}

console.log('\n── 4 · Datos incompletos o ambiguos: no se inventa nada nuevo (N2–N5 siguen como hoy, para la entrega B) ──');
{
  const amb = {
    horarios: [{ id: 'h', columnas: [{ id: 'c', dia: 1 }] }],
    bloques: [
      { id: 'sinColumna', horarioId: 'h', inicio: '08:00', fin: '09:00' },
      { id: 'rec', horarioId: 'h', columnaId: 'c', inicio: '08:00', fin: '09:00', recurrencia: { clase: 'cada3', n: 3 } },
    ],
    excepciones: [{ id: 'x', fecha: '2026-11-09', tipo: 'raro', detalle: 'y' }],
  };
  const r = normalizarHorarioTop(copia(amb));
  ok(!r.bloques.some((b) => b.id === 'sinColumna'), 'N2 (sin cambio en A): una clase sin columna se sigue descartando — el diagnóstico la cuenta');
  eq(r.bloques[0].recurrencia, { n: 3, clase: 'siempre' }, 'N5 (sin cambio en A): repetición desconocida → «siempre», pero conserva sus otros campos');
  eq(r.excepciones[0].tipo, 'cancelado', 'N3 (sin cambio en A): tipo desconocido → «cancelado» — el diagnóstico lo cuenta');
  eq(r.excepciones[0].detalle, 'y', 'N3: aun así, sus campos desconocidos se conservan');
  const d = diagnosticoHorarios(amb, { hoy: '2026-11-09' });
  const ids = d.hallazgos.map((h) => h.id);
  ok(ids.includes('reglas_sin_horario_o_columna') && ids.includes('reglas_recurrencia_desconocida') && ids.includes('excepciones_tipo_desconocido'),
    'El diagnóstico señala como «riesgo» lo que la carga transforma');
  ok(d.hallazgos.filter((h) => ['reglas_sin_horario_o_columna', 'reglas_recurrencia_desconocida', 'excepciones_tipo_desconocido'].includes(h.id)).every((h) => h.gravedad === 'riesgo'),
    'Con gravedad «riesgo»');
}

console.log('\n── 5 · La guardia de versión ──');
eq(VERSION_HORARIO, 1, 'Esta versión conoce la 1');
eq(versionDeHorario({}).tipo, 'sin_version', 'Sin version: «sin_version»');
eq(versionDeHorario({ version: null }).tipo, 'sin_version', 'version null: «sin_version»');
eq(versionDeHorario({ version: 1 }).tipo, 'conocida', 'version 1: conocida');
eq(versionDeHorario({ version: 2 }).tipo, 'futura', 'version 2: futura');
eq(versionDeHorario({ version: 99 }).tipo, 'futura', 'version 99: futura');
for (const v of ['2', 1.5, 0, -1, NaN, true, {}, []]) eq(versionDeHorario({ version: v }).tipo, 'ilegible', `version ${JSON.stringify(v)}: ilegible`);
eq(versionDeHorario(null).tipo, 'sin_datos', 'null: sin datos');
eq(guardiaDeVersionHorario({}), { soloLectura: false, motivo: null, version: null, problemas: [] }, 'Sin version se puede guardar (todo lo guardado hasta hoy)');
eq(guardiaDeVersionHorario({ version: 1 }), { soloLectura: false, motivo: null, version: 1, problemas: [] }, 'version 1 se puede guardar');
eq(guardiaDeVersionHorario({ version: 2 }), { soloLectura: true, motivo: 'version_futura', version: 2, problemas: [] }, 'version 2: solo lectura');
eq(guardiaDeVersionHorario({ version: 'dos' }).motivo, 'version_ilegible', 'version ilegible: solo lectura');
eq(guardiaDeVersionHorario(DEFAULT_HORARIO_TOP).soloLectura, false, 'El valor por defecto (cuenta nueva o carga fallida) no bloquea');
ok(!('version' in DEFAULT_HORARIO_TOP), 'Esta entrega NO escribe version en los datos (no cambia la forma de lo guardado)');

console.log('\n── 6 · La guardia, cableada en App.jsx ──');
{
  const app = sinComentarios(leer('src/App.jsx'));
  ok(/guardiaDeVersionHorario\(hor\)/.test(app), 'Se calcula con lo que devuelve loadData, sin normalizar');
  ok(/horarioSoloLecturaRef\.current = guardiaHor\.soloLectura/.test(app), 'La guarda va en una referencia (la leen los guardados)');
  ok(/setHorarioCrudo\(hor\)/.test(app), 'El diagnóstico recibe lo crudo');
  ok(/const snapshotAndSave = \(patch\) => \{\s*if \(parcheTocaHorario\(patch\) && horarioSoloLecturaRef\.current\) return Promise\.resolve\(NO_GUARDA_HORARIO\(\)\);/.test(app),
    'snapshotAndSave no guarda NADA del cambio si toca el horario en solo lectura (ni el historial), y lo decide por la PRESENCIA de la clave');
  ok(!/patch\.horarioTop && horarioSoloLecturaRef/.test(app), 'Ya no decide por si el valor de patch.horarioTop es verdadero');
  ok(/if \(horarioSoloLecturaRef\.current\) delete snapshot\.horarioTop;/.test(app), 'En solo lectura, el paso de Deshacer no lleva el horario');
  ok(/if \(!horarioSoloLecturaRef\.current && last\.horarioTop\) \{ setHorarioTop\(last\.horarioTop\); saveData\(uidUser, 'horarioTop', last\.horarioTop\); \}/.test(app),
    'Deshacer no escribe el horario en solo lectura, ni lo restaura vacío desde un paso que no lo lleva');
  ok(!/last\.horarioTop \|\| DEFAULT_HORARIO_TOP/.test(app), 'Deshacer ya no escribe un horario vacío por defecto');
  ok(/\.\.\.\(horarioSoloLecturaRef\.current \? \{\} : \{ horarioTop: limpiarHorarioDeAsignatura\(/.test(app),
    'Borrar una asignatura en Estudios sigue funcionando y, en solo lectura, no toca el horario');
  ok(/horarioTop=\{horarioSoloLectura \? null : horarioTop\}/.test(app), 'Y el aviso de Estudios no promete borrar clases del horario en solo lectura');
  const escrituras = app.match(/saveData\(uidUser, 'horarioTop'/g) || [];
  eq(escrituras.length, 2, 'Solo hay dos escrituras de horarioTop (snapshotAndSave y deshacer), las dos guardadas');
  ok(/soloLectura=\{horarioSoloLectura\}/.test(app) && /horarioCrudo=\{horarioCrudo\}/.test(app) && /cargaFallida=\{cargaFallida\('horarioTop'\)\}/.test(app), 'HorarioView recibe la guardia, lo crudo y si la carga falló');
  const primerReturn = app.indexOf("if (session === undefined) return");
  ok(app.indexOf('useState(null);\n  const horarioSoloLecturaRef') > 0 && app.indexOf('horarioSoloLecturaRef = useRef') < primerReturn, 'Los hooks nuevos van antes de los return (regla 4)');
}

console.log('\n── 7 · diagnosticoHorarios: recuentos, hallazgos y limitaciones ──');
{
  const crudo = congelar(copia({
    version: 1, config: { x: 1 },
    horarios: [
      { id: 'h1', activo: true, ciclo: { semanas: 2 }, columnas: [{ id: 'c1', dia: 1 }, { id: 'c2', dia: null }, { id: 'c3', dia: 2, visible: false, grupo: 'B' }, { dia: 3 }], filas: [{ inicio: '08:00' }] },
      { id: 'h2', archivado: true, columnas: [] },
      { id: 'h3', activo: false, columnas: [] },
      'no-es-un-horario',
    ],
    bloques: [
      { id: 'b1', horarioId: 'h1', columnaId: 'c1', inicio: '08:00', fin: '09:00', titulo: 'SECRETO-TITULO', notas: 'SECRETO-NOTA' },
      { id: 'b2', horarioId: 'h1', columnaId: 'c1', inicio: '08:30', fin: '09:30', actividadId: 'no-existe' },
      { id: 'b3', columnaId: 'c1', inicio: '10:00', fin: '11:00' },
      { horarioId: 'h1', columnaId: 'c2', inicio: '25:00', fin: '09:00', recurrencia: { clase: 'cada3' } },
      { id: 'b5', horarioId: 'h1', columnaId: 'c3', inicio: '10:00', fin: '09:00', recurrencia: { clase: 'alternas' } },
      { id: 'b6', horarioId: 'nada', columnaId: 'c1', inicio: '12:00', fin: '13:00' },
      { id: 'b7', horarioId: 'h1', columnaId: 'zz', inicio: '12:00', fin: '13:00' },
      { id: 'b1', horarioId: 'h1', columnaId: 'c1', inicio: '15:00', fin: '16:00' },
      null,
    ],
    excepciones: [{ id: 'e1', fecha: '2026-13-45', tipo: 'raro', bloqueId: 'nope' }, { fecha: '2026-11-09', tipo: 'cancelado' }, 7],
    actividades: [{ id: 'a1', asignaturaId: 'borrada' }, { nombre: 'sin id' }, { id: 'a1' }, null],
    mochila: [{ fecha: '2026-11-09', nombre: 'x' }],
    completadas: ['b1@2026-11-09', 'b2@2026-11-09'],
  }));
  const antes = JSON.stringify(crudo);
  const d = diagnosticoHorarios(crudo, { asignaturas: [{ id: 'a-viva' }], hoy: '2026-11-09' });
  ok(JSON.stringify(crudo) === antes, 'No modifica los datos que recibe (y funciona con ellos congelados)');
  const h = Object.fromEntries(d.hallazgos.map((x) => [x.id, x]));
  const c = (id) => h[id]?.cantidad || 0;
  eq(d.estado, 'con_datos', 'Estado: con datos');
  eq(d.recuentos.horarios, { total: 4, activos: 1, archivados: 1, inactivos: 1, conCiclo: 1 }, 'Horarios por estado');
  // 🔎 Corrección A4 — esta entrada tiene un horario que no es un objeto ('no-es-un-horario'): sus
  // columnas no se pueden contar, así que la fila de columnas es «No se puede leer», no el parcial 4.
  eq(d.recuentos.columnas, { total: null, sinDia: null, ocultas: null, conGrupo: null }, 'Columnas: con un horario malformado, «No se puede leer» (no el parcial 4)');
  // Y la misma entrada SIN el horario malformado cuenta lo que se contaba antes.
  {
    const sinMalo = copia(crudo); sinMalo.horarios = sinMalo.horarios.filter((h) => typeof h === 'object');
    eq(diagnosticoHorarios(sinMalo, { asignaturas: [{ id: 'a-viva' }], hoy: '2026-11-09' }).recuentos.columnas,
      { total: 4, sinDia: 1, ocultas: 1, conGrupo: 1 }, 'Columnas: sin día, ocultas, con grupo (sin el horario malformado)');
  }
  eq([d.recuentos.reglas, d.recuentos.excepciones, d.recuentos.actividades, d.recuentos.mochila, d.recuentos.completadas], [9, 3, 4, 1, 2], 'Reglas, excepciones, actividades, mochila y completadas');
  eq(c('horarios_no_objeto'), 1, 'Horario que no es objeto');
  eq(c('columnas_sin_id'), 1, 'Columna sin id');
  eq(c('filas_sin_id'), 1, 'Fila sin id');
  eq(c('ciclos_con_grupo'), 1, 'Ciclos con columnas con grupo (P1)');
  eq(c('reglas_no_objeto'), 1, 'Regla que no es objeto');
  eq(c('reglas_sin_horario_o_columna'), 1, 'Reglas sin horario o columna (las que hoy se pierden)');
  eq(c('reglas_sin_id'), 1, 'Regla sin id');
  eq(c('reglas_id_repetido'), 1, 'Regla con id repetido');
  eq(c('reglas_horario_inexistente'), 1, 'Regla de un horario que no existe');
  eq(c('reglas_columna_inexistente'), 1, 'Regla de una columna que no existe');
  eq(c('reglas_en_columna_sin_dia'), 1, 'Reglas en columnas sin día (P2)');
  eq(c('reglas_en_columna_oculta'), 1, 'Reglas en columnas ocultas');
  eq(c('reglas_hora_invalida'), 1, 'Hora imposible');
  eq(c('reglas_fin_antes_de_inicio'), 1, 'Fin antes del inicio');
  eq(c('reglas_alternas'), 1, 'Reglas alternas');
  eq(c('reglas_alternas_sin_ancla'), 1, 'Alternas sin ancla');
  eq(c('reglas_recurrencia_desconocida'), 1, 'Repetición desconocida');
  eq(c('reglas_actividad_inexistente'), 1, 'Actividad que no existe');
  ok(c('reglas_sin_actividad') >= 1 && h.reglas_sin_actividad.gravedad === 'info', 'Bloques sin actividad (indicio de P10), como información');
  eq(c('excepciones_no_objeto'), 1, 'Excepción que no es objeto');
  eq(c('excepciones_fecha_invalida'), 1, 'Excepción con fecha inválida (P12)');
  eq(c('excepciones_tipo_desconocido'), 1, 'Excepción de tipo desconocido');
  eq(c('excepciones_sin_id'), 1, 'Excepción sin id');
  eq(c('excepciones_clase_inexistente'), 1, 'Excepción de una clase que no existe');
  eq(c('actividades_no_objeto'), 1, 'Actividad que no es objeto');
  eq(c('actividades_sin_id'), 1, 'Actividad sin id');
  eq(c('actividades_id_repetido'), 1, 'Actividad con id repetido');
  eq(c('actividades_asignatura_inexistente'), 1, 'Actividad de una asignatura que no está en Estudios');
  eq(d.camposDesconocidos.horarioTop, ['config'], 'Campos desconocidos del primer nivel (solo el nombre)');
  ok(d.tamanos.horarioTop === bytesDe(crudo) && d.tamanos.mochila > 0 && d.tamanos.completadas > 0, 'Tamaño de horarioTop, mochila y completadas');
  ok(!JSON.stringify(d).includes('SECRETO'), 'No devuelve ni un título ni una nota: solo cifras y nombres de campos');
  ok(d.limitaciones.length >= 3, 'Dice lo que no sabe (limitaciones)');
  ok(d.limitaciones.some((t) => /ciclo de semanas/.test(t)), 'Con ciclo y grupo, avisa de que los choques pueden incluir semanas distintas');
  const orden = d.hallazgos.map((x) => x.gravedad);
  ok(orden.join() === [...orden].sort((a, b) => ['riesgo', 'aviso', 'info'].indexOf(a) - ['riesgo', 'aviso', 'info'].indexOf(b)).join(), 'Los hallazgos van de riesgo a información');
  ok(d.hallazgos.every((x) => GRAVEDADES_DIAGNOSTICO.some((g) => g.id === x.gravedad) && x.cantidad > 0 && x.titulo && x.detalle), 'Cada hallazgo tiene gravedad conocida, cantidad, título y explicación');
  eq(diagnosticoHorarios(crudo, { hoy: '2026-11-09' }).hallazgos.some((x) => x.id === 'actividades_asignatura_inexistente'), false, 'Sin las asignaturas no afirma que falte ninguna');
}

console.log('\n── 8 · Choques: el mismo detector que la pantalla ──');
{
  const crudo = {
    horarios: [
      { id: 'h1', columnas: [{ id: 'c1', dia: 1 }] },
      { id: 'h2', columnas: [{ id: 'c9', dia: 1 }] },
    ],
    bloques: [
      { id: 'b1', horarioId: 'h1', columnaId: 'c1', inicio: '08:00', fin: '09:00' },
      { id: 'b2', horarioId: 'h1', columnaId: 'c1', inicio: '08:30', fin: '09:30' },
      { id: 'b3', horarioId: 'h1', columnaId: 'c1', inicio: '09:30', fin: '10:00' },
      { id: 'b4', horarioId: 'h2', columnaId: 'c9', inicio: '09:45', fin: '10:30' },
    ],
  };
  const d = diagnosticoHorarios(crudo, { hoy: '2026-11-09' });
  let manual = 0;
  for (let i = 0; i < DIAS_DIAGNOSTICO; i += 1) manual += conflictosDelDia(normalizarHorarioTop(crudo), addDays('2026-11-09', i), {}).length;
  eq(d.recuentos.choques.pares, 2, 'Dos pares distintos (b1-b2 y b3-b4); tocarse (09:30) no es chocar');
  eq(d.recuentos.choques.ocurrencias, manual, 'Las ocurrencias coinciden con conflictosDelDia día a día');
  eq(d.recuentos.choques.entreHorarios, 1, 'Uno de ellos es entre dos horarios');
  eq(d.recuentos.choques.dias, 14, 'En los próximos 14 días');
}

console.log('\n── 9 · Casos límite del diagnóstico ──');
{
  const s = diagnosticoHorarios({ horarios: [] }, { cargaFallida: true });
  eq(s.estado, 'sin_cargar', 'Con la carga fallida no diagnostica el valor por defecto como si fuera la cuenta');
  eq([s.recuentos, s.hallazgos.length], [null, 0], 'Ni recuentos ni hallazgos inventados');
  eq(diagnosticoHorarios(DEFAULT_HORARIO_TOP).estado, 'vacio', 'El valor por defecto: vacío');
  eq(diagnosticoHorarios(DEFAULT_HORARIO_TOP).hallazgos.length, 0, 'Vacío: nada que señalar');
  eq(diagnosticoHorarios(null).estado, 'vacio', 'null: vacío');
  const raro = diagnosticoHorarios('texto');
  eq([raro.estado, raro.hallazgos[0]?.id], ['no_es_objeto', 'no_es_objeto'], 'Lo que no es un objeto se señala');
  const fut = diagnosticoHorarios({ version: 3, horarios: [] });
  eq([fut.version.tipo, fut.version.soloLectura, fut.version.motivo], ['futura', true, 'version_futura'], 'Informa de la versión y de la solo lectura');
  const cicl = { horarios: [] }; cicl.yo = cicl;
  eq(diagnosticoHorarios(cicl).tamanos.horarioTop, null, 'Un dato que no se puede medir dice null, no un número inventado');
  eq([textoDeTamano(null), textoDeTamano(512), textoDeTamano(2048)], ['No se puede medir', '512 B', '2,0 KB'], 'Textos de tamaño');
}

console.log('\n── 10 · Solo lectura de verdad: lo que el diagnóstico y el panel NO pueden hacer ──');
{
  const lib = sinComentarios(leer('src/lib/diagnosticoHorario.js'));
  const imports = [...lib.matchAll(/from '([^']+)'/g)].map((m) => m[1]).sort();
  eq(imports, ['./helpers', './horario'], 'diagnosticoHorario.js solo importa horario.js y helpers.js');
  ok(!/saveData|supabase|fetch\(|localStorage|sessionStorage|indexedDB|XMLHttpRequest/.test(lib), 'Ni guardado, ni Supabase, ni red, ni almacenamiento');
  const panel = sinComentarios(leer('src/components/diagnosticoHorarioPanel.jsx'));
  const impPanel = [...panel.matchAll(/from '([^']+)'/g)].map((m) => m[1]).sort();
  eq(impPanel, ['../lib/diagnosticoHorario', '../lib/helpers', '../tokens', './layoutMotion', './motion', './ui', 'lucide-react', 'react'], 'El panel no importa nada que guarde');
  ok(!/onCambiar|saveData|supabase|fetch\(|localStorage|download|Blob|clipboard/.test(panel), 'El panel no recibe onCambiar, no guarda, no exporta ni copia nada');
  const botones = (panel.match(/<button/g) || []).length;
  eq(botones, 2, 'Solo dos botones: abrir el diagnóstico y Recargar (ninguno cambia datos)');
  ok(/onClick=\{\(\) => setAbierto/.test(panel) && /onClick=\{onRecargar\}/.test(panel), 'Esos dos, y nada más');
  const vista = sinComentarios(leer('src/views/HorarioView.jsx'));
  const usos = vista.match(/<DiagnosticoHorariosEntrada[^>]*>/g) || [];
  eq(usos.length, 2, 'HorarioView pinta el panel en sus dos ramas (con horario y sin ninguno)');
  ok(usos.every((u) => !/onCambiar|onCrear/.test(u)), 'Y no le pasa ninguna función que escriba');
  ok(/\{!soloLectura && \(\s*<button onClick=\{\(\) => setEdicion/.test(vista), 'En solo lectura no se ofrece «Editar horario»');
  ok(/\{!soloLectura && <PrimaryButton[^>]*onClick=\{\(\) => setCreando\(true\)\}/.test(vista), 'En solo lectura no se ofrece crear un horario');
  ok(/AvisoSoloLecturaHorario motivo=\{soloLectura\}/.test(vista), 'El aviso de solo lectura está en la pantalla');
  const texto = leer('src/components/diagnosticoHorarioPanel.jsx');
  ok(texto.includes('Tu horario se guardó con una versión más nueva de JosStyle. Recarga la aplicación para editarlo.'), 'El texto del aviso es el de docs/20 §12');
  ok(!/Fase 4|entrega A|docs\//.test(texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')), 'Ni una nota interna de desarrollo en lo que se ve (regla 9)');
}

console.log('\n── 11 · Compatibilidad: quien leía de horario.js y hoy.js sigue leyendo lo mismo ──');
{
  const quienes = ['src/lib/fitness.js', 'src/lib/tuPlan.js', 'src/lib/sueno.js'].filter((f) => { try { leer(f); return true; } catch { return false; } });
  for (const f of quienes) {
    const t = leer(f);
    ok(!/from '\.\/fechasSemana'/.test(t), `${f} no se ha tocado: sigue importando de horario.js / hoy.js`);
  }
  ok(typeof hoy.contextoTemporal === 'function' && typeof horario.resolverDia === 'function', 'horario.js y hoy.js siguen exportando lo de siempre');
}

console.log('\n── 12 · Corrección: la guardia ante datos ausentes, malformados y colecciones que no son listas ──');
{
  const { estructuraDeHorario, parcheTocaHorario, COLECCIONES_HORARIO } = horario;
  const g = (x) => guardiaDeVersionHorario(x);
  // 1. Raíz ausente legítima.
  for (const x of [null, undefined]) eq([g(x).soloLectura, g(x).motivo], [false, null], `Raíz ${x}: cuenta sin horario, se puede guardar`);
  // 2. Raíz válida de versión 1 (y lo que produce la propia aplicación).
  eq(g(BASE).soloLectura, false, 'Un horario completo sin versión (v1) se puede guardar');
  eq(g({ ...BASE, version: 1 }).soloLectura, false, 'Un horario completo con version 1 se puede guardar');
  eq(g(DEFAULT_HORARIO_TOP).soloLectura, false, 'El valor por defecto se puede guardar');
  eq(g(N).soloLectura, false, 'Lo que sale del normalizador (con campos desconocidos) se puede guardar');
  for (const x of [[], 'texto', 5, true, { horarios: {} }, { bloques: 'x' }, { horarios: [{ columnas: 7 }] }]) {
    eq(g(normalizarHorarioTop(x)).soloLectura, false, `Nada de lo que escribe la aplicación activa la guardia (normalizado de ${JSON.stringify(x)})`);
  }
  // 3. Raíz malformada de distintos tipos (también las que son «falsas»: '' y 0).
  for (const x of [[], [1, 2], 'texto', '', 0, 5, true, false]) {
    const r = g(x);
    eq([r.soloLectura, r.motivo, r.problemas[0]?.ruta], [true, 'datos_malformados', '(raíz)'], `Raíz ${JSON.stringify(x)}: solo lectura (datos malformados)`);
  }
  // La versión manda sobre la forma: una versión más nueva puede tener otra forma.
  eq(g({ version: 2, horarios: {} }).motivo, 'version_futura', 'Con una versión más nueva el motivo es la versión, no «malformado»');
  // 4. Cada colección con un tipo incorrecto.
  const C = COLECCIONES_HORARIO.horarioTop;
  for (const k of [...C.objetos, ...C.textos, ...C.libres]) {
    for (const v of ['texto', 5, { a: 1 }, true]) {
      const r = g({ ...copia(BASE), [k]: v });
      ok(r.soloLectura && r.motivo === 'datos_malformados' && r.problemas.some((p) => p.ruta === k && p.esperado === 'lista'),
        `«${k}» como ${JSON.stringify(v)}: solo lectura, y dice que se esperaba una lista`);
    }
  }
  for (const k of C.mapas) {
    for (const v of ['texto', 5, true]) {
      const r = g({ ...copia(BASE), [k]: v });
      ok(r.soloLectura && r.problemas.some((p) => p.ruta === k && p.esperado === 'objeto'), `«${k}» como ${JSON.stringify(v)}: solo lectura`);
    }
    eq(g({ ...copia(BASE), [k]: {} }).soloLectura, false, `«${k}» como objeto vale`);
  }
  const anidadas = [
    ['horarios[0].columnas', (b) => { b.horarios[0].columnas = 'texto'; }],
    ['horarios[0].filas', (b) => { b.horarios[0].filas = { a: 1 }; }],
    ['actividades[0].material', (b) => { b.actividades[0].material = 'Libro'; }],
    ['actividades[0].alias', (b) => { b.actividades[0].alias = 'mates'; }],
    ['actividades[0].etiquetas', (b) => { b.actividades[0].etiquetas = 3; }],
    ['bloques[0].etiquetas', (b) => { b.bloques[0].etiquetas = 'x'; }],
  ];
  for (const [ruta, romper] of anidadas) {
    const b = copia(BASE); romper(b);
    ok(g(b).soloLectura && g(b).problemas.some((p) => p.ruta === ruta), `«${ruta}» que no es una lista: solo lectura`);
  }
  const elementos = [
    ['horarios[0]', { horarios: ['texto'] }], ['actividades[0]', { actividades: [5] }], ['bloques[0]', { bloques: [true] }],
    ['excepciones[0]', { excepciones: ['x'] }], ['grupos[0]', { grupos: [1] }], ['completadas[0]', { completadas: [5] }],
    ['horarios[0].columnas[0]', { horarios: [{ id: 'h', columnas: ['x'] }] }], ['actividades[0].material[0]', { actividades: [{ id: 'a', material: [{}] }] }],
  ];
  for (const [ruta, x] of elementos) ok(g(x).soloLectura && g(x).problemas.some((p) => p.ruta === ruta), `Un elemento de otro tipo en «${ruta}»: solo lectura (se perdería al guardar)`);
  // null no guarda nada que se pueda perder: no bloquea, pero se avisa.
  eq(g({ ...copia(BASE), horarios: null, mochila: null }).soloLectura, false, 'Una colección guardada como null no bloquea (no hay nada que perder)');
  eq(estructuraDeHorario({ horarios: null, bloques: [null] }).nulos, ['horarios', 'bloques[0]'], 'Pero se apunta');
  // Calculada sobre lo crudo, sin tocarlo.
  const congelado = congelar(copia({ ...BASE, actividades: 'texto' }));
  const antes = JSON.stringify(congelado);
  ok(g(congelado).soloLectura && JSON.stringify(congelado) === antes, 'La guardia funciona sobre datos congelados y no los cambia');

  // El diagnóstico NO presenta una colección malformada como vacía.
  for (const k of ['horarios', 'actividades', 'excepciones', 'bloques']) {
    const d = diagnosticoHorarios({ ...copia(BASE), [k]: { roto: true } }, { hoy: '2026-11-09' });
    const h = d.hallazgos.find((x) => x.id === 'colecciones_malformadas');
    const recuento = k === 'horarios' ? d.recuentos.horarios.total : d.recuentos[{ actividades: 'actividades', excepciones: 'excepciones', bloques: 'reglas' }[k]];
    ok(h && h.gravedad === 'riesgo' && h.detalle.includes(k) && recuento === null && d.estado === 'con_datos' && d.version.soloLectura,
      `Diagnóstico: «${k}» malformado sale como riesgo, su recuento es «no se puede leer» (no 0) y la guardia está activa`);
  }
  {
    const d = diagnosticoHorarios({ horarios: {}, bloques: 'x', excepciones: 5, actividades: true }, { hoy: '2026-11-09' });
    ok(d.estado === 'con_datos', 'Con todas las colecciones malformadas NO dice «vacío»');
    const d2 = diagnosticoHorarios({ horarios: null }, { hoy: '2026-11-09' });
    ok(d2.hallazgos.some((x) => x.id === 'colecciones_nulas' && x.gravedad === 'aviso'), 'Una colección guardada vacía (null) se avisa');
    const raiz = diagnosticoHorarios(['a'], { hoy: '2026-11-09' });
    ok(raiz.version.soloLectura && raiz.version.motivo === 'datos_malformados' && raiz.hallazgos[0].id === 'no_es_objeto', 'Raíz malformada: el diagnóstico dice solo lectura y por qué');
  }

  // Ninguna colección que el normalizador lea con «Array.isArray(g.x) ? … : []» queda sin vigilar.
  {
    const fuente = leer('src/lib/horario.js');
    const leidas = new Set([...fuente.matchAll(/Array\.isArray\(g\.(\w+)\)/g)].map((m) => m[1]));
    for (const m of fuente.matchAll(/g\.(\w+) && typeof g\.\1 === 'object'/g)) leidas.add(m[1]);
    const vigiladas = new Set(Object.values(COLECCIONES_HORARIO).flatMap((f) => [...f.objetos, ...f.textos, ...f.libres, ...f.mapas]));
    const sinVigilar = [...leidas].filter((k) => !vigiladas.has(k));
    eq(sinVigilar, [], `Toda colección que el normalizador convierte en vacía está en COLECCIONES_HORARIO (${leidas.size} leídas)`);
  }

  // 7. Un parche con horarioTop: null también toca el horario.
  eq([parcheTocaHorario({ horarioTop: null }), parcheTocaHorario({ horarioTop: undefined }), parcheTocaHorario({ horarioTop: {} })], [true, true, true],
    'parcheTocaHorario: con la clave presente, sea cual sea su valor (null, undefined, objeto)');
  eq([parcheTocaHorario({ estudios: {} }), parcheTocaHorario({}), parcheTocaHorario(null), parcheTocaHorario('horarioTop')], [false, false, false, false],
    'Sin la clave, no lo toca');
  const app = sinComentarios(leer('src/App.jsx'));
  ok(app.indexOf('parcheTocaHorario(patch) && horarioSoloLecturaRef.current') < app.indexOf('const nextHist = [...history, snapshot]'),
    'App.jsx lo comprueba antes de escribir nada (ni el historial)');
}

console.log('\n── 13 · Corrección: HorarioView no deja controles de escritura en solo lectura ──');
{
  const v = sinComentarios(leer('src/views/HorarioView.jsx'));
  ok(/const aplicar = \(nuevo\) => \{ if \(soloLectura\) return SIN_GUARDAR;/.test(v) && /const aplicarResultado = \(r\) => \{\s*if \(soloLectura\) return SIN_GUARDAR;/.test(v),
    'aplicar y aplicarResultado no llaman a onCambiar en solo lectura (segunda puerta)');
  ok(/if \(cambio && !soloLectura\) onCambiar\(nuevo\);/.test(v), 'Avisos: en solo lectura no se apuntan en el horario');
  ok(/accionesMochila=\{soloLectura \? null : accionesMochila\}/.test(v), 'Mochila: sin acciones en solo lectura');
  ok(/accionesAvisos=\{soloLectura \? null : accionesAvisos\}/.test(v), 'Avisos: sin leer ni archivar en solo lectura');
  ok(/onCompletar=\{soloLectura \? null :/.test(v), 'Marcar clases como hechas: no en solo lectura');
  ok(/aplicar: soloLectura \? null :/.test(v), 'Planificador: sin «Ponlo en mi horario» en solo lectura');
  ok(/ejecutar: soloLectura \? null :/.test(v) && /ejecutarTodo: soloLectura \? null :/.test(v) && /deshacer: soloLectura \? null :/.test(v), 'Automatizaciones: sin ejecutar ni deshacer en solo lectura');
  ok(/onCelda=\{soloLectura \? null :/.test(v) && /edicion=\{edicion && !soloLectura\}/.test(v), 'Cuadrícula: sin celdas para añadir ni modo edición');
  ok((v.match(/soloLectura=\{!!soloLectura\}/g) || []).length === 2, 'La ficha de una actividad y el panel de una clase reciben la solo lectura');
  ok(/\{edicion && !soloLectura && vista === 'semana' &&/.test(v), 'Los paneles de edición no se pintan en solo lectura');
  ok(/return creando && !soloLectura \?/.test(v), 'Crear horario tampoco desde la pantalla vacía');
  // Cada panel esconde sus botones cuando no le dan la función (en vez de un botón que no hace nada).
  ok(/\{onLeer \? \(/.test(v) && /\{onArchivar && \(/.test(v), 'PanelAvisos: sin funciones, sin botones');
  ok(/\{!hecho && onAplicar && \(/.test(v), 'PanelPlan: sin función, sin «Ponlo en mi horario»');
  ok(/\{onEjecutar && \(/.test(v), 'PanelAutomatizaciones: sin función, sin «Sí / Ahora no»');
  ok(/return onMarcar \? \(/.test(v), 'PanelMochila: sin función, la casilla no es un botón');
  ok(/onCelda \? \(/.test(v), 'Cuadrícula: sin función, la celda vacía no es un botón');
}

console.log('\n── 14 · Corrección: el diagnóstico distingue colección interna vacía, con elementos e ilegible ──');
{
  const { estadoDeColeccion, resumenDeColeccionInterna } = await import('../src/lib/diagnosticoHorario.js');
  const dg = (x) => diagnosticoHorarios(x, { hoy: '2026-11-09' });
  eq(['a', 1, null, undefined, [], [1]].map((v) => estadoDeColeccion(v === 'a' ? 'texto' : v)), ['ilegible', 'ilegible', 'nula', 'ausente', 'vacia', 'con_elementos'],
    'estadoDeColeccion: texto/número ilegibles, null nula, ausente, vacía y con elementos');
  // El caso de la revisión, y sus dos hermanos.
  const conColumnas = (columnas) => ({ horarios: [{ id: 'h1', columnas, filas: [] }] });
  {
    const vacia = dg(conColumnas([]));
    eq([vacia.recuentos.columnas.total, vacia.recuentos.colecciones.columnas.vacias, vacia.version.soloLectura], [0, 1, false], '1. columnas: [] → 0 columnas, es una lista vacía y se puede guardar');
    const texto = dg(conColumnas('texto'));
    eq([texto.recuentos.columnas.total, texto.recuentos.columnas.sinDia, texto.recuentos.colecciones.columnas.ilegibles], [null, null, 1], '2. columnas: «texto» → «No se puede leer» (null), nunca 0');
    ok(texto.hallazgos.some((h) => h.id === 'colecciones_malformadas' && h.detalle.includes('horarios[0].columnas')), '2. Y el diagnóstico dice la ruta: horarios[0].columnas');
    ok(texto.version.soloLectura && texto.version.motivo === 'datos_malformados', '5. Y la guardia sigue bloqueando la escritura');
    const nula = dg(conColumnas(null));
    eq([nula.recuentos.columnas.total, nula.recuentos.colecciones.columnas.nulas, nula.version.soloLectura], [0, 1, false],
      '3. columnas: null → sin contenido (0), no bloquea (regla aprobada: no hay nada que perder)');
    ok(nula.hallazgos.some((h) => h.id === 'colecciones_nulas' && h.detalle.includes('horarios[0].columnas')), '3. Pero se avisa, con su ruta');
    const conElementos = dg(conColumnas([{ id: 'c1', dia: 1 }, { id: 'c2', dia: 2 }]));
    eq([conElementos.recuentos.columnas.total, conElementos.recuentos.colecciones.columnas.conElementos], [2, 1], 'Columnas válidas con elementos: se cuentan');
    const mezcla = dg({ horarios: [{ id: 'h1', columnas: [{ id: 'c1', dia: 1 }, { id: 'c2', dia: 2 }] }, { id: 'h2', columnas: 'texto' }] });
    eq(mezcla.recuentos.columnas.total, null, 'Un horario legible y otro no: el total NO es el parcial (2), es «No se puede leer»');
    const elemento = dg(conColumnas([{ id: 'c1', dia: 1 }, 'x']));
    eq([elemento.recuentos.columnas.total, elemento.recuentos.colecciones.columnas.elementosIlegibles, elemento.version.soloLectura], [null, 1, true],
      'Una columna que no es un objeto: el total no se puede leer, y la guardia bloquea');
  }
  // 4. La misma distinción en todas las colecciones internas que vigila la guardia.
  const INTERNAS = [
    ['columnas', 'horarios', 'columnas', (v) => ({ horarios: [{ id: 'h', columnas: v }] }), [{ id: 'c', dia: 1 }]],
    ['filas', 'horarios', 'filas', (v) => ({ horarios: [{ id: 'h', columnas: [], filas: v }] }), [{ id: 'f' }]],
    ['materialActividades', 'actividades', 'material', (v) => ({ actividades: [{ id: 'a', material: v }] }), ['Libro']],
    ['aliasActividades', 'actividades', 'alias', (v) => ({ actividades: [{ id: 'a', alias: v }] }), ['mates']],
    ['etiquetasActividades', 'actividades', 'etiquetas', (v) => ({ actividades: [{ id: 'a', etiquetas: v }] }), ['ciencias']],
    ['etiquetasClases', 'bloques', 'etiquetas', (v) => ({ horarios: [{ id: 'h', columnas: [{ id: 'c', dia: 1 }] }], bloques: [{ id: 'b', horarioId: 'h', columnaId: 'c', inicio: '08:00', fin: '09:00', etiquetas: v }] }), ['examen']],
  ];
  for (const [clave, padre, campo, con, valida] of INTERNAS) {
    const ruta = `${padre}[0].${campo}`;
    const rv = dg(con([])).recuentos.colecciones[clave];
    const rc = dg(con(valida)).recuentos.colecciones[clave];
    const ri = dg(con('texto'));
    const rn = dg(con(null));
    ok(rv.total === 0 && rv.vacias === 1 && rc.total === 1 && rc.conElementos === 1,
      `4. ${ruta}: vacía (0) y con elementos (1) se distinguen`);
    ok(ri.recuentos.colecciones[clave].total === null && ri.recuentos.colecciones[clave].ilegibles === 1,
      `4. ${ruta}: ilegible → «No se puede leer» (null), no 0`);
    ok(ri.version.soloLectura && ri.hallazgos.some((h) => h.id === 'colecciones_malformadas' && h.detalle.includes(ruta)),
      `4/5. ${ruta}: la guardia bloquea y el diagnóstico dice la ruta`);
    ok(rn.recuentos.colecciones[clave].nulas === 1 && rn.recuentos.colecciones[clave].total === 0 && !rn.version.soloLectura
      && rn.hallazgos.some((h) => h.id === 'colecciones_nulas' && h.detalle.includes(ruta)),
      `3/4. ${ruta}: null se trata según la regla aprobada (sin contenido, no bloquea, se avisa)`);
    const elemMalo = dg(con([...valida, 7]));
    ok(elemMalo.recuentos.colecciones[clave].total === null && elemMalo.version.soloLectura, `4. ${ruta}: un elemento de otro tipo → ilegible y la guardia bloquea`);
  }
  eq(Object.keys(dg({ horarios: [] }).recuentos.colecciones).sort(), INTERNAS.map((x) => x[0]).sort(), 'Se resumen todas las colecciones internas que vigila la guardia, y solo ellas');
  {
    const vigiladas = Object.entries(horario.COLECCIONES_HORARIO).filter(([k]) => k !== 'horarioTop')
      .flatMap(([, f]) => [...f.objetos, ...f.textos, ...f.libres, ...f.mapas]).length;
    eq(vigiladas, INTERNAS.length, 'Y son tantas como las internas de COLECCIONES_HORARIO (si se añade una, esta prueba lo exige)');
  }
  eq(resumenDeColeccionInterna([{ x: [null, 'a'] }], 'x', 'texto').total, 1, 'Un elemento null no se cuenta ni se da por ilegible');

  // Las referencias: lo que no se puede leer no permite decir que algo «no existe» en ello.
  {
    const base = { horarios: [{ id: 'h', columnas: 'texto' }], bloques: [{ id: 'b', horarioId: 'h', columnaId: 'c', inicio: '08:00', fin: '09:00' }] };
    const d = dg(base);
    ok(!d.hallazgos.some((h) => h.id === 'reglas_columna_inexistente'), 'Clases de un horario con columnas ilegibles: NO dice «columna que ya no existe»');
    ok(d.limitaciones.some((t) => /columnas no se pueden leer/.test(t)), 'Y dice que esa comprobación no se ha hecho');
    const control = dg({ horarios: [{ id: 'h', columnas: [] }], bloques: base.bloques });
    ok(control.hallazgos.some((h) => h.id === 'reglas_columna_inexistente'), 'Control: con columnas legibles y vacías, sí lo dice');
    const acts = dg({ actividades: 'texto', bloques: [{ id: 'b', horarioId: 'h', columnaId: 'c', actividadId: 'a1' }] });
    ok(!acts.hallazgos.some((h) => h.id === 'reglas_actividad_inexistente'), 'Actividades ilegibles: NO dice «actividad que ya no existe»');
    const bloq = dg({ bloques: 'texto', excepciones: [{ id: 'e', fecha: '2026-11-09', tipo: 'cancelado', bloqueId: 'b1' }] });
    ok(!bloq.hallazgos.some((h) => h.id === 'excepciones_clase_inexistente'), 'Clases ilegibles: NO dice «cambio de una clase que ya no existe»');
    const hor = dg({ horarios: 'texto', bloques: [{ id: 'b', horarioId: 'h', columnaId: 'c' }] });
    ok(!hor.hallazgos.some((h) => h.id === 'reglas_horario_inexistente'), 'Horarios ilegibles: NO dice «horario que ya no existe»');
  }

  // 6. Los datos originales no se tocan durante el diagnóstico, en ninguno de los casos.
  // Dos formas, porque cada una caza lo que la otra no:
  //   · CONGELADO: escribir lanza un error, y ese error NO se captura aquí — si el diagnóstico
  //     escribiera, la suite se caería (y verificar.sh saldría rojo), en vez de esconderlo;
  //   · SIN CONGELAR (como en la aplicación): un cambio que el diagnóstico hiciera dentro de un
  //     `try` no lanzaría nada, pero dejaría los datos distintos, y la comparación lo ve.
  // El resultado se decide por lo que se cuenta, nunca con un `ok(true)` fijo.
  const entradas = [];
  for (const [, , , con, valida] of INTERNAS) for (const v of [[], valida, 'texto', null]) entradas.push(con(v));
  for (const v of ['texto', null, []]) for (const k of ['horarios', 'actividades', 'bloques']) entradas.push({ [k]: v });
  let comparados = 0;
  const cambiados = [];
  for (const entrada of entradas) {
    const congelado = congelar(copia(entrada));
    const antesCongelado = JSON.stringify(congelado);
    dg(congelado);
    const libre = copia(entrada);
    const antesLibre = JSON.stringify(libre);
    dg(libre);
    comparados += 1;
    if (JSON.stringify(congelado) !== antesCongelado || JSON.stringify(libre) !== antesLibre) cambiados.push(antesLibre);
  }
  eq([comparados, cambiados], [entradas.length, []],
    `6. El diagnóstico no modifica los datos: ${entradas.length} entradas, congeladas y sin congelar, y ninguna cambia`);
  // Y la comprobación sí se pone roja: un «diagnóstico» que escribe deja los datos distintos.
  {
    const libre = copia(INTERNAS[0][3]([]));
    const antes = JSON.stringify(libre);
    try { libre.horarios[0].columnas.push({ id: 'cambio' }); } catch { /* una escritura tragada también cuenta */ }
    ok(JSON.stringify(libre) !== antes, '6. Control: una escritura (aunque se trague su error) SÍ cambia lo comparado');
  }
}

console.log('\n── 15 · Corrección: una colección PRINCIPAL ilegible no deja sus recuentos internos en 0 ──');
{
  const dg = (x) => diagnosticoHorarios(x, { hoy: '2026-11-09' });
  const C = (x) => dg(x).recuentos.colecciones;
  const DEPENDEN = {
    horarios: ['columnas', 'filas'],
    actividades: ['materialActividades', 'aliasActividades', 'etiquetasActividades'],
    bloques: ['etiquetasClases'],
  };
  const TODAS = Object.values(DEPENDEN).flat();
  for (const [principal, internas] of Object.entries(DEPENDEN)) {
    const d = dg({ [principal]: 'texto' });
    const c = d.recuentos.colecciones;
    eq(internas.map((k) => c[k].total), internas.map(() => null),
      `«${principal}: 'texto'» → ${internas.join(', ')}: «No se puede leer» (null), nunca 0`);
    ok(internas.every((k) => c[k].padreIlegible === true), `«${principal}: 'texto'» → y dicen por qué: su colección principal no se puede leer`);
    eq(TODAS.filter((k) => !internas.includes(k)).map((k) => c[k].total), TODAS.filter((k) => !internas.includes(k)).map(() => 0),
      `«${principal}: 'texto'» → los recuentos que no dependen de ella siguen en 0`);
    ok(d.version.soloLectura && d.version.motivo === 'datos_malformados', `«${principal}: 'texto'» → la guardia sigue bloqueando la escritura`);
  }
  eq(dg({ horarios: 'texto' }).recuentos.columnas, { total: null, sinDia: null, ocultas: null, conGrupo: null },
    '«horarios: \'texto\'» → la fila entera de columnas es «No se puede leer»');
  // Ausente, null y [] conservan su comportamiento: 0, y se puede guardar.
  for (const principal of Object.keys(DEPENDEN)) {
    for (const [n, x] of [['ausente', {}], ['null', { [principal]: null }], ['[]', { [principal]: [] }]]) {
      const d = dg(x);
      eq([TODAS.map((k) => d.recuentos.colecciones[k].total), d.version.soloLectura, d.estado], [TODAS.map(() => 0), false, 'vacio'],
        `«${principal}» ${n} → todos los recuentos internos en 0, editable y vacío`);
    }
    ok(!dg({ [principal]: [null] }).recuentos.colecciones[DEPENDEN[principal][0]].padreIlegible, `«${principal}: [null]» → un hueco null no hace ilegible la principal`);
  }
  // Los datos válidos dan lo mismo que antes.
  const valido = {
    horarios: [{ id: 'h', columnas: [{ id: 'c1', dia: 1 }, { id: 'c2', dia: 2 }], filas: [{ id: 'f1' }] }],
    actividades: [{ id: 'a', material: ['Libro', 'Bata'], alias: ['mates'], etiquetas: [] }],
    bloques: [{ id: 'b', horarioId: 'h', columnaId: 'c1', inicio: '08:00', fin: '09:00', etiquetas: ['examen'] }],
  };
  eq(TODAS.map((k) => C(valido)[k].total), [2, 1, 2, 1, 0, 1], 'Datos válidos: columnas 2, franjas 1, material 2, alias 1, etiquetas de actividad 0, de clase 1');
  ok(TODAS.every((k) => C(valido)[k].padreIlegible === false) && !dg(valido).version.soloLectura, 'Datos válidos: ninguna principal ilegible, y editable');
}

console.log('\n── 16 · Corrección: un elemento malformado en una colección principal invalida sus recuentos internos ──');
{
  const dg = (x) => diagnosticoHorarios(x, { hoy: '2026-11-09' });
  const DEPENDEN = {
    horarios: ['columnas', 'filas'],
    actividades: ['materialActividades', 'aliasActividades', 'etiquetasActividades'],
    bloques: ['etiquetasClases'],
  };
  const TODAS = Object.values(DEPENDEN).flat();
  const VALIDOS = {
    horarios: [{ id: 'h1', columnas: [{ id: 'c1', dia: 1 }], filas: [{ id: 'f1' }] }, { id: 'h2', columnas: [{ id: 'c2', dia: 2 }], filas: [] }],
    actividades: [{ id: 'a1', material: ['Libro'], alias: ['mates'], etiquetas: ['ciencias'] }, { id: 'a2', material: [], alias: [], etiquetas: [] }],
    bloques: [{ id: 'b1', horarioId: 'h', columnaId: 'c', inicio: '08:00', fin: '09:00', etiquetas: ['x'] }, { id: 'b2', horarioId: 'h', columnaId: 'c', inicio: '09:00', fin: '10:00', etiquetas: [] }],
  };
  const ESPERADO_VALIDO = { columnas: 2, filas: 1, materialActividades: 1, aliasActividades: 1, etiquetasActividades: 1, etiquetasClases: 1 };
  const MALOS = ['texto', 5, true, [1]];
  for (const [principal, internas] of Object.entries(DEPENDEN)) {
    const [v1, v2] = VALIDOS[principal];
    // Posiciones: delante, en medio, al final.
    const posiciones = { delante: (m) => [m, v1, v2], 'en medio': (m) => [v1, m, v2], 'al final': (m) => [v1, v2, m] };
    for (const [donde, monta] of Object.entries(posiciones)) {
      for (const malo of MALOS) {
        const d = dg({ [principal]: monta(malo) });
        const c = d.recuentos.colecciones;
        ok(internas.every((k) => c[k].total === null && c[k].padreIlegible === true),
          `«${principal}» con ${JSON.stringify(malo)} ${donde} de dos válidos → ${internas.join(', ')}: «No se puede leer», no el parcial`);
        ok(d.version.soloLectura && d.version.motivo === 'datos_malformados', `«${principal}» con ${JSON.stringify(malo)} ${donde} → la guardia bloquea`);
        ok(TODAS.filter((k) => !internas.includes(k)).every((k) => c[k].total === 0),
          `«${principal}» con ${JSON.stringify(malo)} ${donde} → los recuentos que no dependen de ella no cambian`);
      }
    }
    // Válidos: el recuento correcto, editable.
    const val = dg({ [principal]: [v1, v2] });
    eq(internas.map((k) => val.recuentos.colecciones[k].total), internas.map((k) => ESPERADO_VALIDO[k]),
      `«${principal}» con dos elementos válidos → recuentos correctos`);
    ok(!val.version.soloLectura && internas.every((k) => val.recuentos.colecciones[k].padreIlegible === false), `«${principal}» válido → editable y legible`);
    // Huecos null / undefined: comportamiento anterior (no son elementos malformados).
    for (const hueco of [null, undefined]) {
      const h = dg({ [principal]: [v1, hueco, v2] });
      eq(internas.map((k) => h.recuentos.colecciones[k].total), internas.map((k) => ESPERADO_VALIDO[k]),
        `«${principal}» con un hueco ${hueco} entre dos válidos → los mismos recuentos que sin él`);
      ok(!h.version.soloLectura && internas.every((k) => h.recuentos.colecciones[k].padreIlegible === false),
        `«${principal}» con un hueco ${hueco} → no bloquea ni hace ilegible la principal (semántica anterior)`);
    }
    // Vacía, ausente y null: intactos.
    for (const [n, x] of [['[]', { [principal]: [] }], ['ausente', {}], ['null', { [principal]: null }]]) {
      const d = dg(x);
      ok(internas.every((k) => d.recuentos.colecciones[k].total === 0 && d.recuentos.colecciones[k].padreIlegible === false) && !d.version.soloLectura,
        `«${principal}» ${n} → recuentos internos a 0 y editable, como antes`);
    }
  }
  // Los datos originales siguen sin modificarse, también con elementos malformados.
  for (const principal of Object.keys(DEPENDEN)) {
    const libre = { [principal]: ['texto', ...VALIDOS[principal]] };
    const antes = JSON.stringify(libre);
    dg(libre);
    const congelado = congelar(copia(libre));
    dg(congelado);
    eq(JSON.stringify(libre), antes, `«${principal}» con un elemento malformado → el diagnóstico no modifica los datos (congelados y sin congelar)`);
  }
}

console.log(`\n${fallos ? '✗' : '✓'} ${n - fallos}/${n} comprobaciones (entrega A de Horarios)\n`);
if (fallos) process.exit(1);
