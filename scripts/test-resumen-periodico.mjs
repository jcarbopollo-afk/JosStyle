// ============================================================================
// EH · Fase 59/65 — Resumen semanal y mensual
//
// *"Un pequeño informe personal útil. No una obligación semanal. Y debe poder
// desaparecer completamente si el usuario no lo quiere."*
//
// Lo que vigila esta prueba:
//   · 🚨 que nazca APAGADO y que apagado NO genere nada
//   · que sin actividad no se fabrique un resumen artificial
//   · que el resumen esté dentro de la app aunque no haya avisos
//   · y que el historial guarde fechas y números, nunca los textos
// ============================================================================

import { normalizarEstiloHombre } from '../src/lib/estiloDeHombre.js';
import { tipoDeInsight as TIPO_F58 } from '../src/lib/insights.js';
import { alternarPermisoIA } from '../src/lib/iaEstilo.js';
import {
  FRECUENCIAS, frecuencia, DEFAULT_RESUMEN, MAX_HISTORIAL, normalizarResumen, datosResumen,
  cambiarFrecuencia, alternarAviso, estaActivo,
  SECCIONES, seccion, seccionesDe, TAMANOS, tamanoPara,
  TEXTOS_RESUMEN, generarResumen,
  MINIMO_PARA_COMPARAR, sePuedeComparar,
  avisoDelResumen, TEXTO_CORREGIR, corregirResumen,
  COMPARTIR, guardarEnHistorial, hayQueRegenerar, anteriores,
  IA_RESUMEN, iaPuedeContarlo,
  CASOS, caso, APARTADOS_RESUMEN, apartadoResumen, CONDICION,
  auditarResumen, panelResumen, tipoDeInsight,
} from '../src/lib/resumenPeriodico.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-06-01';
const h = (f) => ({ rutinaId: 'r1', fecha: f, pasos: ['p1'] });

const conActividad = () => normalizarEstiloHombre({
  configurado: true,
  modulos: [{
    id: 'skincare', activo: true, orden: 0,
    config: {
      rutinas: {
        rutinas: [{ id: 'r1', nombre: 'Mañana', orden: 0 }],
        hechos: [h('2026-05-30'), h('2026-05-28'), h('2026-05-26'), h('2026-05-24'), h('2026-04-20'), h('2026-04-15')],
      },
    },
  }],
});
const sinActividad = () => normalizarEstiloHombre({
  configurado: true,
  modulos: [{ id: 'skincare', activo: true, orden: 0, config: { rutinas: { rutinas: [], hechos: [] } } }],
});

console.log('\n🗓️ EH · Fase 59/65 — Resumen semanal y mensual\n');

/* ---------------------------------------------------------------------------
   1 · 🚨 NACE APAGADO, Y APAGADO NO GENERA NADA
   --------------------------------------------------------------------------- */
{
  console.log('1 · Apagado por defecto');
  const a = auditarResumen();
  eq(a.porDefectoApagado, true, '🚨 nace desactivado: un informe que nadie ha pedido es una obligación');
  eq(a.apagadoNoGenera, true, '🚨 ⚠️ y apagado NO se genera: no es que se esconda, es que no existe');
  eq(datosResumen(normalizarEstiloHombre({})), DEFAULT_RESUMEN, 'con sus valores por defecto');
  eq(estaActivo(normalizarEstiloHombre({})), false, 'y `estaActivo` lo dice');

  const r = generarResumen(conActividad(), { hoy: HOY });
  eq(r.activo, false, 'con actividad de sobra, si está apagado sigue sin generarse');
  eq(r.secciones, [], 'ni una sección');
  ok(/se encienden en Personalizar/.test(r.texto), 'y se dice dónde encenderlo, por si lo quiere');

  eq(FRECUENCIAS.map((f) => f.id), ['semanal', 'mensual', 'desactivado'], 'las tres opciones del apartado 5');
  ok(!frecuencia('inventada'), 'se buscan por id');
  eq(cambiarFrecuencia(conActividad(), 'inventada'), normalizarEstiloHombre(conActividad()),
    'una frecuencia que no existe no cambia nada');
  eq(normalizarResumen({ frecuencia: 'lo_que_sea' }).frecuencia, 'desactivado',
    '⚠️ y lo que se guarde raro cae en desactivado, no en activado');
}

