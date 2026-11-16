// ═══════════════════════════════════════════════════════════════════════════
// 🛡 HORARIOS · E1-R · R2 — LA OPERACIÓN PROTEGIDA EN EL CLIENTE (`src/lib/operacionesProtegidas.js`) Y SU TURNO EN LA
// COLA (`src/lib/sincronizacion.js`). Node, sin red.
//
//   A · crear: una operación congelada, que un reintento manda IGUAL
//   B · validar: el espejo de `protegido_interno.validar`, motivo a motivo
//   C · aplicar un cambio: cada primitiva, cada condición y su motivo; nada se toca al fallar
//   D · calcular los cambios: por elementos, el orden, `fijar` con su condición, y lo que NO se puede decir
//   E · preparar las condiciones con lo GUARDADO: sin conflictos falsos por normalizar, y sin escribir sobre lo que no
//       se vio (C1, C2)
//   F · el protocolo y la hora del servidor
//   G · la cola: el turno de una operación y una operación aplicada llevada a lo pendiente (que un guardado de antes no
//       la deshaga desde este aparato)
//
// La paridad con el servidor de verdad está en `test-escritor-operaciones-postgrest.mjs` (nivel 3).
// Uso: node --import ./scripts/resolver-vite.mjs scripts/test-operaciones-protegidas.mjs
// ═══════════════════════════════════════════════════════════════════════════
import {
  crearOperacion, validarOperacion, aplicarCambio, aplicarCambios, calcularCambios, prepararCambios, listaPorElementos,
  leerProtocolo, horaDelServidor, igualJson, nuevoOpId, CLAVES_POR_ELEMENTOS, VERSION_PROTOCOLO,
} from '../src/lib/operacionesProtegidas.js';
import {
  empezarSesionDeDatos, antesDeGuardar, alSalir, despuesDeGuardar, pendientesParaReintentar, reservarClavesParaOperacion,
  llevarOperacionAPendientes, resumenSincronizacion,
} from '../src/lib/sincronizacion.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const seccion = (t) => console.log(`\n── ${t} ──`);
const copia = (v) => JSON.parse(JSON.stringify(v));
const OP = '0b5f9a6e-6a36-4c4f-9a39-3f1d7a1b2c3d';
const base = () => ({
  formato: 1, opId: OP, tipo: 'editar_horario', manual: true, aparato: 'a1', versionApp: '3.163.0', creadaEn: '2026-11-16T10:00:00.000Z',
  horario: { base: 'r1', baseExiste: true, valor: { version: 1, testigo: { formato: 1, revision: 'r2', base: 'r1' } } },
});

seccion('A · Crear: una operación congelada');
{
  const op = crearOperacion({ opId: OP, tipo: 'borrar_asignatura', manual: true, aparato: 'a1', versionApp: '3.163.0', creadaEn: '2026-11-16T10:00:00.000Z',
    horario: { base: 'r1', baseExiste: true, valor: { bloques: [], testigo: { formato: 1, revision: 'r2', base: 'r1' } } },
    claves: [{ clave: 'estudios', cambios: [{ camino: ['asignaturas'], quitar: [{ id: 'x', igual: { id: 'x' } }] }] }, { clave: 'papelera', cambios: [] }] });
  ok(Object.isFrozen(op) && Object.isFrozen(op.horario.valor.testigo) && Object.isFrozen(op.claves[0].cambios[0].quitar[0]), 'congelada en todos los niveles: un reintento no puede mandar otra cosa');
  ok(op.claves.length === 1 && op.claves[0].clave === 'estudios', 'una clave sin cambios no viaja');
  ok(validarOperacion(op) === null, 'la construida es válida');
  let lanzo = false; try { 'use strict'; op.tipo = 'otro'; } catch { lanzo = true; }
  ok(op.tipo === 'borrar_asignatura', `no se puede cambiar después de crearla${lanzo ? ' (lanza en modo estricto)' : ''}`);
  const id = nuevoOpId();
  ok(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id) && id !== nuevoOpId(), 'nuevoOpId: un uuid v4 distinto cada vez');
  ok(nuevoOpId({}) === null, 'sin aleatoriedad segura no hay opId (nunca Math.random)');
  ok(CLAVES_POR_ELEMENTOS.join() === 'estudios,papelera', 'la lista cerrada de claves es la de R1 (estudios, papelera)');
}

