/* Fase 2 · Chatbots — el asistente de Estudios
   ═══════════════════════════════════════════════════════════════════════════

   Solo lee `estudios`. Las fechas son `fechasAcademicas` / `proximasFechas` /
   `cuentaAtras` (E3 F44: UNA lista que leen el Home, la asignatura y el
   Calendario), las asignaturas son `catalogoAsignaturas` (AS F1, el catálogo
   compartido con el Horario), los temas `temasDe` y las horas se suman por día
   con `horasDeEstudioPorDia` (CX-11: un día cuenta una vez). Especificación §8.1.

   🚨 **Las notas se dicen tal como las escribió, sin media** (H-04):
   `notaObtenida` es texto libre de hasta 20 caracteres —«7,5», «Notable»,
   «8/10»— y una media de eso sería una cifra inventada.

   ⚠️ Las asignaturas se reconocen por su nombre, por erratas y por las
   abreviaturas de siempre («mates», «bio», «fyq», «edu física»): `ALIAS` es una
   lista de palabras, no un dato de Josué, y no se guarda. */

import { fechasAcademicas, proximasFechas, cuentaAtras, tipoDeFecha, DIAS_PROXIMAS } from './fechasAcademicas';
import { catalogoAsignaturas, temasDe, estadoTema, ESTADOS_TEMA, programasDeAsignatura } from './asignaturas';
import { horasDeEstudioPorDia } from './correlaciones';
import { formatearDuracionLarga } from './pomodoro';
import { normalizar } from './indiceBusqueda';
import { fechaValida } from './helpers';
import { etiquetaDeDia, etiquetaDeRango, diasDelRango } from './fechasConversacion';
import { bTexto, bNota, bCifra, bLista, plural, detectarConceptos } from './motorConversacion';

const lista = (x) => (Array.isArray(x) ? x : []);
const mayuscula = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);
const etiquetaP = (p, hoy) => p.etiqueta || etiquetaDeRango(p.desde, p.hasta, hoy);
const horasTexto = (h) => formatearDuracionLarga(h * 3600000) || '0 min';
const FUENTE = 'Estudios · tus exámenes, entregas y eventos';

/* Abreviaturas habituales de un instituto español: se suman como alias si el nombre las contiene. */
const ALIAS = [
  { contiene: 'matematicas', alias: ['mates', 'mate', 'mat'] },
  { contiene: 'biologia', alias: ['bio', 'biolo'] },
  { contiene: 'fisica y quimica', alias: ['fyq', 'fq', 'fisica', 'quimica'] },
  { contiene: 'educacion fisica', alias: ['edu fisica', 'ed fisica', 'efe', 'gimnasia', 'gim'] },
  { contiene: 'lengua', alias: ['lengua', 'lengua castellana', 'castellano'] },
  { contiene: 'historia', alias: ['histo', 'historia'] },
  { contiene: 'filosofia', alias: ['filo'] },
  { contiene: 'ingles', alias: ['english'] },
  { contiene: 'tecnologia', alias: ['tecno'] },
  { contiene: 'economia', alias: ['eco'] },
  { contiene: 'dibujo', alias: ['dibujo'] },
  { contiene: 'informatica', alias: ['info', 'informatica'] },
  { contiene: 'geografia', alias: ['geo'] },
  { contiene: 'literatura', alias: ['lite', 'literatura'] },
];

function asignaturasDe(estudios) {
  return catalogoAsignaturas(estudios).filter((a) => a && a.id && typeof a.nombre === 'string' && a.nombre.trim());
}
const nombreDeAsignatura = (estudios, id) => (asignaturasDe(estudios).find((a) => a.id === id) || {}).nombre || 'Asignatura sin nombre';

