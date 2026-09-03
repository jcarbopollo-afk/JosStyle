// ============================================================================
// EH · Fase 58/65 — Insights y resúmenes inteligentes
//
// *"Pocos + relevantes + comprensibles + accionables. Nunca: muchos +
// repetitivos + invasivos."*
//
// Lo que vigila esta prueba:
//   · 🚨 que con pocos datos NO se invente ninguna conclusión
//   · que sean pocos y cortos, contados y medidos
//   · que ninguno suene a reproche
//   · y que los que dependen de sus gustos pidan el permiso de la F56
// ============================================================================

import { normalizarEstiloHombre } from '../src/lib/estiloDeHombre.js';
import { METRICAS_PROGRESO as METRICAS_F35, PERIODOS_PROGRESO as PERIODOS_F35 } from '../src/lib/progresoEstilo.js';
import { alternarPermisoIA } from '../src/lib/iaEstilo.js';
import {
  PERIODOS, periodo, PERIODO_POR_DEFECTO, enVentana,
  TIPOS_DE_INSIGHT, tipoDeInsight, tiposPersonalizados,
  MAX_A_LA_VEZ, LARGO_MAXIMO, PALABRAS_DE_PRESION, suenaAReproche,
  DESCANSO_DIAS, DEFAULT_INSIGHTS, MAX_HISTORIAL, normalizarInsights, datosInsights,
  sePuedeEnsenar, marcarVisto,
  OPCIONES_OCULTAR, ocultarInsight, ocultarTipo, TEXTO_OCULTAR,
  TEXTOS_INSIGHTS, generarInsights, aDondeLleva,
  ESTADISTICAS_AVANZADAS, IA_INSIGHTS,
  APARTADOS_INSIGHTS, apartadoInsight, CONDICION,
  auditarInsights, panelInsights, METRICAS_PROGRESO,
} from '../src/lib/insights.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-06-01';
const hecho = (fecha) => ({ rutinaId: 'r1', fecha, pasos: ['p1'] });

/* Un usuario con actividad de verdad: cuatro rutinas este mes y dos el anterior. */
const conActividad = () => normalizarEstiloHombre({
  configurado: true,
  modulos: [{
    id: 'skincare', activo: true, orden: 0,
    config: {
      rutinas: {
        rutinas: [{ id: 'r1', nombre: 'Mañana', orden: 0 }],
        hechos: [
          hecho('2026-05-30'), hecho('2026-05-25'), hecho('2026-05-20'), hecho('2026-05-10'),
          hecho('2026-04-20'), hecho('2026-04-15'),
        ],
      },
    },
  }],
});

/* Y uno que acaba de empezar: dos registros. */
const recienLlegado = () => normalizarEstiloHombre({
  configurado: true,
  modulos: [{
    id: 'skincare', activo: true, orden: 0,
    config: { rutinas: { rutinas: [{ id: 'r1', nombre: 'Mañana', orden: 0 }], hechos: [hecho('2026-05-30'), hecho('2026-05-29')] } },
  }],
});

console.log('\n💡 EH · Fase 58/65 — Insights y resúmenes inteligentes\n');

/* ---------------------------------------------------------------------------
   1 · 🚨 CON POCOS DATOS NO SE INVENTA NADA (apartados 9 y 18)
   --------------------------------------------------------------------------- */
{
  console.log('1 · Sin datos suficientes');
  const r = generarInsights(recienLlegado(), { hoy: HOY });
  eq(r.insights, [], '🚨 ⚠️ con dos registros NO se saca ninguna conclusión');
  eq(r.hayBastante, false, 'y se dice que no hay bastante');
  eq(r.texto, TEXTOS_INSIGHTS.sinDatos, '⚠️ apartado 18 — con el texto amable del enunciado');
  ok(/Cuando utilices más/.test(TEXTOS_INSIGHTS.sinDatos), 'y son sus palabras');
  ok(r.fuera.some((f) => f.porque === 'pocos_datos'),
    '⚠️ y queda apuntado POR QUÉ se ha quedado fuera: por pocos datos');

  eq(generarInsights(normalizarEstiloHombre({}), { hoy: HOY }).insights, [],
    'un usuario nuevo del todo tampoco recibe nada');
  eq(auditarInsights().sinMinimo, [],
    '🚨 y los seis tipos declaran cuántos registros necesitan: el mínimo no es un adorno');
  ok(TIPOS_DE_INSIGHT.every((t) => t.minimo >= 1), 'ninguno se conforma con cero');
}

