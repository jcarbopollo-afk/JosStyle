// ============================================================================
// ENTREGA 3 · FASE 11 (HC F6) — NOTIFICACIONES Y RECORDATORIOS REALES
//
// 🚨 **El enunciado abre con la regla que gobierna todo:** *"NO crear un sistema
// paralelo de recordatorios. Las notificaciones deben utilizar las tareas,
// eventos y recordatorios existentes."*
//
// 🚨 **Y la segunda condición es la honestidad** (apartados 7, 23 y 24): *"no
// fingir que se programó"*, *"no prometer funcionalidad que la plataforma no
// soporte"*, *"si una capacidad no puede garantizarse desde Safari/PWA: mostrar
// una explicación clara. No simularla."*
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ANTICIPACIONES, anticipacion, MINUTOS_POR_DEFECTO,
  TIPOS_AVISO, tipoAviso, tiposProgramables,
  CAPACIDADES, capacidad, loQueFunciona, loQueNo,
  ESTADOS_PERMISO, estadoPermiso, tocaOfrecerPermiso,
  CAMPOS_DE_AVISO, avisoPorDefecto, alternarAviso, ponerAnticipacion,
  minutoDelAviso, VENTANA_AVISO_MIN, avisosPendientes, cuerpoDelAviso,
  POR_QUE_NO_HAY_QUE_CANCELAR, YA_RESUELTO_AVISOS, NO_EN_ESTA_FASE_AVISOS,
} from '../src/lib/avisosPlanificacion.js';
import { DEFAULT_NOTIFICACIONES } from '../src/tokens.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
// ⚠️ Bloques primero, llaves vacías después (la lección de la E3 F5).
const sinComentarios = (t) => t
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\s*\}/g, '');

const HOY = '2026-09-05';

console.log('\n═══ 1. LA ANTICIPACIÓN (apartado 8) ═══\n');

eq(ANTICIPACIONES.map((a) => a.id), ['momento', '5min', '10min', '15min', '30min', '1h', '1dia'],
  '⚠️ las siete del enunciado, ni una más');
eq(ANTICIPACIONES.map((a) => a.minutos), [0, 5, 10, 15, 30, 60, 1440], 'con sus minutos');
eq(anticipacion('inventada').id, 'momento',
  '⚠️ y lo desconocido cae en "en el momento", que es lo que se entiende por "avísame a las 17:00"');
eq(MINUTOS_POR_DEFECTO, 0, 'el defecto son cero minutos');

console.log('\n═══ 2. UN INTERRUPTOR POR TIPO, PERO NO UN SEGUNDO JUEGO (apartado 27) ═══\n');

eq(TIPOS_AVISO.map((t) => t.id), ['evento', 'tarea', 'recordatorio', 'habito', 'pomodoro'],
  '⚠️ los cinco del apartado 27');
ok(TIPOS_AVISO.every((t) => t.categoria && DEFAULT_NOTIFICACIONES.categorias[t.categoria] !== undefined),
  '🚨 cada tipo apunta a una categoría QUE YA EXISTE en Ajustes: ni un segundo juego de interruptores');
ok(TIPOS_AVISO.every((t) => t.de),
  '🚨 y dice de qué entidad sale: *"no crear un sistema paralelo de recordatorios"*');
eq(tipoAviso('recordatorio').de, 'calendario.eventos (tipo: recordatorio)',
  '🚨 un recordatorio es un evento de ese tipo (E3 F8), no una entidad nueva');
eq(tipoAviso('habito').de, 'productividad.habitos',
  '⚠️ y los hábitos son los de Productividad: *"NO duplicar el sistema de hábitos"* (apartado 11)');
ok(tipoAviso('habito').sinHora && tipoAviso('habito').porque,
  '⚠️ un hábito no guarda hora, y se dice: ponerle una sería inventarse el dato');
eq(tiposProgramables().map((t) => t.id), ['evento', 'tarea', 'recordatorio', 'habito'],
  '⏸ el Pomodoro no se programa a una hora, y se declara así (apartado 12)');
ok(tipoAviso('pomodoro').porque, '⚠️ con su motivo escrito');

console.log('\n═══ 3. LO QUE LA PLATAFORMA NO PUEDE, Y SE DICE (apartados 23 y 24) ═══\n');

ok(loQueFunciona().some((c) => c.id === 'app_abierta'),
  '⚠️ con la aplicación abierta el aviso sale de verdad');
ok(loQueNo().some((c) => c.id === 'app_cerrada'),
  '🚨 con la aplicación CERRADA no sale nada, y se declara: hace falta un service worker (apartado 23)');
ok(loQueNo().some((c) => c.id === 'iphone_instalada'),
  '🚨 y en el iPhone hace falta además tenerla en la pantalla de inicio (apartado 24)');
