/* Entrega 4 · FIT F9/45 — UX avanzada del entrenamiento en vivo.
   ═══════════════════════════════════════════════════════════════════════════
   Lo que más se vigila, por orden:
   1. Que la F9 NO rehaga el motor de la F7 (apartado 41: ni un estado paralelo).
   2. Que el descanso, ahora dentro de la sesión, sobreviva al guardado (regla 5).
   3. Que planificado y realizado sigan siendo dos cosas (apartado 24).
   4. Que el gesto no se pelee con el scroll (apartado 6).
   5. Que sonido y vibración pasen por el motor de audio, no por la pantalla. */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie, quitarSerie,
  restanteDescanso, sustituirEjercicio, guardarSesion, avisoDeRecuperacion,
  normalizarFitnessConSesiones, EVENTO_SERIE_HECHA, EVENTO_FIN_DESCANSO,
} from '../src/lib/entrenamiento.js';
import {
  resumenPlanificado, resumenRealizado, cabeceraEnSesion, serieActiva,
  PASOS, ajustarValor, completarSerie, desmarcarSerie, alternarDescansoAuto,
  DESCANSOS_RAPIDOS, SUMAS_DESCANSO, DESCANSO_MINIMO, DESCANSO_MAXIMO,
  iniciarDescanso, pausarDescansoSesion, reanudarDescansoSesion, terminarDescanso,
  sumarDescanso, cambiarDescansoEjercicio, descansoVisible, MARGEN_DESCANSO_TERMINADO_MS,
  UMBRAL_GESTO_PX, direccionDeGesto, tieneDatosRegistrados, AVISO_REEMPLAZAR,
  sustitutosCompatibles, NO_EN_FIT9, DECISIONES_FIT9,
} from '../src/lib/entrenamientoUx.js';
import { DEFAULT_FITNESS } from '../src/lib/fitness.js';
import { crearRutina, anadirEjercicio, editarLinea } from '../src/lib/constructor.js';
import { ejercicioPorId, musculoPrincipal } from '../src/lib/ejercicios.js';
import { definicionEvento, decidirReproduccion, DEFAULT_AUDIO } from '../src/lib/audio.js';
import { usarPlan } from '../src/lib/planes.js';
import { pasarAFinalizacion } from '../src/lib/finalizacion.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const sinComentarios = (src) => src
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/.*$/gm, '$1 ');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

const T0 = Date.UTC(2026, 8, 17, 18, 0, 0);
const seg = (n) => T0 + n * 1000;

/* Un entrenamiento de verdad, montado con el constructor de la F3 sobre el
   catálogo de la F2: press de banca 4 × 8–12 con 120 s de descanso, y un L-sit
   por tiempo. */
let rutina = crearRutina({ nombre: 'Push' });
rutina = anadirEjercicio(rutina, 'press-banca-barra');
rutina = editarLinea(rutina, rutina.lineas[0].id, { series: 4, repeticiones: 8, repsHasta: 12, descanso: 120 });
rutina = anadirEjercicio(rutina, 'l-sit');
rutina = editarLinea(rutina, rutina.lineas[1].id, { series: 3, duracion: 20 });
const nueva = () => empezarSesion({ nombre: 'Push', lineas: rutina.lineas, ahora: T0, hoy: '2026-09-17' });

const S0 = nueva();
const [BANCA, LSIT] = ejerciciosDeSesion(S0);
const serie = (ses, i, k) => ejerciciosDeSesion(ses)[i].series[k];

console.log('\n═══ FIT F9/45 · UX avanzada del entrenamiento en vivo ═══');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. El ejercicio activo y planificado frente a realizado (apartados 3 y 24) ──');

ok(resumenPlanificado(BANCA) === '4 × 8–12', `🚨 El objetivo se lee como «4 × 8–12» (${resumenPlanificado(BANCA)}, apartado 3)`);
ok(resumenPlanificado(LSIT) === '3 × 20 s', `…y un isométrico en segundos (${resumenPlanificado(LSIT)}, apartado 25)`);
ok(resumenRealizado(BANCA) === '', '…y sin nada hecho, lo realizado está VACÍO, no «0» (apartado 39)');

