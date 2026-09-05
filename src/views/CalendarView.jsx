import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft, ChevronRight, Plus, X, Trash2, Clock, MapPin, Lock, ExternalLink, Search,
  Target, Flame, Repeat, GraduationCap, Dumbbell, Star, Bell, Circle, CalendarOff,
  CheckSquare, Square, MoreHorizontal,
} from 'lucide-react';
import { COLORS, TIPOS_EVENTO_CALENDARIO, colorDeTipoEvento, FRECUENCIAS_RECURRENCIA } from '../tokens';
import { uid, todayISO, addDays, hexToRgba } from '../lib/helpers';
import { celdasMes, eventosDelDia, resumenDelDia, eventosFuturos, expandirRecurrentes, isoDeFecha, diasDelMes, intervaloDe, describirRecurrencia, saltarOcurrencia } from '../lib/calendario';
import { NOMBRES_ORIGEN } from '../lib/calendarioIntegracion';
// Entrega 3 · F7 (HC F2) — el día entero, armado desde las fuentes de siempre.
import {
  agendaDelDia, tituloDelDia, tiraDeDias, diaAnterior, diaSiguiente,
  VACIO_AGENDA, tipoAgenda,
} from '../lib/agendaDia';
// Entrega 3 · F8 (HC F3) — las tareas con fecha entran en el Calendario, y el ＋ crea las tres cosas.
import {
  sePuedeCrear, nuevaTareaDeCalendario, tareasDelDia, indicadoresDelDia,
  resumenDeDia, cargaDelDia, marcaDeHoy, VACIO_MES, mesVacio, accesosDelDia,
} from '../lib/calendarioMes';
import { Card, SectionTitle, Field, TextInput, Select, Textarea, PrimaryButton, GhostBtn, ToggleTab, EmptyHint } from '../components/ui';
// Entrega 3 · F9 (HC F4) — el ＋ y sus formularios, compartidos con Hoy y la Agenda.
import { QuickAdd, FormularioTarea, FormularioEvento, MenuElemento, CambiarFecha, CambiarHora, BotonAnadir, AvisoAccion } from '../components/quickAdd';
import { tareaEnFecha, tareaEnHora } from '../lib/accionesHoyAgenda';
// Entrega 3 · F10 (HC F5) — la semana, y las tareas que se repiten.
import { semanaDe, semanaAnterior, semanaSiguiente, TEXTO_DIA_LIBRE, marcarInstancia, seRepite } from '../lib/semana';
// Entrega 3 · F11 (HC F6) — el aviso de un evento: dos campos, no una entidad nueva.
import { ANTICIPACIONES, estadoPermiso, avisoPorDefecto } from '../lib/avisosPlanificacion';
// Entrega 3 · F13 (HC F8) — estadísticas de planificación, contadas en el momento.
import {
  PERIODOS, PERIODO_POR_DEFECTO, TEXTO_SIN_DATOS, resumenPlanificacion, grafico,
  cumplimientoPorDia, cargaPorDiaSemana, diasMasCargados, distribucionPorTipo,
  distribucionHoraria, horasPlanificadas, tareasAtrasadas, resumenRecurrentes,
  comparar, tendencia, NO_MEDIBLE_TODAVIA,
} from '../lib/estadisticasPlan';

// Un icono por tipo (solo para el resumen del día/agenda y el editor — la cuadrícula mensual usa
// puntos compactos de color, nunca iconos, spec apartado 4: "no llenar las celdas con textos largos").
const ICONOS_TIPO = {
  objetivo: Target, habito: Flame, rutina: Repeat, estudio: GraduationCap,
  entrenamiento: Dumbbell, fecha_importante: Star, recordatorio: Bell, personal: Circle,
};

const FRECUENCIA_LABEL = Object.fromEntries(FRECUENCIAS_RECURRENCIA.map((f) => [f.value, f.label.toLowerCase()]));

function capitalizar(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function tituloMes(anio, mes) {
  return capitalizar(new Date(anio, mes, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }));
}

function etiquetaDiaCorta(fechaISO) {
  const d = new Date(`${fechaISO}T00:00:00`);
  const dia = d.getDate();
  const mes = d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').toUpperCase();
  return `${dia} ${mes}`;
}

function etiquetaDiaLarga(fechaISO) {
  if (fechaISO === todayISO()) return 'Hoy';
  return capitalizar(new Date(`${fechaISO}T00:00:00`).toLocaleDateString('es-ES', { weekday: 'long' }));
}

