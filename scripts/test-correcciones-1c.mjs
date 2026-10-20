/* ===========================================================================
   FASE 1C — CORRECCIONES FINALES TRAS LA AUDITORÍA ADVERSARIAL

   La auditoría de las Fases 1 y 1B encontró cuatro cosas que decían algo falso
   o imposible, y esta suite reproduce cada una con su escenario y el número
   exacto que tiene que salir:

     1 · CX-09 — dejar de registrar entrenamientos y seguir con el Diario
         llenaba el grupo «sin entrenamiento» de días en los que no se sabe
         qué pasó, y la comparación salía con una diferencia inventada.
     2 · Imagen personal — «Tu entrenamiento» solo miraba la calistenia de
         antes y mandaba a una sección que ya no existe.
     3 · «Primer PR» — imposible para una cuenta nueva.
     4 · Fechas — un entrenamiento con fecha futura salía como «hoy», y «hoy»
         no cambiaba a medianoche con la aplicación abierta.

   ⚠️ Los entrenamientos se fabrican con el flujo de la aplicación
   (constructor → empezar → series → finalizar → guardar), como en la 1B.
   =========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { correlacionEntrenoAnimo, animoPorDia, esAnimoValido, DIAS_MINIMOS_POR_GRUPO_ENTRENO } from '../src/lib/correlaciones.js';
import { fechasDeEntreno } from '../src/lib/fechasDeEntreno.js';
import { fechasConEntrenamiento } from '../src/lib/sesionesCompletadas.js';
import { lunesDe } from '../src/lib/rachas.js';
import { lecturaDeEntrenamiento, loQueYaSabemos, seDebePreguntar, datoGlobalEH } from '../src/lib/configuracionInicial.js';
import { leerDato, todosLosDatos } from '../src/lib/datosEstiloHombre.js';
import { FUENTES_GLOBALES, DEFAULT_ESTILO_HOMBRE } from '../src/lib/estiloDeHombre.js';
import { calcularLogros } from '../src/lib/logros.js';
import { primerRecordPersonal } from '../src/lib/progresion.js';
import { hayDatosPara } from '../src/lib/numeros.js';
import { calcularResumenModulo } from '../src/lib/resumenesHub.js';
import { prediccionConstanciaEntreno } from '../src/lib/predicciones.js';
import { empezarSesion, editarSerie, marcarSerie, ejerciciosDeSesion, normalizarFitnessConSesiones } from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { crearRutina, anadirEjercicio, editarLinea } from '../src/lib/constructor.js';
import { DEFAULT_FITNESS, sinDuplicadosPorId } from '../src/lib/fitness.js';
import { addDays } from '../src/lib/helpers.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel) => fs.readFileSync(path.join(raiz, rel), 'utf8');

let pasa = 0;
const fallos = [];
const ok = (c, m) => { if (c) { pasa++; console.log(`  ✓ ${m}`); } else { fallos.push(m); console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(Object.is(a, b), `${m}${Object.is(a, b) ? '' : ` — esperaba ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);
const mismos = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

/* ── Fábricas ─────────────────────────────────────────────────────────────── */

