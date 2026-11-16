import React, { useEffect, useRef, useState } from 'react';
import { CircleAlert, RotateCw, ShieldCheck } from 'lucide-react';
import { ChevronDespliegue } from './motion';
import { Plegable } from './layoutMotion';
import { Card } from './ui';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import {
  MOTIVOS_BLOQUEO_GUARDIA, TEXTOS_NO_VERIFICABLE, fechaLocal, esMotivoDeGuardia,
  DECISIONES_RESOLUCION, TEXTOS_DECISION, MOTIVOS_RETIRADA, TEXTOS_MOTIVO_RETIRADA, TEXTOS_FALLO_ACCION, tieneVisitaReciente,
} from '../lib/guardiaHorario';
import { MOTIVO_CONFLICTO_HORARIO, TEXTOS_CONFLICTO } from '../lib/escritorHorario';

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

   🔓 **E1 — LA ENTREGA CORTA (C-3, D1).** La consulta sigue enseñando lo que la guardia leyó de la cuenta y,
   además, deja hacer las TRES operaciones de la lista cerrada, cada una con su confirmación: retirar un aparato
   sin visitas en 30 días, resolver incidencias abiertas («Revisado: el horario está bien» o «Acepto lo que hay,
   aunque falte algo») y reabrir una resolución. Ninguna toca tu horario: solo la fila de ESTE aparato.
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

/* ═══════════════════════════════════════════════════════════════════════════
   🛡 E1 — EL AVISO DEL CONFLICTO DE EDICIÓN (D2, opción B)
   Tu versión sigue en pantalla; Horarios no guarda nada hasta que elijas. Dos salidas, siempre: «Ver lo que hay
   ahora» (tu cambio queda apartado) y «Descartar mi cambio» (con confirmación). Nunca una escritura forzada.
   =========================================================================== */
