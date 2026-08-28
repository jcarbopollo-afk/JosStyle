// ============================================================================
// EH · Fase 24/65 — Perfumes y fragancias: perfil personal
//
// Las quince pruebas del apartado 19, y lo que gobierna la fase:
//   · los aromas son un dato COMPARTIDO, para que la F18 no los repregunte
//   · lo que NO le gusta pesa tanto como lo que le gusta (apartado 3)
//   · "mi perfume actual" NO es "mi favorito" (apartado 12)
//   · el catálogo de productos es el global (apartado 17)
// ============================================================================

import { readFileSync } from 'node:fs';
import { DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre, moduloEH } from '../src/lib/estiloDeHombre.js';
import { REGISTRO_DATOS } from '../src/lib/datosEstiloHombre.js';
import { CATALOGO_PAPELERA } from '../src/lib/papelera.js';
import { crearProductoPiel, productosPiel } from '../src/lib/productosPiel.js';
import {
  MODULO_PERFUMES, TEXTOS_PERFUMES, PARTES_PERFUMES, partePerfumes, PLAQUITAS_PERFUMES,
  AROMAS, aroma, AROMAS_DESCARTABLES, INTENSIDADES, QUE_VALORA, OCASIONES, ocasion,
  TEMPORADAS, PRESUPUESTOS_PERFUME, SECCIONES_PERFUMES, PREGUNTAS_PERFUMES,
  preguntaPerfume, respuestaPerfume, contestarPerfume, borrarPerfume,
  preguntasDePerfumes, progresoPerfumes, seccionesDePerfumes, DEFAULT_PERFUMES,
  catalogoParaPerfumes, normalizarPerfume, normalizarUsoPerfume, normalizarPerfumes,
  datosPerfumes, decirAhoraNoPerfumes, configurarPerfumes, parteActivaPerfumes,
  alternarPartePerfumes, estadoDeEntradaPerfumes, perfumes, perfume, anadirPerfume,
  editarPerfume, alternarFavoritoPerfume, valorarPerfume, ponerPerfumeActual,
  perfumeActual, asignarPerfumeAOcasion, perfumesPorOcasion, eliminarPerfume,
  restaurarPerfume, anadirPorProbar, quitarPorProbar, moverAColeccion,
  registrarUso, eliminarUso, restaurarUso, historialPerfumes, chocaConSusGustos,
  contextoPerfumes, resumenPerfumes, auditarPerfumes, textosDePerfumes,
  panelPerfumes, NO_LO_SE, destinoDe,
} from '../src/lib/perfumes.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-08-28';
const base = () => configurarPerfumes(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['perfumes', 'skincare']), { hoy: HOY }).estado;
const conUno = (e = base(), datos = {}) => {
  const r = anadirPerfume(e, { nombre: 'Uno', marca: 'Marca', tipo: ['frescos'], ocasiones: ['noche'], ...datos }, { hoy: HOY });
  return { estado: r.estado, perfume: r.perfume };
};

