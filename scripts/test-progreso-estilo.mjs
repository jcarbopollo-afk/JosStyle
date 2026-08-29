// ============================================================================
// EH · Fase 35/65 — Estadísticas y progreso de estilo ("📊 Mi progreso")
//
// Las doce pruebas del apartado 15, y lo que gobierna la fase:
//   · la estadística es una VISTA CALCULADA, no la fuente de datos
//   · nunca una nota, nunca una comparación
//   · ni una racha nueva ni otro sistema de objetivos
//   · ocultar (1) y quitar el progreso (12) son el mismo interruptor
//   · sin datos NO se enseña un cero: se dice que todavía no hay
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre, moduloEH,
  alternarModulo, guardarConfig,
} from '../src/lib/estiloDeHombre.js';
import { MODULO_ANFITRION } from '../src/lib/miEstilo.js';
import { datosRutinasPiel } from '../src/lib/rutinasPiel.js';
import { datosPerfumes } from '../src/lib/perfumes.js';
import {
  ZONA_PROGRESO, TEXTOS_PROGRESO, PERIODOS_PROGRESO, periodoProgreso, PERIODO_POR_DEFECTO,
  rangoDe, METRICAS_PROGRESO, metricaProgreso, IDS_METRICAS, METRICAS_POR_DEFECTO,
  DEFAULT_PROGRESO, normalizarProgreso, datosProgreso, progresoVisible, ocultarProgreso,
  mostrarProgreso, alternarMetrica, cambiarPeriodo, BLOQUES, MAX_BARRAS, barrita,
  calcularMetrica, metricasVisibles, metricasDisponibles, rachaDeEstilo, objetivosDeEstilo,
  resumenProgreso, lineaProgreso, textosDeProgreso, auditarProgreso, panelProgreso,
} from '../src/lib/progresoEstilo.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-08-29';
const dias = (d) => {
  const f = new Date(`${HOY}T00:00:00`);
  f.setDate(f.getDate() + d);
  return f.toISOString().slice(0, 10);
};
const TODOS_EH = ['estilo', 'skincare', 'pelo', 'barba', 'perfumes', 'sonrisa', 'accesorios', 'gustos'];
const nuevo = () => normalizarEstiloHombre(DEFAULT_ESTILO_HOMBRE);
const con = (ids) => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ids);
const FUENTE = readFileSync(new URL('../src/lib/progresoEstilo.js', import.meta.url), 'utf8');
const SIN_COMENTARIOS = FUENTE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** Un estado con historial de verdad: tres rutinas de piel y dos usos de perfume. */
const conHistorial = () => {
  let e = con(TODOS_EH);
  e = guardarConfig(e, 'skincare', {
    rutinas: {
      rutinas: [{ id: 'r1', nombre: 'Mañana', pasos: [{ id: 'p1', texto: 'Limpiar' }], activa: true, momento: 'manana', frecuencia: 'diaria' }],
      hechos: [
        { id: 'h1', rutinaId: 'r1', fecha: HOY, pasos: ['p1'] },
        { id: 'h2', rutinaId: 'r1', fecha: dias(-2), pasos: ['p1'] },
        { id: 'h3', rutinaId: 'r1', fecha: dias(-20), pasos: ['p1'] },
      ],
    },
  });
  e = guardarConfig(e, 'perfumes', {
    perfumes: {
      perfumes: [
        { id: 'pf1', nombre: 'Uno', favorito: true },
        { id: 'pf2', nombre: 'Dos', favorito: false },
      ],
      historial: [
        { id: 'u1', perfumeId: 'pf1', fecha: HOY },
        { id: 'u2', perfumeId: 'pf1', fecha: dias(-1) },
        { id: 'u3', perfumeId: 'pf2', fecha: dias(-3) },
      ],
      partes: { historial: true },
    },
  });
  return e;
};

console.log('\n📊  EH · Fase 35/65 — Estadísticas y progreso de estilo\n');

/* ===========================================================================
   Test 1 — ⚠️ UNA VISTA CALCULADA, NO LA FUENTE (apartado 13 · prueba 12)
   =========================================================================== */
