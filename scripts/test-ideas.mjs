// ============================================================================
// ENTREGA 3 · FASE 19 (BL F5) — BIBLIOTECA: IDEAS
//
// Los 22 puntos de la condición de éxito, y las cuatro cosas que el enunciado
// subraya: **nada se convierte solo**, **la idea original no desaparece**,
// **descartar no borra** y **archivar y descartar son dos cosas distintas**.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ESTADOS_IDEA, estadoIdea, ESTADO_IDEA_POR_DEFECTO,
  PRIORIDADES_IDEA, prioridadIdea, PRIORIDAD_POR_DEFECTO, CATEGORIAS_IDEA,
  CAMPOS_IDEA, crearIdea, normalizarIdea, editarIdea,
  cambiarEstadoIdea, archivarIdea, desarchivarIdea,
  CONVERSIONES, conversion, conversionesDisponibles, convertirIdea, generadosDe, textoDeIdea,
  FILTROS_IDEAS, ORDENES_IDEAS, ORDEN_IDEAS_POR_DEFECTO,
  filtrarIdeas, ordenarIdeas, textoBuscableIdea,
  estadisticasIdeas, lineaIdeas, DIFERENCIA_IDEAS, NO_EN_IDEAS,
} from '../src/lib/ideas.js';
import { crearIdea as crearIdeaDesdeBiblioteca, normalizarBiblioteca, miniApp } from '../src/lib/biblioteca.js';
import { CATALOGO_PAPELERA } from '../src/lib/papelera.js';
import { PERIODOS_META, PLAZOS_OBJETIVO } from '../src/tokens.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const LIB = leer('src/lib/ideas.js');
const VISTA = sinComentarios(leer('src/views/LibraryView.jsx'));
const APP = sinComentarios(leer('src/App.jsx'));
const hoy = new Date().toLocaleDateString('sv-SE');
const idea = (extra = {}) => ({ ...crearIdea({ titulo: 'Crear una app de reservas' }), ...extra });

console.log('\n═══ 1. LOS CINCO ESTADOS Y LA PRIORIDAD (criterios 4 y 6) ═══\n');

eq(ESTADOS_IDEA.map((e) => e.id), ['captured', 'developing', 'paused', 'completed', 'discarded'],
  '🚨 los cinco del enunciado');
ok(ESTADOS_IDEA.every((e) => e.nombre && e.icono && e.que),
  '🚨 cada uno con su NOMBRE además del icono (EH F42)');
eq(ESTADO_IDEA_POR_DEFECTO, 'captured', '⚠️ una idea nueva nace capturada');
eq(estadoIdea('inventado'), null, 'uno que no existe no se inventa');

eq(PRIORIDADES_IDEA.map((p) => p.id), ['baja', 'media', 'alta'], '⚠️ las tres prioridades');
eq(PRIORIDAD_POR_DEFECTO, 'media', '⚠️ y por defecto, media');
eq(crearIdea({ titulo: 'X' }).prioridad, 'media',
  '🚨 así que crear una idea NUNCA pregunta la prioridad: *"no hacer que sea obligatoria"*');
eq(prioridadIdea('inventada'), null, 'una que no existe no se inventa');

console.log('\n═══ 2. LA CAPTURA RÁPIDA (criterios 1 y 2) ═══\n');

const rapida = crearIdea({ titulo: 'Crear app de reservas deportivas' });
eq(rapida.titulo, 'Crear app de reservas deportivas', '🚨 título y guardar: nada más');
eq([rapida.descripcion, rapida.categoria, rapida.notas], ['', '', ''],
  '🚨 sin descripción, categoría ni notas: *"sin obligar a rellenar"*');
eq(crearIdea({ descripcion: 'Solo se me ocurrió esto' }).titulo, '',
  '🚨 Y SIN TÍTULO TAMBIÉN VALE: el enunciado lo llama *"recomendado pero no necesariamente obligatorio"*');
