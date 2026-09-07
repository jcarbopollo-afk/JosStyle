// ══════════════════════════════════════════════════════════════════════════
// E3 · FASE 27 (PR F5) — PRODUCTIVIDAD: METAS + OBJETIVOS
// ══════════════════════════════════════════════════════════════════════════
//
// Los veinte puntos del «CRITERIO DE ÉXITO», y sobre todo las dos decisiones que
// sostienen la fase: **no se crea ni una lista nueva** —se amplían las dos que
// ya existían— y **`cumplido` y `estado` son dos ejes**, no dos nombres de lo
// mismo.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  ESTADOS_OBJETIVO, ESTADO_COMPLETADO, TODOS_LOS_ESTADOS_OBJETIVO, estadoObjetivo, estadoDeObjetivo,
  CATEGORIAS_OBJETIVO, categoriaObjetivo, OBJETIVOS_PRINCIPALES_MAX,
  crearObjetivo, normalizarObjetivo, normalizarObjetivos, normalizarObjetivosDe,
  editarObjetivo, completarObjetivo, cambiarEstadoObjetivo, marcarPrincipal, objetivoPrincipal,
  fechaLimiteDeObjetivo, textoDePlazo,
  TIPOS_META, TIPO_META_POR_DEFECTO, tipoMeta,
  crearMeta, normalizarMeta, normalizarMetas, normalizarMetasDe,
  editarMeta, completarMeta, actualizarProgreso, sumarProgreso, vincularMeta,
  progresoDeMeta, metaCompletada, textoDeFechaMeta,
  metasDeObjetivo, metasSueltas, progresoDeObjetivo, PESOS_DE_META,
  tareasDeMeta, tareasDeObjetivo,
  FILTROS_OBJETIVO, filtrarObjetivos, ordenarObjetivos,
  FILTROS_META, filtrarMetas,
  VACIO_OBJETIVOS, VACIO_METAS, paraHoy, resumenParaProductividad,
  AISLAMIENTO_METAS_OBJETIVOS, condicionPR5,
  PRIORIDADES, PLAZOS_OBJETIVO, PERIODOS_META,
} from '../src/lib/metasObjetivos.js';
import { RELACIONES_FUTURAS, crearTarea } from '../src/lib/tareas.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(raiz, p), 'utf8');

/* 🐛 Una prueba que busca si el CÓDIGO hace algo quita los comentarios y las
   cadenas (la lección que la E3 F26 volvió a aprender dos veces en un turno). */
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
const AYER = '2026-09-06';
const LEJOS = '2026-12-01';

const obj = (extra = {}) => ({ ...crearObjetivo({ texto: 'Mejorar mi físico', plazo: '1 año', hoy: HOY }), ...extra });

console.log('\n── 1. 🚨 NI UNA LISTA NUEVA: se amplían las que ya existían ─────');
const LIB = leer('src/lib/metasObjetivos.js');
const CODIGO = soloCodigo(LIB);
ok(!/DEFAULT_[A-Z_]*OBJETIVOS\s*=|DEFAULT_[A-Z_]*METAS\s*=/.test(CODIGO),
  '🚨 no se declara un almacén nuevo: los objetivos son la clave `objetivos` (Fase 9) y las metas `productividad.metas` (Fase 6)');
eq(AISLAMIENTO_METAS_OBJETIVOS.claves, ['objetivos', 'productividad'], 'y son exactamente esas dos claves');
eq(AISLAMIENTO_METAS_OBJETIVOS.sqlNuevo, false, 'sin SQL nuevo');
/* 🚨 Los cinco campos de siempre de un objetivo y los cuatro de una meta se
   conservan: los leen la papelera, la exportación, `predicciones.js`,
   `logros.js`, el Dashboard, el Calendario y el `objetivoId` de EH F28. */
const viejo = normalizarObjetivo({ id: 'v', texto: 'Aprender inglés', plazo: '1 año', cumplido: false, fechaCreacion: '2026-01-01' });
ok(['id', 'texto', 'plazo', 'cumplido', 'fechaCreacion'].every((k) => k in viejo),
  '🚨 UN OBJETIVO GUARDADO ANTES CONSERVA SUS CINCO CAMPOS: ni uno se renombra');
