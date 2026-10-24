/* Fase 2 · Chatbots — el asistente de Productividad
   ═══════════════════════════════════════════════════════════════════════════

   Lee `productividad` y `objetivos`, y nada más (sin `rachas`: la racha de un
   hábito sale de su propio historial, H-12). Llama a las mismas funciones que el
   centro de control de Productividad (`FUENTES_PR` de `integracionPR.js`):
   `tocaHoy`/`hechoHoy`/`estadisticasHabito`/`textoRacha` (hábitos, E3 F24),
   `estadisticasDe` (pomodoro, E3 F25), `progresoDeMeta`/`progresoDeObjetivo`
   (E3 F27) y `paraHoy` de las rutinas (E3 F28). Especificación §8.1.

   🚨 **Las tareas no se contestan aquí** (CB-17): viven en Organización desde la
   DIST F1, y Organización espera a P-06. Este archivo no lee `.tareas` —la
   suite lo comprueba—: si pregunta por ellas, contesta el «fuera de dominio».

   🚨 **Un día que el hábito no pedía no cuenta ni a favor ni en contra**
   (`NO_TOCA`, E3 F24): «hoy no te toca» no es «no lo has hecho». */

import { normalizarHabitos, tocaHoy, hechoHoy, estadisticasHabito, textoRacha } from './habitos';
import { estadisticasDe, normalizarSesion } from './pomodoro';
import { normalizarMetas, progresoDeMeta, normalizarObjetivos, progresoDeObjetivo, metaCompletada } from './metasObjetivos';
import { paraHoy as rutinasParaHoy, filtrarRutinas, tocaHoy as rutinaTocaHoy, normalizarEjecuciones, fechaDeEjecucion } from './rutinas';
import { etiquetaDeDia, etiquetaDeRango } from './fechasConversacion';
import { bTexto, bNota, bCifra, bLista, plural } from './motorConversacion';

const lista = (x) => (Array.isArray(x) ? x : []);
const mayuscula = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);
const etiquetaP = (p, hoy) => p.etiqueta || etiquetaDeRango(p.desde, p.hasta, hoy);
const habitosDe = (datos) => normalizarHabitos(lista((datos.productividad || {}).habitos)).filter((h) => h.activo !== false);

/* ══════════════════════════════════════════════════════════════════════════
   Las capacidades
   ══════════════════════════════════════════════════════════════════════════ */

function habitos(datos, { periodo, hoy }) {
  const todos = habitosDe(datos);
  const fecha = periodo.desde;
  const cuando = etiquetaDeDia(fecha, hoy);
  if (!todos.length) return { sinDatos: true, bloques: [bTexto('No tienes hábitos activos.')], fuente: 'Productividad · tus hábitos' };
  const tocan = todos.filter((h) => tocaHoy(h, fecha) || hechoHoy(h, fecha));
  if (!tocan.length) return { bloques: [bTexto(`${mayuscula(cuando)} no te tocaba ningún hábito.`), bNota('Un día que un hábito no pide no cuenta ni a favor ni en contra.')], fuente: 'Productividad · tus hábitos' };
  const hechos = tocan.filter((h) => hechoHoy(h, fecha));
  const pendientes = tocan.filter((h) => !hechoHoy(h, fecha));
  const bloques = [
    bTexto(`${mayuscula(cuando)} ${fecha === hoy ? 'te tocan' : 'te tocaban'} ${plural(tocan.length, 'hábito', 'hábitos')} y ${fecha === hoy ? 'llevas' : 'hiciste'} ${hechos.length}.`),
    bCifra('Hechos', `${hechos.length} de ${tocan.length}`, 'dato'),
  ];
  if (hechos.length) bloques.push(bCifra('✓ Hechos', hechos.map((h) => h.nombre).join(', '), 'dato'));
  if (pendientes.length) bloques.push(bCifra(fecha === hoy ? '○ Te quedan' : '○ Sin marcar', pendientes.map((h) => h.nombre).join(', '), 'dato'));
  return { bloques, fuente: 'Productividad · tus hábitos' };
}

/* 🐛 D9 — «Llevas 4 semanas seguidos»: «seguido» concuerda con lo que se cuenta (semana es femenino)
   y con cuántos (1 → singular). `actual` es el texto de `textoRacha` («1 semana», «3 días»). */
export function seguidos(unidad, actual) {
  const femenino = unidad === 'semana';
  const uno = /^1\s/.test(String(actual || ''));
  return `seguid${femenino ? 'a' : 'o'}${uno ? '' : 's'}`;
}

