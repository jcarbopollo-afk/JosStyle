/* Entrega 4 · FIT F38/45 — UX móvil extrema y optimización para iPhone.
   ═══════════════════════════════════════════════════════════════════════════
   *"El usuario debería poder completar un entrenamiento entero prácticamente
   sin pelearse con la interfaz."* Lo que se mide aquí, sobre los archivos de
   verdad: que cada campo de número abre su teclado sin autocorrector, que cada
   buscador tampoco corrige, que cada hoja cabe en la pantalla visible del
   iPhone, que las miniaturas se cargan cuando se ven, que no hay gestos
   escondidos, que el revisor de la EH F42 pasa también por los componentes de
   Fitness, que «Última vez» sale de la F11 y no rellena nada, y que volver a
   una lista la deja donde estaba. Cada comprobación de la auditoría tiene su
   ejemplo malo, que tiene que cazar. */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROPS_CAMPO_NUMERICO, PROPS_CAMPO_BUSQUEDA, ultimaVezEnVivo, DISPOSITIVOS_DE_PRUEBA,
  camposNumericosSinProps, busquedasSinProps, hojasQueNoCaben, miniaturasSinPerezosa, gestosEscondidos,
  CASILLAS_MOVIL, auditarMovil, YA_EXISTIA_F38, NO_EN_FIT38, DECISIONES_FIT38,
} from '../src/lib/movilFitness.js';
import { claveDeAbierto } from '../src/components/scrollAlVolver.js';
import { ARCHIVOS_FITNESS } from '../src/lib/feedbackFitness.js';
import { ultimaVez } from '../src/lib/progresion.js';
import {
  empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie,
} from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { DEFAULT_FITNESS } from '../src/lib/fitness.js';
import { crearRutina, anadirEjercicio, editarLinea } from '../src/lib/constructor.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const CSS = leer('src/index.css');
const archivos = Object.fromEntries(ARCHIVOS_FITNESS.filter((p) => existsSync(join(RAIZ, p))).map((p) => [p, leer(p)]));

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

/* Una sesión GUARDADA de un ejercicio, construida por las funciones de verdad
   (constructor → empezar → marcar → terminar → guardar). */
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

console.log('\n═══ FIT F38/45 · UX móvil extrema e iPhone ═══');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Los campos (apartados 8, 9, 27 y 28) ──');

ok(PROPS_CAMPO_NUMERICO.autoCorrect === 'off' && PROPS_CAMPO_NUMERICO.autoComplete === 'off'
  && PROPS_CAMPO_NUMERICO.spellCheck === false && PROPS_CAMPO_NUMERICO.autoCapitalize === 'off',
  'Un campo de número: sin autocorrector, sin autocompletado, sin mayúscula y sin corrector ortográfico');
ok(PROPS_CAMPO_NUMERICO.enterKeyHint === 'done' && PROPS_CAMPO_BUSQUEDA.enterKeyHint === 'search',
  '…y la tecla de Intro dice lo que hace: «OK» en un número, «Buscar» en un buscador');
ok(Object.isFrozen(PROPS_CAMPO_NUMERICO) && Object.isFrozen(PROPS_CAMPO_BUSQUEDA),
  '…en un objeto compartido y congelado: ninguna pantalla puede cambiárselo a las demás');
ok(!('inputMode' in PROPS_CAMPO_NUMERICO),
  '⚠️ El teclado (`inputMode`) lo sigue decidiendo cada campo: decimal para kilos, numérico para repeticiones');

const malNum = '<input\n  type="text"\n  inputMode="decimal"\n  value={x}\n/>';
const bienNum = '<input\n  inputMode="decimal"\n  {...PROPS_CAMPO_NUMERICO}\n  onChange={(ev) => f(ev.target.value)}\n/>';
ok(camposNumericosSinProps(malNum).length === 1 && camposNumericosSinProps(bienNum).length === 0,
  'La auditoría caza un campo de número sin ellas, y no se corta con el `>` de una función flecha');
ok(camposNumericosSinProps('{/* <input inputMode="numeric" /> */}').length === 0,
  '…ni cuenta un campo escrito en un comentario');
ok(busquedasSinProps('<TextInput\n  aria-label="Buscar un plan"\n/>').length === 1
  && busquedasSinProps('<TextInput\n  aria-label="Buscar un plan"\n  {...PROPS_CAMPO_BUSQUEDA}\n/>').length === 0,
  'Y caza un buscador sin las suyas');

const vivo = leer('src/views/EntrenamientoVivoView.jsx');
ok(/inputMode=\{conDecimal \? 'decimal' : 'numeric'\}\s*\{\.\.\.PROPS_CAMPO_NUMERICO\}/.test(vivo),
  '🔓 Los kilos y las repeticiones del entrenamiento en vivo los llevan (apartados 8 y 9)');
