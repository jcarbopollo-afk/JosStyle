// ============================================================================
// 💧 EL OBJETIVO DIARIO DE AGUA Y SU JARRA (P2, 2026-10-18)
//
// Las diez pruebas que pidió Josué, en lo que Node puede medir (tocar los vasos y
// ver la jarra llenarse está en la sección «P2 · AGUA» del recorrido):
//    1 el cálculo con datos · 2 sin datos · 3 editar y guardar el suyo ·
//    4 los vasos de 25 cl · 5 la jarra y el porcentaje · 6 cumplir y pasarse ·
//    7 un día nuevo, sin perder el historial · 8 sin duplicados · 9 pantallas
//    pequeñas y grandes · 10 sin romper el agua ni el resto de Nutrición.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CRITERIO_AGUA, TEXTOS_AGUA, pesoValido, propuestaDeAgua, DEFAULT_OBJETIVO_AGUA, normalizarObjetivoAgua,
  mlDelDia, normalizarAgua, objetivoDeAgua, validarObjetivoAgua, guardarObjetivoAgua, progresoAgua,
  textoDeLitros, fraseDeAgua,
} from '../src/lib/aguaNutricion.js';
import { normalizarNutricionDe } from '../src/lib/nutricion.js';
import { VASO_ML } from '../src/tokens.js';
import { MOTION_MAP } from '../src/lib/motionMapa.js';
import { EQUIVALENTES } from '../src/lib/lenguajeMotion.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');

console.log('\n1 · El objetivo, con sus datos');
eq(propuestaDeAgua({ peso: 70 }).ml, 2000, '70 kg × 30 ml = 2,1 L, redondeado a vasos: 2 L');
eq(propuestaDeAgua({ peso: 75 }).ml, 2250, '75 kg → 2,25 L');
eq(propuestaDeAgua({ peso: 75 }).base, 'peso', '…y dice que sale de su peso');
ok(/75 kg/.test(propuestaDeAgua({ peso: 75 }).texto), `…con el peso en el texto («${propuestaDeAgua({ peso: 75 }).texto}»)`);
eq(propuestaDeAgua({ peso: 75, actividad: 'intenso' }).ml, 2750, 'con actividad alta (de sus objetivos de Nutrición) se suda más: +0,5 L');
eq(propuestaDeAgua({ peso: 75, actividad: 'moderado' }).ml, 2500, 'moderada: +0,25 L');
eq(propuestaDeAgua({ peso: 75, actividad: 'sedentario' }).ml, 2250, 'sedentaria: nada');
eq(propuestaDeAgua({ peso: 40 }).ml, CRITERIO_AGUA.minimo, 'nunca menos de 1,5 L');
eq(propuestaDeAgua({ peso: 150, actividad: 'muy_alto' }).ml, CRITERIO_AGUA.maximo, 'nunca más de 3,5 L, por mucho que pese o entrene');
eq(propuestaDeAgua({ peso: 73 }).ml % VASO_ML, 0, 'siempre en vasos enteros');
ok(propuestaDeAgua({ peso: '72,5' }).ml === 2250, 'un peso con coma también vale');
const n75 = { objetivos: { configurado: true, actividad: 'intenso', objetivo: 'ganar' } };
eq(objetivoDeAgua(n75, { peso: 75 }).ml, 2750, 'objetivoDeAgua lee la actividad de los objetivos de Nutrición, que ya estaban (no se pregunta otra vez)');
eq(objetivoDeAgua({ objetivos: { configurado: true, actividad: 'intenso', objetivo: 'perder' } }, { peso: 75 }).ml, 2750,
  '🚨 el objetivo corporal NO cuenta: ganar (hipertrofia) o perder, el mismo agua');
