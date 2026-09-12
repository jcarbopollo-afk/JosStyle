/* ===========================================================================
   NAV F3 — el Álbum dentro de Relación.

   Josué lo pidió con una condición explícita: *"que sea una funcionalidad REAL,
   no un mockup"*. Así que lo que se comprueba aquí no es que la pantalla se
   pinte —eso ya lo hace `smoke-vistas`—, sino que **lo que se guarda sirva para
   algo mañana**: el camino y no una URL que caduca, el normalizador que corre al
   cargar, y que las fechas que él dijo que le gustan **no se toquen**.
   =========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  TIPOS_FOTO_ALBUM, MAX_BYTES_FOTO_ALBUM, MAX_NOTA_ALBUM,
  validarFotoAlbum, crearFotoAlbum, normalizarFotoAlbum, normalizarRelacion,
  fotosDelAlbum, resumenAlbum, anadirFotoAlAlbum, quitarFotoDelAlbum, pathDeFoto,
  BORRADO_ALBUM, NO_ES, condicionAlbum,
} from '../src/lib/albumRelacion.js';
import { DEFAULT_RELACION } from '../src/tokens.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel) => fs.readFileSync(path.join(raiz, rel), 'utf8');

let pasa = 0;
const fallos = [];
const ok = (c, m) => { if (c) { pasa++; console.log(`  ✓ ${m}`); } else { fallos.push(m); console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(a === b, `${m}${a === b ? '' : ` — esperaba ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const sinComentarios = (s) => s
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(?<![:\w])\/\/[^\n]*/g, '');

console.log('\n── 1. Qué se acepta como foto ──');

ok(validarFotoAlbum(null).ok === false, 'Sin archivo no se sube nada');
ok(/ninguna foto/i.test(validarFotoAlbum(null).motivo), '…y se dice qué falta, no «Error» a secas (EH F62)');
ok(validarFotoAlbum({ type: 'application/pdf', size: 10 }).ok === false, '🚨 Un PDF no es una foto');
ok(validarFotoAlbum({ type: 'image/jpeg', size: 1000 }).ok === true, 'Un JPEG sí');
ok(TIPOS_FOTO_ALBUM.includes('image/heic'), '⚠️ Se acepta HEIC: es lo que hace el iPhone por defecto');
ok(validarFotoAlbum({ type: 'image/jpeg', size: MAX_BYTES_FOTO_ALBUM + 1 }).ok === false,
  '⚠️ Y una foto de más de 10 MB se rechaza diciendo por qué');

console.log('\n── 2. Se guarda el CAMINO, nunca una URL firmada ──');

const foto = crearFotoAlbum('usuario-1/1700000000-abc.jpg', { nota: 'Playa' });
ok(typeof foto.path === 'string' && !/^https?:/.test(foto.path),
  '🚨 Lo guardado es el camino en Storage, no una URL');
ok(!('url' in foto), '🚨 …y la entidad NO tiene campo `url`: una URL firmada caduca en una hora (E3 F17)');
ok(!!foto.id && !!foto.fecha, 'Cada foto lleva su id y su fecha');
eq(foto.nota, 'Playa', '…y su nota');

/* 🚨 La librería no puede firmar ni subir nada: eso es de `supabase.js`, y quien
   lo llama es `App.jsx` — el mismo reparto que el Armario y los Fondos. */
