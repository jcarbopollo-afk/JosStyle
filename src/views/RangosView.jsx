/* ===========================================================================
   ENTREGA 4 · FASE 16/45 — FITNESS → RANGOS, LA PANTALLA

   *"Antes de modificar nada, inspecciona la implementación real de la Fase 15.
   NO vuelvas a implementar la lógica de rangos."*

   Así que esta pantalla **no calcula nada**: pide una vez `pantallaDeRangos`
   (que a su vez pide una vez `rangoGlobal`, F15) y reparte el resultado por las
   cinco secciones del apartado 1 —Rango Predicho, los diez rangos, clasificar
   ejercicios, tu cuerpo y los rankings musculares—.

   🚨 **Nada de lo que se ve está inventado** (apartado 25). Si no hay sesiones
   con series marcadas no hay rango, y lo que se enseña es «Sin Rango» con el
   motivo: nunca un «Iniciación» de consolación ni un 0 % que parezca un
   suspenso.

   ⚠️ **El hexágono es `RankBadge`** (F15). Esta pantalla no dibuja el suyo:
   dos hexágonos del mismo rango acabarían separándose (apartado 17).
   =========================================================================== */

import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, Check, Star, Lock, X, Dumbbell, ClipboardList } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { Card, SectionTitle, PrimaryButton, GhostBtn } from '../components/ui';
import { RankBadge, RankLabel } from '../components/rangos';
import { iconoDeGrupo } from '../components/iconosFitness';
import { CTA_CLASIFICAR, SIN_RANGO, nivelRango } from '../lib/fitness';
import { pantallaDeRangos, detalleDeRango } from '../lib/pantallaRangos';
/* FIT F20 — la explicación de un rango, la misma en los tres sitios. */
import { RankExplanation, BotonPorQue } from '../components/explicacionRango';
/* FIT F22 — el historial del rango, colgando del rango global (su apartado 30). */
import { RankHistory, BotonHistorial } from '../components/historialRango';
/* FIT F23 — qué falta para el siguiente rango, debajo del rango general. */
import { RankNextLevelCard } from '../components/siguienteRango';
import { tarjetaSiguienteRango } from '../lib/siguienteRango';
import { explicacionGlobal } from '../lib/explicacionRangos';
/* FIT F18 — el detalle de un grupo muscular, dentro de Rangos. */
import DetalleMuscularView from './DetalleMuscularView';
/* 🔓 FIT F25 — la pantalla deja de pedir sus datos por trozos: una instantánea
   (apartado 24) y la jerarquía del apartado 2, que vive en `BLOQUES`. */
import { resumenDeRangos, DESTINO_GLOBAL } from '../lib/resumenRangos';
import { RankConfidence, RankCoverage } from '../components/explicacionRango';
import { RankRelevantExercises } from '../components/siguienteRango';
import {
  RankDashboard, RankMuscleHighlights, RankRecentChange, RankEvolutionLine,
  RankClassificationPrompt,
} from '../components/resumenRangos';

/* ⚠️ **`DESTINO_GLOBAL` se importa, ya no se declara aquí** (FIT F25). Estaba
   escrito en esta vista y otra vez dentro de `resumenRangos.js`: dos objetos que
   significan lo mismo acaban separándose, y además un objeto nuevo en cada
   render invalidaría el `useMemo` de `RankHistory` en cada pintado. */

/* Los estados del apartado 20: **nunca solo color**. Cada uno lleva su icono y
   su palabra, porque un hexágono gris y otro azul no se distinguen con una
   pantalla al sol —ni con daltonismo—. */
const ESTADOS = {
  conseguido: { icono: Check, palabra: 'Conseguido' },
  actual: { icono: Star, palabra: 'Actual' },
  bloqueado: { icono: Lock, palabra: 'Bloqueado' },
  no_disponible: { icono: Lock, palabra: 'Sin clasificar' },
};

/* ── Una barra, y lo que mide dicho al lado ──────────────────────────────── */
/* ⚠️ Las dos barras de esta pantalla miden cosas distintas —cuánta información
   hay y cuánto falta para el siguiente rango—, así que **ninguna va suelta**:
   siempre con su etiqueta. Una barra sin nombre se lee como «lo llevas al
   40 %», que es lo que el apartado 5 pide no dar a entender. */
