/* ===========================================================================
   ENTREGA 4 · FASE 25/45 — LOS BLOQUES DEL RESUMEN DE RANGOS

   🚨 **DE LOS NUEVE COMPONENTES DEL APARTADO 21, SEIS YA ESTABAN ESCRITOS.**
   El apartado dice *"Crear/reutilizar"* y en la línea siguiente *"Evitar
   componentes duplicados"*, así que aquí solo nacen los que faltaban:
   `RankDashboard`, `RankMuscleHighlights` y `RankClassificationPrompt`, más los
   dos estados que piden los apartados 31 y 32. Los demás viven donde nacieron y
   se importan: `RankCoverage` y `RankConfidence` (F20), `RankHistorySummary`
   (F22), `RankRelevantExercises` y `RankNextLevelCard` (F23), y la tarjeta
   grande del rango general es `RankOverviewCard` (F16). La tabla que lo dice es
   `COMPONENTES_FIT25`, y hay una comprobación que la lee.

   ⚠️ **`RankDashboard` RECIBE LOS BLOQUES YA PINTADOS** (y es la `ClassificationHub`
   de la F24 otra vez). La tarjeta del rango general, la escala y los rankings
   musculares viven en `src/views/RangosView.jsx`; importarlos desde aquí sería
   un ciclo `components → views`. Lo que este componente aporta es **el orden**
   —el del apartado 2, leído de `BLOQUES`— y que ninguna pantalla lo decida por
   su cuenta.
   =========================================================================== */

import React from 'react';
import { ChevronRight, ClipboardList, Sparkles, RotateCcw } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { Card, SectionTitle, PrimaryButton, Esqueleto } from './ui';
import { RankBadge, RankLabel } from './rangos';
import { BLOQUES, ETIQUETA_DESTACADOS, SUBTITULO_DESTACADOS, SIN_EVOLUCION } from '../lib/resumenRangos';

/* ═══ Apartado 9 · Los grupos destacados ═══════════════════════════════════
   🚨 El apartado 10 prohíbe llamarlo *"mejores músculos"* y explica por qué:
   *"No asumir que un rango superior significa mayor desarrollo físico"*. Por eso
   el rótulo es «Destacados» y debajo va la frase que dice de qué habla. */
