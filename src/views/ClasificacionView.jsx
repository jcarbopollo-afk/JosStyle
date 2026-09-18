/* ===========================================================================
   ENTREGA 4 · FASE 17/45 — CLASIFICAR EJERCICIOS, LA PANTALLA

   *"El flujo debe ser rápido. Una pregunta por pantalla."* (apartado 19).

   🚨 **Aquí no se decide nada**: qué ejercicios se preguntan, qué pregunta le
   toca a cada uno y cuánto puntúa cada respuesta lo dice `clasificacion.js`
   (apartado 30). Esta pantalla enseña, recoge el toque y guarda.

   🚨 **Y no se finge precisión** (apartado 7): al terminar una pregunta se
   enseña el **nivel estimado** con su hexágono, nunca «tu puntuación es 638»,
   y siempre acompañado de que los entrenamientos lo van a sustituir.

   ⚠️ **Cada respuesta se guarda al contestarla.** Por eso salir a mitad no
   pierde nada y el aviso de salida puede decir la verdad (apartados 9, 23
   y 24): lo guardado ES el progreso, no hay un puntero aparte.
   =========================================================================== */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, Check, X } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { Card, SectionTitle, GhostBtn, PrimaryButton, EmptyHint } from '../components/ui';
import { RankBadge, RankLabel } from '../components/rangos';
import { iconoDeGrupo } from '../components/iconosFitness';
import { nivelRango } from '../lib/fitness';
import { ejercicioPorId } from '../lib/ejercicios';
import {
  cuestionario, preguntaDeEjercicio, clasificarEjercicio, estadoDeClasificacion,
  musculosQueRecibe, resumenFinal, AVISO_ESTIMACION, AVISO_RECLASIFICAR,
} from '../lib/clasificacion';

/* ── 22 · El progreso del cuestionario ───────────────────────────────────── */
/* ⚠️ *"La barra representa progreso del cuestionario. NO representa progreso
   físico"*. Por eso lleva el número al lado y la palabra «preguntas». */
export function ClassificationProgress({ posicion, total, fraccion, accent }) {
  const pct = Math.max(0, Math.min(100, Math.round((Number(fraccion) || 0) * 100)));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
          Pregunta {posicion} de {total}
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: hexToRgba(COLORS.border, 0.6) }}
        role="img"
        aria-label={`Cuestionario: ${pct} % respondido`}
      >
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: accent }} />
      </div>
    </div>
  );
}

/* ── 20 y 32 · Una opción ────────────────────────────────────────────────── */
/* Grande, con su marca de selección **además** del color (apartado 32). */
export function ClassificationOption({ opcion, elegida, accent, onElegir }) {
  return (
    <button
      onClick={() => onElegir(opcion.id)}
      aria-pressed={elegida}
      className="w-full text-left rounded-2xl px-4 py-3.5 flex items-center gap-3 toque-44 active:scale-[0.99] transition-transform"
      style={{
        background: elegida ? hexToRgba(accent, 0.14) : COLORS.surface,
        border: `1px solid ${elegida ? accent : COLORS.border}`,
      }}
    >
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
        style={{ background: elegida ? accent : 'transparent', border: `1px solid ${elegida ? accent : COLORS.border}` }}
      >
        {elegida && <Check size={12} style={{ color: COLORS.textOnAccent }} aria-hidden="true" />}
      </span>
      <span className="text-sm font-semibold" style={{ color: COLORS.text }}>{opcion.texto}</span>
    </button>
  );
}

