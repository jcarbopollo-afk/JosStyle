// ---------------------------------------------------------------------------
// 🧯 F-1 · F-2 · F-3 y C-89 (2026-11-17) — Deshacer revierte SOLO lo que cambió su paso: no pierde Imagen personal,
// ni Fitness, ni las apariencias, ni los pomodoros, las rutinas hechas, la revisión de objetivos o los logros guardados
// después, y no resucita lo eliminado definitivamente de la papelera.
//
//   node --import ./scripts/resolver-vite.mjs scripts/test-deshacer-por-cambios.mjs
//
// La librería (`src/lib/deshacerPorCambios.js`) con escenarios hechos con las funciones DE VERDAD de Fitness y de la
// papelera, y lo que `App.jsx` tiene que hacer con ella (leído del código). La prueba de punta a punta, con el dedo, es
// la sección «🧯 F-1 · F-2 · F-3» de `test-app-real.mjs` (22 de 53 en rojo antes de su arreglo) y la «🧯 C-89» (15 de 37).
// ---------------------------------------------------------------------------
import { readFileSync } from 'node:fs';
import { cambiosDeUnPaso, deshacerConCambios, huella, CLAVES_FUERA_DE_CAMBIOS, FORMATO_CAMBIOS_PASO } from '../src/lib/deshacerPorCambios.js';
import { igualJson, aplicarCambios } from '../src/lib/operacionesProtegidas.js';
import { prepararEliminacion, prepararRestauracion } from '../src/lib/papelera.js';
import { prepararEliminarRutina, prepararEliminarPlantilla, guardarRutinaCiclica, crearRutinaCiclica, configurarDia, activarRutina, devolverAHuecos } from '../src/lib/rutinasCiclicas.js';
import { normalizarFitnessConSesiones } from '../src/lib/entrenamiento.js';

let pasa = 0; let fallos = 0;
const ok = (c, m, d = '') => { if (c) { pasa++; console.log(`  ✓ ${m}`); } else { fallos++; console.error(`  ✗ ${m}${d ? ` → ${d}` : ''}`); } };
const copia = (v) => JSON.parse(JSON.stringify(v));
const HOY = '2026-11-17';

/* Un Fitness de verdad: tres entrenamientos, tres objetivos, dos plantillas, una rutina activa que usa una de ellas. */
const sesion = (id, fecha) => ({ id, nombre: `Entreno ${id}`, fecha, estado: 'completada', inicio: `${fecha}T10:00:00.000Z`, fin: `${fecha}T11:00:00.000Z`, origen: { tipo: 'plan', id: null, ejercicios: [] } });
const linea = (id) => ({ id, exerciseId: 'press-banca-barra', orden: 0, series: 3, repeticiones: 8, descanso: 90, config: {}, modo: 'reps' });
let F = normalizarFitnessConSesiones({
  sesiones: [sesion('s1', '2026-11-01'), sesion('s2', '2026-11-05'), sesion('s3', '2026-11-10')],
  objetivos: ['o1', 'o2', 'o3'].map((id, i) => ({ id, exerciseId: 'press-banca-barra', tipo: 'peso', valor: 60 + i * 10, unidad: 'kg', creadoEn: '2026-11-01', estado: 'activo' })),
  plantillas: [
    { id: 'pl1', nombre: 'Mi Push', ejercicios: [linea('l1')], meta: {}, creadoEn: HOY, editadoEn: HOY },
    { id: 'pl2', nombre: 'Mi Pull', ejercicios: [linea('l2')], meta: {}, creadoEn: HOY, editadoEn: HOY },
  ],
  rutinas: [], predeterminadasRetiradas: { rutinas: [], plantillas: [] },
});
{
  let r = crearRutinaCiclica({ nombre: 'Ciclo', duracion: 2 });
  r = configurarDia(r, r.dias[0].id, { tipo: 'entreno', plantillaId: 'pl1' });
  r = configurarDia(r, r.dias[1].id, { tipo: 'descanso' });
  const g = guardarRutinaCiclica(F, r, { hoy: HOY }); F = g.fitness || g;
  const rid = F.rutinas.find((x) => x.nombre === 'Ciclo').id;
  const a = activarRutina(F, rid, { confirmado: true, hoy: HOY }); F = a.fitness || a;
}
const RID = F.rutinas.find((x) => x.nombre === 'Ciclo').id;