/* Qué tipo de fecha pregunta (examen, entrega, evento): si ninguno, todos. */
const LEXICO_TIPO = {
  examen: ['examen', 'examenes', 'control', 'controles', 'prueba', 'parcial', 'global', 'recuperacion'],
  entrega: ['entrega', 'entregas', 'trabajo', 'trabajos', 'proyecto', 'presentacion', 'exposicion', 'deberes'],
  evento: ['evento', 'eventos', 'excursion', 'charla'],
};
function tiposPedidos(trozo) {
  const h = detectarConceptos(trozo.tokens || [], LEXICO_TIPO);
  const ids = ['examen', 'entrega', 'evento'].filter((id) => h.has(id));
  return ids.length ? ids : null;
}

function lineaDeFecha(f, estudios, hoy) {
  const t = tipoDeFecha(f.tipo);
  const cuenta = cuentaAtras(f.fecha, hoy);
  const cuando = f.fecha ? `${etiquetaDeDia(f.fecha, hoy)}${f.hora ? ` a las ${f.hora}` : ''}${cuenta && !['Hoy', 'Mañana', 'Ayer'].includes(cuenta) ? ` · ${cuenta.toLowerCase()}` : ''}` : 'sin fecha';
  return `${t ? t.icono : '•'} ${nombreDeAsignatura(estudios, f.asignaturaId)} · ${f.nombre || (t ? t.nombre : '')}: ${cuando}`;
}

/* ══════════════════════════════════════════════════════════════════════════
   Las capacidades
   ══════════════════════════════════════════════════════════════════════════ */

function proximos(datos, { periodo, hoy, entidad, tipos }) {
  const estudios = datos.estudios || {};
  const desde = periodo && !periodo.porDefecto ? periodo.desde : hoy;
  const hasta = periodo && !periodo.porDefecto ? periodo.hasta : null;
  const opciones = { limite: 50, dias: DIAS_PROXIMAS, asignaturaIds: entidad ? [entidad.id] : null };
  let filas = hasta
    ? fechasAcademicas(estudios, entidad ? { asignaturaId: entidad.id } : {}).filter((f) => f.fecha && f.fecha >= desde && f.fecha <= hasta)
    : proximasFechas(estudios, hoy, opciones);
  if (tipos) filas = filas.filter((f) => tipos.includes(f.tipo));
  const cuando = hasta ? etiquetaP(periodo, hoy) : `en los próximos ${DIAS_PROXIMAS} días`;
  const PLURAL = { examen: 'exámenes', entrega: 'entregas', evento: 'eventos' };
  const que = tipos ? tipos.map((t) => PLURAL[t]).join(' ni ') : 'exámenes, entregas ni eventos';
  if (!filas.length) {
    return { sinDatos: true, bloques: [bTexto(`No tienes ${que}${entidad ? ` de ${entidad.nombre}` : ''} ${cuando}.`)], fuente: FUENTE };
  }
  const hoyMismo = filas.filter((f) => f.fecha === hoy);
  return {
    bloques: [
      bTexto(`Tienes ${plural(filas.length, 'fecha', 'fechas')}${entidad ? ` de ${entidad.nombre}` : ''} ${cuando}${hoyMismo.length ? `, ${hoyMismo.length === 1 ? 'una' : hoyMismo.length} hoy mismo` : ''}:`),
      bLista(filas.map((f) => lineaDeFecha(f, estudios, hoy))),
    ],
    fuente: FUENTE,
  };
}

