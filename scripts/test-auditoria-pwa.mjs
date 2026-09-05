// ============================================================================
// ENTREGA 3 · FASE 15 (HC F10) — PWA, iPHONE, SINCRONIZACIÓN Y AUDITORÍA FINAL
//
// 🚨 **Cierra el bloque Hoy y Calendario**, así que su trabajo es comprobar, no
// construir. Y comprobar de verdad: cada cosa se lee **del archivo real**, nunca
// de una casilla puesta a mano — *"las casillas de la condición de finalización
// se CALCULAN"* (EH F64).
//
// ⏸ **Y tres apartados siguen sin poderse cumplir** (11, 13 y 14), por el mismo
// motivo de siempre: falta la pieza que se queda funcionando en segundo plano, y
// el último que escribe gana. Están en `LO_QUE_DECIDE_JOSUE`, no fingidos.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COMPROBACIONES_PWA, comprobacionPWA, CAMPOS_MANIFIESTO, revisarManifiesto,
  PIEZAS_IPHONE, revisarIPhone, revisarViewport,
  OPERACIONES_RLS, POLITICA_PERMISIVA, sinComentariosSQL, revisarAislamientoPWA,
  LO_QUE_DECIDE_JOSUE, decideJosue, condicionHC, loQueFalla, NO_EN_LA_AUDITORIA,
} from '../src/lib/auditoriaPWA.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');

const MANIFIESTO = JSON.parse(leer('public/manifest.json'));
const HTML = leer('index.html');
const CSS = leer('src/index.css');
const SQL = leer('supabase/schema.sql');

console.log('\n═══ 1. LA AUDITORÍA LEE ARCHIVOS DE VERDAD (EH F45 y F48) ═══\n');

ok(COMPROBACIONES_PWA.every((c) => c.archivo && c.apartado),
  '⚠️ cada comprobación dice de qué archivo sale y a qué apartado responde');
ok(COMPROBACIONES_PWA.every((c) => { try { return leer(c.archivo).length > 0; } catch { return false; } }),
  '🚨 y TODOS esos archivos existen: una auditoría que no lee nada da siempre un aprobado');
eq(comprobacionPWA('inventada'), null, 'una comprobación que no existe no se inventa');

console.log('\n═══ 2. EL MANIFIESTO (apartados 3 y 4) ═══\n');

eq(revisarManifiesto(MANIFIESTO), [],
  '🚨 el manifiesto de VERDAD está completo, sin nada que falte');
ok(CAMPOS_MANIFIESTO.every((c) => MANIFIESTO[c]), '⚠️ con los siete campos del apartado 3');
eq(MANIFIESTO.display, 'standalone', '⚠️ se abre como aplicación, no como pestaña');
eq(MANIFIESTO.start_url, '/',
  '⚠️ y la ruta de inicio es la única que existe: *"no crear rutas inexistentes"*');
ok(MANIFIESTO.icons.some((i) => i.sizes === '192x192') && MANIFIESTO.icons.some((i) => i.sizes === '512x512'),
  '⚠️ los dos tamaños del apartado 4');
ok(MANIFIESTO.icons.some((i) => String(i.purpose || '').includes('maskable')),
  '🚨 y uno recortable: sin él, en Android el icono sale con un borde blanco (apartado 4)');
ok(MANIFIESTO.orientation, '⚠️ con su orientación (apartado 2)');

// 🚨 El revisor tiene que poder fallar (EH F42).
ok(revisarManifiesto({}).length > 0, '🚨 un manifiesto vacío SÍ da problemas: el revisor puede fallar');
ok(revisarManifiesto(null).length === 1, 'y uno ilegible también');
ok(revisarManifiesto({ ...MANIFIESTO, display: 'browser' }).some((p) => p.campo === 'display'),
  '🚨 caza un `display` que abriría en una pestaña');
ok(revisarManifiesto({ ...MANIFIESTO, start_url: '/hoy' }).some((p) => p.campo === 'start_url'),
  '🚨 y una ruta que no existe (apartado 3)');
ok(revisarManifiesto({ ...MANIFIESTO, icons: MANIFIESTO.icons.filter((i) => i.purpose !== 'maskable') })
  .some((p) => /recortable/.test(p.que)),
  '🚨 y la falta del icono recortable');

console.log('\n═══ 3. EL iPHONE (apartados 6, 7 y 8) ═══\n');

eq(revisarIPhone(CSS), [],
  '🚨 las seis piezas de la Safe Area siguen en `index.css` — si una fase futura las borra, esto salta');
ok(PIEZAS_IPHONE.every((p) => p.que), '⚠️ y cada una explica para qué sirve');
ok(PIEZAS_IPHONE.some((p) => p.id === 'nav_segura'),
  '⚠️ incluida la barra inferior: *"no colocar controles debajo del área segura"* (apartado 8)');
ok(revisarIPhone('').length === PIEZAS_IPHONE.length, '🚨 y con un CSS vacío falla todo: el revisor puede fallar');

eq(revisarViewport(HTML), [],
  '🚨 el `index.html` de verdad tiene lo que el iPhone necesita');
ok(/viewport-fit=cover/.test(HTML),
  '🚨 con `viewport-fit=cover`: sin eso las zonas seguras valen CERO y todo lo anterior sobra (apartado 7)');
ok(/apple-touch-icon/.test(HTML),
  '🚨 y su icono: sin él, al añadirlo a la pantalla de inicio Safari usa una captura de la página (apartado 4)');
