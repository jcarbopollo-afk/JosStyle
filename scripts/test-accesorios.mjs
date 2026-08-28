// ============================================================================
// EH · Fase 26/65 — Accesorios y estilo personal
//
// Las quince pruebas del apartado 15, y lo que gobierna la fase:
//   · un accesorio es una PRENDA del armario, y aquí solo vive su envoltorio
//   · el duplicado se comprueba ANTES de crear nada (apartado 3)
//   · las combinaciones son una preferencia, NO un outfit (apartado 9)
//   · ni otra lista de estilos, ni otra de ocasiones, ni otros favoritos
// ============================================================================

import { readFileSync } from 'node:fs';
import { DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre, moduloEH } from '../src/lib/estiloDeHombre.js';
import { REGISTRO_DATOS } from '../src/lib/datosEstiloHombre.js';
import { CATALOGO_PAPELERA, describirEntrada } from '../src/lib/papelera.js';
import { ESTILOS_VESTIR } from '../src/lib/perfilEstilo.js';
import { OCASIONES as OCASIONES_F24 } from '../src/lib/perfumes.js';
import { CATEGORIAS_ARMARIO, crearPrenda } from '../src/lib/armario.js';
import { crearProductoPiel, productosPiel } from '../src/lib/productosPiel.js';
import { PALABRAS_PROHIBIDAS, tonoCorrecto } from '../src/lib/motorRecomendaciones.js';
import {
  MODULO_ACCESORIOS, CATEGORIA_ARMARIO_ACCESORIOS, TEXTOS_ACCESORIOS,
  CATEGORIAS_ACCESORIO, categoriaAccesorio, PARTES_ACCESORIOS, CASILLAS_ACCESORIOS,
  parteAccesorios, PLAQUITAS_ACCESORIOS, ESTILOS_ACCESORIO, estiloAccesorio,
  IDS_OCASION_ACCESORIO, OCASIONES_ACCESORIO, MAX_NOTA_ACCESORIO, CAMPOS_DE_LA_PRENDA,
  DEFAULT_ACCESORIOS, catalogoParaAccesorios, normalizarAccesorio, normalizarDeseo,
  normalizarAccesorios, datosAccesorios, decirAhoraNoAccesorios, configurarAccesorios,
  parteActivaAccesorios, categoriaActivaAccesorios, alternarParteAccesorios,
  elegirCategoriasAccesorios, estadoDeEntradaAccesorios, categoriasActivasAccesorios,
  prendasAccesorioDelArmario, buscarEnArmario, prendasYaUsadas, prepararAltaAccesorio,
  aplicarAltaAccesorio, usarPrendaComoAccesorio, accesorios, accesorio,
  accesoriosHuerfanos, accesoriosPorCategoria, editarAccesorio, editarPrendaDeAccesorio,
  alternarFavoritoAccesorio, alternarEnUsoAccesorio, accesoriosEnUso,
  combinacionesDeAccesorio, SUGERENCIAS_ACCESORIOS, contextoSugerenciasAccesorios,
  sugerenciasAccesorios, dondeComprarAccesorio, deseosAccesorios, anadirDeseoAccesorio,
  editarDeseoAccesorio, TEXTO_AL_BORRAR, eliminarAccesorio, restaurarAccesorio,
  eliminarDeseoAccesorio, restaurarDeseoAccesorio, resumenAccesorios, auditarAccesorios,
  textosDeAccesorios, panelAccesorios,
} from '../src/lib/accesorios.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-08-28';
const ARMARIO = () => ({ prendas: [], outfits: [], usos: [] });
const base = () => configurarAccesorios(
  configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['accesorios', 'skincare', 'estilo']),
  { hoy: HOY },
).estado;

/** Alta completa: devuelve los dos almacenes, como en la aplicación. */
const conUno = (datos = {}, e = base(), armario = ARMARIO()) => {
  const p = prepararAltaAccesorio(e, armario, { nombre: 'Casio negro', tipo: 'relojes', ...datos }, { hoy: HOY });
  if (!p.plan) return { estado: e, armario, accesorio: null, error: p.error, duplicado: p.duplicado };
  const r = aplicarAltaAccesorio(e, armario, p.plan);
  return { estado: r.estado, armario: r.armario, accesorio: r.accesorio, error: r.error };
};

console.log('\n🕶️  EH · Fase 26/65 — Accesorios y estilo personal\n');

/* ===========================================================================
   Test 1 — ACTIVAR ACCESORIOS (apartados 1 y 15.1)
   =========================================================================== */