function cuando(datos, { entidad, hoy, tipos }) {
  const estudios = datos.estudios || {};
  let filas = fechasAcademicas(estudios, { asignaturaId: entidad.id });
  if (tipos) filas = filas.filter((f) => tipos.includes(f.tipo));
  const que = tipos ? tipos.map((t) => tipoDeFecha(t).nombre.toLowerCase()).join(' o ') : 'examen, entrega ni evento';
  if (!filas.length) return { sinDatos: true, bloques: [bTexto(`No tienes ningún ${que} de ${entidad.nombre} apuntado.`)], fuente: FUENTE };
  const futuras = filas.filter((f) => f.fecha && f.fecha >= hoy);
  const pasadas = filas.filter((f) => f.fecha && f.fecha < hoy).reverse();
  const sinFecha = filas.filter((f) => !f.fecha);
  const bloques = [];
  if (futuras.length) {
    const f = futuras[0];
    bloques.push(bTexto(`El próximo de ${entidad.nombre} es ${etiquetaDeDia(f.fecha, hoy)}${f.hora ? ` a las ${f.hora}` : ''}: ${f.nombre || tipoDeFecha(f.tipo).nombre}.`));
    if (futuras.length > 1) bloques.push(bLista(futuras.slice(1).map((x) => lineaDeFecha(x, estudios, hoy))));
  } else {
    bloques.push(bTexto(`No tienes ningún ${que} de ${entidad.nombre} por delante.`));
    if (pasadas.length) bloques.push(bNota(`El último fue ${etiquetaDeDia(pasadas[0].fecha, hoy)}: ${pasadas[0].nombre || tipoDeFecha(pasadas[0].tipo).nombre}.`));
  }
  if (sinFecha.length) bloques.push(bNota(`${plural(sinFecha.length, 'apunte más no tiene', 'apuntes más no tienen')} fecha todavía.`));
  return { bloques, fuente: FUENTE };
}

function horas(datos, { periodo, hoy, entidad }) {
  const estudios = datos.estudios || {};
  const registros = lista(estudios.horas).filter((h) => h && fechaValida(h.fecha) && h.fecha >= periodo.desde && h.fecha <= periodo.hasta && (!entidad || h.asignaturaId === entidad.id));
  const etiqueta = etiquetaP(periodo, hoy);
  const porDia = horasDeEstudioPorDia(registros);
  if (!porDia.length) {
    return { sinDatos: true, bloques: [bTexto(`No tienes horas de estudio registradas${entidad ? ` de ${entidad.nombre}` : ''} ${etiqueta}.`)], fuente: 'Estudios · tus horas de estudio' };
  }
  const total = porDia.reduce((a, d) => a + d.horas, 0);
  const bloques = [
    bTexto(`${mayuscula(etiqueta)} has registrado ${horasTexto(total)} de estudio${entidad ? ` de ${entidad.nombre}` : ''}.`),
    bCifra('Total', horasTexto(total), 'calculo', `suma de ${plural(registros.length, 'registro', 'registros')}`),
    bCifra('Días con estudio', `${porDia.length} de ${diasDelRango(periodo.desde, periodo.hasta)}`, 'dato'),
  ];
  if (!entidad) {
    const porAsignatura = new Map();
    for (const h of registros) {
      const n = Number(h.horas);
      if (!Number.isFinite(n) || n < 0) continue;
      porAsignatura.set(h.asignaturaId, (porAsignatura.get(h.asignaturaId) || 0) + n);
    }
    const items = [...porAsignatura.entries()].sort((a, b) => b[1] - a[1]).map(([id, h]) => `${nombreDeAsignatura(estudios, id)}: ${horasTexto(h)}`);
    if (items.length > 1) bloques.push(bLista(items));
  }
  if (periodo.recortado) bloques.push(bNota('Cuento hasta hoy: lo que queda del periodo todavía no ha pasado.'));
  return { bloques, fuente: 'Estudios · tus horas de estudio' };
}