eq(viejo.plazo, '1 año', 'y su plazo');
const metaVieja = normalizarMeta({ id: 'v', nombre: 'Leer 12 libros', periodo: 'Mensual', objetivo: 12, progreso: 3 });
ok(['id', 'nombre', 'periodo', 'objetivo', 'progreso'].every((k) => k in metaVieja),
  '🚨 Y UNA META GUARDADA ANTES CONSERVA LOS SUYOS');
eq([metaVieja.objetivo, metaVieja.progreso, metaVieja.periodo], [12, 3, 'Mensual'], 'con sus valores intactos');
eq(metaVieja.tipo, 'frecuencia',
  '⚠️ y una meta vieja CON periodo se lee como de frecuencia: es lo que significaba');
eq(normalizarMeta({ nombre: 'x', objetivo: 5, progreso: 1 }).tipo, 'numerico', 'y una sin periodo, numérica');
eq(normalizarMetasDe({ metas: [metaVieja], habitos: [{ id: 'h' }], tareas: [{ id: 't', texto: 'T' }] }).habitos.length, 1,
  '🚨 y `normalizarMetasDe` devuelve el objeto ENTERO: `saveData` sobrescribe (regla 5)');
eq(normalizarObjetivosDe({ lista: [viejo], ultimaRevision: '2026-08-01' }).ultimaRevision, '2026-08-01',
  '🚨 y `normalizarObjetivosDe` conserva `ultimaRevision`: es el aviso de revisión de la Fase 9');

console.log('\n── 2. 🚨 `cumplido` y `estado` son DOS EJES ─────────────────────');
eq(ESTADOS_OBJETIVO.map((e) => e.id), ['activo', 'pausa', 'archivado'], 'se GUARDAN tres estados');
eq(ESTADO_COMPLETADO.id, 'completado', 'y el cuarto, «Completado», se DERIVA de `cumplido`');
eq(TODOS_LOS_ESTADOS_OBJETIVO.length, 4, 'los cuatro que pide el enunciado');
eq(estadoDeObjetivo(obj()), 'activo', 'un objetivo nuevo está activo');
eq(estadoDeObjetivo(obj({ cumplido: true })), 'completado', 'uno cumplido está completado');
eq(estadoDeObjetivo(obj({ estado: 'pausa' })), 'pausa', 'y uno en pausa, en pausa');
eq(estadoDeObjetivo(obj({ estado: 'inventado' })), 'activo', 'un estado que no existe cae en activo');
eq(estadoDeObjetivo(null), null, 'y sin objetivo no hay estado');
/* 🚨 La razón de que sean dos campos. */
const cumplidoYArchivado = cambiarEstadoObjetivo(completarObjetivo(obj(), { hoy: HOY }), 'archivado');
eq([cumplidoYArchivado.cumplido, cumplidoYArchivado.estado], [true, 'archivado'],
  '🚨 ARCHIVAR UN OBJETIVO CUMPLIDO NO LE BORRA QUE LO CUMPLIÓ: con un solo campo, sí (E3 F19)');
eq(estadoDeObjetivo(cumplidoYArchivado), 'completado', 'y cumplido gana al pintarlo');
ok(!/cumplido:\s*estado ===|estado:\s*.?completado/.test(CODIGO),
  '⚠️ y no hay ni una línea que sincronice los dos campos: eso sería el duplicado por la puerta de atrás');

console.log('\n── 3. Crear objetivos ───────────────────────────────────────────');
eq(crearObjetivo({ texto: '  ', plazo: '1 año', hoy: HOY }), null, 'sin nombre no hay objetivo');
eq(crearObjetivo({ texto: 'x', hoy: HOY }), null,
  '🚨 Y SIN PLAZO TAMPOCO: elegirlo por él metería su viaje a Japón en «30 días» sin decírselo (EH F28)');
