/* ===========================================================================
   ENTREGA 4 · FASE 8/45 — LA FINALIZACIÓN, LA PANTALLA

   El criterio de finalización: *"Empezar entrenamiento → entrenar → Terminar →
   revisar resumen → modificar nombre/notas → guardar → cerrar aplicación →
   volver y encontrar la sesión correctamente guardada."*

   🚨 **ESTA PANTALLA NO CALCULA NADA.** El resumen, las cuentas de series, el
   volumen, el estado de cada ejercicio, el nombre por defecto y qué pasa al
   guardar salen de `src/lib/finalizacion.js`. Aquí solo se pinta y se llama.

   🚨 **Y NO VUELVE A REGISTRAR NADA** (apartado 3 del contexto: *"No dupliques
   la lógica de registro de series"*). Lo que hay es lo que la F7 guardó; esta
   pantalla lo **lee**, y lo único que se puede cambiar aquí son el nombre, la
   nota general y la visibilidad.

   ⚠️ **El estado de guardado es de la pantalla** (EH F40): `guardando` dura lo
   que dura la escritura. Lo que se guarda es la sesión.
   =========================================================================== */

import React, { useState, useMemo } from 'react';
import {
  Check, ChevronRight, X, Trash2, Clock, Dumbbell, Calendar, StickyNote,
} from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import {
  Card, SectionTitle, GhostBtn, PrimaryButton, TextInput, Textarea, Field,
} from '../components/ui';
import { VISIBILIDADES } from '../lib/fitness';
import {
  resumenDeSesion, pantallaDeExito, guardarEntrenamiento, descartarEntrenamiento,
  AVISO_SIN_SERIES, AVISO_DESCARTAR_FINAL, TEXTO_GUARDANDO, MEDIA_PENDIENTE,
} from '../lib/finalizacion';

/* ── Un dato del resumen (apartados 2, 4, 5 y 6) ──────────────────────────── */
export function DatoResumen({ icono: Icono, etiqueta, valor, accent }) {
  if (!valor) return null;
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: hexToRgba(accent, 0.14), color: accent }}
      >
        <Icono size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
          {etiqueta}
        </p>
        <p className="text-sm font-bold truncate" style={{ color: COLORS.text }}>{valor}</p>
      </div>
    </div>
  );
}

/* ── La fila de un ejercicio (apartados 7, 10 y 12) ────────────────────────
   ⚠️ El estado lleva **icono y palabra**, nunca solo color (EH F42). */
export function FilaEjercicioFinal({ ejercicio, accent }) {
  const e = ejercicio;
  const hecho = e.estado === 'realizado';
  const nada = e.estado === 'no_realizado';
  const color = nada ? COLORS.textMuted : accent;
  const detalle = [
    e.modo === 'tiempo' ? (e.duracion && `${e.duracion} s`) : (e.reps && `${e.reps} reps`),
    e.peso && `${e.peso} kg`,
  ].filter(Boolean).join(' · ');

  return (
    <div className="flex items-start gap-2.5 py-2">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: hexToRgba(color, nada ? 0.1 : 0.16), color }}
      >
        {hecho ? <Check size={14} /> : <Dumbbell size={13} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold truncate" style={{ color: nada ? COLORS.textMuted : COLORS.text }}>
          {e.nombre}
        </p>
        <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
          {/* 🚨 Apartado 10: sin ninguna serie hecha es «No realizado», y estar
              en el plan no cuenta. Con algunas, «2/3 series». */}
          {nada ? 'No realizado' : [e.texto, detalle].filter(Boolean).join(' · ')}
          {e.omitidas > 0 && ` · ${e.omitidas} omitida${e.omitidas === 1 ? '' : 's'}`}
        </p>
        {/* Apartado 12 — los DOS ejercicios cuando hubo sustitución. */}
        {e.sustituido && (
          <p className="text-[11px]" style={{ color: COLORS.warning }}>
            En lugar de {e.original}
          </p>
        )}
        {e.notas && (
          <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>📝 {e.notas}</p>
        )}
      </div>
    </div>
  );
}

/* ── La pantalla de éxito (apartados 19 y 20) ──────────────────────────────
   *"Priorizar: sensación de finalización, datos importantes, siguiente acción."*
   ⚠️ Y **sin confeti ni gamificación** (apartado 31): una marca, dos cifras y
   una frase corta de una tabla por umbrales, sin azar y sin juicio. */