console.log('Test 1 — activar accesorios');
{
  ok(!!moduloEH('accesorios'), 'el módulo está en el catálogo de la Fase 1');
  eq(moduloEH('accesorios').categoria, 'estilo', 'y en la categoría de estilo');
  eq(moduloEH('accesorios').icono, '🕶️', 'con el icono del enunciado');
  ok(moduloEH('accesorios').terminos.includes('reloj'), '"reloj" lo encuentra en el buscador');
  ok(moduloEH('accesorios').terminos.includes('gafas'), 'y "gafas" también');
  eq(TEXTOS_ACCESORIOS.pregunta, '¿Quieres utilizar este apartado?', 'la pregunta es la del enunciado');
  eq(TEXTOS_ACCESORIOS.configurar, 'Sí, configurarlo', 'y el primer botón');
  eq(TEXTOS_ACCESORIOS.ahoraNo, 'Ahora no', 'y el segundo');

  const vacio = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['accesorios']);
  eq(estadoDeEntradaAccesorios(vacio), 'sin_configurar', 'sin tocar nada, sin configurar');
  const no = decirAhoraNoAccesorios(vacio).estado;
  eq(estadoDeEntradaAccesorios(no), 'ahora_no', '"Ahora no" se recuerda');
  eq(datosAccesorios(no).accesorios, [], 'y no borra nada: no había nada');
  const si = configurarAccesorios(no, { hoy: HOY }).estado;
  eq(estadoDeEntradaAccesorios(si), 'configurado', 'y se puede volver cuando quiera');
  eq(datosAccesorios(si).editado, HOY, 'con la fecha en la que lo configuró');
}

/* ===========================================================================
   Test 2 — SELECCIONAR CATEGORÍAS (apartado 2)
   =========================================================================== */
console.log('\nTest 2 — qué quiere gestionar');
{
  eq(CATEGORIAS_ACCESORIO.length, 7, 'las siete del enunciado');
  eq(CATEGORIAS_ACCESORIO.map((c) => c.id),
    ['relojes', 'gafas', 'pulseras', 'collares', 'anillos', 'gorras', 'otros'],
    'en su orden y con sus nombres');
  ok(CATEGORIAS_ACCESORIO.every((c) => c.icono && c.singular), 'cada una con icono y singular');

  const e = base();
  ok(CASILLAS_ACCESORIOS.every((c) => categoriaActivaAccesorios(e, c.id)),
    '⚠️ ☑️ en el enunciado es encendida por defecto (en la F20, ☐ era apagada)');
  eq(CASILLAS_ACCESORIOS.length, 7, 'las casillas del apartado 2 son siete');
  eq(PARTES_ACCESORIOS.length, 9, 'y hay dos interruptores más: recomendaciones y deseos');

  const soloDos = elegirCategoriasAccesorios(e, ['relojes', 'gafas']);
  ok(categoriaActivaAccesorios(soloDos, 'relojes'), 'elegir dos deja las dos');
  ok(categoriaActivaAccesorios(soloDos, 'gafas'), 'y la segunda');
  ok(!categoriaActivaAccesorios(soloDos, 'anillos'), 'y apaga las que no eligió');
  ok(parteActivaAccesorios(soloDos, 'recomendaciones'),
    '⚠️ pero NO toca las recomendaciones: son un interruptor aparte (lección de la F20)');
  ok(parteActivaAccesorios(soloDos, 'deseos'), 'ni los deseos');
  ok(!categoriaActivaAccesorios(e, 'inventada'), 'una categoría que no existe nunca está activa');
}

/* ===========================================================================
   Test 3 — AÑADIR ACCESORIO (apartados 3 y 4)
   =========================================================================== */
console.log('\nTest 3 — añadir accesorio');
{
  const r = conUno();
  eq(r.error, null, 'se añade sin error');
  eq(r.armario.prendas.length, 1, '⚠️ y la prenda va AL ARMARIO, que es donde vive');
  eq(r.armario.prendas[0].categoria, CATEGORIA_ARMARIO_ACCESORIOS,
    'en la categoría "accesorios" que ya existía desde AR F1');
  ok(CATEGORIAS_ARMARIO.some((c) => c.id === CATEGORIA_ARMARIO_ACCESORIOS),
    'y esa categoría es del armario, no inventada aquí');
  eq(r.armario.prendas[0].subcategoria, 'relojes',
    '⚠️ el tipo de accesorio ES la subcategoría de la prenda: no se guarda dos veces');
  eq(datosAccesorios(r.estado).accesorios.length, 1, 'y el envoltorio en Estilo de hombre');
  eq(datosAccesorios(r.estado).accesorios[0].prendaId, r.armario.prendas[0].id,
    'apuntando a la prenda por su id');

  const visto = accesorios(r.estado, r.armario);
  eq(visto.length, 1, 'y al leerlo salen unidos');
  eq(visto[0].nombre, 'Casio negro', 'con el nombre DERIVADO de la prenda');
  eq(visto[0].tipo, 'relojes', 'y su tipo');
  eq(visto[0].categoria.nombre, 'Relojes', 'con la categoría resuelta');
  eq(visto[0].favorito, false, 'sin favorito, que él no lo ha marcado');

  const sinNombre = prepararAltaAccesorio(base(), ARMARIO(), { nombre: '   ', tipo: 'relojes' });
  eq(sinNombre.plan, null, 'sin nombre no hay plan');
  ok(!!sinNombre.error, 'y se dice por qué');
  const apagada = prepararAltaAccesorio(
    elegirCategoriasAccesorios(base(), ['gafas']), ARMARIO(), { nombre: 'Reloj', tipo: 'relojes' },
  );
  eq(apagada.plan, null, 'una categoría que no gestiona no admite accesorios');
  ok(apagada.error.includes('Relojes'), 'y el aviso dice cuál');

  // Apartado 4 — *"las fotos no son obligatorias"*.
  eq(r.armario.prendas[0].fotoPath, '', 'la foto es opcional y se queda vacía');
  const conFoto = conUno({ fotoPath: 'accesorios/1.jpg' });
  eq(conFoto.armario.prendas[0].fotoPath, 'accesorios/1.jpg', 'y si la pone, se guarda');
}