/* Lo que hace App.jsx al borrar de Fitness (`eliminarConPapelera`): la preparación de su módulo, y la papelera. */
const borrar = (f, coleccion, id) => {
  let base = f;
  if (coleccion === 'rutinas') base = prepararEliminarRutina(f, id, { hoy: HOY }).fitness;
  if (coleccion === 'plantillas') base = prepararEliminarPlantilla(f, id, { hoy: HOY }).fitness;
  const r = prepararEliminacion(base, 'fitness', coleccion, id, `${HOY}T12:00:00.000Z`);
  return r ? { despues: r.moduloActualizado, entrada: r.entrada } : { despues: base, entrada: null };
};

console.log('\n── F-2 · Deshacer cada borrado de Fitness lo devuelve EXACTO, con sus relaciones ──');
for (const [nombre, coleccion, id] of [
  ['un entrenamiento (el del medio)', 'sesiones', 's2'],
  ['un objetivo (el del medio)', 'objetivos', 'o2'],
  ['una plantilla de la rutina activa (su día pasa a descanso)', 'plantillas', 'pl1'],
  ['la rutina activa (se quita el plan activo)', 'rutinas', RID],
  ['una rutina predeterminada (se retira)', 'rutinas', 'ppl-estetico'],
]) {
  const { despues } = borrar(F, coleccion, id);
  ok(!igualJson(despues, F), `${nombre}: el borrado cambia Fitness`);
  const reg = cambiosDeUnPaso(F, despues);
  ok(!!reg && reg.formato === FORMATO_CAMBIOS_PASO, `${nombre}: el paso apunta qué cambió`);
  /* Lo apuntado viaja al servidor dentro de `historial`: tiene que sobrevivir a JSON. */
  const r = deshacerConCambios(copia(despues), copia(reg));
  ok(r.ok && igualJson(r.valor, F), `🚨 ${nombre}: Deshacer lo devuelve EXACTO (posición, relaciones y campos)`, r.ok ? '' : JSON.stringify(r));
}
{
  const { despues } = borrar(F, 'plantillas', 'pl1');
  const rut = (f) => f.rutinas.find((x) => x.id === RID);
  ok(rut(despues).dias[0].tipo === 'descanso' && rut(F).dias[0].tipo === 'entreno', 'la plantilla borrada deja su día de la rutina activa en descanso…');
  const r = deshacerConCambios(despues, cambiosDeUnPaso(F, despues));
  ok(r.ok && rut(r.valor).dias[0].tipo === 'entreno' && rut(r.valor).dias[0].plantillaId === 'pl1', '🚨 …y Deshacer le devuelve su día de entrenamiento (la relación)');
  ok(r.ok && r.valor.plantillas.map((p) => p.id).join() === 'pl1,pl2', '…y la plantilla vuelve a su sitio (la primera)');
}

