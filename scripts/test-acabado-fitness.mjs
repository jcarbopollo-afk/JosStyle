/* Entrega 4 · FIT F42/45 — Auditoría visual y acabado premium de Fitness.
   ═══════════════════════════════════════════════════════════════════════════
   *"Fitness debe parecer diseñado como UN ÚNICO PRODUCTO."* Lo que se mide en
   Node: la escala visual de Fitness (letra, pesos, radios, espaciado, letra
   espaciada, mayúsculas) sobre sus 32 archivos; una fecha con un formato por
   papel; el acento legible como texto con los doce acentos en los dos temas;
   las hojas, los filtros y los selectores, de un sitio; las capas de encima de
   una foto como tokens; una palabra por concepto; las cifras tabulares; y que
   esta fase NO toca un motor. Lo que calcula el navegador —la cabecera de las
   tres áreas, el contraste de verdad, las cifras del reloj—, en Chromium. */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SUPERFICIES, ESCALA_TEXTO, CLASES_TEXTO, TEXTO_PEQUENO, PESOS_LETRA, RADIOS, PASOS_ESPACIADO, TRACKING,
  CONTRASTE_TEXTO, acentoLegible, HOJA, CERRAR_HOJA, fuenteResuelta, MINIATURA_FOTO,
  TERMINOS_FITNESS, terminosQueChocan, REGLAS_ACABADO, reglaDeAcabado, EXCEPCIONES_PASTILLA,
  revisarArchivo, auditarAcabado, PANTALLAS_F42,
  YA_EXISTIA_F42, HECHO_F42, NO_EN_FIT42, DECISIONES_FIT42, MEDIDO_EN_CHROMIUM,
} from '../src/lib/acabadoFitness.js';
import { MESES, MESES_ETIQUETA, fechaLarga, diaYMes, fechaEtiqueta, FORMATOS_FECHA } from '../src/lib/fechasFitness.js';
import * as finalizacion from '../src/lib/finalizacion.js';
import { diaYMes as diaYMesDeActividad } from '../src/lib/actividadEntrenamiento.js';
import { etiquetaDeDia } from '../src/lib/fotosProgreso.js';
import { desdeCuando, AVISO_SALIR, avisoDeRecuperacion } from '../src/lib/entrenamiento.js';
import { AVISO_ELIMINAR_SESION } from '../src/lib/historial.js';
import { DESCANSO_HOY, SIN_PLAN } from '../src/lib/tuPlan.js';
import { ESTADO_VACIO_PLANTILLAS } from '../src/lib/plantillas.js';
import { ARCHIVOS_FITNESS } from '../src/lib/feedbackFitness.js';
import { ACCENTS, COLORS, CAPAS, aplicarTema } from '../src/tokens.js';
import { contrastRatio, hexToOklch } from '../src/lib/colorEngine.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}
const sinComentarios = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');
const archivos = Object.fromEntries(ARCHIVOS_FITNESS.map((p) => [p, leer(p)]));
const CSS = leer('src/index.css');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Una fecha, un formato por papel (apartado 59) ──');
ok(fechaLarga('2026-09-12') === '12 septiembre 2026', '«12 septiembre 2026» — la de la F8, para una fecha suelta');
ok(diaYMes('2026-09-12') === '12 de septiembre', '«12 de septiembre» — dentro de una frase');
ok(fechaEtiqueta('2026-09-12') === '12 SEP' && fechaEtiqueta('2026-09-12', { anio: true }) === '12 SEP 2026',
  '«12 SEP» y «12 SEP 2026» — el rótulo pequeño, en mayúsculas');
ok(['', null, undefined, '2026-13-45', '2026-02-30', 'hoy', 42].every((x) => fechaLarga(x) === '' && diaYMes(x) === '' && fechaEtiqueta(x) === ''),
  'Una fecha imposible no se escribe: ni «45 undefined», ni un mes que no existe');
ok(fechaLarga('2026-01-01') === '1 enero 2026' && fechaLarga('2026-12-31') === '31 diciembre 2026',
  '⚠️ En local: el 1 de enero no se va al 31 de diciembre del año anterior (la trampa del UTC)');
