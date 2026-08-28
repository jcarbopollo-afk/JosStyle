// ============================================================================
// EH · Fase 25/65 — Perfumes: recomendaciones, ocasiones y rotación
//
// Las dieciocho pruebas del apartado 19, y lo que gobierna la fase:
//   · la recomendación no es una nota, es una EXPLICACIÓN (apartado 7)
//   · "otra opción" tiene memoria, y POR OCASIÓN (apartado 8)
//   · rotación y estadísticas son opt-in: apagadas devuelven `null`
//   · "no repetir" BAJA de sitio, no esconde (apartado 11)
// ============================================================================

import { readFileSync } from 'node:fs';
import { DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre } from '../src/lib/estiloDeHombre.js';
import { compararGenerico, MAX_COMPARAR as MAX_MOTOR } from '../src/lib/motorProductos.js';
import { crearProductoPiel, productosPiel } from '../src/lib/productosPiel.js';
import {
  configurarPerfumes, contestarPerfume, anadirPerfume, alternarPartePerfumes,
  alternarFavoritoPerfume, valorarPerfume, registrarUso, perfumes, perfume,
  eliminarPerfume, editarPerfume, DISPONIBILIDADES, INTENSIDADES, OCASIONES, TEMPORADAS,
} from '../src/lib/perfumes.js';
import {
  PARTE_RECOMENDACIONES_PERFUME, PARTE_ROTACION, PARTE_ESTADISTICAS,
  OCASIONES_RECOMENDAR, EPOCAS, epoca, ESPERAS, espera, DIAS_SEMANA,
  DIAS_DESCARTE, DEFAULT_RECS_PERFUME, normalizarDescartePerfume,
  normalizarRecsPerfume, datosRecsPerfume, ponerDisponibilidad,
  ponerIntensidadPerfume, coleccionPerfumes, perfumesDisponibles,
  puntuarPerfume, recomendarPerfume, descartarPerfume, deshacerDescartePerfume,
  FILAS_COMPARACION_PERFUME, compararPerfumes, ponerEnRotacion, rotacionPerfumes,
  tocaHoyEnRotacion, ponerEspera, estadisticasPerfumes, dondeComprarlo,
  alternativasDePerfume, resumenRecsPerfume, auditarRecsPerfume,
  textosDeRecsPerfume, panelRecsPerfume,
} from '../src/lib/recomendacionesPerfumes.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-08-28';   // viernes
const base = () => {
  let e = configurarPerfumes(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['perfumes', 'skincare']), { hoy: HOY }).estado;
  e = contestarPerfume(e, 'aromasFavoritos', 'frescos', { hoy: HOY }).estado;
  return e;
};
const conDos = (e = base()) => {
  const a = anadirPerfume(e, { nombre: 'A', tipo: ['frescos'], ocasiones: ['noche'], temporada: 'frio', intensidad: 'media' }, { hoy: HOY });
  const b = anadirPerfume(a.estado, { nombre: 'B', tipo: ['frescos'], ocasiones: ['noche'], intensidad: 'intensa' }, { hoy: HOY });
  return { estado: b.estado, a: a.perfume, b: b.perfume };
};