const fuente = readFileSync(new URL('../src/lib/perfumes.js', import.meta.url), 'utf8');
const codigo = fuente
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/export function auditarPerfumes[\s\S]*?\n}/, '')
  .replace(/'[^'\n]*'/g, "''")
  .replace(/`[^`]*`/g, '``');

/* ── 1 · EL MÓDULO Y LO QUE NO SE DUPLICA ───────────────────────────────── */
console.log('\n1 · Una línea en el catálogo, y ni un sistema nuevo');

{
  const m = moduloEH(MODULO_PERFUMES);
  ok(!!m, 'Prueba 1: Perfumes está en el catálogo de módulos');
  ok(m.terminos.includes('colonia') && m.terminos.includes('fragancia'),
    'Con los sinónimos que él escribiría, en esa misma línea');
  const a = auditarPerfumes(base());
  eq([a.catalogosNuevos, a.inventariosNuevos, a.papelerasNuevas, a.favoritosNuevos], [0, 0, 0, 0],
    'Cero catálogos, inventarios, papeleras y favoritos nuevos');
  eq([a.tiendas, a.precios], [0, 0],
    '⚠️ Y cero tiendas: *"la idea no es convertirlo en una tienda de perfumes"*');
  eq(a.usaIA, 0, 'Y sin IA (apartado 16)');
}
ok(!/askAI|anthropic|claude|fetch\(/i.test(codigo), '⚠️ Ni una llamada a la IA en el código');

/* ⚠️ Prueba 15 — el catálogo de productos es el GLOBAL. */
{
  let e = crearProductoPiel(base(), { nombre: 'Un perfume del catálogo', categoria: 'otros' }, { hoy: HOY }).estado;
  const pid = productosPiel(e)[0].id;
  eq(catalogoParaPerfumes(e).length, 1, 'El catálogo son los productos que YA existen');
  const r = anadirPerfume(e, { nombre: 'Enlazado', productoId: pid }, { hoy: HOY });
  eq(r.perfume.productoId, pid, '⚠️ Y un perfume guarda su ID, no su ficha (apartado 17)');
  eq(productosPiel(r.estado).length, 1, '⚠️ Prueba 15: sin duplicar el catálogo');
  eq(anadirPerfume(e, { nombre: 'X', productoId: 'no-existe' }).error, 'Ese producto no existe.',
    'Y no se enlaza con uno que no está');
  ok(!/CATALOGO_PERFUMES|TIPOS_TIENDA/.test(codigo), 'Y aquí no hay ni catálogo ni tiendas propias');
}

/* ── 2 · ⚠️ LOS AROMAS SON UN DATO COMPARTIDO ───────────────────────────── */
console.log('\n2 · ⚠️ Los aromas se declaran compartidos, para que la F18 no los repregunte');

['aromasFavoritos', 'aromasQueNoGustan'].forEach((id) => {
  const d = REGISTRO_DATOS.find((x) => x.id === id);
  ok(!!d, `\`${id}\` está en el registro de la Fase 4`);
  ok(d.usan.includes('perfumes') && d.usan.includes('cuerpo'),
    `⚠️ Y declara que lo usan Perfumes **y Cuerpo**: la F18 lo leerá, no lo repreguntará`);
  eq(destinoDe(id), 'compartido', 'Así que va a la capa compartida, no a la `config`');
});
eq(destinoDe('intensidadPerfume'), 'del_modulo', 'Mientras que lo que solo es de aquí, se queda aquí');

/* ── 3 · ACTIVACIÓN Y PARTES (apartados 1 y 18) ─────────────────────────── */
console.log('\n3 · Activación y partes');

eq(TEXTOS_PERFUMES.configurar, 'Sí, configurarlo', 'El botón del enunciado');
eq(estadoDeEntradaPerfumes(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['perfumes'])), 'sin_configurar',
  'Prueba 1: se entra sin configurar');
eq(estadoDeEntradaPerfumes(decirAhoraNoPerfumes(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['perfumes'])).estado), 'ahora_no',
  '"Ahora no" se guarda, y el apartado no aparece');
eq(estadoDeEntradaPerfumes(base()), 'configurado', 'Y configurarlo también');

ok(['perfil', 'favoritos', 'historial', 'recomendaciones'].every((id) => PARTES_PERFUMES.some((p) => p.id === id)),
  'Las cuatro que se pueden quitar por separado (apartado 18 de la F24)');
/* ⚠️ EH F25 añadió Colección, Rotación y Estadísticas — su apartado 18 las lista
   con todo el derecho. Comprobar CUÁLES están, no cuántas hay. */
ok(['coleccion', 'rotacion', 'estadisticas'].every((id) => PARTES_PERFUMES.some((p) => p.id === id)),
  'Y las tres que añade el apartado 18 de la F25');
eq(PARTES_PERFUMES.filter((p) => !p.porDefecto).map((p) => p.id), ['rotacion', 'estadisticas'],
  '⚠️ Rotación y estadísticas nacen APAGADAS: "solamente si el usuario activa esta función"');

