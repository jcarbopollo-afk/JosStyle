import React, { useState, useEffect } from 'react';
import {
  Heart, Flame, GraduationCap, Calendar, ChevronDown,
  Moon, Dumbbell, Target, Wallet, Apple, ListTodo, HeartPulse,
  BookOpen, Briefcase, Library, Church, Smartphone,
  Plane, Sun, Home, ClipboardList,
} from 'lucide-react';
import { COLORS, MODOS_APP } from '../tokens';
import { calcularDuracion, formatHoras, hexToRgba, diasHasta, formatFecha, todayISO, addDays } from '../lib/helpers';
import { resumenDelDia, eventosDelDia } from '../lib/calendario';
import { puntuacionDelDia, mensajePuntuacion } from '../lib/puntuacion';
import { Card, AIPanel, ScoreGauge, DashboardModuleCard, MiniAccessCard, QuickActionButton } from '../components/ui';
// Fase A4 — Notificaciones reales: los tres avisos automáticos de "Hoy" (Fase 20) son el primer
// caso de uso real de src/lib/notificaciones.js — si Josué activa el permiso del sistema y la
// categoría correspondiente en Ajustes, además de la tarjeta de dentro de la app llega una
// notificación real del navegador. `notificarSiCorresponde` ya comprueba todo lo demás
// (activación global, categoría, horario de descanso, no repetir el mismo aviso el mismo día).
import { notificarSiCorresponde } from '../lib/notificaciones';

// Fase 12 — Relación: recordatorio en pantalla principal de la próxima fecha importante.
// Se muestra directo, sin pedir el PIN otra vez — es solo la etiqueta y la cuenta atrás,
// igual de discreto que un recordatorio de calendario; el detalle completo (nombre, lista
// entera, alta/baja) sigue detrás del PinGate en la pestaña Relación.
function RecordatorioPareja({ relacion, accent }) {
  if (!relacion || relacion.fechas.length === 0) return null;
  const proxima = [...relacion.fechas].sort((a, b) => diasHasta(a.fecha) - diasHasta(b.fecha))[0];
  const dias = diasHasta(proxima.fecha);
  const cuando = dias === 0 ? 'hoy' : dias === 1 ? 'mañana' : `en ${dias} días`;
  return (
    <Card className="flex items-center gap-3" style={{ padding: '0.85rem 1.1rem' }}>
      <Heart size={16} style={{ color: accent, flexShrink: 0 }} fill={accent} />
      <p className="text-sm" style={{ color: COLORS.text }}>
        <span className="font-semibold">{proxima.etiqueta}</span> {cuando} <span style={{ color: COLORS.textMuted }}>({formatFecha(proxima.fecha)})</span>
      </p>
    </Card>
  );
}

// Ampliación del Dashboard — Acceso a Agenda: Calendario y Agenda pasan a ser dos accesos
// independientes desde "Hoy" (apartado 1/3/4 del paréntesis de la especificación — "Dashboard →
// Agenda", nunca "Dashboard → Calendario → Agenda" como sub-apartado). No se ha creado ningún
// módulo de datos ni pestaña nueva para Agenda: sigue siendo el mismo toggle Mes/Agenda que ya
// vive dentro de `CalendarView.jsx` desde la Fase 3 del Calendario Universal — lo que cambia es
// que ahora se puede llegar directamente a la vista Agenda de un solo toque desde "Hoy", vía el
// mismo mecanismo de `foco` ya usado por el resto del Dashboard (`{ vista: 'agenda' }`), sin
// tener que entrar primero al Calendario y tocar el interruptor a mano. Se muestran juntos, en
// dos mitades de una misma fila — mismo criterio de "acceso discreto, nunca invasivo" que ya
// tenía el antiguo `AccesoCalendario`, ahora repartido en dos en vez de uno solo, sin ocupar más
// alto que antes.
function AccesoCalendarioYAgenda({ calendario, derivadosCalendario, accent, onNavegar }) {
  // Fase 2 — mismo criterio que CalendarView.jsx: unión de eventos propios + derivados de solo
  // lectura (Objetivos/Estudios/Entrenamiento/Productividad), calculada en cada render. Mismo
  // límite ya aceptado desde entonces: no expande recurrencias aquí (cálculo barato de Dashboard,
  // igual que el resto de resúmenes de esta pantalla) — una serie recurrente cuenta en su fecha
  // ancla, no en cada ocurrencia futura; el propio Calendario/Agenda sí las expande de verdad.
  const eventos = [...(calendario?.eventos || []), ...(derivadosCalendario || [])];
  const resumenHoy = calendario ? resumenDelDia(eventos, todayISO()) : null;
  const pendientesHoy = eventosDelDia(eventos, todayISO()).length;
  const cardStyle = { background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: '0.75rem 0.9rem' };
  return (
    <div className="grid grid-cols-2 gap-2">
      <button onClick={() => onNavegar('calendario')} className="w-full text-left rounded-3xl transition-transform active:scale-[0.96]" style={cardStyle}>
        <p className="text-xs font-semibold flex items-center gap-1.5 mb-0.5" style={{ color: COLORS.textMuted }}>
          <Calendar size={13} style={{ color: accent, flexShrink: 0 }} /> Calendario
        </p>
        <p className="text-xs truncate" style={{ color: COLORS.text }}>{resumenHoy || 'Nada hoy'}</p>
      </button>
      <button onClick={() => onNavegar('calendario', { vista: 'agenda' })} className="w-full text-left rounded-3xl transition-transform active:scale-[0.96]" style={cardStyle}>
        <p className="text-xs font-semibold flex items-center gap-1.5 mb-0.5" style={{ color: COLORS.textMuted }}>
          <ClipboardList size={13} style={{ color: accent, flexShrink: 0 }} /> Agenda
        </p>
        <p className="text-xs truncate" style={{ color: COLORS.text }}>
          {pendientesHoy > 0 ? `${pendientesHoy} ${pendientesHoy === 1 ? 'cosa pendiente' : 'cosas pendientes'} hoy` : 'Nada pendiente hoy'}
        </p>
      </button>
    </div>
  );
}

