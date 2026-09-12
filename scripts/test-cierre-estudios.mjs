// ══════════════════════════════════════════════════════════════════════════
// E3 · FASE 46 (ES F6) — PRÓXIMOS EVENTOS, RESUMEN E INTEGRACIÓN FINAL
// 🏁 LA ÚLTIMA FASE DE LA ENTREGA 3
// ══════════════════════════════════════════════════════════════════════════
//
// El apartado 21 es el que manda: **no se añade ni un sistema**. Y el 19 pide que
// todo proceda de una única fuente — lo que se comprueba **ejecutándolo**: se
// cambia el estado y se mira que lo que enseña el Home cambie solo.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  MAX_EN_HOME, panelDelHome, VACIO_PROXIMO,
  FILTROS_EVENTOS, IDS_FILTRO, filtroEventos, todasLasFechas,
  resumenRapido, proximoDeAsignatura, proximoDeApp, rutaDeFecha,
  auditoriaConsistencia, RECORRIDO_COMPLETO, NO_EN_ES6,
  DEUDA_TECNICA, FUTURO_RECOMENDADO, FASES_ESTUDIOS, informeFinal, condicionES6,
} from '../src/lib/cierreEstudios.js';

import { normalizarAppsDe, etiquetasDeFecha, proximosEventos } from '../src/lib/estudiosApps.js';
import { normalizarAsignaturasDe } from '../src/lib/asignaturas.js';
import { normalizarFechasDe, fechasAcademicas } from '../src/lib/fechasAcademicas.js';

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

const HOY = '2026-09-07';
const VISTA = leer('src/views/EstudiosView.jsx');
const CODIGO_VISTA = soloCodigo(VISTA);
const LIB = leer('src/lib/cierreEstudios.js');
const CODIGO_LIB = soloCodigo(LIB);

const OBJETIVOS = { lista: [{ id: 'o1', texto: 'Sacar un 9', plazo: 'corto', cumplido: false }], ultimaRevision: null };

const ESCENARIO = normalizarFechasDe(normalizarAsignaturasDe(normalizarAppsDe({
  programas: [
    { id: 'bach', nombre: 'Bachillerato', tipo: 'formal' },
    { id: 'ajedrez', nombre: 'Ajedrez', tipo: 'mental', objetivoIds: ['o1'] },
  ],
  asignaturas: [
    { id: 'a1', programaId: 'bach', nombre: 'Biología' },
    { id: 'a2', programaId: 'bach', nombre: 'Historia' },
  ],
  examenes: [
    { id: 'e1', asignaturaId: 'a1', fecha: HOY, tema: 'Genética', hora: '09:00' },
    { id: 'e2', asignaturaId: 'a1', fecha: '2026-09-15', tema: 'Metabolismo' },
    { id: 'e3', asignaturaId: 'a1', fecha: '2026-06-01', tema: 'El que pasó' },
  ],
  entregas: [{ id: 't1', asignaturaId: 'a2', nombre: 'Trabajo de Historia', fecha: '2026-09-12', estado: 'pendiente' }],
  eventos: [{ id: 'v1', asignaturaId: 'a2', nombre: 'Exposición', fecha: '2026-09-20', tipo: 'exposicion' }],
  horas: [], temas: [], actividades: [],
})));

const VACIO = normalizarFechasDe(normalizarAsignaturasDe(normalizarAppsDe({
  programas: [{ id: 'bach', nombre: 'Bachillerato', tipo: 'formal' }],
  asignaturas: [], examenes: [], entregas: [], eventos: [], horas: [], temas: [], actividades: [],
})));

console.log('\n── 1. 🚨 NI UN SISTEMA NUEVO (apartado 21) ──');