function Barra({ fraccion, accent, etiqueta }) {
  const pct = Math.max(0, Math.min(100, Math.round((Number(fraccion) || 0) * 100)));
  return (
    <div
      className="h-1.5 rounded-full overflow-hidden"
      style={{ background: hexToRgba(COLORS.border, 0.6) }}
      role="img"
      aria-label={`${etiqueta}: ${pct} %`}
    >
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: accent }} />
    </div>
  );
}

/* ── 3, 4, 5 y 6 · La tarjeta grande ─────────────────────────────────────── */
export function RankOverviewCard({ datos, accent, onPorQue = null, onHistorial = null, confianza = null }) {
  const d = datos || {};
  const sin = d.sinRango || null;
  const cobertura = d.cobertura || { texto: '', fraccion: 0 };
  const siguiente = d.siguiente || null;
  const nivelSiguiente = siguiente && siguiente.siguiente ? nivelRango(siguiente.siguiente) : null;
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
          Rango Predicho
        </p>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* FIT F20, apartado 2 — desde aquí se abre la explicación del global. */}
          <BotonPorQue onAbrir={onPorQue} etiqueta="Por qué tu rango general" />
          {/* FIT F22, apartado 30 — y aquí mismo, su historial. */}
          <BotonHistorial onAbrir={onHistorial} etiqueta="Historial de tu rango general" />
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3">
        {/* 🚨 Apartado 4 — sin datos, el hexágono va bloqueado y vacío. No hay
            un «1» esperando: el 1 es un rango que se gana. */}
        <RankBadge
          rank={sin ? null : d.global.rango}
          size="xl"
          state={sin ? 'no_disponible' : 'actual'}
          locked={!!sin}
          accent={accent}
        />
        <div className="min-w-0">
          <p className="text-2xl font-extrabold leading-tight" style={{ color: sin ? COLORS.text : accent, fontFamily: "'Manrope', sans-serif" }}>
            {sin ? SIN_RANGO.nombre : d.global.nombre}
          </p>
          <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>
            {sin ? sin.que : d.descripcion}
          </p>
          {!sin && d.global.provisional && (
            <p className="text-[11px] mt-1" style={{ color: COLORS.textMuted }}>Clasificación provisional</p>
          )}
        </div>
      </div>

      {/* Apartado 5 — la cobertura, en segundo plano y diciendo qué mide. */}
      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-2 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Cobertura</span>
          <span className="text-xs font-semibold" style={{ color: COLORS.text }}>{cobertura.texto}</span>
        </div>
        <Barra fraccion={cobertura.fraccion} accent={accent} etiqueta="Grupos musculares con datos" />
        <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>
          Mide cuánta información tiene el cálculo, no tu forma física.
        </p>
        {/* 🔓 FIT F25, apartado 6 — la confianza, al lado de la cobertura porque
            las dos hablan de lo mismo: de cuántos datos hay, no de su cuerpo.
            ⚠️ Es **la del motor**; aquí solo se enseña. */}
        {confianza && (
          <p className="text-[11px] font-semibold mt-2" style={{ color: COLORS.text }}>
            {confianza.etiqueta}
          </p>
        )}
      </div>

      {/* Apartado 6 — el camino al siguiente, solo si hay rango. */}
      {siguiente && (
        <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          {nivelSiguiente ? (
            <>
              <div className="flex items-baseline justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Próximo rango</span>
                <span className="text-xs font-semibold" style={{ color: COLORS.text }}>{d.global.nombre} → {nivelSiguiente.nombre}</span>
              </div>
              <Barra fraccion={siguiente.fraccion} accent={accent} etiqueta={`Camino hacia ${nivelSiguiente.nombre}`} />
            </>
          ) : (
            /* ⚠️ Y en el diez no se inventa un once. */
            <p className="text-xs font-semibold" style={{ color: COLORS.text }}>Rango máximo de la escala</p>
          )}
        </div>
      )}
    </Card>
  );
}