/* ===========================================================================
   Test 4 — ⚠️ NI UN CAMPO DE LA PRENDA EN EL ENVOLTORIO
   ===========================================================================
   Es la prueba de la fase: *"NO crear otro armario"* medido, no prometido. */
console.log('\nTest 4 — ⚠️ el envoltorio no duplica NADA de la prenda');
{
  const guardado = normalizarAccesorio({
    prendaId: 'p1',
    // Todo esto es de la prenda y NO debe sobrevivir al normalizador.
    nombre: 'Casio', marca: 'Casio', color: 'negro', fotoPath: 'x.jpg', notas: 'algo',
    precio: 30, talla: 'M', favorita: true, categoria: 'accesorios', estado: 'disponible',
    // Esto sí es del envoltorio.
    estilos: ['casual'], ocasiones: ['estudios'], combinaCon: ['urbano'], nota: 'mía',
  });
  CAMPOS_DE_LA_PRENDA.forEach((c) => {
    ok(!(c in guardado), `⚠️ "${c}" es de la prenda y NO se guarda aquí`);
  });
  eq(Object.keys(guardado).sort(),
    ['combinaCon', 'creadoEn', 'estilos', 'id', 'nota', 'ocasiones', 'prendaId', 'productoId'],
    'el envoltorio tiene exactamente ocho campos, y ninguno es del armario');
  eq(guardado.estilos, ['casual'], 'lo suyo sí se guarda');
  eq(guardado.nota, 'mía', 'incluida su nota de estilo');

  const r = conUno();
  eq(auditarAccesorios(r.estado, r.armario).camposDeLaPrendaDuplicados, 0,
    'y la auditoría lo mide sobre lo guardado de verdad');
  eq(auditarAccesorios(r.estado, r.armario).armariosNuevos, 0, '❌ otro armario: cero');
  eq(auditarAccesorios(r.estado, r.armario).prendasGuardadasAqui, 0, 'ni una prenda guardada aquí');
  eq(auditarAccesorios(r.estado, r.armario).prendasEnArmario, 1, 'la prenda está en el armario');
}

/* ===========================================================================
   Test 5 — EDITARLO (apartado 15.4)
   =========================================================================== */
console.log('\nTest 5 — editarlo');
{
  const r = conUno();
  const id = r.accesorio.id;
  const e2 = editarAccesorio(r.estado, id, { estilos: ['casual', 'urbano'], nota: 'el de diario' }).estado;
  eq(accesorio(e2, r.armario, id).estilos, ['casual', 'urbano'], 'lo del envoltorio se edita aquí');
  eq(accesorio(e2, r.armario, id).nota, 'el de diario', 'y su nota');
  eq(accesorio(e2, r.armario, id).prendaId, r.accesorio.prendaId, 'sin cambiar de prenda');

  // Lo de la prenda se edita EN la prenda, y devuelve un armario.
  const cambio = editarPrendaDeAccesorio(e2, r.armario, id, { nombre: 'Casio plateado', marca: 'Casio' });
  eq(cambio.error, null, 'lo de la prenda se edita en la prenda');
  eq(cambio.armario.prendas[0].nombre, 'Casio plateado', 'y el cambio va al armario');
  eq(accesorio(e2, cambio.armario, id).nombre, 'Casio plateado', 'y se ve desde aquí, derivado');
  eq(datosAccesorios(e2).accesorios[0].nombre, undefined,
    '⚠️ sin que el nombre entre en lo guardado de Estilo de hombre');

  const vacio = editarPrendaDeAccesorio(e2, r.armario, id, { nombre: '  ' });
  ok(!!vacio.error, 'un nombre vacío no se acepta');
  eq(vacio.armario, r.armario, 'y no toca el armario');
  ok(!!editarAccesorio(r.estado, 'noexiste', {}).error, 'editar lo que no existe se dice');
}

/* ===========================================================================
   Test 6 — AÑADIR PREFERENCIAS: ESTILO Y OCASIONES (apartados 5 y 6)
   =========================================================================== */
