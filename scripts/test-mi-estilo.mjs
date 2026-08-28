// ============================================================================
// EH · Fase 29/65 — Perfil de estilo personal ("Mi estilo")
//
// Las doce pruebas del apartado 16, y lo que gobierna la fase:
//   · este archivo NO GUARDA NADA, menos el booleano de ocultar
//   · los apartados 11, 12 y 15 son el sistema de la Fase 2 (D2-07)
//   · ni una pregunta nueva (apartado 14: "no crear un test de estilo")
//   · un bloque sin módulos activos no se pinta (apartado 6)
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre, moduloEH,
  modulosActivos, alternarModulo, MODULOS_EH,
} from '../src/lib/estiloDeHombre.js';
import { subirModulo } from '../src/lib/gestionModulos.js';
import { guardarDato } from '../src/lib/datosEstiloHombre.js';
import { alternarValor, ZONA_MI_ESTILO } from '../src/lib/perfilEstilo.js';
import { configurarPerfumes, anadirPerfume } from '../src/lib/perfumes.js';
import { configurarGustos, anadirGusto } from '../src/lib/gustos.js';
import { configurarAccesorios } from '../src/lib/accesorios.js';
import { crearPrenda } from '../src/lib/armario.js';
import {
  MODULO_ANFITRION, TEXTOS_MI_ESTILO, BLOQUES_MI_ESTILO, bloqueMiEstilo, IDS_EN_BLOQUES,
  ESTADOS_MODULO, estadoModulo, FUENTES_DE_ESTADO, estadoDeModulo, MAX_ETIQUETAS,
  etiquetasDeEstilo, coloresDeMiEstilo, resumenDeBloque, unosGustos, bloquesVisibles,
  datosMiEstilo, miEstiloOculto, ocultarMiEstilo, mostrarMiEstilo, resumenMiEstilo,
  auditarMiEstilo, textosDeMiEstilo, panelMiEstilo,
} from '../src/lib/miEstilo.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-08-28';
const ARM = { prendas: [], outfits: [], usos: [] };
const vacio = () => normalizarEstiloHombre(DEFAULT_ESTILO_HOMBRE);
const conModulos = (ids) => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ids);

console.log('\n🧔  EH · Fase 29/65 — Perfil de estilo personal\n');

/* ===========================================================================
   Test 1 — ENTRAR SIN DATOS (apartado 16, prueba 1)
   =========================================================================== */
console.log('Test 1 — entrar sin datos');
{
  const e = vacio();
  eq(bloquesVisibles(e, { armario: ARM }), [],
    '⚠️ sin ningún módulo activo no se pinta ni un bloque (apartado 6)');
  eq(resumenMiEstilo(e, { armario: ARM }).bloques, 0, 'y el resumen lo dice con un cero');
  const et = etiquetasDeEstilo(e, ARM);
  eq(et.hay, false, 'sin preferencias no hay etiquetas');
  eq(et.etiquetas, [], '⚠️ y NO se inventa ninguna');
  eq(et.texto, TEXTOS_MI_ESTILO.sinEtiquetas,
    '⚠️ se dice que se irá llenando solo — que es el apartado 14 en una frase');
  eq(coloresDeMiEstilo(e), [], 'ni colores');
  eq(miEstiloOculto(e), false, 'y la tarjeta nace visible');
  eq(panelMiEstilo(e, { armario: ARM }).bloques, [], 'el panel aguanta un estado vacío');
}

/* ===========================================================================
   Test 2 — LOS SEIS BLOQUES (apartado 1)
   =========================================================================== */
