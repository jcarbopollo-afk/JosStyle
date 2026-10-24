/* Fase 2 · Chatbots — las fechas relativas de una conversación
   ═══════════════════════════════════════════════════════════════════════════

   «anoche», «el lunes», «la semana pasada», «hace tres días», «el 12 de
   octubre»… Hasta ahora nadie en JosStyle traducía una expresión así: solo había
   usos sueltos de «hoy» y «ayer» en cada pantalla. La especificación es
   `docs/15_asistentes/ESPECIFICACION_CHATBOTS.md` §7.5.

   🚨 **Siempre en local y con `hoy` inyectado**: el UTC devolvió el día
   equivocado seis veces en este proyecto (`todayISO`, `addDays`, las
   recurrencias…), así que aquí solo se usan `addDays` y `fechaValida` de
   `helpers.js`, y `hoy` llega de fuera (la aplicación pasa `useHoyISO()`, que
   cambia a medianoche; las pruebas fijan el día).

   🚨 **Una fecha imposible no se adivina**: «31 de febrero» vuelve marcada como
   inválida y quien contesta lo dice. Y una expresión ambigua —«el lunes», «el
   12»— se resuelve según el tiempo de la pregunta que la usa: en pasado, la más
   reciente que ya llegó; en futuro, la siguiente.

   ⚠️ Recibe el texto YA normalizado (minúsculas, sin acentos), que es lo que
   produce `normalizarMensaje` del núcleo. Es una hoja del árbol de imports: no
   conoce ningún módulo ni ningún dato. */

import { addDays, fechaValida } from './helpers';

export const DIAS_SEMANA_CONVERSACION = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const NOMBRES_DIA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
export const MESES_CONVERSACION = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/* Los números escritos que salen en una fecha. «un par» son dos, que es como lo
   dice cualquiera («hace un par de días»). */
const NUMEROS = {
  'un par': 2, un: 1, una: 1, uno: 1, dos: 2, par: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8,
  nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16,
  veinte: 20, treinta: 30,
};
const NUM = `(\\d{1,3}|${Object.keys(NUMEROS).sort((a, b) => b.length - a.length).join('|')})`;
const numero = (t) => (/^\d+$/.test(t) ? Number(t) : NUMEROS[t] ?? null);

/** El lunes de la semana de una fecha (la semana empieza el lunes, E3 F10). */
export function lunesDeFecha(iso) {
  const d = new Date(`${iso}T00:00:00`).getDay();
  return addDays(iso, -((d + 6) % 7));
}

/** 0 = lunes … 6 = domingo. */
export const diaDeLaSemana = (iso) => (new Date(`${iso}T00:00:00`).getDay() + 6) % 7;

