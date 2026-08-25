#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Auditoría de integración global (Entrega 2 · ME Fase 4).
//
// La especificación cierra el módulo de Módulos/Eliminados exigiendo una revisión
// de TODOS los módulos con las mismas preguntas. Tres de esas preguntas se pueden
// comprobar solas, y son justamente las que fallaron al hacer la auditoría a mano:
//
//   P3. ¿Sus elementos creados por el usuario se pueden ELIMINAR?
//       → seis colecciones dejaban crear y no borrar (Sueño, movimientos, medidas,
//         historial médico, comidas, partidos y horas de estudio).
//   P5. ¿Lo eliminado pasa por la PAPELERA?
//       → un `.filter(...)` suelto en un handler de borrado se salta la papelera
//         entera y el dato se pierde de verdad.
//   P7. ¿Está declarado en el catálogo de la papelera?
//       → si `CATALOGO_PAPELERA` no conoce la colección, `describirEntrada` no sabe
//         nombrarla y el elemento aparece en Eliminados como algo anónimo.
//
// Hacerlas a mano no escala a 106 fases: cada módulo nuevo de la Entrega 2 volverá
// a plantearlas. Esto las deja comprobadas en cada `verificar.sh`.
//
// Uso:  node --import ./scripts/resolver-vite.mjs scripts/auditar-modulos.mjs
// ---------------------------------------------------------------------------
import { readFileSync } from 'node:fs';
import { CATALOGO_PAPELERA, claveCatalogo } from '../src/lib/papelera.js';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

let fallos = 0;
const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const fallo = (m) => { console.log(`  \x1b[31m✗\x1b[0m ${m}`); fallos++; };

/* ---------- P3 · toda colección que se puede crear se puede borrar ----------
   Se detecta el "se puede crear" por el patrón real de los handlers de alta de
   App.jsx, que en todos los módulos es el mismo: un array al que se le concatena
   un elemento nuevo. Y el "se puede borrar" por la llamada a la papelera. */
const clave = claveCatalogo;

