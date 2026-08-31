// ============================================================================
// EH · Fase 38/65 — Notificaciones y recordatorios
//
// Las catorce pruebas del apartado 15, y lo que gobierna la fase:
//   · este archivo DECIDE; `notificaciones.js` MANDA
//   · TODO nace apagado, y sin encenderlo no se avisa de nada
//   · ni un horario de silencio ni un interruptor global nuevos
//   · silenciar un módulo NO es desactivarlo
//   · ni un historial paralelo
//   · y las recomendaciones no se vuelven avisos solas
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre, moduloEH,
  guardarConfig,
} from '../src/lib/estiloDeHombre.js';
import { MODULO_ANFITRION } from '../src/lib/miEstilo.js';
import { desactivarModulo, estadoDe } from '../src/lib/gestionEstilo.js';
import { PRIORIDADES_AVISO } from '../src/lib/avisosHorario.js';
import {
  TIPOS_AVISO_EH, tipoAvisoEH, IDS_TIPOS_EH, TEXTOS_AVISOS_EH, REPETICIONES, repeticion,
  tocaRecordatorio, DEFAULT_AVISOS_EH, normalizarRecordatorio, normalizarAvisosEH,
  datosAvisosEH, tipoActivo, alternarTipo, estaSilenciado, alternarSilencio,
  avisosActivados, desactivarAvisosEH, activarAvisosEH, crearRecordatorio,
  borrarRecordatorio, recordatoriosDe, avisosDeEstilo, MAXIMO_SUELTOS_EH,
  agruparAvisosEH, resumenAvisosEH, auditarAvisosEH, textosDeAvisosEH, panelAvisosEH,
} from '../src/lib/avisosEstilo.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-08-29';          // sábado
const dias = (d) => {
  const f = new Date(`${HOY}T00:00:00`);
  f.setDate(f.getDate() + d);
  // 🐛 Día LOCAL, no UTC: con toISOString, en España dias(1) devolvía HOY.
  return f.toLocaleDateString('sv-SE');
};
const TODOS_EH = ['estilo', 'skincare', 'pelo', 'barba', 'perfumes', 'sonrisa', 'accesorios', 'gustos'];
const con = (ids) => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ids);
const FUENTE = readFileSync(new URL('../src/lib/avisosEstilo.js', import.meta.url), 'utf8');
const SIN_COMENTARIOS = FUENTE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** Un estado con dos perfumes y una rutina de piel pendiente hoy. */
const conCosas = () => {
  let e = con(TODOS_EH);
  e = guardarConfig(e, 'perfumes', {
    perfumes: {
      perfumes: [{ id: 'pf1', nombre: 'Uno' }, { id: 'pf2', nombre: 'Dos' }],
      historial: [], partes: { historial: true },
    },
  });
  e = guardarConfig(e, 'skincare', {
    rutinas: {
      rutinas: [{ id: 'r1', nombre: 'Mañana', pasos: [{ id: 'p1', accion: 'limpieza' }], activa: true, momento: 'manana', frecuencia: 'diario' }],
      hechos: [],
    },
  });
  return e;
};

console.log('\n🔔  EH · Fase 38/65 — Notificaciones y recordatorios\n');

/* ===========================================================================
   Test 1 — ⚠️ ESTE ARCHIVO DECIDE; `notificaciones.js` MANDA (apartado 1)
   =========================================================================== */
console.log('Test 1 — ⚠️ *"no crear otro sistema"*');
{
  eq(auditarAvisosEH().sistemasDeNotificacion, 0,
    '⚠️ cero sistemas de notificación nuevos: el de la Fase A4');
  /* ⚠️ **Sobre el CÓDIGO, no sobre los comentarios**: la cabecera dice
     literalmente que aquí no se llama a `new Notification`, y buscar la palabra
     en el archivo entero saltaría con la frase que promete lo contrario. Séptima
     vez de la misma lección en este bloque. */
  ok(!/new Notification|requestPermission|showNotification/.test(SIN_COMENTARIOS),
    '⚠️ y aquí NO se manda ni una: este archivo decide, `notificaciones.js` manda');
  eq(auditarAvisosEH().horariosDeSilencio, 0,
    '⚠️ cero horarios de silencio nuevos (apartado 7)');
  ok(!/horarioDescanso|dentroDeHorario/.test(SIN_COMENTARIOS),
    'y el código no reimplementa el descanso: sería el peor duplicado posible');
  eq(auditarAvisosEH().interruptoresGlobales, 0,
    '⚠️ cero interruptores globales nuevos (apartado 11)');
  eq(auditarAvisosEH().historialesPropios, 0,
    '⚠️ y cero historiales paralelos (apartado 13)');
  ok(!('enviados' in DEFAULT_AVISOS_EH) && !('historial' in DEFAULT_AVISOS_EH),
    '⚠️ el almacén no tiene dónde guardar un aviso enviado');
  ok(TEXTOS_AVISOS_EH.sinHistorial.includes('todavía no guarda'),
    '⚠️ y se dice la verdad: JosStyle no tiene historial global, así que aquí tampoco (regla 8)');
  ok(TEXTOS_AVISOS_EH.delSistemaGlobal.includes('los de JosStyle'),
    'y de quién son el interruptor y el horario de silencio');

  // ⚠️ La prioridad y los motivos son los de HT F10, importados.
  ok(PRIORIDADES_AVISO.length > 0 && /from '\.\/avisosHorario'/.test(FUENTE),
    '⚠️ la prioridad y los motivos de rechazo se importan de HT F10: ni una copia');
}

