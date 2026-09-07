import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2, Circle, Flame, Plus, Trash2, Play, Pause, RotateCcw, ListChecks, Target,
  ChevronDown, ChevronUp, ArrowLeft, Timer, Compass, Repeat, Pencil,
  Droplet, BookOpen, Dumbbell, Moon, Apple, Brain, Heart,
} from 'lucide-react';
import { COLORS, PERIODOS_META } from '../tokens';
import { uid, todayISO, formatFecha } from '../lib/helpers';
import { resumenHabito, alternarHabito } from '../lib/rachas';
import { Card, SectionTitle, Field, TextInput, Select, PrimaryButton, GhostBtn, ToggleTab, EmptyHint, AIPanel, BotonBorrarDefinitivo } from '../components/ui';
/* E3 F23 (PR F1) — Productividad pasa a ser un lanzador de seis mini-apps. El
   catálogo vive en su librería; aquí solo están los componentes. */
import {
  MINI_APPS_PR, miniAppPR, indicadorDePR, CLASE_TARJETA_PR, retrasoDeTarjetaPR,
} from '../lib/productividad';
/* E3 F24 (PR F2) — Hábitos, la mini-app completa. Ni una racha se calcula en esta
   vista: todo sale de `habitos.js`, que se lo pregunta al motor de `rachas.js`. */
/* E3 F25 (PR F3) — Pomodoro. 🚨 El tiempo se calcula restando instantes, nunca
   contando segundos: por eso sobrevive a que el móvil congele la pestaña. */
import {
  TIPOS_SESION, tipoSesion, CONFIG_POMODORO_POR_DEFECTO, DURACIONES_SUGERIDAS, normalizarConfig,
  duracionDe, iniciarSesion, normalizarSesionEnCurso, estaPausada, restanteMs, haTerminado,
  progreso, formatearTiempo, pausar, reanudar, reiniciar, completar, cancelar,
  siguienteEnElCiclo, posicionEnElCiclo, EVENTO_AL_TERMINAR,
  estadisticasHoy, estadisticasSemana, formatearDuracionLarga, historialReciente,
  CABECERA_POMODORO, VACIO_POMODORO,
} from '../lib/pomodoro';
import { emitir } from '../lib/eventos';
import {
  FRECUENCIAS_HABITO, FRECUENCIA_POR_DEFECTO, frecuenciaDe, reglaDe, describirRegla,
  CATEGORIAS_HABITO, ICONOS_HABITO, ICONO_HABITO_POR_DEFECTO,
  crearHabito, editarHabito, pausarHabito, reanudarHabito,
  tocaHoy, hechoHoy, progresoDelDia, estadisticasHabito, textoRacha,
  semanaDe, historialCompacto, SEMANAS_HISTORIAL,
  FILTROS_HABITOS, FILTRO_HABITOS_POR_DEFECTO, filtrarHabitos, vacioDeFiltro,
  VACIO_HABITOS, ESTADOS_DIA, NOMBRES_DIA, NOMBRES_DIA_CORTOS, diasDeRegla, vecesDeRegla,
} from '../lib/habitos';
/* E3 F26 (PR F4) — Tareas. 🚨 La fecha de una tarea es `fecha`, no
   `fechaLimite`: con el campo viejo la tarea no salía en Hoy, ni en la Agenda,
   ni en el Calendario, que filtran los tres por `t.fecha`. */
import {
  PRIORIDADES, PRIORIDAD_POR_DEFECTO, etiquetaDePrioridad,
  CATEGORIAS_TAREA, categoriaTarea,
  crearTarea, editarTarea, completarTarea, reprogramar, DESTINOS_REPROGRAMAR,
  estadoDeFecha, textoDeFecha, SECCIONES_TAREAS, porSecciones,
  ORDENES_TAREA, ORDEN_POR_DEFECTO, FILTROS_TAREA, filtrarTareas, buscarTareas,
  resumenTareas, estadisticasDeTareas, vacioDeTareas, planConcentrarse, tareaDeSesion,
  aperturaInicial,
} from '../lib/tareas';
/* E3 F27 (PR F5) — Metas y Objetivos, con su jerarquía. 🚨 Ni una lista nueva:
   se amplían `productividad.metas` (Fase 6) y `objetivos.lista` (Fase 9). */
import {
  TIPOS_META, TIPO_META_POR_DEFECTO, tipoMeta,
  crearMeta, editarMeta, completarMeta, actualizarProgreso, vincularMeta,
  progresoDeMeta, metaCompletada, textoDeFechaMeta,
  FILTROS_META, filtrarMetas, VACIO_METAS, metasDeObjetivo,
  tareasDeMeta, PESOS_DE_META,
} from '../lib/metasObjetivos';
/* E3 F28 (PR F6) — Rutinas. 🚨 La plantilla y la ejecución son DOS listas: la
   Fase 6 guardaba `hecho` dentro del paso, así que hacer la rutina el martes
   borraba lo del lunes y no quedaba historial de nada. */
import {
  CABECERA_RUTINAS, VACIO_RUTINAS, ICONOS_RUTINA, ICONO_RUTINA_POR_DEFECTO,
  CATEGORIAS_RUTINA, categoriaRutina, TIPOS_PASO, TIPO_PASO_POR_DEFECTO, tipoPaso,
  PROGRAMACIONES, PROGRAMACION_POR_DEFECTO, programacion, reglaDeRutina,
  crearRutina, editarRutina, archivarRutina, crearPaso, anadirPaso, editarPaso,
  quitarPaso, moverPaso, textoDuracion, proximaEjecucion, ultimaEjecucion,
  iniciarEjecucion, pasoActual, progresoEjecucion, completarPaso, saltarPaso,
  pasoAnterior, pasoSiguiente, pausarEjecucion, reanudarEjecucion,
  todosLosPasosHechos, finalizarEjecucion, abandonarEjecucion, SALIDAS_EJECUCION,
  /* 🐛 `estaPausada` YA ES DE `pomodoro.js`: una sesión pausada y una ejecución
     pausada son dos cosas distintas con el mismo nombre, y el build lo cazó. */
  estaPausada as ejecucionPausada,
  textoDuracionEjecucion, historialDeRutina, estadisticasRutinas, rachaDeRutina,
  /* ⚠️ `NOMBRES_DIA` no se importa aquí: ya llega por `habitos.js`, y las dos
     salen de `rachas.js`. Dos importaciones del mismo nombre no compilan. */
  FILTROS_RUTINA, filtrarRutinas, fechaDeEjecucion,
} from '../lib/rutinas';
import ObjectivesView from './ObjectivesView';

/* ---------- Hábitos ---------- */
// RA Fase 1 — la racha ya no se guarda: se deriva del historial con el motor de
// `lib/rachas.js`. El comportamiento que ve Josué es el MISMO de siempre (un solo
// día fallado no la rompe, se perdona), porque esa regla se ha llevado tal cual al
// motor como `diaria_con_gracia`.
//
// Lo que desaparece son `rachaActual` y `mejorRacha` guardados en el hábito. Eran
// números sueltos que además mentían: al desmarcar hoy se le restaba uno al
// contador a mano, así que **desmarcar y volver a marcar subía el récord** sin
// haber cumplido nada. Ahora no hay nada que inflar.

/* ══════════════════════════════════════════════════════════════════════════
   ENTREGA 3 · FASE 24 (PR F2) — HÁBITOS, LA MINI-APP COMPLETA
   ══════════════════════════════════════════════════════════════════════════

   *"El usuario debe poder entrar, ver inmediatamente qué hábitos tiene que hacer
   hoy y marcarlos con un toque."*

   🚨 Ni una racha se calcula aquí: todo sale de `habitos.js`, que a su vez se lo
   pregunta al motor de `rachas.js`. */

/* La otra mitad del catálogo: los iconos son componentes de React, la lista es
   datos. Un icono que falte aquí sale como un hueco y no falla en ninguna parte,
   así que hay una prueba que compara las dos listas. */
const ICONOS_HABITO_COMP = { Flame, Droplet, BookOpen, Dumbbell, Moon, Apple, Brain, Heart };

/* Una cifra con su nombre debajo. ⚠️ Se escribe aquí y no se importa de
   `LibraryView`: una vista no importa componentes de otra vista, que es como se
   acaban acoplando dos pantallas que no tienen nada que ver. Son ocho líneas. */
function Cifra({ n, label, accent }) {
  return (
    <div className="rounded-xl px-2 py-2 text-center" style={{ background: COLORS.surface2 }}>
      <p className="text-lg font-bold" style={{ color: accent }}>{n}</p>
      <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{label}</p>
    </div>
  );
}

export const iconoDeHabito = (id) => ICONOS_HABITO_COMP[id] || Flame;

/* *"Añadir un resumen de progreso del día… y una barra/progreso circular
   visual."* ⚠️ Sin nada que hacer hoy **no hay porcentaje**: se dice, no se pinta
   un 0 % de algo que no tocaba. */
export function ProgresoDelDia({ progreso, accent }) {
  if (!progreso.hayQueHacer) {
    return (
      <Card style={{ padding: '0.85rem 1rem' }}>
        <p className="text-sm" style={{ color: COLORS.textMuted }}>Hoy no te toca ningún hábito.</p>
      </Card>
    );
  }
  const completo = progreso.hechos === progreso.total;
  return (
    <Card style={{ padding: '0.85rem 1rem' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold" style={{ color: COLORS.text }}>
          {progreso.hechos} / {progreso.total} completados
        </p>
        <p className="text-xs font-semibold" style={{ color: completo ? COLORS.positive : accent }}>
          {progreso.porcentaje} %
        </p>
      </div>
      <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: COLORS.surface2 }}>
        <div
          className="h-full rounded-full barra-progreso"
          style={{ width: `${progreso.porcentaje}%`, background: completo ? COLORS.positive : accent }}
        />
      </div>
    </Card>
  );
}

/* *"L M X J V S D · ✓ ✓ ✓ ✕ ✓ ✓ ✓"*. ⚠️ Un día que la regla no pedía **no es una
   equis**: es un hueco. Marcarlo como fallo sería reprocharle algo a lo que nunca
   se comprometió. */