console.log('\n── F-2 · Lo guardado DESPUÉS del paso no se pierde ──');
{
  const { despues } = borrar(F, 'sesiones', 's2');
  const reg = cambiosDeUnPaso(F, despues);
  /* Después de borrar, entrena: una sesión nueva, guardada directamente (`guardarFitness`, sin paso). */
  const conNueva = { ...despues, sesiones: [...despues.sesiones, sesion('s9', HOY)] };
  const r = deshacerConCambios(conNueva, reg);
  ok(r.ok && r.valor.sesiones.some((s) => s.id === 's2') && r.valor.sesiones.some((s) => s.id === 's9'),
    '🚨 Deshacer devuelve el entrenamiento borrado Y conserva el que se registró después');
  ok(r.ok && r.valor.sesiones.map((s) => s.id).join() === 's1,s2,s3,s9', '…cada uno en su sitio');
  /* La foto entera (lo que haría reescribir el paso) habría perdido el nuevo: por eso Fitness no se restaura así. */
  ok(!F.sesiones.some((s) => s.id === 's9'), '⚠️ la foto del paso NO tiene el entrenamiento nuevo: reescribirla lo perdería');
}
{
  /* Después de borrar la plantilla, cambia su rutina (activa otra cosa): deshacer pisaría ese cambio → no se toca. */
  const { despues } = borrar(F, 'plantillas', 'pl1');
  const reg = cambiosDeUnPaso(F, despues);
  const rutinaCambiada = { ...despues, rutinas: despues.rutinas.map((x) => (x.id === RID ? { ...x, nombre: 'Ciclo editado' } : x)) };
  const r = deshacerConCambios(rutinaCambiada, reg);
  ok(!r.ok && r.motivo === 'cambiado', '🚨 si lo que cambió el paso se modificó después, NO se deshace (no se pisa)', JSON.stringify(r));
  const recreada = { ...despues, plantillas: [{ ...F.plantillas[0], nombre: 'Otra con el mismo id' }, ...despues.plantillas] };
  const r2 = deshacerConCambios(recreada, reg);
  ok(!r2.ok && r2.motivo === 'cambiado', '…ni si el elemento ya volvió por otro camino (la papelera, otro aparato)');
}
{
  /* Restaurar desde la papelera también es un paso: deshacerlo lo quita, si sigue igual. */
  const { despues, entrada } = borrar(F, 'sesiones', 's2');
  const restaurado = prepararRestauracion(despues, entrada).moduloActualizado;
  const reg = cambiosDeUnPaso(despues, restaurado);
  const r = deshacerConCambios(restaurado, reg);
  ok(r.ok && !r.valor.sesiones.some((s) => s.id === 's2'), 'deshacer una restauración la vuelve a quitar');
  const editada = { ...restaurado, sesiones: restaurado.sesiones.map((s) => (s.id === 's2' ? { ...s, notas: 'nota posterior' } : s)) };
  ok(!deshacerConCambios(editada, reg).ok, '…pero no si se editó después (se perdería la edición)');
  /* Y devolver una plantilla recuperada a sus días (otro paso directo) tampoco se pisa. */
  const borrada = borrar(F, 'plantillas', 'pl1');
  const recuperada = prepararRestauracion(borrada.despues, borrada.entrada).moduloActualizado;
  const reg2 = cambiosDeUnPaso(borrada.despues, recuperada);
  const devuelta = devolverAHuecos(recuperada, 'pl1', { hoy: HOY });
  const conDias = devuelta.fitness || devuelta;
  ok(!deshacerConCambios(conDias, reg2).ok, '…ni una plantilla recuperada que después se devolvió a sus días');
}

console.log('\n── F-3 · Las apariencias (una lista en la raíz) ──');
{
  const temas = [{ id: 'ta', nombre: 'A' }, { id: 'tb', nombre: 'B' }, { id: 'tc', nombre: 'C' }];
  const sinB = temas.filter((t) => t.id !== 'tb');
  const reg = cambiosDeUnPaso(temas, sinB);
  ok(!!reg && reg.lista === true, 'el paso de borrar una apariencia apunta qué cambió');
  const r = deshacerConCambios(sinB, copia(reg));
  ok(r.ok && Array.isArray(r.valor) && r.valor.map((t) => t.id).join() === 'ta,tb,tc', '🚨 Deshacer la devuelve a su sitio (y sigue siendo una lista)');
  const conNueva = [...sinB, { id: 'td', nombre: 'Nueva' }].map((t) => (t.id === 'ta' ? { ...t, nombre: 'A renombrada' } : t));
  const r2 = deshacerConCambios(conNueva, reg);
  ok(r2.ok && r2.valor.map((t) => t.id).join() === 'ta,tb,tc,td' && r2.valor[0].nombre === 'A renombrada',
    '…sin perder lo guardado después (una nueva, un renombrado)');
  ok(!deshacerConCambios([...sinB, { id: 'tb', nombre: 'otra B' }], reg).ok, '…y sin pisar una que ya volvió');
}

