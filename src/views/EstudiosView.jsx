import React, { useState, useEffect } from 'react';
import { GraduationCap, BookOpen, Clock, Plus, Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, HelpCircle, TrendingUp, Loader2, Sparkles, X, Eye, EyeOff } from 'lucide-react';
import { COLORS } from '../tokens';
import { uid, formatFecha, todayISO, hexToRgba } from '../lib/helpers';
import { askAI, AI_SYSTEM } from '../lib/ai';
import { correlacionSuenoEstudio } from '../lib/correlaciones';
import {
  ICONOS_ESTUDIOS, ICONO_POR_DEFECTO, sugerirIcono, iconoDeApp,
  MAX_NOMBRE_APP, crearApp, nombreYaUsado, moverApp, AVISO_OCULTAR, alternarOcultaApp,
  appsOrdenadas, appsVisibles,
  asignaturasDe, examenesDe, horasDe, ramasDeApp, ramaPorId, lineaDeApp, proximosEventos,
  RUTA_RAIZ, abrirApp, abrirRama, atras, migas,
  TIPOS_ESTUDIO, MAX_NOMBRE_RAMA, ICONO_RAMA_POR_DEFECTO, sugerenciasDeRama,
  crearRama, anadirRama, quitarRama, AVISO_QUITAR_RAMA, TEXTO_RAMA_SIN_SISTEMA,
} from '../lib/estudiosApps';
import { Card, SectionTitle, Field, TextInput, PrimaryButton, BotonBorrar, EmptyHint, AIPanel } from '../components/ui';

