/* Entrega 4 · Fase 33/45 — los componentes de la sustitución de ejercicios.
   ===========================================================================

   Los nueve del apartado 32. **No calculan nada**: la lista, los niveles, los
   motivos, los filtros y la configuración salen de `lib/sustitucion.js`, y
   aquí solo se pintan.

   · `ExerciseReplacement` es la pantalla de dentro. En el entrenamiento en
     vivo va **debajo de la cabecera de la sesión**, como decidió la F9 (su
     apartado 33: el cronómetro sigue a la vista y «Terminar» se puede pulsar);
     en el constructor va dentro de `ExerciseReplacementModal`, una hoja
     inferior con portal (regla 3), que en una pantalla ancha se abre más ancha
     y enseña las tarjetas en dos columnas (apartado 38).
   · El buscador a mano (apartado 25) llega **ya pintado** por quien lo usa —es
     `EjerciciosView`, una vista—: importarla desde aquí sería el ciclo de la
     F24 al revés.
   · Cada tarjeta dice **nombre, compatibilidad, motivo y acción** con
     palabras (apartado 37): el nivel es una palabra, nunca solo un color. */

import React, { useMemo, useState } from 'react';
import { useDialogoAccesible } from './dialogoAccesible';
import { createPortal } from 'react-dom';
import { ChevronRight, Search, SlidersHorizontal, Check, Repeat } from 'lucide-react';
import { COLORS } from '../tokens';
import { HOJA, acentoLegible } from '../lib/acabadoFitness';
import { BotonCerrarHoja, PastillaFiltro as Pastilla } from './piezasFitness';
import { hexToRgba } from '../lib/helpers';
import { PrimaryButton, GhostBtn } from './ui';
import { nombreCompleto, nombreSinCatalogo } from '../lib/ejercicios';
import {
  pantallaDeSustitucion, sustitucionElegida, necesitaConfirmar, nivelCompatibilidad,
  TEXTOS_SUSTITUCION, AVISO_OBJETIVO,
} from '../lib/sustitucion';

/* El color de cada nivel es un TOKEN (regla 2), y siempre va con su palabra. */
const colorDeNivel = (id) => ({
  muy_similar: COLORS.positive,
  similar: COLORS.info,
  alternativa: COLORS.warning,
  poco_recomendable: COLORS.textMuted,
}[id] || COLORS.textMuted);

/** La compatibilidad: una palabra, con su color de apoyo. */
export function ReplacementCompatibility({ nivel }) {
  const n = nivelCompatibilidad(nivel);
  if (!n) {
    return (
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
        Elegido a mano
      </span>
    );
  }
  const c = colorDeNivel(n.id);
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5"
      style={{ color: c, background: hexToRgba(c, 0.14) }}
    >
      <span aria-hidden="true">●</span>
      {n.nombre}
    </span>
  );
}

/** El motivo (apartado 9): una o dos frases cortas. */
export function ReplacementReason({ reasons = [], max = 2 }) {
  const l = (reasons || []).slice(0, max);
  if (!l.length) return null;
  return (
    <span className="block mt-1">
      {l.map((r) => (
        <span key={r} className="text-[11px] block leading-snug" style={{ color: COLORS.textMuted }}>{r}</span>
      ))}
    </span>
  );
}

/** Una alternativa. ⚠️ El `aria-label` empieza por «Cambiar por» —la acción—
 *  y sigue con el nombre, la compatibilidad y el motivo (apartado 37). */
