/* Fase 2 · Chatbots — el asistente de Sueño (el piloto del primer lote)
   ═══════════════════════════════════════════════════════════════════════════

   Solo lee `sueno` (su lista blanca, `lee`) y **cada cifra sale de `sueno.js`**:
   la duración sale de las dos horas guardadas (`duracionDe` decide si existe;
   en texto, minutos exactos: ver D8 más abajo), la media es `mediaDeMinutos` (la de la pantalla), la
   cara es `calidadDe`, el «3+» es `etiquetaInterrupciones` (especificación §8.1).

   🚨 **El registro de una noche lleva la fecha de la MAÑANA** (es cuando se
   contesta «¿cómo has dormido?»): «anoche» es el registro de hoy y «ayer» el de
   ayer, y la respuesta **siempre dice la fecha** («la noche que terminó ayer»),
   así nunca hay que adivinar (CB-14).

   🚨 **Un día sin registro no es una noche de 0 horas** (DA-11): ni entra en la
   media ni se rellena; se cuenta aparte y se dice. Y **ni una «hora media de
   acostarse»** (H-03): ningún motor la define, y promediar horas que cruzan la
   medianoche sería una métrica nueva. Se enseñan las horas tal cual. */

import { fechaValida, addDays } from './helpers';
import {
  normalizarRegistro, calidadDe, CALIDADES, horasQueFaltan,
  minutosDeNoche as minutosDeLaNoche, textoDuracion, textoMinutos, mediaDeMinutos, CALIDAD_ANALISIS_SUENO,
  etiquetaInterrupciones, primeraFechaConRegistro,
} from './sueno';
import { etiquetaDeDia, etiquetaDeRango, fechasDelRango, diasDelRango, lunesDeFecha, diaDeLaSemana, diaYMesConversacion } from './fechasConversacion';
import { bTexto, bNota, bCifra, bLista, plural } from './motorConversacion';

const mayuscula = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);
const DIAS_CORTOS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
/* 🐛 D8 y v3.161.2 — «23:30 → 07:15» son 7 h 45 min. La cuenta exacta (minutos enteros) vive en
   `minutosEntreHoras` (helpers.js) y la sirve sueno.js: `minutosDeNoche`, `textoDuracion` y
   `mediaDeMinutos` son LAS MISMAS que pinta la pantalla de Sueño, así que el chat y la pantalla no
   pueden decir dos duraciones distintas. Se reexporta con su nombre de siempre para las pruebas. */
export { minutosDeLaNoche };
const minutosTexto = (m) => textoMinutos(m) || '—';
const tieneDuracion = (r) => minutosDeLaNoche(r) !== null;

/* v3.161.3 — lo que el botón «Analizar mi sueño» de la pantalla de Sueño manda al asistente como primera
   pregunta. Es una pregunta más (la contesta `ultimas`, como «¿cómo han ido mis últimas noches?»), así que
   lo que venga después sigue la conversación con el mismo contexto. Sin IA ni red. */
export const TEXTO_ANALIZAR_SUENO = 'Analizar mi sueño';

/* ── Lo que se lee: las noches, limpias, de una en una por fecha ──────────────
   🚨 Lo que no tiene fecha válida se aparta (y se cuenta): `normalizarRegistro`
   le pondría HOY, que es un valor que cambia cada día (FIT F41). Dos noches con
   la misma fecha: gana la última guardada, como en la gráfica (`indicePorFecha`),
   y se apunta que había otra (7d). Lo de después de hoy no es pasado (CX-19).
   v3.161.3 — una hora escrita pero imposible («25:00») se distingue de una que
   no se apuntó (`horasNoValidas`): las dos dejan la noche sin duración, pero no
   se dicen igual. */
export function nochesDeSueno(sueno, hoy) {
  const mapa = new Map();
  const repetidas = new Set();
  const horasNoValidas = new Map();
  let sinFecha = 0;
  let futuras = 0;
  const escrita = (v) => typeof v === 'string' && v.trim() !== '';
  for (const crudo of Array.isArray(sueno) ? sueno : []) {
    if (!crudo || typeof crudo !== 'object' || !fechaValida(crudo.fecha)) { if (crudo) sinFecha += 1; continue; }
    const r = normalizarRegistro(crudo);
    if (!r) continue;
    if (r.fecha > hoy) { futuras += 1; continue; }
    if (mapa.has(r.fecha)) repetidas.add(r.fecha);
    mapa.set(r.fecha, r);
    const malas = [];
    if (escrita(crudo.horaDormir) && !r.horaDormir) malas.push('dormir');
    if (escrita(crudo.horaDespertar) && !r.horaDespertar) malas.push('despertar');
    if (malas.length) horasNoValidas.set(r.fecha, malas); else horasNoValidas.delete(r.fecha);
  }
  return { mapa, repetidas, sinFecha, futuras, horasNoValidas };
}

function delPeriodo(noches, periodo) {
  const dias = fechasDelRango(periodo.desde, periodo.hasta);
  const registros = dias.map((f) => noches.mapa.get(f)).filter(Boolean);
  return { dias, registros, huecos: dias.length - registros.length, repetidas: dias.filter((f) => noches.repetidas.has(f)) };
}

function notasDeCalidadDeDatos(noches, p) {
  const notas = [];
  if (p.repetidas.length) notas.push(bNota(`${p.repetidas.length === 1 ? 'Una noche tiene' : `${p.repetidas.length} noches tienen`} dos registros con la misma fecha; uso el último que guardaste, como la gráfica.`));
  if (noches.futuras) notas.push(bNota(`${plural(noches.futuras, 'registro tiene', 'registros tienen')} una fecha que todavía no ha llegado y no ${noches.futuras === 1 ? 'lo cuento' : 'los cuento'}.`));
  return notas;
}

const fuente = (n, etiqueta) => `Sueño · ${plural(n, 'noche registrada', 'noches registradas')} ${etiqueta}`;

/** La noche registrada más reciente antes de una fecha (para no dejarle sin nada). */
function anteriorA(noches, fecha) {
  const fechas = [...noches.mapa.keys()].filter((f) => f < fecha).sort();
  return fechas.length ? noches.mapa.get(fechas[fechas.length - 1]) : null;
}

const caraTexto = (r) => {
  const c = calidadDe(r.calidad);
  return c ? `${c.emoji} ${c.nombre}` : 'Sin contestar';
};

const NOMBRE_HORA = { dormir: 'la hora de dormir', despertar: 'la hora de despertar' };

/** Qué le falta a una noche para tener duración, dicho con palabras («falta la hora de despertar»). */
function queLeFalta(noches, r) {
  const malas = noches.horasNoValidas.get(r.fecha) || [];
  return horasQueFaltan(r).map((h) => (malas.includes(h) ? `${NOMBRE_HORA[h]} no es válida` : `falta ${NOMBRE_HORA[h]}`)).join(' y ');
}

const horaODesconocida = (h) => h || 'sin anotar';

/* La nota de las noches que no tienen las dos horas: no entran en la duración, y lo demás que apuntó sí
   cuenta (DA-11 y v3.161.3). Nombra hasta tres, con fecha. */
