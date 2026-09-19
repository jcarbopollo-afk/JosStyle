/* ===========================================================================
   ENTREGA 4 · FASE 24/45 — EL HUB DE CLASIFICACIÓN

   🚨 **De los seis componentes del apartado 27, uno ya existía**:
   `ClassificationProgress` lo escribió la F17 y está exportado desde
   `ClasificacionView.jsx`. El apartado dice *"Crear/reutilizar"* y a
   continuación *"No duplicar"*, así que aquí nacen los otros cinco y ése se
   importa — con una etiqueta opcional, porque el hub cuenta «recomendados» y
   el cuestionario cuenta «preguntas», y eso es un rótulo, no una barra nueva.

   🚨 **No calcula nada** (apartado 32: *"No calcular prioridades completas en
   cada render. Crear una función central"*). La prioridad, la razón, el
   contador y la cobertura los ha resuelto `src/lib/colaClasificacion.js`.

   ⚠️ **Y el `priorityScore` no se pinta** (apartado 16): viaja en el dato para
   ordenar y se queda ahí. Lo que ve Josué es la razón en palabras.
   =========================================================================== */

import React from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { Card, SectionTitle, EmptyHint } from './ui';
import { iconoDeGrupo } from './iconosFitness';
import { estadoDato } from '../lib/colaClasificacion';

/* ── 16 · La razón, en palabras ──────────────────────────────────────────── */
/**
 * ⚠️ Apartado 31 — *"No depender únicamente de color"*: la razón **es** texto.
 * Se pinta como una pastilla discreta, no como una etiqueta de color que haya
 * que descifrar.
 */
export function ClassificationReason({ reason, accent }) {
  if (!reason) return null;
  return (
    <span
      className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: hexToRgba(accent, 0.16), color: accent }}
    >
      {reason}
    </span>
  );
}

/* ── 17 · Una tarjeta de la cola ─────────────────────────────────────────── */
/**
 * El dibujo del apartado 17:
 *
 *     Dominadas
 *     Espalda · Bíceps
 *     [Clasificar]
 *
 * ⚠️ Apartado 31 — cada tarjeta dice **nombre, grupo muscular, estado y
 * acción**. El estado va con su palabra («Datos limitados»), nunca con un
 * punto de color: es `etiquetaDeEstado()` de EH F42 en otra pantalla.
 */
export function ClassificationQueueCard({ item, accent, onClasificar }) {
  if (!item) return null;
  const Icono = iconoDeGrupo(item.grupoPrincipal);
  const est = estadoDato(item.currentDataState);
  /* Solo se nombra el estado cuando dice algo: «Sin datos» en un ejercicio que
     está en la cola precisamente por eso sería ruido (EH F61). */
  const enseñaEstado = item.currentDataState !== 'sin_datos';

  return (
    <button
      onClick={() => onClasificar && onClasificar(item.exerciseId)}
      aria-label={`Clasificar ${item.nombre}. ${item.muscleGroups.join(', ')}. ${item.reason}`}
      className="w-full text-left rounded-2xl p-3.5 flex items-center gap-3 toque-44"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: hexToRgba(accent, 0.14) }}
      >
        {Icono ? <Icono size={18} style={{ color: accent }} aria-hidden="true" /> : null}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>{item.nombre}</p>
        <p className="text-[11px] truncate" style={{ color: COLORS.textMuted }}>
          {item.muscleGroups.join(' · ')}
        </p>
        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
          <ClassificationReason reason={item.reason} accent={accent} />
          {enseñaEstado && (
            <span className="text-[10px]" style={{ color: COLORS.textMuted }}>{est ? est.nombre : ''}</span>
          )}
        </div>
      </div>
      <ChevronRight size={16} className="shrink-0" style={{ color: COLORS.textMuted }} aria-hidden="true" />
    </button>
  );
}

