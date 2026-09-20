/* ===========================================================================
   ENTREGA 4 · FASE 27/45 — EL COMPARADOR

   🚨 **NO DUPLICA `ProgressPhotoViewer`** (apartado 27): el visor de una foto
   es de la F26 y se queda ahí. Esto es otra pantalla, con otra pregunta —*"¿en
   qué se diferencian estos dos momentos?"*—. Y la tira de fechas tampoco se
   escribe otra vez: **se muda** desde la F26, donde se quedaba sin usuario.

   ⚠️ **Y NO GUARDA NADA** (apartados 18 y 29): todo lo que se toca aquí —el
   modo, el divisor, el zoom, la alineación— vive en el estado de la pantalla y
   se va al cerrar. Lo que persiste son las fotos, y de eso se encarga la F26.
   =========================================================================== */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Camera, ArrowLeftRight, Columns2, SlidersHorizontal,
  ZoomIn, ZoomOut, Maximize2, AlignVerticalJustifyStart, AlignVerticalJustifyCenter,
} from 'lucide-react';
import { COLORS } from '../tokens';
import { Card, PrimaryButton } from './ui';
import {
  MODOS_COMPARACION, ALINEACIONES, SLIDER_MIN, SLIDER_MAX, SLIDER_PASO, SLIDER_PASO_GRANDE,
  ARIA_SLIDER, posicionSlider, moverSlider,
  ZOOM_PASO, VOLVER_A_ESCALA, ACERCAR, ALEJAR,
  crearZoomDeLados, aplicarZoom, moverZoom, reiniciarZoom, hayZoom,
  puedeAcercar, puedeAlejar, textoDeZoom, limiteDesplazamiento,
  VACIO_COMPARADOR, ELEGIR_OTRA, ERROR_DE_ESTE_LADO,
  CAMBIAR_FOTO, CERRAR_COMPARADOR, INVERTIR, PROPORCION_CAJA,
  TOUCH_ACTION_LADO, TOUCH_ACTION_DIVISOR, disposicionDeAncho, seleccionDesdeFoto,
} from '../lib/comparadorFotos';

const ICONOS_MODO = { lado: Columns2, deslizar: SlidersHorizontal };
const ICONOS_ALINEACION = { centro: AlignVerticalJustifyCenter, arriba: AlignVerticalJustifyStart };

/* ═══ Apartado 23 · Cuando todavía no hay dos fotos ════════════════════════ */
export function ComparisonEmpty({ accent, onAnadir = null }) {
  return (
    <Card>
      <div className="text-center py-6 px-3">
        <Camera size={28} style={{ color: COLORS.textMuted }} aria-hidden="true" className="mx-auto mb-3" />
        <p className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>{VACIO_COMPARADOR.titulo}</p>
        {onAnadir && (
          <PrimaryButton onClick={onAnadir} accent={accent}>{VACIO_COMPARADOR.cta}</PrimaryButton>
        )}
      </div>
    </Card>
  );
}

/* ═══ La tira de fechas ════════════════════════════════════════════════════
   ⚠️ **SE MUDA DESDE LA F26, NO SE DUPLICA** (E3 F17, `crearLibro`). Nació en
   `fotosProgreso.jsx` para el bloque de comparación que aquella fase pintaba
   dentro de la galería; al retirarse ese bloque, su **único** usuario pasa a
   ser este comparador, así que viene aquí.
   🚨 **Y viene, no se importa**: `fotosProgreso.jsx` tiene que importar este
   archivo para abrir el comparador, e importar el selector de vuelta sería un
   ciclo entre los dos — que es lo que la FIT F24 ya se encontró con el hub de
   clasificación. Una sola dirección: la galería llama al comparador. */