function notaSinHoras(noches, sinHoras, hoy, para = 'en la duración') {
  if (!sinHoras.length) return [];
  const nombradas = sinHoras.slice(-3).map((r) => `la que terminó ${etiquetaDeDia(r.fecha, hoy)} (${queLeFalta(noches, r)})`);
  const resto = sinHoras.length > 3 ? ` y ${sinHoras.length - 3} más` : '';
  return [bNota(`${sinHoras.length === 1 ? 'Una noche no tiene' : `${sinHoras.length} noches no tienen`} las dos horas y no cuenta${sinHoras.length === 1 ? '' : 'n'} ${para}: ${nombradas.join(', ')}${resto}. Lo demás que apuntaste esas noches sí cuenta.`)];
}

/* ── ¿Cuánto se puede decir con estas noches? (v3.161.3) ──────────────────────
   UNA regla, la de `CALIDAD_ANALISIS_SUENO` (sueno.js), que usan el análisis de las últimas noches y la
   pregunta «¿por qué no puedes darme una media fiable?»: así las dos dicen lo mismo de las mismas noches.
   Una noche sin horas no cuenta para la duración, pero sí para saber si las noches son recientes o están
   separadas (es un día que él apuntó). */
function evaluarNoches(registros, hoy) {
  const Q = CALIDAD_ANALISIS_SUENO;
  const ordenadas = [...registros].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const completas = ordenadas.filter(tieneDuracion);
  const primera = ordenadas[0] || null;
  const ultima = ordenadas[ordenadas.length - 1] || null;
  const haceDias = ultima ? diasDelRango(ultima.fecha, hoy) - 1 : null;
  const abarca = primera ? diasDelRango(primera.fecha, ultima.fecha) : 0;
  const huecos = abarca - ordenadas.length;
  const motivos = [];
  const c = completas.length;
  if (c < Q.minimoParaMedia) motivos.push({ id: 'sin_media', texto: c === 0 ? 'Ninguna de esas noches tiene las dos horas, así que no hay ninguna duración que promediar.' : 'Solo una de esas noches tiene las dos horas: con una sola duración no hay media.' });
  else if (c < Q.minimoFiable) motivos.push({ id: 'pocas', texto: `Solo ${c} noches tienen las dos horas: con menos de ${Q.minimoFiable}, una noche rara cambia mucho la media.` });
  if (ordenadas.length > c) motivos.push({ id: 'incompletas', texto: `${plural(ordenadas.length - c, 'noche no tiene', 'noches no tienen')} las dos horas y no ${ordenadas.length - c === 1 ? 'entra' : 'entran'} en la duración.` });
  if (haceDias !== null && haceDias > Q.diasReciente) motivos.push({ id: 'antiguas', texto: `La última terminó hace ${haceDias} días: esto describe cómo dormías entonces, no ahora. Para ver cómo duermes ahora hacen falta noches más recientes.` });
  if (ordenadas.length >= Q.minimoParaMedia && abarca > Q.diasSeparadas) motivos.push({ id: 'separadas', texto: `Estas ${ordenadas.length} noches abarcan ${abarca} días: están muy separadas y no son una semana normal seguida.` });
  else if (huecos > 0) motivos.push({ id: 'huecos', texto: `Entre la primera y la última hay ${plural(huecos, 'día', 'días')} sin registro (un día sin apuntar no es una noche de 0 horas).` });
  const fiable = c >= Q.minimoFiable && haceDias !== null && haceDias <= Q.diasReciente && abarca <= Q.diasSeparadas;
  return { ordenadas, completas, sinHoras: ordenadas.filter((r) => !tieneDuracion(r)), primera, ultima, haceDias, abarca, huecos, motivos, fiable };
}

/** Las últimas noches REGISTRADAS por fecha (no por cuándo se guardaron), con o sin horas. */
function ventanaDeUltimas(noches, periodo, origenPeriodo) {
  const acotado = origenPeriodo === 'mensaje' && periodo && periodo.desde && periodo.hasta;
  const fechas = [...noches.mapa.keys()].filter((f) => !acotado || (f >= periodo.desde && f <= periodo.hasta)).sort();
  return { acotado, registros: fechas.slice(-CALIDAD_ANALISIS_SUENO.noches).map((f) => noches.mapa.get(f)) };
}

const periodoDeNoches = (ev) => (ev.primera ? { desde: ev.primera.fecha, hasta: ev.ultima.fecha, tipo: ev.primera.fecha === ev.ultima.fecha ? 'dia' : 'rango' } : null);

/** «Del 15 al 21 de octubre», o «En esas mismas noches (del 15 al 21…)» si sigue la conversación. */
function dondeSeMira(periodo, origenPeriodo, hoy) {
  const etiqueta = periodo.etiqueta || etiquetaDeRango(periodo.desde, periodo.hasta, hoy);
  return origenPeriodo === 'contexto' ? `en esos mismos días (${etiqueta})` : etiqueta;
}

/* ══════════════════════════════════════════════════════════════════════════
   Las capacidades (§8.1)
   ══════════════════════════════════════════════════════════════════════════ */

function noche(datos, { periodo, hoy }) {
  const noches = nochesDeSueno(datos.sueno, hoy);
  const fecha = periodo.desde;
  const r = noches.mapa.get(fecha);
  const cuando = etiquetaDeDia(fecha, hoy);
  if (!r) {
    const antes = anteriorA(noches, fecha);
    return {
      sinDatos: true,
      bloques: [
        bTexto(`No tienes registrada la noche que terminó ${cuando}.`),
        ...(antes ? [bNota(`La última registrada antes es la que terminó ${etiquetaDeDia(antes.fecha, hoy)}: ${textoDuracion(antes) || 'sin las dos horas'}.`)] : [bNota('Todavía no tienes ninguna noche registrada antes de esa fecha.')]),
      ],
      fuente: 'Sueño · tus registros',
    };
  }
  /* v3.161.3 — sin las dos horas no se sabe cuánto durmió: ni 0 ni 8 h. Lo demás que apuntó se enseña. */
  const conHoras = tieneDuracion(r);
  const bloques = [
    bTexto(conHoras
      ? `La noche que terminó ${cuando} dormiste ${textoDuracion(r)}.`
      : `La noche que terminó ${cuando} está registrada, pero ${queLeFalta(noches, r)}, así que no sé cuánto dormiste.`),
    bCifra('Horario', `${horaODesconocida(r.horaDormir)} → ${horaODesconocida(r.horaDespertar)}`, 'dato'),
    bCifra('Duración', conHoras ? textoDuracion(r) : 'no se puede calcular', 'calculo', conHoras ? 'de las dos horas' : 'hacen falta las dos horas'),
    bCifra('Cómo dormiste', caraTexto(r), 'dato'),
  ];
  /* v3.161.2 — 0 elegido = «ninguna vez»; sin contestar = se dice, nunca se cuenta como 0. */
  if (r.interrupciones > 0) bloques.push(bCifra('Te despertaste', `${etiquetaInterrupciones(r.interrupciones)} ${r.interrupciones === 1 ? 'vez' : 'veces'}`, 'dato'));
  else if (r.interrupciones === 0) bloques.push(bCifra('Te despertaste', 'ninguna vez', 'dato'));
  else bloques.push(bCifra('Te despertaste', 'sin contestar', 'dato', 'esa noche no contestaste «¿te has despertado durante la noche?»'));
  /* v3.161.3 — la siesta es sí, no o sin contestar (null): sin contestar no es «no». */
  if (r.siestaAyer === true) bloques.push(bCifra('Siesta el día antes', r.siestaMinutos > 0 ? `sí, ${r.siestaMinutos} min` : 'sí (sin minutos)', 'dato'));
  else if (r.siestaAyer === false) bloques.push(bCifra('Siesta el día antes', 'no', 'dato'));
  else bloques.push(bCifra('Siesta el día antes', 'sin contestar', 'dato'));
  if (noches.repetidas.has(fecha)) bloques.push(bNota('Esa noche tiene dos registros con la misma fecha; uso el último que guardaste, como la gráfica.'));
  return { bloques, fuente: 'Sueño · el registro de esa noche' };
}

