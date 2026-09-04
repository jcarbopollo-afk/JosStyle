// ============================================================================
// REGLA INVARIANTE — un botón de eliminar que no elimina
//
// ── POR QUÉ EXISTE ─────────────────────────────────────────────────────────
//
// Entrega 3 · Fase 1, apartado 2. Josué lo contó así: *"Economía → Movimientos.
// El usuario crea un movimiento. Aparece el icono de papelera. Al pulsarlo: no
// ocurre nada."*
//
// La causa era exactamente esto: `FinanceView` declaraba `onDeleteMovimiento`
// en su firma y lo llamaba en el `onClick` de la papelera, pero **`App.jsx`
// nunca se lo pasaba**. En JavaScript eso no es un error de compilación ni de
// renderizado: la pantalla se pinta perfecta y el botón existe. Solo al TOCARLO
// se lanza un `TypeError: onDeleteMovimiento is not a function`, que se queda en
// la consola del iPhone —donde nadie mira— y en pantalla no pasa nada.
//
// Ni `vite build`, ni las pruebas de renderizado, ni las de Node lo veían.
//
// ⚠️ Esto lo caza: busca **todos** los botones de eliminar de la aplicación
// (`<BotonBorrar>`, y cualquier `<button>` cuyo texto, `aria-label` o icono
// hablen de eliminar, borrar, quitar o papelera), saca el identificador que
// llaman y comprueba que de verdad exista algo detrás:
//
//   · si es una prop del componente → que TODOS los sitios donde se usa ese
//     componente se la pasen (aquí es donde saltaba Economía);
//   · si es una función local → que esté declarada en el archivo.
//
// El apartado 2 pide revisar "todos los lugares donde exista papelera,
// eliminar, borrar, remove, delete, icono de trash o acciones equivalentes".
// Esto es esa revisión, hecha código en mano y repetida en cada verificación —
// para que un botón de eliminar nuevo que nazca desconectado salte el mismo día
// y no dentro de tres meses, tocándolo en el móvil.
// ============================================================================

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');

// ── Los archivos que se revisan ────────────────────────────────────────────
const ARCHIVOS = [
  ...readdirSync(join(RAIZ, 'src/views')).filter((f) => f.endsWith('.jsx')).map((f) => `src/views/${f}`),
  ...readdirSync(join(RAIZ, 'src/components')).filter((f) => f.endsWith('.jsx')).map((f) => `src/components/${f}`),
];

const APP = readFileSync(join(RAIZ, 'src/App.jsx'), 'utf8');

// Palabras que convierten a un botón en "botón de eliminar". `quitar` entra
// porque varias pantallas la usan como sinónimo (Ajustes, Nutrición).
const PALABRAS = /(elimin|borrar|borrad|papelera|quitar|delete|remove|descartar)/i;

// ── Utilidades de lectura de código ────────────────────────────────────────

// Devuelve el contenido de un `{…}` equilibrando llaves desde la de apertura.
// Hace falta porque un `onClick` puede llevar objetos, ternarios y llamadas
// anidadas, y un `indexOf('}')` cortaría por el sitio equivocado.
function expresion(src, iLlave) {
  let d = 0;
  for (let j = iLlave; j < src.length; j++) {
    if (src[j] === '{') d += 1;
    else if (src[j] === '}') { d -= 1; if (d === 0) return src.slice(iLlave + 1, j); }
  }
  return '';
}

// El final de una etiqueta JSX de apertura, saltándose las llaves interiores.
function finDeEtiqueta(src, i) {
  let d = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') d += 1;
    else if (src[j] === '}') d -= 1;
    else if (src[j] === '>' && d === 0) return j;
  }
  return src.length - 1;
}