/* ---------------------------------------------------------------------------
   2 · CON DATOS, POCOS Y CORTOS (apartados 1, 3 y 8)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · Con datos: pocos y cortos');
  const r = generarInsights(conActividad(), { hoy: HOY });
  ok(r.insights.length > 0, `salen ${r.insights.length} insights`);
  ok(r.insights.length <= MAX_A_LA_VEZ, `🚨 ⚠️ nunca más de ${MAX_A_LA_VEZ} a la vez`);
  ok(r.insights.every((x) => x.texto.length <= LARGO_MAXIMO),
    `⚠️ y ninguno pasa de ${LARGO_MAXIMO} caracteres: cortos de verdad, no "cortos" de decirlo`);
  eq(auditarInsights(conActividad(), { hoy: HOY }).largos, [], 'comprobado sobre los generados');
  eq(auditarInsights(conActividad(), { hoy: HOY }).demasiados, false, 'y sobre cuántos son');

  ok(r.insights.some((x) => x.tipo === 'resumen'), 'apartado 1 — con su resumen personal');
  ok(r.insights.some((x) => x.tipo === 'cambio'), 'apartado 3 — y el cambio destacado');
  const cambio = r.insights.find((x) => x.tipo === 'cambio');
  ok(/más|menos/.test(cambio.texto), '⚠️ que dice "más" o "menos"…');
  ok(!/mejor|peor/.test(cambio.texto), '…y NO "mejor" o "peor": es un número, no una nota');
  ok(/frente a/.test(cambio.texto), 'comparando los dos periodos (apartado 17)');
}

/* ---------------------------------------------------------------------------
   3 · 🚨 NINGUNO SUENA A REPROCHE (apartado 17)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Sin presión');
  eq(auditarInsights(conActividad(), { hoy: HOY }).conReproche, [],
    '🚨 ⚠️ ni una palabra de presión en los insights generados');
  ok(PALABRAS_DE_PRESION.length >= 8, `${PALABRAS_DE_PRESION.length} palabras prohibidas`);
  ok(PALABRAS_DE_PRESION.includes('deberías'), 'incluida "deberías"');
  ok(PALABRAS_DE_PRESION.includes('has empeorado'), 'y "has empeorado"');
  ok(PALABRAS_DE_PRESION.includes('solo has'), '⚠️ y "solo has", que es la que se cuela sin querer');

  /* La comprobación de la comprobación. */
  eq(suenaAReproche('Deberías cuidarte más'), ['deberías'], '⚠️ el detector caza el caso…');
  eq(suenaAReproche('Has hecho 4 rutinas este mes'), [], '…y deja pasar lo que es un dato');
  eq(suenaAReproche(null), [], 'y con nada, nada');
}

/* ---------------------------------------------------------------------------
   4 · LOS PERSONALIZADOS PIDEN PERMISO (apartado 10)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Confidencialidad');
  eq(tiposPersonalizados(), ['preferencia', 'sugerencia'],
    'dos de los seis dependen de sus gustos');
  const sinPermiso = generarInsights(conActividad(), { hoy: HOY });
  eq(sinPermiso.personaliza, false, 'sin el interruptor de la F56…');
  eq(sinPermiso.insights.filter((x) => tipoDeInsight(x.tipo).personalizado), [],
    '🚨 ⚠️ …no se genera ni uno personalizado');
  ok(sinPermiso.fuera.some((f) => f.porque === 'sin_permiso'),
    '⚠️ y queda dicho que es por el permiso, no por falta de datos');
  eq(auditarInsights(conActividad(), { hoy: HOY }).personalizadosSinPermiso, [],
    'el parte lo confirma');

  /* ⚠️ Pero contar sus rutinas SÍ se enseña: es un hecho suyo, no una deducción. */
  ok(sinPermiso.insights.length > 0,
    '⚠️ y aun así recibe insights: contar lo que ha hecho es un hecho suyo, no personalización');
  const conPermiso = generarInsights(alternarPermisoIA(conActividad()), { hoy: HOY });
  eq(conPermiso.personaliza, true, 'con el interruptor encendido, sí se personaliza');
}

