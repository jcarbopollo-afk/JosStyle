/* Fase 2 · Chatbots — el asistente de Nutrición
   ═══════════════════════════════════════════════════════════════════════════

   Solo lee `nutricion`. Lo de un día es `resumenDelDia` (lo mismo que enseña
   la pantalla, con sus objetivos si los tiene); una media es la regla de
   `promediosDelPeriodo` —**entre los días con algo registrado** y con
   `MINIMO_DIAS_ESTADISTICA`— y, si el periodo es justo uno de los suyos
   (7/30/91 días hasta hoy), se le pide a él directamente. Especificación §8.1.

   🚨 **Describe, nunca prescribe** (regla 7 y E3 F35): un chaval de 16 años no
   recibe de un chatbot «come más» ni «te pasas». Se dice lo registrado y, si él
   se puso un objetivo, a cuánto está de él, sin juicio.

   🚨 **No registrado no es no comido** (E3 F39): un día sin nada apuntado no es
   un día de 0 kcal; ni entra en la media ni se dice que «no comió».

   🔎 El agua solo se compara con el objetivo que ÉL guardó: la propuesta de la
   pantalla sale del peso del perfil, que este asistente no lee (CB-16). */

import { INDICADORES, comidasDelDia, porMomento, resumenDelDia, MOMENTOS, normalizarComida } from './nutricion';
import { objetivosParaResumen } from './objetivosNutricion';
import { MINIMO_DIAS_ESTADISTICA, promediosDelPeriodo } from './estadisticasNutricion';
import { mlDelDia, progresoAgua, textoDeLitros, normalizarObjetivoAgua, fraseDeAgua } from './aguaNutricion';
import { fechaValida, addDays } from './helpers';
import { etiquetaDeDia, etiquetaDeRango, fechasDelRango, diasDelRango, diaDeLaSemana, diaYMesConversacion } from './fechasConversacion';
import { bTexto, bNota, bCifra, bLista, plural, detectarConceptos } from './motorConversacion';

const lista = (x) => (Array.isArray(x) ? x : []);
const mayuscula = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);
const DIAS_CORTOS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
const etiquetaP = (p, hoy) => p.etiqueta || etiquetaDeRango(p.desde, p.hasta, hoy);
const decimal = (n, d) => (d ? String(Math.round(n * 10) / 10).replace('.', ',') : String(Math.round(n)));
const FUENTE = 'Nutrición · lo que has registrado';

/** Las comidas que cuentan: con fecha válida (sin fecha no se le inventa un día). */
function comidasDe(nutricion) {
  return lista((nutricion || {}).comidas).map(normalizarComida).filter((c) => c && fechaValida(c.fecha));
}

/* Qué indicador pregunta (calorías, proteína…): si no dice ninguno, todos. */
const LEXICO_INDICADOR = {
  calorias: ['calorias', 'caloria', 'kcal', 'energia'],
  proteinas: ['proteina', 'proteinas', 'prote'],
  carbohidratos: ['carbohidratos', 'carbos', 'hidratos', 'carbs'],
  grasas: ['grasa', 'grasas'],
};
function indicadoresPedidos(trozo) {
  const h = detectarConceptos(trozo.tokens || [], LEXICO_INDICADOR);
  const ids = INDICADORES.map((i) => i.id).filter((id) => h.has(id));
  return ids.length ? ids : null;
}

const valorConUnidad = (ind, v) => `${decimal(v, ind.decimales)} ${ind.unidad}`;

/* ══════════════════════════════════════════════════════════════════════════
   Las capacidades
   ══════════════════════════════════════════════════════════════════════════ */

