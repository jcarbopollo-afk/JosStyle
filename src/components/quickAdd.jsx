/* ===========================================================================
   ENTREGA 3 · FASE 9 (HC F4) — EL ＋ QUE COMPARTEN LAS TRES PANTALLAS
   ===========================================================================

   🚨 **Apartado 30: *"No duplicar formularios."*** La E3 F8 dejó el selector y
   la tarea rápida **dentro de `CalendarView`**, así que Hoy y la Agenda no los
   tenían. Aquí están una sola vez, y las tres pantallas usan estos componentes.

   ⚠️ Todo va con `createPortal` (regla 3): un `fixed inset-0` dentro del
   contenedor de `.module-enter` se ancla a él y aparece "abajo del todo".

   ⚠️ Y `TextInput` reparte sus props tal cual, así que `onChange` recibe el
   **evento**, no el valor. `onChange={setTexto}` guarda el evento entero en el
   estado, la pantalla se pinta perfecta y no funciona (pasó en EH F36 y F37).
   =========================================================================== */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Check, Undo2 } from 'lucide-react';
import { COLORS } from '../tokens';
import {
  contextoDeAdd, horaParaTipo, tipoQuickAdd,
  validarTarea, validarEvento, validarApunte,
  accionesDe, avisoDe, SEGUNDOS_AVISO,
} from '../lib/accionesHoyAgenda';
import { Card, Field, TextInput, PrimaryButton } from './ui';

/* ── La hoja inferior que comparten todos (apartado 33) ────────────────────
   *"Bottom sheets en móvil… no abrir cinco pantallas para crear una tarea."*
   ⚠️ Y el apartado 36 pide **Escape para cerrar**. */