let S = editarSerie(S0, BANCA.id, BANCA.series[0].id, { reps: 8, peso: 60 });
S = marcarSerie(S, BANCA.id, BANCA.series[0].id, true);
S = editarSerie(S, BANCA.id, BANCA.series[1].id, { reps: 9 });
S = marcarSerie(S, BANCA.id, BANCA.series[1].id, true);
S = editarSerie(S, BANCA.id, BANCA.series[2].id, { reps: 7 }); // escrita, sin marcar
const BANCA_S = ejerciciosDeSesion(S)[0];
ok(resumenRealizado(BANCA_S) === '8 / 9', `🚨 Lo realizado son las series MARCADAS, serie a serie (${resumenRealizado(BANCA_S)}, apartado 24)`);
ok(resumenPlanificado(BANCA_S) === '4 × 8–12', '🚨 …y el objetivo NO se ha sustituido por el resultado (apartado 24, literal)');
const Somit = quitarSerie(S, BANCA.id, BANCA.series[3].id);
ok(resumenPlanificado(ejerciciosDeSesion(Somit)[0]) === '4 × 8–12',
  '⚠️ Omitir una serie no cambia lo PLANIFICADO: el plan decía cuatro');

const cab = cabeceraEnSesion(BANCA, []);
ok(cab.nombre === ejercicioPorId('press-banca-barra').nombre, 'La cabecera lleva el nombre del catálogo, no una copia');
ok(/^Agarre /.test(cab.agarre), `…el agarre, porque este ejercicio lo tiene (${cab.agarre})`);
ok(!!cab.tipo, `…y el tipo (${cab.tipo})`);
ok(cabeceraEnSesion(LSIT, []).agarre === '' || !ejercicioPorId('l-sit').agarre,
  '⚠️ Sin agarre en el catálogo no se inventa uno (apartado 39)');
ok(cabeceraEnSesion(LSIT, []).porTiempo === true, '…y un L-sit se declara por tiempo (apartado 25)');
ok(cabeceraEnSesion(null) === null, 'Sin ejercicio no revienta');
ok(cabeceraEnSesion({ id: 'x', exerciseId: 'ya-no-existe', series: [] }, []).nombre === 'ya-no-existe',
  '⚠️ Un ejercicio que ya no está en el catálogo se sigue pudiendo pintar (apartado 39)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. La serie activa (apartado 7) ──');

ok(serieActiva(BANCA) === BANCA.series[0].id, 'Al empezar, la activa es la primera');
ok(serieActiva(BANCA_S) === BANCA.series[2].id, '🚨 Con dos hechas, la activa es la tercera: la primera PENDIENTE');
const todas = BANCA.series.reduce((acc, x) => marcarSerie(acc, BANCA.id, x.id, true), S0);
ok(serieActiva(ejerciciosDeSesion(todas)[0]) === null, '⚠️ Con todas hechas no hay activa: no se resalta la última por resaltar algo');
ok(serieActiva(ejerciciosDeSesion(quitarSerie(S0, BANCA.id, BANCA.series[0].id))[0]) === BANCA.series[1].id,
  '…y una omitida no es la activa');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Los pasos rápidos (apartados 9 y 10) ──');

ok(PASOS.peso === 2.5 && PASOS.reps === 1, '🚨 Peso de 2,5 en 2,5 y repeticiones de 1 en 1 (apartado 10, literal)');
ok(ajustarValor(20, 'peso', 1) === 22.5, '+2,5 kg sobre 20 → 22,5');
ok(ajustarValor(22.5, 'peso', -1) === 20, '−2,5 kg sobre 22,5 → 20');
ok(ajustarValor(0.1 + 0.2, 'peso', 1) === 2.8, '⚠️ Sin basura de coma flotante (0,1 + 0,2 + 2,5 = 2,8, no 2.8000000000000003)');
ok(ajustarValor(1, 'peso', -1) === 0, '⚠️ No baja de cero');
ok(ajustarValor(8, 'reps', 1) === 9 && ajustarValor(8, 'reps', -1) === 7, 'Repeticiones de una en una');
ok(ajustarValor(20, 'duracion', 1) === 25, 'Un isométrico de cinco en cinco segundos');
ok(ajustarValor(null, 'reps', 1, { base: 8 }) === 8,
  '🚨 Un «+» sobre un campo vacío parte de lo que decía el plan (8), no de cero');
