// ============================================================================
// EH · Fase 37/65 — Buscador y navegación interna
//
// Las pruebas del apartado 17, y lo que gobierna la fase:
//   · el apartado 11 manda: ni otro buscador global, ni otra búsqueda de módulos
//   · un módulo oculto o desactivado SALE, marcado, y NUNCA se enciende solo
//   · lo eliminado no aparece, y sale gratis
//   · no hay favoritos globales: son los de cada módulo
//   · "Recientes" guarda lo que abre desde aquí, no por dónde navega
//   · y el "volver" nunca devuelve `null`
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre, moduloEH,
  guardarConfig, IDS_EH,
} from '../src/lib/estiloDeHombre.js';
import { buscarModulos } from '../src/lib/gestionModulos.js';
import { MODULO_ANFITRION } from '../src/lib/miEstilo.js';
import { ocultarModulo, desactivarModulo, estadoDe } from '../src/lib/gestionEstilo.js';
import { datosPerfumes } from '../src/lib/perfumes.js';
import {
  limpiar, encaja, FUENTES_BUSQUEDA, fuenteBusqueda, TEXTOS_BUSCADOR, MAX_POR_GRUPO,
  buscarEnEstilo, resolverApartado, MAX_RECIENTES, DEFAULT_BUSCADOR, normalizarBuscador,
  datosBuscador, apuntarReciente, olvidarRecientes, recientesDe, RAIZ, migas, atras,
  enlaceAOtroModulo, resumenBuscador, auditarBuscador, textosDeBuscador, panelBuscador,
} from '../src/lib/buscadorEstilo.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const TODOS_EH = ['estilo', 'skincare', 'pelo', 'barba', 'perfumes', 'sonrisa', 'accesorios', 'gustos'];
const con = (ids) => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ids);
const FUENTE = readFileSync(new URL('../src/lib/buscadorEstilo.js', import.meta.url), 'utf8');
const SIN_COMENTARIOS = FUENTE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** Un estado con elementos de verdad que encontrar. */
const conCosas = () => {
  let e = con(TODOS_EH);
  e = guardarConfig(e, 'perfumes', {
    perfumes: {
      perfumes: [
        { id: 'pf1', nombre: 'Perfume de verano', favorito: true },
        { id: 'pf2', nombre: 'Colonia fresca', favorito: false },
      ],
      porProbar: [{ id: 'pp1', nombre: 'Perfume que quiero probar' }],
      historial: [], partes: { historial: true },
    },
  });
  e = guardarConfig(e, 'skincare', {
    rutinas: {
      rutinas: [{ id: 'r1', nombre: 'Rutina de mañana', pasos: [{ id: 'p1', texto: 'Limpiar' }], activa: true, momento: 'manana', frecuencia: 'diaria' }],
      hechos: [],
    },
  });
  return e;
};

console.log('\n🔍  EH · Fase 37/65 — Buscador y navegación interna\n');

/* ===========================================================================
   Test 1 — ⚠️ EL APARTADO 11 DECIDE QUÉ SE CONSTRUYE
   =========================================================================== */
console.log('Test 1 — ⚠️ *"no crear otro buscador independiente"*');
{
  eq(auditarBuscador().buscadoresGlobales, 0,
    '⚠️ cero buscadores globales nuevos: el de BI F3 sigue siendo el único');
  eq(auditarBuscador().busquedasDeModulos, 0,
    '⚠️ y ni una copia de la búsqueda de módulos de la F2');
  ok(!/from '\.\/indiceBusqueda'/.test(FUENTE),
    'este archivo no arrastra el índice global entero para comparar dos cadenas');
  ok(/buscarModulos/.test(FUENTE), '⚠️ pero SÍ usa `buscarModulos()` de la F2 para los módulos');
  eq(auditarBuscador().indicesGuardados, 0,
    '⚠️ y no guarda un índice: se quedaría viejo en cuanto él borrase algo');

  const e = conCosas();
  const r = buscarEnEstilo(e, 'perfume');
  const deModulos = r.grupos.find((g) => g.id === 'modulos');
  eq(deModulos.resultados.map((x) => x.id), buscarModulos(e, 'perfume').map((m) => m.id),
    '⚠️ y los módulos que encuentra son EXACTAMENTE los de la F2');
}

/* ===========================================================================
   Test 2 — BUSCAR Y AGRUPAR (apartados 1, 2 y 3 · pruebas 1, 2 y 3)
   =========================================================================== */