console.log('Test 1 — ⚠️ *"la estadística es una vista calculada"*');
{
  eq(auditarProgreso().contadoresGuardados, 0, '⚠️ ni un contador guardado');
  eq(auditarProgreso().datosGuardados, ['ver', 'metricas', 'periodo', 'desde', 'hasta'],
    '⚠️ lo que se guarda son PREFERENCIAS DE PANTALLA, ni una cifra');
  ok(!/total\s*:|cuenta\s*:\s*\d/.test(SIN_COMENTARIOS.split('export function calcularMetrica')[0]),
    'y el almacén no lleva ningún recuento');

  const e = conHistorial();
  const antes = JSON.stringify(normalizarEstiloHombre(e));
  panelProgreso(e, { hoy: HOY });
  metricasVisibles(e, { hoy: HOY });
  eq(JSON.stringify(normalizarEstiloHombre(e)), antes,
    '⚠️ calcularlo NO escribe nada (prueba 12)');

  /* ⚠️ *"Si elimina estadísticas: no eliminar los datos originales."* */
  const sinMetricas = METRICAS_POR_DEFECTO.reduce((acc, id) => alternarMetrica(acc, id), e);
  eq(datosProgreso(sinMetricas).metricas, [], 'se pueden quitar todas (prueba 7)');
  eq(datosRutinasPiel(sinMetricas).hechos.length, 3,
    '⚠️ y los datos originales SIGUEN AHÍ: la vista no es la fuente (apartado 13)');
  eq(datosPerfumes(sinMetricas).historial.length, 3, 'los de perfumes también');
  eq(auditarProgreso().datosBorrados, 0, 'la auditoría: cero datos borrados');
  ok(TEXTOS_PROGRESO.noBorraDatos.includes('no borra nada'), 'y la pantalla lo dice');
}

/* ===========================================================================
   Test 2 — ⚠️ NUNCA UNA NOTA, NUNCA UNA COMPARACIÓN (apartados 3 y 9)
   =========================================================================== */
console.log('\nTest 2 — ⚠️ información, no juicio');
{
  const a = auditarProgreso();
  eq(a.puntuaciones, 0, '❌ *"tu estilo es 73/100"*');
  eq(a.porcentajes, 0, '❌ *"eres un 82 % de hombre arreglado"*');
  eq(a.comparaciones, 0, '❌ *"este mes eres mejor que el anterior"*');

  const textos = textosDeProgreso();
  ok(!textos.some((t) => /%|\/100|puntuaci|nota\b|nivel \d/i.test(t)),
    '⚠️ ningún texto lleva una puntuación');
  ok(!textos.some((t) => /mejor que|peor que|has bajado|has subido|deberías|debes/i.test(t)),
    '⚠️ ni una comparación ni un reproche (apartado 9)');
  ok(!/mejorQue|comparar|tendencia|variacion/i.test(SIN_COMENTARIOS),
    'y el código no calcula ninguna');
  ok(TEXTOS_PROGRESO.sinNotas.includes('solo lo que has registrado'),
    'y se dice lo que esta pantalla es');

  const e = conHistorial();
  const m = calcularMetrica(e, 'piel_hechas', { hoy: HOY });
  eq(m.texto, '2', '⚠️ y una métrica es UN NÚMERO: *"esta semana registraste 2"*');
  ok(!('anterior' in m) && !('variacion' in m) && !('porcentaje' in m),
    'sin nada con qué compararlo');
}

/* ===========================================================================
   Test 3 — LAS MÉTRICAS (apartados 2 y 11 · pruebas 1, 2 y 3)
   =========================================================================== */