seccion('B · Validar: el espejo de protegido_interno.validar');
{
  const casos = [
    ['forma', () => null], ['forma', () => []], ['formato', (o) => ({ ...o, formato: 2 })], ['opId', (o) => ({ ...o, opId: 'no-es-uuid' })],
    ['tipo', (o) => ({ ...o, tipo: '' })], ['manual', (o) => ({ ...o, manual: 'si' })], ['creadaEn', (o) => ({ ...o, creadaEn: 'ayer' })],
    ['horario', (o) => ({ ...o, horario: { ...o.horario, valor: { sinTestigo: true } } })],
    ['horario_revision', (o) => ({ ...o, horario: { ...o.horario, valor: { testigo: { revision: '' } } } })],
    ['horario_base', (o) => ({ ...o, horario: { ...o.horario, base: 7 } })],
    ['horario_baseExiste', (o) => ({ ...o, horario: { ...o.horario, baseExiste: 'si' } })],
    ['horario_revision_repetida', (o) => ({ ...o, horario: { ...o.horario, base: 'r2' } })],
    ['claves', (o) => ({ ...o, claves: {} })], ['clave', (o) => ({ ...o, claves: [{ clave: 3 }] })],
    ['clave_no_permitida', (o) => ({ ...o, claves: [{ clave: 'horarioTop', cambios: [{ fijar: [] }] }] })],
    ['clave_repetida', (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [{ fijar: [{ campo: 'a', valor: 1 }] }] }, { clave: 'estudios', cambios: [{ fijar: [{ campo: 'a', valor: 1 }] }] }] })],
    ['inicial', (o) => ({ ...o, claves: [{ clave: 'estudios', inicial: [], cambios: [{ fijar: [] }] }] })],
    ['cambios', (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [] }] })],
    ['cambio', (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [3] }] })],
    ['camino', (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [{ camino: [{ sinId: 1 }], fijar: [] }] }] })],
    ['cambio_mezclado', (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [{ camino: ['a'], quitar: [], fijar: [] }] }] })],
    ['cambio_vacio', (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [{ camino: ['a'] }] }] })],
    ['camino_lista', (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [{ quitar: [] }] }] })],
    ['quitar', (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [{ camino: ['a'], quitar: [{ id: 'x' }] }] }] })],
    ['reemplazar', (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [{ camino: ['a'], reemplazar: [{ id: 'x', igual: {}, nuevo: { id: 'y' } }] }] }] })],
    ['anadir', (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [{ camino: ['a'], anadir: [{ elemento: { nombre: 'sin id' } }] }] }] })],
    ['anadir_posicion', (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [{ camino: ['a'], anadir: [{ elemento: { id: 'x' }, posicion: '0' }] }] }] })],
    ['orden', (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [{ camino: ['a'], orden: [1, 2] }] }] })],
    ['fijar', (o) => ({ ...o, claves: [{ clave: 'estudios', cambios: [{ fijar: [{ campo: 'a' }] }] }] })],
    ['vacia', (o) => { const { horario, ...r } = o; void horario; return r; }],
  ];
  for (const [motivo, f] of casos) ok(validarOperacion(f(base())) === motivo, `«${motivo}»`);
  ok(validarOperacion(base()) === null, 'una de solo el horario es válida');
  const soloClaves = { ...base(), claves: [{ clave: 'papelera', cambios: [{ camino: ['elementos'], anadir: [{ elemento: { id: 'p1' } }] }] }] };
  delete soloClaves.horario;
  ok(validarOperacion(soloClaves) === null, 'una de solo claves también (el servidor la acepta; el escritor exige el horario)');
  ok(validarOperacion({ ...base(), horario: { ...base().horario, base: null, baseExiste: false } }) === null, 'base null con baseExiste false (la primera fila)');
}

