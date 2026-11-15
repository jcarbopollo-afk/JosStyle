import React, { useEffect, useRef, useState } from 'react';
import { CircleAlert, RotateCw, ShieldCheck } from 'lucide-react';
import { ChevronDespliegue } from './motion';
import { Plegable } from './layoutMotion';
import { Card } from './ui';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { MOTIVOS_BLOQUEO_GUARDIA, TEXTOS_NO_VERIFICABLE, fechaLocal, esMotivoDeGuardia } from '../lib/guardiaHorario';

function Fila({ nombre, valor }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs py-0.5">
      <span style={{ color: COLORS.textMuted }}>{nombre}</span>
      <span className="font-bold tabular-nums" style={{ color: COLORS.text }}>{valor}</span>
    </div>
  );
}

function Bloque({ titulo, children }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider mt-3 mb-1" style={{ color: COLORS.textMuted }}>{titulo}</p>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   🛡 HORARIOS A-BIS — LOS AVISOS DE LA GUARDIA Y LA PANTALLA DE CONSULTA (§8 y §10)

   🚨 **SOLO CONSULTA.** Ni retirar un aparato, ni resolver una incidencia (eso es la entrega corta, C-3): aquí
   se enseña lo que la guardia leyó de la cuenta, y lo único que se puede pulsar es «Reintentar» cuando la
   comprobación no se pudo hacer (vuelve a leer; no cambia nada que no esté ya decidido).
   =========================================================================== */
const TEXTOS_GUARDIA = {
  [MOTIVOS_BLOQUEO_GUARDIA.comprobando]: 'Comprobando tu horario. Mientras tanto se ve, pero no se guardan cambios en él.',
  [MOTIVOS_BLOQUEO_GUARDIA.noVerificable]: 'No se ha podido comprobar tu horario. Para no estropear nada, no se guardan cambios en él hasta que se pueda comprobar.',
  [MOTIVOS_BLOQUEO_GUARDIA.incidencia]: 'Tu horario pudo cambiar desde otra versión de JosStyle y todavía no se ha podido apuntar en tu cuenta. Hasta que se apunte, no se guardan cambios en él.',
};

export function AvisoGuardiaHorario({ motivo, guardia, accent, onReintentar }) {
  const detalle = motivo === MOTIVOS_BLOQUEO_GUARDIA.noVerificable && guardia && guardia.motivo
    ? TEXTOS_NO_VERIFICABLE[guardia.motivo] || null : null;
  const conBoton = motivo !== MOTIVOS_BLOQUEO_GUARDIA.comprobando && typeof onReintentar === 'function';
  return (
    <Card>
      <div role="status" className="flex items-start gap-2">
        <CircleAlert size={16} className="flex-shrink-0 mt-0.5" style={{ color: COLORS.warning }} aria-hidden="true" />
        <p className="text-xs flex-1" style={{ color: COLORS.text }}>
          {TEXTOS_GUARDIA[motivo]}{detalle ? ` ${detalle}` : ''}
        </p>
      </div>
      {conBoton && (
        <button
          type="button"
          onClick={onReintentar}
          className="mt-2 flex items-center gap-1.5 text-xs font-semibold toque-44"
          style={{ color: accent || COLORS.info }}
        >
          <RotateCw size={13} aria-hidden="true" /> Reintentar
        </button>
      )}
    </Card>
  );
}

const MOTIVOS_REGISTRO = {
  testigo_ausente: 'Falta el testigo del horario',
  testigo_ilegible: 'El testigo del horario no se puede leer',
  fila_ausente: 'Falta el horario entero',
};
const ESTADOS_CONDICION = { cumple: 'Cumple', no_cumple: 'No cumple', no_verificable: 'No verificable' };
const NOMBRES_CONDICION = {
  margen: '1 · Margen de tiempo', incidencias: '2 · Sin incidencias abiertas', testigo: '3 · Testigo demostrado',
  versiones: '4 · Versiones de tus aparatos', confirmacion: '5 · Tu confirmación',
};
const corto = (id) => (typeof id === 'string' ? id.slice(0, 8) : '—');
const fechaDe = (en) => (typeof en === 'string' ? fechaLocal(new Date(en)) || '—' : '—');

function Registros({ titulo, registros, explica }) {
  return (
    <Bloque titulo={titulo}>
      {explica && <p className="text-[11px] mb-1" style={{ color: COLORS.textMuted }}>{explica}</p>}
      {registros.length === 0 ? (
        <p className="text-xs" style={{ color: COLORS.textMuted }}>Ninguno.</p>
      ) : (
        <ul className="space-y-1.5">
          {registros.map((g) => (
            <li key={g.clave} className="text-xs" style={{ color: COLORS.text }}>
              <span className="font-semibold">{MOTIVOS_REGISTRO[g.registros[0].motivo] || g.registros[0].motivo}</span>
              {g.registros.length > 1 ? ` · ${g.registros.length} avisos del mismo estado` : ''}
              {g.registros.map((r) => (
                <span key={r.id} className="block text-[11px]" style={{ color: COLORS.textMuted }}>
                  {`Aviso ${corto(r.id)} · ${r.fecha || fechaDe(r.en)} · aparato ${corto(r.aparato)} · ${r.sinApuntar ? 'todavía sin apuntar en tu cuenta' : r.resuelto ? 'resuelto' : 'abierto'}`}
                  {r.evidencia ? ` · ${r.evidencia.teniaVersion ? 'con versión' : 'sin versión'} · ${r.evidencia.horarios ?? '—'} horarios, ${r.evidencia.reglas ?? '—'} clases` : ''}
                </span>
              ))}
            </li>
          ))}
        </ul>
      )}
    </Bloque>
  );
}

const agrupar = (lista) => {
  const grupos = new Map();
  for (const r of lista) {
    const k = r.huella || `sin-huella-${r.id}`;
    if (!grupos.has(k)) grupos.set(k, { clave: k, registros: [] });
    grupos.get(k).registros.push(r);
  }
  return [...grupos.values()];
};

/** La pantalla de consulta (§10). Se exporta para probarla. */
export function ConsultaGuardiaHorario({ guardia, onEvaluar = null }) {
  const [evaluacion, setEvaluacion] = useState(null);
  /* Se evalúa al abrir y cada vez que cambia lo que la guardia sabe (no en cada pintado de la aplicación). */
  const evaluarRef = useRef(onEvaluar);
  evaluarRef.current = onEvaluar;
  const claveEvaluacion = guardia ? `${guardia.estado}|${guardia.pendientes}|${guardia.filas.length}|${guardia.estadoRegistro}` : '';
  useEffect(() => {
    const evaluar = evaluarRef.current;
    if (typeof evaluar !== 'function') return undefined;
    let vivo = true;
    Promise.resolve(evaluar({})).then((r) => { if (vivo) setEvaluacion(r || null); }, () => { if (vivo) setEvaluacion(null); });
    return () => { vivo = false; };
  }, [claveEvaluacion]);
  if (!guardia) return null;
  const r = guardia.resumen;
  /* El aviso de esta sesión que todavía no se ha confirmado en el servidor también se enseña, en su bloque. */
  const pendiente = guardia.registroPendiente && !(r && r.registros.some((x) => x.id === guardia.registroPendiente.id))
    ? [{ ...guardia.registroPendiente, aparato: guardia.aparato, sinApuntar: true }] : [];
  const registros = [...(r ? r.registros : []), ...pendiente];
  const perdidas = agrupar(registros.filter((x) => x.clase === 'perdida'));
  const ambiguas = agrupar(registros.filter((x) => x.clase !== 'perdida'));
  return (
    <div role="region" aria-label="Comprobación de tus aparatos" className="mt-2">
      <Bloque titulo="Estado">
        <Fila nombre="Estado del testigo" valor={guardia.textoTestigo} />
        {guardia.estado === 'no_verificable' && (
          <p className="text-xs py-0.5" style={{ color: COLORS.negative }}>{TEXTOS_NO_VERIFICABLE[guardia.motivo] || 'No se ha podido comprobar.'}</p>
        )}
        {guardia.registroPendiente && (
          <p className="text-xs py-0.5" style={{ color: COLORS.negative }}>Hay un aviso que todavía no se ha podido apuntar en tu cuenta.</p>
        )}
      </Bloque>
      <Bloque titulo="Tus aparatos">
        {guardia.filas.length === 0 ? (
          <p className="text-xs" style={{ color: COLORS.textMuted }}>Ninguno apuntado todavía.</p>
        ) : guardia.filas.map((f) => {
          /* Su estado: retirado si hay una retirada vigente (la que vio su secuencia actual), en uso si no. */
          const retirado = !!(r && r.retiradas.some((x) => x.aparatoRetirado === f.aparato && x.secuenciaVista === f.secuencia));
          const visitas = Object.entries(f.visitas || {}).map(([v, x]) => `${v} · ${(x && x.ultima && x.ultima.fecha) || '—'}`).join(' · ') || '—';
          return (
            <Fila
              key={f.aparato}
              nombre={`${f.etiqueta || `Aparato ${corto(f.aparato)}`}${f.aparato === guardia.aparato ? ' (este)' : ''}`}
              valor={`${visitas} · ${retirado ? 'retirado' : 'en uso'}`}
            />
          );
        })}
      </Bloque>
      <Registros titulo="Pérdidas" registros={perdidas} explica="Una copia anterior de JosStyle escribió tu horario después de que esta comprobación lo viera." />
      <Registros titulo="Casos ambiguos" registros={ambiguas} explica="No se puede saber si antes escribió una copia antigua." />
      <Bloque titulo="Retiradas y resoluciones">
        {r && (r.retiradas.length || r.resoluciones.length) ? (
          <>
            {r.retiradas.map((x) => <Fila key={x.id} nombre={`Retirada ${corto(x.id)}`} valor={`aparato ${corto(x.aparatoRetirado)} · ${x.fecha || fechaDe(x.en)}`} />)}
            {r.resoluciones.map((x) => <Fila key={x.id} nombre={`Resolución ${corto(x.id)}`} valor={`${(x.deteccionIds || []).length} aviso(s) · ${x.reconocida ? (x.decision || '—') : 'no reconocida'}`} />)}
          </>
        ) : (
          <p className="text-xs" style={{ color: COLORS.textMuted }}>Ninguna.</p>
        )}
      </Bloque>
      <Bloque titulo="Intenciones">
        <Fila nombre="Apuntadas" valor={r ? r.intenciones.length : 0} />
      </Bloque>
      <Bloque titulo="Las cinco condiciones">
        {!evaluacion ? (
          <p className="text-xs" style={{ color: COLORS.textMuted }}>Todavía sin evaluar.</p>
        ) : (
          <ul className="space-y-1">
            {evaluacion.condiciones.map((c) => (
              <li key={c.id} className="text-xs" style={{ color: COLORS.text }}>
                <span className="font-semibold">{NOMBRES_CONDICION[c.id] || c.id}: {ESTADOS_CONDICION[c.estado] || c.estado}</span>
                <span className="block text-[11px]" style={{ color: COLORS.textMuted }}>{c.motivo}</span>
              </li>
            ))}
          </ul>
        )}
      </Bloque>
    </div>
  );
}


/** El plegable de la pantalla de Horario, junto al diagnóstico. No evalúa nada hasta que se abre. */
export function ConsultaGuardiaHorarioEntrada({ guardia, onEvaluar = null, accent }) {
  const [abierto, setAbierto] = useState(false);
  if (!guardia) return null;
  return (
    <Card>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-label="Comprobación de tus aparatos"
        className="w-full flex items-center gap-2 text-left toque-44"
      >
        <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(accent || COLORS.info, 0.12) }}>
          <ShieldCheck size={16} style={{ color: accent || COLORS.info }} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold" style={{ color: COLORS.text }}>Comprobación de tus aparatos</span>
          <span className="block text-[11px]" style={{ color: COLORS.textMuted }}>Solo consulta: no cambia nada</span>
        </span>
        <ChevronDespliegue abierto={abierto} size={16} style={{ color: COLORS.textMuted }} />
      </button>
      <Plegable abierto={abierto}>{() => <div className="mt-1"><ConsultaGuardiaHorario guardia={guardia} onEvaluar={onEvaluar} /></div>}</Plegable>
    </Card>
  );
}

export { esMotivoDeGuardia };
