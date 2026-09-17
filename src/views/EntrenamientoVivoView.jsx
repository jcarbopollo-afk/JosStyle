/* ===========================================================================
   ENTREGA 4 · FASES 7 Y 9/45 — EL ENTRENAMIENTO EN VIVO, LA PANTALLA

   El criterio de finalización de la F7 es explícito: *"El usuario debe sentir
   que está utilizando un tracker de entrenamiento real, no una demo."* Y el de
   la F9 lo sube un escalón: *"La fase estará terminada cuando el entrenamiento
   en vivo sea cómodo para utilizar realmente desde un móvil."*

   🚨 **ESTA PANTALLA NO CALCULA NADA.** El cronómetro, el progreso, el estado
   de cada ejercicio del carrusel, las filas de la tabla, el descanso y qué pasa
   al marcar una serie salen de `src/lib/entrenamiento.js` (F7) y
   `src/lib/entrenamientoUx.js` (F9). Aquí solo se pinta y se llama.

   🚨 **Y LA SESIÓN NO VIVE EN ESTA PANTALLA: VIVE EN `fitness.sesiones`.** Cada
   cambio —una serie marcada, un peso, una nota, un ejercicio sustituido y, desde
   la F9, **el descanso**— llama a `onGuardar(sesion)`, que escribe por la puerta
   de siempre (F9, apartado 41: *"No crear un estado paralelo para la UX"*).

   ⚠️ **Lo único que es estado de pantalla** es qué panel está abierto, un
   reemplazo pendiente de confirmar y el texto que se está tecleando.

   ── LO QUE CAMBIA LA F9 ──────────────────────────────────────────────────
   · El tutorial y el reemplazo se abren **debajo de la cabecera de la sesión**:
     el cronómetro sigue a la vista y «Terminar» se puede pulsar desde ahí
     (apartados 20 y 33). En la F7 sustituían la pantalla entera.
   · La tarjeta del ejercicio es **la zona del gesto** (apartado 6): deslizar a
     los lados cambia de ejercicio, y como no tiene campos ni botones no puede
     tocar un peso por accidente.
   · La serie activa se resalta, y debajo lleva **− y +** (apartados 7, 9 y 10).
   · El ✓ pendiente es un ○ y el hecho un ✓: el estado ya no depende solo del
     color (apartado 38).
   · El descanso es **grande**, con +15 s y +30 s, y se configura sin salir
     (apartados 13, 14 y 17).
   · Sonido y vibración salen del **motor de audio** (apartado 18): respeta los
     interruptores de Ajustes y, si el dispositivo no puede, no pasa nada.
   =========================================================================== */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, Check, Circle, Plus, Minus, X, Timer, Repeat, BookOpen,
  StickyNote, Pause, Play, RotateCcw, Dumbbell, Undo2,
} from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import {
  Card, SectionTitle, GhostBtn, PrimaryButton, Textarea, EmptyHint, Switch,
} from '../components/ui';
import { iconoDeGrupo } from '../components/iconosFitness';
import EjerciciosView, { DetalleEjercicio } from './EjerciciosView';
import { ejercicioPorId } from '../lib/ejercicios';
import {
  ejerciciosDeSesion, ejercicioActual, duracionSesion, reloj,
  irAEjercicio, siguienteEjercicio, anteriorEjercicio,
  editarSerie, anadirSerie, quitarSerie, recuperarSerie,
  sustituirEjercicio, notaDeEjercicio, restanteDescanso,
  EVENTO_FIN_DESCANSO, EVENTO_SERIE_HECHA,
  AVISO_SALIR, AVISO_DESCARTAR,
  fichaDeEjercicio, filasDeSeries, progresoSesion, carruselDeSesion,
  avisoDeRecuperacion,
} from '../lib/entrenamiento';
import {
  cabeceraDeEjercicio, serieActiva, ajustarValor, PASOS,
  completarSerie, desmarcarSerie, alternarDescansoAuto,
  iniciarDescanso, pausarDescansoSesion, reanudarDescansoSesion, terminarDescanso,
  sumarDescanso, cambiarDescansoEjercicio, descansoVisible,
  DESCANSOS_RAPIDOS, SUMAS_DESCANSO, DESCANSO_MINIMO, DESCANSO_MAXIMO,
  direccionDeGesto, tieneDatosRegistrados, AVISO_REEMPLAZAR, sustitutosCompatibles,
} from '../lib/entrenamientoUx';
/* 🔓 FIT F8 — Terminar ya no completa: lleva al resumen (su apartado 1). */
import { pasarAFinalizacion } from '../lib/finalizacion';
/* 🚨 Se EMITE al bus; ninguna pantalla reproduce ni vibra por su cuenta (SO F1). */
import { emitir } from '../lib/eventos';

/* ⚠️ Cada cuánto se redibuja el reloj. **Solo redibuja**: la cuenta la lleva
   `duracionSesion()` restando marcas de tiempo (E3 F25). */
const TIC_MS = 500;

/* Cuánto después de acabar un descanso se sigue avisando. Si abre la aplicación
   un minuto después de que terminara, no tiene que sonarle nada. */
const AVISO_FIN_DESCANSO_MS = 5000;

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

/* Números como se leen en español: 62,5 y no 62.5. */
const decimal = (n) => String(n).replace('.', ',');

