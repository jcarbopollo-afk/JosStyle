/* ═══════════════════════════════════════════════════════════════════════════
   FITNESS 4/8 — LO QUE SE VE DEL CUMPLIMIENTO
   ═══════════════════════════════════════════════════════════════════════════
   🚨 Aquí no se calcula nada: los estados, los colores, los motivos, los
   pendientes y las consecuencias los da `cumplimientoFitness.js`. Esta capa solo
   los dibuja y avisa de lo que él elige (prompt 4 §11: los colores salen de los
   estados reales, no se calculan en cada componente).

   El color nunca va solo (EH F42): cada día lleva su icono y su nombre en la
   etiqueta accesible, y el motivo se lee al tocarlo. */

import React, { useState } from 'react';
import { Check, X, RotateCcw, Moon, Minus, CircleDashed, Clock, Play, CheckCheck } from 'lucide-react';
import { COLORS } from '../tokens';
import { Card, GhostBtn, PrimaryButton, TextInput } from './ui';
import { Plegable } from './layoutMotion';
import { acentoLegible } from '../lib/acabadoFitness';
import { hexToRgba } from '../lib/helpers';
import { diaYMes } from '../lib/fechasFitness';
import { DIAS_SEMANA, diaDeFecha } from '../lib/horario';
import { explicarQuedan, explicarCaducidad, resumenDeVentana } from '../lib/cumplimientoFitness';
import { TEXTOS_COMPLETAR, etiquetaDelDia } from '../lib/completarEntrenamiento';

const lista = (v) => (Array.isArray(v) ? v : []);

/** El token de cada color del motor. Sin hex: los de estado de `COLORS`. */
export function colorDeCumplimiento(color) {
  if (color === 'verde') return COLORS.positive;
  if (color === 'rojo') return COLORS.negative;
  if (color === 'amarillo_verdoso' || color === 'pendiente') return COLORS.warning;
  return COLORS.textMuted;
}

const ICONOS = {
  cumplido: Check,
  recuperado: Check,
  descanso_respetado: Moon,
  parcial: CircleDashed,
  pendiente: RotateCcw,
  perdido: X,
  descanso_sacrificado: X,
  hoy: Clock,
  futuro: Minus,
  sin_seguimiento: Minus,
};

/** El icono de cada estado (el color nunca va solo). Lo usa también el calendario de la Fase 7. */
export const iconoDeCumplimiento = (estado) => ICONOS[estado] || Minus;

const diaDe = (fecha) => DIAS_SEMANA.find((x) => x.dia === diaDeFecha(fecha)) || null;
const inicialDelDia = (fecha) => (diaDe(fecha) || {}).corto || '';
const nombreDelDia = (fecha) => (diaDe(fecha) || {}).label || '';

/** Un día de la ventana: relleno si está decidido, solo el borde si es un pendiente. */
function CasillaDia({ dia, elegido, onElegir }) {
  const c = colorDeCumplimiento(dia.color);
  const Icono = iconoDeCumplimiento(dia.estado);
  const relleno = dia.color === 'verde' || dia.color === 'rojo' || dia.color === 'amarillo_verdoso';
  return (
    <button
      type="button"
      onClick={onElegir}
      aria-pressed={elegido}
      aria-label={`${nombreDelDia(dia.fecha)} ${diaYMes(dia.fecha)}: ${dia.nombre}`}
      className="flex-1 min-w-0 flex flex-col items-center gap-1 toque-44 rounded-xl py-1.5"
      style={{ background: elegido ? COLORS.surface2 : 'transparent' }}
    >
      <span className="text-[11px] font-semibold" style={{ color: COLORS.textMuted }}>{inicialDelDia(dia.fecha)}</span>
      <span
        className="flex items-center justify-center rounded-full"
        style={{
          width: 28, height: 28,
          background: relleno ? hexToRgba(c, 0.22) : 'transparent',
          border: `${dia.estado === 'pendiente' ? '2px dashed' : '1px solid'} ${dia.color === 'futuro' || dia.color === 'neutro' ? COLORS.border : c}`,
          color: dia.color === 'futuro' || dia.color === 'neutro' ? COLORS.textMuted : c,
        }}
      >
        <Icono size={14} aria-hidden="true" />
      </span>
    </button>
  );
}