/* ===========================================================================
   Test 2 — ⚠️ TODO NACE APAGADO (regla principal · apartados 2 y 3)
   =========================================================================== */
console.log('\nTest 2 — ⚠️ *"desactivadas hasta que el usuario las active"*');
{
  eq(auditarAvisosEH().encendidosPorDefecto, 0,
    '⚠️ NINGÚN tipo viene encendido de fábrica');
  ok(TIPOS_AVISO_EH.every((t) => t.porDefecto === false), 'los seis, sin excepción');
  eq(datosAvisosEH(conCosas()).tipos, {}, 'y el almacén nace vacío');
  eq(normalizarAvisosEH({}).tipos, {}, '⚠️ sin decir nada, apagado: nunca al revés');

  /* ⚠️ Con una rutina pendiente y dos perfumes, y NADA encendido: ni un aviso. */
  const e = conCosas();
  eq(avisosDeEstilo(e, { hoy: HOY }), [],
    '⚠️ con cosas que avisar pero nada encendido, NI UN AVISO (apartado 3 · prueba 1)');
  ok(TEXTOS_AVISOS_EH.todoApagado.includes('Solo te avisamos de lo que enciendas tú'),
    'y se dice en la pantalla');
  ok(TEXTOS_AVISOS_EH.nadaSinPermiso.includes('no hayas encendido'), 'con su promesa');

  const conRutina = alternarTipo(e, 'rutina_piel');
  eq(tipoActivo(conRutina, 'rutina_piel'), true, 'se puede encender uno (prueba 1)');
  const av = avisosDeEstilo(conRutina, { hoy: HOY });
  eq(av.length, 1, '⚠️ y entonces SÍ avisa, pero solo de eso');
  eq(av[0].tipo, 'rutina_piel', 'del tipo que encendió');
  eq(av[0].destino.zona, 'rutina', '⚠️ y con su destino: *"abrir directamente la rutina"* (apartado 14)');
  eq(av[0].destino.modulo, 'skincare', 'en su módulo');
  eq(tipoActivo(alternarTipo(conRutina, 'rutina_piel'), 'rutina_piel'), false, 'y se apaga igual');
  eq(normalizarEstiloHombre(alternarTipo(e, 'inventado')), normalizarEstiloHombre(e),
    'un tipo que no existe no se enciende');

  /* ⚠️ Apartado 3 — *"hace 7 días que no te afeitas"* NO se manda si nunca lo
     configuró: sin frecuencia dicha y sin un registro, no hay aviso. */
  const conAfeitado = alternarTipo(e, 'afeitado');
  eq(avisosDeEstilo(conAfeitado, { hoy: HOY }).length, 0,
    '⚠️ y el aviso de afeitado NO sale sin que él haya dicho cada cuánto (apartado 3)');
}

/* ===========================================================================
   Test 3 — ⚠️ SILENCIAR NO ES DESACTIVAR (apartado 6 · prueba 7)
   =========================================================================== */
