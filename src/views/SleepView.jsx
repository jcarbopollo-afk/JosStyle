import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Moon, Sun } from 'lucide-react';
import { COLORS } from '../tokens';
import { calcularDuracion, formatHoras, formatFecha, hexToRgba } from '../lib/helpers';
import {
  CALIDADES, PREGUNTA_CALIDAD, PREGUNTA_INTERRUPCIONES, PREGUNTA_SIESTA,
  INTERRUPCIONES, MAX_SIESTA_MIN, HORA_DORMIR_DEFECTO, HORA_DESPERTAR_DEFECTO,
  crearRegistroSueno, calidadDe, valorDeCalidad, textoDuracion, mediaDeHoras, resumenNoche,
} from '../lib/sueno';
import { Card, ListCard, ListRow, BotonBorrar, SectionTitle, TextInput, PrimaryButton, EmptyHint, AIPanel } from '../components/ui';

/* Entrega 3 · Fase 31 (SU F1) — «Sueño: registro simple y experiencia premium».
   ═══════════════════════════════════════════════════════════════════════════

   🚨 **EL ENUNCIADO EMPIEZA PIDIENDO QUE NO SE REHAGA NADA**, así que la gráfica,
   la lista, la media y el panel de IA **son los de siempre**. Lo que cambia es el
   registro, que era un formulario con dos `<input type="number">` — uno de ellos
   para contestar *"¿cómo has dormido?"*, que en un iPhone abre el teclado
   numérico—. Ahora son cuatro bloques, se contesta a toques y se ve la duración
   mientras se elige la hora.

   ⚠️ **Y la ventana de la gráfica NO se toca**: el enunciado la manda a la fase
   siguiente con estas palabras — *"NO implementar todavía el cambio de ventana de
   7 días de la gráfica. Eso corresponde exclusivamente a la FASE 2 de Sueño."*
   Por eso `VENTANA_GRAFICA` es una constante con ese recordatorio al lado. */

/* 🚨 La gráfica enseña las últimas siete noches REGISTRADAS, que es lo que hacía
   antes de esta fase (`sueno.slice(-7)`). Lo que la Fase 2 va a cambiar es que
   sean los siete últimos **días de calendario**, con sus huecos. No tocar aquí. */
const VENTANA_GRAFICA = 7;

/* ── Un bloque del registro ────────────────────────────────────────────────── */
function BloqueRegistro({ emoji, icono: Icono, titulo, accent, children }) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-bold uppercase flex items-center gap-1.5" style={{ color: COLORS.textMuted, letterSpacing: '0.06em' }}>
        {Icono ? <Icono size={13} style={{ color: accent }} /> : emoji}
        {titulo}
      </p>
      {children}
    </div>
  );
}

/* ── Una opción que se toca ────────────────────────────────────────────────
   ⚠️ El estado seleccionado se nota (apartado 7) **con más de un color**: fondo,
   borde y peso de la letra. Es la regla de EH F42 — quien no distingue los
   colores tiene que poder ver cuál está elegida. */
function Opcion({ activa, onClick, accent, ancha = false, children, etiqueta }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={activa}
      aria-label={etiqueta}
      className={`toque-44 rounded-2xl px-3 py-2.5 text-sm transition-transform active:scale-95 ${ancha ? 'flex-1' : ''} ${activa ? 'font-bold' : 'font-medium'}`}
      style={{
        background: activa ? hexToRgba(accent, 0.16) : COLORS.surface2,
        color: activa ? accent : COLORS.textMuted,
        border: `1px solid ${activa ? hexToRgba(accent, 0.45) : COLORS.border}`,
      }}
    >
      {children}
    </button>
  );
}