console.log('\nTest 2 — los seis bloques del apartado 1');
{
  eq(BLOQUES_MI_ESTILO.map((b) => b.id),
    ['ropa', 'pelo', 'cuidado', 'fragancias', 'accesorios', 'gustos'],
    'los seis, en el orden del enunciado');
  eq(BLOQUES_MI_ESTILO.map((b) => b.nombre),
    ['Ropa', 'Pelo', 'Cuidado', 'Fragancias', 'Accesorios', 'Gustos'], 'con sus nombres');
  ok(BLOQUES_MI_ESTILO.every((b) => b.icono), 'y sus iconos');
  /* ⚠️ Cada bloque nombra sus módulos POR ID: si alguien renombra uno en
     `MODULOS_EH`, aquí desaparece y esta prueba salta. */
  IDS_EN_BLOQUES.forEach((id) => {
    ok(!!moduloEH(id), `⚠️ "${id}" existe en el catálogo de la Fase 1`);
  });
  eq(auditarMiEstilo(vacio()).idsDesconocidos, 0, 'y la auditoría lo mide');
  // Apartado 6 — *"Skincare ✓ Pelo ✓ Barba ✓"*: Cuidado agrupa varios.
  ok(bloqueMiEstilo('cuidado').modulos.includes('skincare'), 'Cuidado incluye Skincare');
  ok(bloqueMiEstilo('cuidado').modulos.includes('barba'), 'y Barba');
  eq(bloqueMiEstilo('ropa').modulos, ['estilo'], 'Ropa es el módulo de Estilo y armario');
  eq(bloqueMiEstilo('nada'), null, 'y un bloque que no existe da null');
}

/* ===========================================================================
   Test 3 — CON UN SOLO MÓDULO, Y CON VARIOS (pruebas 2 y 3)
   =========================================================================== */
console.log('\nTest 3 — con uno, y con varios');
{
  const uno = conModulos(['perfumes']);
  eq(bloquesVisibles(uno, { armario: ARM }).map((b) => b.id), ['fragancias'],
    '⚠️ con un solo módulo se pinta UN bloque: los demás no aparecen');
  eq(bloquesVisibles(uno, { armario: ARM })[0].modulosActivos.map((m) => m.id), ['perfumes'],
    'con su módulo dentro');

  const varios = conModulos(['estilo', 'perfumes', 'gustos']);
  eq(bloquesVisibles(varios, { armario: ARM }).map((b) => b.id), ['ropa', 'fragancias', 'gustos'],
    'con varios activos salen sus bloques');
  ok(!bloquesVisibles(varios, { armario: ARM }).some((b) => b.id === 'cuidado'),
    '⚠️ y Cuidado NO sale, porque no tiene ningún módulo activo (apartado 6)');

  const conCuidado = conModulos(['skincare']);
  eq(bloquesVisibles(conCuidado, { armario: ARM }).map((b) => b.id), ['cuidado'],
    'con Skincare sí sale Cuidado');
  eq(resumenDeBloque(conCuidado, 'cuidado'), 'Skincare',
    'y su resumen nombra solo los activos');
  const dos = alternarModulo(conCuidado, 'barba', true);
  ok(resumenDeBloque(dos, 'cuidado').includes('Barba'), 'al activar Barba, se suma');
  ok(!resumenDeBloque(dos, 'cuidado').includes('Sonrisa'),
    '⚠️ y lo desactivado NO se nombra: *"no mostrar módulos desactivados"*');
}

/* ===========================================================================
   Test 4 — EL ESTADO DE CADA MÓDULO (apartado 13)
   =========================================================================== */
console.log('\nTest 4 — 🟢 configurado · ⚪ sin configurar · ⚫ desactivado');
{
  eq(ESTADOS_MODULO.map((e) => e.id), ['configurado', 'sin_configurar', 'desactivado'],
    'los tres del apartado 13');
  eq(ESTADOS_MODULO.map((e) => e.icono), ['🟢', '⚪', '⚫'], 'con sus tres iconos');

  const e = conModulos(['perfumes', 'gustos']);
  eq(estadoDeModulo(e, 'perfumes'), 'sin_configurar', 'un módulo activo sin tocar: sin configurar');
  eq(estadoDeModulo(e, 'accesorios'), 'desactivado', 'uno apagado: desactivado');
  eq(estadoDeModulo(e, 'inventado'), 'desactivado', 'y uno que no existe, también');

  const conf = configurarPerfumes(e, { hoy: HOY }).estado;
  eq(estadoDeModulo(conf, 'perfumes'), 'configurado',
    '⚠️ y al configurarlo cambia solo: se lo pregunta A SU MÓDULO');
  eq(estadoDeModulo(conf, 'gustos'), 'sin_configurar', 'sin tocar el de al lado');

  /* ⚠️ El punto de extensión: una línea por módulo, ningún `if` suelto. */
  ok(Object.keys(FUENTES_DE_ESTADO).length >= 6, 'hay una fuente de estado por módulo con pantalla');
  Object.keys(FUENTES_DE_ESTADO).forEach((id) => {
    ok(!!moduloEH(id), `la fuente "${id}" apunta a un módulo del catálogo`);
  });
  // Un módulo sin fuente todavía: sale "sin configurar", que es la verdad.
  const bloqueado = conModulos(['higiene']);
  eq(estadoDeModulo(bloqueado, 'higiene'), 'sin_configurar',
    '⚠️ un módulo sin pantalla propia sale "sin configurar", no un hueco');
  eq(estadoModulo('configurado').icono, '🟢', 'la búsqueda de estado funciona');
  eq(estadoModulo('nada'), null, 'y uno que no existe da null');
}

