// ============================================================================
// EH · Fase 33/65 — Descubrir e inspiración ("✨ Descubrir")
//
// Las doce pruebas del apartado 16, y lo que gobierna la fase:
//   · Descubrir NO es la Fase 32: aquí las ideas no salen de sus datos
//   · UNA sola lista de guardados (apartado 6), la que creó la F32
//   · un módulo apagado no aporta tarjetas (apartado 4)
//   · ocultar (1), quitar desde Personalizar (12) y "Desactivada" (11) son lo mismo
//   · ni un catálogo de productos nuevo, y nunca "compra esto"
//   · y NO es una red social
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre, alternarModulo,
} from '../src/lib/estiloDeHombre.js';
import { MODULO_ANFITRION } from '../src/lib/miEstilo.js';
import { PALABRAS_PROHIBIDAS } from '../src/lib/motorRecomendaciones.js';
import { CATALOGO_VACIO_PORQUE } from '../src/lib/motorProductos.js';
import {
  TEMAS_IDEAS, PREFIJO_DESCUBRIR, listaDeGuardados, guardarIdea, datosIdeas,
  idGuardable, REGLAS_IDEAS,
} from '../src/lib/ideasEstilo.js';
import {
  TEMAS_DESCUBRIR, TEXTOS_DESCUBRIR, FRECUENCIAS_DESCUBRIR, FRECUENCIA_DESCUBRIR_DEFECTO,
  frecuenciaDescubrir, TARJETAS_DESCUBRIR, tarjetaDescubrir, IDS_DESCUBRIR,
  FORMULAS_DESCUBRIR, DEFAULT_DESCUBRIR, MOTIVOS_DESCUBRIR, normalizarDescubrir,
  datosDescubrir, cambiarFrecuenciaDescubrir, ocultarDescubrir, mostrarDescubrir,
  descubrirApagado, alternarFiltro, limpiarFiltros, DIAS_TRAS_VERLA_DESC,
  silenciadaTarjeta, descubrir, marcarVistasDescubrir, descartarTarjeta,
  deshacerDescarte, guardarTarjeta, quitarTarjetaGuardada, resumenDescubrir,
  lineaDescubrir, textosDeDescubrir, auditarDescubrir, panelDescubrir,
} from '../src/lib/descubrir.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-08-29';
const dias = (d) => {
  const f = new Date(`${HOY}T00:00:00`);
  f.setDate(f.getDate() + d);
  return f.toISOString().slice(0, 10);
};
const nuevo = () => normalizarEstiloHombre(DEFAULT_ESTILO_HOMBRE);
const con = (ids) => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ids);
const TODOS_EH = ['estilo', 'skincare', 'pelo', 'barba', 'perfumes', 'accesorios', 'gustos'];
const FUENTE = readFileSync(new URL('../src/lib/descubrir.js', import.meta.url), 'utf8');
const SIN_COMENTARIOS = FUENTE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

console.log('\n✨  EH · Fase 33/65 — Descubrir e inspiración\n');

/* ===========================================================================
   Test 1 — ⚠️ DESCUBRIR NO ES LA FASE 32
   =========================================================================== */