console.log('\n── C-89 · Productividad: lo guardado fuera de los pasos sobrevive ──');
{
  const P0 = { tareas: [{ id: 't1', texto: 'Uno' }, { id: 't2', texto: 'Dos' }, { id: 't3', texto: 'Tres' }], rutinas: [{ id: 'r1', nombre: 'Rutina' }],
    rutinaEjecuciones: [], pomodoroSesiones: [], pomodoros: {}, pomodoroConfig: null, pomodoroEnCurso: null };
  /* Paso: borrar la tarea del medio. */
  const P1 = { ...P0, tareas: P0.tareas.filter((t) => t.id !== 't2') };
  const reg = cambiosDeUnPaso(P0, P1);
  ok(!reg.entero && reg.cambios.length === 1 && reg.cambios[0].camino.join() === 'tareas', 'el paso apunta solo lo que cambió: las tareas');
  /* Después, fuera de los pasos: dos pomodoros, el contador, la rutina modificada, una rutina hecha, la configuración. */
  const P2 = { ...P1, pomodoroSesiones: [{ id: 'ps1', tipo: 'focus' }, { id: 'ps2', tipo: 'focus', interrumpida: true }], pomodoros: { '2026-11-17': 1 },
    rutinas: [{ id: 'r1', nombre: 'Rutina cambiada' }], rutinaEjecuciones: [{ id: 'ej1', rutinaId: 'r1' }], pomodoroConfig: { enfoque: 30 } };
  const r = deshacerConCambios(copia(P2), copia(reg), { antes: P0 });
  ok(r.ok && r.valor.tareas.map((t) => t.id).join() === 't1,t2,t3', '🚨 la tarea vuelve, a su sitio');
  ok(r.ok && igualJson({ ...r.valor, tareas: null }, { ...P2, tareas: null }), '🚨 los pomodoros, el contador, la rutina modificada, la rutina hecha y la configuración SOBREVIVEN');
  /* Paso: añadir una tarea; después, pomodoros; deshacer la quita y deja lo demás. */
  const P3 = { ...P0, tareas: [...P0.tareas, { id: 't4', texto: 'Cuatro' }] };
  const reg2 = cambiosDeUnPaso(P0, P3);
  const r2 = deshacerConCambios({ ...P3, pomodoroSesiones: [{ id: 'ps9' }] }, reg2, { antes: P0 });
  ok(r2.ok && !r2.valor.tareas.some((t) => t.id === 't4') && r2.valor.pomodoroSesiones.length === 1, 'deshacer añadir una tarea la quita y conserva un pomodoro de después');
  /* Reintento: aplicar otra vez el mismo Deshacer sobre lo ya deshecho no cambia nada ni falla. */
  const r3 = deshacerConCambios(r.valor, reg, { antes: P0 });
  ok(r3.ok && igualJson(r3.valor, r.valor), 'un reintento del mismo Deshacer sobre lo ya deshecho no cambia nada (idempotente)');
}

console.log('\n── C-89 · Objetivos y logros ──');
{
  const O0 = { lista: [{ id: 'o1', texto: 'A' }, { id: 'o2', texto: 'B' }], ultimaRevision: null };
  const O1 = { ...O0, lista: [O0.lista[0], { id: 'o2', texto: 'B editado' }] };
  const reg = cambiosDeUnPaso(O0, O1);
  const r = deshacerConCambios({ ...O1, ultimaRevision: '2026-11-17' }, reg, { antes: O0 });
  ok(r.ok && r.valor.lista[1].texto === 'B' && r.valor.ultimaRevision === '2026-11-17', '🚨 deshacer una edición de un objetivo conserva la fecha de revisión guardada después');
  ok(!deshacerConCambios({ ...O1, lista: [O0.lista[0], { id: 'o2', texto: 'B otra vez' }] }, reg, { antes: O0 }).ok, '🚨 …pero si ESE objetivo cambió después, no se pisa (conflicto)');
  /* Un paso que cambia la revisión (si lo fuera) y otra revisión después: conflicto, no se pisa. */
  const reg3 = cambiosDeUnPaso(O0, { ...O0, ultimaRevision: '2026-11-10' });
  const r3 = deshacerConCambios({ ...O0, ultimaRevision: '2026-11-17' }, reg3, { antes: O0 });
  ok(!r3.ok && r3.motivo === 'cambiado', 'un campo que el paso cambió y se cambió después: conflicto');
  ok(deshacerConCambios({ ...O0, ultimaRevision: null }, reg3, { antes: O0 }).ok, '…y si ya está como antes, no hace falta (no es un conflicto)');

  const G0 = { desbloqueados: [{ id: 'l1', definicionId: 'constancia', rachaId: 'ra' }], hitos: { ra: [7] } };
  /* Paso: borrar una racha olvida sus logros e hitos. Después se consigue OTRO logro. */
  const G1 = { desbloqueados: [], hitos: {} };
  const reg4 = cambiosDeUnPaso(G0, G1);
  const r4 = deshacerConCambios({ ...G1, desbloqueados: [{ id: 'l9', definicionId: 'vuelta', rachaId: null }] }, reg4, { antes: G0 });
  ok(r4.ok && r4.valor.desbloqueados.map((l) => l.id).join() === 'l1,l9' && igualJson(r4.valor.hitos, G0.hitos),
    '🚨 deshacer devuelve el logro olvidado y CONSERVA el conseguido después');
  const r5 = deshacerConCambios({ desbloqueados: [], hitos: { rb: [3] } }, reg4, { antes: G0 });
  ok(!r5.ok, '…y si los hitos cambiaron después (otro sitio), no se pisan: conflicto');
}

