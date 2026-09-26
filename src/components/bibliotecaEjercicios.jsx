/* Entrega 4 · Fase 34/45 — la biblioteca y la ficha de un ejercicio.
   ===========================================================================

   Los componentes del apartado 31. **No calculan nada**: la búsqueda, los
   filtros, las cadenas de progresión, las alternativas y lo personal salen de
   `lib/bibliotecaEjercicios.js`, que a su vez lo pide a la F2, la F29 y la F33.

   ⚠️ **Cuatro ya existían y se reutilizan**, no se reescriben: el resumen de
   rendimiento, `ExerciseRankPreview`, `ExerciseGoalPreview` y
   `ExerciseVariants` son de la F29 (`components/detalleEjercicio.jsx`), y la
   compatibilidad de una alternativa es `ReplacementCompatibility` de la F33.
   `ExerciseLibrary` es `EjerciciosView` y `ExerciseDetail` es su
   `DetalleEjercicio`, ampliados: una segunda biblioteca sería el duplicado de
   la E3 F22. */

import React, { useState } from 'react';
import {
  Search, SlidersHorizontal, X, Check, Heart, Plus, ChevronRight, ArrowDown, Dumbbell, Target,
} from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { Card, SectionTitle, TextInput, GhostBtn, PrimaryButton } from './ui';
import { iconoDeGrupo } from './iconosFitness';
import { ExercisePerformanceSummary, ExerciseRankPreview, ExerciseGoalPreview } from './detalleEjercicio';
import { ReplacementCompatibility } from './sustitucion';
import {
  musculoPrincipal, nombreCompleto,
  dificultad as dificultadDe, equipo, entorno as entornoDe,
} from '../lib/ejercicios';
import {
  imagenDeFicha, FILAS_FILTRO_BIBLIOTECA, TEXTO_LIMPIAR_FILTROS, SIN_TUTORIAL, TUTORIAL_ROTO,
} from '../lib/bibliotecaEjercicios';

/* ── ExerciseSearch (apartado 3) ───────────────────────────────────────────
   Siempre a la vista (apartado 34). */
export function ExerciseSearch({ valor = '', onCambiar }) {
  return (
    <TextInput
      value={valor}
      onChange={(ev) => onCambiar && onCambiar(ev.target.value)}
      placeholder="Buscar por nombre, músculo o material"
      aria-label="Buscar un ejercicio"
    />
  );
}

/* ── ExerciseFilterChip ────────────────────────────────────────────────────
   Estado con `aria-pressed`, y su recuento al lado: un filtro que deja la
   pantalla vacía sin avisar es peor que no tenerlo (F2, apartado 23). */
export function ExerciseFilterChip({ activa = false, cuantos = null, accent, onClick, children }) {
  const apagada = cuantos === 0 && !activa;
  return (
    <button
      onClick={onClick}
      disabled={apagada}
      aria-pressed={activa}
      className="px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 toque-44 active:scale-[0.97] transition-colors"
      style={{
        background: activa ? accent : hexToRgba(COLORS.border, 0.5),
        color: activa ? COLORS.textOnAccent : COLORS.textMuted,
        opacity: apagada ? 0.4 : 1,
      }}
    >
      {children}
      {cuantos !== null && <span className="ml-1.5 opacity-70">{cuantos}</span>}
    </button>
  );
}

/* ── ExerciseFilters (apartados 4-6) ───────────────────────────────────────
   Una fila por clase, que se desplaza en horizontal sin mover la página
   (apartado 34), y «Limpiar filtros» cuando hay alguno puesto. */
export function ExerciseFilters({ opciones = {}, filtros = {}, accent, onAlternar, onLimpiar }) {
  const hay = Object.values(filtros || {}).some(Boolean);
  return (
    <Card>
      {FILAS_FILTRO_BIBLIOTECA.filter((f) => (opciones[f.id] || []).length > 0).map((f) => (
        <div key={f.id} className="mb-3 last:mb-0">
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: COLORS.textMuted }}>{f.nombre}</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {opciones[f.id].map((o) => (
              <ExerciseFilterChip
                key={o.id}
                activa={filtros[f.id] === o.id}
                cuantos={o.cuantos}
                accent={accent}
                onClick={() => onAlternar && onAlternar(f.id, o.id)}
              >
                {o.nombre}
              </ExerciseFilterChip>
            ))}
          </div>
        </div>
      ))}
      {hay && onLimpiar && (
        <div className="mt-3">
          <GhostBtn icon={X} onClick={onLimpiar}>{TEXTO_LIMPIAR_FILTROS}</GhostBtn>
        </div>
      )}
    </Card>
  );
}