/* Pruebas 13 y 14: desactivar partes y reactivar, sin perder datos. */
{
  let { estado, perfume: p } = conUno();
  estado = alternarFavoritoPerfume(estado, p.id).estado;
  estado = registrarUso(estado, { perfumeId: p.id, ocasion: 'noche', valoracion: 4 }, { hoy: HOY }).estado;

  const sinFav = alternarPartePerfumes(estado, 'favoritos');
  eq(panelPerfumes(sinFav).favoritos, [], 'Prueba 13: apagar favoritos los deja de enseñar');
  eq(perfume(sinFav, p.id).favorito, true, '⚠️ Pero el perfume SIGUE marcado: apagar no borra');
  eq(perfumes(sinFav).length, 1, 'Y la colección sigue entera');

  const sinHist = alternarPartePerfumes(estado, 'historial');
  eq(historialPerfumes(sinHist), [], 'Apagar el historial lo deja de enseñar');
  eq(datosPerfumes(sinHist).historial.length, 1, '⚠️ Y sus registros siguen guardados');
  ok(registrarUso(sinHist, { perfumeId: p.id }, { hoy: HOY }).error, 'Y no se registra mientras está apagado');

  eq(panelPerfumes(alternarPartePerfumes(estado, 'favoritos')).favoritos.length, 0, 'Consistente');
  eq(panelPerfumes(alternarPartePerfumes(sinFav, 'favoritos')).favoritos.length, 1, 'Prueba 14: y al reactivar vuelve');
  eq(alternarPartePerfumes(estado, 'inventada'), normalizarEstiloHombre(estado), 'Alternar lo que no existe no hace nada');
  eq(partePerfumes('inventada'), null, 'Y una parte que no existe es `null`');
}

/* ── 4 · EL PERFIL (apartados 2 a 8) ────────────────────────────────────── */
console.log('\n4 · El perfil de fragancia');

eq(AROMAS.length, 11, 'Los once aromas del apartado 2');
eq(AROMAS_DESCARTABLES.map((a) => a.id), ['dulces', 'citricos', 'amaderados', 'intensos', 'especiados', 'otros'],
  'Y los seis descartables del apartado 3');
ok(AROMAS_DESCARTABLES.every((a) => AROMAS.some((x) => x.id === a.id)),
  '⚠️ Que salen de la MISMA lista: dos vocabularios de aroma serían dos verdades');
eq(INTENSIDADES.length, 4, 'Las cuatro intensidades');
eq(QUE_VALORA.length, 5, 'Las cinco cosas que puede valorar');
eq(OCASIONES.length, 10, 'Las diez ocasiones');
eq(TEMPORADAS.length, 3, 'Las tres temporadas');
eq(PRESUPUESTOS_PERFUME.length, 4, 'Y los cuatro presupuestos');

{
  let e = base();
  eq(progresoPerfumes(e).contestadas, 0, '⚠️ Nada viene marcado: no se asume (apartado 6)');
  e = contestarPerfume(e, 'aromasFavoritos', 'frescos', { hoy: HOY }).estado;
  eq(respuestaPerfume(e, 'aromasFavoritos').valores, ['frescos'], 'Prueba 2: se configuran los gustos');
  e = contestarPerfume(e, 'aromasQueNoGustan', 'dulces', { hoy: HOY }).estado;
  eq(respuestaPerfume(e, 'aromasQueNoGustan').valores, ['dulces'], 'Prueba 3: y los disgustos');

  const conNoSe = contestarPerfume(e, 'intensidadPerfume', NO_LO_SE, { hoy: HOY }).estado;
  eq(respuestaPerfume(conNoSe, 'intensidadPerfume').noSabe, true, '"No lo sé" es una respuesta');
  eq(respuestaPerfume(borrarPerfume(e, 'aromasFavoritos').estado, 'aromasFavoritos').contestada, false,
    'Y se puede borrar');

  const s = seccionesDePerfumes(e);
  ok(s.length > 0 && s.every((x) => x.total > 0), 'Las secciones, y ninguna vacía');
  eq(preguntasDePerfumes(e).length, PREGUNTAS_PERFUMES.length, 'Se enseñan todas: ninguna depende de otra');
}

/* ── 5 · ⚠️ LO QUE NO LE GUSTA (apartado 3) ─────────────────────────────── */
console.log('\n5 · ⚠️ Lo que prefiere evitar pesa tanto como lo que le gusta');