/* ── 7 y 8 · Los diez rangos ─────────────────────────────────────────────── */
export function RankItem({ nivel, accent, onAbrir }) {
  const e = ESTADOS[nivel.estado] || ESTADOS.no_disponible;
  const Icono = e.icono;
  const actual = nivel.estado === 'actual';
  return (
    <button
      onClick={() => onAbrir && onAbrir(nivel.orden)}
      aria-label={`Rango ${nivel.nombre}, ${e.palabra}`}
      className="rounded-2xl p-3 flex flex-col items-center gap-1.5 active:scale-[0.98] transition-transform"
      style={{
        background: actual ? hexToRgba(accent, 0.12) : COLORS.surface,
        border: `1px solid ${actual ? accent : COLORS.border}`,
      }}
    >
      <RankBadge
        rank={nivel.orden}
        size="md"
        state={nivel.estado}
        locked={nivel.estado === 'bloqueado' || nivel.estado === 'no_disponible'}
        accent={accent}
      />
      <span className="text-[11px] font-bold text-center leading-tight" style={{ color: actual ? COLORS.text : COLORS.textMuted }}>
        {nivel.nombre}
      </span>
      <span className="flex items-center gap-1 text-[10px]" style={{ color: actual ? accent : COLORS.textMuted }}>
        <Icono size={10} aria-hidden="true" />
        {e.palabra}
      </span>
    </button>
  );
}

export function RankList({ escala = [], accent, onAbrir }) {
  return (
    /* Apartado 7 — cuadrícula, dos columnas en el iPhone pequeño. ⚠️ En
       columnas caben los diez sin carril horizontal (apartado 19). */
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
      {escala.map((n) => <RankItem key={n.id} nivel={n} accent={accent} onAbrir={onAbrir} />)}
    </div>
  );
}

/** La hoja del apartado 8: *"no abrir una pantalla compleja"*. 🚨 Va con
 *  `createPortal` (regla 3 del proyecto): un `fixed inset-0` dentro de un
 *  contenedor con transformaciones se ancla al contenedor, no al iPhone. */
export function HojaDeRango({ detalle, accent, onCerrar }) {
  if (!detalle || typeof document === 'undefined') return null;
  const e = ESTADOS[detalle.estado] || ESTADOS.no_disponible;
  const Icono = e.icono;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-label={`Rango ${detalle.nombre}`}
    >
      <div
        className="w-full max-w-md rounded-t-3xl p-5 space-y-4"
        style={{ background: COLORS.surface, paddingBottom: 'calc(var(--safe-bottom) + 1.25rem)' }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <RankBadge
            rank={detalle.orden}
            size="lg"
            state={detalle.estado}
            locked={detalle.estado === 'bloqueado' || detalle.estado === 'no_disponible'}
            accent={accent}
          />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-extrabold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{detalle.nombre}</p>
            <p className="flex items-center gap-1 text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
              <Icono size={11} aria-hidden="true" />
              {e.palabra}
            </p>
          </div>
          <button onClick={onCerrar} className="p-2 rounded-full flex-shrink-0 toque-44" style={{ background: COLORS.surface2 }} aria-label="Cerrar">
            <X size={16} style={{ color: COLORS.text }} />
          </button>
        </div>
        <p className="text-sm" style={{ color: COLORS.text }}>{detalle.que}</p>
        <p className="text-xs" style={{ color: COLORS.textMuted }}>{detalle.mensaje}</p>
        {/* ⚠️ El umbral de la escala, que es igual para todo el mundo. La
            puntuación de Josué sigue sin salir en ningún sitio (F15). */}
        <p className="text-xs pt-3" style={{ color: COLORS.textMuted, borderTop: `1px solid ${COLORS.border}` }}>
          Empieza en <span className="font-bold" style={{ color: COLORS.text }}>{detalle.umbral}</span> de 1000 puntos de rendimiento.
        </p>
      </div>
    </div>,
    document.body,
  );
}

/* ── 9 · Clasificar ejercicios ───────────────────────────────────────────── */
/* 🚨 Sin botón. El cuestionario es la fase siguiente (apartado 9: *"en esta fase
   NO construir todavía el cuestionario"*), y la regla 8 del proyecto prohíbe un
   control que no hace nada. Lo que sí es real es el recuento —y cómo se
   clasifica un ejercicio: entrenándolo—, así que eso es lo que se dice. */
