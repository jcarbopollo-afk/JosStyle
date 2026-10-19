// ============================================================================
// 📎 SELECCIÓN DE FOTOS Y ARCHIVOS — la regla para toda la aplicación (P1, 2026-10-18)
//
// Las once pruebas que pidió Josué, en lo que Node puede medir (la parte de
// tocar con el dedo está en la sección «P1 · SELECTOR» del recorrido):
//    1 fototeca o galería · 2 selector de archivos · 3 cámara donde la hay ·
//    4 documentos · 5 permiso denegado · 6 opción no disponible · 7 formatos y
//    tamaños · 8 persistencia (elegir no es guardar) · 9 integración en cada
//    apartado · 10 sin regresiones · 11 iPhone, Android y ordenador.
// ⚠️ Ni una cámara física ni un iPhone de verdad: eso queda para Josué (R1).
// ============================================================================

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CLASES_DE_ARCHIVO, MB, opcionesDeSeleccion, encajaConAccept,
  textoDeTamano, validarArchivos, eventoDeArchivos, ACEPTA_IMAGEN_O_PDF,
} from '../src/lib/seleccionArchivos.js';
import { MEDIA_PENDIENTE, FOTO_DEL_ENTRENAMIENTO, PREPARADO_PARA_FIT8 } from '../src/lib/finalizacion.js';
import { crearFotoProgreso, normalizarFotoProgreso } from '../src/lib/fotosProgreso.js';
import { DEPENDENCIAS_PERMITIDAS } from '../src/lib/arquitecturaFitness.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\s*\}/g, '{}');

const ids = (ops) => ops.map((o) => o.id);
const archivo = (name, type, size = 1000) => ({ name, type, size });

console.log('\n1, 2, 3 y 11 · Un toque: el selector del sistema, sin un menú propio delante (2026-10-18)');
// Josué: el menú «Hacer una foto» / «Fototeca o archivos» era redundante: el selector
// nativo ya ofrece la cámara. iPhone/iPad: la hoja de iOS (Fototeca, Hacer foto, Elegir
// archivo); Android: cámara, galería y archivos; ordenador: el diálogo de archivos.
const foto = opcionesDeSeleccion({ clase: 'imagen' });
eq(ids(foto), ['archivos'], 'una foto: UNA opción, así que el botón abre directamente el selector');
eq(foto[0].accept, 'image/*', '…con lo que acepta su clase');
ok(!('capture' in foto[0]) && !('modo' in foto[0]), '🚨 …sin `capture` (obligaría a la cámara y en el iPhone quitaría la fototeca) ni cámara del navegador');
eq(foto[0].etiqueta, 'Elegir o hacer foto', '…y se llama por lo que hace el selector del sistema');
eq(ids(opcionesDeSeleccion({ clase: 'video' })), ['archivos'], 'un vídeo: también una');
eq(opcionesDeSeleccion({ clase: 'video' })[0].accept, 'video/*', '…de vídeo');
const mezcla = 'image/*,application/pdf';
eq(opcionesDeSeleccion({ clase: 'imagen', accept: mezcla })[0].accept, mezcla, 'una foto o un PDF (el adjunto de la IA): lo que acepta la función, entero');
eq(opcionesDeSeleccion({ clase: 'imagen', accept: mezcla })[0].etiqueta, 'Seleccionar archivo', '…y no se dice «foto» si también vale un PDF');
const doc = opcionesDeSeleccion({ clase: 'documento', accept: '.pdf,.docx' });
eq(ids(doc), ['archivos'], '4 · un documento: «Seleccionar archivo», nunca la cámara');
eq(doc[0].accept, '.pdf,.docx', '…respetando lo que acepta la función');

