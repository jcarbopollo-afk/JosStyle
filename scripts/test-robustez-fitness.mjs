/* Entrega 4 · FIT F39/45 — Accesibilidad, estados límite y robustez de Fitness.
   ═══════════════════════════════════════════════════════════════════════════
   *"Fitness debe funcionar correctamente no solo con datos perfectos. […] La
   interfaz nunca debe quedar rota."* Lo que se mide aquí, en Node: el detector
   de lo que nunca se ve (`textoRoto`), los arreglos que destapó —el nombre de
   un ejercicio que ya no existe, la sesión que se quedó abierta días, las
   fechas y los números a medias—, la matriz de estados de las quince
   pantallas del apartado 57 contra los archivos de verdad, el diálogo
   accesible y las auditorías de diálogos, imágenes y campos, cada una con su
   ejemplo malo que tiene que cazar. Lo que se PINTA con datos corruptos lo
   mide `test-robustez-fitness.jsx`; el teclado y el usuario nuevo, Chromium. */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROHIBIDOS_A_LA_VISTA, textoVisible, porcentajesImposibles, textoRoto,
  ESTADOS_PANTALLA, MATRIZ_ESTADOS, FALLBACKS_FITNESS, YA_RESUELTO_F39, NO_EN_FIT39, DECISIONES_FIT39,
  etiquetasJsx, dialogosSinTeclado, imagenesSinRespaldo, camposSinNombre, CASILLAS_ROBUSTEZ, auditarRobustez,
} from '../src/lib/robustezFitness.js';
import { ARCHIVOS_FITNESS } from '../src/lib/feedbackFitness.js';
import { nombreSinCatalogo, nombreDeEjercicio, EJERCICIO_NO_DISPONIBLE, CATALOGO_EJERCICIOS } from '../src/lib/ejercicios.js';
import { formatFecha, FECHA_NO_DISPONIBLE } from '../src/lib/helpers.js';
import { crearObjetivo, DEFAULT_FITNESS } from '../src/lib/fitness.js';
import { listaDeObjetivos } from '../src/lib/objetivosProgreso.js';
import {
  HORAS_SESION_ANTIGUA, duracionCreible, sesionAntigua, desdeCuando, avisoDeRecuperacion,
  duracionSesion, normalizarFitnessConSesiones, sesionActiva,
} from '../src/lib/entrenamiento.js';
import { resumenDeSesion, pasarAFinalizacion, pantallaDeExito } from '../src/lib/finalizacion.js';
import { duracionConocida, fichaDeHistorial, sesionesDelHistorial } from '../src/lib/historial.js';
import { progresoDeEjercicio } from '../src/lib/progresion.js';
import { cabeceraDeEjercicio } from '../src/lib/detalleEjercicio.js';
import { resumenNoche } from '../src/lib/sueno.js';
import { validateExerciseCatalog } from '../src/lib/validacionCatalogo.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const archivos = Object.fromEntries(ARCHIVOS_FITNESS.filter((p) => existsSync(join(RAIZ, p))).map((p) => [p, leer(p)]));
const H = 3600000;
const DIA = 24 * H;

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

/* ═══ 1 · Lo que nunca se ve (apartado 2) ═════════════════════════════════ */
console.log('\n── 1 · Lo que nunca se ve (apartado 2) ──');
ok(PROHIBIDOS_A_LA_VISTA.map((p) => p.texto).join('|') === 'NaN|undefined|null|[object Object]|Invalid Date|Infinity',
  'Busca los seis que prohíbe el apartado: NaN, undefined, null, [object Object], Invalid Date e Infinity');
ok(textoRoto('<p>Press de banca · 60 kg</p><div style="width:40%"></div>').length === 0,
  'Una pantalla sana no da nada');
ok(textoRoto('<p>Duración NaN min</p>').length === 1 && textoRoto('<p>undefined → undefined</p>').length === 1
  && textoRoto('<p>[object Object]</p>').length === 1 && textoRoto('<p>Invalid Date</p>').length === 1,
  'Caza NaN, undefined, [object Object] e Invalid Date en el texto');
