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

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CLASES_DE_ARCHIVO, MB, detectarPlataforma, opcionesDeSeleccion, encajaConAccept,
  textoDeTamano, validarArchivos, textoDeErrorDeCamara, eventoDeArchivos, ACEPTA_IMAGEN_O_PDF,
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

const IOS = { tipo: 'ios', ios: true, android: false, tactil: true, camaraWeb: true };
const ANDROID = { tipo: 'android', ios: false, android: true, tactil: true, camaraWeb: true };
const PC = { tipo: 'ordenador', ios: false, android: false, tactil: false, camaraWeb: true };
const PC_SIN_CAMARA = { ...PC, camaraWeb: false };
const ids = (ops) => ops.map((o) => o.id);
const archivo = (name, type, size = 1000) => ({ name, type, size });

console.log('\n11 · La plataforma, de lo que dice el navegador');
const ua = (userAgent, extra = {}) => ({ navigator: { userAgent, maxTouchPoints: 0, ...extra.nav }, isSecureContext: extra.segura !== false, matchMedia: () => ({ matches: false }) });
const conCamara = { mediaDevices: { getUserMedia: () => null } };
eq(detectarPlataforma(ua('Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)', { nav: { maxTouchPoints: 5, ...conCamara } })).tipo, 'ios', 'un iPhone es iOS');
eq(detectarPlataforma(ua('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', { nav: { maxTouchPoints: 5 } })).tipo, 'ios', '⚠️ un iPad con iPadOS 13+ se presenta como un Mac: lo delata la pantalla táctil');
eq(detectarPlataforma(ua('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).tipo, 'ordenador', '…y un Mac de verdad sigue siendo un ordenador');
eq(detectarPlataforma(ua('Mozilla/5.0 (Linux; Android 14; Pixel 8)', { nav: { maxTouchPoints: 5 } })).tipo, 'android', 'un Android es Android');
eq(detectarPlataforma(ua('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', { nav: conCamara })).camaraWeb, true, 'un ordenador con cámara y página segura puede usarla');
eq(detectarPlataforma(ua('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', { nav: conCamara, segura: false })).camaraWeb, false, '🚨 sin página segura (http) el navegador no deja usar la cámara: no se ofrece');
eq(detectarPlataforma(ua('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).camaraWeb, false, 'sin `mediaDevices`, tampoco');
eq(detectarPlataforma(null).tipo, 'ordenador', 'sin `window` (Node), no revienta');

console.log('\n1, 2 y 3 · Fotos: cámara, fototeca o galería y archivos, según el dispositivo');
const iosFoto = opcionesDeSeleccion({ clase: 'imagen', plataforma: IOS });
eq(ids(iosFoto), ['camara', 'fototeca'], 'iPhone: «Hacer una foto» y «Fototeca o archivos» (la hoja del propio iOS trae la fototeca, la cámara y Archivos)');
ok(iosFoto[0].capture === 'environment' && iosFoto[0].modo === 'input', '…la cámara con `capture`, que en iOS va directa a la cámara');
ok(!iosFoto[1].capture && iosFoto[1].accept === 'image/*', '…y la otra SIN `capture`, que es la que abre la hoja del sistema');
const andFoto = opcionesDeSeleccion({ clase: 'imagen', plataforma: ANDROID });
eq(ids(andFoto), ['camara', 'fototeca', 'archivos'], 'Android: cámara, galería y archivos, que allí son tres cosas distintas');
eq(andFoto[1].etiqueta, 'Galería', '…la galería se llama así');
ok(!andFoto[2].accept.includes('image/*') && andFoto[2].accept.includes('.jpg') && andFoto[2].accept.includes('.heic'), '…y «Archivos» va por extensiones, que es lo que hace a Android abrir su gestor de archivos');
const pcFoto = opcionesDeSeleccion({ clase: 'imagen', plataforma: PC });
eq(ids(pcFoto), ['camara', 'archivos'], 'ordenador con cámara: «Hacer una foto» y «Elegir una imagen»');
eq(pcFoto[0].modo, 'camaraWeb', '…la cámara del navegador (`capture` no hace nada en un ordenador)');
eq(pcFoto[1].etiqueta, 'Elegir una imagen', '…y la galería y los archivos son el mismo diálogo: uno');

console.log('\n6 · Lo que no está disponible no se ofrece');
eq(ids(opcionesDeSeleccion({ clase: 'imagen', plataforma: PC_SIN_CAMARA })), ['archivos'], 'un ordenador sin cámara: solo elegir (y con una opción, el botón abre el selector directamente)');
eq(ids(opcionesDeSeleccion({ clase: 'video', plataforma: PC })), ['archivos'], 'grabar vídeo en el navegador es otra función: en un ordenador, solo elegir el vídeo');
eq(ids(opcionesDeSeleccion({ clase: 'video', plataforma: IOS })), ['camara', 'fototeca'], 'en el iPhone sí se graba (con `capture`)');
eq(opcionesDeSeleccion({ clase: 'video', plataforma: IOS })[0].etiqueta, 'Grabar un vídeo', '…y se llama por lo que hace');

console.log('\n4 · Documentos: nunca la cámara');
for (const [nombre, p] of [['iPhone', IOS], ['Android', ANDROID], ['ordenador', PC]]) {
  const ops = opcionesDeSeleccion({ clase: 'documento', accept: '.pdf,.docx', plataforma: p });
  eq(ids(ops), ['archivos'], `${nombre}: un documento solo ofrece «Seleccionar archivo»`);
  eq(ops[0].accept, '.pdf,.docx', `…respetando lo que acepta la función (${nombre})`);
}
const mezcla = 'image/*,application/pdf';
const andMezcla = opcionesDeSeleccion({ clase: 'imagen', accept: mezcla, plataforma: ANDROID });
eq(andMezcla[1].accept, 'image/*', 'una foto o un PDF (el adjunto de la IA), en Android: la galería se queda con las fotos…');
ok(andMezcla[2].accept.includes('application/pdf'), '…y el PDF va por «Archivos»');
eq(opcionesDeSeleccion({ clase: 'imagen', accept: mezcla, plataforma: PC })[1].etiqueta, 'Elegir un archivo', '…en el ordenador no se dice «una imagen» si también vale un PDF');

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

console.log('\n5 · Sin permiso para la cámara');
ok(/No hay permiso para usar la cámara/.test(textoDeErrorDeCamara({ name: 'NotAllowedError' })), 'permiso denegado: se dice, y dónde se cambia');
ok(/elegir un archivo/.test(textoDeErrorDeCamara({ name: 'NotAllowedError' })), '…con la alternativa');
ok(/ninguna cámara/.test(textoDeErrorDeCamara({ name: 'NotFoundError' })), 'sin cámara: se dice');
ok(/otra aplicación/.test(textoDeErrorDeCamara({ name: 'NotReadableError' })), 'la cámara ocupada: se dice');
ok(/No se ha podido abrir la cámara/.test(textoDeErrorDeCamara(new Error('x'))), 'cualquier otro: una frase, nunca la traza');
const COMP = leer('src/components/selectorArchivos.jsx');
const COMP_C = sinComentarios(COMP);
ok((COMP_C.match(/getUserMedia\(/g) || []).length === 1 && /export function CamaraWeb[\s\S]*getUserMedia\(/.test(COMP_C), '🚨 el permiso se pide en UN sitio: al abrir la cámara, nunca antes');
ok(/\{camara && <CamaraWeb/.test(COMP_C), '…y la cámara solo se monta cuando se pulsa «Hacer una foto»');
ok(/getTracks\(\)\.forEach\(\(t\) => t\.stop\(\)\)/.test(COMP_C) && /return \(\) => \{[\s\S]*?t\.stop\(\)/.test(COMP_C), '…y se apaga al cerrar, salga como salga');

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
  ['src/views/TrainingView.jsx', 'los vídeos de calistenia'],
  ['src/views/LibraryView.jsx', 'los documentos y las portadas de la Biblioteca'],
  ['src/views/ArmarioView.jsx', 'las fotos de prendas y outfits'],
  ['src/views/RelationView.jsx', 'el Álbum de Relación'],
  ['src/views/SettingsView.jsx', 'la foto de fondo y la de perfil'],
  ['src/components/ui.jsx', 'el adjunto de la IA (foto, captura o PDF)'],
  ['src/views/FinalizacionView.jsx', 'la foto de un entrenamiento'],
];
for (const [ruta, que] of INTEGRACIONES) ok(/<SelectorDeArchivos/.test(leer(ruta)) && /import \{ SelectorDeArchivos \}/.test(leer(ruta)), `${que} usan el selector común`);
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
ok(/createPortal\(/.test(COMP_C) && /fixed inset-0 z-capa/.test(COMP_C) && /CAPAS\.veloHoja/.test(COMP_C) && /<AsaHoja/.test(COMP_C) && /useDialogoAccesible\(true/.test(COMP_C), 'la hoja de opciones es una hoja de JosStyle: portal, capa, velo, asa y teclado (MS F5, F6 y FIT F39)');
ok(/data-opcion=\{o\.id\}/.test(COMP_C) && /data-selector-opcion=\{o\.id\}/.test(COMP_C), 'cada opción y cada `<input>` se encuentran por su id (el recorrido los usa)');
ok(/if \(opciones\.length === 1\) usar\(opciones\[0\]\)/.test(COMP_C), 'con una sola opción no hay menú: un paso de más');
ok(/if \(el\) el\.click\(\)/.test(COMP_C) && !/setTimeout\([^)]*click/.test(COMP_C), '🚨 el `<input>` se pulsa dentro del mismo toque (iOS solo abre el selector desde un gesto)');

console.log('\n4 (Fitness) · Lo que estaba pendiente');
ok(/vídeo/.test(MEDIA_PENDIENTE.que) && !/foto/.test(MEDIA_PENDIENTE.que), 'lo que sigue sin sitio es el VÍDEO del entrenamiento (no hay bucket), y se dice así');
eq(MEDIA_PENDIENTE.campo, 'media', '…y `media` de la sesión sigue siendo el campo, a `null`');
ok(PREPARADO_PARA_FIT8.some((p) => /vídeo/.test(p.que) && /fotos de progreso/.test(p.donde)), '…lo preparado lo dice igual');
const foto = crearFotoProgreso({ path: 'u/1.jpg', fecha: '2026-10-18', createdFromWorkoutId: 'ses-1' });
eq(normalizarFotoProgreso(foto).createdFromWorkoutId, 'ses-1', 'la foto de un entrenamiento se enlaza con `createdFromWorkoutId` (FIT F26), que sobrevive a la carga');
ok(/createdFromWorkoutId: sesion\.id/.test(FIN) && /fecha: sesion\.fecha/.test(FIN), '…con el id y la fecha del entrenamiento');
ok(/\{!fallo && <FotoDelEntrenamiento/.test(FIN), '…y solo con el entrenamiento ya en la cuenta');
const FIT = sinComentarios(leer('src/views/FitnessView.jsx'));
ok(/onAddFoto=\{onAddFoto\}\s*fotosBloqueadas=\{protegidoFotos && !desbloqueadoFotos\}/.test(FIT), '🚨 con la misma protección que las fotos de progreso: con el PIN puesto y sin desbloquear, no se sube');
ok(/T\.bloqueadas/.test(FIN) && /Progreso → Fotos/.test(FOTO_DEL_ENTRENAMIENTO.bloqueadas), '…y se dice dónde añadirla');
ok(DEPENDENCIAS_PERMITIDAS.some((d) => d.modulo === 'selectorArchivos'), 'Fitness declara que usa el selector común (FIT F44)');

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