function diasHasta(fechaISO) {
  return Math.ceil((new Date(fechaISO + 'T00:00:00').getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/* ---------- Explicar un concepto con IA ----------
   Caja de pregunta libre — a diferencia del resto de paneles de IA de la app (que mandan un
   prompt ya construido a partir de los datos), aquí el texto lo escribe el usuario. Sigue
   disparándose solo con un toque explícito, nunca automáticamente. */
function ExplicarConcepto({ accent }) {
  const [pregunta, setPregunta] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const preguntar = async () => {
    if (!pregunta.trim()) return;
    setLoading(true);
    setError('');
    setRespuesta('');
    try {
      const texto = await askAI(
        AI_SYSTEM,
        `Josué (16 años, 1º de Bachillerato de Ciencias, rama Biología, y estudiante de música) te pide que le expliques ` +
        `este concepto de forma clara y breve, con un ejemplo si ayuda: "${pregunta.trim()}"`
      );
      setRespuesta(texto || 'No he podido generar una explicación ahora mismo.');
    } catch (e) {
      setError(e.message || 'No he podido conectar con la IA ahora mismo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <p className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: COLORS.text }}>
        <HelpCircle size={16} style={{ color: accent }} /> Explícame un concepto
      </p>
      <div className="flex items-center gap-2">
        <TextInput
          value={pregunta} onChange={(e) => setPregunta(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && preguntar()}
          placeholder="Ej: la meiosis, un acorde disminuido..."
        />
        <div style={{ width: 84, flexShrink: 0 }}>
          <PrimaryButton accent={accent} disabled={loading || !pregunta.trim()} onClick={preguntar}>
            {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Preguntar'}
          </PrimaryButton>
        </div>
      </div>
      {error && <p className="text-xs mt-2" style={{ color: COLORS.negative }}>{error}</p>}
      {respuesta && <p className="text-sm mt-3 leading-relaxed" style={{ color: COLORS.text }}>{respuesta}</p>}
    </Card>
  );
}

/* ---------- Plan de repaso de un examen ----------
   La IA genera una lista de pasos (JSON) contando hacia atrás desde la fecha del examen; el
   usuario los marca, edita o borra después — mismo patrón ya usado para la progresión de
   calistenia en la Fase 5 (JSON parseado y editable, no un bloque de texto fijo). */
function PlanRepaso({ examen, onUpdatePlan, accent }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const plan = examen.planRepaso || [];

  const generar = async () => {
    setLoading(true);
    setError('');
    try {
      const dias = diasHasta(examen.fecha);
      const texto = await askAI(
        AI_SYSTEM,
        `Examen "${examen.tema || 'sin tema especificado'}" dentro de ${dias} días (${examen.fecha}). ` +
        `Nota objetivo: ${examen.notaObjetivo || 'sin especificar'}. Genera un plan de repaso realista repartido ` +
        `en pasos, priorizado por lo que queda de tiempo. Responde ÚNICAMENTE con un JSON válido, sin texto ni ` +
        `markdown alrededor, con este formato exacto: {"pasos": ["paso 1", "paso 2", "..."]}. Entre 3 y 7 pasos, ` +
        `nunca más de los que quepan razonablemente en ${dias} días.`
      );
      const limpio = texto.replace(/```json|```/g, '').trim();
      const json = JSON.parse(limpio);
      const pasos = (json.pasos || []).map((texto) => ({ id: uid(), texto, hecho: false }));
      onUpdatePlan([...plan, ...pasos]);
    } catch (e) {
      setError('No he podido generar el plan ahora mismo. Puedes añadir pasos a mano abajo.');
    } finally {
      setLoading(false);
    }
  };

  const [pasoManual, setPasoManual] = useState('');
  const anadirManual = () => {
    if (!pasoManual.trim()) return;
    onUpdatePlan([...plan, { id: uid(), texto: pasoManual.trim(), hecho: false }]);
    setPasoManual('');
  };
  const toggle = (id) => onUpdatePlan(plan.map((p) => (p.id === id ? { ...p, hecho: !p.hecho } : p)));
  const borrar = (id) => onUpdatePlan(plan.filter((p) => p.id !== id));

  return (
    <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>Plan de repaso</p>
        {plan.length === 0 && (
          <button onClick={generar} disabled={loading} className="flex items-center gap-1 text-xs font-semibold disabled:opacity-60" style={{ color: accent }}>
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {loading ? 'Generando…' : 'Generar con IA'}
          </button>
        )}
      </div>
      {error && <p className="text-xs mb-2" style={{ color: COLORS.negative }}>{error}</p>}
      <div className="space-y-1.5">
        {plan.map((p) => (
          <div key={p.id} className="flex items-center gap-2">
            <input type="checkbox" checked={p.hecho} onChange={() => toggle(p.id)} />
            <span className="text-xs flex-1" style={{ color: p.hecho ? COLORS.textMuted : COLORS.text, textDecoration: p.hecho ? 'line-through' : 'none' }}>
              {p.texto}
            </span>
            <button onClick={() => borrar(p.id)} aria-label="Borrar paso"><Trash2 size={12} style={{ color: COLORS.textMuted }} /></button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <TextInput value={pasoManual} onChange={(e) => setPasoManual(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && anadirManual()} placeholder="Añadir paso a mano" />
        <button onClick={anadirManual} className="p-2.5 rounded-xl" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }} aria-label="Añadir paso">
          <Plus size={14} style={{ color: COLORS.text }} />
        </button>
      </div>
    </div>
  );
}

function ExamenItem({ examen, onUpdate, onDelete, accent, forzarAbierta, onFocoConsumido }) {
  const [abierto, setAbierto] = useState(false);
  const dias = diasHasta(examen.fecha);

  // Ampliación del Dashboard — Centro de Control (apartado 6: "Examen de Biología — 3 días →
  // abrir directamente el examen") — `forzarAbierta` lo decide el padre (AsignaturaCard), que ya
  // sabe si el deep-link pendiente apunta a este examen en concreto.
  useEffect(() => {
    if (forzarAbierta) {
      setAbierto(true);
      const el = document.getElementById(`examen-${examen.id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      onFocoConsumido && onFocoConsumido();
    }
  }, [forzarAbierta]);

  return (
    <Card id={`examen-${examen.id}`} style={{ padding: '0.9rem' }}>
      <button onClick={() => setAbierto((a) => !a)} className="w-full flex items-center justify-between text-left">
        <div>
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{examen.tema || 'Examen'}</p>
          <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
            {formatFecha(examen.fecha)} · {dias >= 0 ? `en ${dias} días` : 'ya pasó'}
            {examen.notaObjetivo && ` · objetivo: ${examen.notaObjetivo}`}
            {examen.notaObtenida && ` · obtenida: ${examen.notaObtenida}`}
          </p>
        </div>
        {abierto ? <ChevronUp size={16} style={{ color: COLORS.textMuted }} /> : <ChevronDown size={16} style={{ color: COLORS.textMuted }} />}
      </button>

      {abierto && (
        <>
          {dias < 0 && !examen.notaObtenida && (
            <div className="mt-3">
              <Field label="Nota obtenida (opcional, ya pasó el examen)">
                <TextInput value={examen.notaObtenida || ''} onChange={(e) => onUpdate({ ...examen, notaObtenida: e.target.value })} />
              </Field>
            </div>
          )}
          <PlanRepaso examen={examen} onUpdatePlan={(plan) => onUpdate({ ...examen, planRepaso: plan })} accent={accent} />
          <button onClick={() => onDelete(examen.id)} className="text-xs mt-3" style={{ color: COLORS.negative }}>Borrar examen</button>
        </>
      )}
    </Card>
  );
}

function AsignaturaCard({ asignatura, examenes, horas, onAddExamen, onUpdateExamen, onDeleteExamen, onAddHoras, onDeleteHoras, onDeleteAsignatura, accent, focoExamenId, onFocoConsumido }) {
  const [abierto, setAbierto] = useState(false);
  const [showExamenForm, setShowExamenForm] = useState(false);
  const [examenForm, setExamenForm] = useState({ tema: '', fecha: todayISO(), notaObjetivo: '' });
  const [horasHoy, setHorasHoy] = useState('');

  // Ampliación del Dashboard — Centro de Control: si el examen destacado pertenece a esta
  // asignatura, se despliega sola (el `ExamenItem` concreto se abre él mismo con `forzarAbierta`).
  const contieneFoco = !!focoExamenId && examenes.some((e) => e.id === focoExamenId);
  useEffect(() => {
    if (contieneFoco) setAbierto(true);
  }, [contieneFoco]);

  const totalSemana = horas
    .filter((h) => diasHasta(h.fecha) > -7 && diasHasta(h.fecha) <= 0)
    .reduce((acc, h) => acc + Number(h.horas || 0), 0);

  const horasRecientes = [...horas].sort((a, b) => (a.fecha > b.fecha ? -1 : 1)).slice(0, 5);

  const submitExamen = () => {
    if (!examenForm.tema.trim()) return;
    onAddExamen({ id: uid(), asignaturaId: asignatura.id, ...examenForm, notaObtenida: '', planRepaso: [] });
    setShowExamenForm(false);
    setExamenForm({ tema: '', fecha: todayISO(), notaObjetivo: '' });
  };

  const registrarHoras = () => {
    const h = Number(horasHoy);
    if (!h) return;
    onAddHoras({ id: uid(), asignaturaId: asignatura.id, fecha: todayISO(), horas: h });
    setHorasHoy('');
  };

  const examenesOrdenados = [...examenes].sort((a, b) => (a.fecha > b.fecha ? 1 : -1));

  return (
    <Card id={`asignatura-${asignatura.id}`}>
      <button onClick={() => setAbierto((a) => !a)} className="w-full flex items-center justify-between text-left">
        <div className="flex items-center gap-2">
          <BookOpen size={16} style={{ color: accent }} />
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{asignatura.nombre}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: COLORS.textMuted }}>{totalSemana}h esta semana</span>
          {abierto ? <ChevronUp size={16} style={{ color: COLORS.textMuted }} /> : <ChevronDown size={16} style={{ color: COLORS.textMuted }} />}
        </div>
      </button>

      {abierto && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2">
            <TextInput type="number" step="0.5" inputMode="decimal" placeholder="Horas estudiadas hoy" value={horasHoy} onChange={(e) => setHorasHoy(e.target.value)} />
            <div style={{ width: 90, flexShrink: 0 }}>
              <PrimaryButton accent={accent} disabled={!horasHoy} onClick={registrarHoras} icon={Clock}>Sumar</PrimaryButton>
            </div>
          </div>

          {/* Entrega 2 · ME Fase 4 — hasta ahora las horas se sumaban y no había forma de ver ni
              corregir un registro concreto: un "8" tecleado por error se quedaba dentro del total
              para siempre. Se listan las últimas, con su borrado, sin convertir la tarjeta en una
              tabla: el dato principal sigue siendo el total de la semana. */}
          {horasRecientes.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: COLORS.textMuted }}>Horas registradas</p>
              <div className="space-y-1.5">
                {horasRecientes.map((h) => (
                  <div key={h.id} className="flex items-center justify-between gap-2">
                    <p className="text-xs min-w-0 truncate" style={{ color: COLORS.text }}>
                      {formatFecha(h.fecha)} · {h.horas}h
                    </p>
                    <BotonBorrar onClick={() => onDeleteHoras(h.id)} label="Eliminar horas de estudio" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>Exámenes</p>
            <button onClick={() => setShowExamenForm((s) => !s)} className="flex items-center gap-1 text-xs font-semibold" style={{ color: accent }}>
              <Plus size={12} /> Añadir examen
            </button>
          </div>

          {showExamenForm && (
            <Card style={{ background: COLORS.surface2 }}>
              <Field label="Tema / descripción">
                <TextInput value={examenForm.tema} onChange={(e) => setExamenForm({ ...examenForm, tema: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha">
                  <TextInput type="date" value={examenForm.fecha} onChange={(e) => setExamenForm({ ...examenForm, fecha: e.target.value })} />
                </Field>
                <Field label="Nota objetivo">
                  <TextInput value={examenForm.notaObjetivo} onChange={(e) => setExamenForm({ ...examenForm, notaObjetivo: e.target.value })} placeholder="Ej: 9" />
                </Field>
              </div>
              <PrimaryButton accent={accent} onClick={submitExamen}>Guardar examen</PrimaryButton>
            </Card>
          )}

          {examenesOrdenados.length === 0 && <EmptyHint text="Todavía no hay exámenes en esta asignatura." />}
          {examenesOrdenados.map((ex) => (
            <ExamenItem
              key={ex.id} examen={ex} onUpdate={onUpdateExamen} onDelete={onDeleteExamen} accent={accent}
              forzarAbierta={focoExamenId === ex.id} onFocoConsumido={onFocoConsumido}
            />
          ))}

          <button onClick={() => onDeleteAsignatura(asignatura.id)} className="text-xs" style={{ color: COLORS.negative }}>Borrar asignatura</button>
        </div>
      )}
    </Card>
  );
}

function CorrelacionEstudio({ sueno, horas, accent }) {
  const c = correlacionSuenoEstudio(sueno, horas);
  return (
    <Card>
      <p className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: COLORS.text }}>
        <TrendingUp size={16} style={{ color: accent }} /> Sueño y estudio
      </p>
      {c.suficientesDatos ? (
        <p className="text-xs leading-relaxed" style={{ color: COLORS.textMuted }}>
          En los días con al menos 7h de sueño la noche anterior ({c.diasBuenSueno} días con datos), has estudiado de media{' '}
          <span style={{ color: COLORS.text, fontWeight: 600 }}>{c.mediaHorasConBuenSueno}h</span>. Con menos de 7h ({c.diasSuenoCorto} días), la media baja a{' '}
          <span style={{ color: COLORS.text, fontWeight: 600 }}>{c.mediaHorasConSuenoCorto}h</span>.
        </p>
      ) : (
        <p className="text-xs" style={{ color: COLORS.textMuted }}>
          Todavía no hay suficientes días con sueño y horas de estudio registrados el mismo periodo para comparar (hacen falta al menos 2 días de cada tipo).
        </p>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ENTREGA 3 · ES FASE 1 — HOME TIPO TELÉFONO Y NUEVA ARQUITECTURA
   ══════════════════════════════════════════════════════════════════════════

   🚨 Lo que aquí se llama **app** es el `programa` que existe desde la Fase 6.
   El enunciado propone 🎓 Bachillerato, 🎹 Música, ⚽ Fútbol, ♟️ Ajedrez y
   🌍 Idiomas, y este módulo ya traía **Bachillerato y Música**. Una lista nueva
   habría dejado sus asignaturas, exámenes y horas invisibles (apartado 16).

   La pantalla es un navegador de tres niveles —Home → app → rama— y **nada de lo
   que ya funcionaba se ha reescrito**: `AsignaturaCard`, `ExamenItem`,
   `PlanRepaso`, `ExplicarConcepto` y `CorrelacionEstudio` son los de siempre; lo
   que cambia es dónde viven. */

function Plaquita({ app, linea, accent, onAbrir }) {
  return (
    <button
      onClick={onAbrir}
      className="rounded-2xl p-3 flex flex-col items-center justify-start text-center transition-transform active:scale-95"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, minHeight: 108 }}
    >
      <span aria-hidden="true" style={{ fontSize: 28, lineHeight: '34px' }}>{iconoDeApp(app)}</span>
      <span className="text-xs font-semibold mt-1 w-full truncate" style={{ color: COLORS.text }}>{app.nombre}</span>
      {/* Apartado 6 — una línea como mucho, y solo si aporta. `null` no pinta nada. */}
      {linea && <span className="text-[10px] mt-0.5 w-full truncate" style={{ color: accent }}>{linea}</span>}
    </button>
  );
}

function CrearApp({ accent, programas, onCrear, onCerrar }) {
  const [nombre, setNombre] = useState('');
  const [icono, setIcono] = useState('');
  const [categoria, setCategoria] = useState('');
  const [tipo, setTipo] = useState(null);

  // El icono se PROPONE según lo que escribe, y el campo sigue siendo suyo.
  const propuesto = icono || sugerirIcono(nombre) || ICONO_POR_DEFECTO;
  const repetido = nombreYaUsado(nombre, programas);

  const crear = () => {
    const app = crearApp({ nombre, icono: icono || sugerirIcono(nombre) || '', categoria, tipo }, programas);
    if (!app) return;
    onCrear(app);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Nueva área de estudio</p>
        <button onClick={onCerrar} className="toque-44 p-1.5 -m-1.5" aria-label="Cerrar">
          <X size={16} style={{ color: COLORS.textMuted }} />
        </button>
      </div>

      <Field label="Nombre">
        <TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={MAX_NOMBRE_APP} placeholder="Ej: Idiomas" />
      </Field>

      <Field label="Icono">
        <div className="flex items-center gap-2 mb-2">
          <span aria-hidden="true" style={{ fontSize: 26 }}>{propuesto}</span>
          <TextInput value={icono} onChange={(e) => setIcono(e.target.value)} placeholder="O pega el que quieras" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ICONOS_ESTUDIOS.map((ic) => (
            <button
              key={ic} onClick={() => setIcono(ic)} aria-label={`Usar el icono ${ic}`}
              aria-pressed={icono === ic}
              className="toque-44 rounded-xl transition-transform active:scale-90"
              style={{
                fontSize: 20, width: 40, height: 40,
                background: icono === ic ? hexToRgba(accent, 0.16) : COLORS.surface2,
                border: `1px solid ${icono === ic ? accent : COLORS.border}`,
              }}
            >
              {ic}
            </button>
          ))}
        </div>
      </Field>

      {/* ES F2, apartado 12 — el tipo NO restringe nada: decide qué secciones se le proponen
          después. Por eso se puede dejar sin elegir, y entonces se le ofrecen todas. */}
      <Field label="Tipo (opcional)">
        <div className="flex flex-wrap gap-1.5">
          {TIPOS_ESTUDIO.map((t) => (
            <button
              key={t.id} onClick={() => setTipo(tipo === t.id ? null : t.id)}
              aria-pressed={tipo === t.id}
              className="toque-44 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-transform active:scale-95"
              style={{
                background: tipo === t.id ? hexToRgba(accent, 0.16) : COLORS.surface2,
                border: `1px solid ${tipo === t.id ? accent : COLORS.border}`,
                color: tipo === t.id ? accent : COLORS.textMuted,
              }}
            >
              {t.icono} {t.nombre}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Categoría (opcional)">
        <TextInput value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ej: Extraescolares" />
      </Field>

      {/* Avisa del nombre repetido; no lo prohíbe. Puede tener dos "Inglés". */}
      {repetido && (
        <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>
          Ya tienes un área con ese nombre. Puedes crearla igualmente.
        </p>
      )}

      <PrimaryButton accent={accent} disabled={!nombre.trim()} onClick={crear}>Crear</PrimaryButton>
    </Card>
  );
}

/* ES F2, apartado 5 — añadir una sección dentro de un área. Las sugerencias son las del apartado 4 y
   dependen del tipo, pero **no imponen nada**: puede escribir la suya. */
function CrearRama({ accent, app, onCrear, onCerrar }) {
  const [nombre, setNombre] = useState('');
  const [icono, setIcono] = useState('');
  const sugerencias = sugerenciasDeRama(app?.tipo);
  const yaEstan = new Set((app?.ramas || []).map((r) => r.nombre.toLowerCase()));

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Nueva sección</p>
        <button onClick={onCerrar} className="toque-44 p-1.5 -m-1.5" aria-label="Cerrar">
          <X size={16} style={{ color: COLORS.textMuted }} />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {sugerencias.filter((s) => !yaEstan.has(s.nombre.toLowerCase())).map((s) => (
          <button
            key={s.nombre} onClick={() => { setNombre(s.nombre); setIcono(s.icono); }}
            className="toque-44 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-transform active:scale-95"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
          >
            {s.icono} {s.nombre}
          </button>
        ))}
      </div>

      <Field label="Nombre">
        <TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={MAX_NOMBRE_RAMA} placeholder="Ej: Oposiciones" />
      </Field>

      <Field label="Icono">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" style={{ fontSize: 24 }}>{icono || ICONO_RAMA_POR_DEFECTO}</span>
          <TextInput value={icono} onChange={(e) => setIcono(e.target.value)} placeholder="Pega el que quieras" />
        </div>
      </Field>

      {/* ⚠️ No se llama «Añadir»: la tarjeta ＋ de la cuadrícula ya se llama así, y dos botones con
          el mismo nombre en la misma pantalla acaban llevando al sitio equivocado (E3 F30). */}
      <PrimaryButton accent={accent} disabled={!nombre.trim()} onClick={() => {
        const r = crearRama({ nombre, icono });
        if (r) onCrear(r);
      }}>Crear sección</PrimaryButton>
    </Card>
  );
}

function ProximoEnEstudios({ estudios, accent, onIr }) {
  const eventos = proximosEventos(estudios);

  return (
    <div>
      <p className="text-xs font-bold tracking-wide mb-2" style={{ color: COLORS.textMuted }}>PRÓXIMO</p>
      {eventos.length === 0 ? (
        <EmptyHint text="No tienes exámenes apuntados para los próximos 30 días." />
      ) : (
        <div className="space-y-1.5">
          {eventos.map((e) => (
            <button
              key={e.id} onClick={() => onIr(e)}
              className="w-full rounded-2xl p-2.5 flex items-center gap-2.5 text-left transition-transform active:scale-[0.99]"
              style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
            >
              <span aria-hidden="true" style={{ fontSize: 18 }}>{e.icono}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold truncate" style={{ color: COLORS.text }}>{e.titulo}</span>
                <span className="block text-[11px] truncate" style={{ color: COLORS.textMuted }}>
                  {formatFecha(e.fecha)}{e.programa ? ` · ${e.programa}` : ''}
                </span>
              </span>
              <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: accent }}>
                {e.dias === 0 ? 'Hoy' : e.dias === 1 ? 'Mañana' : `${e.dias} días`}
              </span>
            </button>
          ))}
        </div>
      )}
      {/* Regla 8 — lo que todavía no puede salir aquí se dice, no se finge. */}
      <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>
        Por ahora solo salen los exámenes: los trabajos y las entregas todavía no se pueden apuntar.
      </p>
    </div>
  );
}

export default function EstudiosView({ estudios, sueno, onAddPrograma, onUpdateProgramas, onDeletePrograma, onAddAsignatura, onDeleteAsignatura, onAddExamen, onUpdateExamen, onDeleteExamen, onAddHoras, onDeleteHoras, accent, foco, onFocoConsumido }) {
  const [ruta, setRuta] = useState(RUTA_RAIZ);
  const [nuevaAsignatura, setNuevaAsignatura] = useState('');
  const [creando, setCreando] = useState(false);
  const [organizando, setOrganizando] = useState(false);
  const [anadiendoRama, setAnadiendoRama] = useState(false);
  const [organizandoRamas, setOrganizandoRamas] = useState(false);

  // Ampliación del Dashboard — Centro de Control (apartado 6): el examen destacado puede vivir en
  // cualquier app — se abre su app y su rama de asignaturas; AsignaturaCard y ExamenItem se
  // encargan de desplegarse y hacer scroll hasta el examen en sí.
  useEffect(() => {
    if (!foco?.examenId) return;
    const ex = estudios.examenes.find((e) => e.id === foco.examenId);
    const asig = ex && estudios.asignaturas.find((a) => a.id === ex.asignaturaId);
    if (asig) setRuta(abrirRama(asig.programaId, 'asignaturas'));
  }, [foco]);

  const programas = estudios.programas || [];
  const visibles = appsVisibles(programas);
  const todas = appsOrdenadas(programas);
  const app = programas.find((p) => p.id === ruta.appId) || null;
  const asignaturasApp = app ? asignaturasDe(estudios, app.id) : [];

  const anadirAsignatura = () => {
    if (!nuevaAsignatura.trim() || !app) return;
    onAddAsignatura({ id: uid(), programaId: app.id, nombre: nuevaAsignatura.trim() });
    setNuevaAsignatura('');
  };

  const cabecera = (
    <div className="flex items-center gap-2">
      {ruta.vista !== 'home' && (
        <button onClick={() => setRuta(atras(ruta))} className="toque-44 p-1.5 -m-1.5" aria-label="Volver atrás">
          <ChevronLeft size={20} style={{ color: COLORS.text }} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>
          {migas(ruta, programas).map((m) => m.texto).join(' › ')}
        </p>
      </div>
    </div>
  );

  /* ── HOME ───────────────────────────────────────────────────────────────── */
  if (ruta.vista === 'home') {
    return (
      <div className="space-y-4 pb-4 module-enter">
        <SectionTitle>
          <span className="flex items-center gap-2"><GraduationCap size={18} style={{ color: accent }} /> Estudios</span>
        </SectionTitle>

        {/* Apartado 14 — tres columnas, iconos grandes, sin scroll horizontal. */}
        <div className="grid grid-cols-3 gap-3">
          {visibles.map((p) => (
            <Plaquita key={p.id} app={p} linea={lineaDeApp(estudios, p.id)} accent={accent} onAbrir={() => setRuta(abrirApp(p.id))} />
          ))}
          <button
            onClick={() => setCreando((c) => !c)}
            className="rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-transform active:scale-95"
            style={{ background: COLORS.surface2, border: `1px dashed ${COLORS.border}`, minHeight: 108 }}
          >
            <Plus size={24} style={{ color: accent }} />
            <span className="text-xs font-semibold mt-1" style={{ color: COLORS.textMuted }}>Añadir</span>
          </button>
        </div>

        {creando && (
          <CrearApp
            accent={accent} programas={programas}
            onCrear={(nueva) => { onAddPrograma(nueva); setCreando(false); setRuta(abrirApp(nueva.id)); }}
            onCerrar={() => setCreando(false)}
          />
        )}

        {/* Apartado 4 — reordenar, ocultar y eliminar, sin un panel de configuración enorme. */}
        {todas.length > 0 && (
          <div>
            <button onClick={() => setOrganizando((o) => !o)} className="text-xs font-semibold" style={{ color: accent }}>
              {organizando ? 'Listo' : 'Organizar'}
            </button>
            {organizando && (
              <Card style={{ marginTop: '0.5rem' }}>
                <div className="space-y-1.5">
                  {todas.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <span aria-hidden="true" style={{ fontSize: 16 }}>{iconoDeApp(p)}</span>
                      <span className="text-xs min-w-0 flex-1 truncate" style={{ color: p.oculto ? COLORS.textMuted : COLORS.text }}>
                        {p.nombre}{p.oculto ? ' · oculta' : ''}
                      </span>
                      <button onClick={() => onUpdateProgramas(moverApp(programas, p.id, 'arriba'))} disabled={i === 0} className="toque-44 p-1.5 -m-1.5 disabled:opacity-30" aria-label={`Subir ${p.nombre}`}>
                        <ChevronUp size={16} style={{ color: COLORS.text }} />
                      </button>
                      <button onClick={() => onUpdateProgramas(moverApp(programas, p.id, 'abajo'))} disabled={i === todas.length - 1} className="toque-44 p-1.5 -m-1.5 disabled:opacity-30" aria-label={`Bajar ${p.nombre}`}>
                        <ChevronDown size={16} style={{ color: COLORS.text }} />
                      </button>
                      <button onClick={() => onUpdateProgramas(alternarOcultaApp(programas, p.id))} className="toque-44 p-1.5 -m-1.5" aria-label={p.oculto ? `Mostrar ${p.nombre}` : `Ocultar ${p.nombre}`}>
                        {p.oculto ? <Eye size={16} style={{ color: COLORS.textMuted }} /> : <EyeOff size={16} style={{ color: COLORS.textMuted }} />}
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>{AVISO_OCULTAR}</p>
              </Card>
            )}
          </div>
        )}

        {/* Apartado 9 — jerarquía: 2.º los próximos eventos. */}
        <ProximoEnEstudios estudios={estudios} accent={accent} onIr={(e) => setRuta(abrirRama(e.programaId, 'asignaturas'))} />

        {/* Apartado 9 — y 3.º la información secundaria. */}
        <CorrelacionEstudio sueno={sueno} horas={estudios.horas} accent={accent} />
      </div>
    );
  }

  /* ── UNA APP ────────────────────────────────────────────────────────────── */
  if (ruta.vista === 'app') {
    if (!app) return <div className="space-y-4 pb-4">{cabecera}<EmptyHint text="Esa área ya no existe." /></div>;
    const ramas = ramasDeApp(estudios, app);

    return (
      <div className="space-y-4 pb-4 module-enter">
        {cabecera}

        <div className="flex items-center gap-3">
          <span aria-hidden="true" style={{ fontSize: 34 }}>{iconoDeApp(app)}</span>
          <div className="min-w-0">
            <p className="text-lg font-bold truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{app.nombre}</p>
            {app.categoria && <p className="text-xs" style={{ color: COLORS.textMuted }}>{app.categoria}</p>}
          </div>
        </div>

        {/* ES F2, apartados 2 y 16 — la misma cuadrícula de tarjetas del Home: las pantallas
            interiores se sienten como una continuación, no como otra aplicación. */}
        <div className="grid grid-cols-2 gap-3">
          {ramas.map((r) => (
            <button
              key={r.id} onClick={() => setRuta(abrirRama(app.id, r.id))}
              className="rounded-2xl p-3 flex flex-col items-start text-left transition-transform active:scale-95"
              style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, minHeight: 92 }}
            >
              <span aria-hidden="true" style={{ fontSize: 24 }}>{r.icono}</span>
              <span className="text-sm font-semibold mt-1.5 w-full truncate" style={{ color: COLORS.text }}>{r.nombre}</span>
              {/* Una rama sin sistema no finge un número: ni un cero, que diría que está vacía. */}
              {r.linea && <span className="text-xs w-full truncate" style={{ color: COLORS.textMuted }}>{r.linea}</span>}
            </button>
          ))}
          <button
            onClick={() => setAnadiendoRama((a) => !a)}
            className="rounded-2xl p-3 flex flex-col items-center justify-center transition-transform active:scale-95"
            style={{ background: COLORS.surface2, border: `1px dashed ${COLORS.border}`, minHeight: 92 }}
          >
            <Plus size={20} style={{ color: accent }} />
            <span className="text-xs font-semibold mt-1" style={{ color: COLORS.textMuted }}>Añadir</span>
          </button>
        </div>

        {ramas.length === 0 && !anadiendoRama && (
          <EmptyHint text="Esta área no tiene ninguna sección. Añade la primera con ＋." />
        )}

        {anadiendoRama && (
          <CrearRama
            accent={accent} app={app}
            onCrear={(nueva) => { onUpdateProgramas(anadirRama(programas, app.id, nueva)); setAnadiendoRama(false); }}
            onCerrar={() => setAnadiendoRama(false)}
          />
        )}

        {/* Apartado 14 — quitar una rama. ⚠️ No borra nada de lo que hay dentro. */}
        {ramas.length > 0 && (
          <div>
            <button onClick={() => setOrganizandoRamas((o) => !o)} className="text-xs font-semibold" style={{ color: accent }}>
              {organizandoRamas ? 'Listo' : 'Organizar secciones'}
            </button>
            {organizandoRamas && (
              <Card style={{ marginTop: '0.5rem' }}>
                <div className="space-y-1.5">
                  {ramas.map((r) => (
                    <div key={r.id} className="flex items-center gap-2">
                      <span aria-hidden="true" style={{ fontSize: 16 }}>{r.icono}</span>
                      <span className="text-xs min-w-0 flex-1 truncate" style={{ color: COLORS.text }}>{r.nombre}</span>
                      <BotonBorrar
                        onClick={() => onUpdateProgramas(quitarRama(programas, app.id, r.id))}
                        label={`Quitar ${r.nombre} de ${app.nombre}`}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>{AVISO_QUITAR_RAMA}</p>
              </Card>
            )}
          </div>
        )}

        {/* Entrega 2 · ME Fase 4 — eliminar se lleva sus asignaturas (y con ellas exámenes y horas) a
            la papelera en una sola entrada, así que restaurarla la devuelve entera. */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <p className="text-xs min-w-0 truncate" style={{ color: COLORS.textMuted }}>
            {asignaturasApp.length} {asignaturasApp.length === 1 ? 'asignatura' : 'asignaturas'}
          </p>
          <BotonBorrar onClick={() => { onDeletePrograma(app.id); setRuta(RUTA_RAIZ); }} label={`Eliminar el área ${app.nombre}`} />
        </div>
      </div>
    );
  }

  /* ── UNA RAMA ───────────────────────────────────────────────────────────── */
  if (!app) return <div className="space-y-4 pb-4">{cabecera}<EmptyHint text="Esa área ya no existe." /></div>;

  const examenesApp = examenesDe(estudios, app.id);
  const horasApp = horasDe(estudios, app.id);
  const nombreAsignatura = (id) => estudios.asignaturas.find((a) => a.id === id)?.nombre || '';

  /* 🚨 ES F2 — la pantalla se elige por el SISTEMA de la rama, nunca por su id: desde esta fase los
     ids los pone `uid()` al crearlas y dos apps pueden tener una «Entrenamiento» cada una. */
  const rama = ramaPorId(app, ruta.ramaId);
  const sistema = rama?.sistema || null;

  return (
    <div className="space-y-4 pb-4 module-enter">
      {cabecera}

      {sistema === 'asignaturas' && (
        <>
          <div className="flex items-center gap-2">
            <TextInput value={nuevaAsignatura} onChange={(e) => setNuevaAsignatura(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && anadirAsignatura()} placeholder={`Nueva asignatura en ${app.nombre}`} />
            <button onClick={anadirAsignatura} className="p-2.5 rounded-xl" style={{ background: accent, flexShrink: 0 }} aria-label="Añadir asignatura">
              <Plus size={16} color={COLORS.textOnAccent} />
            </button>
          </div>

          <div className="space-y-3">
            {asignaturasApp.length === 0 && <EmptyHint text="Todavía no has añadido ninguna asignatura a esta área." />}
            {asignaturasApp.map((a) => (
              <AsignaturaCard
                key={a.id}
                asignatura={a}
                examenes={estudios.examenes.filter((e) => e.asignaturaId === a.id)}
                horas={estudios.horas.filter((h) => h.asignaturaId === a.id)}
                onAddExamen={onAddExamen}
                onUpdateExamen={onUpdateExamen}
                onDeleteExamen={onDeleteExamen}
                onAddHoras={onAddHoras}
                onDeleteHoras={onDeleteHoras}
                onDeleteAsignatura={onDeleteAsignatura}
                accent={accent}
                focoExamenId={foco?.examenId} onFocoConsumido={onFocoConsumido}
              />
            ))}
          </div>
        </>
      )}

      {sistema === 'examenes' && (
        <>
          {examenesApp.length === 0 ? (
            <EmptyHint text="Todavía no hay exámenes en esta área. Se añaden desde cada asignatura." />
          ) : (
            <div className="space-y-2">
              {[...examenesApp].sort((a, b) => (a.fecha > b.fecha ? 1 : -1)).map((ex) => (
                <div key={ex.id}>
                  <p className="text-[11px] mb-1" style={{ color: COLORS.textMuted }}>{nombreAsignatura(ex.asignaturaId)}</p>
                  <ExamenItem
                    examen={ex} onUpdate={onUpdateExamen} onDelete={onDeleteExamen} accent={accent}
                    forzarAbierta={foco?.examenId === ex.id} onFocoConsumido={onFocoConsumido}
                  />
                </div>
              ))}
            </div>
          )}

          {/* 🚨 Apartado 8 — la inteligencia NO se elimina: sale del Home y vive aquí. */}
          <ExplicarConcepto accent={accent} />

          <AIPanel
            label="Analizar mis estudios"
            accent={accent}
            buildPrompt={() =>
              `Asignaturas de Josué (JSON): ${JSON.stringify(asignaturasApp)}. ` +
              `Exámenes próximos y pasados (JSON): ${JSON.stringify(examenesApp.slice(-15))}. ` +
              `Horas de estudio recientes (JSON): ${JSON.stringify(horasApp.slice(-20))}. ` +
              `Dale una lectura breve de cómo lo lleva y qué priorizaría esta semana según fechas de examen — ` +
              `aconseja, no decidas por él. Si detectas un patrón simple, cita el dato concreto; si hay pocos datos, dilo abiertamente.`
            }
          />
        </>
      )}

      {sistema === 'horas' && (
        horasApp.length === 0 ? (
          <EmptyHint text="Todavía no has registrado horas en esta área. Se suman desde cada asignatura." />
        ) : (
          <Card>
            <div className="space-y-1.5">
              {[...horasApp].sort((a, b) => (a.fecha > b.fecha ? -1 : 1)).map((h) => (
                <div key={h.id} className="flex items-center justify-between gap-2">
                  <p className="text-xs min-w-0 truncate" style={{ color: COLORS.text }}>
                    {formatFecha(h.fecha)} · {h.horas}h · {nombreAsignatura(h.asignaturaId)}
                  </p>
                  <BotonBorrar onClick={() => onDeleteHoras(h.id)} label="Eliminar horas de estudio" />
                </div>
              ))}
            </div>
          </Card>
        )
      )}

      {/* 🚨 Una sección sin sistema detrás. Ni una lista falsa ni un botón que no haría nada
          (regla 8): una frase que dice qué es y que todavía no se puede guardar nada dentro. */}
      {rama && !sistema && (
        <Card>
          <p className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.text }}>
            <span aria-hidden="true">{rama.icono}</span> {rama.nombre}
          </p>
          <p className="text-xs mt-1.5 leading-relaxed" style={{ color: COLORS.textMuted }}>
            {TEXTO_RAMA_SIN_SISTEMA}
          </p>
        </Card>
      )}

      {/* Una rama que ya no existe —la quitó mientras la miraba— no deja la pantalla en blanco. */}
      {!rama && <EmptyHint text="Esa sección ya no está en esta área." />}
    </div>
  );
}
