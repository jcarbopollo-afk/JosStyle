import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Plus, Trash2, ChevronDown, ChevronUp, Play, Pause, RotateCcw, Sparkles } from 'lucide-react';
import { COLORS, CATEGORIAS_TIEMPO_USO, DURACIONES_CONCENTRACION } from '../tokens';
import { uid, todayISO, addDays, formatFecha } from '../lib/helpers';
import { Card, SectionTitle, Field, TextInput, Textarea, Select, PrimaryButton, ToggleTab, EmptyHint } from '../components/ui';

/* ---------- Resumen: tres índices puramente descriptivos sobre el propio registro ----------
   No miden el uso real del móvil (una PWA no puede leerlo) — son el reparto en % de los minutos
   que Josué mismo ha registrado en los últimos 7 días, por categoría. */
function calcularIndices(registros) {
  const desde = addDays(todayISO(), -6);
  const enRango = registros.filter((r) => r.fecha >= desde);
  const total = enRango.reduce((s, r) => s + r.minutos, 0);
  const minutosDe = (cat) => enRango.filter((r) => r.categoria === cat).reduce((s, r) => s + r.minutos, 0);
  const pct = (cat) => (total === 0 ? 0 : Math.round((minutosDe(cat) / total) * 100));
  return {
    total,
    productivo: pct('productivo'),
    distraccion: pct('distraccion'),
    neutro: pct('neutro'),
  };
}

function BarraIndice({ label, valor, color }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-medium" style={{ color: COLORS.text }}>{label}</p>
        <p className="text-sm font-semibold" style={{ color }}>{valor}%</p>
      </div>
      <div className="h-2.5 rounded-full" style={{ background: COLORS.surface2 }}>
        <div className="h-2.5 rounded-full" style={{ width: `${valor}%`, background: color, transition: 'width 0.3s ease' }} />
      </div>
    </div>
  );
}

function ResumenTab({ registros, sesiones, accent }) {
  const idx = calcularIndices(registros);
  const semana = addDays(todayISO(), -6);
  const sesionesSemana = sesiones.filter((s) => s.fecha >= semana).length;

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-semibold mb-3" style={{ color: COLORS.textMuted }}>ÍNDICES DE LOS ÚLTIMOS 7 DÍAS</p>
        {idx.total === 0 ? (
          <EmptyHint text="Todavía no hay registros de Tiempo de Uso esta semana. Añade el primero en la pestaña 'Tiempo de uso'." />
        ) : (
          <div className="space-y-4">
            <BarraIndice label="Productividad" valor={idx.productivo} color={COLORS.positive} />
            <BarraIndice label="Distracción" valor={idx.distraccion} color={COLORS.negative} />
            <BarraIndice label="Equilibrio (tiempo neutro)" valor={idx.neutro} color={accent} />
            <p className="text-xs pt-1" style={{ color: COLORS.textMuted }}>Basado en {idx.total} min registrados a mano — no es una medición real del dispositivo.</p>
          </div>
        )}
      </Card>

      <Card className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: COLORS.surface2 }}>
          <Sparkles size={16} style={{ color: accent }} />
        </div>
        <p className="text-sm" style={{ color: COLORS.text }}>
          Sesiones de concentración esta semana: <span className="font-semibold">{sesionesSemana}</span>
        </p>
      </Card>
    </div>
  );
}