ok(!/saveData|localStorage|supabase/.test(CODIGO_LIB), '🚨 La librería de cierre no guarda nada');
ok(!/new Notification|notificaciones/.test(CODIGO_LIB), '🚨 ni emite avisos: el emisor es `notificaciones.js`');
ok(!/celdasMes|calendarioMes|DEFAULT_CALENDARIO/.test(CODIGO_LIB), '🚨 ni monta un segundo calendario');
ok(/fechasAcademicas|proximasFechas/.test(CODIGO_LIB), '🚨 y todo lo que enseña sale de `fechasAcademicas`, la única fuente (ES F4)');
ok(NO_EN_ES6.length >= 7 && NO_EN_ES6.every((x) => x.que && x.porque), 'Lo que no se añade está declarado con su motivo');
ok(NO_EN_ES6.some((x) => /segundo calendario/i.test(x.que)) && NO_EN_ES6.some((x) => /segundo sistema de eventos/i.test(x.que)),
  'incluidos el segundo calendario y el segundo sistema de eventos');

console.log('\n── 2. El Home: hoy primero, y sin lista interminable (apartados 1, 3 y 4) ──');

const panel = panelDelHome(ESCENARIO, HOY);
eq(panel.hoy.map((f) => f.id), ['e1'], '🚨 LO DE HOY VA APARTE Y PRIMERO (apartado 4)');
ok(!panel.proximas.some((f) => f.id === 'e1'), '⚠️ y no se repite abajo: es la misma lista, repartida');
eq(panel.proximas.map((f) => f.fecha), ['2026-09-12', '2026-09-15', '2026-09-20'], 'Lo demás, ordenado por fecha (apartado 2)');
ok(panel.proximas.length <= MAX_EN_HOME, `El Home enseña ${panel.proximas.length}, nunca más de ${MAX_EN_HOME} (apartado 3)`);
eq(panel.vacio, false, 'Con datos no está vacío');
ok(panel.hoy.some((f) => f.tipo === 'examen'), 'Entran los exámenes…');
ok(panel.proximas.some((f) => f.tipo === 'entrega'), '…las entregas…');
ok(panel.proximas.some((f) => f.tipo === 'evento'), '…y los eventos (apartado 2)');
ok(!panel.proximas.some((f) => f.id === 'e3'), '🚨 y lo que ya pasó NO sale (apartado 5)');

// El tope se respeta de verdad.
const muchos = { ...ESCENARIO, eventos: Array.from({ length: 12 }, (_, i) => ({ id: `x${i}`, asignaturaId: 'a2', nombre: `Ev ${i}`, fecha: `2026-10-${String(i + 1).padStart(2, '0')}`, tipo: 'otro' })) };
eq(panelDelHome(muchos, HOY).proximas.length, MAX_EN_HOME, '🚨 Con doce eventos sigue enseñando cinco: *"no mostrar una lista interminable"*');
eq(panelDelHome(muchos, HOY).hayMas, true, 'y aparece «Ver todos»');

// Apartado 6 — el vacío elegante, con salida.
const panelVacio = panelDelHome(VACIO, HOY);
eq(panelVacio.vacio, true, 'Sin eventos, el panel lo dice');
eq(panelVacio.hayMas, false, '⚠️ y «Ver todos» NO aparece: sería un botón que lleva a lo mismo (regla 8)');
ok(/Todo despejado/i.test(VACIO_PROXIMO.titulo), 'El vacío se llama «Todo despejado» (apartado 6)');
ok(VACIO_PROXIMO.accion, '⚠️ y trae una salida: un vacío sin salida es una pantalla rota (EH F41)');

console.log('\n── 3. La vista completa y sus filtros (apartados 8 y 9) ──');

const todas = todasLasFechas(ESCENARIO, HOY);
eq(todas.proximas.map((f) => f.id), ['e1', 't1', 'e2', 'v1'], 'Los próximos, ordenados');
eq(todas.pasadas.map((f) => f.id), ['e3'], 'y los pasados aparte (apartado 8)');
eq(todas.sinFecha, [], 'Sin nada sin fecha, la lista está vacía');
eq(FILTROS_EVENTOS.length, 4, 'Son cuatro filtros (apartado 9)');
eq(IDS_FILTRO, ['todos', 'examenes', 'entregas', 'otros'], 'Todos, Exámenes, Entregas y Otros');
eq(todasLasFechas(ESCENARIO, HOY, 'examenes').proximas.map((f) => f.id), ['e1', 'e2'], 'El filtro de exámenes deja solo exámenes');
eq(todasLasFechas(ESCENARIO, HOY, 'entregas').proximas.map((f) => f.id), ['t1'], 'el de entregas, solo entregas');
eq(todasLasFechas(ESCENARIO, HOY, 'otros').proximas.map((f) => f.id), ['v1'], 'y el de otros, los eventos');
eq(todasLasFechas(ESCENARIO, HOY, 'examenes').pasadas.map((f) => f.id), ['e3'], 'El filtro también vale para los pasados');
eq(filtroEventos('inventado').id, 'todos', 'Un filtro que no existe cae en «Todos»');