function racha(datos, { entidad, hoy }) {
  const todos = habitosDe(datos);
  if (!todos.length) return { sinDatos: true, bloques: [bTexto('No tienes hábitos activos.')], fuente: 'Productividad · tus hábitos' };
  if (entidad) {
    const h = todos.find((x) => x.id === entidad.id);
    if (!h) return { sinDatos: true, bloques: [bTexto(`No encuentro ese hábito entre los activos.`)], fuente: 'Productividad · tus hábitos' };
    const e = estadisticasHabito(h, hoy);
    const unidad = (n) => (e.unidad === 'semana' ? plural(n, 'semana', 'semanas') : plural(n, 'día', 'días'));
    const actual = textoRacha(h, hoy);
    return {
      bloques: [
        bTexto(actual ? `Llevas ${actual} ${seguidos(e.unidad, actual)} con «${h.nombre}».` : `Ahora mismo no tienes racha con «${h.nombre}».`),
        bCifra('Racha actual', actual || unidad(0), 'calculo'),
        bCifra('Tu mejor racha', unidad(e.mejorRacha || 0), 'calculo'),
        ...(e.porcentaje !== null && e.porcentaje !== undefined ? [bCifra('Cumplimiento', `${e.porcentaje} %`, 'calculo', 'de los días que tocaba')] : []),
      ],
      fuente: 'Productividad · el historial de ese hábito',
    };
  }
  const conRacha = todos.map((h) => ({ h, e: estadisticasHabito(h, hoy) })).filter((x) => x.e.rachaActual > 0)
    .sort((a, b) => b.e.rachaActual - a.e.rachaActual || a.h.nombre.localeCompare(b.h.nombre));
  if (!conRacha.length) return { bloques: [bTexto('Ahora mismo no tienes ninguna racha viva.'), bNota('Una racha de cero no se cuenta como racha.')], fuente: 'Productividad · tus hábitos' };
  return {
    bloques: [bTexto(`Tu racha más larga ahora mismo es «${conRacha[0].h.nombre}»: ${textoRacha(conRacha[0].h, hoy)}.`), bLista(conRacha.map((x) => `${x.h.nombre}: ${textoRacha(x.h, hoy)}`))],
    fuente: 'Productividad · tus hábitos',
  };
}

function pomodoro(datos, { periodo, hoy }) {
  const sesiones = lista((datos.productividad || {}).pomodoroSesiones).map(normalizarSesion).filter(Boolean);
  const e = estadisticasDe(sesiones, { desde: periodo.desde, hasta: periodo.hasta });
  const etiqueta = etiquetaP(periodo, hoy);
  if (!e.pomodoros && !e.interrumpidas) return { sinDatos: true, bloques: [bTexto(`No tienes pomodoros ${etiqueta}.`)], fuente: 'Productividad · Pomodoro' };
  const bloques = [
    bTexto(`${mayuscula(etiqueta)} has completado ${plural(e.pomodoros, 'pomodoro', 'pomodoros')}${e.tiempo ? ` (${e.tiempo} de enfoque)` : ''}.`),
    bCifra('Completados', String(e.pomodoros), 'dato'),
  ];
  if (e.tiempo) bloques.push(bCifra('Tiempo de enfoque', e.tiempo, 'calculo'));
  if (e.interrumpidas) bloques.push(bCifra('Interrumpidos', String(e.interrumpidas), 'dato'));
  return { bloques, fuente: 'Productividad · Pomodoro' };
}

function metas(datos) {
  const ms = normalizarMetas(lista((datos.productividad || {}).metas)).filter((m) => m.estado !== 'archivado');
  if (!ms.length) return { sinDatos: true, bloques: [bTexto('No tienes metas.')], fuente: 'Productividad · tus metas' };
  const activas = ms.filter((m) => !metaCompletada(m));
  const hechas = ms.filter((m) => metaCompletada(m));
  return {
    bloques: [
      bTexto(`Tienes ${plural(activas.length, 'meta en marcha', 'metas en marcha')}${hechas.length ? ` y ${plural(hechas.length, 'completada', 'completadas')}` : ''}.`),
      bLista(ms.map((m) => `${m.nombre}: ${progresoDeMeta(m)?.texto || '—'}${metaCompletada(m) ? ' ✓' : ''}`)),
    ],
    fuente: 'Productividad · tus metas',
  };
}

function objetivos(datos) {
  const os = normalizarObjetivos(lista((datos.objetivos || {}).lista)).filter((o) => o.estado !== 'archivado');
  const ms = normalizarMetas(lista((datos.productividad || {}).metas));
  if (!os.length) return { sinDatos: true, bloques: [bTexto('No tienes objetivos.')], fuente: 'Productividad · tus objetivos' };
  return {
    bloques: [
      bTexto(`Tienes ${plural(os.length, 'objetivo', 'objetivos')}:`),
      bLista(os.map((o) => `${o.texto}: ${progresoDeObjetivo(o, ms)?.texto || '—'}${o.cumplido ? ' ✓' : ''}`)),
      bNota('Un objetivo sin metas no tiene porcentaje: no es un 0 %, es que todavía no hay con qué medirlo.'),
    ],
    fuente: 'Productividad · tus objetivos',
  };
}