/* ===========================================================================
   Test 5 — LAS ETIQUETAS SE DERIVAN (apartado 2)
   =========================================================================== */
console.log('\nTest 5 — ⚠️ las etiquetas salen de lo que ya dijo');
{
  const e = conModulos(['estilo']);
  const conEstilos = alternarValor(alternarValor(e, 'estilosFavoritos', 'casual').estado,
    'estilosFavoritos', 'minimalista').estado;
  const et = etiquetasDeEstilo(conEstilos, ARM);
  eq(et.hay, true, 'con preferencias, hay etiquetas');
  eq(et.etiquetas.map((x) => x.id), ['casual', 'minimalista'],
    '⚠️ salen del perfil de estilo de la F6, sin volver a preguntar nada');
  ok(et.etiquetas.every((x) => x.suyo), 'y se marcan como suyas');
  eq(et.etiquetas[0].nombre, 'Casual', 'con su nombre para el usuario');

  // ⚠️ Y también lo que refleja el armario, sin que él lo escriba.
  const armario = {
    ...ARM,
    prendas: [
      crearPrenda({ nombre: 'Sudadera', categoria: 'sudaderas' }),
      crearPrenda({ nombre: 'Chándal', categoria: 'chandal' }),
      crearPrenda({ nombre: 'Zapatillas', categoria: 'zapatillas' }),
      crearPrenda({ nombre: 'Shorts', categoria: 'shorts' }),
    ],
  };
  const conArmario = etiquetasDeEstilo(e, armario);
  ok(conArmario.etiquetas.every((x) => x.suyo === false),
    '⚠️ lo que se deduce del armario se marca como NO suyo: no se le atribuye');
  ok(etiquetasDeEstilo(conEstilos, armario).etiquetas.length <= MAX_ETIQUETAS,
    'y nunca salen más de las que caben');
  const repetido = etiquetasDeEstilo(conEstilos, armario).etiquetas.map((x) => x.id);
  eq(repetido.length, new Set(repetido).size, 'sin repetir ninguna');

  // Apartado 4 — los colores, del mismo sitio y sin otro selector.
  const conColor = alternarValor(conEstilos, 'coloresFavoritos', 'negro').estado;
  eq(coloresDeMiEstilo(conColor).map((c) => c.id), ['negro'], 'los colores salen del perfil');
  eq(coloresDeMiEstilo(conColor)[0].nombre, 'Negro', 'con su nombre');
}

/* ===========================================================================
   Test 6 — ACTUALIZACIÓN AUTOMÁTICA (pruebas 5 y 6)
   =========================================================================== */
console.log('\nTest 6 — ⚠️ se actualiza solo, porque no hay copia');
{
  let e = conModulos(['perfumes', 'gustos']);
  e = configurarPerfumes(e, { hoy: HOY }).estado;
  eq(resumenDeBloque(e, 'fragancias'), 'Todavía sin perfumes', 'sin nada, se dice');

  const antes = JSON.stringify(normalizarEstiloHombre(e).modulos.find((m) => m.id === 'estilo'));
  e = anadirPerfume(e, { nombre: 'Uno que tengo' }, { hoy: HOY }).estado;
  ok(resumenDeBloque(e, 'fragancias').includes('1 perfume'),
    '⚠️ al añadir un perfume, el resumen cambia SIN que nadie sincronice nada');
  const despues = JSON.stringify(normalizarEstiloHombre(e).modulos.find((m) => m.id === 'estilo'));
  eq(despues, antes, '⚠️ y "Mi estilo" no ha guardado NADA: todo se deriva');

  e = configurarGustos(e, { hoy: HOY }).estado;
  e = anadirGusto(e, { nombre: 'Fútbol', tipo: 'gusta' }, { hoy: HOY }).estado;
  ok(resumenDeBloque(e, 'gustos').includes('1 cosa'), 'lo mismo con los gustos');
  eq(unosGustos(e).cuantos, 1, 'y "Me gusta" trae su pequeña selección (apartado 9)');
  ok(unosGustos(e).verTodos.includes('Ver todos'), 'con su "Ver todos"');
  eq(unosGustos(alternarModulo(e, 'gustos', false)), null,
    '⚠️ con el módulo apagado devuelve `null`, no una lista vacía');
}