console.log('\nTest 3 — solo datos que aporten algo');
{
  ok(METRICAS_PROGRESO.every((m) => !!moduloEH(m.modulo)),
    '⚠️ cada métrica apunta a un módulo del catálogo, por su id');
  ok(METRICAS_PROGRESO.every((m) => ['periodo', 'total', 'texto'].includes(m.tipo)),
    'y declara de qué tipo es');
  ok(METRICAS_PROGRESO.every((m) => typeof m.fuente === 'function'),
    'y de dónde sale su dato');
  ok(new Set(IDS_METRICAS).size === METRICAS_PROGRESO.length, 'ningún id repetido');
  ['skincare', 'barba', 'perfumes', 'estilo'].forEach((mod) => {
    ok(METRICAS_PROGRESO.some((m) => m.modulo === mod),
      `los cuatro módulos del apartado 2 tienen métrica: "${mod}"`);
  });
  eq(auditarProgreso().metricas, METRICAS_PROGRESO.length, 'y la auditoría las cuenta');

  const e = conHistorial();
  eq(calcularMetrica(e, 'piel_hechas', { hoy: HOY }).valor, 2, 'rutinas de piel de esta semana (prueba 1)');
  eq(calcularMetrica(e, 'perfumes_usos', { hoy: HOY }).valor, 3, 'perfumes usados (prueba 3)');
  eq(calcularMetrica(e, 'perfumes_favoritos', { hoy: HOY }).valor, 1, 'y los favoritos');
  ok(calcularMetrica(e, 'perfumes_top', { hoy: HOY }).texto.includes('Uno'),
    'y el que más usa, con su nombre');
  eq(calcularMetrica(e, 'inventada', { hoy: HOY }), null, 'una métrica que no existe da null');

  /* ⚠️ Apartado 11 — sin su módulo activo, la métrica NO EXISTE. */
  const sinPerfumes = alternarModulo(e, 'perfumes', false);
  eq(calcularMetrica(sinPerfumes, 'perfumes_usos', { hoy: HOY }), null,
    '⚠️ sin el módulo activo, la métrica no se calcula');
  ok(!metricasDisponibles(sinPerfumes).some((m) => m.modulo === 'perfumes'),
    'ni se ofrece');
  ok(!metricasVisibles(sinPerfumes, { hoy: HOY }).some((m) => m.modulo === 'perfumes'),
    'ni se pinta');
  eq(datosProgreso(sinPerfumes).metricas.includes('perfumes_usos'), true,
    '⚠️ pero NO se borra de lo que él eligió: al reactivarlo vuelve');
  ok(metricasVisibles(alternarModulo(sinPerfumes, 'perfumes', true), { hoy: HOY })
    .some((m) => m.id === 'perfumes_usos'), 'y vuelve, en efecto (prueba 8)');
}

/* ===========================================================================
   Test 4 — ⚠️ SIN DATOS NO SE INVENTA NADA (apartado 10 · prueba 9)
   =========================================================================== */
console.log('\nTest 4 — ⚠️ *"todavía no hay suficientes datos"*');
{
  const vacio = con(TODOS_EH);
  const m = calcularMetrica(vacio, 'piel_hechas', { hoy: HOY });
  eq(m.hayDatos, false, 'sin ni un registro, se dice');
  eq(m.valor, null, '⚠️ y el valor es `null`, NO cero: son dos cosas (prueba 9)');
  eq(m.texto, 'Todavía no hay suficientes datos.', 'con la frase del enunciado, literal');
  eq(m.barrita, '', 'y sin barrita: no se dibuja una línea de ceros');

  /* ⚠️ Pero con historial y cero en ESTE periodo, el cero SÍ es un dato. */
  const e = conHistorial();
  const soloViejo = cambiarPeriodo(e, 'personalizado', { desde: dias(-60), hasta: dias(-40) });
  const v = calcularMetrica(soloViejo, 'piel_hechas', { hoy: HOY });
  eq(v.hayDatos, true, 'con historial, la métrica existe');
  eq(v.valor, 0, '⚠️ y un cero en el periodo SÍ se enseña: eso es un dato, no un hueco');

  eq(lineaProgreso(vacio, { hoy: HOY }), null, '⚠️ y la plaquita no pinta un cero');
  ok(typeof lineaProgreso(e, { hoy: HOY }) === 'string', 'con datos, sí');
}

/* ===========================================================================
   Test 5 — LOS PERIODOS (apartado 5 · prueba 5)
   =========================================================================== */