/* ── El hueco de la imagen (apartado 28) ───────────────────────────────────
   Sin imagen propia, el icono de su grupo — **nunca la imagen de otro
   ejercicio**. Con imagen, su `alt` es el nombre (apartado 35). */
export function ExerciseVisual({ ejercicio, accent, grande = false }) {
  const src = imagenDeFicha(ejercicio);
  const Icono = iconoDeGrupo(musculoPrincipal(ejercicio)?.grupoId);
  const lado = grande ? 'w-16 h-16' : 'w-10 h-10';
  if (src) {
    return <img src={src} alt={nombreCompleto(ejercicio)} className={`${lado} rounded-xl object-cover shrink-0`} />;
  }
  return (
    <div
      className={`${lado} rounded-xl flex items-center justify-center shrink-0`}
      style={{ background: hexToRgba(accent, 0.14), color: accent }}
      aria-hidden="true"
    >
      <Icono size={grande ? 30 : 20} />
    </div>
  );
}

/* ── ExerciseCard (apartado 7) ─────────────────────────────────────────────
   Nombre, imagen si existe, dificultad, entorno, músculo principal y material
   principal — y nada más (*"No mostrar demasiada información en la
   tarjeta"*). Es la tarjeta de la F2, mudada aquí para que la usen la
   biblioteca y la ficha sin que un componente importe una vista. */
export function ExerciseCard({ ejercicio, accent, onAbrir, accion = 'Ver', marca = null, favorito = false }) {
  const principal = musculoPrincipal(ejercicio);
  const dif = dificultadDe(ejercicio.dificultad);
  const equipoPrincipal = (ejercicio.equipamiento || []).find((e) => e !== 'suelo' && e !== 'ninguno')
    || (ejercicio.equipamiento || [])[0];
  const entornos = (ejercicio.entornos || []).map((e) => entornoDe(e)?.nombre).filter(Boolean);
  return (
    <button
      onClick={onAbrir}
      aria-label={`${accion} ${nombreCompleto(ejercicio)}`}
      className="hub-card w-full text-left rounded-2xl p-3.5 flex items-center gap-3 active:scale-[0.99]"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
    >
      <ExerciseVisual ejercicio={ejercicio} accent={accent} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {ejercicio.nombre}
          {favorito && <Heart size={12} className="inline ml-1.5 -mt-0.5" style={{ color: accent }} fill={accent} aria-label="En favoritos" />}
        </p>
        {ejercicio.variante && (
          <p className="text-[11px] truncate" style={{ color: COLORS.textMuted }}>{ejercicio.variante}</p>
        )}
        <p className="text-xs truncate mt-0.5" style={{ color: COLORS.textMuted }}>
          {principal ? principal.nombre : 'Sin músculos'}
          {dif ? ` · ${dif.nombre}` : ''}
          {equipoPrincipal ? ` · ${equipo(equipoPrincipal)?.nombre || equipoPrincipal}` : ''}
        </p>
      </div>
      {/* ⚠️ En modo selector se dice si ya está en el entrenamiento, pero NO se
          bloquea: duplicar un ejercicio es el apartado 17 de la FIT F3. */}
      <span className="text-[10px] font-semibold shrink-0 text-right" style={{ color: marca ? accent : COLORS.textMuted }}>
        {marca || entornos.join(' · ')}
      </span>
    </button>
  );
}

/* ── ExerciseGrid ──────────────────────────────────────────────────────────
   Una columna en el móvil y rejilla en una pantalla ancha (apartado 34), de 20
   en 20 con su «Ver 20 más» (apartado 33). */
