/* ===========================================================================
   ENTREGA 4 · FASE 7/45 — EL ENTRENAMIENTO EN VIVO, LA PANTALLA

   El criterio de finalización es explícito: *"El usuario debe sentir que está
   utilizando un tracker de entrenamiento real, no una demo."* Y el apartado 1
   lo remata: *"No quiero una maqueta. Los datos introducidos deben guardarse
   realmente durante la sesión."*

   🚨 **ESTA PANTALLA NO CALCULA NADA.** El cronómetro, el progreso, el estado
   de cada ejercicio del carrusel, las filas de la tabla, el descanso y qué pasa
   al marcar una serie salen de `src/lib/entrenamiento.js`. Aquí solo se pinta y
   se llama.

   🚨 **Y LA SESIÓN NO VIVE EN ESTA PANTALLA: VIVE EN `fitness.sesiones`.** El
   apartado 28 pide *"una fuente de verdad única"* y el 29 *"no esperar
   únicamente al final para guardar"*: cada cambio —una serie marcada, un peso,
   una nota, un ejercicio sustituido— llama a `onGuardar(sesion)`, que escribe
   por la puerta de siempre. De ahí sale gratis la recuperación del apartado 30:
   la sesión activa **es** el dato, no un rastro aparte.

   ⚠️ **Lo único que es estado de pantalla** es qué panel está abierto, el
   descanso y el texto que se está tecleando en un campo (EH F40). Un descanso
   de 90 segundos no tiene sentido recuperarlo tres horas después.

   ⚠️ **Mobile first de verdad** (apartado 33): botones grandes, `inputMode`
   numérico, la tabla en una rejilla de cuatro columnas que cabe en 375 px y la
   barra de acciones a una mano.
   =========================================================================== */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, Check, Plus, X, Timer, Repeat, BookOpen,
  StickyNote, Pause, Play, RotateCcw, Dumbbell, Undo2,
} from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import {
  Card, SectionTitle, GhostBtn, PrimaryButton, Textarea, EmptyHint,
} from '../components/ui';
import { iconoDeGrupo } from '../components/iconosFitness';
import EjerciciosView, { DetalleEjercicio } from './EjerciciosView';
import { ejercicioPorId } from '../lib/ejercicios';
import {
  ejerciciosDeSesion, ejercicioActual, duracionSesion, reloj,
  irAEjercicio, siguienteEjercicio, anteriorEjercicio,
  editarSerie, marcarSerie, anadirSerie, quitarSerie, recuperarSerie,
  sustituirEjercicio, sustitutosSugeridos, notaDeEjercicio,
  crearDescanso, restanteDescanso, descansoTerminado, pausarDescanso,
  reanudarDescanso, reiniciarDescanso, vibrarSiSePuede, EVENTO_FIN_DESCANSO,
  AVISO_SALIR, AVISO_TERMINAR, AVISO_DESCARTAR, terminarSesion,
  fichaDeEjercicio, filasDeSeries, progresoSesion, carruselDeSesion,
  avisoDeRecuperacion,
} from '../lib/entrenamiento';
/* 🚨 Se EMITE al bus; ninguna pantalla reproduce por su cuenta (SO F1). */
import { emitir } from '../lib/eventos';

/* ⚠️ Cada cuánto se redibuja el reloj. **Solo redibuja**: la cuenta la lleva
   `duracionSesion()` restando marcas de tiempo (E3 F25). Si el iPhone congela
   la pestaña, al volver el número sale bien porque nunca dependió de esto. */
const TIC_MS = 500;

/* ── El reloj que se redibuja solo ─────────────────────────────────────────
   ⚠️ No es un contador: `ahora` solo existe para forzar el repintado. */
function useAhora(activo, ms = TIC_MS) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    if (!activo) return undefined;
    const t = setInterval(() => setAhora(Date.now()), ms);
    return () => clearInterval(t);
  }, [activo, ms]);
  return ahora;
}

/* ── La cabecera (apartados 5 y 6) ─────────────────────────────────────────
   Izquierda: salir **sin terminar**. Centro: nombre y cronómetro. Derecha:
   Terminar, que pregunta (apartado 32). */