{
  const e = contestarPerfume(base(), 'aromasQueNoGustan', 'dulces', { hoy: HOY }).estado;
  const c = chocaConSusGustos(e, ['dulces', 'frescos']);
  eq(c.choca, true, '⚠️ Un aroma que dijo evitar CHOCA');
  eq(c.aromas, ['dulces'], 'Y se dice cuál');
  ok(/preferías evitar/.test(c.porque), '⚠️ Con sus palabras: "dijiste que preferías evitar", no "no te gusta"');
  eq(chocaConSusGustos(e, ['frescos']).choca, false, 'Y lo que no dijo, no choca');
  eq(chocaConSusGustos(base(), ['dulces']).choca, false, '⚠️ Sin contestar nada, no choca: no se asume');
  eq(chocaConSusGustos(e, []).choca, false, 'Ni con una lista vacía');
  eq(chocaConSusGustos(e, null).choca, false, 'Ni con basura');
}

/* ── 6 · LA COLECCIÓN (apartados 9, 10, 11 y 12) ────────────────────────── */
console.log('\n6 · La colección');

{
  const { estado, perfume: p } = conUno();
  eq(perfumes(estado).length, 1, 'Prueba 4: se añade un perfume');
  eq([p.nombre, p.marca], ['Uno', 'Marca'], 'Con su nombre y su marca');
  eq(p.tipo, ['frescos'], 'Y sus aromas');
  eq(p.ocasiones, ['noche'], 'Y sus ocasiones');
  eq(anadirPerfume(base(), {}).error, 'El perfume necesita un nombre.', 'Sin nombre no se añade');
  eq(anadirPerfume(estado, { nombre: 'uno', marca: 'marca' }).sinEfecto, true,
    'Y el mismo dos veces no se duplica, aunque cambien las mayúsculas');

  // Prueba 5: favorito.
  const fav = alternarFavoritoPerfume(estado, p.id);
  eq(perfume(fav.estado, p.id).favorito, true, 'Prueba 5: se marca favorito');
  eq(perfume(alternarFavoritoPerfume(fav.estado, p.id).estado, p.id).favorito, false, 'Y se desmarca');

  // Prueba 6: valorar.
  const val = valorarPerfume(estado, p.id, 5, 'Me gusta mucho para salir por la noche.');
  eq(perfume(val.estado, p.id).valoracion, 5, 'Prueba 6: se valora de 1 a 5');
  eq(perfume(val.estado, p.id).nota, 'Me gusta mucho para salir por la noche.', 'Con su nota, la del enunciado');
  eq(valorarPerfume(estado, p.id, 9).error, 'La valoración va de 1 a 5.', 'Un 9 no cuela');
  eq(normalizarPerfume({ nombre: 'X', valoracion: 0 }).valoracion, null,
    '⚠️ Ni un 0: `Number(null)` es 0 y `Number.isInteger(0)` es `true`');
  eq(perfume(valorarPerfume(val.estado, p.id, null).estado, p.id).valoracion, null, 'Y se puede quitar');

  // Prueba 8: temporada.
  eq(perfume(editarPerfume(estado, p.id, { temporada: 'calor' }).estado, p.id).temporada, 'calor',
    'Prueba 8: se asigna una temporada');
  eq(normalizarPerfume({ nombre: 'X', temporada: 'inventada' }).temporada, null, 'Una que no existe, no');
  eq(editarPerfume(estado, 'x', {}).error, 'Ese perfume no existe.', 'Sobre lo que no hay, avisa');
  eq(editarPerfume(estado, p.id, { nombre: ' ' }).error, 'El perfume necesita un nombre.', 'Ni dejarlo sin nombre');
}