/* ── 19 y 21 · La pregunta de un ejercicio ───────────────────────────────── */
export function ClassificationQuestion({ ejercicio, pregunta, elegida, accent, onElegir }) {
  const Icono = iconoDeGrupo(pregunta.grupoPrincipal || 'brazos');
  return (
    <Card>
      <div className="flex items-start gap-3">
        {/* Apartado 21 — *"no inventar imágenes"*: el catálogo no tiene fotos, así
            que va el icono de su grupo, que es un recurso real. */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: hexToRgba(accent, 0.14), color: accent }}
        >
          <Icono size={22} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-base font-extrabold leading-tight" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
            {ejercicio.nombre}
          </p>
          <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
            {[ejercicio.categoria, ejercicio.variante].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      <p className="text-sm font-semibold mt-4" style={{ color: COLORS.text }}>{pregunta.texto}</p>
      {pregunta.ayuda && <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{pregunta.ayuda}</p>}

      <div className="space-y-2 mt-3">
        {pregunta.opciones.map((o) => (
          <ClassificationOption key={o.id} opcion={o} elegida={elegida === o.id} accent={accent} onElegir={onElegir} />
        ))}
      </div>
    </Card>
  );
}

/* ── 8 · El nivel estimado ───────────────────────────────────────────────── */
/* 🚨 *"NO mostrar: Tu score exacto es 638"*. Se enseña el nivel y se dice que
   es una estimación que los entrenamientos van a corregir. */
