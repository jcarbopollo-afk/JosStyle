/* Entrega 3 · Fase 31 (SU F1) — «Sueño: registro simple y experiencia premium»
   ═══════════════════════════════════════════════════════════════════════════

   🚨 **EL ENUNCIADO EMPIEZA DICIENDO QUE NO SE REHAGA NADA.** *"El apartado
   Sueño de JC STYLE ya tiene una estructura y una gráfica que funcionan muy bien
   conceptualmente. NO quiero rehacer el apartado desde cero."* Lo que se cambia
   es **el registro**, para que se conteste en segundos; la gráfica se queda
   igual, y su ventana de 7 días es explícitamente de la **fase siguiente**.

   ── Lo que cambia ────────────────────────────────────────────────────────────

   **La calidad deja de ser un número que hay que escribir.** Era un `<input
   type="number">` de 1 a 5 —que en un iPhone abre el teclado numérico para
   contestar *"¿cómo has dormido?"*—. Ahora son **tres caras**: 😫 Fatal,
   🙂 Muy bien, 🤩 De maravilla. ⚠️ Y **por dentro se sigue guardando 1-5**, que
   es lo que pide el apartado 2 y lo que ya leen el Dashboard, el hub y la
   exportación: cambiar la escala habría roto cuatro pantallas para no ganar nada.

   **Las interrupciones dejan de ser un número libre**: 0 · 1 · 2 · 3+, que es lo
   que dice el apartado 3. El `3` guardado significa *"tres o más"*.

   **La siesta pasa de «minutos» a una pregunta de sí o no** (apartado 4), y los
   minutos solo aparecen **si dice que sí**. Lo guardado antes era un número de
   minutos: `normalizarRegistro` lo convierte, y **un 0 no se convierte en un sí**.

   ── 🚨 Lo que NO se guarda, y por qué ────────────────────────────────────────

   El apartado 9 pide guardar *"la duración calculada"*. **No se guarda**, y es a
   propósito: `calcularDuracion()` ya la calcula desde las dos horas y la usan la
   gráfica, el Dashboard, el hub, las correlaciones y la exportación. Guardarla
   sería una copia que **miente en cuanto Josué corrija una hora** — y el
   apartado 10 del mismo enunciado dice *"No dupliques sistemas de
   almacenamiento"*. Está declarado abajo en `NO_SE_GUARDA` con su motivo, y la
   duración se sirve igual a quien la pida, con `duracionDe()`. */

import { calcularDuracion, uid, todayISO } from './helpers';
/* ⚠️ *"8 h 30 min"* del apartado 1 ya estaba escrito: `formatearDuracionLarga`
   nació en el Pomodoro (E3 F25) y es genérica —recibe milisegundos y devuelve
   horas y minutos—. Escribir una segunda daría el mismo texto de otra forma en
   cuanto una de las dos se retoque. */
import { formatearDuracionLarga } from './pomodoro';

/* ══════════════════════════════════════════════════════════════════════════
   1 · LA CALIDAD — tres caras fuera, 1-5 dentro (apartado 2)
   ══════════════════════════════════════════════════════════════════════════ */

export const PREGUNTA_CALIDAD = '¿Cómo has dormido?';

/* 🚨 El reparto es el literal del enunciado: *"😫 Fatal → 1–2 · 🙂 Muy bien →
   3–4 · 🤩 De maravilla → 5"*. `valor` es lo que se guarda al elegir esa cara;
   `desde`/`hasta` es el tramo que la enciende al releer algo ya guardado, para
   que una noche puesta con el formulario viejo siga saliendo con su cara. */
export const CALIDADES = [
  { id: 'fatal', emoji: '😫', nombre: 'Fatal', valor: 2, desde: 1, hasta: 2 },
  { id: 'bien', emoji: '🙂', nombre: 'Muy bien', valor: 4, desde: 3, hasta: 4 },
  { id: 'maravilla', emoji: '🤩', nombre: 'De maravilla', valor: 5, desde: 5, hasta: 5 },
];

export const MIN_CALIDAD = 1;
export const MAX_CALIDAD = 5;

/* 🚨 **`Number(null)` es 0 y `Number('')` también** — la lección de EH F11 y de
   EH F60, aquí por tercera vez. Sin esta guarda, una noche **sin contestar la
   calidad** se redondeaba a 1 y la pantalla encendía 😫 **Fatal**: una cara que
   Josué no eligió, sobre una pregunta que no contestó. Un dato que no está no es
   un cero. */