/* ---------- Tiempo de uso ---------- */
function TiempoUsoTab({ registros, onAdd, onDelete, accent }) {
  const [form, setForm] = useState({ categoria: CATEGORIAS_TIEMPO_USO[0].id, app: '', minutos: '', fecha: todayISO() });

  const submit = () => {
    const minutos = Number(form.minutos);
    if (!minutos || minutos <= 0 || !form.fecha) return;
    onAdd({ id: uid(), categoria: form.categoria, app: form.app.trim(), minutos, fecha: form.fecha });
    setForm({ ...form, app: '', minutos: '' });
  };

  const ordenados = [...registros].sort((a, b) => (a.fecha < b.fecha ? 1 : -1)).slice(0, 25);
  const etiqueta = (id) => CATEGORIAS_TIEMPO_USO.find((c) => c.id === id)?.label || id;

  return (
    <div className="space-y-4">
      <Card>
        <Field label="Categoría">
          <Select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
            {CATEGORIAS_TIEMPO_USO.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </Select>
        </Field>
        <Field label="App o actividad (opcional)">
          <TextInput value={form.app} onChange={(e) => setForm({ ...form, app: e.target.value })} placeholder="Ej: Instagram, estudio, YouTube…" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Minutos">
            <TextInput type="number" min="1" value={form.minutos} onChange={(e) => setForm({ ...form, minutos: e.target.value })} placeholder="30" />
          </Field>
          <Field label="Fecha">
            <TextInput type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
          </Field>
        </div>
        <PrimaryButton accent={accent} icon={Plus} onClick={submit}>Registrar tiempo</PrimaryButton>
        <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>Entrada manual — la importación automática del Tiempo de Uso queda pendiente.</p>
      </Card>

      {ordenados.length === 0 ? (
        <EmptyHint text="Todavía no has registrado ningún tiempo de uso." />
      ) : (
        <div className="space-y-2">
          {ordenados.map((r) => (
            <Card key={r.id} style={{ padding: '1rem' }} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{r.app || etiqueta(r.categoria)}</p>
                <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{etiqueta(r.categoria)} · {r.minutos} min · {formatFecha(r.fecha)}</p>
              </div>
              <button onClick={() => onDelete(r.id)} aria-label="Eliminar registro"><Trash2 size={14} style={{ color: COLORS.textMuted }} /></button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Concentración: temporizador simulado, mismo patrón que el Pomodoro de
   Productividad, pero con duración elegible y sin fase de descanso automática. ---------- */
function ConcentracionTab({ sesiones, onCompletar, accent }) {
  const [duracionMin, setDuracionMin] = useState(DURACIONES_CONCENTRACION[1]);
  const [segundos, setSegundos] = useState(DURACIONES_CONCENTRACION[1] * 60);
  const [corriendo, setCorriendo] = useState(false);
  const [logrado, setLogrado] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (corriendo) {
      intervalRef.current = setInterval(() => {
        setSegundos((s) => {
          if (s <= 1) {
            setCorriendo(false);
            setLogrado(true);
            onCompletar(duracionMin);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corriendo]);

  const elegirDuracion = (min) => {
    if (corriendo) return;
    setDuracionMin(min);
    setSegundos(min * 60);
    setLogrado(false);
  };
  const reiniciar = () => { setCorriendo(false); setLogrado(false); setSegundos(duracionMin * 60); };

  const mm = String(Math.floor(segundos / 60)).padStart(2, '0');
  const ss = String(segundos % 60).padStart(2, '0');
  const semana = addDays(todayISO(), -6);
  const sesionesSemana = sesiones.filter((s) => s.fecha >= semana);

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs" style={{ color: COLORS.textMuted }}>
          Un temporizador simulado dentro de la propia app — no puede bloquear otras apps de tu móvil de verdad, solo te ayuda a marcarte un bloque de concentración.
        </p>
      </Card>

      <Card className="flex flex-col items-center py-8">
        <div className="flex gap-1.5 flex-wrap justify-center mb-5">
          {DURACIONES_CONCENTRACION.map((min) => (
            <ToggleTab key={min} active={duracionMin === min} onClick={() => elegirDuracion(min)} accent={accent}>{min} min</ToggleTab>
          ))}
        </div>

        <p className="text-5xl font-extrabold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{mm}:{ss}</p>

        {logrado && (
          <p className="text-sm font-semibold mt-3" style={{ color: accent }}>🎉 Sesión completada — bien hecho.</p>
        )}

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => { if (segundos === 0) reiniciar(); setCorriendo((c) => !c); }}
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
        <p className="text-xs mt-5" style={{ color: COLORS.textMuted }}>Sesiones completadas esta semana: {sesionesSemana.length}</p>
      </Card>
    </div>
  );
}

/* ---------- Reflexión: pantalla que Josué abre él mismo, nunca automática ---------- */
function ReflexionCard({ reflexion, onDelete }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <Card style={{ padding: '1rem' }}>
      <button onClick={() => setAbierta(!abierta)} className="w-full flex items-center justify-between text-left">
        <div>
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{formatFecha(reflexion.fecha)}</p>
          {!abierta && <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{reflexion.texto.slice(0, 50)}{reflexion.texto.length > 50 ? '…' : ''}</p>}
        </div>
        {abierta ? <ChevronUp size={16} style={{ color: COLORS.textMuted }} /> : <ChevronDown size={16} style={{ color: COLORS.textMuted }} />}
      </button>
      {abierta && (
        <div className="mt-3 pt-3 space-y-2.5" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: COLORS.text }}>{reflexion.texto}</p>
          <button onClick={() => onDelete(reflexion.id)} className="flex items-center gap-1.5 text-xs font-medium pt-1" style={{ color: COLORS.textMuted }}>
            <Trash2 size={13} /> Eliminar
          </button>
        </div>
      )}
    </Card>
  );
}

function ReflexionTab({ reflexiones, onAdd, onDelete, accent }) {
  const [texto, setTexto] = useState('');

  const guardar = () => {
    if (!texto.trim()) return;
    onAdd({ id: uid(), fecha: todayISO(), texto: texto.trim() });
    setTexto('');
  };

  const ordenadas = [...reflexiones].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-semibold mb-2" style={{ color: COLORS.textMuted }}>ANTES DE SEGUIR, UN MOMENTO</p>
        <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>¿Por qué has abierto esto? ¿Es lo que querías hacer ahora mismo? ¿Cómo te sientes? Escribe lo que te salga — nadie más lo ve.</p>
        <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe tu reflexión de ahora…" />
        <PrimaryButton accent={accent} disabled={!texto.trim()} onClick={guardar}>Guardar reflexión</PrimaryButton>
      </Card>

      {ordenadas.length === 0 ? (
        <EmptyHint text="Todavía no has guardado ninguna reflexión." />
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold px-1" style={{ color: COLORS.textMuted }}>REFLEXIONES ANTERIORES</p>
          {ordenadas.map((r) => <ReflexionCard key={r.id} reflexion={r} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  );
}

export default function WellbeingView({ bienestar, onAddRegistro, onDeleteRegistro, onAddReflexion, onDeleteReflexion, onCompletarSesion, accent }) {
  const [sub, setSub] = useState('resumen');

  return (
    <div className="space-y-4 pb-4">
      <SectionTitle sub="Tiempo de uso, concentración y reflexión — todo dentro de la propia app">
        <span className="flex items-center gap-2"><Smartphone size={18} style={{ color: accent }} /> Bienestar digital</span>
      </SectionTitle>

      <div className="flex gap-1.5 flex-wrap">
        <ToggleTab active={sub === 'resumen'} onClick={() => setSub('resumen')} accent={accent}>Resumen</ToggleTab>
        <ToggleTab active={sub === 'tiempo'} onClick={() => setSub('tiempo')} accent={accent}>Tiempo de uso</ToggleTab>
        <ToggleTab active={sub === 'concentracion'} onClick={() => setSub('concentracion')} accent={accent}>Concentración</ToggleTab>
        <ToggleTab active={sub === 'reflexion'} onClick={() => setSub('reflexion')} accent={accent}>Reflexión</ToggleTab>
      </div>

      {sub === 'resumen' && <ResumenTab registros={bienestar.registros} sesiones={bienestar.sesiones} accent={accent} />}
      {sub === 'tiempo' && <TiempoUsoTab registros={bienestar.registros} onAdd={onAddRegistro} onDelete={onDeleteRegistro} accent={accent} />}
      {sub === 'concentracion' && <ConcentracionTab sesiones={bienestar.sesiones} onCompletar={onCompletarSesion} accent={accent} />}
      {sub === 'reflexion' && <ReflexionTab reflexiones={bienestar.reflexiones} onAdd={onAddReflexion} onDelete={onDeleteReflexion} accent={accent} />}
    </div>
  );
}