ok(/apple-mobile-web-app-capable/.test(HTML), '⚠️ y se abre a pantalla completa desde el icono (apartado 6)');
ok(revisarViewport('<html></html>').length === 3, '🚨 y un html pelado falla las tres: el revisor puede fallar');

console.log('\n═══ 4. CADA USUARIO SOLO VE LO SUYO (apartados 15, 16 y 17) ═══\n');

eq(revisarAislamientoPWA(SQL), [],
  '🚨 las cuatro políticas de `app_data` están atadas al usuario, y ninguna es permisiva');
eq(OPERACIONES_RLS, ['select', 'insert', 'update', 'delete'], '⚠️ las cuatro operaciones');
ok(POLITICA_PERMISIVA.test('auth.uid() IS NOT NULL'),
  '🚨 y se reconoce la permisiva, que dejaría a cualquiera leer la fila de cualquiera');
ok(revisarAislamientoPWA('create policy x on app_data for select using (auth.uid() is not null);')
  .some((p) => /permisiva/.test(p.que)),
  '🚨 el revisor la CAZA: una comprobación que no reconoce lo que busca es peor que no tenerla (EH F43)');
ok(revisarAislamientoPWA('').length >= 4, 'y sin políticas falla las cuatro');

// ⚠️ Undécima vez de la lección: el SQL explica en un comentario que ninguna
// política es permisiva, y buscar esa frase entera saltaba con ella.
ok(!POLITICA_PERMISIVA.test(sinComentariosSQL(SQL)),
  '⚠️ y se lee el SQL SIN comentarios: el archivo explica en uno que no hay ninguna permisiva');
ok(sinComentariosSQL('-- auth.uid() is not null\nselect 1;').includes('select 1'),
  '⚠️ el limpiador quita los comentarios y deja el código');

console.log('\n═══ 5. LO QUE SIGUE SIN PODERSE (apartados 11, 13 y 14) ═══\n');

eq(LO_QUE_DECIDE_JOSUE.map((x) => x.id), ['service_worker', 'sincronizacion', 'endpoint_ia'],
  '⏸ las tres cosas que no se pueden cerrar desde aquí');
ok(LO_QUE_DECIDE_JOSUE.every((x) => x.decide === 'Josué' && x.porque && x.riesgo),
  '🚨 las tres las decide ÉL, con su motivo y **su riesgo escrito**: no son tareas pendientes mías');
ok(/versión vieja|congelada/.test(decideJosue('service_worker').riesgo),
  '🚨 y el riesgo del service worker está dicho: mal configurado deja la app congelada en una versión vieja — a este proyecto YA le pasó algo así');
ok(/último que escribe|último que se guardó/.test(decideJosue('sincronizacion').riesgo),
  '⚠️ y el de la sincronización: hoy gana el último que escribe (EH F41, F45, F46 y F54)');
ok(/gastar dinero/.test(decideJosue('endpoint_ia').riesgo),
  '⚠️ y el del endpoint de la IA, que viene de EH F63');
eq(decideJosue('inventada'), null, 'y algo que no está declarado no se inventa');

console.log('\n═══ 6. LA CONDICIÓN DE FINALIZACIÓN SE CALCULA (EH F64) ═══\n');

const casillas = condicionHC({ manifiesto: MANIFIESTO, html: HTML, css: CSS, sql: SQL });
eq(casillas.length, 4, 'cuatro casillas');
ok(casillas.every((c) => c.nombre), 'cada una con su nombre');
eq(loQueFalla(casillas), [],
  '🚨 LAS CUATRO ESTÁN VERDES, y verdes porque se han comprobado contra los archivos de verdad');

// 🚨 Y si algo se rompe, se pone roja: no es una casilla decorativa.
const rotas = condicionHC({ manifiesto: {}, html: '', css: '', sql: '' });
eq(rotas.filter((c) => c.ok).length, 0,
  '🚨 con todo vacío, las cuatro en rojo: *"no las pongas a `true` a mano — si una está roja, es que lo está"* (EH F64)');
ok(rotas.every((c) => c.problemas.length > 0), 'y cada una dice qué le falta');

console.log('\n═══ 7. NI UNA FUNCIÓN NUEVA, NI IA ═══\n');

ok(NO_EN_LA_AUDITORIA.length >= 4 && NO_EN_LA_AUDITORIA.every((x) => x.porque),
  '⚠️ lo que esta fase no hace, con su motivo');
ok(NO_EN_LA_AUDITORIA.some((x) => /IA/.test(x.que)),
  '🚨 sin IA: el enunciado lo prohíbe expresamente');
ok(NO_EN_LA_AUDITORIA.some((x) => /planificación/.test(x.que)),
  '🚨 y sin funcionalidades nuevas de planificación: *"esta fase es de estabilización"*');
ok(NO_EN_LA_AUDITORIA.some((x) => /sin conexión/.test(x.que)),
  '⚠️ y sin prometer edición sin conexión (apartado 12)');

const LIB = leer('src/lib/auditoriaPWA.js')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
ok(!/askAI|ask-ai/i.test(LIB), '🚨 y no llama a la IA por ningún sitio');
ok(!/saveData\(|supabase\./i.test(LIB), '🚨 ni guarda nada: lee y comprueba');
ok(!/navigator\.serviceWorker\.register/.test(LIB),
  '🚨 y NO registra un service worker: está declarado como decisión de Josué, con su riesgo');

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