eq(crearObjetivo({ texto: 'x', plazo: 'mañana', hoy: HOY }), null, 'ni con un plazo que no existe');
eq(obj().fechaCreacion, HOY, 'se apunta cuándo nació');
eq(obj().estado, 'activo', 'nace activo');
eq(obj().principal, false, 'y sin ser el principal: eso lo marca él');
eq(crearObjetivo({ texto: 'x', plazo: '1 año', categoria: 'inventada', hoy: HOY }).categoria, null, 'una categoría que no existe se descarta');
eq(crearObjetivo({ texto: 'x', plazo: '1 año', fechaObjetivo: '2026-13-45', hoy: HOY }).fechaObjetivo, null,
  "🐛 y `'2026-13-45'` encaja con la FORMA de una fecha y no es un día");
eq(CATEGORIAS_OBJETIVO.map((c) => c.id), ['personal', 'fitness', 'estudios', 'trabajo', 'economia', 'relaciones', 'otros'],
  'las siete del enunciado');
ok(CATEGORIAS_OBJETIVO.every((c) => 'modulo' in c),
  '⚠️ y cada una declara su módulo de JosStyle, o `null` en vez de inventárselo');
eq(categoriaObjetivo('fitness').modulo, 'calistenia', 'Fitness ES el módulo de calistenia');
eq(normalizarObjetivo({ texto: 'x', cumplido: false, cumplidoEn: '2026-01-01' }).cumplidoEn, null,
  '⚠️ un objetivo sin cumplir no puede llevar fecha de cumplido: sería una mentira guardada');

console.log('\n── 4. Completar, pausar, archivar y ⭐ principal ────────────────');
const cumplido = completarObjetivo(obj(), { hoy: HOY });
eq([cumplido.cumplido, cumplido.cumplidoEn], [true, HOY], '🚨 completar APUNTA CUÁNDO (criterio 12)');
eq(completarObjetivo(cumplido, { hoy: HOY }).cumplidoEn, null, 'y descumplirlo borra la fecha');
eq(cambiarEstadoObjetivo(obj(), 'pausa').estado, 'pausa', 'se puede pausar');
eq(cambiarEstadoObjetivo(obj(), 'inventado'), null, 'y un estado que no existe no se guarda');
eq(OBJETIVOS_PRINCIPALES_MAX, 1, '⭐ solo hay UN principal: es lo que hace posible la frase de Hoy');
const tres = [obj({ id: 'a' }), obj({ id: 'b' }), obj({ id: 'c' })];
const conA = marcarPrincipal(tres, 'a');
eq(conA.filter((o) => o.principal).map((o) => o.id), ['a'], 'marcar uno lo marca');
const conB = marcarPrincipal(conA, 'b');
eq(conB.filter((o) => o.principal).map((o) => o.id), ['b'],
  '🚨 Y MARCAR OTRO DESMARCA EL ANTERIOR: solo hay uno');
eq(marcarPrincipal(conB, 'b').filter((o) => o.principal).length, 0, 'y volver a tocarlo lo desmarca');
eq(marcarPrincipal(tres, 'nooo'), null, 'un id que no existe no cambia nada');
eq(objetivoPrincipal(conB).id, 'b', 'y se puede preguntar cuál es');
eq(objetivoPrincipal(marcarPrincipal([obj({ id: 'a', cumplido: true })], 'a')), null,
  '⚠️ pero uno CUMPLIDO ya no es el principal: Hoy no puede seguir apuntando a algo terminado');