ok(CAPACIDADES.every((c) => c.explica && c.explica.length > 20),
  '🚨 cada una con su explicación: *"si una capacidad no puede garantizarse, mostrar una explicación clara. No simularla."*');
// 🚨 EH F62 — ni una palabra técnica en un texto que ve el usuario.
/* 🐛 **"service worker" es una palabra técnica, y estaba en el texto.** La lista
   se quedó corta y lo cazó el recorrido en Chromium, no esta prueba: si el
   barrido de Node no conoce el término, su silencio parece un aprobado. */
const TECNICAS = /\bnull\b|\btoken\b|\bJSON\b|\bAPI\b|\bundefined\b|\bpayload\b|service worker|push\b|endpoint/i;
ok(!CAPACIDADES.some((c) => TECNICAS.test(c.explica)),
  '⚠️ y sin palabras técnicas: los lee Josué, no un programador (EH F62)');
eq(capacidad('inventada'), null, 'una capacidad que no existe no se inventa');

console.log('\n═══ 4. EL PERMISO (apartados 1, 2 y 7) ═══\n');

eq(Object.keys(ESTADOS_PERMISO).sort(), ['default', 'denied', 'granted', 'no-soportado'],
  '⚠️ los cuatro estados del apartado 2');
ok(Object.values(ESTADOS_PERMISO).every((e) => e.nombre && e.explica),
  '🚨 y cada uno dice qué pasa: un estado sin salida es una pantalla rota (EH F41)');
eq(Object.values(ESTADOS_PERMISO).filter((e) => e.puedeActivar).map((e) => e.id), ['default'],
  '🚨 solo se puede activar desde "sin decidir": si el navegador dijo que no, se dice dónde cambiarlo');
ok(/ajustes/i.test(ESTADOS_PERMISO.denied.explica),
  '⚠️ y bloqueadas explica que se cambia en el navegador, no aquí');

// En Node no hay `Notification`, así que el estado es "no disponible" — y eso ya
// prueba que la función no revienta fuera de un navegador.
eq(estadoPermiso().id, 'no-soportado', '⚠️ fuera de un navegador el estado es "no disponibles", sin reventar');
ok(!tocaOfrecerPermiso(true),
  '🚨 y sin soporte no se ofrece activar: sería un botón que no puede hacer nada (regla 8)');
ok(!tocaOfrecerPermiso(false), 'ni cuando no se acaba de crear nada (apartado 1)');

console.log('\n═══ 5. LOS DOS CAMPOS NUEVOS, Y SOLO DOS (apartados 5, 20 y 21) ═══\n');

eq(CAMPOS_DE_AVISO, ['notificar', 'anticipacion'],
  '🚨 solo dos campos nuevos: título, fecha, hora, nota, repetición y estado YA los tiene un evento');
eq(avisoPorDefecto(), false,
  '🚨 sin permiso, el aviso nace APAGADO: *"si no hay permisos, no fingir que se programó"* (apartado 7)');

const recordatorio = { id: 'r1', titulo: 'Llamar a Marcos', fecha: HOY, horaInicio: '18:00', tipo: 'recordatorio', notificar: true };
eq(alternarAviso(recordatorio).notificar, false, 'desactivar el aviso lo apaga…');
eq(alternarAviso(recordatorio).titulo, 'Llamar a Marcos',
  '🚨 …y NO borra el elemento: *"simplemente notification_enabled = false"* (apartado 20)');
eq(alternarAviso(alternarAviso(recordatorio)).notificar, true, 'y volver a activarlo lo programa otra vez (apartado 21)');
eq(alternarAviso(null), null, 'sin elemento no revienta');

eq(ponerAnticipacion(recordatorio, '15min').anticipacion, '15min', 'se puede poner una anticipación');
eq(ponerAnticipacion(recordatorio, 'inventada'), null,
  '⚠️ y una que no existe no se guarda: sería una mentira en el dato');

console.log('\n═══ 6. A QUÉ MINUTO TOCA (apartados 8 y 9) ═══\n');

eq(minutoDelAviso({ horaInicio: '17:00' }), 17 * 60, 'sin anticipación, a su hora');
eq(minutoDelAviso({ horaInicio: '17:00', anticipacion: '15min' }), 17 * 60 - 15,
  '🚨 con 15 minutos antes, a las 16:45 — el ejemplo del apartado 9');
eq(minutoDelAviso({ hora: '18:00', anticipacion: '1h' }), 17 * 60, 'una tarea usa su `hora`');
eq(minutoDelAviso({ horaInicio: '' }), null,
  '⚠️ sin hora no hay minuto: *"no obligar a configurar anticipación si no tiene sentido"*');
eq(minutoDelAviso({ horaInicio: '25:99' }), null,
  '🐛 y una hora imposible tampoco: la forma no basta (quinta vez)');