/* ---------------------------------------------------------------------------
   5 · NO UNO CADA VEZ QUE ABRE (apartado 11)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · Control de frecuencia');
  const e = conActividad();
  ok(sePuedeEnsenar(e, 'cambio', { hoy: HOY }), 'la primera vez se puede enseñar');
  const visto = marcarVisto(e, { id: 'cambio_x', tipo: 'cambio' }, { hoy: HOY });
  eq(sePuedeEnsenar(visto, 'cambio', { hoy: HOY }), false,
    '🚨 ⚠️ y justo después NO: la fatiga se arregla apareciendo menos, no escribiendo mejor');
  eq(sePuedeEnsenar(visto, 'cambio', { hoy: '2026-06-10' }), true,
    `pasados ${DESCANSO_DIAS} días, otra vez`);
  eq(sePuedeEnsenar(visto, 'resumen', { hoy: HOY }), true,
    '⚠️ y el descanso es por TIPO: otro tipo distinto sí puede salir');
  eq(generarInsights(visto, { hoy: HOY }).insights.filter((x) => x.tipo === 'cambio'), [],
    'y el generador lo respeta de verdad');
}

/* ---------------------------------------------------------------------------
   6 · OCULTARLOS, SIN TOCAR SUS DATOS (apartado 14)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Ocultar');
  eq(OPCIONES_OCULTAR.map((o) => o.id), ['ocultar', 'tipo'], 'las dos opciones del enunciado');
  const e = conActividad();
  const uno = generarInsights(e, { hoy: HOY }).insights[0];
  const sinEse = ocultarInsight(e, uno.id);
  ok(!generarInsights(sinEse, { hoy: HOY }).insights.some((x) => x.id === uno.id),
    'ocultar uno lo quita');
  const sinTipo = ocultarTipo(e, 'cambio');
  eq(generarInsights(sinTipo, { hoy: HOY }).insights.filter((x) => x.tipo === 'cambio'), [],
    '⚠️ y "no mostrarme más de esto" quita el tipo entero');

  /* 🚨 Y sus datos siguen ahí. */
  const hechosAntes = e.modulos.find((m) => m.id === 'skincare').config.rutinas.hechos.length;
  eq(sinTipo.modulos.find((m) => m.id === 'skincare').config.rutinas.hechos.length, hechosAntes,
    '🚨 ⚠️ y NO le toca un solo registro: ocultar una frase no borra sus datos');
  ok(/no borra nada tuyo/.test(TEXTO_OCULTAR), 'con el aviso que lo dice');
  eq(ocultarTipo(e, 'inventado'), normalizarEstiloHombre(e), 'un tipo que no existe no se oculta');
}