seccion('C · Aplicar un cambio: cada primitiva, cada condición');
{
  const est = { asignaturas: [{ id: 'a', n: 1, x: { p: 1, q: 2 } }, { id: 'b', n: 2 }, { id: 'c', n: 3 }], retencion: 30 };
  const antes = copia(est);
  const q = aplicarCambio(est, { camino: ['asignaturas'], quitar: [{ id: 'a', igual: { x: { q: 2, p: 1 }, n: 1, id: 'a' } }] }, 'estudios');
  ok(!q.fallo && q.nuevo.asignaturas.map((e) => e.id).join() === 'b,c', 'quitar si sigue igual (el orden de las claves no cuenta, como en jsonb)');
  ok(igualJson(est, antes), '…y el valor de antes no se toca');
  const qd = aplicarCambio(est, { camino: ['asignaturas'], quitar: [{ id: 'a', igual: { id: 'a', n: 9 } }] }, 'estudios');
  ok(qd.fallo && qd.fallo.motivo === 'elemento_distinto' && qd.fallo.id === 'a' && qd.fallo.clave === 'estudios' && qd.nuevo === est, 'quitar uno que ya no es igual: elemento_distinto, sin tocar nada');
  const qa = aplicarCambio(est, { camino: ['asignaturas'], quitar: [{ id: 'z', igual: {} }] }, 'estudios');
  ok(qa.fallo && qa.fallo.motivo === 'elemento_ausente', 'quitar uno que no existe: elemento_ausente');
  const r = aplicarCambio(est, { camino: ['asignaturas'], reemplazar: [{ id: 'b', igual: { id: 'b', n: 2 }, nuevo: { id: 'b', n: 20 } }] }, 'estudios');
  ok(!r.fallo && r.nuevo.asignaturas[1].n === 20 && r.nuevo.asignaturas.length === 3, 'reemplazar en su sitio');
  const rd = aplicarCambio(est, { camino: ['asignaturas'], reemplazar: [{ id: 'b', igual: { id: 'b', n: 3 }, nuevo: { id: 'b' } }] }, 'estudios');
  ok(rd.fallo && rd.fallo.motivo === 'elemento_distinto', 'reemplazar uno distinto: elemento_distinto');
  const a = aplicarCambio(est, { camino: ['asignaturas'], anadir: [{ elemento: { id: 'd' } }, { elemento: { id: 'e' }, posicion: 0 }, { elemento: { id: 'f' }, posicion: 2.7 }] }, 'estudios');
  ok(!a.fallo && a.nuevo.asignaturas.map((e) => e.id).join() === 'e,a,f,b,c,d', 'añadir: al final, en la posición 0 y en la 2 (2.7 se redondea hacia abajo)');
  const ae = aplicarCambio(est, { camino: ['asignaturas'], anadir: [{ elemento: { id: 'b' } }] }, 'estudios');
  ok(ae.fallo && ae.fallo.motivo === 'elemento_existe', 'añadir uno que ya existe: elemento_existe');
  const o = aplicarCambio(est, { camino: ['asignaturas'], orden: ['c', 'a'] }, 'estudios');
  ok(!o.fallo && o.nuevo.asignaturas.map((e) => e.id).join() === 'c,a,b', 'ordenar: los nombrados en su orden y los demás detrás, como estaban');
  const fj = aplicarCambio(est, { camino: [], fijar: [{ campo: 'retencion', igual: 30, valor: 7 }, { campo: 'nuevo', valor: true }] }, 'papelera');
  ok(!fj.fallo && fj.nuevo.retencion === 7 && fj.nuevo.nuevo === true, 'fijar campos de la raíz, con y sin condición');
  const fd = aplicarCambio(est, { camino: [], fijar: [{ campo: 'retencion', igual: 15, valor: 7 }] }, 'papelera');
  ok(fd.fallo && fd.fallo.motivo === 'campo_distinto' && fd.fallo.campo === 'retencion', 'fijar con una condición que no se cumple: campo_distinto');
  const fn = aplicarCambio(est, { camino: [], fijar: [{ campo: 'falta', igual: null, valor: 1 }] }, 'papelera');
  ok(!fn.fallo && fn.nuevo.falta === 1, 'fijar un campo que no está, con la condición «null» (como coalesce en el servidor)');
  const prof = aplicarCambio(est, { camino: ['asignaturas', { id: 'a' }, 'x'], fijar: [{ campo: 'p', igual: 1, valor: 5 }] }, 'estudios');
  ok(!prof.fallo && prof.nuevo.asignaturas[0].x.p === 5 && prof.nuevo.asignaturas[0].x.q === 2, 'un camino con un tramo {id} dentro de una lista');
  ok(aplicarCambio(est, { camino: ['asignaturas', { id: 'z' }], fijar: [] }, 'estudios').fallo.motivo === 'camino_ausente', 'un camino a un elemento que no existe: camino_ausente');
  ok(aplicarCambio(est, { camino: ['retencion'], quitar: [] }, 'estudios').fallo.motivo === 'camino_no_es_lista', 'una lista que no es lista: camino_no_es_lista');
  ok(aplicarCambio(est, { camino: ['asignaturas'], fijar: [] }, 'estudios').fallo.motivo === 'camino_no_es_objeto', 'fijar sobre una lista: camino_no_es_objeto');
  const nuevaLista = aplicarCambio({}, { camino: ['horas'], anadir: [{ elemento: { id: 'h1' } }] }, 'estudios');
  ok(!nuevaLista.fallo && nuevaLista.nuevo.horas.length === 1, 'una lista que todavía no existe se crea vacía (como en el servidor)');
  const varios = aplicarCambios(est, [{ camino: ['asignaturas'], quitar: [{ id: 'a', igual: est.asignaturas[0] }] }, { camino: ['asignaturas'], quitar: [{ id: 'a', igual: est.asignaturas[0] }] }], 'estudios');
  ok(varios.fallo && varios.fallo.motivo === 'elemento_ausente' && varios.nuevo === est, 'varios cambios: al primer fallo se devuelve el valor de antes entero (todo o nada)');
  const sc = aplicarCambio(est, { camino: ['asignaturas'], quitar: [{ id: 'z', igual: {} }, { id: 'a', igual: { distinto: 1 } }], anadir: [{ elemento: { id: 'b', otro: 1 } }] }, 'estudios', { sinCondiciones: true });
  ok(!sc.fallo && sc.nuevo.asignaturas.map((e) => e.id).join() === 'b,c' && sc.nuevo.asignaturas[0].n === 2, 'sin condiciones (para la cola): quita lo que esté, no duplica lo que ya está');
}

