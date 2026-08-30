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
import {
  subirModulo, modulosAgrupados, recomendados, moverA, avisoDesactivar,
} from '../src/lib/gestionModulos.js';
import { configurarPerfumes } from '../src/lib/perfumes.js';
import { anadirProductoPiel } from '../src/lib/perfilPiel.js';
import { MODULO_ANFITRION, miEstiloOculto } from '../src/lib/miEstilo.js';
import {
  CABECERA_EH, TEXTOS_PANTALLA, seccionesDePantalla, GRUPOS_DEL_ENUNCIADO,
  ACCESOS_DISPONIBLES, accesoRapido, accesosDisponibles, DEFAULT_PANTALLA,
  normalizarPantalla, datosPantalla, alternarAcceso, alternarVerAccesos, accesosActivos,
  MAX_PRIMERAS_OPCIONES, PRIMERAS_OPCIONES, empiezaPorLoQueQuieras, paraAnadir,
  resumenPantalla, auditarPantalla, textosDePantalla, panelPantalla,
  // ── EH F31 ──
  TAMANOS_PLAQUITA, TAMANO_POR_DEFECTO, tamanoPlaquita, tamanoDe, cambiarTamano,
  LINEAS_DE_PLAQUITA, lineasDisponibles, lineasPorDefecto, lineasActivas, alternarLinea,
  contenidoDePlaquita, SIN_LINEAS, MAX_ACCESOS_VISIBLES, accesosVisibles,
  TEXTOS_RESTABLECER, restablecerDiseno, CRITERIO_AUTOMATICO, TEXTOS_AUTOMATICO,
  personalizarAutomaticamente, TEXTOS_MOVER, panelPersonalizar,
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
  /* ⚠️ **Por su nombre, no por una cuenta.** La F31 añadió `tamanos` y
     `contenido` con todo el derecho, y una cifra exacta habría saltado por algo
     que estaba bien: es la cuarta vez que pasa en este bloque. */
  ['accesos', 'verAccesos'].forEach((k) => {
    ok(a.datosGuardados.includes(k), `guarda "${k}", que es suyo`);
  });
  eq(a.datosGuardados, Object.keys(DEFAULT_PANTALLA),
    '⚠️ y lo que guarda es exactamente lo que declara el defecto');

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

/* ###########################################################################
   EH · Fase 31/65 — PERSONALIZACIÓN PROFUNDA DE LAS PLAQUITAS
   ###########################################################################
   Las catorce pruebas del apartado 18, y lo que gobierna la fase:
     · el apartado 12: tocar la plaquita de Skincare NO toca a Skincare
     · ocultar y volver no pierde nada (apartados 8 y 13)
     · restablecer NO reactiva lo que él apagó
     · sin `confirmado` no escribe ninguno de los dos
     · y no se finge un "uso reciente" que no se guarda en ningún sitio
   ########################################################################### */

console.log('\n\n🎛️   EH · Fase 31/65 — Personalización profunda de las plaquitas\n');

/* ===========================================================================
   Test 11 — ⚠️ NADA NUEVO PARA MOVER, OCULTAR NI CONFIRMAR (apartados 1, 2, 3, 9 y 16)
   =========================================================================== */
console.log('Test 11 — ⚠️ lo que ya existía, no se repite');
{
  const e = con(['estilo', 'perfumes', 'skincare']);

  // Apartado 3 — *"mantener pulsada una plaquita y moverla"*: `moverA` de la F2.
  eq(modulosActivos(moverA(e, 'skincare', 0)).map((m) => m.id),
    ['skincare', 'estilo', 'perfumes'],
    '⚠️ mover a una posición es `moverA()` de la Fase 2 (prueba 1)');
  eq(modulosActivos(moverA(e, 'estilo', 99)).map((m) => m.id),
    ['perfumes', 'skincare', 'estilo'],
    'y un índice imposible se queda en el borde, no rompe nada');
  ok(TEXTOS_MOVER.mover.includes('Mover'), 'la pantalla lo ofrece con ese nombre');
  ok(TEXTOS_MOVER.eligiendo.includes('dónde'), 'y dice qué hacer después de pulsarlo');

  // Apartado 2 — 👁️ Ocultar es `alternarModulo`, y apartado 16 su confirmación.
  const sinPiel = alternarModulo(e, 'skincare', false);
  ok(!modulosActivos(sinPiel).some((m) => m.id === 'skincare'),
    '⚠️ ocultar es `alternarModulo` de la Fase 2 (prueba 2)');
  const aviso = avisoDesactivar(e, 'skincare', { tieneDatos: () => true });
  ok(!!aviso && aviso.texto.includes('no se eliminarán'),
    '⚠️ y el aviso del apartado 16 ya existía, con su *"tus datos no se eliminarán"*');

  // Apartado 9 — "+ Añadir apartado" trae los ocultos.
  ok(paraAnadir(sinPiel).some((m) => m.id === 'skincare'),
    '⚠️ y desde "+ Añadir apartado" vuelve a aparecer (prueba 3)');

  /* ⚠️ Y esta fase NO declara su propio orden ni su propio interruptor. */
  const fuente = readFileSync(new URL('../src/lib/pantallaEH.js', import.meta.url), 'utf8');
  const sinComentarios = fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  ok(!/function\s+(subir|bajar|ocultar)Modulo/.test(sinComentarios),
    '⚠️ el archivo no redefine subir, bajar ni ocultar (D2-07)');
  eq(auditarPantalla(e).listasDeOrden, 0, 'y la auditoría lo dice: cero listas de orden');
}

/* ===========================================================================
   Test 12 — TAMAÑO (apartado 4 · prueba 4)
   =========================================================================== */
console.log('\nTest 12 — tres tamaños, y solo tres');
{
  const e = con(['skincare', 'perfumes']);
  eq(TAMANOS_PLAQUITA.map((t) => t.id), ['pequena', 'mediana', 'grande'],
    'los tres del enunciado, en ese orden');
  eq(TAMANOS_PLAQUITA.length, 3,
    '⚠️ y NINGUNO más: *"no permitir tamaños completamente libres"*');
  ok(TAMANOS_PLAQUITA.every((t) => t.columnas >= 1 && t.columnas <= 2),
    'cada uno declara sus columnas, así que la pantalla no improvisa');
  eq(tamanoPlaquita('grande').columnas, 2, 'la grande ocupa las dos');
  eq(tamanoPlaquita('pequena').conLineas, false, 'y la pequeña se queda sin líneas');

  eq(tamanoDe(e, 'skincare').id, TAMANO_POR_DEFECTO, 'de partida, mediana');
  const grande = cambiarTamano(e, 'skincare', 'grande');
  eq(tamanoDe(grande, 'skincare').id, 'grande', 'se puede cambiar (prueba 4)');
  eq(tamanoDe(grande, 'perfumes').id, 'mediana', '⚠️ y solo cambia esa plaquita');

  eq(datosPantalla(cambiarTamano(grande, 'skincare', 'inventado')).tamanos, { skincare: 'grande' },
    '⚠️ un tamaño que no existe NO se escribe: no se rompe el diseño');
  eq(tamanoDe(normalizarPantalla({ tamanos: { skincare: 'gigante' } }) && cambiarTamano(e, 'skincare', 'gigante'), 'skincare').id,
    'mediana', 'y uno inventado cae en mediana');
  eq(normalizarPantalla({ tamanos: { fantasma: 'grande' } }).tamanos, {},
    'un módulo que ya no existe tampoco sobrevive');

  eq(datosPantalla(cambiarTamano(grande, 'skincare', 'mediana')).tamanos, {},
    '⚠️ volver al defecto QUITA la excepción, no guarda una copia de la norma');

  const sec = seccionesDePantalla(grande, { armario: ARM });
  const piel = sec.flatMap((s) => s.modulos).find((m) => m.id === 'skincare');
  eq(piel.tamano.id, 'grande', 'y la pantalla recibe el tamaño ya resuelto');
}

/* ===========================================================================
   Test 13 — CONTENIDO (apartado 5 · prueba 5)
   =========================================================================== */
console.log('\nTest 13 — qué información aparece dentro');
{
  const e = con(['skincare', 'perfumes', 'gustos']);

  // Las cuatro del ejemplo del enunciado, con sus nombres.
  eq(lineasDisponibles('skincare').map((l) => l.nombre),
    ['Rutina actual', 'Próximo recordatorio', 'Productos', 'Estadísticas'],
    '⚠️ las cuatro del ejemplo del apartado 5, con sus nombres');
  eq(lineasDisponibles('skincare').filter((l) => l.principal).length, 1,
    'una sola principal por módulo');
  eq(lineasActivas(e, 'skincare'), ['rutina'],
    '⚠️ de fábrica, SOLO la principal: las extras vienen apagadas (F30, apartado 8)');
  eq(auditarPantalla(e).lineasExtraPorDefecto, 0,
    'y la auditoría lo comprueba en todos los módulos a la vez');

  const conProductos = alternarLinea(e, 'skincare', 'productos');
  eq(lineasActivas(conProductos, 'skincare'), ['rutina', 'productos'],
    'él puede encender una extra (prueba 5)');
  eq(lineasActivas(alternarLinea(conProductos, 'skincare', 'productos'), 'skincare'), ['rutina'],
    'y volver a apagarla');
  eq(lineasActivas(conProductos, 'perfumes'), ['coleccion'],
    '⚠️ y no toca las de otra plaquita');

  const sinNada = alternarLinea(e, 'skincare', 'rutina');
  eq(lineasActivas(sinNada, 'skincare'), [],
    '⚠️ puede quitarlas TODAS: es una decisión suya');
  eq(datosPantalla(sinNada).contenido.skincare, [],
    '⚠️ y se guarda una lista vacía, no un hueco: apagado y sin tocar son dos cosas');
  eq(contenidoDePlaquita(sinNada, 'skincare', { armario: ARM }), [],
    'así que la plaquita se queda sin líneas');

  eq(lineasActivas(alternarLinea(e, 'skincare', 'inventada'), 'skincare'), ['rutina'],
    'una línea que no existe no se enciende');
  eq(normalizarPantalla({ contenido: { skincare: ['fantasma', 'rutina'] } }).contenido.skincare,
    ['rutina'], '⚠️ y una guardada de otra versión no revive');

  /* ⚠️ Regla 8 — un módulo sin pantalla propia NO enseña casillas vacías.
     ⚠️ Y el módulo de ejemplo se PREGUNTA AL CATÁLOGO: aquí ponía `cuerpo`, la
     F18 le dio su pantalla y sus líneas, y esta comprobación saltó **con algo
     que estaba bien**. Es la lección de siempre. */
  const sinPantalla = MODULOS_EH.map((m) => m.id).find((id) => !LINEAS_DE_PLAQUITA[id]);
  ok(!!sinPantalla, 'hay algún módulo que todavía no tiene pantalla propia');
  eq(lineasDisponibles(sinPantalla), [], 'un módulo sin pantalla todavía no tiene líneas');
  const panel = panelPersonalizar(con([sinPantalla]), { armario: ARM });
  eq(panel.modulos[0].sinLineas, SIN_LINEAS, '⚠️ y se dice, en vez de dejarlo en blanco');
  ok(!/pr[oó]ximamente/i.test(SIN_LINEAS), 'sin prometer nada');

  // La pequeña no pinta líneas, por definición (apartado 4).
  eq(contenidoDePlaquita(cambiarTamano(conProductos, 'skincare', 'pequena'), 'skincare', { armario: ARM }),
    [], '⚠️ la plaquita pequeña se queda solo con icono y nombre');
  eq(lineasActivas(cambiarTamano(conProductos, 'skincare', 'pequena'), 'skincare'),
    ['rutina', 'productos'],
    '⚠️ pero sin perder lo que había elegido: al agrandarla, vuelve');
}

/* ===========================================================================
   Test 14 — ⚠️ EL APARTADO 12: NO AFECTAR A OTROS MÓDULOS
   =========================================================================== */
console.log('\nTest 14 — ⚠️ tocar la plaquita de Skincare NO toca a Skincare (prueba 14)');
{
  /* Un Skincare con datos de verdad, para que se note si algo se los lleva. */
  const base = anadirProductoPiel(con(['skincare', 'perfumes']), 'Crema hidratante').estado;
  const configDe = (est, id) => normalizarEstiloHombre(est).modulos.find((m) => m.id === id).config;
  const antes = JSON.stringify(configDe(base, 'skincare'));

  const tocada = alternarLinea(cambiarTamano(base, 'skincare', 'grande'), 'skincare', 'productos');
  eq(JSON.stringify(configDe(tocada, 'skincare')), antes,
    '⚠️ *"solo cambia su representación… NO modifica la configuración interna de Skincare"*');
  eq(configDe(tocada, MODULO_ANFITRION).pantalla.tamanos, { skincare: 'grande' },
    '⚠️ lo de la presentación vive en el almacén de la pantalla, no en el módulo');
  eq(configDe(tocada, MODULO_ANFITRION).pantalla.contenido, { skincare: ['rutina', 'productos'] },
    'y el contenido, en el mismo sitio');
  eq(auditarPantalla(base).escrituraEnOtrosModulos, 0,
    'la auditoría: cero escrituras en la config de otro módulo');

  /* Y lo mismo con Perfumes, para que no sea un caso suelto. */
  const antesPerf = JSON.stringify(configDe(base, 'perfumes'));
  const tocada2 = cambiarTamano(base, 'perfumes', 'pequena');
  eq(JSON.stringify(configDe(tocada2, 'perfumes')), antesPerf, 'igual con Perfumes');

  /* ⚠️ Y el código no llama a `guardarConfig` sobre nada que no sea el anfitrión. */
  const fuente = readFileSync(new URL('../src/lib/pantallaEH.js', import.meta.url), 'utf8');
  const llamadas = fuente.match(/guardarConfig\(([^)]*)\)/g) || [];
  ok(llamadas.every((l) => l.includes('MODULO_ANFITRION')),
    '⚠️ y en el código, `guardarConfig` solo se llama sobre el módulo anfitrión');
}