console.log('\nTest 6 — estilos y ocasiones, sin listas nuevas');
{
  ok(ESTILOS_ACCESORIO === ESTILOS_VESTIR,
    '⚠️ los estilos son LOS DE LA FASE 6, no una lista nueva');
  ['deportivo', 'casual', 'elegante', 'minimalista', 'urbano', 'formal', 'otro'].forEach((id) => {
    ok(!!estiloAccesorio(id), `"${id}" del apartado 5 ya existía en ESTILOS_VESTIR`);
  });
  eq(OCASIONES_ACCESORIO.length, 7, 'las siete ocasiones del apartado 6');
  ok(IDS_OCASION_ACCESORIO.every((id) => OCASIONES_F24.some((o) => o.id === id)),
    '⚠️ y todas salen de la lista de la Fase 24: si alguien renombra un id, esto falla');
  eq(OCASIONES_ACCESORIO.length, IDS_OCASION_ACCESORIO.length,
    'ninguna se queda por el camino');
  ok(OCASIONES_ACCESORIO.every((o) => o.icono), 'con sus iconos, que ya estaban');
  eq(auditarAccesorios(base(), ARMARIO()).listasDeEstilos, 0, 'la auditoría: cero listas de estilos');
  eq(auditarAccesorios(base(), ARMARIO()).listasDeOcasiones, 0, 'y cero de ocasiones');

  const r = conUno({ estilos: ['casual'], ocasiones: ['estudios', 'fiesta'] });
  eq(accesorios(r.estado, r.armario)[0].ocasiones, ['estudios', 'fiesta'], 'se guardan las suyas');
  const mala = normalizarAccesorio({ prendaId: 'p', ocasiones: ['estudios', 'verano'] });
  eq(mala.ocasiones, ['estudios'],
    '⚠️ "verano" existe en la F24 pero NO es del apartado 6: no se cuela');
  eq(normalizarAccesorio({ prendaId: 'p', estilos: ['inventado'] }).estilos, [],
    'un estilo que no existe tampoco');
  eq(normalizarAccesorio({ nombre: 'sin prenda' }), null,
    'y un envoltorio sin prenda no es nada');
}

/* ===========================================================================
   Test 7 — MARCAR FAVORITO (apartado 7)
   =========================================================================== */
console.log('\nTest 7 — el favorito es el global');
{
  const r = conUno();
  const id = r.accesorio.id;
  const fav = alternarFavoritoAccesorio(r.estado, r.armario, id);
  eq(fav.error, null, 'se marca sin error');
  eq(fav.armario.prendas[0].favorita, true,
    '⚠️ y el favorito se escribe EN LA PRENDA: *"utilizar favoritos globales"*');
  ok(!('estado' in fav), '⚠️ no devuelve un estado de Estilo de hombre: no hay favorito aquí');
  eq(accesorio(r.estado, fav.armario, id).favorito, true, 'y se lee derivado de ella');
  ok(!('favorito' in datosAccesorios(r.estado).accesorios[0]),
    'lo guardado en el módulo no tiene el campo');
  eq(auditarAccesorios(r.estado, r.armario).favoritosNuevos, 0, '❌ otro sistema de favoritos: cero');

  const quitado = alternarFavoritoAccesorio(r.estado, fav.armario, id);
  eq(quitado.armario.prendas[0].favorita, false, 'y se quita igual');
  ok(!!alternarFavoritoAccesorio(r.estado, r.armario, 'noexiste').error, 'lo que no existe se dice');
}

/* ===========================================================================
   Test 8 — ACCESORIO ACTUAL (apartado 8)
   =========================================================================== */
console.log('\nTest 8 — "estoy usando" es una lista');
{
  let { estado: e, armario: a } = conUno();
  const uno = datosAccesorios(e).accesorios[0].id;
  const dos = usarPrendaComoAccesorio(
    e,
    { ...a, prendas: [...a.prendas, crearPrenda({ nombre: 'Gafas de sol', categoria: 'accesorios', subcategoria: 'gafas' })] },
    'x', {},
  );
  ok(!!dos.error, 'usar una prenda que no está se dice');

  const conGafas = crearPrenda({ nombre: 'Gafas de sol', categoria: 'accesorios', subcategoria: 'gafas' });
  a = { ...a, prendas: [...a.prendas, conGafas] };
  const r2 = usarPrendaComoAccesorio(e, a, conGafas.id, {}, { hoy: HOY });
  e = r2.estado;
  eq(accesorios(e, a).length, 2, 'la segunda se añade SIN crear otra prenda');
  eq(a.prendas.length, 2, 'el armario sigue con las dos que ya tenía');

  e = alternarEnUsoAccesorio(e, uno).estado;
  e = alternarEnUsoAccesorio(e, r2.accesorio.id).estado;
  eq(accesoriosEnUso(e, a).length, 2,
    '⚠️ se pueden llevar DOS a la vez: `enUso` es una lista, no un campo (al revés que el perfume de la F24)');
  e = alternarEnUsoAccesorio(e, uno).estado;
  eq(accesoriosEnUso(e, a).map((x) => x.id), [r2.accesorio.id], 'y se quita uno sin tocar el otro');
  ok(!!alternarEnUsoAccesorio(e, 'noexiste').error, 'lo que no existe se dice');

  const repetida = usarPrendaComoAccesorio(e, a, conGafas.id, {});
  ok(repetida.sinEfecto, 'la misma prenda dos veces no crea dos envoltorios');
}

/* ===========================================================================
   Test 9 — COMPROBAR DUPLICADOS CON ARMARIO (apartado 3 · 15.9)
   =========================================================================== */