console.log('\n7 · Formatos y tamaños');
ok(encajaConAccept(archivo('a.jpg', 'image/jpeg'), 'image/*'), 'una JPEG es una imagen');
ok(encajaConAccept(archivo('IMG_0001.HEIC', ''), 'image/*'), '⚠️ una HEIC sin tipo (pasa en algunos navegadores) se reconoce por su extensión');
ok(!encajaConAccept(archivo('notas.pdf', 'application/pdf'), 'image/*'), 'un PDF no es una imagen');
ok(encajaConAccept(archivo('notas.pdf', 'application/pdf'), mezcla), '…pero vale donde se aceptan los dos');
ok(encajaConAccept(archivo('x.heic', ''), 'image/jpeg,image/png,image/heic'), 'una regla concreta sin tipo, por la extensión');
ok(encajaConAccept(archivo('cualquier.zip', 'application/zip'), ''), 'sin `accept`, vale todo (decide el módulo)');
const v = validarArchivos([archivo('a.jpg', 'image/jpeg', 2 * MB), archivo('b.gif', 'image/gif', 40 * MB), archivo('c.pdf', 'application/pdf'), archivo('d.png', 'image/png', 0)], { accept: 'image/*', maxBytes: 30 * MB });
eq(v.validos.map((a) => a.name), ['a.jpg'], 'se queda solo lo que vale');
eq(v.errores.length, 3, '…y de cada uno que no, su motivo');
ok(/pesa 40 MB: el máximo aquí es 30 MB/.test(v.errores[0]), `el tamaño, en palabras («${v.errores[0]}»)`);
ok(/no es un formato que se pueda usar aquí/.test(v.errores[1]), 'el formato, en palabras');
ok(/vacío o no se ha podido leer/.test(v.errores[2]), 'un archivo vacío, en palabras');
eq(validarArchivos([archivo('a.jpg', 'image/jpeg'), archivo('b.jpg', 'image/jpeg')], { accept: 'image/*', maxArchivos: 1 }).validos.length, 1, 'el tope de archivos');
eq(textoDeTamano(1536), '2 KB', 'kilobytes'); eq(textoDeTamano(1.5 * MB), '1,5 MB', 'megas, con coma');
ok(v.errores.every((e) => !/null|undefined|NaN|error code|MIME|accept/i.test(e)), 'ni una palabra técnica en un error');

console.log('\n5 y 6 · Sin menú propio, sin cámara propia');
const COMP = leer('src/components/selectorArchivos.jsx');
const COMP_C = sinComentarios(COMP);
ok(!/getUserMedia|CamaraWeb|HojaDeOpciones|createPortal/.test(COMP_C), '🚨 ni la hoja de opciones ni la cámara del navegador: el permiso de la cámara lo pide el sistema, que es quien la abre');
eq((COMP_C.match(/<input/g) || []).length, 1, 'un solo `<input type="file">` por selector');
ok(!/capture=/.test(COMP_C), '…sin `capture`');
ok(/<input[\s\S]{0,300}hidden className="hidden"/.test(COMP_C), '…con el atributo `hidden`: no cuenta como hermano para `space-y-*`');

console.log('\n8 · Elegir no es guardar');
const ev = eventoDeArchivos([archivo('a.jpg', 'image/jpeg')]);
ok(Array.isArray(ev.target.files) && ev.target.files.length === 1 && ev.target.value === '', 'los manejadores de siempre reciben su `{ target: { files } }`: cada módulo conserva su validación y su guardado');
ok(!/saveData|upload|supabase/.test(COMP_C), '🚨 el selector no sube ni guarda nada: eso sigue siendo de cada módulo');
const APP = sinComentarios(leer('src/App.jsx'));
ok(/const guardado = await saveData\(uidUser, 'saludFotos', next\);\s*return \{ \.\.\.entry, guardado/.test(APP), 'subir una foto de progreso devuelve también si el registro ha llegado a la cuenta');
const FIN = sinComentarios(leer('src/views/FinalizacionView.jsx'));
ok(/r\.guardado && r\.guardado\.ok === false\) pendiente = true/.test(FIN) && /setEstado\(pendiente \? 'pendiente' : 'guardada'\)/.test(FIN), '…y la foto de un entrenamiento solo dice «guardada» si ha llegado');
ok(/FOTO_DEL_ENTRENAMIENTO.pendiente|T\.pendiente/.test(FIN) && /todavía no está guardada en tu cuenta/.test(FOTO_DEL_ENTRENAMIENTO.pendiente), '…y si no, lo dice');

console.log('\n9 · En cada apartado que admite fotos o archivos');
const INTEGRACIONES = [
  ['src/components/fotosProgreso.jsx', 'las fotos de progreso (Fitness → Progreso → Fotos)'],
  ['src/views/HealthView.jsx', 'las fotos de progreso de Salud'],
  ['src/views/NutritionView.jsx', 'la foto del plato'],
  ['src/views/LibraryView.jsx', 'los documentos y las portadas de la Biblioteca'],
  ['src/views/ArmarioView.jsx', 'las fotos de prendas y outfits'],
  ['src/views/RelationView.jsx', 'el Álbum de Relación'],
  ['src/views/SettingsView.jsx', 'la foto de fondo y la de perfil'],
  ['src/components/ui.jsx', 'el adjunto de la IA (foto, captura o PDF)'],
  ['src/views/FinalizacionView.jsx', 'la foto de un entrenamiento'],
];
for (const [ruta, que] of INTEGRACIONES) ok(/<SelectorDeArchivos/.test(leer(ruta)) && /import \{ SelectorDeArchivos \}/.test(leer(ruta)), `${que} usan el selector común`);
/* 🧹 2026-10-19 — los vídeos de calistenia se elegían en `TrainingView`, que se fue
   de Fitness con su bloque (pedido por Josué). Se da la vuelta: ya no hay pantalla. */