/* ---------------------------------------------------------------------------
   2 · 🚨 SI NO HA PASADO NADA, NO SE INVENTA (apartado 3)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · Sin actividad');
  const r = generarResumen(cambiarFrecuencia(sinActividad(), 'semanal'), { hoy: HOY });
  eq(r.activo, true, 'el resumen está encendido…');
  eq(r.hay, false, '🚨 …pero no hay nada que contar');
  eq(r.secciones, [], 'ni una sección inventada');
  eq(r.texto, TEXTOS_RESUMEN.sinCambios, '⚠️ y el texto del apartado 3, con sus palabras');
  ok(/no hay cambios destacables/.test(TEXTOS_RESUMEN.sinCambios), 'literalmente');
  eq(generarResumen(cambiarFrecuencia(sinActividad(), 'mensual'), { hoy: HOY }).texto,
    TEXTOS_RESUMEN.sinCambiosMes, 'y su versión mensual');
  ok(/mes/.test(TEXTOS_RESUMEN.sinCambiosMes), 'que habla de mes, no de semana');
}

/* ---------------------------------------------------------------------------
   3 · CON ACTIVIDAD: SECCIONES Y TAMAÑO (apartados 1, 2, 4, 9 y 10)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Con actividad');
  const r = generarResumen(cambiarFrecuencia(conActividad(), 'semanal'), { hoy: HOY });
  eq(r.hay, true, 'hay resumen');
  ok(r.secciones.length > 0, `con ${r.secciones.length} secciones`);
  eq(r.titulo, TEXTOS_RESUMEN.semanal, 'y el título del apartado 9: "🧔 Esta semana"');
  ok(r.secciones.every((s) => s.cosas.length <= s.max),
    '⚠️ ninguna sección se pasa de su tope (destacado: 1-3, sugerencia: 1)');
  eq(auditarResumen().sinTope, [], 'y las cinco declaran su tope');
  eq(seccion('destacado').max, 3, 'lo más destacado, de 1 a 3 elementos');
  eq(seccion('sugerencia').max, 1, 'y la sugerencia, una');
  ok(seccion('sugerencia').soloSiAporta, '⚠️ y solo si realmente aporta valor');

  const mensual = generarResumen(cambiarFrecuencia(conActividad(), 'mensual'), { hoy: HOY });
  eq(mensual.titulo, TEXTOS_RESUMEN.mensual, 'el mensual con el suyo: "📈 Mi mes en Estilo"');
  eq(seccionesDe('mensual').length, 5, 'y cinco secciones posibles');
  eq(seccionesDe('semanal').length, 4, 'frente a cuatro en el semanal');
  ok(!seccionesDe('semanal').some((s) => s.id === 'objetivos'),
    '⚠️ los objetivos son del mensual: en una semana no se mueve un objetivo');

  /* Apartado 4 — el tamaño se adapta a cuánto usa la aplicación. */
  eq(TAMANOS.map((t) => t.id), ['corto', 'normal', 'largo'], 'tres tamaños');
  eq(tamanoPara(0).id, 'corto', 'quien apenas la usa: corto');
  eq(tamanoPara(5).id, 'largo', 'quien la usa mucho: largo');
  ok(tamanoPara(0).secciones < tamanoPara(5).secciones,
    '🚨 ⚠️ y el corto trae MENOS secciones: cinco apartados vacíos son un reproche');
  ok(!seccion('inventada'), 'las secciones se buscan por id');
}