export function AvisoConflictoHorario({ escritor, accent, onVerLoDeAhora, onDescartarMiCambio }) {
  const [confirmando, setConfirmando] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const c = escritor && escritor.conflicto;
  if (!c) return null;
  const copia = c.copia || {};
  const textoCopia = copia.estado === 'guardada' ? TEXTOS_CONFLICTO.copiaGuardada
    : copia.estado === 'guardando' ? TEXTOS_CONFLICTO.copiaGuardando : TEXTOS_CONFLICTO.copiaSinGuardar;
  const color = accent || COLORS.info;
  return (
    <Card>
      <div role="alert" className="flex items-start gap-2">
        <CircleAlert size={16} className="flex-shrink-0 mt-0.5" style={{ color: COLORS.warning }} aria-hidden="true" />
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: COLORS.text }}>{TEXTOS_CONFLICTO.titulo}</p>
          <p className="text-xs mt-0.5" style={{ color: COLORS.text }}>{TEXTOS_CONFLICTO.explica}</p>
          <p className="text-xs mt-1" style={{ color: copia.estado === 'sin_guardar' ? COLORS.negative : COLORS.textMuted }}>{textoCopia}</p>
        </div>
      </div>
      {!confirmando ? (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <button type="button" onClick={() => onVerLoDeAhora && onVerLoDeAhora()} className="text-xs font-semibold toque-44" style={{ color }}>
            {TEXTOS_CONFLICTO.verAhora}
          </button>
          <button type="button" onClick={() => setConfirmando(true)} className="text-xs font-semibold toque-44" style={{ color: COLORS.negative }}>
            {TEXTOS_CONFLICTO.descartar}
          </button>
          <p className="w-full text-[11px]" style={{ color: COLORS.textMuted }}>{TEXTOS_CONFLICTO.verAhoraExplica}</p>
        </div>
      ) : (
        <div className="mt-2">
          <p className="text-xs" style={{ color: COLORS.text }}>{TEXTOS_CONFLICTO.descartarConfirma}</p>
          <div className="mt-1 flex gap-4">
            <button type="button" disabled={trabajando} aria-busy={trabajando}
              onClick={async () => { setTrabajando(true); try { if (onDescartarMiCambio) await onDescartarMiCambio(); } finally { setTrabajando(false); setConfirmando(false); } }}
              className="text-xs font-semibold toque-44" style={{ color: COLORS.negative }}>
              {TEXTOS_CONFLICTO.descartarSi}
            </button>
            <button type="button" onClick={() => setConfirmando(false)} className="text-xs font-semibold toque-44" style={{ color }}>
              {TEXTOS_CONFLICTO.cancelar}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

/** 🛡 E1 — una copia apartada que todavía no llegó a la cuenta (después de «Ver lo que hay ahora»). */
export function AvisoApartadaPendiente({ escritor }) {
  if (!escritor || escritor.conflicto || !escritor.apartadasSinGuardar) return null;
  return (
    <Card>
      <div role="status" className="flex items-start gap-2">
        <CircleAlert size={16} className="flex-shrink-0 mt-0.5" style={{ color: COLORS.warning }} aria-hidden="true" />
        <p className="text-xs flex-1" style={{ color: COLORS.text }}>{TEXTOS_CONFLICTO.apartadaPendiente}</p>
      </div>
    </Card>
  );
}
export const esMotivoDeConflicto = (m) => m === MOTIVO_CONFLICTO_HORARIO;

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

function Registros({ titulo, registros, explica, marcados = null, onMarcar = null }) {
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
              {g.registros.map((r) => {
                const texto = `Aviso ${corto(r.id)} · ${r.fecha || fechaDe(r.en)} · aparato ${corto(r.aparato)} · ${r.sinApuntar ? 'todavía sin apuntar en tu cuenta' : r.resuelto ? 'resuelto' : 'abierto'}`
                  + (r.evidencia ? ` · ${r.evidencia.teniaVersion ? 'con versión' : 'sin versión'} · ${r.evidencia.horarios ?? '—'} horarios, ${r.evidencia.reglas ?? '—'} clases` : '');
                /* 🔓 E1 — un aviso ABIERTO y ya apuntado se puede marcar para resolverlo (D1). */
                const marcable = !!onMarcar && !r.resuelto && !r.sinApuntar;
                return marcable ? (
                  <label key={r.id} className="flex items-start gap-1.5 text-[11px] toque-44" style={{ color: COLORS.textMuted }}>
                    <input type="checkbox" checked={!!(marcados && marcados.has(r.id))} onChange={() => onMarcar(r.id)}
                      aria-label={`Marcar el aviso ${corto(r.id)} para resolverlo`} className="mt-0.5" />
                    <span>{texto}</span>
                  </label>
                ) : (
                  <span key={r.id} className="block text-[11px]" style={{ color: COLORS.textMuted }}>{texto}</span>
                );
              })}
            </li>
          ))}
        </ul>
      )}
    </Bloque>
  );
}