function notas(datos, { entidad, hoy }) {
  const estudios = datos.estudios || {};
  const examenes = lista(estudios.examenes)
    .filter((e) => e && (!entidad || e.asignaturaId === entidad.id) && String(e.notaObtenida ?? '').trim())
    .sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));
  if (!examenes.length) {
    return { sinDatos: true, bloques: [bTexto(`No tienes ninguna nota apuntada${entidad ? ` de ${entidad.nombre}` : ''}.`)], fuente: 'Estudios · tus exámenes' };
  }
  const items = examenes.map((e) => `${nombreDeAsignatura(estudios, e.asignaturaId)}${e.tema ? ` · ${e.tema}` : ''}${e.fecha && fechaValida(e.fecha) ? ` (${etiquetaDeDia(e.fecha, hoy)})` : ''}: ${String(e.notaObtenida).trim()}${String(e.notaObjetivo ?? '').trim() ? ` — tu objetivo era ${String(e.notaObjetivo).trim()}` : ''}`);
  return {
    bloques: [
      bTexto(examenes.length === 1 ? 'Tienes una nota apuntada:' : `Tienes ${examenes.length} notas apuntadas, de la más reciente a la más antigua:`),
      bLista(items),
      bNota('Las copio tal como las escribiste. No calculo una media: las notas se apuntan como texto y no tienen por qué usar la misma escala.'),
    ],
    fuente: `Estudios · ${plural(examenes.length, 'examen con nota', 'exámenes con nota')}`,
  };
}

function temas(datos, { entidad }) {
  const estudios = datos.estudios || {};
  const ts = temasDe(estudios, entidad.id);
  if (!ts.length) return { sinDatos: true, bloques: [bTexto(`${entidad.nombre} no tiene temas apuntados.`)], fuente: 'Estudios · tus temas' };
  const bloques = [bTexto(`${entidad.nombre} tiene ${plural(ts.length, 'tema', 'temas')}:`)];
  for (const e of ESTADOS_TEMA) {
    const suyos = ts.filter((t) => estadoTema(t.estado).id === e.id);
    if (suyos.length) bloques.push(bCifra(`${e.icono} ${e.nombre}`, suyos.map((t) => t.nombre || 'Sin nombre').join(', '), 'dato'));
  }
  return { bloques, fuente: 'Estudios · tus temas' };
}

function asignaturas(datos) {
  const estudios = datos.estudios || {};
  const as = asignaturasDe(estudios).filter((a) => !a.oculta);
  if (!as.length) return { sinDatos: true, bloques: [bTexto('Todavía no tienes asignaturas.')], fuente: 'Estudios · tus asignaturas' };
  return { bloques: [bTexto(`Tienes ${plural(as.length, 'asignatura', 'asignaturas')}:`), bLista(as.map((a) => a.nombre), 12)], fuente: 'Estudios · tus asignaturas' };
}

/* ── Las entidades: las asignaturas, con sus abreviaturas ─────────────────── */
function entidades(datos) {
  const estudios = datos.estudios || {};
  const ultima = new Map();
  for (const f of [...lista(estudios.examenes), ...lista(estudios.horas)]) {
    if (f && fechaValida(f.fecha) && (!ultima.has(f.asignaturaId) || ultima.get(f.asignaturaId) < f.fecha)) ultima.set(f.asignaturaId, f.fecha);
  }
  /* D5 — el área (programa) de cada asignatura es su `detalle`: lo que distingue dos que se llaman igual
     en los botones de una aclaración. Solo nombres de áreas suyas, nada más. */
  const programas = new Map(lista(estudios.programas).filter((p) => p && p.id && typeof p.nombre === 'string' && p.nombre.trim()).map((p) => [p.id, p.nombre.trim()]));
  return {
    asignatura: asignaturasDe(estudios).map((a) => {
      const n = normalizar(a.nombre);
      const alias = ALIAS.filter((x) => n.includes(x.contiene)).flatMap((x) => x.alias);
      const areas = programasDeAsignatura(a).map((id) => programas.get(id)).filter(Boolean);
      return { tipo: 'asignatura', id: a.id, nombre: a.nombre, detalle: areas.length ? areas.join(' y ') : null, alias, reciente: ultima.has(a.id) ? Number(ultima.get(a.id).replace(/-/g, '')) : 0 };
    }),
  };
}

const conTipos = (trozo) => ({ tipos: tiposPedidos(trozo) });

