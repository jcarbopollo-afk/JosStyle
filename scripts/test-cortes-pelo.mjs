// ============================================================================
// EH · Fase 12/65 — Peluquería: cortes, preferencias y recomendaciones
//
// Los doce tests del apartado 19, más lo que el enunciado prohíbe:
// sin IA, sin "el mejor corte para ti", y NADA sin confirmar (apartado 18).
//
// ⚠️ Y la comprobación que gobierna la fase: **el apartado 5 no se vuelve a
// preguntar**, porque la Fase 7 ya lo preguntó con las mismas cinco opciones.
// ============================================================================

import { readFileSync } from 'node:fs';
import { DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre } from '../src/lib/estiloDeHombre.js';
import { MODULO_PELO, contestarPelo, PREGUNTAS_PELO } from '../src/lib/perfilCapilar.js';
import { NO_LO_SE } from '../src/lib/cuestionarios.js';
import { alternarParte } from '../src/lib/rutinasPelo.js';
import { guardarDato } from '../src/lib/datosEstiloHombre.js';
import {
  registrarCorte, datosPeluqueria, eventosDePeluqueria, planificarCorte,
  PARTE_PELUQUERIA,
} from '../src/lib/peluqueria.js';
import { NIVELES_ESTILO } from '../src/lib/perfilEstilo.js';
import {
  ZONA_CORTE, TIEMPO_YA_PREGUNTADO, tiempoParaPeinarse, MINUTOS_DE_TIEMPO,
  LONGITUDES, PARTES_LONGITUD, FORMAS_PEINADO, NIVELES_MANTENIMIENTO,
  nivelMantenimiento, PREGUNTAS_CORTE, preguntasDeCorte, perfilDeCorte,
  progresoCorte, contestarCorte, guardarReferencia, referenciaDe,
  CATALOGO_CORTES, DEFAULT_CORTE, normalizarCorteEH, datosCorte,
  cortesDisponibles, corteDe, anadirCorte, borrarCorte,
  alternarFavoritoCorte, favoritosDeCorte, fijarCorteActual, corteActual,
  marcarQuieroProbar, quitarObjetivoDeCorte, objetivoDeCorte,
  VALORACIONES_CORTE, valoracionCorte, decirQueCorteFue, valorarCorte,
  historialConCortes, contextoParaCortes, REGLAS_CORTE, reglaCorte,
  reglaAplicableCorte, recomendarCortes, loQueFaltaParaCortes,
  MAX_COMPARAR_CORTES, compararCortes, MINIMO_PARA_PATRON, cortesQueGustaron,
  patronesDeCorte, FRASES_PROHIBIDAS_CORTE, tonoCorrectoCorte, resumenCortes,
  auditarCortes, panelCortes,
} from '../src/lib/cortesPelo.js';
import { PALABRAS_PROHIBIDAS_PELO } from '../src/lib/recomendacionesPelo.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-08-27';
const base = () => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['pelo']);

/* ── 1 · ⚠️ EL APARTADO 5 YA ESTÁ CONTESTADO ────────────────────────────── */
console.log('\n1 · ⚠️ El tiempo NO se vuelve a preguntar (apartado 5)');

const preguntaF7 = PREGUNTAS_PELO.find((p) => p.id === 'tiempoPelo');
ok(preguntaF7, 'La Fase 7 ya preguntó cuánto tiempo quiere dedicarle');
eq(preguntaF7.opciones.map((o) => o.id), ['menos_5', '5_10', '10_20', 'mas_20', 'igual'],
  '⚠️ Y con LAS MISMAS CINCO OPCIONES que pide el apartado 5');
ok(!PREGUNTAS_CORTE.some((p) => p.id === 'tiempoPelo'),
  '⚠️ Así que esta fase NO la repite: sería el segundo perfil que prohíbe el apartado 10 de F1');
ok(!PREGUNTAS_CORTE.some((p) => JSON.stringify(p.opciones.map((o) => o.id)) === JSON.stringify(['menos_5', '5_10', '10_20', 'mas_20', 'igual'])),
  'Ni con otro nombre y las mismas opciones');
eq(TIEMPO_YA_PREGUNTADO.pregunta, 'tiempoPelo', 'Queda declarado de dónde se lee');
ok(TIEMPO_YA_PREGUNTADO.donde.length > 0, 'Y dónde se cambia, para poder decírselo');