ok(ajustarValor(null, 'peso', 1) === 2.5, '…y sin plan, del paso');
ok(ajustarValor(null, 'reps', -1, { base: 8 }) === null, '…y un «−» sobre un campo vacío no se inventa nada');
ok(ajustarValor(8, 'inventado', 1) === 8, 'Un campo que no existe no cambia');
ok(ajustarValor('62.5', 'peso', 1) === 65, '…y acepta el texto que llega de un campo');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. Completar, desmarcar y el descanso automático (apartados 11, 12 y 16) ──');

const C1 = completarSerie(S0, BANCA.id, BANCA.series[0].id, seg(10));
ok(serie(C1, 0, 0).estado === 'hecha', 'Completar marca la serie (apartado 11)');
ok(!!C1.descanso && C1.descanso.segundos === 120 && C1.descanso.desde === seg(10),
  '🚨 …y con el descanso automático puesto, arranca el del ejercicio: 120 s (apartado 16)');
const sinAuto = alternarDescansoAuto(S0);
ok(sinAuto.descansoAuto === false && alternarDescansoAuto(sinAuto).descansoAuto === true, 'El descanso automático se enciende y se apaga');
const C2 = completarSerie(sinAuto, BANCA.id, BANCA.series[0].id, seg(10));
ok(serie(C2, 0, 0).estado === 'hecha' && C2.descanso === null,
  '🚨 …y apagado, completar NO arranca ningún descanso');

const conDatos = completarSerie(editarSerie(S0, BANCA.id, BANCA.series[0].id, { peso: 62.5, reps: 10 }), BANCA.id, BANCA.series[0].id, seg(10));
const D1 = desmarcarSerie(conDatos, BANCA.id, BANCA.series[0].id);
ok(serie(D1, 0, 0).estado === 'pendiente', 'Desmarcar vuelve ✓ → ○ (apartado 12)');
ok(serie(D1, 0, 0).hecho.peso === 62.5 && serie(D1, 0, 0).hecho.reps === 10,
  '🚨 …SIN perder los 62,5 kg ni las 10 repeticiones (apartado 12, literal)');
ok(D1.descanso === null, '⚠️ …y para el descanso que había arrancado: no se descansa de una serie no hecha');
ok(completarSerie(S0, 'no-existe', 'tampoco', seg(1)) === S0, 'Completar algo que no existe no toca la sesión');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. El descanso, dentro de la sesión (apartados 13-17 y 41) ──');

ok(DESCANSOS_RAPIDOS.join() === '30,60,90,120,180', 'Los cinco tiempos del apartado 17');
ok(SUMAS_DESCANSO.join() === '15,30', '…y las sumas rápidas de +15 s y +30 s (apartado 14)');

let R = iniciarDescanso(S0, 90, seg(0));
ok(restanteDescanso(R.descanso, seg(30)) === 60000, 'El descanso corre con marcas de tiempo (la cuenta es de la F7)');
R = pausarDescansoSesion(R, seg(30));
ok(restanteDescanso(R.descanso, seg(300)) === 60000, 'Pausado, se congela (apartado 13)');
R = reanudarDescansoSesion(R, seg(300));
ok(restanteDescanso(R.descanso, seg(310)) === 50000, '…y reanudado sigue por donde iba');
R = sumarDescanso(R, 15, seg(310));
ok(restanteDescanso(R.descanso, seg(310)) === 65000, '+15 s suma quince (apartado 14)');
R = sumarDescanso(R, 30, seg(310));
ok(restanteDescanso(R.descanso, seg(310)) === 95000, '+30 s suma treinta');
const acabado = iniciarDescanso(S0, 60, seg(0));
const extendido = sumarDescanso(acabado, 15, seg(200));
ok(restanteDescanso(extendido.descanso, seg(200)) === 15000,
  '🚨 Sobre un descanso YA acabado, «+15 s» da quince segundos de verdad (sumar al total lo dejaría igual de acabado)');
