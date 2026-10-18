/* ============================================================================
   📎 EL SELECTOR DE FOTOS Y ARCHIVOS — una pieza para toda la aplicación (P1)

   Lo que decide qué se ofrece es `src/lib/seleccionArchivos.js`; esto lo pinta.

   Uso (cada pantalla pone su botón, con su aspecto de siempre):

     <SelectorDeArchivos clase="imagen" maxBytes={10 * MB} onElegir={(files) => …}>
       {({ abrir, ocupado }) => <button onClick={abrir}>Añadir foto</button>}
     </SelectorDeArchivos>

   · Con una sola opción (un documento, o un ordenador sin cámara), tocar el
     botón abre directamente el selector del sistema: un menú de una línea sería
     un paso de más.
   · Con varias, sale una hoja con ellas (la de siempre: portal, `z-capa`, velo
     de `CAPAS`, asa y teclado; su entrada y su salida las pone `useCapasMotion`).
   · La cámara del ordenador abre una ventana con la vista previa; el permiso se
     pide **al pulsar «Hacer una foto»**, nunca antes, y la cámara se apaga al
     cerrar.
   · Lo que no vale se dice debajo del botón, en palabras, y **no llega a
     `onElegir`**. Lo que llega a `onElegir` está elegido, **no guardado**: subirlo
     y decir si ha llegado sigue siendo de cada módulo.

   ⚠️ No importa nada de `ui.jsx` a propósito: `ui.jsx` lo usa (el adjunto de la
   IA), y al revés sería un ciclo.
   =========================================================================== */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Image as ImageIcon, FolderOpen, Video, X, AlertTriangle } from 'lucide-react';
import { COLORS, CAPAS } from '../tokens';
import { AsaHoja } from './gestosMotion';
import { useDialogoAccesible } from './dialogoAccesible';
import {
  opcionesDeSeleccion, detectarPlataforma, validarArchivos, textoDeErrorDeCamara, CLASES_DE_ARCHIVO,
} from '../lib/seleccionArchivos';

const ICONOS = { camara: Camera, fototeca: ImageIcon, archivos: FolderOpen };

function MensajeDeError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="campo-mensaje-entra text-xs mt-1.5 flex items-start gap-1.5" style={{ color: COLORS.negative }}>
      <AlertTriangle size={13} className="flex-shrink-0 mt-px" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/* La hoja con las opciones. Las de `modo: 'input'` pulsan su `<input>` dentro del
   mismo toque (iOS solo abre el selector desde un gesto del usuario). */
