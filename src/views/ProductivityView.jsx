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
import {
  FRECUENCIAS_HABITO, FRECUENCIA_POR_DEFECTO, frecuenciaDe, reglaDe, describirRegla,
  CATEGORIAS_HABITO, ICONOS_HABITO, ICONO_HABITO_POR_DEFECTO,
  crearHabito, editarHabito, pausarHabito, reanudarHabito,
  tocaHoy, hechoHoy, progresoDelDia, estadisticasHabito, textoRacha,
  semanaDe, historialCompacto, SEMANAS_HISTORIAL,
  FILTROS_HABITOS, FILTRO_HABITOS_POR_DEFECTO, filtrarHabitos, vacioDeFiltro,
  VACIO_HABITOS, ESTADOS_DIA, NOMBRES_DIA, NOMBRES_DIA_CORTOS, diasDeRegla, vecesDeRegla,
} from '../lib/habitos';
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

/* ---------- Rutinas / checklists ---------- */
function RutinaCard({ rutina, onUpdate, onDelete, accent }) {
  const [expanded, setExpanded] = useState(false);
  const [pasoTexto, setPasoTexto] = useState('');
  const hechos = rutina.pasos.filter((p) => p.hecho).length;

  const addPaso = () => {
    if (!pasoTexto.trim()) return;
    onUpdate({ ...rutina, pasos: [...rutina.pasos, { id: uid(), texto: pasoTexto.trim(), hecho: false }] });
    setPasoTexto('');
  };
  const togglePaso = (id) =>
    onUpdate({ ...rutina, pasos: rutina.pasos.map((p) => (p.id === id ? { ...p, hecho: !p.hecho } : p)) });
  const eliminarPaso = (id) => onUpdate({ ...rutina, pasos: rutina.pasos.filter((p) => p.id !== id) });
  const reiniciar = () => onUpdate({ ...rutina, pasos: rutina.pasos.map((p) => ({ ...p, hecho: false })) });

  return (
    <Card>
      <button className="w-full flex items-center justify-between" onClick={() => setExpanded((s) => !s)}>
        <div className="flex items-center gap-2">
          <ListChecks size={16} style={{ color: accent }} />
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{rutina.nombre}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: COLORS.textMuted }}>{hechos}/{rutina.pasos.length}</span>
          {expanded ? <ChevronUp size={16} style={{ color: COLORS.textMuted }} /> : <ChevronDown size={16} style={{ color: COLORS.textMuted }} />}
        </div>
      </button>

      {expanded && (
        <div className="mt-3 pt-3 space-y-2" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          {rutina.pasos.map((p) => (
            <div key={p.id} className="flex items-center justify-between">
              <button onClick={() => togglePaso(p.id)} className="flex items-center gap-2 flex-1 text-left">
                {p.hecho ? <CheckCircle2 size={16} style={{ color: accent }} /> : <Circle size={16} style={{ color: COLORS.textMuted }} />}
                <span className="text-sm" style={{ color: p.hecho ? COLORS.textMuted : COLORS.text, textDecoration: p.hecho ? 'line-through' : 'none' }}>
                  {p.texto}
                </span>
              </button>
              <button onClick={() => eliminarPaso(p.id)} aria-label="Eliminar paso">
                <Trash2 size={13} style={{ color: COLORS.textMuted }} />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <TextInput value={pasoTexto} onChange={(e) => setPasoTexto(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPaso()} placeholder="Nuevo paso…" />
            <div style={{ width: 70, flexShrink: 0 }}>
              <PrimaryButton accent={accent} onClick={addPaso}>+</PrimaryButton>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <button onClick={reiniciar} className="text-xs font-semibold flex items-center gap-1" style={{ color: COLORS.textMuted }}>
              <RotateCcw size={12} /> Reiniciar para hoy
            </button>
            <button onClick={() => onDelete(rutina.id)} className="text-xs font-semibold" style={{ color: COLORS.negative }}>
              Eliminar rutina
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

function RutinasTab({ rutinas, onAdd, onUpdate, onDelete, accent }) {
  const [nombre, setNombre] = useState('');
  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center gap-2">
          <TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. rutina de la mañana" />
          <div style={{ width: 84, flexShrink: 0 }}>
            <PrimaryButton accent={accent} icon={Plus} onClick={() => { if (!nombre.trim()) return; onAdd({ id: uid(), nombre: nombre.trim(), pasos: [] }); setNombre(''); }}>
              Añadir
            </PrimaryButton>
          </div>
        </div>
      </Card>
      {rutinas.length === 0 && <EmptyHint text="Crea una rutina y añádele pasos (ej. 'estirar', 'hacer la cama')." />}
      {rutinas.map((r) => (
        <RutinaCard key={r.id} rutina={r} onUpdate={(next) => onUpdate(next)} onDelete={onDelete} accent={accent} />
      ))}
    </div>
  );
}

/* ---------- Pomodoro ---------- */
const POMODORO_TRABAJO = 25 * 60;
const POMODORO_DESCANSO = 5 * 60;

function PomodoroTab({ hoyCount, onCompletar, accent }) {
  const [modo, setModo] = useState('trabajo');
  const [segundos, setSegundos] = useState(POMODORO_TRABAJO);
  const [corriendo, setCorriendo] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (corriendo) {
      intervalRef.current = setInterval(() => {
        setSegundos((s) => {
          if (s <= 1) {
            if (modo === 'trabajo') onCompletar();
            const siguienteModo = modo === 'trabajo' ? 'descanso' : 'trabajo';
            setModo(siguienteModo);
            return siguienteModo === 'trabajo' ? POMODORO_TRABAJO : POMODORO_DESCANSO;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corriendo, modo]);

  const reiniciar = () => {
    setCorriendo(false);
    setModo('trabajo');
    setSegundos(POMODORO_TRABAJO);
  };

  const mm = String(Math.floor(segundos / 60)).padStart(2, '0');
  const ss = String(segundos % 60).padStart(2, '0');

  return (
    <div className="space-y-3">
      <Card className="flex flex-col items-center py-10">
        <p className="text-xs font-semibold mb-2" style={{ color: modo === 'trabajo' ? accent : COLORS.positive }}>
          {modo === 'trabajo' ? 'CONCENTRACIÓN' : 'DESCANSO'}
        </p>
        <p className="text-5xl font-extrabold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{mm}:{ss}</p>
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => setCorriendo((c) => !c)}
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: accent, color: COLORS.textOnAccent }}
          >
            {corriendo ? <Pause size={22} /> : <Play size={22} />}
          </button>
          <button
            onClick={reiniciar}
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: COLORS.surface2, color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}
          >
            <RotateCcw size={16} />
          </button>
        </div>
        <p className="text-xs mt-5" style={{ color: COLORS.textMuted }}>Pomodoros hoy: {hoyCount}</p>
      </Card>
    </div>
  );
}

/* ---------- Tareas ---------- */
function TareasTab({ tareas, onAdd, onToggle, onDelete, accent, foco, onFocoConsumido }) {
  const [texto, setTexto] = useState('');
  const [fecha, setFecha] = useState('');
  // Ampliación del Dashboard — Centro de Control: resalta brevemente la tarea a la que se ha
  // llegado por deep-link (apartado 6: "Trabajo de Biología pendiente → abrir esa tarea").
  const [destacadoId, setDestacadoId] = useState(null);

  useEffect(() => {
    if (!foco) return;
    if (foco.accion === 'nueva') {
      document.getElementById('nueva-tarea-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('nueva-tarea-input')?.querySelector('input')?.focus();
      onFocoConsumido && onFocoConsumido();
    } else if (foco.tareaId) {
      const el = document.getElementById(`tarea-${foco.tareaId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setDestacadoId(foco.tareaId);
      onFocoConsumido && onFocoConsumido();
      const t = setTimeout(() => setDestacadoId(null), 2200);
      return () => clearTimeout(t);
    }
  }, [foco]);

  const pendientes = [...tareas].filter((t) => !t.hecha).sort((a, b) => (a.fechaLimite || '9999').localeCompare(b.fechaLimite || '9999'));
  const hechas = tareas.filter((t) => t.hecha);

  const submit = () => {
    if (!texto.trim()) return;
    onAdd({ id: uid(), texto: texto.trim(), fechaLimite: fecha || null, hecha: false });
    setTexto('');
    setFecha('');
  };

  return (
    <div className="space-y-3">
      <Card id="nueva-tarea-input">
        <Field label="Tarea">
          <TextInput value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !fecha && submit()} placeholder="Ej. preparar la mochila" />
        </Field>
        <Field label="Fecha límite (opcional)">
          <TextInput type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Field>
        <PrimaryButton accent={accent} icon={Plus} onClick={submit}>Añadir tarea</PrimaryButton>
      </Card>

      {pendientes.length === 0 && hechas.length === 0 && <EmptyHint text="Sin tareas pendientes." />}
      {pendientes.map((t) => (
        <Card
          key={t.id} id={`tarea-${t.id}`} className="flex items-center justify-between"
          style={{ transition: 'box-shadow 0.3s ease', boxShadow: destacadoId === t.id ? `0 0 0 2px ${accent}` : 'none' }}
        >
          <button onClick={() => onToggle(t.id)} className="flex items-center gap-3 flex-1 text-left">
            <Circle size={18} style={{ color: COLORS.textMuted }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{t.texto}</p>
              {t.fechaLimite && <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>Antes del {t.fechaLimite.split('-').reverse().join('/')}</p>}
            </div>
          </button>
          <button onClick={() => onDelete(t.id)} aria-label="Eliminar tarea"><Trash2 size={15} style={{ color: COLORS.textMuted }} /></button>
        </Card>
      ))}
      {hechas.length > 0 && (
        <div className="pt-2 space-y-2">
          <p className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>Hechas</p>
          {hechas.map((t) => (
            <Card key={t.id} className="flex items-center justify-between" style={{ opacity: 0.6 }}>
              <button onClick={() => onToggle(t.id)} className="flex items-center gap-3 flex-1 text-left">
                <CheckCircle2 size={18} style={{ color: accent }} />
                <p className="text-sm" style={{ color: COLORS.textMuted, textDecoration: 'line-through' }}>{t.texto}</p>
              </button>
              <button onClick={() => onDelete(t.id)} aria-label="Eliminar tarea"><Trash2 size={15} style={{ color: COLORS.textMuted }} /></button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Metas a corto plazo ---------- */
function MetasTab({ metas, onAdd, onUpdate, onDelete, accent }) {
  const [nombre, setNombre] = useState('');
  const [periodo, setPeriodo] = useState(PERIODOS_META[0]);
  const [objetivo, setObjetivo] = useState('1');

  const submit = () => {
    if (!nombre.trim()) return;
    onAdd({ id: uid(), nombre: nombre.trim(), periodo, objetivo: Number(objetivo) || 1, progreso: 0 });
    setNombre('');
    setObjetivo('1');
  };

  return (
    <div className="space-y-3">
      <Card>
        <Field label="Meta">
          <TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. leer 12 libros" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Periodo">
            <Select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
              {PERIODOS_META.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </Field>
          <Field label="Objetivo (número)">
            <TextInput type="number" min="1" value={objetivo} onChange={(e) => setObjetivo(e.target.value)} />
          </Field>
        </div>
        <PrimaryButton accent={accent} icon={Target} onClick={submit}>Añadir meta</PrimaryButton>
      </Card>

      {metas.length === 0 && <EmptyHint text="Añade una meta a corto plazo (esto no sustituye a los grandes Objetivos, que llegarán en la próxima fase)." />}
      {metas.map((m) => {
        const pct = Math.min(100, Math.round((m.progreso / m.objetivo) * 100));
        return (
          <Card key={m.id}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{m.nombre}</p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>{m.periodo} · {m.progreso}/{m.objetivo}</p>
              </div>
              <button onClick={() => onDelete(m.id)} aria-label="Eliminar meta"><Trash2 size={15} style={{ color: COLORS.textMuted }} /></button>
            </div>
            <div className="h-2 rounded-full mb-3" style={{ background: COLORS.surface2 }}>
              <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: accent, transition: 'width 0.3s ease' }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <GhostBtn onClick={() => onUpdate({ ...m, progreso: Math.max(0, m.progreso - 1) })}>-1</GhostBtn>
              <PrimaryButton accent={accent} onClick={() => onUpdate({ ...m, progreso: m.progreso + 1 })}>+1 progreso</PrimaryButton>
            </div>
          </Card>
        );
      })}
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
  onAddTarea, onToggleTarea, onDeleteTarea,
  onAddMeta, onUpdateMeta, onDeleteMeta,
  onCompletarPomodoro,
  /* 🚨 E3 F23 (PR F1) — Objetivos entra aquí. Deja de ser un módulo aparte, pero
     **sus datos siguen en su clave de siempre**: lo que llega son la lista y sus
     manejadores, los mismos que tenía `case 'objetivos'`. */
  objetivos, onAddObjetivo, onUpdateObjetivo, onDeleteObjetivo, onRevisionHecha,
  accent, foco, onFocoConsumido,
}) {
  /* `null` = el lanzador. *"Cuando el usuario entre en Productividad, **no se
     encuentre directamente con listas, formularios o bloques de información**."* */
  const [abierta, setAbierta] = useState(null);
  const hoy = todayISO();
  const pomodorosHoy = productividad.pomodoros[hoy] || 0;

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
        <RutinasTab rutinas={productividad.rutinas} onAdd={onAddRutina} onUpdate={onUpdateRutina} onDelete={onDeleteRutina} accent={accent} />
      )}
      {abierta === 'pomodoro' && (
        <PomodoroTab hoyCount={pomodorosHoy} onCompletar={onCompletarPomodoro} accent={accent} />
      )}
      {abierta === 'tareas' && (
        <TareasTab
          tareas={productividad.tareas} onAdd={onAddTarea} onToggle={onToggleTarea} onDelete={onDeleteTarea} accent={accent}
          foco={foco} onFocoConsumido={onFocoConsumido}
        />
      )}
      {abierta === 'metas' && (
        <MetasTab metas={productividad.metas} onAdd={onAddMeta} onUpdate={onUpdateMeta} onDelete={onDeleteMeta} accent={accent} />
      )}
      {/* ⚠️ Objetivos se pinta con SU pantalla de siempre, `ObjectivesView`, sin
          tocarla: reescribirla habría sido rehacer una mini-app en la fase que
          dice expresamente que no se rehacen. `sinTitulo` evita repetir el
          nombre, que ya está en la cabecera de arriba. */}
      {abierta === 'objetivos' && (
        <ObjectivesView
          objetivos={objetivos}
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