const sinTiempo = base();
eq(tiempoParaPeinarse(sinTiempo).valor, null, 'Sin contestar, no hay tiempo — y no revienta');
const conTiempo = contestarPelo(sinTiempo, 'tiempoPelo', 'menos_5', { hoy: HOY }).estado;
eq(tiempoParaPeinarse(conTiempo).valor, 'menos_5', '⚠️ Y lo que contestó en la Fase 7 se LEE desde aquí');
eq(tiempoParaPeinarse(conTiempo).de, 'El perfil capilar', 'Diciendo de dónde sale');
// ⚠️ "Me da igual" no es "tengo una hora".
eq(MINUTOS_DE_TIEMPO.igual, null, '⚠️ "Me da igual" NO son muchos minutos: es no aplicar la restricción');
eq(MINUTOS_DE_TIEMPO.menos_5, 5, 'Y "menos de 5" sí son cinco');

/* ── 2 · LOS NIVELES SE IMPORTAN (apartado 6) ───────────────────────────── */
console.log('\n2 · ⚠️ Los niveles 🟢🟡🔴 se importan de la Fase 6');

eq(NIVELES_MANTENIMIENTO.map((x) => x.id), NIVELES_ESTILO.map((x) => x.id),
  '⚠️ Mismos ids que `NIVELES_ESTILO`: un nivel significa lo mismo en todo el proyecto');
eq(NIVELES_MANTENIMIENTO.map((x) => x.icono), ['🟢', '🟡', '🔴'], 'Y los tres iconos del enunciado');
eq(NIVELES_MANTENIMIENTO.map((x) => x.nombre), ['Bajo', 'Medio', 'Alto'],
  '⚠️ Con los nombres que escribió Josué, no los de la Fase 6');
eq(nivelMantenimiento('basico').frase, 'Quiero preocuparme poco.', 'Y su frase, literal del enunciado');
eq(nivelMantenimiento('nada'), null, 'Un nivel que no existe es null');

const fuente = readFileSync(new URL('../src/lib/cortesPelo.js', import.meta.url), 'utf8');
// ⚠️ Sin comentarios: cuatro veces en este bloque una prueba saltó con su
// propia explicación.
const codigo = fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
ok(!/const\s+NIVELES_ESTILO\s*=/.test(codigo), '⚠️ Y no se redefine la escala aquí');

/* ── 3 · TEST 1 Y 2 — CREAR Y EDITAR PREFERENCIAS ───────────────────────── */
console.log('\n3 · Tests 1 y 2 — crear y editar preferencias');

eq(PREGUNTAS_CORTE.length, 6, 'Seis preguntas: tres longitudes, estilos, peinado y mantenimiento');
eq(PARTES_LONGITUD.map((p) => p.nombre), ['Laterales', 'Parte superior', 'Parte posterior'],
  'Las tres partes del apartado 2');
eq(LONGITUDES.map((l) => l.id), ['corto', 'medio', 'largo'], 'Corto / medio / largo');
eq(FORMAS_PEINADO.length, 7, 'Las siete formas de peinarlo del apartado 4');

const p1 = contestarCorte(base(), 'longitudLaterales', 'corto', { hoy: HOY });
eq(p1.error, null, 'Test 1: se puede contestar');
eq(perfilDeCorte(p1.estado).find((q) => q.id === 'longitudLaterales').valores, ['corto'], 'Y queda guardado');
const p2 = contestarCorte(p1.estado, 'longitudLaterales', 'medio', { hoy: HOY }).estado;
eq(perfilDeCorte(p2).find((q) => q.id === 'longitudLaterales').valores, ['medio'],
  'Test 2: y se puede cambiar');
// ⚠️ Volver a tocar la misma la borra: es el motor de F7, no una regla nueva.
eq(perfilDeCorte(contestarCorte(p2, 'longitudLaterales', 'medio', { hoy: HOY }).estado)
  .find((q) => q.id === 'longitudLaterales').valores, [], 'Y tocar la misma otra vez la quita');
ok(contestarCorte(base(), 'noExiste', 'x', { hoy: HOY }).error !== null, 'Una pregunta que no existe da error');
ok(contestarCorte(base(), 'longitudLaterales', 'gigante', { hoy: HOY }).error !== null, 'Y una opción que no existe, también');

