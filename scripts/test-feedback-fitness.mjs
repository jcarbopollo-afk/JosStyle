/* Entrega 4 · FIT F37/45 — Microinteracciones y feedback premium de Fitness.
   ═══════════════════════════════════════════════════════════════════════════
   *"Las animaciones deben ayudar a entender cambios, confirmar acciones…
   nunca distraer, nunca ralentizar."* Lo que se mide aquí: que cada animación
   de Fitness está declarada con la duración que de verdad tiene en index.css
   y dentro del rango de su clase, que ninguna pantalla de Fitness se pasa
   (medio segundo, `transition-all`, rebotes, confeti), que el guardado lee si
   ha llegado a la cuenta y lo dice, y que subir de rango sale del motor. */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DURACIONES_FIT, CURVA_FIT, ESCALA_PULSAR, RANGO_ESCALA_PULSAR, animacionesFitness, dentroDeSuRango,
  reglasDeClase, duracionEnCss, usaLaCurva, dejaRastro, EXCESOS, excesosEn, ARCHIVOS_FITNESS,
  auditarMovimiento, AVISOS_FITNESS, avisoFitness, avisosFitnessEnCatalogo, resultadoDeGuardado,
  subidasDeRango, TEXTOS_SUBIDA, TEXTOS_GUARDADO, YA_EXISTIA, NO_EN_FIT37, DECISIONES_FIT37,
} from '../src/lib/feedbackFitness.js';
import { tokensRaiz, movimientoReducidoEnCss } from '../src/lib/motion.js';
import { ANIMACIONES_HC, MAX_ANIMACION_MS } from '../src/lib/pulidoHC.js';
import { AVISOS_ACCION } from '../src/lib/accionesHoyAgenda.js';
import { ESCALAS_AL_TOCAR } from '../src/lib/microinteracciones.js';
import { AVISO_ELIMINAR_SESION } from '../src/lib/historial.js';
import {
  empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie,
} from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { avisoDeFallo } from '../src/lib/persistenciaFitness.js';
import { DEFAULT_FITNESS } from '../src/lib/fitness.js';
import { crearRutina, anadirEjercicio, editarLinea } from '../src/lib/constructor.js';
import { rangoEfectivoDeEjercicio } from '../src/lib/motorRangos.js';
import { fuenteResuelta } from '../src/lib/acabadoFitness.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
/* 🔓 FIT F42 — las clases de una hoja (`fondo-entra`, `hoja-movil`…) viven UNA
   vez en `HOJA` (acabadoFitness.js): una pantalla se lee con ellas resueltas,
   como las ve el navegador. Lo que se protege aquí no cambia. */
const leer = (p) => { const t = readFileSync(join(RAIZ, p), 'utf8'); return p.endsWith('.jsx') ? fuenteResuelta(t) : t; };
const CSS = leer('src/index.css');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

function sesion(exerciseId, fecha, valores, id) {
  let r = anadirEjercicio(crearRutina({ nombre: exerciseId }), exerciseId);
  if (!r.lineas.length) throw new Error(`El escenario pide «${exerciseId}», que no está en el catálogo`);
  r = editarLinea(r, r.lineas[0].id, { series: valores.length });
  const inicio = new Date(`${fecha}T18:00:00`).getTime();
  let s = empezarSesion({ nombre: exerciseId, lineas: r.lineas, hoy: fecha, ahora: inicio });
  const e = ejerciciosDeSesion(s)[0];
  valores.forEach((v, i) => {
    s = editarSerie(s, e.id, e.series[i].id, v);
    s = marcarSerie(s, e.id, e.series[i].id, true);
  });
  const hecha = guardarEntrenamiento(pasarAFinalizacion(s, { ahora: inicio + 3600000 }), { confirmado: true, ahora: inicio + 3601000 }).sesion;
  return { ...hecha, id };
}

console.log('\n═══ FIT F37/45 · Microinteracciones y feedback premium ═══');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Duraciones, curva y escala (apartados 2, 3 y 5) ──');