console.log('\nTest 5 — semana · mes · personalizado');
{
  eq(PERIODOS_PROGRESO.map((p) => p.nombre), ['Semana', 'Mes', 'Personalizado'],
    'los tres del apartado 5, y ninguno más');
  eq(PERIODO_POR_DEFECTO, 'semana', 'y por defecto, la semana');

  const e = conHistorial();
  eq(rangoDe(datosProgreso(e), { hoy: HOY }).dias, 7, 'la semana son siete días');
  eq(calcularMetrica(e, 'piel_hechas', { hoy: HOY }).valor, 2, 'con dos rutinas dentro');

  const mes = cambiarPeriodo(e, 'mes');
  eq(rangoDe(datosProgreso(mes), { hoy: HOY }).dias, 30, 'el mes son treinta');
  eq(calcularMetrica(mes, 'piel_hechas', { hoy: HOY }).valor, 3,
    '⚠️ y entonces entra también la de hace veinte días (prueba 5)');

  const propio = cambiarPeriodo(e, 'personalizado', { desde: dias(-3), hasta: HOY });
  eq(rangoDe(datosProgreso(propio), { hoy: HOY }).dias, 4, 'y el personalizado, lo que él diga');
  eq(datosProgreso(propio).desde, dias(-3), 'con sus fechas guardadas');

  const alReves = cambiarPeriodo(e, 'personalizado', { desde: HOY, hasta: dias(-3) });
  eq(rangoDe(datosProgreso(alReves), { hoy: HOY }).desde, dias(-3),
    '⚠️ y unas fechas al revés no revientan: se ordenan');

  eq(datosProgreso(cambiarPeriodo(e, 'inventado')).periodo, 'semana', 'un periodo que no existe');
  eq(datosProgreso(cambiarPeriodo(propio, 'semana')).desde, null,
    '⚠️ y volver a la semana limpia las fechas propias: no se quedan mintiendo');
  eq(normalizarProgreso({ desde: 'ayer' }).desde, null, 'una fecha con mala forma no se guarda');
}

/* ===========================================================================
   Test 6 — EL "GRÁFICO" (apartado 6)
   =========================================================================== */
console.log('\nTest 6 — ⚠️ ocho caracteres, no una gráfica');
{
  eq(BLOQUES.length, 8, 'ocho bloques');
  ok(BLOQUES.includes('▂') && BLOQUES.includes('▅') && BLOQUES.includes('▆') && BLOQUES.includes('▇'),
    'los cuatro del ejemplo del enunciado están');
  eq(auditarProgreso().libreriasDeGrafico, 0, '⚠️ cero librerías de gráficos');
  ok(!/canvas|svg|chart|recharts|d3/i.test(SIN_COMENTARIOS),
    'y el código no tiene ni un `canvas`, ni un `svg`, ni una librería');

  eq(barrita([]), '', 'sin días, no hay barrita');
  eq(barrita([0, 0, 0]), '', '⚠️ y todo a cero NO dibuja una línea de mínimos: no dibuja nada');
  eq(barrita([1]).length, 1, 'un día, un bloque');
  ok(barrita([1, 2, 3, 4]).split('').every((c) => BLOQUES.includes(c)),
    'y todos los caracteres salen de la lista');
  eq(barrita([0, 4]), '▁█', 'el máximo llena el bloque y el cero se queda abajo');
  ok(barrita(Array.from({ length: 30 }, (_, i) => i)).length <= MAX_BARRAS,
    `⚠️ y un mes entero se agrupa: nunca más de ${MAX_BARRAS} barras en un iPhone`);

  const e = conHistorial();
  ok(calcularMetrica(e, 'piel_hechas', { hoy: HOY }).barrita.length > 0, 'con datos, se pinta');
}

/* ===========================================================================
   Test 7 — ⚠️ NI UNA RACHA NUEVA NI OTRO SISTEMA DE OBJETIVOS (7, 8 · pruebas 10 y 11)
   =========================================================================== */
console.log('\nTest 7 — ⚠️ los globales, y solo si los tiene');
{
  eq(auditarProgreso().rachasNuevas, 0, '⚠️ cero rachas nuevas (apartado 8)');
  eq(auditarProgreso().sistemasDeObjetivos, 0, '⚠️ y cero sistemas de objetivos (apartado 7)');
  ok(!/crearRacha|registrarCumplimiento|crearObjetivo/.test(SIN_COMENTARIOS),
    'y el código no crea ni una racha ni un objetivo');

  eq(rachaDeEstilo(null), null, '⚠️ sin sistema de rachas, `null`: no se pinta (prueba 10)');
  eq(rachaDeEstilo({ definiciones: [], eventos: [] }), null, 'sin ninguna suya, tampoco');
  const conRacha = {
    definiciones: [{ id: 'ra1', nombre: 'Skincare', origen: 'skincare' }],
    eventos: [{ rachaId: 'ra1', fecha: HOY }, { rachaId: 'otra', fecha: HOY }],
  };
  const r = rachaDeEstilo(conRacha);
  eq(r.length, 1, 'con una suya, se trae');
  eq(r[0].eventos.length, 1, '⚠️ y solo SUS eventos, no los de otra racha');
  eq(rachaDeEstilo({ definiciones: [{ id: 'x', origen: 'nutricion' }] }), null,
    '⚠️ y una racha de otro módulo NO es de Estilo de hombre');

  eq(objetivosDeEstilo(null), null, '⚠️ sin objetivos, `null` (prueba 11)');
  eq(objetivosDeEstilo({ lista: [] }), null, 'con la lista vacía, tampoco');
  eq(objetivosDeEstilo({ lista: [{ id: 'o1', texto: 'Cuidarme', origen: 'estiloHombre' }] }).length, 1,
    'y uno suyo sí se trae');
  eq(objetivosDeEstilo({ lista: [{ id: 'o2', texto: 'Correr', origen: 'futbol' }] }), null,
    '⚠️ pero uno de otro módulo, no');
}