ok(textoRoto('<div style="width:NaN%"></div>').some((x) => /estilo/.test(x)),
  'Y en un estilo: un `width: NaN%` rompe una barra sin que se lea nada raro');
ok(textoRoto('<p class="undefined">Hola</p>').length === 0 && textoVisible('<p class="undefined">Hola</p>').trim() === 'Hola',
  'Lo que va en una clase no se lee: no cuenta como texto');
ok(textoRoto('<p>Anulación</p><p>nullable</p>').length === 0,
  'Con límite de palabra: «nullable» no es «null» (la lección de «experto» contiene «xp»)');
ok(porcentajesImposibles('Pecho 145 % · Espalda -20 % · Pierna 60 %').join('|') === '145 %|-20 %',
  'Apartado 29: un porcentaje por encima de 100 o negativo es imposible; 60 % no');
ok(textoRoto('<p>Zoom 180 %</p>', { porcentajes: false }).length === 0 && textoRoto('<p>Zoom 180 %</p>').length === 1,
  'Los porcentajes se pueden dejar fuera: un zoom al 180 % existe (el banco de renderizado entero los deja fuera)');

/* ═══ 2 · El nombre de un ejercicio que ya no existe (apartados 21 y 55) ══ */
console.log('\n── 2 · El nombre de un ejercicio que ya no existe (apartados 21 y 55) ──');
ok(nombreSinCatalogo('dominada-pronada-antigua') === 'Dominada pronada antigua',
  'Un id de catálogo se LEE: «dominada-pronada-antigua» → «Dominada pronada antigua» (el ejemplo del apartado 21)');
ok(nombreSinCatalogo('k3j9x2ab') === EJERCICIO_NO_DISPONIBLE && EJERCICIO_NO_DISPONIBLE === 'Ejercicio no disponible',
  '🚨 Uno propio borrado (un `uid()`, sin guiones) no dice nada: «Ejercicio no disponible», nunca «k3j9x2ab»');
ok(nombreSinCatalogo('') === EJERCICIO_NO_DISPONIBLE && nombreSinCatalogo(null) === EJERCICIO_NO_DISPONIBLE
  && nombreSinCatalogo('Press Banca') === EJERCICIO_NO_DISPONIBLE,
  'Sin id, o con algo que no es una ranura, tampoco');
ok(CATALOGO_EJERCICIOS.every((e) => /^[a-z]+(?:-[a-z0-9]+)*$/.test(e.id)),
  'Todos los ids del catálogo son ranuras en minúsculas (F2): la regla que los lee se apoya en eso');
ok(nombreDeEjercicio('press-banca-barra') === CATALOGO_EJERCICIOS.find((e) => e.id === 'press-banca-barra').nombre
  && nombreDeEjercicio('k3j9x2ab') === EJERCICIO_NO_DISPONIBLE,
  '`nombreDeEjercicio`: el suyo si existe, el leído si no — nunca el id pelado');
{
  const f = { ...DEFAULT_FITNESS, sesiones: [] };
  const p = progresoDeEjercicio(f, 'k3j9x2ab', {});
  const cab = cabeceraDeEjercicio('dominada-pronada-antigua', {});
  ok(p.nombre === EJERCICIO_NO_DISPONIBLE && cab.nombre === 'Dominada pronada antigua' && cab.aviso === 'Ejercicio archivado',
    'La progresión (F11) y la cabecera del detalle (F29) ya no enseñan el id; el detalle sigue diciendo «Ejercicio archivado»');
}
{
  const conId = ['src/lib/entrenamiento.js', 'src/lib/entrenamientoUx.js', 'src/lib/explicacionRangos.js', 'src/lib/historial.js',
    'src/lib/progresion.js', 'src/lib/detalleEjercicio.js', 'src/views/ClasificacionView.jsx', 'src/components/sustitucion.jsx']
    .filter((p) => /\?\s*ej\.nombre\s*:\s*(?:texto\()?(?:e\.|ejSesion\.|c\.)?exerciseId\)?[,}\s]|nombre:[^,\n]*\|\|\s*e\.exerciseId,|nombre:\s*id,/.test(leer(p)));
  ok(conId.length === 0, `🐛 Ninguno de los ocho sitios que caían al id pelado lo sigue haciendo${conId.length ? ` (quedan: ${conId.join(', ')})` : ''}`);
}