// Los componentes declarados en un archivo, con sus props desestructuradas.
function componentes(src) {
  const out = [];
  const re = /(?:export\s+default\s+)?function\s+([A-Z]\w*)\s*\(\s*\{([\s\S]*?)\}\s*\)|const\s+([A-Z]\w*)\s*=\s*\(\s*\{([\s\S]*?)\}\s*\)\s*=>/g;
  let m;
  while ((m = re.exec(src))) {
    const nombre = m[1] || m[3];
    const crudo = m[2] || m[4] || '';
    // Solo el primer nivel: `{ a, b: { c } }` no aparece en este proyecto, pero
    // un valor por defecto con objeto (`{ x = {} }`) sí, y no debe romper esto.
    const props = [];
    let d = 0; let actual = '';
    for (const ch of crudo) {
      if (ch === '{' || ch === '[' || ch === '(') d += 1;
      else if (ch === '}' || ch === ']' || ch === ')') d -= 1;
      if (ch === ',' && d === 0) { props.push(actual); actual = ''; } else actual += ch;
    }
    props.push(actual);
    out.push({
      nombre,
      desde: m.index,
      props: props.map((p) => p.split(/[=:]/)[0].trim()).filter((p) => /^\w+$/.test(p)),
    });
  }
  return out.sort((a, b) => a.desde - b.desde);
}

// Todo nombre ligado en el archivo (funciones, consts, lets). Sirve para saber
// si un manejador local existe de verdad.
function locales(src) {
  const s = new Set();
  for (const m of src.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g)) s.add(m[1]);
  for (const m of src.matchAll(/function\s+([A-Za-z_$][\w$]*)/g)) s.add(m[1]);
  // Desestructuraciones de estado y de props internas: `const [a, setA] = …`
  for (const m of src.matchAll(/const\s*\[\s*([\w$]+)\s*,\s*([\w$]+)\s*\]/g)) { s.add(m[1]); s.add(m[2]); }
  // Cualquier prop desestructurada de cualquier componente del archivo.
  for (const c of componentes(src)) c.props.forEach((p) => s.add(p));
  return s;
}

// ── El barrido ─────────────────────────────────────────────────────────────

const encontrados = [];
const rotos = [];