function HojaDeOpciones({ titulo, opciones, clase, onOpcion, onCerrar }) {
  const caja = useDialogoAccesible(true, onCerrar);
  return createPortal(
    <div
      className="fixed inset-0 z-capa flex items-end justify-center"
      style={{ background: CAPAS.veloHoja }}
      onClick={onCerrar}
      role="dialog" aria-modal="true" aria-label={titulo}
    >
      <div
        ref={caja} tabIndex={-1}
        className="dialogo-caja w-full max-w-md rounded-t-3xl p-5 space-y-2"
        style={{ background: COLORS.surface, paddingBottom: 'calc(var(--safe-bottom) + 1.25rem)' }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <AsaHoja cajaRef={caja} onCerrar={onCerrar} />
        <div className="flex items-center justify-between gap-3 pb-1">
          <p className="text-base font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{titulo}</p>
          <button onClick={onCerrar} className="p-2 rounded-full flex-shrink-0 toque-44" style={{ background: COLORS.surface2 }} aria-label="Cerrar">
            <X size={16} style={{ color: COLORS.text }} />
          </button>
        </div>
        {opciones.map((o) => {
          const Icono = o.id === 'camara' && clase === 'video' ? Video : (ICONOS[o.id] || FolderOpen);
          return (
            <button
              key={o.id} onClick={() => onOpcion(o)} data-opcion={o.id}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left toque-44 active:scale-[0.98]"
              style={{ background: COLORS.surface2 }}
            >
              <Icono size={18} style={{ color: COLORS.text }} aria-hidden="true" />
              <span className="text-sm font-semibold" style={{ color: COLORS.text }}>{o.etiqueta}</span>
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}

/* La cámara del ordenador. El permiso se pide aquí, al abrirla; la pista se para
   al cerrar, salga como salga. */
export function CamaraWeb({ accent, onFoto, onCerrar }) {
  const caja = useDialogoAccesible(true, onCerrar);
  const video = useRef(null);
  const pista = useRef(null);
  const [estado, setEstado] = useState('abriendo'); // abriendo | lista | error
  const [error, setError] = useState(null);

  useEffect(() => {
    let vivo = true;
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    if (!nav || !nav.mediaDevices || typeof nav.mediaDevices.getUserMedia !== 'function') {
      setEstado('error'); setError(textoDeErrorDeCamara({ name: 'NotFoundError' }));
      return undefined;
    }
    nav.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((s) => {
        if (!vivo) { s.getTracks().forEach((t) => t.stop()); return; }
        pista.current = s;
        if (video.current) { video.current.srcObject = s; video.current.play?.().catch(() => {}); }
        setEstado('lista');
      })
      .catch((e) => { if (vivo) { setEstado('error'); setError(textoDeErrorDeCamara(e)); } });
    return () => {
      vivo = false;
      if (pista.current) pista.current.getTracks().forEach((t) => t.stop());
      pista.current = null;
    };
  }, []);

  const disparar = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const lienzo = document.createElement('canvas');
    lienzo.width = v.videoWidth; lienzo.height = v.videoHeight;
    lienzo.getContext('2d').drawImage(v, 0, 0);
    lienzo.toBlob((blob) => {
      if (!blob) { setEstado('error'); setError('No se ha podido hacer la foto. Vuelve a intentarlo.'); return; }
      const archivo = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
      onFoto(archivo);
    }, 'image/jpeg', 0.9);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-capa flex items-center justify-center px-4"
      style={{ background: CAPAS.veloHoja }}
      onClick={onCerrar}
      role="dialog" aria-modal="true" aria-label="Hacer una foto"
    >
      <div
        ref={caja} tabIndex={-1}
        className="dialogo-caja w-full max-w-md rounded-3xl p-4 space-y-3"
        style={{ background: COLORS.surface }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-base font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>Hacer una foto</p>
          <button onClick={onCerrar} className="p-2 rounded-full toque-44" style={{ background: COLORS.surface2 }} aria-label="Cerrar la cámara">
            <X size={16} style={{ color: COLORS.text }} />
          </button>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ background: CAPAS.escenarioFoto, aspectRatio: '4 / 3' }}>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={video} playsInline muted className="w-full h-full object-cover" aria-label="Vista previa de la cámara" />
        </div>
        {estado === 'abriendo' && <p className="text-xs" style={{ color: COLORS.textMuted }} role="status">Abriendo la cámara…</p>}
        <MensajeDeError id="camara-web-error">{error}</MensajeDeError>
        <button
          onClick={disparar} disabled={estado !== 'lista'}
          className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60 active:scale-95"
          style={{ background: accent, color: COLORS.textOnAccent }}
        >
          <Camera size={16} aria-hidden="true" /> Hacer la foto
        </button>
      </div>
    </div>,
    document.body,
  );
}

/**
 * @param clase        'imagen' | 'video' | 'documento'
 * @param accept       lo que acepta esta función (por defecto, el de su clase)
 * @param multiple     varios a la vez
 * @param maxBytes     tope por archivo (null, sin tope)
 * @param maxArchivos  tope de archivos
 * @param titulo       el de la hoja («Añadir foto»)
 * @param disabled     mientras sube, no se abre
 * @param onElegir     (File[]) => void — solo lo que vale
 * @param plataforma   para las pruebas; si no, la del navegador
 * @param children     ({ abrir, ocupado, idError }) => el botón de la pantalla (opcional)
 * @param controlRef   opcional: recibe `{ click, abrir }`, para las pantallas que ya abrían
 *                     su `<input>` con `ref.current.click()` desde varios botones
 */
export function SelectorDeArchivos({
  clase = 'imagen', accept = null, multiple = false, maxBytes = null, maxArchivos = null,
  titulo = null, disabled = false, onElegir, plataforma = null, mostrarError = true, accent, controlRef = null, children = null,
}) {
  const p = useMemo(() => plataforma || detectarPlataforma(), [plataforma]);
  const opciones = useMemo(() => opcionesDeSeleccion({ clase, accept, plataforma: p }), [clase, accept, p]);
  const entradas = useRef({});
  const [menu, setMenu] = useState(false);
  const [camara, setCamara] = useState(false);
  const [error, setError] = useState(null);
  const idError = useMemo(() => `selector-error-${Math.random().toString(36).slice(2, 8)}`, []);
  const aceptaValidar = accept || (CLASES_DE_ARCHIVO[clase] || {}).accept || '';
  const tituloHoja = titulo || (clase === 'video' ? 'Añadir vídeo' : clase === 'documento' ? 'Añadir archivo' : 'Añadir foto');

  /* ⚠️ Con `mostrarError={false}` el módulo dice él mismo lo que no vale (la foto
     de perfil, el fondo, el álbum): se le entrega todo, porque un archivo que se
     quedara aquí sin decir nada sería un toque que no hace nada. */
  const entregar = (lista) => {
    if (!mostrarError) { if (lista.length && onElegir) onElegir(multiple ? lista : lista.slice(0, 1)); return; }
    const { validos, errores } = validarArchivos(lista, { accept: aceptaValidar, maxBytes, maxArchivos: multiple ? maxArchivos : 1 });
    setError(errores.length ? errores.join(' ') : null);
    if (validos.length && onElegir) onElegir(validos);
  };

  const usar = (o) => {
    setMenu(false);
    if (o.modo === 'camaraWeb') { setCamara(true); return; }
    const el = entradas.current[o.id];
    if (el) el.click();
  };

  const abrir = () => {
    if (disabled) return;
    setError(null);
    if (opciones.length === 1) usar(opciones[0]);
    else setMenu(true);
  };

  if (controlRef) controlRef.current = { click: abrir, abrir };

  return (
    <>
      {typeof children === 'function' ? children({ abrir, ocupado: disabled, idError: error ? idError : undefined }) : null}
      {opciones.filter((o) => o.modo === 'input').map((o) => (
        <input
          key={o.id}
          ref={(el) => { entradas.current[o.id] = el; }}
          type="file" accept={o.accept || undefined} capture={o.capture || undefined}
          multiple={multiple && o.id !== 'camara'} disabled={disabled}
          className="hidden" aria-hidden="true" tabIndex={-1} data-selector-opcion={o.id}
          onChange={(ev) => { const l = [...(ev.target.files || [])]; ev.target.value = ''; if (l.length) entregar(l); }}
        />
      ))}
      {mostrarError && <MensajeDeError id={idError}>{error}</MensajeDeError>}
      {menu && <HojaDeOpciones titulo={tituloHoja} opciones={opciones} clase={clase} onOpcion={usar} onCerrar={() => setMenu(false)} />}
      {camara && <CamaraWeb accent={accent} onFoto={(f) => { setCamara(false); entregar([f]); }} onCerrar={() => setCamara(false)} />}
    </>
  );
}