/* ---------------------------------------------------------------------------
   7 · PERIODOS, HISTORIAL Y HACIA DÓNDE LLEVA (2, 12, 13 y 15)
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · Periodos, historial y acción');
  eq(PERIODOS.map((p) => p.id), ['semana', 'mes', 'trimestre', 'personalizado'],
    'los cuatro del apartado 2');
  eq(PERIODOS.filter((p) => p.de === 'F35').length, PERIODOS_F35.length,
    '⚠️ tres vienen de la F35: no se escribe una lista nueva de cuatro');
  eq(periodo('trimestre').dias, 90, 'y el de tres meses lo añade esta fase');
  ok(!periodo('inventado'), 'se buscan por id');
  eq(PERIODO_POR_DEFECTO, 'mes', 'y por defecto, el mes');
  eq(generarInsights(conActividad(), { periodo: 'inventado', hoy: HOY }).periodo, PERIODO_POR_DEFECTO,
    'un periodo que no existe cae en el de por defecto');

  /* Apartado 12 — lleva al módulo, y no crea una tarea. */
  const cambio = generarInsights(conActividad(), { hoy: HOY }).insights.find((x) => x.tipo === 'cambio');
  const destino = aDondeLleva(cambio);
  eq(destino.modulo, 'skincare', 'un insight lleva a su apartado');
  eq(destino.creaTarea, false, '🚨 ⚠️ y NO crea una tarea sola: el apartado 7 lo prohíbe');
  eq(aDondeLleva({ ir: null }), null, 'y el que no lleva a ningún sitio, no lleva');
  eq(aDondeLleva({ ir: 'inventado' }), null, 'ni a un módulo que no existe');

  /* Apartado 13 — historial acotado. */
  let e = conActividad();
  for (let i = 0; i < 30; i += 1) e = marcarVisto(e, { id: `x${i}`, tipo: 'cambio' }, { hoy: HOY });
  eq(datosInsights(e).vistos.length, MAX_HISTORIAL,
    `⚠️ apartado 13 — se guardan los últimos ${MAX_HISTORIAL}, no todos para siempre`);
  eq(normalizarInsights(undefined), DEFAULT_INSIGHTS, 'sin nada guardado, las listas vacías');
  eq(normalizarInsights({ tiposOcultos: ['inventado'] }).tiposOcultos, [],
    'y un tipo que no existe no se guarda como oculto');

  /* Apartado 15 — las gráficas siguen donde estaban. */
  eq(ESTADISTICAS_AVANZADAS.enLaPortada, false,
    '🚨 apartado 15 — la portada NO se llena de gráficas');
  ok(/Progreso/.test(ESTADISTICAS_AVANZADAS.donde), 'siguen en Progreso (F35), y opcionales');
}

/* ---------------------------------------------------------------------------
   8 · LOS NÚMEROS SON LOS DE LA F35, Y EL VEREDICTO
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · De dónde salen los números');
  ok(METRICAS_PROGRESO === METRICAS_F35,
    '⚠️ el catálogo de lo medible es el de la F35, importado: no hay una segunda lista');
  ok(auditarInsights().metricas >= 10, `con sus ${auditarInsights().metricas} métricas`);
  eq(enVentana([{ f: '2026-05-30' }, { f: '2026-01-01' }], (x) => x.f, { desde: 30, hasta: 0, hoy: HOY }), 1,
    'la ventana cuenta lo que cae dentro…');
  eq(enVentana([], (x) => x.f, { desde: 30, hasta: 0, hoy: HOY }), 0, '…y con nada, cero');
  eq(enVentana(null, null, { hoy: HOY }), 0, 'sin reventar con lo que no es una lista');

  ok(/interruptor/.test(IA_INSIGHTS.con), 'apartado 16 — la IA los interpreta con el permiso de la F56');
  ok(/Inventarse/.test(IA_INSIGHTS.noPuede), '⚠️ y no puede inventarse un cambio que los números no dicen');

  eq(APARTADOS_INSIGHTS.length, 18, 'los dieciocho apartados');
  eq(auditarInsights().sinCumplir, [], 'todos cumplidos');
  eq(auditarInsights().sinDonde, [], 'y todos diciendo dónde');
  ok(!apartadoInsight(99), 'se buscan por id');

  const panel = panelInsights(conActividad(), { hoy: HOY });
  eq(panel.utiles, true, '🎯 pocos, cortos, sin reproche y sin inventar');
  ok(/Nunca muchos/.test(panel.condicion), 'con la condición de finalización');
  ok(/tendencia, no una verdad/i.test(TEXTOS_INSIGHTS.tendencia),
    '⚠️ apartado 5 — y una tendencia se presenta como tendencia');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