ok(!existsSync(join(RAIZ, 'src/views/TrainingView.jsx')), '🧹 los vídeos de calistenia ya no tienen pantalla: se quitaron con su bloque de Fitness (lo subido sigue en su bucket)');
/* Lo que queda con su `<input>` de siempre: importar un archivo de datos. Para un
   documento, «Seleccionar archivo» ES el selector nativo: no hay más opciones. */
const PERMITIDOS = { 'src/components/GestionTemas.jsx': 1, 'src/views/SettingsView.jsx': 4 };
const vistas = [];
const recorrer = (d) => { for (const f of readdirSync(join(RAIZ, d))) { const r = `${d}/${f}`; if (statSync(join(RAIZ, r)).isDirectory()) recorrer(r); else if (/\.jsx?$/.test(f)) vistas.push(r); } };
recorrer('src/views'); recorrer('src/components');
const sueltos = [];
for (const r of vistas) {
  if (r === 'src/components/selectorArchivos.jsx') continue;
  // En bruto, por lo mismo: un «image/asterisco» se comería el código hasta el cierre del comentario.
  const c = leer(r);
  const total = (c.match(/type="file"/g) || []).length;
  if (total > (PERMITIDOS[r] || 0)) sueltos.push(`${r} (${total})`);
  if (/capture=/.test(c)) sueltos.push(`${r} usa capture`);
}
eq(sueltos, [], '🚨 ningún `<input type="file">` suelto ni un `capture` fuera del selector (salvo importar un archivo de datos)');
for (const [r, nTotal] of Object.entries(PERMITIDOS)) {
  const c = leer(r);
  const accepts = [...c.matchAll(/type="file"[\s\S]{0,80}?accept="([^"]+)"|accept="([^"]+)"[\s\S]{0,80}?type="file"/g)].map((m) => m[1] || m[2]);
  ok(accepts.length >= 1 && accepts.every((a) => /json|calendar|\.ics/.test(a)), `…y los que quedan en ${r} son de datos (${accepts.join(' · ')}), nunca una imagen`);
  void nTotal;
}
ok(!/from '\.\/ui'|from '\.\.\/components\/ui'/.test(COMP), 'el selector no importa `ui.jsx` (que lo usa): sin ciclo');
ok(/data-selector-opcion=\{opcion\.id\}/.test(COMP_C), 'el `<input>` se encuentra por su id (el recorrido lo usa)');
ok(/if \(entrada\.current\) entrada\.current\.click\(\)/.test(COMP_C) && !/setTimeout\([^)]*click/.test(COMP_C), '🚨 el `<input>` se pulsa dentro del mismo toque (iOS solo abre el selector desde un gesto)');

