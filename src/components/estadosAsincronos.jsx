import React, { useEffect, useRef, useState } from 'react';
import { WifiOff, AlertTriangle, Check, CloudOff } from 'lucide-react';
import { COLORS } from '../tokens';
import { sombra } from '../lib/profundidad';
import { resumenSincronizacion, suscribirSincronizacion } from '../lib/sincronizacion';
import {
  estadoDeSincronizacion, siguienteIndicador, contenidoDeIndicador, estadoDeEspera, crearTurnos, TEXTOS_ARRANQUE,
} from '../lib/estadosAsincronos';
import { reintentarGuardados } from '../lib/supabase';
import { Presencia, CambioDeContenido } from './motion';
import { GiroDeCarga } from './accesibilidadMotion';
import { TextoDeBoton } from './ui';
import { useVacioQueLlega } from './vacioMotion';

/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · F16 — LAS PIEZAS DE LOS ESTADOS DEL SISTEMA

   La decisión vive en `src/lib/estadosAsincronos.js` (se prueba en Node); la
   cuenta de lo que se guarda, en `sincronizacion.js`. Aquí, lo que necesita
   React: escuchar, pintar y limpiar al desmontarse (apartado 50).
   =========================================================================== */

/**
 * La última petición gana (apartado 41) y lo que conteste después de cerrar la
 * pantalla no pinta nada (apartado 50). Los turnos se crean en el efecto: con
 * `StrictMode` el efecto se deshace y se rehace, y unos turnos cerrados al
 * deshacerlo no servirían para el montaje de verdad.
 */
export function useTurnos() {
  const ref = useRef(null);
  if (!ref.current) ref.current = crearTurnos();
  useEffect(() => {
    const t = crearTurnos();
    ref.current = t;
    return () => t.cerrar();
  }, []);
  const delegado = useRef(null);
  if (!delegado.current) {
    delegado.current = {
      nuevo: () => ref.current.nuevo(),
      cancelar: () => ref.current.cancelar(),
    };
  }
  return delegado.current;
}

const ICONOS = { sin_cargar: AlertTriangle, pendiente: CloudOff, pendiente_sin_conexion: WifiOff, sin_conexion: WifiOff, guardado: Check };
const colorDeTono = (tono) => (tono === 'error' ? COLORS.negative : tono === 'aviso' ? COLORS.warning : tono === 'bien' ? COLORS.positive : COLORS.textMuted);

/**
 * 🔓 **EL INDICADOR DE ARRIBA** (apartados 26-33). Uno para toda la aplicación,
 * vacío casi siempre. Dice lo que no se ha podido cargar, lo que no ha llegado
 * a la cuenta, la falta de conexión, un guardado que tarda y, un momento,
 * «Guardado» cuando todo eso se resuelve. Entra y sale como un aviso
 * (`toastEnter` / `toastExit`, por `Presencia`) y cambia de frase con un
 * fundido en su sitio (`CambioDeContenido`): nada de animaciones globales.
 *
 * ♿ Lo que dice se anuncia desde dos regiones que están SIEMPRE montadas (una
 * región viva que nace con su texto no se lee): `status` y, para lo que no se
 * pudo cargar, `alert`.
 */