for (const rel of ARCHIVOS) {
  const src = readFileSync(join(RAIZ, rel), 'utf8');
  const comps = componentes(src);
  const nombresLocales = locales(src);
  const re = /<(BotonBorrar|button)\b/g;
  let m;
  while ((m = re.exec(src))) {
    const fin = finDeEtiqueta(src, m.index);
    const etiqueta = src.slice(m.index, fin + 1);
    // El contenido del botón, y SOLO el suyo: hasta su `</button>`. Mirar una
    // ventana de caracteres a ojo se lleva por delante el botón de al lado y
    // convierte a media pantalla en "botones de eliminar".
    const cierre = src.indexOf('</button>', fin);
    const cuerpo = src.slice(fin, cierre === -1 ? fin : cierre);
    const esDeBorrar = m[1] === 'BotonBorrar'
      || PALABRAS.test(etiqueta) || PALABRAS.test(cuerpo) || /<Trash/.test(cuerpo);
    if (!esDeBorrar) continue;

    const iOn = etiqueta.indexOf('onClick={');
    const linea = src.slice(0, m.index).split('\n').length;
    const donde = `${rel}:${linea}`;

    if (iOn === -1) {
      // Un botón de eliminar sin `onClick` es exactamente el control decorativo
      // que prohíbe la regla 8. La única excepción legítima es el propio
      // `BotonBorrar` de `ui.jsx`, que RECIBE su `onClick`.
      if (!/onClick/.test(etiqueta)) { rotos.push(`${donde} — botón de eliminar SIN onClick`); }
      continue;
    }

    const handler = expresion(etiqueta, iOn + 8).trim();
    encontrados.push({ donde, handler: handler.replace(/\s+/g, ' ').slice(0, 70) });

    // El identificador al que se llama de verdad: `() => onDelete(x)` → onDelete
    const cab = handler.match(/(?:\(\s*\)|\([\w\s,{}]*\))?\s*=>\s*([A-Za-z_$][\w$]*)/)
      || handler.match(/^([A-Za-z_$][\w$]*)$/);
    if (!cab) continue; // expresión compuesta (setEstado, ternarios): se resuelve sola
    const id = cab[1];
    if (['set', 'console', 'window', 'alert'].some((p) => id.startsWith(p))) continue;
    if (!nombresLocales.has(id)) { rotos.push(`${donde} — llama a \`${id}\`, que no existe en el archivo`); continue; }

    // ¿Es una prop del componente que envuelve al botón? Entonces hay que
    // comprobar que TODOS los sitios que usan ese componente se la pasen.
    const envolvente = [...comps].reverse().find((c) => c.desde < m.index);
    if (!envolvente || !envolvente.props.includes(id)) continue;

    // ⚠️ Un botón bajo guardia NO es un botón muerto. `{onEliminar && <BotonBorrar…>}`
    // y `{onEditar && (…)}` son la forma correcta de que una fila reutilizable
    // ofrezca la acción solo donde tiene sentido: sin la prop, el botón ni
    // siquiera se pinta, así que no hay nada que Josué pueda tocar en vano.
    // El caso que hay que cazar es el contrario: el botón que SIEMPRE se pinta
    // y llama a algo que no le han pasado (Economía → Movimientos).
    const antes = src.slice(Math.max(0, m.index - 220), m.index);
    if (new RegExp(`\\{\\s*${id}\\s*(&&|\\?)`).test(antes)) continue;

    const usos = [];
    for (const [ruta, texto] of [[rel, src], ['src/App.jsx', APP]]) {
      const reUso = new RegExp(`<${envolvente.nombre}\\b`, 'g');
      let u;
      while ((u = reUso.exec(texto))) {
        if (ruta === rel && u.index === envolvente.desde) continue;
        const f = finDeEtiqueta(texto, u.index);
        usos.push({ ruta, linea: texto.slice(0, u.index).split('\n').length, tag: texto.slice(u.index, f + 1) });
      }
    }
    if (usos.length === 0) continue; // componente exportado y usado fuera del barrido
    for (const uso of usos) {
      if (!new RegExp(`\\b${id}\\s*=`).test(uso.tag)) {
        rotos.push(`${donde} — <${envolvente.nombre}> en ${uso.ruta}:${uso.linea} NO recibe \`${id}\`: el botón lanza un TypeError al pulsarlo`);
      }
    }
  }
}

console.log('\n── Botones de eliminar encontrados ──');
console.log(`  ${encontrados.length} en ${ARCHIVOS.length} archivos de pantalla`);

console.log('\n── Revisión ──');
if (rotos.length > 0) rotos.forEach((r) => console.log(`  ✗ ${r}`));
ok(rotos.length === 0, `🚨 Ningún botón de eliminar queda sin cablear (${encontrados.length} revisados)`);
ok(encontrados.length >= 30, 'el barrido encuentra los botones de eliminar de la aplicación (no se ha quedado mudo)');

// Un revisor que no puede fallar no sirve (EH F42): se le da un caso malo
// inventado y tiene que cazarlo.
const MALO = `
export default function VistaFalsa({ cosas }) {
  return <BotonBorrar onClick={() => onDeleteCosa(cosas[0].id)} label="Eliminar cosa" />;
}`;
const localesMalo = locales(MALO);
ok(!localesMalo.has('onDeleteCosa'), '⚠️ el revisor caza una llamada a un manejador que no existe (si no, no sirve de nada)');

const BUENO = `
export default function VistaFalsa({ cosas, onDeleteCosa }) {
  return <BotonBorrar onClick={() => onDeleteCosa(cosas[0].id)} label="Eliminar cosa" />;
}`;
ok(locales(BUENO).has('onDeleteCosa'), 'y no salta con uno que sí está declarado');

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
