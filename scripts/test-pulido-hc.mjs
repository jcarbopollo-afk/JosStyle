// ============================================================================
// ENTREGA 3 · FASE 14 (HC F9) — PULIDO VISUAL, UX Y ANIMACIONES
//
// 🚨 **El enunciado acota la fase en su primera línea:** *"NO rediseñar módulos
// que no estén relacionados con este sistema. NO añadir funcionalidades nuevas
// innecesarias. El objetivo es pulir lo existente, no cambiar su lógica."*
//
// Así que esto **no rediseña nada**: declara qué tiene que cumplir cada pantalla
// del bloque y lo comprueba **leyendo el código**, como `revisarPantalla()` en
// EH F42. Una regla escrita en un comentario se olvida; una que se ejecuta en
// cada `verificar.sh`, no.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PANTALLAS_HC, pantallaHC,
  ESQUELETOS, esqueleto, MAX_ESQUELETO_MS,
  VACIOS_HC, vacioHC, vacioDeHoy,
  TEXTOS_ERROR_HC, PALABRAS_TECNICAS, sinPalabrasTecnicas,
  MAX_ANIMACION_MS, ANIMACIONES_HC, animacionHC, animacionesLargas,
  REGLAS_PULIDO, reglaPulido, revisarPulido, sinComentariosNiReglas,
  YA_PULIDO, NO_EN_EL_PULIDO,
} from '../src/lib/pulidoHC.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
const sinComentarios = (t) => t
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\s*\}/g, '');

console.log('\n═══ 1. LAS PANTALLAS DEL BLOQUE, Y SOLO ESAS (apartados 1 a 6) ═══\n');

eq(PANTALLAS_HC.map((p) => p.id), ['hoy', 'agenda', 'calendario', 'semana', 'stats'],
  '⚠️ las cinco del bloque: *"NO rediseñar módulos que no estén relacionados con este sistema"*');
ok(PANTALLAS_HC.every((p) => p.pregunta && p.archivo),
  '⚠️ y cada una dice qué pregunta contesta y dónde vive');
ok(PANTALLAS_HC.every((p) => { try { return leer(p.archivo).length > 0; } catch { return false; } }),
  '🚨 y los archivos EXISTEN: declarar una pantalla inventada haría que nadie la revisara');
eq(pantallaHC('armario'), null, '⚠️ y un módulo de fuera no está: esta fase no lo toca');

console.log('\n═══ 2. LOS ESQUELETOS DE CARGA (apartados 23 y 24) ═══\n');

eq(ESQUELETOS.map((e) => e.id), ['hoy', 'agenda', 'calendario', 'semana', 'stats'],
  '⚠️ uno por pantalla, como pide el apartado 24');
ok(ESQUELETOS.every((e) => e.alturas.length === e.cards),
  '⚠️ y las alturas cuadran con el número de cards');
ok(ESQUELETOS.every((e) => e.porque),
  '🚨 cada uno dice A QUÉ se parece: *"deben respetar la forma real de las cards"* — si no, habría un salto al cargar (apartado 21)');
ok(ESQUELETOS.every((e) => e.alturas.every((a) => a > 30 && a < 400)),
  '⚠️ con alturas de una card de verdad, ni una raya ni media pantalla');
eq(esqueleto('inventado'), null, 'y un esqueleto que no existe no se inventa');
ok(MAX_ESQUELETO_MS > 0 && MAX_ESQUELETO_MS <= 15000,
  '⚠️ y hay un tope: un esqueleto eterno es peor que no tenerlo — pasado el tope toca el texto de error');

// 🚨 Lo que de verdad arregla esta fase.
const APP = leer('src/App.jsx');
ok(/<Esqueleto/.test(APP),
  '🚨 la pantalla de carga YA NO es una rueda sobre un fondo liso: dibuja la forma de Hoy (apartado 23)');
ok(!/LoadingScreen[\s\S]{0,300}Loader2 className="animate-spin"/.test(APP),
  '🚨 *"nunca mostrar una pantalla completamente vacía mientras se cargan datos"* — y eso era exactamente lo que había');
const UI = leer('src/components/ui.jsx');
ok(/export function Esqueleto/.test(UI), '⚠️ y el componente vive en `ui.jsx`, con el resto');
ok(/role="status"/.test(UI.slice(UI.indexOf('export function Esqueleto'))),
  '⚠️ con `role="status"`: quien usa un lector oye "Cargando" una vez, no cinco cajas vacías');

const CSS = leer('src/index.css');
ok(/\.esqueleto/.test(CSS) && /@keyframes latido/.test(CSS),
  '🚨 y el latido vive en `index.css`, no en un `style` de una vista');
