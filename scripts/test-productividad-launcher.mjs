// ============================================================================
// ENTREGA 3 · FASE 23 (PR F1) — PRODUCTIVIDAD COMO LANZADOR DE MINI-APPS
//
// Los 12 puntos del criterio de éxito, y las tres cosas que decidieron cómo se
// construye:
//
//   1. Las seis mini-apps YA EXISTÍAN. No se crea ni una lista nueva.
//   2. Objetivos deja de ser un módulo, pero sus DATOS no se mueven — y los
//      cinco sitios que llevaban allí siguen llegando, porque el destino era
//      UNA constante.
//   3. Esta fase NO desarrolla ninguna de las seis: es la pantalla y la
//      navegación. El enunciado lo pide en mayúsculas.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MINI_APPS_PR, miniAppPR, IDS_MINI_APPS_PR,
  MAPEO_EXISTENTE_PR, NINGUNA_ES_NUEVA,
  OBJETIVOS_INTEGRACION, LO_QUE_HEREDA_DE_PRODUCTIVIDAD,
  elementosDePR, pomodorosDeHoy, contarPR, indicadorDePR, totalProductividad,
  CLASE_TARJETA_PR, retrasoDeTarjetaPR, RETRASO_CASCADA_PR_MS,
  NIVELES_PR, nivelPR, atrasPR, destinoPR,
  PARA_HOY, HOY_NO_SE_TOCA, NO_EN_PR1,
  DONDE_SE_GUARDA_PR, AISLAMIENTO_PR,
  condicionPR1, pr1Terminada,
} from '../src/lib/productividad.js';
import { DESTINO_OBJETIVOS, FOCO_OBJETIVOS } from '../src/lib/objetivosEnEstiloHombre.js';
import { CATALOGO_PAPELERA } from '../src/lib/papelera.js';
import { DEFAULT_PRODUCTIVIDAD, DEFAULT_OBJETIVOS } from '../src/tokens.js';
import { PALABRAS_MODULOS, SINONIMOS_MODULOS, ACCIONES_DIRECTAS } from '../src/lib/indiceBusqueda.js';
import { todayISO } from '../src/lib/helpers.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const soloCodigo = (s) => sinComentarios(s).replace(/'[^']*'|"[^"]*"|`[^`]*`/g, "''");

const LIB = leer('src/lib/productividad.js');
const LIB_CODIGO = soloCodigo(LIB);
const VISTA = leer('src/views/ProductivityView.jsx');
const VISTA_LIMPIA = sinComentarios(VISTA);
const APP = leer('src/App.jsx');
const APP_LIMPIA = sinComentarios(APP);
const OBJETIVOS_VISTA = leer('src/views/ObjectivesView.jsx');

const HOY = todayISO();
const datos = {
  productividad: {
    habitos: [{ id: 'h1', nombre: 'Leer' }],
    rutinas: [],
    tareas: [{ id: 't1', texto: 'Estudiar', hecha: false }, { id: 't2', texto: 'Hecha', hecha: true }],
    metas: [{ id: 'm1', texto: 'Correr 5k' }],
    pomodoros: { [HOY]: 2 },
    apuntes: [],
  },
  objetivos: { lista: [{ id: 'o1', texto: 'Aprender inglés', plazo: '1 año', cumplido: false }], ultimaRevision: null },
};
const vacio = { productividad: DEFAULT_PRODUCTIVIDAD, objetivos: DEFAULT_OBJETIVOS };

console.log('\n═══ 1. SEIS MINI-APPS, NI UNA MÁS ═══\n');

eq(IDS_MINI_APPS_PR, ['habitos', 'pomodoro', 'tareas', 'metas', 'objetivos', 'rutinas'],
  'las seis del enunciado, en su orden');
eq(MINI_APPS_PR.length, 6, '🚨 exactamente seis: *"No crear una séptima aplicación"*');
eq(new Set(IDS_MINI_APPS_PR).size, 6, '⚠️ y sin repetidas');
ok(MINI_APPS_PR.every((m) => !!m.icono && !!m.emoji && !!m.descripcion && !!m.nombre),
  '🚨 cada una con identidad propia: icono, emoji, nombre y descripción (criterio 3)');