export function ClassificationResult({ clasificacion, musculos = [], accent, onContinuar, ultima = false }) {
  const nivel = clasificacion ? nivelRango(clasificacion.rango) : null;
  return (
    <Card>
      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Nivel estimado</p>
      <div className="flex items-center gap-4 mt-3">
        <RankBadge rank={clasificacion?.rango ?? null} size="lg" state="actual" accent={accent} />
        <div className="min-w-0">
          <p className="text-xl font-extrabold" style={{ color: accent, fontFamily: "'Manrope', sans-serif" }}>
            {nivel ? nivel.nombre : '—'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{AVISO_ESTIMACION}</p>
        </div>
      </div>
      {musculos.length > 0 && (
        <p className="text-[11px] mt-3 pt-3" style={{ color: COLORS.textMuted, borderTop: `1px solid ${COLORS.border}` }}>
          Información nueva para {musculos.map((m) => m.nombre).join(', ')}.
        </p>
      )}
      <div className="mt-4">
        <PrimaryButton onClick={onContinuar} accent={accent}>{ultima ? 'Ver el resumen' : 'Continuar'}</PrimaryButton>
      </div>
    </Card>
  );
}

/* ── 23 · Salir ──────────────────────────────────────────────────────────── */
export function ClassificationExitDialog({ accent, onSeguir, onSalir }) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-3 pb-3 sm:pb-0"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onSeguir}
      role="dialog"
      aria-modal="true"
      aria-label="Salir de la clasificación"
    >
      <div
        className="w-full max-w-sm rounded-3xl p-5 space-y-4"
        style={{ background: COLORS.surface, paddingBottom: 'calc(var(--safe-bottom) + 1.25rem)' }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <div>
          <p className="text-base font-extrabold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
            ¿Salir de la clasificación?
          </p>
          {/* ⚠️ Y es verdad: cada respuesta se guarda al contestarla. */}
          <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>
            Lo que has respondido ya está guardado. Puedes seguir cuando quieras.
          </p>
        </div>
        <div className="flex gap-2">
          <PrimaryButton onClick={onSeguir} accent={accent}>Continuar</PrimaryButton>
          <GhostBtn onClick={onSalir}>Salir</GhostBtn>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ── 11 · Reclasificar ───────────────────────────────────────────────────── */
export function AvisoReclasificar({ accent, onConfirmar, onCancelar }) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-3 pb-3 sm:pb-0"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onCancelar}
      role="dialog"
      aria-modal="true"
      aria-label="Reclasificar ejercicio"
    >
      <div
        className="w-full max-w-sm rounded-3xl p-5 space-y-4"
        style={{ background: COLORS.surface, paddingBottom: 'calc(var(--safe-bottom) + 1.25rem)' }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <p className="text-base font-extrabold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>Reclasificar</p>
        <p className="text-sm" style={{ color: COLORS.textMuted }}>{AVISO_RECLASIFICAR}</p>
        <div className="flex gap-2">
          <PrimaryButton onClick={onConfirmar} accent={accent}>Reclasificar</PrimaryButton>
          <GhostBtn onClick={onCancelar}>Cancelar</GhostBtn>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ── 25 · El final ───────────────────────────────────────────────────────── */
export function ClassificationSummary({ resumen, accent, onVerRangos, onSeguir }) {
  return (
    <Card>
      <p className="text-lg font-extrabold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
        Clasificación completada
      </p>
      <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>{resumen.texto}</p>
      <div className="mt-4 flex flex-col gap-2">
        <PrimaryButton onClick={onVerRangos} accent={accent}>Ver mis rangos</PrimaryButton>
        {onSeguir && <GhostBtn onClick={onSeguir}>Clasificar más ejercicios</GhostBtn>}
      </div>
    </Card>
  );
}

/* ── El flujo ────────────────────────────────────────────────────────────── */
export default function ClasificacionView({
  fitness = null, propios = [], perfil = null, accent,
  onGuardarFitness = null, onVolver = null,
}) {
  const f = fitness || {};
  /* ⚠️ Nada de esto es un dato: es dónde está en el cuestionario (EH F40). */
  const [elegida, setElegida] = useState(null);
  const [hecha, setHecha] = useState(null);      // la clasificación recién guardada
  const [saliendo, setSaliendo] = useState(false);
  const [reclasificando, setReclasificando] = useState(null);
  const [terminado, setTerminado] = useState(false);
  const [error, setError] = useState(null);

  const estado = cuestionario(f, { propios });
  const actual = estado.pendientes[0] || null;
  const pregunta = actual ? preguntaDeEjercicio(actual, { perfil }) : null;
  const resumen = resumenFinal(f, { propios });

  const responder = (opcionId) => {
    setElegida(opcionId);
    setError(null);
    if (!onGuardarFitness || !actual) return;
    const r = clasificarEjercicio(f, actual.id, opcionId, { propios, perfil });
    if (!r.ok) {
      /* «No lo sé» no clasifica: se pasa al siguiente sin inventar un peso
         (apartado 14), y se dice por qué. */
      setError(r.error);
      setHecha({ omitido: true, exerciseId: actual.id });
      return;
    }
    onGuardarFitness(r.fitness);
    setHecha(r.clasificacion);
  };

  const siguiente = () => {
    setHecha(null);
    setElegida(null);
    setError(null);
    /* Si era el último, el resumen del apartado 25. */
    if (estado.restantes <= 1) setTerminado(true);
  };

  const cabecera = (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <h2 className="text-xl font-extrabold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          Clasifica tus ejercicios
        </h2>
        <p className="text-xs" style={{ color: COLORS.textMuted }}>
          Responde unas preguntas rápidas para estimar tu nivel inicial.
        </p>
      </div>
      <button
        /* 🐛 Aparecía solo con una respuesta a medias, y como cada respuesta se
           guarda al instante eso no pasaba NUNCA: se salía sin decir nada. El
           apartado 23 quiere justo lo contrario —que se le diga que su progreso
           está guardado—, así que se pregunta cuando hay algo contestado. */
        onClick={() => (hecha || elegida || estado.hechos > 0 ? setSaliendo(true) : onVolver && onVolver())}
        className="p-2 rounded-full shrink-0 toque-44"
        style={{ background: COLORS.surface2 }}
        aria-label="Salir de la clasificación"
      >
        <X size={16} style={{ color: COLORS.text }} />
      </button>
    </div>
  );

  /* Apartado 34 — sin ejercicios que clasificar, se dice; no una pantalla en
     blanco ni una pregunta inventada. */
  if (!actual || terminado) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {cabecera}
        {resumen.ejercicios > 0 ? (
          <ClassificationSummary
            resumen={resumen}
            accent={accent}
            onVerRangos={onVolver}
            onSeguir={actual ? () => setTerminado(false) : null}
          />
        ) : (
          <Card>
            <EmptyHint text="No queda nada que estimar: los ejercicios que puedes clasificar ya tienen entrenamientos de verdad detrás." />
            <div className="mt-3">
              <GhostBtn icon={ChevronLeft} onClick={onVolver}>Volver a Rangos</GhostBtn>
            </div>
          </Card>
        )}
        {resumen.ejercicios > 0 && (
          <YaClasificados fitness={f} propios={propios} accent={accent} onReclasificar={setReclasificando} />
        )}
        {reclasificando && (
          <AvisoReclasificar
            accent={accent}
            onCancelar={() => setReclasificando(null)}
            onConfirmar={() => {
              /* La estimación se quita y el ejercicio vuelve a la cola: así se
                 contesta otra vez con la misma pregunta de siempre. */
              if (onGuardarFitness) {
                onGuardarFitness({
                  ...f,
                  clasificaciones: (f.clasificaciones || []).filter((c) => c && c.exerciseId !== reclasificando),
                });
              }
              setReclasificando(null);
              setTerminado(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {cabecera}
      <ClassificationProgress posicion={estado.posicion} total={estado.total} fraccion={estado.fraccion} accent={accent} />

      {hecha && !hecha.omitido ? (
        <ClassificationResult
          clasificacion={hecha}
          musculos={musculosQueRecibe(hecha.exerciseId, { propios })}
          accent={accent}
          ultima={estado.restantes <= 1}
          onContinuar={siguiente}
        />
      ) : (
        <>
          <ClassificationQuestion
            ejercicio={actual}
            pregunta={{ ...pregunta, grupoPrincipal: (musculosQueRecibe(actual.id, { propios })[0] || {}).grupoId }}
            elegida={elegida}
            accent={accent}
            onElegir={responder}
          />
          {error && (
            <Card>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>{error}</p>
              <div className="mt-2">
                <GhostBtn onClick={siguiente}>Saltar este ejercicio</GhostBtn>
              </div>
            </Card>
          )}
        </>
      )}

      {saliendo && (
        <ClassificationExitDialog
          accent={accent}
          onSeguir={() => setSaliendo(false)}
          onSalir={() => { setSaliendo(false); if (onVolver) onVolver(); }}
        />
      )}
    </div>
  );
}

/* ── 10 · Lo ya clasificado ──────────────────────────────────────────────── */
/* *"Si un ejercicio ya fue clasificado: no volver a preguntarlo
   automáticamente"*, pero sí poder cambiarlo. ⚠️ Y se dice cuando un
   entrenamiento real ya ha tomado el relevo: esa estimación ya no manda. */
export function YaClasificados({ fitness, propios = [], accent, onReclasificar = null }) {
  const clasificaciones = (fitness?.clasificaciones) || [];
  if (!clasificaciones.length) return null;
  return (
    <div>
      <SectionTitle sub="Puedes cambiar tu estimación cuando quieras">Ya clasificados</SectionTitle>
      <div className="space-y-2">
        {clasificaciones.map((c) => {
          const e = estadoDeClasificacion(fitness, c.exerciseId, { propios });
          /* ⚠️ Del catálogo entero, no solo de los suyos: casi todo lo que se
             clasifica es del catálogo de siempre. */
          const ej = ejercicioPorId(c.exerciseId, propios || []);
          return (
            <div
              key={c.id}
              className="rounded-2xl p-3.5 flex items-center gap-3"
              style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
            >
              <RankBadge rank={c.rango} size="sm" state="actual" accent={accent} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>
                  {ej ? ej.nombre : c.exerciseId}
                </p>
                <div className="flex items-baseline gap-2">
                  <RankLabel rank={c.rango} className="text-xs font-bold" />
                  <span className="text-[10px]" style={{ color: COLORS.textMuted }}>
                    {e.tieneDatosReales ? 'Ya mandan tus entrenamientos' : 'Nivel estimado'}
                  </span>
                </div>
              </div>
              {onReclasificar && (
                <button
                  onClick={() => onReclasificar(c.exerciseId)}
                  className="text-xs font-semibold px-3 py-2 rounded-xl toque-44 shrink-0"
                  style={{ background: COLORS.surface2, color: COLORS.text }}
                  aria-label={`Reclasificar ${ej ? ej.nombre : c.exerciseId}`}
                >
                  Reclasificar
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
