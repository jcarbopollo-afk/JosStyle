// ============================================================================
// EH · Fase 38/65 — NOTIFICACIONES Y RECORDATORIOS
//
// *"Las notificaciones están **desactivadas hasta que el usuario las active**."*
// Y la condición de finalización: *"Estilo propone → usuario activa → JosStyle
// recuerda. **Nunca: Estilo decide → JosStyle molesta.**"*
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ ESTE ARCHIVO DECIDE; `notificaciones.js` MANDA.** Es el mismo reparto
// que HT F10 dejó escrito —*"`avisosHorario.js` DECIDE, `notificaciones.js`
// MANDA"*— y el apartado 1 lo pide con esas palabras: *"no crear otro sistema.
// Utilizar 🔔 Notificaciones globales de JosStyle."* Así que aquí **no se llama
// a `new Notification` ni una vez**, y hay una prueba que lee el código.
//
// **2. ⚠️ TODO NACE APAGADO** (la regla principal, y el apartado 3: *"no enviar
// 'hace 7 días que no te afeitas' si el usuario nunca lo configuró"*). Ningún
// tipo de aviso viene puesto: `porDefecto` es `false` en los seis, y hay una
// auditoría que lo cuenta.
//
// **3. ⚠️ NI UN HORARIO DE SILENCIO NI UN INTERRUPTOR GLOBAL NUEVOS**
// (apartados 7 y 11). El horario de descanso, el interruptor y las categorías
// son de la **Fase A4** y viven en `notificaciones.js`; esta fase solo aporta
// **sus tipos**. Un segundo horario de silencio sería el peor duplicado
// posible: el día que él cambiara uno, el otro seguiría despertándole.
//
// **4. ⚠️ SILENCIAR UN MÓDULO NO ES DESACTIVARLO** (apartado 6, con esas
// palabras: *"🔕 no recibir avisos **sin desactivar el módulo completo**"*). Es
// el tercer eje después de `activo` y `oculto` de la F36, y no se mezcla con
// ninguno: un módulo silenciado sigue funcionando y sigue en la portada.
//
// **5. ⚠️ NI UN HISTORIAL PARALELO** (apartado 13). Y aquí la respuesta honesta
// es que **JosStyle no tiene un historial global de notificaciones**: lo que
// tiene es el antirrepetición de `notificarSiCorresponde`, que ya evita el
// mismo aviso dos veces el mismo día. Así que esta fase **no guarda ni un aviso
// enviado** y lo dice, en vez de montar el historial paralelo que prohíbe.
//
// **6. ⚠️ Y LAS RECOMENDACIONES NO SE VUELVEN AVISOS SOLAS** (apartado 10).
// Es un tipo más, apagado como los demás, y sin él las ideas de la F32 no
// notifican nada.
// ============================================================================

import { todayISO, uid } from './helpers';
import { normalizarEstiloHombre, guardarConfig, moduloEH, IDS_EH } from './estiloDeHombre';
import { MODULO_ANFITRION } from './miEstilo';
import { estadoDe } from './gestionEstilo';
/* ⚠️ Decisión 1 — la prioridad y los motivos de rechazo son genéricos y ya
   estaban escritos en HT F10. Importarlos es mejor que una segunda copia; si una
   tercera fase los necesita, entonces sí toca extraer un motor, como se hizo con
   `motorRutinas` y `motorRecomendaciones`. */
import { PRIORIDADES_AVISO, prioridadAviso, MOTIVOS_RECHAZO } from './avisosHorario';
/* ⚠️ De dónde sale cada aviso: el `resumen…()` que ya existe en su módulo. */
import { resumenRutinasPiel } from './rutinasPiel';
import { resumenPelo } from './rutinasPelo';
import { datosRutinasBarba } from './rutinasBarba';
import { frecuenciaDeAfeitado } from './perfilBarba';
import { datosPerfumes } from './perfumes';
import { recomendarIdeas } from './ideasEstilo';