/* ── La cola entera ──────────────────────────────────────────────────────── */
export function ClassificationQueue({ cola = [], accent, onClasificar }) {
  if (!cola.length) return null;
  return (
    <div className="space-y-2">
      {cola.map((item) => (
        <ClassificationQueueCard key={item.exerciseId} item={item} accent={accent} onClasificar={onClasificar} />
      ))}
    </div>
  );
}

/* ── 28 y 29 · Los vacíos ────────────────────────────────────────────────── */
/**
 * ⚠️ **Un vacío sin salida es una pantalla rota** (EH F41). Los tres estados
 * dicen qué ha pasado y qué puede hacer, y ninguno finge: «has saltado todos»
 * no es lo mismo que «ya está completa», y confundirlos le diría que ha
 * terminado algo que en realidad dejó pendiente.
 */
export function ClassificationEmpty({ vacio, accent, onVolver = null }) {
  if (!vacio) return null;
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: hexToRgba(accent, 0.14) }}
        >
          <Sparkles size={16} style={{ color: accent }} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{vacio.titulo}</p>
          <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{vacio.que}</p>
        </div>
      </div>
      {onVolver && (
        <button
          onClick={onVolver}
          aria-label="Volver a Rangos"
          className="mt-3 text-[11px] font-semibold px-3 py-2 rounded-full toque-44"
          style={{ background: hexToRgba(accent, 0.18), color: accent }}
        >
          Volver a Rangos
        </button>
      )}
    </Card>
  );
}

/* ── 17, 18, 19 y 29 · El hub ────────────────────────────────────────────── */
/**
 * 🚨 Apartado 18 — el contador que manda es **el de recomendados**. El de «sin
 * clasificación» existe, va detrás y en pequeño: *"no debe dominar la
 * interfaz"*. Un «87 restantes» en grande cuenta una lista que el sistema no
 * espera que conteste, y es lo que esta fase viene a quitar.
 */
/* ⚠️ La barra llega **ya pintada**, no como componente. Pasarla como
   `<ProgressBar>` la habría hecho saltar en `test-imports.mjs` —un JSX en
   mayúscula que no se importa aquí— y no se puede importar: vive en
   `ClasificacionView.jsx`, que a su vez importa este archivo, o sea un ciclo. */
export function ClassificationHub({
  pantalla, accent, onClasificar, onVolver = null, barra = null,
}) {
  if (!pantalla) return null;
  const { cola, contador, contadorSecundario, progreso, avisoCobertura, vacio } = pantalla;

  return (
    <div className="space-y-4">
      <div>
        <SectionTitle sub={cola.length ? pantalla.titulo : null}>Clasificación</SectionTitle>
        {(contador || contadorSecundario) && (
          <div className="flex items-baseline gap-2 flex-wrap">
            {contador && (
              <span className="text-sm font-bold" style={{ color: COLORS.text }}>{contador}</span>
            )}
            {contadorSecundario && (
              <span className="text-[11px]" style={{ color: COLORS.textMuted }}>{contadorSecundario}</span>
            )}
          </div>
        )}
      </div>

      {/* Apartado 19 — «3 / 8 recomendados». La barra es la de la F17. */}
      {progreso && barra}

      <ClassificationQueue cola={cola} accent={accent} onClasificar={onClasificar} />

      {vacio && <ClassificationEmpty vacio={vacio} accent={accent} onVolver={onVolver} />}

      {/* Apartado 29 — solo cuando la cobertura está de verdad baja. */}
      {avisoCobertura && (
        <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{avisoCobertura}</p>
      )}

      {/* ⚠️ Los secundarios del apartado 7 NO se listan como si fueran cola: se
          dice cuántos hay y que no hace falta. *"No obligar automáticamente"*. */}
      {!!pantalla.secundarios.length && !vacio && (
        <EmptyHint
          text={`Hay ${pantalla.secundarios.length} ${pantalla.secundarios.length === 1 ? 'ejercicio' : 'ejercicios'} que ya aportan algo por su cuenta: no hace falta que los clasifiques.`}
        />
      )}
    </div>
  );
}

export default ClassificationHub;