/* ---------------------------------------------------------------------------
   4 · EL CONTENIDO ES EL DE LA F58 (decisión 4)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · De dónde sale el contenido');
  eq(auditarResumen().tiposInventados, [],
    '🚨 ⚠️ todos los tipos que las secciones reparten EXISTEN en la F58: esta fase agrupa, no reescribe');
  ok(tipoDeInsight === TIPO_F58, 'y es la misma función, importada');
  ok(SECCIONES.flatMap((s) => s.tipos).every((t) => !!TIPO_F58(t)),
    'ni un tipo inventado en las cinco secciones');
}

/* ---------------------------------------------------------------------------
   5 · EL AVISO, Y QUE EL RESUMEN NO DEPENDE DE ÉL (apartados 6, 7 y 8)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · Avisos');
  const encendido = cambiarFrecuencia(conActividad(), 'semanal');
  eq(avisoDelResumen(encendido), null, '⚠️ el aviso nace apagado aunque el resumen esté encendido');
  const conAviso = alternarAviso(encendido);
  ok(!!avisoDelResumen(conAviso), 'se puede encender');
  ok(/resumen semanal de Estilo está listo/.test(avisoDelResumen(conAviso).texto),
    'con el texto del apartado 7');
  eq(avisoDelResumen(conAviso).accion.etiqueta, 'Abrir resumen', 'y su acción');
  ok(/notificaciones/.test(avisoDelResumen(conAviso).lanza),
    '⚠️ apartado 6 — y lo lanza el sistema global, no este módulo');

  /* 🚨 Apartado 8 — el resumen NO depende del aviso. */
  eq(generarResumen(encendido, { hoy: HOY }).hay, true,
    '🚨 ⚠️ y sin aviso el resumen SIGUE estando dentro de la aplicación');
  ok(/aunque no tengas avisos/.test(TEXTOS_RESUMEN.dentro), 'con esa frase escrita');

  /* Desactivar el resumen apaga el aviso. */
  const apagado = cambiarFrecuencia(conAviso, 'desactivado');
  eq(datosResumen(apagado).avisar, false,
    '🚨 y desactivar el resumen apaga el aviso: no se avisa de algo que no se genera');
  eq(alternarAviso(sinActividad()), normalizarEstiloHombre(sinActividad()),
    '⚠️ y con el resumen apagado no se puede encender el aviso');
  eq(normalizarResumen({ avisar: true, frecuencia: 'desactivado' }).avisar, false,
    'ni guardándolo a mano');
  ok(caso('avisos_desactivados').espera.includes('SIGUE'), 'y es uno de los ocho casos');
}

/* ---------------------------------------------------------------------------
   6 · CORREGIRLO (apartado 13)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Corregir el resumen');
  const e = cambiarFrecuencia(conActividad(), 'semanal');
  const antes = generarResumen(e, { hoy: HOY });
  const uno = antes.secciones[0].cosas[0];
  const corregido = corregirResumen(e, uno.id, { hoy: HOY });
  eq(datosResumen(corregido).correcciones.length, 1, 'la corrección se apunta');
  const despues = generarResumen(corregido, { hoy: HOY });
  ok(!despues.secciones.some((s) => s.cosas.some((x) => x.id === uno.id)),
    '🚨 ⚠️ y esa interpretación NO se repite: es lo que pide el apartado 13');
  eq(datosResumen(corregirResumen(corregido, uno.id)).correcciones.length, 1,
    'corregir dos veces lo mismo no lo apunta dos veces');
  ok(/Esto no es así/.test(TEXTO_CORREGIR), 'con el texto del botón');
  ok(/No te lo vuelvo a decir/.test(TEXTOS_RESUMEN.corregido), 'y la respuesta');
}

/* ---------------------------------------------------------------------------
   7 · HISTORIAL, RENDIMIENTO Y COMPARACIÓN (11, 15 y 16)
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · Historial y rendimiento');
  const e = cambiarFrecuencia(conActividad(), 'semanal');
  const r = generarResumen(e, { hoy: HOY });
  const guardado = guardarEnHistorial(e, r);
  eq(datosResumen(guardado).historial.length, 1, 'el resumen se guarda en el historial');
  const entrada = datosResumen(guardado).historial[0];
  eq(Object.keys(entrada).sort(), ['cosas', 'hasta', 'secciones', 'tipo'],
    '🚨 ⚠️ con fechas y números, NUNCA el texto: el texto se vuelve a componer');
  ok(!JSON.stringify(entrada).includes('Tu estilo'),
    'ni una frase guardada: un cambio de redacción no deja resúmenes viejos escritos de otra forma');

  let muchos = e;
  for (let i = 0; i < 20; i += 1) muchos = guardarEnHistorial(muchos, { ...r, hasta: `2026-0${(i % 9) + 1}-01` });
  eq(datosResumen(muchos).historial.length, MAX_HISTORIAL,
    `⚠️ apartado 15 — y se guardan los últimos ${MAX_HISTORIAL}, no todos`);
  ok(anteriores(muchos, 'semanal').length > 0, 'se pueden consultar los anteriores');

  /* Apartado 16 — no se recalcula al abrir. */
  eq(hayQueRegenerar(e, { hoy: HOY }), true, 'la primera vez hay que generarlo');
  eq(hayQueRegenerar(guardado, { hoy: HOY }), false,
    '🚨 ⚠️ pero justo después NO: no se recalcula todo cada vez que abre');
  eq(hayQueRegenerar(guardado, { hoy: '2026-06-20' }), true, 'y pasada la semana, otra vez');
  eq(hayQueRegenerar(conActividad(), { hoy: HOY }), false, '⚠️ y con el resumen apagado, nunca');

  /* Apartado 11 — comparar solo con datos suficientes. */
  eq(sePuedeComparar(e).puede, false, 'con un solo periodo no se compara…');
  ok(/dos periodos/.test(sePuedeComparar(e).porque), '…y se dice por qué');
  const pobre = guardarEnHistorial(guardarEnHistorial(e, { ...r, cosas: 1 }), { ...r, cosas: 5 });
  eq(sePuedeComparar(pobre).puede, false,
    '⚠️ ni cuando el periodo anterior tiene muy poco: la comparación no diría nada');
  ok(MINIMO_PARA_COMPARAR >= 2, `con su mínimo escrito (${MINIMO_PARA_COMPARAR})`);
}