export function IndicadorDeSincronizacion() {
  const [resumen, setResumen] = useState(() => resumenSincronizacion());
  const [enLinea, setEnLinea] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine !== false));
  const [caidaDesde, setCaidaDesde] = useState(() => (typeof navigator !== 'undefined' && navigator.onLine === false ? Date.now() : null));
  const [, setTic] = useState(0);
  const visto = useRef({ id: 'oculto', desde: 0 });
  const ultimo = useRef(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => suscribirSincronizacion(setResumen), []);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const vuelve = () => { setEnLinea(true); setCaidaDesde(null); };
    const cae = () => { setEnLinea(false); setCaidaDesde(Date.now()); };
    window.addEventListener('online', vuelve);
    window.addEventListener('offline', cae);
    return () => {
      window.removeEventListener('online', vuelve);
      window.removeEventListener('offline', cae);
    };
  }, []);

  const ahora = Date.now();
  const decision = estadoDeSincronizacion({ resumen, enLinea, sinConexionDesde: caidaDesde, ahora });
  const sig = siguienteIndicador(visto.current, decision, ahora);
  const contenido = contenidoDeIndicador(sig.id, resumen);
  const visible = sig.id !== 'oculto';
  if (visible) ultimo.current = contenido;
  const pintado = visible ? contenido : ultimo.current;

  useEffect(() => { visto.current = { id: sig.id, desde: sig.desde }; });
  /* Lo que cambia con el reloj —un guardado que pasa a ser lento, una caída que
     dura, «Guardado» que ya se ha leído— se vuelve a mirar una vez, cuando toca. */
  useEffect(() => {
    if (sig.revisarEn === null || sig.revisarEn === undefined) return undefined;
    const reloj = setTimeout(() => setTic((n) => n + 1), sig.revisarEn + 20);
    return () => clearTimeout(reloj);
  });

  const actuar = async () => {
    if (!pintado || !pintado.accion || ocupado) return;
    if (pintado.accion.id === 'recargar') {
      if (typeof window !== 'undefined') window.location.reload();
      return;
    }
    setOcupado(true);
    try { await reintentarGuardados(); } finally { setOcupado(false); }
  };

  const Icono = pintado ? ICONOS[pintado.id] : null;
  const color = pintado ? colorDeTono(pintado.tono) : COLORS.textMuted;
  const anuncio = visible ? [contenido.texto, contenido.detalle].filter(Boolean).join('. ') : '';
  return (
    <>
      <p role="status" className="sr-only" data-anuncio-estado="">{visible && contenido.rol !== 'alert' ? anuncio : ''}</p>
      <p role="alert" className="sr-only" data-anuncio-alerta="">{visible && contenido.rol === 'alert' ? anuncio : ''}</p>
      <div className="indicador-estado fixed inset-x-0 z-flotante flex justify-center pointer-events-none">
        <Presencia visible={visible} entrada="toastEnter" salida="toastExit" className="pointer-events-auto max-w-full">
          {pintado && (
            <div
              data-estado-sistema={pintado.id}
              className="flex items-center gap-2.5 rounded-2xl pl-3 pr-1.5 py-1.5"
              style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, boxShadow: sombra('flotante'), maxWidth: '24rem' }}
            >
              <CambioDeContenido clave={pintado.id} className="flex items-center gap-2.5 min-w-0 py-0.5">
                {pintado.id === 'guardando'
                  ? <GiroDeCarga size={14} color={color} texto="Guardando…" />
                  : Icono && <Icono size={15} style={{ color }} aria-hidden="true" className="shrink-0" />}
                <span className="min-w-0">
                  <span className="block text-xs font-semibold leading-tight" style={{ color: COLORS.text }}>{pintado.texto}</span>
                  {pintado.detalle && (
                    <span className="block text-[11px] leading-snug mt-0.5" style={{ color: COLORS.textMuted }}>{pintado.detalle}</span>
                  )}
                </span>
              </CambioDeContenido>
              {pintado.accion ? (
                <button
                  type="button"
                  onClick={actuar}
                  aria-busy={ocupado || undefined}
                  className="toque-44 shrink-0 rounded-xl px-2.5 text-xs font-semibold active:scale-95"
                  style={{ color: pintado.tono === 'error' ? COLORS.negative : COLORS.text, background: COLORS.surface2 }}
                >
                  {pintado.accion.texto}
                </button>
              ) : <span className="w-1.5 shrink-0" aria-hidden="true" />}
            </div>
          )}
        </Presencia>
      </div>
    </>
  );
}