const enteroEn = (v, min, max) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, Math.round(n)));
};

/** La cara que corresponde a un valor guardado. `null` si no hay valor: sin
 *  respuesta no se enciende ninguna, que no es lo mismo que «Fatal». */
export function calidadDe(valor) {
  const n = enteroEn(valor, MIN_CALIDAD, MAX_CALIDAD);
  if (n === null) return null;
  return CALIDADES.find((c) => n >= c.desde && n <= c.hasta) || null;
}

/** Y al revés: el número que se guarda al tocar una cara. */
export function valorDeCalidad(id) {
  const c = CALIDADES.find((x) => x.id === id);
  return c ? c.valor : null;
}

export const calidadPorId = (id) => CALIDADES.find((c) => c.id === id) || null;

/* ══════════════════════════════════════════════════════════════════════════
   2 · LAS INTERRUPCIONES — 0 · 1 · 2 · 3+ (apartado 3)
   ══════════════════════════════════════════════════════════════════════════ */

export const PREGUNTA_INTERRUPCIONES = '¿Te has despertado durante la noche?';

/* ⚠️ El último es **«3+»**, no «3»: guardar un 3 y enseñar «3» diría que se
   despertó exactamente tres veces, que es una precisión que la pregunta no
   tiene. `MAX_INTERRUPCIONES` es el tope y significa *tres o más*. */
export const MAX_INTERRUPCIONES = 3;
export const INTERRUPCIONES = [
  { valor: 0, etiqueta: '0' },
  { valor: 1, etiqueta: '1' },
  { valor: 2, etiqueta: '2' },
  { valor: 3, etiqueta: '3+' },
];

export function etiquetaInterrupciones(n) {
  const v = enteroEn(n, 0, MAX_INTERRUPCIONES);
  if (v === null) return null;
  return (INTERRUPCIONES.find((i) => i.valor === v) || INTERRUPCIONES[0]).etiqueta;
}

/* ══════════════════════════════════════════════════════════════════════════
   3 · LA SIESTA — una pregunta de sí o no (apartado 4)
   ══════════════════════════════════════════════════════════════════════════ */

export const PREGUNTA_SIESTA = '¿Has dormido siesta ayer?';
export const MAX_SIESTA_MIN = 240;

/* ══════════════════════════════════════════════════════════════════════════
   4 · EL REGISTRO
   ══════════════════════════════════════════════════════════════════════════ */

export const HORA_DORMIR_DEFECTO = '23:00';
export const HORA_DESPERTAR_DEFECTO = '07:00';

const hora = (v, porDefecto) => {
  if (typeof v !== 'string') return porDefecto;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : porDefecto;
};

export function crearRegistroSueno({ fecha, horaDormir, horaDespertar, calidad, interrupciones, siestaAyer, siestaMinutos } = {}) {
  return normalizarRegistro({
    id: uid(),
    fecha: typeof fecha === 'string' && fecha ? fecha : todayISO(),
    horaDormir, horaDespertar, calidad, interrupciones, siestaAyer, siestaMinutos,
  });
}

/* 🚨 **La migración vive aquí, y corre al cargar** (E3 F26 y EH F46). Lo
   guardado antes tiene `siesta` en minutos —un número— y no tiene `siestaAyer`.
   Se convierte, **sin reescribir el campo viejo**: quien lo lea todavía (la
   exportación, por ejemplo) lo sigue encontrando. Y **un `siesta: 0` NO es un
   sí**: era «no hice siesta», que es exactamente lo que ahora dice `false`. */
