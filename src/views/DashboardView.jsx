import React, { useEffect } from 'react';
import { Heart, Flame, GraduationCap, Plane, Calendar, ChevronRight } from 'lucide-react';
import { COLORS, MODOS_APP } from '../tokens';
import { calcularDuracion, hexToRgba, diasHasta, formatFecha, todayISO, addDays } from '../lib/helpers';
import { resumenDelDia } from '../lib/calendario';
import { Card, AIPanel, ScoreGauge } from '../components/ui';
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

// Fase 1 del Calendario Universal — acceso secundario discreto desde "Hoy" (spec: "el calendario
// también debe poder tener accesos secundarios discretos desde otras zonas de la aplicación...
// pero nunca debe convertirse en un elemento invasivo"). Una sola línea, sin tarjeta grande: el
// resumen de hoy si hay algo, o una invitación breve si no — mismo criterio de honestidad que
// RecordatorioPareja, nunca inventa urgencia. Abre el Calendario vía `onAbrirCalendario` (App.jsx
// hace `setTab('calendario')`), sin duplicar aquí ninguna lógica de fechas propia.
function AccesoCalendario({ calendario, derivadosCalendario, accent, onAbrir }) {
  // Fase 2 — mismo criterio que CalendarView.jsx: unión de eventos propios + derivados de solo
  // lectura (Objetivos/Estudios/Entrenamiento/Productividad), calculada en cada render.
  const eventos = [...(calendario?.eventos || []), ...(derivadosCalendario || [])];
  const resumen = calendario ? resumenDelDia(eventos, todayISO()) : null;
  return (
    <button onClick={onAbrir} className="w-full text-left">
      <Card className="flex items-center gap-3" style={{ padding: '0.85rem 1.1rem' }}>
        <Calendar size={16} style={{ color: accent, flexShrink: 0 }} />
        <p className="text-sm flex-1" style={{ color: COLORS.text }}>
          {resumen ? <>Hoy: <span className="font-semibold">{resumen}</span></> : 'Sin nada en el calendario hoy'}
        </p>
        <ChevronRight size={15} style={{ color: COLORS.textMuted, flexShrink: 0 }} />
      </Card>
    </button>
  );
}

// Fase 20 — primera de 2-3 automatizaciones fijas del Prompt Maestro original (no un motor
// genérico "si X entonces Y" todavía, solo esta regla concreta): si dormiste menos de 7h,
// sugiere una sesión más suave hoy y adelantar la hora de dormir esta noche. Se calcula al
// vuelo a partir de datos que ya existen — no guarda nada nuevo.
function AvisoSuenoCorto({ ultimoSueno, accent, notificaciones }) {
  const horas = ultimoSueno ? calcularDuracion(ultimoSueno.horaDormir, ultimoSueno.horaDespertar) : null;
  const activo = !!ultimoSueno && horas < 7;
  useEffect(() => {
    if (!activo) return;
    notificarSiCorresponde(notificaciones, 'sueno', 'sueno-corto', 'Dormiste poco esta noche', `${horas} h — hoy quizá compense una sesión de entreno más suave.`);
  }, [activo]);
  if (!ultimoSueno) return null;
  if (horas >= 7) return null;
  return (
    <Card style={{ border: `1px solid ${hexToRgba(accent, 0.35)}`, background: hexToRgba(accent, 0.06) }}>
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
    <Card style={{ border: `1px solid ${hexToRgba(accent, 0.35)}`, background: hexToRgba(accent, 0.06) }}>
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
    <Card style={{ border: `1px solid ${hexToRgba(accent, 0.35)}`, background: hexToRgba(accent, 0.06) }}>
      <p className="text-sm flex items-center gap-2" style={{ color: COLORS.text }}>
        <GraduationCap size={15} style={{ color: accent, flexShrink: 0 }} />
        Examen{proximo.ex.tema ? ` de "${proximo.ex.tema}"` : ''} {proximo.dias === 0 ? 'hoy' : `en ${proximo.dias} días`} — todavía no has registrado horas de estudio de esa asignatura esta semana.
      </p>
    </Card>
  );
}