console.log('\nTest 3 — 🔕 *"sin desactivar el módulo completo"*');
{
  const e = alternarTipo(conCosas(), 'perfume_rotacion');
  eq(avisosDeEstilo(e, { hoy: HOY }).length, 1, 'de partida avisa de los perfumes');

  const mudo = alternarSilencio(e, 'perfumes');
  eq(estaSilenciado(mudo, 'perfumes'), true, 'se puede silenciar un módulo (prueba 7)');
  eq(avisosDeEstilo(mudo, { hoy: HOY }).length, 0, 'y deja de avisar');
  /* ⚠️ Pero NO se desactiva: sigue funcionando y sigue en la portada. */
  eq(estadoDe(mudo, 'perfumes'), 'activo',
    '⚠️ y el módulo sigue ACTIVO: silenciar no es desactivar (apartado 6)');
  eq(tipoActivo(mudo, 'perfume_rotacion'), true, 'ni se apaga el tipo de aviso');
  ok(TEXTOS_AVISOS_EH.silenciarNoApaga.includes('no lo desactiva'), 'y se dice');
  eq(estaSilenciado(alternarSilencio(mudo, 'perfumes'), 'perfumes'), false, 'y se puede quitar');
  eq(avisosDeEstilo(alternarSilencio(mudo, 'perfumes'), { hoy: HOY }).length, 1, 'y vuelve a avisar');
  eq(datosAvisosEH(alternarSilencio(e, 'inventado')).silenciados, [], 'un módulo que no existe no se silencia');

  /* ⚠️ Y un módulo DESACTIVADO (F36) tampoco avisa: dejó de funcionar. */
  const off = desactivarModulo(e, 'perfumes');
  eq(avisosDeEstilo(off, { hoy: HOY }).length, 0,
    '⚠️ un módulo desactivado no avisa: dejó de funcionar (F36, apartado 4)');
  eq(estaSilenciado(off, 'perfumes'), false, 'sin haberlo silenciado: son dos cosas');
}

/* ===========================================================================
   Test 4 — DESACTIVAR TODO (apartado 12 · pruebas 8 y 9)
   =========================================================================== */
console.log('\nTest 4 — 🔕 desactivar los avisos de Estilo');
{
  const e = alternarTipo(alternarTipo(conCosas(), 'perfume_rotacion'), 'rutina_piel');
  eq(avisosDeEstilo(e, { hoy: HOY }).length, 2, 'de partida avisa de dos cosas');
  eq(avisosActivados(e), true, 'y están activados');

  const off = desactivarAvisosEH(e);
  eq(avisosActivados(off), false, 'se puede desactivar todo (prueba 8)');
  eq(avisosDeEstilo(off, { hoy: HOY }), [], 'y no queda ni un aviso');
  eq(resumenAvisosEH(off, { hoy: HOY }).hoy, null,
    '⚠️ apagado devuelve `null`, no 0 (lección de la F25)');
  /* ⚠️ *"Los datos y configuraciones permanecen."* */
  eq(datosAvisosEH(off).tipos, datosAvisosEH(e).tipos,
    '⚠️ y lo que él había encendido SIGUE ahí (apartado 12)');
  ok(TEXTOS_AVISOS_EH.desactivarNoBorra.includes('no se tocan'), 'y se dice');
  eq(avisosDeEstilo(activarAvisosEH(off), { hoy: HOY }).length, 2,
    'y al reactivar vuelve todo como estaba (prueba 9)');
}

/* ===========================================================================
   Test 5 — LOS RECORDATORIOS (apartados 4 y 5 · pruebas 2, 3 y 10)
   =========================================================================== */