export function PantallaExito({ datos, accent, onVer, onVolver }) {
  if (!datos) return null;
  return (
    <div className="space-y-4">
      <Card style={{ border: `1px solid ${accent}` }}>
        <div className="py-5 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 exito-entra"
            style={{ background: hexToRgba(accent, 0.16), color: accent }}
          >
            <Check size={32} />
          </div>
          <p className="text-xl font-extrabold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
            {datos.titulo}
          </p>
          <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>{datos.nombre}</p>

          <div className="flex items-center justify-center gap-6 mt-4">
            <div>
              <p className="text-2xl font-extrabold" style={{ color: accent, fontFamily: "'Manrope', sans-serif" }}>
                {datos.duracion}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
                Duración
              </p>
            </div>
            <div>
              <p className="text-2xl font-extrabold" style={{ color: accent, fontFamily: "'Manrope', sans-serif" }}>
                {datos.series}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
                {datos.series === 1 ? 'Serie' : 'Series'}
              </p>
            </div>
          </div>

          <p className="text-xs mt-3" style={{ color: COLORS.textMuted }}>{datos.mensaje}</p>
        </div>
      </Card>

      <div className="flex gap-2 flex-wrap">
        {onVer && (
          <PrimaryButton accent={accent} icon={ChevronRight} onClick={onVer}>Ver entrenamiento</PrimaryButton>
        )}
        {onVolver && <GhostBtn icon={ChevronRight} onClick={onVolver}>Volver a Tu Plan</GhostBtn>}
      </div>
    </div>
  );
}

/* ── El resumen, de solo lectura ──────────────────────────────────────────
   Se usa en la finalización y, con `soloLectura`, para ver una sesión ya
   guardada (apartado 20: *"Ver entrenamiento"*). */
