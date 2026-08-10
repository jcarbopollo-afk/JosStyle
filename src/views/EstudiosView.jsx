import React, { useState } from 'react';
import { GraduationCap, BookOpen, Calendar, Clock, Plus, Trash2, ChevronDown, ChevronUp, HelpCircle, TrendingUp, Loader2, Sparkles } from 'lucide-react';
import { COLORS } from '../tokens';
import { uid, formatFecha, todayISO } from '../lib/helpers';
import { askAI, AI_SYSTEM } from '../lib/ai';
import { correlacionSuenoEstudio } from '../lib/correlaciones';
import { Card, SectionTitle, Field, TextInput, PrimaryButton, GhostBtn, ToggleTab, EmptyHint, AIPanel } from '../components/ui';

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

function ExamenItem({ examen, onUpdate, onDelete, accent }) {
  const [abierto, setAbierto] = useState(false);
  const dias = diasHasta(examen.fecha);

  return (
    <Card style={{ padding: '0.9rem' }}>
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

function AsignaturaCard({ asignatura, examenes, horas, onAddExamen, onUpdateExamen, onDeleteExamen, onAddHoras, onDeleteAsignatura, accent }) {
  const [abierto, setAbierto] = useState(false);
  const [showExamenForm, setShowExamenForm] = useState(false);
  const [examenForm, setExamenForm] = useState({ tema: '', fecha: todayISO(), notaObjetivo: '' });
  const [horasHoy, setHorasHoy] = useState('');

  const totalSemana = horas
    .filter((h) => diasHasta(h.fecha) > -7 && diasHasta(h.fecha) <= 0)
    .reduce((acc, h) => acc + Number(h.horas || 0), 0);

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
    <Card>
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
            <ExamenItem key={ex.id} examen={ex} onUpdate={onUpdateExamen} onDelete={onDeleteExamen} accent={accent} />
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

export default function EstudiosView({ estudios, sueno, onAddPrograma, onAddAsignatura, onDeleteAsignatura, onAddExamen, onUpdateExamen, onDeleteExamen, onAddHoras, accent }) {
  const [programaActivo, setProgramaActivo] = useState(estudios.programas[0]?.id);
  const [nuevaAsignatura, setNuevaAsignatura] = useState('');
  const [showNuevoPrograma, setShowNuevoPrograma] = useState(false);
  const [nuevoPrograma, setNuevoPrograma] = useState('');

  const programa = estudios.programas.find((p) => p.id === programaActivo) || estudios.programas[0];
  const asignaturasPrograma = estudios.asignaturas.filter((a) => a.programaId === programa?.id);

  const anadirAsignatura = () => {
    if (!nuevaAsignatura.trim() || !programa) return;
    onAddAsignatura({ id: uid(), programaId: programa.id, nombre: nuevaAsignatura.trim() });
    setNuevaAsignatura('');
  };

  const anadirPrograma = () => {
    if (!nuevoPrograma.trim()) return;
    const id = uid();
    onAddPrograma({ id, nombre: nuevoPrograma.trim() });
    setProgramaActivo(id);
    setNuevoPrograma('');
    setShowNuevoPrograma(false);
  };

  return (
    <div className="space-y-4 pb-4">
      <SectionTitle sub="Un programa por pestaña — la IA aconseja el plan, tú decides y lo ejecutas">
        <span className="flex items-center gap-2"><GraduationCap size={18} style={{ color: accent }} /> Estudios</span>
      </SectionTitle>

      <div className="flex gap-2 flex-wrap">
        {estudios.programas.map((p) => (
          <ToggleTab key={p.id} active={programaActivo === p.id} onClick={() => setProgramaActivo(p.id)} accent={accent}>{p.nombre}</ToggleTab>
        ))}
        <GhostBtn icon={Plus} onClick={() => setShowNuevoPrograma((s) => !s)}>Programa</GhostBtn>
      </div>

      {showNuevoPrograma && (
        <Card>
          <div className="flex items-center gap-2">
            <TextInput value={nuevoPrograma} onChange={(e) => setNuevoPrograma(e.target.value)} placeholder="Ej: Idiomas" />
            <div style={{ width: 90, flexShrink: 0 }}><PrimaryButton accent={accent} onClick={anadirPrograma}>Crear</PrimaryButton></div>
          </div>
        </Card>
      )}

      <ExplicarConcepto accent={accent} />

      <div className="flex items-center gap-2">
        <TextInput value={nuevaAsignatura} onChange={(e) => setNuevaAsignatura(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && anadirAsignatura()} placeholder={`Nueva asignatura en ${programa?.nombre || ''}`} />
        <button onClick={anadirAsignatura} className="p-2.5 rounded-xl" style={{ background: accent, flexShrink: 0 }} aria-label="Añadir asignatura">
          <Plus size={16} color={COLORS.textOnAccent} />
        </button>
      </div>

      <div className="space-y-3">
        {asignaturasPrograma.length === 0 && <EmptyHint text="Todavía no has añadido ninguna asignatura a este programa." />}
        {asignaturasPrograma.map((a) => (
          <AsignaturaCard
            key={a.id}
            asignatura={a}
            examenes={estudios.examenes.filter((e) => e.asignaturaId === a.id)}
            horas={estudios.horas.filter((h) => h.asignaturaId === a.id)}
            onAddExamen={onAddExamen}
            onUpdateExamen={onUpdateExamen}
            onDeleteExamen={onDeleteExamen}
            onAddHoras={onAddHoras}
            onDeleteAsignatura={onDeleteAsignatura}
            accent={accent}
          />
        ))}
      </div>

      <CorrelacionEstudio sueno={sueno} horas={estudios.horas} accent={accent} />

      <AIPanel
        label="Analizar mis estudios"
        accent={accent}
        buildPrompt={() =>
          `Asignaturas de Josué (JSON): ${JSON.stringify(estudios.asignaturas)}. ` +
          `Exámenes próximos y pasados (JSON): ${JSON.stringify(estudios.examenes.slice(-15))}. ` +
          `Horas de estudio recientes (JSON): ${JSON.stringify(estudios.horas.slice(-20))}. ` +
          `Dale una lectura breve de cómo lo lleva y qué priorizaría esta semana según fechas de examen — ` +
          `aconseja, no decidas por él. Si detectas un patrón simple, cita el dato concreto; si hay pocos datos, dilo abiertamente.`
        }
      />
    </div>
  );
}
