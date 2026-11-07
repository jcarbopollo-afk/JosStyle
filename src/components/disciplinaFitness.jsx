/* ═══════════════════════════════════════════════════════════════════════════
   FITNESS 7/8 — LO QUE SE VE DE LA DISCIPLINA (prompt 7, ARQUITECTURA §23)
   ═══════════════════════════════════════════════════════════════════════════
   🚨 Aquí no se calcula nada: los periodos, los indicadores, la racha, el mes y
   el detalle de un día salen de `disciplinaFitness.js`, que a su vez lee los
   estados del motor de la Fase 4. Esta capa solo los dibuja.

   El color nunca va solo (EH F42): cada día del calendario lleva su icono, y su
   etiqueta accesible dice la fecha y el estado. Tocar un día abre su detalle
   debajo, en la misma pantalla. */

import React from 'react';
import { ChevronLeft, ChevronRight, Moon, RotateCcw, CalendarDays } from 'lucide-react';
import { COLORS } from '../tokens';
import { Card, TextInput } from './ui';
import { Plegable } from './layoutMotion';
import { OpcionSegmentada } from './piezasFitness';
import { colorDeCumplimiento, iconoDeCumplimiento } from './cumplimientoFitness';
import { acentoLegible } from '../lib/acabadoFitness';
import { hexToRgba } from '../lib/helpers';
import { diaYMes, fechaLarga } from '../lib/fechasFitness';
import { DIAS_SEMANA } from '../lib/horario';
import {
  PERIODOS_DISCIPLINA, FORMULA_CUMPLIMIENTO, textoDeRegularidad, NOMBRE_CLASE, textoDeRegistradas,
} from '../lib/disciplinaFitness';

const lista = (v) => (Array.isArray(v) ? v : []);

export const TEXTOS_DISCIPLINA = Object.freeze({
  titulo: 'Disciplina',
  periodo: 'Periodo de la disciplina',
  desde: 'Desde',
  hasta: 'Hasta',
  elegirFechas: 'Elige las dos fechas para ver ese periodo.',
  vacio: 'En este periodo todavía no hay días que contar.',
  sinPorcentaje: 'Sin días evaluados',
  rachaActual: 'Racha actual',
  rachaMejor: 'Mejor racha',
  formula: '¿Cómo se calcula?',
  calendario: 'Calendario',
  mesAnterior: 'Ver el mes anterior',
  mesSiguiente: 'Ver el mes siguiente',
  semanaAnterior: 'Ver la semana anterior',
  semanaSiguiente: 'Ver la semana siguiente',
  verSemana: 'Ver solo una semana',
  verMes: 'Ver el mes entero',
  verEntrenamiento: 'Ver entrenamiento',
  sinRegistros: 'No hay entrenamientos registrados este día.',
  descanso: 'Descanso de la rutina',
});