ok(terminarDescanso(R).descanso === null, 'Terminarlo a mano lo quita (apartado 15)');
ok(terminarDescanso(R).iniciadaEn === R.iniciadaEn && terminarDescanso(R).pausadoMs === R.pausadoMs,
  '🚨 …sin tocar el cronómetro general (apartado 15, literal)');
ok(iniciarDescanso(S0, 0, seg(0)) === S0 && iniciarDescanso(S0, null, seg(0)) === S0,
  'Un descanso de cero o sin tiempo no se crea');
ok(sumarDescanso(S0, 15, seg(0)) === S0, 'Sumar sin descanso no se inventa uno');

const CD = cambiarDescansoEjercicio(S0, BANCA.id, 60);
ok(ejerciciosDeSesion(CD)[0].descanso === 60, 'Cambiar el descanso lo cambia en este ejercicio de la sesión (apartado 17)');
ok(ejerciciosDeSesion(CD)[1].descanso === LSIT.descanso, '…y no en los demás');
ok(rutina.lineas[0].descanso === 120, '🚨 …y la RUTINA de la que salió sigue con sus 120 s: el plan no se toca (apartado 17)');
ok(ejerciciosDeSesion(cambiarDescansoEjercicio(S0, BANCA.id, 1))[0].descanso === DESCANSO_MINIMO, `Por debajo de ${DESCANSO_MINIMO} s se acota`);
ok(ejerciciosDeSesion(cambiarDescansoEjercicio(S0, BANCA.id, 99999))[0].descanso === DESCANSO_MAXIMO, `…y por encima de ${DESCANSO_MAXIMO} s también`);
ok(cambiarDescansoEjercicio(S0, BANCA.id, 'hola') === S0, '…y un texto no cambia nada');

/* Lo que la F7 quería evitar: un descanso viejo en pantalla. */
const V = iniciarDescanso(S0, 60, seg(0));
ok(descansoVisible(V, seg(30)) !== null, 'Un descanso corriendo se ve');
ok(descansoVisible(V, seg(60 + 10)) !== null, '…uno que acaba de terminar, también, para ver que acabó');
ok(descansoVisible(V, seg(60) + MARGEN_DESCANSO_TERMINADO_MS + 1000) === null,
  '🚨 …pero uno de hace rato NO se pinta: la preocupación de la F7 sigue cubierta');
ok(descansoVisible(S0, seg(0)) === null && descansoVisible(null) === null, 'Sin descanso, nada');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Persistencia: el descanso sobrevive al guardado (regla 5 · apartado 41) ──');

const conDescanso = alternarDescansoAuto(iniciarDescanso(S0, 90, seg(5)));
const guardado = JSON.parse(JSON.stringify(guardarSesion({ ...DEFAULT_FITNESS }, conDescanso)));
const recargado = normalizarFitnessConSesiones(guardado).sesiones[0];
ok(recargado.descanso && recargado.descanso.segundos === 90 && recargado.descanso.desde === seg(5),
  '🚨 El descanso vuelve entero tras guardar y recargar: la puerta de carga lo conoce');
ok(recargado.descansoAuto === false, '🚨 …y el descanso automático apagado sigue apagado');
const pausadoG = normalizarFitnessConSesiones(JSON.parse(JSON.stringify(guardarSesion({ ...DEFAULT_FITNESS }, pausarDescansoSesion(conDescanso, seg(20)))))).sesiones[0];
ok(pausadoG.descanso.pausadoEn === seg(20), '…con la pausa incluida');
const vieja = JSON.parse(JSON.stringify(S0));
delete vieja.descanso; delete vieja.descansoAuto;
const viejaR = normalizarFitnessConSesiones({ ...DEFAULT_FITNESS, sesiones: [vieja] }).sesiones[0];
ok(viejaR.descanso === null && viejaR.descansoAuto === true,
  '⚠️ Una sesión guardada ANTES de la F9 carga con valores seguros: sin descanso y con el automático puesto');