// Fase 2/3 — etiqueta de cada fila del panel "Próximamente" y de las cabeceras de la Agenda
// (spec: "Hoy / Mañana / Miércoles...").
function etiquetaProximo(fechaISO) {
  const hoy = todayISO();
  if (fechaISO === hoy) return 'Hoy';
  if (fechaISO === addDays(hoy, 1)) return 'Mañana';
  return capitalizar(
    new Date(`${fechaISO}T00:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }).replace('.', '')
  );
}

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function TipoIcono({ tipoId, accent, size = 14 }) {
  const Icon = ICONOS_TIPO[tipoId] || Circle;
  const color = colorDeTipoEvento(tipoId, accent);
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{ width: size + 16, height: size + 16, background: hexToRgba(color, 0.16) }}
    >
      <Icon size={size} style={{ color }} />
    </div>
  );
}

// Fase 3 — chip de filtro por tipo (Objetivo/Hábito/.../Personal), coloreado con el mismo token
// semántico que el resto del calendario. "Activo" = tipo visible; tocarlo lo oculta/muestra.
function FiltroChip({ tipo, activo, accent, onClick }) {
  const color = colorDeTipoEvento(tipo.id, accent);
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0"
      style={{
        background: activo ? hexToRgba(color, 0.14) : 'transparent',
        border: `1px solid ${activo ? hexToRgba(color, 0.4) : COLORS.border}`,
        color: activo ? color : COLORS.textMuted,
      }}
    >
      <span className="rounded-full flex-shrink-0" style={{ width: 6, height: 6, background: color }} />
      {tipo.label}
    </button>
  );
}

// Fila de evento reutilizada por el panel del día y por la Agenda — mismo aspecto en los dos
// sitios para que cambiar de vista (Mes/Agenda) no cambie el lenguaje visual del propio evento.
function FilaEvento({ ev, accent, onClick }) {
  return (
    <button onClick={onClick} className="w-full text-left">
      <Card className="flex items-center gap-3" style={{ padding: '0.85rem 1rem' }}>
        <TipoIcono tipoId={ev.tipo} accent={accent} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>{ev.titulo}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock size={11} style={{ color: COLORS.textMuted }} />
            <p className="text-xs" style={{ color: COLORS.textMuted }}>
              {ev.todoElDia ? 'Todo el día' : (ev.horaInicio ? `${ev.horaInicio}${ev.horaFin ? ` – ${ev.horaFin}` : ''}` : 'Sin hora')}
            </p>
            {ev.ubicacion && (
              <>
                <span style={{ color: COLORS.textMuted }}>·</span>
                <MapPin size={11} style={{ color: COLORS.textMuted }} />
                <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>{ev.ubicacion}</p>
              </>
            )}
          </div>
        </div>
        {(ev.soloLectura || ev.recurrencia || ev.eventoOrigenId) && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {ev.recurrencia || ev.eventoOrigenId ? <Repeat size={12} style={{ color: COLORS.textMuted }} /> : null}
            {ev.soloLectura && <Lock size={13} style={{ color: COLORS.textMuted }} />}
          </div>
        )}
      </Card>
    </button>
  );
}

/* Entrega 3 · F8 (HC F3) — la fila de una TAREA con fecha, que hasta ahora no
   salía en el Calendario (apartado 12). Se parece a `FilaEvento` a propósito,
   pero lleva su casilla: 🚨 y esa casilla llama a `onCompletar(refId)`, o sea a
   `toggleTarea` sobre LA tarea original. No hay copia que sincronizar
   (apartados 30 y 31). */
function FilaTarea({ tarea, accent, onCompletar, onAbrir }) {
  return (
    <Card className="flex items-center gap-3" style={{ padding: '0.85rem 1rem' }}>
      <button
        onClick={() => onCompletar && onCompletar(tarea.refId)}
        className="p-1.5 -m-1.5 flex-shrink-0"
        aria-label={tarea.hecha ? `Desmarcar ${tarea.titulo}` : `Completar ${tarea.titulo}`}
      >
        {tarea.hecha
          ? <CheckSquare size={16} style={{ color: accent }} />
          : <Square size={16} style={{ color: COLORS.textMuted }} />}
      </button>
      <button onClick={onAbrir} className="min-w-0 flex-1 text-left">
        <p
          className="text-sm font-semibold truncate"
          style={{ color: COLORS.text, textDecoration: tarea.hecha ? 'line-through' : 'none' }}
        >
          {tarea.titulo}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <Clock size={11} style={{ color: COLORS.textMuted }} />
          <p className="text-xs" style={{ color: COLORS.textMuted }}>{tarea.hora || 'Sin hora'}</p>
        </div>
      </button>
      <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: COLORS.textMuted }}>Tarea</span>
    </Card>
  );
}

/* ⚠️ Entrega 3 · F9 (HC F4) — el selector del ＋ y la tarea rápida **vivían
   aquí** desde la F8, así que Hoy y la Agenda no los tenían. Ahora son
   `QuickAdd` / `FormularioTarea` / `FormularioEvento` / `FormularioApunte` en
   `src/components/quickAdd.jsx`, y los usan las tres pantallas: *"no duplicar
   formularios"* (apartado 30). */

function nuevoEventoBase(fechaISO, tipo = 'personal') {
  return {
    id: null,
    titulo: '',
    tipo,
    fecha: fechaISO,
    todoElDia: false,
    horaInicio: '09:00',
    horaFin: '',
    ubicacion: '',
    notas: '',
    recurrencia: null, // Fase 3: { frecuencia: 'diaria'|'semanal'|'mensual'|'anual', hasta: ISO|null }
    /* E3 F11 (HC F6) — los dos campos del aviso. ⚠️ `notificar` nace mirando el
       permiso REAL: encenderlo sin permiso sería prometer algo que no va a pasar
       (apartado 7). */
    notificar: avisoPorDefecto(),
    anticipacion: 'momento',
    estado: 'activo', // Preparado, sin lógica todavía.
    origen: 'calendario',
    origenId: null,
  };
}

// Editor de evento: mismo formulario sirve para crear y editar (spec apartados 7-8) — solo para
// eventos creados a mano en el propio calendario (`origen: 'calendario'`). Rápido a propósito:
// solo título/tipo/fecha/hora son visibles siempre; ubicación, notas y repetición están ahí pero
// no obligan a nadie a rellenar diez campos para anotar algo simple.
function EditorEvento({ base, accent, onGuardar, onEliminar, onCerrar, fechaOcurrencia = null, onSaltarDia = null }) {
  const [ev, setEv] = useState(base);
  const esNuevo = !base.id;
  const set = (patch) => setEv((prev) => ({ ...prev, ...patch }));

  const guardar = () => {
    if (!ev.titulo.trim() || !ev.fecha) return;
    const ahora = new Date().toISOString();
    onGuardar({
      ...ev,
      id: ev.id || uid(),
      titulo: ev.titulo.trim(),
      horaInicio: ev.todoElDia ? null : (ev.horaInicio || null),
      horaFin: ev.todoElDia ? null : (ev.horaFin || null),
      creadoEn: ev.creadoEn || ahora,
      modificadoEn: ahora,
    });
  };

  // Optimización de navegación/scroll — `createPortal` saca el editor fuera del árbol de
  // `.module-enter` (que tiene un `transform` permanente por su animación de entrada, ver
  // App.jsx/index.css), para que `fixed inset-0` se ancle siempre al viewport real y el editor
  // aparezca superpuesto de inmediato, nunca "abajo del todo" de una vista larga del calendario.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onCerrar}
    >
      <div
        className="calendar-sheet w-full max-w-md rounded-3xl p-4 max-h-[85vh] overflow-y-auto"
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{esNuevo ? 'Nuevo evento' : 'Editar evento'}</p>
          <button onClick={onCerrar} className="p-1.5 rounded-full" style={{ background: COLORS.surface2 }} aria-label="Cerrar">
            <X size={14} style={{ color: COLORS.text }} />
          </button>
        </div>

        {!esNuevo && ev.recurrencia && (
          <p className="text-xs mb-3 px-1 flex items-start gap-1.5" style={{ color: COLORS.textMuted }}>
            <Repeat size={12} style={{ flexShrink: 0, marginTop: 2 }} />
            Este evento se repite ({FRECUENCIA_LABEL[ev.recurrencia.frecuencia]}) — guardar aquí cambia toda la serie, no solo este día. Eliminar borra todas las repeticiones.
          </p>
        )}

        <Field label="Título">
          <TextInput value={ev.titulo} onChange={(e) => set({ titulo: e.target.value })} placeholder="Ej. Examen de Biología" autoFocus />
        </Field>

        <Field label="Tipo">
          <Select value={ev.tipo} onChange={(e) => set({ tipo: e.target.value })}>
            {TIPOS_EVENTO_CALENDARIO.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </Select>
        </Field>

        <Field label="Fecha">
          <TextInput type="date" value={ev.fecha} onChange={(e) => set({ fecha: e.target.value })} />
        </Field>

        <button
          onClick={() => set({ todoElDia: !ev.todoElDia })}
          className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 mb-3 text-sm"
          style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
        >
          Todo el día
          <span
            className="rounded-full flex-shrink-0"
            style={{ width: 36, height: 20, background: ev.todoElDia ? accent : COLORS.border, position: 'relative', transition: 'background 150ms' }}
          >
            <span
              className="rounded-full absolute"
              style={{ width: 16, height: 16, top: 2, left: ev.todoElDia ? 18 : 2, background: COLORS.textOnAccent, transition: 'left 150ms' }}
            />
          </span>
        </button>

        {!ev.todoElDia && (
          <div className="flex gap-2">
            <div className="flex-1">
              <Field label="Hora inicio">
                <TextInput type="time" value={ev.horaInicio || ''} onChange={(e) => set({ horaInicio: e.target.value })} />
              </Field>
            </div>
            <div className="flex-1">
              <Field label="Hora fin (opcional)">
                <TextInput type="time" value={ev.horaFin || ''} onChange={(e) => set({ horaFin: e.target.value })} />
              </Field>
            </div>
          </div>
        )}

        {/* Entrega 3 · F11 (HC F6, apartados 5, 7 y 8) — el aviso. Son DOS campos
            del propio evento (`notificar` y `anticipacion`), no un recordatorio
            aparte: *"NO crear un sistema paralelo de recordatorios"*.
            🚨 Y si el navegador no da permiso **no se finge que quedó programado**
            (apartado 7): se dice en qué estado está y se acabó. */}
        {!ev.todoElDia && (
          <>
            <button
              onClick={() => set({ notificar: !ev.notificar })}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 mb-1 text-sm toque-44"
              style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
              aria-pressed={!!ev.notificar}
            >
              🔔 Avisarme
              <span
                className="rounded-full flex-shrink-0"
                style={{ width: 36, height: 20, background: ev.notificar ? accent : COLORS.border, position: 'relative', transition: 'background 150ms' }}
              >
                <span
                  className="rounded-full absolute"
                  style={{ width: 16, height: 16, top: 2, left: ev.notificar ? 18 : 2, background: COLORS.textOnAccent, transition: 'left 150ms' }}
                />
              </span>
            </button>

            {ev.notificar && estadoPermiso().id !== 'granted' && (
              <p className="text-xs mb-3 px-1" style={{ color: COLORS.negative }}>
                {estadoPermiso().nombre}: {estadoPermiso().explica}
              </p>
            )}

            {ev.notificar && (
              <Field label="Cuándo">
                <Select value={ev.anticipacion || 'momento'} onChange={(e) => set({ anticipacion: e.target.value })}>
                  {ANTICIPACIONES.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </Select>
              </Field>
            )}
          </>
        )}

        <Field label="Repetir">
          <Select
            value={ev.recurrencia?.frecuencia || 'nunca'}
            onChange={(e) => {
              const frecuencia = e.target.value;
              set({ recurrencia: frecuencia === 'nunca' ? null : { frecuencia, hasta: ev.recurrencia?.hasta || null } });
            }}
          >
            <option value="nunca">No se repite</option>
            {FRECUENCIAS_RECURRENCIA.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </Select>
        </Field>

        {/* R2.3 — "cada 2 semanas". Un número al lado de la frecuencia, y la
            frase de debajo lo dice en cristiano para no dejarlo a interpretación. */}
        {ev.recurrencia && (
          <Field label="Cada cuánto">
            <div className="flex items-center gap-2">
              <div style={{ width: 84 }}>
                <TextInput
                  type="number"
                  min="1"
                  max="99"
                  value={intervaloDe(ev.recurrencia)}
                  onChange={(e) => set({ recurrencia: { ...ev.recurrencia, cada: Math.max(1, Number(e.target.value) || 1) } })}
                  aria-label="Cada cuántas veces se repite"
                />
              </div>
              <span className="text-xs" style={{ color: COLORS.textMuted }}>
                {describirRecurrencia(ev.recurrencia)}
              </span>
            </div>
          </Field>
        )}

        {ev.recurrencia && (
          <Field label="Repetir hasta (opcional — vacío = sin fin)">
            <TextInput
              type="date"
              value={ev.recurrencia.hasta || ''}
              onChange={(e) => set({ recurrencia: { ...ev.recurrencia, hasta: e.target.value || null } })}
            />
          </Field>
        )}

        <Field label="Notas (opcional)">
          <Textarea value={ev.notas} onChange={(e) => set({ notas: e.target.value })} rows={2} placeholder="Detalles, descripción..." />
        </Field>

        <Field label="Ubicación (opcional)">
          <TextInput value={ev.ubicacion} onChange={(e) => set({ ubicacion: e.target.value })} placeholder="Ej. Instituto" />
        </Field>

        <div className="flex gap-2 mt-1">
          {!esNuevo && (
            <div style={{ width: 46, flexShrink: 0 }}>
              <GhostBtn onClick={() => onEliminar(ev.id)} icon={Trash2} />
            </div>
          )}
          {/* R2.4 — saltar SOLO este día. Aparece únicamente cuando se ha
              entrado desde una ocurrencia de una serie: en un evento suelto no
              significaría nada, y en la propia serie sin fecha tampoco. */}
          {!esNuevo && ev.recurrencia && fechaOcurrencia && onSaltarDia && (
            <div style={{ flexShrink: 0 }}>
              <GhostBtn onClick={() => onSaltarDia(ev, fechaOcurrencia)} icon={CalendarOff}>
                Saltar este día
              </GhostBtn>
            </div>
          )}
          <div className="flex-1">
            <PrimaryButton accent={accent} disabled={!ev.titulo.trim() || !ev.fecha} onClick={guardar}>
              {esNuevo ? 'Crear evento' : 'Guardar cambios'}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Fase 2 — detalle de un evento de solo lectura (viene de Objetivos/Estudios/Entrenamiento/
// Productividad, ver calendarioIntegracion.js). No se puede editar ni eliminar desde aquí — el
// calendario no es dueño de ese dato, solo lo muestra (spec: "vinculación con el módulo que
// originó cada evento... si procede, poder abrir el elemento original desde el calendario").
function DetalleEventoDerivado({ evento, accent, onAbrirModulo, onCerrar }) {
  const nombreOrigen = NOMBRES_ORIGEN[evento.origen] || evento.origen;
  // Optimización de navegación/scroll — mismo motivo que el editor de eventos, arriba.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onCerrar}
    >
      <div
        className="calendar-sheet w-full max-w-md rounded-3xl p-4"
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: COLORS.textMuted }}>
            <Lock size={12} /> Viene de {nombreOrigen}
          </p>
          <button onClick={onCerrar} className="p-1.5 rounded-full" style={{ background: COLORS.surface2 }} aria-label="Cerrar">
            <X size={14} style={{ color: COLORS.text }} />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <TipoIcono tipoId={evento.tipo} accent={accent} size={18} />
          <div className="min-w-0">
            <p className="text-base font-bold truncate" style={{ color: COLORS.text }}>{evento.titulo}</p>
            <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{etiquetaDiaCorta(evento.fecha)}</p>
          </div>
        </div>

        {evento.notas && <p className="text-sm mb-3" style={{ color: COLORS.text }}>{evento.notas}</p>}

        <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
          Para editarlo o eliminarlo, hazlo desde {nombreOrigen} — el calendario solo lo muestra, no es el dato original.
        </p>

        <PrimaryButton accent={accent} icon={ExternalLink} onClick={() => { onAbrirModulo(evento.origen); onCerrar(); }}>
          Abrir en {nombreOrigen}
        </PrimaryButton>
      </div>
    </div>,
    document.body
  );
}

// Fase 3 — buscador del calendario: título/notas, sobre la misma lista visible (respeta los
// filtros de tipo activos), acotado a una ventana amplia pero finita (documentado más abajo, en
// CalendarView) para no tener que "expandir" recurrencias sin límite.
function BuscadorEventos({ eventos, accent, onSeleccionar, onCerrar }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const resultados = q.length < 2 ? [] : eventos
    .filter((e) => e.titulo.toLowerCase().includes(q) || (e.notas || '').toLowerCase().includes(q))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, 30);

  // Optimización de navegación/scroll — mismo motivo que el editor de eventos, arriba.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onCerrar}>
      <div
        className="calendar-sheet w-full max-w-md rounded-3xl p-4 max-h-[75vh] flex flex-col"
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: COLORS.text }}>
            <Search size={15} /> Buscar en el calendario
          </p>
          <button onClick={onCerrar} className="p-1.5 rounded-full" style={{ background: COLORS.surface2 }} aria-label="Cerrar">
            <X size={14} style={{ color: COLORS.text }} />
          </button>
        </div>
        <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Título o notas..." autoFocus />
        <div className="mt-3 space-y-2 overflow-y-auto">
          {q.length >= 2 && resultados.length === 0 && (
            <p className="text-xs text-center py-4" style={{ color: COLORS.textMuted }}>Sin resultados (con los filtros de tipo activos).</p>
          )}
          {resultados.map((ev) => (
            <button key={ev.id} onClick={() => onSeleccionar(ev)} className="w-full text-left">
              <Card className="flex items-center gap-3" style={{ padding: '0.7rem 0.9rem' }}>
                <TipoIcono tipoId={ev.tipo} accent={accent} size={13} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>{ev.titulo}</p>
                  <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{etiquetaDiaCorta(ev.fecha)}</p>
                </div>
              </Card>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ===========================================================================
   ENTREGA 3 · FASE 13 (HC F8) — ESTADÍSTICAS DE PLANIFICACIÓN
   ===========================================================================
   *"¿En qué estoy utilizando mi tiempo? ¿Cuánto planifico? ¿Cuánto cumplo?"*

   🚨 **Aquí no se guarda ni una cifra**: todo se cuenta en el momento sobre los
   eventos y las tareas que ya existen. Y **ni una interpretación** (apartado
   14): se enseña el número y su nombre, nunca un *"deberías"*. */
function EstadisticasPlan({ estado, accent, onVerAtrasadas }) {
  const [per, setPer] = useState(PERIODO_POR_DEFECTO);
  const res = resumenPlanificacion(estado, per);
  const horas = horasPlanificadas(estado, per);
  const carga = cargaPorDiaSemana(estado, per);
  const dist = distribucionPorTipo(estado, per);
  const horaria = distribucionHoraria(estado, per);
  const rec = resumenRecurrentes(estado, per);
  const atrasadas = tareasAtrasadas(estado);
  const comp = comparar(estado, per);
  const porDia = cumplimientoPorDia(estado, per);

  const Cifra = ({ nombre, valor, sufijo = '' }) => (
    <div className="text-center">
      <p className="text-lg font-extrabold leading-none" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
        {valor === null ? '—' : `${valor}${sufijo}`}
      </p>
      <p className="text-[10px] mt-0.5 uppercase tracking-wide" style={{ color: COLORS.textMuted }}>{nombre}</p>
    </div>
  );

  return (
    <>
      {/* Apartado 2 — el periodo, con 30 días por defecto. */}
      <div className="flex gap-1.5">
        {PERIODOS.map((p) => (
          <ToggleTab key={p.id} active={per === p.id} onClick={() => setPer(p.id)} accent={accent}>{p.nombre}</ToggleTab>
        ))}
      </div>

      {/* Apartado 3 — el resumen principal, calculado de verdad. */}
      <Card>
        <div className="grid grid-cols-4 gap-2">
          <Cifra nombre="Planificado" valor={res.planificados} />
          <Cifra nombre="Hechos" valor={res.completados} />
          <Cifra nombre="Pendientes" valor={res.pendientes} />
          <Cifra nombre="Cumplido" valor={res.cumplimiento} sufijo="%" />
        </div>
        {/* 🚨 Apartado 6 — *"si no hay suficientes datos: Sin datos suficientes.
            No inventar un porcentaje."* */}
        {res.cumplimiento === null && (
          <p className="text-xs text-center mt-2" style={{ color: COLORS.textMuted }}>{TEXTO_SIN_DATOS}</p>
        )}
      </Card>

      {res.planificados === 0 ? (
        <EmptyHint text="Todavía no hay nada planificado en este periodo." />
      ) : (
        <>
          {/* Apartados 7 y 23 — el gráfico, que son ocho caracteres. */}
          <Card>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: COLORS.textMuted }}>Actividad por día</p>
            <p className="text-lg tracking-widest" style={{ color: accent }} aria-hidden="true">
              {grafico(porDia.map((x) => x.total))}
            </p>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>
              {porDia.reduce((a, x) => a + x.total, 0)} elementos con algo que completar en {porDia.length} días
            </p>
          </Card>

          {/* Apartado 8 — la carga por día de la semana. */}
          <Card>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: COLORS.textMuted }}>Elementos por día</p>
            <div className="grid grid-cols-7 gap-1">
              {carga.map((c) => (
                <div key={c.indice} className="text-center">
                  <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{c.letra}</p>
                  <p className="text-sm font-bold" style={{ color: COLORS.text }}>{c.elementos}</p>
                </div>
              ))}
            </div>
            {/* Apartado 14 — información, no una recomendación. */}
            {diasMasCargados(estado, per).length > 0 && (
              <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>
                Más elementos: {diasMasCargados(estado, per).map((x) => `${x.nombre} (${x.elementos})`).join(' · ')}
              </p>
            )}
          </Card>

          {/* Apartado 9 — qué planificas. */}
          {dist.length > 0 && (
            <Card>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: COLORS.textMuted }}>Qué planificas</p>
              {dist.slice(0, 6).map((x) => (
                <div key={x.id} className="flex items-center justify-between py-0.5">
                  <span className="text-xs" style={{ color: COLORS.text }}>
                    {x.id === 'tarea' ? 'Tareas' : (TIPOS_EVENTO_CALENDARIO.find((t) => t.id === x.id)?.labelPlural || x.id)}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>{x.porcentaje} % · {x.elementos}</span>
                </div>
              ))}
            </Card>
          )}

          {/* Apartado 10 — cuándo planificas. ⚠️ Solo si hay algo con hora. */}
          {horaria.hayDatos && (
            <Card>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: COLORS.textMuted }}>Cuándo planificas</p>
              {horaria.franjas.map((f) => (
                <div key={f.id} className="flex items-center justify-between py-0.5">
                  <span className="text-xs" style={{ color: COLORS.text }}>{f.nombre}</span>
                  <span className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>{f.porcentaje} %</span>
                </div>
              ))}
              {horaria.sinHora > 0 && (
                <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                  {horaria.sinHora} sin hora, que no entran aquí.
                </p>
              )}
            </Card>
          )}

          {/* Apartados 11 y 13 — las horas, sin estimar lo que no existe. */}
          <Card>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: COLORS.textMuted }}>Horas planificadas</p>
            <p className="text-lg font-extrabold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
              {horas.texto || TEXTO_SIN_DATOS}
            </p>
            {horas.aviso && <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{horas.aviso}</p>}
            {/* ⏸ Lo que no se puede medir se dice, en vez de estimarlo. */}
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
              {NO_MEDIBLE_TODAVIA.find((x) => x.id === 'horas_reales').porque}
            </p>
          </Card>

          {/* Apartado 18 — las recurrentes. */}
          {rec.series > 0 && (
            <Card>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: COLORS.textMuted }}>Actividades que se repiten</p>
              <p className="text-xs" style={{ color: COLORS.text }}>
                {rec.series} {rec.series === 1 ? 'actividad' : 'actividades'} · {rec.hechas} de {rec.apariciones} veces
                {rec.porcentaje !== null ? ` · ${rec.porcentaje} %` : ''}
              </p>
            </Card>
          )}

          {/* Apartados 25 y 27 — comparar, sin interpretar. */}
          {comp.completados.antes > 0 && (
            <Card>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: COLORS.textMuted }}>Frente al periodo anterior</p>
              <p className="text-xs" style={{ color: COLORS.text }}>
                {tendencia(comp.completados.diferencia)?.icono} {tendencia(comp.completados.diferencia)?.texto} completados
                {comp.cumplimiento.diferencia !== null
                  ? ` · ${tendencia(comp.cumplimiento.diferencia).icono} ${tendencia(comp.cumplimiento.diferencia).texto} puntos de cumplimiento`
                  : ''}
              </p>
            </Card>
          )}
        </>
      )}

      {/* Apartado 16 — las atrasadas, que llevan a la lista de verdad. */}
      {atrasadas.length > 0 && (
        <button onClick={onVerAtrasadas} className="w-full text-left toque-44">
          <Card className="flex items-center justify-between" style={{ padding: '0.75rem 1rem' }}>
            <span className="text-sm" style={{ color: COLORS.text }}>
              {atrasadas.length} {atrasadas.length === 1 ? 'pendiente atrasada' : 'pendientes atrasadas'}
            </span>
            <span className="text-xs font-semibold" style={{ color: accent }}>Ver →</span>
          </Card>
        </button>
      )}
    </>
  );
}

/* ===========================================================================
   ENTREGA 3 · FASE 10 (HC F5) — LA SEMANA
   ===========================================================================
   *"¿Cómo tengo organizada mi semana?"*

   ⚠️ **En el móvil no caben siete columnas** (apartado 3): *"no intentar meter
   siete columnas diminutas"*. Así que arriba va la tira de siete días con su
   carga, y debajo la planificación del día seleccionado — que es exactamente lo
   que el apartado describe. En pantalla ancha las siete columnas caben, y por
   eso la tira usa `grid-cols-7` y crece.

   🚨 Y los datos son los de siempre: `semanaDe` junta lo que ya vive en su
   módulo. No hay un almacén de la semana (apartado 18). */
function VistaSemana({ semana, accent, onDia, onEstaSemana, onSemana, onAnadir, onCompletar }) {
  const dia = semana.dias.find((d) => d.seleccionado) || semana.dias[0];
  return (
    <>
      <Card style={{ padding: '0.85rem 1.1rem' }}>
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => onSemana(semanaAnterior(dia.fecha))} aria-label="Semana anterior"
            className="p-2 -m-1 rounded-full" style={{ background: COLORS.surface2 }}>
            <ChevronLeft size={15} style={{ color: COLORS.text }} />
          </button>
          <div className="text-center min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
              {semana.titulo}
            </p>
            {/* Apartado 6 — *"Esta semana debe devolver a la semana que contiene
                la fecha actual. No necesariamente abrir Hoy."* */}
            {semana.esActual
              ? <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>Esta semana</p>
              : <button onClick={onEstaSemana} className="text-xs font-semibold mt-0.5 toque-44" style={{ color: accent }}>Esta semana</button>}
          </div>
          <button onClick={() => onSemana(semanaSiguiente(dia.fecha))} aria-label="Semana siguiente"
            className="p-2 -m-1 rounded-full" style={{ background: COLORS.surface2 }}>
            <ChevronRight size={15} style={{ color: COLORS.text }} />
          </button>
        </div>

        {/* Apartados 2, 3 y 15 — los siete días con su carga, de forma discreta. */}
        <div className="grid grid-cols-7 gap-1 mt-2">
          {semana.dias.map((d) => (
            <button key={d.fecha} onClick={() => onDia(d.fecha)}
              className="rounded-xl py-1.5 text-center"
              style={d.seleccionado
                ? { background: accent, color: COLORS.textOnAccent }
                : { background: COLORS.surface2, color: COLORS.textMuted, border: d.esHoy ? `1.5px solid ${accent}` : '1.5px solid transparent' }}
              aria-label={`${d.dia}, ${d.total === 0 ? TEXTO_DIA_LIBRE : `${d.total} elementos`}`}
              aria-current={d.esHoy ? 'date' : undefined}>
              <span className="block text-[10px] font-semibold">{DIAS_SEMANA[(new Date(`${d.fecha}T00:00:00`).getDay() + 6) % 7]}</span>
              <span className="block text-sm font-bold" style={{ textDecoration: d.esHoy ? 'underline' : 'none', textUnderlineOffset: '2px' }}>{d.dia}</span>
              <span className="block text-[9px]">{d.total === 0 ? '·' : d.total}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-end mt-2">
          <BotonAnadir accent={accent} onClick={onAnadir} />
        </div>
      </Card>

      {/* Apartado 16 — *"un día sin elementos: Libre. No rellenar con tarjetas
          vacías."* Ni una lista de siete huecos. */}
      {dia.libre ? (
        <Card className="text-center" style={{ padding: '1.25rem 1rem' }}>
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{TEXTO_DIA_LIBRE}</p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>No tienes nada este día.</p>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>
              {etiquetaDiaCorta(dia.fecha)}
            </p>
            <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
              <span aria-hidden="true">{dia.carga.icono}</span> {dia.carga.nombre}
            </p>
          </div>
          {/* Apartado 17 — el orden ya viene decidido por `pesoDe`: eventos,
              luego lo que tiene hora, luego las tareas. */}
          {dia.elementos.map((e, i) => (
            <div key={e.id || i} className="flex items-start gap-2 py-1.5">
              <span className="text-xs font-bold tabular-nums flex-shrink-0" style={{ color: COLORS.textMuted, width: 42 }}>
                {e.horaInicio || e.hora || '—'}
              </span>
              {e.tipoElemento === 'tarea' ? (
                <button onClick={() => onCompletar(e)} className="p-1.5 -m-1.5 flex-shrink-0"
                  aria-label={e.hecha ? `Desmarcar ${e.texto || e.titulo}` : `Completar ${e.texto || e.titulo}`}>
                  {e.hecha
                    ? <CheckSquare size={15} style={{ color: accent }} />
                    : <Square size={15} style={{ color: COLORS.textMuted }} />}
                </button>
              ) : (
                <TipoIcono tipoId={e.tipo} accent={accent} size={11} />
              )}
              <span className="text-sm flex-1 min-w-0" style={{ color: COLORS.text, textDecoration: e.hecha ? 'line-through' : 'none' }}>
                {e.texto || e.titulo}
                {/* ⚠️ Una aparición de una serie se dice, para que se entienda por
                    qué marcarla no marca las demás (apartado 24). */}
                {e.esInstancia && <Repeat size={11} className="inline ml-1" style={{ color: COLORS.textMuted }} />}
              </span>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

/* ===========================================================================
   ENTREGA 3 · FASE 7 (HC F2) — LA AGENDA DE UN DÍA
   ===========================================================================
   *"Al entrar en Agenda, el usuario debe sentir: esta es mi agenda de hoy."*

   ⚠️ **Aquí no se calcula nada**: el día entero lo arma `agendaDia.js` desde las
   fuentes de siempre. Si esta pantalla dijera una hora distinta de la del
   Calendario, sería porque alguien contó por su cuenta. */
function AgendaDeUnDia({ dia, titulo, tira, accent, onDia, onHoy, onCompletar, onAnadir, onMenu }) {
  return (
    <>
      {/* Apartado 1 — cabecera con ‹ Hoy › y la fecha, nunca escrita a mano. */}
      <Card style={{ padding: '0.85rem 1.1rem' }}>
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => onDia(diaAnterior(dia.fecha))} aria-label="Día anterior"
            className="p-2 -m-1 rounded-full" style={{ background: COLORS.surface2 }}>
            <ChevronLeft size={15} style={{ color: COLORS.text }} />
          </button>
          <div className="text-center min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
              {titulo.texto}
            </p>
            {!titulo.esHoy && (
              <button onClick={onHoy} className="text-xs font-semibold mt-0.5" style={{ color: accent }}>Hoy</button>
            )}
            {titulo.esHoy && <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>Hoy</p>}
          </div>
          <button onClick={() => onDia(diaSiguiente(dia.fecha))} aria-label="Día siguiente"
            className="p-2 -m-1 rounded-full" style={{ background: COLORS.surface2 }}>
            <ChevronRight size={15} style={{ color: COLORS.text }} />
          </button>
        </div>

        {/* E3 F9, apartado 3 — el ＋ crea para el día QUE SE ESTÁ VIENDO, no
            para hoy: *"si el usuario está viendo 15 septiembre… la tarea debe
            crearse directamente para el 15 de septiembre"*. */}
        <div className="flex justify-end mt-2">
          <BotonAnadir accent={accent} onClick={onAnadir} />
        </div>

        {/* Apartado 2 — la tira de días, para cambiar sin abrir el mes. */}
        <div className="flex gap-1 mt-2 justify-between">
          {tira.map((d) => (
            <button key={d.fecha} onClick={() => onDia(d.fecha)}
              className="flex-1 rounded-xl py-1.5 text-center"
              style={d.seleccionado
                ? { background: accent, color: COLORS.textOnAccent }
                : { background: COLORS.surface2, color: COLORS.textMuted }}
              aria-label={`Ir al ${d.etiqueta} ${d.dia}`}>
              <span className="block text-[10px] font-semibold">{d.etiqueta}</span>
              <span className="block text-sm font-bold">{d.dia}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Apartado 19 — un día vacío no es una lista vacía. */}
      {dia.vacio ? (
        <Card className="text-center">
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{VACIO_AGENDA.titulo}</p>
          <p className="text-xs mt-1 mb-3" style={{ color: COLORS.textMuted }}>{VACIO_AGENDA.explica}</p>
          <PrimaryButton accent={accent} icon={Plus} onClick={onAnadir}>{VACIO_AGENDA.boton}</PrimaryButton>
        </Card>
      ) : (
        <>
          {/* Apartado 17 — el siguiente pendiente, destacado LIGERAMENTE. */}
          {dia.proximo && (
            <Card style={{ padding: '0.7rem 1.1rem', border: `1px solid ${hexToRgba(accent, 0.35)}`, background: hexToRgba(accent, 0.06) }}>
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>Próximo</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: COLORS.text }}>
                {dia.proximo.inicio} · {dia.proximo.titulo}
              </p>
            </Card>
          )}

          {/* Apartado 3 — la línea temporal. Y el 15: un evento pasado sigue
              visible, solo se distingue. Y el 18: dos a la misma hora se ven los
              dos, nunca se esconde uno. */}
          {dia.conHora.length > 0 && (
            <Card>
              {dia.conHora.map((e, i) => (
                <div key={e.id || i}>
                  {/* Apartado 16 — la raya de AHORA, y solo en el día de hoy. */}
                  {dia.ahora !== null && i > 0 && dia.conHora[i - 1].minutos < dia.ahora && e.minutos >= dia.ahora && (
                    <div className="flex items-center gap-2 my-1.5">
                      <span className="h-px flex-1" style={{ background: accent }} />
                      <span className="text-[10px] font-bold" style={{ color: accent }}>AHORA</span>
                      <span className="h-px flex-1" style={{ background: accent }} />
                    </div>
                  )}
                  <div className="flex items-start gap-2 py-1.5" style={{ opacity: e.pasado ? 0.55 : 1 }}>
                    <span className="text-xs font-bold tabular-nums flex-shrink-0" style={{ color: COLORS.textMuted, width: 42 }}>
                      {e.inicio || '—'}
                    </span>
                    {e.completable && (
                      <button onClick={() => onCompletar && onCompletar(e.refId)}
                        className="p-1.5 -m-1.5 flex-shrink-0" aria-label={e.hecha ? `Desmarcar ${e.titulo}` : `Completar ${e.titulo}`}>
                        {e.hecha
                          ? <CheckSquare size={15} style={{ color: accent }} />
                          : <Square size={15} style={{ color: COLORS.textMuted }} />}
                      </button>
                    )}
                    <span className="text-sm flex-1 min-w-0" style={{ color: COLORS.text, textDecoration: e.hecha ? 'line-through' : 'none' }}>
                      {e.titulo}
                      {e.solapado && (
                        <span className="text-[10px] ml-1" style={{ color: COLORS.textMuted }}>· a la vez que otro</span>
                      )}
                    </span>
                    {/* E3 F9, apartado 8 — solo las acciones que sirven para ESTE
                        elemento; qué acciones tiene cada tipo lo decide
                        `accionesDe`, no esta pantalla. */}
                    {e.tipoAgenda === 'tarea' && (
                      <button onClick={() => onMenu && onMenu(e)} className="p-1.5 -m-1.5 flex-shrink-0"
                        aria-label={`Acciones de ${e.titulo}`}>
                        <MoreHorizontal size={15} style={{ color: COLORS.textMuted }} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* Apartado 4 — lo que pertenece al día pero no tiene hora. */}
          {dia.sinHora.length > 0 && (
            <Card>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: COLORS.textMuted }}>Sin hora</p>
              {dia.sinHora.map((e, i) => (
                <div key={e.id || i} className="flex items-start gap-2 py-1">
                  {e.completable ? (
                    <button onClick={() => onCompletar && onCompletar(e.refId)}
                      className="p-1.5 -m-1.5 flex-shrink-0" aria-label={e.hecha ? `Desmarcar ${e.titulo}` : `Completar ${e.titulo}`}>
                      {e.hecha
                        ? <CheckSquare size={15} style={{ color: accent }} />
                        : <Square size={15} style={{ color: COLORS.textMuted }} />}
                    </button>
                  ) : (
                    <span className="text-sm leading-none flex-shrink-0" aria-hidden="true">
                      {tipoAgenda(e.tipoAgenda)?.icono || '·'}
                    </span>
                  )}
                  <span className="text-sm flex-1 min-w-0" style={{ color: COLORS.text, textDecoration: e.hecha ? 'line-through' : 'none' }}>
                    {e.titulo}
                  </span>
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </>
  );
}

export default function CalendarView({
  calendario, derivados, onAdd, onUpdate, onDelete, onAbrirModulo, accent, foco, onFocoConsumido,
  // E3 F7 — las fuentes del día. Llegan tal cual, sin copia: el apartado 25.
  horarioTop, productividad, salud, nutricion, calistenia, futbol, onCompletarTarea,
  // E3 F8 — crear una tarea desde el Calendario (apartado 18). Es `addTarea`, la de
  // Productividad: la tarea nace donde viven todas, no en una lista del calendario.
  onAddTarea,
  /* E3 F9 (HC F4) — cambiar fecha/hora (11 y 12), eliminar (13) y deshacer (14).
     Las tres son las funciones de siempre de `App.jsx`: no hay una segunda pila
     de deshacer ni una segunda puerta de borrado (ME F3). */
  onUpdateTarea, onDeleteTarea, onDeshacer,
}) {
  const hoy = todayISO();
  const [cursor, setCursor] = useState(() => ({ anio: Number(hoy.slice(0, 4)), mes: Number(hoy.slice(5, 7)) - 1 }));
  const [seleccionado, setSeleccionado] = useState(hoy);
  const [editor, setEditor] = useState(null); // null | evento propio (nuevo o existente)
  const [detalle, setDetalle] = useState(null); // null | evento de solo lectura
  const [vista, setVista] = useState('mes'); // Fase 3: 'mes' | 'agenda'
  const [tiposOcultos, setTiposOcultos] = useState([]); // Fase 3: filtros por tipo
  const [buscando, setBuscando] = useState(false); // Fase 3: buscador

  // Paréntesis — Acceso directo a Agenda desde el Dashboard: `foco.vista === 'agenda'` llega
  // desde `navegarDesdeHoy('calendario', { vista: 'agenda' })` — cambia el mismo toggle Mes/
  // Agenda que ya existía a mano desde la Fase 3, sin duplicar nada. Un solo toque desde "Hoy"
  // aterriza ya en la Agenda, en vez de obligar a entrar primero al Calendario y tocar el
  // interruptor.
  useEffect(() => {
    /* E3 F9 (HC F4, apartado 18) — *"Ver todas → abrir Agenda filtrada por
       tareas del día. No crear una nueva pantalla."* Así que `vista: 'dia'`
       abre la agenda del día (E3 F7), que es donde están las tareas; y
       `vista: 'agenda'` sigue abriendo la de próximos días, como desde la F6. */
    if (foco?.vista === 'agenda' || foco?.vista === 'dia') {
      setVista(foco.vista);
      onFocoConsumido && onFocoConsumido();
    }
  }, [foco]);

  // Fase 2/3 — unión de eventos propios (editables) + derivados de otros módulos (solo lectura,
  // calculados en cada render por App.jsx — ver calendarioIntegracion.js), con los tipos ocultos
  // por el filtro ya descartados aquí mismo para que todo lo de abajo (celdas, día, agenda,
  // "Próximamente", búsqueda) trabaje siempre sobre la misma lista ya filtrada.
  const eventosBase = [...(calendario.eventos || []), ...(derivados || [])].filter((e) => !tiposOcultos.includes(e.tipo));

  // Fase 3 — expansión de recurrencias, acotada siempre a la ventana que hace falta en cada
  // sitio (nunca "para siempre" en memoria, ver expandirRecurrentes en calendario.js): el mes
  // visible para la cuadrícula y el panel de día, y una ventana de 13 días para "Próximamente".
  const primerDiaMesISO = isoDeFecha(cursor.anio, cursor.mes, 1);
  const ultimoDiaMesISO = isoDeFecha(cursor.anio, cursor.mes, diasDelMes(cursor.anio, cursor.mes));
  const eventosMes = expandirRecurrentes(eventosBase, primerDiaMesISO, ultimoDiaMesISO);
  const eventosDia = eventosDelDia(eventosMes, seleccionado);
  /* E3 F8 (HC F3) — las tareas con fecha, que hasta ahora no salían aquí (apartado 12).
     🚨 Se LEEN de `productividad.tareas`: ni una copia, ni un almacén del calendario
     (apartados 30 y 31). */
  const tareasDia = tareasDelDia(productividad, seleccionado);
  const resumen = resumenDeDia(eventosMes, seleccionado, productividad);
  const carga = cargaDelDia(eventosMes, seleccionado, productividad);

  const VENTANA_PROXIMOS_DIAS = 13;
  const eventosProximosBase = expandirRecurrentes(eventosBase, hoy, addDays(hoy, VENTANA_PROXIMOS_DIAS));
  const fechasProximas = [...new Set(eventosProximosBase.map((e) => e.fecha))].slice(0, 5);
  const proximos = fechasProximas.map((fecha) => ({ fecha, resumen: resumenDelDia(eventosProximosBase, fecha) }));

  // Fase 3 — Agenda: ventana más larga (60 días), agrupada por día, tope de 50 eventos
  // renderizados para que una serie diaria muy larga no se convierta en una lista interminable
  // (spec, principio clave: "el calendario no debe convertirse en una pantalla llena de
  // información" — ni siquiera en su vista más "densa").
  const VENTANA_AGENDA_DIAS = 60;
  const TOPE_AGENDA = 50;
  const eventosAgendaBase = vista === 'agenda' ? expandirRecurrentes(eventosBase, hoy, addDays(hoy, VENTANA_AGENDA_DIAS)) : [];
  const fechasAgenda = [...new Set(eventosAgendaBase.map((e) => e.fecha))].sort();
  let contadosAgenda = 0;
  const gruposAgenda = [];
  for (const fecha of fechasAgenda) {
    if (contadosAgenda >= TOPE_AGENDA) break;
    const evs = eventosDelDia(eventosAgendaBase, fecha);
    gruposAgenda.push({ fecha, eventos: evs });
    contadosAgenda += evs.length;
  }
  const agendaTruncada = gruposAgenda.length < fechasAgenda.length;

  // Fase 3 — buscador: misma ventana amplia y acotada que la Agenda, sin límite de vista activa.
  const eventosBusqueda = expandirRecurrentes(eventosBase, addDays(hoy, -VENTANA_AGENDA_DIAS), addDays(hoy, 180));

  const irMes = (delta) => {
    let mes = cursor.mes + delta;
    let anio = cursor.anio;
    if (mes < 0) { mes = 11; anio -= 1; }
    if (mes > 11) { mes = 0; anio += 1; }
    setCursor({ anio, mes });
  };

  const irADia = (fecha) => {
    setSeleccionado(fecha);
    setCursor({ anio: Number(fecha.slice(0, 4)), mes: Number(fecha.slice(5, 7)) - 1 });
    setVista('mes');
  };

  const irAHoy = () => irADia(hoy);

  const toggleTipoOculto = (id) => setTiposOcultos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  /* E3 F8, apartado 16 — el ＋ pregunta QUÉ, con el día ya puesto. Antes creaba
     siempre un evento, así que no había forma de apuntar una tarea desde aquí. */
  const [creando, setCreando] = useState(false); // el selector Evento/Tarea/Recordatorio
  const [tareaRapida, setTareaRapida] = useState(false);
  const abrirNuevo = () => setCreando(true);
  /* E3 F9 — un solo punto de entrada: el ＋ dice QUÉ y esto abre su formulario,
     con la fecha del contexto ya puesta (apartados 4 y 27). */
  const elegirQueCrear = (tipoId, contexto) => {
    setCreando(false);
    if (tipoId === 'tarea') { setTareaRapida(true); return; }
    // ⚠️ El evento y el recordatorio abren el editor completo del Calendario,
    // que ya existe: escribir aquí otro formulario sería el duplicado del
    // apartado 30. El recordatorio llega con su tipo puesto.
    setEditor(nuevoEventoBase(contexto.fecha, tipoId === 'recordatorio' ? 'recordatorio' : 'personal'));
  };
  const guardarTarea = (tarea) => {
    onAddTarea && onAddTarea(nuevaTareaDeCalendario(tarea.texto, tarea.fecha, tarea.hora));
    setTareaRapida(false);
    setAviso('tarea_creada');
  };

  /* E3 F9 (HC F4) — las acciones contextuales de un elemento (apartados 8, 11,
     12 y 13). ⚠️ Todas escriben en LA entidad original: cambiar la fecha de una
     tarea desde aquí la mueve en Hoy y en la Agenda **porque es la misma
     tarea**, no porque nadie sincronice nada (apartados 29 y 30). */
  const [menu, setMenu] = useState(null);          // el elemento con el ••• abierto
  const [cambiando, setCambiando] = useState(null); // null | 'fecha' | 'hora'
  const [aviso, setAviso] = useState(null);

  const tareaOriginal = (elemento) => (productividad?.tareas || []).find((t) => t.id === elemento?.refId) || null;

  const abrirMenu = (elemento) => setMenu({ ...elemento, tipo: elemento.tipoAgenda || 'tarea' });

  const accionDelMenu = (accionId, elemento) => {
    if (accionId === 'completar') {
      onCompletarTarea && onCompletarTarea(elemento.refId);
      setMenu(null);
      setAviso(elemento.hecha ? 'tarea_pendiente' : 'tarea_completada');
      return;
    }
    if (accionId === 'editar') { setMenu(null); onAbrirModulo && onAbrirModulo('productividad'); return; }
    if (accionId === 'fecha' || accionId === 'hora') { setCambiando(accionId); return; }
    if (accionId === 'eliminar') {
      onDeleteTarea && onDeleteTarea(elemento.refId);
      setMenu(null);
      setAviso('eliminado');
    }
  };

  /* E3 F10 (HC F5, apartado 24) — *"completar una instancia no debe marcar
     automáticamente todas las demás. La regla permanece."* Por eso una aparición
     no llama a `toggleTarea` (que voltea `hecha` de la tarea entera), sino a
     `marcarInstancia`, que apunta ESE día dentro de la regla. Una tarea suelta
     sigue por el camino de siempre. */
  const completarDesdeSemana = (elemento) => {
    const original = (productividad?.tareas || []).find((t) => t.id === (elemento.tareaId || elemento.id));
    if (!original) return;
    if (!seRepite(original)) { onCompletarTarea && onCompletarTarea(original.id); return; }
    const cambiada = marcarInstancia(original, elemento.fecha);
    if (cambiada) onUpdateTarea && onUpdateTarea(cambiada);
  };

  const guardarCambio = (valor) => {
    const original = tareaOriginal(menu);
    if (!original) { setCambiando(null); setMenu(null); return; }
    const cambiada = cambiando === 'fecha' ? tareaEnFecha(original, valor) : tareaEnHora(original, valor);
    // ⚠️ `null` significa que el valor no vale: no se escribe una mentira.
    if (cambiada) {
      onUpdateTarea && onUpdateTarea(cambiada);
      setAviso(cambiando === 'fecha' ? 'fecha_cambiada' : 'hora_cambiada');
    }
    setCambiando(null);
    setMenu(null);
  };
  // Fase 3 — una ocurrencia de un evento recurrente (`eventoOrigenId`) siempre abre/edita el
  // evento REAL guardado (la serie completa), nunca una copia virtual de un día concreto.
  const resolverEventoReal = (ev) => {
    if (ev.eventoOrigenId) {
      const original = (calendario.eventos || []).find((x) => x.id === ev.eventoOrigenId);
      if (original) return original;
    }
    return ev;
  };
  /* R2.4 — qué día se tocó. `resolverEventoReal` devuelve la SERIE, así que sin
     esto el editor no sabría de qué ocurrencia venimos y no podría ofrecer
     "saltar este día". Se guarda la fecha, no una copia del evento. */
  const [ocurrencia, setOcurrencia] = useState(null);
  const abrirEvento = (evRaw) => {
    const ev = resolverEventoReal(evRaw);
    setOcurrencia(evRaw.fecha || null);
    if (ev.soloLectura) setDetalle(ev); else setEditor(ev);
  };
  const cerrarEditor = () => { setEditor(null); setOcurrencia(null); };

  /* Saltar un día concreto sin romper la serie: escribe la excepción en el
     evento real y guarda, como cualquier otra edición. */
  const saltarDia = (evento, fechaISO) => {
    onUpdate(saltarOcurrencia(evento, fechaISO));
    setEditor(null);
    setOcurrencia(null);
  };

  const guardar = (ev) => {
    const esNuevo = !(calendario.eventos || []).some((x) => x.id === ev.id);
    if (esNuevo) onAdd(ev); else onUpdate(ev);
    if (ev.fecha !== seleccionado) irADia(ev.fecha);
    setEditor(null);
  };

  const eliminar = (id) => {
    onDelete(id);
    setEditor(null);
  };

  const seleccionarDesdeBusqueda = (ev) => {
    setBuscando(false);
    irADia(ev.fecha);
    abrirEvento(ev);
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between gap-2">
        <SectionTitle sub="El eje temporal de tu Sistema Operativo Personal">Calendario</SectionTitle>
        <button
          onClick={() => setBuscando(true)}
          className="p-2.5 rounded-full flex-shrink-0"
          style={{ background: COLORS.surface2 }}
          aria-label="Buscar en el calendario"
        >
          <Search size={16} style={{ color: COLORS.text }} />
        </button>
      </div>

      {/* Entrega 3 · F7 (HC F2) — un tercer modo, "Día", y NO sustituye a los otros
          dos: la Agenda de la Fase 3 contesta *"¿qué viene?"* (los próximos días) y
          ésta *"¿cómo es mi sábado?"* (un día entero, con su línea temporal, lo que
          no tiene hora, la raya de AHORA y el siguiente pendiente). Dos preguntas
          distintas, una sola fuente de datos (apartado 25). */}
      <div className="flex gap-1.5">
        <ToggleTab active={vista === 'mes'} onClick={() => setVista('mes')} accent={accent}>Mes</ToggleTab>
        {/* E3 F10 (HC F5, apartado 1) — *"Mes | Semana. Por defecto: Mes. Al
            seleccionar Semana, mostrar la semana correspondiente al día
            seleccionado."* El día seleccionado es el mismo de siempre, así que
            cambiar de vista no pierde el contexto (apartado 19). */}
        <ToggleTab active={vista === 'semana'} onClick={() => setVista('semana')} accent={accent}>Semana</ToggleTab>
        <ToggleTab active={vista === 'dia'} onClick={() => setVista('dia')} accent={accent}>Día</ToggleTab>
        <ToggleTab active={vista === 'agenda'} onClick={() => setVista('agenda')} accent={accent}>Agenda</ToggleTab>
        {/* E3 F13 (HC F8, apartado 1) — *"dentro de Agenda o Calendario, añadir
            acceso 📊 Estadísticas. No crear duplicados."* Aquí, que es donde
            viven los datos que mide. */}
        <ToggleTab active={vista === 'stats'} onClick={() => setVista('stats')} accent={accent}>📊</ToggleTab>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {TIPOS_EVENTO_CALENDARIO.map((t) => (
          <FiltroChip key={t.id} tipo={t} activo={!tiposOcultos.includes(t.id)} accent={accent} onClick={() => toggleTipoOculto(t.id)} />
        ))}
      </div>

      {/* Apartado 24 — *"si desde Calendario se selecciona el 29 de agosto, Agenda
          debe abrir el 29 de agosto. No abrir siempre el día actual."* Por eso el día
          es `seleccionado`, el mismo que marca la rejilla del mes: cambiar de vista
          no pierde el contexto (apartado 21). */}
      {vista === 'dia' && (
        <AgendaDeUnDia
          dia={agendaDelDia(horarioTop || {}, seleccionado, {
            hoy, productividad, calendario, salud, nutricion, calistenia, futbol,
          })}
          titulo={tituloDelDia(seleccionado, hoy)}
          tira={tiraDeDias(seleccionado, { hoy })}
          accent={accent}
          onDia={setSeleccionado}
          onHoy={() => setSeleccionado(hoy)}
          onCompletar={onCompletarTarea}
          onAnadir={() => setCreando(true)}
          onMenu={abrirMenu}
        />
      )}

      {vista === 'stats' && (
        <EstadisticasPlan
          estado={{ calendario, productividad }}
          accent={accent}
          onVerAtrasadas={() => onAbrirModulo && onAbrirModulo('productividad')}
        />
      )}

      {vista === 'semana' && (
        <VistaSemana
          semana={semanaDe(eventosBase, seleccionado, { productividad, hoy })}
          accent={accent}
          onDia={setSeleccionado}
          onEstaSemana={() => setSeleccionado(hoy)}
          onSemana={setSeleccionado}
          onAnadir={() => setCreando(true)}
          onCompletar={completarDesdeSemana}
        />
      )}

      {vista === 'mes' && (
        <>
          <Card>
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => irMes(-1)} aria-label="Mes anterior" className="p-2 rounded-full" style={{ background: COLORS.surface2 }}>
                <ChevronLeft size={16} style={{ color: COLORS.text }} />
              </button>
              <div className="text-center">
                <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{tituloMes(cursor.anio, cursor.mes)}</p>
                {/* E3 F8, apartado 10 — *"Debe estar siempre accesible."* Antes solo salía
                    al estar fuera del mes actual, así que desde el propio agosto no había
                    forma de volver al día de hoy después de tocar el 29. */}
                <button onClick={irAHoy} className="text-xs font-semibold mt-0.5 toque-44" style={{ color: accent }}>Hoy</button>
              </div>
              <button onClick={() => irMes(1)} aria-label="Mes siguiente" className="p-2 rounded-full" style={{ background: COLORS.surface2 }}>
                <ChevronRight size={16} style={{ color: COLORS.text }} />
              </button>
            </div>

            <div key={`${cursor.anio}-${cursor.mes}`} className="calendar-month-grid">
              <div className="grid grid-cols-7 mb-1">
                {DIAS_SEMANA.map((d) => (
                  <p key={d} className="text-center text-[11px] font-semibold" style={{ color: COLORS.textMuted }}>{d}</p>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {celdasMes(cursor.anio, cursor.mes).map((celda, i) => {
                  if (!celda) return <div key={`vacio-${i}`} />;
                  const esSeleccionado = celda.fecha === seleccionado;
                  /* E3 F8, apartado 4 — *"Hoy debe destacarse claramente. No depender
                     únicamente del color."* 🐛 Y había un hueco: el borde solo se
                     pintaba si la celda NO estaba seleccionada, así que al entrar —cuando
                     el día seleccionado ES hoy— la marca desaparecía justo en el caso más
                     común. Ahora `marcaDeHoy` deja siempre algo: borde si se puede,
                     tipografía y un punto bajo el número, con su nombre para el lector. */
                  const marca = marcaDeHoy(celda.fecha, { hoy, seleccionado });
                  // Apartado 14 — un día con tareas ya enseña su punto, aunque no tenga eventos.
                  const tipos = indicadoresDelDia(eventosMes, celda.fecha, productividad);
                  return (
                    <button
                      key={celda.fecha}
                      onClick={() => setSeleccionado(celda.fecha)}
                      aria-label={`${celda.dia}${marca.etiqueta ? `, ${marca.etiqueta}` : ''}`}
                      aria-current={marca.esHoy ? 'date' : undefined}
                      className="aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5"
                      style={{
                        background: esSeleccionado ? accent : 'transparent',
                        border: marca.borde ? `1.5px solid ${accent}` : '1.5px solid transparent',
                      }}
                    >
                      <span
                        className="text-[13px] relative"
                        style={{
                          color: esSeleccionado ? (COLORS.textOnAccent) : COLORS.text,
                          fontWeight: marca.negrita ? 800 : 500,
                          textDecoration: marca.esHoy ? 'underline' : 'none',
                          textUnderlineOffset: '2px',
                        }}
                      >
                        {celda.dia}
                      </span>
                      <div className="flex items-center gap-0.5" style={{ height: 5 }}>
                        {tipos.map((t) => (
                          <span
                            key={t}
                            className="rounded-full"
                            style={{
                              width: 4,
                              height: 4,
                              background: esSeleccionado
                                ? (COLORS.textOnAccent)
                                : (t === 'tarea' ? COLORS.positive : colorDeTipoEvento(t, accent)),
                            }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          <div>
            <div className="flex items-baseline justify-between px-1 mb-2">
              <div>
                <p className="text-xl font-extrabold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{etiquetaDiaCorta(seleccionado)}</p>
                <p className="text-xs font-semibold uppercase" style={{ color: accent, letterSpacing: '0.06em' }}>{etiquetaDiaLarga(seleccionado)}</p>
              </div>
              <button onClick={abrirNuevo} className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl" style={{ background: hexToRgba(accent, 0.14), color: accent }}>
                <Plus size={15} /> Añadir
              </button>
            </div>

            {/* E3 F8, apartado 5 — *"4 tareas · 2 eventos · 1 recordatorio"*: el resumen
                contaba solo eventos, y el enunciado lo escribe con las tareas dentro.
                Al lado, la carga del apartado 23: tres estados, con icono y palabra —
                nunca solo un color (EH F42). */}
            {resumen && (
              <div className="flex items-center gap-2 px-1 mb-3">
                <p className="text-xs" style={{ color: COLORS.textMuted }}>{resumen}</p>
                <span className="text-xs" style={{ color: COLORS.textMuted }}>·</span>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>
                  <span aria-hidden="true">{carga.icono}</span> {carga.nombre}
                </p>
              </div>
            )}

            {eventosDia.length === 0 && tareasDia.length === 0 ? (
              <EmptyHint text="Nada programado este día. Toca «Añadir» para crear un evento o una tarea." />
            ) : (
              <div className="space-y-2">
                {eventosDia.map((ev) => <FilaEvento key={ev.id} ev={ev} accent={accent} onClick={() => abrirEvento(ev)} />)}
                {/* 🚨 Apartado 12 — *"si una tarea tiene fecha, debe aparecer en
                    Calendario… al pulsarla, abrir la tarea original. No crear una
                    copia."* La casilla llama a `toggleTarea` sobre `refId`, y abrirla
                    lleva a Productividad, que es donde vive. */}
                {tareasDia.map((t) => (
                  <FilaTarea
                    key={t.id}
                    tarea={t}
                    accent={accent}
                    onCompletar={onCompletarTarea}
                    onAbrir={() => onAbrirModulo && onAbrirModulo('productividad')}
                  />
                ))}
              </div>
            )}

            {/* E3 F8, apartados 28 y 29 — *"📋 Ver Agenda"* siempre, y *"🏠 Ver Hoy"*
                solo si el día seleccionado es hoy. ⚠️ Ver Agenda abre **el día
                seleccionado**, no hoy (apartados 7 y 24): la Agenda de la F7 ya recibe
                la fecha, así que esto es cambiar de pestaña, no navegar a otro sitio. */}
            <div className="flex gap-2 mt-3">
              {accesosDelDia(seleccionado, hoy).map((a) => (
                <button
                  key={a.id}
                  onClick={() => (a.vista ? setVista(a.vista) : onAbrirModulo && onAbrirModulo(a.tab))}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold px-3 py-2.5 rounded-xl toque-44"
                  style={{ background: COLORS.surface2, color: COLORS.text }}
                >
                  <span aria-hidden="true">{a.icono}</span> {a.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* E3 F8, apartado 38 — *"Tu calendario está libre ✨ / No tienes nada
              programado para este periodo. / ＋ Añadir"*, con sus palabras, y solo
              cuando el MES entero está vacío: un día suelto sin nada ya tiene su
              propio texto arriba. */}
          {mesVacio(eventosMes, cursor.anio, cursor.mes, productividad) && (
            <Card className="text-center space-y-2" style={{ padding: '1.5rem 1rem' }}>
              <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{VACIO_MES.titulo}</p>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>{VACIO_MES.explica}</p>
              <button
                onClick={abrirNuevo}
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl toque-44"
                style={{ background: hexToRgba(accent, 0.14), color: accent }}
              >
                <Plus size={15} /> {VACIO_MES.boton}
              </button>
            </Card>
          )}

          {proximos.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase px-1 mb-2" style={{ color: COLORS.textMuted, letterSpacing: '0.06em' }}>Próximamente</p>
              <div className="space-y-2">
                {proximos.map(({ fecha, resumen: resumenFecha }) => (
                  <button key={fecha} onClick={() => irADia(fecha)} className="w-full text-left">
                    <Card className="flex items-center justify-between gap-3" style={{ padding: '0.75rem 1rem' }}>
                      <p className="text-sm font-semibold flex-shrink-0" style={{ color: COLORS.text }}>{etiquetaProximo(fecha)}</p>
                      <p className="text-xs text-right truncate" style={{ color: COLORS.textMuted }}>{resumenFecha}</p>
                    </Card>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {vista === 'agenda' && (
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textMuted, letterSpacing: '0.06em' }}>Próximos {VENTANA_AGENDA_DIAS} días</p>
            <button onClick={abrirNuevo} className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl" style={{ background: hexToRgba(accent, 0.14), color: accent }}>
              <Plus size={15} /> Añadir
            </button>
          </div>

          {gruposAgenda.length === 0 ? (
            <EmptyHint text="Nada programado en los próximos 60 días (con los filtros de tipo activos)." />
          ) : (
            <div className="space-y-4">
              {gruposAgenda.map(({ fecha, eventos: evsDia }) => (
                <div key={fecha}>
                  <p className="text-xs font-semibold px-1 mb-2" style={{ color: fecha === hoy ? accent : COLORS.textMuted }}>
                    {etiquetaProximo(fecha)} · {etiquetaDiaCorta(fecha)}
                  </p>
                  <div className="space-y-2">
                    {evsDia.map((ev) => <FilaEvento key={ev.id} ev={ev} accent={accent} onClick={() => abrirEvento(ev)} />)}
                  </div>
                </div>
              ))}
              {agendaTruncada && (
                <p className="text-xs text-center" style={{ color: COLORS.textMuted }}>
                  Hay más eventos programados más adelante — usa el buscador para encontrarlos.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {editor && (
        <EditorEvento
          base={editor}
          accent={accent}
          onGuardar={guardar}
          onEliminar={eliminar}
          fechaOcurrencia={ocurrencia}
          onSaltarDia={saltarDia}
          onCerrar={cerrarEditor}
        />
      )}

      {detalle && (
        <DetalleEventoDerivado
          evento={detalle}
          accent={accent}
          onAbrirModulo={onAbrirModulo}
          onCerrar={() => setDetalle(null)}
        />
      )}

      {creando && (
        <QuickAdd
          pantalla="calendario"
          fecha={seleccionado}
          hoy={hoy}
          titulo={tituloDelDia(seleccionado, hoy).texto}
          onElegir={elegirQueCrear}
          onCerrar={() => setCreando(false)}
        />
      )}

      {tareaRapida && (
        <FormularioTarea
          fecha={seleccionado}
          titulo={tituloDelDia(seleccionado, hoy).texto}
          accent={accent}
          onGuardar={guardarTarea}
          onCerrar={() => setTareaRapida(false)}
        />
      )}

      {menu && !cambiando && (
        <MenuElemento
          elemento={menu}
          accent={accent}
          onAccion={accionDelMenu}
          onCerrar={() => setMenu(null)}
        />
      )}

      {menu && cambiando === 'fecha' && (
        <CambiarFecha
          elemento={menu} valor={tareaOriginal(menu)?.fecha || seleccionado} accent={accent}
          onGuardar={guardarCambio} onCerrar={() => setCambiando(null)}
        />
      )}

      {menu && cambiando === 'hora' && (
        <CambiarHora
          elemento={menu} valor={tareaOriginal(menu)?.hora || ''} accent={accent}
          onGuardar={guardarCambio} onCerrar={() => setCambiando(null)}
        />
      )}

      {/* Apartado 19 — el aviso pequeño, con Deshacer donde de verdad se puede. */}
      {aviso && <AvisoAccion accion={aviso} accent={accent} onDeshacer={onDeshacer} onCerrar={() => setAviso(null)} />}

      {buscando && (
        <BuscadorEventos
          eventos={eventosBusqueda}
          accent={accent}
          onSeleccionar={seleccionarDesdeBusqueda}
          onCerrar={() => setBuscando(false)}
        />
      )}
    </div>
  );
}