function dia(datos, { periodo, hoy, indicadores }) {
  const nutricion = datos.nutricion || {};
  const comidas = comidasDe(nutricion);
  const fecha = periodo.desde;
  const cuando = etiquetaDeDia(fecha, hoy);
  if (!comidasDelDia(comidas, fecha).length) {
    return { sinDatos: true, bloques: [bTexto(`No tienes nada registrado ${cuando}.`), bNota('Un día sin apuntar no es un día de 0 calorías: simplemente no hay datos.')], fuente: FUENTE };
  }
  const objetivos = objetivosParaResumen(nutricion);
  const resumen = resumenDelDia(comidas, fecha, objetivos);
  const pedidos = indicadores ? resumen.filter((r) => indicadores.includes(r.id)) : resumen;
  const principal = pedidos[0];
  const bloques = [bTexto(`${mayuscula(cuando)} ${fecha === hoy ? 'llevas registradas' : 'registraste'} ${valorConUnidad(principal, principal.consumido)} de ${principal.nombre.toLowerCase()}${principal.objetivo ? `, de ${valorConUnidad(principal, principal.objetivo)} de tu objetivo` : ''}.`)];
  for (const r of pedidos) {
    bloques.push(bCifra(`${r.emoji} ${r.nombre}`, valorConUnidad(r, r.consumido), 'calculo', r.objetivo ? `${r.porcentaje} % de tu objetivo de ${valorConUnidad(r, r.objetivo)}` : null));
  }
  bloques.push(bCifra('Alimentos registrados', String(comidasDelDia(comidas, fecha).length), 'dato'));
  if (fecha === hoy) bloques.push(bNota('El día sigue en curso: es lo que llevas apuntado hasta ahora.'));
  if (!objetivos) bloques.push(bNota('No tienes objetivos de nutrición puestos, así que no lo comparo con nada.'));
  return { bloques, fuente: `${FUENTE} ${cuando}` };
}

/** La media de un periodo cualquiera con la regla de `promediosDelPeriodo`. */
function mediaDelRango(comidas, desde, hasta) {
  const dias = fechasDelRango(desde, hasta).map((fecha) => {
    const delDia = comidasDelDia(comidas, fecha);
    if (!delDia.length) return { fecha, tieneDatos: false };
    const r = resumenDelDia(comidas, fecha, null);
    return { fecha, tieneDatos: true, totales: Object.fromEntries(r.map((x) => [x.id, x.consumido])) };
  });
  const con = dias.filter((d) => d.tieneDatos);
  const promedio = {};
  for (const ind of INDICADORES) {
    const suma = con.reduce((a, d) => a + (d.totales[ind.id] ?? 0), 0);
    promedio[ind.id] = con.length ? (ind.decimales ? Math.round((suma / con.length) * 10) / 10 : Math.round(suma / con.length)) : null;
  }
  return { promedio, diasConDatos: con.length, diasDelRango: dias.length, dias };
}

/* Si el periodo es justo uno de los de Estadísticas (los últimos 7, 30 o 91 días hasta hoy), lo
   calcula SU motor; si no, la misma regla con los mismos días. La suite comprueba que dan lo mismo. */
const PERIODOS_DEL_MOTOR = { 7: '7d', 30: '30d', 91: '3m' };
function promedios(comidas, periodo, hoy) {
  const n = diasDelRango(periodo.desde, periodo.hasta);
  if (periodo.hasta === hoy && PERIODOS_DEL_MOTOR[n]) {
    const m = promediosDelPeriodo(comidas, PERIODOS_DEL_MOTOR[n], hoy);
    return { promedio: m.promedio, diasConDatos: m.diasConDatos, diasDelRango: m.diasDelRango, dias: m.dias };
  }
  return mediaDelRango(comidas, periodo.desde, periodo.hasta);
}