// Fase 20 — primera de 2-3 automatizaciones fijas del Prompt Maestro original (no un motor
// genérico "si X entonces Y" todavía, solo esta regla concreta): si dormiste menos de 7h,
// sugiere una sesión más suave hoy y adelantar la hora de dormir esta noche. Se calcula al
// vuelo a partir de datos que ya existen — no guarda nada nuevo.
function AvisoSuenoCorto({ ultimoSueno, accent, notificaciones }) {
  const horas = ultimoSueno ? calcularDuracion(ultimoSueno.horaDormir, ultimoSueno.horaDespertar) : null;
  // `horas !== null` es imprescindible, no defensivo de más: en JavaScript `null < 7` es
  // `true`, así que un registro de sueño sin horas habría mostrado "Dormiste poco esta
  // noche · null h" y, peor, disparado una notificación real por un dato que no existe.
  const activo = horas !== null && horas < 7;
  useEffect(() => {
    if (!activo) return;
    notificarSiCorresponde(notificaciones, 'sueno', 'sueno-corto', 'Dormiste poco esta noche', `${horas} h — hoy quizá compense una sesión de entreno más suave.`);
  }, [activo]);
  if (!activo) return null;
  return (
    <Card style={{ padding: '0.85rem 1.1rem', border: `1px solid ${hexToRgba(accent, 0.35)}`, background: hexToRgba(accent, 0.06) }}>
      <p className="text-sm" style={{ color: COLORS.text }}>
        Anoche dormiste <span className="font-semibold">{horas} h</span> — hoy quizá compense una sesión de entreno más suave, y esta noche adelantar un poco la hora de dormir.
      </p>
    </Card>
  );
}

// Fase 20 — segunda automatización fija: si un hábito con racha en marcha (3+ días) no se ha
// marcado ni hoy ni ayer, un tercer día sin marcar la rompería a 1 (ver alternarHabitoHoy en
// ProductivityView.jsx) — aviso discreto para que le dé tiempo a decidir si la marca hoy.
// Calculado al vuelo sobre productividad.habitos, nada nuevo que guardar.
function AvisoRachaEnRiesgo({ productividad, accent, notificaciones }) {
  const hoy = todayISO();
  const ayer = addDays(hoy, -1);
  const enRiesgo = productividad
    ? productividad.habitos
        .filter((h) => (h.rachaActual || 0) >= 3 && !h.historial[hoy] && !h.historial[ayer])
        .sort((a, b) => (b.rachaActual || 0) - (a.rachaActual || 0))[0]
    : null;
  useEffect(() => {
    if (!enRiesgo) return;
    notificarSiCorresponde(notificaciones, 'productividad', `racha-riesgo-${enRiesgo.id || enRiesgo.nombre}`, 'Una racha está en riesgo', `"${enRiesgo.nombre}" (${enRiesgo.rachaActual} días) se rompe si no la marcas hoy.`);
  }, [enRiesgo && enRiesgo.id, enRiesgo && enRiesgo.nombre]);
  if (!productividad) return null;
  if (!enRiesgo) return null;
  return (
    <Card style={{ padding: '0.85rem 1.1rem', border: `1px solid ${hexToRgba(accent, 0.35)}`, background: hexToRgba(accent, 0.06) }}>
      <p className="text-sm flex items-center gap-2" style={{ color: COLORS.text }}>
        <Flame size={15} style={{ color: accent, flexShrink: 0 }} />
        Tu racha de <span className="font-semibold">"{enRiesgo.nombre}"</span> ({enRiesgo.rachaActual} días) se rompe si no la marcas hoy.
      </p>
    </Card>
  );
}