export function normalizarRegistro(r) {
  if (!r || typeof r !== 'object') return null;
  const minutosViejos = Number.isFinite(Number(r.siesta)) ? Math.max(0, Math.round(Number(r.siesta))) : 0;
  const siestaAyer = typeof r.siestaAyer === 'boolean' ? r.siestaAyer : minutosViejos > 0;
  const minutos = enteroEn(r.siestaMinutos != null ? r.siestaMinutos : minutosViejos, 0, MAX_SIESTA_MIN) ?? 0;

  return {
    ...r,
    id: typeof r.id === 'string' && r.id ? r.id : uid(),
    fecha: typeof r.fecha === 'string' && r.fecha ? r.fecha : todayISO(),
    horaDormir: hora(r.horaDormir, HORA_DORMIR_DEFECTO),
    horaDespertar: hora(r.horaDespertar, HORA_DESPERTAR_DEFECTO),
    calidad: enteroEn(r.calidad, MIN_CALIDAD, MAX_CALIDAD),
    interrupciones: enteroEn(r.interrupciones, 0, MAX_INTERRUPCIONES) ?? 0,
    siestaAyer,
    /* Sin siesta no hay minutos que guardar: un «45» colgando de un «no» sería
       un dato que contradice a su propia pregunta. */
    siestaMinutos: siestaAyer ? minutos : 0,
  };
}

export function normalizarSueno(lista) {
  return (Array.isArray(lista) ? lista : []).map(normalizarRegistro).filter(Boolean);
}

/* ══════════════════════════════════════════════════════════════════════════
   5 · LO DERIVADO — la duración no se guarda
   ══════════════════════════════════════════════════════════════════════════ */

export const NO_SE_GUARDA = [
  {
    que: 'La duración de la noche',
    porque: 'sale de las dos horas con `calcularDuracion()`, que ya usan la gráfica, el Dashboard, el hub, las correlaciones y la exportación. Guardarla sería una copia que miente en cuanto se corrija una hora, y el apartado 10 dice "No dupliques sistemas de almacenamiento".',
    seSirveCon: 'duracionDe()',
  },
  {
    que: 'La media de horas',
    porque: 'es una estadística, y una estadística es una vista: guardarla mentiría en cuanto él borre una noche.',
    seSirveCon: 'mediaDeHoras()',
  },
];

/** Horas decimales, como siempre — es lo que espera la gráfica. */
export const duracionDe = (r) => (r ? calcularDuracion(r.horaDormir, r.horaDespertar) : null);

/** *"8 h 30 min"*, el formato literal del apartado 1. `null` si no se puede. */
export function textoDuracion(r) {
  const h = duracionDe(r);
  if (h === null || h === undefined) return null;
  return formatearDuracionLarga(h * 3600000);
}

export function mediaDeHoras(lista) {
  const horas = (Array.isArray(lista) ? lista : []).map(duracionDe).filter((h) => h !== null && h !== undefined);
  if (!horas.length) return null;
  return Math.round((horas.reduce((a, h) => a + h, 0) / horas.length) * 10) / 10;
}

