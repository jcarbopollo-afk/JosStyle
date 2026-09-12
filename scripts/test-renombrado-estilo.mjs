/* ===========================================================================
   NAV F2 — «Estilo de hombre» pasa a llamarse «Imagen personal».

   🚨 **Un renombrado a medias es peor que ninguno.** Lo aprendió la E3 F30: al
   pasar el área de «Salud» a «Bienestar», un acceso escrito a mano se quedó con
   el nombre viejo y acabó habiendo **dos botones llamados igual en la misma
   pantalla**; ni el build ni los 1980 casos de renderizado lo vieron, porque
   cada pantalla se pinta perfecta por separado. Lo cazó Chromium.

   Por eso esta suite no comprueba que el nombre nuevo exista: comprueba que el
   **viejo no quede por ninguna parte que se lea**, y que **los ids no se hayan
   tocado**, que es la otra mitad de la lección.
   =========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { NOMBRE_ESTILO, NOMBRE_ANTERIOR_ESTILO, MODULOS_EH } from '../src/lib/estiloDeHombre.js';
import { PALABRAS_MODULOS } from '../src/lib/indiceBusqueda.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel) => fs.readFileSync(path.join(raiz, rel), 'utf8');

let pasa = 0;
const fallos = [];
const ok = (c, m) => { if (c) { pasa++; console.log(`  ✓ ${m}`); } else { fallos.push(m); console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(a === b, `${m}${a === b ? '' : ` — esperaba ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

/* Quita los comentarios: ahí el nombre viejo se conserva A PROPÓSITO, como
   historia — igual que el proyecto conserva *JC Fitness*. Lo que no puede quedar
   es en algo que se lea en pantalla. */
const sinComentarios = (s) => s
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(?<![:\w])\/\/[^\n]*/g, '');

function archivosDe(dir, ext) {
  const salida = [];
  const recorrer = (d) => {
    for (const e of fs.readdirSync(path.join(raiz, d), { withFileTypes: true })) {
      const rel = `${d}/${e.name}`;
      if (e.isDirectory()) recorrer(rel);
      else if (ext.some((x) => e.name.endsWith(x))) salida.push(rel);
    }
  };
  recorrer(dir);
  return salida;
}

console.log('\n── 1. El nombre se escribe UNA vez ──');

eq(NOMBRE_ESTILO, 'Imagen personal', 'El apartado se llama «Imagen personal»');
eq(NOMBRE_ANTERIOR_ESTILO, 'Estilo de hombre', '…y el nombre anterior queda declarado, no borrado');
ok(!/hombre/i.test(NOMBRE_ESTILO), '🚨 El nombre nuevo NO menciona ningún género (era el encargo)');

console.log('\n── 2. El nombre viejo no queda en NADA que se lea ──');

/* 🚨 El barrido de verdad: ni un archivo de `src/` puede decir «Estilo de
   hombre» fuera de un comentario. */
const conRestos = [];
for (const rel of archivosDe('src', ['.js', '.jsx'])) {
  const codigo = sinComentarios(leer(rel));
  if (/Estilo de [Hh]ombre/.test(codigo)) conRestos.push(rel);
}
eq(conRestos.length, 0,
  `🚨 Ningún archivo de src/ enseña el nombre viejo${conRestos.length ? ` — quedan en: ${conRestos.join(', ')}` : ''}`);

// ⚠️ Y la regla se prueba a sí misma: si no cazara nada, este barrido sería
// decorativo (EH F42). Con un ejemplo inventado tiene que saltar.
ok(/Estilo de [Hh]ombre/.test(sinComentarios("const x = 'Estilo de hombre';")),
  '⚠️ …y el barrido SÍ caza el nombre viejo cuando está en código (la regla puede fallar)');
ok(!/Estilo de [Hh]ombre/.test(sinComentarios('/* Estilo de hombre, histórico */')),
  '⚠️ …y NO salta con un comentario: la historia se conserva a propósito');

console.log('\n── 3. Ni un id se ha tocado ──');