/* ===========================================================================
   Test 7 — ⚠️ EL ORDEN Y "QUÉ APARECE" SON DE LA FASE 2 (apartados 11, 12 y 15)
   =========================================================================== */
console.log('\nTest 7 — ⚠️ ni un orden ni un interruptor nuevos (D2-07)');
{
  const e = conModulos(['estilo', 'perfumes', 'gustos']);
  const antes = bloquesVisibles(e, { armario: ARM }).map((b) => b.id);
  // Se sube Perfumes con la función de la Fase 2, no con una de aquí.
  const subido = subirModulo(subirModulo(e, 'perfumes'), 'perfumes');
  const despues = bloquesVisibles(subido, { armario: ARM }).map((b) => b.id);
  ok(despues[0] === 'fragancias', '⚠️ reordenar con `subirModulo` (F2) REORDENA los bloques');
  ok(JSON.stringify(antes) !== JSON.stringify(despues), 'y el orden cambia de verdad');
  eq(despues.length, antes.length, 'sin perder ni ganar bloques');

  // Apagar un módulo con la función de la F2 quita su bloque.
  const sinGustos = alternarModulo(e, 'gustos', false);
  ok(!bloquesVisibles(sinGustos, { armario: ARM }).some((b) => b.id === 'gustos'),
    '⚠️ y apagar un módulo (F2) quita su bloque: ese es el interruptor');
  ok(bloquesVisibles(alternarModulo(sinGustos, 'gustos', true), { armario: ARM }).some((b) => b.id === 'gustos'),
    'al reactivarlo, vuelve (pruebas 8 y 9)');

  eq(auditarMiEstilo(e).listasDeOrden, 0, 'la auditoría: cero listas de orden');
  eq(auditarMiEstilo(e).interruptoresNuevos, 0, 'y cero interruptores nuevos');
  ok(TEXTOS_MI_ESTILO.dondeSeOrdena.includes('Gestionar apartados'),
    '⚠️ y la pantalla DICE dónde se cambia, en vez de tener su propio sistema');

  const fuente = readFileSync(new URL('../src/lib/miEstilo.js', import.meta.url), 'utf8');
  const sinComentarios = fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  ok(!/function\s+subirBloque|function\s+bajarBloque/.test(sinComentarios),
    '⚠️ el código no redefine el reordenado');
  ok(!/PREGUNTAS_|preguntas:\s*\[/.test(sinComentarios),
    '⚠️ NI UNA LISTA DE PREGUNTAS: *"no crear un test de estilo"* (apartado 14)');
  eq(auditarMiEstilo(e).preguntasNuevas, 0, 'y la auditoría lo declara');
}

/* ===========================================================================
   Test 8 — OCULTAR Y VOLVER (apartado 10 · pruebas 10 y 11)
   =========================================================================== */
console.log('\nTest 8 — ocultar "Mi estilo" no toca nada más');
{
  let e = conModulos(['estilo', 'perfumes']);
  e = configurarPerfumes(e, { hoy: HOY }).estado;
  e = anadirPerfume(e, { nombre: 'Uno' }, { hoy: HOY }).estado;

  eq(miEstiloOculto(e), false, 'nace visible');
  const oculto = ocultarMiEstilo(e);
  eq(miEstiloOculto(oculto), true, 'se puede ocultar');
  eq(panelMiEstilo(oculto, { armario: ARM }).oculto, true, 'y el panel lo dice');

  /* ⚠️ *"La información de los demás módulos permanece intacta."* */
  eq(modulosActivos(oculto).length, modulosActivos(e).length,
    '⚠️ ocultar NO apaga ningún módulo');
  eq(bloquesVisibles(oculto, { armario: ARM }).length, bloquesVisibles(e, { armario: ARM }).length,
    'ni cambia lo que hay debajo');
  eq(resumenDeBloque(oculto, 'fragancias'), resumenDeBloque(e, 'fragancias'),
    'ni un dato de los módulos (prueba 11)');
  ok(TEXTOS_MI_ESTILO.ocultarNoBorra.includes('siguen igual'), 'y se le dice antes de hacerlo');

  eq(miEstiloOculto(mostrarMiEstilo(oculto)), false, 'y se puede volver a enseñar');
  eq(datosMiEstilo(vacio()).oculto, false, 'un guardado viejo no lo tiene y no revienta');
  eq(ZONA_MI_ESTILO.dentroDe, MODULO_ANFITRION,
    '⚠️ y se guarda donde la F6 declaró que vive: dentro de "estilo"');
}

/* ===========================================================================
   Test 9 — SIN DATOS DUPLICADOS (prueba 12)
   =========================================================================== */
console.log('\nTest 9 — ⚠️ ni un dato duplicado');
{
  const a = auditarMiEstilo(conModulos(['estilo', 'perfumes']));
  eq(a.datosGuardados, 1, '⚠️ esta fase guarda UN dato: el booleano de ocultar');
  eq(a.armariosNuevos, 0, 'cero armarios');
  eq(a.diariosNuevos, 0, 'cero diarios');
  eq(a.objetivosNuevos, 0, 'cero objetivos');
  eq(a.calendariosNuevos, 0, 'cero calendarios');
  eq(a.catalogosNuevos, 0, 'cero catálogos de productos');
  eq(a.favoritosNuevos, 0, 'cero sistemas de favoritos');
  eq(a.recordatoriosNuevos, 0, 'cero recordatorios');
  eq(a.papelerasNuevas, 0, 'y cero papeleras: aquí no hay nada propio que borrar');
  eq(a.bloques, BLOQUES_MI_ESTILO.length, 'con sus seis bloques declarados');

  /* ⚠️ Lo guardado del módulo anfitrión es SOLO `miEstilo`: ni una copia de
     nada de los otros módulos. */
  const e = ocultarMiEstilo(conModulos(['estilo']));
  const config = normalizarEstiloHombre(e).modulos.find((m) => m.id === MODULO_ANFITRION).config;
  eq(Object.keys(config.miEstilo), ['oculto'], 'y ese dato tiene un solo campo');
}

/* ===========================================================================
   Test 10 — PANEL, RESUMEN Y TEXTOS
   =========================================================================== */
console.log('\nTest 10 — el panel que dibuja la pantalla');
{
  let e = conModulos(['estilo', 'skincare', 'perfumes', 'accesorios', 'gustos']);
  e = configurarPerfumes(e, { hoy: HOY }).estado;
  e = configurarAccesorios(e, { hoy: HOY }).estado;

  const p = panelMiEstilo(e, { armario: ARM });
  eq(p.titulo, TEXTOS_MI_ESTILO.titulo, 'el panel trae su título');
  eq(p.bloques.map((b) => b.id), ['ropa', 'cuidado', 'fragancias', 'accesorios', 'gustos'],
    'con los bloques que tienen módulos activos');
  ok(p.bloques.every((b) => typeof b.resumen === 'string'), 'cada uno con su frase');
  ok(p.bloques.every((b) => b.modulosActivos.every((m) => m.insignia)),
    'y cada módulo con su insignia de estado');
  ok(!!p.etiquetas, 'las etiquetas');
  ok(Array.isArray(p.colores), 'los colores');

  const r = resumenMiEstilo(e, { armario: ARM });
  eq(r.bloques, 5, 'el resumen cuenta los bloques');
  eq(r.modulos, 5, 'y los módulos');
  eq(r.configurados + r.sinConfigurar, r.modulos, 'todos tienen uno de los dos estados');
  eq(r.oculto, false, 'y dice si está oculto');

  ok(textosDeMiEstilo().length > 8, 'los textos se pueden barrer');
  ok(textosDeMiEstilo().every((t) => typeof t === 'string' && t.length > 0), 'y ninguno está vacío');
  ok(!textosDeMiEstilo().some((t) => /debes|tienes que|obligatorio/i.test(t)),
    '⚠️ ninguno le manda: *"sin crear pasos obligatorios"* (apartado 13)');
  ok(MODULOS_EH.length > 0, 'y el catálogo de la F1 sigue siendo el mismo');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