/**
 * Los últimos siete días naturales (D-02: es una vista; la caducidad no depende
 * de ella). Tocar un día dice por qué tiene ese color.
 */
export function VentanaCumplimiento({ dias }) {
  const ds = lista(dias);
  const [elegido, setElegido] = useState(null);
  if (!ds.length) return null;
  const dia = ds.find((d) => d.fecha === elegido) || null;
  const r = resumenDeVentana(ds);
  const partes = [
    r.verde ? `${r.verde} en verde` : '',
    r.amarillo_verdoso ? `${r.amarillo_verdoso} parcial${r.amarillo_verdoso === 1 ? '' : 'es'}` : '',
    r.pendiente ? `${r.pendiente} pendiente${r.pendiente === 1 ? '' : 's'}` : '',
    r.rojo ? `${r.rojo} en rojo` : '',
  ].filter(Boolean);
  return (
    <Card>
      <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>Últimos 7 días</p>
      {partes.length > 0 && <p className="text-xs" style={{ color: COLORS.textMuted }}>{partes.join(' · ')}</p>}
      <div className="flex gap-1 mt-2" role="group" aria-label="Cumplimiento de los últimos siete días">
        {ds.map((d) => (
          <CasillaDia key={`cumplimiento-${d.fecha}`} dia={d} elegido={d.fecha === elegido} onElegir={() => setElegido((e) => (e === d.fecha ? null : d.fecha))} />
        ))}
      </div>
      <Plegable abierto={!!dia}>
        {() => (dia ? (
          <div className="mt-2 rounded-xl px-3 py-2" style={{ background: COLORS.surface2 }}>
            <p className="text-xs font-semibold" style={{ color: colorDeCumplimiento(dia.color) === COLORS.textMuted ? COLORS.text : colorDeCumplimiento(dia.color) }}>
              {`${nombreDelDia(dia.fecha)} ${diaYMes(dia.fecha)} · ${dia.nombre}`}
            </p>
            <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{dia.motivo}</p>
            {lista(dia.conflicto).length > 0 && (
              <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
                Ese día llegó otro entrenamiento desde otro dispositivo. Se conserva en el historial, pero no cuenta para el cumplimiento.
              </p>
            )}
          </div>
        ) : null)}
      </Plegable>
    </Card>
  );
}

/** Una opción de recuperación, con sus consecuencias antes de confirmar (§7). */
function OpcionRecuperar({ pendiente, recomendado, consecuencias, accent, onEmpezar, onCompletar }) {
  const [abierta, setAbierta] = useState(false);
  const c = abierta && consecuencias ? consecuencias(pendiente) : null;
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ background: COLORS.surface2 }}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>
            {`«${pendiente.nombre}» del ${diaYMes(pendiente.fecha)}`}
          </p>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>
            {recomendado ? `Recomendado: es el más antiguo. ${explicarQuedan(pendiente)}` : explicarQuedan(pendiente)}
          </p>
        </div>
        <GhostBtn onClick={() => setAbierta((a) => !a)}>{abierta ? 'Cerrar' : 'Elegir'}</GhostBtn>
      </div>
      <Plegable abierto={abierta}>
        {() => (c ? (
          <div className="mt-2">
            <p className="text-xs font-semibold" style={{ color: COLORS.text }}>Si lo recuperas hoy:</p>
            <ul className="mt-1 flex flex-col gap-0.5">
              {c.frases.map((t) => (
                <li key={t} className="text-xs" style={{ color: c.caducarian.length && /caducará/.test(t) ? COLORS.negative : COLORS.textMuted }}>{t}</li>
              ))}
            </ul>
            <div className="flex gap-2 flex-wrap mt-2">
              {onEmpezar && <PrimaryButton accent={accent} icon={Play} onClick={() => onEmpezar(pendiente)}>Empezar la recuperación</PrimaryButton>}
              {onCompletar && <GhostBtn icon={CheckCheck} onClick={() => onCompletar(pendiente)}>{TEXTOS_COMPLETAR.boton}</GhostBtn>}
            </div>
          </div>
        ) : null)}
      </Plegable>
    </div>
  );
}