// "No lo sé" sigue siendo una respuesta (F7, apartado 14).
const noSabe = contestarCorte(base(), 'mantenimientoCorte', NO_LO_SE, { hoy: HOY }).estado;
ok(perfilDeCorte(noSabe).find((q) => q.id === 'mantenimientoCorte').noSabe,
  '⚠️ "No lo sé" sigue admitiéndose: es el motor de la Fase 7');
eq(progresoCorte(noSabe).contestadas, 1, 'Y cuenta como contestada');

// Apartado 2 — la referencia libre convive con la opción.
const conRef = guardarReferencia(p2, 'longitudLaterales', 'Número 2').estado;
eq(referenciaDe(conRef, 'longitudLaterales'), 'Número 2', '⚠️ Apartado 2: una referencia libre, sin medidas obligatorias');
eq(perfilDeCorte(conRef).find((q) => q.id === 'longitudLaterales').valores, ['medio'],
  'Y NO pisa la opción elegida: decir "medio" y "número 2" no es una contradicción');
ok(guardarReferencia(base(), 'noExiste', 'x').error !== null, 'Una parte que no existe da error');

/* ── 4 · TEST 3 — EL CATÁLOGO, Y QUE SEA AMPLIABLE (apartado 3) ─────────── */
console.log('\n4 · El catálogo de cortes, ampliable');

eq(CATALOGO_CORTES.length, 9, 'Los nueve del enunciado');
eq(CATALOGO_CORTES.map((c) => c.id),
  ['fade', 'taper', 'clasico', 'texturizado', 'largo', 'undercut', 'crew_cut', 'buzz_cut', 'otro'],
  'Con los nombres del apartado 3');
ok(CATALOGO_CORTES.filter((c) => c.id !== 'otro').every((c) => c.mantenimiento && c.minutos),
  '⚠️ Cada corte declara su mantenimiento y sus minutos EN SU LÍNEA: el motor no lleva un `if` por corte');
eq(CATALOGO_CORTES[CATALOGO_CORTES.length - 1].id, 'otro', 'Y "Otro" cierra la lista');

const conPropio = anadirCorte(base(), { nombre: 'Mullet', mantenimiento: 'intermedio', minutos: 10, longitudes: ['medio'] });
eq(conPropio.error, null, '⚠️ Apartado 3: la lista es ampliable');
eq(cortesDisponibles(conPropio.estado).length, 10, 'Y el suyo sale mezclado con los nueve');
eq(cortesDisponibles(conPropio.estado).at(-1).id, 'otro', 'Con "Otro" todavía al final');
ok(corteDe(conPropio.estado, conPropio.corte.id).propio, 'Marcado como suyo');
ok(anadirCorte(base(), { nombre: '  ' }).error !== null, 'Un corte sin nombre no entra');
ok(anadirCorte(conPropio.estado, { nombre: 'mullet' }).sinEfecto, 'Ni uno repetido, aunque cambien las mayúsculas');
ok(anadirCorte(base(), { nombre: 'Taper' }).sinEfecto, 'Ni uno que ya está en el catálogo');

// Y el catálogo ampliado llega a la pregunta de estilos.
ok(preguntasDeCorte(conPropio.estado).find((q) => q.id === 'estilosCorte').opciones.some((o) => o.nombre === 'Mullet'),
  '⚠️ El corte añadido aparece como opción: la pregunta lee el catálogo, no una copia congelada');

/* ── 5 · EL NORMALIZADOR ────────────────────────────────────────────────── */
console.log('\n5 · El normalizador');

eq(normalizarCorteEH(undefined), DEFAULT_CORTE, 'Sin nada, el valor por defecto');
eq(normalizarCorteEH('roto'), DEFAULT_CORTE, 'Con basura, también');
eq(normalizarCorteEH({ propios: [{ nombre: '' }, { nombre: 'X' }] }).propios.length, 1,
  'Un corte sin nombre se cae');
eq(normalizarCorteEH({ favoritos: ['a', 'a', 'b'] }).favoritos, ['a', 'b'], 'Los favoritos no se repiten');
eq(normalizarCorteEH({ referencias: { longitudLaterales: '  ', noExiste: 'x' } }).referencias, {},
  'Una referencia vacía o de una parte que no existe se cae');