console.log('\n── 5. 🚨 La fecha límite: dos orígenes, UNA respuesta ───────────');
const conPlazo = obj({ fechaCreacion: '2026-01-01', plazo: '30 días' });
const f1 = fechaLimiteDeObjetivo(conPlazo, { hoy: HOY });
eq([f1.fecha, f1.origen], ['2026-01-31', 'plazo'], 'sin fecha concreta, la calcula el plazo');
ok(f1.vencida === true, 'y sabe que ya pasó');
const conFecha = obj({ fechaCreacion: '2026-01-01', plazo: '30 días', fechaObjetivo: LEJOS });
const f2 = fechaLimiteDeObjetivo(conFecha, { hoy: HOY });
eq([f2.fecha, f2.origen], [LEJOS, 'elegida'], '🚨 la fecha que él eligió MANDA sobre el plazo');
eq(f2.choca, true, '🚨 Y EL CHOQUE SE ENSEÑA, no se resuelve en silencio (EH F5, EH F11)');
eq(f2.segunPlazo, '2026-01-31', 'diciendo qué tocaría por el plazo');
eq(fechaLimiteDeObjetivo(obj({ fechaCreacion: null, plazo: '30 días' }), { hoy: HOY }), null, 'sin fecha de creación no hay límite');
eq(fechaLimiteDeObjetivo(null), null, 'ni sin objetivo');
eq(textoDePlazo(obj({ fechaCreacion: '2026-01-01', plazo: '30 días' }), { hoy: HOY }), 'Vencida',
  '⚠️ *"Vencida"*, sin ocultar el objetivo');
eq(textoDePlazo(obj({ fechaCreacion: HOY, plazo: '30 días' }), { hoy: HOY }), '30 días restantes', '*"12 días restantes"*');
eq(textoDePlazo(obj({ fechaCreacion: '2026-08-08', plazo: '30 días' }), { hoy: HOY }), 'Hoy', 'y el último día se dice');
/* 🚨 Y NO es el fallo de la E3 F26: son dos preguntas distintas, no dos nombres
   para la misma. Hay una sola función que responde. */
ok(/export function fechaLimiteDeObjetivo/.test(LIB) && (LIB.match(/export function fechaLimiteDeObjetivo/g) || []).length === 1,
  '🚨 UNA SOLA función responde «¿cuándo vence?»: dos habrían dicho cosas distintas (E3 F26)');

console.log('\n── 6. Los tipos de meta ─────────────────────────────────────────');
eq(TIPOS_META.map((t) => t.id), ['numerico', 'porcentaje', 'check', 'frecuencia'], 'los cuatro del enunciado');
ok(TIPOS_META.every((t) => t.explica && t.ejemplo),
  '⚠️ y cada uno declara CÓMO se mide y su ejemplo: la lista es del módulo, el comportamiento está en su línea');
eq(TIPO_META_POR_DEFECTO, 'numerico', 'el de por defecto es el numérico');
eq(tipoMeta('inventado'), null, 'un tipo que no existe no se acepta');
eq(crearMeta({ nombre: '  ', hoy: HOY }), null, 'sin nombre no hay meta');
eq(crearMeta({ nombre: 'x', tipo: 'frecuencia', hoy: HOY }), null,
  '🚨 UNA META DE FRECUENCIA SIN PERIODO NO SE CREA: elegirlo por él la metería en «Diaria» sin decírselo (E3 F19)');
eq(crearMeta({ nombre: 'x', tipo: 'frecuencia', periodo: 'Semanal', objetivo: 4, hoy: HOY }).periodo, 'Semanal', 'con periodo, sí');
eq(crearMeta({ nombre: 'x', hoy: HOY }).periodo, null, '⚠️ y una numérica NO lo pide: no se le inventa uno');
eq(crearMeta({ nombre: 'x', tipo: 'check', objetivo: 99, hoy: HOY }).objetivo, 1, 'una de sí/no no tiene objetivo numérico');
eq(crearMeta({ nombre: 'x', tipo: 'porcentaje', unidad: 'kg', hoy: HOY }).unidad, '', 'ni un porcentaje unidad');

console.log('\n── 7. 🚨 El progreso: 100 % al pintar, más por dentro ───────────');
const m15 = crearMeta({ nombre: '15 dominadas', objetivo: 15, unidad: 'dominadas', hoy: HOY });
const m8 = actualizarProgreso(m15, 8, { hoy: HOY });
const p8 = progresoDeMeta(m8);
eq([p8.actual, p8.objetivo, p8.porcentaje], [8, 15, 53], '*"8 / 15 = 53 %"*, el ejemplo del enunciado');
eq(p8.texto, '8 / 15 dominadas', 'con su unidad');
const m20 = actualizarProgreso(m15, 20, { hoy: HOY });
const p20 = progresoDeMeta(m20);
eq(p20.porcentaje, 100,
  '🚨 NUNCA POR ENCIMA DEL 100 % AL PINTARLO, que es lo que dice el enunciado con esas palabras');
