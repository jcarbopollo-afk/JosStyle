import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Circle, Flame, Plus, Trash2, Play, Pause, RotateCcw, ListChecks, Target, ChevronDown, ChevronUp, ArrowLeft, Timer, Compass, Repeat } from 'lucide-react';
import { COLORS, PERIODOS_META } from '../tokens';
import { uid, todayISO } from '../lib/helpers';
import { resumenHabito, alternarHabito } from '../lib/rachas';
import { Card, SectionTitle, Field, TextInput, Select, PrimaryButton, GhostBtn, ToggleTab, EmptyHint, AIPanel } from '../components/ui';
/* E3 F23 (PR F1) — Productividad pasa a ser un lanzador de seis mini-apps. El
   catálogo vive en su librería; aquí solo están los componentes. */
import {
  MINI_APPS_PR, miniAppPR, indicadorDePR, CLASE_TARJETA_PR, retrasoDeTarjetaPR,
} from '../lib/productividad';
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

function HabitosTab({ habitos, onAdd, onUpdate, onDelete, accent }) {
  const [nombre, setNombre] = useState('');
  const hoy = todayISO();

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center gap-2">
          <TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. leer 10 minutos" />
          <div style={{ width: 84, flexShrink: 0 }}>
            <PrimaryButton
              accent={accent} icon={Plus}
              onClick={() => { if (!nombre.trim()) return; onAdd({ id: uid(), nombre: nombre.trim(), historial: {} }); setNombre(''); }}
            >
              Añadir
            </PrimaryButton>
          </div>
        </div>
      </Card>

      {habitos.length === 0 && <EmptyHint text="Todavía no tienes hábitos. Añade el primero arriba." />}
      {habitos.map((h) => {
        // Un hábito sin `historial` dejaba la pantalla EN BLANCO. Nunca se había visto
        // porque esta vista no se renderizaba en ninguna prueba; salió al añadirla en
        // RA F1. Puede pasar de verdad: un dato restaurado o importado a medias.
        const hechoHoy = !!h.historial?.[hoy];
        const racha = resumenHabito(h, hoy);
        return (
          <Card key={h.id} className="flex items-center justify-between">
            <button onClick={() => onUpdate(alternarHabito(h, hoy))} className="flex items-center gap-3 flex-1 text-left">
              {hechoHoy ? <CheckCircle2 size={22} style={{ color: accent }} /> : <Circle size={22} style={{ color: COLORS.textMuted }} />}
              <div>
                <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{h.nombre}</p>
                <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: COLORS.textMuted }}>
                  <Flame size={12} /> {racha.actual} {racha.actual === 1 ? 'día' : 'días'}
                  {racha.record > racha.actual ? ` · mejor: ${racha.record}` : ''}
                </p>
              </div>
            </button>
            <button onClick={() => onDelete(h.id)} aria-label="Eliminar hábito">
              <Trash2 size={15} style={{ color: COLORS.textMuted }} />
            </button>
          </Card>
        );
      })}

      <AIPanel
        label="Consejo de hábitos"
        accent={accent}
        buildPrompt={() =>
          `Hábitos de Josué y su estado (JSON): ${JSON.stringify(habitos.map((h) => {
            const r = resumenHabito(h, hoy);
            return { nombre: h.nombre, rachaActual: r.actual, mejorRacha: r.record };
          }))}. ` +
          `Dale un consejo breve y animado sobre cuál priorizar o cómo va, sin ser condescendiente ni castigar los fallos.`
        }
      />
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