/** Un número con su nombre, en una casilla. */
function Indicador({ valor, nombre, color = null }) {
  return (
    <div className="rounded-xl px-2.5 py-2 min-w-0" style={{ background: COLORS.surface2 }}>
      <p className="text-lg font-bold tabular-nums" style={{ color: color || COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{valor}</p>
      <p className="text-[11px] leading-tight" style={{ color: COLORS.textMuted }}>{nombre}</p>
    </div>
  );
}

/**
 * 🚨 El resumen de disciplina de un periodo: el porcentaje con su regularidad,
 * los indicadores (previstos, completos, parciales, perdidos, recuperados,
 * descansos respetados y sacrificados, libres) y la racha.
 */
export function ResumenDisciplina({ disciplina, periodo, desde = '', hasta = '', accent, onPeriodo, onFechas, formulaAbierta = false, onFormula = null }) {
  const est = disciplina ? disciplina.estadisticas : null;
  return (
    <Card>
      <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{TEXTOS_DISCIPLINA.titulo}</p>
      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5 mt-2" role="group" aria-label={TEXTOS_DISCIPLINA.periodo}>
        {PERIODOS_DISCIPLINA.map((o) => (
          <OpcionSegmentada key={o.id} activa={periodo === o.id} accent={accent} onClick={() => onPeriodo(o.id)}>{o.nombre}</OpcionSegmentada>
        ))}
      </div>
      {periodo === 'personalizado' && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          <label className="text-xs min-w-0" style={{ color: COLORS.textMuted }}>
            {TEXTOS_DISCIPLINA.desde}
            <TextInput type="date" value={desde} aria-label={TEXTOS_DISCIPLINA.desde} onChange={(e) => onFechas({ desde: e.target.value, hasta })} />
          </label>
          <label className="text-xs min-w-0" style={{ color: COLORS.textMuted }}>
            {TEXTOS_DISCIPLINA.hasta}
            <TextInput type="date" value={hasta} aria-label={TEXTOS_DISCIPLINA.hasta} onChange={(e) => onFechas({ desde, hasta: e.target.value })} />
          </label>
        </div>
      )}
      {disciplina && disciplina.rango && (
        <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>
          {`${fechaLarga(disciplina.rango.desde)} – ${fechaLarga(disciplina.rango.hasta)}`}
        </p>
      )}
      {!disciplina || !disciplina.rango ? (
        <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>{TEXTOS_DISCIPLINA.elegirFechas}</p>
      ) : !est || !est.dias ? (
        <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>{TEXTOS_DISCIPLINA.vacio}</p>
      ) : (
        <>
          <div className="flex items-end gap-3 mt-2">
            <p className="text-3xl font-extrabold tabular-nums" style={{ color: est.porcentaje === null ? COLORS.textMuted : COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
              {est.porcentaje === null ? '—' : `${est.porcentaje} %`}
            </p>
            <p className="text-xs pb-1 min-w-0" style={{ color: COLORS.textMuted }}>
              {est.porcentaje === null ? TEXTOS_DISCIPLINA.sinPorcentaje : textoDeRegularidad(est)}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-1.5 mt-3">
            <Indicador valor={est.previstos} nombre="Previstos" />
            <Indicador valor={est.completos} nombre="Completos" color={COLORS.positive} />
            <Indicador valor={est.recuperados} nombre="Recuperados" color={COLORS.positive} />
            <Indicador valor={est.parciales} nombre="Parciales" color={COLORS.warning} />
            <Indicador valor={est.perdidos} nombre="Perdidos" color={est.perdidos ? COLORS.negative : null} />
            <Indicador valor={est.pendientes} nombre="Pendientes" />
            <Indicador valor={est.descansosRespetados} nombre="Descansos respetados" />
            <Indicador valor={est.descansosSacrificados} nombre="Descansos sacrificados" color={est.descansosSacrificados ? COLORS.negative : null} />
            <Indicador valor={est.libres} nombre="Libres" />
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-1.5">
            <Indicador valor={`${est.racha.actual} ${est.racha.actual === 1 ? 'día' : 'días'}`} nombre={TEXTOS_DISCIPLINA.rachaActual} />
            <Indicador valor={`${est.racha.mejor} ${est.racha.mejor === 1 ? 'día' : 'días'}`} nombre={TEXTOS_DISCIPLINA.rachaMejor} />
          </div>
          {onFormula && (
            <>
              <button
                type="button"
                onClick={onFormula}
                aria-expanded={formulaAbierta}
                className="text-xs font-semibold mt-2 toque-44"
                style={{ color: acentoLegible(accent) }}
              >
                {TEXTOS_DISCIPLINA.formula}
              </button>
              <Plegable abierto={formulaAbierta}>
                {() => <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{FORMULA_CUMPLIMIENTO}</p>}
              </Plegable>
            </>
          )}
        </>
      )}
    </Card>
  );
}

/** Una celda del mes: el número del día, su color y su icono. */
function CeldaMes({ celda, elegida, accent, onElegir }) {
  const c = colorDeCumplimiento(celda.color);
  const Icono = iconoDeCumplimiento(celda.estado);
  const relleno = celda.color === 'verde' || celda.color === 'rojo' || celda.color === 'amarillo_verdoso';
  const apagado = celda.color === 'futuro' || celda.color === 'neutro';
  const registradas = lista(celda.sesiones);
  const extra = [
    celda.esHoy ? 'hoy' : '',
    celda.descanso ? 'descanso' : '',
    celda.recuperaDe.length ? `recupera el ${celda.recuperaDe.map(diaYMes).join(' y el ')}` : '',
    /* Fitness 8/8 — lo que decía el calendario de Progreso: qué se entrenó ese día. */
    textoDeRegistradas(registradas),
  ].filter(Boolean).join(', ');
  return (
    <button
      type="button"
      onClick={() => onElegir(celda.fecha)}
      aria-pressed={elegida}
      aria-current={celda.esHoy ? 'date' : undefined}
      aria-label={`${diaYMes(celda.fecha)}: ${celda.nombre}${extra ? ` (${extra})` : ''}`}
      className="relative flex flex-col items-center justify-center rounded-xl min-w-0 h-11 toque-44"
      style={{
        background: relleno ? hexToRgba(c, 0.2) : 'transparent',
        border: `${celda.estado === 'pendiente' ? '2px dashed' : '1px solid'} ${elegida ? accent : apagado ? COLORS.border : c}`,
        boxShadow: celda.esHoy ? `inset 0 0 0 1px ${accent}` : undefined,
      }}
    >
      <span className="text-xs font-semibold tabular-nums" style={{ color: apagado ? COLORS.textMuted : COLORS.text }}>{celda.dia}</span>
      <Icono size={11} aria-hidden="true" style={{ color: apagado ? COLORS.textMuted : c }} />
      {(celda.descanso || celda.recuperaDe.length > 0) && (
        <span className="absolute top-0.5 right-1" aria-hidden="true" style={{ color: COLORS.textMuted }}>
          {celda.recuperaDe.length ? <RotateCcw size={8} /> : <Moon size={8} />}
        </span>
      )}
      {registradas.length > 0 && (
        <span className="absolute bottom-0.5 left-1 text-[10px] font-bold leading-none" aria-hidden="true" style={{ color: COLORS.textMuted }}>
          {registradas.length > 1 ? `●${registradas.length}` : '●'}
        </span>
      )}
    </button>
  );
}

const LEYENDA = Object.freeze([
  Object.freeze({ color: 'verde', estado: 'cumplido', nombre: 'Cumplido, recuperado o descanso' }),
  Object.freeze({ color: 'amarillo_verdoso', estado: 'parcial', nombre: 'Parcial' }),
  Object.freeze({ color: 'rojo', estado: 'perdido', nombre: 'Perdido' }),
  Object.freeze({ color: 'pendiente', estado: 'pendiente', nombre: 'Pendiente de recuperar' }),
  Object.freeze({ color: 'futuro', estado: 'futuro', nombre: 'Por llegar o sin seguimiento' }),
]);

/**
 * 🚨 EL calendario de cumplimiento de Fitness (el único desde la Fase 8): el mes
 * entero o una semana de lunes a domingo, con su navegación y su leyenda. Recibe
 * la vista ya calculada (`mesDeCumplimiento` o `semanaDeCumplimiento`).
 */
export function CalendarioCumplimiento({ mes, elegida = null, accent, onMes, onElegir, onVista = null }) {
  if (!mes) return null;
  const semana = mes.vista === 'semana';
  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => onMes(mes.anterior)} aria-label={semana ? TEXTOS_DISCIPLINA.semanaAnterior : TEXTOS_DISCIPLINA.mesAnterior} className="toque-44 rounded-full p-1.5 -m-1.5" style={{ color: COLORS.textMuted }}>
          <ChevronLeft size={18} />
        </button>
        <div className="text-center min-w-0">
          <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{mes.titulo}</p>
          {semana && <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{mes.rango}</p>}
        </div>
        <button type="button" onClick={() => onMes(mes.siguiente)} aria-label={semana ? TEXTOS_DISCIPLINA.semanaSiguiente : TEXTOS_DISCIPLINA.mesSiguiente} className="toque-44 rounded-full p-1.5 -m-1.5" style={{ color: COLORS.textMuted }}>
          <ChevronRight size={18} />
        </button>
      </div>
      {onVista && (
        <div className="flex justify-center mt-1">
          <button
            type="button"
            onClick={() => onVista(semana ? 'mes' : 'semana')}
            aria-label={semana ? TEXTOS_DISCIPLINA.verMes : TEXTOS_DISCIPLINA.verSemana}
            className="inline-flex items-center gap-1 text-xs font-semibold toque-44"
            style={{ color: acentoLegible(accent) }}
          >
            <CalendarDays size={14} aria-hidden="true" /> {semana ? 'Mes' : 'Semana'}
          </button>
        </div>
      )}
      <div className="grid grid-cols-7 gap-1 mt-2" role="grid" aria-label={`${TEXTOS_DISCIPLINA.calendario}: ${semana ? mes.rango : mes.titulo}`}>
        {DIAS_SEMANA.map((d) => (
          <span key={d.dia} className="text-[11px] font-semibold text-center" style={{ color: COLORS.textMuted }} aria-hidden="true">{d.corto}</span>
        ))}
        {lista(mes.celdas).map((c, i) => (c
          ? <CeldaMes key={c.fecha} celda={c} elegida={elegida === c.fecha} accent={accent} onElegir={onElegir} />
          : <span key={`hueco-${i}`} aria-hidden="true" />))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
        {LEYENDA.map((l) => {
          const Icono = iconoDeCumplimiento(l.estado);
          return (
            <span key={l.color} className="inline-flex items-center gap-1 text-[11px]" style={{ color: COLORS.textMuted }}>
              <Icono size={11} aria-hidden="true" style={{ color: colorDeCumplimiento(l.color) }} />
              {l.nombre}
            </span>
          );
        })}
        <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: COLORS.textMuted }}>
          <span aria-hidden="true">●</span> Entrenamiento registrado
        </span>
      </div>
    </Card>
  );
}

