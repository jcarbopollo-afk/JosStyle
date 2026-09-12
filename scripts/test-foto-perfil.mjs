/* ---------------------------------------------------------------------------
   Ajustes · Perfil — la foto de perfil y el nombre de los saludos.

   Lo que más importa aquí NO es que la foto se pinte redonda: es que **se
   guarde de verdad y siga estando al recargar**, que es lo que Josué pidió
   comprobar con esas palabras. Por eso hay tanto sobre el normalizador y el
   tope de tamaño, y por eso el recorrido de Chromium la guarda, recarga la
   aplicación entera y va a buscarla.
   --------------------------------------------------------------------------- */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  LADO_AVATAR, CALIDAD_AVATAR, MAX_BYTES_FOTO, TIPOS_ACEPTADOS,
  recorteCuadrado, bytesDeDataUri, esFotoValida, normalizarPerfilFoto,
  nombreParaSaludo, saludoCompleto, inicialesDe,
  DONDE_VIVE, NO_ES_UN_SISTEMA_DE_FOTOS, prepararFotoPerfil,
} from '../src/lib/fotoPerfil.js';
import { DEFAULT_PERFIL } from '../src/tokens.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIB = readFileSync(join(raiz, 'src/lib/fotoPerfil.js'), 'utf8');
const VISTA = readFileSync(join(raiz, 'src/views/SettingsView.jsx'), 'utf8');
const HOY = readFileSync(join(raiz, 'src/views/DashboardView.jsx'), 'utf8');
const APP = readFileSync(join(raiz, 'src/App.jsx'), 'utf8');

// Quita comentarios y cadenas: una prueba que busca si el código HACE algo no
// puede saltar con la frase que promete que no lo hace (la lección, doce veces).
const soloCodigo = (t) => t
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/.*$/gm, '$1')
  .replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""').replace(/`[^`]*`/g, '``');