eq(crearIdea({ titulo: '  ', descripcion: '  ' }), null, '⚠️ pero algo hay que escribir');
eq(crearIdea(), null, 'y sin nada no se crea nada');
eq(Object.keys(rapida).sort(), [...CAMPOS_IDEA].sort(), '⚠️ y tiene sus catorce campos');
ok(!('user_id' in rapida) && !/user_id/.test(sinComentarios(LIB)),
  '🚨 sin `user_id` dentro: el aislamiento es de `app_data` (EH F43)');
eq([rapida.objetivoId, rapida.metaId, rapida.tareaId], [null, null, null],
  '⚠️ y los tres campos de relación EXISTEN desde el primer día: convertir no tiene que migrar nada');

// 🚨 Una sola fábrica.
eq(crearIdeaDesdeBiblioteca, crearIdea,
  '🚨 `biblioteca.js` REEXPORTA la fábrica de `ideas.js`: no hay dos formas de la misma idea conviviendo');
ok(!/^export function crearIdea/m.test(leer('src/lib/biblioteca.js')), '⚠️ y no la redefine');

console.log('\n═══ 3. LAS CATEGORÍAS SON TEXTO, NO UN CATÁLOGO CERRADO (criterio 7) ═══\n');

ok(CATEGORIAS_IDEA.includes('Estudios') && CATEGORIAS_IDEA.includes('Negocio'), '⚠️ las siete del enunciado');
eq(crearIdea({ titulo: 'X', categoria: 'Mi categoría inventada' }).categoria, 'Mi categoría inventada',
  '🚨 se guarda EL TEXTO, no un id contra el catálogo: *"el usuario debe poder crear categorías personalizadas"*, y con un catálogo cerrado habría que tocar el código para admitir la primera');
eq(crearIdea({ titulo: 'X' }).categoria, '', '⚠️ y sin categoría también vale: es opcional');
ok(/datalist/.test(VISTA),
  '⚠️ y la pantalla las ofrece como SUGERENCIAS, no como un desplegable cerrado');

console.log('\n═══ 4. COMPLETAR, DESCARTAR Y ARCHIVAR SON TRES COSAS ═══\n');

const hecha = cambiarEstadoIdea(idea(), 'completed');
eq([hecha.estado, hecha.completado], ['completed', hoy],
  '⚠️ realizarla guarda su fecha (criterio 11)');
eq(hecha.titulo, 'Crear una app de reservas', '🚨 y NO se borra el contenido');
eq(cambiarEstadoIdea(hecha, 'developing').completado, hoy,
  '🚨 y volver atrás NO borra esa fecha: la hizo de verdad, como el fin de un libro (E3 F17)');
eq(cambiarEstadoIdea(idea({ completado: '2026-01-01' }), 'completed').completado, '2026-01-01',
  '⚠️ ni se pisa una fecha que ya tenía');

const descartada = cambiarEstadoIdea(idea(), 'discarded');
eq(descartada.titulo, 'Crear una app de reservas',
  '🚨 DESCARTAR NO BORRA: *"debe conservarse; esto permite revisar posteriormente ideas antiguas"* (criterio 12)');
ok(!/function .*(borrarDescartadas|purgarIdeas|limpiarDescartadas)/.test(LIB),
  '🚨 y no existe ninguna función que las borre: así es como se cumple *"no eliminar automáticamente"*');

// 🚨 El apartado que separa archivar de descartar.
const realizadaYArchivada = archivarIdea(hecha);
eq([realizadaYArchivada.estado, realizadaYArchivada.archivada], ['completed', true],
  '🚨 UNA IDEA REALIZADA SE PUEDE ARCHIVAR SIN DEJAR DE ESTAR REALIZADA: con un solo campo de estado no cabrían las dos cosas (criterio 13)');
eq(desarchivarIdea(realizadaYArchivada).estado, 'completed', '⚠️ y sacarla del archivo no le cambia el estado');
ok(CAMPOS_IDEA.includes('archivada') && CAMPOS_IDEA.includes('estado'),
  '⚠️ por eso son dos campos distintos');
eq(archivarIdea(null), null, 'sin idea no revienta');