/* ===========================================================================
   1 · LOS TIPOS DE AVISO (apartados 2, 10 y 11)
   ===========================================================================
   *"El usuario podrá activar individualmente: 🧴 Cuidado —rutina pendiente,
   rutina programada—, 🧔 Barba —recordatorio de afeitado, cuidado programado—,
   🌫️ Perfumes —rotación, recordatorio personalizado—, 🎯 Objetivos —solo
   utilizar el sistema global—."*

   ⚠️ **`porDefecto: false` en todos**, sin excepción: es la regla principal de
   la fase escrita en el catálogo, no en un comentario.

   ⚠️ Y **añadir un aviso es añadir una línea**, con su módulo y su categoría de
   la Fase A4. Ni un `case`, ni un `if`. */

export const TIPOS_AVISO_EH = [
  {
    id: 'rutina_piel', nombre: 'Rutina de cuidado pendiente', icono: '🧴',
    modulo: 'skincare', categoria: 'rutinas', prioridad: 'media', porDefecto: false,
  },
  {
    id: 'rutina_pelo', nombre: 'Rutina de pelo pendiente', icono: '💇',
    modulo: 'pelo', categoria: 'rutinas', prioridad: 'baja', porDefecto: false,
  },
  {
    id: 'afeitado', nombre: 'Recordatorio de afeitado', icono: '🧔',
    modulo: 'barba', categoria: 'rutinas', prioridad: 'baja', porDefecto: false,
  },
  {
    /* ⚠️ **EH F19, apartado 7** — *"opcionales. El usuario decide. **Nunca
       activarlos automáticamente.**"* Como todos: nace apagado. */
    id: 'rutina_cuerpo', nombre: 'Rutina de cuerpo e higiene pendiente', icono: '🚿',
    modulo: 'cuerpo', categoria: 'rutinas', prioridad: 'baja', porDefecto: false,
  },
  {
    id: 'perfume_rotacion', nombre: 'Cambiar de perfume', icono: '🌫️',
    modulo: 'perfumes', categoria: 'rutinas', prioridad: 'baja', porDefecto: false,
  },
  {
    /* ⚠️ Apartado 10 — *"las recomendaciones NO deben convertirse
       automáticamente en notificaciones"*. Es un tipo más, y apagado. */
    id: 'ideas', nombre: 'Avisarme de nuevas ideas', icono: '💡',
    modulo: MODULO_ANFITRION, categoria: 'sugerencias', prioridad: 'baja', porDefecto: false,
  },
  {
    // Apartado 4 — los que él mismo crea.
    id: 'recordatorio', nombre: 'Mis recordatorios', icono: '🔔',
    modulo: MODULO_ANFITRION, categoria: 'rutinas', prioridad: 'media', porDefecto: false,
  },
];

export const tipoAvisoEH = (id) => TIPOS_AVISO_EH.find((t) => t.id === id) || null;
export const IDS_TIPOS_EH = TIPOS_AVISO_EH.map((t) => t.id);

export const TEXTOS_AVISOS_EH = {
  titulo: '🔔 Avisos de Estilo de hombre',
  // La regla principal, dicha en la propia pantalla.
  todoApagado: 'Todo empieza apagado. Solo te avisamos de lo que enciendas tú.',
  // Apartados 1, 7 y 11 — y de quién es lo demás.
  delSistemaGlobal: 'El interruptor general y el horario de silencio son los de JosStyle: aquí solo eliges de qué te avisamos.',
  // Apartado 6.
  silenciar: '🔕 No recibir avisos',
  silenciarNoApaga: 'Silenciar un apartado no lo desactiva: sigue funcionando igual.',
  // Apartado 12.
  desactivarTodo: '🔕 Desactivar notificaciones de Estilo',
  desactivarNoBorra: 'Todo queda en silencio. Tus datos y tu configuración no se tocan.',
  // Apartado 13 — y la verdad sobre el historial.
  sinHistorial: 'JosStyle todavía no guarda un historial de avisos, así que aquí tampoco: solo se evita repetir el mismo aviso el mismo día.',
  // Apartado 4.
  crear: '🔔 Recordarme',
  sinRecordatorios: 'Todavía no has creado ningún recordatorio.',
  // Apartado 3.
  nadaSinPermiso: 'Nunca te avisamos de algo que no hayas encendido.',
};

/* ===========================================================================
   2 · LA REPETICIÓN (apartado 5)
   ===========================================================================
   *"Una vez · Diariamente · Semanalmente · Personalizado."*

   ⚠️ **Una recurrencia guarda su REGLA, nunca sus fechas** (regla 11 del
   proyecto y EH F8). "Personalizado" son días concretos de la semana. */

