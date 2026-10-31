/* La hoja de «Completar entrenamiento» (2026-10-26)
   ═══════════════════════════════════════════════════════════════════════════
   Elegir qué entrenamiento hizo y qué día (hoy por defecto, nunca uno futuro), confirmar y guardar. La
   lógica es de `src/lib/completarEntrenamiento.js`: aquí solo se dibuja y se reparte. La abre Fitness
   desde los sitios donde se puede EMPEZAR un entrenamiento (Tu Plan y una plantilla) y desde el
   Historial, ya con el entrenamiento —y el día— que corresponde elegidos.

   Es una hoja de Fitness como las demás: portal (regla 3), `HOJA`, asa (MS F5), foco dentro y Escape
   (`useDialogoAccesible`, F39) y su botón de cerrar (`BotonCerrarHoja`, F42). Un guardado que falla se
   dice (F37): no se celebra lo que no ha llegado a la cuenta. */

import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2 } from 'lucide-react';
import { COLORS } from '../tokens';
import { Field, TextInput, PrimaryButton, GhostBtn } from './ui';
import { useDialogoAccesible } from './dialogoAccesible';
import { AsaHoja } from './gestosMotion';
import { HOJA, acentoLegible } from '../lib/acabadoFitness';
import { BotonCerrarHoja } from './piezasFitness';
import {
  TEXTOS_COMPLETAR as T, opcionesParaCompletar, opcionPreseleccionada, comprobarCompletar,
  registrarEntrenamientoHecho, etiquetaDelDia,
} from '../lib/completarEntrenamiento';
import { todayISO, hexToRgba } from '../lib/helpers';

/**
 * @param {object} p
 * @param {object} p.fitness       lo guardado
 * @param {object} [p.preseleccion] `{ indiceDelPlan }` o `{ plantillaId }`, y si se quiere, `fecha`
 * @param {(fitness) => Promise<{ok:boolean}>} p.onGuardar  el guardado de Fitness (lee si ha llegado)
 * @param {() => void} p.onCerrar
 */
export function CompletarEntrenamiento({ fitness, preseleccion = null, accent, hoy: hoyProp = null, onGuardar, onCerrar }) {
  const hoy = hoyProp || todayISO();
  const opciones = useMemo(() => opcionesParaCompletar(fitness || {}), [fitness]);
  const inicial = opcionPreseleccionada(opciones, preseleccion || {}) || (opciones.length === 1 ? opciones[0] : null);
  const [clave, setClave] = useState(inicial ? inicial.clave : null);
  const fechaInicial = preseleccion && preseleccion.fecha && preseleccion.fecha <= hoy ? preseleccion.fecha : hoy;
  const [fecha, setFecha] = useState(fechaInicial);
  const [paso, setPaso] = useState('elegir');
  const [aviso, setAviso] = useState(null);
  const [estado, setEstado] = useState(null);
  const caja = useDialogoAccesible(true, onCerrar);
  const opcion = opciones.find((o) => o.clave === clave) || null;
  const acento = acentoLegible(accent);

  const continuar = () => {
    const c = comprobarCompletar(fitness || {}, { opcion, fecha, hoy });
    if (!c.ok) { setAviso(c.mensaje); return; }
    setAviso(null);
    setPaso('confirmar');
  };
  const guardar = () => {
    if (estado === 'cargando') return;
    const r = registrarEntrenamientoHecho(fitness || {}, { opcion, fecha, hoy });
    if (!r.ok) { setAviso(r.mensaje); setPaso('elegir'); return; }
    setEstado('cargando');
    /* MS F16 — la espera vuelve a reposo en un `finally`, aunque el guardado lance. */
    const fallo = () => setAviso('No se ha podido guardar. Revisa tu conexión y vuelve a intentarlo.');
    Promise.resolve()
      .then(() => (onGuardar ? onGuardar(r.fitness) : { ok: false }))
      .then((g) => { if (g && g.ok === false) fallo(); else setPaso('hecho'); }, fallo)
      .finally(() => setEstado(null));
  };

  return createPortal(
    <div
      className={HOJA.velo}
      style={{ background: HOJA.fondoVelo }}
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-label={T.titulo}
    >
      <div
        ref={caja}
        tabIndex={-1}
        className={`${HOJA.caja} space-y-4`}
        style={{ background: COLORS.surface, minHeight: 0, paddingBottom: HOJA.abajo }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <AsaHoja cajaRef={caja} onCerrar={onCerrar} />
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-xl font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{T.titulo}</h2>
            <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{T.subtitulo}</p>
          </div>
          <BotonCerrarHoja onClick={onCerrar} etiqueta="Cerrar sin completar" />
        </div>

        {opciones.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm font-bold" style={{ color: COLORS.text }}>{T.vacioTitulo}</p>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>{T.vacioTexto}</p>
            <GhostBtn onClick={onCerrar}>{T.volver}</GhostBtn>
          </div>
        )}

        {opciones.length > 0 && paso === 'elegir' && (
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold mb-1.5" style={{ color: COLORS.textMuted }}>{T.elegir}</p>
              <div className="space-y-1.5" role="group" aria-label={T.elegir}>
                {opciones.map((o) => {
                  const puesta = o.clave === clave;
                  return (
                    <button
                      key={o.clave}
                      type="button"
                      aria-pressed={puesta}
                      onClick={() => { setClave(o.clave); setAviso(null); }}
                      className="w-full text-left rounded-xl px-3 py-2.5 toque-44 fit-pulsable"
                      style={{ background: puesta ? hexToRgba(accent, 0.14) : COLORS.surface2, border: `1px solid ${puesta ? acento : COLORS.border}` }}
                    >
                      <span className="block text-sm font-semibold truncate" style={{ color: COLORS.text }}>{o.nombre}</span>
                      <span className="block text-xs truncate" style={{ color: COLORS.textMuted }}>{o.detalle}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <Field label={T.fecha}>
              <TextInput type="date" value={fecha} max={hoy} onChange={(ev) => { setFecha(ev.target.value); setAviso(null); }} aria-label={T.fecha} />
            </Field>
            {aviso && <p className="text-xs" role="alert" style={{ color: COLORS.negative }}>{aviso}</p>}
            <div className="flex gap-2 flex-wrap">
              <PrimaryButton accent={accent} onClick={continuar} disabled={!opcion}>{T.continuar}</PrimaryButton>
              <GhostBtn onClick={onCerrar}>{T.cancelar}</GhostBtn>
            </div>
          </div>
        )}

        {opciones.length > 0 && paso === 'confirmar' && opcion && (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: COLORS.text }}>
              ¿Completar «{opcion.nombre}» {etiquetaDelDia(fecha, hoy)}?
            </p>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>{T.sinDetalles}</p>
            {aviso && <p className="text-xs" role="alert" style={{ color: COLORS.negative }}>{aviso}</p>}
            <div className="flex gap-2 flex-wrap">
              <PrimaryButton accent={accent} icon={CheckCircle2} onClick={guardar} estado={estado}>{T.confirmar}</PrimaryButton>
              <GhostBtn onClick={() => { setPaso('elegir'); setAviso(null); }}>{T.volver}</GhostBtn>
            </div>
          </div>
        )}

        {paso === 'hecho' && opcion && (
          <div className="space-y-3" role="status">
            <p className="text-sm font-bold" style={{ color: COLORS.text }}>{T.guardado}</p>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>
              «{opcion.nombre}» queda completado {etiquetaDelDia(fecha, hoy)} y ya cuenta en tu historial y en tu actividad.
            </p>
            <PrimaryButton accent={accent} onClick={onCerrar}>{T.hecho}</PrimaryButton>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