function media(datos, { periodo, hoy, indicadores }) {
  const nutricion = datos.nutricion || {};
  if (periodo.tipo === 'dia') return dia(datos, { periodo, hoy, indicadores });
  const comidas = comidasDe(nutricion);
  const etiqueta = etiquetaP(periodo, hoy);
  const m = promedios(comidas, periodo, hoy);
  const pedidos = INDICADORES.filter((i) => !indicadores || indicadores.includes(i.id));
  if (!m.diasConDatos) return { sinDatos: true, bloques: [bTexto(`No tienes nada registrado ${etiqueta}.`)], fuente: FUENTE };
  if (m.diasConDatos < MINIMO_DIAS_ESTADISTICA) {
    const d = m.dias.find((x) => x.tieneDatos);
    return {
      confianza: 'pocos_datos',
      bloques: [
        bTexto(`${mayuscula(etiqueta)} solo tienes un día con algo registrado (${etiquetaDeDia(d.fecha, hoy)}), y para una media hacen falta ${MINIMO_DIAS_ESTADISTICA}.`),
        ...pedidos.map((ind) => bCifra(`${ind.emoji} ${ind.nombre} ese día`, valorConUnidad(ind, d.totales[ind.id] ?? 0), 'calculo')),
      ],
      fuente: FUENTE,
    };
  }
  const objetivos = objetivosParaResumen(nutricion);
  const principal = pedidos[0];
  const bloques = [bTexto(`${mayuscula(etiqueta)} has registrado de media ${valorConUnidad(principal, m.promedio[principal.id])} de ${principal.nombre.toLowerCase()} al día.`)];
  for (const ind of pedidos) {
    const obj = objetivos && Number(objetivos[ind.id]) > 0 ? Number(objetivos[ind.id]) : null;
    bloques.push(bCifra(`${ind.emoji} ${ind.nombre}`, valorConUnidad(ind, m.promedio[ind.id]), 'calculo', obj ? `tu objetivo es ${valorConUnidad(ind, obj)}` : null));
  }
  bloques.push(bCifra('Días con algo registrado', `${m.diasConDatos} de ${m.diasDelRango}`, 'dato'));
  bloques.push(bNota(`Divido entre los ${m.diasConDatos} días con algo apuntado, no entre los ${m.diasDelRango} del periodo: un día sin registrar no es un día sin comer.`));
  if (periodo.hasta === hoy && comidasDelDia(comidas, hoy).length) bloques.push(bNota('Incluye hoy, que sigue en curso.'));
  if (periodo.recortado) bloques.push(bNota('Cuento hasta hoy: lo que queda del periodo todavía no ha pasado.'));
  return { bloques, fuente: `${FUENTE} · ${plural(m.diasConDatos, 'día', 'días')} ${etiqueta}`, confianza: m.diasConDatos < 4 ? 'pocos_datos' : 'normal' };
}

function comidas(datos, { periodo, hoy }) {
  const todas = comidasDe(datos.nutricion);
  const fecha = periodo.desde;
  const cuando = etiquetaDeDia(fecha, hoy);
  const grupos = porMomento(todas, fecha);
  const total = comidasDelDia(todas, fecha).length;
  if (!total) return { sinDatos: true, bloques: [bTexto(`No tienes nada registrado ${cuando}.`)], fuente: FUENTE };
  const items = MOMENTOS.filter((m) => grupos[m.id].length).map((m) => `${m.emoji} ${m.nombre}: ${grupos[m.id].map((c) => `${c.nombre || 'Sin nombre'}${Number(c.calorias) > 0 ? ` (${Math.round(Number(c.calorias))} kcal)` : ''}`).join(', ')}`);
  return { bloques: [bTexto(`Esto es lo que registraste ${cuando}:`), bLista(items, MOMENTOS.length)], fuente: `${FUENTE} · ${plural(total, 'alimento', 'alimentos')}` };
}

function agua(datos, { periodo, hoy }) {
  const nutricion = datos.nutricion || {};
  const fecha = periodo.desde;
  const cuando = etiquetaDeDia(fecha, hoy);
  const ml = mlDelDia(nutricion.agua, fecha);
  const objetivo = normalizarObjetivoAgua(nutricion.objetivoAgua).ml;
  if (!ml) {
    return { sinDatos: true, bloques: [bTexto(`No tienes agua registrada ${cuando}.`), ...(objetivo ? [bNota(`Tu objetivo es ${textoDeLitros(objetivo)} al día.`)] : [])], fuente: 'Nutrición · agua' };
  }
  const p = progresoAgua(ml, objetivo);
  const bloques = [bTexto(`${mayuscula(cuando)} ${fecha === hoy ? 'llevas' : 'registraste'} ${textoDeLitros(ml)} de agua.`), bCifra('Agua', textoDeLitros(ml), 'dato')];
  if (objetivo) {
    bloques.push(bCifra('Tu objetivo', textoDeLitros(objetivo), 'dato', `${p.porcentaje} %`));
    const frase = fraseDeAgua(p);
    if (frase) bloques.push(bNota(frase));
  } else {
    bloques.push(bNota('No te has puesto un objetivo de agua. La pantalla de Nutrición te propone uno.'));
  }
  return { bloques, fuente: 'Nutrición · agua' };
}