const fuente = readFileSync(new URL('../src/lib/recomendacionesPerfumes.js', import.meta.url), 'utf8');
const codigo = fuente
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/export function auditarRecsPerfume[\s\S]*?\n}/, '')
  .replace(/'[^'\n]*'/g, "''")
  .replace(/`[^`]*`/g, '``');

/* ── 1 · LO QUE NO SE CONSTRUYE AQUÍ ────────────────────────────────────── */
console.log('\n1 · ⚠️ La tabla es la del motor de productos, y no hay precios');

{
  const a = auditarRecsPerfume();
  eq(a.tablasNuevas, 0, 'Cero tablas de comparación nuevas');
  eq(a.motorComparacion, 'motorProductos.js', 'Con el motor declarado');
  eq([a.rachas, a.puntos], [0, 0], '⚠️ Y cero rachas y cero puntos (D2-02)');
  eq([a.preciosGuardados, a.catalogosNuevos], [0, 0],
    '⚠️ Y cero precios guardados aquí: salen de la ficha de la Fase 17');
  eq(a.usaIA, 0, 'Sin IA, que es lo primero que dice el objetivo');
}
ok(!/askAI|anthropic|claude|fetch\(/i.test(codigo), 'Ni una llamada a la IA');
ok(!/precio:\s*\d/.test(codigo), '⚠️ Ni un precio escrito a mano');
eq(MAX_MOTOR, 3, 'El tope de tres es el del motor');

/* ── 2 · LA COLECCIÓN (apartados 1, 3 y 4) ──────────────────────────────── */
console.log('\n2 · La colección — tarjetas pequeñas, sin excesos');

eq(DISPONIBILIDADES.map((d) => d.id), ['tengo', 'acabando', 'terminado'], 'Las tres del apartado 3');

{
  const { estado, a } = conDos();
  const c = coleccionPerfumes(estado);
  eq(c.length, 2, 'Prueba 12: la colección trae sus perfumes');
  eq(Object.keys(c[0]).sort(), ['disponibilidad', 'favorito', 'id', 'marca', 'nombre', 'valoracion'],
    '⚠️ Y solo lo justo: *"no mostrar información excesiva de golpe"*');
  eq(c[0].valoracion, null, '⚠️ Sin valoración, `null`: no se pinta un 0 que él no puso');
  eq(c[0].disponibilidad, null, '⚠️ Y sin decir nada, la disponibilidad es `null`: no se asume que lo tenga');

  const disp = ponerDisponibilidad(estado, a.id, 'acabando');
  eq(perfume(disp.estado, a.id).disponibilidad, 'acabando', 'Prueba 12: se marca la disponibilidad');
  eq(ponerDisponibilidad(estado, a.id, 'inventada').error, 'Esa disponibilidad no existe.', 'Una que no existe, no');

  /* ⚠️ "Terminado" sale de las recomendaciones pero SIGUE en la colección. */
  const fin = ponerDisponibilidad(estado, a.id, 'terminado');
  eq(perfumesDisponibles(fin.estado).map((p) => p.nombre), ['B'], 'Lo terminado no se recomienda');
  eq(coleccionPerfumes(fin.estado).length, 2, '⚠️ Pero sigue en la colección: es historia, no basura');

  const int = ponerIntensidadPerfume(estado, a.id, 'ligera');
  eq(perfume(int.estado, a.id).intensidad, 'ligera', 'Y se le pone intensidad');
  eq(ponerIntensidadPerfume(estado, a.id, 'x').error, 'Esa intensidad no existe.', 'Una que no existe, no');

  eq(coleccionPerfumes(alternarPartePerfumes(estado, 'coleccion')), [],
    'Prueba 16: apagar la colección la deja de enseñar');
  eq(perfumes(alternarPartePerfumes(estado, 'coleccion')).length, 2, '⚠️ Pero los datos se conservan');
}

/* ── 3 · LA RECOMENDACIÓN (apartado 7) ──────────────────────────────────── */
console.log('\n3 · ⚠️ No es una nota: es una explicación');

eq(OCASIONES_RECOMENDAR.length, 8, 'Las ocho ocasiones del apartado 5');
eq(EPOCAS.map((e) => e.id), ['calor', 'entretiempo', 'frio', 'todo'], 'Y las cuatro épocas del apartado 6');
ok(EPOCAS.every((e) => Array.isArray(e.deLaF24) && e.deLaF24.length > 0),
  '⚠️ Cada una dice qué temporadas de la Fase 24 le valen: "entretiempo" no existía allí');

{
  const { estado, a, b } = conDos();
  const r = recomendarPerfume(estado, { ocasion: 'noche', epoca: 'frio', hoy: HOY });
  eq(r.hay, true, 'Prueba 7: se recomienda uno');
  eq(r.perfume.nombre, 'A', 'El que más encaja');
  ok(r.porque.endsWith('.'), 'Con su porqué, en una frase');
  ok(/encaja con tus preferencias/i.test(r.porque), '⚠️ Que nombra sus preferencias, como el ejemplo');
  ok(/lo has marcado como adecuado para noche/.test(r.porque), 'Y la ocasión que él marcó');
  ok(/^[A-ZÁÉÍÓÚ]/.test(r.porque), 'Y empieza en mayúscula: es una frase, no una lista');
  ok(r.titulo.includes('noche'), 'Con su título, el del ejemplo del enunciado');
  eq(r.guardado, false, '⚠️ Y escrito en el dato: recomendar no guarda nada');

  /* ⚠️ Recomendar NO escribe. */
  const antes = JSON.stringify(normalizarEstiloHombre(estado));
  recomendarPerfume(estado, { ocasion: 'noche', hoy: HOY });
  eq(JSON.stringify(normalizarEstiloHombre(estado)), antes, '⚠️ Y no escribe ni un byte');

  /* ⚠️ Sin motivos, no sale. "C" no comparte aromas, no está marcado para la
     noche y no tiene temporada: no hay nada que decir de él, así que no entra. */
  const otro = anadirPerfume(estado, { nombre: 'C', tipo: ['amaderados'] }, { hoy: HOY }).estado;
  eq(recomendarPerfume(otro, { ocasion: 'noche', hoy: HOY }).total, 2,
    '⚠️ El que no encaja con nada NO se propone: siguen siendo dos');

  // Sin colección, se dice qué falta.
  const vacio = recomendarPerfume(base(), { ocasion: 'noche', hoy: HOY });
  eq(vacio.hay, false, 'Sin perfumes no hay recomendación');
  ok(/Añade algún perfume/.test(vacio.texto), '⚠️ Y se dice qué falta, en vez de una pantalla vacía');
  eq(recomendarPerfume(alternarPartePerfumes(estado, PARTE_RECOMENDACIONES_PERFUME), { hoy: HOY }).activo, false,
    'Prueba 16: y apagadas, no se calcula nada');
}

/* ⚠️ Y lo que dijo evitar NO se propone (apartado 3 de la F24). */
{
  let e = base();
  e = contestarPerfume(e, 'aromasQueNoGustan', 'dulces', { hoy: HOY }).estado;
  e = anadirPerfume(e, { nombre: 'Dulce', tipo: ['dulces'], ocasiones: ['noche'] }, { hoy: HOY }).estado;
  eq(recomendarPerfume(e, { ocasion: 'noche', hoy: HOY }).hay, false,
    '⚠️ Un perfume con un aroma que dijo evitar NO se le propone');
}

/* ── 4 · "OTRA OPCIÓN" TIENE MEMORIA (apartado 8) ───────────────────────── */
console.log('\n4 · ⚠️ "Otra opción", y con memoria por ocasión');

{
  const { estado, a, b } = conDos();
  eq(recomendarPerfume(estado, { ocasion: 'noche', hoy: HOY }).hayMas, true, 'Se dice que hay más de una');
  const otra = recomendarPerfume(estado, { ocasion: 'noche', hoy: HOY, saltar: 1 });
  eq(otra.perfume.nombre, 'B', 'Prueba 8: "otra opción" da el siguiente compatible');
  eq(recomendarPerfume(estado, { ocasion: 'noche', hoy: HOY, saltar: 9 }).perfume.nombre, 'B',
    '⚠️ Y pedir más de las que hay devuelve la última, no un hueco');

  const desc = descartarPerfume(estado, a.id, { ocasion: 'noche', hoy: HOY });
  eq(recomendarPerfume(desc.estado, { ocasion: 'noche', hoy: HOY }).perfume.nombre, 'B',
    '⚠️ Y el descartado deja de proponerse');
  /* ⚠️ **Por ocasión**: descartarlo para la noche no lo descarta para otra cosa.
     Se marca "A" también para trabajo y se pide una recomendación de trabajo:
     sigue saliendo, porque lo que descartó fue para la noche. */
  eq(datosRecsPerfume(desc.estado).descartes[0].ocasion, 'noche',
    '⚠️ El descarte se guarda CON su ocasión, no en general');
  const paraTrabajo = editarPerfume(desc.estado, a.id, { ocasiones: ['noche', 'trabajo'] }).estado;
  eq(recomendarPerfume(paraTrabajo, { ocasion: 'trabajo', hoy: HOY }).perfume.nombre, 'A',
    '⚠️ Y para el trabajo SIGUE saliendo: descartarlo para la noche no lo descarta para todo');
  eq(recomendarPerfume(paraTrabajo, { ocasion: 'noche', hoy: HOY }).perfume.nombre, 'B',
    'Mientras que para la noche, no');

  eq(datosRecsPerfume(deshacerDescartePerfume(desc.estado, a.id, { ocasion: 'noche' }).estado).descartes.length, 0,
    'Y se puede deshacer');
  eq(descartarPerfume(estado, 'x').error, 'Ese perfume no existe.', 'Sobre lo que no hay, avisa');
  /* ⚠️ Y caduca: "no repetir continuamente" no es "nunca más". */
  const viejo = descartarPerfume(estado, a.id, { ocasion: 'noche', hoy: '2026-01-01' });
  eq(recomendarPerfume(viejo.estado, { ocasion: 'noche', hoy: HOY }).perfume.nombre, 'A',
    `⚠️ Y el descarte caduca a los ${DIAS_DESCARTE} días: "continuamente" no es "nunca más"`);
}

/* ── 5 · COMPARAR (apartado 9) ──────────────────────────────────────────── */
console.log('\n5 · Comparar — con el motor de la Fase 17');

eq(FILAS_COMPARACION_PERFUME.map((f) => f.id), ['intensidad', 'ocasion', 'temporada', 'valoracion'],
  'Las cuatro filas del enunciado');
ok(!/function\s+compararGenerico/.test(codigo), '⚠️ Y la mecánica no se reescribe: es la del motor');

{
  const { estado, a, b } = conDos();
  eq(compararPerfumes(estado, [a.id]).suficiente, false, 'Con uno no hay comparación');
  const c = compararPerfumes(estado, [a.id, b.id]);
  eq(c.suficiente, true, 'Prueba 9: con dos, sí');
  eq(c.filas.find((f) => f.id === 'intensidad').valores, ['Media', 'Intensa'], 'Con sus intensidades');
  eq(c.filas.find((f) => f.id === 'temporada').valores, ['Otoño/invierno', '—'],
    '⚠️ Y lo que no se sabe sale como una raya, nunca como un cero');
  eq(c.filas.find((f) => f.id === 'valoracion').valores, ['—', '—'], 'Sin valorar, dos rayas');
  const val = valorarPerfume(estado, a.id, 5);
  eq(compararPerfumes(val.estado, [a.id, b.id]).filas.find((f) => f.id === 'valoracion').valores, ['5/5', '—'],
    'Y con nota, la nota');
  ok(!/mejor|ganador|peor/i.test(codigo), '⚠️ Y la comparación no elige: ni "mejor" ni un ganador');
}

/* ── 6 · ROTACIÓN Y "NO REPETIR" (apartados 10 y 11) ────────────────────── */
console.log('\n6 · ⚠️ Rotación y estadísticas: solo si él las activa');

{
  const { estado, a } = conDos();
  eq(rotacionPerfumes(estado), null,
    '⚠️ Apagada devuelve `null`, no una lista vacía: apagada y vacía son dos cosas');
  eq(tocaHoyEnRotacion(estado, { hoy: HOY }), null, 'Y hoy no toca nada');
  eq(estadisticasPerfumes(estado, { hoy: HOY }), null, '⚠️ Y las estadísticas, lo mismo (apartado 17)');

  const conRot = alternarPartePerfumes(estado, PARTE_ROTACION);
  ok(Array.isArray(rotacionPerfumes(conRot)), 'Prueba 10: al activarla, ya hay rotación');
  eq(rotacionPerfumes(conRot).length, 7, 'Con sus siete días');
  eq(rotacionPerfumes(conRot).every((d) => d.perfume === null), true, '⚠️ Y ninguno asignado: no se asume');

  const lunes = ponerEnRotacion(conRot, 1, a.id);
  eq(rotacionPerfumes(lunes.estado).find((d) => d.id === 1).perfume.nombre, 'A', 'Se asigna un perfume a un día');
  eq(tocaHoyEnRotacion(lunes.estado, { hoy: '2026-08-31' }).nombre, 'A', 'Y el lunes toca ese');
  eq(tocaHoyEnRotacion(lunes.estado, { hoy: HOY }), null, 'El viernes, ninguno');
  eq(ponerEnRotacion(conRot, 9, a.id).error, 'Ese día no existe.', 'Un día que no existe, no');
  eq(ponerEnRotacion(conRot, 1, 'x').error, 'Ese perfume no existe.', 'Ni un perfume que no está');
  eq(rotacionPerfumes(ponerEnRotacion(lunes.estado, 1, null).estado).find((d) => d.id === 1).perfume, null,
    'Y se puede quitar');
}

/* ⚠️ Prueba 11 — "no repetir" BAJA de sitio, no esconde. */
{
  let { estado, a, b } = conDos();
  estado = ponerEspera(estado, 'tres').estado;
  eq(datosRecsPerfume(estado).espera, 'tres', 'Prueba 11: se configura la espera');
  estado = registrarUso(estado, { perfumeId: a.id, fecha: '2026-08-27' }, { hoy: HOY }).estado;

  const r = recomendarPerfume(estado, { ocasion: 'noche', hoy: HOY });
  eq(r.perfume.nombre, 'B', '⚠️ El usado ayer BAJA, y sale el otro');
  const soloA = recomendarPerfume(estado, { ocasion: 'noche', hoy: HOY, saltar: 1 });
  eq(soloA.perfume.nombre, 'A', '⚠️ Pero SIGUE ahí: no se esconde, que sería decidir por él');
  ok(soloA.aviso.includes('1 día'), 'Y se dice cuándo lo usó');

  eq(ponerEspera(estado, 'personalizado').error, 'Dime cuántos días, con un número.', '"Personalizado" pide su cifra');
  eq(ponerEspera(estado, 'personalizado', 0).error, 'Dime cuántos días, con un número.', '⚠️ Y un 0 no es una espera');
  eq(datosRecsPerfume(ponerEspera(estado, 'personalizado', 5).estado).esperaDias, 5, 'Con cifra, sí');
  eq(ponerEspera(estado, 'inventada').error, 'Esa opción no existe.', 'Una que no existe, no');
  eq(datosRecsPerfume(ponerEspera(estado, null).estado).espera, null, 'Y se puede quitar');
}

/* ── 7 · ESTADÍSTICAS (apartado 17) ─────────────────────────────────────── */
console.log('\n7 · Estadísticas — tres cifras, y ni una más');

{
  let { estado, a, b } = conDos();
  estado = alternarPartePerfumes(estado, PARTE_ESTADISTICAS);
  const vacias = estadisticasPerfumes(estado, { hoy: HOY });
  eq(vacias.masUsado, null, '⚠️ Sin ni un uso NO hay "más utilizado": todos empatan a cero');
  ok(/Cuando apuntes/.test(vacias.texto), 'Y se dice, en vez de inventarlo');

  estado = valorarPerfume(estado, b.id, 5).estado;
  estado = registrarUso(estado, { perfumeId: a.id, fecha: '2026-08-20' }, { hoy: HOY }).estado;
  estado = registrarUso(estado, { perfumeId: a.id, fecha: '2026-08-21' }, { hoy: HOY }).estado;

  const s = estadisticasPerfumes(estado, { hoy: HOY });
  eq(s.masUsado.nombre, 'A', 'Prueba 15: el más utilizado');
  eq(s.masUsado.usos, 2, 'Con sus usos');
  eq(s.masValorado.nombre, 'B', 'El más valorado');
  eq(s.menosUsado.nombre, 'B', 'Y el menos utilizado');
  ok(!('media' in s) && !('porcentaje' in s), '⚠️ Y ni una media ni un porcentaje: "sin estadísticas complejas"');
  eq(estadisticasPerfumes(alternarPartePerfumes(estado, PARTE_ESTADISTICAS), { hoy: HOY }), null,
    'Prueba 16: apagarlas las quita');
}

/* ── 8 · COMPRA Y ALTERNATIVAS (apartados 14 y 15) ──────────────────────── */
console.log('\n8 · La compra, con el catálogo global');

{
  let { estado, a, b } = conDos();
  eq(dondeComprarlo(estado, a.id).hay, false, 'Sin enlazarlo, no hay dónde verlo');
  ok(/No lo has enlazado/.test(dondeComprarlo(estado, a.id).texto),
    '⚠️ Y se dice: no se inventa ni una tienda ni un precio');

  estado = crearProductoPiel(estado, {
    nombre: 'A', categoria: 'otros', precio: 60,
    tiendas: [{ tipo: 'amazon', url: 'https://www.amazon.es/dp/X', afiliado: true }],
  }, { hoy: HOY }).estado;
  const pid = productosPiel(estado).find((p) => p.nombre === 'A').id;
  const conFicha = anadirPerfume(estado, { nombre: 'Con ficha', productoId: pid }, { hoy: HOY });
  const d = dondeComprarlo(conFicha.estado, conFicha.perfume.id);
  eq(d.hay, true, 'Prueba 14: con ficha, sí hay dónde');
  eq(d.precio, 60, '⚠️ Y el precio sale de la FICHA de la Fase 17, no de aquí');
  ok(d.aviso.length > 0, 'Con su aviso de afiliación, porque el enlace lo es');
  eq(dondeComprarlo(estado, 'x').hay, false, 'Sobre lo que no hay, `false`');
}

{
  let { estado, a, b } = conDos();
  const alt = alternativasDePerfume(estado, a.id);
  eq(alt.hay, true, 'Prueba 14: hay alternativas en su colección');
  eq(alt.alternativas[0].nombre, 'B', 'La que comparte cosas');
  ok(alt.alternativas[0].motivos.length > 0, '⚠️ Y cada una dice POR QUÉ lo es');
  ok(alt.alternativas[0].motivos.some((m) => /familia olfativa|misma ocasión/.test(m)),
    'Con los criterios del apartado 15');
  eq(alternativasDePerfume(estado, 'x').hay, false, 'Sobre lo que no hay, `false`');
  const solo = anadirPerfume(base(), { nombre: 'Solo', tipo: ['frescos'] }, { hoy: HOY });
  ok(/no tienes otro parecido/.test(alternativasDePerfume(solo.estado, solo.perfume.id).porque),
    '⚠️ Y sin ninguna se dice, en vez de una lista vacía sin explicar');
}

/* ── 9 · EL NORMALIZADOR (regla 5) ──────────────────────────────────────── */
console.log('\n9 · ⚠️ El normalizador y los ids que apuntan a la nada');

['descartes', 'rotacion', 'espera', 'esperaDias'].forEach((c) =>
  ok(c in DEFAULT_RECS_PERFUME, `\`${c}\` está declarado en el DEFAULT`));