// Fase 20 — modos "viaje/vacaciones/exámenes": aviso discreto con 2-3 recordatorios de texto
// fijo (MODOS_APP en tokens.js) mientras el modo esté activo. Se activa/desactiva desde Ajustes
// → Personalización avanzada; nunca cambia nada más de la app por sí solo.
function ModoBanner({ modo, accent }) {
  const m = MODOS_APP.find((x) => x.id === modo);
  if (!m) return null;
  return (
    <Card style={{ border: `1px solid ${hexToRgba(accent, 0.3)}` }}>
      <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: accent }}>
        <Plane size={13} /> Modo {m.label} activo
      </p>
      <ul className="space-y-1">
        {m.tips.map((t, i) => (
          <li key={i} className="text-xs" style={{ color: COLORS.textMuted }}>· {t}</li>
        ))}
      </ul>
    </Card>
  );
}

export default function DashboardView({ perfil, sueno, calistenia, futbol, economia, relacion, favoritas, productividad, estudios, modo, notificaciones, calendario, derivadosCalendario, onAbrirCalendario, accent }) {
  const hora = new Date().getHours();
  const saludo = hora < 6 ? 'Buenas noches' : hora < 12 ? 'Buenos días' : hora < 20 ? 'Buenas tardes' : 'Buenas noches';
  const fechaHoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  const ultimoSueno = sueno[sueno.length - 1];
  const saldo = economia.saldoInicial + economia.movimientos.reduce((a, m) => a + (m.tipo === 'ingreso' ? m.cantidad : -m.cantidad), 0);
  const habilidadesActivas = Object.values(calistenia).filter((s) => s.nivel > 0).length;

  let score = 30;
  if (ultimoSueno) score += 25;
  if (habilidadesActivas > 0 || futbol.length > 0) score += 25;
  if (economia.movimientos.length > 0) score += 20;
  score = Math.min(100, score);

  return (
    <div className="space-y-4 pb-4">
      <div>
        <p className="text-sm capitalize" style={{ color: COLORS.textMuted }}>{fechaHoy}</p>
        <h1 className="text-2xl font-extrabold mt-0.5" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {saludo}, {perfil.nombre.split(' ')[0]}
        </h1>
      </div>

      <Card className="flex items-center gap-5" style={{ background: `radial-gradient(circle at 25% 20%, ${hexToRgba(accent, 0.16)}, ${COLORS.surface} 65%)` }}>
        <ScoreGauge value={score} accent={accent} />
        <div>
          <p className="text-3xl font-extrabold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
            {score}<span className="text-base font-medium" style={{ color: COLORS.textMuted }}>/100</span>
          </p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Puntuación de hoy — orientativa, mejora según registres más datos</p>
        </div>
      </Card>

      <ModoBanner modo={modo} accent={accent} />
      <AccesoCalendario calendario={calendario} derivadosCalendario={derivadosCalendario} accent={accent} onAbrir={onAbrirCalendario} />
      <RecordatorioPareja relacion={relacion} accent={accent} />
      <AvisoSuenoCorto ultimoSueno={ultimoSueno} accent={accent} notificaciones={notificaciones} />
      <AvisoRachaEnRiesgo productividad={productividad} accent={accent} notificaciones={notificaciones} />
      <AvisoExamenSinHoras estudios={estudios} accent={accent} notificaciones={notificaciones} />

      {favoritas && favoritas.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {favoritas.map((f) => (
            <Card key={f.id}>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>{f.label}</p>
              <p className="text-lg font-bold mt-1 truncate" style={{ color: COLORS.text }}>{f.valor}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>Sueño anoche</p>
          <p className="text-xl font-bold mt-1" style={{ color: COLORS.text }}>
            {ultimoSueno ? `${calcularDuracion(ultimoSueno.horaDormir, ultimoSueno.horaDespertar)} h` : '—'}
          </p>
        </Card>
        <Card>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>Saldo cuenta</p>
          <p className="text-xl font-bold mt-1" style={{ color: COLORS.text }}>{saldo.toFixed(2)} €</p>
        </Card>
      </div>

      <AIPanel
        label="Consejo del día"
        accent={accent}
        buildPrompt={() => `Datos de hoy de Josué — sueño: ${ultimoSueno ? `${calcularDuracion(ultimoSueno.horaDormir, ultimoSueno.horaDespertar)}h, calidad ${ultimoSueno.calidad}/5` : 'sin registrar'}; habilidades de calistenia con progreso: ${habilidadesActivas}; partidos de fútbol registrados: ${futbol.length}; movimientos económicos registrados: ${economia.movimientos.length}. Dame un consejo breve y accionable para hoy.`}
      />
    </div>
  );
}