export function ExerciseGrid({ pagina, accent, onAbrir, onMas, accion = 'Ver', marcaDe = null, favoritos = [] }) {
  if (!pagina) return null;
  return (
    <div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {pagina.items.map((e) => (
          <ExerciseCard
            key={e.id}
            ejercicio={e}
            accent={accent}
            accion={accion}
            marca={marcaDe ? marcaDe(e) : null}
            favorito={favoritos.includes(e.id)}
            onAbrir={() => onAbrir && onAbrir(e.id)}
          />
        ))}
      </div>
      {pagina.hayMas && onMas && (
        <div className="mt-3 flex justify-center">
          <GhostBtn onClick={onMas}>{pagina.verMas}</GhostBtn>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LA FICHA — jerarquía del apartado 39: visual, nombre, músculos, técnica,
   progresiones y variantes, y tu progreso.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── ExerciseHeader (apartados 8, 11, 12 y 13) ────────────────────────────── */
export function ExerciseHeader({ ficha, accent }) {
  if (!ficha || !ficha.ejercicio) return null;
  const fila = (nombre, valor) => (valor ? (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-xs shrink-0" style={{ color: COLORS.textMuted }}>{nombre}</span>
      <span className="text-xs font-semibold text-right" style={{ color: COLORS.text }}>{valor}</span>
    </div>
  ) : null);
  return (
    <Card>
      <div className="flex items-start gap-3">
        <ExerciseVisual ejercicio={ficha.ejercicio} accent={accent} grande />
        <div className="min-w-0 flex-1">
          <p className="text-xl font-extrabold leading-tight" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
            {ficha.nombre}
          </p>
          {ficha.variante && <p className="text-sm font-semibold" style={{ color: accent }}>{ficha.variante}</p>}
          {ficha.etiquetas.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-1.5">
              {ficha.etiquetas.map((t) => (
                <span key={t} className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5"
                  style={{ background: hexToRgba(accent, 0.12), color: accent }}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {ficha.descripcion && (
        <p className="text-sm mt-3 leading-relaxed" style={{ color: COLORS.textMuted }}>{ficha.descripcion}</p>
      )}
      <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
        {fila('Dificultad', ficha.dificultad)}
        {/* ⚠️ Apartado 11 — *"No confundir entorno con equipamiento"*: son dos
            filas, y el material tiene su bloque. */}
        {fila('Dónde', ficha.entornos.join(' · '))}
        {fila('Agarre', ficha.agarre)}
        {ficha.ejercicio.nombreTecnico && fila('También conocido como', ficha.ejercicio.nombreTecnico)}
      </div>
    </Card>
  );
}

/* ── ExerciseMuscleBreakdown (apartado 9) ──────────────────────────────────
   Grupo, subgrupo, porcentaje y papel, y la nota que dice lo que son: *"No
   presentarlos como una medición científica exacta"*. */
export function ExerciseMuscleBreakdown({ musculos = [], nota = '', accent }) {
  return (
    <div>
      <SectionTitle sub={nota}>Músculos</SectionTitle>
      <Card>
        {musculos.length === 0 ? (
          <p className="text-xs" style={{ color: COLORS.textMuted }}>Este ejercicio no tiene músculos indicados.</p>
        ) : musculos.map((m) => (
          <div key={m.subgrupoId} className="mb-2.5 last:mb-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-semibold truncate" style={{ color: COLORS.text }}>
                <span style={{ color: COLORS.textMuted }}>{m.grupo} · </span>{m.subgrupo}
              </span>
              <span className="text-[11px] shrink-0" style={{ color: COLORS.textMuted }}>
                {m.papel} · {m.porcentaje} %
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: hexToRgba(COLORS.border, 0.6) }}>
              <div className="h-full rounded-full" style={{ width: `${m.porcentaje}%`, background: m.principal ? accent : hexToRgba(accent, 0.45) }} />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ── ExerciseEquipment (apartado 10) ─────────────────────────────────────── */
export function ExerciseEquipment({ equipamiento = [], accent }) {
  return (
    <Card>
      <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: COLORS.textMuted }}>Material</p>
      {equipamiento.length === 0 ? (
        <p className="text-xs" style={{ color: COLORS.textMuted }}>Sin material indicado.</p>
      ) : (
        <div className="flex gap-1.5 flex-wrap">
          {equipamiento.map((e) => (
            <span key={e} className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1"
              style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}` }}>
              <Dumbbell size={12} style={{ color: accent }} aria-hidden="true" />{e}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ── ExerciseTechnique (apartados 14, 15 y 16) ─────────────────────────────
   «Cómo hacerlo» en pasos numerados **con lo que hay escrito**; errores y
   consejos, solo si existen. */
export function ExerciseTechnique({ tecnica, accent }) {
  if (!tecnica || !tecnica.hay) return null;
  return (
    <div>
      <SectionTitle sub="Con lo que hay escrito de este ejercicio">Cómo hacerlo</SectionTitle>
      <Card>
        {tecnica.pasos.length > 0 && (
          <ol className="space-y-2.5 mb-1">
            {tecnica.pasos.map((p) => (
              <li key={p.numero} className="flex gap-2.5">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: hexToRgba(accent, 0.14), color: accent }}>
                  {p.numero}
                </span>
                <span className="min-w-0">
                  <span className="text-xs font-bold block" style={{ color: COLORS.text }}>{p.titulo}</span>
                  <span className="text-sm block" style={{ color: COLORS.textMuted }}>{p.texto}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
        {tecnica.respiracion && (
          <p className="text-sm mt-2.5" style={{ color: COLORS.textMuted }}>
            <span className="font-bold" style={{ color: COLORS.text }}>Respiración: </span>{tecnica.respiracion}
          </p>
        )}
        {tecnica.errores.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-bold" style={{ color: COLORS.text }}>Errores frecuentes</p>
            <ul>
              {tecnica.errores.map((e) => (
                <li key={e} className="text-sm flex gap-2" style={{ color: COLORS.textMuted }}>
                  <span style={{ color: COLORS.negative }} aria-hidden="true">·</span>{e}
                </li>
              ))}
            </ul>
          </div>
        )}
        {tecnica.consejos.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-bold" style={{ color: COLORS.text }}>Consejos</p>
            <ul>
              {tecnica.consejos.map((c) => (
                <li key={c} className="text-sm flex gap-2" style={{ color: COLORS.textMuted }}>
                  <span style={{ color: accent }} aria-hidden="true">·</span>{c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ── ExerciseTutorial (apartado 17) ────────────────────────────────────────
   Solo con un recurso real; si no carga, se dice (apartado 37). Sin recurso,
   una frase y **ningún reproductor falso**. */
export function ExerciseTutorial({ tutorial, nombre = '' }) {
  const [roto, setRoto] = useState(false);
  if (!tutorial) {
    return <p className="text-xs px-1" style={{ color: COLORS.textMuted }}>{SIN_TUTORIAL}</p>;
  }
  return (
    <div>
      <SectionTitle>Tutorial</SectionTitle>
      <Card>
        {roto ? (
          <p className="text-xs" style={{ color: COLORS.textMuted }}>{TUTORIAL_ROTO}</p>
        ) : tutorial.tipo === 'video' ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={tutorial.src} controls playsInline className="w-full rounded-xl" aria-label={`Tutorial: ${nombre}`} onError={() => setRoto(true)} />
        ) : (
          <img src={tutorial.src} alt={`Tutorial: ${nombre}`} className="w-full rounded-xl" onError={() => setRoto(true)} />
        )}
      </Card>
    </div>
  );
}

/* ── ExerciseProgressions (apartado 18) ────────────────────────────────────
   La cadena de arriba abajo, con el paso actual marcado **con palabra**, no
   solo con color (apartado 35). Cada paso abre su ficha. */
export function ExerciseProgressions({ progresion, accent, onAbrir }) {
  if (!progresion) return null;
  return (
    <div>
      <SectionTitle sub={progresion.cadena.length ? 'Cada paso prepara el siguiente' : ''}>Progresión</SectionTitle>
      <Card>
        {progresion.cadena.length > 0 && (
          <ol aria-label="Progresión">
            {progresion.cadena.map((p, i) => (
              <li key={p.id}>
                {i > 0 && <ArrowDown size={14} className="mx-auto my-1" style={{ color: COLORS.textMuted }} aria-hidden="true" />}
                <button
                  onClick={() => !p.actual && onAbrir && onAbrir(p.id)}
                  disabled={p.actual || !onAbrir}
                  aria-current={p.actual ? 'step' : undefined}
                  aria-label={p.actual ? `${p.nombre}, estás aquí` : `Ver la ficha de ${p.nombre}`}
                  className="w-full rounded-xl px-3 py-2 text-sm font-semibold text-center toque-44"
                  style={{
                    background: p.actual ? hexToRgba(accent, 0.16) : COLORS.surface2,
                    color: p.actual ? accent : COLORS.text,
                    border: `1px solid ${p.actual ? accent : COLORS.border}`,
                  }}
                >
                  {p.nombre}{p.actual ? ' · aquí' : ''}
                </button>
              </li>
            ))}
          </ol>
        )}
        {progresion.antes.length > 0 && (
          <div className={progresion.cadena.length ? 'mt-3 pt-3' : ''} style={progresion.cadena.length ? { borderTop: `1px solid ${COLORS.border}` } : {}}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textMuted }}>Antes conviene dominar</p>
            {progresion.antes.map((p) => (
              <button key={p.id} onClick={() => onAbrir && onAbrir(p.id)} disabled={!onAbrir}
                aria-label={`Ver la ficha de ${p.nombre}`}
                className="w-full flex items-center gap-2 text-left py-2 toque-44">
                <span className="text-sm font-semibold min-w-0 flex-1" style={{ color: onAbrir ? accent : COLORS.text }}>{p.nombre}</span>
                <ChevronRight size={14} style={{ color: COLORS.textMuted }} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ── ExerciseVariants de la ficha (apartado 19) ─────────────────────────────
   ⚠️ No es el de la F29 aunque se parezca: aquél enseña las variantes **con
   historial** para ir a su progreso; éste enseña **todas** —la base, las
   hermanas y las suyas— para ir a su ficha. Cada una mantiene su identidad. */
const RELACION = { base: 'Ejercicio base', variante: 'Variante', hermana: 'Variante del mismo' };
export function ExerciseVariantsList({ variantes = [], accent, onAbrir }) {
  if (!variantes.length) return null;
  return (
    <div>
      <SectionTitle sub="Cada una es un ejercicio con su propio historial">Variantes</SectionTitle>
      <Card>
        {variantes.map((v) => (
          <button key={v.id} onClick={() => onAbrir && onAbrir(v.id)} disabled={!onAbrir}
            aria-label={`Ver la ficha de ${v.nombre}`}
            className="w-full flex items-center gap-2 text-left py-2 toque-44">
            <span className="min-w-0 flex-1">
              <span className="text-sm font-semibold block truncate" style={{ color: onAbrir ? accent : COLORS.text }}>{v.nombre}</span>
              {RELACION[v.relacion] && <span className="text-[11px] block" style={{ color: COLORS.textMuted }}>{RELACION[v.relacion]}</span>}
            </span>
            <ChevronRight size={14} style={{ color: COLORS.textMuted }} aria-hidden="true" />
          </button>
        ))}
      </Card>
    </div>
  );
}

/* ── ExerciseAlternatives (apartado 20) ────────────────────────────────────
   **Las de la F33**, con su nivel en palabra y su motivo. Aquí tocar una abre
   su ficha: es una biblioteca, no se está sustituyendo nada. */
export function ExerciseAlternatives({ alternativas, accent, onAbrir }) {
  const [todas, setTodas] = useState(false);
  if (!alternativas || !alternativas.items.length) return null;
  const items = todas && alternativas.todas ? alternativas.todas : alternativas.items;
  return (
    <div>
      <SectionTitle sub="Si hoy no puedes hacer éste">Alternativas</SectionTitle>
      <Card>
        {items.map((x) => (
          <button key={x.id} onClick={() => onAbrir && onAbrir(x.id)} disabled={!onAbrir}
            aria-label={`Ver la ficha de ${nombreCompleto(x.exercise)}. ${x.reasons[0] || ''}`}
            className="w-full flex items-start gap-2 text-left py-2 toque-44">
            <span className="min-w-0 flex-1">
              <span className="text-sm font-semibold block" style={{ color: onAbrir ? accent : COLORS.text }}>{nombreCompleto(x.exercise)}</span>
              <span className="block mt-0.5"><ReplacementCompatibility nivel={x.compatibilityLevel} /></span>
              {x.reasons[0] && <span className="text-[11px] block mt-0.5" style={{ color: COLORS.textMuted }}>{x.reasons[0]}</span>}
            </span>
            <ChevronRight size={14} className="mt-1" style={{ color: COLORS.textMuted }} aria-hidden="true" />
          </button>
        ))}
        {alternativas.total > alternativas.items.length && alternativas.todas && (
          <button onClick={() => setTodas(!todas)} className="text-xs font-bold py-2 px-1 toque-44" style={{ color: accent }}>
            {todas ? 'Ver menos' : `Ver las ${alternativas.total} alternativas`}
          </button>
        )}
      </Card>
    </div>
  );
}

/* ── Añadir a entrenamiento (apartado 21) ──────────────────────────────────
   Elegir uno que ya existe o crear uno nuevo, **sin empezar a entrenar**. */
export function ExerciseAddToWorkout({ entrenamientos = [], accent, onAnadir, onCrearNuevo, onCerrar }) {
  const [hecho, setHecho] = useState(null);
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold" style={{ color: COLORS.text }}>Añadir a entrenamiento</p>
        {onCerrar && (
          <button onClick={onCerrar} aria-label="Cerrar" className="p-1.5 -m-1.5 rounded-full toque-44">
            <X size={16} style={{ color: COLORS.textMuted }} />
          </button>
        )}
      </div>
      {hecho ? (
        <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: accent }}>
          <Check size={14} aria-hidden="true" />Añadido a {hecho}
        </p>
      ) : (
        <>
          {entrenamientos.length === 0 ? (
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Todavía no tienes entrenamientos guardados.</p>
          ) : (
            <div className="mt-2 space-y-1">
              {entrenamientos.map((p) => (
                <button key={p.id}
                  onClick={() => { if (onAnadir && onAnadir(p.id)) setHecho(p.nombre); }}
                  aria-label={`Añadir a ${p.nombre}`}
                  className="w-full flex items-center gap-2 text-left rounded-xl px-3 py-2 toque-44"
                  style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
                  <span className="text-sm font-semibold min-w-0 flex-1 truncate" style={{ color: COLORS.text }}>{p.nombre}</span>
                  <span className="text-[11px] shrink-0" style={{ color: COLORS.textMuted }}>{p.ejercicios} ejercicios</span>
                </button>
              ))}
            </div>
          )}
          {onCrearNuevo && (
            <div className="mt-2">
              <GhostBtn icon={Plus} onClick={onCrearNuevo}>Crear uno nuevo</GhostBtn>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

/* ── ExercisePersonalProgress (apartados 23-26) ────────────────────────────
   Lo suyo, **de la F29 y sin tocar**: el resumen de rendimiento, el rango, el
   objetivo y los últimos entrenamientos. Sin datos, la frase del apartado 23 —
   ni rango ni progreso ficticios (apartado 29). */
export function ExercisePersonalProgress({
  personal, accent, onVerProgreso = null, onVerObjetivo = null, onCrearObjetivo = null, onClasificar = null,
}) {
  if (!personal) return null;
  const objetivo = personal.objetivo;
  const activo = objetivo && objetivo.hay && !objetivo.conseguido;
  return (
    <div className="space-y-2">
      <SectionTitle>Tu progreso</SectionTitle>
      {personal.conDatos ? (
        <>
          <ExercisePerformanceSummary progreso={personal.progreso} accent={accent} />
          {personal.tendencia && personal.tendencia.nombre && (
            <p className="text-xs px-1" style={{ color: COLORS.textMuted }}>
              Tendencia: <span className="font-semibold" style={{ color: COLORS.text }}>{personal.tendencia.simbolo} {personal.tendencia.nombre}</span>
            </p>
          )}
        </>
      ) : (
        <Card><p className="text-xs" style={{ color: COLORS.textMuted }}>{personal.vacio}</p></Card>
      )}

      {personal.rango && personal.rango.hay ? (
        <ExerciseRankPreview rango={personal.rango} accent={accent} />
      ) : (
        <Card>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Rango</p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: COLORS.text }}>{personal.sinClasificacion}</p>
          {personal.puedeClasificar && onClasificar && (
            <button onClick={onClasificar} className="mt-1 text-xs font-bold py-2 px-1 toque-44" style={{ color: accent }}>
              Clasificar
            </button>
          )}
        </Card>
      )}

      {activo && <p className="text-[11px] font-bold uppercase tracking-wider px-1" style={{ color: COLORS.textMuted }}>Objetivo activo</p>}
      <ExerciseGoalPreview
        objetivo={objetivo}
        accent={accent}
        onAbrir={objetivo && objetivo.hay && onVerObjetivo ? () => onVerObjetivo(objetivo.objetivo.id) : null}
        onCrear={onCrearObjetivo}
      />

      {personal.ultimos.length > 0 && (
        <Card>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: COLORS.textMuted }}>Últimos entrenamientos</p>
          {personal.ultimos.map((u) => (
            <div key={u.sesionId || u.fecha} className="flex items-baseline justify-between gap-3 py-1.5">
              <span className="text-xs" style={{ color: COLORS.textMuted }}>{u.fechaTexto}</span>
              <span className="text-sm font-semibold tabular-nums text-right" style={{ color: COLORS.text }}>{u.seriesTexto || u.texto || '—'}</span>
            </div>
          ))}
        </Card>
      )}

      {personal.conDatos && onVerProgreso && (
        <div className="flex gap-2 flex-wrap">
          <PrimaryButton accent={accent} icon={Target} onClick={onVerProgreso}>Ver progreso</PrimaryButton>
          <GhostBtn onClick={onVerProgreso}>Ver historial</GhostBtn>
        </div>
      )}
    </div>
  );
}

/* ── El botón de favorito (apartado 22) ────────────────────────────────────
   ♡ «Añadir a favoritos» y ♥ «En favoritos», con palabra: el corazón solo no
   lo lee quien no ve el color (apartado 35). */
export function ExerciseFavoriteButton({ favorito = false, accent, onAlternar }) {
  if (!onAlternar) return null;
  return (
    <button
      onClick={onAlternar}
      aria-pressed={favorito}
      className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold toque-44 active:scale-95"
      style={{
        background: favorito ? hexToRgba(accent, 0.16) : COLORS.surface2,
        color: favorito ? accent : COLORS.text,
        border: `1px solid ${favorito ? accent : COLORS.border}`,
      }}
    >
      <Heart size={15} fill={favorito ? accent : 'none'} aria-hidden="true" />
      {favorito ? 'En favoritos' : 'Añadir a favoritos'}
    </button>
  );
}

/* Los botones de búsqueda y filtros de la cabecera, juntos. */
export function ExerciseSearchBar({ consulta, onConsulta, verFiltros, onVerFiltros }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1"><ExerciseSearch valor={consulta} onCambiar={onConsulta} /></div>
      <GhostBtn icon={verFiltros ? X : SlidersHorizontal} onClick={onVerFiltros}>
        {verFiltros ? 'Cerrar' : 'Filtros'}
      </GhostBtn>
    </div>
  );
}

export const COMPONENTES_FIT34 = [
  { nombre: 'ExerciseLibrary', es: 'EjerciciosView (F2), ampliada' },
  { nombre: 'ExerciseSearch', es: 'nuevo' },
  { nombre: 'ExerciseFilters', es: 'nuevo (las filas de la F2)' },
  { nombre: 'ExerciseFilterChip', es: 'la pastilla de la F2' },
  { nombre: 'ExerciseGrid', es: 'nuevo' },
  { nombre: 'ExerciseCard', es: 'TarjetaEjercicio (F2), mudada' },
  { nombre: 'ExerciseDetail', es: 'DetalleEjercicio (F2), ampliada' },
  { nombre: 'ExerciseHeader', es: 'nuevo' },
  { nombre: 'ExerciseMuscleBreakdown', es: 'la barra de músculo de la F2' },
  { nombre: 'ExerciseEquipment', es: 'nuevo' },
  { nombre: 'ExerciseTechnique', es: 'la técnica de la F2, en pasos' },
  { nombre: 'ExerciseTutorial', es: 'nuevo' },
  { nombre: 'ExerciseProgressions', es: 'nuevo' },
  { nombre: 'ExerciseVariants', es: 'ExerciseVariantsList (la de la F29 es de progreso)' },
  { nombre: 'ExerciseAlternatives', es: 'nuevo, sobre la F33' },
  { nombre: 'ExercisePersonalProgress', es: 'nuevo, sobre la F29' },
  { nombre: 'ExerciseGoalPreview', es: 'F29, reutilizado' },
  { nombre: 'ExerciseRankPreview', es: 'F29, reutilizado' },
];