function sinNochesEn(noches, periodo, hoy) {
  const ultima = anteriorA(noches, addDays(periodo.hasta, 1)) || anteriorA(noches, addDays(hoy, 1));
  return {
    sinDatos: true,
    bloques: [
      bTexto(`No tienes noches registradas ${periodo.etiqueta || etiquetaDeRango(periodo.desde, periodo.hasta, hoy)}.`),
      bNota(ultima ? `La última que tienes es la que terminó ${etiquetaDeDia(ultima.fecha, hoy)}.` : 'Todavía no tienes ninguna noche registrada.'),
    ],
    fuente: 'Sueño · tus registros',
  };
}

const etiquetaP = (periodo, hoy) => periodo.etiqueta || etiquetaDeRango(periodo.desde, periodo.hasta, hoy);

function resumenCaras(registros) {
  const cuenta = CALIDADES.map((c) => ({ c, n: registros.filter((r) => calidadDe(r.calidad)?.id === c.id).length })).filter((x) => x.n);
  const sin = registros.filter((r) => !calidadDe(r.calidad)).length;
  const partes = cuenta.map((x) => `${x.c.emoji} ${x.c.nombre} ×${x.n}`);
  if (sin) partes.push(`sin contestar ×${sin}`);
  return partes.join(' · ');
}

/* Las noches registradas sin las dos horas: se dicen y no entran en ninguna duración. */
function sinNingunaDuracion(noches, registros, etiqueta, hoy) {
  return {
    confianza: 'pocos_datos',
    bloques: [
      bTexto(`${mayuscula(etiqueta)} tienes ${plural(registros.length, 'noche registrada', 'noches registradas')}, pero ninguna tiene las dos horas, así que no puedo decirte cuánto dormiste.`),
      ...notaSinHoras(noches, registros, hoy),
    ],
    fuente: fuente(registros.length, etiqueta),
  };
}

function media(datos, { periodo, origenPeriodo, hoy }) {
  const noches = nochesDeSueno(datos.sueno, hoy);
  if (periodo.tipo === 'dia') return noche(datos, { periodo, hoy });
  const p = delPeriodo(noches, periodo);
  if (!p.registros.length) return sinNochesEn(noches, periodo, hoy);
  const etiqueta = etiquetaP(periodo, hoy);
  const donde = dondeSeMira(periodo, origenPeriodo, hoy);
  const con = p.registros.filter(tieneDuracion);
  const sinHoras = p.registros.filter((r) => !tieneDuracion(r));
  if (!con.length) return sinNingunaDuracion(noches, p.registros, donde, hoy);
  if (con.length === 1) {
    const r = con[0];
    return {
      confianza: 'pocos_datos',
      bloques: [
        bTexto(`${mayuscula(donde)} solo una noche tiene las dos horas: la que terminó ${etiquetaDeDia(r.fecha, hoy)}, con ${textoDuracion(r)}.`),
        bNota('Con una sola duración no hay media que calcular.'),
        ...notaSinHoras(noches, sinHoras, hoy),
        ...notasDeCalidadDeDatos(noches, p),
      ],
      fuente: fuente(p.registros.length, etiqueta),
    };
  }
  const m = mediaDeMinutos(con);
  const bloques = [
    bTexto(`${mayuscula(donde)} has dormido de media ${minutosTexto(m)} por noche.`),
    bCifra('Media', minutosTexto(m), 'calculo', `de ${plural(con.length, 'noche', 'noches')} con las dos horas`),
    bCifra('Noches registradas', `${p.registros.length} de ${p.dias.length}`, 'dato'),
  ];
  const caras = resumenCaras(p.registros);
  if (caras) bloques.push(bCifra('Cómo dormiste', caras, 'dato'));
  bloques.push(...notaSinHoras(noches, sinHoras, hoy, 'en la media'));
  if (p.huecos) bloques.push(bNota(`${plural(p.huecos, 'día no tiene', 'días no tienen')} registro y no cuenta${p.huecos === 1 ? '' : 'n'} en la media: un día sin apuntar no es una noche de 0 horas.`));
  if (periodo.recortado) bloques.push(bNota('Cuento hasta hoy: lo que queda del periodo todavía no ha pasado.'));
  if (con.length < CALIDAD_ANALISIS_SUENO.minimoFiable) bloques.push(bNota(`Con solo ${con.length} noches con las dos horas, esta media dice poco.`));
  bloques.push(...notasDeCalidadDeDatos(noches, p));
  return { bloques, fuente: fuente(p.registros.length, etiqueta), confianza: con.length < CALIDAD_ANALISIS_SUENO.minimoFiable ? 'pocos_datos' : 'normal' };
}

function calidad(datos, { periodo, origenPeriodo, hoy }) {
  const noches = nochesDeSueno(datos.sueno, hoy);
  if (periodo.tipo === 'dia') {
    const r = noches.mapa.get(periodo.desde);
    if (!r) return noche(datos, { periodo, hoy });
    return { bloques: [bTexto(`La noche que terminó ${etiquetaDeDia(r.fecha, hoy)} dijiste: ${caraTexto(r)}.`)], fuente: 'Sueño · el registro de esa noche' };
  }
  const p = delPeriodo(noches, periodo);
  if (!p.registros.length) return sinNochesEn(noches, periodo, hoy);
  const etiqueta = etiquetaP(periodo, hoy);
  const items = CALIDADES.map((c) => `${c.emoji} ${c.nombre}: ${plural(p.registros.filter((r) => calidadDe(r.calidad)?.id === c.id).length, 'noche', 'noches')}`);
  const sin = p.registros.filter((r) => !calidadDe(r.calidad)).length;
  if (sin) items.push(`Sin contestar: ${plural(sin, 'noche', 'noches')}`);
  return {
    bloques: [bTexto(`Así dijiste que dormiste ${dondeSeMira(periodo, origenPeriodo, hoy)}:`), bLista(items), ...notasDeCalidadDeDatos(noches, p)],
    fuente: fuente(p.registros.length, etiqueta),
    confianza: p.registros.length < 3 ? 'pocos_datos' : 'normal',
  };
}

/* «¿Cuál fue mi mejor noche?»: «mejor» puede ser la que dijo que durmió mejor o la más larga, así que se
   dicen las dos (v3.161.3), cada una con su criterio, en vez de elegir por él. «¿Y la peor?» igual. */
const quiere = (tokens, palabra) => (tokens || []).includes(palabra);
const reciente = (a, b) => (a.fecha < b.fecha ? 1 : -1);

