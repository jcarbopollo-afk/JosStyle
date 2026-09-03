// ============================================================================
// EH · Fase 62/65 — Accesibilidad y usabilidad avanzada
//
// *"No buscamos crear una interfaz diferente para accesibilidad. Buscamos que
// la propia interfaz principal esté bien construida desde el principio."*
//
// Lo que vigila esta prueba:
//   · que lo que hizo la F42 siga verde, sin reescribirlo
//   · que no haya alturas fijas donde va texto (lo que rompe al subir la letra)
//   · que ni una palabra técnica llegue a la pantalla
//   · y que los siete apartados que necesitan un móvil lo digan
// ============================================================================

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { REGLAS_A11Y as REGLAS_F42, AREA_TACTIL_MINIMA as AREA_F42, revisarPantalla as REVISAR_F42 } from '../src/lib/accesibilidadEH.js';
import { COLECCIONES_EH as COLECCIONES_F41 } from '../src/lib/estadosEstilo.js';
import { GESTOS as GESTOS_F61 } from '../src/lib/accionesRapidas.js';
import {
  YA_HECHO_EN_LA_F42, AREA_MINIMA,
  ALTURA_SEGURA, alturasQueCortanTexto,
  PALABRAS_TECNICAS, MENSAJES_QUE_NO_DICEN_NADA, palabrasTecnicasEnPantalla, errorSinExplicacion,
  vaciosQueNoDicenComoEmpezar, EJEMPLO_VACIO,
  SALIDAS, salidasDe,
  SIN_CONEXION, hayEstadoDeRed, reintentarEsPosible,
  GESTOS_Y_SU_ALTERNATIVA,
  PARA_JOSUE, apartadosDeJosueA11Y,
  APARTADOS_USABILIDAD, apartadoUsabilidad, apartadosAutomaticosA11Y, apartadosYaHechosA11Y,
  CONDICION, auditarUsabilidad, panelUsabilidad,
  REGLAS_A11Y, AREA_TACTIL_MINIMA, revisarPantalla, COLECCIONES_EH, GESTOS,
} from '../src/lib/usabilidad.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const VISTA = readFileSync(join(RAIZ, 'src/views/EstiloHombreView.jsx'), 'utf8');
const CSS = readFileSync(join(RAIZ, 'src/index.css'), 'utf8');

console.log('\n♿ EH · Fase 62/65 — Accesibilidad y usabilidad avanzada\n');

/* ---------------------------------------------------------------------------
   1 · LO DE LA F42 SIGUE VERDE, Y NO SE REESCRIBE
   --------------------------------------------------------------------------- */
{
  console.log('1 · La primera pasada, importada');
  eq(auditarUsabilidad(VISTA).problemasDeLaF42, [],
    '⚠️ las cinco reglas de la F42 siguen en verde sobre la vista de verdad');
  ok(REGLAS_A11Y === REGLAS_F42, '🚨 y son SUS reglas, importadas: no una segunda accesibilidad');
  eq(AREA_TACTIL_MINIMA, AREA_F42, 'el área táctil mínima es la misma');
  eq(AREA_MINIMA, 44, 'los 44 píxeles de siempre');
  ok(revisarPantalla === REVISAR_F42, 'y el revisor, el mismo');
  eq(auditarUsabilidad(VISTA).estadosSoloColor, [],
    '⚠️ y ningún estado se distingue solo por su color');
  eq(YA_HECHO_EN_LA_F42.length, 5, 'cinco apartados de éstos ya estaban hechos');
  ok(YA_HECHO_EN_LA_F42.every((y) => !!y.donde), 'cada uno diciendo dónde');
  eq(apartadosYaHechosA11Y().map((a) => a.id), [2, 3, 5, 6, 11, 17],
    'seis apartados vienen ya contestados de otras fases');
}