function FormularioNoche({ accent, onGuardar, onCancelar }) {
  const [form, setForm] = useState({
    horaDormir: HORA_DORMIR_DEFECTO,
    horaDespertar: HORA_DESPERTAR_DEFECTO,
    /* 🚨 **Ninguna respuesta viene puesta.** Elegir por él una cara, un número de
       interrupciones o un «sí» a la siesta sería guardar algo que no ha dicho —
       es lo que HT F3, EH F28 y la E3 F19 llevan repitiendo. Solo las horas
       traen un valor de partida, porque son un selector de reloj: se ve desde el
       primer momento y él lo mueve. */
    calidadId: null,
    interrupciones: null,
    siestaAyer: null,
    siestaMinutos: '',
  });

  const duracion = textoDuracion(form);

  const guardar = () => {
    onGuardar(crearRegistroSueno({
      horaDormir: form.horaDormir,
      horaDespertar: form.horaDespertar,
      calidad: valorDeCalidad(form.calidadId),
      interrupciones: form.interrupciones,
      siestaAyer: form.siestaAyer === true,
      siestaMinutos: form.siestaAyer === true ? form.siestaMinutos : 0,
    }));
  };

  return (
    <Card>
      <div className="space-y-5">
        {/* 🌙 TU NOCHE — apartado 5 */}
        <BloqueRegistro icono={Moon} titulo="Tu noche" accent={accent}>
          <div className="flex items-end gap-3">
            <label className="flex-1">
              <span className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>Hora de dormir</span>
              <TextInput type="time" value={form.horaDormir} onChange={(e) => setForm({ ...form, horaDormir: e.target.value })} />
            </label>
            <label className="flex-1">
              <span className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>Hora de despertar</span>
              <TextInput type="time" value={form.horaDespertar} onChange={(e) => setForm({ ...form, horaDespertar: e.target.value })} />
            </label>
          </div>
          {/* ⚠️ La duración se ve MIENTRAS elige, no después de guardar. */}
          <div className="rounded-2xl px-4 py-3 text-center" style={{ background: hexToRgba(accent, 0.1), border: `1px solid ${hexToRgba(accent, 0.2)}` }}>
            <p className="text-xl font-extrabold" style={{ color: accent, fontFamily: "'Manrope', sans-serif" }}>{duracion || '—'}</p>
            <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>Duración</p>
          </div>
        </BloqueRegistro>

        {/* ¿Cómo has dormido? — apartado 2 */}
        <BloqueRegistro titulo={PREGUNTA_CALIDAD} accent={accent}>
          <div className="flex gap-2">
            {CALIDADES.map((c) => (
              <Opcion
                key={c.id}
                ancha
                activa={form.calidadId === c.id}
                onClick={() => setForm({ ...form, calidadId: form.calidadId === c.id ? null : c.id })}
                accent={accent}
                etiqueta={c.nombre}
              >
                <span className="block text-2xl leading-none mb-1">{c.emoji}</span>
                <span className="block text-xs">{c.nombre}</span>
              </Opcion>
            ))}
          </div>
        </BloqueRegistro>

        {/* 🌙 Durante la noche — apartado 3 */}
        <BloqueRegistro icono={Moon} titulo="Durante la noche" accent={accent}>
          <p className="text-xs -mt-1 mb-1" style={{ color: COLORS.textMuted }}>{PREGUNTA_INTERRUPCIONES}</p>
          <div className="flex gap-2">
            {INTERRUPCIONES.map((i) => (
              <Opcion
                key={i.valor}
                ancha
                activa={form.interrupciones === i.valor}
                onClick={() => setForm({ ...form, interrupciones: form.interrupciones === i.valor ? null : i.valor })}
                accent={accent}
                etiqueta={`${i.etiqueta} interrupciones`}
              >
                {i.etiqueta}
              </Opcion>
            ))}
          </div>
        </BloqueRegistro>

        {/* ☀️ Ayer — apartado 4 */}
        <BloqueRegistro icono={Sun} titulo="Ayer" accent={accent}>
          <p className="text-xs -mt-1 mb-1" style={{ color: COLORS.textMuted }}>{PREGUNTA_SIESTA}</p>
          <div className="flex gap-2">
            <Opcion ancha activa={form.siestaAyer === false} onClick={() => setForm({ ...form, siestaAyer: false, siestaMinutos: '' })} accent={accent} etiqueta="No dormí siesta">No</Opcion>
            <Opcion ancha activa={form.siestaAyer === true} onClick={() => setForm({ ...form, siestaAyer: true })} accent={accent} etiqueta="Sí dormí siesta">Sí</Opcion>
          </div>
          {/* ⚠️ Los minutos SOLO si dijo que sí (apartado 4): *"si selecciona sí,
              permitir posteriormente introducir la duración"*. La interfaz se
              queda compacta porque casi ningún día aparece. */}
          {form.siestaAyer === true && (
            <label className="block">
              <span className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>¿Cuántos minutos?</span>
              <TextInput
                type="number" min="0" max={MAX_SIESTA_MIN} inputMode="numeric" placeholder="30"
                value={form.siestaMinutos}
                onChange={(e) => setForm({ ...form, siestaMinutos: e.target.value })}
              />
            </label>
          )}
        </BloqueRegistro>

        <div className="flex gap-2">
          <div className="flex-1"><PrimaryButton accent={accent} onClick={guardar}>Guardar noche</PrimaryButton></div>
          <button onClick={onCancelar} className="toque-44 px-4 rounded-xl text-sm font-semibold" style={{ color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}>
            Cancelar
          </button>
        </div>
      </div>
    </Card>
  );
}

export default function SleepView({ sueno, onAdd, onDelete, accent, foco, onFocoConsumido }) {
  const [showForm, setShowForm] = useState(false);

  // Ampliación del Dashboard — Centro de Control: la acción rápida "+ Sueño" llega aquí como
  // `foco.accion === 'registrar'` — abre el mismo formulario de siempre, sin inventar uno nuevo.
  useEffect(() => {
    if (foco?.accion === 'registrar') {
      setShowForm(true);
      onFocoConsumido && onFocoConsumido();
    }
  }, [foco]);

  /* 🚨 La gráfica, la media y la lista son **exactamente** las de antes de esta
     fase (apartados 8 y 10). La media sale ahora de `mediaDeHoras`, que hace el
     mismo cálculo con el mismo filtro de noches incompletas — estaba escrito
     dentro de la vista y ahora se puede probar. */
  const ultimos = sueno.slice(-VENTANA_GRAFICA);
  const chartData = ultimos.map((e) => ({ fecha: formatFecha(e.fecha), horas: calcularDuracion(e.horaDormir, e.horaDespertar) }));
  const media = mediaDeHoras(ultimos);

  const handleGuardar = (registro) => {
    onAdd(registro);
    setShowForm(false);
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between gap-3">
        <SectionTitle sub={ultimos.length ? `Media últimos ${ultimos.length}: ${formatHoras(media)} h` : 'Todavía sin registros'}>Sueño</SectionTitle>
        <div style={{ width: 130 }}>
          <PrimaryButton accent={accent} onClick={() => setShowForm((s) => !s)}>Registrar</PrimaryButton>
        </div>
      </div>

      {showForm && <FormularioNoche accent={accent} onGuardar={handleGuardar} onCancelar={() => setShowForm(false)} />}

      {chartData.length > 1 && (
        <Card>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <CartesianGrid stroke={COLORS.border} vertical={false} />
              <XAxis dataKey="fecha" stroke={COLORS.textMuted} fontSize={11} />
              <YAxis stroke={COLORS.textMuted} fontSize={11} width={26} />
              <Tooltip contentStyle={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text }} />
              <Line type="monotone" dataKey="horas" stroke={accent} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {sueno.length === 0
        ? <EmptyHint text="Todavía no has registrado ninguna noche." />
        : (
          <ListCard>
            {[...sueno].reverse().slice(0, 6).map((e, i, arr) => {
              const r = resumenNoche(e);
              return (
                <ListRow key={e.id} last={i === arr.length - 1}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold min-w-0 truncate" style={{ color: COLORS.text }}>
                      {formatFecha(e.fecha)} · {r.duracion || '—'}
                    </p>
                    {r.extras && <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>{r.extras}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* ⚠️ La cara, no el número: es la misma respuesta que dio. Y si
                        aquella noche no contestó la calidad, no se pinta ninguna. */}
                    {r.calidad && <span className="text-base" title={r.calidad.nombre} aria-label={r.calidad.nombre}>{r.calidad.emoji}</span>}
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>{r.horas}</p>
                    <BotonBorrar onClick={() => onDelete(e.id)} label="Eliminar registro de sueño" />
                  </div>
                </ListRow>
              );
            })}
          </ListCard>
        )}

      <AIPanel
        label="Analizar mi sueño"
        accent={accent}
        buildPrompt={() => `Últimos registros de sueño de Josué (JSON): ${JSON.stringify(ultimos)}. Si hay suficientes datos, detecta un patrón simple; si no, dilo abiertamente. Da una recomendación breve.`}
      />
    </div>
  );
}