function extremos(datos, { periodo, origenPeriodo, tokens, hoy }) {
  const noches = nochesDeSueno(datos.sueno, hoy);
  const p = delPeriodo(noches, periodo);
  if (!p.registros.length) return sinNochesEn(noches, periodo, hoy);
  const etiqueta = etiquetaP(periodo, hoy);
  const donde = dondeSeMira(periodo, origenPeriodo, hoy);
  const mejor = quiere(tokens, 'mejor');
  const peor = quiere(tokens, 'peor');
  const larga = !peor || mejor;
  const corta = !mejor || peor;
  const con = p.registros.filter(tieneDuracion);
  const sinHoras = p.registros.filter((r) => !tieneDuracion(r));
  const caras = p.registros.filter((r) => Number.isInteger(r.calidad) && calidadDe(r.calidad));
  const bloques = [];
  if (mejor || peor) {
    if (caras.length) {
      if (mejor) {
        const m = [...caras].sort((a, b) => b.calidad - a.calidad || reciente(a, b))[0];
        bloques.push(bCifra('La que dijiste que dormiste mejor', `terminó ${etiquetaDeDia(m.fecha, hoy)}: ${caraTexto(m)}`, 'dato'));
      }
      if (peor) {
        const m = [...caras].sort((a, b) => a.calidad - b.calidad || reciente(a, b))[0];
        bloques.push(bCifra('La que dijiste que dormiste peor', `terminó ${etiquetaDeDia(m.fecha, hoy)}: ${caraTexto(m)}`, 'dato'));
      }
    } else bloques.push(bNota(`${mayuscula(donde)} no contestaste «¿cómo has dormido?» en ninguna noche, así que por cómo dormiste no puedo elegir.`));
  }
  if (con.length === 1) {
    bloques.push(bNota(`Solo una noche tiene las dos horas (la que terminó ${etiquetaDeDia(con[0].fecha, hoy)}, ${textoDuracion(con[0])}), así que no hay una más larga ni una más corta.`));
  } else if (con.length > 1) {
    const porDuracion = [...con].sort((a, b) => minutosDeLaNoche(b) - minutosDeLaNoche(a) || reciente(a, b));
    const laCorta = [...con].sort((a, b) => minutosDeLaNoche(a) - minutosDeLaNoche(b) || reciente(a, b))[0];
    if (larga) bloques.push(bCifra('La más larga', `${textoDuracion(porDuracion[0])} (terminó ${etiquetaDeDia(porDuracion[0].fecha, hoy)})`, 'calculo'));
    if (corta) bloques.push(bCifra('La más corta', `${textoDuracion(laCorta)} (terminó ${etiquetaDeDia(laCorta.fecha, hoy)})`, 'calculo'));
  } else bloques.push(bNota(`${mayuscula(donde)} ninguna noche tiene las dos horas, así que no hay una más larga ni una más corta.`));
  const pocos = con.length < 2 && !caras.length;
  return {
    confianza: pocos ? 'pocos_datos' : null,
    bloques: [bTexto(`${mayuscula(donde)}:`), ...bloques, ...notaSinHoras(noches, sinHoras, hoy, 'para la más larga y la más corta'), ...notasDeCalidadDeDatos(noches, p)],
    fuente: fuente(p.registros.length, etiqueta),
  };
}

/* Para ORDENAR acostarse (no para promediar): las 01:30 van después de las 23:30. */
const minutosDeNoche = (h) => {
  const [hh, mm] = String(h).split(':').map(Number);
  const m = hh * 60 + mm;
  return hh < 12 ? m + 1440 : m;
};
const minutosDeManana = (h) => {
  const [hh, mm] = String(h).split(':').map(Number);
  return hh * 60 + mm;
};

function horarios(datos, { periodo, hoy }) {
  const noches = nochesDeSueno(datos.sueno, hoy);
  if (periodo.tipo === 'dia') {
    const r = noches.mapa.get(periodo.desde);
    if (!r) return noche(datos, { periodo, hoy });
    const cuando = etiquetaDeDia(r.fecha, hoy);
    const partes = [r.horaDormir ? `te acostaste a las ${r.horaDormir}` : 'no apuntaste a qué hora te acostaste', r.horaDespertar ? `te levantaste a las ${r.horaDespertar}` : 'no apuntaste a qué hora te levantaste'];
    return { bloques: [bTexto(`La noche que terminó ${cuando} ${partes.join(' y ')}.`)], fuente: 'Sueño · el registro de esa noche' };
  }
  const p = delPeriodo(noches, periodo);
  if (!p.registros.length) return sinNochesEn(noches, periodo, hoy);
  const etiqueta = etiquetaP(periodo, hoy);
  const bloques = [];
  if (p.registros.length <= 7) {
    bloques.push(bTexto(`Tus horarios ${etiqueta} (acostarte → levantarte):`));
    bloques.push(bLista(p.registros.map((r) => `${DIAS_CORTOS[diaDeLaSemana(r.fecha)]} ${diaYMesConversacion(r.fecha, hoy)}: ${horaODesconocida(r.horaDormir)} → ${horaODesconocida(r.horaDespertar)}`), 7));
  } else {
    /* Solo con las horas que apuntó: un hueco no es «la más temprana». */
    const porNoche = p.registros.filter((r) => r.horaDormir).sort((a, b) => minutosDeNoche(a.horaDormir) - minutosDeNoche(b.horaDormir));
    const porManana = p.registros.filter((r) => r.horaDespertar).sort((a, b) => minutosDeManana(a.horaDespertar) - minutosDeManana(b.horaDespertar));
    bloques.push(bTexto(`${mayuscula(etiqueta)} tienes ${p.registros.length} noches registradas.`));
    if (porNoche.length) {
      bloques.push(bCifra('Te acostaste más pronto', `${porNoche[0].horaDormir} (${diaYMesConversacion(porNoche[0].fecha, hoy)})`, 'dato'));
      bloques.push(bCifra('Te acostaste más tarde', `${porNoche[porNoche.length - 1].horaDormir} (${diaYMesConversacion(porNoche[porNoche.length - 1].fecha, hoy)})`, 'dato'));
    }
    if (porManana.length) {
      bloques.push(bCifra('Te levantaste más pronto', `${porManana[0].horaDespertar} (${diaYMesConversacion(porManana[0].fecha, hoy)})`, 'dato'));
      bloques.push(bCifra('Te levantaste más tarde', `${porManana[porManana.length - 1].horaDespertar} (${diaYMesConversacion(porManana[porManana.length - 1].fecha, hoy)})`, 'dato'));
    }
    const sinAlguna = p.registros.length - Math.min(porNoche.length, porManana.length);
    if (sinAlguna) bloques.push(bNota(`${plural(sinAlguna, 'noche no tiene', 'noches no tienen')} alguna de las dos horas apuntada y no entra${sinAlguna === 1 ? '' : 'n'} en esa hora.`));
    bloques.push(bNota('No te doy una hora media: con horas que pasan de medianoche sería una cifra inventada.'));
  }
  bloques.push(...notasDeCalidadDeDatos(noches, p));
  return { bloques, fuente: fuente(p.registros.length, etiqueta) };
}

