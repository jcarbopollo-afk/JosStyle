// ============================================================================
// EH · Fase 30/65 — Pantalla principal y organización
//
// Las dieciséis pruebas de UX del apartado 18, y lo que gobierna la fase:
//   · los tres grupos del apartado 3 SON las categorías de la Fase 2
//   · reordenar y ocultar ya existen (apartados 6, 10, 11 y 16 · D2-07)
//   · los accesos rápidos los elige él, y nacen vacíos
//   · "menos es más": ni estadísticas, ni historiales, ni rutinas en la portada
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre, moduloEH,
  modulosActivos, alternarModulo, CATEGORIAS_EH, categoriaEH, MODULOS_EH,
} from '../src/lib/estiloDeHombre.js';
import { subirModulo, modulosAgrupados, recomendados } from '../src/lib/gestionModulos.js';
import { configurarPerfumes } from '../src/lib/perfumes.js';
import { MODULO_ANFITRION, miEstiloOculto } from '../src/lib/miEstilo.js';
import {
  CABECERA_EH, TEXTOS_PANTALLA, seccionesDePantalla, GRUPOS_DEL_ENUNCIADO,
  ACCESOS_DISPONIBLES, accesoRapido, accesosDisponibles, DEFAULT_PANTALLA,
  normalizarPantalla, datosPantalla, alternarAcceso, alternarVerAccesos, accesosActivos,
  MAX_PRIMERAS_OPCIONES, PRIMERAS_OPCIONES, empiezaPorLoQueQuieras, paraAnadir,
  resumenPantalla, auditarPantalla, textosDePantalla, panelPantalla,
} from '../src/lib/pantallaEH.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-08-28';
const ARM = { prendas: [], outfits: [], usos: [] };
const nuevo = () => normalizarEstiloHombre(DEFAULT_ESTILO_HOMBRE);
const con = (ids) => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ids);
const TODOS = MODULOS_EH.map((m) => m.id);

console.log('\n📱  EH · Fase 30/65 — Pantalla principal y organización\n');

/* ===========================================================================
   Test 1 — LA CABECERA (apartado 1)
   =========================================================================== */
console.log('Test 1 — la cabecera, y nada más');
{
  eq(CABECERA_EH.titulo, '🧔 Estilo de hombre', 'el título del enunciado');
  eq(CABECERA_EH.sub, 'Tu cuidado, estilo y preferencias.', 'y su frase, literal');
  eq(Object.keys(CABECERA_EH), ['titulo', 'sub'],
    '⚠️ dos campos y ya: *"nada más"* (apartado 1)');
  eq(panelPantalla(nuevo(), { armario: ARM }).cabecera, CABECERA_EH, 'el panel la trae');
}

/* ===========================================================================
   Test 2 — ⚠️ LOS TRES GRUPOS SON LAS CATEGORÍAS DE LA FASE 2 (apartado 3)
   =========================================================================== */
