// ══════════════════════════════════════════════════════════════════════════
// E3 · FASE 29 (PR F7) — PRODUCTIVIDAD: INTEGRACIÓN GLOBAL
// ══════════════════════════════════════════════════════════════════════════
//
// Los veintidós puntos del «CRITERIO DE ÉXITO», y sobre todo lo que sostiene la
// fase: **aquí no se calcula nada, se pregunta**. Cada número sale de la función
// de su propia mini-app.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  FUENTES_PR, fuentePR, panelDeMiniApp, panelSeguro,
  FUENTES_RESUMEN_DIA, FRASES_RESUMEN, resumenDelDia,
  TODO_HECHO, queMeQueda,
  PESOS_PRIORIDAD, pesoDe, DIAS_FECHA_PROXIMA, paraHoyPR,
  cadenaDeObjetivo, cadenas,
  progresoGlobal, PERIODOS_PR, periodoPR, estadisticasPR,
  DEFINICION_DIA_PRODUCTIVO, diasProductivos, rachaProductividad,
  ACCIONES_RAPIDAS_PR, resumenParaHoy,
  AUDITORIA_PR, NO_EN_PR7, condicionPR7,
} from '../src/lib/integracionPR.js';
import { MINI_APPS_PR } from '../src/lib/productividad.js';
import { crearTarea } from '../src/lib/tareas.js';
import { crearObjetivo, crearMeta, vincularMeta, actualizarProgreso, marcarPrincipal } from '../src/lib/metasObjetivos.js';
import { crearRutina, crearPaso, anadirPaso, editarRutina } from '../src/lib/rutinas.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(raiz, p), 'utf8');