function despertares(datos, { periodo, hoy }) {
  const noches = nochesDeSueno(datos.sueno, hoy);
  const p = delPeriodo(noches, periodo);
  if (!p.registros.length) return periodo.tipo === 'dia' ? noche(datos, { periodo, hoy }) : sinNochesEn(noches, periodo, hoy);
  const etiqueta = etiquetaP(periodo, hoy);
  /* 🐛 v3.161.2 — solo cuentan las noches en las que CONTESTÓ la pregunta: una sin contestar no
     es una noche sin despertares (antes se guardaba con 0 y salía en el denominador). */
  const contestadas = p.registros.filter((r) => Number.isInteger(r.interrupciones));
  const sinContestar = p.registros.length - contestadas.length;
  const conInterrupciones = contestadas.filter((r) => r.interrupciones > 0);
  const bloques = contestadas.length
    ? [bCifra('Noches en las que te despertaste', `${conInterrupciones.length} de ${contestadas.length}`, 'dato', contestadas.length === p.registros.length ? null : 'de las noches en las que lo contestaste')]
    : [bTexto(`${mayuscula(etiqueta)} no contestaste en ninguna noche si te despertaste, así que no puedo decirte cuántas veces fue.`)];
  if (conInterrupciones.length) {
    bloques.push(bLista(conInterrupciones.map((r) => `${DIAS_CORTOS[diaDeLaSemana(r.fecha)]} ${diaYMesConversacion(r.fecha, hoy)}: ${etiquetaInterrupciones(r.interrupciones)} ${r.interrupciones === 1 ? 'vez' : 'veces'}`)));
  }
  if (contestadas.length && sinContestar) {
    bloques.push(bNota(`${plural(sinContestar, 'noche no tiene', 'noches no tienen')} contestado si te despertaste y no cuenta${sinContestar === 1 ? '' : 'n'}: sin respuesta no es lo mismo que cero.`));
  }
  /* 🐛 v3.161.3 — la siesta: solo cuentan los días que contestó (sí o no). Antes una sin contestar
     contaba como «no» en el «X de N». */
  const siestaContestada = p.registros.filter((r) => typeof r.siestaAyer === 'boolean');
  const siestaSin = p.registros.length - siestaContestada.length;
  if (siestaContestada.length) {
    bloques.push(bCifra('Días con siesta', `${siestaContestada.filter((r) => r.siestaAyer).length} de ${siestaContestada.length}`, 'dato', siestaSin ? 'de los días en los que contestaste «¿has dormido siesta ayer?»' : 'lo que contestaste a «¿has dormido siesta ayer?»'));
    if (siestaSin) bloques.push(bNota(`${plural(siestaSin, 'noche no tiene', 'noches no tienen')} contestado lo de la siesta y no cuenta${siestaSin === 1 ? '' : 'n'}: sin respuesta no es un «no».`));
  } else bloques.push(bNota('No contestaste lo de la siesta en ninguna de esas noches, así que no sé si dormiste alguna.'));
  bloques.push(...notasDeCalidadDeDatos(noches, p));
  return { bloques, fuente: fuente(p.registros.length, etiqueta) };
}

function comparar(datos, { periodo, segundoPeriodo, origenPeriodo, periodoAnterior, hoy }) {
  const noches = nochesDeSueno(datos.sueno, hoy);
  const lunes = lunesDeFecha(hoy);
  const estaSemana = { desde: lunes, hasta: hoy, tipo: 'rango', etiqueta: 'esta semana' };
  const semanaPasada = { desde: addDays(lunes, -7), hasta: addDays(lunes, -1), tipo: 'rango', etiqueta: 'la semana pasada' };
  let a;
  let b;
  if (segundoPeriodo) { a = periodo; b = segundoPeriodo; }
  else if (origenPeriodo === 'mensaje' && periodo && periodo.hasta < lunes) { a = estaSemana; b = periodo; }
  else if (origenPeriodo === 'mensaje' && periodo) {
    const n = diasDelRango(periodo.desde, periodo.hasta);
    a = periodo;
    b = { desde: addDays(periodo.desde, -n), hasta: addDays(periodo.desde, -1), tipo: n > 1 ? 'rango' : 'dia' };
  } else if (origenPeriodo === 'contexto' && periodo) {
    /* v3.161.3 — «compáralo con lo de antes»: lo último que se miró contra lo que se miró antes; sin un
       «antes», contra los mismos días justo anteriores. Se dicen los dos periodos con su fecha. */
    a = periodo;
    if (periodoAnterior && (periodoAnterior.desde !== periodo.desde || periodoAnterior.hasta !== periodo.hasta)) b = periodoAnterior;
    else {
      const n = diasDelRango(periodo.desde, periodo.hasta);
      b = { desde: addDays(periodo.desde, -n), hasta: addDays(periodo.desde, -1), tipo: n > 1 ? 'rango' : 'dia' };
    }
  } else { a = estaSemana; b = semanaPasada; }
  const ea = a.etiqueta || etiquetaDeRango(a.desde, a.hasta, hoy);
  const eb = b.etiqueta || etiquetaDeRango(b.desde, b.hasta, hoy);
  const pa = delPeriodo(noches, a);
  const pb = delPeriodo(noches, b);
  if (!pa.registros.length || !pb.registros.length) {
    const falta = !pa.registros.length ? ea : eb;
    return { sinDatos: true, bloques: [bTexto(`No puedo comparar: ${falta} no tiene ninguna noche registrada.`)], fuente: 'Sueño · tus registros' };
  }
  const ca = pa.registros.filter(tieneDuracion);
  const cb = pb.registros.filter(tieneDuracion);
  if (!ca.length || !cb.length) {
    const falta = !ca.length ? ea : eb;
    return { sinDatos: true, bloques: [bTexto(`No puedo comparar: ${falta} no tiene ninguna noche con las dos horas, así que no sé cuánto dormiste.`)], fuente: 'Sueño · tus registros' };
  }
  const solapan = a.desde <= b.hasta && b.desde <= a.hasta;
  const ma = mediaDeMinutos(ca);
  const mb = mediaDeMinutos(cb);
  const dif = ma - mb;
  const frase = dif === 0
    ? `${mayuscula(ea)} has dormido de media lo mismo que ${eb}: ${minutosTexto(ma)}.`
    : `${mayuscula(ea)} has dormido de media ${textoMinutos(Math.abs(dif))} ${dif > 0 ? 'más' : 'menos'} que ${eb}.`;
  const pocos = ca.length < 2 || cb.length < 2;
  const sinHoras = pa.registros.length - ca.length + pb.registros.length - cb.length;
  /* v3.161.3 — lo que se ha comparado son LOS DOS periodos: la siguiente pregunta («¿qué noches no tienen
     datos completos?») mira los dos, no solo el que vino en el mensaje. */
  const periodoUsado = { desde: a.desde < b.desde ? a.desde : b.desde, hasta: a.hasta > b.hasta ? a.hasta : b.hasta, tipo: 'rango' };
  return {
    confianza: pocos ? 'pocos_datos' : 'normal',
    periodoUsado,
    bloques: [
      bTexto(frase),
      bCifra(mayuscula(ea), minutosTexto(ma), 'calculo', `media de ${plural(ca.length, 'noche', 'noches')} con las dos horas`),
      bCifra(mayuscula(eb), minutosTexto(mb), 'calculo', `media de ${plural(cb.length, 'noche', 'noches')} con las dos horas`),
      bNota('Es solo la diferencia entre las dos medias: no dice a qué se debe.'),
      ...(solapan ? [bNota('Los dos periodos comparten días, así que la diferencia dice todavía menos.')] : []),
      ...(sinHoras ? [bNota(`${plural(sinHoras, 'noche no tiene', 'noches no tienen')} las dos horas y no entra${sinHoras === 1 ? '' : 'n'} en las medias.`)] : []),
      ...(pocos ? [bNota('Con tan pocas noches en uno de los dos, la diferencia dice poco.')] : []),
    ],
    fuente: `Sueño · ${pa.registros.length + pb.registros.length} noches registradas`,
  };
}