ok(DURACIONES_FIT.micro.min === 120 && DURACIONES_FIT.micro.max === 220, 'Microinteracción: 120-220 ms, las del apartado 2');
ok(DURACIONES_FIT.pantalla.min === 180 && DURACIONES_FIT.pantalla.max === 300, 'Transición de pantalla: 180-300 ms');
ok(DURACIONES_FIT.tarjeta.min === 200 && DURACIONES_FIT.tarjeta.max === 300, 'Expansión de tarjeta: 200-300 ms');
const fit = animacionesFitness();
ok(fit.length >= 10, `Las animaciones de Fitness están en el catálogo de siempre (${fit.length} en ANIMACIONES_HC)`);
ok(fit.every((a) => DURACIONES_FIT[a.tipo]), '…cada una con su clase de duración');
ok(fit.every(dentroDeSuRango), '🚨 …y todas dentro del rango de su clase: ninguna larga');
ok(fit.every((a) => a.ms <= MAX_ANIMACION_MS), '…y por debajo del tope de la aplicación (E3 F14)');
ok(!dentroDeSuRango({ tipo: 'micro', ms: 420 }) && !dentroDeSuRango({ tipo: 'inventado', ms: 150 }),
  '…y la comprobación sí se pone roja con una de 420 ms o con una clase que no existe');
ok(CURVA_FIT === 'var(--ease-premium)' && /--ease-premium:\s*cubic-bezier/.test(CSS),
  '🔓 La curva es la de la aplicación (Fase N2): ni una propia (apartado 3)');
ok(ESCALA_PULSAR >= RANGO_ESCALA_PULSAR.min && ESCALA_PULSAR <= RANGO_ESCALA_PULSAR.max,
  `Pulsar una tarjeta encoge a ${ESCALA_PULSAR}, dentro del 0,98-0,99 del apartado 5`);
ok(JSON.stringify(ESCALAS_AL_TOCAR).includes('0.98'),
  '⚠️ …que es el escalón de las FILAS de la escalera de ui.jsx (EH F50): no un valor nuevo');