console.log('\nTest 2 — ⚠️ ni una agrupación nueva');
{
  GRUPOS_DEL_ENUNCIADO.forEach((id) => {
    ok(!!categoriaEH(id), `⚠️ el grupo "${id}" del apartado 3 es una categoría de la F2`);
  });
  eq(categoriaEH('cuidado').nombre, 'Cuidado', 'y se llama como el enunciado');
  eq(categoriaEH('estilo').nombre, 'Estilo', 'igual que el segundo');
  eq(categoriaEH('bienestar').nombre, 'Personal',
    '⚠️ y el tercero se renombró a "Personal", que es como lo llama Josué');

  /* ⚠️ *"🧴 Cuidado: Skincare, Pelo, Cuerpo, Barba"* — Pelo y Barba están ahí. */
  ['skincare', 'pelo', 'barba', 'cuerpo'].forEach((id) => {
    eq(moduloEH(id).categoria, 'cuidado', `"${id}" está en Cuidado, como dice el apartado 3`);
  });
  ['estilo', 'accesorios', 'perfumes'].forEach((id) => {
    eq(moduloEH(id).categoria, 'estilo', `"${id}" está en Estilo`);
  });
  eq(moduloEH('gustos').categoria, 'bienestar', 'y Gustos, en Personal');

  const e = con(['estilo', 'accesorios', 'perfumes', 'skincare', 'pelo', 'barba', 'gustos']);
  const sec = seccionesDePantalla(e, { armario: ARM });
  eq(sec.map((s) => s.nombre), ['Estilo', 'Cuidado', 'Personal'],
    '⚠️ y la pantalla los agrupa así, con `modulosAgrupados` de la F2');
  eq(sec.map((s) => s.modulos.map((m) => m.nombre)),
    [['Estilo y armario', 'Accesorios', 'Perfumes'], ['Skincare', 'Pelo', 'Barba'], ['Mis gustos']],
    '⚠️ con exactamente los módulos que el apartado 3 pone en cada grupo');
  eq(sec.length, modulosAgrupados(e, { soloActivos: true }).length,
    'exactamente los que devuelve la función de la F2: ni uno más');
  eq(auditarPantalla(e).agrupacionesNuevas, 0, 'la auditoría: cero agrupaciones nuevas');

  const fuente = readFileSync(new URL('../src/lib/pantallaEH.js', import.meta.url), 'utf8');
  const sinComentarios = fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  ok(!/GRUPOS\s*=\s*\[\s*\{/.test(sinComentarios),
    '⚠️ el código no declara un mapa `id → grupo` propio');
}

/* ===========================================================================
   Test 3 — SOLO LOS MÓDULOS ACTIVOS (apartados 3 y 14 · pruebas 2, 3 y 4)
   =========================================================================== */
console.log('\nTest 3 — la pantalla crece con él');
{
  eq(seccionesDePantalla(nuevo(), { armario: ARM }), [],
    '⚠️ un usuario nuevo no ve NADA: ni una sección (prueba 1)');

  const uno = con(['skincare']);
  eq(seccionesDePantalla(uno, { armario: ARM }).map((s) => s.nombre), ['Cuidado'],
    'con un módulo, una sección (prueba 2)');
  eq(seccionesDePantalla(uno, { armario: ARM })[0].modulos.map((m) => m.id), ['skincare'],
    '*"si solo usa Skincare, solo verá Skincare"* (apartado 14)');

  const dos = alternarModulo(uno, 'perfumes', true);
  eq(seccionesDePantalla(dos, { armario: ARM }).map((s) => s.nombre), ['Cuidado', 'Estilo'],
    '⚠️ y al activar Perfumes, APARECE su sección (apartado 14)');

  const cinco = con(['skincare', 'pelo', 'estilo', 'perfumes', 'gustos']);
  eq(seccionesDePantalla(cinco, { armario: ARM }).flatMap((s) => s.modulos).length, 5,
    'con cinco módulos salen los cinco (prueba 3)');

  const todos = con(TODOS);
  const sTodos = seccionesDePantalla(todos, { armario: ARM });
  eq(sTodos.flatMap((s) => s.modulos).length, TODOS.length,
    'con todos activos, salen todos (prueba 4)');
  ok(sTodos.length <= CATEGORIAS_EH.length, 'y nunca más secciones que categorías');
  ok(sTodos.every((s) => s.modulos.length > 0),
    '⚠️ y NUNCA una sección vacía: la que no tiene módulos activos no se pinta');

  const apagado = alternarModulo(uno, 'skincare', false);
  eq(seccionesDePantalla(apagado, { armario: ARM }), [],
    'apagar el único módulo deja la pantalla vacía (pruebas 5 y 9)');
  eq(seccionesDePantalla(alternarModulo(apagado, 'skincare', true), { armario: ARM }).length, 1,
    'y al volver a encenderlo, vuelve (pruebas 6 y 8)');
}

/* ===========================================================================
   Test 4 — LA INDICACIÓN DE ESTADO (apartados 4 y 5)
   =========================================================================== */
console.log('\nTest 4 — una tarjeta pequeña, con poca cosa');
{
  const e = con(['perfumes', 'gustos']);
  const mods = seccionesDePantalla(e, { armario: ARM }).flatMap((s) => s.modulos);
  ok(mods.every((m) => m.nombre && m.icono), 'cada tarjeta tiene icono y nombre (apartado 4)');
  ok(mods.every((m) => m.insignia), 'sin configurar, se marca');
  eq(mods[0].insignia.icono, '⚪', 'con su ⚪');

  const conf = configurarPerfumes(e, { hoy: HOY }).estado;
  const perf = seccionesDePantalla(conf, { armario: ARM })
    .flatMap((s) => s.modulos).find((m) => m.id === 'perfumes');
  eq(perf.estado, 'configurado', 'al configurarlo, cambia el estado');
  eq(perf.insignia, null,
    '⚠️ y YA NO lleva insignia: *"no llenar la pantalla de indicadores"* (apartado 5)');
  ok(!('rutinas' in perf) && !('productos' in perf) && !('historial' in perf),
    '⚠️ y la tarjeta NO trae dentro toda la información (apartado 4)');
}

/* ===========================================================================
   Test 5 — ⚠️ REORDENAR Y OCULTAR SON DE LA FASE 2 (apartados 6, 10, 11 y 16)
   =========================================================================== */
console.log('\nTest 5 — ⚠️ ni un orden ni un interruptor nuevos (D2-07)');
{
  /* Empieza con Estilo arriba, para que subir Skincare tenga algo que mover. */
  const e = con(['estilo', 'perfumes', 'skincare']);
  const antes = seccionesDePantalla(e, { armario: ARM }).map((s) => s.id);
  eq(antes, ['estilo', 'cuidado'], 'de partida, Estilo va primero');
  const subido = subirModulo(subirModulo(e, 'skincare'), 'skincare');
  const despues = seccionesDePantalla(subido, { armario: ARM }).map((s) => s.id);
  eq(despues, ['cuidado', 'estilo'],
    '⚠️ reordenar con `subirModulo` (F2) REORDENA las secciones (prueba 7)');
  ok(JSON.stringify(antes) !== JSON.stringify(despues), 'y el orden cambia de verdad');

  eq(auditarPantalla(e).listasDeOrden, 0, 'la auditoría: cero listas de orden');
  ok(TEXTOS_PANTALLA.personalizar.includes('Personalizar'),
    'la pantalla ofrece "Personalizar", que lleva al sistema de la F2 (apartado 6)');

  // Apartado 7 — *"+ Añadir apartado"*, con los que están ocultos.
  eq(paraAnadir(e), recomendados(e),
    '⚠️ "+ Añadir apartado" es `recomendados()` de la F2, no una lista nueva');
  ok(paraAnadir(e).every((m) => !modulosActivos(e).some((x) => x.id === m.id)),
    'y solo ofrece los que NO están activos (apartado 7)');
  ok(TEXTOS_PANTALLA.anadirApartado.includes('Añadir apartado'), 'con su texto');
  eq(paraAnadir(con(TODOS)), [], 'con todos activos, no queda nada que añadir');
}

/* ===========================================================================
   Test 6 — LOS ACCESOS RÁPIDOS (apartado 9 · prueba 10)
   =========================================================================== */
console.log('\nTest 6 — ⚡ accesos rápidos: los elige él');
{
  const e = con(['skincare', 'barba', 'perfumes']);
  eq(datosPantalla(e).accesos, [],
    '⚠️ NINGUNO viene puesto: *"el usuario decide qué accesos aparecen"*');
  eq(accesosActivos(e), [], 'así que no se pinta ninguno');
  ok(TEXTOS_PANTALLA.sinAccesos.includes('Elige'), 'y se dice cómo elegirlos');

  // Los tres ejemplos del enunciado existen.
  ['afeitarme', 'rutina_facial', 'elegir_perfume'].forEach((id) => {
    ok(!!accesoRapido(id), `el acceso "${id}" del ejemplo existe`);
  });
  ok(ACCESOS_DISPONIBLES.every((a) => !!moduloEH(a.modulo)),
    '⚠️ y cada acceso apunta a un módulo del catálogo, por su id');

  const conUno = alternarAcceso(e, 'afeitarme');
  eq(accesosActivos(conUno).map((a) => a.id), ['afeitarme'], 'se puede elegir uno');
  eq(accesosActivos(conUno)[0].zona, 'rutinas', 'y sabe a qué zona abre');
  eq(datosPantalla(alternarAcceso(conUno, 'afeitarme')).accesos, [], 'y quitarlo');

  /* ⚠️ Un atajo a un módulo apagado sería un botón a ninguna parte (regla 8). */
  const soloPiel = con(['skincare']);
  eq(accesosDisponibles(soloPiel).map((a) => a.id), ['rutina_facial'],
    '⚠️ solo se ofrece el acceso de un módulo ACTIVO');
  eq(datosPantalla(alternarAcceso(soloPiel, 'afeitarme')).accesos, [],
    '⚠️ y el de uno apagado no se puede elegir');
  eq(datosPantalla(alternarAcceso(e, 'inventado')).accesos, [], 'ni uno que no existe');

  // Y si apaga el módulo después, el acceso deja de salir sin borrarse.
  const conAcceso = alternarAcceso(e, 'afeitarme');
  const sinBarba = alternarModulo(conAcceso, 'barba', false);
  eq(accesosActivos(sinBarba), [], '⚠️ apagar el módulo hace desaparecer su acceso');
  eq(datosPantalla(sinBarba).accesos, ['afeitarme'],
    '⚠️ pero NO se borra su elección: al reactivarlo vuelve');
  eq(accesosActivos(alternarModulo(sinBarba, 'barba', true)).map((a) => a.id), ['afeitarme'],
    'y vuelve, en efecto');

  // Apartado 10 — la zona entera se puede quitar.
  const sinZona = alternarVerAccesos(conAcceso);
  eq(accesosActivos(sinZona), null,
    '⚠️ con la zona apagada devuelve `null`, no una lista vacía');
  eq(resumenPantalla(sinZona, { armario: ARM }).accesos, null, 'y el resumen también');
  eq(datosPantalla(sinZona).accesos, ['afeitarme'], 'sin perder lo que había elegido');
  eq(accesosActivos(alternarVerAccesos(sinZona)).length, 1, 'y se vuelve a encender');
}

/* ===========================================================================
   Test 7 — EL VACÍO INICIAL (apartado 13 · prueba 1)
   =========================================================================== */
console.log('\nTest 7 — *"empieza por lo que quieras"*');
{
  const e = nuevo();
  const ini = empiezaPorLoQueQuieras(e);
  eq(ini.texto, 'Empieza por lo que quieras.', 'la frase del enunciado');
  ok(ini.opciones.length <= MAX_PRIMERAS_OPCIONES,
    '⚠️ como mucho TRES: *"no mostrar 30 módulos"* (apartado 13)');
  eq(ini.opciones.map((m) => m.id), PRIMERAS_OPCIONES,
    'y son las tres del ejemplo: Cuidado, Estilo y Perfumes');
  ok(ini.opciones.every((m) => m.nombre && m.icono), 'con su nombre y su icono');
  ok(!!panelPantalla(e, { armario: ARM }).inicial, 'el panel lo trae cuando está vacío');

  const conUno = con(['skincare']);
  ok(!empiezaPorLoQueQuieras(conUno).opciones.some((m) => m.id === 'skincare'),
    '⚠️ y no se le ofrece lo que ya tiene');
  eq(panelPantalla(conUno, { armario: ARM }).inicial, null,
    'con algo activo, el vacío inicial desaparece');
}

/* ===========================================================================
   Test 8 — MENOS ES MÁS (apartados 8 y 15)
   =========================================================================== */
console.log('\nTest 8 — ⚠️ lo que la portada NO enseña');
{
  const a = auditarPantalla(con(['skincare', 'perfumes']));
  eq(a.estadisticas, 0, '❌ estadísticas');
  eq(a.historiales, 0, '❌ historiales');
  eq(a.recomendaciones, 0, '❌ recomendaciones');
  eq(a.productos, 0, '❌ productos');
  eq(a.rutinasCompletas, 0, '❌ rutinas completas');
  eq(a.objetivos, 0, 'ni objetivos (apartado 15)');
  eq(a.diarios, 0, 'ni diario');
  eq(a.calendarios, 0, 'ni calendario');
  eq(a.papelerasNuevas, 0, 'y cero papeleras (apartado 17)');
  eq(a.datosGuardados, 2, '⚠️ y lo que guarda son dos cosas, las dos suyas');

  const fuente = readFileSync(new URL('../src/lib/pantallaEH.js', import.meta.url), 'utf8');
  ok(!/from '\.\/calendario|from '\.\/diario|from '\.\/motorProductos/.test(fuente),
    '⚠️ el archivo no importa nada del calendario, el diario ni los productos');
  ok(!/\bpedirIA|askAI|anthropic/i.test(fuente), 'y no llama a la IA');
}

/* ===========================================================================
   Test 9 — PERSISTENCIA (prueba 16)
   =========================================================================== */
console.log('\nTest 9 — persistencia');
{
  const e = alternarAcceso(con(['skincare', 'perfumes']), 'rutina_facial');
  const antes = datosPantalla(e);
  const despues = normalizarPantalla(JSON.parse(JSON.stringify(antes)));
  eq(despues, antes, '⚠️ guardar y volver a leer devuelve lo mismo (regla 5)');
  Object.keys(DEFAULT_PANTALLA).forEach((k) => {
    ok(k in despues, `el campo "${k}" sobrevive al normalizador`);
  });
  eq(normalizarPantalla(null), DEFAULT_PANTALLA, 'un guardado corrupto cae en el defecto');
  eq(normalizarPantalla({ accesos: ['fantasma'] }).accesos, [],
    '⚠️ un acceso de una versión anterior del catálogo no revive');
  eq(normalizarPantalla({ verAccesos: false }).verAccesos, false, 'y se respeta lo que él apagó');

  /* ⚠️ Comparte sitio con el interruptor de "Mi estilo" de la F29, y no se pisan. */
  const conMiEstilo = normalizarEstiloHombre(e).modulos.find((m) => m.id === MODULO_ANFITRION);
  ok('pantalla' in conMiEstilo.config, 'lo de esta fase se guarda en el módulo anfitrión');
  eq(miEstiloOculto(e), false, '⚠️ y no toca el interruptor de la Fase 29');
}

/* ===========================================================================
   Test 10 — RESUMEN, PANEL Y TEXTOS
   =========================================================================== */
console.log('\nTest 10 — el panel que dibuja la pantalla');
{
  const e = alternarAcceso(con(['skincare', 'pelo', 'estilo', 'perfumes', 'gustos']), 'rutina_facial');
  const p = panelPantalla(e, { armario: ARM });
  eq(p.secciones.length, 3, 'el panel trae sus tres secciones');
  eq(p.accesos.length, 1, 'el acceso que eligió');
  ok(p.accesosDisponibles.length >= 1, 'y los que puede elegir');
  eq(p.verAccesos, true, 'con la zona encendida');
  ok(Array.isArray(p.paraAnadir), 'lo que puede añadir');
  eq(p.inicial, null, 'y sin vacío inicial, porque tiene módulos');

  const r = resumenPantalla(e, { armario: ARM });
  eq(r.secciones, 3, 'el resumen cuenta las secciones');
  eq(r.modulos, 5, 'y los módulos');
  eq(r.accesos, 1, 'los accesos');
  eq(r.vacio, false, 'y dice que no está vacío');
  eq(resumenPantalla(nuevo(), { armario: ARM }).vacio, true, 'con nada, sí');

  ok(textosDePantalla().length > 8, 'los textos se pueden barrer');
  ok(textosDePantalla().every((t) => typeof t === 'string' && t.length > 0), 'ninguno está vacío');
  ok(!textosDePantalla().some((t) => /debes|tienes que|obligatorio/i.test(t)),
    'y ninguno le manda');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