console.log('\nTest 9 — ⚠️ el duplicado se comprueba ANTES');
{
  const r = conUno();
  const dup = prepararAltaAccesorio(r.estado, r.armario, { nombre: 'casio NEGRO', tipo: 'relojes' });
  eq(dup.plan, null, '⚠️ con el nombre repetido NO hay plan: no se crea la copia');
  eq(dup.duplicado.nombre, 'Casio negro', 'devuelve la prenda que encontró');
  ok(dup.texto.includes('Armario'), 'y una frase que dice dónde está');
  eq(dup.error, null, 'no es un error: es una pregunta');

  const forzada = prepararAltaAccesorio(r.estado, r.armario, { nombre: 'Casio negro', tipo: 'relojes' }, { forzarNueva: true });
  ok(!!forzada.plan, '⚠️ crear otra igual exige decirlo, y no hay valor por defecto');

  // Y busca en TODO el armario, no solo en su categoría.
  const conCamiseta = { ...ARMARIO(), prendas: [crearPrenda({ nombre: 'Gorra roja', categoria: 'otros' })] };
  eq(buscarEnArmario(conCamiseta, 'gorra roja').nombre, 'Gorra roja',
    '⚠️ una gorra apuntada como "Otros" también cuenta: sigue siendo la misma gorra');
  eq(buscarEnArmario(conCamiseta, '  '), null, 'sin nombre no se busca nada');
  eq(buscarEnArmario(null, 'x'), null, 'y un armario que no está no revienta');
  eq(prendasAccesorioDelArmario(conCamiseta).length, 0, 'esa no está en la categoría de accesorios');
  eq(prendasAccesorioDelArmario(r.armario).length, 1, 'la del reloj sí');
  eq(prendasYaUsadas(r.estado), [r.armario.prendas[0].id], 'y se sabe cuáles ya tienen envoltorio');
  eq(panelAccesorios(r.estado, r.armario).delArmarioSinUsar, [],
    'el panel no ofrece dos veces la misma prenda');
}

/* ===========================================================================
   Test 10 — COMBINACIONES (apartado 9)
   =========================================================================== */
console.log('\nTest 10 — la combinación es una preferencia, no un outfit');
{
  const r = conUno({ combinaCon: ['casual'] });
  const c = combinacionesDeAccesorio(r.estado, r.armario, r.accesorio.id);
  ok(c.hay, 'con estilo dicho, hay combinación');
  ok(c.texto.includes('casual'), 'y la frase lo nombra');
  ok(!('outfit' in c) && !('prendas' in c),
    '⚠️ no devuelve prendas ni outfits: eso es del Armario');
  eq(auditarAccesorios(r.estado, r.armario).outfitsNuevos, 0, '❌ otro sistema de outfits: cero');

  const sin = conUno({ combinaCon: [] });
  const c2 = combinacionesDeAccesorio(sin.estado, sin.armario, sin.accesorio.id);
  ok(!c2.hay, 'sin decir con qué lo usa, no hay combinación');
  eq(c2.texto, 'Todavía no has dicho con qué estilo lo usas.',
    '⚠️ y se dice, en vez de inventar una o dejar el hueco');
  eq(combinacionesDeAccesorio(r.estado, r.armario, 'noexiste').hay, false, 'lo que no existe da vacío');

  const fuente = readFileSync(new URL('../src/lib/accesorios.js', import.meta.url), 'utf8');
  ok(!fuente.includes('crearOutfit('), '⚠️ el código no crea ni un outfit');
  ok(!fuente.includes('crearUso('), 'ni un uso de armario');
  ok(!/\bpedirIA|askAI|anthropic/i.test(fuente), 'y no llama a la IA (apartado 10)');
}

/* ===========================================================================
   Test 11 — RECOMENDACIONES (apartado 10)
   =========================================================================== */
console.log('\nTest 11 — recomendaciones sin IA');
{
  ok(SUGERENCIAS_ACCESORIOS.every((s) => Array.isArray(s.requiere) && s.requiere.length > 0),
    '⚠️ toda regla declara `requiere`: una sin requisitos se dispararía con el contexto vacío');
  ok(SUGERENCIAS_ACCESORIOS.every((s) => typeof s.cuando === 'function'), 'y su condición');
  ok(SUGERENCIAS_ACCESORIOS.every((s) => s.texto && s.accion), 'con texto y acción');
  eq(sugerenciasAccesorios(base(), ARMARIO()), [],
    'sin accesorios no se dispara ninguna: no hay nada que recomendar');

  const r = conUno();
  const s = sugerenciasAccesorios(r.estado, r.armario);
  ok(s.some((x) => x.id === 'sin_estilo'), 'con uno sin estilo, se le propone añadirlo');
  ok(s.every((x) => x.aplicada === false),
    '⚠️ escrito en el propio dato: una sugerencia no hace nada por su cuenta');
  const conTodo = conUno({ estilos: ['casual'], ocasiones: ['estudios'] });
  ok(!sugerenciasAccesorios(conTodo.estado, conTodo.armario).some((x) => x.id === 'sin_estilo'),
    'y con el estilo puesto deja de salir');

  const apagadas = alternarParteAccesorios(r.estado, 'recomendaciones');
  eq(sugerenciasAccesorios(apagadas, r.armario), [],
    'con la parte apagada no sale ninguna (apartados 10 y 14)');
  eq(contextoSugerenciasAccesorios(r.estado, r.armario).conAccesorios, 1, 'el contexto cuenta lo que hay');
  eq(contextoSugerenciasAccesorios(r.estado, r.armario).enUso, 0, 'y lo que lleva puesto');
  eq(auditarAccesorios(r.estado, r.armario).usaIA, 0, 'la auditoría: sin IA');
  eq(auditarAccesorios(r.estado, r.armario).motorRecomendaciones, 'motorRecomendaciones.js',
    'y con el motor de la Fase 16, no un cuarto `if`');
}