eq(normalizarCorteEH({ actual: 5 }).actual, null, 'Un corte actual que no es un id se cae');

// ⚠️ Los tres campos nuevos de la Fase 11, y que sobreviven a un guardado.
const conValoracion = registrarCorte(base(), { fecha: '2026-08-01', corteId: 'taper', valoracion: 'bien' }).estado;
eq(datosPeluqueria(conValoracion).cortes[0].corteId, 'taper',
  '⚠️ `corteId` sobrevive al normalizador de la Fase 11 (décimo campo enseñado)');
eq(datosPeluqueria(conValoracion).cortes[0].valoracion, 'bien', 'Y `valoracion` también');
eq(datosPeluqueria(normalizarEstiloHombre(conValoracion)).cortes[0].corteId, 'taper',
  '⚠️ Y siguen ahí después de normalizar otra vez: es el fallo que ya salió NUEVE veces');
eq(datosPeluqueria(registrarCorte(base(), { fecha: '2026-08-01', valoracion: 5 }).estado).cortes[0].valoracion, null,
  'Una valoración que no es un texto se cae');

/* ── 6 · TESTS 4 Y 5 — FAVORITOS Y CORTE ACTUAL (apartados 10 y 11) ─────── */
console.log('\n6 · Tests 4 y 5 — favoritos y corte actual');

const conFav = alternarFavoritoCorte(base(), 'taper').estado;
eq(favoritosDeCorte(conFav).map((c) => c.id), ['taper'], 'Test 4: se guarda un favorito');
eq(favoritosDeCorte(alternarFavoritoCorte(conFav, 'taper').estado), [], 'Y se quita');
ok(alternarFavoritoCorte(base(), 'noExiste').error !== null, 'Un corte que no existe no se puede marcar');

const conActual = fijarCorteActual(base(), 'fade').estado;
eq(corteActual(conActual).nombre, 'Fade', 'Test 5: se elige el corte actual');
eq(corteActual(fijarCorteActual(conActual, null).estado), null, 'Y se puede quitar');
ok(fijarCorteActual(base(), 'noExiste').error !== null, 'Uno que no existe, no');

/* ⚠️ Apartado 11 — *"no modificarlo automáticamente"*. Recomendar, valorar y
   registrar un corte NO lo cambian. */
const registrado = registrarCorte(conActual, { fecha: '2026-08-10', corteId: 'taper' }).estado;
const valorado = valorarCorte(registrado, datosPeluqueria(registrado).cortes[0].id, 'encanto');
eq(valorado.error, null, 'Se registra un taper y se valora bien');
eq(datosPeluqueria(valorado.estado).cortes[0].valoracion, 'encanto', 'Y la valoración se guarda de verdad');
eq(corteActual(valorado.estado).id, 'fade',
  '⚠️ Apartado 11: registrar y valorar un TAPER no cambia el corte actual, que sigue siendo Fade');
recomendarCortes(valorado.estado);
eq(corteActual(valorado.estado).id, 'fade', 'Ni recomendar');

/* ── 7 · TEST 6 — QUIERO PROBAR (apartado 12) ───────────────────────────── */
console.log('\n7 · Test 6 — el corte que quiere probar');

const conObjetivo = marcarQuieroProbar(base(), 'taper').estado;
eq(objetivoDeCorte(conObjetivo).nombre, 'Taper', 'Test 6: se marca un objetivo');
eq(objetivoDeCorte(conObjetivo).texto, '🎯 Próximo corte: Taper', 'Con el texto del enunciado');
eq(objetivoDeCorte(quitarObjetivoDeCorte(conObjetivo).estado), null, 'Y se quita');
ok(marcarQuieroProbar(base(), 'noExiste').error !== null, 'Un corte que no existe no puede ser objetivo');