/* ===========================================================================
   Test 15 — OCULTAR NO BORRA (apartados 8 y 13 · pruebas 2, 3 y 9)
   =========================================================================== */
console.log('\nTest 15 — ⚠️ *"los datos siguen existiendo"*');
{
  const e = alternarLinea(cambiarTamano(con(['skincare', 'perfumes']), 'skincare', 'grande'),
    'skincare', 'estadisticas');
  const oculto = alternarModulo(e, 'skincare', false);
  eq(datosPantalla(oculto).tamanos, { skincare: 'grande' },
    '⚠️ ocultar la plaquita NO borra su tamaño (apartado 8)');
  eq(datosPantalla(oculto).contenido.skincare, ['rutina', 'estadisticas'],
    'ni su contenido');
  const vuelve = alternarModulo(oculto, 'skincare', true);
  eq(tamanoDe(vuelve, 'skincare').id, 'grande',
    '⚠️ y al volver a mostrarla, está como la dejó (pruebas 3 y 9)');
  eq(lineasActivas(vuelve, 'skincare'), ['rutina', 'estadisticas'], 'con sus líneas');

  ok(TEXTOS_PANTALLA.ocultarNoBorra.includes('no borra'),
    'y la pantalla lo dice antes de que lo pruebe');
  // Apartado 13 — eliminar de verdad es la papelera global, que aquí no se toca.
  eq(auditarPantalla(e).papelerasNuevas, 0, '⚠️ y eliminar sigue siendo la papelera global');
}