function registro(datos, { periodo, hoy }) {
  const noches = nochesDeSueno(datos.sueno, hoy);
  const p = delPeriodo(noches, periodo);
  const etiqueta = etiquetaP(periodo, hoy);
  const todas = [...noches.mapa.keys()].sort();
  if (!todas.length) {
    return { sinDatos: true, bloques: [bTexto('Todavía no tienes ninguna noche registrada.')], fuente: 'Sueño · tus registros' };
  }
  const primera = primeraFechaConRegistro([...noches.mapa.values()]);
  const bloques = [
    bCifra(`Noches registradas ${etiqueta}`, `${p.registros.length} de ${p.dias.length}`, 'dato'),
    bCifra('La última registrada', `terminó ${etiquetaDeDia(todas[todas.length - 1], hoy)}`, 'dato'),
    bCifra('La primera', `terminó ${etiquetaDeDia(primera, hoy)}`, 'dato'),
  ];
  const sinHoras = p.registros.filter((r) => !tieneDuracion(r)).length;
  if (sinHoras) bloques.push(bNota(`${plural(sinHoras, 'noche está registrada', 'noches están registradas')} sin las dos horas: cuentan como registradas, pero no tienen duración.`));
  const sinRegistro = p.dias.filter((f) => !noches.mapa.has(f) && f >= primera);
  if (sinRegistro.length) bloques.push(bNota(`Días sin registrar desde tu primera noche: ${sinRegistro.slice(-5).map((f) => diaYMesConversacion(f, hoy)).join(', ')}${sinRegistro.length > 5 ? ` y ${sinRegistro.length - 5} más` : ''}.`));
  if (noches.sinFecha) bloques.push(bNota(`${plural(noches.sinFecha, 'registro no tiene', 'registros no tienen')} una fecha válida y no ${noches.sinFecha === 1 ? 'lo cuento' : 'los cuento'}.`));
  bloques.push(...notasDeCalidadDeDatos(noches, p));
  return { bloques, fuente: fuente(p.registros.length, etiqueta) };
}

/* v3.161.2 y v3.161.3 — «Tus últimas noches registradas»: lo que contesta el botón «Analizar mi sueño», con
   tus datos y sin IA. Lee las últimas `CALIDAD_ANALISIS_SUENO.noches` noches REGISTRADAS por su fecha (no los
   últimos días del calendario ni las últimas guardadas), tengan o no las dos horas: la duración sale solo de
   las que las tienen, y lo demás (cómo dormiste, despertares, siesta) de todas las que lo contestaron. Nunca
   rellena un día sin registro, no saca tendencias ni causas, y dice qué le falta (`evaluarNoches`). Devuelve
   `periodoUsado` con esas fechas: la siguiente pregunta («¿y de media?», «¿y la peor?») mira las mismas
   noches y no puede contradecirla. Si el mensaje trae un periodo, solo mira ese. */
function ultimas(datos, { periodo, origenPeriodo, hoy }) {
  const noches = nochesDeSueno(datos.sueno, hoy);
  const { acotado, registros } = ventanaDeUltimas(noches, periodo, origenPeriodo);
  const donde = acotado ? ` ${etiquetaP(periodo, hoy)}` : '';
  if (!registros.length) {
    return { sinDatos: true, bloques: [bTexto(`Todavía no tienes ninguna noche registrada${donde} que pueda analizar.`), bNota('Cuando apuntes tus noches en Sueño, aquí te resumo las últimas.')], fuente: 'Sueño · tus registros' };
  }
  const ev = evaluarNoches(registros, hoy);
  const { primera, ultima, completas, sinHoras } = ev;
  const n = registros.length;
  const periodoUsado = periodoDeNoches(ev);
  const limites = ev.motivos.filter((m) => ['antiguas', 'separadas', 'huecos'].includes(m.id)).map((m) => bNota(m.texto));
  const repetidas = registros.map((r) => r.fecha).filter((f) => noches.repetidas.has(f));
  if (n === 1) {
    return {
      confianza: 'pocos_datos',
      periodoUsado,
      bloques: [
        bTexto(tieneDuracion(ultima)
          ? `Solo tengo una noche registrada${donde} para analizar: la que terminó ${etiquetaDeDia(ultima.fecha, hoy)}, con ${textoDuracion(ultima)}.`
          : `Solo tengo una noche registrada${donde} para analizar: la que terminó ${etiquetaDeDia(ultima.fecha, hoy)}, y ${queLeFalta(noches, ultima)}, así que no sé cuánto dormiste.`),
        bCifra('Cómo dormiste', caraTexto(ultima), 'dato'),
        bNota('Con una sola noche no hay media ni se puede ver cómo cambia: hacen falta más noches registradas.'),
        ...limites,
        ...notasDeCalidadDeDatos(noches, { repetidas }),
      ],
      fuente: 'Sueño · tu última noche registrada',
    };
  }
  const c = completas.length;
  const bloques = [bTexto(`Tus últimas ${n} noches registradas${donde} van de la que terminó ${etiquetaDeDia(primera.fecha, hoy)} a la que terminó ${etiquetaDeDia(ultima.fecha, hoy)}.`)];
  if (c >= CALIDAD_ANALISIS_SUENO.minimoParaMedia) {
    const corta = [...completas].sort((a, b) => minutosDeLaNoche(a) - minutosDeLaNoche(b) || reciente(a, b))[0];
    const larga = [...completas].sort((a, b) => minutosDeLaNoche(b) - minutosDeLaNoche(a) || reciente(a, b))[0];
    bloques.push(bCifra('Media', minutosTexto(mediaDeMinutos(completas)), 'calculo', c === n ? `de esas ${n} noches` : `de las ${c} con las dos horas`));
    if (minutosDeLaNoche(corta) === minutosDeLaNoche(larga)) bloques.push(bCifra(c === 2 ? 'Las dos duraron' : 'Todas duraron', textoDuracion(larga), 'calculo'));
    else {
      bloques.push(bCifra('La más larga', `${textoDuracion(larga)} (terminó ${etiquetaDeDia(larga.fecha, hoy)})`, 'calculo'));
      bloques.push(bCifra('La más corta', `${textoDuracion(corta)} (terminó ${etiquetaDeDia(corta.fecha, hoy)})`, 'calculo'));
    }
  } else if (c === 1) {
    bloques.push(bCifra('Duración', `${textoDuracion(completas[0])} (terminó ${etiquetaDeDia(completas[0].fecha, hoy)})`, 'calculo', 'la única con las dos horas'));
    bloques.push(bNota('Solo una de esas noches tiene las dos horas: con una sola duración no hay media.'));
  } else bloques.push(bNota('Ninguna de esas noches tiene las dos horas, así que no puedo decirte cuánto dormiste.'));
  const caras = resumenCaras(registros);
  if (caras) bloques.push(bCifra('Cómo dormiste', caras, 'dato'));
  const contestadas = registros.filter((r) => Number.isInteger(r.interrupciones));
  const sinContestar = n - contestadas.length;
  if (contestadas.length) {
    bloques.push(bCifra('Noches en las que te despertaste', `${contestadas.filter((r) => r.interrupciones > 0).length} de ${contestadas.length}`, 'dato', sinContestar ? 'de las noches en las que lo contestaste' : null));
  }
  if (sinContestar) bloques.push(bNota(`${plural(sinContestar, 'noche no tiene', 'noches no tienen')} contestado si te despertaste: sin respuesta no es lo mismo que cero, así que no ${sinContestar === 1 ? 'cuenta' : 'cuentan'}.`));
  bloques.push(...notaSinHoras(noches, sinHoras, hoy));
  if (c >= CALIDAD_ANALISIS_SUENO.minimoParaMedia && c < CALIDAD_ANALISIS_SUENO.minimoFiable) bloques.push(bNota(`Con solo ${c} noches con las dos horas, esta media dice poco.`));
  bloques.push(...limites);
  bloques.push(bNota('Es un resumen de lo que registraste: no saca tendencias ni dice a qué se debe.'));
  bloques.push(...notasDeCalidadDeDatos(noches, { repetidas }));
  return { bloques, periodoUsado, confianza: ev.fiable ? 'normal' : 'pocos_datos', fuente: `Sueño · tus últimas ${n} noches registradas${donde}` };
}