// ⚠️ Y sale en el evento que YA existe, no en uno nuevo.
const conCita = planificarCorte(conObjetivo, { modo: 'fecha', fecha: '2026-09-20' }).estado;
const ev = eventosDePeluqueria(conCita);
eq(ev.length, 1, '⚠️ Apartado 6: UN evento, no dos — el objetivo no crea uno propio');
ok(ev[0].notas.includes('Taper'), '⚠️ Apartado 12: el corte sale en el evento del calendario');
eq(ev[0].titulo, '✂️ Corte de pelo', 'Sin cambiarle el título al evento de la Fase 11');
eq(Object.keys(ev[0]).sort(),
  ['fecha', 'horaFin', 'horaInicio', 'id', 'notas', 'origen', 'origenId', 'soloLectura', 'tipo', 'titulo', 'todoElDia', 'ubicacion'].sort(),
  '⚠️ Y con la MISMA forma de siempre: nada de una clave nueva solo para esto');

// El objetivo sobrevive a que borre el corte del catálogo.
const propioObjetivo = anadirCorte(base(), { nombre: 'Mullet', mantenimiento: 'intermedio' });
const objPropio = marcarQuieroProbar(propioObjetivo.estado, propioObjetivo.corte.id).estado;
const sinElCorte = borrarCorte(objPropio, propioObjetivo.corte.id).estado;
eq(objetivoDeCorte(sinElCorte).nombre, 'Mullet',
  '⚠️ El objetivo lleva su nombre encima: borrar el corte no lo deja apuntando a un fantasma');
eq(objetivoDeCorte(sinElCorte).corte, null, 'Aunque el corte ya no esté en el catálogo');

/* ── 8 · TESTS 7, 8 Y 9 — HISTORIAL Y VALORACIÓN (apartados 13 y 14) ────── */
console.log('\n8 · Tests 7, 8 y 9 — registrar, valorar y consultar el historial');

let hist = registrarCorte(base(), { fecha: '2026-06-15' }).estado;
const idCorte = datosPeluqueria(hist).cortes[0].id;
eq(historialConCortes(hist)[0].corte, null, 'Test 7: un corte se puede registrar sin decir cuál fue');
hist = decirQueCorteFue(hist, idCorte, 'taper').estado;
eq(historialConCortes(hist)[0].corteNombre, 'Taper', '⚠️ Apartado 13: y decirlo después, porque es OPCIONAL');
ok(decirQueCorteFue(hist, idCorte, 'noExiste').error !== null, 'Un corte que no existe, no');
ok(decirQueCorteFue(hist, 'noExiste', 'taper').error !== null, 'Ni sobre un registro que no existe');

eq(VALORACIONES_CORTE.map((v) => v.icono), ['❤️', '🙂', '😐', '👎'], 'Las cuatro valoraciones del apartado 14');
hist = valorarCorte(hist, idCorte, 'encanto', 'Me quedó como quería').estado;
eq(historialConCortes(hist)[0].valoracionInfo.nombre, 'Me encantó', 'Test 8: se valora');
eq(historialConCortes(hist)[0].nota, 'Me quedó como quería', 'Con su nota opcional');
eq(datosPeluqueria(valorarCorte(hist, idCorte, null).estado).cortes[0].valoracion, null, 'Y se puede quitar');
ok(valorarCorte(hist, idCorte, 'genial').error !== null, 'Una valoración que no existe da error');
// ⚠️ `null` no es "normal".
eq(valoracionCorte(null), null, '⚠️ Sin valorar NO es "normal": son dos cosas distintas');

// Test 9 — consultar el historial.
const dos = registrarCorte(hist, { fecha: '2026-07-20', corteId: 'fade' }).estado;
eq(historialConCortes(dos).length, 2, 'Test 9: el historial se consulta');
eq(historialConCortes(dos).map((c) => c.fecha), ['2026-07-20', '2026-06-15'], 'Del más reciente al más antiguo');
eq(historialConCortes(dos)[1].diasDesdeElAnterior, null, 'Y el más antiguo no tiene con qué compararse');

/* ── 9 · TEST 10 — RECOMENDACIONES (apartados 7, 8, 16 y 17) ────────────── */
console.log('\n9 · Test 10 — recomendaciones, y por qué');

// ⚠️ Con el perfil vacío, CERO.
eq(recomendarCortes(base()).total, 0,
  '⚠️ Apartado 2 de la Fase 9, otra vez: sin datos NO se recomienda nada');
ok(loQueFaltaParaCortes(base()).hayQueAfinar, 'Y se dice qué falta, sin pedirlo');
ok(loQueFaltaParaCortes(base()).campos.every((c) => c.donde), 'Con dónde se contesta cada cosa');