/**
 * MS F16, apartado 9 — el esqueleto del arranque no late en silencio para
 * siempre: a los 8 s dice que tarda y deja de latir (`esqueleto-quieto`), a los
 * 20 s ofrece volver a intentarlo. Devuelve el estado de la espera.
 */
export function useEspera() {
  const desde = useRef(Date.now());
  const [, setTic] = useState(0);
  const estado = estadoDeEspera({ desde: desde.current, ahora: Date.now() });
  useEffect(() => {
    if (estado.revisarEn === null) return undefined;
    const reloj = setTimeout(() => setTic((n) => n + 1), estado.revisarEn + 20);
    return () => clearTimeout(reloj);
  });
  return estado;
}

export function AvisoDeEspera({ estado }) {
  if (!estado || estado.id === 'cargando') return null;
  return (
    <div className="vacio-entra mt-4 text-center" data-espera={estado.id}>
      <p className="text-xs" style={{ color: COLORS.textMuted }}>{estado.texto}</p>
      {estado.id === 'reintentar' && (
        <button
          type="button"
          onClick={() => { if (typeof window !== 'undefined') window.location.reload(); }}
          className="toque-44 mt-2 rounded-xl px-4 text-xs font-semibold active:scale-95"
          style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
        >
          Volver a intentar
        </button>
      )}
    </div>
  );
}

/**
 * 🚨 MS F16, apartados 5 y 20 — **si no se pudo cargar NADA, no hay aplicación
 * que enseñar.** Arrancar con todo vacío sería enseñarle una cuenta nueva que
 * no es la suya (y que cualquier toque guardaría encima de la de verdad, si no
 * fuera porque `sincronizacion.js` ya no deja). Se dice qué ha pasado, que sus
 * datos siguen donde estaban, y se vuelve a intentar al pulsar o al volver la
 * conexión.
 */
export function ErrorDeArranque({ onReintentar, accent }) {
  const [intentando, setIntentando] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const vuelve = () => { setIntentando(true); onReintentar(); };
    window.addEventListener('online', vuelve);
    return () => window.removeEventListener('online', vuelve);
  }, [onReintentar]);
  return (
    <div className="min-h-screen px-6 pantalla-segura flex items-center justify-center" style={{ background: COLORS.bg }}>
      <div className="vacio-entra max-w-sm w-full text-center" role="alert" data-arranque="sin-datos">
        <CloudOff size={28} style={{ color: COLORS.textMuted, margin: '0 auto 12px' }} aria-hidden="true" />
        <p className="text-base font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{TEXTOS_ARRANQUE.titulo}</p>
        <p className="text-sm mt-2" style={{ color: COLORS.textMuted }}>{TEXTOS_ARRANQUE.texto}</p>
        <button
          type="button"
          onClick={() => { if (intentando) return; setIntentando(true); onReintentar(); }}
          aria-busy={intentando || undefined}
          className="toque-44 mt-5 w-full rounded-xl px-4 text-sm font-semibold active:scale-[0.98]"
          style={{ background: accent || COLORS.text, color: COLORS.textOnAccent }}
        >
          <TextoDeBoton estado={intentando ? 'cargando' : 'reposo'} textoCargando={TEXTOS_ARRANQUE.reintentando}>
            {TEXTOS_ARRANQUE.reintentar}
          </TextoDeBoton>
        </button>
      </div>
    </div>
  );
}

/**
 * MS F16, apartados 22 y 23 — un estado vacío hecho a mano (una tarjeta propia en
 * vez de `EmptyHint`) con el mismo comportamiento: entra con su pantalla, o, si
 * llega después del contenido, cuando lo de antes ya se ha ido. La lista de al
 * lado se queda montada aunque se vacíe, así que lo último sale con su copia
 * (F10) y lo primero que se cree entra en el sitio del vacío.
 */
export function VacioQueLlega({ children, className = '' }) {
  const ref = useRef(null);
  useVacioQueLlega(ref);
  return <div ref={ref} className={`vacio-entra ${className}`.trim()}>{children}</div>;
}