// Fase 20 — tercera automatización fija: examen dentro de los próximos 3 días sin ninguna hora
// de estudio registrada en los últimos 7 días para esa misma asignatura. Calculado al vuelo
// sobre estudios.examenes/horas, sin guardar nada nuevo — mismo criterio que AvisoSuenoCorto.
function AvisoExamenSinHoras({ estudios, accent, notificaciones }) {
  const cutoff7 = addDays(todayISO(), -7);
  const diasHastaFecha = (fechaISO) => Math.ceil((new Date(fechaISO + 'T00:00:00').getTime() - Date.now()) / 86400000);
  const proximo = estudios
    ? estudios.examenes
        .map((ex) => ({ ex, dias: diasHastaFecha(ex.fecha) }))
        .filter((x) => x.dias >= 0 && x.dias <= 3)
        .sort((a, b) => a.dias - b.dias)[0]
    : null;
  const horasRecientes = proximo
    ? estudios.horas
        .filter((h) => h.asignaturaId === proximo.ex.asignaturaId && h.fecha >= cutoff7)
        .reduce((s, h) => s + Number(h.horas || 0), 0)
    : 0;
  const activo = !!proximo && horasRecientes === 0;
  useEffect(() => {
    if (!activo) return;
    notificarSiCorresponde(notificaciones, 'estudios', `examen-sin-horas-${proximo.ex.id || proximo.ex.tema || proximo.ex.fecha}`, 'Examen próximo sin horas registradas', `Examen${proximo.ex.tema ? ` de "${proximo.ex.tema}"` : ''} ${proximo.dias === 0 ? 'hoy' : `en ${proximo.dias} días`} — no has registrado horas de estudio esta semana.`);
  }, [activo]);
  if (!estudios) return null;
  if (!proximo) return null;
  if (horasRecientes > 0) return null;
  return (
    <Card style={{ padding: '0.85rem 1.1rem', border: `1px solid ${hexToRgba(accent, 0.35)}`, background: hexToRgba(accent, 0.06) }}>
      <p className="text-sm flex items-center gap-2" style={{ color: COLORS.text }}>
        <GraduationCap size={15} style={{ color: accent, flexShrink: 0 }} />
        Examen{proximo.ex.tema ? ` de "${proximo.ex.tema}"` : ''} {proximo.dias === 0 ? 'hoy' : `en ${proximo.dias} días`} — todavía no has registrado horas de estudio de esa asignatura esta semana.
      </p>
    </Card>
  );
}

// Ajuste del indicador de contexto — Viaje/Vacaciones/Exámenes: antes `ModoBanner` mostraba
// siempre (cuando había un modo activo) un bloque de 2-4 líneas con todos los consejos a la vez,
// empujando el resto del Dashboard hacia abajo. Ahora es un indicador compacto tipo acordeón,
// cerrado por defecto (apartado 2: icono + estado + indicador de expansión, nada más) — igual de
// alto que cualquier otra fila compacta del Dashboard cuando está cerrado (apartado 6), y solo
// crece cuando el propio usuario lo pide (apartado 7). Mismo componente para los tres modos y
// para "Rutina normal" (apartado 5: el indicador está siempre visible, no solo cuando hay un modo
// especial activo — "Rutina normal" es un estado más, no la ausencia del componente).
const MODO_ICONOS = { viaje: Plane, vacaciones: Sun, examenes: GraduationCap };