console.log('\n── C-89 · La papelera: nada eliminado definitivamente vuelve ──');
{
  const e = (id) => ({ id, modulo: 'sueno', coleccion: null, idOriginal: `o-${id}`, datos: { id: `o-${id}` } });
  const A0 = { elementos: [e('e0')], retencionDias: 30 };
  /* Paso: borrar algo (entra su entrada). Después: se elimina definitivamente la entrada vieja y se cambia la retención. */
  const A1 = { ...A0, elementos: [...A0.elementos, e('e1')] };
  const reg = cambiosDeUnPaso(A0, A1);
  const despues = { elementos: [e('e1')], retencionDias: 0 };
  const r = deshacerConCambios(despues, reg, { antes: A0 });
  ok(r.ok && r.valor.elementos.length === 0, '🚨 deshacer el borrado saca SU entrada y NO vuelve a meter la eliminada definitivamente');
  ok(r.ok && r.valor.retencionDias === 0, '…y la retención que se eligió después se queda');
  /* Paso: restaurar (sale su entrada). Deshacerlo la devuelve, si no estaba ya. */
  const reg2 = cambiosDeUnPaso(A1, A0);
  const r2 = deshacerConCambios({ elementos: [], retencionDias: 30 }, reg2, { antes: A1 });
  ok(r2.ok && r2.valor.elementos.map((x) => x.id).join() === 'e1', 'deshacer una restauración devuelve su entrada (y no la eliminada después)');
}

console.log('\n── C-89 · Orden, forma entera y datos ausentes ──');
{
  const L0 = { tareas: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] };
  const L1 = { tareas: [{ id: 'c' }, { id: 'a' }, { id: 'b' }] };
  const reg = cambiosDeUnPaso(L0, L1);
  ok(reg.cambios[0].orden && reg.cambios[0].ordenAntes.join() === 'a,b,c', 'un paso que solo reordena apunta el orden de antes');
  const r = deshacerConCambios({ tareas: [...L1.tareas, { id: 'd' }] }, reg, { antes: L0 });
  ok(r.ok && r.valor.tareas.map((t) => t.id).join() === 'a,b,c,d', 'deshacerlo devuelve el orden y conserva lo añadido después');
  ok(!deshacerConCambios({ tareas: [{ id: 'b' }, { id: 'c' }, { id: 'a' }] }, reg, { antes: L0 }).ok, '…pero si se reordenó otra vez, no se pisa');
  /* Un paso que AÑADE al principio también apunta un orden; deshacerlo solo quita lo añadido: lo de después no se mueve. */
  const regM = cambiosDeUnPaso(L0, { tareas: [{ id: 'n' }, ...L0.tareas] });
  ok(regM.cambios[0].anadir && regM.cambios[0].orden, 'añadir al principio apunta lo añadido y el orden');
  const rM = deshacerConCambios({ tareas: [{ id: 'n' }, { id: 'a' }, { id: 'x' }, { id: 'b' }, { id: 'c' }] }, regM, { antes: L0 });
  ok(rM.ok && rM.valor.tareas.map((t) => t.id).join() === 'a,x,b,c', '🚨 deshacerlo quita lo añadido y NO mueve lo que se añadió después en medio');

  const regE = cambiosDeUnPaso(null, { x: 1 });
  ok(regE.entero === true && typeof regE.huella === 'string', 'algo que no se puede por elementos apunta la huella del resultado');
  ok(deshacerConCambios({ x: 1 }, regE, { antes: null }).ok && deshacerConCambios({ x: 1 }, regE, { antes: null }).valor === null, '…se vuelve a la foto si sigue igual');
  ok(deshacerConCambios({ x: 2 }, regE, { antes: null }).motivo === 'cambiado', '…y no si cambió después');
  ok(deshacerConCambios({ x: 1 }, regE).motivo === 'no_invertible', '…ni sin la foto');
  ok(cambiosDeUnPaso({ a: 1, b: 2 }, { a: 1 }).entero === true, 'un campo que desaparece → huella (no se puede decir por elementos)');
  ok(huella({ a: 1, b: [1, 2] }) === huella({ b: [1, 2], a: 1 }) && huella([1, 2]) !== huella([2, 1]), 'la huella es la de jsonb: el orden de las claves no cuenta; el de una lista, sí');
  ok(deshacerConCambios({}, null).motivo === 'sin_cambios', 'sin registro (un paso de una versión anterior) → «sin_cambios»');
  ok(deshacerConCambios({}, { formato: 99, cambios: [] }).motivo === 'no_invertible', 'otro formato → «no_invertible»');
  ok(deshacerConCambios([], cambiosDeUnPaso({ x: [] }, { x: [{ id: 'a' }] })).motivo === 'cambiado', 'una lista donde esperaba un objeto → «cambiado»');
  ok(CLAVES_FUERA_DE_CAMBIOS.join() === 'horarioTop', 'solo el horario queda fuera: va por su escritor protegido');
}