console.log('\n═══ 5. 🚨 CONVERTIR: NADA SE ESCRIBE SIN CONFIRMAR (criterios 15 y 16) ═══\n');

eq(CONVERSIONES.map((c) => c.id), ['tarea', 'meta', 'objetivo', 'documento'], '⚠️ los cuatro destinos del enunciado');
eq(conversionesDisponibles().map((c) => c.id), ['tarea', 'meta', 'objetivo'],
  '🚨 pero solo TRES existen hoy: Documentos llega en su fase, y se declara con `existe: false`');
ok(conversion('documento').porque, '⚠️ con su frase, que es la que se lee en pantalla (regla 8)');
ok(convertirIdea(idea(), 'documento', {}, true).error, '🚨 y convertir a documento NO crea nada');

const sinConfirmar = convertirIdea(idea(), 'tarea', {}, false);
ok(sinConfirmar.plan && !sinConfirmar.elemento,
  '🚨 SIN `confirmado` devuelve un PLAN y no construye nada: decimoctavo `aplicarPlan` del proyecto');
ok(/Productividad/.test(sinConfirmar.plan.destino), '⚠️ y el plan dice dónde va a aparecer');

const aTarea = convertirIdea(idea(), 'tarea', {}, true);
eq([aTarea.tipo, aTarea.elemento.texto, aTarea.elemento.hecha], ['tarea', 'Crear una app de reservas', false],
  '⚠️ una tarea nace con la forma de siempre');
eq(Object.keys(aTarea.elemento).sort(), ['fecha', 'hecha', 'id', 'texto'],
  '🚨 y con SUS CUATRO CAMPOS, ni uno más: una tarea de JosStyle es `{ id, texto, fecha, hecha }` (EH F39 + E3 F26)');
eq(aTarea.idea.tareaId, aTarea.elemento.id, '🚨 y la idea guarda el id de lo que generó');
eq([aTarea.idea.titulo, aTarea.idea.estado], ['Crear una app de reservas', 'captured'],
  '🚨 LA IDEA NO DESAPARECE NI CAMBIA DE ESTADO: *"la idea original no debe desaparecer automáticamente"*');

// 🚨 Ni periodo ni plazo tienen valor por defecto.
const metaSinPeriodo = convertirIdea(idea(), 'meta', {}, true);
ok(metaSinPeriodo.error && metaSinPeriodo.faltan.includes('periodo'),
  '🚨 UNA META SIN PERIODO NO SE CREA: elegirlo por él metería su idea en "Diaria, 1" sin decírselo (HT F3 y EH F28)');
ok(convertirIdea(idea(), 'meta', { periodo: PERIODOS_META[0] }, true).faltan.includes('objetivo'),
  '⚠️ ni sin la cifra');
ok(convertirIdea(idea(), 'meta', { periodo: 'Inventado', objetivo: 3 }, true).error,
  '⚠️ ni con un periodo que no existe');
const aMeta = convertirIdea(idea(), 'meta', { periodo: 'Semanal', objetivo: '3' }, true);
eq([aMeta.elemento.nombre, aMeta.elemento.periodo, aMeta.elemento.objetivo, aMeta.elemento.progreso],
  ['Crear una app de reservas', 'Semanal', 3, 0], '⚠️ y con los dos, la meta nace bien');

ok(convertirIdea(idea(), 'objetivo', {}, true).faltan.includes('plazo'),
  '🚨 y un objetivo sin plazo tampoco: *"el plazo no tiene valor por defecto"* (EH F28)');
const aObjetivo = convertirIdea(idea(), 'objetivo', { plazo: PLAZOS_OBJETIVO[1] }, true);
eq([aObjetivo.elemento.texto, aObjetivo.elemento.plazo, aObjetivo.elemento.cumplido],
  ['Crear una app de reservas', PLAZOS_OBJETIVO[1], false], '⚠️ con él, sí');
eq(Object.keys(aObjetivo.elemento).sort(), ['cumplido', 'fechaCreacion', 'id', 'plazo', 'texto'],
  '🚨 y un objetivo tiene SUS campos: no se inventan otros (EH F28)');