export const ASISTENTE_ESTUDIOS = {
  id: 'estudios',
  modulo: 'estudios',
  nombre: 'Estudios',
  lee: ['estudios'],
  saludo: '¡Hola! Pregúntame por tus exámenes y entregas, las horas que has estudiado, tus notas o los temas de una asignatura.',
  lexico: {
    examen: ['examen', 'examenes', 'control', 'controles', 'prueba', 'parcial', 'global', 'recuperacion'],
    entrega: ['entrega', 'entregas', 'trabajo', 'trabajos', 'proyecto', 'presentacion', 'exposicion', 'deberes'],
    evento: ['evento', 'eventos', 'excursion', 'charla'],
    estudiar: ['estudi*', 'repas*', 'he estudiado', 'horas de estudio', 'he repasado'],
    nota: ['nota', 'notas', 'calificacion', 'calificaciones', 'saque', 'he sacado', 'aprobe', 'suspendi', 'que saque'],
    tema: ['tema', 'temas', 'temario', 'unidad', 'unidades', 'lecciones'],
    asignatura: ['asignatura', 'asignaturas', 'materia', 'materias'],
    pendiente: ['pendiente', 'pendientes', 'me quedan', 'me falta', 'me faltan', 'sin estudiar'],
    horas: ['horas', 'hora', 'tiempo'],
  },
  capacidades: [
    { id: 'proximos', titulo: 'Tus próximos exámenes y entregas', ejemplo: '¿Qué exámenes tengo próximamente?', senales: { examen: 2, entrega: 2, evento: 2, proximo: 3, cuando: 1 }, necesita: [['examen', 'entrega', 'evento', 'proximo']], entidad: { tipo: 'asignatura', obligatoria: false, nombre: 'asignatura' }, periodo: 'ambos', tiempo: 'futuro', porDefecto: 'proximos60', prioridad: 2, cubreObligacion: true, argumentos: conTipos, ejecutar: proximos },
    { id: 'cuando', titulo: 'Cuándo es el examen de una asignatura', ejemplo: '¿Cuándo es el examen de biología?', senales: { cuando: 3, examen: 2, entrega: 2, evento: 1, proximo: 1 }, necesita: [['cuando', 'examen', 'entrega', 'evento', 'proximo']], entidad: { tipo: 'asignatura', obligatoria: true, nombre: 'asignatura', vacio: 'Todavía no tienes asignaturas.' }, periodo: null, tiempo: 'futuro', prioridad: 1, cubreObligacion: true, argumentos: conTipos, ejecutar: cuando },
    { id: 'horas', titulo: 'Las horas que has estudiado', ejemplo: '¿Cuántas horas he estudiado esta semana?', senales: { estudiar: 3, horas: 2, cuanto: 1 }, necesita: [['estudiar']], entidad: { tipo: 'asignatura', obligatoria: false, nombre: 'asignatura' }, periodo: 'rango', porDefecto: 'estaSemana', prioridad: 2, ejecutar: horas },
    { id: 'notas', titulo: 'Tus notas de exámenes', ejemplo: '¿Qué notas he sacado?', senales: { nota: 4, examen: 1 }, necesita: [['nota']], entidad: { tipo: 'asignatura', obligatoria: false, nombre: 'asignatura' }, periodo: null, prioridad: 1, ejecutar: notas },
    { id: 'temas', titulo: 'Los temas de una asignatura', ejemplo: '¿Qué temas me quedan de historia?', senales: { tema: 4, pendiente: 1 }, necesita: [['tema']], entidad: { tipo: 'asignatura', obligatoria: true, nombre: 'asignatura', vacio: 'Todavía no tienes asignaturas.' }, periodo: null, prioridad: 1, cubreObligacion: true, ejecutar: temas },
    { id: 'asignaturas', titulo: 'Tus asignaturas', ejemplo: '¿Qué asignaturas tengo?', senales: { asignatura: 4, lista: 1 }, necesita: [['asignatura']], periodo: null, prioridad: 1, ejecutar: asignaturas },
  ],
  entidades,
};