eq(p20.porcentajeReal, 133, '🚨 pero POR DENTRO se guarda el valor superior: *"aunque internamente pueda registrarse"*');
eq(p20.superado, true, 'y se sabe que lo superó');
eq(m20.progreso, 20, 'el valor guardado es el de verdad, sin recortar');
eq(progresoDeMeta(crearMeta({ nombre: 'x', tipo: 'porcentaje', hoy: HOY })).texto, '0 %', 'un porcentaje se pinta como porcentaje');
eq(progresoDeMeta(actualizarProgreso(crearMeta({ nombre: 'x', tipo: 'porcentaje', hoy: HOY }), 72, { hoy: HOY })).texto, '72 %', '*"72 %"*');
const chk = crearMeta({ nombre: 'Handstand', tipo: 'check', hoy: HOY });
eq(progresoDeMeta(chk).texto, 'Sin hacer', 'una de sí/no dice si está hecha');
eq(progresoDeMeta(completarMeta(chk, { hoy: HOY })).texto, 'Hecho', 'y cuando lo está');
eq(progresoDeMeta(crearMeta({ nombre: 'x', tipo: 'frecuencia', periodo: 'Semanal', objetivo: 4, hoy: HOY })).texto,
  '0 / 4 · Semanal', '⚠️ y una de frecuencia dice su periodo: sin él, "3 / 4" no significa nada');
eq(progresoDeMeta(null), null, 'y aguanta que no le den meta');

console.log('\n── 8. Completar una meta: a mano O llegando ────────────────────');
eq(metaCompletada(m8), false, 'a medias no está completada');
eq(metaCompletada(actualizarProgreso(m15, 15, { hoy: HOY })), true, '🚨 llegar al objetivo la completa');
eq(actualizarProgreso(m15, 15, { hoy: HOY }).completadaEn, HOY, 'y apunta cuándo');
const aMano = completarMeta(m8, { hoy: HOY });
eq([metaCompletada(aMano), aMano.progreso], [true, 8],
  '🚨 Y SE PUEDE COMPLETAR A MANO SIN LLEGAR: *"una meta puede marcarse como completada manualmente"*');
eq(completarMeta(aMano, { hoy: HOY }).completada, false, 'y se puede deshacer');
eq(sumarProgreso(m8, 3, { hoy: HOY }).progreso, 11, 'se puede sumar de golpe');
eq(sumarProgreso(m8, -20, { hoy: HOY }).progreso, 0, '⚠️ y nunca baja de cero');
eq(actualizarProgreso(chk, 5, { hoy: HOY }).completada, true, 'en una de sí/no, actualizar es completarla');
eq(actualizarProgreso(null, 1), null, 'y aguanta que no le den meta');

console.log('\n── 9. La jerarquía: Objetivo → Metas → Tareas ──────────────────');
const o1 = obj({ id: 'o1' });
const linkada = vincularMeta(m8, 'o1');
eq(linkada.objetivoId, 'o1', 'una meta puede pertenecer a un objetivo');
eq(vincularMeta(linkada, null).objetivoId, null, 'y se puede soltar');
eq(crearMeta({ nombre: 'Suelta', hoy: HOY }).objetivoId, null,
  '⚠️ *"Pero NO obligar a que todo tenga que estar vinculado"*: una meta puede ir sola');
eq(metasDeObjetivo('o1', [linkada, m15]).length, 1, 'se pueden pedir las metas de un objetivo');
eq(metasSueltas([linkada, m15]).length, 1, 'y las que no tienen ninguno');
const prog0 = progresoDeObjetivo(o1, []);
eq(prog0.porcentaje, null,
  '🚨 SIN METAS NO HAY PORCENTAJE: un 0 % diría que va mal cuando lo que pasa es que aún no ha puesto ninguna (E3 F13)');