const ultimoDiaDelMes = (anio, mes) => new Date(anio, mes, 0).getDate();
const iso = (anio, mes, dia) => `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
const partes = (f) => f.split('-').map(Number);

function rangoDeMes(anio, mes) {
  return { desde: iso(anio, mes, 1), hasta: iso(anio, mes, ultimoDiaDelMes(anio, mes)) };
}

/* ── Las etiquetas: cómo se dice una fecha en una respuesta ─────────────────
   Nunca «2026-10-21»: «hoy», «ayer», «el martes 21 de octubre». Un rango, «del 13
   al 19 de octubre». Escritas aquí y no con `toLocaleDateString`, que no da lo
   mismo en todos los Node (FIT F39). */
export function etiquetaDeDia(fecha, hoy) {
  if (!fechaValida(fecha)) return 'una fecha que no es válida';
  if (fecha === hoy) return 'hoy';
  if (fecha === addDays(hoy, -1)) return 'ayer';
  if (fecha === addDays(hoy, 1)) return 'mañana';
  const [a, m, d] = partes(fecha);
  const anio = a !== partes(hoy)[0] ? ` de ${a}` : '';
  return `el ${NOMBRES_DIA[diaDeLaSemana(fecha)]} ${d} de ${MESES_CONVERSACION[m - 1]}${anio}`;
}

/** «21 de octubre», sin el día de la semana: para dentro de una frase o un rango. */
export function diaYMesConversacion(fecha, hoy) {
  if (!fechaValida(fecha)) return '—';
  const [a, m, d] = partes(fecha);
  const anio = hoy && a !== partes(hoy)[0] ? ` de ${a}` : '';
  return `${d} de ${MESES_CONVERSACION[m - 1]}${anio}`;
}

export function etiquetaDeRango(desde, hasta, hoy) {
  if (desde === hasta) return etiquetaDeDia(desde, hoy);
  const [a1, m1, d1] = partes(desde);
  const [a2, m2, d2] = partes(hasta);
  if (a1 === a2 && m1 === m2) {
    const anio = a1 !== partes(hoy)[0] ? ` de ${a1}` : '';
    return `del ${d1} al ${d2} de ${MESES_CONVERSACION[m1 - 1]}${anio}`;
  }
  return `del ${diaYMesConversacion(desde, hoy)} al ${diaYMesConversacion(hasta, hoy)}`;
}

/** Cuántos días tiene un rango, contando los dos extremos. */
export function diasDelRango(desde, hasta) {
  const a = new Date(`${desde}T00:00:00`).getTime();
  const b = new Date(`${hasta}T00:00:00`).getTime();
  return Math.round((b - a) / 86400000) + 1;
}

/** Todas las fechas de un rango, en orden. Con un tope para que un rango absurdo no cuelgue nada. */
export function fechasDelRango(desde, hasta, tope = 3700) {
  const salida = [];
  for (let f = desde; f <= hasta && salida.length < tope; f = addDays(f, 1)) salida.push(f);
  return salida;
}

/* ── Las reglas ──────────────────────────────────────────────────────────────
   Cada una: una expresión regular sobre el texto normalizado y una función que
   devuelve el rango. Se aplican EN ESTE ORDEN y un trozo ya usado no se vuelve a
   usar: «pasado mañana» antes que «mañana», «anteayer» antes que «ayer», «la
   semana pasada» antes que «esta semana». */
function dia(f, extra = {}) {
  return { desde: f, hasta: f, tipo: 'dia', ...extra };
}
function rango(desde, hasta, extra = {}) {
  return desde === hasta ? dia(desde, extra) : { desde, hasta, tipo: 'rango', ...extra };
}

function finDeSemana(hoy, tiempo, cual) {
  const lunes = lunesDeFecha(hoy);
  const dow = diaDeLaSemana(hoy);
  if (cual === 'pasado') return rango(addDays(lunes, -2), addDays(lunes, -1));
  if (cual === 'que_viene') return rango(addDays(lunes, 12), addDays(lunes, 13));
  /* «este finde»: en pasado, el último que ya ha empezado; en futuro, el siguiente. */
  if (dow >= 5) return rango(addDays(lunes, 5), tiempo === 'pasado' ? hoy : addDays(lunes, 6));
  return tiempo === 'pasado' ? rango(addDays(lunes, -2), addDays(lunes, -1)) : rango(addDays(lunes, 5), addDays(lunes, 6));
}

function diaDeSemanaNombrado(hoy, indice, tiempo, matiz) {
  const dow = diaDeLaSemana(hoy);
  if (matiz === 'pasado') {
    let atras = (dow - indice + 7) % 7;
    if (atras === 0) atras = 7;
    return dia(addDays(hoy, -atras));
  }
  if (matiz === 'que_viene') {
    let delante = (indice - dow + 7) % 7;
    if (delante === 0) delante = 7;
    return dia(addDays(hoy, delante));
  }
  if (tiempo === 'futuro') return dia(addDays(hoy, (indice - dow + 7) % 7));
  return dia(addDays(hoy, -((dow - indice + 7) % 7)));
}

function fechaConDiaYMes(hoy, d, m, a, tiempo) {
  const [ah] = partes(hoy);
  if (a) {
    const anio = a < 100 ? 2000 + a : a;
    const f = iso(anio, m, d);
    return fechaValida(f) ? dia(f) : { invalida: true, texto: `${d}/${m}/${anio}` };
  }
  const esteAnio = iso(ah, m, d);
  /* El 29 de febrero sin año: el más cercano que exista en el sentido de la pregunta. */
  const candidatos = [ah - 4, ah - 3, ah - 2, ah - 1, ah, ah + 1, ah + 2, ah + 3, ah + 4].map((x) => iso(x, m, d)).filter(fechaValida);
  if (!candidatos.length) return { invalida: true, texto: `${d} de ${MESES_CONVERSACION[m - 1] || m}` };
  if (tiempo === 'futuro') return dia(candidatos.find((f) => f >= hoy) || candidatos[candidatos.length - 1]);
  const pasados = candidatos.filter((f) => f <= hoy);
  return dia(pasados.length ? pasados[pasados.length - 1] : (fechaValida(esteAnio) ? esteAnio : candidatos[0]));
}

function diaSuelto(hoy, d, tiempo) {
  const [a, m] = partes(hoy);
  if (d < 1 || d > 31) return { invalida: true, texto: `el ${d}` };
  const meses = [];
  for (let k = -2; k <= 2; k += 1) {
    const fecha = new Date(a, m - 1 + k, 1);
    meses.push([fecha.getFullYear(), fecha.getMonth() + 1]);
  }
  const posibles = meses.map(([y, mm]) => iso(y, mm, d)).filter(fechaValida);
  if (tiempo === 'futuro') return posibles.find((f) => f >= hoy) ? dia(posibles.find((f) => f >= hoy)) : { invalida: true, texto: `el ${d}` };
  const pasados = posibles.filter((f) => f <= hoy);
  return pasados.length ? dia(pasados[pasados.length - 1]) : { invalida: true, texto: `el ${d}` };
}

const MES = `(${MESES_CONVERSACION.join('|')}|setiembre)`;
const mesNumero = (t) => (t === 'setiembre' ? 9 : MESES_CONVERSACION.indexOf(t) + 1);
const UNIDADES_NO_FECHA = 'horas?|h|minutos?|min|kg|kilos?|series?|reps?|repeticiones|veces|calorias|kcal|gramos?|g|litros?|ml|vasos?|paginas?|euros?|pomodoros?|puntos?|%';

const REGLAS = [
  { re: /\bpasado manana\b/g, f: (m, hoy) => dia(addDays(hoy, 2)) },
  { re: /\b(anteayer|antes de ayer|antesdeayer)\b/g, f: (m, hoy) => dia(addDays(hoy, -2)) },
  { re: /\b(anoche|esta noche pasada|la noche pasada|esta ultima noche|la ultima noche)\b/g, f: (m, hoy) => dia(hoy, { noche: true }) },
  { re: /\b(?:del|desde el) (\d{1,2}) (?:al|hasta el) (\d{1,2})(?: de ([a-z]+))?\b/g, f: (m, hoy, t) => {
    const mes = m[3] && mesNumero(m[3]) > 0 ? mesNumero(m[3]) : partes(hoy)[1];
    const a = fechaConDiaYMes(hoy, Number(m[1]), mes, null, t);
    const b = fechaConDiaYMes(hoy, Number(m[2]), mes, null, t);
    if (a.invalida || b.invalida) return a.invalida ? a : b;
    return a.desde <= b.desde ? rango(a.desde, b.desde) : rango(b.desde, a.desde);
  } },
  { re: new RegExp(`\\bhace ${NUM}(?: de)? (dias?|semanas?|mes|meses|anos?)\\b`, 'g'), f: (m, hoy) => {
    const n = numero(m[1]);
    if (n === null) return null;
    if (/^dia/.test(m[2])) return dia(addDays(hoy, -n));
    if (/^semana/.test(m[2])) return dia(addDays(hoy, -7 * n));
    const [a, mm, d] = partes(hoy);
    const fecha = /^ano/.test(m[2]) ? new Date(a - n, mm - 1, d) : new Date(a, mm - 1 - n, d);
    return dia(iso(fecha.getFullYear(), fecha.getMonth() + 1, fecha.getDate()));
  } },
  { re: new RegExp(`\\b(?:los |las |el |la )?(?:ultim[oa]s?) (?:${NUM} )?(dias?|semanas?|mes|meses)\\b`, 'g'), f: (m, hoy) => {
    const n = m[1] ? numero(m[1]) : (/^dia/.test(m[2]) ? 7 : 1);
    if (!n || n < 1) return null;
    const dias = /^dia/.test(m[2]) ? n : /^semana/.test(m[2]) ? 7 * n : 30 * n;
    return rango(addDays(hoy, -(Math.min(dias, 3650) - 1)), hoy);
  } },
  { re: new RegExp(`\\b(?:los |las |en los |en las )?(?:proxim[oa]s|siguientes) (?:${NUM} )?(dias|semanas|meses)\\b`, 'g'), f: (m, hoy) => {
    const n = m[1] ? numero(m[1]) : (/^dia/.test(m[2]) ? 7 : 1);
    if (!n || n < 1) return null;
    const dias = /^dia/.test(m[2]) ? n : /^semana/.test(m[2]) ? 7 * n : 30 * n;
    return rango(hoy, addDays(hoy, Math.min(dias, 3650) - 1));
  } },
  { re: /\b(?:la )?semana (?:pasada|anterior)\b/g, f: (m, hoy) => {
    const l = addDays(lunesDeFecha(hoy), -7);
    return rango(l, addDays(l, 6), { nombre: 'la semana pasada' });
  } },
  { re: /\b(?:la )?(?:semana (?:que viene|siguiente|proxima)|proxima semana)\b/g, f: (m, hoy) => {
    const l = addDays(lunesDeFecha(hoy), 7);
    return rango(l, addDays(l, 6), { nombre: 'la semana que viene' });
  } },
  { re: /\b(?:esta|de esta) semana\b/g, f: (m, hoy, t) => {
    const l = lunesDeFecha(hoy);
    return t === 'futuro' ? rango(hoy, addDays(l, 6), { nombre: 'esta semana' }) : rango(l, hoy, { nombre: 'esta semana' });
  } },
  { re: /\b(?:el )?(?:fin de semana|finde) (pasado|anterior)\b/g, f: (m, hoy, t) => finDeSemana(hoy, t, 'pasado') },
  { re: /\b(?:el )?(?:fin de semana|finde) (?:que viene|proximo|siguiente)\b/g, f: (m, hoy, t) => finDeSemana(hoy, t, 'que_viene') },
  { re: /\b(?:este |el )?(?:fin de semana|finde)\b/g, f: (m, hoy, t) => finDeSemana(hoy, t, null) },
  { re: /\b(?:el )?mes (?:pasado|anterior)\b/g, f: (m, hoy) => {
    const [a, mm] = partes(hoy);
    const d = new Date(a, mm - 2, 1);
    const r = rangoDeMes(d.getFullYear(), d.getMonth() + 1);
    return rango(r.desde, r.hasta, { nombre: 'el mes pasado' });
  } },
  { re: /\b(?:el )?(?:mes (?:que viene|siguiente|proximo)|proximo mes)\b/g, f: (m, hoy) => {
    const [a, mm] = partes(hoy);
    const d = new Date(a, mm, 1);
    const r = rangoDeMes(d.getFullYear(), d.getMonth() + 1);
    return rango(r.desde, r.hasta, { nombre: 'el mes que viene' });
  } },
  { re: /\b(?:este|en este|de este) mes\b/g, f: (m, hoy, t) => {
    const [a, mm] = partes(hoy);
    const r = rangoDeMes(a, mm);
    return t === 'futuro' ? rango(hoy, r.hasta, { nombre: 'este mes' }) : rango(r.desde, hoy, { nombre: 'este mes' });
  } },
  { re: /\b(?:el )?ano (?:pasado|anterior)\b/g, f: (m, hoy) => {
    const a = partes(hoy)[0] - 1;
    return rango(iso(a, 1, 1), iso(a, 12, 31));
  } },
  { re: /\b(?:este|en este|de este) ano\b/g, f: (m, hoy, t) => {
    const a = partes(hoy)[0];
    return t === 'futuro' ? rango(hoy, iso(a, 12, 31)) : rango(iso(a, 1, 1), hoy);
  } },
  { re: /\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/g, f: (m, hoy, t) => {
    const d = Number(m[1]);
    const mm = Number(m[2]);
    if (mm < 1 || mm > 12 || d < 1 || d > 31) return { invalida: true, texto: m[0] };
    return fechaConDiaYMes(hoy, d, mm, m[3] ? Number(m[3]) : null, t);
  } },
  { re: new RegExp(`\\b(?:el )?(?:dia )?(\\d{1,2}) (?:de )?${MES}(?: (?:de |del )?(\\d{4}))?\\b`, 'g'), f: (m, hoy, t) =>
    fechaConDiaYMes(hoy, Number(m[1]), mesNumero(m[2]), m[3] ? Number(m[3]) : null, t) },
  { re: new RegExp(`\\b(?:en |de |el mes de |durante )${MES}\\b`, 'g'), f: (m, hoy, t) => {
    const mm = mesNumero(m[1]);
    const [a, actual] = partes(hoy);
    let anio = a;
    if (t === 'futuro' && mm < actual) anio = a + 1;
    if (t !== 'futuro' && mm > actual) anio = a - 1;
    const r = rangoDeMes(anio, mm);
    return rango(r.desde, r.hasta);
  } },
  { re: /\b(?:el |este |del )?(lunes|martes|miercoles|jueves|viernes|sabado|domingo)( pasado| anterior| que viene| proximo| siguiente)?\b/g, f: (m, hoy, t) => {
    const matiz = !m[2] ? null : /pasado|anterior/.test(m[2]) ? 'pasado' : 'que_viene';
    return diaDeSemanaNombrado(hoy, DIAS_SEMANA_CONVERSACION.indexOf(m[1]), t, matiz);
  } },
  { re: new RegExp(`\\b(?:el |el dia |dia )(\\d{1,2})\\b(?! (?:de )?(?:${UNIDADES_NO_FECHA})\\b)`, 'g'), f: (m, hoy, t) => diaSuelto(hoy, Number(m[1]), t) },
  { re: /\bmanana\b/g, f: (m, hoy) => dia(addDays(hoy, 1)) },
  { re: /\bayer\b/g, f: (m, hoy) => dia(addDays(hoy, -1)) },
  { re: /\b(hoy|esta manana|esta tarde|esta noche|de hoy)\b/g, f: (m, hoy) => dia(hoy) },
];

/**
 * Todas las fechas que aparecen en un texto normalizado, en el orden en que salen.
 *
 * @param {string} texto  ya normalizado (minúsculas, sin acentos)
 * @param {string} hoy    la fecha local de hoy, 'YYYY-MM-DD'
 * @param {{ tiempo?: 'pasado' | 'futuro' }} [opciones]
 * @returns {Array<{ desde, hasta, tipo: 'dia'|'rango', inicio, fin, texto, invalida?, noche?, futura? }>}
 */
export function interpretarFechas(texto, hoy, { tiempo = 'pasado' } = {}) {
  const t = String(texto || '');
  if (!fechaValida(hoy)) return [];
  const usado = new Array(t.length).fill(false);
  const halladas = [];
  for (const regla of REGLAS) {
    regla.re.lastIndex = 0;
    let m;
    while ((m = regla.re.exec(t)) !== null) {
      const inicio = m.index;
      const fin = m.index + m[0].length;
      if (usado.slice(inicio, fin).some(Boolean)) continue;
      const r = regla.f(m, hoy, tiempo);
      if (!r) continue;
      for (let i = inicio; i < fin; i += 1) usado[i] = true;
      if (r.invalida) {
        halladas.push({ invalida: true, inicio, fin, texto: m[0].trim() });
        continue;
      }
      const fechas = etiquetaDeRango(r.desde, r.hasta, hoy);
      halladas.push({ ...r, inicio, fin, texto: m[0].trim(), futura: r.hasta > hoy, etiqueta: r.nombre ? `${r.nombre} (${fechas})` : fechas });
    }
  }
  return halladas.sort((a, b) => a.inicio - b.inicio);
}

/** Un periodo hecho a mano (los «por defecto» de cada capacidad), con su etiqueta. */
export function periodoPorDefecto(id, hoy) {
  const l = lunesDeFecha(hoy);
  const tabla = {
    hoy: () => dia(hoy),
    ultimos7: () => rango(addDays(hoy, -6), hoy),
    ultimos30: () => rango(addDays(hoy, -29), hoy),
    estaSemana: () => rango(l, hoy),
    semanaEntera: () => rango(l, addDays(l, 6)),
    proximos60: () => rango(hoy, addDays(hoy, 59)),
  };
  const r = (tabla[id] || tabla.hoy)();
  return { ...r, etiqueta: id === 'ultimos7' ? 'los últimos 7 días' : id === 'ultimos30' ? 'los últimos 30 días'
    : id === 'estaSemana' ? 'esta semana' : id === 'proximos60' ? 'los próximos 60 días' : etiquetaDeRango(r.desde, r.hasta, hoy),
  porDefecto: true, futura: r.hasta > hoy };
}

/** El periodo anterior de la misma duración (para comparar). */
export function periodoAnterior(p) {
  const n = diasDelRango(p.desde, p.hasta);
  return rango(addDays(p.desde, -n), addDays(p.desde, -1));
}