/* v3.161.3 — «¿Qué noches no tienen datos completos?»: las que no tienen las dos horas (y cuál falta o no es
   válida) y cuántas preguntas se quedaron sin contestar. Siguen registradas y lo demás cuenta. */
function incompletas(datos, { periodo, hoy }) {
  const noches = nochesDeSueno(datos.sueno, hoy);
  const p = delPeriodo(noches, periodo);
  const etiqueta = etiquetaP(periodo, hoy);
  if (!p.registros.length) return sinNochesEn(noches, periodo, hoy);
  const sinHoras = p.registros.filter((r) => !tieneDuracion(r));
  const sinCara = p.registros.filter((r) => !calidadDe(r.calidad)).length;
  const sinDespertares = p.registros.filter((r) => !Number.isInteger(r.interrupciones)).length;
  const sinSiesta = p.registros.filter((r) => typeof r.siestaAyer !== 'boolean').length;
  const bloques = [];
  if (sinHoras.length) {
    bloques.push(bTexto(`${mayuscula(etiqueta)}, ${sinHoras.length === 1 ? 'una noche no tiene' : `${sinHoras.length} noches no tienen`} las dos horas, así que no sé cuánto duraron:`));
    bloques.push(bLista(sinHoras.slice().reverse().map((r) => `${DIAS_CORTOS[diaDeLaSemana(r.fecha)]} ${diaYMesConversacion(r.fecha, hoy)}: ${queLeFalta(noches, r)}`), 7));
  } else bloques.push(bTexto(p.registros.length === 1
    ? `${mayuscula(etiqueta)}, la única noche registrada tiene las dos horas.`
    : `${mayuscula(etiqueta)}, las ${p.registros.length} noches registradas tienen las dos horas.`));
  const sin = [];
  if (sinCara) sin.push(`«¿cómo has dormido?» en ${plural(sinCara, 'noche', 'noches')}`);
  if (sinDespertares) sin.push(`«¿te has despertado?» en ${plural(sinDespertares, 'noche', 'noches')}`);
  if (sinSiesta) sin.push(`lo de la siesta en ${plural(sinSiesta, 'noche', 'noches')}`);
  if (sin.length) bloques.push(bNota(`Sin contestar: ${sin.join(', ')}. Sin respuesta no cuenta como «no» ni como cero.`));
  bloques.push(bCifra('Noches registradas', `${p.registros.length} de ${p.dias.length}`, 'dato'));
  if (sinHoras.length) bloques.push(bNota('Esas noches siguen registradas y lo demás que apuntaste cuenta. Las horas se completan en la pantalla de Sueño.'));
  bloques.push(...notasDeCalidadDeDatos(noches, p));
  return { bloques, fuente: fuente(p.registros.length, etiqueta) };
}

/* v3.161.3 — «¿Por qué no puedes darme una media fiable?»: no pregunta la causa de algo de su vida, pregunta
   por qué el asistente no puede (`cubreCausa`). Contesta con la MISMA regla que el análisis (`evaluarNoches`)
   y sobre las mismas noches: las de la conversación si las hay; si no, las últimas registradas. */
function fiabilidad(datos, { periodo, origenPeriodo, hoy }) {
  const noches = nochesDeSueno(datos.sueno, hoy);
  const Q = CALIDAD_ANALISIS_SUENO;
  const dePeriodo = (origenPeriodo === 'mensaje' || origenPeriodo === 'contexto') && periodo && periodo.desde && periodo.hasta;
  const registros = dePeriodo ? delPeriodo(noches, periodo).registros : ventanaDeUltimas(noches, null, null).registros;
  if (!registros.length) {
    return { sinDatos: true, bloques: [bTexto(dePeriodo ? `No tienes noches registradas ${etiquetaP(periodo, hoy)}, así que no hay nada que promediar.` : 'Todavía no tienes ninguna noche registrada, así que no hay nada que promediar.')], fuente: 'Sueño · tus registros' };
  }
  const ev = evaluarNoches(registros, hoy);
  const cuales = dePeriodo ? `tus noches registradas ${etiquetaP(periodo, hoy)}` : `tus últimas ${plural(registros.length, 'noche registrada', 'noches registradas')} (${etiquetaDeRango(ev.primera.fecha, ev.ultima.fecha, hoy)})`;
  const bloques = ev.fiable
    ? [bTexto(`Con ${cuales} sí te doy una media fiable: ${ev.completas.length} noches tienen las dos horas, son recientes y no están muy separadas.`)]
    : [bTexto(`Con ${cuales} no te doy una media fiable por esto:`), bLista(ev.motivos.map((m) => m.texto), 6)];
  if (ev.fiable && ev.motivos.length) bloques.push(bNota(ev.motivos.map((m) => m.texto).join(' ')));
  bloques.push(bNota(`Lo que pido: al menos ${Q.minimoFiable} noches con las dos horas, la última de hace ${Q.diasReciente} días como mucho y que no abarquen más de ${Q.diasSeparadas} días. Fiable quiere decir que describe bien esas noches; no es una tendencia ni una predicción.`));
  /* Con las últimas noches, la conversación sigue sobre ellas; con un periodo, sobre ese mismo periodo. */
  return { bloques, periodoUsado: dePeriodo ? null : periodoDeNoches(ev), confianza: ev.fiable ? 'normal' : 'pocos_datos', fuente: `Sueño · ${plural(registros.length, 'noche registrada', 'noches registradas')}` };
}

/* ══════════════════════════════════════════════════════════════════════════
   El registro del asistente
   ══════════════════════════════════════════════════════════════════════════ */