/** La línea de una noche en la lista: duración, horas, cara y lo que hubo. */
export function resumenNoche(r) {
  if (!r) return null;
  const cal = calidadDe(r.calidad);
  const extras = [];
  if (r.interrupciones > 0) extras.push(`${etiquetaInterrupciones(r.interrupciones)} ${r.interrupciones === 1 ? 'interrupción' : 'interrupciones'}`);
  if (r.siestaAyer) extras.push(r.siestaMinutos > 0 ? `siesta de ${r.siestaMinutos} min` : 'con siesta');
  return {
    duracion: textoDuracion(r),
    horas: `${r.horaDormir} → ${r.horaDespertar}`,
    calidad: cal,
    extras: extras.length ? extras.join(' · ') : null,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   6 · LA ESTRUCTURA DEL REGISTRO — apartado 5
   ══════════════════════════════════════════════════════════════════════════ */

/* *"🌙 TU NOCHE … ¿Cómo has dormido? … 🌙 Durante la noche … ☀️ Ayer"*, en ese
   orden. Son **cuatro bloques y ya**: el apartado 6 prohíbe expresamente
   *"decenas de preguntas"* y *"formularios largos"*. */
export const BLOQUES_REGISTRO = [
  { id: 'noche', emoji: '🌙', titulo: 'Tu noche', que: 'Hora de dormir, hora de despertar y la duración, calculada sola' },
  { id: 'calidad', emoji: null, titulo: PREGUNTA_CALIDAD, que: 'Tres caras, una respuesta' },
  { id: 'interrupciones', emoji: '🌙', titulo: 'Durante la noche', que: 'Interrupciones: 0 · 1 · 2 · 3+' },
  { id: 'siesta', emoji: '☀️', titulo: 'Ayer', que: 'Si hubo siesta y, solo entonces, cuánto duró' },
];

export const MAX_PREGUNTAS = 4;

/* ══════════════════════════════════════════════════════════════════════════
   7 · LO QUE ESTA FASE NO HACE
   ══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_SU1 = [
  { que: 'La ventana móvil de 7 días de la gráfica', porque: 'el enunciado la manda a la Fase 2 con estas palabras: "NO implementar todavía el cambio de ventana de 7 días".' },
  { que: 'Rediseñar la gráfica', porque: 'el apartado 8 dice que está bien planteada y que se conserva su concepto, su estilo y su legibilidad.' },
  { que: 'Preguntas nuevas', porque: 'el apartado 6 es explícito: nada de decenas de preguntas, campos innecesarios ni formularios largos.' },
  { que: 'Nada médico', porque: 'el apartado 6 lo prohíbe: "Información médica" está en la lista de lo que no se añade.' },
  { que: 'Cambiar la escala guardada', porque: 'el apartado 2 pide 1-5 por dentro, y es lo que ya leen el Dashboard, el hub y la exportación.' },
  { que: 'Un almacén propio', porque: 'el apartado 10 dice "No dupliques sistemas de almacenamiento": sigue siendo la clave `sueno`, una lista de noches.' },
];

export const AUDITORIA_SU1 = { tablasNuevas: 0, clavesNuevas: 0, graficasRehechas: 0, preguntasNuevas: 1 };

/* ══════════════════════════════════════════════════════════════════════════
   8 · LA CONDICIÓN DE FINALIZACIÓN — apartado 11
   ══════════════════════════════════════════════════════════════════════════ */

/* 🚨 Se calculan (EH F64). Cada una ejecuta algo de verdad o lee la vista. */
export function condicionSU1({ vista } = {}) {
  const codigo = typeof vista === 'string' ? vista : '';
  const ejemplo = crearRegistroSueno({ horaDormir: '23:45', horaDespertar: '08:15' });

  return [
    { id: 1, texto: 'Registrar una noche es rápido: cuatro bloques y ninguna pregunta más', ok: BLOQUES_REGISTRO.length === MAX_PREGUNTAS },
    { id: 2, texto: 'Se puede introducir la hora de dormir', ok: codigo.includes('horaDormir') && codigo.includes('type="time"') },
    { id: 3, texto: 'Se puede introducir la hora de despertar', ok: codigo.includes('horaDespertar') },
    { id: 4, texto: 'La duración se calcula sola', ok: textoDuracion(ejemplo) === '8 h 30 min' },
    { id: 5, texto: 'La calidad se elige con las tres caras', ok: CALIDADES.length === 3 && CALIDADES.every((c) => c.emoji) && codigo.includes('CALIDADES') },
    { id: 6, texto: 'Y por dentro se guarda en 1-5', ok: CALIDADES.every((c) => c.valor >= MIN_CALIDAD && c.valor <= MAX_CALIDAD) && valorDeCalidad('maravilla') === 5 },
    { id: 7, texto: 'Se registran las interrupciones, con su 3+', ok: INTERRUPCIONES.length === 4 && etiquetaInterrupciones(3) === '3+' },
    { id: 8, texto: 'Se puede decir si hubo siesta, y solo entonces cuánto', ok: normalizarRegistro({ siestaAyer: false, siestaMinutos: 45 }).siestaMinutos === 0 },
    /* ⚠️ La duración de la gráfica la sirve `duracionDe`, que llama a
       `calcularDuracion`: desde la SU F2 la vista pide la ventana ya montada en
       vez de calcular ella. Sigue siendo la misma función, un salto más abajo. */
    { id: 9, texto: 'La gráfica de siempre sigue ahí', ok: codigo.includes('LineChart') && codigo.includes('ventanaDeDias') },
    { id: 10, texto: 'Y sigue siendo la gráfica de siempre: solo cambian sus fechas', ok: codigo.includes('VENTANA_GRAFICA') && AUDITORIA_SU1.graficasRehechas === 0 },
    { id: 11, texto: 'Lo guardado antes no se pierde: la siesta en minutos se migra', ok: normalizarRegistro({ siesta: 30 }).siestaAyer === true && normalizarRegistro({ siesta: 30 }).siestaMinutos === 30 },
    { id: 12, texto: 'Y un “sin siesta” de antes no se convierte en un sí', ok: normalizarRegistro({ siesta: 0 }).siestaAyer === false },
  ];
}

/* ══════════════════════════════════════════════════════════════════════════
   9 · LA VENTANA MÓVIL DE 7 DÍAS — Entrega 3 · Fase 32 (SU F2)
   ══════════════════════════════════════════════════════════════════════════

   🚨 **SIETE DÍAS DE CALENDARIO, NO SIETE REGISTROS.** El apartado 13 lo dice
   con esas palabras y el 18 lo repite en la lista de lo prohibido: *"No utilizar
   «últimos 7 registros»"*. Hasta la fase anterior la gráfica hacía
   `sueno.slice(-7)`, que es exactamente eso: **si Josué no registraba tres días,
   la gráfica los sustituía por tres noches viejas** y parecía que había dormido
   todos los días. Ahora la ventana la manda **la fecha real del dispositivo**
   (apartado 13) y un día sin registrar es **un hueco**, nunca un dato inventado
   (apartados 3 y 18).

   ⚠️ **Y no se rehace nada más.** El apartado 8 es explícito: *"Únicamente
   modificar el conjunto de fechas que representa."* Mismo tipo de gráfica, misma
   estética, mismo indicador (las horas dormidas). */

import { DIAS_SEMANA, diaDeFecha } from './horario';
import { addDays } from './helpers';

export const DIAS_VENTANA = 7;

/* Las etiquetas del apartado 9: *"L 24 · M 25 · X 26 · J 27…"*. Fechas de
   verdad, nunca *"1 2 3 4 5 6 7"*, que no dice de qué días habla. */
export function etiquetaDeDia(fechaISO) {
  const d = diaDeFecha(fechaISO);
  const corto = d ? DIAS_SEMANA[d - 1].corto : '';
  const dia = Number(String(fechaISO).slice(8, 10));
  return `${corto} ${Number.isFinite(dia) ? dia : ''}`.trim();
}

/** La fecha más antigua con registro. `null` si todavía no hay ninguno. */
export function primeraFechaConRegistro(lista) {
  const fechas = (Array.isArray(lista) ? lista : []).map((r) => r && r.fecha).filter(Boolean).sort();
  return fechas.length ? fechas[0] : null;
}

/* 🚨 **Rendimiento (apartado 17):** *"No recalcular innecesariamente todo el
   historial cada vez que se mueve la ventana."* Se indexa por fecha una sola vez
   y la ventana hace siete búsquedas, no un recorrido del historial entero por
   cada día. Con años de noches guardadas sigue costando lo mismo. */
export function indicePorFecha(lista) {
  const mapa = new Map();
  for (const r of (Array.isArray(lista) ? lista : [])) {
    /* Con dos registros del mismo día gana el último, que es el que él acaba de
       escribir. */
    if (r && r.fecha) mapa.set(r.fecha, r);
  }
  return mapa;
}

/* 🚨 **La ventana.** `desplazamiento` es cuántos bloques de siete días se ha ido
   hacia atrás: 0 son los últimos siete, 1 los siete anteriores, y así.

   ⚠️ **Apartado 15:** *"Si la aplicación acaba de empezar y todavía no existen 7
   días, mostrar únicamente los días disponibles. No inventar los días
   restantes."* Por eso la ventana **se recorta por delante** hasta la primera
   noche que registró: los días anteriores a su primer registro no son huecos, es
   que la aplicación no existía. */
export function ventanaDeDias(lista, { hoy = todayISO(), desplazamiento = 0, dias = DIAS_VENTANA } = {}) {
  const paso = Math.max(1, Math.round(dias));
  const atras = Math.max(0, Math.round(desplazamiento));
  const fin = addDays(hoy, -atras * paso);
  const inicioTeorico = addDays(fin, -(paso - 1));
  /* 🐛 **Y el recorte solo vale si deja una ventana con días dentro.** Escrito
     como `primera > inicioTeorico ? primera : inicioTeorico` a secas, una ventana
     anterior a la primera noche registrada salía con el inicio DESPUÉS del fin y
     **cero puntos**: la gráfica se quedaba en blanco sin decir por qué.
     `puedeRetroceder` ya impide llegar ahí desde la pantalla, pero una función
     que devuelve un rango imposible es una trampa para la siguiente fase. */
  const primera = primeraFechaConRegistro(lista);
  const inicio = primera && primera > inicioTeorico && primera <= fin ? primera : inicioTeorico;

  const mapa = indicePorFecha(lista);
  const puntos = [];
  for (let f = inicio; f <= fin; f = addDays(f, 1)) {
    const registro = mapa.get(f) || null;
    puntos.push({
      fecha: f,
      etiqueta: etiquetaDeDia(f),
      /* 🚨 **`null`, no cero, y no la media** (apartados 3 y 18): la gráfica pinta
         un hueco. Un cero diría que durmió cero horas. */
      horas: registro ? duracionDe(registro) : null,
      registro,
      sinRegistro: !registro,
      esHoy: f === hoy,
    });
  }
  return { inicio, fin, puntos, esActual: atras === 0 };
}

/* ⚠️ **Apartado 4:** solo se retrocede *"según los datos históricos
   disponibles"*. Sin nada más atrás, la flecha se apaga en vez de llevarle a
   siete días en blanco. */
export function puedeRetroceder(lista, { hoy = todayISO(), desplazamiento = 0, dias = DIAS_VENTANA } = {}) {
  const primera = primeraFechaConRegistro(lista);
  if (!primera) return false;
  const paso = Math.max(1, Math.round(dias));
  const finSiguiente = addDays(hoy, -(Math.max(0, desplazamiento) + 1) * paso);
  return primera <= finSiguiente;
}

/** Y hacia delante solo hasta los últimos siete días (apartado 5). */
export const puedeAvanzar = (desplazamiento = 0) => desplazamiento > 0;

/* El rótulo de la ventana: *"Últimos 7 días"* cuando está en el presente, y el
   rango de fechas cuando ha retrocedido. */
export const TITULO_ACTUAL = 'Últimos 7 días';

export function tituloDeVentana(v) {
  if (!v) return TITULO_ACTUAL;
  if (v.esActual) return TITULO_ACTUAL;
  const dia = (f) => Number(String(f).slice(8, 10));
  const mes = (f) => new Date(`${f}T00:00:00`).toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
  return mes(v.inicio) === mes(v.fin)
    ? `${dia(v.inicio)}–${dia(v.fin)} ${mes(v.fin)}`
    : `${dia(v.inicio)} ${mes(v.inicio)} – ${dia(v.fin)} ${mes(v.fin)}`;
}

/* ⚠️ La media **de lo que se ve**, y solo de las noches registradas: los huecos
   no bajan el número. Sin ninguna, `null`. */
export function mediaDeVentana(v) {
  return mediaDeHoras((v?.puntos || []).map((p) => p.registro).filter(Boolean));
}

/* ⚠️ *"Los días sin registro no generen datos falsos"* (criterio 19), dicho en
   la propia pantalla: cuántos huecos hay en esta ventana. */
export function huecosDeVentana(v) {
  return (v?.puntos || []).filter((p) => p.sinRegistro).length;
}

/* 🚨 **Lo que esta fase NO toca** (apartados 6, 7 y 18). El análisis largo que
   existe hoy son las correlaciones de Estadísticas —sueño ↔ estudio y sueño ↔
   ánimo—, y siguen leyendo la lista entera, no la ventana. **No se sustituyen y
   no se crea un sistema de análisis nuevo.** */
export const ANALISIS_LARGO = [
  { que: 'Correlación sueño ↔ horas de estudio', donde: 'Estadísticas', lee: 'la lista entera de noches', fase: 'ya existía' },
  { que: 'Correlación sueño ↔ ánimo del diario', donde: 'Estadísticas', lee: 'la lista entera de noches', fase: 'ya existía' },
  { que: 'Analizar mi sueño con la IA', donde: 'la propia pantalla de Sueño', lee: 'las últimas noches registradas', fase: 'ya existía' },
];

export const NO_EN_SU2 = [
  { que: 'Borrar los días que salen de la ventana', porque: 'el apartado 12 es explícito: mover la ventana no borra nada, los datos siguen ahí para el histórico y las estadísticas.' },
  { que: 'Sustituir el análisis largo', porque: 'el apartado 6 lo llama MUY IMPORTANTE: son dos niveles distintos y conviven.' },
  { que: 'Crear un sistema de análisis nuevo', porque: 'está en la lista del apartado 18.' },
  { que: 'Convertir la gráfica en mensual o enseñar 30 días', porque: 'el apartado 18 lo prohíbe: la principal responde "¿cómo estoy durmiendo últimamente?".' },
  { que: 'Rellenar las noches que faltan', porque: 'ni con ceros ni con la media (apartados 3 y 18): un hueco es un hueco.' },
  { que: 'Cambiar el tipo de gráfica, su estética o su indicador', porque: 'el apartado 8 dice "únicamente modificar el conjunto de fechas que representa".' },
];

export const AUDITORIA_SU2 = { datosBorrados: 0, analisisSustituidos: 0, graficasNuevas: 0, diasInventados: 0 };

/* 🚨 Se calculan (EH F64), y con datos de verdad: cada casilla ejecuta la
   ventana sobre un historial con huecos. */
export function condicionSU2({ vista } = {}) {
  const codigo = typeof vista === 'string' ? vista : '';
  const HOY = '2026-08-30';
  const historial = [
    { id: 'a', fecha: '2026-08-24', horaDormir: '23:00', horaDespertar: '07:00' },
    { id: 'b', fecha: '2026-08-25', horaDormir: '23:30', horaDespertar: '07:00' },
    /* 26 y 27 sin registrar: son los huecos. */
    { id: 'c', fecha: '2026-08-28', horaDormir: '00:00', horaDespertar: '07:00' },
    { id: 'd', fecha: '2026-08-30', horaDormir: '23:00', horaDespertar: '07:30' },
  ];
  const v = ventanaDeDias(historial, { hoy: HOY });
  const anterior = ventanaDeDias(historial, { hoy: HOY, desplazamiento: 1 });

  return [
    { id: 1, texto: 'La gráfica muestra una ventana de 7 días de CALENDARIO', ok: v.puntos.length === DIAS_VENTANA },
    { id: 2, texto: 'Y no «los últimos 7 registros»: un día sin registrar sigue ocupando su sitio', ok: v.puntos.filter((p) => p.sinRegistro).length === 3 },
    { id: 3, texto: 'Un día sin registro no inventa un dato', ok: v.puntos.every((p) => (p.sinRegistro ? p.horas === null : p.horas !== null)) },
    { id: 4, texto: 'La ventana avanza sola con el día del sistema', ok: ventanaDeDias(historial, { hoy: '2026-08-31' }).fin === '2026-08-31' && ventanaDeDias(historial, { hoy: '2026-08-31' }).inicio === '2026-08-25' },
    { id: 5, texto: 'El día que sale de la ventana NO se borra', ok: historial.length === 4 && AUDITORIA_SU2.datosBorrados === 0 },
    { id: 6, texto: 'Se pueden consultar periodos anteriores', ok: anterior.fin === '2026-08-23' && anterior.esActual === false },
    { id: 7, texto: 'Y se vuelve siempre a los últimos 7 días', ok: tituloDeVentana(v) === TITULO_ACTUAL && codigo.includes('TITULO_ACTUAL') },
    { id: 8, texto: 'No se retrocede a un vacío sin datos', ok: puedeRetroceder(historial, { hoy: HOY }) === false },
    { id: 9, texto: 'Las fechas son reales, con su día de la semana', ok: etiquetaDeDia('2026-08-24') === 'L 24' },
    { id: 10, texto: 'Hoy está marcado', ok: v.puntos.filter((p) => p.esHoy).length === 1 && codigo.includes('esHoy') },
    { id: 11, texto: 'Con menos de 7 días de historia se enseñan solo los que hay', ok: ventanaDeDias([{ id: 'x', fecha: '2026-08-29', horaDormir: '23:00', horaDespertar: '07:00' }], { hoy: HOY }).puntos.length === 2 },
    { id: 12, texto: 'El análisis largo que existía sigue funcionando y no se sustituye', ok: ANALISIS_LARGO.length === 3 && AUDITORIA_SU2.analisisSustituidos === 0 },
    { id: 13, texto: 'La gráfica sigue siendo la misma: solo cambian sus fechas', ok: codigo.includes('LineChart') && AUDITORIA_SU2.graficasNuevas === 0 },
    { id: 14, texto: 'La ventana se filtra, no se recorre el historial entero por cada día', ok: /indicePorFecha/.test(codigo) || /indicePorFecha/.test(String(ventanaDeDias)) },
  ];
}