/* ---------------------------------------------------------------------------
   2 · 🚨 LO QUE ROMPE AL SUBIR LA LETRA (apartado 1)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · Alturas fijas donde va texto');
  eq(alturasQueCortanTexto(VISTA), [],
    '🚨 ⚠️ ni una altura fija pequeña con texto dentro: eso es lo que corta la frase');
  eq(ALTURA_SEGURA, 44, `por debajo de ${ALTURA_SEGURA} px no cabe una línea con la letra subida`);

  /* La comprobación de la comprobación. */
  ok(alturasQueCortanTexto('<div className="h-[20px]">Tu colección de perfumes</div>').length === 1,
    '⚠️ el detector caza el caso: una frase dentro de 20 px salta');
  eq(alturasQueCortanTexto('<div className="h-[2px]" />'), [],
    '…y deja pasar una rayita de 2 px, que no lleva texto');
  eq(alturasQueCortanTexto('<div className="h-[60px]">Una frase larga aquí</div>'), [],
    'y una altura holgada tampoco salta');
  eq(alturasQueCortanTexto(''), [], 'sin fuente, nada');
}

/* ---------------------------------------------------------------------------
   3 · 🚨 LAS PALABRAS (apartados 9 y 10)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Nada técnico en pantalla');
  eq(palabrasTecnicasEnPantalla(VISTA), [],
    '🚨 ⚠️ ni una palabra técnica en los textos que ve el usuario');
  ok(PALABRAS_TECNICAS.includes('null') && PALABRAS_TECNICAS.includes('token'),
    `${PALABRAS_TECNICAS.length} palabras vigiladas`);

  /* La comprobación de la comprobación: caza lo visible, no el código. */
  ok(palabrasTecnicasEnPantalla('<p>Error: token no válido</p>').length > 0,
    '⚠️ el detector caza el caso en un texto visible…');
  eq(palabrasTecnicasEnPantalla('const x = null;'), [],
    '…y NO en el código, donde `null` es lo normal');
  eq(palabrasTecnicasEnPantalla('<div aria-label="Cerrar">'), [], 'ni en una etiqueta correcta');

  /* Apartado 9 — un error tiene que decir qué corregir. */
  eq(errorSinExplicacion('Error'), true, '🚨 apartado 9 — "Error" a secas no explica nada');
  eq(errorSinExplicacion('Ups.'), true, 'ni "Ups"');
  eq(errorSinExplicacion('Falta el nombre del perfume'), false,
    '⚠️ pero decir qué falta, sí sirve');
  eq(errorSinExplicacion(null), false, 'y sin texto no hay error que juzgar');
  eq(MENSAJES_QUE_NO_DICEN_NADA.length, 5, 'con las cinco frases vacías vigiladas');
}