/** Un entrenamiento COMPLETADO de verdad: una serie de dominadas con `reps` (y lastre si se da). */
function entrenamiento(fecha, { reps = 8, lastre = null, nombre = 'Tirón', hora = 18 } = {}) {
  let r = crearRutina({ nombre });
  r = anadirEjercicio(r, 'dominada-prona');
  r = editarLinea(r, r.lineas[0].id, { series: 1, tipoCarga: lastre ? 'lastre' : 'corporal' });
  const inicio = new Date(`${fecha}T${String(hora).padStart(2, '0')}:00:00`).getTime();
  let s = empezarSesion({ nombre, lineas: r.lineas, hoy: fecha, ahora: inicio });
  const e = ejerciciosDeSesion(s)[0];
  s = editarSerie(s, e.id, e.series[0].id, lastre ? { reps, peso: lastre } : { reps });
  s = marcarSerie(s, e.id, e.series[0].id, true);
  const fin = guardarEntrenamiento(pasarAFinalizacion(s, { ahora: inicio + 3000000 }), { confirmado: true, ahora: inicio + 3001000 });
  if (!fin || !fin.sesion) throw new Error(`No se pudo fabricar el entrenamiento del ${fecha}`);
  return fin.sesion;
}
/** Un entrenamiento EMPEZADO y sin terminar, con más repeticiones que nunca. */
function enCurso(fecha, reps = 20) {
  let r = crearRutina({ nombre: 'Pierna' });
  r = anadirEjercicio(r, 'dominada-prona');
  let s = empezarSesion({ nombre: 'Pierna', lineas: r.lineas, hoy: fecha, ahora: new Date(`${fecha}T10:00:00`).getTime() });
  const e = ejerciciosDeSesion(s)[0];
  s = editarSerie(s, e.id, e.series[0].id, { reps });
  return marcarSerie(s, e.id, e.series[0].id, true);
}
const conSesiones = (sesiones) => normalizarFitnessConSesiones({ ...DEFAULT_FITNESS, sesiones });
const rango = (desde, hasta) => { const l = []; for (let f = desde; f <= hasta; f = addDays(f, 1)) l.push(f); return l; };
const diario = (fechas, animo) => fechas.map((f, i) => ({ id: `d-${f}`, fecha: f, animo: typeof animo === 'function' ? animo(f, i) : animo }));

/** La regla de la Fase 1B, escrita aquí para REPRODUCIR el fallo: todo el Diario desde el primer
 *  entrenamiento, sin final ni semanas. */