// ⚠️ Lo que no tiene fecha no se mete en ninguno de los dos montones.
const conSinFecha = { ...ESCENARIO, entregas: [...ESCENARIO.entregas, { id: 't9', asignaturaId: 'a2', nombre: 'Sin fecha', fecha: null, estado: 'pendiente' }] };
eq(todasLasFechas(conSinFecha, HOY).sinFecha.map((f) => f.id), ['t9'], '⚠️ Lo que no tiene fecha va a su propio montón: no se le inventa un sitio');
ok(!todasLasFechas(conSinFecha, HOY).proximas.some((f) => f.id === 't9'), 'y no se cuela entre los próximos');

console.log('\n── 4. El resumen rápido, sin ceros (apartado 13) ──');

const res = resumenRapido(ESCENARIO, HOY);
ok(res.length <= 3, `Son ${res.length} cifras como mucho: *"no convertirlo en otro dashboard"*`);
ok(res.every((r) => r.cuantos > 0), '🚨 y SOLO las que tienen algo: un panel de ceros no aporta nada');
ok(res.some((r) => /2 exámenes/.test(r.texto)), 'con su plural bien escrito');
ok(res.some((r) => /1 entrega/.test(r.texto)), 'y su singular');
eq(resumenRapido(VACIO, HOY), [], '🚨 Sin nada próximo, el resumen no se pinta');

console.log('\n── 5. Lo próximo de una asignatura y de un área (apartados 10 y 11) ──');

const deBio = proximoDeAsignatura(ESCENARIO, 'a1', HOY);
eq(deBio.map((f) => f.id), ['e1', 'e2'], 'Una asignatura enseña lo suyo');
ok(deBio.every((f) => f.asignaturaId === 'a1'), 'y solo lo suyo');
eq(proximoDeAsignatura(ESCENARIO, 'a2', HOY).map((f) => f.id), ['t1', 'v1'], 'Historia, lo suyo');
const delArea = proximoDeApp(ESCENARIO, 'bach', HOY);
eq(delArea.length, 3, 'El área enseña lo de todas sus asignaturas');
eq(proximoDeApp(ESCENARIO, 'ajedrez', HOY), [], 'Un área sin asignaturas no enseña nada de otra');
// 🚨 *"No duplicar el evento"*: el mismo id sale en los tres sitios, pero es UNO.
ok(panel.hoy.concat(panel.proximas).some((f) => f.id === 'e1') && deBio.some((f) => f.id === 'e1') && delArea.some((f) => f.id === 'e1'),
  '🚨 El MISMO evento se ve desde el Home, la asignatura y el área — y es uno solo (apartado 11)');

console.log('\n── 6. Navegar desde un evento (apartado 7) ──');

const ruta = rutaDeFecha(ESCENARIO, todas.proximas[0]);
eq(ruta.appId, 'bach', 'La ruta llega a su área…');
eq(ruta.asignaturaId, 'a1', '…a su asignatura…');
eq(ruta.seccion, 'examenes', '…y a la sección del tipo que es');
eq(rutaDeFecha(ESCENARIO, { tipo: 'entrega', asignaturaId: 'a2' }).seccion, 'entregas', 'Una entrega lleva a su sección');
eq(rutaDeFecha(ESCENARIO, { tipo: 'evento', asignaturaId: 'a2' }).seccion, 'eventos', 'y un evento a la suya');
eq(rutaDeFecha(ESCENARIO, { asignaturaId: 'no-existe' }), null, 'Una asignatura que ya no está no da ruta');
eq(rutaDeFecha(ESCENARIO, null), null, 'Sin evento tampoco');
ok(!/rutaGuardada|useState.*ruta/.test(CODIGO_LIB), '⚠️ La ruta se CALCULA, no se guarda: renombrar el área no la deja vieja (EH F37)');