/* ===========================================================================
   Test 12 — PRODUCTOS Y DESEOS (apartados 12 y 13)
   =========================================================================== */
console.log('\nTest 12 — el catálogo global y la lista de deseados');
{
  const r = conUno();
  eq(catalogoParaAccesorios(r.estado), [], '⚠️ el catálogo está VACÍO a propósito (D2-03)');
  const sinEnlace = dondeComprarAccesorio(r.estado, r.armario, r.accesorio.id);
  eq(sinEnlace.hay, false, 'sin producto enlazado no hay dónde comprarlo');
  ok(sinEnlace.texto.includes('No lo has enlazado'), '⚠️ y se dice, en vez de fabricar un enlace');
  eq(sinEnlace.enlaces, [], 'ni un enlace inventado');

  // Con una ficha del catálogo global de la Fase 17.
  const conProd = crearProductoPiel(r.estado, {
    nombre: 'Limpiador', categoria: 'limpiador',
    tiendas: [{ nombre: 'Farmacia', tipo: 'farmacia' }],
  });
  const fichaId = productosPiel(conProd.estado)[0].id;
  const alta = prepararAltaAccesorio(conProd.estado, ARMARIO(), { nombre: 'Reloj', tipo: 'relojes', productoId: fichaId });
  const guardado = aplicarAltaAccesorio(conProd.estado, ARMARIO(), alta.plan);
  const donde = dondeComprarAccesorio(guardado.estado, guardado.armario, guardado.accesorio.id);
  eq(donde.hay, false, 'una tienda sin url no da enlace');
  eq(donde.donde, ['Farmacia'], '⚠️ pero SÍ dice dónde conseguirlo: es una respuesta completa');
  const nuevo = datosAccesorios(guardado.estado).accesorios.find((a) => a.id === guardado.accesorio.id);
  eq(nuevo.productoId, fichaId, '⚠️ se guarda el ID de la ficha, nunca la ficha');
  ok(!('precio' in nuevo), 'ni un precio guardado en este módulo');
  ok(!('tiendas' in nuevo), 'ni sus tiendas');
  eq(auditarAccesorios(r.estado, r.armario).catalogosNuevos, 0, '❌ otro catálogo: cero');

  // Apartado 13 — la lista de deseados.
  const d1 = anadirDeseoAccesorio(r.estado, { nombre: 'Reloj de acero', tipo: 'relojes' }, { hoy: HOY });
  eq(d1.error, null, 'un deseo se añade');
  eq(deseosAccesorios(d1.estado).length, 1, 'y se guarda');
  eq(deseosAccesorios(d1.estado)[0].nombre, 'Reloj de acero',
    '⚠️ el deseo SÍ lleva nombre: todavía no lo tiene, así que no puede ser una prenda');
  const rep = anadirDeseoAccesorio(d1.estado, { nombre: 'reloj de ACERO' });
  ok(rep.sinEfecto, 'el mismo dos veces no se duplica');
  ok(!!anadirDeseoAccesorio(r.estado, { nombre: '  ' }).error, 'sin nombre no se guarda');
  ok(!!anadirDeseoAccesorio(r.estado, { nombre: 'X', productoId: 'fantasma' }).error,
    'ni con una ficha que no existe');
  const ed = editarDeseoAccesorio(d1.estado, deseosAccesorios(d1.estado)[0].id, { marca: 'Casio' });
  eq(deseosAccesorios(ed.estado)[0].marca, 'Casio', 'se puede editar');
  ok(!!editarDeseoAccesorio(d1.estado, 'noexiste', {}).error, 'y lo que no existe se dice');
  eq(auditarAccesorios(r.estado, r.armario).listasDeseosGlobales, 0,
    '⚠️ no hay lista de deseos global en el proyecto: el apartado 13 dice *"si ya existe"*, y se declara');
}

/* ===========================================================================
   Test 13 — DESACTIVAR Y REACTIVAR (apartado 14 · 15.10-15.13)
   =========================================================================== */