seccion('D · Calcular los cambios');
{
  const antes = { programas: [{ id: 'p' }], asignaturas: [{ id: 'a', n: 1 }, { id: 'b', n: 2 }, { id: 'c', n: 3 }], examenes: [{ id: 'e1', asignaturaId: 'a' }], extra: { x: 1 }, nota: 'hola' };
  ok(calcularCambios(antes, copia(antes)).cambios.length === 0, 'sin cambios: ninguna');
  const despues = { ...copia(antes), asignaturas: [{ id: 'c', n: 3 }, { id: 'b', n: 22 }, { id: 'd', n: 4 }], examenes: [], nota: 'adiós' };
  const c = calcularCambios(antes, despues);
  ok(c.ok, 'se puede decir por elementos');
  const asig = c.cambios.find((x) => x.camino && x.camino[0] === 'asignaturas');
  ok(asig.quitar.length === 1 && asig.quitar[0].id === 'a' && igualJson(asig.quitar[0].igual, antes.asignaturas[0]), 'quitar «a», con su condición');
  ok(asig.reemplazar.length === 1 && asig.reemplazar[0].nuevo.n === 22, 'reemplazar «b»');
  ok(asig.anadir.length === 1 && asig.anadir[0].elemento.id === 'd', 'añadir «d»');
  ok(Array.isArray(asig.orden) && asig.orden.join() === 'c,b,d', 'y el orden, porque cambió');
  const fij = c.cambios.find((x) => x.fijar);
  ok(fij && fij.fijar.length === 1 && fij.fijar[0].campo === 'nota' && fij.fijar[0].igual === 'hola', 'un campo que no es lista: fijar, con la condición de lo que había');
  ok(igualJson(aplicarCambios(antes, c.cambios, 'estudios').nuevo, despues), 'aplicar los cambios a «antes» da exactamente «después»');
  const soloAnadir = calcularCambios(antes, { ...copia(antes), asignaturas: [...antes.asignaturas, { id: 'z' }] }).cambios[0];
  ok(!soloAnadir.orden && !soloAnadir.anadir[0].posicion, 'añadir al final no manda orden');
  const sinIds = calcularCambios({ lista: [1, 2] }, { lista: [2, 1] });
  ok(sinIds.ok && sinIds.cambios[0].fijar[0].campo === 'lista' && igualJson(sinIds.cambios[0].fijar[0].igual, [1, 2]), 'una lista sin ids: fijar la lista entera, con su condición (nunca a ciegas)');
  const repes = calcularCambios({ l: [{ id: 'x' }, { id: 'x' }] }, { l: [{ id: 'x' }] });
  ok(repes.ok && repes.cambios[0].fijar, 'ids repetidos: tampoco por elementos');
  ok(!listaPorElementos([{ id: 1 }]) && listaPorElementos([]), 'listaPorElementos: ids de texto, sin repetir');
  const quitado = calcularCambios({ a: 1, b: 2 }, { a: 1 });
  ok(!quitado.ok && quitado.motivo === 'campo_quitado' && quitado.campo === 'b', 'un campo que desaparece no se puede decir sin reescribir la clave: se niega');
  ok(!calcularCambios({}, null).ok, 'un «después» que no es objeto: se niega');
  /* Propiedad: con 300 parejas al azar, aplicar los cambios a «antes» da «después». */
  let bien = 0;
  const azar = (k) => Math.floor(Math.random() * k);
  for (let i = 0; i < 300; i += 1) {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
    const lista = () => ids.filter(() => Math.random() < 0.6).map((id) => ({ id, v: azar(3) })).sort(() => Math.random() - 0.5);
    const a = { asignaturas: lista(), horas: lista(), n: azar(2) };
    const d = { asignaturas: lista(), horas: lista(), n: azar(2) };
    const cc = calcularCambios(a, d);
    if (cc.ok && igualJson(aplicarCambios(a, cc.cambios, 'estudios').nuevo, d)) bien += 1;
  }
  ok(bien === 300, `300 parejas al azar: aplicar(calcular(antes, después)) = después (${bien}/300)`);
}

