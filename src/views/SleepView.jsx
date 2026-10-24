import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { useAnimacionDeGrafica } from '../components/motion';
import { Moon, Sun, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { COLORS } from '../tokens';
import { formatFecha, hexToRgba } from '../lib/helpers';
import {
  CALIDADES, PREGUNTA_CALIDAD, PREGUNTA_INTERRUPCIONES, PREGUNTA_SIESTA,
  INTERRUPCIONES, MAX_SIESTA_MIN, nocheTieneAlgo, horasQueFaltan, nochesPorFechaReciente,
  crearRegistroSueno, calidadDe, valorDeCalidad, textoDuracion, resumenNoche,
  /* Entrega 3 · F32 (SU F2) — la ventana móvil de 7 días de CALENDARIO. */
  DIAS_VENTANA, ventanaDeDias, puedeRetroceder, puedeAvanzar, tituloDeVentana,
  TITULO_ACTUAL, mediaMinutosDeVentana, textoMinutos, huecosDeVentana, nochesSinHorasDeVentana,
} from '../lib/sueno';
import { Card, ListCard, ListRow, BotonBorrar, SectionTitle, TextInput, PrimaryButton, EmptyHint } from '../components/ui';
import { dominioEstable } from '../lib/datosMotion';

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

/* 🚨 **Entrega 3 · F32 (SU F2) — SIETE DÍAS DE CALENDARIO, NO SIETE REGISTROS.**
   Hasta aquí la gráfica hacía `sueno.slice(-7)`, y eso es exactamente lo que el
   apartado 18 prohíbe: **si Josué no registraba tres días, la gráfica los
   sustituía por tres noches viejas** y parecía que había dormido todas. Ahora la
   ventana la manda la fecha del dispositivo (apartado 13) y un día sin registrar
   es un hueco (apartados 3 y 18). Toda la lógica está en `ventanaDeDias`. */
const VENTANA_GRAFICA = DIAS_VENTANA;

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
    /* 🚨 **Ninguna respuesta viene puesta.** Elegir por él una cara, un número de
       interrupciones o un «sí» a la siesta sería guardar algo que no ha dicho —
       es lo que HT F3, EH F28 y la E3 F19 llevan repitiendo.
       🐛 v3.161.3 — **y tampoco las horas.** Venían a 23:00 y 07:00 «porque son un reloj», y si no las
       tocaba se guardaba una noche de 8 h que no había dicho. Empiezan vacías; sin las dos, la noche se
       guarda con lo demás que conteste y su duración queda sin calcular (nunca a cero). */
    horaDormir: '',
    horaDespertar: '',
    calidadId: null,
    interrupciones: null,
    siestaAyer: null,
    siestaMinutos: '',
  });

  const duracion = textoDuracion(form);
  const [aviso, setAviso] = useState('');
  const faltan = horasQueFaltan(form);
  const unaSolaHora = faltan.length === 1;

  const guardar = () => {
    /* v3.161.3 — la siesta se guarda tal cual: `true`, `false` o `null` si no la contestó (antes
       `=== true` convertía «sin contestar» en «no»). */
    const registro = crearRegistroSueno({
      horaDormir: form.horaDormir,
      horaDespertar: form.horaDespertar,
      calidad: valorDeCalidad(form.calidadId),
      interrupciones: form.interrupciones,
      siestaAyer: form.siestaAyer,
      siestaMinutos: form.siestaAyer === true ? form.siestaMinutos : null,
    });
    if (!nocheTieneAlgo(registro)) {
      setAviso('Apunta al menos una cosa de esta noche: las horas, cómo dormiste, los despertares o la siesta.');
      return;
    }
    onGuardar(registro);
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
          {/* v3.161.3 — con una sola hora se guarda igual, y se dice que sin la otra no hay duración. */}
          {unaSolaHora && (
            <p role="status" className="text-xs" style={{ color: COLORS.textMuted }}>
              {faltan[0] === 'dormir' ? 'Falta la hora de dormir' : 'Falta la hora de despertar'}: sin ella no se puede calcular la duración de esta noche.
            </p>
          )}
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
            {/* v3.161.3 — tocar otra vez la elegida la quita (vuelve a «sin contestar»), como las demás. */}
            <Opcion ancha activa={form.siestaAyer === false} onClick={() => setForm({ ...form, siestaAyer: form.siestaAyer === false ? null : false, siestaMinutos: '' })} accent={accent} etiqueta="No dormí siesta">No</Opcion>
            <Opcion ancha activa={form.siestaAyer === true} onClick={() => setForm({ ...form, siestaAyer: form.siestaAyer === true ? null : true, siestaMinutos: form.siestaAyer === true ? '' : form.siestaMinutos })} accent={accent} etiqueta="Sí dormí siesta">Sí</Opcion>
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

        {aviso && <p role="alert" className="text-xs" style={{ color: COLORS.textMuted }}>{aviso}</p>}
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

export default function SleepView({ sueno, onAdd, onDelete, accent, foco, onFocoConsumido, onAnalizar = null }) {
  // MS F4 — la gráfica obedece al modo, a la velocidad y a «Reducir movimiento» (antes animaba
  // 1,5 s por su cuenta): `useAnimacionDeGrafica`. Arriba del todo, antes de cualquier `return`.
  const animGrafica = useAnimacionDeGrafica();
  const [showForm, setShowForm] = useState(false);

  // Ampliación del Dashboard — Centro de Control: la acción rápida "+ Sueño" llega aquí como
  // `foco.accion === 'registrar'` — abre el mismo formulario de siempre, sin inventar uno nuevo.
  useEffect(() => {
    if (foco?.accion === 'registrar') {
      setShowForm(true);
      onFocoConsumido && onFocoConsumido();
    }
  }, [foco]);

  /* 🚨 E3 F32 (SU F2) — la ventana móvil. `desplazamiento` es cuántos bloques de
     siete días ha retrocedido; 0 son *"Últimos 7 días"* (apartado 5). */
  const [desplazamiento, setDesplazamiento] = useState(0);
  const ventana = ventanaDeDias(sueno, { desplazamiento, dias: VENTANA_GRAFICA });
  /* ⚠️ Los puntos ya vienen con su etiqueta de fecha real (apartado 9) y con
     `horas: null` en los días sin registrar, que recharts pinta como un hueco:
     **no se rellena nada** (apartados 3 y 18). */
  const chartData = ventana.puntos.map((p) => ({ fecha: p.etiqueta, horas: p.horas, esHoy: p.esHoy }));
  /* MS F17, apartados 31 y 32 — un eje que no baila: de 0 a un múltiplo de dos horas, nunca por debajo
     de 10. Mover la ventana una semana interpola la línea sin cambiar la escala que la lee. */
  const dominioSueno = dominioEstable(chartData.map((p) => p.horas), { desdeCero: true, paso: 2, alMenos: 10 });
  /* La media se lee en horas y minutos exactos, la misma cuenta que el asistente (v3.161.2). */
  const media = mediaMinutosDeVentana(ventana);
  const huecos = huecosDeVentana(ventana);
  const sinHoras = nochesSinHorasDeVentana(ventana);
  const atras = puedeRetroceder(sueno, { desplazamiento, dias: VENTANA_GRAFICA });
  const adelante = puedeAvanzar(desplazamiento);

  /* ⚠️ Las noches de la lista de abajo siguen siendo las últimas REGISTRADAS: la
     ventana es de la gráfica, no del historial (apartado 12 — mover la ventana no
     esconde nada del resto de la aplicación). 🐛 v3.161.3 — y «últimas» por su FECHA, no por el orden
     en que se guardaron (`[...sueno].reverse()` ponía primera una noche vieja apuntada hoy). */
  const ultimas = nochesPorFechaReciente(sueno).slice(0, 6);

  const handleGuardar = (registro) => {
    onAdd(registro);
    setShowForm(false);
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between gap-3">
        {/* 🐛 E3 F32 — antes esto decía *"Media últimos 7: X h"*. Con la ventana
            móvil ese número pasó a ser el de la ventana **que esté mirando**, así
            que al retroceder una semana la cabecera cambiaba con ella: el título
            de la pantalla acabaría diciendo la media de agosto. La media vive
            ahora dentro de la tarjeta de la gráfica, que es de quien es; aquí se
            dice cuántas noches lleva, que no depende de dónde esté mirando. */}
        <SectionTitle sub={sueno.length ? `${sueno.length} ${sueno.length === 1 ? 'noche registrada' : 'noches registradas'}` : 'Todavía sin registros'}>Sueño</SectionTitle>
        <div style={{ width: 130 }}>
          <PrimaryButton accent={accent} onClick={() => setShowForm((s) => !s)}>Registrar</PrimaryButton>
        </div>
      </div>

      {showForm && <FormularioNoche accent={accent} onGuardar={handleGuardar} onCancelar={() => setShowForm(false)} />}

      {chartData.length > 0 && (
        <Card>
          {/* Apartado 11 — *"‹ Últimos 7 días ›"*, y ni un control más. */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <button
              onClick={() => setDesplazamiento((d) => d + 1)}
              disabled={!atras}
              aria-label="Semana anterior"
              className="toque-44 p-1.5 -m-1.5 rounded-xl"
              style={{ color: atras ? COLORS.text : COLORS.border }}
            >
              <ChevronLeft size={18} />
            </button>
            <p className="text-xs font-bold uppercase" style={{ color: COLORS.textMuted, letterSpacing: '0.06em' }}>
              {tituloDeVentana(ventana)}
            </p>
            <button
              onClick={() => setDesplazamiento((d) => Math.max(0, d - 1))}
              disabled={!adelante}
              aria-label="Semana siguiente"
              className="toque-44 p-1.5 -m-1.5 rounded-xl"
              style={{ color: adelante ? COLORS.text : COLORS.border }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <CartesianGrid stroke={COLORS.border} vertical={false} />
              {/* ⚠️ Apartado 9 — fechas de verdad («L 24 · M 25»), nunca «1 2 3». */}
              <XAxis dataKey="fecha" stroke={COLORS.textMuted} fontSize={11} interval={0} />
              <YAxis stroke={COLORS.textMuted} fontSize={11} width={26} domain={dominioSueno} />
              <Tooltip contentStyle={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text }} isAnimationActive={animGrafica.tooltip.isAnimationActive} animationDuration={animGrafica.tooltip.animationDuration} animationEasing={animGrafica.tooltip.animationEasing} />
              {/* 🚨 `connectNulls` NO se activa: un día sin registrar tiene que
                  verse como un hueco, no como una línea recta que lo cruza — sería
                  el dato inventado que prohíben los apartados 3 y 18. */}
              <Line type="monotone" dataKey="horas" stroke={accent} strokeWidth={2.5} dot={{ r: 3 }} connectNulls={false} isAnimationActive={animGrafica.linea.isAnimationActive} animationBegin={animGrafica.linea.animationBegin} animationDuration={animGrafica.linea.animationDuration} animationEasing={animGrafica.linea.animationEasing} />
            </LineChart>
          </ResponsiveContainer>

          {/* Apartado 10 — dónde está HOY dentro de los siete días. */}
          <div className="flex items-center justify-between gap-2 mt-1 text-xs" style={{ color: COLORS.textMuted }}>
            <span>
              {ventana.puntos.some((p) => p.esHoy) ? 'HOY es el último punto' : `${ventana.inicio.slice(8)} → ${ventana.fin.slice(8)}`}
            </span>
            <span>{media === null ? 'Sin noches registradas' : `Media ${textoMinutos(media)}`}</span>
          </div>
          {/* ⚠️ *"Los días sin registro no generen datos falsos"*, dicho también
              con palabras: si hay huecos, se cuentan. */}
          {huecos > 0 && (
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
              {huecos === 1 ? '1 noche sin registrar en este periodo' : `${huecos} noches sin registrar en este periodo`}
            </p>
          )}
          {sinHoras > 0 && (
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
              {sinHoras === 1 ? '1 noche sin las dos horas: no cuenta en la media' : `${sinHoras} noches sin las dos horas: no cuentan en la media`}
            </p>
          )}
          {!ventana.esActual && (
            <button
              onClick={() => setDesplazamiento(0)}
              className="text-xs font-semibold mt-2 toque-44"
              style={{ color: accent }}
            >
              {TITULO_ACTUAL} →
            </button>
          )}
        </Card>
      )}

      {sueno.length === 0
        ? <EmptyHint text="Todavía no has registrado ninguna noche." />
        : (
          <ListCard>
            {ultimas.map((e, i, arr) => {
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

      {/* 🔁 v3.161.3 — «Analizar mi sueño» ya no es un panel de IA que decía «próximamente»: abre el
          asistente de Sueño con esa pregunta hecha. La primera respuesta sale de sus noches de verdad
          (las últimas registradas, con lo que falta) y la conversación sigue desde ahí. Sin IA (DA-09). */}
      {onAnalizar && (
        <button type="button" onClick={onAnalizar}
          className="w-full rounded-2xl p-4 flex items-center gap-2 text-sm font-semibold text-left active:scale-[0.98]"
          style={{ color: accent, background: hexToRgba(accent, 0.08), border: `1px solid ${hexToRgba(accent, 0.25)}` }}>
          <MessageCircle size={16} aria-hidden="true" />
          <span className="flex-1">Analizar mi sueño</span>
          <span className="text-xs font-normal" style={{ color: COLORS.textMuted }}>Con el asistente</span>
        </button>
      )}
    </div>
  );
}
