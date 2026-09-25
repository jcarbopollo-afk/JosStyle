/* ===========================================================================
   ENTREGA 4 · FASE 6/45 — TU PLAN, LA PANTALLA

   El criterio de finalización pide encontrar **Tu Plan → Próximo entrenamiento
   → Semana → Tus plantillas** *"realmente conectados"*, y el apartado 1 lo
   resume: *"Debe sentirse como el centro de control del entrenamiento."*

   🚨 **ESTA PANTALLA NO CALCULA NADA.** Qué día del plan toca hoy, el estado de
   cada día de la semana, cuál es el próximo entrenamiento, la distribución
   semanal y qué plantillas enseñar salen de `src/lib/tuPlan.js`; los ejercicios
   de una sesión, de `lineasDeDia()` (F5) — el apartado 9 lo pide con esas
   palabras: *"No crear un tercer sistema diferente para representar
   ejercicios."*

   🚨 **Y NO HAY NINGÚN BOTÓN QUE EMPIECE UN ENTRENAMIENTO** (apartado 6): *"En
   esta fase NO debe comenzar todavía el entrenamiento real […] No crear botones
   muertos. Si todavía no puede existir una acción funcional completa, usar una
   acción de navegación que sí exista."* El CTA es **Ver entrenamiento**, y abre
   la sesión de ese día, que existe de verdad.

   ⚠️ **El orden lo fija el apartado 21**: próximo entrenamiento, plan activo,
   semana, plantillas. *"No quiero una página llena de widgets."*
   =========================================================================== */

import React, { useState, useMemo } from 'react';
import {
  ChevronRight, Dumbbell, Plus, Repeat, Moon, Calendar, X, Play,
} from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { Card, SectionTitle, GhostBtn, PrimaryButton } from '../components/ui';
import { iconoDeGrupo } from '../components/iconosFitness';
import {
  tuPlan, sesionDelDia, SIN_PLAN, PLAN_PERDIDO, DESCANSO_HOY,
} from '../lib/tuPlan';
import { resumenDeActividad } from '../lib/actividadEntrenamiento';
import { TrainingPlanAdherence } from '../components/actividadEntrenamiento';

/* ── El estado sin plan (apartado 2) ───────────────────────────────────────
   *"mostrar un estado vacío premium"*, con sus dos salidas reales: la
   biblioteca y el constructor. Un vacío sin salida es una pantalla rota. */
export function SinPlan({ accent, onExplorar, onCrear }) {
  return (
    <Card>
      <div className="py-6 text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: hexToRgba(accent, 0.14), color: accent }}
        >
          <Calendar size={26} />
        </div>
        <p className="text-base font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {SIN_PLAN.titulo}
        </p>
        <p className="text-xs mt-1.5 max-w-xs mx-auto" style={{ color: COLORS.textMuted }}>
          {SIN_PLAN.texto}
        </p>
        <div className="flex gap-2 justify-center flex-wrap mt-4">
          {onExplorar && (
            <PrimaryButton accent={accent} icon={ChevronRight} onClick={onExplorar}>
              {SIN_PLAN.explorar}
            </PrimaryButton>
          )}
          {onCrear && <GhostBtn icon={Plus} onClick={onCrear}>{SIN_PLAN.crear}</GhostBtn>}
        </div>
      </div>
    </Card>
  );
}

/* ── El plan que ya no está (apartado 25) ──────────────────────────────────
   ⚠️ Dice **qué ha pasado** y que no se pierde nada, no un «Error» a secas. */
export function PlanPerdido({ accent, onExplorar }) {
  return (
    <Card style={{ border: `1px solid ${COLORS.warning}` }}>
      <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
        {PLAN_PERDIDO.titulo}
      </p>
      <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{PLAN_PERDIDO.texto}</p>
      {onExplorar && (
        <div className="mt-3">
          <PrimaryButton accent={accent} icon={ChevronRight} onClick={onExplorar}>
            {PLAN_PERDIDO.accion}
          </PrimaryButton>
        </div>
      )}
    </Card>
  );
}

/* ── La tarjeta del próximo entrenamiento (apartados 5 y 6) ────────────────
   *"Hoy · Push · 6 ejercicios · ≈ 55 min"*, con sus músculos y su posición en
   la semana. ⚠️ El «fondo/imagen» del apartado 6 es **el grupo que más pesa**,
   derivado: ni una imagen inventada (la lección de la F5). */
