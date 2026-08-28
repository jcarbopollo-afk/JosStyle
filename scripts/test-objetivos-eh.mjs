// ============================================================================
// EH · Fase 28/65 — Objetivos y experiencias personales
//
// Las trece pruebas del apartado 14, y lo que gobierna la fase:
//   · NO se crea otro sistema de objetivos: se usa el que ya existe
//   · lo único que se guarda aquí es un `objetivoId`
//   · el progreso del sistema global es un sí/no, no un porcentaje
//   · "Ya lo hice" se PROPONE, y sin `confirmado` no escribe
// ============================================================================

import { readFileSync } from 'node:fs';
import { DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre } from '../src/lib/estiloDeHombre.js';
import { PLAZOS_OBJETIVO as PLAZOS_DE_TOKENS, DEFAULT_OBJETIVOS } from '../src/tokens.js';
import { CATALOGO_PAPELERA } from '../src/lib/papelera.js';
import { eventosDerivados } from '../src/lib/calendarioIntegracion.js';
import {
  configurarGustos, anadirGusto, entradasDeGustos, datosGustos, normalizarGustos,
  normalizarEntradaGusto, alternarParteGustos, parteActivaGustos, ponerFechaGusto,
  cambiarEstadoGusto, eliminarGusto, restaurarGusto, CATEGORIAS_GUSTO, PARTES_GUSTOS,
  DESTINO_DIARIO, alternarFavoritoGusto,
} from '../src/lib/gustos.js';
import {
  MODULO_OBJETIVOS, CATEGORIA_EXPERIENCIAS, PARTE_EXPERIENCIAS, TEXTOS_PUENTE,
  DESTINO_OBJETIVOS, PLAZOS_OBJETIVO, objetivoDe, estadoDelObjetivo,
  quieroHacerConObjetivo, experiencias, prepararObjetivo, aplicarObjetivo,
  desenlazarObjetivo, sugerirYaLoHice, marcarYaLoHice, avisoDeExperiencia,
  CATEGORIA_AVISO, resumenPuente, auditarPuente, textosDelPuente, panelPuente,
} from '../src/lib/objetivosEnEstiloHombre.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-08-28';
const OBJ = () => ({ ...DEFAULT_OBJETIVOS, lista: [] });
const base = () => configurarGustos(
  configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['gustos', 'estilo']), { hoy: HOY },
).estado;

/** Un "Quiero hacer" recién creado. */
const conQuiero = (datos = {}, e = base()) => {
  const r = anadirGusto(e, {
    nombre: 'Viajar a Japón', tipo: 'hacer', categoria: 'experiencias', ...datos,
  }, { hoy: HOY });
  return { estado: r.estado, entrada: r.entrada };
};

/** Y el mismo, ya convertido en objetivo. */
const conObjetivo = (plazo = '1 año') => {
  const q = conQuiero();
  const p = prepararObjetivo(q.estado, OBJ(), q.entrada.id, { plazo, hoy: HOY });
  const r = aplicarObjetivo(q.estado, OBJ(), p.plan);
  return { estado: r.estado, objetivos: r.objetivos, entradaId: q.entrada.id, objetivo: r.objetivo };
};

const cumplir = (objetivos) => ({ ...objetivos, lista: objetivos.lista.map((o) => ({ ...o, cumplido: true })) });

console.log('\n🎯  EH · Fase 28/65 — Objetivos y experiencias personales\n');

/* ===========================================================================
   Test 1 — ⚠️ NO SE CREA OTRO SISTEMA DE OBJETIVOS (objetivo de la fase)
   =========================================================================== */