eq(prog0.texto, 'Sin metas todavía', 'y se dice');
eq(progresoDeObjetivo({ ...o1, cumplido: true }, []).porcentaje, 100, '⚠️ pero uno cumplido a mano sí está al 100 %');
const dosMetas = [vincularMeta(completarMeta(m8, { hoy: HOY }), 'o1'), vincularMeta(m15, 'o1')];
const prog2 = progresoDeObjetivo(o1, dosMetas);
eq([prog2.completadas, prog2.metas, prog2.porcentaje], [1, 2, 50], '*"2 / 5 metas"* y su porcentaje, derivados');
eq(prog2.texto, '1 de 2 metas', 'con el texto del enunciado');
ok(!/progresoGuardado|guardarProgresoObjetivo/.test(CODIGO),
  '🚨 EL PROGRESO DE UN OBJETIVO NO SE GUARDA: mentiría en cuanto él borre una meta (EH F35)');
eq(PESOS_DE_META.implementado, false,
  '⚠️ y los pesos se DECLARAN sin implementarse: *"dejar preparada la arquitectura… pero no complicar ahora el cálculo"*');
ok(PESOS_DE_META.comoSeria && PESOS_DE_META.porque, 'con cómo serían y por qué no están (regla 8)');
ok(!/peso:\s*\d/.test(CODIGO), 'y sin un campo `peso` vacío que nadie rellena');

console.log('\n── 10. Las tareas de una meta (la promesa de la E3 F26) ────────');
eq(RELACIONES_FUTURAS.map((r) => r.enlazable), [true, true],
  '✅ los dos campos de la PR F4 pasan a ENLAZABLES: era su `llega: PR F5`');