/* ═══ 3 · La sesión que se quedó abierta (apartados 19 y 26) ══════════════ */
console.log('\n── 3 · La sesión que se quedó abierta (apartados 19 y 26) ──');
const AHORA = new Date(2026, 8, 17, 18, 0).getTime();
const olvidada = { id: 'o', estado: 'en_curso', nombre: 'Push', iniciadaEn: AHORA - 3 * DIA, terminadaEn: null, pausadoMs: 0, origen: { ejercicios: [] } };
const reciente = { ...olvidada, id: 'r', iniciadaEn: AHORA - 40 * 60000 };
ok(HORAS_SESION_ANTIGUA === 6, 'Seis horas: más de lo que dura cualquier entrenamiento y menos que una noche');
ok(sesionAntigua(olvidada, AHORA) && !sesionAntigua(reciente, AHORA),
  'Una sesión abierta hace tres días es antigua; una de hace 40 minutos, no');
ok(!sesionAntigua({ ...olvidada, estado: 'completada' }, AHORA) && !sesionAntigua({ ...olvidada, iniciadaEn: null }, AHORA),
  'Solo una en curso o en pausa, y con marca de inicio: sin ella no se sabe nada');
ok(sesionAntigua({ ...olvidada, estado: 'pausada', iniciadaEn: AHORA - 10 * H, pausadaEn: AHORA - 9 * H, pausadoMs: 0 }, AHORA),
  'Se mira desde que EMPEZÓ: una pausa de toda la noche también la deja olvidada');
ok(duracionCreible(reciente, AHORA) === 40 * 60000 && duracionCreible(olvidada, AHORA) === null,
  '🚨 40 minutos es una duración; 72 horas no lo es: `null`');