function rutinas(datos, { periodo, hoy }) {
  const prod = datos.productividad || {};
  const fecha = periodo.desde;
  const cuando = etiquetaDeDia(fecha, hoy);
  const activas = filtrarRutinas(lista(prod.rutinas), 'activas');
  if (!activas.length) return { sinDatos: true, bloques: [bTexto('No tienes rutinas activas.')], fuente: 'Productividad · tus rutinas' };
  const deEseDia = activas.filter((r) => rutinaTocaHoy(r, fecha));
  if (!deEseDia.length) return { bloques: [bTexto(`${mayuscula(cuando)} no ${fecha === hoy ? 'tienes' : 'tenías'} ninguna rutina programada.`)], fuente: 'Productividad · tus rutinas' };
  const hechas = new Set(normalizarEjecuciones(lista(prod.rutinaEjecuciones)).filter((e) => e.estado === 'completada' && fechaDeEjecucion(e) === fecha).map((e) => e.rutinaId));
  const resumenHoy = fecha === hoy ? rutinasParaHoy(prod.rutinas, prod.rutinaEjecuciones, hoy) : null;
  return {
    bloques: [
      bTexto(`${mayuscula(cuando)} ${fecha === hoy ? 'tienes' : 'tenías'} ${plural(deEseDia.length, 'rutina', 'rutinas')}${resumenHoy ? `; te ${resumenHoy.pendientes === 1 ? 'queda' : 'quedan'} ${resumenHoy.pendientes}` : ''}.`),
      bLista(deEseDia.map((r) => `${hechas.has(r.id) ? '✓' : '○'} ${r.nombre}${r.programacion && r.programacion.hora ? ` · ${r.programacion.hora}` : ''}`)),
    ],
    fuente: 'Productividad · tus rutinas',
  };
}

function entidades(datos, hoy) {
  return {
    habito: habitosDe(datos).map((h) => {
      const fechas = Object.keys(h.historial || {}).filter((f) => f <= (hoy || '9999')).sort();
      return { tipo: 'habito', id: h.id, nombre: h.nombre, reciente: fechas.length ? Number(fechas[fechas.length - 1].replace(/-/g, '')) : 0 };
    }),
  };
}

export const ASISTENTE_PRODUCTIVIDAD = {
  id: 'productividad',
  modulo: 'productividad',
  nombre: 'Productividad',
  lee: ['productividad', 'objetivos'],
  saludo: '¡Hola! Pregúntame por tus hábitos, tus rachas, tus pomodoros, tus metas, tus objetivos o tus rutinas.',
  lexico: {
    habito: ['habito', 'habitos', 'costumbre', 'costumbres'],
    racha: ['racha', 'rachas', 'seguidos', 'dias seguidos', 'llevo seguidos', 'streak'],
    pomodoro: ['pomodoro', 'pomodoros', 'concentracion', 'enfoque', 'focus', 'sesiones de estudio'],
    meta: ['meta', 'metas'],
    objetivo: ['objetivo', 'objetivos', 'proposito', 'propositos'],
    rutina: ['rutina', 'rutinas'],
    hecho: ['he hecho', 'llevo', 'hecho', 'completado', 'he completado', 'me quedan', 'me falta', 'me faltan'],
  },
  capacidades: [
    { id: 'habitos', titulo: 'Tus hábitos de un día', ejemplo: '¿Qué hábitos me tocan hoy?', senales: { habito: 4, hecho: 1, proximo: 1 }, necesita: [['habito']], periodo: 'dia', porDefecto: 'hoy', prioridad: 2, cubreObligacion: true, ejecutar: habitos },
    { id: 'racha', titulo: 'Tus rachas', ejemplo: '¿Cuál es mi racha más larga?', senales: { racha: 4, habito: 1 }, necesita: [['racha']], entidad: { tipo: 'habito', obligatoria: false, nombre: 'hábito' }, periodo: null, prioridad: 2, ejecutar: racha },
    { id: 'pomodoro', titulo: 'Tus pomodoros', ejemplo: '¿Cuántos pomodoros he hecho esta semana?', senales: { pomodoro: 4, cuanto: 1, hecho: 1 }, necesita: [['pomodoro']], periodo: 'ambos', porDefecto: 'hoy', prioridad: 1, ejecutar: pomodoro },
    { id: 'metas', titulo: 'Tus metas', ejemplo: '¿Cómo van mis metas?', senales: { meta: 4 }, necesita: [['meta']], periodo: null, prioridad: 1, ejecutar: metas },
    { id: 'objetivos', titulo: 'Tus objetivos', ejemplo: '¿Cómo van mis objetivos?', senales: { objetivo: 4 }, necesita: [['objetivo']], periodo: null, prioridad: 1, ejecutar: objetivos },
    { id: 'rutinas', titulo: 'Tus rutinas de un día', ejemplo: '¿Qué rutinas tengo hoy?', senales: { rutina: 4, proximo: 1 }, necesita: [['rutina']], periodo: 'dia', porDefecto: 'hoy', prioridad: 1, cubreObligacion: true, ejecutar: rutinas },
  ],
  entidades,
};