eq(objetivoDeAgua({ objetivos: { configurado: false, actividad: 'intenso' } }, { peso: 75 }).ml, 2250, 'unos objetivos sin configurar no suman actividad');
const FUENTE = leer('src/lib/aguaNutricion.js');
ok(!/kcal|calor[ií]as|hipertrofia|objetivos\.objetivo\b|objetivos\.kcal/.test(FUENTE.replace(/\/\*[\s\S]*?\*\//g, '')), '…y el código no mira ni las calorías ni el objetivo corporal');

console.log('\n2 · Sin datos personales');
eq(propuestaDeAgua({}).ml, 2000, 'sin peso: 2 L, la referencia general (EFSA, para beber)');
eq(propuestaDeAgua({}).base, 'general', '…dicho como propuesta general');
ok(/Ajustes → Perfil/.test(propuestaDeAgua({}).texto), '…con dónde añadir el peso');
eq(pesoValido(0), null, 'un peso 0 no es un peso'); eq(pesoValido(-70), null, 'ni uno negativo'); eq(pesoValido('abc'), null, 'ni un texto'); eq(pesoValido(400), null, 'ni uno imposible');
eq(propuestaDeAgua({ peso: 0 }).ml, 2000, '…así que con un peso 0 la propuesta es la general, nunca 0 L');
eq(objetivoDeAgua(null, null).ml, 2000, 'sin nada de nada, no revienta');

console.log('\n3 · El suyo, editado y guardado');
eq(validarObjetivoAgua('2,5'), { ok: true, ml: 2500 }, '«2,5» → 2,5 L');
eq(validarObjetivoAgua('3').ml, 3000, '«3» → 3 L');
ok(!validarObjetivoAgua('').ok && validarObjetivoAgua('').error === TEXTOS_AGUA.noEsNumero, 'vacío: se dice qué escribir');
ok(!validarObjetivoAgua('0').ok && validarObjetivoAgua('0').error === TEXTOS_AGUA.fueraDeRango, 'cero: fuera de rango');
ok(!validarObjetivoAgua('-1').ok, 'negativo: no'); ok(!validarObjetivoAgua('9').ok, 'nueve litros: no'); ok(!validarObjetivoAgua('2,5 L').ok, 'con letras: no');
const guardado = guardarObjetivoAgua(2500, '2026-10-18');
eq(guardado, { ml: 2500, fecha: '2026-10-18' }, 'lo que se guarda: el objetivo y cuándo lo puso');
eq(objetivoDeAgua({ ...n75, objetivoAgua: guardado }, { peso: 75 }), { ml: 2500, manual: true, propuesta: propuestaDeAgua({ peso: 75, actividad: 'intenso' }), texto: TEXTOS_AGUA.manual },
  '🚨 el suyo manda sobre la propuesta');
eq(guardarObjetivoAgua(null), { ...DEFAULT_OBJETIVO_AGUA }, '«Usar la propuesta» vuelve a `ml: null`');
const recargado = normalizarNutricionDe(JSON.parse(JSON.stringify({ comidas: [], objetivoAgua: guardado })));
eq(recargado.objetivoAgua, guardado, '🚨 y al recargar sigue ahí (su puerta de carga lo conserva)');
eq(normalizarObjetivoAgua({ ml: -5 }).ml, null, 'un objetivo guardado imposible no se usa (vuelve a la propuesta)');
eq(normalizarObjetivoAgua({ ml: '2500' }).ml, 2500, '…uno en texto sí');
eq(normalizarObjetivoAgua(null), { ml: null, fecha: null }, 'sin nada, el de por defecto');
const vista = leer('src/views/NutritionView.jsx');
ok(/onGuardarObjetivoAgua\(guardarObjetivoAgua\(ml, hoy\)\)/.test(vista) && /r\.ok === false\) setError\(textoDeFalloAlGuardar\(r\)\)/.test(vista),
  '🚨 guardar espera a la cuenta: si no llega, el formulario no se cierra y lo dice');
const APP = leer('src/App.jsx');
ok(/const guardarObjetivoAgua = \(objetivoAgua\) => snapshotAndSave\(\{ nutricion: \{ \.\.\.nutricion, objetivoAgua \} \}\)/.test(APP),
  '…en la clave de siempre (`nutricion`), con Deshacer, sin una clave nueva');
ok(/onGuardarObjetivoAgua=\{guardarObjetivoAgua\}/.test(APP), '…y llega a la pantalla');

console.log('\n4 · Los vasos de 25 cl');
eq(VASO_ML, 250, 'un vaso son 250 ml, como siempre');
ok(/onSetAgua\(hoy, mlHoy \+ VASO_ML\)/.test(vista) && /onSetAgua\(hoy, Math\.max\(0, mlHoy - VASO_ML\)\)/.test(vista), 'los dos botones de siempre, sobre el total del día');
ok(/const setAgua = \(fecha, ml\) => snapshotAndSave\(\{ nutricion: \{ \.\.\.nutricion, agua: \{ \.\.\.nutricion\.agua, \[fecha\]: ml \} \} \}\)/.test(APP), 'y el guardado de siempre: el TOTAL de la fecha');
ok(/aria-label="Añadir un vaso de agua"/.test(vista) && /aria-label="Quitar un vaso de agua"/.test(vista), '…ahora con nombre para VoiceOver');

console.log('\n5 · La jarra y el porcentaje');
eq(progresoAgua(0, 2000), { ml: 0, objetivo: 2000, porcentaje: 0, relleno: 0, alcanzado: false, exceso: 0, faltan: 2000 }, 'vacía al empezar');
eq(progresoAgua(500, 2000).relleno, 0.25, 'dos vasos de 2 L: un cuarto');
eq(progresoAgua(500, 2000).porcentaje, 25, '…25 %');
eq(progresoAgua(1250, 2250).porcentaje, 56, 'redondeado');
eq(fraseDeAgua(progresoAgua(500, 2000)), 'Te faltan 1,5 L (6 vasos)', 'lo que falta, en litros y en vasos');
eq(textoDeLitros(1250), '1,25 L', 'litros con coma'); eq(textoDeLitros(2000), '2 L', 'sin ceros de más'); eq(textoDeLitros(500), '0,5 L', 'medio litro');
eq(progresoAgua(500, 0).porcentaje, null, 'sin objetivo no hay porcentaje (nunca una división por cero)');
eq(progresoAgua(NaN, 2000).ml, 0, 'un dato roto cuenta como nada, no como NaN');
const JARRA = leer('src/components/jarraAgua.jsx');
ok(/className="jarra-nivel"/.test(JARRA) && /transform: `scaleY\(\$\{relleno\}\)`/.test(JARRA), 'la jarra escala el agua, no la jarra');
ok(/role="img" aria-label=\{etiqueta\}/.test(JARRA), '…y dice en palabras lo que dibuja');
const CSS = leer('src/index.css');
ok(/\.jarra-nivel \{[\s\S]*?transition: transform var\(--motion-dur-medium\) var\(--ease-premium\)/.test(CSS), '🚨 el agua sube con el Motion System: `medium` y la curva de JosStyle (MS F14)');
ok(/html\[data-motion='reducido'\] \.jarra-nivel \{\s*transition-property: none;/.test(CSS) && /prefers-reduced-motion[\s\S]{0,120}\.jarra-nivel/.test(CSS), '…y en Reducido cambia sin animarse');
ok(MOTION_MAP.some((m) => m.clase === 'jarra-nivel' && m.duracion === 280), '…declarada en el MOTION_MAP');
ok(EQUIVALENTES.find((e) => /barras/.test(e.que)).clases.includes('jarra-nivel'), '…y al ritmo de las otras barras de progreso');

console.log('\n6 · Cumplirlo y pasarse');
const justo = progresoAgua(2000, 2000);
ok(justo.alcanzado && justo.relleno === 1 && justo.porcentaje === 100, 'justo el objetivo: llena, 100 %');
eq(fraseDeAgua(justo), TEXTOS_AGUA.alcanzado, '«Objetivo cumplido»');
const mas = progresoAgua(2500, 2000);
ok(mas.relleno === 1 && mas.porcentaje === 125 && mas.exceso === 500, '🚨 pasarse: la jarra llena y la cifra REAL (125 %), sin esconder nada');
eq(fraseDeAgua(mas), '0,5 L por encima de tu objetivo', '…y se dice cuánto');
ok(/LatidoAlMarcar activo=\{!!p\.alcanzado\} latido="tarea"/.test(JARRA), 'el ✓ de cumplido late al conseguirlo, nunca al abrir (MS F18)');

console.log('\n7 · Un día nuevo');
const agua = { '2026-10-17': 1750, '2026-10-18': 500 };
eq(mlDelDia(agua, '2026-10-19'), 0, 'mañana empieza de cero…');
eq(mlDelDia(agua, '2026-10-17'), 1750, '…y lo de ayer sigue ahí');
ok(/export function useHoyISO\(\)/.test(JARRA) && /visibilitychange/.test(JARRA) && /clearTimeout\(reloj\)/.test(JARRA),
  '🚨 la pantalla cambia de día a medianoche y al volver a la aplicación (un iPhone abierto de un día para otro), y limpia su reloj');
ok(/const hoy = useHoyISO\(\);/.test(vista), '…y es el día que usa el agua');
ok(/new Date\(ahora\.getFullYear\(\), ahora\.getMonth\(\), ahora\.getDate\(\) \+ 1/.test(JARRA), '…la medianoche LOCAL, no la de UTC');

console.log('\n8 · Sin duplicados');
eq(normalizarAgua({ '2026-10-18': 500, '2026-10-17': 'x', '2026-10-16': -250, malo: 3, '2026-10-15': '750' }), { '2026-10-18': 500, '2026-10-15': 750 },
  'la puerta de carga deja lo que vale y quita lo roto (texto, negativo, una fecha que no lo es)');
eq(normalizarAgua(normalizarAgua(agua)), agua, 'normalizar dos veces no cambia nada');
eq(normalizarNutricionDe({ comidas: [], agua }).agua, agua, '🚨 y recargar no suma: se guarda el total de cada fecha, no cada vaso');
eq(normalizarNutricionDe({ comidas: [], agua, favoritos: [{ id: 'f' }] }).favoritos.length, 1, 'y el resto del módulo sigue entero (regla 5)');

console.log('\n9 · Pantallas pequeñas y grandes');
ok(/flex items-center justify-center gap-6 flex-wrap/.test(vista), 'los vasos y la jarra van lado a lado y, si no caben, la jarra baja (sin salirse de lado)');
ok(/width: 92/.test(JARRA), 'la jarra tiene un ancho fijo y pequeño: no ocupa más de lo que necesita');

console.log('\n10 · Sin romper nada');
ok(/<Plegable abierto=\{editando && !!onGuardarObjetivoAgua\}>/.test(vista), 'editar el objetivo se abre en su sitio (MS F10)');
ok(TEXTOS_AGUA.orientativo.includes('orientativa') && TEXTOS_AGUA.orientativo.includes('no una indicación médica'), 'se dice que es una estimación, no una indicación médica');
ok(/la comida y otras bebidas también hidratan/.test(TEXTOS_AGUA.orientativo), '…y que el agua registrada no es toda la hidratación');
ok(/Objetivo diario de agua: \$\{objetivoDeAgua\(nutricion, perfil\)\.ml\} ml \(orientativo\)/.test(vista), 'el análisis de la IA (a un toque) conoce el objetivo');

console.log(`\n${n - fallos}/${n} comprobaciones${fallos ? ` · ${fallos} FALLOS` : ''}`);
process.exit(fallos ? 1 : 0);