seccion('E · Preparar las condiciones con lo GUARDADO');
{
  /* Lo guardado tiene una forma vieja (sin `orden` ni `oculto`); la pantalla lo enseña normalizado. */
  const crudo = { asignaturas: [{ id: 'a', nombre: 'Bio' }, { id: 'b', nombre: 'Mates' }], horas: [{ id: 'h1', asignaturaId: 'a' }] };
  const normalizar = (v) => ({ asignaturas: (v.asignaturas || []).map((x) => ({ oculto: false, ...x })), horas: v.horas || [], examenes: v.examenes || [] });
  const antes = normalizar(copia(crudo));
  const despues = { ...copia(antes), asignaturas: antes.asignaturas.filter((x) => x.id !== 'a'), horas: [] };
  const sinNormalizar = calcularCambios(antes, despues);
  ok(aplicarCambios(crudo, sinNormalizar.cambios, 'estudios').fallo?.motivo === 'elemento_distinto', 'con las condiciones de la PANTALLA, lo guardado no cuadra: sería un conflicto falso');
  const p = prepararCambios({ antes, despues, guardado: { existe: true, valor: crudo }, normalizar });
  ok(p.ok && !p.inicial, 'preparado');
  const aplicado = aplicarCambios(crudo, p.cambios, 'estudios');
  ok(!aplicado.fallo && aplicado.nuevo.asignaturas.length === 1 && aplicado.nuevo.horas.length === 0, 'con las de lo GUARDADO, sí cuadra: sin conflicto falso');
  ok(igualJson(p.cambios.find((x) => x.camino[0] === 'asignaturas').quitar[0].igual, crudo.asignaturas[0]), '…porque la condición es el elemento guardado tal cual');
  ok(aplicado.nuevo.asignaturas[0].nombre === 'Mates' && !('oculto' in aplicado.nuevo.asignaturas[0]), 'y lo que no toca la operación se queda como estaba guardado (no se reescribe normalizado)');
  /* C2 — otro aparato cambió «a» después de que él la viera: la condición es lo que ÉL vio, y no se aplica. */
  const cambiadoFuera = { ...copia(crudo), asignaturas: [{ id: 'a', nombre: 'Biología (otro aparato)' }, crudo.asignaturas[1]] };
  const p2 = prepararCambios({ antes, despues, guardado: { existe: true, valor: cambiadoFuera }, normalizar });
  const r2 = aplicarCambios(cambiadoFuera, p2.cambios, 'estudios');
  ok(r2.fallo && r2.fallo.motivo === 'elemento_distinto' && r2.fallo.id === 'a', 'C2: si otro aparato cambió lo que él quita, no se escribe nada (elemento_distinto)');
  ok(igualJson(p2.cambios.find((x) => x.camino[0] === 'asignaturas').quitar[0].igual, antes.asignaturas[0]), '…porque la condición es lo que él vio, no lo guardado');
  /* C1 — otro aparato cambió OTRA asignatura: la operación se aplica sobre lo de ahora y conserva lo suyo. */
  const otraCambiada = { ...copia(crudo), asignaturas: [crudo.asignaturas[0], { id: 'b', nombre: 'Matemáticas (otro aparato)' }, { id: 'c', nombre: 'Nueva (otro aparato)' }] };
  const p3 = prepararCambios({ antes, despues, guardado: { existe: true, valor: otraCambiada }, normalizar });
  const r3 = aplicarCambios(otraCambiada, p3.cambios, 'estudios');
  ok(!r3.fallo && r3.nuevo.asignaturas.map((x) => x.nombre).join('|') === 'Matemáticas (otro aparato)|Nueva (otro aparato)', 'C1: lo de otro aparato en OTRA asignatura se conserva (no se reescribe la clave entera)');
  /* Lo que él añade y ya existe (otro aparato lo añadió con el mismo id): no se pisa. */
  const conD = { ...copia(antes), asignaturas: [...antes.asignaturas, { id: 'd', nombre: 'Mía' }] };
  const p4 = prepararCambios({ antes, despues: conD, guardado: { existe: true, valor: { ...copia(crudo), asignaturas: [...crudo.asignaturas, { id: 'd', nombre: 'Suya' }] } }, normalizar });
  ok(aplicarCambios({ ...copia(crudo), asignaturas: [...crudo.asignaturas, { id: 'd', nombre: 'Suya' }] }, p4.cambios, 'estudios').fallo?.motivo === 'elemento_existe', 'añadir algo que otro aparato ya añadió: elemento_existe');
  const p5 = prepararCambios({ antes: {}, despues: { horas: [{ id: 'h' }] }, guardado: { existe: false, valor: null } });
  ok(p5.ok && p5.inicial && Object.keys(p5.inicial).length === 0, 'sin fila guardada: la operación lleva un valor inicial vacío');
  const papeleraCruda = { elementos: [], retencionDias: 30 };
  const p6 = prepararCambios({ antes: { elementos: [], retencionDias: 30 }, despues: { elementos: [], retencionDias: 7 }, guardado: { existe: true, valor: papeleraCruda } });
  ok(p6.cambios[0].fijar[0].igual === 30 && !aplicarCambios(papeleraCruda, p6.cambios, 'papelera').fallo, 'fijar un campo: la condición sale de lo guardado');
  const p7 = prepararCambios({ antes: { a: 1, b: 2 }, despues: { a: 1 } });
  ok(!p7.ok && p7.motivo === 'campo_quitado', 'lo que no se puede decir por elementos se niega (el escritor no escribe nada)');
  const roto = prepararCambios({ antes, despues, guardado: { existe: true, valor: crudo }, normalizar: () => { throw new Error('x'); } });
  ok(roto.ok && igualJson(roto.cambios.find((x) => x.camino[0] === 'asignaturas').quitar[0].igual, antes.asignaturas[0]), 'un normalizador que falla: la condición es lo que él vio (el servidor decide)');
}