console.log('\nTest 2 — resultados agrupados, no una lista caótica');
{
  const e = conCosas();
  eq(buscarEnEstilo(e, '').grupos, [], 'sin texto no se busca nada');
  eq(buscarEnEstilo(e, '   ').total, 0, 'ni con espacios');

  const r = buscarEnEstilo(e, 'perfume');
  ok(r.total > 1, 'buscar "perfume" encuentra varias cosas');
  ok(r.grupos.length > 1, '⚠️ y salen AGRUPADAS (apartado 2)');
  ok(r.grupos.every((g) => g.grupo && g.icono && Array.isArray(g.resultados)),
    'cada grupo con su nombre, su icono y sus resultados');
  ok(r.grupos.some((g) => g.id === 'modulos' && g.resultados.some((x) => x.id === 'perfumes')),
    '🌫️ Perfumes, el módulo (prueba 1)');
  ok(r.grupos.some((g) => g.id === 'perfumes' && g.resultados.some((x) => x.nombre === 'Perfume de verano')),
    'y "Mis perfumes", con el suyo dentro (prueba 2)');
  ok(r.grupos.some((g) => g.id === 'porProbar'), 'y "Quiero probar", como el ejemplo del enunciado');

  // Apartado 3 — *"bar…" sin terminar la palabra*.
  const bar = buscarEnEstilo(e, 'bar');
  ok(bar.grupos.some((g) => g.resultados.some((x) => x.id === 'barba')),
    '⚠️ "bar" encuentra Barba sin terminar la palabra (apartado 3)');
  eq(limpiar('Perfumé'), 'perfume', 'y las tildes no estorban');
  eq(encaja('Perfumé', 'perfume'), true, 'así que "perfume" encuentra "Perfumé"');
  eq(encaja('lo que sea', ''), false, 'y una consulta vacía no encaja con nada');

  // Prueba 3 — buscar un producto.
  const conProducto = guardarConfig(e, 'pelo', {
    pelo: { rutinas: [], hechos: [], productos: [{ id: 'x1', nombre: 'Champú suave' }] },
  });
  ok(buscarEnEstilo(conProducto, 'champu').grupos.some((g) => g.id === 'productosPelo'),
    'y un producto se encuentra, con tilde o sin ella (prueba 3)');

  // Apartado 2 — con un tope por grupo, para que no se desborde.
  eq(MAX_POR_GRUPO, 5, 'con su tope por grupo');
  ok(r.grupos.every((g) => g.resultados.length <= MAX_POR_GRUPO), 'que se respeta');
  ok(r.grupos.every((g) => g.total >= g.resultados.length), 'y se dice cuántos hay en total');
}

/* ===========================================================================
   Test 3 — SIN RESULTADOS (apartado 4)
   =========================================================================== */
console.log('\nTest 3 — cuando no hay nada');
{
  const r = buscarEnEstilo(conCosas(), 'zzzqqq');
  eq(r.total, 0, 'no encuentra nada');
  eq(r.vacio, true, 'y lo dice');
  eq(r.texto, 'No hemos encontrado nada.', 'con la frase literal del apartado 4');
  ok(TEXTOS_BUSCADOR.explorar.includes('Explorar todos los apartados'),
    '⚠️ y con su salida debajo: no se queda en un callejón');
  eq(panelBuscador(conCosas(), 'zzzqqq').explorar, TEXTOS_BUSCADOR.explorar, 'el panel la trae');
}

/* ===========================================================================
   Test 4 — ⚠️ OCULTOS Y DESACTIVADOS (apartados 13 y 14 · pruebas 5 y 6)
   =========================================================================== */