const rota = normalizarFitnessConSesiones({ ...DEFAULT_FITNESS, sesiones: [{ ...vieja, descanso: { segundos: 'x' } }] }).sesiones[0];
ok(rota.descanso === null, '…y un descanso guardado roto no rompe la sesión');
ok(ejerciciosDeSesion(recargado).length === 2, '…y el snapshot sigue ahí (F7)');

const aviso = avisoDeRecuperacion(iniciarDescanso(S0, 90, seg(0)), { ahora: seg(18) });
ok(aviso.descanso === 'Descansando 01:12', `🚨 El estado compacto dice que está descansando y cuánto le queda (${aviso.descanso}, apartado 31)`);
ok(avisoDeRecuperacion(S0, { ahora: seg(18) }).descanso === '', '…y sin descanso no dice nada');
ok(avisoDeRecuperacion(iniciarDescanso(S0, 60, seg(0)), { ahora: seg(500) }).descanso === '', '…ni con uno que ya acabó');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. El gesto (apartado 6) ──');

ok(direccionDeGesto(-120, 10) === 'siguiente', 'Deslizar a la izquierda lleva al siguiente');
ok(direccionDeGesto(120, -8) === 'anterior', '…y a la derecha, al anterior');
ok(direccionDeGesto(-(UMBRAL_GESTO_PX - 1), 0) === null, `🚨 Un roce de menos de ${UMBRAL_GESTO_PX} px no cambia nada`);
ok(direccionDeGesto(-80, 200) === null, '🚨 Un dedo que baja para hacer scroll NO cambia de ejercicio');
ok(direccionDeGesto(-80, 70) === null, '⚠️ …ni uno en diagonal: tiene que ser claramente horizontal');
ok(direccionDeGesto(undefined, undefined) === null, 'Sin datos, nada');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. Reemplazar (apartados 21 y 22) ──');

ok(tieneDatosRegistrados(BANCA) === false, 'Un ejercicio recién empezado no tiene datos: se reemplaza sin preguntar');
ok(tieneDatosRegistrados(ejerciciosDeSesion(editarSerie(S0, BANCA.id, BANCA.series[0].id, { peso: 40 }))[0]),
  '🚨 Con un peso escrito, SÍ: hay que preguntar (apartado 22)');
ok(tieneDatosRegistrados(ejerciciosDeSesion(marcarSerie(S0, BANCA.id, BANCA.series[0].id, true))[0]), '…con una serie marcada, también');
ok(AVISO_REEMPLAZAR.titulo === '¿Reemplazar ejercicio?' && /Ya has registrado datos/.test(AVISO_REEMPLAZAR.texto)
  && AVISO_REEMPLAZAR.cancelar === 'Cancelar' && AVISO_REEMPLAZAR.reemplazar === 'Reemplazar',
  'El aviso dice lo que pide el apartado 22, con Cancelar y Reemplazar');

const subs = sustitutosCompatibles(BANCA, []);
const actual = ejercicioPorId('press-banca-barra');
ok(subs.length > 0, `Hay sustitutos compatibles (${subs.length})`);
ok(!subs.some((x) => x.ejercicio.id === actual.id), '…sin proponer el mismo ejercicio');
/* 🔓 FIT F33 — estas tres se dan la vuelta: los sustitutos ya no los ordena la
   F9 por su cuenta (familia, declarados y el resto del grupo), sino el motor de
   la F33 por niveles de compatibilidad. Lo que protegían sigue en pie, dicho
   con los niveles: el más parecido primero, y la familia de la F3 arriba. */