/* 🚨 La otra mitad de la lección de la E3 F30: **renombrar lo que se ve y
   renombrar lo que se guarda son dos cosas distintas**. `estilo-hombre` es la
   clave de navegación y `estiloHombre` la de `app_data`; los leen la
   personalización de la Fase 19, la papelera, el buscador y las migraciones. */
const APP = leer('src/App.jsx');
ok(APP.includes("id: 'estilo-hombre'"), '🚨 El id de navegación sigue siendo `estilo-hombre`');
ok(APP.includes('estiloHombre'), '🚨 La clave de `app_data` sigue siendo `estiloHombre`');
ok(fs.existsSync(path.join(raiz, 'src/views/EstiloHombreView.jsx')),
  '⚠️ …y el archivo de la vista tampoco se renombra: mover ficheros no es renombrar un rótulo');

// Los 17 apartados de dentro conservan sus ids.
eq(MODULOS_EH.length, 17, 'Los diecisiete apartados siguen ahí');
for (const id of ['skincare', 'pelo', 'barba', 'higiene', 'cuerpo', 'perfumes', 'accesorios']) {
  ok(MODULOS_EH.some((m) => m.id === id), `⚠️ El apartado \`${id}\` conserva su id`);
}

console.log('\n── 4. Buscar el nombre VIEJO sigue funcionando ──');

/* 🚨 La lección de la E3 F23: las palabras se mudan, no se borran. Durante meses
   se ha llamado «Estilo de hombre», así que Josué lo buscará así. */
const palabras = PALABRAS_MODULOS['estilo-hombre'] || [];
for (const p of ['estilo', 'hombre', 'imagen', 'personal']) {
  ok(palabras.includes(p), `🚨 Buscar «${p}» sigue llevando al apartado`);
}
ok(palabras.includes('estilo de hombre'),
  '🚨 …y el nombre viejo entero también: nadie se queda sin encontrar lo que usaba');

console.log('\n── 5. El documento técnico se puede REGENERAR ──');

/* 🐛 **La ruta del generador estaba escrita a mano apuntando a
   `C:/Users/clapi/JosStyle`**, o sea al ordenador de quien lo escribió: en
   cualquier otro sitio reventaba. `CLAUDE.md` prometía *"si añades un módulo y no
   regeneras, la verificación se pone roja"* — pero **no se podía regenerar**. */
/* 🐛 ⚠️ **Y esta comprobación saltó con el código bien**, por decimoquinta vez en
   el proyecto: el comentario que EXPLICA el arreglo menciona `C:/Users/clapi`,
   así que buscar esa cadena en el archivo entero la encuentra. Una prueba que
   busca si el código HACE algo tiene que quitar los comentarios primero. */
const GEN = sinComentarios(leer('scripts/generar-doc-eh.mjs'));
ok(!/C:\/Users/.test(GEN), '🐛 El generador ya no tiene una ruta de Windows escrita a mano');
ok(/fileURLToPath/.test(GEN), '…la calcula desde el propio archivo, como el resto de scripts/');

const DOC = leer('docs/08_ESTILO_DE_HOMBRE_TECNICO.md');
ok(!/Estilo de [Hh]ombre/.test(DOC.split('\n').filter((l) => !l.startsWith('>')).join('\n')) || DOC.includes('Imagen personal'),
  '⚠️ El documento técnico, regenerado, ya habla de «Imagen personal»');

console.log('\n── 6. Lo que NO cambia con el nombre ──');

/* ⚠️ Josué: *"NO quiero que simplifiques ni elimines el contenido actual.
   Mantener todas sus funcionalidades."* */
const LIBS = archivosDe('src/lib', ['.js']).filter((f) => /estilo|Estilo|EH\.js|perfumes|skincare|barba/i.test(f));
ok(LIBS.length >= 20,
  `⚠️ Las librerías del apartado siguen todas ahí (${LIBS.length}): renombrar no es recortar`);

console.log(`\n  ${fallos.length ? '✗' : '✓'} Renombrado a «Imagen personal» (NAV F2) — ${pasa} comprobaciones${fallos.length ? `, ${fallos.length} FALLOS` : ''}`);
if (fallos.length) { fallos.forEach((f) => console.log(`      ✗ ${f}`)); process.exit(1); }