function reglaDeLa1B({ fitness = null, calistenia = null }, entradas) {
  const e = fechasDeEntreno({ fitness, calistenia });
  const dias = e.primera ? animoPorDia(entradas).filter((d) => d.fecha >= e.primera) : [];
  const media = (l) => (l.length ? Math.round((l.reduce((s, d) => s + d.animo, 0) / l.length) * 10) / 10 : null);
  const con = dias.filter((d) => e.todas.has(d.fecha));
  const sin = dias.filter((d) => !e.todas.has(d.fecha));
  return { con: con.length, sin: sin.length, mCon: media(con), mSin: media(sin) };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. CX-09 · Dejar de registrar no fabrica una diferencia de ánimo ──');

eq(lunesDe('2026-06-01'), '2026-06-01', 'Escenario: el 1 de junio de 2026 es lunes (la semana empieza el lunes)');
/* Dos semanas apuntando (lunes, miércoles y viernes) y luego nada; el Diario sigue hasta octubre.
   El ánimo es 4 TODO el tiempo que apuntaba —entrenara o no— y 3 después: la única diferencia
   real entre grupos es cuándo dejó de apuntar. */
const DIAS_ENTRENO = ['2026-06-01', '2026-06-03', '2026-06-05', '2026-06-08', '2026-06-10', '2026-06-12'];
const fitParado = conSesiones(DIAS_ENTRENO.map((f) => entrenamiento(f)));
const diarioLargo = diario(rango('2026-06-01', '2026-10-18'), (f) => (f <= '2026-06-14' ? 4 : 3));
eq(diarioLargo.length, 140, 'Escenario: 140 días de Diario');

const antes = reglaDeLa1B({ fitness: fitParado }, diarioLargo);
ok(antes.con === 6 && antes.sin === 134 && antes.mCon === 4 && antes.mSin === 3.1,
  `🐛 Reproducido con la regla de la 1B: 6 días «con» (ánimo 4) frente a 134 «sin» (ánimo 3,1) — una diferencia que solo dice cuándo dejó de apuntar (${JSON.stringify(antes)})`);

const c = correlacionEntrenoAnimo({ fitness: fitParado }, diarioLargo);
eq(c.desde, '2026-06-01', 'Ahora: el periodo empieza en el primer entrenamiento registrado');
eq(c.hasta, '2026-06-12', '…y termina en el último');
eq(c.diasConEntreno, 6, '…6 días con entrenamiento');
eq(c.diasSinEntreno, 6, '🚨 …y solo 6 sin él: los días de descanso ENTRE entrenamientos registrados (2, 4, 6, 7, 9 y 11 de junio)');
eq(c.mediaAnimoConEntreno, 4, '…ánimo 4 los días con entrenamiento');
eq(c.mediaAnimoSinEntreno, 4, '🚨 …y 4 los días sin él: la diferencia inventada desaparece');
eq(c.diasFuera, 128, '…con los 128 días posteriores fuera de la comparación, y contados');
eq(c.semanasComparadas, 2, '…en las 2 semanas en las que registró');

/* Un hueco EN MEDIO: semana A y semana C con entrenamientos, cinco semanas sin registro entre medias. */
const fitHueco = conSesiones(['2026-06-01', '2026-06-03', '2026-06-05', '2026-07-13', '2026-07-15', '2026-07-17'].map((f) => entrenamiento(f)));
const diarioHueco = diario(rango('2026-06-01', '2026-07-19'), (f) => (f >= '2026-06-08' && f <= '2026-07-12' ? 1 : 4));
const cHueco = correlacionEntrenoAnimo({ fitness: fitHueco }, diarioHueco);
const antesHueco = reglaDeLa1B({ fitness: fitHueco }, diarioHueco);
ok(antesHueco.mSin < 2, `🐛 Con la regla de la 1B, el hueco del medio hundía la media «sin» (${antesHueco.mSin})`);
eq(cHueco.diasSinEntreno, 6, '🚨 Un hueco de cinco semanas EN MEDIO no cuenta: solo los descansos de las dos semanas registradas');
eq(cHueco.mediaAnimoSinEntreno, 4, '…así que el ánimo «sin» es el de esas semanas (4), no el del hueco (1)');
eq(cHueco.diasFuera, 37, '…y los 35 días del hueco más los 2 de después del último quedan fuera (37)');

/* Después del último entrenamiento, aunque sea la misma semana: no se sabe todavía. */
const fitSemana = conSesiones(['2026-10-05', '2026-10-07'].map((f) => entrenamiento(f)));
const cSemana = correlacionEntrenoAnimo({ fitness: fitSemana }, diario(rango('2026-10-05', '2026-10-11'), 3));
eq(cSemana.diasConEntreno + cSemana.diasSinEntreno, 3, '🚨 Los días posteriores al último entrenamiento NO se dan por descanso automáticamente, ni dentro de la misma semana (se comparan 5, 6 y 7)');
eq(cSemana.diasFuera, 4, '…los 4 restantes quedan fuera');

/* Un registro constante sigue enseñando una diferencia REAL. */
const lunes = ['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28'];
const constantes = lunes.flatMap((l) => [l, addDays(l, 2), addDays(l, 4)]);
const fitConstante = conSesiones(constantes.map((f) => entrenamiento(f)));
const cConstante = correlacionEntrenoAnimo({ fitness: fitConstante }, diario(rango('2026-09-07', '2026-10-04'), (f) => (constantes.includes(f) ? 5 : 3)));
ok(cConstante.diasConEntreno === 12 && cConstante.diasSinEntreno === 14 && cConstante.mediaAnimoConEntreno === 5 && cConstante.mediaAnimoSinEntreno === 3 && cConstante.suficientesDatos,
  `Con un registro constante, la diferencia de verdad se sigue viendo: 12 días con (5) y 14 sin (3) (${JSON.stringify({ con: cConstante.diasConEntreno, sin: cConstante.diasSinEntreno })})`);
eq(cConstante.diasFuera, 2, '…y solo el fin de semana después del último entrenamiento queda fuera');

/* El mínimo de tres por grupo no cambia. */
eq(DIAS_MINIMOS_POR_GRUPO_ENTRENO, 3, 'El mínimo sigue siendo 3 días por grupo (no se cambia sin una razón demostrable)');
const tresTres = correlacionEntrenoAnimo({ fitness: conSesiones(['2026-10-05', '2026-10-07', '2026-10-09'].map((f) => entrenamiento(f))) }, diario(rango('2026-10-05', '2026-10-09'), 3));
eq(tresTres.diasSinEntreno, 2, 'Lunes, miércoles y viernes con el Diario de lunes a viernes: 3 con y 2 sin');
eq(tresTres.suficientesDatos, false, '…y con 2 sin, NO hay conclusión');
const sinNada = correlacionEntrenoAnimo({ fitness: conSesiones([]) }, diarioLargo);
ok(sinNada.suficientesDatos === false && sinNada.diasConEntreno === 0 && sinNada.diasSinEntreno === 0 && sinNada.diasFuera === 0 && sinNada.hasta === null,
  'Sin ningún entrenamiento registrado: ni «con» ni «sin» ni días fuera — no hay periodo');

/* La calistenia de antes sigue contando por sus fechas, una vez por día, y abre su semana. */
const calistenia = { planche: { sesiones: [{ fecha: '2026-06-01' }, { fecha: '2026-06-01' }, { fecha: '2026-06-03' }, { fecha: 'basura' }] } };
const cCal = correlacionEntrenoAnimo({ fitness: conSesiones([entrenamiento('2026-06-03'), entrenamiento('2026-06-05')]), calistenia }, diario(rango('2026-06-01', '2026-06-07'), 3));
ok(cCal.diasConEntreno === 3 && cCal.diasSinEntreno === 2 && cCal.conCalisteniaAnterior,
  `Calistenia de antes + Fitness: el día que coincide cuenta UNA vez (3 con: 1, 3 y 5; 2 sin: 2 y 4) (${cCal.diasConEntreno}/${cCal.diasSinEntreno})`);

/* ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. CX-09 · Un ánimo es un número entero del 1 al 5, y nada más ──');

const malos = [true, false, '4', '', ' ', [4], {}, null, undefined, NaN, Infinity, 0, 6, 3.5, -1, '3'];
malos.forEach((v) => ok(!esAnimoValido(v), `Se rechaza ${typeof v === 'number' ? String(v) : JSON.stringify(v) ?? 'undefined'} (${typeof v})`));
[1, 2, 3, 4, 5].forEach((v) => ok(esAnimoValido(v), `Se acepta ${v}`));
const conMalos = animoPorDia([...malos.map((animo, i) => ({ fecha: addDays('2026-10-01', i), animo })), { fecha: '2026-10-30', animo: 4 }]);
ok(conMalos.length === 1 && conMalos[0].fecha === '2026-10-30' && conMalos[0].animo === 4,
  '🐛 Un Diario con booleanos, textos, listas, decimales y valores fuera de escala solo aporta el día válido (antes `true` contaba como 1 y `[4]` como 4)');
const cMalos = correlacionEntrenoAnimo({ fitness: conSesiones(['2026-10-05', '2026-10-07', '2026-10-09'].map((f) => entrenamiento(f))) },
  [...diario(rango('2026-10-05', '2026-10-09'), 4), { fecha: '2026-10-06', animo: true }, { fecha: '2026-10-08', animo: [1] }]);
eq(cMalos.mediaAnimoSinEntreno, 4, '…y en la correlación una entrada rota del mismo día no tuerce la media');

/* ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. CX-09 · Identificadores y duplicados, según el contrato real ──');

const base = entrenamiento('2026-10-01');
const sinId = { ...base, id: undefined };
const idVacio = { ...base, id: '' };
const idCero = { ...base, id: 0 };
const idNumerico = { ...base, id: 7, fecha: '2026-10-02' };
eq(fechasConEntrenamiento({ sesiones: [sinId, idVacio, idCero] }).size, 0, 'Sin `id`, con `id` vacío o 0: no cuenta (la puerta de carga también los descarta)');
ok(fechasConEntrenamiento({ sesiones: [idNumerico] }).has('2026-10-02'), '🚨 Un `id` numérico de una importación SÍ cuenta: no se le exige el formato de `uid()`');
ok(conSesiones([idNumerico]).sesiones.some((s) => s.id === 7), '…igual que hace la puerta de carga, que lo conserva');
const copiaMovida = { ...base, fecha: '2026-10-03' };
eq(fechasConEntrenamiento({ sesiones: [base, copiaMovida] }).size, 1, '🚨 La MISMA sesión repetida con dos fechas cuenta una vez');
ok(fechasConEntrenamiento({ sesiones: [base, copiaMovida] }).has('2026-10-03'), '…en la fecha de su última copia');
ok(mismos(fechasConEntrenamiento({ sesiones: [base, copiaMovida] }), fechasConEntrenamiento({ sesiones: sinDuplicadosPorId([base, copiaMovida]) })),
  '…que es exactamente lo que deja `sinDuplicadosPorId` (la regla de la puerta de carga, una sola)');
ok(mismos(fechasConEntrenamiento({ sesiones: [base, copiaMovida, idNumerico, sinId] }), fechasConEntrenamiento(conSesiones([base, copiaMovida, idNumerico, sinId]))),
  '…y lo mismo que sale de leer lo ya cargado: crudo o normalizado, los mismos días');
eq(fechasConEntrenamiento({ sesiones: [base, { ...base, id: 'otra' }] }).size, 1, 'Dos sesiones distintas el mismo día: un día');

/* ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. Imagen personal · «Tu entrenamiento» lee Fitness ──');

const dato = datoGlobalEH('entrenamiento');
eq(dato.donde, 'Fitness', '🐛 El dato dice que vive en Fitness (antes «Calistenia», una sección que ya no existe)');
eq(dato.irA, 'entreno', '…y lleva al módulo de Fitness (`entreno`), que existe');
eq(FUENTES_GLOBALES.entrenamientos.clave, 'fitness', '…y el mapa de fuentes de Imagen personal apunta a `fitness`');

const soloFitness = { fitness: conSesiones([entrenamiento('2026-10-01'), entrenamiento('2026-10-03'), entrenamiento('2026-10-03', { hora: 20 }), enCurso('2026-10-04')]) };
eq(lecturaDeEntrenamiento(soloFitness), '3 entrenamientos completados en Fitness', '🚨 Solo con Fitness: «3 entrenamientos completados en Fitness» (el que está en curso no cuenta)');
eq(lecturaDeEntrenamiento({ fitness: conSesiones([entrenamiento('2026-10-01')]) }), '1 entrenamiento completado en Fitness', '…en singular con uno');
eq(lecturaDeEntrenamiento({ fitness: { sesiones: [base, { ...base }] } }), '1 entrenamiento completado en Fitness', '…y la misma sesión repetida, una vez');
const conAntes = { calistenia: { planche: { sesiones: [{ fecha: '2026-08-01' }, { fecha: '2026-09-12' }, { fecha: '2026-09-12' }] } } };
eq(lecturaDeEntrenamiento(conAntes), 'Calistenia de antes: 2 días registrados, el último el 12 septiembre 2026',
  '🚨 Solo con la calistenia de antes: dice que es de antes y CUÁNDO fue lo último (no se enseña como actual)');
eq(lecturaDeEntrenamiento({ ...conAntes, ...soloFitness }), '3 entrenamientos completados en Fitness',
  '…y con las dos, Fitness: no se suman sesiones y días de épocas distintas');
eq(lecturaDeEntrenamiento({}), null, 'Sin nada: `null`');
ok([null, undefined, 5, 'x', { fitness: 'roto', calistenia: [] }].every((g) => lecturaDeEntrenamiento(g) === null), '…ni se rompe con datos de otra forma');

const lFit = leerDato(DEFAULT_ESTILO_HOMBRE, 'entrenamiento', soloFitness);
ok(lFit.tiene && lFit.texto === '3 entrenamientos completados en Fitness' && lFit.donde === 'Fitness',
  '🚨 «Mis datos» con solo Fitness: lo tiene, con su texto y «Fitness»');
const lVacio = leerDato(DEFAULT_ESTILO_HOMBRE, 'entrenamiento', {});
ok(!lVacio.tiene && lVacio.irA === 'entreno' && lVacio.donde === 'Fitness', '🚨 Sin entrenamientos: no lo tiene, y dice a dónde ir (Fitness)');
ok(loQueYaSabemos(soloFitness).sabidos.some((d) => d.campo === 'entrenamiento' && d.donde === 'Fitness'), '«Esto ya lo sabemos» lo cuenta, leído de Fitness');
eq(seDebePreguntar('entrenamiento', soloFitness).preguntar, false, '…y no se le vuelve a preguntar lo que ya está en Fitness');
eq(seDebePreguntar('entrenamiento', {}).preguntar, true, '…y sin nada, se dice que está vacío');
ok(todosLosDatos(DEFAULT_ESTILO_HOMBRE, soloFitness).flatMap((g) => g.datos).every((d) => 'irA' in d),
  'Todos los datos tienen la misma forma (`irA` también en los propios)');

const APP = leer('src/App.jsx');
ok(/datosGlobales=\{\{ perfil, salud, objetivos, calistenia, sueno, fitness \}\}/.test(APP), 'App.jsx le pasa `fitness` a Imagen personal');
const VISTA_EH = leer('src/views/EstiloHombreView.jsx');
ok(/onCerrar=\{\(\) => setMisDatos\(false\)\} onIr=\{onIr\}/.test(VISTA_EH) && /onIr\(d\.irA\)/.test(VISTA_EH),
  '«Mis datos» recibe la navegación y el botón lleva a `irA`');
ok(!/\bcontextoParaIA\b/.test(APP + VISTA_EH), '🔒 El contexto de IA de Imagen personal no está conectado a ninguna pantalla: esto no cambia lo que viaja a la IA');

/* ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. «Primer PR» · se puede conseguir, y lo conseguido se conserva ──');

const pr1 = (estado) => calcularLogros(estado).find((l) => l.id === 'pr1');
const nueva = pr1({});
ok(nueva && !nueva.conseguido && /Fitness/.test(nueva.desc) && !/calistenia/i.test(nueva.desc),
  `🚨 Cuenta nueva: bloqueado, y pide algo que se PUEDE hacer («${nueva && nueva.desc}»)`);
eq(calcularLogros({}).length, 12, '…con el total de siempre: 12');
ok(calcularLogros({}).filter((l) => !l.conseguido).every((l) => !/calistenia/i.test(l.desc)),
  '🚨 Ninguna insignia pendiente de una cuenta nueva pide algo de la calistenia, que ya no se puede registrar');

const historico = pr1({ calistenia: { planche: { prs: [{ valor: '30s hold', fecha: '2026-08-01' }] } } });
ok(historico.conseguido && historico.desc === 'Registraste un récord personal de calistenia',
  '🚨 Conseguido con un PR de calistenia de antes: se CONSERVA, y dice cómo se consiguió');
eq(calcularLogros({ calistenia: { planche: { prs: [{ valor: 'x' }] } } }).length, 12, '…sin cambiar el total (12)');
const antiguosSinPR = pr1({ calistenia: { planche: { nivel: 40, sesiones: [{ fecha: '2026-08-01' }], prs: [] } } });
ok(!antiguosSinPR.conseguido && /Fitness/.test(antiguosSinPR.desc), 'Datos de calistenia antiguos SIN PR: bloqueado y alcanzable desde Fitness');

const unaVez = conSesiones([entrenamiento('2026-10-01', { reps: 8 })]);
eq(primerRecordPersonal(unaVez), null, '🚨 La primera vez que se hace un ejercicio NO es un récord (no hay marca que superar)');
eq(pr1({ fitness: unaVez }).conseguido, false, '…y no desbloquea el logro');
eq(primerRecordPersonal(conSesiones([entrenamiento('2026-10-01', { reps: 8 }), entrenamiento('2026-10-03', { reps: 8 })])), null, 'Igualar la mejor marca no es un récord');
eq(primerRecordPersonal(conSesiones([entrenamiento('2026-10-01', { reps: 8 }), entrenamiento('2026-10-03', { reps: 6 })])), null, '…ni quedarse por debajo');
eq(primerRecordPersonal(conSesiones([entrenamiento('2026-10-01', { reps: 8 }), entrenamiento('2026-10-03', { reps: 5, lastre: 10 })])), null,
  'Con lastre después de a peso corporal: otra clase, no se comparan (apartado 4 de la F11)');
eq(primerRecordPersonal(conSesiones([entrenamiento('2026-10-01', { reps: 8 }), enCurso('2026-10-02', 20)])), null,
  'Una sesión EN CURSO con más repeticiones no cuenta: no está guardada');
const conRecord = conSesiones([entrenamiento('2026-10-01', { reps: 8 }), entrenamiento('2026-10-03', { reps: 6 }), entrenamiento('2026-10-05', { reps: 9 }), entrenamiento('2026-10-07', { reps: 10 })]);
const r = primerRecordPersonal(conRecord);
ok(r && r.fecha === '2026-10-05' && r.texto === '9 reps' && r.exerciseId === 'dominada-prona',
  `🚨 Superar la mejor marca anterior (8 → 9) SÍ es un récord, y se toma el primero (el 5, no el 7) (${JSON.stringify(r && { fecha: r.fecha, texto: r.texto })})`);
const conseguidoFit = pr1({ fitness: conRecord });
ok(conseguidoFit.conseguido && /Fitness/.test(conseguidoFit.desc), '…y desbloquea «Primer PR»');
ok(pr1({ fitness: conRecord, calistenia: { planche: { prs: [{ valor: 'x' }] } } }).conseguido, 'Con los dos caminos: conseguido');
eq(primerRecordPersonal(null), null, 'Sin Fitness: `null`, sin romperse');
eq(primerRecordPersonal(conSesiones([entrenamiento('2026-10-01', { reps: 8 })].concat([]))), null, '…y con un solo entrenamiento, tampoco');
const lastres = conSesiones([entrenamiento('2026-10-01', { reps: 5, lastre: 10 }), entrenamiento('2026-10-03', { reps: 5, lastre: 12.5 })]);
const rLastre = primerRecordPersonal(lastres);
ok(rLastre && rLastre.fecha === '2026-10-03' && rLastre.texto === '12,5 kg × 5',
  `Con peso: más kilos a las mismas repeticiones es récord, en la clase que le da la F11 (la regla del apartado 14) (${JSON.stringify(rLastre && { clase: rLastre.clase, texto: rLastre.texto })})`);

ok(hayDatosPara('logros', { fitness: conRecord }) === true && hayDatosPara('logros', {}) === false,
  'Progreso dice que Logros tiene datos con entrenamientos de Fitness (lo que lee «Primer PR»), y no sin nada');
const NUMEROS_VISTA = leer('src/views/NumbersView.jsx');
ok(/<AchievementsView[\s\S]{0,400}fitness=\{props\.fitness\}/.test(NUMEROS_VISTA) && /calcularLogros\(\{[^}]*\bfitness\b/.test(leer('src/views/AchievementsView.jsx')),
  'Progreso → Logros recibe y pasa `fitness`');

/* ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Fechas · lo futuro no es «hoy», y «hoy» cambia a medianoche ──');

const HOY = '2026-10-19';
const conFutura = conSesiones([entrenamiento('2026-10-16', { nombre: 'Pasado' }), entrenamiento('2026-10-25', { nombre: 'Futuro' })]);
const hub = calcularResumenModulo('entreno', { fitness: conFutura }, HOY);
ok(hub.linea1 === 'Pasado' && hub.linea2 === 'Último entrenamiento hace 3 días',
  `🐛 Con un entrenamiento fechado en el futuro, el último es el de hace 3 días (antes «Futuro · Último entrenamiento hoy»: ${hub.linea1} · ${hub.linea2})`);
const soloFuturo = calcularResumenModulo('entreno', { fitness: conSesiones([entrenamiento('2026-10-25')]) }, HOY);
eq(soloFuturo.estado, 'vacio', '…y si solo hay uno futuro, todavía no hay ninguno hecho');
eq(calcularResumenModulo('entreno', { fitness: conFutura }, '2026-10-25').linea2, 'Último entrenamiento hoy', '…el día que llega, sí es «hoy»');
const pFut = prediccionConstanciaEntreno({ fitness: conSesiones(['2026-08-01', '2026-08-03', '2026-08-05', '2026-11-01', '2026-11-03'].map((f) => entrenamiento(f))) }, HOY);
ok(pFut.motivo === 'pocos_dias' && pFut.diasConEntreno === 3, `🐛 Predicciones no cuenta días futuros para el mínimo (3 pasados, no 5) (${JSON.stringify(pFut)})`);

const iHook = APP.indexOf('const diaDeHoy = useHoyISO();');
const iReturn = APP.indexOf('if (session === undefined) return');
ok(iHook > 0 && iReturn > 0 && iHook < iReturn, '🚨 App.jsx pide el día de hoy con `useHoyISO()` ANTES de los `return` condicionales (regla 4)');
ok(/calcularResumenModulo\(m\.id, \{[^}]*\}, diaDeHoy\)/.test(APP) && /horarioTop, diaDeHoy\]\);/.test(APP),
  '…se lo pasa a los resúmenes y está en sus dependencias: a medianoche se recalculan sin que cambie ningún dato');
ok(/import \{ useHoyISO \} from '\.\/components\/jarraAgua'/.test(APP), '…y es el MISMO hook de la jarra de agua (P2), no un temporizador nuevo');
const JARRA = leer('src/components/jarraAgua.jsx');
ok(/setTimeout/.test(JARRA) && !/setInterval/.test(JARRA) && /clearTimeout/.test(JARRA) && /removeEventListener\('visibilitychange'/.test(JARRA),
  '…que programa un solo aviso a la medianoche siguiente, lo limpia, y comprueba al volver a la app (sin intervalos)');

/* ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. Lo que la auditoría vio sin prueba, y lo que no se toca ──');

const ESTUDIOS = leer('src/views/EstudiosView.jsx');
ok(/la media es de\{' '\}/.test(ESTUDIOS) && !/la media baja a/.test(ESTUDIOS), '🐛 CX-16 · Estudios no dice «la media baja a» (la auditoría vio que ninguna prueba lo vigilaba)');
const STATS = leer('src/views/StatsView.jsx');
ok(/no dice que una cosa cause la otra/.test(STATS) && !/porque entrenas|gracias a entrenar|entrenar mejora/i.test(STATS),
  '🔒 Estadísticas sigue diciendo que comparar no es causa, y no afirma ninguna');
ok(/Solo compara las semanas en las que registraste algún entrenamiento/.test(STATS) && /'día de Diario se queda'/.test(STATS) && /'días de Diario se quedan'/.test(STATS),
  'Y explica qué días compara y cuántos deja fuera');
const DASH = leer('src/views/DashboardView.jsx');
ok(/habilidadesActivas/.test(DASH), '🔒 El prompt del panel de IA de Inicio no se toca (DA-09)');
ok(!/saveData|loadData/.test(leer('src/lib/correlaciones.js') + leer('src/lib/fechasDeEntreno.js') + leer('src/lib/sesionesCompletadas.js') + leer('src/lib/logros.js')),
  '🔒 Ni las correlaciones ni los logros escriben nada: no hay migración');

console.log(`\n  ${fallos.length ? '✗' : '✓'} Correcciones finales (Fase 1C) — ${pasa} comprobaciones${fallos.length ? `, ${fallos.length} FALLOS` : ''}`);
if (fallos.length) { fallos.forEach((f) => console.log(`      ✗ ${f}`)); process.exit(1); }