ok(convertirIdea(aTarea.idea, 'tarea', {}, true).error,
  '⚠️ una idea que ya generó una tarea no genera otra: *"no crear copias innecesarias"*');
ok(convertirIdea(null, 'tarea', {}, true).error, 'sin idea no revienta');
ok(convertirIdea(idea(), 'inventado', {}, true).error, 'y un destino que no existe tampoco');
eq(convertirIdea(crearIdea({ descripcion: 'Sin título' }), 'tarea', {}, true).elemento.texto, 'Sin título',
  '⚠️ una idea sin título se convierte usando su descripción, nunca "Sin título"');

eq(generadosDe(aTarea.idea).map((g) => g.tipo), ['tarea'], '⚠️ y el detalle puede decir qué ha generado');
eq(generadosDe(idea()), [], 'una que no generó nada, nada');

// 🚨 Y App.jsx tiene que escribirlo en los DOS sitios.
ok(/const convertirIdeaEn =/.test(APP) && /onConvertirIdea=\{convertirIdeaEn\}/.test(APP),
  '🚨 `convertirIdeaEn` existe **y App.jsx se la pasa**: una función que nadie llama no falla nunca');
ok(/tareas: \[\.\.\.productividad\.tareas, r\.elemento\]/.test(APP)
  && /metas: \[\.\.\.productividad\.metas, r\.elemento\]/.test(APP)
  && /lista: \[\.\.\.objetivos\.lista, r\.elemento\]/.test(APP),
  '🚨 y escribe en los módulos de siempre, no en una lista paralela de Biblioteca');

console.log('\n═══ 6. BÚSQUEDA, FILTROS Y ORDEN (criterios 8, 9 y 10) ═══\n');

const lista = [
  { ...crearIdea({ titulo: 'Zeta app', descripcion: 'Para el club', prioridad: 'baja' }), id: 'a', fecha: '2026-09-01' },
  { ...crearIdea({ titulo: 'Alfa', notas: 'Podría usar Supabase' }), id: 'b', fecha: '2026-09-03', estado: 'developing', prioridad: 'alta' },
  { ...crearIdea({ titulo: 'Antigua' }), id: 'c', fecha: '2026-08-01', estado: 'discarded' },
  { ...crearIdea({ titulo: 'Guardada' }), id: 'd', fecha: '2026-09-02', archivada: true },
];

eq(filtrarIdeas(lista, {}).map((i) => i.id), ['a', 'b', 'c'],
  '🚨 lo ARCHIVADO no sale entre lo demás, y lo DESCARTADO sí: una idea descartada se puede revisar');
eq(filtrarIdeas(lista, { filtro: 'archivadas' }).map((i) => i.id), ['d'], '⚠️ y lo archivado, en su filtro');
eq(filtrarIdeas(lista, { filtro: 'developing' }).map((i) => i.id), ['b'], '⚠️ y por estado');
eq(FILTROS_IDEAS.map((f) => f.id), ['todas', 'captured', 'developing', 'paused', 'completed', 'discarded', 'archivadas'],
  '⚠️ los filtros salen de `ESTADOS_IDEA`: renombrar un estado renombra su pastilla sola');

ok(textoBuscableIdea(lista[1]).includes('supabase'),
  '🚨 la búsqueda mira las NOTAS DE DESARROLLO, que el enunciado nombra expresamente');
eq(filtrarIdeas(lista, { texto: 'club' }).map((i) => i.id), ['a'], '⚠️ y la descripción');
eq(filtrarIdeas(lista, { texto: 'ZETA' }).map((i) => i.id), ['a'], '⚠️ sin distinguir mayúsculas');
eq(filtrarIdeas([crearIdea({ titulo: 'Tecnología' })], { texto: 'tecnologia' }).length, 1,
  '🚨 ni acentos: nadie escribe tildes en el móvil');