console.log('\n── C-89 · El conflicto lo detecta el propio helper, antes de aplicar nada ──');
/* `aplicarCambios` también se niega a pisar (sus condiciones), así que quitar la comprobación de conflicto del helper
   dejaba el resultado en `ok: false, motivo: 'cambiado'` y la mutación sobrevivía. Lo que la delata es QUIÉN lo
   detectó: el helper responde con su diagnóstico (`{ campo }` / `{ id }`); si llegara a `aplicarCambios`, el fallo
   sería el suyo (`{ motivo: 'campo_distinto' | 'elemento_existe', clave, camino, … }`). Se exige el del helper. */
{
  /* Un campo (`fijar`) que el paso cambió y se cambió después. */
  const O0 = { lista: [], ultimaRevision: null };
  const reg = cambiosDeUnPaso(O0, { ...O0, ultimaRevision: '2026-11-10' });
  const r = deshacerConCambios({ ...O0, ultimaRevision: '2026-11-17' }, reg, { antes: O0 });
  ok(!r.ok && r.motivo === 'cambiado' && igualJson(r.fallo, { campo: 'ultimaRevision' }),
    '🚨 un campo cambiado después: el conflicto lo detecta el helper, no las condiciones de aplicarCambios', JSON.stringify(r));

  /* Lo que el paso quitó vuelve… pero ya hay otro distinto con ese id (otro aparato, o se volvió a crear). */
  const T0 = { tareas: [{ id: 'a', texto: 'A' }, { id: 'b', texto: 'B' }] };
  const regQ = cambiosDeUnPaso(T0, { tareas: [T0.tareas[0]] });
  const rQ = deshacerConCambios({ tareas: [T0.tareas[0], { id: 'b', texto: 'B nueva' }] }, regQ, { antes: T0 });
  ok(!rQ.ok && rQ.motivo === 'cambiado' && igualJson(rQ.fallo, { id: 'b' }),
    '🚨 lo quitado ya existe distinto: el conflicto lo detecta el helper, no aplicarCambios (no se pisa «B nueva»)', JSON.stringify(rQ));

  /* La prueba distingue las dos capas: lo que diría `aplicarCambios` si la inversa le llegara sin filtrar. */
  const abajo = aplicarCambios({ ...O0, ultimaRevision: '2026-11-17' },
    [{ camino: [], fijar: [{ campo: 'ultimaRevision', igual: '2026-11-10', valor: null }] }], 'deshacer');
  ok(abajo.fallo && abajo.fallo.motivo === 'campo_distinto' && !igualJson(abajo.fallo, { campo: 'ultimaRevision' }),
    '…y aplicarCambios lo habría dicho de otra forma: las dos comprobaciones no se confunden');
  /* Y los dos casos sin conflicto siguen deshaciéndose (la prueba no rechaza por rechazar). */
  ok(deshacerConCambios({ ...O0, ultimaRevision: '2026-11-10' }, reg, { antes: O0 }).ok, '…sin cambio posterior, el campo sí se deshace');
  const rQok = deshacerConCambios({ tareas: [T0.tareas[0]] }, regQ, { antes: T0 });
  ok(rQok.ok && rQok.valor.tareas.map((t) => t.id).join() === 'a,b', '…y lo quitado vuelve a su sitio si nadie lo volvió a crear');
}