export const REPETICIONES = [
  { id: 'una_vez', nombre: 'Una vez', cada: null },
  { id: 'diaria', nombre: 'Diariamente', cada: 1 },
  { id: 'semanal', nombre: 'Semanalmente', cada: 7 },
  { id: 'personalizado', nombre: 'Personalizado', cada: null, pideDias: true },
];

export const repeticion = (id) => REPETICIONES.find((r) => r.id === id) || null;

const DIAS_SEMANA = [0, 1, 2, 3, 4, 5, 6];

/** ¿Toca este recordatorio en esta fecha? ⚠️ Se calcula; no se materializa. */
export function tocaRecordatorio(r, fecha) {
  if (!r || typeof r.fecha !== 'string' || fecha < r.fecha) return false;
  if (r.repeticion === 'una_vez') return fecha === r.fecha;
  if (r.repeticion === 'diaria') return true;
  if (r.repeticion === 'semanal') {
    const dias = Math.round((new Date(`${fecha}T00:00:00`) - new Date(`${r.fecha}T00:00:00`)) / 86400000);
    return dias % 7 === 0;
  }
  if (r.repeticion === 'personalizado') {
    return r.dias.includes(new Date(`${fecha}T00:00:00`).getDay());
  }
  return false;
}

/* ===========================================================================
   3 · EL ALMACÉN (apartados 6, 11 y 12)
   ===========================================================================
   ⚠️ **Ni un aviso enviado guardado** (decisión 5): el antirrepetición es de
   `notificarSiCorresponde`, que ya lo hace por día. Lo que se guarda es qué ha
   encendido él, qué ha silenciado y sus recordatorios. */

export const DEFAULT_AVISOS_EH = {
  // Apartado 12 — el interruptor de todo Estilo de hombre.
  activados: true,
  // Apartado 2 — y qué tipos, uno a uno. ⚠️ Vacío: todo empieza apagado.
  tipos: {},
  // Apartado 6 — módulos silenciados, sin desactivarlos.
  silenciados: [],
  // Apartado 4 — los que él crea.
  recordatorios: [],
};