ok(/className="w-full h-11 rounded-xl text-center text-base font-bold/.test(vivo),
  '⚠️ …y siguen a 16 px: en el iPhone un campo de menos hace zoom al tocarlo');
ok(/ev\.key === 'Enter'\) ev\.currentTarget\.blur\(\)/.test(vivo),
  '…e Intro cierra el teclado (apartado 8: «permitir cerrar teclado fácilmente»)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. «Última vez» (apartado 12) ──');

const s1 = sesion('press-banca-barra', '2026-09-01', [{ reps: 10, peso: 20 }, { reps: 8, peso: 20 }], 'u1');
const s2 = sesion('press-banca-barra', '2026-09-08', [{ reps: 10, peso: 22.5 }], 'u2');
const f = { ...DEFAULT_FITNESS, sesiones: [s1, s2] };
const u = ultimaVezEnVivo(f, 'press-banca-barra', { hoy: '2026-09-09' });
ok(u && u.texto === 'Última vez: 22,5 kg × 10' && u.cuando === 'Ayer',
  `🔓 «Última vez: 22,5 kg × 10 · Ayer» — la más reciente, con su día (${u && u.texto} · ${u && u.cuando})`);
ok(u.texto === `Última vez: ${ultimaVez(f, 'press-banca-barra').texto}`,
  '🚨 …y es `ultimaVez()` de la F11: no hay una segunda forma de decir cuál fue la última');
const vivaHoy = { ...s2, id: 'u3', estado: 'en_curso' };
ok(ultimaVezEnVivo({ ...f, sesiones: [s1, s2, vivaHoy] }, 'press-banca-barra', { sesionId: 'u3', hoy: '2026-09-09' }).texto === 'Última vez: 22,5 kg × 10',
  '…sin contar la sesión que se está haciendo');
ok(ultimaVezEnVivo(f, 'dominada-prona') === null && ultimaVezEnVivo(f, null) === null && ultimaVezEnVivo(null, 'press-banca-barra') === null,
  '…y de un ejercicio nuevo no se inventa ninguna: `null`');

const fv = leer('src/views/FitnessView.jsx');
ok(/ultimaVezDe=\{\(exerciseId\) => ultimaVezEnVivo\(fitness \|\| \{\}, exerciseId, \{ propios, sesionId: enVivo\.id \}\)\}/.test(fv),
  'Fitness se la pasa al entrenamiento en vivo como FUNCIÓN, como el objetivo (F30)');