console.log('Test 1 — ⚠️ el sistema de objetivos es el que ya existía');
{
  ok(PLAZOS_OBJETIVO === PLAZOS_DE_TOKENS,
    '⚠️ los plazos son LOS DE OBJETIVOS (tokens.js), no una lista nueva');
  eq(PLAZOS_OBJETIVO.length, 5, 'los cinco tramos que ya tenía');
  eq(DESTINO_OBJETIVOS, 'objetivos', 'y se navega al módulo que ya existe');
  eq(MODULO_OBJETIVOS, 'objetivos', 'con su nombre de siempre');

  const a = auditarPuente(base(), OBJ());
  eq(a.sistemasDeObjetivos, 0, 'la auditoría: cero sistemas de objetivos nuevos');
  eq(a.objetivosGuardadosAqui, 0, 'ni un objetivo guardado en Estilo de hombre');
  eq(a.gestoresNuevos, 0, 'cero gestores nuevos (apartado 4)');
  eq(a.diariosNuevos, 0, 'cero diarios (apartado 6)');
  eq(a.galeriasNuevas, 0, 'cero galerías (apartado 7)');
  eq(a.calendariosNuevos, 0, 'cero calendarios (apartado 8)');
  eq(a.papelerasNuevas, 0, 'cero papeleras (apartado 13)');
  eq(a.tareasCreadas, 0, 'y cero tareas: *"no crea otro sistema de productividad"*');
  eq(a.favoritosNuevos, 0, 'los favoritos son los globales (apartado 11)');
  eq(a.campoAnadido, 'objetivoId', '⚠️ y lo ÚNICO que esta fase guarda es un id');

  const fuente = readFileSync(new URL('../src/lib/objetivosEnEstiloHombre.js', import.meta.url), 'utf8');
  ok(!/from '\.\/productividad/.test(fuente), 'el puente no importa nada de Productividad');
  ok(!/from '\.\/diario/.test(fuente), 'ni del Diario');
  ok(!/from '\.\/calendario/.test(fuente), 'ni del Calendario');
  ok(!/\bpedirIA|askAI|anthropic/i.test(fuente), 'y no llama a la IA');
}

/* ===========================================================================
   Test 2 — CONVERTIR EN OBJETIVO (apartados 1, 2 y 3 · pruebas 1 y 2)
   =========================================================================== */
console.log('\nTest 2 — convertir "Quiero hacer" en objetivo');
{
  const q = conQuiero();
  eq(q.entrada.objetivoId, null, 'un "Quiero hacer" nace sin objetivo');
  eq(estadoDelObjetivo(q.entrada, OBJ()).texto, 'Todavía no es un objetivo.', 'y se dice');

  /* ⚠️ Sin plazo NO hay plan: elegirlo por él metería su viaje en "30 días". */
  const sin = prepararObjetivo(q.estado, OBJ(), q.entrada.id, {});
  eq(sin.plan, null, '⚠️ sin plazo no hay plan, y no hay valor por defecto');
  ok(!!sin.error, 'se dice que elija');
  eq(sin.plazos, PLAZOS_OBJETIVO, 'ofreciéndole los que hay');
  const malo = prepararObjetivo(q.estado, OBJ(), q.entrada.id, { plazo: 'mañana' });
  eq(malo.plan, null, 'un plazo que no existe tampoco vale');

  const p = prepararObjetivo(q.estado, OBJ(), q.entrada.id, { plazo: '1 año', hoy: HOY });
  ok(!!p.plan, 'con plazo sí hay plan');
  eq(Object.keys(p.plan.objetivo).sort(), ['cumplido', 'fechaCreacion', 'id', 'plazo', 'texto'],
    '⚠️ el objetivo tiene EXACTAMENTE los campos de Objetivos, ni uno inventado');
  eq(p.plan.objetivo.texto, 'Viajar a Japón', 'con el nombre que él ya había escrito');
  eq(p.plan.objetivo.cumplido, false, 'sin cumplir');

  const r = aplicarObjetivo(q.estado, OBJ(), p.plan);
  eq(r.error, null, 'se aplica sin error');
  eq(r.objetivos.lista.length, 1, '⚠️ y el objetivo va A OBJETIVOS, que es donde vive');
  eq(entradasDeGustos(r.estado, 'hacer')[0].objetivoId, r.objetivo.id,
    '⚠️ mientras que aquí solo queda su id');
  eq(datosGustos(r.estado).entradas[0].texto, undefined, 'ni una copia del texto del objetivo');
  eq(datosGustos(r.estado).entradas[0].plazo, undefined, 'ni de su plazo');

  const otra = prepararObjetivo(r.estado, r.objetivos, q.entrada.id, { plazo: '5 años' });
  ok(otra.sinEfecto, '⚠️ convertirlo dos veces no crea un segundo objetivo');
  eq(otra.plan, null, 'y no devuelve plan');

  const gusto = anadirGusto(base(), { nombre: 'Fútbol', tipo: 'gusta' }, { hoy: HOY });
  ok(!!prepararObjetivo(gusto.estado, OBJ(), gusto.entrada.id, { plazo: '1 año' }).error,
    'un "Me gusta" no se convierte en objetivo: el botón es del apartado 1');
  ok(!!prepararObjetivo(base(), OBJ(), 'noexiste', { plazo: '1 año' }).error, 'lo que no existe se dice');
  ok(!!aplicarObjetivo(base(), OBJ(), null).error, 'y aplicar sin plan tampoco hace nada');
}

/* ===========================================================================
   Test 3 — ⚠️ EL PROGRESO ES UN SÍ O UN NO (apartados 3 y 10)
   =========================================================================== */
console.log('\nTest 3 — ⚠️ ni porcentajes ni campos inventados');
{
  const c = conObjetivo();
  const e = estadoDelObjetivo(entradasDeGustos(c.estado, 'hacer')[0], c.objetivos);
  eq(e.enlazado, true, 'el objetivo se lee de Objetivos');
  eq(e.cumplido, false, '⚠️ y su progreso es un booleano, no un porcentaje');
  ok(!('progreso' in e) && !('porcentaje' in e), 'no hay ningún campo de porcentaje');
  eq(e.texto, 'Es un objetivo a 1 año.', 'y se enseña lo que hay');
  ok(TEXTOS_PUENTE.sinPorcentaje.includes('cumplido'),
    '⚠️ y la pantalla lo dice: *"un objetivo está cumplido o no"* (regla 8)');

  const cumplido = estadoDelObjetivo(entradasDeGustos(c.estado, 'hacer')[0], cumplir(c.objetivos));
  eq(cumplido.cumplido, true, 'al cumplirlo en Objetivos, aquí se ve cumplido');
  ok(cumplido.texto.includes('Cumplido'), 'con su frase');

  ['descripcion', 'prioridad', 'categoria', 'progreso'].forEach((campo) => {
    ok(!(campo in c.objetivo),
      `⚠️ el objetivo no tiene "${campo}": Objetivos no lo tiene, y aquí no se inventa`);
  });
  /* ⚠️ Y no falta nada, porque lo personal ya lo guarda la Fase 27. */
  const entrada = entradasDeGustos(c.estado, 'hacer')[0];
  ['categoria', 'prioridad', 'fecha', 'lugar', 'nota'].forEach((campo) => {
    ok(campo in entrada, `lo personal sigue en la entrada de la F27: "${campo}"`);
  });
}

/* ===========================================================================
   Test 4 — EXPERIENCIAS (apartado 4)
   =========================================================================== */
console.log('\nTest 4 — ⚠️ Experiencias es una vista, no un gestor');
{
  ok(CATEGORIAS_GUSTO.some((c) => c.id === CATEGORIA_EXPERIENCIAS),
    '⚠️ la categoría "experiencias" YA EXISTÍA en la Fase 27');
  ok(PARTES_GUSTOS.some((p) => p.id === PARTE_EXPERIENCIAS),
    'y la parte del apartado 12 es una línea de `PARTES_GUSTOS`');

  const c = conObjetivo();
  const exp = experiencias(c.estado, c.objetivos);
  eq(exp.map((x) => x.nombre), ['Viajar a Japón'], 'salen las de esa categoría');
  eq(exp[0].enlazado, true, 'unidas a su objetivo');

  const otra = anadirGusto(c.estado, { nombre: 'Piano', tipo: 'gusta', categoria: 'musica' }, { hoy: HOY });
  eq(experiencias(otra.estado, c.objetivos).map((x) => x.nombre), ['Viajar a Japón'],
    '⚠️ y lo de otra categoría NO se cuela: es un filtro, no una lista aparte');

  const apagada = alternarParteGustos(c.estado, PARTE_EXPERIENCIAS);
  eq(experiencias(apagada, c.objetivos), null,
    '⚠️ apagada devuelve `null`, no una lista vacía (lección de la F25)');
  eq(resumenPuente(apagada, c.objetivos).experiencias, null, 'y el resumen también');
  eq(datosGustos(apagada).entradas.length, 1, 'sin borrar nada');
  eq(c.objetivos.lista.length, 1, '⚠️ y el objetivo global NO se elimina (apartado 12)');
  eq(experiencias(alternarParteGustos(apagada, PARTE_EXPERIENCIAS), c.objetivos).length, 1,
    'al reactivarla vuelve entera');
}

/* ===========================================================================
   Test 5 — "YA LO HICE" SE PROPONE (apartado 5 · pruebas 7 y 8)
   =========================================================================== */
console.log('\nTest 5 — ⚠️ "Ya lo hice" se propone, no se hace solo');
{
  const c = conObjetivo();
  eq(sugerirYaLoHice(c.estado, c.objetivos), [], 'sin cumplir el objetivo no se propone nada');

  const objs = cumplir(c.objetivos);
  const s = sugerirYaLoHice(c.estado, objs);
  eq(s.length, 1, 'al cumplirlo, se propone marcarlo');
  eq(s[0].nombre, 'Viajar a Japón', 'diciendo cuál');
  eq(s[0].aplicada, false, '⚠️ escrito en el propio dato: proponer no es hacer');
  ok(s[0].texto.includes('¿'), 'y es una pregunta, no una orden');

  /* ⚠️ El noveno `aplicarPlan` del proyecto. */
  const sinConf = marcarYaLoHice(c.estado, objs, c.entradaId, {});
  eq(sinConf.aplicado, false, '⚠️ SIN `confirmado` no escribe');
  eq(entradasDeGustos(sinConf.estado, 'hacer')[0].estado, 'idea', 'y el estado sigue igual');

  const conConf = marcarYaLoHice(c.estado, objs, c.entradaId, { confirmado: true });
  eq(conConf.aplicado, true, 'con `confirmado` sí');
  eq(entradasDeGustos(conConf.estado, 'hacer')[0].estado, 'hecho', '🎯 Quiero hacer → ✅ Ya lo hice');
  eq(datosGustos(conConf.estado).entradas.length, 1,
    '⚠️ y NO borra nada: el apartado 6 de la F27 conserva el historial');
  eq(sugerirYaLoHice(conConf.estado, objs), [], 'y deja de proponerse');

  ok(!!marcarYaLoHice(c.estado, c.objetivos, c.entradaId, { confirmado: true }).error,
    'no se puede marcar si el objetivo no está cumplido');
  ok(!!marcarYaLoHice(c.estado, objs, 'noexiste', { confirmado: true }).error, 'ni sobre lo que no existe');
}

/* ===========================================================================
   Test 6 — UN OBJETIVO BORRADO EN OBJETIVOS (apartado 12)
   =========================================================================== */
console.log('\nTest 6 — si borra el objetivo en Objetivos');
{
  const c = conObjetivo();
  const entrada = entradasDeGustos(c.estado, 'hacer')[0];
  const e = estadoDelObjetivo(entrada, OBJ());
  eq(e.enlazado, false, 'el enlace deja de resolver');
  eq(e.perdido, true, 'y se marca como perdido');
  ok(e.texto.includes('ya no está'), '⚠️ se DICE, en vez de inventar un objetivo o callarse');
  eq(objetivoDe(entrada, OBJ()), null, 'y no hay objetivo que devolver');
  eq(resumenPuente(c.estado, OBJ()).perdidos, 1, 'el resumen lo cuenta');
  eq(datosGustos(c.estado).entradas.length, 1, '⚠️ pero la entrada de "Quiero hacer" NO se borra');

  const d = desenlazarObjetivo(c.estado, c.entradaId);
  eq(entradasDeGustos(d.estado, 'hacer')[0].objetivoId, null, 'se puede quitar el enlace');
  eq(c.objetivos.lista.length, 1, '⚠️ y el objetivo global sigue ahí: *"no se eliminan"*');
  eq(objetivoDe(null, c.objetivos), null, 'sin entrada no hay objetivo');
  eq(objetivoDe({ objetivoId: null }, c.objetivos), null, 'ni sin enlace');
}

/* ===========================================================================
   Test 7 — CALENDARIO, DIARIO Y RECORDATORIOS (apartados 6, 8 y 9)
   =========================================================================== */
console.log('\nTest 7 — los tres sistemas globales, sin duplicar ninguno');
{
  const c = conObjetivo();
  const f = ponerFechaGusto(c.estado, c.entradaId, '2026-09-10');
  const ev = eventosDerivados({ estiloHombre: f.estado, desde: '2026-09-01', hasta: '2026-09-30' });
  ok(ev.some((x) => x.origen === 'gustos'),
    '⚠️ la fecha llega al calendario GLOBAL, por la puerta que abrió la F27');
  ok(ev.filter((x) => x.origen === 'gustos').every((x) => x.soloLectura),
    'de solo lectura: aquí no se crea ningún evento');

  eq(DESTINO_DIARIO, 'diario', '⚠️ el Diario es el que ya existe (apartado 6)');

  // Apartado 9 — el aviso se DECIDE aquí y lo manda el emisor de siempre.
  eq(avisoDeExperiencia(c.estado, c.objetivos, { hoy: HOY }), null, 'sin nada para hoy, no hay aviso');
  const hoyMismo = ponerFechaGusto(c.estado, c.entradaId, HOY).estado;
  const aviso = avisoDeExperiencia(hoyMismo, c.objetivos, { hoy: HOY });
  ok(!!aviso, 'con algo para hoy, sí');
  eq(aviso.categoria, CATEGORIA_AVISO, 'con su categoría, que el interruptor global respeta');
  eq(aviso.emisor, 'notificaciones.js',
    '⚠️ y quien MANDA es `notificaciones.js`: nunca un segundo emisor');
  eq(avisoDeExperiencia(alternarParteGustos(hoyMismo, PARTE_EXPERIENCIAS), c.objetivos, { hoy: HOY }), null,
    'con la parte apagada no avisa');
  const hecho = cambiarEstadoGusto(hoyMismo, c.entradaId, 'hecho').estado;
  eq(avisoDeExperiencia(hecho, c.objetivos, { hoy: HOY }), null,
    '⚠️ y de lo que ya hizo no se avisa: es historial, no un plan');

  ok(TEXTOS_PUENTE.sinFotos.includes('Todavía no hay dónde'),
    '⚠️ apartado 7 — sin sistema de fotos al que colgarlo, se DICE (regla 8)');
}

/* ===========================================================================
   Test 8 — ELIMINAR Y RECUPERAR (apartado 13 · pruebas 3 y 4)
   =========================================================================== */
console.log('\nTest 8 — la papelera es la global, y el objetivo no se toca');
{
  ok(!!CATALOGO_PAPELERA['gustos.entradas'], 'la colección ya estaba en el catálogo global');
  const c = conObjetivo();
  const del = eliminarGusto(c.estado, c.entradaId, { ahora: '2026-08-28T10:00:00.000Z' });
  eq(entradasDeGustos(del.estado, 'hacer').length, 0, 'la entrada se va a la papelera');
  eq(c.objetivos.lista.length, 1, '⚠️ y el objetivo global se queda: es de Objetivos');

  const vuelto = restaurarGusto(del.estado, del.entrada);
  eq(entradasDeGustos(vuelto.estado, 'hacer').length, 1, 'restaurar la devuelve');
  eq(entradasDeGustos(vuelto.estado, 'hacer')[0].objetivoId, c.objetivo.id,
    '⚠️ CON SU ENLACE INTACTO: el objetivo sigue siendo el suyo');
}

/* ===========================================================================
   Test 9 — PERSISTENCIA (regla 5 · prueba 13)
   =========================================================================== */
console.log('\nTest 9 — el enlace sobrevive al normalizador');
{
  const c = conObjetivo();
  const antes = datosGustos(c.estado);
  const despues = normalizarGustos(JSON.parse(JSON.stringify(antes)));
  eq(despues, antes, '⚠️ guardar y volver a leer devuelve lo mismo (regla 5)');
  eq(despues.entradas[0].objetivoId, c.objetivo.id,
    '⚠️ y `objetivoId` SOBREVIVE: sin su línea en el normalizador se perdería');
  eq(normalizarEntradaGusto({ nombre: 'X', objetivoId: 123 }).objetivoId, null,
    'un id que no es texto no se guarda');
  eq(normalizarEntradaGusto({ nombre: 'X' }).objetivoId, null, 'y sin enlace, `null`');
  ok(parteActivaGustos(normalizarEstiloHombre(c.estado), PARTE_EXPERIENCIAS),
    'la parte nueva nace encendida y sobrevive');
  eq(normalizarGustos({}).partes[PARTE_EXPERIENCIAS], true, 'también en un guardado viejo');
  eq(normalizarGustos({ partes: { experiencias: false } }).partes[PARTE_EXPERIENCIAS], false,
    'respetando lo que él haya apagado');
}

/* ===========================================================================
   Test 10 — RESUMEN, PANEL Y TEXTOS
   =========================================================================== */
console.log('\nTest 10 — el panel que dibuja la pantalla');
{
  const c = conObjetivo();
  const objs = cumplir(c.objetivos);
  const p = panelPuente(c.estado, objs);
  eq(p.quieroHacer.length, 1, 'el panel trae lo que quiere hacer');
  eq(p.quieroHacer[0].enlazado, true, 'con su objetivo unido');
  eq(p.experiencias.length, 1, 'las experiencias');
  eq(p.sugerencias.length, 1, 'y lo que se le propone');
  eq(p.plazos, PLAZOS_OBJETIVO, 'ofreciendo los plazos de Objetivos');
  eq(p.destino, 'objetivos', 'y el destino al que navegar');

  const r = resumenPuente(c.estado, objs);
  eq(r.quieroHacer, 1, 'el resumen cuenta las entradas');
  eq(r.enlazados, 1, 'las enlazadas');
  eq(r.cumplidos, 1, 'las cumplidas');
  eq(r.porMarcar, 1, 'y las que están por marcar');

  const favorito = alternarFavoritoGusto(c.estado, c.entradaId);
  eq(entradasDeGustos(favorito.estado, 'hacer')[0].favorito, true,
    '⚠️ el favorito es el de la F27 (apartado 11), no uno nuevo');

  ok(textosDelPuente().length >= 5, 'los textos se pueden barrer');
  ok(textosDelPuente().every((t) => typeof t === 'string' && t.length > 0), 'y ninguno está vacío');
  ok(!textosDelPuente().some((t) => /debes|tienes que|obligatorio/i.test(t)),
    'ninguno le manda');
  ok(TEXTOS_PUENTE.dondeVive.includes('Objetivos'),
    '⚠️ y la pantalla dice dónde se gestionan de verdad (apartado 2)');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