let pasa = 0; const fallos = [];
const ok = (c, m) => { if (c) { pasa++; console.log(`  ✓ ${m}`); } else { fallos.push(m); console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` (esperaba ${JSON.stringify(b)}, dio ${JSON.stringify(a)})`}`);

// Un data: URI válido de verdad, del tamaño que se quiera.
const fotoDe = (bytes = 600) => `data:image/jpeg;base64,${'A'.repeat(Math.ceil(bytes / 3) * 4)}`;

console.log('\n── 1. El recorte cuadrado (un avatar no conserva la proporción) ──');

// 🚨 La diferencia con `calcularDimensiones` de imagenes.js, que es lo que hace
// que la cara quede centrada en el círculo en vez de recortada por los lados.
const apaisada = recorteCuadrado(4032, 3024);
eq(apaisada.sLado, 3024, 'De una foto apaisada se recorta el lado corto entero');
eq(apaisada.sx, 504, '…centrado en horizontal, no pegado a la izquierda');
eq(apaisada.sy, 0, '…y sin recortar nada en vertical');

const vertical = recorteCuadrado(1080, 1920);
eq(vertical.sLado, 1080, 'De una foto vertical (la típica del iPhone) se recorta el ancho');
eq(vertical.sy, 420, '…centrado en vertical: la cara no se va fuera del círculo');

const yaCuadrada = recorteCuadrado(500, 500);
eq(yaCuadrada.sx, 0, 'Una foto ya cuadrada no se desplaza');
eq(yaCuadrada.destino, 256, '…y se escala al lado del avatar');

// ⚠️ No se agranda lo pequeño: escalar hacia arriba no añade detalle, solo peso.
eq(recorteCuadrado(80, 80).destino, 80, '🚨 Una imagen más pequeña que el avatar NO se agranda');
eq(recorteCuadrado(0, 500), null, 'Una imagen sin medidas devuelve null, no un recorte imposible');
eq(recorteCuadrado('x', 'y'), null, '…y una basura tampoco revienta');

console.log('\n── 2. El tamaño se MIDE, no se estima ──');

// 🐛 `texto.length` no son los bytes: base64 son 4 caracteres por cada 3 bytes.
// Medir de más rechazaría fotos legítimas; medir de menos dejaría pasar las que
// el tope quiere parar.
eq(bytesDeDataUri('data:image/jpeg;base64,QUJD'), 3, 'Cuatro caracteres de base64 son tres bytes');
eq(bytesDeDataUri('data:image/jpeg;base64,QUJDRA=='), 4, '…y el relleno `==` no se cuenta como dato');
eq(bytesDeDataUri('data:image/jpeg;base64,QUJDREU='), 5, '…ni el `=` suelto');
eq(bytesDeDataUri('no soy un data uri'), 0, 'Lo que no es un data: URI mide 0');
eq(bytesDeDataUri(null), 0, '…y un null tampoco revienta');

console.log('\n── 3. Qué se acepta como foto guardada (la forma NO basta) ──');

ok(esFotoValida(fotoDe(1000)), 'Un JPEG pequeño es una foto válida');
ok(!esFotoValida('data:image/jpeg;base64,'), '🚨 Un data: URI sin contenido NO lo es (se pintaría roto)');
ok(!esFotoValida('data:text/html;base64,QUJD'), '🚨 Ni un data: URI que no sea una imagen');
ok(!esFotoValida('https://ejemplo.com/foto.jpg'), '🚨 Ni una URL: la foto vive en el dato, no fuera');
ok(!esFotoValida(fotoDe(MAX_BYTES_FOTO + 5000)), '🚨 Ni una que se pase del tope, aunque tenga la forma buena');
ok(esFotoValida(fotoDe(MAX_BYTES_FOTO - 100)), '…y justo por debajo del tope sí');
ok(!esFotoValida(null) && !esFotoValida(undefined) && !esFotoValida(42), 'Un null, un undefined y un número no son fotos');

console.log('\n── 4. El normalizador: lo que no se puede pintar no llega a la pantalla ──');

// ⚠️ Regla 5 — y devuelve el perfil ENTERO.
const sucio = normalizarPerfilFoto({ nombre: 'Josué', altura: 187, foto: 'basura' });
eq(sucio.foto, null, '🚨 Una foto corrupta se descarta AL CARGAR, no al pintarla');
eq(sucio.nombre, 'Josué', '⚠️ …y el resto del perfil sigue entero: `saveData` sobrescribe (regla 5)');
eq(sucio.altura, 187, '…con todos sus campos, no solo el nombre');

const gorda = normalizarPerfilFoto({ nombre: 'Josué', foto: fotoDe(MAX_BYTES_FOTO * 3) });
eq(gorda.foto, null, '🚨 Y una foto que se pasa del tope también: viajaría en CADA guardado del perfil');

const buena = fotoDe(2000);
eq(normalizarPerfilFoto({ foto: buena }).foto, buena, 'Una foto buena se conserva tal cual');
eq(normalizarPerfilFoto({}).foto, null, 'Un perfil de antes de esta fase se carga sin foto, no con undefined');
eq(normalizarPerfilFoto(null).foto, null, '…y un perfil que no existe tampoco revienta');
eq(DEFAULT_PERFIL.foto, null, '⚠️ El campo está en DEFAULT_PERFIL: si no, el merge de App.jsx lo dejaría en undefined');

// 🚨 Y corre AL CARGAR, que es donde tiene que correr (EH F46).
ok(/normalizarPerfilFoto\(\{\s*\.\.\.DEFAULT_PERFIL/.test(soloCodigo(APP)),
  '🚨 `App.jsx` normaliza la foto al cargar, encima del merge con el default');

console.log('\n── 5. El nombre de los saludos (el campo que no leía nadie) ──');

// 🐛 El fallo real: `nombreMostrado` existía desde la Fase A2, Ajustes lo ofrecía
// y NINGUNA pantalla lo leía. Escribirlo no cambiaba nada.
eq(nombreParaSaludo({ nombre: 'Josué', nombreMostrado: 'Jos' }), 'Jos',
  '🚨 El «Nombre mostrado» MANDA, que es lo que promete su propio campo en Ajustes');
eq(nombreParaSaludo({ nombre: 'Josué Carbonell', nombreMostrado: '' }), 'Josué',
  '…y sin él, el primer nombre (no los apellidos)');
eq(nombreParaSaludo({ nombre: 'Josué Carbonell', nombreMostrado: '   ' }), 'Josué',
  '⚠️ Un nombre mostrado de solo espacios no cuenta como puesto');
eq(nombreParaSaludo({ nombre: '' }), null,
  '🚨 Sin nombre devuelve null, NO una cadena vacía: quien salude tiene que poder distinguirlo');
eq(nombreParaSaludo({}), null, '…y un perfil vacío igual');
eq(nombreParaSaludo(null), null, '…y uno que no existe tampoco revienta');

eq(saludoCompleto('Buenos días', { nombre: 'Josué' }), 'Buenos días, Josué', 'El saludo se monta con su nombre');
eq(saludoCompleto('Buenas noches', { nombre: 'Josué', nombreMostrado: 'Jos' }), 'Buenas noches, Jos',
  '…y cambiar el nombre mostrado cambia el saludo, que es lo que pidió Josué');
eq(saludoCompleto('Buenos días', { nombre: '' }), 'Buenos días',
  '🚨 SIN NOMBRE NO QUEDA LA COMA COLGANDO: «Buenos días», no «Buenos días, »');
ok(!saludoCompleto('Buenos días', {}).endsWith(','), '…comprobado también por el otro lado');

// 🚨 Y que la pantalla de Hoy lo use de verdad, en vez de volver a partir el
// nombre por su cuenta. Es la comprobación que impide que el campo se vuelva a
// quedar muerto.
ok(/saludoCompleto\(/.test(soloCodigo(HOY)), '🚨 Hoy PIDE el nombre a esa función…');
ok(!/perfil\.nombre\.split/.test(soloCodigo(HOY)), '🚨 …y ya no se lo compone a mano (así es como el campo quedó muerto)');

console.log('\n── 6. Las iniciales del hueco (sin foto no se pinta un desconocido) ──');

eq(inicialesDe({ nombre: 'Josué', apellidos: 'Carbonell' }), 'JC', 'Con nombre y apellidos, dos iniciales');
eq(inicialesDe({ nombre: 'Josué', apellidos: '' }), 'J', '⚠️ Sin apellidos, UNA: inventarse la segunda es inventarse una letra suya');
eq(inicialesDe({ nombre: '', apellidos: '' }), null, 'Sin nombre no hay iniciales: ahí sí va el icono de persona');
eq(inicialesDe(null), null, '…y un perfil que no existe tampoco revienta');

console.log('\n── 7. Dónde vive la foto, y por qué no es un bucket ──');

eq(DONDE_VIVE.clave, 'perfil', 'La foto vive en la clave `perfil` de app_data…');
eq(DONDE_VIVE.campo, 'foto', '…en su campo `foto`');
ok(/RLS|auth\.uid/.test(DONDE_VIVE.porque), '⚠️ …y el motivo dice que eso YA está aislado por usuario');
ok(NO_ES_UN_SISTEMA_DE_FOTOS.length >= 3 && NO_ES_UN_SISTEMA_DE_FOTOS.every((x) => x.que && x.donde && x.porque),
  '🚨 Y se declara qué fotos NO caben aquí: esto no es el sistema de fotos general que EH F39 dijo que no existe');

// 🚨 La librería no toca Storage: si lo hiciera, dependería de un SQL que Josué
// no ha ejecutado y la foto no se guardaría.
const LIMPIO = soloCodigo(LIB);
ok(!/supabase/i.test(LIMPIO), '🚨 La librería no toca Supabase Storage: no depende de ningún bucket por crear');
ok(!/uploadFondoFoto|uploadPrendaFoto|uploadProgressPhoto/.test(LIMPIO), '…ni reutiliza el bucket de otro módulo');

console.log('\n── 8. La pantalla: circular, cambiar, quitar ──');

ok(/rounded-full/.test(VISTA) && /AvatarPerfil/.test(VISTA), '🚨 El avatar se pinta CIRCULAR (`rounded-full`)');
ok(/object-cover/.test(VISTA), '⚠️ …con `object-cover`, que recorta sin deformar la cara');
ok(/Cambiar foto/.test(VISTA) && /Elegir foto/.test(VISTA), 'El botón dice «Elegir foto» sin foto y «Cambiar foto» con ella');
ok(/Quitar/.test(VISTA), '…y se puede quitar');
ok(/type="file"/.test(VISTA) && /TIPOS_ACEPTADOS/.test(VISTA),
  '⚠️ Se elige desde el dispositivo, y el `accept` es la MISMA lista que después se valida');
ok(/ev\.target\.value = ''/.test(VISTA),
  '🐛 El input se limpia siempre: si no, elegir la MISMA foto dos veces no dispara nada y parece colgado');

// ⚠️ Quitar la foto pregunta, y es la excepción correcta: no va a la papelera.
ok(/confirmandoQuitar/.test(VISTA), '⚠️ Quitar la foto pide confirmación…');
ok(/no se recupera desde Eliminados recientes/i.test(VISTA),
  '🚨 …y dice la verdad: esto NO va a la papelera, así que no promete recuperarlo');

/* 🐛 UNA PROP QUE SE REPARTE Y NO SE USA NO FALLA: CALLA. Esta comprobación nació
   para vigilar que yo no le pasara `disabled` a un `GhostBtn` que no lo acepta…
   y saltó señalando un `disabled={subiendo}` **que ya estaba** en el «Cancelar»
   de la foto de fondo. Llevaba siendo pulsable mientras subía. Arreglado en el
   componente, así que ahora la comprobación vigila lo de después: que quien lo
   reparta lo USE. Es la lección de la E3 F32 —una prueba puede decir lo
   contrario en dos fases seguidas y ser correcta las dos—. */
const GHOST = readFileSync(join(raiz, 'src/components/ui.jsx'), 'utf8');
const firmaGhost = GHOST.match(/export function GhostBtn\(\{([^}]*)\}/);
ok(firmaGhost && /disabled/.test(firmaGhost[1]), '🚨 `GhostBtn` RECOGE `disabled`…');
ok(/export function GhostBtn[\s\S]{0,400}?<button[\s\S]{0,200}?disabled=\{disabled\}/.test(GHOST),
  '🚨 …y se lo pasa al `<button>` de verdad: repartir una prop y no usarla es el fallo del `ref` de `Textarea` (E3 F20)');

console.log('\n── 9. Lo que esta fase NO ha tocado (el encargo lo pide tres veces) ──');

// Josué pidió expresamente que Apariencia, Pantalla principal y Preferencias
// generales se quedaran EXACTAMENTE igual. Esto lo comprueba contra el código,
// no contra una promesa escrita en un comentario.
for (const [cat, marca] of [
  ['apariencia', /id: 'apariencia'/],
  // ⚠️ El id es `pantalla-principal`, no `pantalla`: una comprobación escrita a
  // ojo sobre un id que no existe pasa a estar siempre roja (o, peor, siempre
  // verde si se escribe al revés).
  ['pantalla principal', /id: 'pantalla-principal'/],
  ['preferencias', /id: 'preferencias'/],
]) {
  ok(marca.test(VISTA), `⚠️ La categoría «${cat}» sigue existiendo en Ajustes, intacta`);
}
ok(/nombreMostrado/.test(VISTA), '⚠️ Y el campo «Nombre mostrado» sigue en su sitio: ahora además sirve para algo');

console.log('\n── 10. La parte del canvas no revienta fuera del navegador ──');

// ⚠️ `prepararFotoPerfil` toca `document`. En Node no existe, y tiene que
// DECIRLO en vez de lanzar: un error sin motivo es el que prohíbe EH F62.
const sinNavegador = await prepararFotoPerfil({ name: 'x.jpg', type: 'image/jpeg' });
ok(sinNavegador.ok === false && typeof sinNavegador.motivo === 'string',
  '🚨 Sin navegador devuelve `{ok:false, motivo}` — nunca lanza');
const sinArchivo = await prepararFotoPerfil(null);
ok(sinArchivo.ok === false && /ninguna imagen/i.test(sinArchivo.motivo), '…y sin archivo dice qué falta');
ok(TIPOS_ACEPTADOS.includes('image/heic'), '⚠️ Se acepta HEIC: es lo que hace el iPhone por defecto');
eq(LADO_AVATAR, 256, 'El avatar son 256 px (el doble de los 128 a los que se pinta)');
ok(CALIDAD_AVATAR > 0 && CALIDAD_AVATAR < 1, 'Y la calidad del JPEG es una fracción');

console.log(`\n  ${fallos.length ? '✗' : '✓'} Foto de perfil — ${pasa} comprobaciones${fallos.length ? `, ${fallos.length} FALLOS` : ''}`);
if (fallos.length) { fallos.forEach((f) => console.log(`      ✗ ${f}`)); process.exit(1); }