function Hoja({ titulo, sub, onCerrar, children }) {
  useEffect(() => {
    const alPulsar = (ev) => { if (ev.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [onCerrar]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <div
        className="w-full max-w-md rounded-t-3xl p-5 space-y-4"
        style={{ background: COLORS.surface, paddingBottom: 'calc(var(--safe-bottom) + 1.25rem)' }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{titulo}</p>
            {sub && <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>{sub}</p>}
          </div>
          <button onClick={onCerrar} className="p-2 rounded-full flex-shrink-0 toque-44" style={{ background: COLORS.surface2 }} aria-label="Cerrar">
            <X size={16} style={{ color: COLORS.text }} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/* El aviso de que un formulario no puede guardarse todavía. Apartado 21:
   *"nunca perder información silenciosamente"*, y EH F62: un error dice **qué
   corregir**, nunca "Error" a secas. El texto lo pone `accionesHoyAgenda.js`. */
function Motivo({ texto }) {
  if (!texto) return null;
  return (
    <p className="text-xs" style={{ color: COLORS.negative }} role="alert">{texto}</p>
  );
}

/* ── ＋ Añadir: el menú (apartados 1, 2, 3 y 4) ────────────────────────────
   Las opciones y la fecha ya vienen decididas por `contextoDeAdd`: esta
   pantalla solo las pinta. */
export function QuickAdd({ pantalla, fecha, hora, hoy, titulo, onElegir, onCerrar }) {
  const contexto = contextoDeAdd(pantalla, { fecha, hora, hoy });
  return (
    <Hoja titulo="Añadir" sub={titulo} onCerrar={onCerrar}>
      {contexto.opciones.map((t) => (
        <button
          key={t.id}
          onClick={() => onElegir(t.id, contexto)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left toque-44"
          style={{ background: COLORS.surface2 }}
        >
          <span className="text-lg" aria-hidden="true">{t.icono}</span>
          <span className="text-sm font-semibold" style={{ color: COLORS.text }}>{t.nombre}</span>
        </button>
      ))}
    </Hoja>
  );
}

/* ── Tarea rápida (apartado 6) ─────────────────────────────────────────────
   *"Mínimo: título. Opcional: hora, prioridad, duración. No crear formularios
   gigantes."* Así que dos campos y el botón; la prioridad se edita en
   Productividad, que es donde vive la tarea. */
export function FormularioTarea({ fecha, hora = '', titulo, accent, onGuardar, onCerrar }) {
  const [texto, setTexto] = useState('');
  const [h, setH] = useState(hora);
  const motivo = validarTarea({ texto, fecha, hora: h });
  return (
    <Hoja titulo="Nueva tarea" sub={titulo} onCerrar={onCerrar}>
      <Field label="Título">
        <TextInput value={texto} onChange={(ev) => setTexto(ev.target.value)} placeholder="Estudiar Biología" />
      </Field>
      <Field label="Hora (opcional)">
        <TextInput type="time" value={h} onChange={(ev) => setH(ev.target.value)} />
      </Field>
      <Motivo texto={texto ? motivo : null} />
      <PrimaryButton accent={accent} disabled={!!motivo} onClick={() => onGuardar({ texto: texto.trim(), fecha, hora: h })}>
        Añadir
      </PrimaryButton>
    </Hoja>
  );
}

/* ── Evento rápido (apartado 5) ────────────────────────────────────────────
   *"Campos mínimos: título, hora inicio, hora fin."* Lo demás —ubicación,
   notas, repetición— sigue en el editor completo del Calendario, que es el que
   el enunciado llama *"Más opciones"*: escribirlo otra vez aquí sería el
   formulario duplicado del apartado 30. */
export function FormularioEvento({ fecha, hora = '', titulo, tipo = 'personal', accent, onGuardar, onCerrar }) {
  const [tit, setTit] = useState('');
  const [inicio, setInicio] = useState(hora || '09:00');
  const [fin, setFin] = useState('');
  const motivo = validarEvento({ titulo: tit, fecha, horaInicio: inicio, horaFin: fin });
  const esRecordatorio = tipo === 'recordatorio';
  return (
    <Hoja titulo={esRecordatorio ? 'Nuevo recordatorio' : 'Nuevo evento'} sub={titulo} onCerrar={onCerrar}>
      <Field label="Título">
        <TextInput value={tit} onChange={(ev) => setTit(ev.target.value)} placeholder={esRecordatorio ? 'Tomar la pastilla' : 'Entrenamiento'} />
      </Field>
      <Field label="Hora de inicio">
        <TextInput type="time" value={inicio} onChange={(ev) => setInicio(ev.target.value)} />
      </Field>
      {/* ⚠️ Un recordatorio es un instante, no un rato: no se le pide hora de fin. */}
      {!esRecordatorio && (
        <Field label="Hora de fin (opcional)">
          <TextInput type="time" value={fin} onChange={(ev) => setFin(ev.target.value)} />
        </Field>
      )}
      <Motivo texto={tit ? motivo : null} />
      <PrimaryButton
        accent={accent}
        disabled={!!motivo}
        onClick={() => onGuardar({ titulo: tit.trim(), fecha, horaInicio: inicio, horaFin: esRecordatorio ? '' : fin, tipo })}
      >
        {esRecordatorio ? 'Crear recordatorio' : 'Crear evento'}
      </PrimaryButton>
    </Hoja>
  );
}

/* ── Apunte rápido (apartado 7) ────────────────────────────────────────────
   *"Esta debe ser una de las acciones más rápidas. Campo: «Escribe algo…».
   Guardar. Nada más."* Un campo y un botón: ni categoría, ni prioridad. */
export function FormularioApunte({ titulo, accent, onGuardar, onCerrar }) {
  const [texto, setTexto] = useState('');
  const motivo = validarApunte({ texto });
  return (
    <Hoja titulo="Apunte rápido" sub={titulo} onCerrar={onCerrar}>
      <Field label="Escribe algo…">
        <TextInput value={texto} onChange={(ev) => setTexto(ev.target.value)} placeholder="Preguntar lo del proyecto" />
      </Field>
      <PrimaryButton accent={accent} disabled={!!motivo} onClick={() => onGuardar(texto.trim())}>Guardar</PrimaryButton>
    </Hoja>
  );
}

/* ── El ••• de un elemento (apartado 8) ────────────────────────────────────
   *"Mostrar solamente las acciones relevantes… no mostrar opciones inútiles."*
   Qué acciones tiene cada tipo lo decide `accionesDe`, no esta pantalla. */
export function MenuElemento({ elemento, accent, onAccion, onCerrar }) {
  const acciones = accionesDe(elemento);
  return (
    <Hoja titulo={elemento.titulo || 'Elemento'} sub={tipoQuickAdd(elemento.tipo)?.nombre || null} onCerrar={onCerrar}>
      {acciones.length === 0 ? (
        <p className="text-xs" style={{ color: COLORS.textMuted }}>
          Esto se gestiona en su propio módulo: aquí solo se ve.
        </p>
      ) : acciones.map((a) => (
        <button
          key={a.id}
          onClick={() => onAccion(a.id, elemento)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left toque-44"
          style={{ background: COLORS.surface2 }}
        >
          <span className="text-base" aria-hidden="true">{a.icono}</span>
          <span className="text-sm font-semibold" style={{ color: a.destructiva ? COLORS.negative : COLORS.text }}>{a.nombre}</span>
        </button>
      ))}
    </Hoja>
  );
}

/* ── Cambiar fecha / cambiar hora (apartados 11 y 12) ──────────────────────
   Un campo y guardar. ⚠️ **Y en móvil no se depende de arrastrar** (apartado 21
   de la F8 y EH F50): esto ES el "Cambiar fecha" que el enunciado exige que
   exista al lado del drag & drop. */
export function CambiarFecha({ elemento, valor, accent, onGuardar, onCerrar }) {
  const [fecha, setFecha] = useState(valor || '');
  return (
    <Hoja titulo="Cambiar fecha" sub={elemento?.titulo} onCerrar={onCerrar}>
      <Field label="Nueva fecha">
        <TextInput type="date" value={fecha} onChange={(ev) => setFecha(ev.target.value)} />
      </Field>
      <PrimaryButton accent={accent} disabled={!fecha} onClick={() => onGuardar(fecha)}>Guardar</PrimaryButton>
    </Hoja>
  );
}

export function CambiarHora({ elemento, valor, accent, onGuardar, onCerrar }) {
  const [hora, setHora] = useState(valor || '');
  return (
    <Hoja titulo="Cambiar hora" sub={elemento?.titulo} onCerrar={onCerrar}>
      <Field label="Nueva hora">
        <TextInput type="time" value={hora} onChange={(ev) => setHora(ev.target.value)} />
      </Field>
      {/* ⚠️ Quitar la hora es una operación válida: la tarea pasa a "Sin hora". */}
      <button onClick={() => onGuardar('')} className="w-full text-xs font-semibold py-2 toque-44" style={{ color: COLORS.textMuted }}>
        Quitar la hora
      </button>
      <PrimaryButton accent={accent} onClick={() => onGuardar(hora)}>Guardar</PrimaryButton>
    </Hoja>
  );
}

/* ── El aviso pequeño, con Deshacer (apartados 14 y 19) ────────────────────

   *"No usar modales grandes para acciones normales."* Una línea abajo, encima
   de la barra de pestañas, que se va sola.

   ⚠️ **Deshacer solo sale donde de verdad se puede deshacer** (`avisoDe`), y
   quien deshace es el histórico de diez pasos de `App.jsx`: aquí no hay una
   segunda pila. Ofrecerlo sin poder cumplirlo sería un control decorativo
   (regla 8). */
export function AvisoAccion({ accion, accent, onDeshacer, onCerrar }) {
  const aviso = avisoDe(accion);
  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(onCerrar, SEGUNDOS_AVISO * 1000);
    return () => clearTimeout(t);
  }, [accion]);

  if (!aviso) return null;
  return createPortal(
    <div
      className="fixed left-0 right-0 z-40 flex justify-center px-4 pointer-events-none"
      style={{ bottom: 'calc(var(--safe-bottom) + 5.5rem)' }}
      role="status"
      aria-live="polite"
    >
      <div
        className="flex items-center gap-3 px-4 py-2.5 rounded-full shadow-lg pointer-events-auto"
        style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}
      >
        <Check size={15} style={{ color: accent }} aria-hidden="true" />
        <span className="text-sm font-semibold" style={{ color: COLORS.text }}>{aviso.texto}</span>
        {aviso.deshacer && onDeshacer && (
          <button onClick={() => { onDeshacer(); onCerrar(); }} className="flex items-center gap-1 text-sm font-bold toque-44" style={{ color: accent }}>
            <Undo2 size={14} aria-hidden="true" /> Deshacer
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* ── El botón ＋ en sí (apartado 34) ───────────────────────────────────────
   *"En móvil, ＋ debe ser fácil de alcanzar."* Se coloca donde cada pantalla
   lo tenga; lo que comparte es el aspecto y la zona de toque. */
export function BotonAnadir({ accent, onClick, texto = 'Añadir' }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl toque-44"
      style={{ background: COLORS.surface2, color: accent }}
      aria-label={texto}
    >
      <Plus size={15} /> {texto}
    </button>
  );
}