ok(/\.fit-pulsable:active:not\(:disabled\)\s*\{\s*transform:\s*scale\(var\(--motion-escala-micro\)\)/.test(CSS) && tokensRaiz(CSS)['--motion-escala-micro'] === '0.98',
  '…y es lo que dice index.css (MS F1: el token `micro` del motor, 0,98)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. index.css, leído de verdad ──');

ok(duracionEnCss(CSS, 'fit-entra') === 220 && duracionEnCss(CSS, 'fit-barra') === 280, 'Se leen las duraciones escritas en index.css (MS F1: resolviendo el token)');
ok(duracionEnCss('/* .x { animation: a 900ms } */ .x { animation: a 120ms ease; }', 'x') === 120,
  '…sin contar lo que dice un comentario');
ok(duracionEnCss('.fit-entra-otra { animation: a 999ms; }', 'fit-entra') === null,
  '…y sin confundir una clase con otra que empieza igual');
/* 🔓 MS F6 (apartado 11) — la promesa se da la vuelta a medias: en una pantalla ancha, donde la caja va
   centrada, sigue usando los fotogramas del Calendario; en el iPhone, donde es una HOJA pegada a su
   borde, sube desde él (`hojaSubeDelBorde`). Dos reglas, la misma duración y la misma curva. */
ok(reglasDeClase(CSS, 'hoja-entra').length === 2 && /calendarSheetIn/.test(reglasDeClase(CSS, 'hoja-entra')[0].cuerpo)
  && /hojaSubeDelBorde var\(--motion-dur-normal\) var\(--motion-curva-entrance\) backwards/.test(reglasDeClase(CSS, 'hoja-entra')[1].cuerpo)
  && /\[data-capa='hoja'\]/.test(reglasDeClase(CSS, 'hoja-entra')[1].selector),
  '🔓 Las hojas usan los fotogramas del Calendario donde son una ventana, y suben desde su borde donde son una hoja (MS F6), con la curva de lo que aparece (MS F14)');
ok(usaLaCurva(CSS, 'fit-entra') && !usaLaCurva('.y { transition: width 200ms linear; }', 'y'), 'Se sabe si una clase usa la curva de la aplicación');
ok(!dejaRastro(CSS, 'fit-rango-sube') && dejaRastro('.z { animation: q 200ms ease both; }', 'z'),
  '🚨 …y si deja un `transform` puesto al terminar (`both`), que rompería los `fixed` de dentro');
ok(!dejaRastro(CSS, 'exito-entra') && duracionEnCss(CSS, 'exito-entra') === 280,
  '🔓 La marca de éxito de la F8 pasa de 420 ms a 280 y de `both` a `backwards` (apartado 47)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. La auditoría (apartados 40, 46, 47 y 53) ──');

const archivos = Object.fromEntries(ARCHIVOS_FITNESS.filter((p) => existsSync(join(RAIZ, p))).map((p) => [p, leer(p)]));
ok(Object.keys(archivos).length === ARCHIVOS_FITNESS.length, `Recorre las ${ARCHIVOS_FITNESS.length} pantallas y piezas de Fitness, y existen todas`);
const aud = auditarMovimiento({ css: CSS, archivos });
aud.casillas.forEach((c) => ok(c.ok, `Casilla «${c.id}» — ${c.dato}`));
ok(aud.ok, '🚨 La auditoría del movimiento de Fitness sale entera en verde');
/* Y cada casilla se pone roja con su caso (EH F42). */
const roja = (id, entrada) => !auditarMovimiento(entrada).casillas.find((c) => c.id === id).ok;
ok(roja('duraciones_ciertas', { css: CSS.replace('fitEntra var(--motion-dur-normal)', 'fitEntra 500ms'), archivos }),
  '…«duraciones_ciertas» se pone roja si index.css dice otra cosa que el catálogo');
ok(roja('sin_excesos', { css: CSS, archivos: { ...archivos, 'x.jsx': '<div className="transition-all duration-500" />' } }),
  '…«sin_excesos» caza un `transition-all duration-500`');
ok(roja('sin_rastro_de_transform', { css: CSS.replace('fitEntra var(--motion-dur-normal) var(--ease-premium) backwards', 'fitEntra var(--motion-dur-normal) var(--ease-premium) both'), archivos }),
  '…«sin_rastro_de_transform» caza un `both`');
ok(roja('una_sola_curva', { css: CSS.replace('.fit-barra {\n  transition: width var(--motion-dur-medium) var(--ease-premium)', '.fit-barra {\n  transition: width var(--motion-dur-medium) linear'), archivos }),
  '…«una_sola_curva» caza una curva propia');
ok(roja('movimiento_reducido', { css: CSS.replace(/@media \(prefers-reduced-motion: reduce\)/, '@media (min-width: 1px)'), archivos }),
  '…«movimiento_reducido» se pone roja sin la regla del sistema (apartado 40)');
ok(roja('todas_se_usan', { css: CSS, archivos: Object.fromEntries(Object.entries(archivos).map(([k, v]) => [k, v.replace(/fit-miniatura/g, 'otra')])) }),
  '…y «todas_se_usan» caza una clase declarada que no usa nadie (regla 8)');
ok(excesosEn('// sin confeti\n/* ni transition-all */\nconst a = 1;').length === 0,
  '…sin saltar con un comentario que PROMETE que no hay confeti');
ok(EXCESOS.length === 4 && excesosEn('<p className="animate-bounce" />')[0]?.exceso === 'movimiento_continuo',
  '…y caza también lo que no para (rebote, latido, giro: apartado 39)');
/* Los siete hallazgos, corregidos en su sitio. */
['RangosView', 'DetalleMuscularView', 'ClasificacionView', 'ProgresoView', 'EntrenamientoVivoView'].forEach((v) => {
  ok(!/transition-all|duration-[5-9]00/.test(archivos[`src/views/${v}.jsx`]), `🐛 ${v}: sin \`transition-all\` ni medio segundo`);
});
['explicacionRango', 'siguienteRango'].forEach((c) => {
  ok(!/transition-all|duration-[5-9]00/.test(archivos[`src/components/${c}.jsx`]), `🐛 ${c}.jsx: la barra de 500-700 ms pasa a \`fit-barra\``);
});
ok(ANIMACIONES_HC.find((a) => a.clase === 'module-enter').ms === 340,
  '🐛 `module-enter` estaba declarada en 420 ms y dura 340: el catálogo ya no miente');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. Las barras van del valor anterior al nuevo (apartados 15 y 16) ──');

const conBarra = Object.entries(archivos).filter(([, src]) => /style=\{\{\s*width:\s*`\$\{/.test(src));
const barrasSinClase = conBarra.flatMap(([ruta, src]) => (src.match(/<(?:div|span)[^>]*style=\{\{\s*width:\s*`\$\{[^>]*>/g) || [])
  .filter((t) => !/fit-barra/.test(t) && /rounded-full/.test(t))
  .map((t) => `${ruta.split('/').pop()}: ${t.slice(0, 60)}`));
ok(barrasSinClase.length === 0, `🚨 Toda barra de progreso de Fitness lleva \`fit-barra\`${barrasSinClase.length ? ` — ${barrasSinClase.join('; ')}` : ''}`);
ok(/\.fit-barra\s*\{\s*transition:\s*width var\(--motion-dur-medium\)/.test(CSS) && tokensRaiz(CSS)['--motion-dur-medium'] === '280ms',
  '…que transiciona SOLO el ancho: al montar no se dispara, así que no hay un «desde cero» cada vez');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Los avisos y el guardado (apartados 18, 24, 25, 28 y 29) ──');

ok(avisosFitnessEnCatalogo(), '🔓 Los avisos de Fitness viven en el catálogo del aviso que ya existía (AVISOS_ACCION, E3 F9)');
ok(AVISOS_FITNESS.every((a) => avisoFitness(a.id)?.texto && a.donde), '…cada uno con su texto y dónde sale');
ok(Object.values(AVISOS_ACCION).every((a) => !/error/i.test(a.texto)), '…y ninguno dice «Error» a secas (EH F62)');
ok(AVISOS_ACCION.guardado_fallido.error === true && /Vuelve a intentarlo/.test(AVISOS_ACCION.guardado_fallido.texto),
  '🚨 El de un guardado fallido es un error de verdad, y dice qué hacer');
const quickAdd = leer('src/components/quickAdd.jsx');
ok(/aviso\.error\s*\?\s*'alert'\s*:\s*'status'/.test(quickAdd) && /AlertTriangle/.test(quickAdd),
  '…y `AvisoAccion` lo pinta como error: su icono, su color y `role="alert"` (el color nunca va solo)');
ok(resultadoDeGuardado(undefined).ok && resultadoDeGuardado({ ok: true }).ok && !resultadoDeGuardado({ ok: false, error: 'x' }).ok,
  '`resultadoDeGuardado`: sin nada que leer no se inventa un fallo; `{ ok: false }` sí lo es');
const app = leer('src/App.jsx');
ok(/const guardarFitness = async \(next\) => \{ setFitness\(next\); return saveData\(uidUser, 'fitness', next\); \};/.test(app),
  '🚨 `guardarFitness` de App.jsx DEVUELVE lo que dice `saveData` (antes se lo tragaba)');
const fv = leer('src/views/FitnessView.jsx');
/* 🔓 FIT F41 — la promesa se muda con el código (F38 → F20): el aviso sale de
   `avisoDeFallo`, que distingue «sin espacio», y SIEMPRE devuelve uno de los
   dos avisos de error. */
ok(/export default function FitnessView\(props\)[\s\S]{0,2500}resultadoDeGuardado\(res\)[\s\S]{0,300}if \(!g\.ok\) setAviso\(avisoDeFallo\(g\.error\)\)/.test(fv)
  && ['guardado_fallido', 'guardado_sin_espacio'].includes(avisoDeFallo(null)) && avisoDeFallo({ name: 'QuotaExceededError' }) === 'guardado_sin_espacio'
  && avisoDeFallo(new Error('Failed to fetch')) === 'guardado_fallido',
  '…y FitnessView lo lee: si falla, aviso de error SIEMPRE (y desde la F41, «sin espacio» cuando es eso)');
/* 🔓 MS F9 — el aviso se monta SIEMPRE (con `accion` vacía no pinta nada), para que pueda salir con su
   transición en vez de desaparecer de golpe: ya no va detrás de `{aviso && …}`. Sigue siendo uno. */
ok((fv.match(/<AvisoAccion accion=\{aviso\}/g) || []).length === 1 && /onGuardarFitness=\{guardarF\} \/>\s*<\/AreaSegura>\s*<AvisoAccion accion=\{aviso\}/.test(fv),
  '…con un solo aviso por encima de todas las salidas y del límite de error');
ok(/'plan_activado'\)/.test(fv) && /'cambios_guardados'\)/.test(fv) && /'plantilla_duplicada'\)/.test(fv),
  '…y confirma el plan activado (apartado 36), los cambios del constructor y la plantilla duplicada');