const ORDEN_NIVEL = { 'Muy similar': 1, Similar: 2, Alternativa: 3 };
ok(subs.every((x) => ORDEN_NIVEL[x.motivo]),
  '🚨 Todos llevan su nivel de compatibilidad, y ninguno es «Poco recomendable» (F33, apartado 2)');
ok(subs[0].motivo === 'Muy similar' && !!subs[0].relacion,
  '…y primero va uno muy similar de la familia de la F3, que es el cambio más parecido');
ok(subs.every((x, i) => i === 0 || ORDEN_NIVEL[subs[i - 1].motivo] <= ORDEN_NIVEL[x.motivo]),
  '…con los niveles en orden: muy similares, después similares y después alternativas');
ok(new Set(subs.map((x) => x.ejercicio.id)).size === subs.length, '⚠️ …sin repetir ninguno');
ok(sustitutosCompatibles(BANCA, [], { limite: 3 }).length <= 3, 'Se puede acotar');
ok(JSON.stringify(sustitutosCompatibles(BANCA, []).map((x) => x.ejercicio.id)) === JSON.stringify(subs.map((x) => x.ejercicio.id)),
  'Y el orden es estable: mismo ejercicio, misma lista');
ok(sustitutosCompatibles({ id: 'x', exerciseId: 'ya-no-existe' }, []).length === 0, 'Un ejercicio que no está no revienta');

const F = usarPlan({ ...DEFAULT_FITNESS }, 'ppl-estetico', { hoy: '2026-09-14' }).fitness;
const planAntes = JSON.stringify(F.planActivo);
const conSesion = guardarSesion(F, sustituirEjercicio(S0, BANCA.id, subs[0].ejercicio.id));
ok(JSON.stringify(conSesion.planActivo) === planAntes, '🚨 Reemplazar no modifica el plan (apartado 21, literal)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. Sonido y vibración: por el motor de audio (apartado 18) ──');

ok(!!definicionEvento(EVENTO_SERIE_HECHA) && !!definicionEvento(EVENTO_FIN_DESCANSO),
  `🚨 Los dos avisos son eventos que el motor CONOCE (${EVENTO_SERIE_HECHA}, ${EVENTO_FIN_DESCANSO})`);
ok(EVENTO_FIN_DESCANSO !== 'success', '🐛 …y el fin de descanso ya no es «success» en minúsculas, que no sonaba nunca');
const conVibracion = { ...DEFAULT_AUDIO, activado: false, vibracion: true };
ok(decidirReproduccion(conVibracion, EVENTO_FIN_DESCANSO, { ahora: seg(1) }).vibra === true,
  '🚨 Con el sonido apagado y la vibración puesta, el fin del descanso VIBRA (el caso del gimnasio)');
ok(decidirReproduccion({ ...DEFAULT_AUDIO, vibracion: false }, EVENTO_SERIE_HECHA, { ahora: seg(1) }).vibra === false,
  '…y con la vibración apagada en Ajustes, no vibra: manda su interruptor');