ok(/prefers-reduced-motion/.test(CSS),
  '🚨 así respeta "Reducir movimiento" SOLO: el apartado 18 cumplido sin escribir una línea más');

console.log('\n═══ 3. LOS VACÍOS, Y EL QUE NO PUEDE MENTIR (apartados 26 a 29) ═══\n');

ok(Object.values(VACIOS_HC).every((v) => v.titulo && v.explica),
  '⚠️ cada pantalla tiene su vacío, con su título y su explicación (apartado 26)');
ok(Object.values(VACIOS_HC).filter((v) => v.id !== 'stats').every((v) => v.boton),
  '🚨 y con su salida: un vacío sin botón es una pantalla rota (EH F41)');
eq(vacioHC('calendario').titulo, 'Tu calendario está libre ✨',
  '⚠️ con las palabras del enunciado (apartado 27)');
eq(vacioHC('agenda').explica, 'Disfruta del día.', 'y las del 28');
eq(vacioHC('inventado'), null, 'un vacío que no existe no se inventa');

// 🚨 Apartado 29 — el que se puede romper sin darse cuenta.
eq(vacioDeHoy({ total: 0, pendientes: 0 }).id, 'hoy_libre',
  '⚠️ sin nada en el día: "Día libre"');
eq(vacioDeHoy({ total: 4, pendientes: 0 }).id, 'hoy_hecho',
  '⚠️ con todo hecho: "Todo hecho"');
eq(vacioDeHoy({ total: 4, pendientes: 2 }), null,
  '🚨 CON PENDIENTES NO SE DICE NINGUNA DE LAS DOS: *"no mostrar falsamente «Todo hecho» si realmente existen elementos pendientes"* (apartado 29)');
eq(vacioDeHoy({}).id, 'hoy_libre', 'y sin datos no revienta');

console.log('\n═══ 4. LOS ERRORES, SIN UNA PALABRA TÉCNICA (apartado 25) ═══\n');

ok(Object.values(TEXTOS_ERROR_HC).every((e) => e.titulo && e.accion),
  '🚨 cada error dice QUÉ ha pasado y QUÉ hacer: *"Reintentar"*, nunca "Error" a secas (EH F62)');
eq(TEXTOS_ERROR_HC.cargar.titulo, 'No se ha podido cargar esto',
  '⚠️ con el texto del enunciado, literal');
ok(Object.values(TEXTOS_ERROR_HC).every((e) => sinPalabrasTecnicas(e.titulo) && sinPalabrasTecnicas(e.accion)),
  '🚨 y sin una palabra técnica: *"el detalle técnico queda para consola/logs"*');
ok(PALABRAS_TECNICAS.length >= 10, 'la lista es larga a propósito: una corta calla (la lección de la E3 F11)');
ok(!sinPalabrasTecnicas('Error: token inválido') && sinPalabrasTecnicas('No se ha podido guardar'),
  '⚠️ y distingue lo técnico de lo que se entiende');

console.log('\n═══ 5. LAS ANIMACIONES (apartados 14, 16, 18, 19 y 20) ═══\n');

ok(ANIMACIONES_HC.every((a) => a.ms > 0 && a.clase && a.apartado),
  '⚠️ cada una con su duración, su clase y su apartado');
eq(animacionesLargas(), [],
  '🚨 NINGUNA pasa del tope: *"no utilizar animaciones exageradas"* (apartado 14) — una animación larga en algo que se repite veinte veces al día estorba');
ok(MAX_ANIMACION_MS <= 1000, 'y el tope es corto de verdad');
ok(animacionHC('completar').ms <= 400,
  '⚠️ completar una tarea es breve: *"no hacer confeti exagerado para cada tarea"* (apartado 16)');
ok(animacionHC('esqueleto').repetida,
  '⚠️ y la del esqueleto se marca como repetida: su duración no es un retraso, se mide aparte');
eq(animacionHC('inventada'), null, 'una animación que no existe no se inventa');

// 🚨 Las clases declaradas EXISTEN en el CSS: una animación declarada y no
// escrita sería un control decorativo (regla 8).
for (const a of ANIMACIONES_HC) {
  ok(new RegExp(`\\.${a.clase}\\b`).test(CSS) || new RegExp(`${a.clase}`).test(leer('src/views/CalendarView.jsx')),
    `⚠️ la clase \`${a.clase}\` existe de verdad`);
}

console.log('\n═══ 6. EL REVISOR, QUE TIENE QUE PODER FALLAR (EH F42) ═══\n');