eq(ORDENES_IDEAS.map((o) => o.id), ['recientes', 'antiguas', 'prioridad', 'alfabetico'], '⚠️ los cuatro órdenes');
eq(ORDEN_IDEAS_POR_DEFECTO, 'recientes', '⚠️ y por defecto, las más recientes');
eq(ordenarIdeas(filtrarIdeas(lista, {}), 'recientes').map((i) => i.id), ['b', 'a', 'c'], '⚠️ recientes primero');
eq(ordenarIdeas(filtrarIdeas(lista, {}), 'antiguas').map((i) => i.id), ['c', 'a', 'b'], '⚠️ y al revés');
eq(ordenarIdeas(filtrarIdeas(lista, {}), 'prioridad')[0].id, 'b', '⚠️ la de prioridad alta primero');
eq(ordenarIdeas(filtrarIdeas(lista, {}), 'prioridad').at(-1).id, 'a', '⚠️ y la baja al final');
eq(ordenarIdeas(filtrarIdeas(lista, {}), 'alfabetico')[0].id, 'b', '⚠️ y alfabético por su texto');

console.log('\n═══ 7. ESTADÍSTICAS SENCILLAS ═══\n');

const stats = estadisticasIdeas(lista);
eq(stats.total, 3, '🚨 el total NO cuenta lo archivado');
eq(stats.activas, 2, '⚠️ "activas" son las que siguen vivas: ni realizadas ni descartadas');
eq(stats.desarrollando, 1, '⚠️ y las que está desarrollando');
eq(estadisticasIdeas([{ ...crearIdea({ titulo: 'X' }), estado: 'completed', completado: '2026-09-15' }], '2026-09').realizadasEsteMes, 1,
  '⚠️ y las realizadas este mes, si las hay');
eq(estadisticasIdeas([{ ...crearIdea({ titulo: 'X' }), estado: 'completed', completado: '2026-07-15' }], '2026-09').realizadasEsteMes, 0,
  '⚠️ contando solo las de este mes');
eq(lineaIdeas(lista), '3 ideas · 1 en desarrollo', '⚠️ y la línea de arriba');
eq(lineaIdeas([]), null, '🚨 sin ni una idea NO hay línea: *"no inventar números"*');

console.log('\n═══ 8. EL NORMALIZADOR Y LA MIGRACIÓN (regla 5, vigesimoprimera vez) ═══\n');

// 🚨 En el modelo mínimo de la BL F1 el campo largo se llamaba `detalle`.
const vieja = { id: 'i1', titulo: 'Una idea', detalle: 'lo que se me ocurrió', fecha: '2026-05-05' };
const migrada = normalizarIdea(vieja);
eq([migrada.id, migrada.titulo, migrada.descripcion, migrada.fecha],
  ['i1', 'Una idea', 'lo que se me ocurrió', '2026-05-05'],
  '🚨 el `detalle` de la BL F1 se lee como `descripcion`: sin esto, el texto que Josué escribió entonces desaparecería de la pantalla sin que nada fallara');
eq([migrada.estado, migrada.prioridad, migrada.archivada, migrada.tareaId],
  ['captured', 'media', false, null], '⚠️ y los campos nuevos llegan puestos, no `undefined`');

eq(normalizarIdea({ titulo: 'X', estado: 'inventado' }).estado, 'captured', '⚠️ un estado que no existe vuelve al de por defecto');
eq(normalizarIdea({ titulo: 'X', prioridad: 'urgentísima' }).prioridad, 'media', '⚠️ y una prioridad inventada, a media');
eq(normalizarIdea({ titulo: 'X', fecha: '2026-13-45' }).fecha === '2026-13-45', false,
  '🚨 y una fecha imposible se descarta: encaja con la forma y no existe');
ok(normalizarIdea({ titulo: 'Sin id' }).id, '⚠️ una idea guardada sin id recibe uno (EH F45)');
eq(normalizarIdea({}), null, 'y una vacía se descarta');
eq(normalizarIdea('no soy una idea'), null, 'lo que no es un objeto tampoco pasa');