export function CabeceraSesion({ nombre, tiempo, progreso, accent, onSalir, onTerminar }) {
  return (
    <div
      className="sticky top-0 z-20 -mx-4 px-4 py-2.5 accion-superior"
      style={{ background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onSalir}
          aria-label="Salir del entrenamiento"
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 toque-44 active:scale-90"
          style={{ background: hexToRgba(COLORS.border, 0.45), color: COLORS.text }}
        >
          <ChevronLeft size={20} />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <p className="text-xs font-bold truncate" style={{ color: COLORS.textMuted }}>{nombre}</p>
          <p
            className="text-xl font-extrabold leading-tight tabular-nums"
            style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}
          >
            {tiempo}
          </p>
        </div>

        <button
          onClick={onTerminar}
          aria-label="Terminar el entrenamiento"
          className="h-10 px-3.5 rounded-xl text-sm font-bold shrink-0 toque-44 active:scale-95"
          style={{ background: accent, color: COLORS.textOnAccent }}
        >
          Terminar
        </button>
      </div>

      {/* El progreso del apartado 17, que sube al marcar una serie. */}
      {progreso.total > 0 && (
        <div className="mt-2">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: hexToRgba(COLORS.border, 0.7) }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progreso.porcentaje ?? 0}%`, background: accent }}
            />
          </div>
          <p className="text-[11px] mt-1 text-center" style={{ color: COLORS.textMuted }}>
            {progreso.hechas} de {progreso.total} series
          </p>
        </div>
      )}
    </div>
  );
}

/* ── El carrusel (apartados 8 y 9) ─────────────────────────────────────────
   ⚠️ Es una fila con desplazamiento horizontal de verdad (`overflow-x-auto`),
   que es lo que pide el apartado 9 para poder deslizar; y cada elemento es un
   botón, así que también se llega tocando y con el lector de pantalla. */
export function CarruselEjercicios({ items, accent, onElegir }) {
  const refs = useRef({});
  const actual = items.find((i) => i.estado === 'actual');

  /* ⚠️ Al cambiar de ejercicio, el carrusel se lleva el actual a la vista: si
     no, el número 7 de un plan de diez se queda fuera de la pantalla y parece
     que no está. */
  useEffect(() => {
    const el = actual ? refs.current[actual.id] : null;
    if (el && el.scrollIntoView) {
      try { el.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch { /* da igual */ }
    }
  }, [actual ? actual.id : null]);

  if (!items.length) return null;
  return (
    <div className="-mx-4 px-4 overflow-x-auto">
      <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
        {items.map((i) => {
          const esActual = i.estado === 'actual';
          const hecho = i.estado === 'completado';
          return (
            <button
              key={i.id}
              ref={(el) => { refs.current[i.id] = el; }}
              onClick={() => onElegir(i.indice)}
              aria-label={`Ejercicio ${i.numero}: ${i.nombre}`}
              aria-current={esActual ? 'true' : undefined}
              className="rounded-2xl px-3 py-2 text-left shrink-0 toque-44 active:scale-95"
              style={{
                width: 132,
                background: esActual ? hexToRgba(accent, 0.16) : COLORS.surface,
                border: `1px solid ${esActual ? accent : COLORS.border}`,
              }}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{
                    background: hecho ? accent : hexToRgba(COLORS.border, 0.6),
                    color: hecho ? COLORS.textOnAccent : COLORS.textMuted,
                  }}
                >
                  {hecho ? <Check size={12} /> : i.numero}
                </span>
                {/* El color nunca va solo (EH F42): el estado lleva palabra. */}
                <span className="text-[10px] font-bold uppercase tracking-wide truncate" style={{ color: esActual ? accent : COLORS.textMuted }}>
                  {esActual ? 'Ahora' : hecho ? 'Hecho' : 'Pendiente'}
                </span>
              </div>
              <p className="text-xs font-bold mt-1 leading-tight line-clamp-2" style={{ color: COLORS.text }}>
                {i.nombre}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── El hueco anatómico (apartado 11) ──────────────────────────────────────
   🚨 *"Si todavía no existe un recurso visual real: usar un placeholder
   elegante. NO inventar una URL externa."* Así que se dibuja **el icono del
   grupo muscular que trabaja**, que es un dato real del catálogo, y se dice que
   la ilustración llega más adelante. Ni un `<img>` a ninguna parte. */
export function HuecoAnatomico({ ficha, accent }) {
  const grupo = ficha?.musculos?.[0] || null;
  const Icono = iconoDeGrupo(grupo ? grupo.id : null);
  const hayRecurso = !!(ficha?.tutorial?.recursos?.anatomia);
  return (
    <div
      className="rounded-2xl flex flex-col items-center justify-center py-5"
      style={{ background: hexToRgba(accent, 0.08), border: `1px solid ${hexToRgba(accent, 0.25)}` }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: hexToRgba(accent, 0.16), color: accent }}
      >
        <Icono size={32} />
      </div>
      {ficha?.musculos?.length > 0 && (
        <p className="text-xs font-semibold mt-2.5 text-center px-4" style={{ color: COLORS.text }}>
          {ficha.musculos.map((m) => `${m.nombre} ${m.porcentaje}%`).join(' · ')}
        </p>
      )}
      {!hayRecurso && (
        <p className="text-[11px] mt-1 text-center px-6" style={{ color: COLORS.textMuted }}>
          Todavía no hay ilustración anatómica de este ejercicio.
        </p>
      )}
    </div>
  );
}

/* ── La tabla de series (apartados 13 a 21) ────────────────────────────────
   SERIE | KG | REPES | ✓, en una rejilla que cabe en un iPhone pequeño.

   ⚠️ Los campos llevan **su propio texto mientras se escribe** y confirman al
   salir: escribir «62.5» carácter a carácter contra un número guardado
   convertiría el «62.» intermedio en un 62. */
function CampoNumero({ valor, placeholder, onConfirmar, etiqueta, decimal = false }) {
  const [texto, setTexto] = useState(valor === null || valor === undefined ? '' : String(valor));
  const [tocando, setTocando] = useState(false);

  /* Si el valor cambia por fuera (sustituir un ejercicio le quita el peso), el
     campo lo refleja — salvo mientras él lo está escribiendo. */
  useEffect(() => {
    if (!tocando) setTexto(valor === null || valor === undefined ? '' : String(valor));
  }, [valor, tocando]);

  /* 🚨 **SE GUARDA AL ESCRIBIR, NO AL SALIR DEL CAMPO** (apartado 29: *"Los
     cambios importantes deben persistirse […] inmediatamente: peso,
     repeticiones"*).

     Confirmar solo en el `blur` parecía suficiente y **no lo es en un móvil**:
     si escribe 62,5 y bloquea el iPhone sin tocar nada más, el campo nunca
     pierde el foco y **ese peso no llega a guardarse jamás**. Lo destapó el
     recorrido en Chromium —el campo decía 62.5 y lo guardado era `null`— y de
     paso enseñó por qué: React escucha `focusout`, no `blur`.

     ⚠️ Y el texto de lo que se está escribiendo **sigue siendo de la pantalla**:
     un «62,» a medio teclear se pinta tal cual y se guarda como 62; al siguiente
     carácter pasa a 62,5. Sin ese buffer, el punto decimal desaparecería al
     escribirlo. */
  const confirmar = (valor) => {
    const v = String(valor ?? '').trim();
    onConfirmar(v === '' ? null : v.replace(',', '.'));
  };

  return (
    <input
      type="text"
      /* Apartados 15 y 16: teclado numérico, y decimales solo donde tienen
         sentido. En un iPhone `decimal` saca el punto y `numeric` no. */
      inputMode={decimal ? 'decimal' : 'numeric'}
      value={texto}
      aria-label={etiqueta}
      placeholder={placeholder}
      onFocus={() => setTocando(true)}
      onChange={(ev) => { setTexto(ev.target.value); confirmar(ev.target.value); }}
      onBlur={(ev) => { setTocando(false); confirmar(ev.target.value); }}
      onKeyDown={(ev) => { if (ev.key === 'Enter') ev.currentTarget.blur(); }}
      className="w-full h-11 rounded-xl text-center text-base font-bold outline-none toque-44"
      style={{
        background: COLORS.surface2,
        border: `1px solid ${COLORS.border}`,
        color: COLORS.text,
      }}
    />
  );
}

export function TablaSeries({ filas, accent, onEditar, onMarcar, onQuitar, onRecuperar, onAnadir }) {
  return (
    <div>
      <div className="grid gap-2 px-1 pb-1.5" style={{ gridTemplateColumns: '2.2rem 1fr 1fr 2.75rem' }}>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Serie</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: COLORS.textMuted }}>Kg</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: COLORS.textMuted }}>
          {filas[0]?.medida?.id === 'tiempo' ? 'Seg' : 'Repes'}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: COLORS.textMuted }}>✓</span>
      </div>

      <div className="space-y-1.5">
        {filas.map((f) => {
          const omitida = f.estado === 'omitida';
          const hecha = f.estado === 'hecha';
          const porTiempo = f.medida.id === 'tiempo';
          return (
            <div
              key={f.id}
              className="grid gap-2 items-center rounded-2xl px-1.5 py-1.5"
              style={{
                background: hecha ? hexToRgba(accent, 0.1) : 'transparent',
                border: `1px solid ${hecha ? hexToRgba(accent, 0.35) : 'transparent'}`,
                gridTemplateColumns: '2.2rem 1fr 1fr 2.75rem',
                opacity: omitida ? 0.5 : 1,
              }}
            >
              <div className="min-w-0">
                <p className="text-sm font-extrabold" style={{ color: omitida ? COLORS.textMuted : COLORS.text }}>
                  {f.numero ?? '—'}
                </p>
                {/* 🚨 Apartado 20: lo PLANIFICADO se enseña y no se confunde con
                    lo realizado. «8–12», no «8». */}
                {f.planificado && (
                  <p className="text-[10px] leading-none" style={{ color: COLORS.textMuted }}>{f.planificado}</p>
                )}
              </div>

              {omitida ? (
                <p className="text-xs col-span-2 text-center" style={{ color: COLORS.textMuted }}>Serie omitida</p>
              ) : (
                <>
                  <CampoNumero
                    valor={f.hecho.peso}
                    placeholder={f.plan.peso !== null && f.plan.peso !== undefined ? String(f.plan.peso) : '—'}
                    etiqueta={`Peso de la serie ${f.numero}`}
                    decimal
                    onConfirmar={(v) => onEditar(f.id, { peso: v })}
                  />
                  <CampoNumero
                    valor={porTiempo ? f.hecho.duracion : f.hecho.reps}
                    placeholder={f.planificado || '—'}
                    etiqueta={porTiempo ? `Segundos de la serie ${f.numero}` : `Repeticiones de la serie ${f.numero}`}
                    onConfirmar={(v) => onEditar(f.id, porTiempo ? { duracion: v } : { reps: v })}
                  />
                </>
              )}

              {omitida ? (
                <button
                  onClick={() => onRecuperar(f.id)}
                  aria-label={`Recuperar la serie omitida`}
                  className="w-11 h-11 rounded-xl flex items-center justify-center toque-44 active:scale-90"
                  style={{ background: hexToRgba(COLORS.border, 0.5), color: COLORS.textMuted }}
                >
                  <Undo2 size={16} />
                </button>
              ) : (
                <button
                  onClick={() => onMarcar(f.id, !hecha)}
                  aria-label={hecha ? `Desmarcar la serie ${f.numero}` : `Marcar la serie ${f.numero} como hecha`}
                  aria-pressed={hecha}
                  className="w-11 h-11 rounded-xl flex items-center justify-center toque-44 active:scale-90"
                  style={{
                    background: hecha ? accent : hexToRgba(COLORS.border, 0.5),
                    color: hecha ? COLORS.textOnAccent : COLORS.textMuted,
                  }}
                >
                  <Check size={18} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 mt-3 flex-wrap">
        <GhostBtn icon={Plus} onClick={onAnadir}>Añadir serie</GhostBtn>
        {/* Apartado 19 — quitar la última. ⚠️ Una del plan se **omite** y una
            añadida se va; lo decide la librería, no la pantalla. */}
        {filas.length > 1 && (
          <GhostBtn icon={X} onClick={() => onQuitar(filas[filas.length - 1].id)}>
            {filas[filas.length - 1].seQuita ? 'Quitar la última' : 'Omitir la última'}
          </GhostBtn>
        )}
      </div>
    </div>
  );
}

/* ── El descanso (apartados 23, 24 y 25) ───────────────────────────────────
   🚨 *"No quiero que el descanso bloquee al usuario. Debe poder: cerrar,
   saltar, modificar."* Así que es una **barra**, no un overlay: la tabla sigue
   ahí debajo y se puede seguir registrando mientras corre. */
export function BarraDescanso({ descanso, ahora, accent, onPausar, onReanudar, onReiniciar, onCerrar, onSumar }) {
  if (!descanso) return null;
  const restante = restanteDescanso(descanso, ahora);
  const pausado = !!descanso.pausadoEn;
  const fin = restante === 0;
  return (
    <div
      className="rounded-2xl px-3 py-2.5 flex items-center gap-2"
      style={{
        background: fin ? hexToRgba(accent, 0.16) : COLORS.surface,
        border: `1px solid ${fin ? accent : COLORS.border}`,
      }}
    >
      <Timer size={18} style={{ color: accent }} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
          {fin ? 'Descanso terminado' : pausado ? 'Descanso en pausa' : 'Descanso'}
        </p>
        <p className="text-lg font-extrabold leading-tight tabular-nums" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {reloj(restante)}
        </p>
      </div>

      {!fin && (
        <button
          onClick={pausado ? onReanudar : onPausar}
          aria-label={pausado ? 'Reanudar el descanso' : 'Pausar el descanso'}
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 toque-44 active:scale-90"
          style={{ background: hexToRgba(COLORS.border, 0.5), color: COLORS.text }}
        >
          {pausado ? <Play size={16} /> : <Pause size={16} />}
        </button>
      )}
      <button
        onClick={onSumar}
        aria-label="Sumar treinta segundos al descanso"
        className="h-10 px-2.5 rounded-xl text-xs font-bold shrink-0 toque-44 active:scale-90"
        style={{ background: hexToRgba(COLORS.border, 0.5), color: COLORS.text }}
      >
        +30 s
      </button>
      <button
        onClick={onReiniciar}
        aria-label="Reiniciar el descanso"
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 toque-44 active:scale-90"
        style={{ background: hexToRgba(COLORS.border, 0.5), color: COLORS.text }}
      >
        <RotateCcw size={16} />
      </button>
      <button
        onClick={onCerrar}
        aria-label="Saltar el descanso"
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 toque-44 active:scale-90"
        style={{ background: hexToRgba(COLORS.border, 0.5), color: COLORS.textMuted }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

/* ── El aviso de salir / terminar / descartar ──────────────────────────────
   ⚠️ Es una tarjeta **dentro del flujo**, no un `fixed inset-0`: así no hace
   falta portal (regla 3) y en un iPhone no tapa el teclado. */
export function AvisoSesion({ aviso, accent, acciones }) {
  if (!aviso) return null;
  return (
    <Card style={{ border: `1px solid ${accent}` }}>
      <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
        {aviso.titulo}
      </p>
      <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{aviso.texto}</p>
      <div className="flex gap-2 mt-3 flex-wrap">
        {acciones.map((a) => (a.primaria ? (
          <PrimaryButton key={a.texto} accent={accent} onClick={a.onClick}>{a.texto}</PrimaryButton>
        ) : (
          <GhostBtn key={a.texto} onClick={a.onClick}>{a.texto}</GhostBtn>
        )))}
      </div>
    </Card>
  );
}

/* ── La tarjeta de recuperación (apartado 30) ──────────────────────────────
   Se pinta en Entrenamiento, no aquí dentro: es la puerta de vuelta. */
export function SesionRecuperable({ sesion, accent, onContinuar, onDescartar }) {
  const [confirmando, setConfirmando] = useState(false);
  const ahora = useAhora(true, 1000);
  const datos = avisoDeRecuperacion(sesion, { ahora });
  if (!datos) return null;
  return (
    <Card style={{ border: `1px solid ${accent}` }}>
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: hexToRgba(accent, 0.16), color: accent }}
        >
          <Dumbbell size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
            {datos.titulo}
          </p>
          <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>
            {[datos.nombre, datos.duracion, datos.ejercicio].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>
      {confirmando ? (
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>{AVISO_DESCARTAR.texto}</p>
          <div className="flex gap-2 mt-2.5 flex-wrap">
            <GhostBtn onClick={() => setConfirmando(false)}>{AVISO_DESCARTAR.cancelar}</GhostBtn>
            <button
              onClick={() => { setConfirmando(false); onDescartar(); }}
              aria-label="Descartar el entrenamiento en curso"
              className="h-10 px-3.5 rounded-xl text-sm font-bold toque-44 active:scale-95"
              style={{ background: hexToRgba(COLORS.negative, 0.16), color: COLORS.negative }}
            >
              {AVISO_DESCARTAR.descartar}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 mt-3 flex-wrap">
          <PrimaryButton accent={accent} icon={ChevronRight} onClick={onContinuar}>{datos.continuar}</PrimaryButton>
          <GhostBtn icon={X} onClick={() => setConfirmando(true)}>{datos.descartar}</GhostBtn>
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LA PANTALLA
   ═══════════════════════════════════════════════════════════════════════════

   🚨 Es **pantalla entera, sin las pestañas de Fitness** —igual que el
   constructor de la F3—: dejarlas debajo permitiría irse a Rangos en mitad de
   una serie, que es la puerta de atrás por la que se pierde el trabajo. */
export default function EntrenamientoVivoView({
  sesion, propios = [], accent,
  onGuardar, onSalir, onTerminada = null,
}) {
  /* Qué panel está abierto: estado de la pantalla, jamás un dato (EH F40). */
  const [panel, setPanel] = useState(null); // 'tutorial' | 'reemplazar' | 'notas'
  const [aviso, setAviso] = useState(null); // 'salir' | 'terminar'
  const [descanso, setDescanso] = useState(null);
  const [nota, setNota] = useState('');
  /* ⚠️ Que el sonido del fin de descanso se emita **una sola vez**: el reloj se
     redibuja dos veces por segundo, y sin esto sonaría en cada tic. */
  const sonado = useRef(false);

  const corriendo = !!sesion && sesion.estado === 'en_curso';
  const ahora = useAhora(corriendo || !!descanso);

  const ejercicio = useMemo(() => ejercicioActual(sesion), [sesion]);
  const ficha = useMemo(() => fichaDeEjercicio(ejercicio, propios), [ejercicio, propios]);
  const filas = useMemo(() => filasDeSeries(ejercicio), [ejercicio]);
  const carrusel = useMemo(() => carruselDeSesion(sesion, propios), [sesion, propios]);
  const progreso = useMemo(() => progresoSesion(sesion), [sesion]);
  const total = ejerciciosDeSesion(sesion).length;
  const indice = sesion ? (sesion.actual ?? 0) : 0;

  /* Apartado 25 — el aviso al terminar el descanso: un sonido que YA EXISTE
     emitido al bus (nunca `new Audio`, SO F1) y una vibración si la hay. */
  useEffect(() => {
    if (!descanso) { sonado.current = false; return; }
    if (sonado.current) return;
    if (descansoTerminado(descanso, ahora)) {
      sonado.current = true;
      try { emitir(EVENTO_FIN_DESCANSO); } catch { /* que no suene no es un error */ }
      vibrarSiSePuede();
    }
  }, [descanso, ahora]);

  /* La nota del ejercicio, cargada al abrir el panel. */
  useEffect(() => {
    if (panel === 'notas') setNota(ejercicio ? ejercicio.notas : '');
  }, [panel, ejercicio ? ejercicio.id : null]);

  if (!sesion) return <EmptyHint text="No hay ningún entrenamiento en curso." />;

  const guardar = (siguiente) => { if (siguiente !== sesion) onGuardar(siguiente); };

  /* Apartado 24 — al marcar una serie, **se ofrece** el descanso. No bloquea:
     es la barra de arriba, que se puede saltar. */
  const marcar = (serieId, hecha) => {
    guardar(marcarSerie(sesion, ejercicio.id, serieId, hecha));
    if (hecha && ejercicio.descanso) {
      sonado.current = false;
      setDescanso(crearDescanso({ segundos: ejercicio.descanso }));
    }
  };

  const cerrarPanel = () => setPanel(null);

  /* ── El selector de ejercicios del apartado 26 ────────────────────────────
     🚨 **Es `EjerciciosView`**, con su búsqueda y sus filtros por músculo,
     entorno, equipo y dificultad — exactamente lo que pide el apartado. Un
     segundo buscador de ejercicios sería el duplicado de la E3 F22. */
  if (panel === 'reemplazar') {
    const sugeridos = sustitutosSugeridos(ejercicio, propios);
    return (
      <div className="space-y-4">
        {sugeridos.length > 0 && (
          <div>
            <SectionTitle sub="De la misma familia, para no perder el trabajo del día">
              Cambios rápidos
            </SectionTitle>
            <div className="space-y-2">
              {sugeridos.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { guardar(sustituirEjercicio(sesion, ejercicio.id, s.id, propios)); cerrarPanel(); }}
                  aria-label={`Cambiar por ${s.nombre}`}
                  className="hub-card w-full text-left rounded-2xl p-3 flex items-center gap-2.5 active:scale-[0.99]"
                  style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
                >
                  <Repeat size={16} style={{ color: accent }} aria-hidden="true" />
                  <span className="text-sm font-bold min-w-0 flex-1 truncate" style={{ color: COLORS.text }}>
                    {s.nombre}
                  </span>
                  <ChevronRight size={16} style={{ color: COLORS.textMuted }} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        )}
        <EjerciciosView
          propios={propios}
          accent={accent}
          onVolver={cerrarPanel}
          volverA="Entrenamiento"
          onElegir={(id) => { guardar(sustituirEjercicio(sesion, ejercicio.id, id, propios)); cerrarPanel(); }}
          yaElegidos={ejercicio ? [ejercicio.exerciseId] : []}
        />
      </div>
    );
  }

  /* Apartado 12 — el tutorial, con los datos REALES del catálogo (F2). */
  if (panel === 'tutorial') {
    return (
      <DetalleEjercicio
        ejercicio={ejercicioPorId(ejercicio.exerciseId, propios)}
        accent={accent}
        onVolver={cerrarPanel}
      />
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <CabeceraSesion
        nombre={sesion.nombre}
        tiempo={reloj(duracionSesion(sesion, ahora))}
        progreso={progreso}
        accent={accent}
        onSalir={() => setAviso('salir')}
        onTerminar={() => setAviso('terminar')}
      />

      {/* Apartado 31 — salir pregunta, y NO marca como completada. */}
      {aviso === 'salir' && (
        <AvisoSesion
          aviso={AVISO_SALIR}
          accent={accent}
          acciones={[
            { texto: AVISO_SALIR.seguir, primaria: true, onClick: () => setAviso(null) },
            { texto: AVISO_SALIR.salir, onClick: () => { setAviso(null); onSalir(); } },
          ]}
        />
      )}

      {/* 🚨 Apartado 32 — Terminar **pregunta**; sin confirmar no escribe nada. */}
      {aviso === 'terminar' && (
        <AvisoSesion
          aviso={AVISO_TERMINAR}
          accent={accent}
          acciones={[
            { texto: AVISO_TERMINAR.seguir, primaria: true, onClick: () => setAviso(null) },
            {
              texto: AVISO_TERMINAR.terminar,
              onClick: () => {
                const r = terminarSesion(sesion, { confirmado: true });
                setAviso(null);
                if (r.ok) { onGuardar(r.sesion); if (onTerminada) onTerminada(r.sesion); }
              },
            },
          ]}
        />
      )}

      <CarruselEjercicios
        items={carrusel}
        accent={accent}
        onElegir={(i) => guardar(irAEjercicio(sesion, i))}
      />

      <BarraDescanso
        descanso={descanso}
        ahora={ahora}
        accent={accent}
        onPausar={() => setDescanso((d) => pausarDescanso(d))}
        onReanudar={() => setDescanso((d) => reanudarDescanso(d))}
        onReiniciar={() => { sonado.current = false; setDescanso((d) => reiniciarDescanso(d)); }}
        onSumar={() => { sonado.current = false; setDescanso((d) => (d ? { ...d, segundos: d.segundos + 30 } : d)); }}
        onCerrar={() => setDescanso(null)}
      />

      {!ficha ? (
        <EmptyHint text="Este entrenamiento se quedó sin ejercicios." />
      ) : (
        <>
          {/* Apartado 10 — el ejercicio actual. */}
          <Card>
            <p className="text-xl font-extrabold leading-tight" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
              {ficha.nombre}
            </p>
            {ficha.variante && (
              <p className="text-xs mt-0.5" style={{ color: accent }}>{ficha.variante}</p>
            )}
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
              {[ficha.musculo, ficha.dificultad, ficha.equipo.join(', ')].filter(Boolean).join(' · ')}
            </p>
            {/* ⚠️ Si lo sustituyó, se dice de cuál venía: si no, al día siguiente
                no sabría por qué su plan de Push tiene mancuernas. */}
            {ficha.sustituido && (
              <p className="text-[11px] mt-1" style={{ color: COLORS.warning }}>
                En lugar de {ficha.sustituyeA} · solo en este entrenamiento
              </p>
            )}
            {!ficha.existe && (
              <p className="text-[11px] mt-1" style={{ color: COLORS.negative }}>
                Este ejercicio ya no está en el catálogo. Lo que registraste se conserva.
              </p>
            )}

            <div className="mt-3">
              <HuecoAnatomico ficha={ficha} accent={accent} />
            </div>
          </Card>

          {/* Apartado 12 — los cuatro botones. */}
          <div className="grid grid-cols-2 gap-2">
            <GhostBtn icon={BookOpen} onClick={() => setPanel('tutorial')} disabled={!ficha.existe}>Tutorial</GhostBtn>
            <GhostBtn icon={Repeat} onClick={() => setPanel('reemplazar')}>Reemplazar</GhostBtn>
            <GhostBtn icon={StickyNote} onClick={() => setPanel(panel === 'notas' ? null : 'notas')}>
              {ejercicio.notas ? 'Nota escrita' : 'Notas'}
            </GhostBtn>
            <GhostBtn
              icon={Timer}
              onClick={() => { sonado.current = false; setDescanso(crearDescanso({ segundos: ejercicio.descanso || 90 })); }}
            >
              Descanso
            </GhostBtn>
          </div>

          {/* Apartado 27 — la nota del ejercicio, que persiste en la sesión. */}
          {panel === 'notas' && (
            <Card>
              <Textarea
                value={nota}
                onChange={(ev) => setNota(ev.target.value)}
                placeholder="Me costó la última serie…"
                aria-label="Nota de este ejercicio"
                rows={3}
              />
              <div className="flex gap-2 mt-2.5 flex-wrap">
                <PrimaryButton
                  accent={accent}
                  onClick={() => { guardar(notaDeEjercicio(sesion, ejercicio.id, nota)); cerrarPanel(); }}
                >
                  Guardar nota
                </PrimaryButton>
                <GhostBtn onClick={cerrarPanel}>Cancelar</GhostBtn>
              </div>
            </Card>
          )}

          {ejercicio.notas && panel !== 'notas' && (
            <p className="text-xs px-1" style={{ color: COLORS.textMuted }}>📝 {ejercicio.notas}</p>
          )}

          {/* Apartado 13 — la tabla. */}
          <Card>
            <TablaSeries
              filas={filas}
              accent={accent}
              onEditar={(serieId, cambios) => guardar(editarSerie(sesion, ejercicio.id, serieId, cambios))}
              onMarcar={marcar}
              onQuitar={(serieId) => guardar(quitarSerie(sesion, ejercicio.id, serieId))}
              onRecuperar={(serieId) => guardar(recuperarSerie(sesion, ejercicio.id, serieId))}
              onAnadir={() => guardar(anadirSerie(sesion, ejercicio.id))}
            />
          </Card>

          {/* Apartado 9 — anterior y siguiente, además del carrusel. */}
          <div className="flex gap-2">
            <GhostBtn
              icon={ChevronLeft}
              onClick={() => guardar(anteriorEjercicio(sesion))}
              disabled={indice <= 0}
            >
              Anterior
            </GhostBtn>
            <div className="flex-1" />
            <GhostBtn
              icon={ChevronRight}
              onClick={() => guardar(siguienteEjercicio(sesion))}
              disabled={indice >= total - 1}
            >
              Siguiente
            </GhostBtn>
          </div>
          <p className="text-[11px] text-center" style={{ color: COLORS.textMuted }}>
            Ejercicio {indice + 1} de {total}
          </p>
        </>
      )}
    </div>
  );
}