/* ---------------------------------------------------------------------------
   4 · LOS ESTADOS VACÍOS (apartado 15)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Estados vacíos');
  eq(vaciosQueNoDicenComoEmpezar(), [],
    '🚨 ⚠️ las colecciones dicen las TRES cosas: qué es, para qué sirve y cómo empezar');
  ok(COLECCIONES_EH === COLECCIONES_F41, 'y son las colecciones de la F41, importadas');
  ok(COLECCIONES_EH.length >= 10, `${COLECCIONES_EH.length} colecciones comprobadas`);
  ok(COLECCIONES_EH.every((c) => !!c.boton),
    '⚠️ todas con su botón: un vacío sin salida te deja mirando una pantalla vacía');
  ok(/Añadir perfume/.test(EJEMPLO_VACIO.bueno), 'con el ejemplo del enunciado');
  ok(/No hay datos/.test(EJEMPLO_VACIO.malo), 'y el que no vale');
}

/* ---------------------------------------------------------------------------
   5 · NO QUEDARSE ATRAPADO, Y LA RED (apartados 7 y 16)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · Salidas y red');
  const s = salidasDe(VISTA);
  eq(SALIDAS, ['volver', 'cerrar', 'cancelar'], 'las tres formas de salir');
  ok(s.volver >= 40, `${s.volver} botones de volver`);
  ok(s.volver + s.cerrar >= s.pantallas * 0.8,
    `⚠️ apartado 7 — ${s.volver + s.cerrar} salidas para ${s.pantallas} pantallas: ningún callejón`);
  ok(s.cancelar > 0, 'y hay dónde cancelar');

  eq(hayEstadoDeRed(), true, 'apartado 16 — el estado de sin conexión existe (F41)');
  eq(reintentarEsPosible(), true, '⚠️ y con su "Reintentar", que es lo que pide el apartado');
  eq(SIN_CONEXION.seDetecta, true, 'la falta de conexión se detecta');
  ok(/F41/.test(SIN_CONEXION.donde), 'y viene de la F41, no de aquí');
}

/* ---------------------------------------------------------------------------
   6 · LOS GESTOS, RESUELTOS POR NO EXISTIR (apartado 11)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Gestos');
  eq(GESTOS_Y_SU_ALTERNATIVA.hayGestos, false,
    '🚨 ⚠️ apartado 11 — no hay ningún gesto, así que no hace falta alternativa');
  eq(auditarUsabilidad(VISTA).gestosSinAlternativa, [], 'y ninguna acción depende de uno');
  ok(GESTOS === GESTOS_F61, 'los gestos son los de la F61, importados');
  eq(GESTOS_Y_SU_ALTERNATIVA.deLasFases, ['F50', 'F61'], 'y la decisión viene de dos fases atrás');
  ok(/Sin gesto no hace falta alternativa/.test(GESTOS_Y_SU_ALTERNATIVA.porque),
    '⚠️ es el único apartado que se cumple por NO haber construido algo');
  ok(/prefers-reduced-motion/.test(CSS), 'y el movimiento reducido sigue en el CSS (F42)');
}

/* ---------------------------------------------------------------------------
   7 · LOS SIETE QUE NECESITAN UN MÓVIL
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · Lo que necesita un móvil y unos ojos');
  eq(apartadosDeJosueA11Y(), [1, 8, 12, 13, 14, 18, 19],
    '🚨 siete apartados necesitan un teléfono de verdad');
  eq(auditarUsabilidad(VISTA).sinMotivo, [], '⚠️ y los siete dicen por qué');
  ok(/VoiceOver|TalkBack/.test(PARA_JOSUE.find((p) => p.apartado === 18).porque),
    '🚨 el orden de lectura solo lo dice un lector de pantalla en voz alta');
  ok(/ordenador de desarrollo/.test(PARA_JOSUE.find((p) => p.apartado === 14).porque),
    '⚠️ y la pantalla pequeña, con las palabras del propio apartado');
  ok(/con el móvil en la mano/.test(PARA_JOSUE.find((p) => p.apartado === 19).porque),
    'y la prueba real es, literalmente, probar');
  /* ⚠️ El 1 es mixto: el código se comprueba, verlo no. */
  eq(apartadoUsabilidad(1).como, 'mixto',
    '⚠️ el tamaño del texto es mixto: el código se comprueba, verlo sigue siendo suyo');
}

/* ---------------------------------------------------------------------------
   8 · LOS DIECINUEVE APARTADOS Y EL VEREDICTO
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · Los diecinueve apartados');
  eq(APARTADOS_USABILIDAD.length, 19, 'los diecinueve');
  eq(APARTADOS_USABILIDAD.map((a) => a.id), Array.from({ length: 19 }, (_, i) => i + 1), 'en su orden');
  eq(auditarUsabilidad(VISTA).sinDonde, [], 'y todos dicen dónde se contestan');
  eq(apartadosAutomaticosA11Y().length, 6, 'seis se comprueban solos');
  ok(APARTADOS_USABILIDAD.every((a) => ['node', 'hecho', 'josue', 'mixto'].includes(a.como)),
    'y cada uno declara cómo se comprueba');
  ok(!apartadoUsabilidad(99), 'se buscan por id');

  const panel = panelUsabilidad(VISTA);
  eq(panel.aguanta, true, '🎯 la interfaz principal aguanta configuraciones que no son la mía');
  ok(/sin una interfaz aparte/i.test(panel.condicion),
    '⚠️ con la condición: no hay una interfaz de accesibilidad aparte');
  eq(panel.paraJosue.length, 7, 'y los siete de Josué fuera del veredicto, no marcados');
  ok(/resistente a configuraciones/.test(CONDICION), 'con sus palabras');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