console.log('Test 1 — ⚠️ inspiración, no recomendación');
{
  eq(TEXTOS_DESCUBRIR.titulo, '✨ Descubrir', 'la plaquita del apartado 1, literal');
  eq(TEXTOS_DESCUBRIR.sub, 'Inspiración, no obligación.', 'con la regla del objetivo');

  /* ⚠️ Una tarjeta de aquí NO explica "por qué" con sus datos: no sale de ellos.
     Inventarle un motivo sería atribuirle una razón que no existe. */
  ok(TARJETAS_DESCUBRIR.every((t) => !('porque' in t) && !('requiere' in t)),
    '⚠️ ninguna tarjeta lleva `porque` ni `requiere`: no salen de sus datos');
  ok(REGLAS_IDEAS.every((r) => typeof r.porque === 'function'),
    'y las de la F32 sí, porque ésas sí salen de ellos');
  ok(!textosDeDescubrir().some((t) => /porque (tienes|ya tienes|has)/i.test(t)),
    '⚠️ y ninguna finge citar un dato suyo');

  /* ⚠️ Los siete temas son los MISMOS de la F32, por sus ids (lección de la F26). */
  eq(TEMAS_DESCUBRIR, TEMAS_IDEAS.map((t) => t.id),
    '⚠️ los temas son los de la F32, no una segunda lista');
  TEMAS_DESCUBRIR.forEach((id) => {
    ok(TARJETAS_DESCUBRIR.some((t) => t.tema === id), `el tema "${id}" tiene tarjetas`);
  });
  ok(!/TEMAS\s*=\s*\[\s*\{/.test(SIN_COMENTARIOS), 'y el archivo no declara otra lista de temas');
}

/* ===========================================================================
   Test 2 — LAS TARJETAS (apartados 3 y 14 · prueba 2)
   =========================================================================== */
console.log('\nTest 2 — tarjetas pequeñas, con lenguaje abierto');
{
  eq(auditarDescubrir().tarjetasSinFormula, 0,
    '⚠️ TODAS empiezan por una de las fórmulas del apartado 14');
  eq(auditarDescubrir().tarjetasConTonoMalo, 0, 'y ninguna lleva una palabra prohibida');
  PALABRAS_PROHIBIDAS.forEach((p) => {
    ok(!textosDeDescubrir().some((t) => t.toLowerCase().includes(p)), `ninguna dice "${p}"`);
  });
  ok(!textosDeDescubrir().some((t) => /siempre hay que|lo correcto es|la norma es|se lleva/i.test(t)),
    '⚠️ y ninguna presenta una tendencia como una verdad absoluta (apartado 14)');
  eq(FORMULAS_DESCUBRIR, ['Podrías', 'Una idea podría ser', 'Si te gusta'],
    'las tres del enunciado');

  ok(new Set(IDS_DESCUBRIR).size === TARJETAS_DESCUBRIR.length, 'ningún id repetido');
  ok(TARJETAS_DESCUBRIR.every((t) => t.id.startsWith(PREFIJO_DESCUBRIR)),
    '⚠️ y todos los ids llevan el prefijo que la F32 acepta en su lista de guardados');
  ok(TARJETAS_DESCUBRIR.every((t) => t.texto.length > 30), 'cada una es una frase entera');
  eq(tarjetaDescubrir('inventada'), null, 'una tarjeta que no existe da null');

  const e = con(TODOS_EH);
  const r = descubrir(e, { hoy: HOY });
  ok(r.tarjetas.length > 0, 'con módulos activos, salen tarjetas (prueba 2)');
  ok(r.tarjetas.every((t) => t.icono && t.temaNombre && t.texto),
    'con su icono, su tema y su texto');
}

/* ===========================================================================
   Test 3 — ⚠️ UN MÓDULO APAGADO NO APORTA TARJETAS (apartado 4 · prueba 11)
   =========================================================================== */
console.log('\nTest 3 — ⚠️ *"no mostrar contenido de categorías desactivadas"*');
{
  eq(auditarDescubrir().tarjetasSinModulo, 0,
    '⚠️ TODAS declaran su módulo: una sin él saldría con todo apagado');
  TARJETAS_DESCUBRIR.forEach((t) => {
    ok(TODOS_EH.includes(t.modulo), `"${t.id}" apunta a un módulo de verdad`);
  });

  eq(descubrir(nuevo(), { hoy: HOY }).total, 0,
    '⚠️ sin ningún módulo activo NO sale ni una tarjeta (prueba 11)');

  const soloPerfumes = con(['perfumes']);
  const r = descubrir(soloPerfumes, { hoy: HOY, limite: 50 });
  ok(r.total > 0, 'con Perfumes encendido, salen las suyas');
  ok(r.tarjetas.every((t) => t.tema === 'perfumes'),
    '⚠️ y SOLO las suyas: nada de un módulo que él ha apagado');

  const sinPerfumes = alternarModulo(soloPerfumes, 'perfumes', false);
  eq(descubrir(sinPerfumes, { hoy: HOY }).total, 0, 'al apagarlo, desaparecen');
  eq(descubrir(alternarModulo(sinPerfumes, 'perfumes', true), { hoy: HOY, limite: 50 }).total, r.total,
    'y al encenderlo vuelven, enteras');
}

/* ===========================================================================
   Test 4 — LOS FILTROS (apartado 5 · prueba 3)
   =========================================================================== */
console.log('\nTest 4 — ¿qué quieres descubrir?');
{
  const e = con(TODOS_EH);
  eq(datosDescubrir(e).filtros, [], 'de partida no hay ninguno marcado');
  ok(TEXTOS_DESCUBRIR.sinFiltros.includes('todos los temas'),
    '⚠️ y sin nada marcado se ven TODOS: vacío y "los siete" son lo mismo');
  const todos = descubrir(e, { hoy: HOY, limite: 50 }).total;

  const soloRopa = alternarFiltro(e, 'ropa');
  eq(datosDescubrir(soloRopa).filtros, ['ropa'], 'se puede marcar uno (prueba 3)');
  const r = descubrir(soloRopa, { hoy: HOY, limite: 50 });
  ok(r.tarjetas.every((t) => t.tema === 'ropa'), '⚠️ y solo salen las de ese tema');
  ok(r.total < todos, 'que son menos que todas');

  const dos = alternarFiltro(soloRopa, 'perfumes');
  eq(datosDescubrir(dos).filtros, ['perfumes', 'ropa'],
    '⚠️ se guardan en el orden del catálogo, no en el de los toques');
  ok(descubrir(dos, { hoy: HOY, limite: 50 }).tarjetas.every((t) => ['ropa', 'perfumes'].includes(t.tema)),
    'y salen los dos temas');

  eq(datosDescubrir(alternarFiltro(dos, 'ropa')).filtros, ['perfumes'], 'y se puede desmarcar');
  eq(datosDescubrir(limpiarFiltros(dos)).filtros, [], 'o quitarlos todos de una vez');
  eq(descubrir(limpiarFiltros(dos), { hoy: HOY, limite: 50 }).total, todos,
    'y entonces vuelven todos los temas');
  eq(datosDescubrir(alternarFiltro(e, 'inventado')).filtros, [], 'un tema que no existe no se marca');
  eq(normalizarDescubrir({ filtros: ['fantasma', 'ropa'] }).filtros, ['ropa'],
    '⚠️ y uno guardado de otra versión no revive');
}

/* ===========================================================================
   Test 5 — ⚠️ UNA SOLA LISTA DE GUARDADOS (apartado 6 · pruebas 4 y 12)
   =========================================================================== */
console.log('\nTest 5 — ⚠️ *"no crear una segunda lista de guardados"*');
{
  const e = con(TODOS_EH);
  const idTarjeta = TARJETAS_DESCUBRIR[0].id;

  ok(!('guardadas' in DEFAULT_DESCUBRIR),
    '⚠️ el almacén de Descubrir NO tiene `guardadas`: sería la segunda lista');
  ok(!('guardadas' in datosDescubrir(e)), 'ni aparece al leerlo');
  eq(auditarDescubrir().listasDeGuardadosPropias, 0, 'y la auditoría lo declara');

  const g = guardarTarjeta(e, idTarjeta, { hoy: HOY });
  eq(listaDeGuardados(g).map((x) => x.reglaId), [idTarjeta],
    '⚠️ guardar una tarjeta escribe en la lista que creó la F32 (prueba 4)');
  eq(datosIdeas(g).recomendaciones.guardadas.length, 1, 'que es literalmente la misma');

  /* ⚠️ Y sobrevive al normalizador de la F32, que es donde estaba el peligro:
     su catálogo no conoce estos ids, y sin el prefijo se los llevaría. */
  const releido = normalizarEstiloHombre(JSON.parse(JSON.stringify(g)));
  eq(listaDeGuardados(releido).map((x) => x.reglaId), [idTarjeta],
    '⚠️ y SOBREVIVE al normalizador de la F32 (regla 5)');
  eq(idGuardable(idTarjeta), true, 'porque su id es guardable');
  eq(idGuardable('cualquier_cosa'), false, 'y uno inventado no lo es');
  eq(idGuardable('desc_'), false, 'ni el prefijo a secas');

  // Prueba 12 — *"comprobar que no se duplican favoritos ni productos"*.
  eq(listaDeGuardados(guardarTarjeta(g, idTarjeta, { hoy: HOY })).length, 1,
    '⚠️ guardarla dos veces NO la duplica (prueba 12)');
  const conLasDos = guardarIdea(g, 'ropa_primer_outfit', { hoy: HOY });
  eq(listaDeGuardados(conLasDos).length, 2,
    'una idea y una tarjeta conviven en la misma lista');
  eq(descubrir(conLasDos, { hoy: HOY }).guardadas.map((x) => x.id), [idTarjeta],
    '⚠️ y cada sistema resuelve las SUYAS: aquí solo sale la tarjeta');

  eq(listaDeGuardados(quitarTarjetaGuardada(g, idTarjeta)), [], 'y se puede quitar');
  eq(listaDeGuardados(guardarTarjeta(e, 'inventada')), [], 'una que no existe no se guarda');
  ok(TEXTOS_DESCUBRIR.mismaLista.includes('no hay dos sitios'),
    'y la pantalla lo dice');
}

/* ===========================================================================
   Test 6 — DESCARTAR Y NO INSISTIR (apartados 7 y 13 · prueba 5)
   =========================================================================== */
console.log('\nTest 6 — ❌ no me interesa, y no insistir');
{
  const e = con(TODOS_EH);
  eq(MOTIVOS_DESCUBRIR.map((m) => m.id), ['no_interesa'],
    'un solo motivo, el del apartado 7');
  const id = TARJETAS_DESCUBRIR[0].id;

  const d = descartarTarjeta(e, id, { hoy: HOY });
  eq(d.error, null, 'se puede descartar (prueba 5)');
  eq(silenciadaTarjeta(d.estado, id, { hoy: HOY }).silenciada, true,
    '⚠️ *"si el usuario ya la ha descartado: no insistir"* (apartado 13)');
  ok(!descubrir(d.estado, { hoy: HOY, limite: 50 }).tarjetas.some((t) => t.id === id),
    'y deja de salir');
  eq(descartarTarjeta(e, 'inventada').error, 'Esa tarjeta no existe.', 'una que no existe, no');

  eq(silenciadaTarjeta(d.estado, id, { hoy: dias(400) }).silenciada, false,
    '⚠️ pero no es para siempre: caduca');
  eq(silenciadaTarjeta(deshacerDescarte(d.estado, id), id, { hoy: HOY }).silenciada, false,
    'y se puede deshacer');

  /* ⚠️ Descartar aquí NO calla una idea de la F32, ni al revés: son dos
     sistemas con dos historiales, aunque compartan la lista de guardados. */
  eq(datosIdeas(d.estado).recomendaciones.feedback, [],
    '⚠️ y descartar una tarjeta no toca el historial de las ideas de la F32');

  // Apartado 13 — y lo ya enseñado tampoco se repite en seguida.
  const antes = descubrir(e, { hoy: HOY });
  const vistas = marcarVistasDescubrir(e, antes.tarjetas.map((t) => t.id), { hoy: HOY });
  eq(datosDescubrir(e).vistas, [],
    '⚠️ calcularlas no ensucia el historial: `descubrir()` no escribe nada');
  eq(datosDescubrir(vistas).vistas.length, antes.tarjetas.length, 'marcarlas sí');
  ok(!descubrir(vistas, { hoy: HOY, limite: 50 }).tarjetas.some((t) => antes.tarjetas.some((a) => a.id === t.id)),
    '⚠️ y al día siguiente no se repiten (apartado 13)');
  ok(descubrir(vistas, { hoy: dias(DIAS_TRAS_VERLA_DESC + 1), limite: 50 }).tarjetas
    .some((t) => antes.tarjetas.some((a) => a.id === t.id)),
  `pero pasados ${DIAS_TRAS_VERLA_DESC} días vuelven: callar no es borrar`);
  eq(datosDescubrir(marcarVistasDescubrir(e, ['inventada'])).vistas, [],
    'y una que no existe no entra en el historial');
}

/* ===========================================================================
   Test 7 — ABRIR MÓDULO Y PRODUCTOS (apartados 8, 9 y 10 · pruebas 6 y 7)
   =========================================================================== */
console.log('\nTest 7 — ⚠️ ni un catálogo nuevo, y nunca *"compra esto"*');
{
  const DESTINOS = ['armario', 'skincare', 'pelo', 'barba', 'perfumes', 'accesorios', 'gustos'];
  TARJETAS_DESCUBRIR.filter((t) => t.accion).forEach((t) => {
    ok(DESTINOS.includes(t.accion.destino),
      `"${t.id}" abre "${t.accion.destino}", el módulo que ya existe (prueba 6)`);
    ok(/^Ver en /.test(t.accion.etiqueta), 'con la etiqueta del apartado 8');
  });
  ['Ver en Skincare', 'Ver en Armario', 'Ver en Perfumes'].forEach((et) => {
    ok(TARJETAS_DESCUBRIR.some((t) => t.accion?.etiqueta === et),
      `y las tres del ejemplo existen: "${et}"`);
  });

  const e = con(TODOS_EH);
  const conProducto = descubrir(e, { hoy: HOY, limite: 50 }).tarjetas.filter((t) => t.producto);
  ok(conProducto.length > 0, 'hay tarjetas que hablan de un producto (prueba 7)');
  ok(conProducto.every((t) => t.catalogo === CATALOGO_VACIO_PORQUE),
    '⚠️ y llevan al catálogo GLOBAL, que está vacío a propósito (D2-03) y lo dice');
  eq(auditarDescubrir().catalogosDeProductos, 0,
    '⚠️ cero catálogos de inspiración nuevos (apartado 9)');
  ok(!/CATALOGO\s*=\s*\[|PRODUCTOS_DESCUBRIR/.test(SIN_COMENTARIOS),
    'y el código no declara ninguno');

  // Apartado 10 — *"nunca 'compra esto'"*.
  ok(!textosDeDescubrir().some((t) => /compra|cómpra|comprar ahora|añadir al carrito/i.test(t)),
    '⚠️ ninguna tarjeta dice "compra"');
  ok(TEXTOS_DESCUBRIR.sinCompras.includes('no se compra nada'), 'y la pantalla lo dice');
  ok(!/carrito|checkout|comprar\(/i.test(FUENTE), 'ni el código tiene nada de comprar');
}

/* ===========================================================================
   Test 8 — ⚠️ UN SOLO INTERRUPTOR (apartados 1, 11 y 12 · pruebas 8, 9 y 10)
   =========================================================================== */
console.log('\nTest 8 — ⚠️ ocultar, quitar y "Desactivada" son lo mismo');
{
  eq(FRECUENCIAS_DESCUBRIR.map((f) => f.nombre), ['Poca', 'Normal', 'Mucha', 'Desactivada'],
    '⚠️ las CUATRO de ESTE enunciado, que no son las de la F32');
  eq(FRECUENCIA_DESCUBRIR_DEFECTO, 'normal', 'y por defecto, Normal');
  eq(auditarDescubrir().interruptores, 1,
    '⚠️ un interruptor para los apartados 1, 11 y 12 (lección de la F26, segunda vez)');

  const e = con(TODOS_EH);
  eq(descubrir(e, { hoy: HOY }).tarjetas.length, 2, 'con Normal salen dos');
  eq(descubrir(cambiarFrecuenciaDescubrir(e, 'poca'), { hoy: HOY }).tarjetas.length, 1,
    'con Poca, una (prueba 8)');
  eq(descubrir(cambiarFrecuenciaDescubrir(e, 'mucha'), { hoy: HOY }).tarjetas.length, 4,
    'y con Mucha, cuatro');

  const apagado = ocultarDescubrir(e);
  eq(datosDescubrir(apagado).frecuencia, 'desactivada',
    '⚠️ "👁️ Ocultar" (apartado 1) es elegir "Desactivada" (apartado 11)');
  eq(descubrirApagado(apagado), true, 'y quitarlo desde Personalizar es lo mismo (apartado 12)');
  const r = descubrir(apagado, { hoy: HOY });
  eq(r.apagado, true, 'lo dice');
  eq(r.tarjetas, [], 'y no propone ninguna (prueba 9)');
  eq(resumenDescubrir(apagado, { hoy: HOY }).tarjetas, null,
    '⚠️ apagado devuelve `null`, no 0 (lección de la F25)');
  eq(lineaDescubrir(apagado, { hoy: HOY }), null, 'y no pinta línea');
  ok(r.texto.includes('volver a encenderlo'), 'y se dice cómo volver');

  eq(datosDescubrir(mostrarDescubrir(apagado)).frecuencia, 'normal', 'volver deja Normal (prueba 10)');
  eq(datosDescubrir(mostrarDescubrir(apagado, 'mucha')).frecuencia, 'mucha', 'o la que él diga');
  eq(datosDescubrir(mostrarDescubrir(apagado, 'desactivada')).frecuencia, 'normal',
    '⚠️ y "volver a mostrar" nunca puede dejarlo apagado otra vez');
  eq(descubrir(mostrarDescubrir(apagado), { hoy: HOY }).tarjetas.length, 2,
    'y las tarjetas vuelven (prueba 10)');
  eq(datosDescubrir(cambiarFrecuenciaDescubrir(e, 'inventada')).frecuencia, 'normal',
    'una frecuencia que no existe no se escribe');

  /* ⚠️ Y apagar Descubrir NO apaga las ideas de la F32: son dos cosas. */
  eq(datosIdeas(apagado).frecuencia, 'normal',
    '⚠️ apagar Descubrir no toca la frecuencia de las ideas (apartado 12: *"sin afectar al resto"*)');
}

/* ===========================================================================
   Test 9 — ⚠️ NO ES UNA RED SOCIAL (apartado 15)
   =========================================================================== */
console.log('\nTest 9 — ⚠️ *"no habrá seguidores, ni likes públicos, ni comentarios"*');
{
  const a = auditarDescubrir();
  eq(a.seguidores, 0, '❌ seguidores');
  eq(a.likesPublicos, 0, '❌ likes públicos');
  eq(a.comentarios, 0, '❌ comentarios');
  eq(a.perfilesDeOtros, 0, '❌ perfiles de otros usuarios');
  /* ⚠️ **Buscar la PALABRA aquí sería la trampa de "conseguir contiene seguir"**,
     por quinta vez en este bloque: la auditoría se llama `seguidores` y la frase
     que dice que NO hay red social contiene "seguidores" y "comentarios". Lo que
     hay que comprobar es que no exista el MECANISMO. */
  ok(!/(seguidores|comentarios|likes|perfiles)\s*:\s*\[/.test(SIN_COMENTARIOS),
    '⚠️ el código no guarda ninguna lista de seguidores, comentarios ni likes');
  ['seguidores', 'comentarios', 'likes', 'perfiles', 'compartido'].forEach((k) => {
    ok(!(k in DEFAULT_DESCUBRIR), `y el almacén no tiene "${k}"`);
  });
  ok(!/function\s+(seguir|comentar|compartir|darLike)/.test(SIN_COMENTARIOS),
    'ni una función de seguir, comentar, compartir o dar like');
  ok(!/from '\.\/supabase'|fetch\(/.test(FUENTE),
    '⚠️ ni habla con nadie: el contenido es local, no de otros usuarios');
  ok(TEXTOS_DESCUBRIR.sinRedSocial.includes('solo para ti'), 'y la pantalla lo dice');
  ok(!/\bpedirIA|askAI|anthropic/i.test(FUENTE), 'ni llama a la IA');
}

/* ===========================================================================
   Test 10 — PERSISTENCIA (regla 5)
   =========================================================================== */
console.log('\nTest 10 — persistencia');
{
  const e = descartarTarjeta(
    alternarFiltro(cambiarFrecuenciaDescubrir(con(TODOS_EH), 'mucha'), 'ropa'),
    TARJETAS_DESCUBRIR[0].id, { hoy: HOY },
  ).estado;
  const antes = datosDescubrir(e);
  const despues = normalizarDescubrir(JSON.parse(JSON.stringify(antes)));
  eq(despues, antes, '⚠️ guardar y volver a leer devuelve lo mismo (regla 5)');
  Object.keys(DEFAULT_DESCUBRIR).forEach((k) => {
    ok(k in despues, `el campo "${k}" sobrevive al normalizador`);
  });
  eq(normalizarDescubrir(null), DEFAULT_DESCUBRIR, 'un guardado corrupto cae en el defecto');
  eq(normalizarDescubrir({ feedback: [{ reglaId: 'fantasma', motivo: 'no_interesa' }] }).feedback, [],
    'una tarjeta de otra versión no revive');

  /* ⚠️ Comparte el módulo anfitrión con "Mi estilo", la pantalla y las ideas. */
  const cfg = normalizarEstiloHombre(e).modulos.find((m) => m.id === MODULO_ANFITRION).config;
  ok('descubrir' in cfg, 'vive en el módulo anfitrión');
  ok('ideas' in cfg || datosIdeas(e).frecuencia === 'normal', 'y no pisa lo de las ideas');
  eq(datosIdeas(e).recomendaciones.feedback, [], '⚠️ ni su historial');
}

/* ===========================================================================
   Test 11 — RESUMEN, PANEL Y LÍNEA
   =========================================================================== */
console.log('\nTest 11 — el panel que dibuja la pantalla');
{
  const e = con(TODOS_EH);
  const p = panelDescubrir(e, { hoy: HOY });
  eq(p.titulo, '✨ Descubrir', 'el título del apartado 1');
  eq(p.frecuencias.length, 4, 'las cuatro frecuencias');
  eq(p.temas.length, 7, 'los siete temas para filtrar');
  ok(p.temas.every((t) => 'puesto' in t), 'con su marca');
  eq(p.apagado, false, 'encendido');
  eq(p.tarjetas.length, 2, 'y sus dos tarjetas');
  ok(p.sinFiltros.length > 0, 'sin filtros marcados, se dice qué significa');
  eq(panelDescubrir(alternarFiltro(e, 'ropa'), { hoy: HOY }).sinFiltros, '',
    'y con alguno marcado, ya no hace falta');

  const r = resumenDescubrir(e, { hoy: HOY });
  eq(r.frecuencia, 'normal', 'el resumen dice la frecuencia');
  eq(r.temas, 7, 'los temas');
  eq(r.catalogo, TARJETAS_DESCUBRIR.length, 'y cuántas tarjetas hay en total');
  ok(r.tarjetas > 0, 'con las que salen ahora');

  ok(/idea/.test(lineaDescubrir(e, { hoy: HOY })), 'la línea de la plaquita dice cuántas hay');
  eq(lineaDescubrir(nuevo(), { hoy: HOY }), null,
    '⚠️ y sin ninguna NO pinta un cero: no hay línea');
  ok(TEXTOS_DESCUBRIR.sinTarjetas.includes('no hay nada nuevo'),
    'cuando no queda ninguna, se dice (regla 8)');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