/* ⚠️ Prueba 10 — "actual" NO es "favorito" (apartado 12). */
{
  const { estado, perfume: p } = conUno();
  const act = ponerPerfumeActual(estado, p.id);
  eq(perfumeActual(act.estado).nombre, 'Uno', 'Prueba 10: se configura el perfume actual');
  eq(perfume(act.estado, p.id).favorito, false,
    '⚠️ Y marcarlo como ACTUAL no lo hace favorito: "esto no significa que sea su favorito"');
  const fav = alternarFavoritoPerfume(estado, p.id);
  eq(perfumeActual(fav.estado), null, '⚠️ Y al revés tampoco: ser favorito no lo hace el actual');
  eq(perfumeActual(ponerPerfumeActual(act.estado, null).estado), null, 'Y se puede quitar');
  eq(ponerPerfumeActual(estado, 'x').error, 'Ese perfume no existe.', 'Sobre lo que no hay, avisa');
  eq(perfumeActual(base()), null, 'Sin ninguno, `null`: no se elige uno por él');
}

/* Prueba 7: perfume para cada ocasión (apartado 13). */
{
  const { estado, perfume: p } = conUno();
  const asig = asignarPerfumeAOcasion(estado, 'cita', p.id);
  eq(perfumesPorOcasion(asig.estado).map((x) => x.ocasion.id), ['cita'], 'Prueba 7: se asigna a una ocasión');
  eq(perfumesPorOcasion(asig.estado)[0].perfume.nombre, 'Uno', 'Con su perfume');
  eq(perfumesPorOcasion(asignarPerfumeAOcasion(asig.estado, 'cita', null).estado), [], 'Y se puede quitar');
  eq(asignarPerfumeAOcasion(estado, 'inventada', p.id).error, 'Esa ocasión no existe.', 'Una ocasión que no existe, no');
  eq(asignarPerfumeAOcasion(estado, 'cita', 'x').error, 'Ese perfume no existe.', 'Ni un perfume que no está');
  eq(perfumesPorOcasion(base()), [], '⚠️ Y no viene ninguna asignada: es "completamente opcional"');
}

/* ── 7 · QUIERO PROBAR (apartado 14) ────────────────────────────────────── */
console.log('\n7 · 🎯 Quiero probar');

{
  const e = base();
  const r = anadirPorProbar(e, { nombre: 'Uno que me gustó', marca: 'M' }, { hoy: HOY });
  eq(datosPerfumes(r.estado).porProbar.length, 1, 'Prueba 9: se guarda uno que le interesa');
  eq(anadirPorProbar(e, {}).error, 'Dinos al menos su nombre.', 'Sin nombre no se guarda');
  eq(datosPerfumes(quitarPorProbar(r.estado, datosPerfumes(r.estado).porProbar[0].id).estado).porProbar.length, 0,
    'Y se puede quitar');
  eq(quitarPorProbar(e, 'x').error, 'Ese no está en la lista.', 'Sobre lo que no hay, avisa');

  /* ⚠️ Y si lo prueba, pasa a la colección **y sale de la lista**, de una vez. */
  const mov = moverAColeccion(r.estado, datosPerfumes(r.estado).porProbar[0].id, { hoy: HOY });
  eq(perfumes(mov.estado).map((p) => p.nombre), ['Uno que me gustó'], '⚠️ Y probarlo lo pasa a la colección');
  eq(datosPerfumes(mov.estado).porProbar.length, 0, 'Sacándolo de la lista, en una sola acción');
  eq(moverAColeccion(e, 'x').error, 'Ese no está en la lista.', 'Sobre lo que no hay, avisa');
}

/* ── 8 · EL HISTORIAL (apartado 15) ─────────────────────────────────────── */
console.log('\n8 · El historial — sin obligación de apuntarlo');