ok(duracionCreible({ estado: 'en_curso', iniciadaEn: AHORA }, AHORA) === 0,
  'Una recién empezada dura 0 —el reloj arranca en «00:00»—, no «—»');
{
  const a = avisoDeRecuperacion(olvidada, { ahora: AHORA });
  ok(a.titulo === 'Hay un entrenamiento sin terminar' && a.antigua === true,
    'Apartado 19, literal: «Hay un entrenamiento sin terminar»');
  ok(a.continuar === 'Continuar' && a.finalizar === 'Finalizar' && a.descartar === 'Descartar',
    '…con Continuar, Finalizar y Descartar: no se decide nada por él');
  ok(a.duracion === '' && a.desde === 'Empezado el 14 sept',
    '🐛 …y sin el reloj de «72:00:00»: dice cuándo empezó');
  const b = avisoDeRecuperacion(reciente, { ahora: AHORA });
  /* 🔓 FIT F41 (C-43) — esta comprobación se DA LA VUELTA, no se borra: el
     apartado 6 de la F41 pide Finalizar también en la reciente, al volver a la
     aplicación. Lo que la F39 protegía —su reloj, no una fecha— sigue igual. */
  ok(b.titulo === 'Tienes un entrenamiento en curso' && b.antigua === false && b.finalizar === 'Finalizar' && b.duracion === '40:00',
    'Una reciente sigue con su reloj y «Continuar entrenamiento», y desde la F41 también con «Finalizar» (C-43)');
}
ok(desdeCuando({ iniciadaEn: AHORA - 2 * H }, AHORA) === 'Empezado hoy a las 16:00'
  && desdeCuando({ iniciadaEn: AHORA - DIA }, AHORA) === 'Empezado ayer'
  && desdeCuando({ iniciadaEn: null }, AHORA) === '',
  '«Empezado hoy a las 16:00», «Empezado ayer»; sin marca, nada');
{
  const terminada = pasarAFinalizacion(olvidada, { ahora: AHORA });
  const r = resumenDeSesion(terminada, { ahora: AHORA });
  ok(terminada.estado === 'finalizando' && r.duracion === '' && r.duracionMs === 0 && r.reloj === '',
    '🐛 Finalizarla lleva al resumen de la F8 SIN «72 h»: la duración no se sabe y no se dice');
  ok(pantallaDeExito(terminada, { ahora: AHORA }).duracion === '—',
    'Apartado 26: en la pantalla de éxito, «—» bajo «Duración», no un hueco');
  const guardada = { ...terminada, estado: 'completada', fecha: '2026-09-14' };
  ok(!duracionConocida(guardada) && fichaDeHistorial(guardada, { hoy: '2026-09-17' }).duracion === '',
    '…y en el historial tampoco: `duracionConocida` exige que sea creíble');
  ok(duracionConocida({ iniciadaEn: AHORA - H, terminadaEn: AHORA }) && resumenDeSesion({ ...reciente, terminadaEn: AHORA }, { ahora: AHORA }).duracion === '40 min',
    'Una sesión normal sigue diciendo su duración: «40 min»');
}
{
  const crudo = { ...DEFAULT_FITNESS, sesiones: [olvidada] };
  const f = normalizarFitnessConSesiones(crudo);
  ok(sesionActiva(f) && sesionActiva(f).id === 'o',
    'La puerta de carga no la toca: sigue activa y se ofrece. No se decide sola (apartado 19)');
}
{
  const vista = leer('src/views/FitnessView.jsx');
  ok(/onFinalizarSesion=\{pendiente && guardarF[\s\S]{0,120}pasarAFinalizacion\(pendiente\)[\s\S]{0,80}guardarSesionViva\(s\);[\s\S]{0,40}setEntrenando\(s\.id\)/.test(vista),
    'Fitness cablea «Finalizar»: pasa la sesión al resumen, la guarda y lo abre');
  ok(/onFinalizar=\{onFinalizarSesion\}/.test(vista) && /datos\.finalizar && onFinalizar/.test(leer('src/views/EntrenamientoVivoView.jsx')),
    '…y la tarjeta solo lo pinta si llega la función (un botón sin quien lo escuche sería la regla 8)');
  ok(/duracionCreible\(sesion, ahora\) === null \? '—'/.test(leer('src/views/EntrenamientoVivoView.jsx')),
    'El reloj del entrenamiento en vivo dice «—» si la sesión se retoma días después');
}

/* ═══ 4 · Fechas, números y listas a medias (apartados 2, 25, 51) ═════════ */
console.log('\n── 4 · Fechas, números y listas a medias (apartados 2, 25 y 51) ──');
/* ⚠️ El formato exacto lo pone el ICU de cada entorno («14/09» en el iPhone,
   «14/9» en algún Node): se comprueba que sea la fecha, no sus ceros. */
ok(/^14\/0?9$/.test(formatFecha('2026-09-14')) && formatFecha(undefined) === FECHA_NO_DISPONIBLE
  && formatFecha('2026-13-45') === FECHA_NO_DISPONIBLE && formatFecha('') === FECHA_NO_DISPONIBLE,
  '🐛 `formatFecha` sin fecha o con una imposible: «Fecha no disponible», nunca «Invalid Date» (apartado 25)');
ok(crearObjetivo({ exerciseId: 'dominada-prona', fechaObjetivo: '2026-02-30' }).fechaObjetivo === ''
  && crearObjetivo({ exerciseId: 'dominada-prona', fechaObjetivo: '2026-03-01' }).fechaObjetivo === '2026-03-01',
  '🐛 Una fecha objetivo que no existe («30 de febrero») no se guarda: la forma no basta (E3 F9)');
{
  const crudo = { objetivos: [null, 'x', { id: 'a', tipo: 'inventado', valor: 3 }, { id: 'b', exerciseId: 'dominada-prona', tipo: 'reps', valor: 12 }] };
  let r = null;
  let error = null;
  try { r = listaDeObjetivos(crudo); } catch (e) { error = e; }
  ok(!error && r.total === 1 && r.objetivos[0].id === 'b',
    '🐛 `listaDeObjetivos` con objetivos a medias no tumba Progreso: aplica la regla de la carga (`normalizarObjetivo`)');
}
ok(resumenNoche({ id: 'x', fecha: '2026-09-14' }).horas === '—' && resumenNoche({ horaDormir: '23:00', horaDespertar: '07:00' }).horas === '23:00 → 07:00',
  '🐛 Una noche de Sueño sin horas dice «—», no «undefined → undefined» (lo cazó el banco de renderizado)');
{
  const roto = [{ ...CATALOGO_EJERCICIOS[0], id: 'sin-dificultad', dificultad: undefined, patron: undefined }];
  const textos = validateExerciseCatalog(roto).errors.map((e) => e.mensaje || e.texto || JSON.stringify(e)).join(' ');
  ok(!/«undefined»/.test(textos) && /«\(ninguno\)»/.test(textos),
    '🐛 El diagnóstico del catálogo dice «(ninguno)», no «la dificultad «undefined» no existe»');
}
{
  const vista = leer('src/views/WellbeingView.jsx');
  ok(/Number\.isFinite\(Number\(r\.minutos\)\)/.test(vista),
    '🐛 Bienestar digital cuenta solo minutos que son números: un registro a medias daba «Productividad NaN %»');
}

/* ═══ 5 · La matriz de estados (apartados 56 y 57) ════════════════════════ */
console.log('\n── 5 · La matriz de estados (apartados 56 y 57) ──');
const PANTALLAS_57 = ['Rangos', 'Progreso', 'Fotos', 'Objetivos', 'Entrenamiento', 'Tu Plan', 'Planes', 'Plantillas', 'Constructor',
  'Entrenamiento en vivo', 'Historial', 'Biblioteca de ejercicios', 'Detalle de un ejercicio', 'Clasificación', 'Detalle muscular de un rango'];
ok(ESTADOS_PANTALLA.join('|') === 'LOADING|READY|EMPTY|NO_RESULTS|PARTIAL|ERROR', 'Los seis estados del apartado 56');
ok(PANTALLAS_57.every((p) => MATRIZ_ESTADOS.some((m) => m.pantalla === p)) && MATRIZ_ESTADOS.length === PANTALLAS_57.length,
  'Las quince pantallas del apartado 57, ni una más ni una menos');
{
  const huecos = [];
  const noEsta = [];
  let resueltos = 0;
  let noAplican = 0;
  MATRIZ_ESTADOS.forEach((m) => ESTADOS_PANTALLA.forEach((e) => {
    const v = m.estados[e];
    if (!v) { huecos.push(`${m.pantalla}·${e}`); return; }
    if (v.noAplica) { noAplican += 1; if (typeof v.noAplica !== 'string' || v.noAplica.length < 15) huecos.push(`${m.pantalla}·${e} sin motivo`); return; }
    if (v.texto !== undefined) { if (typeof v.texto === 'string' && v.texto.trim()) resueltos += 1; else noEsta.push(`${m.pantalla}·${e}`); return; }
    if (v.donde) {
      if (existsSync(join(RAIZ, v.donde)) && leer(v.donde).includes(v.muestra)) resueltos += 1;
      else noEsta.push(`${m.pantalla}·${e} (${v.donde})`);
      return;
    }
    huecos.push(`${m.pantalla}·${e} sin forma`);
  }));
  ok(huecos.length === 0, `Cada pantalla dice qué hace con los seis estados: ${MATRIZ_ESTADOS.length * 6} casillas${huecos.length ? ` — huecos: ${huecos.join(', ')}` : ''}`);
  ok(noEsta.length === 0, `🚨 Y cada una que dice resolverse se ENCUENTRA en el código (${resueltos}; ${noAplican} no aplican, con su motivo)${noEsta.length ? ` — no están: ${noEsta.join(', ')}` : ''}`);
}
{
  const falsa = { pantalla: 'X', estados: { EMPTY: { donde: 'src/views/ProgresoView.jsx', muestra: 'Un texto que no existe en ningún sitio' } } };
  ok(!leer(falsa.estados.EMPTY.donde).includes(falsa.estados.EMPTY.muestra),
    '…y una casilla que miente se detectaría: un texto que no está en su archivo no se encuentra');
}
ok(FALLBACKS_FITNESS.map((f) => f.id).join('|') === 'MissingImage|MissingData|ErrorState|EmptyState|LoadingState|PersistenceError|NotAvailable',
  'Apartado 52: los siete respaldos que enumera');
ok(FALLBACKS_FITNESS.every((f) => leer(f.donde).includes(f.muestra)) && FALLBACKS_FITNESS.filter((f) => f.nuevo).length === 2,
  '🚨 …cada uno donde dice, y solo DOS nacen aquí: los otros cinco ya existían y no se duplican');

/* ═══ 6 · El teclado en los diálogos (apartados 36-38) ════════════════════ */
console.log('\n── 6 · El teclado en los diálogos (apartados 36-38) ──');
{
  const hook = leer('src/components/dialogoAccesible.js');
  ok(/ev\.key === 'Escape'/.test(hook) && /ev\.key !== 'Tab'/.test(hook) && /ev\.shiftKey/.test(hook),
    'El diálogo accesible atiende Escape, Tab y Mayús+Tab');
  ok(/const antes = document\.activeElement/.test(hook) && /antes\.focus\(/.test(hook),
    '…recuerda quién lo abrió y le devuelve el foco al cerrar (apartado 38)');
  ok(/caja\.focus\(/.test(hook) && /tabIndex=\{-1\}|tabIndex/.test(leer('src/views/RangosView.jsx')),
    '…mete el foco en la caja al abrirse, que lleva `tabIndex={-1}`');
  ok(/pila\[pila\.length - 1\] !== token/.test(hook),
    '⚠️ …y con dos abiertos solo manda el de arriba: un Escape no los cierra todos');
  const velos = Object.entries(archivos).filter(([, src]) => etiquetasJsx(src, 'div').some(({ tag }) => /className=(?:"|\{`)fixed inset-0\b/.test(tag)));
  ok(velos.length === 7, `Las hojas de Fitness están en ${velos.length} archivos (ocho hojas: dos en la clasificación)`);
  ok(velos.every(([, src]) => /useDialogoAccesible\(/.test(src)), '🚨 …y todos usan el diálogo accesible');
  ok(/role="dialog"[\s\S]{0,40}aria-modal="true"[\s\S]{0,40}aria-label="Historial del rango"/.test(leer('src/components/historialRango.jsx')),
    '🐛 El historial de un rango era la única hoja sin `role`, sin `aria-modal` y sin nombre');
  ok(!/document\.addEventListener\('keydown'/.test(leer('src/components/sustitucion.jsx')),
    'La hoja de sustituir (F33) ya no lleva su Escape propio: usa el de todas');
}
ok(dialogosSinTeclado('<div className="fixed inset-0 z-50" onClick={x}><div/></div>').length === 1
  && dialogosSinTeclado('const c = useDialogoAccesible(true, x);\n<div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Algo"></div>').length === 0,
  'La auditoría caza un velo sin diálogo accesible y deja pasar uno completo');
ok(dialogosSinTeclado('const c = useDialogoAccesible(true, x);\n<div className="fixed inset-0" onClick={() => a > b}></div>')[0]?.falta.join('|') === 'role="dialog"|aria-modal|aria-label',
  '…y un `=>` dentro de un atributo no le corta la etiqueta: sigue viendo lo que falta');
{
  const css = leer('src/index.css');
  ok(/\.fit-foco :focus-visible,\s*\.dialogo-caja :focus-visible \{\s*outline: 2px solid var\(--accent, currentColor\);/.test(css),
    'Apartado 37: un anillo de foco con el acento, solo con `:focus-visible`, en Fitness y sus hojas');
  ok(/\.fit-foco \{ display: contents; \}/.test(css) && /<div className="fit-foco">/.test(leer('src/views/FitnessView.jsx')),
    '…que envuelve Fitness sin añadirle una caja al diseño (`display: contents`)');
}

/* ═══ 7 · Imágenes y campos (apartados 22 y 41) ═══════════════════════════ */
console.log('\n── 7 · Imágenes y campos (apartados 22 y 41) ──');
ok(imagenesSinRespaldo('<img src={u} alt="" />').length === 1 && imagenesSinRespaldo('<img src={u} alt="" onError={() => f()} />').length === 0,
  'Una `<img>` sin `onError` se caza; con él, no');
ok(camposSinNombre('<input value={x} onChange={(e) => s(e.target.value)} placeholder="Peso" />').length === 1,
  'Apartado 41: un campo que solo tiene `placeholder` no tiene nombre');
ok(camposSinNombre('<input value={x} onChange={(e) => s(e.target.value)} aria-label="Peso" />').length === 0
  && camposSinNombre('<label><span>Peso</span><input value={x} /></label>').length === 0
  && camposSinNombre('<Field label="Nota"><Textarea value={n} /></Field>').length === 0,
  '…y con `aria-label`, dentro de un `<label>` o de un `<Field>`, sí');
{
  const r = auditarRobustez({ archivos });
  ok(r.casillas.map((c) => c.id).join('|') === CASILLAS_ROBUSTEZ.map((c) => c.id).join('|'), 'La auditoría tiene sus tres casillas');
  r.casillas.forEach((c) => ok(c.ok, `${c.id}: ${c.dato}`));
  const malo = auditarRobustez({ archivos: { ...archivos, 'x.jsx': '<img src={u} alt="" />\n<input placeholder="Peso" />\n<div className="fixed inset-0"></div>' } });
  ok(malo.casillas.every((c) => !c.ok), '…y un archivo malo pone las tres rojas');
}
ok(ARCHIVOS_FITNESS.includes('src/components/actividadEntrenamiento.jsx') && ARCHIVOS_FITNESS.includes('src/components/planificacionSemanal.jsx')
  && ARCHIVOS_FITNESS.includes('src/components/colaClasificacion.jsx'),
  '🐛 La lista de archivos de Fitness (F37) se había dejado fuera la actividad, la semana planificada y la cola');
ok(/import \{ MissingImage \}/.test(leer('src/components/bibliotecaEjercicios.jsx')) && /respaldo=\{icono\}/.test(leer('src/components/bibliotecaEjercicios.jsx')),
  '🐛 La miniatura de un ejercicio que no carga vuelve al icono de su grupo, no a la imagen rota');

/* ═══ 8 · Lo declarado ════════════════════════════════════════════════════ */
console.log('\n── 8 · Lo que ya estaba, lo que no se hace y las decisiones ──');
ok(YA_RESUELTO_F39.length >= 20 && YA_RESUELTO_F39.every((y) => y.apartado && y.que && y.donde),
  `Lo que ya resolvían otras fases, con dónde (${YA_RESUELTO_F39.length} apartados)`);
ok(NO_EN_FIT39.every((n) => n.que && n.porque && n.porque.length > 30) && NO_EN_FIT39.some((n) => /contraste/i.test(n.que)),
  'Lo que no se hace, cada uno con su motivo —el contraste, entre ellos—');
ok(DECISIONES_FIT39.length === 4 && DECISIONES_FIT39.every((d) => d.que && d.porque), 'Las cuatro decisiones, con su motivo');
{
  const lib = leer('src/lib/robustezFitness.js').replace(/\/\*[\s\S]*?\*\//g, '');
  ok(!/saveData|localStorage|setItem|guardarFitness/.test(lib), '🚨 La fase no guarda nada');
  ok(!/from '\.\/(motorRangos|rangos)\.js'/.test(lib) && !/RANK_THRESHOLDS|puntuacion\(/.test(lib),
    '🚨 …y no toca las fórmulas de rangos ni de progreso (su «IMPORTANTE»)');
}

console.log(`\n${fallos === 0 ? '\x1b[32m' : '\x1b[31m'}FIT F39: ${total - fallos}/${total} — ${total} comprobaciones\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);