console.log('\n── 7. 🚨 CONSISTENCIA: todo de una sola fuente (apartado 19) ──');

const cons = auditoriaConsistencia(ESCENARIO, HOY);
ok(cons.length >= 5, `Se comprueban ${cons.length} consistencias`);
ok(cons.every((c) => c.ok), `Todas: ${cons.filter((c) => !c.ok).map((c) => c.texto).join(', ') || 'ninguna roja'}`);
ok(cons.some((c) => c.id === 'crear_examen'), 'Crear un examen actualiza Próximamente');
ok(cons.some((c) => c.id === 'mover_examen'), 'Cambiar su fecha cambia su posición');
ok(cons.some((c) => c.id === 'pasados'), 'Lo pasado no sale y sigue guardado');
ok(cons.some((c) => c.id === 'ocultar_app'), 'Ocultar un área la quita del Home');
// 🚨 Y se comprueba EJECUTÁNDOLO: una tabla que solo se cuenta a sí misma no demuestra nada.
ok(/panelDelHome\(con/.test(LIB) || /panelDelHome\(movido/.test(LIB),
  '🚨 y cada línea se comprueba ejecutando el cambio, no describiéndolo (EH F42)');

console.log('\n── 8. La pantalla ──');

ok(/FilaProxima/.test(CODIGO_VISTA), '🚨 Una sola fila para el mismo dato en las cuatro pantallas');
ok(/TodosLosEventos/.test(CODIGO_VISTA), 'Existe la vista completa (apartado 8)');
ok(/panelDelHome/.test(CODIGO_VISTA), 'El Home usa el panel repartido');
ok(/VACIO_PROXIMO/.test(CODIGO_VISTA), 'con su vacío elegante');
ok(/resumenRapido/.test(CODIGO_VISTA), 'y su resumen rápido');
ok(/rutaDeFecha/.test(CODIGO_VISTA), 'Pulsar un evento lleva a su detalle (apartado 7)');
ok(/proximoDeAsignatura/.test(CODIGO_VISTA) && /proximoDeApp/.test(CODIGO_VISTA), 'y la asignatura y el área enseñan lo suyo');
// Apartado 14 — nada redundante.
ok(!/Por ahora solo salen los exámenes/.test(VISTA), '🔓 El aviso de que faltaban las entregas se ha ido: ya no falta nada');
ok(!/overflow-x-(auto|scroll)/.test(VISTA), 'Sin scroll horizontal (apartado 16)');
ok(/module-enter/.test(VISTA), 'con la animación de entrada de siempre (apartado 17)');
ok(/aria-label/.test(VISTA) && /aria-pressed/.test(VISTA), 'y nombres accesibles');

console.log('\n── 9. 🏁 EL INFORME FINAL (apartados 20, 22 y 23) ──');

eq(FASES_ESTUDIOS.length, 5, 'El informe ejecuta las cinco fases anteriores');
ok(FASES_ESTUDIOS.every((f) => typeof f.audita === 'function'), '🚨 con sus funciones de verdad, importadas: renombrar una rompe la compilación');
const informe = informeFinal(ESCENARIO, OBJETIVOS, HOY);
eq(informe.estado, 'COMPLETADO', `🏁 EL INFORME DICE: ${informe.estado}`);
ok(informe.fases.every((f) => f.ok), `Las cinco fases en verde: ${informe.fases.filter((f) => !f.ok).map((f) => `${f.id}: ${f.rojas.join(', ')}`).join(' | ') || 'ninguna roja'}`);
ok(informe.consistencia.every((c) => c.ok), 'la consistencia también');
ok(informe.propias.every((c) => c.ok), 'y las casillas de esta fase');
// 🚨 Y puede decir PENDIENTE: un informe que no puede fallar no sirve (EH F42).
eq(informeFinal({ programas: [], asignaturas: 'roto', examenes: [], entregas: [], eventos: [], horas: [], temas: [], actividades: [] }, OBJETIVOS, HOY).estado,
  'PENDIENTE', '🚨 y con el módulo roto dice PENDIENTE: un informe que no puede fallar no sirve');

/* 🚨 CÓMO SE LEE UNA FECHA SE ESCRIBE UNA VEZ (y es un fallo real que cazó Chromium en esta fase).
   La fila del Home componía el título por su cuenta —el `tema` a secas—, así que el mismo examen se
   leía «Derivadas» aquí y «Examen de Matemáticas» en el resto de la app. El apartado 1 y el 4 lo
   enseñan como *"📝 Examen de Biología"*, y quien lo decide es `etiquetasDeFecha`. */
const filaExamen = { tipo: 'examen', id: 'x', asignaturaId: 'a1', nombre: 'Derivadas', fecha: HOY };
eq(etiquetasDeFecha(filaExamen, 'Matemáticas').titulo, 'Examen de Matemáticas',
  '🚨 Un examen se lee «Examen de <asignatura>», el tipo Y la asignatura (apartados 1 y 4)');
eq(etiquetasDeFecha(filaExamen, 'Matemáticas').detalle, 'Derivadas', '⚠️ y el tema pasa al renglón de abajo');
eq(etiquetasDeFecha({ ...filaExamen, nombre: 'Examen' }, 'Matemáticas').detalle, null,
  '⚠️ y sin tema no se repite la palabra «Examen» debajo del título');
eq(etiquetasDeFecha({ tipo: 'entrega', nombre: 'Trabajo de Historia' }, 'Historia').titulo, 'Trabajo de Historia',
  '⚠️ una entrega se lee por SU nombre, que es el que él escribió');
// 🚨 Y la prueba de que es UNA sola regla: `proximosEventos` da exactamente lo mismo.
const delHome = proximosEventos(ESCENARIO, HOY).find((e) => e.tipo === 'examen');
if (delHome) {
  const mismo = fechasAcademicas(ESCENARIO).find((f) => f.tipo === 'examen' && f.id === delHome.id);
  const nombreAsig = (ESCENARIO.asignaturas || []).find((a) => a.id === mismo.asignaturaId)?.nombre || '';
  eq(delHome.titulo, etiquetasDeFecha(mismo, nombreAsig).titulo,
    '🚨 y `proximosEventos` y la fila de pantalla dicen LO MISMO del mismo examen');
}

// Y que la pantalla no se escriba la suya: la regla se pide, no se repite.
ok(/etiquetasDeFecha/.test(CODIGO_VISTA), '🚨 y la fila de pantalla PIDE esa regla en vez de repetirla');
ok(!/`Examen de \$\{/.test(CODIGO_VISTA), '🚨 sin componer el título a mano en la vista');

ok(RECORRIDO_COMPLETO.length >= 6, 'El recorrido del apartado 20 está declarado');
ok(DEUDA_TECNICA.length >= 3 && DEUDA_TECNICA.every((d) => d.que && d.detalle && d.decide),
  '⚠️ La deuda técnica se declara con quién decide (apartado 23, punto 9)');
ok(FUTURO_RECOMENDADO.length >= 3 && FUTURO_RECOMENDADO.every((f) => f.que && f.porque),
  '⚠️ y lo futuro se recomienda SIN implementarlo (apartado 23, punto 10)');
ok(DEUDA_TECNICA.some((d) => /bot[óo]n atr[áa]s/i.test(d.que)), 'incluido el botón atrás, que es de toda la app');

const cond = condicionES6(ESCENARIO, OBJETIVOS, HOY);
ok(cond.length >= 12, `La condición tiene ${cond.length} casillas`);
ok(cond.every((c) => c.id && c.texto && typeof c.ok === 'boolean'), 'Cada casilla dice qué comprueba');
ok(cond.every((c) => c.ok), `Todas en verde: ${cond.filter((c) => !c.ok).map((c) => c.texto).join(', ') || 'ninguna roja'}`);

console.log(`\n  ${fallos.length ? '✗' : '✓'} ES F6 — ${pasa} comprobaciones${fallos.length ? `, ${fallos.length} FALLOS` : ''}`);
if (fallos.length) { fallos.forEach((f) => console.log(`      ✗ ${f}`)); process.exit(1); }