export function ProgressPhotoDateSelector({ opciones = [], elegida, urls = {}, etiqueta, onElegir }) {
  return (
    <div>
      <p className="text-[11px] font-semibold mb-1.5" style={{ color: COLORS.textMuted }}>{etiqueta}</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {opciones.map((o) => {
          const puesta = o.id === elegida;
          return (
            <button
              key={o.id}
              onClick={() => onElegir(o.id)}
              aria-pressed={puesta}
              aria-label={`${etiqueta}: ${o.etiqueta}`}
              className="shrink-0 rounded-xl overflow-hidden toque-44"
              style={{ border: `2px solid ${puesta ? COLORS.text : COLORS.border}`, width: 64 }}
            >
              {urls[o.id]
                ? <img src={urls[o.id]} alt="" className="w-16 h-16 object-cover" />
                : <div className="w-16 h-16 esqueleto" />}
              <span className="block text-[9px] py-1" style={{ color: COLORS.textMuted }}>{o.etiqueta}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══ Apartados 3 y 17 · Elegir y cambiar ══════════════════════════════════
   ⚠️ Lo único que pone esta fase sobre la tira es **qué lado se está
   eligiendo** y que la foto del otro lado no salga (apartado 3). */
export function ComparisonSelector({ pantalla, urls = {}, onElegir }) {
  const { paso, opcionesAntes, opcionesDespues, antesId, despuesId } = pantalla;
  return (
    <Card>
      {/* Apartado 3 mientras falta una; apartado 17 cuando ya están las dos y
          lo que se ofrece es cambiarlas sin salir del flujo. */}
      <p className="text-sm font-bold mb-3" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
        {paso ? paso.titulo : CAMBIAR_FOTO}
      </p>
      <div className="space-y-3">
        <ProgressPhotoDateSelector
          opciones={opcionesAntes}
          elegida={antesId}
          urls={urls}
          etiqueta="Inicial"
          onElegir={(id) => onElegir('antes', id)}
        />
        <ProgressPhotoDateSelector
          opciones={opcionesDespues}
          elegida={despuesId}
          urls={urls}
          etiqueta="Final"
          onElegir={(id) => onElegir('despues', id)}
        />
      </div>
    </Card>
  );
}

/* ═══ Apartados 5 y 16 · La ficha de cada lado ═════════════════════════════ */
export function ComparisonMeta({ meta, claro = false }) {
  if (!meta) return null;
  const principal = claro ? '#fff' : COLORS.text;
  const suave = claro ? 'rgba(255,255,255,0.68)' : COLORS.textMuted;
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: suave }}>{meta.rotulo}</p>
      <p className="text-xs font-semibold truncate" style={{ color: principal }}>{meta.etiqueta}</p>
      {meta.orientacion && (
        <p className="text-[10px]" style={{ color: suave }}>{meta.orientacion}</p>
      )}
      {/* Apartado 16 — *"No ocupar demasiado espacio"*: dos líneas como mucho. */}
      {meta.nota && (
        <p className="text-[10px] line-clamp-2" style={{ color: suave }}>{meta.nota}</p>
      )}
    </div>
  );
}

/* ═══ Apartados 10, 11 y 25 · Una imagen ═══════════════════════════════════
   🚨 `object-contain` (apartado 11): con proporciones distintas se adapta,
   **nunca se estira**. Y el zoom es de ESTA imagen (apartado 10). */
export function ComparisonImage({ lado, url, zoom: z = null, alineacion: ali, onMover = null, alto = null, onFallo = null }) {
  const arrastre = useRef(null);
  const zoom = z && typeof z === 'object' ? z : { escala: 1, x: 0, y: 0 };
  const ampliada = hayZoom(zoom);

  const empezar = (ev) => {
    if (!ampliada || !onMover) return;
    const t = ev.touches ? ev.touches[0] : ev;
    arrastre.current = { x: t.clientX, y: t.clientY };
  };
  const mover = (ev) => {
    if (!arrastre.current || !onMover) return;
    const t = ev.touches ? ev.touches[0] : ev;
    const caja = ev.currentTarget.getBoundingClientRect();
    if (!caja.width || !caja.height) return;
    const dx = ((t.clientX - arrastre.current.x) / caja.width) * 100;
    const dy = ((t.clientY - arrastre.current.y) / caja.height) * 100;
    arrastre.current = { x: t.clientX, y: t.clientY };
    onMover(dx, dy);
  };
  const soltar = () => { arrastre.current = null; };

  const lim = limiteDesplazamiento(zoom.escala);
  return (
    <div
      className="w-full overflow-hidden rounded-xl"
      style={{
        background: COLORS.surface2,
        border: `1px solid ${COLORS.border}`,
        aspectRatio: alto ? undefined : PROPORCION_CAJA,
        height: alto || undefined,
        /* Apartado 22 — el scroll vertical de la página se respeta. */
        touchAction: ampliada ? 'none' : TOUCH_ACTION_LADO,
      }}
      onPointerDown={empezar}
      onPointerMove={mover}
      onPointerUp={soltar}
      onPointerLeave={soltar}
    >
      {lado.fallida ? (
        /* 🚨 Apartado 25 — el error es SOLO de esta foto; la otra sigue. */
        <div className="w-full h-full flex items-center justify-center p-3">
          <p className="text-[11px] text-center" style={{ color: COLORS.textMuted }}>{ERROR_DE_ESTE_LADO}</p>
        </div>
      ) : url ? (
        <img
          src={url}
          alt={`${lado.aria}: ${lado.etiqueta}`}
          className="w-full h-full object-contain"
          draggable={false}
          /* Apartado 25 — el placeholder es SOLO de esta foto. */
          onError={onFallo ? () => onFallo(lado.foto.id) : undefined}
          style={{
            objectPosition: ali.css,
            transform: `translate(${Math.min(lim, Math.max(-lim, zoom.x))}%, ${Math.min(lim, Math.max(-lim, zoom.y))}%) scale(${zoom.escala})`,
            /* ⚠️ Con el zoom puesto, **sin transición**: arrastrar tiene que ir
               pegado al dedo. La animación es solo para el salto de escala. */
            transition: ampliada ? 'none' : 'transform 160ms ease-out',
          }}
        />
      ) : (
        <div className="w-full h-full esqueleto" />
      )}
    </div>
  );
}

/* ═══ Apartado 10 · El zoom de UN lado ═════════════════════════════════════
   🚨 *"mantener ambas imágenes independientes"*: estos botones son de esta
   foto. Y **un botón que no haría nada se apaga** en vez de estar ahí para no
   responder (regla 8): al máximo no se puede acercar más, y a escala normal no
   hay de dónde volver. */
export function ComparisonZoom({ zoom, aria, onZoom }) {
  const boton = (accion, Icono, etiqueta, activo) => (
    <button
      onClick={() => onZoom(accion)}
      disabled={!activo}
      aria-label={`${etiqueta}: ${aria}`}
      className="rounded-lg p-1.5 toque-44"
      style={{ background: COLORS.surface2, color: COLORS.textMuted, opacity: activo ? 1 : 0.35 }}
    >
      <Icono size={13} aria-hidden="true" />
    </button>
  );
  return (
    <div className="shrink-0 flex items-center gap-1">
      {textoDeZoom(zoom) && (
        <span className="text-[10px] font-semibold tabular-nums" style={{ color: COLORS.textMuted }}>{textoDeZoom(zoom)}</span>
      )}
      {boton('menos', ZoomOut, ALEJAR, puedeAlejar(zoom))}
      {boton('mas', ZoomIn, ACERCAR, puedeAcercar(zoom))}
      {hayZoom(zoom) && boton('reiniciar', Maximize2, VOLVER_A_ESCALA, true)}
    </div>
  );
}

/* ═══ Apartados 6 y 7 · Lado a lado ════════════════════════════════════════ */
export function ComparisonSideBySide({ pantalla, urls = {}, onZoom = null, onMover = null, onFallo = null }) {
  const enFila = pantalla.disposicion === 'fila';
  return (
    <div className={enFila ? 'flex gap-3' : 'space-y-3'}>
      {pantalla.lados.map((lado) => (
        <div key={lado.foto.id} className="flex-1 min-w-0">
          <ComparisonImage
            lado={lado}
            url={urls[lado.foto.id]}
            zoom={pantalla.zoom[lado.papel]}
            alineacion={pantalla.alineacion}
            onMover={onMover ? (dx, dy) => onMover(lado.papel, dx, dy) : null}
            onFallo={onFallo}
          />
          <div className="mt-1.5 flex items-start justify-between gap-2">
            <ComparisonMeta meta={lado.meta} />
            {onZoom && <ComparisonZoom zoom={pantalla.zoom[lado.papel]} aria={lado.aria} onZoom={(a) => onZoom(lado.papel, a)} />}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══ Apartado 8 · El divisor ══════════════════════════════════════════════
   🚨 *"Debe ser una herramienta de comparación visual, no un efecto
   decorativo"*: llega a los dos extremos, se arrastra con el dedo **y se mueve
   con el teclado** (apartado 21). */
export function ComparisonSlider({ pantalla, urls = {}, onSlider, onFallo = null }) {
  const caja = useRef(null);
  const arrastrando = useRef(false);
  const [izquierda, derecha] = pantalla.lados || [];

  const desdeEvento = useCallback((ev) => {
    if (!caja.current) return;
    const r = caja.current.getBoundingClientRect();
    if (!r.width) return;
    const t = ev.touches ? ev.touches[0] : ev;
    onSlider(posicionSlider(((t.clientX - r.left) / r.width) * 100));
  }, [onSlider]);

  const teclado = (ev) => {
    const paso = ev.shiftKey ? SLIDER_PASO_GRANDE : SLIDER_PASO;
    if (ev.key === 'ArrowLeft') { ev.preventDefault(); onSlider(moverSlider(pantalla.slider, -paso)); }
    if (ev.key === 'ArrowRight') { ev.preventDefault(); onSlider(moverSlider(pantalla.slider, paso)); }
    if (ev.key === 'Home') { ev.preventDefault(); onSlider(SLIDER_MIN); }
    if (ev.key === 'End') { ev.preventDefault(); onSlider(SLIDER_MAX); }
  };

  /* ⚠️ Sin los dos lados no hay nada que superponer. No debería pasar —lo
     filtra `ComparisonViewport`—, pero un divisor sin foto detrás reventaría
     la pantalla entera del comparador. */
  if (!izquierda || !derecha) return null;

  const imagen = (lado) => (lado.fallida ? (
    <div className="w-full h-full flex items-center justify-center p-3" style={{ background: COLORS.surface2 }}>
      <p className="text-[11px] text-center" style={{ color: COLORS.textMuted }}>{ERROR_DE_ESTE_LADO}</p>
    </div>
  ) : urls[lado.foto.id] ? (
    <img
      src={urls[lado.foto.id]}
      alt={`${lado.aria}: ${lado.etiqueta}`}
      className="w-full h-full object-contain"
      draggable={false}
      onError={onFallo ? () => onFallo(lado.foto.id) : undefined}
      style={{ objectPosition: pantalla.alineacion.css }}
    />
  ) : (
    <div className="w-full h-full esqueleto" />
  ));

  return (
    <div>
      <div
        ref={caja}
        className="relative w-full overflow-hidden rounded-xl select-none"
        style={{
          aspectRatio: PROPORCION_CAJA,
          background: COLORS.surface2,
          border: `1px solid ${COLORS.border}`,
          touchAction: TOUCH_ACTION_DIVISOR,
        }}
        onPointerDown={(ev) => { arrastrando.current = true; desdeEvento(ev); }}
        onPointerMove={(ev) => { if (arrastrando.current) desdeEvento(ev); }}
        onPointerUp={() => { arrastrando.current = false; }}
        onPointerLeave={() => { arrastrando.current = false; }}
      >
        <div className="absolute inset-0">{imagen(derecha)}</div>
        {/* La de la izquierda, recortada hasta el divisor. */}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pantalla.slider}% 0 0)` }}>
          {imagen(izquierda)}
        </div>

        <div
          role="slider"
          tabIndex={0}
          aria-label={ARIA_SLIDER}
          aria-valuemin={SLIDER_MIN}
          aria-valuemax={SLIDER_MAX}
          aria-valuenow={pantalla.slider}
          aria-valuetext={`${pantalla.slider}% ${izquierda.rotulo}`}
          onKeyDown={teclado}
          className="absolute top-0 bottom-0 flex items-center justify-center toque-44"
          style={{ left: `${pantalla.slider}%`, width: 44, marginLeft: -22, cursor: 'ew-resize' }}
        >
          <div style={{ width: 2, height: '100%', background: '#fff', opacity: 0.9 }} />
          <div
            className="absolute rounded-full flex items-center justify-center"
            style={{ width: 32, height: 32, background: '#fff' }}
          >
            <ArrowLeftRight size={15} style={{ color: '#111' }} aria-hidden="true" />
          </div>
        </div>

        {/* Apartado 21 — cada lado se nombra, para no depender de la posición. */}
        <span className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}>
          {izquierda.rotulo}
        </span>
        <span className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}>
          {derecha.rotulo}
        </span>
      </div>

      <div className="mt-1.5 flex items-start justify-between gap-3">
        <ComparisonMeta meta={izquierda.meta} />
        <div className="text-right"><ComparisonMeta meta={derecha.meta} /></div>
      </div>
    </div>
  );
}

/* ═══ Apartado 9 · Los controles ═══════════════════════════════════════════ */
export function ComparisonControls({ pantalla, onModo, onAlineacion, onInvertir, onZoom = null }) {
  const pastilla = (puesto) => ({
    background: puesto ? COLORS.text : COLORS.surface2,
    color: puesto ? COLORS.bg : COLORS.textMuted,
  });
  const ampliada = hayZoom(pantalla.zoom.antes) || hayZoom(pantalla.zoom.despues);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {MODOS_COMPARACION.map((m) => {
          const Icono = ICONOS_MODO[m.id];
          return (
            <button
              key={m.id}
              onClick={() => onModo(m.id)}
              aria-pressed={pantalla.modo.id === m.id}
              aria-label={`Modo ${m.nombre}`}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold toque-44"
              style={pastilla(pantalla.modo.id === m.id)}
            >
              <Icono size={13} aria-hidden="true" />
              {m.nombre}
            </button>
          );
        })}
        <button
          onClick={onInvertir}
          aria-label={INVERTIR}
          aria-pressed={pantalla.invertida}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold toque-44"
          style={pastilla(pantalla.invertida)}
        >
          <ArrowLeftRight size={13} aria-hidden="true" />
          {INVERTIR}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {ALINEACIONES.map((a) => {
          const Icono = ICONOS_ALINEACION[a.id];
          return (
            <button
              key={a.id}
              onClick={() => onAlineacion(a.id)}
              aria-pressed={pantalla.alineacion.id === a.id}
              aria-label={`Alinear: ${a.nombre}`}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold toque-44"
              style={pastilla(pantalla.alineacion.id === a.id)}
            >
              <Icono size={13} aria-hidden="true" />
              {a.nombre}
            </button>
          );
        })}
        {/* Apartado 10 — *"botón claro para volver a escala normal"*, y solo
            cuando hay algo que deshacer (regla 8). */}
        {ampliada && onZoom && (
          <button
            onClick={() => onZoom('ambos', 'reiniciar')}
            aria-label={VOLVER_A_ESCALA}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold toque-44"
            style={pastilla(false)}
          >
            <Maximize2 size={13} aria-hidden="true" />
            {VOLVER_A_ESCALA}
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══ Apartados 6, 7 y 8 · Lo que se ve, según el modo ═════════════════════ */
export function ComparisonViewport({ pantalla, urls = {}, onSlider, onZoom = null, onMover = null, onFallo = null }) {
  if (!pantalla.hay) return null;
  return pantalla.modo.id === 'deslizar'
    ? <ComparisonSlider pantalla={pantalla} urls={urls} onSlider={onSlider} onFallo={onFallo} />
    : <ComparisonSideBySide pantalla={pantalla} urls={urls} onZoom={onZoom} onMover={onMover} onFallo={onFallo} />;
}

/* ═══ Apartados 1, 2 y 26 · El comparador entero ═══════════════════════════
   ⚠️ **A pantalla completa y por portal** (regla 3): un `fixed inset-0` sin
   `createPortal` se ancla al contenedor de `.module-enter` y aparece abajo del
   todo — es un fallo real ya corregido en este proyecto. */
export function ProgressComparison({
  pantalla, urls = {}, accent,
  onElegir, onModo, onAlineacion, onInvertir, onSlider, onZoom, onMover,
  onCerrar, onAnadir = null, onFalloFoto = null,
}) {
  const [ancho, setAncho] = useState(null);
  const marco = useRef(null);

  /* Apartado 7 — quien decide si caben los dos es **el ancho medido**, no una
     media query a ojo: dentro de un portal la caja no es la de la ventana. */
  useEffect(() => {
    const medir = () => { if (marco.current) setAncho(marco.current.clientWidth); };
    medir();
    if (typeof window === 'undefined') return undefined;
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [pantalla.modo.id]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: COLORS.bg }}
      role="dialog"
      aria-modal="true"
      aria-label="Comparar dos fotos de progreso"
    >
      <div
        className="flex items-center justify-between gap-2 px-4 py-3 shrink-0"
        style={{ paddingTop: 'calc(var(--safe-top) + 0.75rem)', borderBottom: `1px solid ${COLORS.border}` }}
      >
        <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>Comparar</p>
        <button
          onClick={onCerrar}
          aria-label={CERRAR_COMPARADOR}
          className="rounded-full p-2 toque-44"
          style={{ background: COLORS.surface2 }}
        >
          <X size={18} style={{ color: COLORS.text }} />
        </button>
      </div>

      <div
        ref={marco}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3"
        style={{ paddingBottom: 'calc(var(--safe-bottom) + 1rem)' }}
      >
        {pantalla.estado === 'sin_fotos' ? (
          <ComparisonEmpty accent={accent} onAnadir={onAnadir} />
        ) : (
          <>
            {/* 🚨 Apartado 24 — una foto que ya no está se dice y se ofrece otra,
                en vez de dejar media comparación pintada. */}
            {pantalla.aviso && (
              <Card>
                <p className="text-xs mb-2" style={{ color: COLORS.text }}>{pantalla.aviso}</p>
                <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{ELEGIR_OTRA}</p>
              </Card>
            )}

            {pantalla.hay && (
              <>
                <ComparisonControls
                  pantalla={pantalla}
                  onModo={onModo}
                  onAlineacion={onAlineacion}
                  onInvertir={onInvertir}
                  onZoom={onZoom}
                />
                <ComparisonViewport
                  pantalla={ancho == null ? pantalla : {
                    ...pantalla,
                    /* ⚠️ El corte lo decide la librería, **nunca un número
                       escrito a ojo aquí**: así hay un solo sitio que sabe
                       cuándo dos mitades dejan de caber (apartado 7). */
                    ...disposicionDeAncho(ancho, pantalla.modo.id),
                  }}
                  urls={urls}
                  onSlider={onSlider}
                  onZoom={onZoom}
                  onMover={onMover}
                  onFallo={onFalloFoto}
                />
                {/* 🚨 Apartado 14 — lo ÚNICO que se afirma es el tiempo entre las
                    dos, y el encuadre solo si las dos lo tienen etiquetado. */}
                <Card>
                  <p className="text-xs text-center font-semibold" style={{ color: COLORS.text }}>
                    {pantalla.comparacion.texto}
                  </p>
                  {pantalla.encuadre && pantalla.encuadre.texto && (
                    <p className="text-[11px] text-center mt-1" style={{ color: COLORS.textMuted }}>
                      {pantalla.encuadre.texto}
                    </p>
                  )}
                  {pantalla.encuadre && pantalla.encuadre.aviso && (
                    <p className="text-[11px] text-center mt-1" style={{ color: COLORS.textMuted }}>
                      {pantalla.encuadre.aviso}
                    </p>
                  )}
                </Card>
              </>
            )}

            {/* Apartado 17 — cambiar las fotos **sin salir del flujo**. */}
            <ComparisonSelector pantalla={pantalla} urls={urls} onElegir={onElegir} />
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* ═══ El estado de la pantalla (apartados 28 y 29) ═════════════════════════
   ⚠️ Todo junto, en un solo sitio, y **nada se guarda**: al cerrar desaparece.
   Es `viendo` de EH F40 otra vez — dónde está el dedo no es un dato. */
export function useComparador(fotos, inicial = {}) {
  const [antesId, setAntesId] = useState(inicial.antesId || null);
  const [despuesId, setDespuesId] = useState(inicial.despuesId || null);
  const [modo, setModo] = useState('lado');
  const [alineacion, setAlineacion] = useState('centro');
  const [slider, setSlider] = useState(50);
  const [invertida, setInvertida] = useState(false);
  const [zoom, setZoom] = useState(crearZoomDeLados);

  const elegir = useCallback((lado, id) => {
    if (lado === 'antes') setAntesId(id); else setDespuesId(id);
  }, []);

  /* Apartado 2 — entrar desde el detalle de una foto: ésa se queda puesta en el
     lado que le toca **por su fecha**, y solo falta elegir la otra. */
  const desdeFoto = useCallback((id) => {
    const s = seleccionDesdeFoto(fotos, id);
    setAntesId(s.antesId);
    setDespuesId(s.despuesId);
  }, [fotos]);

  const cambiarZoom = useCallback((lado, accion) => {
    setZoom((z) => {
      const uno = (v) => (accion === 'reiniciar' ? reiniciarZoom()
        : aplicarZoom(v, accion === 'menos' ? -ZOOM_PASO : ZOOM_PASO));
      if (lado === 'ambos') return { antes: uno(z.antes), despues: uno(z.despues) };
      return { ...z, [lado]: uno(z[lado]) };
    });
  }, []);

  const mover = useCallback((lado, dx, dy) => {
    setZoom((z) => ({ ...z, [lado]: moverZoom(z[lado], dx, dy) }));
  }, []);

  return {
    estado: { antesId, despuesId, modo, alineacion, slider, invertida, zoom },
    elegir,
    desdeFoto,
    setModo,
    setAlineacion,
    setSlider: (v) => setSlider(posicionSlider(v)),
    invertir: () => setInvertida((v) => !v),
    cambiarZoom,
    mover,
  };
}