export function TarjetaProximo({ proximo, accent, onVer, onEmpezar = null }) {
  if (!proximo) return null;
  const Icono = iconoDeGrupo(null);
  return (
    <Card style={{ border: `1px solid ${accent}` }}>
      <div className="flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: hexToRgba(accent, 0.16), color: accent }}
        >
          <Icono size={28} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: accent }}>
            {proximo.cuando}
          </p>
          <p className="text-lg font-extrabold leading-tight truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
            {proximo.sesion.nombre}
          </p>
          <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>
            {[`${proximo.sesion.ejercicios} ${proximo.sesion.ejercicios === 1 ? 'ejercicio' : 'ejercicios'}`,
              proximo.sesion.duracion].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      {proximo.musculos.length > 0 && (
        <p className="text-xs mt-2.5" style={{ color: COLORS.textMuted }}>
          {proximo.musculos.join(' · ')}
        </p>
      )}
      <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>{proximo.posicion}</p>

      {/* 🚨 Apartado 6 de la F6: el CTA abría el detalle porque el motor no
          existía —*"No crear botones muertos"*—. 🔓 **Con la FIT F7 el motor
          existe**, así que el primario es **Empezar entrenamiento**, que es el
          camino que pide su apartado 1: *"Tu Plan → entrenamiento → Empezar
          entrenamiento"*. Ver el detalle sigue estando, de secundario. */}
      {(onVer || onEmpezar) && (
        <div className="mt-3 pt-3 flex gap-2 flex-wrap" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          {onEmpezar && (
            <PrimaryButton accent={accent} icon={Play} onClick={onEmpezar}>
              Empezar entrenamiento
            </PrimaryButton>
          )}
          {onVer && (
            onEmpezar
              ? <GhostBtn icon={ChevronRight} onClick={onVer}>Ver entrenamiento</GhostBtn>
              : (
                <PrimaryButton accent={accent} icon={ChevronRight} onClick={onVer}>
                  Ver entrenamiento
                </PrimaryButton>
              )
          )}
        </div>
      )}
    </Card>
  );
}

/* ── Hoy toca descansar (apartado 15) ──────────────────────────────────────
   ⚠️ Y **sin CTA de entrenamiento**, que es lo que el apartado prohíbe. */
export function DescansoHoy({ accent }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: hexToRgba(COLORS.border, 0.5), color: COLORS.textMuted }}
        >
          <Moon size={24} />
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
            {DESCANSO_HOY.titulo}
          </p>
          <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{DESCANSO_HOY.texto}</p>
        </div>
      </div>
    </Card>
  );
}

/* ── La semana (apartados 7 y 8) ───────────────────────────────────────────
   *"L M X J V S D […] No utilizar un calendario gigante. Quiero una
   visualización compacta y premium."* Y **el día actual queda claramente
   marcado**. ⚠️ El `overflow-x` va en SU contenedor: la página no se arrastra
   de lado (apartado 22, y es la lección de GE F1). */