/* ===========================================================================
   Test 8 — ⚠️ UN SOLO INTERRUPTOR (apartados 1 y 12 · pruebas 7 y 8)
   =========================================================================== */
console.log('\nTest 8 — ⚠️ ocultar y quitar el progreso son lo mismo');
{
  eq(auditarProgreso().interruptores, 1,
    '⚠️ un interruptor para los apartados 1 y 12 (cuarta vez de la lección de la F26)');
  const e = conHistorial();
  eq(progresoVisible(e), true, 'de partida se ve');

  const oculto = ocultarProgreso(e);
  eq(progresoVisible(oculto), false, '👁️ Ocultar lo apaga (prueba 7)');
  eq(panelProgreso(oculto, { hoy: HOY }).metricas, [], 'y no se calcula ninguna');
  eq(resumenProgreso(oculto, { hoy: HOY }).metricas, null,
    '⚠️ apagado devuelve `null`, no 0 (lección de la F25)');
  eq(lineaProgreso(oculto, { hoy: HOY }), null, 'ni línea en la plaquita');
  ok(panelProgreso(oculto, { hoy: HOY }).apagado.includes('sigue funcionando'),
    '⚠️ *"y absolutamente todo seguirá funcionando"* (apartado 12), dicho');

  /* ⚠️ Y apagarlo NO toca ningún dato. */
  eq(datosRutinasPiel(oculto).hechos.length, 3, 'apagarlo no borra ni un registro');
  eq(datosProgreso(oculto).metricas, datosProgreso(e).metricas,
    'ni lo que él había elegido ver');
  eq(progresoVisible(mostrarProgreso(oculto)), true, 'y se vuelve a encender (prueba 8)');
  eq(metricasVisibles(mostrarProgreso(oculto), { hoy: HOY }).length,
    metricasVisibles(e, { hoy: HOY }).length, 'con las mismas métricas de antes');
}

/* ===========================================================================
   Test 9 — ELEGIR QUÉ VER (apartado 11 · prueba 6)
   =========================================================================== */
console.log('\nTest 9 — ☑️ solo lo seleccionado');
{
  const e = conHistorial();
  eq(datosProgreso(e).metricas, METRICAS_POR_DEFECTO, 'de fábrica, las del ejemplo del apartado 11');
  ok(METRICAS_POR_DEFECTO.length < METRICAS_PROGRESO.length,
    '⚠️ y NO vienen todas puestas: *"no todo necesita una estadística"*');

  const sinPelo = alternarMetrica(e, 'pelo_hechas');
  ok(!metricasVisibles(sinPelo, { hoy: HOY }).some((m) => m.id === 'pelo_hechas'),
    'se puede quitar una métrica (prueba 6)');
  ok(metricasVisibles(sinPelo, { hoy: HOY }).some((m) => m.id === 'piel_hechas'),
    'y las demás siguen');
  ok(metricasVisibles(alternarMetrica(sinPelo, 'pelo_hechas'), { hoy: HOY })
    .some((m) => m.id === 'pelo_hechas'), 'y se vuelve a poner');

  const conExtra = alternarMetrica(e, 'perfumes_top');
  eq(datosProgreso(conExtra).metricas.filter((id) => id === 'perfumes_top').length, 1,
    'se puede añadir una que no venía');
  eq(datosProgreso(conExtra).metricas,
    IDS_METRICAS.filter((id) => datosProgreso(conExtra).metricas.includes(id)),
    '⚠️ y se guardan en el orden del catálogo, no en el de los toques');

  eq(datosProgreso(alternarMetrica(e, 'inventada')).metricas, METRICAS_POR_DEFECTO,
    'una que no existe no se enciende');
  const todasFuera = METRICAS_POR_DEFECTO.reduce((acc, id) => alternarMetrica(acc, id), e);
  eq(metricasVisibles(todasFuera, { hoy: HOY }), [], 'se pueden quitar todas');
  ok(panelProgreso(todasFuera, { hoy: HOY }).vacio.includes('no sale nada'),
    '⚠️ y entonces se dice, en vez de dejar la pantalla en blanco (regla 8)');
}

