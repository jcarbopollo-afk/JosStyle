// ============================================================================
// SO · Fase 4/5 — Pruebas de la biblioteca sonora definida
//
// ⚠️ Esta fase NO crea sonidos, y no puede: no hay ni un archivo de audio en el
// proyecto. Lo que define es **la especificación de cada uno**, y eso sí se
// puede comprobar entero:
//
//   1. Que las duraciones **no se contradicen** (un `ui_click` no puede durar
//      lo que un logro).
//   2. Que **los importantes son únicos** y los repetitivos llevan variantes.
//   3. Que el validador **caza un archivo que no cumple**.
//   4. Que `queFalta()` dice la verdad: hoy faltan todos.
// ============================================================================

import {
  FAMILIAS, familia, TRAMOS, CARACTER, EVITAR, FIRMA, CON_FIRMA,
  CARPETA, RUTA_WEB, FORMATO, MAX_KB, ARCHIVOS, fichaDe, nombresDe, listaDeArchivos,
  duracionDe, validarArchivo, queFalta, briefing, resumenBiblioteca,
} from '../src/lib/especificacionSonidos.js';
import { CATALOGO } from '../src/lib/audioEventos.js';
import { readdirSync } from 'node:fs';

/* 🚨 Los archivos que hay DE VERDAD en el disco, no una lista escrita a mano.
   Así este test no puede decir "hay tres sonidos" cuando no hay ninguno. */
const PRESENTES = (() => {
  try {
    return readdirSync(new URL(`../${CARPETA}/`, import.meta.url)).filter((f) => f.endsWith(`.${FORMATO}`));
  } catch {
    return []; // la carpeta no existe todavía: cero archivos, que es la verdad
  }
})();