export function RankClassificationCard({ clasificacion, accent, onEntrenar, onClasificar = null }) {
  const c = clasificacion || { clasificados: 0, total: 0, restantes: 0, texto: '' };
  const fraccion = c.total > 0 ? c.clasificados / c.total : 0;
  return (
    <Card>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{CTA_CLASIFICAR.texto}</p>
        <p className="text-xs font-semibold" style={{ color: COLORS.text }}>{c.texto}</p>
      </div>
      <div className="mt-2">
        <Barra fraccion={fraccion} accent={accent} etiqueta="Ejercicios con rango" />
      </div>
      <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>{CTA_CLASIFICAR.mientrasTanto}</p>
      {/* 🔓 FIT F17 — el CTA del apartado 1 de esa fase, con los que faltan. Ya
          no es una frase declarada: abre el cuestionario de verdad. */}
      <div className="mt-3 flex flex-col gap-2">
        {onClasificar && (
          <PrimaryButton onClick={onClasificar} accent={accent} icon={ClipboardList}>
            {CTA_CLASIFICAR.texto}
            {clasificacion.recomendados > 0 ? ` · ${clasificacion.recomendados} recomendados` : ''}
          </PrimaryButton>
        )}
        {onEntrenar && (
          onClasificar
            ? <GhostBtn onClick={onEntrenar} icon={Dumbbell}>Entrenar ahora</GhostBtn>
            : <PrimaryButton onClick={onEntrenar} accent={accent} icon={Dumbbell}>Entrenar ahora</PrimaryButton>
        )}
      </div>
    </Card>
  );
}

/* ── 10 · Tu cuerpo ──────────────────────────────────────────────────────── */
/* ⚠️ **No hay ilustración anatómica en el proyecto**, y el apartado 10 dice
   *"utilizar la ilustración anatómica existente si ya existe"*. No existe, así
   que no se dibuja un cuerpo aproximado ni se pinta un mapa que no corresponde
   a nada: van los siete iconos reales del catálogo. Y cada uno **lleva al
   detalle de la F13**, así que la indicación «toca un grupo muscular» es cierta
   —que es la condición que pone el propio apartado—. */
