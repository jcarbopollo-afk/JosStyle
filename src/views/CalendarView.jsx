import React, { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, X, Trash2, Clock, MapPin, Lock, ExternalLink, Search,
  Target, Flame, Repeat, GraduationCap, Dumbbell, Star, Bell, Circle,
} from 'lucide-react';
import { COLORS, TIPOS_EVENTO_CALENDARIO, colorDeTipoEvento, FRECUENCIAS_RECURRENCIA } from '../tokens';
import { uid, todayISO, addDays, hexToRgba } from '../lib/helpers';
import { celdasMes, eventosDelDia, tiposDelDia, resumenDelDia, eventosFuturos, expandirRecurrentes, isoDeFecha, diasDelMes } from '../lib/calendario';
import { NOMBRES_ORIGEN } from '../lib/calendarioIntegracion';
import { Card, SectionTitle, Field, TextInput, Select, Textarea, PrimaryButton, GhostBtn, ToggleTab, EmptyHint } from '../components/ui';

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

function nuevoEventoBase(fechaISO) {
  return {
    id: null,
    titulo: '',
    tipo: 'personal',
    fecha: fechaISO,
    todoElDia: false,
    horaInicio: '09:00',
    horaFin: '',
    ubicacion: '',
    notas: '',
    recurrencia: null, // Fase 3: { frecuencia: 'diaria'|'semanal'|'mensual'|'anual', hasta: ISO|null }
    estado: 'activo', // Preparado, sin lógica todavía.
    origen: 'calendario',
    origenId: null,
  };
}

// Editor de evento: mismo formulario sirve para crear y editar (spec apartados 7-8) — solo para
// eventos creados a mano en el propio calendario (`origen: 'calendario'`). Rápido a propósito:
// solo título/tipo/fecha/hora son visibles siempre; ubicación, notas y repetición están ahí pero
// no obligan a nadie a rellenar diez campos para anotar algo simple.
function EditorEvento({ base, accent, onGuardar, onEliminar, onCerrar }) {
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

  return (
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
          <div className="flex-1">
            <PrimaryButton accent={accent} disabled={!ev.titulo.trim() || !ev.fecha} onClick={guardar}>
              {esNuevo ? 'Crear evento' : 'Guardar cambios'}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

// Fase 2 — detalle de un evento de solo lectura (viene de Objetivos/Estudios/Entrenamiento/
// Productividad, ver calendarioIntegracion.js). No se puede editar ni eliminar desde aquí — el
// calendario no es dueño de ese dato, solo lo muestra (spec: "vinculación con el módulo que
// originó cada evento... si procede, poder abrir el elemento original desde el calendario").
function DetalleEventoDerivado({ evento, accent, onAbrirModulo, onCerrar }) {
  const nombreOrigen = NOMBRES_ORIGEN[evento.origen] || evento.origen;
  return (
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
    </div>
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

  return (
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
    </div>
  );
}

export default function CalendarView({ calendario, derivados, onAdd, onUpdate, onDelete, onAbrirModulo, accent }) {
  const hoy = todayISO();
  const [cursor, setCursor] = useState(() => ({ anio: Number(hoy.slice(0, 4)), mes: Number(hoy.slice(5, 7)) - 1 }));
  const [seleccionado, setSeleccionado] = useState(hoy);
  const [editor, setEditor] = useState(null); // null | evento propio (nuevo o existente)
  const [detalle, setDetalle] = useState(null); // null | evento de solo lectura
  const [vista, setVista] = useState('mes'); // Fase 3: 'mes' | 'agenda'
  const [tiposOcultos, setTiposOcultos] = useState([]); // Fase 3: filtros por tipo
  const [buscando, setBuscando] = useState(false); // Fase 3: buscador

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
  const resumen = resumenDelDia(eventosMes, seleccionado);

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

  const abrirNuevo = () => setEditor(nuevoEventoBase(seleccionado));
  // Fase 3 — una ocurrencia de un evento recurrente (`eventoOrigenId`) siempre abre/edita el
  // evento REAL guardado (la serie completa), nunca una copia virtual de un día concreto.
  const resolverEventoReal = (ev) => {
    if (ev.eventoOrigenId) {
      const original = (calendario.eventos || []).find((x) => x.id === ev.eventoOrigenId);
      if (original) return original;
    }
    return ev;
  };
  const abrirEvento = (evRaw) => {
    const ev = resolverEventoReal(evRaw);
    if (ev.soloLectura) setDetalle(ev); else setEditor(ev);
  };
  const cerrarEditor = () => setEditor(null);

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

      <div className="flex gap-1.5">
        <ToggleTab active={vista === 'mes'} onClick={() => setVista('mes')} accent={accent}>Mes</ToggleTab>
        <ToggleTab active={vista === 'agenda'} onClick={() => setVista('agenda')} accent={accent}>Agenda</ToggleTab>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {TIPOS_EVENTO_CALENDARIO.map((t) => (
          <FiltroChip key={t.id} tipo={t} activo={!tiposOcultos.includes(t.id)} accent={accent} onClick={() => toggleTipoOculto(t.id)} />
        ))}
      </div>

      {vista === 'mes' && (
        <>
          <Card>
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => irMes(-1)} aria-label="Mes anterior" className="p-2 rounded-full" style={{ background: COLORS.surface2 }}>
                <ChevronLeft size={16} style={{ color: COLORS.text }} />
              </button>
              <div className="text-center">
                <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{tituloMes(cursor.anio, cursor.mes)}</p>
                {!(cursor.anio === Number(hoy.slice(0, 4)) && cursor.mes === Number(hoy.slice(5, 7)) - 1) && (
                  <button onClick={irAHoy} className="text-xs font-semibold mt-0.5" style={{ color: accent }}>Volver a hoy</button>
                )}
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
                  const esHoy = celda.fecha === hoy;
                  const esSeleccionado = celda.fecha === seleccionado;
                  const tipos = tiposDelDia(eventosMes, celda.fecha);
                  return (
                    <button
                      key={celda.fecha}
                      onClick={() => setSeleccionado(celda.fecha)}
                      className="aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5"
                      style={{
                        background: esSeleccionado ? accent : 'transparent',
                        border: esHoy && !esSeleccionado ? `1.5px solid ${accent}` : '1.5px solid transparent',
                      }}
                    >
                      <span
                        className="text-[13px]"
                        style={{
                          color: esSeleccionado ? (COLORS.textOnAccent) : COLORS.text,
                          fontWeight: esHoy || esSeleccionado ? 800 : 500,
                        }}
                      >
                        {celda.dia}
                      </span>
                      <div className="flex items-center gap-0.5" style={{ height: 5 }}>
                        {tipos.map((t) => (
                          <span
                            key={t}
                            className="rounded-full"
                            style={{ width: 4, height: 4, background: esSeleccionado ? (COLORS.textOnAccent) : colorDeTipoEvento(t, accent) }}
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

            {resumen && <p className="text-xs px-1 mb-3" style={{ color: COLORS.textMuted }}>{resumen}</p>}

            {eventosDia.length === 0 ? (
              <EmptyHint text="Nada programado este día. Toca «Añadir» para crear un evento." />
            ) : (
              <div className="space-y-2">
                {eventosDia.map((ev) => <FilaEvento key={ev.id} ev={ev} accent={accent} onClick={() => abrirEvento(ev)} />)}
              </div>
            )}
          </div>

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