function constancia(datos, { periodo, hoy }) {
  const todas = comidasDe(datos.nutricion);
  const dias = fechasDelRango(periodo.desde, periodo.hasta);
  const con = dias.filter((f) => comidasDelDia(todas, f).length);
  const etiqueta = etiquetaP(periodo, hoy);
  const bloques = [
    bTexto(`${mayuscula(etiqueta)} has registrado algo ${plural(con.length, 'día', 'días')} de ${dias.length}.`),
    bCifra('Días con algo registrado', `${con.length} de ${dias.length}`, 'dato'),
  ];
  const sin = dias.filter((f) => !con.includes(f));
  if (sin.length && sin.length <= 10) bloques.push(bNota(`Sin registrar: ${sin.map((f) => `${DIAS_CORTOS[diaDeLaSemana(f)]} ${diaYMesConversacion(f, hoy)}`).join(', ')}.`));
  bloques.push(bNota('Es un recuento, no una racha: no importa si los días van seguidos.'));
  return { bloques, fuente: FUENTE };
}

function extremos(datos, { periodo, hoy }) {
  const todas = comidasDe(datos.nutricion);
  const etiqueta = etiquetaP(periodo, hoy);
  const dias = fechasDelRango(periodo.desde, periodo.hasta)
    .filter((f) => comidasDelDia(todas, f).length)
    .map((f) => ({ fecha: f, kcal: resumenDelDia(todas, f, null).find((r) => r.id === 'calorias').consumido }));
  if (!dias.length) return { sinDatos: true, bloques: [bTexto(`No tienes nada registrado ${etiqueta}.`)], fuente: FUENTE };
  if (dias.length === 1) return { confianza: 'pocos_datos', bloques: [bTexto(`${mayuscula(etiqueta)} solo hay un día con algo registrado (${etiquetaDeDia(dias[0].fecha, hoy)}, ${dias[0].kcal} kcal).`)], fuente: FUENTE };
  const mas = [...dias].sort((a, b) => b.kcal - a.kcal || (a.fecha < b.fecha ? 1 : -1))[0];
  const menos = [...dias].sort((a, b) => a.kcal - b.kcal || (a.fecha < b.fecha ? 1 : -1))[0];
  return {
    bloques: [
      bCifra('Día con más calorías registradas', `${mas.kcal} kcal (${etiquetaDeDia(mas.fecha, hoy)})`, 'calculo'),
      bCifra('Día con menos', `${menos.kcal} kcal (${etiquetaDeDia(menos.fecha, hoy)})`, 'calculo'),
      bNota('Solo entre los días con algo apuntado; un día con poco registrado puede ser un día que no apuntaste todo.'),
    ],
    fuente: `${FUENTE} · ${plural(dias.length, 'día', 'días')} ${etiqueta}`,
  };
}

/* 🐛 D6 — «¿comí más que ayer?» iba a «extremos» (el día con más y con menos de un periodo) y contestaba
   «ayer solo hay un día con algo registrado». Lo que pregunta es comparar DOS días: hoy con ayer si no
   dice más; hoy con el día que nombre («¿comí más que el lunes?»); o los dos que nombre. Cada día es
   `resumenDelDia`, lo mismo que la pantalla. Si a uno le falta registro se dice, y no se compara: un día
   sin apuntar no es un día de 0 calorías. Ni un juicio: «más» y «menos», nunca «mucho» ni «poco». */