console.log('\nTest 13 — desactivar una categoría, y todo');
{
  const r = conUno();
  const sinRelojes = alternarParteAccesorios(r.estado, 'relojes');
  ok(!categoriaActivaAccesorios(sinRelojes, 'relojes'), 'se apaga una categoría');
  ok(categoriaActivaAccesorios(sinRelojes, 'gafas'), 'manteniendo las demás (el ejemplo del enunciado)');
  eq(accesorios(sinRelojes, r.armario).length, 0, 'y sus accesorios dejan de enseñarse');
  eq(datosAccesorios(sinRelojes).accesorios.length, 1,
    '⚠️ pero NO se borran: apagar no borra, y la prenda sigue en el armario');
  eq(sinRelojes === undefined, false, 'el estado vuelve normalizado');

  const otraVez = alternarParteAccesorios(sinRelojes, 'relojes');
  eq(accesorios(otraVez, r.armario).length, 1, 'al reactivarla vuelve a salir, entero');
  eq(accesorios(otraVez, r.armario)[0].nombre, 'Casio negro', 'con su nombre');

  let todo = r.estado;
  CATEGORIAS_ACCESORIO.forEach((c) => { todo = elegirCategoriasAccesorios(todo, []); });
  eq(categoriasActivasAccesorios(todo).length, 0, 'se pueden apagar todas');
  eq(accesorios(todo, r.armario).length, 0, 'y no se enseña nada');
  eq(datosAccesorios(todo).accesorios.length, 1, 'sin perder nada');
  const vueltas = elegirCategoriasAccesorios(todo, CATEGORIAS_ACCESORIO.map((c) => c.id));
  eq(accesorios(vueltas, r.armario).length, 1, 'y al reactivarlas vuelve todo');
  eq(alternarParteAccesorios(r.estado, 'inventada'), normalizarEstiloHombre(r.estado),
    'una parte que no existe no cambia nada');
}

/* ===========================================================================
   Test 14 — PERSISTENCIA (regla 5 · 15.14)
   =========================================================================== */
console.log('\nTest 14 — persistencia: el normalizador no se lleva nada');
{
  const r = conUno({ estilos: ['casual'], ocasiones: ['estudios'], combinaCon: ['urbano'], nota: 'mío' });
  let e = alternarEnUsoAccesorio(r.estado, r.accesorio.id).estado;
  e = anadirDeseoAccesorio(e, { nombre: 'Gafas nuevas', tipo: 'gafas' }, { hoy: HOY }).estado;
  const antes = datosAccesorios(e);
  const despues = normalizarAccesorios(JSON.parse(JSON.stringify(antes)));
  eq(despues, antes, '⚠️ guardar y volver a leer devuelve exactamente lo mismo (regla 5)');
  Object.keys(DEFAULT_ACCESORIOS).forEach((k) => {
    ok(k in despues, `el campo "${k}" sobrevive al normalizador`);
  });
  eq(despues.enUso.length, 1, 'lo que lleva puesto sobrevive');
  eq(despues.deseos.length, 1, 'y su lista de deseados');

  // ⚠️ Lo que apunta a lo que ya no está, no.
  const roto = normalizarAccesorios({ ...antes, enUso: ['fantasma'] });
  eq(roto.enUso, [], 'un "estoy usando" que apunta a nada no se guarda: mentiría');
  eq(normalizarAccesorios(null).accesorios, [], 'un guardado corrupto no revienta');
  eq(normalizarAccesorios({}).partes.relojes, true, 'y las partes vuelven a su valor por defecto');
  eq(normalizarAccesorios({ partes: { relojes: false } }).partes.relojes, false,
    'respetando lo que él había apagado');
  eq(normalizarAccesorio({ prendaId: 'p', nota: 'x'.repeat(500) }).nota.length, MAX_NOTA_ACCESORIO,
    'la nota se recorta al máximo');
  eq(normalizarDeseo({ nombre: '  ' }), null, 'un deseo sin nombre no es nada');
  eq(normalizarDeseo({ nombre: 'X', tipo: 'inventado' }).tipo, 'otros', 'y un tipo raro cae en "Otros"');

  // La prenda borrada desde el Armario.
  const huerfano = accesorios(r.estado, ARMARIO());
  eq(huerfano, [], '⚠️ si borra la prenda en el Armario, el accesorio deja de enseñarse');
  eq(accesoriosHuerfanos(r.estado, ARMARIO()).length, 1, 'pero la auditoría lo ve');
  eq(resumenAccesorios(r.estado, ARMARIO()).huerfanos, 1, 'y el resumen lo cuenta');
}

/* ===========================================================================
   Test 15 — BORRAR: A LA PAPELERA GLOBAL, SIN TOCAR EL ARMARIO
   =========================================================================== */