{
  let { estado, perfume: p } = conUno();
  const r = registrarUso(estado, { perfumeId: p.id, ocasion: 'noche', valoracion: 4 }, { hoy: HOY });
  eq(r.error, null, 'Prueba 11: se registra un uso');
  const h = historialPerfumes(r.estado);
  eq(h.length, 1, 'Y sale en el historial');
  eq(h[0].perfume.nombre, 'Uno', 'Con su perfume');
  eq(h[0].ocasionNombre, 'Noche', 'Y su ocasión');
  eq(registrarUso(estado, {}, { hoy: HOY }).error, 'Dinos cuál usaste.', 'Sin perfume no se registra');
  eq(registrarUso(estado, { perfumeId: 'x' }, { hoy: HOY }).error, 'Ese perfume no existe.', 'Ni con uno que no está');
  /* ⚠️ *"Sin necesidad de hacerlo cada vez"*: ni racha, ni recordatorio, ni hueco. */
  ok(!/racha|recordatorio|pendiente/i.test(codigo), '⚠️ Ni rachas, ni recordatorios, ni huecos que rellenar');

  // Y si borra el perfume, el uso se queda diciendo que ya no está.
  const del = eliminarPerfume(r.estado, p.id);
  eq(historialPerfumes(del.estado)[0].perfume, null, '⚠️ Si borra el perfume, el uso lo dice: no se inventa un nombre');
  eq(datosPerfumes(del.estado).historial.length, 1, 'Pero el uso se queda: lo que pasó, pasó');
}

/* ── 9 · ⚠️ LA PAPELERA GLOBAL ──────────────────────────────────────────── */
console.log('\n9 · ⚠️ Ni una papelera propia');

['perfumes.perfumes', 'perfumes.historial'].forEach((k) =>
  ok(!!CATALOGO_PAPELERA[k], `"${k}" está en la papelera GLOBAL`));
ok(!/DEFAULT_PAPELERA\s*=|function\s+prepararEliminacion/.test(codigo), 'Y aquí no se construye ninguna');

{
  let { estado, perfume: p } = conUno();
  estado = ponerPerfumeActual(estado, p.id).estado;
  estado = asignarPerfumeAOcasion(estado, 'cita', p.id).estado;

  const del = eliminarPerfume(estado, p.id);
  eq(perfumes(del.estado).length, 0, 'Se elimina un perfume');
  ok(del.entrada && del.entrada.coleccion === 'perfumes', 'Con la forma de la papelera global');
  /* ⚠️ Y lo que apuntaba a él se limpia solo, por el normalizador. */
  eq(perfumeActual(del.estado), null, '⚠️ Y deja de ser "el actual", sin dejar un id colgando');
  eq(perfumesPorOcasion(del.estado), [], 'Y su ocasión se queda sin él, en vez de apuntar a nada');

  const vuelta = restaurarPerfume(del.estado, del.entrada);
  eq(perfumes(vuelta.estado).length, 1, 'Prueba 12: y se puede recuperar');
  eq(restaurarPerfume(vuelta.estado, del.entrada).yaExistia, true, 'Restaurarlo dos veces no lo duplica');
  eq(eliminarPerfume(base(), 'x').error, 'Ese perfume no existe.', 'Sobre lo que no hay, avisa');

  const uso = registrarUso(estado, { perfumeId: p.id }, { hoy: HOY });
  const delUso = eliminarUso(uso.estado, datosPerfumes(uso.estado).historial[0].id);
  eq(datosPerfumes(delUso.estado).historial.length, 0, 'Un uso se elimina');
  eq(datosPerfumes(restaurarUso(delUso.estado, delUso.entrada).estado).historial.length, 1, 'Y vuelve');
}

/* ── 10 · EL NORMALIZADOR (regla 5) ─────────────────────────────────────── */
console.log('\n10 · ⚠️ El normalizador conoce sus siete campos');

['ahoraNo', 'configurado', 'partes', 'perfumes', 'porProbar', 'actual', 'porOcasion', 'historial', 'editado']
  .forEach((c) => ok(c in DEFAULT_PERFUMES, `\`${c}\` está declarado en el DEFAULT`));