let fallos = 0;
function comprobar(nombre, condicion, detalle = '') {
  if (condicion) { console.log(`  ✓ ${nombre}`); return; }
  fallos++;
  console.log(`  ✗ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
}

/* ===========================================================================
   FAMILIAS Y DURACIONES
   =========================================================================== */
console.log('\n═══ Familias y duraciones ═══\n');
{
  comprobar('CRITERIO · Están las ocho familias del enunciado', FAMILIAS.length === 8);
  comprobar('CLAVE · Cada familia apunta a una categoría del motor de SO F1',
    FAMILIAS.every((f) => ['ui', 'feedback', 'streak', 'achievement'].includes(f.categoria)));
  comprobar('CRITERIO · Están los cinco tramos de duración', TRAMOS.length === 5);
  comprobar('CLAVE · Y ninguno está al revés', TRAMOS.every((t) => t.min < t.max));
  comprobar('Una familia inventada no revienta', familia('zzz') === null);

  comprobar('⚠️ CLAVE · La familia manda sobre el tramo cuando es más estricta',
    duracionDe({ familia: 'ui', tramo: 'feedback' }).maxMs === 150);
  comprobar('⚠️ CLAVE · ...que es lo que impide un `ui_click` de 300 ms, que se pisaría con el siguiente toque',
    duracionDe(fichaDe('ui_click')).maxMs <= 150);
  comprobar('CLAVE · Y un gran logro sí puede durar hasta 2 segundos',
    duracionDe(fichaDe('grand_achievement')).maxMs === 2000);
  comprobar('⚠️ CLAVE · NINGÚN sonido tiene un rango imposible (mínimo mayor que máximo)',
    listaDeArchivos().every((a) => a.minMs <= a.maxMs),
    listaDeArchivos().filter((a) => a.minMs > a.maxMs).map((a) => a.nombre).join(', '));
}

/* ===========================================================================
   EL CARÁCTER Y LA FIRMA
   =========================================================================== */
console.log('\n═══ El carácter y la firma sonora ═══\n');
{
  comprobar('CRITERIO · Está el carácter que pide el enunciado', CARACTER.length === 7);
  comprobar('CRITERIO · Y lo que hay que evitar', EVITAR.length === 6);
  comprobar('CLAVE · Están aquí como datos, no como comentario: es lo que se entrega',
    Array.isArray(CARACTER) && Array.isArray(EVITAR));

  comprobar('CRITERIO · Existe la firma sonora', FIRMA.notas >= 2 && FIRMA.notas <= 4);
  comprobar('⚠️ CLAVE · Definida como INTERVALOS, no como notas: se transporta y sigue reconociéndose',
    Array.isArray(FIRMA.intervalos) && FIRMA.intervalos[0] === 0);
  comprobar('CRITERIO · Con sus evoluciones, de menor a mayor', FIRMA.evoluciones.length === 5);
  comprobar('⚠️ CLAVE · Se llama de JosStyle, no del nombre histórico (D2-08)',
    FIRMA.nombre.includes('JosStyle') && !/JC (Lifestyle|Fitness)/.test(FIRMA.nombre));

  comprobar('CRITERIO · La firma aparece en los ocho sonidos que enumera el enunciado', CON_FIRMA.length === 8);
  comprobar('CLAVE · Incluidos el récord, el gran logro y los 365 días',
    CON_FIRMA.includes('personal_record') && CON_FIRMA.includes('grand_achievement') && CON_FIRMA.includes('streak_milestone_365'));
}

/* ===========================================================================
   VARIANTES Y ÚNICOS
   =========================================================================== */
console.log('\n═══ Variantes y sonidos únicos ═══\n');
{
  comprobar('CRITERIO · Los que se repiten mucho llevan variantes', fichaDe('ui_click').variantes === 3);
  comprobar('CLAVE · ...con el nombre numerado', nombresDe('ui_click').join() === `ui_click_01.${FORMATO},ui_click_02.${FORMATO},ui_click_03.${FORMATO}`);
  comprobar('CLAVE · Y uno solo no lleva número', nombresDe('level_up')[0] === `level_up.${FORMATO}`);

  // ⚠️ La lista literal del enunciado.
  const unicos = ARCHIVOS.filter((a) => a.unico).map((a) => a.id);
  comprobar('⚠️ CRITERIO · `level_up` es único', unicos.includes('level_up'));
  comprobar('⚠️ CRITERIO · `personal_record` es único', unicos.includes('personal_record'));
  comprobar('⚠️ CRITERIO · `grand_achievement` es único', unicos.includes('grand_achievement'));
  comprobar('⚠️ CRITERIO · Y los 365 días', unicos.includes('streak_milestone_365'));
  comprobar('⚠️ CLAVE · NINGÚN sonido único tiene variantes: un récord con tres deja de ser un momento',
    ARCHIVOS.filter((a) => a.unico).every((a) => a.variantes === 1));

  comprobar('CLAVE · Los milestones pequeños NO son únicos: pueden compartir carácter',
    fichaDe('streak_milestone_03').unico === false);
  comprobar('CLAVE · ...pero los grandes sí', fichaDe('streak_milestone_100').unico === true);
}

/* ===========================================================================
   LA LISTA DE ARCHIVOS
   =========================================================================== */
console.log('\n═══ La lista de archivos ═══\n');
{
  const lista = listaDeArchivos();
  comprobar('Hay lista de archivos', lista.length > ARCHIVOS.length);
  /* 🐛 La ruta que consume `fetch()` NO lleva `public/`: en Vite, lo que está en
     `public/` se sirve desde la raíz. Estuvo mal desde la SO F4 y no saltó
     porque no había ni un archivo que cargar — lo destapó el primer MP3 de
     verdad. Estas tres líneas son ese fallo convertido en prueba. */
  comprobar('CLAVE · Cada uno con su ruta web', lista.every((a) => a.ruta.startsWith(`${RUTA_WEB}/`)));
  comprobar('🚨 CLAVE · Y ninguna lleva "public/": el navegador no lo ve',
    lista.every((a) => !a.ruta.includes('public/')));
  comprobar('CLAVE · Y aparte, dónde va en disco', lista.every((a) => a.enDisco.startsWith(`${CARPETA}/`)));
  comprobar('CLAVE · ...y su rango de duración', lista.every((a) => a.minMs > 0 && a.maxMs > 0));
  comprobar('⚠️ CLAVE · Ningún nombre repetido', new Set(lista.map((a) => a.nombre)).size === lista.length);

  // ⚠️ Que la especificación y el catálogo de SO F3 no se separen.
  const sinFicha = Object.keys(CATALOGO)
    .filter((id) => CATALOGO[id].motor)          // los que hoy puede emitir alguien
    .filter((id) => !fichaDe(id));
  comprobar('⚠️ CLAVE · TODO evento que hoy puede sonar tiene su archivo definido',
    sinFicha.length === 0, sinFicha.join(', '));
  comprobar('CLAVE · Y ninguna ficha inventa un sonido que no está en el catálogo',
    ARCHIVOS.every((a) => !!CATALOGO[a.id]),
    ARCHIVOS.filter((a) => !CATALOGO[a.id]).map((a) => a.id).join(', '));
}

/* ===========================================================================
   EL VALIDADOR
   =========================================================================== */
console.log('\n═══ El validador ═══\n');
{
  comprobar('Un archivo correcto pasa',
    validarArchivo({ nombre: `success.${FORMATO}`, duracionMs: 200, tamanoKb: 12 }).valido === true);

  comprobar('⚠️ CLAVE · Uno demasiado largo se caza',
    validarArchivo({ nombre: `ui_click_01.${FORMATO}`, duracionMs: 900 }).problemas.some((p) => /largo/.test(p)));
  comprobar('CLAVE · Y uno demasiado corto',
    validarArchivo({ nombre: `grand_achievement.${FORMATO}`, duracionMs: 100 }).problemas.some((p) => /corto/.test(p)));
  comprobar('CLAVE · Uno que pesa demasiado también',
    validarArchivo({ nombre: `success.${FORMATO}`, duracionMs: 200, tamanoKb: 500 }).problemas.some((p) => /Pesa/.test(p)));
  comprobar('CLAVE · Un formato que no toca se rechaza',
    validarArchivo({ nombre: 'success.wav', duracionMs: 200 }).valido === false);
  comprobar('CLAVE · Y un nombre que no está en la lista', validarArchivo({ nombre: `zzz.${FORMATO}` }).valido === false);

  comprobar('⚠️ CLAVE · Una VARIANTE de un sonido único se rechaza',
    validarArchivo({ nombre: `personal_record_02.${FORMATO}`, duracionMs: 1200 }).problemas.some((p) => /único/.test(p)));
  comprobar('CLAVE · ...pero el único sin número pasa',
    validarArchivo({ nombre: `personal_record.${FORMATO}`, duracionMs: 1200, tamanoKb: 30 }).valido === true);
  comprobar('CLAVE · Y una variante de uno que SÍ las admite pasa',
    validarArchivo({ nombre: `ui_click_02.${FORMATO}`, duracionMs: 90, tamanoKb: 5 }).valido === true);

  comprobar('Sin duración no se juzga la duración',
    validarArchivo({ nombre: `success.${FORMATO}`, tamanoKb: 10 }).valido === true);
}

/* ===========================================================================
   QUÉ FALTA — la función más honesta
   =========================================================================== */
console.log('\n═══ Qué falta ═══\n');
{
  const nada = queFalta([]);
  comprobar('⚠️ CLAVE · Hoy FALTAN TODOS, y lo dice', nada.completo === false && nada.hay === 0);
  comprobar('CLAVE · ...con el número exacto', /Faltan \d+ de \d+/.test(nada.texto));
  comprobar('CLAVE · Y los únicos se dicen aparte: son los que más cuestan', nada.criticos.length > 0);
  comprobar('⚠️ CLAVE · Se dice POR DÓNDE EMPEZAR, que son los de interfaz',
    nada.primeros.length > 0 && nada.primeros.every((a) => a.familia === 'ui'));

  const conAlgunos = queFalta([`ui_click_01.${FORMATO}`, `ui_click_02.${FORMATO}`]);
  comprobar('CLAVE · Con algunos puestos, la cuenta baja', conAlgunos.hay === 2);
  comprobar('CLAVE · ...y esos ya no salen en lo que falta',
    !conAlgunos.faltan.some((a) => a.nombre === `ui_click_01.${FORMATO}`));

  const todos = listaDeArchivos().map((a) => a.nombre);
  comprobar('⚠️ CLAVE · Con todos puestos, se declara completo', queFalta(todos).completo === true);
  comprobar('CLAVE · ...y lo dice con esas palabras', /Están todos/.test(queFalta(todos).texto));
  comprobar('Acepta objetos además de nombres', queFalta([{ nombre: `ui_click_01.${FORMATO}` }]).hay === 1);
}

/* ===========================================================================
   EL BRIEFING Y EL RESUMEN
   =========================================================================== */
console.log('\n═══ El briefing y el resumen ═══\n');
{
  const b = briefing();
  comprobar('⚠️ CLAVE · Existe el briefing: es lo que se le da a quien produzca los sonidos',
    !!b.firma && !!b.caracter && b.archivos.length > 0);
  comprobar('CLAVE · Con el formato, el peso máximo y la carpeta', b.formato === FORMATO && b.maxKb === MAX_KB && b.carpeta === CARPETA);
  comprobar('CLAVE · Y lo que hay que evitar', b.evitar.length === 6);

  const r = resumenBiblioteca([]);
  comprobar('El resumen cuenta los sonidos y los archivos', r.sonidos === ARCHIVOS.length && r.total > r.sonidos);
  comprobar('...cuántos llevan variantes y cuántos son únicos', r.conVariantes > 0 && r.unicos > 0);
  comprobar('...y el reparto por familia', r.porFamilia.length === 8);
}

/* 🚨 Esto decía "NO HAY NI UN ARCHIVO DE AUDIO" y que en cuanto los hubiera
   sonarían "sin tocar una línea". Lo primero dejó de ser verdad el 2026-09-04,
   cuando Josué produjo `ui_click_01.mp3` en FL Studio. Y lo segundo era
   directamente falso: la ruta llevaba `public/`, que el navegador no ve, así que
   el primer archivo de verdad habría dado 404. Se cuenta lo que hay. */
{
  const hechos = queFalta([]).total - queFalta(PRESENTES).faltan.length;
  console.log(`\n  ⚠️ Hay ${hechos} de ${queFalta([]).total} archivos producidos. Esta fase DEFINE la biblioteca;`);
  console.log('     los sonidos los hace Josué en FL Studio, uno a uno.');
  console.log('     🐛 Y el primero destapó que la ruta llevaba "public/", que el navegador no');
  console.log('     ve: habría dado 404. Arreglado y con prueba propia más arriba.\n');
}

if (fallos) { console.log(`  ${fallos} fallo(s).\n`); process.exit(1); }
console.log('  Todo correcto.\n');