// Colecciones que se crean: `[...X.col, nuevo]` o `[...X, nuevo]`.
const creadas = new Set();
for (const m of app.matchAll(/\.\.\.(\w+)\.(\w+),\s*[\w{.\s]+\]/g)) creadas.add(`${m[1]}.${m[2]}`);
for (const m of app.matchAll(/snapshotAndSave\(\{\s*(\w+):\s*\[\s*\.\.\.\1,\s*\w+\s*\]/g)) creadas.add(m[1]);

// Colecciones que se borran, por cualquiera de las dos vías legítimas: el atajo genérico
// `eliminarConPapelera` o un borrado en cascada que llama a `prepararEliminacion` a mano
// (asignaturas y programas de Estudios, que arrastran sus hijos).
const borradas = new Set();
for (const m of app.matchAll(/eliminarConPapelera\('(\w+)',\s*(?:'(\w+)'|null)/g)) {
  borradas.add(clave(m[1], m[2]));
}
for (const m of app.matchAll(/prepararEliminacion\([^,]+,\s*'(\w+)',\s*(?:'(\w+)'|null)/g)) {
  borradas.add(clave(m[1], m[2]));
}

// Excepciones documentadas: no son listas de elementos que Josué "crea y borra".
//   · papelera.elementos       — es la propia papelera; tiene `eliminarDefinitivo` y `vaciarPapelera`.
//   · nutricion.favoritos      — atajo de registro rápido, con su propio `eliminarFavorito`.
//   · personalizacion.*        — ajustes (módulos ocultos, favoritas): se activan y desactivan,
//                                no se "eliminan", y su sitio es Personalización, no la papelera.
//   · seguridad.protected*     — lo mismo: son interruptores de protección.
//   · *.fotos / archivos / videos — viven en Supabase Storage, no en `app_data` (ver ME Fase 3).
const EXCEPCIONES = new Set([
  'papelera.elementos', 'nutricion.favoritos',
  'personalizacion.ocultos', 'personalizacion.favoritas', 'personalizacion.dashboardOcultos',
  'seguridad.protectedActions', 'seguridad.protectedAreas',
  'salud.fotos', 'biblioteca.archivos', 'calistenia.videos',
]);

const sinBorrado = [...creadas].filter((c) => !borradas.has(c) && !EXCEPCIONES.has(c));
if (sinBorrado.length) {
  fallo(`Colecciones que se pueden crear pero no borrar: ${sinBorrado.join(', ')}`);
} else {
  ok(`P3 · las ${creadas.size} colecciones creables tienen borrado (o excepción documentada)`);
}

/* ---------- P5 · ningún borrado se salta la papelera ----------
   Un `X.col.filter((x) => x.id !== id)` es exactamente el patrón que ME Fase 3
   sustituyó. Solo se mira sobre colecciones que YA están en el catálogo: si una
   colección es de las que van a la papelera y alguien la filtra a mano, el dato
   se pierde de verdad. En el resto (favoritos de Nutrición, temas de color
   guardados, ficheros de Storage) el filtro es el borrado legítimo. */
const gestionadas = new Set(Object.keys(CATALOGO_PAPELERA));
const filtrosSueltos = [];
app.split('\n').forEach((linea, i) => {
  const m = linea.match(/(\w+)\.(\w+)\.filter\(\s*\(?\w+\)?\s*=>\s*\w+\.id\s*!==/);
  if (!m) return;
  if (!gestionadas.has(`${m[1]}.${m[2]}`)) return;
  // Las cascadas sí filtran a mano, pero guardan lo arrastrado en la misma entrada.
  if (/conArrastrados|papelera/.test(linea)) return;
  filtrosSueltos.push(`App.jsx:${i + 1} → ${m[1]}.${m[2]}`);
});
if (filtrosSueltos.length) {
  fallo(`Borrados que se saltan la papelera: ${filtrosSueltos.join(', ')}`);
} else {
  ok(`P5 · las ${gestionadas.size} colecciones del catálogo solo se borran vía papelera`);
}

/* ---------- P7 · toda colección con borrado está en el catálogo ----------
   Sin entrada en CATALOGO_PAPELERA el elemento aparece en Eliminados sin nombre
   de módulo ni etiqueta legible. */
const sinCatalogo = [...borradas].filter((c) => !gestionadas.has(c));
if (sinCatalogo.length) {
  fallo(`Colecciones borrables que no están en CATALOGO_PAPELERA: ${sinCatalogo.join(', ')}`);
} else {
  ok(`P7 · las ${borradas.size} colecciones borrables están descritas en el catálogo`);
}

/* ---------- P7b · el catálogo no describe colecciones sin borrado real ---------- */
const huerfanas = [...gestionadas].filter((c) => !borradas.has(c));
if (huerfanas.length) {
  fallo(`El catálogo describe colecciones sin borrado real: ${huerfanas.join(', ')}`);
} else {
  ok('P7b · el catálogo no tiene entradas huérfanas');
}

/* ---------- P9 · toda entrada del catálogo se puede nombrar en la papelera ----------
   `describirEntrada` necesita `tipo` (el singular que ve Josué) y al menos un campo
   del que sacar la etiqueta. Sin eso el elemento sale como algo anónimo. */
const malDescritas = Object.entries(CATALOGO_PAPELERA).filter(([k, c]) =>
  !c.tipo || !Array.isArray(c.campos) || c.campos.length === 0 || !c.icono
  || clave(c.modulo, c.coleccion) !== k,
);
if (malDescritas.length) {
  fallo(`Entradas del catálogo mal formadas: ${malDescritas.map(([k]) => k).join(', ')}`);
} else {
  ok(`P9 · las ${gestionadas.size} entradas del catálogo tienen tipo, campos e icono`);
}

process.exit(fallos === 0 ? 0 : 1);
