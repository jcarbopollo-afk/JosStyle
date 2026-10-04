/* AC F2 — Auditoría de Apariencia, tras retirar la categoría Accesibilidad (AC F1).
   ═══════════════════════════════════════════════════════════════════════════
   No es un rediseño: se comprueba que lo que dice Apariencia es verdad y que no
   hay nada repetido ni fuera de sitio. Lo que se corrigió:
   - El ALTO CONTRASTE existía en el motor (`aplicarTema`, dos paletas, el campo
     `apariencia.altoContraste`) y no tenía interruptor en NINGUNA pantalla, aunque
     la pantalla de Accesibilidad decía que estaba aquí.
   - RESTABLECER se llevaba el fondo de pantalla (vive dentro de `apariencia` desde
     la FO F1) sin decirlo; IMPORTAR un archivo sin fondo lo dejaba a cero. */
import { readFileSync } from 'node:fs';
import { aplicarTema, COLORS, DEFAULT_APARIENCIA, CONTRASTE_ALTO_OSCURO, CONTRASTE_ALTO_CLARO } from '../src/tokens.js';
import { FUNCIONES_AJUSTES, construirIndice, buscar } from '../src/lib/indiceBusqueda.js';

const leer = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const SV = leer('src/views/SettingsView.jsx');
const APP = leer('src/App.jsx');
let total = 0;
let fallos = 0;
const ok = (c, m) => { total += 1; if (c) console.log(`  \x1b[32m✓\x1b[0m ${m}`); else { fallos += 1; console.log(`  \x1b[31m✗ ${m}\x1b[0m`); } };

/* El bloque de Apariencia de la pantalla, de su `actual.id === 'apariencia'` al siguiente. */
const apariencia = SV.slice(SV.indexOf("actual.id === 'apariencia' && ("), SV.indexOf("actual.id === 'pantalla-principal' && ("));

console.log('\n── 1. Lo que Apariencia agrupa ──');
const secciones = [...apariencia.matchAll(/<Seccion titulo="([^"]+)"/g)].map((m) => m[1]);
ok(['Fondo', 'Colores', 'Recomendado', 'Apariencias guardadas', 'Legibilidad', 'Texto y movimiento'].every((t) => secciones.includes(t)),
  `Las secciones de Apariencia siguen ahí, sin tocar su orden (${secciones.join(' · ')})`);
ok(new Set(secciones).size === secciones.length, '…y ninguna está repetida');
ok(/>Tema</.test(apariencia) && apariencia.indexOf('>Tema<') < apariencia.indexOf('titulo="Fondo"'),
  '…con el tema claro/oscuro arriba, fuera de los plegables, donde estaba');
ok(!/'accesibilidad'/.test(SV) && !/Accessibility\b/.test(SV), 'Ni rastro de la categoría Accesibilidad ni de su icono (AC F1)');

console.log('\n── 2. Las opciones de accesibilidad, desde Apariencia, y cada una una vez ──');
for (const [campo, que] of [['tamanoTexto', 'el tamaño de texto'], ['reducirMovimiento', 'reducir movimiento'], ['altoContraste', 'el alto contraste']]) {
  const escrituras = (SV.match(new RegExp(`onUpdateApariencia\\(\\{ \\.\\.\\.apariencia, ${campo}:`, 'g')) || []).length;
  const enApariencia = (apariencia.match(new RegExp(`onUpdateApariencia\\(\\{ \\.\\.\\.apariencia, ${campo}:`, 'g')) || []).length;
  ok(escrituras === 1 && enApariencia === 1, `${que}: un solo control en toda la pantalla de Ajustes, y está en Apariencia (${escrituras})`);
}
/* ⚠️ `[^>]*` se cortaría en el `=>` del `onChange` (FIT F39): se acota por longitud. */
ok(/<Switch checked=\{!!apariencia\.altoContraste\}[\s\S]{0,200}?label="Alto contraste" \/>/.test(apariencia),
  '🐛 AC F2 — el alto contraste tiene por fin su interruptor, con su nombre para VoiceOver');