/* ===========================================================================
   Test 16 — LÍMITE DE ACCESOS RÁPIDOS (apartado 7 · pruebas 6 y 7)
   =========================================================================== */
console.log('\nTest 16 — ⚡ *"no permitir crear 50 accesos rápidos"*');
{
  const e = con(['skincare', 'barba', 'perfumes', 'pelo', 'estilo', 'gustos']);
  eq(accesosVisibles(e).lista, [], 'sin accesos elegidos, ninguno (prueba 7)');

  let conAccesos = e;
  ['rutina_facial', 'afeitarme', 'elegir_perfume', 'mi_pelo'].forEach((id) => {
    conAccesos = alternarAcceso(conAccesos, id);
  });
  const cuatro = accesosVisibles(conAccesos);
  eq(cuatro.lista.length, 4, 'cuatro caben enteros (prueba 6)');
  eq(cuatro.hayMas, false, 'y no hace falta "Mostrar todos"');

  const seis = alternarAcceso(alternarAcceso(conAccesos, 'que_me_pongo'), 'mis_gustos');
  const v = accesosVisibles(seis);
  eq(v.lista.length, MAX_ACCESOS_VISIBLES, '⚠️ pasado el límite, se pintan los que caben');
  eq(v.ocultos, 2, 'y se dice cuántos quedan detrás');
  eq(v.hayMas, true, 'con su "Mostrar todos"');
  eq(v.total, 6, '⚠️ sin perder ninguno: solo no se pintan');
  eq(accesosVisibles(seis, { todos: true }).lista.length, 6,
    'y con "Mostrar todos" salen los seis');
  ok(TEXTOS_PANTALLA.mostrarTodos === 'Mostrar todos', 'el texto es el del enunciado');

  eq(accesosVisibles(alternarVerAccesos(seis)), null,
    '⚠️ con la zona apagada, `null`: apagada y vacía son dos cosas');
  eq(panelPantalla(seis, { armario: ARM }).visibles.hayMas, true, 'y el panel lo trae');
}