console.log('\n4 (Fitness) · Lo que estaba pendiente');
ok(/vídeo/.test(MEDIA_PENDIENTE.que) && !/foto/.test(MEDIA_PENDIENTE.que), 'lo que sigue sin sitio es el VÍDEO del entrenamiento (no hay bucket), y se dice así');
eq(MEDIA_PENDIENTE.campo, 'media', '…y `media` de la sesión sigue siendo el campo, a `null`');
ok(PREPARADO_PARA_FIT8.some((p) => /vídeo/.test(p.que) && /fotos de progreso/.test(p.donde)), '…lo preparado lo dice igual');
const fotoP = crearFotoProgreso({ path: 'u/1.jpg', fecha: '2026-10-18', createdFromWorkoutId: 'ses-1' });
eq(normalizarFotoProgreso(fotoP).createdFromWorkoutId, 'ses-1', 'la foto de un entrenamiento se enlaza con `createdFromWorkoutId` (FIT F26), que sobrevive a la carga');
ok(/createdFromWorkoutId: sesion\.id/.test(FIN) && /fecha: sesion\.fecha/.test(FIN), '…con el id y la fecha del entrenamiento');
ok(/\{!fallo && <FotoDelEntrenamiento/.test(FIN), '…y solo con el entrenamiento ya en la cuenta');
const FIT = sinComentarios(leer('src/views/FitnessView.jsx'));
ok(/onAddFoto=\{onAddFoto\}\s*fotosBloqueadas=\{protegidoFotos && !desbloqueadoFotos\}/.test(FIT), '🚨 con la misma protección que las fotos de progreso: con el PIN puesto y sin desbloquear, no se sube');
ok(/T\.bloqueadas/.test(FIN) && /Progreso → Fotos/.test(FOTO_DEL_ENTRENAMIENTO.bloqueadas), '…y se dice dónde añadirla');
ok(DEPENDENCIAS_PERMITIDAS.some((d) => d.modulo === 'selectorArchivos'), 'Fitness declara que usa el selector común (FIT F44)');

console.log('\n«Añadir progreso» abre el selector directamente (2026-10-18)');
const FP = sinComentarios(leer('src/components/fotosProgreso.jsx'));
ok(/<PrimaryButton onClick=\{anadir\}[^>]*>\+ Añadir progreso<\/PrimaryButton>/.test(FP), '«+ Añadir progreso» llama a `anadir`, que abre el selector (no el formulario vacío)');
ok(/const anadir = \(\) => \{ if \(selector\.current\) selector\.current\.abrir\(\); \}/.test(FP) && /<SelectorDeArchivos controlRef=\{selector\} clase="imagen" multiple maxBytes=\{MAX_FOTO_BYTES\} onElegir=\{conElegidas\}/.test(FP), '…con el selector común, varias fotos y el mismo tope de 30 MB');
ok(/const conElegidas = \(files\) => \{ setIniciales\(files\); setError\(null\); setAnadiendo\(true\); \}/.test(FP), '…lo elegido abre el formulario con su previsualización (cancelar el selector no abre nada)');
ok(/<ProgressPhotoEmpty accent=\{accent\} onAnadir=\{onAddFoto \? anadir : null\}/.test(FP) && /setComparando\(false\); anadir\(\);/.test(FP), '…igual desde el vacío y desde el comparador');
ok(!/setAnadiendo\(true\)\s*[;}]?\s*\)?\s*\}?\s*accent=/.test(FP) && (FP.match(/setAnadiendo\(true\)/g) || []).length === 1, 'ningún botón abre ya el formulario vacío');
ok(/iniciales=\{iniciales\}/.test(FP) && /useState\(\(\) => conId\(iniciales \|\| \[\]\)\)/.test(FP), 'el formulario recibe lo elegido y lo enseña antes de guardar (apartado 5 de la F26)');
ok(/URL\.createObjectURL\(e\.file\)/.test(FP) && /return \(\) => Object\.values\(urls\)\.forEach/.test(FP), '🐛 las previsualizaciones se crean y se sueltan en el mismo efecto (StrictMode no deja una foto elegida sin imagen)');
ok(/'Añadir otra' : 'Elegir o hacer foto'/.test(FP), '…y dentro se puede añadir otra');

console.log('\n10 · Sin regresiones');
eq(Object.keys(CLASES_DE_ARCHIVO), ['imagen', 'video', 'documento'], 'tres clases de contenido');
const ARM = leer('src/views/ArmarioView.jsx');
ok(/<SelectorDeArchivos[\s\S]{0,300}onElegir=\{\(f\) => onFoto\(f\[0\] \|\| null\)\}/.test(ARM), 'el armario sigue recibiendo un archivo, como antes');
const SET = sinComentarios(leer('src/views/SettingsView.jsx'));
ok((SET.match(/controlRef=\{(inputRef|fileRef)\}/g) || []).length === 3, 'los botones de Ajustes que abrían su `<input>` con `ref.click()` siguen haciéndolo (`controlRef`)');
ok(/mostrarError=\{false\}/.test(SET) && /if \(!mostrarError\) \{ if \(lista\.length && onElegir\) onElegir/.test(COMP_C), '…y con su validación propia, el selector le entrega todo: nada se queda sin decir');
// ⚠️ En bruto: un accept de «image/asterisco» abre un comentario para el limpiador.
const UI = leer('src/components/ui.jsx');
ok(/accept=\{ACEPTA_IMAGEN_O_PDF\}[\s\S]{0,200}onElegir=\{\(f\) => handleFile\(eventoDeArchivos\(f\)\)\}/.test(UI) && ACEPTA_IMAGEN_O_PDF === 'image/*,application/pdf', 'el adjunto de la IA conserva lo que aceptaba (una foto o un PDF) y su manejador');
ok(/aria-label="Adjuntar foto, captura o PDF"/.test(UI), '…y ahora el clip tiene nombre para VoiceOver');

console.log(`\n${n - fallos}/${n} comprobaciones${fallos ? ` · ${fallos} FALLOS` : ''}`);
process.exit(fallos ? 1 : 0);