console.log('\nTest 15 — borrar va a la papelera de siempre');
{
  ok(!!CATALOGO_PAPELERA['accesorios.accesorios'], 'la colección está en el catálogo global');
  ok(!!CATALOGO_PAPELERA['accesorios.deseos'], 'y la de deseados');
  eq(CATALOGO_PAPELERA['accesorios.accesorios'].tipo, 'Accesorio', 'con su nombre para el usuario');
  eq(auditarAccesorios(base(), ARMARIO()).papelerasNuevas, 0, '❌ otra papelera: cero');

  const r = conUno({ nota: 'el de diario' });
  const del = eliminarAccesorio(r.estado, r.accesorio.id, { ahora: '2026-08-28T10:00:00.000Z' });
  eq(del.error, null, 'se borra sin error');
  eq(datosAccesorios(del.estado).accesorios.length, 0, 'y desaparece de la lista');
  eq(r.armario.prendas.length, 1, '⚠️ pero la PRENDA sigue en el armario: borrar aquí no la toca');
  ok(TEXTO_AL_BORRAR.includes('Armario'), 'y la pantalla lo dice antes de borrar');
  eq(describirEntrada(del.entrada), 'el de diario', 'la papelera lo identifica por su nota');
  const vuelto = restaurarAccesorio(del.estado, del.entrada);
  eq(datosAccesorios(vuelto.estado).accesorios.length, 1, 'restaurar lo devuelve');
  eq(accesorios(vuelto.estado, r.armario)[0].nombre, 'Casio negro', 'y vuelve unido a su prenda');
  ok(!!eliminarAccesorio(r.estado, 'noexiste').entrada === false, 'borrar lo que no existe se dice');

  const conDeseo = anadirDeseoAccesorio(r.estado, { nombre: 'Gafas nuevas' }, { hoy: HOY });
  const dd = eliminarDeseoAccesorio(conDeseo.estado, deseosAccesorios(conDeseo.estado)[0].id);
  eq(deseosAccesorios(dd.estado).length, 0, 'un deseo también se borra');
  eq(describirEntrada(dd.entrada), 'Gafas nuevas', 'y la papelera lo llama por su nombre');
  eq(deseosAccesorios(restaurarDeseoAccesorio(dd.estado, dd.entrada).estado).length, 1, 'y vuelve');
  ok(!eliminarDeseoAccesorio(r.estado, 'noexiste').entrada, 'lo que no existe, no');
}

/* ===========================================================================
   Test 16 — PANEL, RESUMEN Y TEXTOS (15.15, "probar móvil")
   =========================================================================== */
console.log('\nTest 16 — el panel que dibuja la pantalla');
{
  const r = conUno({ estilos: ['casual'], ocasiones: ['estudios'] });
  const p = panelAccesorios(r.estado, r.armario);
  eq(p.estado, 'configurado', 'el panel sabe en qué estado está');
  eq(p.accesorios.length, 1, 'con sus accesorios ya unidos a la prenda');
  eq(p.porCategoria.length, 7, 'agrupados por las categorías activas');
  eq(p.porCategoria.find((c) => c.id === 'relojes').accesorios.length, 1, 'y cada uno en la suya');
  eq(p.plaquitas.length, 4, 'las cuatro plaquitas');
  ok(PLAQUITAS_ACCESORIOS.every((x) => x.listo), '⚠️ y ninguna decorativa: las cuatro funcionan (regla 8)');
  eq(p.estilos.length, ESTILOS_VESTIR.length, 'ofrece los estilos de la Fase 6');
  eq(p.ocasiones.length, 7, 'y las siete ocasiones');

  const sinDeseos = alternarParteAccesorios(r.estado, 'deseos');
  eq(panelAccesorios(sinDeseos, r.armario).plaquitas.length, 3, 'una parte apagada quita su plaquita');
  eq(panelAccesorios(sinDeseos, r.armario).deseos, [], 'y su lista no se enseña');

  const res = resumenAccesorios(r.estado, r.armario);
  eq(res.accesorios, 1, 'el resumen cuenta los accesorios');
  eq(res.conEstilo, 1, 'los que tienen estilo');
  eq(res.conOcasion, 1, 'los que tienen ocasión');
  eq(res.favoritos, 0, 'y los favoritos, contados sobre la prenda');
  eq(res.categorias, 7, 'con las categorías activas');

  // ⚠️ El tono, sobre los textos FIJOS.
  const textos = [
    ...SUGERENCIAS_ACCESORIOS.map((s) => s.texto),
    TEXTOS_ACCESORIOS.viveEnElArmario, TEXTO_AL_BORRAR, TEXTOS_ACCESORIOS.oculto,
  ];
  textos.forEach((t) => ok(tonoCorrecto(t), `sin reproches: "${t.slice(0, 45)}…"`));
  ok(!tonoCorrecto('Formal'),
    '⚠️ y por eso el barrido NO toca las frases con nombres de estilo: "Formal" contiene "mal"');
  ok(PALABRAS_PROHIBIDAS.includes('mal'), 'que es una palabra de la lista de la Fase 16');
  ok(textosDeAccesorios().length > 20, 'los textos del módulo se pueden barrer');
  ok(textosDeAccesorios().every((t) => typeof t === 'string' && t.length > 0), 'y ninguno está vacío');

  // El registro de la Fase 4.
  const reg = REGISTRO_DATOS.find((d) => d.id === 'estilosFavoritos');
  ok(reg.usan.includes('accesorios'),
    '⚠️ accesorios LEE el estilo que ya eligió, en vez de volver a preguntárselo');
  ok(reg.usan.includes('estilo'), 'sin quitarle el módulo que ya lo usaba');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