/* 🔓 E1 — un mensaje de lo que pasó con la última operación (o por qué no se hizo). */
function Resultado({ resultado }) {
  if (!resultado) return null;
  const bien = resultado.ok;
  return (
    <p role={bien ? 'status' : 'alert'} className="text-xs mt-1" style={{ color: bien ? COLORS.positive : COLORS.negative }}>
      {bien ? resultado.texto : (TEXTOS_FALLO_ACCION[resultado.motivo] || 'No se ha podido hacer. Vuelve a intentarlo.')}
    </p>
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
export function ConsultaGuardiaHorario({ guardia, onEvaluar = null, onRetirar = null, onResolver = null, onReabrir = null, accent = null, ahora = () => Date.now() }) {
  const [evaluacion, setEvaluacion] = useState(null);
  /* 🔓 E1 — la entrega corta: qué se está confirmando, qué está marcado y cómo fue lo último. */
  const [retirando, setRetirando] = useState(null);       // { aparato, motivo }
  const [marcados, setMarcados] = useState(() => new Set());
  const [decidiendo, setDecidiendo] = useState(null);     // decisión elegida, a confirmar
  const [reabriendo, setReabriendo] = useState(null);     // id de la resolución, a confirmar
  const [trabajando, setTrabajando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const color = accent || COLORS.info;
  const hacer = async (fn, textoBien) => {
    setTrabajando(true); setResultado(null);
    try {
      const r = await fn();
      setResultado(r && r.ok ? { ok: true, texto: textoBien } : { ok: false, motivo: (r && r.motivo) || 'sin_confirmar' });
      return r;
    } catch { setResultado({ ok: false, motivo: 'sin_confirmar' }); return null; } finally { setTrabajando(false); }
  };
  /* Se evalúa al abrir y cada vez que cambia lo que la guardia sabe (no en cada pintado de la aplicación). */
  const evaluarRef = useRef(onEvaluar);
  evaluarRef.current = onEvaluar;
  const claveEvaluacion = guardia ? `${guardia.estado}|${guardia.pendientes}|${guardia.filas.length}|${guardia.estadoRegistro}|${guardia.resumen ? `${guardia.resumen.retiradas.length}.${guardia.resumen.resoluciones.length}` : ''}` : '';
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
  const comprobada = guardia.estado !== 'E0' && guardia.estado !== 'no_verificable';
  const marcar = onResolver && comprobada ? (id) => setMarcados((m) => { const n = new Set(m); if (n.has(id)) n.delete(id); else n.add(id); return n; }) : null;
  const abiertas = new Set(registros.filter((x) => !x.resuelto && !x.sinApuntar).map((x) => x.id));
  const marcadosAbiertos = [...marcados].filter((x) => abiertas.has(x));
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
          /* 🔓 E1 — otro aparato sin visitas en 30 días y sin retirar se puede retirar (D1), con su motivo. */
          const retirable = !!onRetirar && comprobada && !retirado && f.aparato !== guardia.aparato && !tieneVisitaReciente(f, ahora());
          const nombre = `${f.etiqueta || `Aparato ${corto(f.aparato)}`}${f.aparato === guardia.aparato ? ' (este)' : ''}`;
          return (
            <div key={f.aparato}>
              <Fila nombre={nombre} valor={`${visitas} · ${retirado ? 'retirado' : 'en uso'}`} />
              {retirable && (!retirando || retirando.aparato !== f.aparato) && (
                <button type="button" onClick={() => { setResultado(null); setRetirando({ aparato: f.aparato, motivo: null }); }}
                  className="text-[11px] font-semibold toque-44" style={{ color }} aria-label={`Retirar ${nombre}`}>
                  Retirar este aparato
                </button>
              )}
              {retirando && retirando.aparato === f.aparato && (
                <div className="mt-1 mb-2" role="group" aria-label={`Retirar ${nombre}`}>
                  <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
                    Deja de contar en la comprobación de versiones. No se borra nada, y si vuelves a abrir JosStyle en ese aparato, la retirada se anula sola.
                  </p>
                  {MOTIVOS_RETIRADA.map((m) => (
                    <label key={m} className="flex items-center gap-1.5 text-xs toque-44" style={{ color: COLORS.text }}>
                      <input type="radio" name={`motivo-${f.aparato}`} checked={retirando.motivo === m} onChange={() => setRetirando({ aparato: f.aparato, motivo: m })} />
                      {TEXTOS_MOTIVO_RETIRADA[m]}
                    </label>
                  ))}
                  <div className="flex gap-4 mt-1">
                    <button type="button" disabled={trabajando || !retirando.motivo} aria-busy={trabajando}
                      onClick={async () => { const r = await hacer(() => onRetirar(f.aparato, retirando.motivo), 'Aparato retirado.'); if (r && r.ok) setRetirando(null); }}
                      className="text-xs font-semibold toque-44" style={{ color: retirando.motivo ? color : COLORS.textMuted }}>
                      Confirmar la retirada
                    </button>
                    <button type="button" onClick={() => setRetirando(null)} className="text-xs font-semibold toque-44" style={{ color: COLORS.textMuted }}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Bloque>
      <Registros titulo="Pérdidas" registros={perdidas} explica="Una copia anterior de JosStyle escribió tu horario después de que esta comprobación lo viera." marcados={marcados} onMarcar={marcar} />
      <Registros titulo="Casos ambiguos" registros={ambiguas} explica="No se puede saber si antes escribió una copia antigua." marcados={marcados} onMarcar={marcar} />
      {marcar && abiertas.size > 0 && (
        <div className="mt-2" role="group" aria-label="Resolver los avisos marcados">
          <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
            {marcadosAbiertos.length ? `${marcadosAbiertos.length} aviso(s) marcado(s).` : 'Marca los avisos que quieras resolver.'} Antes, revisa tu horario y el diagnóstico de tus horarios. Resolver no cambia nada de tu horario.
          </p>
          {!decidiendo ? (
            <div className="flex flex-wrap gap-x-4">
              {DECISIONES_RESOLUCION.map((dcs) => (
                <button key={dcs} type="button" disabled={!marcadosAbiertos.length}
                  onClick={() => { setResultado(null); setDecidiendo(dcs); }}
                  className="text-xs font-semibold toque-44" style={{ color: marcadosAbiertos.length ? color : COLORS.textMuted }}>
                  {TEXTOS_DECISION[dcs]}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <p className="text-xs" style={{ color: COLORS.text }}>{`«${TEXTOS_DECISION[decidiendo]}» para ${marcadosAbiertos.length} aviso(s). ¿Confirmar?`}</p>
              <div className="flex gap-4 mt-1">
                <button type="button" disabled={trabajando} aria-busy={trabajando}
                  onClick={async () => { const r = await hacer(() => onResolver(marcadosAbiertos, decidiendo), 'Resuelto.'); setDecidiendo(null); if (r && r.ok) setMarcados(new Set()); }}
                  className="text-xs font-semibold toque-44" style={{ color }}>
                  Confirmar
                </button>
                <button type="button" onClick={() => setDecidiendo(null)} className="text-xs font-semibold toque-44" style={{ color: COLORS.textMuted }}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}
      <Resultado resultado={resultado} />
      <Bloque titulo="Retiradas y resoluciones">
        {r && (r.retiradas.length || r.resoluciones.length) ? (
          <>
            {r.retiradas.map((x) => <Fila key={x.id} nombre={`Retirada ${corto(x.id)}`} valor={`aparato ${corto(x.aparatoRetirado)} · ${x.fecha || fechaDe(x.en)}`} />)}
            {r.resoluciones.map((x) => (
              <div key={x.id}>
                <Fila nombre={`Resolución ${corto(x.id)}`} valor={`${(x.deteccionIds || []).length} aviso(s) · ${x.reconocida ? (TEXTOS_DECISION[x.decision] || x.decision || '—') : 'no reconocida'}${x.vigente === false && DECISIONES_RESOLUCION.includes(x.decision) ? ' · reabierta' : ''}`} />
                {onReabrir && comprobada && x.vigente && (reabriendo !== x.id ? (
                  <button type="button" onClick={() => { setResultado(null); setReabriendo(x.id); }} className="text-[11px] font-semibold toque-44" style={{ color }}
                    aria-label={`Reabrir la resolución ${corto(x.id)}`}>
                    Reabrir
                  </button>
                ) : (
                  <div className="flex items-center gap-4">
                    <span className="text-[11px]" style={{ color: COLORS.textMuted }}>Sus avisos vuelven a quedar abiertos.</span>
                    <button type="button" disabled={trabajando} aria-busy={trabajando}
                      onClick={async () => { await hacer(() => onReabrir(x.id), 'Reabierta.'); setReabriendo(null); }}
                      className="text-xs font-semibold toque-44" style={{ color }}>Confirmar</button>
                    <button type="button" onClick={() => setReabriendo(null)} className="text-xs font-semibold toque-44" style={{ color: COLORS.textMuted }}>Cancelar</button>
                  </div>
                ))}
              </div>
            ))}
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
export function ConsultaGuardiaHorarioEntrada({ guardia, onEvaluar = null, accent, onRetirar = null, onResolver = null, onReabrir = null }) {
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
          <span className="block text-[11px]" style={{ color: COLORS.textMuted }}>{onRetirar || onResolver ? 'Consulta tus aparatos; retirar o resolver pide confirmación' : 'Solo consulta: no cambia nada'}</span>
        </span>
        <ChevronDespliegue abierto={abierto} size={16} style={{ color: COLORS.textMuted }} />
      </button>
      <Plegable abierto={abierto}>{() => <div className="mt-1"><ConsultaGuardiaHorario guardia={guardia} onEvaluar={onEvaluar} onRetirar={onRetirar} onResolver={onResolver} onReabrir={onReabrir} accent={accent} /></div>}</Plegable>
    </Card>
  );
}

export { esMotivoDeGuardia };