export function ResumenSesion({ resumen, accent }) {
  if (!resumen) return null;
  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <DatoResumen icono={Calendar} etiqueta="Fecha" valor={resumen.fechaTexto} accent={accent} />
          <DatoResumen icono={Clock} etiqueta="Horario" valor={resumen.franja} accent={accent} />
          <DatoResumen icono={Clock} etiqueta="Duración" valor={resumen.duracion} accent={accent} />
          <DatoResumen icono={Dumbbell} etiqueta="Series" valor={resumen.seriesTexto} accent={accent} />
        </div>

        {/* Apartado 6 — las omitidas, solo si las hay. */}
        {resumen.seriesOmitidas > 0 && (
          <p className="text-xs mt-3 pt-3" style={{ color: COLORS.textMuted, borderTop: `1px solid ${COLORS.border}` }}>
            {resumen.seriesOmitidas} {resumen.seriesOmitidas === 1 ? 'serie omitida' : 'series omitidas'}
            {resumen.seriesAnadidas > 0 && ` · ${resumen.seriesAnadidas} añadida${resumen.seriesAnadidas === 1 ? '' : 's'}`}
          </p>
        )}
        {resumen.seriesOmitidas === 0 && resumen.seriesAnadidas > 0 && (
          <p className="text-xs mt-3 pt-3" style={{ color: COLORS.textMuted, borderTop: `1px solid ${COLORS.border}` }}>
            {resumen.seriesAnadidas} {resumen.seriesAnadidas === 1 ? 'serie añadida' : 'series añadidas'}
          </p>
        )}

        {/* 🚨 Apartado 9 — el volumen SOLO si se puede calcular, y diciendo
            cuántas series quedan fuera: sin eso, el número parecería el total. */}
        {resumen.volumen && (
          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
            <p className="text-sm font-bold" style={{ color: COLORS.text }}>
              Volumen {resumen.volumen.texto}
            </p>
            <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
              {resumen.volumen.parcial
                ? `De ${resumen.volumen.series} ${resumen.volumen.series === 1 ? 'serie' : 'series'} con peso. Las de peso corporal no se cuentan.`
                : 'Peso × repeticiones de las series completadas.'}
            </p>
          </div>
        )}
      </Card>

      <div>
        <SectionTitle sub="Lo que hiciste de verdad, ejercicio a ejercicio">Ejercicios</SectionTitle>
        <Card>
          <div className="divide-y" style={{ borderColor: COLORS.border }}>
            {resumen.ejercicios.map((e) => (
              <FilaEjercicioFinal key={e.id} ejercicio={e} accent={accent} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LA PANTALLA
   ═══════════════════════════════════════════════════════════════════════════ */
export default function FinalizacionView({
  sesion, propios = [], accent,
  onGuardar, onDescartar, onSeguir = null, onVolver = null,
}) {
  const resumen = useMemo(() => resumenDeSesion(sesion, { propios }), [sesion, propios]);
  const [nombre, setNombre] = useState(() => (resumen ? resumen.nombre : ''));
  const [notas, setNotas] = useState(() => (resumen ? resumen.notas : ''));
  const [aviso, setAviso] = useState(null); // 'vacio' | 'descartar'
  const [guardando, setGuardando] = useState(false);
  const [guardada, setGuardada] = useState(null);

  if (!resumen) return null;

  /* 🚨 Apartado 19 — cuando ya está guardada, la pantalla de éxito. */
  if (guardada) {
    return (
      <PantallaExito
        datos={pantallaDeExito(guardada, { propios })}
        accent={accent}
        onVer={onVolver ? () => onVolver('ver') : null}
        onVolver={onVolver ? () => onVolver('plan') : null}
      />
    );
  }

  /* 🚨 Apartados 17 y 18 — idempotente **y** con estado de carga: mientras
     guarda, el botón no está, así que no se puede pulsar dos veces. Y la
     idempotencia no depende de eso: `guardarEntrenamiento` devuelve la misma
     sesión si ya estaba completada. */
  const guardar = (confirmado = false) => {
    if (guardando) return;
    const r = guardarEntrenamiento(sesion, { nombre, notas, confirmado });
    if (!r.ok && r.motivo === 'vacio') { setAviso('vacio'); return; }
    if (!r.ok) return;
    setAviso(null);
    setGuardando(true);
    onGuardar(r.sesion);
    setGuardada(r.sesion);
    setGuardando(false);
  };

  return (
    <div className="space-y-4 pb-6">
      <div>
        <SectionTitle sub="Revisa lo que has hecho antes de guardarlo">
          ¡Entrenamiento completado!
        </SectionTitle>
      </div>

      {/* Apartado 3 — el nombre, editable. */}
      <Card>
        <Field label="Nombre del entrenamiento">
          <TextInput
            value={nombre}
            onChange={(ev) => setNombre(ev.target.value)}
            placeholder={resumen.nombre}
            aria-label="Nombre del entrenamiento"
          />
        </Field>
      </Card>

      <ResumenSesion resumen={resumen} accent={accent} />

      {/* Apartado 13 — la nota general, opcional. */}
      <Card>
        <Field label="Notas del entrenamiento">
          <Textarea
            value={notas}
            onChange={(ev) => setNotas(ev.target.value)}
            placeholder="Buen entrenamiento. Me noté fuerte en los presses."
            aria-label="Notas del entrenamiento"
            rows={3}
          />
        </Field>
        <p className="text-[11px] mt-1.5" style={{ color: COLORS.textMuted }}>
          Es opcional. Las notas que escribiste en cada ejercicio se guardan igual.
        </p>
      </Card>

      {/* Apartado 15 — la visibilidad. ⚠️ Solo hay una, así que se DICE en vez
          de pintar un selector con dos opciones que no hacen nada (regla 8). */}
      <p className="text-[11px] px-1" style={{ color: COLORS.textMuted }}>
        🔒 {VISIBILIDADES.find((v) => v.id === 'privado').nombre}: solo lo ves tú.
      </p>
      {/* 🚨 Apartado 14 — y ni un botón de foto o vídeo: no hay dónde guardarla,
          y uno que falla en silencio es peor que no tenerlo. Se dice. */}
      <p className="text-[11px] px-1" style={{ color: COLORS.textMuted }}>
        {MEDIA_PENDIENTE.que} Todavía no se puede: {MEDIA_PENDIENTE.porQueNoHayBoton.toLowerCase()}
      </p>

      {/* Apartado 26 — el aviso de que no completó ninguna serie. */}
      {aviso === 'vacio' && (
        <Card style={{ border: `1px solid ${COLORS.warning}` }}>
          <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
            {AVISO_SIN_SERIES.titulo}
          </p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{AVISO_SIN_SERIES.texto}</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {onSeguir && (
              <PrimaryButton accent={accent} onClick={onSeguir}>{AVISO_SIN_SERIES.seguir}</PrimaryButton>
            )}
            <GhostBtn onClick={() => guardar(true)}>{AVISO_SIN_SERIES.guardar}</GhostBtn>
          </div>
        </Card>
      )}

      {/* Apartado 27 — descartar, con su confirmación. */}
      {aviso === 'descartar' && (
        <Card style={{ border: `1px solid ${COLORS.negative}` }}>
          <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
            {AVISO_DESCARTAR_FINAL.titulo}
          </p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{AVISO_DESCARTAR_FINAL.texto}</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <GhostBtn onClick={() => setAviso(null)}>{AVISO_DESCARTAR_FINAL.cancelar}</GhostBtn>
            <button
              onClick={() => {
                const r = descartarEntrenamiento(sesion, { confirmado: true });
                if (r.ok) onDescartar(r.sesion);
              }}
              aria-label="Confirmar descartar el entrenamiento"
              className="h-10 px-3.5 rounded-xl text-sm font-bold toque-44 active:scale-95"
              style={{ background: hexToRgba(COLORS.negative, 0.16), color: COLORS.negative }}
            >
              {AVISO_DESCARTAR_FINAL.descartar}
            </button>
          </div>
        </Card>
      )}

      {/* Apartado 16 — el CTA principal, claramente identificable (apartado 32). */}
      <div className="flex gap-2 flex-wrap">
        {guardando ? (
          <p className="text-sm font-bold" style={{ color: accent }}>{TEXTO_GUARDANDO}</p>
        ) : (
          <>
            <PrimaryButton accent={accent} icon={Check} onClick={() => guardar(false)}>
              Terminar entrenamiento
            </PrimaryButton>
            {onSeguir && <GhostBtn icon={Dumbbell} onClick={onSeguir}>Seguir entrenando</GhostBtn>}
            {aviso !== 'descartar' && (
              <GhostBtn icon={Trash2} onClick={() => setAviso('descartar')}>Descartar</GhostBtn>
            )}
          </>
        )}
      </div>
    </div>
  );
}
