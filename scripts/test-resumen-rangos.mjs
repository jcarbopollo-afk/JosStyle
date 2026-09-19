/* ===========================================================================
   FIT F25/45 — EL RESUMEN INTELIGENTE DE RANGOS

   Las veinte pruebas del apartado 33, más lo que esta fase tiene que demostrar
   que NO hace: guardar un «dashboard summary», escribir una segunda fórmula de
   cobertura o de confianza, inventarse una tendencia sin historial, o enseñar
   una tarjeta de clasificación cuando no queda nada que clasificar.
   =========================================================================== */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { GRUPOS_MUSCULARES } from '../src/lib/fitness.js';
import { ejercicioPorId } from '../src/lib/ejercicios.js';
import {
  empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie, guardarSesion,
} from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { crearRutina, anadirEjercicio, editarLinea } from '../src/lib/constructor.js';
import { clasificarEjercicio, preguntaDeEjercicio } from '../src/lib/clasificacion.js';
import { addDays } from '../src/lib/helpers.js';
import { CONFIANZA } from '../src/lib/rangos.js';
import { rangoGlobalEfectivo, confianzaCombinada } from '../src/lib/motorRangos.js';
import { explicacionGlobal } from '../src/lib/explicacionRangos.js';
import { colaDeClasificacion } from '../src/lib/colaClasificacion.js';
import {
  DESTINO_GLOBAL, ESTADOS_PANTALLA, estadoPantalla, estadoDeDatos,
  DESTACADOS_MAX, ETIQUETA_DESTACADOS, SUBTITULO_DESTACADOS, destacadosMusculares,
  SIN_EVOLUCION, evolucionReciente, EJERCICIOS_MAX, ETIQUETA_EJERCICIOS, ejerciciosDestacados,
  CTA_CLASIFICACION, CLASIFICACION_COMPLETA, promptDeClasificacion,
  ETIQUETAS_CONFIANZA, coberturaDelResumen, confianzaDelResumen,
  BLOQUES, bloqueRangos, COMPONENTES_FIT25, ERROR_RANGOS, resumenDeRangos,
  casillasDelResumen, auditarResumen, NO_EN_FIT25, DECISIONES_FIT25,
} from '../src/lib/resumenRangos.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
/* ⚠️ Comentarios Y cadenas: este archivo explica lo que no hace, y la propia
   explicación haría saltar los barridos (la lección de siempre, vigésima vez). */