/**
 * La tarjeta de recuperación (prompt 4 §6 y §10). No sale si no hay nada que
 * decir. En un descanso dice que descansar es válido: nunca obliga a recuperar.
 */
export function TarjetaRecuperacion({ opciones, consecuencias, consecuenciasDeHoy = null, accent, onEmpezar, onCompletar }) {
  const o = opciones || {};
  const recuperables = lista(o.recuperables);
  const bloqueados = lista(o.bloqueados);
  const caducados = lista(o.caducados);
  if (o.ocupada || (!recuperables.length && !bloqueados.length && !caducados.length)) return null;
  const ph = o.previstoHoy;
  const titulo = recuperables.length
    ? (o.descansoHoy ? 'Hoy toca descansar, y tienes entrenamientos pendientes' : `Hoy toca «${(ph && ph.nombre) || 'entrenar'}», y tienes entrenamientos pendientes`)
    : 'Entrenamientos pendientes';
  return (
    <Card>
      <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{titulo}</p>
      {recuperables.length > 0 && (
        <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
          {o.descansoHoy
            ? 'Puedes recuperar uno o descansar. Descansar también es una opción válida: el descanso quedará respetado.'
            : 'Puedes hacer el de hoy o recuperar uno pendiente. Si recuperas uno, el de hoy quedará pendiente.'}
        </p>
      )}
      {consecuenciasDeHoy && lista(consecuenciasDeHoy.caducarian).length > 0 && (
        <p className="text-xs mt-1" style={{ color: COLORS.negative }}>
          {`Si ${o.descansoHoy ? 'entrenas hoy otra cosa' : 'haces el de hoy'}, caducará${consecuenciasDeHoy.caducarian.length > 1 ? 'n' : ''}: ${consecuenciasDeHoy.caducarian.map((p) => `«${p.nombre}» del ${diaYMes(p.fecha)}`).join(', ')}.`}
        </p>
      )}
      {recuperables.length > 0 && (
        <div className="flex flex-col gap-2 mt-3">
          {recuperables.map((p, i) => (
            <OpcionRecuperar
              key={`recuperar-${p.fecha}`}
              pendiente={p}
              recomendado={i === 0}
              consecuencias={consecuencias}
              accent={accent}
              onEmpezar={onEmpezar}
              onCompletar={onCompletar}
            />
          ))}
        </div>
      )}
      {bloqueados.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold" style={{ color: COLORS.text }}>No se pueden recuperar ahora</p>
          {bloqueados.map((p) => (
            <p key={`bloqueado-${p.fecha}`} className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
              {`«${p.nombre}» del ${diaYMes(p.fecha)}: ${p.bloqueo.texto}`}
            </p>
          ))}
        </div>
      )}
      {caducados.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold" style={{ color: COLORS.text }}>Ya no se pueden recuperar</p>
          {caducados.map((p) => (
            <p key={`caducado-${p.fecha}`} className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
              {`«${p.nombre}» del ${diaYMes(p.fecha)}. ${explicarCaducidad(p)}`}
            </p>
          ))}
        </div>
      )}
    </Card>
  );
}

/** El aviso de que la fecha ya tiene su entrenamiento (una sesión por día). */
export function AvisoFechaOcupada({ aviso, accent, onVer, onCerrar }) {
  if (!aviso) return null;
  return (
    <Card style={{ border: `1px solid ${COLORS.warning}` }}>
      <p role="alert" className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{aviso.titulo}</p>
      <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{aviso.texto}</p>
      <div className="flex gap-2 flex-wrap mt-3">
        {onVer && aviso.sesionId && (
          <PrimaryButton accent={accent} onClick={() => onVer(aviso)}>{aviso.enCurso ? 'Ir al entrenamiento empezado' : 'Ver el entrenamiento'}</PrimaryButton>
        )}
        {onCerrar && <GhostBtn onClick={onCerrar}>Entendido</GhostBtn>}
      </div>
    </Card>
  );
}

/**
 * «Completar entrenamiento» (D-03): elegir qué hizo y qué día. Se queda en su
 * sitio (no es una hoja): lo que se escribe y se guarda lo hace quien la usa.
 */