/* ── La cabecera (F7 apartados 5 y 6 · F9 apartados 2, 30 y 33) ───────────── */
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

/* ── El carrusel (F7 apartado 8 · F9 apartado 4) ───────────────────────────
   🚨 F9: *"El actual debe tener mayor tamaño/contraste. Los demás pueden
   aparecer como miniaturas/círculos."* El actual es una tarjeta ancha con su
   nombre; los demás, una píldora estrecha con el número y el estado. Siguen
   siendo botones, en una fila que se desliza de verdad. */
export function CarruselEjercicios({ items, accent, onElegir }) {
  const refs = useRef({});
  const actual = items.find((i) => i.estado === 'actual');

  useEffect(() => {
    const el = actual ? refs.current[actual.id] : null;
    if (el && el.scrollIntoView) {
      try { el.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch { /* da igual */ }
    }
  }, [actual ? actual.id : null]);

  if (!items.length) return null;
  return (
    <div className="-mx-4 px-4 overflow-x-auto">
      <div className="flex gap-2 pb-1 items-stretch" style={{ width: 'max-content' }}>
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
              className="rounded-2xl text-left shrink-0 toque-44 active:scale-95 transition-colors"
              style={{
                width: esActual ? 168 : 92,
                padding: esActual ? '0.6rem 0.75rem' : '0.5rem 0.55rem',
                background: esActual ? hexToRgba(accent, 0.18) : COLORS.surface,
                border: `${esActual ? 2 : 1}px solid ${esActual ? accent : COLORS.border}`,
              }}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="rounded-full flex items-center justify-center font-bold shrink-0"
                  style={{
                    width: esActual ? 24 : 22,
                    height: esActual ? 24 : 22,
                    fontSize: 11,
                    background: hecho || esActual ? accent : hexToRgba(COLORS.border, 0.6),
                    color: hecho || esActual ? COLORS.textOnAccent : COLORS.textMuted,
                  }}
                >
                  {hecho ? <Check size={12} /> : i.numero}
                </span>
                {/* El color nunca va solo (EH F42): el estado lleva palabra. */}
                <span className="text-[10px] font-bold uppercase tracking-wide truncate" style={{ color: esActual ? accent : COLORS.textMuted }}>
                  {esActual ? 'Ahora' : hecho ? 'Hecho' : 'Pendiente'}
                </span>
              </div>
              <p
                className={`font-bold mt-1 leading-tight ${esActual ? 'text-sm line-clamp-2' : 'text-[11px] line-clamp-1'}`}
                style={{ color: esActual ? COLORS.text : COLORS.textMuted }}
              >
                {i.nombre}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── El hueco anatómico (F7 apartado 11) ───────────────────────────────────
   🚨 *"NO inventar una URL externa."* Se dibuja el icono del grupo muscular que
   trabaja, que es un dato real del catálogo. Ni un `<img>` a ninguna parte. */
export function HuecoAnatomico({ ficha, accent, compacto = false }) {
  const grupo = ficha?.musculos?.[0] || null;
  const Icono = iconoDeGrupo(grupo ? grupo.id : null);
  const hayRecurso = !!(ficha?.tutorial?.recursos?.anatomia);
  return (
    <div
      className={`rounded-2xl flex ${compacto ? 'items-center gap-3 px-3 py-2.5' : 'flex-col items-center justify-center py-5'}`}
      style={{ background: hexToRgba(accent, 0.08), border: `1px solid ${hexToRgba(accent, 0.25)}` }}
    >
      <div
        className={`${compacto ? 'w-11 h-11' : 'w-16 h-16'} rounded-2xl flex items-center justify-center shrink-0`}
        style={{ background: hexToRgba(accent, 0.16), color: accent }}
      >
        <Icono size={compacto ? 22 : 32} />
      </div>
      <div className={compacto ? 'min-w-0' : ''}>
        {ficha?.musculos?.length > 0 && (
          <p className={`text-xs font-semibold ${compacto ? '' : 'mt-2.5 text-center px-4'}`} style={{ color: COLORS.text }}>
            {ficha.musculos.map((m) => `${m.nombre} ${m.porcentaje}%`).join(' · ')}
          </p>
        )}
        {!hayRecurso && (
          <p className={`text-[11px] ${compacto ? 'mt-0.5' : 'mt-1 text-center px-6'}`} style={{ color: COLORS.textMuted }}>
            Todavía no hay ilustración anatómica de este ejercicio.
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Un campo numérico (F7 apartados 15 y 16 · F9 apartados 8, 9 y 37) ─────
   ⚠️ Lleva **su propio texto mientras se escribe** y guarda en cada tecla: un
   «62,» a medio teclear se pinta tal cual y se guarda como 62 (F7). */
function CampoNumero({ valor, placeholder, onConfirmar, etiqueta, decimal: conDecimal = false }) {
  const [texto, setTexto] = useState(valor === null || valor === undefined ? '' : String(valor));
  const [tocando, setTocando] = useState(false);

  useEffect(() => {
    if (!tocando) setTexto(valor === null || valor === undefined ? '' : String(valor));
  }, [valor, tocando]);

  const confirmar = (v) => {
    const t = String(v ?? '').trim();
    onConfirmar(t === '' ? null : t.replace(',', '.'));
  };

  return (
    <input
      type="text"
      inputMode={conDecimal ? 'decimal' : 'numeric'}
      value={texto}
      aria-label={etiqueta}
      placeholder={placeholder}
      /* 🚨 F9, apartado 37 — *"el teclado no debe ocultar el campo activo"*. En
         un iPhone el teclado tarda en subir, así que se centra el campo cuando ya
         ha subido y no antes: hacerlo al instante lo dejaría debajo igualmente. */
      onFocus={(ev) => {
        setTocando(true);
        const el = ev.currentTarget;
        setTimeout(() => { try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch { /* da igual */ } }, 300);
      }}
      onChange={(ev) => { setTexto(ev.target.value); confirmar(ev.target.value); }}
      onBlur={(ev) => { setTocando(false); confirmar(ev.target.value); }}
      /* Intro guarda y cierra el teclado (apartado 37). */
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

/* ── − paso + (F9 apartado 10) ─────────────────────────────────────────── */
function Paso({ etiqueta, texto, accent, onMenos, onMas }) {
  const boton = (signo, onClick) => (
    <button
      onClick={onClick}
      aria-label={`${signo < 0 ? 'Restar' : 'Sumar'} ${etiqueta}`}
      className="w-11 h-11 rounded-xl flex items-center justify-center toque-44 active:scale-90"
      style={{ background: hexToRgba(accent, 0.14), color: accent }}
    >
      {signo < 0 ? <Minus size={18} /> : <Plus size={18} />}
    </button>
  );
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      {boton(-1, onMenos)}
      <span className="text-xs font-bold tabular-nums text-center flex-1 min-w-[3.2rem]" style={{ color: COLORS.textMuted }}>
        {texto}
      </span>
      {boton(1, onMas)}
    </div>
  );
}

/* ── La tabla de series (F7 apartados 13-21 · F9 apartados 7-12, 28 y 29) ── */
export function TablaSeries({
  filas, accent, activaId = null,
  onEditar, onMarcar, onQuitar, onRecuperar, onAnadir, onAjustar = null,
}) {
  const porTiempoTabla = filas[0]?.medida?.id === 'tiempo';
  return (
    <div>
      <div className="grid gap-2 px-1 pb-1.5" style={{ gridTemplateColumns: '2.4rem 1fr 1fr 2.75rem' }}>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Serie</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: COLORS.textMuted }}>Kg</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: COLORS.textMuted }}>
          {porTiempoTabla ? 'Seg' : 'Repes'}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: COLORS.textMuted }}>✓</span>
      </div>

      <div className="space-y-1.5">
        {filas.map((f) => {
          const omitida = f.estado === 'omitida';
          const hecha = f.estado === 'hecha';
          const activa = f.id === activaId;
          const porTiempo = f.medida.id === 'tiempo';
          const campoMedida = porTiempo ? 'duracion' : 'reps';
          return (
            <div
              key={f.id}
              data-serie-activa={activa ? 'true' : undefined}
              className="rounded-2xl px-1.5 py-1.5 transition-colors duration-150"
              style={{
                background: hecha ? hexToRgba(accent, 0.1) : activa ? hexToRgba(accent, 0.05) : 'transparent',
                border: `${activa ? 2 : 1}px solid ${activa ? accent : hecha ? hexToRgba(accent, 0.35) : 'transparent'}`,
                opacity: omitida ? 0.5 : 1,
              }}
            >
              <div className="grid gap-2 items-center" style={{ gridTemplateColumns: '2.4rem 1fr 1fr 2.75rem' }}>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold leading-none" style={{ color: omitida ? COLORS.textMuted : COLORS.text }}>
                    {f.numero ?? '—'}
                  </p>
                  {/* F7 apartado 20 — lo PLANIFICADO no se confunde con lo realizado. */}
                  {f.planificado && (
                    <p className="text-[10px] leading-none mt-0.5" style={{ color: COLORS.textMuted }}>{f.planificado}</p>
                  )}
                  {/* F9 apartado 7 — la activa se reconoce también por la palabra. */}
                  {activa && (
                    <p className="text-[9px] font-bold uppercase leading-none mt-0.5" style={{ color: accent }}>Ahora</p>
                  )}
                  {/* F9 apartado 28 — *"marcarse como añadida"*. */}
                  {f.origen === 'anadida' && !activa && (
                    <p className="text-[9px] font-bold uppercase leading-none mt-0.5" style={{ color: COLORS.textMuted }}>Extra</p>
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
                      onConfirmar={(v) => onEditar(f.id, { [campoMedida]: v })}
                    />
                  </>
                )}

                {omitida ? (
                  <button
                    onClick={() => onRecuperar(f.id)}
                    aria-label="Recuperar la serie omitida"
                    className="w-11 h-11 rounded-xl flex items-center justify-center toque-44 active:scale-90"
                    style={{ background: hexToRgba(COLORS.border, 0.5), color: COLORS.textMuted }}
                  >
                    <Undo2 size={16} />
                  </button>
                ) : (
                  /* 🚨 F9 apartado 38 — *"un check completado no debe depender
                     únicamente del cambio de color"*: pendiente es ○ y hecha es ✓.
                     ⚠️ `data-sin-sonido`: marcar ya emite su propio evento, y el
                     clic de interfaz encima sonaría dos veces (SO F1). */
                  <button
                    data-sin-sonido
                    onClick={() => onMarcar(f.id, !hecha)}
                    aria-label={hecha ? `Desmarcar la serie ${f.numero}` : `Marcar la serie ${f.numero} como hecha`}
                    aria-pressed={hecha}
                    className="w-11 h-11 rounded-xl flex items-center justify-center toque-44 active:scale-90 transition-colors duration-150"
                    style={{
                      background: hecha ? accent : hexToRgba(COLORS.border, 0.5),
                      color: hecha ? COLORS.textOnAccent : COLORS.textMuted,
                    }}
                  >
                    {hecha ? <Check size={20} strokeWidth={3} /> : <Circle size={18} />}
                  </button>
                )}
              </div>

              {/* F9 apartados 9, 10 y 29 — los pasos rápidos y quitar ESTA serie,
                  solo en la activa: en todas a la vez la tabla no cabría en un
                  iPhone y dejaría de verse (apartado 35). */}
              {activa && onAjustar && !omitida && (
                <div className="mt-2 pt-2 space-y-2" style={{ borderTop: `1px solid ${hexToRgba(accent, 0.25)}` }}>
                  <div className="grid grid-cols-2 gap-2">
                    <Paso
                      etiqueta={`${decimal(PASOS.peso)} kg a la serie ${f.numero}`}
                      texto={`${decimal(PASOS.peso)} kg`}
                      accent={accent}
                      onMenos={() => onAjustar(f, 'peso', -1)}
                      onMas={() => onAjustar(f, 'peso', 1)}
                    />
                    <Paso
                      etiqueta={porTiempo
                        ? `${PASOS.duracion} segundos a la serie ${f.numero}`
                        : `una repetición a la serie ${f.numero}`}
                      texto={porTiempo ? `${PASOS.duracion} s` : '1 rep'}
                      accent={accent}
                      onMenos={() => onAjustar(f, campoMedida, -1)}
                      onMas={() => onAjustar(f, campoMedida, 1)}
                    />
                  </div>
                  {filas.filter((x) => x.estado !== 'omitida').length > 1 && (
                    <button
                      onClick={() => onQuitar(f.id)}
                      className="text-[11px] font-semibold px-2 py-1.5 rounded-lg toque-44"
                      style={{ color: COLORS.textMuted }}
                    >
                      {f.seQuita ? 'Quitar esta serie' : 'Omitir esta serie'}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 mt-3 flex-wrap">
        <GhostBtn icon={Plus} onClick={onAnadir}>Añadir serie</GhostBtn>
        {filas.length > 1 && (
          <GhostBtn icon={X} onClick={() => onQuitar(filas[filas.length - 1].id)}>
            {filas[filas.length - 1].seQuita ? 'Quitar la última' : 'Omitir la última'}
          </GhostBtn>
        )}
      </div>
    </div>
  );
}

/* ── El descanso (F7 apartados 23-25 · F9 apartados 13-15) ─────────────────
   🚨 F9: *"Debe ser muy visible cuando está activo."* El número es lo más
   grande de la pantalla después del cronómetro. Y sigue sin ser un overlay: la
   tabla continúa debajo y se puede registrar mientras corre (F7). */
export function BarraDescanso({ descanso, ahora, accent, onPausar, onReanudar, onReiniciar, onCerrar, onSumar }) {
  if (!descanso) return null;
  const restante = restanteDescanso(descanso, ahora);
  const pausado = !!descanso.pausadoEn;
  const fin = restante === 0;
  const boton = (props, contenido) => (
    <button
      {...props}
      className="h-11 min-w-[2.75rem] px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 toque-44 active:scale-90"
      style={{ background: hexToRgba(COLORS.border, 0.5), color: COLORS.text, ...(props.style || {}) }}
    >
      {contenido}
    </button>
  );
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl px-3 py-3"
      style={{
        background: fin ? hexToRgba(accent, 0.2) : hexToRgba(accent, 0.1),
        border: `2px solid ${accent}`,
      }}
    >
      <div className="flex items-center gap-2">
        <Timer size={20} style={{ color: accent }} aria-hidden="true" />
        <p className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: accent }}>
          {fin ? 'Descanso terminado' : pausado ? 'Descanso en pausa' : 'Descanso'}
        </p>
      </div>
      <p
        className="text-4xl font-extrabold leading-none tabular-nums text-center my-2"
        style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}
      >
        {reloj(restante)}
      </p>
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {!fin && boton(
          { onClick: pausado ? onReanudar : onPausar, 'aria-label': pausado ? 'Reanudar el descanso' : 'Pausar el descanso' },
          pausado ? <Play size={16} /> : <Pause size={16} />,
        )}
        {SUMAS_DESCANSO.map((s) => (
          <React.Fragment key={s}>
            {boton(
              { onClick: () => onSumar(s), 'aria-label': `Sumar ${s === 15 ? 'quince' : 'treinta'} segundos al descanso` },
              `+${s} s`,
            )}
          </React.Fragment>
        ))}
        {boton({ onClick: onReiniciar, 'aria-label': 'Reiniciar el descanso' }, <RotateCcw size={16} />)}
        {boton(
          {
            onClick: onCerrar,
            'aria-label': 'Terminar el descanso',
            style: { background: accent, color: COLORS.textOnAccent },
          },
          'Terminar',
        )}
      </div>
    </div>
  );
}

/* ── Configurar el descanso (F9 apartados 16 y 17) ─────────────────────── */
function PanelDescanso({ ejercicio, sesion, accent, onGuardar, onEmpezar, onCerrar }) {
  const [propio, setPropio] = useState('');
  const actual = ejercicio?.descanso || null;
  const esRapido = DESCANSOS_RAPIDOS.includes(actual);
  const auto = sesion.descansoAuto !== false;
  const usarPropio = () => {
    const n = Number(String(propio).replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) return;
    onGuardar(cambiarDescansoEjercicio(sesion, ejercicio.id, Math.round(n)));
    setPropio('');
  };
  return (
    <Card>
      <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
        Descanso de este ejercicio
      </p>
      {/* 🚨 Apartado 17 — *"No modificar permanentemente el plan"*, y se dice. */}
      <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>
        Solo cambia en este entrenamiento. Tu plan se queda como está.
      </p>

      <div className="flex gap-1.5 flex-wrap mt-3" role="group" aria-label="Tiempo de descanso">
        {DESCANSOS_RAPIDOS.map((s) => {
          const elegido = actual === s;
          return (
            <button
              key={s}
              onClick={() => onGuardar(cambiarDescansoEjercicio(sesion, ejercicio.id, s))}
              aria-pressed={elegido}
              aria-label={`Descanso de ${s} segundos`}
              className="h-10 px-3 rounded-xl text-xs font-bold toque-44 active:scale-95"
              style={{
                background: elegido ? accent : hexToRgba(COLORS.border, 0.45),
                color: elegido ? COLORS.textOnAccent : COLORS.text,
              }}
            >
              {elegido && <Check size={12} className="inline mr-1" aria-hidden="true" />}
              {s} s
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mt-2.5">
        <input
          type="text"
          inputMode="numeric"
          value={propio}
          onChange={(ev) => setPropio(ev.target.value)}
          onKeyDown={(ev) => { if (ev.key === 'Enter') { usarPropio(); ev.currentTarget.blur(); } }}
          placeholder={actual && !esRapido ? `${actual}` : 'Personalizado'}
          aria-label="Descanso personalizado en segundos"
          className="h-11 rounded-xl px-3 text-base outline-none flex-1 min-w-0 toque-44"
          style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
        />
        <button
          onClick={usarPropio}
          aria-label="Usar el descanso personalizado"
          className="h-11 px-3.5 rounded-xl text-xs font-bold shrink-0 toque-44 active:scale-95"
          style={{ background: hexToRgba(accent, 0.16), color: accent }}
        >
          Usar
        </button>
      </div>
      <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>
        Entre {DESCANSO_MINIMO} y {DESCANSO_MAXIMO} segundos.{actual ? ` Ahora: ${actual} s.` : ''}
      </p>

      <div className="flex items-center justify-between gap-3 mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Descanso automático</p>
          <p className="text-[11px]" style={{ color: COLORS.textMuted }}>Empieza solo al completar una serie.</p>
        </div>
        <Switch
          checked={auto}
          onChange={() => onGuardar(alternarDescansoAuto(sesion))}
          accent={accent}
          label="Descanso automático al completar una serie"
        />
      </div>

      <div className="flex gap-2 mt-3">
        <PrimaryButton accent={accent} icon={Timer} onClick={onEmpezar} disabled={!actual}>
          Empezar descanso
        </PrimaryButton>
        <GhostBtn onClick={onCerrar}>Cerrar</GhostBtn>
      </div>
    </Card>
  );
}

/* ── El aviso de salir / terminar / descartar / reemplazar ─────────────────
   ⚠️ Una tarjeta **dentro del flujo**, no un `fixed inset-0`: así no hace falta
   portal (regla 3) y en un iPhone no tapa el teclado. */
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

/* ── La tarjeta de sesión en curso (F7 apartado 30 · F9 apartado 31) ───────
   🚨 F9: es el **estado compacto**. Enseña nombre, tiempo, ejercicio y, desde
   que el descanso vive en la sesión, si está descansando. */
export function SesionRecuperable({ sesion, accent, onContinuar, onDescartar, textos = null }) {
  const [confirmando, setConfirmando] = useState(false);
  const ahora = useAhora(true, 1000);
  const base = avisoDeRecuperacion(sesion, { ahora });
  if (!base) return null;
  const datos = textos ? { ...base, ...textos } : base;
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
          {datos.descanso && (
            <p className="text-xs font-bold tabular-nums" style={{ color: accent }}>{datos.descanso}</p>
          )}
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
   🚨 Pantalla entera, sin las pestañas de Fitness (F7): dejarlas debajo
   permitiría irse a Rangos en mitad de una serie. */
export default function EntrenamientoVivoView({
  sesion, propios = [], accent,
  onGuardar, onSalir, onTerminada = null,
}) {
  /* Qué panel está abierto: estado de la pantalla, jamás un dato (EH F40). */
  const [panel, setPanel] = useState(null); // 'tutorial' | 'reemplazar' | 'notas' | 'descanso'
  const [aviso, setAviso] = useState(null); // 'salir'
  const [reemplazo, setReemplazo] = useState(null); // exerciseId pendiente de confirmar
  const [nota, setNota] = useState('');
  /* ⚠️ Que el aviso del fin de descanso se emita **una vez por descanso**: el
     reloj se redibuja dos veces por segundo. Se recuerda para QUÉ descanso sonó. */
  const sonadoPara = useRef(null);
  const inicioGesto = useRef(null);

  const descanso = sesion ? sesion.descanso || null : null;
  const corriendo = !!sesion && sesion.estado === 'en_curso';
  const ahora = useAhora(corriendo || !!descanso);

  const ejercicio = useMemo(() => ejercicioActual(sesion), [sesion]);
  const ficha = useMemo(() => fichaDeEjercicio(ejercicio, propios), [ejercicio, propios]);
  const cabecera = useMemo(() => cabeceraDeEjercicio(ejercicio, propios), [ejercicio, propios]);
  const filas = useMemo(() => filasDeSeries(ejercicio), [ejercicio]);
  const activaId = useMemo(() => serieActiva(ejercicio), [ejercicio]);
  const carrusel = useMemo(() => carruselDeSesion(sesion, propios), [sesion, propios]);
  const progreso = useMemo(() => progresoSesion(sesion), [sesion]);
  /* F9 apartado 40 — los sustitutos recorren el catálogo: solo cuando el panel
     está abierto, no en cada pulsación de una serie. */
  const sustitutos = useMemo(
    () => (panel === 'reemplazar' ? sustitutosCompatibles(ejercicio, propios) : []),
    [panel, ejercicio, propios],
  );
  const total = ejerciciosDeSesion(sesion).length;
  const indice = sesion ? (sesion.actual ?? 0) : 0;
  const visible = descansoVisible(sesion, ahora);

  /* F7 apartado 25 · F9 apartado 18 — el aviso al terminar el descanso. Se
     EMITE: el motor decide si suena y si vibra, según Ajustes. */
  useEffect(() => {
    if (!descanso) return;
    const clave = `${descanso.desde}-${descanso.segundos}`;
    if (sonadoPara.current === clave) return;
    if (restanteDescanso(descanso, ahora) > 0) return;
    const fin = descanso.desde + (descanso.pausadoMs || 0) + descanso.segundos * 1000;
    sonadoPara.current = clave;
    if (ahora - fin <= AVISO_FIN_DESCANSO_MS) {
      try { emitir(EVENTO_FIN_DESCANSO, { de: 'descanso' }); } catch { /* que no suene no es un error */ }
    }
  }, [descanso, ahora]);

  /* F9 apartado 23 — la nota se carga al abrir… */
  useEffect(() => {
    if (panel === 'notas') setNota(ejercicio ? ejercicio.notas : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel, ejercicio ? ejercicio.id : null]);

  /* …y **se guarda sola** al dejar de escribir (*"Guardar automáticamente si es
     posible"*). ⚠️ Se compara con lo guardado ya recortado: si no, un espacio
     al final haría que se guardara una y otra vez. */
  useEffect(() => {
    if (panel !== 'notas' || !ejercicio || !sesion) return undefined;
    if (nota.trim() === (ejercicio.notas || '')) return undefined;
    const t = setTimeout(() => onGuardar(notaDeEjercicio(sesion, ejercicio.id, nota)), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nota, panel, sesion]);

  if (!sesion) return <EmptyHint text="No hay ningún entrenamiento en curso." />;

  const guardar = (siguiente) => { if (siguiente && siguiente !== sesion) onGuardar(siguiente); };

  /* F9 apartados 11, 12 y 16. */
  const marcar = (serieId, hecha) => {
    if (hecha) {
      guardar(completarSerie(sesion, ejercicio.id, serieId, Date.now()));
      try { emitir(EVENTO_SERIE_HECHA, { de: 'serie' }); } catch { /* da igual */ }
    } else {
      guardar(desmarcarSerie(sesion, ejercicio.id, serieId));
    }
  };

  /* F9 apartado 10 — − y +, partiendo de lo que decía el plan si está vacío. */
  const ajustar = (fila, campo, signo) => {
    const base = campo === 'peso' ? fila.plan.peso : campo === 'reps' ? fila.plan.reps : fila.plan.duracion;
    const siguiente = ajustarValor(fila.hecho[campo], campo, signo, { base });
    guardar(editarSerie(sesion, ejercicio.id, fila.id, { [campo]: siguiente }));
  };

  /* F9 apartado 15 — al terminar el descanso se vuelve a la serie que toca. */
  const acabarDescanso = () => {
    guardar(terminarDescanso(sesion));
    setTimeout(() => {
      try {
        const fila = document.querySelector('[data-serie-activa="true"]');
        if (fila) fila.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } catch { /* da igual */ }
    }, 60);
  };

  /* F9 apartados 21 y 22 — reemplazar pregunta si ya había datos. */
  const aplicarReemplazo = (id) => {
    guardar(sustituirEjercicio(sesion, ejercicio.id, id, propios));
    setReemplazo(null);
    setPanel(null);
  };
  const elegirSustituto = (id) => {
    if (tieneDatosRegistrados(ejercicio)) setReemplazo(id);
    else aplicarReemplazo(id);
  };

  const cerrarPanel = () => { setPanel(null); setReemplazo(null); };

  /* F9 apartado 6 — el gesto, solo en la tarjeta del ejercicio. */
  const alEmpezarGesto = (ev) => {
    if (ev.target && ev.target.closest && ev.target.closest('button, input, textarea, select, a')) return;
    inicioGesto.current = { x: ev.clientX, y: ev.clientY };
  };
  const alAcabarGesto = (ev) => {
    const i = inicioGesto.current;
    inicioGesto.current = null;
    if (!i) return;
    const dir = direccionDeGesto(ev.clientX - i.x, ev.clientY - i.y);
    if (dir === 'siguiente') guardar(siguienteEjercicio(sesion));
    else if (dir === 'anterior') guardar(anteriorEjercicio(sesion));
  };

  /* 🚨 F9 apartados 20 y 33 — la cabecera va en TODAS las vistas de la sesión:
     con el tutorial o el selector abiertos, el cronómetro sigue a la vista y
     «Terminar» se puede pulsar. En la F7 esos paneles la tapaban. */
  const cabeceraSesion = (
    <>
      <CabeceraSesion
        nombre={sesion.nombre}
        tiempo={reloj(duracionSesion(sesion, ahora))}
        progreso={progreso}
        accent={accent}
        onSalir={() => setAviso('salir')}
        /* FIT F8 — Terminar para el reloj y lleva al resumen. ⚠️ El descanso se
           suelta al terminar: una sesión terminada no está descansando, y si no
           la tarjeta de «sin guardar» diría «Descansando». */
        onTerminar={() => {
          const cerrada = pasarAFinalizacion({ ...sesion, descanso: null });
          onGuardar(cerrada);
          if (onTerminada) onTerminada(cerrada);
        }}
      />
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
    </>
  );

  const barraDescanso = (
    <BarraDescanso
      descanso={visible}
      ahora={ahora}
      accent={accent}
      onPausar={() => guardar(pausarDescansoSesion(sesion, Date.now()))}
      onReanudar={() => guardar(reanudarDescansoSesion(sesion, Date.now()))}
      onReiniciar={() => guardar(iniciarDescanso(sesion, visible ? visible.segundos : ejercicio?.descanso, Date.now()))}
      onSumar={(s) => guardar(sumarDescanso(sesion, s, Date.now()))}
      onCerrar={acabarDescanso}
    />
  );

  /* ── Reemplazar (F7 apartado 26 · F9 apartados 21 y 22) ────────────────── */
  if (panel === 'reemplazar' && ejercicio) {
    const pendiente = reemplazo ? ejercicioPorId(reemplazo, propios) : null;
    return (
      <div className="space-y-4 pb-6">
        {cabeceraSesion}
        {pendiente && (
          <AvisoSesion
            aviso={{ ...AVISO_REEMPLAZAR, titulo: `${AVISO_REEMPLAZAR.titulo.replace('?', '')} por ${pendiente.nombre}?` }}
            accent={accent}
            acciones={[
              { texto: AVISO_REEMPLAZAR.cancelar, onClick: () => setReemplazo(null) },
              { texto: AVISO_REEMPLAZAR.reemplazar, primaria: true, onClick: () => aplicarReemplazo(pendiente.id) },
            ]}
          />
        )}
        {!pendiente && sustitutos.length > 0 && (
          <div>
            <SectionTitle sub="Mismo músculo primero, después la misma función, tu entorno y una dificultad parecida">
              Cambios rápidos
            </SectionTitle>
            <div className="space-y-2">
              {sustitutos.map(({ ejercicio: s, motivo }) => (
                <button
                  key={s.id}
                  onClick={() => elegirSustituto(s.id)}
                  aria-label={`Cambiar por ${s.nombre}`}
                  className="hub-card w-full text-left rounded-2xl p-3 flex items-center gap-2.5 active:scale-[0.99]"
                  style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
                >
                  <Repeat size={16} style={{ color: accent }} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="text-sm font-bold block truncate" style={{ color: COLORS.text }}>{s.nombre}</span>
                    <span className="text-[11px] block truncate" style={{ color: COLORS.textMuted }}>{motivo}</span>
                  </span>
                  <ChevronRight size={16} style={{ color: COLORS.textMuted }} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        )}
        {!pendiente && (
          <EjerciciosView
            propios={propios}
            accent={accent}
            onVolver={cerrarPanel}
            volverA="Entrenamiento"
            onElegir={elegirSustituto}
            yaElegidos={[ejercicio.exerciseId]}
          />
        )}
      </div>
    );
  }

  /* ── El tutorial (F7 apartado 12 · F9 apartados 19 y 20) ───────────────── */
  if (panel === 'tutorial' && ejercicio) {
    return (
      <div className="space-y-4 pb-6">
        {cabeceraSesion}
        {barraDescanso}
        <button
          onClick={cerrarPanel}
          aria-label="Volver al entrenamiento"
          className="inline-flex items-center gap-1.5 pl-2.5 pr-3.5 py-1.5 rounded-full text-sm font-semibold toque-44 active:opacity-60"
          style={{ color: COLORS.textMuted, background: hexToRgba(COLORS.border, 0.35) }}
        >
          <ChevronLeft size={16} /> Volver a la serie
        </button>
        <DetalleEjercicio ejercicio={ejercicioPorId(ejercicio.exerciseId, propios)} accent={accent} />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {cabeceraSesion}

      <CarruselEjercicios
        items={carrusel}
        accent={accent}
        onElegir={(i) => guardar(irAEjercicio(sesion, i))}
      />

      {barraDescanso}

      {!ficha ? (
        <EmptyHint text="Este entrenamiento se quedó sin ejercicios." />
      ) : (
        <>
          {/* F9 apartados 3, 6 y 24 — el ejercicio activo, que es también la
              zona del gesto. ⚠️ `touch-action: pan-y` deja el desplazamiento
              vertical al navegador y el horizontal al gesto: así deslizar a los
              lados no se pelea con el scroll. */}
          <div
            onPointerDown={alEmpezarGesto}
            onPointerUp={alAcabarGesto}
            onPointerCancel={() => { inicioGesto.current = null; }}
            style={{ touchAction: 'pan-y' }}
          >
            <Card>
              <div key={ejercicio.id}>
                <p className="text-xl font-extrabold leading-tight" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
                  {cabecera.nombre}
                </p>
                {(cabecera.variante || cabecera.agarre) && (
                  <p className="text-xs mt-0.5 font-semibold" style={{ color: accent }}>
                    {[cabecera.variante, cabecera.agarre].filter(Boolean).join(' · ')}
                  </p>
                )}
                <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                  {[cabecera.tipo, ficha.musculo, cabecera.porTiempo ? 'Por tiempo' : ''].filter(Boolean).join(' · ')}
                </p>
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

                {/* 🚨 F9 apartado 24 — *"No sustituir silenciosamente el objetivo
                    por el resultado."* Dos columnas, con su nombre cada una. */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="rounded-xl px-2.5 py-2" style={{ background: hexToRgba(COLORS.border, 0.3) }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Planificado</p>
                    <p className="text-sm font-extrabold tabular-nums" style={{ color: COLORS.text }}>
                      {cabecera.objetivo || 'Sin planificar'}
                    </p>
                  </div>
                  <div className="rounded-xl px-2.5 py-2" style={{ background: hexToRgba(accent, 0.1) }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Realizado</p>
                    <p className="text-sm font-extrabold tabular-nums truncate" style={{ color: COLORS.text }}>
                      {cabecera.realizado || '—'}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <HuecoAnatomico ficha={ficha} accent={accent} compacto />
                </div>
                {total > 1 && (
                  <p className="text-[10px] mt-2 text-center" style={{ color: COLORS.textMuted }}>
                    Desliza la tarjeta a los lados para cambiar de ejercicio
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* F9 apartado 2 — la zona de acciones. */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'tutorial', icono: BookOpen, texto: 'Tutorial', disabled: !ficha.existe },
              { id: 'reemplazar', icono: Repeat, texto: 'Reemplazar' },
              { id: 'notas', icono: StickyNote, texto: ejercicio.notas ? 'Nota' : 'Notas' },
              { id: 'descanso', icono: Timer, texto: 'Descanso' },
            ].map((a) => {
              const Icono = a.icono;
              const abierto = panel === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => { setReemplazo(null); setPanel(abierto ? null : a.id); }}
                  disabled={a.disabled}
                  aria-expanded={a.id === 'notas' || a.id === 'descanso' ? abierto : undefined}
                  className="rounded-xl py-2 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold toque-44 active:scale-95 disabled:opacity-50"
                  style={{
                    background: abierto ? hexToRgba(accent, 0.16) : COLORS.surface2,
                    color: abierto ? accent : COLORS.text,
                    border: `1px solid ${abierto ? accent : COLORS.border}`,
                  }}
                >
                  <Icono size={16} aria-hidden="true" />
                  {a.texto}
                </button>
              );
            })}
          </div>

          {panel === 'descanso' && (
            <PanelDescanso
              ejercicio={ejercicio}
              sesion={sesion}
              accent={accent}
              onGuardar={guardar}
              onEmpezar={() => { guardar(iniciarDescanso(sesion, ejercicio.descanso, Date.now())); setPanel(null); }}
              onCerrar={cerrarPanel}
            />
          )}

          {/* F7 apartado 27 · F9 apartado 23 — la nota, que se guarda sola. */}
          {panel === 'notas' && (
            <Card>
              <Textarea
                value={nota}
                onChange={(ev) => setNota(ev.target.value)}
                placeholder="Mejor agarre hoy…"
                aria-label="Nota de este ejercicio"
                rows={3}
              />
              <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>
                {nota.trim() === (ejercicio.notas || '') ? 'Guardada' : 'Guardando…'}
              </p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <PrimaryButton
                  accent={accent}
                  onClick={() => { guardar(notaDeEjercicio(sesion, ejercicio.id, nota)); cerrarPanel(); }}
                >
                  Guardar nota
                </PrimaryButton>
                <GhostBtn onClick={cerrarPanel}>Cerrar</GhostBtn>
              </div>
            </Card>
          )}

          {ejercicio.notas && panel !== 'notas' && (
            <p className="text-xs px-1" style={{ color: COLORS.textMuted }}>📝 {ejercicio.notas}</p>
          )}

          {/* F9 apartado 2 — la tabla, que es la protagonista. */}
          <Card>
            <TablaSeries
              filas={filas}
              accent={accent}
              activaId={activaId}
              onEditar={(serieId, cambios) => guardar(editarSerie(sesion, ejercicio.id, serieId, cambios))}
              onMarcar={marcar}
              onAjustar={ajustar}
              onQuitar={(serieId) => guardar(quitarSerie(sesion, ejercicio.id, serieId))}
              onRecuperar={(serieId) => guardar(recuperarSerie(sesion, ejercicio.id, serieId))}
              onAnadir={() => guardar(anadirSerie(sesion, ejercicio.id))}
            />
          </Card>

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