const soloCodigo = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/.*$/gm, '$1 ')
  .replace(/'(?:\\.|[^'\\])*'/g, "''")
  .replace(/"(?:\\.|[^"\\])*"/g, '""')
  .replace(/`(?:\\.|[^`\\])*`/g, '``');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}
const seccion = (t) => console.log(`\n\x1b[1m${t}\x1b[0m`);

const HOY = '2026-09-19';
const LIB = leer('src/lib/resumenRangos.js');
const VISTA = leer('src/views/RangosView.jsx');
const COMP = leer('src/components/resumenRangos.jsx');

/* ── Escenarios ──────────────────────────────────────────────────────────── */
let contador = 0;
function sesion(exerciseId, valores, cuando) {
  contador += 1;
  const fecha = cuando || addDays(HOY, -120 + contador);
  let r = crearRutina({ nombre: exerciseId });
  r = anadirEjercicio(r, exerciseId);
  /* Un escenario mal construido tiene que decir QUÉ está mal (lección F22). */
  if (!r.lineas.length) throw new Error(`El ejercicio «${exerciseId}» no está en el catálogo`);
  r = editarLinea(r, r.lineas[0].id, { series: valores.length });
  const inicio = new Date(`${fecha}T18:00:00`).getTime();
  let s = empezarSesion({ nombre: exerciseId, lineas: r.lineas, hoy: fecha, ahora: inicio });
  const e = ejerciciosDeSesion(s)[0];
  valores.forEach((v, i) => {
    s = editarSerie(s, e.id, e.series[i].id, v);
    s = marcarSerie(s, e.id, e.series[i].id, true);
  });
  return guardarEntrenamiento(pasarAFinalizacion(s, { ahora: inicio + 3600000 }), { confirmado: true, ahora: inicio + 3601000 }).sesion;
}
const con = (base, ...ss) => ss.reduce((f, s) => guardarSesion(f, s), base);
const reps = (n) => [{ reps: n }, { reps: Math.max(1, n - 2) }];
const carga = (kg, n) => [{ peso: kg, reps: n }, { peso: kg, reps: n - 1 }];

/* ⚠️ La opción se le pregunta al cuestionario de la F17: escribir «reps-14» a
   mano es cómo la F24 se comió media hora (su propia lección). */
function opcionValida(exerciseId) {
  /* ⚠️ Y recibe **el ejercicio**, no su id (la lección de la FORMA otra vez):
     con el id devuelve `null` y la fábrica lo dice en vez de reventar doce
     llamadas más abajo. */
  const ej = ejercicioPorId(exerciseId, []);
  if (!ej) throw new Error(`El ejercicio «${exerciseId}» no está en el catálogo`);
  const p = preguntaDeEjercicio(ej, {});
  if (!p || !p.opciones || !p.opciones.length) throw new Error(`«${exerciseId}» no tiene pregunta de clasificación`);
  return p.opciones[Math.min(2, p.opciones.length - 1)].id;
}

const UNO = () => con({}, sesion('dominada-prona', reps(8), '2026-09-01'));
const TRES = () => con(
  {},
  sesion('dominada-prona', reps(8), '2026-09-01'),
  sesion('press-banca-barra', carga(50, 8), '2026-09-02'),
  sesion('sentadilla-barra', carga(70, 8), '2026-09-03'),
);
/* Doce tandas: cobertura alta, confianza alta y varios cambios de rango. */
const MUCHO = () => {
  let f = TRES();
  for (let i = 0; i < 12; i += 1) {
    f = con(
      f,
      sesion('dominada-prona', reps(6 + i), addDays(HOY, -100 + i * 7)),
      sesion('press-banca-barra', carga(45 + i * 4, 8), addDays(HOY, -99 + i * 7)),
      sesion('sentadilla-barra', carga(60 + i * 6, 8), addDays(HOY, -98 + i * 7)),
    );
  }
  return f;
};

/* ═══════════════════════════════════════════════════════════════════════════
   APARTADO 33 · LAS VEINTE PRUEBAS
   ═══════════════════════════════════════════════════════════════════════════ */

seccion('1-3 · Sin datos, un ejercicio, varios ejercicios');
{
  const vacio = resumenDeRangos({}, {});
  ok(vacio.error === null, 'Sin datos no es un error: es un estado');
  ok(vacio.estado.id === 'sin_datos' && vacio.estado.onboarding === true, 'Sin datos abre el onboarding del apartado 4');
  ok(vacio.datos.global.sinRango === true, 'Sin datos no hay rango global');
  /* 🚨 Apartado 4, literal: *"No mostrar: 0%, score 0, rank ficticio"*. */
  ok(vacio.datos.global.score === null, 'Y la puntuación es null, no un 0');
  ok(vacio.datos.global.rango === null, 'Y el rango es null, no el 1 de consolación');
  ok(vacio.siguiente && !vacio.siguiente.barra, 'Sin rango no se pinta ninguna barra de progreso');

  const uno = resumenDeRangos(UNO(), {});
  ok(uno.estado.id === 'primeros_datos', 'Con un ejercicio el estado es «Primeros datos»');
  ok(uno.datos.global.sinRango === true, 'Un solo ejercicio no da rango global (F15: hacen falta tres)');
  ok(uno.datos.cobertura.grupos > 0, '…pero sí hay cobertura: lo que tiene no se esconde');

  const tres = resumenDeRangos(TRES(), {});
  ok(tres.datos.global.sinRango === false, 'Con tres ejercicios de tres grupos sí hay rango global');
  ok(tres.estado.id === 'completo' || tres.estado.id === 'detallado', 'Y el estado pasa a dashboard completo');
}

seccion('4-5 · Sin rango global y con rango global');
{
  const vacio = resumenDeRangos({}, {});
  ok(vacio.datos.sinRango && vacio.datos.sinRango.que, 'Sin rango se dice POR QUÉ, con el motivo del motor');
  ok(vacio.confianza === null, 'Sin rango no hay confianza que enseñar');
  const tres = resumenDeRangos(TRES(), {});
  ok(typeof tres.datos.global.score === 'number' && tres.datos.global.score > 0, 'Con rango hay puntuación de verdad');
  ok(!!tres.datos.global.nombre && tres.datos.global.nombre !== 'Sin Rango', 'Y su nombre sale del catálogo de la F1');
  ok(tres.siguiente.estado !== 'sin_rango', 'Y el progreso al siguiente ya se puede calcular');
}

seccion('6-7 · Cobertura baja y cobertura alta');
{
  const baja = resumenDeRangos(UNO(), {});
  const alta = resumenDeRangos(MUCHO(), {});
  ok(baja.cobertura.grupos < alta.cobertura.grupos, `La cobertura sube con los datos (${baja.cobertura.grupos} → ${alta.cobertura.grupos})`);
  ok(alta.cobertura.total === GRUPOS_MUSCULARES.length, 'El total son los grupos del catálogo, no un número escrito a mano');
  /* 🐛 La forma que habría pintado una barra a NaN%: la cruda no trae fracción. */
  ok(typeof alta.cobertura.fraccion === 'number' && alta.cobertura.fraccion > 0 && alta.cobertura.fraccion <= 1,
    'La cobertura del resumen trae una FRACCIÓN pintable, no solo «5/7»');
  const crudo = rangoGlobalEfectivo(MUCHO(), {}).cobertura;
  ok(crudo.fraccion === undefined,
    '…y la cruda del motor NO la trae: por eso se reenvía la de la F16 (si no, la barra saldría a NaN %)');
  /* 🚨 Apartado 5 — lo que NO se puede decir. */
  ok(!/% de tu cuerpo|has desarrollado/i.test(alta.cobertura.texto),
    'La cobertura no dice «has desarrollado el 71 % de tu cuerpo»');
  ok(/grupos con datos/i.test(alta.cobertura.texto), 'Dice de qué habla: grupos CON DATOS');
}

seccion('8-9 · Confianza baja y confianza alta');
{
  const baja = resumenDeRangos(TRES(), {});
  const alta = resumenDeRangos(MUCHO(), {});
  ok(baja.confianza && baja.confianza.id === 'baja', `Con tres sesiones la confianza es baja (${baja.confianza && baja.confianza.id})`);
  ok(alta.confianza && alta.confianza.id === 'alta', `Con mucho recorrido la confianza es alta (${alta.confianza && alta.confianza.id})`);
  ok(baja.confianza.etiqueta === ETIQUETAS_CONFIANZA.baja && baja.confianza.etiqueta === 'Datos limitados',
    'Y su rótulo es el breve del apartado 6: «Datos limitados»');
  ok(!!baja.confianza.texto && !!baja.confianza.texto.que, 'Con su frase, que es la que escribió la F20');
  /* 🚨 Apartado 6 — *"No crear una puntuación de confianza nueva"*. */
  ok(CONFIANZA.map((c) => c.id).every((id) => Object.prototype.hasOwnProperty.call(ETIQUETAS_CONFIANZA, id))
    && Object.keys(ETIQUETAS_CONFIANZA).length === CONFIANZA.length,
    'Los niveles son EXACTAMENTE los tres del motor, ni uno más');
  ok(!/desde\s*:|umbral|>=|<=/.test(soloCodigo(LIB).split('ETIQUETAS_CONFIANZA')[1] || ''),
    'Y aquí no se escribe ningún umbral de confianza');

  /* 🐛 El fallo vivo desde la F20, y la prueba que lo habría cazado. */
  ok(typeof rangoGlobalEfectivo(MUCHO(), {}).confianza === 'string',
    '🐛 El rango GLOBAL devuelve su confianza (no la devolvía, y el bloque no se enseñaba nunca)');
  ok(!!explicacionGlobal(MUCHO(), {}).confianzaTexto,
    '…así que la explicación global ya puede enseñar su bloque de confianza');
  ok(explicacionGlobal({}, {}).confianzaTexto === null, '…y sin rango, sigue sin enseñarlo');

  /* La agregación: el eslabón más flojo, y falsificable. */
  ok(confianzaCombinada(['alta', 'baja', 'media']).id === 'baja', 'La confianza de un conjunto es la del eslabón más flojo');
  ok(confianzaCombinada(['alta', 'alta']).id === 'alta', 'Y con todo alto, alta');
  ok(confianzaCombinada([]) === null && confianzaCombinada(['inventada']) === null,
    'Sin confianzas conocidas devuelve null, no un nivel de consolación');
}

seccion('10-11 · Con historial y sin historial');
{
  const sin = resumenDeRangos(UNO(), {});
  ok(sin.evolucion.hay === false, 'Sin historial no hay evolución');
  ok(sin.evolucion.texto === SIN_EVOLUCION, 'Y se dice con la frase del apartado 8');
  ok(!/mejor|peor|sub[ií]|baj/i.test(SIN_EVOLUCION), 'Que no insinúa ninguna tendencia');
  const hay = resumenDeRangos(MUCHO(), {});
  ok(hay.evolucion.hay === true, 'Con historial sí hay evolución');
  ok(typeof hay.evolucion.texto === 'string' && hay.evolucion.texto.length > 0, 'Y su frase sale del resumen de la F22');
}

seccion('12-13 · Cambio reciente y sin cambio');
{
  const hay = resumenDeRangos(MUCHO(), {});
  ok(!!hay.evolucion.tarjeta, 'Con un cambio real hay tarjeta de «Nuevo rango»');
  ok(/^\d{4}-\d{2}-\d{2}$/.test(hay.evolucion.tarjeta.fecha), `Con su FECHA real (${hay.evolucion.tarjeta.fecha})`);
  ok(hay.evolucion.tarjeta.desde !== hay.evolucion.tarjeta.hasta, 'Y un cambio es de un rango a OTRO');
  /* 🚨 Apartado 18 — *"No mostrar una tarjeta vacía"*. */
  const sinCambio = evolucionReciente({ hay: true, subida: null, textoDentro: '', sigueEn: 'Sigues en Intermedio', actual: { nombre: 'Intermedio' }, progresoDentro: false });
  ok(sinCambio.tarjeta === null, 'Sin cambio reciente la tarjeta es null: la sección desaparece');
  ok(sinCambio.texto === 'Sigues en Intermedio', '…y lo que queda es decir que sigue donde estaba');
  ok(resumenDeRangos({}, {}).evolucion.tarjeta === null, 'Y sin datos tampoco hay tarjeta');
}

seccion('14-15 · Clasificación pendiente y completa');
{
  const pend = promptDeClasificacion({ cola: [{ exerciseId: 'a' }, { exerciseId: 'b' }, { exerciseId: 'c' }] });
  ok(pend.pendiente === true && pend.cuantos === 3, 'Con cola hay tarea pendiente, con su número');
  ok(pend.texto === '3 recomendados', 'Y el texto es el del apartado 14: «3 recomendados»');
  ok(pend.cta === CTA_CLASIFICACION && CTA_CLASIFICACION === 'Continuar clasificación', 'Con el CTA que pide el apartado');
  ok(promptDeClasificacion({ cola: [{ exerciseId: 'a' }] }).texto === '1 recomendado', 'Con uno, en singular');
  /* 🚨 Apartado 15 — *"no mostrar una tarjeta de tarea pendiente"*. */
  const vacia = promptDeClasificacion({ cola: [] });
  ok(vacia.pendiente === false && vacia.cta === null, 'Con la cola vacía no hay tarjeta ni botón');
  ok(vacia.texto === CLASIFICACION_COMPLETA, '…solo la línea secundaria «Clasificación inicial completa»');

  /* Y la cola de verdad, no una inventada: se le pregunta a la F24. */
  const r = resumenDeRangos({}, {});
  ok(r.clasificacion.cuantos === colaDeClasificacion({}, {}).cola.length,
    'El número que se enseña es EL de la cola de la F24, no un recuento propio');
}

seccion('16 · Grupos sin datos');
{
  const r = resumenDeRangos(TRES(), {});
  const sinDatos = r.datos.musculos.filter((m) => m.sinRango);
  ok(sinDatos.length > 0, `Hay grupos sin datos y siguen en la lista (${sinDatos.map((m) => m.nombre).join(', ')})`);
  /* 🚨 Apartado 11 — *"No: Novato. No: 0%"*. */
  ok(sinDatos.every((m) => m.rango === null || m.rango === undefined), 'Ninguno recibe un rango de consolación');
  ok(sinDatos.every((m) => /sin datos/i.test(m.nombreRango) || /sin rango/i.test(m.nombreRango)), 'Todos dicen «Sin datos»');
  ok(r.destacados.every((d) => !d.sinRango), 'Y ninguno entra en los destacados');
  /* 🚨 Y al revés: un destacado NUNCA escribe «Sin datos» como tendencia. */
  ok(r.destacados.every((d) => d.tendenciaNombre !== 'Sin datos'),
    '🐛 Un destacado CON rango no dice «Sin datos» de tendencia (diría lo que el apartado 11 reserva para otra cosa)');
  ok(resumenDeRangos(TRES(), {}).destacados.every((d) => d.tendenciaNombre === null),
    '…con tres sesiones sueltas la F11 no puede comparar, así que la tendencia es null y la línea desaparece');
  ok(resumenDeRangos(MUCHO(), {}).destacados.some((d) => !!d.tendenciaNombre),
    '…y con recorrido sí la hay, en palabras');
}

seccion('17 · Ejercicios destacados');
{
  const r = resumenDeRangos(MUCHO(), {});
  ok(r.ejercicios.hay === true, 'Con datos hay ejercicios destacados');
  ok(r.ejercicios.relevantes.length <= EJERCICIOS_MAX && EJERCICIOS_MAX === 4, 'Como mucho cuatro (apartado 12)');
  ok(r.ejercicios.relevantes.every((x) => x.exerciseId && x.nombre), 'Cada uno con su id y su nombre');
  ok(new Set(r.ejercicios.relevantes.map((x) => x.exerciseId)).size === r.ejercicios.relevantes.length,
    'Sin repetir ninguno aunque salga en dos grupos destacados');
  ok(r.ejercicios.etiqueta === ETIQUETA_EJERCICIOS, 'Con la frase que evita afirmar causalidad (apartado 13)');
  ok(!/porque|gracias a|causa|debido a/i.test(ETIQUETA_EJERCICIOS), '…que no dice «gracias a» ni «porque»');
  /* 🐛 El global no tiene músculo: pedírselos a la F23 daba SIEMPRE vacío. */
  ok((r.siguiente.relevantes || []).length === 0,
    '🐛 La tarjeta del siguiente rango GLOBAL no trae relevantes (la F23 devuelve null para overall)');
  ok(r.ejercicios.relevantes.length > 0, '…por eso salen de los grupos destacados, con la lógica de la F21');
  /* 🐛 Y cada uno va atribuido al grupo donde MÁS participa. */
  const nombres = new Map(GRUPOS_MUSCULARES.map((g) => [g.nombre, g.id]));
  ok(r.ejercicios.relevantes.every((x) => nombres.has(x.grupoNombre)), 'Cada uno dice de qué grupo destacado sale');
  ok(r.ejercicios.relevantes.every((x) => r.destacados.some((d) => d.id === x.grupoDestacado)),
    '…y ese grupo es uno de los destacados, no cualquiera');
  ok(resumenDeRangos({}, {}).ejercicios.hay === false, 'Sin datos no hay ninguno, y la sección desaparece');
}

seccion('18 · Error del RankEngine');
{
  /* ⚠️ **Y aquí hay que decir qué demuestra esta prueba y qué no** (FIT F25).
     Se intentó fabricar el error con datos corruptos de verdad —`sesiones` que
     no es un array, una sesión `null`, series que son una cadena, una fecha
     numérica, una clasificación vacía— y **el motor aguanta los ocho casos**,
     porque cada capa pasa por su `lista()` y su normalizador. Eso está bien y
     es lo que hay que conservar. Así que el error se provoca con un objeto que
     lanza al leerlo: lo que se demuestra es que **el `try` del apartado 31
     existe y devuelve el estado entero**, no que exista un dato guardado capaz
     de llegar hasta aquí. Si algún día uno llega, esto es lo que verá Josué. */
  const roto = { get sesiones() { throw new Error('dato ilegible'); } };
  const r = resumenDeRangos(roto, {});
  ok(r.error !== null, 'Con datos que revientan el motor se devuelve un error');
  ok(r.error.titulo === ERROR_RANGOS.titulo && /no hemos podido calcular/i.test(r.error.titulo), 'Con la frase del apartado 31');
  ok(r.error.cta === 'Reintentar', 'Y su «Reintentar»');
  /* 🚨 *"No mostrar datos parcialmente corruptos como si fueran correctos"*. */
  ok(r.datos === null && r.siguiente === null, 'Y NO se devuelve media pantalla con tarjetas buenas');
  ok(r.destacados.length === 0 && r.ejercicios.hay === false, 'Ni destacados ni ejercicios de un cálculo que falló');
  ok(r.bloques.length === BLOQUES.length, '…pero la jerarquía se conserva, para poder reintentar');
  /* Y que la prueba PUEDE ponerse verde con algo que no falla (falsificable). */
  ok(resumenDeRangos({}, {}).error === null, 'Un fitness vacío NO es un error: la comprobación distingue las dos cosas');
  /* 🚨 Y lo que de verdad protege a Josué: que lo corrupto realista NO llegue
     al `catch`, sino que lo limpien los normalizadores de cada fase. */
  const corruptos = [
    ['una sesión nula', { sesiones: [null] }],
    ['sesiones que no son sesiones', { sesiones: ['x'] }],
    ['ejercicios que son una cadena', { sesiones: [{ id: 'a', estado: 'completada', ejercicios: 'roto' }] }],
    ['series que son una cadena', { sesiones: [{ id: 'a', estado: 'completada', ejercicios: [{ id: 'e', exerciseId: 'dominada-prona', series: 'roto' }] }] }],
    ['clasificaciones que no son lista', { clasificaciones: 'x' }],
    ['una clasificación vacía', { clasificaciones: [{}] }],
    ['una fecha numérica', { sesiones: [{ id: 'a', estado: 'completada', fecha: 20260901, ejercicios: [] }] }],
  ];
  corruptos.forEach(([que, f]) => ok(resumenDeRangos(f, {}).error === null,
    `…y ${que} no revienta nada: lo limpia el normalizador, no el catch`));
}

seccion('19-20 · Refresh después de entrenar y de clasificar');
{
  /* 🚨 Apartado 25 — *"Utilizar la invalidación existente"*: no hay caché que
     invalidar porque no se guarda nada. Se vuelve a leer y ya está. */
  const antes = resumenDeRangos(TRES(), {});
  const despues = resumenDeRangos(con(TRES(), sesion('dominada-prona', reps(24), '2026-09-15')), {});
  ok(despues.datos.global.score > antes.datos.global.score,
    `Entrenar cambia el resumen sin tocar nada más (${antes.datos.global.score} → ${despues.datos.global.score})`);

  const base = TRES();
  const cla = clasificarEjercicio(base, 'plancha-frontal', opcionValida('plancha-frontal'), {}).fitness;
  const r1 = resumenDeRangos(base, {});
  const r2 = resumenDeRangos(cla, {});
  ok(r2.clasificacion.cuantos !== r1.clasificacion.cuantos || r2.datos.clasificacion.clasificados > r1.datos.clasificacion.clasificados,
    'Clasificar también se nota en el resumen, a la siguiente lectura');
  /* Y la prueba de que no hay copia: el mismo fitness da el mismo resumen. */
  ok(JSON.stringify(resumenDeRangos(base, {}).datos.global) === JSON.stringify(r1.datos.global),
    'Dos lecturas del mismo fitness dan lo mismo: es una función, no un estado');
}

/* ═══════════════════════════════════════════════════════════════════════════
   LO QUE ESTA FASE TIENE QUE DEMOSTRAR QUE NO HACE
   ═══════════════════════════════════════════════════════════════════════════ */

seccion('Apartado 23 · No se guarda ningún «dashboard summary»');
{
  const cod = soloCodigo(LIB);
  ok(!/saveData|localStorage|sessionStorage/.test(cod), 'La librería no guarda nada en ningún sitio');
  ok(!/\bfitness\.(resumen|dashboard)\b/.test(cod), 'Ni escribe una clave de resumen dentro de fitness');
  ok(!/normalizarResumen|crearResumen\(/.test(cod), 'Y no tiene normalizador: lo que no se guarda no se normaliza');
  ok(!/\.push\(|\.splice\(/.test(cod.split('export function resumenDeRangos')[1] || ''),
    'El resumen no muta nada de lo que recibe');
}

seccion('Apartados 16, 5 y 6 · Ni una fórmula nueva');
{
  const cod = soloCodigo(LIB);
  ok(!/RANK_THRESHOLDS|rangoDePuntuacion|puntuacionDeEjercicio/.test(cod), 'No calcula ninguna puntuación ni ningún umbral');
  ok(!/score\s*[/*]\s*1000|\/\s*1000/.test(cod), 'Ni traduce un score a un porcentaje por su cuenta');
  ok(!/Math\.round\([^)]*score/.test(cod), 'Ni redondea puntuaciones');
  ok(/pantallaDeRangos|tarjetaSiguienteRango|historialDeRango|pantallaDeClasificacion|contribucionesDeMusculo/.test(cod),
    'Lo que hace es llamar a los motores que ya existen');
}

seccion('Apartado 35 · Ni IA, ni XP, ni recomendaciones de entrenamiento');
{
  /* ⚠️ **`NO_EN_FIT25` y `DECISIONES_FIT25` NO entran en este barrido**, y es la
     lección de siempre por enésima vez: son las tablas que **declaran** que no
     hay XP, ni logros, ni recompensas, así que nombran justo lo que se busca y
     harían saltar la comprobación con el código bien. Lo que se barre es **lo
     que vería Josué**; que esas tablas sí los nombren se comprueba aparte, y es
     lo que hay que exigir. */
  const textos = JSON.stringify([
    ESTADOS_PANTALLA, ETIQUETA_DESTACADOS, SUBTITULO_DESTACADOS, SIN_EVOLUCION,
    ETIQUETA_EJERCICIOS, CTA_CLASIFICACION, CLASIFICACION_COMPLETA, ETIQUETAS_CONFIANZA,
    ERROR_RANGOS, BLOQUES.map((b) => b.nombre),
    resumenDeRangos(MUCHO(), {}).destacados,
    resumenDeRangos(MUCHO(), {}).evolucion,
    resumenDeRangos(MUCHO(), {}).clasificacion,
    resumenDeRangos(MUCHO(), {}).confianza,
  ]);
  ok(NO_EN_FIT25.some((x) => /xp|logros|recompensas/i.test(x.que)),
    '…y que no se construyen está DECLARADO, con su motivo (por eso su tabla queda fuera del barrido)');
  /* ⚠️ Con límite de palabra: «experto» contiene «xp» (FIT F1). */
  const prohibidas = [/\bxp\b/i, /\bnivel \d/i, /\blogros?\b/i, /\brecompensas?\b/i, /\bmedalla/i,
    /\branking mundial\b/i, /\bcompite/i, /\bmejor que\b/i, /\bdeberías entrenar\b/i, /\bte recomiendo\b/i];
  prohibidas.forEach((re) => ok(!re.test(textos), `Ningún texto generado dice ${re}`));
  /* Y que el barrido SÍ caza algo: si no, no demuestra nada (EH F42). */
  ok(/\bxp\b/i.test('Has ganado 40 XP'), 'El barrido de palabras de juego caza un ejemplo malo');
  ok(!/\bxp\b/i.test('Experto'), '…y no salta con «Experto», que contiene «xp»');
}

seccion('Apartados 7, 13 y 15 · Ni causalidad ni tendencias inventadas');
{
  const r = resumenDeRangos(MUCHO(), {});
  const frases = [r.evolucion.texto, r.evolucion.dentro || '', r.ejercicios.etiqueta || '',
    SUBTITULO_DESTACADOS, SIN_EVOLUCION, r.clasificacion.texto].join(' · ');
  ok(!/gracias a|por culpa de|te ha hecho|ha mejorado tu/i.test(frases), 'Ninguna frase afirma una causa');
  ok(!/vas mejor|vas peor|flojo|mal mes/i.test(frases), 'Ni juzga');
  ok(!/en \d+ (días|semanas|meses)|llegarás/i.test(frases), 'Ni predice cuándo llegará a nada');
  ok(!/\d+\s?kg|\d+\s?repeticiones/i.test(frases), 'Ni traduce un rango a kilos o repeticiones (F23, apartados 12 y 13)');
}

seccion('Apartado 10 · «Destacados», nunca «mejores músculos»');
{
  ok(ETIQUETA_DESTACADOS === 'Destacados', 'El rótulo es «Destacados»');
  ok(!/mejor|peor|fuerte|d[ée]bil/i.test(`${ETIQUETA_DESTACADOS} ${SUBTITULO_DESTACADOS}`),
    'Ni el rótulo ni su frase hablan de mejores o peores');
  ok(/informaci[oó]n/i.test(SUBTITULO_DESTACADOS) && /desarroll/i.test(SUBTITULO_DESTACADOS),
    'Y la frase dice expresamente que NO mide desarrollo físico');
  /* ⚠️ Sobre el CÓDIGO: mis propios comentarios citan la expresión prohibida
     para explicar por qué no se usa, y eso haría saltar el barrido. */
  ok(!/mejores m[úu]sculos/i.test(`${soloCodigo(COMP)} ${soloCodigo(VISTA)}`),
    'La expresión prohibida no aparece en ninguna pantalla');
}

seccion('Apartado 9 · La selección es determinista');
{
  const f = MUCHO();
  const a = resumenDeRangos(f, {}).destacados.map((d) => d.id).join(',');
  const b = resumenDeRangos(f, {}).destacados.map((d) => d.id).join(',');
  ok(a === b && a.length > 0, `Dos llamadas eligen los mismos grupos (${a})`);
  ok(!/Math\.random|Date\.now\(\)/.test(soloCodigo(LIB)), 'Y no hay azar ni reloj en la librería');
  ok(resumenDeRangos(f, {}).destacados.length <= DESTACADOS_MAX && DESTACADOS_MAX === 3, 'Como mucho tres (apartado 9)');
  /* Falsificable: con un `max` distinto, la lista cambia. */
  ok(destacadosMusculares(resumenDeRangos(f, {}).datos.musculos, null, { max: 1 }).length === 1,
    'El tope se respeta de verdad: con max 1, sale uno');
}

seccion('Apartados 2 y 22 · La jerarquía, escrita una vez');
{
  const ids = BLOQUES.map((b) => b.id);
  ok(ids.join(',') === 'global,siguiente,cobertura,evolucion,musculos,ejercicios,clasificacion',
    'El orden es EXACTAMENTE el del apartado 2');
  ok(BLOQUES.every((b) => !!b.nombre && !!b.detalle), 'Cada bloque dice a dónde lleva su detalle (apartado 22)');
  ok(bloqueRangos('global') && !bloqueRangos('inventado'), 'Y se le puede preguntar por uno');
  /* 🚨 La vista no reordena por su cuenta. */
  ok(/RankDashboard/.test(VISTA), 'La pantalla usa el contenedor que lee BLOQUES');
  ok(/orden\.map|bloques\[b\.id\]/.test(COMP), 'Y el contenedor pinta en el orden que le dan, sin decidirlo');
  ok(!/if\s*\(\s*estado/.test(soloCodigo(VISTA)), 'No hay un `if` por estado de datos en la pantalla (apartado 20)');
}

seccion('Apartado 21 · Los nueve componentes, y seis ya existían');
{
  ok(COMPONENTES_FIT25.length === 9, 'Los nueve del apartado 21 están declarados');
  const nuevos = COMPONENTES_FIT25.filter((c) => c.nuevo);
  const viejos = COMPONENTES_FIT25.filter((c) => !c.nuevo);
  ok(nuevos.length === 3 && viejos.length === 6, `Tres nuevos y seis reutilizados (${viejos.map((c) => c.es).join(', ')})`);
  /* 🚨 Y no es una lista que se cuenta a sí misma: se buscan en el código. */
  const donde = {
    RankOverviewCard: VISTA, RankCoverage: leer('src/components/explicacionRango.jsx'),
    RankConfidence: leer('src/components/explicacionRango.jsx'),
    RankHistorySummary: leer('src/components/historialRango.jsx'),
    RankRelevantExercises: leer('src/components/siguienteRango.jsx'),
    RankNextLevelCard: leer('src/components/siguienteRango.jsx'),
  };
  viejos.forEach((c) => ok(new RegExp(`export function ${c.es}\\b`).test(donde[c.es] || ''),
    `«${c.pide}» es ${c.es}, y existe de verdad en ${c.de}`));
  nuevos.forEach((c) => ok(new RegExp(`export function ${c.es}\\b`).test(COMP),
    `«${c.pide}» nace en esta fase`));
  /* ⚠️ Y ninguno de los seis se ha vuelto a escribir aquí. */
  viejos.forEach((c) => ok(!new RegExp(`export function ${c.es}\\b`).test(COMP),
    `…y ${c.es} NO se ha duplicado en los componentes de la F25`));
}

seccion('Apartado 29 · Comprensible sin depender del color');
{
  ok(/aria-label/.test(COMP), 'Los bloques nuevos llevan nombre accesible');
  /* Un destacado dice su rango Y su tendencia en palabras dentro del label. */
  ok(/nombreRango.*tendenciaNombre|tendenciaNombre.*nombreRango/s.test(COMP),
    'El nombre accesible de un destacado lleva el rango y la tendencia en palabras');
  ok(/toque-44/.test(COMP), 'Y lo pulsable tiene su zona de toque de 44 px');
  ok(!/#[0-9a-fA-F]{6}/.test(soloCodigo(COMP)), 'Sin un solo hex suelto (regla 2)');
}

seccion('Apartado 30 · Nada de confeti, vibración ni sonido');
{
  const cod = soloCodigo(COMP);
  ok(!/confeti|confetti/i.test(cod), 'Ni confeti');
  ok(!/navigator\.vibrate|vibrar/i.test(cod), 'Ni vibración');
  ok(!/new Audio|emitirSonido|audioEngine/i.test(cod), 'Ni sonido (y el motor es el único que reproduce, SO F1)');
  ok(/aviso-entra/.test(COMP), 'La tarjeta de cambio entra con la animación que ya existe en index.css');
  ok(/\.aviso-entra\s*\{/.test(leer('src/index.css')), '…y esa clase existe de verdad (E3 F14)');
}

seccion('La auditoría, y una que SÍ se puede poner roja');
{
  const a = auditarResumen(MUCHO(), {});
  ok(a.ok === true, `La auditoría del resumen está en verde (${a.casillas.length} casillas)`);
  ok(auditarResumen({}, {}).ok === true, 'Y sin datos también, porque «sin datos» es un estado válido');
  /* 🚨 EH F42 — una auditoría que no puede fallar no sirve. */
  const falso = casillasDelResumen({
    ...a.resumen,
    destacados: [...a.resumen.destacados, { id: 'x', nombre: 'X', sinRango: true, tendenciaNombre: 'Sin datos' }, { id: 'y' }],
    bloques: [],
    estado: { id: 'inventado' },
    cobertura: { texto: '5/7' },
  });
  ok(falso.some((c) => c.id === 'acotado' && !c.ok), 'Con cuatro destacados, la casilla del tope se pone roja');
  ok(falso.some((c) => c.id === 'con_datos' && !c.ok), 'Con un destacado sin datos, la suya también');
  ok(falso.some((c) => c.id === 'sin_datos_no_se_repite' && !c.ok), 'Con «Sin datos» de tendencia, la suya también');
  ok(falso.some((c) => c.id === 'estado' && !c.ok), 'Con un estado que no existe, la suya también');
  ok(falso.some((c) => c.id === 'jerarquia' && !c.ok), 'Sin jerarquía, la suya también');
  ok(falso.some((c) => c.id === 'cobertura_pintable' && !c.ok), 'Y con la cobertura cruda —sin fracción—, la suya también');
}

seccion('Lo que no se construye, dicho');
{
  ok(NO_EN_FIT25.length >= 6 && NO_EN_FIT25.every((x) => x.que && x.porque), 'Todo lo excluido lleva su motivo');
  ok(DECISIONES_FIT25.length >= 5 && DECISIONES_FIT25.every((x) => x.que && x.porque), 'Y cada decisión, el suyo');
  ok(DECISIONES_FIT25.some((d) => /C-34/.test(d.porque)), 'La contradicción de la confianza queda anotada como C-34');
  ok(NO_EN_FIT25.some((x) => /dashboard summary/i.test(x.que)), 'Se declara que no hay resumen guardado');
  ok(estadoPantalla('sin_datos') && estadoPantalla('detallado') && !estadoPantalla('lo_que_sea'),
    'Los estados de datos se consultan por id');
  ok(estadoDeDatos({}).id === 'sin_datos', 'Sin nada, «Sin datos»');
  ok(estadoDeDatos({ sesiones: 2, global: { sinRango: true } }).id === 'primeros_datos',
    'Con sesiones y sin rango, «Primeros datos» — no se le manda al onboarding lo que ya tiene');
  ok(DESTINO_GLOBAL.tipo === 'overall', 'Y el destino global se escribe una vez, aquí');
  ok(!/const DESTINO_GLOBAL\s*=/.test(VISTA), '…y la pantalla lo importa en vez de declararlo otra vez');
  ok(coberturaDelResumen(null) === null && confianzaDelResumen(null) === null, 'Los dos reenvíos aguantan un null');
}

console.log(`\n${fallos === 0 ? '\x1b[32m' : '\x1b[31m'}FIT F25 — ${total - fallos}/${total} comprobaciones\x1b[0m`);
if (fallos > 0) process.exit(1);