console.log('\nTest 5 — 🔔 recordarme');
{
  eq(REPETICIONES.map((r) => r.nombre), ['Una vez', 'Diariamente', 'Semanalmente', 'Personalizado'],
    'las cuatro del apartado 5');
  eq(repeticion('inventada'), null, 'una que no existe da null');

  const e = alternarTipo(conCosas(), 'recordatorio');
  eq(recordatoriosDe(e), [], 'de partida no hay ninguno');
  ok(TEXTOS_AVISOS_EH.sinRecordatorios.includes('Todavía no'), 'y se dice');

  const r = crearRecordatorio(e, { texto: 'Comprar champú', fecha: HOY, hora: '20:00', repeticion: 'una_vez', modulo: 'pelo' });
  eq(r.error, null, 'se puede crear uno (prueba 2)');
  eq(recordatoriosDe(r.estado).length, 1, 'y se guarda');
  eq(r.recordatorio.hora, '20:00', 'con su hora (prueba 3)');
  eq(r.recordatorio.modulo, 'pelo', 'y su módulo, para abrirlo al tocarlo (apartado 14)');

  eq(crearRecordatorio(e, { texto: 'x' }).error, 'Un recordatorio necesita una fecha.', 'sin fecha, no');
  eq(crearRecordatorio(e, { fecha: HOY }).error, 'Un recordatorio necesita un texto.', 'sin texto, tampoco');
  eq(crearRecordatorio(e, { texto: 'x', fecha: HOY, repeticion: 'personalizado' }).error,
    'Elige los días en los que quieres que se repita.', '⚠️ y "personalizado" sin días, tampoco');
  eq(normalizarRecordatorio({ fecha: HOY, hora: '25:99' }).hora, '09:00',
    "⚠️ y `'25:99'` NO es una hora: la forma no basta (lección de la F11)");
  eq(normalizarRecordatorio({ hora: '08:00' }), null, 'sin fecha no hay recordatorio');

  /* Apartado 5 — la repetición se CALCULA, nunca se materializa (regla 11). */
  const unaVez = { fecha: HOY, repeticion: 'una_vez', dias: [] };
  eq(tocaRecordatorio(unaVez, HOY), true, 'una vez toca su día');
  eq(tocaRecordatorio(unaVez, dias(1)), false, 'y no el siguiente');
  const diaria = { fecha: HOY, repeticion: 'diaria', dias: [] };
  eq(tocaRecordatorio(diaria, dias(5)), true, 'la diaria toca todos los días (prueba 10)');
  eq(tocaRecordatorio(diaria, dias(-1)), false, '⚠️ pero no antes de haberla creado');
  const semanal = { fecha: HOY, repeticion: 'semanal', dias: [] };
  eq(tocaRecordatorio(semanal, dias(7)), true, 'la semanal, cada siete');
  eq(tocaRecordatorio(semanal, dias(3)), false, 'y no en medio');
  const propio = { fecha: HOY, repeticion: 'personalizado', dias: [1, 3] };
  eq(tocaRecordatorio(propio, dias(2)), true, 'la personalizada, en sus días (lunes)');
  eq(tocaRecordatorio(propio, dias(1)), false, 'y no en los demás');
  eq(tocaRecordatorio(null, HOY), false, 'y un recordatorio vacío no toca nunca');
  ok(!/fechas:\s*\[|ocurrencias/.test(SIN_COMENTARIOS),
    '⚠️ y NO se materializan las fechas: se guarda la regla (regla 11)');

  const av = avisosDeEstilo(r.estado, { hoy: HOY });
  ok(av.some((x) => x.titulo === 'Comprar champú'), 'y llega el día que toca (prueba 4)');
  eq(av.find((x) => x.titulo === 'Comprar champú').destino.modulo, 'pelo',
    '⚠️ y lleva al módulo correcto, no a la portada (apartado 14 · prueba 6)');
  eq(recordatoriosDe(borrarRecordatorio(r.estado, r.recordatorio.id)), [], 'y se puede borrar');
}

/* ===========================================================================
   Test 6 — AGRUPAR (apartados 8 y 9 · pruebas 11 y 12)
   =========================================================================== */
console.log('\nTest 6 — *"hoy tienes 2 cosas relacionadas con Estilo"*');
{
  const e = ['rutina_piel', 'perfume_rotacion'].reduce((acc, t) => alternarTipo(acc, t), conCosas());
  const av = avisosDeEstilo(e, { hoy: HOY });
  eq(av.length, 2, 'salen dos avisos sueltos (prueba 11)');

  const grupo = agruparAvisosEH(av);
  eq(grupo.length, 1, '⚠️ y se agrupan en UNO (apartado 8 · prueba 12)');
  eq(grupo[0].agrupado, true, 'marcado como agrupado');
  eq(grupo[0].titulo, 'Hoy tienes 2 cosas relacionadas con Estilo',
    '⚠️ con la frase LITERAL del apartado 9');
  eq(grupo[0].incluye.length, 2, 'y diciendo cuáles incluye');
  eq(grupo[0].destino.modulo, null,
    '⚠️ y el resumen lleva a la portada: no puede abrir dos sitios a la vez');

  eq(agruparAvisosEH([av[0]]).length, 1, 'con uno solo no se agrupa');
  eq(agruparAvisosEH([av[0]])[0].agrupado, undefined, 'y ese va tal cual');
  eq(agruparAvisosEH([]), [], 'y sin avisos, nada');
  eq(MAXIMO_SUELTOS_EH, 1, 'a partir de dos, resumen');
  /* ⚠️ El mecanismo es el de HT F10; la frase es de ESTE enunciado. */
  ok(grupo[0].titulo !== `${av.length} cosas hoy`,
    '⚠️ y la frase NO es la del horario: las etiquetas son de cada módulo (lección de la F33)');
}

/* ===========================================================================
   Test 7 — LAS RECOMENDACIONES NO AVISAN SOLAS (apartado 10)
   =========================================================================== */
console.log('\nTest 7 — ⚠️ 💡 solo si él lo enciende');
{
  eq(auditarAvisosEH().recomendacionesAutomaticas, 0,
    '⚠️ cero recomendaciones que notifiquen solas');
  const e = conCosas();
  ok(!avisosDeEstilo(e, { hoy: HOY }).some((x) => x.tipo === 'ideas'),
    '⚠️ con las ideas encendidas en su módulo, NO avisan (apartado 10)');
  const conIdeas = alternarTipo(e, 'ideas');
  ok(avisosDeEstilo(conIdeas, { hoy: HOY }).some((x) => x.tipo === 'ideas'),
    'y solo avisan si enciende *"avisarme de nuevas ideas"*');
  eq(tipoAvisoEH('ideas').porDefecto, false, 'que viene apagado como los demás');
}

/* ===========================================================================
   Test 8 — EL CATÁLOGO, EL PANEL Y LA PERSISTENCIA (prueba 14)
   =========================================================================== */
console.log('\nTest 8 — una línea por tipo, y lo que sobrevive');
{
  TIPOS_AVISO_EH.forEach((t) => {
    ok(!!moduloEH(t.modulo), `el tipo "${t.id}" apunta a un módulo del catálogo`);
    ok(!!t.categoria && !!t.icono && !!t.nombre, 'con su categoría, icono y nombre');
  });
  ok(new Set(IDS_TIPOS_EH).size === TIPOS_AVISO_EH.length, 'ningún id repetido');
  eq(tipoAvisoEH('inventado'), null, 'un tipo que no existe da null');
  /* ⚠️ Los cuatro grupos del apartado 2 tienen tipo. */
  ['skincare', 'barba', 'perfumes'].forEach((mod) => {
    ok(TIPOS_AVISO_EH.some((t) => t.modulo === mod), `y ${mod} tiene el suyo (apartado 2)`);
  });

  const e = alternarSilencio(
    alternarTipo(crearRecordatorio(conCosas(), { texto: 'Algo', fecha: HOY }).estado, 'rutina_piel'),
    'pelo',
  );
  const guardado = datosAvisosEH(e);
  const releido = normalizarAvisosEH(JSON.parse(JSON.stringify(guardado)));
  eq(releido, guardado, '⚠️ guardar y volver a leer devuelve lo mismo (regla 5 · prueba 14)');
  Object.keys(DEFAULT_AVISOS_EH).forEach((k) => {
    ok(k in releido, `el campo "${k}" sobrevive al normalizador`);
  });
  eq(normalizarAvisosEH(null), DEFAULT_AVISOS_EH, 'un guardado corrupto cae en el defecto');
  eq(normalizarAvisosEH({ tipos: { fantasma: true } }).tipos, {},
    '⚠️ un tipo de otra versión no revive');
  eq(normalizarAvisosEH({ silenciados: ['fantasma', 'pelo'] }).silenciados, ['pelo'],
    'ni un módulo retirado del catálogo');

  const cfg = normalizarEstiloHombre(e).modulos.find((m) => m.id === MODULO_ANFITRION).config;
  ok('avisos' in cfg, 'vive en el módulo anfitrión');

  const p = panelAvisosEH(e, { hoy: HOY });
  eq(p.titulo, '🔔 Avisos de Estilo de hombre', 'el panel trae su título');
  eq(p.tipos.length, TIPOS_AVISO_EH.length, 'y los seis tipos');
  ok(p.tipos.every((t) => 'puesto' in t && 'silenciado' in t), 'con su marca y su silencio');
  eq(p.silenciados.map((m) => m.id), ['pelo'], 'los módulos silenciados');
  eq(p.recordatorios.length, 1, 'sus recordatorios');
  ok(Array.isArray(p.hoy), 'y lo que se mandaría hoy, ya agrupado');

  const r = resumenAvisosEH(e, { hoy: HOY });
  eq(r.total, TIPOS_AVISO_EH.length, 'el resumen cuenta los tipos');
  eq(r.encendidos, 1, 'y cuántos encendió');
  eq(r.silenciados, 1, 'y cuántos silenció');

  ok(textosDeAvisosEH().every((t) => typeof t === 'string' && t.length > 0), 'ningún texto vacío');
  ok(!textosDeAvisosEH().some((t) => /\bdeberías\b|tienes que|\bdebes\b/i.test(t)),
    '⚠️ y ninguno dice *"deberías hacer tu rutina"* (apartado 3)');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