ok(/aplicarTema\(temaResuelto, apariencia\.altoContraste/.test(APP), '…y lo que guarda es lo que la aplicación lee al pintar');
aplicarTema('oscuro', false, null, null);
const normalOscuro = { textMuted: COLORS.textMuted, border: COLORS.border };
aplicarTema('oscuro', true, null, null);
ok(COLORS.border === CONTRASTE_ALTO_OSCURO.border && COLORS.border !== normalOscuro.border,
  `…y encenderlo cambia de verdad los bordes en oscuro (${normalOscuro.border} → ${COLORS.border})`);
aplicarTema('claro', true, null, null);
ok(COLORS.border === CONTRASTE_ALTO_CLARO.border, '…y en claro');
aplicarTema('oscuro', true, null, { bordes: '#112233' });
ok(COLORS.border === '#112233', '⚠️ …y un color de bordes elegido en el constructor manda, como dice la pantalla');
aplicarTema('oscuro', false, null, null);
ok(/Si has elegido tu propio color de bordes o de texto secundario en el constructor de temas, mandan los tuyos/.test(apariencia),
  '…lo dice con esas palabras, en vez de prometer un cambio que no llegaría');

console.log('\n── 3. Restablecer e importar no se llevan lo que no dicen ──');
const reset = (SV.match(/const restablecerApariencia = \(\) => \{[\s\S]*?\};/) || [''])[0];
ok(/fondo: apariencia\.fondo/.test(reset), '🐛 AC F2 — «Restablecer apariencia» ya no borra el fondo de pantalla');
ok(/modoColorAvanzado: apariencia\.modoColorAvanzado/.test(reset), '…ni cambia el modo sencillo/avanzado del color');
ok('fondo' in DEFAULT_APARIENCIA, '⚠️ (porque el fondo vive dentro de `apariencia` desde la FO F1: sin guardarlo, el valor por defecto lo pisaba)');
ok(/El color de acento y el fondo no se tocan\./.test(apariencia) && /animaciones y contraste a sus valores por defecto/.test(apariencia),
  '…y el aviso dice lo que hace: qué vuelve a su valor y qué se queda');
const importar = (SV.match(/const confirmarImportApariencia = \(\) => \{[\s\S]*?\};/) || [''])[0];
ok(/\{ \.\.\.DEFAULT_APARIENCIA, fondo: apariencia\.fondo, \.\.\.resto \}/.test(importar),
  '🐛 AC F2 — importar un archivo sin fondo ya no lo deja a cero (y el del archivo manda si lo trae)');
ok(/y el fondo si el archivo trae uno/.test(apariencia), '…y el aviso de importar lo dice');

console.log('\n── 4. Nombres que dicen lo que hay ──');
ok(/\{ id: 'apariencia', label: 'Apariencia', desc: 'Tema, fondo, colores, texto, contraste y animaciones\.'/.test(SV),
  'La descripción de Apariencia en la lista de Ajustes nombra lo que contiene, fondo y contraste incluidos');
ok(/titulo="Texto y movimiento" sub="Tamaño, densidad, bordes, contraste y animaciones"/.test(apariencia),
  '…y la de «Texto y movimiento», también');

console.log('\n── 5. El buscador lleva al sitio ──');
const indice = construirIndice([]);
const primero = (q) => buscar(indice, q)[0];
ok(primero('alto contraste')?.id === 'ajuste:contraste' && primero('contraste')?.ajuste === 'apariencia',
  '«alto contraste» y «contraste» llevan a Apariencia');
ok(primero('accesibilidad')?.id === 'ajuste:texto', '«accesibilidad» sigue llevando a Tamaño de texto y densidad (AC F1)');
ok(FUNCIONES_AJUSTES.every((f) => f.ajuste !== 'accesibilidad'), 'Ninguna entrada apunta a la categoría retirada');

console.log(`\n${fallos === 0 ? '\x1b[32m' : '\x1b[31m'}AC F2: ${total - fallos}/${total} — ${total} comprobaciones\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);