/** 🚨 Lo que pasó un día: estado, motivo, qué tocaba y las sesiones de ese día. */
export function DetalleDeFecha({ detalle, accent, onVerSesion }) {
  const d = detalle;
  if (!d) return null;
  const c = colorDeCumplimiento(d.color);
  const Icono = iconoDeCumplimiento(d.estado);
  const sesiones = lista(d.sesiones);
  return (
    <Card>
      <p className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>{fechaLarga(d.fecha)}</p>
      <p className="inline-flex items-center gap-1.5 text-sm font-bold mt-0.5" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
        <Icono size={14} aria-hidden="true" style={{ color: c === COLORS.textMuted ? COLORS.textMuted : c }} />
        {d.nombre}
      </p>
      {d.motivo && <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{d.motivo}</p>}
      {d.previsto && (
        <p className="text-xs mt-1.5" style={{ color: COLORS.text }}>
          {d.previsto.tipo === 'descanso'
            ? `${TEXTOS_DISCIPLINA.descanso}${d.previsto.rutina ? ` · ${d.previsto.rutina}` : ''}`
            : `Previsto: ${d.previsto.plantilla || 'Entrenamiento'}${d.previsto.rutina ? ` · ${d.previsto.rutina}` : ''}`}
        </p>
      )}
      {d.cumplidaPor && (
        <button
          type="button"
          onClick={() => onVerSesion(d.cumplidaPor.id)}
          className="block text-left text-xs font-semibold mt-1.5 toque-44"
          style={{ color: acentoLegible(accent) }}
        >
          {`Recuperado el ${diaYMes(d.cumplidaPor.fecha)}: ${d.cumplidaPor.nombre}`}
        </button>
      )}
      {sesiones.length === 0 ? (
        !d.cumplidaPor && <p className="text-xs mt-1.5" style={{ color: COLORS.textMuted }}>{TEXTOS_DISCIPLINA.sinRegistros}</p>
      ) : (
        <div className="flex flex-col gap-1.5 mt-2">
          {sesiones.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onVerSesion(s.id)}
              aria-label={`${TEXTOS_DISCIPLINA.verEntrenamiento}: ${s.nombre}`}
              className="text-left rounded-xl px-3 py-2 toque-44"
              style={{ background: COLORS.surface2 }}
            >
              <span className="block text-sm font-semibold" style={{ color: COLORS.text }}>{s.nombre}</span>
              <span className="block text-xs" style={{ color: COLORS.textMuted }}>
                {[
                  NOMBRE_CLASE[s.clase] || '',
                  s.clase === 'recuperacion' && s.fechaPrevista ? `prevista el ${diaYMes(s.fechaPrevista)}` : '',
                  s.grado === 'parcial' ? 'Parcial' : '',
                  s.completar ? 'Con «Completar entrenamiento»' : '',
                ].filter(Boolean).join(' · ')}
              </span>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
