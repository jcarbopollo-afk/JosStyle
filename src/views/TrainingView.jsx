import React, { useState, useEffect } from 'react';
import { Trophy, ChevronDown, Sparkles, Loader2, Video, Trash2, AlertTriangle, CheckCircle2, Circle, Plus } from 'lucide-react';
import { COLORS, SKILLS } from '../tokens';
import { uid, formatFecha, todayISO } from '../lib/helpers';
import { askAI, askAIWithImages, AI_SYSTEM } from '../lib/ai';
import { extractFramesFromSrc } from '../lib/videoFrames';
import { getSignedVideoUrl } from '../lib/supabase';
import { BotonBorrar, Card, ListCard, ListRow, SectionTitle, Field, TextInput, PrimaryButton, GhostBtn, ToggleTab, EmptyHint, AIPanel } from '../components/ui';

// Cuántos días seguidos (incluyendo hoy) hay que llevar entrenando la misma habilidad
// para que aparezca el aviso de "descanso recomendado".
const RACHA_AVISO = 4;

function calcularRacha(sesiones) {
  if (!sesiones || sesiones.length === 0) return 0;
  const fechas = new Set(sesiones.map((s) => s.fecha));
  let racha = 0;
  let cursor = new Date();
  for (;;) {
    const iso = cursor.toISOString().slice(0, 10);
    if (!fechas.has(iso)) break;
    racha++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return racha;
}

function ProgresionTab({ skill, data, onUpdate, accent }) {
  const [nuevo, setNuevo] = useState('');
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState('');
  const progresion = data.progresion || [];

  const addManual = () => {
    if (!nuevo.trim()) return;
    onUpdate({ ...data, progresion: [...progresion, { id: uid(), texto: nuevo.trim(), hecho: false, origen: 'manual' }] });
    setNuevo('');
  };

  const toggle = (id) => onUpdate({ ...data, progresion: progresion.map((p) => (p.id === id ? { ...p, hecho: !p.hecho } : p)) });
  const remove = (id) => onUpdate({ ...data, progresion: progresion.filter((p) => p.id !== id) });

  const generarConIA = async () => {
    setGenerando(true);
    setError('');
    try {
      const prompt =
        `Josué (16 años) está en un ${data.nivel}% de progreso hacia el ${skill} en calistenia. ` +
        `Dame de 4 a 6 pasos de progresión concretos y en orden, desde donde está ahora hasta dominar el ${skill}. ` +
        `Responde SOLO con un array JSON de strings cortos, sin explicación adicional ni markdown. Ejemplo de formato: ["paso 1", "paso 2"]`;
      const text = await askAI(AI_SYSTEM, prompt);
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const pasos = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      if (!Array.isArray(pasos)) throw new Error('formato inesperado');
      const nuevos = pasos.map((texto) => ({ id: uid(), texto: String(texto), hecho: false, origen: 'ia' }));
      onUpdate({ ...data, progresion: [...progresion, ...nuevos] });
    } catch (e) {
      setError('No he podido generar la progresión ahora mismo. Puedes añadir los pasos a mano.');
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <TextInput value={nuevo} onChange={(e) => setNuevo(e.target.value)} placeholder="Añadir paso a mano" onKeyDown={(e) => e.key === 'Enter' && addManual()} />
        </div>
        <div style={{ width: 46 }}>
          <button onClick={addManual} className="w-full h-full rounded-xl flex items-center justify-center" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }} aria-label="Añadir">
            <Plus size={16} style={{ color: COLORS.text }} />
          </button>
        </div>
      </div>

      <GhostBtn onClick={generarConIA} icon={generando ? Loader2 : Sparkles}>
        {generando ? 'Generando…' : 'Generar progresión con IA'}
      </GhostBtn>
      {error && <p className="text-xs" style={{ color: COLORS.textMuted }}>{error}</p>}

      {progresion.length === 0
        ? <EmptyHint text="Todavía no hay pasos de progresión. Añádelos a mano o pide que la IA proponga unos cuantos (siempre puedes editarlos después)." />
        : (
          <div className="space-y-1.5">
            {progresion.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: COLORS.surface2 }}>
                <button onClick={() => toggle(p.id)} aria-label="Marcar hecho">
                  {p.hecho ? <CheckCircle2 size={17} style={{ color: accent }} /> : <Circle size={17} style={{ color: COLORS.textMuted }} />}
                </button>
                <span className="text-sm flex-1" style={{ color: p.hecho ? COLORS.textMuted : COLORS.text, textDecoration: p.hecho ? 'line-through' : 'none' }}>
                  {p.texto}
                </span>
                {p.origen === 'ia' && <Sparkles size={12} style={{ color: COLORS.textMuted, flexShrink: 0 }} />}
                <button onClick={() => remove(p.id)} aria-label="Borrar paso"><Trash2 size={14} style={{ color: COLORS.textMuted }} /></button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

function PRsTab({ data, onUpdate, accent }) {
  const [valor, setValor] = useState('');
  const [nota, setNota] = useState('');
  const prs = data.prs || [];

  const submit = () => {
    if (!valor.trim()) return;
    onUpdate({ ...data, prs: [...prs, { id: uid(), fecha: todayISO(), valor: valor.trim(), nota: nota.trim() }] });
    setValor('');
    setNota('');
  };

  return (
    <div className="space-y-3">
      <Card>
        <Field label="Nuevo PR (ej: 12 reps, 25s, 3 series de 5)">
          <TextInput value={valor} onChange={(e) => setValor(e.target.value)} />
        </Field>
        <Field label="Nota (opcional)">
          <TextInput value={nota} onChange={(e) => setNota(e.target.value)} />
        </Field>
        <PrimaryButton accent={accent} onClick={submit}>Guardar PR</PrimaryButton>
      </Card>
      {prs.length === 0
        ? <EmptyHint text="Todavía no has registrado ningún PR para esta habilidad." />
        : (
          <ListCard>
            {[...prs].reverse().map((pr, i, arr) => (
              <ListRow key={pr.id} last={i === arr.length - 1} style={{ display: 'block' }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: accent }}>{pr.valor}</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>{formatFecha(pr.fecha)}</p>
                </div>
                {pr.nota && <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{pr.nota}</p>}
              </ListRow>
            ))}
          </ListCard>
        )}
    </div>
  );
}

function SesionesTab({ data, onUpdate, accent }) {
  const sesiones = data.sesiones || [];
  const racha = calcularRacha(sesiones);
  const yaHoy = sesiones.some((s) => s.fecha === todayISO());

  const registrar = () => {
    if (yaHoy) return;
    onUpdate({ ...data, sesiones: [...sesiones, { id: uid(), fecha: todayISO() }] });
  };

  return (
    <div className="space-y-3">
      {racha >= RACHA_AVISO && (
        <div className="rounded-2xl p-3 flex items-start gap-2" style={{ background: 'rgba(180,160,80,0.08)', border: '1px solid rgba(180,160,80,0.25)' }}>
          <AlertTriangle size={16} style={{ color: COLORS.warning, flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs" style={{ color: COLORS.textMuted }}>
            Llevas {racha} días seguidos entrenando esta habilidad sin descansar. Puede ser buen momento para un día de descanso.
          </p>
        </div>
      )}
      <Card>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm" style={{ color: COLORS.textMuted }}>Racha actual</p>
          <p className="text-lg font-bold" style={{ color: accent }}>{racha} {racha === 1 ? 'día' : 'días'}</p>
        </div>
        <PrimaryButton accent={accent} disabled={yaHoy} onClick={registrar}>
          {yaHoy ? 'Ya registrada hoy' : 'He entrenado esto hoy'}
        </PrimaryButton>
      </Card>
      {sesiones.length === 0 && <EmptyHint text="Todavía no has registrado ninguna sesión de esta habilidad." />}
    </div>
  );
}

function VideosTab({ skill, videos, onAddVideo, onDeleteVideo, onSetVideoFeedback, accent }) {
  const [subiendo, setSubiendo] = useState(false);
  const [nota, setNota] = useState('');
  const [analizando, setAnalizando] = useState(null); // id del vídeo que se está analizando
  const [comparar, setComparar] = useState([]); // hasta 2 ids seleccionados

  const propios = videos.filter((v) => v.skill === skill);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setSubiendo(true);
    try {
      await onAddVideo(skill, file, nota);
      setNota('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubiendo(false);
    }
  };

  const analizar = async (video) => {
    setAnalizando(video.id);
    try {
      const url = await getSignedVideoUrl(video.path);
      if (!url) throw new Error('No se ha podido acceder al vídeo');
      const frames = await extractFramesFromSrc(url, 4, true);
      const prompt =
        `Estos son 4 fotogramas clave (no el vídeo fluido completo) de un intento de ${skill} en calistenia de Josué, 16 años. ` +
        `Dale 2-3 consejos técnicos concretos basados en lo que se ve en la postura, sin inventar detalles que no puedas ver. ` +
        `Si los fotogramas no dejan ver bien la técnica, dilo abiertamente.`;
      const feedback = await askAIWithImages(AI_SYSTEM, prompt, frames);
      onSetVideoFeedback(video.id, feedback || 'No he podido generar un análisis con estos fotogramas.');
    } catch (err) {
      onSetVideoFeedback(video.id, 'No se ha podido analizar este vídeo (puede que el navegador haya bloqueado leer los fotogramas). Inténtalo de nuevo.');
    } finally {
      setAnalizando(null);
    }
  };

  const toggleComparar = (id) => {
    setComparar((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const [urlsComparar, setUrlsComparar] = useState({});
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        comparar.map(async (id) => {
          const v = propios.find((x) => x.id === id);
          return [id, v ? await getSignedVideoUrl(v.path) : null];
        })
      );
      if (!cancelled) setUrlsComparar(Object.fromEntries(entries));
    })();
    return () => { cancelled = true; };
  }, [comparar.join(',')]);

  return (
    <div className="space-y-3">
      <Card>
        <Field label="Nota (opcional, para este vídeo)">
          <TextInput value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej: segundo intento del día" />
        </Field>
        <label className="block">
          <div className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold w-full cursor-pointer" style={{ background: accent, color: COLORS.textOnAccent, opacity: subiendo ? 0.6 : 1 }}>
            <Video size={16} strokeWidth={2.5} />
            {subiendo ? 'Subiendo…' : `Subir vídeo de ${skill}`}
          </div>
          <input type="file" accept="video/*" onChange={handleFile} disabled={subiendo} className="hidden" />
        </label>
        <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>
          La IA analiza unos pocos fotogramas del vídeo, no el vídeo fluido completo — es una limitación conocida, no un error.
        </p>
      </Card>

      {comparar.length === 2 && (
        <Card>
          <p className="text-xs font-semibold mb-2" style={{ color: COLORS.textMuted }}>Comparación</p>
          <div className="grid grid-cols-2 gap-2">
            {comparar.map((id) => {
              const v = propios.find((x) => x.id === id);
              return (
                <div key={id}>
                  {urlsComparar[id]
                    ? <video src={urlsComparar[id]} controls className="w-full rounded-xl" style={{ background: '#000' }} />
                    : <div className="w-full aspect-video rounded-xl" style={{ background: COLORS.surface2 }} />}
                  <p className="text-xs mt-1 text-center" style={{ color: COLORS.textMuted }}>{v && formatFecha(v.fecha)}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {propios.length === 0 && <EmptyHint text={`Todavía no has subido ningún vídeo de ${skill}.`} />}
      <div className="space-y-2">
        {[...propios].reverse().map((v) => (
          <Card key={v.id} style={{ padding: '1rem' }}>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs" style={{ color: COLORS.textMuted }}>
                <input type="checkbox" checked={comparar.includes(v.id)} onChange={() => toggleComparar(v.id)} />
                Comparar
              </label>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>{formatFecha(v.fecha)}</p>
            </div>
            {v.nota && <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{v.nota}</p>}
            <div className="flex gap-2 mt-2">
              <GhostBtn onClick={() => analizar(v)} icon={analizando === v.id ? Loader2 : Sparkles}>
                {analizando === v.id ? 'Analizando…' : 'Analizar con IA'}
              </GhostBtn>
              <button onClick={() => onDeleteVideo(v.id, v.path)} className="rounded-xl px-3" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }} aria-label="Borrar vídeo">
                <Trash2 size={14} style={{ color: COLORS.textMuted }} />
              </button>
            </div>
            {v.feedback && <p className="text-xs mt-2 leading-relaxed" style={{ color: COLORS.text }}>{v.feedback}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}

// Optimización de navegación/scroll — las 7 habilidades de calistenia vivían apiladas en una
// columna (7 tarjetas × icono+nombre+%+slider, ~90px cada una sin ni siquiera desplegar nada:
// más de 600px solo para verlas todas). Ahora se colocan en una rejilla de 2 columnas mientras
// están colegidas (`gridColumn` normal) y la que se toca pasa a ocupar el ancho completo
// (`gridColumn: '1 / -1'`) para tener sitio de sobra para las 4 subpestañas — mismo contenido,
// mismas acciones, sin perder ni una función, solo menos alto cuando no hay ninguna abierta.
function SkillCard({ skill, data, onUpdate, videos, onAddVideo, onDeleteVideo, onSetVideoFeedback, accent, foco, onFocoConsumido }) {
  const [expanded, setExpanded] = useState(false);
  const [sub, setSub] = useState('progresion');
  const full = { nivel: 0, progresion: [], prs: [], sesiones: [], ...data };

  // Ampliación del Dashboard — Centro de Control (apartado 6: "Handstand — 72% → abrir
  // directamente Handstand"): si el deep-link pendiente apunta a esta habilidad, se autoexpande y
  // hace scroll hasta ella — cada `SkillCard` decide esto sola, sin que el padre tenga que
  // levantar el estado `expanded` de las 7 (mismo criterio ya usado para la rejilla 2x2).
  useEffect(() => {
    if (foco?.skill === skill) {
      setExpanded(true);
      const el = document.getElementById(`skill-${skill}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      onFocoConsumido && onFocoConsumido();
    }
  }, [foco]);

  return (
    <Card id={`skill-${skill}`} style={{ gridColumn: expanded ? '1 / -1' : undefined, padding: expanded ? undefined : '0.9rem' }}>
      <button className="w-full" onClick={() => setExpanded((s) => !s)}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-sm font-semibold flex items-center gap-1.5 min-w-0 truncate" style={{ color: COLORS.text }}>
            <Trophy size={15} style={{ color: accent, flexShrink: 0 }} /> <span className="truncate">{skill}</span>
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs font-bold" style={{ color: accent }}>{full.nivel}%</span>
            <ChevronDown size={15} style={{ color: COLORS.textMuted, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>
        </div>
      </button>
      <input
        type="range" min="0" max="100" value={full.nivel}
        onChange={(e) => onUpdate(skill, { ...full, nivel: Number(e.target.value) })}
        className="w-full"
        style={{ accentColor: accent }}
        onClick={(e) => e.stopPropagation()}
      />

      {expanded && (
        <div className="mt-4 pt-4 space-y-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <div className="flex gap-1.5">
            <ToggleTab active={sub === 'progresion'} onClick={() => setSub('progresion')} accent={accent}>Progresión</ToggleTab>
            <ToggleTab active={sub === 'prs'} onClick={() => setSub('prs')} accent={accent}>PRs</ToggleTab>
            <ToggleTab active={sub === 'sesiones'} onClick={() => setSub('sesiones')} accent={accent}>Sesiones</ToggleTab>
            <ToggleTab active={sub === 'videos'} onClick={() => setSub('videos')} accent={accent}>Vídeos</ToggleTab>
          </div>
          {sub === 'progresion' && <ProgresionTab skill={skill} data={full} onUpdate={(d) => onUpdate(skill, d)} accent={accent} />}
          {sub === 'prs' && <PRsTab data={full} onUpdate={(d) => onUpdate(skill, d)} accent={accent} />}
          {sub === 'sesiones' && <SesionesTab data={full} onUpdate={(d) => onUpdate(skill, d)} accent={accent} />}
          {sub === 'videos' && (
            <VideosTab
              skill={skill} videos={videos}
              onAddVideo={onAddVideo} onDeleteVideo={onDeleteVideo} onSetVideoFeedback={onSetVideoFeedback}
              accent={accent}
            />
          )}
        </div>
      )}
    </Card>
  );
}

export default function TrainingView({ calistenia, onUpdateSkill, futbol, onAddPartido, onDeletePartido, videos, onAddVideo, onDeleteVideo, onSetVideoFeedback, accent, foco, onFocoConsumido }) {
  const [sub, setSub] = useState('calistenia');
  const [nota, setNota] = useState('');

  // Si el deep-link apunta a una habilidad de calistenia y la subpestaña activa era Fútbol,
  // cambia a Calistenia primero — la propia SkillCard se encarga de expandirse y hacer scroll.
  useEffect(() => {
    if (foco?.skill) setSub('calistenia');
  }, [foco]);

  return (
    <div className="space-y-4 pb-4">
      <SectionTitle sub="Calistenia y fútbol">Entrenamiento</SectionTitle>

      <div className="flex gap-2">
        <ToggleTab active={sub === 'calistenia'} onClick={() => setSub('calistenia')} accent={accent}>Calistenia</ToggleTab>
        <ToggleTab active={sub === 'futbol'} onClick={() => setSub('futbol')} accent={accent}>Fútbol</ToggleTab>
      </div>

      {sub === 'calistenia' && (
        <div className="grid grid-cols-2 gap-3">
          {SKILLS.map((skill) => (
            <SkillCard
              key={skill} skill={skill} data={calistenia[skill]} onUpdate={onUpdateSkill}
              videos={videos} onAddVideo={onAddVideo} onDeleteVideo={onDeleteVideo} onSetVideoFeedback={onSetVideoFeedback}
              accent={accent} foco={foco} onFocoConsumido={onFocoConsumido}
            />
          ))}
        </div>
      )}

      {sub === 'futbol' && (
        <div className="space-y-3">
          <Card>
            <Field label="Nota del partido (opcional)">
              <TextInput value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej. amistoso, jugué de delantero…" />
            </Field>
            <PrimaryButton accent={accent} onClick={() => { onAddPartido({ id: uid(), fecha: todayISO(), nota }); setNota(''); }}>
              Registrar partido de hoy
            </PrimaryButton>
          </Card>
          {futbol.length === 0
            ? <EmptyHint text="Todavía no has registrado ningún partido." />
            : (
              <ListCard>
                {[...futbol].reverse().map((p, i, arr) => (
                  <ListRow key={p.id} last={i === arr.length - 1}>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{formatFecha(p.fecha)}</p>
                      {p.nota && <p className="text-xs mt-0.5 truncate" style={{ color: COLORS.textMuted }}>{p.nota}</p>}
                    </div>
                    <BotonBorrar onClick={() => onDeletePartido(p.id)} label="Eliminar partido" />
                  </ListRow>
                ))}
              </ListCard>
            )}
        </div>
      )}

      <AIPanel
        label="Sugerencia de entrenamiento"
        accent={accent}
        buildPrompt={() => `Progreso de calistenia de Josué, con nivel, progresión, PRs y sesiones recientes por habilidad (JSON): ${JSON.stringify(calistenia)}. Partidos de fútbol registrados: ${futbol.length}. Sugiere en qué priorizar en la próxima sesión, y si alguna habilidad lleva mucho tiempo sin PRs nuevos, dilo.`}
      />
    </div>
  );
}