const VISTA = leer('src/views/EntrenamientoVivoView.jsx');
const VISTA_CODIGO = sinComentarios(VISTA);
ok(!/navigator\.vibrate|new Audio\(|AudioContext/.test(VISTA_CODIGO),
  '🚨 La pantalla no vibra ni reproduce por su cuenta: solo EMITE (SO F1)');
ok(/emitir\(EVENTO_SERIE_HECHA/.test(VISTA_CODIGO) && /emitir\(EVENTO_FIN_DESCANSO/.test(VISTA_CODIGO),
  '…y emite los dos avisos');
ok(!/vibrarSiSePuede/.test(VISTA_CODIGO), '…sin la función retirada que se saltaba Ajustes');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 10. La pantalla: lo que se puede comprobar leyéndola ──');

ok(!/useState\([^)]*\)\s*;?\s*\/\/\s*descanso/.test(VISTA_CODIGO) && !/setDescanso\(/.test(VISTA_CODIGO),
  '🚨 El descanso ya NO es estado de pantalla: no hay `setDescanso` (apartado 41)');
ok((VISTA_CODIGO.match(/\{cabeceraSesion\}/g) || []).length >= 3,
  '🚨 La cabecera —cronómetro y Terminar— está en la vista normal, el tutorial Y el reemplazo (apartados 20 y 33)');
ok(/panel === 'tutorial'[\s\S]{0,200}\{cabeceraSesion\}/.test(VISTA_CODIGO), '…el tutorial se abre SIN abandonar el entrenamiento');
ok(/touchAction:\s*'pan-y'/.test(VISTA_CODIGO), '🚨 La zona del gesto deja el scroll vertical al navegador (apartado 6)');
ok(/closest\('button, input, textarea, select, a'\)/.test(VISTA_CODIGO),
  '⚠️ …y un gesto que empieza sobre un botón o un campo no cuenta');
ok(/<Circle /.test(VISTA_CODIGO) && /<Check size=\{20\}/.test(VISTA_CODIGO),
  '🚨 Pendiente es ○ y hecha es ✓: el estado no depende solo del color (apartado 38)');
ok(/aria-pressed=\{hecha\}/.test(VISTA_CODIGO), '…y se anuncia como pulsado');
ok(/data-sin-sonido/.test(VISTA_CODIGO), '⚠️ El ✓ no suena dos veces (clic de interfaz + serie hecha)');
ok(/inputMode=\{conDecimal \? 'decimal' : 'numeric'\}/.test(VISTA_CODIGO), 'Teclado numérico, con decimales en el peso (apartado 8)');
ok(/scrollIntoView\(\{ block: 'center'/.test(VISTA_CODIGO), 'El campo activo se centra cuando sube el teclado (apartado 37)');
ok(/pasarAFinalizacion\(\{ \.\.\.sesion, descanso: null \}\)/.test(VISTA_CODIGO),
  '⚠️ Terminar suelta el descanso: una sesión terminada no está descansando');
ok(!/position:\s*'fixed'|className="[^"]*\bfixed\b/.test(VISTA_CODIGO),
  'Nada `fixed` que tape contenido detrás de la zona segura (apartados 35 y 36)');
ok(/role="status"/.test(VISTA_CODIGO), 'El descanso se anuncia a un lector de pantalla');
ok(/Sin planificar/.test(VISTA), 'Un ejercicio sin datos planificados lo dice (apartado 39)');

/* Y que la F9 se apoya en la F7 en vez de rehacerla. */
const UX = sinComentarios(leer('src/lib/entrenamientoUx.js'));
ok(/from '\.\/entrenamiento'/.test(UX) && /marcarSerie\(/.test(UX) && /crearDescanso\(/.test(UX),
  '🚨 La F9 llama a `marcarSerie` y `crearDescanso` de la F7: no los reescribe (apartado 41)');
ok(!/saveData|localStorage|useState/.test(UX), '…y no guarda nada por su cuenta: devuelve la sesión');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 11. Lo que no se construye, dicho ──');

ok(NO_EN_FIT9.length >= 5 && NO_EN_FIT9.every((x) => x.que && x.porque && x.porque.length > 20),
  'Lo que la F9 no construye está declarado con su motivo (apartado 44)');
ok(NO_EN_FIT9.some((x) => /minirreproductor/i.test(x.que)), '⚠️ …incluido por qué no hay una barra flotante de minimizar (apartado 31)');
ok(DECISIONES_FIT9.some((x) => /descanso vive en la sesión/i.test(x.que)), '…y la contradicción con la F7, anotada');
ok(pasarAFinalizacion({ ...iniciarDescanso(S0, 90, seg(0)), descanso: null }, { ahora: seg(60) }).descanso === null,
  'La F8 recibe la sesión sin descanso y lo conserva así');

console.log(`\n  ${total - fallos}/${total} comprobaciones correctas.`);
if (fallos) {
  console.log(`  \x1b[31m${fallos} fallo(s).\x1b[0m\n`);
  process.exit(1);
}