console.log('\nTest 4 — ⚠️ *"nunca activarlo automáticamente"*');
{
  const e = conCosas();
  const oculto = ocultarModulo(e, 'perfumes');
  const rO = buscarEnEstilo(oculto, 'perfume');
  const modO = rO.grupos.find((g) => g.id === 'modulos').resultados.find((x) => x.id === 'perfumes');
  ok(!!modO, '⚠️ un módulo OCULTO sigue saliendo en el buscador (prueba 5)');
  eq(modO.estado, 'oculto', 'con su estado');
  eq(modO.aviso, '👁️ Apartado oculto', 'y su aviso, literal del apartado 13');
  eq(modO.accion, 'Mostrar apartado', 'y lo que ofrece');
  eq(modO.insignia.icono, '⚪', 'con la etiqueta de la F36');
  /* ⚠️ Y sus ELEMENTOS también salen: ocultar no cambia nada por dentro. */
  ok(rO.grupos.some((g) => g.id === 'perfumes'),
    '⚠️ y sus elementos TAMBIÉN: ocultar no toca el funcionamiento (F36, apartado 3)');

  const off = desactivarModulo(e, 'perfumes');
  const rD = buscarEnEstilo(off, 'perfume');
  const modD = rD.grupos.find((g) => g.id === 'modulos').resultados.find((x) => x.id === 'perfumes');
  ok(!!modD, '⚠️ y uno DESACTIVADO también sale (prueba 6)');
  eq(modD.aviso, '⏸️ Apartado desactivado', 'con el aviso del apartado 14');
  eq(modD.accion, 'Activar', 'y su oferta');
  ok(!rD.grupos.some((g) => g.id === 'perfumes'),
    '⚠️ pero sus ELEMENTOS no: desactivado es que dejó de funcionar (F36, apartado 4)');

  /* ⚠️ Decimosexto `aplicarPlan`: sin `confirmado` no enciende nada. */
  const sin = resolverApartado(oculto, 'perfumes');
  eq(sin.aplicado, false, '⚠️ sin `confirmado` NO se activa automáticamente (apartados 13 y 14)');
  eq(sin.estado, normalizarEstiloHombre(oculto), 'y el estado sale igual');
  ok(sin.aviso.confirmar === 'Mostrar apartado', 'con su botón');
  ok(sin.aviso.nota.includes('todo seguirá ahí'), 'y diciendo que los datos siguen');
  eq(auditarBuscador().activacionesAutomaticas, 0, 'la auditoría: cero activaciones automáticas');

  const hecho = resolverApartado(oculto, 'perfumes', { confirmado: true });
  eq(hecho.aplicado, true, 'confirmando, sí');
  eq(estadoDe(hecho.estado, 'perfumes'), 'activo', 'y vuelve a verse');
  eq(estadoDe(resolverApartado(off, 'perfumes', { confirmado: true }).estado, 'perfumes'), 'activo',
    'igual con el desactivado');
  eq(resolverApartado(e, 'perfumes').aplicado, false, 'y con uno ya activo no hay nada que hacer');
  eq(resolverApartado(e, 'inventado').aviso, null, 'ni con uno que no existe');
}

/* ===========================================================================
   Test 5 — ⚠️ LO ELIMINADO NO SALE (apartado 15) Y NO HAY FAVORITOS GLOBALES (6)
   =========================================================================== */
console.log('\nTest 5 — ⚠️ la papelera y los favoritos');
{
  eq(auditarBuscador().papeleraConsultada, 0,
    '⚠️ el buscador no mira la papelera (apartado 15)');
  ok(!/from '\.\/papelera'/.test(FUENTE),
    '⚠️ y ni la importa: lo borrado se fue de su lista, así que no hay nada que filtrar');
  ok(TEXTOS_BUSCADOR.eliminadosNoSalen.includes('Eliminados recientemente'),
    'y se dice dónde está lo borrado');

  eq(auditarBuscador().favoritosNuevos, 0,
    '⚠️ cero listas de favoritos propias (apartado 6)');
  const e = conCosas();
  const todos = buscarEnEstilo(e, 'perfume');
  const soloFav = buscarEnEstilo(e, 'perfume', { soloFavoritos: true });
  const mios = (r) => r.grupos.find((g) => g.id === 'perfumes')?.resultados || [];
  eq(mios(todos).length, 1, 'de partida sale el que encaja');
  ok(mios(todos).some((x) => x.favorito), '⚠️ y el favorito es el de SU módulo, leído de la prenda');
  eq(mios(soloFav).length, 1, 'y se puede filtrar por favoritos');
  const sinFav = buscarEnEstilo(e, 'colonia', { soloFavoritos: true });
  eq(sinFav.total, 0, '⚠️ y uno que no lo es se queda fuera del filtro');
  ok(!sinFav.grupos.some((g) => g.id === 'modulos'),
    '⚠️ y los MÓDULOS tampoco salen con ese filtro: un apartado no es un favorito');
  ok(TEXTOS_BUSCADOR.dondeEstanFavoritos.includes('no hay una lista aparte'),
    '⚠️ y la pantalla dice dónde están de verdad (regla 8)');
}

/* ===========================================================================
   Test 6 — RESULTADOS CONTEXTUALES (apartado 12)
   =========================================================================== */
