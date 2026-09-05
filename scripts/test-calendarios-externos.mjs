// ============================================================================
// ENTREGA 3 · FASE 12 (HC F7) — CALENDARIOS EXTERNOS
//
// 🚨 **La regla que abre el enunciado:** *"las integraciones externas NO deben
// sustituir al calendario interno. JosStyle debe seguir funcionando aunque el
// usuario no conecte ningún servicio externo."*
//
// ⏸ **Y la decisión de la fase:** Google y Outlook necesitan OAuth, y OAuth
// necesita credenciales que **solo puede crear Josué** más un sitio seguro donde
// guardar los tokens (apartado 26). Así que el botón "Conectar Google Calendar"
// **no se construye** —sería el control decorativo de la regla 8— y sí se
// construye entero el camino del archivo `.ics`, que es lo que el apartado 4
// pide expresamente para Apple y funciona igual con los otros dos.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROVEEDORES, proveedor, ORIGEN_INTERNO, LO_QUE_NECESITA_JOSUE,
  CAMPOS_EXTERNOS, esExterno, etiquetaDeOrigen,
  yaImportado, fechaHoraDeICS, leerICS, planDeImportacion,
  planDeDesconexion, ESTADOS_CONEXION, ultimaSincronizacion,
  NO_EN_ESTA_FASE_EXTERNOS,
} from '../src/lib/calendariosExternos.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
// ⚠️ Bloques primero, llaves vacías después (la lección de la E3 F5).
const sinComentarios = (t) => t
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\s*\}/g, '');

const ICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:abc-123@google.com
SUMMARY:Examen de Biolog\\,ía
DTSTART:20260903T100000Z
DTEND:20260903T113000Z
LOCATION:Aula 3
DESCRIPTION:Temas 1 y 2
END:VEVENT
BEGIN:VEVENT
UID:def-456@google.com
SUMMARY:Cumpleaños de Ana
DTSTART;VALUE=DATE:20260910
END:VEVENT
BEGIN:VEVENT
UID:sin-titulo@google.com
DTSTART:20260904T090000Z
END:VEVENT
END:VCALENDAR`;

console.log('\n═══ 1. QUÉ SE PUEDE HOY, Y QUÉ NO (apartados 1, 2, 3 y 4) ═══\n');

eq(PROVEEDORES.map((p) => p.id), ['apple', 'google', 'outlook'],
  '⚠️ los tres proveedores del enunciado');
eq(PROVEEDORES.filter((p) => p.conexionDirecta).map((p) => p.id), [],
  '⏸ NINGUNO se conecta directamente todavía, y se declara: un botón "Conectar" que no conecta sería un control decorativo (regla 8)');
ok(PROVEEDORES.every((p) => p.porArchivo),
  '🍎 y los tres funcionan por archivo, que es la alternativa que pide el apartado 4');
ok(PROVEEDORES.every((p) => p.comoVa && p.porque),
  '🚨 cada uno dice CÓMO va hoy y POR QUÉ no va de otra forma');
// 🚨 EH F62 — ni una palabra técnica en un texto que ve el usuario.
const TECNICAS = /\bOAuth\b|\btoken\b|\bAPI\b|\bnull\b|service worker|\bendpoint\b|\bJSON\b/i;
ok(!PROVEEDORES.some((p) => TECNICAS.test(p.comoVa) || TECNICAS.test(p.porque)),
  '⚠️ y sin palabras técnicas: los lee Josué, no un programador (EH F62)');
eq(proveedor('inventado'), null, 'un proveedor que no existe no se inventa');

console.log('\n═══ 2. LO QUE HACE FALTA, Y QUIÉN LO DECIDE (regla 49) ═══\n');

ok(LO_QUE_NECESITA_JOSUE.length === 3 && LO_QUE_NECESITA_JOSUE.every((x) => x.que && x.porque),
  '🚨 las tres cosas que hacen falta para conectar de verdad, con su motivo');
ok(LO_QUE_NECESITA_JOSUE.every((x) => x.decide === 'Josué'),
  '🚨 y las tres las decide ÉL: no son tareas pendientes mías (regla 49)');
ok(LO_QUE_NECESITA_JOSUE.some((x) => /Google/.test(x.que)) && LO_QUE_NECESITA_JOSUE.some((x) => /Microsoft/.test(x.que)),
  '⚠️ registrar la aplicación en Google y en Microsoft');
ok(LO_QUE_NECESITA_JOSUE.some((x) => /seguro/.test(x.que)),
  '🚨 y un sitio SEGURO donde guardar el acceso: el apartado 26 prohíbe el navegador y el código');
ok(LO_QUE_NECESITA_JOSUE.filter((x) => x.permisos).every((x) => /calendario/i.test(x.permisos)),
  '⚠️ y solo el permiso del calendario: nunca Gmail, Drive ni Contactos (apartado 5)');

console.log('\n═══ 3. UN EVENTO EXTERNO ES UN EVENTO (apartados 10, 11, 12, 22 y 23) ═══\n');

eq(CAMPOS_EXTERNOS, ['origen', 'idExterno', 'calendarioExterno', 'cuentaExterna'],
  '⚠️ los cuatro campos del apartado 23');
const { eventos, error } = leerICS(ICS, { origen: 'google', calendario: 'Estudios', cuenta: 'jc@gmail' });
eq(error, null, 'un calendario válido se lee sin error');
eq(eventos.length, 2,
  '⚠️ dos eventos: el tercero no tiene título y se descarta, en vez de crear uno llamado "sin nombre"');

const examen = eventos[0];
eq(examen.titulo, 'Examen de Biolog,ía',
  '⚠️ y las comas escapadas del formato se deshacen: si no, el título saldría con barras');
/* 🐛 **El fixture viene en UTC (`…T100000Z`) y esto esperaba `10:00`.**
   La `Z` significa UTC, y `fechaHoraDeICS` hace lo correcto: pasarla al reloj de
   quien mira. En España en septiembre eso son las 12:00, así que la prueba
   pedía justo lo contrario de lo que el propio analizador documenta —y de lo
   que le conviene a Josué, que si no se presentaría al examen dos horas antes.

   ⚠️ La hora esperada se **calcula**, no se escribe: poner "12:00" arreglaría el
   rojo aquí y lo devolvería en cuanto alguien ejecutara esto fuera de España, o
   en invierno. Se convierte igual que en producción y se compara con eso. */
const local = (aaaa, mm, dd, h, min) => {
  const d = new Date(Date.UTC(aaaa, mm - 1, dd, h, min));
  const p = (n) => String(n).padStart(2, '0');
  return { fecha: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, hora: `${p(d.getHours())}:${p(d.getMinutes())}` };
};
const inicioEsperado = local(2026, 9, 3, 10, 0);
const finEsperado = local(2026, 9, 3, 11, 30);
eq([examen.fecha, examen.horaInicio, examen.horaFin],
  [inicioEsperado.fecha, inicioEsperado.hora, finEsperado.hora],
  `⚠️ con su fecha y sus horas, convertidas del UTC al reloj de aquí (${inicioEsperado.hora})`);
eq(examen.ubicacion, 'Aula 3', 'y su sitio');
eq(examen.idExterno, 'abc-123@google.com',
  '🚨 y SU IDENTIFICADOR de verdad: *"nunca utilizar el título como identificador"* (apartado 23)');
eq([examen.origen, examen.calendarioExterno, examen.cuentaExterna], ['google', 'Estudios', 'jc@gmail'],
  '⚠️ y de dónde viene, con su calendario y su cuenta');
ok(examen.soloLectura,
  '⚠️ un evento importado no se edita aquí: se cambia en su calendario');
ok('recurrencia' in examen && 'estado' in examen && 'notificar' in examen,
  '🚨 y tiene TODOS los campos de un evento: si no, el normalizador lo recortaría en el siguiente guardado (regla 5)');

eq(eventos[1].todoElDia, true,
  '⚠️ un evento de todo el día se reconoce, sin inventarle una hora');
eq(eventos[1].horaInicio, '', 'y se queda sin hora');

ok(esExterno(examen) && !esExterno({ origen: ORIGEN_INTERNO }),
  '⚠️ se distingue un evento externo de uno interno (apartado 9)');
eq(etiquetaDeOrigen(examen).icono, '🔗', '🔗 para lo externo…');
eq(etiquetaDeOrigen({ origen: ORIGEN_INTERNO }).icono, '⚡', '…y ⚡ para lo de JosStyle (apartado 9)');
eq(etiquetaDeOrigen(examen).calendario, 'Estudios',
  '⚠️ y dice de qué calendario: *"Google Calendar · Estudios"* (apartado 8)');

console.log('\n═══ 4. LAS HORAS, Y EL UTC (apartados 24 y 30) ═══\n');

eq(fechaHoraDeICS('20260903'), { fecha: '2026-09-03', hora: '', todoElDia: true },
  'una fecha suelta es un evento de todo el día');
eq(fechaHoraDeICS('20260903T173000'), { fecha: '2026-09-03', hora: '17:30', todoElDia: false },
  'una hora sin zona se toma tal cual: ya viene en la del calendario');
const nocturno = fechaHoraDeICS('20260903T233000Z');
ok(nocturno && /^\d{4}-\d{2}-\d{2}$/.test(nocturno.fecha) && /^\d{2}:\d{2}$/.test(nocturno.hora),
  '🚨 y una hora en UTC se pasa al reloj del usuario: un evento de las 23:30 no puede salir el día siguiente (apartado 24)');
eq(fechaHoraDeICS('no es una fecha'), null, 'y algo que no es una fecha no se inventa');
eq(fechaHoraDeICS(''), null, 'ni una vacía');

console.log('\n═══ 5. NO DUPLICAR, Y NUNCA POR EL TÍTULO (apartados 13, 21 y 32) ═══\n');

const plan = planDeImportacion(eventos, eventos);
eq([plan.entran.length, plan.repetidos], [0, 2],
  '🚨 importar lo mismo dos veces no crea nada: *"si el evento ya está sincronizado, no volver a crear otro"* (apartado 21)');
eq(planDeImportacion([], eventos).entran.length, 2, 'y sobre un calendario vacío entran los dos');

// 🚨 El caso que el apartado 32 nombra expresamente.
/* ⚠️ La hora sale de la misma conversión que el evento externo, no escrita a
   mano: esta prueba dice "mismo título y MISMA HORA no son el mismo evento", y
   con horas distintas pasaría por el motivo equivocado —sin comparar nada. */
const mismoTitulo = [{ id: 'i1', titulo: 'Examen de Biolog,ía', fecha: inicioEsperado.fecha, horaInicio: inicioEsperado.hora, origen: ORIGEN_INTERNO }];
eq(planDeImportacion(mismoTitulo, [examen]).entran.length, 1,
  '🚨 UN EVENTO INTERNO CON EL MISMO TÍTULO Y HORA **NO** SE TOMA POR EL MISMO: *"solo vincularlos mediante identificadores reales"* (apartado 32)');

ok(yaImportado(eventos, 'abc-123@google.com'), 'se reconoce lo ya importado por su identificador');
ok(!yaImportado(eventos, 'otro-id'), 'y lo que no está, no');
ok(!yaImportado(eventos, null), '⚠️ y sin identificador NUNCA se da por importado: sería adivinar');
ok(!yaImportado(eventos, 'abc-123@google.com', 'otra@cuenta'),
  '⚠️ dos cuentas distintas son dos conexiones distintas (apartado 24)');

console.log('\n═══ 6. DESCONECTAR SIN PERDER NADA (apartado 25) ═══\n');

const mezcla = [...eventos, { id: 'mio', titulo: 'Entrenamiento', origen: ORIGEN_INTERNO }];
const sinConfirmar = planDeDesconexion(mezcla, 'google');
eq(sinConfirmar.eventos, null,
  '🚨 sin confirmar no se escribe nada: el `aplicarPlan` de siempre');
eq(sinConfirmar.internosIntactos, 1,
  '🚨 y se dice cuántos eventos de JosStyle NO se tocan: *"no borrar automáticamente los eventos internos"*');

const conservando = planDeDesconexion(mezcla, 'google', { confirmado: true, conservar: true });
eq(conservando.eventos.length, 3,
  '⚠️ conservando la copia importada, no se va ninguno (apartado 25)');
const quitando = planDeDesconexion(mezcla, 'google', { confirmado: true, conservar: false });
eq(quitando.eventos.length, 1,
  '⚠️ y sin conservarla se van los suyos…');
eq(quitando.eventos[0].titulo, 'Entrenamiento',
  '🚨 …pero el evento de JosStyle SIGUE AHÍ: es lo que el apartado 25 protege');
ok(conservando.explica && quitando.explica, 'y cada camino explica qué pasa');

console.log('\n═══ 7. LOS ESTADOS Y LA ÚLTIMA SINCRONIZACIÓN (apartados 28, 29, 30 y 31) ═══\n');

ok(Object.values(ESTADOS_CONEXION).every((e) => e.internosOk),
  '🚨 EN TODOS LOS ESTADOS, los eventos internos siguen funcionando: el enunciado lo repite en el 29 y el 30');
ok(ESTADOS_CONEXION.caducada.puedeReintentar && ESTADOS_CONEXION.error.puedeReintentar,
  '⚠️ una conexión caducada o con error se puede reintentar (apartados 28 y 29)');
ok(Object.values(ESTADOS_CONEXION).filter((e) => e.explica).every((e) => /JosStyle siguen igual/.test(e.explica)),
  '⚠️ y todos dicen que sus datos siguen igual, que es lo que quita el susto');
ok(!Object.values(ESTADOS_CONEXION).some((e) => e.explica && TECNICAS.test(e.explica)),
  '⚠️ sin palabras técnicas (EH F62)');

eq(ultimaSincronizacion(null), null,
  '🚨 sin haber importado nunca no se dice una fecha: inventarla daría una confianza falsa (apartado 31)');
ok(/hace un momento|hace \d+ min/.test(ultimaSincronizacion(new Date(Date.now() - 5 * 60000).toISOString())),
  '⚠️ y con algo importado, *"sincronizado hace 5 min"* (apartado 31)');
ok(/hace \d+ h/.test(ultimaSincronizacion(new Date(Date.now() - 3 * 3600000).toISOString())), 'en horas si hace más');
ok(/Última sincronización/.test(ultimaSincronizacion(new Date(Date.now() - 3 * 86400000).toISOString())),
  'y con la fecha si hace días');
eq(ultimaSincronizacion('no es una fecha'), null, 'y algo que no es una fecha no se pinta');

console.log('\n═══ 8. UN ARCHIVO QUE NO VALE, Y LO QUE NO SE HACE ═══\n');

eq(leerICS('hola').eventos, [], 'un archivo que no es un calendario no da eventos');
ok(/no es un calendario/.test(leerICS('hola').error),
  '⚠️ y lo dice con una frase que se entiende, no con un código (EH F62)');
ok(/no tiene ningún evento/.test(leerICS('BEGIN:VCALENDAR\nEND:VCALENDAR').error),
  '⚠️ y un calendario vacío también');
eq(leerICS('').eventos, [], 'y un archivo vacío no revienta');

ok(NO_EN_ESTA_FASE_EXTERNOS.length >= 4 && NO_EN_ESTA_FASE_EXTERNOS.every((x) => x.porque),
  '⚠️ lo que no se hace está escrito con su motivo, para que nadie lo dé por pendiente');
ok(NO_EN_ESTA_FASE_EXTERNOS.some((x) => /Google y Outlook/.test(x.que)),
  '⏸ empezando por la conexión con la cuenta');

console.log('\n═══ 9. NI UN SECRETO, NI UN CALENDARIO PARALELO (apartados 22 y 26) ═══\n');

const LIB = sinComentarios(leer('src/lib/calendariosExternos.js'));
// 🚨 El apartado 26 — nunca un token en el frontend.
for (const secreto of ['client_secret', 'clientSecret', 'access_token', 'refresh_token', 'localStorage']) {
  ok(!new RegExp(secreto, 'i').test(LIB),
    `🚨 no aparece \`${secreto}\`: *"nunca almacenar en localStorage, código frontend o variables accesibles públicamente"* (apartado 26)`);
}
ok(!/saveData\(|supabase\./i.test(LIB),
  '🚨 esta capa lee y convierte; quien guarda es `App.jsx`');
for (const copia of ['external_events', 'DEFAULT_EXTERNOS', 'normalizarExterno', 'calendarioExternoStore']) {
  ok(!new RegExp(copia, 'i').test(LIB),
    `🚨 ni un almacén paralelo: *"las integraciones NO deben sustituir al calendario interno"*`);
}

const AJUSTES = sinComentarios(leer('src/views/SettingsView.jsx'));
ok(/PROVEEDORES\.map/.test(AJUSTES) && /LO_QUE_NECESITA_JOSUE\.map/.test(AJUSTES),
  '🚨 Ajustes enseña los tres proveedores y lo que hace falta para conectarlos de verdad (apartado 1)');
ok(!/Conectar Google Calendar|Conectar Outlook/.test(AJUSTES),
  '⏸ y NO hay un botón "Conectar Google Calendar": no podría conectar nada (regla 8)');
ok(/leerICS\(/.test(AJUSTES) && /planDeImportacion\(/.test(AJUSTES),
  '🍎 lo que sí hay es añadir el archivo, y pasa por el plan que no duplica');

const APP = sinComentarios(leer('src/App.jsx'));
ok(/onImportarEventos=/.test(APP),
  '🚨 y ALGUIEN LO ESCRIBE: una función que nadie llama no falla nunca');
ok(/eventos: \[\.\.\.calendario\.eventos, \.\.\.evs\]/.test(APP),
  '🚨 en `calendario.eventos`, la lista de siempre: por eso salen en Hoy, en la Agenda y en el Calendario (apartados 10, 11 y 12)');

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