// ⚠️ Una regla sin requisitos declarados NO se aplica nunca.
ok(REGLAS_CORTE.every((r) => Array.isArray(r.requiere) && r.requiere.length > 0),
  '⚠️ Toda regla declara `requiere`: una sin requisitos se dispararía con el contexto vacío');
ok(!reglaAplicableCorte({ requiere: [], cuando: () => true }, {}),
  'Y si alguien escribe una sin requisitos, no se aplica');
ok(!reglaAplicableCorte(null, {}), 'Ni una regla que no existe');
eq(reglaCorte('mantenimiento_medio').id, 'mantenimiento_medio', 'Las reglas se buscan por id');

let perfil = contestarCorte(base(), 'mantenimientoCorte', 'intermedio', { hoy: HOY }).estado;
perfil = contestarPelo(perfil, 'tipoPelo', 'liso', { hoy: HOY }).estado;
perfil = contestarPelo(perfil, 'tiempoPelo', '5_10', { hoy: HOY }).estado;
perfil = contestarCorte(perfil, 'longitudSuperior', 'medio', { hoy: HOY }).estado;

const r = recomendarCortes(perfil);
ok(r.total > 0, 'Test 10: con perfil sí hay recomendaciones');
ok(r.recomendaciones.every((x) => x.porque.length > 0), '⚠️ Apartado 8: cada una trae su "¿por qué?"');
ok(r.recomendaciones.some((x) => x.porque.some((p) => p.includes('mantenimiento medio'))),
  'Con el ejemplo literal del enunciado');
ok(r.recomendaciones.every((x) => x.mantenimiento.match(/[🟢🟡🔴]/) || x.mantenimiento === 'Sin indicar'),
  'Y su nivel con el icono de la Fase 6');
ok(r.recomendaciones[0].motivos.length >= r.recomendaciones.at(-1).motivos.length,
  'Las que tienen más motivos van primero');
eq(r.guardado, false, '⚠️ Apartado 18: calcular NO guarda nada, y se dice en el propio dato');

// ⚠️ El que ya lleva no se le propone.
const conFade = fijarCorteActual(perfil, 'texturizado').estado;
ok(!recomendarCortes(conFade).recomendaciones.some((x) => x.id === 'texturizado'),
  '⚠️ El corte que YA lleva no se le recomienda: eso no es una recomendación');

// Test 11 — cambiar preferencias cambia las recomendaciones.
const otroNivel = contestarCorte(
  contestarCorte(perfil, 'mantenimientoCorte', 'intermedio', { hoy: HOY }).estado,
  'mantenimientoCorte', 'basico', { hoy: HOY },
).estado;
ok(JSON.stringify(recomendarCortes(otroNivel).recomendaciones.map((x) => x.id))
  !== JSON.stringify(r.recomendaciones.map((x) => x.id)),
  'Test 11: cambiar las preferencias cambia las recomendaciones');
ok(recomendarCortes(otroNivel).recomendaciones.some((x) => x.id === 'buzz_cut'),
  'Y con mantenimiento bajo salen los cortes de mantenimiento bajo');

// Apartado 16 y 17 — el pelo y el estilo entran de verdad.
const ctx = contextoParaCortes(perfil);
eq(ctx.tipoPelo, 'liso', '⚠️ Apartado 16: el tipo de pelo sale del perfil capilar');
eq(ctx.minutos, 10, 'Y el tiempo, de la pregunta de la Fase 7');
const conEstilo = guardarDato(perfil, 'estilosFavoritos', ['deportivo'], { modulo: MODULO_PELO, hoy: HOY }).estado;
eq(contextoParaCortes(conEstilo).estilos, ['deportivo'], '⚠️ Apartado 17: y el estilo, de la capa de la Fase 4');
ok(recomendarCortes(conEstilo).recomendaciones.some((x) => x.porque.some((p) => p.includes('estilo'))),
  'Y hay una regla que lo usa');

// ⚠️ "No lo sé" no es un valor.
const noSabeNivel = contestarCorte(perfil, 'mantenimientoCorte', NO_LO_SE, { hoy: HOY }).estado;
eq(contextoParaCortes(noSabeNivel).mantenimiento, null,
  '⚠️ "No lo sé" no dispara ninguna regla: es la ausencia declarada de un valor');