export function SemanaDeHabito({ dias, accent }) {
  return (
    <div className="flex items-center gap-1">
      {dias.map((d) => {
        const hecho = d.estado === ESTADOS_DIA.COMPLETADO;
        const perdido = d.estado === ESTADOS_DIA.PERDIDO;
        const noToca = d.estado === ESTADOS_DIA.NO_TOCA;
        return (
          <div key={d.fecha} className="flex flex-col items-center gap-0.5" title={d.fecha}>
            <span className="text-[9px]" style={{ color: d.esHoy ? accent : COLORS.textMuted, fontWeight: d.esHoy ? 700 : 400 }}>
              {d.letra}
            </span>
            <div
              className="rounded-full"
              style={{
                width: 7,
                height: 7,
                background: hecho ? accent : perdido ? COLORS.negative : COLORS.surface2,
                opacity: noToca ? 0.35 : 1,
                border: d.esHoy && !hecho ? `1px solid ${accent}` : 'none',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

/* La ficha de un hábito. *"Icono · Nombre · Frecuencia · Racha actual · Estado de
   hoy · Botón para completarlo."* */
export function TarjetaHabito({ habito, hoy, accent, indice = 0, onAlternar, onAbrir }) {
  const Icono = iconoDeHabito(habito.icono);
  const hecho = hechoHoy(habito, hoy);
  const racha = textoRacha(habito, hoy);
  const toca = tocaHoy(habito, hoy);
  const pausado = habito.activo === false;

  return (
    <Card style={{ padding: '0.85rem', opacity: pausado ? 0.55 : 1, animationDelay: retrasoDeTarjetaPR(indice) }} className={CLASE_TARJETA_PR}>
      <div className="flex items-center gap-3">
        <button onClick={onAbrir} className="flex items-center gap-3 flex-1 min-w-0 text-left toque-44" aria-label={`Ver ${habito.nombre}`}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: COLORS.surface2 }}>
            <Icono size={17} style={{ color: accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>{habito.nombre}</p>
            <p className="text-[11px] truncate" style={{ color: COLORS.textMuted }}>
              {describirRegla(reglaDe(habito))}
              {pausado ? ' · En pausa' : ''}
            </p>
            {/* ⚠️ Una racha de cero no se pinta: un contador apagado no anima a nadie. */}
            {racha ? (
              <p className="text-[11px] font-semibold flex items-center gap-1 mt-0.5" style={{ color: accent }}>
                <Flame size={11} /> {racha}
              </p>
            ) : null}
          </div>
        </button>
        {/* *"Al pulsar el botón: se marca inmediatamente, animación de completado."*
            ⚠️ Y si hoy no toca, el botón no está: pulsarlo marcaría un día que la
            regla no pedía, y eso confunde más de lo que ayuda. */}
        {toca || hecho ? (
          <button
            onClick={onAlternar}
            className="p-1.5 -m-1.5 flex-shrink-0 transition-transform active:scale-90"
            aria-label={hecho ? `Desmarcar ${habito.nombre}` : `Completar ${habito.nombre}`}
            aria-pressed={hecho}
          >
            {hecho
              ? <CheckCircle2 size={24} style={{ color: accent }} className="habito-hecho" />
              : <Circle size={24} style={{ color: COLORS.textMuted }} />}
          </button>
        ) : (
          <span className="text-[10px] flex-shrink-0" style={{ color: COLORS.textMuted }}>Hoy no</span>
        )}
      </div>
      <div className="mt-2 pl-12">
        <SemanaDeHabito dias={semanaDe(habito, hoy)} accent={accent} />
      </div>
    </Card>
  );
}

/* El formulario. *"Nombre · Icono · Frecuencia · Objetivo · Categoría"*, y ni un
   campo más: el enunciado avisa de que no sea burocrático. */
export function FormularioHabito({ habito = null, accent, onGuardar, onCancelar }) {
  const frecuenciaInicial = habito ? frecuenciaDe(habito).id : FRECUENCIA_POR_DEFECTO;
  const [form, setForm] = useState({
    nombre: habito?.nombre || '',
    icono: habito?.icono || ICONO_HABITO_POR_DEFECTO,
    categoria: habito?.categoria || '',
    frecuencia: frecuenciaInicial,
    dias: diasDeRegla(habito?.regla || {}),
    veces: vecesDeRegla(habito?.regla || {}),
  });
  const pide = FRECUENCIAS_HABITO.find((f) => f.id === form.frecuencia)?.pide;
  const valido = !!crearHabito({ ...form, categoria: form.categoria || null });

  const alternarDia = (d) => setForm({
    ...form,
    dias: form.dias.includes(d) ? form.dias.filter((x) => x !== d) : [...form.dias, d].sort((a, b) => a - b),
  });

  return (
    <Card>
      <Field label="Nombre">
        <TextInput
          aria-label="Nombre del hábito"
          value={form.nombre}
          onChange={(ev) => setForm({ ...form, nombre: ev.target.value })}
          placeholder="Ej: Leer 20 minutos"
        />
      </Field>

      <Field label="Icono">
        <div className="flex flex-wrap gap-2">
          {ICONOS_HABITO.map((i) => {
            const Icono = iconoDeHabito(i.id);
            const puesto = form.icono === i.id;
            return (
              <button
                key={i.id}
                onClick={() => setForm({ ...form, icono: i.id })}
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: COLORS.surface2, border: `1px solid ${puesto ? accent : COLORS.border}` }}
                aria-label={`Icono ${i.nombre}`}
                aria-pressed={puesto}
              >
                <Icono size={17} style={{ color: puesto ? accent : COLORS.textMuted }} />
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Frecuencia">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {FRECUENCIAS_HABITO.map((f) => (
            <button
              key={f.id}
              onClick={() => setForm({ ...form, frecuencia: f.id })}
              className="rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap flex-shrink-0 toque-44"
              style={form.frecuencia === f.id
                ? { background: accent, color: COLORS.textOnAccent }
                : { background: COLORS.surface2, color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}
              aria-label={`Frecuencia ${f.nombre}`}
              aria-pressed={form.frecuencia === f.id}
            >
              {f.nombre}
            </button>
          ))}
        </div>
        <p className="text-[11px] mt-1.5" style={{ color: COLORS.textMuted }}>
          {FRECUENCIAS_HABITO.find((f) => f.id === form.frecuencia)?.ayuda}
        </p>
      </Field>

      {pide === 'dias' && (
        <Field label="Qué días">
          <div className="flex gap-1.5">
            {NOMBRES_DIA_CORTOS.map((letra, d) => {
              const puesto = form.dias.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => alternarDia(d)}
                  className="flex-1 rounded-xl py-2 text-xs font-semibold toque-44"
                  style={puesto
                    ? { background: accent, color: COLORS.textOnAccent }
                    : { background: COLORS.surface2, color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}
                  aria-label={NOMBRES_DIA[d]}
                  aria-pressed={puesto}
                >
                  {letra}
                </button>
              );
            })}
          </div>
        </Field>
      )}

      {pide === 'veces' && (
        <Field label="Cuántas veces por semana">
          <Select
            aria-label="Veces por semana"
            value={String(form.veces)}
            onChange={(ev) => setForm({ ...form, veces: Number(ev.target.value) })}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((v) => (
              <option key={v} value={v}>{v === 1 ? 'Una vez' : `${v} veces`}</option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="Categoría (opcional)">
        <Select
          aria-label="Categoría del hábito"
          value={form.categoria}
          onChange={(ev) => setForm({ ...form, categoria: ev.target.value })}
        >
          <option value="">Sin categoría</option>
          {CATEGORIAS_HABITO.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </Select>
      </Field>

      <div className="flex gap-2 mt-2">
        <PrimaryButton
          accent={accent}
          disabled={!valido}
          onClick={() => onGuardar({ ...form, categoria: form.categoria || null })}
        >
          {habito ? 'Guardar cambios' : 'Crear hábito'}
        </PrimaryButton>
        <GhostBtn onClick={onCancelar}>Cancelar</GhostBtn>
      </div>
    </Card>
  );
}

/* El detalle: *"Cumplimiento · Racha actual · Mejor racha · Total de veces
   completado · Historial."* */
export function DetalleHabito({ habito, hoy, accent, onCerrar, onGuardar, onEliminar }) {
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    const alPulsar = (ev) => { if (ev.key === 'Escape') onCerrar(); };
    if (typeof document !== 'undefined') document.addEventListener('keydown', alPulsar);
    return () => { if (typeof document !== 'undefined') document.removeEventListener('keydown', alPulsar); };
  }, [onCerrar]);

  if (!habito) return null;
  const e = estadisticasHabito(habito, hoy);
  const Icono = iconoDeHabito(habito.icono);
  const cat = CATEGORIAS_HABITO.find((c) => c.id === habito.categoria);

  const contenido = (
    <div
      className="fixed inset-0 z-50 overflow-y-auto pantalla-segura"
      style={{ background: COLORS.bg }}
      role="dialog"
      aria-label={`Detalle de ${habito.nombre}`}
    >
      <div className="max-w-md mx-auto px-4 pb-8 space-y-3">
        <div className="flex items-center gap-2 pt-1">
          <button onClick={onCerrar} className="p-1.5 -m-1.5" aria-label="Cerrar el detalle del hábito">
            <ArrowLeft size={18} style={{ color: COLORS.textMuted }} />
          </button>
          <Icono size={17} style={{ color: accent }} />
          <p className="text-base font-bold flex-1 truncate" style={{ color: COLORS.text }}>{habito.nombre}</p>
        </div>

        {editando ? (
          <FormularioHabito
            habito={habito}
            accent={accent}
            onCancelar={() => setEditando(false)}
            onGuardar={(cambios) => { onGuardar(editarHabito(habito, cambios)); setEditando(false); }}
          />
        ) : (
          <>
            <Card>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>
                {describirRegla(reglaDe(habito))}{cat ? ` · ${cat.nombre}` : ''}
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Cifra n={e.rachaActual} label={e.unidad === 'semana' ? 'Semanas seguidas' : 'Días seguidos'} accent={accent} />
                <Cifra n={e.mejorRacha} label="Mejor racha" accent={accent} />
                <Cifra n={e.totalCompletado} label="Veces completado" accent={accent} />
                <Cifra n={`${e.porcentaje} %`} label="Cumplimiento" accent={accent} />
              </div>
              {/* ⚠️ Se dice desde cuándo se cuenta, para que el porcentaje no
                  parezca un juicio sobre toda su vida. */}
              {e.primerDia ? (
                <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>
                  Desde el {formatFecha(e.primerDia)}, contando solo los días que tocaban.
                </p>
              ) : (
                <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>Todavía no lo has marcado ningún día.</p>
              )}
            </Card>

            <Card>
              <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: COLORS.textMuted }}>Historial</p>
              <div className="flex flex-col gap-1">
                {historialCompacto(habito, hoy).map((sem) => (
                  <div key={sem.lunes} className="flex items-center gap-1">
                    {sem.dias.map((d) => (
                      <div
                        key={d.fecha}
                        title={d.fecha}
                        className="flex-1 rounded"
                        style={{
                          height: 10,
                          background: d.estado === ESTADOS_DIA.COMPLETADO ? accent
                            : d.estado === ESTADOS_DIA.PERDIDO ? COLORS.negative
                              : COLORS.surface2,
                          opacity: d.estado === ESTADOS_DIA.NO_TOCA || d.estado === ESTADOS_DIA.FUTURO ? 0.3 : 1,
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>
                Las últimas {SEMANAS_HISTORIAL} semanas. Los días que no tocaban salen apagados, no como un fallo.
              </p>
            </Card>

            <Card>
              <div className="flex flex-wrap items-center gap-2">
                <GhostBtn icon={Pencil} onClick={() => setEditando(true)}>Editar</GhostBtn>
                <GhostBtn
                  icon={habito.activo === false ? Play : Pause}
                  onClick={() => onGuardar(habito.activo === false ? reanudarHabito(habito) : pausarHabito(habito))}
                >
                  {habito.activo === false ? 'Reanudar' : 'Pausar'}
                </GhostBtn>
                {/* 🚨 *"Eliminar debe pedir confirmación para evitar errores."* Y aquí
                    SÍ se pregunta, a diferencia de lo que va a la papelera: un hábito
                    se lleva su historial entero por delante. */}
                <BotonBorrarDefinitivo
                  onConfirm={() => { onEliminar(habito.id); onCerrar(); }}
                  label="Eliminar el hábito"
                  titulo={`¿Eliminar «${habito.nombre}»?`}
                  detalle="Se borra el hábito y todo su historial."
                  className="flex items-center gap-1 text-xs"
                  style={{ color: COLORS.textMuted }}
                >
                  <><Trash2 size={13} /> Eliminar</>
                </BotonBorrarDefinitivo>
              </div>
              <p className="text-[11px] mt-2 leading-snug" style={{ color: COLORS.textMuted }}>
                Pausarlo lo saca de los de hoy sin tocar su historial. Eliminarlo se lo lleva entero.
              </p>
            </Card>
          </>
        )}
      </div>
    </div>
  );

  return typeof document === 'undefined' ? contenido : createPortal(contenido, document.body);
}

function HabitosTab({ habitos, onAdd, onUpdate, onDelete, accent }) {
  const [crear, setCrear] = useState(false);
  const [filtro, setFiltro] = useState(FILTRO_HABITOS_POR_DEFECTO);
  const [abierto, setAbierto] = useState(null);
  const hoy = todayISO();

  const progreso = progresoDelDia(habitos, hoy);
  const visibles = filtrarHabitos(habitos, filtro, hoy);
  const abiertoAhora = abierto ? habitos.find((h) => h.id === abierto) || null : null;

  /* 🚨 **UN FALLO QUE ENCONTRÓ EL RECORRIDO EN CHROMIUM.** Se entra por el filtro
     "Hoy", así que **crear un hábito de lunes, miércoles y viernes un domingo lo
     hacía DESAPARECER**: se guardaba perfectamente, pero él no lo veía por ninguna
     parte. Y los filtros solo salían con tres hábitos o más, así que con uno no
     había ni forma de encontrarlo.

     Dos arreglos, los dos de sentido común:
     · Al crear uno, si no cabe en el filtro puesto, **se cambia de filtro**: lo
       acabas de crear, tienes que verlo.
     · Y los filtros aparecen **en cuanto algo queda escondido**, no a partir de
       tres: una salida que solo existe cuando ya tienes muchos no es una salida. */
  const hayEscondidos = visibles.length < habitos.length;
  const mostrarFiltros = habitos.length >= 3 || hayEscondidos;

  const crearYVer = (form) => {
    const h = crearHabito(form);
    if (!h) return;
    onAdd(h);
    setCrear(false);
    if (!filtrarHabitos([h], filtro, hoy).length) setFiltro('todos');
  };

  /* 🚨 *"Si el usuario no tiene hábitos: NO mostrar una pantalla vacía."* */
  if (habitos.length === 0 && !crear) {
    return (
      <Card>
        <p className="text-sm font-bold" style={{ color: COLORS.text }}>{VACIO_HABITOS.titulo}</p>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: COLORS.textMuted }}>{VACIO_HABITOS.frase}</p>
        <div className="mt-3">
          <PrimaryButton accent={accent} icon={Plus} onClick={() => setCrear(true)}>{VACIO_HABITOS.boton}</PrimaryButton>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <ProgresoDelDia progreso={progreso} accent={accent} />

      {crear ? (
        <FormularioHabito
          accent={accent}
          onCancelar={() => setCrear(false)}
          onGuardar={crearYVer}
        />
      ) : (
        <button
          onClick={() => setCrear(true)}
          className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 toque-44"
          style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, color: accent }}
          aria-label="Nuevo hábito"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span className="text-xs font-semibold">Nuevo hábito</span>
        </button>
      )}

      {/* Los filtros cuando hay bastantes **o cuando algo queda escondido**: sin
          eso, un hábito que hoy no toca no se puede encontrar. */}
      {mostrarFiltros && (
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {FILTROS_HABITOS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap flex-shrink-0"
              style={filtro === f.id
                ? { background: accent, color: COLORS.textOnAccent }
                : { background: COLORS.surface2, color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}
              aria-label={`Ver ${f.label.toLowerCase()}`}
              aria-pressed={filtro === f.id}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {visibles.length === 0 ? (
        <EmptyHint
          text={hayEscondidos
            ? `${vacioDeFiltro(filtro, hoy)} Tienes ${habitos.length === 1 ? 'uno' : habitos.length} en «Todos».`
            : vacioDeFiltro(filtro, hoy)}
        />
      ) : (
        <div className="space-y-2">
          {visibles.map((h, i) => (
            <TarjetaHabito
              key={h.id}
              habito={h}
              hoy={hoy}
              accent={accent}
              indice={i}
              onAlternar={() => onUpdate(alternarHabito(h, hoy))}
              onAbrir={() => setAbierto(h.id)}
            />
          ))}
        </div>
      )}

      <AIPanel
        label="Consejo de hábitos"
        accent={accent}
        buildPrompt={() =>
          `Hábitos de Josué y su estado (JSON): ${JSON.stringify(habitos.map((h) => {
            const e = estadisticasHabito(h, hoy);
            return { nombre: h.nombre, frecuencia: describirRegla(reglaDe(h)), rachaActual: e.rachaActual, mejorRacha: e.mejorRacha };
          }))}. ` +
          `Dale un consejo breve y animado sobre cuál priorizar o cómo va, sin ser condescendiente ni castigar los fallos.`
        }
      />

      {abiertoAhora && (
        <DetalleHabito
          habito={abiertoAhora}
          hoy={hoy}
          accent={accent}
          onCerrar={() => setAbierto(null)}
          onGuardar={onUpdate}
          onEliminar={onDelete}
        />
      )}
    </div>
  );
}

/* ---------- Rutinas (E3 F28 · PR F6) ---------- */
/* *"Convierte tus acciones en rutina."* La idea visual es **flujo / secuencia /
   ejecución**, no una lista: por eso la tarjeta lleva ▶ y el modo de ejecución
   es una pantalla distinta de la de edición. */

function BarraFlujo({ porcentaje, accent }) {
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
      <div className="h-full rounded-full" style={{ width: `${porcentaje}%`, background: accent, transition: 'width 0.4s ease' }} />
    </div>
  );
}

function TarjetaRutina({ rutina, ejecuciones, hoy, accent, onAbrir, onIniciar }) {
  const prox = proximaEjecucion(rutina, hoy);
  const ult = ultimaEjecucion(rutina.id, ejecuciones, hoy);
  const cat = categoriaRutina(rutina.categoria);
  return (
    <Card className="flex items-start gap-3" style={{ opacity: rutina.archivada ? 0.6 : 1 }}>
      <button onClick={() => onAbrir(rutina)} className="flex-1 text-left min-w-0">
        <p className="text-base font-bold truncate" style={{ color: COLORS.text }}>
          <span aria-hidden="true">{rutina.icono}</span> {rutina.nombre}
        </p>
        <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{textoDuracion(rutina)}</p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-xs" style={{ color: COLORS.textMuted }}>
            {prox.programada ? `Próxima: ${prox.texto}` : prox.texto}
          </span>
          {ult && <span className="text-xs" style={{ color: COLORS.textMuted }}>Última vez: {ult.texto}</span>}
          {cat && <span className="text-xs" style={{ color: COLORS.textMuted }}>{cat.icono} {cat.nombre}</span>}
        </div>
      </button>
      {/* ⚠️ Una rutina sin pasos no ofrece ▶: arrancar un flujo vacío dejaría una
          pantalla de ejecución sin nada que hacer (regla 8). */}
      {!rutina.archivada && rutina.pasos.length > 0 && (
        <button
          onClick={() => onIniciar(rutina)}
          aria-label={`Iniciar ${rutina.nombre}`}
          className="toque-44 p-1.5 -m-1.5 shrink-0 rounded-full"
          style={{ background: accent, color: COLORS.textOnAccent, padding: 10 }}
        >
          <Play size={16} />
        </button>
      )}
    </Card>
  );
}

export function FormularioRutina({ rutina = null, accent, onGuardar, onCancelar }) {
  const [form, setForm] = useState({
    nombre: rutina?.nombre || '',
    descripcion: rutina?.descripcion || '',
    icono: rutina?.icono || ICONO_RUTINA_POR_DEFECTO,
    categoria: rutina?.categoria || '',
  });
  const valido = !!form.nombre.trim();
  const guardar = () => {
    if (!valido) return;
    const campos = { nombre: form.nombre, descripcion: form.descripcion, icono: form.icono, categoria: form.categoria || null };
    onGuardar(rutina ? editarRutina(rutina, campos) : crearRutina(campos));
  };
  return (
    <Card>
      <Field label="Nombre">
        <TextInput
          aria-label="Nombre de la rutina" value={form.nombre}
          onChange={(ev) => setForm({ ...form, nombre: ev.target.value })}
          placeholder="Ej. rutina de mañana"
        />
      </Field>
      <Field label="Descripción (opcional)">
        <TextInput
          aria-label="Descripción de la rutina" value={form.descripcion}
          onChange={(ev) => setForm({ ...form, descripcion: ev.target.value })}
        />
      </Field>
      <Field label="Icono">
        <div className="flex gap-2 flex-wrap">
          {ICONOS_RUTINA.map((ic) => (
            <button
              key={ic} onClick={() => setForm({ ...form, icono: ic })}
              aria-label={`Icono ${ic}`} aria-pressed={form.icono === ic}
              className="rounded-xl toque-44"
              style={{
                background: form.icono === ic ? accent : COLORS.card,
                border: `1px solid ${COLORS.border}`, padding: '8px 10px', fontSize: 18,
              }}
            >
              <span aria-hidden="true">{ic}</span>
            </button>
          ))}
        </div>
      </Field>
      <Field label="Categoría (opcional)">
        <Select value={form.categoria} onChange={(ev) => setForm({ ...form, categoria: ev.target.value })} aria-label="Categoría de la rutina">
          <option value="">Sin categoría</option>
          {CATEGORIAS_RUTINA.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </Select>
      </Field>
      <div className="flex gap-2 mt-3">
        <PrimaryButton accent={accent} icon={rutina ? Pencil : Plus} onClick={guardar} disabled={!valido}>
          {rutina ? 'Guardar cambios' : 'Crear rutina'}
        </PrimaryButton>
        <GhostBtn onClick={onCancelar}>Cancelar</GhostBtn>
      </div>
    </Card>
  );
}

function EditorPasos({ rutina, accent, onGuardar }) {
  const [texto, setTexto] = useState('');
  const [minutos, setMinutos] = useState('');
  const [tipo, setTipo] = useState(TIPO_PASO_POR_DEFECTO);

  const anadir = () => {
    const paso = crearPaso({ texto, minutos: minutos || null, tipo });
    if (!paso) return;
    onGuardar(anadirPaso(rutina, paso));
    setTexto(''); setMinutos(''); setTipo(TIPO_PASO_POR_DEFECTO);
  };

  return (
    <Card>
      <SectionTitle>Pasos</SectionTitle>
      {rutina.pasos.length === 0 && (
        <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>
          Todavía no tiene pasos. El orden es lo que convierte una lista en un flujo.
        </p>
      )}
      {rutina.pasos.map((p, i) => {
        const t = tipoPaso(p.tipo);
        return (
          <div key={p.id} className="flex items-center gap-2 py-1.5">
            <span className="text-xs w-5 shrink-0" style={{ color: COLORS.textMuted }}>{i + 1}.</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate" style={{ color: COLORS.text }}>
                <span aria-hidden="true">{t.icono}</span> {p.texto}
              </p>
              {p.minutos && <p className="text-xs" style={{ color: COLORS.textMuted }}>{p.minutos} min</p>}
            </div>
            {/* ⚠️ Flechas, no arrastre: funcionan con el lector de pantalla, y el
                arrastre sería un segundo mecanismo para lo mismo (EH F50). */}
            <button
              onClick={() => { const r = moverPaso(rutina, p.id, 'arriba'); if (r) onGuardar(r); }}
              aria-label={`Subir el paso ${p.texto}`} disabled={i === 0}
              className="toque-44 p-1.5 -m-1.5" style={{ opacity: i === 0 ? 0.3 : 1 }}
            >
              <ChevronUp size={16} style={{ color: COLORS.textMuted }} />
            </button>
            <button
              onClick={() => { const r = moverPaso(rutina, p.id, 'abajo'); if (r) onGuardar(r); }}
              aria-label={`Bajar el paso ${p.texto}`} disabled={i === rutina.pasos.length - 1}
              className="toque-44 p-1.5 -m-1.5" style={{ opacity: i === rutina.pasos.length - 1 ? 0.3 : 1 }}
            >
              <ChevronDown size={16} style={{ color: COLORS.textMuted }} />
            </button>
            <button
              onClick={() => onGuardar(quitarPaso(rutina, p.id))}
              aria-label={`Eliminar el paso ${p.texto}`} className="toque-44 p-1.5 -m-1.5"
            >
              <Trash2 size={15} style={{ color: COLORS.textMuted }} />
            </button>
          </div>
        );
      })}

      <div className="mt-3 space-y-2">
        <TextInput
          aria-label="Nombre del paso" value={texto}
          onChange={(ev) => setTexto(ev.target.value)} placeholder="Ej. beber agua"
        />
        <div className="grid grid-cols-2 gap-2">
          <Select value={tipo} onChange={(ev) => setTipo(ev.target.value)} aria-label="Tipo de paso">
            {TIPOS_PASO.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </Select>
          <TextInput
            type="number" min="1" aria-label="Minutos del paso" value={minutos}
            onChange={(ev) => setMinutos(ev.target.value)} placeholder="min (opcional)"
          />
        </div>
        <PrimaryButton accent={accent} icon={Plus} onClick={anadir} disabled={!texto.trim()}>Añadir paso</PrimaryButton>
      </div>
    </Card>
  );
}

function EditorProgramacion({ rutina, accent, onGuardar }) {
  const prog = rutina.programacion;
  const p = programacion(prog.tipo);
  const alternarDia = (d) => {
    const dias = prog.dias.includes(d) ? prog.dias.filter((x) => x !== d) : [...prog.dias, d];
    onGuardar(editarRutina(rutina, { programacion: { ...prog, dias } }));
  };
  return (
    <Card>
      <SectionTitle>Programación</SectionTitle>
      <Select
        value={prog.tipo} aria-label="Programación de la rutina"
        onChange={(ev) => onGuardar(editarRutina(rutina, { programacion: { ...prog, tipo: ev.target.value } }))}
      >
        {PROGRAMACIONES.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
      </Select>
      <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{p.explica}</p>
      {p.pideDias && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {NOMBRES_DIA.map((n, d) => (
            <button
              key={n} onClick={() => alternarDia(d)}
              aria-label={n} aria-pressed={prog.dias.includes(d)}
              className="rounded-xl text-xs font-semibold toque-44"
              style={{
                background: prog.dias.includes(d) ? accent : COLORS.card,
                color: prog.dias.includes(d) ? COLORS.textOnAccent : COLORS.text,
                border: `1px solid ${COLORS.border}`, padding: '8px 10px',
              }}
            >
              {n.slice(0, 1)}
            </button>
          ))}
        </div>
      )}
      {p.clase && (
        <Field label="Hora (opcional)">
          <TextInput
            type="time" aria-label="Hora de la rutina" value={prog.hora}
            onChange={(ev) => onGuardar(editarRutina(rutina, { programacion: { ...prog, hora: ev.target.value } }))}
          />
        </Field>
      )}
      {/* Regla 8: se guarda la programación, y se dice que todavía no avisa. */}
      <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>
        Se guarda cuándo toca. Los avisos llegarán cuando estén los de Productividad.
      </p>
    </Card>
  );
}

function DetalleRutina({ rutina, ejecuciones, hoy, accent, onGuardar, onDelete, onIniciar, onCerrar }) {
  const [editando, setEditando] = useState(false);
  const historial = historialDeRutina(rutina.id, ejecuciones);
  const stats = estadisticasRutinas(ejecuciones, { rutinaId: rutina.id });
  const racha = rachaDeRutina(rutina, ejecuciones, hoy);

  if (editando) {
    return (
      <FormularioRutina
        rutina={rutina} accent={accent}
        onGuardar={(r) => { if (r) onGuardar(r); setEditando(false); }}
        onCancelar={() => setEditando(false)}
      />
    );
  }

  return (
    <div className="space-y-3">
      <button onClick={onCerrar} className="flex items-center gap-1 text-xs toque-44" style={{ color: COLORS.textMuted }}>
        <ArrowLeft size={14} /> Volver a las rutinas
      </button>

      <Card>
        <p className="text-lg font-bold" style={{ color: COLORS.text }}>
          <span aria-hidden="true">{rutina.icono}</span> {rutina.nombre}
        </p>
        {rutina.descripcion && <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>{rutina.descripcion}</p>}
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{textoDuracion(rutina)}</p>
        {rutina.pasos.length > 0 && !rutina.archivada && (
          <div className="mt-3">
            <PrimaryButton accent={accent} icon={Play} onClick={() => onIniciar(rutina)}>Iniciar</PrimaryButton>
          </div>
        )}
      </Card>

      <EditorPasos rutina={rutina} accent={accent} onGuardar={onGuardar} />
      <EditorProgramacion rutina={rutina} accent={accent} onGuardar={onGuardar} />

      <Card>
        <SectionTitle>Cómo va</SectionTitle>
        <p className="text-xs" style={{ color: COLORS.textMuted }}>Completadas · {stats.completadas}</p>
        <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>Tiempo total · {stats.tiempoTotal}</p>
        {/* ⚠️ Sin ni una ejecución no hay cumplimiento: un 0 % diría que lo hace
            mal cuando lo que pasa es que aún no la ha ejecutado. */}
        {stats.cumplimiento !== null && (
          <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>Cumplimiento · {stats.cumplimiento} %</p>
        )}
        {/* ⚠️ Y sin programación no hay racha: no se penaliza lo que no se
            comprometió a hacer. */}
        {racha && <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>Racha · {racha.actual} días</p>}
        {!racha && (
          <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
            Sin programación no hay racha: la inicias cuando quieres.
          </p>
        )}
      </Card>

      <Card>
        <SectionTitle>Historial</SectionTitle>
        {historial.length === 0 && (
          <p className="text-xs" style={{ color: COLORS.textMuted }}>Todavía no la has hecho ninguna vez.</p>
        )}
        {historial.slice(0, 10).map((e) => {
          const pr = progresoEjecucion(e);
          const f = fechaDeEjecucion(e);
          return (
            <p key={e.id} className="text-xs py-1" style={{ color: COLORS.textMuted }}>
              {f === hoy ? 'Hoy' : f.split('-').reverse().slice(0, 2).join('/')} ·{' '}
              {e.estado === 'completada' ? '✓' : '·'} {pr.hechos}/{pr.total} pasos · {textoDuracionEjecucion(e)}
              {e.estado === 'abandonada' ? ' · abandonada' : ''}
            </p>
          );
        })}
      </Card>

      <Card>
        <div className="flex gap-2 flex-wrap">
          <GhostBtn icon={Pencil} onClick={() => setEditando(true)}>Editar</GhostBtn>
          <GhostBtn icon={Archive} onClick={() => onGuardar(archivarRutina(rutina))}>
            {rutina.archivada ? 'Desarchivar' : 'Archivar'}
          </GhostBtn>
        </div>
        <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>
          Archivar la saca de las activas. El historial se queda entero.
        </p>
      </Card>

      <Card>
        <button
          onClick={() => { onDelete(rutina.id); onCerrar(); }}
          aria-label={`Eliminar la rutina ${rutina.nombre}`}
          className="flex items-center gap-2 text-xs font-semibold toque-44"
          style={{ color: COLORS.danger }}
        >
          <Trash2 size={15} /> Eliminar rutina
        </button>
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
          Puedes recuperarla desde Eliminados recientemente.
        </p>
      </Card>
    </div>
  );
}

export function ModoEjecucion({ ejecucion, accent, onCambiar, onTerminar, onSalir }) {
  const [preguntandoSalida, setPreguntandoSalida] = useState(false);
  /* 🚨 Un latido que SOLO redibuja. El tiempo sale de restar instantes, así que
     si el móvil congela la pestaña el reloj se pone al día solo (E3 F25). */
  const [, latir] = useState(0);
  const corriendo = !ejecucionPausada(ejecucion) && ejecucion.estado === 'en_curso';
  useEffect(() => {
    if (!corriendo) return undefined;
    const id = setInterval(() => latir((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [corriendo]);

  const paso = pasoActual(ejecucion);
  const pr = progresoEjecucion(ejecucion);
  const acabada = todosLosPasosHechos(ejecucion);
  const t = tipoPaso(paso.tipo);

  if (acabada) {
    return (
      <div className="space-y-3">
        <Card className="text-center rutina-fin">
          <p className="text-lg font-bold" style={{ color: COLORS.text }}>Rutina completada ✓</p>
          <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>{textoDuracionEjecucion(ejecucion)}</p>
          <p className="text-sm" style={{ color: COLORS.textMuted }}>{pr.hechos} / {pr.total} pasos</p>
          {pr.saltados > 0 && (
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{pr.saltados} saltados</p>
          )}
        </Card>
        <PrimaryButton accent={accent} onClick={onTerminar}>Volver a Rutinas</PrimaryButton>
      </div>
    );
  }

  if (preguntandoSalida) {
    return (
      <Card>
        <SectionTitle>¿Salir de la rutina?</SectionTitle>
        {SALIDAS_EJECUCION.map((op) => (
          <div key={op.id} className="py-1.5">
            <GhostBtn onClick={() => {
              setPreguntandoSalida(false);
              if (op.id === 'guardar') onSalir('guardar');
              if (op.id === 'salir') onSalir('salir');
            }}
            >
              {op.nombre}
            </GhostBtn>
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{op.explica}</p>
          </div>
        ))}
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card>
        <p className="text-xs" style={{ color: COLORS.textMuted }}>
          <span aria-hidden="true">{ejecucion.icono}</span> {ejecucion.nombre}
        </p>
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Paso {pr.texto}</p>
        <div className="mt-2"><BarraFlujo porcentaje={pr.porcentaje} accent={accent} /></div>
        <p className="text-2xl font-bold mt-3" style={{ color: COLORS.text }}>
          <span aria-hidden="true">{t.icono}</span> {paso.texto}
        </p>
        {paso.minutos && <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>{paso.minutos} min</p>}
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
          Llevas {textoDuracionEjecucion(ejecucion)} · quedan {pr.total - pr.hechos - pr.saltados} pasos
        </p>
        {/* ⚠️ Un paso de Pomodoro NO trae un temporizador: dice dónde está el que
            ya existe. Aquí no se abre solo, porque salir de la rutina a mitad la
            dejaría en curso sin que él lo haya pedido. */}
        {paso.tipo === 'pomodoro' && (
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
            Este paso se cronometra en Pomodoro, la mini-app de al lado.
          </p>
        )}
      </Card>

      <PrimaryButton accent={accent} icon={CheckCircle2} onClick={() => onCambiar(completarPaso(ejecucion))}>
        Completar
      </PrimaryButton>

      <div className="flex gap-2 flex-wrap">
        <GhostBtn icon={ArrowLeft} onClick={() => { const e = pasoAnterior(ejecucion); if (e) onCambiar(e); }}>Anterior</GhostBtn>
        <GhostBtn onClick={() => { const e = pasoSiguiente(ejecucion); if (e) onCambiar(e); }}>Siguiente</GhostBtn>
        <GhostBtn onClick={() => onCambiar(saltarPaso(ejecucion))}>Saltar</GhostBtn>
        {ejecucionPausada(ejecucion)
          ? <GhostBtn icon={Play} onClick={() => onCambiar(reanudarEjecucion(ejecucion))}>Continuar</GhostBtn>
          : <GhostBtn icon={Pause} onClick={() => onCambiar(pausarEjecucion(ejecucion))}>Pausar</GhostBtn>}
        <GhostBtn onClick={() => setPreguntandoSalida(true)}>Salir</GhostBtn>
      </div>
    </div>
  );
}

function RutinasTab({ rutinas, ejecuciones, enCurso, accent, onAdd, onUpdate, onDelete, onCambiarEjecucion, onRegistrarEjecucion }) {
  const hoy = todayISO();
  const [crear, setCrear] = useState(false);
  const [abierta, setAbierta] = useState(null);
  const [filtro, setFiltro] = useState('activas');

  // 🚨 La ejecución en curso manda sobre todo: se recupera al volver, porque
  // está guardada (criterio 12 y 22).
  if (enCurso) {
    return (
      <ModoEjecucion
        ejecucion={enCurso} accent={accent}
        onCambiar={(e) => { if (e) onCambiarEjecucion(e); }}
        onTerminar={() => onRegistrarEjecucion(finalizarEjecucion(enCurso))}
        onSalir={(que) => {
          if (que === 'guardar') onCambiarEjecucion(enCurso, { salir: true });
          if (que === 'salir') onRegistrarEjecucion(abandonarEjecucion(enCurso));
        }}
      />
    );
  }

  const detalle = abierta ? rutinas.find((r) => r.id === abierta) : null;
  const visibles = filtrarRutinas(rutinas, filtro);

  if (detalle) {
    return (
      <DetalleRutina
        rutina={detalle} ejecuciones={ejecuciones} hoy={hoy} accent={accent}
        onGuardar={onUpdate} onDelete={onDelete}
        onIniciar={(r) => onCambiarEjecucion(iniciarEjecucion(r))}
        onCerrar={() => setAbierta(null)}
      />
    );
  }

  if (crear) {
    return (
      <FormularioRutina
        accent={accent}
        onGuardar={(r) => { if (r) { onAdd(r); setAbierta(r.id); } setCrear(false); }}
        onCancelar={() => setCrear(false)}
      />
    );
  }

  return (
    <div className="space-y-3">
      <Card>
        <p className="text-sm" style={{ color: COLORS.textMuted }}>{CABECERA_RUTINAS.frase}</p>
      </Card>

      <PrimaryButton accent={accent} icon={Plus} onClick={() => setCrear(true)}>Nueva rutina</PrimaryButton>

      {rutinas.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTROS_RUTINA.map((f) => (
            <ToggleTab key={f.id} active={filtro === f.id} accent={accent} onClick={() => setFiltro(f.id)}>
              {f.nombre}
            </ToggleTab>
          ))}
        </div>
      )}

      {rutinas.length === 0 && (
        <Card className="text-center">
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{VACIO_RUTINAS.titulo}</p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{VACIO_RUTINAS.texto}</p>
        </Card>
      )}
      {rutinas.length > 0 && visibles.length === 0 && (
        <EmptyHint text="Ninguna encaja con este filtro. Prueba con “Todas”." />
      )}

      {visibles.map((r) => (
        <TarjetaRutina
          key={r.id} rutina={r} ejecuciones={ejecuciones} hoy={hoy} accent={accent}
          onAbrir={(x) => setAbierta(x.id)}
          onIniciar={(x) => onCambiarEjecucion(iniciarEjecucion(x))}
        />
      ))}
    </div>
  );
}

/* ---------- Pomodoro ---------- */
/* ⚠️ E3 F25 (PR F3) — las dos constantes de la Fase 6 se han ido: las duraciones
   son configurables y sus valores por defecto viven en `CONFIG_POMODORO_POR_DEFECTO`.
   Dejarlas aquí habría sido un segundo sitio donde dice cuánto dura un pomodoro. */

/* ══════════════════════════════════════════════════════════════════════════
   ENTREGA 3 · FASE 25 (PR F3) — POMODORO
   ══════════════════════════════════════════════════════════════════════════

   🚨 **El temporizador ya no cuenta hacia atrás.** Lo que había era un
   `setInterval` restando un segundo cada vez — exactamente lo que el enunciado
   prohíbe: *"no implementar un contador que simplemente se base en restar
   segundos… utilizar timestamps"*. Con aquello, bloquear el iPhone diez minutos
   y volver dejaba el reloj diez minutos por detrás de la realidad.

   Ahora el intervalo **solo redibuja**: el tiempo restante se calcula en
   `pomodoro.js` restando instantes, así que da igual que la pestaña se congele. */

/* El círculo. *"Debe existir una animación/progreso circular que represente el
   tiempo restante."* SVG, sin librería. */
export function TemporizadorCircular({ restante, fraccion, tipo, accent, corriendo }) {
  const R = 78;
  const circunferencia = 2 * Math.PI * R;
  const t = tipoSesion(tipo);
  const color = t.esDescanso ? COLORS.positive : accent;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
      <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx="100" cy="100" r={R} fill="none" stroke={COLORS.surface2} strokeWidth="10" />
        <circle
          cx="100" cy="100" r={R} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia * Math.min(1, Math.max(0, fraccion))}
          className="aro-pomodoro"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <p
          className="text-4xl font-extrabold tabular-nums"
          style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}
          aria-live="polite"
        >
          {restante}
        </p>
        <p className="text-[11px] mt-1" style={{ color: corriendo ? color : COLORS.textMuted }}>{t.frase}</p>
      </div>
    </div>
  );
}

/* *"Crear una sección/modal de configuración."* Los seis ajustes del enunciado y
   ni uno más. */
export function ConfigPomodoro({ config, accent, onGuardar, onCerrar }) {
  const [form, setForm] = useState(normalizarConfig(config));
  const minutos = (campo, label) => (
    <Field key={campo} label={label}>
      <div className="flex gap-1.5 flex-wrap">
        {DURACIONES_SUGERIDAS.map((v) => (
          <button
            key={v}
            onClick={() => setForm({ ...form, [campo]: v })}
            className="rounded-full px-3 py-1.5 text-xs font-semibold toque-44"
            style={form[campo] === v
              ? { background: accent, color: COLORS.textOnAccent }
              : { background: COLORS.surface2, color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}
            aria-label={`${label}: ${v} minutos`}
            aria-pressed={form[campo] === v}
          >
            {v} min
          </button>
        ))}
      </div>
    </Field>
  );

  return (
    <Card>
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-sm font-bold" style={{ color: COLORS.text }}>Configuración</p>
        <GhostBtn onClick={onCerrar}>Cancelar</GhostBtn>
      </div>

      {minutos('enfoqueMin', 'Tiempo de enfoque')}
      {minutos('cortoMin', 'Descanso corto')}
      {minutos('largoMin', 'Descanso largo')}

      <Field label="Sesiones antes del descanso largo">
        <Select
          aria-label="Sesiones antes del descanso largo"
          value={String(form.sesionesAntesDelLargo)}
          onChange={(ev) => setForm({ ...form, sesionesAntesDelLargo: Number(ev.target.value) })}
        >
          {[2, 3, 4, 5, 6, 8].map((v) => <option key={v} value={v}>{v}</option>)}
        </Select>
      </Field>

      {/* ⚠️ Los dos automatismos nacen apagados: un descanso que arranca solo
          cuando él ya ha guardado el móvil deja un pomodoro a medias. */}
      <div className="space-y-2 mt-1">
        {[
          ['autoDescanso', 'Empezar el descanso automáticamente'],
          ['autoSiguiente', 'Empezar la siguiente sesión automáticamente'],
        ].map(([campo, label]) => (
          <button
            key={campo}
            onClick={() => setForm({ ...form, [campo]: !form[campo] })}
            className="w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 toque-44"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}
            aria-label={label}
            aria-pressed={form[campo]}
          >
            <span className="text-xs text-left" style={{ color: COLORS.text }}>{label}</span>
            <span
              className="text-[10px] font-bold rounded-full px-2 py-0.5"
              style={form[campo]
                ? { background: accent, color: COLORS.textOnAccent }
                : { background: COLORS.bg, color: COLORS.textMuted }}
            >
              {form[campo] ? 'Sí' : 'No'}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3">
        <PrimaryButton accent={accent} onClick={() => onGuardar(form)}>Guardar</PrimaryButton>
      </div>
    </Card>
  );
}

/* *"HOY: pomodoros completados, tiempo concentrado. ESTA SEMANA: …"* */
export function EstadisticasPomodoro({ hoy, semana, accent }) {
  const bloque = (titulo, e) => (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: COLORS.textMuted }}>{titulo}</p>
      <div className="grid grid-cols-2 gap-2">
        <Cifra n={e.pomodoros} label={e.pomodoros === 1 ? 'pomodoro' : 'pomodoros'} accent={accent} />
        {/* ⚠️ Sin tiempo concentrado se dice con un guion, no con «0 min»: un cero
            de minutos no informa de nada. */}
        <Cifra n={e.tiempo || '—'} label="concentrado" accent={accent} />
      </div>
    </div>
  );
  return (
    <Card>
      <div className="space-y-3">
        {bloque('Hoy', hoy)}
        {bloque('Esta semana', semana)}
      </div>
      {hoy.interrumpidas > 0 ? (
        <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>
          {hoy.interrumpidas} {hoy.interrumpidas === 1 ? 'sesión cancelada' : 'sesiones canceladas'} hoy. No cuentan como pomodoro.
        </p>
      ) : null}
    </Card>
  );
}

function PomodoroTab({ config, sesionEnCurso, sesiones, tareas = [], accent, onGuardarConfig, onCambiarSesion, onFinalizar }) {
  const [ajustes, setAjustes] = useState(false);
  /* 🚨 Este estado **no es el tiempo**: es solo un latido que fuerza a redibujar.
     El tiempo sale de `restanteMs`, que resta instantes. Si el móvil congela la
     pestaña, el latido se para y el reloj se pone al día solo al volver. */
  const [, latir] = useState(0);
  const sesion = normalizarSesionEnCurso(sesionEnCurso);
  const corriendo = !!sesion && !estaPausada(sesion);
  const cfg = normalizarConfig(config);

  useEffect(() => {
    if (!corriendo) return undefined;
    const id = setInterval(() => latir((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [corriendo]);

  /* Cuando el tiempo llega a cero: registrar, sonar y pasar a lo siguiente. Va en
     un efecto y no en el intervalo para que también salte al **volver** de tener
     el móvil bloqueado, que es cuando de verdad ha terminado. */
  useEffect(() => {
    if (!sesion || !haTerminado(sesion)) return;
    /* 🚨 Se EMITE, no se reproduce: el motor de SO F1 decide si suena. */
    emitir(EVENTO_AL_TERMINAR, { de: 'pomodoro', tipo: sesion.tipo });
    const siguiente = siguienteEnElCiclo(sesion, cfg);
    const auto = tipoSesion(siguiente.tipo).esDescanso ? cfg.autoDescanso : cfg.autoSiguiente;
    const nacida = iniciarSesion(siguiente.tipo, cfg, { sesionesHechas: siguiente.sesionesHechas });
    /* 🚨 UNA SOLA LLAMADA. Con dos —registrar y luego cambiar— la segunda parte
       del mismo estado del cierre y borra lo que escribió la primera (regla 5).
       Así se perdía la sesión completada, y con ella el contador del día. */
    onFinalizar(completar(sesion), auto ? nacida : { ...nacida, pausadoEn: Date.now() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesion && haTerminado(sesion)]);

  const hoy = todayISO();
  const eHoy = estadisticasHoy(sesiones, hoy);
  const eSemana = estadisticasSemana(sesiones, hoy);
  const enMarcha = sesion || iniciarSesion('focus', cfg, { ahora: Date.now() });
  const restante = sesion ? restanteMs(sesion) : duracionDe('focus', cfg);
  const fraccion = sesion ? 1 - progreso(sesion) : 1;
  const posicion = posicionEnElCiclo(sesion, cfg);

  const empezar = () => onCambiarSesion(iniciarSesion(sesion ? sesion.tipo : 'focus', cfg, {
    sesionesHechas: sesion ? sesion.sesionesHechas : 0,
  }));

  // 🚨 Igual que al terminar: registrar y limpiar van en la misma escritura.
  const cancelarSesion = () => onFinalizar(sesion ? cancelar(sesion) : null, null);

  if (ajustes) {
    return (
      <ConfigPomodoro
        config={cfg}
        accent={accent}
        onCerrar={() => setAjustes(false)}
        onGuardar={(c) => { onGuardarConfig(c); setAjustes(false); }}
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: COLORS.textMuted }}>{CABECERA_POMODORO.frase}</p>
      {/* ⚠️ Si la sesión salió de una tarea, se dice cuál: el `tareaId` que
          guarda `iniciarSesion` no sirve de nada si no se ve (E3 F26). */}
      {tareaDeSesion(sesion, tareas) && (
        <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
          Concentrándote en: {tareaDeSesion(sesion, tareas).texto}
        </p>
      )}

      {/* *"MODO DE CONCENTRACIÓN: cuando haya una sesión activa, reducir
          visualmente elementos innecesarios."* Con una sesión corriendo,
          las estadísticas y el historial se apartan. */}
      <Card className="flex flex-col items-center py-6">
        <p className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: COLORS.textMuted }}>
          {posicion.texto}
        </p>
        <TemporizadorCircular
          restante={formatearTiempo(restante)}
          fraccion={fraccion}
          tipo={enMarcha.tipo}
          accent={accent}
          corriendo={corriendo}
        />

        <div className="flex items-center gap-2 mt-5 flex-wrap justify-center">
          {!sesion || estaPausada(sesion) ? (
            <button
              onClick={() => (sesion ? onCambiarSesion(reanudar(sesion)) : empezar())}
              className="rounded-full px-6 py-3 text-sm font-bold toque-44 transition-transform active:scale-95"
              style={{ background: accent, color: COLORS.textOnAccent }}
              aria-label={sesion ? 'Continuar la sesión' : 'Iniciar la sesión'}
            >
              {sesion ? '▶ Continuar' : '▶ Iniciar'}
            </button>
          ) : (
            <button
              onClick={() => onCambiarSesion(pausar(sesion))}
              className="rounded-full px-6 py-3 text-sm font-bold toque-44 transition-transform active:scale-95"
              style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
              aria-label="Pausar la sesión"
            >
              ⏸ Pausar
            </button>
          )}

          {sesion ? (
            <>
              <GhostBtn icon={RotateCcw} onClick={() => onCambiarSesion(reiniciar(sesion))}>Reiniciar</GhostBtn>
              <GhostBtn onClick={cancelarSesion}>Cancelar</GhostBtn>
            </>
          ) : (
            <GhostBtn onClick={() => setAjustes(true)}>Configurar</GhostBtn>
          )}
        </div>
      </Card>

      {/* Con una sesión en marcha, lo demás desaparece: *"pocas distracciones"*. */}
      {!corriendo && (
        <>
          <EstadisticasPomodoro hoy={eHoy} semana={eSemana} accent={accent} />

          {sesiones.length === 0 ? (
            <Card>
              <p className="text-sm font-bold" style={{ color: COLORS.text }}>{VACIO_POMODORO.titulo}</p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: COLORS.textMuted }}>{VACIO_POMODORO.frase}</p>
            </Card>
          ) : (
            <Card>
              <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: COLORS.textMuted }}>Últimas sesiones</p>
              <div className="space-y-1">
                {historialReciente(sesiones, 8).map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2">
                    <span className="text-xs truncate" style={{ color: COLORS.text }}>
                      {tipoSesion(s.tipo).nombre}
                      {s.interrumpida ? ' · cancelada' : ''}
                    </span>
                    <span className="text-[11px] flex-shrink-0" style={{ color: COLORS.textMuted }}>
                      {formatearDuracionLarga(s.duracionMs) || 'menos de un minuto'} · {formatFecha(s.fecha)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Tareas (E3 F26 · PR F4) ---------- */
/* *"abrir → ver qué tengo que hacer → completar → seguir."*
   🚨 Ni un temporizador aquí dentro: "Concentrarme" abre el Pomodoro que ya
   existe con el id de la tarea (apartado «INTEGRACIÓN CON POMODORO»). */

function ChipPrioridad({ id, size = 'sm' }) {
  const e = etiquetaDePrioridad(id);
  const color = COLORS[e.token] || COLORS.textMuted;
  return (
    <span
      className={`inline-flex items-center gap-1 ${size === 'sm' ? 'text-xs' : 'text-sm'} font-semibold`}
      style={{ color }}
    >
      {/* ⚠️ El icono Y la palabra: la prioridad nunca se distingue solo por el
          color (apartado «PRIORIDADES»). */}
      <span aria-hidden="true">{e.icono}</span>
      {e.nombre}
    </span>
  );
}

function TarjetaTarea({ tarea, hoy, accent, onCompletar, onAbrir, onConcentrarse, destacada }) {
  const cat = categoriaTarea(tarea.categoria);
  const estado = estadoDeFecha(tarea, hoy);
  const vencida = estado === 'vencida';
  const plan = planConcentrarse(tarea);

  return (
    <Card
      id={`tarea-${tarea.id}`}
      className="flex items-start gap-3"
      style={{
        transition: 'box-shadow 0.3s ease, opacity 0.3s ease',
        boxShadow: destacada ? `0 0 0 2px ${accent}` : 'none',
        opacity: tarea.hecha ? 0.6 : 1,
      }}
    >
      <button
        onClick={() => onCompletar(tarea)}
        aria-label={tarea.hecha ? `Marcar ${tarea.texto} como pendiente` : `Completar ${tarea.texto}`}
        className="toque-44 p-1.5 -m-1.5 shrink-0"
      >
        {tarea.hecha
          ? <CheckCircle2 size={20} className="tarea-hecha" style={{ color: accent }} />
          : <Circle size={20} style={{ color: COLORS.textMuted }} />}
      </button>

      <button onClick={() => onAbrir(tarea)} className="flex-1 text-left min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ color: COLORS.text, textDecoration: tarea.hecha ? 'line-through' : 'none' }}
        >
          {tarea.texto}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs" style={{ color: vencida ? COLORS.danger : COLORS.textMuted }}>
            {textoDeFecha(tarea, hoy)}
          </span>
          {!tarea.hecha && <ChipPrioridad id={tarea.prioridad} />}
          {cat && (
            <span className="text-xs" style={{ color: COLORS.textMuted }}>
              <span aria-hidden="true">{cat.icono}</span> {cat.nombre}
            </span>
          )}
        </div>
      </button>

      {plan && (
        <button
          onClick={() => onConcentrarse(tarea)}
          aria-label={`Concentrarme en ${tarea.texto} con Pomodoro`}
          className="toque-44 p-1.5 -m-1.5 shrink-0"
        >
          <Timer size={16} style={{ color: COLORS.textMuted }} />
        </button>
      )}
    </Card>
  );
}

function SeccionTareas({ seccion, tareas, hoy, accent, abierta, onAlternar, ...resto }) {
  if (!tareas.length) return null;
  return (
    <div className="space-y-2">
      <button
        onClick={onAlternar}
        className="w-full flex items-center justify-between toque-44"
        aria-expanded={abierta}
      >
        <span className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>
          {seccion.nombre} · {tareas.length}
        </span>
        {abierta
          ? <ChevronUp size={14} style={{ color: COLORS.textMuted }} />
          : <ChevronDown size={14} style={{ color: COLORS.textMuted }} />}
      </button>
      {abierta && tareas.map((t) => (
        <TarjetaTarea key={t.id} tarea={t} hoy={hoy} accent={accent} {...resto} />
      ))}
    </div>
  );
}

export function FormularioTarea({ tarea = null, hoy, accent, onGuardar, onCancelar }) {
  const [form, setForm] = useState({
    texto: tarea?.texto || '',
    descripcion: tarea?.descripcion || '',
    fecha: tarea?.fecha || '',
    hora: tarea?.hora || '',
    prioridad: tarea?.prioridad || PRIORIDAD_POR_DEFECTO,
    categoria: tarea?.categoria || '',
  });
  const valido = !!form.texto.trim();

  const guardar = () => {
    if (!valido) return;
    const campos = {
      texto: form.texto,
      descripcion: form.descripcion,
      fecha: form.fecha || null,
      hora: form.hora,
      categoria: form.categoria || null,
    };
    // ⚠️ `crearTarea` recibe `prioridadId`; `editarTarea` fusiona la tarea, así
    // que el campo se llama `prioridad`. No son el mismo objeto.
    onGuardar(tarea
      ? editarTarea(tarea, { ...campos, prioridad: form.prioridad })
      : crearTarea({ ...campos, prioridadId: form.prioridad }));
  };

  return (
    <Card>
      <Field label="Título">
        <TextInput
          aria-label="Título de la tarea"
          value={form.texto}
          onChange={(ev) => setForm({ ...form, texto: ev.target.value })}
          placeholder="Ej: Estudiar biología"
        />
      </Field>
      <Field label="Descripción (opcional)">
        <TextInput
          aria-label="Descripción de la tarea"
          value={form.descripcion}
          onChange={(ev) => setForm({ ...form, descripcion: ev.target.value })}
          placeholder="Detalles, si hacen falta"
        />
      </Field>

      {/* Fecha: los tres atajos del enunciado más el día suelto. Sin fecha es
          una opción válida, no un olvido. */}
      <Field label="Fecha (opcional)">
        <div className="flex gap-2 flex-wrap mb-2">
          <GhostBtn onClick={() => setForm({ ...form, fecha: hoy })}>Hoy</GhostBtn>
          <GhostBtn onClick={() => setForm({ ...form, fecha: addDiaISO(hoy) })}>Mañana</GhostBtn>
          <GhostBtn onClick={() => setForm({ ...form, fecha: '' })}>Sin fecha</GhostBtn>
        </div>
        <TextInput
          type="date" aria-label="Fecha de la tarea"
          value={form.fecha}
          onChange={(ev) => setForm({ ...form, fecha: ev.target.value })}
        />
      </Field>
      <Field label="Hora (opcional)">
        <TextInput
          type="time" aria-label="Hora de la tarea"
          value={form.hora}
          onChange={(ev) => setForm({ ...form, hora: ev.target.value })}
        />
      </Field>

      <Field label="Prioridad">
        <div className="flex gap-2">
          {PRIORIDADES.map((p) => (
            <button
              key={p.id}
              onClick={() => setForm({ ...form, prioridad: p.id })}
              aria-label={`Prioridad ${p.nombre}`}
              aria-pressed={form.prioridad === p.id}
              className="flex-1 rounded-xl py-2 text-xs font-semibold toque-44"
              style={{
                background: form.prioridad === p.id ? accent : COLORS.card,
                color: form.prioridad === p.id ? COLORS.textOnAccent : COLORS.text,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <span aria-hidden="true">{p.icono}</span> {p.nombre}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Categoría (opcional)">
        <Select value={form.categoria} onChange={(ev) => setForm({ ...form, categoria: ev.target.value })} aria-label="Categoría de la tarea">
          <option value="">Sin categoría</option>
          {CATEGORIAS_TAREA.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </Select>
      </Field>

      <div className="flex gap-2 mt-3">
        <PrimaryButton accent={accent} icon={tarea ? Pencil : Plus} onClick={guardar} disabled={!valido}>
          {tarea ? 'Guardar cambios' : 'Añadir tarea'}
        </PrimaryButton>
        <GhostBtn onClick={onCancelar}>Cancelar</GhostBtn>
      </div>
    </Card>
  );
}

/* Un día más, en local. ⚠️ Nunca `toISOString()` sobre una medianoche local:
   en España retrocede un día (la lección repetida del proyecto). */
function addDiaISO(iso) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + 1);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function DetalleTarea({ tarea, hoy, accent, onEditar, onCompletar, onReprogramar, onConcentrarse, onDelete, onCerrar }) {
  const [editando, setEditando] = useState(false);
  const [eligiendoFecha, setEligiendoFecha] = useState(false);
  const [fechaElegida, setFechaElegida] = useState(tarea.fecha || hoy);
  const cat = categoriaTarea(tarea.categoria);
  const plan = planConcentrarse(tarea);

  if (editando) {
    return (
      <FormularioTarea
        tarea={tarea} hoy={hoy} accent={accent}
        onGuardar={(t) => { if (t) onEditar(t); setEditando(false); }}
        onCancelar={() => setEditando(false)}
      />
    );
  }

  return (
    <div className="space-y-3">
      <button onClick={onCerrar} className="flex items-center gap-1 text-xs toque-44" style={{ color: COLORS.textMuted }}>
        <ArrowLeft size={14} /> Volver a las tareas
      </button>

      <Card>
        <p className="text-base font-bold" style={{ color: COLORS.text }}>{tarea.texto}</p>
        {tarea.descripcion && <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>{tarea.descripcion}</p>}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="text-xs" style={{ color: estadoDeFecha(tarea, hoy) === 'vencida' ? COLORS.danger : COLORS.textMuted }}>
            {textoDeFecha(tarea, hoy)}
          </span>
          <ChipPrioridad id={tarea.prioridad} />
          {cat && <span className="text-xs" style={{ color: COLORS.textMuted }}>{cat.icono} {cat.nombre}</span>}
        </div>
      </Card>

      <Card>
        <SectionTitle>Acciones</SectionTitle>
        <div className="flex gap-2 flex-wrap">
          <GhostBtn onClick={() => onCompletar(tarea)}>
            {tarea.hecha ? 'Marcar como pendiente' : 'Completar'}
          </GhostBtn>
          <GhostBtn onClick={() => setEditando(true)}>Editar</GhostBtn>
          {plan && <GhostBtn onClick={() => onConcentrarse(tarea)}>Concentrarme</GhostBtn>}
        </div>
      </Card>

      {!tarea.hecha && (
        <Card>
          <SectionTitle>Reprogramar</SectionTitle>
          <div className="flex gap-2 flex-wrap">
            {DESTINOS_REPROGRAMAR.map((d) => (
              <GhostBtn
                key={d.id}
                onClick={() => (d.pideFecha ? setEligiendoFecha(true) : onReprogramar(tarea, d.id))}
              >
                {d.nombre}
              </GhostBtn>
            ))}
          </div>
          {eligiendoFecha && (
            <div className="mt-2 space-y-2">
              <TextInput
                type="date" aria-label="Nueva fecha de la tarea"
                value={fechaElegida}
                onChange={(ev) => setFechaElegida(ev.target.value)}
              />
              <PrimaryButton accent={accent} onClick={() => { onReprogramar(tarea, 'elegir', fechaElegida); setEligiendoFecha(false); }}>
                Mover a esa fecha
              </PrimaryButton>
            </div>
          )}
        </Card>
      )}

      {/* ⚠️ Eliminar pide confirmación porque el enunciado lo pide
          expresamente. Va a Eliminados recientemente, así que el aviso no
          promete nada que no se pueda deshacer. */}
      <Card>
        {/* ⚠️ El enunciado pide confirmación al eliminar, y `BotonBorrarDefinitivo`
            es quien pregunta. Pero **una tarea sí se recupera**: va a Eliminados
            recientemente. Por eso el detalle dice eso y no "no se puede
            deshacer", que sería mentir en pantalla. */}
        <BotonBorrarDefinitivo
          label="Eliminar tarea"
          titulo="¿Eliminar la tarea?"
          detalle="Puedes recuperarla desde Eliminados recientemente."
          onConfirm={() => { onDelete(tarea.id); onCerrar(); }}
        >
          Eliminar tarea
        </BotonBorrarDefinitivo>
      </Card>
    </div>
  );
}

function TareasTab({ tareas, onAdd, onUpdate, onToggle, onDelete, onConcentrarse, accent, foco, onFocoConsumido }) {
  const hoy = todayISO();
  const [crear, setCrear] = useState(false);
  const [abierta, setAbierta] = useState(null);
  const [filtro, setFiltro] = useState('todas');
  const [orden, setOrden] = useState(ORDEN_POR_DEFECTO);
  const [busqueda, setBusqueda] = useState('');
  // 🚨 `null` = todavía no ha tocado ningún acordeón. El valor efectivo lo
  // decide `aperturaInicial`, que **abre lo que haga falta para que la pantalla
  // no se vea vacía**. Con un estado inicial fijo, una sola tarea sin fecha
  // dejaba la lista en blanco (lo cazó Chromium). Es `marcadas ?? loGuardado`
  // de EH F18 otra vez.
  const [plegadasTocadas, setPlegadasTocadas] = useState(null);
  const [destacadoId, setDestacadoId] = useState(null);

  // Deep-link desde el Centro de Control y desde el buscador global.
  useEffect(() => {
    if (!foco) return undefined;
    if (foco.accion === 'nueva') {
      setCrear(true);
      onFocoConsumido && onFocoConsumido();
      return undefined;
    }
    if (foco.tareaId) {
      const el = document.getElementById(`tarea-${foco.tareaId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setDestacadoId(foco.tareaId);
      onFocoConsumido && onFocoConsumido();
      const t = setTimeout(() => setDestacadoId(null), 2200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [foco]);

  const resumen = resumenTareas(tareas, hoy);
  const stats = estadisticasDeTareas(tareas, hoy);
  const vacio = vacioDeTareas(tareas, hoy);
  const visibles = buscarTareas(filtrarTareas(tareas, { filtro, hoy }), busqueda);
  const secciones = porSecciones(visibles, { hoy, orden });
  const abiertasPorDefecto = aperturaInicial(secciones);
  const plegadas = plegadasTocadas !== null
    ? plegadasTocadas
    : SECCIONES_TAREAS.filter((s) => !abiertasPorDefecto.includes(s.id)).map((s) => s.id);
  const detalle = abierta ? tareas.find((t) => t.id === abierta) : null;

  if (detalle) {
    return (
      <DetalleTarea
        tarea={detalle} hoy={hoy} accent={accent}
        onEditar={onUpdate}
        onCompletar={(t) => onToggle(t.id)}
        onReprogramar={(t, destino, fecha) => {
          const nueva = reprogramar(t, destino, { hoy, fecha });
          if (nueva) onUpdate(nueva);
        }}
        onConcentrarse={onConcentrarse}
        onDelete={onDelete}
        onCerrar={() => setAbierta(null)}
      />
    );
  }

  if (crear) {
    return (
      <FormularioTarea
        hoy={hoy} accent={accent}
        onGuardar={(t) => { if (t) onAdd(t); setCrear(false); }}
        onCancelar={() => setCrear(false)}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* CABECERA — "Hoy · 4 pendientes" y, si corresponde, "2 completadas" */}
      <Card>
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>
          Hoy · {resumen.pendientesHoy + resumen.vencidas} {resumen.pendientesHoy + resumen.vencidas === 1 ? 'pendiente' : 'pendientes'}
        </p>
        {resumen.completadasHoy > 0 && (
          <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
            {resumen.completadasHoy} {resumen.completadasHoy === 1 ? 'completada' : 'completadas'}
          </p>
        )}
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Organiza lo que tienes que hacer.</p>
      </Card>

      <PrimaryButton accent={accent} icon={Plus} onClick={() => setCrear(true)}>Nueva tarea</PrimaryButton>

      {vacio && (
        <Card className="text-center">
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{vacio.titulo}</p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{vacio.texto}</p>
        </Card>
      )}

      {/* FILTROS y BÚSQUEDA — solo cuando hay algo que filtrar: con tres tareas
          sobran, y el enunciado los quiere "visualmente ligeros". */}
      {tareas.length > 2 && (
        <>
          <TextInput
            aria-label="Buscar una tarea"
            value={busqueda}
            onChange={(ev) => setBusqueda(ev.target.value)}
            placeholder="Buscar una tarea…"
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTROS_TAREA.map((f) => (
              <ToggleTab key={f.id} active={filtro === f.id} accent={accent} onClick={() => setFiltro(f.id)}>
                {f.nombre}
              </ToggleTab>
            ))}
          </div>
          <Select value={orden} onChange={(ev) => setOrden(ev.target.value)} aria-label="Cómo se ordenan las tareas">
            {ORDENES_TAREA.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
          </Select>
        </>
      )}

      {SECCIONES_TAREAS.map((s) => (
        <SeccionTareas
          key={s.id}
          seccion={s}
          tareas={secciones[s.id]}
          hoy={hoy}
          accent={accent}
          abierta={!plegadas.includes(s.id)}
          onAlternar={() => setPlegadasTocadas(plegadas.includes(s.id) ? plegadas.filter((x) => x !== s.id) : [...plegadas, s.id])}
          onCompletar={(t) => onToggle(t.id)}
          onAbrir={(t) => setAbierta(t.id)}
          onConcentrarse={onConcentrarse}
          destacada={false}
        />
      ))}

      {/* ESTADÍSTICAS BÁSICAS — se cuentan en el momento; no se guarda ni una
          cifra (E3 F13). Sin nada que completar hoy no hay porcentaje. */}
      {(stats.hoy || stats.semana.completadas > 0) && (
        <Card>
          <SectionTitle>Cómo va</SectionTitle>
          {stats.hoy && (
            <p className="text-xs" style={{ color: COLORS.textMuted }}>
              Hoy · completadas {stats.hoy.completadas} / {stats.hoy.total}
            </p>
          )}
          <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
            Últimos 7 días · completadas {stats.semana.completadas}
          </p>
        </Card>
      )}
    </div>
  );
}

/* ---------- Metas (E3 F27 · PR F5) ---------- */
/* *"Convierte tus planes en resultados."* Una meta es lo MEDIBLE; el objetivo es
   la dirección. 🚨 El progreso nunca se pinta por encima del 100 %, aunque el
   valor guardado sí pueda pasarse — es literal del enunciado. */

function BarraMeta({ porcentaje, accent }) {
  return (
    <div className="h-2 rounded-full mt-2 overflow-hidden" style={{ background: COLORS.border }}>
      <div className="h-full rounded-full" style={{ width: `${porcentaje}%`, background: accent, transition: 'width 0.4s ease' }} />
    </div>
  );
}

function TarjetaMeta({ meta, objetivos, accent, onAbrir, onCompletar }) {
  const p = progresoDeMeta(meta);
  const hecha = metaCompletada(meta);
  const suObjetivo = meta.objetivoId ? (objetivos || []).find((o) => o.id === meta.objetivoId) : null;
  const fecha = textoDeFechaMeta(meta);
  return (
    <Card className="flex items-start gap-3" style={{ opacity: hecha ? 0.65 : 1 }}>
      <button
        onClick={() => onCompletar(meta)}
        aria-label={hecha ? `Marcar ${meta.nombre} como pendiente` : `Completar ${meta.nombre}`}
        className="toque-44 p-1.5 -m-1.5 shrink-0"
      >
        {hecha ? <CheckCircle2 size={20} style={{ color: accent }} /> : <Circle size={20} style={{ color: COLORS.textMuted }} />}
      </button>
      <button onClick={() => onAbrir(meta)} className="flex-1 text-left min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: COLORS.text, textDecoration: hecha ? 'line-through' : 'none' }}>
          {meta.nombre}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs" style={{ color: COLORS.textMuted }}>{p.texto}</span>
          {p.superado && <span className="text-xs" style={{ color: COLORS.textMuted }}>Objetivo superado</span>}
          {fecha && <span className="text-xs" style={{ color: fecha === 'Vencida' ? COLORS.danger : COLORS.textMuted }}>{fecha}</span>}
        </div>
        {/* ⚠️ El objetivo del que cuelga, si lo tiene: es lo que hace visible la
            jerarquía sin necesidad de una pantalla de relaciones. */}
        {suObjetivo && <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>🎯 {suObjetivo.texto}</p>}
        <BarraMeta porcentaje={p.porcentaje} accent={accent} />
      </button>
    </Card>
  );
}

export function FormularioMeta({ meta = null, objetivos = [], accent, onGuardar, onCancelar }) {
  const [form, setForm] = useState({
    nombre: meta?.nombre || '',
    descripcion: meta?.descripcion || '',
    tipo: meta?.tipo || TIPO_META_POR_DEFECTO,
    objetivo: String(meta?.objetivo ?? 1),
    unidad: meta?.unidad || '',
    periodo: meta?.periodo || '',
    objetivoId: meta?.objetivoId || '',
    prioridad: meta?.prioridad || PRIORIDAD_POR_DEFECTO,
    fechaObjetivo: meta?.fechaObjetivo || '',
  });
  const t = tipoMeta(form.tipo);
  // 🚨 Una meta de frecuencia sin periodo no se crea: elegirlo por él la metería
  // en «Diaria» sin decírselo (E3 F19).
  const valido = !!form.nombre.trim() && (!t.pidePeriodo || PERIODOS_META.includes(form.periodo));

  const guardar = () => {
    if (!valido) return;
    const campos = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      tipo: form.tipo,
      objetivo: Number(form.objetivo) || 1,
      unidad: form.unidad,
      periodo: form.periodo || null,
      objetivoId: form.objetivoId || null,
      fechaObjetivo: form.fechaObjetivo || null,
    };
    onGuardar(meta
      ? editarMeta(meta, { ...campos, prioridad: form.prioridad })
      : crearMeta({ ...campos, prioridadId: form.prioridad }));
  };

  return (
    <Card>
      <Field label="Meta">
        <TextInput
          aria-label="Nombre de la meta" value={form.nombre}
          onChange={(ev) => setForm({ ...form, nombre: ev.target.value })}
          placeholder="Ej. conseguir 15 dominadas"
        />
      </Field>
      <Field label="Descripción (opcional)">
        <TextInput
          aria-label="Descripción de la meta" value={form.descripcion}
          onChange={(ev) => setForm({ ...form, descripcion: ev.target.value })}
        />
      </Field>

      <Field label="Cómo se mide">
        <Select value={form.tipo} onChange={(ev) => setForm({ ...form, tipo: ev.target.value })} aria-label="Tipo de progreso">
          {TIPOS_META.map((x) => <option key={x.id} value={x.id}>{x.nombre} — {x.ejemplo}</option>)}
        </Select>
      </Field>
      <p className="text-xs -mt-1 mb-2" style={{ color: COLORS.textMuted }}>{t.explica}</p>

      {t.pideObjetivo && (
        <Field label={t.id === 'frecuencia' ? 'Veces por periodo' : 'Objetivo (número)'}>
          <TextInput
            type="number" min="1" aria-label="Valor objetivo" value={form.objetivo}
            onChange={(ev) => setForm({ ...form, objetivo: ev.target.value })}
          />
        </Field>
      )}
      {t.pideUnidad && (
        <Field label="Unidad (opcional)">
          <TextInput
            aria-label="Unidad de la meta" value={form.unidad}
            onChange={(ev) => setForm({ ...form, unidad: ev.target.value })}
            placeholder="Ej. dominadas, libros, kg"
          />
        </Field>
      )}
      {t.pidePeriodo && (
        <Field label="Periodo">
          <Select value={form.periodo} onChange={(ev) => setForm({ ...form, periodo: ev.target.value })} aria-label="Periodo de la meta">
            <option value="">Elige un periodo</option>
            {PERIODOS_META.map((x) => <option key={x} value={x}>{x}</option>)}
          </Select>
        </Field>
      )}

      <Field label="Fecha objetivo (opcional)">
        <TextInput
          type="date" aria-label="Fecha objetivo de la meta" value={form.fechaObjetivo}
          onChange={(ev) => setForm({ ...form, fechaObjetivo: ev.target.value })}
        />
      </Field>

      {/* ⚠️ Vincular es OPCIONAL: *"también debe poder existir una meta
          independiente"*. */}
      <Field label="Objetivo (opcional)">
        <Select value={form.objetivoId} onChange={(ev) => setForm({ ...form, objetivoId: ev.target.value })} aria-label="Objetivo al que pertenece">
          <option value="">Sin objetivo</option>
          {objetivos.map((o) => <option key={o.id} value={o.id}>{o.texto}</option>)}
        </Select>
      </Field>

      <Field label="Prioridad">
        <div className="flex gap-2">
          {PRIORIDADES.map((pr) => (
            <button
              key={pr.id} onClick={() => setForm({ ...form, prioridad: pr.id })}
              aria-label={`Prioridad ${pr.nombre}`} aria-pressed={form.prioridad === pr.id}
              className="flex-1 rounded-xl py-2 text-xs font-semibold toque-44"
              style={{
                background: form.prioridad === pr.id ? accent : COLORS.card,
                color: form.prioridad === pr.id ? COLORS.textOnAccent : COLORS.text,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <span aria-hidden="true">{pr.icono}</span> {pr.nombre}
            </button>
          ))}
        </div>
      </Field>

      <div className="flex gap-2 mt-3">
        <PrimaryButton accent={accent} icon={meta ? Pencil : Target} onClick={guardar} disabled={!valido}>
          {meta ? 'Guardar cambios' : 'Añadir meta'}
        </PrimaryButton>
        <GhostBtn onClick={onCancelar}>Cancelar</GhostBtn>
      </div>
    </Card>
  );
}

function DetalleMeta({ meta, objetivos, tareas, accent, onGuardar, onCompletar, onDelete, onCerrar }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(String(meta.progreso));
  const p = progresoDeMeta(meta);
  const suObjetivo = meta.objetivoId ? (objetivos || []).find((o) => o.id === meta.objetivoId) : null;
  const suyas = tareasDeMeta(meta.id, tareas);

  if (editando) {
    return (
      <FormularioMeta
        meta={meta} objetivos={objetivos} accent={accent}
        onGuardar={(m) => { if (m) onGuardar(m); setEditando(false); }}
        onCancelar={() => setEditando(false)}
      />
    );
  }

  return (
    <div className="space-y-3">
      <button onClick={onCerrar} className="flex items-center gap-1 text-xs toque-44" style={{ color: COLORS.textMuted }}>
        <ArrowLeft size={14} /> Volver a las metas
      </button>

      <Card>
        <p className="text-base font-bold" style={{ color: COLORS.text }}>{meta.nombre}</p>
        {meta.descripcion && <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>{meta.descripcion}</p>}
        <p className="text-sm mt-2 font-semibold" style={{ color: COLORS.text }}>{p.texto}</p>
        <BarraMeta porcentaje={p.porcentaje} accent={accent} />
        {p.superado && (
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
            Objetivo superado · {p.porcentajeReal} %
          </p>
        )}
        {suObjetivo && <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>🎯 {suObjetivo.texto}</p>}
      </Card>

      {meta.tipo !== 'check' && (
        <Card>
          <SectionTitle>Actualizar progreso</SectionTitle>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <TextInput
                type="number" min="0" aria-label="Progreso de la meta"
                value={valor} onChange={(ev) => setValor(ev.target.value)}
              />
            </div>
            <PrimaryButton accent={accent} onClick={() => onGuardar(actualizarProgreso(meta, Number(valor)))}>
              Guardar
            </PrimaryButton>
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle>Acciones</SectionTitle>
        <div className="flex gap-2 flex-wrap">
          <GhostBtn onClick={() => onCompletar(meta)}>
            {metaCompletada(meta) ? 'Marcar sin completar' : 'Completar'}
          </GhostBtn>
          <GhostBtn onClick={() => setEditando(true)}>Editar</GhostBtn>
        </div>
      </Card>

      <Card>
        <SectionTitle>Tareas de esta meta</SectionTitle>
        {suyas.length === 0 && (
          <p className="text-xs" style={{ color: COLORS.textMuted }}>
            Ninguna todavía. Una tarea se enlaza con esta meta desde la propia tarea, en Tareas.
          </p>
        )}
        {suyas.map((t) => (
          <p key={t.id} className="text-sm py-1" style={{ color: COLORS.text, textDecoration: t.hecha ? 'line-through' : 'none' }}>
            {t.texto}
          </p>
        ))}
      </Card>

      <Card>
        <button
          onClick={() => { onDelete(meta.id); onCerrar(); }}
          aria-label={`Eliminar la meta ${meta.nombre}`}
          className="flex items-center gap-2 text-xs font-semibold toque-44"
          style={{ color: COLORS.danger }}
        >
          <Trash2 size={15} /> Eliminar meta
        </button>
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
          Puedes recuperarla desde Eliminados recientemente.
        </p>
      </Card>
    </div>
  );
}

function MetasTab({ metas, objetivos = [], tareas = [], onAdd, onUpdate, onDelete, accent }) {
  const [crear, setCrear] = useState(false);
  const [abierta, setAbierta] = useState(null);
  const [filtro, setFiltro] = useState('activas');

  const detalle = abierta ? metas.find((m) => m.id === abierta) : null;
  const visibles = filtrarMetas(metas, filtro);

  if (detalle) {
    return (
      <DetalleMeta
        meta={detalle} objetivos={objetivos} tareas={tareas} accent={accent}
        onGuardar={onUpdate}
        onCompletar={(m) => onUpdate(completarMeta(m))}
        onDelete={onDelete}
        onCerrar={() => setAbierta(null)}
      />
    );
  }

  if (crear) {
    return (
      <FormularioMeta
        objetivos={objetivos} accent={accent}
        onGuardar={(m) => { if (m) onAdd(m); setCrear(false); }}
        onCancelar={() => setCrear(false)}
      />
    );
  }

  return (
    <div className="space-y-3">
      <Card>
        <p className="text-sm" style={{ color: COLORS.textMuted }}>Convierte tus planes en resultados.</p>
      </Card>

      <PrimaryButton accent={accent} icon={Target} onClick={() => setCrear(true)}>Nueva meta</PrimaryButton>

      {metas.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTROS_META.map((f) => (
            <ToggleTab key={f.id} active={filtro === f.id} accent={accent} onClick={() => setFiltro(f.id)}>
              {f.nombre}
            </ToggleTab>
          ))}
        </div>
      )}

      {metas.length === 0 && (
        <Card className="text-center">
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{VACIO_METAS.titulo}</p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{VACIO_METAS.texto}</p>
        </Card>
      )}
      {metas.length > 0 && visibles.length === 0 && (
        <EmptyHint text="Ninguna encaja con este filtro. Prueba con “Todas”." />
      )}

      {visibles.map((m) => (
        <TarjetaMeta
          key={m.id} meta={m} objetivos={objetivos} accent={accent}
          onAbrir={(x) => setAbierta(x.id)}
          onCompletar={(x) => onUpdate(completarMeta(x))}
        />
      ))}
    </div>
  );
}

/* ---------- Vista principal ---------- */
/* ══════════════════════════════════════════════════════════════════════════
   ENTREGA 3 · FASE 23 (PR F1) — EL LANZADOR
   ══════════════════════════════════════════════════════════════════════════

   *"Debe sentir que está entrando en una especie de sistema operativo dentro
   del sistema operativo."*

   ⚠️ La otra mitad del catálogo: `MINI_APPS_PR` es **datos** y esto son
   **componentes de React**. El mismo reparto que `MINI_APPS`/`ICONOS_MINI_APP`
   en la Biblioteca. Un icono que falte aquí sale como un hueco y **no falla en
   ninguna parte**, así que hay una prueba que compara las dos listas. */
const ICONOS_MINI_APP_PR = { Flame, Timer, ListChecks, Target, Compass, Repeat };

export const iconoDeMiniAppPR = (id) => {
  const app = miniAppPR(id);
  return (app && ICONOS_MINI_APP_PR[app.icono]) || ListChecks;
};

/* La plaquita. *"Icono grande, nombre, descripción corta, indicador de estado
   cuando sea posible, microanimación y feedback al tocar… **NO hacer tarjetas
   gigantes**: deben parecer realmente 6 aplicaciones pequeñas."* */
export function TarjetaMiniAppPR({ app, indicador, accent, indice = 0, onAbrir }) {
  const Icono = iconoDeMiniAppPR(app.id);
  return (
    <button
      onClick={onAbrir}
      className={`w-full text-left ${CLASE_TARJETA_PR}`}
      style={{ animationDelay: retrasoDeTarjetaPR(indice) }}
      aria-label={`Abrir ${app.nombre}`}
    >
      <Card style={{ padding: '0.95rem' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: COLORS.surface2 }}>
          <Icono size={19} style={{ color: accent }} />
        </div>
        <p className="text-sm font-bold" style={{ color: COLORS.text }}>{app.nombre}</p>
        <p className="text-[11px] leading-snug mt-0.5" style={{ color: COLORS.textMuted }}>{app.descripcion}</p>
        {/* *"NO inventar datos"*: sin nada que contar, no se pinta nada. */}
        {indicador ? (
          <p className="text-[11px] font-semibold mt-1.5" style={{ color: accent }}>{indicador}</p>
        ) : null}
      </Card>
    </button>
  );
}

/* La cabecera de una mini-app abierta: *"botón para volver, título, navegación
   coherente"*. Una sola, para las seis. */
export function CabeceraMiniAppPR({ app, accent, onVolver }) {
  const Icono = iconoDeMiniAppPR(app.id);
  return (
    <div className="flex items-center gap-2">
      <button onClick={onVolver} className="p-1.5 -m-1.5" aria-label="Volver a Productividad">
        <ArrowLeft size={18} style={{ color: COLORS.textMuted }} />
      </button>
      <Icono size={18} style={{ color: accent }} />
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold" style={{ color: COLORS.text }}>{app.nombre}</p>
        <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{app.descripcion}</p>
      </div>
    </div>
  );
}

export default function ProductivityView({
  productividad, onAddHabito, onUpdateHabito, onDeleteHabito,
  onAddRutina, onUpdateRutina, onDeleteRutina,
  onCambiarEjecucionRutina, onRegistrarEjecucionRutina,
  onAddTarea, onUpdateTarea, onToggleTarea, onDeleteTarea,
  onAddMeta, onUpdateMeta, onDeleteMeta,
  onCompletarPomodoro,
  /* E3 F25 (PR F3) — Pomodoro guarda tres cosas: su configuración, la sesión en
     curso (para que sobreviva a recargar) y el historial de sesiones. */
  onGuardarConfigPomodoro, onCambiarSesionPomodoro, onFinalizarSesionPomodoro,
  /* 🚨 E3 F23 (PR F1) — Objetivos entra aquí. Deja de ser un módulo aparte, pero
     **sus datos siguen en su clave de siempre**: lo que llega son la lista y sus
     manejadores, los mismos que tenía `case 'objetivos'`. */
  objetivos, onAddObjetivo, onUpdateObjetivo, onDeleteObjetivo, onRevisionHecha, onGuardarListaObjetivos,
  accent, foco, onFocoConsumido,
}) {
  /* `null` = el lanzador. *"Cuando el usuario entre en Productividad, **no se
     encuentre directamente con listas, formularios o bloques de información**."* */
  const [abierta, setAbierta] = useState(null);
  const hoy = todayISO();

  /* 🚨 «Concentrarme» (E3 F26, apartado «INTEGRACIÓN CON POMODORO»): abre **el
     Pomodoro que ya existe** con el id de la tarea. Ni un temporizador nuevo, ni
     un segundo motor — `iniciarSesion` acepta `tareaId` desde la E3 F25. */
  const concentrarseEnTarea = (tarea) => {
    const plan = planConcentrarse(tarea);
    if (!plan) return;
    const cfg = normalizarConfig(productividad.pomodoroConfig);
    onCambiarSesionPomodoro(iniciarSesion('focus', cfg, { tareaId: plan.tareaId }));
    setAbierta(plan.miniApp);
  };

  /* Los enlaces directos siguen funcionando: el Dashboard mandaba `foco.sub`
     desde la ampliación del Centro de Control, y desde esta fase también llega
     `foco.app` —el que usan el buscador, EH F28 e Ideas de estilo para abrir
     Objetivos, que ya no tiene módulo propio—. Se aceptan los dos: quitar
     `foco.sub` habría roto en silencio la acción rápida "+ Tarea". */
  useEffect(() => {
    const destino = foco?.app || foco?.sub;
    if (destino && miniAppPR(destino)) setAbierta(destino);
  }, [foco]);

  const datos = { productividad, objetivos };

  // ── El lanzador ─────────────────────────────────────────────────────────
  if (!abierta) {
    return (
      <div className="space-y-4 pb-4">
        <SectionTitle sub="Tus seis herramientas para avanzar cada día">Productividad</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {MINI_APPS_PR.map((app, i) => (
            <TarjetaMiniAppPR
              key={app.id}
              app={app}
              indice={i}
              indicador={indicadorDePR(app.id, datos)}
              accent={accent}
              onAbrir={() => setAbierta(app.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  const app = miniAppPR(abierta);
  const volver = () => { setAbierta(null); onFocoConsumido?.(); };
  const cabecera = <CabeceraMiniAppPR app={app} accent={accent} onVolver={volver} />;

  /* 🚨 **Y aquí no se ha reescrito ninguna de las seis.** El enunciado lo pide en
     mayúsculas: esta fase es la pantalla y la navegación. Lo que había dentro de
     cada pestaña entra tal cual, con su cabecera nueva encima; su desarrollo
     completo llega en las fases 2 a 6. */
  return (
    <div className="space-y-3 pb-4">
      {cabecera}
      {abierta === 'habitos' && (
        <HabitosTab habitos={productividad.habitos} onAdd={onAddHabito} onUpdate={onUpdateHabito} onDelete={onDeleteHabito} accent={accent} />
      )}
      {abierta === 'rutinas' && (
        <RutinasTab
          rutinas={productividad.rutinas}
          ejecuciones={productividad.rutinaEjecuciones || []}
          enCurso={productividad.rutinaEnCurso || null}
          onAdd={onAddRutina} onUpdate={onUpdateRutina} onDelete={onDeleteRutina}
          onCambiarEjecucion={onCambiarEjecucionRutina}
          onRegistrarEjecucion={onRegistrarEjecucionRutina}
          accent={accent}
        />
      )}
      {abierta === 'pomodoro' && (
        <PomodoroTab
          config={productividad.pomodoroConfig}
          sesionEnCurso={productividad.pomodoroEnCurso}
          sesiones={productividad.pomodoroSesiones || []}
          tareas={productividad.tareas}
          accent={accent}
          onGuardarConfig={onGuardarConfigPomodoro}
          onCambiarSesion={onCambiarSesionPomodoro}
          onFinalizar={onFinalizarSesionPomodoro}
        />
      )}
      {abierta === 'tareas' && (
        <TareasTab
          tareas={productividad.tareas} onAdd={onAddTarea} onUpdate={onUpdateTarea}
          onToggle={onToggleTarea} onDelete={onDeleteTarea} onConcentrarse={concentrarseEnTarea} accent={accent}
          foco={foco} onFocoConsumido={onFocoConsumido}
        />
      )}
      {abierta === 'metas' && (
        <MetasTab
          metas={productividad.metas} objetivos={objetivos?.lista || []} tareas={productividad.tareas}
          onAdd={onAddMeta} onUpdate={onUpdateMeta} onDelete={onDeleteMeta} accent={accent}
        />
      )}
      {/* ⚠️ Objetivos se pinta con SU pantalla de siempre, `ObjectivesView`, sin
          tocarla: reescribirla habría sido rehacer una mini-app en la fase que
          dice expresamente que no se rehacen. `sinTitulo` evita repetir el
          nombre, que ya está en la cabecera de arriba. */}
      {abierta === 'objetivos' && (
        <ObjectivesView
          objetivos={objetivos}
          metas={productividad.metas}
          onGuardarLista={onGuardarListaObjetivos}
          onAdd={onAddObjetivo}
          onUpdate={onUpdateObjetivo}
          onDelete={onDeleteObjetivo}
          onRevisionHecha={onRevisionHecha}
          accent={accent}
          foco={foco}
          onFocoConsumido={onFocoConsumido}
          sinTitulo
        />
      )}
    </div>
  );
}