export function ReplacementCard({ item, accent, onElegir }) {
  if (!item) return null;
  const nombre = nombreCompleto(item.exercise);
  const n = nivelCompatibilidad(item.compatibilityLevel);
  return (
    <button
      onClick={() => onElegir && onElegir(item.id)}
      aria-label={`Cambiar por ${nombre}. ${n ? n.nombre : 'Elegido a mano'}: ${item.reasons[0] || ''}`}
      className="hub-card w-full text-left rounded-2xl p-3.5 flex items-start gap-3 active:scale-[0.99] toque-44"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
    >
      <Repeat size={18} className="mt-0.5 shrink-0" style={{ color: acentoLegible(accent) }} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="text-sm font-bold block" style={{ color: COLORS.text }}>{nombre}</span>
        <span className="block mt-1"><ReplacementCompatibility nivel={item.compatibilityLevel} /></span>
        <ReplacementReason reasons={item.reasons} />
      </span>
      <ChevronRight size={16} className="mt-1 shrink-0" style={{ color: COLORS.textMuted }} aria-hidden="true" />
    </button>
  );
}

/* 🔓 FIT F42 (apartados 42 y 64) — aquí había una `Pastilla` propia, una de las
   siete copias de la pastilla de un filtro: es `PastillaFiltro` (piezasFitness). */

const FILAS_FILTRO = [
  { id: 'entorno', nombre: 'Dónde' },
  { id: 'grupo', nombre: 'Músculo' },
  { id: 'tipo', nombre: 'Tipo' },
  { id: 'dificultad', nombre: 'Dificultad' },
];

/** Apartados 7 y 26 — los filtros, **plegados** para no sobrecargar el móvil.
 *  Una fila solo aparece si separa algo (lo decide `opcionesDeFiltro`), y cada
 *  una se desplaza en horizontal sin mover la página. */