function compararDias(datos, { periodo, segundoPeriodo, hoy, indicadores }) {
  const nutricion = datos.nutricion || {};
  const todas = comidasDe(nutricion);
  if ((periodo && periodo.desde !== periodo.hasta) || (segundoPeriodo && segundoPeriodo.desde !== segundoPeriodo.hasta)) {
    return { sinDatos: true, bloques: [bTexto('Comparo días sueltos, por ejemplo hoy con ayer. Para comparar semanas o meses, pregúntame la media de cada uno.')], fuente: FUENTE };
  }
  let a = hoy;
  let b = addDays(hoy, -1);
  if (periodo && segundoPeriodo) { a = periodo.desde; b = segundoPeriodo.desde; } else if (periodo && periodo.desde !== hoy) b = periodo.desde;
  const etiquetaA = etiquetaDeDia(a, hoy);
  const etiquetaB = etiquetaDeDia(b, hoy);
  if (a === b) return { sinDatos: true, bloques: [bTexto(`Has nombrado dos veces el mismo día (${etiquetaA}). Dime con qué otro día lo comparo.`)], fuente: FUENTE };
  if (b > hoy || a > hoy) {
    return { sinDatos: true, bloques: [bTexto(`${mayuscula(b > hoy ? etiquetaB : etiquetaA)} todavía no ha llegado, así que no hay nada que comparar.`)], fuente: FUENTE };
  }
  const conA = comidasDelDia(todas, a).length > 0;
  const conB = comidasDelDia(todas, b).length > 0;
  const pedidos = INDICADORES.filter((i) => (indicadores ? indicadores.includes(i.id) : i.id === 'calorias'));
  const nota = bNota('Un día sin apuntar no es un día de 0 calorías: simplemente no hay datos.');
  if (!conA && !conB) return { sinDatos: true, bloques: [bTexto(`No tienes nada registrado ni ${etiquetaA} ni ${etiquetaB}, así que no hay nada que comparar.`), nota], fuente: FUENTE };
  if (!conA || !conB) {
    const con = conA ? a : b;
    const resumen = resumenDelDia(todas, con, null);
    return {
      sinDatos: true,
      bloques: [
        bTexto(`${mayuscula(conA ? etiquetaB : etiquetaA)} no tienes nada registrado, así que no lo puedo comparar con ${conA ? etiquetaA : etiquetaB}.`),
        ...pedidos.map((ind) => bCifra(`${ind.emoji} ${ind.nombre} ${conA ? etiquetaA : etiquetaB}`, valorConUnidad(ind, resumen.find((r) => r.id === ind.id).consumido), 'calculo')),
        nota,
      ],
      fuente: FUENTE,
    };
  }
  const ra = resumenDelDia(todas, a, null);
  const rb = resumenDelDia(todas, b, null);
  const valor = (r, id) => r.find((x) => x.id === id).consumido;
  const principal = pedidos[0];
  const va = valor(ra, principal.id);
  const vb = valor(rb, principal.id);
  const dif = Math.abs(va - vb);
  const redondeada = Number(decimal(dif, principal.decimales).replace(',', '.'));
  const verboA = a === hoy ? 'llevas registradas' : 'registraste';
  const cierre = redondeada === 0 ? 'Es lo mismo los dos días.' : `Son ${valorConUnidad(principal, dif)} ${va > vb ? 'más' : 'menos'} ${etiquetaA}.`;
  const bloques = [bTexto(`${mayuscula(etiquetaA)} ${verboA} ${valorConUnidad(principal, va)} de ${principal.nombre.toLowerCase()}, y ${etiquetaB} ${b === hoy ? 'llevas ' : ''}${valorConUnidad(principal, vb)}. ${cierre}`)];
  for (const ind of pedidos) bloques.push(bCifra(`${ind.emoji} ${ind.nombre}`, `${valorConUnidad(ind, valor(ra, ind.id))} · ${valorConUnidad(ind, valor(rb, ind.id))}`, 'calculo', `${etiquetaA} · ${etiquetaB}`));
  if (a === hoy || b === hoy) bloques.push(bNota('Hoy sigue en curso: es lo que llevas apuntado hasta ahora.'));
  bloques.push(bNota('Comparo lo que registraste; no digo si es mucho o poco.'));
  return { bloques, fuente: `${FUENTE} · ${etiquetaA} y ${etiquetaB}` };
}

const conIndicadores = (trozo) => ({ indicadores: indicadoresPedidos(trozo) });