export function AnatomyPreview({ musculos = [], accent, onMusculo }) {
  return (
    <Card>
      <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>Tu cuerpo</p>
      <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
        {onMusculo ? 'Toca un grupo muscular para ver su rango.' : 'Tu nivel por zona del cuerpo.'}
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-3">
        {musculos.map((m) => {
          const Icono = iconoDeGrupo(m.id);
          const dentro = (
            <>
              <Icono size={18} style={{ color: m.sinRango ? COLORS.textMuted : accent }} aria-hidden="true" />
              <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: COLORS.textMuted }}>{m.nombre}</span>
            </>
          );
          const estilo = { background: COLORS.surface2, border: `1px solid ${m.sinRango ? COLORS.border : hexToRgba(accent, 0.4)}` };
          const clases = 'rounded-xl p-2 flex flex-col items-center gap-1';
          if (!onMusculo) return <div key={m.id} className={clases} style={estilo}>{dentro}</div>;
          return (
            <button
              key={m.id}
              onClick={() => onMusculo(m.id)}
              className={`${clases} active:scale-[0.98] transition-transform`}
              style={estilo}
              aria-label={`${m.nombre}: ${m.nombreRango}`}
            >
              {dentro}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/* ── 11 a 15 · Rankings musculares ───────────────────────────────────────── */
export function MuscleRankCard({ musculo, accent, onAbrir }) {
  const m = musculo;
  const nivelSiguiente = m.siguiente && m.siguiente.siguiente ? nivelRango(m.siguiente.siguiente) : null;
  const dentro = (
    <>
      <RankBadge rank={m.rango} size="md" state={m.sinRango ? 'no_disponible' : 'actual'} locked={m.sinRango} accent={accent} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>{m.nombre}</p>
        <div className="flex items-baseline gap-2">
          <RankLabel rank={m.rango} />
          <span className="text-[10px]" style={{ color: COLORS.textMuted }}>{m.datos}</span>
        </div>
        {/* Apartado 12 — un grupo sin datos no lleva barra: una barra a cero
            diría «vas fatal» cuando lo que pasa es que no lo has entrenado. */}
        {nivelSiguiente && (
          <div className="mt-1.5">
            <Barra fraccion={m.siguiente.fraccion} accent={accent} etiqueta={`${m.nombre}, camino hacia ${nivelSiguiente.nombre}`} />
          </div>
        )}
      </div>
      {onAbrir && <ChevronRight size={16} style={{ color: COLORS.textMuted }} aria-hidden="true" />}
    </>
  );
  const clases = 'hub-card w-full text-left rounded-2xl p-3.5 flex items-center gap-3';
  const estilo = { background: COLORS.surface, border: `1px solid ${COLORS.border}` };
  if (!onAbrir) return <div className={clases} style={estilo}>{dentro}</div>;
  return (
    <button
      onClick={() => onAbrir(m.id)}
      aria-label={`${m.nombre}: ${m.nombreRango}. Ver detalle`}
      className={`${clases} active:scale-[0.99]`}
      style={estilo}
    >
      {dentro}
    </button>
  );
}

export function MuscleRankings({ musculos = [], accent, onMusculo }) {
  return (
    <div>
      <SectionTitle sub="Tu nivel en cada zona del cuerpo">Rankings musculares</SectionTitle>
      <div className="space-y-2">
        {musculos.map((m) => <MuscleRankCard key={m.id} musculo={m} accent={accent} onAbrir={onMusculo} />)}
      </div>
    </div>
  );
}

/* ── La pantalla ─────────────────────────────────────────────────────────── */
export default function RangosView({ fitness = null, propios = [], perfil = null, accent, onEntrenar = null, onClasificar = null, onEjercicio = null }) {
  /* 🚨 Apartado 22 — **una sola vez por cambio en las sesiones**. `rangoGlobal`
     recorre todas las sesiones y todos los ejercicios: pedirlo por sección lo
     haría ocho veces en cada render. */
  /* 🔓 **FIT F25 — una instantánea, no dos** (apartado 24: *"Evitar múltiples
     llamadas repetidas […] obtener una instantánea de datos del RankEngine y
     derivar el dashboard"*). Hasta aquí la pantalla pedía `pantallaDeRangos` y
     `tarjetaSiguienteRango` por separado, y cada una recorre las sesiones
     enteras; ahora sale todo de `resumenDeRangos`. ⚠️ Y el `useMemo` depende
     también de `clasificaciones`, porque la cola de la F24 y el rango efectivo
     de la F19 cambian al clasificar (apartado 25). */
  const resumen = useMemo(
    () => resumenDeRangos(fitness || {}, { propios, perfil }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fitness && fitness.sesiones, fitness && fitness.clasificaciones, propios, perfil],
  );
  const datos = resumen.datos;
  /* Qué rango está abierto en la hoja, y qué grupo muscular se está mirando:
     estado de pantalla, nunca un dato. */
  const [abierto, setAbierto] = useState(null);
  /* 🔓 FIT F18 — tocar un grupo abre **aquí** su detalle de rangos (su
     apartado 1: *"Rangos → Espalda → Dorsales → Dominadas"*). ⚠️ La F16 mandaba
     a la pantalla muscular de Progreso para no duplicar; son preguntas
     distintas —«qué nivel tengo y de dónde sale» frente a «cómo evoluciona mi
     rendimiento»— y las dos siguen existiendo, cada una en su sitio. Lo que no
     se duplica es el cálculo. */
  const [musculo, setMusculo] = useState(null);
  /* FIT F20 — si está abierta la explicación del rango general. */
  const [porQue, setPorQue] = useState(false);
  /* FIT F22 — y si está abierto su historial. Estado de pantalla (EH F40). */
  const [historial, setHistorial] = useState(false);
  const detalle = abierto && datos
    ? detalleDeRango(abierto, datos.global.sinRango ? null : datos.global.rango)
    : null;
  const siguiente = resumen.siguiente;

  /* Va DESPUÉS de los hooks (regla 4). */
  if (musculo) {
    return (
      <DetalleMuscularView
        fitness={fitness}
        propios={propios}
        perfil={perfil}
        grupoId={musculo}
        accent={accent}
        onVolver={() => setMusculo(null)}
        onEjercicio={onEjercicio}
      />
    );
  }

  /* 🚨 **Apartado 31 — si el motor falla, no se pinta media pantalla.** */
  if (resumen.error || !datos) {
    return (
      <div className="max-w-2xl mx-auto">
        <RankDashboard resumen={resumen} accent={accent} onReintentar={onEntrenar} />
      </div>
    );
  }

  /* 🚨 **La jerarquía del apartado 2, y la decide `BLOQUES`, no este JSX.**
     Cada bloque llega ya pintado y `RankDashboard` los ordena; uno que no tenga
     nada que decir llega como `null` y desaparece solo (apartado 18). */
  const bloques = {
    global: (
      <RankOverviewCard
        datos={datos}
        accent={accent}
        confianza={resumen.confianza}
        onPorQue={() => setPorQue(true)}
        onHistorial={() => setHistorial(true)}
      />
    ),
    /* Apartado 16 — *"No crear otra fórmula"*: es la tarjeta de la F23. */
    siguiente: <RankNextLevelCard tarjeta={siguiente} accent={accent} onPorQue={() => setPorQue(true)} />,
    /* Apartados 5 y 6 — cobertura y confianza, con los componentes de la F20. */
    cobertura: (resumen.cobertura || resumen.confianza) ? (
      <Card>
        <div className="space-y-3">
          <RankCoverage cobertura={resumen.cobertura} accent={accent} />
          <RankConfidence texto={resumen.confianza ? resumen.confianza.texto : null} />
        </div>
      </Card>
    ) : null,
    /* Apartados 7, 8, 17 y 18. */
    evolucion: (
      <div className="space-y-3">
        <RankRecentChange evolucion={resumen.evolucion} accent={accent} />
        <RankEvolutionLine evolucion={resumen.evolucion} accent={accent} onHistorial={() => setHistorial(true)} />
      </div>
    ),
    /* Apartados 9, 10 y 11 — los destacados suben; la lista de los siete se
       queda debajo, porque la F16 prometió en su apartado 14 que siempre se
       reconoce dónde está cada grupo. */
    musculos: (
      <div className="space-y-5">
        <RankMuscleHighlights destacados={resumen.destacados} accent={accent} onMusculo={setMusculo} />
        <AnatomyPreview musculos={datos.musculos} accent={accent} onMusculo={setMusculo} />
        <MuscleRankings musculos={datos.musculos} accent={accent} onMusculo={setMusculo} />
      </div>
    ),
    /* Apartados 12 y 13 — los ejercicios de los grupos destacados. */
    ejercicios: resumen.ejercicios.hay ? (
      <Card>
        <RankRelevantExercises
          relevantes={resumen.ejercicios.relevantes}
          etiqueta={resumen.ejercicios.etiqueta}
          accent={accent}
          onAbrir={onEjercicio}
        />
      </Card>
    ) : null,
    /* Apartados 14 y 15. */
    clasificacion: (
      <div className="space-y-5">
        <RankClassificationPrompt clasificacion={resumen.clasificacion} accent={accent} onClasificar={onClasificar} />
        <RankClassificationCard
          clasificacion={datos.clasificacion}
          accent={accent}
          onClasificar={onClasificar}
          /* El único botón de la pantalla, y hace lo que dice: entrenar es
             literalmente cómo se clasifica un ejercicio. */
          onEntrenar={datos.clasificacion.restantes > 0 ? onEntrenar : null}
        />
      </div>
    ),
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <RankDashboard resumen={resumen} bloques={bloques} accent={accent} />

      {/* ⚠️ La escala de los diez rangos **no es uno de los siete bloques** del
          apartado 2: es material de referencia, y el apartado 27 quiere que la
          principal sea un resumen. Sigue entera, debajo de lo que contesta
          «¿cómo estoy?». */}
      <div>
        <SectionTitle sub="Los diez niveles de la escala">Rangos</SectionTitle>
        <RankList escala={datos.escala} accent={accent} onAbrir={setAbierto} />
      </div>

      {historial && (
        <RankHistory
          fitness={fitness || {}}
          destino={DESTINO_GLOBAL}
          propios={propios}
          perfil={perfil}
          accent={accent}
          onCerrar={() => setHistorial(false)}
        />
      )}

      {porQue && (
        <RankExplanation
          explicacion={explicacionGlobal(fitness || {}, { propios, perfil })}
          accent={accent}
          onCerrar={() => setPorQue(false)}
          onEntrenar={onEntrenar ? () => { setPorQue(false); onEntrenar(); } : null}
          onClasificar={onClasificar ? () => { setPorQue(false); onClasificar(); } : null}
        />
      )}

      <HojaDeRango detalle={detalle} accent={accent} onCerrar={() => setAbierto(null)} />
    </div>
  );
}