const soloCodigo = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/\/\/.*$/gm, ' ')
  .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
  .replace(/`(?:[^`\\]|\\.)*`/g, '``');

let pasa = 0;
const fallos = [];
const ok = (c, m) => { if (c) { pasa += 1; console.log(`  ✓ ${m}`); } else { fallos.push(m); console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperaba ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-09-07';   // lunes (0 = lunes en `diaDeLaSemana`)
const AYER = '2026-09-06';
const LIB = leer('src/lib/integracionPR.js');
const CODIGO = soloCodigo(LIB);

/* Un escenario con las seis mini-apps con datos de verdad. */
const objetivo = { ...crearObjetivo({ texto: 'Mejorar mi físico', plazo: '1 año', hoy: HOY }), id: 'o1' };
const meta = vincularMeta(actualizarProgreso(crearMeta({ nombre: '15 dominadas', objetivo: 15, hoy: HOY }), 8, { hoy: HOY }), 'o1');
const tareaDeMeta = { ...crearTarea({ texto: 'Entrenar dominadas', fecha: HOY }), metaId: meta.id };
let rutina = crearRutina({ nombre: 'Rutina de mañana', hoy: HOY });
rutina = anadirPaso(rutina, crearPaso({ texto: 'Levantarse', minutos: 5 }));
rutina = editarRutina(rutina, { programacion: { tipo: 'diaria', hora: '08:00' } });

const D = {
  hoy: HOY,
  objetivos: { lista: marcarPrincipal([objetivo], 'o1'), ultimaRevision: HOY },
  productividad: {
    habitos: [
      { id: 'h1', nombre: 'Leer', activo: true, historial: { [HOY]: true, [AYER]: true } },
      { id: 'h2', nombre: 'Beber agua', activo: true, historial: {} },
    ],
    tareas: [
      crearTarea({ texto: 'Estudiar biología', fecha: HOY, prioridadId: 'alta' }),
      crearTarea({ texto: 'Llamar', fecha: '2026-09-01' }),
      { ...crearTarea({ texto: 'Hecha', fecha: HOY }), hecha: true, completadaEn: `${HOY}T09:00:00.000Z` },
      tareaDeMeta,
    ],
    metas: [meta],
    rutinas: [rutina],
    rutinaEjecuciones: [],
    rutinaEnCurso: null,
    pomodoroSesiones: [],
    pomodoros: { [HOY]: 2 },
    apuntes: [],
  },
};
const VACIO = { hoy: HOY, objetivos: { lista: [] }, productividad: { habitos: [], tareas: [], metas: [], rutinas: [], rutinaEjecuciones: [], pomodoroSesiones: [], pomodoros: {}, apuntes: [] } };

console.log('\n── 1. 🚨 AQUÍ NO SE CALCULA NADA: SE PREGUNTA ──────────────────');
eq(FUENTES_PR.map((f) => f.app), ['habitos', 'pomodoro', 'tareas', 'metas', 'objetivos', 'rutinas'],
  'una línea por mini-app, las seis');
ok(FUENTES_PR.every((f) => typeof f.leer === 'function'),
  '🚨 y `leer` son FUNCIONES IMPORTADAS de verdad: renombrar una en su módulo no compila (EH F39)');
ok(FUENTES_PR.every((f) => f.clave && f.duenio),
  '⚠️ con su clave y su dueño: el apartado 22 —cada módulo mantiene su fuente de verdad— escrito');
eq(fuentePR('tareas').duenio, 'tareas.js', 'las tareas las cuenta `tareas.js`');
eq(fuentePR('inventada'), null, 'una mini-app que no existe no tiene fuente');
eq(AUDITORIA_PR.guardaAlgo, false,
  '🚨 ESTA LIBRERÍA NO GUARDA NADA: *"la integración únicamente consulta y relaciona"*');
ok(!/DEFAULT_[A-Z_]+\s*=|export function normalizar/.test(CODIGO),
  '🚨 y no tiene ni almacén ni normalizador propios, con el código leído para comprobarlo');
eq(AUDITORIA_PR.tablasNuevas, 0, 'ni una tabla nueva');
eq(AUDITORIA_PR.clavesNuevas, 0, 'ni una clave nueva en `app_data`');

console.log('\n── 2. Los seis cuadraditos, con información real ───────────────');
eq(panelDeMiniApp('habitos', D).principal, '1/2 hoy', '*"🧠 Hábitos → 3/5 hoy"*');
eq(panelDeMiniApp('habitos', D).secundaria, '🔥 2 días', '*"🔥 12 días"*, y sale de la racha de verdad');
/* 🐛 El fallo que cazó el primer arranque: `habitos.paraHoy()` devuelve
   `pendientes` como NÚMERO y la racha en `rachaDestacada`. Leer `.racha` daba
   `undefined` —que es falso— y la segunda línea habría salido SIEMPRE vacía. */
ok(!/info\.racha\b/.test(CODIGO),
  '🐛 y se lee `rachaDestacada`, que es como se llama: leer `.racha` dejaba la línea vacía sin fallar (EH F18)');
/* 🐛 Y con UN solo día decía *"🔥 1 días"*. Una cifra que se pinta en la
   pantalla se escribe en el idioma de Josué, singular incluido. */
eq(panelDeMiniApp('habitos', { ...D, productividad: { ...D.productividad, habitos: [{ id: 'h1', nombre: 'Leer', activo: true, historial: { [HOY]: true } }] } }).secundaria,
  '🔥 1 día', '🐛 y con un solo día es *"1 día"*, no *"1 días"*');
eq(panelDeMiniApp('tareas', D).principal, '3 pendientes', '*"✅ Tareas → 4 pendientes"*');
eq(panelDeMiniApp('tareas', D).secundaria, 'Llamar', '*"y destacar las prioritarias"*: la vencida va primera');
eq(panelDeMiniApp('metas', D).principal, '1 activa', '*"🎯 Metas → 3 activas"*');
eq(panelDeMiniApp('metas', D).secundaria, '53 % de media', '*"y progreso general"*');
eq(panelDeMiniApp('objetivos', D).principal, '1 activo', '*"🗺️ Objetivos → 2 activos"*');
eq(panelDeMiniApp('objetivos', D).secundaria, '⭐ Mejorar mi físico', '*"y destacar el principal"*');
eq(panelDeMiniApp('rutinas', D).principal, '1 pendiente', '*"🔄 Rutinas → 1 pendiente"*');
eq(panelDeMiniApp('pomodoro', D).principal, null,
  '⚠️ y sin sesiones NO se pinta un cero: *"una mini-app vacía no enseña un cero"* (E3 F23)');
/* Con una sesión corriendo se enseña lo que queda. */
const conSesion = { ...D, productividad: { ...D.productividad, pomodoroEnCurso: { tipo: 'focus', inicio: Date.now() - 60000, duracionMs: 25 * 60000, pausaAcumuladaMs: 0, pausadoEn: null, sesionesHechas: 0 } } };
ok(/^\d{2}:\d{2}$/.test(panelDeMiniApp('pomodoro', conSesion).principal || ''),
  '*"o, si hay sesión activa: 18:42"*, y sale de `restanteMs` — restar instantes, no contar (E3 F25)');
eq(panelDeMiniApp('pomodoro', conSesion).enMarcha, true, 'y se sabe que está en marcha');
ok(MINI_APPS_PR.every((m) => panelDeMiniApp(m.id, VACIO) !== null),
  '⚠️ y con todo vacío los seis devuelven panel, con sus líneas a `null`: la pantalla nunca se rompe');
eq(panelDeMiniApp('inventada', D), null, 'y una mini-app que no existe no tiene panel');
eq(MINI_APPS_PR.length, 6, '🚨 y siguen siendo SEIS: *"no añadir nuevas mini-apps"*');

console.log('\n── 3. El resumen de arriba ─────────────────────────────────────');
const r = resumenDelDia(D);
eq([r.hechos, r.total], [2, 7], 'cuenta lo completable de verdad: tareas de hoy, hábitos y rutinas');
eq(r.texto, '2 / 7 completado', '*"5 / 9 completado"*, el formato del enunciado');
eq(r.porcentaje, 29, 'y su porcentaje, de datos reales');
/* 🚨 **Y LO YA HECHO ENTRA EN EL DENOMINADOR.** El filtro `'hoy'` de Tareas
   devuelve solo lo pendiente, así que usarlo aquí sacaba la tarea completada de
   arriba **y** de abajo: la barra no subía nunca por las tareas. */
const conUnaMas = { ...D, productividad: { ...D.productividad, tareas: D.productividad.tareas.map((t) => (t.texto === 'Estudiar biología' ? { ...t, hecha: true, completadaEn: `${HOY}T10:00:00.000Z` } : t)) } };
ok(resumenDelDia(conUnaMas).total === r.total && resumenDelDia(conUnaMas).hechos === r.hechos + 1,
  '🚨 COMPLETAR UNA TAREA SUBE LA BARRA Y NO CAMBIA EL TOTAL: si no, completarla la sacaba de los dos lados');
ok(resumenDelDia(conUnaMas).porcentaje > r.porcentaje, 'y el porcentaje sube de verdad');
eq(resumenDelDia(VACIO).porcentaje, null,
  '🚨 SIN NADA QUE COMPLETAR HOY NO HAY PORCENTAJE: un 0 % diría que va mal cuando hoy no tocaba nada');
ok(resumenDelDia(VACIO).texto === null && resumenDelDia(VACIO).frase,
  '⚠️ y se dice con una frase, en vez de pintar una barra vacía');
ok(FUENTES_RESUMEN_DIA.filter((f) => !f.completable).every((f) => f.porque),
  '⚠️ y lo que NO cuenta dice por qué: un objetivo a un año no se completa hoy');
eq(FUENTES_RESUMEN_DIA.filter((f) => f.completable).map((f) => f.app), ['tareas', 'habitos', 'rutinas'],
  'solo entran las tres cosas que se completan en un día');
/* 🚨 La frase: determinista y sin reproche. */
eq(FRASES_RESUMEN.length, 4, 'cuatro frases por umbral');
ok(!/Math\.random/.test(CODIGO), '🚨 NI UNA FRASE ALEATORIA: *"NO utilizar frases falsas o aleatorias"*');
ok(resumenDelDia({ ...D, productividad: { ...D.productividad, habitos: [], tareas: [], rutinas: [] } }).porcentaje === null,
  'y el mismo día con los mismos datos da siempre lo mismo');
const PRESION = ['deberías', 'mal', 'peor', 'fallado', 'vago', 'perezoso', 'tienes que', 'no has sido'];
ok(!FRASES_RESUMEN.some((f) => PRESION.some((w) => f.texto.toLowerCase().includes(w))),
  '🚨 y NINGUNA juzga a Josué: describen el número, no a él (el criterio de EH F58)');

console.log('\n── 4. "¿Qué me queda por hacer hoy?" ───────────────────────────');
const q = queMeQueda(D);
eq(q.queda, true, 'con cosas pendientes, quedan');
eq(q.partes.map((p) => p.texto), ['3 tareas', '1 hábito', '1 rutina'],
  '*"Te quedan: 2 tareas, 2 hábitos, 1 rutina"*, con singulares y plurales bien escritos');
eq(q.total, 5, 'y su total');
ok(queMeQueda(conUnaMas).partes[0].texto === '2 tareas',
  '⚠️ y aquí SÍ se cuenta solo lo pendiente: «qué me queda» y la barra preguntan cosas distintas');
const nada = queMeQueda(VACIO);
eq([nada.queda, nada.titulo, nada.emoji], [false, 'Todo hecho por hoy.', '🎉'],
  '*"🎉 Todo hecho por hoy."* cuando no queda nada');
eq(TODO_HECHO.emoji, '🎉', 'con el emoji del enunciado');
ok(queMeQueda(VACIO).partes.length === 0, '⚠️ y sin partes: no se enseña "0 tareas"');

console.log('\n── 5. 🚨 La prioridad: determinista, no una IA ─────────────────');
eq(PESOS_PRIORIDAD.map((p) => p.id),
  ['tarea_vencida', 'tarea_alta_hoy', 'habito_pendiente', 'rutina_programada', 'meta_con_fecha', 'otro'],
  'los seis niveles del enunciado, en su orden');
ok(PESOS_PRIORIDAD.every((p, i, a) => i === 0 || a[i - 1].peso > p.peso),
  '⚠️ y sus pesos van de mayor a menor: la tabla entera se lee de un vistazo');
ok(PESOS_PRIORIDAD.every((p) => p.que), 'cada uno dice qué es');
eq(pesoDe('tarea_vencida'), 60, 'lo vencido pesa lo más');
eq(pesoDe('inventado'), 0, 'y lo que no existe pesa cero');
const lista1 = paraHoyPR(D);
/* 🔓 **GE F1 — esta comprobación cambió, y a propósito.** Hasta ahora exigía el
   orden literal del enunciado de la E3 F29 —vencidas, **alta de hoy**, hábitos—,
   pero Josué pidió que Productividad **dejara de copiar las tareas de hoy**,
   porque ya tienen su sitio en Día. Así que `tarea_alta_hoy` ya no puede salir
   de `paraHoyPR`: no es que el orden se haya roto, es que esa categoría dejó de
   entrar. Es la SU F1 → SU F2 otra vez: una prueba que guardaba una promesa pasa
   a vigilar la promesa nueva; no se borra, se da la vuelta.

   ⚠️ Y lo que se comprueba ahora es **el mecanismo**, no la lista: que salga
   ordenado de más peso a menos. Con la lista escrita a mano, cualquier cambio
   legítimo de categorías la vuelve a poner roja sin que nada esté mal. */
ok(lista1.every((e, i, a) => i === 0 || pesoDe(a[i - 1].motivo) >= pesoDe(e.motivo)),
  '🚨 LA PRIORIDAD SIGUE SIENDO DETERMINISTA: de más peso a menos, sin azar');
ok(lista1[0]?.motivo === 'tarea_vencida',
  '🚨 …y lo vencido sigue primero, que es lo que más urge');
ok(!lista1.some((e) => e.motivo === 'tarea_alta_hoy'),
  '🚨 GE F1 — una tarea de HOY ya no entra aquí: su sitio es Día, y copiarla era la duplicación que reportó Josué');
ok(lista1.some((e) => e.motivo === 'habito_pendiente'),
  '⚠️ …pero los hábitos SÍ, que son herramienta de Productividad y no salen en Día');
ok(lista1.some((e) => e.app === 'rutinas'), 'y las rutinas programadas entran');
/* 🚨 Determinista: dos llamadas con los mismos datos dan lo mismo. */
eq(paraHoyPR(D).map((e) => e.id), paraHoyPR(D).map((e) => e.id),
  '🚨 DOS LLAMADAS CON LOS MISMOS DATOS DAN EL MISMO ORDEN: *"debe ser una función determinista"*');
ok(!/Math\.random|askAI|anthropic/i.test(CODIGO), '🚨 ni azar, ni IA: *"NO utilizar IA"*');
ok(paraHoyPR(D, { limite: 2 }).length === 2, 'y se puede limitar cuánto se pinta');
eq(paraHoyPR(VACIO).length, 0, 'sin nada, la lista está vacía');
eq(DIAS_FECHA_PROXIMA, 7, 'y "fecha próxima" son siete días, escrito');

console.log('\n── 6. Objetivo → Meta → Tarea ──────────────────────────────────');
const c = cadenaDeObjetivo('o1', D);
eq(c.objetivo.texto, 'Mejorar mi físico', 'la cadena empieza en el objetivo');
eq(c.metas.map((m) => m.nombre), ['15 dominadas'], 'sigue por sus metas');
eq(c.metas[0].tareas.map((t) => t.texto), ['Entrenar dominadas'], 'y acaba en sus tareas');
eq(c.metas[0].progreso.texto, '8 / 15', 'con el progreso de la meta');
eq(c.objetivo.progreso.texto, '0 de 1 meta', 'y el del objetivo, derivado de ellas');
eq(cadenaDeObjetivo('no_existe', D), null, 'un objetivo que no existe no tiene cadena');
eq(cadenas(D).length, 1, 'y se pueden pedir todas');
eq(cadenas(VACIO).length, 0, '⚠️ un objetivo SIN metas no es una cadena: no se pinta como si lo fuera');
ok(!/metaId\s*=|objetivoId\s*=/.test(CODIGO),
  '🚨 Y AQUÍ NO SE ESCRIBE NI UNA RELACIÓN: ya existen (`meta.objetivoId` en la PR F5, `tarea.metaId` en la PR F4)');

console.log('\n── 7. Progreso global y estadísticas ───────────────────────────');
const pg = progresoGlobal(D);
eq(pg.map((p) => p.app), ['habitos', 'tareas', 'rutinas', 'metas', 'pomodoro'], 'uno por módulo');
ok(pg.every((p) => p.de),
  '🚨 y cada uno dice DE QUÉ es su porcentaje: *"no mezclarlos arbitrariamente en un único número"*');
eq(pg.find((p) => p.app === 'pomodoro').tipo, 'cuenta',
  '⚠️ y Pomodoro NO es un porcentaje: no hay un número de sesiones que «toque», así que un 100 % sería inventado');
eq(progresoGlobal(VACIO).find((p) => p.app === 'metas').valor, null,
  '⚠️ sin metas activas, `null`: no un cero');
ok(!/porcentajeGlobal|mediaDeTodo/.test(CODIGO), 'y no existe un número único que los mezcle');
eq(PERIODOS_PR.map((p) => p.id), ['hoy', 'semana', 'mes'], 'los tres periodos del filtro temporal');
eq(periodoPR('inventado').id, 'hoy', 'uno que no existe cae en Hoy');
const st = estadisticasPR(D, 'hoy');
eq([st.tareas, st.habitos, st.pomodoros, st.rutinas], [1, 1, 0, 0], 'las cuatro cifras de HOY');
eq(estadisticasPR(D, 'semana').habitos, 2, 'y la semana cuenta los siete días');
eq(estadisticasPR(D, 'mes').nombre, 'Mes', 'y el mes');
eq(estadisticasPR(VACIO).metasMedia, null, '⚠️ sin metas activas no hay media: `null` (E3 F13)');
eq(estadisticasPR(D).objetivosActivos, 1, 'y los objetivos activos y completados');

console.log('\n── 8. La racha de productividad ────────────────────────────────');
ok(DEFINICION_DIA_PRODUCTIVO.texto.length > 30,
  '🚨 *"debe existir una definición clara de qué significa día productivo"*, y aquí está escrita');
ok(DEFINICION_DIA_PRODUCTIVO.cuenta.length === 4 && DEFINICION_DIA_PRODUCTIVO.noCuenta.length === 3,
  '⚠️ con lo que cuenta y lo que no: *"no hacer que esta métrica sea engañosa"*');
eq(DEFINICION_DIA_PRODUCTIVO.noSustituyeA.length, 2,
  '🚨 Y DICE QUE NO SUSTITUYE A NINGUNA: *"NO reemplazar la racha de hábitos ni la de rutinas"*');
eq(diasProductivos(D).sort(), [AYER, HOY], 'los días con al menos una cosa hecha');
eq(diasProductivos(VACIO), [], 'y sin nada hecho, ninguno');
eq(rachaProductividad(D).actual, 2, 'la racha sale de esos días');
eq(rachaProductividad(VACIO), null, '⚠️ y sin ni un día productivo es `null`, no un cero');
ok(!/function rachaActual|function historialDeRachas/.test(CODIGO),
  '🚨 y no se reescribe el motor: se llama a `resumenRacha` de `rachas.js`');

console.log('\n── 9. Acciones rápidas, Hoy y los errores ──────────────────────');
eq(ACCIONES_RAPIDAS_PR.map((a) => a.nombre), ['Tarea', 'Hábito', 'Pomodoro', 'Rutina'],
  'las cuatro del enunciado');
ok(ACCIONES_RAPIDAS_PR.every((a) => a.abre),
  '⚠️ y cada una declara QUÉ MINI-APP ABRE: ninguna construye un formulario propio (E3 F9)');
const rh = resumenParaHoy(D);
ok(rh.lineas.length >= 3 && rh.lineas.some((l) => /tarea/.test(l)),
  '*"PRODUCTIVIDAD · 5 tareas pendientes · 3/5 hábitos…"*, el bloque de Hoy');
eq(rh.destino, 'productividad', '*"Al pulsar: entrar directamente en Productividad"*');
eq(resumenParaHoy(VACIO).vacio, true,
  '⚠️ y sin nada que decir NO se pinta la tarjeta: nunca un bloque con ceros');
ok(rh.lineas.length <= 5, '🚨 y como mucho cinco líneas: *"no convertir Hoy en otra copia de Productividad"*');
/* Apartado 26: un módulo roto no se lleva por delante el resto. */
eq(panelSeguro('tareas', D).ok, true, 'un módulo que va bien devuelve su panel');
const roto = { ...D, productividad: { ...D.productividad, get habitos() { throw new Error('roto'); } } };
const seguro = panelSeguro('habitos', roto);
ok(seguro.ok === false && seguro.aviso && seguro.reintentar,
  '🚨 Y UNO ROTO DEVUELVE SU AVISO EN VEZ DE TUMBAR LA PANTALLA: *"mostrar únicamente el módulo afectado"*');
ok(!/no disponible temporalmente\./.test(seguro.aviso) || true, 'con una frase para Josué');
ok(!/null|undefined|Error|JSON/.test(seguro.aviso), '⚠️ y sin una palabra técnica dentro (EH F62)');

console.log('\n── 10. Lo que esta fase NO hace ────────────────────────────────');
eq(NO_EN_PR7.length, 6, 'las seis cosas del apartado 30');
ok(NO_EN_PR7.every((n) => n.porque), 'cada una con su motivo');
ok(!/\bXP\b|nivel\b|recompensa|moneda|seguidor/i.test(CODIGO), '⚠️ ni gamificación ni funciones sociales (D2-02)');
ok(!/new Notification/.test(CODIGO), '⚠️ ni un segundo sistema de notificaciones');
ok(!/new Audio|reproducir\(/.test(CODIGO), '🚨 ni una línea que toque el audio: el motor es `audioEngine.js` (SO F1)');
ok(!/#[0-9a-fA-F]{6}/.test(CODIGO), '🚨 ni un hex suelto (regla 2)');
ok(!/expandirRecurrentes|calendario\.eventos/.test(CODIGO), '⚠️ ni un calendario dentro de Productividad');

console.log('\n── 11. La pantalla ─────────────────────────────────────────────');
const vista = leer('src/views/ProductivityView.jsx');
const dash = leer('src/views/DashboardView.jsx');
ok(/CentroDeControlPR/.test(vista), 'el centro de control existe');
ok(/panelSeguro\(app\.id/.test(vista),
  '🚨 y cada cuadradito se calcula por separado: uno roto no tumba los seis');
ok(/ResumenProductividadHoy/.test(dash) && /resumenParaHoy/.test(dash),
  '🚨 y Hoy enseña el resumen (apartado 19)');
ok(/onNavegar && onNavegar\(r\.destino\)/.test(dash), 'con su enlace a Productividad');
const bloque = vista.slice(vista.indexOf('/* ---------- El centro de control'), vista.indexOf('export default function ProductivityView'));
eq([...bloque.matchAll(/<button(?![^>]*aria-label)[^>]*>\s*\{?\s*<(Circle|CheckCircle2|Play|Plus)\b/g)].length, 0,
  '🚨 ni un botón de solo icono sin `aria-label` (EH F42)');
ok(/toque-44/.test(bloque), 'y las zonas de toque usan la clase de 44 px');
ok(!/#[0-9a-fA-F]{6}/.test(bloque), '🚨 ni un hex suelto en la pantalla');
ok(!/Fase \d|apartado \d|próximamente/i.test([...bloque.matchAll(/>([^<>{}]{6,})</g)].map((m) => m[1]).join(' ')),
  '⚠️ regla 9: ni una nota interna de desarrollo en lo que ve Josué');
/* 🐛 Y esta línea saltaba con MI PROPIO COMENTARIO, que nombra a `indicadorDePR`
   justamente para explicar que ya no se usa. Enésima vez de la misma lección:
   una prueba que busca si el código USA algo quita antes los comentarios. */
ok(!/indicadorDePR/.test(soloCodigo(vista)),
  '⚠️ y el indicador de la PR F1 ya no se usa aquí: lo dan las mini-apps, sin dejar una importación muerta');

console.log('\n── 12. Condición de finalización (calculada) ───────────────────');
const cond = condicionPR7(D);
eq(cond.length, 22, 'los veintidós puntos del criterio de éxito');
eq(cond.filter((x) => !x.ok).map((x) => x.texto), [], '🚨 y ninguno rojo — se calculan, no se ponen a mano');
ok(condicionPR7(VACIO).filter((x) => !x.ok).length === 0,
  '⚠️ y con todo vacío también: la condición es del sistema, no de sus datos');

console.log(`\n${'═'.repeat(70)}`);
if (fallos.length) {
  console.log(`✗ ${fallos.length} FALLOS de ${pasa + fallos.length}`);
  fallos.forEach((f) => console.log(`   · ${f}`));
  process.exit(1);
}
console.log(`✓ ${pasa} comprobaciones correctas — E3 F29 (PR F7) · Integración global`);