{
  let { estado, perfume: p } = conUno();
  estado = valorarPerfume(estado, p.id, 5, 'Nota').estado;
  estado = alternarFavoritoPerfume(estado, p.id).estado;
  estado = ponerPerfumeActual(estado, p.id).estado;
  estado = asignarPerfumeAOcasion(estado, 'cita', p.id).estado;
  estado = anadirPorProbar(estado, { nombre: 'Otro' }, { hoy: HOY }).estado;
  estado = registrarUso(estado, { perfumeId: p.id, ocasion: 'noche' }, { hoy: HOY }).estado;

  const ida = normalizarPerfumes(datosPerfumes(estado));
  const vuelta = normalizarPerfumes(JSON.parse(JSON.stringify(ida)));
  eq(vuelta.perfumes[0].valoracion, 5, '⚠️ La valoración sobrevive a dos normalizaciones');
  eq(vuelta.perfumes[0].nota, 'Nota', 'Y la nota');
  eq(vuelta.perfumes[0].favorito, true, 'Y el favorito');
  eq(vuelta.actual, p.id, 'Y el actual');
  eq(Object.keys(vuelta.porOcasion), ['cita'], 'Y la ocasión');
  eq(vuelta.porProbar.length, 1, 'Y la lista de "quiero probar"');
  eq(vuelta.historial.length, 1, 'Y el historial');

  /* ⚠️ Y un `actual` o una ocasión que apuntan a un perfume que ya no está
     **no se guardan**: mentirían. */
  eq(normalizarPerfumes({ perfumes: [], actual: 'fantasma' }).actual, null,
    '⚠️ Un "actual" que apunta a un perfume borrado se limpia');
  eq(normalizarPerfumes({ perfumes: [], porOcasion: { cita: 'fantasma' } }).porOcasion, {},
    'Y una ocasión que apunta a la nada, también');
  eq(normalizarPerfumes({ porOcasion: { inventada: 'x' } }).porOcasion, {}, 'Ni una ocasión que no existe');
  eq(normalizarPerfumes(null).perfumes, [], 'Sin nada guardado, vacío');
  eq(normalizarUsoPerfume({}), null, 'Un uso sin fecha no existe');
}

/* ── 11 · EL PANEL Y LA REGLA 8 ─────────────────────────────────────────── */
console.log('\n11 · El panel, y regla 8');

/* ⚠️ El apartado 16 de la F24 pedía *"preparar una plaquita"* de recomendaciones
   para la Fase 25 — y la Fase 25 ya la llenó, así que ahora funciona. Lo que se
   comprueba es que **exista y esté marcada con su fase**, no que siga a medias. */
ok(PLAQUITAS_PERFUMES.some((p) => p.id === 'recomendaciones' && p.fase === 25),
  'La plaquita de recomendaciones existe, y consta que es de la Fase 25');
ok(PLAQUITAS_PERFUMES.every((p) => p.listo || p.fase > 25),
  '⚠️ Y si alguna no funcionara todavía, diría en qué fase llega (regla 8)');

{
  const { estado } = conUno();
  const p = panelPerfumes(estado);
  eq(p.estado, 'configurado', 'El panel sabe en qué estado está');
  eq(p.perfumes.length, 1, 'Trae la colección');
  eq(p.ocasiones.length, 10, 'Y las ocasiones');
  ok(p.plaquitas.some((x) => x.id === 'recomendaciones'), 'Con su plaquita de recomendaciones');
  ok(!panelPerfumes(alternarPartePerfumes(estado, 'recomendaciones')).plaquitas.some((x) => x.id === 'recomendaciones'),
    '⚠️ Y apagarlas la hace desaparecer (apartado 18)');

  const r = resumenPerfumes(estado);
  eq([r.coleccion, r.favoritos, r.porProbar], [1, 0, 0], 'Y el resumen cuadra');
  eq(r.actual, null, '⚠️ Sin actual, `null`: no se elige uno por él');

  const ctx = contextoPerfumes(estado);
  eq(ctx.coleccion, 1, 'El contexto sabe cuántos tiene');
  eq(ctx.actual, null, 'Y que no hay actual');
  eq(ctx.sinPerfume, false, 'Y lee `sinPerfume` de la Fase 17, sin repreguntarlo');
}

ok(!/proximamente|en construcción/i.test(fuente), 'Ni un "próximamente"');
ok(!/Math\.random/.test(codigo), 'Ni una cifra inventada');
ok(textosDePerfumes().length > 30, `Y ${textosDePerfumes().length} textos, todos declarados para poder barrerlos`);

if (fallos > 0) { console.log(`\n  ${fallos} de ${n} comprobaciones han fallado.`); process.exit(1); }
console.log(`\n  ${n} comprobaciones correctas.`);