export function RankMuscleHighlights({ destacados = [], accent, onMusculo = null }) {
  if (!destacados.length) return null;
  return (
    <div>
      <SectionTitle sub={SUBTITULO_DESTACADOS}>{ETIQUETA_DESTACADOS}</SectionTitle>
      <div className="space-y-2">
        {destacados.map((d) => {
          const dentro = (
            <>
              <RankBadge rank={d.rango} size="md" state="actual" accent={accent} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>{d.nombre}</p>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <RankLabel rank={d.rango} />
                  {/* ⚠️ Sin tendencia no se escribe nada: «Sin datos» al lado de
                      un rango es lo que el apartado 11 reserva para un grupo
                      que NO tiene datos, y éste sí los tiene. */}
                  {d.tendenciaNombre && (
                    <span className="text-[10px] font-semibold" style={{ color: accent }}>
                      {d.simbolo} {d.tendenciaNombre}
                    </span>
                  )}
                </div>
                <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{d.datos}</p>
              </div>
              {onMusculo && <ChevronRight size={16} style={{ color: COLORS.textMuted }} aria-hidden="true" />}
            </>
          );
          const clases = 'hub-card w-full text-left rounded-2xl p-3.5 flex items-center gap-3';
          const estilo = { background: COLORS.surface, border: `1px solid ${hexToRgba(accent, 0.35)}` };
          if (!onMusculo) return <div key={d.id} className={clases} style={estilo}>{dentro}</div>;
          return (
            <button
              key={d.id}
              onClick={() => onMusculo(d.id)}
              /* Apartado 29 — comprensible sin depender del color: el rango y la
                 tendencia van en palabras dentro del propio nombre accesible. */
              aria-label={`${d.nombre}: ${d.nombreRango}${d.tendenciaNombre ? `, ${d.tendenciaNombre}` : ''}. Ver su detalle`}
              className={`${clases} active:scale-[0.99]`}
              style={estilo}
            >
              {dentro}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══ Apartados 7, 8, 17 y 18 · La evolución ═══════════════════════════════
   ⚠️ Apartado 18, literal: *"No mostrar una tarjeta vacía. La sección puede
   desaparecer"*. Sin cambio reciente, esto devuelve `null` y no queda un hueco.
   ⚠️ Y apartado 30: nada de confeti ni de vibración. La tarjeta entra con la
   animación suave que ya está en `index.css` y respeta «Reducir movimiento». */
export function RankRecentChange({ evolucion, accent }) {
  const e = evolucion || null;
  if (!e || !e.tarjeta) return null;
  return (
    <Card className="aviso-entra" style={{ border: `1px solid ${hexToRgba(accent, 0.45)}` }}>
      <div className="flex items-center gap-3">
        <Sparkles size={18} style={{ color: accent }} aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{e.tarjeta.titulo}</p>
          <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
            {e.tarjeta.desde} → <span className="font-semibold" style={{ color: accent }}>{e.tarjeta.hasta}</span>
          </p>
          {/* Apartado 17 — la fecha REAL, la que devuelve el historial de la F22. */}
          <p className="text-[10px] mt-0.5" style={{ color: COLORS.textMuted }}>{e.tarjeta.fecha}</p>
        </div>
      </div>
    </Card>
  );
}

/** Apartado 8 — sin historial se dice, no se dibuja una tendencia inventada. */
export function RankEvolutionLine({ evolucion, accent, onHistorial = null }) {
  const e = evolucion || null;
  const texto = e && e.hay ? e.texto : SIN_EVOLUCION;
  if (!texto) return null;
  const dentro = (
    <>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Evolución reciente</p>
        <p className="text-xs mt-0.5" style={{ color: COLORS.text }}>{texto}</p>
        {e && e.dentro && <p className="text-[11px] mt-0.5 font-semibold" style={{ color: accent }}>{e.dentro}</p>}
      </div>
      {onHistorial && <ChevronRight size={16} style={{ color: COLORS.textMuted }} aria-hidden="true" />}
    </>
  );
  if (!onHistorial) return <Card><div className="flex items-center gap-3">{dentro}</div></Card>;
  /* ⚠️ El botón va DENTRO de la `Card`, con el relleno de la tarjeta. Quitárselo
     con un `p-0` en su `className` no habría funcionado —`p-5` y `p-0` son la
     misma propiedad y gana el que va después en la hoja, no en el atributo—, que
     es la lección de la lupa de SF F1. */
  return (
    <Card>
      <button
        onClick={onHistorial}
        aria-label={`Evolución reciente: ${texto}. Ver el historial`}
        className="w-full text-left flex items-center gap-3 toque-44"
      >
        {dentro}
      </button>
    </Card>
  );
}

/* ═══ Apartados 14 y 15 · La clasificación pendiente ═══════════════════════
   🚨 Apartado 15, literal: *"Si la cola está vacía: no mostrar una tarjeta de
   tarea pendiente"*. Con la cola vacía queda **una línea**, y solo si se quiere
   decir; una tarjeta con un botón que no tiene nada que clasificar sería el
   control decorativo de la regla 8. */
export function RankClassificationPrompt({ clasificacion, accent, onClasificar = null }) {
  const c = clasificacion || null;
  if (!c) return null;
  if (!c.pendiente) {
    return (
      <p className="text-[11px] text-center" style={{ color: COLORS.textMuted }}>{c.texto}</p>
    );
  }
  return (
    <Card>
      <div className="flex items-start gap-3">
        <ClipboardList size={18} style={{ color: accent }} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{c.titulo}</p>
          <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{c.texto}</p>
        </div>
      </div>
      {onClasificar && (
        <div className="mt-3">
          <PrimaryButton onClick={onClasificar} accent={accent} icon={ClipboardList}>{c.cta}</PrimaryButton>
        </div>
      )}
    </Card>
  );
}

/* ═══ Apartado 31 · Si el motor falla ══════════════════════════════════════
   🚨 *"No mostrar datos parcialmente corruptos como si fueran correctos"*. */
export function RankDashboardError({ error, accent, onReintentar = null }) {
  if (!error) return null;
  return (
    <Card>
      <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{error.titulo}</p>
      <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{error.que}</p>
      {onReintentar && (
        <div className="mt-3">
          <PrimaryButton onClick={onReintentar} accent={accent} icon={RotateCcw}>{error.cta}</PrimaryButton>
        </div>
      )}
    </Card>
  );
}

/* ═══ Apartado 32 · La carga ═══════════════════════════════════════════════
   ⚠️ *"Usar skeletons sencillos"*, y con la forma de lo que va a llegar (E3 F14):
   la tarjeta grande arriba y tres bloques debajo. */
export function RankDashboardSkeleton() {
  return <Esqueleto alturas={[180, 96, 72, 120]} etiqueta="Calculando tus rangos" />;
}

/* ═══ Apartados 2, 20 y 27 · El contenedor ═════════════════════════════════
   🚨 **El orden lo manda `BLOQUES`, no el JSX.** Así la jerarquía del apartado 2
   está escrita en un solo sitio y una fase futura que la cambie no tiene que
   acordarse de tocar también la pantalla.

   ⚠️ Apartado 20 — *"No crear cuatro UIs completamente distintas"*: no hay un
   `if` por estado de datos. Un bloque que no tiene nada que decir **no llega**
   (su nodo es `null`), y desaparece solo. */
export function RankDashboard({ resumen, bloques = {}, accent, cargando = false, onReintentar = null, extra = null }) {
  if (cargando) return <RankDashboardSkeleton />;
  const r = resumen || null;
  if (r && r.error) return <RankDashboardError error={r.error} accent={accent} onReintentar={onReintentar} />;
  const orden = (r && r.bloques && r.bloques.length ? r.bloques : BLOQUES);
  return (
    <div className="space-y-5">
      {orden.map((b) => {
        const nodo = bloques[b.id];
        if (!nodo) return null;
        return <div key={b.id}>{nodo}</div>;
      })}
      {extra}
    </div>
  );
}