const bib = normalizarBiblioteca({ ideas: [vieja] });
eq(bib.ideas[0].descripcion, 'lo que se me ocurrió',
  '🚨 `normalizarBiblioteca` usa el normalizador COMPLETO: si no, los campos nuevos se perderían en el siguiente guardado');
eq(miniApp('ideas').coleccion, 'ideas', '⚠️ y la colección sigue siendo la de la BL F1');

console.log('\n═══ 9. EDITAR Y ELIMINAR (criterios 3 y 14) ═══\n');

const base = idea({ notas: 'Podría usar X' });
const editada = editarIdea(base, { descripcion: 'Ahora con descripción', prioridad: 'alta' });
eq([editada.descripcion, editada.prioridad, editada.id, editada.notas],
  ['Ahora con descripción', 'alta', base.id, 'Podría usar X'],
  '⚠️ se cambia lo que llega y lo demás se conserva');
eq(editada.fecha, base.fecha, '⚠️ y la fecha en que se le ocurrió no se toca');
eq(editarIdea(base, { titulo: '', descripcion: '' }).titulo, base.titulo,
  '🚨 y vaciarla del todo NO la borra: se queda como estaba');
eq(editarIdea(null, {}), null, 'sin idea no revienta');

ok(Boolean(CATALOGO_PAPELERA['biblioteca.ideas']), '🚨 eliminar manda a Eliminados recientes');
ok(/eliminarConPapelera\('biblioteca', 'ideas'/.test(APP),
  '⚠️ por la única puerta que hay, con los nombres literales que busca la auditoría de ME F4');
ok(/const updateIdea =/.test(APP) && /onUpdateIdea=\{updateIdea\}/.test(APP),
  '🚨 y `updateIdea` existe **y se pasa**');

console.log('\n═══ 10. IDEAS NO ES NOTAS, Y NO ES UNA LISTA DE TAREAS ═══\n');

ok(DIFERENCIA_IDEAS.nota && DIFERENCIA_IDEAS.idea && DIFERENCIA_IDEAS.ejemplo,
  '⚠️ la diferencia está escrita, con su ejemplo');
ok(/DIFERENCIA_IDEAS\.ejemplo/.test(VISTA), '🚨 y la pantalla la ENSEÑA: el enunciado la llama fundamental');
ok(!/apuntes/.test(sinComentarios(LIB)),
  '🚨 y no escribe ni lee `biblioteca.apuntes`: son dos listas y dos finalidades');
ok(/TarjetaIdea/.test(VISTA) && !/ListRow/.test(VISTA.slice(VISTA.indexOf('function TarjetaIdea'), VISTA.indexOf('function FormularioIdea'))),
  '⚠️ y se pinta como una FICHA, no como una fila: *"no convertirlo en una lista de tareas"*');
eq(textoDeIdea(crearIdea({ descripcion: 'x'.repeat(200) })).endsWith('…'), true, '⚠️ un texto largo se recorta');
eq(textoDeIdea(null), '', 'y sin idea, nada');

console.log('\n═══ 11. LO QUE ESTA FASE NO HACE ═══\n');

ok(NO_EN_IDEAS.length >= 5 && NO_EN_IDEAS.every((x) => x.que && x.llega), '⚠️ cada cosa con su fase');
ok(NO_EN_IDEAS.some((x) => /IA generativa/.test(x.que)), '🚨 sin IA generativa');
ok(NO_EN_IDEAS.some((x) => /votación/.test(x.que)), '🚨 sin votaciones');
ok(NO_EN_IDEAS.some((x) => /redes sociales/.test(x.que)), '🚨 ni nada de redes sociales');
ok(!/askAI|ask-ai/i.test(sinComentarios(LIB)), '🚨 y la librería no llama a la IA por ningún sitio');
ok(!/fetch\(|XMLHttpRequest/.test(sinComentarios(LIB)), '⚠️ ni sale a la red');
ok(/createPortal\(contenido, document\.body\)/.test(VISTA), '⚠️ y el detalle sale por `createPortal` (regla 3)');
ok(/aria-label="Cerrar el detalle de la idea"/.test(VISTA), '⚠️ con su botón de cerrar con nombre');

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