ok(REGLAS_PULIDO.every((r) => r.nombre && r.prohibido && r.ejemploMalo && r.arreglo),
  '⚠️ cada regla trae su nombre, su patrón, un ejemplo malo y cómo arreglarlo');
// 🚨 Una regla que no caza su propio ejemplo malo da siempre cero problemas.
for (const r of REGLAS_PULIDO) {
  const cazados = revisarPulido(r.ejemploMalo, { soloReglas: [r.id] });
  ok(cazados.length === 1 && cazados[0].regla === r.id,
    `🚨 la regla \`${r.id}\` CAZA su propio ejemplo malo: un revisor que no puede fallar no sirve (EH F42)`);
}
ok(REGLAS_PULIDO.every((r) => r.arreglo && sinPalabrasTecnicas(r.nombre)),
  '⚠️ y cada una dice cómo se arregla');
eq(reglaPulido('inventada'), null, 'una regla que no existe no se inventa');

// ⚠️ Y el limpiador quita las propias reglas: este archivo escribe los patrones
// que busca (catorce veces en el proyecto).
ok(revisarPulido(leer('src/lib/pulidoHC.js')).length === 0,
  '🚨 el revisor no se caza a SÍ MISMO: quita las reglas antes de barrer (la lección de EH F48)');
ok(!/prohibido:/.test(sinComentariosNiReglas('  prohibido: /#[0-9a-f]{6}/,')),
  '⚠️ y el limpiador funciona');

console.log('\n═══ 7. EL REVISOR SOBRE LAS PANTALLAS DE VERDAD ═══\n');

for (const p of PANTALLAS_HC) {
  const problemas = revisarPulido(leer(p.archivo));
  ok(problemas.length === 0,
    `🚨 ${p.nombre} pasa el revisor${problemas.length ? ` — ${problemas.map((x) => `${x.regla}:${x.linea}`).join(', ')}` : ''}`);
}
// Y `ui.jsx` y `quickAdd.jsx`, que son de donde salen las cards y los botones.
for (const archivo of ['src/components/ui.jsx', 'src/components/quickAdd.jsx']) {
  const problemas = revisarPulido(leer(archivo));
  ok(problemas.length === 0,
    `🚨 ${archivo} pasa el revisor${problemas.length ? ` — ${problemas.map((x) => `${x.regla}:${x.linea}`).join(', ')}` : ''}`);
}

console.log('\n═══ 8. LO QUE YA ESTABA, Y LO QUE NO SE TOCA ═══\n');

ok(YA_PULIDO.length >= 8 && YA_PULIDO.every((x) => x.apartado && x.con),
  '⚠️ lo que ya cumplía el proyecto se declara CON lo que lo resuelve: rehacerlo sería el rediseño que la primera línea prohíbe');
ok(YA_PULIDO.some((x) => x.apartado === 8 && /lucide/.test(x.con)),
  '⚠️ un solo sistema de iconos, el que ya se usa (apartado 8)');
ok(YA_PULIDO.some((x) => x.apartado === 18 && /prefers-reduced-motion/.test(x.con)),
  '🚨 y "Reducir movimiento" ya funcionaba: las animaciones viven en el CSS');
ok(YA_PULIDO.some((x) => x.apartado === 10 && /BotonAnadir/.test(x.con)),
  '⚠️ el ＋ es el mismo en las tres pantallas desde la E3 F9 (apartado 10)');

ok(NO_EN_EL_PULIDO.length >= 4 && NO_EN_EL_PULIDO.every((x) => x.porque),
  '⚠️ y lo que no se hace está escrito con su motivo');
ok(NO_EN_EL_PULIDO.some((x) => /confeti/.test(x.que)),
  '⚠️ nada de confeti: el apartado 16 lo dice con esas palabras');
ok(NO_EN_EL_PULIDO.some((x) => /scroll/i.test(x.que)),
  '⏸ y la posición del scroll (apartado 22) se explica en vez de montar un segundo mecanismo');

console.log('\n═══ 9. NI UNA LÓGICA CAMBIADA ═══\n');

const LIB = sinComentarios(leer('src/lib/pulidoHC.js'));
ok(!/saveData\(|supabase\./i.test(LIB),
  '🚨 esta capa no guarda nada: declara y revisa');
for (const cosa of ['DEFAULT_PULIDO', 'normalizarPulido', 'useState', 'useEffect']) {
  ok(!new RegExp(cosa).test(LIB),
    `🚨 ni estado, ni almacén: \`${cosa}\` no aparece — *"pulir lo existente, no cambiar su lógica"*`);
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