console.log('\n── Lo que hace App.jsx (leído del código) ──');
const APP = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const trozo = (desde, hasta) => { const i = APP.indexOf(desde); return i < 0 ? '' : APP.slice(i, APP.indexOf(hasta, i) + hasta.length); };
const UNDO = trozo('const undo = async () => {', "saveData(uidUser, 'historial', rest);\n  };");
const SNAP = trozo('const snapshotAndSave = ', 'return resultadoDeGuardados(guardados);');
ok(UNDO.length > 2000 && SNAP.length > 2000, 'se encuentran `undo` y `snapshotAndSave` enteros');
ok(/const fotoDelEstado = \(\) => \(\{[^}]*\bestiloHombre\b[^}]*cumpleanos \}\);/.test(APP), 'F-1 — la foto del paso lleva `estiloHombre`');
ok(!/last\.estiloHombre \|\|/.test(UNDO) && !/\|\| DEFAULT_[A-Z_]+/.test(UNDO), '🚨 F-1 — Deshacer no rellena nada con valores de fábrica');
ok(/for \(const k of snapshot\.claves\) \{\s*if \(CLAVES_FUERA_DE_CAMBIOS\.includes\(k\)\) continue;\s*cambiosDelPaso\[k\] = cambiosDeUnPaso\(/.test(SNAP), '🚨 C-89 — el paso apunta qué cambió en CADA clave que toca (salvo el horario)');
ok(/if \(!Array\.isArray\(ultimoPaso\.claves\) \|\| !ultimoPaso\.cambios/.test(UNDO) && /setAvisoApp\('deshacer_paso_antiguo'\)/.test(UNDO), '🚨 C-89 — un paso de una versión anterior no se deshace a ciegas');
ok(/for \(const k of last\.claves\) \{/.test(UNDO) && /deshacerConCambios\(ACTUAL\[k\], registro, \{ antes: last\[k\] \}\)/.test(UNDO), '🚨 C-89 — Deshacer recorre SOLO las claves del paso y aplica su inversa sobre lo de ahora');
ok(!/set\(last\[k\]\)|setPapelera\(last\.papelera|setProductividad\(last\./.test(UNDO), '🚨 C-89 — ninguna clave se reescribe con la foto entera (salvo el horario, por su escritor)');
ok(UNDO.indexOf("setAvisoApp('deshacer_no_seguro'); return;") < UNDO.indexOf('for (const [set, clave, valor] of deshechos)'), 'C-89 — un conflicto se detecta ANTES de escribir nada');
ok(/if \(patch\.temasGuardados\) \{ setTemasGuardados\(patch\.temasGuardados\); guardados\.push\(saveData\(uidUser, 'temasGuardados'/.test(SNAP), 'F-3 — `snapshotAndSave` guarda las apariencias');
ok(/const eliminarTemaGuardado = \(id\) => eliminarConPapelera\('temasGuardados', null, id\);/.test(APP), 'F-3 — Gestión de temas borra por la papelera');
const GT = readFileSync(new URL('../src/components/GestionTemas.jsx', import.meta.url), 'utf8');
ok(/Irá a Eliminados recientemente/.test(GT), 'F-3 — y su confirmación lo dice');
const AV = readFileSync(new URL('../src/lib/accionesHoyAgenda.js', import.meta.url), 'utf8');
ok(['deshacer_no_seguro', 'deshacer_paso_antiguo', 'deshacer_fitness_solo_lectura'].every((k) => new RegExp(`${k}: \\{ texto: 'No se ha deshecho`).test(AV)), 'los tres avisos dicen que no se ha deshecho y por qué');

console.log(`\n${fallos === 0 ? '✓' : '✗'} ${pasa}/${pasa + fallos} comprobaciones de Deshacer por cambios (F-1, F-2, F-3 y C-89)`);
if (fallos) process.exit(1);