export const ASISTENTE_SUENO = {
  id: 'sueno',
  modulo: 'sueno',
  nombre: 'Sueño',
  lee: ['sueno'],
  saludo: '¡Hola! Pregúntame por tus noches: cuánto dormiste, tu media, cómo dormiste o a qué hora te acostaste.',
  lexico: {
    dormir: ['dorm*', 'durm*', 'duerm*', 'dormi', 'dormido', 'dormir', 'sueno', 'sobar', 'sobado', 'sobe', 'sobo', 'sobando', 'planchar la oreja',
      'descanso', 'descansar', 'descanse', 'descansado', 'noche', 'noches', 'acoste', 'acuesto', 'cama'],
    horas: ['horas', 'hora', 'tiempo', 'duracion', 'minutos'],
    resumen: ['que tal', 'como he', 'como dormi', 'como voy', 'resumen', 'como va', 'como ha ido', 'como fue', 'como han ido'],
    calidad: ['calidad', 'cara', 'caras', 'fatal', 'maravilla', 'de maravilla', 'muy bien', 'descansado'],
    extremo: ['mas larga', 'mas corta', 'mas largo', 'mas corto', 'mas he dormido', 'menos he dormido', 'dormi mas', 'dormi menos', 'mejor noche', 'peor noche', 'noche mas', 'minimo', 'maximo', 'cuando dormi mas', 'cuando dormi menos',
      /* v3.161.3 — «¿y la peor?» después de «¿cuál fue mi mejor noche?»: la palabra sola, con su artículo. */
      'la mejor', 'la peor', 'el mejor dia', 'el peor dia', 'peor he dormido', 'mejor he dormido'],
    a_que_hora: ['a que hora', 'que hora', 'me desperte a', 'me levante a', '=hora de dormir', '=hora de acostarme', '=hora de levantarme', 'me acoste', 'me acuesto', 'me levante', 'me levanto', 'horario', 'horarios', 'acostarme', 'levantarme', 'me fui a la cama', 'me voy a la cama'],
    interrupcion: ['interrupciones', 'interrupcion', 'desvel*', 'por la noche me desperte', 'me desperte por la noche', 'me despierto por la noche', 'despertares', 'veces me desperte', 'veces me he despertado', 'me desperte durante'],
    desperte: ['me desperte', 'me he despertado', 'despertado', 'me despierto', 'despertarme'],
    siesta: ['siesta', 'siestas'],
    habitual: ['duermo', '=suelo dormir', 'normalmente', 'ultimamente', 'estos dias', 'por lo general'],
    ultimas: ['ultimas noches', 'mis ultimas noches', 'ultimas noches registradas', 'ultimos registros', 'analiza*', 'analisis', 'analizar mi sueno', 'analizame', 'ultimamente'],
    incompleto: ['incomplet*', 'datos completos', 'completas', 'sin completar', 'a medias', 'sin horas', 'sin hora', 'falta la hora', 'faltan horas', 'faltan datos', 'les falta', 'no tienen datos', 'sin contestar', 'no conteste'],
    fiable: ['fiable', 'fiables', 'fiabilidad', '=fiarme', '=fiar', 'de confianza', 'precisa', 'preciso', 'limitacion*', 'no puedes calcular', 'no puedes sacar', 'no puedes darme', 'pocos datos', 'suficientes datos', 'datos suficientes', 'te faltan datos'],
    registro: ['registr*', 'apuntad*', 'cuantas noches', 'sin registrar', 'huecos', 'dias sin', 'olvide apuntar', 'tengo apuntad*'],
  },
  capacidades: [
    { id: 'noche', titulo: 'Una noche concreta', ejemplo: '¿Cuánto dormí anoche?', senales: { dormir: 2, horas: 1, cuanto: 1, calidad: 1, resumen: 1 }, necesita: [['dormir', 'horas', 'calidad', 'resumen']], periodo: 'dia', siRango: 'media', porDefecto: 'hoy', prioridad: 3, ejecutar: noche },
    { id: 'media', titulo: 'La media de horas de un periodo', ejemplo: '¿Cuánto he dormido de media esta semana?', senales: { dormir: 2, media: 3, cuanto: 1, resumen: 2, horas: 1, habitual: 2 }, necesita: [['dormir', 'horas', 'media', 'resumen', 'habitual']], periodo: 'rango', porDefecto: 'ultimos7', prioridad: 2, ejecutar: media },
    { id: 'calidad', titulo: 'Cómo dijiste que dormiste', ejemplo: '¿Qué tal la calidad de mis noches este mes?', senales: { calidad: 4, dormir: 1, resumen: 1 }, necesita: [['calidad']], periodo: 'ambos', porDefecto: 'ultimos7', prioridad: 1, ejecutar: calidad },
    { id: 'extremos', titulo: 'La mejor y la peor noche', ejemplo: '¿Cuál fue mi noche más corta este mes?', senales: { extremo: 4, dormir: 1 }, necesita: [['extremo']], periodo: 'rango', porDefecto: 'ultimos7', prioridad: 1, ejecutar: extremos },
    { id: 'horarios', titulo: 'A qué hora te acuestas y te levantas', ejemplo: '¿A qué hora me he acostado esta semana?', senales: { a_que_hora: 6, dormir: 1, habitual: 1 }, necesita: [['a_que_hora']], periodo: 'ambos', porDefecto: 'ultimos7', prioridad: 1, ejecutar: horarios },
    { id: 'despertares', titulo: 'Si te despertaste por la noche y las siestas', ejemplo: '¿Cuántas veces me he despertado esta semana?', senales: { interrupcion: 4, siesta: 4, desperte: 2, dormir: 1, cuanto: 1 }, necesita: [['interrupcion', 'siesta', 'desperte']], periodo: 'ambos', porDefecto: 'ultimos7', prioridad: 1, ejecutar: despertares },
    { id: 'comparar', titulo: 'Comparar con otro periodo', ejemplo: '¿Duermo más que la semana pasada?', senales: { comparar: 5, dormir: 1, horas: 1, media: 1, habitual: 1 }, necesita: [['comparar']], periodo: 'ambos', dosPeriodos: true, porDefecto: 'estaSemana', prioridad: 1, ejecutar: comparar },
    { id: 'ultimas', titulo: 'Tus últimas noches registradas', ejemplo: '¿Cómo han ido mis últimas noches?', senales: { ultimas: 6, dormir: 1, resumen: 1 }, necesita: [['ultimas']], periodo: 'rango', prioridad: 2, ejecutar: ultimas },
    { id: 'incompletas', titulo: 'Qué noches no tienen datos completos', ejemplo: '¿Qué noches no tienen datos completos?', senales: { incompleto: 6, dormir: 1, registro: 1 }, necesita: [['incompleto']], periodo: 'rango', porDefecto: 'ultimos30', prioridad: 1, ejecutar: incompletas },
    { id: 'fiabilidad', titulo: 'Por qué una media es fiable o no', ejemplo: '¿Por qué no puedes darme una media fiable?', senales: { fiable: 7, media: 1, dormir: 1 }, necesita: [['fiable']], periodo: 'rango', cubreCausa: true, prioridad: 1, ejecutar: fiabilidad },
    { id: 'registro', titulo: 'Qué noches tienes registradas', ejemplo: '¿Cuántas noches tengo registradas este mes?', senales: { registro: 4, dormir: 1, cuanto: 1 }, necesita: [['registro']], periodo: 'rango', porDefecto: 'ultimos30', prioridad: 1, ejecutar: registro },
  ],
};
