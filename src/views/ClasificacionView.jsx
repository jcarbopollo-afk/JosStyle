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
/* FIT F24 — la cola priorizada y su hub. ⚠️ La pantalla NO calcula ninguna
   prioridad: se la dan resuelta (apartado 32). */
import { pantallaDeClasificacion, avisoDeReclasificar, VACIOS_COLA } from '../lib/colaClasificacion';
import { ClassificationHub } from '../components/colaClasificacion';

/* ── 22 · El progreso del cuestionario ───────────────────────────────────── */
/* ⚠️ *"La barra representa progreso del cuestionario. NO representa progreso
   físico"*. Por eso lleva el número al lado y la palabra «preguntas». */
/* 🔓 **FIT F24 — y gana una `etiqueta` opcional.** Su apartado 27 pide
   reutilizar este componente y su 19 quiere «3 / 8 recomendados»: eso es un
   rótulo, no una barra nueva. Sin `etiqueta` dice lo de siempre. */
export function ClassificationProgress({ posicion, total, fraccion, accent, etiqueta = null }) {
  const pct = Math.max(0, Math.min(100, Math.round((Number(fraccion) || 0) * 100)));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
          {etiqueta || `Pregunta ${posicion} de ${total}`}
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: hexToRgba(COLORS.border, 0.6) }}
        role="img"
        aria-label={etiqueta ? `${etiqueta}: ${pct} %` : `Cuestionario: ${pct} % respondido`}
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
export function AvisoReclasificar({ accent, onConfirmar, onCancelar, aviso = null }) {
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
        {/* 🔓 FIT F24, apartado 23 — con datos reales de sobra se dice que la
            estimación ya no es lo que manda. Informa, NO bloquea. */}
        {aviso && <p className="text-sm" style={{ color: COLORS.textMuted }}>{aviso}</p>}
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
export function ClassificationSummary({ resumen, accent, onVerRangos, onSeguir, extra = null }) {
  return (
    <Card>
      <p className="text-lg font-extrabold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
        Clasificación completada
      </p>
      <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>{resumen.texto}</p>
      {/* ⚠️ La segunda frase del apartado 28 de la F24 viaja aquí en vez de en
          un segundo «ya has terminado»: dos avisos de lo mismo en la misma
          pantalla es el aviso delante del aviso (EH F61). */}
      {extra && <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{extra}</p>}
      <div className="mt-4 flex flex-col gap-2">
        <PrimaryButton onClick={onVerRangos} accent={accent}>Ver mis rangos</PrimaryButton>
        {onSeguir && <GhostBtn onClick={onSeguir}>Clasificar más ejercicios</GhostBtn>}
      </div>
    </Card>
  );
}

/* ── El flujo ────────────────────────────────────────────────────────────── */
/**
 * 🔓 **FIT F24 — LA ENTRADA YA NO ES LA PREGUNTA, ES EL HUB.** El apartado 34
 * de la F24 dibuja el recorrido entero: *"Clasificar ejercicios → Cola
 * priorizada → Seleccionar ejercicio → Cuestionario"*. Hasta ahora se entraba
 * directamente a la primera pregunta de una tanda de catorce; ahora se entra a
 * la cola priorizada y **elige él**. ⚠️ Y el cuestionario de la F17 no se ha
 * tocado: las preguntas, las opciones, la puntuación y el guardado siguen
 * siendo suyos (apartado 8: *"No crear otro sistema de preguntas"*).
 */
export default function ClasificacionView({
  fitness = null, propios = [], perfil = null, accent,
  onGuardarFitness = null, onVolver = null,
  /* 🔓 FIT F34, apartado 25 — «Clasificar» desde la ficha de un ejercicio abre
     SU pregunta, sin pasar por la cola. */
  ejercicioInicial = null,
}) {
  const f = fitness || {};
  /* ⚠️ Nada de esto es un dato: es dónde está en la pantalla (EH F40). */
  const [activo, setActivo] = useState(() => (ejercicioInicial && ejercicioPorId(ejercicioInicial, propios) ? ejercicioInicial : null)); // el ejercicio que está contestando
  /* Apartado 24 — saltar deja el ejercicio **pendiente**, no le asigna un
     nivel. Por eso los saltados son de la sesión y no se guardan: mañana
     vuelven a ofrecerse, que es lo que significa «dejar pendiente». */
  const [saltados, setSaltados] = useState([]);
  const [elegida, setElegida] = useState(null);
  const [hecha, setHecha] = useState(null);      // la clasificación recién guardada
  const [saliendo, setSaliendo] = useState(false);
  const [reclasificando, setReclasificando] = useState(null);
  const [error, setError] = useState(null);

  /* 🚨 Apartado 32 — **una sola llamada**, y aquí no se calcula ninguna
     prioridad: la cola, las razones, los contadores y la cobertura vienen
     resueltos de `colaClasificacion.js`. */
  const pantalla = pantallaDeClasificacion(f, { propios, saltados });
  const actual = activo ? ejercicioPorId(activo, propios) : null;
  const pregunta = actual ? preguntaDeEjercicio(actual, { perfil }) : null;
  const resumen = resumenFinal(f, { propios });
  /* Apartado 23 — con datos reales de sobra, el aviso extra. */
  const avisoRe = reclasificando ? avisoDeReclasificar(f, reclasificando, { propios }) : null;
  const hechos = pantalla.progreso ? pantalla.progreso.hechos : 0;

  const responder = (opcionId) => {
    setElegida(opcionId);
    setError(null);
    if (!onGuardarFitness || !actual) return;
    const r = clasificarEjercicio(f, actual.id, opcionId, { propios, perfil });
    if (!r.ok) {
      /* «No lo sé» no clasifica: se puede saltar sin inventar un nivel
         (apartado 24 de la F24 y 14 de la F17), y se dice por qué. */
      setError(r.error);
      setHecha({ omitido: true, exerciseId: actual.id });
      return;
    }
    onGuardarFitness(r.fitness);
    setHecha(r.clasificacion);
  };

  /* Apartados 20 y 21 — al volver, la cola se recalcula sola: no hay nada
     guardado que invalidar, así que el siguiente ejercicio puede cambiar. */
  const volverAlHub = () => {
    setHecha(null);
    setElegida(null);
    setError(null);
    setActivo(null);
  };

  const saltar = () => {
    if (activo) setSaltados((s) => (s.includes(activo) ? s : [...s, activo]));
    volverAlHub();
  };

  /* Apartado 19 — «3 / 8 recomendados», con la barra que ya existía (F17). */
  const barra = pantalla.progreso ? (
    <ClassificationProgress
      posicion={pantalla.progreso.hechos}
      total={pantalla.progreso.total}
      fraccion={pantalla.progreso.total ? pantalla.progreso.hechos / pantalla.progreso.total : 0}
      etiqueta={pantalla.progreso.texto}
      accent={accent}
    />
  ) : null;

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
        onClick={() => (hecha || elegida || hechos > 0 ? setSaliendo(true) : onVolver && onVolver())}
        className="p-2 rounded-full shrink-0 toque-44"
        style={{ background: COLORS.surface2 }}
        aria-label="Salir de la clasificación"
      >
        <X size={16} style={{ color: COLORS.text }} />
      </button>
    </div>
  );

  const dialogos = (
    <>
      {saliendo && (
        <ClassificationExitDialog
          accent={accent}
          onSeguir={() => setSaliendo(false)}
          onSalir={() => { setSaliendo(false); if (onVolver) onVolver(); }}
        />
      )}
      {reclasificando && (
        <AvisoReclasificar
          accent={accent}
          aviso={avisoRe && avisoRe.aviso}
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
            setActivo(null);
          }}
        />
      )}
    </>
  );

  /* ── El hub (apartados 17, 18, 19, 28 y 29) ───────────────────────────── */
  if (!actual) {
    /* ⚠️ Dos mensajes de «ya has terminado» en la misma pantalla serían el
       aviso delante del aviso de EH F61: si el resumen de la F17 está, el
       vacío de la F24 sobra — y su segunda frase, que es la del apartado 28,
       se le pasa al resumen para no perderla. */
    const conResumen = resumen.ejercicios > 0 && !!pantalla.vacio;
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {cabecera}
        <ClassificationHub
          pantalla={conResumen ? { ...pantalla, vacio: null } : pantalla}
          accent={accent}
          onClasificar={(id) => { setActivo(id); setElegida(null); setHecha(null); setError(null); }}
          onVolver={onVolver}
          barra={barra}
        />
        {conResumen && (
          <ClassificationSummary
            resumen={resumen}
            accent={accent}
            onVerRangos={onVolver}
            extra={VACIOS_COLA.completa.que}
          />
        )}
        {resumen.ejercicios > 0 && (
          <YaClasificados fitness={f} propios={propios} accent={accent} onReclasificar={setReclasificando} />
        )}
        {dialogos}
      </div>
    );
  }

  /* ── El cuestionario de la F17, para el que él ha elegido ─────────────── */
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {cabecera}
      {barra}

      {hecha && !hecha.omitido ? (
        <ClassificationResult
          clasificacion={hecha}
          musculos={musculosQueRecibe(hecha.exerciseId, { propios })}
          accent={accent}
          ultima={pantalla.cola.length <= 1}
          onContinuar={volverAlHub}
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
                <GhostBtn onClick={saltar}>Saltar este ejercicio</GhostBtn>
              </div>
            </Card>
          )}
          {/* Apartado 24 — se puede dejar pendiente sin contestar nada. */}
          {!error && (
            <div className="flex gap-2">
              <GhostBtn icon={ChevronLeft} onClick={volverAlHub}>Ver la lista</GhostBtn>
              <GhostBtn onClick={saltar}>Saltar este ejercicio</GhostBtn>
            </div>
          )}
        </>
      )}

      {dialogos}
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