/* ===========================================================================
   Test 17 — RESTABLECER DISEÑO (apartado 10 · prueba 8)
   =========================================================================== */
console.log('\nTest 17 — 🔄 restablecer, con permiso');
{
  const e = con(['estilo', 'perfumes', 'skincare']);
  const tocado = alternarAcceso(
    alternarLinea(cambiarTamano(moverA(e, 'skincare', 0), 'skincare', 'grande'), 'skincare', 'productos'),
    'rutina_facial',
  );
  eq(modulosActivos(tocado).map((m) => m.id)[0], 'skincare', 'de partida, todo cambiado');

  // ⚠️ Décimo `aplicarPlan`: sin confirmar, NO escribe.
  const sinConfirmar = restablecerDiseno(tocado);
  eq(sinConfirmar.aplicado, false, '⚠️ sin `confirmado` no hace nada');
  eq(sinConfirmar.estado, normalizarEstiloHombre(tocado), 'y devuelve el estado tal cual');
  eq(sinConfirmar.aviso.pregunta, '¿Quieres recuperar la distribución predeterminada?',
    'con la pregunta literal del enunciado');
  eq(sinConfirmar.aviso.noBorra, 'Esto no elimina datos.', 'y su *"esto no elimina datos"*');
  eq([sinConfirmar.aviso.cancelar, sinConfirmar.aviso.confirmar], ['Cancelar', 'Restablecer'],
    'con las dos opciones que pide');

  const hecho = restablecerDiseno(tocado, { confirmado: true });
  eq(hecho.aplicado, true, 'confirmando, sí (prueba 8)');
  eq(datosPantalla(hecho.estado).tamanos, {}, 'los tamaños vuelven a lo de fábrica');
  eq(datosPantalla(hecho.estado).contenido, {}, 'el contenido también');
  eq(datosPantalla(hecho.estado).accesos, [], 'y los accesos');
  eq(modulosActivos(hecho.estado).map((m) => m.id), ['estilo', 'skincare', 'perfumes'],
    'y el orden vuelve al del catálogo');

  /* ⚠️ Lo que NO hace: reactivar lo que él apagó. */
  const apagado = alternarModulo(tocado, 'perfumes', false);
  const tras = restablecerDiseno(apagado, { confirmado: true }).estado;
  ok(!modulosActivos(tras).some((m) => m.id === 'perfumes'),
    '⚠️ restablecer NO reactiva lo que él quitó: eso lo decidió él');
  ok(TEXTOS_RESTABLECER.noReactiva.includes('siguen quitados'),
    'y la pantalla lo dice antes de pulsar');

  /* Y no toca los datos de ningún módulo (el *"esto no elimina datos"*). */
  const cfg = (est, id) => JSON.stringify(normalizarEstiloHombre(est).modulos.find((m) => m.id === id).config);
  eq(cfg(hecho.estado, 'skincare'), cfg(tocado, 'skincare'),
    '⚠️ y la config de Skincare sale intacta: restablecer es de diseño');
}