/* ---------------------------------------------------------------------------
   8 · COMPARTIR, IA, CASOS Y VEREDICTO (12, 14, 17)
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · Compartir, IA y el veredicto');
  eq(COMPARTIR.existe, false, '⚠️ apartado 14 — no hay sistema de compartición, y se dice');
  eq(COMPARTIR.automatico, false, '🚨 y nunca automáticamente');
  ok(/acción suya/.test(COMPARTIR.regla), 'con la regla para el día que exista');
  ok(/exportación/.test(COMPARTIR.porque), 'y lo que sí hay: la exportación de Mis datos');

  ok(/datos reales|Únicamente sobre los datos/.test(IA_RESUMEN.soloConDatos),
    '🚨 apartado 12 — la IA cuenta lo que dicen los números, y si no dicen nada, tampoco');
  ok(/F56/.test(IA_RESUMEN.necesita), 'y necesita el interruptor de la F56');
  eq(iaPuedeContarlo(conActividad()), false, 'sin permiso, no lo cuenta ella');
  eq(iaPuedeContarlo(alternarPermisoIA(conActividad())), true, 'con permiso, sí');

  eq(CASOS.length, 8, 'los ocho casos del apartado 17');
  ok(CASOS.every((c) => !!c.espera), 'cada uno con lo que debe pasar');
  ok(/Ni un resumen inventado/.test(caso('usuario_nuevo').espera), 'incluido el usuario nuevo');
  ok(!caso('inventado'), 'se buscan por id');

  eq(APARTADOS_RESUMEN.length, 17, 'los diecisiete apartados');
  eq(auditarResumen().sinCumplir, [14], '⚠️ uno sin cumplir: compartir, que no existe');
  eq(auditarResumen().sinDonde, [], 'y todos dicen dónde');
  ok(!apartadoResumen(99), 'se buscan por id');

  const panel = panelResumen(cambiarFrecuencia(conActividad(), 'semanal'), { hoy: HOY });
  eq(panel.esUnInforme, true, '🎯 un informe que puede desaparecer del todo');
  ok(/no una obligación semanal/.test(panel.condicion), 'con la condición de finalización');
  ok(panel.resumen.hay, 'y con su resumen dentro');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