console.log('\nTest 6 — desde un módulo, lo suyo primero');
{
  const e = conCosas();
  const normal = buscarEnEstilo(e, 'perfume');
  const desde = buscarEnEstilo(e, 'perfume', { desde: 'perfumes' });
  eq(desde.grupos[0].modulo, 'perfumes',
    '⚠️ buscando DESDE Perfumes, lo suyo sale primero (apartado 12)');
  eq(desde.total, normal.total,
    '⚠️ pero NO esconde nada: los demás siguen debajo (lección de la F25)');
  eq(desde.grupos.length, normal.grupos.length, 'con los mismos grupos');
}

/* ===========================================================================
   Test 7 — LOS RECIENTES (apartado 5)
   =========================================================================== */
console.log('\nTest 7 — 🕘 recientes, sin espiar la navegación');
{
  const e = conCosas();
  eq(datosBuscador(e).recientes, [], 'de partida no hay ninguno');
  eq(recientesDe(e), [], 'ni se pintan');
  ok(TEXTOS_BUSCADOR.sinRecientes.includes('lo último que abras desde el buscador'),
    '⚠️ y se dice que salen de lo que ABRA DESDE AQUÍ, no de por dónde navegue');

  /* ⚠️ Buscar NO escribe: buscar y abrir son dos llamadas. */
  buscarEnEstilo(e, 'perfume');
  eq(datosBuscador(e).recientes, [], '⚠️ buscar no ensucia los recientes');

  const uno = apuntarReciente(e, 'perfumes');
  eq(datosBuscador(uno).recientes, ['perfumes'], 'abrir uno sí lo apunta');
  const dos = apuntarReciente(uno, 'skincare');
  eq(datosBuscador(dos).recientes, ['skincare', 'perfumes'], '⚠️ y el más reciente va primero');
  eq(datosBuscador(apuntarReciente(dos, 'perfumes')).recientes, ['perfumes', 'skincare'],
    '⚠️ y repetirlo lo sube, no lo duplica');

  let muchos = e;
  IDS_EH.slice(0, MAX_RECIENTES + 3).forEach((id) => { muchos = apuntarReciente(muchos, id); });
  eq(datosBuscador(muchos).recientes.length, MAX_RECIENTES,
    `⚠️ y solo las últimas ${MAX_RECIENTES}: *"solo las últimas cosas utilizadas"*`);

  eq(datosBuscador(apuntarReciente(e, 'inventado')).recientes, [], 'un módulo que no existe no entra');
  eq(datosBuscador(olvidarRecientes(dos)).recientes, [], 'y se pueden olvidar');
  eq(recientesDe(dos).map((m) => m.id), ['skincare', 'perfumes'], 'se pintan con su ficha');
  ok(recientesDe(dos).every((m) => m.nombre && m.icono), 'con nombre e icono');
  eq(recientesDe(ocultarModulo(dos, 'perfumes')).find((m) => m.id === 'perfumes').insignia.icono, '⚪',
    '⚠️ y uno oculto se marca también aquí');

  // ⚠️ Se guardan IDS, nunca lo que escribió.
  eq(auditarBuscador().consultasGuardadas, 0, '⚠️ y NO se guarda ni una búsqueda suya');
  /* ⚠️ Devolver la consulta en el resultado NO es guardarla: lo que se comprueba
     es qué se PERSISTE, que es lo único que sobrevive a cerrar la aplicación. */
  eq(Object.keys(DEFAULT_BUSCADOR), ['recientes'],
    'ni el almacén tiene dónde meterla: solo ids de módulo');
  ok(!/escribir\(estado, \{[^}]*consulta/.test(SIN_COMENTARIOS),
    'y nada la escribe');
}

/* ===========================================================================
   Test 8 — LA NAVEGACIÓN (apartados 7, 8, 9 y 10)
   =========================================================================== */
console.log('\nTest 8 — ⚠️ *"no sacar al usuario accidentalmente de JosStyle"*');
{
  eq(TEXTOS_BUSCADOR.volver, '← Estilo de hombre', 'el botón del apartado 7, literal');

  eq(migas().map((m) => m.nombre), [RAIZ], 'en la raíz, una sola miga');
  eq(migas('perfumes').map((m) => m.nombre), ['Estilo', 'Perfumes'], 'dentro de un módulo, dos');
  eq(migas('perfumes', 'Mi colección').map((m) => m.nombre), ['Estilo', 'Perfumes', 'Mi colección'],
    '⚠️ y con profundidad, el ejemplo literal del apartado 8');
  eq(migas('inventado').map((m) => m.nombre), [RAIZ], 'un módulo que no existe no inventa miga');
  ok(!/migas:\s*\[|guardarConfig\(estado, MODULO_ANFITRION, \{ migas/.test(SIN_COMENTARIOS),
    '⚠️ y las migas NO se guardan: son una función de dónde está');

  /* Apartado 9 — *"detalle → colección → módulo → Estilo"*. */
  eq(atras('perfumes', 'Mi colección').nombre, 'Perfumes', 'de la colección se vuelve al módulo');
  eq(atras('perfumes').nombre, RAIZ, 'y del módulo, a Estilo');
  eq(atras().nombre, RAIZ, '⚠️ y de la raíz, a la raíz: NUNCA `null`');
  ok(atras() !== null && atras('perfumes') !== null,
    '⚠️ así es como no se sale de la aplicación sin querer (apartado 9)');

  /* Apartado 10 — *"al volver: regresar exactamente al punto anterior"*. */
  const enlace = enlaceAOtroModulo('armario', 'perfumes', 'Mi colección');
  eq(enlace.destino, 'armario', 'el enlace lleva al armario');
  eq(enlace.volverA, { modulo: 'perfumes', zona: 'Mi colección' },
    '⚠️ y se lleva de dónde viene, para volver al punto exacto');
  ok(enlace.etiqueta.startsWith('Abrir'), 'con la etiqueta del enunciado');
  eq(enlaceAOtroModulo('diario').etiqueta, 'Abrir Diario', 'y el Diario');
  eq(enlaceAOtroModulo('calendario').etiqueta, 'Abrir Calendario', 'y el Calendario');
}

/* ===========================================================================
   Test 9 — LAS FUENTES, EL PANEL Y LA PERSISTENCIA
   =========================================================================== */
console.log('\nTest 9 — una línea por fuente');
{
  FUENTES_BUSQUEDA.forEach((f) => {
    ok(!!moduloEH(f.modulo), `la fuente "${f.id}" apunta a un módulo del catálogo`);
    ok(typeof f.lista === 'function' && !!f.grupo && !!f.icono, 'con su lista, su grupo y su icono');
  });
  ok(new Set(FUENTES_BUSQUEDA.map((f) => f.id)).size === FUENTES_BUSQUEDA.length, 'ningún id repetido');
  eq(fuenteBusqueda('inventada'), null, 'una que no existe da null');
  /* ⚠️ Las ocho del apartado 1 tienen fuente. */
  ['perfumes', 'accesorios', 'gustos', 'rutinasPiel', 'productosPelo', 'preferencias', 'objetivos']
    .forEach((id) => ok(!!fuenteBusqueda(id), `la fuente "${id}" del apartado 1 existe`));

  const e = conCosas();
  const p = panelBuscador(e, 'perfume', { desde: 'perfumes' });
  eq(p.titulo, '🔍 Buscar en Estilo de hombre', 'el título del apartado 1');
  ok(p.grupos.length > 0, 'con sus grupos');
  eq(p.migas.map((m) => m.nombre), ['Estilo', 'Perfumes'], 'y sus migas');
  ok(p.sinRecientes.length > 0, 'sin recientes, se dice');
  eq(panelBuscador(apuntarReciente(e, 'perfumes'), '').sinRecientes, '', 'y con ellos, ya no');

  const r = resumenBuscador(e, 'perfume');
  ok(r.total > 0, 'el resumen cuenta los resultados');
  eq(r.fuentes, FUENTES_BUSQUEDA.length, 'y las fuentes');

  const guardado = datosBuscador(apuntarReciente(e, 'perfumes'));
  eq(normalizarBuscador(JSON.parse(JSON.stringify(guardado))), guardado,
    '⚠️ guardar y volver a leer devuelve lo mismo (regla 5)');
  eq(normalizarBuscador(null), DEFAULT_BUSCADOR, 'un guardado corrupto cae en el defecto');
  eq(normalizarBuscador({ recientes: ['fantasma', 'perfumes'] }).recientes, ['perfumes'],
    '⚠️ y un módulo retirado del catálogo no revive');
  const cfg = normalizarEstiloHombre(apuntarReciente(e, 'perfumes')).modulos
    .find((m) => m.id === MODULO_ANFITRION).config;
  ok('buscador' in cfg, 'vive en el módulo anfitrión');

  ok(textosDeBuscador().every((t) => typeof t === 'string' && t.length > 0), 'ningún texto vacío');
  ok(!textosDeBuscador().some((t) => /\bdebes\b|tienes que/i.test(t)), 'y ninguno le manda');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
