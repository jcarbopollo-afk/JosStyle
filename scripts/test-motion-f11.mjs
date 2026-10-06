/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · FASE 11 — orquestación global, coordinación y motion engine avanzado

   Se ejecuta con:  node --import ./scripts/resolver-vite.mjs scripts/test-motion-f11.mjs

   Lo que se comprueba aquí es el ORQUESTADOR con dobles de elemento —quién manda
   en cada propiedad, quién cede, desde dónde sigue lo interrumpido, los grupos,
   la línea de tiempo, la depuración— y que TODA animación de la aplicación pase
   por él. Lo que necesita un navegador —que el dedo tome el control de una hoja
   mientras sube, tocar deprisa sin dejar nada a medias, la consola de
   depuración— está en la sección «MS F11» de `test-app-real.mjs`.
   =========================================================================== */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  PRIORIDADES_MOTION, pesoDe, SISTEMAS_MOTION, sistemaMotion, duenoDeEntrada, propiedadesDe, chocan, resolverConflicto,
  planificarLinea, ESTADOS_MOTION, CLAVE_DEPURACION, forzarDepuracion, depurando, EVENTOS_MOTION, TOPE_DIARIO, diarioMotion,
  vaciarDiario, animacionesDe, PRESUPUESTO_ORQUESTADOR, enMarcha, animarOrquestado, tomarControl, cancelarDe, iniciarGrupo,
  estadoDeGrupo, cancelarGrupo, completarGrupo, terminaGrupo, estadoGlobalMotion, olvidarTodo, crearLinea, CICLO_TRANSICION,
  faseDelCiclo, PIEZAS_CON_CICLO, PRESETS_ORQUESTADOS, CUANDO_CADA_HERRAMIENTA, CATEGORIAS_TOKENS, ANIMAN_DIRECTAMENTE,
  PIEZAS_DE_MOVIMIENTO, LIMPIEZA_DECLARADA, auditarOrquestacion, censoMotion, AUDITORIA_F11, NO_EN_F11, apiDeDepuracion,
} from '../src/lib/orquestadorMotion.js';
import { MOTION_MAP } from '../src/lib/motionMapa.js';
import { ESTADOS_PRESENCIA } from '../src/lib/motion.js';
import { ESTADOS_GESTO } from '../src/lib/fisicaMotion.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

let ok_ = 0;
let mal = 0;
function ok(cond, msg) {
  if (cond) { ok_ += 1; console.log(`  \x1b[32m✓\x1b[0m ${msg}`); } else { mal += 1; console.log(`  \x1b[31m✗ ${msg}\x1b[0m`); }
}
const tic = () => new Promise((r) => setTimeout(r, 0));

/* Todos los archivos de src/, para las auditorías. */
const ARCHIVOS = {};
const recorrer = (dir) => readdirSync(join(RAIZ, dir)).forEach((f) => {
  const p = `${dir}/${f}`;
  if (statSync(join(RAIZ, p)).isDirectory()) recorrer(p);
  else if (/\.(jsx?|mjs)$/.test(f)) ARCHIVOS[p] = leer(p);
});
recorrer('src');