/* ── 10 · TEST 12 — DESACTIVAR Y REACTIVAR (apartado 19) ────────────────── */
console.log('\n10 · Test 12 — desactivar y reactivar');

const apagadas = alternarParte(conEstilo, 'recomendaciones');
eq(recomendarCortes(apagadas).total, 0, 'Test 12: apagadas, no salen recomendaciones');
eq(recomendarCortes(apagadas).activo, false, 'Y se sabe por qué');
const reactivadas = alternarParte(apagadas, 'recomendaciones');
ok(recomendarCortes(reactivadas).total > 0, 'Reactivadas, vuelven');
eq(datosCorte(reactivadas).favoritos, datosCorte(conEstilo).favoritos, '⚠️ Y los datos se conservan enteros');
eq(perfilDeCorte(reactivadas).map((q) => q.valores), perfilDeCorte(conEstilo).map((q) => q.valores),
  'Las preferencias también');

/* ── 11 · COMPARAR (apartado 9) ─────────────────────────────────────────── */
console.log('\n11 · Comparar opciones');

const comp = compararCortes(base(), ['taper', 'fade', 'texturizado']);
eq(comp.length, 3, 'Se comparan varios');
eq(comp[0].nombre, 'Taper', 'Con su nombre');
eq(comp[0].mantenimiento, '🟡 Medio', 'Y su mantenimiento, con la forma del ejemplo del enunciado');
eq(compararCortes(base(), ['taper', 'fade', 'clasico', 'largo', 'undercut']).length, MAX_COMPARAR_CORTES,
  'Con un tope, para que quepa en la pantalla');
eq(compararCortes(base(), ['noExiste']), [], 'Y uno que no existe no aparece');
ok(!comp.some((c) => 'mejor' in c || 'puntuacion' in c || 'ganador' in c),
  '⚠️ Apartado 9: la comparación NO elige — *"así el usuario puede decidir"*');

/* ── 12 · PATRONES DEL HISTORIAL (apartado 15) ──────────────────────────── */
console.log('\n12 · Los patrones del historial, que no son un diagnóstico');

eq(MINIMO_PARA_PATRON, 2, 'Hacen falta dos para hablar de un patrón');
let patron = base();
[['2026-01-10', 'taper', 'encanto'], ['2026-02-10', 'fade', 'no_gusto']].forEach(([f, c, v]) => {
  patron = registrarCorte(patron, { fecha: f, corteId: c, valoracion: v }).estado;
});
eq(cortesQueGustaron(patron), [], '⚠️ Con UN taper valorado bien no se afirma nada');
eq(patronesDeCorte(patron).hay, false, 'Y no hay patrón');
patron = registrarCorte(patron, { fecha: '2026-03-10', corteId: 'taper', valoracion: 'bien' }).estado;
eq(cortesQueGustaron(patron), ['taper'], 'Con dos, sí');
eq(patronesDeCorte(patron).texto, 'Parece que este estilo encaja bastante con tus preferencias.',
  '⚠️ Apartado 15: con la frase del enunciado, que "parece" — no diagnostica');
ok(!/es el mejor|deberías|seguro que/i.test(patronesDeCorte(patron).texto),
  'Sin conclusiones absolutas');
// Un corte valorado mal no cuenta, por mucho que se repita.
ok(!cortesQueGustaron(patron).includes('fade'), 'Un corte que NO le gustó no entra en el patrón');
// Y alimenta las recomendaciones.
ok(recomendarCortes(patron).recomendaciones.some((x) => x.id === 'taper'),
  'Y lo que le gustó vuelve a salir entre las opciones');

/* ── 13 · ⚠️ EL TONO (apartado 8) ───────────────────────────────────────── */
console.log('\n13 · ⚠️ El tono: nunca "el mejor corte para ti"');

ok(!tonoCorrectoCorte('Este es el mejor corte para ti'),
  '⚠️ La frase que el enunciado prohíbe expresamente se detecta');
ok(tonoCorrectoCorte('Podría encajarte porque buscas un mantenimiento medio'),
  'Y la que pide, no');
eq(FRASES_PROHIBIDAS_CORTE.length > 0, true, 'La lista existe y se puede comprobar');