const fin = leer('src/views/FinalizacionView.jsx');
ok(/res = await onGuardar\(r\.sesion\)/.test(fin) && /setFallo\(falloDe\(res\)\)/.test(fin)
  && /const falloDe = \(res\) => \{ const g = resultadoDeGuardado\(res\); return g\.ok \? false : \(motivoDeFallo\(g\.error\) \|\| 'otro'\); \};/.test(fin),
  '🚨 La pantalla de éxito ESPERA al guardado: «Guardando…» se ve de verdad (apartado 28)');
ok(fin.indexOf('const reintentar = async') > 0 && fin.indexOf('const reintentar = async') < fin.indexOf('if (guardada && viendo)'),
  '🐛 …y sus funciones se declaran ANTES de la primera salida: si no, `reintentar` estaría en la zona muerta de su `const` al pintar el éxito');
ok(/\{fallo && \(/.test(fin) && /role="alert"/.test(fin) && /TEXTOS_GUARDADO\.reintentar/.test(fin),
  '…y si no llega a la cuenta, lo dice JUNTO A LA ACCIÓN, con «Reintentar» (apartado 25)');
ok(/No se ha podido guardar en tu cuenta/.test(TEXTOS_GUARDADO.fallo) && !/tel[eé]fono/i.test(TEXTOS_GUARDADO.fallo) && /antes de cerrar/.test(TEXTOS_GUARDADO.detalle),
  '⚠️ …sin prometer una copia en el teléfono que no existe');
ok(/if \(guardando\) return;/.test(fin) && /if \(guardando \|\| !guardada\) return;/.test(fin),
  'Doble toque: ni guardar ni reintentar se lanzan dos veces a la vez (apartado 29)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Subir de rango (apartados 14 y 41) ──');

const s1 = sesion('press-banca-barra', '2026-08-01', [{ reps: 5, peso: 50 }], 'r1');
const s2 = sesion('press-banca-barra', '2026-08-10', [{ reps: 5, peso: 110 }], 'r2');
const s2igual = sesion('press-banca-barra', '2026-08-10', [{ reps: 5, peso: 50 }], 'r2b');
const f1 = { ...DEFAULT_FITNESS, sesiones: [s1] };
const f12 = { ...DEFAULT_FITNESS, sesiones: [s1, s2] };
const r1 = rangoEfectivoDeEjercicio(f1, 'press-banca-barra');
const r12 = rangoEfectivoDeEjercicio(f12, 'press-banca-barra');
ok(!r1.sinRango && r12.rango > r1.rango, `Escenario: la segunda sesión sube el press de banca (${r1.nombre} → ${r12.nombre})`);
const sub = subidasDeRango(f12, s2);
ok(sub.hay && sub.ejercicios.length === 1 && sub.ejercicios[0].de === r1.rango && sub.ejercicios[0].a === r12.rango,
  '🚨 Se detecta la subida con el motor de la F19, preguntado sin la sesión y con ella');
ok(sub.ejercicios[0].texto === `de ${r1.nombre} a ${r12.nombre}` && /Press de banca/.test(sub.ejercicios[0].nombre),
  '…con texto: de qué rango a cuál (apartado 41: no solo movimiento)');
ok(subidasDeRango({ ...DEFAULT_FITNESS, sesiones: [s1, s2igual] }, s2igual).ejercicios.length === 0,
  'La misma marca otra vez no es subir de rango');
ok(subidasDeRango(f1, s1).ejercicios.length === 0,
  '⚠️ El PRIMER rango de un ejercicio no se celebra: saldría en cada primer entrenamiento');
ok(!subidasDeRango(f12, { ...s2, estado: 'finalizando' }).hay && !subidasDeRango(f12, null).hay,
  '…ni una sesión sin guardar, ni ninguna');
ok(subidasDeRango({ ...DEFAULT_FITNESS, sesiones: [s1] }, s2).ejercicios.length === 1,
  '…y sale igual si la sesión todavía no estaba en la lista (se añade para preguntar)');
ok(sub.global === null, 'Con un solo ejercicio no hay rango general que subir');
ok(TEXTOS_SUBIDA.titulo === 'Has subido de rango' && !/XP|puntos|nivel/i.test(JSON.stringify(TEXTOS_SUBIDA)),
  '…y ni XP, ni puntos, ni niveles (apartado 52)');
ok(/subidas=\{enVivo\.estado === 'completada' \? subidasDeRango\(fitness \|\| \{\}, enVivo, \{ propios, perfil \}\) : null\}/.test(fv),
  'FitnessView se lo pasa a la pantalla de éxito solo cuando ya está guardada');
ok(/destacado sube/.test(fin) && /TEXTOS_SUBIDA\.titulo/.test(fin), '…que pinta el hexágono nuevo con su entrada y su texto');
ok(/else setAviso\(\(a\) => \(a === 'guardado_fallido' \|\| a === 'guardado_sin_espacio' \? null : a\)\)/.test(fv),
  '🐛 Y un guardado que va bien RETIRA el error de antes: tras «Reintentar» no puede seguir diciendo que falló');
ok(/\{!fallo && subidas && subidas\.hay && \(/.test(fin),
  '⚠️ …pero NO con el guardado fallido: esa subida desaparecería al recargar (apartado 25)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. El hexágono (apartado 13) ──');

const rangos = leer('src/components/rangos.jsx');
ok(/destacado = false, sube = false/.test(rangos) && /fit-rango-brillo/.test(rangos) && /fit-rango-sube/.test(rangos),
  '`RankBadge` acepta `destacado` y `sube`');
ok(!/outline:\s*selected/.test(rangos) && !/drop-shadow\(0 0 0/.test(rangos),
  '🐛 …y ya no pone en el hexágono un contorno y una sombra que su propio `clip-path` recortaba');
ok(/'--fit-brillo': hexToRgba\(accent/.test(rangos), '…el brillo va en un envoltorio, con el acento como variable (regla 2: ni un hex)');
const rv = leer('src/views/RangosView.jsx');
ok(/destacado=\{!sin\}/.test(rv) && /destacado=\{actual\}/.test(rv), 'Destacan el rango general y el actual de la escala de diez');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. Entrenamiento en vivo, hojas y el resto (apartados 4, 7-10, 22, 30, 37 y 38) ──');

const vivo = leer('src/views/EntrenamientoVivoView.jsx');
ok(/<Check size=\{20\} strokeWidth=\{3\} className="fit-serie-hecha" \/>/.test(vivo), 'Marcar una serie: la marca aparece, sin confeti (apartado 8)');
ok(/fit-miniatura/.test(vivo), 'Cambiar de ejercicio: la miniatura crece con suavidad (apartado 10)');
ok(/fin \? 'fit-descanso-fin' : 'fit-entra'/.test(vivo), 'El descanso entra al empezar y da un pulso al terminar (apartado 9)');
ok(/fit-entra[^>]*>\s*En lugar de \{ficha\.sustituyeA\} · solo en este entrenamiento/.test(vivo),
  '«En lugar de X · solo en este entrenamiento» (F33) entra con suavidad (apartado 37)');
ok(/<div key=\{area\} className="fit-entra">/.test(fv), 'Cambiar de área en Fitness: una entrada corta (apartado 4)');
/* 🐛 Era una lista escrita a mano de cinco archivos, y se dejó fuera las dos
   hojas de Rangos (la explicación y el historial): lo que se barre ahora es
   CADA velo `fixed inset-0` de los archivos de Fitness, sin comentarios. */
const sinComentariosJsx = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const velosEn = (mapa) => Object.entries(mapa).flatMap(([p, src]) => (sinComentariosJsx(src).match(/className="fixed inset-0[^"]*"/g) || []).map((c) => [p, c]));
const velos = velosEn(archivos);
const sinEntrada = velos.filter(([, c]) => !/fondo-entra/.test(c));
ok(velos.length >= 7 && sinEntrada.length === 0,
  `🚨 Todo velo de Fitness (${velos.length}) entra y oscurece el fondo (apartado 22)${sinEntrada.length ? ` — ${sinEntrada.map(([p]) => p.split('/').pop()).join(', ')}` : ''}`);
ok(velosEn({ x: '<div className="fixed inset-0 z-50">' }).filter(([, c]) => !/fondo-entra/.test(c)).length === 1
  && velosEn({ x: '/* className="fixed inset-0" */' }).length === 0,
  '…y el barrido caza un velo sin entrada y no se confunde con un comentario');
/* ⚠️ FIT F38 — su tope de altura pasó a `hoja-movil`; lo que se mira aquí es
   que sigan entrando. */
/* 🔓 FIT F42 — las clases salen de `HOJA`, y el orden cambió: se mira que estén. */
ok(/hoja-entra hoja-movil/.test(leer('src/components/historialRango.jsx'))
  && /hoja-entra hoja-movil/.test(leer('src/components/explicacionRango.jsx')),
  '🐛 …incluidas las dos hojas de Rangos que se habían quedado sin ella');
const cla = leer('src/views/ClasificacionView.jsx');
ok(/<Card className="fit-entra">/.test(cla) && /key=\{`\$\{actual\.id\}-\$\{pregunta \? pregunta\.id : ""\}`\}/.test(cla),
  'Cada pregunta del cuestionario entra de nuevo al avanzar (apartado 38)');
ok(/Pregunta \$\{posicion\} de \$\{total\}/.test(cla), '…y «Pregunta 2 de 7» ya estaba (F17)');
ok(/Papelera/.test(AVISO_ELIMINAR_SESION.texto) && /fotos de progreso de ese día no se borran/.test(AVISO_ELIMINAR_SESION.texto),
  '🚨 Eliminar un entrenamiento dice lo que se borra, adónde va Y lo que no se borra (apartado 30)');
ok(/fit-contenido/.test(leer('src/views/HistorialView.jsx')) && !/toque-44 active:scale-95"\s*style=\{\{ background: hexToRgba\(COLORS\.negative/.test(leer('src/views/HistorialView.jsx')),
  '…y sus botones responden «contenidos», sin escala (apartado 7)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. Lo que ya existía, lo que no se hace y lo decidido ──');

ok(YA_EXISTIA.length >= 8 && YA_EXISTIA.every((y) => y.apartado && y.que && y.donde), 'Lo que ya existía, con su apartado y dónde vive');
ok(/export function AvisoAccion/.test(quickAdd) && /export function Esqueleto/.test(leer('src/components/ui.jsx')) && /function LoadingScreen/.test(leer('src/App.jsx') + leer('src/components/ui.jsx')),
  '…y lo que dice que existe, existe (el aviso y el esqueleto)');
ok(movimientoReducidoEnCss(CSS).ok,
  '…incluido el movimiento reducido: el del sistema y el de Ajustes dejan el fundido, y «Sin movimiento» lo quita todo (apartado 40; MS F1)');
ok(NO_EN_FIT37.length >= 6 && NO_EN_FIT37.every((x) => x.que && x.porque), 'Lo que no se hace, con su motivo');
ok(NO_EN_FIT37.some((x) => /cierre/i.test(x.que)) && NO_EN_FIT37.some((x) => /scroll/i.test(x.que)) && NO_EN_FIT37.some((x) => /module-enter/.test(x.que)),
  '…el cierre animado, el scroll al volver y la transición global de módulos');
ok(NO_EN_FIT37.some((x) => /racha/i.test(x.que) && /contador/.test(x.porque)) && !/racha/i.test(leer('src/lib/feedbackFitness.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/NO_EN_FIT37[\s\S]*?\];/, '')),
  '…ni la racha que sube: habría que recordar el número de antes, y la racha no guarda ni un contador (RA F1)');
ok(DECISIONES_FIT37.length >= 3 && DECISIONES_FIT37.every((x) => x.que && x.porque), 'Las decisiones, con su motivo');
const lib = leer('src/lib/feedbackFitness.js').replace(/\/\*[\s\S]*?\*\//g, '');
ok(!/saveData|setItem|localStorage/.test(lib), 'La librería no guarda nada');
ok(!/\bXP\b|leaderboard|confet/i.test(JSON.stringify({ AVISOS_ACCION, TEXTOS_SUBIDA, TEXTOS_GUARDADO })), 'Y ni un texto de juego (apartado 52)');

console.log(`\n${fallos === 0 ? '\x1b[32m' : '\x1b[31m'}FIT F37: ${total - fallos}/${total} — ${total} comprobaciones\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);
