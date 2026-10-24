/* Fase 2 · Chatbots — la hoja de conversación y su botón
   ═══════════════════════════════════════════════════════════════════════════

   La interfaz de los asistentes por reglas (especificación §10). **No sabe nada
   de ningún módulo**: recibe el asistente, una función que le da SOLO sus datos
   (`leerDatos`, que llama a `datosParaAsistente` en el momento de preguntar) y
   la conversación, que vive en el estado de `App.jsx` —en memoria: se pierde al
   recargar o al cambiar de cuenta, y nunca se guarda (P-07, H-01)—.

   🚨 **Ninguna animación propia** (Motion System, regla permanente): la hoja es
   un portal con `fixed inset-0 z-capa` y `CAPAS.veloHoja`, así que su entrada y
   su salida las pone `useCapasMotion`; la lista es `ListaAnimada` (cada mensaje
   con su `data-flip-id`); bajar a la última respuesta es `desplazarHasta`, que
   salta en Reducido; el asa es `AsaHoja` con la misma función que «Cerrar»; el
   teclado y el foco, `useDialogoAccesible`.

   🚨 **No se presenta como IA** (DA-07): la cabecera lo dice con esas palabras. */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, Send, X, RotateCcw, ArrowRight } from 'lucide-react';
import { COLORS, CAPAS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { AsaHoja } from './gestosMotion';
import { useDialogoAccesible } from './dialogoAccesible';
import { ListaAnimada } from './layoutMotion';
import { desplazarHasta } from '../lib/accesibilidadMotion';
import {
  NATURALEZAS, MAX_MENSAJE, conversacionVacia, conversarCon,
} from '../lib/motorConversacion';

/** La conversación vacía de un usuario (lo que guarda `App.jsx`, en memoria). */
/* v3.161.3 — la conversación vacía y el «enviar un mensaje» viven en el núcleo (`conversarCon`), para que el
   botón «Analizar mi sueño» pueda abrir la hoja con la primera pregunta ya contestada. */
export { conversacionVacia };

/** El botón de la barra del módulo. «Asistente», no «Preguntar»: Estudios ya tiene un «Preguntar» (H-06).
 *  D7 — se ve igual que «← Volver», a su lado, y `toque-44` le da la zona de toque de 44 px por encima y
 *  por debajo sin cambiar su dibujo. */
export function BotonAsistente({ asistente, onAbrir, accent }) {
  if (!asistente) return null;
  return (
    <button
      type="button"
      onClick={onAbrir}
      aria-haspopup="dialog"
      aria-label={`Abrir el asistente de ${asistente.nombre}`}
      className="back-bar toque-44 inline-flex items-center gap-1.5 mb-4 pl-2.5 pr-3.5 py-1.5 rounded-full text-sm font-semibold active:opacity-60"
      style={{ color: COLORS.textMuted, background: hexToRgba(COLORS.border, 0.35) }}
    >
      <MessageCircle size={16} style={{ color: accent }} aria-hidden="true" /> Asistente
    </button>
  );
}

/* ── Una respuesta, pintada bloque a bloque ─────────────────────────────── */
function Bloque({ b }) {
  if (b.tipo === 'texto') return <p className="text-sm leading-relaxed" style={{ color: COLORS.text }}>{b.texto}</p>;
  if (b.tipo === 'nota') return <p className="text-xs leading-relaxed" style={{ color: COLORS.textMuted }}>{b.texto}</p>;
  if (b.tipo === 'lista') {
    return (
      <ul className="space-y-1">
        {b.items.map((t, i) => <li key={`${i}-${t}`} className="text-sm leading-snug" style={{ color: COLORS.text }}>· {t}</li>)}
      </ul>
    );
  }
  if (b.tipo === 'cifra') {
    return (
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs" style={{ color: COLORS.textMuted }}>{b.etiqueta}</span>
        <span className="text-sm font-semibold text-right" style={{ color: COLORS.text }}>
          {b.valor}
          {(b.detalle || b.naturaleza !== 'dato') && (
            <span className="block text-xs font-normal" style={{ color: COLORS.textMuted }}>
              {[b.detalle, b.naturaleza !== 'dato' ? NATURALEZAS[b.naturaleza] : null].filter(Boolean).join(' · ')}
            </span>
          )}
        </span>
      </div>
    );
  }
  return null;
}

export function RespuestaAsistente({ respuesta, accent, onOpcion, onNavegar, pendienteId = null }) {
  const r = respuesta;
  /* v3.161.2 — las opciones de una aclaración solo valen mientras esa aclaración es la pendiente; las de
     una pregunta anterior se ven apagadas (y el núcleo tampoco las ejecutaría: `opcion.origen`). */
  const caducada = (o) => !!o.origen && o.origen !== pendienteId;
  const hayCaducadas = r.opciones.some(caducada);
  return (
    <div className="rounded-2xl p-3 space-y-2 max-w-[92%]" style={{ background: COLORS.surface2 }}>
      {r.bloques.map((b, i) => <Bloque key={i} b={b} />)}
      {r.confianza === 'pocos_datos' && <p className="text-xs" style={{ color: COLORS.textMuted }}>Con pocos datos: tómalo como orientativo.</p>}
      {r.fuente && <p className="text-xs" style={{ color: COLORS.textMuted }}>{r.fuente}</p>}
      {(r.opciones.length > 0 || r.acciones.length > 0) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {/* D5 — la clave lleva la posición: dos opciones nunca comparten clave aunque digan lo mismo.
              D7 — 44 px de alto como mínimo: son botones que se tocan con el pulgar. */}
          {r.opciones.map((o, i) => (
            <button key={`${i}-${o.texto}`} type="button"
              disabled={caducada(o)}
              aria-label={caducada(o) ? `${o.texto} (de una pregunta anterior)` : undefined}
              onClick={() => onOpcion(o.mensaje || o.texto, o.origen ? { origen: o.origen, indice: i } : null)}
              className="inline-flex items-center min-h-[44px] px-3 py-2 rounded-full text-xs font-semibold active:opacity-60 text-left disabled:opacity-50"
              style={{ color: COLORS.text, background: hexToRgba(accent, 0.14), border: `1px solid ${hexToRgba(accent, 0.35)}` }}>
              {o.texto}
            </button>
          ))}
          {r.acciones.map((a, i) => (
            <button key={`${i}-${a.texto}`} type="button" onClick={() => onNavegar(a.destino)}
              className="inline-flex items-center gap-1 min-h-[44px] px-3 py-2 rounded-full text-xs font-semibold active:opacity-60"
              style={{ color: COLORS.textOnAccent, background: accent }}>
              {a.texto} <ArrowRight size={14} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
      {hayCaducadas && <p className="text-xs" style={{ color: COLORS.textMuted }}>Estas opciones eran de una pregunta anterior.</p>}
    </div>
  );
}

/**
 * Lo de dentro de la hoja: la conversación y la caja de escribir. Va aparte para que el banco de
 * renderizado lo pueda pintar sin portal.
 */
export function ConversacionAsistente({ asistente, conversacion, onEnviar, onNavegar, accent }) {
  const [texto, setTexto] = useState('');
  const finRef = useRef(null);
  const mensajes = (conversacion && conversacion.mensajes) || [];
  const ultimo = mensajes.length ? mensajes[mensajes.length - 1].id : null;

  useEffect(() => {
    if (ultimo && finRef.current) desplazarHasta(finRef.current, { block: 'end' });
  }, [ultimo]);

  const pendienteId = (conversacion && conversacion.contexto && conversacion.contexto.pendiente && conversacion.contexto.pendiente.id) || null;

  const enviar = (valor, opcion = null) => {
    const t = String(valor ?? '').trim();
    if (!t) return;
    onEnviar(t.slice(0, MAX_MENSAJE), opcion);
    setTexto('');
  };
  const sugerencias = (asistente.capacidades || []).filter((c) => c.ejemplo).slice(0, 4);

  return (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2" style={{ overscrollBehavior: 'contain' }}>
        {mensajes.length === 0 && (
          <div className="space-y-3 py-2">
            <p className="text-sm leading-relaxed" style={{ color: COLORS.text }}>{asistente.saludo}</p>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>Prueba con:</p>
            <div className="flex flex-wrap gap-2">
              {sugerencias.map((c) => (
                <button key={c.id} type="button" onClick={() => enviar(c.ejemplo)}
                  className="inline-flex items-center min-h-[44px] px-3 py-2 rounded-full text-xs font-semibold active:opacity-60 text-left"
                  style={{ color: COLORS.text, background: hexToRgba(accent, 0.14), border: `1px solid ${hexToRgba(accent, 0.35)}` }}>
                  {c.ejemplo}
                </button>
              ))}
            </div>
          </div>
        )}
        <ListaAnimada role="log" aria-live="polite" aria-label={`Conversación con el asistente de ${asistente.nombre}`} className="space-y-3">
          {mensajes.map((m) => (
            <div key={m.id} data-flip-id={m.id} className={m.rol === 'yo' ? 'flex justify-end' : 'flex justify-start'}>
              {m.rol === 'yo' ? (
                <p className="rounded-2xl px-3 py-2 text-sm max-w-[85%] break-words" style={{ color: COLORS.text, background: hexToRgba(accent, 0.18) }}>
                  <span className="sr-only">Tú: </span>{m.texto}
                </p>
              ) : (
                <RespuestaAsistente respuesta={m.respuesta} accent={accent} onOpcion={enviar} onNavegar={onNavegar} pendienteId={pendienteId} />
              )}
            </div>
          ))}
        </ListaAnimada>
        <div ref={finRef} aria-hidden="true" />
      </div>
      <form className="flex items-center gap-2 px-4 pt-2" onSubmit={(ev) => { ev.preventDefault(); enviar(texto); }}>
        {/* ⚠️ El mismo aspecto que `TextInput` (ui.jsx), escrito aquí a propósito: importar `ui.jsx`
            arrastraría `ai.js` (los paneles de IA viven ahí) a lo que alcanza el chat, y la suite exige
            que no llegue ni una línea de IA generativa (DA-09). */}
        <input
          value={texto}
          onChange={(ev) => setTexto(ev.target.value)}
          maxLength={MAX_MENSAJE}
          enterKeyHint="send"
          autoComplete="off"
          aria-label="Escribe tu pregunta"
          placeholder={`Pregunta sobre ${asistente.nombre.toLowerCase()}…`}
          className="campo w-full rounded-xl px-3 py-2.5 outline-none"
          style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, color: COLORS.text, fontSize: 16 }}
        />
        <button type="submit" aria-label="Enviar la pregunta"
          className="toque-44 w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90"
          style={{ background: accent, color: COLORS.textOnAccent }}>
          <Send size={18} aria-hidden="true" />
        </button>
      </form>
    </>
  );
}

/**
 * La hoja entera.
 * @param {object} p
 * @param {boolean} p.abierto
 * @param {object}  p.asistente
 * @param {object}  p.conversacion  `{ usuario, contexto, mensajes }`
 * @param {(c) => void} p.onCambiar
 * @param {() => object} p.leerDatos   SOLO sus claves (`datosParaAsistente`)
 * @param {() => string[]} p.leerSinCargar  `clavesSinCargar()`
 * @param {string} p.hoy
 * @param {Array} p.ajenos
 * @param {() => void} p.onCerrar
 * @param {(modulo: string) => void} p.onNavegar
 */
export function HojaAsistente({ abierto, asistente, conversacion, onCambiar, leerDatos, leerSinCargar, hoy, ajenos, usuario = null, onCerrar, onNavegar, accent }) {
  /* El hook va ANTES del `return null` (regla de los hooks y regla 4). */
  const caja = useDialogoAccesible(abierto && !!asistente, onCerrar);
  if (!abierto || !asistente) return null;
  const conv = conversacion && conversacion.usuario === usuario ? conversacion : conversacionVacia(usuario);

  const enviar = (texto, opcion = null) => {
    const nueva = conversarCon(asistente, conv, texto, {
      usuario, datos: leerDatos ? leerDatos() : {}, hoy,
      sinCargar: leerSinCargar ? leerSinCargar() : [], ajenos, opcion,
    });
    if (nueva !== conv) onCambiar(nueva);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-capa flex items-end justify-center"
      style={{ background: CAPAS.veloHoja }}
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-label={`Asistente de ${asistente.nombre}`}
    >
      <div
        ref={caja}
        tabIndex={-1}
        className="dialogo-caja hoja-movil w-full max-w-md rounded-t-3xl flex flex-col"
        style={{ background: COLORS.surface, paddingBottom: 'calc(var(--safe-bottom) + 0.75rem)' }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="px-5 pt-5">
          <AsaHoja cajaRef={caja} onCerrar={onCerrar} />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-base font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>Asistente de {asistente.nombre}</p>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>Respuestas calculadas con tus datos de {asistente.nombre}. No es una IA y no guarda nada.</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {conv.mensajes.length > 0 && (
                <button type="button" onClick={() => onCambiar(conversacionVacia(usuario))} aria-label="Empezar una conversación nueva"
                  className="toque-44 p-2 rounded-full active:opacity-60" style={{ background: COLORS.surface2 }}>
                  <RotateCcw size={16} style={{ color: COLORS.text }} aria-hidden="true" />
                </button>
              )}
              <button type="button" onClick={onCerrar} aria-label="Cerrar el asistente" className="toque-44 p-2 rounded-full" style={{ background: COLORS.surface2 }}>
                <X size={16} style={{ color: COLORS.text }} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        <ConversacionAsistente asistente={asistente} conversacion={conv} onEnviar={enviar} onNavegar={onNavegar} accent={accent} />
      </div>
    </div>,
    document.body,
  );
}