ok(RELACIONES_FUTURAS.every((r) => r.campo && r.hacia), 'y siguen declarando adónde apuntan');
const t1 = { ...crearTarea({ texto: 'Entrenar espalda' }), metaId: m8.id };
const t2 = { ...crearTarea({ texto: 'Otra cosa' }) };
eq(tareasDeMeta(m8.id, [t1, t2]).length, 1, 'se pueden pedir las tareas de una meta');
eq(tareasDeObjetivo('o1', [{ ...t2, objetivoId: 'o1' }]).length, 1, 'y las de un objetivo');
eq(tareasDeMeta(m8.id, null), [], 'y aguanta que no le den tareas');
ok(!/tareas:\s*\[/.test(CODIGO),
  '🚨 UNA META NO GUARDA UNA LISTA DE TAREAS: la relación la guarda la TAREA, o habría dos listas que sincronizar');
ok(!/crearTarea|addTarea/.test(CODIGO),
  '⚠️ y esta fase no crea tareas: *"NO modificar innecesariamente el gestor de tareas"*');

console.log('\n── 11. Filtros, orden y vacíos ─────────────────────────────────');
eq(FILTROS_OBJETIVO.map((f) => f.id), ['activos', 'completados', 'pausa', 'archivados', 'todos'], 'los filtros de objetivos');
const variados = [obj({ id: 'a' }), obj({ id: 'b', cumplido: true }), obj({ id: 'c', estado: 'pausa' }), obj({ id: 'd', estado: 'archivado' })];
eq(filtrarObjetivos(variados, 'activos').map((o) => o.id), ['a'], 'activos');
eq(filtrarObjetivos(variados, 'completados').map((o) => o.id), ['b'], 'completados');
eq(filtrarObjetivos(variados, 'archivados').map((o) => o.id), ['d'], 'archivados');
eq(filtrarObjetivos(variados, 'todos').length, 4, 'y todos');
eq(FILTROS_META.map((f) => f.id), ['activas', 'completadas', 'sueltas', 'todas'], 'los de metas');
eq(filtrarMetas([m8, completarMeta(m8, { hoy: HOY })], 'activas').length, 1, 'activas');
eq(filtrarMetas([linkada, m15], 'sueltas').length, 1, 'y las que no tienen objetivo');
const orden = ordenarObjetivos([
  obj({ id: 'baja', prioridad: 'baja' }),
  obj({ id: 'alta', prioridad: 'alta' }),
  obj({ id: 'ppal', prioridad: 'baja', principal: true }),
], { hoy: HOY });
eq(orden.map((o) => o.id), ['ppal', 'alta', 'baja'], '⚠️ el principal arriba, luego por prioridad');
const original = [obj({ id: 'z' }), obj({ id: 'a' })];
ordenarObjetivos(original, { hoy: HOY });
eq(original.map((o) => o.id), ['z', 'a'], '⚠️ y ordenar NO muta la lista que le dan (E3 F26)');
ok(VACIO_OBJETIVOS.titulo && VACIO_OBJETIVOS.texto && VACIO_OBJETIVOS.accion,
  '⚠️ el vacío de objetivos dice qué es un objetivo y tiene salida (EH F41)');
ok(VACIO_METAS.titulo && VACIO_METAS.texto && VACIO_METAS.accion, 'y el de metas también');
ok(VACIO_OBJETIVOS.texto !== VACIO_METAS.texto,
  '🚨 Y NO DICEN LO MISMO: *"hay que evitar que Metas y Objetivos parezcan dos sistemas iguales"* (criterio 15)');

console.log('\n── 12. Lo que Hoy y Productividad pueden pedir ─────────────────');
const conPpal = { lista: marcarPrincipal([obj({ id: 'a', texto: 'Mejorar mi físico' })], 'a') };
const ph = paraHoy(conPpal, [m8, m15]);
eq(ph.lineaPrincipal, 'Objetivo principal: Mejorar mi físico', '*"Objetivo principal: Mejorar mi físico"*, literal del enunciado');
eq(ph.metasPendientes, 2, 'y las metas pendientes');
eq(ph.lineaMetas, '2 metas pendientes', 'con el plural bien escrito');
eq(paraHoy(conPpal, [m8]).lineaMetas, '1 meta pendiente', 'y el singular');
eq(paraHoy({ lista: [] }, []).lineaPrincipal, null, '⚠️ sin principal, `null`: no se inventa una frase');
eq(paraHoy({ lista: [] }, []).lineaMetas, null, 'ni con cero metas');
const rp = resumenParaProductividad(conPpal, [m8, completarMeta(m8, { hoy: HOY })]);
eq([rp.objetivosActivos, rp.metasActivas], [1, 1], '*"Objetivos: 2 activos · Metas: 5 activas"*');
ok(!/today_|guardarResumen|cacheResumen/.test(CODIGO),
  '🚨 y se cuenta en el momento: ni una cifra guardada (E3 F13, EH F35)');

console.log('\n── 13. Lo que NO se hace en esta fase ──────────────────────────');
ok(!/crearRutina|normalizarRutina|RUTINAS_/.test(CODIGO),
  '⚠️ NI RUTINAS: *"No desarrollar todavía Rutinas"* (criterio 20)');
ok(!/askAI|contextoParaIA|anthropic/i.test(CODIGO), '⚠️ ni IA');
ok(!/\bXP\b|nivel\b|recompensa|moneda/i.test(CODIGO), '⚠️ ni gamificación (D2-02)');
ok(!/new Notification|notificarSiCorresponde/.test(CODIGO), '⚠️ ni notificaciones');
ok(!/#[0-9a-fA-F]{6}/.test(CODIGO), '🚨 ni un hex suelto: los colores son tokens (regla 2)');

console.log('\n── 14. Las pantallas y sus manejadores ─────────────────────────');
const vistaObj = leer('src/views/ObjectivesView.jsx');
const vistaPr = leer('src/views/ProductivityView.jsx');
const app = leer('src/App.jsx');
ok(/onGuardarLista/.test(vistaObj) && /onGuardarListaObjetivos,/.test(vistaPr),
  '🚨 `onGuardarListaObjetivos` está DECLARADO: un manejador usado y no declarado deja la pantalla en blanco (E3 F17)');
ok(/const guardarListaObjetivos = /.test(app) && /onGuardarListaObjetivos=\{guardarListaObjetivos\}/.test(app),
  '🚨 Y ALGUIEN LO LLAMA: una función que nadie llama no falla nunca (E3 F1 y F5)');
ok(/normalizarObjetivosDe\(obj\)/.test(app),
  '🚨 y los objetivos se normalizan AL CARGAR: si no, el siguiente guardado se lleva los campos nuevos (regla 5)');
ok(/normalizarMetasDe\(/.test(app), 'y las metas también');
ok(/metas=\{productividad\.metas\}/.test(vistaPr),
  '⚠️ y la pantalla de Objetivos recibe las metas: sin ellas no podría enseñar su progreso');
const bloqueMetas = vistaPr.slice(vistaPr.indexOf('/* ---------- Metas (E3 F27'), vistaPr.indexOf('function ObjetivosDentro') > 0 ? vistaPr.indexOf('function ObjetivosDentro') : vistaPr.indexOf('/* ---------- Apuntes'));
eq([...bloqueMetas.matchAll(/<button(?![^>]*aria-label)[^>]*>\s*\{?\s*<(Circle|CheckCircle2|Trash2|Target|Plus|Pencil)\b/g)].length, 0,
  '🚨 ni un botón de solo icono sin `aria-label` (EH F42)');
ok(/toque-44/.test(bloqueMetas), 'y las zonas de toque usan la clase de 44 px');
ok(!/#[0-9a-fA-F]{6}/.test(bloqueMetas), '🚨 ni un hex suelto en la pantalla');
ok(!/Fase \d|apartado \d|próximamente/i.test([...bloqueMetas.matchAll(/>([^<>{}]{6,})</g)].map((m) => m[1]).join(' ')),
  '⚠️ regla 9: ni una nota interna de desarrollo en lo que ve Josué');
/* 🐛 La pantalla vieja decía que los objetivos "llegarán en la próxima fase". */
ok(!/llegarán en la próxima fase|próxima fase/i.test(vistaPr),
  '🐛 Y SE HA QUITADO LA FRASE QUE PROMETÍA LOS OBJETIVOS «PARA LA PRÓXIMA FASE»: ya están');

console.log('\n── 15. La papelera y el aislamiento ────────────────────────────');
const pap = leer('src/lib/papelera.js');
ok(/'productividad\.metas'/.test(pap) && /'objetivos\.lista'/.test(pap), 'las dos listas están en el catálogo de la papelera');
ok(/eliminarConPapelera\('productividad', 'metas', id\)/.test(app), 'y borrar una meta pasa por la única puerta (ME F3)');
ok(/eliminarConPapelera\('objetivos', 'lista', id\)/.test(app), 'y borrar un objetivo también');
eq(AISLAMIENTO_METAS_OBJETIVOS.politica, 'auth.uid() = user_id',
  '🚨 el aislamiento es de la BASE DE DATOS, nunca de la pantalla (EH F43, EH F63)');
ok(AISLAMIENTO_METAS_OBJETIVOS.vinculos.length > 20,
  '⚠️ y está escrito por qué un `objetivoId` no puede apuntar a la lista de otro usuario');

console.log('\n── 16. Condición de finalización (calculada) ───────────────────');
const cond = condicionPR5({ objetivos: { lista: [o1] }, metas: dosMetas, tareas: [t1], hoy: HOY });
eq(cond.length, 20, 'los veinte puntos del criterio de éxito');
eq(cond.filter((c) => !c.ok).map((c) => c.texto), [], '🚨 y ninguno rojo — y si lo estuviera, se vería: se calculan');
ok(!/ok:\s*true,\s*texto/.test(soloCodigo(LIB).replace(/ok:\s*true,\s*via/g, '')),
  '🚨 y ninguna casilla está puesta a `true` a mano sin decir por qué');

console.log(`\n${'═'.repeat(70)}`);
if (fallos.length) {
  console.log(`✗ ${fallos.length} FALLOS de ${pasa + fallos.length}`);
  fallos.forEach((f) => console.log(`   · ${f}`));
  process.exit(1);
}
console.log(`✓ ${pasa} comprobaciones correctas — E3 F27 (PR F5) · Metas + Objetivos`);