/* ===========================================================================
   Test 18 — PERSONALIZAR AUTOMÁTICAMENTE (apartado 17)
   =========================================================================== */
console.log('\nTest 18 — ✨ *"solo si el usuario lo solicita"*');
{
  /* Perfumes configurado, Skincare no, y uno que todavía no tiene pantalla. */
  /* ⚠️ `configurarPrimeraVez` numera por el ORDEN DE LA LISTA que se le pasa,
     no por el del catálogo: es la lección de la F30. Así que se parte de lo
     vacío arriba del todo, que es justo lo que esta función tiene que arreglar.
     ⚠️ Y el tercero se PREGUNTA AL CATÁLOGO: aquí ponía `cuerpo`, y la F18 le
     dio pantalla, así que las dos comprobaciones del orden saltaron con algo
     que estaba bien. */
  const nadaAun = MODULOS_EH.map((m) => m.id).find((id) => !LINEAS_DE_PLAQUITA[id]);
  const e = configurarPerfumes(con([nadaAun, 'skincare', 'perfumes']), { hoy: HOY }).estado;
  eq(modulosActivos(e).map((m) => m.id), [nadaAun, 'skincare', 'perfumes'],
    'de partida, lo vacío arriba del todo');

  const sinConfirmar = personalizarAutomaticamente(e, { armario: ARM });
  eq(sinConfirmar.aplicado, false, '⚠️ undécimo `aplicarPlan`: sin `confirmado` no escribe');
  eq(sinConfirmar.estado, normalizarEstiloHombre(e), 'y el estado sale igual');
  eq(sinConfirmar.propuesta, ['perfumes', 'skincare', nadaAun], 'pero enseña lo que haría');
  eq(modulosActivos(e).map((m) => m.id), [nadaAun, 'skincare', 'perfumes'],
    '⚠️ y enseñarlo no ha movido nada');

  const hecho = personalizarAutomaticamente(e, { armario: ARM, confirmado: true });
  eq(modulosActivos(hecho.estado).map((m) => m.id), ['perfumes', 'skincare', nadaAun],
    '⚠️ lo configurado primero, lo vacío después y lo que no tiene pantalla al final');
  eq(hecho.aplicado, true, 'y se aplica');

  /* ⚠️ NO se finge un "uso reciente" que no existe. */
  eq(auditarPantalla(e).registrosDeUso, 0,
    '⚠️ no se guarda ni un registro de cuándo abrió cada módulo');
  ok(CRITERIO_AUTOMATICO.includes('No se mira cuándo abriste cada uno'),
    '⚠️ y la pantalla dice el criterio de verdad, en vez de dar a entender otro');
  const fuente = readFileSync(new URL('../src/lib/pantallaEH.js', import.meta.url), 'utf8');
  ok(!/ultimoUso|ultimaApertura|visitas|contadorDeUso/i.test(fuente),
    'ni el código guarda nada parecido');

  // Empate: se queda como estaba. Nunca se baraja lo que él ya ordenó.
  const dosIguales = con(['skincare', 'perfumes']);
  const p = personalizarAutomaticamente(dosIguales, { armario: ARM });
  eq(p.propuesta, modulosActivos(dosIguales).map((m) => m.id),
    '⚠️ con todo empatado, el orden no cambia');
  eq(p.cambia, false, 'y se dice que no hay nada que cambiar');
  eq(TEXTOS_AUTOMATICO.sinCambios, 'Ya están en ese orden.', 'con su frase');
}