ok(MESES_ETIQUETA.join(',') === 'ENE,FEB,MAR,ABR,MAY,JUN,JUL,AGO,SEP,OCT,NOV,DIC',
  'El rótulo corto se DERIVA de `MESES` y dice exactamente lo que decían las dos copias a mano (F22 y F26)');
ok(finalizacion.MESES === MESES && finalizacion.fechaLarga === fechaLarga,
  '`finalizacion.js` reexporta `MESES` y `fechaLarga`: la misma lista y la misma función, no una copia');
ok(diaYMesDeActividad === diaYMes, '…y `actividadEntrenamiento.js` su `diaYMes`');
ok(etiquetaDeDia('2026-09-12') === '12 SEP 2026' && etiquetaDeDia('roto') === 'roto',
  'La galería dice lo mismo que antes, y lo que no es una fecha se enseña tal cual');
{
  const d = new Date(2026, 8, 14, 10, 0);
  ok(desdeCuando({ iniciadaEn: d.getTime() }, new Date(2026, 8, 17, 12, 0).getTime()) === 'Empezado el 14 de septiembre',
    '🐛 «Empezado el 14 sept» era un cuarto formato con su propia lista de meses: ahora es la frase de fecha');
}
ok(FORMATOS_FECHA.length === 3 && FORMATOS_FECHA.every((f) => f.funcion && f.funcion('2026-09-12')),
  'Tres papeles, cada uno con su función');
{
  const REGLA = reglaDeAcabado('fechas_de_un_sitio');
  const libs = readdirSync(join(RAIZ, 'src/lib')).filter((f) => f.endsWith('.js'))
    .filter((f) => /from '\.\/(?:fitness|entrenamiento|historial|finalizacion)(?:\.js)?'/.test(leer(`src/lib/${f}`)));
  const propias = libs.filter((f) => REGLA.mira(sinComentarios(leer(`src/lib/${f}`))).length);
  ok(libs.length > 20 && propias.length === 0,
    `🚨 Ninguna librería de Fitness (${libs.length}) compone una fecha por su cuenta${propias.length ? ` — ${propias.join(', ')}` : ''}`);
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. El acento como texto, legible (apartados 5, 55 y 56) ──');
{
  const antes = { oscuro: 0, claro: 0 };
  const despues = { oscuro: 0, claro: 0 };
  let mismoTono = true;
  let intactos = 0;
  for (const tema of ['oscuro', 'claro']) {
    for (const a of ACCENTS) {
      aplicarTema(tema, false, a.value, null);
      if (contrastRatio(a.value, COLORS.surface2) < CONTRASTE_TEXTO) antes[tema] += 1;
      const l = acentoLegible(a.value);
      if ([COLORS.surface2, COLORS.surface, COLORS.bg].some((f) => contrastRatio(l, f) < CONTRASTE_TEXTO)) despues[tema] += 1;
      if (contrastRatio(a.value, COLORS.surface2) >= CONTRASTE_TEXTO) { if (l === a.value) intactos += 1; else mismoTono = false; }
      const h1 = hexToOklch(a.value).h;
      const h2 = hexToOklch(l).h;
      if (hexToOklch(a.value).c > 0.03 && Math.abs(((h1 - h2 + 540) % 360) - 180) > 12) mismoTono = false;
    }
  }
  ok(antes.oscuro >= 5 && antes.claro >= 5,
    `🐛 Sin arreglar, el acento como texto no llegaba a 4,5:1 con ${antes.oscuro} acentos en oscuro y ${antes.claro} en claro`);
  ok(despues.oscuro === 0 && despues.claro === 0,
    '🚨 Con `acentoLegible`, los doce en los dos temas llegan a 4,5:1 sobre las TRES superficies');
  ok(mismoTono && intactos > 0, `…con el mismo tono, y el que ya llegaba es el mismo color (${intactos} intactos)`);
  aplicarTema('oscuro', false, ACCENTS[0].value, null);
  ok(acentoLegible(undefined) === undefined && acentoLegible('no-es-un-color') === 'no-es-un-color',
    'Lo que no es un color se devuelve tal cual: una pantalla sin acento no revienta');
}
{
  const REGLA = reglaDeAcabado('acento_como_texto_legible');
  ok(REGLA.mira('<p style={{ color: accent }}>').length === 1 && REGLA.mira('<p style={{ color: sin ? COLORS.text : accent }}>').length === 1,
    'La regla caza el acento como texto, también en un ternario');
  ok(REGLA.mira('<p style={{ color: acentoLegible(accent) }}>').length === 0 && REGLA.mira('<p style={{ borderColor: accent }}>').length === 0,
    '…y no caza el legible ni un borde');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. La escala, sobre los archivos de Fitness (apartados 6-12, 30-33, 42, 53, 58, 59) ──');
{
  const r = auditarAcabado({ archivos, css: CSS });
  r.casillas.forEach((c) => ok(c.ok, `Casilla «${c.id}» (apartado ${c.apartado}) — ${c.dato}`));
  ok(r.ok, '🚨 La auditoría visual de Fitness sale entera en verde');
  ok(Object.keys(archivos).length >= 32 && archivos['src/components/piezasFitness.jsx'],
    `Mira los ${Object.keys(archivos).length} archivos de \`ARCHIVOS_FITNESS\`, con las piezas de esta fase dentro`);
}
{
  /* EH F42: una regla que no puede ponerse roja no sirve. */
  REGLAS_ACABADO.forEach((regla) => {
    const cazados = revisarArchivo('src/views/Ejemplo.jsx', regla.ejemploMalo).filter((h) => h.regla === regla.id);
    ok(cazados.length > 0, `La regla «${regla.id}» caza su ejemplo malo: ${regla.ejemploMalo.slice(0, 50)}`);
  });
  const comentado = REGLAS_ACABADO.map((r) => `/* ${r.ejemploMalo} */`).join('\n');
  ok(revisarArchivo('src/views/Ejemplo.jsx', comentado).length === 0,
    '…y un comentario que menciona lo prohibido no lo incumple (la lección de siempre)');
  const lineas = revisarArchivo('src/views/Ejemplo.jsx', '/* uno\n dos\n tres */\n<p className="text-[9px]">x</p>');
  ok(lineas.length === 1 && lineas[0].linea === 4, '⚠️ Y el número de línea apunta al sitio aunque haya un comentario de tres líneas encima (F38)');
  ok(revisarArchivo('src/components/comparadorFotos.jsx', '<button aria-pressed={a} className="px-3 py-1.5 rounded-full">A</button>').length === 0
    && EXCEPCIONES_PASTILLA.every((e) => e.porque.length > 20),
    'Los controles neutros del comparador son una excepción declarada, con su motivo');
}
ok(CLASES_TEXTO.length === 10 && !CLASES_TEXTO.includes('text-[9px]') && !CLASES_TEXTO.includes('text-[12px]'),
  'Ocho papeles de letra y diez clases: ni 9 px, ni «12 px» (que es `text-xs`)');
ok(ESCALA_TEXTO.map((e) => e.rol).join(',') === 'Display,H1,H2,H3,Body,Body secondary,Label,Caption',
  'Los papeles del apartado 6, con su nombre');
ok(RADIOS.length === 5 && RADIOS.map((r) => r.rol).join(',') === 'small,medium,large,sheet,pill', 'Cinco radios, no quince (apartado 10)');
ok(PESOS_LETRA.length === 4 && TEXTO_PEQUENO.length === 3 && TRACKING === 'tracking-wider' && PASOS_ESPACIADO.includes('4'),
  'Pesos, letra pequeña, un espaciado de letra y la escala de 4 px');
ok(SUPERFICIES.map((s) => s.rol).join(',') === 'background,surface,surfaceElevated,surfacePressed,border,text,textSecondary,disabled',
  'Las superficies del apartado 4, cada una con el token que ya existía');
ok(SUPERFICIES.every((s) => /COLORS\./.test(s.token)), '…y todas son de `COLORS`: ni un color nuevo');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. Hojas, filtros y capas: de un sitio (apartados 21, 38, 39, 42 y 64) ──');
{
  const conHoja = Object.entries(archivos).filter(([, src]) => /\bHOJA\.(?:velo|veloConfirmacion|visor)\b/.test(src)).map(([p]) => p.split('/').pop());
  ok(conHoja.length === 7, `Siete archivos dibujan su hoja con \`HOJA\`: ${conHoja.join(', ')}`);
  ok(HOJA.fondoVelo === CAPAS.veloHoja && Object.values(archivos).every((src) => !/rgba\(0,\s*0,\s*0,\s*0\.(?:5|6)\)/.test(sinComentarios(src))),
    '🐛 Un velo, no cuatro: ni un «0,5» ni un «0,6» escrito a mano');
  ok(/sm:rounded-3xl/.test(HOJA.caja) && /sm:items-center/.test(HOJA.velo) && /hoja-movil/.test(HOJA.caja) && /dialogo-caja/.test(HOJA.caja),
    'La hoja: abajo en el móvil, centrada y con cuatro esquinas en una pantalla ancha, con tope (F38) y foco (F39)');
  const conCerrar = Object.values(archivos).filter((src) => /<BotonCerrarHoja\b/.test(src)).length;
  ok(conCerrar >= 5, `🐛 Un botón de cerrar, no dos: \`BotonCerrarHoja\` en ${conCerrar} archivos`);
  ok(CERRAR_HOJA.clase.includes('toque-44') && CERRAR_HOJA.icono === 16, '…con su zona de toque de 44 px');
}
{
  const resuelta = fuenteResuelta('<div className={HOJA.velo}>\n<div className={`${HOJA.caja} space-y-4`} style={{ paddingBottom: HOJA.abajo }}>');
  ok(resuelta.includes(`className="${HOJA.velo}"`) && resuelta.includes(`className="${HOJA.caja} space-y-4"`)
    && resuelta.includes("paddingBottom: 'calc(var(--safe-bottom) + 1.25rem)'"),
  '🔓 Las auditorías de la F20, F33, F37, F38 y F39 leen la hoja resuelta: lo que protegen sigue igual');
  ok(fuenteResuelta('<div className={`${otra} p-5`}>') === '<div className={`${otra} p-5`}>'
    && fuenteResuelta('<div className={HOJA.inventada}>') === '<div className={HOJA.inventada}>',
  '…y lo que no es de `HOJA` se deja como estaba: no se aflojan');
  const sinHoja = fuenteResuelta('<div className="fixed inset-0 z-50"><div className="w-full rounded-t-3xl p-5">');
  ok(!/hoja-movil|dialogo-caja|fondo-entra/.test(sinHoja), '⚠️ Una hoja escrita a mano, sin `HOJA`, sigue sin sus clases: las auditorías de antes la cazan igual');
}
{
  const piezas = leer('src/components/piezasFitness.jsx');
  ok(/export function PastillaFiltro/.test(piezas) && /export function OpcionSegmentada/.test(piezas) && /export function BotonCerrarHoja/.test(piezas),
    'Las tres piezas que se repetían, en un solo archivo');
  const pastillasPropias = Object.entries(archivos).filter(([p, src]) => !p.endsWith('piezasFitness.jsx') && /function\s+Pastilla\s*\(/.test(src));
  ok(pastillasPropias.length === 0, `🐛 Ni una \`Pastilla\` propia: eran cuatro copias${pastillasPropias.length ? ` — ${pastillasPropias.map(([p]) => p).join(', ')}` : ''}`);
  ok(/export function ExerciseFilterChip\(props\)\s*\{\s*return <PastillaFiltro \{\.\.\.props\} \/>;/.test(leer('src/components/bibliotecaEjercicios.jsx')),
    '`ExerciseFilterChip` (F34) conserva su nombre y es la misma pieza');
  ok(/aria-pressed=\{activa\}/.test(piezas) && /<Check size=\{12\}/.test(piezas) && /disabled=\{apagada\}/.test(piezas),
    'La pastilla: `aria-pressed`, ✓ cuando está puesta (no solo color) y apagada si dejaría la pantalla vacía');
  ok(/\{' '\}<span/.test(piezas), '…y el recuento va detrás de un espacio de verdad: se lee «Fotos 3», no «Fotos3»');
}
ok(MINIATURA_FOTO === 'aspect-square object-cover' && /aspect-square/.test(leer('src/components/resumenProgreso.jsx'))
  && !/aspectRatio: '3 \/ 4'/.test(leer('src/components/resumenProgreso.jsx')),
'Las miniaturas de foto, cuadradas en los tres sitios: la de Progreso era la única en 3:4');
ok(Object.values(CAPAS).length >= 7 && /export const CAPAS/.test(leer('src/tokens.js')),
  'Las capas que no cambian con el tema viven en `tokens.js` (regla 2)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Una palabra por concepto (apartado 57) ──');
ok(igual(terminosQueChocan('Descartar sesión · 3 sesiones · Tus rutinas · Workout'), ['sesión', 'sesiones', 'rutinas', 'Workout']),
  'Caza «sesión», «sesiones», «rutina» y «workout»');
ok(terminosQueChocan('Tu entrenamiento está en curso. Posesiones. Rutinario').length === 0,
  '…y no lo que solo las contiene («posesiones», «rutinario»)');
ok(TERMINOS_FITNESS.map((t) => t.se_dice).join(',') === 'entrenamiento,plantilla', 'Entrenamiento y plantilla');
{
  const textos = [
    AVISO_SALIR, avisoDeRecuperacion({ id: 's', estado: 'en_curso', iniciadaEn: Date.now() - 3600000, origen: { ejercicios: [] } }),
    AVISO_ELIMINAR_SESION, finalizacion.AVISO_DESCARTAR_FINAL, finalizacion.MENSAJES_FINAL,
    DESCANSO_HOY, SIN_PLAN, ESTADO_VACIO_PLANTILLAS,
  ];
  const choques = textos.flatMap((t) => terminosQueChocan(JSON.stringify(t)));
  ok(choques.length === 0, `🐛 Los avisos, los vacíos y los mensajes de Fitness dicen «entrenamiento» y «plantilla»${choques.length ? ` — ${choques.join(', ')}` : ''}`);
  ok(avisoDeRecuperacion({ id: 's', estado: 'en_curso', iniciadaEn: Date.now(), origen: { ejercicios: [] } }).descartar === 'Descartar entrenamiento',
    '«Descartar sesión» → «Descartar entrenamiento»');
}
{
  /* Las cadenas visibles de las pantallas (texto JSX y cadenas de más de una
     palabra), sin comentarios. `sesion` sin acento es un nombre de variable. */
  const choquesEn = (p, src) => {
    const limpio = sinComentarios(src);
    /* Texto JSX entre `>` y `<` que no sea código, y cadenas de UNA línea con
       más de una palabra. ⚠️ Una plantilla de varias líneas no se sigue: con
       comillas invertidas anidadas, la expresión cruzaría código. */
    const trozos = [...limpio.matchAll(/'([^'\n]* [^'\n]*)'|"([^"\n]* [^"\n]*)"|`([^`\n]* [^`\n]*)`|>([^<>{}\n]*[a-záéíóú][^<>{}\n]*)</g)]
      .map((m) => m[1] || m[2] || m[3] || (m[4] && !/=>|[();=]/.test(m[4]) ? m[4] : '') || '')
      .map((t) => t.replace(/\$\{[^}]*\}/g, ' ').replace(/[\w$]+\.(?:sesiones|rutinas?)\b|\b(?:sesiones|rutinas?)\s*[.[(]/g, ' '));
    return trozos.flatMap((t) => terminosQueChocan(t).filter((w) => /[óÓ]|es$|rutina|workout/i.test(w)).map((w) => `${p.split('/').pop()}: ${w}`));
  };
  const choques = Object.entries(archivos).flatMap(([p, src]) => choquesEn(p, src));
  ok(choquesEn('X.jsx', '<p>Última sesión</p>').length === 1 && choquesEn('X.jsx', 'aria-label="Cerrar la sesión"').length === 1
    && choquesEn('X.jsx', 'const n = f.sesiones.length; rutina.entornos.includes(x);').length === 0,
    '…el barrido caza una de verdad y no confunde un nombre de variable con un texto');
  ok(choques.length === 0, `🚨 Ni una en las pantallas de Fitness${choques.length ? ` — ${choques.slice(0, 6).join('; ')}` : ''}`);
}
ok(/Cerrar el entrenamiento del día/.test(leer('src/views/TuPlanView.jsx')) && !/aria-label="Cerrar la sesión"/.test(leer('src/views/TuPlanView.jsx')),
  '🐛 «Cerrar la sesión» se leía como salir de la cuenta');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Las cifras, tabulares (apartados 8 y 44) ──');
{
  const limpio = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
  ok(/\.fit-foco,\s*\.dialogo-caja\s*\{\s*font-variant-numeric:\s*tabular-nums/.test(limpio),
    'Una regla para Fitness y sus hojas: cada cifra que se añada la hereda sola');
  ok(/\.fit-foco input,\s*\.dialogo-caja input\s*\{\s*font-variant-numeric:\s*tabular-nums/.test(limpio),
    '⚠️ …y los campos aparte: no heredan `font-variant` (el navegador les pone su `font`)');
  ok(/className="fit-foco"/.test(leer('src/views/FitnessView.jsx')), '…y Fitness entero va dentro de `.fit-foco` (F39)');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. El «IMPORTANTE»: ni lógica, ni datos, ni motores ──');
{
  const MOTORES = ['rangos', 'motorRangos', 'progresion', 'progresoMuscular', 'objetivosProgreso', 'objetivosFitness', 'historialRangos',
    'contribucionMuscular', 'clasificacion', 'colaClasificacion', 'fitness', 'persistenciaFitness', 'rendimientoFitness'];
  const tocan = MOTORES.filter((m) => /acabadoFitness|piezasFitness/.test(leer(`src/lib/${m}.js`)));
  ok(tocan.length === 0, `🚨 Ningún motor conoce la capa visual (${MOTORES.length} mirados)${tocan.length ? ` — ${tocan.join(', ')}` : ''}`);
  const lib = sinComentarios(leer('src/lib/acabadoFitness.js'));
  ok(!/from '\.\/(?:rangos|motorRangos|progresion|objetivosProgreso|fitness|entrenamiento|historial|finalizacion)'/.test(lib),
    '…y la capa visual no importa ningún motor: solo el tema, el color y las fechas');
  ok(!/saveData|app_data|localStorage/.test(lib), '…ni guarda nada');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. Los setenta apartados ──');
{
  const cubiertos = new Set();
  const sumar = (xs) => (xs || []).forEach((a) => cubiertos.add(a));
  YA_EXISTIA_F42.forEach((y) => sumar(y.apartados));
  HECHO_F42.forEach((h) => sumar(h.apartados));
  NO_EN_FIT42.forEach((n) => cubiertos.add(n.apartado));
  DECISIONES_FIT42.forEach((d) => sumar(d.apartados));
  MEDIDO_EN_CHROMIUM.forEach((m) => sumar(m.apartados));
  REGLAS_ACABADO.forEach((r) => cubiertos.add(r.apartado));
  const faltan = Array.from({ length: 70 }, (_, i) => i + 1).filter((a) => !cubiertos.has(a));
  ok(faltan.length === 0, `Los 70 apartados están dichos: ya existía, hecho aquí, medido o no se hace con su motivo${faltan.length ? ` (faltan ${faltan})` : ''}`);
  ok(PANTALLAS_F42.length === 20 && PANTALLAS_F42.every((p) => { try { leer(p.archivo); return true; } catch { return false; } }),
    'Las veinte pantallas del apartado 60, cada una con el archivo que la pinta (y existe)');
  ok(NO_EN_FIT42.every((n) => n.porque && n.porque.length > 40), 'Lo que no se hace, con su motivo');
  ok(NO_EN_FIT42.some((n) => n.apartado === 38 && /regla 8/.test(n.porque)), 'Sin asa en las hojas: ninguna se arrastra (regla 8)');
  ok(NO_EN_FIT42.some((n) => n.apartado === 53 && /Tailwind 3/.test(n.porque)), 'Sin `hover`: en el iPhone se queda pegado');
  ok(DECISIONES_FIT42.every((d) => d.que && d.porque), 'Cada decisión con su porqué');
}

console.log(`\n${fallos === 0 ? '\x1b[32m' : '\x1b[31m'}FIT F42: ${total - fallos}/${total} — ${total} comprobaciones\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);

function igual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