{
  let { estado, a } = conDos();
  estado = alternarPartePerfumes(estado, PARTE_ROTACION);
  estado = ponerEnRotacion(estado, 1, a.id).estado;
  estado = descartarPerfume(estado, a.id, { ocasion: 'noche', hoy: HOY }).estado;
  estado = ponerEspera(estado, 'semana').estado;

  const ida = datosRecsPerfume(estado);
  eq(ida.descartes.length, 1, '⚠️ El descarte sobrevive');
  eq(Object.keys(ida.rotacion), ['1'], 'Y la rotación');
  eq(ida.espera, 'semana', 'Y la espera');

  /* ⚠️ Y si borra el perfume, lo que apuntaba a él **se limpia**. */
  const del = eliminarPerfume(estado, a.id);
  eq(datosRecsPerfume(del.estado).descartes.length, 0, '⚠️ Borrar el perfume limpia su descarte');
  eq(Object.keys(datosRecsPerfume(del.estado).rotacion).length, 0, 'Y su día de rotación');

  eq(normalizarRecsPerfume({ rotacion: { 9: 'x' } }, ['x']).rotacion, {}, 'Un día que no existe no se guarda');
  eq(normalizarRecsPerfume({ esperaDias: 0 }).esperaDias, null, '⚠️ Y un 0 no son días de espera');
  eq(normalizarDescartePerfume({}), null, 'Un descarte sin perfume ni fecha no existe');
  eq(normalizarRecsPerfume(null).descartes, [], 'Sin nada guardado, vacío');
}