eq(miniAppPR('habitos').descripcion, 'Construye constancia cada día.', 'la descripción literal de Hábitos');
eq(miniAppPR('pomodoro').descripcion, 'Concéntrate sin distracciones.', 'la de Pomodoro');
eq(miniAppPR('tareas').descripcion, 'Organiza lo que tienes que hacer.', 'la de Tareas');
eq(miniAppPR('metas').descripcion, 'Convierte tus planes en resultados.', 'la de Metas');
eq(miniAppPR('objetivos').descripcion, 'Define hacia dónde quieres avanzar.', 'la de Objetivos');
eq(miniAppPR('rutinas').descripcion, 'Convierte tus acciones en rutina.', 'la de Rutinas');
eq(miniAppPR('inventada'), null, '⚠️ y una que no existe, no existe');
ok(MINI_APPS_PR.every((m) => !!m.fase), '⚠️ y cada una dice en qué fase se desarrolla');

console.log('\n═══ 2. NINGUNA DE LAS SEIS ES NUEVA ═══\n');

ok(NINGUNA_ES_NUEVA, '🚨 **las seis ya existían**: esta fase no crea ni una lista');
eq(MAPEO_EXISTENTE_PR.length, 6, '⚠️ y está declarado dónde vivía cada una');
ok(MINI_APPS_PR.every((m) => m.nueva === false), '⚠️ ninguna se marca como nueva');
eq(MAPEO_EXISTENTE_PR.find((m) => m.app === 'objetivos').clave, 'objetivos.lista',
  '🚨 Objetivos venía de un módulo aparte, con su propia clave');
ok(MAPEO_EXISTENTE_PR.filter((m) => m.app !== 'objetivos').every((m) => m.clave.startsWith('productividad.')),
  '⚠️ y las otras cinco eran pestañas de Productividad');
ok(!/DEFAULT_[A-Z]/.test(LIB_CODIGO), '🚨 y no se declara ningún almacén nuevo');
/* ⚠️ **Una cuenta exacta de llaves en una prueba es una bomba de relojería**
   (EH F21 y EH F23): esto comprobaba que las claves fueran EXACTAMENTE seis, y
   saltó en cuanto la E3 F25 añadió las tres de Pomodoro **con todo el derecho**.
   Lo que hay que comprobar es que **sigan estando las que tenían que estar**, no
   cuántas hay. */
ok(['apuntes', 'habitos', 'metas', 'pomodoros', 'rutinas', 'tareas'].every((k) => k in DEFAULT_PRODUCTIVIDAD),
  '⚠️ las listas de `productividad` que ya existían siguen todas ahí: esta fase no se lleva ninguna');
eq(Object.keys(DEFAULT_OBJETIVOS).sort(), ['lista', 'ultimaRevision'],
  '⚠️ ni la de `objetivos`');

console.log('\n═══ 3. OBJETIVOS DEJA DE SER UN MÓDULO ═══\n');

/* 🚨 Criterio 9: *"Objetivos ya no aparece como módulo independiente fuera de
   Productividad"*. Se comprueba en el código de verdad, no en una declaración. */