ok(/15 minutos/.test(cuerpoDelAviso({ horaInicio: '17:00', anticipacion: '15min' }, 'evento')),
  '⚠️ el texto del apartado 9: "empieza en 15 minutos"');
ok(!/0 minutos/.test(cuerpoDelAviso({ horaInicio: '17:00' }, 'evento')),
  '⚠️ y con "en el momento" no se dice "en 0 minutos", que no es español');
ok(/1 h/.test(cuerpoDelAviso({ hora: '18:00', anticipacion: '1h' }, 'tarea')), 'una hora se dice en horas');
ok(/mañana/.test(cuerpoDelAviso({ hora: '18:00', anticipacion: '1dia' }, 'tarea')), 'y un día antes, "es mañana"');

console.log('\n═══ 7. QUÉ TOCA AVISAR AHORA (apartados 13, 20 y 22) ═══\n');

const estado = {
  calendario: {
    eventos: [
      { id: 'e1', titulo: 'Entrenamiento', fecha: HOY, horaInicio: '17:00', tipo: 'entrenamiento', notificar: true, anticipacion: '15min' },
      { id: 'e2', titulo: 'Sin aviso', fecha: HOY, horaInicio: '17:00', tipo: 'personal', notificar: false },
      { id: 'r1', titulo: 'Llamar a Marcos', fecha: HOY, horaInicio: '18:00', tipo: 'recordatorio', notificar: true },
      { id: 'e3', titulo: 'De otro día', fecha: '2026-09-20', horaInicio: '17:00', tipo: 'personal', notificar: true },
    ],
  },
  productividad: { tareas: [{ id: 't1', texto: 'Estudiar', fecha: HOY, hora: '18:00', notificar: true }] },
};

const a1645 = avisosPendientes(estado, { hoy: HOY, ahora: '16:45' });
eq(a1645.map((a) => a.titulo), ['Entrenamiento'],
  '🚨 a las 16:45 toca el entrenamiento de las 17:00 con 15 minutos de antelación (apartado 9)');
eq(a1645[0].tipo, 'evento', 'con su tipo…');
eq(a1645[0].categoria, 'objetivos', '…y la categoría de Ajustes que le toca');

ok(!avisosPendientes(estado, { hoy: HOY, ahora: '16:45' }).some((a) => a.titulo === 'Sin aviso'),
  '🚨 lo que tiene el aviso apagado NO avisa, y sigue existiendo (apartado 20)');
ok(!avisosPendientes(estado, { hoy: HOY, ahora: '17:00' }).some((a) => a.titulo === 'De otro día'),
  '⚠️ y lo de otro día no se cuela');

const a1800 = avisosPendientes(estado, { hoy: HOY, ahora: '18:00' });
eq(a1800.map((a) => a.tipo).sort(), ['recordatorio', 'tarea'],
  '⚠️ a las 18:00 tocan el recordatorio y la tarea: los dos tipos avisan (apartados 9 y 10)');

// 🚨 Apartado 22 — nada de avisos atrasados.
eq(avisosPendientes(estado, { hoy: HOY, ahora: '20:00' }), [],
  '🚨 A LAS 20:00 NO SE AVISA DE NADA: *"no mostrar «evento de hace 3 horas»"* (apartado 22)');
eq(avisosPendientes(estado, { hoy: HOY, ahora: '16:30' }), [],
  '⚠️ y tampoco antes de que toque');
ok(VENTANA_AVISO_MIN > 0 && VENTANA_AVISO_MIN <= 30,
  '⚠️ la ventana es corta: es la diferencia entre avisar y dar la lata');
eq(avisosPendientes(estado, { hoy: HOY, ahora: '25:99' }), [],
  '🐛 y una hora imposible no dispara nada');
eq(avisosPendientes(null, { hoy: HOY, ahora: '17:00' }), [], 'sin estado no revienta');

console.log('\n═══ 8. NO HAY NADA QUE CANCELAR (apartados 18, 19 y 21) ═══\n');

eq(POR_QUE_NO_HAY_QUE_CANCELAR.apartados, [18, 19, 21],
  '⚠️ los tres apartados que piden cancelar la notificación al editar o borrar');
ok(/se calculan en el momento/.test(POR_QUE_NO_HAY_QUE_CANCELAR.porque),
  '🚨 y salen gratis porque no hay avisos guardados: se derivan del propio elemento');
// La prueba de verdad: cambiar la hora cambia el aviso, sin tocar nada más.
const movido = { ...estado, calendario: { eventos: [{ ...estado.calendario.eventos[0], horaInicio: '18:00' }] } };
eq(avisosPendientes(movido, { hoy: HOY, ahora: '16:45' }), [],
  '🚨 al mover el evento a las 18:00, el aviso de las 16:45 YA NO EXISTE: no queda ninguno viejo (apartado 18)');