seccion('F · El protocolo y la hora del servidor');
{
  const t0 = Date.parse('2026-11-16T10:00:00.000Z');
  const pr = leerProtocolo({ version: VERSION_PROTOCOLO, versionMinima: null, ahora: '2026-11-16T10:00:05.000Z', reglas: { horarioTop: false } }, { versionApp: '3.163.0', enviadoEn: t0, recibidoEn: t0 + 200 });
  ok(pr.ok && pr.desfaseMs === 4900 && pr.reglas.horarioTop === false, 'versión 1: se puede escribir; el desfase se mide a mitad del viaje (5 s − 0,1 s)');
  ok(horaDelServidor(pr.desfaseMs, t0) === '2026-11-16T10:00:04.900Z', 'creadaEn con la hora del servidor, no con el reloj del aparato');
  ok(leerProtocolo({ version: 2 }).motivo === 'protocolo_distinto', 'otra versión del protocolo: no se escribe');
  ok(leerProtocolo({ version: 1, versionMinima: '3.164.0' }, { versionApp: '3.163.0' }).motivo === 'version_antigua', 'una aplicación más vieja que la mínima: «recarga»');
  ok(leerProtocolo({ version: 1, versionMinima: '3.163.0' }, { versionApp: '3.163.0' }).ok, 'la misma que la mínima: sí');
  ok(leerProtocolo({ version: 1, versionMinima: '3.0.0' }, { versionApp: null }).motivo === 'version_antigua', 'sin saber su versión, con una mínima: no (no se adivina)');
  ok(leerProtocolo(null).motivo === 'protocolo_ilegible' && leerProtocolo({ version: '1' }).motivo === 'protocolo_ilegible', 'una respuesta que no se entiende: ilegible');
  ok(leerProtocolo({ version: 1, ahora: 'x' }).desfaseMs === 0, 'sin hora legible, desfase 0');
}