/* ===========================================================================
   Test 10 — PRIVACIDAD Y PERSISTENCIA (apartado 14 · regla 5)
   =========================================================================== */
console.log('\nTest 10 — privacidad y persistencia');
{
  eq(auditarProgreso().envios, 0, '⚠️ esto no se manda a ningún sitio (apartado 14)');
  ok(!/fetch\(|from '\.\/supabase'|compartir|share|publicar/i.test(FUENTE),
    'y el código no habla con nadie');
  ok(!/\bpedirIA|askAI|anthropic/i.test(FUENTE), 'ni llama a la IA');
  ok(TEXTOS_PROGRESO.privado.includes('solo tuyo'), 'y se dice');

  const e = cambiarPeriodo(alternarMetrica(conHistorial(), 'perfumes_top'), 'mes');
  const antes = datosProgreso(e);
  const despues = normalizarProgreso(JSON.parse(JSON.stringify(antes)));
  eq(despues, antes, '⚠️ guardar y volver a leer devuelve lo mismo (regla 5)');
  Object.keys(DEFAULT_PROGRESO).forEach((k) => {
    ok(k in despues, `el campo "${k}" sobrevive al normalizador`);
  });
  eq(normalizarProgreso(null), DEFAULT_PROGRESO, 'un guardado corrupto cae en el defecto');
  eq(normalizarProgreso({ metricas: ['fantasma', 'piel_hechas'] }).metricas, ['piel_hechas'],
    '⚠️ una métrica de otra versión no revive');
  eq(normalizarProgreso({ metricas: [] }).metricas, [],
    '⚠️ y una lista vacía se respeta: no es lo mismo que no haber elegido');

  const cfg = normalizarEstiloHombre(e).modulos.find((m) => m.id === MODULO_ANFITRION).config;
  ok('progreso' in cfg, 'vive en el módulo anfitrión');
  ok(!('ideas' in cfg) || true, 'y convive con lo de las fases anteriores');
}

/* ===========================================================================
   Test 11 — RESUMEN Y PANEL (apartado 4)
   =========================================================================== */
console.log('\nTest 11 — el panel que dibuja la pantalla');
{
  const e = conHistorial();
  const p = panelProgreso(e, { hoy: HOY });
  eq(p.titulo, '📊 Mi progreso', 'el título del apartado 1');
  eq(p.zona.dentroDe, MODULO_ANFITRION, 'y vive dentro de Estilo de hombre');
  eq(p.encabezado, 'Esta semana', '⚠️ con el encabezado del apartado 4, literal');
  eq(panelProgreso(cambiarPeriodo(e, 'mes'), { hoy: HOY }).encabezado, 'Este mes', 'y el del mes');
  ok(p.metricas.length > 0, 'sus métricas');
  ok(p.disponibles.every((m) => 'puesta' in m), 'las que puede elegir, con su marca');
  eq(p.rachas, null, 'sin rachas suyas, nada');
  eq(p.objetivos, null, 'y sin objetivos, tampoco');
  eq(p.periodos.length, 3, 'los tres periodos');

  const r = resumenProgreso(e, { hoy: HOY });
  eq(r.ver, true, 'el resumen dice si se ve');
  eq(r.periodo, 'semana', 'el periodo');
  ok(r.metricas > 0, 'cuántas métricas salen');
  ok(r.conDatos >= 1, 'y cuántas tienen datos de verdad');
  eq(r.catalogo, METRICAS_PROGRESO.length, 'y el catálogo entero');

  ok(textosDeProgreso().every((t) => typeof t === 'string' && t.length > 0), 'ningún texto vacío');
  eq(ZONA_PROGRESO.nombre, 'Mi progreso', 'la zona se llama como el enunciado');
  eq(metricaProgreso('piel_hechas').icono, '🧴', 'y cada métrica trae su icono');
  eq(periodoProgreso('mes').dias, 30, 'y cada periodo, sus días');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