export const ASISTENTE_NUTRICION = {
  id: 'nutricion',
  modulo: 'nutricion',
  nombre: 'Nutrición',
  lee: ['nutricion'],
  saludo: '¡Hola! Pregúntame por lo que has registrado: calorías y macros de un día, tu media, qué comiste o el agua.',
  lexico: {
    comer: ['comer', 'comi', 'comido', 'he comido', 'comida', 'comidas', 'cene', 'cenado', 'desayune', 'almorce', 'merende', 'zampe', 'ingerido', 'alimentacion', 'dieta', 'nutricion', 'consumido', 'he tomado', 'alimentos'],
    indicador: ['calorias', 'caloria', 'kcal', 'energia', 'proteina', 'proteinas', 'carbohidratos', 'carbos', 'hidratos', 'grasa', 'grasas', 'macros'],
    llevo: ['llevo', 'llevo hoy', 'voy por', 'he consumido', 'he tomado'],
    que_comi: ['que comi', 'que he comido', 'que cene', 'que desayune', 'que almorce', 'que meriende', 'que tome', 'que he tomado', 'que comida', 'lo que comi', 'lo que he comido'],
    momento: ['desayuno', 'merienda', 'cena', 'almuerzo', 'extras', 'snack', 'picoteo'],
    agua: ['agua', 'beber', 'bebido', 'he bebido', 'vasos', 'vaso', 'hidratacion', 'litros'],
    extremo_dia: ['que dia comi mas', 'que dia comi menos', 'dia que mas', 'dia que menos', 'dia con mas', 'dia con menos', 'comi mas', 'comi menos', 'mas calorias', 'menos calorias', 'mas he comido', 'menos he comido'],
    registro: ['registr*', 'apuntad*', 'cuantos dias', 'dias he apuntado', 'he apuntado', 'olvide apuntar', 'sin apuntar'],
    /* D6 — comparar un día con otro: «más que ayer», «menos que el lunes». */
    mas_menos: ['comi mas', 'comi menos', 'he comido mas', 'he comido menos', 'llevo mas', 'llevo menos', 'mas calorias', 'menos calorias'],
    referencia_dia: ['que ayer', 'que hoy', 'que anteayer', 'que antes de ayer', 'que el dia anterior', 'que el otro dia',
      'que el lunes', 'que el martes', 'que el miercoles', 'que el jueves', 'que el viernes', 'que el sabado', 'que el domingo', 'que el dia'],
  },
  capacidades: [
    { id: 'dia', titulo: 'Lo que llevas registrado un día', ejemplo: '¿Cuántas calorías llevo hoy?', senales: { comer: 2, indicador: 2, llevo: 2, cuanto: 1 }, necesita: [['comer', 'indicador', 'llevo']], periodo: 'dia', siRango: 'media', porDefecto: 'hoy', prioridad: 3, argumentos: conIndicadores, ejecutar: dia },
    { id: 'media', titulo: 'Tu media diaria en un periodo', ejemplo: '¿Cuál es mi media de proteína esta semana?', senales: { media: 3, comer: 1, indicador: 2 }, necesita: [['media', 'comer', 'indicador']], periodo: 'rango', porDefecto: 'ultimos7', prioridad: 2, argumentos: conIndicadores, ejecutar: media },
    { id: 'comidas', titulo: 'Qué registraste un día', ejemplo: '¿Qué comí ayer?', senales: { que_comi: 4, comer: 1, momento: 2 }, necesita: [['que_comi', 'momento']], periodo: 'dia', porDefecto: 'hoy', prioridad: 2, ejecutar: comidas },
    { id: 'agua', titulo: 'El agua de un día', ejemplo: '¿Cuánta agua llevo hoy?', senales: { agua: 5 }, necesita: [['agua']], periodo: 'dia', porDefecto: 'hoy', prioridad: 1, ejecutar: agua },
    { id: 'constancia', titulo: 'Qué días has registrado', ejemplo: '¿Cuántos días he apuntado lo que como este mes?', senales: { registro: 4, comer: 1 }, necesita: [['registro']], periodo: 'rango', porDefecto: 'ultimos7', prioridad: 1, ejecutar: constancia },
    /* Con un rango («esta semana que la pasada») contesta que compara días sueltos (`periodo: 'ambos'`, sin
       hermana de rango): preguntar «¿qué día?» no tendría sentido en una comparación. */
    { id: 'comparar_dias', titulo: 'Comparar lo que comiste dos días', ejemplo: '¿Comí más que ayer?', senales: { comparar: 4, referencia_dia: 3, mas_menos: 2, comer: 1, indicador: 1 }, necesita: [['comparar', 'referencia_dia', 'mas_menos']], periodo: 'ambos', dosPeriodos: true, prioridad: 2, argumentos: conIndicadores, ejecutar: compararDias },
    { id: 'extremos', titulo: 'El día con más y con menos calorías', ejemplo: '¿Qué día comí más esta semana?', senales: { extremo_dia: 4, comer: 1, indicador: 1 }, necesita: [['extremo_dia']], periodo: 'rango', porDefecto: 'ultimos7', prioridad: 1, ejecutar: extremos },
  ],
};

/* La media de un rango con la regla del motor y sin el atajo: la suite la compara con
   `promediosDelPeriodo` para demostrar que dan lo mismo. */
export const mediaDelRangoNutricion = mediaDelRango;