eq(avisosPendientes(movido, { hoy: HOY, ahora: '17:45' }).length, 1,
  '🚨 y el nuevo sale a su hora, sin reprogramar nada');
eq(avisosPendientes({ calendario: { eventos: [] }, productividad: { tareas: [] } }, { hoy: HOY, ahora: '16:45' }), [],
  '🚨 y al borrarlo, su aviso desaparece con él (apartado 19)');

console.log('\n═══ 9. LO QUE YA ESTABA, Y LO QUE NO SE HACE ═══\n');

ok(YA_RESUELTO_AVISOS.length >= 8 && YA_RESUELTO_AVISOS.every((x) => x.apartado && x.con),
  '⚠️ lo que ya funcionaba se declara CON la función real que lo resuelve');
ok(YA_RESUELTO_AVISOS.some((x) => x.apartado === 28 && /horarioDescanso/.test(x.con)),
  '🚨 el horario de silencio es el de la Fase A4: un segundo horario es el peor duplicado posible');
ok(YA_RESUELTO_AVISOS.some((x) => x.apartado === 30 && /audioEngine/.test(x.con)),
  '🚨 y el sonido es el motor de SO F1: *"no crear un reproductor de sonidos independiente"*');
ok(NO_EN_ESTA_FASE_AVISOS.length >= 4 && NO_EN_ESTA_FASE_AVISOS.every((x) => x.porque),
  '⚠️ y lo que no se hace está escrito con su motivo');
ok(NO_EN_ESTA_FASE_AVISOS.some((x) => /router/i.test(x.que)),
  '⚠️ ni un router paralelo: el apartado 15 pide adaptarse al que existe');

console.log('\n═══ 10. DECIDE, NO MANDA (la regla del proyecto) ═══\n');

const LIB = sinComentarios(leer('src/lib/avisosPlanificacion.js'));
ok(!/new Notification|showNotification/.test(LIB),
  '🚨 este archivo NO manda ningún aviso: decide, y manda `notificaciones.js` (HT F10, EH F38)');
ok(!/requestPermission/.test(LIB),
  '🚨 y NO pide el permiso: *"no solicitarlo automáticamente nada más abrir la aplicación"* (apartado 1)');
ok(!/saveData\(|supabase\./i.test(LIB),
  '🚨 ni guarda: devuelve el elemento cambiado y escribe `App.jsx`');
for (const copia of ['DEFAULT_AVISOS', 'normalizarAviso', 'reminders', 'notification_queue']) {
  ok(!new RegExp(copia, 'i').test(LIB),
    `🚨 no existe \`${copia}\`: *"NO crear un sistema paralelo de recordatorios"*`);
}
// ⚠️ Los imports son lo que no se puede fingir: sin importar un segundo horario
// de silencio es imposible tener uno.
const IMPORTS = (LIB.match(/^import [\s\S]*?;$/gm) || []).join('\n');
ok(/notificaciones/.test(IMPORTS),
  '⚠️ y se apoya en el sistema de la Fase A4, en vez de reescribirlo');

console.log('\n═══ 11. EN LA PANTALLA ═══\n');

const AJUSTES = sinComentarios(leer('src/views/SettingsView.jsx'));
ok(/CAPACIDADES\.map/.test(AJUSTES),
  '🚨 Ajustes enseña lo que la plataforma puede y lo que NO (apartados 3, 23 y 24)');
ok(/todavía no/.test(AJUSTES),
  '⚠️ y lo que falta se dice con esas palabras, en vez de esconderlo');

const CAL = sinComentarios(leer('src/views/CalendarView.jsx'));
ok(/notificar: !ev\.notificar/.test(CAL),
  '⚠️ el evento tiene su interruptor de aviso (apartado 5)');
ok(/ANTICIPACIONES\.map/.test(CAL), '⚠️ y su lista de anticipación (apartado 8)');
ok(/notificar: avisoPorDefecto\(\)/.test(CAL),
  '🚨 y nace mirando el permiso REAL: sin permiso no se finge que quedó programado (apartado 7)');
ok(/estadoPermiso\(\)\.explica/.test(CAL),
  '⚠️ y si no hay permiso se dice ahí mismo, al lado del interruptor');

const HOY_VISTA = sinComentarios(leer('src/views/DashboardView.jsx'));
ok(/avisosPendientes\(/.test(HOY_VISTA),
  '🚨 y ALGUIEN LLAMA a `avisosPendientes`: una función que nadie llama no falla nunca');
ok(/notificarSiCorresponde\(notificaciones, av\.categoria/.test(HOY_VISTA),
  '🚨 que manda por el emisor de la Fase A4, con su categoría: ni un segundo emisor');
ok(/setInterval/.test(HOY_VISTA),
  '⚠️ y se mira cada minuto: un aviso de las 16:45 no puede esperar a que él toque algo');

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