// Todos los textos que el motor puede generar, contra las dos listas.
const todosLosTextos = [
  ...REGLAS_CORTE.map((rg) => rg.porque(contextoParaCortes(perfil))),
  ...NIVELES_MANTENIMIENTO.map((x) => x.frase),
  ...CATALOGO_CORTES.map((c) => c.descripcion),
  patronesDeCorte(patron).texto,
  loQueFaltaParaCortes(base()).texto,
  ...loQueFaltaParaCortes(base()).campos.map((x) => x.texto),
];
todosLosTextos.filter(Boolean).forEach((t) => {
  ok(tonoCorrectoCorte(t), `Sin "el mejor corte": "${t.slice(0, 42)}…"`);
});
// ⚠️ Y contra el guardián de la Fase 9, que se importa en vez de reescribirse.
todosLosTextos.filter(Boolean).forEach((t) => {
  const malas = PALABRAS_PROHIBIDAS_PELO.filter((w) => t.toLowerCase().includes(w));
  ok(malas.length === 0, `Sin imperativos: "${t.slice(0, 42)}…"`);
});

/* ── 14 · ⚠️ SIN IA, Y NADA SIN CONFIRMAR (apartados 7 y 18) ────────────── */
console.log('\n14 · ⚠️ Sin IA, y nada sin confirmar');

['askAI', 'AI_SYSTEM', 'anthropic', 'fetch(', 'XMLHttpRequest', 'openai'].forEach((x) => {
  ok(!codigo.includes(x), `⚠️ "Y como acordamos, sin IA": ni "${x}"`);
});

// ⚠️ Apartado 18 — las cinco cosas que nunca pasan solas.
const antes = JSON.stringify(normalizarEstiloHombre(perfil));
recomendarCortes(perfil);
compararCortes(perfil, ['taper', 'fade']);
patronesDeCorte(perfil);
contextoParaCortes(perfil);
panelCortes(perfil);
loQueFaltaParaCortes(perfil);
eq(JSON.stringify(normalizarEstiloHombre(perfil)), antes,
  '⚠️ Apartado 18: mirar recomendaciones NO cambia NI UN BYTE del estado');

const aud = auditarCortes(base());
eq(aud.almacenesNuevos, 0, 'Cero almacenes nuevos');
eq(aud.tiempoPreguntadoAqui, false, '⚠️ Y el tiempo no se pregunta aquí');
eq([aud.cambiaCorteActual, aud.creaCitas, aud.tocaElCalendario, aud.anadeProductos, aud.cambiaPreferencias],
  [false, false, false, false, false], 'Las cinco del apartado 18, declaradas');
eq(aud.usaIA, false, 'Y sin IA');
eq(aud.compartidas, [], '⚠️ Ninguna pregunta de esta fase comparte dato: todas son de Pelo');

// Este archivo no crea citas ni escribe en el calendario.
ok(!/planificarCorte\(|editarCita\(|eventosDerivados/.test(codigo),
  '⚠️ Apartado 18: este archivo no crea citas ni toca el calendario');
ok(!/crearProductoPelo\(|anadirProducto\(/.test(codigo),
  '⚠️ Ni añade productos');

/* ── 15 · RESUMEN Y PANEL ───────────────────────────────────────────────── */
console.log('\n15 · Resumen y panel');

const res = resumenCortes(patron);
eq(res.valorados, 3, 'Tres cortes valorados');
eq(res.propios, 0, 'Ninguno suyo');
eq(resumenCortes(base()).disponibles, 0, 'Sin perfil, ninguna recomendación — y no revienta');
eq(resumenCortes(conObjetivo).objetivo, 'Taper', 'Y el objetivo sale en el resumen');

const panel = panelCortes(perfil);
eq(panel.perfil.length, 6, 'El panel trae las seis preguntas');
eq(panel.tiempo.valor, '5_10', 'Y el tiempo leído de la Fase 7');
ok(panel.contexto, 'Con el contexto del cuestionario, sin recomendar nada');
eq(panelCortes(base()).objetivo, null, 'Sin nada, sigue funcionando');
eq(ZONA_CORTE, 'corte', 'La zona tiene su id');

if (fallos > 0) {
  console.log(`\n  ${fallos} de ${n} comprobaciones han fallado.`);
  process.exit(1);
}
console.log(`\n  ${n} comprobaciones correctas.`);