/* ── 10 · EL PANEL Y LA REGLA 8 ─────────────────────────────────────────── */
console.log('\n10 · El panel');

{
  const { estado } = conDos();
  const p = panelRecsPerfume(estado, { ocasion: 'noche', hoy: HOY });
  eq(p.coleccion.length, 2, 'Trae la colección');
  eq(p.ocasiones.length, 8, 'Y las ocasiones que puede pedir');
  eq(p.epocas.length, 4, 'Y las épocas');
  eq(p.recomendacion.hay, true, 'Y la recomendación');
  eq(p.rotacion, null, '⚠️ Con la rotación en `null` porque está apagada');
  eq(p.estadisticas, null, 'Y las estadísticas también');

  const r = resumenRecsPerfume(estado, { hoy: HOY });
  eq(r.rotacion, null, '⚠️ El resumen también dice `null`, no 0');
  eq([r.coleccion, r.disponibles], [2, 2], 'Y cuadra');
}

ok(!/proximamente|en construcción/i.test(fuente), 'Ni un "próximamente"');
ok(!/Math\.random/.test(codigo), 'Ni una cifra inventada');
ok(textosDeRecsPerfume().length > 20, `Y ${textosDeRecsPerfume().length} textos declarados`);

if (fallos > 0) { console.log(`\n  ${fallos} de ${n} comprobaciones han fallado.`); process.exit(1); }
console.log(`\n  ${n} comprobaciones correctas.`);