seccion('G · La cola: el turno de una operación y lo pendiente');
{
  empezarSesionDeDatos('u1');
  const est0 = { asignaturas: [{ id: 'a' }, { id: 'b' }] };
  /* Un guardado de `estudios` en vuelo: la operación espera a que termine. */
  const t1 = antesDeGuardar('estudios', { usuario: 'u1', valor: est0 });
  const reserva = reservarClavesParaOperacion(['estudios', 'papelera']);
  let lista = false; reserva.listo.then(() => { lista = true; });
  await new Promise((r) => setTimeout(r, 20));
  ok(!lista, 'la operación espera al guardado de estudios que ya estaba en la cola');
  despuesDeGuardar('estudios', t1, { ok: true, valor: est0 });
  await new Promise((r) => setTimeout(r, 0));
  ok(lista, '…y sale cuando termina');
  /* Mientras la operación tiene el turno, un guardado nuevo de estudios espera detrás. */
  const t2 = antesDeGuardar('estudios', { usuario: 'u1', valor: est0 });
  ok(t2.anterior !== null, 'un guardado pedido mientras la operación tiene el turno espera detrás de ella');
  let salio = false; Promise.resolve(t2.anterior).then(() => { salio = true; });
  await new Promise((r) => setTimeout(r, 20));
  ok(!salio, '…y no sale hasta que la operación suelta el turno');
  /* La operación se aplica (quita «a»): el guardado que esperaba sale CON ella encima. */
  const cambios = [{ camino: ['asignaturas'], quitar: [{ id: 'a', igual: { id: 'a' } }] }];
  llevarOperacionAPendientes('estudios', cambios);
  reserva.soltar(); reserva.soltar();
  await new Promise((r) => setTimeout(r, 0));
  ok(salio, 'soltar el turno (dos veces no rompe nada) deja salir al siguiente');
  const sale = alSalir('estudios', t2, est0);
  ok(sale.sale && sale.valor.asignaturas.map((x) => x.id).join() === 'b', 'el guardado pedido ANTES de aplicarse la operación sale sin «a» (no la devuelve a la cuenta)');
  despuesDeGuardar('estudios', t2, { ok: false, error: { message: 'Failed to fetch' }, valor: sale.valor });
  ok(pendientesParaReintentar().find((p) => p.clave === 'estudios').valor.asignaturas.length === 1, 'lo pendiente (que se reintentará) tampoco la trae de vuelta');
  /* Lo pendiente de ANTES de la operación (un guardado que no llegó) se lleva también. */
  empezarSesionDeDatos('u1');
  const t3 = antesDeGuardar('papelera', { usuario: 'u1', valor: { elementos: [{ id: 'x' }] } });
  despuesDeGuardar('papelera', t3, { ok: false, error: { message: 'Failed to fetch' }, valor: { elementos: [{ id: 'x' }] } });
  llevarOperacionAPendientes('papelera', [{ camino: ['elementos'], anadir: [{ elemento: { id: 'y' } }] }]);
  const pend = pendientesParaReintentar().find((p) => p.clave === 'papelera').valor;
  ok(pend.elementos.map((x) => x.id).join() === 'x,y', 'una entrada de la papelera que la operación añadió no la borra un reintento de antes');
  /* Un guardado pedido DESPUÉS de la operación no se toca (ya la incluye la pantalla). */
  const despues = { elementos: [{ id: 'x' }, { id: 'y', editado: true }] };
  const t4 = antesDeGuardar('papelera', { usuario: 'u1', valor: despues });
  llevarOperacionAPendientes('estudios', [{ camino: ['asignaturas'], quitar: [{ id: 'q', igual: {} }] }]);
  const s4 = alSalir('papelera', t4, despues);
  ok(s4.sale && s4.valor === despues, 'un guardado pedido después de la operación sale tal cual (su clave no tenía operaciones de antes)');
  despuesDeGuardar('papelera', t4, { ok: true, valor: despues });
  ok(!resumenSincronizacion().pendientes.includes('papelera'), 'y al llegar, nada pendiente de esa clave');
  /* La frontera, en la MISMA clave: uno pedido antes lleva la operación encima; uno pedido después, no. */
  empezarSesionDeDatos('u1');
  const viejo = { asignaturas: [{ id: 'a', n: 1 }, { id: 'b' }] };
  const tA = antesDeGuardar('estudios', { usuario: 'u1', valor: viejo });
  llevarOperacionAPendientes('estudios', [{ camino: ['asignaturas'], reemplazar: [{ id: 'a', igual: { id: 'a', n: 1 }, nuevo: { id: 'a', n: 2 } }] }]);
  const nuevo = { asignaturas: [{ id: 'a', n: 3 }, { id: 'b' }] };
  const tB = antesDeGuardar('estudios', { usuario: 'u1', valor: nuevo });
  const sA = alSalir('estudios', tA, viejo);
  despuesDeGuardar('estudios', tA, { ok: true, valor: sA.valor });
  const sB = alSalir('estudios', tB, nuevo);
  ok(sA.valor.asignaturas[0].n === 2, 'misma clave: el pedido antes sale con la operación encima (n = 2)');
  ok(sB.valor === nuevo && sB.valor.asignaturas[0].n === 3, 'misma clave: el pedido después sale tal cual (n = 3): la operación no le pisa un cambio posterior');
  despuesDeGuardar('estudios', tB, { ok: true, valor: sB.valor });
  ok(resumenSincronizacion().pendientes.length === 0, 'y al llegar los dos, nada pendiente');
}

console.log(`\n${fallos ? '✗' : '✓'} ${n - fallos}/${n} comprobaciones de la operación protegida en el cliente`);
process.exit(fallos ? 1 : 0);