ok(!/\{ id: 'objetivos', label: 'Objetivos'/.test(APP_LIMPIA),
  "🚨 `objetivos` ya NO está en `MORE_NAV`: deja de ser un apartado");
ok(!/'productividad', 'rachas', 'objetivos'/.test(APP_LIMPIA),
  '🚨 ni en el área Vida de `AREAS_NAV`');
ok(!/case 'objetivos':/.test(APP_LIMPIA),
  '🚨 y su `case` ha desaparecido del switch: no hay pantalla suya fuera de Productividad');
ok(!/import ObjectivesView/.test(APP_LIMPIA),
  '⚠️ `App.jsx` ya ni la importa: quien la pinta es Productividad');
ok(/import ObjectivesView/.test(sinComentarios(VISTA)),
  '⚠️ y Productividad sí');
ok(/<ObjectivesView/.test(VISTA_LIMPIA), '🚨 que la monta como una de sus seis mini-apps');
eq(miniAppPR('objetivos').vieneDeFuera, true, '⚠️ y el catálogo declara que viene de fuera');

console.log('\n═══ 4. …PERO SUS DATOS NO SE MUEVEN ═══\n');

eq(miniAppPR('objetivos').de, 'objetivos', '🚨 la mini-app sigue leyendo de la clave `objetivos`');
eq(miniAppPR('objetivos').coleccion, 'lista', '⚠️ y de su lista de siempre');
ok(!!CATALOGO_PAPELERA['objetivos.lista'],
  '🚨 el catálogo de la papelera sigue intacto: borrar y restaurar un objetivo funciona igual');
eq(CATALOGO_PAPELERA['objetivos.lista'].modulo, 'objetivos', '⚠️ con su módulo de datos de siempre');
eq(OBJETIVOS_INTEGRACION.cambia.length, 3, 'tres cosas cambian, y están escritas');
eq(OBJETIVOS_INTEGRACION.noCambia.length, 4, 'y cuatro no cambian, también escritas');
ok(/papelera/i.test(OBJETIVOS_INTEGRACION.noCambia.join(' ')), '⚠️ entre ellas la papelera');
ok(/objetivoId/.test(OBJETIVOS_INTEGRACION.noCambia.join(' ')),
  '🚨 y el `objetivoId` que escriben EH F28 y EH F39: moverlos lo habría roto');
ok(OBJETIVOS_INTEGRACION.porQueNoSeMuevenLosDatos.length > 60, '⚠️ con el motivo entero');
ok(/saveData\(uidUser, 'objetivos'/.test(APP_LIMPIA),
  '🚨 y `App.jsx` sigue guardando en la clave `objetivos`: ni un dato se mueve');

/* ⚠️ Y lo que sí se pierde, dicho: al dejar de ser un módulo, hereda el PIN y el
   interruptor de Productividad. Es la consecuencia, no un descuido. */
eq(LO_QUE_HEREDA_DE_PRODUCTIVIDAD.length, 3, 'tres cosas que hereda de Productividad, declaradas');
ok(LO_QUE_HEREDA_DE_PRODUCTIVIDAD.every((x) => x.antes && x.ahora), '⚠️ con el antes y el después de cada una');

console.log('\n═══ 5. Y LOS CINCO ENLACES QUE LLEVABAN ALLÍ SIGUEN LLEGANDO ═══\n');

eq(DESTINO_OBJETIVOS, 'productividad',
  '🚨 `DESTINO_OBJETIVOS` apunta ahora a Productividad — **una línea redirige los cinco sitios**');
eq(FOCO_OBJETIVOS, { app: 'objetivos' },
  '🚨 y lleva el foco que abre la mini-app: sin él aterrizaría en el lanzador');
const accionObjetivo = ACCIONES_DIRECTAS.find((a) => a.id === 'accion:objetivo');
eq(accionObjetivo.tab, 'productividad', '⚠️ la acción "Crear un objetivo" del buscador también');
eq(accionObjetivo.foco.app, 'objetivos', '⚠️ con su foco');
eq(accionObjetivo.foco.accion, 'nuevo', '⚠️ y sin perder el que ya tenía, el que abre el formulario');
ok(!PALABRAS_MODULOS.objetivos && !SINONIMOS_MODULOS.objetivos,
  '⚠️ `objetivos` ya no es un módulo del buscador');
ok(PALABRAS_MODULOS.productividad.includes('objetivos'),
  '🚨 **pero sus palabras se han mudado**: buscar "objetivos" sigue encontrándolos (D2-07)');
for (const p of ['propositos', 'retos', 'conseguir']) {
  ok(PALABRAS_MODULOS.productividad.includes(p), `⚠️ y "${p}" también`);
}
for (const p of ['objetivo', 'ambicion', 'lograr', 'progreso']) {
  ok(SINONIMOS_MODULOS.productividad.includes(p), `⚠️ y el sinónimo "${p}"`);
}
ok(/FOCO_OBJETIVOS/.test(sinComentarios(leer('src/views/EstiloHombreView.jsx'))),
  '🚨 y los dos botones de Imagen personal llevan el foco: si no, EH F28 aterrizaría en el lanzador');

/* 🐛 **Y un fallo latente que esta fase destapó.** El tercer argumento de `paso()`
   en `integracionEstilo.js` es **el sistema global donde se escribe**, no a dónde
   se navega — y se le estaba pasando `DESTINO_OBJETIVOS`. Nadie lo notó porque
   valían lo mismo: hasta ahora Objetivos era a la vez la clave de datos y el
   módulo al que ir. Al separarse los dos valores, saltó. */
ok(/paso\('objetivos', 'Objetivos', MODULO_OBJETIVOS,/.test(sinComentarios(leer('src/lib/integracionEstilo.js'))),
  '🐛 el puente declara la CLAVE donde escribe, no a dónde navega: eran lo mismo y dejaron de serlo');

console.log('\n═══ 6. LOS INDICADORES SALEN DE DATOS REALES ═══\n');

eq(indicadorDePR('habitos', datos), '1 hábito', 'un hábito, en singular');
eq(indicadorDePR('metas', datos), '1 meta', 'una meta');
eq(indicadorDePR('objetivos', datos), '1 objetivo', '🚨 y el objetivo, leído de SU clave');
eq(indicadorDePR('tareas', datos), '1 tarea',
  '🚨 de Tareas se enseñan las PENDIENTES: una lista con doscientas hechas no dice 201');
eq(indicadorDePR('pomodoro', datos), '2 sesiones hoy',
  '🚨 y Pomodoro NO es una lista: es un contador por día desde la Fase 6');
eq(indicadorDePR('rutinas', datos), null,
  '🚨 **una mini-app vacía no enseña un cero**: devuelve `null` y no se pinta (*"no inventar datos"*)');
ok(MINI_APPS_PR.every((m) => indicadorDePR(m.id, vacio) === null),
  '⚠️ y con todo vacío, ninguna enseña nada');
eq(pomodorosDeHoy(datos, HOY), 2, 'las sesiones de hoy se leen del mapa por día');
eq(pomodorosDeHoy(datos, '1999-01-01'), 0, '⚠️ y un día sin sesiones son cero');
eq(pomodorosDeHoy({}, HOY), 0, '⚠️ y sin datos, cero');
eq(totalProductividad(datos), 6, 'el total suma lo que hay de verdad');
eq(totalProductividad(vacio), 0, '⚠️ y con todo vacío, cero');
eq(elementosDePR('inventada', datos), [], '⚠️ una mini-app que no existe no tiene elementos');
eq(elementosDePR('habitos', {}), [], '⚠️ ni sin datos');
ok(!/[^a-zA-Z]72\b|\b100 ?%/.test(LIB_CODIGO),
  '🚨 y ni una cifra inventada en la librería: *"NO inventar datos ni crear lógica falsa"*');

console.log('\n═══ 7. ESTA FASE NO DESARROLLA NINGUNA DE LAS SEIS ═══\n');

/* 🚨 *"EN ESTA FASE NO DESARROLLES TODAVÍA LA LÓGICA INTERNA COMPLETA DE LAS 6
   MINI-APPS."* La comprobación honesta: la vista sigue usando los mismos
   componentes de antes, no unos nuevos. */
for (const tab of ['HabitosTab', 'RutinasTab', 'PomodoroTab', 'TareasTab', 'MetasTab']) {
  ok(new RegExp(`<${tab}\\b`).test(VISTA_LIMPIA), `⚠️ ${tab} se reutiliza tal cual, no se ha reescrito`);
}
ok(/<ObjectivesView/.test(VISTA_LIMPIA),
  '⚠️ y Objetivos se pinta con SU pantalla de siempre, sin tocarla');
ok(!/function HabitosTab2|function NuevoPomodoro|function GestorTareas/.test(VISTA),
  '🚨 y no hay ni una versión nueva de las que ya existen');
eq(NO_EN_PR1.length >= 7, true, 'lo que no se hace está declarado, con la fase en que llega');
ok(NO_EN_PR1.every((x) => x.que && x.llega), '⚠️ cada línea dice qué y cuándo');
for (const palabra of ['hábitos', 'Pomodoro', 'tareas', 'metas', 'rutinas', 'IA']) {
  ok(NO_EN_PR1.some((x) => new RegExp(palabra, 'i').test(x.que)), `⚠️ ${palabra} está declarado`);
}
ok(!/askAI|ask-ai|anthropic/i.test(LIB_CODIGO), '🚨 sin IA de productividad (el enunciado la prohíbe)');
ok(!/new Notification|notificaciones\.js/.test(LIB_CODIGO), '🚨 y sin notificaciones ni recordatorios');

console.log('\n═══ 8. HOY QUEDA PREPARADO, NO CONSTRUIDO ═══\n');

eq(HOY_NO_SE_TOCA.construido, false,
  '🚨 *"NO desarrollar todavía todo el sistema de Inicio/Hoy"*');
eq(PARA_HOY.length, 6, 'pero está declarado qué podrá decir cada mini-app');
ok(PARA_HOY.every((x) => x.podraDecir && x.saldriaDe && x.llega),
  '⚠️ con de dónde saldría el dato y en qué fase llega');
ok(PARA_HOY.every((x) => IDS_MINI_APPS_PR.includes(x.app)), '⚠️ una por mini-app, sin inventar ninguna');
ok(!/Te quedan \d|tareas pendientes'|72 ?%/.test(LIB_CODIGO),
  '🚨 y NI UNA frase escrita para Hoy: escribirla hoy sería fingir una función que no existe (regla 8)');
ok(/hoy\.js/.test(HOY_NO_SE_TOCA.porQue),
  '⚠️ y se dice que cuando toque se llama a `hoy.js` (HT F6), no se escribe un segundo Hoy');

console.log('\n═══ 9. NAVEGACIÓN Y ANIMACIONES ═══\n');

eq(NIVELES_PR.map((x) => x.id), ['lanzador', 'miniApp'], 'dos niveles: el lanzador y una mini-app');
eq(atrasPR('miniApp'), 'lanzador', 'de una mini-app se vuelve al lanzador');
eq(atrasPR('lanzador'), 'lanzador',
  '🚨 **`atras()` nunca devuelve `null`** (EH F37): de la raíz se vuelve a la raíz');
eq(atrasPR('inventado'), 'lanzador', '⚠️ y un nivel que no existe tampoco deja a nadie en el vacío');
ok(NIVELES_PR.every((x) => !!nivelPR(x.id)), '⚠️ los dos se pueden consultar');
eq(destinoPR('tareas'), { modulo: 'productividad', app: 'tareas' }, 'el destino de una mini-app');
eq(destinoPR('objetivos', { accion: 'nuevo' }), { modulo: 'productividad', app: 'objetivos', accion: 'nuevo' },
  '⚠️ con el extra que le pasen');
eq(destinoPR('inventada'), null, '⚠️ y una que no existe no tiene destino');
ok(/aria-label="Volver a Productividad"/.test(VISTA),
  '⚠️ *"cada una debe tener botón para volver"*, y dice a dónde vuelve');

eq(CLASE_TARJETA_PR, 'hub-card',
  '🚨 la cascada es `.hub-card`, la que ya usan los hubs y la Biblioteca: escribir una segunda se vería distinta');
eq(retrasoDeTarjetaPR(0), '0ms', 'la primera tarjeta entra sin retardo');
eq(retrasoDeTarjetaPR(3), `${RETRASO_CASCADA_PR_MS * 3}ms`, '⚠️ y las siguientes escalonadas');
eq(retrasoDeTarjetaPR(-5), '0ms', '⚠️ y un índice negativo no da un retardo negativo');
ok(!/animation:|@keyframes/.test(VISTA),
  '⚠️ y ninguna animación se escribe en la vista: van a `index.css`, así respetan "Reducir movimiento" solas (E3 F14)');

console.log('\n═══ 10. LOS ICONOS SON LA OTRA MITAD DEL CATÁLOGO ═══\n');

const iconosEnVista = (VISTA.match(/const ICONOS_MINI_APP_PR = \{([^}]*)\}/) || [, ''])[1];
ok(MINI_APPS_PR.every((m) => iconosEnVista.includes(m.icono)),
  '🚨 **TODOS los iconos del catálogo están en `ICONOS_MINI_APP_PR`**: uno que falte sale como un hueco y no falla en ninguna parte');
ok(!/from 'lucide-react'/.test(LIB),
  '⚠️ y la librería no importa React: los datos aquí, los componentes en la vista');
ok(!/[\u{1F300}-\u{1FAFF}]/u.test(LIB_CODIGO),
  '⚠️ y los emojis viven en los datos, no en el código');

console.log('\n═══ 11. NI UNA TABLA NUEVA, NI UN DATO MOVIDO ═══\n');

eq(AISLAMIENTO_PR.tablasNuevas, 0, '🚨 ni una tabla nueva que asegurar');
eq(AISLAMIENTO_PR.claves, ['productividad', 'objetivos'], '⚠️ las dos claves de siempre');
ok(/auth\.uid\(\) = user_id/.test(AISLAMIENTO_PR.politicas),
  '⚠️ y el aislamiento es de la base de datos (EH F43)');
eq(DONDE_SE_GUARDA_PR.filter((d) => d.nuevo).length, 0, '⚠️ y todo se guarda donde ya se guardaba');
ok(!/create table|create policy/i.test(LIB), '⚠️ esta fase no trae SQL');
ok(!/saveData|supabase|localStorage/.test(LIB_CODIGO),
  '🚨 y la librería no guarda nada: quien escribe sigue siendo `App.jsx`');

console.log('\n═══ 12. NO SE HA ROTO NADA ═══\n');

ok(/sinTitulo/.test(OBJETIVOS_VISTA),
  '⚠️ `ObjectivesView` acepta `sinTitulo`: su nombre ya lo pone la cabecera y repetirlo es el fallo de *Fondo* que vio Josué');
ok(/onAddObjetivo|onUpdateObjetivo|onDeleteObjetivo/.test(APP_LIMPIA),
  '🚨 y `App.jsx` le pasa a Productividad los manejadores de objetivos — sin eso, crear uno no guardaría nada y nadie lo vería');
ok(/objetivos=\{objetivos\}/.test(APP_LIMPIA), '⚠️ y la lista');
ok(/onRevisionHecha/.test(VISTA_LIMPIA), '⚠️ y la revisión periódica sigue conectada');
ok(/foco\?\.app \|\| foco\?\.sub/.test(VISTA_LIMPIA),
  '🚨 y se aceptan LOS DOS focos: quitar `foco.sub` habría roto en silencio la acción rápida "+ Tarea" del Dashboard');

console.log('\n═══ 13. LA CONDICIÓN DE FINALIZACIÓN, CALCULADA ═══\n');

const cond = condicionPR1(datos);
eq(cond.length, 10, 'diez casillas, una por criterio comprobable');
eq(cond.filter((c) => !c.ok).map((c) => c.id), [], '🚨 y las diez en verde');
ok(pr1Terminada(datos), '🚨 la fase está terminada con datos de verdad');
ok(pr1Terminada(vacio), '⚠️ y con todo vacío: la condición es del sistema, no de sus datos');
ok(!/ok: true,/.test(LIB_CODIGO.replace(/existe: true|vieneDeFuera: true|porDia: true|soloPendientes: true/g, '')),
  '🚨 y ninguna casilla está puesta a `true` a mano: todas se calculan (E3 F15, EH F64)');

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos\n`);
process.exit(fallos === 0 ? 0 : 1);