export function SemanaCompacta({ semana, accent, seleccionado = null, onElegir = null }) {
  if (!semana || !semana.length) return null;
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {semana.map((d) => {
        const activo = seleccionado === d.dia;
        const entrena = !d.descanso && !d.fueraDelPlan;
        const fondo = activo
          ? accent
          : (d.esHoy ? hexToRgba(accent, 0.18) : hexToRgba(COLORS.border, 0.45));
        const color = activo ? COLORS.textOnAccent : (d.esHoy ? accent : COLORS.textMuted);
        return (
          <button
            key={d.fecha}
            onClick={() => onElegir && onElegir(d)}
            disabled={!entrena || !onElegir}
            aria-label={entrena
              ? `${d.etiqueta}: ${d.nombre}`
              : `${d.etiqueta}: ${d.fueraDelPlan ? 'antes de empezar el plan' : 'descanso'}`}
            aria-current={d.esHoy ? 'date' : undefined}
            className="flex-1 min-w-[44px] rounded-xl py-2 px-1 toque-44 active:scale-[0.97]"
            style={{ background: fondo, color, opacity: entrena ? 1 : 0.65 }}
          >
            <span className="block text-[11px] font-bold" style={{ textDecoration: d.esHoy ? 'underline' : 'none' }}>
              {d.corto}
            </span>
            {/* ⚠️ Un día anterior a la activación no dice «Descanso»: ese día el
                plan no existía, y afirmarlo sería inventárselo. */}
            <span className="block text-[10px] truncate mt-0.5">
              {d.fueraDelPlan ? '—' : (entrena ? d.nombre : 'Descanso')}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── La sesión de un día (apartado 9) ──────────────────────────────────────
   ⚠️ Las filas son las de `lineasDeDia()`, las mismas que pinta la biblioteca:
   *"Reutilizar el detalle creado para planes/plantillas."* */
export function SesionDelDia({ sesion, accent, onCerrar = null, onEmpezar = null }) {
  if (!sesion) return null;
  return (
    <Card style={{ border: `1px solid ${accent}` }}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
            {sesion.nombre}
          </p>
          <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
            {[`${sesion.ejercicios} ${sesion.ejercicios === 1 ? 'ejercicio' : 'ejercicios'}`,
              sesion.duracion].filter(Boolean).join(' · ')}
          </p>
        </div>
        {onCerrar && (
          <button
            onClick={onCerrar}
            aria-label="Cerrar la sesión"
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 toque-44 active:scale-90"
            style={{ background: hexToRgba(COLORS.border, 0.45), color: COLORS.textMuted }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="mt-3 pt-3 space-y-2" style={{ borderTop: `1px solid ${COLORS.border}` }}>
        {sesion.lineas.map((l) => (
          <div key={l.id} className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: accent }} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate" style={{ color: COLORS.text }}>{l.nombre}</p>
              {/* 🚨 Apartado 25: un ejercicio que ya no está **se dice**, y el
                  resto de la sesión se sigue viendo. */}
              {!l.existe ? (
                <p className="text-[11px]" style={{ color: COLORS.negative }}>Ejercicio no disponible</p>
              ) : (
                <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
                  {[l.series, l.carga, l.descanso ? `${l.descanso} s descanso` : '', l.musculos]
                    .filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {sesion.distribucion.grupos.length > 0 && (
        <p className="text-[11px] mt-3 pt-3" style={{ color: COLORS.textMuted, borderTop: `1px solid ${COLORS.border}` }}>
          {sesion.distribucion.grupos.slice(0, 4).map((g) => `${g.nombre} ${g.porcentaje}%`).join(' · ')}
        </p>
      )}

      {/* 🔓 FIT F7 — desde el detalle también se empieza: es el camino literal
          del apartado 1, *"Tu Plan → entrenamiento → Empezar entrenamiento"*. */}
      {onEmpezar && (
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <PrimaryButton accent={accent} icon={Play} onClick={onEmpezar}>
            Empezar entrenamiento
          </PrimaryButton>
        </div>
      )}
    </Card>
  );
}

/* ── La pantalla (apartado 21: ese orden, y sin llenarla de widgets) ───────
   ⚠️ Qué día está abierto es **estado de la pantalla**, no un dato (EH F40):
   volver a Entrenamiento te deja donde se entra, no donde lo dejaste. */
export default function TuPlanView({
  fitness = {}, accent, hoy,
  onExplorar = null, onCrear = null, onVerPlantillas = null, onCambiarPlan = null,
  onQuitar = null, onEmpezar = null,
}) {
  const [diaAbierto, setDiaAbierto] = useState(null);
  const v = useMemo(() => tuPlan(fitness, hoy ? { hoy } : {}), [fitness, hoy]);
  /* 🔓 FIT F31, apartado 31 — *"Esta semana: realizadas / planificadas […] No
     duplicar la lógica. Utilizar getTrainingActivitySummary()"*. ⚠️ Antes de
     los `return` de abajo: es un hook (regla 4). */
  const actividad = useMemo(() => resumenDeActividad(fitness, hoy ? { hoy } : {}), [fitness, hoy]);

  if (v.estado === 'sin_plan') {
    return (
      <div className="space-y-4">
        <SectionTitle sub="Lo que estás entrenando ahora">Tu Plan</SectionTitle>
        <SinPlan accent={accent} onExplorar={onExplorar} onCrear={onCrear} />
        <SeccionPlantillas datos={v.plantillas} accent={accent} onVerTodas={onVerPlantillas} onCrear={onCrear} />
      </div>
    );
  }

  if (v.estado === 'perdido') {
    return (
      <div className="space-y-4">
        <SectionTitle sub="Lo que estás entrenando ahora">Tu Plan</SectionTitle>
        <PlanPerdido accent={accent} onExplorar={onExplorar} />
        <SeccionPlantillas datos={v.plantillas} accent={accent} onVerTodas={onVerPlantillas} onCrear={onCrear} />
      </div>
    );
  }

  const sesion = diaAbierto === null ? null : sesionDelDia(v.plan, diaAbierto.indice, v.propios);

  return (
    <div className="space-y-5">
      {/* 1 · Lo primero es el próximo entrenamiento (apartado 21). */}
      <div>
        <SectionTitle sub={v.descansoHoy ? 'Hoy no toca' : 'Lo siguiente que te toca'}>
          {v.descansoHoy ? 'Hoy' : 'Próximo entrenamiento'}
        </SectionTitle>
        {v.descansoHoy ? <DescansoHoy accent={accent} /> : (
          <TarjetaProximo
            proximo={v.proximo}
            accent={accent}
            onVer={v.proximo ? () => setDiaAbierto({ indice: v.proximo.indice, dia: v.proximo.dia }) : null}
            onEmpezar={v.proximo && onEmpezar ? () => onEmpezar(v.proximo.indice) : null}
          />
        )}
        {/* ⚠️ Y si hoy descansa pero queda entrenamiento esta semana, se dice
            cuál: esconderlo dejaría la pantalla sin lo siguiente que hacer. */}
        {v.descansoHoy && v.proximo && (
          <div className="mt-3">
            <TarjetaProximo
              proximo={v.proximo}
              accent={accent}
              onVer={() => setDiaAbierto({ indice: v.proximo.indice, dia: v.proximo.dia })}
              onEmpezar={onEmpezar ? () => onEmpezar(v.proximo.indice) : null}
            />
          </div>
        )}
      </div>

      {/* La sesión abierta, justo debajo de lo que la abrió. */}
      {sesion && (
        <SesionDelDia
          sesion={sesion}
          accent={accent}
          onCerrar={() => setDiaAbierto(null)}
          onEmpezar={onEmpezar && !sesion.descanso ? () => onEmpezar(diaAbierto.indice) : null}
        />
      )}

      {/* 2 · El plan activo (apartado 3: sin sobrecargar la cabecera). */}
      <div>
        {/* Apartado 3: la cabecera **se llama «Tu Plan»**, que es como la nombra
            el enunciado y por donde se entra desde Entrenamiento. */}
        <SectionTitle sub="Tu planificación activa">Tu Plan</SectionTitle>
        <Card>
          <p className="text-lg font-extrabold leading-tight" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
            {v.cabecera.nombre}
          </p>
          <p className="text-xs mt-0.5" style={{ color: accent }}>
            {[v.cabecera.entorno, v.cabecera.textoFrecuencia, v.cabecera.dificultad]
              .filter(Boolean).join(' · ') || v.cabecera.subtitulo}
          </p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
            {[v.cabecera.objetivo, v.cabecera.duracion,
              `${v.cabecera.ejercicios} ${v.cabecera.ejercicios === 1 ? 'ejercicio' : 'ejercicios'}`]
              .filter(Boolean).join(' · ')}
          </p>
          {/* Apartado 17: desde cuándo lo sigue. Sin fecha no se dice nada. */}
          {v.cabecera.textoDesde && (
            <p className="text-[11px] mt-1" style={{ color: COLORS.textMuted }}>{v.cabecera.textoDesde}</p>
          )}
          {(onCambiarPlan || onQuitar) && (
            <div className="flex gap-2 flex-wrap mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
              {onCambiarPlan && <GhostBtn icon={Repeat} onClick={onCambiarPlan}>Cambiar plan</GhostBtn>}
              {/* ⚠️ «Quitar el plan» existe desde la F5 y **no se pierde al
                  rediseñar esta pantalla**: reorganizar no es eliminar (GE F1).
                  El apartado 19 solo prohíbe borrar el plan o las plantillas, y
                  esto no borra nada: deja de estar activo. */}
              {onQuitar && <GhostBtn icon={X} onClick={onQuitar}>Quitar el plan</GhostBtn>}
            </div>
          )}
        </Card>
      </div>

      {/* 3 · La semana (apartados 7 y 8). */}
      <div>
        <SectionTitle sub="Toca un día para ver su entrenamiento">Tu semana</SectionTitle>
        {v.sinSemana ? (
          <Card>
            <p className="text-sm font-bold" style={{ color: COLORS.text }}>Todavía no se puede repartir la semana</p>
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
              Este plan no guarda desde cuándo lo sigues, así que no se sabe qué día le toca a cada sesión.
            </p>
          </Card>
        ) : (
          <>
            <SemanaCompacta
              semana={v.semana}
              accent={accent}
              seleccionado={diaAbierto?.dia ?? null}
              onElegir={(d) => setDiaAbierto(
                diaAbierto?.dia === d.dia ? null : { indice: d.indice, dia: d.dia },
              )}
            />
            {/* 🔓 FIT F31 — lo hecho frente a lo planificado, sin nota (apartados
                11-14). Sin frecuencia definida el bloque no existe (13). */}
            {actividad.plan && (
              <div className="mt-3">
                <TrainingPlanAdherence plan={actividad.plan} accent={accent} />
              </div>
            )}
            {/* La distribución semanal (apartado 10), resumida y derivada. */}
            {v.distribucion.grupos.length > 0 && (
              <Card className="mt-3">
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: COLORS.textMuted }}>
                  Distribución semanal
                </p>
                {v.distribucion.grupos.map((g) => (
                  <div key={g.grupoId} className="mb-2 last:mb-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold truncate" style={{ color: COLORS.text }}>{g.nombre}</span>
                      <span className="text-[11px] shrink-0" style={{ color: COLORS.textMuted }}>{g.porcentaje}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: hexToRgba(COLORS.border, 0.6) }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(0, Math.min(100, g.porcentaje))}%`, background: accent }}
                      />
                    </div>
                  </div>
                ))}
                {/* ⚠️ Lo que no cabe se dice, no se esconde (apartado 10). */}
                {v.distribucion.resto > 0 && (
                  <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>
                    Y un {v.distribucion.resto}% repartido en el resto.
                  </p>
                )}
              </Card>
            )}
          </>
        )}
      </div>

      {/* 4 · Tus plantillas (apartados 11, 12 y 13). */}
      <SeccionPlantillas datos={v.plantillas} accent={accent} onVerTodas={onVerPlantillas} onCrear={onCrear} />
    </div>
  );
}

/* ── Tus plantillas, en pequeño (apartados 11, 12 y 13) ────────────────────
   🚨 *"No duplicar toda la funcionalidad de gestión aquí"* y *"No mezclar ambas
   listas"*: esto enseña tres y lleva a `PlantillasView`, que es quien gestiona.
   Y **una plantilla no se convierte en plan activo desde aquí**. */
function SeccionPlantillas({ datos, accent, onVerTodas, onCrear }) {
  return (
    <div>
      <SectionTitle sub="Las rutinas que te has creado tú">Tus plantillas</SectionTitle>
      {datos.total === 0 ? (
        <Card>
          <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
            Todavía no te has creado ninguna
          </p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
            La que construyas aparecerá aquí, y podrás volver a abrirla.
          </p>
          {onCrear && (
            <div className="mt-3">
              <PrimaryButton accent={accent} icon={Plus} onClick={onCrear}>Crear entrenamiento</PrimaryButton>
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          {datos.plantillas.map((p) => (
            <button
              key={p.id}
              onClick={onVerTodas || undefined}
              aria-label={`Ver ${p.nombre}`}
              disabled={!onVerTodas}
              className="hub-card w-full text-left rounded-2xl p-3.5 flex items-center gap-3 active:scale-[0.99]"
              style={{ background: COLORS.surface, border: `1px solid ${p.esActiva ? accent : COLORS.border}` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: hexToRgba(accent, 0.14), color: accent }}
              >
                <Dumbbell size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
                  {p.nombre}
                </p>
                <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>
                  {[`${p.ejercicios} ${p.ejercicios === 1 ? 'ejercicio' : 'ejercicios'}`, p.duracion, p.entorno]
                    .filter(Boolean).join(' · ')}
                </p>
                {p.esActiva && (
                  <p className="text-[11px] font-semibold mt-0.5" style={{ color: accent }}>Es tu plan actual</p>
                )}
              </div>
              {onVerTodas && <ChevronRight size={16} style={{ color: COLORS.textMuted }} aria-hidden="true" />}
            </button>
          ))}
          <div className="flex gap-2 flex-wrap">
            {/* ⚠️ «Ver todas» solo si queda alguna fuera (E3 F46, regla 8). */}
            {datos.hayMas && onVerTodas && (
              <GhostBtn icon={ChevronRight} onClick={onVerTodas}>Ver todas ({datos.total})</GhostBtn>
            )}
            {onCrear && <GhostBtn icon={Plus} onClick={onCrear}>Crear entrenamiento</GhostBtn>}
          </div>
        </div>
      )}
    </div>
  );
}