const horaOk = (v) => (typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : null);
const fechaOk = (v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

export function normalizarRecordatorio(g) {
  const r = g || {};
  const fecha = fechaOk(r.fecha);
  if (!fecha) return null;
  const rep = repeticion(r.repeticion) ? r.repeticion : 'una_vez';
  return {
    id: r.id || uid(),
    texto: String(r.texto || '').trim().slice(0, 120),
    fecha,
    // ⚠️ `'25:99'` encaja con /^\d{2}:\d{2}$/: la forma no basta (EH F11).
    hora: horaOk(r.hora) || '09:00',
    repeticion: rep,
    dias: rep === 'personalizado'
      ? [...new Set((Array.isArray(r.dias) ? r.dias : []).map(Number).filter((d) => DIAS_SEMANA.includes(d)))].sort()
      : [],
    // ⚠️ A qué módulo lleva al tocarlo (apartado 14). `null` es la portada.
    modulo: IDS_EH.includes(r.modulo) ? r.modulo : null,
  };
}

export function normalizarAvisosEH(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  const tipos = {};
  const gt = g.tipos && typeof g.tipos === 'object' ? g.tipos : {};
  IDS_TIPOS_EH.forEach((id) => {
    // ⚠️ Sin decir nada, APAGADO: es la regla principal de la fase.
    if (typeof gt[id] === 'boolean') tipos[id] = gt[id];
  });
  return {
    activados: typeof g.activados === 'boolean' ? g.activados : true,
    tipos,
    silenciados: (Array.isArray(g.silenciados) ? g.silenciados : []).filter((id) => IDS_EH.includes(id)),
    recordatorios: (Array.isArray(g.recordatorios) ? g.recordatorios : [])
      .map(normalizarRecordatorio).filter(Boolean),
  };
}

export const datosAvisosEH = (estado) => {
  const e = normalizarEstiloHombre(estado);
  return normalizarAvisosEH(e.modulos.find((m) => m.id === MODULO_ANFITRION)?.config?.avisos);
};

const escribir = (estado, datos) => guardarConfig(estado, MODULO_ANFITRION, { avisos: datos });

/** ⚠️ Un tipo sin decir nada está APAGADO. Nunca al revés. */
export const tipoActivo = (estado, id) => datosAvisosEH(estado).tipos[id] === true;

export function alternarTipo(estado, id) {
  if (!tipoAvisoEH(id)) return normalizarEstiloHombre(estado);
  const d = datosAvisosEH(estado);
  return escribir(estado, { ...d, tipos: { ...d.tipos, [id]: !d.tipos[id] } });
}

/* ── Apartado 6 — silenciar un módulo, SIN desactivarlo ──────────────────── */

export const estaSilenciado = (estado, moduloId) => datosAvisosEH(estado).silenciados.includes(moduloId);

export function alternarSilencio(estado, moduloId) {
  if (!IDS_EH.includes(moduloId)) return normalizarEstiloHombre(estado);
  const d = datosAvisosEH(estado);
  const silenciados = d.silenciados.includes(moduloId)
    ? d.silenciados.filter((x) => x !== moduloId)
    : IDS_EH.filter((x) => d.silenciados.includes(x) || x === moduloId);
  return escribir(estado, { ...d, silenciados });
}

/* ── Apartado 12 — desactivar todo Estilo de hombre ──────────────────────── */

export const avisosActivados = (estado) => datosAvisosEH(estado).activados === true;

export const desactivarAvisosEH = (estado) => escribir(estado, { ...datosAvisosEH(estado), activados: false });
export const activarAvisosEH = (estado) => escribir(estado, { ...datosAvisosEH(estado), activados: true });

/* ===========================================================================
   4 · LOS RECORDATORIOS (apartados 4 y 5)
   ===========================================================================
   *"Desde cualquier módulo: 🔔 Recordarme. Elegir fecha, hora, repetición y
   texto."* */

export function crearRecordatorio(estado, datos) {
  const e = normalizarEstiloHombre(estado);
  const r = normalizarRecordatorio({ ...datos, id: uid() });
  if (!r) return { estado: e, error: 'Un recordatorio necesita una fecha.', recordatorio: null };
  if (!r.texto) return { estado: e, error: 'Un recordatorio necesita un texto.', recordatorio: null };
  if (r.repeticion === 'personalizado' && r.dias.length === 0) {
    return { estado: e, error: 'Elige los días en los que quieres que se repita.', recordatorio: null };
  }
  const d = datosAvisosEH(e);
  return {
    estado: escribir(e, { ...d, recordatorios: [...d.recordatorios, r] }),
    error: null,
    recordatorio: r,
  };
}

export function borrarRecordatorio(estado, id) {
  const d = datosAvisosEH(estado);
  return escribir(estado, { ...d, recordatorios: d.recordatorios.filter((r) => r.id !== id) });
}

export const recordatoriosDe = (estado) => datosAvisosEH(estado).recordatorios;

/* ===========================================================================
   5 · QUÉ HAY QUE AVISAR HOY (apartados 2, 3 y 14)
   ===========================================================================
   ⚠️ **No escribe nada y no manda nada**: devuelve candidatos. Quien los manda
   es `notificaciones.js`, y solo si el interruptor global, la categoría, el
   permiso del navegador y el horario de descanso lo permiten (Fase A4). */

const minutos = (hhmm) => {
  const [h, m] = String(hhmm || '09:00').split(':').map(Number);
  return h * 60 + m;
};

export function avisosDeEstilo(estado, {
  armario = null, datosGlobales = {}, objetivos = null, hoy = todayISO(),
} = {}) {
  const e = normalizarEstiloHombre(estado);
  const d = datosAvisosEH(e);
  // Apartado 12 — apagado del todo, no hay nada que decidir.
  if (!d.activados) return [];

  const candidatos = [];
  const puede = (tipo) => {
    const t = tipoAvisoEH(tipo);
    if (!t) return false;
    // ⚠️ Regla principal: apagado por defecto.
    if (d.tipos[tipo] !== true) return false;
    // Apartado 6 — silenciado, sin desactivar el módulo.
    if (d.silenciados.includes(t.modulo)) return false;
    // ⚠️ Y un módulo desactivado no avisa: dejó de funcionar (F36, apartado 4).
    if (IDS_EH.includes(t.modulo) && estadoDe(e, t.modulo) === 'desactivado') return false;
    return true;
  };
  const anadir = (tipo, titulo, cuerpo, { modulo = null, zona = null, hora = '09:00' } = {}) => {
    const t = tipoAvisoEH(tipo);
    candidatos.push({
      clave: `${hoy}|${tipo}`,
      tipo,
      categoria: t.categoria,
      prioridad: t.prioridad,
      icono: t.icono,
      titulo,
      cuerpo,
      cuando: minutos(hora),
      // Apartado 14 — *"al tocar: abrir directamente la rutina"*.
      destino: { modulo: modulo || t.modulo, zona },
      fecha: hoy,
    });
  };

  if (puede('rutina_piel')) {
    const r = resumenRutinasPiel(e, { hoy });
    if (r.hoy > 0 && r.hechasHoy < r.hoy) {
      anadir('rutina_piel', 'Rutina de cuidado', `Te queda ${r.hoy - r.hechasHoy} de ${r.hoy} para hoy.`, { zona: 'rutina' });
    }
  }
  if (puede('rutina_pelo')) {
    const r = resumenPelo(e, { hoy });
    if (r.hoy > 0 && r.hechasHoy < r.hoy) {
      anadir('rutina_pelo', 'Rutina de pelo', `Te queda ${r.hoy - r.hechasHoy} de ${r.hoy} para hoy.`, { zona: 'rutina' });
    }
  }
  if (puede('afeitado')) {
    const f = frecuenciaDeAfeitado(e, datosGlobales);
    const ultimo = datosRutinasBarba(e).registros[0];
    /* ⚠️ Solo si ÉL dijo cada cuánto y hay un registro con el que contar. Sin
       eso no se avisa: sería el *"hace 7 días que no te afeitas"* del apartado
       3, dicho a alguien que nunca lo configuró. */
    if (f.hay && Number.isInteger(f.dias) && f.dias > 0 && ultimo) {
      const pasados = Math.round((new Date(`${hoy}T00:00:00`) - new Date(`${ultimo.fecha}T00:00:00`)) / 86400000);
      if (pasados >= f.dias) {
        anadir('afeitado', 'Afeitado', `Dijiste que cada ${f.dias} días, y han pasado ${pasados}.`, { zona: 'rutinas' });
      }
    }
  }
  if (puede('perfume_rotacion')) {
    const p = datosPerfumes(e);
    const usadoHoy = p.historial.some((h) => h.fecha === hoy);
    if (p.perfumes.length >= 2 && !usadoHoy) {
      anadir('perfume_rotacion', 'Perfume', `Tienes ${p.perfumes.length} para elegir hoy.`);
    }
  }
  if (puede('ideas')) {
    const r = recomendarIdeas(e, { armario, datosGlobales, objetivos, hoy });
    if (!r.apagada && r.total > 0) {
      anadir('ideas', 'Ideas para ti', `${r.total} ${r.total === 1 ? 'idea nueva' : 'ideas nuevas'}.`);
    }
  }
  if (puede('recordatorio')) {
    d.recordatorios.filter((r) => tocaRecordatorio(r, hoy)).forEach((r) => {
      candidatos.push({
        clave: `${hoy}|recordatorio|${r.id}`,
        tipo: 'recordatorio',
        categoria: tipoAvisoEH('recordatorio').categoria,
        prioridad: tipoAvisoEH('recordatorio').prioridad,
        icono: '🔔',
        titulo: r.texto,
        cuerpo: '',
        cuando: minutos(r.hora),
        destino: { modulo: r.modulo, zona: null },
        fecha: hoy,
      });
    });
  }

  return candidatos;
}

/* ===========================================================================
   6 · AGRUPAR (apartados 8 y 9)
   ===========================================================================
   *"Hoy tienes 2 cosas relacionadas con Estilo."* En vez de tres avisos
   seguidos.

   ⚠️ **El mecanismo es el mismo que `agrupar()` de HT F10; la frase es de ESTE
   enunciado.** Las etiquetas son de cada módulo, el comportamiento del mismo
   sitio — la lección de la F33, dicha otra vez. */

export const MAXIMO_SUELTOS_EH = 1;

export function agruparAvisosEH(avisos) {
  const lista = [...(avisos || [])].sort((a, b) =>
    prioridadAviso(b.prioridad).peso - prioridadAviso(a.prioridad).peso || a.cuando - b.cuando);
  if (lista.length <= MAXIMO_SUELTOS_EH) return lista;
  const principal = lista[0];
  return [{
    ...principal,
    clave: `${principal.fecha}|estilo|resumen`,
    agrupado: true,
    // ⚠️ La frase literal del apartado 9.
    titulo: `Hoy tienes ${lista.length} cosas relacionadas con Estilo`,
    cuerpo: lista.slice(0, 3).map((x) => x.titulo).join(' · '),
    // Un resumen lleva a la portada: no puede abrir tres sitios a la vez.
    destino: { modulo: null, zona: null },
    incluye: lista.map((x) => x.clave),
  }];
}

/* ===========================================================================
   7 · RESUMEN, AUDITORÍA, TEXTOS Y PANEL
   =========================================================================== */

export function resumenAvisosEH(estado, opciones = {}) {
  const d = datosAvisosEH(estado);
  const candidatos = avisosDeEstilo(estado, opciones);
  return {
    activados: d.activados,
    encendidos: IDS_TIPOS_EH.filter((id) => d.tipos[id] === true).length,
    total: IDS_TIPOS_EH.length,
    silenciados: d.silenciados.length,
    recordatorios: d.recordatorios.length,
    // ⚠️ Apagado devuelve `null`, no 0 (lección de la F25).
    hoy: d.activados ? candidatos.length : null,
    agrupados: agruparAvisosEH(candidatos).length,
  };
}

export function auditarAvisosEH() {
  return {
    // Apartado 1 — sistemas de notificación nuevos. Cero: el de la Fase A4.
    sistemasDeNotificacion: 0,
    // Apartado 7 — horarios de silencio nuevos. Cero: el global.
    horariosDeSilencio: 0,
    // Apartado 11 — interruptores globales nuevos. Cero.
    interruptoresGlobales: 0,
    // Apartado 13 — historiales paralelos. Cero.
    historialesPropios: 0,
    // Regla principal — tipos encendidos de fábrica. NINGUNO.
    encendidosPorDefecto: TIPOS_AVISO_EH.filter((t) => t.porDefecto).length,
    // Apartado 10 — recomendaciones que notifican solas. Ninguna.
    recomendacionesAutomaticas: 0,
    tipos: TIPOS_AVISO_EH.length,
    repeticiones: REPETICIONES.length,
    datosGuardados: Object.keys(DEFAULT_AVISOS_EH),
  };
}

export function textosDeAvisosEH() {
  return [
    ...Object.values(TEXTOS_AVISOS_EH),
    ...TIPOS_AVISO_EH.map((t) => t.nombre),
    ...REPETICIONES.map((r) => r.nombre),
  ];
}

export function panelAvisosEH(estado, opciones = {}) {
  const e = normalizarEstiloHombre(estado);
  const d = datosAvisosEH(e);
  const candidatos = avisosDeEstilo(e, opciones);
  return {
    titulo: TEXTOS_AVISOS_EH.titulo,
    activados: d.activados,
    // Apartado 11 — la lista con su marca.
    tipos: TIPOS_AVISO_EH.map((t) => ({
      ...t,
      puesto: d.tipos[t.id] === true,
      moduloNombre: moduloEH(t.modulo)?.nombre || '',
      silenciado: d.silenciados.includes(t.modulo),
    })),
    // Apartado 6.
    silenciados: d.silenciados.map((id) => moduloEH(id)).filter(Boolean),
    // Apartado 4.
    recordatorios: d.recordatorios,
    repeticiones: REPETICIONES,
    // Apartados 8 y 9 — lo que se mandaría hoy, ya agrupado.
    hoy: agruparAvisosEH(candidatos),
    sueltos: candidatos.length,
    // Lo que esta pantalla se obliga a decir.
    todoApagado: TEXTOS_AVISOS_EH.todoApagado,
    delSistemaGlobal: TEXTOS_AVISOS_EH.delSistemaGlobal,
    silenciarNoApaga: TEXTOS_AVISOS_EH.silenciarNoApaga,
    desactivarNoBorra: TEXTOS_AVISOS_EH.desactivarNoBorra,
    sinHistorial: TEXTOS_AVISOS_EH.sinHistorial,
    resumen: resumenAvisosEH(e, opciones),
  };
}

export { PRIORIDADES_AVISO, MOTIVOS_RECHAZO };