ok(/\{ultima && \(\s*<p[^>]*>\s*\{ultima\.texto\}\{ultima\.cuando \? ` · \$\{ultima\.cuando\}` : ''\}/.test(vivo),
  '…que la pinta como TEXTO, debajo del objetivo');
/* No se cuenta cuántas veces sale (una cuenta exacta es una bomba de relojería):
   se mira CÓMO sale cada vez — solo se define, se pregunta si existe y se leen
   sus dos textos. Pasársela a la tabla o a una serie sería rellenar un dato. */
const usosUltima = [...vivo.matchAll(/\bultima\b(.{0,12})/g)].map((m) => m[1]);
ok(usosUltima.length > 0 && usosUltima.every((c) => /^ = useMemo|^ && \(|^\.texto|^\.cuando/.test(c)),
  `🚨 …y la tabla de series no se entera: ni rellena ni marca nada (apartado 12, literal)`);

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Las hojas (apartados 22, 23 y 47) ──');

ok(/\.hoja-movil\s*\{\s*max-height:\s*88vh;\s*max-height:\s*88dvh;/.test(CSS),
  '🔓 `hoja-movil`: primero `vh` y luego `dvh`, la altura VISIBLE del iPhone — en CSS, donde la segunda gana sin borrar el respaldo (SF F1)');
ok(/\.hoja-movil\s*\{[^}]*overflow-y:\s*auto;[^}]*overscroll-behavior:\s*contain;/.test(CSS),
  '…con scroll dentro que no arrastra la página de detrás (apartado 23)');
ok(hojasQueNoCaben('<div className="rounded-t-3xl hoja-entra" style={{ paddingBottom: \'calc(var(--safe-bottom) + 1rem)\' }}>').length === 1
  && hojasQueNoCaben('<div className="rounded-t-3xl hoja-entra hoja-movil" style={{ background: x }}>')[0]?.falta === 'safe-bottom'
  && hojasQueNoCaben('<div className="hoja-entra hoja-movil" style={{ paddingBottom: \'calc(var(--safe-bottom) + 1rem)\' }}>').length === 0,
  'La auditoría caza una hoja sin tope y una sin sitio para la barra de inicio');
const hojas = Object.values(archivos).reduce((n, src) => n + (src.match(/\bhoja-entra\b/g) || []).length, 0);
ok(hojas >= 6, `Las hojas que entran (F37) son ${hojas}, y todas pasan`);
ok(!Object.entries(archivos).some(([, src]) => /maxHeight:\s*'8\dvh'|max-h-\[8\dvh\]/.test(src)),
  '🐛 …y ninguna guarda su tope viejo en `vh`: con la barra de Safari a la vista se salían por debajo');
ok(/hoja-entra hoja-movil"[\s\S]{0,300}paddingBottom: 'calc\(var\(--safe-bottom\) \+ 1\.25rem\)'/.test(leer('src/components/historialRango.jsx')),
  '🐛 El historial de un rango deja sitio a la barra de inicio: era la única hoja que no (apartado 47)');
ok(/hoja-entra hoja-movil"/.test(leer('src/views/RangosView.jsx')),
  '🐛 …y la hoja de un rango tiene tope y scroll: no tenía ninguno de los dos (apartado 22)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. Miniaturas y gestos (apartados 34-36, 40 y 41) ──');

ok(miniaturasSinPerezosa('<img src={u} alt="" className="w-16 object-cover" />').length === 1
  && miniaturasSinPerezosa('<img src={u} alt="" loading="lazy" className="w-16 object-cover" />').length === 0
  && miniaturasSinPerezosa('<img src={u} alt="" className="max-w-full object-contain" />').length === 0,
  'Una miniatura sin `loading="lazy"` se caza; la foto que se ABRE (`object-contain`) se carga ya');
ok(/loading="lazy"[\s\S]{0,160}object-cover/.test(leer('src/components/resumenProgreso.jsx')),
  '🐛 Las fotos del resumen de Progreso se cargaban todas de golpe; ahora cuando se ven');
ok(/<img src=\{urls\[o\.id\]\} alt="" loading="lazy"/.test(leer('src/components/comparadorFotos.jsx')),
  '🐛 …y la tira de fechas del comparador, igual');
ok(gestosEscondidos('<div onContextMenu={f} />').includes('pulsacion_larga')
  && gestosEscondidos('<li draggable onDragStart={f} />').includes('arrastrar')
  && gestosEscondidos('<img draggable={false} />').length === 0,
  'La auditoría caza una pulsación larga y un arrastre; `draggable={false}` es lo contrario y vale');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. La auditoría entera, sobre los archivos de verdad ──');

const aud = auditarMovil({ css: CSS, archivos });
ok(CASILLAS_MOVIL.length === 7 && aud.casillas.length === 7, 'Siete casillas, cada una con su apartado');
aud.casillas.forEach((c) => ok(c.ok, `Casilla «${c.id}» (apartado ${c.apartado})${c.ok ? '' : ` — ${JSON.stringify(c.problemas).slice(0, 240)}`}`));
ok(aud.ok, '🚨 La auditoría móvil de Fitness sale entera en verde');
ok(Object.keys(archivos).filter((p) => p.startsWith('src/components/')).length >= 10,
  '⚠️ …y mira también los COMPONENTES: el revisor de la EH F42 solo pasaba por `src/views/`');
const roja = (id, mapa) => !auditarMovil({ css: CSS, archivos: { ...archivos, ...mapa } }).casillas.find((c) => c.id === id).ok;
ok(roja('toques', { 'x.jsx': '<button onClick={f}><X size={13} /></button>' }), '…«toques» caza un botón de solo icono sin nombre');
ok(roja('campos_numericos', { 'x.jsx': malNum }), '…«campos_numericos» caza un campo sin sus props');
ok(!auditarMovil({ css: CSS.replace('max-height: 88dvh;', ''), archivos }).casillas.find((c) => c.id === 'clase_hoja').ok,
  '…y «clase_hoja» se pone roja sin la altura visible');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Volver a una lista (apartado 32) ──');

ok(claveDeAbierto(null) === null && claveDeAbierto('') === null && claveDeAbierto(false) === null,
  'Nada abierto es `null`: se está viendo la lista');
ok(claveDeAbierto('press-banca-barra') === 'press-banca-barra'
  && claveDeAbierto({ tipo: 'sesion', id: 'a' }) !== claveDeAbierto({ tipo: 'sesion', id: 'b' }),
  '…y dos detalles distintos son dos claves: pasar de uno a otro también empieza arriba');
const hook = leer('src/components/scrollAlVolver.js');
ok(!/localStorage|sessionStorage|saveData|app_data/.test(hook.replace(/\/\*[\s\S]*?\*\//g, '')),
  '⚠️ Lo que se recuerda es de la pantalla: ni `app_data` ni el almacenamiento del navegador (EH F40)');
ok(/window\.addEventListener\('scroll', apuntar, \{ passive: true \}\)/.test(hook) && /if \(viendoLista\.current\)/.test(hook),
  '🐛 Se apunta la posición MIENTRAS se ve la lista, y el `scrollTo(0)` de abrir no la pisa');
[
  ['src/views/EjerciciosView.jsx', 'useScrollAlVolver(abierto);', 'if (abierto) {'],
  ['src/views/HistorialView.jsx', 'useScrollAlVolver(abierta);', 'if (abierta) {'],
  ['src/views/BibliotecaPlanesView.jsx', 'useScrollAlVolver(abierto);', 'if (abierto) {'],
  ['src/views/ProgresoView.jsx', 'useScrollAlVolver(abierto || vista || formulario || objetivoAbierto || musculo);', "if (vista && vista.tipo === 'sesion') {"],
].forEach(([p, llamada, primeraSalida]) => {
  const src = leer(p);
  const i = src.indexOf(llamada);
  ok(i > 0 && i < src.indexOf(primeraSalida),
    `${p.split('/').pop()}: lo usa, y ANTES de su primera salida (un hook después de un \`return\` es la regla 4)`);
});

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. En qué pantallas se prueba (apartados 29 y 51) ──');

const anchos = DISPOSITIVOS_DE_PRUEBA.map((d) => d.ancho);
ok(anchos.includes(320) && anchos.includes(375) && anchos.includes(430) && anchos.includes(768) && anchos.includes(1280),
  'iPhone pequeño, SE, grande, iPad y escritorio (apartado 51)');
ok(DISPOSITIVOS_DE_PRUEBA.some((d) => d.ancho > d.alto && d.alto <= 400),
  '…y un iPhone en horizontal (apartado 29: «no romperse si cambia de orientación»)');
ok(new Set(DISPOSITIVOS_DE_PRUEBA.map((d) => d.id)).size === DISPOSITIVOS_DE_PRUEBA.length,
  '…cada uno con su id');
ok(/DISPOSITIVOS_DE_PRUEBA/.test(leer('scripts/test-app-real.mjs')),
  '…y el recorrido los recorre: la lista no se escribe dos veces');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. Lo que ya existía, lo que no se hace y lo decidido ──');

ok(YA_EXISTIA_F38.length >= 12 && YA_EXISTIA_F38.every((y) => y.apartado && y.que && y.donde), 'Lo que ya existía, con su apartado y dónde vive');
ok(/\.pantalla-segura/.test(CSS) && /--safe-bottom: env\(safe-area-inset-bottom/.test(CSS) && /\.toque-44/.test(CSS),
  '…y lo que dice que existe, existe: la Safe Area y la zona de toque');
ok(/touchAction: 'pan-y'/.test(vivo) && /siguienteEjercicio\(sesion\)/.test(vivo) && /anteriorEjercicio\(sesion\)/.test(vivo),
  '…el gesto que no se pelea con el scroll, con Anterior y Siguiente siempre visibles (apartado 14)');
ok(/aria-label=\{`Subir \$\{nombre\}`\}|label=\{`Subir \$\{nombre\}`\}/.test(leer('src/views/ConstructorView.jsx')),
  '…y reordenar con ↑ / ↓ en el constructor (apartado 35)');
ok(NO_EN_FIT38.length >= 5 && NO_EN_FIT38.every((x) => x.que && x.porque), 'Lo que no se hace, con su motivo');
ok(NO_EN_FIT38.some((x) => /C-32/.test(x.que) && /Josué/.test(x.porque)),
  '⚠️ …incluida la C-32: el tamaño de letra de los formularios lo decide Josué');
ok(NO_EN_FIT38.some((x) => /Miniaturas/.test(x.que) && /1600/.test(x.porque)),
  '…y las miniaturas de verdad, que serían otra subida (F26)');
ok(DECISIONES_FIT38.length >= 3 && DECISIONES_FIT38.every((x) => x.que && x.porque), 'Las decisiones, con su motivo');
const lib = leer('src/lib/movilFitness.js').replace(/\/\*[\s\S]*?\*\//g, '');
ok(!/saveData|localStorage|guardarFitness|setItem/.test(lib),
  '🚨 La fase no guarda nada: ni un dato nuevo ni una preferencia');
ok(!/from '\.\/(motorRangos|rangos|objetivosFitness|actividadEntrenamiento|ejercicios)\.js'/.test(lib),
  '🚨 …ni toca los motores del apartado 57: rango, objetivos, actividad ni catálogo');

console.log(`\n${fallos === 0 ? '\x1b[32m' : '\x1b[31m'}FIT F38: ${total - fallos}/${total} — ${total} comprobaciones\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);