export function CompletarEntrenamientoTarjeta({ opciones, hoy, accent, error = '', onCompletar, onCancelar }) {
  const ops = lista(opciones);
  const [clave, setClave] = useState(ops[0] ? ops[0].clave : '');
  const [fecha, setFecha] = useState(hoy);
  const elegida = ops.find((x) => x.clave === clave) || null;
  return (
    <Card>
      <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{TEXTOS_COMPLETAR.titulo}</p>
      <p className="text-xs" style={{ color: COLORS.textMuted }}>{TEXTOS_COMPLETAR.subtitulo}</p>
      {!ops.length ? (
        <>
          <p className="text-sm font-semibold mt-3" style={{ color: COLORS.text }}>{TEXTOS_COMPLETAR.vacioTitulo}</p>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>{TEXTOS_COMPLETAR.vacioTexto}</p>
          <div className="mt-3"><GhostBtn onClick={onCancelar}>{TEXTOS_COMPLETAR.cancelar}</GhostBtn></div>
        </>
      ) : (
        <>
          <p className="text-xs font-semibold mt-3" style={{ color: COLORS.text }}>{TEXTOS_COMPLETAR.elegir}</p>
          <div className="flex flex-col gap-1.5 mt-1.5" role="radiogroup" aria-label={TEXTOS_COMPLETAR.elegir}>
            {ops.map((x) => (
              <button
                key={x.clave}
                type="button"
                role="radio"
                aria-checked={x.clave === clave}
                onClick={() => setClave(x.clave)}
                className="text-left rounded-xl px-3 py-2 toque-44"
                style={{ background: COLORS.surface2, border: `1px solid ${x.clave === clave ? accent : COLORS.border}` }}
              >
                <span className="block text-sm font-semibold" style={{ color: COLORS.text }}>{x.nombre}</span>
                <span className="block text-xs" style={{ color: COLORS.textMuted }}>{x.detalle}</span>
              </button>
            ))}
          </div>
          <p className="text-xs font-semibold mt-3" style={{ color: COLORS.text }}>{TEXTOS_COMPLETAR.fecha}</p>
          <TextInput type="date" value={fecha} max={hoy} aria-label={TEXTOS_COMPLETAR.fecha} onChange={(e) => setFecha(e.target.value)} />
          <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>{TEXTOS_COMPLETAR.sinDetalles}</p>
          {error && <p role="alert" className="text-xs mt-2" style={{ color: COLORS.negative }}>{error}</p>}
          <div className="flex gap-2 flex-wrap mt-3">
            <PrimaryButton accent={accent} icon={CheckCheck} disabled={!elegida} onClick={() => elegida && onCompletar(elegida, fecha)}>
              {elegida ? `Completar «${elegida.nombre}» ${etiquetaDelDia(fecha, hoy)}` : TEXTOS_COMPLETAR.confirmar}
            </PrimaryButton>
            <GhostBtn onClick={onCancelar}>{TEXTOS_COMPLETAR.cancelar}</GhostBtn>
          </div>
        </>
      )}
    </Card>
  );
}

/** El origen de una sesión en el historial: las dos fechas y cómo se registró. */
export function MarcaDeCumplimiento({ sesion, accent }) {
  const d = (sesion && sesion.diaDePlan) || {};
  const lineas = [];
  if (d.clase === 'recuperacion' && d.fechaPrevista) lineas.push(`Recuperación: debía hacerse el ${diaYMes(d.fechaPrevista)} y se hizo el ${diaYMes(sesion.fecha)}.`);
  if (d.clase === 'libre') lineas.push('Sesión libre: no era el entrenamiento previsto ese día.');
  if (sesion && sesion.completadaCon === 'completar') lineas.push(`${TEXTOS_COMPLETAR.marca}: sin pesos, repeticiones ni tiempos registrados.`);
  if (!lineas.length) return null;
  return (
    <div className="mt-2 flex flex-col gap-0.5">
      {lineas.map((t) => (
        <p key={t} className="text-xs" style={{ color: d.clase === 'recuperacion' ? acentoLegible(accent) : COLORS.textMuted }}>{t}</p>
      ))}
    </div>
  );
}