function IndicadorContexto({ modo, accent }) {
  const [expandido, setExpandido] = useState(false);
  const activo = MODOS_APP.find((m) => m.id === modo);
  const Icono = activo ? (MODO_ICONOS[activo.id] || Plane) : Home;
  const etiqueta = activo ? activo.label : 'Rutina normal';
  const consejos = activo ? activo.tips : [];

  return (
    <button
      onClick={() => setExpandido((s) => !s)}
      className="w-full text-left rounded-3xl transition-transform active:scale-[0.98]"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: '0.8rem 1.1rem' }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold min-w-0" style={{ color: COLORS.text }}>
          <Icono size={16} style={{ color: accent, flexShrink: 0 }} />
          <span className="truncate">{etiqueta}</span>
        </span>
        {/* Apartado 9: la flecha rota al expandir/cerrar — mismo icono y misma transición que ya
            usan SkillCard/RutinaCard/AsignaturaCard/ExamenItem en el resto de la app, para que
            este indicador se sienta parte del mismo lenguaje visual, no un componente añadido
            después (apartado 11). */}
        <ChevronDown size={16} style={{ color: COLORS.textMuted, flexShrink: 0, transform: expandido ? 'rotate(180deg)' : 'none', transition: 'transform 220ms var(--ease-premium)' }} />
      </div>
      {/* Apartado 4: transición suave de altura + opacity, no un "aparece/desaparece" brusco —
          truco de `grid-template-rows` 0fr↔1fr, sin medir alturas a mano ni añadir dependencias. */}
      <div style={{ display: 'grid', gridTemplateRows: expandido ? '1fr' : '0fr', transition: 'grid-template-rows 300ms var(--ease-premium)' }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ opacity: expandido ? 1 : 0, transition: `opacity ${expandido ? '260ms 60ms' : '120ms'} ease`, paddingTop: '0.75rem' }}>
            {consejos.length > 0 ? (
              <ul className="space-y-1">
                {consejos.map((t, i) => (
                  <li key={i} className="text-xs leading-relaxed" style={{ color: COLORS.textMuted }}>· {t}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs" style={{ color: COLORS.textMuted }}>Sin modificaciones especiales.</p>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// Puntuación del día. Sustituye a la tarjeta anterior, que mostraba un número fijo sin relación
// con el día actual (ver src/lib/puntuacion.js). Tres diferencias que importan:
//
//   1. El número cambia cada día de verdad, y sale de áreas que Josué realmente usa.
//   2. Se puede desplegar para ver EXACTAMENTE de dónde sale — misma regla de honestidad que
//      rige los paneles de IA ("cita en qué dato te apoyas"). Un número sin explicación en la
//      pantalla principal es justo lo que este proyecto evita en todas partes.
//   3. Cuando todavía no hay datos no enseña un 0 desmotivador: lo dice y ya está.
//
// Sin puntos acumulables, sin niveles y sin premios: es una foto del día que se reinicia sola
// cada mañana y no se guarda en ningún sitio (reglas 33/34 — no sobregamificar).
function TarjetaPuntuacion({ puntuacion, mensaje, accent }) {
  const [expandido, setExpandido] = useState(false);
  const fondo = { background: `radial-gradient(circle at 25% 20%, ${hexToRgba(accent, 0.16)}, ${COLORS.surface} 65%)` };

  // Usuario sin datos todavía: una sola línea honesta, sin rueda ni cifra inventada.
  if (!puntuacion.hayDatos) {
    return (
      <Card style={fondo}>
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Tu día</p>
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{mensaje}</p>
      </Card>
    );
  }

  return (
    <Card style={{ ...fondo, padding: 0, overflow: 'hidden' }}>
      <button
        onClick={() => setExpandido((s) => !s)}
        className="w-full text-left transition-transform active:scale-[0.99]"
        style={{ padding: '1.1rem 1.25rem' }}
      >
        <div className="flex items-center gap-5">
          <ScoreGauge value={puntuacion.valor} accent={accent} />
          <div className="min-w-0 flex-1">
            <p className="text-3xl font-extrabold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
              {puntuacion.valor}<span className="text-base font-medium" style={{ color: COLORS.textMuted }}>/100</span>
            </p>
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{mensaje}</p>
            <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: COLORS.textMuted, opacity: 0.75 }}>
              {puntuacion.hechos} de {puntuacion.total} hoy
              <ChevronDown size={13} style={{ transform: expandido ? 'rotate(180deg)' : 'none', transition: 'transform 220ms var(--ease-premium)' }} />
            </p>
          </div>
        </div>
        {/* Mismo acordeón de `grid-template-rows` 0fr↔1fr que IndicadorContexto y el resto de
            tarjetas desplegables de la app — ni una técnica de animación nueva. */}
        <div style={{ display: 'grid', gridTemplateRows: expandido ? '1fr' : '0fr', transition: 'grid-template-rows 300ms var(--ease-premium)' }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ opacity: expandido ? 1 : 0, transition: `opacity ${expandido ? '260ms 60ms' : '120ms'} ease`, paddingTop: '0.9rem' }}>
              <ul className="space-y-1">
                {puntuacion.detalle.map((d) => (
                  <li key={d.id} className="text-xs flex items-center gap-2" style={{ color: d.hecho ? COLORS.text : COLORS.textMuted }}>
                    <span style={{ color: d.hecho ? COLORS.positive : COLORS.textMuted, flexShrink: 0 }}>{d.hecho ? '✓' : '·'}</span>
                    {d.etiqueta}
                  </li>
                ))}
              </ul>
              <p className="text-xs mt-2.5 leading-relaxed" style={{ color: COLORS.textMuted, opacity: 0.8 }}>
                Solo cuentan las áreas en las que ya registras cosas. Se reinicia cada día.
              </p>
            </div>
          </div>
        </div>
      </button>
    </Card>
  );
}

// Ampliación del Dashboard — Centro de Control: a qué módulo pertenece cada id de "métrica
// favorita" (Fase 19) — se usa solo para que las tarjetas de favoritas, que ya existían, también
// se puedan pulsar (apartado 3: "siempre que una tarjeta represente una funcionalidad existente,
// debe poder pulsarse") sin tener que rehacer esa fase entera.
const MODULO_DE_FAVORITA = {
  peso: 'salud', hucha: 'economia', racha_habito: 'productividad',
  proximo_objetivo: 'objetivos', animo_medio: 'diario', sesiones_concentracion: 'bienestar',
};

function ultimoPorFechaLocal(lista) {
  if (!lista || lista.length === 0) return null;
  return [...lista].sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0];
}

export default function DashboardView({
  perfil, sueno, calistenia, futbol, economia, relacion, favoritas, productividad, estudios, modo, notificaciones,
  calendario, derivadosCalendario,
  // Ampliación del Dashboard — Centro de Control
  salud, objetivos, nutricion, negocio, diario, biblioteca, fe, bienestar, resumenes, dashboardOcultos, onNavegar,
  accent,
}) {
  const hora = new Date().getHours();
  const saludo = hora < 6 ? 'Buenas noches' : hora < 12 ? 'Buenos días' : hora < 20 ? 'Buenas tardes' : 'Buenas noches';
  const fechaHoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  const ultimoSueno = sueno[sueno.length - 1];
  const habilidadesActivas = Object.values(calistenia).filter((s) => s.nivel > 0).length;

  // Puntuación del día — ver src/lib/puntuacion.js para el porqué del cambio. Resumido: la
  // fórmula anterior sumaba puntos por tener datos "alguna vez", así que se quedaba clavada en
  // 100 para siempre mientras la etiqueta seguía diciendo "de hoy". Ahora es el porcentaje de
  // las áreas que Josué realmente usa que ha registrado HOY, y viene con su desglose para poder
  // explicarlo en vez de mostrar un número a secas.
  const puntuacion = puntuacionDelDia(
    { sueno, calistenia, futbol, nutricion, productividad, diario, estudios, salud },
  );
  const mensajeScore = mensajePuntuacion(puntuacion);

  // Ampliación del Dashboard — Centro de Control: "arquitectura preparada para personalización"
  // (apartado 10/11) — cada módulo del Dashboard es una entrada de este mapa (id → si está
  // oculto), filtrable por `dashboardOcultos` (tokens.js, todavía sin editor real en Ajustes,
  // documentado como pendiente). `oculto(id)` es la única función que consulta esa lista —
  // activar un editor en el futuro es solo escribir la UI que rellene `dashboardOcultos`, sin
  // tocar nada de aquí abajo.
  const ocultos = dashboardOcultos || [];
  const oculto = (id) => ocultos.includes(id);

  // ---------- Nivel 1: lo que Josué necesita saber nada más abrir la app ----------
  // Objetivo más próximo sin cumplir (apartado 4/6/22: "Dashboard → Objetivo específico", no solo
  // al módulo) — mismo orden que ya usa ObjectivesView (orden de creación), no se inventa una
  // prioridad nueva.
  const objetivoDestacado = (objetivos?.lista || []).find((o) => !o.cumplido) || null;
  const totalObjetivos = objetivos?.lista?.length || 0;
  const objetivosCumplidos = objetivos?.lista?.filter((o) => o.cumplido).length || 0;

  // Examen más próximo (apartado 6: "Examen de Biología — 3 días → abrir directamente el examen").
  const examenDestacado = (estudios?.examenes || [])
    .map((ex) => ({ ex, dias: Math.ceil((new Date(`${ex.fecha}T00:00:00`).getTime() - Date.now()) / 86400000) }))
    .filter((x) => x.dias >= 0)
    .sort((a, b) => a.dias - b.dias)[0] || null;

  // Habilidad destacada de calistenia: la entrenada más recientemente; si ninguna tiene sesiones
  // todavía, la de mayor progreso (apartado 6: "Handstand — 72% → abrir directamente Handstand").
  const skillsConSesion = Object.entries(calistenia)
    .map(([skill, data]) => ({ skill, data, ultima: ultimoPorFechaLocal(data.sesiones) }))
    .filter((x) => x.ultima)
    .sort((a, b) => (a.ultima.fecha < b.ultima.fecha ? 1 : -1));
  const skillDestacada = skillsConSesion[0]
    || Object.entries(calistenia).map(([skill, data]) => ({ skill, data }))
      .filter((x) => x.data.nivel > 0)
      .sort((a, b) => b.data.nivel - a.data.nivel)[0]
    || null;

  // ---------- Nivel 2: relevante pero no crítico ----------
  // Tarea pendiente más próxima (apartado 6: "Trabajo de Biología pendiente → abrir esa tarea").
  const tareaDestacada = (productividad?.tareas || [])
    .filter((t) => !t.hecha)
    .sort((a, b) => (a.fechaLimite || '9999').localeCompare(b.fechaLimite || '9999'))[0] || null;

  // Salud: peso/IMC — misma fórmula exacta que ya usa SettingsView (categoría Perfil, "Cálculos
  // corporales"), con el peso más reciente de Salud si existe, o el del Perfil si todavía no hay
  // ninguna medida registrada.
  const ultimaMedida = ultimoPorFechaLocal(salud?.medidas);
  const pesoActual = ultimaMedida?.peso || perfil?.peso;
  const alturaM = (perfil?.altura || 0) / 100;
  const imc = pesoActual && alturaM ? pesoActual / (alturaM * alturaM) : null;

  const rEconomia = resumenes?.economia;
  const rNutricion = resumenes?.nutricion;

  return (
    <div className="space-y-4 pb-4">
      <div>
        <p className="text-sm capitalize" style={{ color: COLORS.textMuted }}>{fechaHoy}</p>
        <h1 className="text-2xl font-extrabold mt-0.5" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {saludo}, {perfil.nombre.split(' ')[0]}
        </h1>
      </div>

      {/* Ajuste del indicador de contexto — Viaje/Vacaciones/Exámenes/Rutina normal: cerrado por
          defecto, altura mínima y consistente con el resto de filas compactas del Dashboard
          (apartado 6) — vive fuera del grupo de avisos condicionales de abajo porque, a
          diferencia de ellos, está SIEMPRE visible (apartado 5: "Rutina normal" es un estado más,
          no la ausencia del componente). */}
      <IndicadorContexto modo={modo} accent={accent} />

      <TarjetaPuntuacion puntuacion={puntuacion} mensaje={mensajeScore} accent={accent} />

      {/* Optimización de navegación/scroll — este grupo de avisos (varios de ellos condicionales,
          nunca todos a la vez salvo mala suerte) va en su propio `space-y-2` más apretado que el
          resto de la pantalla (`space-y-4`), y cada tarjeta usa un padding más compacto — mismo
          contenido y mismas acciones, menos aire entre una y otra. */}
      <div className="space-y-2">
        <AccesoCalendarioYAgenda calendario={calendario} derivadosCalendario={derivadosCalendario} accent={accent} onNavegar={onNavegar} />
        <RecordatorioPareja relacion={relacion} accent={accent} />
        <AvisoSuenoCorto ultimoSueno={ultimoSueno} accent={accent} notificaciones={notificaciones} />
        <AvisoRachaEnRiesgo productividad={productividad} accent={accent} notificaciones={notificaciones} />
        <AvisoExamenSinHoras estudios={estudios} accent={accent} notificaciones={notificaciones} />
      </div>

      {/* Ampliación del Dashboard — Centro de Control (Nivel 1, apartado 9): sueño, entreno,
          objetivos y estudios — lo primero que Josué necesita ver, cada tarjeta pulsable y con
          deep-link al elemento concreto cuando lo hay (apartados 3-6). Rejilla de 2 columnas,
          nunca una tarjeta grande por fila (apartado 8: "no todo tiene que ser una tarjeta
          grande"). */}
      {(!oculto('sueno') || !oculto('entreno') || !oculto('objetivos') || !oculto('estudios')) && (
        <div className="grid grid-cols-2 gap-3">
          {!oculto('sueno') && (
            <DashboardModuleCard
              icon={Moon} accent={accent} titulo="Sueño"
              vacio={!ultimoSueno}
              valor={ultimoSueno ? `${formatHoras(calcularDuracion(ultimoSueno.horaDormir, ultimoSueno.horaDespertar))} h` : undefined}
              sub={ultimoSueno ? `Calidad ${ultimoSueno.calidad}/5` : 'Toca para registrar tu primera noche'}
              onClick={() => onNavegar('sueno')}
            />
          )}
          {!oculto('entreno') && (
            <DashboardModuleCard
              icon={Dumbbell} accent={accent} titulo="Entreno"
              vacio={!skillDestacada}
              valor={skillDestacada ? `${skillDestacada.skill}: ${skillDestacada.data.nivel}%` : undefined}
              sub={skillDestacada ? 'Toca para abrir esta habilidad' : 'Toca para empezar a registrar'}
              onClick={() => onNavegar('entreno', skillDestacada ? { skill: skillDestacada.skill } : undefined)}
            />
          )}
          {!oculto('objetivos') && (
            <DashboardModuleCard
              icon={Target} accent={accent} titulo="Objetivos"
              vacio={!objetivoDestacado}
              valor={objetivoDestacado ? objetivoDestacado.texto : undefined}
              sub={objetivoDestacado
                ? `${objetivoDestacado.plazo}${totalObjetivos ? ` · ${Math.round((objetivosCumplidos / totalObjetivos) * 100)}% completado` : ''}`
                : 'Toca para crear tu primer objetivo'}
              onClick={() => onNavegar('objetivos', objetivoDestacado ? { id: objetivoDestacado.id } : undefined)}
            />
          )}
          {!oculto('estudios') && (
            <DashboardModuleCard
              icon={GraduationCap} accent={accent} titulo="Estudios"
              vacio={!examenDestacado}
              valor={examenDestacado ? (examenDestacado.ex.tema || 'Examen') : undefined}
              sub={examenDestacado
                ? (examenDestacado.dias === 0 ? 'Hoy' : `En ${examenDestacado.dias} ${examenDestacado.dias === 1 ? 'día' : 'días'}`)
                : 'Sin exámenes próximos'}
              onClick={() => onNavegar('estudios', examenDestacado ? { examenId: examenDestacado.ex.id } : undefined)}
            />
          )}
        </div>
      )}

      {/* Optimización de navegación/scroll — las métricas favoritas (Fase 19, hasta 4) ahora
          también son pulsables (apartado 3), cada una lleva a su módulo de origen. */}
      {favoritas && favoritas.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {favoritas.map((f) => (
            <button
              key={f.id}
              onClick={() => onNavegar(MODULO_DE_FAVORITA[f.id] || 'hoy')}
              className="w-full text-left rounded-3xl p-5 transition-transform active:scale-[0.96]"
              style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
            >
              <p className="text-xs" style={{ color: COLORS.textMuted }}>{f.label}</p>
              <p className="text-lg font-bold mt-1 truncate" style={{ color: COLORS.text }}>{f.valor}</p>
            </button>
          ))}
        </div>
      )}

      {/* Ampliación del Dashboard — Centro de Control (Nivel 2, apartado 9): relevante pero no
          crítico — Economía y Nutrición reutilizan el mismo resumen ya calculado para los hubs
          (resumenesHub.js), sin duplicar ese cálculo; Productividad y Salud llevan su propio
          deep-link (tarea concreta / peso e IMC). */}
      {(!oculto('economia') || !oculto('nutricion') || !oculto('productividad') || !oculto('salud')) && (
        <div className="grid grid-cols-2 gap-3">
          {!oculto('economia') && rEconomia && (
            <DashboardModuleCard
              icon={Wallet} accent={accent} titulo="Economía"
              vacio={rEconomia.estado === 'vacio'}
              valor={rEconomia.linea1} sub={rEconomia.linea2}
              onClick={() => onNavegar('economia')}
            />
          )}
          {!oculto('nutricion') && rNutricion && (
            <DashboardModuleCard
              icon={Apple} accent={accent} titulo="Nutrición"
              vacio={rNutricion.estado === 'vacio'}
              valor={rNutricion.linea1} sub={rNutricion.linea2}
              onClick={() => onNavegar('nutricion')}
            />
          )}
          {!oculto('productividad') && (
            <DashboardModuleCard
              icon={ListTodo} accent={accent} titulo="Productividad"
              vacio={!tareaDestacada}
              valor={tareaDestacada ? tareaDestacada.texto : undefined}
              sub={tareaDestacada
                ? (tareaDestacada.fechaLimite ? `Antes del ${tareaDestacada.fechaLimite.split('-').reverse().join('/')}` : 'Sin fecha límite')
                : 'Sin tareas pendientes'}
              onClick={() => onNavegar('productividad', tareaDestacada ? { sub: 'tareas', tareaId: tareaDestacada.id } : { sub: 'tareas' })}
            />
          )}
          {!oculto('salud') && (
            <DashboardModuleCard
              icon={HeartPulse} accent={accent} titulo="Salud"
              vacio={!pesoActual}
              valor={pesoActual ? `${pesoActual} kg` : undefined}
              sub={imc ? `IMC ${imc.toFixed(1)}` : 'Toca para registrar una medida'}
              onClick={() => onNavegar('salud')}
            />
          )}
        </div>
      )}

      {/* Ampliación del Dashboard — Centro de Control (Nivel 3, apartado 9): accesos discretos a
          módulos secundarios — solo icono + etiqueta, sin resumen (Relación incluida a propósito:
          es solo el acceso, nunca sus datos, que siguen detrás del PinGate de siempre). */}
      <div className="grid grid-cols-3 gap-2.5">
        {!oculto('diario') && <MiniAccessCard icon={BookOpen} label="Diario" accent={accent} onClick={() => onNavegar('diario')} />}
        {!oculto('negocio') && <MiniAccessCard icon={Briefcase} label="Negocio" accent={accent} onClick={() => onNavegar('negocio')} />}
        {!oculto('relacion') && <MiniAccessCard icon={Heart} label="Relación" accent={accent} onClick={() => onNavegar('relacion')} />}
        {!oculto('biblioteca') && <MiniAccessCard icon={Library} label="Biblioteca" accent={accent} onClick={() => onNavegar('biblioteca')} />}
        {!oculto('fe') && <MiniAccessCard icon={Church} label="Fe" accent={accent} onClick={() => onNavegar('fe')} />}
        {!oculto('bienestar') && <MiniAccessCard icon={Smartphone} label="Bienestar" accent={accent} onClick={() => onNavegar('bienestar')} />}
      </div>

      {/* Ampliación del Dashboard — Centro de Control, apartado 13/14: "Acciones rápidas" —
          distinta a propósito de pulsar una tarjeta (esto abre un formulario, no navega a mirar un
          resumen), en su propia fila con scroll horizontal si hiciera falta en un móvil pequeño. */}
      <div>
        <p className="text-xs font-semibold mb-2 px-1" style={{ color: COLORS.textMuted }}>Acciones rápidas</p>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <QuickActionButton icon={Moon} label="Sueño" accent={accent} onClick={() => onNavegar('sueno', { accion: 'registrar' })} />
          <QuickActionButton icon={Wallet} label="Gasto" accent={accent} onClick={() => onNavegar('economia', { accion: 'nuevoMovimiento' })} />
          <QuickActionButton icon={ListTodo} label="Tarea" accent={accent} onClick={() => onNavegar('productividad', { sub: 'tareas', accion: 'nueva' })} />
          <QuickActionButton icon={Target} label="Objetivo" accent={accent} onClick={() => onNavegar('objetivos', { accion: 'nuevo' })} />
        </div>
      </div>

      <AIPanel
        label="Consejo del día"
        accent={accent}
        buildPrompt={() => `Datos de hoy de Josué — sueño: ${ultimoSueno ? `${formatHoras(calcularDuracion(ultimoSueno.horaDormir, ultimoSueno.horaDespertar))}h, calidad ${ultimoSueno.calidad}/5` : 'sin registrar'}; habilidades de calistenia con progreso: ${habilidadesActivas}; partidos de fútbol registrados: ${futbol.length}; movimientos económicos registrados: ${economia.movimientos.length}. Dame un consejo breve y accionable para hoy.`}
      />
    </div>
  );
}
