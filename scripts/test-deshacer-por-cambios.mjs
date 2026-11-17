// ---------------------------------------------------------------------------
// 🧯 F-1 · F-2 · F-3 (auditoría de E1-P, 2026-11-17) — Deshacer no pierde Imagen personal, ni Fitness, ni las apariencias.
//
//   node --import ./scripts/resolver-vite.mjs scripts/test-deshacer-por-cambios.mjs
//
// La librería (`src/lib/deshacerPorCambios.js`) con escenarios hechos con las funciones DE VERDAD de Fitness y de la
// papelera, y lo que `App.jsx` tiene que hacer con ella (leído del código). La prueba de punta a punta, con el dedo, es
// la sección «🧯 F-1 · F-2 · F-3» de `test-app-real.mjs`, que salía roja antes del arreglo (22 de 53).
// ---------------------------------------------------------------------------
import { readFileSync } from 'node:fs';
import { cambiosDeUnPaso, inversaDeUnPaso, deshacerConCambios, papeleraAlDeshacer, CLAVES_DESHACER_POR_CAMBIOS, FORMATO_CAMBIOS_PASO } from '../src/lib/deshacerPorCambios.js';
import { igualJson } from '../src/lib/operacionesProtegidas.js';
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

console.log('\n── Lo que no se puede apuntar ni deshacer ──');
ok(cambiosDeUnPaso({ a: 1 }, [1]) === null && cambiosDeUnPaso([1], { a: 1 }) === null, 'formas distintas → null');
ok(cambiosDeUnPaso({ a: 1, b: 2 }, { a: 1 }) === null, 'un campo que desaparece → null (no se puede decir sin reescribir)');
ok(cambiosDeUnPaso(null, { a: 1 }) === null, 'sin valor de antes → null');
ok(deshacerConCambios({}, null).motivo === 'sin_cambios', 'sin registro → «sin_cambios»');
ok(deshacerConCambios({}, { formato: 99, cambios: [] }).motivo === 'no_invertible', 'otro formato → «no_invertible»');
ok(deshacerConCambios([], cambiosDeUnPaso({ x: [] }, { x: [{ id: 'a' }] })).motivo === 'cambiado', 'una lista donde esperaba un objeto → «cambiado»');
ok(inversaDeUnPaso({ formato: 1, cambios: [{ camino: [], fijar: [{ campo: 'x', valor: 1 }] }] }) === null, 'un fijar sin condición no se invierte');
ok(CLAVES_DESHACER_POR_CAMBIOS.join() === 'fitness,temasGuardados', 'las claves que se deshacen por cambios son Fitness y las apariencias');

console.log('\n── La papelera al deshacer ──');
{
  const e = (id, modulo) => ({ id, modulo, coleccion: 'x', idOriginal: `o-${id}`, datos: {} });
  const delPaso = { elementos: [e('p1', 'sueno')], retencionDias: 30 };
  const actual = { elementos: [e('p1', 'sueno'), e('n-fit', 'fitness'), e('n-eh', 'perfumes'), e('n-sue', 'sueno')], retencionDias: 0 };
  const vuelven = new Set(['sueno']);
  const clave = (x) => (['sueno', 'fitness'].includes(x.modulo) ? x.modulo : 'estiloHombre');
  const r = papeleraAlDeshacer(delPaso, actual, (x) => vuelven.has(clave(x)));
  ok(r.elementos.map((x) => x.id).join() === 'p1,n-fit,n-eh', '🚨 la entrada de algo que NO vuelve a su módulo se QUEDA (Fitness, Imagen personal); la de lo que vuelve, sale');
  ok(r.retencionDias === 0, 'la retención es la de ahora (un ajuste, no un paso)');
  const r2 = papeleraAlDeshacer(delPaso, actual, () => true);
  ok(r2.elementos.map((x) => x.id).join() === 'p1', 'si todo vuelve, la papelera es la del paso');
  ok(papeleraAlDeshacer({}, { elementos: [e('z', 'fitness')] }, () => false).elementos.length === 1, 'sin entradas en el paso, no se pierde ninguna');
}

console.log('\n── Lo que hace App.jsx (leído del código) ──');
const APP = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const trozo = (desde, hasta) => { const i = APP.indexOf(desde); return i < 0 ? '' : APP.slice(i, APP.indexOf(hasta, i) + hasta.length); };
const UNDO = trozo('const undo = async () => {', "saveData(uidUser, 'historial', rest);\n  };");
const SNAP = trozo('const snapshotAndSave = ', 'return resultadoDeGuardados(guardados);');
ok(UNDO.length > 2000 && SNAP.length > 2000, 'se encuentran `undo` y `snapshotAndSave` enteros');
ok(/const fotoDelEstado = \(\) => \(\{[^}]*\bestiloHombre\b[^}]*cumpleanos \}\);/.test(APP), '🚨 F-1 — la foto del paso lleva `estiloHombre`');
ok(!/last\.estiloHombre \|\|/.test(UNDO) && !/DEFAULT_ESTILO_HOMBRE\)/.test(UNDO), '🚨 F-1 — Deshacer ya no escribe Imagen personal de fábrica');
ok(/const ehVuelve = cambioEnPaso\('estiloHombre'\)/.test(UNDO), 'F-1 — solo la reescribe si ESE paso la cambió');
ok(!/\|\| DEFAULT_[A-Z_]+\)/.test(UNDO.slice(UNDO.indexOf('const last = ultimoPaso;'))), 'F-1 — ninguna clave que falte en el paso se rellena con su valor de fábrica');
ok(/deshacerConCambios\(k === 'fitness' \? fitness : temasGuardados, registro\)/.test(UNDO), '🚨 F-2/F-3 — Fitness y las apariencias se deshacen por cambios, sobre lo de ahora');
ok(/papeleraAlDeshacer\(last\.papelera, papelera,/.test(UNDO), '🚨 F-2 — la papelera no suelta la entrada de lo que no vuelve');
ok(UNDO.indexOf("setAvisoApp('deshacer_no_seguro'); return;") < UNDO.indexOf('set(last[k]); saveData'), 'F-2 — si no se puede deshacer con seguridad, se para ANTES de escribir nada');
ok(/cambiosDeUnPaso\(fitness, patch\.fitness\)/.test(SNAP) && /cambiosDeUnPaso\(temasGuardados, patch\.temasGuardados\)/.test(SNAP), 'F-2/F-3 — el paso apunta qué cambió en Fitness y en las apariencias');
ok(/if \(patch\.temasGuardados\) \{ setTemasGuardados\(patch\.temasGuardados\); guardados\.push\(saveData\(uidUser, 'temasGuardados'/.test(SNAP), '🚨 F-3 — `snapshotAndSave` guarda las apariencias (antes no: no se borraban)');
ok(/const eliminarTemaGuardado = \(id\) => eliminarConPapelera\('temasGuardados', null, id\);/.test(APP), '🚨 F-3 — Gestión de temas borra por la papelera (no hay un segundo borrado para siempre)');
const GT = readFileSync(new URL('../src/components/GestionTemas.jsx', import.meta.url), 'utf8');
ok(/Irá a Eliminados recientemente/.test(GT), 'F-3 — y su confirmación lo dice');

console.log(`\n${fallos === 0 ? '✓' : '✗'} ${pasa}/${pasa + fallos} comprobaciones de Deshacer por cambios (F-1, F-2, F-3)`);
if (fallos) process.exit(1);