const LIB = sinComentarios(leer('src/lib/albumRelacion.js'));
ok(!/supabase/i.test(LIB), '🚨 `albumRelacion.js` no toca Supabase: decide, no sube');
ok(!/createSignedUrl|\.upload\(/.test(LIB), '…ni firma ni sube: eso vive en `supabase.js`');

console.log('\n── 3. El normalizador, y corre AL CARGAR ──');

ok(normalizarFotoAlbum({ nota: 'sin camino' }) === null,
  '🚨 Una foto sin `path` se descarta: no se puede pintar, sería un hueco invisible (EH F26)');
ok(normalizarFotoAlbum(null) === null, '…y algo que no es un objeto, también');

const viejo = { nombre: 'Ana', fechas: [{ id: 'f1' }] };   // como lo tiene quien ya usaba la app
const norm = normalizarRelacion(viejo);
ok(Array.isArray(norm.album), '🚨 Lo guardado ANTES de esta fase recibe su `album` vacío, no `undefined`');
eq(norm.nombre, 'Ana', '⚠️ …sin perder el nombre');
eq(norm.fechas.length, 1, '⚠️ …ni las fechas (regla 5: `saveData` sobrescribe)');

// 🚨 Y el normalizador se llama en `App.jsx`, al cargar: si no, no sirve de nada.
const APP = sinComentarios(leer('src/App.jsx'));
ok(/setRelacion\(normalizarRelacion\(/.test(APP),
  '🚨 `App.jsx` normaliza Relación AL CARGAR, antes de que ninguna pantalla la lea (EH F46)');

console.log('\n── 4. Añadir, listar y quitar ──');

let rel = normalizarRelacion(DEFAULT_RELACION);
eq(fotosDelAlbum(rel).length, 0, 'Un álbum nuevo está vacío');
ok(resumenAlbum(rel).vacio === true, '…y lo dice');
ok(!/\b0\b/.test(resumenAlbum(rel).texto),
  '🚨 Sin fotos NO dice «0 fotos»: un cero no informa de nada que él no sepa (E3 F41)');

rel = anadirFotoAlAlbum(rel, crearFotoAlbum('u/1.jpg', { nota: 'Una', fecha: '2026-09-01' }));
rel = anadirFotoAlAlbum(rel, crearFotoAlbum('u/2.jpg', { nota: 'Dos', fecha: '2026-09-10' }));
eq(fotosDelAlbum(rel).length, 2, 'Se pueden añadir fotos');
eq(fotosDelAlbum(rel)[0].nota, 'Dos', '⚠️ …y salen de la más reciente a la más antigua');
eq(resumenAlbum(rel).texto, '2 fotos', 'El resumen las cuenta');
eq(resumenAlbum(anadirFotoAlAlbum(normalizarRelacion(DEFAULT_RELACION), crearFotoAlbum('u/x.jpg'))).texto,
  '1 foto', '⚠️ …en singular cuando es una');

const id = fotosDelAlbum(rel)[0].id;
eq(pathDeFoto(rel, id), 'u/2.jpg', 'Se puede recuperar el camino para borrar el archivo');
const tras = quitarFotoDelAlbum(rel, id);
eq(fotosDelAlbum(tras).length, 1, 'Se puede eliminar una foto');
ok(!fotosDelAlbum(tras).some((f) => f.id === id), '…y es la que se pidió');

// 🚨 Las dos escrituras devuelven el módulo ENTERO.
ok(typeof tras.nombre === 'string' && Array.isArray(tras.fechas),
  '🚨 Añadir y quitar devuelven Relación COMPLETA: perder una clave aquí la borraría (regla 5)');

console.log('\n── 5. Borrar una foto NO se recupera, y se dice ──');

eq(BORRADO_ALBUM.vaAPapelera, false, '🚨 El álbum no va a Eliminados recientes');
ok(/no se puede deshacer/i.test(BORRADO_ALBUM.aviso),
  '…y el aviso lo dice, porque es verdad: se borra un archivo de Storage');
ok(!!BORRADO_ALBUM.porque, '⚠️ …con su motivo declarado, no omitido');

const VISTA = sinComentarios(leer('src/views/RelationView.jsx'));
ok(/BotonBorrarDefinitivo/.test(VISTA),
  '🚨 La pantalla usa `BotonBorrarDefinitivo`, el que pregunta — como la foto de Salud y el vídeo de calistenia');

console.log('\n── 6. Las fechas de Relación NO se tocan ──');

/* ⚠️ Josué: *"Las fechas, estructura y funcionalidades actuales me gustan mucho.
   Quiero mantenerlo prácticamente tal cual."* */
ok(/FechasTab/.test(VISTA) && /EspecialesTab/.test(VISTA),
  '⚠️ Las dos pestañas de siempre siguen ahí');
ok(/onAddFecha|onUpdateFecha|onDeleteFecha/.test(VISTA),
  '⚠️ …con sus tres manejadores de siempre');
ok(/sub === 'album'/.test(VISTA), '🚨 Y el Álbum es una TERCERA pestaña, no un rediseño');

// Y los tres manejadores nuevos llegan de verdad desde App.jsx: si uno faltara,
// la pantalla se pintaría perfecta y el botón no haría nada (E3 F1, Economía).
for (const prop of ['onSubirFotoAlbum', 'onFirmarFotoAlbum', 'onBorrarFotoAlbum']) {
  ok(new RegExp(`${prop}=\\{`).test(APP), `🚨 \`${prop}\` se pasa desde App.jsx (un manejador que nadie pasa no falla: calla)`);
}

console.log('\n── 7. El bucket, con su aislamiento ──');

const SQL = leer('supabase/schema.sql');
ok(/insert into storage\.buckets[\s\S]*'relacion'/.test(SQL), '🚨 El bucket `relacion` está declarado en el esquema');
ok(/values \('relacion', 'relacion', false\)/.test(SQL), '🚨 …y es PRIVADO (`false`), no público');

const politicas = (SQL.match(/bucket_id = 'relacion'/g) || []).length;
ok(politicas >= 3, `🚨 Tiene sus políticas RLS (${politicas}): subir, ver y borrar`);
ok(/bucket_id = 'relacion' and \(storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/.test(SQL),
  '🚨 EL AISLAMIENTO ES DE LA BASE DE DATOS: la carpeta es el `auth.uid()`, no una comprobación de la pantalla');
ok(!/bucket_id = 'relacion'[\s\S]{0,80}auth\.uid\(\) IS NOT NULL/.test(SQL),
  '🚨 …y ninguna política es permisiva: `auth.uid() IS NOT NULL` dejaría a cualquiera ver lo de cualquiera (EH F43)');

console.log('\n── 8. Lo que este álbum NO es ──');

ok(NO_ES.length >= 3, 'Se declara lo que no es');
ok(NO_ES.every((n) => n.que && n.porque), '⚠️ …cada cosa con su motivo');
ok(NO_ES.some((n) => /social/i.test(n.que)),
  '⚠️ No es una función social: Josué dijo que no hacía falta complicarlo');
ok(!/compartir|publicar|enviar a/i.test(VISTA),
  '🚨 Y la pantalla no ofrece compartir ni publicar: no sale de su cuenta');

console.log('\n── 9. La condición de la fase se calcula ──');

const cond = condicionAlbum(rel);
ok(cond.ok, `🚨 La condición sale VERDE (${cond.casillas.filter((c) => c.ok).length}/${cond.casillas.length})`);
// ⚠️ Y puede fallar (EH F42): con una URL guardada como camino, se pone roja.
const mala = condicionAlbum({ nombre: '', fechas: [], album: [{ id: 'x', path: 'https://ejemplo/x.jpg' }] });
ok(!mala.ok, '⚠️ …y se pone ROJA si alguien guardara una URL en vez del camino');

console.log(`\n  ${fallos.length ? '✗' : '✓'} Álbum de Relación (NAV F3) — ${pasa} comprobaciones${fallos.length ? `, ${fallos.length} FALLOS` : ''}`);
if (fallos.length) { fallos.forEach((f) => console.log(`      ✗ ${f}`)); process.exit(1); }