/* ── Dobles: un elemento con `animate` y una animación con su promesa `finished`. ── */
function animacionDoble(fotogramas, opciones) {
  let resolver;
  let rechazar;
  const a = {
    id: opciones.id || '', playState: 'running', currentTime: 0, playbackRate: 1, fotogramas, opciones,
    effect: { getKeyframes: () => fotogramas, getTiming: () => ({ delay: opciones.delay || 0, duration: opciones.duration }) },
    finished: new Promise((r, j) => { resolver = r; rechazar = j; }),
    cancel() { if (this.playState === 'idle' || this.playState === 'finished') return; this.playState = 'idle'; rechazar(new Error('cancelada')); },
    finish() { if (this.playState === 'idle' || this.playState === 'finished') return; this.playState = 'finished'; resolver(this); },
    pause() { this.playState = 'paused'; },
    play() { this.playState = 'running'; },
    reverse() { this.playbackRate *= -1; },
  };
  a.finished.catch(() => {});
  return a;
}
function elementoDoble(estilo = {}, { falla = false } = {}) {
  return {
    style: { ...estilo },
    todas: [],
    animate(fotogramas, opciones = {}) {
      if (falla) throw new Error('El navegador no puede');
      const a = animacionDoble(fotogramas, opciones);
      this.todas.push(a);
      return a;
    },
    getAnimations() { return this.todas.filter((a) => a.playState === 'running' || a.playState === 'paused'); },
  };
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Las prioridades (apartado 7) ──');
ok(PRIORIDADES_MOTION.map((p) => p.id).join() === 'critica,navegacion,gesto,estado,layout,micro,decorativa', 'siete prioridades, en el orden del enunciado: CRITICAL > NAVIGATION > GESTURE > STATE > LAYOUT > MICRO > DECORATIVE');
ok(PRIORIDADES_MOTION.every((p, i, l) => i === 0 || l[i - 1].peso > p.peso) && PRIORIDADES_MOTION.every((p) => p.que), '…cada una pesa menos que la anterior y dice qué es');
ok(pesoDe('navegacion') > pesoDe('micro') && pesoDe('inventada') === pesoDe('decorativa'), '🚨 una navegación no pierde frente a una microinteracción, y una prioridad que no existe pesa lo mínimo');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. Quién manda en cada movimiento (apartados 1, 2 y 3) ──');
const ids = SISTEMAS_MOTION.map((s) => s.id);
ok(['motor', 'navegacion', 'scroll', 'micro', 'datos', 'gestos', 'profundidad', 'continuidad', 'estados', 'layout', 'decorativa'].every((i) => ids.includes(i)) && new Set(ids).size === ids.length, `el mapa de responsabilidad: ${ids.length} sistemas, cada uno una vez`);
ok(SISTEMAS_MOTION.every((s) => PRIORIDADES_MOTION.some((p) => p.id === s.prioridad) && s.manda && s.via.length && s.propiedades.length), '…cada uno con su prioridad, lo que manda, por dónde anima y qué propiedades toca');
{
  const faltan = SISTEMAS_MOTION.flatMap((s) => s.archivos.filter((a) => !existsSync(join(RAIZ, a))).map((a) => `${s.id}: ${a}`));
  ok(faltan.length === 0, `…y sus archivos existen de verdad${faltan.length ? ` — ${faltan.join(', ')}` : ''}`);
}
ok(sistemaMotion('layout').fase === 10 && sistemaMotion('nadie') === null, '`sistemaMotion` encuentra un sistema por su id');
{
  const sinDueno = MOTION_MAP.filter((e) => !sistemaMotion(duenoDeEntrada(e)));
  ok(sinDueno.length === 0, `🚨 CADA ANIMACIÓN TIENE UN DUEÑO: las ${MOTION_MAP.length} del MOTION_MAP${sinDueno.length ? ` — sin dueño: ${sinDueno.map((e) => e.id).join(', ')}` : ''}`);
  ok(duenoDeEntrada(MOTION_MAP.find((e) => e.id === 'borrar_elemento')) === 'layout' && duenoDeEntrada(MOTION_MAP.find((e) => e.id === 'plegable')) === 'layout' && duenoDeEntrada(null) === null, '…la de borrar en una lista es de Layout, y nada no es de nadie');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Propiedades y conflictos (apartados 8 y 9) ──');
ok(propiedadesDe([{ transform: 'x', offset: 0, easing: 'linear' }, { clipPath: 'y', backgroundColor: 'z', composite: 'add' }]).join() === 'background-color,clip-path,transform', 'las propiedades de unos fotogramas, en CSS, sin lo que no es propiedad (`offset`, `easing`, `composite`)');
ok(chocan(['transform', 'opacity'], ['opacity', 'filter']).join() === 'opacity' && chocan(['transform'], ['translate', 'scale']).length === 0, '🚨 `transform` y `translate`/`scale` NO chocan: el navegador las compone (así se combinan dos sistemas sin pisarse, apartado 9)');
{
  const r = (a, b) => resolverConflicto(a, b);
  const nav = { sistema: 'continuidad', prioridad: 'navegacion', propiedades: ['transform'] };
  const micro = { sistema: 'micro', prioridad: 'micro', propiedades: ['transform'] };
  ok(r(nav, { ...micro, propiedades: ['opacity'] }).accion === 'coexisten', 'otra propiedad: conviven');
  ok(r(nav, micro).accion === 'cede' && r(nav, micro).motivo === 'prioridad', '🚨 una microinteracción CEDE ante una navegación sobre la misma propiedad');
  ok(r(micro, nav).accion === 'interrumpe' && r(micro, nav).motivo === 'prioridad', '…y una navegación INTERRUMPE a una microinteracción');
  ok(r(nav, nav).motivo === 'mismo_sistema' && r(nav, { ...nav, sistema: 'profundidad' }).motivo === 'la_ultima', '…con el mismo peso gana la última (un cambio a mitad de otro sale de donde se ve)');
  ok(r(null, nav).accion === 'coexisten', 'sin otra, nada que resolver');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. La línea de tiempo (apartados 4, 5 y 6) ──');
{
  const sec = planificarLinea([{ id: 'A', duracion: 100 }, { id: 'B', duracion: 50, despuesDe: 'A' }, { id: 'C', duracion: 30, despuesDe: 'B' }]);
  ok(sec.pasos.map((p) => `${p.id}${p.inicio}-${p.fin}`).join() === 'A0-100,B100-150,C150-180' && sec.total === 180, 'secuencial: A → B → C');
  const par = planificarLinea([{ id: 'A', duracion: 100 }, { id: 'B', duracion: 60 }]);
  ok(par.pasos.every((p) => p.inicio === 0) && par.total === 100, 'paralelo: sin dependencias, a la vez');
  const esc = planificarLinea([0, 1, 2].map((i) => ({ id: `f${i}`, duracion: 220, escalonado: { indice: i, paso: 60 } })));
  ok(esc.pasos.map((p) => p.inicio).join() === '0,60,120', 'escalonado: 0, 60, 120');
  const ret = planificarLinea([{ id: 'A', duracion: 100, retraso: 40 }]);
  ok(ret.pasos[0].inicio === 40 && ret.total === 140, 'retrasado');
  const dep = planificarLinea([{ id: 'A', duracion: 10 }, { id: 'B', duracion: 100 }, { id: 'C', duracion: 220 }, { id: 'E', duracion: 160 }, { id: 'D', duracion: 50, despuesDe: ['B', 'C', 'E'] }]);
  ok(dep.pasos.find((p) => p.id === 'D').inicio === 220, '🚨 dependiente: D espera a B, C y E (el dibujo del apartado 5)');
  const sol = planificarLinea([{ id: 'sale', duracion: 160 }, { id: 'recoloca', duracion: 220, despuesDe: 'sale', solape: 0.5 }]);
  ok(sol.pasos[1].inicio === 80, 'solapado: lo que se recoloca empieza a MITAD de la salida (la lista de la F10)');
  const sinSalida = planificarLinea([{ id: 'sale', duracion: 0 }, { id: 'recoloca', duracion: 220, despuesDe: 'sale', solape: 0.5 }]);
  ok(sinSalida.pasos[1].inicio === 0, '…y sin nada que salga, empieza ya');
  let ciclo = null;
  try { planificarLinea([{ id: 'A', duracion: 1, despuesDe: 'B' }, { id: 'B', duracion: 1, despuesDe: 'A' }]); } catch (e) { ciclo = e.message; }
  ok(/ciclo/.test(ciclo || ''), 'un ciclo se dice, no cuelga la pantalla');
  let falta = null;
  try { planificarLinea([{ id: 'A', duracion: 1, despuesDe: 'X' }]); } catch (e) { falta = e.message; }
  ok(/no existe: X/.test(falta || ''), '…y depender de un paso que no existe, también');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. El registro: animar, ceder, interrumpir, convivir (apartados 8, 14, 16, 28 y 38) ──');
olvidarTodo();
{
  const el = elementoDoble({ transform: 'translateY(40px)', opacity: '0.5' });
  const a = animarOrquestado(el, [{ transform: 'scale(1.02)' }, { transform: 'none' }], { duration: 280 }, { sistema: 'continuidad', id: 'llegada' });
  ok(!!a && animacionesDe(el).length === 1 && animacionesDe(el)[0].prioridad === 'navegacion', 'una animación queda APUNTADA, con la prioridad de su sistema');
  ok(estadoGlobalMotion().estado === 'running' && estadoGlobalMotion().porSistema.continuidad === 1, '…y el estado global la cuenta');
  const b = animarOrquestado(el, [{ transform: 'scale(0.96)' }, { transform: 'none' }], { duration: 160 }, { sistema: 'micro' });
  ok(b === null && a.playState === 'running', '🚨 una microinteracción sobre el mismo `transform` CEDE: no empieza y la de navegación sigue');
  const c = animarOrquestado(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 160 }, { sistema: 'micro' });
  ok(!!c && animacionesDe(el).length === 2, '…pero sobre `opacity`, CONVIVE');
  const d = animarOrquestado(el, [{ transform: 'translateY(100px)' }, { transform: 'none' }], { duration: 280 }, { sistema: 'profundidad', prioridad: 'critica', desdeLoQueSeVe: true });
  ok(!!d && a.playState === 'idle' && d.fotogramas[0].transform === 'translateY(40px)', '🚨 una más importante INTERRUMPE: la de antes se cancela y la nueva SALE DE DONDE SE VE (apartado 14)');
  await tic();
  ok(animacionesDe(el).map((r) => r.sistema).sort().join() === 'micro,profundidad', '…y la interrumpida ya no está apuntada');
  d.finish();
  c.finish();
  await tic();
  ok(animacionesDe(el).length === 0 && estadoGlobalMotion().estado === 'idle', 'al terminar se borran solas: el estado vuelve a idle');
  /* La carrera del apartado 16: el final de una vieja no puede borrar a la nueva. */
  const e1 = animarOrquestado(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 100 }, { sistema: 'layout' });
  const e2 = animarOrquestado(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 100 }, { sistema: 'layout' });
  e1.finish();
  await tic();
  ok(animacionesDe(el).length === 1 && animacionesDe(el)[0].anim === e2, '🐛 la carrera: A empieza, B la interrumpe, A «acaba» — y B sigue apuntada (cada final borra SU registro)');
  e2.finish();
  await tic();
}
ok(animarOrquestado(null, [{ opacity: 0 }]) === null && animarOrquestado({}, [{ opacity: 0 }]) === null && animarOrquestado(elementoDoble(), []) === null, 'sin elemento, sin `animate` o sin fotogramas: `null`, y el elemento queda en su estado final (apartado 28)');
{
  const roto = elementoDoble({}, { falla: true });
  let lanzo = false;
  let r;
  try { r = animarOrquestado(roto, [{ opacity: 0 }, { opacity: 1 }], { duration: 100 }, { sistema: 'estados' }); } catch { lanzo = true; }
  ok(!lanzo && r === null, '🚨 si el navegador falla, ni se rompe ni bloquea nada: `null` y a seguir (apartado 38)');
}
{
  const antes = globalThis.document;
  globalThis.document = { documentElement: { getAttribute: (n) => (n === 'data-motion' ? 'off' : null) } };
  const r = animarOrquestado(elementoDoble(), [{ opacity: 0 }, { opacity: 1 }], { duration: 100 }, { sistema: 'continuidad' });
  if (antes === undefined) delete globalThis.document; else globalThis.document = antes;
  ok(r === null, '🚨 «Sin movimiento» es una política del orquestador: no empieza NADA (apartado 27)');
}
{
  olvidarTodo();
  const els = Array.from({ length: PRESUPUESTO_ORQUESTADOR.simultaneas }, () => elementoDoble());
  els.forEach((el) => animarOrquestado(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 }, { sistema: 'layout' }));
  ok(enMarcha() === PRESUPUESTO_ORQUESTADOR.simultaneas, `${PRESUPUESTO_ORQUESTADOR.simultaneas} a la vez…`);
  ok(animarOrquestado(elementoDoble(), [{ opacity: 0 }, { opacity: 1 }], { duration: 100 }, { sistema: 'micro' }) === null && animarOrquestado(elementoDoble(), [{ opacity: 0 }, { opacity: 1 }], { duration: 100 }, { sistema: 'decorativa' }) === null, '🚨 …y con el presupuesto lleno, lo micro y lo decorativo NO empiezan (apartado 30)');
  ok(!!animarOrquestado(elementoDoble(), [{ opacity: 0 }, { opacity: 1 }], { duration: 100 }, { sistema: 'continuidad' }), '…pero una navegación sí: el presupuesto recorta lo que sobra, no lo que importa');
  olvidarTodo();
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. El dedo toma el control, y cada sistema para lo suyo (apartado 14) ──');
{
  const caja = elementoDoble({ transform: 'matrix(1, 0, 0, 1, 0, 120)' });
  const entrada = animarOrquestado(caja, [{ transform: 'translateY(400px)' }, { transform: 'none' }], { duration: 280 }, { sistema: 'profundidad', id: 'capa-entra' });
  const css = caja.animate([{ transform: 'translateX(20px)' }, { transform: 'none' }], { id: 'una-entrada-css' });
  const opac = animarOrquestado(caja, [{ opacity: 0 }, { opacity: 1 }], { duration: 280 }, { sistema: 'profundidad' });
  const visto = tomarControl(caja, ['transform'], 'gestos');
  ok(visto.transform === 'matrix(1, 0, 0, 1, 0, 120)', '🚨 al agarrar, se lee lo que se VE antes de parar nada: el dedo sigue desde ahí');
  ok(entrada.playState === 'idle' && css.playState === 'idle', '…se para lo que movía la caja —la entrada de la capa y una que no pasó por el orquestador—, sea cual sea su prioridad');
  ok(opac.playState === 'running', '…y solo eso: la opacidad sigue');
  const l1 = animarOrquestado(caja, [{ transform: 'translate(0, 9px)' }, { transform: 'none' }], { duration: 220 }, { sistema: 'layout' });
  cancelarDe(caja, 'gestos');
  ok(l1.playState === 'running', '`cancelarDe` solo para lo de SU sistema…');
  cancelarDe(caja, 'layout');
  ok(l1.playState === 'idle', '…y lo para');
  ok(Object.keys(tomarControl(null, ['transform'])).length === 0, 'sin elemento, nada');
  olvidarTodo();
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. Los grupos y el estado global (apartados 12 y 13) ──');
{
  ok(ESTADOS_MOTION.join() === 'idle,running,interrupting,cancelled,completed', 'los cinco estados del apartado 13');
  ok(estadoDeGrupo('capas-prueba') === 'idle', 'un grupo que no ha empezado: idle');
  const v = elementoDoble();
  const c = elementoDoble();
  const a1 = animarOrquestado(v, [{ backgroundColor: 'red' }, { backgroundColor: 'blue' }], { duration: 160 }, { sistema: 'profundidad', grupo: 'capas-prueba' });
  const a2 = animarOrquestado(c, [{ transform: 'translateY(9px)' }, { transform: 'none' }], { duration: 280 }, { sistema: 'profundidad', grupo: 'capas-prueba' });
  ok(estadoDeGrupo('capas-prueba') === 'running' && estadoGlobalMotion().grupos['capas-prueba'] === 'running', 'el velo y la caja son UNA operación: el grupo está running');
  a1.finish();
  a2.finish();
  await tic();
  ok(estadoDeGrupo('capas-prueba') === 'completed', '…y completed cuando terminan los dos');
  const b1 = animarOrquestado(c, [{ opacity: 0 }, { opacity: 1 }], { duration: 280 }, { sistema: 'layout', grupo: 'lista-prueba' });
  ok(cancelarGrupo('lista-prueba') === 1 && b1.playState === 'idle' && estadoDeGrupo('lista-prueba') === 'cancelled', '`cancelarGrupo` para todo lo del grupo: cancelled');
  const n1 = animarOrquestado(c, [{ opacity: 0 }, { opacity: 1 }], { duration: 280 }, { sistema: 'continuidad', grupo: 'nav-prueba' });
  const corrida = iniciarGrupo('nav-prueba');
  ok(n1.playState === 'idle' && corrida >= 1 && estadoDeGrupo('nav-prueba') === 'idle', '🚨 iniciar un grupo que sigue en marcha lo INTERRUMPE primero: abrir otra pantalla antes de que termine la anterior (apartado 14)');
  const n2 = animarOrquestado(c, [{ opacity: 0 }, { opacity: 1 }], { duration: 280 }, { sistema: 'continuidad', grupo: 'nav-prueba' });
  const fin = terminaGrupo('nav-prueba');
  ok(completarGrupo('nav-prueba') === 1 && n2.playState === 'finished', '`completarGrupo` lo lleva al final…');
  ok(await fin === 'completed', '…y `terminaGrupo` se cumple cuando todo ha terminado');
  ok(cancelarGrupo('no-existe') === 0 && completarGrupo('no-existe') === 0 && await terminaGrupo('no-existe') === 'idle', 'un grupo que no existe no se queja');
  olvidarTodo();
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. Una línea de tiempo que se maneja (apartado 6) ──');
{
  const a = elementoDoble();
  const b = elementoDoble();
  const linea = crearLinea([
    { id: 'sale', el: a, fotogramas: [{ opacity: 1 }, { opacity: 0 }], duracion: 160 },
    { id: 'entra', el: b, fotogramas: [{ opacity: 0 }, { opacity: 1 }], duracion: 220, despuesDe: 'sale', solape: 0.5 },
  ], { grupo: 'linea-prueba', sistema: 'layout', pausada: true });
  ok(linea.animaciones.length === 2 && linea.animaciones[1].opciones.delay === 80 && linea.plan.total === 300, 'cada paso empieza cuando dice el plan (80 ms: a mitad de la salida)');
  ok(linea.animaciones.every((x) => x.playState === 'paused'), 'puede nacer pausada…');
  linea.reanudar();
  ok(linea.animaciones.every((x) => x.playState === 'running') && linea.estado() === 'running', '…reanudarse…');
  linea.pausar();
  ok(linea.animaciones.every((x) => x.playState === 'paused'), '…pausarse…');
  linea.irA(0.5);
  ok(linea.animaciones.every((x) => x.currentTime === 150), '…ir a un punto (la mitad de 300 ms)…');
  linea.invertir();
  ok(linea.animaciones.every((x) => x.playbackRate === -1), '…invertirse…');
  linea.completar();
  ok(await linea.terminado === 'completada', '…y completarse');
  const otra = crearLinea([{ id: 'x', el: elementoDoble(), fotogramas: [{ opacity: 0 }, { opacity: 1 }], duracion: 100 }]);
  otra.cancelar();
  ok(await otra.terminado === 'cancelada', 'una línea cancelada lo dice');
  olvidarTodo();
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. La depuración, solo en desarrollo (apartados 35-37) ──');
{
  ok(depurando() === false, '🚨 fuera de desarrollo (y sin la marca), la depuración NO existe: nada se apunta');
  ok(CLAVE_DEPURACION === 'josstyle:motion-debug', `se enciende con \`localStorage["${CLAVE_DEPURACION}"] = "1"\``);
  const el = elementoDoble();
  animarOrquestado(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 100 }, { sistema: 'layout' });
  ok(diarioMotion().length === 0, '…y sin depuración, el diario se queda vacío');
  olvidarTodo();
  const errorAntes = console.debug;
  console.debug = () => {};
  forzarDepuracion(true);
  const x = elementoDoble({ opacity: '1' });
  const a = animarOrquestado(x, [{ opacity: 0 }, { opacity: 1 }], { duration: 100 }, { sistema: 'continuidad', grupo: 'g' });
  animarOrquestado(x, [{ opacity: 1 }, { opacity: 0 }], { duration: 100 }, { sistema: 'micro' });
  animarOrquestado(x, [{ opacity: 1 }, { opacity: 0 }], { duration: 100 }, { sistema: 'profundidad', prioridad: 'critica' });
  animarOrquestado(elementoDoble({}, { falla: true }), [{ opacity: 1 }, { opacity: 0 }], { duration: 100 }, { sistema: 'estados' });
  animacionesDe(x).forEach((r) => r.anim.finish());
  await tic();
  const tipos = diarioMotion().map((e) => e.tipo);
  ok(EVENTOS_MOTION.every((t) => tipos.includes(t)), `con depuración, el diario apunta los cinco eventos del apartado 36 (${[...new Set(tipos)].join(', ')})`);
  ok(diarioMotion().find((e) => e.tipo === 'MOTION_START').sistema === 'continuidad' && diarioMotion().find((e) => e.tipo === 'MOTION_START').grupo === 'g' && a.playState === 'idle', '…con el sistema, la prioridad y el grupo de cada uno (apartado 35)');
  ok(diarioMotion().some((e) => e.tipo === 'MOTION_CANCEL' && e.motivo === 'cede'), '…y por qué no empezó una (cedió)');
  for (let i = 0; i < TOPE_DIARIO + 20; i += 1) animarOrquestado(elementoDoble(), [{ opacity: 0 }, { opacity: 1 }], { duration: 1 }, { sistema: 'layout' });
  ok(diarioMotion().length === TOPE_DIARIO, `el diario tiene tope (${TOPE_DIARIO}): no crece sin fin`);
  vaciarDiario();
  ok(diarioMotion().length === 0, '…y se vacía');
  forzarDepuracion(null);
  console.debug = errorAntes;
  ok(typeof apiDeDepuracion().estado === 'function' && typeof apiDeDepuracion().diario === 'function', '`window.__motion` (la consola) tiene el estado y el diario');
  const O = sinComentarios(leer('src/lib/orquestadorMotion.js'));
  ok(/import\.meta\.env\.DEV/.test(O) && /localStorage\.getItem\(CLAVE_DEPURACION\) === '1'/.test(O), '🚨 …y solo existe en desarrollo y con la marca: Josué no la ve nunca');
  olvidarTodo();
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 10. El ciclo de vida, los presets, las herramientas y los tokens (apartados 18, 32, 33 y 34) ──');
ok(CICLO_TRANSICION.join() === 'beforeEnter,enter,entered,beforeExit,exit,exited', 'las seis fases del ciclo del apartado 18');
ok(ESTADOS_PRESENCIA.every((e) => faseDelCiclo('presencia', e)) && ESTADOS_GESTO.every((e) => faseDelCiclo('hoja', e)) && ['cerrado', 'montado', 'abriendo', 'abierto', 'cerrando'].every((e) => faseDelCiclo('plegable', e)), '🚨 cada estado que YA tienen `Presencia`, la hoja (F8) y `Plegable` se lee en esas seis palabras: ninguna pantalla tiene que escribirlo');
ok(faseDelCiclo('plegable', 'cerrando') === 'exit' && faseDelCiclo('presencia', 'visible') === 'entered' && faseDelCiclo('nadie', 'x') === null && PIEZAS_CON_CICLO.length >= 5, '…cerrando es exit, visible es entered');
{
  const pedidos = ['pageEnter', 'pageExit', 'modalEnter', 'modalExit', 'sheetEnter', 'sheetExit', 'cardExpand', 'cardCollapse', 'listInsert', 'listRemove', 'contentSwap', 'success', 'error'];
  ok(pedidos.every((p) => PRESETS_ORQUESTADOS.some((x) => x.id === p)) && PRESETS_ORQUESTADOS.every((x) => sistemaMotion(x.sistema) && x.usa), 'los trece presets del apartado 34, cada uno sobre un sistema que YA existe');
}
ok(CUANDO_CADA_HERRAMIENTA.length >= 6 && CUANDO_CADA_HERRAMIENTA.every((c) => c.via && c.cuando), 'cuándo CSS, Web Animations, estilo, React o un fotograma (apartado 32)');
{
  const cargados = {};
  for (const c of CATEGORIAS_TOKENS) {
    if (!cargados[c.donde]) cargados[c.donde] = await import(`../${c.donde}`);
  }
  const faltan = CATEGORIAS_TOKENS.filter((c) => cargados[c.donde][c.nombre] === undefined).map((c) => `${c.categoria} (${c.nombre})`);
  ok(faltan.length === 0, `las categorías de tokens del apartado 33 existen donde se dice${faltan.length ? ` — faltan ${faltan.join(', ')}` : ''}`);
  ok(['duration', 'easing', 'spring', 'distance', 'scale', 'opacity', 'stagger', 'delay', 'priority', 'depth', 'motion intensity'].every((c) => CATEGORIAS_TOKENS.some((x) => x.categoria === c)), '…las once que pide');
  const dupes = CATEGORIAS_TOKENS.filter((c) => Object.entries(ARCHIVOS).filter(([a, s]) => a !== c.donde && new RegExp(`export (?:const|function) ${c.nombre}\\b`).test(s)).length);
  ok(dupes.length === 0, `🚨 …y cada una vive en UN solo sitio: ni un segundo \`STAGGER\`, ni una segunda tabla de prioridades (apartado 33: *"Elimina duplicaciones"*)${dupes.length ? ` — ${dupes.map((d) => d.nombre).join(', ')}` : ''}`);
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 11. Todo pasa por el orquestador (apartados 2, 22, 23, 24 y 43) ──');
const aud = auditarOrquestacion({ archivos: ARCHIVOS });
ok(aud.cuentas.anima_por_su_cuenta === 0, `🚨 NINGUNA animación de la aplicación llama a \`.animate(\` por su cuenta: todas pasan por \`animarOrquestado\`${aud.cuentas.anima_por_su_cuenta ? ` — ${aud.hallazgos.filter((h) => h.tipo === 'anima_por_su_cuenta').map((h) => `${h.archivo}:${h.linea}`).join(', ')}` : ''}`);
ok(aud.cuentas.sin_limpieza === 0, `🚨 cero fugas: cada temporizador, escuchador, fotograma u observador de una pieza de movimiento tiene su limpieza, o está declarado con su motivo (apartado 17)${aud.cuentas.sin_limpieza ? ` — ${aud.hallazgos.filter((h) => h.tipo === 'sin_limpieza').map((h) => `${h.archivo}: ${h.que}`).join(', ')}` : ''}`);
{
  const malo = auditarOrquestacion({ archivos: {
    'src/views/X.jsx': 'const a = 1;\nel.animate([{ opacity: 0 }], { duration: 10 });',
    'src/components/motion.jsx': 'setTimeout(() => {}, 10); setTimeout(() => {}, 20);',
    'src/views/Y.jsx': '/* el.animate( no cuenta en un comentario */ const b = 2;',
    'scripts/z.mjs': 'el.animate([]);',
  } });
  ok(malo.cuentas.anima_por_su_cuenta === 1 && malo.hallazgos.find((h) => h.tipo === 'anima_por_su_cuenta').linea === 2 && malo.cuentas.sin_limpieza === 1, 'la auditoría CAZA una animación por libre (con su línea) y un temporizador sin limpiar, y no un comentario ni un archivo de fuera de src/');
}
ok(ANIMAN_DIRECTAMENTE.join() === 'src/lib/orquestadorMotion.js' && PIEZAS_DE_MOVIMIENTO.every((p) => existsSync(join(RAIZ, p))), 'el único que llama a `.animate(` es el orquestador, y las piezas que se revisan existen');
ok(LIMPIEZA_DECLARADA.every((d) => d.archivo && d.que && d.porque && PIEZAS_DE_MOVIMIENTO.includes(d.archivo)), 'lo que no se limpia a propósito dice por qué no hace falta');
{
  const c = censoMotion({ css: leer('src/index.css'), archivos: ARCHIVOS });
  ok(c.animate === 1 && c.animarOrquestado >= 14, `el censo del apartado 1, contado del código: ${c.keyframes} @keyframes, ${c.animacionesCss} animaciones y ${c.transicionesCss} transiciones en CSS, ${c.animarOrquestado} llamadas al orquestador y UNA a \`.animate(\``);
  ok(c.observadores >= 1 && c.requestAnimationFrame >= 1 && c.gestos >= 1, `…${c.requestAnimationFrame} fotogramas, ${c.observadores} observadores, ${c.gestos} zonas de gesto y ${c.scroll} escuchadores de scroll`);
}
const M = sinComentarios(leer('src/lib/motion.js'));
ok(/import \{ animarOrquestado \} from '\.\/orquestadorMotion';/.test(M) && /animarOrquestado\(el, frames, \{ \.\.\.opciones, delay: retraso \}, \{ sistema: 'motor' \}\)/.test(M), 'el motor de la F1 anima por el orquestador (`animar`, `flip`, `compartirElemento`)');
ok(/animarOrquestado\(el, plan\.keyframes, plan\.opciones, \{ sistema: 'continuidad', grupo: 'navegacion', id \}\)/.test(sinComentarios(leer('src/components/continuidad.jsx'))), '🚨 la continuidad (F7) es del grupo `navegacion`: la pantalla que crece y el nombre que viaja son UNA operación (apartado 22)');
{
  const CAP = sinComentarios(leer('src/components/capasMotion.js'));
  ok(/sistema: 'profundidad', prioridad, grupo: 'capas', id/.test(CAP) && /Number\(zIndex\) >= valorZ\('alerta'\) \? 'critica' : 'navegacion'/.test(CAP), '🚨 una capa mueve velo y caja como UN grupo (apartado 23), y lo que va en la capa de alerta es crítico');
}
{
  const LAY = sinComentarios(leer('src/components/layoutMotion.jsx'));
  ok(/planificarLinea\(\[/.test(LAY) && /despuesDe: 'sale', solape: 0\.5/.test(LAY) && /const espera = linea\.pasos\[1\]\.inicio;/.test(LAY), 'la lista de la F10 es una línea de tiempo: lo que sale, y a mitad de su salida lo demás');
  ok(!/EN_MARCHA/.test(LAY) && /cancelarDe\(el, 'layout'\)/.test(LAY), '…sin un registro propio: el del orquestador');
}
{
  const G = sinComentarios(leer('src/components/gestosMotion.jsx'));
  ok(/tomarControl\(caja, \['transform'\], 'gestos'\)/.test(G) && /tomarControl\(velo, \['background-color'\], 'gestos'\)/.test(G) && /tomarControl\(el, \['transform'\], 'gestos'\)/.test(G), '🚨 el asa de una hoja y deslizar para cambiar TOMAN EL CONTROL: drag, velo y caja coherentes en todo momento (apartado 24)');
  ok(!/a\.id === '/.test(G), '…y ya no cancelan animaciones por su nombre: una con otro nombre se habría quedado');
}
ok(/animarOrquestado\(el, \[\{ transform: `translate\(\$\{d\.dx\}px, \$\{d\.dy\}px\)` \}/.test(sinComentarios(leer('src/components/motion.jsx'))), '`useFlip` también');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 12. La auditoría, lo que no se hace y la documentación ──');
ok(AUDITORIA_F11.length >= 12 && AUDITORIA_F11.every((a) => a.apartados.length && a.que && a.queda), 'la auditoría de lo que pide el enunciado');
ok(NO_EN_F11.length >= 4 && NO_EN_F11.every((n) => n.que && n.porque), 'lo que no se construye, con su motivo (ni un framework, ni un estado de React, ni una migración masiva)');
ok(!/"framer-motion"|"gsap"|"animejs"|"motion"\s*:/.test(leer('package.json')), 'ni una librería de animación (apartado 40)');
const O = leer('src/lib/orquestadorMotion.js');
ok(!/^import /m.test(sinComentarios(O)), '🚨 el orquestador es una HOJA del árbol de imports: el motor puede pasar por él sin ciclo');
const SIS = leer('docs/MOTION_SYSTEM.md');
ok(/animarOrquestado/.test(SIS) && /tomarControl/.test(SIS) && /PRIORIDADES_MOTION/.test(SIS), 'MOTION_SYSTEM.md tiene el orquestador');
ok(/\*\*F11\*\* ✅/.test(leer('docs/13_MOTION_SYSTEM_ORDEN.md')), 'el índice de fases marca la F11');
ok(/C-62/.test(leer('docs/03_CONTRADICCIONES_DUPLICADOS_DEPENDENCIAS.md')), 'C-62 está escrita');

console.log(`\n${mal === 0 ? '\x1b[32m' : '\x1b[31m'}${ok_} de ${ok_ + mal} comprobaciones en verde\x1b[0m`);
if (mal > 0) { console.log(`\x1b[31m✗ ${mal} de ${ok_ + mal} comprobaciones han fallado\x1b[0m`); process.exit(1); }