/* ===========================================================================
   Test 19 — PERSISTENCIA Y PANEL (apartado 11 · pruebas 9, 10, 11, 12 y 13)
   =========================================================================== */
console.log('\nTest 19 — *"debe persistir entre sesiones y dispositivos"*');
{
  const e = alternarLinea(cambiarTamano(con(['skincare', 'perfumes']), 'skincare', 'grande'),
    'skincare', 'productos');
  const guardado = datosPantalla(e);
  const releido = normalizarPantalla(JSON.parse(JSON.stringify(guardado)));
  eq(releido, guardado,
    '⚠️ guardar y volver a leer devuelve lo mismo (pruebas 9, 10 y 11 · regla 5)');
  eq(releido.tamanos, { skincare: 'grande' }, 'el tamaño sobrevive');
  eq(releido.contenido, { skincare: ['rutina', 'productos'] }, 'y el contenido');

  const panel = panelPersonalizar(e, { armario: ARM });
  eq(panel.modulos.length, 2, 'el panel trae una fila por módulo activo');
  eq(panel.modulos[0].tamanos.length, 3, 'con los tres tamaños para elegir');
  ok(panel.modulos.every((m) => typeof m.posicion === 'number' && m.de === 2),
    'y dónde está cada uno, para poder moverlo');
  const piel = panel.modulos.find((m) => m.id === 'skincare');
  eq(piel.lineas.filter((l) => l.puesta).map((l) => l.id), ['rutina', 'productos'],
    'con sus casillas marcadas');
  eq(piel.sinLineas, null, 'y sin el aviso, porque sí tiene líneas');
  eq(panel.maxAccesos, MAX_ACCESOS_VISIBLES, 'y el límite de accesos, dicho');

  /* Pruebas 12 y 13 — modo oscuro y pantalla pequeña: esto no elige colores ni
     píxeles, y por eso no puede romperlos. Se comprueba que no los toca. */
  const fuente = readFileSync(new URL('../src/lib/pantallaEH.js', import.meta.url), 'utf8');
  ok(!/#[0-9a-fA-F]{6}|COLORS/.test(fuente),
    '⚠️ ni un color aquí dentro: el tema es de `tokens.js` (prueba 12 · regla 2)');
  ok(!/\bwidth\s*:|\bpx\b/.test(fuente.replace(/\/\*[\s\S]*?\*\//g, '')),
    'ni una medida en píxeles: la pantalla pequeña la resuelve el diseño (prueba 13)');

  ok(textosDePantalla().length > 30, 'los textos nuevos también se barren');
  ok(!textosDePantalla().some((t) => /debes|tienes que|obligatorio|has fallado/i.test(t)),
    'y ninguno le manda ni le reprocha');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