export function ReplacementFilters({
  opciones = {}, material = [], filtros = {}, noTengo = [], soloDisponibles = false,
  hayNoDisponibles = false, accent, onFiltro, onNoTengo, onSoloDisponibles,
}) {
  const [abierto, setAbierto] = useState(false);
  const activos = Object.values(filtros).filter(Boolean).length + noTengo.length;
  const filas = FILAS_FILTRO.filter((f) => (opciones[f.id] || []).length >= 2);
  const hayFiltros = filas.length > 0 || material.length > 0;
  if (!hayFiltros && !hayNoDisponibles) return null;
  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {hayFiltros && (
          <button
            onClick={() => setAbierto(!abierto)}
            aria-expanded={abierto}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold toque-44"
            style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${activos ? accent : COLORS.border}` }}
          >
            <SlidersHorizontal size={14} aria-hidden="true" />
            {TEXTOS_SUSTITUCION.filtros}{activos ? ` · ${activos}` : ''}
          </button>
        )}
        {hayNoDisponibles && (
          <Pastilla
            activa={soloDisponibles}
            accent={accent}
            onClick={() => onSoloDisponibles && onSoloDisponibles(!soloDisponibles)}
            label={`${TEXTOS_SUSTITUCION.soloDisponible}: ${soloDisponibles ? 'activado' : 'desactivado'}`}
          >
            {TEXTOS_SUSTITUCION.soloDisponible}
          </Pastilla>
        )}
      </div>
      {abierto && hayFiltros && (
        <div className="rounded-2xl p-3 space-y-2.5" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
          {filas.map((f) => (
            <div key={f.id}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: COLORS.textMuted }}>{f.nombre}</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {opciones[f.id].map((o) => {
                  const activa = filtros[f.id] === o.id;
                  return (
                    <Pastilla
                      key={o.id}
                      activa={activa}
                      accent={accent}
                      label={`${f.nombre}: ${o.nombre} (${o.cuantos})`}
                      onClick={() => onFiltro && onFiltro(f.id, activa ? null : o.id)}
                    >
                      {o.nombre} · {o.cuantos}
                    </Pastilla>
                  );
                })}
              </div>
            </div>
          ))}
          {material.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: COLORS.textMuted }}>No tengo</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {material.map((m) => {
                  const activa = noTengo.includes(m.id);
                  return (
                    <Pastilla
                      key={m.id}
                      activa={activa}
                      accent={accent}
                      label={`No tengo ${m.nombre.toLowerCase()}`}
                      onClick={() => onNoTengo && onNoTengo(activa ? noTengo.filter((x) => x !== m.id) : [...noTengo, m.id])}
                    >
                      {m.nombre}
                    </Pastilla>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Apartado 25 — la búsqueda a mano, siempre a la vista (apartado 38). */
export function ReplacementSearch({ onBuscar, texto = TEXTOS_SUSTITUCION.buscarOtro }) {
  if (!onBuscar) return null;
  return (
    <button
      onClick={onBuscar}
      className="w-full rounded-2xl px-3.5 py-3 flex items-center gap-2.5 text-sm font-semibold toque-44 active:scale-[0.99]"
      style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
    >
      <Search size={16} style={{ color: COLORS.textMuted }} aria-hidden="true" />
      {texto}
    </button>
  );
}

/** Apartado 28 — sin alternativas claras, se dice y se ofrece buscar. */
export function ReplacementEmpty({ texto = TEXTOS_SUSTITUCION.vacio, onBuscar, accent }) {
  return (
    <div className="rounded-2xl p-4 text-center" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
      <p className="text-sm font-bold" style={{ color: COLORS.text }}>{texto}</p>
      <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{TEXTOS_SUSTITUCION.vacioTexto}</p>
      {onBuscar && (
        <div className="mt-3 flex justify-center">
          <PrimaryButton accent={accent} icon={Search} onClick={onBuscar}>{TEXTOS_SUSTITUCION.buscarTodos}</PrimaryButton>
        </div>
      )}
    </div>
  );
}

/** La confirmación: qué se conserva, qué cambia y qué pasa con su objetivo.
 *  Solo sale cuando hay algo que decir (`necesitaConfirmar`). */
export function ReplacementConfirm({
  original = null, item, conDatos = false, textoDatos = '', objetivo = null,
  opcionObjetivo = AVISO_OBJETIVO.porDefecto, onOpcionObjetivo, onConfirmar, onCancelar, accent,
  /* ⚠️ Solo las opciones que quien lo usa sabe hacer: «Crear uno nuevo» sin
     una forma de llegar al formulario sería un botón que no hace nada (regla 8). */
  opcionesObjetivo = ['mantener', 'cancelar', 'crear'],
}) {
  if (!item) return null;
  const c = item.recommendedConfiguration || {};
  const nuevo = nombreCompleto(item.exercise);
  const conserva = [
    c.series ? `${c.series} ${c.series === 1 ? 'serie' : 'series'}` : 'las series',
    c.descanso ? `${c.descanso} s de descanso` : null,
    c.notas ? 'la nota' : null,
    !c.cambiaMedida && c.repeticiones ? `${c.repeticiones}${c.repsHasta ? `–${c.repsHasta}` : ''} repeticiones` : null,
    !c.cambiaMedida && c.duracion ? `${c.duracion} s por serie` : null,
  ].filter(Boolean);
  const opciones = [
    { id: 'mantener', texto: AVISO_OBJETIVO.mantener },
    { id: 'cancelar', texto: AVISO_OBJETIVO.cancelar },
    { id: 'crear', texto: AVISO_OBJETIVO.crear },
  ].filter((o) => o.id === 'mantener' || opcionesObjetivo.includes(o.id));
  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: COLORS.surface, border: `1px solid ${accent}` }} role="group" aria-label="Confirmar el cambio">
      <div>
        <p className="text-sm font-bold" style={{ color: COLORS.text }}>¿Reemplazar ejercicio por {nuevo}?</p>
        {original && (
          <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>En lugar de {nombreCompleto(original)}</p>
        )}
        <div className="mt-1.5"><ReplacementCompatibility nivel={item.compatibilityLevel} /></div>
      </div>
      <p className="text-xs" style={{ color: COLORS.textMuted }}>
        <span style={{ color: COLORS.text }} className="font-semibold">Se conserva: </span>{conserva.join(' · ')}.
      </p>
      {c.aviso && <p className="text-xs" style={{ color: COLORS.warning }}>{c.aviso}</p>}
      {c.avisoPeso && <p className="text-xs" style={{ color: COLORS.textMuted }}>{c.avisoPeso}</p>}
      {conDatos && textoDatos && <p className="text-xs" style={{ color: COLORS.textMuted }}>{textoDatos}</p>}
      {objetivo && (
        <div className="rounded-xl p-3" style={{ background: hexToRgba(COLORS.border, 0.3) }}>
          <p className="text-xs font-bold" style={{ color: COLORS.text }}>{AVISO_OBJETIVO.titulo}</p>
          {objetivo.objetivoTexto && (
            <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>{objetivo.objetivoTexto}</p>
          )}
          <div className="flex gap-1.5 mt-2 flex-wrap" role="radiogroup" aria-label="Qué hacer con el objetivo">
            {opciones.map((o) => (
              <button
                key={o.id}
                role="radio"
                aria-checked={opcionObjetivo === o.id}
                onClick={() => onOpcionObjetivo && onOpcionObjetivo(o.id)}
                className="rounded-full px-3 py-1.5 text-xs font-semibold toque-44"
                style={{
                  background: opcionObjetivo === o.id ? hexToRgba(accent, 0.16) : COLORS.surface2,
                  color: opcionObjetivo === o.id ? acentoLegible(accent) : COLORS.text,
                  border: `1px solid ${opcionObjetivo === o.id ? accent : COLORS.border}`,
                }}
              >
                {o.texto}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        <GhostBtn onClick={onCancelar}>Cancelar</GhostBtn>
        <PrimaryButton accent={accent} icon={Repeat} onClick={onConfirmar}>Reemplazar</PrimaryButton>
      </div>
    </div>
  );
}

/**
 * 🚨 La pantalla de sustitución. Recibe el ejercicio y su contexto, y devuelve
 * la elección con `onConfirmar(id, { opcionObjetivo })`: **quien la aplica es
 * quien sabe dónde está** —la sesión, el borrador o la plantilla—, y por eso
 * esta pieza no escribe nada.
 */
export function ExerciseReplacement({
  exerciseId, contexto = {}, propios = [], accent,
  ambito = 'sesion', conDatos = false, textoDatos = '', objetivo = null,
  opcionesObjetivo = ['mantener'],
  onConfirmar, onCancelar = null, renderBuscador = null,
}) {
  const [filtros, setFiltros] = useState({});
  const [noTengo, setNoTengo] = useState([]);
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const [verPoco, setVerPoco] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [elegido, setElegido] = useState(null);
  const [opcionObjetivo, setOpcionObjetivo] = useState(AVISO_OBJETIVO.porDefecto);

  const ctx = useMemo(() => ({ ...contexto, propios, noTengo }), [contexto, propios, noTengo]);
  const pantalla = useMemo(
    () => pantallaDeSustitucion(exerciseId, ctx, {
      filtros: { ...filtros, soloDisponibles },
      verPocoRecomendables: verPoco,
    }),
    [exerciseId, ctx, filtros, soloDisponibles, verPoco],
  );

  const elegir = (id) => {
    const item = sustitucionElegida(exerciseId, id, ctx);
    if (!item) return;
    setBuscando(false);
    if (necesitaConfirmar(item, { conDatos, objetivo })) {
      setOpcionObjetivo(AVISO_OBJETIVO.porDefecto);
      setElegido(item);
    } else if (onConfirmar) {
      onConfirmar(item.id, { opcionObjetivo: AVISO_OBJETIVO.porDefecto, item });
    }
  };

  if (buscando && renderBuscador) {
    return renderBuscador({ onElegir: elegir, onVolver: () => setBuscando(false) });
  }

  if (elegido) {
    return (
      <ReplacementConfirm
        original={pantalla.original}
        item={elegido}
        conDatos={conDatos}
        textoDatos={textoDatos}
        objetivo={objetivo}
        opcionesObjetivo={opcionesObjetivo}
        opcionObjetivo={opcionObjetivo}
        onOpcionObjetivo={setOpcionObjetivo}
        accent={accent}
        onCancelar={() => setElegido(null)}
        onConfirmar={() => {
          const item = elegido;
          setElegido(null);
          if (onConfirmar) onConfirmar(item.id, { opcionObjetivo, item });
        }}
      />
    );
  }

  const buscar = renderBuscador ? () => setBuscando(true) : null;
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-extrabold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
            {TEXTOS_SUSTITUCION.titulo}
          </p>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>
            {pantalla.original ? nombreCompleto(pantalla.original) : nombreSinCatalogo(exerciseId)}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>
            {ambito === 'sesion' ? TEXTOS_SUSTITUCION.soloSesion : TEXTOS_SUSTITUCION.soloBorrador}
          </p>
        </div>
        {onCancelar && (
          <BotonCerrarHoja onClick={onCancelar} etiqueta="Cerrar la sustitución" />
        )}
      </div>

      <ReplacementSearch onBuscar={buscar} />

      {pantalla.estado === 'sin_ficha' ? (
        <ReplacementEmpty texto={pantalla.texto} onBuscar={buscar} accent={accent} />
      ) : (
        <>
          <ReplacementFilters
            opciones={pantalla.opciones}
            material={pantalla.material}
            filtros={filtros}
            noTengo={noTengo}
            soloDisponibles={soloDisponibles}
            hayNoDisponibles={pantalla.hayNoDisponibles || noTengo.length > 0}
            accent={accent}
            onFiltro={(k, v) => setFiltros({ ...filtros, [k]: v })}
            onNoTengo={setNoTengo}
            onSoloDisponibles={setSoloDisponibles}
          />
          {pantalla.estado === 'vacio' && (
            <ReplacementEmpty onBuscar={buscar} accent={accent} />
          )}
          {pantalla.grupos.map((g) => (
            <div key={g.nivel.id}>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: colorDeNivel(g.nivel.id) }}>
                {g.nivel.nombre}
              </p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {g.items.map((x) => (
                  <ReplacementCard key={x.id} item={x} accent={accent} onElegir={elegir} />
                ))}
              </div>
            </div>
          ))}
          {(pantalla.ocultas > 0 || verPoco) && (
            <button
              onClick={() => setVerPoco(!verPoco)}
              className="text-xs font-semibold underline toque-44"
              style={{ color: COLORS.textMuted }}
            >
              {verPoco ? TEXTOS_SUSTITUCION.ocultarPoco : `${TEXTOS_SUSTITUCION.verPoco} (${pantalla.ocultas})`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

/** Apartado 38 — la hoja inferior del constructor. Portal (regla 3), Escape
 *  para cerrar y la Safe Area de abajo; en una pantalla ancha, más ancha. */
export function ExerciseReplacementModal({ abierto = true, onCerrar, ...props }) {
  /* 🔓 FIT F39 — su Escape propio (F33) pasa a ser el de todas las hojas, que
     además mete el foco dentro y lo devuelve al cerrar (apartados 36-38). */
  const caja = useDialogoAccesible(abierto, onCerrar);
  if (!abierto || typeof document === 'undefined') return null;
  return createPortal(
    <div
      className={HOJA.velo}
      style={{ background: HOJA.fondoVelo }}
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-label={TEXTOS_SUSTITUCION.titulo}
    >
      <div
        ref={caja}
        tabIndex={-1}
        className={`${HOJA.caja} sm:max-w-2xl`}
        style={{ background: COLORS.bg, paddingBottom: HOJA.abajo }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <ExerciseReplacement {...props} onCancelar={onCerrar} />
      </div>
    </div>,
    document.body,
  );
}

/* Qué hay en este archivo y a qué apartado responde (apartado 32). */
export const COMPONENTES_FIT33 = [
  'ExerciseReplacement', 'ExerciseReplacementModal', 'ReplacementCard', 'ReplacementCompatibility',
  'ReplacementReason', 'ReplacementFilters', 'ReplacementSearch', 'ReplacementEmpty', 'ReplacementConfirm',
];
